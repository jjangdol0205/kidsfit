#!/usr/bin/env node
/**
 * MoneyFit Production Web Server (Zero-Dependency Native HTTP Server + Real-Time Visitor Analytics + 06:00 KST Daily Telegram Briefing)
 *
 * Designed for Render.com (`truthofmarket.com` / `truth-of-market.onrender.com`),
 * Railway, Fly.io, or local hosting (`npm start` / `node server.js`).
 *
 * Features:
 * - Serves pre-rendered `dist/` static files and `/preset/:slug` clean URLs
 * - Hardened security: blocks `.env`, `server.js`, `logs/*`, `scripts/*`, `tests/*`, `package.json`, `monetization.config.json` with 403 Forbidden
 * - Applies HTTP Security Headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-XSS-Protection`)
 * - Built-in KST Daily Visitor, Search Bot, & Affiliate Channel Click Analytics Engine (`/api/stats` & `/api/track`)
 * - Built-in 06:00 AM KST Automated Telegram Daily Briefing (Visitors + Coupang/LinkPrice Sales & Net Revenue)
 * - Provides `/health` and `/api/status` endpoints for uptime monitors
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');
const STATS_FILE = path.join(LOGS_DIR, 'visitor_stats.json');
const PORT = Number(process.env.PORT) || 3000;

// DoS & Memory/Disk Protection Caps
const MAX_DAYS = 30;
const MAX_PAGES_PER_DAY = 200;
const MAX_UV_HASHES_PER_DAY = 10000;

// Standard HTTP Security Headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block'
};

// Ensure dist/ is built before serving
if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  try {
    const ssgBuilder = require('./scripts/build-ssg.js');
    if (ssgBuilder && typeof ssgBuilder.build === 'function') {
      ssgBuilder.build();
    }
  } catch (e) {
    console.warn('[Server] SSG auto-build warning:', e.message);
  }
}

// ---------------------------------------------------------------
// Real-Time KST Daily Visitor & Affiliate Channel Analytics Store
// ---------------------------------------------------------------
function getKstDateInfo() {
  const kstMs = Date.now() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstMs);
  const dateStr = kstDate.toISOString().split('T')[0];
  const hour = kstDate.getUTCHours();
  const minute = kstDate.getUTCMinutes();
  return { dateStr, hour, minute };
}

function getKstDateString() {
  return getKstDateInfo().dateStr;
}

const DEFAULT_SLOTS = () => ({
  input_bridge: 0,
  metric_card: 0,
  receipt_cart: 0,
  cpa_card: 0,
  deal_card: 0,
  preset_table: 0,
  sticky_mobile: 0,
  other: 0
});

const DEFAULT_CALCS = () => ({
  electric: 0,
  diet: 0,
  pet: 0,
  room: 0,
  auto: 0,
  telecom: 0,
  other: 0
});

let analyticsStore = {
  startedAt: new Date().toISOString(),
  totalPageViews: 0,
  totalUniqueVisitors: 0,
  totalBotCrawls: 0,
  totalAffiliateClicks: 0,
  totalClicksByChannel: { coupang: 0, linkprice: 0, cpa: 0, sticky_mobile: 0 },
  totalClicksBySlot: DEFAULT_SLOTS(),
  totalClicksByCalc: DEFAULT_CALCS(),
  lastDailyReportDate: '',
  days: {}
};

try {
  if (fs.existsSync(STATS_FILE)) {
    const loaded = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    if (loaded && typeof loaded === 'object') {
      analyticsStore = {
        ...analyticsStore,
        ...loaded,
        totalClicksByChannel: Object.assign(
          { coupang: 0, linkprice: 0, cpa: 0, sticky_mobile: 0 },
          loaded.totalClicksByChannel || {}
        ),
        totalClicksBySlot: Object.assign(DEFAULT_SLOTS(), loaded.totalClicksBySlot || {}),
        totalClicksByCalc: Object.assign(DEFAULT_CALCS(), loaded.totalClicksByCalc || {}),
        days: loaded.days || {}
      };
    }
  }
} catch (e) {
  // Ignore corrupted stats file
}

const dailyUvSets = {}; // dateStr -> Set of visitor hashes

function pruneOldAnalyticsDays() {
  const dayKeys = Object.keys(analyticsStore.days).sort();
  while (dayKeys.length > MAX_DAYS) {
    const oldest = dayKeys.shift();
    delete analyticsStore.days[oldest];
    delete dailyUvSets[oldest];
  }
}

function ensureDayBucket(dateStr) {
  if (!analyticsStore.days[dateStr]) {
    analyticsStore.days[dateStr] = {
      uniqueVisitors: 0,
      pageViews: 0,
      botCrawls: 0,
      affiliateClicks: 0,
      clicksByChannel: { coupang: 0, linkprice: 0, cpa: 0, sticky_mobile: 0 },
      clicksBySlot: DEFAULT_SLOTS(),
      clicksByCalc: DEFAULT_CALCS(),
      botsByEngine: { naver: 0, google: 0, bing: 0, ai: 0, other: 0 },
      pages: {}
    };
    pruneOldAnalyticsDays();
  }
  if (!analyticsStore.days[dateStr].clicksByChannel) {
    analyticsStore.days[dateStr].clicksByChannel = { coupang: 0, linkprice: 0, cpa: 0, sticky_mobile: 0 };
  }
  if (!analyticsStore.days[dateStr].clicksBySlot) {
    analyticsStore.days[dateStr].clicksBySlot = DEFAULT_SLOTS();
  }
  if (!analyticsStore.days[dateStr].clicksByCalc) {
    analyticsStore.days[dateStr].clicksByCalc = DEFAULT_CALCS();
  }
  if (!dailyUvSets[dateStr]) {
    dailyUvSets[dateStr] = new Set();
  }
  return analyticsStore.days[dateStr];
}

function saveAnalyticsToDisk() {
  try {
    if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
    fs.writeFileSync(STATS_FILE, JSON.stringify(analyticsStore, null, 2) + '\n', 'utf8');
  } catch (e) {
    // Ignore write errors
  }
}

function sanitizeTrackPath(p) {
  const s = String(p || '/').split('?')[0].trim().slice(0, 140);
  if (!s.startsWith('/')) return '/';
  return s === '/index.html' ? '/' : s;
}

function recordVisit(req, cleanPath, eventType = 'pageview', extra = {}) {
  const dateStr = getKstDateString();
  const bucket = ensureDayBucket(dateStr);

  const ua = String(req.headers['user-agent'] || '');
  const forwarded = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();

  if (eventType === 'click') {
    bucket.affiliateClicks += 1;
    analyticsStore.totalAffiliateClicks += 1;

    const rawChannel = String(extra.channel || 'coupang').toLowerCase().replace(/[^a-z0-9_]/g, '');
    const normChannel = ['coupang', 'linkprice', 'cpa', 'sticky_mobile'].includes(rawChannel)
      ? rawChannel
      : 'coupang';

    bucket.clicksByChannel[normChannel] = (bucket.clicksByChannel[normChannel] || 0) + 1;
    analyticsStore.totalClicksByChannel[normChannel] = (analyticsStore.totalClicksByChannel[normChannel] || 0) + 1;

    const rawSlot = String(extra.slot || (normChannel === 'sticky_mobile' ? 'sticky_mobile' : 'deal_card'))
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    const normSlot = [
      'input_bridge',
      'metric_card',
      'receipt_cart',
      'cpa_card',
      'deal_card',
      'preset_table',
      'sticky_mobile'
    ].includes(rawSlot)
      ? rawSlot
      : 'other';

    bucket.clicksBySlot[normSlot] = (bucket.clicksBySlot[normSlot] || 0) + 1;
    analyticsStore.totalClicksBySlot[normSlot] = (analyticsStore.totalClicksBySlot[normSlot] || 0) + 1;

    const rawCalc = String(extra.calc || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    const normCalc = ['electric', 'diet', 'pet', 'room', 'auto', 'telecom'].includes(rawCalc) ? rawCalc : 'other';
    bucket.clicksByCalc[normCalc] = (bucket.clicksByCalc[normCalc] || 0) + 1;
    analyticsStore.totalClicksByCalc[normCalc] = (analyticsStore.totalClicksByCalc[normCalc] || 0) + 1;

    saveAnalyticsToDisk();
    return;
  }

  // Classify search engine bots vs human visitors
  const isBot = /bot|crawl|spider|slurp|yeti|daum|bingpreview|mediapartners|facebookexternalhit|gptbot|perplexity|claudebot|bytespider|indexnow/i.test(
    ua
  );

  if (isBot) {
    bucket.botCrawls += 1;
    analyticsStore.totalBotCrawls += 1;
    if (/yeti|naver/i.test(ua)) bucket.botsByEngine.naver += 1;
    else if (/google/i.test(ua)) bucket.botsByEngine.google += 1;
    else if (/bing/i.test(ua)) bucket.botsByEngine.bing += 1;
    else if (/gpt|perplexity|claude|anthropic|openai/i.test(ua)) bucket.botsByEngine.ai += 1;
    else bucket.botsByEngine.other += 1;
    return;
  }

  // Human visitor tracking (bounded UV hash set per day)
  const visitorHash = crypto.createHash('sha1').update(`${forwarded}|${ua}`).digest('hex').slice(0, 12);
  if (!dailyUvSets[dateStr].has(visitorHash)) {
    if (dailyUvSets[dateStr].size < MAX_UV_HASHES_PER_DAY) {
      dailyUvSets[dateStr].add(visitorHash);
    }
    bucket.uniqueVisitors += 1;
    analyticsStore.totalUniqueVisitors += 1;
  }

  bucket.pageViews += 1;
  analyticsStore.totalPageViews += 1;

  const normPage = sanitizeTrackPath(cleanPath);
  const pageKeys = Object.keys(bucket.pages);
  if (bucket.pages[normPage] !== undefined || pageKeys.length < MAX_PAGES_PER_DAY) {
    bucket.pages[normPage] = (bucket.pages[normPage] || 0) + 1;
  } else {
    bucket.pages['/_other'] = (bucket.pages['/_other'] || 0) + 1;
  }
}

function getStatsPayload() {
  const todayStr = getKstDateString();
  const today = ensureDayBucket(todayStr);

  const topPages = Object.entries(today.pages || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([page, views]) => ({ page, views }));

  const recentDates = Object.keys(analyticsStore.days).sort().slice(-7);
  const recentHistory = {};
  recentDates.forEach(d => {
    const b = analyticsStore.days[d];
    recentHistory[d] = {
      uniqueVisitors: b.uniqueVisitors,
      pageViews: b.pageViews,
      botCrawls: b.botCrawls,
      affiliateClicks: b.affiliateClicks,
      clicksByChannel: b.clicksByChannel || { coupang: 0, linkprice: 0, cpa: 0, sticky_mobile: 0 },
      clicksBySlot: b.clicksBySlot || DEFAULT_SLOTS()
    };
  });

  const todayCtr = today.uniqueVisitors > 0 ? Number(((today.affiliateClicks / today.uniqueVisitors) * 100).toFixed(2)) : 0;
  const totalCtr = analyticsStore.totalUniqueVisitors > 0
    ? Number(((analyticsStore.totalAffiliateClicks / analyticsStore.totalUniqueVisitors) * 100).toFixed(2))
    : 0;

  const findTopKey = (obj) => {
    let bestKey = 'receipt_cart';
    let bestVal = -1;
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (v > bestVal) {
        bestVal = v;
        bestKey = k;
      }
    });
    return bestVal > 0 ? `${bestKey}(${bestVal})` : '집계중';
  };

  const totalCpClicks = analyticsStore.totalClicksByChannel.coupang || 0;
  const totalLpClicks = analyticsStore.totalClicksByChannel.linkprice || 0;
  const totalCpaClicks = analyticsStore.totalClicksByChannel.cpa || 0;
  const estNetKrw = Math.round(totalCpClicks * 45000 * 0.045 * 0.03 + totalLpClicks * 120000 * 0.035 * 0.04 + totalCpaClicks * 1500);
  const octoberGoalKrw = 1000000;

  const totalsObj = {
    uniqueVisitors: analyticsStore.totalUniqueVisitors,
    pageViews: analyticsStore.totalPageViews,
    botCrawls: analyticsStore.totalBotCrawls,
    affiliateClicks: analyticsStore.totalAffiliateClicks,
    ctrPercent: totalCtr,
    clicksByChannel: analyticsStore.totalClicksByChannel,
    clicksBySlot: analyticsStore.totalClicksBySlot,
    clicksByCalc: analyticsStore.totalClicksByCalc,
    topSlot: findTopKey(analyticsStore.totalClicksBySlot),
    topCalc: findTopKey(analyticsStore.totalClicksByCalc)
  };

  return {
    status: 'ok',
    domain: 'https://truthofmarket.com',
    dateKst: todayStr,
    startedAt: analyticsStore.startedAt,
    lastDailyReportDate: analyticsStore.lastDailyReportDate || null,
    today: {
      uniqueVisitors: today.uniqueVisitors,
      pageViews: today.pageViews,
      botCrawls: today.botCrawls,
      affiliateClicks: today.affiliateClicks,
      ctrPercent: todayCtr,
      clicksByChannel: today.clicksByChannel,
      clicksBySlot: today.clicksBySlot,
      clicksByCalc: today.clicksByCalc,
      botsByEngine: today.botsByEngine,
      topPages
    },
    total: totalsObj,
    totals: totalsObj,
    revenueGoal: {
      octoberGoalKrw,
      monthlyGrowthTarget: '+100% MoM',
      roadmap: {
        oct2026: 1000000,
        nov2026: 2000000,
        dec2026: 4000000,
        jan2027: 8000000
      },
      estCommissionKrw: estNetKrw,
      goalAchievementPercent: Number(((estNetKrw / octoberGoalKrw) * 100).toFixed(2)),
      remainingKrw: Math.max(0, octoberGoalKrw - estNetKrw)
    },
    recentHistory
  };
}

// ---------------------------------------------------------------
// 06:00 AM KST Automated Daily Telegram Briefing Scheduler
// ---------------------------------------------------------------
let lastManualReportTimestamp = 0;

async function triggerDailyReport(forceSend = false) {
  try {
    const dailyReporter = require('./scripts/daily-revenue-report.js');
    const statsPayload = getStatsPayload();
    const res = await dailyReporter.sendDailyMorningBriefing(statsPayload, { dryRun: !forceSend });
    if (forceSend && res.sent) {
      analyticsStore.lastDailyReportDate = getKstDateString();
      saveAnalyticsToDisk();
    }
    return res;
  } catch (err) {
    console.warn('[Server] Daily report dispatch error:', err.message);
    return { ok: false, sent: false, error: err.message };
  }
}

function checkAndSendDailyKstReport() {
  const { dateStr, hour } = getKstDateInfo();
  // Automatically send at 06:00 AM KST once per day
  if (hour === 6 && analyticsStore.lastDailyReportDate !== dateStr) {
    analyticsStore.lastDailyReportDate = dateStr;
    saveAnalyticsToDisk();
    triggerDailyReport(true).catch(() => {});
  }
}

// Check every 60 seconds for 06:00 AM KST trigger
setInterval(checkAndSendDailyKstReport, 60000).unref();

// ---------------------------------------------------------------
// Security Path Validation & Static File Resolution
// ---------------------------------------------------------------
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function safeDecodeURI(raw) {
  try {
    return decodeURIComponent(raw || '/');
  } catch (e) {
    return null;
  }
}

function isForbiddenRequestPath(cleanUrlPath) {
  const rel = String(cleanUrlPath || '/').replace(/\\/g, '/').replace(/^\/+/, '');
  const lower = rel.toLowerCase();
  if (!lower) return false;
  if (lower.includes('..') || lower.includes('\0')) return true;

  const segments = lower.split('/');
  if (segments.some(seg => seg.startsWith('.'))) return true; // blocks .env, .git, .gitignore

  const forbiddenPrefixes = ['logs/', 'scripts/', 'tests/', 'node_modules/', 'viral-content/', 'backlog_human_posts/', 'sns_outbox/'];
  if (forbiddenPrefixes.some(p => lower === p.slice(0, -1) || lower.startsWith(p))) return true;

  const forbiddenExact = new Set([
    'server.js',
    'package.json',
    'package-lock.json',
    'monetization.config.json',
    'render.yaml'
  ]);
  if (forbiddenExact.has(lower)) return true;
  if (lower.endsWith('.md') || lower.endsWith('.Bat') || lower.endsWith('.bat') || lower.endsWith('.ps1')) return true;

  return false;
}

function resolveFilePath(cleanUrlPath) {
  const cleanPath = String(cleanUrlPath || '/').replace(/\\/g, '/');

  if (cleanPath === '/' || cleanPath === '/index.html') {
    const distIdx = path.join(DIST_DIR, 'index.html');
    return fs.existsSync(distIdx) ? distIdx : path.join(ROOT_DIR, 'index.html');
  }

  const rel = cleanPath.replace(/^\/+/, '');
  const ext = path.extname(rel).toLowerCase();
  if (ext && !MIME_TYPES[ext]) {
    return null;
  }

  // 1. Check inside dist/
  const candidateDist = path.resolve(DIST_DIR, rel);
  if (candidateDist.startsWith(DIST_DIR + path.sep) && fs.existsSync(candidateDist)) {
    const stat = fs.statSync(candidateDist);
    if (stat.isDirectory()) {
      const idx = path.join(candidateDist, 'index.html');
      if (fs.existsSync(idx)) return idx;
    } else if (stat.isFile()) {
      return candidateDist;
    }
  }

  // 2. Clean URL support for /preset/{slug} -> dist/preset/{slug}/index.html
  const htmlDist = path.resolve(DIST_DIR, `${rel}.html`);
  if (htmlDist.startsWith(DIST_DIR + path.sep) && fs.existsSync(htmlDist)) {
    return htmlDist;
  }

  // 3. Strictly allow only /src/* and /sns/* public frontend assets from ROOT_DIR if not in dist/
  if (rel.startsWith('src/') || rel.startsWith('sns/')) {
    const allowedPrefix = rel.startsWith('src/') ? 'src' : 'sns';
    const candidateAsset = path.resolve(ROOT_DIR, rel);
    const assetRoot = path.join(ROOT_DIR, allowedPrefix) + path.sep;
    if (candidateAsset.startsWith(assetRoot) && fs.existsSync(candidateAsset) && fs.statSync(candidateAsset).isFile()) {
      return candidateAsset;
    }
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  const reqUrl = req.url || '/';
  const [rawPath, rawQuery] = reqUrl.split('?');
  const cleanUrlPath = safeDecodeURI(rawPath || '/');

  if (!cleanUrlPath) {
    res.writeHead(400, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  // 0. Block sensitive server files, configs, logs, and dot-files with 403 Forbidden
  if (isForbiddenRequestPath(cleanUrlPath)) {
    res.writeHead(403, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  // 1. Health check endpoint for Render.com / uptime monitoring
  if (cleanUrlPath === '/health' || cleanUrlPath === '/api/status') {
    res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'MoneyFit Portal (truthofmarket.com)',
        dailyBriefingSchedule: '06:00 KST',
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  // 2. Real-time Visitor & Bot Analytics API
  if (cleanUrlPath === '/api/stats') {
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(getStatsPayload(), null, 2));
    return;
  }

  // 3. Client-side Analytics & Affiliate Click Beacon (/api/track?type=pageview|click&channel=coupang|linkprice|cpa&calc=...&slot=...&p=/path)
  if (cleanUrlPath === '/api/track') {
    const params = new URLSearchParams(rawQuery || '');
    const evType = params.get('type') || 'pageview';
    const targetPage = params.get('p') || '/';
    const channel = params.get('channel') || '';
    const calc = params.get('calc') || '';
    const slot = params.get('slot') || '';
    recordVisit(req, targetPage, evType, { channel, calc, slot });
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(getStatsPayload()));
    return;
  }

  // 4. 06:00 AM KST Daily Revenue Briefing API (/api/daily-report or /api/daily-report?send=1)
  if (cleanUrlPath === '/api/daily-report') {
    const params = new URLSearchParams(rawQuery || '');
    const wantSend = params.get('send') === '1' || params.get('send') === 'true';
    const nowMs = Date.now();
    const canSend = wantSend && (nowMs - lastManualReportTimestamp > 15000);
    if (canSend) {
      lastManualReportTimestamp = nowMs;
    }
    const result = await triggerDailyReport(canSend);
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(result, null, 2));
    return;
  }

  // 5. Automatic zero-upload ownership verification for Naver SearchAdvisor & Google Search Console
  const naverMatch = cleanUrlPath.match(/^\/(naver[a-zA-Z0-9_-]+\.html)$/);
  if (naverMatch) {
    res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`naver-site-verification: ${naverMatch[1]}`);
    return;
  }
  const googleMatch = cleanUrlPath.match(/^\/(google[a-zA-Z0-9_-]+\.html)$/);
  if (googleMatch) {
    res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`google-site-verification: ${googleMatch[1]}`);
    return;
  }

  const filePath = resolveFilePath(cleanUrlPath);
  if (!filePath) {
    // Only fall back to SPA index.html for extensionless routes; return 404 for missing static files
    const reqExt = path.extname(cleanUrlPath);
    if (reqExt && reqExt !== '.html') {
      res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const fallback = fs.existsSync(path.join(DIST_DIR, 'index.html'))
      ? path.join(DIST_DIR, 'index.html')
      : path.join(ROOT_DIR, 'index.html');
    if (fs.existsSync(fallback)) {
      recordVisit(req, cleanUrlPath, 'pageview');
      res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(fallback).pipe(res);
      return;
    }
    res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Count HTML page views & XML/txt bot crawls automatically
  if (ext === '.html' || ext === '.xml' || cleanUrlPath === '/llms.txt') {
    recordVisit(req, cleanUrlPath, 'pageview');
  }

  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': contentType,
    'Cache-Control': ext === '.html' ? 'public, max-age=60' : 'public, max-age=86400'
  });
  fs.createReadStream(filePath).pipe(res);
});

// Periodically flush stats to disk every 30s
setInterval(saveAnalyticsToDisk, 30000).unref();

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MoneyFit Portal Live Server running on http://0.0.0.0:${PORT} (https://truthofmarket.com)`);
  });
}

module.exports = server;
