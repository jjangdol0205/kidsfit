#!/usr/bin/env node
/**
 * MoneyFit Naver Brand Connect (Shopping Connect) Daily Revenue & Channel Performance Reporter
 * (수달 본부장 🦦 — 네이버 브랜드커넥트 커머스 본부 B계정 전담 일일 보고 엔진)
 *
 * - Scrapes live metrics from Account B (`expertise333`, Workspace `989959114454560`)
 *   via isolated Chrome container on Port 9223 (`/affiliate/sales-dashboard`).
 * - Persists snapshot to `logs/brandconnect_stats.json`.
 * - Tracks B-Account 3-Channel Funnel:
 *   1) Naver Blog (`https://blog.naver.com/expertise333`)
 *   2) Naver Official Cafe (`https://cafe.naver.com/moneyfitlab` — 머니핏 생활비 살림 팩트체크 연구소)
 *   3) Naver Clip / Vertical Short-form Video (`clip.mp4` 1080x1920)
 * - Sends dedicated daily Telegram report or integrates into 06:00 KST `daily-revenue-report.js`.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const telegramNotify = require('./telegram-notify.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');
const BC_STATS_PATH = path.join(LOGS_DIR, 'brandconnect_stats.json');
const MONETIZATION_CONFIG_PATH = path.join(ROOT_DIR, 'monetization.config.json');

const WORKSPACE_ID = '989959114454560';
const SALES_DASHBOARD_URL = `https://brandconnect.naver.com/${WORKSPACE_ID}/affiliate/sales-dashboard`;
const PRODUCTS_LINK_URL = `https://brandconnect.naver.com/${WORKSPACE_ID}/affiliate/products-link`;

function getKstNow() {
  const kstMs = Date.now() + 9 * 60 * 60 * 1000;
  const d = new Date(kstMs);
  return {
    dateStr: d.toISOString().split('T')[0],
    timeStr: d.toISOString().split('T')[1].slice(0, 5),
    fullStr: d.toISOString().replace('T', ' ').slice(0, 19) + ' KST'
  };
}

function getTargets(port = 9223, timeoutMs = 2500) {
  return new Promise((resolve) => {
    try {
      const req = http.get(`http://127.0.0.1:${port}/json`, { timeout: timeoutMs }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

function connectTarget(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    const pending = new Map();
    ws.addEventListener('open', () => {
      const send = (method, params = {}) => new Promise((res, rej) => {
        const id = msgId++;
        const timer = setTimeout(() => {
          pending.delete(id);
          rej(new Error(`CDP timeout: ${method}`));
        }, 20000);
        pending.set(id, { resolve: res, reject: rej, timer });
        ws.send(JSON.stringify({ id, method, params }));
      });
      resolve({ ws, send });
    });
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        clearTimeout(p.timer);
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
        else p.resolve(msg.result);
      }
    });
    ws.addEventListener('error', reject);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Scrape live Brand Connect sales dashboard from Port 9223 if available
 */
async function scrapeLiveBrandConnectDashboard(port = 9223) {
  const targets = await getTargets(port);
  if (!targets || !Array.isArray(targets)) return null;

  const page = targets.find(t => t.type === 'page' && !t.url.startsWith('devtools://'));
  if (!page || !page.webSocketDebuggerUrl) return null;

  let conn = null;
  try {
    conn = await connectTarget(page.webSocketDebuggerUrl);
    await conn.send('Page.enable');
    await conn.send('Runtime.enable');

    await conn.send('Page.navigate', { url: SALES_DASHBOARD_URL });
    await sleep(3800);

    const evalRes = await conn.send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body ? document.body.innerText : '';
        const parseNum = (regex) => {
          const m = text.match(regex);
          if (!m) return 0;
          return Number(String(m[1]).replace(/[^0-9]/g, '')) || 0;
        };
        const updMatch = text.match(/최근 업데이트\\s*:\\s*([0-9.\\s]+)/);
        const convMatch = text.match(/전환율\\s*\\n\\s*([^\\n]+)/);
        return {
          url: location.href,
          isLoggedIn: location.href.includes('${WORKSPACE_ID}'),
          lastUpdated: updMatch ? updMatch[1].trim() : '',
          clicks: parseNum(/클릭 수\\s*\\n\\s*([0-9,]+)회/),
          orders: parseNum(/상품주문 건수\\s*\\n\\s*([0-9,]+)건/),
          conversionRate: convMatch ? convMatch[1].trim() : '0%',
          salesQty: parseNum(/판매 개수\\s*\\n\\s*([0-9,]+)개/),
          salesAmountKrw: parseNum(/판매 금액\\s*\\n\\s*([0-9,]+)원/),
          estimatedRevenueKrw: parseNum(/예상 수익\\s*\\n\\s*([0-9,]+)원/)
        };
      })()`,
      returnByValue: true
    });
    conn.ws.close();
    const val = evalRes.result ? evalRes.result.value : null;
    if (val && val.isLoggedIn) {
      return val;
    }
  } catch (e) {
    if (conn && conn.ws) {
      try { conn.ws.close(); } catch (_) {}
    }
  }
  return null;
}

/**
 * Load or build Brand Connect report payload
 */
async function buildBrandConnectDailyReport(options = {}) {
  const kst = getKstNow();
  let existing = {};
  if (fs.existsSync(BC_STATS_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(BC_STATS_PATH, 'utf8'));
    } catch (e) {}
  }

  let liveMetrics = null;
  if (options.scrapeLive !== false) {
    liveMetrics = await scrapeLiveBrandConnectDashboard(9223);
  }

  let configLinks = [];
  if (fs.existsSync(MONETIZATION_CONFIG_PATH)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(MONETIZATION_CONFIG_PATH, 'utf8'));
      const catalog = cfg.naverBrandConnect?.shoppingConnectCatalog || {};
      Object.keys(catalog).forEach(cat => {
        (catalog[cat].items || []).forEach(item => {
          configLinks.push({
            category: cat,
            title: item.title,
            shortUrl: item.shortUrl,
            commissionRate: item.commissionRate,
            expectedCommission: item.expectedCommission
          });
        });
      });
    } catch (e) {}
  }

  const metrics = liveMetrics || existing.metrics || {
    isLoggedIn: true,
    lastUpdated: kst.dateStr.replace(/-/g, '. '),
    clicks: 0,
    orders: 0,
    conversionRate: '0%',
    salesQty: 0,
    salesAmountKrw: 0,
    estimatedRevenueKrw: 0
  };

  const channels = Object.assign(
    {
      accountB: 'expertise333 (better_life333)',
      workspaceId: WORKSPACE_ID,
      blogUrl: 'https://blog.naver.com/expertise333',
      cafeUrl: 'https://cafe.naver.com/moneyfitlab',
      cafeName: '머니핏 생활비 살림 팩트체크 연구소',
      cafeClubId: '31805224',
      publishedBlogPosts: [
        'https://blog.naver.com/expertise333/224445565766',
        'https://blog.naver.com/expertise333/224445539447',
        'https://blog.naver.com/comedifarm/224445577716',
        'https://blog.naver.com/comedifarm/224445537618'
      ],
      publishedCafePosts: [
        'https://cafe.naver.com/moneyfitlab/2',
        'https://cafe.naver.com/moneyfitlab/3',
        'https://cafe.naver.com/moneyfitlab/4',
        'https://cafe.naver.com/moneyfitlab/5'
      ],
      publishedClips: [
        'https://cafe.naver.com/moneyfitlab/5',
        'https://blog.naver.com/comedifarm/224445577716'
      ]
    },
    existing.channels || {},
    options.channelsOverride || {}
  );

  const reportData = {
    updatedAt: new Date().toISOString(),
    updatedAtKst: kst.fullStr,
    dateStr: kst.dateStr,
    timeStr: kst.timeStr,
    team: {
      department: '네이버 브랜드커넥트 커머스 본부 (B계정 전담팀)',
      lead: '🦦 수달 본부장 (brandconnect-revenue-lead)',
      members: [
        '🦦 수달 본부장 (브랜드커넥트 고단가 상품 소싱 & 일일 실적 총괄)',
        '🎬 앵무새 피디 (B계정 네이버 클립 9:16 숏폼 웹툰 배포)',
        '🦔 고슴도치 대리 (B계정 블로그 & 전용 카페 moneyfitlab 웹툰+쇼핑커넥트 발행)'
      ]
    },
    metrics,
    activeLinksCount: Math.max(7, configLinks.length),
    configLinks,
    channels
  };

  fs.mkdirSync(LOGS_DIR, { recursive: true });
  fs.writeFileSync(BC_STATS_PATH, JSON.stringify(reportData, null, 2) + '\n', 'utf8');
  return reportData;
}

function formatBrandConnectTelegramHtml(data) {
  const esc = telegramNotify.escapeHtml;
  const m = data.metrics || {};
  const ch = data.channels || {};
  const blogCount = (ch.publishedBlogPosts || []).length;
  const cafeCount = (ch.publishedCafePosts || []).length;
  const clipCount = (ch.publishedClips || []).length;

  return [
    `🦦 <b>[네이버 브랜드커넥트 전담팀 (B계정 expertise333) 일일 실적 &amp; 3대 채널 보고]</b>`,
    `🕒 <b>보고 기준</b>: <code>${esc(data.dateStr)} ${esc(data.timeStr)} KST</code> (집계일: <code>${esc(m.lastUpdated || data.dateStr)}</code>)`,
    `👤 <b>총괄 책임</b>: <b>🦦 수달 본부장</b> (네이버 브랜드커넥트 커머스 본부)`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 <b>1. 브랜드커넥트(쇼핑커넥트) 실측 판매 실적 (Workspace ${esc(WORKSPACE_ID)})</b>`,
    `• <b>유입 클릭 수</b>: <b><code>${Number(m.clicks || 0).toLocaleString()}회</code></b>`,
    `• <b>상품 주문 건수</b>: <b><code>${Number(m.orders || 0).toLocaleString()}건</code></b> (전환율 <code>${esc(m.conversionRate || '0%')}</code>)`,
    `• <b>실제 판매 금액</b>: <b><code>${Number(m.salesAmountKrw || 0).toLocaleString()}원</code></b> (판매 <code>${Number(m.salesQty || 0)}개</code>)`,
    `• <b>확정/예상 수수료 수익</b>: <b><code>+${Number(m.estimatedRevenueKrw || 0).toLocaleString()}원</code></b>`,
    `• <b>가동 중인 전용 링크</b>: <code>7개 (ON)</code> — 로보락(건당 39,950원)·서큘레이터(8%)·닭가슴살·애사비(8%)·연어사료(8%)·블랙박스·공유기`,
    ``,
    `🚀 <b>2. B계정(expertise333) 3대 채널 (클립 · 블로그 · 전용카페) 가동 현황</b>`,
    `• 🏛️ <b>전용 네이버 카페</b>: <a href="${esc(ch.cafeUrl)}">${esc(ch.cafeName)}</a> (누적 <b><code>${cafeCount}건</code></b> 발행)`,
    `• 📝 <b>전용 네이버 블로그</b>: <a href="${esc(ch.blogUrl)}">blog.naver.com/expertise333</a> (누적 <b><code>${blogCount}건</code></b> 발행)`,
    `• 🎬 <b>네이버 클립/숏폼 영상</b>: 9:16 세로형 웹툰 클립 (누적 <b><code>${clipCount}건</code></b> 발행)`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🔗 <b>브랜드커넥트 실시간 대시보드</b>:`,
    `• <a href="${SALES_DASHBOARD_URL}">[🟢 브랜드커넥트 판매실적 대시보드]</a> | <a href="${esc(ch.cafeUrl)}">[🏛️ 머니핏 공식 네이버 카페]</a>`
  ].join('\n');
}

async function sendBrandConnectDailyReport(options = {}) {
  const data = await buildBrandConnectDailyReport(options);
  const customHtml = formatBrandConnectTelegramHtml(data);
  const tgRes = await telegramNotify.sendTelegramReport({}, {
    dryRun: Boolean(options.dryRun),
    customHtml
  });
  return { ok: true, sent: tgRes.sent, mode: tgRes.mode, data };
}

if (require.main === module) {
  const isSend = process.argv.includes('--send');
  const isDryRun = process.argv.includes('--dry-run');
  if (isSend || isDryRun) {
    sendBrandConnectDailyReport({ dryRun: isDryRun })
      .then(res => {
        console.log(`[BrandConnect Daily Report] Sent=${res.sent} Mode=${res.mode}`);
        process.exit(0);
      })
      .catch(err => {
        console.error('[BrandConnect Daily Report Error]:', err.message);
        process.exit(1);
      });
  } else {
    buildBrandConnectDailyReport()
      .then(data => {
        console.log(JSON.stringify(data, null, 2));
        process.exit(0);
      })
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  }
}

module.exports = {
  buildBrandConnectDailyReport,
  formatBrandConnectTelegramHtml,
  sendBrandConnectDailyReport,
  SALES_DASHBOARD_URL,
  PRODUCTS_LINK_URL
};
