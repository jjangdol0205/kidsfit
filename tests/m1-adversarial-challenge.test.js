/**
 * tests/m1-adversarial-challenge.test.js
 * Empirical Adversarial Challenge Suite for Milestone 1:
 * - Extreme, boundary, and invalid inputs on Onboarding Wizard
 * - Stress testing theme toggling and localStorage persistence under corrupted storage
 * - Verifying UI graceful failure with clear validation messages rather than crashing
 * - Inspecting collision/conflict between onboarding-wizard.js and legacy app.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const ONBOARDING_WIZARD_PATH = path.join(ROOT_DIR, 'src', 'js', 'onboarding-wizard.js');
const THEME_SWITCHER_PATH = path.join(ROOT_DIR, 'src', 'js', 'theme-switcher.js');
const APP_PATH = path.join(ROOT_DIR, 'src', 'js', 'app.js');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

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
    findings.push({ title, error: err.message, stack: err.stack });
  }
}

// Minimal DOM Element Mock
function createMockElement(id, tag = 'div', attrs = {}) {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    value: attrs.value || '',
    checked: !!attrs.checked,
    style: { display: attrs.display || 'block', width: '' },
    classList: {
      _classes: new Set(attrs.classes || []),
      add(cls) { this._classes.add(cls); },
      remove(cls) { this._classes.delete(cls); },
      contains(cls) { return this._classes.has(cls); }
    },
    textContent: attrs.textContent || '',
    innerHTML: attrs.innerHTML || '',
    attributes: Object.assign({}, attrs),
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
    focus() { el.focused = true; },
    listeners: {},
    addEventListener(evt, fn) {
      if (!this.listeners[evt]) this.listeners[evt] = [];
      this.listeners[evt].push(fn);
    },
    dispatchEvent(evt) {
      const type = typeof evt === 'string' ? evt : evt.type;
      if (this.listeners[type]) {
        this.listeners[type].forEach(fn => fn(evt));
      }
    },
    scrollIntoView() {}
  };
  return el;
}

// Minimal Mock DOM Document
function createMockDOM() {
  const elements = {};
  const alertLog = [];

  function register(el) {
    elements[el.id] = el;
    return el;
  }

  // Inputs for Step 1
  register(createMockElement('gender-boy', 'input', { checked: true, value: 'boy' }));
  register(createMockElement('gender-girl', 'input', { checked: false, value: 'girl' }));
  register(createMockElement('child-age-slider', 'input', { value: '10' }));
  register(createMockElement('child-age-display', 'span', { textContent: '10세 (120개월)' }));
  register(createMockElement('child-age-months', 'input', { value: '120' }));
  register(createMockElement('child-height', 'input', { value: '137.0' }));
  register(createMockElement('child-weight', 'input', { value: '35.5' }));
  register(createMockElement('child-recent-gain', 'input', { value: '3.2' }));
  register(createMockElement('father-height', 'input', { value: '173.5' }));
  register(createMockElement('mother-height', 'input', { value: '160.5' }));
  register(createMockElement('user-region', 'select', { value: '서울 강남·서초·송파' }));

  // Steps 1 to 5 containers
  for (let s = 1; s <= 5; s++) {
    register(createMockElement(`step-content-${s}`, 'div', { display: s === 1 ? 'block' : 'none' }));
  }

  // Stepper Header
  register(createMockElement('quiz-step-tag', 'span', { textContent: 'Step 1 / 5' }));
  register(createMockElement('quiz-step-title', 'h2', { textContent: '' }));
  register(createMockElement('quiz-step-subtitle', 'p', { textContent: '' }));
  register(createMockElement('quiz-progress-text', 'span', { textContent: '20% 완료' }));
  register(createMockElement('quiz-progress-fill', 'div'));

  // Nav buttons
  register(createMockElement('btn-prev-step', 'button', { display: 'none' }));
  register(createMockElement('btn-next-step', 'button', { display: 'inline-flex' }));
  register(createMockElement('btn-submit-quiz', 'button', { display: 'none' }));
  register(createMockElement('diagnosis-form', 'form'));

  // Overlay
  register(createMockElement('analysis-overlay', 'div', { display: 'none' }));
  register(createMockElement('analysis-title', 'h3'));
  register(createMockElement('analysis-desc', 'p'));
  register(createMockElement('analysis-bar-fill', 'div'));
  register(createMockElement('btn-skip-scan', 'button'));
  register(createMockElement('prescription-container', 'section', { display: 'none' }));
  register(createMockElement('btn-retest', 'button'));
  register(createMockElement('btn-theme-toggle', 'button'));

  // Presets
  for (let p = 1; p <= 5; p++) {
    register(createMockElement(`preset-card-${p}`, 'button'));
  }

  // Tanner phases
  const tannerPhases = [
    createMockElement('phase-1', 'input', { value: 'phase_1', checked: false, name: 'tanner-phase' }),
    createMockElement('phase-2', 'input', { value: 'phase_2', checked: true, name: 'tanner-phase' }),
    createMockElement('phase-3', 'input', { value: 'phase_3', checked: false, name: 'tanner-phase' }),
    createMockElement('phase-4', 'input', { value: 'phase_4', checked: false, name: 'tanner-phase' })
  ];

  // Habits
  const habits = [
    createMockElement('habit-late-sleep', 'input', { value: 'late_sleep', checked: true, name: 'growth-habits' }),
    createMockElement('habit-night-carbs', 'input', { value: 'night_carbs', checked: false, name: 'growth-habits' }),
    createMockElement('habit-poor-posture', 'input', { value: 'poor_posture', checked: false, name: 'growth-habits' }),
    createMockElement('habit-picky-eater', 'input', { value: 'picky_eater', checked: false, name: 'growth-habits' }),
    createMockElement('habit-sedentary', 'input', { value: 'sedentary', checked: false, name: 'growth-habits' })
  ];

  // Cognitive
  const cogAxes = [
    createMockElement('cog-math', 'input', { value: 'math_logic', checked: false, name: 'cognitive-axes' }),
    createMockElement('cog-lang', 'input', { value: 'language_reading', checked: false, name: 'cognitive-axes' }),
    createMockElement('cog-science', 'input', { value: 'science_nature', checked: true, name: 'cognitive-axes' }),
    createMockElement('cog-arts', 'input', { value: 'sensory_arts', checked: false, name: 'cognitive-axes' }),
    createMockElement('cog-exec', 'input', { value: 'executive_focus', checked: false, name: 'cognitive-axes' })
  ];

  const mockDoc = {
    documentElement: {
      lang: 'ko',
      setAttribute(k, v) { this[k] = v; },
      getAttribute(k) { return this[k]; }
    },
    body: {
      setAttribute(k, v) { this[k] = v; },
      getAttribute(k) { return this[k]; }
    },
    getElementById(id) {
      return elements[id] || null;
    },
    querySelectorAll(selector) {
      if (selector === 'input[name="tanner-phase"]') {
        return tannerPhases;
      }
      if (selector === 'input[name="tanner-phase"]:checked') {
        return tannerPhases.filter(p => p.checked);
      }
      if (selector === 'input[name="growth-habits"]') {
        return habits;
      }
      if (selector === 'input[name="growth-habits"]:checked') {
        return habits.filter(h => h.checked);
      }
      if (selector === 'input[name="cognitive-axes"]') {
        return cogAxes;
      }
      if (selector === 'input[name="cognitive-axes"]:checked') {
        return cogAxes.filter(c => c.checked);
      }
      if (selector === 'input[name="kdst-concerns"]:checked') {
        return []; // No kdst-concerns exist in the new DOM!
      }
      if (selector === '.preset-card') {
        return Object.keys(elements)
          .filter(k => k.startsWith('preset-card-'))
          .map(k => elements[k]);
      }
      return [];
    },
    querySelector(selector) {
      const all = this.querySelectorAll(selector);
      return all.length > 0 ? all[0] : null;
    }
  };

  return { mockDoc, elements, alertLog, tannerPhases, habits, cogAxes };
}

function runAllChallenges() {
  console.log('================================================================');
  console.log('   Milestone 1: Empirical Adversarial Challenge Test Suite     ');
  console.log('================================================================\n');

  // Load modules
  const ThemeSwitcher = require(THEME_SWITCHER_PATH);
  const OnboardingWizard = require(ONBOARDING_WIZARD_PATH);
  const KidsFitApp = require(APP_PATH);

  // --------------------------------------------------------------------------
  console.log('--- Section 1: Theme Toggling & Corrupted Storage Stress Tests ---');
  // --------------------------------------------------------------------------

  it('initializes to dark theme by default when localStorage is empty', () => {
    const { mockDoc } = createMockDOM();
    const origDoc = global.document;
    const origWin = global.window;
    const origLocalStorage = global.localStorage;

    const mockStorage = {
      store: {},
      getItem(k) { return this.store[k] || null; },
      setItem(k, v) { this.store[k] = String(v); }
    };

    global.document = mockDoc;
    global.window = { localStorage: mockStorage, dispatchEvent: () => {} };
    global.localStorage = mockStorage;

    try {
      ThemeSwitcher.initTheme();
      assert.strictEqual(ThemeSwitcher.getTheme(), 'dark', 'Theme must default to dark');
      assert.strictEqual(mockDoc.documentElement['data-theme'], 'dark', 'data-theme on html must be dark');
    } finally {
      global.document = origDoc;
      global.window = origWin;
      global.localStorage = origLocalStorage;
    }
  });

  it('resiliently handles corrupted and hostile values in localStorage (JSON garbage, scripts, empty strings)', () => {
    const { mockDoc } = createMockDOM();
    const origDoc = global.document;
    const origWin = global.window;
    const origLocalStorage = global.localStorage;

    const hostileValues = [
      '{corrupted: json, "unclosed": true',
      '<script>alert("xss")</script>',
      'DARK', // uppercase
      'LIGHT', // uppercase
      '  light  ', // whitespace
      'blue', // invalid theme name
      'null', // string "null"
      'undefined',
      'NaN',
      '0',
      'false',
      '[object Object]'
    ];

    global.document = mockDoc;

    try {
      for (const hostile of hostileValues) {
        const mockStorage = {
          getItem() { return hostile; },
          setItem() {}
        };
        global.window = { localStorage: mockStorage, dispatchEvent: () => {} };
        global.localStorage = mockStorage;

        // Should not throw, should fall back strictly to 'dark'
        ThemeSwitcher.initTheme();
        assert.strictEqual(
          ThemeSwitcher.getTheme(),
          'dark',
          `Hostile storage value "${hostile}" must safely fall back to "dark"`
        );
        assert.strictEqual(
          mockDoc.documentElement['data-theme'],
          'dark',
          `DOM data-theme must remain "dark" under hostile storage value "${hostile}"`
        );
      }
    } finally {
      global.document = origDoc;
      global.window = origWin;
      global.localStorage = origLocalStorage;
    }
  });

  it('survives throwing localStorage (SecurityError / sandboxed iframe)', () => {
    const { mockDoc } = createMockDOM();
    const origDoc = global.document;
    const origWin = global.window;
    const origLocalStorage = global.localStorage;

    const throwingStorage = {
      getItem() {
        const err = new Error('The operation is insecure.');
        err.name = 'SecurityError';
        throw err;
      },
      setItem() {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
    };

    global.document = mockDoc;
    global.window = { localStorage: throwingStorage, dispatchEvent: () => {} };
    global.localStorage = throwingStorage;

    try {
      assert.doesNotThrow(() => {
        ThemeSwitcher.initTheme();
      }, 'initTheme must not throw when localStorage.getItem throws SecurityError');
      assert.strictEqual(ThemeSwitcher.getTheme(), 'dark');

      assert.doesNotThrow(() => {
        ThemeSwitcher.setTheme('light');
      }, 'setTheme must not throw when localStorage.setItem throws QuotaExceededError');
      assert.strictEqual(ThemeSwitcher.getTheme(), 'light');
      assert.strictEqual(mockDoc.documentElement['data-theme'], 'light');
    } finally {
      global.document = origDoc;
      global.window = origWin;
      global.localStorage = origLocalStorage;
    }
  });

  it('endures high-frequency rapid theme toggling (1,000 cycles) without state desync or drift', () => {
    const { mockDoc, elements } = createMockDOM();
    const origDoc = global.document;
    const origWin = global.window;
    const origLocalStorage = global.localStorage;

    const mockStorage = {
      store: {},
      getItem(k) { return this.store[k] || null; },
      setItem(k, v) { this.store[k] = String(v); }
    };

    global.document = mockDoc;
    global.window = { localStorage: mockStorage, dispatchEvent: () => {} };
    global.localStorage = mockStorage;

    try {
      ThemeSwitcher.setTheme('dark');
      assert.strictEqual(ThemeSwitcher.getTheme(), 'dark');

      for (let i = 0; i < 1000; i++) {
        ThemeSwitcher.toggleTheme();
        const expected = (i % 2 === 0) ? 'light' : 'dark';
        assert.strictEqual(ThemeSwitcher.getTheme(), expected, `Theme mismatch at iteration ${i}`);
        assert.strictEqual(mockDoc.documentElement['data-theme'], expected);
      }

      // After 1000 toggles from dark, final state must be 'dark'
      assert.strictEqual(ThemeSwitcher.getTheme(), 'dark');
      assert.strictEqual(mockStorage.getItem('taller_theme'), 'dark');
    } finally {
      global.document = origDoc;
      global.window = origWin;
      global.localStorage = origLocalStorage;
    }
  });

  it('safely rejects invalid inputs to setTheme()', () => {
    const origDoc = global.document;
    const origWin = global.window;
    const { mockDoc } = createMockDOM();
    global.document = mockDoc;
    global.window = { localStorage: { getItem: () => 'dark', setItem: () => {} }, dispatchEvent: () => {} };

    try {
      ThemeSwitcher.setTheme('dark');
      [null, undefined, 123, {}, [], 'blue', 'neon', 'DARK'].forEach(invalid => {
        ThemeSwitcher.setTheme(invalid);
        assert.strictEqual(ThemeSwitcher.getTheme(), 'dark', `setTheme(${JSON.stringify(invalid)}) should be rejected`);
      });
    } finally {
      global.document = origDoc;
      global.window = origWin;
    }
  });

  // --------------------------------------------------------------------------
  console.log('\n--- Section 2: Onboarding Wizard Boundary & Invalid Inputs ---');
  // --------------------------------------------------------------------------

  it('validates Step 1 height boundaries: accepts [45.0, 230.0], rejects < 45 or > 230', () => {
    const { mockDoc, elements } = createMockDOM();
    const origDoc = global.document;
    const origAlert = global.alert;
    let lastAlert = null;
    global.alert = (msg) => { lastAlert = msg; };
    global.document = mockDoc;

    try {
      // Valid boundaries
      elements['child-height'].value = '45.0';
      assert.strictEqual(OnboardingWizard.validateStep(1), true, 'Height 45.0 cm should be valid min');

      elements['child-height'].value = '230.0';
      assert.strictEqual(OnboardingWizard.validateStep(1), true, 'Height 230.0 cm should be valid max');

      // Invalid boundaries
      elements['child-height'].value = '44.9';
      lastAlert = null;
      assert.strictEqual(OnboardingWizard.validateStep(1), false, 'Height 44.9 cm should be invalid');
      assert(lastAlert && lastAlert.includes('45cm ~ 230cm'), 'Must display clear validation message for height < 45');

      elements['child-height'].value = '230.1';
      lastAlert = null;
      assert.strictEqual(OnboardingWizard.validateStep(1), false, 'Height 230.1 cm should be invalid');
      assert(lastAlert && lastAlert.includes('45cm ~ 230cm'), 'Must display clear validation message for height > 230');

      // Extreme values
      const extremeInvalidHeights = ['-10', '-999', '0', 'NaN', 'abc', '', '9999'];
      for (const val of extremeInvalidHeights) {
        elements['child-height'].value = val;
        lastAlert = null;
        assert.strictEqual(OnboardingWizard.validateStep(1), false, `Height "${val}" must be rejected`);
        assert(lastAlert !== null, `Must trigger alert on height "${val}"`);
      }
    } finally {
      global.document = origDoc;
      global.alert = origAlert;
    }
  });

  it('validates Step 1 weight boundaries: accepts [2.0, 160.0], rejects < 2 or > 160', () => {
    const { mockDoc, elements } = createMockDOM();
    const origDoc = global.document;
    const origAlert = global.alert;
    let lastAlert = null;
    global.alert = (msg) => { lastAlert = msg; };
    global.document = mockDoc;

    try {
      elements['child-height'].value = '137.0'; // valid height

      // Valid boundaries
      elements['child-weight'].value = '2.0';
      assert.strictEqual(OnboardingWizard.validateStep(1), true, 'Weight 2.0 kg should be valid min');

      elements['child-weight'].value = '160.0';
      assert.strictEqual(OnboardingWizard.validateStep(1), true, 'Weight 160.0 kg should be valid max');

      // Invalid boundaries
      elements['child-weight'].value = '1.9';
      lastAlert = null;
      assert.strictEqual(OnboardingWizard.validateStep(1), false, 'Weight 1.9 kg should be rejected');
      assert(lastAlert && lastAlert.includes('2kg ~ 160kg'), 'Must display clear validation message for weight < 2');

      elements['child-weight'].value = '160.1';
      lastAlert = null;
      assert.strictEqual(OnboardingWizard.validateStep(1), false, 'Weight 160.1 kg should be rejected');
      assert(lastAlert && lastAlert.includes('2kg ~ 160kg'), 'Must display clear validation message for weight > 160');

      // Extreme & negative weights
      const extremeInvalidWeights = ['-5', '-100', '0', 'NaN', '', 'invalid', '9999'];
      for (const val of extremeInvalidWeights) {
        elements['child-weight'].value = val;
        lastAlert = null;
        assert.strictEqual(OnboardingWizard.validateStep(1), false, `Weight "${val}" must be rejected`);
        assert(lastAlert !== null, `Must trigger alert on weight "${val}"`);
      }
    } finally {
      global.document = origDoc;
      global.alert = origAlert;
    }
  });

  it('validates Step 1 recent 6-month growth: accepts [0.0, 20.0], rejects < 0 or > 20', () => {
    const { mockDoc, elements } = createMockDOM();
    const origDoc = global.document;
    const origAlert = global.alert;
    let lastAlert = null;
    global.alert = (msg) => { lastAlert = msg; };
    global.document = mockDoc;

    try {
      elements['child-height'].value = '137.0';
      elements['child-weight'].value = '35.5';

      elements['child-recent-gain'].value = '0.0';
      assert.strictEqual(OnboardingWizard.validateStep(1), true, 'Growth 0.0 cm should be valid min');

      elements['child-recent-gain'].value = '20.0';
      assert.strictEqual(OnboardingWizard.validateStep(1), true, 'Growth 20.0 cm should be valid max');

      elements['child-recent-gain'].value = '-0.1';
      lastAlert = null;
      assert.strictEqual(OnboardingWizard.validateStep(1), false, 'Growth -0.1 cm should be rejected');
      assert(lastAlert && lastAlert.includes('0 ~ 20cm'), 'Must display clear validation message for growth < 0');

      elements['child-recent-gain'].value = '20.1';
      lastAlert = null;
      assert.strictEqual(OnboardingWizard.validateStep(1), false, 'Growth 20.1 cm should be rejected');
      assert(lastAlert && lastAlert.includes('0 ~ 20cm'), 'Must display clear validation message for growth > 20');
    } finally {
      global.document = origDoc;
      global.alert = origAlert;
    }
  });

  it('gracefully handles missing/invalid parental heights by resetting to clinical defaults (173.5, 160.5)', () => {
    const { mockDoc, elements } = createMockDOM();
    const origDoc = global.document;
    global.document = mockDoc;

    try {
      elements['child-height'].value = '137.0';
      elements['child-weight'].value = '35.5';
      elements['child-recent-gain'].value = '3.0';

      // Corrupted father/mother height
      elements['father-height'].value = 'NaN';
      elements['mother-height'].value = '-50';

      const valid = OnboardingWizard.validateStep(1);
      assert.strictEqual(valid, true, 'Wizard should not block form submission for corrupted parental height; should fall back gracefully');
      assert.strictEqual(elements['father-height'].value, 173.5, 'Father height should default to 173.5');
      assert.strictEqual(elements['mother-height'].value, 160.5, 'Mother height should default to 160.5');
    } finally {
      global.document = origDoc;
    }
  });

  it('extracts complete profile with boundary fallbacks when fields are empty or extreme', () => {
    const { mockDoc, elements, tannerPhases, habits, cogAxes } = createMockDOM();
    const origDoc = global.document;
    global.document = mockDoc;

    try {
      // Set all inputs to empty strings
      elements['child-height'].value = '';
      elements['child-weight'].value = '';
      elements['child-recent-gain'].value = '';
      elements['father-height'].value = '';
      elements['mother-height'].value = '';

      // Uncheck all tanner phases
      tannerPhases.forEach(p => { p.checked = false; });
      // Uncheck all habits
      habits.forEach(h => { h.checked = false; });
      // Uncheck all cog axes
      cogAxes.forEach(c => { c.checked = false; });

      const profile = OnboardingWizard.readProfileFromForm();

      assert.strictEqual(profile.currentHeight, 137.0, 'Empty height must fallback to 137.0');
      assert.strictEqual(profile.currentWeight, 35.5, 'Empty weight must fallback to 35.5');
      assert.strictEqual(profile.recentGrowth6m, 3.0, 'Empty growth gain must fallback to 3.0');
      assert.strictEqual(profile.fatherHeight, 173.5, 'Empty father height must fallback to 173.5');
      assert.strictEqual(profile.motherHeight, 160.5, 'Empty mother height must fallback to 160.5');
      assert.strictEqual(profile.tannerPhase, 'phase_2', 'Unchecked tanner phase must fallback to phase_2');
      assert.deepStrictEqual(profile.habits, [], 'Unchecked habits should be empty array');
      assert.deepStrictEqual(profile.cognitiveAxes, ['science_nature'], 'Empty cognitive axes must default to science_nature');
    } finally {
      global.document = origDoc;
    }
  });

  // --------------------------------------------------------------------------
  console.log('\n--- Section 3: Dual Controller Collision & Conflict Inspection ---');
  // --------------------------------------------------------------------------

  it('VERIFIED: app.js validateStep(3) no longer checks for removed "kdst-concerns"', () => {
    const { mockDoc } = createMockDOM();
    const origDoc = global.document;
    const origAlert = global.alert;
    let alertMessage = null;
    global.alert = (msg) => { alertMessage = msg; };
    global.document = mockDoc;

    try {
      KidsFitApp.state.currentStep = 3;
      const result = KidsFitApp.validateStep(3);
      assert.strictEqual(result, true, 'validateStep(3) must pass cleanly without checking kdst-concerns');
      assert.strictEqual(alertMessage, null, 'No alert should be fired on Step 3');
    } finally {
      global.document = origDoc;
      global.alert = origAlert;
    }
  });

  it('VERIFIED: age bounds in app.js support 12~240 months (1~20 years)', () => {
    const { mockDoc, elements } = createMockDOM();
    const origDoc = global.document;
    const origAlert = global.alert;
    let alertMessage = null;
    global.alert = (msg) => { alertMessage = msg; };
    global.document = mockDoc;

    try {
      elements['child-age-slider'].value = '19';
      elements['child-age-months'].value = '228';
      const appResult = KidsFitApp.validateStep(1);
      assert.strictEqual(appResult, true, 'app.js should permit age 19 (228m)');
      assert.strictEqual(alertMessage, null);
    } finally {
      global.document = origDoc;
      global.alert = origAlert;
    }
  });

  it('VERIFIED: height/weight bounds in app.js aligned with onboarding-wizard.js [45~230cm, 2~160kg]', () => {
    const { mockDoc, elements } = createMockDOM();
    const origDoc = global.document;
    const origAlert = global.alert;
    let alertMessage = null;
    global.alert = (msg) => { alertMessage = msg; };
    global.document = mockDoc;

    try {
      elements['child-age-months'].value = '36';
      elements['child-height'].value = '48.0';
      elements['child-weight'].value = '4.0';

      const appResult = KidsFitApp.validateStep(1);
      assert.strictEqual(appResult, true, 'app.js should permit height 48cm and weight 4kg');
      assert.strictEqual(alertMessage, null);
    } finally {
      global.document = origDoc;
      global.alert = origAlert;
    }
  });

  // --------------------------------------------------------------------------
  console.log('\n--- Section 4: All 5 Presets Resilience & Boundary Check ---');
  // --------------------------------------------------------------------------

  it('verifies all 5 presets in OnboardingWizard have strictly valid clinical metrics within [45~230cm, 2~160kg, 0~20cm/6m]', () => {
    const presets = OnboardingWizard.PRESETS;
    assert.strictEqual(Object.keys(presets).length, 5, 'Must have exactly 5 presets');

    for (const [id, p] of Object.entries(presets)) {
      assert(p.currentHeight >= 45 && p.currentHeight <= 230, `Preset ${id} height out of bounds: ${p.currentHeight}`);
      assert(p.currentWeight >= 2 && p.currentWeight <= 160, `Preset ${id} weight out of bounds: ${p.currentWeight}`);
      assert(p.recentGrowth6m >= 0 && p.recentGrowth6m <= 20, `Preset ${id} recent growth out of bounds: ${p.recentGrowth6m}`);
      assert(p.ageYears >= 1 && p.ageYears <= 20, `Preset ${id} ageYears out of bounds: ${p.ageYears}`);
      assert(p.ageMonths === p.ageYears * 12, `Preset ${id} ageMonths must equal ageYears * 12: ${p.ageMonths}`);
      assert(p.fatherHeight >= 100 && p.fatherHeight <= 240, `Preset ${id} fatherHeight out of bounds: ${p.fatherHeight}`);
      assert(p.motherHeight >= 100 && p.motherHeight <= 240, `Preset ${id} motherHeight out of bounds: ${p.motherHeight}`);
      assert(['phase_1', 'phase_2', 'phase_3', 'phase_4'].includes(p.tannerPhase), `Preset ${id} invalid tannerPhase: ${p.tannerPhase}`);
      assert(Array.isArray(p.habits), `Preset ${id} habits must be array`);
      assert(Array.isArray(p.cognitiveAxes) && p.cognitiveAxes.length > 0, `Preset ${id} cognitiveAxes must be non-empty`);
    }
  });

  // --------------------------------------------------------------------------
  console.log('\n--- Section 5: Runtime Button-Click Dual-Listener Simulation ---');
  // --------------------------------------------------------------------------

  it('VERIFIED: Clicking btn-next-step on Step 3 advances cleanly to Step 4 with 0 alerts', () => {
    const { mockDoc, elements } = createMockDOM();
    const origDoc = global.document;
    const origAlert = global.alert;
    const alertMessages = [];
    global.alert = (msg) => { alertMessages.push(msg); };
    global.document = mockDoc;

    try {
      OnboardingWizard.goToStep(3);
      assert.strictEqual(OnboardingWizard.state.currentStep, 3);

      const nextBtn = elements['btn-next-step'];
      nextBtn.addEventListener('click', () => {
        if (OnboardingWizard.validateStep(OnboardingWizard.state.currentStep)) {
          OnboardingWizard.goToStep(OnboardingWizard.state.currentStep + 1);
        }
      });

      nextBtn.dispatchEvent({ type: 'click', preventDefault: () => {} });

      assert.strictEqual(OnboardingWizard.state.currentStep, 4, 'OnboardingWizard should advance to step 4');
      assert.strictEqual(alertMessages.length, 0, `Expected 0 alerts, got: ${JSON.stringify(alertMessages)}`);
    } finally {
      global.document = origDoc;
      global.alert = origAlert;
    }
  });

  // --------------------------------------------------------------------------
  console.log('\n--- Section 6: Imperial Unit Mode Adversarial Validation ---');
  // --------------------------------------------------------------------------

  it('validates Step 1 in Global Imperial Mode (inches/lbs): normal range conversion', () => {
    const { mockDoc, elements } = createMockDOM();
    const origDoc = global.document;
    const origAlert = global.alert;
    let lastAlert = null;
    global.alert = (msg) => { lastAlert = msg; };
    global.document = mockDoc;

    // Enable Imperial mode
    mockDoc.documentElement.lang = 'en';
    const mockI18n = {
      getUnitSystem: () => 'imperial'
    };
    global.TallerI18n = mockI18n;

    try {
      // 54 inches (~137.16 cm) and 78 lbs (~35.38 kg) -> valid normal
      elements['child-height'].value = '54.0';
      elements['child-weight'].value = '78.0';
      elements['child-recent-gain'].value = '1.2';

      assert.strictEqual(OnboardingWizard.validateStep(1), true, '54 inches and 78 lbs should be valid');

      // 17 inches (~43.18 cm < 45cm) -> invalid
      elements['child-height'].value = '17.0';
      elements['child-weight'].value = '70.0';
      lastAlert = null;
      assert.strictEqual(OnboardingWizard.validateStep(1), false, '17 inches should be rejected');
      assert(lastAlert && lastAlert.includes('18 to 90 inches'), 'Must display English imperial alert message');

      // 1 lb (< 2kg) -> invalid
      elements['child-height'].value = '50.0';
      elements['child-weight'].value = '1.0';
      lastAlert = null;
      assert.strictEqual(OnboardingWizard.validateStep(1), false, '1 lb should be rejected');
      assert(lastAlert && lastAlert.includes('5 to 350 lbs'), 'Must display English imperial alert message');
    } finally {
      global.document = origDoc;
      global.alert = origAlert;
      delete global.TallerI18n;
    }
  });

  it('VERIFIED: Imperial mode accurately converts 90 inches, accepts 340 lbs, and rejects 4 lbs', () => {
    const { mockDoc, elements } = createMockDOM();
    const origDoc = global.document;
    const origAlert = global.alert;
    let lastAlert = null;
    global.alert = (msg) => { lastAlert = msg; };
    global.document = mockDoc;

    mockDoc.documentElement.lang = 'en';
    global.TallerI18n = {
      getUnitSystem: () => 'imperial'
    };

    try {
      // 1. 340 lbs (154.2 kg) is within 5~350 lbs: MUST PASS
      elements['child-height'].value = '54.0';
      elements['child-weight'].value = '340.0';
      elements['child-recent-gain'].value = '1.0';
      lastAlert = null;
      const weightResult = OnboardingWizard.validateStep(1);
      assert.strictEqual(weightResult, true, '340 lbs must be accepted in imperial mode');
      assert.strictEqual(lastAlert, null);

      // 2. 90 inches (228.6 cm) is within 18~90 inches: MUST PASS
      elements['child-height'].value = '90.0';
      elements['child-weight'].value = '70.0';
      lastAlert = null;
      const heightResult = OnboardingWizard.validateStep(1);
      assert.strictEqual(heightResult, true, '90 inches must be accepted in imperial mode');
      assert.strictEqual(lastAlert, null);

      // 3. 4 lbs (1.81 kg) is below 5 lbs: MUST BE REJECTED
      elements['child-height'].value = '50.0';
      elements['child-weight'].value = '4.0';
      lastAlert = null;
      const fourLbsResult = OnboardingWizard.validateStep(1);
      assert.strictEqual(fourLbsResult, false, '4 lbs must be rejected in imperial mode');
      assert(lastAlert && lastAlert.includes('5 to 350 lbs'), 'Must show weight alert');
    } finally {
      global.document = origDoc;
      global.alert = origAlert;
      delete global.TallerI18n;
    }
  });

  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`Summary: ${passedTests}/${totalTests} tests passed (${failedTests} failed).`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error(`\nFound ${failedTests} test failures / defects!`);
    process.exit(1);
  } else {
    console.log('\nAll empirical challenge tests completed successfully!');
    process.exit(0);
  }
}

runAllChallenges();

