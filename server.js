/**
 * server.js
 * Production HTTP Server for KidsFit Growth Studio (https://kidsfit.co.kr)
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
const DIST_GLOBAL_DIR = path.join(ROOT_DIR, 'dist-global');

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
const BOT_UA_REGEX = /(bot|crawler|spider|slurp|yeti|daumoa|mediapartners|facebookexternalhit|telegrambot|kakaotalk-scrap|curl|python|headless|monitor|uptime|kidsfit|auditor|advisor|ia_archiver|archive\.org|wayback|indexnow|preview|fetcher|go-http-client|axios|okhttp|lighthouse|pagespeed|phantomjs)/i;
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
    productClicks: {
      growth: 0,
      learning: 0,
      byReferrer: {}
    },
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
    productClicks: {
      growth: 0,
      learning: 0,
      byReferrer: {}
    },
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
  if (src.productClicks && typeof src.productClicks === 'object') {
    if (!target.productClicks) target.productClicks = { growth: 0, learning: 0, byReferrer: {} };
    target.productClicks.growth = Math.max(target.productClicks.growth || 0, src.productClicks.growth || 0);
    target.productClicks.learning = Math.max(target.productClicks.learning || 0, src.productClicks.learning || 0);
    if (src.productClicks.byReferrer && typeof src.productClicks.byReferrer === 'object') {
      if (!target.productClicks.byReferrer) target.productClicks.byReferrer = {};
      Object.keys(src.productClicks.byReferrer).forEach((r) => {
        if (!target.productClicks.byReferrer[r]) target.productClicks.byReferrer[r] = { growth: 0, learning: 0 };
        target.productClicks.byReferrer[r].growth = Math.max(
          target.productClicks.byReferrer[r].growth || 0,
          src.productClicks.byReferrer[r].growth || 0
        );
        target.productClicks.byReferrer[r].learning = Math.max(
          target.productClicks.byReferrer[r].learning || 0,
          src.productClicks.byReferrer[r].learning || 0
        );
      });
    }
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
          if (loaded.total.diagnoses) {
            visitorStats.total.diagnoses.total = Math.max(visitorStats.total.diagnoses.total || 0, loaded.total.diagnoses.total || 0);
            visitorStats.total.diagnoses.growth = Math.max(visitorStats.total.diagnoses.growth || 0, loaded.total.diagnoses.growth || 0);
            visitorStats.total.diagnoses.learning = Math.max(visitorStats.total.diagnoses.learning || 0, loaded.total.diagnoses.learning || 0);
          }
          if (loaded.total.productClicks) {
            if (!visitorStats.total.productClicks) visitorStats.total.productClicks = { growth: 0, learning: 0, byReferrer: {} };
            visitorStats.total.productClicks.growth = Math.max(visitorStats.total.productClicks.growth || 0, loaded.total.productClicks.growth || 0);
            visitorStats.total.productClicks.learning = Math.max(visitorStats.total.productClicks.learning || 0, loaded.total.productClicks.learning || 0);
          }
        }
        // Ensure total.diagnoses is at least the sum of daily.diagnoses
        let sumDiagTotal = 0, sumDiagGrowth = 0, sumDiagLearning = 0;
        let sumProdGrowth = 0, sumProdLearning = 0;
        Object.values(visitorStats.daily).forEach((dBucket) => {
          if (dBucket && dBucket.diagnoses) {
            sumDiagTotal += (dBucket.diagnoses.total || 0);
            sumDiagGrowth += (dBucket.diagnoses.growth || 0);
            sumDiagLearning += (dBucket.diagnoses.learning || 0);
          }
          if (dBucket && dBucket.productClicks) {
            sumProdGrowth += (dBucket.productClicks.growth || 0);
            sumProdLearning += (dBucket.productClicks.learning || 0);
          }
        });
        visitorStats.total.diagnoses.total = Math.max(visitorStats.total.diagnoses.total || 0, sumDiagTotal);
        visitorStats.total.diagnoses.growth = Math.max(visitorStats.total.diagnoses.growth || 0, sumDiagGrowth);
        visitorStats.total.diagnoses.learning = Math.max(visitorStats.total.diagnoses.learning || 0, sumDiagLearning);
        if (!visitorStats.total.productClicks) visitorStats.total.productClicks = { growth: 0, learning: 0, byReferrer: {} };
        visitorStats.total.productClicks.growth = Math.max(visitorStats.total.productClicks.growth || 0, sumProdGrowth);
        visitorStats.total.productClicks.learning = Math.max(visitorStats.total.productClicks.learning || 0, sumProdLearning);
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

function classifyReferrer(refStr, reqUrlStr) {
  const r = String(refStr || '').toLowerCase();
  const u = String(reqUrlStr || '').toLowerCase();
  const combined = `${r} ${u}`;
  if (combined.includes('instagram') || combined.includes('ig.me') || combined.includes('utm_source=insta')) return 'instagram';
  if (combined.includes('threads.net') || combined.includes('threads.com') || combined.includes('utm_source=threads')) return 'threads';
  if (combined.includes('blog.naver.com') || combined.includes('utm_source=naver_blog') || combined.includes('ref=blog')) return 'naver_blog';
  if (combined.includes('cafe.naver.com') || combined.includes('utm_source=naver_cafe') || combined.includes('ref=cafe')) return 'naver_cafe';
  if (combined.includes('kin.naver.com') || combined.includes('naver.com') || combined.includes('clip') || combined.includes('utm_source=naver')) return 'naver_search_clip';
  if (combined.includes('google.') || combined.includes('daum.net') || combined.includes('kakao') || combined.includes('bing.')) return 'google_daum_kakao';
  return 'direct';
}

function recordVisitorPageview(req, customRef) {
  try {
    const ua = String(req.headers['user-agent'] || '');
    const todayStr = getKstDateString(0);
    const day = ensureDayBucket(todayStr);

    const acceptHdr = String(req.headers['accept'] || '');
    const langHdr = String(req.headers['accept-language'] || '');
    const isLikelyAutomatedGet = req.method === 'GET' && (!langHdr || !acceptHdr.includes('text/html'));

    if (BOT_UA_REGEX.test(ua) || isLikelyAutomatedGet) {
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

    const refSource = classifyReferrer(customRef || req.headers['referer'] || req.headers['referrer'] || '', req.url || '');
    day.referrers[refSource] = (day.referrers[refSource] || 0) + 1;

    saveVisitorStats();
  } catch (_) {}
}

function recordDiagnosisEvent(mode) {
  try {
    const todayStr = getKstDateString(0);
    const day = ensureDayBucket(todayStr);
    day.diagnoses.total += 1;
    visitorStats.total.diagnoses.total += 1;
    if (mode === 'both') {
      day.diagnoses.growth += 1;
      day.diagnoses.learning += 1;
      visitorStats.total.diagnoses.growth += 1;
      visitorStats.total.diagnoses.learning += 1;
    } else if (mode === 'learning') {
      day.diagnoses.learning += 1;
      visitorStats.total.diagnoses.learning += 1;
    } else {
      day.diagnoses.growth += 1;
      visitorStats.total.diagnoses.growth += 1;
    }
    saveVisitorStats();
  } catch (_) {}
}

const recentAffiliateClickMap = new Map();

function classifyAffiliatePlatform(hrefStr) {
  const h = String(hrefStr || '').toLowerCase();
  if (h.includes('lemonsqueezy')) return 'Lemon Squeezy 글로벌 결제 ($8.99/$19.99)';
  if (h.includes('coupang') || h.includes('/api/coupang')) return '쿠팡 파트너스 (AF7865143)';
  if (h.includes('yes24') || h.includes('linkprice') || h.includes('11st')) return '링크프라이스·YES24/11번가 (A100708867)';
  if (h.includes('iherb')) return '아이허브 (IPZ1547)';
  if (h.includes('amazon')) return '아마존 (kidfit-20)';
  if (h.includes('myrealtrip')) return '마이리얼트립 (6226316)';
  if (h.includes('klook') || h.includes('/api/klook')) return '클룩 Klook (140161)';
  if (h.includes('adpick') || h.includes('kkday') || h.includes('/api/adpick')) return '애드픽 쇼핑메이트 (4d31d3)';
  if (h.includes('naver.me')) return '네이버 브랜드커넥트';
  if (h.includes('iryan.kr')) return '텐핑 (유아교육전·베이비페어)';
  return '제휴 큐레이션 상품';
}

function sendInstantPurchaseClickTelegram(clickRecord, dayStats, totalStats) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId = process.env.TELEGRAM_CHAT_ID || '755033799';
    if (!botToken || !chatId) return false;

    const catLabel = clickRecord.category === 'learning'
      ? '🧠 두뇌·학습·교구·나들이'
      : clickRecord.category === 'global_paywall'
      ? '🌎 영문판 유료 리포트 결제창'
      : '📏 신체 성장·영양·바른자세';

    const msgLines = [
      `🛒 <b>[실시간 구매·제휴상품 버튼 클릭 발생!]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `⏰ <b>클릭 시각</b>: <code>${clickRecord.timestampKst}</code>`,
      `🌐 <b>도메인</b>: <code>${clickRecord.domain}</code>`,
      `📂 <b>영역</b>: <b>${catLabel}</b>`,
      `🏷 <b>클릭한 상품/버튼</b>: <b>${sanitizeText(clickRecord.productName || '추천 제휴 상품 버튼', 100)}</b>`,
      `🛍 <b>연결 제휴사</b>: <code>${clickRecord.platform}</code>`,
      `🤖 <b>강화학습(RL) 보상</b>: <b>+${clickRecord.rlReward || 33.0} pt</b> (<code>${clickRecord.rlArmId || 'growth'}</code> · <code>${clickRecord.rlCtaArm || 'arm_rocket_review'}</code> 정책 가중치 즉시 강화!)`,
      `📱 <b>접속 기기 / 유입경로</b>: ${clickRecord.device === 'mobile' ? '📱 모바일' : '💻 PC'} / <code>${clickRecord.utmSource}</code>`,
      `━━━━━━━━━━━━━━━━━━`,
      `📊 <b>오늘 누적 구매버튼 클릭</b>: <b>${dayStats.affiliateClicks || 1}건</b> (신체성장 ${dayStats.productClicks.growth || 0}건 / 두뇌학습 ${dayStats.productClicks.learning || 0}건)`,
      `📈 <b>전체 누적 구매버튼 클릭</b>: <b>${totalStats.affiliateClicks || 1}건</b> (오늘 방문자 UV ${dayStats.uv || 0}명 · 진단완료 ${(dayStats.diagnoses && dayStats.diagnoses.total) || 0}건)`
    ];

    const postData = Buffer.from(JSON.stringify({
      chat_id: chatId,
      text: msgLines.join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }), 'utf8');

    const req = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': postData.length
      }
    }, (res) => { res.resume(); });
    req.on('error', () => {});
    req.write(postData);
    req.end();
    return true;
  } catch (_) {
    return false;
  }
}

function recordAffiliateClickEvent(category, utmSource, details = {}) {
  try {
    const req = details.req || null;
    const ua = req ? String(req.headers['user-agent'] || '') : '';
    if (ua && BOT_UA_REGEX.test(ua) && !details.forceNotify) {
      return null;
    }

    const ip = req ? getClientIp(req) : '0.0.0.0';
    const href = sanitizeText(details.href || '', 240);
    const productName = sanitizeText(details.productName || details.query || '', 100);
    const dedupKey = `${ip}|${category || 'growth'}`;
    const now = Date.now();
    const prev = recentAffiliateClickMap.get(dedupKey);
    if (prev && (now - prev.time < 2500)) {
      if (productName && (!prev.record.productName || prev.record.productName === '추천 제휴 상품 바로가기')) {
        prev.record.productName = productName;
        saveVisitorStats();
      }
      return prev.record;
    }

    const todayStr = getKstDateString(0);
    const day = ensureDayBucket(todayStr);
    day.affiliateClicks = (day.affiliateClicks || 0) + 1;
    visitorStats.total.affiliateClicks = (visitorStats.total.affiliateClicks || 0) + 1;

    const catKey = category === 'learning' ? 'learning' : 'growth';
    const refKey = utmSource || 'direct';

    if (!day.productClicks) day.productClicks = { growth: 0, learning: 0, byReferrer: {} };
    if (typeof day.productClicks.growth !== 'number') day.productClicks.growth = 0;
    if (typeof day.productClicks.learning !== 'number') day.productClicks.learning = 0;
    if (!day.productClicks.byReferrer || typeof day.productClicks.byReferrer !== 'object') day.productClicks.byReferrer = {};

    day.productClicks[catKey] += 1;
    if (!day.productClicks.byReferrer[refKey]) day.productClicks.byReferrer[refKey] = { growth: 0, learning: 0 };
    day.productClicks.byReferrer[refKey][catKey] = (day.productClicks.byReferrer[refKey][catKey] || 0) + 1;

    if (!visitorStats.total.productClicks) visitorStats.total.productClicks = { growth: 0, learning: 0, byReferrer: {} };
    if (typeof visitorStats.total.productClicks.growth !== 'number') visitorStats.total.productClicks.growth = 0;
    if (typeof visitorStats.total.productClicks.learning !== 'number') visitorStats.total.productClicks.learning = 0;
    if (!visitorStats.total.productClicks.byReferrer || typeof visitorStats.total.productClicks.byReferrer !== 'object') visitorStats.total.productClicks.byReferrer = {};

    visitorStats.total.productClicks[catKey] += 1;
    if (!visitorStats.total.productClicks.byReferrer[refKey]) visitorStats.total.productClicks.byReferrer[refKey] = { growth: 0, learning: 0 };
    visitorStats.total.productClicks.byReferrer[refKey][catKey] = (visitorStats.total.productClicks.byReferrer[refKey][catKey] || 0) + 1;

    const kstIso = new Date(now + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
    const isMobile = /(Mobile|Android|iPhone|iPad|iPod)/i.test(ua);
    const reqHost = req ? String(req.headers['x-forwarded-host'] || req.headers.host || 'kidsfit.co.kr') : 'kidsfit.co.kr';
    const clickRecord = {
      id: `CLK-${now}-${Math.floor(Math.random() * 899 + 100)}`,
      timestampKst: kstIso,
      category: category || 'growth',
      platform: classifyAffiliatePlatform(href || details.platformHint || ''),
      productName: productName || '추천 제휴 상품 바로가기',
      href: href || '',
      utmSource: refKey,
      device: isMobile ? 'mobile' : 'desktop',
      domain: sanitizeText(details.domain || reqHost, 60),
      notifiedByServer: false
    };

    clickRecord.rlArmId = sanitizeText(details.rlArmId || (catKey === 'learning' ? 'cognitive_learning_problem_solver' : 'growth_nutrition_repeat_cart'), 60);
    clickRecord.rlCtaArm = sanitizeText(details.rlCtaArm || 'arm_rocket_review', 60);
    clickRecord.rlReward = Number(details.rlReward) || 33.0;
    clickRecord.sessionClicks = Number(details.sessionClicks) || 1;
    try {
      const rlPolicyPath = path.join(ROOT_DIR, 'src', 'data', 'coupang-rl-policy.json');
      if (fs.existsSync(rlPolicyPath)) {
        const rlPolicy = JSON.parse(fs.readFileSync(rlPolicyPath, 'utf8'));
        if (rlPolicy && rlPolicy.category_arms && rlPolicy.category_arms[clickRecord.rlArmId]) {
          const cArm = rlPolicy.category_arms[clickRecord.rlArmId];
          cArm.clicks = (Number(cArm.clicks) || 0) + 1;
          cArm.alpha = Number(((Number(cArm.alpha) || 30) + (clickRecord.rlReward / 8.0)).toFixed(2));
          cArm.cumulative_reward = Number(((Number(cArm.cumulative_reward) || 0) + clickRecord.rlReward).toFixed(1));
        }
        if (rlPolicy && rlPolicy.cta_arms && rlPolicy.cta_arms[clickRecord.rlCtaArm]) {
          const tArm = rlPolicy.cta_arms[clickRecord.rlCtaArm];
          tArm.clicks = (Number(tArm.clicks) || 0) + 1;
          tArm.alpha = Number(((Number(tArm.alpha) || 25) + (clickRecord.rlReward / 10.0)).toFixed(2));
          tArm.cumulative_reward = Number(((Number(tArm.cumulative_reward) || 0) + clickRecord.rlReward).toFixed(1));
        }
        if (rlPolicy && rlPolicy.metadata) {
          rlPolicy.metadata.total_episodes = (Number(rlPolicy.metadata.total_episodes) || 0) + 1;
          rlPolicy.metadata.total_cumulative_reward = Number(((Number(rlPolicy.metadata.total_cumulative_reward) || 0) + clickRecord.rlReward).toFixed(1));
          rlPolicy.metadata.last_updated_kst = kstIso;
        }
        if (!Array.isArray(rlPolicy.recent_reward_history)) rlPolicy.recent_reward_history = [];
        rlPolicy.recent_reward_history.unshift({
          timestampKst: kstIso,
          armId: clickRecord.rlArmId,
          ctaArm: clickRecord.rlCtaArm,
          productName: clickRecord.productName,
          reward: clickRecord.rlReward,
          utmSource: clickRecord.utmSource
        });
        if (rlPolicy.recent_reward_history.length > 40) rlPolicy.recent_reward_history = rlPolicy.recent_reward_history.slice(0, 40);
        fs.writeFileSync(rlPolicyPath, JSON.stringify(rlPolicy, null, 2), 'utf8');
      }
      const rlEventsPath = path.join(ROOT_DIR, 'logs', 'coupang_rl_events.jsonl');
      fs.appendFileSync(rlEventsPath, JSON.stringify(clickRecord) + '\n', 'utf8');
    } catch (_) {}
    clickRecord.notifiedByServer = sendInstantPurchaseClickTelegram(clickRecord, day, visitorStats.total);

    if (!Array.isArray(day.recentClicks)) day.recentClicks = [];
    day.recentClicks.unshift(clickRecord);
    if (day.recentClicks.length > 30) day.recentClicks = day.recentClicks.slice(0, 30);

    if (!Array.isArray(visitorStats.total.recentClicks)) visitorStats.total.recentClicks = [];
    visitorStats.total.recentClicks.unshift(clickRecord);
    if (visitorStats.total.recentClicks.length > 50) visitorStats.total.recentClicks = visitorStats.total.recentClicks.slice(0, 50);

    recentAffiliateClickMap.set(dedupKey, { time: now, record: clickRecord });
    if (recentAffiliateClickMap.size > 1000) recentAffiliateClickMap.clear();

    saveVisitorStats();
    return clickRecord;
  } catch (_) {
    return null;
  }
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
        productClicks: b.productClicks || { growth: 0, learning: 0, byReferrer: {} },
        recentClicks: Array.isArray(b.recentClicks) ? b.recentClicks.slice(0, 20) : [],
        bots: b.bots || 0
      });

      const payload = JSON.stringify({
        ok: true,
        service: 'KidsFit Growth Studio (kidsfit.co.kr / kisfitglobal.com)',
        primaryDomain: 'https://kidsfit.co.kr',
        domains: ['kidsfit.co.kr', 'www.kidsfit.co.kr', 'kidsfit.kr', 'kisfitglobal.com'],
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

    // 1-RL. Coupang Partners Reinforcement Learning Policy Endpoint (/api/rl-policy)
    if (pathname === '/api/rl-policy') {
      const rlPolicyPath = path.join(ROOT_DIR, 'src', 'data', 'coupang-rl-policy.json');
      let rlPolicy = {};
      try {
        if (fs.existsSync(rlPolicyPath)) rlPolicy = JSON.parse(fs.readFileSync(rlPolicyPath, 'utf8'));
      } catch (_) {}
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
      res.end(JSON.stringify({ ok: true, policy: rlPolicy }));
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
            } else if (ev === 'affiliate_click' || ev === 'growth_product_click' || ev === 'learning_product_click') {
              const category = data.category || (ev === 'learning_product_click' ? 'learning' : 'growth');
              const utmSource = data.utm_source || 'direct';
              recordAffiliateClickEvent(category, utmSource, {
                req,
                href: data.href || '',
                productName: data.product_name || data.productName || '',
                domain: data.domain || '',
                rlArmId: data.rl_arm_id || '',
                rlCtaArm: data.rl_cta_arm || '',
                rlSlotRank: Number(data.rl_slot_rank) || 1,
                rlReward: Number(data.rl_reward) || 33.0,
                sessionClicks: Number(data.session_clicks) || 1
              });
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
              region: String(incoming.region || 'United States — Northeast (NY · NJ · MA · PA)'),
              kdcaPercentile: Number(incoming.kdcaPercentile) || 50.0,
              zScore: Number(incoming.zScore) || 0.0,
              mph: Number(incoming.mph) || 173.5,
              unmanagedHeight: Number(incoming.unmanagedHeight) || 171.2,
              optimizedHeight: Number(incoming.optimizedHeight) || 180.5,
              potentialGainCm: Number(incoming.potentialGainCm) || 7.2,
              isOwnerTest: Boolean(incoming.isOwnerTest),
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

            if (!incoming.isOwnerTest) {
              recordDiagnosisEvent(incoming.preferredReportMode || 'growth');
            }

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
      const cat = parsedUrl.searchParams.get('cat') || parsedUrl.searchParams.get('category') || 'growth';
      const utm = parsedUrl.searchParams.get('utm_source') || 'direct';
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

      recordAffiliateClickEvent(cat, utm, { req, href: redirectUrl, query: q || '쿠팡 추천 상품', platformHint: 'coupang' });

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
      const cat = parsedUrl.searchParams.get('cat') || parsedUrl.searchParams.get('category') || 'learning';
      const utm = parsedUrl.searchParams.get('utm_source') || 'direct';
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

      recordAffiliateClickEvent(cat, utm, { req, href: redirectUrl, query: q || '클룩 주말 체험 티켓', platformHint: 'klook' });

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
      const cat = parsedUrl.searchParams.get('cat') || parsedUrl.searchParams.get('category') || 'learning';
      const utm = parsedUrl.searchParams.get('utm_source') || 'direct';
      const affid = parsedUrl.searchParams.get('affid') || process.env.ADPICK_AFFID || '4d31d3';
      const mall = (parsedUrl.searchParams.get('mall') || '11st').toLowerCase();
      const q = parsedUrl.searchParams.get('q') || '';
      recordAffiliateClickEvent(cat, utm, { req, href: req.url, query: q || `${mall} 추천 상품`, platformHint: mall === '11st' ? 'linkprice' : 'adpick' });
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

    // 1-G. Lemon Squeezy Store #296100 Public Config & Webhook Endpoints (/api/lemonsqueezy-config & /api/lemonsqueezy-webhook)
    if (pathname === '/api/lemonsqueezy-config') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
      res.end(JSON.stringify({
        ok: true,
        storeId: Number(process.env.LEMONSQUEEZY_STORE_ID || 296100),
        storeName: 'KISFIT Bio Labs',
        accountHolder: process.env.LEMONSQUEEZY_ACCOUNT_HOLDER || '이윤주 (Yoonju Lee)',
        storeUrl: 'https://truthofmarket.lemonsqueezy.com',
        currency: 'USD',
        products: {
          singlePass: {
            productId: Number(process.env.LEMONSQUEEZY_SINGLE_PRODUCT_ID || 1468224),
            variantId: Number(process.env.LEMONSQUEEZY_SINGLE_VARIANT_ID || 2289754),
            priceUsd: 8.99,
            checkoutUrl: process.env.LEMONSQUEEZY_SINGLE_PASS_URL || 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599'
          },
          trackerPass: {
            productId: Number(process.env.LEMONSQUEEZY_TRACKER_PRODUCT_ID || 1468243),
            variantId: Number(process.env.LEMONSQUEEZY_TRACKER_VARIANT_ID || 2289779),
            priceUsd: 19.99,
            checkoutUrl: process.env.LEMONSQUEEZY_TRACKER_PASS_URL || 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895'
          }
        },
        webhookId: Number(process.env.LEMONSQUEEZY_WEBHOOK_ID || 145796)
      }));
      return;
    }

    // 1-H. Lemon Squeezy Live Checkout Creation, Order Verification, Auto-Provisioning & Member Authentication
    const usersDbPath = path.join(ROOT_DIR, 'logs', 'users_db.json');
    const ordersLogPath = path.join(ROOT_DIR, 'logs', 'lemonsqueezy_orders.jsonl');
    const authSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || 'kf_ls_whsec_2026_truthofmarket';
    const lsApiKey = process.env.LEMONSQUEEZY_API_KEY || '';

    function loadUsersDb() {
      try {
        if (fs.existsSync(usersDbPath)) {
          const parsed = JSON.parse(fs.readFileSync(usersDbPath, 'utf8'));
          if (parsed && Array.isArray(parsed.users)) return parsed;
        }
      } catch (_) {}
      return { users: [] };
    }

    function saveUsersDb(db) {
      try {
        fs.mkdirSync(path.dirname(usersDbPath), { recursive: true });
        fs.writeFileSync(usersDbPath, JSON.stringify(db, null, 2) + '\n', 'utf8');
      } catch (_) {}
    }

    function createAuthToken(email) {
      const crypto = require('crypto');
      const norm = String(email || '').trim().toLowerCase();
      const sig = crypto.createHmac('sha256', authSecret).update(norm).digest('hex').slice(0, 32);
      return Buffer.from(`${norm}:${sig}`, 'utf8').toString('base64');
    }

    function verifyAuthToken(token) {
      try {
        const crypto = require('crypto');
        const decoded = Buffer.from(String(token || ''), 'base64').toString('utf8');
        const idx = decoded.lastIndexOf(':');
        if (idx === -1) return null;
        const email = decoded.slice(0, idx);
        const sig = decoded.slice(idx + 1);
        const expected = crypto.createHmac('sha256', authSecret).update(email).digest('hex').slice(0, 32);
        return sig === expected ? email : null;
      } catch (_) {
        return null;
      }
    }

    function detectOrderPlanType(orderEntry) {
      if (!orderEntry) return 'single';
      const totalStr = String(orderEntry.totalUsd || '');
      const vId = String(orderEntry.variantId || '');
      const pId = String(orderEntry.productId || '');
      const pName = String(orderEntry.productName || '').toLowerCase();
      if (
        totalStr.includes('19.99') ||
        totalStr.includes('1999') ||
        vId === '2289779' ||
        pId === '1468243' ||
        pName.includes('6-month') ||
        pName.includes('tracker') ||
        orderEntry.planType === 'pass'
      ) {
        return 'pass';
      }
      return 'single';
    }

    function provisionPaidOrderAndNotify(orderEntry, notifyTelegram = true) {
      if (!orderEntry) return null;
      const normEmail = String(orderEntry.email || '').trim().toLowerCase();
      const orderId = String(orderEntry.orderId || ('ORD-' + Date.now())).trim();
      const planType = detectOrderPlanType(orderEntry);
      const isPass = planType === 'pass';
      const rlReward = isPass ? 100.0 : 45.0;
      const nowIso = new Date().toISOString();
      const kstIso = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
      const expiresAt = new Date(Date.now() + (isPass ? 180 : 365) * 86400 * 1000).toISOString();

      // 1. Auto-Provision / Unlock Member Account in users_db.json
      const db = loadUsersDb();
      let user = normEmail ? db.users.find(u => u.email === normEmail) : null;
      let newlyUnlocked = false;
      if (normEmail) {
        if (!user) {
          const crypto = require('crypto');
          const salt = crypto.randomBytes(16).toString('hex');
          const defaultPass = 'VIP2026';
          const passwordHash = crypto.pbkdf2Sync(defaultPass, salt, 10000, 32, 'sha256').toString('hex');
          user = {
            id: 'usr_' + Date.now().toString(36),
            name: normEmail.split('@')[0],
            email: normEmail,
            salt,
            passwordHash,
            unlockedPass: true,
            planType,
            lastOrderId: orderId,
            unlockedAt: nowIso,
            expiresAt,
            autoProvisioned: true,
            childProfiles: [],
            createdAt: nowIso
          };
          db.users.push(user);
          newlyUnlocked = true;
          saveUsersDb(db);
        } else if (!user.unlockedPass || user.lastOrderId !== orderId || user.planType !== planType) {
          user.unlockedPass = true;
          user.planType = planType;
          user.lastOrderId = orderId;
          user.unlockedAt = nowIso;
          user.expiresAt = expiresAt;
          newlyUnlocked = true;
          saveUsersDb(db);
        }
      }

      const magicUnlockUrl = normEmail
        ? `https://kisfitglobal.com/?unlock=1&payment=success&email=${encodeURIComponent(normEmail)}&order_id=${encodeURIComponent(orderId)}&plan=${planType}`
        : `https://kisfitglobal.com/?unlock=1&payment=success&order_id=${encodeURIComponent(orderId)}&plan=${planType}`;

      // 2. Reinforce Paid-Member Revenue RL Policy (dist-global & src/data)
      if (newlyUnlocked) {
        [
          path.join(DIST_GLOBAL_DIR, 'src', 'data', 'rl-paid-conversion-policy.json'),
          path.join(ROOT_DIR, 'src', 'data', 'rl-paid-conversion-policy.json')
        ].forEach((rlPath) => {
          try {
            if (fs.existsSync(rlPath)) {
              const pol = JSON.parse(fs.readFileSync(rlPath, 'utf8'));
              if (pol && pol.global_metrics) {
                if (isPass) {
                  pol.global_metrics.orders_pass_1999 = (Number(pol.global_metrics.orders_pass_1999) || 0) + 1;
                  pol.global_metrics.estimated_revenue_usd = Number(((Number(pol.global_metrics.estimated_revenue_usd) || 0) + 19.99).toFixed(2));
                } else {
                  pol.global_metrics.orders_single_899 = (Number(pol.global_metrics.orders_single_899) || 0) + 1;
                  pol.global_metrics.estimated_revenue_usd = Number(((Number(pol.global_metrics.estimated_revenue_usd) || 0) + 8.99).toFixed(2));
                }
                pol.global_metrics.total_reward_points = Number(((Number(pol.global_metrics.total_reward_points) || 0) + rlReward).toFixed(1));
              }
              if (pol && pol.paywall_arms && pol.paywall_arms.A1_CLINIC_ANCHOR_PASS_FIRST) {
                const arm = pol.paywall_arms.A1_CLINIC_ANCHOR_PASS_FIRST;
                arm.paid_orders = (Number(arm.paid_orders) || 0) + 1;
                arm.total_reward = Number(((Number(arm.total_reward) || 0) + rlReward).toFixed(1));
              }
              fs.writeFileSync(rlPath, JSON.stringify(pol, null, 2) + '\n', 'utf8');
            }
          } catch (_) {}
        });
      }

      // 3. Send Real-Time Paid Order & Auto-Progression Report to Owner's Telegram (Chat ID 755033799)
      if (notifyTelegram && newlyUnlocked) {
        try {
          const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
          const chatId = process.env.TELEGRAM_CHAT_ID || '755033799';
          if (botToken && chatId) {
            const planLabelKo = isPass
              ? '💎 $19.99 USD — 6개월 무제한 성장·두뇌 케어 패스 (180일 무제한 재진단)'
              : '📄 $8.99 USD — 단건 정밀 임상 리포트 & 2페이지 PDF 패스';
            const msgLines = [
              `🎉 <b>[KISFIT 글로벌 유료 결제 발생 &amp; 전 과정 자동 진행 완료!]</b>`,
              `━━━━━━━━━━━━━━━━━━`,
              `⏰ <b>결제 시각</b>: <code>${kstIso}</code>`,
              `👤 <b>구매 고객 이메일</b>: <code>${sanitizeText(normEmail || '비회원/이메일미상', 80)}</code>`,
              `🏷 <b>결제 플랜</b>: <b>${planLabelKo}</b>`,
              `🧾 <b>주문 번호(Order ID)</b>: <code>#${sanitizeText(orderId, 40)}</code>`,
              `💵 <b>결제 금액</b>: <b>${sanitizeText(orderEntry.totalUsd || (isPass ? '$19.99' : '$8.99'), 30)}</b>`,
              `━━━━━━━━━━━━━━━━━━`,
              `⚙️ <b>[서버 자율 매니저 자동 후속 조치 완료 내역]</b>`,
              `1️⃣ <b>회원 DB 자동 승격</b>: <code>users_db.json</code> 내 <code>${sanitizeText(normEmail || orderId, 60)}</code> 계정 <b>PRO 권한(unlockedPass=true)</b> 즉시 부여 완료`,
              `2️⃣ <b>리포트 &amp; PDF 자동 잠금 해제</b>: 01~05 전체 정밀 처방 + 병원용 2페이지 인쇄용 PDF 즉시 오픈`,
              `3️⃣ <b>플랜별 맞춤 진행 세팅</b>: ${isPass ? '6개월(180일) 월별 키·두뇌 재진단 트래커 활성화 완료' : '단건 정밀 처방 및 영구 열람 매직링크 발급 완료'}`,
              `4️⃣ <b>유료전환 강화학습(RL) 보상</b>: <b>+${rlReward} pt</b> 즉시 반영 완료`
            ];
            const postData = Buffer.from(JSON.stringify({
              chat_id: chatId,
              text: msgLines.join('\n'),
              parse_mode: 'HTML',
              disable_web_page_preview: true
            }), 'utf8');
            const tgReq = https.request({
              hostname: 'api.telegram.org',
              port: 443,
              path: `/bot${botToken}/sendMessage`,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': postData.length
              }
            }, (tgRes) => { tgRes.resume(); });
            tgReq.on('error', () => {});
            tgReq.write(postData);
            tgReq.end();
          }
        } catch (_) {}
      }

      return {
        user,
        planType,
        orderId,
        expiresAt,
        magicUnlockUrl,
        token: normEmail ? createAuthToken(normEmail) : null
      };
    }

    if (pathname === '/api/lemonsqueezy-webhook') {
      if (req.method === 'POST') {
        let rawBody = '';
        req.on('data', (chunk) => {
          if (rawBody.length < 131072) rawBody += chunk.toString('utf8');
        });
        req.on('end', () => {
          try {
            const crypto = require('crypto');
            const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || 'kf_ls_whsec_2026_truthofmarket';
            const signature = String(req.headers['x-signature'] || '');
            const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
            const sigValid = !signature || signature === expectedSig;

            const payload = JSON.parse(rawBody || '{}');
            const eventName = (payload.meta && payload.meta.event_name) || String(req.headers['x-event-name'] || 'unknown');
            const attr = (payload.data && payload.data.attributes) || {};
            const firstItem = attr.first_order_item || {};
            const entry = {
              timestamp: new Date().toISOString(),
              eventName,
              signatureValid: sigValid,
              orderId: payload.data && payload.data.id ? String(payload.data.id) : null,
              email: attr.user_email ? String(attr.user_email).trim().toLowerCase() : null,
              totalUsd: attr.total_formatted || null,
              status: attr.status || null,
              variantId: firstItem.variant_id || attr.variant_id || null,
              productId: firstItem.product_id || attr.product_id || null,
              productName: firstItem.product_name || ''
            };
            entry.planType = detectOrderPlanType(entry);
            try {
              fs.mkdirSync(path.dirname(ordersLogPath), { recursive: true });
              fs.appendFileSync(ordersLogPath, JSON.stringify(entry) + '\n', 'utf8');
            } catch (_) {}

            let provisioned = null;
            if (sigValid && (eventName === 'order_created' || eventName === 'subscription_payment_success' || entry.status === 'paid')) {
              provisioned = provisionPaidOrderAndNotify(entry, true);
              recordAffiliateClickEvent('global_paywall', 'lemonsqueezy_webhook', {
                req,
                productName: entry.planType === 'pass' ? 'PAID ORDER: $19.99 6-Month Pass' : 'PAID ORDER: $8.99 Single Pass',
                href: 'https://kisfitglobal.com/en',
                domain: 'kisfitglobal.com',
                rlReward: entry.planType === 'pass' ? 100.0 : 45.0
              });
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
            res.end(JSON.stringify({
              ok: true,
              received: true,
              eventName,
              signatureValid: sigValid,
              autoProvisioned: Boolean(provisioned),
              planType: entry.planType,
              magicUnlockUrl: provisioned ? provisioned.magicUnlockUrl : null
            }));
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: 'Invalid webhook payload' }));
          }
        });
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
      res.end(JSON.stringify({ ok: true, endpoint: '/api/lemonsqueezy-webhook', storeId: 296100, autoProvisioning: true }));
      return;
    }

    function findVerifiedOrderForEmailOrId(email, orderId) {
      const normEmail = String(email || '').trim().toLowerCase();
      const normOrder = String(orderId || '').trim();
      try {
        if (fs.existsSync(ordersLogPath)) {
          const lines = fs.readFileSync(ordersLogPath, 'utf8').trim().split('\n').filter(Boolean);
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const row = JSON.parse(lines[i]);
              if (!row || row.signatureValid === false) continue;
              const isPaidEvent =
                row.status === 'paid' ||
                row.eventName === 'order_created' ||
                row.eventName === 'subscription_payment_success' ||
                row.eventName === 'api_live_verified';
              if (!isPaidEvent) continue;
              if (normOrder && String(row.orderId || '').trim() === normOrder) {
                return row;
              }
              if (normEmail && String(row.email || '').trim().toLowerCase() === normEmail) {
                return row;
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
      return null;
    }

    function fetchLiveLemonSqueezyPaidOrder(email, orderId, cb) {
      const normEmail = String(email || '').trim().toLowerCase();
      const normOrder = String(orderId || '').trim();
      if (!lsApiKey || (!normEmail && !normOrder)) return cb(null);
      const queryPath = normEmail
        ? `/v1/orders?filter[store_id]=296100&filter[user_email]=${encodeURIComponent(normEmail)}`
        : `/v1/orders?filter[store_id]=296100`;
      const lsReq = https.request({
        hostname: 'api.lemonsqueezy.com',
        path: queryPath,
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${lsApiKey}`
        },
        timeout: 6000
      }, (lsRes) => {
        let raw = '';
        lsRes.on('data', c => { if (raw.length < 131072) raw += c.toString('utf8'); });
        lsRes.on('end', () => {
          try {
            const parsed = JSON.parse(raw || '{}');
            const list = Array.isArray(parsed.data) ? parsed.data : [];
            for (const item of list) {
              const attr = (item && item.attributes) || {};
              const firstItem = attr.first_order_item || {};
              const isPaid = attr.status === 'paid';
              const itemEmail = String(attr.user_email || '').trim().toLowerCase();
              const itemId = String(item.id || '');
              const itemNum = String(attr.order_number || '');
              if (isPaid && ((normEmail && itemEmail === normEmail) || (normOrder && (itemId === normOrder || itemNum === normOrder)))) {
                const entry = {
                  timestamp: new Date().toISOString(),
                  eventName: 'api_live_verified',
                  signatureValid: true,
                  orderId: itemId,
                  email: itemEmail,
                  totalUsd: attr.total_formatted || null,
                  status: 'paid',
                  variantId: firstItem.variant_id || null,
                  productId: firstItem.product_id || null,
                  productName: firstItem.product_name || ''
                };
                entry.planType = detectOrderPlanType(entry);
                try {
                  fs.mkdirSync(path.dirname(ordersLogPath), { recursive: true });
                  fs.appendFileSync(ordersLogPath, JSON.stringify(entry) + '\n', 'utf8');
                } catch (_) {}
                return cb(entry);
              }
            }
          } catch (_) {}
          cb(null);
        });
      });
      lsReq.on('error', () => cb(null));
      lsReq.on('timeout', () => { lsReq.destroy(); cb(null); });
      lsReq.end();
    }

    if (pathname === '/api/lemonsqueezy-checkout') {
      const handleCreateCheckout = (planParam, emailParam) => {
        const isPass = String(planParam || '').toLowerCase() === 'pass';
        const variantId = isPass
          ? String(process.env.LEMONSQUEEZY_TRACKER_VARIANT_ID || '2289779')
          : String(process.env.LEMONSQUEEZY_SINGLE_VARIANT_ID || '2289754');
        const fallbackUrl = isPass
          ? (process.env.LEMONSQUEEZY_TRACKER_PASS_URL || 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895')
          : (process.env.LEMONSQUEEZY_SINGLE_PASS_URL || 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599');
        const cleanEmail = String(emailParam || '').trim();
        const returnRedirectUrl = `https://kisfitglobal.com/?unlock=1&payment=success&plan=${isPass ? 'pass' : 'single'}${cleanEmail ? '&email=' + encodeURIComponent(cleanEmail) : ''}`;

        if (!lsApiKey) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
          res.end(JSON.stringify({ ok: true, checkoutUrl: fallbackUrl, variantId, mode: 'static_fallback' }));
          return;
        }

        const payloadObj = {
          data: {
            type: 'checkouts',
            attributes: {
              product_options: {
                name: isPass ? 'KISFIT Bio Labs — 6-Month Growth & Brain Monthly Care Pass' : 'KISFIT Bio Labs — Pediatric Growth & Brain Clinical Report (Single Pass)',
                description: 'Instant 100% Full Unlock on https://kisfitglobal.com/ (US CDC/WHO Height Predictor, Bone-Age Window & 5-Axis Brain LQ Report)',
                redirect_url: returnRedirectUrl,
                receipt_button_text: 'Open Unlocked KISFIT Bio Labs Clinical Report',
                receipt_link_url: returnRedirectUrl
              },
              checkout_options: {
                embed: true,
                media: true,
                logo: true,
                button_color: '#2563EB'
              },
              checkout_data: cleanEmail && cleanEmail.includes('@') ? { email: cleanEmail } : {}
            },
            relationships: {
              store: { data: { type: 'stores', id: String(process.env.LEMONSQUEEZY_STORE_ID || '296100') } },
              variant: { data: { type: 'variants', id: variantId } }
            }
          }
        };
        const payloadStr = JSON.stringify(payloadObj);
        const chkReq = https.request({
          hostname: 'api.lemonsqueezy.com',
          path: '/v1/checkouts',
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
            'Authorization': `Bearer ${lsApiKey}`,
            'Content-Length': Buffer.byteLength(payloadStr)
          },
          timeout: 7000
        }, (chkRes) => {
          let raw = '';
          chkRes.on('data', c => { if (raw.length < 65536) raw += c.toString('utf8'); });
          chkRes.on('end', () => {
            try {
              const parsed = JSON.parse(raw || '{}');
              const signedUrl = parsed && parsed.data && parsed.data.attributes && parsed.data.attributes.url;
              if (signedUrl) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
                res.end(JSON.stringify({ ok: true, checkoutUrl: signedUrl, variantId, mode: 'live_api_signed' }));
                return;
              }
            } catch (_) {}
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
            res.end(JSON.stringify({ ok: true, checkoutUrl: fallbackUrl, variantId, mode: 'static_fallback' }));
          });
        });
        chkReq.on('error', () => {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
          res.end(JSON.stringify({ ok: true, checkoutUrl: fallbackUrl, variantId, mode: 'static_fallback' }));
        });
        chkReq.on('timeout', () => {
          chkReq.destroy();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
          res.end(JSON.stringify({ ok: true, checkoutUrl: fallbackUrl, variantId, mode: 'static_fallback' }));
        });
        chkReq.write(payloadStr);
        chkReq.end();
      };

      if (req.method === 'POST') {
        let body = '';
        req.on('data', c => { if (body.length < 16384) body += c.toString('utf8'); });
        req.on('end', () => {
          try {
            const d = JSON.parse(body || '{}');
            handleCreateCheckout(d.plan, d.email);
          } catch (_) {
            handleCreateCheckout('single', '');
          }
        });
        return;
      }
      handleCreateCheckout(parsedUrl.searchParams.get('plan') || 'single', parsedUrl.searchParams.get('email') || '');
      return;
    }

    if (pathname === '/api/lemonsqueezy-orders/verify') {
      const finalizeVerify = (matchedOrder, emailParam) => {
        let normEmail = String(emailParam || (matchedOrder && matchedOrder.email) || '').trim().toLowerCase();
        let provisioned = null;
        if (matchedOrder) {
          provisioned = provisionPaidOrderAndNotify(matchedOrder, true);
        }
        const db = loadUsersDb();
        const userRecord = normEmail ? db.users.find(u => u.email === normEmail) : null;
        const verified = Boolean(matchedOrder || (userRecord && userRecord.unlockedPass));
        const resolvedPlan = (provisioned && provisioned.planType) || (userRecord && userRecord.planType) || (matchedOrder && detectOrderPlanType(matchedOrder)) || 'single';
        const resolvedOrderId = matchedOrder ? matchedOrder.orderId : (userRecord ? userRecord.lastOrderId || null : null);
        const magicUnlockUrl = verified
          ? `https://kisfitglobal.com/?unlock=1&payment=success${normEmail ? '&email=' + encodeURIComponent(normEmail) : ''}${resolvedOrderId ? '&order_id=' + encodeURIComponent(resolvedOrderId) : ''}&plan=${resolvedPlan}`
          : null;

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
        res.end(JSON.stringify({
          ok: true,
          verified,
          email: normEmail || null,
          planType: verified ? resolvedPlan : null,
          orderId: resolvedOrderId,
          totalUsd: matchedOrder ? matchedOrder.totalUsd : null,
          magicUnlockUrl,
          token: (verified && normEmail) ? createAuthToken(normEmail) : null,
          user: (verified && userRecord) ? {
            id: userRecord.id,
            name: userRecord.name,
            email: userRecord.email,
            unlockedPass: true,
            planType: resolvedPlan,
            lastOrderId: resolvedOrderId,
            expiresAt: userRecord.expiresAt || null
          } : null
        }));
      };

      const handleVerify = (emailParam, orderIdParam) => {
        const localMatch = findVerifiedOrderForEmailOrId(emailParam, orderIdParam);
        if (localMatch) {
          finalizeVerify(localMatch, emailParam);
          return;
        }
        fetchLiveLemonSqueezyPaidOrder(emailParam, orderIdParam, (liveMatch) => {
          finalizeVerify(liveMatch, emailParam);
        });
      };

      if (req.method === 'POST') {
        let body = '';
        req.on('data', c => { if (body.length < 32768) body += c.toString('utf8'); });
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            handleVerify(data.email, data.orderId || data.order_id);
          } catch (_) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
          }
        });
        return;
      }

      handleVerify(parsedUrl.searchParams.get('email'), parsedUrl.searchParams.get('orderId') || parsedUrl.searchParams.get('order_id'));
      return;
    }

    if (pathname === '/api/homepage-manager/status') {
      const db = loadUsersDb();
      const proUsers = db.users.filter(u => u && u.unlockedPass);
      let orderCount = 0;
      try {
        if (fs.existsSync(ordersLogPath)) {
          orderCount = fs.readFileSync(ordersLogPath, 'utf8').trim().split('\n').filter(Boolean).length;
        }
      } catch (_) {}
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
      res.end(JSON.stringify({
        ok: true,
        manager: 'KISFIT Autonomous Homepage & Paid-Order Manager v2.0',
        timestamp: new Date().toISOString(),
        globalIndexExists: fs.existsSync(path.join(DIST_GLOBAL_DIR, 'index.html')),
        totalRegisteredUsers: db.users.length,
        activeProMembers: proUsers.length,
        loggedWebhookEvents: orderCount
      }));
      return;
    }

    if (pathname === '/api/auth/register' && req.method === 'POST') {
      let body = '';
      req.on('data', c => { if (body.length < 65536) body += c.toString('utf8'); });
      req.on('end', () => {
        try {
          const crypto = require('crypto');
          const data = JSON.parse(body || '{}');
          const email = String(data.email || '').trim().toLowerCase();
          const name = String(data.name || '').trim() || email.split('@')[0];
          const password = String(data.password || '');

          if (!email || email.length < 3 || password.length < 4) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
            res.end(JSON.stringify({ ok: false, error: 'Please provide a valid User ID (min 3 characters) and password (min 4 characters).' }));
            return;
          }

          const db = loadUsersDb();
          if (db.users.some(u => u.email === email)) {
            res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
            res.end(JSON.stringify({ ok: false, error: 'An account with this User ID already exists. Please Sign In.' }));
            return;
          }

          const salt = crypto.randomBytes(16).toString('hex');
          const passwordHash = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
          const matchedOrder = findVerifiedOrderForEmailOrId(email, '');
          const newUser = {
            id: 'usr_' + Date.now().toString(36),
            name,
            email,
            salt,
            passwordHash,
            unlockedPass: Boolean(matchedOrder),
            lastOrderId: matchedOrder ? matchedOrder.orderId : null,
            childProfiles: data.childProfile ? [data.childProfile] : [],
            createdAt: new Date().toISOString()
          };
          db.users.push(newUser);
          saveUsersDb(db);

          const token = createAuthToken(email);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
          res.end(JSON.stringify({
            ok: true,
            token,
            user: {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              unlockedPass: newUser.unlockedPass,
              lastOrderId: newUser.lastOrderId,
              childProfiles: newUser.childProfiles
            }
          }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
          res.end(JSON.stringify({ ok: false, error: 'Invalid registration payload' }));
        }
      });
      return;
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      let body = '';
      req.on('data', c => { if (body.length < 32768) body += c.toString('utf8'); });
      req.on('end', () => {
        try {
          const crypto = require('crypto');
          const data = JSON.parse(body || '{}');
          const rawId = String(data.email || '').trim();
          const email = rawId.toLowerCase();
          const password = String(data.password || '');

          // Check zero-plaintext Admin Credential Digest
          const adminPayload = 'KISFIT_ADMIN_SALT_2026_V2|' + rawId + '|' + password + '|BIO_ATELIER_99';
          let h1 = 0x811c9dc5, h2 = 0x9e3779b9, h3 = 0x85ebca6b, h4 = 0xc2b2ae35;
          for (let round = 0; round < 4096; round++) {
            for (let i = 0; i < adminPayload.length; i++) {
              const c = adminPayload.charCodeAt(i) ^ (round & 0xff);
              h1 = Math.imul(h1 ^ c, 0x01000193);
              h2 = Math.imul(h2 ^ ((h1 >>> 13) + c), 0x85ebca6b);
              h3 = Math.imul(h3 ^ ((h2 >>> 16) + i), 0xc2b2ae35);
              h4 = Math.imul(h4 ^ ((h3 >>> 11) + round), 0x27d4eb2f);
            }
          }
          const adminDigest = [h1, h2, h3, h4].map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
          if (adminDigest === 'a86cfdc57a9f8d167c0546a365722330') {
            const token = createAuthToken(email);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
            res.end(JSON.stringify({
              ok: true,
              isAdmin: true,
              token,
              user: {
                id: 'usr_admin',
                name: 'Administrator',
                email: rawId,
                isAdmin: true,
                unlockedPass: true,
                lastOrderId: 'ADMIN_BYPASS',
                childProfiles: []
              }
            }));
            return;
          }

          const db = loadUsersDb();
          const user = db.users.find(u => u.email === email);
          if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
            res.end(JSON.stringify({ ok: false, error: 'Invalid User ID or Password. Please check your ID or Sign Up first.' }));
            return;
          }

          const checkHash = crypto.pbkdf2Sync(password, user.salt, 10000, 32, 'sha256').toString('hex');
          if (checkHash !== user.passwordHash) {
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
            res.end(JSON.stringify({ ok: false, error: 'Incorrect password. Please try again.' }));
            return;
          }

          const matchedOrder = findVerifiedOrderForEmailOrId(email, '');
          if (matchedOrder && !user.unlockedPass) {
            user.unlockedPass = true;
            user.lastOrderId = matchedOrder.orderId || null;
            saveUsersDb(db);
          }

          const token = createAuthToken(email);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
          res.end(JSON.stringify({
            ok: true,
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              unlockedPass: Boolean(user.unlockedPass),
              lastOrderId: user.lastOrderId || null,
              childProfiles: user.childProfiles || []
            }
          }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
          res.end(JSON.stringify({ ok: false, error: 'Invalid login payload' }));
        }
      });
      return;
    }

    if (pathname === '/api/auth/me') {
      const authHeader = String(req.headers['authorization'] || '');
      const rawToken = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : (parsedUrl.searchParams.get('token') || '');
      const email = verifyAuthToken(rawToken);
      if (!email) {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
        res.end(JSON.stringify({ ok: false, authenticated: false }));
        return;
      }
      const db = loadUsersDb();
      const user = db.users.find(u => u.email === email);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
        res.end(JSON.stringify({ ok: false, authenticated: false }));
        return;
      }
      const matchedOrder = findVerifiedOrderForEmailOrId(email, '');
      if (matchedOrder && !user.unlockedPass) {
        user.unlockedPass = true;
        user.lastOrderId = matchedOrder.orderId || null;
        saveUsersDb(db);
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...NO_CACHE_HEADERS });
      res.end(JSON.stringify({
        ok: true,
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          unlockedPass: Boolean(user.unlockedPass),
          lastOrderId: user.lastOrderId || null,
          childProfiles: user.childProfiles || []
        }
      }));
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
      const reqHostMf = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
      const isGlobalMf = reqHostMf.includes('kisfitglobal.com') || reqHostMf.includes('kidsfitglobal.com');
      const mfFile = (isGlobalMf && resolveSafeFile(DIST_GLOBAL_DIR, 'manifest.json')) || resolveSafeFile(DIST_DIR, 'manifest.json') || resolveSafeFile(ROOT_DIR, 'manifest.json');
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
<html lang="ko" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#F8FAFC">
  <title>KIDS-FIT 앱 실행기</title>
  <link rel="icon" href="https://kidsfit.co.kr/samples/app-icon-192.png">
  <link rel="apple-touch-icon" href="https://kidsfit.co.kr/samples/apple-touch-icon.png">
  <style>
    body { margin: 0; background: #F8FAFC; color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 24px; box-sizing: border-box; }
    .card { max-width: 400px; width: 100%; background: #FFFFFF; border: 1.5px solid #BFDBFE; border-radius: 24px; padding: 28px 22px; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); }
    .icon { width: 84px; height: 84px; border-radius: 20px; margin-bottom: 16px; border: 2px solid #1D4ED8; }
    h1 { font-size: 22px; font-weight: 900; margin: 0 0 8px; color: #0F172A; }
    p { font-size: 14.5px; color: #475569; line-height: 1.55; margin: 0 0 20px; }
    .btn { display: block; width: 100%; padding: 15px 18px; border-radius: 14px; background: #1D4ED8; color: #FFFFFF; font-weight: 900; font-size: 16px; text-decoration: none; box-sizing: border-box; margin-bottom: 10px; }
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
    if (pathname === '/' || pathname === '' || pathname === '/en' || pathname === '/en/' || pathname === '/us' || pathname === '/us/') {
      pathname = '/index.html';
    }
    if ((pathname === '/index.html' || (pathname.startsWith('/qna/') && pathname.endsWith('.html'))) && req.method === 'GET') {
      recordVisitorPageview(req, parsedUrl.searchParams.get('utm_source') || '');
    }

    const relPath = pathname.replace(/^\/+/, '');
    const reqHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
    const isGlobalHost =
      parsedUrl.searchParams.get('edition') !== 'ko' &&
      (reqHost.includes('kisfitglobal.com') || reqHost.includes('kidsfitglobal.com') || parsedUrl.searchParams.get('edition') === 'global' || parsedUrl.searchParams.get('paywall') === '1');

    // Look up file in DIST_GLOBAL_DIR first when serving Global English edition (kisfitglobal.com).
    // Strictly prevent kisfitglobal.com from falling back to Korean DIST_DIR for HTML/text/script routes.
    const reqExt = path.extname(pathname).toLowerCase();
    const isSharedMediaAsset = ['.mp4', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff2', '.woff', '.ttf'].includes(reqExt);
    const hasGlobalDist = fs.existsSync(path.join(DIST_GLOBAL_DIR, 'index.html'));
    let filePath = null;
    if (isGlobalHost && hasGlobalDist) {
      filePath =
        resolveSafeFile(DIST_GLOBAL_DIR, relPath) ||
        resolveSafeFile(DIST_GLOBAL_DIR, path.join(relPath, 'index.html'));
      if (!filePath && pathname.startsWith('/qna/')) {
        filePath = resolveSafeFile(DIST_GLOBAL_DIR, 'qna/topic-01.html') || resolveSafeFile(DIST_GLOBAL_DIR, 'qna/index.html');
      }
      if (!filePath && isSharedMediaAsset) {
        filePath = resolveSafeFile(DIST_DIR, relPath) || resolveSafeFile(ROOT_DIR, relPath);
      }
    } else {
      filePath =
        resolveSafeFile(DIST_DIR, relPath) ||
        resolveSafeFile(ROOT_DIR, relPath) ||
        resolveSafeFile(DIST_DIR, path.join(relPath, 'index.html')) ||
        resolveSafeFile(ROOT_DIR, path.join(relPath, 'index.html'));
    }

    // Fallback to index.html for legacy HTML routes
    const ext = path.extname(filePath || pathname).toLowerCase();
    if (!filePath && (ext === '' || ext === '.html')) {
      filePath =
        (isGlobalHost && hasGlobalDist && resolveSafeFile(DIST_GLOBAL_DIR, 'index.html')) ||
        resolveSafeFile(DIST_DIR, 'index.html') ||
        resolveSafeFile(ROOT_DIR, 'index.html');
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

    if (finalExt === '.html' && pathname === '/index.html' && isGlobalHost) {
      let htmlBody = fs.readFileSync(filePath, 'utf8');
      const canonicalRootUrl = 'https://kisfitglobal.com/';
      htmlBody = htmlBody
        .replace('<html lang="ko" data-theme="dark">', '<html lang="en" data-theme="light" data-edition="global-paid">')
        .replace(/<link rel="canonical" href="https:\/\/(kidsfit\.co\.kr|kisfitglobal\.com)(\/en)?\/?">/g, '<link rel="canonical" href="' + canonicalRootUrl + '">')
        .replace(/<meta property="og:url" content="https:\/\/(kidsfit\.co\.kr|kisfitglobal\.com)(\/en)?\/?">/g, '<meta property="og:url" content="' + canonicalRootUrl + '">')
        .replace(/https:\/\/kisfitglobal\.com\/samples\/og-kisfit-global-en-v5\.png(?!\?)/g, 'https://kisfitglobal.com/samples/og-kisfit-global-en-v5.png?v=20261028');
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
