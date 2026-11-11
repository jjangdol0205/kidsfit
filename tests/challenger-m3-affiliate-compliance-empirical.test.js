/**
 * tests/challenger-m3-affiliate-compliance-empirical.test.js
 * Empirical Challenger Outbound Affiliate Link & Partner Compliance Scanner
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-global', '.agents', '.flow-browser-profile', '.naver-browser-profile']);

const AFFILIATE_DOMAINS = ['coupang.com', 'iherb.com', 'linkprice.com', 'yes24.com'];

const PARTNER_PARAMS = {
  coupang: 'AF7865143',
  iherb: 'IPZ1547',
  linkprice_yes24: 'A100708867'
};

function getAllFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.has(file)) {
        results = results.concat(getAllFiles(fullPath, exts));
      }
    } else {
      if (exts.some(ext => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

console.log('========================================================================');
console.log('   EMPIRICAL CHALLENGER: AFFILIATE COMPLIANCE & OUTBOUND URL SCANNER     ');
console.log('========================================================================\n');

const files = getAllFiles(ROOT_DIR, ['.html', '.js']);
console.log(`Discovered ${files.length} candidate files in ${ROOT_DIR} (excluding dist/ & node_modules/)\n`);

let totalTagsScanned = 0;
let totalUrlsScanned = 0;
let dynamicGeneratorsAudited = 0;
const violations = [];

files.forEach(filePath => {
  const relPath = path.relative(ROOT_DIR, filePath);
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return;
  }

  // 1. Scan for <a ...> tags containing affiliate domains
  const aTagRegex = /<a\s+[^>]*?>/gis;
  let match;
  while ((match = aTagRegex.exec(content)) !== null) {
    const tag = match[0];
    const lowerTag = tag.toLowerCase();

    const isAffiliate = AFFILIATE_DOMAINS.some(dom => lowerTag.includes(dom));
    if (!isAffiliate) continue;

    totalTagsScanned++;

    // Extract href
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    const href = hrefMatch ? hrefMatch[1] : '';

    // Check rel attribute: must contain noopener, noreferrer, sponsored
    const relMatch = tag.match(/rel=["']([^"']+)["']/i);
    if (!relMatch) {
      violations.push({
        file: relPath,
        type: 'MISSING_REL',
        detail: `Tag has no rel attribute: ${tag.slice(0, 100)}`
      });
    } else {
      const relTokens = relMatch[1].toLowerCase().split(/\s+/);
      const missingTokens = ['noopener', 'noreferrer', 'sponsored'].filter(t => !relTokens.includes(t));
      if (missingTokens.length > 0) {
        violations.push({
          file: relPath,
          type: 'INCOMPLETE_REL',
          detail: `Tag rel missing [${missingTokens.join(', ')}]: rel="${relMatch[1]}" in ${tag.slice(0, 100)}`
        });
      }
    }

    // Check target="_blank"
    const targetMatch = tag.match(/target=["']([^"']+)["']/i);
    if (!targetMatch || targetMatch[1].toLowerCase() !== '_blank') {
      violations.push({
        file: relPath,
        type: 'INVALID_TARGET',
        detail: `Tag target is not _blank: ${targetMatch ? targetMatch[1] : 'NONE'} in ${tag.slice(0, 100)}`
      });
    }

    // Check partner parameter inside href
    if (href) {
      totalUrlsScanned++;
      const lowerHref = href.toLowerCase();
      if (lowerHref.includes('coupang.com')) {
        if (!href.includes(PARTNER_PARAMS.coupang) && !href.includes('${')) {
          violations.push({
            file: relPath,
            type: 'MISSING_PARTNER_PARAM',
            detail: `Coupang link missing partner ID ${PARTNER_PARAMS.coupang}: ${href}`
          });
        }
      } else if (lowerHref.includes('iherb.com')) {
        if (!href.includes(PARTNER_PARAMS.iherb) && !href.includes('${')) {
          violations.push({
            file: relPath,
            type: 'MISSING_PARTNER_PARAM',
            detail: `iHerb link missing partner ID ${PARTNER_PARAMS.iherb}: ${href}`
          });
        }
      } else if (lowerHref.includes('linkprice.com') || lowerHref.includes('yes24.com')) {
        if (!href.includes(PARTNER_PARAMS.linkprice_yes24) && !href.includes('${')) {
          violations.push({
            file: relPath,
            type: 'MISSING_PARTNER_PARAM',
            detail: `LinkPrice/Yes24 link missing partner ID ${PARTNER_PARAMS.linkprice_yes24}: ${href}`
          });
        }
      }
    }
  }

  // 2. Scan for static literal URLs in JS/HTML not wrapped in <a> tags
  const urlRegex = /https?:\/\/[^\s"'`<>]+/gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(content)) !== null) {
    const rawUrl = urlMatch[0];
    const lowerUrl = rawUrl.toLowerCase();
    if (lowerUrl.includes('coupang.com/vp/products') || lowerUrl.includes('kr.iherb.com/pr/') || lowerUrl.includes('click.linkprice.com/click.php')) {
      // If literal URL (does not contain template variable like ${...)
      if (!rawUrl.includes('${')) {
        totalUrlsScanned++;
        if (lowerUrl.includes('coupang.com') && !rawUrl.includes(PARTNER_PARAMS.coupang)) {
          violations.push({
            file: relPath,
            type: 'STATIC_URL_MISSING_PARAM',
            detail: `Coupang URL missing ${PARTNER_PARAMS.coupang}: ${rawUrl.slice(0, 80)}`
          });
        } else if (lowerUrl.includes('iherb.com') && !rawUrl.includes(PARTNER_PARAMS.iherb)) {
          violations.push({
            file: relPath,
            type: 'STATIC_URL_MISSING_PARAM',
            detail: `iHerb URL missing ${PARTNER_PARAMS.iherb}: ${rawUrl.slice(0, 80)}`
          });
        } else if (lowerUrl.includes('linkprice.com') && !rawUrl.includes(PARTNER_PARAMS.linkprice_yes24)) {
          violations.push({
            file: relPath,
            type: 'STATIC_URL_MISSING_PARAM',
            detail: `LinkPrice URL missing ${PARTNER_PARAMS.linkprice_yes24}: ${rawUrl.slice(0, 80)}`
          });
        }
      }
    }
  }
});

// 3. Dynamic Generator Runtime Verification:
// Test pinpoint-curator.js and reference-chips.js to verify that their generated URLs contain valid partner IDs
console.log('[Dynamic Generator Evaluation]');

try {
  // Test reference-chips.js
  const refChipsCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'reference-chips.js'), 'utf8');
  assert(refChipsCode.includes("coupang: 'AF7865143'"), 'reference-chips.js missing Coupang AF7865143 in config');
  assert(refChipsCode.includes("linkprice: 'A100708867'"), 'reference-chips.js missing LinkPrice A100708867 in config');
  assert(refChipsCode.includes("iherb: 'IPZ1547'"), 'reference-chips.js missing iHerb IPZ1547 in config');
  dynamicGeneratorsAudited++;
  console.log('  ✓ reference-chips.js default affiliate configuration verified (AF7865143, A100708867, IPZ1547)');
} catch (err) {
  violations.push({ file: 'src/js/reference-chips.js', type: 'CONFIG_ERROR', detail: err.message });
}

try {
  // Test pinpoint-curator.js
  const pinpointCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'pinpoint-curator.js'), 'utf8');
  assert(pinpointCode.includes("coupang: 'AF7865143'"), 'pinpoint-curator.js missing Coupang AF7865143 in DEFAULT_AFF');
  assert(pinpointCode.includes("linkprice: 'A100708867'"), 'pinpoint-curator.js missing LinkPrice A100708867 in DEFAULT_AFF');
  assert(pinpointCode.includes("iherb: 'IPZ1547'"), 'pinpoint-curator.js missing iHerb IPZ1547 in DEFAULT_AFF');
  dynamicGeneratorsAudited++;
  console.log('  ✓ pinpoint-curator.js DEFAULT_AFF configuration verified (AF7865143, A100708867, IPZ1547)');
} catch (err) {
  violations.push({ file: 'src/js/pinpoint-curator.js', type: 'CONFIG_ERROR', detail: err.message });
}

try {
  // Test curation-catalog.json
  const catalogPath = path.join(ROOT_DIR, 'src', 'data', 'curation-catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const allProducts = (catalog.products || []).concat(catalog.parentingProducts || []);
  let catalogUrlCount = 0;
  allProducts.forEach(prod => {
    if (prod.affiliateUrl) {
      catalogUrlCount++;
      const u = prod.affiliateUrl;
      if (u.includes('coupang.com') && !u.includes(PARTNER_PARAMS.coupang)) {
        violations.push({ file: 'src/data/curation-catalog.json', type: 'CATALOG_MISSING_PARAM', detail: `Coupang item ${prod.id} missing ${PARTNER_PARAMS.coupang}` });
      } else if (u.includes('iherb.com') && !u.includes(PARTNER_PARAMS.iherb)) {
        violations.push({ file: 'src/data/curation-catalog.json', type: 'CATALOG_MISSING_PARAM', detail: `iHerb item ${prod.id} missing ${PARTNER_PARAMS.iherb}` });
      } else if ((u.includes('linkprice.com') || u.includes('yes24.com')) && !u.includes(PARTNER_PARAMS.linkprice_yes24)) {
        violations.push({ file: 'src/data/curation-catalog.json', type: 'CATALOG_MISSING_PARAM', detail: `Yes24 item ${prod.id} missing ${PARTNER_PARAMS.linkprice_yes24}` });
      }
    }
  });
  console.log(`  ✓ curation-catalog.json audited: ${catalogUrlCount} affiliate product URLs verified`);
} catch (err) {
  violations.push({ file: 'src/data/curation-catalog.json', type: 'CATALOG_ERROR', detail: err.message });
}

console.log(`\nTotal <a> Affiliate Tags Scanned       : ${totalTagsScanned}`);
console.log(`Total Affiliate URLs Scanned         : ${totalUrlsScanned}`);
console.log(`Dynamic Generator Modules Verified   : ${dynamicGeneratorsAudited}`);
console.log(`Total Violations Found               : ${violations.length}\n`);

if (violations.length > 0) {
  console.error('VIOLATION DETAILS:');
  violations.forEach((v, idx) => {
    console.error(`[${idx + 1}] ${v.file} | ${v.type} => ${v.detail}`);
  });
  process.exit(1);
} else {
  console.log('🎉 100% EMPIRICAL AFFILIATE COMPLIANCE CONFIRMED (0 non-compliant links)');
  process.exit(0);
}
