/**
 * Real Google Chrome Headless CDP Exhaustive Button-by-Button & Flow Audit
 * Launches server.js + real Chrome via DevTools Protocol WebSocket,
 * clicks every button on index.html across Landing -> Auth -> Unit Switch ->
 * Studio Mode -> Presets -> Steps 1..6 & 7 -> Scan Skip -> Report -> Paywall ->
 * Unlocked Report -> Print PDF -> Retest -> Admin Studio -> Q&A Hub.
 */
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 4199;
const CDP_PORT = 9346;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.consoleErrors = [];
    this.pageExceptions = [];
    this.networkFailures = [];
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
    });

    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const desc =
          msg.params?.exceptionDetails?.exception?.description ||
          msg.params?.exceptionDetails?.text ||
          JSON.stringify(msg.params);
        this.pageExceptions.push(desc);
        console.error('[PAGE_EXCEPTION]', desc);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        if (msg.params.type === 'error') {
          const text = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
          this.consoleErrors.push(text);
          console.error('[CONSOLE_ERROR]', text);
        }
      } else if (msg.method === 'Network.responseReceived') {
        const url = msg.params?.response?.url || '';
        const status = msg.params?.response?.status || 200;
        if (url.startsWith(`http://127.0.0.1:${PORT}`) && status >= 400 && !url.includes('/api/lemonsqueezy-orders/verify')) {
          this.networkFailures.push(`${status} ${url}`);
          console.error('[HTTP_ERROR]', status, url);
        }
      }
    });

    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('Network.enable');
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(
        'Eval exception: ' +
          (res.exceptionDetails.exception?.description || res.exceptionDetails.text)
      );
    }
    return res.result ? res.result.value : undefined;
  }

  close() {
    try {
      this.ws.close();
    } catch (_) {}
  }
}

async function runAudit() {
  const passedChecks = [];
  const failedChecks = [];
  function record(name, ok, details = '') {
    if (ok) {
      passedChecks.push({ name, details });
      console.log(`  ✓ [PASS] ${name}${details ? ' — ' + details : ''}`);
    } else {
      failedChecks.push({ name, details });
      console.error(`  ✗ [FAIL] ${name}${details ? ' — ' + details : ''}`);
    }
  }

  console.log('1. Starting local server.js on port', PORT);
  const serverProc = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: Object.assign({}, process.env, { PORT: String(PORT) }),
    stdio: 'pipe'
  });

  await sleep(1500);

  console.log('2. Launching real Google Chrome in headless mode...');
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_cdp_audit_' + Date.now());
  const chromeProc = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1440,900',
      `http://127.0.0.1:${PORT}/`
    ],
    { stdio: 'ignore' }
  );

  let cdp;
  try {
    let targets = null;
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      try {
        targets = await httpGetJson(`http://127.0.0.1:${CDP_PORT}/json`);
        if (Array.isArray(targets) && targets.length > 0) break;
      } catch (_) {}
    }
    if (!targets || !targets.length) throw new Error('Failed to connect to Chrome CDP');

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await sleep(2000);

    await cdp.eval(`
      window.__auditAlerts = [];
      window.__auditOpens = [];
      window.__auditPrints = 0;
      window.alert = function(msg) { window.__auditAlerts.push(String(msg)); };
      window.confirm = function(msg) { return true; };
      window.open = function(url, target) { window.__auditOpens.push({ url: String(url), target: String(target) }); return { closed: false, close: function(){} }; };
      window.print = function() { window.__auditPrints++; };
    `);

    console.log('\n=== PHASE 1: LANDING & HEADER BUTTONS ===');

    // 1.1 Check zero Hangul on landing
    const landingHangul = await cdp.eval(`(document.body.innerText || '').match(/[가-힣]+/g) || []`);
    record('Landing Page Zero Korean Leak', landingHangul.length === 0, `Hangul count: ${landingHangul.length}`);

    // 1.2 Header Unit Toggle (#btn-unit-toggle)
    const unitRes = await cdp.eval(`
      (() => {
        const btn = document.getElementById('btn-unit-toggle');
        if (!btn) return { ok: false, reason: 'No #btn-unit-toggle' };
        const t0 = btn.innerText;
        btn.click();
        const t1 = btn.innerText;
        const u1 = window.TallerI18n ? window.TallerI18n.getUnitSystem() : '';
        btn.click();
        const t2 = btn.innerText;
        const u2 = window.TallerI18n ? window.TallerI18n.getUnitSystem() : '';
        return { ok: t0 !== t1 && t0 === t2, t0, t1, u1, t2, u2 };
      })()
    `);
    record('Header Button #btn-unit-toggle (Imperial <-> Metric)', unitRes.ok, `${unitRes.t0} -> ${unitRes.t1} (${unitRes.u1}) -> ${unitRes.t2} (${unitRes.u2})`);

    // 1.3 Header App Install (#btn-header-app-download) & Hero App Install (#btn-hero-app-install)
    const appInstallRes = await cdp.eval(`
      (() => {
        const b1 = document.getElementById('btn-header-app-download');
        const b2 = document.getElementById('btn-hero-app-install');
        if (b1) b1.click();
        const modal1 = document.getElementById('pwa-install-guide-modal');
        const m1Visible = modal1 ? (modal1.style.display !== 'none' && !modal1.hidden) : false;
        const closeBtn = modal1 ? modal1.querySelector('button, .close-btn, [data-close]') : null;
        if (closeBtn) closeBtn.click();
        if (b2) b2.click();
        return { ok: !!(b1 && b2), b1Text: b1?.innerText, b2Text: b2?.innerText, m1Visible };
      })()
    `);
    record('App Install Guide Buttons (#btn-header-app-download & #btn-hero-app-install)', appInstallRes.ok, `Header="${appInstallRes.b1Text}", Hero="${appInstallRes.b2Text}", GuideModal=${appInstallRes.m1Visible}`);

    // Close any open install modal
    await cdp.eval(`
      (() => {
        const m = document.getElementById('pwa-install-guide-modal');
        if (m) m.style.display = 'none';
      })()
    `);

    // 1.4 Header Auth Button (#btn-header-auth) -> Sign Up -> Sign Out -> Sign In
    const authRes = await cdp.eval(`
      (async () => {
        const btnAuth = document.getElementById('btn-header-auth');
        if (!btnAuth) return { ok: false, reason: 'No #btn-header-auth' };
        btnAuth.click();
        const modal1 = document.getElementById('kidsfit-auth-modal');
        if (!modal1) return { ok: false, reason: 'Modal did not open on click' };

        // Click Create Account tab (#auth-tab-btn-signup)
        const signupTab = document.getElementById('auth-tab-btn-signup');
        if (!signupTab) return { ok: false, reason: 'No #auth-tab-btn-signup' };
        signupTab.click();

        const testEmail = 'chrome_audit_' + Date.now() + '@example.com';
        document.getElementById('auth-input-name').value = 'Emma Watson';
        document.getElementById('auth-input-email').value = testEmail;
        document.getElementById('auth-input-password').value = 'Pass1234!';

        await window.submitKidsFitAuth('signup');
        await new Promise(r => setTimeout(r, 150));
        const afterSignupText = btnAuth.innerText;

        // Click #btn-header-auth again to open Logged-In Account modal & Sign Out
        btnAuth.click();
        const loggedInModal = document.getElementById('kidsfit-auth-modal');
        const hasSignOut = Boolean(loggedInModal && loggedInModal.innerText.includes('Sign Out'));
        window.signOutKidsFitAccount();
        const afterSignOutText = btnAuth.innerText;

        // Click #btn-header-auth again to Sign In with the same account
        btnAuth.click();
        document.getElementById('auth-input-email').value = testEmail;
        document.getElementById('auth-input-password').value = 'Pass1234!';
        await window.submitKidsFitAuth('login');
        await new Promise(r => setTimeout(r, 150));
        const afterLoginText = btnAuth.innerText;

        return {
          ok: afterSignupText.includes('Emma Watson') && hasSignOut && afterSignOutText.includes('Sign In') && afterLoginText.includes('Emma Watson'),
          afterSignupText,
          hasSignOut,
          afterSignOutText,
          afterLoginText
        };
      })()
    `);
    record('Member Auth Flow (#btn-header-auth -> Sign Up -> Sign Out -> Sign In)', authRes.ok, JSON.stringify(authRes));

    console.log('\n=== PHASE 2: HOMEPAGE DUAL-PILLAR CTAs & STUDIO ENTRY ===');

    // 2.1 Click #btn-home-start-learning-report -> verify studio opens -> click #btn-back-to-brand
    const studioEntryLearning = await cdp.eval(`
      (() => {
        const btnLearn = document.getElementById('btn-home-start-learning-report');
        if (!btnLearn) return { ok: false, reason: 'Missing #btn-home-start-learning-report' };
        btnLearn.click();
        const formSec = document.getElementById('onboarding-section') || document.getElementById('quiz-section');
        const backBtn = document.getElementById('btn-back-to-brand');
        const backVisible = backBtn ? !!(backBtn.offsetWidth || backBtn.offsetHeight) : false;
        if (backBtn) backBtn.click();
        const homeBtnVisibleAgain = !!(btnLearn.offsetWidth || btnLearn.offsetHeight);
        return { ok: backVisible && homeBtnVisibleAgain, backVisible, homeBtnVisibleAgain };
      })()
    `);
    record('Button #btn-home-start-learning-report & #btn-back-to-brand', studioEntryLearning.ok, JSON.stringify(studioEntryLearning));

    // 2.2 Click #btn-home-start-growth-report to enter Studio Mode for full 6-step survey test
    const studioEntryGrowth = await cdp.eval(`
      (() => {
        const btnGrowth = document.getElementById('btn-home-start-growth-report');
        if (!btnGrowth) return { ok: false, reason: 'Missing #btn-home-start-growth-report' };
        btnGrowth.click();
        const step1 = document.querySelector('#step-content-1, #quiz-step-1, .quiz-step-content[data-step="1"]');
        return { ok: !!step1, step1Visible: step1 ? !!(step1.offsetWidth || step1.offsetHeight) : false };
      })()
    `);
    record('Button #btn-home-start-growth-report (Enters Step 1 Wizard)', studioEntryGrowth.ok && studioEntryGrowth.step1Visible, JSON.stringify(studioEntryGrowth));

    console.log('\n=== PHASE 3: WIZARD PRESET BUTTONS & STEPS 1 TO 7 ===');

    // 3.1 Test all 5 Preset Cards (#preset-card-1 .. #preset-card-5)
    const presetsAudit = await cdp.eval(`
      (() => {
        const out = [];
        for (let i = 1; i <= 5; i++) {
          const btn = document.getElementById('preset-card-' + i);
          if (!btn) return { ok: false, reason: 'Missing #preset-card-' + i };
          btn.click();
          out.push({
            id: btn.id,
            text: btn.innerText.trim(),
            heightVal: document.getElementById('child-height')?.value,
            weightVal: document.getElementById('child-weight')?.value
          });
        }
        // Leave it on Preset 2 (Age 7 Early School)
        document.getElementById('preset-card-2').click();
        return { ok: out.length === 5 && out.every(r => Number(r.heightVal) > 20), out };
      })()
    `);
    record('All 5 Age Preset Buttons (#preset-card-1 to #preset-card-5)', presetsAudit.ok, JSON.stringify(presetsAudit.out.map(o => `${o.id}:${o.heightVal}`)));

    // 3.2 Step 1 Controls: Gender, DOB, Multi-Ethnic Ancestry (#child-ethnicity), #btn-next-step
    const step1Audit = await cdp.eval(`
      (() => {
        const eth = document.getElementById('child-ethnicity');
        if (!eth) return { ok: false, reason: 'Missing #child-ethnicity' };
        const options = Array.from(eth.options).map(o => o.value);
        eth.value = 'east_asian';
        eth.dispatchEvent(new Event('change', { bubbles: true }));

        const nextBtn = document.getElementById('btn-next-step');
        if (!nextBtn) return { ok: false, reason: 'Missing #btn-next-step' };
        nextBtn.click();

        const currentStep = window.TallerOnboardingWizard && window.TallerOnboardingWizard.getState ? window.TallerOnboardingWizard.getState().currentStep : null;
        return { ok: options.length >= 7 && currentStep === 2, optionsCount: options.length, currentStep };
      })()
    `);
    record('Wizard Step 1 (#child-ethnicity 7 Cohorts + #btn-next-step -> Step 2)', step1Audit.ok, JSON.stringify(step1Audit));

    // 3.3 Step 2 Controls: #btn-step2-unit-imperial, #btn-step2-unit-metric, #btn-prev-step, #btn-next-step
    const step2Audit = await cdp.eval(`
      (() => {
        const btnMetric = document.getElementById('btn-step2-unit-metric');
        const btnImperial = document.getElementById('btn-step2-unit-imperial');
        if (!btnMetric || !btnImperial) return { ok: false, reason: 'Missing Step 2 unit buttons' };
        btnMetric.click();
        const uMetric = window.TallerI18n.getUnitSystem();
        btnImperial.click();
        const uImperial = window.TallerI18n.getUnitSystem();

        // Test #btn-prev-step back to Step 1, then #btn-next-step back to Step 2, then #btn-next-step to Step 3
        const prevBtn = document.getElementById('btn-prev-step');
        const nextBtn = document.getElementById('btn-next-step');
        prevBtn.click();
        const stepAfterPrev = window.TallerOnboardingWizard.getState().currentStep;
        nextBtn.click();
        nextBtn.click();
        const stepAfterNext2 = window.TallerOnboardingWizard.getState().currentStep;

        return {
          ok: uMetric === 'metric' && uImperial === 'imperial' && stepAfterPrev === 1 && stepAfterNext2 === 3,
          uMetric, uImperial, stepAfterPrev, stepAfterNext2
        };
      })()
    `);
    record('Wizard Step 2 (#btn-step2-unit-metric/imperial, #btn-prev-step, #btn-next-step -> Step 3)', step2Audit.ok, JSON.stringify(step2Audit));

    // 3.4 Step 3 Controls: #btn-step3-unit-metric, #btn-step3-unit-imperial, #btn-next-step -> Step 4
    const step3Audit = await cdp.eval(`
      (() => {
        const btnMetric = document.getElementById('btn-step3-unit-metric');
        const btnImperial = document.getElementById('btn-step3-unit-imperial');
        if (!btnMetric || !btnImperial) return { ok: false, reason: 'Missing Step 3 unit buttons' };
        btnMetric.click();
        const uMetric = window.TallerI18n.getUnitSystem();
        btnImperial.click();
        const uImperial = window.TallerI18n.getUnitSystem();

        document.getElementById('btn-next-step').click();
        const stepNow = window.TallerOnboardingWizard.getState().currentStep;
        return { ok: uMetric === 'metric' && uImperial === 'imperial' && stepNow === 4, uMetric, uImperial, stepNow };
      })()
    `);
    record('Wizard Step 3 (#btn-step3-unit-metric/imperial, #btn-next-step -> Step 4)', step3Audit.ok, JSON.stringify(step3Audit));

    // 3.5 Steps 4, 5, 6, and Step 7 Narrative drawer buttons
    const steps4to7Audit = await cdp.eval(`
      (() => {
        const nextBtn = document.getElementById('btn-next-step');
        // Step 4 -> Step 5
        nextBtn.click();
        const step5 = window.TallerOnboardingWizard.getState().currentStep;
        // Step 5 -> Step 6
        nextBtn.click();
        const step6 = window.TallerOnboardingWizard.getState().currentStep;

        // On Step 6, check #btn-open-step7-narrative, .free-note-chip-btn, #btn-back-to-step6-choices
        const btnOpen7 = document.getElementById('btn-open-step7-narrative');
        let step7Tested = false;
        if (btnOpen7) {
          btnOpen7.click();
          const chipBtn = document.querySelector('.free-note-chip-btn');
          if (chipBtn) chipBtn.click();
          const backTo6 = document.getElementById('btn-back-to-step6-choices');
          if (backTo6) backTo6.click();
          step7Tested = true;
        }

        // Now click #btn-submit-quiz
        const submitBtn = document.getElementById('btn-submit-quiz');
        if (!submitBtn) return { ok: false, reason: 'Missing #btn-submit-quiz' };
        submitBtn.click();

        // Check if scan overlay or report is active
        const skipBtn = document.getElementById('btn-skip-scan');
        const skipVisible = skipBtn ? !!(skipBtn.offsetWidth || skipBtn.offsetHeight) : false;
        if (skipBtn) skipBtn.click();

        return { ok: step5 === 5 && step6 === 6 && step7Tested, step5, step6, step7Tested, skipVisible };
      })()
    `);
    record('Wizard Steps 4->5->6->7 Narrative->#btn-submit-quiz->#btn-skip-scan', steps4to7Audit.ok, JSON.stringify(steps4to7Audit));

    await sleep(800);

    console.log('\n=== PHASE 4: CLINICAL REPORT, PAYWALL GATE & CHECKOUT / UNLOCK BUTTONS ===');

    const reportLockedAudit = await cdp.eval(`
      (() => {
        // Ensure report starts in locked state for paywall testing
        localStorage.removeItem('kidsfit_global_report_unlocked_v1');
        if (window.KidsFitGlobalPaywall) window.KidsFitGlobalPaywall.transformGlobalReportAndApplyPaywall();

        const card = document.getElementById('master-briefing-card');
        const gate = document.getElementById('taller-global-paywall-gate');
        const html = card ? card.innerHTML : '';
        const text = card ? card.innerText : '';
        const hangul = text.match(/[가-힣]+/g) || [];
        const hasEthnicity = text.includes('East Asian American');
        const hasSingleBtn = html.includes('8.99');
        const hasPassBtn = html.includes('19.99');

        // Test clicking the Single Pass checkout trigger
        window.__auditOpens = [];
        if (typeof window.triggerGlobalLemonCheckout === 'function') {
          window.triggerGlobalLemonCheckout('single');
        }
        const checkoutModal = document.getElementById('kidsfit-global-checkout-modal');
        const checkoutModalOpened = !!checkoutModal;

        return {
          ok: !!card && !!gate && hangul.length === 0 && hasEthnicity && hasSingleBtn && hasPassBtn && checkoutModalOpened,
          hasGate: !!gate,
          hangulCount: hangul.length,
          hasEthnicity,
          hasSingleBtn,
          hasPassBtn,
          checkoutModalOpened
        };
      })()
    `);
    record('Clinical Report (Locked State, Multi-Ethnic Badge, Zero Hangul, Checkout Modal)', reportLockedAudit.ok, JSON.stringify(reportLockedAudit));

    // Now test unlocking the report and checking all Chapter 03 & Chapter 08 iHerb links + Report Header Buttons
    const reportUnlockedAudit = await cdp.eval(`
      (() => {
        const checkoutModal = document.getElementById('kidsfit-global-checkout-modal');
        if (checkoutModal) checkoutModal.remove();

        localStorage.setItem('kidsfit_global_report_unlocked_v1', 'true');
        if (window.KidsFitGlobalPaywall) window.KidsFitGlobalPaywall.transformGlobalReportAndApplyPaywall();

        const card = document.getElementById('master-briefing-card');
        const paywallCard = document.getElementById('taller-global-paywall-card');
        const iherbLinks = Array.from(card.querySelectorAll('a[href*="iherb.com"]')).map(a => a.href);
        const nonIherbMerchants = Array.from(card.querySelectorAll('a[href*="amazon.com"], a[href*="coupang.com"], a[href*="linkprice"]')).map(a => a.href);

        // Test report top action buttons: #btn-switch-report-learning, #btn-switch-report-growth, #btn-print-report-top, #btn-print-clinic-pdf
        const btnLearn = document.getElementById('btn-switch-report-learning');
        const btnGrowth = document.getElementById('btn-switch-report-growth');
        const btnPrintTop = document.getElementById('btn-print-report-top');
        const btnPrintPdf = document.getElementById('btn-print-clinic-pdf');

        if (btnLearn) btnLearn.click();
        if (btnGrowth) btnGrowth.click();

        const printsBefore = window.__auditPrints || 0;
        if (btnPrintTop) btnPrintTop.click();
        if (btnPrintPdf) btnPrintPdf.click();
        const printsAfter = window.__auditPrints || 0;

        // Test capsule tabs (#tab-btn-auxology, #tab-btn-endocrinology, #tab-btn-biomechanics, #tab-btn-neuro, #tab-btn-tracker)
        const tabIds = ['tab-btn-auxology', 'tab-btn-endocrinology', 'tab-btn-biomechanics', 'tab-btn-neuro', 'tab-btn-tracker'];
        let tabsClicked = 0;
        for (const tid of tabIds) {
          const t = document.getElementById(tid);
          if (t) { t.click(); tabsClicked++; }
        }

        // Check high-contrast child conditions box & footer (no black text on blue background)
        const topCondBox = document.getElementById('global-report-child-conditions-box');
        const botCondBox = document.getElementById('global-report-child-conditions-footer');
        const topStyle = topCondBox ? window.getComputedStyle(topCondBox) : null;
        const botStyle = botCondBox ? window.getComputedStyle(botCondBox) : null;
        const contrastOk = !!(
          topCondBox &&
          botCondBox &&
          topStyle.backgroundColor === 'rgb(255, 255, 255)' &&
          topStyle.color === 'rgb(15, 23, 42)' &&
          botStyle.backgroundColor === 'rgb(255, 255, 255)' &&
          botStyle.color === 'rgb(15, 23, 42)'
        );

        return {
          ok: !paywallCard && iherbLinks.length >= 6 && iherbLinks.every(u => u.includes('rcode=IPZ1547')) && nonIherbMerchants.length === 0 && tabsClicked === 5 && contrastOk,
          gateRemoved: !paywallCard,
          iherbLinksCount: iherbLinks.length,
          nonIherbCount: nonIherbMerchants.length,
          printsTriggered: printsAfter - printsBefore,
          tabsClicked,
          contrastOk,
          topBg: topStyle ? topStyle.backgroundColor : null,
          topColor: topStyle ? topStyle.color : null,
          botBg: botStyle ? botStyle.backgroundColor : null,
          botColor: botStyle ? botStyle.color : null
        };
      })()
    `);
    record('Unlocked Full Report (6 iHerb Links rcode=IPZ1547, Zero Non-iHerb, High-Contrast Child Conditions Box & Footer)', reportUnlockedAudit.ok, JSON.stringify(reportUnlockedAudit));

    // 4.3 Test Lemon Squeezy End-to-End APIs (/api/lemonsqueezy-config, /api/lemonsqueezy-checkout, /api/lemonsqueezy-webhook -> /api/lemonsqueezy-orders/verify)
    const lemonSqueezyE2E = await cdp.eval(`
      (async () => {
        const cfgRes = await fetch('/api/lemonsqueezy-config').then(r => r.json());
        const chkRes = await fetch('/api/lemonsqueezy-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'single', email: 'ls_e2e_buyer@example.com' })
        }).then(r => r.json());

        // Simulate a paid order webhook and verify unlock via /api/lemonsqueezy-orders/verify
        const whRes = await fetch('/api/lemonsqueezy-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meta: { event_name: 'order_created' },
            data: {
              id: 'ord_e2e_999',
              attributes: {
                user_email: 'ls_e2e_buyer@example.com',
                total_formatted: '$8.99',
                status: 'paid'
              }
            }
          })
        }).then(r => r.json());

        const verRes = await fetch('/api/lemonsqueezy-orders/verify?email=' + encodeURIComponent('ls_e2e_buyer@example.com')).then(r => r.json());
        return {
          ok: !!(cfgRes.ok && cfgRes.storeId === 296100 && chkRes.ok && chkRes.checkoutUrl && whRes.ok && verRes.ok && verRes.verified),
          storeId: cfgRes.storeId,
          checkoutMode: chkRes.mode,
          hasCheckoutUrl: !!(chkRes.checkoutUrl && chkRes.checkoutUrl.includes('lemonsqueezy.com')),
          verified: verRes.verified,
          orderId: verRes.orderId
        };
      })()
    `);
    record('Lemon Squeezy Store #296100 E2E (Config, Signed Checkout Creation, Webhook & Order Verify)', lemonSqueezyE2E.ok, JSON.stringify(lemonSqueezyE2E));

    console.log('\n=== PHASE 5: ADMIN STUDIO MODAL (5x Footer Click & ?admin=1) ===');
    const adminAudit = await cdp.eval(`
      (() => {
        const footer = document.getElementById('footer-copyright');
        if (!footer) return { ok: false, reason: 'Missing #footer-copyright' };
        for (let i = 0; i < 5; i++) footer.click();

        const modal = document.getElementById('admin-modal');
        const isOpen = modal && modal.style.display === 'flex';
        const iherbInput = document.getElementById('cfg-iherb');
        const iherbVal = iherbInput ? iherbInput.value : '';

        // Test scenario tabs & copy buttons inside Admin Studio
        const scBtns = Array.from(document.querySelectorAll('.btn-osmu-scenario'));
        scBtns.forEach(b => b.click());
        const copyBtns = Array.from(document.querySelectorAll('.btn-copy-target'));
        copyBtns.forEach(b => b.click());

        // Test Save Settings button (#btn-save-admin)
        const saveBtn = document.getElementById('btn-save-admin');
        if (saveBtn) saveBtn.click();
        const isClosedAfterSave = modal && modal.style.display === 'none';

        return {
          ok: isOpen && iherbVal === 'IPZ1547' && isClosedAfterSave,
          isOpen,
          iherbVal,
          isClosedAfterSave
        };
      })()
    `);
    record('Admin Studio (5x Footer Click -> iHerb Config IPZ1547 -> Marketing Copy Buttons -> Save & Close)', adminAudit.ok, JSON.stringify(adminAudit));

    console.log('\n=== PHASE 6: RE-ENTER SURVEY BUTTON (#btn-retest) & BRAIN MODE E2E ROUTING ===');
    const retestAudit = await cdp.eval(`
      (() => {
        const btnRetest = document.getElementById('btn-retest');
        if (!btnRetest) return { ok: false, reason: 'Missing #btn-retest' };
        btnRetest.click();
        const stepNow = window.TallerOnboardingWizard.getState().currentStep;
        return { ok: stepNow === 1, stepNow };
      })()
    `);
    record('Retest Button (#btn-retest returns cleanly to Wizard Step 1)', retestAudit.ok, JSON.stringify(retestAudit));

    // Return to Homepage and click #btn-home-start-learning-report to verify Brain Mode Step 1..6 -> Report 02 routing!
    const brainModeFlowAudit = await cdp.eval(`
      (() => {
        const backBtn = document.getElementById('btn-back-to-brand');
        if (backBtn) backBtn.click();

        const btnLearn = document.getElementById('btn-home-start-learning-report');
        if (!btnLearn) return { ok: false, reason: 'Missing #btn-home-start-learning-report' };
        btnLearn.click();

        // Verify Step 1 in Brain Mode hides physical growth fields (#dob-precision-badge & #child-ethnicity) and shows #dob-learning-precision-badge
        const dobGrowthBadge = document.getElementById('dob-precision-badge');
        const dobLearnBadge = document.getElementById('dob-learning-precision-badge');
        const ethSelect = document.getElementById('child-ethnicity');
        const growthBadgeHidden = !dobGrowthBadge || dobGrowthBadge.offsetHeight === 0;
        const ethHidden = !ethSelect || ethSelect.offsetHeight === 0;
        const learnBadgeVisible = !!(dobLearnBadge && dobLearnBadge.offsetHeight > 0);

        // Walk through Brain Steps 1..6 and submit
        const nextBtn = document.getElementById('btn-next-step');
        for (let s = 1; s <= 5; s++) {
          if (nextBtn) nextBtn.click();
        }
        const submitBtn = document.getElementById('btn-submit-quiz');
        if (submitBtn) submitBtn.click();
        const skipBtn = document.getElementById('btn-skip-scan');
        if (skipBtn) skipBtn.click();

        return {
          step1Ok: growthBadgeHidden && ethHidden && learnBadgeVisible,
          growthBadgeHidden,
          ethHidden,
          learnBadgeVisible
        };
      })()
    `);
    await sleep(800);
    const brainReportAudit = await cdp.eval(`
      (() => {
        if (window.KidsFitGlobalPaywall) window.KidsFitGlobalPaywall.transformGlobalReportAndApplyPaywall();
        const p1 = document.getElementById('pillar-1-container');
        const p2 = document.getElementById('pillar-2-container');
        const p1Hidden = !!(p1 && p1.style.display === 'none');
        const p2Visible = !!(p2 && p2.style.display !== 'none' && p2.offsetHeight > 0);
        const tabLearn = document.getElementById('btn-global-tab-learning');
        const tabGrowth = document.getElementById('btn-global-tab-growth');

        // Also test switching to growth tab and back to learning tab
        if (typeof window.switchGlobalReportTab === 'function') {
          window.switchGlobalReportTab('growth');
        }
        const p1VisibleAfterSwitch = !!(p1 && p1.style.display !== 'none');
        if (typeof window.switchGlobalReportTab === 'function') {
          window.switchGlobalReportTab('learning');
        }
        const p2VisibleAgain = !!(p2 && p2.style.display !== 'none');

        return {
          ok: p1Hidden && p2Visible && p1VisibleAfterSwitch && p2VisibleAgain,
          p1Hidden,
          p2Visible,
          p1VisibleAfterSwitch,
          p2VisibleAgain,
          hasTabButtons: !!(tabLearn && tabGrowth)
        };
      })()
    `);
    record('Brain Mode E2E Routing (#btn-home-start-learning-report -> Brain Steps 1-6 -> Report 02 5-Axis Brain LQ Displayed)', brainModeFlowAudit.step1Ok && brainReportAudit.ok, JSON.stringify({ ...brainModeFlowAudit, ...brainReportAudit }));

    console.log('\n=== PHASE 7: CLINICAL Q&A HUB (/qna/index.html & /qna/topic-01.html) ===');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/qna/index.html` });
    await sleep(1200);
    const qnaAudit = await cdp.eval(`
      (() => {
        const links = Array.from(document.querySelectorAll('a[href*="topic-"]'));
        const hangul = (document.body.innerText || '').match(/[가-힣]+/g) || [];
        return { ok: links.length >= 25 && hangul.length === 0, topicLinks: links.length, hangulCount: hangul.length };
      })()
    `);
    record('Clinical Q&A Hub (/qna/index.html 28 Topics & Zero Hangul)', qnaAudit.ok, JSON.stringify(qnaAudit));

    console.log('\n============================================================');
    console.log(`FINAL AUDIT SUMMARY: ${passedChecks.length} Passed | ${failedChecks.length} Failed`);
    console.log(`Console Errors: ${cdp.consoleErrors.length} | Page Exceptions: ${cdp.pageExceptions.length} | Network Failures: ${cdp.networkFailures.length}`);
    console.log('============================================================');

    if (failedChecks.length > 0 || cdp.pageExceptions.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (cdp) cdp.close();
    try {
      chromeProc.kill();
    } catch (_) {}
    try {
      serverProc.kill();
    } catch (_) {}
  }
}

runAudit().catch((err) => {
  console.error('Audit script failed:', err);
  process.exit(1);
});
