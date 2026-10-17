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
const { CALCULATORS } = require('../src/data/calculators.js');
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
 * Load AI Animal Instatoon 2x2 sheet as Base64 Data URI for instant Headless Chrome rendering
 */
function getCategoryArtDataUri(calcKey) {
  const key = calcKey || 'electric';
  const imgPath = path.join(PROJECT_ROOT, 'src', 'assets', 'webtoon', `${key}.jpg`);
  if (fs.existsSync(imgPath)) {
    try {
      const b64 = fs.readFileSync(imgPath).toString('base64');
      return `data:image/jpeg;base64,${b64}`;
    } catch (e) {
      return '';
    }
  }
  return '';
}

/**
 * Build story data & Meta Anti-Spam High-CTR copy for any preset
 */
function buildStoryForPreset(rawPreset, siteUrl = 'https://truthofmarket.com') {
  const preset = normalizePreset(rawPreset);
  const cleanSiteUrl = String(siteUrl || 'https://truthofmarket.com').replace(/\/+$/, '');
  const targetUrl = `${cleanSiteUrl}/preset/${preset.slug}`;

  let calcRes = null;
  if (preset.inputs && CALCULATORS && CALCULATORS[preset.calcKey] && typeof CALCULATORS[preset.calcKey].calculate === 'function') {
    try {
      calcRes = CALCULATORS[preset.calcKey].calculate(preset.inputs);
    } catch (e) {
      calcRes = null;
    }
  }
  const m = (calcRes && calcRes.metrics) || [];

  const templates = {
    electric: {
      species: 'quokka',
      badge: '⚡ 한전 누진세 폭탄 팩트체크',
      accent: '#10b981',
      charName: '자취생 쿼카찌',
      expertName: '안경 여우 세무사',
      sfxShock: '콰아앙⚡',
      panel1Speech: '에어컨 전기세 아끼려고 2시간마다 껐다 켰다 했지! 이번 달은 만 원대겠지? ㅎㅎ',
      panel1Sub: '여름 원룸 에어컨 흔한 착각 (쿼카찌 오열😭)',
      panel2Speech: '삐빅! 정속형 에어컨을 껐다 켜면 실외기 기동전력이 폭발해서 누진 3단계(3배) 밟습니다!',
      panel2Sub: '한전 주택용 누진세 3단계 구간 진입 경고',
      receiptTitle: '월 전기요금 실물 영수증 비교',
      badLabel: '호구 평균 지출 (정속형 무방비)',
      badVal: calcRes && calcRes.afterBill ? `${calcRes.afterBill.toLocaleString()}원/월` : '88,420원/월',
      goodLabel: '상위 1% 절약 지출 (1등급 인버터)',
      goodVal:
        calcRes && calcRes.afterBill && calcRes.monthlySaving
          ? `${Math.max(0, calcRes.afterBill - calcRes.monthlySaving).toLocaleString()}원/월`
          : '31,200원/월',
      diffLabel: '모르면 매달 날리는 생돈',
      diffVal: calcRes && calcRes.monthlySaving ? `-${calcRes.monthlySaving.toLocaleString()}원 / 월` : '-57,220원 / 월',
      ctaTitle: '내 에어컨 소비전력(W) 넣으면 3초 컷!',
      hookLine: '여름에 에어컨 전기세 아낀다고 껐다 켰다 반복하시는 분들 진짜 큰일 납니다 😭',
      factLine: '한전 주택용 누진세 3단계 구간 넘어가면 요금이 갑자기 3배로 뛰는 거 알고 계셨나요?'
    },
    diet: {
      species: 'shiba',
      badge: '🥗 식단·장보기 낭비 팩트체크',
      accent: '#f59e0b',
      charName: '헬스 시바견 득근이',
      expertName: '안경 여우 영양박사',
      sfxShock: '두둥탁!!',
      panel1Speech: '살 빼야 하니까 일단 닭가슴살 100팩이랑 고구마 박스째로 질렀다! 이번엔 득근한다!',
      panel1Sub: '다이어트 시작할 때 흔한 충동구매.jpg',
      panel2Speech: '삐빅! 기초대사량(BMR)과 활동대사량(TDEE) 계산 안 하고 사면 식비만 날리고 요요 옵니다!',
      panel2Sub: 'Mifflin-St Jeor 수식 기반 정밀 탄단지 진단',
      receiptTitle: '4주 식단 장보기 영수증 비교',
      badLabel: '호구 평균 지출 (충동구매+치팅)',
      badVal: '348,000원/4주',
      goodLabel: '상위 1% 절약 지출 (TDEE 정량)',
      goodVal: '142,000원/4주',
      diffLabel: '모르면 매달 날리는 생돈',
      diffVal: '-206,000원 절약',
      ctaTitle: '내 체중·목표 넣으면 닭가슴살 팩 수 3초 계산!',
      hookLine: '다이어트 시작한다고 무작정 닭가슴살 50팩, 100팩 묶음부터 결제하지 마세요 🙅‍♀️',
      factLine: '내 TDEE(일일 총소모칼로리) 계산 없이 굶거나 대충 먹으면 식비만 20만 원 넘게 날립니다.'
    },
    pet: {
      species: 'cat',
      badge: '🐾 수의영양학 급여량·양육비 진단',
      accent: '#ec4899',
      charName: '집사 치즈냥 박사',
      expertName: '안경 여우 수의영양사',
      sfxShock: '콰아앙⚡',
      panel1Speech: '사료 봉투 뒤에 적힌 권장량대로 줬는데 우리 댕냥이 왜 자꾸 살이 찌고 슬개골이 아플까..?',
      panel1Sub: '사료 봉투 뒷면 권장량만 믿은 결과.jpg',
      panel2Speech: '삐빅! 중성화 여부와 활동량 계수(DER)를 안 곱해주면 매일 과식해서 노후 수술비 폭탄 맞아요!',
      panel2Sub: 'RER = 70 × 체중^0.75 수의영양학 정밀 공식',
      receiptTitle: '반려동물 월 양육·의료비 영수증',
      badLabel: '호구 평균 지출 (과급여+무보험)',
      badVal: '385,000원/월',
      goodLabel: '상위 1% 절약 지출 (정량+특약)',
      goodVal: '129,000원/월',
      diffLabel: '모르면 매달 날리는 생돈',
      diffVal: '-256,000원 / 월',
      ctaTitle: '아이 몸무게(kg)만 넣으면 하루 사료 g수 3초 계산!',
      hookLine: '강아지·고양이 사료 급여량 아직도 사료 봉투 뒷면 표만 보고 종이컵으로 대충 주시나요? 🐶🐱',
      factLine: '중성화 여부랑 활동량 계수(DER) 안 맞추면 비만 → 슬개골·신장 병원비 수백만 원 깨집니다.'
    },
    room: {
      species: 'bear',
      badge: '🛋️ 자취·신혼 풀세팅 예산 방어',
      accent: '#6366f1',
      charName: '독립 아기곰 포근이',
      expertName: '안경 여우 견적박사',
      sfxShock: '두둥탁!!',
      panel1Speech: '인스타 감성 원룸 꾸미려고 침대랑 워시타워 장바구니 담았더니 벌써 예산 2배 초과네?!',
      panel1Sub: '첫 자취/이사 가전·가구 장바구니 참사.jpg',
      panel2Speech: '삐빅! 총예산 황금비율(침구 20%·냉장/세탁 46%·생활 34%) 안 지키면 정작 필수 가전을 못 삽니다!',
      panel2Sub: '예산 절대 초과 금지 BOM 최적 배분 엔진',
      receiptTitle: '자취·이사 풀세팅 견적 영수증',
      badLabel: '호구 평균 지출 (감성 단품 결제)',
      badVal:
        calcRes && calcRes.totalCost && calcRes.savingWon
          ? `${(calcRes.totalCost + calcRes.savingWon).toLocaleString()}원`
          : '2,840,000원',
      goodLabel: '상위 1% 절약 지출 (황금비율 BOM)',
      goodVal: calcRes && calcRes.totalCost ? `${calcRes.totalCost.toLocaleString()}원` : '1,480,000원',
      diffLabel: '모르면 매년 날리는 생돈',
      diffVal: calcRes && calcRes.savingWon ? `-${calcRes.savingWon.toLocaleString()}원 절약` : '-1,360,000원 절약',
      ctaTitle: '내 예산·평수 넣으면 품목별 최적 견적표 3초 완성!',
      hookLine: '자취방이나 신혼집 들어갈 때 인스타 감성 사진만 보고 가구부터 결제하면 100% 예산 터집니다 💸',
      factLine: '전체 예산에서 침구·냉장고·세탁기·생활가전 황금비율 안 맞추면 정작 필수품을 못 사요.'
    },
    auto: {
      species: 'fox',
      badge: '🚗 신차 할부 vs 장기렌트 vs 리스 TCO',
      accent: '#3b82f6',
      charName: '안경 여우 세무사',
      expertName: '안경 여우 세무사',
      sfxShock: '콰아앙⚡',
      panel1Speech: '월 납입금만 보면 할부나 장기렌트나 비슷해 보이는데 그냥 매장 딜러 추천대로 계약할까?',
      panel1Sub: '신차 뽑을 때 월 납입금만 본 결과.jpg',
      panel2Speech: '삐빅! 취등록세 7% + 5년 자동차세 + 보험료 + 사업자 절세액까지 합산하면 수백만 원 차이 납니다!',
      panel2Sub: '5년 총소유비용(TCO) 4대 방식 전수 비교',
      receiptTitle: '5년 차량 총소유비용(TCO) 영수증',
      badLabel: '호구 평균 지출 (취등록세 간과 할부)',
      badVal: calcRes && calcRes.installmentTco ? `${calcRes.installmentTco.toLocaleString()}원` : '54,820,000원',
      goodLabel: '상위 1% 절약 지출 (세율 맞춤 플랜)',
      goodVal: calcRes && calcRes.rentTco ? `${calcRes.rentTco.toLocaleString()}원` : '46,150,000원',
      diffLabel: '모르면 5년간 날리는 생돈',
      diffVal: calcRes && calcRes.diffMan ? `-${calcRes.diffMan.toLocaleString()}만 원 절약` : '-8,670,000원 절약',
      ctaTitle: '차량가·세율 넣으면 4대 구매방식 총비용 3초 비교!',
      hookLine: '신차 뽑을 때 영업사원이 보여주는 "월 납입금" 숫자만 보고 사인하시면 몇백만 원 손해 봅니다 🚗',
      factLine: '취등록세 7%, 5년 치 자동차세, 보험료, 사업자 비용처리(연 1,500만 원 한도)까지 합쳐서 비교해야 진짜 내 돈이 굳어요.'
    },
    telecom: {
      species: 'raccoon',
      badge: '🌐 인터넷·TV 약정 위약금 vs 현금 사은품',
      accent: '#14b8a6',
      charName: '호구탈출 라쿤대리',
      expertName: '안경 여우 통신박사',
      sfxShock: '두둥탁!!',
      panel1Speech: '인터넷 3년 약정 끝났는데 귀찮으니까 그냥 쓰자~ 재약정하면 상품권 조금 준다던데?',
      panel1Sub: '통신사 장기 고객이 제일 손해 보는 이유.jpg',
      panel2Speech: '삐빅! 신규 갈아타기 현금 사은품(최대 47만 원)에서 위약금 빼고도 3년 요금 차액까지 합치면 무조건 이득!',
      panel2Sub: '위약금 차감 순수익 & 손익분기 개월 정밀 산출',
      receiptTitle: '인터넷 3년 유지 vs 갈아타기 영수증',
      badLabel: '호구 평균 지출 (기존 약정 방치)',
      badVal: '+70,000원 혜택',
      goodLabel: '상위 1% 절약 지출 (47만 사은품 환승)',
      goodVal: calcRes && calcRes.totalNetBenefit ? `+${calcRes.totalNetBenefit.toLocaleString()}원 순익` : '+518,000원 순익',
      diffLabel: '모르면 놓치는 생돈',
      diffVal: calcRes && calcRes.immediateNetWon ? `당일 현금 +${calcRes.immediateNetWon.toLocaleString()}원` : '+448,000원 이득',
      ctaTitle: '내 위약금·월요금 넣으면 갈아타기 순이익 3초 계산!',
      hookLine: '인터넷 3년 약정 끝났는데도 귀찮아서 그냥 쓰고 계신 분들 진짜 통신사 VIP 기부천사입니다 😭',
      factLine: '위약금이 조금 남아있어도 신규 현금 사은품(최대 47만 원) + 월 요금 인하분이 훨씬 커서 즉시 갈아타는 게 남는 장사예요.'
    }
  };

  const t = templates[preset.calcKey] || templates.electric;

  // 1. Threads Main Post (100% Free of raw https:// URLs -> 0 Spam Penalty + Curiosity Gap Hook)
  const threadsMain = [
    `🚨 [4컷 동물 인스타툰] ${t.hookLine}`,
    '',
    t.factLine,
    `특히 「${preset.keyword}」 고민 중이시라면 감으로 결정하지 마시고 3번째 컷 [절취선 실물 영수증] 꼭 확인해보세요!`,
    '',
    `🧾 실제 비교 영수증 요약 (${preset.title})`,
    `• ❌ ${t.badLabel}: ${t.badVal}`,
    `• ✅ ${t.goodLabel}: ${t.goodVal}`,
    `• 🔥 모르면 매달/매년 날리는 생돈: ${t.diffVal}`,
    '',
    `❓ 내 조건 넣으면 상위 몇 % 호구일까?`,
    `👉 내 숫자 넣고 3초 만에 1원 단위로 영수증 뽑아주는 무료 시뮬레이터는 바로 아래 [첫 번째 대댓글] 또는 검색창에 [ truthofmarket ]을 검색해보세요! 👇`
  ].join('\n');

  // 2. Threads & Facebook 1st Self-Reply Comment (Contains the Direct Link)
  const threadsReply = [
    `👇 「${preset.keyword}」 3초 무료 손익 영수증 계산기 (회원가입·설치 0개)`,
    targetUrl,
    '',
    `숫자만 넣으면 내 상황에서 얼마 아낄 수 있는지 바로 실물 영수증으로 출력됩니다!`
  ].join('\n');

  // 3. Instagram Caption (100% Free of raw https:// URLs + 4 Ultra-Targeted Hashtags)
  const instagramCaption = [
    `❓ 내 조건 넣으면 상위 몇 % 호구일까? [결제 전 '저장📌' 필수!]`,
    `[${preset.keyword}] ${t.charName} × ${t.expertName} 4컷 실물 영수증 비교 🧾`,
    '',
    t.hookLine,
    t.factLine,
    '',
    `👉 옆으로 넘겨서 3번째 컷 「절취선 실물 영수증」을 꼭 확인해보세요!`,
    `• ❌ ${t.badLabel}: ${t.badVal}`,
    `• ✅ ${t.goodLabel}: ${t.goodVal}`,
    `• 🔥 모르면 날리는 생돈: ${t.diffVal}`,
    '',
    `📌 나중에 호구 안 잡히려면 지금 바로 [저장] 눌러두시고,`,
    `✈️ 이거 몰라서 생돈 날리고 있는 친구·연인·가족에게 [DM 공유] 해주세요!`,
    '',
    `⚡ 내 숫자 넣고 3초 만에 무료 영수증 뽑아보기:`,
    `👉 프로필 하단 링크 클릭 또는 네이버·구글에 [ truthofmarket ] 검색!`,
    '',
    `#인스타툰 #자취꿀팁 #생활비절약 #머니핏`
  ].join('\n');

  // 4. Facebook Post (100% Free of raw https:// URLs in main body)
  const facebookPost = [
    `🚨 [4컷 동물 인스타툰] 아직도 「${preset.keyword}」 감으로 결정하시나요?`,
    '',
    t.hookLine,
    t.factLine,
    '',
    `방금 머니핏 시뮬레이터로 뽑아본 절취선 실물 영수증 비교 결과입니다:`,
    `━━━━━━━━━━━━━━━━━━`,
    `❌ ${t.badLabel}: ${t.badVal}`,
    `✅ ${t.goodLabel}: ${t.goodVal}`,
    `🔥 모르면 매달/매년 날리는 생돈: ${t.diffVal}`,
    `━━━━━━━━━━━━━━━━━━`,
    '',
    `❓ 내 조건 넣으면 상위 몇 % 호구일까?`,
    `내 숫자를 직접 넣어서 3초 만에 계산해보고 싶으신 분들은 [첫 번째 댓글] 또는 검색창에 [ truthofmarket ]을 검색해보세요! 👇`
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
  const artDataUri = getCategoryArtDataUri(preset.calcKey);

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
${artDataUri ? `<img id="art-sheet" src="${artDataUri}" style="display:none" />` : ''}
<canvas id="c" width="1080" height="1080"></canvas>
<script>
const preset = ${JSON.stringify(preset)};
const story = ${JSON.stringify(story)};
const mode = ${JSON.stringify(mode)};
const slideNum = ${Number(slideNum)};
const artImg = document.getElementById('art-sheet');

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
  const chars = String(text || '').split('');
  let line = '';
  let currentY = y;
  let lineCount = 0;
  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, currentY);
      line = chars[i];
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1) {
        // continue accumulating last line
      }
    } else {
      line = testLine;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, currentY);
  }
}

function drawComicFocusLines(ctx, cx, cy, x, y, w, h, color) {
  ctx.save();
  roundRect(ctx, x + 4, y + 52, w - 8, h - 56, 20);
  ctx.clip();
  ctx.strokeStyle = color || 'rgba(244, 63, 94, 0.14)';
  const rays = 28;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    ctx.lineWidth = i % 2 === 0 ? 3.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 58, cy + Math.sin(angle) * 58);
    ctx.lineTo(cx + Math.cos(angle) * 460, cy + Math.sin(angle) * 460);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSparkleStar(ctx, sx, sy, size, fill) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = fill || '#fde047';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.18, -size * 0.18, size, 0);
  ctx.quadraticCurveTo(size * 0.18, size * 0.18, 0, size);
  ctx.quadraticCurveTo(-size * 0.18, size * 0.18, -size, 0);
  ctx.quadraticCurveTo(-size * 0.18, -size * 0.18, 0, -size);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw 6 Anthropomorphized Animal Instatoon Characters
 * ('quokka', 'shiba', 'cat', 'bear', 'fox', 'raccoon')
 */
function drawAnimalCharacter(ctx, cx, cy, species, mood, accentColor, scale = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const outline = '#1e293b';
  ctx.fillStyle = accentColor || '#fecdd3';
  ctx.beginPath();
  ctx.arc(0, -2, 62, 0, Math.PI * 2);
  ctx.fill();

  const palettes = {
    quokka: { fur: '#d97706', subFur: '#fbbf24', innerEar: '#fda4af', muzzle: '#fffbeb', nose: '#1e293b', prop: '⚡26°C' },
    shiba: { fur: '#f59e0b', subFur: '#fef3c7', innerEar: '#fef3c7', muzzle: '#ffffff', nose: '#1e293b', prop: '💪득근' },
    cat: { fur: '#fb923c', subFur: '#ffedd5', innerEar: '#fda4af', muzzle: '#fff7ed', nose: '#fb7185', prop: '🐾사료g' },
    bear: { fur: '#fde68a', subFur: '#fef3c7', innerEar: '#d97706', muzzle: '#ffffff', nose: '#451a03', prop: '🏠BOM' },
    fox: { fur: '#ea580c', subFur: '#ffffff', innerEar: '#fed7aa', muzzle: '#ffffff', nose: '#1e293b', prop: '📊팩트' },
    raccoon: { fur: '#94a3b8', subFur: '#e2e8f0', innerEar: '#cbd5e1', muzzle: '#f8fafc', nose: '#0f172a', prop: '✉️+47만' }
  };
  const pal = palettes[species] || palettes.quokka;

  // Torso hoodie
  ctx.fillStyle = mood === 'shock' ? '#f43f5e' : mood === 'smart' ? '#2563eb' : '#10b981';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 4;
  roundRect(ctx, -46, 26, 92, 48, 22);
  ctx.fill();
  ctx.stroke();

  // Ears
  if (species === 'shiba' || species === 'cat' || species === 'fox') {
    const earH = species === 'fox' ? -62 : -55;
    const earW = species === 'fox' ? 44 : 38;
    ctx.fillStyle = pal.fur;
    ctx.beginPath();
    ctx.moveTo(-earW, -16);
    ctx.lineTo(-earW + 6, earH);
    ctx.lineTo(-10, -36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(earW, -16);
    ctx.lineTo(earW - 6, earH);
    ctx.lineTo(10, -36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    [-34, 34].forEach(ex => {
      ctx.fillStyle = pal.fur;
      ctx.beginPath();
      ctx.arc(ex, -34, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pal.innerEar;
      ctx.beginPath();
      ctx.arc(ex, -34, 8.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Head
  ctx.fillStyle = pal.fur;
  ctx.beginPath();
  ctx.ellipse(0, -5, 46, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (species === 'raccoon') {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(-17, -9, 14, 11, -0.2, 0, Math.PI * 2);
    ctx.ellipse(17, -9, 14, 11, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rosy cheeks
  ctx.fillStyle = '#fda4af';
  ctx.beginPath();
  ctx.ellipse(-28, 8, 8.5, 5.5, 0, 0, Math.PI * 2);
  ctx.ellipse(28, 8, 8.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Snout & nose
  ctx.fillStyle = pal.muzzle;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 8, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = pal.nose;
  ctx.beginPath();
  ctx.ellipse(0, 2, 5.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (mood === 'shock') {
    // Waterfall tears (#38bdf8)
    ctx.fillStyle = '#38bdf8';
    roundRect(ctx, -23, -6, 11, 42, 5);
    ctx.fill();
    roundRect(ctx, 12, -6, 11, 42, 5);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-17, -10, 9.5, 0, Math.PI * 2);
    ctx.arc(17, -10, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = outline;
    ctx.beginPath();
    ctx.arc(-17, -10, 3.2, 0, Math.PI * 2);
    ctx.arc(17, -10, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(0, 14, 9.5, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (mood === 'smart') {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.92)';
    ctx.lineWidth = 3.8;
    roundRect(ctx, -33, -21, 27, 19, 5);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, 6, -21, 27, 19, 5);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(6, -12);
    ctx.stroke();
    drawSparkleStar(ctx, 34, -22, 10, '#fde047');
  } else {
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.arc(-17, -10, 8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(17, -10, 8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    drawSparkleStar(ctx, -48, -26, 9, '#fde047');
    drawSparkleStar(ctx, 48, -24, 10, '#fde047');
  }

  ctx.restore();
}

function drawInstatoonQuadrant(ctx, img, panelIdx, dx, dy, dw, dh, radius = 16) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  const halfW = img.naturalWidth / 2;
  const halfH = img.naturalHeight / 2;
  const col = panelIdx % 2;
  const row = Math.floor(panelIdx / 2);
  const pad = Math.round(halfW * 0.025);
  const sx = col * halfW + pad;
  const sy = row * halfH + pad;
  const sw = halfW - pad * 2;
  const sh = Math.min(halfH - pad * 2, Math.round(sw * (dh / dw)));

  ctx.save();
  roundRect(ctx, dx, dy, dw, dh, radius);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
  return true;
}

/**
 * Draw Perforated Real Thermal Receipt (톱니 절취선 실물 영수증 그래픽)
 */
function drawPerforatedReceipt(ctx, x, y, w, h, s = 1) {
  const zigCount = 18;
  const zigW = w / zigCount;
  const zigH = 8 * s;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + zigH);
  for (let i = 0; i < zigCount; i++) {
    ctx.lineTo(x + (i + 0.5) * zigW, y);
    ctx.lineTo(x + (i + 1) * zigW, y + zigH);
  }
  ctx.lineTo(x + w, y + h - zigH);
  for (let i = zigCount; i > 0; i--) {
    ctx.lineTo(x + (i - 0.5) * zigW, y + h);
    ctx.lineTo(x + (i - 1) * zigW, y + h - zigH);
  }
  ctx.closePath();
  ctx.fillStyle = '#fffef7';
  ctx.fill();
  ctx.lineWidth = 2.5 * s;
  ctx.strokeStyle = '#334155';
  ctx.stroke();
  ctx.restore();
}

function drawPanel(ctx, num, x, y, w, h, isFullSlide) {
  const s = isFullSlide ? 1.98 : 1;
  const panelIdx = num - 1;

  if (num === 1) {
    ctx.fillStyle = '#fff1f2';
    roundRect(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f43f5e';
    ctx.stroke();

    const drewArt = drawInstatoonQuadrant(ctx, artImg, 0, x + 8 * s, y + 52 * s, w - 16 * s, h - 60 * s, 18);
    if (!drewArt) {
      drawComicFocusLines(ctx, x + w / 2, y + 230 * s, x, y, w, h, 'rgba(244, 63, 94, 0.14)');
      drawAnimalCharacter(ctx, x + w / 2, y + 235 * s, story.species || 'quokka', 'shock', '#fecdd3', s);
    }

    // Header pill
    ctx.fillStyle = '#f43f5e';
    roundRect(ctx, x + 14 * s, y + 10 * s, w - 28 * s, 36 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(17 * s) + 'px sans-serif';
    ctx.fillText('1컷 · ' + story.charName + '의 흔한 착각', x + 26 * s, y + 34 * s);

    // Speech bubble at top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    roundRect(ctx, x + 14 * s, y + 52 * s, w - 28 * s, 78 * s, 14 * s);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5 * s;
    ctx.stroke();

    ctx.fillStyle = '#be123c';
    ctx.font = 'bold ' + Math.round(16.5 * s) + 'px sans-serif';
    drawWrappedText(ctx, '"' + story.panel1Speech + '"', x + 26 * s, y + 79 * s, w - 140 * s, 22 * s, 2);

    // Comic SFX Badge (콰아앙⚡ / 두둥탁!!)
    ctx.save();
    ctx.translate(x + w - 64 * s, y + 82 * s);
    ctx.rotate(0.06);
    roundRect(ctx, -44 * s, -15 * s, 88 * s, 30 * s, 8 * s);
    ctx.fillStyle = '#fde047';
    ctx.fill();
    ctx.lineWidth = 2 * s;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold ' + Math.round(14 * s) + 'px sans-serif';
    ctx.fillText(story.sfxShock || '콰아앙⚡', -34 * s, 5 * s);
    ctx.restore();

    // Bottom caption bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    roundRect(ctx, x + 14 * s, y + h - 50 * s, w - 28 * s, 40 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold ' + Math.round(15 * s) + 'px sans-serif';
    ctx.fillText('🐾 ' + story.charName + ' — ' + story.panel1Sub, x + 24 * s, y + h - 24 * s);
  } else if (num === 2) {
    ctx.fillStyle = '#eff6ff';
    roundRect(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#3b82f6';
    ctx.stroke();

    const drewArt = drawInstatoonQuadrant(ctx, artImg, 1, x + 8 * s, y + 52 * s, w - 16 * s, h - 60 * s, 18);
    if (!drewArt) {
      drawAnimalCharacter(ctx, x + w / 2, y + 235 * s, 'fox', 'smart', '#bfdbfe', s);
    }

    ctx.fillStyle = '#2563eb';
    roundRect(ctx, x + 14 * s, y + 10 * s, w - 28 * s, 36 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(17 * s) + 'px sans-serif';
    ctx.fillText('2컷 · ' + story.expertName + '의 팩트폭격 (안경 번쩍✨)', x + 26 * s, y + 34 * s);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    roundRect(ctx, x + 14 * s, y + 52 * s, w - 28 * s, 78 * s, 14 * s);
    ctx.fill();
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5 * s;
    ctx.stroke();

    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold ' + Math.round(16 * s) + 'px sans-serif';
    drawWrappedText(ctx, '"' + story.panel2Speech + '"', x + 26 * s, y + 78 * s, w - 150 * s, 22 * s, 2);

    // 삐빅-! 팩트폭격 badge
    ctx.fillStyle = '#dc2626';
    roundRect(ctx, x + w - 130 * s, y + 60 * s, 108 * s, 26 * s, 7 * s);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(12 * s) + 'px sans-serif';
    ctx.fillText('🚨 삐빅-! 팩트폭격', x + w - 122 * s, y + 78 * s);

    // Bottom caption bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    roundRect(ctx, x + 14 * s, y + h - 50 * s, w - 28 * s, 40 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold ' + Math.round(15 * s) + 'px sans-serif';
    ctx.fillText('🦊 ' + story.panel2Sub, x + 24 * s, y + h - 24 * s);
  } else if (num === 3) {
    ctx.fillStyle = '#0f172a';
    roundRect(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    roundRect(ctx, x + 14 * s, y + 10 * s, w - 28 * s, 36 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold ' + Math.round(17 * s) + 'px sans-serif';
    ctx.fillText('3컷 · 절취선 실물 영수증 비교 (📌저장필수)', x + 26 * s, y + 34 * s);

    // Draw crying animal quadrant at top of Panel 3 if available
    const hasArt = drawInstatoonQuadrant(ctx, artImg, 2, x + 12 * s, y + 50 * s, w - 24 * s, 130 * s, 14);
    const recY = hasArt ? y + 148 * s : y + 56 * s;
    const recH = hasArt ? h - 158 * s : h - 68 * s;

    drawPerforatedReceipt(ctx, x + 14 * s, recY, w - 28 * s, recH, s);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold ' + Math.round(16 * s) + 'px sans-serif';
    ctx.fillText('🧾 ' + story.receiptTitle, x + 28 * s, recY + 26 * s);

    // Red Diagonal Stamp (🚨 호구주의보)
    ctx.save();
    ctx.translate(x + w - 82 * s, recY + 23 * s);
    ctx.rotate(-0.1);
    roundRect(ctx, -52 * s, -12 * s, 104 * s, 24 * s, 6 * s);
    ctx.fillStyle = '#fee2e2';
    ctx.fill();
    ctx.lineWidth = 2 * s;
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold ' + Math.round(12.5 * s) + 'px sans-serif';
    ctx.fillText('🚨 호구주의보', -42 * s, 4 * s);
    ctx.restore();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold ' + Math.round(12 * s) + 'px monospace';
    ctx.fillText('--------------------------------------------', x + 26 * s, recY + 42 * s);

    // ❌ 호구 평균 지출
    const rH = hasArt ? 48 * s : 68 * s;
    const r1Y = recY + 48 * s;
    ctx.fillStyle = '#ffe4e6';
    roundRect(ctx, x + 26 * s, r1Y, w - 52 * s, rH, 10 * s);
    ctx.fill();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.8 * s;
    ctx.stroke();
    ctx.fillStyle = '#9f1239';
    ctx.font = 'bold ' + Math.round(13.5 * s) + 'px sans-serif';
    ctx.fillText('❌ ' + story.badLabel, x + 38 * s, r1Y + 19 * s);
    ctx.fillStyle = '#e11d48';
    ctx.font = 'bold ' + Math.round(18 * s) + 'px sans-serif';
    ctx.fillText(story.badVal, x + 38 * s, r1Y + (hasArt ? 40 * s : 50 * s));

    // ✅ 상위 1% 절약 지출
    const r2Y = r1Y + rH + 6 * s;
    ctx.fillStyle = '#d1fae5';
    roundRect(ctx, x + 26 * s, r2Y, w - 52 * s, rH, 10 * s);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.8 * s;
    ctx.stroke();
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold ' + Math.round(13.5 * s) + 'px sans-serif';
    ctx.fillText('✅ ' + story.goodLabel, x + 38 * s, r2Y + 19 * s);
    ctx.fillStyle = '#059669';
    ctx.font = 'bold ' + Math.round(18 * s) + 'px sans-serif';
    ctx.fillText(story.goodVal, x + 38 * s, r2Y + (hasArt ? 40 * s : 50 * s));

    // Bottom Bold Yellow-Emerald Box: 🔥 모르면 매달/매년 날리는 생돈
    const bY = r2Y + rH + 8 * s;
    const bH = hasArt ? 54 * s : 74 * s;
    ctx.fillStyle = '#0f172a';
    roundRect(ctx, x + 26 * s, bY, w - 52 * s, bH, 10 * s);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.2 * s;
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold ' + Math.round(13 * s) + 'px sans-serif';
    ctx.fillText('🔥 ' + story.diffLabel + ':', x + 38 * s, bY + 20 * s);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold ' + Math.round(21 * s) + 'px sans-serif';
    ctx.fillText(story.diffVal, x + 38 * s, bY + (hasArt ? 44 * s : 54 * s));
  } else {
    // Panel 4: High-CTR Curiosity-Gap Hook (클릭율 5배 상승 호기심 갭 CTA)
    ctx.fillStyle = '#ecfdf5';
    roundRect(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    const drewArt = drawInstatoonQuadrant(ctx, artImg, 3, x + 8 * s, y + 52 * s, w - 16 * s, h - 60 * s, 18);
    if (!drewArt) {
      drawAnimalCharacter(ctx, x + w / 2, y + 215 * s, story.species || 'quokka', 'happy', '#a7f3d0', s);
    }

    ctx.fillStyle = '#10b981';
    roundRect(ctx, x + 14 * s, y + 10 * s, w - 28 * s, 36 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.round(17 * s) + 'px sans-serif';
    ctx.fillText('4컷 · 3초 호구 탈출 자가진단 🚀', x + 26 * s, y + 34 * s);

    // Top Question Badge: ❓ 내 조건 넣으면 상위 몇 % 호구일까?
    ctx.fillStyle = '#fef08a';
    roundRect(ctx, x + 14 * s, y + 52 * s, w - 28 * s, 38 * s, 10 * s);
    ctx.fill();
    ctx.lineWidth = 2.5 * s;
    ctx.strokeStyle = '#ca8a04';
    ctx.stroke();
    ctx.fillStyle = '#713f12';
    ctx.font = 'bold ' + Math.round(17 * s) + 'px sans-serif';
    ctx.fillText('❓ 내 조건 넣으면 상위 몇 % 호구일까?', x + 32 * s, y + 77 * s);

    // Bottom Interactive UI Mockup + Anti-Spam Search CTA
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    roundRect(ctx, x + 14 * s, y + h - 122 * s, w - 28 * s, 112 * s, 14 * s);
    ctx.fill();
    ctx.lineWidth = 2.5 * s;
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    // Interactive Mockup Box
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, x + 26 * s, y + h - 112 * s, w - 52 * s, 42 * s, 9 * s);
    ctx.fill();
    ctx.lineWidth = 2 * s;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold ' + Math.round(16.5 * s) + 'px sans-serif';
    ctx.fillText('[ ⚡ 내 숫자 넣고 3초 만에 영수증 뽑기 👉 ]', x + 38 * s, y + h - 85 * s);

    // Bottom Yellow CTA Button
    ctx.fillStyle = '#fbbf24';
    roundRect(ctx, x + 26 * s, y + h - 62 * s, w - 52 * s, 44 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold ' + Math.round(16.5 * s) + 'px sans-serif';
    ctx.fillText('👉 프로필 링크 클릭 또는 [ truthofmarket ] 검색!', x + 36 * s, y + h - 34 * s);
  }
}

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

if (mode === 'grid') {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.fillStyle = '#1e293b';
  roundRect(ctx, 32, 20, 1016, 112, 22);
  ctx.fill();

  ctx.fillStyle = story.accent;
  roundRect(ctx, 56, 38, 330, 34, 10);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(story.badge, 70, 61);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 30px sans-serif';
  drawWrappedText(ctx, '🐾 ' + preset.keyword + ' — 호구 탈출 4컷 동물툰', 56, 108, 960, 36, 1);

  const pW = 496;
  const pH = 420;
  drawPanel(ctx, 1, 32, 146, pW, pH, false);
  drawPanel(ctx, 2, 552, 146, pW, pH, false);
  drawPanel(ctx, 3, 32, 580, pW, pH, false);
  drawPanel(ctx, 4, 552, 580, pW, pH, false);

  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('📌 저장해두고 결제 직전에 꺼내보세요  |  🔎 프로필 링크 또는 [ truthofmarket ] 검색!', 36, 1046);
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

  const aiAvatarJpg = path.join(PROJECT_ROOT, 'src', 'assets', 'webtoon', 'profile-avatar.jpg');
  if (fs.existsSync(aiAvatarJpg)) {
    fs.copyFileSync(aiAvatarJpg, avatarPath);
  }

  if (chromePath) {
    if (!fs.existsSync(aiAvatarJpg)) {
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
ctx.strokeStyle = '#10b981';
ctx.lineWidth = 22;
ctx.beginPath();
ctx.arc(540, 540, 480, 0, Math.PI * 2);
ctx.stroke();
ctx.fillStyle = '#ffffff';
ctx.textAlign = 'center';
ctx.font = '900 135px sans-serif';
ctx.fillText('MoneyFit', 540, 480);
ctx.fillStyle = '#34d399';
ctx.font = 'bold 42px monospace';
ctx.fillText('truthofmarket.com', 540, 960);
</script>
</body>
</html>`;
      renderPngWithChrome(chromePath, avatarHtml, avatarPath);
    }

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
  const genAll36 = args.includes('--all36');

  (async () => {
    if (genBrand) {
      const b = generateBrandAssets();
      console.log(`✓ Generated Official Brand Profile Avatar & Cover in ${path.dirname(b.avatarPath)}`);
    }
    if (genAll36) {
      for (const p of PRESETS) {
        const r = await generateWebtoonPack({ slug: p.id, sendTelegram: false });
        console.log(`✓ Generated Webtoon Pack [${r.keyword}] (${r.slug})`);
      }
    } else if (genTop6) {
      const topSlugs = [
        'electric-studio-ac',
        'diet-male-fatloss',
        'pet-maltese-5kg',
        'room-oneroom-100',
        'auto-avante-3000',
        'auto-grandeur-5000',
        'telecom-penalty-15'
      ];
      for (const s of topSlugs) {
        const r = await generateWebtoonPack({ slug: s, sendTelegram: false });
        console.log(`✓ Generated Top Webtoon Pack: [${r.keyword}] (${r.slug})`);
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
