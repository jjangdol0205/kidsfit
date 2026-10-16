/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Minimum 5 tests per calculator for all 6 calculators (>= 30 tests)
 * Tests extreme values, edge thresholds, clamping logic, and statutory invariants.
 */

const { getCalculators, createTestSuite, assertApprox, assertInRange, assertStrictLTE } = require('./test-helper');
const assert = require('assert');

const suite = createTestSuite('Tier 2: Boundary & Corner Cases (30 Tests)');

// -------------------------------------------------------------
// Calculator 1 Boundaries: 전기요금·누진세 (5 tests)
// -------------------------------------------------------------

suite.test('Calc 1 B1: Minimum Wattage & 1h Operation (50W, 1h, base 50kWh)', async () => {
  const { calculateElectric } = await getCalculators();
  const res = calculateElectric({ wattage: 50, hours: 1, baseKwh: 50, newPrice: 300000, isSummer: false });

  assert.strictEqual(res.addedKwh, 2); // round(50*1*30/1000) = 2
  assert.strictEqual(res.totalKwh, 52);
  assert(res.beforeBill > 0, 'Before bill must be positive');
  assert(res.afterBill > res.beforeBill, 'After bill must be >= before bill');
  assert.strictEqual(res.monthlySaving, 10000, 'Minimum floor of 10,000 KRW must be applied');
  assert.strictEqual(res.badge, '⚡ 누진세 2단계 진입');
});

suite.test('Calc 1 B2: Exact 200kWh vs 201kWh Tier Transition (Non-Summer)', async () => {
  const { calcKepcoBill } = await getCalculators();
  const bill200 = calcKepcoBill(200, false);
  const bill201 = calcKepcoBill(201, false);

  // 200kWh: subtotal = 910 + 200*120 + 200*9 + 200*5 = 910 + 24000 + 1800 + 1000 = 27710 -> round(27710*1.137) = 31506
  assert.strictEqual(bill200, 31506);
  // 201kWh: subtotal = 1600 + 24000 + 1*214.6 + 201*14 = 25600 + 214.6 + 2814 = 28628.6 -> round(28628.6*1.137) = 32551
  assert.strictEqual(bill201, 32551);
  assert(bill201 > bill200, '201kWh bill must exceed 200kWh due to higher base and unit rate');
});

suite.test('Calc 1 B3: Exact 400kWh vs 401kWh Tier 3 Explosion Boundary', async () => {
  const { calculateElectric } = await getCalculators();
  // addedKwh = round(100 * 1 * 30 / 1000) = 3
  const res400 = calculateElectric({ wattage: 100, hours: 1, baseKwh: 397, newPrice: 500000, isSummer: false });
  const res401 = calculateElectric({ wattage: 100, hours: 1, baseKwh: 398, newPrice: 500000, isSummer: false });

  assert.strictEqual(res400.totalKwh, 400);
  assert.strictEqual(res401.totalKwh, 401);
  assert.strictEqual(res400.badge, '⚡ 누진세 2단계 진입');
  assert.strictEqual(res401.badge, '🚨 누진세 3단계 폭탄 경보!');
  assert(res401.afterBill > res400.afterBill, 'Tier 3 bill must exceed Tier 2');
});

suite.test('Calc 1 B4: Summer Relaxation Boundary (300kWh & 450kWh)', async () => {
  const { calculateElectric } = await getCalculators();
  // In summer: 1st tier <= 300, 2nd tier 301~450, 3rd tier > 450
  // addedKwh = 3
  const res300 = calculateElectric({ wattage: 100, hours: 1, baseKwh: 297, isSummer: true });
  const res450 = calculateElectric({ wattage: 100, hours: 1, baseKwh: 447, isSummer: true });
  const res451 = calculateElectric({ wattage: 100, hours: 1, baseKwh: 448, isSummer: true });

  assert.strictEqual(res300.totalKwh, 300);
  assert.strictEqual(res450.totalKwh, 450);
  assert.strictEqual(res451.totalKwh, 451);
  assert.strictEqual(res300.badge, '⚡ 누진세 2단계 진입');
  assert.strictEqual(res450.badge, '⚡ 누진세 2단계 진입'); // 450 is still within tier 2 in summer
  assert.strictEqual(res451.badge, '🚨 누진세 3단계 폭탄 경보!'); // 451 enters tier 3
});

suite.test('Calc 1 B5: Extreme Wattage (5000W, 24h, base 1000kWh)', async () => {
  const { calculateElectric } = await getCalculators();
  const res = calculateElectric({ wattage: 5000, hours: 24, baseKwh: 1000, newPrice: 3000000, isSummer: false });

  assert.strictEqual(res.addedKwh, 3600); // 5000*24*30/1000 = 3600
  assert.strictEqual(res.totalKwh, 4600);
  assert(!isNaN(res.afterBill), 'Bill calculation must not result in NaN');
  assert(!isNaN(res.paybackMonths), 'Payback months must not be NaN');
  assert.strictEqual(res.badge, '🚨 누진세 3단계 폭탄 경보!');
});

// -------------------------------------------------------------
// Calculator 2 Boundaries: 다이어트·벌크업 TDEE (5 tests)
// -------------------------------------------------------------

suite.test('Calc 2 B1: Minimum Weight (35kg female, 130cm, 60yo) & 1,200kcal Floor', async () => {
  const { calculateDiet } = await getCalculators();
  const res = calculateDiet({ gender: 'female', weight: 35, height: 130, age: 60, activityFactor: 1.2, weeks: 1, deficit: -500 });

  assert.strictEqual(res.targetKcal, 1200, 'Must strictly enforce minimum survival 1,200 kcal floor');
  assert.strictEqual(res.dailyProteinG, 70); // 35 * 2.0
  assert.strictEqual(res.days, 7);
  assert(res.chickenPacks >= 1, 'Chicken packs must be at least 1');
});

suite.test('Calc 2 B2: Extreme Deficit (-2000kcal) Safety Enforcement', async () => {
  const { calculateDiet } = await getCalculators();
  const res = calculateDiet({ gender: 'male', weight: 80, height: 180, age: 30, activityFactor: 1.55, weeks: 4, deficit: -2000 });

  assert(res.targetKcal >= 1200, `Target kcal ${res.targetKcal} must be at least 1,200`);
});

suite.test('Calc 2 B3: Shortest 1-Week Schedule Ceiling Rounding', async () => {
  const { calculateDiet } = await getCalculators();
  const res = calculateDiet({ gender: 'female', weight: 48, height: 160, age: 25, activityFactor: 1.2, weeks: 1, deficit: -300 });

  assert.strictEqual(res.days, 7);
  assert(Number.isInteger(res.chickenPacks), 'Chicken packs must be an integer');
  assert(Number.isInteger(res.brownRiceBowls), 'Brown rice bowls must be an integer');
  assert(Number.isInteger(res.proteinTubs), 'Protein tubs must be an integer');
  assert(res.chickenPacks > 0);
  assert(res.brownRiceBowls === 14);
  assert(res.proteinTubs === 1);
});

suite.test('Calc 2 B4: Heavyweight Athlete (180kg, 210cm, 12 Weeks)', async () => {
  const { calculateDiet } = await getCalculators();
  const res = calculateDiet({ gender: 'male', weight: 180, height: 210, age: 28, activityFactor: 1.9, weeks: 12, deficit: 500 });

  assert.strictEqual(res.dailyProteinG, 360); // 180 * 2.0
  assert.strictEqual(res.days, 84);
  assert(res.chickenPacks > 500, 'Large quantity of chicken packs for 180kg over 12 weeks');
  assert(res.proteinTubs >= 3);
});

suite.test('Calc 2 B5: Zero Deficit Maintenance State', async () => {
  const { calculateDiet } = await getCalculators();
  const res = calculateDiet({ gender: 'male', weight: 70, height: 175, age: 30, activityFactor: 1.55, weeks: 4, deficit: 0 });

  assert.strictEqual(res.targetKcal, res.tdee, 'Target kcal must equal TDEE when deficit is 0');
});

// -------------------------------------------------------------
// Calculator 3 Boundaries: 반려동물 영양학 (5 tests)
// -------------------------------------------------------------

suite.test('Calc 3 B1: Ultra-small 0.5kg Teacup Puppy (factor 3.0, 1kg bag)', async () => {
  const { calculatePet } = await getCalculators();
  const res = calculatePet({ petWeight: 0.5, factor: 3.0, kcalPerKg: 3800, bagKg: 1.0 });

  assert(res.rer > 0, 'RER must be positive');
  assert(res.der > 0, 'DER must be positive');
  assert(res.dailyGrams > 0, 'Daily grams must be positive');
  assert(res.daysPerBag > 0, 'Days per bag must be positive');
  assert(!isNaN(res.cupsPerDay));
});

suite.test('Calc 3 B2: Clamp Input Weight Below 0.5kg', async () => {
  const { calculatePet } = await getCalculators();
  const res = calculatePet({ petWeight: 0.1, factor: 1.6, kcalPerKg: 3650, bagKg: 2.0 });

  // Safe weight should be clamped to 0.5kg minimum
  const res05 = calculatePet({ petWeight: 0.5, factor: 1.6, kcalPerKg: 3650, bagKg: 2.0 });
  assert.strictEqual(res.rer, res05.rer, 'Weight below 0.5kg must be clamped to 0.5kg');
  assert.strictEqual(res.der, res05.der);
});

suite.test('Calc 3 B3: Giant Breed 60kg Great Dane (15kg bag)', async () => {
  const { calculatePet } = await getCalculators();
  const res = calculatePet({ petWeight: 60.0, factor: 1.6, kcalPerKg: 3500, bagKg: 15.0 });

  assert(res.rer > 1000, 'RER for 60kg dog should exceed 1000 kcal');
  assert(res.dailyGrams > 500, 'Daily grams should exceed 500g');
  assert(res.daysPerBag > 15 && res.daysPerBag < 30);
});

suite.test('Calc 3 B4: Lowest Lifecycle Factor (0.8 Inactive/Obese Dog)', async () => {
  const { calculatePet } = await getCalculators();
  const res = calculatePet({ petWeight: 10.0, factor: 0.8, kcalPerKg: 3500, bagKg: 3.0 });

  assert(res.der < res.rer, 'DER must be lower than RER with 0.8 factor');
  assert(res.dailyGrams > 0);
});

suite.test('Calc 3 B5: Highest Lifecycle Factor (3.5 Extreme Growth/Working)', async () => {
  const { calculatePet } = await getCalculators();
  const res = calculatePet({ petWeight: 10.0, factor: 3.5, kcalPerKg: 3500, bagKg: 3.0 });

  assertApprox(res.der, Math.round(res.rer * 3.5), 5);
  assert(res.dailyGrams > 300);
});

// -------------------------------------------------------------
// Calculator 4 Boundaries: 자취/신혼 BOM (5 tests)
// -------------------------------------------------------------

suite.test('Calc 4 B1: Minimum Budget 50만원 Strict Invariant', async () => {
  const { calculateRoom } = await getCalculators();
  const res = calculateRoom({ budgetMan: 50, roomSize: 5 });

  assertStrictLTE(res.totalCost, 500000, 'Total cost must not exceed 500,000 won');
  assert.strictEqual(res.items.reduce((sum, item) => sum + item.cost, 0), res.totalCost);
});

suite.test('Calc 4 B2: Maximum Budget 2,000만원 Strict Invariant', async () => {
  const { calculateRoom } = await getCalculators();
  const res = calculateRoom({ budgetMan: 2000, roomSize: 50 });

  assertStrictLTE(res.totalCost, 20000000, 'Total cost must not exceed 20,000,000 won');
  assert.strictEqual(res.budgetMan, 2000);
});

suite.test('Calc 4 B3: Irregular Budget 73만원 & 149만원 Zero Overrun', async () => {
  const { calculateRoom } = await getCalculators();
  const res73 = calculateRoom({ budgetMan: 73 });
  assertStrictLTE(res73.totalCost, 730000);

  const res149 = calculateRoom({ budgetMan: 149 });
  assertStrictLTE(res149.totalCost, 1490000);
});

suite.test('Calc 4 B4: Extreme Room Sizes 4평 vs 50평', async () => {
  const { calculateRoom } = await getCalculators();
  const res4 = calculateRoom({ budgetMan: 100, roomSize: 4 });
  const res50 = calculateRoom({ budgetMan: 100, roomSize: 50 });

  assert.strictEqual(res4.roomSize, 4);
  assert.strictEqual(res50.roomSize, 50);
  assertStrictLTE(res4.totalCost, 1000000);
  assertStrictLTE(res50.totalCost, 1000000);
});

suite.test('Calc 4 B5: Won vs Man-won Input Format Equivalence', async () => {
  const { calculateRoom } = await getCalculators();
  const resMan = calculateRoom({ budgetMan: 150 });
  const resWon = calculateRoom({ budget: 1500000 });

  assert.strictEqual(resMan.budgetWon, resWon.budgetWon);
  assert.strictEqual(resMan.totalCost, resWon.totalCost);
  assert.strictEqual(resMan.top1, resWon.top1);
});

// -------------------------------------------------------------
// Calculator 5 Boundaries: 자동차 TCO (5 tests)
// -------------------------------------------------------------

suite.test('Calc 5 B1: Salaried Worker 0% Tax Rate (taxSaving = 0)', async () => {
  const { calculateAuto } = await getCalculators();
  const res = calculateAuto({ carPriceMan: 3500, months: 48, taxRate: 0 });

  assert.strictEqual(res.taxSaving, 0, 'taxSaving must be 0 for salaried workers with taxRate 0%');
});

suite.test('Calc 5 B2: Highest Tax Bracket 45%', async () => {
  const { calculateAuto } = await getCalculators();
  const res = calculateAuto({ carPriceMan: 5000, months: 48, taxRate: 45 });

  // Annual deduction cap is 15,000,000. 15,000,000 * 0.45 * 4 = 27,000,000
  assert.strictEqual(res.taxSaving, 27000000);
  assert.strictEqual(res.winner, '신차 장기렌트');
});

suite.test('Calc 5 B3: Statutory 1,500만원 Annual Deduction Cap on 1.5억 Supercar', async () => {
  const { calculateAuto } = await getCalculators();
  const res = calculateAuto({ carPriceMan: 15000, months: 36, taxRate: 35 });

  // 15,000만원 * 0.3 = 4,500만원 > 1,500만원 cap.
  // taxSaving = 15,000,000 * 0.35 * 3 = 15,750,000
  assert.strictEqual(res.taxSaving, 15750000, 'Must cap annual base deduction at 15,000,000 won');
});

suite.test('Calc 5 B4: Shortest 24 Months vs Longest 60 Months', async () => {
  const { calculateAuto } = await getCalculators();
  const res24 = calculateAuto({ carPriceMan: 3000, months: 24, taxRate: 24 });
  const res60 = calculateAuto({ carPriceMan: 3000, months: 60, taxRate: 24 });

  assert(res60.insuranceTotal > res24.insuranceTotal);
  assert(res60.installmentInterest > res24.installmentInterest);
  assert(res60.installmentTco > res24.installmentTco);
});

suite.test('Calc 5 B5: Vehicle Price Lower Boundary (1,500만원)', async () => {
  const { calculateAuto } = await getCalculators();
  const res = calculateAuto({ carPriceMan: 1500, months: 36, taxRate: 0 });

  assert.strictEqual(res.price, 15000000);
  assert.strictEqual(res.acqTax, 1050000);
  assert(res.installmentTco > res.price);
});

// -------------------------------------------------------------
// Calculator 6 Boundaries: 통신 위약금 vs 사은품 (5 tests)
// -------------------------------------------------------------

suite.test('Calc 6 B1: Zero Penalty on Expired Contract (immediateNetWon = cashGift)', async () => {
  const { calculateTelecom } = await getCalculators();
  const res = calculateTelecom({ penaltyMan: 0, oldFee: 40000, newFee: 35000, cashGiftMan: 47 });

  assert.strictEqual(res.immediateNetWon, 470000);
  assert.strictEqual(res.bepMonths, 0);
  assert(res.totalNetBenefit > 470000);
});

suite.test('Calc 6 B2: Penalty Exceeding Gift (60만 > 47만) BEP Computation', async () => {
  const { calculateTelecom } = await getCalculators();
  // penalty: 60만, gift: 47만 -> immediate: -13만 won.
  // oldFee: 50000, newFee: 37000 -> monthlyDiff: 13,000 won.
  // bepMonths = ceil(130000 / 13000) = 10 months.
  const res = calculateTelecom({ penaltyMan: 60, oldFee: 50000, newFee: 37000, cashGiftMan: 47 });

  assert.strictEqual(res.immediateNetWon, -130000);
  assert.strictEqual(res.monthlyDiff, 13000);
  assert.strictEqual(res.bepMonths, 10);
  // 3-year savings: 13000 * 36 = 468,000. Total = -130000 + 468000 = 338,000
  assert.strictEqual(res.totalNetBenefit, 338000);
  assert.strictEqual(res.badge, '💰 지금 바로 갈아타기 무조건 이득!');
});

suite.test('Calc 6 B3: Zero Monthly Fee Difference (oldFee === newFee)', async () => {
  const { calculateTelecom } = await getCalculators();
  const res = calculateTelecom({ penaltyMan: 10, oldFee: 40000, newFee: 40000, cashGiftMan: 47 });

  assert.strictEqual(res.monthlyDiff, 0);
  assert.strictEqual(res.threeYearFeeSave, 0);
  assert.strictEqual(res.totalNetBenefit, (47 - 10) * 10000);
  assert.strictEqual(res.bepMonths, 0);
});

suite.test('Calc 6 B4: High Penalty & Unfavorable Fee -> Recommendation to Wait', async () => {
  const { calculateTelecom } = await getCalculators();
  // penalty: 60만, gift: 10만 -> immediate: -50만 won.
  // oldFee: 20000, newFee: 35000 -> monthlyDiff: -15,000 won (more expensive).
  const res = calculateTelecom({ penaltyMan: 60, oldFee: 20000, newFee: 35000, cashGiftMan: 10 });

  assert.strictEqual(res.immediateNetWon, -500000);
  assert(res.monthlyDiff < 0);
  assert(res.totalNetBenefit < 0);
  assert.strictEqual(res.badge, '⏳ 만기 후 이동 권장');
  assert.strictEqual(res.bepMonths, -1);
});

suite.test('Calc 6 B5: Legal Maximum Cash Gift Ceiling (47만원)', async () => {
  const { calculateTelecom } = await getCalculators();
  const res = calculateTelecom({ penaltyMan: 15, oldFee: 45000, newFee: 38000, cashGiftMan: 47 });

  assert.strictEqual(res.cashGiftMan, 47);
  assert.strictEqual(res.immediateNetWon, 320000);
});

// Run directly if called as main script
if (require.main === module) {
  suite.run().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}

module.exports = suite;
