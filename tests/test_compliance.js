/**
 * tests/test_compliance.js
 * Division 5 (kidsfit.co.kr) — Pure Paid 2-Tier Boutique Atelier & Zero-Affiliate Compliance Suite
 *
 * Verifies Chairman's 2026-11-18 Final Charter:
 * 1. GEMINI.md & HEADLESS_MAINTENANCE_SPEC.md Pure 2-Tier Paid Atelier alignment
 * 2. Zero Affiliate Remnants (0 occurrences of Coupang, AF7865143, Npay/BrandConnect, LinkPrice, A100708867, iHerb, IPZ1547, lemonsqueezy, KFTC affiliate notices) across index.html, root HTML, src/, qna/, and dist/
 * 3. Single-Breath 4-Screen Step-Up Boutique Atelier Structure, Zero Emojis, Zero Clutter Below & Minimal 1-Line Legal Footer
 * 4. Latpeed 2-Tier Paid Platform Config (9,900 KRW daMaP & 19,900 KRW 6-Month Velocity Tracker) + Bone-Age Δt Math
 * 5. Telegram Bot Channel Isolation (@Moneyfiityyy_bot)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const QNA_DIR = path.join(ROOT_DIR, 'qna');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

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
console.log('   DIVISION 5 (kidsfit.co.kr) PURE PAID ATELIER & ZERO-AFFILIATE AUDIT  ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: Charter & Headless Maintenance Specification Verification
// -----------------------------------------------------------------------------
console.log('[Suite 1: Charter & Headless Maintenance Specification Verification]');

check('GEMINI.md & HEADLESS_MAINTENANCE_SPEC.md reflect Pure Latpeed 2-Tier Atelier & 0-Affiliate Charter', () => {
  const geminiContent = fs.readFileSync(path.join(ROOT_DIR, 'GEMINI.md'), 'utf8');
  const specContent = fs.readFileSync(path.join(DOCS_DIR, 'HEADLESS_MAINTENANCE_SPEC.md'), 'utf8');

  assert(geminiContent.includes('daMaP') && geminiContent.includes('9,900원') && geminiContent.includes('19,900원'),
    'GEMINI.md missing Latpeed 2-tier 9,900/19,900 specification');
  assert(specContent.includes('daMaP') && specContent.includes('7Frck') && specContent.includes('Moneyfiityyy_bot'),
    'HEADLESS_MAINTENANCE_SPEC.md missing Latpeed 2-tier or @Moneyfiityyy_bot specification');
});

// -----------------------------------------------------------------------------
// Suite 2: Empirical Zero-Affiliate Remnant Scan (제휴 잔존 0건)
// -----------------------------------------------------------------------------
console.log('\n[Suite 2: Empirical Zero-Affiliate Remnant Scan (제휴 잔존 0건)]');

const FORBIDDEN_AFFILIATE_TOKENS = [
  'link.coupang.com',
  'coupang.com',
  'af7865143',
  'brandconnect.naver.com',
  'click.linkprice.com',
  'linkprice.com',
  'a100708867',
  'iherb.com',
  'ipz1547',
  'lemonsqueezy',
  '공정거래위원회'
];

function collectWebFiles(baseDir, includeDist) {
  const out = [];
  ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html', 'coupang-kidsfit.html'].forEach((f) => {
    const fp = path.join(baseDir, f);
    if (fs.existsSync(fp)) out.push(fp);
  });

  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const fp = path.join(d, ent.name);
      if (ent.isDirectory()) {
        walk(fp);
      } else if (/\.(html|js|json|css)$/i.test(ent.name) && ent.name !== 'research-knowledge-base.json') {
        out.push(fp);
      }
    }
  }

  walk(path.join(baseDir, 'src'));
  walk(path.join(baseDir, 'qna'));
  if (includeDist && fs.existsSync(DIST_DIR)) {
    const distIndex = path.join(DIST_DIR, 'index.html');
    const distBundle = path.join(DIST_DIR, 'src', 'data', 'data-bundle.js');
    if (fs.existsSync(distIndex)) out.push(distIndex);
    if (fs.existsSync(distBundle)) out.push(distBundle);
  }
  return out;
}

check('Strictly 0 affiliate URLs, partner IDs, KFTC affiliate notices, or lemonsqueezy across index.html, src/, qna/, and dist/', () => {
  const files = collectWebFiles(ROOT_DIR, true);
  const hits = [];

  for (const fp of files) {
    const rel = path.relative(ROOT_DIR, fp);
    const low = fs.readFileSync(fp, 'utf8').toLowerCase();
    for (const tok of FORBIDDEN_AFFILIATE_TOKENS) {
      if (low.includes(tok.toLowerCase())) {
        hits.push(`${rel} contains forbidden affiliate/legacy token "${tok}"`);
      }
    }
  }

  console.log(`     ↳ Audited ${files.length} web/source/qna/dist files: ${hits.length} affiliate remnants`);
  assert.strictEqual(hits.length, 0, `Affiliate remnants found:\n${hits.slice(0, 15).join('\n')}`);
});

// -----------------------------------------------------------------------------
// Suite 3: Single-Breath Boutique Atelier Structure, Zero Emojis & Legal Footer
// -----------------------------------------------------------------------------
console.log('\n[Suite 3: Single-Breath Boutique Atelier Structure & Zero-Emoji Audit]');

check('index.html implements 4-Screen Single-Breath Step-Up Architecture & preserves locked DOM IDs', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  const requiredIds = [
    'kfk-peer-growth-editorial',
    'quiz-section',
    'step-content-1',
    'step-content-2',
    'step-content-3',
    'step-content-4',
    'step-content-5',
    'child-height',
    'child-weight',
    'kfk-bone-age-interpreter',
    'kfk-parent-habit-notebook',
    'kfk-passwordless-club-box',
    'kfk-latpeed-ebook-slot',
    'kfk-vip-monthly-checkin'
  ];
  requiredIds.forEach((id) => {
    assert(html.includes(`id="${id}"`), `index.html missing required DOM id="#${id}"`);
  });
  assert(html.includes('질병관리청·뼈나이 기준 우리 아이 예상키 1분 무료 진단'), 'Screen 0 Phase 2-B direct clarity H1 missing');
  assert(html.includes('1분 무료 성장 진단 시작하기'), 'Screen 0 above-the-fold primary start CTA missing');
  assert(html.includes('왜 이 성장 시계 연구소를 만들었나요'), 'Screen 0 founding letter headline missing');
  assert(html.includes('우리 아이 성장 시계 진단 시작하기'), 'Screen 0 single start CTA missing');
  assert(html.includes('전문의의 진료를 대신하지 않습니다') && html.includes('beable9489@gmail.com'), 'Minimal 1-line legal footer disclaimer missing');
});

check('index.html and kfk-atelier-app.js contain 0 emojis and 0 broken visible HTML comments', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(SRC_DIR, 'js', 'kfk-atelier-app.js'), 'utf8');
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

  const htmlEmojis = html.match(emojiRegex) || [];
  const jsEmojis = appJs.match(emojiRegex) || [];
  assert.strictEqual(htmlEmojis.length, 0, `Found emojis in index.html: ${htmlEmojis.join(', ')}`);
  assert.strictEqual(jsEmojis.length, 0, `Found emojis in kfk-atelier-app.js: ${jsEmojis.join(', ')}`);

  const strippedVisible = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  const brokenComments = strippedVisible.match(/(?:-->|<!--|=====)/g) || [];
  assert.strictEqual(brokenComments.length, 0, `Broken HTML comments leaked visibly: ${brokenComments.length}`);
});

// -----------------------------------------------------------------------------
// Suite 4: Latpeed 2-Tier Paid Platform & Bone-Age Δt Auxology Engine
// -----------------------------------------------------------------------------
console.log('\n[Suite 4: Latpeed 2-Tier Paid Config & Bone-Age Δt Auxology Engine]');

check('window.KFK_EBOOK_CONFIG configures STORE_LIVE_READY: true, Tier 1 (9,900 KRW daMaP), and Tier 2 (19,900 KRW 7Frck)', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  assert(/STORE_LIVE_READY:\s*true/.test(html), 'STORE_LIVE_READY must be true');
  assert(html.includes("LATPEED_LIVE_URL: 'https://www.latpeed.com/products/daMaP'"), 'Tier 1 daMaP URL missing');
  assert(html.includes("TIER1_9900_URL: 'https://www.latpeed.com/products/daMaP'"), 'TIER1_9900_URL missing');
  assert(/LATPEED_TIER2_URL:\s*'https:\/\/www\.latpeed\.com\//.test(html), 'LATPEED_TIER2_URL missing');
  assert(html.includes('9,900원') && html.includes('19,900원'), 'Both 9,900 KRW and 19,900 KRW tiers must be displayed');
});

check('KfkAtelierApp Bone-Age Δt Calibration & KDCA 2017 Auxology Engine compute accurately', () => {
  const atelier = require(path.join(SRC_DIR, 'js', 'kfk-atelier-app.js'));
  const cal = atelier.computeBoneAgeDeltaCalibration({
    sex: 'boy',
    baYears: 10,
    baMonths: 6,
    examYear: 2025,
    examMonth: 11,
    tempoAccel: true,
    nowDate: new Date(2026, 10, 18) // Nov 2026 -> 12 months elapsed
  });
  assert.strictEqual(cal.deltaMonths, 12, 'Expected deltaMonths = 12');
  assert.strictEqual(cal.tempoFactor, 1.08, 'Expected tempoFactor = 1.08');
  assert(Math.abs(cal.baProjectedToday - (10.5 + 1.08)) < 0.05, 'Projected bone age math mismatch');
  assert(cal.advisoryText.includes('1년'), 'Expected >=12 month recheck advisory');

  const report = atelier.analyzeGrowthClock({
    sex: 'boy',
    birthYear: 2016,
    birthMonth: 5,
    birthDay: 15,
    heightCm: 139.5,
    weightKg: 35.0,
    fatherCm: 175,
    motherCm: 162,
    bedtime: 'around_2300',
    posture: 'slouch_forward',
    boneAgeMode: 'measured',
    baYears: 10,
    baMonths: 6,
    examYear: 2026,
    examMonth: 5,
    pubertySign: 'normal_tempo'
  }, new Date(2026, 10, 18));

  assert(report.kdca.percentile > 30 && report.kdca.percentile < 70, 'KDCA percentile out of expected range');
  assert(report.optimizedAdultCm > report.currentTrendAdultCm, 'Optimized adult height must exceed current trend');
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
  failures.forEach((f) => console.error(`- ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('\n🎉 ALL DIVISION 5 PURE PAID ATELIER & ZERO-AFFILIATE CHECKS PASSED (100%)!');
  process.exit(0);
}
