/**
 * tests/global-english-lemonsqueezy.test.js
 * Verification Suite for Milestone M2: Global English Default & Lemon Squeezy Integration
 * Workspace: d:\키즈핏 영문 (kisfitglobal.com)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`     ↳ ${err.message}`);
    failedTests++;
  }
}

console.log('====================================================================');
console.log('   MILESTONE M2: GLOBAL ENGLISH DEFAULT & LEMON SQUEEZY VERIFICATION');
console.log('====================================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: CNAME & Canonical Domain Metadata
// -----------------------------------------------------------------------------
console.log('--- Suite 1: CNAME & Canonical Domain Metadata ---');

test('root CNAME exists and contains kisfitglobal.com', () => {
  const cnamePath = path.join(ROOT_DIR, 'CNAME');
  assert.ok(fs.existsSync(cnamePath), 'Missing root CNAME file');
  const cname = fs.readFileSync(cnamePath, 'utf8').trim();
  assert.strictEqual(cname, 'kisfitglobal.com');
});

test('dist/CNAME exists and contains kisfitglobal.com', () => {
  const distCnamePath = path.join(ROOT_DIR, 'dist', 'CNAME');
  assert.ok(fs.existsSync(distCnamePath), 'Missing dist/CNAME file');
  const cname = fs.readFileSync(distCnamePath, 'utf8').trim();
  assert.strictEqual(cname, 'kisfitglobal.com');
});

// -----------------------------------------------------------------------------
// Suite 2: HTML Default Global English & Paywall Mode
// -----------------------------------------------------------------------------
console.log('\n--- Suite 2: HTML Default Global English & Paywall Mode ---');

const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const distHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'index.html'), 'utf8');

test('index.html root tag has lang="en" or lang="en-US", data-theme="light", and data-edition="global-paid"', () => {
  assert.ok(
    indexHtml.includes('<html lang="en" data-theme="light" data-edition="global-paid">') ||
    indexHtml.includes('<html lang="en-US" data-theme="light" data-edition="global-paid">'),
    'index.html does not contain <html lang="en" data-theme="light" data-edition="global-paid">'
  );
});

test('dist/index.html root tag has lang="en" or lang="en-US", data-theme="light", and data-edition="global-paid"', () => {
  assert.ok(
    distHtml.includes('<html lang="en" data-theme="light" data-edition="global-paid">') ||
    distHtml.includes('<html lang="en-US" data-theme="light" data-edition="global-paid">'),
    'dist/index.html does not contain <html lang="en" data-theme="light" data-edition="global-paid">'
  );
});

test('index.html head unconditionally sets __KIDSFIT_GLOBAL_PAID_EDITION and documentElement.lang = en by default', () => {
  assert.ok(indexHtml.includes('window.__KIDSFIT_GLOBAL_PAID_EDITION = true;'));
  assert.ok(indexHtml.includes("document.documentElement.lang = 'en';"));
  assert.ok(indexHtml.includes("document.documentElement.setAttribute('data-edition', 'global-paid');"));
});

test('dist/index.html head unconditionally sets __KIDSFIT_GLOBAL_PAID_EDITION and documentElement.lang = en by default', () => {
  assert.ok(distHtml.includes('window.__KIDSFIT_GLOBAL_PAID_EDITION = true;'));
  assert.ok(distHtml.includes("document.documentElement.lang = 'en';"));
  assert.ok(distHtml.includes("document.documentElement.setAttribute('data-edition', 'global-paid');"));
});

test('index.html and dist/index.html contain canonical link to https://kisfitglobal.com/', () => {
  assert.ok(indexHtml.includes('<link rel="canonical" href="https://kisfitglobal.com/">'));
  assert.ok(distHtml.includes('<link rel="canonical" href="https://kisfitglobal.com/">'));
});

test('index.html loads src/js/global-paywall-edition.js via defer script tag', () => {
  assert.ok(/src\/js\/global-paywall-edition\.js/i.test(indexHtml));
  assert.ok(/src\/js\/global-paywall-edition\.js/i.test(distHtml));
});

// -----------------------------------------------------------------------------
// Suite 3: Global Paywall Edition Engine (Startup Evaluation)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 3: Global Paywall Edition Engine ---');

const paywallEngine = require(path.join(ROOT_DIR, 'src', 'js', 'global-paywall-edition.js'));

test('isGlobalPaidEdition evaluates to true by default on startup without URL query parameters', () => {
  assert.strictEqual(typeof paywallEngine.isGlobalPaidEdition, 'function');
  const isDefault = paywallEngine.isGlobalPaidEdition();
  assert.strictEqual(isDefault, true, 'isGlobalPaidEdition() did not evaluate to true by default');
});

test('getActiveCheckoutUrl returns valid Lemon Squeezy checkout URLs for single and pass plans', () => {
  const singleUrl = paywallEngine.getActiveCheckoutUrl('single');
  const passUrl = paywallEngine.getActiveCheckoutUrl('pass');
  assert.ok(singleUrl.includes('truthofmarket.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599'));
  assert.ok(passUrl.includes('truthofmarket.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895'));
});

// -----------------------------------------------------------------------------
// Suite 4: i18n Engine Active Language Default
// -----------------------------------------------------------------------------
console.log('\n--- Suite 4: i18n Engine Active Language Default ---');

const i18n = require(path.join(ROOT_DIR, 'src', 'js', 'i18n.js'));

test('i18n engine default active language is English ("en")', () => {
  assert.strictEqual(typeof i18n.getLanguage, 'function');
  assert.strictEqual(i18n.getLanguage(), 'en');
});

test('i18n engine default unit system is imperial ("imperial")', () => {
  assert.strictEqual(typeof i18n.getUnitSystem, 'function');
  assert.strictEqual(i18n.getUnitSystem(), 'imperial');
});

// -----------------------------------------------------------------------------
// Suite 5: Lemon Squeezy Integration (.env, server endpoints, logs)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 5: Lemon Squeezy Integration ---');

test('.env exists and contains all 9 required LEMONSQUEEZY_* configuration keys', () => {
  const envPath = path.join(ROOT_DIR, '.env');
  assert.ok(fs.existsSync(envPath), 'Missing .env file');
  const envContent = fs.readFileSync(envPath, 'utf8');

  const requiredKeys = [
    'LEMONSQUEEZY_STORE_ID=296100',
    'LEMONSQUEEZY_ACCOUNT_HOLDER',
    'LEMONSQUEEZY_SINGLE_PRODUCT_ID=1468224',
    'LEMONSQUEEZY_SINGLE_PASS_URL',
    'LEMONSQUEEZY_TRACKER_PRODUCT_ID=1468243',
    'LEMONSQUEEZY_TRACKER_PASS_URL',
    'LEMONSQUEEZY_WEBHOOK_ID=145796',
    'LEMONSQUEEZY_WEBHOOK_SECRET',
    'LEMONSQUEEZY_API_KEY'
  ];

  requiredKeys.forEach((keyPattern) => {
    assert.ok(envContent.includes(keyPattern), `Missing required key pattern in .env: ${keyPattern}`);
  });
});

test('server.js defines /api/lemonsqueezy-config endpoint returning Store #296100 details', () => {
  const serverPath = path.join(ROOT_DIR, 'server.js');
  assert.ok(fs.existsSync(serverPath), 'Missing server.js file');
  const serverCode = fs.readFileSync(serverPath, 'utf8');

  assert.ok(serverCode.includes("pathname === '/api/lemonsqueezy-config'"));
  assert.ok(serverCode.includes('296100'));
  assert.ok(serverCode.includes('truthofmarket.lemonsqueezy.com'));
});

test('server.js defines /api/lemonsqueezy-webhook endpoint with HMAC-SHA256 signature validation', () => {
  const serverCode = fs.readFileSync(path.join(ROOT_DIR, 'server.js'), 'utf8');
  assert.ok(serverCode.includes("pathname === '/api/lemonsqueezy-webhook'"));
  assert.ok(serverCode.includes("createHmac('sha256'"));
  assert.ok(serverCode.includes('lemonsqueezy_orders.jsonl'));
});

test('logs/lemonsqueezy_orders.jsonl exists and contains valid JSON entries', () => {
  const logPath = path.join(ROOT_DIR, 'logs', 'lemonsqueezy_orders.jsonl');
  assert.ok(fs.existsSync(logPath), 'Missing logs/lemonsqueezy_orders.jsonl');
  const content = fs.readFileSync(logPath, 'utf8').trim();
  assert.ok(content.length > 0, 'lemonsqueezy_orders.jsonl is empty');

  const lines = content.split('\n').filter(Boolean);
  lines.forEach((line, idx) => {
    try {
      const parsed = JSON.parse(line);
      assert.ok(parsed.timestamp, `Line ${idx + 1} missing timestamp`);
      assert.ok(parsed.eventName, `Line ${idx + 1} missing eventName`);
    } catch (e) {
      assert.fail(`Invalid JSON at line ${idx + 1} of lemonsqueezy_orders.jsonl: ${e.message}`);
    }
  });
});

// -----------------------------------------------------------------------------
// Suite 6: Exclusion of Korean Domestic Marketing Folders
// -----------------------------------------------------------------------------
console.log('\n--- Suite 6: Exclusion of Korean Domestic Marketing Folders ---');

test('strictly confirms zero Korean domestic marketing folders in English workspace', () => {
  const forbiddenFolders = [
    '네이버블로그_글모음',
    '네이버카페_글모음',
    '네이버클립_웹툰영상_모음',
    '웹툰_모음',
    '인스타_쓰레드_프로필_모음',
    '카드뉴스_모음'
  ];

  forbiddenFolders.forEach((folder) => {
    const fullPath = path.join(ROOT_DIR, folder);
    assert.strictEqual(
      fs.existsSync(fullPath),
      false,
      `Forbidden Korean marketing directory exists in English workspace: ${folder}`
    );
  });
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n====================================================================');
console.log(`Summary: ${passedTests}/${totalTests} tests passed.`);
console.log('====================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
