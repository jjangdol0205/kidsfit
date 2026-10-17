#!/usr/bin/env node
/**
 * MoneyFit Automated 4-Cut Webtoon x Receipt Generator & Multi-SNS Auto-Publisher
 * (인스타그램 · 쓰레드 · 페이스북 4컷 웹툰 이미지 자동 생성 & 원클릭/스케줄 자동 업로드 엔진)
 *
 * Capabilities:
 * 1. Renders high-resolution 1080x1080 4-Cut Webtoon x Dark Receipt PNGs:
 *    - `sns_outbox/{slug}/webtoon-grid.png` (2x2 full 4-cut webtoon for Threads & Facebook)
 *    - `sns_outbox/{slug}/slide-1.png` ~ `slide-4.png` (4 individual 1080x1080 slides for Instagram Carousel)
 * 2. Generates Meta Algorithm Link-Penalty-Bypass Copy Pack:
 *    - `threads_main.txt` (Link-free hook body)
 *    - `threads_reply.txt` (1st self-reply comment with truthofmarket.com link)
 *    - `instagram_caption.txt` (Save/DM trigger caption + hashtags)
 *    - `facebook_post.txt` (Facebook feed post + comment link)
 * 3. Publishes automatically via:
 *    - Official Meta APIs (Threads Graph API + Instagram Graph API + Facebook Page API) when tokens are set in `.env`
 *    - Telegram Bot `sendPhoto` + Instant Copy Pack delivery to the owner's smartphone
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');
const { PRESETS } = require('../src/data/presets.js');
const telegramNotifier = require('./telegram-notify.js');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTBOX_ROOT = path.join(PROJECT_ROOT, 'sns_outbox');
const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

function findChromeExecutable() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function normalizePreset(raw) {
  return {
    ...raw,
    slug: raw.slug || raw.id || 'electric-studio-ac',
    keyword: raw.keyword || raw.title || '원룸 에어컨 전기세 계산',
    title: raw.title || raw.keyword || '원룸 에어컨 전기세 계산',
    calcKey: raw.calc || raw.category || 'electric'
  };
}

/**
 * Build story data & copy for any preset
 */
function buildStoryForPreset(rawPreset, siteUrl = 'https://truthofmarket.com') {
  const preset = normalizePreset(rawPreset);
  const cleanSiteUrl = String(siteUrl || 'https://truthofmarket.com').replace(/\/+$/, '');
  const targetUrl = `${cleanSiteUrl}/preset/${preset.slug}`;

  const templates = {
    electric: {
      badge: '⚡ 한전 누진세 폭탄 팩트체크',
      accent: '#10b981',
      charName: '자취생 민수',
      panel1Speech: '에어컨 전기세 아끼려고 2시간마다 껐다 켰다 했지! 이번 달은 만 원대겠지? ㅎㅎ',
      panel1Sub: '여름 원룸 에어컨 흔한 착각.jpg',
      panel2Speech: '잠깐! 정속형 에어컨을 껐다 켜면 실외기 초기 기동전력이 폭발해서 누진 3단계(3배) 밟습니다!',
      panel2Sub: '한전 주택용 누진세 3단계 구간 진입 경고',
      receiptTitle: '월 전기요금 실물 영수증 비교',
      badLabel: '구형/정속형 무방비 가동',
      badVal: '88,420원',
      goodLabel: '1등급 인버터 정속 유지',
      goodVal: '31,200원',
      diffLabel: '매달 그냥 버리는 돈',
      diffVal: '-57,220원 / 월',
      ctaTitle: '내 에어컨 소비전력(W) 넣으면 3초 컷!',
      hookLine: '여름에 에어컨 전기세 아낀다고 껐다 켰다 반복하시는 분들 진짜 큰일 납니다 😭',
      factLine: '한전 주택용 누진세 3단계 구간 넘어가면 요금이 갑자기 3배로 뛰는 거 알고 계셨나요?'
    },
    diet: {
      badge: '🥗 식단·장보기 낭비 팩트체크',
      accent: '#f59e0b',
      charName: '다이어터 지현',
      panel1Speech: '살 빼야 하니까 일단 닭가슴살 100팩이랑 고구마 박스째로 질렀다! 이번엔 성공한다!',
      panel1Sub: '다이어트 시작할 때 흔한 충동구매.jpg',
      panel2Speech: '내 기초대사량(BMR)과 활동대사량(TDEE) 계산 안 하고 사면 냉동실 자리만 차지하고 요요 옵니다!',
      panel2Sub: 'Mifflin-St Jeor 수식 기반 정밀 탄단지 진단',
      receiptTitle: '4주 식단 장보기 영수증 비교',
      badLabel: '감으로 대량 구매 & 배달 치팅',
      badVal: '348,000원',
      goodLabel: '내 TDEE 맞춤 정량 장보기',
      goodVal: '142,000원',
      diffLabel: '4주 식비 절감액',
      diffVal: '-206,000원 절약',
      ctaTitle: '내 체중·목표 넣으면 닭가슴살 팩 수 3초 계산!',
      hookLine: '다이어트 시작한다고 무작정 닭가슴살 50팩, 100팩 묶음부터 결제하지 마세요 🙅‍♀️',
      factLine: '내 TDEE(일일 총소모칼로리) 계산 없이 굶거나 대충 먹으면 식비만 20만 원 넘게 날립니다.'
    },
    pet: {
      badge: '🐾 수의영양학 급여량·양육비 진단',
      accent: '#ec4899',
      charName: '초보집사 현우',
      panel1Speech: '우리 강아지 사료 봉투 뒤에 적힌 권장량대로 줬는데 왜 자꾸 살이 찌고 슬개골이 아플까..?',
      panel1Sub: '사료 봉투 뒷면 권장량만 믿은 결과.jpg',
      panel2Speech: '중성화 여부와 활동량 계수(DER)를 안 곱해주면 매일 과식하게 돼서 노후 수술비 폭탄 맞아요!',
      panel2Sub: 'RER = 70 × 체중^0.75 수의영양학 정밀 공식',
      receiptTitle: '반려동물 월 양육·의료비 영수증',
      badLabel: '과급여 비만 + 무보험 병원비',
      badVal: '385,000원/월',
      goodLabel: '정량 급여 + 슬개골 특약 대비',
      goodVal: '129,000원/월',
      diffLabel: '매달 지키는 양육 예산',
      diffVal: '-256,000원/월',
      ctaTitle: '아이 몸무게(kg)만 넣으면 하루 사료 g수 3초 계산!',
      hookLine: '강아지·고양이 사료 급여량 아직도 사료 봉투 뒷면 표만 보고 종이컵으로 대충 주시나요? 🐶🐱',
      factLine: '중성화 여부랑 활동량 계수(DER) 안 맞추면 비만 → 슬개골·신장 병원비 수백만 원 깨집니다.'
    },
    room: {
      badge: '🛋️ 자취·신혼 풀세팅 예산 방어',
      accent: '#6366f1',
      charName: '첫독립 수진',
      panel1Speech: '인스타 감성 원룸 꾸미려고 침대랑 워시타워 장바구니 담았더니 벌써 예산 초과네?!',
      panel1Sub: '첫 자취/이사 가전·가구 장바구니 참사.jpg',
      panel2Speech: '총예산 황금비율(침구 25%·냉장/세탁 35%·생활 40%) 안 지키면 정작 필수 가전을 못 삽니다!',
      panel2Sub: '예산 절대 초과 금지 BOM 최적 배분 엔진',
      receiptTitle: '자취·이사 풀세팅 견적 영수증',
      badLabel: '감성 위주 단품 충동 결제',
      badVal: '2,840,000원',
      goodLabel: '예산 맞춤 황금비율 풀세팅',
      goodVal: '1,480,000원',
      diffLabel: '이사 초기 목돈 절감액',
      diffVal: '-1,360,000원 절약',
      ctaTitle: '내 예산·평수 넣으면 품목별 최적 견적표 3초 완성!',
      hookLine: '자취방이나 신혼집 들어갈 때 인스타 감성 사진만 보고 가구부터 결제하면 100% 예산 터집니다 💸',
      factLine: '전체 예산에서 침구·냉장고·세탁기·생활가전 황금비율 안 맞추면 정작 필수품을 못 사요.'
    },
    auto: {
      badge: '🚗 신차 할부 vs 장기렌트 vs 리스 TCO',
      accent: '#3b82f6',
      charName: '김대리 & 박대표',
      panel1Speech: '월 납입금만 보면 할부나 장기렌트나 비슷해 보이는데 그냥 매장 딜러 추천대로 계약할까?',
      panel1Sub: '신차 뽑을 때 월 납입금만 본 결과.jpg',
      panel2Speech: '취등록세 7% + 5년 자동차세 + 보험료 할증 + 사업자 절세액까지 합산하면 수백만 원 차이 납니다!',
      panel2Sub: '5년 총소유비용(TCO) 4대 방식 전수 비교',
      receiptTitle: '5년 차량 총소유비용(TCO) 영수증',
      badLabel: '취등록세·세금 간과 고금리 할부',
      badVal: '54,820,000원',
      goodLabel: '내 소득·세율 맞춤 최적 플랜',
      goodVal: '46,150,000원',
      diffLabel: '5년 총지출 절감액',
      diffVal: '-8,670,000원 절약',
      ctaTitle: '차량가·세율 넣으면 4대 구매방식 총비용 3초 비교!',
      hookLine: '신차 뽑을 때 영업사원이 보여주는 "월 납입금" 숫자만 보고 사인하시면 몇백만 원 손해 봅니다 🚗',
      factLine: '취등록세 7%, 5년 치 자동차세, 보험료, 사업자 비용처리(연 1,500만 원 한도)까지 합쳐서 비교해야 진짜 내 돈이 굳어요.'
    },
    telecom: {
      badge: '🌐 인터넷·TV 약정 위약금 vs 현금 사은품',
      accent: '#14b8a6',
      charName: '3년차 호구 탈출러',
      panel1Speech: '인터넷 3년 약정 끝났는데 귀찮으니까 그냥 쓰자~ 재약정하면 상품권 조금 준다던데?',
      panel1Sub: '통신사 장기 고객이 제일 손해 보는 이유.jpg',
      panel2Speech: '신규 갈아타기 현금 사은품(최대 47만 원)에서 위약금 빼고도 3년 요금 차액까지 합치면 무조건 이득입니다!',
      panel2Sub: '위약금 차감 순수익 & 손익분기 개월 정밀 산출',
      receiptTitle: '인터넷 3년 유지 vs 갈아타기 영수증',
      badLabel: '기존 통신사 무약정/재약정 유지',
      badVal: '+70,000원 혜택',
      goodLabel: '현금 사은품 47만 + 결합 인하',
      goodVal: '+518,000원 순익',
      diffLabel: '안 바꾸면 놓치는 순수익',
      diffVal: '+448,000원 이득',
      ctaTitle: '내 위약금·월요금 넣으면 갈아타기 순이익 3초 계산!',
      hookLine: '인터넷 3년 약정 끝났는데도 귀찮아서 그냥 쓰고 계신 분들 진짜 통신사 VIP 기부천사입니다 😭',
      factLine: '위약금이 조금 남아있어도 신규 현금 사은품(최대 47만 원) + 월 요금 인하분이 훨씬 커서 즉시 갈아타는 게 남는 장사예요.'
    }
  };

  const t = templates[preset.calcKey] || templates.electric;

  const threadsMain = [
    t.hookLine,
    '',
    t.factLine,
    `특히 「${preset.keyword}」 고민 중이시라면 감으로 결정하지 마시고 3번째 컷 실물 비교 영수증 꼭 확인해보세요.`,
    '',
    `📊 실제 비교 요약 (${preset.title})`,
    `• ❌ ${t.badLabel}: ${t.badVal}`,
    `• ✅ ${t.goodLabel}: ${t.goodVal}`,
    `• 💰 핵심 차이: ${t.diffVal}`,
    '',
    `내 조건 넣으면 3초 만에 1원 단위로 비교 영수증 뽑아주는 무료 웹 계산기 주소는 첫 번째 대댓글에 남겨둘게요 👇`
  ].join('\n');

  const threadsReply = [
    `👇 「${preset.keyword}」 3초 무료 손익 계산기 (회원가입·설치 없음)`,
    targetUrl,
    '',
    `숫자만 넣으면 내 상황에서 얼마 아낄 수 있는지 바로 영수증으로 나옵니다!`
  ].join('\n');

  const instagramCaption = [
    `[${preset.keyword}] 모르면 매달 생돈 날리는 충격 실물 영수증 비교 🧾`,
    '',
    t.hookLine,
    t.factLine,
    '',
    `👉 옆으로 넘겨서 3번째 컷 「실물 비교 영수증」을 꼭 확인해보세요!`,
    `• ❌ ${t.badLabel}: ${t.badVal}`,
    `• ✅ ${t.goodLabel}: ${t.goodVal}`,
    `• 💡 핵심 차이: ${t.diffVal}`,
    '',
    `📌 나중에 결제하기 전에 꼭 다시 보려면 [저장] 눌러두시고,`,
    `✈️ 지금 이거 고민 중인 친구·연인·가족에게 [DM 공유] 해주세요!`,
    '',
    `🔗 3초 무료 계산기 바로가기: 프로필 하단 링크 (truthofmarket.com) 클릭!`,
    `또는 댓글에 "계산기" 남겨주시면 링크 보내드립니다 💬`,
    '',
    `#${preset.keyword.replace(/\s+/g, '')} #머니핏 #생활꿀팁 #자취꿀팁 #절약꿀팁 #재테크 #가성비 #손익분기점계산기`
  ].join('\n');

  const facebookPost = [
    `🚨 아직도 「${preset.keyword}」 감으로 결정하시나요?`,
    '',
    t.hookLine,
    t.factLine,
    '',
    `방금 머니핏 시뮬레이터로 돌려본 실물 영수증 비교 결과입니다:`,
    `━━━━━━━━━━━━━━━━━━`,
    `❌ ${t.badLabel}: ${t.badVal}`,
    `✅ ${t.goodLabel}: ${t.goodVal}`,
    `🔥 최종 손익 차이: ${t.diffVal}`,
    `━━━━━━━━━━━━━━━━━━`,
    '',
    `내 조건을 직접 넣어서 3초 만에 계산해보고 싶으신 분들은 첫 번째 댓글의 무료 계산기 링크를 확인해보세요! 👇`
  ].join('\n');

  return {
    preset,
    targetUrl,
    story: t,
    threadsMain,
    threadsReply,
    instagramCaption,
    facebookPost
  };
}

/**
 * Create standalone HTML for headless Chrome 1080x1080 screenshot
 */
function buildRenderHtml(bundle, mode = 'grid', slideNum = 1) {
  const { preset, story } = bundle;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    background: #0f172a;
    font-family: "Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
  }
  canvas {
    width: 1080px;
    height: 1080px;
    display: block;
  }
</style>
</head>
<body>
<canvas id="c" width="1080" height="1080"></canvas>
<script>
const preset = ${JSON.stringify(preset)};
const story = ${JSON.stringify(story)};
const mode = ${JSON.stringify(mode)};
const slideNum = ${Number(slideNum)};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || '').split(' ');
  let line = '';
  let currentY = y;
  let lineCount = 0;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }
  if (lineCount < maxLines) {
    ctx.fillText(line.trim(), x, currentY);
  }
}

function drawCharacter(ctx, cx, cy, mood, accentColor, scale = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.fillStyle = accentColor;
  roundRect(ctx, -48, 42, 96, 56, 26);
  ctx.fill();

  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#1e293b';
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, -10, 46, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  if (mood === 'shock') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-16, -2, 9, 0, Math.PI * 2);
    ctx.arc(16, -2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-16, -2, 4, 0, Math.PI * 2);
    ctx.arc(16, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(0, 20, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(38, -14, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (mood === 'smart') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-16, -2, 5, 0, Math.PI * 2);
    ctx.arc(16, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(-29, -12, 24, 18);
    ctx.strokeRect(5, -12, 24, 18);
    ctx.beginPath();
    ctx.moveTo(-5, -3);
    ctx.lineTo(5, -3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 14, 12, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(-16, -2, 5, 0, Math.PI * 2);
    ctx.arc(16, -2, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 12, 15, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPanel(ctx, num, x, y, w, h, isFullSlide) {
  const s = isFullSlide ? 1.85 : 1;
  if (num === 1) {
    ctx.fillStyle = '#fffbeb';
    roundRect(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    roundRect(ctx, x + 22 * s, y + 20 * s, 140 * s, 36 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(19 * s) + 'px sans-serif';
    ctx.fillText('1컷 · 흔한 착각', x + 36 * s, y + 44 * s);

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x + 22 * s, y + 70 * s, w - 44 * s, 125 * s, 18 * s);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold ' + Math.round(21 * s) + 'px sans-serif';
    drawWrappedText(ctx, '"' + story.panel1Speech + '"', x + 40 * s, y + 106 * s, w - 80 * s, 30 * s, 3);

    drawCharacter(ctx, x + w / 2, y + 285 * s, 'shock', '#f59e0b', s);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold ' + Math.round(18 * s) + 'px sans-serif';
    ctx.fillText('👤 ' + story.charName + ' — ' + story.panel1Sub, x + 26 * s, y + h - 24 * s);
  } else if (num === 2) {
    ctx.fillStyle = '#eff6ff';
    roundRect(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3b82f6';
    ctx.stroke();

    ctx.fillStyle = '#2563eb';
    roundRect(ctx, x + 22 * s, y + 20 * s, 155 * s, 36 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(19 * s) + 'px sans-serif';
    ctx.fillText('2컷 · 반전 팩트', x + 36 * s, y + 44 * s);

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x + 22 * s, y + 70 * s, w - 44 * s, 125 * s, 18 * s);
    ctx.fill();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold ' + Math.round(20 * s) + 'px sans-serif';
    drawWrappedText(ctx, '"' + story.panel2Speech + '"', x + 40 * s, y + 105 * s, w - 80 * s, 29 * s, 3);

    drawCharacter(ctx, x + w / 2, y + 285 * s, 'smart', '#2563eb', s);

    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold ' + Math.round(18 * s) + 'px sans-serif';
    ctx.fillText('🔍 ' + story.panel2Sub, x + 26 * s, y + h - 24 * s);
  } else if (num === 3) {
    ctx.fillStyle = '#111827';
    roundRect(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    roundRect(ctx, x + 22 * s, y + 20 * s, 230 * s, 36 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = '#064e3b';
    ctx.font = 'bold ' + Math.round(19 * s) + 'px sans-serif';
    ctx.fillText('3컷 · 실물 비교 영수증 📌', x + 34 * s, y + 44 * s);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold ' + Math.round(22 * s) + 'px sans-serif';
    ctx.fillText('🧾 ' + story.receiptTitle, x + 24 * s, y + 90 * s);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
    roundRect(ctx, x + 22 * s, y + 112 * s, w - 44 * s, 74 * s, 14 * s);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold ' + Math.round(17 * s) + 'px sans-serif';
    ctx.fillText('❌ ' + story.badLabel, x + 36 * s, y + 142 * s);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold ' + Math.round(24 * s) + 'px sans-serif';
    ctx.fillText(story.badVal, x + 36 * s, y + 173 * s);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
    roundRect(ctx, x + 22 * s, y + 198 * s, w - 44 * s, 74 * s, 14 * s);
    ctx.fill();
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold ' + Math.round(17 * s) + 'px sans-serif';
    ctx.fillText('✅ ' + story.goodLabel, x + 36 * s, y + 228 * s);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold ' + Math.round(24 * s) + 'px sans-serif';
    ctx.fillText(story.goodVal, x + 36 * s, y + 259 * s);

    ctx.fillStyle = '#1e293b';
    roundRect(ctx, x + 22 * s, y + 286 * s, w - 44 * s, 94 * s, 16 * s);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold ' + Math.round(17 * s) + 'px sans-serif';
    ctx.fillText('💰 ' + story.diffLabel, x + 36 * s, y + 318 * s);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold ' + Math.round(30 * s) + 'px sans-serif';
    ctx.fillText(story.diffVal, x + 36 * s, y + 360 * s);
  } else {
    ctx.fillStyle = '#1e1b4b';
    roundRect(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#818cf8';
    ctx.stroke();

    ctx.fillStyle = '#6366f1';
    roundRect(ctx, x + 22 * s, y + 20 * s, 210 * s, 36 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(19 * s) + 'px sans-serif';
    ctx.fillText('4컷 · 3초 해결책 🚀', x + 34 * s, y + 44 * s);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(23 * s) + 'px sans-serif';
    drawWrappedText(ctx, story.ctaTitle, x + 26 * s, y + 92 * s, w - 52 * s, 32 * s, 2);

    drawCharacter(ctx, x + w / 2, y + 230 * s, 'happy', '#10b981', s);

    ctx.fillStyle = '#10b981';
    roundRect(ctx, x + 24 * s, y + 310 * s, w - 48 * s, 72 * s, 18 * s);
    ctx.fill();
    ctx.fillStyle = '#042f2e';
    ctx.font = 'bold ' + Math.round(20 * s) + 'px sans-serif';
    ctx.fillText('👉 첫 댓글 / 프로필 링크 클릭!', x + 42 * s, y + 342 * s);
    ctx.font = 'bold ' + Math.round(17 * s) + 'px monospace';
    ctx.fillText('truthofmarket.com', x + 42 * s, y + 368 * s);
  }
}

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

if (mode === 'grid') {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.fillStyle = '#1e293b';
  roundRect(ctx, 32, 24, 1016, 110, 22);
  ctx.fill();

  ctx.fillStyle = story.accent;
  roundRect(ctx, 56, 44, 290, 34, 10);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText(story.badge, 70, 67);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 31px sans-serif';
  drawWrappedText(ctx, preset.keyword + ' — 호구 탈출 4컷 영수증', 56, 112, 960, 36, 1);

  const pW = 496;
  const pH = 415;
  drawPanel(ctx, 1, 32, 152, pW, pH, false);
  drawPanel(ctx, 2, 552, 152, pW, pH, false);
  drawPanel(ctx, 3, 32, 585, pW, pH, false);
  drawPanel(ctx, 4, 552, 585, pW, pH, false);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('📌 저장해두고 결제 직전에 꺼내보세요  |  🔎 검색창에 truthofmarket.com', 36, 1046);
} else {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1080, 1080);
  drawPanel(ctx, slideNum, 48, 48, 984, 984, true);
}
</script>
</body>
</html>`;
}

/**
 * Render HTML to PNG via Headless Chrome
 */
function renderPngWithChrome(chromePath, htmlContent, outputPngPath) {
  const tempHtmlPath = outputPngPath.replace(/\.png$/i, '.temp.html');
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
  const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');

  const res = spawnSync(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--window-size=1080,1080',
      `--screenshot=${outputPngPath}`,
      fileUrl
    ],
    { encoding: 'utf8', timeout: 20000 }
  );

  try {
    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
  } catch (e) {
    // ignore
  }

  return res.status === 0 && fs.existsSync(outputPngPath);
}

/**
 * Send photo to Telegram via multipart/form-data
 */
function sendTelegramPhoto(botToken, chatId, photoPath, caption) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(photoPath)) {
      return resolve({ ok: false, reason: 'PHOTO_NOT_FOUND' });
    }
    const boundary = '----MoneyFitBoundary' + Date.now().toString(16);
    const fileData = fs.readFileSync(photoPath);
    const filename = path.basename(photoPath);

    const parts = [];
    const addField = (name, val) => {
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${val}\r\n`,
          'utf8'
        )
      );
    };
    addField('chat_id', String(chatId));
    if (caption) {
      addField('caption', caption);
      addField('parse_mode', 'HTML');
    }

    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`,
        'utf8'
      )
    );
    parts.push(fileData);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'));

    const body = Buffer.concat(parts);
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${botToken}/sendPhoto`,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        },
        timeout: 20000
      },
      res => {
        let respBody = '';
        res.on('data', d => (respBody += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(respBody));
          } catch (e) {
            resolve({ ok: false, raw: respBody });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Generate full 4-Cut Webtoon PNG + 4 Instagram Carousel PNGs + Copy Pack for a preset
 */
async function generateWebtoonPack(options = {}) {
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const defaultPreset = PRESETS[dayOfYear % PRESETS.length] || PRESETS[0];
  const rawPreset = options.slug
    ? PRESETS.find(p => p.slug === options.slug || p.id === options.slug) || defaultPreset
    : defaultPreset;
  const preset = normalizePreset(rawPreset);

  const cfg = telegramNotifier.getTelegramConfig();
  const bundle = buildStoryForPreset(preset, cfg.siteUrl);

  const outDir = path.join(OUTBOX_ROOT, preset.slug);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Also save into public /sns/ directory so Meta APIs & live server can access the image URL directly
  const publicSnsDir = path.join(PROJECT_ROOT, 'sns');
  if (!fs.existsSync(publicSnsDir)) fs.mkdirSync(publicSnsDir, { recursive: true });

  const gridPngPath = path.join(outDir, 'webtoon-grid.png');
  const publicGridPngPath = path.join(publicSnsDir, `${preset.slug}-grid.png`);

  const chromePath = findChromeExecutable();
  const slidePaths = [];

  if (chromePath) {
    const gridHtml = buildRenderHtml(bundle, 'grid', 1);
    renderPngWithChrome(chromePath, gridHtml, gridPngPath);
    if (fs.existsSync(gridPngPath)) {
      fs.copyFileSync(gridPngPath, publicGridPngPath);
    }

    for (let i = 1; i <= 4; i++) {
      const sPath = path.join(outDir, `slide-${i}.png`);
      const sHtml = buildRenderHtml(bundle, 'slide', i);
      renderPngWithChrome(chromePath, sHtml, sPath);
      slidePaths.push(sPath);
    }
  }

  // Write copy files
  fs.writeFileSync(path.join(outDir, 'threads_main.txt'), bundle.threadsMain + '\n', 'utf8');
  fs.writeFileSync(path.join(outDir, 'threads_reply.txt'), bundle.threadsReply + '\n', 'utf8');
  fs.writeFileSync(path.join(outDir, 'instagram_caption.txt'), bundle.instagramCaption + '\n', 'utf8');
  fs.writeFileSync(path.join(outDir, 'facebook_post.txt'), bundle.facebookPost + '\n', 'utf8');
  fs.writeFileSync(
    path.join(outDir, 'post_bundle.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        slug: preset.slug,
        keyword: preset.keyword,
        targetUrl: bundle.targetUrl,
        gridPngPath,
        publicImageUrl: `${cfg.siteUrl}/sns/${preset.slug}-grid.png`,
        slidePaths,
        threadsMain: bundle.threadsMain,
        threadsReply: bundle.threadsReply,
        instagramCaption: bundle.instagramCaption,
        facebookPost: bundle.facebookPost
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  // Send photo + copy pack to Telegram if requested
  if (options.sendTelegram && cfg.isConfigured && fs.existsSync(gridPngPath)) {
    await sendTelegramPhoto(
      cfg.botToken,
      cfg.chatId,
      gridPngPath,
      `🎨 <b>[${preset.keyword}] 4컷 웹툰 × 실물 영수증 자동 생성 완료!</b>\n• 위 이미지를 꾹 눌러 저장하거나 바로 인스타·쓰레드·페북에 공유하세요.`
    );
  }

  return {
    slug: preset.slug,
    keyword: preset.keyword,
    outDir,
    gridPngPath,
    slidePaths,
    bundle
  };
}

/**
 * Generate Official MoneyFit SNS Brand Profile Avatar (1080x1080), Facebook Cover (1640x624), and Bio text
 */
function generateBrandAssets() {
  const brandDir = path.join(OUTBOX_ROOT, 'brand');
  if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

  const chromePath = findChromeExecutable();
  const avatarPath = path.join(brandDir, 'profile-avatar.png');
  const coverPath = path.join(brandDir, 'facebook-cover.png');
  const bioPath = path.join(brandDir, 'profile-bio.txt');

  const bioText = [
    `[프로필 이름]`,
    `머니핏(MoneyFit) | 3초 생활·금융 손익계산기`,
    ``,
    `[소개글 (Bio) — 인스타 · 쓰레드 · 페북 공통]`,
    `🧾 감으로 돈 쓰다 호구 잡히기 전에 3초 영수증 팩트체크!`,
    `⚡ 한전 에어컨 누진세 · 🥗 다이어트 식단 · 🐾 사료 급여량`,
    `🛋️ 자취 예산 · 🚗 신차 장기렌트 TCO · 🌐 인터넷 위약금 비교`,
    `👇 회원가입 없는 100% 무료 손익 계산기 바로가기`,
    ``,
    `[웹사이트 링크]`,
    `https://truthofmarket.com`
  ].join('\n');
  fs.writeFileSync(bioPath, bioText + '\n', 'utf8');

  if (chromePath) {
    const avatarHtml = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0;}body{width:1080px;height:1080px;overflow:hidden;background:#0f172a;font-family:"Pretendard","Malgun Gothic",sans-serif;}</style></head>
<body>
<canvas id="c" width="1080" height="1080"></canvas>
<script>
const c = document.getElementById('c');
const ctx = c.getContext('2d');
const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
grad.addColorStop(0, '#0f172a');
grad.addColorStop(1, '#1e1b4b');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, 1080, 1080);

// Outer emerald glow ring
ctx.strokeStyle = '#10b981';
ctx.lineWidth = 22;
ctx.beginPath();
ctx.arc(540, 540, 480, 0, Math.PI * 2);
ctx.stroke();

// Top pill
ctx.fillStyle = '#10b981';
ctx.beginPath();
ctx.roundRect(290, 150, 500, 82, 41);
ctx.fill();
ctx.fillStyle = '#042f2e';
ctx.font = 'bold 40px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('🧾 3초 손익 영수증', 540, 205);

// Main Brand Title
ctx.fillStyle = '#ffffff';
ctx.font = '900 135px sans-serif';
ctx.fillText('MoneyFit', 540, 395);

ctx.fillStyle = '#fde68a';
ctx.font = 'bold 58px sans-serif';
ctx.fillText('머니핏 팩트체크 연구소', 540, 485);

// Cute smart character mascot in center-bottom
ctx.save();
ctx.translate(540, 690);
ctx.scale(2.4, 2.4);
ctx.fillStyle = '#10b981';
ctx.beginPath();
ctx.roundRect(-52, 42, 104, 62, 28);
ctx.fill();
ctx.fillStyle = '#fde68a';
ctx.beginPath();
ctx.arc(0, 0, 46, 0, Math.PI * 2);
ctx.fill();
ctx.lineWidth = 4;
ctx.strokeStyle = '#1e293b';
ctx.stroke();
ctx.fillStyle = '#1e293b';
ctx.beginPath();
ctx.arc(0, -10, 46, Math.PI, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#1e293b';
ctx.beginPath();
ctx.arc(-16, -2, 5, 0, Math.PI * 2);
ctx.arc(16, -2, 5, 0, Math.PI * 2);
ctx.fill();
ctx.strokeStyle = '#0f172a';
ctx.lineWidth = 3.5;
ctx.strokeRect(-29, -12, 24, 18);
ctx.strokeRect(5, -12, 24, 18);
ctx.beginPath();
ctx.moveTo(-5, -3);
ctx.lineTo(5, -3);
ctx.stroke();
ctx.beginPath();
ctx.arc(0, 14, 13, 0.15 * Math.PI, 0.85 * Math.PI);
ctx.stroke();
ctx.restore();

ctx.fillStyle = '#34d399';
ctx.font = 'bold 42px monospace';
ctx.fillText('truthofmarket.com', 540, 960);
</script>
</body>
</html>`;
    renderPngWithChrome(chromePath, avatarHtml, avatarPath);

    const coverHtml = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0;}body{width:1640px;height:624px;overflow:hidden;background:#0f172a;font-family:"Pretendard","Malgun Gothic",sans-serif;}</style></head>
<body>
<canvas id="c" width="1640" height="624"></canvas>
<script>
const c = document.getElementById('c');
const ctx = c.getContext('2d');
const grad = ctx.createLinearGradient(0, 0, 1640, 624);
grad.addColorStop(0, '#0f172a');
grad.addColorStop(0.6, '#1e1b4b');
grad.addColorStop(1, '#064e3b');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, 1640, 624);

ctx.fillStyle = '#10b981';
ctx.beginPath();
ctx.roundRect(90, 72, 460, 56, 28);
ctx.fill();
ctx.fillStyle = '#042f2e';
ctx.font = 'bold 28px sans-serif';
ctx.fillText('⚡ 2026 대한민국 표준 손익·요율 계산기', 120, 110);

ctx.fillStyle = '#ffffff';
ctx.font = '900 72px sans-serif';
ctx.fillText('결제 직전 3초, 호구 탈출 실물 영수증', 90, 225);

ctx.fillStyle = '#fde68a';
ctx.font = 'bold 38px sans-serif';
ctx.fillText('전기요금 누진세 · 식단 장보기 · 사료 급여량 · 자취 예산 · 자동차 TCO · 인터넷 위약금', 90, 305);

const chips = ['⚡ 전기세 누진세', '🥗 탄단지 장보기', '🐾 사료 g수 계산', '🛋️ 자취 예산 BOM', '🚗 신차 렌트/할부', '🌐 인터넷 47만 사은품'];
chips.forEach((ch, idx) => {
  const x = 90 + idx * 245;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(x, 365, 230, 68, 18);
  ctx.fill();
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(ch, x + 22, 408);
});

ctx.fillStyle = '#10b981';
ctx.beginPath();
ctx.roundRect(90, 480, 680, 82, 22);
ctx.fill();
ctx.fillStyle = '#042f2e';
ctx.font = 'bold 32px sans-serif';
ctx.fillText('👉 무료 계산기 바로가기 : truthofmarket.com', 125, 532);
</script>
</body>
</html>`;
    const tempHtmlPath = coverPath.replace(/\.png$/i, '.temp.html');
    fs.writeFileSync(tempHtmlPath, coverHtml, 'utf8');
    const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');
    spawnSync(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--window-size=1640,624',
        `--screenshot=${coverPath}`,
        fileUrl
      ],
      { encoding: 'utf8', timeout: 20000 }
    );
    try {
      if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
    } catch (e) {
      // ignore
    }
  }

  return { avatarPath, coverPath, bioPath, bioText };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const slugArg = args.find(a => a.startsWith('--slug='));
  const slug = slugArg ? slugArg.split('=')[1] : undefined;
  const sendTelegram = args.includes('--telegram');
  const genBrand = args.includes('--brand');
  const genTop6 = args.includes('--top6');

  (async () => {
    if (genBrand) {
      const b = generateBrandAssets();
      console.log(`✓ Generated Official Brand Profile Avatar & Cover in ${ path.dirname(b.avatarPath) }`);
    }
    if (genTop6) {
      const topSlugs = [
        'electric-studio-ac',
        'diet-male-fatloss',
        'pet-maltese-5kg',
        'room-oneroom-100',
        'auto-grandeur-5000',
        'telecom-penalty-15'
      ];
      for (const s of topSlugs) {
        const r = await generateWebtoonPack({ slug: s, sendTelegram: false });
        console.log(`✓ Generated Top-6 Webtoon Pack: [${r.keyword}] (${r.slug})`);
      }
    } else {
      const res = await generateWebtoonPack({ slug, sendTelegram });
      console.log(`✓ Generated 4-Cut Webtoon PNG & SNS pack for [${res.keyword}] (${res.slug})`);
      console.log(`  - Grid PNG : ${res.gridPngPath}`);
      console.log(`  - Slides   : ${res.slidePaths.length} files in ${res.outDir}`);
    }
  })().catch(err => {
    console.error('SNS Auto-Publisher Error:', err.message);
    process.exit(1);
  });
}

module.exports = {
  buildStoryForPreset,
  generateWebtoonPack,
  generateBrandAssets,
  sendTelegramPhoto
};
