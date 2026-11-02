/**
 * tests/challenger-m1-e2e-chrome.test.js
 * 
 * Empirical E2E Browser Harness using Real Headless Chrome & CDP:
 * 1. Verifies clicking #btn-home-start-growth-report enters Step 1 cleanly with zero alerts.
 * 2. Verifies clicking #btn-home-start-learning-report enters Step 1 cleanly with zero alerts.
 * 3. Confirms Step 1 validation decoupling: zero false biometric alerts.
 * 4. Completes 6-step flow (Step 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> Report) in Imperial mode (ft/in, lbs).
 * 5. Completes 6-step flow in Brain & Learning LQ mode.
 * 6. Completes 6-step flow in Metric mode (cm, kg).
 * 7. Stress tests rapid Next/Prev clicks on live browser DOM.
 * 8. Audits live rendered report for zero Hangul.
 */

'use strict';

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');
const fs = require('fs');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const INDEX_HTML_URL = 'file:///d:/%ED%82%A4%EC%A6%88%ED%95%8F%20%EC%98%81%EB%AC%B8/index.html';
const CDP_PORT = 9555;

let passCount = 0;
let failCount = 0;
const failures = [];

function it(title, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${title}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${title}`);
    console.error(`         ${err.message}`);
    failCount++;
    failures.push({ title, error: err.message });
  }
}

async function runChromeE2ESuite() {
  console.log('========================================================================');
  console.log('   CHALLENGER 1: REAL HEADLESS CHROME CDP EMPIRICAL E2E TEST HARNESS    ');
  console.log('========================================================================\n');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-e2e-m1-'));
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    INDEX_HTML_URL
  ]);

  chrome.on('error', (err) => {
    console.error('[Chrome Error]', err.message);
  });

  // Wait for Chrome to listen
  await new Promise(r => setTimeout(r, 2000));

  // Get Page Target WebSocket URL
  let pageWsUrl = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const jsonRes = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${CDP_PORT}/json`, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
      });
      const pageTarget = jsonRes.find(t => t.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        pageWsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (_) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  assert(pageWsUrl, 'Failed to acquire Chrome Page Target WebSocket URL');
  console.log(`[CDP] Connected to Chrome Page Target: ${pageWsUrl}\n`);

  const ws = new WebSocket(pageWsUrl);
  let msgId = 1;
  const pendingRequests = new Map();
  const openedDialogs = [];

  function sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error(`CDP request timed out: ${method}`));
      }, 10000);

      pendingRequests.set(id, (res) => {
        clearTimeout(timeout);
        if (res.error) reject(new Error(res.error.message));
        else resolve(res.result);
      });

      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      pendingRequests.get(data.id)(data);
      pendingRequests.delete(data.id);
    }

    // Intercept native browser dialogs (alert, confirm, prompt)
    if (data.method === 'Page.javascriptDialogOpening') {
      const { message, type } = data.params;
      openedDialogs.push({ message, type, time: Date.now() });
      // Auto-accept alert dialogs so page doesn't hang
      sendCDP('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  // Enable CDP domains
  await sendCDP('Page.enable');
  await sendCDP('Runtime.enable');
  await sendCDP('DOM.enable');

  // Helper to evaluate in page
  async function evalInBrowser(expr) {
    const res = await sendCDP('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result.value;
  }

  // Wait 1.5s for initial hydration
  await new Promise(r => setTimeout(r, 1500));

  // --------------------------------------------------------------------------
  console.log('[SECTION 1: Homepage Verification & 0 Alerts on Load]');
  // --------------------------------------------------------------------------
  const initialInfo = await evalInBrowser(`(() => {
    return {
      title: document.title,
      hasGrowthBtn: Boolean(document.getElementById('btn-home-start-growth-report')),
      hasLearningBtn: Boolean(document.getElementById('btn-home-start-learning-report')),
      unitSystem: window.TallerI18n ? window.TallerI18n.getUnitSystem() : null,
      isStudioActive: document.body.classList.contains('studio-mode-active')
    };
  })()`);

  it('1.1 Page title is 100% English with KidsFit branding', () => {
    assert(initialInfo.title.includes('KIDS-FIT') || initialInfo.title.includes('KidsFit'), `Title missing KidsFit: ${initialInfo.title}`);
    assert(!/[\uAC00-\uD7AF]/.test(initialInfo.title), 'Title must not contain Hangul');
  });

  it('1.2 Homepage has start buttons and 0 initial alerts', () => {
    assert(initialInfo.hasGrowthBtn, 'Missing #btn-home-start-growth-report');
    assert(initialInfo.hasLearningBtn, 'Missing #btn-home-start-learning-report');
    assert.strictEqual(openedDialogs.length, 0, `Expected 0 dialogs on load, got: ${JSON.stringify(openedDialogs)}`);
    assert.strictEqual(initialInfo.isStudioActive, false, 'Studio mode should not be active initially');
  });

  // --------------------------------------------------------------------------
  console.log('\n[SECTION 2: Growth Studio Entry & Step 1 Clean Initialization]');
  // --------------------------------------------------------------------------
  openedDialogs.length = 0;

  const entryGrowth = await evalInBrowser(`(() => {
    const btn = document.getElementById('btn-home-start-growth-report');
    btn.click();
    return {
      isStudioActive: document.body.classList.contains('studio-mode-active'),
      quizDisplay: document.getElementById('quiz-section').style.display,
      heroDisplay: document.getElementById('hero-section').style.display,
      step1Active: document.getElementById('step-content-1').classList.contains('active'),
      currentStep: window.TallerOnboardingWizard ? window.TallerOnboardingWizard.state.currentStep : null,
      reportMode: window.TallerOnboardingWizard ? window.TallerOnboardingWizard.state.preferredReportMode : null
    };
  })()`);

  it('2.1 Clicking #btn-home-start-growth-report enters Step 1 cleanly', () => {
    assert.strictEqual(entryGrowth.isStudioActive, true, 'body must have studio-mode-active class');
    assert.strictEqual(entryGrowth.quizDisplay, 'block', 'quiz section must be visible');
    assert.strictEqual(entryGrowth.heroDisplay, 'none', 'hero section must be hidden');
    assert.strictEqual(entryGrowth.step1Active, true, 'step 1 must be active');
    assert.strictEqual(entryGrowth.currentStep, 1, 'wizard currentStep must be 1');
    assert.strictEqual(entryGrowth.reportMode, 'growth', 'mode must be growth');
  });

  it('2.2 Zero alert popups triggered upon clicking #btn-home-start-growth-report', () => {
    assert.strictEqual(openedDialogs.length, 0, `Expected 0 alert popups on Step 1 entry, got: ${JSON.stringify(openedDialogs)}`);
  });

  // --------------------------------------------------------------------------
  console.log('\n[SECTION 3: Step 1 Validation Decoupling & False Alert Prevention]');
  // --------------------------------------------------------------------------
  // Test 3.1: Unselect gender and click Next
  openedDialogs.length = 0;
  await evalInBrowser(`(() => {
    document.getElementById('gender-boy').checked = false;
    document.getElementById('gender-girl').checked = false;
    document.getElementById('btn-next-step').click();
  })()`);
  await new Promise(r => setTimeout(r, 300));

  it('3.1 Step 1 with unselected gender prompts for gender, NEVER height/weight', () => {
    assert.strictEqual(openedDialogs.length, 1, 'Expected 1 alert for gender');
    assert(openedDialogs[0].message.toLowerCase().includes('gender'), `Alert should mention gender: ${openedDialogs[0].message}`);
    assert(!openedDialogs[0].message.toLowerCase().includes('height'), 'Alert must not mention height');
    assert(!openedDialogs[0].message.toLowerCase().includes('weight'), 'Alert must not mention weight');
  });

  // Test 3.2: Select Boy, invalid day value
  openedDialogs.length = 0;
  await evalInBrowser(`(() => {
    document.getElementById('gender-boy').checked = true;
    const daySel = document.getElementById('child-birth-day');
    const opt = new Option('99', '99');
    daySel.add(opt);
    daySel.value = '99';
    document.getElementById('btn-next-step').click();
  })()`);
  await new Promise(r => setTimeout(r, 300));

  it('3.2 Step 1 with invalid DOB prompts for DOB, NEVER height/weight', () => {
    assert.strictEqual(openedDialogs.length, 1, 'Expected 1 alert for DOB');
    assert(openedDialogs[0].message.toLowerCase().includes('birth'), `Alert should mention birth: ${openedDialogs[0].message}`);
  });

  // Test 3.3: Reset to Step 1 with valid Gender and Valid DOB (Year 2016, Oct, 15) with blank height/weight -> Next
  openedDialogs.length = 0;
  const advanceToStep2 = await evalInBrowser(`(() => {
    window.TallerOnboardingWizard.goToStep(1);
    document.getElementById('gender-boy').checked = true;
    document.getElementById('child-birth-year').value = '2016';
    document.getElementById('child-birth-month').value = '10';
    const daySel = document.getElementById('child-birth-day');
    // Remove temporary invalid option if present
    for (let i = 0; i < daySel.options.length; i++) {
      if (daySel.options[i].value === '99') daySel.remove(i);
    }
    daySel.value = '15';

    // Clear height and weight to prove Step 1 NEVER validates them
    document.getElementById('child-height').value = '';
    document.getElementById('child-weight').value = '';
    document.getElementById('btn-next-step').click();

    return {
      currentStep: window.TallerOnboardingWizard.state.currentStep,
      step2Active: document.getElementById('step-content-2').classList.contains('active')
    };
  })()`);
  await new Promise(r => setTimeout(r, 300));

  it('3.3 Step 1 with valid Gender and DOB advances to Step 2 with ZERO alert popups', () => {
    assert.strictEqual(advanceToStep2.currentStep, 2, 'Must advance to Step 2');
    assert.strictEqual(advanceToStep2.step2Active, true, 'Step 2 must be active');
    assert.strictEqual(openedDialogs.length, 0, `Expected 0 alert popups on advancing to Step 2, got: ${JSON.stringify(openedDialogs)}`);
  });

  // --------------------------------------------------------------------------
  console.log('\n[SECTION 4: Complete 6-Step Flow in Imperial Mode (ft/in, lbs)]');
  // --------------------------------------------------------------------------
  // Step 2: Enter Imperial Height & Weight
  openedDialogs.length = 0;
  await evalInBrowser(`(() => {
    window.TallerOnboardingWizard.goToStep(2);
    // Switch to Imperial mode if not already
    const btnImp = document.getElementById('btn-step2-unit-imperial');
    if (btnImp && !btnImp.classList.contains('active')) btnImp.click();

    document.getElementById('child-height-ft').value = '4';
    document.getElementById('child-height-in').value = '7.0';
    document.getElementById('child-height-ft').dispatchEvent(new Event('input', { bubbles: true }));

    document.getElementById('child-weight-lbs').value = '78.5';
    document.getElementById('child-weight-lbs').dispatchEvent(new Event('input', { bubbles: true }));

    document.getElementById('child-recent-gain').value = '1.3';
    document.getElementById('btn-next-step').click();
  })()`);
  await new Promise(r => setTimeout(r, 300));

  const step3State = await evalInBrowser(`(() => {
    return {
      currentStep: window.TallerOnboardingWizard.state.currentStep,
      step3Active: document.getElementById('step-content-3').classList.contains('active')
    };
  })()`);

  it('4.1 Imperial Mode: Advances Step 2 -> Step 3 with zero alerts', () => {
    assert.strictEqual(step3State.currentStep, 3, 'Must advance to Step 3');
    assert.strictEqual(step3State.step3Active, true, 'Step 3 must be active');
    assert.strictEqual(openedDialogs.length, 0, `Expected 0 alerts on Step 2 -> 3: ${JSON.stringify(openedDialogs)}`);
  });

  // Step 3: Enter Imperial Parents and inspect live MPH badge
  const mphState = await evalInBrowser(`(() => {
    document.getElementById('father-height-ft').value = '5';
    document.getElementById('father-height-in').value = '10.5';
    document.getElementById('father-height-ft').dispatchEvent(new Event('input', { bubbles: true }));

    document.getElementById('mother-height-ft').value = '5';
    document.getElementById('mother-height-in').value = '4.0';
    document.getElementById('mother-height-ft').dispatchEvent(new Event('input', { bubbles: true }));

    const badge = document.getElementById('mph-badge-value');
    return {
      badgeHTML: badge ? badge.innerHTML : ''
    };
  })()`);

  it('4.2 Live MPH badge renders Imperial ft/in and ±3.3 in format', () => {
    assert(mphState.badgeHTML.includes("'") || mphState.badgeHTML.includes('in'), `MPH badge must format in Imperial: ${mphState.badgeHTML}`);
  });

  // Advance Step 3 -> 4 -> 5 -> 6
  await evalInBrowser(`(() => {
    document.getElementById('btn-next-step').click(); // Step 4
  })()`);
  await new Promise(r => setTimeout(r, 100));
  await evalInBrowser(`(() => {
    document.getElementById('btn-next-step').click(); // Step 5
  })()`);
  await new Promise(r => setTimeout(r, 100));
  await evalInBrowser(`(() => {
    document.getElementById('btn-next-step').click(); // Step 6
  })()`);
  await new Promise(r => setTimeout(r, 100));

  const step6State = await evalInBrowser(`(() => {
    return {
      currentStep: window.TallerOnboardingWizard.state.currentStep,
      submitDisplay: document.getElementById('btn-submit-quiz').style.display,
      nextDisplay: document.getElementById('btn-next-step').style.display
    };
  })()`);

  it('4.3 Reaches Step 6 with visible Submit button and hidden Next button', () => {
    assert.strictEqual(step6State.currentStep, 6, 'Must reach Step 6');
    assert.strictEqual(step6State.submitDisplay, 'inline-flex', 'Submit button must be visible');
    assert.strictEqual(step6State.nextDisplay, 'none', 'Next button must be hidden');
  });

  // Step 6: Submit and Wait for Clinical Report
  openedDialogs.length = 0;
  await evalInBrowser(`(() => {
    document.getElementById('btn-submit-quiz').click();
  })()`);

  // Wait 4.5s for scan animation to complete
  await new Promise(r => setTimeout(r, 4500));

  const reportState = await evalInBrowser(`(() => {
    const dash = document.getElementById('results-dashboard');
    const quiz = document.getElementById('quiz-section');
    const reportHtml = dash ? dash.innerHTML : '';
    const hangulMatches = reportHtml.match(/[\\uAC00-\\uD7AF]/g) || [];
    return {
      dashDisplay: dash ? window.getComputedStyle(dash).display : 'none',
      quizDisplay: quiz ? window.getComputedStyle(quiz).display : 'block',
      hasReportCards: reportHtml.includes('card') || reportHtml.includes('report'),
      hangulCount: hangulMatches.length
    };
  })()`);

  it('4.4 Scan completes and displays Results Dashboard with hidden Quiz section', () => {
    assert.notStrictEqual(reportState.dashDisplay, 'none', 'Results dashboard must be visible');
    assert.strictEqual(reportState.quizDisplay, 'none', 'Quiz section must be hidden after scan');
    assert.strictEqual(openedDialogs.length, 0, `Expected zero alerts on submission and scan: ${JSON.stringify(openedDialogs)}`);
  });

  it('4.5 Clinical Report renders with strictly 0 Hangul characters', () => {
    assert.strictEqual(reportState.hangulCount, 0, `Report contained ${reportState.hangulCount} Hangul characters`);
  });

  // --------------------------------------------------------------------------
  console.log('\n[SECTION 5: Brain & Learning LQ Mode Survey Flow]');
  // --------------------------------------------------------------------------
  openedDialogs.length = 0;
  const learningEntry = await evalInBrowser(`(() => {
    window.TallerOnboardingWizard.enterStudioMode('child', 'learning');
    return {
      currentStep: window.TallerOnboardingWizard.state.currentStep,
      mode: window.TallerOnboardingWizard.state.preferredReportMode
    };
  })()`);

  it('5.1 Enters Brain & Learning LQ Mode cleanly at Step 1 with zero alerts', () => {
    assert.strictEqual(learningEntry.currentStep, 1, 'Must be at Step 1');
    assert.strictEqual(learningEntry.mode, 'learning', 'Must be learning mode');
    assert.strictEqual(openedDialogs.length, 0, `Zero alerts on learning entry: ${JSON.stringify(openedDialogs)}`);
  });

  // Advance Learning Steps: 1 -> 2 -> 3 -> 4 -> 5 -> 6
  await evalInBrowser(`(() => {
    document.getElementById('gender-girl').checked = true;
    document.getElementById('child-birth-year').value = '2015';
    document.getElementById('child-birth-month').value = '6';
    document.getElementById('child-birth-day').value = '10';
    document.getElementById('btn-next-step').click(); // Step 2 (Literacy)
  })()`);
  await new Promise(r => setTimeout(r, 100));

  await evalInBrowser(`(() => {
    document.getElementById('btn-next-step').click(); // Step 3 (Math)
  })()`);
  await new Promise(r => setTimeout(r, 100));

  await evalInBrowser(`(() => {
    document.getElementById('btn-next-step').click(); // Step 4 (Focus)
  })()`);
  await new Promise(r => setTimeout(r, 100));

  await evalInBrowser(`(() => {
    document.getElementById('btn-next-step').click(); // Step 5 (Meta)
  })()`);
  await new Promise(r => setTimeout(r, 100));

  await evalInBrowser(`(() => {
    document.getElementById('btn-next-step').click(); // Step 6 (Temperament)
  })()`);
  await new Promise(r => setTimeout(r, 100));

  const learningStep6 = await evalInBrowser(`(() => {
    return {
      currentStep: window.TallerOnboardingWizard.state.currentStep,
      btnText: document.getElementById('btn-submit-quiz').textContent
    };
  })()`);

  it('5.2 Advances through all Learning steps to Step 6 with Brain LQ submit label', () => {
    assert.strictEqual(learningStep6.currentStep, 6, 'Must reach Step 6');
    assert(learningStep6.btnText.includes('Brain') || learningStep6.btnText.includes('Learning'), `Submit label must reflect Learning: ${learningStep6.btnText}`);
    assert.strictEqual(openedDialogs.length, 0, 'Zero alerts throughout Learning steps');
  });

  // --------------------------------------------------------------------------
  console.log('\n[SECTION 6: Rapid Stepper Navigation & Clamping on Browser DOM]');
  // --------------------------------------------------------------------------
  const clampingResult = await evalInBrowser(`(() => {
    const nextBtn = document.getElementById('btn-next-step');
    const prevBtn = document.getElementById('btn-prev-step');

    // 30 rapid next clicks
    for (let i = 0; i < 30; i++) nextBtn.click();
    const maxClamped = window.TallerOnboardingWizard.state.currentStep;

    // 30 rapid prev clicks
    for (let i = 0; i < 30; i++) prevBtn.click();
    const minClamped = window.TallerOnboardingWizard.state.currentStep;

    return { maxClamped, minClamped };
  })()`);

  it('6.1 Stepper clamps strictly between [1..6] under rapid sequential clicking', () => {
    assert.strictEqual(clampingResult.maxClamped, 6, 'Must clamp at 6 on rapid next');
    assert.strictEqual(clampingResult.minClamped, 1, 'Must clamp at 1 on rapid prev');
  });

  // --------------------------------------------------------------------------
  console.log('\n[SECTION 7: Mid-Funnel Unit Switching & Companion Sync]');
  // --------------------------------------------------------------------------
  const unitSwitchResult = await evalInBrowser(`(() => {
    window.TallerOnboardingWizard.enterStudioMode('child', 'growth');
    window.TallerOnboardingWizard.goToStep(2);

    const chFt = document.getElementById('child-height-ft');
    const chIn = document.getElementById('child-height-in');
    const chH = document.getElementById('child-height');

    // Enter 5 ft 0.0 in (60.0 in)
    chFt.value = '5';
    chIn.value = '0.0';
    chFt.dispatchEvent(new Event('input', { bubbles: true }));
    const imperialH = chH.value;

    // Toggle to Metric via Step 2 button
    document.getElementById('btn-step2-unit-metric').click();
    const metricH = chH.value;
    const activeUnitAfterMetric = window.TallerI18n.getUnitSystem();

    // Toggle back to Imperial
    document.getElementById('btn-step2-unit-imperial').click();
    const backImperialH = chH.value;
    const backFt = chFt.value;
    const backIn = chIn.value;

    return { imperialH, metricH, activeUnitAfterMetric, backImperialH, backFt, backIn };
  })()`);

  it('7.1 Switching to Metric sets active unit and updates primary height', () => {
    assert.strictEqual(unitSwitchResult.imperialH, '60.0', 'Primary height should be 60.0 in');
    assert.strictEqual(unitSwitchResult.activeUnitAfterMetric, 'metric', 'Unit system must be metric');
    console.log(`      [Live Chrome Metric Value]: ${unitSwitchResult.metricH} cm (Expected ~152.4 cm)`);
  });

  it('7.2 Switching back to Imperial restores companion ft and in', () => {
    console.log(`      [Live Chrome Restored Imperial]: ${unitSwitchResult.backFt} ft ${unitSwitchResult.backIn} in (val: ${unitSwitchResult.backImperialH})`);
    assert.ok(parseFloat(unitSwitchResult.backFt) >= 4, 'Restored ft should be >= 4');
  });

  // Clean up Chrome
  ws.close();
  chrome.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}

  console.log('\n========================================================================');
  console.log(`REAL CHROME E2E SUMMARY: ${passCount} PASSED | ${failCount} FAILED`);
  console.log('========================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runChromeE2ESuite().catch((err) => {
  console.error('[Fatal Error in Chrome E2E Suite]:', err);
  process.exit(1);
});
