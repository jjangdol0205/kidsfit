/**
 * tests/challenger-m3-viewport-geometry.test.js
 * Empirical Challenger: Real Headless Chrome CDP Mobile Viewport Geometry & Collision Harness
 *
 * Verifies across viewports [320, 360, 375, 414, 768, 1280]:
 * 1. Horizontal blowout is 0px (scrollWidth <= clientWidth, window.scrollX === 0)
 * 2. .kf-badge-platform & .kf-card-stage-tag do NOT collide on 360px and 375px viewports (and all mobile)
 * 3. Mobile .kf-card-action-btn touch target height >= 44px (WCAG 2.5.5)
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { spawn } = require('child_process');

const WORKSPACE_DIR = path.resolve(__dirname, '..');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTTP_PORT = 9876;
const CDP_PORT = 9666;

const VIEWPORTS = [320, 360, 375, 414, 768, 1280];

let passCount = 0;
let failCount = 0;
const failures = [];

function it(title, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${title}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${title}`);
    console.error(`     ↳ ${err.message}`);
    failCount++;
    failures.push({ title, error: err.message });
  }
}

// 1. Lightweight Static HTTP Server
function startStaticServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml; charset=utf-8'
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(WORKSPACE_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(HTTP_PORT, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

// 2. CDP Harness
async function runViewportHarness() {
  console.log('========================================================================');
  console.log('   EMPIRICAL CHALLENGER: REAL HEADLESS CHROME CDP VIEWPORT HARNESS      ');
  console.log('========================================================================\n');

  const staticServer = await startStaticServer();
  console.log(`[HTTP Server] Listening on http://127.0.0.1:${HTTP_PORT}`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-m3-vp-'));
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    `http://127.0.0.1:${HTTP_PORT}/index.html`
  ]);

  let cdpWs = null;
  let serverClosed = false;

  const cleanup = () => {
    if (serverClosed) return;
    serverClosed = true;
    try { if (cdpWs) cdpWs.close(); } catch (_) {}
    try { chrome.kill('SIGKILL'); } catch (_) {}
    try { staticServer.close(); } catch (_) {}
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });

  try {
    // Wait for Chrome to listen
    await new Promise(r => setTimeout(r, 2000));

    // Get Page Target WebSocket URL
    let pageWsUrl = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const jsonRes = await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${CDP_PORT}/json`, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
          }).on('error', reject);
        });
        const pageTarget = jsonRes.find(t => t.type === 'page');
        if (pageTarget && pageTarget.webSocketDebuggerUrl) {
          pageWsUrl = pageTarget.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {
        await new Promise(r => setTimeout(r, 800));
      }
    }

    assert(pageWsUrl, 'Failed to acquire Chrome Page Target WebSocket URL');
    console.log(`[CDP] Connected to Chrome Page Target: ${pageWsUrl}\n`);

    cdpWs = new WebSocket(pageWsUrl);
    let msgId = 1;
    const pendingRequests = new Map();

    function sendCDP(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const timeout = setTimeout(() => {
          pendingRequests.delete(id);
          reject(new Error(`CDP request timed out: ${method}`));
        }, 10000);

        pendingRequests.set(id, (res) => {
          clearTimeout(timeout);
          if (res.error) reject(new Error(res.error.message));
          else resolve(res.result);
        });

        cdpWs.send(JSON.stringify({ id, method, params }));
      });
    }

    cdpWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pendingRequests.has(data.id)) {
        pendingRequests.get(data.id)(data);
        pendingRequests.delete(data.id);
      }
    };

    await new Promise((resolve, reject) => {
      cdpWs.onopen = resolve;
      cdpWs.onerror = reject;
    });

    await sendCDP('Page.enable');
    await sendCDP('Runtime.enable');
    await sendCDP('DOM.enable');

    // Wait 1.5s for initial hydration
    await new Promise(r => setTimeout(r, 1500));

    async function evalInBrowser(expr) {
      const res = await sendCDP('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result.value;
    }

    // Iterate through all specified viewports
    for (const width of VIEWPORTS) {
      console.log(`\n------------------------------------------------------------------------`);
      console.log(`[EVALUATING VIEWPORT: ${width}px]`);
      console.log(`------------------------------------------------------------------------`);

      // Set Device Metrics in Chrome
      await sendCDP('Emulation.setDeviceMetricsOverride', {
        width,
        height: 900,
        deviceScaleFactor: 2,
        mobile: width <= 768
      });

      // Wait 300ms for reflow and media query application
      await new Promise(r => setTimeout(r, 300));

      // 1. Horizontal Scroll Blowout Check
      const blowoutData = await evalInBrowser(`(() => {
        const docEl = document.documentElement;
        const clientWidth = docEl.clientWidth || window.innerWidth;
        const scrollWidth = docEl.scrollWidth;
        const blowoutPx = Math.max(0, scrollWidth - clientWidth);
        
        // Test empirical scroll attempt
        window.scrollTo(100, 0);
        const scrolledX = window.scrollX || window.pageXOffset || docEl.scrollLeft || 0;
        window.scrollTo(0, 0);
        
        return { clientWidth, scrollWidth, blowoutPx, scrolledX };
      })()`);

      it(`Viewport ${width}px: Horizontal scroll blowout is 0px (scrollWidth=${blowoutData.scrollWidth}px, clientWidth=${blowoutData.clientWidth}px, scrolledX=${blowoutData.scrolledX}px)`, () => {
        assert.strictEqual(
          blowoutData.blowoutPx,
          0,
          `Horizontal scroll blowout detected: ${blowoutData.blowoutPx}px (scrollWidth: ${blowoutData.scrollWidth}, clientWidth: ${blowoutData.clientWidth})`
        );
        assert.strictEqual(
          blowoutData.scrolledX,
          0,
          `Horizontal scroll occurred: ${blowoutData.scrolledX}px when window.scrollTo(100, 0) was invoked`
        );
      });

      // 2. Mobile Badge & Tag Collision & Touch Target Height Check
      const cardMetrics = await evalInBrowser(`(() => {
        const cards = Array.from(document.querySelectorAll('.kf-product-card'));
        return cards.map((card, idx) => {
          const badge = card.querySelector('.kf-badge-platform');
          const stageTag = card.querySelector('.kf-card-stage-tag');
          const actionBtn = card.querySelector('.kf-card-action-btn');
          const thumbWrap = card.querySelector('.kf-card-thumb-wrap');

          const bRect = badge ? badge.getBoundingClientRect() : null;
          const sRect = stageTag ? stageTag.getBoundingClientRect() : null;
          const aRect = actionBtn ? actionBtn.getBoundingClientRect() : null;
          const tRect = thumbWrap ? thumbWrap.getBoundingClientRect() : null;

          let collision = false;
          let verticalOverlap = false;
          let horizontalOverlap = false;

          if (bRect && sRect) {
            // Collision occurs if neither rect is completely separated
            const separatedHorizontally = (bRect.right <= sRect.left) || (sRect.right <= bRect.left);
            const separatedVertically   = (bRect.bottom <= sRect.top) || (sRect.top >= sRect.bottom);
            collision = !separatedHorizontally && !separatedVertically;
            verticalOverlap = !separatedVertically;
            horizontalOverlap = !separatedHorizontally;
          }

          return {
            index: idx,
            title: card.querySelector('.kf-card-title')?.innerText?.trim()?.slice(0, 30) || 'Card ' + idx,
            hasBadge: Boolean(bRect),
            hasStageTag: Boolean(sRect),
            hasActionBtn: Boolean(aRect),
            badgeRect: bRect ? { top: bRect.top, bottom: bRect.bottom, left: bRect.left, right: bRect.right, width: bRect.width, height: bRect.height } : null,
            stageRect: sRect ? { top: sRect.top, bottom: sRect.bottom, left: sRect.left, right: sRect.right, width: sRect.width, height: sRect.height } : null,
            btnHeight: aRect ? Math.round(aRect.height * 10) / 10 : 0,
            collision,
            verticalOverlap,
            horizontalOverlap
          };
        });
      })()`);

      it(`Viewport ${width}px: Found all ${cardMetrics.length} product cards with complete badges & CTAs`, () => {
        assert(cardMetrics.length >= 24, `Expected at least 24 cards, found: ${cardMetrics.length}`);
        cardMetrics.forEach(c => {
          assert(c.hasBadge, `Card ${c.index} (${c.title}) missing .kf-badge-platform`);
          assert(c.hasStageTag, `Card ${c.index} (${c.title}) missing .kf-card-stage-tag`);
          assert(c.hasActionBtn, `Card ${c.index} (${c.title}) missing .kf-card-action-btn`);
        });
      });

      // Collision evaluation: on mobile viewports (<= 768px, specifically 360px and 375px)
      if (width <= 768) {
        const collisions = cardMetrics.filter(c => c.collision);
        it(`Viewport ${width}px: .kf-badge-platform and .kf-card-stage-tag do NOT collide on any card (0 collisions)`, () => {
          assert.strictEqual(
            collisions.length,
            0,
            `Detected ${collisions.length} collision(s) at ${width}px: ${JSON.stringify(collisions.map(c => ({ title: c.title, badge: c.badgeRect, stage: c.stageRect })))}`
          );
        });

        // Touch target check: action button height >= 44px
        const undersizedBtns = cardMetrics.filter(c => c.btnHeight < 44.0);
        it(`Viewport ${width}px: Mobile .kf-card-action-btn touch target height >= 44px across all cards`, () => {
          assert.strictEqual(
            undersizedBtns.length,
            0,
            `Detected ${undersizedBtns.length} CTA buttons under 44px at ${width}px: ${JSON.stringify(undersizedBtns.map(c => ({ title: c.title, height: c.btnHeight })))}`
          );
        });
      }
    }

    console.log('\n========================================================================');
    console.log(`TOTAL VIEWPORT TESTS EVALUATED : ${passCount + failCount}`);
    console.log(`TOTAL VIEWPORT TESTS PASSED    : ${passCount}`);
    console.log(`TOTAL VIEWPORT TESTS FAILED    : ${failCount}`);
    console.log('========================================================================\n');

    cleanup();

    if (failCount > 0) {
      console.error('FAILURES RECORDED:');
      failures.forEach(f => console.error(`- ${f.title}: ${f.error}`));
      process.exit(1);
    } else {
      console.log('🎉 ALL EMPIRICAL VIEWPORT GEOMETRY CHALLENGES PASSED SUCCESSFULLY!');
      process.exit(0);
    }

  } catch (err) {
    cleanup();
    console.error('Unhandled Harness Error:', err);
    process.exit(1);
  }
}

runViewportHarness();
