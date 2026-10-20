/**
 * tests/phase1-funnel-stress.test.js
 * 
 * Empirical Adversarial Challenger Suite for Phase 1 6-Slide Onboarding Funnel:
 * 1. Extreme inputs validation & boundary stress (age 1 & 20, height 45cm & 220cm, weight 2kg & 150kg, and out-of-bounds rejection).
 * 2. Rapid step navigation stress & bidirectional stepper clamping (Step 1 to 6).
 * 3. Clinical preset selection (Presets 1..5), form field population & real-time Tanner MPH preview badge calculation.
 * 4. Strict empirical verification that #results-dashboard is NEVER visible until scan completes, and re-hides on retest.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const WIZARD_PATH = path.join(ROOT_DIR, 'src', 'js', 'onboarding-wizard.js');
const APP_PATH = path.join(ROOT_DIR, 'src', 'js', 'app.js');
const I18N_PATH = path.join(ROOT_DIR, 'src', 'js', 'i18n.js');
const THEME_PATH = path.join(ROOT_DIR, 'src', 'js', 'theme-switcher.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function it(title, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${title}`);
    console.error(`         ${err.message}`);
    failedTests++;
    failures.push({ title, error: err.message, stack: err.stack });
  }
}

/**
 * Creates a high-fidelity DOM environment directly parsing index.html
 */
function createFunnelEnvironment() {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const elements = {};
  const listeners = {};
  const alertLog = [];

  class MockElement {
    constructor(id, tag = 'div', name = null, value = '', type = null, checked = false) {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.name = name;
      this.value = value;
      this.type = type;
      this.checked = checked;
      this.min = '';
      this.max = '';
      this.placeholder = '';
      this.style = {};
      this.attributes = {};
      this.textContent = '';
      this.innerHTML = '';
      this.title = '';
      this.classList = {
        _set: new Set(),
        add: (c) => this.classList._set.add(c),
        remove: (c) => this.classList._set.delete(c),
        contains: (c) => this.classList._set.has(c),
        toggle: (c, force) => {
          if (force === true) this.classList._set.add(c);
          else if (force === false) this.classList._set.delete(c);
          else if (this.classList._set.has(c)) this.classList._set.delete(c);
          else this.classList._set.add(c);
        }
      };
    }
    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
    addEventListener(evt, fn) {
      if (!listeners[this.id]) listeners[this.id] = {};
      if (!listeners[this.id][evt]) listeners[this.id][evt] = [];
      listeners[this.id][evt].push(fn);
    }
    dispatchEvent(evt) {
      const eventObj = typeof evt === 'string' ? { type: evt, target: this } : evt;
      if (!eventObj.target) eventObj.target = this;
      if (typeof this[`on${eventObj.type}`] === 'function') {
        this[`on${eventObj.type}`](eventObj);
      }
      const fns = (listeners[this.id] && listeners[this.id][eventObj.type]) || [];
      fns.forEach((fn) => fn(eventObj));
    }
    click() {
      const evt = { type: 'click', preventDefault: () => {}, target: this };
      if (typeof this.onclick === 'function') {
        this.onclick(evt);
      }
      this.dispatchEvent(evt);
    }
    focus() { this.focused = true; }
    scrollIntoView() {}
  }

  // Parse all elements with IDs from index.html
  const idRegex = /<([a-z0-9]+)[^>]*\bid=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = idRegex.exec(html)) !== null) {
    const tag = m[1];
    const id = m[2];
    const fullTag = m[0];
    const nameMatch = fullTag.match(/name=["']([^"']+)["']/i);
    const valueMatch = fullTag.match(/value=["']([^"']+)["']/i);
    const typeMatch = fullTag.match(/type=["']([^"']+)["']/i);
    const checked = /checked/i.test(fullTag);
    const minMatch = fullTag.match(/min=["']([^"']+)["']/i);
    const maxMatch = fullTag.match(/max=["']([^"']+)["']/i);
    const classMatch = fullTag.match(/class=["']([^"']+)["']/i);

    const el = new MockElement(
      id,
      tag,
      nameMatch ? nameMatch[1] : null,
      valueMatch ? valueMatch[1] : '',
      typeMatch ? typeMatch[1] : null,
      checked
    );
    if (minMatch) el.min = minMatch[1];
    if (maxMatch) el.max = maxMatch[1];
    if (classMatch) {
      classMatch[1].split(/\s+/).forEach((cls) => {
        if (cls) el.classList.add(cls);
      });
    }

    // Set initial display style if inline style exists
    const styleMatch = fullTag.match(/style=["']([^"']+)["']/i);
    if (styleMatch) {
      const displayMatch = styleMatch[1].match(/display\s*:\s*([^;]+)/i);
      if (displayMatch) el.style.display = displayMatch[1].trim();
    }

    elements[id] = el;
  }

  // Set initial textContent for elements that have text in index.html
  if (elements['quiz-step-tag']) elements['quiz-step-tag'].textContent = 'Step 1 / 6';
  if (elements['quiz-progress-text']) elements['quiz-progress-text'].textContent = '17% 완료';
  if (elements['child-age-display']) elements['child-age-display'].textContent = '10세 (120개월)';
  if (elements['mph-badge-value']) {
    elements['mph-badge-value'].innerHTML = '173.5 cm <span class="mph-badge-range">(±8.5cm: 165.0cm ~ 182.0cm)</span>';
  }

  // Ensure #results-dashboard initial state matches index.html line 369
  if (elements['results-dashboard']) {
    elements['results-dashboard'].classList.add('hidden');
    elements['results-dashboard'].classList.add('prescription-container');
    elements['results-dashboard'].style.display = 'none';
  }

  const docElem = new MockElement('html', 'html');
  docElem.lang = 'ko';
  docElem.setAttribute('data-theme', 'dark');

  const body = new MockElement('body', 'body');
  body.setAttribute('data-theme', 'dark');

  const docListeners = {};
  const winListeners = {};

  const doc = {
    documentElement: docElem,
    body: body,
    getElementById: (id) => elements[id] || null,
    querySelectorAll: (sel) => {
      const res = [];
      if (sel === '.preset-card') {
        for (let i = 1; i <= 5; i++) {
          if (elements[`preset-card-${i}`]) res.push(elements[`preset-card-${i}`]);
        }
        return res;
      }
      if (sel.includes('input[name="child-gender"]:checked')) {
        if (elements['gender-boy'] && elements['gender-boy'].checked) res.push(elements['gender-boy']);
        else if (elements['gender-girl'] && elements['gender-girl'].checked) res.push(elements['gender-girl']);
        return res;
      }
      if (sel.includes('input[name="tanner-phase"]:checked')) {
        for (let i = 1; i <= 4; i++) {
          if (elements[`phase-${i}`] && elements[`phase-${i}`].checked) res.push(elements[`phase-${i}`]);
        }
        return res;
      }
      if (sel === 'input[name="tanner-phase"]') {
        for (let i = 1; i <= 4; i++) {
          if (elements[`phase-${i}`]) res.push(elements[`phase-${i}`]);
        }
        return res;
      }
      if (sel.includes('input[name="growth-habits"]:checked')) {
        ['habit-late-sleep', 'habit-night-carbs', 'habit-poor-posture', 'habit-picky-eater', 'habit-sedentary'].forEach((id) => {
          if (elements[id] && elements[id].checked) res.push(elements[id]);
        });
        return res;
      }
      if (sel === 'input[name="growth-habits"]') {
        ['habit-late-sleep', 'habit-night-carbs', 'habit-poor-posture', 'habit-picky-eater', 'habit-sedentary'].forEach((id) => {
          if (elements[id]) res.push(elements[id]);
        });
        return res;
      }
      if (sel.includes('input[name="cognitive-axes"]:checked')) {
        ['cog-math', 'cog-lang', 'cog-science', 'cog-arts', 'cog-exec'].forEach((id) => {
          if (elements[id] && elements[id].checked) res.push(elements[id]);
        });
        return res;
      }
      if (sel === 'input[name="cognitive-axes"]') {
        ['cog-math', 'cog-lang', 'cog-science', 'cog-arts', 'cog-exec'].forEach((id) => {
          if (elements[id]) res.push(elements[id]);
        });
        return res;
      }
      return res;
    },
    querySelector: (sel) => {
      const all = doc.querySelectorAll(sel);
      return all.length > 0 ? all[0] : null;
    },
    addEventListener: (evt, fn) => {
      if (!docListeners[evt]) docListeners[evt] = [];
      docListeners[evt].push(fn);
    },
    dispatchEvent: (evt) => {
      (docListeners[evt.type] || []).forEach((fn) => fn(evt));
    }
  };

  const win = {
    document: doc,
    localStorage: {
      _data: {},
      getItem: (k) => win.localStorage._data[k] || null,
      setItem: (k, v) => { win.localStorage._data[k] = String(v); },
      removeItem: (k) => { delete win.localStorage._data[k]; },
      get length() { return Object.keys(win.localStorage._data).length; },
      key: (i) => Object.keys(win.localStorage._data)[i] || null
    },
    location: {
      protocol: 'https:',
      hostname: 'truthofmarket.com',
      pathname: '/',
      search: '',
      href: 'https://truthofmarket.com/'
    },
    alert: (msg) => { alertLog.push(msg); },
    addEventListener: (evt, fn) => {
      if (!winListeners[evt]) winListeners[evt] = [];
      winListeners[evt].push(fn);
    },
    dispatchEvent: (evt) => {
      (winListeners[evt.type] || []).forEach((fn) => fn(evt));
    },
    navigator: { language: 'ko' }
  };

  // Build Sandbox with virtualized timers
  let simulatedTime = 1000000;
  const activeTimers = {};
  let timerIdCounter = 1;

  const sandbox = {
    window: win,
    document: doc,
    localStorage: win.localStorage,
    navigator: win.navigator,
    alert: win.alert,
    console: console,
    Date: {
      now: () => simulatedTime
    },
    setTimeout: (fn, delay) => {
      const id = timerIdCounter++;
      activeTimers[id] = { fn, due: simulatedTime + (delay || 0), isInterval: false };
      return id;
    },
    clearTimeout: (id) => { delete activeTimers[id]; },
    setInterval: (fn, interval) => {
      const id = timerIdCounter++;
      activeTimers[id] = { fn, due: simulatedTime + (interval || 50), interval: interval || 50, isInterval: true };
      return id;
    },
    clearInterval: (id) => { delete activeTimers[id]; },
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init ? init.detail : undefined;
      }
    },
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    JSON: JSON
  };
  sandbox.global = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);

  // Run core scripts in sequence (testing index.html and onboarding-wizard.js as specified)
  [I18N_PATH, THEME_PATH, WIZARD_PATH].forEach((filePath) => {
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, sandbox);
  });

  // Helper to step simulated time forward
  function advanceTime(ms) {
    simulatedTime += ms;
    const ids = Object.keys(activeTimers).map(Number);
    for (const id of ids) {
      const t = activeTimers[id];
      if (t && simulatedTime >= t.due) {
        t.fn();
        if (t.isInterval && activeTimers[id]) {
          t.due = simulatedTime + t.interval;
        } else {
          delete activeTimers[id];
        }
      }
    }
  }

  // Trigger DOMContentLoaded
  doc.dispatchEvent({ type: 'DOMContentLoaded' });
  win.dispatchEvent({ type: 'DOMContentLoaded' });

  return {
    win,
    doc,
    elements,
    alertLog,
    advanceTime,
    getWizard: () => win.TallerOnboardingWizard
  };
}

console.log('========================================================================');
console.log('   CHALLENGER 1: PHASE 1 6-SLIDE ONBOARDING FUNNEL EMPIRICAL HARNESS    ');
console.log('========================================================================\n');

// ============================================================================
console.log('--- 1. Extreme Inputs Validation & Boundary Stress ---');
// ============================================================================

it('validates lower extreme age 1 (12 months) via slider and form extraction', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const slider = env.elements['child-age-slider'];
  const display = env.elements['child-age-display'];
  const monthsInput = env.elements['child-age-months'];

  slider.value = '1';
  slider.dispatchEvent('input');

  assert.strictEqual(display.textContent, '1세 (12개월)', 'Age display must show 1세 (12개월)');
  assert.strictEqual(Number(monthsInput.value), 12, 'Hidden months input must be 12');

  const profile = wizard.readProfileFromForm();
  assert.strictEqual(profile.ageYears, 1, 'Extracted ageYears must be 1');
  assert.strictEqual(profile.ageMonths, 12, 'Extracted ageMonths must be 12');
});

it('validates upper extreme age 20 (240 months) via slider and form extraction', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const slider = env.elements['child-age-slider'];
  const display = env.elements['child-age-display'];
  const monthsInput = env.elements['child-age-months'];

  slider.value = '20';
  slider.dispatchEvent('input');

  assert.strictEqual(display.textContent, '20세 (240개월)', 'Age display must show 20세 (240개월)');
  assert.strictEqual(Number(monthsInput.value), 240, 'Hidden months input must be 240');

  const profile = wizard.readProfileFromForm();
  assert.strictEqual(profile.ageYears, 20, 'Extracted ageYears must be 20');
  assert.strictEqual(profile.ageMonths, 240, 'Extracted ageMonths must be 240');
});

it('validates lower extreme height 45cm as acceptable boundary', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const hInput = env.elements['child-height'];

  hInput.value = '45.0';
  const pass = wizard.validateStep(2);
  assert.strictEqual(pass, true, 'Height 45.0cm must pass Step 2 validation');
  assert.strictEqual(env.alertLog.length, 0, 'No alerts on 45.0cm');

  const profile = wizard.readProfileFromForm();
  assert.strictEqual(profile.currentHeight, 45.0, 'Profile must store 45.0cm');
});

it('validates upper extreme height 220cm as acceptable clinical value', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const hInput = env.elements['child-height'];

  hInput.value = '220.0';
  const pass = wizard.validateStep(2);
  assert.strictEqual(pass, true, 'Height 220.0cm must pass Step 2 validation');
  assert.strictEqual(env.alertLog.length, 0, 'No alerts on 220.0cm');

  const profile = wizard.readProfileFromForm();
  assert.strictEqual(profile.currentHeight, 220.0, 'Profile must store 220.0cm');
});

it('strictly rejects out-of-boundary heights (< 45cm or > 230cm)', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const hInput = env.elements['child-height'];

  hInput.value = '44.9';
  let pass = wizard.validateStep(2);
  assert.strictEqual(pass, false, 'Height 44.9cm must be rejected');
  assert(env.alertLog.length > 0, 'Alert must be raised for < 45cm');

  env.alertLog.length = 0;
  hInput.value = '230.1';
  pass = wizard.validateStep(2);
  assert.strictEqual(pass, false, 'Height 230.1cm must be rejected');
  assert(env.alertLog.length > 0, 'Alert must be raised for > 230cm');

  env.alertLog.length = 0;
  hInput.value = 'invalid';
  pass = wizard.validateStep(2);
  assert.strictEqual(pass, false, 'Non-numeric height must be rejected');
});

it('validates lower extreme weight 2kg as acceptable boundary', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const wInput = env.elements['child-weight'];

  wInput.value = '2.0';
  const pass = wizard.validateStep(2);
  assert.strictEqual(pass, true, 'Weight 2.0kg must pass Step 2 validation');
  assert.strictEqual(env.alertLog.length, 0, 'No alerts on 2.0kg');

  const profile = wizard.readProfileFromForm();
  assert.strictEqual(profile.currentWeight, 2.0, 'Profile must store 2.0kg');
});

it('validates upper extreme weight 150kg as acceptable clinical value', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const wInput = env.elements['child-weight'];

  wInput.value = '150.0';
  const pass = wizard.validateStep(2);
  assert.strictEqual(pass, true, 'Weight 150.0kg must pass Step 2 validation');
  assert.strictEqual(env.alertLog.length, 0, 'No alerts on 150.0kg');

  const profile = wizard.readProfileFromForm();
  assert.strictEqual(profile.currentWeight, 150.0, 'Profile must store 150.0kg');
});

it('strictly rejects out-of-boundary weights (< 2kg or > 160kg)', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const wInput = env.elements['child-weight'];

  wInput.value = '1.9';
  let pass = wizard.validateStep(2);
  assert.strictEqual(pass, false, 'Weight 1.9kg must be rejected');
  assert(env.alertLog.length > 0, 'Alert must be raised for < 2kg');

  env.alertLog.length = 0;
  wInput.value = '160.1';
  pass = wizard.validateStep(2);
  assert.strictEqual(pass, false, 'Weight 160.1kg must be rejected');
  assert(env.alertLog.length > 0, 'Alert must be raised for > 160kg');

  env.alertLog.length = 0;
  wInput.value = 'NaN';
  pass = wizard.validateStep(2);
  assert.strictEqual(pass, false, 'NaN weight must be rejected');
});

// ============================================================================
console.log('\n--- 2. Rapid Step Navigation & Stepper Clamp (1 to 6) ---');
// ============================================================================

it('verifies Step 1 initial configuration and button states via goToStep(1)', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();

  // Initialize wizard to Step 1
  wizard.goToStep(1);

  assert.strictEqual(wizard.state.currentStep, 1, 'Initial currentStep must be 1');
  assert(env.elements['step-content-1'].classList.contains('active'), 'Slide 1 must have active class');
  assert.strictEqual(env.elements['btn-prev-step'].style.display, 'none', 'Prev button hidden on Step 1');
  assert.strictEqual(env.elements['btn-next-step'].style.display, 'inline-flex', 'Next button visible on Step 1');
  assert.strictEqual(env.elements['btn-submit-quiz'].style.display, 'none', 'Submit CTA hidden on Step 1');
  assert.strictEqual(env.elements['quiz-step-tag'].textContent, 'Step 1 / 6', 'Tag shows Step 1 / 6');
  assert.strictEqual(env.elements['slide-funnel-track'].style.transform, 'translateX(-0%)', 'Track at 0%');
});

it('advances cleanly through Step 1 -> 2 -> 3 -> 4 -> 5 -> 6 with #btn-next-step', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const nextBtn = env.elements['btn-next-step'];
  const prevBtn = env.elements['btn-prev-step'];
  const submitBtn = env.elements['btn-submit-quiz'];
  const tagEl = env.elements['quiz-step-tag'];
  const track = env.elements['slide-funnel-track'];

  // Step 1 -> Step 2
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 2);
  assert.strictEqual(tagEl.textContent, 'Step 2 / 6');
  assert.strictEqual(track.style.transform, 'translateX(-100%)');
  assert.strictEqual(prevBtn.style.display, 'inline-flex');
  assert.strictEqual(nextBtn.style.display, 'inline-flex');
  assert.strictEqual(submitBtn.style.display, 'none');

  // Step 2 -> Step 3
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 3);
  assert.strictEqual(tagEl.textContent, 'Step 3 / 6');
  assert.strictEqual(track.style.transform, 'translateX(-200%)');

  // Step 3 -> Step 4
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 4);
  assert.strictEqual(tagEl.textContent, 'Step 4 / 6');
  assert.strictEqual(track.style.transform, 'translateX(-300%)');

  // Step 4 -> Step 5
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 5);
  assert.strictEqual(tagEl.textContent, 'Step 5 / 6');
  assert.strictEqual(track.style.transform, 'translateX(-400%)');

  // Step 5 -> Step 6
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 6);
  assert.strictEqual(tagEl.textContent, 'Step 6 / 6');
  assert.strictEqual(track.style.transform, 'translateX(-500%)');
  assert.strictEqual(prevBtn.style.display, 'inline-flex');
  assert.strictEqual(nextBtn.style.display, 'none', 'Next button must be hidden at Step 6');
  assert.strictEqual(submitBtn.style.display, 'inline-flex', 'Submit CTA must be visible at Step 6');
  assert(env.elements['slide-step-6'].classList.contains('active'), 'Slide 6 must have active class');
  assert(!env.elements['step-content-5'].classList.contains('active'), 'Slide 5 must be inactive');
});

it('stress-tests rapid forward clicking (50 clicks) and clamps strictly at Step 6', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const nextBtn = env.elements['btn-next-step'];

  // Navigate to Step 6
  for (let i = 1; i <= 5; i++) {
    nextBtn.click();
  }
  assert.strictEqual(wizard.state.currentStep, 6);

  // Click 50 additional times rapidly
  for (let i = 0; i < 50; i++) {
    wizard.goToStep(wizard.state.currentStep + 1);
  }

  assert.strictEqual(wizard.state.currentStep, 6, 'Stepper must not exceed Step 6');
  assert.strictEqual(env.elements['quiz-step-tag'].textContent, 'Step 6 / 6');
  assert.strictEqual(env.elements['slide-funnel-track'].style.transform, 'translateX(-500%)');
  assert.strictEqual(env.elements['btn-next-step'].style.display, 'none');
  assert.strictEqual(env.elements['btn-submit-quiz'].style.display, 'inline-flex');
});

it('stress-tests rapid backward clicking (50 clicks) and clamps strictly at Step 1', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const prevBtn = env.elements['btn-prev-step'];

  // Start at Step 6
  wizard.goToStep(6);
  assert.strictEqual(wizard.state.currentStep, 6);

  // Click prev 50 times rapidly
  for (let i = 0; i < 50; i++) {
    prevBtn.click();
  }

  assert.strictEqual(wizard.state.currentStep, 1, 'Stepper must not go below Step 1');
  assert.strictEqual(env.elements['quiz-step-tag'].textContent, 'Step 1 / 6');
  assert.strictEqual(env.elements['slide-funnel-track'].style.transform, 'translateX(-0%)');
  assert.strictEqual(env.elements['btn-prev-step'].style.display, 'none');
  assert.strictEqual(env.elements['btn-next-step'].style.display, 'inline-flex');
});

it('validates programmatic clamp boundaries across hostile numeric inputs', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();

  wizard.goToStep(-999);
  assert.strictEqual(wizard.state.currentStep, 1, 'Negative step clamped to 1');

  wizard.goToStep(0);
  assert.strictEqual(wizard.state.currentStep, 1, 'Step 0 clamped to 1');

  wizard.goToStep(4);
  assert.strictEqual(wizard.state.currentStep, 4, 'Step 4 reached cleanly');

  wizard.goToStep(7);
  assert.strictEqual(wizard.state.currentStep, 6, 'Step 7 clamped to 6');

  wizard.goToStep(1000);
  assert.strictEqual(wizard.state.currentStep, 6, 'Step 1000 clamped to 6');
});

// ============================================================================
console.log('\n--- 3. Preset Selection, Form Field Population & Tanner MPH Badge ---');
// ============================================================================

it('preset-1 (영유아 3세 남아): populates biometrics and calculates Tanner MPH (175.0cm ±8.5cm)', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();

  // Trigger Preset 1
  env.elements['preset-card-1'].click();

  // Biometrics population
  assert.strictEqual(env.elements['gender-boy'].checked, true, 'Gender must be boy');
  assert.strictEqual(env.elements['child-age-slider'].value, 3, 'Age slider 3');
  assert.strictEqual(env.elements['child-age-months'].value, 36, 'Age months 36');
  assert.strictEqual(env.elements['child-height'].value, 96.5, 'Height 96.5');
  assert.strictEqual(env.elements['child-weight'].value, 14.7, 'Weight 14.7');
  assert.strictEqual(env.elements['child-recent-gain'].value, 3.5, 'Recent gain 3.5');
  assert.strictEqual(env.elements['father-height'].value, 175.0, 'Father height 175.0');
  assert.strictEqual(env.elements['mother-height'].value, 162.0, 'Mother height 162.0');
  assert.strictEqual(env.elements['phase-1'].checked, true, 'Tanner phase 1 checked');
  assert.strictEqual(env.elements['habit-picky-eater'].checked, true, 'Picky eater habit checked');
  assert.strictEqual(env.elements['cog-arts'].checked, true, 'Sensory arts cognitive checked');
  assert(env.elements['preset-card-1'].classList.contains('active'), 'Preset card 1 highlighted');

  // Tanner MPH formula: (175.0 + 162.0 + 13.0) / 2.0 = 175.0 cm (±8.5cm: 166.5cm ~ 183.5cm)
  const badgeHTML = env.elements['mph-badge-value'].innerHTML;
  assert(badgeHTML.includes('175.0 cm'), `MPH badge must contain 175.0 cm: ${badgeHTML}`);
  assert(badgeHTML.includes('166.5cm ~ 183.5cm'), `MPH badge must contain ±8.5 range: ${badgeHTML}`);
});

it('preset-2 (아동기 7세 여아): populates biometrics and calculates Tanner MPH (163.0cm ±8.5cm)', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();

  env.elements['preset-card-2'].click();

  assert.strictEqual(env.elements['gender-girl'].checked, true, 'Gender must be girl');
  assert.strictEqual(env.elements['child-age-slider'].value, 7, 'Age slider 7');
  assert.strictEqual(env.elements['child-age-months'].value, 84, 'Age months 84');
  assert.strictEqual(env.elements['child-height'].value, 120.8, 'Height 120.8');
  assert.strictEqual(env.elements['child-weight'].value, 23.6, 'Weight 23.6');
  assert.strictEqual(env.elements['father-height'].value, 176.0, 'Father 176.0');
  assert.strictEqual(env.elements['mother-height'].value, 163.0, 'Mother 163.0');
  assert.strictEqual(env.elements['habit-poor-posture'].checked, true, 'Poor posture checked');
  assert.strictEqual(env.elements['cog-math'].checked, true, 'Math logic checked');
  assert(env.elements['preset-card-2'].classList.contains('active'), 'Preset card 2 highlighted');

  // Tanner MPH formula: (176.0 + 163.0 - 13.0) / 2.0 = 163.0 cm (±8.5cm: 154.5cm ~ 171.5cm)
  const badgeHTML = env.elements['mph-badge-value'].innerHTML;
  assert(badgeHTML.includes('163.0 cm'), `MPH badge must contain 163.0 cm: ${badgeHTML}`);
  assert(badgeHTML.includes('154.5cm ~ 171.5cm'), `MPH badge must contain ±8.5 range: ${badgeHTML}`);
});

it('preset-3 (사춘기 10세 남아): populates biometrics and calculates Tanner MPH (173.5cm ±8.5cm)', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();

  env.elements['preset-card-3'].click();

  assert.strictEqual(env.elements['gender-boy'].checked, true, 'Gender must be boy');
  assert.strictEqual(env.elements['child-age-slider'].value, 10, 'Age slider 10');
  assert.strictEqual(env.elements['child-age-months'].value, 120, 'Age months 120');
  assert.strictEqual(env.elements['child-height'].value, 137.0, 'Height 137.0');
  assert.strictEqual(env.elements['child-weight'].value, 35.5, 'Weight 35.5');
  assert.strictEqual(env.elements['father-height'].value, 173.5, 'Father 173.5');
  assert.strictEqual(env.elements['mother-height'].value, 160.5, 'Mother 160.5');
  assert.strictEqual(env.elements['phase-2'].checked, true, 'Tanner phase 2 checked');
  assert.strictEqual(env.elements['habit-late-sleep'].checked, true, 'Late sleep checked');
  assert.strictEqual(env.elements['cog-science'].checked, true, 'Science nature checked');

  // Tanner MPH formula: (173.5 + 160.5 + 13.0) / 2.0 = 173.5 cm (±8.5cm: 165.0cm ~ 182.0cm)
  const badgeHTML = env.elements['mph-badge-value'].innerHTML;
  assert(badgeHTML.includes('173.5 cm'), `MPH badge must contain 173.5 cm: ${badgeHTML}`);
  assert(badgeHTML.includes('165.0cm ~ 182.0cm'), `MPH badge must contain ±8.5 range: ${badgeHTML}`);
});

it('preset-4 (급성장 13세 남아): populates biometrics and calculates Tanner MPH (174.0cm ±8.5cm)', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();

  env.elements['preset-card-4'].click();

  assert.strictEqual(env.elements['gender-boy'].checked, true, 'Gender must be boy');
  assert.strictEqual(env.elements['child-age-slider'].value, 13, 'Age slider 13');
  assert.strictEqual(env.elements['child-height'].value, 155.6, 'Height 155.6');
  assert.strictEqual(env.elements['child-weight'].value, 51.0, 'Weight 51.0');
  assert.strictEqual(env.elements['father-height'].value, 174.0, 'Father 174.0');
  assert.strictEqual(env.elements['mother-height'].value, 161.0, 'Mother 161.0');
  assert.strictEqual(env.elements['habit-late-sleep'].checked, true);
  assert.strictEqual(env.elements['habit-night-carbs'].checked, true);
  assert.strictEqual(env.elements['cog-exec'].checked, true);

  // Tanner MPH formula: (174.0 + 161.0 + 13.0) / 2.0 = 174.0 cm (±8.5cm: 165.5cm ~ 182.5cm)
  const badgeHTML = env.elements['mph-badge-value'].innerHTML;
  assert(badgeHTML.includes('174.0 cm'), `MPH badge must contain 174.0 cm: ${badgeHTML}`);
  assert(badgeHTML.includes('165.5cm ~ 182.5cm'), `MPH badge must contain ±8.5 range: ${badgeHTML}`);
});

it('preset-5 (청소년 16세 여아): populates biometrics and calculates Tanner MPH (164.0cm ±8.5cm)', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();

  env.elements['preset-card-5'].click();

  assert.strictEqual(env.elements['gender-girl'].checked, true, 'Gender must be girl');
  assert.strictEqual(env.elements['child-age-slider'].value, 16, 'Age slider 16');
  assert.strictEqual(env.elements['child-height'].value, 160.0, 'Height 160.0');
  assert.strictEqual(env.elements['child-weight'].value, 54.1, 'Weight 54.1');
  assert.strictEqual(env.elements['father-height'].value, 177.0, 'Father 177.0');
  assert.strictEqual(env.elements['mother-height'].value, 164.0, 'Mother 164.0');
  assert.strictEqual(env.elements['phase-4'].checked, true, 'Phase 4 checked');
  assert.strictEqual(env.elements['cog-lang'].checked, true, 'Language reading checked');

  // Tanner MPH formula: (177.0 + 164.0 - 13.0) / 2.0 = 164.0 cm (±8.5cm: 155.5cm ~ 172.5cm)
  const badgeHTML = env.elements['mph-badge-value'].innerHTML;
  assert(badgeHTML.includes('164.0 cm'), `MPH badge must contain 164.0 cm: ${badgeHTML}`);
  assert(badgeHTML.includes('155.5cm ~ 172.5cm'), `MPH badge must contain ±8.5 range: ${badgeHTML}`);
});

it('dynamically recalculates Tanner MPH badge when user manually modifies father/mother inputs', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const fatherInput = env.elements['father-height'];
  const motherInput = env.elements['mother-height'];
  const boyRadio = env.elements['gender-boy'];
  const girlRadio = env.elements['gender-girl'];

  // Test boy: father 180.0, mother 165.0 => (180 + 165 + 13)/2 = 179.0 cm (±8.5cm: 170.5 ~ 187.5)
  fatherInput.value = '180.0';
  motherInput.value = '165.0';
  boyRadio.checked = true;
  girlRadio.checked = false;
  fatherInput.dispatchEvent('input');

  let badgeHTML = env.elements['mph-badge-value'].innerHTML;
  assert(badgeHTML.includes('179.0 cm'), `Expected 179.0 cm for boy, got: ${badgeHTML}`);
  assert(badgeHTML.includes('170.5cm ~ 187.5cm'), `Expected range 170.5~187.5cm: ${badgeHTML}`);

  // Switch to girl: (180 + 165 - 13)/2 = 166.0 cm (±8.5cm: 157.5 ~ 174.5)
  boyRadio.checked = false;
  girlRadio.checked = true;
  girlRadio.dispatchEvent('change');

  badgeHTML = env.elements['mph-badge-value'].innerHTML;
  assert(badgeHTML.includes('166.0 cm'), `Expected 166.0 cm for girl, got: ${badgeHTML}`);
  assert(badgeHTML.includes('157.5cm ~ 174.5cm'), `Expected range 157.5~174.5cm: ${badgeHTML}`);
});

// ============================================================================
console.log('\n--- 4. Strict Non-Visibility of #results-dashboard Until Scan Completes ---');
// ============================================================================

it('#results-dashboard is strictly hidden with display:none and .hidden on initial page load', () => {
  const env = createFunnelEnvironment();
  const dashboard = env.elements['results-dashboard'];

  assert(dashboard.classList.contains('hidden'), '#results-dashboard must have .hidden initially');
  assert.strictEqual(dashboard.style.display, 'none', '#results-dashboard style.display must be none');
  assert.strictEqual(env.elements['quiz-section'].style.display || 'block', 'block', '#quiz-section must be visible');
});

it('#results-dashboard remains strictly hidden across all intermediate navigation steps (1 to 6)', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const dashboard = env.elements['results-dashboard'];
  const nextBtn = env.elements['btn-next-step'];

  for (let s = 1; s <= 6; s++) {
    wizard.goToStep(s);
    assert(dashboard.classList.contains('hidden'), `#results-dashboard must stay hidden on Step ${s}`);
    assert.strictEqual(dashboard.style.display, 'none', `#results-dashboard style.display must be none on Step ${s}`);
  }
});

it('#results-dashboard remains strictly hidden while 3-second scan animation is active', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const dashboard = env.elements['results-dashboard'];
  const overlay = env.elements['analysis-overlay'];

  // Start 3s scan
  wizard.start3SecondScan();

  // Overlay is active
  assert.strictEqual(overlay.style.display, 'flex', 'Overlay must be active');
  assert.strictEqual(wizard.state.isScanning, true, 'isScanning must be true');

  // Verify at t = 0ms
  assert(dashboard.classList.contains('hidden'), 'Dashboard must remain hidden at t=0ms');
  assert.strictEqual(dashboard.style.display, 'none');

  // Step 1: 500ms (KDCA/CDC)
  env.advanceTime(500);
  assert(dashboard.classList.contains('hidden'), 'Dashboard must remain hidden at t=500ms');
  assert.strictEqual(dashboard.style.display, 'none');

  // Step 2: 1500ms (800+ papers)
  env.advanceTime(1000);
  assert.strictEqual(env.elements['analysis-title'].textContent, '800편+ 소아내분비·뇌과학 학술 논문 매칭 중...');
  assert(dashboard.classList.contains('hidden'), 'Dashboard must remain hidden at t=1500ms');
  assert.strictEqual(dashboard.style.display, 'none');

  // Step 3: 2500ms (90-day roadmap)
  env.advanceTime(1000);
  assert.strictEqual(env.elements['analysis-title'].textContent, '향후 90일 맞춤 지도 로드맵(Actionable Guidance) 생성 중...');
  assert(dashboard.classList.contains('hidden'), 'Dashboard must remain hidden at t=2500ms');
  assert.strictEqual(dashboard.style.display, 'none');
});

it('#results-dashboard is revealed ONLY when scan completes (t >= 3000ms), and funnel is hidden', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const dashboard = env.elements['results-dashboard'];
  const overlay = env.elements['analysis-overlay'];
  const quizSection = env.elements['quiz-section'];

  let scanCallbackInvoked = false;
  wizard.start3SecondScan(() => {
    scanCallbackInvoked = true;
  });

  // Advance clock past 3000ms threshold
  env.advanceTime(3100);

  assert.strictEqual(scanCallbackInvoked, true, 'Scan callback must be invoked');
  assert.strictEqual(wizard.state.scanCompleted, true, 'scanCompleted must be true');
  assert.strictEqual(wizard.state.isScanning, false, 'isScanning must be false');
  assert.strictEqual(overlay.style.display, 'none', 'Overlay must be hidden');

  // Now and ONLY now: results dashboard is revealed
  assert(!dashboard.classList.contains('hidden'), '#results-dashboard must NOT have .hidden after scan');
  assert.strictEqual(dashboard.style.display, 'block', '#results-dashboard style.display must be block');

  // Phase 1 funnel elements hidden
  assert.strictEqual(quizSection.style.display, 'none', '#quiz-section must be hidden in Phase 2');
  assert.strictEqual(env.elements['hero-section'].style.display, 'none', '#hero-section must be hidden in Phase 2');
  assert.strictEqual(env.elements['quick-presets-bar'].style.display, 'none', '#quick-presets-bar must be hidden in Phase 2');
});

it('instant skip button (#btn-skip-scan) completes scan and reveals #results-dashboard immediately', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const dashboard = env.elements['results-dashboard'];
  const overlay = env.elements['analysis-overlay'];
  const skipBtn = env.elements['btn-skip-scan'];

  wizard.start3SecondScan();
  assert.strictEqual(dashboard.style.display, 'none', 'Dashboard hidden before skip');

  // Click skip
  skipBtn.click();

  assert.strictEqual(wizard.state.scanCompleted, true, 'scanCompleted must be true after skip');
  assert.strictEqual(overlay.style.display, 'none', 'Overlay must be hidden after skip');
  assert(!dashboard.classList.contains('hidden'), '#results-dashboard .hidden must be removed');
  assert.strictEqual(dashboard.style.display, 'block', '#results-dashboard must be block after skip');
});

it('clicking #btn-retest re-hides #results-dashboard, restores Phase 1 funnel, and resets to Step 1', () => {
  const env = createFunnelEnvironment();
  const wizard = env.getWizard();
  const dashboard = env.elements['results-dashboard'];
  const quizSection = env.elements['quiz-section'];
  const retestBtn = env.elements['btn-retest'];

  // Complete scan first
  wizard.start3SecondScan();
  env.elements['btn-skip-scan'].click();
  assert.strictEqual(dashboard.style.display, 'block');

  // User clicks [🔄 정보 다시 입력하기]
  retestBtn.click();

  assert(dashboard.classList.contains('hidden'), '#results-dashboard must have .hidden restored');
  assert.strictEqual(dashboard.style.display, 'none', '#results-dashboard must be hidden');
  assert.strictEqual(quizSection.style.display, 'block', '#quiz-section must be restored');
  assert.strictEqual(env.elements['hero-section'].style.display, 'block', '#hero-section must be restored');
  assert.strictEqual(env.elements['quick-presets-bar'].style.display, 'block', '#quick-presets-bar must be restored');
  assert.strictEqual(wizard.state.currentStep, 1, 'Wizard must reset back to Step 1');
  assert.strictEqual(env.elements['quiz-step-tag'].textContent, 'Step 1 / 6', 'Tag shows Step 1 / 6');
  assert.strictEqual(env.elements['slide-funnel-track'].style.transform, 'translateX(-0%)', 'Track resets to 0%');
});

// ============================================================================
// Final Summary & Exit
// ============================================================================
console.log('========================================================================');
console.log(`TOTAL PHASE 1 STRESS TESTS : ${totalTests}`);
console.log(`PASSED                     : ${passedTests}`);
console.log(`FAILED                     : ${failedTests}`);
console.log('========================================================================');

if (failedTests > 0) {
  console.error('\n❌ FAILURE DETAILS:');
  failures.forEach((f, idx) => {
    console.error(`[${idx + 1}] ${f.title}`);
    console.error(`    ${f.error}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ ALL PHASE 1 ONBOARDING FUNNEL STRESS TESTS PASSED EMPIRICALLY!');
  process.exit(0);
}
