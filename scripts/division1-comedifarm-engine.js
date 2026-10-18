#!/usr/bin/env node
/**
 * 🏢 [제1본부 전담 엔진] 1계정 (comedifarm) & 공식 카페 (moneyfitlab) & SNS (@moneyfit2026)
 * — truthofmarket.com 외부링크 유입 극대화 · 고밀도 백서 · 4컷 웹툰 · 16초 모션영상 24시간 다회차 총괄 엔진
 * (제1본부장: 🐆 치타 본부장 / 팀원: 🐝 꿀벌 과장 · 🦜 앵무새 피디 · 🦔 고슴도치 대리)
 *
 * 핵심 원칙 (제2본부 expertise333과 역할 분리 및 시너지):
 * 1. 전담 계정: 네이버 1계정 `comedifarm` (Port 9222) + 공식 카페 `moneyfitlab` + 인스타·쓰레드 `@moneyfit2026`
 * 2. 유일한 목표: 모든 채널 원고에 진짜 유용한 공식·실측 비교표·3단계 체크리스트 + 4컷 웹툰(`slide-1~4.png`) + 16초 모션영상(`clip.mp4`)을 결합하고,
 *    본문 상단(중단)과 하단 2곳 이상에 직관적인 클릭형 `https://truthofmarket.com/preset/{slug}` 및 `https://truthofmarket.com/?calc={calc}` 링크를 100% 삽입하여
 *    자사 홈페이지 실유입(UV/PV)과 쿠팡 파트너스·링크프라이스·CPA 전환을 극대화함.
 * 3. 운영 채널 (5대 외부유입 툴 — 18시 이후 야간 다회차 포함 일 24건 생산):
 *    - ① `comedifarm` 네이버 블로그 (일 6편: 08:30 / 11:30 / 14:30 / 18:30 / 21:00 / 23:00 KST — 모션영상+4컷웹툰+비교표+상하단 직행링크)
 *    - ② `moneyfitlab` 네이버 카페 (일 5편: 09:00 / 13:00 / 18:30 / 20:30 / 22:30 KST — 18시 이후 야간 3편 포함 살림백서+4컷웹툰+상하단 직행링크)
 *    - ③ 네이버 지식iN 실시간 미채택 답변 (일 6편: 공식 요약 백서 + slide-3.png 영수증 + 상하단 직행링크)
 *    - ④ 외부 커뮤니티 (일 4편: 자취·자동차·다이어트·반려동물 실측 비교표 + webtoon-grid.png + 상하단 직행링크)
 *    - ⑤ 인스타그램 & 쓰레드 `@moneyfit2026` (일 3편: 08:15 / 12:45 / 21:15 KST — 4컷 웹툰 + clip.mp4 + 프로필/고정댓글 직행링크)
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

function getCalcKey(preset) {
  return preset.calcId || preset.calc || 'electric';
}

function runCalculatorForPreset(preset) {
  const inp = preset.inputs || {};
  switch (getCalcKey(preset)) {
    case 'electric': return calculators.calculateElectric(inp);
    case 'diet': return calculators.calculateDiet(inp);
    case 'pet': return calculators.calculatePet(inp);
    case 'room': return calculators.calculateRoom(inp);
    case 'auto': return calculators.calculateAuto(inp);
    case 'telecom': return calculators.calculateTelecom(inp);
    default: return calculators.calculateElectric(inp);
  }
}

function formatTableMd(headers, rows) {
  if (!headers || !rows || rows.length === 0) return '';
  const h = `| ${headers.join(' | ')} |`;
  const s = `| ${headers.map(() => '---').join(' | ')} |`;
  const b = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
  return `${h}\n${s}\n${b}`;
}

const BLOG_TIME_SLOTS = ['08:30', '11:30', '14:30', '18:30 (야간1차)', '21:00 (야간2차)', '23:00 (심야3차)'];
const CAFE_TIME_SLOTS = ['09:00', '13:00', '18:30 (야간1차)', '20:30 (야간2차)', '22:30 (야간3차)'];

function generateDivision1DailyPack() {
  const kst = getKstNow();
  ensureDir(DIV1_OUTBOX);
  ensureDir(LOGS_DIR);

  const subDirs = {
    blog: path.join(DIV1_OUTBOX, '1_comedifarm_blog'),
    cafe: path.join(DIV1_OUTBOX, '2_moneyfitlab_cafe'),
    jisikin: path.join(DIV1_OUTBOX, '3_naver_jisikin'),
    community: path.join(DIV1_OUTBOX, '4_external_community'),
    instaThreads: path.join(DIV1_OUTBOX, '5_insta_threads')
  };
  Object.values(subDirs).forEach(ensureDir);

  // Rotate presets based on dayOfYear so every day targets fresh high-intent presets across all 36 scenarios
  const offset = (kst.dayOfYear * 5) % PRESETS.length;
  const pickPresets = (count, shift = 0) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(PRESETS[(offset + shift + i) % PRESETS.length]);
    }
    return arr;
  };

  const blogPresets = pickPresets(6, 0);
  const cafePresets = pickPresets(5, 6);
  const jisikinPresets = pickPresets(6, 11);
  const commPresets = pickPresets(4, 17);
  const snsPresets = pickPresets(3, 21);

  // 1. comedifarm 네이버 블로그 (일 6편 — 18시 이후 야간 3회차 포함 · 웹툰+모션영상+실측비교표+상하단 직행 링크 100% 포함)
  const blogItems = blogPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const calcKey = getCalcKey(p);
    const targetUrl = `https://truthofmarket.com/preset/${p.id}`;
    const calcHubUrl = `https://truthofmarket.com/?calc=${calcKey}`;
    const timeSlot = BLOG_TIME_SLOTS[idx] || '21:00';
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표', val: '-', value: '-' };
    const m1 = (res.metrics && res.metrics[1]) || { label: '비교 지표', val: '-', value: '-' };
    const m0Val = m0.val || m0.value || '-';
    const m1Val = m1.val || m1.value || '-';
    const tableMd = formatTableMd(p.tableHeaders, p.tableRows);
    const faqMd = (p.faq || []).map((f, i) => `- **Q${i + 1}. ${f.question || f.q}**\n  - A. ${f.answer || f.a}`).join('\n');

    const content = `# [1본부/comedifarm 외부유입 블로그 #${idx + 1} (${timeSlot} KST)] ${p.title} — 4컷 웹툰 · 16초 모션클립 · 3초 영수증 백서

- **발행 계정**: 네이버 1계정 \`comedifarm\` (\`https://blog.naver.com/comedifarm\`, Port 9222)
- **편성 시간대**: \`${timeSlot} KST\`
- **필수 첨부 미디어**:
  - 🎬 **16초 모션웹툰 영상**: \`sns_outbox/${p.id}/clip.mp4\`
  - 🖼️ **네이버 홈판 1:1 대표 썸네일**: \`sns_outbox/${p.id}/blog-home-thumb.png\`
  - 🎨 **4컷 동물 웹툰 슬라이드**: \`sns_outbox/${p.id}/slide-1.png ~ slide-4.png\` (합본: \`sns_outbox/${p.id}/webtoon-grid.png\`)
- **직행 유입 링크 (상·하단 2회 이상 필수 삽입)**:
  - 프리셋 직행: ${targetUrl}
  - 계산기 허브: ${calcHubUrl}

---

## 💡 바쁜 분들을 위한 3초 결론 요약 & 무료 계산기 직행 링크
- **비교 시나리오**: ${p.subtitle || p.description || p.title}
- **핵심 판정**: **${res.headline}** (${res.badge || '실측 분석'})
- **${m0.label}**: **${m0Val}** / **${m1.label}**: **${m1Val}**

👉 **[무료 3초 계산기 바로가기] 내 조건(평수·요금·체중·차종) 넣어서 1원 단위 실시간 영수증 뽑기**:
${targetUrl}

🏠 **[머니핏 6대 생활비 3초 손익계산기 공식 포털 바로가기]**:
${calcHubUrl}

---

## 📊 1. 왜 감으로 결정하면 매달 생돈이 새나갈까요? (전문가 수식 팩트체크)
${res.summary}

## 📋 2. 조건별 1원·1g 단위 실측 비교 데이터표 (${p.title})
${tableMd}

## ✅ 3. 결정 전 호구 방지 3단계 실전 체크리스트 & FAQ
${faqMd || '- 내 현재 수치(요금·체중·소비전력·차량가)를 정확히 확인한 뒤 아래 무료 시뮬레이터에 대입해 손익분기점을 먼저 검증하세요.'}

---

## 🔗 4. 내 조건 1:1 무료 계산기 바로가기 (회원가입·앱 설치 없음)
위 표는 표준 조건 기준이므로, 내 실제 조건 숫자를 넣으면 3초 만에 나만의 맞춤 손익분기점 영수증이 출력됩니다!

👉 **[무료 3초 계산기 바로가기] ${p.title} 시뮬레이터**:
${targetUrl}

🏠 **[머니핏 전체 6대 생활비 계산기 모음 (${p.category || calcKey})]**:
${calcHubUrl}

---

### 📋 [스마트에디터 ONE HTML 복붙용 직행 버튼 태그]
\`\`\`html
<p><a href="${targetUrl}" target="_blank" rel="noopener noreferrer"><b>👉 [무료 3초 계산기 바로가기] ${p.title} (${targetUrl})</b></a></p>
<p><a href="${calcHubUrl}" target="_blank" rel="noopener noreferrer"><b>🏠 [머니핏 6대 생활비 계산기 공식 포털] (${calcHubUrl})</b></a></p>
\`\`\`
`;
    const filePath = path.join(subDirs.blog, `${kst.dateStr}_comedifarm_blog_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return {
      slot: idx + 1,
      timeSlot,
      presetId: p.id,
      calc: calcKey,
      title: p.title,
      targetUrl,
      calcHubUrl,
      clipMp4: `sns_outbox/${p.id}/clip.mp4`,
      webtoonGrid: `sns_outbox/${p.id}/webtoon-grid.png`,
      filePath
    };
  });

  // 2. moneyfitlab 네이버 공식 카페 (일 5편 — 18시 이후 야간 3편 집중 편성 · 살림백서 + 4컷 웹툰 + 상하단 직행 링크)
  const cafeItems = cafePresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const calcKey = getCalcKey(p);
    const targetUrl = `https://truthofmarket.com/preset/${p.id}`;
    const calcHubUrl = `https://truthofmarket.com/?calc=${calcKey}`;
    const timeSlot = CAFE_TIME_SLOTS[idx] || '20:30 (야간)';
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표', val: '-', value: '-' };
    const m1 = (res.metrics && res.metrics[1]) || { label: '비교 지표', val: '-', value: '-' };
    const m0Val = m0.val || m0.value || '-';
    const m1Val = m1.val || m1.value || '-';
    const tableMd = formatTableMd(p.tableHeaders, p.tableRows);

    const content = `# [1본부/moneyfitlab 네이버 카페 백서 #${idx + 1} (${timeSlot} KST)] ${p.title}

- **발행 카페**: 머니핏 공식 네이버 카페 (\`https://cafe.naver.com/moneyfitlab\`, Club ID \`31805224\`)
- **편성 시간대**: \`${timeSlot} KST\` (18시 이후 야간 유입 골든타임 대응)
- **필수 첨부 미디어**:
  - 🎨 **4컷 동물 웹툰 슬라이드**: \`sns_outbox/${p.id}/slide-1.png ~ slide-4.png\`
  - 🎬 **16초 모션웹툰 클립**: \`sns_outbox/${p.id}/clip.mp4\`
- **직행 유입 링크 (상·하단 2회 필수 탑재)**:
  - 프리셋 직행: ${targetUrl}
  - 계산기 허브: ${calcHubUrl}

---

**[네이버 카페 게시글 제목]**
📊 [살림팩트체크 백서+4컷웹툰] ${p.title} — ${res.headline} (1원 단위 비교표 & 3초 계산기)

**[네이버 카페 본문 원고 (상·하단 직관적 클릭 링크 포함)]**

안녕하세요! 머니핏 살림 팩트체크 연구소입니다 🐾
회원님들이 가장 많이 헷갈려 하시는 **「${p.title}」** 조건에서 실제로 얼마나 비용 차이가 발생하는지 공식 수식으로 계산한 백서와 4컷 요약 웹툰을 공유합니다!

🔥 **[바쁜 회원님들을 위한 3초 핵심 요약 & 무료 계산기 직행 링크]**
• 비교 시나리오: ${p.subtitle || p.title}
• 핵심 결론: **${res.headline}**
• 주요 수치: **${m0.label} ${m0Val}** / **${m1.label} ${m1Val}**

👉 **[무료 3초 계산기 바로가기] 내 조건 숫자 넣고 실시간 손익 영수증 바로 뽑기**:
${targetUrl}

---

📋 **[1. 조건별 실측 비교 데이터표]**
${tableMd}

💡 **[2. 전문가 팩트체크 분석 & 3단계 체크리스트]**
${res.summary}

1) 내 현재 조건(소비전력·요금·체중·예산·차량가)을 먼저 정확히 확인하세요.
2) 눈대중이나 영업사원 권유 대신 위 비교표의 손익분기점 기준을 대조해 보세요.
3) 아래 무료 3초 계산기를 클릭해 내 숫자를 직접 대입하고 최종 영수증을 저장해 두세요!

👉 **[무료 3초 계산기 바로가기] ${p.title} 전용 시뮬레이터**:
${targetUrl}

🏠 **[머니핏 6대 생활비 3초 손익계산기 전체 모음]**:
${calcHubUrl}
`;
    const filePath = path.join(subDirs.cafe, `${kst.dateStr}_moneyfitlab_cafe_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return {
      slot: idx + 1,
      timeSlot,
      presetId: p.id,
      calc: calcKey,
      title: p.title,
      targetUrl,
      calcHubUrl,
      webtoonSlides: `sns_outbox/${p.id}/slide-1.png ~ slide-4.png`,
      clipMp4: `sns_outbox/${p.id}/clip.mp4`,
      filePath
    };
  });

  // 3. 네이버 지식iN (일 6편 — 공식 요약 + slide-3.png + 상하단 직행 링크)
  const jisikinItems = jisikinPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const calcKey = getCalcKey(p);
    const targetUrl = `https://truthofmarket.com/preset/${p.id}`;
    const calcHubUrl = `https://truthofmarket.com/?calc=${calcKey}`;
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표', val: '-', value: '-' };
    const m0Val = m0.val || m0.value || '-';
    const searchQuery = p.keywords ? p.keywords.split(',')[0].trim() : p.title;
    const liveSearchUrl = `https://kin.naver.com/search/noAnswerList.naver?query=${encodeURIComponent(searchQuery)}`;

    const content = `# [1본부/comedifarm 지식iN 미채택 타격 #${idx + 1}] ${p.title}

- **발행 계정**: 네이버 1계정 \`comedifarm\` (Port 9222)
- **실시간 미채택 질문 검색창**: ${liveSearchUrl}
- **첨부 영수증 이미지**: \`sns_outbox/${p.id}/slide-3.png\`
- **유입 유도 직행 링크**: ${targetUrl} / ${calcHubUrl}

---

**[지식iN 복붙용 고밀도 답변 원고]**

질문하신 **${p.subtitle || p.title}** 조건으로 실제 공식 수식을 대입해 정확히 계산해 드립니다.

1. **핵심 결론**: **${res.headline}**
2. **${m0.label}**: **${m0Val}**
3. **상세 계산 근거**: ${res.summary}

👉 **내 세부 조건 넣어서 3초 만에 무료 비교표 뽑아보기**:
${targetUrl}

질문자님의 세부 조건(사용 시간, 기존 요금, 할인율, 체중 등)에 따라 금액이 달라질 수 있으니, 아래 무료 생활금융 3초 계산기에서 직접 숫자를 넣어 비교해 보시는 것을 추천드립니다 (회원가입·설치 없음).

📌 **[무료 3초 계산기 바로가기] ${p.title}**:
${targetUrl}

🏠 **[전체 6대 생활비 3초 계산기 포털]**:
${calcHubUrl}
`;
    const filePath = path.join(subDirs.jisikin, `${kst.dateStr}_jisikin_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, calc: calcKey, title: p.title, targetUrl, calcHubUrl, liveSearchUrl, filePath };
  });

  // 4. 외부 커뮤니티 (일 4편 — 실측 비교표 + webtoon-grid.png + 상하단 직행 링크)
  const communityItems = commPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const calcKey = getCalcKey(p);
    const targetUrl = `https://truthofmarket.com/preset/${p.id}`;
    const calcHubUrl = `https://truthofmarket.com/?calc=${calcKey}`;
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표', val: '-', value: '-' };
    const m0Val = m0.val || m0.value || '-';
    const tableMd = formatTableMd(p.tableHeaders, p.tableRows);

    const content = `# [1본부 외부 커뮤니티 유입 타격 #${idx + 1}] ${p.title}

- **담당**: 1본부 \`🦔 고슴도치 대리\` & \`🐆 치타 본부장\`
- **첨부 웹툰 합본**: \`sns_outbox/${p.id}/webtoon-grid.png\`
- **타겟 유입 URL**: ${targetUrl} / ${calcHubUrl}

---

**[커뮤니티 게시글 원고]**

제목: [정보/웹툰] ${p.title} 직접 수식 넣어서 계산기 돌려본 팩트체크 결과.jpg

${p.subtitle || p.title} 고민 중이라 아예 공식 수식 넣어서 1원 단위로 비교표 뽑아봤습니다.

- **핵심 결론**: **${res.headline}**
- **${m0.label}**: **${m0Val}**
- **요약 분석**: ${res.summary}

👉 **내 조건 넣어서 3초 만에 무료 계산해보기 (상단 바로가기)**:
${targetUrl}

${tableMd}

본인 조건(숫자) 넣어서 3초 만에 손익분기점 영수증 뽑아보고 싶으면 여기서 바로 해보면 됩니다 (회원가입 없는 무료 웹 계산기):
👉 **[무료 3초 계산기 바로가기]**:
${targetUrl}
🏠 **[전체 6대 생활비 계산기 모음]**:
${calcHubUrl}
`;
    const filePath = path.join(subDirs.community, `${kst.dateStr}_community_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, calc: calcKey, title: p.title, targetUrl, calcHubUrl, filePath };
  });

  // 5. 인스타그램 & 쓰레드 (@moneyfit2026 외부유입 — 일 3편: 4컷 웹툰 + clip.mp4 + 직행 링크)
  const snsItems = snsPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const calcKey = getCalcKey(p);
    const targetUrl = `https://truthofmarket.com/preset/${p.id}`;
    const calcHubUrl = `https://truthofmarket.com/?calc=${calcKey}`;
    const webtoonDir = path.join(ROOT_DIR, 'sns_outbox', p.id);

    const content = `# [1본부 인스타·쓰레드 (@moneyfit2026) 웹툰·숏폼 외부유입 #${idx + 1}] ${p.title}

- **발행 계정**: 인스타그램 & 쓰레드 \`@moneyfit2026\` (Port 9222)
- **웹툰 이미지 폴더**: \`sns_outbox/${p.id}/slide-1.png ~ slide-4.png\` & \`webtoon-grid.png\`
- **숏폼 릴스/클립 영상**: \`sns_outbox/${p.id}/clip.mp4\`
- **유입 유도 직행 링크**: ${targetUrl} / ${calcHubUrl}

---

**[쓰레드(Threads) 본문 + 첫 번째 고정 대댓글 외부링크 세트]**

🔥 **[본문 (4컷 웹툰 webtoon-grid.png 또는 clip.mp4 첨부)]**
"${p.subtitle || p.title}, 대충 감으로 결정하면 얼마나 손해 볼까?"
실제 공식 데이터로 3초 영수증 찍어봤더니 결과 실화냐... 😱
👉 **${res.headline}**

여러분은 지금 어떻게 하고 계신가요? 아래 첫 댓글에 내 조건 넣는 3초 무료 계산기 바로가기 링크 걸어뒀습니다! 👇

🔗 **[첫 번째 고정 대댓글 (직관적 외부링크 유도)]**
👉 [무료 3초 계산기 바로가기] 내 조건 넣어서 3초 만에 손익분기점 영수증 뽑기:
${targetUrl}

🏠 [머니핏 6대 생활비 3초 손익계산기 전체 모음]:
${calcHubUrl}
`;
    const filePath = path.join(subDirs.instaThreads, `${kst.dateStr}_sns_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return {
      slot: idx + 1,
      presetId: p.id,
      calc: calcKey,
      title: p.title,
      targetUrl,
      calcHubUrl,
      webtoonDir,
      clipMp4: `sns_outbox/${p.id}/clip.mp4`,
      filePath
    };
  });

  const statusPayload = {
    divisionId: 'DIV1_OUTLINK_HQ',
    divisionName: '제1본부: 홈페이지(truthofmarket.com) 외부유입 · 웹툰/영상 · 카페/블로그 백서 총괄본부',
    accountId: 'comedifarm',
    officialCafeId: 'moneyfitlab',
    officialCafeUrl: 'https://cafe.naver.com/moneyfitlab',
    snsHandle: '@moneyfit2026',
    browserPort: 9222,
    updatedAt: kst.fullStr,
    date: kst.dateStr,
    strictSeparationVerified: true,
    targetDomain: 'https://truthofmarket.com',
    post1800NightWaveEnabled: true,
    scheduleWavesKst: ['08:30', '11:30', '14:30', '18:30', '21:00', '23:00'],
    dailyQuotas: {
      comedifarmBlog: blogItems.length,
      moneyfitlabCafe: cafeItems.length,
      naverJisikin: jisikinItems.length,
      externalCommunity: communityItems.length,
      instaThreads: snsItems.length,
      totalOutlinkAssetsToday: blogItems.length + cafeItems.length + jisikinItems.length + communityItems.length + snsItems.length
    },
    items: {
      comedifarmBlog: blogItems,
      moneyfitlabCafe: cafeItems,
      naverJisikin: jisikinItems,
      externalCommunity: communityItems,
      instaThreads: snsItems
    }
  };

  fs.writeFileSync(DIV1_STATUS_PATH, JSON.stringify(statusPayload, null, 2), 'utf8');

  const boardMd = `# 🏢 [제1본부] 1계정(\`comedifarm\`) · 공식카페(\`moneyfitlab\`) · \`@moneyfit2026\` — \`truthofmarket.com\` 24시간 외부유입 전담 운영보드

- **최종 갱신 시각**: ${kst.fullStr}
- **전담 조직**: \`🐆 치타 본부장 (제1본부장)\` · \`🐝 꿀벌 과장 (홈페이지 전환)\` · \`🦜 앵무새 피디 (웹툰·모션클립·인스타·쓰레드)\` · \`🦔 고슴도치 대리 (comedifarm 블로그·moneyfitlab 카페·지식iN·커뮤니티)\`
- **전담 계정 및 채널**: 네이버 1계정 **\`comedifarm\`** + 공식 카페 **\`moneyfitlab\`** + 인스타/쓰레드 **\`@moneyfit2026\`**
- **핵심 미션**: **모든 원고에 [진짜 유용한 실측 비교표/공식 + 4컷 웹툰(\`slide-1~4.png\`) + 16초 모션영상(\`clip.mp4\`) + 본문 상·하단 2회 이상 직관적 \`https://truthofmarket.com/preset/{slug}\` 클릭 링크] 100% 탑재 (18시 이후 야간 다회차 집중 가동!)**

---

## 🎯 오늘 생성된 제1본부 5대 외부유입 타격 큐 (총 ${statusPayload.dailyQuotas.totalOutlinkAssetsToday}건 — 전량 상·하단 \`truthofmarket.com\` 직행 링크 2회+ & 웹툰/영상 탑재)

### ① 1계정 \`comedifarm\` 블로그 (일 6편 — 18시 이후 야간 3회차 포함 · 모션영상+4컷웹툰+비교표)
${blogItems.map(x => `- **[#${x.slot} / ${x.timeSlot}] ${x.title}** ➔ 직행 링크: \`${x.targetUrl}\` & \`${x.calcHubUrl}\` | 영상: \`${x.clipMp4}\` ([원고 열기](division1_comedifarm_outbox/1_comedifarm_blog/${path.basename(x.filePath)}))`).join('\n')}

### ② 공식 네이버 카페 \`moneyfitlab\` (일 5편 — 18시 이후 야간 3회차 집중 · 살림백서+4컷웹툰)
${cafeItems.map(x => `- **[#${x.slot} / ${x.timeSlot}] ${x.title}** ➔ 직행 링크: \`${x.targetUrl}\` & \`${x.calcHubUrl}\` | 웹툰: \`${x.webtoonSlides}\` ([원고 열기](division1_comedifarm_outbox/2_moneyfitlab_cafe/${path.basename(x.filePath)}))`).join('\n')}

### ③ 네이버 지식iN 실시간 미채택 질문 스나이핑 (일 6편)
${jisikinItems.map(x => `- **[#${x.slot}] ${x.title}** ➔ [미채택 질문 검색창](${x.liveSearchUrl}) | 직행 링크: \`${x.targetUrl}\``).join('\n')}

### ④ 외부 커뮤니티 백서 & 웹툰 타격 (일 4편)
${communityItems.map(x => `- **[#${x.slot}] ${x.title}** ➔ 직행 링크: \`${x.targetUrl}\` & \`${x.calcHubUrl}\``).join('\n')}

### ⑤ 인스타그램 & 쓰레드 (\`@moneyfit2026\`) 4컷 웹툰 & 숏폼 영상 유입 (일 3편)
${snsItems.map(x => `- **[#${x.slot}] ${x.title}** ➔ 웹툰/영상: \`sns_outbox/${x.presetId}/\` (\`clip.mp4\`) | 직행 링크: \`${x.targetUrl}\``).join('\n')}
`;

  fs.writeFileSync(DIV1_BOARD_PATH, boardMd, 'utf8');
  return statusPayload;
}

if (require.main === module) {
  const res = generateDivision1DailyPack();
  console.log('===============================================================');
  console.log(' 🏢 [제1본부] comedifarm · moneyfitlab · @moneyfit2026 외부유입 엔진 가동 완료');
  console.log('===============================================================');
  console.log(`  ✓ 전담 계정/채널 : comedifarm 블로그 + moneyfitlab 카페 + @moneyfit2026 (Port ${res.browserPort})`);
  console.log(`  ✓ 유입 타겟 도메인: ${res.targetDomain} (상·하단 직관적 클릭 링크 2회+ 100% 삽입)`);
  console.log(`  ✓ 금일 생성 큐   : 총 ${res.dailyQuotas.totalOutlinkAssetsToday}건 (블로그 ${res.dailyQuotas.comedifarmBlog} / 카페 ${res.dailyQuotas.moneyfitlabCafe} / 지식iN ${res.dailyQuotas.naverJisikin} / 커뮤니티 ${res.dailyQuotas.externalCommunity} / 인스타·쓰레드 ${res.dailyQuotas.instaThreads})`);
  console.log(`  ✓ 운영보드 저장  : ${DIV1_BOARD_PATH}`);
}

module.exports = { generateDivision1DailyPack };
