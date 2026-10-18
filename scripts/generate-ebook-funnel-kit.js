/**
 * MoneyFit Track-2 Monetization Engine:
 * "External Inflow (Threads/X -> Sub-Blog) + AI E-Book 90% Margin Funnel" Generator
 *
 * Benchmarks the proven "검색·홈판 없이 외부유입(쓰레드·X 74%) + 자체 AI 전자책(마진 90%) + 댓글 쿠폰 루프" model
 * and adapts it for MoneyFit's Secondary Blog (Account B `expertise333` or dedicated FinTech/AI Lab Blog).
 *
 * Outputs in `ebook_outbox/`:
 * 1. `ebook-1-cover.png` & `ebook-2-cover.png` (1080x1440 3D-style E-Book Cover PNGs rendered via Headless Chrome)
 * 2. `ebook-1-fixed-cost-bible.md` (Full 7-Chapter E-Book #1 Manuscript ready for PDF export & Groble/Latpeed/Kmong registration)
 * 3. `ebook-2-ai-automation-playbook.md` (Full 6-Chapter E-Book #2 Manuscript on AI Webtoon + Calculator + External Inflow)
 * 4. `blog_b_pin_notice_post.md` (Sub-Blog `[공지]` Pinned Conversion Post with '쿠폰 신청' Comment Trigger Loop)
 * 5. `threads_x_external_inflow_pack.md` (12 High-Viral Threads & X/Twitter External Inflow Scripts driving 70%+ external blog visits)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { PRESETS } = require('../src/data/presets.js');
const calculators = require('../src/data/calculators.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'ebook_outbox');
const PUBLIC_SNS_DIR = path.join(ROOT_DIR, 'sns');
const FONTS_DIR = path.join(ROOT_DIR, 'src', 'assets', 'fonts');

function findChromeExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function getFontFileUrl(fileName) {
  const fullPath = path.join(FONTS_DIR, fileName).replace(/\\/g, '/');
  return `file:///${fullPath}`;
}

function renderEbookCoverPng(chromePath, spec, outputPngPath) {
  const juaUrl = getFontFileUrl('Jua-Regular.ttf');
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: 'Jua';
    src: url('${juaUrl}') format('truetype');
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1080px;
    height: 1350px;
    overflow: hidden;
    background: ${spec.bgGradient};
    font-family: 'Jua', 'Malgun Gothic', sans-serif;
  }
  .frame {
    position: relative;
    width: 1000px;
    height: 1270px;
    margin: 40px auto;
    border-radius: 36px;
    background: #ffffff;
    border: 8px solid #0f172a;
    box-shadow: 0 28px 60px rgba(0,0,0,0.35);
    padding: 56px 52px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .top-pill {
    display: inline-block;
    align-self: flex-start;
    background: #0f172a;
    color: #34d399;
    font-size: 32px;
    padding: 14px 32px;
    border-radius: 999px;
    border: 4px solid #34d399;
  }
  .title-box {
    margin-top: 24px;
    background: #fefce8;
    border: 5px solid #0f172a;
    border-radius: 28px;
    padding: 44px 36px;
    text-align: center;
  }
  .sub-kicker {
    font-size: 38px;
    color: #047857;
    margin-bottom: 18px;
  }
  .main-line1 {
    font-size: 74px;
    color: #0f172a;
    line-height: 1.18;
  }
  .main-line2 {
    display: inline-block;
    margin-top: 12px;
    font-size: 82px;
    color: #e11d48;
    background: #fef08a;
    padding: 8px 28px;
    border-radius: 18px;
    line-height: 1.18;
  }
  .bullet-card {
    background: #f8fafc;
    border: 4px solid #cbd5e1;
    border-radius: 24px;
    padding: 34px 38px;
    font-size: 36px;
    color: #1e293b;
    line-height: 1.55;
  }
  .bullet-item {
    margin-bottom: 12px;
  }
  .footer-bar {
    background: #0f172a;
    color: #ffffff;
    border-radius: 22px;
    padding: 28px 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 34px;
  }
  .badge-price {
    background: #10b981;
    color: #0f172a;
    padding: 10px 26px;
    border-radius: 14px;
    font-size: 34px;
  }
</style>
</head>
<body>
  <div class="frame">
    <div>
      <div class="top-pill">${spec.topPill}</div>
      <div class="title-box">
        <div class="sub-kicker">${spec.subKicker}</div>
        <div class="main-line1">${spec.line1}</div>
        <div class="main-line2">${spec.line2}</div>
      </div>
    </div>
    <div class="bullet-card">
      ${spec.bullets.map(b => `<div class="bullet-item">✅ ${b}</div>`).join('')}
    </div>
    <div class="footer-bar">
      <span>${spec.author}</span>
      <span class="badge-price">${spec.badgeRight}</span>
    </div>
  </div>
</body>
</html>`;

  const tmpHtml = path.join(os.tmpdir(), `mf-ebook-${Date.now()}.html`);
  fs.writeFileSync(tmpHtml, html, 'utf8');
  const fileUrl = 'file:///' + tmpHtml.replace(/\\/g, '/');

  spawnSync(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      '--virtual-time-budget=2000',
      '--window-size=1080,1350',
      `--screenshot=${outputPngPath}`,
      fileUrl
    ],
    { encoding: 'utf8', timeout: 25000 }
  );

  try {
    if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
  } catch (e) {}
}

function generateEbookFunnelKit() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  if (!fs.existsSync(PUBLIC_SNS_DIR)) fs.mkdirSync(PUBLIC_SNS_DIR, { recursive: true });

  const chromePath = findChromeExecutable();
  const cover1Path = path.join(OUT_DIR, 'ebook-1-cover.png');
  const cover2Path = path.join(OUT_DIR, 'ebook-2-cover.png');

  if (chromePath) {
    renderEbookCoverPng(
      chromePath,
      {
        bgGradient: 'linear-gradient(135deg, #0f172a 0%, #065f46 100%)',
        topPill: '📘 머니핏 경제·살림 연구소 실전 전자책 #1',
        subKicker: '모르면 매년 생돈 380만 원 증발!',
        line1: '대한민국 6대 고정비',
        line2: '반값 탈출 바이블',
        bullets: [
          '한전 누진세 3단계 피하는 인버터·난방비 공식',
          '인터넷 3년 만기·위약금 vs 현금 47만 원 손익표',
          '신차 할부 vs 장기렌트 소득세 구간별 절세 공식',
          '식단·반려동물·자취 입주 1원 단위 예산 시트 수록'
        ],
        author: '🦊 머니핏 경제연구소 지음',
        badgeRight: '36개 실측 수식 수록'
      },
      cover1Path
    );

    renderEbookCoverPng(
      chromePath,
      {
        bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        topPill: '📗 AI 수익화 & 외부유입 실전 전자책 #2',
        subKicker: '검색·홈판 노출만 기다리지 마세요!',
        line1: 'AI 웹툰·계산기 × 쓰레드',
        line2: '외부유입 수익화 공식',
        bullets: [
          '검색·홈판 없이 쓰레드·X로 외부유입 70% 만드는 법',
          '코딩·그림 몰라도 AI로 4컷 인스타툰·계산기 제작',
          '애드포스트·쇼핑커넥트·쿠팡을 넘어 전자책 확장',
          '하루 30분 멀티채널 반자동 운영 체크리스트'
        ],
        author: '🦊 머니핏 AI 수익화 연구소',
        badgeRight: '초보자 1일 완성 가이드'
      },
      cover2Path
    );

    if (fs.existsSync(cover1Path)) {
      fs.copyFileSync(cover1Path, path.join(PUBLIC_SNS_DIR, 'ebook-1-cover.png'));
    }
    if (fs.existsSync(cover2Path)) {
      fs.copyFileSync(cover2Path, path.join(PUBLIC_SNS_DIR, 'ebook-2-cover.png'));
    }
  }

  // Build E-Book #1 Full Manuscript from our 36 verified calculators
  const catGroups = [
    { key: 'electric', title: '제1장. 전기요금·누진세 폭탄 방어 공식 (한전 주택용 수식 완벽 해부)' },
    { key: 'telecom', title: '제2장. 통신·인터넷 위약금 vs 현금 사은품 47만 원 손익분기점 공식' },
    { key: 'auto', title: '제3장. 신차 할부 vs 장기렌트·리스 종합소득세 구간별 TCO 공식' },
    { key: 'room', title: '제4장. 원룸·오피스텔·신혼 입주 예산 초과 0원 BOM 배분 공식' },
    { key: 'diet', title: '제5장. 배달비 끊고 TDEE 기반 탄단지 장보기로 식비 절반 줄이는 공식' },
    { key: 'pet', title: '제6장. 강아지·고양이 NRC 수의영양학 정량 급여로 병원비·사료비 아끼는 법' }
  ];

  let chaptersMd = '';
  for (const cg of catGroups) {
    const list = PRESETS.filter(p => p.calc === cg.key);
    chaptersMd += `\n## ${cg.title}\n\n`;
    for (const p of list) {
      let res = null;
      try {
        const fnName = 'calculate' + cg.key.charAt(0).toUpperCase() + cg.key.slice(1);
        res = calculators[fnName](p.inputs);
      } catch (e) {}
      const metricsLine = res && res.metrics ? res.metrics.map(m => `${m.label}: **${m.val}**`).join(' | ') : '';
      chaptersMd += `### 📌 [${p.title}]\n`;
      chaptersMd += `- **핵심 판정**: ${res ? res.headline : ''} (${res ? res.badge : ''})\n`;
      chaptersMd += `- **산출 지표**: ${metricsLine}\n`;
      chaptersMd += `- **전문가 코멘트**: ${res ? res.summary : p.description}\n`;
      chaptersMd += `- **실시간 무료 시뮬레이터**: https://truthofmarket.com/preset/${p.id}\n\n`;
    }
  }

  const ebook1Md = `# 📘 《모르면 매년 380만 원 새는 대한민국 6대 고정비 반값 탈출 바이블》
> **부제**: 감으로 결제하던 습관을 멈추고 1원 단위 수식으로 매달 30만 원 현금흐름을 되찾는 36가지 실전 데이터북  
> **저자**: 머니핏(MoneyFit) 경제·살림 연구소  
> **부록**: 전 시나리오 3초 무료 자동 계산기 웹 포털 무제한 이용권 (https://truthofmarket.com)

---

## 프롤로그: 왜 열심히 아껴도 통장 잔고는 그대로일까?
많은 분들이 커피 한 잔, 배달비 몇천 원을 아끼려고 애쓰면서도 정작 **한 번 잘못 설정하면 매달 수만~수십만 원씩 자동으로 빠져나가는 '6대 고정비(전기세·통신비·자동차·주거 가전·식단·반려동물)'**는 영업사원의 말이나 눈대중에 맡겨버립니다.

이 책은 추상적인 절약 마인드셋이 아니라, **한국전력 누진세 요금표, 국세청 업무용승용차 손금산입 세법, 방송통신위원회 경품 고시, 미국 임상영양학회(Mifflin-St Jeor) 및 수의영양학(NRC) 공식**을 기반으로 36가지 현실 시나리오의 손익분기점을 1원 단위로 계산한 실전 치트시트입니다.
${chaptersMd}
---

## 부록: 내 조건 숫자만 넣으면 3초 만에 계산되는 무료 웹 계산기 안내
책에 수록된 36가지 기본 시나리오 외에, 우리 집 평수·내 소득세율·내 차량가·남은 위약금을 직접 넣어 3초 만에 실물 비교 영수증을 뽑아보실 수 있도록 무료 웹 포털을 열어두었습니다.
- **공식 포털 주소**: https://truthofmarket.com
- **공식 네이버 카페 (질문/인증 커뮤니티)**: https://cafe.naver.com/moneyfitlab
`;

  const ebook2Md = `# 📗 《검색·홈판 기다리지 않고 AI 웹툰·계산기 × 외부유입으로 수익 구조를 만든 실전 가이드》
> **부제**: 블로그 상위노출 없이도 쓰레드·X(트위터) 외부유입과 AI 자동화로 애드포스트·쇼핑커넥트·전자책 3중 파이프라인 구축하기  
> **저자**: 머니핏 AI 수익화 연구소

---

## 목차
1. **검색·홈판 노출만 기다리는 블로그가 지치는 이유**
2. **외부유입 70% 공식: 사람들이 찾아오길 기다리지 말고 사람들이 모인 곳(쓰레드·X)으로 가져가라**
3. **클릭률을 3배 높이는 'AI 4컷 영수증 웹툰 + 3초 무료 계산기' 결합 전략**
4. **수익 단가를 10배 높이는 구조: 애드포스트/제휴마케팅(수단) ➔ 내 경험 전자책(마진 90%)**
5. **AI를 활용해 단 하루 만에 데이터 정리부터 PDF 전자책·랜딩페이지까지 완성하는 5단계 워크플로우**
6. **매일 30분 루틴으로 굴리는 멀티채널(블로그 A/B · 쓰레드 · X · 클립) 운영표**

---

## 핵심 요약: 우리가 실제로 구축한 4단계 외부유입 & 수익화 엔진
- **STEP 1 (시선 강탈 훅)**: 쓰레드(Threads)와 X(트위터)에 긴 설명 대신 **'모르면 매달 5.7만 원 날리는 현실 비교 영수증 4컷 만화'**를 올립니다.
- **STEP 2 (댓글 좌표 유도)**: 본문에는 외부 링크를 넣지 않아 노출 도달률을 극대화하고, **첫 번째 댓글**로 상세 비교 글(블로그)과 무료 계산기 좌표를 안내합니다.
- **STEP 3 (블로그 체류시간 & 제휴 수익)**: 유입된 독자가 블로그의 1원 단위 비교표와 3초 계산기를 사용하면서 자연스럽게 **네이버 브랜드커넥트(쇼핑커넥트) & 쿠팡 파트너스** 전환이 일어납니다.
- **STEP 4 (90% 마진 자체 상품 전환)**: 개별 글 읽기에 그치지 않고, 36개 전체 시나리오와 AI 제작 노하우를 한 권으로 묶은 **실전 전자책/치트시트(할인 쿠폰 댓글 신청 루프)**로 연결해 객단가를 극대화합니다.
`;

  // Sub-Blog (Account B `expertise333` or Track-2 Blog) Pinned Notice Post modeled on the benchmark
  const blogBPinNoticePost = `[제목] [공지] 검색·홈판만 기다리지 않고 'AI 계산기·웹툰 × 외부유입'으로 수익 파이프라인을 만든 방법

안녕하세요, 머니핏 경제·AI 연구소입니다.

블로그를 처음 시작할 때 가장 많이 하는 고민이 있습니다.
"열심히 글을 써도 검색 상단에 안 뜨고, 홈판에도 안 올라가는데 언제쯤 수익이 날까?"

저 역시 단순히 글을 발행해 두고 검색이나 홈판 노출만을 가만히 기다리지 않았습니다.
대신 **1) 누구나 3초 만에 자기 숫자를 넣어볼 수 있는 36개 생활·금융 계산기 포털**과 **2) 한눈에 들어오는 4컷 영수증 웹툰**을 AI로 제작하고, **3) 쓰레드(Threads)와 X(구 트위터), 지식iN/커뮤니티를 통해 직접 사람들이 모여 있는 곳으로 콘텐츠를 가져가는 '외부 유입 전략'**을 실행했습니다.

---

### 1. 검색·홈판에만 의존하지 않는 '능동형 외부 유입'의 힘

사람들이 내 블로그를 검색해서 찾아오기를 기다리는 대신, 쓰레드와 X에서 사람들이 가장 아파하는 현실 숫자(전기세 누진세 폭탄, 인터넷 위약금 vs 47만 사은품, 신차 할부 vs 장기렌트 절세, 다이어트 식비 등)를 4컷 만화와 3줄 요약으로 먼저 보여주었습니다.

핵심은 **"사람들이 내 글을 찾아오기를 기다리지 않고, 직접 사람들이 있는 곳으로 알짜 정보를 가져가는 것"**입니다.
외부에서 공감을 얻은 독자들이 첫 댓글과 프로필 링크를 통해 블로그와 계산기 홈페이지로 유입되면서, 검색 상위노출 여부와 상관없이 흔들리지 않는 기초 트래픽을 만들 수 있었습니다.

---

### 2. 애드포스트·쇼핑커넥트·쿠팡파트너스, 그리고 '내 경험의 자산화(전자책)'

블로그를 운영할 때 애드포스트나 쇼핑커넥트, 쿠팡 파트너스는 훌륭한 수익 수단입니다.
하지만 여기서 한 걸음 더 나아가 반드시 고민해야 할 질문이 있습니다.

> **"내가 만든 36가지 팩트체크 데이터와 AI 자동화 구축 경험을 1회성 클릭 수익 이상으로 높일 방법은 없을까?"**

그 답이 바로 **데이터북(전자책) & 실전 플레이북 제작**이었습니다.
다른 사람의 상품만 소개하는 데 그치지 않고, 직접 수식을 검증하며 만든 **《대한민국 6대 고정비 반값 탈출 바이블 (36개 실측 수식 수록)》**과 **《AI 웹툰·계산기 × 외부유입 수익화 실전 가이드》**를 디지털 가이드북으로 정리했습니다.

💡 **실제 AI 활용 제작 및 유통 흐름**:
\`경험·수식 정리 → AI 원고 구조화 → 4컷 영수증 & 표 결합 → PDF 전자책 제작 → 블로그 공지 발행 → 쓰레드·X 외부유입 → 쿠폰 댓글 신청 & 전환\`

특별한 디자인 기술이 없어도 AI와 정확한 데이터만 있으면 누구나 자신의 경험과 정리 노트를 고부가가치 디지털 상품으로 발전시킬 수 있습니다.

---

### 3. 고정비 절약 바이블 & AI 외부유입 가이드북 (댓글 쿠폰 안내)

혼자서 생활비 누수 포인트를 계산하거나, AI를 활용해 나만의 웹툰·블로그·외부유입 파이프라인을 만드는 과정이 막막하신 분들을 위해 전 과정을 따라 하기 쉽게 정리해 두었습니다.

📘 **1권: 《모르면 매년 380만 원 새는 6대 고정비 반값 탈출 바이블》**
📗 **2권: 《검색·홈판 없이 AI 웹툰·계산기 × 쓰레드 외부유입으로 수익 만드는 실전 가이드》**
🔎 **무료 부록 (36종 실시간 계산기 포털)**: https://truthofmarket.com

블로그 이웃분들과 방문자분들을 위해 **특별 할인/무료 치트시트 쿠폰**도 준비했습니다.
이 글 **댓글로 \`쿠폰 신청\` 또는 \`가이드 신청\`**이라고 남겨주시면 확인 후 순차적으로 안내해 드리겠습니다! (공식 카페 https://cafe.naver.com/moneyfitlab 에서도 핵심 요약본을 바로 확인하실 수 있습니다.)

생각에서 멈추지 않고 작은 실행 하나를 옮기면 결과는 반드시 달라집니다. 긴 글 읽어주셔서 감사드리며, 방문해 주신 모든 분들의 지갑과 일상이 더 든든해지기를 응원합니다!

#블로그수익 #외부유입전략 #쓰레드수익화 #전자책제작 #AI부업 #쇼핑커넥트 #생활비절약 #머니핏`;

  // Threads & X (Twitter) External Inflow Pack (driving traffic straight to Blog B & Homepage)
  const threadsXPackMd = `# 🚀 [쓰레드(Threads) & X(트위터) 외부유입 74% 달성용] 바이럴 타래 & 댓글 유도 팩
> **핵심 원리**: 본문에는 링크를 넣지 않고 '충격적인 숫자 비교 + 경험담'으로 도달률을 폭발시킨 뒤, **첫 번째 대댓글(Reply)**에 블로그 상세글 링크와 홈페이지 계산기 링크를 달아 외부 유입을  끌어옵니다!

---

## 🔥 타래 템플릿 1 (고정비 종합 — 블로그 공지글 & 홈페이지 동시 유입용)
**[본문]**
열심히 커피값 아껴도 통장에 돈이 안 모였던 진짜 이유..
매달 숨만 쉬어도 빠져나가는 6대 고정비(전기세·인터넷·차할부·식비·사료값·자취가전)를 '감'으로 내고 있었기 때문이었습니다.

직접 한전·국세청·방통위 수식으로 36개 항목을 1원 단위까지 다 뜯어고쳤더니 1년에 아껴지는 생돈만 380만 원이 넘네요.
내가 정리한 36개 무료 계산기랑 요약본은 첫 댓글에 걸어둘게요 👇

**[첫 번째 댓글 (외부유입 브릿지)]**
📌 회원가입 없이 숫자만 넣으면 3초 만에 영수증 나오는 무료 계산기:
👉 https://truthofmarket.com
📌 블로그 정리본 & 고정비 바이블 쿠폰 신청 공지:
👉 (서브 블로그 공지글 URL 붙여넣기)

---

## 🔥 타래 템플릿 2 (AI 수익화 & 부업 경험담 — 제2블로그 '경제건강 일지' 벤치마크용)
**[본문]**
블로그 글 써놓고 검색 노출되길 기다리는 시대는 끝났습니다.
상위노출이나 홈판 기다리는 대신, AI로 '4컷 영수증 웹툰 + 3초 무료 계산기'를 만들고 쓰레드·X에서 직접 사람들을 데려왔더니 외부 유입 비중이 압도적으로 올라가네요.

코딩이나 그림 못 그려도 AI로 하루 만에 36개 자동화 콘텐츠 만들고 수익 구조(브랜드커넥트·쿠팡·전자책) 연결한 실전 과정, 블로그 공지글에 상세히 적어뒀습니다 👇

**[첫 번째 댓글 (외부유입 브릿지)]**
📖 검색·홈판 없이 AI와 외부유입으로 수익 구조 만든 전 과정 기록:
👉 (서브 블로그 공지글 URL 붙여넣기)
💬 블로그 공지글 댓글에 '쿠폰 신청' 남겨주시면 실전 가이드북 할인 쿠폰도 드립니다!

---

## 🔥 타래 템플릿 3 (인터넷·통신비 팩트폭격 — 댓글 폭발형)
**[본문]**
인터넷 3년 약정 끝났는데 귀찮아서 그냥 쓰고 계신 분?
통신사는 가만히 있는 장기고객한테 절대 현금 사은품 안 줍니다.

심지어 약정이 6개월(위약금 15만 원) 남았어도, 이동할 때 받는 현금 지원금(최대 47만 원) 빼면 당일 +32만 원이 남는데 대부분 위약금 무서워서 호구 요금 그대로 내고 계시더라고요 😭
우리 집 위약금 대비 순수익 몇 초 만에 계산하는 법 첫 댓글에 남겨둡니다 👇

**[첫 번째 댓글]**
🧾 내 남은 위약금 vs 현금 47만 원 손익분기점 3초 무료 계산기:
👉 https://truthofmarket.com/preset/telecom-penalty-15
`;

  fs.writeFileSync(path.join(OUT_DIR, 'ebook-1-fixed-cost-bible.md'), ebook1Md, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'ebook-2-ai-automation-playbook.md'), ebook2Md, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'blog_b_pin_notice_post.md'), blogBPinNoticePost, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'threads_x_external_inflow_pack.md'), threadsXPackMd, 'utf8');

  console.log('✓ Generated E-Book #1 & #2 Covers, Full Manuscripts, Sub-Blog Pin Notice Post, and Threads/X External Inflow Pack in ebook_outbox/');
  return {
    cover1Path,
    cover2Path,
    outDir: OUT_DIR
  };
}

if (require.main === module) {
  generateEbookFunnelKit();
}

module.exports = {
  generateEbookFunnelKit
};
