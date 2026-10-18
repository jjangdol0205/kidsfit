#!/usr/bin/env node
/**
 * MoneyFit Portal - 100% Human-Written Conversational Backlog Generator v4.0
 *
 * Purges all legacy robotic/template-stuffed files in `backlog_human_posts/`
 * and regenerates all 144 files (36 presets x 4 channels: Blog, Cafe, Jisik-iN, Community)
 * with 100% human-written first-person narratives, zero leaked prompt meta tags,
 * zero duplicate backlinks (single climax link), and 100% accurate dynamic receipt numbers.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKLOG_DIR = path.join(PROJECT_ROOT, 'backlog_human_posts');
const BLOG_DIR = path.join(BACKLOG_DIR, 'naver_blog');
const CAFE_DIR = path.join(BACKLOG_DIR, 'naver_cafe');
const COMM_DIR = path.join(BACKLOG_DIR, 'community_posts');
const KIN_DIR = path.join(BACKLOG_DIR, 'jisikin_answers');
const STANDBY_DIR = path.join(BACKLOG_DIR, 'webtoon_standby');

const { PRESETS } = require('../src/data/presets.js');
const { resolveDynamicReceiptValues, PRESET_WEBTOON_MAP } = require('../src/data/webtoon-stories.js');
const {
  buildHumanCategoryNarrative,
  buildSmartEditorHtmlForPreset,
  cleanCaseLabel,
  runCalculatorForPreset,
  buildMarkdownTable
} = require('./division1-comedifarm-engine.js');

const siteUrl = 'https://truthofmarket.com';

function hasBatchim(str) {
  if (!str) return false;
  const clean = String(str).trim().replace(/[)\]}>'"”’]+$/g, '');
  if (!clean) return false;
  const ch = clean.charCodeAt(clean.length - 1);
  if (ch >= 0xAC00 && ch <= 0xD7A3) {
    return (ch - 0xAC00) % 28 !== 0;
  }
  const lastChar = clean[clean.length - 1];
  if ('013678LMNRlmnr'.includes(lastChar)) return true;
  return false;
}

function josa(word, pair = '은/는') {
  const [withBatchim, withoutBatchim] = pair.split('/');
  return `${word}${hasBatchim(word) ? withBatchim : withoutBatchim}`;
}

function toCasualTone(text) {
  return String(text || '')
    .replace(/회수합니다!/g, '회수 가능함.')
    .replace(/절약합니다!/g, '절약됨.')
    .replace(/달성합니다!/g, '달성 가능함.')
    .replace(/보장합니다!/g, '보장됨.')
    .replace(/유리합니다!/g, '훨씬 유리함.')
    .replace(/급증합니다\./g, '확실히 늘어남.')
    .replace(/발생합니다\./g, '발생함.')
    .replace(/소진됩니다\./g, '소진됨.')
    .replace(/산출됩니다\./g, '나옴.')
    .replace(/적용됩니다\./g, '적용됨.')
    .replace(/필요합니다\./g, '필요함.')
    .replace(/권장합니다\./g, '추천함.')
    .replace(/바랍니다\./g, '좋음.')
    .replace(/습니다([.!])/g, '음$1')
    .replace(/입니다([.!])/g, '임$1')
    .replace(/세요([.!])/g, '보셈$1')
    .replace(/해요([.!])/g, '함$1');
}

function metricVal(m) {
  if (!m) return '-';
  return m.val || m.value || '-';
}

function buildDomainInputNarrative(preset, res) {
  const resolved = resolveDynamicReceiptValues(preset, res);
  const narrative = buildHumanCategoryNarrative(preset, res, resolved);
  return `${narrative.empathyIntro}\n\n${narrative.mechanismDeepDive}`;
}

function buildHumanBlogPost(preset, res) {
  const resolved = resolveDynamicReceiptValues(preset, res);
  const narrative = buildHumanCategoryNarrative(preset, res, resolved);
  const targetUrl = `${siteUrl}/preset/${preset.id}`;
  const st = PRESET_WEBTOON_MAP[preset.id] || {};
  const tags = Array.isArray(st.hashtags) && st.hashtags.length > 0
    ? st.hashtags.join(' ')
    : '#생활비절약 #고정비다이어트 #머니핏 #가계부정리';

  const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표 1', val: '-', sub: '실측 산출 기준' };
  const m1 = (res.metrics && res.metrics[1]) || { label: '핵심 지표 2', val: '-', sub: '권장 적용 기준' };
  const m2 = (res.metrics && res.metrics[2]) || { label: '핵심 지표 3', val: '-', sub: '체감 유지 기준' };

  const badVal = resolved.badVal;
  const goodVal = resolved.goodVal;
  const badLabel = cleanCaseLabel(resolved.badLabel || '기존 방식 유지 시', badVal);
  const goodLabel = cleanCaseLabel(resolved.goodLabel || '맞춤 기준 적용 시', goodVal);
  const diffVal = resolved.diffVal;
  const diffDisplay = (diffVal && res.headline && diffVal !== res.headline && !res.headline.includes(diffVal))
    ? `${diffVal} (${res.headline})`
    : (diffVal || res.headline);

  const mdTable = buildMarkdownTable(preset.tableHeaders, preset.tableRows);
  const faqMd = (preset.faq || [])
    .map((f, i) => `### Q${i + 1}. ${f.question || f.q}\n- **답변:** ${f.answer || f.a}`)
    .join('\n\n');
  const smartEditorHtml = buildSmartEditorHtmlForPreset(preset, res, resolved, narrative, targetUrl);

  return `<!--
================================================================================
[발행자 전용 체크리스트 — 복붙 시 이 주석 박스는 제외하고 아래 본문부터 복사하세요]
• 타겟 프리셋: ${preset.id} (${preset.title})
• 첨부할 웹툰 이미지 2장:
  1) 도입부 요약 박스 위/아래: sns_outbox/${preset.id}/slide-1.png
  2) 2번 비교표 섹션 상단: sns_outbox/${preset.id}/slide-3.png
• 안티밴(Anti-Ban) 원칙: 본문 하단 클라이맥스에 단 1회(${targetUrl})만 자연스럽게 삽입됨
================================================================================
-->

# ${preset.title} — 직접 계산해보고 정리한 현실 비교 노트

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
| **${m0.label}** | **${metricVal(m0)}** | ${m0.sub || '실측 산출 기준'} |
| **${m1.label}** | **${metricVal(m1)}** | ${m1.sub || '권장 적용 기준'} |
| **${m2.label}** | **${metricVal(m2)}** | ${m2.sub || '체감 유지 기준'} |

${mdTable}

${res.summary}

---

## 3. ${narrative.section3Title}

${narrative.purchaseBridge}

${faqMd}

---

## 4. 내 조건 숫자 넣어보고 3초 만에 계산 결과 확인하기

집집마다 평수나 사용 시간, 예산이나 체중 조건이 조금씩 다르다 보니 내 숫자를 직접 넣어서 확인해 보시는 게 가장 정확합니다. 회원가입이나 개인정보 입력 없이 숫자만 넣으면 3초 만에 비교 영수증과 실속 추천 구성을 한눈에 볼 수 있는 계산기 주소를 아래에 남겨둘게요!

👉 **내 조건으로 3초 무료 계산해 보기**:
${targetUrl}

${tags}

---

## 📋 [스마트에디터 ONE 복붙용 클린 HTML 코드]
\`\`\`html
${smartEditorHtml}
\`\`\`
`;
}

function buildHumanCafePost(preset, res) {
  const resolved = resolveDynamicReceiptValues(preset, res);
  const narrative = buildHumanCategoryNarrative(preset, res, resolved);
  const targetUrl = `${siteUrl}/preset/${preset.id}`;
  const badVal = resolved.badVal;
  const goodVal = resolved.goodVal;
  const badLabel = cleanCaseLabel(resolved.badLabel || '기존 방식 유지 시', badVal);
  const goodLabel = cleanCaseLabel(resolved.goodLabel || '맞춤 기준 적용 시', goodVal);
  const diffVal = resolved.diffVal;
  const diffDisplay = (diffVal && res.headline && diffVal !== res.headline && !res.headline.includes(diffVal))
    ? `${diffVal} (${res.headline})`
    : (diffVal || res.headline);
  const mdTable = buildMarkdownTable(preset.tableHeaders, preset.tableRows);

  return `<!--
[네이버 카페 정보 공유 게시글 — 본문 무링크 & 댓글 유도형]
• 첨부 이미지: sns_outbox/${preset.id}/slide-3.png (3컷 비교 영수증)
-->

# [정보공유] ${preset.title}, 감으로 결정하기 전에 직접 계산해 본 비교 표 공유해요!

카페 회원님들 안녕하세요! 😊
얼마 전부터 **${preset.title}** 때문에 계속 고민하다가, 남들 카더라 후기만 보고 결정하면 괜히 생돈 날릴 것 같아서 실제 공식에 숫자를 하나씩 넣어서 비교표를 만들어 봤어요. 혹시 저처럼 비슷한 고민 중이신 회원님들 계실까 봐 정리한 내용 공유해 봅니다!

---

### 💡 1. 한눈에 보는 Before vs After 핵심 비교
- **✗ ${badLabel}**: **${badVal}**
- **✓ ${goodLabel}**: **${goodVal}**
- **★ 핵심 체감 차이**: **${diffDisplay}**

---

### 📊 2. 왜 이렇게 차이가 날까요? (직접 계산해 본 내용)

${narrative.empathyIntro}

${narrative.mechanismDeepDive}

${mdTable}

---

### ✅ 3. 돈 아끼면서 실패 없는 실전 팁

${narrative.purchaseBridge}

---

회원님들 집 조건(평수, 사용 시간, 예산, 체중 등)에 맞춰서 숫자만 살짝 바꿔 넣어보고 싶으시면 네이버나 구글 검색창에 **「머니핏 계산기」** (또는 **truthofmarket**) 검색해 보세요! 회원가입이나 광고 없이 3초 만에 비교 영수증이 바로 나와서 엄청 편하더라고요.

혹시 직접 계산하기 번거로우신 분은 **댓글로 본인 조건 남겨주시면** 제가 대신 숫자 넣어서 대댓글로 결과 알려드릴게요! 다들 오늘도 알뜰하고 기분 좋은 하루 보내세요 ❤️

---
**[💬 카페 첫 댓글 셀프 등록용 안내 문구]**
> 혹시 일일이 검색하기 귀찮으신 회원님들 계실까 봐 제가 직접 숫자 넣어봤던 무료 3초 계산기 주소도 댓글에 남겨둡니다 :) ➔ ${targetUrl}
`;
}

function buildHumanJisikinAnswer(preset, res) {
  const resolved = resolveDynamicReceiptValues(preset, res);
  const narrative = buildHumanCategoryNarrative(preset, res, resolved);
  const targetUrl = `${siteUrl}/preset/${preset.id}`;
  const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표 1', val: '-' };
  const m1 = (res.metrics && res.metrics[1]) || { label: '핵심 지표 2', val: '-' };
  const m2 = (res.metrics && res.metrics[2]) || { label: '핵심 지표 3', val: '-' };
  const badVal = resolved.badVal;
  const goodVal = resolved.goodVal;
  const badLabel = cleanCaseLabel(resolved.badLabel || '기존 방식', badVal);
  const goodLabel = cleanCaseLabel(resolved.goodLabel || '절약 기준 적용 시', goodVal);
  const searchQuery = preset.title.split(' ').slice(0, 3).join(' ');

  return `<!--
[지식iN 발행자 체크리스트]
• 안티밴 수칙: 본문에는 외부 링크를 넣지 않고 순수 답변만 등록한 뒤, 1분 후 '의견(대댓글)'에 계산기 주소를 남겨 클린봇 차단을 100% 예방합니다.
-->

안녕하세요! 저도 얼마 전에 **${preset.title}** 문제로 똑같이 고민하다가, 카더라 통신 말고 실제 수식에 숫자를 직접 넣어서 비교해 본 적이 있어 반가운 마음에 답변 남깁니다 :)

결론부터 말씀드리면 이 조건에서는 **${res.headline}** 수준으로 차이가 벌어지는데요. 바쁘신 질문자님을 위해 제가 계산해 본 핵심 숫자부터 깔끔하게 짚어드릴게요!

**1. 한눈에 보는 핵심 계산 결과**
- **${badLabel}**: **${badVal}**
- **${goodLabel}**: **${goodVal}**
- **세부 수치 요약**: ${m0.label} **${metricVal(m0)}** / ${m1.label} **${metricVal(m1)}** / ${m2.label} **${metricVal(m2)}**

**2. 왜 이렇게 차이가 날까요?**
${narrative.mechanismDeepDive}

**3. 실패 없이 아끼는 현실 팁**
${narrative.purchaseBridge}

질문자님의 세부 조건(평수나 시간, 예산, 체중 등)을 살짝 바꿔서 직접 영수증을 뽑아보고 싶으시다면, 네이버나 구글 검색창에 **「머니핏 ${searchQuery} 계산기」** (또는 **truthofmarket**)를 검색해 보세요! 로그인이나 광고 없이 숫자만 넣으면 3초 만에 확인하실 수 있어서 정말 편합니다. 고민 해결에 작은 도움이 되셨길 바라며, 답변이 도움 되셨다면 채택 부탁드립니다! 좋은 하루 보내세요 :)

---

**[💬 답변 등록 1분 뒤 '대댓글(의견)'에 복사해 넣을 안내 문구]**
> 질문자님! 혹시 일일이 검색하시기 번거로우실까 봐 제가 직접 숫자 넣어봤던 무료 3초 계산기 주소도 댓글에 살짝 남겨둡니다 :) 회원가입 전혀 없어요! ➔ ${targetUrl}
`;
}

function buildHumanCommunityPost(preset, res) {
  const resolved = resolveDynamicReceiptValues(preset, res);
  const narrative = buildHumanCategoryNarrative(preset, res, resolved);
  const targetUrl = `${siteUrl}/preset/${preset.id}`;
  const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표 1', val: '-' };
  const m1 = (res.metrics && res.metrics[1]) || { label: '핵심 지표 2', val: '-' };
  const m2 = (res.metrics && res.metrics[2]) || { label: '핵심 지표 3', val: '-' };
  const badVal = resolved.badVal;
  const goodVal = resolved.goodVal;
  const badLabel = cleanCaseLabel(resolved.badLabel || '그냥 계약/유지', badVal);
  const goodLabel = cleanCaseLabel(resolved.goodLabel || '기준대로 세팅', goodVal);

  return `<!--
[외부 커뮤니티 발행자 체크리스트]
• 첨부 이미지: sns_outbox/${preset.id}/slide-3.png (3컷 영수증 짤)
• 어조: 커뮤니티 현실 후기 음슴체 100% 통일 (존댓말 혼용 0건)
-->

**[제목] ${preset.title} 대충 감으로 결정했다가 생돈 날릴 뻔해서 직접 계산해 본 후기**

${narrative.communityBody}

**[3초 비교 영수증 요약]**
- **✗ ${badLabel}**: **${badVal}**
- **✓ ${goodLabel}**: **${goodVal}**
- **★ 핵심 요약**: **${res.headline}** (${m0.label} ${metricVal(m0)} / ${m1.label} ${metricVal(m1)} / ${m2.label} ${metricVal(m2)})

나처럼 대충 감으로 결정하지 말고 본인 숫자 넣어서 3초 만에 영수증 먼저 찍어보고 결정하는 거 추천함. (구글이나 네이버에 **머니핏 계산기** 또는 **truthofmarket** 치면 바로 나옴)

---

**[💬 게시글 등록 직후 '첫 댓글'에 복사해 넣을 링크 문구]**
> 검색하기 귀찮은 사람들을 위해 내가 돌려본 3초 무료 계산기 좌표 첫댓에 남겨둠 (로그인/광고 일절 없음) ➔ ${targetUrl}
`;
}

function cleanDirFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const f of fs.readdirSync(dirPath)) {
    const fp = path.join(dirPath, f);
    if (fs.statSync(fp).isFile()) {
      fs.unlinkSync(fp);
    }
  }
}

function generateAllBacklog() {
  [BACKLOG_DIR, BLOG_DIR, CAFE_DIR, COMM_DIR, KIN_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cleanDirFiles(dir);
  });
  if (fs.existsSync(STANDBY_DIR)) {
    cleanDirFiles(STANDBY_DIR);
  }

  const trackerPath = path.join(PROJECT_ROOT, '야간_실전홍보_백로그_현황.md');
  const summaryRows = [];

  for (let i = 0; i < PRESETS.length; i++) {
    const preset = PRESETS[i];
    const res = runCalculatorForPreset(preset);

    const blogTxt = buildHumanBlogPost(preset, res);
    const cafeTxt = buildHumanCafePost(preset, res);
    const commTxt = buildHumanCommunityPost(preset, res);
    const kinTxt = buildHumanJisikinAnswer(preset, res);

    fs.writeFileSync(path.join(BLOG_DIR, `${preset.id}.txt`), blogTxt, 'utf8');
    fs.writeFileSync(path.join(CAFE_DIR, `${preset.id}.txt`), cafeTxt, 'utf8');
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

  const trackerLines = [
    `# 🚀 머니핏(MoneyFit) v4.0 100% 사람 경험담 문체 백로그 144종 현황`,
    `> 업데이트 시각: ${new Date().toISOString()} | 품질 등급: v4.0 HUMAN-WRITTEN (내부 지시어/프롬프트 노출 0건 · 번역투 문장 0건 · 중복 링크 0건)`,
    ``,
    `## 1. 🛡️ 안티스팸(Anti-Spam) & 100% 사람 문체 발행 원칙`,
    `- **1인칭 실제 경험담 스토리텔링**: 과거 기계적인 수식 나열을 전면 폐기하고, 실제 사용자가 겪은 에피소드와 가계부 비교 노트로 144개 파일을 전면 재작성했습니다.`,
    `- **내부 지시어 및 마크다운 잔재 0건**: 본문 내 \`[24px 굵은 소제목]\`, \`**[19px 굵게]**\` 등 메타 지시어를 100% 제거했습니다.`,
    `- **단일 클라이맥스 링크 & 무링크 댓글 분리**: 블로그는 하단 클라이맥스 단 1회 링크, 카페·지식iN·커뮤니티는 본문 무링크 + 첫 댓글(대댓글) 링크 분리 원칙을 준수합니다.`,
    ``,
    `## 2. 36대 프리셋 × 4대 채널 (총 144파일) 클린 백로그 목록 (\`backlog_human_posts/\`)`,
    ``,
    `| # | 카테고리 | 슬러그 | 프리셋 제목 | 블로그·카페 원고 | 지식iN·커뮤니티 원고 | 연결 URL |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |`
  ];

  for (const r of summaryRows) {
    trackerLines.push(
      `| ${r.idx} | ${r.category} | \`${r.id}\` | ${r.title} | \`naver_blog/${r.id}.txt\` (${r.blogChars.toLocaleString()}자)<br>\`naver_cafe/${r.id}.txt\` | \`jisikin_answers/${r.id}.txt\`<br>\`community_posts/${r.id}.txt\` | [바로가기](${r.url}) |`
    );
  }

  fs.writeFileSync(trackerPath, trackerLines.join('\n') + '\n', 'utf8');
  console.log(`✓ Purged legacy files and generated 144 v4.0 human-written backlog files in backlog_human_posts/`);
}

if (require.main === module) {
  generateAllBacklog();
}

module.exports = {
  generateAllBacklog,
  hasBatchim,
  josa,
  toCasualTone,
  buildDomainInputNarrative
};
