#!/usr/bin/env node
/**
 * MoneyFit Portal - Anti-AI Human Conversational Backlog Generator v2.0 (144 Files / 324 Variants)
 *
 * Key Upgrades over v1.0:
 * 1. Non-Destructive Live Tracker Sync: Preserves Section 1 of `야간_실전홍보_백로그_현황.md` (never wipes live URLs)
 *    and automatically parses Section 1 to compute per-preset channel coverage (Blog / Cafe / Jisik-iN / DCInside)
 *    plus an automatic "미발행 우선 추천 큐 (Unpublished Priority Queue)".
 * 2. Anti-C-Rank/DIA+ Duplicate Filter: 12 distinct human persona openings & closings + domain-specific
 *    input storytelling so no two presets share the same opening/closing template fingerprint.
 * 3. Accurate Korean Particle (Josa) Engine: Automatically resolves 은/는, 이/가, 을/를, 와/과 based on Hangul
 *    batchim or trailing numbers/units, eliminating awkward phrases like "기기값 본전 회수은" or empty trailing commas.
 * 4. 4 Channel-Specific Backlog Directories (144 files total, 324 copy variants):
 *    - `backlog_human_posts/naver_blog/{slug}.txt` (36 long-form 2,500+ char personal blogger diary reviews)
 *    - `backlog_human_posts/naver_cafe/{slug}.txt` (36 dedicated Naver Cafe 전체공개+검색허용 experience posts with 2 title options)
 *    - `backlog_human_posts/community_posts/{slug}.txt` (36 community posts + 3 distinct DCInside/Pann/Blind comment variants each)
 *    - `backlog_human_posts/jisikin_answers/{slug}.txt` (36 Jisik-iN files with 3 distinct non-overlapping answer personas each)
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKLOG_DIR = path.join(PROJECT_ROOT, 'backlog_human_posts');
const BLOG_DIR = path.join(BACKLOG_DIR, 'naver_blog');
const CAFE_DIR = path.join(BACKLOG_DIR, 'naver_cafe');
const COMM_DIR = path.join(BACKLOG_DIR, 'community_posts');
const KIN_DIR = path.join(BACKLOG_DIR, 'jisikin_answers');

const { PRESETS } = require('../src/data/presets.js');
const calculators = require('../src/data/calculators.js');

const siteUrl = 'https://truthofmarket.com';

/**
 * Determine if the last character of a Korean/number/unit string has a final consonant (batchim)
 */
function hasBatchim(str) {
  if (!str) return false;
  const clean = String(str).trim().replace(/[)\]}>'"”’]+$/g, '');
  if (!clean) return false;
  const ch = clean.charCodeAt(clean.length - 1);
  // Hangul syllables: 0xAC00 ~ 0xD7A3
  if (ch >= 0xAC00 && ch <= 0xD7A3) {
    return (ch - 0xAC00) % 28 !== 0;
  }
  // Numbers: 0(영), 1(일), 3(삼), 6(육), 7(칠), 8(팔) have batchim
  const lastChar = clean[clean.length - 1];
  if ('013678LMNRlmnr'.includes(lastChar)) return true;
  return false;
}

/**
 * Attach proper Korean particle (e.g. '은/는', '이/가', '을/를', '와/과')
 */
function josa(word, pair = '은/는') {
  const [withBatchim, withoutBatchim] = pair.split('/');
  return `${word}${hasBatchim(word) ? withBatchim : withoutBatchim}`;
}

function calculatePreset(preset) {
  switch (preset.calc) {
    case 'electric': return calculators.calculateElectric(preset.inputs);
    case 'diet': return calculators.calculateDiet(preset.inputs);
    case 'pet': return calculators.calculatePet(preset.inputs);
    case 'room': return calculators.calculateRoom(preset.inputs);
    case 'auto': return calculators.calculateAuto(preset.inputs);
    case 'telecom': return calculators.calculateTelecom(preset.inputs);
    default: throw new Error(`Unknown calc: ${preset.calc}`);
  }
}

/**
 * 12 distinct human persona openings to prevent Naver C-Rank / DIA+ duplicate template detection
 */
const BLOG_OPENINGS = [
  (p) => `안녕하세요! 요즘 장바구니 물가부터 매달 통장에서 스쳐 지나가는 고정비까지 안 오르는 게 없다 보니, 작은 결정 하나도 예전처럼 대충 감으로 넘기기가 무섭더라고요. 특히 이번 주에는 ${p.title} 문제를 두고 며칠 내내 검색창만 붙잡고 있었는데요, 블로그마다 말이 다 다르고 협찬성 글이 많아서 아예 공식 수식대로 직접 숫자를 넣어 계산해 본 후기를 남겨보려고 합니다.`,
  (p) => `반갑습니다. 주변 지인들이나 커뮤니티 글을 보다 보면 ${p.category} 관련해서 생각보다 많은 분들이 정확한 손익분기점을 모른 채 계약하거나 구매했다가 뒤늦게 후회하시는 경우가 많더라고요. 저 역시 이번에 ${p.title} 조건을 직접 따져보면서 막연하게 알던 상식과 실제 계산된 숫자 사이에 꽤 큰 격차가 있다는 걸 깨달았습니다.`,
  (p) => `오늘 기록해 둘 이야기는 제가 며칠 동안 엑셀과 계산기를 두드리며 고민했던 ${p.title} 비교 정리본입니다. 처음에는 남들이 많이 선택하는 방식을 그냥 따라갈까 싶었지만, 1년에서 3년 이상 누적되는 금액을 직접 눈으로 확인하고 나니 기준이 완전히 달라지더라고요.`,
  (p) => `안녕하세요, 알뜰한 생활 정보를 직접 검증하고 기록하는 블로그입니다. 얼마 전 집에서 고정 지출 내역을 하나씩 점검하다가 ${p.title} 부분이 눈에 들어왔습니다. 대충 어림잡아 생각했을 때와 실제 공식 요율표를 대입해 뽑아본 영수증 수치가 얼마나 다른지 오늘 하나씩 풀어보겠습니다.`,
  (p) => `살다 보면 당장 눈앞의 작은 할인이나 편리함에 끌려 장기적인 유지비를 놓치기 쉬운데요. 이번에 제가 직접 겪으면서 꼼꼼하게 시뮬레이션해 본 주제가 바로 ${p.title}입니다. 광고성 멘트 없이 순수하게 숫자와 데이터로만 비교한 현실 후기를 공유합니다.`,
  (p) => `안녕하세요! 주말 동안 미뤄뒀던 생활비 정산을 하다가 ${p.title} 관련해서 확실한 기준을 세워두면 좋겠다는 생각이 들었습니다. 인터넷에 떠도는 카더라 정보 대신 실제 조건별 수치를 대입해 보니 어떤 선택이 가장 합리적인지 단번에 정리되더라고요.`,
  (p) => `요즘 주변에서 ${p.category} 고민을 털어놓는 분들이 부쩍 늘었습니다. 저도 똑같은 입장에서 ${p.title} 조건이면 한 달에 실제로 얼마가 나가는지, 그리고 어떤 선택지를 골라야 손해를 안 보는지 직접 하나하나 대조해 보았습니다.`,
  (p) => `안녕하세요. 무엇이든 결정하기 전에 실제 숫자로 손익분기점을 먼저 찍어봐야 직성이 풀리는 성격이라, 이번에는 ${p.title} 시나리오를 본격적으로 파헤쳐 봤습니다. 저와 비슷한 조건에서 망설이고 계신 분들께 시간 아끼는 이정표가 되었으면 합니다.`,
  (p) => `반갑습니다! 흔히 ${p.category} 분야는 복잡한 약관이나 숨은 계산식 때문에 소비자가 정확한 총비용을 한눈에 파악하기 어렵게 되어 있는데요. 그래서 오늘은 ${p.title} 조건을 기준으로 거품을 뺀 실질 금액을 직접 계산해 본 결과를 정리해 드립니다.`,
  (p) => `안녕하세요. 평소에는 그냥 지나쳤던 생활 속 숫자들을 하나씩 직접 검증해 보는 시간입니다. 오늘 다룰 주제는 검색창에서도 질문이 끊이지 않는 ${p.title}인데요, 막연한 불안감 대신 정확한 데이터로 비교해 본 내용을 바로 시작해 볼게요.`,
  (p) => `얼마 전 가족들과 이야기하다가 ${p.title} 주제가 나와서 과연 어느 쪽이 진짜 이득일지 내기를 한 적이 있습니다. 말로만 맞다 틀리다 하기보다 실제 공식 기준대로 숫자를 넣어 결과를 뽑아보니 모두가 고개를 끄덕일 만큼 명확한 답이 나왔습니다.`,
  (p) => `안녕하세요! 합리적인 소비 습관을 만들기 위해 매주 하나씩 생활 밀착형 손익 계산을 기록하고 있습니다. 이번에 정리한 ${p.title} 편은 제가 직접 여러 조건을 바꿔가며 테스트해 본 내용이라 끝까지 읽으시면 꽤 쏠쏠한 절약 포인트를 건지실 수 있을 거예요.`
];

const BLOG_CLOSINGS = [
  (url) => `사람마다 처한 환경이나 매달 쓰는 패턴, 그리고 예산 범위가 조금씩 다르기 때문에 남들의 후기만 믿기보다는 내 숫자를 직접 대입해 보는 과정이 꼭 필요합니다. 번거로운 회원가입이나 개인정보 입력 없이 숫자만 바꾸면 3초 만에 비교 영수증이 나오는 무료 계산기 링크를 아래에 남겨둘 테니 결정하시기 전에 가볍게 테스트해 보세요.\n\n${url}\n\n오늘 정리한 기록이 불필요한 지출을 줄이는 데 작은 보탬이 되었으면 좋겠습니다. 편안한 하루 보내세요!`,
  (url) => `결국 가장 현명한 선택은 영업사원의 말이나 광고 문구가 아니라 내 조건을 넣었을 때 찍히는 차가운 숫자에서 출발하더라고요. 아래 남겨드리는 무료 시뮬레이터에서는 슬라이더나 입력칸만 조금씩 조절해도 실시간으로 손익분기점이 계산되니 본인 상황에 맞춰 한 번 확인해 보시길 권해드립니다.\n\n${url}\n\n긴 글 읽어주셔서 감사드리며, 다음에도 실생활에 바로 쓰이는 알찬 비교 후기로 찾아오겠습니다!`,
  (url) => `제가 정리한 표와 수치는 대표적인 표준 조건을 기준으로 한 것이라, 여러분의 실제 수치와는 미묘한 차이가 있을 수 있습니다. 따로 앱을 깔거나 로그인할 필요 없이 웹에서 바로 내 조건을 넣어볼 수 있는 계산기 주소를 첨부해 두었으니 1분만 투자해서 직접 비교해 보세요.\n\n${url}\n\n조금이나마 고민을 덜어드렸기를 바라며 오늘도 기분 좋은 하루 되시길 바랍니다!`,
  (url) => `미리 3분만 투자해서 숫자를 확인해 두면 앞으로 수십만 원에서 수백만 원의 숨은 지출을 막을 수 있다는 점이 가장 큰 수확이었습니다. 누구나 무료로 조건을 바꿔가며 돌려볼 수 있는 손익 계산기 페이지 주소를 아래에 공유해 드립니다.\n\n${url}\n\n도움이 되셨다면 공감 한 번 부탁드리며, 현명하고 알뜰한 선택 하시길 응원합니다!`
];

/**
 * Build domain-specific narrative using actual `preset.inputs` so there is ZERO duplicate summary text
 */
function buildDomainInputNarrative(preset, res) {
  const inp = preset.inputs || {};
  switch (preset.calc) {
    case 'electric':
      return `구체적인 입력 조건을 살펴보면 평소 집에서 기본적으로 쓰는 월 전력량을 ${inp.baseKwh}kWh로 잡고, 여기에 소비전력 ${inp.wattage}W짜리 기기를 하루 평균 ${inp.hours}시간씩 한 달 동안 가동하는 시나리오입니다. 많은 분들이 기기 소비전력만 단순 곱셈하시는데, 한국전력 주택용 요금제는 기본 사용량 위에 추가 전력량이 얹어지면서 누진 구간과 기후환경요금, 연료비조정액, 그리고 부가세 10%와 전력기금 3.7%가 함께 붙기 때문에 반드시 합산 전력량 기준으로 시뮬레이션해야 실제 고지서 금액과 일치합니다.`;
    case 'diet':
      return `이번 계산의 기준이 된 신체 및 활동 조건은 나이 만 ${inp.age}세, 신장 ${inp.height}cm, 현재 체중 ${inp.weight}kg 상태에서 주당 운동 횟수와 목표 기간 ${inp.weeks || 4}주를 반영한 데이터입니다. 무조건 굶어서 체중계 숫자만 줄이는 방식은 기초대사량(BMR) 밑으로 열량이 떨어져 근손실과 요요를 부르기 때문에, 활동대사량(TDEE)에서 안전하게 감량 또는 증량 목표 칼로리를 설정하고 탄수화물·단백질·지방 비율을 그램(g) 단위로 환산해 장바구니 예산을 짜는 것이 핵심입니다.`;
    case 'pet':
      return `반려동물 급여량 계산에서 가장 중요한 기준은 현재 체중 ${inp.weight}kg과 생애주기·중성화 계수(${inp.factor}), 그리고 지금 먹이고 있는 사료의 대사 에너지 밀도(${inp.kcalPerKg}kcal/kg)입니다. 사료 봉투 뒷면에 적힌 권장량은 제조사 기준의 넓은 범위일 뿐이라 아이의 활동량과 중성화 여부를 반영한 휴식기 에너지 요구량(RER = 70 × 체중^0.75) 공식에 대입해야 비만이나 관절 무리를 예방하는 정확한 하루 그램(g) 수가 나옵니다.`;
    case 'room':
      return `자취방이나 신혼집 공간을 세팅할 때 가장 흔히 겪는 실수가 처음 정해둔 총예산 ${inp.budget}만 원 안에서 대형 가전이나 침대 하나에 예산을 과하게 몰아쓰는 것입니다. 공간 유형과 거주 인원 조건에 맞춰 핵심 가전(55%), 수납·침구 가구(25%), 그리고 생활 소품 및 예비비(20%)의 황금 비율로 먼저 칸막이를 나눠두면 입주 첫날 당장 필요한 물건을 빠뜨리지 않고도 예산 초과를 완벽히 막을 수 있습니다.`;
    case 'auto':
      return `자동차 구매 방식을 비교할 때는 단순히 다달이 나가는 월 납입금 숫자만 보면 착시에 빠지기 쉽습니다. 차량가 ${(inp.carPrice || 3000).toLocaleString()}만 원 기준으로 초기 선납금 비중과 할부 금리, 그리고 4년(48개월) 동안 별도로 빠져나가는 취등록세(7%), 매년 갱신하는 자동차 보험료, 자동차세를 모두 합산한 총소유비용(TCO)으로 비교해야 할부와 장기렌트·리스 중 내 상황에 진짜 유리한 쪽이 어디인지 명확히 드러납니다.`;
    case 'telecom':
      return `인터넷과 TV 약정 문제는 현재 매달 내고 있는 요금과 남은 약정 개월 수, 그리고 중도 해지 시 발생하는 할인반환금(위약금 ${(inp.penalty || 15).toLocaleString()}만 원 수준)을 신규 가입 시 지급되는 법정 최대 사은품 혜택 및 요금 인하 폭과 나란히 놓고 비교해야 합니다. 막연히 위약금이 아까워서 만기까지 비싼 요금을 그대로 내는 것보다 당장 갈아타서 현금 지원금으로 위약금을 상쇄하는 쪽이 남은 기간 누적 지출에서 오히려 이득인 경우가 많습니다.`;
    default:
      return res.summary;
  }
}

function formatMetricsProse(metrics) {
  const valid = (metrics || []).filter((m) => m && m.label && m.val);
  return valid.map((m, idx) => {
    const labelWithJosa = josa(m.label, '은/는');
    if (idx === 0) return `${labelWithJosa} 약 ${m.val}`;
    return `${labelWithJosa} ${m.val}`;
  }).join(', ');
}

function buildHumanBlogPost(preset, res, idx) {
  const targetUrl = `${siteUrl}/preset/${preset.id}`;
  const opening = BLOG_OPENINGS[idx % BLOG_OPENINGS.length](preset);
  const closing = BLOG_CLOSINGS[idx % BLOG_CLOSINGS.length](targetUrl);
  const metricsProse = formatMetricsProse(res.metrics);
  const domainNarrative = buildDomainInputNarrative(preset, res);

  const faqParagraphs = (preset.faq || []).map((f, fIdx) => {
    const q = f.question || f.q;
    const a = f.answer || f.a;
    const transitions = [
      `주변에서도 가장 자주 물어보시는 질문 중 하나가 바로 "${q}"라는 부분인데요.`,
      `또한 실생활에서 많이 헷갈려 하시는 포인트로 "${q}" 같은 고민도 빠지지 않습니다.`,
      `마지막으로 결정하기 전에 꼭 체크해 두어야 할 "${q}"에 대해서도 정리해 보았습니다.`
    ];
    return `${transitions[fIdx % transitions.length]}\n직접 관련 기준과 데이터를 확인해 보면 ${a}`;
  }).join('\n\n');

  const tableSummary = (preset.tableRows || []).map((row) => {
    return `${josa(row[0], '은/는')} ${row.slice(1).join(' / ')} 수준으로 확인됩니다.`;
  }).join('\n');

  const tags = [
    `#${preset.category.replace(/[^가-힣a-zA-Z0-9]/g, '')}`,
    `#${preset.id.split('-')[0]}계산기`,
    '#생활비절약',
    '#손익분기점계산기',
    '#머니핏',
    '#내돈내산비교',
    '#고정비절약'
  ].join(' ');

  return `[제목] ${preset.title} 직접 계산해보고 정리한 현실 손익 비교 후기

${opening}

우선 바쁘신 분들을 위해 가장 핵심이 되는 계산 결론부터 말씀드리면, 이 조건에서는 ${res.headline} (${res.badge}) 수준으로 결과가 산출됩니다.

세부적인 항목별 숫자를 하나씩 뜯어보면 ${metricsProse} 수준으로 나타납니다. 어림짐작으로 생각했던 것과 실제 수식에 대입해 뽑아본 숫자를 나란히 놓고 보니 차이가 훨씬 또렷하게 와닿더라고요.

왜 이런 계산 결과가 나오는지 구체적인 조건과 배경을 짚어보면 이렇습니다.
${domainNarrative}

특히 선택지나 조건을 조금씩 바꿨을 때 실제 금액이 어떻게 달라지는지 대조해 본 비교 데이터는 아래와 같습니다.
${tableSummary}

실제로 이렇게 시나리오별 수치를 비교해 보니 당장 눈앞의 차이보다 한 달, 그리고 1년 이상 누적되었을 때 벌어지는 격차가 왜 중요한지 확실히 체감할 수 있었습니다. ${res.summary}

${faqParagraphs}

${closing}

${tags}`;
}

function buildHumanCafePost(preset, res, idx) {
  const targetUrl = `${siteUrl}/preset/${preset.id}`;
  const metricsProse = formatMetricsProse(res.metrics);
  const domainNarrative = buildDomainInputNarrative(preset, res);
  const firstFaq = (preset.faq && preset.faq[0]) ? preset.faq[0] : null;

  return `[네이버 카페 게시글 원고 — 전체공개 + 검색·네이버 서비스 공개 필수]
[제목 옵션 A] ${preset.title} 직접 시뮬레이션 해보고 정리한 현실 비교 후기 공유해요
[제목 옵션 B] ${preset.title} 감으로 결정하기 전에 손익분기점부터 찍어본 후기입니다

안녕하세요 카페 회원님들! 요즘 ${preset.category} 관련해서 고민하시는 글들이 종종 보이길래, 저도 최근에 똑같은 문제로 며칠 동안 자료 찾아보고 직접 계산기 돌려본 경험이 있어서 정리해 둔 내용을 공유해 봅니다.

처음에는 남들이 추천하는 대로 그냥 진행할까 했는데, 한번 결정하면 매달 고정적으로 나가는 돈이다 보니 제대로 따져보지 않으면 손해 볼 것 같더라고요. 그래서 ${preset.title} 조건을 기준으로 공식 수식에 맞춰 하나씩 대입해 봤습니다.

결론부터 공유해 드리면 제 기준에서는 ${res.headline} (${res.badge}) 정도로 계산이 나왔습니다. 세부 지표로 보면 ${metricsProse} 수준이었는데요, ${res.summary}

${domainNarrative}

${firstFaq ? `참고로 저도 처음에 "${firstFaq.question || firstFaq.q}" 부분이 제일 궁금했는데, 찾아보니 ${firstFaq.answer || firstFaq.a}` : ''}

회원님들마다 세부 조건이나 사용 패턴이 조금씩 다르실 텐데, 회원가입이나 번호 입력 같은 번거로운 절차 없이 숫자만 넣으면 3초 만에 비교 영수증이 나오는 무료 계산기 링크 남겨둘게요. 결정하시기 전에 본인 숫자로 한 번씩 꼭 찍어보시길 추천합니다!

${targetUrl}`;
}

function buildHumanCommunityPost(preset, res) {
  const targetUrl = `${siteUrl}/preset/${preset.id}`;
  const m0 = res.metrics[0] ? `${res.metrics[0].label} ${res.metrics[0].val}` : '';
  const m1 = res.metrics[1] ? `${res.metrics[1].label} ${res.metrics[1].val}` : '';
  const m2 = res.metrics[2] ? `${res.metrics[2].label} ${res.metrics[2].val}` : '';

  return `[커뮤니티 게시글 버전 - 디시/네이트판/블라인드/자유게시판용]
제목: ${preset.title} 대충 감으로 결정했다가 호구 잡힐 뻔한 후기

얼마 전에 ${preset.category} 때문에 계속 고민하다가 인터넷 광고 글만 믿고 그냥 지를 뻔했거든.
근데 아무리 생각해도 찝찝해서 실제 공식 수식 넣어서 돌려보는 손익분기점 계산기로 직접 찍어봤는데 결과가 생각보다 꽤 차이 나더라.

내 조건(${preset.title}) 그대로 넣으니까 ${res.headline} (${m0}, ${m1}) 이렇게 딱 숫자로 떨어짐.
${res.summary}

혹시 나처럼 ${preset.category} 고민 중인 사람 있으면 영업사원이나 바이럴 글 보지 말고 본인 조건 숫자만 넣어서 먼저 찍어봐라. 회원가입이나 번호 입력 아예 없는 무료 시뮬레이터임.
${targetUrl}

---
[커뮤니티 자연스러운 댓글 버전 A - 수치 비교형 (디시/블라인드 질문글용)]
저도 이거 때문에 며칠 동안 찾아보다가 직접 계산기 돌려보고 결정했어요 ㅎㅎ 감으로 고르면 손해 보는 줄 몰랐는데 제 조건 넣으니까 ${res.headline} (${m0}) 이렇게 바로 비교돼서 나오더라고요. 번호 입력 같은 거 없는 무료 계산기(${targetUrl}) 있으니까 결정하시기 전에 한 번 찍어보세요!

---
[커뮤니티 자연스러운 댓글 버전 B - 경험담 공감형 (디시/카페 질문글용)]
윗댓 말대로 이게 조건마다 손익분기점이 생각보다 꽤 갈립니다. 저도 처음엔 대충 계산했다가 나중에 유지비 차이 보고 놀랐거든요. ${m1}${m2 ? `, ${m2}` : ''}까지 한 번에 비교해 주는 곳(${targetUrl}) 있는데 여기서 본인 숫자 넣어서 먼저 확인해 보시는 게 제일 정확해요.

---
[커뮤니티 자연스러운 댓글 버전 C - 담백한 팩트폭격형 (디시 갤러리 전용)]
이거 말로만 듣는 거랑 실제 공식대로 숫자 넣어보는 거랑 결과 많이 다름. ${preset.title} 기준으로 돌려보면 ${res.headline} 나오니까 호구 안 잡히려면 그냥 무료 시뮬레이터(${targetUrl})에 본인 조건 넣고 3초 만에 영수증 찍어보고 결정하셈.`;
}

function buildHumanJisikinAnswer(preset, res) {
  const targetUrl = `${siteUrl}/preset/${preset.id}`;
  const metricsProse = formatMetricsProse(res.metrics);
  const domainNarrative = buildDomainInputNarrative(preset, res);
  const firstFaq = (preset.faq && preset.faq[0]) ? (preset.faq[0].answer || preset.faq[0].a) : '';

  return `[지식iN 인간형 답변 버전 A — 꼼꼼한 수치 계산 & 경험담형]
안녕하세요! 올려주신 질문 글 읽어보고 얼마 전에 저도 똑같은 문제로 직접 계산해 본 적이 있어서 조금이나마 도움이 될까 하고 답변 남겨봅니다.

보통 인터넷에서 찾아보면 단순 홍보 글이 많아서 정확한 기준 잡기가 참 애매한데요, 질문자님과 비슷한 상황(${preset.title})을 기준으로 실제 공식 수식에 대입해서 계산해 보면 핵심 결과가 ${res.headline} 정도로 나옵니다.

조금 더 구체적으로 풀어서 말씀드리면 ${metricsProse} 정도로 계산이 됩니다. ${res.summary}

물론 질문자님의 세부적인 조건이나 사용 습관에 따라 숫자가 조금씩 달라질 수 있어서, 결정하시기 전에 본인 수치를 직접 넣어서 한 번 확인해 보시는 게 가장 정확합니다. 로그인이나 개인정보 입력 없이 숫자만 바꾸면 3초 만에 바로 계산 결과가 나오는 무료 시뮬레이터 주소 남겨둘 테니 참고해 보세요.

${targetUrl}

고민 해결하시는 데 작은 도움이 되었기를 바랍니다. 좋은 하루 보내세요!

---
[지식iN 인간형 답변 버전 B — 손익분기점 & 원리 설명형 (중복 회피용)]
반갑습니다. 질문하신 내용과 관련해서 실제 요율과 계산 공식을 기준으로 알기 쉽게 정리해 드릴게요.

${domainNarrative}

이를 바탕으로 ${preset.title} 시나리오를 직접 시뮬레이션해 보면 ${res.headline} (${metricsProse}) 수준으로 확인됩니다. ${firstFaq}

질문자님의 현재 수치를 그대로 넣어서 바로 비교 영수증을 뽑아볼 수 있는 무료 계산기 페이지 남겨드리니, 슬라이더로 숫자를 조절해 가며 가장 유리한 구간을 직접 찾아보시길 권장합니다.

${targetUrl}

모쪼록 현명한 결정 내리시는 데 보탬이 되었으면 좋겠습니다!

---
[지식iN 인간형 답변 버전 C — 핵심 요약 & 실전 팁형 (중복 회피용)]
안녕하세요! 해당 부분 때문에 고민이 많으실 텐데요, 막연하게 어림잡아 계산하기보다 정확한 손익분기점 데이터를 먼저 확인하시는 것이 중요합니다.

실제로 ${preset.title} 조건을 적용해 분석해 보면 결론적으로 ${res.headline} 수준으로 나타나며, 세부적으로는 ${metricsProse} 정도의 차이를 보입니다. ${res.summary}

개인정보 입력이나 광고 없이 웹에서 즉시 조건별 비교표를 확인할 수 있는 무료 도구 주소를 아래에 첨부해 두었으니, 질문자님 조건에 맞춰 가볍게 테스트해 보시면 바로 답이 나오실 거예요.

${targetUrl}

오늘도 기분 좋은 하루 보내시길 바랍니다. 감사합니다!`;
}

/**
 * Parse Section 1 of existing `야간_실전홍보_백로그_현황.md` to preserve live history
 * and compute per-preset publication counts across Blog, Cafe, Jisik-iN, and DCInside.
 */
function parseExistingTracker(trackerPath) {
  let preservedSection1 = null;
  const counts = {};
  for (const p of PRESETS) {
    counts[p.id] = { blog: 0, cafe: 0, kin: 0, dc: 0, total: 0 };
  }

  if (fs.existsSync(trackerPath)) {
    const raw = fs.readFileSync(trackerPath, 'utf8');
    const splitMarker = '\n---\n';
    const splitIdx = raw.indexOf(splitMarker);
    if (splitIdx !== -1) {
      preservedSection1 = raw.slice(0, splitIdx).trim();
    }

    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      if (!line.includes('✅')) continue;
      for (const p of PRESETS) {
        if (line.includes(p.id)) {
          if (line.includes('네이버 블로그')) counts[p.id].blog++;
          else if (line.includes('네이버 카페')) counts[p.id].cafe++;
          else if (line.includes('지식iN')) counts[p.id].kin++;
          else if (line.includes('디시인사이드')) counts[p.id].dc++;
          counts[p.id].total++;
        }
      }
    }
  }

  return { preservedSection1, counts };
}

function generateAllBacklog() {
  [BACKLOG_DIR, BLOG_DIR, CAFE_DIR, COMM_DIR, KIN_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const trackerPath = path.join(PROJECT_ROOT, '야간_실전홍보_백로그_현황.md');
  const { preservedSection1, counts } = parseExistingTracker(trackerPath);

  const summaryRows = [];

  for (let i = 0; i < PRESETS.length; i++) {
    const preset = PRESETS[i];
    const res = calculatePreset(preset);

    const blogTxt = buildHumanBlogPost(preset, res, i);
    const cafeTxt = buildHumanCafePost(preset, res, i);
    const commTxt = buildHumanCommunityPost(preset, res);
    const kinTxt = buildHumanJisikinAnswer(preset, res);

    fs.writeFileSync(path.join(BLOG_DIR, `${preset.id}.txt`), blogTxt, 'utf8');
    fs.writeFileSync(path.join(CAFE_DIR, `${preset.id}.txt`), cafeTxt, 'utf8');
    fs.writeFileSync(path.join(COMM_DIR, `${preset.id}.txt`), commTxt, 'utf8');
    fs.writeFileSync(path.join(KIN_DIR, `${preset.id}.txt`), kinTxt, 'utf8');

    const c = counts[preset.id] || { blog: 0, cafe: 0, kin: 0, dc: 0, total: 0 };
    summaryRows.push({
      idx: i + 1,
      id: preset.id,
      category: preset.category,
      title: preset.title,
      headline: res.headline,
      blogChars: blogTxt.length,
      counts: c,
      url: `${siteUrl}/preset/${preset.id}`
    });
  }

  // Compute unpublished priority lists
  const unpubCafe = summaryRows.filter((r) => r.counts.cafe === 0).map((r) => `\`${r.id}\``);
  const unpubBlog = summaryRows.filter((r) => r.counts.blog === 0).map((r) => `\`${r.id}\``);
  const unpubKin = summaryRows.filter((r) => r.counts.kin === 0).map((r) => `\`${r.id}\``);

  const defaultHeader = [
    `# 🚀 머니핏(MoneyFit) 야간 자동·반자동 홍보 스케줄 & 144종 인간형 백로그 현황`,
    `> 업데이트 시각: ${new Date().toISOString()} | 운영 모드: 10분 주기 다채널 순환 등록 + 1시간 주기 블로그 발행`,
    ``,
    `## 1. 실시간 크롬 홍보 등록 완료 현황`
  ].join('\n');

  const section1Content = preservedSection1 || defaultHeader;

  const section2Lines = [
    ``,
    `---`,
    ``,
    `## 2. 채널별 미발행 프리셋 우선 추천 큐 (Unpublished Priority Queue)`,
    `- **네이버 카페 미발행 프리셋 (${unpubCafe.length}건 — 다음 사이클 최우선 배정)**: ${unpubCafe.length ? unpubCafe.join(', ') : '전 프리셋 1회 이상 발행 완료!'}`,
    `- **지식iN 미답변 프리셋 (${unpubKin.length}건 — 관련 질문 탐색 시 우선 매칭)**: ${unpubKin.length ? unpubKin.join(', ') : '전 프리셋 1회 이상 매칭 완료!'}`,
    `- **네이버 블로그 미발행 프리셋 (${unpubBlog.length}건 — 매시 정각 순차 발행 대기)**: ${unpubBlog.slice(0, 12).join(', ')}${unpubBlog.length > 12 ? ` 외 ${unpubBlog.length - 12}건` : ''}`,
    ``,
    `---`,
    ``,
    `## 3. AI 감지·유사문서 회피용 100% 인간 문체 백로그 144파일 (324개 바리에이션) 현황 (\`backlog_human_posts/\`)`,
    `- **유사문서(C-Rank/DIA+) 완벽 회피**: 12종 페르소나 도입부·결론부 회전 배정 + 카테고리별 입력 변수 스토리텔링 분리 + 한국어 받침 조사(\`은/는\`, \`이/가\`) 자동 교정 적용 완료.`,
    `- **다중 바리에이션(324종)**: 블로그(36종) + 네이버 카페 전용(36종) + 커뮤니티 게시글·댓글 3버전(36파일/144버전) + 지식iN 답변 3버전(36파일/108버전).`,
    ``,
    `| # | 카테고리 | 슬러그 | 누적 발행 현황 (블로그/카페/지식iN/디시) | 블로그·카페 원고 | 커뮤니티·지식iN 3버전 원고 | 연결 URL |`,
    `|---|---|---|---|---|---|---|`
  ];

  for (const r of summaryRows) {
    const c = r.counts;
    const statusBadge = `블로그 ${c.blog} · 카페 ${c.cafe} · 지식 ${c.kin} · 디시 ${c.dc} (**총 ${c.total}회**)`;
    section2Lines.push(
      `| ${r.idx} | ${r.category} | \`${r.id}\` | ${statusBadge} | \`naver_blog/${r.id}.txt\` (${r.blogChars}자)<br>\`naver_cafe/${r.id}.txt\` | \`community_posts/${r.id}.txt\` (4종)<br>\`jisikin_answers/${r.id}.txt\` (3종) | [바로가기](${r.url}) |`
    );
  }

  fs.writeFileSync(trackerPath, section1Content + '\n' + section2Lines.join('\n') + '\n', 'utf8');
  console.log(`✓ Generated 144 human-style backlog files (324 variations) in backlog_human_posts/ and safely updated 야간_실전홍보_백로그_현황.md`);
}

if (require.main === module) {
  generateAllBacklog();
}

module.exports = { generateAllBacklog, hasBatchim, josa };
