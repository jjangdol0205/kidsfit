/**
 * Tier 3: Cross-Feature Interactions & Invariants Test Suite
 * Minimum 12 tests (14 implemented)
 * Tests strict BOM budget invariants, monetization deep-linking,
 * dynamic parameter binding, revenue simulator math, and config synchronization.
 */

const { getCalculators, getMonetization, createTestSuite, assertStrictLTE, assertApprox } = require('./test-helper');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const suite = createTestSuite('Tier 3: Cross-Feature Interactions & Invariants (14 Tests)');

// -------------------------------------------------------------
// 1. Strict Invariant Verification: BOM Total <= User Budget
// -------------------------------------------------------------

suite.test('Interaction 3.1: Strict Invariant: BOM Total <= Budget across 11 Budget Bands', async () => {
  const { calculateRoom } = await getCalculators();
  const testBudgets = [50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000];

  for (const b of testBudgets) {
    const res = calculateRoom({ budgetMan: b });
    const sum = res.items.reduce((acc, cur) => acc + cur.cost, 0);
    assertStrictLTE(sum, b * 10000, `BOM sum ${sum} exceeded budget ${b * 10000}`);
    assert.strictEqual(res.totalCost, sum);
  }
});

suite.test('Interaction 3.2: BOM 100% Golden Weight Distribution Sum', async () => {
  const { calculateRoom } = await getCalculators();
  const res = calculateRoom({ budgetMan: 150 });
  const totalRate = res.items.reduce((acc, cur) => acc + cur.rate, 0);
  assertApprox(totalRate, 1.0, 0.0001, 'Item percentage allocation must equal exactly 100%');
});

// -------------------------------------------------------------
// 2. Monetization Deep Link Generation & Parameter Binding
// -------------------------------------------------------------

suite.test('Interaction 3.3: Coupang Partners Deep Link Syntax & SubID Format', async () => {
  const { buildCoupangUrl, getConfig } = await getMonetization();
  const keyword = "에너지 1등급 인버터 에어컨";
  const url = buildCoupangUrl(keyword, "electric", "AF9999999");

  assert(url.includes("https://www.coupang.com/np/search?q="), 'Must point to Coupang search');
  assert(url.includes(encodeURIComponent(keyword)), 'Keyword must be properly URI encoded');
  assert(url.includes("lptag=AF9999999"), 'Must include specified lptag');
  assert(url.includes("subid=mf_electric_AF9999999"), 'Must match standard subid format mf_{calcId}_{afId}');
});

suite.test('Interaction 3.4: Coupang Partners Default Fallback to Config AF ID', async () => {
  const { buildCoupangUrl, getConfig } = await getMonetization();
  const cfg = getConfig();
  const url = buildCoupangUrl("로봇청소기");

  assert(url.includes(`lptag=${cfg.coupangAfId}`), 'Must fall back to config coupangAfId');
  assert(url.includes(`subid=mf_portal_${cfg.coupangAfId}`));
});

suite.test('Interaction 3.5: LinkPrice Deep Link Synthesis Syntax & URI Encoding', async () => {
  const { buildLinkPriceDeepLink } = await getMonetization();
  const merchantId = "himart";
  const destUrl = "https://www.e-himart.co.kr/app/display/special?query=에어컨&page=1";
  const lpId = "A100999888";

  const deepLink = buildLinkPriceDeepLink(merchantId, destUrl, lpId);
  const expectedPrefix = `https://click.linkprice.com/click.php?m=${merchantId}&a=${lpId}&l=9999&u=`;

  assert(deepLink.startsWith(expectedPrefix), `Link must start with standard LinkPrice gateway prefix`);
  assert(deepLink.includes(encodeURIComponent(destUrl)), 'Destination URL must be strictly URI encoded');
  // Check that raw query symbols are not nakedly exposed in u parameter
  assert(!deepLink.includes("&query="), 'Raw query parameters should be escaped in u=');
});

suite.test('Interaction 3.6: High-Ticket CPA Campaign URL & Member ID Injection', async () => {
  const { buildCpaUrl } = await getMonetization();
  const campaignKey = "electric_grade1_rental";
  const benefit = "월 45,000원 절감";
  const memberId = "custom_member_01";

  const cpaUrl = buildCpaUrl(campaignKey, benefit, memberId);
  assert(cpaUrl.includes("https://leaderscpa.com/merchant/electric_grade1_rental"));
  assert(cpaUrl.includes("member=custom_member_01"));
  assert(cpaUrl.includes(`benefit=${encodeURIComponent(benefit)}`));
});

// -------------------------------------------------------------
// 3. Dynamic Calculator Result Binding to CPA Cards
// -------------------------------------------------------------

suite.test('Interaction 3.7: Calc 1 Monthly Saving Dynamically Bound to CPA Card', async () => {
  const { calculateElectric } = await getCalculators();
  const { getCpaCardDetails } = await getMonetization();

  const electricResult = calculateElectric({ wattage: 1800, hours: 10, baseKwh: 250, newPrice: 850000 });
  const cpaCard = getCpaCardDetails("electric", electricResult);

  const campaignKey = cpaCard.campaignKey || cpaCard.cpaKey;
  assert.strictEqual(campaignKey, "electric_grade1_rental");
  const payout = cpaCard.payoutWon || cpaCard.payout;
  assert(payout === 35000 || payout === "35,000원");
  const actionUrl = cpaCard.actionUrl || cpaCard.targetUrl;
  assert(actionUrl.includes(encodeURIComponent(electricResult.monthlySaving.toString())));
  const title = cpaCard.title || cpaCard.headline;
  assert(title.includes(electricResult.monthlySaving.toLocaleString()));
});

suite.test('Interaction 3.8: Calc 6 Telecom Penalty & Gift Dynamically Bound to CPA Card', async () => {
  const { calculateTelecom } = await getCalculators();
  const { getCpaCardDetails } = await getMonetization();

  const telecomResult = calculateTelecom({ penaltyMan: 15, oldFee: 46000, newFee: 38500, cashGiftMan: 47 });
  const cpaCard = getCpaCardDetails("telecom", telecomResult);

  const campaignKey = cpaCard.campaignKey || cpaCard.cpaKey;
  assert.strictEqual(campaignKey, "telecom_internet_switch");
  const payout = cpaCard.payoutWon || cpaCard.payout;
  assert(payout === 55000 || payout === "55,000원");
  const actionUrl = cpaCard.actionUrl || cpaCard.targetUrl;
  assert(actionUrl.includes("telecom_internet_switch"));
});

// -------------------------------------------------------------
// 4. Revenue Simulator Mathematical Integrity
// -------------------------------------------------------------

suite.test('Interaction 3.9: Revenue Simulator Linear Traffic Scaling Math', async () => {
  const { calculateRevenueSimulation } = await getMonetization();

  // Test at 1,000 daily visitors, 45,000 CPA payout
  const sim1000 = calculateRevenueSimulation(1000, 45000);
  assert.strictEqual(sim1000.monthlyVisits, 30000); // 1000 * 30
  assert(sim1000.cpaRevenue > 0);
  assert(sim1000.cpsRevenue > 0);
  assert(sim1000.adfitRevenue > 0);
  // Total must be exact sum of components
  assert.strictEqual(sim1000.totalRevenue, sim1000.cpaRevenue + sim1000.cpsRevenue + sim1000.adfitRevenue);

  // Test at 2,000 daily visitors (exactly double traffic)
  const sim2000 = calculateRevenueSimulation(2000, 45000);
  assert.strictEqual(sim2000.monthlyVisits, 60000);
  assert.strictEqual(sim2000.cpaRevenue, sim1000.cpaRevenue * 2);
  assert.strictEqual(sim2000.cpsRevenue, sim1000.cpsRevenue * 2);
  assert.strictEqual(sim2000.adfitRevenue, sim1000.adfitRevenue * 2);
  assert.strictEqual(sim2000.totalRevenue, sim1000.totalRevenue * 2);
});

suite.test('Interaction 3.10: Revenue Simulator CPA Payout Sensitivity', async () => {
  const { calculateRevenueSimulation } = await getMonetization();

  const lowCpa = calculateRevenueSimulation(1000, 25000);
  const highCpa = calculateRevenueSimulation(1000, 75000);

  assert(highCpa.cpaRevenue > lowCpa.cpaRevenue);
  // CPS and AdFit depend on traffic, not CPA payout
  assert.strictEqual(highCpa.cpsRevenue, lowCpa.cpsRevenue);
  assert.strictEqual(highCpa.adfitRevenue, lowCpa.adfitRevenue);
  assert(highCpa.totalRevenue > lowCpa.totalRevenue);
});

// -------------------------------------------------------------
// 5. Config Persistence, Import/Export & FTC Legal Compliance
// -------------------------------------------------------------

suite.test('Interaction 3.11: Monetization Config JSON Schema & File Existence', async () => {
  const configPath = path.resolve(__dirname, '../monetization.config.json');
  assert(fs.existsSync(configPath), 'monetization.config.json must exist');

  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw);

  assert(typeof parsed.siteUrl === 'string' && parsed.siteUrl.startsWith('http'));
  assert(typeof parsed.coupangAfId === 'string' && parsed.coupangAfId.length > 0);
  assert(typeof parsed.linkPriceId === 'string' && parsed.linkPriceId.length > 0);
  assert(typeof parsed.cpaMemberId === 'string' && parsed.cpaMemberId.length > 0);
  assert(typeof parsed.campaigns === 'object');
  assert(typeof parsed.merchants === 'object');
});

suite.test('Interaction 3.12: Legal FTC Notice Requirement Verification', async () => {
  const { getConfig } = await getMonetization();
  const cfg = getConfig();

  assert(typeof cfg.ftcNotice === 'string', 'FTC notice must be present in config');
  assert(cfg.ftcNotice.includes('쿠팡 파트너스') || cfg.ftcNotice.includes('수수료'),
    'FTC notice must disclose Coupang Partners / affiliate commission');
});

suite.test('Interaction 3.13: Export and Import Config Synchronization', async () => {
  const { getConfig, updateConfig, exportConfigJson, importConfigJson } = await getMonetization();

  const originalId = getConfig().coupangAfId;
  const testId = "AF_TEST_998877";

  updateConfig({ coupangAfId: testId });
  assert.strictEqual(getConfig().coupangAfId, testId);

  const exported = exportConfigJson();
  assert(typeof exported === 'string');
  assert(exported.includes(testId));

  // Reset to original
  updateConfig({ coupangAfId: originalId });
  assert.strictEqual(getConfig().coupangAfId, originalId);

  // Import test JSON
  const importResult = importConfigJson(exported);
  assert.strictEqual(importResult.success, true);
  assert.strictEqual(getConfig().coupangAfId, testId);

  // Restore original
  updateConfig({ coupangAfId: originalId });
});

suite.test('Interaction 3.14: AdFit Slot Tag Markup Generation', async () => {
  const { renderAdfitSlot } = await getMonetization();
  const slotHtml = renderAdfitSlot(null, "top");

  assert(typeof slotHtml === 'string');
  assert(slotHtml.includes("adfit-slot") || slotHtml.includes("AdFit"), 'Must render adfit slot markup');
  assert(slotHtml.includes("DAN-SAMPLE-TOP"), 'Must include default or configured ad unit ID');
});

// Run directly if called as main script
if (require.main === module) {
  suite.run().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}

module.exports = suite;
