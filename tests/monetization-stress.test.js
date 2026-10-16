/**
 * Challenger 2 (challenger_m12_2) Adversarial Stress Test Suite
 * Stress-testing the 5 Monetization Pipelines, Link Generators,
 * Setup Wizard LocalStorage / JSON Schema, and Revenue Simulator ($V=900$).
 *
 * Zero external dependencies - pure Node.js native execution.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getCalculators, getMonetization, createTestSuite, assertApprox, assertInRange } = require('./test-helper');

const suite = createTestSuite('Challenger 2: Monetization Pipelines Adversarial Stress Tests (36 Tests)');

// ============================================================================
// SECTION 1: Coupang & LinkPrice Link Generators & URL Encoding Stress (10 Tests)
// ============================================================================

suite.test('Stress 1.1: Coupang Keyword URL Encoding with Korean Characters and Spaces', async () => {
  const { buildCoupangUrl } = await getMonetization();
  const keyword = "에너지 소비효율 1등급 인버터 벽걸이 에어컨 6평형";
  const url = buildCoupangUrl(keyword, "electric", "AF1234567");

  assert(/^https:\/\/link\.coupang\.com\/re\/AFFBRAND\?/.test(url), "Must target verified Coupang Partners AFFBRAND redirect gateway");
  const parsed = new URL(url);

  assert.strictEqual(parsed.searchParams.get("channel"), "user");
  assert.strictEqual(parsed.searchParams.get("lptag"), "AF1234567");
  assert.strictEqual(parsed.searchParams.get("subid"), "mf_electric_AF1234567");
  assert.strictEqual(parsed.searchParams.get("pageKey"), "LG전자", "Parsed pageKey param must resolve to verified Coupang brand key");
  assert.strictEqual(parsed.searchParams.get("q"), keyword, "Parsed query param must decode back to exact Korean keyword");
  // Ensure no raw Hangul exists in the raw query string (must be percent-encoded)
  const rawQuery = url.split("?")[1];
  assert(!/[가-힣]/.test(rawQuery), "Raw URL query string must not contain unencoded Hangul characters");
});

suite.test('Stress 1.2: Coupang Keyword with URL-Breaking Special Characters (&, =, ?, #, +, %, /)', async () => {
  const { buildCoupangUrl } = await getMonetization();
  const trickyKeyword = "삼성&LG 2in1 에어컨?model=2026#특가 [50% 할인+무료배송] / 18평+6평";
  const url = buildCoupangUrl(trickyKeyword, "electric", "AF9998888");

  const parsed = new URL(url);
  // Ensure special characters inside the keyword did not create spurious query parameters or fragment
  assert.strictEqual(parsed.searchParams.get("channel"), "user");
  assert.strictEqual(parsed.searchParams.get("lptag"), "AF9998888");
  assert.strictEqual(parsed.searchParams.get("subid"), "mf_electric_AF9998888");
  assert.strictEqual(parsed.searchParams.get("q"), trickyKeyword, "All special characters must decode back losslessly");
  assert.strictEqual(parsed.searchParams.get("model"), null, "'model' must NOT be parsed as a separate query param");
  assert.strictEqual(parsed.hash, "", "Hash fragment inside keyword must NOT become the URL hash");
});

suite.test('Stress 1.3: Coupang Keyword with Newlines, Tabs, Emojis, and Quotes', async () => {
  const { buildCoupangUrl } = await getMonetization();
  const exoticKeyword = "🔥초특가⚡ \"가성비 원룸 가구\" '풀세트' \t\n 100% 최저가";
  const url = buildCoupangUrl(exoticKeyword, "room", "AF5555555");

  const parsed = new URL(url);
  assert.strictEqual(parsed.searchParams.get("q"), exoticKeyword);
  assert.strictEqual(parsed.searchParams.get("subid"), "mf_room_AF5555555");
});

suite.test('Stress 1.4: Coupang Empty, Null, Undefined, and Number Keywords', async () => {
  const { buildCoupangUrl } = await getMonetization();

  const emptyUrl = buildCoupangUrl("");
  assert.strictEqual(new URL(emptyUrl).searchParams.get("q"), "");

  const nullUrl = buildCoupangUrl(null);
  assert.strictEqual(new URL(nullUrl).searchParams.get("q"), "");

  const undefUrl = buildCoupangUrl(undefined);
  assert.strictEqual(new URL(undefUrl).searchParams.get("q"), "");

  const numUrl = buildCoupangUrl(12345);
  assert.strictEqual(new URL(numUrl).searchParams.get("q"), "12345");
});

suite.test('Stress 1.5: Coupang Parameter Signature Permutations (afId vs calcId swap)', async () => {
  const { buildCoupangUrl, getConfig } = await getMonetization();
  const kw = "로봇청소기";

  // 1. Default (no optional args)
  const u1 = buildCoupangUrl(kw);
  const p1 = new URL(u1);
  assert.strictEqual(p1.searchParams.get("lptag"), getConfig().coupangAfId);
  assert.strictEqual(p1.searchParams.get("subid"), `mf_portal_${getConfig().coupangAfId}`);

  // 2. Pass calcId only (e.g. "pet")
  const u2 = buildCoupangUrl(kw, "pet");
  const p2 = new URL(u2);
  assert.strictEqual(p2.searchParams.get("lptag"), getConfig().coupangAfId);
  assert.strictEqual(p2.searchParams.get("subid"), `mf_pet_${getConfig().coupangAfId}`);

  // 3. Pass afId only (starts with "AF")
  const u3 = buildCoupangUrl(kw, "AF7777777");
  const p3 = new URL(u3);
  assert.strictEqual(p3.searchParams.get("lptag"), "AF7777777");
  assert.strictEqual(p3.searchParams.get("subid"), "mf_portal_AF7777777");

  // 4. Pass (calcId, afId)
  const u4 = buildCoupangUrl(kw, "telecom", "AF8888888");
  const p4 = new URL(u4);
  assert.strictEqual(p4.searchParams.get("lptag"), "AF8888888");
  assert.strictEqual(p4.searchParams.get("subid"), "mf_telecom_AF8888888");

  // 5. Pass (afId, calcId) inverted order
  const u5 = buildCoupangUrl(kw, "AF8888888", "telecom");
  const p5 = new URL(u5);
  assert.strictEqual(p5.searchParams.get("lptag"), "AF8888888");
  assert.strictEqual(p5.searchParams.get("subid"), "mf_telecom_AF8888888");
});

suite.test('Stress 1.6: LinkPrice Deep Link Syntax Invariant m, a, l=9999, tu Parameter Order', async () => {
  const { buildLinkPriceDeepLink } = await getMonetization();
  const merchant = "himart";
  const target = "https://www.e-himart.co.kr/app/display/special?query=에어컨";
  const lpId = "A100999888";

  const deepLink = buildLinkPriceDeepLink(merchant, target, lpId);
  // Strict regex for exact URL structure: https://click.linkprice.com/click.php?m={m}&a={a}&l=9999&tu={encoded_url}
  const strictRegex = /^https:\/\/click\.linkprice\.com\/click\.php\?m=([^&]+)&a=([^&]+)&l=9999&tu=(.+)$/;
  const match = deepLink.match(strictRegex);

  assert(match !== null, `Deep link must strictly match LinkPrice syntax: ${deepLink}`);
  assert.strictEqual(match[1], merchant);
  assert.strictEqual(match[2], lpId);
  assert.strictEqual(match[3], encodeURIComponent(target));
});

suite.test('Stress 1.7: LinkPrice Destination URL with Complex Query String, Anchors, and Spaces', async () => {
  const { buildLinkPriceDeepLink } = await getMonetization();
  const destUrl = "https://mall.hanssem.com/search?q=원룸 가구&filter=wood&minPrice=100000&maxPrice=500000#specs";
  const deepLink = buildLinkPriceDeepLink("hanssem", destUrl, "A100123456");

  const parsed = new URL(deepLink);
  // The outer URL (click.php) must strictly have ONLY m, a, l, tu query params
  const paramKeys = Array.from(parsed.searchParams.keys());
  assert.deepStrictEqual(paramKeys.sort(), ["a", "l", "m", "tu"].sort(), "click.php must only contain a, l, m, tu parameters");

  // Inner parameters must not bleed into outer URL
  assert.strictEqual(parsed.searchParams.get("q"), null);
  assert.strictEqual(parsed.searchParams.get("filter"), null);
  assert.strictEqual(parsed.searchParams.get("minPrice"), null);
  assert.strictEqual(parsed.hash, "", "Destination hash must be percent-encoded, not become click.php hash");

  // Decoding tu must restore verbatim destination URL
  assert.strictEqual(parsed.searchParams.get("tu"), destUrl);
});

suite.test('Stress 1.8: LinkPrice All 7 Supported Merchant IDs Deep Link Generation', async () => {
  const { buildLinkPriceDeepLink, getConfig } = await getMonetization();
  const cfg = getConfig();
  const merchantKeys = Object.keys(cfg.merchants);

  assert.strictEqual(merchantKeys.length, 7, "Config must define 7 major merchants");

  for (const mKey of merchantKeys) {
    const merchant = cfg.merchants[mKey];
    const deepLink = buildLinkPriceDeepLink(merchant.merchantId, merchant.defaultUrl);
    const parsed = new URL(deepLink);

    assert.strictEqual(parsed.protocol, "https:");
    assert.strictEqual(parsed.hostname, "click.linkprice.com");
    assert.strictEqual(parsed.pathname, "/click.php");
    assert.strictEqual(parsed.searchParams.get("m"), merchant.merchantId);
    assert.strictEqual(parsed.searchParams.get("a"), cfg.linkPriceId);
    assert.strictEqual(parsed.searchParams.get("l"), "9999");
    assert.strictEqual(parsed.searchParams.get("tu"), merchant.defaultUrl);
  }
});

suite.test('Stress 1.9: LinkPrice Destination with Pre-Encoded Percent Sequences (No double-encoding corruption)', async () => {
  const { buildLinkPriceDeepLink } = await getMonetization();
  // URL containing existing %20 or %EC sequences
  const destUrl = "https://www.gmarket.co.kr/n/search?keyword=%EC%97%90%EC%96%B4%EC%BB%A8%20%ED%8A%B9%EA%B0%80";
  const deepLink = buildLinkPriceDeepLink("gmarket", destUrl);

  const parsed = new URL(deepLink);
  assert.strictEqual(parsed.searchParams.get("tu"), destUrl, "Pre-encoded destination must be recoverable verbatim");
});

suite.test('Stress 1.10: LinkPrice Empty and Missing Destination Handling', async () => {
  const { buildLinkPriceDeepLink } = await getMonetization();

  const emptyLink = buildLinkPriceDeepLink("ssg", "");
  assert.strictEqual(new URL(emptyLink).searchParams.get("tu"), "");

  const nullLink = buildLinkPriceDeepLink("ssg", null);
  assert.strictEqual(new URL(nullLink).searchParams.get("tu"), "");
});

// ============================================================================
// SECTION 2: High-Ticket CPA Recommendation Card Text Interpolation (10 Tests)
// ============================================================================

suite.test('Stress 2.1: CPA Card Text Interpolation across All 6 Calculators with Zero NaN or undefined', async () => {
  const { getCpaCardDetails } = await getMonetization();
  const { calculateElectric, calculateDiet, calculatePet, calculateRoom, calculateAuto, calculateTelecom } = await getCalculators();

  const scenarios = [
    { calcId: "electric", result: calculateElectric({ wattage: 1200, hours: 8, baseKwh: 220, newPrice: 600000 }) },
    { calcId: "diet", result: calculateDiet({ gender: "male", weight: 75, height: 175, age: 30, activityFactor: 1.55, weeks: 4, deficit: -500 }) },
    { calcId: "pet", result: calculatePet({ petWeight: 4.5, factor: 1.6, kcalPerKg: 3600, bagKg: 2.0 }) },
    { calcId: "room", result: calculateRoom({ budgetMan: 150 }) },
    { calcId: "auto", result: calculateAuto({ carPriceMan: 4000, advanceRate: 10, months: 48, interestRate: 5.5, taxBracket: 24 }) },
    { calcId: "telecom", result: calculateTelecom({ penaltyMan: 15, oldFee: 45000, newFee: 35000, cashGiftMan: 47 }) }
  ];

  for (const s of scenarios) {
    const card = getCpaCardDetails(s.calcId, s.result);

    assert(card.title && typeof card.title === "string", `Title must be string for ${s.calcId}`);
    assert(card.desc && typeof card.desc === "string", `Desc must be string for ${s.calcId}`);
    assert(card.cta && typeof card.cta === "string", `CTA must be string for ${s.calcId}`);
    assert(card.benefit && typeof card.benefit === "string", `Benefit must be string for ${s.calcId}`);
    assert(card.actionUrl && typeof card.actionUrl === "string", `ActionUrl must be string for ${s.calcId}`);

    // STRICT CHECK: Neither "NaN" nor "undefined" nor "null" may appear as substring in card text
    for (const field of ["title", "desc", "cta", "benefit", "actionUrl"]) {
      const val = card[field];
      assert(!val.includes("NaN"), `Field ${field} in ${s.calcId} must NOT contain 'NaN': "${val}"`);
      assert(!val.includes("undefined"), `Field ${field} in ${s.calcId} must NOT contain 'undefined': "${val}"`);
      assert(!val.includes("null"), `Field ${field} in ${s.calcId} must NOT contain 'null': "${val}"`);
    }
  }
});

suite.test('Stress 2.2: CPA Card Fuzzing with Empty Object {} - Default Fallback Invariant', async () => {
  const { getCpaCardDetails } = await getMonetization();
  const calcIds = ["electric", "diet", "pet", "room", "auto", "telecom"];

  for (const cid of calcIds) {
    const card = getCpaCardDetails(cid, {});

    for (const field of ["title", "desc", "cta", "benefit", "actionUrl"]) {
      const val = card[field];
      assert(!val.includes("NaN"), `Empty input: ${field} in ${cid} must NOT contain 'NaN': "${val}"`);
      assert(!val.includes("undefined"), `Empty input: ${field} in ${cid} must NOT contain 'undefined': "${val}"`);
    }
  }
});

suite.test('Stress 2.3: CPA Card Fuzzing with Explicit NaN Properties', async () => {
  const { getCpaCardDetails } = await getMonetization();

  const nanInputs = [
    { cid: "electric", data: { monthlySaving: NaN } },
    { cid: "diet", data: { weeks: NaN, chickenPacks: NaN } },
    { cid: "pet", data: { petWeight: NaN, dailyGrams: NaN } },
    { cid: "room", data: { roomSize: NaN, budgetMan: NaN } },
    { cid: "auto", data: { diffMan: NaN } },
    { cid: "telecom", data: { penaltyMan: NaN, cashGiftMan: NaN, totalNetBenefit: NaN } }
  ];

  for (const item of nanInputs) {
    const card = getCpaCardDetails(item.cid, item.data);
    for (const field of ["title", "desc", "cta", "benefit", "actionUrl"]) {
      const val = card[field];
      assert(!val.includes("NaN"), `NaN input: ${field} in ${item.cid} must NOT contain 'NaN': "${val}"`);
      assert(!val.includes("undefined"), `NaN input: ${field} in ${item.cid} must NOT contain 'undefined': "${val}"`);
    }
  }
});

suite.test('Stress 2.4: CPA Card Fuzzing with Explicit null Properties', async () => {
  const { getCpaCardDetails } = await getMonetization();

  const nullInputs = [
    { cid: "electric", data: { monthlySaving: null } },
    { cid: "diet", data: { weeks: null, chickenPacks: null } },
    { cid: "pet", data: { petWeight: null, dailyGrams: null } },
    { cid: "room", data: { roomSize: null, budgetMan: null } },
    { cid: "auto", data: { diffMan: null } },
    { cid: "telecom", data: { penaltyMan: null, cashGiftMan: null, totalNetBenefit: null } }
  ];

  for (const item of nullInputs) {
    const card = getCpaCardDetails(item.cid, item.data);
    for (const field of ["title", "desc", "cta", "benefit", "actionUrl"]) {
      const val = card[field];
      assert(!val.includes("NaN"), `Null input: ${field} in ${item.cid} must NOT contain 'NaN'`);
      assert(!val.includes("undefined"), `Null input: ${field} in ${item.cid} must NOT contain 'undefined'`);
    }
  }
});

suite.test('Stress 2.5: CPA Card Fuzzing with Zero Values (0 must not inject NaN or corrupt grammar)', async () => {
  const { getCpaCardDetails } = await getMonetization();

  // Zero values (e.g. 0 penalty, 0 saving, 0 diff)
  const zeroInputs = [
    { cid: "electric", data: { monthlySaving: 0 } },
    { cid: "diet", data: { weeks: 0, chickenPacks: 0 } },
    { cid: "pet", data: { petWeight: 0, dailyGrams: 0 } },
    { cid: "room", data: { roomSize: 0, budgetMan: 0 } },
    { cid: "auto", data: { diffMan: 0 } },
    { cid: "telecom", data: { penaltyMan: 0, cashGiftMan: 0, totalNetBenefit: 0 } }
  ];

  for (const item of zeroInputs) {
    const card = getCpaCardDetails(item.cid, item.data);
    for (const field of ["title", "desc", "cta", "benefit", "actionUrl"]) {
      const val = card[field];
      assert(!val.includes("NaN"), `Zero input: ${field} in ${item.cid} must NOT contain 'NaN'`);
      assert(!val.includes("undefined"), `Zero input: ${field} in ${item.cid} must NOT contain 'undefined'`);
    }
  }
});

suite.test('Stress 2.6: CPA Card Action URL Member ID and Benefit Encoding', async () => {
  const { getCpaCardDetails } = await getMonetization();
  const customConfig = { cpaMemberId: "affiliate_user_999" };
  const card = getCpaCardDetails("electric", { monthlySaving: 35000 }, customConfig);

  assert(card.actionUrl.includes("https://leaderscpa.com/merchant/electric_grade1_rental"));
  assert(card.actionUrl.includes("member=affiliate_user_999"), "Must inject custom memberId");
  assert(card.actionUrl.includes("benefit=35000"));
});

suite.test('Stress 2.7: CPA Card Fallback on Unknown calcId', async () => {
  const { getCpaCardDetails } = await getMonetization();
  // Pass unknown calculator identifier
  const card = getCpaCardDetails("non_existent_calc", {});

  assert.strictEqual(card.campaignKey, "electric_grade1_rental", "Must fall back to default electric campaign");
  assert(!card.title.includes("NaN") && !card.title.includes("undefined"));
});

suite.test('Stress 2.8: CPA Card Benefit Parameter Percent-Encoding for Korean Suffixes', async () => {
  const { getCpaCardDetails } = await getMonetization();

  // Diet benefit has "팩", Pet has "g", Room has "만원", Auto has "만원"
  const dietCard = getCpaCardDetails("diet", { chickenPacks: 45 });
  assert.strictEqual(dietCard.benefit, "45팩");
  assert(dietCard.actionUrl.includes(encodeURIComponent("45팩")), "Korean character in benefit must be percent-encoded");

  const roomCard = getCpaCardDetails("room", { budgetMan: 200 });
  assert.strictEqual(roomCard.benefit, "200만원");
  assert(roomCard.actionUrl.includes(encodeURIComponent("200만원")));
});

suite.test('Stress 2.9: Telecom CPA Card Multi-Value Substitution Robustness', async () => {
  const { getCpaCardDetails } = await getMonetization();
  // Telecom uses penaltyMan, cashGiftMan, totalNetBenefit
  const card = getCpaCardDetails("telecom", {
    penaltyMan: 12,
    cashGiftMan: 47,
    totalNetBenefit: 710000
  });

  assert(card.title.includes("위약금 12만 원"));
  assert(card.title.includes("현금 사은품 47만 원"));
  assert.strictEqual(card.benefit, "710000");
  assert(!card.title.includes("NaN"));
});

suite.test('Stress 2.10: Auto CPA Card Diff Man Absolute Savings Display', async () => {
  const { getCpaCardDetails } = await getMonetization();
  const card = getCpaCardDetails("auto", { diffMan: 385 });

  assert(card.title.includes("할부보다 385만 원 아끼는"));
  assert(card.cta.includes("385만 원 저렴한"));
  assert.strictEqual(card.benefit, "385만원");
});

// ============================================================================
// SECTION 3: Setup Wizard, LocalStorage Fallback & JSON Schema Validation (8 Tests)
// ============================================================================

suite.test('Stress 3.1: Strict JSON Schema Validation of monetization.config.json', async () => {
  const configPath = path.resolve(__dirname, '../monetization.config.json');
  assert(fs.existsSync(configPath), "monetization.config.json must exist");

  const raw = fs.readFileSync(configPath, 'utf8');
  const cfg = JSON.parse(raw);

  // Validate root required keys
  const requiredRootKeys = [
    "siteUrl", "coupangAfId", "linkPriceId", "cpaMemberId",
    "adfitUnitId", "adfitBottomUnitId", "clickCount", "ftcNotice",
    "campaigns", "merchants"
  ];
  for (const k of requiredRootKeys) {
    assert(k in cfg, `Missing required key '${k}' in monetization.config.json`);
  }

  // Value format constraints
  assert(/^https?:\/\//.test(cfg.siteUrl), "siteUrl must be a valid HTTP/HTTPS URL");
  assert(/^AF\d+$/.test(cfg.coupangAfId), `coupangAfId '${cfg.coupangAfId}' must follow AF\\d+ format`);
  assert(/^[A-Z0-9]+$/.test(cfg.linkPriceId), "linkPriceId must be alphanumeric");
  assert(typeof cfg.cpaMemberId === "string" && cfg.cpaMemberId.length > 0);
  assert(Number.isInteger(cfg.clickCount) && cfg.clickCount >= 0);

  // FTC notice verification
  assert(cfg.ftcNotice.includes("쿠팡 파트너스"), "FTC notice must mention Coupang Partners");
  assert(cfg.ftcNotice.includes("수수료"), "FTC notice must disclose commission");

  // Validate 6 required high-ticket campaigns
  const requiredCampaignKeys = [
    "electric_grade1_rental", "diet_custom_consulting", "pet_insurance_compare",
    "room_moving_quote", "auto_longterm_rent", "telecom_internet_switch"
  ];
  for (const cKey of requiredCampaignKeys) {
    assert(cKey in cfg.campaigns, `Campaign '${cKey}' missing from monetization.config.json`);
    const c = cfg.campaigns[cKey];
    assert.strictEqual(c.cpaKey, cKey);
    assert(typeof c.name === "string" && c.name.length > 0);
    assert(Number.isInteger(c.payout) && c.payout >= 30000, `Payout for ${cKey} must be >= 30,000 KRW`);
    assert(typeof c.payoutLabel === "string" && c.payoutLabel.includes("원"));
    assert(/^https?:\/\//.test(c.targetUrl), `targetUrl for ${cKey} must be a valid URL`);
  }

  // Validate 7 required merchants
  const requiredMerchants = ["himart", "gmarket", "11st", "hanssem", "ssg", "ktshop", "ohou"];
  for (const mKey of requiredMerchants) {
    assert(mKey in cfg.merchants, `Merchant '${mKey}' missing from monetization.config.json`);
    const m = cfg.merchants[mKey];
    assert.strictEqual(m.merchantId, mKey);
    assert(typeof m.name === "string" && m.name.length > 0);
    assert(/^https?:\/\//.test(m.defaultUrl), `defaultUrl for ${mKey} must be a valid URL`);
    assert(typeof m.commission === "string" && m.commission.length > 0);
  }
});

suite.test('Stress 3.2: Config Import/Export Full Round-Trip Integrity', async () => {
  const { getConfig, updateConfig, exportConfigJson, importConfigJson } = await getMonetization();
  const original = { ...getConfig() };

  try {
    const customConfig = {
      coupangAfId: "AF9876543",
      linkPriceId: "A999888777",
      cpaMemberId: "challenger_specialist",
      adfitUnitId: "DAN-TEST-1234",
      siteUrl: "https://challenger.moneyfit.kr"
    };

    updateConfig(customConfig);
    const exportedJson = exportConfigJson();
    assert(typeof exportedJson === "string");

    // Clear config
    updateConfig({ coupangAfId: "AF0000000", linkPriceId: "A000000000" });
    assert.strictEqual(getConfig().coupangAfId, "AF0000000");

    // Import back
    const res = importConfigJson(exportedJson);
    assert.strictEqual(res.success, true);
    assert.strictEqual(getConfig().coupangAfId, "AF9876543");
    assert.strictEqual(getConfig().linkPriceId, "A999888777");
    assert.strictEqual(getConfig().cpaMemberId, "challenger_specialist");
    assert.strictEqual(getConfig().siteUrl, "https://challenger.moneyfit.kr");
  } finally {
    // Restore original config
    updateConfig(original);
  }
});

suite.test('Stress 3.3: Config Import Rejection of Malformed / Non-JSON Strings', async () => {
  const { importConfigJson } = await getMonetization();

  const badInputs = [
    "not-json-at-all",
    "{ unquotedKey: 123 }",
    "{ \"incomplete\": ",
    ""
  ];

  for (const bad of badInputs) {
    const res = importConfigJson(bad);
    assert.strictEqual(res.success, false, `Import must fail gracefully on: "${bad}"`);
    assert(typeof res.error === "string");
  }
});

suite.test('Stress 3.4: Config Import Rejection of Non-Object JSON (null, primitive, array)', async () => {
  const { importConfigJson } = await getMonetization();

  const nonObjects = [
    "null",
    "12345",
    "\"a plain string\"",
    "true"
  ];

  for (const no of nonObjects) {
    const res = importConfigJson(no);
    assert.strictEqual(res.success, false, `Import must reject non-object JSON: ${no}`);
  }
});

suite.test('Stress 3.5: LocalStorage Fallback in Headless Node.js Environment (typeof window === undefined)', async () => {
  const { loadConfigFromStorage, saveConfigToStorage, getConfig } = await getMonetization();

  // In Node.js, window is undefined. Both functions must execute without throwing.
  assert.strictEqual(typeof window, "undefined");

  const loaded = loadConfigFromStorage();
  assert(loaded && typeof loaded === "object");

  const saved = saveConfigToStorage({ clickCount: 42 });
  assert.strictEqual(saved.clickCount, 42);
  assert.strictEqual(getConfig().clickCount, 42);
});

suite.test('Stress 3.6: Simulated Browser Environment with Corrupt LocalStorage Data', async () => {
  const { loadConfigFromStorage, getConfig } = await getMonetization();

  // Simulate window.localStorage containing corrupted JSON
  global.window = {
    localStorage: {
      getItem: (key) => "CORRUPT_{{{JSON_DATA"
    }
  };

  try {
    // Must gracefully catch JSON.parse exception and return currentConfig without crashing
    const res = loadConfigFromStorage();
    assert(res && typeof res === "object");
  } finally {
    delete global.window;
  }
});

suite.test('Stress 3.7: Simulated Browser Environment with SecurityError (Private Browsing / Access Denied)', async () => {
  const { loadConfigFromStorage, saveConfigToStorage } = await getMonetization();

  // Simulate Safari / Firefox Private Mode throwing SecurityError upon storage access
  global.window = {
    localStorage: {
      getItem: () => { throw new Error("SecurityError: The operation is insecure."); },
      setItem: () => { throw new Error("SecurityError: The operation is insecure."); }
    }
  };

  try {
    const loaded = loadConfigFromStorage();
    assert(loaded && typeof loaded === "object", "loadConfigFromStorage must not throw on SecurityError");

    const saved = saveConfigToStorage({ clickCount: 99 });
    assert(saved && typeof saved === "object", "saveConfigToStorage must not throw on SecurityError");
  } finally {
    delete global.window;
  }
});

suite.test('Stress 3.8: Simulated Browser Environment with QuotaExceededError on Save', async () => {
  const { saveConfigToStorage } = await getMonetization();

  global.window = {
    localStorage: {
      setItem: () => {
        const err = new Error("QuotaExceededError: storage is full");
        err.name = "QuotaExceededError";
        throw err;
      }
    }
  };

  try {
    const res = saveConfigToStorage({ clickCount: 100 });
    assert(res && typeof res === "object", "Must catch QuotaExceededError without crashing");
  } finally {
    delete global.window;
  }
});

// ============================================================================
// SECTION 4: Monthly 1,000,000 KRW Revenue Simulator ($V=900$ Model) (8 Tests)
// ============================================================================

suite.test('Stress 4.1: Canonical V=900 Traffic Model Exact Component Verification', async () => {
  const { calculateRevenueSimulation } = await getMonetization();
  const sim = calculateRevenueSimulation(900, 45000);

  // Exact statutory math:
  // monthlyVisits = 900 * 30 = 27,000
  assert.strictEqual(sim.dailyVisitors, 900);
  assert.strictEqual(sim.monthlyVisits, 27000);
  assert.strictEqual(sim.cpaPayout, 45000);

  // CPA: round(27000 * 0.045 * 0.013 * 45000) = round(710775) = 710,775
  assert.strictEqual(sim.cpaRevenue, 710775);
  assert.strictEqual(sim.cpaRevenueFormatted, "710,775원");

  // CPS: round(27000 * 0.08 * 0.055 * 45000 * 0.03) = round(160380) = 160,380
  assert.strictEqual(sim.cpsRevenue, 160380);
  assert.strictEqual(sim.cpsRevenueFormatted, "160,380원");

  // AdFit: round(27000 * 1.8 * (1400 / 1000)) = round(68040) = 68,040
  assert.strictEqual(sim.adfitRevenue, 68040);
  assert.strictEqual(sim.adfitRevenueFormatted, "68,040원");

  // Total: 710775 + 160380 + 68040 = 939,195
  assert.strictEqual(sim.totalRevenue, 939195);
  assert.strictEqual(sim.totalRevenueFormatted, "939,195원");

  // Invariant: At V=900 and CPA=45,000, 939,195 is strictly less than 1,000,000 KRW
  assert.strictEqual(sim.goalAchieved, false, "At V=900, monthly revenue is 939,195 won (< 1,000,000 won goal)");
});

suite.test('Stress 4.2: Exact Boundary Transition to 1,000,000 KRW Goal Achievement (V=958 vs V=959)', async () => {
  const { calculateRevenueSimulation } = await getMonetization();

  // V=958:
  // Monthly visits = 28,740
  // CPA = round(28740 * 0.045 * 0.013 * 45000) = round(756580.5) = 756,581
  // CPS = round(28740 * 0.08 * 0.055 * 45000 * 0.03) = round(170715.6) = 170,716
  // AdFit = round(28740 * 1.8 * 1.4) = round(72424.8) = 72,425
  // Total = 756581 + 170716 + 72425 = 999,722 (< 1,000,000)
  const sim958 = calculateRevenueSimulation(958, 45000);
  assert(sim958.totalRevenue < 1000000, `At V=958, total ${sim958.totalRevenue} must be < 1,000,000`);
  assert.strictEqual(sim958.goalAchieved, false);

  // V=959:
  // Monthly visits = 28,770
  // CPA = round(28770 * 0.045 * 0.013 * 45000) = round(757369.875) = 757,370
  // CPS = round(28770 * 0.08 * 0.055 * 45000 * 0.03) = round(170893.8) = 170,894
  // AdFit = round(28770 * 1.8 * 1.4) = round(72500.4) = 72,500
  // Total = 757370 + 170894 + 72500 = 1,000,764 (>= 1,000,000)
  const sim959 = calculateRevenueSimulation(959, 45000);
  assert(sim959.totalRevenue >= 1000000, `At V=959, total ${sim959.totalRevenue} must be >= 1,000,000`);
  assert.strictEqual(sim959.goalAchieved, true);
});

suite.test('Stress 4.3: Revenue Simulator Input Argument Signatures (Object vs Primitives)', async () => {
  const { calculateRevenueSimulation } = await getMonetization();

  const res1 = calculateRevenueSimulation(1200, 50000);
  const res2 = calculateRevenueSimulation({ dailyVisitors: 1200, cpaPayout: 50000 });
  const res3 = calculateRevenueSimulation({ visitors: 1200, cpaPayout: 50000 });

  assert.strictEqual(res1.totalRevenue, res2.totalRevenue);
  assert.strictEqual(res1.totalRevenue, res3.totalRevenue);
  assert.strictEqual(res1.cpaRevenue, res2.cpaRevenue);
  assert.strictEqual(res1.cpsRevenue, res2.cpsRevenue);
  assert.strictEqual(res1.adfitRevenue, res2.adfitRevenue);
});

suite.test('Stress 4.4: High-Traffic Input Conversion Heuristic (visitors > 10,000 treated as monthly)', async () => {
  const { calculateRevenueSimulation } = await getMonetization();

  // If passed 30,000 (monthly visits), it should automatically divide by 30 -> daily 1,000
  const sim = calculateRevenueSimulation(30000, 45000);
  assert.strictEqual(sim.dailyVisitors, 1000);
  assert.strictEqual(sim.monthlyVisits, 30000);

  const directDaily1000 = calculateRevenueSimulation(1000, 45000);
  assert.strictEqual(sim.totalRevenue, directDaily1000.totalRevenue);
});

suite.test('Stress 4.5: Linear Scaling Invariant across Traffic Multipliers (1x, 2x, 5x, 10x)', async () => {
  const { calculateRevenueSimulation } = await getMonetization();
  const base = calculateRevenueSimulation(500, 40000);

  const multipliers = [2, 3, 5, 10];
  for (const m of multipliers) {
    const scaled = calculateRevenueSimulation(500 * m, 40000);
    // Allow small integer rounding divergence of <= m won
    assert(Math.abs(scaled.totalRevenue - base.totalRevenue * m) <= m,
      `Linear scaling must hold for ${m}x multiplier`);
  }
});

suite.test('Stress 4.6: Simulator Defaults on Undefined, Null, and Zero Inputs', async () => {
  const { calculateRevenueSimulation } = await getMonetization();

  // Undefined / null -> defaults to 900 daily, 45,000 payout
  const def = calculateRevenueSimulation();
  assert.strictEqual(def.dailyVisitors, 900);
  assert.strictEqual(def.cpaPayout, 45000);
  assert.strictEqual(def.totalRevenue, 939195);

  const fromNull = calculateRevenueSimulation(null, null);
  assert.strictEqual(fromNull.dailyVisitors, 900);
  assert.strictEqual(fromNull.cpaPayout, 45000);

  const fromZero = calculateRevenueSimulation(0, 0);
  assert.strictEqual(fromZero.dailyVisitors, 900);
  assert.strictEqual(fromZero.cpaPayout, 45000);
});

suite.test('Stress 4.7: CPA Payout Range Sensitivity (20,000 KRW to 75,000 KRW UI Slider Steps)', async () => {
  const { calculateRevenueSimulation } = await getMonetization();
  const steps = [20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000];

  let prevTotal = 0;
  for (const payout of steps) {
    const sim = calculateRevenueSimulation(900, payout);
    assert(sim.totalRevenue > prevTotal, "Revenue must strictly increase with higher CPA payout");
    // CPS and AdFit revenue must remain invariant
    assert.strictEqual(sim.cpsRevenue, 160380);
    assert.strictEqual(sim.adfitRevenue, 68040);
    prevTotal = sim.totalRevenue;
  }
});

suite.test('Stress 4.8: Component Summation and Number Formatting Sanity Check', async () => {
  const { calculateRevenueSimulation } = await getMonetization();
  const testCases = [150, 650, 1500, 3500, 5000];

  for (const v of testCases) {
    const sim = calculateRevenueSimulation(v, 45000);
    // Component sum invariant
    assert.strictEqual(sim.totalRevenue, sim.cpaRevenue + sim.cpsRevenue + sim.adfitRevenue);

    // Formatted strings sanity
    assert.strictEqual(sim.totalRevenueFormatted, `${sim.totalRevenue.toLocaleString()}원`);
    assert.strictEqual(sim.cpaRevenueFormatted, `${sim.cpaRevenue.toLocaleString()}원`);
    assert.strictEqual(sim.cpsRevenueFormatted, `${sim.cpsRevenue.toLocaleString()}원`);
    assert.strictEqual(sim.adfitRevenueFormatted, `${sim.adfitRevenue.toLocaleString()}원`);
  }
});

// Run directly if called as main script
if (require.main === module) {
  suite.run().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}

module.exports = suite;
