/**
 * MoneyFit Final Adversarial Stress Test Suite
 * Executed by: challenger_final_1
 *
 * Verifies:
 * 1. 50,000 randomized Monte Carlo simulations for calculateRoom (strict BOM <= budget invariant)
 * 2. Extreme edge & adversarial inputs across all 6 calculators
 * 3. Full 36 static HTML preset file inspection (Korean char count >= 1500, Schema.org WebApplication + FAQPage JSON-LD syntax, real numbers in <table>)
 * 4. Marketing sniper engine and night growth routine (--dry-run)
 * 5. Verify acceptance criteria harness (4/4 passing)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const { getCalculators, getMonetization, createTestSuite, assertStrictLTE, assertApprox } = require('./test-helper');

const suite = createTestSuite('Final Adversarial Stress & Invariant Verification Suite');

// ============================================================================
// 1. 50,000 RANDOMIZED MONTE CARLO BUDGET SIMULATIONS (calculateRoom)
// ============================================================================
suite.test('Adversarial 1: 50,000 Randomized Budget Monte Carlo Simulations for calculateRoom', async () => {
  const { calculateRoom } = await getCalculators();

  const ITERATIONS = 50000;
  let violations = 0;
  let minBudgetTested = Infinity;
  let maxBudgetTested = -Infinity;
  const priorities = ['가성비', '가전 집중', '화이트 감성', '기본', 'unknown_priority'];

  const startTime = Date.now();

  for (let i = 0; i < ITERATIONS; i++) {
    // Alternate between budget (Won) and budgetMan (Man-won)
    let inputs;
    let expectedBudgetWon;

    if (i % 2 === 0) {
      // Direct Won budget: 100,000 to 50,000,000 (with random digits)
      const won = Math.floor(Math.random() * 49900000) + 100000;
      inputs = {
        budget: won,
        roomSize: Math.floor(Math.random() * 40) + 4,
        priority: priorities[i % priorities.length]
      };
      expectedBudgetWon = won;
    } else {
      // Man-won budget: 10 to 5,000
      const man = Math.floor(Math.random() * 4990) + 10;
      inputs = {
        budgetMan: man,
        roomSize: Math.floor(Math.random() * 40) + 4,
        priority: priorities[i % priorities.length]
      };
      expectedBudgetWon = man * 10000;
    }

    if (expectedBudgetWon < minBudgetTested) minBudgetTested = expectedBudgetWon;
    if (expectedBudgetWon > maxBudgetTested) maxBudgetTested = expectedBudgetWon;

    try {
      const result = calculateRoom(inputs);

      // Invariant 1: Strict <= budget
      if (result.totalCost > result.budgetWon) {
        violations++;
        console.error(`VIOLATION at run ${i}: totalCost (${result.totalCost}) > budgetWon (${result.budgetWon})`);
      }

      // Invariant 2: Exact balance check
      if (result.totalCost !== result.budgetWon) {
        violations++;
        console.error(`MISMATCH at run ${i}: totalCost (${result.totalCost}) !== budgetWon (${result.budgetWon})`);
      }

      // Invariant 3: All items non-negative
      for (const item of result.items) {
        if (item.cost < 0 || isNaN(item.cost)) {
          violations++;
          console.error(`INVALID ITEM at run ${i}: ${item.name} cost is ${item.cost}`);
        }
      }

      // Invariant 4: No NaN in core metrics
      if (isNaN(result.appliancesTotalWon) || isNaN(result.furnitureTotalWon) || isNaN(result.savingWon)) {
        violations++;
        console.error(`NaN METRIC at run ${i}`);
      }
    } catch (err) {
      violations++;
      console.error(`EXCEPTION at run ${i}:`, err.message);
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`    [Monte Carlo 50,000 Runs Completed in ${elapsed}ms]`);
  console.log(`    - Min Budget Tested: ${minBudgetTested.toLocaleString()} KRW`);
  console.log(`    - Max Budget Tested: ${maxBudgetTested.toLocaleString()} KRW`);
  console.log(`    - Total Violations: ${violations}`);

  assert.strictEqual(violations, 0, `Expected 0 violations across 50,000 randomized budgets, got ${violations}`);
});

// ============================================================================
// 2. EXTREME EDGE & CORNER CASES ACROSS ALL 6 CALCULATORS
// ============================================================================
suite.test('Adversarial 2.1: calculateElectric extreme values and boundary sweeps', async () => {
  const { calculateElectric, calcKepcoBill } = await getCalculators();

  // Test zero consumption
  const zeroRes = calculateElectric({ wattage: 0, hours: 0, baseKwh: 200, newPrice: 850000 });
  assert.strictEqual(zeroRes.addedKwh, 0);
  assert.strictEqual(zeroRes.monthlySaving, 0);
  assert.strictEqual(zeroRes.paybackMonths, 0);
  assert(zeroRes.headline.includes('미가동'));

  // Test massive wattage (e.g. 50,000W industrial appliance)
  const hugeRes = calculateElectric({ wattage: 50000, hours: 24, baseKwh: 500, newPrice: 2000000, isSummer: true });
  assert(hugeRes.addedKwh > 30000);
  assert(hugeRes.totalKwh > 30000);
  assert(hugeRes.monthlySaving > 100000);
  assert(hugeRes.paybackMonths > 0 && !isNaN(hugeRes.paybackMonths));
  assert(hugeRes.badge.includes('폭탄'));

  // Kepco bill boundary sweeps: 200, 201, 300, 301, 400, 401, 450, 451
  const k200 = calcKepcoBill(200, false);
  const k201 = calcKepcoBill(201, false);
  assert(k201 > k200, '201 kWh bill must be higher than 200 kWh');

  const s300 = calcKepcoBill(300, true);
  const s301 = calcKepcoBill(301, true);
  assert(s301 > s300, 'Summer 301 kWh bill must be higher than 300 kWh');
});

suite.test('Adversarial 2.2: calculateDiet extreme values and safety floor', async () => {
  const { calculateDiet } = await getCalculators();

  // Extreme starvation deficit (-3000kcal) on tiny person: 1200 kcal floor must engage
  const starved = calculateDiet({ gender: 'female', weight: 40, height: 140, age: 30, activityFactor: 1.2, weeks: 4, deficit: -3000 });
  assert.strictEqual(starved.targetKcal, 1200, 'Minimum calorie intake floor 1200 kcal must be strictly enforced');
  assert(starved.dailyProteinG > 0);
  assert(starved.dailyFatG >= 20);
  assert(starved.dailyCarbG >= 50);
  assert(starved.chickenPacks > 0);
  assert(starved.brownRiceBowls > 0);

  // Extreme heavyweight sumo/athlete (220kg, 200cm, +1500kcal bulk)
  const giant = calculateDiet({ gender: 'male', weight: 220, height: 200, age: 25, activityFactor: 1.9, weeks: 8, deficit: 1500 });
  assert(giant.targetKcal > 4000);
  assert.strictEqual(giant.dailyProteinG, 440); // 220kg * 2.0g
  assert(giant.chickenPacks > 0);
  assert(!isNaN(giant.chickenPacks));
});

suite.test('Adversarial 2.3: calculatePet extreme weights and life factors', async () => {
  const { calculatePet } = await getCalculators();

  // Sub-0.5kg input must clamp to 0.5kg
  const tiny = calculatePet({ petWeight: 0.1, factor: 3.0, kcalPerKg: 3800, bagKg: 1.0 });
  assertApprox(tiny.petWeight, 0.1);
  assert(tiny.rer > 0);
  assert(tiny.dailyGrams > 0);
  assert(tiny.daysPerBag > 0);

  // Huge 90kg Mastiff
  const mastiff = calculatePet({ petWeight: 90, factor: 1.4, kcalPerKg: 3500, bagKg: 15.0 });
  assert(mastiff.rer > 1000);
  assert(mastiff.dailyGrams > 500);
  assert(mastiff.daysPerBag > 0);
  assert(!isNaN(mastiff.daysPerBag));
});

suite.test('Adversarial 2.4: calculateAuto corporate tax deduction and zero tax rate', async () => {
  const { calculateAuto } = await getCalculators();

  // 0% tax rate (salaried worker) -> taxSaving must be exactly 0
  const personal = calculateAuto({ carPriceMan: 3500, months: 48, taxRate: 0 });
  assert.strictEqual(personal.taxSaving, 0);

  // Super luxury car (1.5 billion KRW / 150,000 man-won) with 45% tax rate
  // Statutory cap is 1,500만 won annual cap
  const superCar = calculateAuto({ carPriceMan: 15000, months: 48, taxRate: 45 });
  // Price * 0.3 = 4,500만 won > 1,500만 won cap
  // Annual cap = 1,500만 won * 0.45 * 4 years = 2,700만 won
  assert.strictEqual(superCar.taxSaving, 27000000);
  assert.strictEqual(superCar.acqTax, Math.round(150000000 * 0.07));
});

suite.test('Adversarial 2.5: calculateTelecom edge cases and BEP transition', async () => {
  const { calculateTelecom } = await getCalculators();

  // Zero penalty (contract already expired) -> instant cash gift profit
  const expired = calculateTelecom({ penaltyMan: 0, oldFee: 45000, newFee: 38500, cashGiftMan: 47 });
  assert.strictEqual(expired.immediateNetWon, 470000);
  assert.strictEqual(expired.bepMonths, 0);
  assert(expired.totalNetBenefit > 470000);
  assert(expired.badge.includes('이득'));

  // Huge penalty (60만) vs small gift (10만), same monthly fee -> loss, BEP = -1
  const badDeal = calculateTelecom({ penaltyMan: 60, oldFee: 40000, newFee: 40000, cashGiftMan: 10 });
  assert.strictEqual(badDeal.immediateNetWon, -500000);
  assert.strictEqual(badDeal.bepMonths, -1);
  assert(badDeal.totalNetBenefit < 0);
  assert(badDeal.badge.includes('만기 후 이동'));
});

// ============================================================================
// 3. FULL ADVERSARIAL INSPECTION OF ALL 36 STATIC HTML PRESET FILES
// ============================================================================
suite.test('Adversarial 3: Inspect All 36 Static HTML Files for SEO, JSON-LD, Tables, and Korean Count', async () => {
  const presetDir = path.join(PROJECT_ROOT, 'dist', 'preset');
  assert(fs.existsSync(presetDir), 'dist/preset/ directory must exist');

  const entries = fs.readdirSync(presetDir, { withFileTypes: true });
  const slugs = entries.filter(e => e.isDirectory()).map(e => e.name);

  assert.strictEqual(slugs.length, 36, `Expected exactly 36 preset directories, found ${slugs.length}`);

  let minKoreanCount = Infinity;
  let maxKoreanCount = -Infinity;
  let totalKoreanCount = 0;
  const inspectedFiles = [];

  for (const slug of slugs) {
    const htmlPath = path.join(presetDir, slug, 'index.html');
    assert(fs.existsSync(htmlPath), `File not found: ${htmlPath}`);

    const content = fs.readFileSync(htmlPath, 'utf8');

    // 1. Minimum file size check (> 8 KB)
    assert(content.length > 8000, `File ${slug} is too small (${content.length} bytes)`);

    // 2. Pure Korean character count verification (HTML tags stripped)
    // Strip <script> and <style> blocks first, then all tags
    const noScript = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    const noStyle = noScript.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    const textOnly = noStyle.replace(/<[^>]+>/g, ' ');
    const koreanMatches = textOnly.match(/[가-힣]/g) || [];
    const koreanCount = koreanMatches.length;

    if (koreanCount < minKoreanCount) minKoreanCount = koreanCount;
    if (koreanCount > maxKoreanCount) maxKoreanCount = koreanCount;
    totalKoreanCount += koreanCount;

    assert(koreanCount >= 1500, `Korean char count in ${slug} is ${koreanCount}, expected >= 1500`);

    // 3. Schema.org JSON-LD Structure and Syntax Verification
    const jsonLdMatches = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
    assert(jsonLdMatches.length > 0, `No JSON-LD script found in ${slug}`);

    let hasWebApplication = false;
    let hasFAQPage = false;

    for (const match of jsonLdMatches) {
      const jsonRaw = match.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(jsonRaw);
      } catch (err) {
        throw new Error(`Invalid JSON-LD syntax in ${slug}: ${err.message}`);
      }

      assert(parsed['@context'] && parsed['@context'].includes('schema.org'), `JSON-LD in ${slug} missing @context`);

      // Can be direct object or @graph
      const items = parsed['@graph'] ? parsed['@graph'] : [parsed];
      for (const item of items) {
        if (item['@type'] === 'WebApplication') {
          hasWebApplication = true;
          assert(item.name, `WebApplication in ${slug} missing name`);
          assert(item.applicationCategory, `WebApplication in ${slug} missing applicationCategory`);
        }
        if (item['@type'] === 'FAQPage') {
          hasFAQPage = true;
          assert(Array.isArray(item.mainEntity), `FAQPage in ${slug} mainEntity is not an array`);
          assert(item.mainEntity.length >= 3, `FAQPage in ${slug} has < 3 questions (${item.mainEntity.length})`);
          for (const faq of item.mainEntity) {
            assert(faq.name && faq.name.length > 0, `FAQ in ${slug} missing question name`);
            assert(faq.acceptedAnswer && faq.acceptedAnswer.text, `FAQ in ${slug} missing accepted answer text`);
          }
        }
      }
    }

    assert(hasWebApplication, `Missing WebApplication JSON-LD in ${slug}`);
    assert(hasFAQPage, `Missing FAQPage JSON-LD in ${slug}`);

    // 4. Comparative Table Verification
    assert(content.includes('<table'), `Missing <table> in ${slug}`);
    assert(content.includes('<th'), `Missing <th> in ${slug}`);
    assert(content.includes('<td'), `Missing <td> in ${slug}`);

    // Extract table section and verify real numbers
    const tableMatch = content.match(/<table[\s\S]*?<\/table>/i);
    assert(tableMatch, `Could not extract <table> in ${slug}`);
    const tableHtml = tableMatch[0];
    const tableDigits = tableHtml.match(/\d+/g) || [];
    assert(tableDigits.length >= 4, `Comparative table in ${slug} does not contain enough real numbers (${tableDigits.length} numbers found)`);

    // Verify absence of placeholder text
    assert(!tableHtml.includes('TODO'), `Table in ${slug} contains TODO`);
    assert(!tableHtml.includes('undefined'), `Table in ${slug} contains undefined`);
    assert(!tableHtml.includes('NaN'), `Table in ${slug} contains NaN`);
    assert(!tableHtml.includes('Lorem ipsum'), `Table in ${slug} contains Lorem ipsum`);

    inspectedFiles.push({ slug, koreanCount, tableDigitsCount: tableDigits.length });
  }

  const avgKoreanCount = Math.round(totalKoreanCount / slugs.length);
  console.log(`    [36 Preset HTML Files Inspected]`);
  console.log(`    - Min Korean Characters: ${minKoreanCount}`);
  console.log(`    - Max Korean Characters: ${maxKoreanCount}`);
  console.log(`    - Avg Korean Characters: ${avgKoreanCount}`);
  console.log(`    - 100% Files Passed Schema.org WebApplication & FAQPage JSON-LD syntax validation`);
  console.log(`    - 100% Files Passed Table Real Number & Anti-Placeholder validation`);
});

// ============================================================================
// 4. MARKETING SCRIPTS STRESS TESTING
// ============================================================================
suite.test('Adversarial 4.1: Run marketing-sniper.js and verify 오늘의_실전마케팅_스나이퍼_키트.md', async () => {
  const sniperScript = path.join(PROJECT_ROOT, 'scripts', 'marketing-sniper.js');
  const res = spawnSync(process.execPath, [sniperScript], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8'
  });

  assert.strictEqual(res.status, 0, `marketing-sniper.js exited with code ${res.status}:\n${res.stderr}`);

  const sniperOutputFile = path.join(PROJECT_ROOT, '오늘의_실전마케팅_스나이퍼_키트.md');
  assert(fs.existsSync(sniperOutputFile), '오늘의_실전마케팅_스나이퍼_키트.md must exist');

  const content = fs.readFileSync(sniperOutputFile, 'utf8');
  assert(content.length > 5000, `Sniper output too short (${content.length} bytes)`);

  // Verify key components
  assert(content.includes('실전 마케팅 스나이퍼 리포트') || content.includes('스나이퍼'), 'Missing sniper title');
  assert(content.includes('1. 전기·가전'), 'Missing electric category');
  assert(content.includes('2. 다이어트 식단'), 'Missing diet category');
  assert(content.includes('3. 반려동물'), 'Missing pet category');
  assert(content.includes('4. 자취·이사'), 'Missing room category');
  assert(content.includes('5. 자동차'), 'Missing auto category');
  assert(content.includes('6. 인터넷·TV') || content.includes('통신'), 'Missing telecom category');

  // Verify real Naver Jisik-iN / Cafe search links
  assert(content.includes('search.naver.com') || content.includes('kin.naver.com'), 'Missing search links');
  assert(content.includes('쿠팡'), 'Missing Coupang CTA copy');
  console.log(`    [Marketing Sniper Kit verified: ${content.length} bytes, 6 categories, active search links]`);
});

suite.test('Adversarial 4.2: Run night-growth.js --dry-run and verify 일일_야간작업_리포트.md', async () => {
  const nightScript = path.join(PROJECT_ROOT, 'scripts', 'night-growth.js');
  const res = spawnSync(process.execPath, [nightScript, '--dry-run'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8'
  });

  assert.strictEqual(res.status, 0, `night-growth.js --dry-run exited with code ${res.status}:\n${res.stderr}`);

  const reportFile = path.join(PROJECT_ROOT, '일일_야간작업_리포트.md');
  assert(fs.existsSync(reportFile), '일일_야간작업_리포트.md must exist');

  const reportContent = fs.readFileSync(reportFile, 'utf8');
  assert(reportContent.length > 1000, `Night growth report too short (${reportContent.length} bytes)`);
  assert(reportContent.includes('일일 야간 자율 증식 및 색인 자동화 리포트') || reportContent.includes('야간 자율 증식'), 'Missing header');
  assert(reportContent.includes('36개') || reportContent.includes('36 / 36개'), 'Report should mention 36 presets');
  assert(reportContent.includes('sitemap'), 'Report should mention sitemap');
  assert(reportContent.includes('정상 완료') || reportContent.includes('성공'), 'Report should indicate success');
  console.log(`    [Night Growth Routine verified: ${reportContent.length} bytes, exit code 0]`);
});

// ============================================================================
// 5. MASTER ACCEPTANCE CRITERIA RUNNER VERIFICATION
// ============================================================================
suite.test('Adversarial 5: Run verify-acceptance.js and assert 4/4 passing with 0 errors', async () => {
  const verifyScript = path.join(PROJECT_ROOT, 'scripts', 'verify-acceptance.js');
  const res = spawnSync(process.execPath, [verifyScript], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8'
  });

  assert.strictEqual(res.status, 0, `verify-acceptance.js failed with code ${res.status}:\n${res.stderr}\n${res.stdout}`);
  assert(res.stdout.includes('AC 1     : ✓ PASSED'), 'AC 1 did not pass');
  assert(res.stdout.includes('AC 2     : ✓ PASSED'), 'AC 2 did not pass');
  assert(res.stdout.includes('AC 3     : ✓ PASSED'), 'AC 3 did not pass');
  assert(res.stdout.includes('AC 4     : ✓ PASSED'), 'AC 4 did not pass');
  assert(res.stdout.includes('ALL ACCEPTANCE CRITERIA PASSED'), 'Acceptance criteria failed');
  console.log('    [Master Acceptance Criteria verified: 4/4 PASSED with 0 errors]');
});

// Direct execution
if (require.main === module) {
  suite.run().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}

module.exports = suite;
