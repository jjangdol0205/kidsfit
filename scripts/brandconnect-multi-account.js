#!/usr/bin/env node
/**
 * MoneyFit Dual-Account Naver Brand Connect (쇼핑커넥트) & Naver Clip Automation Engine
 *
 * Architecture:
 * - Port 9222 (`chrome-debug-profile`)        : Naver Account A (`comedifarm`) + Instagram/Threads (`@moneyfit2026`)
 * - Port 9223 (`chrome-brandconnect-profile`) : Naver Account B (Dedicated Brand Connect / Shopping Connect & Naver Clip Account)
 *
 * Commands:
 * - `node scripts/brandconnect-multi-account.js --launch` : Launches isolated Chrome on Port 9223 for Account B login
 * - `node scripts/brandconnect-multi-account.js --status` : Checks login & Brand Connect Workspace status on Port 9223
 * - `node scripts/brandconnect-multi-account.js --sync`   : Syncs Shopping Connect links from Account B (Port 9223) into monetization.config.json
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'monetization.config.json');
const BC_PORT = 9223;
const BC_PROFILE_DIR = path.join(process.env.LOCALAPPDATA || 'C:\\Users\\jjang\\AppData\\Local', 'Temp', 'chrome-brandconnect-profile');

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getBcPages() {
  try {
    const res = await fetch(`http://127.0.0.1:${BC_PORT}/json/list`);
    if (!res.ok) return null;
    const list = await res.json();
    return list.filter(x => x.type === 'page');
  } catch (e) {
    return null;
  }
}

async function launchBrandConnectBrowser() {
  const existing = await getBcPages();
  if (existing) {
    console.log(`✓ [Port ${BC_PORT}] Brand Connect dedicated Chrome container is already running (${existing.length} tabs).`);
    return existing;
  }

  const chromeExe = findChrome();
  if (!chromeExe) {
    throw new Error('Chrome executable not found.');
  }

  if (!fs.existsSync(BC_PROFILE_DIR)) {
    fs.mkdirSync(BC_PROFILE_DIR, { recursive: true });
  }

  const startUrl = 'https://nid.naver.com/nidlogin.login?url=https%3A%2F%2Fbrandconnect.naver.com%2F';
  const cmdLine = `"${chromeExe}" --remote-debugging-port=${BC_PORT} --user-data-dir="${BC_PROFILE_DIR}" --no-first-run --no-default-browser-check "${startUrl}"`;

  const child = spawn('powershell.exe', [
    '-NoProfile',
    '-Command',
    `Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '${cmdLine.replace(/'/g, "''")}' } | Out-Null`
  ], {
    stdio: 'ignore'
  });
  child.unref();

  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    const pages = await getBcPages();
    if (pages && pages.length > 0) {
      console.log(`✓ Launched isolated Brand Connect Chrome container on Port ${BC_PORT} (${BC_PROFILE_DIR})`);
      return pages;
    }
  }
  throw new Error(`Failed to connect to Port ${BC_PORT} after launching Chrome.`);
}

async function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let seq = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    const id = seq++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  return { send, evaluate, close: () => ws.close() };
}

async function checkBrandConnectStatus() {
  const pages = await getBcPages();
  if (!pages || pages.length === 0) {
    return {
      running: false,
      port: BC_PORT,
      profileDir: BC_PROFILE_DIR,
      message: '전용 브라우저(Port 9223)가 아직 실행되지 않았습니다. --launch 옵션으로 실행하세요.'
    };
  }

  const target = pages.find(p => p.url.includes('naver.com')) || pages[0];
  const cdp = await connectCdp(target.webSocketDebuggerUrl);
  try {
    const info = await cdp.evaluate(`({
      title: document.title,
      url: location.href,
      isLoggedIn: !document.body.innerText.includes('로그인') || document.body.innerText.includes('로그아웃') || document.body.innerText.includes('스페이스'),
      workspaceMatch: (location.href.match(/brandconnect\\.naver\\.com\\/(\\d+)/) || [])[1] || null
    })`);
    return {
      running: true,
      port: BC_PORT,
      profileDir: BC_PROFILE_DIR,
      ...info
    };
  } finally {
    cdp.close();
  }
}

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    if (args.includes('--launch')) {
      await launchBrandConnectBrowser();
      const status = await checkBrandConnectStatus();
      console.log(JSON.stringify(status, null, 2));
      return;
    }
    const status = await checkBrandConnectStatus();
    console.log(JSON.stringify(status, null, 2));
  })().catch(err => {
    console.error('[BrandConnect Multi-Account Error]:', err.message);
    process.exit(1);
  });
}

module.exports = {
  BC_PORT,
  BC_PROFILE_DIR,
  launchBrandConnectBrowser,
  checkBrandConnectStatus
};
