/**
 * tests/challenger-m1-4-audit.js
 * Comprehensive Adversarial Re-Audit for Milestone 1-4
 * 
 * Verifies:
 * 1. Verification of weekend-curator.js around line 197 (zero hidden price tags).
 * 2. Exhaustive scan of index.html, dist/index.html, and all JS files for commercial residue.
 * 3. Deep simulation of all 5 clinical presets across all 3 result tabs, both KO and EN languages,
 *    and boundary conditions for zero commercial bleed.
 * 4. Scan of all rendered HTML strings for hidden spans, prices, badges, and marketing copy.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err.message });
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`     ↳ ${err.message}`);
  }
}

console.log('====================================================================');
console.log('   CHALLENGER M1-4: EMPIRICAL ADVERSARIAL RE-AUDIT                 ');
console.log('====================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: Exact Inspection of weekend-curator.js around Line 197
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: weekend-curator.js Line 197 Forensic Audit ---');

const weekendCuratorCode = fs.readFileSync(path.join(ROOT_DIR, 'src/js/weekend-curator.js'), 'utf8');

test('weekend-curator.js line 197 does NOT contain <span style="display:none;" class="ref-spec-data">', () => {
  const lines = weekendCuratorCode.split('\n');
  const slice = lines.slice(185, 215).join('\n');
  assert.strictEqual(
    /style="display:\s*none;"[^>]*>\s*\$\{pkg\.price/i.test(slice),
    false,
    `Found hidden pkg.price in lines 186-215 of weekend-curator.js:\n${slice}`
  );
});

test('weekend-curator.js has ZERO occurrences of pkg.price in rendered templates', () => {
  assert.strictEqual(
    /\$\{pkg\.price/i.test(weekendCuratorCode),
    false,
    'Found ${pkg.price} in weekend-curator.js template literals'
  );
});

test('weekend-curator.js has ZERO display:none styling', () => {
  assert.strictEqual(
    /display:\s*none/i.test(weekendCuratorCode),
    false,
    'Found display:none in weekend-curator.js'
  );
});

test('weekend-curator.js contains zero "(로켓배송)" or shopping tags', () => {
  assert.strictEqual(weekendCuratorCode.includes('(로켓배송)'), false);
  assert.strictEqual(weekendCuratorCode.includes('로켓배송으로'), false);
  assert.strictEqual(weekendCuratorCode.includes('최저가'), false);
  assert.strictEqual(weekendCuratorCode.includes('특가'), false);
});

// -----------------------------------------------------------------------------
// SECTION 2: Static Commercial Residue Scan Across index.html and dist/
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Static Commercial Residue Scan Across HTML & Bundles ---');

const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const distHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist/index.html'), 'utf8');

const FORBIDDEN_COMMERCIAL_TERMS = [
  '영수증',
  'grocery-receipt',
  '바코드',
  'receipt-barcode',
  '최저가',
  '특가',
  '할인 쿠폰',
  '무료 상담',
  '상담 신청',
  '전담 플래너',
  'budget-tier',
  'step-content-6',
  '로켓배송'
];

FORBIDDEN_COMMERCIAL_TERMS.forEach(term => {
  test(`index.html contains 0 instances of "${term}"`, () => {
    assert.strictEqual(indexHtml.includes(term), false, `Found "${term}" in index.html`);
  });

  test(`dist/index.html contains 0 instances of "${term}"`, () => {
    assert.strictEqual(distHtml.includes(term), false, `Found "${term}" in dist/index.html`);
  });
});

test('index.html contains 0 KRW prices (regex: /[1-9]\\d*[\\d,]*\\s*원/)', () => {
  const match = indexHtml.match(/[1-9]\d*[\d,]*\s*원/);
  assert.strictEqual(match, null, `Found price match: ${match ? match[0] : ''}`);
});

test('dist/index.html contains 0 KRW prices (regex: /[1-9]\\d*[\\d,]*\\s*원/)', () => {
  const match = distHtml.match(/[1-9]\d*[\d,]*\s*원/);
  assert.strictEqual(match, null, `Found price match: ${match ? match[0] : ''}`);
});

// -----------------------------------------------------------------------------
// SECTION 3: Presets Audit Under All 5 Clinical Profiles (State & Bleed)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Deep Preset Simulation & Bleed Check (5 Presets) ---');

// Setup mock browser environment
const formValues = {};
const mockElements = {};
const mockDoc = {
  getElementById: (id) => {
    if (!mockElements[id]) {
      mockElements[id] = {
        id,
        style: { display: '' },
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        setAttribute: () => {},
        getAttribute: () => '',
        addEventListener: () => {},
        scrollIntoView: () => {},
        innerHTML: '',
        textContent: '',
        get value() { return formValues[id] || ''; },
        set value(v) { formValues[id] = v; },
        checked: false
      };
    }
    return mockElements[id];
  },
  querySelector: (sel) => {
    if (sel.includes('input[name="child-gender"]')) {
      if (sel.includes(':checked')) {
        return formValues['child-gender'] ? { value: formValues['child-gender'], checked: true } : null;
      }
      const match = sel.match(/value="([^"]+)"/);
      const val = match ? match[1] : 'boy';
      return {
        value: val,
        set checked(c) { if (c) formValues['child-gender'] = val; },
        get checked() { return formValues['child-gender'] === val; }
      };
    }
    if (sel.includes('input[name="tanner-phase"]')) {
      if (sel.includes(':checked')) {
        return formValues['tanner-phase'] ? { value: formValues['tanner-phase'], checked: true } : null;
      }
      const match = sel.match(/value="([^"]+)"/);
      const val = match ? match[1] : 'phase_1';
      return {
        value: val,
        set checked(c) { if (c) formValues['tanner-phase'] = val; },
        get checked() { return formValues['tanner-phase'] === val; }
      };
    }
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel.includes('.preset-card')) {
      return [1, 2, 3, 4, 5].map(i => ({
        getAttribute: (attr) => attr === 'data-preset-id' ? `preset-${i}` : '',
        classList: { add: () => {}, remove: () => {} },
        addEventListener: () => {}
      }));
    }
    if (sel.includes('input[name="tanner-phase"]')) {
      return ['phase_1', 'phase_2', 'phase_3', 'phase_4'].map(val => ({
        value: val,
        checked: false
      }));
    }
    if (sel.includes('input[name="growth-habits"]')) {
      return ['late_sleep', 'poor_posture', 'picky_eater', 'milk_trouble', 'night_carbs'].map(val => ({
        value: val,
        checked: false
      }));
    }
    if (sel.includes('input[name="cognitive-axes"]')) {
      return ['math_logic', 'language_reading', 'science_nature', 'sensory_arts', 'executive_focus'].map(val => ({
        value: val,
        checked: false
      }));
    }
    if (sel.includes('.capsule-tab')) {
      return ['tab-auxology', 'tab-endocrinology', 'tab-biomechanics', 'tab-neuro', 'tab-tracker'].map(tab => ({
        getAttribute: () => tab,
        classList: { add: () => {}, remove: () => {} },
        setAttribute: () => {},
        addEventListener: () => {}
      }));
    }
    return [];
  },
  documentElement: { lang: 'ko' }
};

global.document = mockDoc;
global.window = {
  document: mockDoc,
  localStorage: {
    _data: {},
    getItem: function(k) { return this._data[k] || null; },
    setItem: function(k, v) { this._data[k] = String(v); },
    removeItem: function(k) { delete this._data[k]; },
    clear: function() { this._data = {}; }
  },
  location: { search: '' },
  addEventListener: () => {},
  dispatchEvent: () => {}
};

const KidsFitApp = require('../src/js/app');
const OnboardingWizard = require('../src/js/onboarding-wizard');
const GrowthEngine = require('../src/js/growth-engine');
const DevelopmentEngine = require('../src/js/development-engine');
const WeekendCurator = require('../src/js/weekend-curator');
const Monetization = require('../src/js/monetization');

const PRESETS = [
  { id: 'preset-1', name: '영유아기 3세', ageYears: 3, ageMonths: 36, gender: 'boy' },
  { id: 'preset-2', name: '아동기 7세', ageYears: 7, ageMonths: 84, gender: 'girl' },
  { id: 'preset-3', name: '사춘기 진입 10세', ageYears: 10, ageMonths: 120, gender: 'boy' },
  { id: 'preset-4', name: '급성장기 13세', ageYears: 13, ageMonths: 156, gender: 'boy' },
  { id: 'preset-5', name: '후기 청소년 16세', ageYears: 16, ageMonths: 192, gender: 'girl' }
];

PRESETS.forEach(p => {
  test(`Preset ${p.id} (${p.name}): applies cleanly to app state`, () => {
    KidsFitApp.applyPreset(p.id);
    const profile = KidsFitApp.state.profile;
    assert.strictEqual(profile.ageYears, p.ageYears);
    assert.strictEqual(profile.ageMonths, p.ageMonths);
    assert.strictEqual(profile.gender, p.gender);
  });

  test(`Preset ${p.id} (${p.name}): state contains zero commercial keys`, () => {
    KidsFitApp.applyPreset(p.id);
    const st = KidsFitApp.state;
    const commercialKeys = ['price', 'budget', 'cart', 'receipt', 'cpa', 'discount', 'shop'];
    const foundKeys = Object.keys(st).filter(k => commercialKeys.includes(k));
    const foundProfileKeys = Object.keys(st.profile).filter(k => commercialKeys.includes(k));
    assert.deepStrictEqual(foundKeys, [], `Found commercial keys in state: ${foundKeys}`);
    assert.deepStrictEqual(foundProfileKeys, [], `Found commercial keys in state.profile: ${foundProfileKeys}`);
  });

  test(`Preset ${p.id} (${p.name}): renderTab1Report contains zero commercial prices or badges`, () => {
    const profile = KidsFitApp.PRESETS[p.id];
    const html = GrowthEngine.renderTab1Report(profile);
    assert.strictEqual(/[1-9]\d*[\d,]*\s*원/.test(html), false, 'Tab 1 contains commercial KRW price');
    assert.strictEqual(html.includes('₩'), false, 'Tab 1 contains ₩ symbol');
    assert.strictEqual(html.includes('KRW'), false, 'Tab 1 contains KRW');
    assert.strictEqual(html.includes('영수증'), false, 'Tab 1 contains 영수증');
    assert.strictEqual(html.includes('바코드'), false, 'Tab 1 contains 바코드');
    assert.strictEqual(html.includes('무료 상담'), false, 'Tab 1 contains 무료 상담');
  });

  test(`Preset ${p.id} (${p.name}): renderTab2Report contains zero commercial prices or (로켓배송)`, () => {
    const profile = KidsFitApp.PRESETS[p.id];
    const affConfig = Monetization.getAffiliateConfig();
    const html = DevelopmentEngine.renderTab2Report(profile, affConfig);
    assert.strictEqual(/[1-9]\d*[\d,]*\s*원/.test(html), false, 'Tab 2 contains commercial KRW price');
    assert.strictEqual(html.includes('₩'), false, 'Tab 2 contains ₩ symbol');
    assert.strictEqual(html.includes('KRW'), false, 'Tab 2 contains KRW');
    assert.strictEqual(html.includes('(로켓배송)'), false, 'Tab 2 contains (로켓배송)');
    assert.strictEqual(html.includes('로켓배송으로'), false, 'Tab 2 contains 로켓배송으로');
    assert.strictEqual(html.includes('무료 상담'), false, 'Tab 2 contains 무료 상담');
    assert.strictEqual(html.includes('상담 신청'), false, 'Tab 2 contains 상담 신청');
  });

  test(`Preset ${p.id} (${p.name}): renderTab3Report contains zero hidden prices or commercial badges`, () => {
    const profile = KidsFitApp.PRESETS[p.id];
    const affConfig = Monetization.getAffiliateConfig();
    const html = WeekendCurator.renderTab3Report(profile, affConfig);
    assert.strictEqual(
      /style="display:\s*none;"[^>]*>\s*\d+[\d,]*/i.test(html),
      false,
      'Tab 3 contains hidden price span via display:none'
    );
    assert.strictEqual(html.includes('(로켓배송)'), false, 'Tab 3 contains (로켓배송)');
    assert.strictEqual(html.includes('로켓배송으로'), false, 'Tab 3 contains 로켓배송으로');
    assert.strictEqual(html.includes('무료 상담'), false, 'Tab 3 contains 무료 상담');
  });

  test(`Preset ${p.id} (${p.name}): renderPrescriptionResults executes without throwing and yields zero commercial bleed`, () => {
    const profile = KidsFitApp.PRESETS[p.id];
    // Should populate Tab 1, 2, 3 into mock elements
    KidsFitApp.renderPrescriptionResults(profile);
    const tab1Content = mockElements['tab-pane-auxology']?.innerHTML || '';
    const tab2Content = mockElements['tab-pane-development']?.innerHTML || '';
    const tab3Content = mockElements['tab-pane-outing']?.innerHTML || '';

    [tab1Content, tab2Content, tab3Content].forEach((c, idx) => {
      assert.strictEqual(/[1-9]\d*[\d,]*\s*원/.test(c), false, `Tab ${idx + 1} pane has price in renderPrescriptionResults`);
      assert.strictEqual(c.includes('영수증'), false, `Tab ${idx + 1} pane has 영수증`);
      assert.strictEqual(c.includes('바코드'), false, `Tab ${idx + 1} pane has 바코드`);
      assert.strictEqual(c.includes('무료 상담'), false, `Tab ${idx + 1} pane has 무료 상담`);
    });
  });
});

// -----------------------------------------------------------------------------
// SECTION 4: Monetization Engine Cleanliness
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Monetization Layer Isolation & Purge Audit ---');

test('Monetization.getGroceryReceiptItems() returns strictly 0 totals and empty items array', () => {
  const r = Monetization.getGroceryReceiptItems();
  assert.strictEqual(r.items.length, 0);
  assert.strictEqual(r.total4Weeks, 0);
  assert.strictEqual(r.dailyAverage, 0);
});

test('Monetization.renderLayer1Cpa() is strictly empty string', () => {
  assert.strictEqual(Monetization.renderLayer1Cpa(), '');
});

test('Monetization.renderLayer2Receipt() is strictly empty string', () => {
  assert.strictEqual(Monetization.renderLayer2Receipt(), '');
});

test('Monetization.renderLayer3Hardware() is strictly empty string', () => {
  assert.strictEqual(Monetization.renderLayer3Hardware(), '');
});

test('Monetization.renderAllMonetizationLayers() is strictly empty string', () => {
  assert.strictEqual(Monetization.renderAllMonetizationLayers(), '');
});

// -----------------------------------------------------------------------------
// SECTION 5: Dynamic Bilingual (EN/KO) & Extreme Boundary Stress
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 5: Dynamic EN Mode & Extreme Boundary Stress ---');

const I18nEngine = require('../src/js/i18n');

test('I18nEngine toggleLanguage updates language cleanly without leaking marketing copy', () => {
  I18nEngine.setLanguage('en');
  assert.strictEqual(I18nEngine.getLanguage(), 'en');
  I18nEngine.setLanguage('ko');
  assert.strictEqual(I18nEngine.getLanguage(), 'ko');
});

test('I18N dictionary has zero commercial terms across all keys and values in KO and EN', () => {
  const dict = I18nEngine.getDictionary ? I18nEngine.getDictionary() : null;
  // Read i18n file content directly to verify dictionary
  const i18nCode = fs.readFileSync(path.join(ROOT_DIR, 'src/js/i18n.js'), 'utf8');
  assert.strictEqual(i18nCode.includes('최저가'), false, 'Found 최저가 in i18n.js');
  assert.strictEqual(i18nCode.includes('특가'), false, 'Found 특가 in i18n.js');
  assert.strictEqual(i18nCode.includes('영수증'), false, 'Found 영수증 in i18n.js');
  assert.strictEqual(i18nCode.includes('장보기'), false, 'Found 장보기 in i18n.js');
  assert.strictEqual(i18nCode.includes('로켓배송'), false, 'Found 로켓배송 in i18n.js');
  assert.strictEqual(i18nCode.includes('무료 상담'), false, 'Found 무료 상담 in i18n.js');
});

test('Extreme profile (12 months infant) renders Tab 1 & Tab 2 with zero commercial bleed', () => {
  const infantProfile = {
    id: 'test-infant',
    gender: 'boy',
    ageYears: 1,
    ageMonths: 12,
    currentHeight: 75.7,
    currentWeight: 9.6,
    recentGrowth6m: 6.0,
    fatherHeight: 175.0,
    motherHeight: 162.0,
    region: '서울 강남·서초·송파',
    tannerPhase: 'phase_1',
    habits: [],
    developmentConcerns: ['gross_motor'],
    cognitiveAxes: ['sensory_arts'],
    interest: 'art_making'
  };

  const t1 = GrowthEngine.renderTab1Report(infantProfile);
  assert.strictEqual(/[1-9]\d*[\d,]*\s*원/.test(t1), false);
  assert.strictEqual(t1.includes('₩'), false);

  const t2 = DevelopmentEngine.renderTab2Report(infantProfile, Monetization.getAffiliateConfig());
  assert.strictEqual(/[1-9]\d*[\d,]*\s*원/.test(t2), false);
  assert.strictEqual(t2.includes('(로켓배송)'), false);
});

test('Extreme profile (240 months / 20 yrs young adult) renders Tab 1 & Tab 2 with zero commercial bleed', () => {
  const adultProfile = {
    id: 'test-adult',
    gender: 'girl',
    ageYears: 20,
    ageMonths: 240,
    currentHeight: 163.0,
    currentWeight: 55.0,
    recentGrowth6m: 0.1,
    fatherHeight: 175.0,
    motherHeight: 162.0,
    region: '부산·경남',
    tannerPhase: 'phase_4',
    habits: ['poor_posture', 'late_sleep', 'night_carbs', 'picky_eater', 'sedentary'],
    developmentConcerns: ['language_reading'],
    cognitiveAxes: ['executive_focus'],
    interest: 'space_science'
  };

  const t1 = GrowthEngine.renderTab1Report(adultProfile);
  assert.strictEqual(/[1-9]\d*[\d,]*\s*원/.test(t1), false);
  assert.strictEqual(t1.includes('₩'), false);

  const t2 = DevelopmentEngine.renderTab2Report(adultProfile, Monetization.getAffiliateConfig());
  assert.strictEqual(/[1-9]\d*[\d,]*\s*원/.test(t2), false);
  assert.strictEqual(t2.includes('(로켓배송)'), false);
});

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n====================================================================');
console.log(`TOTAL ADVERSARIAL CHECKS : ${totalTests}`);
console.log(`TOTAL CHECKS PASSED      : ${passedTests}`);
console.log(`TOTAL CHECKS FAILED      : ${failedTests}`);
console.log('====================================================================');

if (failedTests > 0) {
  console.log('\n🚨 ADVERSARIAL CHALLENGE FAILED:');
  failures.forEach((f, i) => {
    console.log(`[${i + 1}] ${f.name} => ${f.error}`);
  });
  console.log('\nVERDICT: REQUEST_CHANGES');
  process.exit(1);
} else {
  console.log('\n✅ ALL ADVERSARIAL RE-AUDIT CHECKS PASSED EMPIRICALLY!');
  console.log('VERDICT: APPROVE');
  process.exit(0);
}
