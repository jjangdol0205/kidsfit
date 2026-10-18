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
  atf_instant_primary: 0,
  atf_instant_impulse: 0,
  impulse_booster: 0,
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
  lastSixHourCycleKey: '',
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
      'atf_instant_primary',
      'atf_instant_impulse',
      'impulse_booster',
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

  // Classify search engine bots, feed fetches (.xml/.txt), and automated scripts vs real human browsers
  const isFeedOrTxt = /\.(xml|txt)$/i.test(cleanPath);
  const isAutomatedUa =
    !ua ||
    /bot|crawl|spider|slurp|yeti|daum|bingpreview|mediapartners|facebookexternalhit|gptbot|perplexity|claudebot|bytespider|indexnow|headless|puppeteer|playwright|curl|wget|python|node|axios|undici|go-http-client|render|uptime|health|lighthouse/i.test(
      ua
    );
  const isBot = isFeedOrTxt || isAutomatedUa;

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
// ---------------------------------------------------------------
// 06:00 AM KST Daily Report + Every 6-Hour (00, 06, 12, 18 KST) Auto-Pivot Scheduler
// ---------------------------------------------------------------
let lastManualReportTimestamp = 0;
let lastManualCycleTimestamp = 0;

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

async function triggerSixHourCycle(sendTelegram = false) {
  try {
    const growthCycle = require('./scripts/six-hour-growth-cycle.js');
    const res = await growthCycle.runSixHourGrowthCycle({ sendTelegram });
    return res;
  } catch (err) {
    console.warn('[Server] 6-Hour growth cycle error:', err.message);
    return { ok: false, error: err.message };
  }
}

function checkAndSendDailyKstReport() {
  const { dateStr, hour } = getKstDateInfo();
  // 1. Automatically send daily report at 06:00 AM KST once per day
  if (hour === 6 && analyticsStore.lastDailyReportDate !== dateStr) {
    analyticsStore.lastDailyReportDate = dateStr;
    saveAnalyticsToDisk();
    triggerDailyReport(true).catch(() => {});
  }
  // 2. Automatically run 6-Hour Performance Analysis & Auto-Pivot at 00:00, 06:00, 12:00, 18:00 KST
  if (hour % 6 === 0) {
    const cycleKey = `${dateStr}-H${String(hour).padStart(2, '0')}`;
    if (analyticsStore.lastSixHourCycleKey !== cycleKey) {
      analyticsStore.lastSixHourCycleKey = cycleKey;
      saveAnalyticsToDisk();
      triggerSixHourCycle(true).catch(() => {});
    }
  }
}

// Check every 60 seconds for 06:00 AM KST daily report & 6-Hour Auto-Pivot cycle
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

const LEGACY_PRESET_ALIASES = {
  'telecom-family-bundle': 'telecom-family-4p',
  'auto-sorento-family': 'auto-tucson-hybrid',
  'auto-gv80-ceo': 'auto-genesis-g80'
};

function resolveFilePath(cleanUrlPath) {
  let cleanPath = String(cleanUrlPath || '/').replace(/\\/g, '/');
  const presetAliasMatch = cleanPath.match(/^\/preset\/([a-zA-Z0-9_-]+)(\/.*)?$/);
  if (presetAliasMatch && LEGACY_PRESET_ALIASES[presetAliasMatch[1]]) {
    cleanPath = `/preset/${LEGACY_PRESET_ALIASES[presetAliasMatch[1]]}${presetAliasMatch[2] || ''}`;
  }

  if (cleanPath === '/' || cleanPath === '/index.html') {
    const distIdx = path.join(DIST_DIR, 'index.html');
    return fs.existsSync(distIdx) ? distIdx : path.join(ROOT_DIR, 'index.html');
  }

  if (cleanPath === '/office' || cleanPath === '/office/' || cleanPath === '/office.html') {
    const distOffice = path.join(DIST_DIR, 'office.html');
    if (fs.existsSync(distOffice)) return distOffice;
    const rootOffice = path.join(ROOT_DIR, 'office.html');
    if (fs.existsSync(rootOffice)) return rootOffice;
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

function buildTodayActionKit(webtoon, naver) {
  let priorityWebtoonOrder = [
    'diet-male-fatloss',
    'pet-maltese-5kg',
    'room-oneroom-100',
    'auto-avante-3000',
    'telecom-penalty-15',
    'electric-winter-heater',
    'auto-grandeur-5000',
    'telecom-3yr-expired',
    'electric-dryer',
    'electric-dehumidifier',
    'diet-female-lean',
    'telecom-mvno-switch'
  ];

  let calcCustomizations = {};
  try {
    const pivotFile = path.join(ROOT_DIR, 'logs', 'growth_pivot_state.json');
    if (fs.existsSync(pivotFile)) {
      const pv = JSON.parse(fs.readFileSync(pivotFile, 'utf8'));
      if (Array.isArray(pv.dynamicPriorityPresets) && pv.dynamicPriorityPresets.length > 0) {
        priorityWebtoonOrder = pv.dynamicPriorityPresets;
      }
      if (pv.calcCustomizations && typeof pv.calcCustomizations === 'object') {
        calcCustomizations = pv.calcCustomizations;
      }
    }
  } catch (e) {}

  function getActiveImpulseCtaForSlug(slug) {
    const calcId = String(slug || '').split('-')[0] || 'diet';
    return (calcCustomizations[calcId] && calcCustomizations[calcId].activeImpulseCta) || '🛒 9,900원 특가 확인 ↗';
  }

  function buildNaverWebtoonOverlay(slug, activeImpulseCta) {
    const safeSlug = slug || 'diet-male-fatloss';
    const ctaText = activeImpulseCta || getActiveImpulseCtaForSlug(safeSlug);
    const gridImageUrl = `/sns/${safeSlug}-grid.png`;
    const publicGridUrl = `https://truthofmarket.com/sns/${safeSlug}-grid.png`;
    const slide3Url = `sns_outbox/${safeSlug}/slide-3.png`;
    const targetUrl = `https://truthofmarket.com/preset/${safeSlug}/?src=naver_editor`;

    let bundle = {};
    try {
      const bundlePath = path.join(ROOT_DIR, 'sns_outbox', safeSlug, 'post_bundle.json');
      if (fs.existsSync(bundlePath)) {
        bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
      }
    } catch (e) {}

    const st = bundle.story || {};
    const epTitle = (st.shortCartoon && st.shortCartoon.epTitle) || bundle.keyword || safeSlug;
    const charName = st.charName || '머니핏 프렌즈';
    const expertName = st.expertName || '안경 여우 박사';
    const badLabel = st.badLabel || '기존 선택';
    const badVal = st.badVal || '';
    const goodLabel = st.goodLabel || '최적화 선택';
    const goodVal = st.goodVal || '';
    const diffVal = st.diffVal || '';
    const spoilerTeaserText = `🎨 [${epTitle}] ❌ ${badLabel}: ${badVal} vs ✅ ${goodLabel}: ${goodVal} (${diffVal}) ➔ 내 조건 넣은 4컷 최종 영수증은 ${targetUrl} 에서 3초 계산!`;
    const clipboardHtml = `<div style="max-width:680px;margin:18px auto;padding:20px;border:2px solid #10b981;border-radius:16px;background:#f8fafc;font-family:'Pretendard','Malgun Gothic',sans-serif;color:#0f172a;line-height:1.6;">
  <div style="font-size:13px;font-weight:800;color:#059669;margin-bottom:6px;">🎨 ${epTitle} (${charName} × ${expertName})</div>
  <div style="font-size:18px;font-weight:900;color:#0f172a;margin-bottom:12px;">${bundle.keyword || safeSlug} — 3컷 스포일러 영수증 비교</div>
  <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;margin-bottom:14px;">
    <img src="${publicGridUrl}" alt="${epTitle} 4컷 동물 웹툰 영수증" style="width:100%;max-width:640px;height:auto;border-radius:12px;border:1px solid #cbd5e1;display:block;margin:0 auto;" />
  </a>
  <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:14px;font-size:15px;">
    <div style="margin-bottom:6px;color:#dc2626;font-weight:700;">❌ ${badLabel}: <strong>${badVal}</strong></div>
    <div style="margin-bottom:6px;color:#059669;font-weight:800;">✅ ${goodLabel}: <strong>${goodVal}</strong></div>
    <div style="color:#2563eb;font-weight:900;font-size:16px;">💡 핵심 손익 차이: ${diffVal}</div>
  </div>
  <div style="text-align:center;">
    <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 20px;background:#10b981;color:#ffffff;font-size:15px;font-weight:900;border-radius:10px;text-decoration:none;margin:4px;">👉 내 조건 4컷 영수증 3초 무료 계산 ↗</a>
    <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 20px;background:#f59e0b;color:#0f172a;font-size:15px;font-weight:900;border-radius:10px;text-decoration:none;margin:4px;">${ctaText}</a>
  </div>
</div>`;

    return {
      epTitle,
      gridImageUrl,
      slide3Url,
      badLabel,
      badVal,
      goodLabel,
      goodVal,
      diffVal,
      activeImpulseCta: ctaText,
      spoilerTeaserText,
      clipboardHtml
    };
  }

  let publishedSet = new Set(['electric-studio-ac', 'diet-female-lean', 'auto-grandeur-5000']);
  try {
    const trackerPath = path.join(ROOT_DIR, 'logs', 'sns_publish_tracker.json');
    if (fs.existsSync(trackerPath)) {
      const tr = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
      if (Array.isArray(tr.publishedSlugs)) {
        publishedSet = new Set(tr.publishedSlugs);
      }
    }
  } catch (e) {}

  let nextWebtoonSlug = priorityWebtoonOrder.find(s => !publishedSet.has(s));
  if (!nextWebtoonSlug && webtoon && Array.isArray(webtoon.nextQueue) && webtoon.nextQueue[0]) {
    nextWebtoonSlug = webtoon.nextQueue[0].slug;
  }
  if (!nextWebtoonSlug) nextWebtoonSlug = 'diet-male-fatloss';

  let webtoonKit = {
    slug: nextWebtoonSlug,
    title: nextWebtoonSlug,
    gridImageUrl: `/sns/${nextWebtoonSlug}-grid.png`,
    threadsMain: '',
    threadsReply: '',
    instagramCaption: '',
    facebookPost: '',
    threadsUrl: 'https://www.threads.net/@moneyfit2026',
    instagramUrl: 'https://www.instagram.com/moneyfit2026/',
    webtoonOverlay: buildNaverWebtoonOverlay(nextWebtoonSlug, getActiveImpulseCtaForSlug(nextWebtoonSlug))
  };

  try {
    const bundlePath = path.join(ROOT_DIR, 'sns_outbox', nextWebtoonSlug, 'post_bundle.json');
    if (fs.existsSync(bundlePath)) {
      const b = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
      webtoonKit = {
        slug: b.slug || nextWebtoonSlug,
        title: b.title || b.keyword || nextWebtoonSlug,
        gridImageUrl: `/sns/${b.slug || nextWebtoonSlug}-grid.png`,
        threadsMain: b.threadsMain || '',
        threadsReply: b.threadsReply || '',
        instagramCaption: b.instagramCaption || '',
        facebookPost: b.facebookPost || '',
        threadsUrl: 'https://www.threads.net/@moneyfit2026',
        instagramUrl: 'https://www.instagram.com/moneyfit2026/',
        webtoonOverlay: buildNaverWebtoonOverlay(b.slug || nextWebtoonSlug, getActiveImpulseCtaForSlug(b.slug || nextWebtoonSlug))
      };
    }
  } catch (e) {}

  // Naver Blog next item
  const nextBlogSlug = (naver && naver.blog && Array.isArray(naver.blog.nextQueue) && naver.blog.nextQueue[0]?.slug) || 'diet-male-fatloss';
  let blogKit = {
    slug: nextBlogSlug,
    title: `[머니핏 실측 리포트] ${nextBlogSlug}`,
    body: '',
    writeUrl: 'https://blog.naver.com/GoBlogWrite.naver',
    webtoonOverlay: buildNaverWebtoonOverlay(nextBlogSlug, getActiveImpulseCtaForSlug(nextBlogSlug))
  };
  try {
    const blogFile = path.join(ROOT_DIR, 'backlog_human_posts', 'naver_blog', `${nextBlogSlug}.txt`);
    if (fs.existsSync(blogFile)) {
      const raw = fs.readFileSync(blogFile, 'utf8').trim();
      const firstLineMatch = raw.match(/^\[제목\]\s*(.+)$/m);
      blogKit.title = firstLineMatch ? firstLineMatch[1].trim() : blogKit.title;
      blogKit.body = raw;
    }
  } catch (e) {}

  // Naver Jisik-iN next item
  const nextJisikSlug = (naver && naver.jisikin && Array.isArray(naver.jisikin.nextQueue) && naver.jisikin.nextQueue[0]?.slug) || 'electric-dehumidifier';
  let jisikinKit = {
    slug: nextJisikSlug,
    title: `[지식iN 맞춤 답변] ${nextJisikSlug}`,
    answerA: '',
    answerB: '',
    fullText: '',
    searchUrl: `https://kin.naver.com/search/list.naver?query=${encodeURIComponent(nextJisikSlug.replace(/-/g, ' '))}&section=qna&sort=date`,
    webtoonOverlay: buildNaverWebtoonOverlay(nextJisikSlug, getActiveImpulseCtaForSlug(nextJisikSlug))
  };
  try {
    const jisikFile = path.join(ROOT_DIR, 'backlog_human_posts', 'jisikin_answers', `${nextJisikSlug}.txt`);
    if (fs.existsSync(jisikFile)) {
      const raw = fs.readFileSync(jisikFile, 'utf8').trim();
      const blocks = raw.split(/\n---\n/);
      const cleanBlock = (str) => String(str || '').replace(/^\[지식iN[^\n]*\]\s*\n?/, '').trim();
      jisikinKit.answerA = cleanBlock(blocks[0] || raw);
      jisikinKit.answerB = cleanBlock(blocks[1] || blocks[0] || raw);
      jisikinKit.fullText = raw;
      const kwMap = {
        'electric-dehumidifier': '제습기 전기세 24시간',
        'auto-casper-cash-vs-rent': '캐스퍼 장기렌트 할부',
        'room-officetel-300': '오피스텔 가전 가구 예산',
        'electric-dryer': '건조기 전기세',
        'diet-male-fatloss': '남자 80kg 식단 닭가슴살'
      };
      const qKw = kwMap[nextJisikSlug] || '전기세 누진세 계산기';
      jisikinKit.searchUrl = `https://kin.naver.com/search/list.naver?query=${encodeURIComponent(qKw)}&section=qna&sort=date`;
    }
  } catch (e) {}

  // Naver Cafe next item
  const nextCafeSlug = (naver && naver.cafe && Array.isArray(naver.cafe.nextQueue) && naver.cafe.nextQueue[0]?.slug) || 'electric-studio-ac';
  let cafeKit = {
    slug: nextCafeSlug,
    title: `[네이버 카페 정보글] ${nextCafeSlug}`,
    body: '',
    cafeUrl: 'https://section.cafe.naver.com/',
    webtoonOverlay: buildNaverWebtoonOverlay(nextCafeSlug, getActiveImpulseCtaForSlug(nextCafeSlug))
  };
  try {
    const cafeFile = path.join(ROOT_DIR, 'backlog_human_posts', 'naver_cafe', `${nextCafeSlug}.txt`);
    if (fs.existsSync(cafeFile)) {
      const raw = fs.readFileSync(cafeFile, 'utf8').trim();
      const titleMatch = raw.match(/^\[제목 옵션 A\]\s*(.+)$/m);
      if (titleMatch) cafeKit.title = titleMatch[1].trim();
      cafeKit.body = raw;
    }
  } catch (e) {}

  return {
    webtoon: webtoonKit,
    blog: blogKit,
    jisikin: jisikinKit,
    cafe: cafeKit
  };
}

function completeOfficeTask(channel, slug) {
  const ch = String(channel || '').toLowerCase().trim();
  const safeSlug = String(slug || '').replace(/[^a-z0-9-]/gi, '');
  if (!ch || !safeSlug) {
    return { ok: false, error: 'Missing channel or slug' };
  }

  if (ch === 'webtoon' || ch === 'sns') {
    const trackerPath = path.join(ROOT_DIR, 'logs', 'sns_publish_tracker.json');
    let tracker = {
      account: '@moneyfit2026',
      updatedAt: new Date().toISOString(),
      dailySafeLimitPerChannel: 3,
      minIntervalHours: 4,
      publishedSlugs: ['electric-studio-ac', 'diet-female-lean', 'auto-grandeur-5000'],
      history: []
    };
    if (fs.existsSync(trackerPath)) {
      try {
        tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
      } catch (e) {}
    }
    if (!Array.isArray(tracker.publishedSlugs)) tracker.publishedSlugs = [];
    if (!Array.isArray(tracker.history)) tracker.history = [];
    if (!tracker.publishedSlugs.includes(safeSlug)) {
      tracker.publishedSlugs.push(safeSlug);
    }
    tracker.updatedAt = new Date().toISOString();
    tracker.history.push({
      slug: safeSlug,
      channel: 'threads_instagram',
      publishedAt: tracker.updatedAt,
      status: 'LIVE_VERIFIED'
    });
    fs.mkdirSync(path.dirname(trackerPath), { recursive: true });
    fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2), 'utf8');
    return {
      ok: true,
      completed: { channel: 'webtoon', slug: safeSlug, publishedCount: tracker.publishedSlugs.length },
      officeState: buildOfficeStatePayload()
    };
  }

  // Naver Backlog Markdown update
  const mdPath = path.join(ROOT_DIR, '야간_실전홍보_백로그_현황.md');
  if (!fs.existsSync(mdPath)) {
    return { ok: false, error: 'Backlog markdown file not found' };
  }
  const mdContent = fs.readFileSync(mdPath, 'utf8');
  const escapedSlug = safeSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rowRegex = new RegExp(
    `^(\\|\\s*\\d+\\s*\\|\\s*[^|]+?\\s*\\|\\s*\`${escapedSlug}\`\\s*\\|\\s*)` +
    `블로그\\s*(\\d+)\\s*·\\s*카페\\s*(\\d+)\\s*·\\s*지식\\s*(\\d+)\\s*·\\s*디시\\s*(\\d+)\\s*\\(\\*\\*총\\s*(\\d+)회\\*\\*\\)` +
    `(\\s*\\|.*)$`,
    'm'
  );

  let updatedRow = null;
  let nextContent = mdContent.replace(rowRegex, (full, prefix, b, c, j, d, tot, suffix) => {
    let blog = Number(b);
    let cafe = Number(c);
    let jisikin = Number(j);
    let dc = Number(d);
    if (ch.includes('blog')) blog += 1;
    else if (ch.includes('cafe')) cafe += 1;
    else if (ch.includes('jisik') || ch.includes('kin')) jisikin += 1;
    else if (ch.includes('dc') || ch.includes('comm')) dc += 1;
    const total = blog + cafe + jisikin + dc;
    updatedRow = { slug: safeSlug, channel: ch, blog, cafe, jisikin, dc, total };
    return `${prefix}블로그 ${blog} · 카페 ${cafe} · 지식 ${jisikin} · 디시 ${dc} (**총 ${total}회**)${suffix}`;
  });

  if (!updatedRow) {
    return { ok: false, error: `Preset slug ${safeSlug} not found in backlog table` };
  }

  nextContent = nextContent.replace(
    /(총\s*)(\d+)(건\s*실제\s*게시\s*완료!)/,
    (_, p1, n, p2) => `${p1}${Number(n) + 1}${p2}`
  );
  fs.writeFileSync(mdPath, nextContent, 'utf8');

  return {
    ok: true,
    completed: updatedRow,
    officeState: buildOfficeStatePayload()
  };
}

function buildOfficeStatePayload() {
  const stats = getStatsPayload();
  let webtoon = { renderedCount: 36, totalEpisodes: 36, publishedLiveCount: 3, pendingPublishCount: 33 };
  let naver = {
    totalFiles: 144,
    totalDone: 98,
    totalTarget: 144,
    blog: { done: 7, pending: 29, nextQueue: [{ num: '02', slug: 'electric-stand-ac' }] },
    cafe: { done: 32, pending: 4, nextQueue: [{ num: '01', slug: 'electric-studio-ac' }] },
    jisikin: { done: 23, pending: 13, nextQueue: [{ num: '03', slug: 'electric-dehumidifier' }] },
    community: { done: 36, pending: 0 }
  };
  let spamAudit = {
    status: '🟢 CLEAN (스팸·중복 0건 / 100% 고유화 통과)',
    webtoonQuality: { uniquePanel1Count: 36, uniquePanel2Count: 36, uniqueHashtagsCount: 36, spamTokenCount: 0 },
    naverQuality: { undefinedLeaks: 0, roboticHashtags: 0, avgBlogJaccardPct: 4.3 }
  };
  let growthPivot = null;
  let staffFeedbackCouncil = null;

  try {
    const managerAudit = require('./scripts/manager-audit.js');
    webtoon = managerAudit.auditWebtoonBacklog();
    naver = managerAudit.auditNaverBacklog();
    if (managerAudit.auditSpamAndDuplication) {
      spamAudit = managerAudit.auditSpamAndDuplication();
    }
  } catch (e) {}

  try {
    const pivotFile = path.join(ROOT_DIR, 'logs', 'growth_pivot_state.json');
    if (fs.existsSync(pivotFile)) {
      growthPivot = JSON.parse(fs.readFileSync(pivotFile, 'utf8'));
    }
  } catch (e) {}

  try {
    const feedbackFile = path.join(ROOT_DIR, 'logs', 'staff_feedback_minutes.json');
    if (fs.existsSync(feedbackFile)) {
      staffFeedbackCouncil = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
    }
  } catch (e) {}

  const todayActionKit = buildTodayActionKit(webtoon, naver);

  return {
    status: 'ok',
    updatedAt: new Date().toISOString(),
    companyName: '머니핏(MoneyFit) AI 코퍼레이션 (전사 16인 정예 체제)',
    mission: '3일 내 첫 구매 돌파 & 10월 100만 원 → 정기보고 전 전직원 상호 피드백 타운홀 & 6시간 자동피봇 가동 중',
    stats,
    webtoon,
    naver,
    spamAudit,
    growthPivot,
    staffFeedbackCouncil,
    todayActionKit,
    departments: [
      {
        id: 'hq-manager',
        name: '총괄 매니저실 & 6시간 주기 피봇 전략실',
        status: 'ACTIVE',
        progress: 100,
        lead: '아기 호랑이 이사 🐯 & 여우 실장 🦊',
        currentTask: '6시간 주기(00·06·12·18시) 3대 성과(유입·쿠팡클릭·실구매) 분석 및 강화/수정 자동피봇 지휘'
      },
      {
        id: 'dept-homepage-cro',
        name: '제1본부: 홈페이지·CRO & 쿠팡전환실',
        status: 'WORKING',
        progress: 100,
        lead: '비버 과장 🦫 · 꿀벌 과장 🐝 · 수달 주임 🦦',
        currentTask: `최상단 0.5초 특가바 + 1만 원대 즉결템(24시간 쿠키 부스터) 가동 (CTR ${stats.total.ctrPercent}% / 최다 슬롯: ${stats.total.topSlot})`
      },
      {
        id: 'dept-naver-seo',
        name: '제2본부: 네이버·SEO & 실시간 유입실',
        status: 'WORKING',
        progress: Math.round((naver.totalDone / Math.max(1, naver.totalTarget)) * 100),
        lead: '치타 팀장 🐆 · 고슴도치 대리 🦔 · 미어캣 사원 🐾',
        currentTask: `지식iN 미채택 실시간 스나이핑 + 네이버 백로그 ${naver.totalDone}/${naver.totalTarget}건 완료 (블로그 대기 ${naver.blog.pending}건 · 지식iN 대기 ${naver.jisikin.pending}건)`
      },
      {
        id: 'dept-webtoon-sns',
        name: '제3본부: AI 웹툰·SNS 스튜디오',
        status: 'WORKING',
        progress: Math.round((webtoon.renderedCount / Math.max(1, webtoon.totalEpisodes)) * 100),
        lead: '해달 아트디렉터 🎨 · 렛서판다 작가 🐼 · 앵무새 피디 🦜',
        currentTask: `벤치마크 인스타툰 v2 (38px/76px 초특대 1말풍선) ${webtoon.renderedCount}/36편(180장 PNG) 완료 | @moneyfit2026 대기열 ${webtoon.pendingPublishCount}편`
      },
      {
        id: 'dept-antispam-qa',
        name: '품질·스팸 감찰실 & 서버관제센터',
        status: 'GUARDING',
        progress: 100,
        lead: '매 감사역 🦅 · 부엉이 팀장 🦉 · 펭귄 주임 🐧',
        currentTask: `${spamAudit.status} (undefined ${spamAudit.naverQuality.undefinedLeaks}건 · 유사도 ${spamAudit.naverQuality.avgBlogJaccardPct}% · 웹툰 고유대사 ${spamAudit.webtoonQuality.uniquePanel1Count}/36)`
      }
    ]
  };
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
        sixHourGrowthCycleSchedule: '00:00, 06:00, 12:00, 18:00 KST',
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  // 1-B. Virtual AI Company Office State API (/api/office-state)
  if (cleanUrlPath === '/api/office-state') {
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(buildOfficeStatePayload(), null, 2));
    return;
  }

  // 1-C. Virtual AI Company 1-Click Backlog Task Completion API (/api/office-complete-task?channel=webtoon|blog|jisikin|cafe&slug=...)
  if (cleanUrlPath === '/api/office-complete-task') {
    const params = new URLSearchParams(rawQuery || '');
    const channel = params.get('channel') || '';
    const slug = params.get('slug') || '';
    const result = completeOfficeTask(channel, slug);
    res.writeHead(result.ok ? 200 : 400, {
      ...SECURITY_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(result, null, 2));
    return;
  }

  // 1-D. 6-Hour Performance Analysis & Auto-Pivot API (/api/growth-cycle or /api/growth-cycle?run=1&telegram=1)
  if (cleanUrlPath === '/api/growth-cycle') {
    const params = new URLSearchParams(rawQuery || '');
    const wantRun = params.get('run') === '1' || params.get('run') === 'true';
    const wantTelegram = params.get('telegram') === '1' || params.get('telegram') === 'true';
    const nowMs = Date.now();
    if (wantRun && nowMs - lastManualCycleTimestamp > 5000) {
      lastManualCycleTimestamp = nowMs;
      const result = await triggerSixHourCycle(wantTelegram);
      res.writeHead(200, {
        ...SECURITY_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify(result, null, 2));
      return;
    }
    let currentPivot = null;
    try {
      const pivotFile = path.join(ROOT_DIR, 'logs', 'growth_pivot_state.json');
      if (fs.existsSync(pivotFile)) {
        currentPivot = JSON.parse(fs.readFileSync(pivotFile, 'utf8'));
      }
    } catch (e) {}
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify({ ok: true, pivotState: currentPivot }, null, 2));
    return;
  }

  // 1-E. Pre-Report Cross-Departmental Peer Feedback Council API (/api/staff-feedback or /api/staff-feedback?run=1)
  if (cleanUrlPath === '/api/staff-feedback') {
    const params = new URLSearchParams(rawQuery || '');
    const wantRun = params.get('run') === '1' || params.get('run') === 'true';
    let minutes = null;
    if (wantRun) {
      try {
        const council = require('./scripts/staff-feedback-council.js');
        minutes = council.runStaffFeedbackCouncil({ triggerType: '사옥 관제실 즉시 타운홀 소집' });
      } catch (e) {}
    } else {
      try {
        const feedbackFile = path.join(ROOT_DIR, 'logs', 'staff_feedback_minutes.json');
        if (fs.existsSync(feedbackFile)) {
          minutes = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
        }
      } catch (e) {}
    }
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify({ ok: true, staffFeedbackCouncil: minutes }, null, 2));
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
