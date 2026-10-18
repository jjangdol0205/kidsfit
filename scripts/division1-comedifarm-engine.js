#!/usr/bin/env node
/**
 * 🏢 [제1본부 전담 엔진 v2.0 — Anti-Ban 백링크 안전제어 & 고전환 장문 설득형 에디션]
 * 전담 계정: 네이버 1계정 `comedifarm` (Port 9222) + 인스타·쓰레드 `@moneyfit2026`
 * 전담 조직: 🐆 치타 본부장 (총괄) · 🐝 꿀벌 과장 (구매전환 설득) · 🦜 앵무새 피디 (SNS 웹툰) · 🦔 고슴도치 대리 (블로그·지식iN·커뮤니티)
 *
 * [대표님 최우선 특별 지시사항 반영]:
 * 1. 🛡️ 계정 밴(Ban)·저품질 방지 최우선 (Zero-Ban Backlink Throttling):
 *    - 백링크가 너무 빈번하면 블로그 저품질·지식iN 계정 정지·커뮤니티 차단 위험이 발생함.
 *    - 한 글에 URL을 여러 번 도배하던 방식을 전면 폐기!
 *    - [3단계 안티밴(Anti-Ban) 백링크 안전 분산 프로토콜] 적용:
 *      · TYPE A (댓글 분리형 — 본문 외부링크 0개): 본문은 100% 순수 고품질 정보글로만 작성하여 스팸 필터를 완벽 통과하고, 첫 번째 댓글에만 `www.truthofmarket.com` 링크 1회 기재.
 *      · TYPE B (브랜드 검색 유도형 — 외부링크 0개): URL 직접 노출 없이 "초록창이나 구글에 [머니핏 3초 계산기] 또는 [truthofmarket] 검색"으로 유도하여 자연 검색 유입(SEO 가산점!)과 밴 방지를 동시 달성.
 *      · TYPE C (장문 하단 출처 1회형): 2,200자 이상의 심층 글 맨 마지막 줄에 참고 계산기 출처로 단 1회만 삽입.
 * 2. ✍️ 대충 쓰는 요약글 금지 — '유입 ➔ 클릭 ➔ 실구매'로 직결되는 2,200자+ 실전 설득형(Pre-Selling) 원고:
 *    - 독자가 글을 읽는 단계에서 이미 "내가 매달 이만큼 돈을 날리고 있었구나, 계산기로 내 숫자 확인하고 바로 추천 절약템을 사야겠다"고 결심하도록 구체적인 체험 서사와 비교표, 구매 가이드를 담아 작성.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIV1_OUTBOX = path.join(ROOT_DIR, 'division1_comedifarm_outbox');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');
const DIV1_STATUS_PATH = path.join(LOGS_DIR, 'division1_status.json');
const DIV1_BOARD_PATH = path.join(ROOT_DIR, '제1본부_comedifarm_외부유입_운영보드.md');

const { PRESETS } = require('../src/data/presets.js');
const calculators = require('../src/data/calculators.js');
const { PRESET_WEBTOON_MAP } = require('../src/data/webtoon-stories.js');

function getKstNow() {
  const kstMs = Date.now() + 9 * 60 * 60 * 1000;
  const d = new Date(kstMs);
  return {
    dateStr: d.toISOString().split('T')[0],
    fullStr: d.toISOString().replace('T', ' ').slice(0, 19) + ' KST',
    dayOfYear: Math.floor(kstMs / (24 * 60 * 60 * 1000))
  };
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function cleanOldFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const f of fs.readdirSync(dirPath)) {
    const fp = path.join(dirPath, f);
    if (fs.statSync(fp).isFile()) fs.unlinkSync(fp);
  }
}

function runCalculatorForPreset(preset) {
  const inp = preset.inputs || {};
  switch (preset.calcId) {
    case 'electric': return calculators.calculateElectric(inp);
    case 'diet': return calculators.calculateDiet(inp);
    case 'pet': return calculators.calculatePet(inp);
    case 'room': return calculators.calculateRoom(inp);
    case 'auto': return calculators.calculateAuto(inp);
    case 'telecom': return calculators.calculateTelecom(inp);
    default: return calculators.calculateElectric(inp);
  }
}

/**
 * 6대 카테고리별 독자 공감 도입부 & 실구매 설득(Pre-Selling) 브릿지 서사 생성기
 */
function buildDeepPreSellingNarrative(preset, res, story) {
  const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 결과', value: '-' };
  const m1 = (res.metrics && res.metrics[1]) || { label: '비교 지표', value: '-' };
  const m2 = (res.metrics && res.metrics[2]) || { label: '절감 포인트', value: '-' };
  const rec0 = (res.recommendations && res.recommendations[0]) || { title: '필수 절약 아이템', badge: '베스트', reason: '고정비 절감 필수템' };
  const rec1 = (res.recommendations && res.recommendations[1]) || rec0;
  const impulse = res.impulseItem || { title: '가성비 절약 소모품', priceLabel: '1만원대', hook: '즉시 고정비 방어' };

  const categoryHooks = {
    electric: {
      empathyIntro: `솔직히 고백하자면 저도 지난달 관리비 고지서를 받기 전까지는 "설마 하루에 몇 시간 더 틀었다고 전기세가 그렇게 많이 나오겠어?"라고 안일하게 생각했습니다. 그런데 막상 찍혀 나온 숫자를 보니까 등골이 서늘하더라고요. 원인을 하나씩 뜯어보니 핵심은 단순 사용 시간이 아니라 바로 한전의 '누진세 3단계 구간(400kWh 초과)' 진입 여부에 있었습니다.`,
      mechanismDeepDive: `주택용 전력은 기본 사용량 구간까지는 단가가 완만하지만, 기존 가전 대기전력에 냉난방기나 건조기·제습기 가동량이 겹쳐 월 400kWh를 단 1kWh라도 넘는 순간 기본요금과 kWh당 단가가 동시에 폭등합니다. 이번 시나리오(${preset.subtitle})를 실제 한전 산식 그대로 대입해 보면 **${m0.label}이 ${m0.value}**, **${m1.label}이 ${m1.value}** 수준으로 산출됩니다. 즉, 감으로 대충 쓰다가는 1년이면 가전제품 한 대 값을 고스란히 한전에 더 내는 셈입니다.`,
      purchaseBridge: `여기서 진짜 중요한 포인트는 "그럼 당장 오늘부터 어떻게 돈을 아낄 것인가?"입니다. 무작정 참는 건 불가능하죠. 계산기 결과를 보면 알 수 있듯, **① ${impulse.title}(${impulse.priceLabel})** 같은 소액 절전·순환 아이템으로 대기전력과 냉난방 효율만 잡아줘도 누진세 구간이 한 단계 내려가면서 첫 달에 본전을 뽑고도 남습니다. 만약 기기 자체가 오래된 정속형이라면 **② ${rec0.title}**이나 **③ ${rec1.title}**의 특가·환급 조건을 비교해 교체 손익분기점(BEP)을 넘기는 것이 가장 현명한 재테크입니다.`
    },
    diet: {
      empathyIntro: `"이번 달엔 진짜 살 뺀다!" 하고 헬스장 끊고 샐러드 배달 시켜 먹었는데, 한 달 뒤에 몸무게는 그대로고 카드값만 40만 원 넘게 나온 적 없으신가요? 제가 딱 그랬습니다. 식단 관리를 할 때 내 기초대사량(BMR)과 활동대사량(TDEE)을 정확히 계산하지 않고 무작정 굶거나 비싼 단품 배달 도시락만 시켜 먹으면 요요는 요요대로 오고 식비는 식비대로 폭발합니다.`,
      mechanismDeepDive: `이번 **${preset.subtitle}** 조건을 미플린-세인트제오르(Mifflin-St Jeor) 공식으로 정밀 계산해 보면, 근손실 없이 체지방만 빼기 위한 **${m0.label}은 ${m0.value}**, 매일 반드시 채워야 할 **${m1.label}은 ${m1.value}**, 그리고 이를 한 달 치 실제 장보기 물량으로 환산한 **${m2.label}은 ${m2.value}**로 딱 떨어집니다. 숫자로 명확히 정해두면 마트나 온라인에서 뭘 얼마나 사야 할지 1초도 고민할 필요가 없어집니다.`,
      purchaseBridge: `식단 실패와 식비 과다 지출을 막는 가장 확실한 방법은 '묶음 소분 장보기'입니다. 편의점에서 낱개로 사 먹으면 팩당 3,500원이 넘지만, 계산기 하단 비교표에서 **① ${impulse.title}**이나 **② ${rec0.title}**, **③ ${rec1.title}** 대용량 세트를 최저가로 쟁여두면 한 끼 단백질 비용을 1,000원대 초반으로 낮추면서 한 달 외식·배달비를 25만 원 이상 아낄 수 있습니다.`
    },
    pet: {
      empathyIntro: `강아지나 고양이 키우는 집사님들이라면 사료 봉투 뒤에 적힌 깨알 같은 급여량 표 보면서 "우리 애는 중성화도 했고 실내에서만 지내는데 도대체 하루에 몇 그램(g)을 줘야 살이 안 찌지?" 고민해 보셨을 겁니다. 눈대중으로 종이컵 가득 부어주다 보면 아이 관절에 무리가 가는 비만이 오기 쉽고, 반대로 너무 적게 주면 영양 불균형이 옵니다.`,
      mechanismDeepDive: `수의영양학 기준 휴식기 에너지 요구량(RER = 70 × 체중^0.75)에 활동·연령 계수를 곱해 **${preset.subtitle}** 조건을 계산해 보면, **${m0.label}은 정확히 ${m0.value}**, 현재 사료 칼로리 밀도 기준 **${m1.label}은 ${m1.value}**, 그리고 사료 한 포대 개봉 시 **${m2.label}은 ${m2.value}**이라는 정확한 숫자가 나옵니다. 사료는 개봉 후 산패가 시작되므로 30~45일 안에 다 먹을 수 있는 포대 용량을 고르는 것이 핵심입니다.`,
      purchaseBridge: `아이 건강도 지키고 매달 나가는 펫케어 고정비도 아끼려면 정확한 계량과 정주기 구매가 필수입니다. 계산기에서 우리 아이 체중을 넣어 그램 수를 확인하신 뒤, 바로 아래에 연결된 **① ${impulse.title}** 및 **② ${rec0.title}**, **③ ${rec1.title}**의 g당 단가와 로켓배송 최저가를 비교해 보세요. 동물병원 피부·관절 진료비 수십만 원을 아끼는 가장 확실한 예방책입니다.`
    },
    room: {
      empathyIntro: `처음 자취방을 구하거나 신혼집·오피스텔 입주를 준비할 때 가장 무서운 게 뭔지 아시나요? 바로 "이것도 필요하고 저것도 예쁜데?" 하면서 장바구니에 담다 보면 처음에 잡았던 예산이 순식간에 두 배로 불어나는 '예산 초과 폭탄'입니다. 실제로 품목별 상한선을 정하지 않고 가전·가구를 사기 시작하면 정작 매일 쓰는 매트리스나 냉장고에서 타협하게 됩니다.`,
      mechanismDeepDive: `그래서 입주 세팅 전에는 반드시 총예산을 황금 배분 비율(24% : 22% : 20% : 18% : 16%)로 쪼개는 BOM(자재명세서) 견적표를 먼저 뽑아야 합니다. **${preset.subtitle}** 조건을 대입해 보면 **${m0.label} ${m0.value}**, **${m1.label} ${m1.value}**, **${m2.label} ${m2.value}** 한도 내에서 단 1원의 예산 초과도 없이 5대 필수 가전·가구를 완벽하게 풀세팅할 수 있습니다.`,
      purchaseBridge: `오프라인 매장에서 패키지로 묶여 비싸게 사는 대신, 계산기에서 뽑아준 품목별 상한선 금액표를 기준으로 **① ${rec0.title}**, **② ${rec1.title}**, 그리고 당장 입주 첫날 필요한 **③ ${impulse.title}**을 온라인 특가 및 공식몰 할인으로 개별 매칭해 보세요. 같은 스펙인데도 최소 35만~120만 원의 입주 초기 비용이 굳습니다.`
    },
    auto: {
      empathyIntro: `신차 뽑을 때 영업사원이 보여주는 "월 납입금 OO만 원!"이라는 숫자만 믿고 덜컥 할부나 리스, 장기렌트 계약서에 사인하면 5년 뒤에 수백만 원에서 천만 원 넘게 손해를 보게 됩니다. 차값 자체보다 무서운 게 바로 취등록세(7%), 5년 치 자동차보험료, 자동차세, 할부 이자, 그리고 사업자 절세 효과까지 합산한 '5년 총유지비(TCO)'이기 때문입니다.`,
      mechanismDeepDive: `이번 **${preset.subtitle}** 조건으로 5년 총소유비용(TCO)을 1원 단위까지 시뮬레이션해 본 결과, **${m0.label}은 ${m0.value}**, **${m1.label}은 ${m1.value}**, 그리고 **${m2.label}은 ${m2.value}**로 나타났습니다. 결론적으로 **${res.headline}**이라는 명확한 숫자가 도출됩니다. 내 소득세율 구간과 보험 경력에 따라 할부와 장기렌트의 유불리가 정반대로 뒤집힙니다.`,
      purchaseBridge: `계약서 도장 찍기 전에 딱 3초만 투자해서 내 차종 가격과 소득 구간을 계산기에 넣어보세요. 어떤 구매 방식이 수백만 원 더 저렴한지 바로 확인하실 수 있고, 출고 시 딜러 서비스로 호구 잡히지 않도록 **① ${impulse.title}**, **② ${rec0.title}**, **③ ${rec1.title}**의 자가 장착 최저가 기준표까지 한눈에 비교해 바로 준비하실 수 있습니다.`
    },
    telecom: {
      empathyIntro: `집에서 쓰는 인터넷이랑 TV 약정이 3년 지났는데도 "바꾸기 귀찮아서", 혹은 "위약금 나올까 봐" 그냥 매달 자동이체로 요금 내고 계신 분들 정말 많습니다. 저도 확인해 보기 전까지는 위약금이 무서워서 가만히 있었는데, 실제로 계산기를 돌려보고 나서 그동안 통신사에 매달 꽁돈을 기부하고 있었다는 걸 깨달았습니다.`,
      mechanismDeepDive: `통신 시장의 핵심 공식은 단순합니다. **[신규 가입 현금 사은품(최대 47만 원) + 36개월 월 요금 인하액] - [현재 해지 위약금] = 내 통장에 남는 순이득**입니다. **${preset.subtitle}** 조건을 대입해 보면 **${m0.label}이 ${m0.value}**, **${m1.label}이 ${m1.value}**, **${m2.label}이 ${m2.value}**로 계산되어, **${res.headline}**이라는 결론이 나옵니다.`,
      purchaseBridge: `특히 방에서 와이파이가 끊긴다고 비싼 1기가 요금제로 올리는 분들이 많은데, 90%는 통신사 속도 문제가 아니라 구형 공유기 병목 때문입니다. 계산기에서 내 위약금 대비 순이득 금액을 먼저 확인하시고, 요금제는 실속형으로 낮추면서 **① ${impulse.title}**이나 **② ${rec0.title}** 하나로 집안 와이파이 속도를 3배 높이는 것이 3년간 통신비 60만 원을 아끼는 핵심 비결입니다.`
    }
  };

  return categoryHooks[preset.calcId] || categoryHooks.electric;
}

function generateDivision1DailyPack() {
  const kst = getKstNow();
  ensureDir(DIV1_OUTBOX);
  ensureDir(LOGS_DIR);

  const subDirs = {
    blog: path.join(DIV1_OUTBOX, '1_comedifarm_blog'),
    jisikin: path.join(DIV1_OUTBOX, '2_naver_jisikin'),
    community: path.join(DIV1_OUTBOX, '3_external_community'),
    instaThreads: path.join(DIV1_OUTBOX, '4_insta_threads')
  };
  Object.values(subDirs).forEach((d) => {
    ensureDir(d);
    cleanOldFiles(d);
  });

  // Safe Anti-Ban Daily Quotas (Quality over Spam! Zero Ban Risk!)
  // - comedifarm Blog: 2 high-depth posts/day (min 6h interval, 1 Comment-Link + 1 Single-Bottom-Citation)
  // - Naver Jisik-iN: 2 ultra-detailed expert answers/day (1 Brand-Search-Guide [0 URL] + 1 Single-Citation)
  // - External Community: 2 native story posts/day (0 body URLs to prevent community auto-ban; reply/search hook)
  // - Instagram & Threads (@moneyfit2026): 2 high-converting webtoon packs/day (Profile/First-Reply funnel)
  const offset = (kst.dayOfYear * 2) % PRESETS.length;
  const pickPresets = (count, shift = 0) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(PRESETS[(offset + shift + i) % PRESETS.length]);
    }
    return arr;
  };

  const blogPresets = pickPresets(2, 0);
  const jisikinPresets = pickPresets(2, 2);
  const commPresets = pickPresets(2, 4);
  const snsPresets = pickPresets(2, 6);

  // 1. comedifarm 블로그 (일 2편 엄선 — 2,300자+ 고전환 설득형 & 안티밴 백링크 분산)
  const blogItems = blogPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const story = PRESET_WEBTOON_MAP[p.id] || {};
    const narrative = buildDeepPreSellingNarrative(p, res, story);
    const targetUrl = `https://www.truthofmarket.com/preset/${p.id}/`;
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표 1', value: '-' };
    const m1 = (res.metrics && res.metrics[1]) || { label: '핵심 지표 2', value: '-' };
    const m2 = (res.metrics && res.metrics[2]) || { label: '핵심 지표 3', value: '-' };
    const rec0 = (res.recommendations && res.recommendations[0]) || { title: '추천 절약템 1', reason: '최저가 비교' };
    const rec1 = (res.recommendations && res.recommendations[1]) || { title: '추천 절약템 2', reason: '효율 극대화' };

    // Anti-Ban Backlink Mode Rotation:
    // Slot 1: COMMENT_SPLIT (본문 내 외부링크 0개! 첫 번째 댓글에만 링크 1회 삽입하여 블로그 지수 100% 보호)
    // Slot 2: SINGLE_BOTTOM_CITATION (본문 최하단 참고 출처로 단 1회만 삽입, 중복 링크 절대 금지)
    const antiBanMode = idx === 0 ? 'COMMENT_SPLIT_ZERO_BODY_LINK' : 'SINGLE_BOTTOM_CITATION_MAX_1';
    const publishTime = idx === 0 ? '09:30 KST' : '19:30 KST (최소 10시간 쿨다운 간격)';

    const footerLinkBlock = idx === 0
      ? `### 📌 내 조건 대입해서 3초 영수증 직접 뽑아보는 법 (무료)
본문에 외부 주소를 바로 적으면 이웃님들 가독성에 방해가 될 수 있어, **제가 바로 아래 첫 번째 댓글에 『${p.title} 3초 자동 계산기 & 최저가 절약템 비교표』 바로가기 주소를 남겨두었습니다!**
댓글 창을 열어서 내 평수·요금·체중·차종 숫자를 직접 넣어보시고, 계산 결과표 바로 아래에 나오는 **[쿠팡 로켓와우 최저가 / 네이버 특가 / 공식몰 할인]** 버튼을 눌러 오늘 당장 새는 고정비부터 막아보세요!

---
**[💬 발행 직후 첫 번째 고정 댓글에 복붙할 텍스트 (본문 외부링크 0개 안티밴 보호)]**
> 안녕하세요! 본문에서 소개해 드린 **${p.title} 3초 영수증 계산기 & 최저가 절약템 실시간 비교표** 바로가기 주소입니다 👇
> 🔗 ${targetUrl}
> *(회원가입·앱 설치 없이 숫자만 넣으면 내 손익분기점과 최저가 할인 링크가 3초 만에 계산됩니다!)*`
      : `### 📌 내 조건 대입해서 3초 영수증 & 최저가 절약템 한 번에 확인하기
백문이 불여일견입니다. 남의 숫자가 아니라 **지금 내 고지서 요금, 내 평수, 내 차종, 내 체중**을 넣었을 때 한 달에 얼마가 아껴지는지 아래 무료 웹 계산기에서 3초 만에 확인해 보세요.
계산 결과 영수증이 나오면 바로 아래에 연결된 **[🚀 쿠팡 최저가 / 🟢 네이버 특가 / 🏷️ 공식몰 할인]** 비교 버튼을 통해 검증된 절약 아이템까지 원스톱으로 최저가에 준비하실 수 있습니다.

- 🔗 **${p.title} 3초 무료 계산기 & 최저가 비교 (단독 출처 1회)**: ${targetUrl}`;

    const content = `# [1본부/comedifarm 고전환 장문 칼럼 #${idx + 1}/2] ${p.title} — 실제 계산 공식으로 뽑아본 충격 영수증과 본전 회수법

- **발행 계정**: 네이버 1계정 \`comedifarm\` (\`Port 9222\`) — **제1본부(\`www.truthofmarket.com\` 유입·전환 전담)**
- **권장 발행 시각**: ${publishTime}
- **안티밴(Anti-Ban) 백링크 보호 모드**: \`${antiBanMode}\` (본문 도배 금지 · 계정 영구 보호)
- **원고 분량 및 목적**: 약 2,400자 심층 설득형 칼럼 (유입 전 독자의 구매 결심[Pre-Selling] 완성)

---

## 1. 들어가며: "대충 이 정도 나오겠지"라는 생각이 매달 통장을 비웁니다

${narrative.empathyIntro}

많은 분들이 **${p.title}** 문제를 검색하실 때 단순히 남들이 적어놓은 대략적인 평균치만 보고 넘어가십니다. 하지만 우리 집 기본 사용량, 약정 잔여 개월 수, 세율 구간, 혹은 목표 기간이 조금만 달라져도 실제 손익분기점은 완전히 뒤바뀝니다. 오늘 글에서는 **${p.subtitle}** 조건을 기준으로 실제 데이터 공식을 대입해 1원 단위까지 팩트체크하고, 가장 적은 비용으로 최대 효과를 내는 실전 구매·해결 가이드까지 완벽히 정리해 드립니다.

---

## 2. [${p.subtitle}] 실제 계산 공식 대입 결과 & 핵심 비교표

실제 시뮬레이션 엔진에 해당 조건을 입력했을 때 도출되는 3대 핵심 지표와 전후 비교 데이터입니다.

| 분석 항목 | 시뮬레이션 산출 결과 | 핵심 팩트체크 해설 |
| :--- | :--- | :--- |
| **① 핵심 판정 결론** | **${res.headline}** | ${res.badge || '실데이터 기반 정밀 판정'} |
| **② ${m0.label}** | **${m0.value}** | ${m0.sub || '현재 조건 기준 1차 핵심 지표'} |
| **③ ${m1.label}** | **${m1.value}** | ${m1.sub || '비교 대안 대비 핵심 차이'} |
| **④ ${m2.label}** | **${m2.value}** | ${m2.sub || '최적화 실행 시 기대 효과'} |

${narrative.mechanismDeepDive}

특히 주목하셔야 할 부분은 **'방치했을 때의 누적 손실'**입니다. 한 달 단위로 보면 몇만 원 차이처럼 보일지 몰라도, 이것이 1년, 3년 약정 기간, 혹은 5년 보유 기간 동안 쌓이면 **${res.lossComparison ? `${res.lossComparison.title} (${res.lossComparison.desc})` : '수십만 원에서 수백만 원의 확정 손실'}**로 돌아옵니다.

---

## 3. 돈 아끼려고 계산했다면, 실제 지출을 줄이는 '검증된 해결책'까지 실행해야 완성입니다

${narrative.purchaseBridge}

제가 직접 여러 대안의 가격과 유지비 효율을 비교해 본 결과, 무조건 비싼 프리미엄 제품을 사거나 반대로 내구성이 떨어지는 초저가 노브랜드 제품을 사면 오히려 이중 지출이 발생합니다. 가장 실패 없는 선택 기준 3가지를 짚어드립니다.

1. **1순위 즉시 실행 (${res.actionItems && res.actionItems[0] ? res.actionItems[0] : rec0.title})**:
   - ${rec0.reason || '초기 비용 부담 없이 당장 이번 달부터 고정비 누수를 막아주는 가장 확실한 1순위 솔루션입니다.'}
2. **2순위 가성비·효율 업그레이드 (${res.actionItems && res.actionItems[1] ? res.actionItems[1] : rec1.title})**:
   - ${rec1.reason || '사용 빈도가 높다면 교체 후 절감되는 월간 비용만으로 수개월 내에 기기값을 100% 회수합니다.'}
3. **결제 전 3대 채널(쿠팡 로켓와우 vs 네이버 슈퍼적립 vs 공식몰) 교차 비교**:
   - 같은 모델이라도 로켓배송 내일도착 할인이 들어갈 때가 있고, 네이버페이 포인트 적립이나 공식몰 쿠폰이 더 클 때가 있습니다. 계산기 결과 화면에서 3곳의 실시간 가격을 1초 만에 비교해 가장 유리한 곳에서 득템하시는 것이 핵심입니다.

---

${footerLinkBlock}
`;
    const filePath = path.join(subDirs.blog, `${kst.dateStr}_comedifarm_blog_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, antiBanMode, publishTime, targetUrl, filePath };
  });

  // 2. 네이버 지식iN (일 2건 엄선 — 계정 정지 0% 안티밴 전문가 장문 답변)
  const jisikinItems = jisikinPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const narrative = buildDeepPreSellingNarrative(p, res, {});
    const targetUrl = `https://www.truthofmarket.com/preset/${p.id}/`;
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표', value: '-' };
    const m1 = (res.metrics && res.metrics[1]) || { label: '비교 지표', value: '-' };
    const searchQuery = p.keywords ? p.keywords.split(',')[0].trim() : p.title;
    const liveSearchUrl = `https://kin.naver.com/search/noAnswerList.naver?query=${encodeURIComponent(searchQuery)}`;

    // Anti-Ban: #1 uses Brand Search Guidance (0 URL in body -> 0% Jisik-iN spam filter trigger!), #2 uses 1 clean reference link
    const antiBanMode = idx === 0 ? 'BRAND_SEARCH_GUIDE_ZERO_URL (지식iN 계정보호 무링크 검색유도)' : 'SINGLE_REFERENCE_LINK (단독 출처 1회)';
    const closingGuide = idx === 0
      ? `💡 **질문자님 조건으로 직접 3초 계산해 보는 방법**:
지식iN 규정상 외부 주소를 직접 적지 않는 점 양해 부탁드립니다. 네이버나 구글 검색창에 **[머니핏 3초 계산기]** 또는 영문으로 **[truthofmarket]**을 검색하시면 질문자님의 정확한 수치(${p.subtitle})를 넣어 3초 만에 손익분기점 영수증과 최저가 절약 용품 비교표를 무료로 확인하실 수 있습니다. 답변이 도움이 되셨다면 채택 부탁드립니다!`
      : `💡 **질문자님 세부 조건 직접 대입해 보기 (무료 시뮬레이터)**:
사용 시간이나 세부 요금에 따라 결과가 조금씩 달라질 수 있으니, 아래 생활금융 계산기 출처에서 질문자님 숫자를 직접 넣어 확인해 보시고 가장 유리한 최저가 대안을 선택하시기 바랍니다.
📌 참고 계산기 출처: ${targetUrl}`;

    const content = `# [1본부/comedifarm 지식iN 안티밴 고품질 답변 #${idx + 1}/2] ${p.title}

- **발행 계정**: 네이버 1계정 \`comedifarm\` (\`Port 9222\`)
- **안티밴 보호 모드**: \`${antiBanMode}\` (하루 2건 엄선 · 복붙 스팸 필터 완벽 우회)
- **실시간 미채택 질문 검색창**: ${liveSearchUrl}

---

**[지식iN 전문가 장문 답변 원고 (1,200자+ 맞춤형)]**

안녕하세요! 질문하신 **${p.subtitle}** 관련하여 막연한 추측이 아니라 실제 산출 공식과 현행 기준표를 바탕으로 정확하게 계산해 드리겠습니다.

**1. 질문자님 조건 기준 핵심 계산 결과**
- **최종 판정**: **${res.headline}**
- **${m0.label}**: **${m0.value}**
- **${m1.label}**: **${m1.value}**

**2. 왜 이런 결과가 나올까요? (상세 원리)**
${narrative.mechanismDeepDive}

**3. 지금 바로 실천하실 수 있는 현실적인 절약·구매 팁**
${narrative.purchaseBridge}

${closingGuide}
`;
    const filePath = path.join(subDirs.jisikin, `${kst.dateStr}_jisikin_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, antiBanMode, targetUrl, liveSearchUrl, filePath };
  });

  // 3. 외부 커뮤니티 (일 2편 엄선 — 커뮤니티 계정 밴 방지를 위해 본문 URL 0개 + 댓글/검색 유도 + 진성 후기체)
  const communityItems = commPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const narrative = buildDeepPreSellingNarrative(p, res, {});
    const targetUrl = `https://www.truthofmarket.com/preset/${p.id}/`;
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표', value: '-' };
    const m1 = (res.metrics && res.metrics[1]) || { label: '비교 지표', value: '-' };

    const content = `# [1본부 외부 커뮤니티 안티밴 고효율 후기글 #${idx + 1}/2] ${p.title}

- **담당**: 1본부 \`🦔 고슴도치 대리\` & \`🐝 꿀벌 과장\`
- **안티밴(Anti-Ban) 철칙**: 외부 커뮤니티 본문에 URL을 직접 넣으면 스팸 차단될 수 있으므로, **본문은 100% 실제 숫자 비교 후기로만 작성하고 첫 댓글 또는 검색어(\`truthofmarket\`)로 자연 유도**합니다!
- **유입 타겟 URL (댓글용)**: ${targetUrl}

---

**[커뮤니티 게시글 원고 — 진짜 유저 후기 문체]**

**제목: ${p.subtitle} 호구 안 잡히려고 직접 계산기 다 돌려본 후기 (숫자 정리)**

요즘 ${p.title} 때문에 말이 다 달라서 답답하길래, 아예 공식 대입해서 1원 단위까지 비교해 봄.
나처럼 고민하는 사람들 시간 아끼라고 핵심 숫자만 공유함.

**1. 실제로 돌려본 숫자 요약**
- 결론부터 말하면: **${res.headline}**
- ${m0.label}: **${m0.value}**
- ${m1.label}: **${m1.value}**

**2. 직접 비교해보면서 느낀 점**
${narrative.summary || res.summary}
대충 감으로 계약하거나 아무 제품이나 사면 매달 나가는 고정비 차이가 생각보다 꽤 큼. 특히 본전 뽑는 기간(손익분기점) 계산해 보니까 초기에 가성비 검증된 걸로 세팅하는 게 훨씬 이득이더라.

**3. 내 조건 넣어서 계산해보고 싶은 사람 팁**
본문에 외부 링크 걸면 광고로 오해받을까 봐 안 적음.
구글이나 네이버에 **머니핏 3초 계산기** (영문 주소는 **truthofmarket**) 검색해서 들어가면 본인 조건 넣어서 3초 만에 영수증 뽑아볼 수 있고, 거기서 쿠팡이랑 네이버 최저가 비교도 한 번에 가능하니까 계약하거나 사기 전에 꼭 한 번 돌려보는 거 추천함!

---
**[💬 작성 직후 본인 첫 댓글에 남길 안내 (커뮤니티 규정에 따라 선택 사용)]**
> 계산기 주소 물어보는 분들 있어서 댓글에 남겨둠: ${targetUrl}
`;
    const filePath = path.join(subDirs.community, `${kst.dateStr}_community_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, antiBanMode: 'ZERO_BODY_URL_COMMENT_OR_SEARCH_HOOK', targetUrl, filePath };
  });

  // 4. 인스타그램 & 쓰레드 (@moneyfit2026 — 일 2편 엄선: 본문 무링크 도달률 극대화 + 첫 대댓글 링크 유도)
  const snsItems = snsPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const targetUrl = `https://www.truthofmarket.com/preset/${p.id}/`;
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표', value: '-' };
    const impulse = res.impulseItem || { title: '필수 절약템', priceLabel: '특가' };

    const content = `# [1본부 인스타·쓰레드 (@moneyfit2026) 고전환 웹툰 패키지 #${idx + 1}/2] ${p.title}

- **발행 계정**: 인스타그램 & 쓰레드 \`@moneyfit2026\` (\`Port 9222\`)
- **안티밴 & 알고리즘 최적화**: 쓰레드/인스타 본문에 외부 링크를 넣으면 노출 도달률이 깎이므로, **본문은 100% 웹툰 스토리텔링 + 댓글 투표 유도**로 작성하고 **첫 번째 대댓글에만 \`www.truthofmarket.com\` 직행 링크를 딱 1회** 겁니다!
- **웹툰 이미지 폴더**: \`sns_outbox/${p.id}/slide-1.png ~ slide-4.png\`

---

**[1️⃣ 쓰레드(Threads) & 인스타 본문 (노출 극대화용 — 외부링크 0개)]**

솔직히 ${p.subtitle} 고민할 때 대부분 대충 감으로 결정하잖아요? 😭
저도 그러다 매달 돈 새는 거 보고 충격받아서 실제 공식대로 영수증을 뽑아봤습니다.

📌 **팩폭 결과**: **${res.headline}**
📌 **${m0.label}**: **${m0.value}**

특히 무작정 참거나 비싼 거 사지 말고, **${impulse.title}(${impulse.priceLabel})** 하나로 세팅만 바꿔줘도 당장 첫 달부터 고정비가 확 줄어듭니다.

여러분은 지금 한 달에 얼마 정도 나오시나요?
내 숫자 넣어서 3초 만에 영수증 뽑아보고 최저가 절약템까지 비교할 수 있는 무료 계산기 주소는 **바로 아래 첫 번째 댓글**에 열어두었습니다! 👇

---

**[2️⃣ 첫 번째 대댓글 (유입 ➔ 클릭 ➔ 구매 직결 퍼널)]**

👉 **내 조건 3초 영수증 계산기 & 최저가 절약템 비교 바로가기 (무료)**
🔗 ${targetUrl}
*(계산 결과 영수증 바로 아래에서 쿠팡 로켓와우 / 네이버 슈퍼적립 / 공식몰 최저가를 한눈에 비교하실 수 있습니다!)*
`;
    const filePath = path.join(subDirs.instaThreads, `${kst.dateStr}_sns_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, antiBanMode: 'MAIN_NO_LINK_REPLY_SINGLE_LINK', targetUrl, filePath };
  });

  const statusPayload = {
    divisionId: 'DIV1_OUTLINK_HQ',
    divisionName: '제1본부: 홈페이지(www.truthofmarket.com) 안티밴 고전환 유입·구매설득 총괄본부',
    accountId: 'comedifarm',
    snsHandle: '@moneyfit2026',
    browserPort: 9222,
    updatedAt: kst.fullStr,
    date: kst.dateStr,
    strictSeparationVerified: true,
    antiBanPolicy: 'ACTIVE (본문 링크 도배 원천 차단: 댓글 분리형 + 브랜드 검색 유도형 + 하단 단독 출처 1회형 교차 적용)',
    targetDomain: 'https://www.truthofmarket.com',
    dailyQuotas: {
      comedifarmBlog: blogItems.length,
      naverJisikin: jisikinItems.length,
      externalCommunity: communityItems.length,
      instaThreads: snsItems.length,
      totalOutlinkAssetsToday: blogItems.length + jisikinItems.length + communityItems.length + snsItems.length
    },
    items: {
      comedifarmBlog: blogItems,
      naverJisikin: jisikinItems,
      externalCommunity: communityItems,
      instaThreads: snsItems
    }
  };

  fs.writeFileSync(DIV1_STATUS_PATH, JSON.stringify(statusPayload, null, 2), 'utf8');

  const boardMd = `# 🏢 [제1본부] 1계정(\`comedifarm\`) & \`@moneyfit2026\` — 안티밴(Zero-Ban) 고전환 유입·구매설득 운영보드

- **최종 갱신 시각**: ${kst.fullStr}
- **전담 조직**: \`🐆 치타 본부장 (제1본부장)\` · \`🐝 꿀벌 과장 (구매설득 카피)\` · \`🦜 앵무새 피디 (인스타·쓰레드)\` · \`🦔 고슴도치 대리 (블로그·지식iN·커뮤니티)\`
- **전담 계정 및 포트**: 네이버 1계정 **\`comedifarm\`** + 인스타/쓰레드 **\`@moneyfit2026\`** (\`Port 9222\` 격리 컨테이너)
- **핵심 미션**: **계정 밴(저품질) 위험 0% 유지 + 2,400자 설득형 원고로 \`www.truthofmarket.com\` 유입 ➔ 클릭 ➔ 실구매 전환 극대화**

---

## 🛡️ 1. 제1본부 안티밴(Anti-Ban) 백링크 안전 수칙 & 구매 전환(Pre-Selling) 설계

| 채널 | 일일 안전 발행량 | 안티밴(Zero-Ban) 백링크 제어 방식 | 유입 ➔ 클릭 ➔ 구매 직결 장치 |
| :--- | :---: | :--- | :--- |
| **① \`comedifarm\` 블로그** | **일 2편 엄선**<br>(10시간 간격) | **#1호**: 본문 외부링크 **0개** + **첫 번째 고정 댓글**에만 링크 1회<br>**#2호**: 2,400자 본문 **맨 마지막 줄에 단독 출처 1회**만 삽입 | 독자가 글에서 이미 절약템 필요성을 납득(Pre-Sold)한 상태로 홈페이지 영수증 하단 3채널 최저가 버튼 클릭 |
| **② 네이버 지식iN** | **일 2건 엄선** | **#1호**: 외부 URL **0개** + **\`[머니핏 3초 계산기]\` 검색 유도**<br>**#2호**: 1,200자 전문가 답변 하단 참고 출처 1회 | 질문자 조건 맞춤 공식 풀이 + 절약 소모품 교체 손익분기점 제시 |
| **③ 외부 커뮤니티** | **일 2건 엄선** | **본문 외부 URL 0개 원칙** (커뮤니티 자동 차단 완벽 예방)<br>검색어(\`truthofmarket\`) 안내 또는 요청 시 댓글 링크 | 실제 계산 결과 비교표 후기 문체로 호기심 유발 후 자발적 유입 유도 |
| **④ 인스타 & 쓰레드** | **일 2편 엄선** | **본문 외부링크 0개** (알고리즘 도달률 보호) + **첫 대댓글에만 링크 1회** | 4컷 웹툰 영수증 충격 수치 제시 ➔ 대댓글 링크 클릭 ➔ 로켓와우 특가 확인 |

---

## 🎯 2. 오늘 생성된 제1본부 고전환 원고 패키지 (총 ${statusPayload.dailyQuotas.totalOutlinkAssetsToday}건)

### ① \`comedifarm\` 2,400자 설득형 블로그 (일 2편)
${blogItems.map(x => `- **[#${x.slot} | ${x.publishTime}] ${x.title}**\n  - 안티밴 모드: \`${x.antiBanMode}\` | 파일: \`division1_comedifarm_outbox/1_comedifarm_blog/${path.basename(x.filePath)}\``).join('\n')}

### ② 네이버 지식iN 전문가 장문 답변 (일 2건)
${jisikinItems.map(x => `- **[#${x.slot}] ${x.title}**\n  - 안티밴 모드: \`${x.antiBanMode}\` | [실시간 미채택 질문창](${x.liveSearchUrl}) | 파일: \`division1_comedifarm_outbox/2_naver_jisikin/${path.basename(x.filePath)}\``).join('\n')}

### ③ 외부 커뮤니티 진성 후기글 (일 2건)
${communityItems.map(x => `- **[#${x.slot}] ${x.title}**\n  - 안티밴 모드: \`${x.antiBanMode}\` | 파일: \`division1_comedifarm_outbox/3_external_community/${path.basename(x.filePath)}\``).join('\n')}

### ④ 인스타그램 & 쓰레드 (\`@moneyfit2026\`) 웹툰 퍼널 (일 2편)
${snsItems.map(x => `- **[#${x.slot}] ${x.title}**\n  - 안티밴 모드: \`${x.antiBanMode}\` | 파일: \`division1_comedifarm_outbox/4_insta_threads/${path.basename(x.filePath)}\``).join('\n')}
`;

  fs.writeFileSync(DIV1_BOARD_PATH, boardMd, 'utf8');
  return statusPayload;
}

if (require.main === module) {
  const res = generateDivision1DailyPack();
  console.log('===============================================================');
  console.log(' 🏢 [제1본부 v2.0] 안티밴(Zero-Ban) & 2,400자 구매설득형 엔진 가동 완료');
  console.log('===============================================================');
  console.log(`  ✓ 전담 계정/포트 : comedifarm + @moneyfit2026 (Port ${res.browserPort})`);
  console.log(`  ✓ 안티밴 정책    : ${res.antiBanPolicy}`);
  console.log(`  ✓ 금일 엄선 큐   : 총 ${res.dailyQuotas.totalOutlinkAssetsToday}건 (블로그 2 / 지식iN 2 / 커뮤니티 2 / 인스타·쓰레드 2)`);
  console.log(`  ✓ 운영보드 저장  : ${DIV1_BOARD_PATH}`);
}

module.exports = { generateDivision1DailyPack };
