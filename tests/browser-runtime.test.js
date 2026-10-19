/**
 * tests/browser-runtime.test.js
 * Browser Runtime Simulation & Offline Bundle Integrity Test Suite
 * 
 * Verifies that in client browser runtimes (where typeof require === 'undefined'
 * and window is the global scope), datasets are fully inlined into window.KIDSFIT_*
 * and all 40 regional courses are accessible without collapsing into C01 fallback.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

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

function createBrowserSandbox() {
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
    // window is defined, require is undefined
    window: {}
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

function runSuite() {
  console.log('====================================================');
  console.log('   KidsFit Growth Studio - Browser Runtime Tests    ');
  console.log('====================================================\n');

  console.log('[Suite 1: Browser Sandbox Data Bundle Loading (src/)]');

  const srcDataBundle = fs.readFileSync(path.join(ROOT_DIR, 'src', 'data', 'data-bundle.js'), 'utf8');
  const srcWeekendCurator = fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'weekend-curator.js'), 'utf8');
  const srcGrowthEngine = fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'growth-engine.js'), 'utf8');
  const srcDevEngine = fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'development-engine.js'), 'utf8');

  const sandbox = createBrowserSandbox();

  it('verifies sandbox has window defined and require undefined', () => {
    assert.strictEqual(typeof sandbox.window, 'object');
    assert.strictEqual(typeof sandbox.require, 'undefined');
  });

  it('loads src/data/data-bundle.js in browser sandbox and sets all 3 global datasets', () => {
    vm.runInContext(srcDataBundle, sandbox);

    assert(sandbox.window.KIDSFIT_GROWTH_DATA, 'window.KIDSFIT_GROWTH_DATA must be defined');
    assert(Array.isArray(sandbox.window.KIDSFIT_GROWTH_DATA.boy), 'boy growth standards must be array');
    assert(Array.isArray(sandbox.window.KIDSFIT_GROWTH_DATA.girl), 'girl growth standards must be array');

    assert(sandbox.window.KIDSFIT_KDST_DATA, 'window.KIDSFIT_KDST_DATA must be defined');
    assert(sandbox.window.KIDSFIT_KDST_DATA.domains, 'K-DST domains must be defined');
    assert.strictEqual(Object.keys(sandbox.window.KIDSFIT_KDST_DATA.domains).length, 6);

    assert(sandbox.window.KIDSFIT_CATALOG_DATA, 'window.KIDSFIT_CATALOG_DATA must be defined');
    assert(Array.isArray(sandbox.window.KIDSFIT_CATALOG_DATA.courses), 'courses must be array');
    assert.strictEqual(sandbox.window.KIDSFIT_CATALOG_DATA.courses.length, 40, 'courses array must contain exactly 40 items');
  });

  it('executes weekend-curator.js in browser sandbox and attaches KidsFitWeekendCurator to window', () => {
    vm.runInContext(srcWeekendCurator, sandbox);
    assert(sandbox.KidsFitWeekendCurator, 'KidsFitWeekendCurator must be attached to sandbox');
    assert.strictEqual(typeof sandbox.KidsFitWeekendCurator.getWeekendOuting, 'function');
  });

  it('guarantees getWeekendOuting returns all 40 unique courses in browser sandbox without collapsing to C01', () => {
    const REGIONS = [
      '서울 강남·서초·송파',
      '서울 강북·마포·용산',
      '경기 남부(분당·수원·용인·동탄)',
      '경기 북부·인천',
      '부산·경남',
      '대구·경북',
      '대전·충청',
      '광주·전라·기타'
    ];

    const THEMES = [
      'art_making',
      'history_tradition',
      'dino_nature',
      'space_science',
      'music_musical'
    ];

    const retrievedIds = new Set();
    let nonC01Count = 0;

    for (const region of REGIONS) {
      for (const theme of THEMES) {
        const course = sandbox.KidsFitWeekendCurator.getWeekendOuting(region, theme);
        assert(course, `Course must not be null for ${region} / ${theme}`);
        assert.strictEqual(course.region, region, `Region mismatch for course ${course.id}`);
        assert.strictEqual(course.themeKey, theme, `Theme mismatch for course ${course.id}`);

        retrievedIds.add(course.id);
        if (course.id !== 'C01') {
          nonC01Count++;
        }
      }
    }

    assert.strictEqual(retrievedIds.size, 40, `Expected 40 unique course IDs, got ${retrievedIds.size}`);
    assert.strictEqual(nonC01Count, 39, `Expected exactly 39 non-C01 courses across 40 combinations, got ${nonC01Count}`);
  });

  it('retrieves specific regional highlight courses accurately in browser sandbox', () => {
    const busanDino = sandbox.KidsFitWeekendCurator.getWeekendOuting('부산·경남', 'dino');
    assert.strictEqual(busanDino.id, 'C23');
    assert(busanDino.destination.includes('고성공룡박물관') || busanDino.destination.includes('부산해양자연사박물관'));

    const daeguHistory = sandbox.KidsFitWeekendCurator.getWeekendOuting('대구·경북', 'history');
    assert.strictEqual(daeguHistory.id, 'C27');
    assert(daeguHistory.destination.includes('국립대구박물관') || daeguHistory.destination.includes('신라'));

    const daejeonHistory = sandbox.KidsFitWeekendCurator.getWeekendOuting('대전·충청', 'history');
    assert.strictEqual(daejeonHistory.id, 'C32');
    assert(daejeonHistory.destination.includes('국립공주박물관') || daejeonHistory.destination.includes('공주'));

    const gyeonggiMusic = sandbox.KidsFitWeekendCurator.getWeekendOuting('경기 남부(분당·수원·용인·동탄)', 'music');
    assert.strictEqual(gyeonggiMusic.id, 'C15');
  });

  console.log('\n[Suite 2: Production Dist Bundle Browser Verification (dist/)]');

  const distSandbox = createBrowserSandbox();
  const distDataBundlePath = path.join(ROOT_DIR, 'dist', 'src', 'data', 'data-bundle.js');
  const distCuratorPath = path.join(ROOT_DIR, 'dist', 'src', 'js', 'weekend-curator.js');

  it('verifies dist/src/data/data-bundle.js exists and populates window in browser sandbox', () => {
    assert(fs.existsSync(distDataBundlePath), 'dist/src/data/data-bundle.js must exist');
    const distBundleCode = fs.readFileSync(distDataBundlePath, 'utf8');
    vm.runInContext(distBundleCode, distSandbox);

    assert(distSandbox.window.KIDSFIT_CATALOG_DATA, 'dist window.KIDSFIT_CATALOG_DATA must be populated');
    assert.strictEqual(distSandbox.window.KIDSFIT_CATALOG_DATA.courses.length, 40);
  });

  it('verifies dist weekend-curator resolves all 40 courses in browser sandbox', () => {
    assert(fs.existsSync(distCuratorPath), 'dist/src/js/weekend-curator.js must exist');
    const distCuratorCode = fs.readFileSync(distCuratorPath, 'utf8');
    vm.runInContext(distCuratorCode, distSandbox);

    const busanDino = distSandbox.KidsFitWeekendCurator.getWeekendOuting('부산·경남', 'dino');
    assert.strictEqual(busanDino.id, 'C23');

    const daeguHistory = distSandbox.KidsFitWeekendCurator.getWeekendOuting('대구·경북', 'history');
    assert.strictEqual(daeguHistory.id, 'C27');
  });

  console.log('\n[Suite 3: Growth and Development Engines in Browser Sandbox]');

  it('runs growth-engine.js in browser sandbox with window.KIDSFIT_GROWTH_DATA', () => {
    vm.runInContext(srcGrowthEngine, sandbox);
    assert(sandbox.KidsFitGrowthEngine, 'KidsFitGrowthEngine must attach to window');

    const lms = sandbox.KidsFitGrowthEngine.getLmsForMonth('boy', 84);
    assert.strictEqual(lms.M, 121.1);

    const percentile = sandbox.KidsFitGrowthEngine.calculateKdcaPercentile(121.1, lms.L, lms.M, lms.S);
    assert(Math.abs(percentile.percentile - 50.0) < 0.5);

    // Verify golden time clamping in browser
    const pred = sandbox.KidsFitGrowthEngine.calculateHeightPrediction(170, ['late_sleep', 'poor_posture', 'picky_eater', 'milk_trouble', 'obesity_risk'], 'none');
    assert.strictEqual(pred.goldenTimeGain, 9.5);
    assert.strictEqual(pred.potentialHeight, 174.5);
  });

  it('runs development-engine.js in browser sandbox with window.KIDSFIT_KDST_DATA', () => {
    vm.runInContext(srcDevEngine, sandbox);
    assert(sandbox.KidsFitDevelopmentEngine, 'KidsFitDevelopmentEngine must attach to window');

    const res = sandbox.KidsFitDevelopmentEngine.evaluatePedagogy(36, ['fine_motor']);
    assert.strictEqual(res.recommended, 'MONTESSORI');

    const toys = sandbox.KidsFitDevelopmentEngine.getCuratedToys(36, ['fine_motor']);
    assert.strictEqual(toys.length, 4);
  });

  console.log('\n====================================================');
  console.log(`Summary: ${passedTests}/${totalTests} Browser Runtime Tests Passed.`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite();
