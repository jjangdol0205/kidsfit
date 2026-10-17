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

const { PRESETS } = require('../src/data/presets.js');
const calculators = require('../src/data/calculators.js');
const monetization = require('../src/data/monetization.js');
const webtoonStories = require('../src/data/webtoon-stories.js');

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
  const strat = CATEGORY_STRATEGY_MAP[preset.calc] || CATEGORY_STRATEGY_MAP.electric;
  const uniqueHashtags = story.hashtags || `#${preset.category.replace(/[^가-힣a-zA-Z0-9]/g, '')} #${query.split(' ').join(' #')} #머니핏`;

  // 1. Blog Post (Preset-Unique Opening, Domain-Specific Strategy, Zero Cross-Category Boilerplate)
  const tableMd = formatMarkdownTable(preset.tableHeaders, preset.tableRows);
  const metricsList = res.metrics.map(m => `• **${m.label}**: ${m.val}`).join('\n');
  const faqList = (preset.faq || []).map((f, i) => `**Q${i + 1}. ${f.question || f.q}**\nA. ${f.answer || f.a}`).join('\n\n');

  const blogPost = `[제목] ${preset.title} — 2026 실제 수식 비교 & 손익분기점 정리

${story.hookLine || `요즘 ${preset.title} 관련해서 실제 비용과 손익분기점을 궁금해하시는 분들이 정말 많습니다.`}
오늘은 **「${preset.title}」** 조건에서 ${strat.introContext}가 실제로 어떻게 계산되는지, ${strat.authoritySource}을 바탕으로 1원·1g 단위까지 투명하게 정리해 드립니다.

${story.factLine || preset.description}

---

### 1. 머니핏 정밀 시뮬레이션 결과 (${preset.category})
- **진단 상태**: ${res.badge}
- **핵심 판정**: ${res.headline}

#### 📊 핵심 산출 지표 요약
${metricsList}

> **전문가 분석 코멘트**:  
> ${res.summary}

---

### 2. 조건별 상세 비교 데이터 (${preset.title})
아래 표는 **${query}** 조건에서 선택지별 비용과 기대 효과를 비교한 실측 데이터입니다.

${tableMd}

---

### 3. ${preset.category} 손해 막는 3단계 체크리스트
1. **내 조건 수치 대입 (${strat.inputHint})**: ${strat.step1}
2. **고정비 누수 포인트 차단**: ${strat.step2}
3. **맞춤 특가 및 혜택 활용**: ${strat.step3}

---

### 4. 자주 묻는 질문 (FAQ)
${faqList}

---

### 5. 내 조건으로 3초 무료 계산 & 맞춤 혜택 확인하기
${story.ctaLine || `내 조건(${strat.inputHint})을 직접 입력해 3초 만에 손익분기점 영수증을 확인해 보세요.`} 회원가입이나 앱 설치 없이 웹에서 바로 계산됩니다.

👉 **[무료] ${preset.title} 3초 시뮬레이터 바로가기**:  
🔗 ${targetUrl}

🚀 **[쿠팡 파트너스] ${cpaDetails.coupangSubLabel} 확인하기**:  
🔗 ${coupangUrl}

🏷️ **[공식몰 기획전] ${cpaDetails.linkPriceSubLabel} 바로가기**:  
🔗 ${linkPriceUrl}

*(※ 이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다. 또한 링크프라이스(LinkPrice)·텐핑(Tenping) 등 제휴 마케팅 활동의 일환으로 소정의 커미션을 제공받을 수 있으나, 이용자(구매자)에게 발생하는 추가 부담금은 일절 없습니다. 본 시뮬레이션 수치는 참고용 추정치이며 실제 약관에 따라 상이할 수 있습니다.)*

${uniqueHashtags}`;

  // 2. Jisik-iN / Cafe Natural Human Answer (Preset-specific, zero boilerplate)
  const plainMetrics = res.metrics.map(m => `- ${m.label}: ${m.val}`).join('\n');
  const jisikinPost = `안녕하세요! ${query} 관련해서 고민 중이시군요.
저도 얼마 전에 ${story.panel1Speech ? story.panel1Speech.replace(/"/g, '') : `${preset.title} 조건이 헷갈려서`} 실제 수식대로 직접 계산해 보고 기준을 잡았습니다.

질문자님과 비슷한 조건(${preset.title})으로 시뮬레이션을 돌려보면 핵심 결과는 **'${res.headline} (${res.badge})'**로 산출됩니다.

[핵심 계산 수치 요약]
${plainMetrics}

${story.factLine || res.summary}

사람마다 세부 조건(${strat.inputHint})이 조금씩 다르다 보니 눈대중으로 결정하면 생각보다 손해 보는 금액이 꽤 크더라고요.
회원가입이나 개인정보 입력 없이 본인 숫자만 넣으면 3초 만에 위 비교표를 그대로 뽑아볼 수 있는 무료 계산기 주소 남겨둘 테니 결정하시기 전에 한 번 대입해 보세요.

참고한 무료 계산기: ${targetUrl}
작게나마 결정하시는 데 도움이 되었으면 좋겠습니다!`;

  // 3. Natural Cafe / Club Member Experience Comment
  const firstMetric = res.metrics && res.metrics[0] ? `${res.metrics[0].label} ${res.metrics[0].val}` : res.headline;
  const secondMetric = res.metrics && res.metrics[1] ? `${res.metrics[1].label} ${res.metrics[1].val}` : res.badge;
  const cafeCommentPost = `${story.hookLine || `저도 얼마 전에 ${query} 때문에 똑같은 고민 했었어요 ㅎㅎ`}
막연히 감으로 고르면 손해 볼까 봐 걱정됐는데, 제 조건(${strat.inputHint}) 넣어서 돌려보니까 [${res.headline} / ${firstMetric}, ${secondMetric}] 이렇게 숫자로 딱 정리돼서 나오더라고요!
로그인 같은 거 전혀 없는 무료 계산기인데 내 조건에 맞는 최저가 비교까지 한 번에 나와서 편했습니다 :)
${targetUrl}`;

  // 4. Threads / Blind 3-Line Copy (Clean, non-spammy, preset-accurate)
  const keyMetric = res.metrics && res.metrics[0] ? `${res.metrics[0].label}: ${res.metrics[0].val}` : res.headline;
  const threadsPost = `${story.hookLine || `'${preset.title}' 감으로 결정하기 전에 꼭 한 번 계산해 보세요.`}\n${story.factLine || `실제 수식으로 계산해 보니 [${res.headline} / ${keyMetric}] 차이가 발생합니다.`}\n${story.ctaLine || `내 조건(${strat.inputHint}) 3초 무료 시뮬레이션`}: ${targetUrl}`;

  return {
    id: preset.id,
    slug: preset.id,
    calc: preset.calc,
    category: preset.category,
    title: preset.title,
    query,
    subQueries,
    targetUrl,
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
    blogPost,
    jisikinPost,
    cafeCommentPost,
    threadsPost
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
> 프리셋 ID: \`${bundle.id}\` | 카테고리: \`${bundle.category}\` | 타겟 URL: [${bundle.targetUrl}](${bundle.targetUrl})
> 실시간 질문 스나이핑: [지식iN 최신순](${bundle.kinSearchUrl}) | [네이버 카페 최신순](${bundle.cafeSearchUrl}) | [디시인사이드](${bundle.dcSearchUrl}) | [블라인드](${bundle.blindSearchUrl}) | [스레드](${bundle.threadsSearchUrl}) | [다음 카페](${bundle.daumCafeSearchUrl})

---

## 📝 [네이버 블로그 / 티스토리] 정보성 포스팅 전문 (1,500자+ 심층 분석)
\`\`\`markdown
${bundle.blogPost}
\`\`\`

---

## 💡 [네이버 지식iN / 대표 카페] 전문가 맞춤 답변 (10초 복붙용 수치 근거)
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
      threadsPost: bundle.threadsPost
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
