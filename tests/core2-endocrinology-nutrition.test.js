/**
 * tests/core2-endocrinology-nutrition.test.js
 * Comprehensive Unit and Invariant Verification Suite for Master Analysis Core 2:
 * Endocrinology & Bio-Nutrition Engine
 */

'use strict';

const assert = require('assert');
const path = require('path');

const EndocrinologyEngine = require(path.join(__dirname, '../src/js/endocrinology-engine.js'));
const NutritionEngine = require(path.join(__dirname, '../src/js/nutrition-engine.js'));

let total = 0;
let passed = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

function assertApprox(actual, expected, tolerance = 0.05, msg = '') {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `${msg} -> Expected ${actual} to be within ${tolerance} of ${expected} (diff: ${diff.toFixed(4)})`
  );
}

console.log('====================================================');
console.log('   Core 2: Endocrinology & Bio-Nutrition Unit Suite');
console.log('====================================================');

// Suite 1: Endocrinology Invariants & Suppression Math
console.log('\n[Suite 1: Endocrinology Invariants & Suppression Math]');

it('calculates optimal boundary: bedtime 20:30, meal 17:00 -> 0.0% suppression', () => {
  const res = EndocrinologyEngine.simulateSuppression(1230, 1020);
  assert.strictEqual(res.suppressionPercent, 0.0);
  assert.strictEqual(res.delayPenalty, 0.0);
  assert.strictEqual(res.carbPenalty, 0.0);
});

it('calculates bedtime 22:00, meal 19:00 (exact 3.0h gap) -> 0.0% suppression', () => {
  const res = EndocrinologyEngine.simulateSuppression(1320, 1140);
  assert.strictEqual(res.suppressionPercent, 0.0);
  assert.strictEqual(res.delayPenalty, 0.0);
  assert.strictEqual(res.carbPenalty, 0.0);
  assert.strictEqual(res.gapHours, 3.0);
});

it('calculates 8% delay penalty per 30 minutes past 22:00', () => {
  const res30 = EndocrinologyEngine.simulateSuppression(1350, 1140); // 22:30 (30m late)
  assert.strictEqual(res30.delayPenalty, 8.0);

  const res60 = EndocrinologyEngine.simulateSuppression(1380, 1140); // 23:00 (60m late)
  assert.strictEqual(res60.delayPenalty, 16.0);

  const res90 = EndocrinologyEngine.simulateSuppression(1410, 1140); // 23:30 (90m late)
  assert.strictEqual(res90.delayPenalty, 24.0);
});

it('calculates carb penalty brackets: <1h (40%), 1~2h (28%), 2~3h (14%), >=3h (0%)', () => {
  const c40 = EndocrinologyEngine.simulateSuppression(1320, 1290); // 30m gap
  assert.strictEqual(c40.carbPenalty, 40.0);

  const c28 = EndocrinologyEngine.simulateSuppression(1320, 1230); // 1.5h gap
  assert.strictEqual(c28.carbPenalty, 28.0);

  const c14 = EndocrinologyEngine.simulateSuppression(1320, 1200); // 2.0h gap
  assert.strictEqual(c14.carbPenalty, 14.0);

  const c0 = EndocrinologyEngine.simulateSuppression(1320, 1140); // 3.0h gap
  assert.strictEqual(c0.carbPenalty, 0.0);
});

it('strictly caps cumulative suppression at ceiling of 52.0%', () => {
  const extreme1 = EndocrinologyEngine.simulateSuppression(1500, 1470); // 01:00 sleep, 00:30 meal
  assert.strictEqual(extreme1.suppressionPercent, 52.0);

  const extreme2 = EndocrinologyEngine.simulateSuppression(1440, 1380); // 24:00 sleep, 23:00 meal
  assert.strictEqual(extreme2.suppressionPercent, 52.0);
});

it('handles meal at or after bedtime by capping at 52.0% with 0 gap', () => {
  const same = EndocrinologyEngine.simulateSuppression(1320, 1320);
  assert.strictEqual(same.suppressionPercent, 52.0);
  assert.strictEqual(same.gapHours, 0.0);

  const after = EndocrinologyEngine.simulateSuppression(1260, 1320);
  assert.strictEqual(after.suppressionPercent, 52.0);
  assert.strictEqual(after.gapHours, 0.0);
});

// Suite 2: Waveform Timeline Simulation & Dynamic SVG
console.log('\n[Suite 2: Waveform Timeline Simulation & Dynamic SVG]');

it('simulates 24-hr hormone curve timeline with non-empty points and valid bounds', () => {
  const curve = EndocrinologyEngine.simulateHormoneCurve(1320, 1140);
  assert.ok(Array.isArray(curve.timeline));
  assert.ok(curve.timeline.length > 50);
  assert.strictEqual(curve.swsPeakWindow.start, '22:00');
  assert.strictEqual(curve.swsPeakWindow.end, '02:00');
  assert.ok(curve.clinicalAdvice.length > 10);
});

it('renders dynamic SVG containing SWS peak highlight and responsive viewBox "0 0 600 260"', () => {
  const svg = EndocrinologyEngine.renderHormoneSvg(1320, 1140);
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('viewBox="0 0 600 260"'));
  assert.ok(svg.includes('SWS 성장호르몬 골든 피크'));
  assert.ok(svg.includes('22:00'));
});

// Suite 3: Weight-Proportional Nutrition Engine
console.log('\n[Suite 3: Weight-Proportional Nutrition Engine]');

it('computes elemental calcium target by age bracket (650mg for <=3yo, 800mg for 4~8yo, 1100mg for >=9yo)', () => {
  const t3 = NutritionEngine.calculateTargets(14.7, 3);
  const t7 = NutritionEngine.calculateTargets(23.6, 7);
  const t13 = NutritionEngine.calculateTargets(51.0, 13);

  assert.strictEqual(t3.calciumMg, 650);
  assert.strictEqual(t7.calciumMg, 800);
  assert.strictEqual(t13.calciumMg, 1100);
});

it('evaluates bioavailability ratio ~2.05x higher for Citrate/MCHA (45%) vs Carbonate (22%)', () => {
  const targets = NutritionEngine.calculateTargets(35.5, 10);
  assert.strictEqual(targets.calciumCitrateAbsorption, 45);
  assert.strictEqual(targets.calciumCarbonateAbsorption, 22);
  assertApprox(targets.bioavailabilityRatio, 2.05, 0.05);
});

it('computes Vitamin D3 (1000~2000 IU) and K2 (45~75 mcg) based on age milestones', () => {
  const t3 = NutritionEngine.calculateTargets(14.7, 3);
  const t10 = NutritionEngine.calculateTargets(35.5, 10);

  assert.strictEqual(t3.vitDIU, 1000);
  assert.strictEqual(t3.vitK2Mcg, 45);
  assert.strictEqual(t10.vitDIU, 2000);
  assert.strictEqual(t10.vitK2Mcg, 75);
});

it('computes Zinc Picolinate and Magnesium Glycinate (weight * 4.5mg)', () => {
  const targets = NutritionEngine.calculateTargets(35.5, 10);
  assert.strictEqual(targets.zincMg, 12);
  assert.strictEqual(targets.magMg, Math.round(35.5 * 4.5)); // 160mg
});

it('computes bone matrix protein strictly at weight * 1.3g with 5.0kg safety floor', () => {
  const t13 = NutritionEngine.calculateTargets(51.0, 13);
  assert.strictEqual(t13.proteinG, 66.3);

  const tFloor = NutritionEngine.calculateTargets(2.0, 1);
  assert.strictEqual(tFloor.proteinG, 6.5); // 5.0 * 1.3
});

it('renders Tab 2 report HTML containing #core-2-container and bioavailability gauges', () => {
  const html = NutritionEngine.renderTab2Report({
    ageYears: 10,
    currentWeight: 35.5,
    bedtimeMinutes: 1320,
    mealMinutes: 1140
  });

  assert.ok(html.includes('id="core-2-container"'));
  assert.ok(html.includes('구연산 칼슘'));
  assert.ok(html.includes('탄산칼슘'));
  assert.ok(html.includes('45%'));
  assert.ok(html.includes('22%'));
});

console.log('\n====================================================');
console.log(`Summary: ${passed}/${total} Core 2 tests passed.`);
console.log('====================================================\n');
