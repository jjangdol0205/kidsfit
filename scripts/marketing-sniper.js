#!/usr/bin/env node
/**
 * MoneyFit Marketing Sniper Engine (Node.js Port & Enhancement)
 *
 * Bottom-of-Funnel Conversion Engine:
 * 1. Generates 1:1 model comparisons across all 6 calculator categories
 * 2. High-intent real-time Naver Jisik-iN and Cafe search links (sort=date, st=date)
 * 3. 24-hr Coupang cart cookie bait buttons & high-ticket CPA native lead hooks
 * 4. Outputs `오늘의_실전마케팅_스나이퍼_키트.md` to both portal root and parent workspace.
 *
 * Exit code: 0 on success.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PARENT_ROOT = path.resolve(PROJECT_ROOT, '..');

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

const HIGH_INTENT_TARGETS = [
  {
    category: '1. 전기·가전 (쿠팡 24시간 쿠키 + 고액 객단가)',
    calcSlug: 'electric-studio-ac',
    versus_title: 'LG 휘센 듀얼인버터 벽걸이 vs 캐리어 에어로 18단 1등급 — 원룸 3년 총비용(기기값+전기세) 승자는?',
    search_queries: [
      '원룸 벽걸이 에어컨 추천 디시',
      '캐리어 인버터 에어컨 전기세 후기',
      '위닉스 뽀송 16L vs LG 휘센 제습기 전기세'
    ],
    hook_button_copy: "⚡ 오늘 쿠팡 '단순변심 미개봉 반품특가(-32%)' 잔여 재고 1초 확인하기",
    story_hook_threads: (
      "원룸 에어컨 아무거나 샀다가 지난달 전기세 14만원 맞고 정신 차렸습니다 😭\n" +
      "기계값 15만원 아끼려다 정속형 사면 한 여름에 전기세로 다 토해냅니다.\n" +
      "방금 모델별 하루 10시간 가동 시 실제 누진세+기기값 손익분기점 표 정리해뒀으니 에어컨/제습기 사기 전에 무조건 찍어보세요 👇"
    ),
    jisikin_sniper_reply: (
      "질문자님! 지금 보시는 모델은 소비전력이 높아 하루 8시간만 틀어도 누진 2~3단계에 걸릴 확률이 높습니다.\n" +
      "초기 구매가가 조금 차이 나더라도 1등급 인버터로 가시면 한 철 전기세로만 월 5~6만 원이 세이브되어 1년이면 본전을 뽑습니다.\n" +
      "평수별/모델별 실제 한 달 전기세 비교표와 오늘 기준 쿠팡 로켓설치/반품특가 최저가 좌표를 아래 시뮬레이터에 정리해 두었으니 결제 전에 꼭 비교해 보세요!"
    )
  },
  {
    category: '2. 다이어트 식단 & 헬스 보충제 (쿠팡 로켓프레시 대량 장바구니 유도)',
    calcSlug: 'diet-male-fatloss',
    versus_title: '하림 닭가슴살 오리지널 vs 맛있닭 소프트 100g — 4주 컷팅 단백질 그램당 단가 및 팩수 비교',
    search_queries: [
      '자취생 닭가슴살 대용량 가성비 추천',
      '한달 4kg 감량 닭가슴살 몇팩',
      '신타6 vs 컴뱃 WPI 프로틴 가성비 비교'
    ],
    hook_button_copy: '🛒 계산된 4주 수량 그대로 쿠팡 로켓프레시 최저가 장바구니 한 번에 담기',
    story_hook_threads: (
      "다이어트할 때 닭가슴살 낱개로 사면 한 달에 6만원씩 더 쓰는 거 아시나요? 🍗\n" +
      "내 몸무게랑 목표 기간만 넣으면 앞으로 4주 동안 먹어야 할 단백질(g)이랑 닭가슴살 정확히 몇 팩 시켜야 딱 맞는지 계산해 주는 사이트 찾았습니다.\n" +
      "장보기 전에 내 체중 넣고 몇 팩 사야 돈 안 버리는지 확인해보세요 👇"
    ),
    jisikin_sniper_reply: (
      "질문자님 체중 기준으로 Mifflin-St Jeor 공식과 제지방량을 감안했을 때, 하루 단백질 권장량은 약 140~160g 수준입니다.\n" +
      "일반 식사에서 보충되는 양을 제외하면 닭가슴살(팩당 23g 기준) 순수 4~5팩, 즉 4주 기준 약 110~130팩이 필요합니다.\n" +
      "낱개로 사지 마시고 대용량 벌크 묶음으로 주문하셔야 팩당 단가가 1,200원대로 떨어져 한 달 7만 원 이상 절약됩니다.\n" +
      "내 체중별 정확한 4주 장보기 수량표와 오늘 기준 팩당 최저가 좌표는 아래 계산기에서 바로 계산됩니다!"
    )
  },
  {
    category: '3. 반려동물 사료 & 양육비 (쿠팡 정기배송 + 펫보험/동물병원 리드)',
    calcSlug: 'pet-maltese-5kg',
    versus_title: '로얄캐닌 미니 인디고 vs 뉴트로 내추럴초이스 소형견 2kg — 말티즈/포메 RER 사료 급여량 & 소진일수 비교',
    search_queries: [
      '말티즈 눈물 사료 가수분해 추천 급여량',
      '강아지 사료 봉투 급여량 vs RER 계산',
      '포메라니안 1.5kg 하루 사료 몇그램'
    ],
    hook_button_copy: '🐶 우리 아이 알러지/관절 평점 4.8 이상 사료 오늘 특가 확인하기',
    story_hook_threads: (
      "사료 봉투 뒤에 적힌 양 그대로 줬다가 강아지 쓸개골 탈구 올 뻔했습니다 🐕\n" +
      "봉투 뒷면은 활동량 많은 미중성화 기준이라 일반 가정견은 무조건 과체중 됩니다.\n" +
      "수의영양학 공식(RER×생애주기 계수) 넣으면 하루 정확히 몇 그램 줘야 하는지랑 사료 한 포가 며칠 만에 떨어지는지 3초 만에 나옵니다 👇"
    ),
    jisikin_sniper_reply: (
      "사료 봉투 뒷면의 급여량 표는 활동량이 많은 미중성화 기준이라 그대로 주시면 과체중이 되기 쉽습니다.\n" +
      "수의영양학 공식(RER=70×체중^0.75, DER=RER×생애주기 계수)으로 계산하면 하루 정확한 급여량(g)과 종이컵 눈금, 그리고 사료 1포대가 며칠 만에 떨어지는지 바로 나옵니다.\n" +
      "아래 사료 급여량 계산기에서 아이 체중을 넣어보시고, 알러지/관절 맞춤 평점 4.8 이상 사료 최저가도 함께 비교해 보세요."
    )
  },
  {
    category: '4. 자취·이사·신혼 예산 풀세팅 (오늘의집/하이마트 링크프라이스 + 포장이사 CPA)',
    calcSlug: 'room-oneroom-100',
    versus_title: '원룸 자취 100만 원 필수 가전 삼성 vs 쿠쿠 풀세팅 — 예산 초과 0원 가성비 견적표',
    search_queries: [
      '원룸 100만원 가전가구 풀세팅 추천',
      '오피스텔 300만원 화이트 가전 리스트',
      '자취 필수 가전 가구 우선순위 뽐뿌'
    ],
    hook_button_copy: '🛋️ 100만 원 예산 안 넘기는 최적 BOM 견적표 및 최저가 좌표 열기',
    story_hook_threads: (
      "자취방 가전 가구 사다가 예산 50만원 훌쩍 넘겨서 카드값 폭탄 맞으신 분 많으시죠? 🛋️\n" +
      "내 예산(50만~1,000만원)만 넣으면 필수 가전·가구 품목을 1원도 안 넘기게 최적으로 배분해 주는 BOM 견적기 돌렸습니다.\n" +
      "화이트 감성이냐 극가성비냐 우선순위별로 최저가 좌표까지 싹 다 뽑아줍니다 👇"
    ),
    jisikin_sniper_reply: (
      "100만 원 예산으로 원룸 가전/가구를 맞추실 때는 냉장고·세탁기 등 대형 필수 가전에 55%, 침대/매트리스에 25%, 수납/책상에 20%를 배분하는 것이 황금비율입니다.\n" +
      "중복 지출이나 불필요한 인테리어 소품을 먼저 사시면 정작 핵심 가전 살 돈이 모자라게 됩니다.\n" +
      "예산 범위 내에서 절대 초과되지 않는 8대 필수 품목 추천표와 브랜드별 최저가 비교는 아래 시뮬레이터에서 3초 만에 확인하실 수 있습니다."
    )
  },
  {
    category: '5. 자동차 신차 장기렌트 vs 할부 (승인 1건당 60,000~75,000원 초고단가 CPA)',
    calcSlug: 'auto-avante-3000',
    versus_title: '더 뉴 아반떼 CN7 / 쏘렌토 하이브리드 — 신차 60개월 할부 vs 무보증 장기렌트 4년 실지출 영수증 비교',
    search_queries: [
      '아반떼 장기렌트 월 납입금 호구인가요',
      '쏘렌토 하이브리드 할부 vs 렌트 비교',
      '사회초년생 첫차 보험료 할부 장기렌트'
    ],
    hook_button_copy: '🚗 내 조건(무보증/선납금)에서 가장 싼 국내 21개 렌트사 특판 재고표 열기',
    story_hook_threads: (
      "신차 영업사원이 절대 먼저 안 알려주는 할부 vs 장기렌트 팩트 계산기 돌렸습니다 🚨\n" +
      "2030 초보운전이거나 개인사업자면 할부로 살 때 취등록세 7% + 보험료 폭탄 때문에 4년 동안 320만 원 더 내고 타는 꼴이네요.\n" +
      "차값만 넣으면 취등록세·보험료·절세액까지 합산해서 어디가 몇백만 원 싼지 3초 만에 영수증 뽑아줍니다 👇"
    ),
    jisikin_sniper_reply: (
      "올려주신 견적서를 보면 할부 금리와 초기 취등록세(7%), 그리고 매년 나가는 자동차보험료가 빠져 있어 월 납입금만 싸 보이는 착시 효과가 있습니다.\n" +
      "실제 48개월 유지 총비용(TCO)으로 취등록세와 보험료를 합산해 계산해 보면 장기렌트 특판 물량이 총 280~350만 원가량 저렴하게 나옵니다.\n" +
      "딜러 수수료 없이 내 차량가액 기준 4년 총지출 비교표와 21개 렌트사 최저가 비교를 아래 계산기에서 바로 확인해 보세요."
    )
  },
  {
    category: '6. 인터넷·TV 갈아타기 (승인 1건당 55,000원 초고단가 CPA)',
    calcSlug: 'telecom-penalty-15',
    versus_title: 'KT · SK브로드밴드 · LG유플러스 — 약정 만기/위약금 대납 + 현금 사은품 47만 원 당일 입금 손익표',
    search_queries: [
      '인터넷 약정 끝났는데 재약정 vs 이동',
      '인터넷 갈아타기 현금 47만원 성지',
      '인터넷 위약금 15만원 남았는데 바꾸는게 이득인가요'
    ],
    hook_button_copy: '💰 우리 집 남은 위약금 빼고 오늘 현금 몇 만 원 입금되는지 즉시 조회',
    story_hook_threads: (
      "인터넷 3년 약정 끝났는데도 귀찮아서 그냥 쓰고 계신 분? 통신사에 매달 치킨값 기부 중이십니다 🍗\n" +
      "심지어 약정 6개월 남아도(위약금 15만원) 지금 갈아타면 현금 사은품 47만원 당일 입금돼서 앉은 자리에서 +32만원 벌고 요금도 내려갑니다.\n" +
      "내 위약금 넣으면 지금 바꾸는 게 얼마 이득인지 1원 단위까지 계산해 주는 계산기입니다 👇"
    ),
    jisikin_sniper_reply: (
      "기존 통신사에 재약정을 하시면 상품권 5~10만 원 수준에 그치지만, 통신사를 이동(대칭형 광랜 기준)하시면 법정 최대 현금 사은품 47만 원을 당일 현금으로 지원받으실 수 있습니다.\n" +
      "현재 남은 위약금이 15~20만 원 이하라면 오늘 바로 이동하시는 것이 위약금을 내고도 약 30만 원 이상 순이익입니다.\n" +
      "정확한 위약금 차감 순수익 계산과 당일 현금 지급 공식 센터 비교는 아래 계산기에서 바로 확인 가능합니다."
    )
  }
];

function generateSniperKit(currentSiteUrl = siteUrl) {
  const now = new Date();
  const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const lines = [
    `# 🎯 [실전 마케팅 스나이퍼 리포트] 오늘 바로 결제·클릭을 유도하는 핀셋 영업 패키지`,
    `> 생성 시각: ${nowStr} | 타겟 도메인: \`${currentSiteUrl}\` | 공략 카테고리: 6대 전 카테고리`,
    ``,
    `## 💡 왜 사람들은 일반 앱에 안 오고, 아래 글에는 미친 듯이 클릭해서 결제하는가?`,
    `1. **모델명 vs 모델명 핀셋 타격**: 막연한 검색어가 아니라 **이미 살 모델을 정해놓고 마지막 비교를 하는 사람(결제 직전 Bottom-of-Funnel 단계)**만 노립니다.`,
    `2. **쿠팡 24시간 장바구니 쿠키 유도**: 방문자가 *'미개봉 반품특가 재고 확인'* 버튼을 눌러 쿠팡 앱을 한 번만 열면, 그날 저녁에 사는 생필품/식료품 결제액의 3%까지 전부 내 수익으로 잡힙니다.`,
    `3. **질문 스나이핑(지식iN·카페·당근)**: 내 사이트가 검색 1페이지에 오르기 전에도, 오늘 올라온 질문 글에 정확한 계산 수치로 10초 만에 답변을 달아 첫날부터 진성 유입을 만듭니다.`,
    `4. **건당 5만~7.5만 원 초고단가 CPA 연계**: 장기렌트, 인터넷 갈아타기, 포장이사 등 고단가 상담 DB를 직접 수집하여 일 1~2건 승인만으로 월 300만 원+ 수익 궤도에 진입합니다.`,
    ``,
    `---`,
    ``
  ];

  for (let idx = 0; idx < HIGH_INTENT_TARGETS.length; idx++) {
    const item = HIGH_INTENT_TARGETS[idx];
    const encodedQ = encodeURIComponent(item.search_queries[0]);
    const naverJisikinLiveUrl = `https://kin.naver.com/search/list.naver?query=${encodedQ}&sort=date`;
    const naverCafeLiveUrl = `https://search.naver.com/search.naver?where=article&query=${encodedQ}&st=date`;
    const targetUrl = `${currentSiteUrl}/preset/${item.calcSlug}`;

    lines.push(`## 🔥 타겟 #${idx + 1}. ${item.category}`);
    lines.push(`- **공략 타이틀 (모델 1:1 비교)**: **${item.versus_title}**`);
    lines.push(`- **클릭 유도 미끼 버튼 문구**: \`${item.hook_button_copy}\``);
    lines.push(`- **연결 프리셋 URL**: [${targetUrl}](${targetUrl})`);
    lines.push(``);
    lines.push(`### 1) 지금 당장 돈 쓸 사람들이 질문 올린 곳 (실시간 최신글 스나이핑 링크)`);
    lines.push(`- 🎯 [네이버 지식iN 실시간 최신 질문 바로가기 (클릭 시 방금 올라온 질문 열림)](${naverJisikinLiveUrl})`);
    lines.push(`- 🎯 [네이버 카페(맘카페·자취·차량 동호회) 최신 질문 바로가기](${naverCafeLiveUrl})`);
    lines.push(``);
    lines.push(`### 2) 스레드(Threads) · 블라인드 · 단톡방 복붙용 '손해 회피(FOMO) 썰' 원고`);
    lines.push(`\`\`\`text`);
    lines.push(item.story_hook_threads);
    lines.push(targetUrl);
    lines.push(`\`\`\``);
    lines.push(``);
    lines.push(`### 3) 지식iN · 카페 질문글에 10초 만에 복붙할 '전문가 수치 답변'`);
    lines.push(`\`\`\`text`);
    lines.push(item.jisikin_sniper_reply);
    lines.push(`👉 3초 무료 비교 계산기: ${targetUrl}`);
    lines.push(`\`\`\``);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  const outputContent = lines.join('\n');

  // 1. Output to moneyfit-portal root
  const outPath1 = path.join(PROJECT_ROOT, '오늘의_실전마케팅_스나이퍼_키트.md');
  fs.writeFileSync(outPath1, outputContent, 'utf8');
  console.log(`  ✓ Generated sniper kit at: ${outPath1}`);

  // 2. Output to workspace root
  const outPath2 = path.join(PARENT_ROOT, '오늘의_실전마케팅_스나이퍼_키트.md');
  try {
    fs.writeFileSync(outPath2, outputContent, 'utf8');
    console.log(`  ✓ Synced sniper kit to parent workspace: ${outPath2}`);
  } catch (e) {
    console.warn(`  ! Could not write to parent workspace (${e.message}), writing to portal root only.`);
  }

  return { outPath1, outPath2 };
}

if (require.main === module) {
  try {
    generateSniperKit();
    console.log('🎉 Marketing Sniper Engine completed successfully with exit code 0.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Marketing Sniper failed:', err);
    process.exit(1);
  }
}

module.exports = {
  HIGH_INTENT_TARGETS,
  generateSniperKit
};
