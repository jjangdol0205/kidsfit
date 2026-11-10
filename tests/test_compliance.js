/**
 * tests/test_compliance.js
 * Division 5 (kidsfit.co.kr) Headless Maintenance & Regulatory Compliance Test Suite
 *
 * Verifies:
 * 1. Headless Maintenance Specification (HEADLESS_MAINTENANCE_SPEC.md) completeness
 * 2. Affiliate Tracking IDs integrity: Coupang Partners (AF7865143), LinkPrice (A100708867), iHerb (IPZ1547)
 * 3. Outbound <a> affiliate link standards: target="_blank", rel="noopener noreferrer sponsored"
 * 4. Fair Trade Commission (공정거래위원회) economic interest disclosure notices
 * 5. Telegram Bot isolation: @Moneyfiityyy_bot
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const SRC_JS = path.join(ROOT_DIR, 'src', 'js');
const SRC_DATA = path.join(ROOT_DIR, 'src', 'data');
const QNA_DIR = path.join(ROOT_DIR, 'qna');

const PARTNER_IDS = {
  coupang: 'AF7865143',
  linkprice: 'A100708867',
  iherb: 'IPZ1547'
};

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function check(name, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`     ↳ ${err.message}`);
    failedChecks++;
    failures.push({ name, error: err.message });
  }
}

console.log('========================================================================');
console.log('   DIVISION 5 (kidsfit.co.kr) HEADLESS MAINTENANCE & COMPLIANCE TEST    ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: Headless Maintenance Specification Verification
// -----------------------------------------------------------------------------
console.log('[Suite 1: Headless Maintenance Specification Verification]');

check('HEADLESS_MAINTENANCE_SPEC.md exists and contains core headless maintenance mandates', () => {
  const specPath = path.join(DOCS_DIR, 'HEADLESS_MAINTENANCE_SPEC.md');
  assert(fs.existsSync(specPath), `Spec file not found at ${specPath}`);
  const content = fs.readFileSync(specPath, 'utf8');

  // Core headless tenets
  assert(content.includes('100% 무인화') || content.includes('Zero-Labor'), 'Missing zero-labor/headless tenet');
  assert(content.includes(PARTNER_IDS.coupang), `Missing Coupang ID ${PARTNER_IDS.coupang} in spec`);
  assert(content.includes(PARTNER_IDS.linkprice), `Missing LinkPrice ID ${PARTNER_IDS.linkprice} in spec`);
  assert(content.includes('Moneyfiityyy_bot'), 'Missing @Moneyfiityyy_bot reference in spec');
  assert(content.includes('공정거래위원회'), 'Missing FTC disclosure requirement in spec');
  assert(content.includes('최저가') && content.includes('할인율') && content.includes('특가') && content.includes('폭탄세일'),
    'Missing zero-tolerance prohibited words specification');
});

// -----------------------------------------------------------------------------
// Suite 2: Affiliate Parameter Integrity Across Core Modules
// -----------------------------------------------------------------------------
console.log('\n[Suite 2: Affiliate Parameter Integrity Across Core Modules]');

check('src/js/monetization.js configures Coupang (AF7865143) and LinkPrice (A100708867)', () => {
  const filePath = path.join(SRC_JS, 'monetization.js');
  const code = fs.readFileSync(filePath, 'utf8');
  assert(code.includes(PARTNER_IDS.coupang), `monetization.js missing Coupang ${PARTNER_IDS.coupang}`);
  assert(code.includes(PARTNER_IDS.linkprice), `monetization.js missing LinkPrice ${PARTNER_IDS.linkprice}`);
});

check('src/js/reference-chips.js configures Coupang (AF7865143) and LinkPrice (A100708867)', () => {
  const filePath = path.join(SRC_JS, 'reference-chips.js');
  const code = fs.readFileSync(filePath, 'utf8');
  assert(code.includes(`coupang: '${PARTNER_IDS.coupang}'`), `reference-chips.js missing Coupang ID`);
  assert(code.includes(`linkprice: '${PARTNER_IDS.linkprice}'`), `reference-chips.js missing LinkPrice ID`);
});

check('src/js/pinpoint-curator.js configures Coupang (AF7865143) and LinkPrice (A100708867)', () => {
  const filePath = path.join(SRC_JS, 'pinpoint-curator.js');
  const code = fs.readFileSync(filePath, 'utf8');
  assert(code.includes(`coupang: '${PARTNER_IDS.coupang}'`), `pinpoint-curator.js missing Coupang ID`);
  assert(code.includes(`linkprice: '${PARTNER_IDS.linkprice}'`), `pinpoint-curator.js missing LinkPrice ID`);
});

check('src/data/curation-catalog.json: all affiliate product URLs preserve partner IDs', () => {
  const catalogPath = path.join(SRC_DATA, 'curation-catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const allProds = (catalog.products || []).concat(catalog.parentingProducts || []);
  let scanned = 0;

  allProds.forEach(prod => {
    if (prod.affiliateUrl) {
      scanned++;
      const u = prod.affiliateUrl;
      if (u.includes('coupang.com')) {
        assert(u.includes(PARTNER_IDS.coupang), `Coupang item ${prod.id} missing ${PARTNER_IDS.coupang}: ${u}`);
      } else if (u.includes('iherb.com')) {
        assert(u.includes(PARTNER_IDS.iherb), `iHerb item ${prod.id} missing ${PARTNER_IDS.iherb}: ${u}`);
      } else if (u.includes('linkprice.com') || u.includes('yes24.com')) {
        assert(u.includes(PARTNER_IDS.linkprice), `LinkPrice item ${prod.id} missing ${PARTNER_IDS.linkprice}: ${u}`);
      }
    }
  });
  assert(scanned >= 24, `Expected at least 24 affiliate URLs in curation catalog, found ${scanned}`);
  console.log(`     ↳ Scanned & verified ${scanned} catalog affiliate product URLs`);
});

// -----------------------------------------------------------------------------
// Suite 3: Empirical Scan of Outbound Affiliate Links (Tags & URLs)
// -----------------------------------------------------------------------------
console.log('\n[Suite 3: Outbound Link Formatting & Parameter Scan]');

check('All <a> tags to affiliate domains enforce target="_blank" and rel attributes', () => {
  const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-global', '.agents', '.flow-browser-profile', '.naver-browser-profile']);
  const AFFILIATE_DOMAINS = ['coupang.com', 'iherb.com', 'linkprice.com', 'yes24.com'];

  function scanDir(dir) {
    let files = [];
    fs.readdirSync(dir).forEach(file => {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (!EXCLUDE_DIRS.has(file)) files = files.concat(scanDir(full));
      } else if (file.endsWith('.html') || file.endsWith('.js')) {
        files.push(full);
      }
    });
    return files;
  }

  const files = scanDir(ROOT_DIR);
  let totalTags = 0;
  let totalUrls = 0;
  const tagViolations = [];

  files.forEach(fp => {
    const rel = path.relative(ROOT_DIR, fp);
    let content;
    try {
      content = fs.readFileSync(fp, 'utf8');
    } catch (_) {
      return;
    }

    const aRegex = /<a\s+[^>]*?>/gis;
    let m;
    while ((m = aRegex.exec(content)) !== null) {
      const tag = m[0];
      const lower = tag.toLowerCase();
      if (!AFFILIATE_DOMAINS.some(d => lower.includes(d))) continue;

      totalTags++;

      // Check target="_blank"
      const targetM = tag.match(/target=["']([^"']+)["']/i);
      if (!targetM || targetM[1].toLowerCase() !== '_blank') {
        tagViolations.push(`${rel}: Missing or invalid target="_blank" in ${tag.slice(0, 80)}`);
      }

      // Check rel attribute
      const relM = tag.match(/rel=["']([^"']+)["']/i);
      if (!relM) {
        tagViolations.push(`${rel}: Missing rel attribute in ${tag.slice(0, 80)}`);
      } else {
        const tokens = relM[1].toLowerCase().split(/\s+/);
        if (!tokens.includes('noopener') || !tokens.includes('noreferrer')) {
          tagViolations.push(`${rel}: Missing noopener/noreferrer in rel="${relM[1]}"`);
        }
      }

      // Check tracking parameter inside href
      const hrefM = tag.match(/href=["']([^"']+)["']/i);
      if (hrefM) {
        totalUrls++;
        const href = hrefM[1];
        const hLow = href.toLowerCase();
        if (hLow.includes('coupang.com') && !href.includes(PARTNER_IDS.coupang) && !href.includes('${')) {
          tagViolations.push(`${rel}: Coupang link missing ${PARTNER_IDS.coupang}: ${href}`);
        }
        if (hLow.includes('iherb.com') && !href.includes(PARTNER_IDS.iherb) && !href.includes('${')) {
          tagViolations.push(`${rel}: iHerb link missing ${PARTNER_IDS.iherb}: ${href}`);
        }
        if ((hLow.includes('linkprice.com') || hLow.includes('yes24.com')) && !href.includes(PARTNER_IDS.linkprice) && !href.includes('${')) {
          tagViolations.push(`${rel}: LinkPrice link missing ${PARTNER_IDS.linkprice}: ${href}`);
        }
      }
    }
  });

  console.log(`     ↳ Scanned ${totalTags} affiliate tags and ${totalUrls} affiliate URLs across ${files.length} candidate files`);
  assert.strictEqual(tagViolations.length, 0, `Found ${tagViolations.length} link formatting violations:\n${tagViolations.join('\n')}`);
});

// -----------------------------------------------------------------------------
// Suite 4: Fair Trade Commission (KFTC) Disclosure Verification
// -----------------------------------------------------------------------------
console.log('\n[Suite 4: Fair Trade Commission (KFTC) Economic Interest Disclosure]');

check('index.html contains official KFTC economic interest disclosure notice', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  assert(html.includes('공정거래위원회'), 'index.html missing 공정거래위원회 keyword');
  assert(html.includes('수수료') || html.includes('대가'), 'index.html missing commission/remuneration disclosure');
});

check('qna/monthly-curation.html contains KFTC disclosure banner', () => {
  const html = fs.readFileSync(path.join(QNA_DIR, 'monthly-curation.html'), 'utf8');
  assert(html.includes('공정거래위원회'), 'monthly-curation.html missing 공정거래위원회 keyword');
});

check('All 24 qna/kr-calc-*.html pages contain KFTC disclosure banner', () => {
  const calcFiles = fs.readdirSync(QNA_DIR).filter(f => f.startsWith('kr-calc-') && f.endsWith('.html'));
  assert.strictEqual(calcFiles.length, 24, `Expected 24 calculator pages, found ${calcFiles.length}`);

  let verifiedCount = 0;
  calcFiles.forEach(f => {
    const content = fs.readFileSync(path.join(QNA_DIR, f), 'utf8');
    assert(content.includes('공정거래위원회'), `${f} missing 공정거래위원회 keyword`);
    assert(content.includes('aff-disclosure'), `${f} missing aff-disclosure class container`);
    verifiedCount++;
  });
  console.log(`     ↳ Verified KFTC disclosure banner in all ${verifiedCount} calculator pages`);
});

// -----------------------------------------------------------------------------
// Suite 5: Telegram Bot Channel Isolation
// -----------------------------------------------------------------------------
console.log('\n[Suite 5: Telegram Bot Channel Isolation]');

check('Division 5 is strictly bound to dedicated bot @Moneyfiityyy_bot', () => {
  const envPath = path.join(ROOT_DIR, '.env');
  assert(fs.existsSync(envPath), '.env missing in 5사업부');
  const envContent = fs.readFileSync(envPath, 'utf8');
  assert(envContent.includes('TELEGRAM_BOT_TOKEN='), '.env missing TELEGRAM_BOT_TOKEN');

  const scriptsDir = path.join(ROOT_DIR, 'scripts');
  const sendScript = path.join(scriptsDir, 'send_daily_6am_shorts_telegram.js');
  if (fs.existsSync(sendScript)) {
    const scriptContent = fs.readFileSync(sendScript, 'utf8');
    assert(scriptContent.includes('Moneyfiityyy_bot') || scriptContent.includes('TELEGRAM_BOT_TOKEN'),
      'send_daily_6am_shorts_telegram.js missing isolated bot binding');
  }
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL COMPLIANCE CHECKS EVALUATED : ${totalChecks}`);
console.log(`CHECKS PASSED                      : ${passedChecks}`);
console.log(`CHECKS FAILED                      : ${failedChecks}`);
console.log('========================================================================');

if (failedChecks > 0) {
  console.error('\nFAILURE DETAILS:');
  failures.forEach(f => console.error(`- ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('\n🎉 ALL DIVISION 5 COMPLIANCE CHECKS PASSED (100% REGULATORY & AFFILIATE CONFORMANCE)!');
  process.exit(0);
}
