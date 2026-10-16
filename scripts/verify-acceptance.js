/**
 * MoneyFit Portal - Master Acceptance Criteria Verifier (AC 1 ~ AC 4)
 * Programmatic end-to-end verification harness.
 * Executable via `node scripts/verify-acceptance.js`
 * Exit code 0 on 100% success, Exit code 1 on any failure.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const { getCalculators, assertStrictLTE, assertApprox } = require('../tests/test-helper');

const SLUGS = [
  // 1. Electric (6)
  'electric-studio-ac',
  'electric-stand-ac',
  'electric-dehumidifier',
  'electric-dryer',
  'electric-winter-heater',
  'electric-inverter-roi',
  // 2. Diet (6)
  'diet-male-fatloss',
  'diet-female-lean',
  'diet-male-bulkup',
  'diet-office-worker',
  'diet-student-budget',
  'diet-quick-3kg',
  // 3. Pet (6)
  'pet-maltese-5kg',
  'pet-pomeranian-puppy',
  'pet-golden-retriever',
  'pet-korean-shorthair',
  'pet-senior-cat',
  'pet-monthly-budget',
  // 4. Room (6)
  'room-oneroom-100',
  'room-officetel-300',
  'room-officetel-500',
  'room-newlywed-1000',
  'room-minimalist-50',
  'room-appliances-only',
  // 5. Auto (6)
  'auto-avante-3000',
  'auto-grandeur-5000',
  'auto-tucson-hybrid',
  'auto-genesis-g80',
  'auto-casper-cash-vs-rent',
  'auto-ev-ioniq',
  // 6. Telecom (6)
  'telecom-penalty-15',
  'telecom-penalty-30',
  'telecom-3yr-expired',
  'telecom-single-oneroom',
  'telecom-family-4p',
  'telecom-mvno-switch'
];

async function verifyAC1() {
  console.log('\n--- [AC 1] 6 Life Financial Calculators Domain Math & BOM Invariant ---');
  const {
    calculateElectric,
    calculateDiet,
    calculatePet,
    calculateRoom,
    calculateAuto,
    calculateTelecom
  } = await getCalculators();

  const errors = [];
  let scenarioCount = 0;

  // 1. Electric (3 scenarios)
  try {
    const e1 = calculateElectric({ wattage: 650, hours: 10, baseKwh: 150, newPrice: 550000 });
    if (e1.addedKwh !== 195 || e1.totalKwh !== 345) throw new Error(`E1 math mismatch: added=${e1.addedKwh}, total=${e1.totalKwh}`);
    scenarioCount++;

    const e2 = calculateElectric({ wattage: 2200, hours: 12, baseKwh: 310, isSummer: true });
    if (e2.totalKwh !== 1102 || !e2.badge.includes('폭탄')) throw new Error('E2 summer explosion not triggered');
    scenarioCount++;

    const e3 = calculateElectric({ wattage: 320, hours: 24, baseKwh: 220 });
    if (e3.addedKwh !== 230 || e3.totalKwh !== 450) throw new Error('E3 dehumidifier calculation error');
    scenarioCount++;
  } catch (err) {
    errors.push(`Calc 1 (Electric): ${err.message}`);
  }

  // 2. Diet (3 scenarios)
  try {
    const d1 = calculateDiet({ gender: 'male', weight: 80, height: 178, age: 30, activityFactor: 1.55, weeks: 4, deficit: -500 });
    if (d1.dailyProteinG !== 160 || d1.chickenPacks !== 127) throw new Error(`D1 diet mismatch: protein=${d1.dailyProteinG}, chicken=${d1.chickenPacks}`);
    scenarioCount++;

    const d2 = calculateDiet({ gender: 'female', weight: 55, height: 163, age: 30, activityFactor: 1.375, weeks: 2, deficit: -400 });
    if (d2.chickenPacks !== 44 || d2.brownRiceBowls !== 28) throw new Error('D2 female diet mismatch');
    scenarioCount++;

    const d3 = calculateDiet({ gender: 'male', weight: 65, height: 175, age: 25, activityFactor: 1.55, weeks: 4, deficit: 350 });
    if (d3.targetKcal <= d3.tdee) throw new Error('D3 bulkup target kcal should exceed TDEE');
    scenarioCount++;
  } catch (err) {
    errors.push(`Calc 2 (Diet): ${err.message}`);
  }

  // 3. Pet (3 scenarios)
  try {
    const p1 = calculatePet({ petWeight: 5.0, factor: 1.6, kcalPerKg: 3650, bagKg: 2.0 });
    if (p1.dailyGrams < 95 || p1.dailyGrams > 110) throw new Error(`P1 Maltese daily grams out of bounds: ${p1.dailyGrams}`);
    scenarioCount++;

    const p2 = calculatePet({ petWeight: 1.5, factor: 2.8, kcalPerKg: 3900, bagKg: 1.5 });
    if (p2.dailyGrams < 60 || p2.dailyGrams > 75) throw new Error('P2 Pomeranian puppy daily grams error');
    scenarioCount++;

    const p3 = calculatePet({ petWeight: 30.0, factor: 1.6, kcalPerKg: 3500, bagKg: 12.0 });
    if (p3.dailyGrams < 390 || p3.dailyGrams > 430) throw new Error('P3 Golden retriever daily grams error');
    scenarioCount++;
  } catch (err) {
    errors.push(`Calc 3 (Pet): ${err.message}`);
  }

  // 4. Room BOM & Strict Invariant (3 scenarios + 11 budgets invariant check)
  try {
    const r1 = calculateRoom({ budgetMan: 50, roomSize: 5 });
    if (r1.totalCost > 500000) throw new Error(`R1 budget overrun: ${r1.totalCost} > 500,000`);
    scenarioCount++;

    const r2 = calculateRoom({ budgetMan: 150, roomSize: 7 });
    if (r2.totalCost > 1500000) throw new Error(`R2 budget overrun: ${r2.totalCost} > 1,500,000`);
    scenarioCount++;

    const r3 = calculateRoom({ budgetMan: 1000, roomSize: 24 });
    if (r3.totalCost > 10000000) throw new Error(`R3 budget overrun: ${r3.totalCost} > 10,000,000`);
    scenarioCount++;

    // Exhaustive Invariant Assertion
    const invariantBudgets = [50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000];
    for (const b of invariantBudgets) {
      const res = calculateRoom({ budgetMan: b });
      const sum = res.items.reduce((acc, cur) => acc + cur.cost, 0);
      if (sum > b * 10000) {
        throw new Error(`CRITICAL INVARIANT VIOLATION: Budget ${b * 10000} won, BOM sum = ${sum} won`);
      }
    }
  } catch (err) {
    errors.push(`Calc 4 (Room BOM): ${err.message}`);
  }

  // 5. Auto TCO (3 scenarios)
  try {
    const a1 = calculateAuto({ carPriceMan: 3000, months: 60, taxRate: 0 });
    if (a1.taxSaving !== 0 || a1.acqTax !== 2100000) throw new Error('A1 salaried worker auto error');
    scenarioCount++;

    const a2 = calculateAuto({ carPriceMan: 5000, months: 48, taxRate: 24 });
    if (a2.taxSaving !== 14400000) throw new Error(`A2 taxSaving error: ${a2.taxSaving}`);
    scenarioCount++;

    const a3 = calculateAuto({ carPriceMan: 7000, months: 36, taxRate: 35 });
    if (a3.taxSaving !== 15750000) throw new Error('A3 high-earner tax deduction error');
    scenarioCount++;
  } catch (err) {
    errors.push(`Calc 5 (Auto TCO): ${err.message}`);
  }

  // 6. Telecom (3 scenarios)
  try {
    const t1 = calculateTelecom({ penaltyMan: 15, oldFee: 46000, newFee: 38500, cashGiftMan: 47 });
    if (t1.immediateNetWon !== 320000 || t1.bepMonths !== 0) throw new Error('T1 telecom switch error');
    scenarioCount++;

    const t2 = calculateTelecom({ penaltyMan: 30, oldFee: 51000, newFee: 41000, cashGiftMan: 47 });
    if (t2.immediateNetWon !== 170000) throw new Error('T2 high penalty error');
    scenarioCount++;

    const t3 = calculateTelecom({ penaltyMan: 0, oldFee: 45000, newFee: 36000, cashGiftMan: 47 });
    if (t3.immediateNetWon !== 470000) throw new Error('T3 contract expired error');
    scenarioCount++;
  } catch (err) {
    errors.push(`Calc 6 (Telecom): ${err.message}`);
  }

  const passed = errors.length === 0;
  if (passed) {
    console.log(`  ✓ AC 1 PASS: All 6 calculators passed (${scenarioCount} scenarios verified, strict BOM <= budget invariant held)`);
  } else {
    console.error(`  ✗ AC 1 FAIL: ${errors.length} error(s):`);
    errors.forEach(e => console.error(`    - ${e}`));
  }
  return { ac: 'AC 1', passed, errors, scenarios: scenarioCount };
}

function verifyAC2() {
  console.log('\n--- [AC 2] 36 Programmatic SEO Static HTML Pages (SSG) & Indexing ---');
  const errors = [];
  const titles = new Set();
  const descriptions = new Set();
  let verifiedPages = 0;

  for (const slug of SLUGS) {
    // Check possible static locations: dist/preset/{slug}/index.html or dist/preset/{slug}.html
    const targetPath1 = path.join(PROJECT_ROOT, 'dist', 'preset', slug, 'index.html');
    const targetPath2 = path.join(PROJECT_ROOT, 'dist', 'preset', `${slug}.html`);
    const filePath = fs.existsSync(targetPath1) ? targetPath1 : (fs.existsSync(targetPath2) ? targetPath2 : null);

    if (!filePath) {
      errors.push(`Missing static HTML page for preset: ${slug} (checked ${targetPath1})`);
      continue;
    }

    const html = fs.readFileSync(filePath, 'utf8');

    // (a) Unique <title> and <meta name="description">
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) ||
                      html.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["']/i);

    if (!titleMatch || !titleMatch[1].trim()) {
      errors.push(`Preset ${slug}: Missing or empty <title> tag`);
    } else {
      const title = titleMatch[1].trim();
      if (titles.has(title)) {
        errors.push(`Preset ${slug}: Duplicate <title> detected ("${title}")`);
      }
      titles.add(title);
    }

    if (!descMatch || !descMatch[1].trim()) {
      errors.push(`Preset ${slug}: Missing or empty meta description`);
    } else {
      const desc = descMatch[1].trim();
      if (descriptions.has(desc)) {
        errors.push(`Preset ${slug}: Duplicate meta description detected ("${desc}")`);
      }
      descriptions.add(desc);
    }

    // (b) Comparative <table> presence
    if (!html.includes('<table') || !html.includes('</table>')) {
      errors.push(`Preset ${slug}: Missing comparative <table> element`);
    }

    // (c) Schema.org JSON-LD (WebApplication and FAQPage)
    const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
    if (!jsonLdMatch) {
      errors.push(`Preset ${slug}: Missing application/ld+json structured data`);
    } else {
      try {
        const schema = JSON.parse(jsonLdMatch[1].trim());
        const schemas = Array.isArray(schema) ? schema : (schema['@graph'] ? schema['@graph'] : [schema]);
        const types = schemas.map(s => s['@type']);

        const hasWebApp = types.includes('WebApplication') || schemas.some(s => s['@type'] === 'WebApplication');
        const hasFaq = types.includes('FAQPage') || schemas.some(s => s['@type'] === 'FAQPage');

        if (!hasWebApp) errors.push(`Preset ${slug}: JSON-LD missing WebApplication schema`);
        if (!hasFaq) errors.push(`Preset ${slug}: JSON-LD missing FAQPage schema`);

        const faqSchema = schemas.find(s => s['@type'] === 'FAQPage');
        if (faqSchema && (!Array.isArray(faqSchema.mainEntity) || faqSchema.mainEntity.length < 2)) {
          errors.push(`Preset ${slug}: FAQPage mainEntity must have at least 2 Q&A items`);
        }
      } catch (e) {
        errors.push(`Preset ${slug}: Invalid JSON in ld+json script: ${e.message}`);
      }
    }

    // (d) Korean character count >= 1,500
    // Strip scripts, styles, svg, noscript, and tags
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<[^>]+>/g, ' ');

    const koreanChars = cleaned.match(/[가-힣]/g) || [];
    if (koreanChars.length < 1500) {
      errors.push(`Preset ${slug}: Insufficient Korean character count (${koreanChars.length} < 1,500 required)`);
    }

    verifiedPages++;
  }

  // (e) Sitemap.xml verification
  const sitemapDist = path.join(PROJECT_ROOT, 'dist', 'sitemap.xml');
  const sitemapRoot = path.join(PROJECT_ROOT, 'sitemap.xml');
  const sitemapPath = fs.existsSync(sitemapDist) ? sitemapDist : (fs.existsSync(sitemapRoot) ? sitemapRoot : null);

  if (!sitemapPath) {
    errors.push('Missing sitemap.xml in dist/ or root');
  } else {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const locMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g) || [];
    if (locMatches.length < 37) {
      errors.push(`sitemap.xml has insufficient URLs: ${locMatches.length} < 37 (home + 36 presets)`);
    }
  }

  // (f) robots.txt
  const robotsDist = path.join(PROJECT_ROOT, 'dist', 'robots.txt');
  const robotsRoot = path.join(PROJECT_ROOT, 'robots.txt');
  if (!fs.existsSync(robotsDist) && !fs.existsSync(robotsRoot)) {
    errors.push('Missing robots.txt in dist/ or root');
  }

  // (g) indexnow-submit.js --dry-run
  const indexNowScript = path.join(PROJECT_ROOT, 'scripts', 'indexnow-submit.js');
  if (!fs.existsSync(indexNowScript)) {
    errors.push('Missing scripts/indexnow-submit.js');
  } else {
    try {
      const res = spawnSync(process.execPath, [indexNowScript, '--dry-run'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: 10000
      });
      if (res.status !== 0) {
        errors.push(`indexnow-submit.js --dry-run failed with exit code ${res.status}: ${res.stderr || res.stdout}`);
      }
    } catch (e) {
      errors.push(`Failed to execute indexnow-submit.js: ${e.message}`);
    }
  }

  const passed = errors.length === 0 && verifiedPages === 36;
  if (passed) {
    console.log(`  ✓ AC 2 PASS: All 36 SSG pages verified (unique title/meta, <table>, JSON-LD, 1500+ Korean chars, sitemap >=37 URLs, robots.txt, IndexNow dry-run)`);
  } else {
    console.error(`  ✗ AC 2 FAIL: ${errors.length} error(s) found across ${verifiedPages}/36 pages:`);
    errors.slice(0, 10).forEach(e => console.error(`    - ${e}`));
    if (errors.length > 10) console.error(`    ... and ${errors.length - 10} more errors`);
  }
  return { ac: 'AC 2', passed, errors, verifiedPages };
}

function verifyAC3() {
  console.log('\n--- [AC 3] Monetization Pipelines & Viral Marketing Bundles ---');
  const errors = [];

  // 1. monetization.config.json
  const configPath = path.join(PROJECT_ROOT, 'monetization.config.json');
  if (!fs.existsSync(configPath)) {
    errors.push('Missing monetization.config.json');
  } else {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const requiredKeys = ['siteUrl', 'coupangAfId', 'linkPriceId', 'cpaMemberId', 'adfitUnitId', 'campaigns', 'merchants', 'ftcNotice'];
      for (const k of requiredKeys) {
        if (!cfg[k]) errors.push(`monetization.config.json missing required key: ${k}`);
      }
    } catch (e) {
      errors.push(`Invalid JSON in monetization.config.json: ${e.message}`);
    }
  }

  // 2. 36 viral post bundles in viral_posts/{slug}.md
  const viralDir = path.join(PROJECT_ROOT, 'viral_posts');
  let validBundles = 0;

  if (!fs.existsSync(viralDir)) {
    errors.push('Missing viral_posts/ directory');
  } else {
    for (const slug of SLUGS) {
      const postFile = path.join(viralDir, `${slug}.md`);
      if (!fs.existsSync(postFile)) {
        errors.push(`Missing viral copy bundle: viral_posts/${slug}.md`);
        continue;
      }
      const content = fs.readFileSync(postFile, 'utf8');

      // Check for Blog, Jisik-iN, and Threads sections
      const hasBlog = content.includes('블로그') || content.includes('Blog');
      const hasKin = content.includes('지식iN') || content.includes('지식인') || content.includes('카페');
      const hasThreads = content.includes('스레드') || content.includes('Threads') || content.includes('3줄');

      if (!hasBlog) errors.push(`viral_posts/${slug}.md missing Blog copy section`);
      if (!hasKin) errors.push(`viral_posts/${slug}.md missing Jisik-iN copy section`);
      if (!hasThreads) errors.push(`viral_posts/${slug}.md missing Threads 3-line copy section`);

      if (hasBlog && hasKin && hasThreads) validBundles++;
    }
  }

  // 3. Sniper kit output
  const sniperKitRoot = path.join(PROJECT_ROOT, '오늘의_실전마케팅_스나이퍼_키트.md');
  const sniperKitParent = path.join(PROJECT_ROOT, '..', '사업아이템', '오늘의_실전마케팅_스나이퍼_키트.md');

  if (!fs.existsSync(sniperKitRoot) && !fs.existsSync(sniperKitParent)) {
    errors.push('Missing 오늘의_실전마케팅_스나이퍼_키트.md');
  }

  const passed = errors.length === 0;
  if (passed) {
    console.log(`  ✓ AC 3 PASS: Monetization config valid, 36/36 viral post bundles verified (Blog + Jisik-iN + Threads), marketing sniper kit present`);
  } else {
    console.error(`  ✗ AC 3 FAIL: ${errors.length} error(s) found:`);
    errors.forEach(e => console.error(`    - ${e}`));
  }
  return { ac: 'AC 3', passed, errors, validBundles };
}

function verifyAC4() {
  console.log('\n--- [AC 4] Autonomous Night Growth Routine & Launch Readiness ---');
  const errors = [];

  // 1. Night growth script execution test
  const nightScriptJs = path.join(PROJECT_ROOT, 'scripts', 'night-growth.js');
  const nightScriptPy = path.join(PROJECT_ROOT, 'scripts', 'night_grow.py');

  if (fs.existsSync(nightScriptJs)) {
    try {
      const res = spawnSync(process.execPath, [nightScriptJs, '--dry-run'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: 15000
      });
      if (res.status !== 0) {
        errors.push(`night-growth.js --dry-run failed with exit code ${res.status}: ${res.stderr || res.stdout}`);
      }
    } catch (e) {
      errors.push(`Failed to execute night-growth.js: ${e.message}`);
    }
  } else if (fs.existsSync(nightScriptPy)) {
    try {
      const res = spawnSync('python', [nightScriptPy, '--dry-run'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: 15000
      });
      if (res.status !== 0) {
        errors.push(`night_grow.py --dry-run failed with exit code ${res.status}: ${res.stderr || res.stdout}`);
      }
    } catch (e) {
      errors.push(`Failed to execute night_grow.py: ${e.message}`);
    }
  } else {
    errors.push('Missing scripts/night-growth.js (or scripts/night_grow.py)');
  }

  // 2. 일일_야간작업_리포트.md
  const reportPath = path.join(PROJECT_ROOT, '일일_야간작업_리포트.md');
  if (!fs.existsSync(reportPath)) {
    errors.push('Missing 일일_야간작업_리포트.md');
  } else {
    const reportContent = fs.readFileSync(reportPath, 'utf8');
    if (!reportContent.includes('야간') && !reportContent.includes('증식') && !reportContent.includes('리포트')) {
      errors.push('일일_야간작업_리포트.md content invalid or empty');
    }
  }

  // 3. LAUNCH_GUIDE.md
  const guidePath = path.join(PROJECT_ROOT, 'LAUNCH_GUIDE.md');
  if (!fs.existsSync(guidePath)) {
    errors.push('Missing LAUNCH_GUIDE.md');
  } else {
    const guideContent = fs.readFileSync(guidePath, 'utf8');
    if (!guideContent.includes('배포') && !guideContent.includes('수익화')) {
      errors.push('LAUNCH_GUIDE.md missing essential deployment or monetization setup instructions');
    }
  }

  const passed = errors.length === 0;
  if (passed) {
    console.log(`  ✓ AC 4 PASS: Night growth routine executed cleanly with code 0, 일일_야간작업_리포트.md and LAUNCH_GUIDE.md verified`);
  } else {
    console.error(`  ✗ AC 4 FAIL: ${errors.length} error(s) found:`);
    errors.forEach(e => console.error(`    - ${e}`));
  }
  return { ac: 'AC 4', passed, errors };
}

async function main() {
  console.log('===============================================================');
  console.log('   MONEYFIT PORTAL - MASTER ACCEPTANCE CRITERIA VERIFIER       ');
  console.log('===============================================================');

  const args = process.argv.slice(2);
  const onlyAc1 = args.includes('--ac1');

  const r1 = await verifyAC1();
  let r2 = { ac: 'AC 2', passed: false, errors: ['Skipped'] };
  let r3 = { ac: 'AC 3', passed: false, errors: ['Skipped'] };
  let r4 = { ac: 'AC 4', passed: false, errors: ['Skipped'] };

  if (!onlyAc1) {
    r2 = verifyAC2();
    r3 = verifyAC3();
    r4 = verifyAC4();
  }

  const results = [r1, r2, r3, r4];
  const allPassed = onlyAc1 ? r1.passed : (r1.passed && r2.passed && r3.passed && r4.passed);

  console.log('\n===============================================================');
  console.log('                 ACCEPTANCE CRITERIA SUMMARY                   ');
  console.log('===============================================================');
  for (const r of results) {
    const status = r.passed ? '✓ PASSED' : (r.errors[0] === 'Skipped' ? '○ SKIPPED' : '✗ FAILED');
    const errCount = r.passed ? '' : (r.errors[0] === 'Skipped' ? '' : ` (${r.errors.length} errors)`);
    console.log(`  ${r.ac.padEnd(8, ' ')} : ${status}${errCount}`);
  }
  console.log('===============================================================');

  if (allPassed) {
    console.log('🎉 ALL ACCEPTANCE CRITERIA PASSED PROGRAMMATIC VERIFICATION!');
    process.exit(0);
  } else {
    console.log('⚠️ Programmatic verification finished. Some criteria pending or failed.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
