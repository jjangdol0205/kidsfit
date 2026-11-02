/**
 * tests/telegram-bridge.test.js
 * Verification suite for Milestone M4: Dedicated Telegram Bot Bridge for English Workspace
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const NOTIFY_SCRIPT = path.join(ROOT_DIR, 'scripts', 'telegram-notify.js');
const BRIDGE_SCRIPT = path.join(ROOT_DIR, 'scripts', 'telegram-antigravity-bridge.js');

const EXPECTED_BOT_TOKEN = '8884379894:AAEEyfqtYTc4fRMmySZhjHUAU1ji5Vh5KRw';
const EXPECTED_CHAT_ID = '755033799';
const EXPECTED_CONVERSATION_ID = '278ac9cd-25e2-4d75-93ae-f407a1e6de5d';
const EXPECTED_BOT_USERNAME = 'kidsfittbot';
const EXPECTED_SITE_URL = 'https://kisfitglobal.com';

const EXPECTED_LEMON_KEYS = [
  'LEMONSQUEEZY_STORE_ID',
  'LEMONSQUEEZY_ACCOUNT_HOLDER',
  'LEMONSQUEEZY_SINGLE_PRODUCT_ID',
  'LEMONSQUEEZY_SINGLE_PASS_URL',
  'LEMONSQUEEZY_TRACKER_PRODUCT_ID',
  'LEMONSQUEEZY_TRACKER_PASS_URL',
  'LEMONSQUEEZY_WEBHOOK_ID',
  'LEMONSQUEEZY_WEBHOOK_SECRET',
  'LEMONSQUEEZY_API_KEY'
];

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  });
  return env;
}

function fetchTelegramGetMe(token) {
  return new Promise((resolve, reject) => {
    https
      .get(`https://api.telegram.org/bot${token}/getMe`, res => {
        let raw = '';
        res.on('data', chunk => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            resolve({ statusCode: res.statusCode, body: parsed });
          } catch (e) {
            reject(new Error(`Failed to parse Telegram API response: ${e.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

async function runTelegramBridgeTests() {
  console.log('====================================================');
  console.log('   Milestone M4: Telegram Bot Bridge Test Suite');
  console.log('====================================================');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  console.log('\n[Section 1: .env Configuration & Lemon Squeezy Preservation]');
  const env = parseEnv(ENV_PATH);

  test('TELEGRAM_BOT_TOKEN matches exact English bot token', () => {
    assert.strictEqual(env.TELEGRAM_BOT_TOKEN, EXPECTED_BOT_TOKEN);
  });

  test('TELEGRAM_CHAT_ID matches exact authorized chat ID', () => {
    assert.strictEqual(env.TELEGRAM_CHAT_ID, EXPECTED_CHAT_ID);
  });

  test('ANTIGRAVITY_CONVERSATION_ID matches exact English conversation ID', () => {
    assert.strictEqual(env.ANTIGRAVITY_CONVERSATION_ID, EXPECTED_CONVERSATION_ID);
  });

  test('All 9 LEMONSQUEEZY_* environment variables are preserved intact', () => {
    EXPECTED_LEMON_KEYS.forEach(k => {
      assert.ok(env[k], `Missing Lemon Squeezy key: ${k}`);
      assert.ok(String(env[k]).length > 0, `Empty Lemon Squeezy key: ${k}`);
    });
  });

  console.log('\n[Section 2: scripts/telegram-notify.js Configuration]');
  const notifyModule = require(NOTIFY_SCRIPT);

  test('getTelegramConfig() loads botToken and chatId from .env correctly', () => {
    const cfg = notifyModule.getTelegramConfig();
    assert.strictEqual(cfg.botToken, EXPECTED_BOT_TOKEN);
    assert.strictEqual(cfg.chatId, EXPECTED_CHAT_ID);
    assert.strictEqual(cfg.conversationId, EXPECTED_CONVERSATION_ID);
    assert.strictEqual(cfg.isConfigured, true);
  });

  test('Default site URL is https://kisfitglobal.com', () => {
    const cfg = notifyModule.getTelegramConfig();
    assert.strictEqual(cfg.siteUrl, EXPECTED_SITE_URL);
  });

  console.log('\n[Section 3: scripts/telegram-antigravity-bridge.js Configuration & R5 Guards]');
  const bridgeContent = fs.readFileSync(BRIDGE_SCRIPT, 'utf8');

  test('DEFAULT_CONVERSATION_ID is set to 278ac9cd-25e2-4d75-93ae-f407a1e6de5d', () => {
    const match = bridgeContent.match(/const\s+DEFAULT_CONVERSATION_ID\s*=\s*['"]([^'"]+)['"]/);
    assert.ok(match, 'DEFAULT_CONVERSATION_ID declaration not found');
    assert.strictEqual(match[1], EXPECTED_CONVERSATION_ID);
  });

  test('Workspace path in prompt template points to d:\\키즈핏 영문 (not d:\\사업아이템)', () => {
    assert.ok(
      bridgeContent.includes('d:\\\\키즈핏 영문') || bridgeContent.includes('d:\\키즈핏 영문'),
      'Missing English workspace path in bridge script'
    );
    assert.strictEqual(
      bridgeContent.includes('d:\\\\사업아이템') || bridgeContent.includes('d:\\사업아이템'),
      false,
      'Found unexpected legacy d:\\사업아이템 path in bridge script'
    );
  });

  test('R5 compliance: git push is strictly guarded/disabled across bridge script', () => {
    const hasActiveGitPush = /spawnSync\s*\(\s*['"]git['"]\s*,\s*\[[^\]]*['"]push['"][^\]]*\]/i.test(bridgeContent);
    assert.strictEqual(hasActiveGitPush, false, 'Active git push found in bridge script! R5 violation.');
  });

  console.log('\n[Section 4: Live Telegram API getMe Verification]');
  await testAsync('Telegram API getMe returns ok: true and username kidsfittbot', async () => {
    const res = await fetchTelegramGetMe(EXPECTED_BOT_TOKEN);
    assert.strictEqual(res.statusCode, 200, `Expected HTTP 200, got ${res.statusCode}`);
    assert.strictEqual(res.body.ok, true, `Expected ok: true, got ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body.result && res.body.result.username, EXPECTED_BOT_USERNAME);
  });

  console.log('\n====================================================');
  console.log(`Milestone M4 Summary: ${passed}/${total} checks passed cleanly.`);
  console.log('====================================================');
}

if (require.main === module) {
  runTelegramBridgeTests().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  });
}

module.exports = { runTelegramBridgeTests };
