#!/usr/bin/env node
/**
 * MoneyFit Portal - IndexNow Real-Time Search Engine Submission Engine
 * Submits URL changes to Naver, Bing, and IndexNow participating search engines.
 * Pure zero-dependency Node.js implementation (native https, fs, path).
 *
 * Usage:
 *   node scripts/indexnow-submit.js              # Default dry-run mode
 *   node scripts/indexnow-submit.js --dry-run    # Explicit dry-run mode
 *   node scripts/indexnow-submit.js --live       # Live submission mode
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const { PRESETS } = require('../src/data/presets.js');

// Configuration
const CONFIG_PATH = path.join(PROJECT_ROOT, 'monetization.config.json');
let siteUrl = 'https://truthofmarket.com';
if (fs.existsSync(CONFIG_PATH)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (cfg.siteUrl) {
      siteUrl = cfg.siteUrl.replace(/\/+$/, '');
    }
  } catch (e) {
    // fallback to default
  }
}

// Canonical hostname
const host = siteUrl.replace(/^https?:\/\//i, '').split('/')[0] || 'truthofmarket.com';
const key = process.env.INDEXNOW_KEY || 'moneyfit-indexnow-key-2026';
const keyLocation = `${siteUrl}/${key}.txt`;

// Assemble the 37 URLs (home + 36 presets)
const urlList = [
  `${siteUrl}/`,
  ...PRESETS.map(p => `${siteUrl}/preset/${p.id}/`)
];

// Target search engine endpoints
const ENDPOINTS = [
  'api.indexnow.org',
  'www.bing.com',
  'searchadvisor.naver.com'
];

const payload = {
  host,
  key,
  keyLocation,
  urlList
};

async function main() {
  const args = process.argv.slice(2);
  const isLive = args.includes('--live');

  console.log('===============================================================');
  console.log('       MONEYFIT SEARCH ENGINE INDEXNOW SUBMISSION ENGINE       ');
  console.log('===============================================================');
  console.log(`[IndexNow] Host Domain     : ${host}`);
  console.log(`[IndexNow] Base Site URL   : ${siteUrl}`);
  console.log(`[IndexNow] API Key         : ${key}`);
  console.log(`[IndexNow] Target Engines  : ${ENDPOINTS.join(', ')}`);
  console.log(`[IndexNow] Total URLs      : ${urlList.length} (1 Home + ${PRESETS.length} Presets)`);
  console.log(`[IndexNow] Execution Mode  : ${isLive ? '🔴 LIVE SUBMISSION' : '🟢 DRY-RUN (Controlled/Offline)'}`);
  console.log('---------------------------------------------------------------');

  // Validate payload
  if (!payload.host || !payload.key || !Array.isArray(payload.urlList) || payload.urlList.length < 37) {
    console.error(`[IndexNow] ✗ Payload validation failed: expected at least 37 URLs, got ${payload.urlList.length}`);
    process.exit(1);
  }

  // Verify all URLs are valid strings
  for (const u of payload.urlList) {
    if (!u.startsWith('http://') && !u.startsWith('https://')) {
      console.error(`[IndexNow] ✗ Invalid URL found in payload: ${u}`);
      process.exit(1);
    }
  }

  console.log('[IndexNow] ✓ Payload structure verified:');
  console.log(`  - 37 valid canonical URLs queued`);
  console.log(`  - Sample URL: ${payload.urlList[0]}`);
  console.log(`  - Sample Preset URL: ${payload.urlList[1]}`);

  if (!isLive) {
    console.log('\n[IndexNow] [DRY-RUN MODE SUCCESS]');
    console.log('  ✓ No external HTTP POST request was dispatched (zero network side-effects).');
    console.log('  ✓ Verified JSON Payload:');
    console.log(JSON.stringify({
      host: payload.host,
      key: payload.key,
      keyLocation: payload.keyLocation,
      urlCount: payload.urlList.length,
      sampleUrls: payload.urlList.slice(0, 3)
    }, null, 2));
    console.log('\n===============================================================');
    console.log('🎉 INDEXNOW DRY-RUN VERIFICATION COMPLETED (EXIT CODE 0)');
    console.log('===============================================================');
    process.exit(0);
  }

  // Live HTTP Submission
  console.log('\n[IndexNow] Disagreeing offline mode: sending live HTTP POST requests...');
  const jsonBody = JSON.stringify(payload);
  let successCount = 0;

  for (const endpoint of ENDPOINTS) {
    try {
      await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: endpoint,
          port: 443,
          path: '/indexnow',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(jsonBody),
            'User-Agent': 'MoneyFit-SSG-Bot/1.0'
          },
          timeout: 5000
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            console.log(`  [${endpoint}] Response HTTP Status: ${res.statusCode} ${res.statusMessage}`);
            if (res.statusCode === 200 || res.statusCode === 202) {
              successCount++;
            }
            resolve();
          });
        });

        req.on('error', (err) => {
          console.warn(`  [${endpoint}] Live connection warning: ${err.message}`);
          resolve(); // Resolve to allow other endpoints
        });

        req.on('timeout', () => {
          req.destroy();
          console.warn(`  [${endpoint}] Request timed out`);
          resolve();
        });

        req.write(jsonBody);
        req.end();
      });
    } catch (e) {
      console.warn(`  [${endpoint}] Exception: ${e.message}`);
    }
  }

  console.log(`\n[IndexNow] Live dispatch finished. ${successCount}/${ENDPOINTS.length} endpoints responded.`);
  process.exit(0);
}

if (require.main === module) {
  main().catch(err => {
    console.error('[IndexNow] Fatal error:', err);
    process.exit(1);
  });
}

module.exports = {
  payload,
  urlList,
  host,
  key
};
