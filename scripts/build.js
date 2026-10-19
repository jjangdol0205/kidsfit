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
    fs.copyFileSync(src, dest);
  }
}

function build() {
  console.log('--- KidsFit Growth Studio Build Pipeline ---');
  const startTime = Date.now();

  // 1. Reset / Prepare dist/
  if (fs.existsSync(DIST_DIR)) {
    console.log('[1/4] Cleaning existing dist/ directory...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  console.log('[1/4] Created fresh dist/ directory.');

  // 2. Preserve & Copy CNAME
  const cnameSrc = path.join(ROOT_DIR, 'CNAME');
  const cnameDest = path.join(DIST_DIR, 'CNAME');
  if (fs.existsSync(cnameSrc)) {
    fs.copyFileSync(cnameSrc, cnameDest);
    const domain = fs.readFileSync(cnameDest, 'utf8').trim();
    console.log(`[2/4] Copied CNAME (${domain}) -> dist/CNAME`);
  } else {
    throw new Error('Missing CNAME file at project root!');
  }

  // 3. Build / Copy index.html
  const indexSrc = path.join(ROOT_DIR, 'index.html');
  const indexDest = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexSrc)) {
    fs.copyFileSync(indexSrc, indexDest);
    console.log('[3/4] Copied index.html -> dist/index.html');
  } else {
    // Generate clean placeholder for initial milestone
    const initialHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>키즈핏 그로스 스튜디오 (KidsFit Growth Studio)</title>
  <style>
    body {
      background-color: #FAF8F5;
      color: #1F2937;
      font-family: -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: #FFFFFF;
      padding: 2.5rem;
      border-radius: 24px;
      box-shadow: 0 10px 30px rgba(20, 30, 55, 0.05);
      border: 1px solid #E6EAF2;
      text-align: center;
      max-width: 480px;
    }
    h1 { color: #5B4BFF; margin-bottom: 0.5rem; font-size: 1.5rem; }
    p { color: #4B5563; font-size: 0.95rem; line-height: 1.5; }
    .badge {
      display: inline-block;
      background: #EEF2FF;
      color: #4F46E5;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Built on Official Standards</div>
    <h1>KidsFit Growth Studio</h1>
    <p>우리 아이 신체 성장 × 두뇌·소근육 발달 × 주말 전시·역사 코스 맞춤 처방소</p>
  </div>
</body>
</html>`;
    fs.writeFileSync(indexDest, initialHtml, 'utf8');
    console.log('[3/4] Initialized clean dist/index.html (Warm Ivory / KidsFit)');
  }

  // 4. Copy Assets / Source directories if present
  const srcDir = path.join(ROOT_DIR, 'src');
  if (fs.existsSync(srcDir)) {
    copyRecursiveSync(srcDir, path.join(DIST_DIR, 'src'));
    console.log('[4/4] Copied src/ -> dist/src/');
  } else {
    console.log('[4/4] src/ directory not yet present (will be added in subsequent milestones).');
  }

  // 5. Generate and inline datasets into data-bundle.js for both src/ and dist/
  generateDataBundle();

  // Copy robots.txt and sitemap.xml if they exist
  ['robots.txt', 'sitemap.xml'].forEach((file) => {
    const fPath = path.join(ROOT_DIR, file);
    if (fs.existsSync(fPath)) {
      fs.copyFileSync(fPath, path.join(DIST_DIR, file));
      console.log(`Copied ${file} -> dist/${file}`);
    }
  });

  const duration = Date.now() - startTime;
  console.log(`Build complete in ${duration}ms! Target: ${DIST_DIR}`);
}

function generateDataBundle() {
  const growthPath = path.join(ROOT_DIR, 'src', 'data', 'growth-standards.json');
  const kdstPath = path.join(ROOT_DIR, 'src', 'data', 'kdst-rubrics.json');
  const catalogPath = path.join(ROOT_DIR, 'src', 'data', 'curation-catalog.json');

  if (!fs.existsSync(growthPath) || !fs.existsSync(kdstPath) || !fs.existsSync(catalogPath)) {
    return;
  }

  const growthJson = fs.readFileSync(growthPath, 'utf8').trim();
  const kdstJson = fs.readFileSync(kdstPath, 'utf8').trim();
  const catalogJson = fs.readFileSync(catalogPath, 'utf8').trim();

  const bundleContent = `/**
 * KidsFit Growth Studio - Client-Side Data Bundle
 * Generated by scripts/build.js
 * Inlines official KDCA growth standards, K-DST rubrics, and 40 regional curation catalog
 * for browser runtime (window.KIDSFIT_*) and Node.js CommonJS (module.exports).
 */

(function (global) {
  'use strict';

  var growthData = ${growthJson};
  var kdstData = ${kdstJson};
  var catalogData = ${catalogJson};

  if (typeof window !== 'undefined') {
    window.KIDSFIT_GROWTH_DATA = growthData;
    window.KIDSFIT_KDST_DATA = kdstData;
    window.KIDSFIT_CATALOG_DATA = catalogData;
  }
  if (typeof global !== 'undefined' && typeof window === 'undefined') {
    global.KIDSFIT_GROWTH_DATA = growthData;
    global.KIDSFIT_KDST_DATA = kdstData;
    global.KIDSFIT_CATALOG_DATA = catalogData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { growthData, kdstData, catalogData };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
`;

  // Write to src/data/data-bundle.js
  const srcBundle = path.join(ROOT_DIR, 'src', 'data', 'data-bundle.js');
  fs.writeFileSync(srcBundle, bundleContent, 'utf8');

  // Also write to dist/src/data/data-bundle.js if dist exists
  const distBundleDir = path.join(DIST_DIR, 'src', 'data');
  if (!fs.existsSync(distBundleDir)) {
    fs.mkdirSync(distBundleDir, { recursive: true });
  }
  fs.writeFileSync(path.join(distBundleDir, 'data-bundle.js'), bundleContent, 'utf8');
  console.log('[Build] Generated client-side data-bundle.js with inlined datasets');
}

try {
  build();
  process.exit(0);
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
}
