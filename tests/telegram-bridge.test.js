/**
 * tests/telegram-bridge.test.js
 * Verification suite for 5사업부 (KidsFit Korea — kidsfit.co.kr) Dedicated Telegram Bot (@Moneyfiityyy_bot)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const NOTIFY_SCRIPT = path.join(ROOT_DIR, 'scripts', 'telegram-notify.js');
const BRIDGE_SCRIPT = path.join(ROOT_DIR, 'scripts', 'telegram-antigravity-bridge.js');

const EXPECTED_BOT_PREFIX = '8874740009:';
const ALLOWED_CHAT_IDS = new Set(['-1003834697086', '755033799']);
const EXPECTED_OWNER_ID = '755033799';
const EXPECTED_DIV_CONVERSATION_ID = '73f230e4-d0b1-4732-b378-27fedb0c9c83';
const EXPECTED_HQ_CONVERSATION_ID = '73f230e4-d0b1-4732-b378-27fedb0c9c83';
const BLOCKED_PC_CONVERSATION_ID = 'dbc61f0a-76cb-48e3-b617-a616c069564c';
const EXPECTED_BOT_USERNAME = 'Moneyfiityyy_bot';
const EXPECTED_SITE_URL = 'https://kidsfit.co.kr';

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
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        port: 443,
        family: 4,
        path: `/bot${token}/getMe`,
        method: 'GET',
        timeout: 12000
      },
      res => {
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
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTelegramBridgeTests() {
  console.log('====================================================');
  console.log('   5사업부 (KidsFit Korea) Telegram Bridge Test Suite');
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

  console.log('\n[Section 1: .env Configuration & Channel Isolation]');
  const env = parseEnv(ENV_PATH);

  test('TELEGRAM_BOT_TOKEN matches 5사업부 @Moneyfiityyy_bot prefix', () => {
    assert.ok(String(env.TELEGRAM_BOT_TOKEN || '').startsWith(EXPECTED_BOT_PREFIX));
  });

  test('TELEGRAM_CHAT_ID and TELEGRAM_OWNER_USER_ID cover HQ group & Owner DM', () => {
    assert.ok(ALLOWED_CHAT_IDS.has(env.TELEGRAM_CHAT_ID));
    assert.strictEqual(env.TELEGRAM_OWNER_USER_ID, EXPECTED_OWNER_ID);
  });

  test('ANTIGRAVITY_CONVERSATION_ID and DIVISION_CONVERSATION_ID are live remote UUIDs (not PC direct)', () => {
    assert.strictEqual(env.ANTIGRAVITY_CONVERSATION_ID, EXPECTED_HQ_CONVERSATION_ID);
    assert.strictEqual(env.DIVISION_CONVERSATION_ID, EXPECTED_DIV_CONVERSATION_ID);
    assert.notStrictEqual(env.DIVISION_CONVERSATION_ID, BLOCKED_PC_CONVERSATION_ID);
  });

  console.log('\n[Section 2: scripts/telegram-notify.js Configuration]');
  const notifyModule = require(NOTIFY_SCRIPT);

  test('getTelegramConfig() loads botToken, chatId, ownerUserId, and dedicated conversationId', () => {
    const cfg = notifyModule.getTelegramConfig();
    assert.strictEqual(cfg.botToken, env.TELEGRAM_BOT_TOKEN);
    assert.ok(ALLOWED_CHAT_IDS.has(cfg.chatId));
    assert.strictEqual(cfg.ownerUserId, EXPECTED_OWNER_ID);
    assert.strictEqual(cfg.conversationId, EXPECTED_DIV_CONVERSATION_ID);
    assert.strictEqual(cfg.isConfigured, true);
  });

  test('Default site URL is https://kidsfit.co.kr and report header identifies 5사업부', () => {
    const cfg = notifyModule.getTelegramConfig();
    assert.strictEqual(cfg.siteUrl, EXPECTED_SITE_URL);
    const html = notifyModule.buildCompletionMessageHtml();
    assert.ok(html.includes('5사업부 KidsFit Korea'), 'Missing 5사업부 header in completion message');
    assert.ok(!html.includes('제3사업부'), 'Legacy 제3사업부 label must not appear');
  });

  console.log('\n[Section 3: scripts/telegram-antigravity-bridge.js Configuration & R5 Guards]');
  const bridgeContent = fs.readFileSync(BRIDGE_SCRIPT, 'utf8');

  test('DEFAULT_CONVERSATION_ID points to 5사업부 dedicated remote channel', () => {
    const match = bridgeContent.match(/const\s+DEFAULT_CONVERSATION_ID\s*=\s*['"]([^'"]+)['"]/);
    assert.ok(match, 'DEFAULT_CONVERSATION_ID declaration not found');
    assert.strictEqual(match[1], EXPECTED_DIV_CONVERSATION_ID);
  });

  test('Workspace path in prompt template points to D:\\드림컴퍼니\\5사업부 and yields to 5-Bot Hub Watchdog', () => {
    assert.ok(bridgeContent.includes('D:\\\\드림컴퍼니\\\\5사업부'), 'Missing 5사업부 workspace path in bridge script');
    assert.ok(bridgeContent.includes('bot_hub_watchdog.pid'), 'Missing 5-Bot Hub Watchdog HTTP 409 yield guard');
  });

  test('R5 compliance: git push is strictly guarded/disabled across bridge script', () => {
    const hasActiveGitPush = /spawnSync\s*\(\s*['"]git['"]\s*,\s*\[[^\]]*['"]push['"][^\]]*\]/i.test(bridgeContent);
    assert.strictEqual(hasActiveGitPush, false, 'Active git push found in bridge script! R5 violation.');
  });

  console.log('\n[Section 4: Live Telegram API getMe Verification]');
  await testAsync('Telegram API getMe returns ok: true and username Moneyfiityyy_bot', async () => {
    const res = await fetchTelegramGetMe(env.TELEGRAM_BOT_TOKEN);
    assert.strictEqual(res.statusCode, 200, `Expected HTTP 200, got ${res.statusCode}`);
    assert.strictEqual(res.body.ok, true, `Expected ok: true, got ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body.result && res.body.result.username, EXPECTED_BOT_USERNAME);
  });

  console.log('\n====================================================');
  console.log(`5사업부 Telegram Bridge Summary: ${passed}/${total} checks passed cleanly.`);
  console.log('====================================================');
}

if (require.main === module) {
  runTelegramBridgeTests().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  });
}

module.exports = { runTelegramBridgeTests };
