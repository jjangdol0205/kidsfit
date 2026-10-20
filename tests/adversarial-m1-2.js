/**
 * tests/adversarial-m1-2.js
 * Adversarial Empirical Verification Suite for Milestone 1-2
 * Focus: Commercial Residue Elimination & 5 Age Presets State Cleanliness
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

const findings = [];
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function check(title, condition, detail = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ [PASS] ${title}`);
  } else {
    failedAssertions++;
    findings.push({ title, detail });
    console.error(`  ✗ [FAIL] ${title}`);
    if (detail) console.error(`     ↳ Details: ${detail}`);
  }
}

console.log('====================================================================');
console.log('   CHALLENGER M1-2: ADVERSARIAL COMMERCIAL RESIDUE AUDIT             ');
console.log('====================================================================\n');

// ============================================================================
// PART 1: STATIC CODEBASE AUDIT FOR COMMERCIAL RESIDUE
// ============================================================================
console.log('--- PART 1: Static Codebase Audit (Commercial Residue & display:none) ---');

const projectFiles = [
  'index.html',
  'src/css/style.css',
  'src/js/app.js',
  'src/js/onboarding-wizard.js',
  'src/js/growth-engine.js',
  'src/js/development-engine.js',
  'src/js/weekend-curator.js',
  'src/js/monetization.js',
  'src/js/admin-osmu.js',
  'src/js/theme-switcher.js',
  'src/js/i18n.js'
];

const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'src/css/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(ROOT_DIR, 'src/js/app.js'), 'utf8');
const onboardingWizardJs = fs.readFileSync(path.join(ROOT_DIR, 'src/js/onboarding-wizard.js'), 'utf8');
const weekendCuratorJs = fs.readFileSync(path.join(ROOT_DIR, 'src/js/weekend-curator.js'), 'utf8');
const developmentEngineJs = fs.readFileSync(path.join(ROOT_DIR, 'src/js/development-engine.js'), 'utf8');
const monetizationJs = fs.readFileSync(path.join(ROOT_DIR, 'src/js/monetization.js'), 'utf8');

// 1.1 Check index.html for commercial text, barcodes, receipts, budget tiers
check('index.html contains 0 grocery receipt elements or text',
  !indexHtml.includes('영수증') && !indexHtml.includes('grocery-receipt') && !indexHtml.includes('장보기'),
  'Found receipt-related keywords in index.html'
);

check('index.html contains 0 barcode elements or classes',
  !indexHtml.includes('바코드') && !indexHtml.includes('receipt-barcode') && !indexHtml.includes('class="barcode"'),
  'Found barcode elements in index.html'
);

check('index.html contains 0 KRW prices or price tags',
  !/\d+[\d,]*\s*원/.test(indexHtml) && !indexHtml.includes('KRW') && !indexHtml.includes('₩'),
  'Found KRW price in index.html'
);

check('index.html contains 0 CPA consultation cards or deal badges',
  !indexHtml.includes('무료 상담') && !indexHtml.includes('상담 신청') && !indexHtml.includes('최저가') && !indexHtml.includes('특가'),
  'Found CPA / deal keywords in index.html'
);

check('index.html contains 0 budget tier inputs or Step 6',
  !indexHtml.includes('budget-tier') && !indexHtml.includes('step-content-6'),
  'Found budget-tier or step-content-6 in index.html'
);

// 1.2 Check src/css/style.css for hidden commercial classes
check('style.css contains 0 display:none hiding commercial receipts or barcodes',
  !styleCss.includes('.receipt') && !styleCss.includes('.barcode'),
  'Found .receipt or .barcode selectors in style.css'
);

// 1.3 Check weekend-curator.js for display:none hiding prices
// Specifically check: <span style="display:none;" class="ref-spec-data">${pkg.price.toLocaleString()}</span>
const hasHiddenPriceInCurator = /style="display:\s*none;"[^>]*>\s*\$\{pkg\.price/i.test(weekendCuratorJs);
check('weekend-curator.js has ZERO prices hidden via display:none (e.g. ref-spec-data pkg.price)',
  !hasHiddenPriceInCurator,
  'Found <span style="display:none;" class="ref-spec-data">${pkg.price.toLocaleString()}</span> in weekend-curator.js:197!'
);

// Check if weekend-curator.js renders (로켓배송) or commercial CTA
check('weekend-curator.js contains 0 "(로켓배송)" badges in rendered HTML',
  !weekendCuratorJs.includes('(로켓배송)') && !weekendCuratorJs.includes('로켓배송으로'),
  'Found (로켓배송) in weekend-curator.js'
);

// 1.4 Check development-engine.js for commercial text & prices
check('development-engine.js contains 0 "(로켓배송)" badges in rendered HTML',
  !developmentEngineJs.includes('(로켓배송)') && !developmentEngineJs.includes('로켓배송'),
  'Found (로켓배송) in development-engine.js'
);

check('development-engine.js renders 0 KRW prices in toy cards',
  !renderContainsPrice(developmentEngineJs),
  'Found price rendering in toy cards'
);

function renderContainsPrice(code) {
  // Check if renderToyCards renders price in template literals
  return /renderToyCards[\s\S]*?\$\{t\.price/i.test(code);
}

// 1.5 Check monetization.js
const Monetization = require('../src/js/monetization');
check('monetization.js getGroceryReceiptItems returns empty array and 0 totals',
  Monetization.getGroceryReceiptItems().items.length === 0 &&
  Monetization.getGroceryReceiptItems().total4Weeks === 0 &&
  Monetization.getGroceryReceiptItems().dailyAverage === 0,
  'getGroceryReceiptItems did not return empty object'
);

check('monetization.js renderLayer1Cpa returns empty string',
  Monetization.renderLayer1Cpa() === '',
  'renderLayer1Cpa did not return empty string'
);

check('monetization.js renderLayer2Receipt returns empty string',
  Monetization.renderLayer2Receipt() === '',
  'renderLayer2Receipt did not return empty string'
);

check('monetization.js renderAllMonetizationLayers returns empty string',
  Monetization.renderAllMonetizationLayers() === '',
  'renderAllMonetizationLayers did not return empty string'
);

check('monetization.js hardware recommendations contain 0 price attributes',
  Monetization.getHardwareRecommendations().every(h => h.price === undefined),
  'Hardware recommendations still expose price property'
);

// ============================================================================
// PART 2: TESTING THE 5 AGE PRESETS (3, 7, 10, 13, 16 YRS)
// ============================================================================
console.log('\n--- PART 2: Testing 5 Clinical Age Presets (State & DOM Output) ---');

const OnboardingWizard = require('../src/js/onboarding-wizard');
const KidsFitApp = require('../src/js/app');

const EXPECTED_PRESETS = [
  { id: 'preset-1', age: 3, months: 36, gender: 'boy', height: 96.5, weight: 14.7, tanner: 'phase_1' },
  { id: 'preset-2', age: 7, months: 84, gender: 'girl', height: 120.8, weight: 23.6, tanner: 'phase_1' },
  { id: 'preset-3', age: 10, months: 120, gender: 'boy', height: 137.0, weight: 35.5, tanner: 'phase_2' },
  { id: 'preset-4', age: 13, months: 156, gender: 'boy', height: 155.6, weight: 51.0, tanner: 'phase_2' },
  { id: 'preset-5', age: 16, months: 192, gender: 'girl', height: 160.0, weight: 54.1, tanner: 'phase_4' }
];

// 2.1 Verify Presets are accurately defined in both OnboardingWizard and KidsFitApp
EXPECTED_PRESETS.forEach(p => {
  const owPreset = OnboardingWizard.PRESETS[p.id];
  check(`OnboardingWizard: ${p.id} accurately defined for age ${p.age} (${p.months}mo, ${p.gender})`,
    owPreset &&
    owPreset.ageYears === p.age &&
    owPreset.ageMonths === p.months &&
    owPreset.gender === p.gender &&
    owPreset.currentHeight === p.height &&
    owPreset.currentWeight === p.weight &&
    owPreset.tannerPhase === p.tanner,
    `Mismatch in OnboardingWizard ${p.id}: ${JSON.stringify(owPreset)}`
  );

  const appPreset = KidsFitApp.PRESETS[p.id];
  check(`KidsFitApp: ${p.id} accurately defined for age ${p.age} (${p.months}mo, ${p.gender})`,
    appPreset &&
    appPreset.ageYears === p.age &&
    appPreset.ageMonths === p.months &&
    appPreset.gender === p.gender &&
    appPreset.currentHeight === p.height &&
    appPreset.currentWeight === p.weight &&
    appPreset.tannerPhase === p.tanner,
    `Mismatch in KidsFitApp ${p.id}: ${JSON.stringify(appPreset)}`
  );
});

// 2.2 Verify State Population and absence of commercial bleed for each preset
EXPECTED_PRESETS.forEach(p => {
  // Test in KidsFitApp
  KidsFitApp.applyPreset(p.id);
  const st = KidsFitApp.state;

  check(`Preset ${p.id}: Populates app profile state with correct biometrics`,
    st.profile.ageYears === p.age &&
    st.profile.ageMonths === p.months &&
    st.profile.gender === p.gender &&
    st.profile.currentHeight === p.height &&
    st.profile.currentWeight === p.weight &&
    st.profile.tannerPhase === p.tanner,
    `State profile values incorrect: ${JSON.stringify(st.profile)}`
  );

  // Check for any commercial bleed in state
  const stateKeys = Object.keys(st);
  const profileKeys = Object.keys(st.profile);
  const commercialStateKeys = ['budget', 'budgetTier', 'cart', 'receipt', 'price', 'cpa', 'discount'];
  const hasCommercialKey = commercialStateKeys.some(k => stateKeys.includes(k) || profileKeys.includes(k));

  check(`Preset ${p.id}: State contains zero commercial fields/bleed`,
    !hasCommercialKey,
    `Found commercial key in state: ${stateKeys.join(', ')} / ${profileKeys.join(', ')}`
  );

  // Verify that profile.habits is an array and does not contain shopping/commercial values
  check(`Preset ${p.id}: Habits array populated cleanly without commercial tokens`,
    Array.isArray(st.profile.habits) && st.profile.habits.length > 0 &&
    st.profile.habits.every(h => ['late_sleep', 'poor_posture', 'picky_eater', 'milk_trouble', 'obesity_risk', 'night_carbs', 'sedentary'].includes(h)),
    `Unexpected habit value: ${JSON.stringify(st.profile.habits)}`
  );

  // Verify cognitiveAxes is populated
  check(`Preset ${p.id}: Cognitive axes populated cleanly`,
    Array.isArray(st.profile.cognitiveAxes) && st.profile.cognitiveAxes.length > 0,
    `Cognitive axes missing or empty`
  );
});

// ============================================================================
// PART 3: DYNAMIC DOM SIMULATION AUDIT UNDER ALL 5 PRESETS
// ============================================================================
console.log('\n--- PART 3: Dynamic DOM Simulation (Zero Commercial Rendering Under Presets) ---');

function createMockDocument(html) {
  // Minimal DOM parser & mock for Node testing
  const elements = {};
  
  // Extract elements with id
  const idRegex = /id="([^"]+)"/g;
  let match;
  while ((match = idRegex.exec(html)) !== null) {
    const id = match[1];
    elements[id] = {
      id,
      style: { display: '' },
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      setAttribute: () => {},
      getAttribute: () => '',
      addEventListener: () => {},
      scrollIntoView: () => {},
      innerHTML: '',
      textContent: '',
      value: '',
      checked: false
    };
  }

  return {
    getElementById: (id) => elements[id] || null,
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
}

const mockDoc = createMockDocument(indexHtml);
global.document = mockDoc;
global.window = {
  document: mockDoc,
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  location: { search: '' },
  addEventListener: () => {},
  dispatchEvent: () => {}
};

const GrowthEngine = require('../src/js/growth-engine');
const DevelopmentEngine = require('../src/js/development-engine');
const WeekendCurator = require('../src/js/weekend-curator');

EXPECTED_PRESETS.forEach(p => {
  const profile = KidsFitApp.PRESETS[p.id];
  const affConfig = Monetization.getAffiliateConfig();

  // 3.1 Test Tab 1 Report HTML
  const tab1Html = GrowthEngine.renderTab1Report(profile);
  check(`Preset ${p.id}: Tab 1 Report HTML contains 0 KRW prices`,
    !/\d+[\d,]*\s*원/.test(tab1Html) && !tab1Html.includes('₩'),
    `Found KRW price in Tab 1 for ${p.id}`
  );
  check(`Preset ${p.id}: Tab 1 Report HTML contains 0 barcodes or receipts`,
    !tab1Html.includes('바코드') && !tab1Html.includes('영수증'),
    `Found barcode or receipt in Tab 1 for ${p.id}`
  );
  check(`Preset ${p.id}: Tab 1 Report HTML contains 0 CPA consultation cards`,
    !tab1Html.includes('무료 상담') && !tab1Html.includes('상담 신청'),
    `Found CPA consultation in Tab 1 for ${p.id}`
  );

  // 3.2 Test Tab 2 Report HTML
  const tab2Html = DevelopmentEngine.renderTab2Report(profile, affConfig);
  check(`Preset ${p.id}: Tab 2 Report HTML contains 0 commercial KRW prices in visible or hidden tags`,
    !/[1-9]\d*[\d,]*\s*원/.test(tab2Html) && !tab2Html.includes('₩') && !tab2Html.includes('KRW'),
    `Found commercial KRW price in Tab 2 for ${p.id}`
  );
  check(`Preset ${p.id}: Tab 2 Report HTML contains 0 "(로켓배송)" commercial badges`,
    !tab2Html.includes('(로켓배송)'),
    `Found (로켓배송) in Tab 2 for ${p.id}`
  );
  check(`Preset ${p.id}: Tab 2 Report HTML contains 0 CPA consultation cards`,
    !tab2Html.includes('무료 상담') && !tab2Html.includes('상담 신청'),
    `Found CPA consultation in Tab 2 for ${p.id}`
  );

  // 3.3 Test Tab 3 Report HTML
  const tab3Html = WeekendCurator.renderTab3Report(profile, affConfig);
  check(`Preset ${p.id}: Tab 3 Report HTML contains 0 "(로켓배송)" commercial badges`,
    !tab3Html.includes('(로켓배송)'),
    `Found (로켓배송) in Tab 3 for ${p.id}`
  );

  // CRITICAL CHECK: Does Tab 3 HTML contain the hidden price span?
  // <span style="display:none;" class="ref-spec-data">${pkg.price.toLocaleString()}</span>
  const hasHiddenPriceInRenderedHtml = /style="display:\s*none;"[^>]*>\s*\d+[\d,]*/i.test(tab3Html);
  check(`Preset ${p.id}: Tab 3 Report HTML has ZERO prices hidden via display:none`,
    !hasHiddenPriceInRenderedHtml,
    `Tab 3 rendered HTML contains hidden price via display:none: e.g. <span style="display:none;" class="ref-spec-data">...</span>`
  );

  // 3.4 Test Monetization Layers
  const monHtml = Monetization.renderAllMonetizationLayers(profile, affConfig);
  check(`Preset ${p.id}: Monetization layers render 100% empty string (no receipts/CPA/hardware)`,
    monHtml === '',
    `Monetization layers rendered non-empty content: ${monHtml}`
  );
});

// ============================================================================
// PART 4: SUMMARY & VERDICT
// ============================================================================
console.log('\n====================================================================');
console.log(`TOTAL AUDIT ASSERTIONS : ${totalAssertions}`);
console.log(`TOTAL AUDIT PASSED     : ${passedAssertions}`);
console.log(`TOTAL AUDIT FAILED     : ${failedAssertions}`);
console.log('====================================================================');

if (findings.length > 0) {
  console.log('\n🚨 ADVERSARIAL FINDINGS:');
  findings.forEach((f, idx) => {
    console.log(`[Finding ${idx + 1}] ${f.title}`);
    console.log(`            ${f.detail}`);
  });
  console.log('\nVERDICT: REQUEST_CHANGES');
  process.exit(1);
} else {
  console.log('\n✅ ALL ADVERSARIAL CHECKS PASSED WITH 100% SUCCESS.');
  console.log('VERDICT: APPROVE');
  process.exit(0);
}
