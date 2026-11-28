/**
 * scripts/build.js
 * Production build script for KidsFit Pediatric Growth Atelier (kidsfit.co.kr)
 * Deterministic, zero-external-dependencies, cross-platform.
 * Pure Paid 2-Tier Latpeed Architecture (Zero Affiliate Links).
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function computeDeterministicBuildStamp() {
  const hash = crypto.createHash('sha256');
  for (const rel of [
    'src/js/kfk-atelier-app.js',
    'src/js/hq_member_crm_client.js',
    'src/js/qna-human-rl-curator.js',
    'src/css/style.css'
  ]) {
    const fp = path.join(ROOT_DIR, rel);
    if (fs.existsSync(fp)) {
      hash.update(fs.readFileSync(fp));
    }
  }
  return `20261128sw_${hash.digest('hex').slice(0, 8)}`;
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      if (/^(_work|shorts_10eps|10_naver_clip_videos|9_naver_brand_assets|enhanced_blog_images)$/i.test(childItemName)) return;
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    if (/\.(png|jpg|jpeg|webp|mp4|zip|pdf)$/i.test(src) && fs.existsSync(dest)) {
      try {
        const destStats = fs.statSync(dest);
        if (destStats.size === stats.size && destStats.mtimeMs >= stats.mtimeMs - 1000) {
          return;
        }
      } catch (_) {}
    }
    for (let attempt = 1; attempt <= 8; attempt++) {
      try {
        fs.copyFileSync(src, dest);
        break;
      } catch (_err) {
        try {
          fs.writeFileSync(dest, fs.readFileSync(src));
          break;
        } catch (writeErr) {
          if (attempt === 8) {
            if (fs.existsSync(dest)) return;
            throw writeErr;
          }
          const waitTill = Date.now() + 150;
          while (Date.now() < waitTill) {}
        }
      }
    }
  }
}

function build() {
  console.log('--- KidsFit Pediatric Growth Atelier Build Pipeline ---');
  const startTime = Date.now();

  // 1. Prepare dist/ (in-place overwrite to prevent Windows EPERM & race conditions)
  fs.mkdirSync(DIST_DIR, { recursive: true });
  console.log('[1/5] Prepared dist/ directory.');

  // 2. Preserve & Copy CNAME
  const cnameSrc = path.join(ROOT_DIR, 'CNAME');
  const cnameDest = path.join(DIST_DIR, 'CNAME');
  if (fs.existsSync(cnameSrc)) {
    fs.copyFileSync(cnameSrc, cnameDest);
    const domain = fs.readFileSync(cnameDest, 'utf8').trim();
    console.log(`[2/5] Copied CNAME (${domain}) -> dist/CNAME`);
  } else {
    throw new Error('Missing CNAME file at project root!');
  }

  // 3. Generate clean client-side data-bundle.js
  generateDataBundle();

  // 4. Build / Copy index.html with deterministic content-hash cache-busting stamp & Latpeed 2-Tier injection
  const buildStamp = computeDeterministicBuildStamp();
  const indexSrc = path.join(ROOT_DIR, 'index.html');
  const indexDest = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexSrc)) {
    let rawHtml = fs.readFileSync(indexSrc, 'utf8');
    try {
      const latpeedJsonPath = path.resolve(ROOT_DIR, '..', 'data', 'latpeed_kfk_live.json');
      let tier1Url = 'https://www.latpeed.com/products/daMaP';
      let tier2Url = 'https://www.latpeed.com/products/_5Nq4';
      if (fs.existsSync(latpeedJsonPath)) {
        const latData = JSON.parse(fs.readFileSync(latpeedJsonPath, 'utf8'));
        const t1Candidate = String(
          latData.tier1_9900_url || latData.product_url || latData.latpeed_live_url || latData.LATPEED_LIVE_URL || latData.url || ''
        ).trim();
        const t2Candidate = String(
          latData.tier2_19900_url || latData.tier2_url || latData.LATPEED_TIER2_URL || latData.store_url || ''
        ).trim();
        if (/^https:\/\/(?:www\.)?latpeed\.com\/.+/i.test(t1Candidate)) {
          tier1Url = t1Candidate;
        }
        if (/^https:\/\/(?:www\.)?latpeed\.com\/.+/i.test(t2Candidate)) {
          tier2Url = t2Candidate;
        }
      }
      rawHtml = rawHtml
        .replace(/STORE_LIVE_READY:\s*(?:false|true)/, 'STORE_LIVE_READY: true')
        .replace(/LATPEED_LIVE_URL:\s*'[^']*'/, `LATPEED_LIVE_URL: '${tier1Url}'`)
        .replace(/TIER1_9900_URL:\s*'[^']*'/, `TIER1_9900_URL: '${tier1Url}'`)
        .replace(/LATPEED_TIER2_URL:\s*'[^']*'/, `LATPEED_TIER2_URL: '${tier2Url}'`)
        .replace(/TIER2_19900_URL:\s*'[^']*'/, `TIER2_19900_URL: '${tier2Url}'`);
      console.log(`[Build] Auto-injected Latpeed Tier 1 -> ${tier1Url} | Tier 2 -> ${tier2Url}`);
    } catch (_) {}

    const stampedHtml = rawHtml.replace(/\?v=2026[0-9a-zA-Z_]+/g, `?v=${buildStamp}`);
    try {
      fs.writeFileSync(indexSrc, stampedHtml, 'utf8');
    } catch (_) {}
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        fs.writeFileSync(indexDest, stampedHtml, 'utf8');
        break;
      } catch (err) {
        if (attempt === 6) throw err;
        const waitTill = Date.now() + 150;
        while (Date.now() < waitTill) {}
      }
    }
    console.log(`[3/5] Copied index.html -> dist/index.html (cache-bust: ?v=${buildStamp})`);
  }

  // 5. Copy strict-allowlist src/ -> dist/src/ (zero legacy coupang/admin/brain-lq files)
  const srcDir = path.join(ROOT_DIR, 'src');
  if (fs.existsSync(srcDir)) {
    const ACTIVE_KFK_JS = new Set([
      'dc-school-ready-tool.js',
      'dc-share-card.js',
      'dc-ux-addons.js',
      'hq_member_crm_client.js',
      'kfk-atelier-app.js',
      'kfk-personalized-pdf.js',
      'pseo-mini-calc.js',
      'qna-human-rl-curator.js'
    ]);
    const ACTIVE_KFK_CSS = new Set(['style.css']);
    const targetSrc = path.join(DIST_DIR, 'src');
    const staleDataDir = path.join(targetSrc, 'data');
    if (fs.existsSync(staleDataDir)) fs.rmSync(staleDataDir, { recursive: true, force: true });
    const cssDest = path.join(targetSrc, 'css');
    fs.mkdirSync(cssDest, { recursive: true });
    fs.readdirSync(cssDest).forEach((fn) => { if (!ACTIVE_KFK_CSS.has(fn)) fs.rmSync(path.join(cssDest, fn), { recursive: true, force: true }); });
    ACTIVE_KFK_CSS.forEach((fn) => { const sf = path.join(srcDir, 'css', fn); if (fs.existsSync(sf)) copyRecursiveSync(sf, path.join(cssDest, fn)); });
    const jsDest = path.join(targetSrc, 'js');
    fs.mkdirSync(jsDest, { recursive: true });
    fs.readdirSync(jsDest).forEach((fn) => { if (!ACTIVE_KFK_JS.has(fn)) fs.rmSync(path.join(jsDest, fn), { recursive: true, force: true }); });
    ACTIVE_KFK_JS.forEach((fn) => { const sf = path.join(srcDir, 'js', fn); if (fs.existsSync(sf)) copyRecursiveSync(sf, path.join(jsDest, fn)); });
    ['assets', 'fonts', 'images'].forEach((sub) => {
      const s = path.join(srcDir, sub);
      if (fs.existsSync(s)) copyRecursiveSync(s, path.join(targetSrc, sub));
    });
    console.log('[4/5] Synced strict-allowlist src/ -> dist/src/ (zero legacy coupang/admin files)');
  }

  const samplesDir = path.join(ROOT_DIR, 'samples');
  if (fs.existsSync(samplesDir)) {
    copyRecursiveSync(samplesDir, path.join(DIST_DIR, 'samples'));
    console.log('[5/5] Copied samples/ -> dist/samples/');
  }

  const qnaDir = path.join(ROOT_DIR, 'qna');
  if (fs.existsSync(qnaDir)) {
    copyRecursiveSync(qnaDir, path.join(DIST_DIR, 'qna'));
    console.log('Copied qna/ -> dist/qna/');
  }

  // Normalize sitemap.xml to Cloudflare Pages Clean URLs (0 .html 308 redirects) & preserve /growth-chart/*
  const rootSitemapKfk = path.join(ROOT_DIR, 'sitemap.xml');
  if (fs.existsSync(rootSitemapKfk)) {
    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      const rawXml = fs.readFileSync(rootSitemapKfk, 'utf8');
      const rawLocs = [...rawXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
      const cleanSet = new Set();
      rawLocs.forEach((u) => {
        if (u.endsWith('/index.html')) cleanSet.add(u.slice(0, -'index.html'.length));
        else if (u.endsWith('.html')) cleanSet.add(u.slice(0, -5));
        else cleanSet.add(u);
      });
      const gcDir = path.join(DIST_DIR, 'growth-chart');
      if (fs.existsSync(gcDir)) {
        cleanSet.add('https://kidsfit.co.kr/growth-chart/');
        fs.readdirSync(gcDir).sort().forEach((fn) => {
          if (fn.endsWith('.html') && fn !== 'index.html') {
            cleanSet.add(`https://kidsfit.co.kr/growth-chart/${fn.slice(0, -5)}`);
          }
        });
      }
      const blocks = [...cleanSet].map(
        (loc) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${todayIso}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${loc === 'https://kidsfit.co.kr/' ? '1.0' : '0.80'}</priority>\n  </url>`
      );
      fs.writeFileSync(
        rootSitemapKfk,
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blocks.join('\n')}\n</urlset>\n`,
        'utf8'
      );
    } catch (_) {}
  }

  [
    'robots.txt',
    'sitemap.xml',
    'rss.xml',
    'feed.xml',
    'feed.json',
    'llms.txt',
    'llms-full.txt',
    'manifest.json',
    'sw.js',
    'bb7865143f912a88c04d31d3921a0988.txt',
    'naver696904f98e6ce2a823ce309436f2e2cd.html',
    'about.html',
    'privacy.html',
    'terms.html',
    'contact.html',
    'hq-mailing-endpoint.json'
  ].forEach((file) => {
    const fPath = path.join(ROOT_DIR, file);
    if (fs.existsSync(fPath)) {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          fs.copyFileSync(fPath, path.join(DIST_DIR, file));
          break;
        } catch (e) {
          if (attempt === 4) throw e;
          const waitTill = Date.now() + 80;
          while (Date.now() < waitTill) {}
        }
      }
      console.log(`Copied ${file} -> dist/${file}`);
    }
  });

  // Ensure legacy coupang-kidsfit.html is permanently purged from dist/
  const legacyCoupangDist = path.join(DIST_DIR, 'coupang-kidsfit.html');
  if (fs.existsSync(legacyCoupangDist)) {
    try { fs.unlinkSync(legacyCoupangDist); } catch (_) {}
  }

  if (process.env.SYNC_DIST_GLOBAL === '1') {
    try {
      const siblingGlobalDist = path.resolve(ROOT_DIR, '..', '2사업부', 'dist');
      const targetGlobalDir = path.join(ROOT_DIR, 'dist-global');
      if (fs.existsSync(siblingGlobalDist)) {
        fs.mkdirSync(targetGlobalDir, { recursive: true });
        ['index.html', 'CNAME', 'robots.txt', 'sitemap.xml', 'rss.xml', 'feed.json', 'llms.txt', 'llms-full.txt', 'manifest.json', 'sw.js', 'bb7865143f912a88c04d31d3921a0988.txt', 'about.html', 'privacy.html', 'terms.html', 'contact.html', '_routes.json', 'hq-mailing-endpoint.json'].forEach((f) => {
          const srcF = path.join(siblingGlobalDist, f);
          if (fs.existsSync(srcF)) fs.copyFileSync(srcF, path.join(targetGlobalDir, f));
        });
        ['src/css', 'src/js', 'qna', 'calculators'].forEach((subDir) => {
          const srcSub = path.join(siblingGlobalDist, subDir);
          if (fs.existsSync(srcSub)) copyRecursiveSync(srcSub, path.join(targetGlobalDir, subDir));
        });
        console.log('Synced Global English assets -> dist-global/');
      }
    } catch (_) {}
  }

  generateStaticApiEndpoints();

  const duration = Date.now() - startTime;
  console.log(`Build complete in ${duration}ms! Target: ${DIST_DIR}`);
}

function generateStaticApiEndpoints() {
  try {
    const apiDir = path.join(DIST_DIR, 'api');
    fs.mkdirSync(apiDir, { recursive: true });

    const healthPayload = JSON.stringify({
      status: 'ok',
      service: 'KidsFit Pediatric Growth Atelier',
      mode: 'static_latpeed_2tier',
      domain: 'kidsfit.co.kr',
      affiliate_links: 0,
      timestamp: new Date().toISOString()
    }, null, 2);
    fs.writeFileSync(path.join(apiDir, 'health'), healthPayload, 'utf8');
    fs.writeFileSync(path.join(apiDir, 'health.json'), healthPayload, 'utf8');

    const statsData = {
      status: 'ok',
      mode: 'static',
      analytics: {
        today: { date: new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10), uv: 0, pv: 0, diagnoses: { total: 0, growth: 0 } },
        total: { uv: 0, pv: 0, diagnoses: { total: 0, growth: 0 } }
      }
    };
    const statsJson = JSON.stringify(statsData, null, 2);
    fs.writeFileSync(path.join(apiDir, 'stats'), statsJson, 'utf8');
    fs.writeFileSync(path.join(apiDir, 'stats.json'), statsJson, 'utf8');

    const visitJson = JSON.stringify({ ok: true, mode: 'static' }, null, 2);
    const authJson = JSON.stringify({ ok: true, __fallbackLocal: true, mode: 'client_local' }, null, 2);
    fs.writeFileSync(path.join(apiDir, 'visit'), visitJson, 'utf8');
    fs.writeFileSync(path.join(apiDir, 'visit.json'), visitJson, 'utf8');
    const authSubDir = path.join(apiDir, 'auth');
    fs.mkdirSync(authSubDir, { recursive: true });
    fs.writeFileSync(path.join(authSubDir, 'login'), authJson, 'utf8');
    fs.writeFileSync(path.join(authSubDir, 'login.json'), authJson, 'utf8');
    fs.writeFileSync(path.join(authSubDir, 'register'), authJson, 'utf8');
    fs.writeFileSync(path.join(authSubDir, 'register.json'), authJson, 'utf8');

    const passesJson = JSON.stringify({
      status: 'ok',
      source: 'latpeed-2tier-atelier',
      offers: [],
      passes: [
        { tier: 'tier1', title: '단건 정밀 성장·뼈나이 리포트 패스', price_krw: 9900, url: 'https://www.latpeed.com/products/daMaP' },
        { tier: 'tier2', title: '6개월 성장속도 트래커 풀패키지 패스', price_krw: 19900, url: 'https://www.latpeed.com/products/_5Nq4' }
      ]
    }, null, 2);
    fs.writeFileSync(path.join(apiDir, 'adpick-offers'), passesJson, 'utf8');
    fs.writeFileSync(path.join(apiDir, 'adpick-offers.json'), passesJson, 'utf8');

    const shareSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420"><rect width="800" height="420" rx="20" fill="#FAF7F2"/><rect x="24" y="24" width="752" height="372" rx="14" fill="#FFFFFF" stroke="#E6E0D6"/><text x="64" y="102" fill="#2F5241" font-family="serif" font-size="20" font-weight="bold">KIDSFIT PEDIATRIC GROWTH ATELIER · kidsfit.co.kr</text><text x="64" y="176" fill="#231F1D" font-family="serif" font-size="36" font-weight="bold">키즈핏 소아성장 아틀리에</text><text x="64" y="232" fill="#3A3430" font-family="sans-serif" font-size="22">질병관리청(KDCA 2017) 성장도표 · 병원 뼈나이 경과 시차(Δt) 보정</text><rect x="64" y="288" width="360" height="58" rx="10" fill="#2F5241"/><text x="98" y="325" fill="#FFFFFF" font-family="sans-serif" font-size="21" font-weight="bold">우리 아이 성장 시계 진단하기</text></svg>`;
    fs.writeFileSync(path.join(apiDir, 'share-card.svg'), shareSvg, 'utf8');

    const redirectsContent = [
      '/api/health /api/health.json 200',
      '/api/stats /api/stats.json 200',
      '/api/visit /api/visit.json 200',
      '/api/auth/login /api/auth/login.json 200',
      '/api/auth/register /api/auth/register.json 200',
      '/* /index.html 200'
    ].join('\n') + '\n';
    fs.writeFileSync(path.join(DIST_DIR, '_redirects'), redirectsContent, 'utf8');
    console.log('[Build] Generated static API endpoints & dist/_redirects (0 affiliate links).');
  } catch (e) {
    console.warn('[Build] Static API generation warning:', e.message);
  }
}

function generateDataBundle() {
  const growthPath = path.join(ROOT_DIR, 'src', 'data', 'growth-standards.json');
  const authPath = path.join(ROOT_DIR, 'src', 'data', 'official-authorities.json');
  if (!fs.existsSync(growthPath)) return;

  const growthJson = fs.readFileSync(growthPath, 'utf8').trim();
  const authJson = fs.existsSync(authPath) ? fs.readFileSync(authPath, 'utf8').trim() : '{}';

  const bundleContent = `/**
 * KidsFit Pediatric Growth Atelier - Client-Side Auxology Standards Bundle
 * Generated by scripts/build.js (Pure KDCA 2017 & Official Authorities — Zero Affiliate Links)
 */
(function (global) {
  'use strict';
  var growthData = ${growthJson};
  var authoritiesData = ${authJson};
  if (typeof window !== 'undefined') {
    window.KIDSFIT_GROWTH_DATA = growthData;
    window.KIDSFIT_AUTHORITIES_DATA = authoritiesData;
  }
  if (typeof global !== 'undefined' && typeof window === 'undefined') {
    global.KIDSFIT_GROWTH_DATA = growthData;
    global.KIDSFIT_AUTHORITIES_DATA = authoritiesData;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { growthData: growthData, authoritiesData: authoritiesData };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
`;

  const srcBundle = path.join(ROOT_DIR, 'src', 'data', 'data-bundle.js');
  fs.writeFileSync(srcBundle, bundleContent, 'utf8');
  const distBundleDir = path.join(DIST_DIR, 'src', 'data');
  fs.mkdirSync(distBundleDir, { recursive: true });
  fs.writeFileSync(path.join(distBundleDir, 'data-bundle.js'), bundleContent, 'utf8');
  console.log('[Build] Generated pure KDCA 2017 client-side data-bundle.js (zero affiliate catalog bloat).');
}

try {
  build();
  process.exit(0);
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
}
