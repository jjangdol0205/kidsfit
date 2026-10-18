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

const {
  buildHumanCategoryNarrative,
  buildSmartEditorHtmlForPreset,
  cleanCaseLabel,
  humanizeProductName
} = require('./division1-comedifarm-engine.js');

/**
 * Build copy bundle for a single preset (v4.0 Human-Written Quality & Zero Errors)
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
  const narrative = buildHumanCategoryNarrative(preset, res, resolvedStory);

  const epTitle = (resolvedStory.shortCartoon && resolvedStory.shortCartoon.epTitle) || preset.title;
  const webtoonGridUrl = `${currentSiteUrl}/sns/${preset.id}-grid.png`;
  const blogHomeThumbUrl = `${currentSiteUrl}/sns/${preset.id}-thumb.png`;
  const badVal = resolvedStory.badVal || res.headline;
  const goodVal = resolvedStory.goodVal || res.badge;
  const badLabel = cleanCaseLabel(resolvedStory.badLabel || '기존 방식 유지 시', badVal);
  const goodLabel = cleanCaseLabel(resolvedStory.goodLabel || '맞춤 기준 적용 시', goodVal);
  const diffVal = resolvedStory.diffVal || res.headline;
  const diffDisplay = (diffVal && res.headline && diffVal !== res.headline && !res.headline.includes(diffVal))
    ? `${diffVal} (${res.headline})`
    : (diffVal || res.headline);

  const uniqueHashtags = Array.isArray(story.hashtags)
    ? story.hashtags.join(' ')
    : (story.hashtags || `#${preset.category.replace(/[^가-힣a-zA-Z0-9]/g, '')} #${query.split(' ').join(' #')} #머니핏`);

  // Natural human blog title (zero broken grammar)
  const homeFeedTitle = `${preset.title} — 직접 계산해보고 정리한 현실 비교 노트 (${res.headline})`;

  const isCat = preset.id.includes('cat') || preset.id.includes('shorthair') || (preset.title && preset.title.includes('고양이')) || (preset.title && preset.title.includes('노령묘')) || (preset.title && preset.title.includes('코숏'));

  const BC_LINKS_BY_CALC = {
    electric: {
      label: '듀플렉스 스탠드 에어서큘레이터 선풍기 DPK-55CF',
      url: 'https://naver.me/xm0ZVnAW',
      subLabel: '[슈퍼적립] 로보락 Qrevo Curv 2 Flow 26년 신형 로봇청소기',
      subUrl: 'https://naver.me/GgUlTvYj'
    },
    diet: {
      label: '한끼통살 소스 통 닭가슴살 100g 20종 10개입',
      url: 'https://naver.me/xvClW9nJ',
      subLabel: '모던구루 유기농 애사비 스틱 오리지널 21포',
      subUrl: 'https://naver.me/GxrdvbPG'
    },
    pet: {
      label: isCat ? '하림펫푸드 밥이보약 고양이 맞춤 레시피' : '라비앙독 강아지 가수분해 피부·눈물 케어 연어 사료 4.8kg',
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
      label: '아이테라 26년형 2채널 FHD 블랙박스 와이파이 동글포함 32G',
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

  const tableMd = formatMarkdownTable(preset.tableHeaders, preset.tableRows);
  const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표 1', val: '-', sub: '실측 산출 기준' };
  const m1 = (res.metrics && res.metrics[1]) || { label: '핵심 지표 2', val: '-', sub: '권장 적용 기준' };
  const m2 = (res.metrics && res.metrics[2]) || { label: '핵심 지표 3', val: '-', sub: '체감 유지 기준' };
  const faqList = (preset.faq || []).map((f, i) => `### Q${i + 1}. ${f.question || f.q}\n- **답변:** ${f.answer || f.a}`).join('\n\n');

  // 1. Blog Post (100% Human-Written First-Person Narrative, Zero Meta Tags, Single Climax Link)
  const blogPost = `# ${homeFeedTitle}

### 🧾 바쁜 분들을 위한 3초 핵심 비교 요약
- **✗ ${badLabel}**: **${badVal}**
- **✓ ${goodLabel}**: **${goodVal}**
- **★ 핵심 체감 차이**: **${diffDisplay}**

---

## 1. ${narrative.section1Title}

${narrative.empathyIntro}

${narrative.mechanismDeepDive}

---

## 2. 조건별로 직접 대조해 본 상세 비교표

| 핵심 확인 항목 | 계산된 수치 | 상세 설명 |
| :--- | :--- | :--- |
| **한줄 결론** | **${res.headline}** | ${res.badge || '실측 기준 요약'} |
| **${m0.label}** | **${m0.val || m0.value || '-'}** | ${m0.sub || '실측 산출 기준'} |
| **${m1.label}** | **${m1.val || m1.value || '-'}** | ${m1.sub || '권장 적용 기준'} |
| **${m2.label}** | **${m2.val || m2.value || '-'}** | ${m2.sub || '체감 유지 기준'} |

${tableMd}

${res.summary}

---

## 3. ${narrative.section3Title}

${narrative.purchaseBridge}

${faqList}

---

## 4. 내 조건 숫자 넣어보고 3초 만에 계산 결과 확인하기

집집마다 평수나 사용 시간, 예산이나 체중 조건이 조금씩 다르다 보니 내 숫자를 직접 넣어서 확인해 보시는 게 가장 정확합니다. 회원가입이나 개인정보 입력 없이 숫자만 넣으면 3초 만에 비교 영수증과 실속 추천 구성을 한눈에 볼 수 있는 계산기 주소를 아래에 남겨둘게요!

👉 **내 조건으로 3초 무료 계산해 보기**:
${targetUrl}

${uniqueHashtags}`;

  // 2. Jisik-iN Answer (100% Human Experience-Sharing Tone + Comment Link Split)
  const jisikinPost = `안녕하세요! 저도 얼마 전에 **${preset.title}** 문제로 똑같이 고민하다가, 카더라 통신 말고 실제 수식에 숫자를 직접 넣어서 비교해 본 적이 있어 반가운 마음에 답변 남깁니다 :)

결론부터 말씀드리면 이 조건에서는 **${res.headline}** 수준으로 차이가 벌어지는데요. 바쁘신 질문자님을 위해 제가 계산해 본 핵심 숫자부터 깔끔하게 짚어드릴게요!

1. 한눈에 보는 핵심 계산 결과
• ${badLabel}: ${badVal}
• ${goodLabel}: ${goodVal}
• 세부 수치 요약: ${m0.label} ${m0.val || '-'} / ${m1.label} ${m1.val || '-'} / ${m2.label} ${m2.val || '-'}

2. 왜 이렇게 차이가 날까요?
${narrative.mechanismDeepDive}

3. 실패 없이 아끼는 현실 팁
${narrative.purchaseBridge}

질문자님의 세부 조건을 살짝 바꿔서 직접 영수증을 뽑아보고 싶으시다면 네이버나 구글 검색창에 「머니핏 ${query} 계산기」 (또는 truthofmarket)를 검색해 보세요! 로그인이나 광고 없이 숫자만 넣으면 3초 만에 확인하실 수 있어서 정말 편합니다. 고민 해결에 작은 도움이 되셨길 바라며, 답변이 도움 되셨다면 채택 부탁드립니다! 좋은 하루 보내세요 :)

[답변 등록 1분 뒤 '대댓글(의견)'에 복사해 넣을 안내 문구]
질문자님! 혹시 일일이 검색하시기 번거로우실까 봐 제가 직접 숫자 넣어봤던 무료 3초 계산기 주소도 댓글에 살짝 남겨둡니다 :) 회원가입 전혀 없어요! ➔ ${targetUrl}`;

  // 3. Cafe / Community Post
  const cafeCommentPost = `## [정보공유] ${preset.title}, 감으로 결정하기 전에 직접 계산해 본 비교 표 공유해요!

카페 회원님들 안녕하세요! 😊
얼마 전부터 ${preset.title} 때문에 계속 고민하다가, 남들 카더라 후기만 보고 결정하면 괜히 생돈 날릴 것 같아서 실제 공식에 숫자를 하나씩 넣어서 비교표를 만들어 봤어요.

### 💡 1. 한눈에 보는 Before vs After 핵심 비교
• ✗ ${badLabel}: ${badVal}
• ✓ ${goodLabel}: ${goodVal}
• ★ 핵심 체감 차이: ${diffDisplay}

### 📊 2. 왜 이렇게 차이가 날까요?
${narrative.empathyIntro}

${narrative.mechanismDeepDive}

${tableMd}

### ✅ 3. 돈 아끼면서 실패 없는 실전 팁
${narrative.purchaseBridge}

👉 내 조건 넣어서 3초 만에 비교 영수증 뽑아보기 (무료/무가입):
${targetUrl}`;

  // 4. Threads / Blind 3-Line Copy
  const keyMetric = res.metrics && res.metrics[0] ? `${res.metrics[0].label}: ${res.metrics[0].val}` : res.headline;
  const threadsPost = `🐾 [${epTitle}] 3초 영수증 팩트체크!\n\n❌ ${badLabel}: ${badVal}\n✅ ${goodLabel}: ${goodVal}\n💰 핵심 체감 차이: ${diffDisplay} (${keyMetric})\n\n👉 내 조건 3초 무료 계산기 바로가기:\n${targetUrl}`;

  // 5. Naver SmartEditor ONE Clean Copy-Paste HTML
  const naverSmartEditorHtml = buildSmartEditorHtmlForPreset(preset, res, resolvedStory, narrative, targetUrl);

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
  } else {
    for (const f of fs.readdirSync(VIRAL_DIR)) {
      const fp = path.join(VIRAL_DIR, f);
      if (fs.statSync(fp).isFile()) fs.unlinkSync(fp);
    }
  }

  const viralPostsMap = {};
  const viralPostsList = [];

  console.log(`\nPurging legacy viral_posts and generating 36 v4.0 Human-Written Viral Post Bundles (target base: ${currentSiteUrl}) ...`);


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
