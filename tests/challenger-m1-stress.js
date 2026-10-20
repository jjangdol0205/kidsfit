/**
 * tests/challenger-m1-stress.js
 * Empirical Adversarial Challenger Harness for Milestone 1 (Taller Bio Labs Overhaul)
 * 
 * Tests:
 * 1. Traversing Steps 1 through 5 with #btn-next-step clicks.
 *    Verifies zero alert popups, clean state progression, step class toggling, and boundary clamping.
 * 2. Language & Unit toggling with #btn-lang-toggle clicks.
 *    Verifies lang attribute, localStorage persistence, unit labels, and input value/bound conversions.
 * 3. Boundary validation:
 *    - 12m and 240m (and invalid 11m, 241m)
 *    - 5 lbs and 350 lbs (and invalid 4 lbs, 355 lbs)
 *    - 20 in and 90 in (and invalid 17 in, 91 in)
 *    - Metric boundaries: 45~230 cm, 2~160 kg, 0~20 cm gain
 * 4. Rapid click stress testing (50 rapid next-clicks, 100 rapid lang-toggles).
 * 5. Corrupted/XSS input injection into biometrics.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const I18N_PATH = path.join(ROOT_DIR, 'src', 'js', 'i18n.js');
const THEME_PATH = path.join(ROOT_DIR, 'src', 'js', 'theme-switcher.js');
const WIZARD_PATH = path.join(ROOT_DIR, 'src', 'js', 'onboarding-wizard.js');
const APP_PATH = path.join(ROOT_DIR, 'src', 'js', 'app.js');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${title}`);
    console.error(`         ${err.message}`);
    failedChecks++;
    failures.push({ title, error: err.message, stack: err.stack });
  }
}

// Build an accurate Mock DOM matching index.html
function buildLiveDOM() {
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
      const type = typeof evt === 'string' ? evt : evt.type;
      const fns = (listeners[this.id] && listeners[this.id][type]) || [];
      fns.forEach(fn => fn(evt));
    }
    click() {
      this.dispatchEvent({ type: 'click', preventDefault: () => {} });
    }
    focus() { this.focused = true; }
    scrollIntoView() {}
  }

  // Parse IDs from index.html
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
    const placeholderMatch = fullTag.match(/placeholder=["']([^"']+)["']/i);

    const el = new MockElement(id, tag, nameMatch ? nameMatch[1] : null, valueMatch ? valueMatch[1] : '', typeMatch ? typeMatch[1] : null, checked);
    if (minMatch) el.min = minMatch[1];
    if (maxMatch) el.max = maxMatch[1];
    if (placeholderMatch) el.placeholder = placeholderMatch[1];
    elements[id] = el;
  }

  // Parse elements with class .unit-label-height and .unit-label-weight
  const heightUnitLabels = [];
  const weightUnitLabels = [];
  const heightUnitRegex = /class=["'][^"']*unit-label-height[^"']*["'][^>]*>([^<]*)</gi;
  let hm;
  let hIdx = 0;
  while ((hm = heightUnitRegex.exec(html)) !== null) {
    const el = new MockElement(`unit-h-${hIdx++}`, 'span');
    el.textContent = hm[1];
    el.classList.add('unit-label-height');
    heightUnitLabels.push(el);
  }

  const weightUnitRegex = /class=["'][^"']*unit-label-weight[^"']*["'][^>]*>([^<]*)</gi;
  let wm;
  let wIdx = 0;
  while ((wm = weightUnitRegex.exec(html)) !== null) {
    const el = new MockElement(`unit-w-${wIdx++}`, 'span');
    el.textContent = wm[1];
    el.classList.add('unit-label-weight');
    weightUnitLabels.push(el);
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
      if (sel === '.unit-label-height') return heightUnitLabels;
      if (sel === '.unit-label-weight') return weightUnitLabels;
      if (sel === '.capsule-tab') {
        ['tab-btn-auxology', 'tab-btn-endocrinology', 'tab-btn-biomechanics', 'tab-btn-neuro', 'tab-btn-tracker'].forEach(id => {
          if (elements[id]) res.push(elements[id]);
        });
        return res;
      }
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
        ['habit-late-sleep', 'habit-night-carbs', 'habit-poor-posture', 'habit-picky-eater', 'habit-sedentary'].forEach(id => {
          if (elements[id] && elements[id].checked) res.push(elements[id]);
        });
        return res;
      }
      if (sel === 'input[name="growth-habits"]') {
        ['habit-late-sleep', 'habit-night-carbs', 'habit-poor-posture', 'habit-picky-eater', 'habit-sedentary'].forEach(id => {
          if (elements[id]) res.push(elements[id]);
        });
        return res;
      }
      if (sel.includes('input[name="cognitive-axes"]:checked')) {
        ['cog-math', 'cog-lang', 'cog-science', 'cog-arts', 'cog-exec'].forEach(id => {
          if (elements[id] && elements[id].checked) res.push(elements[id]);
        });
        return res;
      }
      if (sel === 'input[name="cognitive-axes"]') {
        ['cog-math', 'cog-lang', 'cog-science', 'cog-arts', 'cog-exec'].forEach(id => {
          if (elements[id]) res.push(elements[id]);
        });
        return res;
      }
      if (sel === '[data-i18n]') return [];
      if (sel === '[data-i18n-html]') return [];
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
      (docListeners[evt.type] || []).forEach(fn => fn(evt));
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
    location: { search: '' },
    alert: (msg) => { alertLog.push(msg); },
    addEventListener: (evt, fn) => {
      if (!winListeners[evt]) winListeners[evt] = [];
      winListeners[evt].push(fn);
    },
    dispatchEvent: (evt) => {
      (winListeners[evt.type] || []).forEach(fn => fn(evt));
    },
    navigator: { language: 'ko' }
  };

  // Build Sandbox
  const sandbox = {
    window: win,
    document: doc,
    localStorage: win.localStorage,
    navigator: win.navigator,
    alert: win.alert,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init ? init.detail : undefined;
      }
    },
    Math: Math,
    Date: Date,
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

  // Run scripts
  [I18N_PATH, THEME_PATH, WIZARD_PATH, APP_PATH].forEach(f => {
    const code = fs.readFileSync(f, 'utf8');
    vm.runInContext(code, sandbox);
  });

  // Fire DOMContentLoaded
  doc.dispatchEvent({ type: 'DOMContentLoaded' });
  win.dispatchEvent({ type: 'DOMContentLoaded' });

  return {
    win,
    doc,
    elements,
    alertLog,
    sandbox,
    heightUnitLabels,
    weightUnitLabels
  };
}

console.log('================================================================');
console.log('   Challenger M1-3: Live DOM, Stepper & Boundary Stress Suite  ');
console.log('================================================================\n');

// ============================================================================
console.log('--- TEST 1: Traversing Steps 1 through 5 with #btn-next-step ---');
// ============================================================================

check('Traversal Step 1 -> 2 -> 3 -> 4 -> 5 with #btn-next-step has 0 alerts and clean state progression', () => {
  const dom = buildLiveDOM();
  const wizard = dom.win.TallerOnboardingWizard;
  const nextBtn = dom.elements['btn-next-step'];
  const prevBtn = dom.elements['btn-prev-step'];
  const tagEl = dom.elements['quiz-step-tag'];
  const progressText = dom.elements['quiz-progress-text'];

  // Initial State: Step 1
  assert.strictEqual(wizard.state.currentStep, 1, 'Initial step must be 1');
  assert(dom.elements['step-content-1'].classList.contains('active'), 'Step 1 container must be active');
  assert.strictEqual(nextBtn.style.display, 'inline-flex', 'Next button visible on Step 1');
  assert.strictEqual(prevBtn.style.display, 'none', 'Prev button hidden on Step 1');
  assert.strictEqual(dom.alertLog.length, 0, 'No alerts initially');

  // Click 1: Step 1 -> Step 2
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 2, 'Must advance to Step 2');
  assert(dom.elements['step-content-2'].classList.contains('active'), 'Step 2 container must be active');
  assert(!dom.elements['step-content-1'].classList.contains('active'), 'Step 1 container must be inactive');
  assert.strictEqual(tagEl.textContent, 'Step 2 / 5');
  assert.strictEqual(progressText.textContent, '40% 완료');
  assert.strictEqual(prevBtn.style.display, 'inline-flex', 'Prev button visible on Step 2');
  assert.strictEqual(dom.alertLog.length, 0, 'No alerts after Step 1 -> 2');

  // Click 2: Step 2 -> Step 3
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 3, 'Must advance to Step 3');
  assert(dom.elements['step-content-3'].classList.contains('active'), 'Step 3 container must be active');
  assert.strictEqual(tagEl.textContent, 'Step 3 / 5');
  assert.strictEqual(progressText.textContent, '60% 완료');
  assert.strictEqual(dom.alertLog.length, 0, 'No alerts after Step 2 -> 3');

  // Click 3: Step 3 -> Step 4 (Critical: must NOT fire kdst alert!)
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 4, 'Must advance to Step 4 cleanly');
  assert(dom.elements['step-content-4'].classList.contains('active'), 'Step 4 container must be active');
  assert.strictEqual(tagEl.textContent, 'Step 4 / 5');
  assert.strictEqual(progressText.textContent, '80% 완료');
  assert.strictEqual(dom.alertLog.length, 0, 'Zero alerts after Step 3 -> 4');

  // Click 4: Step 4 -> Step 5
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 5, 'Must advance to Step 5');
  assert(dom.elements['step-content-5'].classList.contains('active'), 'Step 5 container must be active');
  assert.strictEqual(tagEl.textContent, 'Step 5 / 5');
  assert.strictEqual(progressText.textContent, '100% 완료');
  assert.strictEqual(dom.alertLog.length, 0, 'Zero alerts after Step 4 -> 5');

  // Clamping check: Click Next on Step 5
  nextBtn.click();
  assert.strictEqual(wizard.state.currentStep, 5, 'Must remain clamped at Step 5');
  assert.strictEqual(dom.alertLog.length, 0, 'No alerts on overflow click');

  // Traverse backwards: 5 -> 4 -> 3 -> 2 -> 1
  prevBtn.click();
  assert.strictEqual(wizard.state.currentStep, 4, 'Must retreat to Step 4');
  prevBtn.click();
  assert.strictEqual(wizard.state.currentStep, 3, 'Must retreat to Step 3');
  prevBtn.click();
  assert.strictEqual(wizard.state.currentStep, 2, 'Must retreat to Step 2');
  prevBtn.click();
  assert.strictEqual(wizard.state.currentStep, 1, 'Must retreat to Step 1');
  assert.strictEqual(prevBtn.style.display, 'none', 'Prev button hidden on Step 1');
  assert.strictEqual(dom.alertLog.length, 0, 'Total alerts across bidirectional traversal must be 0');
});

check('Rapid-fire clicking #btn-next-step (50 cycles) maintains integrity and state bounds', () => {
  const dom = buildLiveDOM();
  const wizard = dom.win.TallerOnboardingWizard;
  const nextBtn = dom.elements['btn-next-step'];

  for (let i = 0; i < 50; i++) {
    nextBtn.click();
  }
  assert.strictEqual(wizard.state.currentStep, 5, 'Must be clamped at 5');
  assert.strictEqual(dom.alertLog.length, 0, 'No alerts during rapid clicking');
});

// ============================================================================
console.log('\n--- TEST 2: Language & Unit Toggling with #btn-lang-toggle ---');
// ============================================================================

check('Clicking #btn-lang-toggle updates DOM language, unit labels, placeholders, and persists', () => {
  const dom = buildLiveDOM();
  const i18n = dom.win.TallerI18n;
  const langBtn = dom.elements['btn-lang-toggle'];

  // Baseline KO
  assert.strictEqual(dom.doc.documentElement.lang, 'ko', 'Initial lang is ko');
  assert.strictEqual(i18n.getLanguage(), 'ko');
  assert.strictEqual(i18n.getUnitSystem(), 'metric');
  assert(langBtn.textContent.includes('EN'), 'Button should invite toggle to EN');
  dom.heightUnitLabels.forEach(el => assert.strictEqual(el.textContent, 'cm'));
  dom.weightUnitLabels.forEach(el => assert.strictEqual(el.textContent, 'kg'));

  // 1st Click -> Toggle to EN
  langBtn.click();
  assert.strictEqual(dom.doc.documentElement.lang, 'en', 'DOM lang updated to en');
  assert.strictEqual(i18n.getLanguage(), 'en');
  assert.strictEqual(i18n.getUnitSystem(), 'imperial');
  assert.strictEqual(dom.win.localStorage.getItem('taller_lang'), 'en');
  assert.strictEqual(dom.win.localStorage.getItem('taller_unit'), 'imperial');
  assert(langBtn.textContent.includes('KO'), 'Button now invites toggle back to KO');

  // Verify unit labels updated
  dom.heightUnitLabels.forEach(el => assert(el.textContent.includes('in')));
  dom.weightUnitLabels.forEach(el => assert.strictEqual(el.textContent, 'lbs'));

  // Verify input conversion
  const hVal = parseFloat(dom.elements['child-height'].value);
  assert(Math.abs(hVal - 53.9) < 0.2, `Expected ~53.9 inches, got ${hVal}`);
  assert.strictEqual(dom.elements['child-height'].min, '18');
  assert.strictEqual(dom.elements['child-height'].max, '90');

  const wVal = parseFloat(dom.elements['child-weight'].value);
  assert(Math.abs(wVal - 78.3) < 0.3, `Expected ~78.3 lbs, got ${wVal}`);
  assert.strictEqual(dom.elements['child-weight'].min, '5');
  assert.strictEqual(dom.elements['child-weight'].max, '350');

  // 2nd Click -> Toggle back to KO
  langBtn.click();
  assert.strictEqual(dom.doc.documentElement.lang, 'ko', 'DOM lang updated back to ko');
  assert.strictEqual(i18n.getLanguage(), 'ko');
  assert.strictEqual(i18n.getUnitSystem(), 'metric');
  assert.strictEqual(dom.win.localStorage.getItem('taller_lang'), 'ko');
  assert.strictEqual(dom.win.localStorage.getItem('taller_unit'), 'metric');

  dom.heightUnitLabels.forEach(el => assert.strictEqual(el.textContent, 'cm'));
  dom.weightUnitLabels.forEach(el => assert.strictEqual(el.textContent, 'kg'));

  assert.strictEqual(dom.elements['child-height'].min, '45');
  assert.strictEqual(dom.elements['child-height'].max, '230');
  assert.strictEqual(dom.elements['child-weight'].min, '2');
  assert.strictEqual(dom.elements['child-weight'].max, '160');
});

check('Rapid lang toggling (100 cycles) maintains strict parity without drifting', () => {
  const dom = buildLiveDOM();
  const langBtn = dom.elements['btn-lang-toggle'];

  for (let i = 0; i < 100; i++) {
    langBtn.click();
  }
  // After 100 clicks from KO, state must be KO
  assert.strictEqual(dom.doc.documentElement.lang, 'ko');
  assert.strictEqual(dom.win.localStorage.getItem('taller_lang'), 'ko');
  assert.strictEqual(dom.win.localStorage.getItem('taller_unit'), 'metric');
});

// ============================================================================
console.log('\n--- TEST 3: Boundary Value Validation ---');
// ============================================================================

check('Age boundaries: 12m and 240m pass; 11m, 241m, 0m fail', () => {
  const dom = buildLiveDOM();
  const app = dom.win.KidsFitApp;
  const ageMonthsInput = dom.elements['child-age-months'];

  // 12 months (1 yr) -> PASS
  ageMonthsInput.value = '12';
  dom.alertLog.length = 0;
  assert.strictEqual(app.validateStep(1), true, '12m should pass');
  assert.strictEqual(dom.alertLog.length, 0);

  // 240 months (20 yrs) -> PASS
  ageMonthsInput.value = '240';
  dom.alertLog.length = 0;
  assert.strictEqual(app.validateStep(1), true, '240m should pass');
  assert.strictEqual(dom.alertLog.length, 0);

  // 11 months -> FAIL
  ageMonthsInput.value = '11';
  dom.alertLog.length = 0;
  assert.strictEqual(app.validateStep(1), false, '11m must fail');
  assert(dom.alertLog.length > 0, 'Alert must be logged for 11m');
  assert(dom.alertLog[0].includes('12~240개월') || dom.alertLog[0].includes('12'), 'Alert should mention 12~240개월');

  // 241 months -> FAIL
  ageMonthsInput.value = '241';
  dom.alertLog.length = 0;
  assert.strictEqual(app.validateStep(1), false, '241m must fail');
  assert(dom.alertLog.length > 0, 'Alert must be logged for 241m');

  // 0 months -> FAIL
  ageMonthsInput.value = '0';
  dom.alertLog.length = 0;
  assert.strictEqual(app.validateStep(1), false, '0m must fail');
  assert(dom.alertLog.length > 0);
});

check('Imperial weight boundaries: 5 lbs and 350 lbs pass; 4 lbs and 355 lbs fail', () => {
  const dom = buildLiveDOM();
  const wizard = dom.win.TallerOnboardingWizard;
  const langBtn = dom.elements['btn-lang-toggle'];

  // Switch to Imperial
  langBtn.click();
  assert.strictEqual(dom.win.TallerI18n.getUnitSystem(), 'imperial');

  // 5.0 lbs -> PASS (5 / 2.20462 = 2.268 kg >= 2.0 kg)
  dom.elements['child-weight'].value = '5.0';
  dom.elements['child-height'].value = '54.0';
  dom.elements['child-recent-gain'].value = '1.0';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), true, '5 lbs should pass');
  assert.strictEqual(dom.alertLog.length, 0, 'No alert for 5 lbs');

  // 350.0 lbs -> PASS (350 / 2.20462 = 158.75 kg <= 160.0 kg)
  dom.elements['child-weight'].value = '350.0';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), true, '350 lbs should pass');
  assert.strictEqual(dom.alertLog.length, 0, 'No alert for 350 lbs');

  // 4.0 lbs -> FAIL (4 / 2.20462 = 1.81 kg < 2.0 kg)
  dom.elements['child-weight'].value = '4.0';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), false, '4 lbs must fail');
  assert(dom.alertLog.length > 0, 'Alert expected for 4 lbs');
  assert(dom.alertLog[0].includes('5 to 350 lbs'), `Alert text mismatch: ${dom.alertLog[0]}`);

  // 355.0 lbs -> FAIL (355 / 2.20462 = 161.02 kg > 160.0 kg)
  dom.elements['child-weight'].value = '355.0';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), false, '355 lbs must fail');
  assert(dom.alertLog.length > 0, 'Alert expected for 355 lbs');
  assert(dom.alertLog[0].includes('5 to 350 lbs'));
});

check('Imperial height boundaries: 20 in and 90 in pass; 17 in and 91 in fail', () => {
  const dom = buildLiveDOM();
  const wizard = dom.win.TallerOnboardingWizard;
  const langBtn = dom.elements['btn-lang-toggle'];

  // Switch to Imperial
  langBtn.click();
  assert.strictEqual(dom.win.TallerI18n.getUnitSystem(), 'imperial');

  dom.elements['child-weight'].value = '70.0';
  dom.elements['child-recent-gain'].value = '1.0';

  // 20.0 in -> PASS (20 * 2.54 = 50.8 cm >= 45.0 cm)
  dom.elements['child-height'].value = '20.0';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), true, '20 in should pass');
  assert.strictEqual(dom.alertLog.length, 0);

  // 90.0 in -> PASS (90 * 2.54 = 228.6 cm <= 230.0 cm)
  dom.elements['child-height'].value = '90.0';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), true, '90 in should pass');
  assert.strictEqual(dom.alertLog.length, 0);

  // 17.0 in -> FAIL (17 * 2.54 = 43.18 cm < 45.0 cm)
  dom.elements['child-height'].value = '17.0';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), false, '17 in must fail');
  assert(dom.alertLog.length > 0);
  assert(dom.alertLog[0].includes('18 to 90 inches'));

  // 91.0 in -> FAIL (91 * 2.54 = 231.14 cm > 230.0 cm)
  dom.elements['child-height'].value = '91.0';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), false, '91 in must fail');
  assert(dom.alertLog.length > 0);
  assert(dom.alertLog[0].includes('18 to 90 inches'));
});

check('Metric clinical boundaries: [45.0~230.0 cm], [2.0~160.0 kg], [0.0~20.0 cm gain]', () => {
  const dom = buildLiveDOM();
  const wizard = dom.win.TallerOnboardingWizard;

  // Metric mode
  assert.strictEqual(dom.win.TallerI18n.getUnitSystem(), 'metric');

  // Exact min bounds
  dom.elements['child-height'].value = '45.0';
  dom.elements['child-weight'].value = '2.0';
  dom.elements['child-recent-gain'].value = '0.0';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), true, 'Min bounds [45cm, 2kg, 0cm] must pass');
  assert.strictEqual(dom.alertLog.length, 0);

  // Exact max bounds
  dom.elements['child-height'].value = '230.0';
  dom.elements['child-weight'].value = '160.0';
  dom.elements['child-recent-gain'].value = '20.0';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), true, 'Max bounds [230cm, 160kg, 20cm] must pass');
  assert.strictEqual(dom.alertLog.length, 0);

  // Height < 45 -> FAIL
  dom.elements['child-height'].value = '44.9';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), false);
  assert(dom.alertLog[0].includes('45cm ~ 230cm'));

  // Height > 230 -> FAIL
  dom.elements['child-height'].value = '230.1';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), false);
  assert(dom.alertLog[0].includes('45cm ~ 230cm'));

  // Weight < 2 -> FAIL
  dom.elements['child-height'].value = '137.0';
  dom.elements['child-weight'].value = '1.9';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), false);
  assert(dom.alertLog[0].includes('2kg ~ 160kg'));

  // Weight > 160 -> FAIL
  dom.elements['child-weight'].value = '160.1';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), false);
  assert(dom.alertLog[0].includes('2kg ~ 160kg'));

  // Gain < 0 -> FAIL
  dom.elements['child-weight'].value = '35.5';
  dom.elements['child-recent-gain'].value = '-0.1';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), false);
  assert(dom.alertLog[0].includes('0 ~ 20cm'));

  // Gain > 20 -> FAIL
  dom.elements['child-recent-gain'].value = '20.1';
  dom.alertLog.length = 0;
  assert.strictEqual(wizard.validateStep(1), false);
  assert(dom.alertLog[0].includes('0 ~ 20cm'));
});

// ============================================================================
console.log('\n--- TEST 4: Hostile / XSS / Corrupted Input Injection ---');
// ============================================================================

check('Hostile strings (XSS, script injection, NaN, Infinity) are safely rejected without throwing', () => {
  const dom = buildLiveDOM();
  const wizard = dom.win.TallerOnboardingWizard;

  const hostilePayloads = [
    '<script>alert("xss")</script>',
    'javascript:alert(1)',
    '"><img src=x onerror=alert(1)>',
    'NaN',
    'Infinity',
    '-Infinity',
    'undefined',
    'null',
    '',
    '   ',
    '1e50',
    '0xdeadbeef',
    '--20',
    'SELECT * FROM users'
  ];

  for (const payload of hostilePayloads) {
    dom.elements['child-height'].value = payload;
    dom.elements['child-weight'].value = '35.5';
    dom.elements['child-recent-gain'].value = '3.0';

    assert.doesNotThrow(() => {
      const valid = wizard.validateStep(1);
      // If parsed as number > 230 or < 45 or NaN, must be rejected
      if (valid !== false) {
        // Only valid if somehow coerced into [45, 230], which none of these should
        assert.fail(`Hostile height "${payload}" should have been rejected but passed!`);
      }
    }, `validateStep threw on hostile payload "${payload}"`);
  }
});

// ============================================================================
console.log('\n--- TEST 5: Preset Card Clicks & Scan Integration ---');
// ============================================================================

check('Clicking all 5 preset cards updates inputs, highlights card, and launches scan', () => {
  const dom = buildLiveDOM();
  const wizard = dom.win.TallerOnboardingWizard;

  let scanInvokedCount = 0;
  dom.win.KidsFitApp.renderPrescriptionResults = () => {
    scanInvokedCount++;
  };

  for (let p = 1; p <= 5; p++) {
    const card = dom.elements[`preset-card-${p}`];
    assert(card, `preset-card-${p} must exist`);
    card.click();

    assert.strictEqual(wizard.state.activePresetId, `preset-${p}`);
    const presetData = wizard.PRESETS[`preset-${p}`];
    assert.strictEqual(dom.elements['child-height'].value, presetData.currentHeight);
    assert.strictEqual(dom.elements['child-weight'].value, presetData.currentWeight);
    assert.strictEqual(wizard.state.isScanning, true, 'Scan must be active on preset click');

    // Fast complete scan
    wizard.completeScan((profile) => {
      dom.win.KidsFitApp.renderPrescriptionResults(profile);
    });
  }
  assert.strictEqual(scanInvokedCount, 5, 'Scan callback must be triggered for all 5 presets');
});

// ============================================================================
console.log('\n--- TEST 6: Single Listener Discipline & Commercial Purge Audit ---');
// ============================================================================

check('Audits single event listener attached to #btn-next-step (no dual-controller conflict)', () => {
  const dom = buildLiveDOM();
  // Check auditor-style test
  const auditResult = require('child_process').spawnSync('node', ['.agents/teamwork/auditor_m1_1/test-interactions.js'], {
    cwd: ROOT_DIR,
    encoding: 'utf8'
  });
  assert.strictEqual(auditResult.status, 0);
  assert(auditResult.stdout.includes('EventListeners on #btn-next-step: 1 (Expected: 1)'));
  assert(auditResult.stdout.includes('EventListeners on #btn-lang-toggle: 1'));
  assert(auditResult.stdout.includes('EventListeners on #btn-theme-toggle: 1'));
});

check('Audits complete absence of hidden commercial price tags in weekend-curator.js and dist', () => {
  const curator = fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'weekend-curator.js'), 'utf8');
  assert(!curator.includes('ref-spec-data'), 'ref-spec-data must be purged from weekend-curator.js');
  assert(!curator.includes('display:none'), 'display:none price tag must be purged');

  const distCuratorPath = path.join(ROOT_DIR, 'dist', 'src', 'js', 'weekend-curator.js');
  if (fs.existsSync(distCuratorPath)) {
    const distCurator = fs.readFileSync(distCuratorPath, 'utf8');
    assert(!distCurator.includes('ref-spec-data'), 'ref-spec-data must be purged from dist');
  }
});

// ============================================================================
console.log('\n================================================================');
console.log(`Summary: ${passedChecks}/${totalChecks} stress checks passed (${failedChecks} failed).`);
console.log('================================================================\n');

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL CHALLENGER M1-3 STRESS CHECKS PASSED EMPIRICALLY!');
  process.exit(0);
}
