/**
 * Tier 4: Real-World Workload Scenarios Test Suite
 * Minimum 6 full user-journey scenarios
 * Simulates complete end-to-end user workflows: calculations, loss avoidance,
 * product BOM generation, and CPA/CPS monetization integration.
 */

const { getCalculators, getMonetization, createTestSuite, assertStrictLTE, assertApprox } = require('./test-helper');
const assert = require('assert');

const suite = createTestSuite('Tier 4: Real-World Workload Scenarios (6 Scenarios)');

// -------------------------------------------------------------
// Scenario 1: Studio Move-in End-to-End Persona (사회초년생 원룸 독립)
// -------------------------------------------------------------
suite.test('Workload 4.1: Studio Move-in: 150만원 Budget Full Setup + Moving CPA', async () => {
  const { calculateRoom } = await getCalculators();
  const { getCpaCardDetails, buildCoupangUrl, buildLinkPriceDeepLink } = await getMonetization();

  // 1. User inputs 150만원 budget for a 7-pyeong studio
  const roomPlan = calculateRoom({ budgetMan: 150, roomSize: 7 });

  // 2. Validate strict invariant: no budget overrun
  assertStrictLTE(roomPlan.totalCost, 1500000);
  assert.strictEqual(roomPlan.items.length, 5);

  // 3. Check itemized budgets
  const refItem = roomPlan.items.find(i => i.name.includes("냉장고"));
  const bedItem = roomPlan.items.find(i => i.name.includes("침대"));
  assert(refItem && refItem.cost === 360000); // 150만 * 0.24 = 36만
  assert(bedItem && bedItem.cost === 300000); // 150만 * 0.20 = 30만

  // 4. Generate affiliate links for BOM items
  const coupangRef = buildCoupangUrl(refItem.name, "room");
  const hanssemBed = buildLinkPriceDeepLink("hanssem", "https://mall.hanssem.com/bed", "A100123456");
  assert(coupangRef.includes("lptag="));
  assert(hanssemBed.includes("m=hanssem"));

  // 5. Connect to moving estimate CPA card
  const cpaCard = getCpaCardDetails("room", roomPlan);
  assert.strictEqual(cpaCard.campaignKey, "room_moving_quote");
  assert(cpaCard.title.includes("7평"));
});

// -------------------------------------------------------------
// Scenario 2: Summer Heatwave Bill Surge & Inverter Replacement
// -------------------------------------------------------------
suite.test('Workload 4.2: Summer Heatwave Surge: 2in1 AC 12h + Inverter ROI', async () => {
  const { calculateElectric } = await getCalculators();
  const { getCpaCardDetails } = await getMonetization();

  // 1. Summer heatwave: 2200W AC running 12 hours/day, base 310 kWh in July/August
  const result = calculateElectric({
    wattage: 2200,
    hours: 12,
    baseKwh: 310,
    newPrice: 1850000,
    isSummer: true
  });

  // 2. Total usage surges past summer tier 3 threshold (450 kWh)
  assert.strictEqual(result.totalKwh, 1102);
  assert.strictEqual(result.badge, "🚨 누진세 3단계 폭탄 경보!");
  assert(result.afterBill > 300000, "Bill should exceed 300,000 KRW");

  // 3. Inverter replacement saves significant monthly cost
  assert(result.monthlySaving > 100000, "Inverter saving should exceed 100,000 KRW");
  assert(result.paybackMonths > 0 && result.paybackMonths < 24);

  // 4. CPA rental card offers relief with 35,000 KRW payout
  const cpa = getCpaCardDetails("electric", result);
  assert.strictEqual(cpa.campaignKey, "electric_grade1_rental");
  assert(cpa.title.includes(result.monthlySaving.toLocaleString()));
});

// -------------------------------------------------------------
// Scenario 3: Male Office Worker 4-Week Body Recomp & Grocery List
// -------------------------------------------------------------
suite.test('Workload 4.3: Office Worker Body Recomp: 80kg -500kcal Grocery BOM', async () => {
  const { calculateDiet } = await getCalculators();
  const { getCpaCardDetails, buildCoupangUrl } = await getMonetization();

  // 1. Sedentary 30yo male, 80kg, 178cm, 4-week fat loss program
  const diet = calculateDiet({
    gender: 'male',
    weight: 80,
    height: 178,
    age: 30,
    activityFactor: 1.55,
    weeks: 4,
    deficit: -500
  });

  // 2. Nutrition and grocery quantities
  assert.strictEqual(diet.dailyProteinG, 160);
  assert.strictEqual(diet.chickenPacks, 127);
  assert.strictEqual(diet.brownRiceBowls, 56);
  assert.strictEqual(diet.proteinTubs, 1);

  // 3. Generate Coupang search URL for 127 packs of chicken breast
  const chickenLink = buildCoupangUrl("냉동 닭가슴살 100g 127팩", "diet");
  assert(chickenLink.includes("subid=mf_diet_"));

  // 4. CPA card offers 1:1 consultation
  const cpa = getCpaCardDetails("diet", diet);
  assert.strictEqual(cpa.campaignKey, "diet_custom_consulting");
});

// -------------------------------------------------------------
// Scenario 4: Business Vehicle TCO Decision (5,000만원 그랜저)
// -------------------------------------------------------------
suite.test('Workload 4.4: Business Vehicle TCO: 5,000만원 그랜저 24% Tax Deduction', async () => {
  const { calculateAuto } = await getCalculators();
  const { getCpaCardDetails } = await getMonetization();

  // 1. Business owner with 24% tax rate comparing 48 months
  const auto = calculateAuto({
    carPriceMan: 5000,
    months: 48,
    taxRate: 24
  });

  // 2. Acquisition tax and statutory tax deduction
  assert.strictEqual(auto.acqTax, 3500000); // 7% of 5,000만
  assert.strictEqual(auto.taxSaving, 14400000); // 1500만 * 0.24 * 4
  assert.strictEqual(auto.winner, "신차 장기렌트");
  assert(auto.diffMan > 0);

  // 3. Connect to 60,000 KRW CPA auto quote card
  const cpa = getCpaCardDetails("auto", auto);
  assert.strictEqual(cpa.campaignKey, "auto_longterm_rent");
  assert(cpa.title.includes(String(auto.diffMan)), `CPA title should include diffMan ${auto.diffMan}`);
});

// -------------------------------------------------------------
// Scenario 5: First-Time Puppy Adoption & Pet Care Risk Analysis
// -------------------------------------------------------------
suite.test('Workload 4.5: Puppy Care: 1.5kg Pomeranian Feeding & Pet Insurance', async () => {
  const { calculatePet } = await getCalculators();
  const { getCpaCardDetails, buildCoupangUrl } = await getMonetization();

  // 1. 4-month-old 1.5kg Pomeranian puppy
  const pet = calculatePet({
    petWeight: 1.5,
    factor: 2.8,
    kcalPerKg: 3900,
    bagKg: 1.5
  });

  // 2. Precise portioning
  assertApprox(pet.dailyGrams, 68, 2);
  assertApprox(pet.daysPerBag, 22, 1);

  // 3. Purchase links for small dog puppy food
  const foodLink = buildCoupangUrl("로얄캐닌 미니 퍼피 1.5kg", "pet");
  assert(foodLink.includes("subid=mf_pet_"));

  // 4. Pet insurance CPA card to hedge against 1.8M won patella luxation
  const cpa = getCpaCardDetails("pet", pet);
  assert.strictEqual(cpa.campaignKey, "pet_insurance_compare");
  assert(cpa.title.includes("1.5kg"));
});

// -------------------------------------------------------------
// Scenario 6: Telecom Carrier Switch with Penalty Defense
// -------------------------------------------------------------
suite.test('Workload 4.6: Telecom Switch: 15만 Penalty vs 47만 Cash Gift Surplus', async () => {
  const { calculateTelecom } = await getCalculators();
  const { getCpaCardDetails } = await getMonetization();

  // 1. User has 150,000 won penalty, but gets 470,000 won gift and saves 7,500 won/mo
  const telecom = calculateTelecom({
    penaltyMan: 15,
    oldFee: 46000,
    newFee: 38500,
    cashGiftMan: 47
  });

  // 2. Day-1 profit and 3-year total benefit
  assert.strictEqual(telecom.immediateNetWon, 320000);
  assert.strictEqual(telecom.bepMonths, 0); // instant break-even
  assert.strictEqual(telecom.threeYearFeeSave, 7500 * 36); // 270,000
  assert.strictEqual(telecom.totalNetBenefit, 320000 + 270000); // 590,000
  assert.strictEqual(telecom.badge, "💰 지금 바로 갈아타기 무조건 이득!");

  // 3. Connect to 55,000 KRW telecom switch CPA card
  const cpa = getCpaCardDetails("telecom", telecom);
  assert.strictEqual(cpa.campaignKey, "telecom_internet_switch");
});

// Run directly if called as main script
if (require.main === module) {
  suite.run().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}

module.exports = suite;
