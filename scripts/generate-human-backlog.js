#!/usr/bin/env node
/**
 * MoneyFit Portal - Anti-AI Human Conversational Backlog Generator (108 Posts)
 *
 * Generates 100% human-sounding, zero-AI-marker (no ■, •, 👉, **) promotional backlog across:
 * 1. `backlog_human_posts/naver_blog/{slug}.txt` (36 Long-form 1,500+ char personal blogger diary posts for Naver Blog & Tistory)
 * 2. `backlog_human_posts/community_posts/{slug}.txt` (36 Natural community posts & comments for DCInside, Nate Pann, Naver Cafe, Blind)
 * 3. `backlog_human_posts/jisikin_answers/{slug}.txt` (36 Conversational human Q&A answers for Naver Jisik-iN)
 * 4. `야간_실전홍보_백로그_현황.md` (Master Live Promotion & Backlog Tracker)
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKLOG_DIR = path.join(PROJECT_ROOT, 'backlog_human_posts');
const BLOG_DIR = path.join(BACKLOG_DIR, 'naver_blog');
const COMM_DIR = path.join(BACKLOG_DIR, 'community_posts');
const KIN_DIR = path.join(BACKLOG_DIR, 'jisikin_answers');

const { PRESETS } = require('../src/data/presets.js');
const calculators = require('../src/data/calculators.js');

const siteUrl = 'https://truthofmarket.com';

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

function buildHumanBlogPost(preset, res) {
  const targetUrl = `${siteUrl}/preset/${preset.id}`;
  const m0 = res.metrics[0] ? `${res.metrics[0].label}은 약 ${res.metrics[0].val}` : '';
  const m1 = res.metrics[1] ? `${res.metrics[1].label}은 ${res.metrics[1].val}` : '';
  const m2 = res.metrics[2] ? `${res.metrics[2].label}은 ${res.metrics[2].val}` : '';
  const m3 = res.metrics[3] ? `${res.metrics[3].label}은 ${res.metrics[3].val}` : '';

  const faqParagraphs = (preset.faq || []).map((f) => {
    const q = f.question || f.q;
    const a = f.answer || f.a;
    return `주변에서도 자주 물어보시는 것 중 하나가 바로 "${q}"라는 점인데요.\n실제로 확인해 보면 ${a}`;
  }).join('\n\n');

  const tableSummary = (preset.tableRows || []).map((row) => {
    return `${row[0]} 조건일 때는 ${row.slice(1).join(' / ')} 수준으로 차이가 납니다.`;
  }).join('\n');

  const tags = [
    `#${preset.category.replace(/[^가-힣a-zA-Z0-9]/g, '')}`,
    `#${preset.id.split('-')[0]}계산기`,
    '#생활비절약',
    '#손익분기점계산기',
    '#머니핏',
    '#내돈내산비교'
  ].join(' ');

  return `[제목] ${preset.title} 직접 계산해보고 정리한 현실 손익 비교 후기

안녕하세요! 요즘 물가도 많이 오르고 매달 고정적으로 빠져나가는 지출이 만만치 않다 보니, 하나를 결정하더라도 대충 감으로 고르면 나중에 생각보다 큰돈이 새어나가더라고요.

저도 얼마 전에 ${preset.title} 문제로 한참 고민하면서 인터넷 후기들을 찾아봤는데, 사람마다 말이 다 다르고 광고성 글이 너무 많아서 도대체 뭐가 맞는지 헷갈렸습니다. 그래서 아예 공식 기준 수식대로 숫자를 하나씩 대입해서 직접 손익분기점을 계산해 봤는데요, 저처럼 똑같은 고민 하시는 분들께 도움이 될까 해서 정리한 내용을 공유해 봅니다.

우선 가장 궁금해하실 결론부터 말씀드리면 이 조건에서는 ${res.headline} (${res.badge}) 수준으로 계산이 나옵니다.

세부적인 숫자를 하나씩 뜯어보면 ${m0} 정도이고, ${m1}, 그리고 ${m2}, ${m3} 수준으로 나타납니다. 막연하게 생각했던 것보다 실제 숫자로 뽑아보니 차이가 꽤 뚜렷하더라고요.

왜 이런 결과가 나오는지 배경을 조금 더 살펴보면 이렇습니다.
${preset.introText || res.summary}

특히 조건별로 어떻게 달라지는지 직접 비교해 본 데이터는 아래와 같습니다.
${tableSummary}

실제로 이렇게 비교해 보니 어떤 선택을 하느냐에 따라 한 달, 그리고 1년 누적 금액이 크게 벌어지는 이유를 확실히 알 수 있었습니다.
${preset.deepDiveText || ''}

${faqParagraphs}

마지막으로 놓치기 쉬운 실전 팁을 덧붙이자면 이렇습니다.
${preset.tipsText || res.summary}

사람마다 집 평수나 사용 패턴, 예산이나 계약 조건이 조금씩 다르다 보니 남들이 좋다는 말만 믿기보다는 본인 숫자를 직접 한 번 넣어보시는 게 가장 정확합니다. 로그인이나 개인정보 입력 같은 번거로운 절차 없이 숫자만 넣으면 3초 만에 바로 비교 영수증이 나오는 무료 계산기 주소 남겨둘 테니 필요하신 분들은 편하게 활용해 보세요.

${targetUrl}

오늘 정리해 드린 내용이 현명한 결정 내리시는 데 작은 도움이 되었으면 좋겠습니다. 읽어주셔서 감사합니다!

${tags}`;
}

function buildHumanCommunityPost(preset, res) {
  const targetUrl = `${siteUrl}/preset/${preset.id}`;
  const m0 = res.metrics[0] ? `${res.metrics[0].label} ${res.metrics[0].val}` : '';
  const m1 = res.metrics[1] ? `${res.metrics[1].label} ${res.metrics[1].val}` : '';

  return `[커뮤니티 게시글 버전 - 디시/네이트판/블라인드/카페 자유게시판용]
제목: ${preset.title} 대충 감으로 결정했다가 호구 잡힐 뻔한 후기

얼마 전에 ${preset.category} 때문에 계속 고민하다가 인터넷 말만 믿고 그냥 지를 뻔했거든.
근데 아무리 생각해도 찝찝해서 실제 공식 수식 넣어서 돌려보는 손익분기점 계산기로 직접 찍어봤는데 결과가 좀 충격적이더라.

내 조건(${preset.title}) 그대로 넣으니까 ${res.headline} (${m0}, ${m1}) 이렇게 딱 숫자로 떨어짐.
${res.summary}

혹시 나처럼 ${preset.category} 고민 중인 사람 있으면 영업사원이나 광고 글 보지 말고 본인 조건 숫자만 넣어서 먼저 찍어봐라. 회원가입이나 광고 배너 아예 없는 무료 시뮬레이터임.
${targetUrl}

---
[커뮤니티 자연스러운 댓글 버전 - 관련 질문글 댓글용]
저도 이거 때문에 며칠 동안 찾아보다가 직접 계산기 돌려보고 결정했어요 ㅎㅎ 감으로 고르면 손해 보는 줄 몰랐는데 제 조건 넣으니까 ${res.headline} (${m0}) 이렇게 바로 비교돼서 나오더라고요. 번호 입력 같은 거 없는 무료 계산기(${targetUrl}) 있으니까 결정하시기 전에 한 번 찍어보세요!`;
}

function buildHumanJisikinAnswer(preset, res) {
  const targetUrl = `${siteUrl}/preset/${preset.id}`;
  const m0 = res.metrics[0] ? `${res.metrics[0].label}은 약 ${res.metrics[0].val}` : '';
  const m1 = res.metrics[1] ? `${res.metrics[1].label}은 ${res.metrics[1].val}` : '';
  const m2 = res.metrics[2] ? `${res.metrics[2].label}은 ${res.metrics[2].val}` : '';

  return `안녕하세요! 올려주신 질문 글 읽어보고 얼마 전에 저도 똑같은 문제로 직접 계산해 본 적이 있어서 조금이나마 도움이 될까 하고 답변 남겨봅니다.

보통 인터넷에서 찾아보면 단순 홍보 글이 많아서 정확한 기준 잡기가 참 애매한데요, 질문자님과 비슷한 상황(${preset.title})을 기준으로 실제 공식 수식에 대입해서 계산해 보면 핵심 결과가 ${res.headline} 정도로 나옵니다.

조금 더 구체적으로 풀어서 말씀드리면 ${m0} 수준이고, ${m1}, 그리고 ${m2} 정도로 계산이 됩니다. ${res.summary}

물론 질문자님의 세부적인 조건이나 사용 습관에 따라 숫자가 조금씩 달라질 수 있어서, 결정하시기 전에 본인 수치를 직접 넣어서 한 번 확인해 보시는 게 가장 정확합니다. 로그인이나 개인정보 입력 없이 숫자만 바꾸면 3초 만에 바로 계산 결과가 나오는 무료 시뮬레이터 주소 남겨둘 테니 참고해 보세요.

${targetUrl}

고민 해결하시는 데 작은 도움이 되었기를 바랍니다. 좋은 하루 보내세요!`;
}

function generateAllBacklog() {
  [BACKLOG_DIR, BLOG_DIR, COMM_DIR, KIN_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const summaryRows = [];

  for (let i = 0; i < PRESETS.length; i++) {
    const preset = PRESETS[i];
    const res = calculatePreset(preset);

    const blogTxt = buildHumanBlogPost(preset, res);
    const commTxt = buildHumanCommunityPost(preset, res);
    const kinTxt = buildHumanJisikinAnswer(preset, res);

    fs.writeFileSync(path.join(BLOG_DIR, `${preset.id}.txt`), blogTxt, 'utf8');
    fs.writeFileSync(path.join(COMM_DIR, `${preset.id}.txt`), commTxt, 'utf8');
    fs.writeFileSync(path.join(KIN_DIR, `${preset.id}.txt`), kinTxt, 'utf8');

    summaryRows.push({
      idx: i + 1,
      id: preset.id,
      category: preset.category,
      title: preset.title,
      headline: res.headline,
      blogChars: blogTxt.length,
      url: `${siteUrl}/preset/${preset.id}`
    });
  }

  const trackerPath = path.join(PROJECT_ROOT, '야간_실전홍보_백로그_현황.md');
  const lines = [
    `# 🚀 머니핏(MoneyFit) 야간 자동·반자동 홍보 스케줄 & 108종 인간형 백로그 현황`,
    `> 업데이트 시각: ${new Date().toISOString()} | 운영 모드: 10분 주기 다채널 순환 등록 + 1시간 주기 블로그 발행`,
    ``,
    `## 1. 실시간 크롬 홍보 등록 및 대기 현황`,
    `- ✅ **[지식iN 등록 완료 #1]** [인터넷 tv 핸드폰 2대 cctv 갈아 타려는데 혜택이 있을까요?](https://kin.naver.com/qna/detail.naver?dirId=10903&docId=495556491&answerNo=3) — \`telecom-penalty-15\` 오픈그래프 카드 포함 실서버 노출 중`,
    `- 🔄 **[10분 주기 순차 등록 큐 (크롬 탭 오픈 완료)]**:`,
    `  1. **[지식iN - 반려동물 사료 급여량]** \`강아지가 배고파서 끼잉거릴 때 밥줘야 하나요?\` (\`docId=495536778\`) — \`pet-maltese-5kg\``,
    `  2. **[디시인사이드 - 투룸 전기세·난방비]** \`투룸 살거나 살아본사람 전기세 난방비 대략 얼마정도야?\` (\`no=6797992\`) — \`electric-studio-ac\``,
    `  3. **[지식iN - 다이어트 기초대사량·식단]** \`다이어트 중인데 일주일에 한번 쉬는 거 괜찮나요ㅜㅜ\` (\`docId=495578197\`) — \`diet-female-lean\``,
    `  4. **[지식iN - 원룸 가구 배치·예산]** \`가구 배치 고수신분들 ㅠㅠ\` (\`docId=495574342\`) — \`room-oneroom-100\``,
    `  5. **[지식iN - 전기요금 누진세·출산할인]** \`전기세가 저번달보다 적게나왓는데 한번만 봐주세요 ㅠ\` (\`docId=495569874\`) — \`electric-studio-ac\``,
    `  6. **[지식iN - 니로 하이브리드 장기렌트]** \`니로 하이브리드 렌트하려고합니다\` (\`docId=495525651\`) — \`auto-tucson-hybrid\``,
    ``,
    `---`,
    ``,
    `## 2. AI 감지 회피용 100% 인간 문체 백로그 108종 생성 완료 (\`backlog_human_posts/\`)`,
    `- 모든 원고에서 기계적인 기호(\`■\`, \`•\`, \`👉\`, \`**\`)를 완전히 제거하고 실제 블로거·커뮤니티 유저의 자연스러운 구어체 문단으로 작성했습니다.`,
    ``,
    `| # | 카테고리 | 슬러그 | 블로그 원고 (1시간 주기용) | 커뮤니티 원고 (10분 주기용) | 지식iN 답변 원고 | 연결 URL |`,
    `|---|---|---|---|---|---|---|`
  ];

  for (const r of summaryRows) {
    lines.push(`| ${r.idx} | ${r.category} | \`${r.id}\` | \`backlog_human_posts/naver_blog/${r.id}.txt\` (${r.blogChars}자) | \`backlog_human_posts/community_posts/${r.id}.txt\` | \`backlog_human_posts/jisikin_answers/${r.id}.txt\` | [바로가기](${r.url}) |`);
  }

  fs.writeFileSync(trackerPath, lines.join('\n'), 'utf8');
  console.log(`✓ Generated 108 human-style backlog files in backlog_human_posts/ and updated 야간_실전홍보_백로그_현황.md`);
}

if (require.main === module) {
  generateAllBacklog();
}

module.exports = { generateAllBacklog };
