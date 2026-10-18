/**
 * MoneyFit Portal - 36 Viral Post Bundles Generator
 *
 * Generates:
 * 1. 36 individual Markdown copy bundles in `viral_posts/{preset_slug}.md`:
 *    - (a) Naver Blog / Tistory informational post (1,500+ Korean characters of domain analysis, table, calculation summary, and CTA)
 *    - (b) Naver Jisik-iN / Cafe expert answer with exact figures
 *    - (c) Threads / Blind / Group chat 3-line FOMO loss-aversion copy
 * 2. `src/data/viral-content.js` (CommonJS + Browser global) for instant 0-latency UI loading.
 *
 * Usage: node scripts/generate-viral-content.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const VIRAL_DIR = path.join(PROJECT_ROOT, 'viral_posts');
const OUTPUT_DATA_JS = path.join(PROJECT_ROOT, 'src', 'data', 'viral-content.js');

try {
  const officialLinksMod = require('../src/data/coupang-official-links.js');
  if (officialLinksMod && officialLinksMod.COUPANG_OFFICIAL_LINKS) {
    global.COUPANG_OFFICIAL_LINKS = officialLinksMod.COUPANG_OFFICIAL_LINKS;
  }
} catch (e) {}
const { PRESETS } = require('../src/data/presets.js');
const calculators = require('../src/data/calculators.js');
const monetization = require('../src/data/monetization.js');
const webtoonStories = require('../src/data/webtoon-stories.js');
let SOURCED_PRODUCTS_CATALOG = { categories: {}, presets: {} };
try {
  const sourcedMod = require('../src/data/sourced-products.js');
  if (sourcedMod && sourcedMod.SOURCED_PRODUCTS_CATALOG) {
    SOURCED_PRODUCTS_CATALOG = sourcedMod.SOURCED_PRODUCTS_CATALOG;
  }
} catch (e) {}

// Default config fallback
let siteUrl = 'https://truthofmarket.com';
const CONFIG_PATH = path.join(PROJECT_ROOT, 'monetization.config.json');
if (fs.existsSync(CONFIG_PATH)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (cfg.siteUrl) siteUrl = cfg.siteUrl;
  } catch (e) {
    // fallback
  }
}

/**
 * Pre-defined search query map for Bottom-of-Funnel high-intent queries
 */
const QUERY_MAP = {
  'electric-studio-ac': '원룸 벽걸이 에어컨 전기세',
  'electric-stand-ac': '스탠드 에어컨 누진세 3단계',
  'electric-dehumidifier': '제습기 24시간 전기세 1등급',
  'electric-dryer': '의류건조기 전기세 한달',
  'electric-winter-heater': '전기온풍기 난방비 폭탄',
  'electric-inverter-roi': '구형 정속형 인버터 에어컨 교체',
  'diet-male-fatloss': '남자 80kg 다이어트 닭가슴살 TDEE',
  'diet-female-lean': '여자 55kg 다이어트 식단 탄단지',
  'diet-male-bulkup': '마른체형 65kg 벌크업 식단 프로틴',
  'diet-office-worker': '직장인 점심 도시락 다이어트 식단',
  'diet-student-budget': '자취생 가성비 헬스 식단 장보기',
  'diet-quick-3kg': '한달 3kg 감량 칼로리 적자 식단',
  'pet-maltese-5kg': '말티즈 5kg 하루 사료 급여량',
  'pet-pomeranian-puppy': '포메라니안 퍼피 사료 급여량 계산',
  'pet-golden-retriever': '골든리트리버 하루 사료량 양육비',
  'pet-korean-shorthair': '코숏 고양이 건사료 습식 급여량',
  'pet-senior-cat': '노령묘 사료량 신장 케어 병원비',
  'pet-monthly-budget': '강아지 입양 첫달 고정비 사료값',
  'room-oneroom-100': '원룸 100만원 필수 가전가구 풀세팅',
  'room-officetel-300': '오피스텔 300만원 화이트 가전가구',
  'room-officetel-500': '투룸 500만원 가전가구 견적',
  'room-newlywed-1000': '신혼부부 1000만원 가전 풀세팅',
  'room-minimalist-50': '원룸 50만원 자취 필수템 견적',
  'room-appliances-only': '원룸 150만원 에너지 1등급 가전',
  'auto-avante-3000': '아반떼 장기렌트 할부 비교 20대',
  'auto-grandeur-5000': '그랜저 장기렌트 리스 사업자 절세',
  'auto-tucson-hybrid': '투싼 하이브리드 장기렌트 할부 견적',
  'auto-genesis-g80': '제네시스 G80 리스 렌트 손익',
  'auto-casper-cash-vs-rent': '캐스퍼 초보운전 보험료 할부 렌트',
  'auto-ev-ioniq': '아이오닉 전기차 보조금 장기렌트',
  'telecom-penalty-15': '인터넷 위약금 15만원 사은품 47만원',
  'telecom-penalty-30': '통신 위약금 30만원 이동 손익분기점',
  'telecom-3yr-expired': '인터넷 3년 약정 만기 재약정 이동',
  'telecom-single-oneroom': '자취방 인터넷 단독 결합 할인',
  'telecom-family-4p': '온가족 4인 인터넷 결합 지원금',
  'telecom-mvno-switch': '알뜰폰 유심 요금제 5G 전환 절감액'
};

const CATEGORY_STRATEGY_MAP = {
  electric: {
    introContext: '매달 고지서에 찍히는 전기요금 누진세 구간과 가전 소비전력(W) 효율 차이',
    authoritySource: '한국전력 주택용 누진세 요금표 및 에너지관리공단 효율 등급 수식',
    step1: '우리 집 월 기본 사용량(kWh)과 추가 가전의 실제 소비전력(W)·가동시간을 정확히 대입해 누진 구간 점프 여부를 먼저 확인하세요.',
    step2: '누진 3단계(400kWh 초과) 구간으로 넘어가는 시간을 줄이거나, 정속형·저효율 기기를 인버터 1등급으로 전환해 고정 누수를 차단하세요.',
    step3: '한전 고효율 가전 구매비용 환급사업과 로켓설치·카드 즉시할인 혜택을 결합해 기기 교체 손익분기점(BEP)을 앞당기세요.',
    inputHint: '소비전력(W)·가동시간·기본 사용량'
  },
  diet: {
    introContext: '내 기초대사량(BMR)·활동대사량(TDEE)에 맞춘 일일 칼로리 설계와 식단 장보기 예산',
    authoritySource: '미국 임상영양학회 Mifflin-St Jeor 대사량 공식 및 보건복지부 영양섭취기준',
    step1: '체중·키·나이·활동량을 기반으로 내 정확한 일일 활동대사량(TDEE)과 목표 칼로리(감량 적자 또는 벌크업 흑자)를 먼저 산출하세요.',
    step2: '배달음식·외식·단품 편의점 결제로 새나가는 식비를 줄이고, 일일 목표 단백질(g)에 맞춘 대용량 묶음 식단으로 100g당 단가를 낮추세요.',
    step3: '닭가슴살·복합탄수화물·프로틴 파우더를 한 달 필요량(kg) 기준으로 장바구니에 담아 식비와 체성분을 동시에 잡으세요.',
    inputHint: '성별·체중·키·활동량·목표주수'
  },
  pet: {
    introContext: '반려동물 생애주기별 일일 적정 에너지 요구량(DER)과 월간 사료·케어 고정비',
    authoritySource: '미국국립연구위원회(NRC)·유럽반려동물산업연맹(FEDIAF) 수의영양학 칼로리 공식',
    step1: '아이의 현재 체중(kg), 중성화·연령 가중치, 사료 대사량(kcal/kg)을 대입해 하루 적정 급여량(g)을 1g 단위로 먼저 확인하세요.',
    step2: '종이컵 눈대중 급여로 인한 과체중·관절 부담이나 소포장 반복 구매로 새나가는 kg당 사료 단가 손실을 막으세요.',
    step3: '한 포대 소진 일수(일)에 맞춘 중·대포장 정기배송과 전자저울·맞춤 영양제를 활용해 병원비와 사료비를 함께 아끼세요.',
    inputHint: '반려동물 체중·생애주기·사료 칼로리'
  },
  room: {
    introContext: '첫 독립·이사·신혼 입주 시 평수와 총예산 한도 내에서 실패 없는 가전·가구 물량산출(BOM)',
    authoritySource: '표준 주거 공간 평수별 동선 가이드 및 가전·가구 티어별 예산 배분 알고리즘',
    step1: '입주할 방의 실평수와 가용 총예산(만 원)을 먼저 입력해 예산 초과(Overrun) 없는 품목별 상한선을 확정하세요.',
    step2: '단품 충동구매로 예산을 다 써버리거나 방 크기에 맞지 않는 오버스펙 가구를 사서 동선이 막히는 시행착오를 피하세요.',
    step3: '필수 코어 가전(냉장고·세탁기·전자레인지)과 수면 가구(매트리스·침대)를 우선 배정하고 남는 예비비로 수납·조명을 채우세요.',
    inputHint: '총예산(만 원)·방 평수'
  },
  auto: {
    introContext: '신차 구매 시 할부·장기렌트·리스 방식별 초기 취등록세, 보험료, 종합소득세 절세 효과 비교',
    authoritySource: '여신금융협회 자동차 금융 공시 기준 및 국세청 업무용승용차 손금산입 세법 수식',
    step1: '차량가(만 원), 이용 기간(개월), 본인의 종합소득세율 구간(%)을 입력해 취득세·보험료·세금 감면액이 반영된 실질 TCO를 비교하세요.',
    step2: '직장인(세율 0%)이 영업사원 말만 듣고 비싼 렌트를 타거나, 고소득 사업자(24~35%)가 할부로 사서 수천만 원 절세 혜택을 놓치는 실수를 막으세요.',
    step3: '구매 방식 판정 결과에 따라 다이렉트 오토 캐시백 또는 무보증 즉시출고 특판 견적을 최소 2~3곳 이상 비교해 월 납입금을 낮추세요.',
    inputHint: '차량가·이용기간·소득세율 구간'
  },
  telecom: {
    introContext: '인터넷·TV·휴대폰 약정 기간 중 남은 위약금과 신규 가입 현금 사은품(지원금)·월 요금 절감액의 손익분기점',
    authoritySource: '방송통신위원회 경품 고시 가이드라인 및 통신 3사·알뜰폰 요금 차액 손익분기점 수식',
    step1: '현재 납부 중인 월 요금, 해지 시 예상 위약금(만 원), 신규 가입 시 받을 사은품과 새 요금을 넣어 당일 순이익과 손익분기점(개월)을 확인하세요.',
    step2: '약정이 끝났는데도 아무 혜택 없이 요금을 그대로 내거나, 위약금이 무서워 매달 더 큰 요금 차액을 손해 보는 현상을 멈추세요.',
    step3: '위약금보다 사은품+요금 절감액이 더 큰 구간이라면 당일 현금 지원 성지 또는 알뜰폰 무약정 유심으로 즉시 갈아타 고정비를 줄이세요.',
    inputHint: '남은 위약금·기존 요금·신규 요금·사은품'
  }
};

/**
 * Execute calculator for a preset
 */
function calculatePresetResult(preset) {
  switch (preset.calc) {
    case 'electric':
      return calculators.calculateElectric(preset.inputs);
    case 'diet':
      return calculators.calculateDiet(preset.inputs);
    case 'pet':
      return calculators.calculatePet(preset.inputs);
    case 'room':
      return calculators.calculateRoom(preset.inputs);
    case 'auto':
      return calculators.calculateAuto(preset.inputs);
    case 'telecom':
      return calculators.calculateTelecom(preset.inputs);
    default:
      throw new Error(`Unknown calculator type: ${preset.calc}`);
  }
}

/**
 * Format markdown table from preset headers and rows
 */
function formatMarkdownTable(headers, rows) {
  if (!headers || !rows || rows.length === 0) return '';
  const headerLine = `| ${headers.join(' | ')} |`;
  const sepLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const rowLines = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
  return `${headerLine}\n${sepLine}\n${rowLines}`;
}

/**
 * Build copy bundle for a single preset
 */
function buildCopyBundle(preset, currentSiteUrl = siteUrl) {
  const res = calculatePresetResult(preset);
  const cpaDetails = monetization.getCpaCardDetails(preset.calc, res);
  const coupangUrl = cpaDetails.coupangSubUrl;
  const linkPriceUrl = cpaDetails.linkPriceSubUrl;
  const cpaActionUrl = cpaDetails.liveActionUrl;

  const targetUrl = `${currentSiteUrl}/preset/${preset.id}`;
  const query = QUERY_MAP[preset.id] || preset.title.split(' ').slice(0, 4).join(' ');
  const subQueries = [
    query,
    `${preset.category} ${query.split(' ').slice(0, 2).join(' ')} 후기`.trim(),
    `${query} 비교 디시`
  ];
  const encodedQ = encodeURIComponent(query);
  const kinSearchUrl = `https://kin.naver.com/search/list.naver?query=${encodedQ}&sort=date`;
  const cafeSearchUrl = `https://search.naver.com/search.naver?where=article&query=${encodedQ}&st=date`;
  const dcSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:dcinside.com ${query}`)}&tbs=qdr:m`;
  const blindSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:teamblind.com ${query}`)}&tbs=qdr:m`;
  const threadsSearchUrl = `https://www.threads.net/search?q=${encodedQ}&serp_type=default`;
  const daumCafeSearchUrl = `https://search.daum.net/search?w=cafe&q=${encodedQ}&sort=recency`;

  const story = (webtoonStories.PRESET_WEBTOON_MAP && webtoonStories.PRESET_WEBTOON_MAP[preset.id]) || {};
  const resolvedStory = webtoonStories.resolveDynamicReceiptValues
    ? webtoonStories.resolveDynamicReceiptValues(preset, res)
    : story;
  const epTitle = (resolvedStory.shortCartoon && resolvedStory.shortCartoon.epTitle) || preset.title;
  const webtoonGridUrl = `${currentSiteUrl}/sns/${preset.id}-grid.png`;
  const blogHomeThumbUrl = `${currentSiteUrl}/sns/${preset.id}-thumb.png`;
  const charName = resolvedStory.charName || '머니핏 프렌즈';
  const expertName = resolvedStory.expertName || '안경 여우 박사';
  const badLabel = resolvedStory.badLabel || '기존 선택';
  const badVal = resolvedStory.badVal || res.headline;
  const goodLabel = resolvedStory.goodLabel || '최적화 선택';
  const goodVal = resolvedStory.goodVal || res.badge;
  const diffVal = resolvedStory.diffVal || '즉시 절약';

  const strat = CATEGORY_STRATEGY_MAP[preset.calc] || CATEGORY_STRATEGY_MAP.electric;
  const uniqueHashtags = story.hashtags || `#${preset.category.replace(/[^가-힣a-zA-Z0-9]/g, '')} #${query.split(' ').join(' #')} #머니핏`;

  // Naver Home-Feed (네이버 홈판 리빙·경제M·테크) High-CTR Title Formula
  const homeFeedTitle = `${preset.title}, 모르고 그냥 썼더니 ${diffVal}? 직접 계산해보고 놀란 현실 영수증`;

  // Load Account B (expertise333) Official Brand Connect (Shopping Connect) links so both Account A (comedifarm) and Account B use them across Blog, Clip, and Cafe
  const BC_LINKS_BY_CALC = {
    electric: {
      label: '듀플렉스 스탠드 에어서큘레이터 선풍기 DPK-55CF (리뷰 20,951개)',
      url: 'https://naver.me/xm0ZVnAW',
      subLabel: '[슈퍼적립] 로보락 Qrevo Curv 2 Flow 26년 신형 로봇청소기',
      subUrl: 'https://naver.me/GgUlTvYj'
    },
    diet: {
      label: '한끼통살 소스 통 닭가슴살 100g 20종 10개입 (리뷰 49,365개)',
      url: 'https://naver.me/xvClW9nJ',
      subLabel: '모던구루 유기농 애사비 스틱 오리지널 21포',
      subUrl: 'https://naver.me/GxrdvbPG'
    },
    pet: {
      label: '라비앙독 강아지 가수분해 피부·눈물 케어 연어 사료 4.8kg (리뷰 26,136개)',
      url: 'https://naver.me/xAfcU6Im',
      subLabel: '[슈퍼적립] 로보락 Qrevo Curv 2 Flow 털청소 로봇청소기',
      subUrl: 'https://naver.me/GgUlTvYj'
    },
    room: {
      label: '[슈퍼적립] 로보락 Qrevo Curv 2 Flow 26년 신형 로봇청소기',
      url: 'https://naver.me/GgUlTvYj',
      subLabel: '듀플렉스 스탠드 에어서큘레이터 선풍기 DPK-55CF',
      subUrl: 'https://naver.me/xm0ZVnAW'
    },
    auto: {
      label: '아이테라 26년형 2채널 FHD 블랙박스 와이파이 동글포함 32G (3년 AS)',
      url: 'https://naver.me/G5kYoDj6',
      subLabel: '티피링크 Archer AX1500 Wi-Fi 6 기가 와이파이 공유기',
      subUrl: 'https://naver.me/FpwR436o'
    },
    telecom: {
      label: '티피링크 Archer AX1500 Wi-Fi 6 기가 와이파이 유무선 공유기',
      url: 'https://naver.me/FpwR436o',
      subLabel: '듀플렉스 스탠드 에어서큘레이터 선풍기 DPK-55CF',
      subUrl: 'https://naver.me/xm0ZVnAW'
    }
  };
  const bcItem = BC_LINKS_BY_CALC[preset.calc] || BC_LINKS_BY_CALC.electric;
  const brandConnectUrl = bcItem.url;
  const brandConnectSubUrl = bcItem.subUrl;
  const officialCafeUrl = 'https://cafe.naver.com/moneyfitlab';

  const calcHubUrl = `${currentSiteUrl}/?calc=${preset.calc}`;
  const clipVideoRelPath = `sns_outbox/${preset.id}/clip.mp4`;

  // Load real sourced Coupang & LinkPrice products for this preset
  const presetSourced = (SOURCED_PRODUCTS_CATALOG.presets && SOURCED_PRODUCTS_CATALOG.presets[preset.id])
    || (SOURCED_PRODUCTS_CATALOG.categories && SOURCED_PRODUCTS_CATALOG.categories[preset.calc])
    || null;
  const sourcedSpec = (presetSourced && presetSourced.sourcingSpec) ? presetSourced.sourcingSpec : (presetSourced || {});
  const sourcedCpList = (presetSourced && Array.isArray(presetSourced.coupangProducts)) ? presetSourced.coupangProducts.slice(0, 4) : [];
  const sourcedLpList = (presetSourced && Array.isArray(presetSourced.linkPriceDeals)) ? presetSourced.linkPriceDeals.slice(0, 2) : [];
  const topCp1 = sourcedCpList[0] || null;
  const topCp2 = sourcedCpList[1] || null;
  const topLp1 = sourcedLpList[0] || null;

  const sourcedBlogSection = sourcedCpList.length > 0 ? `
---

## 🏆 [24px 소제목] 2-1. ${preset.title} 실구매 가성비 소싱 TOP 4 (쿠팡 로켓배송 vs 공식몰 실구매가 비교)

머니핏 포털(\`${targetUrl}\`) 상단 쇼룸에 실시간 연동된 **${sourcedSpec.categoryTitle || preset.category}** 실구매 베스트셀러 모델과 현재 가격입니다.

${sourcedCpList.map((item, idx) => `• **[소싱 TOP ${idx + 1}] ${item.productName}**  
  └ 실구매가: **${item.productPriceFormatted}** (${item.isRocket ? '🚀 로켓배송' : '🚚 무료배송'} · ${sourcedSpec.defaultUnitBadge || '가성비 검증 1위'})`).join('\n\n')}

${sourcedLpList.map(deal => `• **[공식몰 제휴 비교 — ${deal.merchantLabel}] ${deal.title}**  
  └ 혜택 요약: **${deal.badge}** (${deal.specSummary})`).join('\n\n')}

👉 **[실물 소싱 쇼룸 & 3초 계산기 바로가기] ${preset.title} 최저가 비교**:
${targetUrl}
` : '';

  const sourcedCafeSection = topCp1 ? `
## 🏆 [실물 소싱 비교] 이 조건 실구매 가성비 베스트 모델 & 현재 가격
• **소싱 1위 모델**: **${topCp1.productName}** (실구매가 **${topCp1.productPriceFormatted}**)
${topCp2 ? `• **소싱 2위 모델**: **${topCp2.productName}** (실구매가 **${topCp2.productPriceFormatted}**)` : ''}
${topLp1 ? `• **공식몰 비교 (${topLp1.merchantLabel})**: **${topLp1.title}** (${topLp1.badge})` : ''}
👉 **위 소싱 모델 스펙 비교표 & 3초 계산기 바로가기**: ${targetUrl}
` : '';

  const sourcedThreadsLine = topCp1
    ? `\n🏆 실구매 1위 소싱템: ${topCp1.productName.slice(0, 38)} (${topCp1.productPriceFormatted})\n`
    : '\n';

  // 1. Blog Post (Naver Home-Feed D.I.A.+ Optimized with 24px Bold Subheadings + 19px Bold Callouts + 16px Airy 2-Line Paragraphs + Built-in Top/Bottom Links)
  const tableMd = formatMarkdownTable(preset.tableHeaders, preset.tableRows);
  const metricsList = res.metrics.map(m => `• **${m.label}**: ${m.val}`).join('\n');
  const faqList = (preset.faq || []).map((f, i) => `**Q${i + 1}. ${f.question || f.q}**\nA. ${f.answer || f.a}`).join('\n\n');
  const summaryLines = String(res.summary || '').split(/(?<=[.!?다요])\s+/).filter(Boolean).join('\n\n');

  const blogPost = `[제목] ${homeFeedTitle}

![${preset.title} 네이버 홈판 대표 썸네일](${blogHomeThumbUrl})
*(▲ 스마트에디터 ONE 작성 시: 소제목은 24px 굵게(se-fs-fs24), 핵심 영수증 요약은 19px 굵게(se-fs-fs19), 본문은 16px(se-fs-fs16) 2줄 단락 여백으로 작성하며, 본문 최상단과 최하단에 ${targetUrl} 링크를 직접 내장합니다)*

## 💡 [24px 소제목] ${preset.title} 3초 핵심 요약 & 무료 계산기

> **「🎨 3초 요약 영수증 (${epTitle} — ${charName} × ${expertName})」**  
> ❌ **${badLabel}**: **${badVal}**  
> ✅ **${goodLabel}**: **${goodVal}** (**${diffVal}**)  
> 📌 **핵심 판정**: **${res.headline}** (${res.badge})

👉 **[무료 3초 계산기 & 실물 소싱 쇼룸 바로가기] ${preset.title}**:
${targetUrl}

🏠 **[머니핏 ${preset.category} 계산기 공식 포털 바로가기]**:
${calcHubUrl}

---

## 📊 [24px 소제목] 1. 왜 ${query} 계산을 감으로 하면 손해 볼까요?

${story.hookLine || `요즘 ${preset.title} 관련해서 실제 비용과 손익분기점을 궁금해하시는 분들이 정말 많습니다.`}

실제로 **「${preset.title}」** 조건에서 ${strat.introContext}가 어떻게 달라지는지 **${strat.authoritySource}**에 대입해 보면 예상보다 차이가 큽니다.

${story.factLine || preset.description}

![${preset.title} 4컷 동물 웹툰 영수증](${webtoonGridUrl})

#### 📌 ${preset.title} 핵심 산출 지표 (19px 강조)
${metricsList}

${summaryLines}

---

## 📋 [24px 소제목] 2. 조건별 상세 비교 데이터 (${preset.title})

아래 표는 **${query}** 조건에서 선택지별 비용과 기대 효과를 비교한 실측 데이터입니다.

${tableMd}
${sourcedBlogSection}
---

## ✅ [24px 소제목] 3. ${preset.category} 손해 막는 3단계 체크리스트

1. **내 조건 수치 대입 (${strat.inputHint})**: ${strat.step1}

2. **고정비 누수 포인트 차단**: ${strat.step2}

3. **맞춤 특가 및 혜택 활용**: ${strat.step3}

---

## 💬 [24px 소제목] 4. ${preset.title} 자주 묻는 질문 (FAQ)
${faqList}

---

## 🔗 [24px 소제목] 5. 내 조건 3초 무료 계산기 직행 링크 & 절약 아이템

${story.ctaLine || `내 조건(${strat.inputHint})을 직접 입력해 3초 만에 손익분기점 영수증을 확인해 보세요.`}

👉 **[무료 3초 계산기 바로가기] ${preset.title} 전용 시뮬레이터**:
${targetUrl}

🏠 **[머니핏 6대 생활비 3초 계산기 전체 모음 (${preset.category})]:**
${calcHubUrl}

🛍️ **[네이버 브랜드커넥트 참고 아이템 1] ${bcItem.label}**:
${brandConnectUrl}

🛍️ **[네이버 브랜드커넥트 참고 아이템 2] ${bcItem.subLabel}**:
${brandConnectSubUrl}

🏛️ **[머니핏 공식 네이버 카페] 6대 살림 팩트체크 연구소**:
${officialCafeUrl}

*(※ 이 포스팅은 네이버 브랜드커넥트(쇼핑커넥트) 활동의 일환으로, 판매 발생 시 수수료를 제공받습니다. 본 시뮬레이션 수치는 참고용 추정치이며 실제 약관에 따라 상이할 수 있습니다.)*

${uniqueHashtags}`;

  // 2. Jisik-iN High-Value "Aljja" Expert Cheat Sheet (100% pure informational, bookmark-worthy formulas & checklist -> natural homepage inflow)
  const plainMetrics = res.metrics.map(m => `• ${m.label}: ${m.val}`).join('\n');
  const firstFaq = (preset.faq && preset.faq[0]) ? `\n[💡 가장 많이 헷갈려 하시는 부분]\nQ. ${preset.faq[0].question || preset.faq[0].q}\nA. ${preset.faq[0].answer || preset.faq[0].a}\n` : '';
  const jisikinPost = `[📌 안티밴 안전 수칙: 하루 3~5건 이내 · 최소 1~2시간 간격 · 상업성 쇼핑링크 0개 · 읽자마자 저장하고 싶어지는 '알짜 공식 요약본' + 3컷 영수증 이미지(slide-3.png) 첨부]

안녕하세요! ${query} 기준이 헷갈려서 고민이 많으시겠어요.
광고성 글 말고 실제 **${strat.authoritySource}** 기준으로 계산한 **알짜 핵심 수치와 체크리스트**만 딱 정리해 드릴게요.

1️⃣ 질문자님 조건(${preset.title}) 핵심 계산 결과
• 한 줄 결론: **${res.headline} (${res.badge})**
• 기존 방식(${badLabel}): ${badVal}
• 최적 방식(${goodLabel}): ${goodVal} ➔ **${diffVal}**
${plainMetrics}

👉 내 조건(${strat.inputHint}) 3초 무료 계산기 바로가기:
${targetUrl}

2️⃣ 실패 없는 결정을 위한 3가지 핵심 기준 (이것만 기억하세요!)
① [기준 확인] ${strat.step1}
② [손실 방지] ${strat.step2}
③ [실전 팁] ${strat.step3}
${firstFaq}
3️⃣ 내 세부 조건(${strat.inputHint}) 1:1 대입해보기
${story.factLine || res.summary}
집마다 ${strat.inputHint} 숫자가 조금씩 달라서, 결정하시기 전에 본인 숫자를 직접 넣어서 손익분기점을 한 번 찍어보시는 게 가장 정확합니다.

제가 계산할 때 썼던 무료 계산기 페이지 남겨드릴게요(회원가입이나 앱 설치 없이 숫자만 넣으면 3초 만에 위 비교표가 바로 나옵니다).
👉 [무료 3초 계산기 바로가기] ${preset.title}:
${targetUrl}
🏠 [전체 6대 생활비 계산기 포털]:
${calcHubUrl}

도움이 되셨다면 채택 부탁드리며, 추가로 궁금한 숫자 있으시면 댓글 남겨주세요!`;

  // 3. Community / Cafe High-Readability Whitepaper Post (24px Subheadings + 3-Second Receipt Box + 1-Line Bullets + Top/Bottom Direct Clickable Links)
  const firstMetric = res.metrics && res.metrics[0] ? `${res.metrics[0].label} ${res.metrics[0].val}` : res.headline;
  const secondMetric = res.metrics && res.metrics[1] ? `${res.metrics[1].label} ${res.metrics[1].val}` : res.badge;
  const cafeCommentPost = `[📌 네이버 카페(moneyfitlab) & 커뮤니티 초가독성 백서형 정보글 — 24px 굵은 소제목 + 19px 3초 영수증 요약 + 4컷 웹툰(slide-1~4.png) + 상·하단 직행 링크 내장]

## 💡 [3초 핵심 요약] ${preset.title} 실측 비교 영수증

• **그냥 유지할 때(${badLabel})**: **${badVal}**
• **조건 바꿨을 때(${goodLabel})**: **${goodVal}** (➔ **${diffVal}**)
• **핵심 지표 (${preset.category})**: ${firstMetric} / ${secondMetric}

👉 **[무료 3초 계산기 & 실물 소싱 쇼룸 바로가기] 내 조건(${strat.inputHint}) 넣어서 1원 단위 영수증 바로 뽑기**:
${targetUrl}

---

## 📋 1. ${query} 조건별 실측 비교 데이터표

${tableMd}

${sourcedCafeSection}
---

## ✅ 2. 결정 전 호구 막는 3단계 핵심 체크리스트

1️⃣ **${strat.inputHint} 확인**: ${strat.step1}

2️⃣ **고정비 누수 차단**: ${strat.step2}

3️⃣ **실전 절약 팁**: ${strat.step3}

---

## 🔗 3. 내 조건 1:1 무료 계산기 바로가기 (회원가입·설치 없음)

**${strat.authoritySource}** 수식에 내 조건(${strat.inputHint}) 숫자를 직접 넣으면 3초 만에 손익분기점이 계산됩니다!

👉 **[무료 3초 계산기 바로가기] ${preset.title}**:
${targetUrl}

🏠 **[머니핏 6대 생활비 3초 손익계산기 전체 모음]**:
${calcHubUrl}`;

  // 4. Threads / Instagram High-Readability Mobile Copy (Airy line breaks + visual receipt + direct link)
  const keyMetric = res.metrics && res.metrics[0] ? `${res.metrics[0].label}: ${res.metrics[0].val}` : res.headline;
  const threadsPost = `🐾 [${epTitle}] 3초 영수증 팩트체크!\n\n💬 ${story.hookLine || `'${preset.title}' 감으로 결정하기 전에 꼭 한 번 계산해 보세요.`}\n\n❌ ${badLabel}: ${badVal}\n✅ ${goodLabel}: ${goodVal} (${diffVal})\n📊 핵심 지표: ${keyMetric}${sourcedThreadsLine}\n${story.factLine || res.summary}\n\n👉 내 조건(${strat.inputHint}) 3초 무료 계산기 & 소싱템 비교:\n${targetUrl}\n🏠 전체 계산기 모음: ${calcHubUrl}`;

  // 5. Naver SmartEditor ONE Inline-Style Rich HTML Card (Enforces 24px Bold Subheadings, 19px Bold Callouts, 16px Airy Paragraphs, and Built-In Top + Bottom Links)
  const sourcedHtmlBlock = topCp1 ? `
  <div style="background:#fff1f2;border:2px solid #f43f5e;border-radius:12px;padding:14px 16px;margin-bottom:16px;font-size:16px;line-height:1.6;">
    <div style="font-weight:900;color:#be123c;margin-bottom:6px;">🏆 [2026 실구매 가성비 소싱 1위] 쿠팡 로켓배송 vs 공식몰 실구매가</div>
    <div style="font-weight:800;color:#0f172a;">• 1위 모델: ${topCp1.productName} (<span style="color:#e11d48;font-weight:900;">${topCp1.productPriceFormatted}</span>)</div>
    ${topCp2 ? `<div style="font-weight:700;color:#334155;margin-top:4px;">• 2위 모델: ${topCp2.productName} (<span style="color:#e11d48;font-weight:800;">${topCp2.productPriceFormatted}</span>)</div>` : ''}
    <div style="margin-top:8px;"><a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="color:#be123c;font-weight:900;text-decoration:underline;">👉 머니핏 포털(${targetUrl})에서 실물 소싱 비교 쇼룸 바로 보기 ↗</a></div>
  </div>` : '';

  const naverSmartEditorHtml = `<div style="max-width:680px;margin:18px auto;padding:22px;border:2px solid #10b981;border-radius:16px;background:#f8fafc;font-family:'Pretendard','Malgun Gothic',sans-serif;color:#0f172a;line-height:1.75;">
  <div style="font-size:14px;font-weight:800;color:#059669;margin-bottom:6px;">🔥 네이버 홈판 1:1 대표 썸네일 & ${epTitle} (${charName} × ${expertName})</div>
  <h2 style="font-size:24px;font-weight:900;color:#0f172a;line-height:1.4;margin:0 0 14px 0;">💡 ${homeFeedTitle}</h2>
  <div style="margin-bottom:14px;padding:12px 16px;background:#ecfdf5;border:2px solid #10b981;border-radius:12px;text-align:center;">
    <a href="${targetUrl}?src=naver_blog_top" target="_blank" rel="noopener noreferrer" style="color:#047857;font-size:19px;font-weight:900;text-decoration:underline;">👉 [무료 3초 계산기 & 소싱 쇼룸 바로가기] ${preset.title} (${targetUrl}) ↗</a>
  </div>
  <a href="${targetUrl}?src=naver_blog" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;margin-bottom:16px;">
    <img src="${blogHomeThumbUrl}" alt="${preset.title} 네이버 홈판 대표 썸네일" style="width:100%;max-width:520px;height:auto;border-radius:14px;border:2px solid #0f172a;display:block;margin:0 auto 12px auto;" />
    <img src="${webtoonGridUrl}" alt="${preset.title} 4컷 동물 웹툰 영수증" style="width:100%;max-width:640px;height:auto;border-radius:12px;border:1px solid #cbd5e1;display:block;margin:0 auto;" />
  </a>
  <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin-bottom:16px;font-size:19px;line-height:1.65;">
    <div style="margin-bottom:8px;color:#dc2626;font-weight:800;">❌ ${badLabel}: <strong>${badVal}</strong></div>
    <div style="margin-bottom:8px;color:#059669;font-weight:800;">✅ ${goodLabel}: <strong>${goodVal}</strong></div>
    <div style="color:#2563eb;font-weight:900;font-size:19px;">💡 핵심 손익 차이: ${diffVal}</div>
  </div>
  ${sourcedHtmlBlock}
  <p style="font-size:16px;line-height:1.85;color:#1e293b;margin:0 0 16px 0;">${res.summary}</p>
  <div style="text-align:center;display:flex;flex-direction:column;gap:10px;">
    <a href="${targetUrl}?src=naver_blog" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 22px;background:#0f172a;color:#ffffff;font-size:18px;font-weight:900;border-radius:10px;text-decoration:none;">👉 내 조건 넣은 4컷 최종 영수증 3초 무료 계산하기 (${targetUrl}) ↗</a>
    <a href="${calcHubUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 18px;background:#1e40af;color:#ffffff;font-size:16px;font-weight:800;border-radius:10px;text-decoration:none;">🏠 머니핏 6대 생활비 3초 계산기 공식 포털 (${calcHubUrl}) ↗</a>
    <a href="${brandConnectUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 20px;background:#03c75a;color:#ffffff;font-size:16px;font-weight:800;border-radius:10px;text-decoration:none;">🛍️ 네이버 쇼핑커넥트 검증 특가: ${bcItem.label} ↗</a>
  </div>
</div>`;

  return {
    id: preset.id,
    slug: preset.id,
    calc: preset.calc,
    category: preset.category,
    title: preset.title,
    homeFeedTitle,
    epTitle,
    webtoonGridUrl,
    blogHomeThumbUrl,
    query,
    subQueries,
    targetUrl,
    brandConnectUrl,
    brandConnectSubUrl,
    officialCafeUrl,
    coupangUrl,
    linkPriceUrl,
    cpaActionUrl,
    kinSearchUrl,
    cafeSearchUrl,
    dcSearchUrl,
    blindSearchUrl,
    threadsSearchUrl,
    daumCafeSearchUrl,
    res,
    resolvedStory,
    blogPost,
    jisikinPost,
    cafeCommentPost,
    threadsPost,
    naverSmartEditorHtml
  };
}

/**
 * Generate all 36 markdown files and compile into viral-content.js
 */
function generateAllViralPosts(currentSiteUrl = siteUrl) {
  if (!fs.existsSync(VIRAL_DIR)) {
    fs.mkdirSync(VIRAL_DIR, { recursive: true });
  }

  const viralPostsMap = {};
  const viralPostsList = [];

  console.log(`\nGenerating 36 Viral Post Bundles (target base: ${currentSiteUrl}) ...`);

  for (const preset of PRESETS) {
    const bundle = buildCopyBundle(preset, currentSiteUrl);

    // Markdown file content
    const mdContent = `# 🎯 [머니핏 바이럴 홍보 키트] ${bundle.title}
> 프리셋 ID: \`${bundle.id}\` | 카테고리: \`${bundle.category}\` | 웹툰: \`${bundle.epTitle}\` | 타겟 URL: [${bundle.targetUrl}](${bundle.targetUrl})
> 4컷 웹툰 영수증 짤: [${bundle.webtoonGridUrl}](${bundle.webtoonGridUrl}) | 3컷 스포일러 슬라이드: \`sns_outbox/${bundle.id}/slide-3.png\`
> 실시간 질문 스나이핑: [지식iN 최신순](${bundle.kinSearchUrl}) | [네이버 카페 최신순](${bundle.cafeSearchUrl}) | [디시인사이드](${bundle.dcSearchUrl}) | [블라인드](${bundle.blindSearchUrl}) | [스레드](${bundle.threadsSearchUrl}) | [다음 카페](${bundle.daumCafeSearchUrl})

---

## 📝 [네이버 블로그 / 티스토리] 정보성 포스팅 전문 (1,500자+ 심층 분석 & 4컷 웹툰 브릿지)
\`\`\`markdown
${bundle.blogPost}
\`\`\`

---

## 📋 [스마트에디터 ONE 복붙용] 네이버 블로그·카페 웹툰 카드 클립보드 HTML
\`\`\`html
${bundle.naverSmartEditorHtml}
\`\`\`

---

## 💡 [네이버 지식iN / 대표 카페] 전문가 맞춤 답변 (10초 복붙용 수치 근거 & 3컷 영수증 팁)
\`\`\`text
${bundle.jisikinPost}
\`\`\`

---

## 💬 [맘카페 / 자취카페 / 동호회] 내돈내산·경험담 자연스러운 댓글 (스팸 차단 우회)
\`\`\`text
${bundle.cafeCommentPost}
\`\`\`

---

## 🧵 [스레드(Threads) / 블라인드] 3줄 FOMO 요약글 (손해 회피 심리 자극)
\`\`\`text
${bundle.threadsPost}
\`\`\`
`;

    const mdPath = path.join(VIRAL_DIR, `${preset.id}.md`);
    fs.writeFileSync(mdPath, mdContent, 'utf8');

    viralPostsMap[preset.id] = {
      id: bundle.id,
      slug: bundle.id,
      calc: bundle.calc,
      category: bundle.category,
      title: bundle.title,
      epTitle: bundle.epTitle,
      webtoonGridUrl: bundle.webtoonGridUrl,
      query: bundle.query,
      subQueries: bundle.subQueries,
      targetUrl: bundle.targetUrl,
      coupangUrl: bundle.coupangUrl,
      linkPriceUrl: bundle.linkPriceUrl,
      cpaActionUrl: bundle.cpaActionUrl,
      kinSearchUrl: bundle.kinSearchUrl,
      cafeSearchUrl: bundle.cafeSearchUrl,
      dcSearchUrl: bundle.dcSearchUrl,
      blindSearchUrl: bundle.blindSearchUrl,
      threadsSearchUrl: bundle.threadsSearchUrl,
      daumCafeSearchUrl: bundle.daumCafeSearchUrl,
      headline: bundle.res.headline,
      badge: bundle.res.badge,
      blogPost: bundle.blogPost,
      jisikinPost: bundle.jisikinPost,
      cafeCommentPost: bundle.cafeCommentPost,
      threadsPost: bundle.threadsPost,
      naverSmartEditorHtml: bundle.naverSmartEditorHtml
    };

    viralPostsList.push(viralPostsMap[preset.id]);
    console.log(`  ✓ viral_posts/${preset.id}.md`);
  }

  // Generate src/data/viral-content.js
  const jsContent = `/**
 * MoneyFit Portal - 36 Viral Content Bundles (Pre-compiled Data Store)
 * Auto-generated by scripts/generate-viral-content.js
 * Compatible with CommonJS, ES Modules, and Vanilla Browser environments.
 */

(function () {
  'use strict';

  const VIRAL_POSTS = ${JSON.stringify(viralPostsMap, null, 2)};
  const VIRAL_LIST = ${JSON.stringify(viralPostsList, null, 2)};

  function getViralPost(id) {
    return VIRAL_POSTS[id] || null;
  }

  function getAllViralPosts() {
    return VIRAL_LIST;
  }

  // CommonJS export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      VIRAL_POSTS,
      VIRAL_LIST,
      getViralPost,
      getAllViralPosts
    };
  }

  // Browser global export
  if (typeof window !== 'undefined') {
    window.MoneyFitViralContent = {
      VIRAL_POSTS,
      VIRAL_LIST,
      getViralPost,
      getAllViralPosts
    };
    window.VIRAL_POSTS = VIRAL_POSTS;
  }
})();
`;

  fs.writeFileSync(OUTPUT_DATA_JS, jsContent, 'utf8');
  console.log(`\n  ✓ Generated pre-compiled data store: src/data/viral-content.js (${viralPostsList.length} presets)`);
  console.log(`🎉 36 Viral Post Bundles (144 copy items) created successfully!`);

  return { viralPostsMap, viralPostsList };
}

if (require.main === module) {
  generateAllViralPosts();
}

module.exports = {
  buildCopyBundle,
  generateAllViralPosts,
  QUERY_MAP
};
