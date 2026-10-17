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
const { spawn, spawnSync } = require('child_process');
const { PRESETS } = require('../src/data/presets.js');
const { CALCULATORS } = require('../src/data/calculators.js');
const webtoonStories = require('../src/data/webtoon-stories.js');
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
const ART_DATA_URI_CACHE = {};
function getCategoryArtDataUri(calcKey) {
  const key = calcKey || 'electric';
  if (ART_DATA_URI_CACHE[key] !== undefined) return ART_DATA_URI_CACHE[key];
  const imgPath = path.join(PROJECT_ROOT, 'src', 'assets', 'webtoon', `${key}.jpg`);
  if (fs.existsSync(imgPath)) {
    try {
      const b64 = fs.readFileSync(imgPath).toString('base64');
      ART_DATA_URI_CACHE[key] = `data:image/jpeg;base64,${b64}`;
      return ART_DATA_URI_CACHE[key];
    } catch (e) {
      ART_DATA_URI_CACHE[key] = '';
      return '';
    }
  }
  ART_DATA_URI_CACHE[key] = '';
  return '';
}

/**
 * Build story data & Meta Anti-Spam High-CTR copy for any preset (36/36 100% unique)
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

  const t = webtoonStories.resolveDynamicReceiptValues(preset, calcRes);
  const presetIdx = Math.max(0, PRESETS.findIndex(p => p.id === preset.slug));

  const threadsIntroVariants = [
    `🐾 [4컷 공감툰] "${t.panel1Speech}"`,
    `💬 "솔직히 다들 이렇게 생각하고 그냥 쓰지 않나요..? 😭"`,
    `📌 ${preset.title} — 나만 몰랐던 현실 고지서 이야기`,
    `🦊 여우 친구한테 팩폭 맞고 오열한 ${t.charName}의 일상툰`,
    `💡 모르고 지나치면 매달 생돈 나가는 「${preset.title}」 이야기`,
    `😭 "진작 계산해볼걸.." 주변에서 제일 많이 후회하는 현실 4컷툰`
  ];
  const threadsOutroVariants = [
    `내 조건 넣으면 3초 만에 얼마 차이 나는지 다 알려주네요!\n👇 무료 계산기 주소는 바로 아래 첫 번째 댓글에 남겨둘게요.`,
    `나도 혹시 돈 날리고 있는 건 아닌지 궁금하다면?\n👉 첫 번째 댓글 링크에서 로그인 없이 3초 만에 확인해 보세요!`,
    `우리 집 기준으로 얼마 나오는지 바로 해보세요!\n🔎 아래 댓글의 무료 계산기에서 숫자만 넣으면 3초 만에 나와요.`,
    `친구한테도 알려주고 같이 아껴보세요!\n💬 무료 3초 계산기 링크는 첫 번째 댓글에 달아두었습니다.`
  ];

  // 1. Threads Main Post (Link-free in main body + natural conversational tone)
  const threadsMain = [
    threadsIntroVariants[presetIdx % threadsIntroVariants.length],
    '',
    t.hookLine,
    t.factLine,
    '',
    `💬 핵심만 딱 비교해보면:`,
    `• 그냥 모르고 쓸 때 (${t.badLabel}): ${t.badVal}`,
    `• 제대로 맞췄을 때 (${t.goodLabel}): ${t.goodVal}`,
    `• 아낄 수 있는 돈: ${t.diffVal}`,
    '',
    threadsOutroVariants[presetIdx % threadsOutroVariants.length]
  ].join('\n');

  // 2. Threads & Facebook 1st Self-Reply Comment (Contains the Direct Link)
  const threadsReply = [
    `🔗 「${preset.title}」 3초 무료 계산기 (회원가입·앱 설치 없음)`,
    targetUrl,
    '',
    `내 숫자만 넣으면 실시간으로 얼마 아낄 수 있는지 바로 나와요!`
  ].join('\n');

  // 3. Instagram Caption (Link-free + Conversational Instatoon Storytelling)
  const instagramCaption = [
    `🐾 "${t.panel1Speech}"`,
    `(${t.charName} × ${t.expertName}의 4컷 일상 공감툰 💬)`,
    '',
    t.hookLine,
    t.factLine,
    '',
    `💡 [한눈에 보는 현실 비교]`,
    `• 모르고 그냥 쓸 때 (${t.badLabel}): ${t.badVal}`,
    `• 똑똑하게 바꿀 때 (${t.goodLabel}): ${t.goodVal}`,
    `• 아끼는 생돈: ${t.diffVal}`,
    '',
    `📌 까먹기 전에 [저장] 해두시고, 주변 친구·가족한테도 슬쩍 공유해 주세요!`,
    `👉 우리 집 3초 무료 계산기는 @moneyfit2026 프로필 링크 또는 검색창에 「머니핏」 검색!`,
    '',
    t.hashtags || `#인스타툰 #생활비절약 #자취꿀팁 #머니핏`
  ].join('\n');

  // 4. Facebook Post (Warm conversational storytelling tone)
  const facebookPost = [
    `🐾 [4컷 공감툰] "${t.panel1Speech}"`,
    '',
    t.hookLine,
    t.factLine,
    '',
    `💡 핵심만 비교해보면 이만큼이나 차이 납니다:`,
    `• ${t.badLabel}: ${t.badVal}`,
    `• ${t.goodLabel}: ${t.goodVal}`,
    `• 차이: ${t.diffVal}`,
    '',
    `내 조건 넣으면 3초 만에 계산해주는 무료 계산기 주소는 첫 번째 댓글에 남겨두었습니다!`
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
    background: #faf7f2;
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

function drawSpeechBubble(ctx, x, y, w, h, r, tailX, tailDir = 1, s = 1) {
  const tailW = 20 * s;
  const tailH = 15 * s;
  const tx = Math.max(x + r + tailW, Math.min(x + w - r - tailW, tailX));

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 8 * s;
  ctx.shadowOffsetY = 3 * s;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(tx + tailW * 0.55, y + h);
  ctx.lineTo(tx + tailDir * (4 * s), y + h + tailH);
  ctx.lineTo(tx - tailW * 0.55, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3.2 * s;
  ctx.strokeStyle = '#1e293b';
  ctx.stroke();
  ctx.restore();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const chars = String(text || '').split('');
  let line = '';
  let currentY = y;
  let lineCount = 0;
  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      if (lineCount >= maxLines - 1) {
        let trimmed = line;
        while (trimmed.length > 0 && ctx.measureText(trimmed + '…').width > maxWidth) {
          trimmed = trimmed.slice(0, -1);
        }
        ctx.fillText(trimmed + '…', x, currentY);
        return;
      }
      ctx.fillText(line, x, currentY);
      line = chars[i];
      currentY += lineHeight;
      lineCount++;
    } else {
      line = testLine;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, currentY);
  }
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
    quokka: { fur: '#d97706', subFur: '#fbbf24', innerEar: '#fda4af', muzzle: '#fffbeb', nose: '#1e293b' },
    shiba: { fur: '#f59e0b', subFur: '#fef3c7', innerEar: '#fef3c7', muzzle: '#ffffff', nose: '#1e293b' },
    cat: { fur: '#fb923c', subFur: '#ffedd5', innerEar: '#fda4af', muzzle: '#fff7ed', nose: '#fb7185' },
    bear: { fur: '#fde68a', subFur: '#fef3c7', innerEar: '#d97706', muzzle: '#ffffff', nose: '#451a03' },
    fox: { fur: '#ea580c', subFur: '#ffffff', innerEar: '#fed7aa', muzzle: '#ffffff', nose: '#1e293b' },
    raccoon: { fur: '#94a3b8', subFur: '#e2e8f0', innerEar: '#cbd5e1', muzzle: '#f8fafc', nose: '#0f172a' }
  };
  const pal = palettes[species] || palettes.quokka;

  ctx.fillStyle = mood === 'shock' ? '#f43f5e' : mood === 'smart' ? '#2563eb' : '#10b981';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 4;
  roundRect(ctx, -46, 26, 92, 48, 22);
  ctx.fill();
  ctx.stroke();

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

  ctx.fillStyle = pal.fur;
  ctx.beginPath();
  ctx.ellipse(0, -5, 46, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fda4af';
  ctx.beginPath();
  ctx.ellipse(-28, 8, 8.5, 5.5, 0, 0, Math.PI * 2);
  ctx.ellipse(28, 8, 8.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

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
  } else if (mood === 'smart') {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.92)';
    ctx.lineWidth = 3.8;
    roundRect(ctx, -33, -21, 27, 19, 5);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, 6, -21, 27, 19, 5);
    ctx.fill();
    ctx.stroke();
  } else {
    drawSparkleStar(ctx, -48, -26, 9, '#fde047');
    drawSparkleStar(ctx, 48, -24, 10, '#fde047');
  }

  ctx.restore();
}

/**
 * Draw 100% uncropped quadrant of the 2x2 AI Animal Instatoon sheet
 */
function drawInstatoonQuadrant(ctx, img, panelIdx, dx, dy, dw, dh, radius = 10) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  const halfW = img.naturalWidth / 2;
  const halfH = img.naturalHeight / 2;
  const col = panelIdx % 2;
  const row = Math.floor(panelIdx / 2);
  const outerPad = Math.round(halfW * 0.038);
  const innerPad = Math.round(halfW * 0.028);
  const sx = col === 0 ? outerPad : halfW + innerPad;
  const sy = row === 0 ? outerPad : halfH + innerPad;
  const sw = halfW - outerPad - innerPad;
  const sh = halfH - outerPad - innerPad;

  ctx.save();
  roundRect(ctx, dx, dy, dw, dh, radius);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
  return true;
}

/**
 * Draw Compact Perforated Thermal Receipt Speech Memo in Top Empty Space of Panel 3
 */
function drawPerforatedReceipt(ctx, x, y, w, h, tailX, s = 1) {
  const zigCount = 20;
  const zigW = w / zigCount;
  const zigH = 6 * s;
  const tailW = 18 * s;
  const tailH = 14 * s;
  const tx = Math.max(x + 40 * s, Math.min(x + w - 40 * s, tailX));

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.1)';
  ctx.shadowBlur = 8 * s;
  ctx.shadowOffsetY = 3 * s;

  ctx.beginPath();
  ctx.moveTo(x, y + zigH);
  for (let i = 0; i < zigCount; i++) {
    ctx.lineTo(x + (i + 0.5) * zigW, y);
    ctx.lineTo(x + (i + 1) * zigW, y + zigH);
  }
  ctx.lineTo(x + w, y + h - zigH);
  ctx.lineTo(tx + tailW * 0.5, y + h - zigH);
  ctx.lineTo(tx + 4 * s, y + h + tailH);
  ctx.lineTo(tx - tailW * 0.5, y + h - zigH);
  ctx.lineTo(x, y + h - zigH);
  ctx.closePath();

  ctx.fillStyle = '#fffef7';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3 * s;
  ctx.strokeStyle = '#1e293b';
  ctx.stroke();
  ctx.restore();
}

function getConversationalScript(calcKey) {
  const scripts = {
    electric: {
      episodeTitle: '자취생 쿼카의 여름 일기 — "에어컨 아껴 틀었는데요..?"',
      p1Lines: ['더울 때만 틀고 **2시간마다 껐다 켰다** 했지롱~', '이번 달 전기세 **무조건 만 원대** 각이다 ㅎㅎ'],
      p2FoxLines: ['야!! 에어컨을 그렇게 **껐다 켰다** 하면', '실외기 폭주해서 **누진세 3배 폭탄** 맞아!!'],
      p2React: '에..?! 진짜로?!',
      p3CryLines: [
        '으아앙!! 아껴 틀었다가 **6만 원 폭탄** 맞았어..',
        '그냥 켜두면 **3만 원대**였잖아!!',
        '모르고 매달 생돈 날리고 있었네 ㅠㅠ'
      ],
      p4FoxLines: ['울지 마~ **머니핏**에 우리 방 에어컨 넣으면', '**3초 만에** 한 달 전기세 다 알려줘!'],
      p4React: '헐 대박!! 당장 해볼래!!'
    },
    diet: {
      episodeTitle: '헬린이 시바의 식단 일기 — "닭가슴살 100팩 샀는데요..?"',
      p1Lines: ['오늘부터 다이어트!! **닭가슴살 100팩**이랑', '고구마 한 박스 샀으니 **무조건 빠지겠지?!**'],
      p2FoxLines: ['야!! 내 대사량도 안 재보고 막 사면', '**식비만 날리고** 냉동실에 다 쌓여!!'],
      p2React: '헉.. 내 돈..!!',
      p3CryLines: [
        '으아앙!! 정량대로 사면 **21만 원**인데',
        '감으로 막 샀다가 **49만 원**이나 썼잖아..',
        '살도 안 빠지고 식비만 날렸어 ㅠㅠ'
      ],
      p4FoxLines: ['지금이라도 **머니핏**에 몸무게만 넣어봐!', '하루 닭가슴살 **몇 팩 먹을지** 3초 만에 나와!'],
      p4React: '오오!! 당장 해봐야지!!'
    },
    pet: {
      episodeTitle: '초보집사 냥이의 육아 일기 — "종이컵으로 사료 줬는데요..?"',
      p1Lines: ['사료 봉투에 적힌 대로 **종이컵 가득** 줬는데..', '우리 애기 왜 자꾸 **포동포동 굴러다니지?!**'],
      p2FoxLines: ['중성화한 애한테 종이컵 눈대중으로 주면', '비만 와서 **슬개골 병원비 수백만 원** 깨져!!'],
      p2React: '헉.. 어떡해?!',
      p3CryLines: [
        '으아앙!! 몸무게 재보니 **하루 정량**만 줘야 했어!',
        '모르고 더 줬다가 **병원비 폭탄** 맞을 뻔..',
        '미안해 내 새끼야 ㅠㅠ'
      ],
      p4FoxLines: ['**머니핏**에 우리 애기 몸무게만 적어봐!', '하루에 **사료 몇 g** 줄지 3초 만에 나와!'],
      p4React: '당장 그램(g) 재서 줄게!!'
    },
    room: {
      episodeTitle: '자취러 곰돌이의 이사 일기 — "인스타 감성 방 꾸미기..?"',
      p1Lines: ['첫 자취방이니까 가전·가구는 **무조건 감성템!!**', '어라.. 근데 왜 벌써 **통장 잔고가 0원**이지?!'],
      p2FoxLines: ['예산 안 짜고 큰 가구부터 지르면 어떡해!!', '그럼 **냉장고랑 세탁기**는 안 살 거야?!'],
      p2React: '망했다..!!',
      p3CryLines: [
        '으아앙!! 단품으로 사면 **122만 원**인데',
        '비율 맞춰 사면 **100만 원**에 끝나는 거였어..',
        '이사 첫날부터 파산할 뻔했네 ㅠㅠ'
      ],
      p4FoxLines: ['**머니핏**에 내 가용 예산만 적어봐!', '예산 안 넘게 **풀세팅 견적표** 3초 만에 짜줘!'],
      p4React: '우와!! 이대로만 사야지!!'
    },
    auto: {
      episodeTitle: '김대리 댕댕이의 신차 일기 — "월 납입금만 보면 되잖아..?"',
      p1Lines: ['영맨님이 **월 40만 원대**면 신차 뽑는다는데?!', '생각보다 싸네~ 그냥 **할부로 계약**할까봐!'],
      p2FoxLines: ['월 납입금만 보면 어떡해!! **취등록세 7%**랑', '**보험료·세금**까지 다 합쳐서 봐야지!!'],
      p2React: '세금도 있었어?!',
      p3CryLines: [
        '으아앙!! 4년 총비용 합쳐보니 할부로 사면',
        '장기렌트보다 **1,000만 원**이나 더 내는 거였어!',
        '모르고 사인했으면 카푸어 될 뻔 ㅠㅠ'
      ],
      p4FoxLines: ['사인하기 전에 **머니핏**에 차 값만 넣어봐!', '**할부·렌트·리스** 중 뭐가 싼지 3초 만에 나와!'],
      p4React: '덕분에 큰돈 아꼈다!!'
    },
    telecom: {
      episodeTitle: '라쿤 대리의 호구탈출 일기 — "인터넷 그냥 써도 되잖아..?"',
      p1Lines: ['우리 집 인터넷 **3년 약정 끝난 지** 한참인데', '귀찮아서 그냥 쓰는 중~ **바꾼다고 뭐 주겠어?**'],
      p2FoxLines: ['헐 바보야?! 약정 끝난 인터넷 갈아타면', '**현금 최대 47만 원**에 월 요금도 깎아주는데!!'],
      p2React: '47만 원이나?!',
      p3CryLines: [
        '으아앙!! 귀찮다고 그냥 버티는 바람에',
        '당장 받을 **현금 47만 원**에 할인까지 놓쳤네..',
        '나만 통신사 호구였어 ㅠㅠ'
      ],
      p4FoxLines: ['지금이라도 **머니핏**에 현재 요금만 넣어봐!', '갈아타면 **내 통장에 얼마 남는지** 3초에 나와!'],
      p4React: '오늘 바로 갈아탄다!!'
    }
  };
  return scripts[calcKey] || scripts.electric;
}

function drawCenteredBubbleText(
  ctx,
  lines,
  cx,
  startY,
  lineHeight,
  fontSize,
  color = '#1e293b',
  maxWidth = 0,
  accentColor = '#dc2626',
  highlightBg = '#fef08a'
) {
  ctx.save();
  ctx.textAlign = 'left';

  // Compute uniform font size across all lines in the bubble so line 1 and line 2 match!
  let fSize = fontSize;
  ctx.font = '900 ' + fSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  if (maxWidth > 0) {
    lines.forEach(rawLine => {
      const plainLine = String(rawLine || '').split('**').join('');
      while (fSize > 13 && ctx.measureText(plainLine).width > maxWidth) {
        fSize -= 0.5;
        ctx.font = '900 ' + fSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
      }
    });
  }

  lines.forEach((rawLine, idx) => {
    const segments = String(rawLine || '').split('**');
    const plainLine = segments.join('');
    const totalW = ctx.measureText(plainLine).width;
    let curX = cx - totalW / 2;
    const baseY = startY + idx * lineHeight;

    segments.forEach((text, segIdx) => {
      if (!text) return;
      const isHighlight = segIdx % 2 === 1;
      const segW = ctx.measureText(text).width;
      if (isHighlight && highlightBg) {
        ctx.save();
        ctx.fillStyle = highlightBg;
        roundRect(ctx, curX - 3, baseY - fSize * 0.82, segW + 6, fSize * 0.98, 6);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = isHighlight ? accentColor : color;
      ctx.fillText(text, curX, baseY);
      curX += segW;
    });
  });
  ctx.restore();
}

function drawPanel(ctx, num, x, y, w, h, isFullSlide) {
  const s = isFullSlide ? w / 502 : 1;
  const panelRadius = Math.round(12 * s);
  const bgFallbacks = ['#fef9ee', '#e0f2fe', '#dcfce7', '#fef08a'];
  const conv = getConversationalScript(preset.calcKey, story);

  // 1. Panel Base Background + Full Uncropped Animal Illustration
  ctx.fillStyle = bgFallbacks[num - 1] || '#faf7f2';
  roundRect(ctx, x, y, w, h, panelRadius);
  ctx.fill();

  const drewArt = drawInstatoonQuadrant(ctx, artImg, num - 1, x, y, w, h, panelRadius);
  if (!drewArt) {
    const mood = num === 2 ? 'smart' : num === 4 ? 'happy' : 'shock';
    const sp = num === 2 ? 'fox' : story.species || 'quokka';
    drawAnimalCharacter(ctx, x + w * 0.5, y + h * 0.66, sp, mood, '#fecdd3', s * 1.15);
  }

  // 2. Large, Bold, Realistic Korean Instatoon Speech Bubbles with Yellow Marker Highlights
  if (num === 1) {
    const bx = x + 10 * s;
    const by = y + 10 * s;
    const bw = w - 20 * s;
    const bh = 108 * s;
    drawSpeechBubble(ctx, bx, by, bw, bh, 36 * s, x + w * 0.42, -1, s);
    drawCenteredBubbleText(
      ctx,
      conv.p1Lines,
      bx + bw / 2,
      by + 45 * s,
      35 * s,
      23.5 * s,
      '#0f172a',
      bw - 28 * s,
      '#d97706',
      '#fef08a'
    );
  } else if (num === 2) {
    // Staggered Top-Left Wide Bubble (Fox friend talking — HUGE 22.5px bold text!)
    const bx1 = x + 10 * s;
    const by1 = y + 10 * s;
    const bw1 = 434 * s;
    const bh1 = 94 * s;
    drawSpeechBubble(ctx, bx1, by1, bw1, bh1, 32 * s, x + w * 0.28, -1, s);
    drawCenteredBubbleText(
      ctx,
      conv.p2FoxLines,
      bx1 + bw1 / 2,
      by1 + 41 * s,
      32 * s,
      22.5 * s,
      '#0f172a',
      bw1 - 26 * s,
      '#dc2626',
      '#fee2e2'
    );

    // Staggered Bottom-Right Reaction Bubble (Protagonist shocked reaction — HUGE 21.5px text!)
    const bx2 = x + 288 * s;
    const by2 = y + 98 * s;
    const bw2 = 204 * s;
    const bh2 = 54 * s;
    drawSpeechBubble(ctx, bx2, by2, bw2, bh2, 27 * s, x + w * 0.80, 1, s);
    drawCenteredBubbleText(
      ctx,
      [conv.p2React],
      bx2 + bw2 / 2,
      by2 + 35 * s,
      24 * s,
      21.5 * s,
      '#dc2626',
      bw2 - 22 * s,
      '#dc2626',
      null
    );
  } else if (num === 3) {
    // Large, expressive 3-line crying speech bubble (HUGE 22.5px bold text!)
    const bx = x + 10 * s;
    const by = y + 10 * s;
    const bw = w - 20 * s;
    const bh = 132 * s;
    drawSpeechBubble(ctx, bx, by, bw, bh, 36 * s, x + w * 0.65, 1, s);
    drawCenteredBubbleText(
      ctx,
      conv.p3CryLines,
      bx + bw / 2,
      by + 41 * s,
      33 * s,
      22.5 * s,
      '#0f172a',
      bw - 28 * s,
      '#e11d48',
      '#ffe4e6'
    );
  } else {
    // Staggered Top-Left Wide Bubble (Fox friend giving warm tip — HUGE 22.5px text!)
    const bx1 = x + 10 * s;
    const by1 = y + 10 * s;
    const bw1 = 434 * s;
    const bh1 = 94 * s;
    drawSpeechBubble(ctx, bx1, by1, bw1, bh1, 32 * s, x + w * 0.30, -1, s);
    drawCenteredBubbleText(
      ctx,
      conv.p4FoxLines,
      bx1 + bw1 / 2,
      by1 + 41 * s,
      32 * s,
      22.5 * s,
      '#0f172a',
      bw1 - 26 * s,
      '#047857',
      '#fef08a'
    );

    // Staggered Bottom-Right Cheering Reply Bubble (HUGE 21px text!)
    const bx2 = x + 260 * s;
    const by2 = y + 98 * s;
    const bw2 = 232 * s;
    const bh2 = 54 * s;
    drawSpeechBubble(ctx, bx2, by2, bw2, bh2, 27 * s, x + w * 0.78, 1, s);
    drawCenteredBubbleText(
      ctx,
      [conv.p4React],
      bx2 + bw2 / 2,
      by2 + 35 * s,
      24 * s,
      21 * s,
      '#047857',
      bw2 - 22 * s,
      '#047857',
      null
    );
  }

  // 3. Crisp Authentic Comic Panel Outline (#1e293b, 4.5px)
  ctx.save();
  roundRect(ctx, x, y, w, h, panelRadius);
  ctx.lineWidth = 4.5 * s;
  ctx.strokeStyle = '#1e293b';
  ctx.stroke();
  ctx.restore();
}

function renderAll() {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const conv = getConversationalScript(preset.calcKey, story);

  if (mode === 'grid') {
    // Warm Cream Ivory Manuscript Paper Background
    ctx.fillStyle = '#faf7f2';
    ctx.fillRect(0, 0, 1080, 1080);

    // Natural Instatoon Episode Title (Bold 27px)
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 27px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText('🐾 ' + conv.episodeTitle, 28, 44);

    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText('@moneyfit2026', 1052, 43);
    ctx.restore();

    const pW = 502;
    const pH = 474;
    drawPanel(ctx, 1, 28, 62, pW, pH, false);
    drawPanel(ctx, 2, 550, 62, pW, pH, false);
    drawPanel(ctx, 3, 28, 552, pW, pH, false);
    drawPanel(ctx, 4, 550, 552, pW, pH, false);

    // Subtle, natural artist signature line at the bottom of the cream paper
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.font = '900 19px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText('🎨 머니핏 공감툰  ·  우리 집 3초 무료 계산기는 프로필 링크 또는 검색창에 「머니핏」 검색!', 540, 1059);
    ctx.restore();
  } else {
    ctx.fillStyle = '#faf7f2';
    ctx.fillRect(0, 0, 1080, 1080);
    drawPanel(ctx, slideNum, 36, 28, 1008, 992, true);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.font = '900 21px sans-serif';
    ctx.fillText('🎨 머니핏 공감툰  ·  무료 계산기는 프로필 링크 또는 검색창에 「머니핏」 검색!', 540, 1056);
    ctx.restore();
  }
}
renderAll();
if (artImg) artImg.onload = renderAll;
window.addEventListener('load', renderAll);
</script>
</body>
</html>`;
}

const os = require('os');

/**
 * Render HTML to PNG via Headless Chrome (Synchronous)
 */
function renderPngWithChrome(chromePath, htmlContent, outputPngPath) {
  const tempHtmlPath = outputPngPath.replace(/\.png$/i, '.temp.html');
  const tempProfileDir = path.join(os.tmpdir(), 'mf-chr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
  const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');

  const res = spawnSync(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${tempProfileDir}`,
      '--window-size=1080,1080',
      `--screenshot=${outputPngPath}`,
      fileUrl
    ],
    { encoding: 'utf8', timeout: 25000 }
  );

  try {
    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
    if (fs.existsSync(tempProfileDir)) fs.rmSync(tempProfileDir, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }

  return res.status === 0 && fs.existsSync(outputPngPath);
}

/**
 * Render HTML to PNG via Headless Chrome (Async Parallel with Isolated User-Data-Dir)
 */
function renderPngWithChromeAsync(chromePath, htmlContent, outputPngPath) {
  return new Promise(resolve => {
    const tempHtmlPath = outputPngPath.replace(/\.png$/i, '.temp.html');
    const tempProfileDir = path.join(os.tmpdir(), 'mf-chr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9));
    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
    const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');

    const child = spawn(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${tempProfileDir}`,
        '--window-size=1080,1080',
        `--screenshot=${outputPngPath}`,
        fileUrl
      ],
      { stdio: 'ignore' }
    );

    const cleanup = () => {
      try {
        if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
      } catch (e) {}
      try {
        if (fs.existsSync(tempProfileDir)) fs.rmSync(tempProfileDir, { recursive: true, force: true });
      } catch (e) {}
    };

    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch (e) {}
      cleanup();
      resolve(fs.existsSync(outputPngPath));
    }, 25000);

    child.on('close', code => {
      clearTimeout(timer);
      cleanup();
      resolve(code === 0 && fs.existsSync(outputPngPath));
    });
    child.on('error', () => {
      clearTimeout(timer);
      cleanup();
      resolve(false);
    });
  });
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
  const slidePaths = [1, 2, 3, 4].map(i => path.join(outDir, `slide-${i}.png`));

  if (chromePath) {
    if (!(options.skipExisting && fs.existsSync(gridPngPath))) {
      try {
        if (fs.existsSync(gridPngPath)) fs.unlinkSync(gridPngPath);
      } catch (e) {}
      const okGrid = await renderPngWithChromeAsync(chromePath, buildRenderHtml(bundle, 'grid', 1), gridPngPath);
      if (!okGrid || !fs.existsSync(gridPngPath)) {
        renderPngWithChrome(chromePath, buildRenderHtml(bundle, 'grid', 1), gridPngPath);
      }
    }
    for (let i = 1; i <= 4; i += 2) {
      const batchIdx = [i, i + 1].filter(n => n <= 4);
      await Promise.all(
        batchIdx.map(async n => {
          const sPath = slidePaths[n - 1];
          if (!(options.skipExisting && fs.existsSync(sPath))) {
            try {
              if (fs.existsSync(sPath)) fs.unlinkSync(sPath);
            } catch (e) {}
            const okSlide = await renderPngWithChromeAsync(chromePath, buildRenderHtml(bundle, 'slide', n), sPath);
            if (!okSlide || !fs.existsSync(sPath)) {
              renderPngWithChrome(chromePath, buildRenderHtml(bundle, 'slide', n), sPath);
            }
          }
        })
      );
    }
    if (fs.existsSync(gridPngPath)) {
      fs.copyFileSync(gridPngPath, publicGridPngPath);
    }
  } else if (fs.existsSync(gridPngPath) && !fs.existsSync(publicGridPngPath)) {
    fs.copyFileSync(gridPngPath, publicGridPngPath);
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
        story: bundle.story,
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
  const skipExisting = args.includes('--skip-existing');

  (async () => {
    if (genBrand) {
      const b = generateBrandAssets();
      console.log(`✓ Generated Official Brand Profile Avatar & Cover in ${path.dirname(b.avatarPath)}`);
    }
    if (genAll36) {
      for (let i = 0; i < PRESETS.length; i += 2) {
        const batch = PRESETS.slice(i, i + 2);
        const results = await Promise.all(
          batch.map(p => generateWebtoonPack({ slug: p.id, sendTelegram: false, skipExisting }))
        );
        results.forEach(r => console.log(`✓ Generated Webtoon Pack [${r.keyword}] (${r.slug})`));
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
        const r = await generateWebtoonPack({ slug: s, sendTelegram: false, skipExisting });
        console.log(`✓ Generated Top Webtoon Pack: [${r.keyword}] (${r.slug})`);
      }
    } else {
      const res = await generateWebtoonPack({ slug, sendTelegram, skipExisting });
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
