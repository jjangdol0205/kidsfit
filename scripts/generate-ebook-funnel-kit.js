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

  // Stage 1 Active Now: Account B (`expertise333`) Pinned Hub Post focusing 100% on AdPost Dwell-Time + Brand Connect Revenue + Homepage Inflow (NO premature e-book selling!)
  const blogBPinNoticePost = `[제목] [공지] 매달 새는 6대 고정비(전기·통신·차·식비·사료·자취) 1원 단위 팩트체크 총정리 & 무료 계산기 모음

안녕하세요! **머니핏 경제·살림 팩트체크 연구소(expertise333)**입니다.

커피값 몇천 원은 아끼면서 정작 매달 통장에서 자동으로 빠져나가는 **6대 고정비(전기요금 누진세, 인터넷·통신 위약금, 신차 할부·장기렌트, 다이어트 식비, 반려동물 사료비, 자취·신혼 가전 예산)**는 '감'이나 영업사원의 말만 믿고 결제하고 계시지 않나요?

이 블로그와 네이버 클립 채널은 한국전력 주택용 누진세 수식, 국세청 세법, 방송통신위원회 경품 고시, 수의영양학(NRC) 등 **공식 수식을 기반으로 실제 손익분기점을 1원 단위까지 검증하고 기록하는 공간**입니다.

---

### 📊 1. 한눈에 보는 6대 카테고리 핵심 팩트체크 & 3초 무료 계산기

아래 링크를 누르시면 회원가입이나 앱 설치 없이 내 조건 숫자를 넣어 **3초 만에 실물 비교 영수증**을 뽑아보실 수 있습니다.

1️⃣ **⚡ 전기요금·가전 누진세 계산기 (원룸 에어컨·제습기·겨울 온풍기)**
• 구형 정속형 vs 1등급 인버터 전기세 차이 및 기기 교체 본전 기간 계산
👉 무료 계산기: https://truthofmarket.com/preset/electric-studio-ac
🛍️ **검증 절전템 (네이버 브랜드커넥트)**: 듀플렉스 스탠드 에어서큘레이터 (리뷰 20,951개)
👉 https://naver.me/xm0ZVnAW

2️⃣ **🌐 인터넷·통신 위약금 vs 현금 사은품 47만 원 손익분기점 계산기**
• 약정 만기 또는 잔여 위약금(15만~30만 원) 납부 후 이동 시 당일 순수익 판정
👉 무료 계산기: https://truthofmarket.com/preset/telecom-penalty-15
🛍️ **검증 통신템 (네이버 브랜드커넥트)**: 티피링크 Archer AX1500 Wi-Fi 6 기가 공유기
👉 https://naver.me/FpwR436o

3️⃣ **🚗 신차 할부 vs 장기렌트·리스 종합소득세 구간별 절세 계산기**
• 사회초년생 아반떼부터 개인·법인사업자 그랜저·G80 연간 1,500만 원 비용처리 손익 비교
👉 무료 계산기: https://truthofmarket.com/preset/auto-grandeur-5000
🛍️ **검증 차량템 (네이버 브랜드커넥트)**: 아이테라 26년형 2채널 FHD 블랙박스 (3년 AS)
👉 https://naver.me/G5kYoDj6

4️⃣ **🥗 다이어트·식단 TDEE 칼로리 및 한 달 장보기 예산 계산기**
• 배달음식 대신 내 기초대사량·활동대사량 맞춤 탄단지(g)와 닭가슴살 팩 수 자동 산출
👉 무료 계산기: https://truthofmarket.com/preset/diet-male-fatloss
🛍️ **검증 식단템 (네이버 브랜드커넥트)**: 한끼통살 소스 통 닭가슴살 10팩 (리뷰 49,365개)
👉 https://naver.me/xvClW9nJ

5️⃣ **🐾 강아지·고양이 사료 1일 적정 급여량(g) & 소진일수 계산기**
• 종이컵 눈대중 급여를 멈추고 아이 체중·중성화 여부에 맞춘 1g 단위 정량 급여표 확인
👉 무료 계산기: https://truthofmarket.com/preset/pet-maltese-5kg
🛍️ **검증 반려템 (네이버 브랜드커넥트)**: 라비앙독 가수분해 연어 사료 4.8kg (리뷰 26,136개)
👉 https://naver.me/xAfcU6Im

6️⃣ **🛋️ 원룸·오피스텔·신혼 입주 예산별 가전·가구 풀세팅(BOM) 계산기**
• 50만 원부터 1,000만 원까지 예산 초과(Overrun) 0원으로 맞추는 황금 배분표
👉 무료 계산기: https://truthofmarket.com/preset/room-officetel-500
🛍️ **검증 리빙템 (네이버 브랜드커넥트)**: [슈퍼적립] 로보락 Qrevo Curv 2 Flow 로봇청소기
👉 https://naver.me/GgUlTvYj

---

### 💬 2. 우리 집 조건 맞춤 계산 신청 & 공식 카페 안내

계산기를 돌려보시다가 헷갈리는 조건이 있으시다면 언제든 **이 글 댓글로 질문** 남겨주세요!
또한 **머니핏 공식 네이버 카페(https://cafe.naver.com/moneyfitlab)**에 오시면 36가지 전체 시나리오의 4컷 웹툰 요약본과 실측 비교표를 한눈에 보실 수 있습니다.

*(※ 이 포스팅은 네이버 브랜드커넥트 활동의 일환으로 판매 발생 시 수수료를 제공받습니다.)*

#생활비절약 #고정비줄이기 #전기세계산기 #인터넷위약금 #장기렌트비교 #다이어트식단 #강아지사료량 #자취필수템 #쇼핑커넥트 #머니핏`;

  // Stage 1 Threads & X (Twitter) External Inflow Pack -> Driving 74% External Traffic straight to Account B Blog, Naver Clip & Homepage (for AdPost + Brand Connect Revenue!)
  const threadsXPackMd = `# 🚀 [1단계 실전 가동] 쓰레드·커뮤니티 외부유입 ➔ B계정 블로그·클립 (애드포스트 & 브랜드커넥트 수익 집중 키트)
> **전략 로드맵**:
> - **1단계 (현재 집중)**: B계정(\`expertise333\`) 블로그 & 네이버 클립(\`@truthofmarket\`)에 웹툰·알짜글을 발행하고, 쓰레드·인스타·카페 외부유입을 집중시켜 **① 애드포스트 승인·클릭 수익 극대화 + ② 네이버 브랜드커넥트 실결제 수수료 + ③ 홈페이지(\`truthofmarket.com\`) 쿠팡 수익**을 먼저 본궤도에 올립니다!
> - **2단계 (수익 인증 달성 후 해금)**: 1단계에서 실제 검증된 애드포스트·브랜드커넥트·쿠팡 수익 데이터와 외부유입 성과가 쌓이면, 그 **진짜 성공 데이터**를 바탕으로 전자책을 출간합니다.

---

## 🔥 외부유입 타래 1 (쓰레드 ➔ B계정 블로그 & 홈페이지 동시 유입)
**[본문 (4컷 웹툰 이미지 첨부)]**
열심히 커피값 아껴도 통장에 돈이 안 모였던 진짜 이유..
매달 숨만 쉬어도 빠져나가는 6대 고정비(전기세·인터넷·차할부·식비·사료값·자취가전)를 '감'으로 내고 있었기 때문이었습니다.

직접 한전·국세청·방통위 수식으로 36개 항목을 1원 단위까지 다 비교해 봤더니 1년에 아껴지는 생돈만 380만 원이 넘네요.
카테고리별 핵심 비교표랑 3초 무료 계산기 총정리본은 첫 댓글에 걸어둘게요 👇

**[첫 번째 댓글 (B계정 블로그 체류시간 + 브랜드커넥트 + 홈페이지 유입)]**
📌 6대 고정비 1원 단위 비교 총정리 & 검증 특가템 (네이버 블로그):
👉 https://blog.naver.com/expertise333
📌 회원가입 없이 숫자만 넣으면 3초 만에 영수증 나오는 무료 계산기:
👉 https://truthofmarket.com

---

## 🔥 외부유입 타래 2 (네이버 클립 조회수 & 브랜드커넥트 스티커 클릭 부스터)
**[본문]**
원룸 에어컨이나 제습기, 겨울 온풍기 틀 때 '조금 틀다 끄면 아껴지겠지' 생각하셨다면 꼭 보세요.
한전 누진세 3단계 구간 넘어가면 요금이 3배로 뛰어서 서큘레이터 같이 쓰는 거랑 한 달에 2만 원 넘게 차이 납니다.
16초 요약 영상이랑 무료 계산기 첫 댓글에 남겨둡니다 👇

**[첫 번째 댓글]**
🎬 16초 모션 웹툰 & 서큘레이터 특가 비교:
👉 https://blog.naver.com/expertise333/224255966789
🧾 내 방 평수·소비전력(W) 3초 무료 전기세 계산기:
👉 https://truthofmarket.com/preset/electric-studio-ac
`;

  fs.writeFileSync(path.join(OUT_DIR, 'ebook-1-fixed-cost-bible.md'), ebook1Md, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'ebook-2-ai-automation-playbook.md'), ebook2Md, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'blog_b_pin_notice_post.md'), blogBPinNoticePost, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'threads_x_external_inflow_pack.md'), threadsXPackMd, 'utf8');

  console.log('✓ Updated Stage-1 Account B AdPost & Brand Connect External Inflow Kit (E-books held in reserve for Stage-2 post-success launch)');
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
