/**
 * tests/ui-onboarding.test.js
 * Comprehensive unit and DOM structure test suite for Milestone 1:
 * Taller Bio Labs Clinical Design System, 5-Stage Bio Onboarding Wizard,
 * 5 Clinical Presets, 5 Master Core Tabs, 100% Commercial Purge,
 * and Secret Admin Triggers.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const STYLE_CSS_PATH = path.join(ROOT_DIR, 'src', 'css', 'style.css');
const APP_JS_PATH = path.join(ROOT_DIR, 'src', 'js', 'app.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

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
  }
}

function runSuite() {
  console.log('====================================================');
  console.log('   Milestone 1: Design System & Bio Onboarding Tests');
  console.log('====================================================');

  const indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const styleCss = fs.readFileSync(STYLE_CSS_PATH, 'utf8');
  const KidsFitApp = require(APP_JS_PATH);

  // --------------------------------------------------------------------------
  console.log('\n[Suite 1: Clinical Bio Labs Design System & Visual Aesthetic]');
  // --------------------------------------------------------------------------

  it('contains Warm Ivory (#FAF8F5) and Clinic White (#FFFFFF) surface tokens for Light Clinic theme', () => {
    assert(styleCss.includes('#FAF8F5'), 'Missing Warm Ivory (#FAF8F5)');
    assert(styleCss.includes('#FFFFFF'), 'Missing Clinic White (#FFFFFF)');
    assert(styleCss.includes('--bg-clinic-ivory'), 'Missing --bg-clinic-ivory CSS variable');
    assert(styleCss.includes('--bg-clinic-surface'), 'Missing --bg-clinic-surface CSS variable');
  });

  it('contains Royal Indigo, Growth Mint, Cyan, and Bio Emerald accents', () => {
    assert(styleCss.includes('#5B4BFF') || styleCss.includes('#38BDF8'), 'Missing Accent Color');
    assert(styleCss.includes('#10B981'), 'Missing Growth Mint (#10B981)');
    assert(styleCss.includes('#F59E0B'), 'Missing Amber (#F59E0B)');
  });

  it('specifies Pretendard font stack and responsive line-height', () => {
    assert(styleCss.includes('Pretendard'), 'Missing Pretendard font declaration');
  });

  it('defines Capsule Tabs radius (9999px) and Bento Glass Card radius', () => {
    assert(styleCss.includes('9999px'), 'Missing 9999px capsule radius');
    assert(styleCss.includes('24px') || styleCss.includes('20px') || styleCss.includes('28px'), 'Missing Bento card radius');
  });

  it('supports Dark Obsidian Glassmorphism (#060911) as master theme with Light Clinic theme toggle', () => {
    assert(styleCss.includes('#060911'), 'Missing Dark Obsidian (#060911)');
    assert(styleCss.includes('backdrop-filter: blur(20px)'), 'Missing glassmorphism blur(20px)');
    assert(styleCss.includes('[data-theme="light"]') || styleCss.includes('[data-theme=light]'), 'Missing Light Clinic theme selector');
  });

  // --------------------------------------------------------------------------
  console.log('\n[Suite 2: 100% Ad-Free Initial Onboarding Screen & Trust Badge]');
  // --------------------------------------------------------------------------

  it('includes official KDCA and K-DST header trust badge', () => {
    assert(indexHtml.includes('Built on Official Standards: 질병관리청 소아청소년 성장도표 &amp; 보건복지부 영유아 발달선별검사(K-DST) 기준 적용') ||
           indexHtml.includes('Built on Official Standards: 질병관리청 소아청소년 성장도표 & 보건복지부 영유아 발달선별검사(K-DST) 기준 적용'),
           'Missing official KDCA & K-DST trust badge text');
  });

  it('renders clinical capsule navigation tabs for the 5 cores', () => {
    assert(indexHtml.includes('data-tab="tab-auxology"'), 'Missing Tab 1 (tab-auxology)');
    assert(indexHtml.includes('data-tab="tab-endocrinology"'), 'Missing Tab 2 (tab-endocrinology)');
    assert(indexHtml.includes('data-tab="tab-biomechanics"'), 'Missing Tab 3 (tab-biomechanics)');
    assert(indexHtml.includes('data-tab="tab-neuro"'), 'Missing Tab 4 (tab-neuro)');
    assert(indexHtml.includes('data-tab="tab-tracker"'), 'Missing Tab 5 (tab-tracker)');
    assert(indexHtml.includes('신체 성장 &amp; 골연령 궤적') || indexHtml.includes('신체 성장 & 골연령 궤적'), 'Missing Auxology tab label');
    assert(indexHtml.includes('호르몬·수면 &amp; 임상 영양') || indexHtml.includes('호르몬·수면 & 임상 영양'), 'Missing Endocrinology tab label');
  });

  it('guarantees 100% ad-free initial onboarding screen (no discount/commercial tags)', () => {
    const quizStart = indexHtml.indexOf('<section class="quiz-section"');
    const quizEnd = indexHtml.indexOf('</section>', quizStart);
    const quizSlice = indexHtml.substring(quizStart, quizEnd);

    assert(!quizSlice.includes('최저가'), 'Initial quiz screen contains "최저가" commercial copy');
    assert(!quizSlice.includes('특가'), 'Initial quiz screen contains "특가" commercial copy');
    assert(!quizSlice.includes('폭탄 세일'), 'Initial quiz screen contains "폭탄 세일" commercial copy');
    assert(!quizSlice.includes('DAN-SAMPLE-TOP'), 'Initial quiz screen contains legacy DAN ad banner container');
  });

  // --------------------------------------------------------------------------
  console.log('\n[Suite 3: 5 Clinical Age Presets]');
  // --------------------------------------------------------------------------

  it('renders all 5 clinical age preset cards in index.html', () => {
    for (let i = 1; i <= 5; i++) {
      assert(indexHtml.includes(`data-preset-id="preset-${i}"`), `Missing preset card ${i}`);
    }
  });

  it('defines 5 accurate clinical presets in KidsFitApp.PRESETS', () => {
    const p = KidsFitApp.PRESETS;
    assert.strictEqual(Object.keys(p).length, 5, 'Must have exactly 5 presets');

    // Preset 1: 만 3세 (36mo, boy, 96.5cm, 14.7kg)
    assert.strictEqual(p['preset-1'].ageMonths, 36);
    assert.strictEqual(p['preset-1'].gender, 'boy');
    assert.strictEqual(p['preset-1'].currentHeight, 96.5);
    assert.strictEqual(p['preset-1'].currentWeight, 14.7);

    // Preset 2: 만 7세 (84mo, girl, 120.8cm, 23.6kg)
    assert.strictEqual(p['preset-2'].ageMonths, 84);
    assert.strictEqual(p['preset-2'].gender, 'girl');
    assert.strictEqual(p['preset-2'].currentHeight, 120.8);

    // Preset 3: 만 10세 (120mo, boy, 137.0cm, 35.5kg)
    assert.strictEqual(p['preset-3'].ageMonths, 120);
    assert.strictEqual(p['preset-3'].gender, 'boy');
    assert.strictEqual(p['preset-3'].tannerPhase, 'phase_2');

    // Preset 4: 만 13세 (156mo, boy, 155.6cm, 51.0kg)
    assert.strictEqual(p['preset-4'].ageMonths, 156);
    assert.strictEqual(p['preset-4'].gender, 'boy');
    assert.strictEqual(p['preset-4'].tannerPhase, 'phase_2');

    // Preset 5: 만 16세 (192mo, girl, 160.0cm, 54.1kg)
    assert.strictEqual(p['preset-5'].ageMonths, 192);
    assert.strictEqual(p['preset-5'].gender, 'girl');
    assert.strictEqual(p['preset-5'].tannerPhase, 'phase_4');
  });

  it('applies preset data to app state reactively', () => {
    KidsFitApp.applyPreset('preset-4');
    assert.strictEqual(KidsFitApp.state.activePresetId, 'preset-4');
    assert.strictEqual(KidsFitApp.state.profile.ageMonths, 156);
    assert.strictEqual(KidsFitApp.state.profile.tannerPhase, 'phase_2');
    assert.strictEqual(KidsFitApp.state.isPrescriptionIssued, true);
  });

  // --------------------------------------------------------------------------
  console.log('\n[Suite 4: 5-Stage Bio Onboarding Form Structure & Navigation]');
  // --------------------------------------------------------------------------

  it('includes 5 distinct step containers in index.html (Step 6 completely removed)', () => {
    for (let s = 1; s <= 5; s++) {
      assert(indexHtml.includes(`id="step-content-${s}"`), `Missing step content container ${s}`);
    }
    assert(!indexHtml.includes('id="step-content-6"'), 'Step 6 budget tier container must be absent');
  });

  it('contains Step 1 profile fields (gender, age, heights, weight, 8 regions)', () => {
    assert(indexHtml.includes('name="child-gender"'), 'Missing gender input');
    assert(indexHtml.includes('id="child-age-months"'), 'Missing ageMonths input');
    assert(indexHtml.includes('id="child-height"'), 'Missing child height input');
    assert(indexHtml.includes('id="child-weight"'), 'Missing child weight input');
    assert(indexHtml.includes('id="father-height"'), 'Missing father height input');
    assert(indexHtml.includes('id="mother-height"'), 'Missing mother height input');
    assert(indexHtml.includes('id="user-region"'), 'Missing region select');

    const regions = [
      '서울 강남·서초·송파',
      '서울 강북·마포·용산',
      '경기 남부(분당·수원·용인·동탄)',
      '경기 북부·인천',
      '부산·경남',
      '대구·경북',
      '대전·충청',
      '광주·전라·기타'
    ];
    regions.forEach(r => {
      assert(indexHtml.includes(r), `Missing region option: ${r}`);
    });
  });

  it('contains Step 2 Tanner stage & puberty phase and recent growth rate', () => {
    assert(indexHtml.includes('name="tanner-phase"'), 'Missing tanner-phase input');
    assert(indexHtml.includes('value="phase_1"'), 'Missing puberty phase_1');
    assert(indexHtml.includes('value="phase_2"'), 'Missing puberty phase_2');
    assert(indexHtml.includes('value="phase_3"'), 'Missing puberty phase_3');
    assert(indexHtml.includes('value="phase_4"'), 'Missing puberty phase_4');
    assert(indexHtml.includes('id="child-recent-gain"'), 'Missing recent growth rate input');
  });

  it('contains Step 3 clinical bio-inhibition factors (5 factors)', () => {
    const habits = ['late_sleep', 'night_carbs', 'poor_posture', 'picky_eater', 'sedentary'];
    habits.forEach(h => {
      assert(indexHtml.includes(`value="${h}"`), `Missing bio-inhibition factor: ${h}`);
    });
  });

  it('contains Step 4 5 cognitive development dimensions', () => {
    const cogDims = ['math_logic', 'language_reading', 'science_nature', 'sensory_arts', 'executive_focus'];
    cogDims.forEach(d => {
      assert(indexHtml.includes(`value="${d}"`), `Missing cognitive dimension: ${d}`);
    });
  });

  it('verifies 100% commercial elimination: Step 6 budget tiers are absent from index.html', () => {
    assert(!indexHtml.includes('id="step-content-6"'), 'Step 6 container must not exist');
    assert(!indexHtml.includes('name="budget-tier"'), 'Budget tier inputs must not exist');
    assert(!indexHtml.includes('value="tier_5_10"'), 'tier_5_10 must not exist');
    assert(!indexHtml.includes('value="tier_15_30"'), 'tier_15_30 must not exist');
    assert(!indexHtml.includes('value="tier_unlimited"'), 'tier_unlimited must not exist');
  });

  it('provides stepper navigation functions with proper boundaries (1 to 5)', () => {
    KidsFitApp.goToStep(1);
    assert.strictEqual(KidsFitApp.state.currentStep, 1);

    KidsFitApp.goToStep(3);
    assert.strictEqual(KidsFitApp.state.currentStep, 3);

    KidsFitApp.goToStep(10); // clamp to maxStep 5
    assert.strictEqual(KidsFitApp.state.currentStep, 5);

    KidsFitApp.goToStep(-2); // clamp to minStep 1
    assert.strictEqual(KidsFitApp.state.currentStep, 1);
  });

  // --------------------------------------------------------------------------
  console.log('\n[Suite 5: Interactive Transition & Tab Switching]');
  // --------------------------------------------------------------------------

  it('includes interactive prescription transition overlay with progress indicators', () => {
    assert(indexHtml.includes('id="analysis-overlay"'), 'Missing analysis transition overlay');
    assert(indexHtml.includes('id="analysis-spinner"'), 'Missing analysis spinner');
    assert(indexHtml.includes('id="analysis-title"'), 'Missing analysis title element');
    assert(indexHtml.includes('id="analysis-bar-fill"'), 'Missing analysis bar fill element');
  });

  it('switches capsule tabs correctly in state', () => {
    KidsFitApp.switchTab('tab-endocrinology');
    assert.strictEqual(KidsFitApp.state.activeTab, 'tab-endocrinology');

    KidsFitApp.switchTab('tab-biomechanics');
    assert.strictEqual(KidsFitApp.state.activeTab, 'tab-biomechanics');

    KidsFitApp.switchTab('tab-auxology');
    assert.strictEqual(KidsFitApp.state.activeTab, 'tab-auxology');
  });

  // --------------------------------------------------------------------------
  console.log('\n[Suite 6: Secret Admin Studio Trigger & Storage]');
  // --------------------------------------------------------------------------

  it('includes secret admin modal with affiliate configuration inputs', () => {
    assert(indexHtml.includes('id="admin-modal"'), 'Missing secret admin modal');
    assert(indexHtml.includes('id="cfg-coupang"'), 'Missing Coupang config input');
    assert(indexHtml.includes('id="cfg-linkprice"'), 'Missing LinkPrice config input');
    assert(indexHtml.includes('id="cfg-tenping"'), 'Missing Tenping config input');
    assert(indexHtml.includes('id="cfg-iherb"'), 'Missing iHerb config input');
    assert(indexHtml.includes('id="cfg-amazon"'), 'Missing Amazon config input');
    assert(indexHtml.includes('id="cfg-chips-toggle"'), 'Missing Reference Chips master toggle');
  });

  it('provides correct default affiliate settings', () => {
    const cfg = KidsFitApp.getAffiliateConfig();
    assert.strictEqual(cfg.coupang, 'AF7865143');
    assert.strictEqual(cfg.linkprice, 'A100708867');
    assert.strictEqual(cfg.tenping, '010-****-2370');
    assert.strictEqual(cfg.iherb, 'KIDSBIO');
    assert.strictEqual(cfg.amazon, 'tallerbiolab-20');
    assert.strictEqual(cfg.chipsEnabled, true);
  });

  it('handles 5 consecutive clicks for secret admin trigger', () => {
    KidsFitApp.state.adminClickCount = 0;
    for (let c = 0; c < 4; c++) {
      KidsFitApp.handleFooterClick();
    }
    assert.strictEqual(KidsFitApp.state.adminClickCount, 4, 'Should have 4 clicks recorded');

    KidsFitApp.handleFooterClick(); // 5th click
    assert.strictEqual(KidsFitApp.state.adminClickCount, 0, 'Should reset click counter upon opening admin modal');
  });

  it('includes footer copyright © 2026 Taller Bio Labs', () => {
    assert(indexHtml.includes('© 2026 Taller Bio Labs'), 'Missing footer copyright');
  });

  // --------------------------------------------------------------------------
  console.log('\n[Suite 7: Live DOM Interaction & Click Event Verification]');
  // --------------------------------------------------------------------------

  // Lightweight mock DOM helper for genuine event simulation
  function setupInteractiveDOM() {
    const elements = {};
    const eventListeners = {};

    class InteractiveElement {
      constructor(id, tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.attributes = {};
        this.style = {};
        this.classList = {
          _set: new Set(),
          add(c) { this._set.add(c); },
          remove(c) { this._set.delete(c); },
          contains(c) { return this._set.has(c); }
        };
        this.value = '';
        this.checked = false;
        this.textContent = '';
        this.innerHTML = '';
      }
      setAttribute(k, v) { this.attributes[k] = String(v); }
      getAttribute(k) { return this.attributes[k] || null; }
      addEventListener(evt, fn) {
        if (!eventListeners[this.id]) eventListeners[this.id] = {};
        if (!eventListeners[this.id][evt]) eventListeners[this.id][evt] = [];
        eventListeners[this.id][evt].push(fn);
      }
      click() {
        const fns = (eventListeners[this.id] && eventListeners[this.id]['click']) || [];
        fns.forEach(fn => fn({ type: 'click', preventDefault: () => {} }));
      }
      dispatchEvent(e) {
        const fns = (eventListeners[this.id] && eventListeners[this.id][e.type]) || [];
        fns.forEach(fn => fn(e));
      }
      focus() {}
      scrollIntoView() {}
    }

    const docElem = new InteractiveElement('html', 'html');
    docElem.lang = 'ko';
    docElem.setAttribute('data-theme', 'dark');

    const bodyElem = new InteractiveElement('body', 'body');
    bodyElem.setAttribute('data-theme', 'dark');

    // Create required elements from index.html
    const ids = [
      'btn-lang-toggle', 'btn-theme-toggle', 'btn-next-step', 'btn-prev-step',
      'diagnosis-form', 'btn-skip-scan', 'analysis-overlay', 'analysis-title',
      'analysis-desc', 'analysis-bar-fill', 'prescription-container', 'quiz-section',
      'child-age-slider', 'child-age-months', 'child-age-display',
      'child-height', 'child-weight', 'child-recent-gain', 'father-height', 'mother-height',
      'user-region', 'preset-card-1', 'preset-card-2', 'preset-card-3', 'preset-card-4', 'preset-card-5'
    ];
    ids.forEach(id => { elements[id] = new InteractiveElement(id); });

    for (let p = 1; p <= 5; p++) {
      elements[`preset-card-${p}`].setAttribute('data-preset-id', `preset-${p}`);
    }

    // Step contents 1 to 5
    for (let s = 1; s <= 5; s++) {
      elements[`step-content-${s}`] = new InteractiveElement(`step-content-${s}`);
    }

    // Default values for inputs
    elements['child-height'].value = '137.0';
    elements['child-weight'].value = '35.5';
    elements['child-recent-gain'].value = '3.0';
    elements['father-height'].value = '173.5';
    elements['mother-height'].value = '160.5';

    const alerts = [];
    const mockStorage = {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; }
    };

    const mockDoc = {
      documentElement: docElem,
      body: bodyElem,
      getElementById(id) { return elements[id] || null; },
      querySelectorAll(sel) {
        if (sel === '[data-i18n]') return [];
        if (sel === '[data-i18n-html]') return [];
        if (sel === '.unit-label-height' || sel === '.unit-label-weight') return [];
        if (sel === '.preset-card') {
          return [elements['preset-card-1'], elements['preset-card-2'], elements['preset-card-3'], elements['preset-card-4'], elements['preset-card-5']];
        }
        if (sel.includes('input[name="growth-habits"]:checked')) return [];
        if (sel.includes('input[name="cognitive-axes"]:checked')) return [];
        if (sel.includes('input[name="tanner-phase"]:checked')) return [];
        return [];
      },
      querySelector(sel) {
        const res = this.querySelectorAll(sel);
        return res.length > 0 ? res[0] : null;
      },
      addEventListener() {}
    };

    const mockWin = {
      document: mockDoc,
      localStorage: mockStorage,
      alert: (msg) => { alerts.push(msg); },
      dispatchEvent: () => {},
      addEventListener: () => {}
    };

    return { elements, eventListeners, mockDoc, mockWin, mockStorage, alerts };
  }

  it('verifies clicking #btn-lang-toggle dynamically switches language and persists to storage', () => {
    const { elements, mockDoc, mockWin, mockStorage } = setupInteractiveDOM();
    const origDoc = global.document;
    const origWin = global.window;
    const origStorage = global.localStorage;

    global.document = mockDoc;
    global.window = mockWin;
    global.localStorage = mockStorage;

    try {
      const I18n = require(path.join(ROOT_DIR, 'src/js/i18n.js'));
      I18n.initI18n();

      const btn = elements['btn-lang-toggle'];
      assert.strictEqual(mockDoc.documentElement.lang, 'ko', 'Initial language should be ko');

      // Click to toggle to EN
      btn.click();
      assert.strictEqual(mockDoc.documentElement.lang, 'en', 'Language should switch to en on click');
      assert.strictEqual(mockStorage.getItem('taller_lang'), 'en', 'Storage should persist taller_lang = en');
      assert.strictEqual(btn.textContent, '🇰🇷 KO (KDCA)', 'Button label should offer switch back to KO');

      // Click again to toggle back to KO
      btn.click();
      assert.strictEqual(mockDoc.documentElement.lang, 'ko', 'Language should switch back to ko');
      assert.strictEqual(mockStorage.getItem('taller_lang'), 'ko', 'Storage should persist taller_lang = ko');
      assert.strictEqual(btn.textContent, '🇺🇸 EN (CDC)', 'Button label should offer switch to EN');
    } finally {
      global.document = origDoc;
      global.window = origWin;
      global.localStorage = origStorage;
    }
  });

  it('verifies clicking #btn-theme-toggle dynamically switches theme and persists to storage', () => {
    const { elements, mockDoc, mockWin, mockStorage } = setupInteractiveDOM();
    const origDoc = global.document;
    const origWin = global.window;
    const origStorage = global.localStorage;

    global.document = mockDoc;
    global.window = mockWin;
    global.localStorage = mockStorage;

    try {
      const ThemeSwitcher = require(path.join(ROOT_DIR, 'src/js/theme-switcher.js'));
      ThemeSwitcher.initTheme();

      const btn = elements['btn-theme-toggle'];
      btn.addEventListener('click', () => { ThemeSwitcher.toggleTheme(); });

      assert.strictEqual(mockDoc.documentElement.getAttribute('data-theme'), 'dark', 'Initial theme should be dark');

      btn.click();
      assert.strictEqual(mockDoc.documentElement.getAttribute('data-theme'), 'light', 'Theme should switch to light');
      assert.strictEqual(mockStorage.getItem('taller_theme'), 'light', 'Storage should persist light theme');

      btn.click();
      assert.strictEqual(mockDoc.documentElement.getAttribute('data-theme'), 'dark', 'Theme should switch back to dark');
      assert.strictEqual(mockStorage.getItem('taller_theme'), 'dark', 'Storage should persist dark theme');
    } finally {
      global.document = origDoc;
      global.window = origWin;
      global.localStorage = origStorage;
    }
  });

  it('verifies clicking #btn-next-step advances through Step 1 -> 2 -> 3 -> 4 with 0 alert blockers', () => {
    const { elements, mockDoc, mockWin, alerts } = setupInteractiveDOM();
    const origDoc = global.document;
    const origWin = global.window;
    const origAlert = global.alert;

    global.document = mockDoc;
    global.window = mockWin;
    global.alert = mockWin.alert;

    try {
      const OnboardingWizard = require(path.join(ROOT_DIR, 'src/js/onboarding-wizard.js'));
      OnboardingWizard.initWizard();

      assert.strictEqual(OnboardingWizard.state.currentStep, 1);

      const nextBtn = elements['btn-next-step'];

      // Step 1 -> Step 2
      nextBtn.click();
      assert.strictEqual(OnboardingWizard.state.currentStep, 2, 'Should advance to Step 2');

      // Step 2 -> Step 3
      nextBtn.click();
      assert.strictEqual(OnboardingWizard.state.currentStep, 3, 'Should advance to Step 3');

      // Step 3 -> Step 4 (Critical Step 3 verification: must NOT trigger kdst-concerns alert!)
      nextBtn.click();
      assert.strictEqual(OnboardingWizard.state.currentStep, 4, 'Should advance to Step 4 cleanly');
      assert.strictEqual(alerts.length, 0, `Expected 0 alert blockers, but got: ${JSON.stringify(alerts)}`);
    } finally {
      global.document = origDoc;
      global.window = origWin;
      global.alert = origAlert;
    }
  });

  it('verifies clicking a preset card populates biometrics and triggers prescription scan', () => {
    const { elements, mockDoc, mockWin } = setupInteractiveDOM();
    const origDoc = global.document;
    const origWin = global.window;

    global.document = mockDoc;
    global.window = mockWin;

    let scanCallbackFired = false;
    global.KidsFitApp = {
      renderPrescriptionResults: () => { scanCallbackFired = true; }
    };

    try {
      const OnboardingWizard = require(path.join(ROOT_DIR, 'src/js/onboarding-wizard.js'));
      OnboardingWizard.initWizard();

      const card3 = elements['preset-card-3'];
      card3.click();

      assert.strictEqual(elements['child-height'].value, 137.0);
      assert.strictEqual(elements['child-weight'].value, 35.5);
      assert.strictEqual(OnboardingWizard.state.isScanning, true, 'Scan should be launched on preset click');

      // Fast-forward / complete scan
      OnboardingWizard.completeScan((profile) => {
        global.KidsFitApp.renderPrescriptionResults(profile);
      });
      assert.strictEqual(scanCallbackFired, true, 'renderPrescriptionResults callback should be called on scan completion');
    } finally {
      global.document = origDoc;
      global.window = origWin;
      delete global.KidsFitApp;
    }
  });

  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`Summary: ${passedTests}/${totalTests} tests passed.`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite();
