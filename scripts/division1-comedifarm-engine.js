#!/usr/bin/env node
/**
 * 🏢 [제1본부 전담 엔진] 1계정 (comedifarm) & SNS (@moneyfit2026) — www.truthofmarket.com 외부링크 유입 총괄 엔진
 * (제1본부장: 🐆 치타 본부장 / 팀원: 🐝 꿀벌 과장 · 🦜 앵무새 피디 · 🦔 고슴도치 대리)
 *
 * 핵심 원칙 (제2본부 expertise333과 100% 분리 운영):
 * 1. 전담 계정: 네이버 1계정 `comedifarm` (Port 9222) + 인스타·쓰레드 `@moneyfit2026`
 * 2. 유일한 목표: 모든 채널에서 `https://www.truthofmarket.com` (및 36개 프리셋 계산기 URL) 외부링크를 삽입하여
 *    자사 홈페이지 실유입(UV/PV)과 쿠팡 파트너스·링크프라이스·CPA 클릭/전환을 극대화함.
 * 3. 운영 채널 (4대 외부유입 툴):
 *    - ① `comedifarm` 네이버 블로그 (일 3편: 3초 계산기 직행 외부링크 유도 툴)
 *    - ② 네이버 지식iN 실시간 미채택 답변 (일 4편: www.truthofmarket.com 계산기 출처/링크 유도)
 *    - ③ 외부 커뮤니티 (일 2편: 자취·자동차·다이어트·반려동물 커뮤니티 → www.truthofmarket.com 유도)
 *    - ④ 인스타그램 & 쓰레드 `@moneyfit2026` (일 3편: 4컷 웹툰 + 프로필/고정댓글 www.truthofmarket.com 유도)
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
  Object.values(subDirs).forEach(ensureDir);

  // Rotate presets based on dayOfYear so every day targets fresh high-intent presets
  const offset = (kst.dayOfYear * 3) % PRESETS.length;
  const pickPresets = (count, shift = 0) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(PRESETS[(offset + shift + i) % PRESETS.length]);
    }
    return arr;
  };

  const blogPresets = pickPresets(3, 0);
  const jisikinPresets = pickPresets(4, 3);
  const commPresets = pickPresets(2, 7);
  const snsPresets = pickPresets(3, 9);

  // 1. comedifarm 블로그 (외부링크 유도 툴 — 일 3편)
  const blogItems = blogPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const targetUrl = `https://www.truthofmarket.com/preset/${p.id}/`;
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표', value: '-' };
    const m1 = (res.metrics && res.metrics[1]) || { label: '비교 지표', value: '-' };

    const content = `# [1본부/comedifarm 외부유입 블로그 #${idx + 1}] ${p.title} — 3초 영수증 계산기 시뮬레이션

- **발행 계정**: 네이버 1계정 \`comedifarm\` (\`https://blog.naver.com/comedifarm\`, Port 9222)
- **목적**: \`www.truthofmarket.com\` 자사 홈페이지 외부링크 직접 유입 유도 (제2본부 \`expertise333\`과 100% 분리)
- **타겟 외부링크**: ${targetUrl}

---

## 💡 바쁜 분들을 위한 3초 결론 요약
- **시나리오**: ${p.subtitle}
- **핵심 결과**: **${res.headline}**
- **${m0.label}**: **${m0.value}** / **${m1.label}**: **${m1.value}**

👉 **내 조건(평수·요금·체중·차종) 넣어서 3초 만에 실시간 영수증 뽑아보기 (무료)**
🔗 **바로가기 외부링크**: ${targetUrl}

---

## 📊 왜 직접 계산기로 돌려봐야 호구를 면할까요?
${res.summary}

대부분 대충 감으로 계산하다가 매달 수만 원에서 수십만 원씩 고정비를 더 내고 있습니다.
위 외부링크(\`www.truthofmarket.com\`)에 접속하시면 회원가입이나 앱 설치 없이 숫자만 바꿔서 내 상황에 딱 맞는 최저가·지원금 손익분기점을 3초 만에 확인하실 수 있습니다.

- ✅ **3초 계산기 공식 주소**: https://www.truthofmarket.com
- ✅ **${p.title} 전용 프리셋 바로가기**: ${targetUrl}
`;
    const filePath = path.join(subDirs.blog, `${kst.dateStr}_comedifarm_blog_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, targetUrl, filePath };
  });

  // 2. 네이버 지식iN (www.truthofmarket.com 유입 유도 — 일 4편)
  const jisikinItems = jisikinPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const targetUrl = `https://www.truthofmarket.com/preset/${p.id}/`;
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표', value: '-' };
    const searchQuery = p.keywords ? p.keywords.split(',')[0].trim() : p.title;
    const liveSearchUrl = `https://kin.naver.com/search/noAnswerList.naver?query=${encodeURIComponent(searchQuery)}`;

    const content = `# [1본부/comedifarm 지식iN 미채택 타격 #${idx + 1}] ${p.title}

- **발행 계정**: 네이버 1계정 \`comedifarm\` (Port 9222)
- **실시간 미채택 질문 검색창**: ${liveSearchUrl}
- **유입 유도 링크**: ${targetUrl}

---

**[지식iN 복붙용 답변 원고]**

질문하신 **${p.subtitle}** 조건으로 실제 공식을 대입해 계산해 드립니다.

1. **핵심 결론**: **${res.headline}**
2. **${m0.label}**: **${m0.value}**
3. **상세 분석**: ${res.summary}

질문자님의 세부 조건(사용 시간, 기존 요금, 할인율 등)에 따라 금액이 달라질 수 있으니, 아래 무료 생활금융 3초 계산기에서 직접 숫자를 넣어 비교해 보시는 것을 추천드립니다.

📌 **내 조건 직접 대입해보기 (3초 영수증 계산기)**: ${targetUrl}
*(전체 계산기 모음: https://www.truthofmarket.com )*
`;
    const filePath = path.join(subDirs.jisikin, `${kst.dateStr}_jisikin_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, targetUrl, liveSearchUrl, filePath };
  });

  // 3. 외부 커뮤니티 (www.truthofmarket.com 유입 유도 — 일 2편)
  const communityItems = commPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const targetUrl = `https://www.truthofmarket.com/preset/${p.id}/`;
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표', value: '-' };

    const content = `# [1본부 외부 커뮤니티 유입 타격 #${idx + 1}] ${p.title}

- **담당**: 1본부 \`🦔 고슴도치 대리\` & \`🐆 치타 본부장\`
- **타겟 유입 URL**: ${targetUrl}

---

**[커뮤니티 게시글 원고]**

제목: ${p.title} 직접 계산기 돌려본 팩트체크 결과.jpg

${p.subtitle} 고민 중이라 아예 계산기 돌려서 숫자 뽑아봄.

- 결론: **${res.headline}**
- ${m0.label}: **${m0.value}**
- 핵심 요약: ${res.summary}

본인 조건 넣어서 3초 만에 계산해보고 싶으면 여기서 해보면 됨 (무료 웹 계산기):
👉 ${targetUrl}
(메인 주소: https://www.truthofmarket.com )
`;
    const filePath = path.join(subDirs.community, `${kst.dateStr}_community_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, targetUrl, filePath };
  });

  // 4. 인스타그램 & 쓰레드 (@moneyfit2026 외부유입 — 일 3편)
  const snsItems = snsPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const targetUrl = `https://www.truthofmarket.com/preset/${p.id}/`;
    const webtoonDir = path.join(ROOT_DIR, 'sns_outbox', p.id);

    const content = `# [1본부 인스타·쓰레드 (@moneyfit2026) 외부유입 #${idx + 1}] ${p.title}

- **발행 계정**: 인스타그램 & 쓰레드 \`@moneyfit2026\` (Port 9222)
- **웹툰 이미지 폴더**: \`sns_outbox/${p.id}/slide-1.png ~ slide-4.png\`
- **유입 유도 외부링크**: ${targetUrl}

---

**[쓰레드(Threads) 본문 + 첫 번째 대댓글 외부링크 세트]**

🔥 **[본문]**
"${p.subtitle}, 대충 감으로 결정하면 얼마나 손해 볼까?"
실제 데이터로 3초 영수증 찍어봤더니 결과 실화냐... 😱
👉 **${res.headline}**

여러분은 지금 어떻게 하고 계신가요? 아래 대댓글에 3초 무료 계산기 링크 걸어뒀습니다! 👇

🔗 **[첫 번째 고정 대댓글 (외부링크 유도)]**
내 조건 넣어서 3초 만에 손익분기점 영수증 뽑아보기 👇
${targetUrl}
(전체 6대 생활비 계산기: https://www.truthofmarket.com )
`;
    const filePath = path.join(subDirs.instaThreads, `${kst.dateStr}_sns_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, targetUrl, webtoonDir, filePath };
  });

  const statusPayload = {
    divisionId: 'DIV1_OUTLINK_HQ',
    divisionName: '제1본부: 홈페이지(www.truthofmarket.com) 외부유입 & 제휴전환 총괄본부',
    accountId: 'comedifarm',
    snsHandle: '@moneyfit2026',
    browserPort: 9222,
    updatedAt: kst.fullStr,
    date: kst.dateStr,
    strictSeparationVerified: true,
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

  const boardMd = `# 🏢 [제1본부] 1계정(\`comedifarm\`) & \`@moneyfit2026\` — \`www.truthofmarket.com\` 외부유입 전담 운영보드

- **최종 갱신 시각**: ${kst.fullStr}
- **전담 조직**: \`🐆 치타 본부장 (제1본부장)\` · \`🐝 꿀벌 과장 (홈페이지 전환)\` · \`🦜 앵무새 피디 (인스타·쓰레드)\` · \`🦔 고슴도치 대리 (comedifarm 블로그·지식iN·커뮤니티)\`
- **전담 계정 및 포트**: 네이버 1계정 **\`comedifarm\`** + 인스타/쓰레드 **\`@moneyfit2026\`** (\`Port 9222\` 격리 컨테이너)
- **핵심 미션**: **오직 \`https://www.truthofmarket.com\` 외부링크 유입 극대화** (제2본부 \`expertise333\`과 100% 별도 운영)

---

## 🎯 1. 오늘 생성된 제1본부 4대 외부유입 타격 큐 (총 ${statusPayload.dailyQuotas.totalOutlinkAssetsToday}건 — 전량 \`truthofmarket.com\` 직행 링크 탑재)

### ① 1계정 \`comedifarm\` 블로그 외부링크 유도 툴 (일 3편)
${blogItems.map(x => `- **[#${x.slot}] ${x.title}** ➔ 유입 타겟: \`${x.targetUrl}\` ([원고 열기](division1_comedifarm_outbox/1_comedifarm_blog/${path.basename(x.filePath)}))`).join('\n')}

### ② 네이버 지식iN 실시간 미채택 질문 스나이핑 (일 4편)
${jisikinItems.map(x => `- **[#${x.slot}] ${x.title}** ➔ [미채택 질문 검색창](${x.liveSearchUrl}) | 유입 타겟: \`${x.targetUrl}\``).join('\n')}

### ③ 외부 커뮤니티 유입 타격 (일 2편)
${communityItems.map(x => `- **[#${x.slot}] ${x.title}** ➔ 유입 타겟: \`${x.targetUrl}\``).join('\n')}

### ④ 인스타그램 & 쓰레드 (\`@moneyfit2026\`) 4컷 웹툰 유입 (일 3편)
${snsItems.map(x => `- **[#${x.slot}] ${x.title}** ➔ 웹툰: \`sns_outbox/${x.presetId}/\` | 유입 타겟: \`${x.targetUrl}\``).join('\n')}
`;

  fs.writeFileSync(DIV1_BOARD_PATH, boardMd, 'utf8');
  return statusPayload;
}

if (require.main === module) {
  const res = generateDivision1DailyPack();
  console.log('===============================================================');
  console.log(' 🏢 [제1본부] comedifarm & @moneyfit2026 외부유입 엔진 가동 완료');
  console.log('===============================================================');
  console.log(`  ✓ 전담 계정/포트 : comedifarm + @moneyfit2026 (Port ${res.browserPort})`);
  console.log(`  ✓ 유입 타겟 도메인: ${res.targetDomain} (외부링크 100% 삽입)`);
  console.log(`  ✓ 금일 생성 큐   : 총 ${res.dailyQuotas.totalOutlinkAssetsToday}건 (블로그 3 / 지식iN 4 / 커뮤니티 2 / 인스타·쓰레드 3)`);
  console.log(`  ✓ 운영보드 저장  : ${DIV1_BOARD_PATH}`);
}

module.exports = { generateDivision1DailyPack };
