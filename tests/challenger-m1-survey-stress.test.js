/**
 * tests/challenger-m1-survey-stress.test.js
 * 
 * Empirical Adversarial Challenger 1 Test Suite:
 * Comprehensive Stress Testing of the 6-Step Onboarding Survey Flow:
 * 1. Entry triggers (#btn-home-start-growth-report, #btn-home-start-learning-report)
 * 2. Step 1 validation decoupling: zero false biometric alerts
 * 3. 6-step flow in Imperial mode (ft/in, lbs) -> Report
 * 4. 6-step flow in Metric mode (cm, kg) -> Report
 * 5. 6-step flow in Brain & Learning LQ mode -> Report
 * 6. Extreme biometric boundaries & rejection thresholds
 * 7. Rapid navigation jitter & bidirectional clamping [1..6]
 * 8. Mid-funnel unit switching with bidirectional fidelity
 * 9. Forensic zero-Hangul verification across wizard states
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
const PINPOINT_PATH = path.join(ROOT_DIR, 'src', 'js', 'pinpoint-curator.js');
const GROWTH_ENGINE_PATH = path.join(ROOT_DIR, 'src', 'js', 'growth-engine.js');
const PAYWALL_PATH = path.join(ROOT_DIR, 'src', 'js', 'global-paywall-edition.js');

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
 * High-fidelity DOM simulation parser extracting real attributes, IDs, and structure from index.html
 */
function createSimulationEnvironment() {
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
      this.style = {};
      this.attributes = {};
      this.textContent = '';
      this.innerHTML = '';
      this.className = '';
      this.disabled = false;
      this.hidden = false;
      this.options = [];
      this.dataset = {};
      this.classList = {
        _set: new Set(),
        add: (...cs) => cs.forEach(c => this.classList._set.add(c)),
        remove: (...cs) => cs.forEach(c => this.classList._set.delete(c)),
        contains: (c) => this.classList._set.has(c),
        toggle: (c, force) => {
          if (force !== undefined) {
            if (force) this.classList._set.add(c);
            else this.classList._set.delete(c);
          } else {
            if (this.classList._set.has(c)) this.classList._set.delete(c);
            else this.classList._set.add(c);
          }
        }
      };
    }

    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
    hasAttribute(k) { return this.attributes[k] !== undefined; }
    removeAttribute(k) { delete this.attributes[k]; }

    focus() { this._focused = true; }
    scrollIntoView() {}

    prepend(...nodes) {}
    appendChild(node) { return node; }
    insertBefore(node, ref) { return node; }
    removeChild(node) { return node; }
    closest(selector) { return this; }
    matches(selector) { return true; }

    querySelector(selector) {
      return documentMock.querySelector(selector);
    }

    querySelectorAll(selector) {
      return documentMock.querySelectorAll(selector);
    }

    addEventListener(event, handler) {
      if (!listeners[this.id]) listeners[this.id] = {};
      if (!listeners[this.id][event]) listeners[this.id][event] = [];
      listeners[this.id][event].push(handler);
    }

    dispatch(event, eventObj = {}) {
      if (listeners[this.id] && listeners[this.id][event]) {
        listeners[this.id][event].forEach(fn => fn(eventObj));
      }
      if (event === 'click' && typeof this.onclick === 'function') {
        this.onclick(eventObj);
      }
    }
  }

  // Parse HTML tags with IDs
  const idRegex = /<([a-zA-Z0-9\-]+)[^>]*\sid=["']([^"']+)["'][^>]*>/g;
  let match;
  while ((match = idRegex.exec(html)) !== null) {
    const tag = match[1];
    const id = match[2];
    const fullTag = match[0];

    const typeMatch = fullTag.match(/type=["']([^"']+)["']/);
    const type = typeMatch ? typeMatch[1] : null;

    const nameMatch = fullTag.match(/name=["']([^"']+)["']/);
    const name = nameMatch ? nameMatch[1] : null;

    const valueMatch = fullTag.match(/value=["']([^"']*)["']/);
    const value = valueMatch ? valueMatch[1] : '';

    const checked = fullTag.includes('checked');
    const el = new MockElement(id, tag, name, value, type, checked);

    // Parse options if select
    if (tag.toLowerCase() === 'select') {
      const selectBlock = html.substring(match.index, html.indexOf('</select>', match.index) + 9);
      const optRegex = /<option[^>]*value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/g;
      let optMatch;
      while ((optMatch = optRegex.exec(selectBlock)) !== null) {
        el.options.push({
          value: optMatch[1],
          text: optMatch[2].trim(),
          disabled: false,
          hidden: false
        });
      }
    }

    elements[id] = el;
  }

  // Ensure critical container elements
  ['hero-section', 'quiz-section', 'results-dashboard', 'analysis-overlay', 'diagnosis-form'].forEach(id => {
    if (!elements[id]) elements[id] = new MockElement(id, 'div');
  });

  const bodyEl = new MockElement('body', 'body');
  const docEl = new MockElement('html', 'html');
  docEl.lang = 'en';
  docEl.setAttribute('lang', 'en');
  docEl.setAttribute('data-edition', 'global-paid');

  const documentMock = {
    body: bodyEl,
    documentElement: docEl,
    getElementById: (id) => elements[id] || null,
    querySelector: (selector) => {
      if (selector.startsWith('#')) return elements[selector.slice(1)] || null;
      if (selector === 'html') return docEl;
      if (selector === 'body') return bodyEl;
      const all = documentMock.querySelectorAll(selector);
      return all.length > 0 ? all[0] : null;
    },
    querySelectorAll: (selector) => {
      const res = [];
      if (selector.startsWith('.')) {
        const c = selector.slice(1);
        Object.values(elements).forEach(el => {
          if (el.classList && el.classList.contains(c)) res.push(el);
        });
      } else if (selector.includes('[data-step="')) {
        const st = selector.match(/data-step="([^"]+)"/)[1];
        Object.values(elements).forEach(el => {
          if (el.getAttribute('data-step') === st) res.push(el);
        });
      } else if (selector.includes('input[name="')) {
        const nm = selector.match(/name="([^"]+)"/)[1];
        const isChecked = selector.includes(':checked');
        Object.values(elements).forEach(el => {
          if (el.name === nm && (!isChecked || el.checked)) res.push(el);
        });
      } else if (selector.includes('.taller-seg-pill')) {
        for (let i = 1; i <= 6; i++) {
          let pill = elements[`seg-pill-${i}`];
          if (!pill) {
            pill = new MockElement(`seg-pill-${i}`, 'div');
            pill.classList.add('taller-seg-pill');
            elements[`seg-pill-${i}`] = pill;
          }
          res.push(pill);
        }
      }
      return res;
    },
    createElement: (tag) => new MockElement(`mock-${Date.now()}-${Math.random()}`, tag)
  };

  const sandbox = {
    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    Set: Set,
    Map: Map,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    alertLog,
    alert: (msg) => { alertLog.push(String(msg)); },
    window: null,
    document: documentMock,
    localStorage: {
      _store: { taller_unit: 'imperial', 'kidsfit:app-language': 'en' },
      getItem: (k) => sandbox.localStorage._store[k] || null,
      setItem: (k, v) => { sandbox.localStorage._store[k] = String(v); },
      removeItem: (k) => { delete sandbox.localStorage._store[k]; }
    },
    location: { href: 'https://kisfitglobal.com/' },
    navigator: { clipboard: { writeText: () => Promise.resolve() } },
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init ? init.detail : {}; } },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.global = sandbox;

  vm.createContext(sandbox);

  // Load engines in order
  const i18nCode = fs.readFileSync(I18N_PATH, 'utf8');
  vm.runInContext(i18nCode, sandbox);

  const pinpointCode = fs.readFileSync(PINPOINT_PATH, 'utf8');
  vm.runInContext(pinpointCode, sandbox);

  const growthCode = fs.readFileSync(GROWTH_ENGINE_PATH, 'utf8');
  vm.runInContext(growthCode, sandbox);

  const wizardCode = fs.readFileSync(WIZARD_PATH, 'utf8');
  vm.runInContext(wizardCode, sandbox);

  const appCode = fs.readFileSync(APP_PATH, 'utf8');
  vm.runInContext(appCode, sandbox);

  const paywallCode = fs.readFileSync(PAYWALL_PATH, 'utf8');
  vm.runInContext(paywallCode, sandbox);

  // Initialize wizard
  if (sandbox.TallerOnboardingWizard && typeof sandbox.TallerOnboardingWizard.initWizard === 'function') {
    sandbox.TallerOnboardingWizard.initWizard();
  }

  return { sandbox, elements, alertLog, document: documentMock };
}

function runAdversarialStressSuite() {
  console.log('========================================================================');
  console.log('   CHALLENGER 1: 6-STEP SURVEY FLOW EMPIRICAL ADVERSARIAL STRESS SUITE   ');
  console.log('========================================================================\n');

  // --------------------------------------------------------------------------
  console.log('[SUITE 1: Studio Mode Entry Triggers & Clean Step 1 Initialization]');
  // --------------------------------------------------------------------------
  it('1.1 Clicking #btn-home-start-growth-report enters Step 1 cleanly with zero alerts', () => {
    const { sandbox, elements, alertLog } = createSimulationEnvironment();
    alertLog.length = 0;

    const btnGrowth = elements['btn-home-start-growth-report'];
    assert(btnGrowth, 'Button #btn-home-start-growth-report must exist in DOM');

    // Trigger studio entry
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'growth');

    assert.strictEqual(alertLog.length, 0, `Expected 0 alerts on entering growth studio, got: ${JSON.stringify(alertLog)}`);
    assert(sandbox.document.body.classList.contains('studio-mode-active'), 'body must have studio-mode-active class');
    assert.strictEqual(elements['hero-section'].style.display, 'none', 'Hero section must be hidden');
    assert.strictEqual(elements['quiz-section'].style.display, 'block', 'Quiz section must be visible');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 1, 'Current step must be initialized to 1');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.preferredReportMode, 'growth', 'Preferred report mode must be growth');
  });

  it('1.2 Clicking #btn-home-start-learning-report enters Step 1 cleanly with zero alerts', () => {
    const { sandbox, elements, alertLog } = createSimulationEnvironment();
    alertLog.length = 0;

    const btnLearning = elements['btn-home-start-learning-report'];
    assert(btnLearning, 'Button #btn-home-start-learning-report must exist in DOM');

    // Trigger studio entry for learning
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'learning');

    assert.strictEqual(alertLog.length, 0, `Expected 0 alerts on entering learning studio, got: ${JSON.stringify(alertLog)}`);
    assert(sandbox.document.body.classList.contains('studio-mode-active'), 'body must have studio-mode-active class');
    assert.strictEqual(elements['hero-section'].style.display, 'none', 'Hero section must be hidden');
    assert.strictEqual(elements['quiz-section'].style.display, 'block', 'Quiz section must be visible');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 1, 'Current step must be initialized to 1');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.preferredReportMode, 'learning', 'Preferred report mode must be learning');
  });

  // --------------------------------------------------------------------------
  console.log('\n[SUITE 2: Step 1 Validation Decoupling & Zero False Biometric Alerts]');
  // --------------------------------------------------------------------------
  it('2.1 Step 1 with valid Gender and DOB validates TRUE with zero alert popups', () => {
    const { sandbox, elements, alertLog } = createSimulationEnvironment();
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'growth');
    alertLog.length = 0;

    elements['gender-boy'].checked = true;
    elements['child-birth-year'].value = '2016';
    elements['child-birth-month'].value = '10';
    elements['child-birth-day'].value = '15';

    // Blank out height/weight to prove decoupling
    elements['child-height'].value = '';
    elements['child-weight'].value = '';

    const valid = sandbox.TallerOnboardingWizard.validateStep(1);
    assert.strictEqual(valid, true, 'validateStep(1) must return true when Gender and DOB are present');
    assert.strictEqual(alertLog.length, 0, `Expected zero alerts on Step 1, got: ${JSON.stringify(alertLog)}`);
  });

  it('2.2 Step 1 with unselected gender prompts for gender, NEVER height/weight', () => {
    const { sandbox, elements, alertLog } = createSimulationEnvironment();
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'growth');
    alertLog.length = 0;

    elements['gender-boy'].checked = false;
    elements['gender-girl'].checked = false;
    elements['child-birth-year'].value = '2016';
    elements['child-birth-month'].value = '10';
    elements['child-birth-day'].value = '15';

    const valid = sandbox.TallerOnboardingWizard.validateStep(1);
    assert.strictEqual(valid, false, 'validateStep(1) must return false when gender is unselected');
    assert.strictEqual(alertLog.length, 1, 'Exactly one alert should fire');
    assert(alertLog[0].includes('gender') || alertLog[0].includes('성별'), `Alert must mention gender: ${alertLog[0]}`);
    assert(!alertLog[0].includes('height') && !alertLog[0].includes('weight'), `Alert must NOT mention height/weight: ${alertLog[0]}`);
  });

  it('2.3 Step 1 with invalid DOB prompts for DOB, NEVER biometric height/weight', () => {
    const { sandbox, elements, alertLog } = createSimulationEnvironment();
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'growth');
    alertLog.length = 0;

    elements['gender-boy'].checked = true;
    elements['child-birth-year'].value = '1990'; // out of bounds [2005..2026]
    elements['child-birth-month'].value = '10';
    elements['child-birth-day'].value = '15';

    const valid = sandbox.TallerOnboardingWizard.validateStep(1);
    assert.strictEqual(valid, false, 'validateStep(1) must return false when DOB is out of bounds');
    assert.strictEqual(alertLog.length, 1, 'Exactly one alert should fire');
    assert(alertLog[0].includes('birth') || alertLog[0].includes('생년월일'), `Alert must mention DOB: ${alertLog[0]}`);
  });

  // --------------------------------------------------------------------------
  console.log('\n[SUITE 3: Full 6-Step End-to-End Flow in Imperial Mode (ft/in, lbs)]');
  // --------------------------------------------------------------------------
  it('3.1 Advances Step 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> Report in Imperial mode', () => {
    const { sandbox, elements, alertLog } = createSimulationEnvironment();
    sandbox.TallerI18n.setUnitSystem('imperial');
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'growth');
    alertLog.length = 0;

    // STEP 1
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 1);
    elements['gender-boy'].checked = true;
    elements['child-birth-year'].value = '2016';
    elements['child-birth-month'].value = '10';
    elements['child-birth-day'].value = '15';
    elements['user-region'].value = 'United States';

    // Click Next
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 2, 'Should advance to Step 2');
    assert.strictEqual(alertLog.length, 0, `No alerts expected on Step 1 -> 2: ${JSON.stringify(alertLog)}`);

    // STEP 2: Imperial Biometrics
    elements['child-height-ft'].value = '4';
    elements['child-height-in'].value = '7.0';
    elements['child-height-ft'].dispatch('input');
    elements['child-weight-lbs'].value = '78.5';
    elements['child-weight-lbs'].dispatch('input');
    elements['child-recent-gain'].value = '1.3';

    // Click Next
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 3, 'Should advance to Step 3');
    assert.strictEqual(alertLog.length, 0, `No alerts expected on Step 2 -> 3: ${JSON.stringify(alertLog)}`);

    // STEP 3: Imperial Parental Height & MPH Preview
    elements['father-height-ft'].value = '5';
    elements['father-height-in'].value = '10.5';
    elements['father-height-ft'].dispatch('input');
    elements['mother-height-ft'].value = '5';
    elements['mother-height-in'].value = '4.0';
    elements['mother-height-ft'].dispatch('input');

    // Verify live MPH badge formats in Imperial
    const mphBadge = elements['mph-badge-value'];
    assert(mphBadge.innerHTML.includes('in') || mphBadge.innerHTML.includes("'"), `MPH badge must show Imperial units: ${mphBadge.innerHTML}`);

    // Click Next
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 4, 'Should advance to Step 4');

    // STEP 4: Habits & Sleep
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 5, 'Should advance to Step 5');

    // STEP 5: Posture
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 6, 'Should advance to Step 6');

    // STEP 6: Submit Report
    assert.strictEqual(elements['btn-submit-quiz'].style.display, 'inline-flex', 'Submit button must be visible on Step 6');
    assert.strictEqual(elements['btn-next-step'].style.display, 'none', 'Next button must be hidden on Step 6');

    elements['btn-submit-quiz'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.isScanning, true, 'Wizard must enter scanning state');
    assert.strictEqual(alertLog.length, 0, `Zero alert popups across entire Imperial flow: ${JSON.stringify(alertLog)}`);
  });

  // --------------------------------------------------------------------------
  console.log('\n[SUITE 4: Full 6-Step End-to-End Flow in Metric Mode (cm, kg)]');
  // --------------------------------------------------------------------------
  it('4.1 Advances Step 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> Report in Metric mode', () => {
    const { sandbox, elements, alertLog } = createSimulationEnvironment();
    sandbox.TallerI18n.setUnitSystem('metric');
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'growth');
    alertLog.length = 0;

    // STEP 1
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 1);
    elements['gender-girl'].checked = true;
    elements['child-birth-year'].value = '2015';
    elements['child-birth-month'].value = '5';
    elements['child-birth-day'].value = '20';
    elements['user-region'].value = 'Canada';

    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 2);

    // STEP 2: Metric Biometrics
    elements['child-height'].value = '141.5';
    elements['child-weight'].value = '36.5';
    elements['child-recent-gain'].value = '3.5';

    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 3);

    // STEP 3: Metric Parents
    elements['father-height'].value = '175.5';
    elements['father-height'].dispatch('input');
    elements['mother-height'].value = '162.0';
    elements['mother-height'].dispatch('input');

    const mphBadge = elements['mph-badge-value'];
    assert(mphBadge.innerHTML.includes('cm'), `MPH badge must format in Metric cm: ${mphBadge.innerHTML}`);

    // Steps 4 -> 5 -> 6
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 4);
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 5);
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 6);

    elements['btn-submit-quiz'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.isScanning, true);
    assert.strictEqual(alertLog.length, 0);
  });

  // --------------------------------------------------------------------------
  console.log('\n[SUITE 5: Full 6-Step Flow in Brain & Learning LQ Mode]');
  // --------------------------------------------------------------------------
  it('5.1 Advances Step 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> Report in Learning Mode', () => {
    const { sandbox, elements, alertLog } = createSimulationEnvironment();
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'learning');
    alertLog.length = 0;

    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 1);
    elements['gender-boy'].checked = true;
    elements['child-birth-year'].value = '2014';
    elements['child-birth-month'].value = '8';
    elements['child-birth-day'].value = '10';

    // Step 1 -> 2 (Learning literacy questions)
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 2);

    // Step 2 -> 3 (Learning math questions)
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 3);

    // Step 3 -> 4 (Executive focus)
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 4);

    // Step 4 -> 5 (Metacognition)
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 5);

    // Step 5 -> 6 (Study temperament)
    elements['btn-next-step'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 6);

    // Submit Learning Report
    elements['btn-submit-quiz'].dispatch('click');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.isScanning, true);
    assert.strictEqual(alertLog.length, 0, `Zero alerts in learning mode: ${JSON.stringify(alertLog)}`);
  });

  // --------------------------------------------------------------------------
  console.log('\n[SUITE 6: Biometric Boundary & Extreme Input Stress Testing]');
  // --------------------------------------------------------------------------
  it('6.1 Imperial Height Boundaries: rejects <18.0 in or >90.0 in; accepts [18.0, 90.0] in', () => {
    const { sandbox, elements, alertLog } = createSimulationEnvironment();
    sandbox.TallerI18n.setUnitSystem('imperial');
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'growth');
    sandbox.TallerOnboardingWizard.goToStep(2);
    alertLog.length = 0;

    elements['child-weight'].value = '70.0';
    elements['child-recent-gain'].value = '1.0';

    // Test below minimum (17.5 in * 2.54 = 44.45 cm < 45 cm)
    elements['child-height'].value = '17.5';
    let ok = sandbox.TallerOnboardingWizard.validateStep(2);
    assert.strictEqual(ok, false, '17.5 in (< 45cm) must be rejected');
    assert(alertLog.length > 0 && alertLog[alertLog.length - 1].includes('18 to 90 inches'));

    // Test minimum in range (18.0 in * 2.54 = 45.72 cm >= 45 cm)
    elements['child-height'].value = '18.0';
    ok = sandbox.TallerOnboardingWizard.validateStep(2);
    assert.strictEqual(ok, true, '18.0 in must be accepted');

    // Test maximum in range (90.0 in * 2.54 = 228.6 cm <= 230 cm)
    elements['child-height'].value = '90.0';
    ok = sandbox.TallerOnboardingWizard.validateStep(2);
    assert.strictEqual(ok, true, '90.0 in must be accepted');

    // Test above maximum (91.0 in * 2.54 = 231.14 cm > 230 cm)
    elements['child-height'].value = '91.0';
    ok = sandbox.TallerOnboardingWizard.validateStep(2);
    assert.strictEqual(ok, false, '91.0 in (> 230cm) must be rejected');
  });

  it('6.2 Imperial Weight Boundaries: rejects <5.0 lbs or >350.0 lbs; accepts [5.0, 350.0] lbs', () => {
    const { sandbox, elements, alertLog } = createSimulationEnvironment();
    sandbox.TallerI18n.setUnitSystem('imperial');
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'growth');
    sandbox.TallerOnboardingWizard.goToStep(2);
    alertLog.length = 0;

    elements['child-height'].value = '50.0';
    elements['child-recent-gain'].value = '1.0';

    // Below min (4.0 lbs / 2.20462 = 1.81 kg < 2 kg)
    elements['child-weight'].value = '4.0';
    let ok = sandbox.TallerOnboardingWizard.validateStep(2);
    assert.strictEqual(ok, false, '4.0 lbs (< 2kg) must be rejected');

    // In range (5.0 lbs / 2.20462 = 2.27 kg >= 2 kg)
    elements['child-weight'].value = '5.0';
    ok = sandbox.TallerOnboardingWizard.validateStep(2);
    assert.strictEqual(ok, true, '5.0 lbs must be accepted');

    // In range (350.0 lbs / 2.20462 = 158.75 kg <= 160 kg)
    elements['child-weight'].value = '350.0';
    ok = sandbox.TallerOnboardingWizard.validateStep(2);
    assert.strictEqual(ok, true, '350.0 lbs must be accepted');

    // Above max (355.0 lbs / 2.20462 = 161.02 kg > 160 kg)
    elements['child-weight'].value = '355.0';
    ok = sandbox.TallerOnboardingWizard.validateStep(2);
    assert.strictEqual(ok, false, '355.0 lbs (> 160kg) must be rejected');
  });

  it('6.3 Metric Height & Weight Boundaries: [45.0..230.0] cm & [2.0..160.0] kg', () => {
    const { sandbox, elements, alertLog } = createSimulationEnvironment();
    sandbox.TallerI18n.setUnitSystem('metric');
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'growth');
    sandbox.TallerOnboardingWizard.goToStep(2);
    alertLog.length = 0;

    elements['child-recent-gain'].value = '2.5';

    // Metric height boundaries
    elements['child-weight'].value = '30.0';
    elements['child-height'].value = '44.9';
    assert.strictEqual(sandbox.TallerOnboardingWizard.validateStep(2), false);
    elements['child-height'].value = '45.0';
    assert.strictEqual(sandbox.TallerOnboardingWizard.validateStep(2), true);
    elements['child-height'].value = '230.0';
    assert.strictEqual(sandbox.TallerOnboardingWizard.validateStep(2), true);
    elements['child-height'].value = '230.1';
    assert.strictEqual(sandbox.TallerOnboardingWizard.validateStep(2), false);

    // Metric weight boundaries
    elements['child-height'].value = '130.0';
    elements['child-weight'].value = '1.9';
    assert.strictEqual(sandbox.TallerOnboardingWizard.validateStep(2), false);
    elements['child-weight'].value = '2.0';
    assert.strictEqual(sandbox.TallerOnboardingWizard.validateStep(2), true);
    elements['child-weight'].value = '160.0';
    assert.strictEqual(sandbox.TallerOnboardingWizard.validateStep(2), true);
    elements['child-weight'].value = '160.1';
    assert.strictEqual(sandbox.TallerOnboardingWizard.validateStep(2), false);
  });

  // --------------------------------------------------------------------------
  console.log('\n[SUITE 7: Rapid Stepper Navigation & Bidirectional Clamping]');
  // --------------------------------------------------------------------------
  it('7.1 Clamps at Step 6 during 100 rapid Next clicks without overflowing', () => {
    const { sandbox, elements } = createSimulationEnvironment();
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'learning'); // Use learning to bypass input prompts

    for (let i = 0; i < 100; i++) {
      elements['btn-next-step'].dispatch('click');
    }
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 6, 'Stepper must clamp strictly at maxStep 6');
  });

  it('7.2 Clamps at Step 1 during 100 rapid Prev clicks without underflowing', () => {
    const { sandbox, elements } = createSimulationEnvironment();
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'learning');
    sandbox.TallerOnboardingWizard.goToStep(3);

    for (let i = 0; i < 100; i++) {
      elements['btn-prev-step'].dispatch('click');
    }
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 1, 'Stepper must clamp strictly at minStep 1');
  });

  it('7.3 Rapid alternating jitter clicks maintain consistent step state', () => {
    const { sandbox, elements } = createSimulationEnvironment();
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'learning');
    sandbox.TallerOnboardingWizard.goToStep(2);

    for (let i = 0; i < 50; i++) {
      elements['btn-next-step'].dispatch('click');
      elements['btn-prev-step'].dispatch('click');
    }
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 2, 'Stepper must remain consistently at Step 2');
  });

  // --------------------------------------------------------------------------
  console.log('\n[SUITE 8: Mid-Funnel Unit Switching & Bidirectional Fidelity]');
  // --------------------------------------------------------------------------
  it('8.1 Toggling Imperial ↔ Metric preserves values and updates badges synchronously', () => {
    const { sandbox, elements } = createSimulationEnvironment();
    sandbox.TallerI18n.setUnitSystem('imperial');
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'growth');
    sandbox.TallerOnboardingWizard.goToStep(2);

    // Enter 5 ft 0.0 in (60.0 in)
    elements['child-height-ft'].value = '5';
    elements['child-height-in'].value = '0.0';
    elements['child-height-ft'].dispatch('input');

    assert.strictEqual(elements['child-height'].value, '60.0');

    // Switch to Metric
    sandbox.TallerOnboardingWizard.setUnitSystem('metric');
    assert.strictEqual(sandbox.TallerI18n.getUnitSystem(), 'metric');
    const metricVal = elements['child-height'].value;
    assert.strictEqual(metricVal, '152.4', `Toggling to metric converts 60.0 in to 152.4 cm cleanly (got ${metricVal} cm)`);

    // Switch back to Imperial
    sandbox.TallerOnboardingWizard.setUnitSystem('imperial');
    assert.strictEqual(sandbox.TallerI18n.getUnitSystem(), 'imperial');
    assert.strictEqual(elements['child-height-ft'].value, '5');
    assert.strictEqual(elements['child-height-in'].value, '0.0');
  });

  // --------------------------------------------------------------------------
  console.log('\n[SUITE 9: Forensic Zero-Hangul Verification in Wizard Flow]');
  // --------------------------------------------------------------------------
  it('9.1 Survey steps titles and subtitles have 0 Hangul characters', () => {
    const { sandbox } = createSimulationEnvironment();
    const hangulRegex = /[\uAC00-\uD7AF]/;

    // Growth Mode Steps
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'growth');
    for (let s = 1; s <= 6; s++) {
      sandbox.TallerOnboardingWizard.goToStep(s);
      const title = sandbox.document.getElementById('quiz-step-title').textContent;
      const sub = sandbox.document.getElementById('quiz-step-subtitle').textContent;
      assert(!hangulRegex.test(title), `Growth Step ${s} title contains Hangul: ${title}`);
      assert(!hangulRegex.test(sub), `Growth Step ${s} subtitle contains Hangul: ${sub}`);
    }

    // Learning Mode Steps
    sandbox.TallerOnboardingWizard.enterStudioMode('child', 'learning');
    for (let s = 1; s <= 6; s++) {
      sandbox.TallerOnboardingWizard.goToStep(s);
      const title = sandbox.document.getElementById('quiz-step-title').textContent;
      const sub = sandbox.document.getElementById('quiz-step-subtitle').textContent;
      assert(!hangulRegex.test(title), `Learning Step ${s} title contains Hangul: ${title}`);
      assert(!hangulRegex.test(sub), `Learning Step ${s} subtitle contains Hangul: ${sub}`);
    }
  });

  console.log('\n========================================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('========================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAdversarialStressSuite();
