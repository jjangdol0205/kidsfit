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
  const targetUrl = `${currentSiteUrl}/preset/${preset.id}`;
  const query = QUERY_MAP[preset.id] || preset.title.split(' ').slice(0, 4).join(' ');
  const subQueries = [
    query,
    `${preset.category} ${preset.id.split('-')[1] || ''} 추천 후기`.trim(),
    `${query} 비교 디시`
  ];
  const encodedQ = encodeURIComponent(query);
  const kinSearchUrl = `https://kin.naver.com/search/list.naver?query=${encodedQ}&sort=date`;
  const cafeSearchUrl = `https://search.naver.com/search.naver?where=article&query=${encodedQ}&st=date`;
  const dcSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:dcinside.com ${query}`)}&tbs=qdr:m`;
  const blindSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:teamblind.com ${query}`)}&tbs=qdr:m`;
  const threadsSearchUrl = `https://www.threads.net/search?q=${encodedQ}&serp_type=default`;
  const daumCafeSearchUrl = `https://search.daum.net/search?w=cafe&q=${encodedQ}& sort=recency`;

  // 1. Blog Post
  const tableMd = formatMarkdownTable(preset.tableHeaders, preset.tableRows);
  const metricsList = res.metrics.map(m => `• **${m.label}**: ${m.val}`).join('\n');
  const faqList = (preset.faq || []).map((f, i) => `**Q${i + 1}. ${f.question || f.q}**\nA. ${f.answer || f.a}`).join('\n\n');

  const blogPost = `[제목] ${preset.title} — 2026 손익분기점 총정리 & 실전 비교

안녕하세요! 매달 빠져나가는 생활 고정비와 금융 지출 때문에 고민 많으셨죠?
오늘은 많은 분들이 검색하고 궁금해하시는 **「${preset.title}」**에 대해, 주관적인 느낌이 아닌 한국전력·보건복지부·수의영양학·여신금융협회 등 공인 수식을 기반으로 1원 단위까지 정밀 분석해 드립니다.

우리가 일상에서 무심코 결정하는 가전 가동 시간, 다이어트 식단 장보기, 사료 구매량, 신차 구매 방식, 통신사 약정 등은 1년으로 환산하면 수십만 원에서 수백만 원의 실질적인 현금 손익 차이를 만듭니다.

---

### 1. 머니핏 정밀 계산 결과 브리핑
- **진단 상태**: ${res.badge}
- **핵심 판정**: ${res.headline}

#### 📊 핵심 산출 지표 요약
${metricsList}

> **전문가 종합 소견**:  
> ${res.summary}

---

### 2. 가동 및 선택 방식별 상세 비교표
아래 표는 실제 조건에 따른 단계별 비용 및 절감 효과를 체계적으로 정리한 데이터입니다.

${tableMd}

위 비교표에서 보실 수 있듯이, 초기에 올바른 선택(에너지소비효율 1등급 교체, 정확한 필요량 사전 산출, 무보증 특판 비교, 사은품 당일 지급 갈아타기 등)을 실행할 경우 누적 손익분기점 도달 기간을 획기적으로 앞당길 수 있습니다.

---

### 3. 실전 손해 방지 및 절약 치트키
1. **정확한 본인 수치 대입 필수**: 사람마다 거주 평수, 체중, 계약 잔여 기간이 다르므로 반드시 실제 데이터를 넣고 시뮬레이션해야 오차를 막을 수 있습니다.
2. **불필요한 과다 지출 차단**: 누진세 최고구간 진입, 사료 과다 급여로 인한 비만/질병, 약정 만기 방치로 통신사에 기부하는 행위를 즉시 멈추세요.
3. **인증된 공식 혜택 및 제휴 특판 활용**: 정부 고효율 가전 환급, 대용량 장바구니 묶음 할인, 법인/개인 특판 차량 재고, 인터넷 당일 법정 최대 사은품(최대 47만 원)을 적극 챙기시기 바랍니다.

---

### 4. 자주 묻는 질문 (FAQ)
${faqList}

---

### 5. 3초 맞춤 무료 계산기 안내
내 집 평수, 내 몸무게, 내 차량 견적, 내 남은 위약금을 직접 입력하여 3초 만에 1원 단위 충격 영수증을 확인해 보세요. 회원가입 없이 즉시 확인 가능합니다.

👉 **[무료] 내 조건으로 3초 만에 손익분기점 진단하기**:  
🔗 ${targetUrl}

*(※ 본 포스팅은 공익적 정보 제공을 목적으로 작성되었으며, 제휴마케팅 활동의 일환으로 일정액의 수수료를 제공받을 수 있습니다.)*

#${preset.category.replace(/[^가-힣a-zA-Z0-9]/g, '')} #${query.split(' ').join(' #')} #머니핏 #손익분기점계산기 #생활비절약꿀팁 #2026최신가이드`;

  // 2. Jisik-iN / Cafe Expert Answer
  const jisikinPost = `질문자님! '${preset.title}' 관련하여 질문 주셨네요.
인터넷의 단순 홍보 글 대신, 실제 검증된 도메인 계산 수식을 돌려 산출한 팩트 데이터를 전해드립니다.

■ 핵심 판정 결과: ${res.headline} (${res.badge})
${metricsList}

■ 전문가 상세 조언:
${res.summary}

많은 분들이 잘못된 정보로 인해 매달 불필요한 고정비를 낭비하고 계십니다. 질문자님의 구체적인 상황(시간, 예산, 차종, 위약금 등)을 정확히 대입하여 오차 없이 비교해 보시는 것을 권장합니다.

로그인이나 개인정보 입력 없이 3초 만에 1원 단위 상세 영수증과 손익분기 도달 개월을 확인하실 수 있는 무료 시뮬레이터 좌표를 남겨드립니다.

👉 질문자님 맞춤 손익분기점 3초 계산기:
${targetUrl}

도움이 되셨다면 채택 부탁드립니다! 오늘도 현명한 하루 보내세요.`;

  // 3. Natural Cafe / Club Member Experience Comment (맘카페·자취카페·차량동호회 내돈내산 경험담 톤)
  const firstMetric = res.metrics && res.metrics[0] ? `${res.metrics[0].label} ${res.metrics[0].val}` : res.headline;
  const secondMetric = res.metrics && res.metrics[1] ? `${res.metrics[1].label} ${res.metrics[1].val}` : res.badge;
  const cafeCommentPost = `저도 얼마 전에 똑같은 고민 하다가 직접 계산기 돌려보고 결정했어요! 😊
막연히 감으로 고르면 손해 보는 줄 몰랐는데, 제 조건 넣어서 돌려보니까 [${res.headline} (${firstMetric} / ${secondMetric})] 이렇게 딱 숫자로 비교돼서 나오더라고요.
광고나 개인정보 입력 아예 없는 무료 손익분기점 시뮬레이터인데 결정하시기 전에 본인 조건 넣어서 한 번 찍어보세요! 진짜 속 시원하게 정리됩니다 ㅎㅎ
👉 ${targetUrl}`;

  // 4. Threads / Blind 3-Line FOMO Copy
  const keyMetric = res.metrics && res.metrics[0] ? `${res.metrics[0].label}: ${res.metrics[0].val}` : res.headline;
  const threadsPost = `🚨 아직도 '${preset.title}' 모르고 돈 날리는 분 계신가요? 💸
방금 계산기 돌려봤는데 [${res.headline} / ${keyMetric}] 나옵니다 ㄷㄷ
결제·장보기 전에 내 조건 넣고 3초 만에 손익분기점 꼭 확인해보세요 👉 ${targetUrl}`;

  return {
    id: preset.id,
    slug: preset.id,
    category: preset.category,
    title: preset.title,
    query,
    subQueries,
    targetUrl,
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
      category: bundle.category,
      title: bundle.title,
      query: bundle.query,
      subQueries: bundle.subQueries,
      targetUrl: bundle.targetUrl,
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
