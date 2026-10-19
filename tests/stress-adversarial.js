/**
 * tests/stress-adversarial.js
 * Adversarial Stress Testing Suite for KidsFit Growth Studio
 * Executed by challenger_final_kidsfit_1
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const GrowthEngine = require('../src/js/growth-engine');
const DevelopmentEngine = require('../src/js/development-engine');
const Monetization = require('../src/js/monetization');
const WeekendCurator = require('../src/js/weekend-curator');

const results = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  findings: []
};

function recordTest(suiteName, testName, passed, details = null) {
  results.totalTests++;
  if (passed) {
    results.passed++;
    console.log(`  ✓ [PASS] [${suiteName}] ${testName}`);
  } else {
    results.failed++;
    results.findings.push({ suiteName, testName, details });
    console.error(`  ✗ [FAIL] [${suiteName}] ${testName}`);
    if (details) console.error(`    ↳ Details:`, details);
  }
}

console.log('====================================================');
console.log('   Adversarial Stress Harness - Empirical Challenger');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: Mathematical Boundaries - KDCA LMS Percentiles [0.1%, 99.9%]
// -----------------------------------------------------------------------------
console.log('--- Suite 1: Mathematical Boundaries (KDCA Percentiles) ---');
let percentileViolations = 0;
let percentileTotal = 0;
const extremeAges = [0, 1, 6, 12, 24, 48, 72, 120, 180, 216, 250, 300];
const extremeHeights = [20, 30, 40, 50, 70, 100, 140, 170, 200, 230, 250, 280];

for (const gender of ['boy', 'girl']) {
  for (const age of extremeAges) {
    const lms = GrowthEngine.getLmsForMonth(gender, age);
    for (const h of extremeHeights) {
      percentileTotal++;
      const res = GrowthEngine.calculateKdcaPercentile(h, lms.L, lms.M, lms.S);
      if (res.percentile < 0.1 || res.percentile > 99.9 || Number.isNaN(res.percentile)) {
        percentileViolations++;
      }
    }
  }
}

// Dense sweep (4000+ points)
for (let h = 30; h <= 250; h += 5) {
  for (let age = 0; age <= 300; age += 10) {
    percentileTotal++;
    const lms = GrowthEngine.getLmsForMonth('boy', age);
    const res = GrowthEngine.calculateKdcaPercentile(h, lms.L, lms.M, lms.S);
    if (res.percentile < 0.1 || res.percentile > 99.9 || Number.isNaN(res.percentile)) {
      percentileViolations++;
    }
  }
}

recordTest(
  'Math-Percentile',
  'Percentile strictly bounded within [0.1%, 99.9%] across extreme heights (30~250cm) and ages (0~300mo)',
  percentileViolations === 0,
  percentileViolations > 0 ? `Violations: ${percentileViolations} / ${percentileTotal}` : null
);

// -----------------------------------------------------------------------------
// Suite 2: Mathematical Invariants - Habit Penalty Cap (<= 5.0cm)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 2: Mathematical Invariants (Habit Penalty <= 5.0cm) ---');
const ALL_HABITS = ['late_sleep', 'poor_posture', 'picky_eater', 'milk_trouble', 'obesity_risk'];
let habitPenaltyViolations = 0;
let habitCasesTotal = 0;

for (let mask = 0; mask < (1 << ALL_HABITS.length); mask++) {
  habitCasesTotal++;
  const subset = ALL_HABITS.filter((_, i) => (mask & (1 << i)));
  const pred = GrowthEngine.calculateHeightPrediction(170, subset, 'none');
  if (pred.unmanagedLoss > 5.0 || pred.unmanagedLoss < 0) {
    habitPenaltyViolations++;
  }
}

// Adversarial duplicates
const extremeHabits = [
  ...ALL_HABITS,
  ...ALL_HABITS,
  'non_existent_habit',
  'invalid_123'
];
habitCasesTotal++;
const predDup = GrowthEngine.calculateHeightPrediction(170, extremeHabits, 'none');
if (predDup.unmanagedLoss > 5.0) {
  habitPenaltyViolations++;
}

recordTest(
  'Math-HabitPenalty',
  'Habit loss penalty never exceeds 5.0cm under all 32 power-set subsets and duplicate inputs',
  habitPenaltyViolations === 0,
  habitPenaltyViolations > 0 ? `Violations: ${habitPenaltyViolations} / ${habitCasesTotal}` : null
);

// -----------------------------------------------------------------------------
// Suite 3: Mathematical Invariants - Golden Time Potential Gain (<= +9.5cm)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 3: Mathematical Invariants (Golden Time Gain <= +9.5cm) ---');
let goldenGainViolations = 0;
let goldenCasesTotal = 0;
const violatingGainDetails = [];

const PUBERTY_STAGES = ['none', 'growth_spurt', 'urgent_secondary_signs'];

for (const stage of PUBERTY_STAGES) {
  for (let mask = 0; mask < (1 << ALL_HABITS.length); mask++) {
    goldenCasesTotal++;
    const subset = ALL_HABITS.filter((_, i) => (mask & (1 << i)));
    const pred = GrowthEngine.calculateHeightPrediction(170, subset, stage);
    if (pred.goldenTimeGain > 9.5) {
      goldenGainViolations++;
      violatingGainDetails.push({
        stage,
        habits: subset,
        unmanagedLoss: pred.unmanagedLoss,
        goldenBoost: pred.goldenBoost,
        potentialHeight: pred.potentialHeight,
        unmanagedHeight: pred.unmanagedHeight,
        goldenTimeGain: pred.goldenTimeGain
      });
    }
  }
}

recordTest(
  'Math-GoldenTimeGain',
  'Golden time potential gain is properly clamped to <= +9.5cm across all combinations',
  goldenGainViolations === 0,
  {
    totalScenariosTested: goldenCasesTotal,
    violationsCount: goldenGainViolations,
    maxObservedGain: Math.max(...violatingGainDetails.map((v) => v.goldenTimeGain), 0),
    sampleViolations: violatingGainDetails.slice(0, 3)
  }
);

// -----------------------------------------------------------------------------
// Suite 4: Receipt Sum & Daily Amortized Cost (sum of 5 items, round(total/30))
// -----------------------------------------------------------------------------
console.log('\n--- Suite 4: Receipt Sum & Daily Amortized Cost Invariants ---');
let receiptViolations = 0;
let receiptRunsTotal = 0;
const budgetTiers = ['tier_5_10', 'tier_15_30', 'tier_unlimited', 'invalid_tier', undefined, null];
const sampleHabitsProfiles = [
  [],
  ['milk_trouble'],
  ['late_sleep', 'poor_posture'],
  ['late_sleep', 'poor_posture', 'picky_eater', 'milk_trouble', 'obesity_risk']
];

for (const bt of budgetTiers) {
  for (const h of sampleHabitsProfiles) {
    receiptRunsTotal++;
    const receipt = Monetization.getGroceryReceiptItems({ habits: h }, bt);
    
    // Check 1: exactly 5 items
    if (!receipt.items || receipt.items.length !== 5) {
      receiptViolations++;
    }
    // Check 2: exact sum
    const sum = receipt.items.reduce((acc, it) => acc + it.price, 0);
    if (receipt.total4Weeks !== sum) {
      receiptViolations++;
    }
    // Check 3: daily average = round(total / 30)
    const expectedDaily = Math.round(sum / 30);
    if (receipt.dailyAverage !== expectedDaily) {
      receiptViolations++;
    }
  }
}

recordTest(
  'Monetization-Receipt',
  'Receipt dynamically contains exactly 5 items, matches sum(item.price), and daily average equals round(total / 30)',
  receiptViolations === 0,
  receiptViolations > 0 ? `Violations: ${receiptViolations} / ${receiptRunsTotal}` : null
);

// -----------------------------------------------------------------------------
// Suite 5: SVG Coordinate Bounds - Radar Points Inside [0, 300]x[0, 300]
// -----------------------------------------------------------------------------
console.log('\n--- Suite 5: SVG Coordinate Bounds (Radar Points in [0, 300]x[0, 300]) ---');
let radarViolations = 0;
let radarPointsTested = 0;
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
const CONCERNS = ['fine_motor', 'gross_motor', 'language_reading', 'math_space', 'emotion_art'];

for (let mask = 0; mask < (1 << CONCERNS.length); mask++) {
  const chosen = CONCERNS.filter((_, i) => (mask & (1 << i)));
  for (const age of [-10, 0, 12, 36, 72, 120, 240, 500]) {
    const res = DevelopmentEngine.evaluateKdstBalance(age, chosen);
    const pts = res.polygonPoints.split(' ');
    if (pts.length !== 6) {
      radarViolations++;
    }
    for (const pt of pts) {
      radarPointsTested++;
      const [x, y] = pt.split(',').map(Number);
      if (Number.isNaN(x) || Number.isNaN(y) || x < 0 || x > 300 || y < 0 || y > 300) {
        radarViolations++;
      }
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

recordTest(
  'SVG-Geometry',
  'All 6 radar polygon vertices strictly inside [0, 300]x[0, 300] canvas across all concern combinations',
  radarViolations === 0,
  { minX, maxX, minY, maxY, violations: radarViolations }
);

// -----------------------------------------------------------------------------
// Suite 6: Dist Directory Integrity & Build Recreation Under Stress
// -----------------------------------------------------------------------------
console.log('\n--- Suite 6: Dist Directory Integrity Under Stress ---');
let buildStressPassed = true;
let buildErrorMsg = null;

try {
  // 10 sequential repeated builds
  for (let i = 1; i <= 10; i++) {
    const res = spawnSync('node', ['scripts/build.js'], { cwd: path.resolve(__dirname, '..') });
    if (res.status !== 0) {
      buildStressPassed = false;
      buildErrorMsg = `Sequential build failed at iteration ${i}: ${res.stderr?.toString()}`;
      break;
    }
  }

  // Integrity of dist contents
  if (buildStressPassed) {
    const distPath = path.resolve(__dirname, '..', 'dist');
    const essentialFiles = [
      'CNAME',
      'index.html',
      'src/css/style.css',
      'src/js/app.js',
      'src/js/growth-engine.js',
      'src/js/development-engine.js',
      'src/js/monetization.js',
      'src/js/weekend-curator.js',
      'src/js/admin-osmu.js',
      'src/data/growth-standards.json',
      'src/data/kdst-rubrics.json',
      'src/data/curation-catalog.json'
    ];
    for (const f of essentialFiles) {
      if (!fs.existsSync(path.join(distPath, f))) {
        buildStressPassed = false;
        buildErrorMsg = `Missing file in dist: ${f}`;
        break;
      }
    }
  }
} catch (e) {
  buildStressPassed = false;
  buildErrorMsg = e.message;
}

recordTest(
  'Dist-Integrity',
  'Dist directory is cleanly recreated across 10 sequential repeated builds with zero missing assets',
  buildStressPassed,
  buildErrorMsg
);

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n====================================================');
console.log(`Adversarial Stress Test Results: ${results.passed}/${results.totalTests} Passed | ${results.failed} Failed`);
console.log('====================================================\n');

if (results.failed > 0) {
  console.log('--- FAILURE BREAKDOWN ---');
  results.findings.forEach((f, idx) => {
    console.log(`[Finding ${idx + 1}] ${f.suiteName} :: ${f.testName}`);
    console.log(JSON.stringify(f.details, null, 2));
  });
}

process.exit(results.failed > 0 ? 1 : 0);
