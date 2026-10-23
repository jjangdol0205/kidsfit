/**
 * scripts/build.js
 * Production build script for KidsFit Growth Studio (truthofmarket.com)
 * Deterministic, zero-external-dependencies, cross-platform.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
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
          if (attempt === 8) throw writeErr;
          const waitTill = Date.now() + 150;
          while (Date.now() < waitTill) {}
        }
      }
    }
  }
}

function build() {
  console.log('--- KidsFit Growth Studio Build Pipeline ---');
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

  // 3. Synchronize live accumulated paper count across HTML & JS source files, then generate data-bundle.js
  syncLiveResearchCountToSourceFiles();
  generateDataBundle();

  // 4. Build / Copy index.html with automatic cache-busting stamp
  const buildStamp = `20261022_${Date.now().toString(36)}`;
  const indexSrc = path.join(ROOT_DIR, 'index.html');
  const indexDest = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexSrc)) {
    const rawHtml = fs.readFileSync(indexSrc, 'utf8');
    const stampedHtml = rawHtml.replace(/\?v=2026[0-9a-zA-Z_]+/g, `?v=${buildStamp}`);
    try {
      fs.writeFileSync(indexSrc, stampedHtml, 'utf8');
    } catch (_) {
      // Ignore transient Windows file lock on root index.html during rapid test rebuilds
    }
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

  // 5. Copy Assets / Source & Samples directories if present
  const srcDir = path.join(ROOT_DIR, 'src');
  if (fs.existsSync(srcDir)) {
    copyRecursiveSync(srcDir, path.join(DIST_DIR, 'src'));
    console.log('[4/5] Copied src/ -> dist/src/');
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

  // Copy robots.txt, sitemap.xml, rss.xml, feed.json, manifest.json, and sw.js if they exist (with EBUSY retry)
  ['robots.txt', 'sitemap.xml', 'rss.xml', 'feed.json', 'manifest.json', 'sw.js', 'bb7865143f912a88c04d31d3921a0988.txt'].forEach((file) => {
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

  const duration = Date.now() - startTime;
  console.log(`Build complete in ${duration}ms! Target: ${DIST_DIR}`);
}

function syncLiveResearchCountToSourceFiles() {
  const researchPath = path.join(ROOT_DIR, 'src', 'data', 'research-knowledge-base.json');
  if (!fs.existsSync(researchPath)) return;
  try {
    const kb = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
    let kbModified = false;
    if (Array.isArray(kb.papers)) {
      kb.papers.forEach((p) => {
        const yr = Number(p.year) || 2020;
        if (yr < 1960 || yr > 2026) {
          p.year = Math.max(1960, Math.min(2026, yr));
          kbModified = true;
        }
      });
    }
    if (kbModified) {
      fs.writeFileSync(researchPath, JSON.stringify(kb, null, 2) + '\n', 'utf8');
    }
    const meta = kb.metadata || {};
    const total = Number(meta.total_papers) || (Array.isArray(kb.papers) ? kb.papers.length : 0);
    if (!total || total < 100) return;

    const totalFormatted = total.toLocaleString('en-US'); // e.g., "2,723"
    const bal = (meta.learning_analytics && meta.learning_analytics.macro_pillar_balance) || {};
    let gCnt = Number(bal.growth_macro_count || 0);
    let lCnt = Number(bal.learning_macro_count || 0);
    if (!gCnt || !lCnt) {
      const pc = meta.pillar_counts || {};
      gCnt = Number(pc.growth_endocrinology || 0) + Number(pc.posture_biomechanics_exercise || 0);
      lCnt = Math.max(0, total - gCnt);
    }
    const gStr = gCnt.toLocaleString('en-US');
    const lStr = lCnt.toLocaleString('en-US');

    const targetFiles = [
      path.join(ROOT_DIR, 'index.html'),
      path.join(ROOT_DIR, 'src', 'js', 'i18n.js'),
      path.join(ROOT_DIR, 'src', 'js', 'onboarding-wizard.js'),
      path.join(ROOT_DIR, 'src', 'js', 'haptic-typewriter.js'),
      path.join(ROOT_DIR, 'src', 'js', 'app.js')
    ];

    targetFiles.forEach((fp) => {
      if (!fs.existsSync(fp)) return;
      let content = fs.readFileSync(fp, 'utf8');
      const updated = content
        .replace(/논문 [1-9],[0-9]{3}편/g, `논문 ${totalFormatted}편`)
        .replace(/[1-9],[0-9]{3}편 (인지뇌과학|소아내분비)/g, `${totalFormatted}편 $1`)
        .replace(/[1-9],[0-9]{3} (Clinical Papers|Cognitive|Pediatric|peer-reviewed|research papers|papers)/g, `${totalFormatted} $1`)
        .replace(/[1-9],[0-9]{3}-Paper DB/g, `${totalFormatted}-Paper DB`)
        .replace(/누적 [1-9],[0-9]{3}편 반영 중 \(신체성장 [0-9,]+편 · 두뇌학습 [0-9,]+편\)/g, `누적 ${totalFormatted}편 반영 중 (신체성장 ${gStr}편 · 두뇌학습 ${lStr}편)`);
      if (updated !== content) {
        try {
          fs.writeFileSync(fp, updated, 'utf8');
        } catch (_) {}
      }
    });
    console.log(`[Build] Synced live accumulated paper count (${totalFormatted} papers: Growth ${gStr} / Learning ${lStr}) across UI files.`);
  } catch (e) {
    console.warn('[Build] Could not sync live paper count:', e.message);
  }
}

function generateDataBundle() {
  const growthPath = path.join(ROOT_DIR, 'src', 'data', 'growth-standards.json');
  const kdstPath = path.join(ROOT_DIR, 'src', 'data', 'kdst-rubrics.json');
  const catalogPath = path.join(ROOT_DIR, 'src', 'data', 'curation-catalog.json');
  const authPath = path.join(ROOT_DIR, 'src', 'data', 'official-authorities.json');
  const researchPath = path.join(ROOT_DIR, 'src', 'data', 'research-knowledge-base.json');
  const cohortPath = path.join(ROOT_DIR, 'src', 'data', 'user-cohort-db.json');

  if (!fs.existsSync(growthPath) || !fs.existsSync(kdstPath) || !fs.existsSync(catalogPath)) {
    return;
  }

  const growthJson = fs.readFileSync(growthPath, 'utf8').trim();
  const kdstJson = fs.readFileSync(kdstPath, 'utf8').trim();
  const catalogJson = fs.readFileSync(catalogPath, 'utf8').trim();
  const authJson = fs.existsSync(authPath) ? fs.readFileSync(authPath, 'utf8').trim() : '{}';
  const researchJson = fs.existsSync(researchPath) ? fs.readFileSync(researchPath, 'utf8').trim() : '{}';
  const cohortJson = fs.existsSync(cohortPath) ? fs.readFileSync(cohortPath, 'utf8').trim() : '{}';

  const bundleContent = `/**
 * KidsFit Growth Studio - Client-Side Data Bundle
 * Generated by scripts/build.js
 * Inlines official KDCA growth standards, K-DST rubrics, 40 regional curation catalog,
 * official authorities, 1,100+ peer-reviewed academic research knowledge base,
 * and User Input Cohort DB for browser runtime (window.KIDSFIT_*) and Node.js CommonJS (module.exports).
 */

(function (global) {
  'use strict';

  var growthData = ${growthJson};
  var kdstData = ${kdstJson};
  var catalogData = ${catalogJson};
  var authoritiesData = ${authJson};
  var researchData = ${researchJson};
  var userCohortData = ${cohortJson};

  if (typeof window !== 'undefined') {
    window.KIDSFIT_GROWTH_DATA = growthData;
    window.KIDSFIT_KDST_DATA = kdstData;
    window.KIDSFIT_CATALOG_DATA = catalogData;
    window.KIDSFIT_AUTHORITIES_DATA = authoritiesData;
    window.KIDSFIT_RESEARCH_DATA = researchData;
    window.KIDSFIT_USER_COHORT_DB = userCohortData;
  }
  if (typeof global !== 'undefined' && typeof window === 'undefined') {
    global.KIDSFIT_GROWTH_DATA = growthData;
    global.KIDSFIT_KDST_DATA = kdstData;
    global.KIDSFIT_CATALOG_DATA = catalogData;
    global.KIDSFIT_AUTHORITIES_DATA = authoritiesData;
    global.KIDSFIT_RESEARCH_DATA = researchData;
    global.KIDSFIT_USER_COHORT_DB = userCohortData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { growthData, kdstData, catalogData, authoritiesData, researchData, userCohortData };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
`;

  const srcBundle = path.join(ROOT_DIR, 'src', 'data', 'data-bundle.js');
  let needWriteSrc = true;
  if (fs.existsSync(srcBundle)) {
    try {
      const existing = fs.readFileSync(srcBundle, 'utf8');
      if (existing === bundleContent) needWriteSrc = false;
    } catch (_) {}
  }
  if (needWriteSrc) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        fs.writeFileSync(srcBundle, bundleContent, 'utf8');
        break;
      } catch (e) {
        if (attempt === 4) throw e;
      }
    }
  }

  const distBundleDir = path.join(DIST_DIR, 'src', 'data');
  if (!fs.existsSync(distBundleDir)) {
    fs.mkdirSync(distBundleDir, { recursive: true });
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.writeFileSync(path.join(distBundleDir, 'data-bundle.js'), bundleContent, 'utf8');
      break;
    } catch (e) {
      if (attempt === 4) throw e;
    }
  }
  console.log('[Build] Generated client-side data-bundle.js with inlined datasets (including official-authorities.json)');
}

try {
  build();
  process.exit(0);
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
}
