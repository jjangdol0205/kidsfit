/**
 * tests/challenger-empirical-stress.test.js
 *
 * Adversarial Empirical Stress Test Harness by challenger_1.
 * Tests edge cases, malicious/adverse inputs, headless & mock DOM runtimes,
 * Lemon Squeezy HMAC signature validation, Korean workspace paywall isolation,
 * and Git Remote Push Protection (R5).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const EN_ROOT = path.resolve(__dirname, '..');
const KO_ROOT = path.resolve('d:\\사업아이템');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
    testsFailed++;
  }
}

async function runTestAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
    testsFailed++;
  }
}

async function main() {
  console.log('================================================================');
  console.log('  CHALLENGER_1 ADVERSARIAL EMPIRICAL STRESS TEST HARNESS');
  console.log('================================================================\n');

  // Load modules
  const GlobalPaywall = require('../src/js/global-paywall-edition.js');
  const server = require('../server.js');

  // ============================================================================
  // GROUP 1: Startup Behavior & isGlobalPaidEdition() Diversity Stress-Testing
  // ============================================================================
  console.log('--- Group 1: Startup Behavior & isGlobalPaidEdition() Diversity ---');

  runTest('1.1 Pure Node runtime without DOM defaults to isGlobalPaidEdition === true', () => {
    delete global.__KIDSFIT_GLOBAL_PAID_EDITION;
    delete global.window;
    delete global.document;

    const res = GlobalPaywall.isGlobalPaidEdition();
    assert.strictEqual(res, true, 'Default Node runtime must evaluate to true');
  });

  runTest('1.2 Simulated browser startup with ZERO query params and ZERO host headers', () => {
    delete global.__KIDSFIT_GLOBAL_PAID_EDITION;
    global.window = {
      location: {
        hostname: '',
        search: ''
      }
    };
    global.document = {
      documentElement: {
        getAttribute: () => null
      }
    };

    const res = GlobalPaywall.isGlobalPaidEdition();
    assert.strictEqual(res, true, 'Zero query params and empty hostname must evaluate to true');
  });

  runTest('1.3 Simulated browser on localhost without edition flags', () => {
    delete global.__KIDSFIT_GLOBAL_PAID_EDITION;
    global.window = {
      location: {
        hostname: 'localhost',
        search: ''
      }
    };
    global.document = {
      documentElement: {
        getAttribute: () => null
      }
    };

    const res = GlobalPaywall.isGlobalPaidEdition();
    assert.strictEqual(res, true, 'Localhost without flags must default to true in English workspace');
  });

  runTest('1.4 Simulated browser on canonical domain kisfitglobal.com', () => {
    delete global.__KIDSFIT_GLOBAL_PAID_EDITION;
    global.window = {
      location: {
        hostname: 'kisfitglobal.com',
        search: ''
      }
    };
    global.document = {
      documentElement: {
        getAttribute: () => null
      }
    };

    const res = GlobalPaywall.isGlobalPaidEdition();
    assert.strictEqual(res, true, 'kisfitglobal.com must evaluate to true');
  });

  runTest('1.5 Headless DOM with data-edition="global-paid" attribute', () => {
    delete global.__KIDSFIT_GLOBAL_PAID_EDITION;
    global.window = {
      location: {
        hostname: 'random-headless-runner.internal',
        search: ''
      }
    };
    global.document = {
      documentElement: {
        getAttribute: (attr) => (attr === 'data-edition' ? 'global-paid' : null)
      }
    };

    const res = GlobalPaywall.isGlobalPaidEdition();
    assert.strictEqual(res, true, 'data-edition="global-paid" must evaluate to true');
  });

  runTest('1.6 Explicit global variable window.__KIDSFIT_GLOBAL_PAID_EDITION === true', () => {
    global.window = {
      __KIDSFIT_GLOBAL_PAID_EDITION: true,
      location: { hostname: 'unknown-domain.org', search: '' }
    };
    global.document = undefined;

    const res = GlobalPaywall.isGlobalPaidEdition();
    assert.strictEqual(res, true, 'Explicit true must evaluate to true');
  });

  runTest('1.7 Adverse override: edition=ko in query param must cleanly evaluate to false', () => {
    delete global.__KIDSFIT_GLOBAL_PAID_EDITION;
    global.window = {
      location: {
        hostname: 'kisfitglobal.com',
        search: '?edition=ko&foo=bar'
      }
    };
    global.document = {
      documentElement: {
        getAttribute: () => null
      }
    };

    const res = GlobalPaywall.isGlobalPaidEdition();
    assert.strictEqual(res, false, '?edition=ko must return false even on kisfitglobal.com');
  });

  runTest('1.8 Adverse override: data-edition="ko" must evaluate to false', () => {
    delete global.__KIDSFIT_GLOBAL_PAID_EDITION;
    global.window = {
      location: {
        hostname: 'localhost',
        search: ''
      }
    };
    global.document = {
      documentElement: {
        getAttribute: (attr) => (attr === 'data-edition' ? 'ko' : null)
      }
    };

    const res = GlobalPaywall.isGlobalPaidEdition();
    assert.strictEqual(res, false, 'data-edition="ko" must return false');
  });

  runTest('1.9 Explicit negative flag window.__KIDSFIT_GLOBAL_PAID_EDITION === false', () => {
    global.window = {
      __KIDSFIT_GLOBAL_PAID_EDITION: false,
      location: { hostname: 'kisfitglobal.com', search: '?edition=global' }
    };
    global.document = undefined;

    const res = GlobalPaywall.isGlobalPaidEdition();
    assert.strictEqual(res, false, 'Explicit false flag must take absolute precedence');
  });

  runTest('1.10 Hostile runtime: null location and corrupted document properties do not crash', () => {
    delete global.__KIDSFIT_GLOBAL_PAID_EDITION;
    global.window = {
      location: null
    };
    global.document = {
      documentElement: null
    };

    let result;
    assert.doesNotThrow(() => {
      result = GlobalPaywall.isGlobalPaidEdition();
    }, 'Must not throw in corrupted environment');
    assert.strictEqual(result, true, 'Corrupted environment safely falls back to true');
  });

  runTest('1.11 Static HTML verification: index.html & dist/index.html have default English & paywall tags', () => {
    const rootHtml = fs.readFileSync(path.join(EN_ROOT, 'index.html'), 'utf8');
    const distHtml = fs.readFileSync(path.join(EN_ROOT, 'dist', 'index.html'), 'utf8');

    for (const [tag, content] of [['index.html', rootHtml], ['dist/index.html', distHtml]]) {
      assert.ok(content.includes('<html lang="en" data-theme="light" data-edition="global-paid">'), `${tag} must declare global-paid html tag`);
      assert.ok(content.includes('window.__KIDSFIT_GLOBAL_PAID_EDITION = true;'), `${tag} must initialize global paid edition`);
      assert.ok(content.includes('<link rel="canonical" href="https://kisfitglobal.com/">'), `${tag} canonical link must point to kisfitglobal.com`);
      assert.ok(content.includes('src="src/js/global-paywall-edition.js'), `${tag} must include global-paywall-edition.js`);
    }

    const cnameRoot = fs.readFileSync(path.join(EN_ROOT, 'CNAME'), 'utf8').trim();
    const cnameDist = fs.readFileSync(path.join(EN_ROOT, 'dist', 'CNAME'), 'utf8').trim();
    assert.strictEqual(cnameRoot, 'kisfitglobal.com', 'CNAME must be kisfitglobal.com');
    assert.strictEqual(cnameDist, 'kisfitglobal.com', 'dist/CNAME must be kisfitglobal.com');
  });

  // Clean up global mock
  delete global.window;
  delete global.document;

  // ============================================================================
  // GROUP 2: Lemon Squeezy Checkout Triggers, URL Formation & VIP Passcodes
  // ============================================================================
  console.log('\n--- Group 2: Lemon Squeezy Checkout Triggers & VIP Access ---');

  runTest('2.1 getActiveCheckoutUrl retrieves official URLs', () => {
    const singleUrl = GlobalPaywall.getActiveCheckoutUrl('single');
    const passUrl = GlobalPaywall.getActiveCheckoutUrl('pass');
    const fallbackUrl = GlobalPaywall.getActiveCheckoutUrl('unrecognized_plan');

    assert.strictEqual(singleUrl, 'https://app.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599');
    assert.strictEqual(passUrl, 'https://app.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895');
    assert.strictEqual(fallbackUrl, singleUrl, 'Fallback must default to single pass');
  });

  runTest('2.2 Checkout trigger handles email encoding and embed parameters', () => {
    global.window = {
      localStorage: {
        getItem: () => null,
        setItem: () => {}
      },
      LemonSqueezy: {
        Url: {
          Open: (url) => {
            global.__openedCheckoutUrl = url;
          }
        }
      }
    };
    global.document = {
      getElementById: (id) => {
        if (id === 'checkout-parent-email') {
          return { value: 'parent+test@example.com' };
        }
        return null;
      }
    };

    global.launchLemonSqueezyCheckout('single');
    assert.ok(global.__openedCheckoutUrl, 'LemonSqueezy.Url.Open must be called');
    assert.ok(global.__openedCheckoutUrl.includes('embed=1'), 'URL must include embed=1');
    assert.ok(global.__openedCheckoutUrl.includes('checkout[email]=parent%2Btest%40example.com'), 'Email must be URL-encoded');

    // Clean up
    delete global.window;
    delete global.document;
    delete global.__openedCheckoutUrl;
  });

  runTest('2.3 VIP Passcode validation logic unlocks report', () => {
    let unlocked = false;
    global.window = {
      localStorage: {
        setItem: (key, val) => {
          if (key === 'kidsfit_global_report_unlocked_v1' && val === 'true') {
            unlocked = true;
          }
        }
      }
    };

    const validCodes = ['VIP2026', 'vip2026', ' ADMIN ', 'kidsfit', 'FREE100'];
    const mockElem = () => ({
      style: {},
      innerHTML: '',
      querySelector: () => null,
      insertBefore: () => {},
      prepend: () => {},
      appendChild: () => {},
      remove: () => {}
    });

    for (const code of validCodes) {
      unlocked = false;
      global.document = {
        createElement: () => mockElem(),
        getElementById: (id) => {
          if (id === 'input-global-vip-code') return { value: code };
          return mockElem();
        },
        querySelector: () => null
      };
      global.applyKidsFitGlobalVipCode();
      assert.strictEqual(unlocked, true, `Code '${code}' must unlock the report`);
    }

    // Invalid code test
    unlocked = false;
    let alertMessage = '';
    global.window.alert = (msg) => { alertMessage = msg; };
    global.document = {
      createElement: () => mockElem(),
      getElementById: (id) => {
        if (id === 'input-global-vip-code') return { value: 'INVALID_CODE' };
        return mockElem();
      },
      querySelector: () => null
    };
    global.applyKidsFitGlobalVipCode();
    assert.strictEqual(unlocked, false, 'Invalid code must NOT unlock report');
    assert.ok(alertMessage.includes('Invalid access code'), 'Must show alert on invalid code');

    delete global.window;
    delete global.document;
  });

  // ============================================================================
  // GROUP 3: Server Endpoint & Webhook HMAC Signature Validation
  // ============================================================================
  console.log('\n--- Group 3: Server Endpoint & Webhook HMAC Signature Validation ---');

  // Start HTTP server on dynamic port
  const testPort = await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });

  function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });
      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  }

  await runTestAsync('3.1 GET /api/lemonsqueezy-config returns Store #296100 configuration', async () => {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: testPort,
      path: '/api/lemonsqueezy-config',
      method: 'GET'
    });

    assert.strictEqual(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.storeId, 296100);
    assert.strictEqual(data.products.singlePass.productId, 1468224);
    assert.strictEqual(data.products.singlePass.priceUsd, 8.99);
    assert.strictEqual(data.products.trackerPass.productId, 1468243);
    assert.strictEqual(data.products.trackerPass.priceUsd, 19.99);
    assert.strictEqual(data.webhookId, 145796);
  });

  await runTestAsync('3.2 GET /api/lemonsqueezy-webhook returns readiness ping', async () => {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: testPort,
      path: '/api/lemonsqueezy-webhook',
      method: 'GET'
    });

    assert.strictEqual(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.storeId, 296100);
  });

  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || 'kf_ls_whsec_2026_truthofmarket';

  await runTestAsync('3.3 POST /api/lemonsqueezy-webhook with VALID HMAC signature', async () => {
    const payload = JSON.stringify({
      meta: {
        event_name: 'order_created',
        custom_data: { test: true }
      },
      data: {
        id: 'ORD-EMPR-CHALLENGER-001',
        type: 'orders',
        attributes: {
          user_email: 'challenger_valid@kisfitglobal.com',
          total_formatted: '$8.99',
          status: 'paid'
        }
      }
    });

    const validSig = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

    const res = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: testPort,
        path: '/api/lemonsqueezy-webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-signature': validSig
        }
      },
      payload
    );

    assert.strictEqual(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.eventName, 'order_created');
    assert.strictEqual(data.signatureValid, true, 'HMAC validation must succeed for matching signature');

    // Check logs
    const logPath = path.join(EN_ROOT, 'logs', 'lemonsqueezy_orders.jsonl');
    assert.ok(fs.existsSync(logPath), 'Order log file must exist');
    const logContent = fs.readFileSync(logPath, 'utf8');
    assert.ok(logContent.includes('ORD-EMPR-CHALLENGER-001'), 'Order ID must be logged');
    assert.ok(logContent.includes('"signatureValid":true'), 'Logged entry must record signatureValid: true');
  });

  await runTestAsync('3.4 POST /api/lemonsqueezy-webhook with INVALID / FORGED HMAC signature', async () => {
    const payload = JSON.stringify({
      meta: { event_name: 'order_created' },
      data: {
        id: 'ORD-EMPR-FORGED-002',
        attributes: {
          user_email: 'hacker@adversary.com',
          total_formatted: '$0.00',
          status: 'paid'
        }
      }
    });

    const forgedSig = 'deadbeef0123456789abcdef0123456789abcdef0123456789abcdef01234567';

    const res = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: testPort,
        path: '/api/lemonsqueezy-webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-signature': forgedSig
        }
      },
      payload
    );

    assert.strictEqual(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.signatureValid, false, 'Forged HMAC must evaluate signatureValid to false');

    const logPath = path.join(EN_ROOT, 'logs', 'lemonsqueezy_orders.jsonl');
    const logContent = fs.readFileSync(logPath, 'utf8');
    assert.ok(logContent.includes('ORD-EMPR-FORGED-002'), 'Forged event must still be tracked for auditing');
    assert.ok(logContent.includes('"orderId":"ORD-EMPR-FORGED-002","email":"hacker@adversary.com","totalUsd":"$0.00","status":"paid"'), 'Attributes extracted correctly');
  });

  await runTestAsync('3.5 POST /api/lemonsqueezy-webhook with MALFORMED JSON payload returns HTTP 400', async () => {
    const brokenBody = '{"meta": {"event_name": "corrupt", unclosed';

    const res = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: testPort,
        path: '/api/lemonsqueezy-webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(brokenBody)
        }
      },
      brokenBody
    );

    assert.strictEqual(res.statusCode, 400, 'Server must return HTTP 400 Bad Request');
    const data = JSON.parse(res.body);
    assert.strictEqual(data.ok, false);
    assert.strictEqual(data.error, 'Invalid webhook payload');
  });

  // Close test server
  server.close();

  // ============================================================================
  // GROUP 4: Korean Workspace Paywall Isolation & Cleanliness (d:\사업아이템)
  // ============================================================================
  console.log('\n--- Group 4: Korean Workspace Paywall Isolation (d:\\사업아이템) ---');

  runTest('4.1 Korean workspace has zero Lemon Squeezy order logs and paywall script is unreferenced', () => {
    const orderLog = path.join(KO_ROOT, 'logs', 'lemonsqueezy_orders.jsonl');
    assert.strictEqual(fs.existsSync(orderLog), false, 'lemonsqueezy_orders.jsonl must not exist in Korean workspace');

    // English workspace MUST have global-paywall-edition.js and order logs
    const enPaywallJs = path.join(EN_ROOT, 'src', 'js', 'global-paywall-edition.js');
    assert.strictEqual(fs.existsSync(enPaywallJs), true, 'src/js/global-paywall-edition.js must exist in English workspace');

    // Korean index.html must not reference global-paywall-edition.js
    const rootHtml = fs.readFileSync(path.join(KO_ROOT, 'index.html'), 'utf8');
    assert.ok(!rootHtml.includes('global-paywall-edition.js'), 'Korean index.html must not reference global-paywall-edition.js');
  });

  runTest('4.2 Korean index.html & dist/index.html contain ZERO paywall or Lemon Squeezy references', () => {
    const rootHtml = fs.readFileSync(path.join(KO_ROOT, 'index.html'), 'utf8');
    const distHtml = fs.readFileSync(path.join(KO_ROOT, 'dist', 'index.html'), 'utf8');

    for (const [tag, content] of [['index.html', rootHtml], ['dist/index.html', distHtml]]) {
      assert.ok(!content.includes('global-paywall-edition.js'), `${tag} must NOT reference global-paywall-edition.js`);
      assert.ok(!content.toLowerCase().includes('lemonsqueezy'), `${tag} must NOT reference lemonsqueezy`);
      assert.ok(!content.includes('data-edition="global-paid"'), `${tag} must NOT default to global-paid`);
    }
  });

  runTest('4.3 Korean server.js contains ZERO Lemon Squeezy endpoints', () => {
    const koServer = fs.readFileSync(path.join(KO_ROOT, 'server.js'), 'utf8');
    assert.ok(!koServer.includes('/api/lemonsqueezy-config'), 'Korean server.js must not have lemonsqueezy-config');
    assert.ok(!koServer.includes('/api/lemonsqueezy-webhook'), 'Korean server.js must not have lemonsqueezy-webhook');
    assert.ok(!koServer.includes('LEMONSQUEEZY_'), 'Korean server.js must not reference LEMONSQUEEZY_');
  });

  runTest('4.4 Korean .env contains ZERO LEMONSQUEEZY_* variables', () => {
    const koEnv = fs.readFileSync(path.join(KO_ROOT, '.env'), 'utf8');
    assert.ok(!koEnv.includes('LEMONSQUEEZY_'), 'Korean .env must NOT contain LEMONSQUEEZY_*');
  });

  runTest('4.5 Domain CNAME integrity across English and Korean workspaces', () => {
    const enRootCname = fs.readFileSync(path.join(EN_ROOT, 'CNAME'), 'utf8').trim();
    const enDistCname = fs.readFileSync(path.join(EN_ROOT, 'dist', 'CNAME'), 'utf8').trim();
    assert.strictEqual(enRootCname, 'kisfitglobal.com', 'English root CNAME must be kisfitglobal.com');
    assert.strictEqual(enDistCname, 'kisfitglobal.com', 'English dist/CNAME must be kisfitglobal.com');

    const rootCname = fs.readFileSync(path.join(KO_ROOT, 'CNAME'), 'utf8').trim();
    assert.ok(['kidsfit.co.kr', 'kisfitglobal.com', 'kisfitglobal.com'].includes(rootCname), `Korean root CNAME must be a valid domain (got: ${rootCname})`);
  });

  runTest('4.6 Korean domestic marketing folders remain 100% intact', () => {
    const requiredMarketingDirs = [
      '네이버블로그_글모음',
      '네이버카페_글모음',
      '네이버클립_웹툰영상_모음',
      '웹툰_모음',
      '인스타_쓰레드_프로필_모음',
      '카드뉴스_모음'
    ];

    for (const dir of requiredMarketingDirs) {
      const fullPath = path.join(KO_ROOT, dir);
      assert.ok(fs.existsSync(fullPath), `Korean marketing dir must exist: ${dir}`);
      const files = fs.readdirSync(fullPath);
      assert.ok(files.length > 0, `Korean marketing dir must not be empty: ${dir}`);
    }
  });

  runTest('4.7 Korean Telegram Bot config is isolated and distinct from English bot', () => {
    const koEnv = fs.readFileSync(path.join(KO_ROOT, '.env'), 'utf8');
    const enEnv = fs.readFileSync(path.join(EN_ROOT, '.env'), 'utf8');

    assert.ok(koEnv.includes('TELEGRAM_BOT_TOKEN=8874740009:AAHecAzLm5wYe_OyHDCDxrR92P0CcTMd6JE'), 'Korean token must match 8874740009');
    assert.ok(koEnv.includes('ANTIGRAVITY_CONVERSATION_ID=efdd0412-2586-40cf-bb28-0fa8976613df'), 'Korean conv ID must match efdd0412');
    assert.ok(enEnv.includes('TELEGRAM_BOT_TOKEN=8884379894:AAEEyfqtYTc4fRMmySZhjHUAU1ji5Vh5KRw'), 'English token must match 8884379894');
    assert.ok(enEnv.includes('ANTIGRAVITY_CONVERSATION_ID=278ac9cd-25e2-4d75-93ae-f407a1e6de5d'), 'English conv ID must match 278ac9cd');
  });

  // ============================================================================
  // GROUP 5: Git Remote Push Protection (Requirement R5)
  // ============================================================================
  console.log('\n--- Group 5: Git Remote Push Protection (R5) ---');

  runTest('5.1 Neither workspace has active pre-push or post-commit hooks in .git/hooks', () => {
    for (const root of [EN_ROOT, KO_ROOT]) {
      const hooksDir = path.join(root, '.git', 'hooks');
      if (fs.existsSync(hooksDir)) {
        const activeHooks = fs.readdirSync(hooksDir).filter((f) => !f.endsWith('.sample'));
        assert.strictEqual(activeHooks.length, 0, `No active hooks allowed in ${hooksDir}`);
      }
    }
  });

  runTest('5.2 package.json in both workspaces has zero git push commands', () => {
    for (const root of [EN_ROOT, KO_ROOT]) {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
      for (const [scriptName, cmd] of Object.entries(pkg.scripts || {})) {
        assert.ok(!cmd.includes('git push'), `Script ${scriptName} in ${root} must not execute git push`);
      }
    }
  });

  runTest('5.3 Korean continuous_research_daemon.py has git push safely disabled', () => {
    const daemonPath = path.join(KO_ROOT, 'scripts', 'continuous_research_daemon.py');
    if (fs.existsSync(daemonPath)) {
      const content = fs.readFileSync(daemonPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (/subprocess\.run\(.*git.*push/i.test(line)) {
          const trimmed = line.trim();
          assert.ok(trimmed.startsWith('#'), `Line ${idx + 1} with git push must be commented out`);
        }
      });
    }
  });

  runTest('5.4 English telegram-antigravity-bridge.js /deploy executes local build/tests without git push', () => {
    const bridgePath = path.join(EN_ROOT, 'scripts', 'telegram-antigravity-bridge.js');
    const content = fs.readFileSync(bridgePath, 'utf8');
    assert.ok(content.includes('R5 원격 push 보호 모드'), 'Bridge must indicate R5 protection');
    // Ensure no executable git push command is in the file
    const pushMatches = content.match(/^\s*spawnSync\(.*git.*push/m);
    assert.strictEqual(pushMatches, null, 'No spawnSync git push permitted');
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`  EMPIRICAL STRESS TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
