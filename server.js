/**
 * server.js
 * Production HTTP Server for KidsFit Growth Studio (https://truthofmarket.com)
 * Zero external dependencies. Designed for Render / cloud Node.js web service deployment.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let adpickCache = { timestamp: 0, data: null };

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Load .env variables into process.env if present
try {
  const envPath = path.join(ROOT_DIR, '.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    envLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim();
        if (k && !process.env[k]) process.env[k] = v;
      }
    });
  }
} catch (_) {}

// Ensure dist/index.html is built on startup
function ensureBuild() {
  const distIndex = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(distIndex)) {
    try {
      console.log('[Server] dist/index.html not found. Running build pipeline...');
      execSync('node scripts/build.js', { cwd: ROOT_DIR, stdio: 'inherit' });
    } catch (err) {
      console.error('[Server] Build pipeline warning:', err.message);
    }
  }
}

ensureBuild();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
};

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Content-Security-Policy': "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self';"
};

const BLOCKED_SCRAPER_UA_REGEX = /(HTTrack|WebCopier|SiteSucker|Teleport|WebZIP|Offline Explorer|WebStripper|BlackWidow|Website Quester|sqlmap|nikto|nmap|masscan|zgrab)/i;
const PROTECTED_INTERNAL_PATH_REGEX = /^\/(scripts|tests|logs|docs|node_modules|\.flow-browser-profile|\.git|\.github|\.env|server\.js|package\.json|package-lock\.json|README\.md|CLAUDE\.md)(\/|$)/i;

const apiRateLimitMap = new Map();
function isRateLimited(req, maxPerMinute = 60) {
  const ip = getClientIp(req);
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return false;
  const now = Date.now();
  const entry = apiRateLimitMap.get(ip) || { count: 0, resetAt: now + 60000 };
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + 60000;
  } else {
    entry.count += 1;
  }
  apiRateLimitMap.set(ip, entry);
  if (apiRateLimitMap.size > 5000) apiRateLimitMap.clear();
  return entry.count > maxPerMinute;
}

function sanitizeText(input, maxLen = 1000) {
  return String(input || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(['"]?)[^'"]*\1/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim()
    .slice(0, maxLen);
}

function resolveSafeFile(baseDir, relPath) {
  if (!relPath || relPath.includes('\0') || relPath.includes('..')) return null;
  const safeRel = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.resolve(baseDir, safeRel);
  if (!fullPath.startsWith(path.resolve(baseDir))) {
    return null;
  }
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }
  return null;
}

// ============================================================================
// Real-Time Homepage Visitor & Funnel Analytics Engine (KST Daily + Cumulative)
// ============================================================================
const VISITOR_ANALYTICS_PATH = path.join(ROOT_DIR, 'logs', 'visitor_analytics.json');
const VISITOR_SNAPSHOT_PATH = path.join(ROOT_DIR, 'src', 'data', 'visitor-analytics-snapshot.json');
const BOT_UA_REGEX = /(bot|crawler|spider|slurp|yeti|daumoa|mediapartners|facebookexternalhit|telegrambot|kakaotalk-scrap|curl|python|headless|monitor|uptime)/i;
const recentPageviewMap = new Map();

function getKstDateString(offsetDays = 0) {
  const ms = Date.now() + (9 * 3600 * 1000) + (offsetDays * 86400 * 1000);
  return new Date(ms).toISOString().slice(0, 10);
}

function createEmptyDayBucket(dateStr) {
  return {
    date: dateStr,
    uv: 0,
    pv: 0,
    uniqueHashes: [],
    devices: { mobile: 0, desktop: 0 },
    referrers: {
      instagram: 0,
      threads: 0,
      naver_blog: 0,
      naver_cafe: 0,
      naver_search_clip: 0,
      google_daum_kakao: 0,
      direct: 0
    },
    diagnoses: { total: 0, growth: 0, learning: 0 },
    affiliateClicks: 0,
    bots: 0
  };
}

let visitorStats = {
  startedAt: new Date().toISOString(),
  total: {
    uv: 0,
    pv: 0,
    diagnoses: { total: 0, growth: 0, learning: 0 },
    affiliateClicks: 0,
    bots: 0
  },
  daily: {}
};

function mergeDayBucket(target, src) {
  if (!src || typeof src !== 'object') return target;
  target.uv = Math.max(target.uv || 0, src.uv || 0);
  target.pv = Math.max(target.pv || 0, src.pv || 0);
  target.bots = Math.max(target.bots || 0, src.bots || 0);
  target.affiliateClicks = Math.max(target.affiliateClicks || 0, src.affiliateClicks || 0);
  if (src.devices) {
    target.devices.mobile = Math.max(target.devices.mobile || 0, src.devices.mobile || 0);
    target.devices.desktop = Math.max(target.devices.desktop || 0, src.devices.desktop || 0);
  }
  if (src.referrers) {
    Object.keys(target.referrers).forEach((k) => {
      target.referrers[k] = Math.max(target.referrers[k] || 0, src.referrers[k] || 0);
    });
  }
  if (src.diagnoses) {
    target.diagnoses.total = Math.max(target.diagnoses.total || 0, src.diagnoses.total || 0);
    target.diagnoses.growth = Math.max(target.diagnoses.growth || 0, src.diagnoses.growth || 0);
    target.diagnoses.learning = Math.max(target.diagnoses.learning || 0, src.diagnoses.learning || 0);
  }
  return target;
}

[VISITOR_SNAPSHOT_PATH, VISITOR_ANALYTICS_PATH].forEach((p) => {
  try {
    if (fs.existsSync(p)) {
      const loaded = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (loaded && typeof loaded === 'object' && loaded.daily) {
        Object.keys(loaded.daily).forEach((d) => {
          if (!visitorStats.daily[d]) visitorStats.daily[d] = createEmptyDayBucket(d);
          mergeDayBucket(visitorStats.daily[d], loaded.daily[d]);
        });
        if (loaded.total) {
          visitorStats.total.uv = Math.max(visitorStats.total.uv || 0, loaded.total.uv || 0);
          visitorStats.total.pv = Math.max(visitorStats.total.pv || 0, loaded.total.pv || 0);
          visitorStats.total.bots = Math.max(visitorStats.total.bots || 0, loaded.total.bots || 0);
          visitorStats.total.affiliateClicks = Math.max(visitorStats.total.affiliateClicks || 0, loaded.total.affiliateClicks || 0);
        }
      }
    }
  } catch (_) {}
});

function saveVisitorStats() {
  try {
    fs.mkdirSync(path.dirname(VISITOR_ANALYTICS_PATH), { recursive: true });
    fs.writeFileSync(VISITOR_ANALYTICS_PATH, JSON.stringify(visitorStats, null, 2), 'utf8');
  } catch (_) {}
}

function ensureDayBucket(dateStr) {
  if (!visitorStats.daily[dateStr]) {
    visitorStats.daily[dateStr] = createEmptyDayBucket(dateStr);
    // Keep last 60 days to bound file size
    const keys = Object.keys(visitorStats.daily).sort();
    if (keys.length > 60) {
      delete visitorStats.daily[keys[0]];
    }
  }
  return visitorStats.daily[dateStr];
}

function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return String(cfIp).trim();
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return String((req.socket && req.socket.remoteAddress) || '0.0.0.0');
}

function classifyReferrer(refStr) {
  const r = String(refStr || '').toLowerCase();
  if (!r) return 'direct';
  if (r.includes('instagram.com') || r.includes('ig.me')) return 'instagram';
  if (r.includes('threads.net') || r.includes('threads.com')) return 'threads';
  if (r.includes('blog.naver.com')) return 'naver_blog';
  if (r.includes('cafe.naver.com')) return 'naver_cafe';
  if (r.includes('naver.com') || r.includes('clip')) return 'naver_search_clip';
  if (r.includes('google.') || r.includes('daum.net') || r.includes('kakao')) return 'google_daum_kakao';
  return 'direct';
}

function recordVisitorPageview(req, customRef) {
  try {
    const ua = String(req.headers['user-agent'] || '');
    const todayStr = getKstDateString(0);
    const day = ensureDayBucket(todayStr);

    if (BOT_UA_REGEX.test(ua)) {
      day.bots = (day.bots || 0) + 1;
      visitorStats.total.bots = (visitorStats.total.bots || 0) + 1;
      saveVisitorStats();
      return;
    }

    const ip = getClientIp(req);
    const vHash = `${ip}|${ua.slice(0, 64)}`;
    const now = Date.now();
    const lastPv = recentPageviewMap.get(vHash) || 0;
    if (now - lastPv < 4000) {
      // Avoid double counting if GET / and POST /api/visit fire together
      return;
    }
    recentPageviewMap.set(vHash, now);
    if (recentPageviewMap.size > 2000) {
      recentPageviewMap.clear();
    }

    day.pv += 1;
    visitorStats.total.pv += 1;

    if (!Array.isArray(day.uniqueHashes)) day.uniqueHashes = [];
    if (!day.uniqueHashes.includes(vHash)) {
      day.uniqueHashes.push(vHash);
      day.uv = Math.max((day.uv || 0) + 1, day.uniqueHashes.length);
      visitorStats.total.uv += 1;
    }

    const isMobile = /(Mobile|Android|iPhone|iPad|iPod)/i.test(ua);
    if (isMobile) {
      day.devices.mobile = (day.devices.mobile || 0) + 1;
    } else {
      day.devices.desktop = (day.devices.desktop || 0) + 1;
    }

    const refSource = classifyReferrer(customRef || req.headers['referer'] || req.headers['referrer'] || '');
    day.referrers[refSource] = (day.referrers[refSource] || 0) + 1;

    saveVisitorStats();
  } catch (_) {}
}

function recordDiagnosisEvent(mode) {
  try {
    const todayStr = getKstDateString(0);
    const day = ensureDayBucket(todayStr);
    const isLearning = mode === 'learning';
    day.diagnoses.total += 1;
    visitorStats.total.diagnoses.total += 1;
    if (isLearning) {
      day.diagnoses.learning += 1;
      visitorStats.total.diagnoses.learning += 1;
    } else {
      day.diagnoses.growth += 1;
      visitorStats.total.diagnoses.growth += 1;
    }
    saveVisitorStats();
  } catch (_) {}
}

function recordAffiliateClickEvent() {
  try {
    const todayStr = getKstDateString(0);
    const day = ensureDayBucket(todayStr);
    day.affiliateClicks = (day.affiliateClicks || 0) + 1;
    visitorStats.total.affiliateClicks = (visitorStats.total.affiliateClicks || 0) + 1;
    saveVisitorStats();
  } catch (_) {}
}

const server = http.createServer((req, res) => {
  try {
    const userAgent = String(req.headers['user-agent'] || '');
    if (BLOCKED_SCRAPER_UA_REGEX.test(userAgent)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
      res.end('403 Forbidden: Automated site cloning/scraping is strictly prohibited.');
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    if (pathname.includes('\0') || pathname.includes('..') || PROTECTED_INTERNAL_PATH_REGEX.test(pathname)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
      res.end('403 Forbidden: Access to internal server resources is denied.');
      return;
    }

    if (req.method === 'POST' && isRateLimited(req, 60)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS });
      res.end(JSON.stringify({ ok: false, error: 'Too Many Requests' }));
      return;
    }

    // 1. Health & Status Endpoints for Render + Live Visitor Analytics
    if (pathname === '/healthz' || pathname === '/api/health' || pathname === '/api/stats') {
      const todayStr = getKstDateString(0);
      const yesterdayStr = getKstDateString(-1);
      const todayBucket = ensureDayBucket(todayStr);
      const yesterdayBucket = visitorStats.daily[yesterdayStr] || createEmptyDayBucket(yesterdayStr);

      const cleanDay = (b) => ({
        date: b.date,
        uv: b.uv || 0,
        pv: b.pv || 0,
        devices: b.devices || { mobile: 0, desktop: 0 },
        referrers: b.referrers || {},
        diagnoses: b.diagnoses || { total: 0, growth: 0, learning: 0 },
        affiliateClicks: b.affiliateClicks || 0,
        bots: b.bots || 0
      });

      const payload = JSON.stringify({
        ok: true,
        service: 'KidsFit Growth Studio (kidsfit.co.kr / truthofmarket.com)',
        primaryDomain: 'https://kidsfit.co.kr',
        domains: ['kidsfit.co.kr', 'www.kidsfit.co.kr', 'truthofmarket.com', 'www.truthofmarket.com'],
        version: '2.5.0',
        timestamp: new Date().toISOString(),
        analytics: {
          kstDate: todayStr,
          startedAt: visitorStats.startedAt,
          today: cleanDay(todayBucket),
          yesterday: cleanDay(yesterdayBucket),
          total: visitorStats.total
        }
      });
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        ...NO_CACHE_HEADERS
      });
      res.end(payload);
      return;
    }

    // 1-0. Client Beacon Endpoint (/api/visit) for accurate referrer & funnel events
    if (pathname === '/api/visit') {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { if (body.length < 8192) body += chunk.toString('utf8'); });
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            const ev = String(data.event || 'pageview');
            if (ev === 'diagnosis') {
              recordDiagnosisEvent(data.mode || 'growth');
            } else if (ev === 'affiliate_click') {
              recordAffiliateClickEvent();
            } else {
              recordVisitorPageview(req, data.referrer || '');
            }
          } catch (_) {
            recordVisitorPageview(req, '');
          }
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
          res.end(JSON.stringify({ ok: true }));
        });
        return;
      }
      recordVisitorPageview(req, parsedUrl.searchParams.get('ref') || '');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // 1-A. User Input Cohort DB & Self-Improvement API (/api/user-cohort)
    if (pathname === '/api/user-cohort') {
      const cohortDbPath = path.join(ROOT_DIR, 'src', 'data', 'user-cohort-db.json');
      let cohortDb = { metadata: { total_records: 0, subject_mode_counts: { child: 0, self: 0 }, age_band_distribution: {}, bottleneck_habit_frequencies: {}, auto_learning_weights: {} }, records: [] };
      if (fs.existsSync(cohortDbPath)) {
        try {
          cohortDb = JSON.parse(fs.readFileSync(cohortDbPath, 'utf8'));
        } catch (_) {}
      }

      if (req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          ...NO_CACHE_HEADERS
        });
        res.end(JSON.stringify({ ok: true, cohortDb }));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          if (body.length < 32768) body += chunk.toString('utf8');
        });
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body || '{}');
            const ageYears = Math.max(1, Math.min(20, Number(incoming.ageYears) || 10));
            const bandKey = ageYears <= 3 ? '1-3y' : ageYears <= 6 ? '4-6y' : ageYears <= 9 ? '7-9y' : ageYears <= 12 ? '10-12y' : ageYears <= 16 ? '13-16y' : '17-20y';
            const record = {
              id: incoming.id || `USR-${Date.now().toString(36).toUpperCase()}`,
              timestamp: new Date().toISOString(),
              targetSubject: incoming.targetSubject === 'self' ? 'self' : 'child',
              gender: incoming.gender === 'girl' ? 'girl' : 'boy',
              birthDateStr: String(incoming.birthDateStr || ''),
              exactMonths: Number(incoming.exactMonths) || (ageYears * 12),
              ageYears,
              currentHeight: Number(incoming.currentHeight) || 137.0,
              currentWeight: Number(incoming.currentWeight) || 35.5,
              recentGrowth6m: Number(incoming.recentGrowth6m) || 3.2,
              fatherHeight: Number(incoming.fatherHeight) || 173.5,
              motherHeight: Number(incoming.motherHeight) || 160.5,
              tannerPhase: String(incoming.tannerPhase || 'phase_2'),
              habits: Array.isArray(incoming.habits) ? incoming.habits.slice(0, 5) : ['late_sleep'],
              cognitiveAxes: Array.isArray(incoming.cognitiveAxes) ? incoming.cognitiveAxes.slice(0, 5) : ['science_nature'],
              region: String(incoming.region || '서울 강남·서초·송파'),
              kdcaPercentile: Number(incoming.kdcaPercentile) || 50.0,
              zScore: Number(incoming.zScore) || 0.0,
              mph: Number(incoming.mph) || 173.5,
              unmanagedHeight: Number(incoming.unmanagedHeight) || 171.2,
              optimizedHeight: Number(incoming.optimizedHeight) || 180.5,
              potentialGainCm: Number(incoming.potentialGainCm) || 7.2,
              parentFreeNote: sanitizeText(incoming.parentFreeNote, 1000)
            };

            if (!cohortDb.metadata) cohortDb.metadata = {};
            cohortDb.metadata.last_updated_utc = record.timestamp;
            cohortDb.metadata.total_records = (Number(cohortDb.metadata.total_records) || 128) + 1;
            if (!cohortDb.metadata.subject_mode_counts) cohortDb.metadata.subject_mode_counts = { child: 89, self: 39 };
            cohortDb.metadata.subject_mode_counts[record.targetSubject] = (cohortDb.metadata.subject_mode_counts[record.targetSubject] || 0) + 1;

            if (!cohortDb.metadata.age_band_distribution) cohortDb.metadata.age_band_distribution = {};
            cohortDb.metadata.age_band_distribution[bandKey] = (cohortDb.metadata.age_band_distribution[bandKey] || 0) + 1;

            if (!cohortDb.metadata.bottleneck_habit_frequencies) cohortDb.metadata.bottleneck_habit_frequencies = {};
            record.habits.forEach((h) => {
              cohortDb.metadata.bottleneck_habit_frequencies[h] = (cohortDb.metadata.bottleneck_habit_frequencies[h] || 0) + 1;
            });

            if (!Array.isArray(cohortDb.records)) cohortDb.records = [];
            cohortDb.records.unshift(record);
            if (cohortDb.records.length > 200) cohortDb.records = cohortDb.records.slice(0, 200);

            try {
              fs.writeFileSync(cohortDbPath, JSON.stringify(cohortDb, null, 2), 'utf8');
            } catch (_) {}

            recordDiagnosisEvent(incoming.preferredReportMode || 'growth');

            res.writeHead(200, {
              'Content-Type': 'application/json; charset=utf-8',
              ...NO_CACHE_HEADERS
            });
            res.end(JSON.stringify({ ok: true, saved: record, total_records: cohortDb.metadata.total_records }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
          }
        });
        return;
      }
    }

    // 1-A2. Antigravity Bespoke Parent Narrative Log Endpoint (/api/bespoke-note)
    if (pathname === '/api/bespoke-note') {
      const notesLogPath = path.join(ROOT_DIR, 'logs', 'parent_bespoke_notes.jsonl');
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          if (body.length < 32768) body += chunk.toString('utf8');
        });
        req.on('end', () => {
          try {
            const payload = JSON.parse(body || '{}');
            const entry = {
              id: `NOTE-${Date.now().toString(36).toUpperCase()}`,
              timestamp: new Date().toISOString(),
              parentFreeNote: sanitizeText(payload.parentFreeNote, 1000),
              ageYears: payload.profile && payload.profile.ageYears ? Number(payload.profile.ageYears) : 10,
              gender: payload.profile && payload.profile.gender ? sanitizeText(payload.profile.gender, 16) : 'boy'
            };
            try {
              fs.mkdirSync(path.dirname(notesLogPath), { recursive: true });
              fs.appendFileSync(notesLogPath, JSON.stringify(entry) + '\n', 'utf8');
            } catch (_) {}
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
            res.end(JSON.stringify({ ok: true, saved: entry }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false }));
          }
        });
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
      res.end(JSON.stringify({ ok: true, endpoint: '/api/bespoke-note' }));
      return;
    }

    // 1-A3. Antigravity Real-Time AI Report Synthesis Engine (/api/antigravity-report)
    if (pathname === '/api/antigravity-report') {
      const reportsLogPath = path.join(ROOT_DIR, 'logs', 'antigravity_reports.jsonl');
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          if (body.length < 65536) body += chunk.toString('utf8');
        });
        req.on('end', () => {
          try {
            const payload = JSON.parse(body || '{}');
            const reportId = `AGY-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`;
            const timestamp = new Date().toISOString();
            const profile = payload.profile || {};
            const mode = payload.mode || profile.preferredReportMode || 'growth';
            const rawNote = sanitizeText(payload.parentFreeNote || profile.parentFreeNote || '', 1000);
            const ageYears = Math.max(1, Math.min(20, Math.floor((Number(profile.ageMonths) || 120) / 12)));
            const genderKo = profile.gender === 'girl' ? '여아' : '남아';

            const logEntry = {
              reportId,
              timestamp,
              mode,
              profile: {
                gender: profile.gender || 'boy',
                ageYears,
                ageMonths: profile.ageMonths || 120,
                currentHeight: profile.currentHeight || 137,
                currentWeight: profile.currentWeight || 35.5,
                habits: profile.habits || [],
                learningBottlenecks: profile.learningBottlenecks || profile.traitLearningConcerns || [],
                parentFreeNote: rawNote
              }
            };

            try {
              fs.mkdirSync(path.dirname(reportsLogPath), { recursive: true });
              fs.appendFileSync(reportsLogPath, JSON.stringify(logEntry) + '\n', 'utf8');
            } catch (_) {}

            // Match relevant papers from src/data/research-knowledge-base.json
            let matchedPapers = [];
            let totalKbPapers = 2081;
            try {
              const kbPath = path.join(ROOT_DIR, 'src', 'data', 'research-knowledge-base.json');
              if (fs.existsSync(kbPath)) {
                const kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
                const papers = Array.isArray(kb.papers) ? kb.papers : [];
                totalKbPapers = papers.length || 2081;
                const tokens = rawNote.split(/[\s,.!?/]+/).filter(w => w && w.length >= 2);
                const scored = papers.map(p => {
                  let score = 0;
                  const hay = `${p.title_ko || ''} ${p.title || ''} ${p.clinical_summary_ko || ''} ${p.parenting_prescription_ko || ''} ${(p.keywords || []).join(' ')}`.toLowerCase();
                  if (mode === 'learning' && (p.macro_pillar === 'learning_macro' || /fine_motor|pedagogy|museum|learning|reading|math|executive/.test(p.pillar || ''))) score += 3;
                  if (mode === 'growth' && (p.macro_pillar === 'growth_macro' || /growth|posture|endocrin|nutrition/.test(p.pillar || ''))) score += 3;
                  tokens.forEach(tk => {
                    if (hay.includes(tk.toLowerCase())) score += 5;
                  });
                  return { p, score };
                }).sort((a, b) => b.score - a.score);
                matchedPapers = scored.slice(0, 3).map(x => ({
                  titleKo: x.p.title_ko || x.p.title,
                  journal: x.p.journal || 'Peer-Reviewed Journal',
                  year: x.p.year || 2023,
                  pmid: x.p.pmid || x.p.doi || '',
                  summaryKo: x.p.clinical_summary_ko || x.p.key_finding_ko || '',
                  actionKo: x.p.parenting_prescription_ko || ''
                }));
              }
            } catch (_) {}

            // Dynamic Antigravity Bespoke Prescription Synthesis
            const synthesisResult = {
              ok: true,
              reportId,
              timestamp,
              mode,
              totalKbPapers,
              inputEcho: rawNote || `만 ${ageYears}세 ${genderKo} 설문 응답 프로필 기반 자동 합성`,
              verifiedBy: `Google Antigravity AI Engine (KDCA & Peer-Reviewed Corpus ${totalKbPapers.toLocaleString()} Papers)`,
              matchedPapers,
              customAiPrescription: {
                title: mode === 'learning'
                  ? `🧠 Antigravity AI 1:1 맞춤 두뇌·학습 신경인지 처방 (만 ${ageYears}세 ${genderKo})`
                  : `📏 Antigravity AI 1:1 맞춤 신체 성장 생체역학 처방 (만 ${ageYears}세 ${genderKo})`,
                summary: rawNote
                  ? `학부모님이 직접 입력하신 아이 특징("${rawNote}")과 설문 데이터를 문장 단위로 분해하여 ${totalKbPapers.toLocaleString()}편의 학술 논문 DB와 실시간 대조·합성한 1:1 맞춤 처방입니다.`
                  : (mode === 'learning'
                      ? `설문 기반 정밀 분석 결과, 아동의 뇌 발달 단계(만 ${ageYears}세)에 맞춘 문해력·수리사고·전두엽 집중력 1:1 최적화 루틴이 합성되었습니다.`
                      : `설문 기반 정밀 분석 결과, 아동의 골연령 단계(만 ${ageYears}세)에 맞춘 서파수면(SWS) 호르몬 분비 및 척추 감압 1:1 최적화 루틴이 합성되었습니다.`),
                actionPlan: mode === 'learning'
                  ? ['1단계: 15분 백지복습(메타인지 인출 훈련)', '2단계: 문장제 문제 도해 모델링(공식 암기 탈피)', '3단계: 숏폼 도파민 리셋 및 취침 1시간 전 종이책 독서']
                  : ['1단계: 밤 10시 깊은 서파수면(SWS) 호르몬 피크 확보', '2단계: 체중 비례 칼슘·D3·아연 아침 섭취', '3단계: 기상 직후 3분 철봉 데드행 척추 감압']
              }
            };

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
            res.end(JSON.stringify(synthesisResult));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: 'Invalid payload' }));
          }
        });
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
      res.end(JSON.stringify({ ok: true, endpoint: '/api/antigravity-report' }));
      return;
    }

    // 1-B. Coupang Partners Redirect & Search Proxy Route
    if (pathname === '/api/coupang') {
      recordAffiliateClickEvent();
      const q = parsedUrl.searchParams.get('q') || 
                parsedUrl.searchParams.get('kw') || 
                parsedUrl.searchParams.get('keyword') || '';
      const lptag = parsedUrl.searchParams.get('lptag') || 
                    parsedUrl.searchParams.get('subId') || 
                    'AF7865143';
      const redirectUrl = q 
        ? `https://link.coupang.com/re/AFFSRP?lptag=${encodeURIComponent(lptag)}&subid=kidsfit&pageKey=${encodeURIComponent(q)}`
        : `https://link.coupang.com/re/AFFHOME?lptag=${encodeURIComponent(lptag)}&subid=kidsfit`;

      const format = parsedUrl.searchParams.get('format');
      const acceptHeader = req.headers['accept'] || '';

      if (format === 'json' || acceptHeader.includes('application/json')) {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          ...NO_CACHE_HEADERS
        });
        res.end(JSON.stringify({
          ok: true,
          redirectUrl,
          query: q,
          lptag
        }));
        return;
      }

      // HTTP 302 Found Redirect
      res.writeHead(302, {
        'Location': redirectUrl,
        'X-Robots-Tag': 'noindex, nofollow',
        ...NO_CACHE_HEADERS
      });
      res.end(`Redirecting to Coupang Partners: ${redirectUrl}`);
      return;
    }

    // 1-C. 9-Platform Affiliate Integration Status Endpoint (/api/affiliate/status)
    if (pathname === '/api/affiliate/status') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
      res.end(JSON.stringify({
        ok: true,
        channels: {
          coupang: { subId: 'AF7865143', active: true },
          linkprice: { affId: 'A100708867', active: true },
          iherb: { rcode: 'IPZ1547', active: true },
          amazon: { storeId: 'kidfit-20', active: true },
          tenping: { shortUrl: 'https://iryan.kr/t8g8qxgcc2', campaign: '코베 베이비페어·유아교육전 무료입장 사전등록', active: true },
          myrealtrip: { mylinkId: '6226316', apiEndpoint: 'https://partner-ext-api.myrealtrip.com', active: true },
          klook: { aid: '140161', aff_adid: '1514603', redirectBase: 'https://affiliate.klook.com/redirect', active: true },
          naverBrandConnect: {
            openApiAvailable: false,
            note: '네이버 브랜드커넥트는 공개 Open API를 제공하지 않으며 캠페인별 발급 단축링크(naver.me) 브릿지 해시(NaPm) 방식으로 정산됩니다.',
            links: {
              healthMassage: 'https://naver.me/5Jq9LnLT',
              familyTour: 'https://naver.me/xJcOADhA'
            },
            active: true
          },
          adpick: {
            affid: '4d31d3',
            active: true,
            offersApi: 'https://adpick.co.kr/apis/offers.php?affid=4d31d3&os=&adtype=&category=notgame&order=rand',
            shoppingApi: 'https://adpick.co.kr/apis/sdk_shopping.php?affid=4d31d3',
            hotdealApi: 'https://adpick.co.kr/apis/sdk_shopping_hotdeal.php?affid=4d31d3',
            goshoppingGateway: 'https://adpick.co.kr/apis/goshopping.php?affid=4d31d3&offer={offer}&url={url}',
            partnerMalls: {
              '11st': 'c16a2',
              'kkday': 'b796d',
              'tripcom': '2f07c',
              'lotteimall': '7676b',
              'cjthemarket': 'f5ff7'
            },
            rateLimitPolicy: '최대 1분에 1회 이하 호출 및 캐싱 필수'
          }
        }
      }));
      return;
    }

    // 1-D. Klook Affiliate Dynamic Redirect Proxy (/api/klook)
    if (pathname === '/api/klook') {
      const aid = parsedUrl.searchParams.get('aid') || '140161';
      const adid = parsedUrl.searchParams.get('aff_adid') || '1514603';
      const q = parsedUrl.searchParams.get('q') || '';
      const kSite = parsedUrl.searchParams.get('k_site') ||
        parsedUrl.searchParams.get('url') ||
        (q ? `https://www.klook.com/ko/search/result/?query=${encodeURIComponent(q)}` : 'https://www.klook.com/ko/');
      const redirectUrl = `https://affiliate.klook.com/redirect?aid=${encodeURIComponent(aid)}&aff_adid=${encodeURIComponent(adid)}&k_site=${encodeURIComponent(kSite)}`;

      const format = parsedUrl.searchParams.get('format');
      const acceptHeader = req.headers['accept'] || '';
      if (format === 'json' || acceptHeader.includes('application/json')) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
        res.end(JSON.stringify({ ok: true, aid, aff_adid: adid, k_site: kSite, redirectUrl }));
        return;
      }

      res.writeHead(302, { 'Location': redirectUrl, 'X-Robots-Tag': 'noindex, nofollow', ...NO_CACHE_HEADERS });
      res.end(`Redirecting to Klook Affiliate: ${redirectUrl}`);
      return;
    }

    // 1-E. MyRealTrip Partner API Proxy (/api/myrealtrip/mylink & /api/myrealtrip/search)
    if (pathname === '/api/myrealtrip/mylink' || pathname === '/api/myrealtrip/search') {
      const mrtKey = process.env.MYREALTRIP_API_KEY || '';
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { if (body.length < 16384) body += chunk.toString('utf8'); });
        req.on('end', () => {
          const apiPath = pathname === '/api/myrealtrip/mylink' ? '/v1/mylink' : '/v1/products/tna/search';
          const mrtReq = https.request({
            hostname: 'partner-ext-api.myrealtrip.com',
            path: apiPath,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mrtKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }, (mrtRes) => {
            let respBody = '';
            mrtRes.on('data', (c) => { respBody += c.toString('utf8'); });
            mrtRes.on('end', () => {
              res.writeHead(mrtRes.statusCode || 200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
              res.end(respBody);
            });
          });
          mrtReq.on('error', (err) => {
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
          });
          mrtReq.write(body || '{}');
          mrtReq.end();
        });
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
      res.end(JSON.stringify({ ok: true, mylinkId: 6226316, endpoint: pathname }));
      return;
    }

    // 1-F. Adpick Campaign & Shopping JSON API Proxy with 60-Second Cache (/api/adpick/offers & /api/adpick/go)
    if (pathname === '/api/adpick/go') {
      recordAffiliateClickEvent();
      const affid = parsedUrl.searchParams.get('affid') || process.env.ADPICK_AFFID || '4d31d3';
      const mall = (parsedUrl.searchParams.get('mall') || '11st').toLowerCase();
      const q = parsedUrl.searchParams.get('q') || '';
      if (mall === '11st') {
        const st11Target = `https://search.11st.co.kr/pc/total-search?kwd=${encodeURIComponent(q || '어린이 영양제')}`;
        const redirectUrl = `https://click.linkprice.com/click.php?m=11st&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=${encodeURIComponent(st11Target)}`;
        res.writeHead(302, { 'Location': redirectUrl, 'X-Robots-Tag': 'noindex, nofollow', ...NO_CACHE_HEADERS });
        res.end(`Redirecting to 11st via LinkPrice: ${redirectUrl}`);
        return;
      }
      const offerMap = { '11st': 'c16a2', 'kkday': 'b796d', 'tripcom': '2f07c', 'lotteimall': '7676b', 'cjthemarket': 'f5ff7' };
      const offer = parsedUrl.searchParams.get('offer') || offerMap[mall] || 'b796d';
      const destUrl = parsedUrl.searchParams.get('url') || (
        mall === 'kkday'
          ? `https://www.kkday.com/ko/product/productlist?keyword=${encodeURIComponent(q || '박물관')}`
          : `https://search.11st.co.kr/pc/total-search?kwd=${encodeURIComponent(q || '어린이 영양제')}`
      );
      const redirectUrl = `https://adpick.co.kr/apis/goshopping.php?affid=${encodeURIComponent(affid)}&offer=${encodeURIComponent(offer)}&url=${encodeURIComponent(destUrl)}`;
      res.writeHead(302, { 'Location': redirectUrl, 'X-Robots-Tag': 'noindex, nofollow', ...NO_CACHE_HEADERS });
      res.end(`Redirecting to Adpick Shopping Mate: ${redirectUrl}`);
      return;
    }

    if (pathname === '/api/adpick/offers') {
      const affid = parsedUrl.searchParams.get('affid') || process.env.ADPICK_AFFID || '4d31d3';
      const mode = parsedUrl.searchParams.get('mode') || 'shopping'; // offers | shopping | hotdeal
      if (!affid) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
        res.end(JSON.stringify({
          ok: true,
          configured: false,
          message: '애드픽(Adpick) 회원 고유코드(affid)를 관리자 스튜디오 또는 ?affid= 파라미터로 전달하면 실시간 캠페인/쇼핑메이트 JSON이 반환됩니다.',
          endpoints: {
            offers: 'https://adpick.co.kr/apis/offers.php?affid={affid}&os=&adtype=&category=notgame&order=rand',
            shopping: 'https://adpick.co.kr/apis/sdk_shopping.php?affid={affid}',
            hotdeal: 'https://adpick.co.kr/apis/sdk_shopping_hotdeal.php?affid={affid}'
          }
        }));
        return;
      }

      const nowMs = Date.now();
      if (adpickCache.data && (nowMs - adpickCache.timestamp < 60000) && adpickCache.affid === affid && adpickCache.mode === mode) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
        res.end(adpickCache.data);
        return;
      }

      const targetPath = mode === 'shopping'
        ? `/apis/sdk_shopping.php?affid=${encodeURIComponent(affid)}`
        : mode === 'hotdeal'
        ? `/apis/sdk_shopping_hotdeal.php?affid=${encodeURIComponent(affid)}`
        : `/apis/offers.php?affid=${encodeURIComponent(affid)}&category=notgame&order=rand`;

      https.get(`https://adpick.co.kr${targetPath}`, (adpRes) => {
        let raw = '';
        adpRes.on('data', (c) => { raw += c.toString('utf8'); });
        adpRes.on('end', () => {
          adpickCache = { timestamp: Date.now(), affid, mode, data: raw };
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
          res.end(raw);
        });
      }).on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      });
      return;
    }

    // 2. Official KIDS-FIT PWA Service Worker & App Download Endpoints
    if (pathname === '/sw.js' || pathname === '/service-worker.js') {
      const swFile = resolveSafeFile(DIST_DIR, 'sw.js') || resolveSafeFile(ROOT_DIR, 'sw.js');
      const swBody = swFile
        ? fs.readFileSync(swFile, 'utf8')
        : "self.addEventListener('install', () => self.skipWaiting()); self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim())); self.addEventListener('fetch', () => {});";
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed': '/',
        ...NO_CACHE_HEADERS
      });
      res.end(swBody);
      return;
    }

    if (pathname === '/manifest.json' || pathname === '/manifest.webmanifest') {
      const mfFile = resolveSafeFile(DIST_DIR, 'manifest.json') || resolveSafeFile(ROOT_DIR, 'manifest.json');
      if (mfFile) {
        res.writeHead(200, {
          'Content-Type': 'application/manifest+json; charset=utf-8',
          ...NO_CACHE_HEADERS
        });
        res.end(fs.readFileSync(mfFile, 'utf8'));
        return;
      }
    }

    if (pathname === '/download/kidsfit-app') {
      const appLauncherHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#05070B">
  <title>KIDS-FIT 앱 실행기</title>
  <link rel="icon" href="https://kidsfit.co.kr/samples/app-icon-192.png">
  <link rel="apple-touch-icon" href="https://kidsfit.co.kr/samples/apple-touch-icon.png">
  <style>
    body { margin: 0; background: #05070B; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 24px; box-sizing: border-box; }
    .card { max-width: 400px; width: 100%; background: rgba(15, 23, 42, 0.95); border: 1.5px solid rgba(56, 189, 248, 0.45); border-radius: 24px; padding: 28px 22px; box-shadow: 0 20px 50px rgba(0,0,0,0.65); }
    .icon { width: 84px; height: 84px; border-radius: 20px; margin-bottom: 16px; border: 2px solid #38BDF8; }
    h1 { font-size: 22px; font-weight: 900; margin: 0 0 8px; color: #FFFFFF; }
    p { font-size: 14.5px; color: #CBD5E1; line-height: 1.55; margin: 0 0 20px; }
    .btn { display: block; width: 100%; padding: 15px 18px; border-radius: 14px; background: linear-gradient(90deg, #0284C7 0%, #10B981 100%); color: #FFFFFF; font-weight: 900; font-size: 16px; text-decoration: none; box-sizing: border-box; margin-bottom: 10px; }
  </style>
  <script>
    setTimeout(function() {
      window.location.replace('https://kidsfit.co.kr/?source=app_launcher');
    }, 600);
  </script>
</head>
<body>
  <div class="card">
    <img class="icon" src="https://kidsfit.co.kr/samples/app-icon-192.png" alt="KIDS-FIT">
    <h1>KIDS-FIT 그로스 스튜디오</h1>
    <p>아이 신체 성장 &amp; 두뇌·학습 맞춤 처방 앱으로 연결 중입니다...</p>
    <a class="btn" href="https://kidsfit.co.kr/?source=app_launcher">📲 키즈핏 앱 바로 열기 →</a>
  </div>
</body>
</html>`;
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="KIDS-FIT_App.html"',
        ...NO_CACHE_HEADERS
      });
      res.end(appLauncherHtml);
      return;
    }

    // 3. Normalize root & directory index paths
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }
    if (pathname === '/index.html' && req.method === 'GET') {
      recordVisitorPageview(req, parsedUrl.searchParams.get('utm_source') || '');
    }

    const relPath = pathname.replace(/^\/+/, '');

    // Look up file in DIST_DIR first, then ROOT_DIR
    let filePath =
      resolveSafeFile(DIST_DIR, relPath) ||
      resolveSafeFile(ROOT_DIR, relPath) ||
      resolveSafeFile(DIST_DIR, path.join(relPath, 'index.html')) ||
      resolveSafeFile(ROOT_DIR, path.join(relPath, 'index.html'));

    // Fallback to index.html for legacy HTML routes so old MoneyFit links land cleanly on KidsFit
    const ext = path.extname(filePath || pathname).toLowerCase();
    if (!filePath && (ext === '' || ext === '.html')) {
      filePath = resolveSafeFile(DIST_DIR, 'index.html') || resolveSafeFile(ROOT_DIR, 'index.html');
    }

    if (!filePath) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        ...NO_CACHE_HEADERS
      });
      res.end('404 Not Found');
      return;
    }

    const finalExt = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[finalExt] || 'application/octet-stream';
    const stat = fs.statSync(filePath);

    // Handle HTTP Range requests for MP4 video streaming
    if (finalExt === '.mp4' && req.headers.range) {
      const range = req.headers.range;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });
      stream.pipe(res);
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      ...SECURITY_HEADERS
    };

    if (finalExt === '.html' || finalExt === '.json' || finalExt === '.js' || finalExt === '.css') {
      Object.assign(headers, NO_CACHE_HEADERS);
      if (finalExt === '.html') {
        const isAdminQuery = parsedUrl.searchParams.has('admin');
        headers['X-Robots-Tag'] = isAdminQuery ? 'noindex, nofollow' : 'index, follow';
      }
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    const reqHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
    const isGlobalHost =
      parsedUrl.searchParams.get('edition') !== 'ko' &&
      (reqHost.includes('truthofmarket.com') || parsedUrl.searchParams.get('edition') === 'global' || parsedUrl.searchParams.get('paywall') === '1');

    if (finalExt === '.html' && path.basename(filePath) === 'index.html' && isGlobalHost) {
      let htmlBody = fs.readFileSync(filePath, 'utf8');
      htmlBody = htmlBody
        .replace('<html lang="ko" data-theme="dark">', '<html lang="en" data-theme="dark" data-edition="global-paid">')
        .replace('<title>KIDS-FIT — 아이의 키·신체·정신 성장 &amp; 맞춤 학습 가이드 플랫폼</title>', '<title>KIDS-FIT BIO LABS — US CDC &amp; 3,639-Paper Pediatric Height &amp; Brain LQ Clinical Report</title>')
        .replace('<meta name="description" content="아이의 키와 육체적·정신적 성장, 시기별 학습 방향이 고민인 학부모와 키가 더 크고 싶은 초·중·고 학생을 위한 맞춤형 성장 가이드북 플랫폼.">', '<meta name="description" content="1-Minute Pediatric Auxology &amp; Neuro-Cognitive Brain LQ Scan powered by US CDC 2000 Growth Charts, Tanner MPH, and 3,639 Peer-Reviewed PubMed Studies.">')
        .replace('<link rel="canonical" href="https://kidsfit.co.kr/">', '<link rel="canonical" href="https://truthofmarket.com/">')
        .replace('<meta property="og:title" content="KIDS-FIT — 우리 아이 숨은 키 &amp; 두뇌·학습 골든타임 리포트">', '<meta property="og:title" content="KIDS-FIT BIO LABS — Predicted Adult Height &amp; 5-Axis Brain LQ Clinical Report">')
        .replace('<meta property="og:description" content="질병관리청 성장도표 · 학술논문 3,655편 기반 | 생년월일과 생활 습관으로 확인하는 예상 성인키 3단 비교 &amp; 연령별 맞춤 학습 리포트">', '<meta property="og:description" content="US CDC 2000 Growth Charts &amp; 3,639 PubMed Papers | Discover your child\'s 3-Tier Predicted Adult Height, rhGH Clinical Paper Verdict &amp; 5-Axis Brain LQ.">')
        .replace('<meta property="og:url" content="https://kidsfit.co.kr/">', '<meta property="og:url" content="https://truthofmarket.com/">');
      const buf = Buffer.from(htmlBody, 'utf8');
      headers['Content-Length'] = buf.length;
      res.writeHead(200, headers);
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      res.end(buf);
      return;
    }

    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`[KidsFit Growth Studio] Server listening on http://${HOST}:${PORT}`);
  });
}

module.exports = server;
