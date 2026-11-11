/**
 * tests/challenger-m3-empirical-verification.test.js
 * Empirical Challenger 2 Verification & Stress Test Harness for Milestone 3 (Division 3: kidsfit.co.kr)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

const WORKSPACE_DIR = path.resolve(__dirname, '..');
const SRC_JS_DIR = path.join(WORKSPACE_DIR, 'src', 'js');
const DIST_JS_DIR = path.join(WORKSPACE_DIR, 'dist', 'src', 'js');
const SRC_CSS_DIR = path.join(WORKSPACE_DIR, 'src', 'css');
const DIST_CSS_DIR = path.join(WORKSPACE_DIR, 'dist', 'src', 'css');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`     ↳ ${err.message}`);
    failedTests++;
    failures.push({ name, error: err.message });
  }
}

console.log('========================================================================');
console.log('   EMPIRICAL CHALLENGER 2: DIVISION 3 ADVERSARIAL STRESS HARNESS        ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: JavaScript Syntax & Compilation (Task 1)
// -----------------------------------------------------------------------------
console.log('[Suite 1: JavaScript Syntax & Compilation Validation (node -c)]');

const jsFilesToVerify = [
  path.join(SRC_JS_DIR, 'growth-engine.js'),
  path.join(SRC_JS_DIR, 'neuro-cognitive-matrix.js'),
  path.join(SRC_JS_DIR, 'master-briefing.js'),
  path.join(DIST_JS_DIR, 'growth-engine.js'),
  path.join(DIST_JS_DIR, 'neuro-cognitive-matrix.js'),
  path.join(DIST_JS_DIR, 'master-briefing.js'),
  path.join(WORKSPACE_DIR, 'scripts', 'build.js')
];

jsFilesToVerify.forEach(filePath => {
  const relPath = path.relative(WORKSPACE_DIR, filePath);
  test(`node -c validation on ${relPath}`, () => {
    assert(fs.existsSync(filePath), `File not found: ${filePath}`);
    const out = execSync(`node -c "${filePath}"`, { encoding: 'utf8' });
    assert.strictEqual(out.trim(), '', `Unexpected output during syntax check: ${out}`);
  });
});

// -----------------------------------------------------------------------------
// Suite 2: Chart Color Semantics & DOM Properties (Task 2)
// -----------------------------------------------------------------------------
console.log('\n[Suite 2: Chart Color Semantics & DOM Properties]');

test('growth-engine.js (src & dist): unmanaged loss path, connector line, badge border, and text use #E11D48', () => {
  [path.join(SRC_JS_DIR, 'growth-engine.js'), path.join(DIST_JS_DIR, 'growth-engine.js')].forEach(p => {
    const content = fs.readFileSync(p, 'utf8');
    // Path stroke
    assert(content.includes('stroke="#E11D48" stroke-width="2.5" stroke-linecap="round" id="curve-unmanaged"'),
      `Missing #E11D48 unmanaged curve stroke in ${p}`);
    // Connector line stroke
    assert(content.includes('y2="${labelYUnm.toFixed(1)}" stroke="#E11D48" stroke-width="1.2"'),
      `Missing #E11D48 unmanaged connector line in ${p}`);
    // Badge rect stroke
    assert(content.includes('fill="#FFF1F2" stroke="#E11D48" stroke-width="1.2"'),
      `Missing #E11D48 unmanaged badge border in ${p}`);
    // Text fill
    assert(content.includes('font-size="11" fill="#E11D48" font-weight="900" text-anchor="middle">방치 손실'),
      `Missing #E11D48 unmanaged text in ${p}`);
    // Legend span
    assert(content.includes('<span style="color: #E11D48;">● 방치 손실 궤적</span>'),
      `Missing #E11D48 unmanaged legend in ${p}`);
    // Bar chart alert badge
    assert(content.includes('var(--rose-alert, #E11D48)'),
      `Missing #E11D48 fallback in bar chart alert badge in ${p}`);
    // Pretendard tabular numbers on P97, P50, P3
    assert(content.includes('font-family="Pretendard, -apple-system, sans-serif" font-variant-numeric="tabular-nums">P97'),
      `Missing Pretendard tabular numbers on P97 in ${p}`);
  });
});

test('neuro-cognitive-matrix.js (src & dist): radar gradient & clinical blue grid lines', () => {
  [path.join(SRC_JS_DIR, 'neuro-cognitive-matrix.js'), path.join(DIST_JS_DIR, 'neuro-cognitive-matrix.js')].forEach(p => {
    const content = fs.readFileSync(p, 'utf8');
    // Radial gradient
    assert(content.includes('<stop offset="0%" stop-color="rgba(29, 78, 216, 0.22)" />'),
      `Missing rgba(29, 78, 216, 0.22) in #childLqRadarGrad in ${p}`);
    // Outer grid polygon stroke
    assert(content.includes("stroke=\"${isOuter ? 'rgba(29, 78, 216, 0.28)' : 'rgba(148, 163, 184, 0.35)'}\""),
      `Missing clinical blue outer grid stroke in ${p}`);
    // Radar spokes stroke
    assert(content.includes('stroke="rgba(29, 78, 216, 0.22)" stroke-dasharray="3,3"'),
      `Missing rgba(29, 78, 216, 0.22) spokes stroke in ${p}`);
    // Child radar polygon stroke
    assert(content.includes('fill="url(#childLqRadarGrad)" stroke="#1D4ED8" stroke-width="3"'),
      `Missing #1D4ED8 polygon stroke in ${p}`);
  });
});

test('style.css (src & dist): Pretendard Variable font stack, tnum/cv05, and light clinic tokens', () => {
  [path.join(SRC_CSS_DIR, 'style.css'), path.join(DIST_CSS_DIR, 'style.css')].forEach(p => {
    const content = fs.readFileSync(p, 'utf8');
    assert(content.includes('--font-family: "Pretendard Variable"'), `Missing Pretendard Variable font token in ${p}`);
    assert(content.includes('font-feature-settings: "tnum" 1, "cv05" 1;'), `Missing font-feature-settings in ${p}`);
    assert(content.includes('--theme-accent: #1D4ED8;'), `Missing --theme-accent: #1D4ED8 in ${p}`);
    assert(content.includes('--theme-accent-sub: #EFF6FF;'), `Missing --theme-accent-sub: #EFF6FF in ${p}`);
    // Stepper navigation buttons
    assert(content.includes('#btn-prev-step,') && content.includes('#btn-next-step'), `Missing stepper buttons rule in ${p}`);
    assert(content.includes('min-height: 50px;'), `Missing min-height: 50px for stepper buttons in ${p}`);
    assert(content.includes('border-radius: 14px;'), `Missing border-radius: 14px for stepper buttons in ${p}`);
  });
});

test('index.html (src & dist): Pretendard CDN link, header-actions flex-wrap, touch tabs, unlock gate', () => {
  [path.join(WORKSPACE_DIR, 'index.html'), path.join(WORKSPACE_DIR, 'dist', 'index.html')].forEach(p => {
    const content = fs.readFileSync(p, 'utf8');
    assert(content.includes('pretendard@v1.3.9/dist/web/static/pretendard.min.css'), `Missing Pretendard CDN link in ${p}`);
    assert(content.includes('class="header-actions" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;"'),
      `Missing header-actions flex-wrap in ${p}`);
    assert(content.includes('id="kf-shorts-format-tabs"') && content.includes('-webkit-overflow-scrolling: touch;'),
      `Missing touch scrolling on kf-shorts-format-tabs in ${p}`);
    assert(content.includes('id="kidsfit-report-unlock-gate"') && content.includes('border: 1.5px solid #93C5FD;'),
      `Missing standardized 1.5px solid #93C5FD on kidsfit-report-unlock-gate in ${p}`);
  });
});

// -----------------------------------------------------------------------------
// Suite 3: Telegram Notification Bridge Verification (Task 3)
// -----------------------------------------------------------------------------
console.log('\n[Suite 3: Telegram Notification Bridge CLI Verification]');

test('master_hq_telegram_bridge.js execution returns exit code 0', () => {
  const bridgeScript = path.resolve('D:\\드림컴퍼니\\1사업부\\scripts\\master_hq_telegram_bridge.js');
  assert(fs.existsSync(bridgeScript), `Bridge script not found: ${bridgeScript}`);
  const result = execSync(`node "${bridgeScript}" --notify "Empirical Challenger 2 Automated Test Suite"`, {
    encoding: 'utf8'
  });
  // If execSync does not throw, exit code was 0
  assert(result !== undefined, 'execSync returned undefined');
});

// -----------------------------------------------------------------------------
// Suite 4: Adversarial Stress Testing of Computational Engines
// -----------------------------------------------------------------------------
console.log('\n[Suite 4: Adversarial Stress Testing on Growth & Neuro Engines]');

// Setup browser-like globals for loading scripts in Node
const mockWindow = {
  document: {
    documentElement: { lang: 'ko' },
    createElement: () => ({ style: {} })
  },
  KIDSFIT_GROWTH_DATA: null,
  KIDSFIT_KDST_DATA: null
};

// Load data bundle first
const dataBundlePath = path.join(SRC_JS_DIR, '..', 'data', 'data-bundle.js');
if (fs.existsSync(dataBundlePath)) {
  const bundleCode = fs.readFileSync(dataBundlePath, 'utf8');
  const bundleFn = new Function('window', bundleCode);
  bundleFn(mockWindow);
}

// Load growth engine
const growthEngineCode = fs.readFileSync(path.join(SRC_JS_DIR, 'growth-engine.js'), 'utf8');
const growthFn = new Function('window', growthEngineCode);
growthFn(mockWindow);
const GrowthEngine = mockWindow.KidsFitGrowthEngine || mockWindow.KidsFitAuxologyEngine;

// Load neuro cognitive matrix
const neuroCode = fs.readFileSync(path.join(SRC_JS_DIR, 'neuro-cognitive-matrix.js'), 'utf8');
const neuroFn = new Function('window', neuroCode);
neuroFn(mockWindow);
const NeuroEngine = mockWindow.KidsFitNeuroCognitiveMatrix || mockWindow.KidsFitNeuroTracker;

test('Stress-test renderSvgGrowthCurve: standard input produces valid SVG', () => {
  assert(typeof GrowthEngine.renderSvgGrowthCurve === 'function', 'renderSvgGrowthCurve not exported');
  const svg = GrowthEngine.renderSvgGrowthCurve('male', 120, 140, {
    mph: 175,
    habits: {},
    tannerPhase: 2,
    standard: 'KDCA'
  });
  assert(svg.includes('<svg'), 'Output does not contain <svg');
  assert(svg.includes('</svg>'), 'Output does not contain </svg>');
  assert(svg.includes('#E11D48'), 'SVG does not contain alert rose #E11D48');
  assert(!svg.includes('NaN'), 'SVG contains invalid NaN coordinates');
  assert(!svg.includes('undefined'), 'SVG contains undefined strings');
});

test('Adversarial Boundary: Infant (24 months) and Late Adolescent (216 months)', () => {
  [24, 216].forEach(ageM => {
    const svg = GrowthEngine.renderSvgGrowthCurve('female', ageM, ageM === 24 ? 85 : 160, {
      mph: 162,
      habits: { bedtime: '23:30', lateCarb: true },
      tannerPhase: ageM === 24 ? 1 : 4,
      standard: 'KDCA'
    });
    assert(svg.includes('id="curve-unmanaged"'), `curve-unmanaged missing for age ${ageM}`);
    assert(!svg.includes('NaN'), `NaN coordinates found for age ${ageM}`);
  });
});

test('Adversarial Extreme Edge Cases: extreme heights and empty profile options', () => {
  // Ultra-low height (50cm) and ultra-high height (210cm), empty options
  const svgLow = GrowthEngine.renderSvgGrowthCurve('male', 72, 50, {});
  assert(svgLow.includes('<svg'), 'Low height failed to render SVG');
  assert(!svgLow.includes('NaN'), 'Low height rendered NaN coordinates');

  const svgHigh = GrowthEngine.renderSvgGrowthCurve('female', 180, 210, {});
  assert(svgHigh.includes('<svg'), 'High height failed to render SVG');
  assert(!svgHigh.includes('NaN'), 'High height rendered NaN coordinates');
});

test('Adversarial Contract Observation: renderSvgGrowthCurve with null options throws TypeError', () => {
  let threw = false;
  try {
    GrowthEngine.renderSvgGrowthCurve('female', 180, 210, null);
  } catch (err) {
    threw = true;
    assert(err instanceof TypeError, `Expected TypeError, got ${err}`);
  }
  assert(threw, 'Expected renderSvgGrowthCurve to throw when options is null due to missing default null-coalescing');
});

test('Stress-test Neuro-Cognitive Matrix: calculateDetailedCognitiveAudit edge cases and score clamping', () => {
  assert(typeof NeuroEngine.calculateDetailedCognitiveAudit === 'function', 'calculateDetailedCognitiveAudit not found');

  // Case 1: Empty profile
  const auditEmpty = NeuroEngine.calculateDetailedCognitiveAudit({});
  assert(auditEmpty && auditEmpty.scores, 'Failed on empty profile');
  Object.values(auditEmpty.scores).forEach(score => {
    assert(typeof score === 'number' && !isNaN(score), `Score is not a valid number: ${score}`);
    assert(score >= 58 && score <= 96, `Score out of bounded range [58, 96]: ${score}`);
  });

  // Case 2: Production cognitiveAxes selected
  const prodAxes = ['language_reading', 'math_logic', 'executive_focus', 'science_nature', 'sensory_arts'];
  const auditFull = NeuroEngine.calculateDetailedCognitiveAudit({ cognitiveAxes: prodAxes });
  Object.values(auditFull.scores).forEach(score => {
    assert(score >= 80, `Expected elevated scores (>=80) for selected axes, got ${score}`);
  });

  // Case 3: Invalid axis names
  const auditBogus = NeuroEngine.calculateDetailedCognitiveAudit({ cognitiveAxes: ['bogus_1', 'fake_axis', null, undefined, 123] });
  assert(auditBogus && auditBogus.scores, 'Failed on bogus axes');
  Object.values(auditBogus.scores).forEach(score => {
    assert(typeof score === 'number' && !isNaN(score), `Invalid score on bogus input: ${score}`);
  });
});

test('Stress-test renderRadarSvg: extreme score inputs and NaN protection', () => {
  assert(typeof NeuroEngine.renderRadarSvg === 'function', 'renderRadarSvg not found');

  // Case 1: All zeroes
  const svgZero = NeuroEngine.renderRadarSvg({
    literacy_vocab: 0,
    math_spatial: 0,
    working_memory_focus: 0,
    metacognition_retrieval: 0,
    inquiry_creative: 0
  }, false);
  assert(svgZero.includes('id="lq-radar-svg"'), 'Missing id="lq-radar-svg"');
  assert(!svgZero.includes('NaN'), 'Found NaN in all-zero radar');

  // Case 2: All 100s
  const svgMax = NeuroEngine.renderRadarSvg({
    literacy_vocab: 100,
    math_spatial: 100,
    working_memory_focus: 100,
    metacognition_retrieval: 100,
    inquiry_creative: 100
  }, true);
  assert(svgMax.includes('id="lq-radar-svg"'), 'Missing id="lq-radar-svg"');
  assert(!svgMax.includes('NaN'), 'Found NaN in all-100 radar');

  // Case 3: Out of bound scores (negative and > 100)
  const svgExt = NeuroEngine.renderRadarSvg({
    literacy_vocab: -50,
    math_spatial: 250,
    working_memory_focus: null,
    metacognition_retrieval: undefined,
    inquiry_creative: 'invalid'
  }, false);
  assert(svgExt.includes('id="lq-radar-svg"'), 'Missing id="lq-radar-svg"');
  assert(!svgExt.includes('NaN'), 'Found NaN in out-of-bound radar');
});

// -----------------------------------------------------------------------------
// Suite 5: Build Pipeline Idempotency & Asset Sync Verification
// -----------------------------------------------------------------------------
console.log('\n[Suite 5: Build Pipeline Idempotency & Asset Sync]');

test('build.js executes cleanly (exit code 0) and syncs src to dist', () => {
  const buildScript = path.join(WORKSPACE_DIR, 'scripts', 'build.js');
  const buildOut = execSync(`node "${buildScript}"`, {
    cwd: WORKSPACE_DIR,
    encoding: 'utf8'
  });
  assert(buildOut.includes('Build complete'), 'Build script did not report completion');
  assert(fs.existsSync(path.join(WORKSPACE_DIR, 'dist', 'index.html')), 'dist/index.html missing');
  assert(fs.existsSync(path.join(WORKSPACE_DIR, 'dist', 'src', 'js', 'growth-engine.js')), 'dist growth-engine.js missing');
});

// -----------------------------------------------------------------------------
// Suite 6: Schema & JSON-LD Rigorous Validation (Scope Item 1)
// -----------------------------------------------------------------------------
console.log('\n[Suite 6: Schema & JSON-LD Rigorous Validation]');

test('index.html: parse <script type="application/ld+json"> and validate MedicalOrganization, WebSite, and 24-item ItemList', () => {
  const htmlPath = path.join(WORKSPACE_DIR, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(jsonLdMatch, 'Missing <script type="application/ld+json"> in index.html');
  
  let jsonLd;
  try {
    jsonLd = JSON.parse(jsonLdMatch[1].trim());
  } catch (e) {
    assert.fail(`JSON-LD failed JSON.parse: ${e.message}`);
  }
  
  assert.strictEqual(jsonLd['@context'], 'https://schema.org', 'JSON-LD @context must be https://schema.org');
  assert(Array.isArray(jsonLd['@graph']), 'JSON-LD must contain @graph array');
  
  // 1. Assert MedicalOrganization
  const medOrg = jsonLd['@graph'].find(e => {
    if (Array.isArray(e['@type'])) {
      return e['@type'].includes('MedicalOrganization');
    }
    return e['@type'] === 'MedicalOrganization';
  });
  assert(medOrg, 'Missing MedicalOrganization in JSON-LD @graph');
  assert.strictEqual(medOrg['@id'], 'https://kidsfit.co.kr/#organization', 'MedicalOrganization @id mismatch');
  assert.strictEqual(medOrg.url, 'https://kidsfit.co.kr/', 'MedicalOrganization url mismatch');
  
  // 2. Assert WebSite
  const webSite = jsonLd['@graph'].find(e => e['@type'] === 'WebSite');
  assert(webSite, 'Missing WebSite in JSON-LD @graph');
  assert.strictEqual(webSite['@id'], 'https://kidsfit.co.kr/#website', 'WebSite @id mismatch');
  assert.strictEqual(webSite.inLanguage, 'ko-KR', 'WebSite inLanguage must be ko-KR');
  
  // 3. Assert ItemList
  const itemList = jsonLd['@graph'].find(e => e['@type'] === 'ItemList');
  assert(itemList, 'Missing ItemList in JSON-LD @graph');
  assert.strictEqual(itemList['@id'], 'https://kidsfit.co.kr/#curation-catalog', 'ItemList @id mismatch');
  assert.strictEqual(itemList.numberOfItems, 24, `ItemList numberOfItems must be 24, got ${itemList.numberOfItems}`);
  assert(Array.isArray(itemList.itemListElement), 'ItemList itemListElement must be an array');
  assert.strictEqual(itemList.itemListElement.length, 24, `ItemList itemListElement must have 24 items, got ${itemList.itemListElement.length}`);
  
  // Validate sequential positions 1..24 and valid anchors #prod_*
  itemList.itemListElement.forEach((item, idx) => {
    const expectedPos = idx + 1;
    assert.strictEqual(item['@type'], 'ListItem', `Item ${idx} @type must be ListItem`);
    assert.strictEqual(item.position, expectedPos, `Item ${idx} position must be ${expectedPos}, got ${item.position}`);
    assert(typeof item.name === 'string' && item.name.trim().length > 0, `Item ${idx} name must be non-empty string`);
    assert(typeof item.url === 'string', `Item ${idx} url must be a string`);
    const anchorMatch = item.url.match(/^https:\/\/kidsfit\.co\.kr\/#(prod_[a-z0-9_]+)$/);
    assert(anchorMatch, `Item ${idx} url must match https://kidsfit.co.kr/#prod_*, got ${item.url}`);
  });
});

test('dist/index.html: mirrors identical validated JSON-LD structured data', () => {
  const distHtmlPath = path.join(WORKSPACE_DIR, 'dist', 'index.html');
  const distHtml = fs.readFileSync(distHtmlPath, 'utf8');
  const distJsonLdMatch = distHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(distJsonLdMatch, 'Missing JSON-LD in dist/index.html');
  const distJsonLd = JSON.parse(distJsonLdMatch[1].trim());
  const distItemList = distJsonLd['@graph'].find(e => e['@type'] === 'ItemList');
  assert(distItemList && distItemList.numberOfItems === 24, 'dist/index.html ItemList mismatch');
});

// -----------------------------------------------------------------------------
// Suite 7: 24-Item Catalog Deep Schema Integrity (Scope Item 2)
// -----------------------------------------------------------------------------
console.log('\n[Suite 7: 24-Item Catalog Deep Schema Integrity]');

test('curation-catalog.json: products & parentingProducts schema validation across all 24 items', () => {
  const catPath = path.join(WORKSPACE_DIR, 'src', 'data', 'curation-catalog.json');
  assert(fs.existsSync(catPath), `curation-catalog.json missing at ${catPath}`);
  const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  
  assert(Array.isArray(cat.products), 'cat.products must be an array');
  assert.strictEqual(cat.products.length, 24, `cat.products must contain exactly 24 items, got ${cat.products.length}`);
  assert(Array.isArray(cat.parentingProducts), 'cat.parentingProducts must be an array');
  assert.strictEqual(cat.parentingProducts.length, 24, `cat.parentingProducts must contain exactly 24 items, got ${cat.parentingProducts.length}`);
  
  const validateCatalogArray = (arr, listName) => {
    const seenIds = new Set();
    arr.forEach((item, idx) => {
      const tag = `[${listName} #${idx+1} (${item.id})]`;
      assert(item.id && typeof item.id === 'string', `${tag} missing or invalid id`);
      assert(!seenIds.has(item.id), `${tag} duplicate id found: ${item.id}`);
      seenIds.add(item.id);
      
      // Brand validation: non-empty string
      assert(typeof item.brand === 'string' && item.brand.trim().length > 0,
        `${tag} brand must be non-empty string, got: ${JSON.stringify(item.brand)}`);
      
      // Nutrient focus validation: non-empty string
      assert(typeof item.nutrientFocus === 'string' && item.nutrientFocus.trim().length > 0,
        `${tag} nutrientFocus must be non-empty string, got: ${JSON.stringify(item.nutrientFocus)}`);
      
      // Milestone badges validation: list containing at least one valid age milestone string
      assert(Array.isArray(item.milestoneBadges) && item.milestoneBadges.length >= 1,
        `${tag} milestoneBadges must be a non-empty array, got: ${JSON.stringify(item.milestoneBadges)}`);
      item.milestoneBadges.forEach(badge => {
        assert(typeof badge === 'string' && badge.trim().length > 0,
          `${tag} milestoneBadges item must be non-empty string, got: ${badge}`);
      });
      
      // Scorecard validation: safety, absorption, convenience, value, composite in [1.0, 5.0]
      assert(item.scorecard && typeof item.scorecard === 'object', `${tag} missing scorecard object`);
      const scoreKeys = ['safety', 'absorption', 'convenience', 'value', 'composite'];
      scoreKeys.forEach(k => {
        const val = item.scorecard[k];
        assert(typeof val === 'number' && !isNaN(val),
          `${tag} scorecard.${k} must be a valid number, got: ${val}`);
        assert(val >= 1.0 && val <= 5.0,
          `${tag} scorecard.${k} out of range [1.0, 5.0]: ${val}`);
      });
    });
  };
  
  validateCatalogArray(cat.products, 'products');
  validateCatalogArray(cat.parentingProducts, 'parentingProducts');
});

// -----------------------------------------------------------------------------
// Suite 8: Card Grid DOM Verification (Scope Item 3)
// -----------------------------------------------------------------------------
console.log('\n[Suite 8: Card Grid DOM Verification]');

test('index.html: all 24 cards in #kf-shop-grid render scorecard box, 4 bar fills, and milestone age chips', () => {
  const htmlPath = path.join(WORKSPACE_DIR, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  
  const gridStart = html.indexOf('id="kf-shop-grid"');
  assert(gridStart !== -1, 'Missing id="kf-shop-grid" in index.html');
  const gridEnd = html.indexOf('</section>', gridStart);
  const gridHtml = html.slice(gridStart, gridEnd !== -1 ? gridEnd : gridStart + 50000);
  
  const cardRegex = /<a\s+[^>]*class="[^"]*kf-product-card[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  const cards = [];
  while ((match = cardRegex.exec(gridHtml)) !== null) {
    cards.push({
      openTag: match[0].slice(0, match[0].indexOf('>') + 1),
      fullCard: match[0],
      innerHtml: match[1]
    });
  }
  
  assert.strictEqual(cards.length, 24, `Expected exactly 24 cards in #kf-shop-grid, found ${cards.length}`);
  
  cards.forEach((card, idx) => {
    const prodIdMatch = card.openTag.match(/data-product-id="([^"]+)"/);
    const prodId = prodIdMatch ? prodIdMatch[1] : `card_${idx}`;
    const tag = `[Card #${idx+1} (${prodId})]`;
    
    // Assert .kf-scorecard-card-box
    assert(card.innerHtml.includes('class="kf-scorecard-card-box"') || card.innerHtml.includes("class='kf-scorecard-card-box'"),
      `${tag} missing .kf-scorecard-card-box`);
    
    // Assert all 4 bar fills
    assert(card.innerHtml.includes('fill-safety'), `${tag} missing .fill-safety bar`);
    assert(card.innerHtml.includes('fill-absorb'), `${tag} missing .fill-absorb bar`);
    assert(card.innerHtml.includes('fill-ease'), `${tag} missing .fill-ease bar`);
    assert(card.innerHtml.includes('fill-cost'), `${tag} missing .fill-cost bar`);
    
    // Assert bar percentage inline style width
    ['fill-safety', 'fill-absorb', 'fill-ease', 'fill-cost'].forEach(fillClass => {
      const barRegex = new RegExp(`class="[^"]*${fillClass}[^"]*"\\s+style="width:\\s*(\\d+)%;"`);
      const barMatch = card.innerHtml.match(barRegex);
      assert(barMatch, `${tag} missing valid percentage width for .${fillClass}`);
      const widthVal = parseInt(barMatch[1], 10);
      assert(widthVal >= 50 && widthVal <= 100, `${tag} width percentage out of reasonable bounds [50%, 100%]: ${widthVal}%`);
    });
    
    // Assert .kf-milestone-age-chip
    assert(card.innerHtml.includes('kf-milestone-age-chip'), `${tag} missing .kf-milestone-age-chip`);
    
    // Assert rel="noopener noreferrer sponsored" and target="_blank"
    assert(card.openTag.includes('rel="noopener noreferrer sponsored"'), `${tag} missing rel="noopener noreferrer sponsored"`);
    assert(card.openTag.includes('target="_blank"'), `${tag} missing target="_blank"`);
  });
});

// -----------------------------------------------------------------------------
// Suite 9: Adversarial Regulatory & Resilience Checks
// -----------------------------------------------------------------------------
console.log('\n[Suite 9: Adversarial Regulatory & Resilience Checks]');

test('Regulatory KFTC disclosure banners present across index.html, monthly-curation, and 24 calculator pages', () => {
  const indexHtml = fs.readFileSync(path.join(WORKSPACE_DIR, 'index.html'), 'utf8');
  assert(indexHtml.includes('kf-affiliate-disclosure-banner'), 'Missing .kf-affiliate-disclosure-banner in index.html');
  assert(indexHtml.includes('공정거래위원회'), 'Missing KFTC keyword in index.html');
  
  const monthlyPath = path.join(WORKSPACE_DIR, 'qna', 'monthly-curation.html');
  if (fs.existsSync(monthlyPath)) {
    const monthlyHtml = fs.readFileSync(monthlyPath, 'utf8');
    assert(monthlyHtml.includes('kf-affiliate-disclosure-banner') || monthlyHtml.includes('공정거래위원회'),
      'Missing KFTC disclosure banner in monthly-curation.html');
  }
  
  const qnaDir = path.join(WORKSPACE_DIR, 'qna');
  const calcFiles = fs.readdirSync(qnaDir).filter(f => f.startsWith('kr-calc-') && f.endsWith('.html'));
  assert.strictEqual(calcFiles.length, 24, `Expected 24 kr-calc-*.html files, found ${calcFiles.length}`);
  calcFiles.forEach(f => {
    const content = fs.readFileSync(path.join(qnaDir, f), 'utf8');
    assert(content.includes('aff-disclosure') || content.includes('공정거래위원회'),
      `Missing affiliate disclosure in ${f}`);
  });
});

test('window.KIDSFIT_PRODUCT_CATALOG synchronization and dynamic modal scorecard linkage', () => {
  const html = fs.readFileSync(path.join(WORKSPACE_DIR, 'index.html'), 'utf8');
  assert(html.includes('window.KIDSFIT_PRODUCT_CATALOG'), 'Missing window.KIDSFIT_PRODUCT_CATALOG in index.html');
  assert(html.includes('_openKidsFitEditorialModal'), 'Missing _openKidsFitEditorialModal in index.html');
  assert(html.includes('prod.scorecard'), 'Missing dynamic prod.scorecard linkage in editorial modal');
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL TESTS EVALUATED : ${totalTests}`);
console.log(`TOTAL TESTS PASSED    : ${passedTests}`);
console.log(`TOTAL TESTS FAILED    : ${failedTests}`);
console.log('========================================================================');

if (failedTests > 0) {
  console.error('\nFAILURE DETAILS:');
  failures.forEach(f => console.error(`- ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('\n🎉 ALL EMPIRICAL CHALLENGER VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}
