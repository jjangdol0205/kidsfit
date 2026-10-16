/**
 * Tier 1: Feature Coverage Test Suite
 * Minimum 5 tests per calculator for all 6 calculators (>= 30 tests)
 * Tests nominal functional calculation, return structures, and exact domain math.
 */

const { getCalculators, createTestSuite, assertApprox, assertInRange } = require('./test-helper');
const assert = require('assert');

const suite = createTestSuite('Tier 1: Feature Coverage (30 Tests)');

// -------------------------------------------------------------
// Calculator 1: 전기요금·누진세 & 1등급 인버터 교체 (5 tests)
// -------------------------------------------------------------

suite.test('Calc 1.1: Studio Wall-mount AC (650W, 10h, base 150kWh, 55만원)', async () => {
  const { calculateElectric } = await getCalculators();
  const res = calculateElectric({ wattage: 650, hours: 10, baseKwh: 150, newPrice: 550000, isSummer: false });

  assert.strictEqual(res.calcId, 'electric');
  assert.strictEqual(res.addedKwh, 195);
  assert.strictEqual(res.totalKwh, 345);
  // Base 150kWh bill: tier 1 (<=200), subtotal = 910 + 150*120 + 150*9 + 150*5 = 21,010 -> total = round(21010*1.137) = 23,888
  assert.strictEqual(res.beforeBill, 23888);
  // Total 345kWh bill: tier 2 (201~400), subtotal = 1600 + 24000 + 145*214.6 + 345*14 = 61,547 -> total = round(61547*1.137) = 69,979
  assert.strictEqual(res.afterBill, 69979);
  assert.strictEqual(res.addedBill, 69979 - 23888);
  assert.strictEqual(res.badge, '⚡ 누진세 2단계 진입');
  assert(res.monthlySaving >= 10000, 'Monthly saving must be at least 10,000');
  assert(res.paybackMonths > 0, 'Payback months must be positive');
  assert(Array.isArray(res.metrics) && res.metrics.length === 3, 'Must contain 3 metrics');
});

suite.test('Calc 1.2: 30-pyeong 2in1 Stand AC Summer Surge (2200W, 12h, base 310kWh, 185만원)', async () => {
  const { calculateElectric } = await getCalculators();
  const res = calculateElectric({ wattage: 2200, hours: 12, baseKwh: 310, newPrice: 1850000, isSummer: true });

  assert.strictEqual(res.addedKwh, 792);
  assert.strictEqual(res.totalKwh, 1102);
  // In summer, tier 3 limit is 450 kWh. 1102 > 450 triggers Tier 3 alarm
  assert.strictEqual(res.badge, '🚨 누진세 3단계 폭탄 경보!');
  assert(res.afterBill > res.beforeBill, 'After bill must exceed before bill');
  assert(res.monthlySaving > 50000, 'Substantial saving expected for 2in1 stand AC');
  assert(res.paybackMonths < 30, 'High usage inverter payback should be under 30 months');
});

suite.test('Calc 1.3: Dehumidifier 24h Continuous Operation (320W, 24h, base 220kWh, 38만원)', async () => {
  const { calculateElectric } = await getCalculators();
  const res = calculateElectric({ wattage: 320, hours: 24, baseKwh: 220, newPrice: 380000, isSummer: false });

  assert.strictEqual(res.addedKwh, 230);
  assert.strictEqual(res.totalKwh, 450);
  assert.strictEqual(res.badge, '🚨 누진세 3단계 폭탄 경보!'); // 450 > 400 (non-summer)
  assert(res.paybackMonths > 0 && res.paybackMonths < 24, 'Reasonable payback period');
});

suite.test('Calc 1.4: Electric Clothes Dryer (1400W, 2h, base 280kWh, 95만원)', async () => {
  const { calculateElectric } = await getCalculators();
  const res = calculateElectric({ wattage: 1400, hours: 2, baseKwh: 280, newPrice: 950000, isSummer: false });

  assert.strictEqual(res.addedKwh, 84);
  assert.strictEqual(res.totalKwh, 364);
  assert.strictEqual(res.badge, '⚡ 누진세 2단계 진입'); // 364 <= 400
  assert(res.monthlySaving >= 10000);
});

suite.test('Calc 1.5: Winter Electric Space Heater (2000W, 8h, base 250kWh, 45만원)', async () => {
  const { calculateElectric } = await getCalculators();
  const res = calculateElectric({ wattage: 2000, hours: 8, baseKwh: 250, newPrice: 450000, isSummer: false });

  assert.strictEqual(res.addedKwh, 480);
  assert.strictEqual(res.totalKwh, 730);
  assert.strictEqual(res.badge, '🚨 누진세 3단계 폭탄 경보!');
  assert(res.afterBill > 150000, 'Heater bill should exceed 150,000 KRW');
});

// -------------------------------------------------------------
// Calculator 2: 다이어트·벌크업 TDEE & 장보기 환산 (5 tests)
// -------------------------------------------------------------

suite.test('Calc 2.1: Male Fat Loss (80kg, 178cm, 30yo, activity 1.55, -500kcal, 4w)', async () => {
  const { calculateDiet } = await getCalculators();
  const res = calculateDiet({ gender: 'male', weight: 80, height: 178, age: 30, activityFactor: 1.55, weeks: 4, deficit: -500 });

  assert.strictEqual(res.calcId, 'diet');
  // BMR = 10*80 + 6.25*178 - 5*30 + 5 = 800 + 1112.5 - 150 + 5 = 1767.5 -> 1768
  assertApprox(res.bmr, 1768, 1);
  assertApprox(res.tdee, Math.round(1767.5 * 1.55), 2);
  assert.strictEqual(res.targetKcal, Math.round(res.tdee - 500));
  assert.strictEqual(res.dailyProteinG, 160); // 80 * 2.0
  assert.strictEqual(res.days, 28);
  // chickenPacks = ceil((160 * 0.65 * 28) / 23) = ceil(2912 / 23) = 127
  assert.strictEqual(res.chickenPacks, 127);
  assert.strictEqual(res.brownRiceBowls, 56); // 28 * 2
  assert.strictEqual(res.proteinTubs, 1); // ceil(28*30/900)
});

suite.test('Calc 2.2: Female Lean Diet (55kg, 163cm, 30yo, activity 1.375, -400kcal, 2w)', async () => {
  const { calculateDiet } = await getCalculators();
  const res = calculateDiet({ gender: 'female', weight: 55, height: 163, age: 30, activityFactor: 1.375, weeks: 2, deficit: -400 });

  // BMR = 10*55 + 6.25*163 - 5*30 - 161 = 550 + 1018.75 - 150 - 161 = 1257.75 -> 1258
  assertApprox(res.bmr, 1258, 1);
  assert.strictEqual(res.dailyProteinG, 110);
  assert.strictEqual(res.days, 14);
  // chickenPacks = ceil((110 * 0.65 * 14) / 23) = ceil(1001 / 23) = 44
  assert.strictEqual(res.chickenPacks, 44);
  assert.strictEqual(res.brownRiceBowls, 28);
  assert.strictEqual(res.proteinTubs, 1);
});

suite.test('Calc 2.3: Male Bulk-up Lean Mass (65kg, 175cm, 25yo, activity 1.55, +350kcal, 4w)', async () => {
  const { calculateDiet } = await getCalculators();
  const res = calculateDiet({ gender: 'male', weight: 65, height: 175, age: 25, activityFactor: 1.55, weeks: 4, deficit: 350 });

  // BMR = 10*65 + 6.25*175 - 5*25 + 5 = 650 + 1093.75 - 125 + 5 = 1623.75 -> 1624
  assertApprox(res.bmr, 1624, 1);
  assert.strictEqual(res.dailyProteinG, 130);
  assert.strictEqual(res.days, 28);
  // chickenPacks = ceil((130 * 0.65 * 28) / 23) = ceil(2366 / 23) = 103
  assert.strictEqual(res.chickenPacks, 103);
  assert.strictEqual(res.brownRiceBowls, 56);
  assert(res.targetKcal > res.tdee, 'Target kcal must exceed TDEE for bulk-up');
});

suite.test('Calc 2.4: Sedentary Office Worker (74kg, 172cm, 32yo, activity 1.2, -450kcal, 4w)', async () => {
  const { calculateDiet } = await getCalculators();
  const res = calculateDiet({ gender: 'male', weight: 74, height: 172, age: 32, activityFactor: 1.2, weeks: 4, deficit: -450 });

  assert.strictEqual(res.dailyProteinG, 148);
  // chickenPacks = ceil((148 * 0.65 * 28) / 23) = ceil(2693.6 / 23) = 118
  assert.strictEqual(res.chickenPacks, 118);
  assert.strictEqual(res.brownRiceBowls, 56);
});

suite.test('Calc 2.5: Student 1-Week Budget Plan (70kg, 176cm, 22yo, activity 1.375, -300kcal, 1w)', async () => {
  const { calculateDiet } = await getCalculators();
  const res = calculateDiet({ gender: 'male', weight: 70, height: 176, age: 22, activityFactor: 1.375, weeks: 1, deficit: -300 });

  assert.strictEqual(res.days, 7);
  assert.strictEqual(res.dailyProteinG, 140);
  // chickenPacks = ceil((140 * 0.65 * 7) / 23) = ceil(637 / 23) = 28
  assert.strictEqual(res.chickenPacks, 28);
  assert.strictEqual(res.brownRiceBowls, 14);
  assert.strictEqual(res.proteinTubs, 1);
});

// -------------------------------------------------------------
// Calculator 3: 반려동물 칼로리 & 사료 급여량 (5 tests)
// -------------------------------------------------------------

suite.test('Calc 3.1: Maltese Adult Neutered (5.0kg, factor 1.6, 3650 kcal/kg, 2kg bag)', async () => {
  const { calculatePet } = await getCalculators();
  const res = calculatePet({ petWeight: 5.0, factor: 1.6, kcalPerKg: 3650, bagKg: 2.0 });

  assert.strictEqual(res.calcId, 'pet');
  // RER = 70 * 5^0.75 = 234.067 -> 234
  assertApprox(res.rer, 234, 1);
  // DER = round(234.067 * 1.6) = 375
  assertApprox(res.der, 375, 2);
  // dailyGrams = round(375 / 3650 * 1000) = 103
  assertApprox(res.dailyGrams, 103, 2);
  // daysPerBag = floor(2000 / dailyGrams) = 19
  assertApprox(res.daysPerBag, 19, 1);
  assert(res.cupsPerDay > 1.0 && res.cupsPerDay < 1.5);
});

suite.test('Calc 3.2: Pomeranian Puppy (1.5kg, factor 2.8, 3900 kcal/kg, 1.5kg bag)', async () => {
  const { calculatePet } = await getCalculators();
  const res = calculatePet({ petWeight: 1.5, factor: 2.8, kcalPerKg: 3900, bagKg: 1.5 });

  // RER = 70 * 1.5^0.75 = 94.88 -> 95
  assertApprox(res.rer, 95, 1);
  // DER = round(94.88 * 2.8) = 266
  assertApprox(res.der, 266, 2);
  // dailyGrams = round(266 / 3900 * 1000) = 68
  assertApprox(res.dailyGrams, 68, 2);
  // daysPerBag = floor(1500 / 68) = 22
  assertApprox(res.daysPerBag, 22, 1);
});

suite.test('Calc 3.3: Golden Retriever Large Dog (30.0kg, factor 1.6, 3500 kcal/kg, 12kg bag)', async () => {
  const { calculatePet } = await getCalculators();
  const res = calculatePet({ petWeight: 30.0, factor: 1.6, kcalPerKg: 3500, bagKg: 12.0 });

  // RER = 70 * 30^0.75 = 897.35 -> 897
  assertApprox(res.rer, 897, 2);
  // DER = round(897.35 * 1.6) = 1436
  assertApprox(res.der, 1436, 3);
  // dailyGrams = round(1436 / 3500 * 1000) = 410
  assertApprox(res.dailyGrams, 410, 3);
  // daysPerBag = floor(12000 / 410) = 29
  assertApprox(res.daysPerBag, 29, 1);
});

suite.test('Calc 3.4: Korean Shorthair Adult Cat (4.5kg, factor 1.2, 3800 kcal/kg, 2kg bag)', async () => {
  const { calculatePet } = await getCalculators();
  const res = calculatePet({ petWeight: 4.5, factor: 1.2, kcalPerKg: 3800, bagKg: 2.0 });

  // RER = 70 * 4.5^0.75 = 216.3 -> 216
  assertApprox(res.rer, 216, 2);
  // DER = round(216.3 * 1.2) = 260
  assertApprox(res.der, 260, 2);
  // dailyGrams = round(260 / 3800 * 1000) = 68
  assertApprox(res.dailyGrams, 68, 2);
  assertApprox(res.daysPerBag, 29, 1);
});

suite.test('Calc 3.5: Senior Cat Care (3.8kg, factor 1.1, 3600 kcal/kg, 1.5kg bag)', async () => {
  const { calculatePet } = await getCalculators();
  const res = calculatePet({ petWeight: 3.8, factor: 1.1, kcalPerKg: 3600, bagKg: 1.5 });

  // RER = 70 * 3.8^0.75 = 190.3 -> 190
  assertApprox(res.rer, 190, 2);
  // DER = round(190.3 * 1.1) = 209
  assertApprox(res.der, 209, 2);
  // dailyGrams = round(209 / 3600 * 1000) = 58
  assertApprox(res.dailyGrams, 58, 2);
  assertApprox(res.daysPerBag, 25, 1);
});

// -------------------------------------------------------------
// Calculator 4: 자취/신혼 예산별 가전/가구 BOM 풀세팅 (5 tests)
// -------------------------------------------------------------

suite.test('Calc 4.1: Minimal 50만원 Budget (5평)', async () => {
  const { calculateRoom } = await getCalculators();
  const res = calculateRoom({ budgetMan: 50, roomSize: 5 });

  assert.strictEqual(res.calcId, 'room');
  assert.strictEqual(res.budgetMan, 50);
  assert.strictEqual(res.budgetWon, 500000);
  assert(res.totalCost <= res.budgetWon, 'Total cost must NOT exceed budget');
  assert(res.items.length === 5, 'Must contain 5 items');
  // Check golden ratio: 24%, 22%, 20%, 16%, 18%
  assert.strictEqual(res.top1, 12); // 50 * 0.24 = 12
  assert.strictEqual(res.top2, 11); // 50 * 0.22 = 11
  assert.strictEqual(res.top3, 10); // 50 * 0.20 = 10
});

suite.test('Calc 4.2: Standard One-room 100만원 Budget (6평)', async () => {
  const { calculateRoom } = await getCalculators();
  const res = calculateRoom({ budgetMan: 100, roomSize: 6 });

  assert.strictEqual(res.budgetWon, 1000000);
  assert(res.totalCost <= 1000000);
  assert.strictEqual(res.top1, 24);
  assert.strictEqual(res.top2, 22);
  assert.strictEqual(res.top3, 20);
});

suite.test('Calc 4.3: New Officetel 300만원 Budget (10평)', async () => {
  const { calculateRoom } = await getCalculators();
  const res = calculateRoom({ budgetMan: 300, roomSize: 10 });

  assert.strictEqual(res.budgetWon, 3000000);
  assert(res.totalCost <= 3000000);
  assert.strictEqual(res.top1, 72); // 300 * 0.24
  assert.strictEqual(res.top2, 66); // 300 * 0.22
  assert.strictEqual(res.top3, 60); // 300 * 0.20
});

suite.test('Calc 4.4: Two-room Premium 500만원 Budget (15평)', async () => {
  const { calculateRoom } = await getCalculators();
  const res = calculateRoom({ budgetMan: 500, roomSize: 15 });

  assert.strictEqual(res.budgetWon, 5000000);
  assert(res.totalCost <= 5000000);
  assert.strictEqual(res.top1, 120);
  assert.strictEqual(res.top2, 110);
  assert.strictEqual(res.top3, 100);
});

suite.test('Calc 4.5: Newlywed 1,000만원 Package (24평)', async () => {
  const { calculateRoom } = await getCalculators();
  const res = calculateRoom({ budgetMan: 1000, roomSize: 24 });

  assert.strictEqual(res.budgetWon, 10000000);
  assert(res.totalCost <= 10000000);
  assert.strictEqual(res.top1, 240);
  assert.strictEqual(res.top2, 220);
  assert.strictEqual(res.top3, 200);
  assert(res.savingWon > 0, 'Online saving estimation must be computed');
});

// -------------------------------------------------------------
// Calculator 5: 자동차 구매방식(장기렌트 vs 리스 vs 할부) TCO (5 tests)
// -------------------------------------------------------------

suite.test('Calc 5.1: Avante 3,000만원 Salaried Worker (60mo, taxRate 0%)', async () => {
  const { calculateAuto } = await getCalculators();
  const res = calculateAuto({ carPriceMan: 3000, months: 60, taxRate: 0 });

  assert.strictEqual(res.calcId, 'auto');
  assert.strictEqual(res.price, 30000000);
  // acqTax = round(30000000 * 0.07) = 2,100,000
  assert.strictEqual(res.acqTax, 2100000);
  // insuranceTotal = round(1450000 * 5) = 7,250,000
  assert.strictEqual(res.insuranceTotal, 7250000);
  // installmentInterest = round(30000000 * 0.8 * 0.055 * 2.5) = 3,300,000
  assert.strictEqual(res.installmentInterest, 3300000);
  assert.strictEqual(res.installmentTco, 30000000 + 2100000 + 7250000 + 3300000); // 42,650,000
  assert.strictEqual(res.taxSaving, 0); // 0% tax rate
  assert(res.rentTco < res.installmentTco, 'Rent should win with volume discount and insurance');
  assert.strictEqual(res.winner, '신차 장기렌트');
  assert(res.diffMan > 0);
});

suite.test('Calc 5.2: Grandeur 5,000만원 Business Owner (48mo, taxRate 24%)', async () => {
  const { calculateAuto } = await getCalculators();
  const res = calculateAuto({ carPriceMan: 5000, months: 48, taxRate: 24 });

  assert.strictEqual(res.price, 50000000);
  assert.strictEqual(res.acqTax, 3500000);
  // taxSaving: min(15000000, 50000000 * 0.3) = 15,000,000 * 0.24 * 4 = 14,400,000
  assert.strictEqual(res.taxSaving, 14400000);
  assert.strictEqual(res.winner, '신차 장기렌트');
  assert(res.diffMan >= 400, 'Difference for Grandeur 24% tax should be substantial');
});

suite.test('Calc 5.3: Tucson Hybrid 3,800만원 (48mo, taxRate 15%)', async () => {
  const { calculateAuto } = await getCalculators();
  const res = calculateAuto({ carPriceMan: 3800, months: 48, taxRate: 15 });

  assert.strictEqual(res.price, 38000000);
  assert.strictEqual(res.acqTax, Math.round(38000000 * 0.07));
  assert(res.taxSaving > 0);
  assert.strictEqual(res.winner, '신차 장기렌트');
});

suite.test('Calc 5.4: Genesis G80 7,000만원 High Earner (36mo, taxRate 35%)', async () => {
  const { calculateAuto } = await getCalculators();
  const res = calculateAuto({ carPriceMan: 7000, months: 36, taxRate: 35 });

  assert.strictEqual(res.price, 70000000);
  // taxSaving = 15000000 * 0.35 * 3 = 15,750,000
  assert.strictEqual(res.taxSaving, 15750000);
  assert.strictEqual(res.winner, '신차 장기렌트');
  assert(res.diffMan > 500);
});

suite.test('Calc 5.5: Casper Mini Car 1,800만원 (36mo, taxRate 0%)', async () => {
  const { calculateAuto } = await getCalculators();
  const res = calculateAuto({ carPriceMan: 1800, months: 36, taxRate: 0 });

  assert.strictEqual(res.price, 18000000);
  assert.strictEqual(res.acqTax, Math.round(18000000 * 0.07));
  assert.strictEqual(res.taxSaving, 0);
  assert(typeof res.winner === 'string');
});

// -------------------------------------------------------------
// Calculator 6: 인터넷·TV 위약금 vs 현금 사은품 (5 tests)
// -------------------------------------------------------------

suite.test('Calc 6.1: Standard Switch (Penalty 15만, old 44k, new 38.5k, gift 47만)', async () => {
  const { calculateTelecom } = await getCalculators();
  const res = calculateTelecom({ penaltyMan: 15, oldFee: 44000, newFee: 38500, cashGiftMan: 47 });

  assert.strictEqual(res.calcId, 'telecom');
  // immediateNetWon = (47 - 15) * 10000 = 320,000
  assert.strictEqual(res.immediateNetWon, 320000);
  // monthlyDiff = 44000 - 38500 = 5500
  assert.strictEqual(res.monthlyDiff, 5500);
  // threeYearFeeSave = 5500 * 36 = 198,000
  assert.strictEqual(res.threeYearFeeSave, 198000);
  // totalNetBenefit = 320000 + 198000 = 518,000
  assert.strictEqual(res.totalNetBenefit, 518000);
  assert.strictEqual(res.bepMonths, 0); // 47 >= 15 -> instant break-even
  assert.strictEqual(res.badge, '💰 지금 바로 갈아타기 무조건 이득!');
});

suite.test('Calc 6.2: 1-Year Left High Penalty (Penalty 30만, old 51k, new 41k, gift 47만)', async () => {
  const { calculateTelecom } = await getCalculators();
  const res = calculateTelecom({ penaltyMan: 30, oldFee: 51000, newFee: 41000, cashGiftMan: 47 });

  assert.strictEqual(res.immediateNetWon, 170000);
  assert.strictEqual(res.monthlyDiff, 10000);
  assert.strictEqual(res.threeYearFeeSave, 360000);
  assert.strictEqual(res.totalNetBenefit, 530000);
  assert.strictEqual(res.bepMonths, 0);
  assert.strictEqual(res.badge, '💰 지금 바로 갈아타기 무조건 이득!');
});

suite.test('Calc 6.3: Expired Contract 0 Penalty (Penalty 0만, old 45k, new 36k, gift 47만)', async () => {
  const { calculateTelecom } = await getCalculators();
  const res = calculateTelecom({ penaltyMan: 0, oldFee: 45000, newFee: 36000, cashGiftMan: 47 });

  assert.strictEqual(res.immediateNetWon, 470000);
  assert.strictEqual(res.monthlyDiff, 9000);
  assert.strictEqual(res.threeYearFeeSave, 324000);
  assert.strictEqual(res.totalNetBenefit, 794000);
  assert.strictEqual(res.bepMonths, 0);
});

suite.test('Calc 6.4: Studio Single Internet (Penalty 8만, old 33k, new 22k, gift 25만)', async () => {
  const { calculateTelecom } = await getCalculators();
  const res = calculateTelecom({ penaltyMan: 8, oldFee: 33000, newFee: 22000, cashGiftMan: 25 });

  assert.strictEqual(res.immediateNetWon, 170000);
  assert.strictEqual(res.monthlyDiff, 11000);
  assert.strictEqual(res.threeYearFeeSave, 396000);
  assert.strictEqual(res.totalNetBenefit, 566000);
  assert.strictEqual(res.bepMonths, 0);
});

suite.test('Calc 6.5: Family 4-Person Bundle (Penalty 12만, old 55k, new 39k, gift 47만)', async () => {
  const { calculateTelecom } = await getCalculators();
  const res = calculateTelecom({ penaltyMan: 12, oldFee: 55000, newFee: 39000, cashGiftMan: 47 });

  assert.strictEqual(res.immediateNetWon, 350000);
  assert.strictEqual(res.monthlyDiff, 16000);
  assert.strictEqual(res.threeYearFeeSave, 576000);
  assert.strictEqual(res.totalNetBenefit, 926000);
  assert.strictEqual(res.bepMonths, 0);
});

// Run directly if called as main script
if (require.main === module) {
  suite.run().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}

module.exports = suite;
