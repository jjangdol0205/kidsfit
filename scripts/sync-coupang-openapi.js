#!/usr/bin/env node
/**
 * MoneyFit Official Coupang Partners Open API DeepLink & Product Sync Engine
 * (쿠팡 파트너스 공식 Open API 기반 실클릭 100% 집계 단축링크 `link.coupang.com/a/...` 전수 발급기)
 *
 * Uses official HMAC-SHA256 authentication with the user's Coupang Partners Open API keys
 * to convert all calculator, preset, BOM, and impulse keywords into genuine
 * Coupang Partners `shortenUrl` (`https://link.coupang.com/a/...`) and `traceid` links.
 */

const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'monetization.config.json');
const OUTPUT_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'coupang-official-links.json');
const OUTPUT_JS_PATH = path.join(ROOT_DIR, 'src', 'data', 'coupang-official-links.js');

const DEFAULT_ACCESS_KEY = '3793eab4-a000-4bc3-a659-0e9ee25478bc';
const DEFAULT_SECRET_KEY = '3f798e0e532b06c42748ed13de8e264f3d597b55';

function getApiCredentials() {
  let cfg = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {}
  }
  const accessKey = process.env.COUPANG_ACCESS_KEY || cfg.coupangAccessKey || DEFAULT_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY || cfg.coupangSecretKey || DEFAULT_SECRET_KEY;

  // Persist into monetization.config.json if not yet stored
  if (cfg.coupangAccessKey !== accessKey || cfg.coupangSecretKey !== secretKey) {
    cfg.coupangAccessKey = accessKey;
    cfg.coupangSecretKey = secretKey;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  }

  return { accessKey, secretKey, afId: cfg.coupangAfId || 'AF7865143' };
}

function getSignedDate() {
  return new Date().toISOString().replace(/[-:]/g, '').slice(2, 15) + 'Z';
}

function createAuthHeader(method, apiPath, queryString, accessKey, secretKey) {
  const signedDate = getSignedDate();
  const message = signedDate + method + apiPath + (queryString || '');
  const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`;
}

function callCoupangApi(method, apiPath, queryString, bodyObj, accessKey, secretKey) {
  return new Promise((resolve, reject) => {
    const auth = createAuthHeader(method, apiPath, queryString, accessKey, secretKey);
    const fullPath = queryString ? `${apiPath}?${queryString}` : apiPath;
    const bodyStr = bodyObj ? JSON.stringify(bodyObj) : null;

    const headers = {
      Authorization: auth,
      'Content-Type': 'application/json;charset=UTF-8'
    };
    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(
      {
        hostname: 'api-gateway.coupang.com',
        path: fullPath,
        method,
        headers,
        timeout: 10000
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Coupang API request timeout'));
    });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

/**
 * Collect all unique Coupang search keywords used across the entire MoneyFit portal
 */
function collectAllPortalKeywords() {
  const { PRESETS } = require('../src/data/presets.js');
  const calculators = require('../src/data/calculators.js');
  const keywordSet = new Set([
    // Core fallback & test keywords
    '에너지 1등급 인버터 에어컨',
    '로봇청소기',
    '서큘레이터',
    '에어컨 서큘레이터',
    '스마트 플러그 전력측정',
    '1등급 제습기',
    '단열 에어캡 문풍지',
    '냉동 닭가슴살 100g 대용량 현미밥 다이어트 식단 패키지',
    '하림 닭가슴살 10팩',
    '곰곰 단백질바 현미밥',
    '강아지 고양이 가수분해 사료 관절 영양제 베스트',
    '로얄캐닌 사료',
    '강아지 배변패드 100매',
    '반려동물 전자저울 사료스푼',
    '침대 매트리스',
    '지누스 매트리스 침대프레임',
    '스탠드 행거 수납함',
    '2채널 QHD 블랙박스 무료장착',
    '맥세이프 차량용 무선충전 거치대',
    '불스원샷 연료첨가제',
    '기가 와이파이6 공유기',
    'ipTIME AX3000 공유기',
    '알뜰폰 공용 유심칩',
    '셋톱박스 공유기 숨김 정리함'
  ]);

  // Run all 36 presets through their calculators to collect every generated keyword
  for (const preset of PRESETS) {
    if (preset.keyword) keywordSet.add(preset.keyword.trim());
    let res = null;
    if (preset.calc === 'electric') res = calculators.calculateElectric(preset.inputs);
    else if (preset.calc === 'diet') res = calculators.calculateDiet(preset.inputs);
    else if (preset.calc === 'pet') res = calculators.calculatePet(preset.inputs);
    else if (preset.calc === 'room') res = calculators.calculateRoom(preset.inputs);
    else if (preset.calc === 'auto') res = calculators.calculateAuto(preset.inputs);
    else if (preset.calc === 'telecom') res = calculators.calculateTelecom(preset.inputs);

    if (res) {
      if (res.coupangSearchQuery) keywordSet.add(res.coupangSearchQuery.trim());
      if (res.impulseItem) {
        if (res.impulseItem.query) keywordSet.add(res.impulseItem.query.trim());
        if (res.impulseItem.coupangKw) keywordSet.add(res.impulseItem.coupangKw.trim());
      }
      if (Array.isArray(res.actionItems)) {
        res.actionItems.forEach(it => {
          if (it.coupangKw) keywordSet.add(it.coupangKw.trim());
          if (it.kw) keywordSet.add(it.kw.trim());
        });
      }
      if (Array.isArray(res.products)) {
        res.products.forEach(it => {
          if (it.kw) keywordSet.add(it.kw.trim());
          if (it.coupangKw) keywordSet.add(it.coupangKw.trim());
        });
      }
      if (Array.isArray(res.items)) {
        res.items.forEach(it => {
          if (it.query) keywordSet.add(it.query.trim());
          if (it.kw) keywordSet.add(it.kw.trim());
          if (it.coupangKw) keywordSet.add(it.coupangKw.trim());
          if (it.name) keywordSet.add(it.name.trim());
        });
      }
    }
  }

  // Also scan source files for buildCoupangUrl("..."), coupangKw: "...", kw: "..." literal strings
  const filesToScan = [
    path.join(ROOT_DIR, 'src', 'data', 'calculators.js'),
    path.join(ROOT_DIR, 'src', 'data', 'monetization.js'),
    path.join(ROOT_DIR, 'src', 'js', 'app.js'),
    path.join(ROOT_DIR, 'scripts', 'six-hour-growth-cycle.js'),
    path.join(ROOT_DIR, 'scripts', 'build-ssg.js')
  ];
  for (const fp of filesToScan) {
    if (!fs.existsSync(fp)) continue;
    const src = fs.readFileSync(fp, 'utf8');
    const regexes = [
      /buildCoupangUrl\(\s*['"]([^'"]+)['"]/g,
      /coupangKw\s*:\s*['"]([^'"]+)['"]/g,
      /\bkw\s*:\s*['"]([^'"]+)['"]/g,
      /query\s*:\s*['"]([^'"]+)['"]/g
    ];
    for (const rgx of regexes) {
      let m;
      while ((m = rgx.exec(src)) !== null) {
        if (m[1] && m[1].trim() && !m[1].includes('%')) keywordSet.add(m[1].trim());
      }
    }
  }

  return Array.from(keywordSet).filter(Boolean);
}

async function syncOfficialCoupangLinks() {
  const { accessKey, secretKey, afId } = getApiCredentials();
  const keywords = collectAllPortalKeywords();
  console.log(`[Coupang OpenAPI] Collected ${keywords.length} unique portal keywords for official short-link generation...`);

  const linkMap = {};
  const batchSize = 15;
  const deeplinkPath = '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink';

  for (let i = 0; i < keywords.length; i += batchSize) {
    const chunk = keywords.slice(i, i + batchSize);
    const coupangUrls = chunk.map(kw => `https://www.coupang.com/np/search?q=${encodeURIComponent(kw)}`);

    const res = await callCoupangApi(
      'POST',
      deeplinkPath,
      '',
      { coupangUrls, subId: 'moneyfit' },
      accessKey,
      secretKey
    );

    if (res.statusCode === 200 && res.body && res.body.rCode === '0' && Array.isArray(res.body.data)) {
      res.body.data.forEach((item, idx) => {
        const kw = chunk[idx];
        if (!kw) return;
        const traceMatch = (item.landingUrl || '').match(/traceid=([^&]+)/);
        linkMap[kw] = {
          keyword: kw,
          shortenUrl: item.shortenUrl,
          landingUrl: item.landingUrl,
          traceId: traceMatch ? traceMatch[1] : ''
        };
      });
      console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: Issued ${res.body.data.length} official link.coupang.com/a/ short links`);
    } else {
      console.warn(`  ! Batch ${Math.floor(i / batchSize) + 1} warning:`, res.statusCode, res.body || res.raw);
    }
    await new Promise(r => setTimeout(r, 250));
  }

  // Also fetch 6 category hero best-seller product links via /products/search (limit 1 per category)
  const categoryHeroQueries = {
    electric: '서큘레이터',
    diet: '하림 닭가슴살',
    pet: '로얄캐닌 강아지 사료',
    room: '지누스 매트리스',
    auto: '아이나비 블랙박스',
    telecom: 'ipTIME 공유기'
  };
  const categoryHeroLinks = {};
  const searchPath = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';

  for (const [cat, q] of Object.entries(categoryHeroQueries)) {
    try {
      const qs = `keyword=${encodeURIComponent(q)}&limit=1&subId=mf_${cat}`;
      const sRes = await callCoupangApi('GET', searchPath, qs, null, accessKey, secretKey);
      if (sRes.statusCode === 200 && sRes.body && sRes.body.data) {
        const prod = (sRes.body.data.productData && sRes.body.data.productData[0]) || null;
        categoryHeroLinks[cat] = {
          query: q,
          searchLandingUrl: sRes.body.data.landingUrl,
          productId: prod ? prod.productId : null,
          productName: prod ? prod.productName : null,
          productPrice: prod ? prod.productPrice : null,
          productImage: prod ? prod.productImage : null,
          productUrl: prod ? prod.productUrl : null
        };
      }
      await new Promise(r => setTimeout(r, 700));
    } catch (e) {
      console.warn(`  ! Category search warning (${cat}):`, e.message);
    }
  }

  const outputData = {
    syncedAt: new Date().toISOString(),
    afId,
    totalKeywords: Object.keys(linkMap).length,
    categoryHeroLinks,
    linksByKeyword: linkMap
  };

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(outputData, null, 2) + '\n', 'utf8');

  const jsContent = `/**
 * Official Coupang Partners Open API Short-Link & TraceID Lookup Table (SSOT)
 * Auto-generated via scripts/sync-coupang-openapi.js using official HMAC-SHA256 Open API.
 * Every link here is a genuine Coupang Partners tracked link (https://link.coupang.com/a/... + traceid)
 * that 100% registers clicks and conversions in the Coupang Partners dashboard.
 */
const COUPANG_OFFICIAL_LINKS = ${JSON.stringify(outputData, null, 2)};

if (typeof window !== 'undefined') {
  window.COUPANG_OFFICIAL_LINKS = COUPANG_OFFICIAL_LINKS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COUPANG_OFFICIAL_LINKS };
}
`;
  fs.writeFileSync(OUTPUT_JS_PATH, jsContent, 'utf8');

  return outputData;
}

if (require.main === module) {
  syncOfficialCoupangLinks()
    .then(res => {
      console.log('===============================================================');
      console.log(` 🎉 COUPANG OPEN API OFFICIAL SHORT-LINKS SYNCED: ${res.totalKeywords} keywords`);
      console.log('===============================================================');
    })
    .catch(err => {
      console.error('Coupang OpenAPI Sync Failed:', err);
      process.exit(1);
    });
}

module.exports = {
  getApiCredentials,
  callCoupangApi,
  syncOfficialCoupangLinks
};
