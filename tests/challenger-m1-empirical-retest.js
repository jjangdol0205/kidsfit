/**
 * tests/challenger-m1-empirical-retest.js
 * Independent Adversarial Empirical Harness by Challenger 1 (Iter 2)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_WIZARD = path.join(ROOT_DIR, 'src', 'js', 'onboarding-wizard.js');
const DIST_WIZARD = path.join(ROOT_DIR, 'dist', 'src', 'js', 'onboarding-wizard.js');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');
const DIST_INDEX_HTML = path.join(ROOT_DIR, 'dist', 'index.html');

console.log('========================================================================');
console.log('   CHALLENGER 1 EMPIRICAL ADVERSARIAL RE-CHALLENGE HARNESS (ITER 2)    ');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: Sniffing & Forensic Integrity Audit (src vs dist)
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Forensic Integrity Audit (Zero Sniffing / Parity) ---');

runTest('1.1 Zero environment sniffing in src/js/onboarding-wizard.js', () => {
  const content = fs.readFileSync(SRC_WIZARD, 'utf8');
  assert(!content.includes('isRealBrowser'), 'Found isRealBrowser in src');
  assert(!content.includes('hasSlide6'), 'Found hasSlide6 in src');
  assert(!content.includes('effectiveMaxStep'), 'Found effectiveMaxStep in src');
  assert(!content.includes('window.location.protocol'), 'Found window.location.protocol in src');
  assert(!content.includes('process.env'), 'Found process.env in src');
  assert(!content.includes('navigator.userAgent'), 'Found navigator.userAgent in src');
});

runTest('1.2 Zero environment sniffing in dist/src/js/onboarding-wizard.js', () => {
  const content = fs.readFileSync(DIST_WIZARD, 'utf8');
  assert(!content.includes('isRealBrowser'), 'Found isRealBrowser in dist');
  assert(!content.includes('hasSlide6'), 'Found hasSlide6 in dist');
  assert(!content.includes('effectiveMaxStep'), 'Found effectiveMaxStep in dist');
  assert(!content.includes('window.location.protocol'), 'Found window.location.protocol in dist');
  assert(!content.includes('process.env'), 'Found process.env in dist');
  assert(!content.includes('navigator.userAgent'), 'Found navigator.userAgent in dist');
});

runTest('1.3 src and dist wizard files have identical logic and maxStep: 6', () => {
  const srcContent = fs.readFileSync(SRC_WIZARD, 'utf8');
  const distContent = fs.readFileSync(DIST_WIZARD, 'utf8');
  assert.strictEqual(srcContent, distContent, 'src and dist onboarding-wizard.js must match identically');
  assert(srcContent.includes('maxStep: 6'), 'maxStep must be unconditionally set to 6');
});

// Helper to create a test environment
function setupEnvironment(isSimulatedBrowser = false) {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const elements = {};
  const listeners = {};

  class MockElement {
    constructor(id, tag = 'div', type = null, value = '', checked = false) {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.type = type;
      this.value = value;
      this.checked = checked;
      this.style = {};
      this.textContent = '';
      this.innerHTML = '';
      this.attributes = {};
      this.classList = {
        _set: new Set(),
        add: (c) => this.classList._set.add(c),
        remove: (c) => this.classList._set.delete(c),
        contains: (c) => this.classList._set.has(c)
      };
    }
    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
    addEventListener(evt, fn) {
      if (!listeners[this.id]) listeners[this.id] = {};
      if (!listeners[this.id][evt]) listeners[this.id][evt] = [];
      listeners[this.id][evt].push(fn);
    }
    click() {
      if (typeof this.onclick === 'function') {
        this.onclick({ type: 'click', target: this, preventDefault: () => {} });
      }
      const fns = (listeners[this.id] && listeners[this.id]['click']) || [];
      fns.forEach(fn => fn({ type: 'click', target: this, preventDefault: () => {} }));
    }
    focus() {}
    scrollIntoView() {}
  }

  function getOrMake(id, tag = 'div', type = null, value = '', checked = false) {
    if (!elements[id]) {
      elements[id] = new MockElement(id, tag, type, value, checked);
    }
    return elements[id];
  }

  // Register all slide and control elements from index.html
  for (let s = 1; s <= 5; s++) {
    const el = getOrMake(`step-content-${s}`);
    if (s === 1) el.classList.add('active');
  }
  const slide6 = getOrMake('slide-step-6');
  const tagEl = getOrMake('quiz-step-tag');
  tagEl.textContent = 'Step 1 / 6';
  const progTextEl = getOrMake('quiz-progress-text');
  progTextEl.textContent = '17% 완료';
  const trackEl = getOrMake('slide-funnel-track');
  trackEl.style.transform = 'translateX(-0%)';
  getOrMake('quiz-step-title');
  getOrMake('quiz-step-subtitle');
  const progFillEl = getOrMake('quiz-progress-fill');
  progFillEl.style.width = '16.7%';
  getOrMake('btn-prev-step', 'button');
  getOrMake('btn-next-step', 'button');
  getOrMake('btn-submit-quiz', 'button');
  getOrMake('diagnosis-form', 'form');
  getOrMake('quiz-section');
  getOrMake('hero-section');
  getOrMake('quick-presets-bar');
  getOrMake('results-dashboard');
  getOrMake('prescription-container');
  getOrMake('master-briefing-card');
  getOrMake('btn-retest', 'button');
  getOrMake('analysis-overlay');
  getOrMake('analysis-title');
  getOrMake('analysis-desc');
  getOrMake('analysis-bar-fill');
  getOrMake('btn-skip-scan', 'button');
  getOrMake('mph-badge-value');
  getOrMake('gender-boy', 'input', 'radio', 'boy', true);
  getOrMake('gender-girl', 'input', 'radio', 'girl', false);
  getOrMake('child-age-slider', 'input', 'range', '10');
  getOrMake('child-age-display');
  getOrMake('child-age-months', 'input', 'number', '120');
  getOrMake('child-height', 'input', 'number', '137.0');
  getOrMake('child-weight', 'input', 'number', '35.5');
  getOrMake('child-recent-gain', 'input', 'number', '3.2');
  getOrMake('father-height', 'input', 'number', '173.5');
  getOrMake('mother-height', 'input', 'number', '160.5');

  // Initial visibility matching index.html
  elements['results-dashboard'].classList.add('hidden');
  elements['results-dashboard'].style.display = 'none';
  elements['btn-prev-step'].style.display = 'none';
  elements['btn-next-step'].style.display = 'inline-flex';
  elements['btn-submit-quiz'].style.display = 'none';

  const doc = {
    documentElement: { lang: 'ko' },
    getElementById: (id) => elements[id] || null,
    querySelectorAll: (sel) => {
      const res = [];
      if (sel === 'input[name="tanner-phase"]') {
        for (let i = 1; i <= 4; i++) res.push(getOrMake(`phase-${i}`, 'input', 'radio', `phase_${i}`, i === 2));
      } else if (sel === 'input[name="growth-habits"]') {
        ['late_sleep', 'night_carbs', 'poor_posture', 'picky_eater', 'sedentary'].forEach(h => {
          res.push(getOrMake(`habit-${h}`, 'input', 'checkbox', h, h === 'late_sleep'));
        });
      } else if (sel === 'input[name="cognitive-axes"]') {
        ['math_logic', 'language_reading', 'science_nature', 'sensory_arts', 'executive_focus'].forEach(c => {
          res.push(getOrMake(`cog-${c}`, 'input', 'checkbox', c, c === 'science_nature'));
        });
      } else if (sel === 'input[name="growth-habits"]:checked') {
        res.push(getOrMake('habit-late_sleep', 'input', 'checkbox', 'late_sleep', true));
      } else if (sel === 'input[name="cognitive-axes"]:checked') {
        res.push(getOrMake('cog-science_nature', 'input', 'checkbox', 'science_nature', true));
      }
      return res;
    },
    querySelector: (sel) => {
      if (sel === 'input[name="tanner-phase"]:checked') {
        return getOrMake('phase-2', 'input', 'radio', 'phase_2', true);
      }
      return null;
    },
    createElement: (tag) => new MockElement('dyn', tag)
  };

  const sandbox = {
    console,
    Date,
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
    document: doc,
    alert: () => {},
    addEventListener: (evt, fn) => {
      if (!listeners['win']) listeners['win'] = {};
      if (!listeners['win'][evt]) listeners['win'][evt] = [];
      listeners['win'][evt].push(fn);
    },
    removeEventListener: () => {},
    dispatchEvent: () => {},
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } }
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;

  if (isSimulatedBrowser) {
    sandbox.window.location = {
      protocol: 'https:',
      host: 'truthofmarket.com',
      pathname: '/',
      search: ''
    };
    sandbox.window.navigator = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
    };
  }

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(SRC_WIZARD, 'utf8'), sandbox);
  sandbox.TallerOnboardingWizard.initWizard();

  return { sandbox, elements, wizard: sandbox.TallerOnboardingWizard };
}

// -----------------------------------------------------------------------------
// SECTION 2: Empirical Cross-Environment 6-Slide Progression
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Cross-Environment 6-Slide Progression Parity ---');

['Headless / Mock Environment (no window.location)', 'Live Browser Environment (https://truthofmarket.com)'].forEach((envLabel, idx) => {
  const isBrowser = idx === 1;

  runTest(`2.${idx + 1} Step 1 to 6 progression in ${envLabel}`, () => {
    const { elements, wizard } = setupEnvironment(isBrowser);
    const nextBtn = elements['btn-next-step'];
    const prevBtn = elements['btn-prev-step'];
    const submitBtn = elements['btn-submit-quiz'];
    const tag = elements['quiz-step-tag'];
    const track = elements['slide-funnel-track'];
    const progressFill = elements['quiz-progress-fill'];

    assert.strictEqual(wizard.state.maxStep, 6, 'maxStep must be 6');
    assert.strictEqual(wizard.state.currentStep, 1, 'Initial step 1');
    assert.strictEqual(tag.textContent, 'Step 1 / 6');
    assert.strictEqual(track.style.transform, 'translateX(-0%)');
    assert.strictEqual(prevBtn.style.display, 'none');
    assert.strictEqual(nextBtn.style.display, 'inline-flex');
    assert.strictEqual(submitBtn.style.display, 'none');

    // Step 2
    nextBtn.click();
    assert.strictEqual(wizard.state.currentStep, 2);
    assert.strictEqual(tag.textContent, 'Step 2 / 6');
    assert.strictEqual(track.style.transform, 'translateX(-100%)');
    assert.strictEqual(progressFill.style.width, '33%');
    assert.strictEqual(prevBtn.style.display, 'inline-flex');
    assert.strictEqual(nextBtn.style.display, 'inline-flex');

    // Step 3
    nextBtn.click();
    assert.strictEqual(wizard.state.currentStep, 3);
    assert.strictEqual(tag.textContent, 'Step 3 / 6');
    assert.strictEqual(track.style.transform, 'translateX(-200%)');
    assert.strictEqual(progressFill.style.width, '50%');

    // Step 4
    nextBtn.click();
    assert.strictEqual(wizard.state.currentStep, 4);
    assert.strictEqual(tag.textContent, 'Step 4 / 6');
    assert.strictEqual(track.style.transform, 'translateX(-300%)');
    assert.strictEqual(progressFill.style.width, '67%');

    // Step 5
    nextBtn.click();
    assert.strictEqual(wizard.state.currentStep, 5);
    assert.strictEqual(tag.textContent, 'Step 5 / 6');
    assert.strictEqual(track.style.transform, 'translateX(-400%)');
    assert.strictEqual(progressFill.style.width, '83%');

    // Step 6 (Final Step)
    nextBtn.click();
    assert.strictEqual(wizard.state.currentStep, 6);
    assert.strictEqual(tag.textContent, 'Step 6 / 6');
    assert.strictEqual(track.style.transform, 'translateX(-500%)');
    assert.strictEqual(progressFill.style.width, '100%');
    assert.strictEqual(elements['slide-step-6'].classList.contains('active'), true);
    assert.strictEqual(nextBtn.style.display, 'none', 'Next button MUST be hidden on Step 6');
    assert.strictEqual(submitBtn.style.display, 'inline-flex', 'Submit button MUST be visible on Step 6');
    assert.strictEqual(prevBtn.style.display, 'inline-flex', 'Prev button MUST be visible on Step 6');
  });
});

// -----------------------------------------------------------------------------
// SECTION 3: Stepper Clamping, Rapid-Fire Clicking & Reverse Traversal
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Stepper Clamping, Rapid-Fire & Reverse Traversal ---');

runTest('3.1 Clamping at Step 6 during 100 rapid-fire forward clicks', () => {
  const { elements, wizard } = setupEnvironment(false);
  const nextBtn = elements['btn-next-step'];

  for (let i = 0; i < 100; i++) {
    nextBtn.click();
  }
  assert.strictEqual(wizard.state.currentStep, 6, 'Must be clamped at Step 6');
  assert.strictEqual(elements['slide-step-6'].classList.contains('active'), true);
  assert.strictEqual(elements['btn-next-step'].style.display, 'none');
  assert.strictEqual(elements['btn-submit-quiz'].style.display, 'inline-flex');
});

runTest('3.2 Reverse traversal from Step 6 down to Step 1 and clamping at Step 1', () => {
  const { elements, wizard } = setupEnvironment(false);
  wizard.goToStep(6);
  assert.strictEqual(wizard.state.currentStep, 6);

  const prevBtn = elements['btn-prev-step'];
  // 6 -> 5
  prevBtn.click();
  assert.strictEqual(wizard.state.currentStep, 5);
  // 5 -> 4
  prevBtn.click();
  assert.strictEqual(wizard.state.currentStep, 4);
  // 4 -> 3
  prevBtn.click();
  assert.strictEqual(wizard.state.currentStep, 3);
  // 3 -> 2
  prevBtn.click();
  assert.strictEqual(wizard.state.currentStep, 2);
  // 2 -> 1
  prevBtn.click();
  assert.strictEqual(wizard.state.currentStep, 1);
  assert.strictEqual(prevBtn.style.display, 'none');
  assert.strictEqual(elements['btn-next-step'].style.display, 'inline-flex');

  // 100 rapid-fire backward clicks at Step 1
  for (let i = 0; i < 100; i++) {
    prevBtn.click();
  }
  assert.strictEqual(wizard.state.currentStep, 1, 'Must remain strictly clamped at Step 1');
});

runTest('3.3 Hostile out-of-range programmatic goToStep calls clamp safely', () => {
  const { wizard } = setupEnvironment(false);
  wizard.goToStep(7);
  assert.strictEqual(wizard.state.currentStep, 6, 'goToStep(7) must clamp to 6');
  wizard.goToStep(999);
  assert.strictEqual(wizard.state.currentStep, 6, 'goToStep(999) must clamp to 6');
  wizard.goToStep(0);
  assert.strictEqual(wizard.state.currentStep, 1, 'goToStep(0) must clamp to 1');
  wizard.goToStep(-50);
  assert.strictEqual(wizard.state.currentStep, 1, 'goToStep(-50) must clamp to 1');
});

runTest('3.4 Ping-pong bidirectional traversal maintains state integrity at each node', () => {
  const { elements, wizard } = setupEnvironment(false);
  const nextBtn = elements['btn-next-step'];
  const prevBtn = elements['btn-prev-step'];
  const track = elements['slide-funnel-track'];

  const sequence = [
    { action: 'next', expected: 2 },
    { action: 'prev', expected: 1 },
    { action: 'next', expected: 2 },
    { action: 'next', expected: 3 },
    { action: 'prev', expected: 2 },
    { action: 'next', expected: 3 },
    { action: 'next', expected: 4 },
    { action: 'prev', expected: 3 },
    { action: 'next', expected: 4 },
    { action: 'next', expected: 5 },
    { action: 'prev', expected: 4 },
    { action: 'next', expected: 5 },
    { action: 'next', expected: 6 },
    { action: 'prev', expected: 5 },
    { action: 'next', expected: 6 }
  ];

  sequence.forEach(s => {
    if (s.action === 'next') nextBtn.click();
    else prevBtn.click();
    assert.strictEqual(wizard.state.currentStep, s.expected, `Step after ${s.action} must be ${s.expected}`);
    assert.strictEqual(track.style.transform, `translateX(-${(s.expected - 1) * 100}%)`);
  });
});

runTest('3.5 Validation blocker prevents advancing to next step on out-of-range height/weight', () => {
  const { elements, wizard } = setupEnvironment(false);
  const nextBtn = elements['btn-next-step'];

  // Test height out-of-bounds (< 45cm)
  elements['child-height'].value = '40.0';
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 1, 'Step must not advance when height is invalid');

  // Fix height, make weight out-of-bounds (> 160kg)
  elements['child-height'].value = '137.0';
  elements['child-weight'].value = '170.0';
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 1, 'Step must not advance when weight is invalid');

  // Fix weight, now it should advance cleanly to Step 2
  elements['child-weight'].value = '35.5';
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 2, 'Step must advance once valid values provided');
});

// -----------------------------------------------------------------------------
// SECTION 4: Strict Non-Visibility of #results-dashboard
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Strict Non-Visibility of #results-dashboard ---');

runTest('4.1 index.html and dist/index.html have static hidden and display:none on #results-dashboard', () => {
  const rawIndex = fs.readFileSync(INDEX_HTML, 'utf8');
  const rawDistIndex = fs.readFileSync(DIST_INDEX_HTML, 'utf8');

  [rawIndex, rawDistIndex].forEach((html, i) => {
    const label = i === 0 ? 'index.html' : 'dist/index.html';
    const match = html.match(/id="results-dashboard"[^>]*class="([^"]*)"[^>]*style="([^"]*)"/) ||
                  html.match(/class="([^"]*)"[^>]*id="results-dashboard"[^>]*style="([^"]*)"/);
    assert(match, `${label} must contain id="results-dashboard" with class and style`);
    const classes = match[1];
    const style = match[2];
    assert(classes.includes('hidden'), `${label} #results-dashboard must have class "hidden"`);
    assert(style.includes('display: none'), `${label} #results-dashboard must have style "display: none"`);
  });
});

runTest('4.2 #results-dashboard is NEVER visible during any slide step (1..6)', () => {
  const { elements, wizard } = setupEnvironment(false);
  const dashboard = elements['results-dashboard'];

  for (let step = 1; step <= 6; step++) {
    wizard.goToStep(step);
    assert(dashboard.classList.contains('hidden'), `Dashboard must have .hidden at Step ${step}`);
    assert.strictEqual(dashboard.style.display, 'none', `Dashboard must have display:none at Step ${step}`);
  }
});

runTest('4.3 #results-dashboard reveals only on completeScan, and re-hides on retest', () => {
  const { elements, wizard } = setupEnvironment(false);
  const dashboard = elements['results-dashboard'];
  const quizSection = elements['quiz-section'];

  // Complete scan
  wizard.completeScan();
  assert(!dashboard.classList.contains('hidden'), 'Dashboard must NOT have .hidden after completeScan');
  assert.strictEqual(dashboard.style.display, 'block', 'Dashboard must be display:block after completeScan');
  assert.strictEqual(quizSection.style.display, 'none', 'Quiz section must be hidden after completeScan');

  // Retest button clicked
  elements['btn-retest'].click();
  assert(dashboard.classList.contains('hidden'), 'Dashboard must have .hidden after retest click');
  assert.strictEqual(dashboard.style.display, 'none', 'Dashboard must have display:none after retest click');
  assert.strictEqual(quizSection.style.display, 'block', 'Quiz section must be restored after retest click');
  assert.strictEqual(wizard.state.currentStep, 1, 'Funnel must be reset to Step 1 after retest');
});

runTest('4.4 Form submission on Step 6 starts scan, overlay appears, and skip-scan completes immediately', () => {
  const { elements, wizard } = setupEnvironment(false);
  wizard.goToStep(6);

  let scanFinished = false;
  wizard.start3SecondScan(() => {
    scanFinished = true;
  });

  const overlay = elements['analysis-overlay'];
  assert.strictEqual(overlay.style.display, 'flex', 'Overlay must be visible during scan');
  assert.strictEqual(elements['results-dashboard'].style.display, 'none', 'Dashboard must remain hidden during scan');

  // Trigger skip scan
  elements['btn-skip-scan'].click();
  assert.strictEqual(overlay.style.display, 'none', 'Overlay must be hidden after skip');
  assert.strictEqual(elements['results-dashboard'].style.display, 'block', 'Dashboard must be visible after skip');
  assert(!elements['results-dashboard'].classList.contains('hidden'));
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount}`);
console.log(`PASSED      : ${passCount}`);
console.log(`FAILED      : ${failCount}`);
console.log('========================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('\n🏆 ALL RE-CHALLENGE STRESS CHECKS PASSED WITH ZERO ERRORS!\n');
}
