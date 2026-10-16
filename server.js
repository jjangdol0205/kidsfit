#!/usr/bin/env node
/**
 * MoneyFit Production Web Server (Zero-Dependency Native HTTP Server + Real-Time Visitor Analytics)
 *
 * Designed for Render.com (`truthofmarket.com` / `truth-of-market.onrender.com`),
 * Railway, Fly.io, or local hosting (`npm start` / `node server.js`).
 *
 * Features:
 * - Serves pre-rendered `dist/` static files and `/preset/:slug` clean URLs
 * - Serves `/sitemap.xml`, `/rss.xml`, `/llms.txt`, `/robots.txt`, and IndexNow verification `.txt` files
 * - Built-in KST Daily Visitor & Search Bot Analytics Engine (`/api/stats` & `/api/track`)
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
// Real-Time KST Daily Visitor & Search Engine Bot Analytics Store
// ---------------------------------------------------------------
function getKstDateString() {
  const kstMs = Date.now() + 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString().split('T')[0];
}

let analyticsStore = {
  startedAt: new Date().toISOString(),
  totalPageViews: 0,
  totalUniqueVisitors: 0,
  totalBotCrawls: 0,
  totalAffiliateClicks: 0,
  days: {}
};

try {
  if (fs.existsSync(STATS_FILE)) {
    const loaded = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    if (loaded && typeof loaded === 'object') {
      analyticsStore = { ...analyticsStore, ...loaded, days: loaded.days || {} };
    }
  }
} catch (e) {
  // Ignore corrupted stats file
}

const dailyUvSets = {}; // dateStr -> Set of visitor hashes

function ensureDayBucket(dateStr) {
  if (!analyticsStore.days[dateStr]) {
    analyticsStore.days[dateStr] = {
      uniqueVisitors: 0,
      pageViews: 0,
      botCrawls: 0,
      affiliateClicks: 0,
      botsByEngine: { naver: 0, google: 0, bing: 0, ai: 0, other: 0 },
      pages: {}
    };
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

function recordVisit(req, cleanPath, eventType = 'pageview') {
  const dateStr = getKstDateString();
  const bucket = ensureDayBucket(dateStr);

  const ua = String(req.headers['user-agent'] || '');
  const forwarded = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();

  if (eventType === 'click') {
    bucket.affiliateClicks += 1;
    analyticsStore.totalAffiliateClicks += 1;
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

  // Human visitor tracking
  const visitorHash = crypto.createHash('sha1').update(`${forwarded}|${ua}`).digest('hex').slice(0, 12);
  if (!dailyUvSets[dateStr].has(visitorHash)) {
    dailyUvSets[dateStr].add(visitorHash);
    bucket.uniqueVisitors += 1;
    analyticsStore.totalUniqueVisitors += 1;
  }

  bucket.pageViews += 1;
  analyticsStore.totalPageViews += 1;

  const normPage = cleanPath === '/index.html' ? '/' : cleanPath;
  bucket.pages[normPage] = (bucket.pages[normPage] || 0) + 1;
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
      affiliateClicks: b.affiliateClicks
    };
  });

  return {
    status: 'ok',
    domain: 'https://truthofmarket.com',
    dateKst: todayStr,
    startedAt: analyticsStore.startedAt,
    today: {
      uniqueVisitors: today.uniqueVisitors,
      pageViews: today.pageViews,
      botCrawls: today.botCrawls,
      affiliateClicks: today.affiliateClicks,
      botsByEngine: today.botsByEngine,
      topPages
    },
    total: {
      uniqueVisitors: analyticsStore.totalUniqueVisitors,
      pageViews: analyticsStore.totalPageViews,
      botCrawls: analyticsStore.totalBotCrawls,
      affiliateClicks: analyticsStore.totalAffiliateClicks
    },
    recentHistory
  };
}

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

function resolveFilePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]).replace(/\\/g, '/');

  if (cleanPath === '/' || cleanPath === '/index.html') {
    const distIdx = path.join(DIST_DIR, 'index.html');
    return fs.existsSync(distIdx) ? distIdx : path.join(ROOT_DIR, 'index.html');
  }

  // Try exact match in dist/ then ROOT_DIR
  const candidateDist = path.normalize(path.join(DIST_DIR, cleanPath));
  if (candidateDist.startsWith(DIST_DIR) && fs.existsSync(candidateDist)) {
    const stat = fs.statSync(candidateDist);
    if (stat.isDirectory()) {
      const idx = path.join(candidateDist, 'index.html');
      if (fs.existsSync(idx)) return idx;
    } else {
      return candidateDist;
    }
  }

  // Try /preset/{slug}.html or /preset/{slug}/index.html
  const htmlDist = path.normalize(path.join(DIST_DIR, `${cleanPath}.html`));
  if (htmlDist.startsWith(DIST_DIR) && fs.existsSync(htmlDist)) {
    return htmlDist;
  }

  const candidateRoot = path.normalize(path.join(ROOT_DIR, cleanPath));
  if (candidateRoot.startsWith(ROOT_DIR) && fs.existsSync(candidateRoot)) {
    const stat = fs.statSync(candidateRoot);
    if (stat.isDirectory()) {
      const idx = path.join(candidateRoot, 'index.html');
      if (fs.existsSync(idx)) return idx;
    } else {
      return candidateRoot;
    }
  }

  return null;
}

const server = http.createServer((req, res) => {
  const reqUrl = req.url || '/';
  const [rawPath, rawQuery] = reqUrl.split('?');
  const cleanUrlPath = decodeURIComponent(rawPath || '/');

  // 1. Health check endpoint for Render.com / uptime monitoring
  if (cleanUrlPath === '/health' || cleanUrlPath === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'MoneyFit Portal (truthofmarket.com)',
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  // 2. Real-time Visitor & Bot Analytics API
  if (cleanUrlPath === '/api/stats') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(getStatsPayload(), null, 2));
    return;
  }

  // 3. Client-side Analytics Beacon (/api/track?type=pageview|click&p=/path)
  if (cleanUrlPath === '/api/track') {
    const params = new URLSearchParams(rawQuery || '');
    const evType = params.get('type') || 'pageview';
    const targetPage = params.get('p') || '/';
    recordVisit(req, targetPage, evType);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(getStatsPayload()));
    return;
  }

  // 4. Automatic zero-upload ownership verification for Naver SearchAdvisor & Google Search Console
  const naverMatch = cleanUrlPath.match(/^\/(naver[a-zA-Z0-9_-]+\.html)$/);
  if (naverMatch) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`naver-site-verification: ${naverMatch[1]}`);
    return;
  }
  const googleMatch = cleanUrlPath.match(/^\/(google[a-zA-Z0-9_-]+\.html)$/);
  if (googleMatch) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`google-site-verification: ${googleMatch[1]}`);
    return;
  }

  const filePath = resolveFilePath(reqUrl);
  if (!filePath) {
    // Fallback to main SPA index.html
    const fallback = fs.existsSync(path.join(DIST_DIR, 'index.html'))
      ? path.join(DIST_DIR, 'index.html')
      : path.join(ROOT_DIR, 'index.html');
    if (fs.existsSync(fallback)) {
      recordVisit(req, cleanUrlPath, 'pageview');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(fallback).pipe(res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
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
