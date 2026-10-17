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
  const sc = t.shortCartoon || {
    epTitle: preset.title,
    p1: ['모르고 그냥 쓰면', '**생돈 날려요!**'],
    p2: ['내 조건 넣으면', '**정답이 나와요!**'],
    p3: ['그냥 쓰면 손해!', '**절약액 확인!**'],
    p4: ['3초 무료 계산기', '**머니핏 검색!**']
  };
  const plainP1 = (sc.p1 || []).join(' ').replace(/\*\*/g, '');
  const plainP3 = (sc.p3 || []).join(' ').replace(/\*\*/g, '');

  // 1. Threads Main Post (Ultra-short 5-line Instatoon punch)
  const threadsMain = [
    `🐾 [${sc.epTitle}]`,
    `💬 "${plainP1}" → "${plainP3}"`,
    '',
    `❌ 모르고 쓸 때 (${t.badLabel}): ${t.badVal}`,
    `✅ 맞췄을 때 (${t.goodLabel}): ${t.goodVal}`,
    `🔥 아끼는 생돈: ${t.diffVal}`,
    '',
    `👇 내 조건 3초 무료 계산기는 첫 댓글에 남겨둘게요!`
  ].join('\n');

  // 2. Threads & Facebook 1st Self-Reply Comment (Contains the Direct Link)
  const threadsReply = [
    `🔗 「${preset.title}」 3초 무료 계산기`,
    targetUrl
  ].join('\n');

  // 3. Instagram Caption (Short, scannable Instatoon caption)
  const instagramCaption = [
    `🐾 ${sc.epTitle} (@moneyfit2026)`,
    `💬 "${plainP1}" → "${plainP3}"`,
    '',
    `📊 [3초 핵심 요약]`,
    `• ${t.badLabel}: ${t.badVal}`,
    `• ${t.goodLabel}: ${t.goodVal}`,
    `• 절약 효과: ${t.diffVal}`,
    '',
    `📌 까먹기 전에 [저장] 해두시고 친구에게도 공유해 보세요!`,
    `👉 3초 무료 계산기는 프로필 링크 또는 검색창에 「머니핏」 검색!`,
    '',
    t.hashtags || `#인스타툰 #생활비절약 #자취꿀팁 #머니핏`
  ].join('\n');

  // 4. Facebook Post (Concise 4-cut summary)
  const facebookPost = [
    `🐾 [4컷 공감툰] ${sc.epTitle}`,
    `• ${t.badLabel}: ${t.badVal} → ${t.goodLabel}: ${t.goodVal} (${t.diffVal})`,
    `내 조건 넣으면 3초 만에 계산해주는 무료 계산기 주소는 첫 댓글에 있습니다!`
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
  const fontsDirUrl = 'file:///' + path.join(PROJECT_ROOT, 'src', 'assets', 'fonts').replace(/\\/g, '/');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: 'Gaegu';
    font-style: normal;
    font-weight: 400;
    src: url('${fontsDirUrl}/Gaegu-400.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Gaegu';
    font-style: normal;
    font-weight: 700;
    src: url('${fontsDirUrl}/Gaegu-700.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Jua';
    font-style: normal;
    font-weight: 400;
    src: url('${fontsDirUrl}/Jua-400.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Nanum Pen Script';
    font-style: normal;
    font-weight: 400;
    src: url('${fontsDirUrl}/NanumPenScript-400.ttf') format('truetype');
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    background: #f5f3ef;
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
<div style="position:absolute;opacity:0;pointer-events:none;font-size:12px;">
  <span style="font-family:'Gaegu';font-weight:400">가나다라마바사</span>
  <span style="font-family:'Gaegu';font-weight:700">가나다라마바사</span>
  <span style="font-family:'Jua';font-weight:400">가나다라마바사</span>
  <span style="font-family:'Nanum Pen Script';font-weight:400">가나다라마바사</span>
</div>
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

/**
 * Draw softly blurred realistic indoor room/office background (exact Korean Instatoon photo-blur aesthetic)
 */
function drawBlurredRoomBackground(ctx, x, y, w, h, cutNum, r) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();

  // Base warm indoor wall gradient
  const wallGrad = ctx.createLinearGradient(x, y, x, y + h);
  if (cutNum === 3) {
    wallGrad.addColorStop(0, '#9ca3af');
    wallGrad.addColorStop(0.55, '#cbd5e1');
    wallGrad.addColorStop(1, '#64748b');
  } else {
    wallGrad.addColorStop(0, '#a8a29e');
    wallGrad.addColorStop(0.5, '#d6d3d1');
    wallGrad.addColorStop(1, '#78716c');
  }
  ctx.fillStyle = wallGrad;
  ctx.fillRect(x, y, w, h);

  // Softly blurred architectural indoor elements (window light, indoor plant, desk, bokeh)
  ctx.save();
  ctx.filter = 'blur(' + Math.max(12, Math.round(w * 0.035)) + 'px)';

  // Daylight window panes on upper-left & center-right
  ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
  ctx.fillRect(x + w * 0.04, y + h * 0.14, w * 0.28, h * 0.42);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
  ctx.fillRect(x + w * 0.58, y + h * 0.08, w * 0.34, h * 0.36);

  // Warm indoor ceiling glow
  ctx.fillStyle = 'rgba(254, 249, 195, 0.45)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.12, w * 0.35, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Muted dark furniture/monitor silhouette on left-mid
  ctx.fillStyle = 'rgba(30, 27, 24, 0.48)';
  ctx.fillRect(x - w * 0.02, y + h * 0.52, w * 0.32, h * 0.18);

  // Lush indoor green plant bokeh on right-mid (just like the reference image!)
  ctx.fillStyle = cutNum === 3 ? 'rgba(30, 64, 175, 0.38)' : 'rgba(54, 83, 20, 0.62)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.72, y + h * 0.62, w * 0.22, h * 0.09, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Soft white planter / desk surface below plant
  ctx.fillStyle = 'rgba(245, 245, 244, 0.55)';
  ctx.fillRect(x + w * 0.56, y + h * 0.68, w * 0.38, h * 0.22);

  ctx.restore();

  // Gentle vignette for crisp foreground contrast
  const vig = ctx.createRadialGradient(x + w * 0.5, y + h * 0.55, w * 0.25, x + w * 0.5, y + h * 0.55, w * 0.75);
  vig.addColorStop(0, 'rgba(255,255,255,0.08)');
  vig.addColorStop(1, 'rgba(15,23,42,0.16)');
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, w, h);

  ctx.restore();
}

/**
 * 1. Top Rectangular Narration Box (exact match to "[ 회사에 의욕이 넘치는 인턴이 새로 들어왔다 ]")
 */
function drawTopNarrationBox(ctx, text, x, y, w, s = 1) {
  const boxH = 44 * s;
  const boxY = y + 14 * s;
  ctx.save();

  let fontSize = 19.5 * s;
  ctx.font = '800 ' + fontSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  while (fontSize > 14 * s && ctx.measureText(text).width > w - 54 * s) {
    fontSize -= 0.5 * s;
    ctx.font = '800 ' + fontSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  }
  const textW = ctx.measureText(text).width;
  const boxW = Math.min(w - 24 * s, Math.max(w * 0.76, textW + 42 * s));
  const boxX = x + (w - boxW) / 2;

  // Drop shadow + crisp white rectangle + black border
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 7 * s;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3 * s;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.6 * s;
  ctx.strokeStyle = '#111111';
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = '#111111';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, boxX + boxW / 2, boxY + boxH / 2 + 1 * s);
  ctx.restore();
}

/**
 * 2. Large Smooth Oval Speech Bubble + Dynamic Word-Size & Stroke-Weight Contrast ("글자 강약")
 */
function drawOvalSpeechBubbleWithContrast(ctx, lines, cx, cy, rx, ry, s = 1, accentColor = '#111111', highlightColor = '#fef08a') {
  ctx.save();

  // Smooth white oval bubble with subtle shadow and crisp black pen outline
  ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
  ctx.shadowBlur = 8 * s;
  ctx.shadowOffsetY = 3 * s;

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.5 * s;
  ctx.strokeStyle = '#111111';
  ctx.stroke();

  // Compute dynamic font size so normal text and 1.32x emphasized **text** fit comfortably inside the oval
  const maxAllowedW = rx * 1.74;
  let baseSize = (lines.length === 1 ? 42 : 33.5) * s;
  const emphRatio = 1.34;

  const measureRichLine = (rawLine, bSize) => {
    const segs = String(rawLine || '').split('**');
    let total = 0;
    segs.forEach((seg, idx) => {
      if (!seg) return;
      const isEmph = idx % 2 === 1;
      const sz = isEmph ? bSize * emphRatio : bSize;
      ctx.font = '700 ' + sz.toFixed(1) + 'px "Gaegu", "Jua", "Malgun Gothic", sans-serif';
      total += ctx.measureText(seg).width;
    });
    return total;
  };

  lines.forEach(rawLine => {
    while (baseSize > 22 * s && measureRichLine(rawLine, baseSize) > maxAllowedW) {
      baseSize -= 0.5 * s;
    }
  });

  const lineSpacing = baseSize * 1.25;
  const totalBlockH = (lines.length - 1) * lineSpacing;
  const firstLineY = cy - totalBlockH / 2 + baseSize * 0.34;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  lines.forEach((rawLine, lineIdx) => {
    const segs = String(rawLine || '').split('**');
    const lineW = measureRichLine(rawLine, baseSize);
    let curX = cx - lineW / 2;
    const baseY = firstLineY + lineIdx * lineSpacing;

    segs.forEach((seg, segIdx) => {
      if (!seg) return;
      const isEmph = segIdx % 2 === 1;
      const sz = isEmph ? baseSize * emphRatio : baseSize;
      ctx.font = '700 ' + sz.toFixed(1) + 'px "Gaegu", "Jua", "Malgun Gothic", sans-serif';
      const segW = ctx.measureText(seg).width;

      if (isEmph) {
        // Soft hand-drawn highlighter marker under the emphasized phrase
        ctx.save();
        ctx.fillStyle = highlightColor;
        roundRect(ctx, curX - 3 * s, baseY - sz * 0.52, segW + 6 * s, sz * 0.58, 6 * s);
        ctx.fill();
        ctx.restore();

        // Extra-bold hand-drawn stroke + fill for strong visual emphasis (글자 강약!)
        const bounceY = baseY - 2 * s;
        ctx.lineWidth = 2.4 * s;
        ctx.strokeStyle = accentColor;
        ctx.lineJoin = 'round';
        ctx.strokeText(seg, curX, bounceY);
        ctx.fillStyle = accentColor;
        ctx.fillText(seg, curX, bounceY);
      } else {
        // Normal speech text with organic pen thickness
        ctx.lineWidth = 1.0 * s;
        ctx.strokeStyle = '#111111';
        ctx.lineJoin = 'round';
        ctx.strokeText(seg, curX, baseY);
        ctx.fillStyle = '#111111';
        ctx.fillText(seg, curX, baseY);
      }

      curX += segW;
    });
  });

  ctx.restore();
}

/**
 * 3. Hand-Drawn Curved Arrows (↗, ↙) + Handwritten Pen Annotations ("의욕MAX", "대학교 졸업반" style)
 */
function drawHandwrittenSideNotes(ctx, leftLines, rightLines, x, y, w, h, s = 1) {
  ctx.save();

  // Helper to draw handwritten text with crisp white halo outline + black ink
  const drawHaloHandwriting = (linesArr, tx, ty, tiltRad, align = 'center') => {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(tiltRad);
    ctx.font = '400 ' + (31 * s).toFixed(1) + 'px "Nanum Pen Script", "Gaegu", cursive';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    linesArr.forEach((ln, idx) => {
      const ly = idx * 28 * s;
      ctx.lineWidth = 6.8 * s;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(ln, 0, ly);
      ctx.fillStyle = '#111111';
      ctx.fillText(ln, 0, ly);
    });
    ctx.restore();
  };

  // Left-bottom handwritten note ("의욕MAX" position) + Curved Arrow ↗
  if (leftLines && leftLines.length) {
    drawHaloHandwriting(leftLines, x + 76 * s, y + 402 * s, -0.06, 'center');

    // Hand-drawn curved black arrow ↗ pointing from left note up to character
    ctx.save();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3.5 * s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 56 * s, y + 372 * s);
    ctx.quadraticCurveTo(x + 48 * s, y + 308 * s, x + 132 * s, y + 308 * s);
    ctx.stroke();

    // Open arrowhead '>'
    ctx.beginPath();
    ctx.moveTo(x + 112 * s, y + 297 * s);
    ctx.lineTo(x + 134 * s, y + 308 * s);
    ctx.lineTo(x + 114 * s, y + 321 * s);
    ctx.stroke();
    ctx.restore();
  }

  // Right-middle handwritten note ("대학교 졸업반" position) + Curved Arrow ↙
  if (rightLines && rightLines.length) {
    drawHaloHandwriting(rightLines, x + 424 * s, y + 234 * s, 0.05, 'center');

    // Hand-drawn curved black arrow ↙ pointing from right note down-left to character
    const arrowStartY = y + (234 + rightLines.length * 26 + 6) * s;
    ctx.save();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3.5 * s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 444 * s, arrowStartY);
    ctx.quadraticCurveTo(x + 458 * s, y + 344 * s, x + 372 * s, y + 350 * s);
    ctx.stroke();

    // Open arrowhead '<'
    ctx.beginPath();
    ctx.moveTo(x + 392 * s, y + 337 * s);
    ctx.lineTo(x + 370 * s, y + 350 * s);
    ctx.lineTo(x + 391 * s, y + 361 * s);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 4. Authentic Human-Drawn 2D Mochi Character (사람이 아이패드로 직접 그린 찹쌀떡 인스타툰 캐릭터)
 *    Exact match to the user's reference image: white chubby mochi body, pastel hair bun,
 *    big round ear overlapping hair cleanly, soft curved bangs, 3 upper eyelashes, and expressive poses!
 */
function drawHumanInstatoonCharacter(ctx, cx, cy, calcKey, cutNum, s = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);

  const ink = '#111111';
  ctx.strokeStyle = ink;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const hairMap = {
    electric: '#f9a89a', // Coral-pink bun (identical to reference image!)
    diet: '#fbbf24',     // Warm apricot-yellow
    pet: '#fdba74',      // Soft peach-orange
    room: '#fda4af',     // Rose-pink
    auto: '#93c5fd',     // Soft sky-blue
    telecom: '#6ee7b7'   // Mint-emerald
  };
  const hairColor = cutNum === 2 ? '#a5b4fc' : (hairMap[calcKey] || '#f9a89a');

  // Subtle floor shadow under feet
  ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
  ctx.beginPath();
  ctx.ellipse(0, 128, 36, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- A. Back Hair Bun & Full Hair Silhouette (Behind Face & Ear) ---
  ctx.lineWidth = 3.2;
  ctx.fillStyle = hairColor;

  if (cutNum !== 2) {
    // Cute top-right round hair bun (exact match to reference image!)
    ctx.beginPath();
    ctx.arc(36, -54, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Outer hair silhouette wrapping smoothly around head and tucking behind right ear/neck
  ctx.beginPath();
  ctx.ellipse(0, -10, 62, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // --- B. White Chubby Mochi Body + Stubby Legs (하얀 찹쌀떡 몸통) ---
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 3.2;

  if (cutNum === 1) {
    // Left arm & round mitten hand resting adorably by side
    ctx.beginPath();
    ctx.moveTo(-23, 38);
    ctx.quadraticCurveTo(-35, 66, -33, 88);
    ctx.quadraticCurveTo(-45, 92, -41, 102);
    ctx.quadraticCurveTo(-31, 107, -24, 96);
    ctx.fill();
    ctx.stroke();

    // Right arm & round mitten hand
    ctx.beginPath();
    ctx.moveTo(23, 38);
    ctx.quadraticCurveTo(35, 66, 33, 88);
    ctx.quadraticCurveTo(45, 92, 41, 102);
    ctx.quadraticCurveTo(31, 107, 24, 96);
    ctx.fill();
    ctx.stroke();
  } else if (cutNum === 2) {
    // Left arm down, Right arm raised pointing a fact-check finger!
    ctx.beginPath();
    ctx.moveTo(-23, 38);
    ctx.quadraticCurveTo(-34, 68, -31, 94);
    ctx.quadraticCurveTo(-39, 100, -23, 100);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(21, 42);
    ctx.quadraticCurveTo(46, 30, 54, 8);
    ctx.quadraticCurveTo(62, 4, 60, 16);
    ctx.quadraticCurveTo(50, 42, 23, 58);
    ctx.fill();
    ctx.stroke();
  } else if (cutNum === 4) {
    // Both arms cheering high in the air ("만세!" pose)
    ctx.beginPath();
    ctx.moveTo(-21, 42);
    ctx.quadraticCurveTo(-46, 18, -44, -6);
    ctx.quadraticCurveTo(-34, -12, -28, 6);
    ctx.quadraticCurveTo(-26, 24, -17, 46);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(21, 42);
    ctx.quadraticCurveTo(46, 18, 44, -6);
    ctx.quadraticCurveTo(34, -12, 28, 6);
    ctx.quadraticCurveTo(26, 24, 17, 46);
    ctx.fill();
    ctx.stroke();
  }

  // Central Mochi Torso + Legs
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-21, 34);
  ctx.quadraticCurveTo(-25, 76, -23, 114);
  ctx.lineTo(-18, 128);
  ctx.quadraticCurveTo(-14, 130, -11, 112);
  ctx.quadraticCurveTo(0, 110, 11, 112);
  ctx.quadraticCurveTo(14, 130, 18, 128);
  ctx.lineTo(23, 114);
  ctx.quadraticCurveTo(25, 76, 21, 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // --- C. Squishy Wide White Mochi Face + Soft Front Bangs + Overlapping Side Ear ---
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-54, 8);
  // Left cheek & jaw curve
  ctx.bezierCurveTo(-56, 32, -28, 42, -2, 42);
  // Right jaw up to ear base
  ctx.bezierCurveTo(24, 42, 46, 34, 48, 14);
  // Right ear C-curve (drawn seamlessly as part of the white face/ear silhouette!)
  ctx.bezierCurveTo(64, 14, 64, -12, 46, -10);
  // Right forehead hairline sweeping up to center bang part
  ctx.quadraticCurveTo(26, -16, 8, -32);
  // Center-left soft curved bang lock (exact match to reference image!)
  ctx.quadraticCurveTo(8, -14, -6, -8);
  ctx.quadraticCurveTo(-16, -14, -16, -30);
  // Left forehead hairline sweeping down to left temple
  ctx.quadraticCurveTo(-36, -20, -54, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle hair strand lines at the bang parts (just like the reference image!)
  ctx.beginPath();
  ctx.moveTo(-16, -30);
  ctx.quadraticCurveTo(-15, -36, -12, -40);
  ctx.moveTo(8, -32);
  ctx.quadraticCurveTo(10, -37, 13, -40);
  ctx.moveTo(32, -16);
  ctx.quadraticCurveTo(36, -21, 39, -26);
  ctx.stroke();

  // Tiny inner ear line '-' inside the right ear
  ctx.beginPath();
  ctx.moveTo(47, 2);
  ctx.lineTo(53, 3);
  ctx.stroke();

  // --- D. Soft Pink Oval Cheek Blushes ---
  ctx.fillStyle = '#f9a89a';
  ctx.beginPath();
  ctx.ellipse(-32, 14, 9.5, 4.6, 0, 0, Math.PI * 2);
  ctx.ellipse(18, 14, 9.5, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- E. Expressive Hand-Drawn Eyes, Eyebrows, Eyelashes & Mouth ---
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;

  if (cutNum === 1) {
    // 1. Innocent / Motivated Smile (exact match to reference image!)
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-36, -12);
    ctx.quadraticCurveTo(-26, -16, -16, -12);
    ctx.moveTo(6, -12);
    ctx.quadraticCurveTo(16, -16, 26, -12);
    ctx.stroke();

    // Gentle upper eyelid + 3 short eyelashes + cute hollow oval pupil (exact reference look!)
    [-25, 15].forEach(ex => {
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(ex - 9, -2);
      ctx.quadraticCurveTo(ex, -6, ex + 9, -2);
      ctx.stroke();
      // 3 tiny eyelashes
      ctx.lineWidth = 2.4;
      [-5, 0, 5].forEach(dx => {
        ctx.beginPath();
        ctx.moveTo(ex + dx, -4);
        ctx.lineTo(ex + dx * 1.25, -8.5);
        ctx.stroke();
      });
      // Cute hollow oval pupil (black outline + white center)
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(ex, 3, 2.8, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Cute small 'D' smile mouth
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.lineTo(2, 12);
    ctx.bezierCurveTo(3, 21, -9, 21, -8, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (cutNum === 2) {
    // 2. Smart Senior with Round Glasses & Fact-Check Expression
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-36, -15);
    ctx.lineTo(-16, -11);
    ctx.moveTo(6, -11);
    ctx.lineTo(26, -15);
    ctx.stroke();

    // Round black-rimmed glasses
    ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(-24, 1, 12.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(15, 1, 12.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11, 1);
    ctx.lineTo(2, 1);
    ctx.stroke();

    // Pupils
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.ellipse(-24, 1, 2.8, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(15, 1, 2.8, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Confident talking mouth
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.ellipse(-4, 17, 6.5, 4.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (cutNum === 3) {
    // 3. Shocked / Crying Waterfall Tears + Hands on Cheeks
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-36, -9);
    ctx.quadraticCurveTo(-26, -16, -16, -13);
    ctx.moveTo(6, -13);
    ctx.quadraticCurveTo(16, -16, 26, -9);
    ctx.stroke();

    // Sky-blue comic tear streams
    ctx.fillStyle = '#38bdf8';
    roundRect(ctx, -30, 4, 9.5, 34, 4.5);
    ctx.fill();
    roundRect(ctx, 11, 4, 9.5, 34, 4.5);
    ctx.fill();

    // Crying '> <' eyes
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-32, -2);
    ctx.lineTo(-20, 3);
    ctx.lineTo(-32, 8);
    ctx.moveTo(22, -2);
    ctx.lineTo(10, 3);
    ctx.lineTo(22, 8);
    ctx.stroke();

    // Shocked open mouth
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.ellipse(-4, 18, 8.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Both hands clutching cheeks in shock
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-43, 26, 10.5, 14.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(35, 26, 10.5, 14.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // 4. Happy Eureka Cheer ('^ ^' eyes + big smile)
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(-25, 2, 8.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(15, 2, 8.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.moveTo(-11, 12);
    ctx.lineTo(5, 12);
    ctx.bezierCurveTo(6, 24, -12, 24, -11, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Build 4-cut human-drawn Instatoon script (Top Narration + Oval Bubble with **Contrast** + Curved Arrow Notes)
 */
function getConversationalScript(calcKey, storyObj) {
  const sc = (storyObj && storyObj.shortCartoon) || {
    epTitle: preset.title,
    p1: ['에어컨 아낀다고', '**2시간마다 껐다 켰지~**'],
    p2: ['구형은 껐다 켜면', '**누진세 폭탄** 맞아!!'],
    p3: ['으앙 **월 8만8천원**?!', '인버터는 **3만원대**인데!'],
    p4: ['내 방 에어컨 전기세', '**머니핏 3초 계산** 끝!']
  };

  const metaByCat = {
    electric: {
      narrations: [
        '원룸에 에어컨 아껴 트는 자취생이 들어왔다',
        '지나가던 자취 만렙 선배가 등짝을 때렸다',
        '실제 고지서를 비교해보니 매달 새는 돈이...',
        '머니핏 3초 무료 계산기로 호구 탈출 성공!'
      ],
      notes: [
        [['절약왕MAX'], ['자취 1년차', '껐다켰다 반복']],
        [['팩트폭격⚡'], ['자취 5년차', '누진세 박사']],
        [['멘붕MAX😭'], ['모르면 매달', '생돈 증발💸']],
        [['해결완료✨'], ['프로필 링크', '3초 무료계산']]
      ]
    },
    diet: {
      narrations: [
        '다이어트 결심하고 매일 편의점에 출근했다',
        '지나가던 헬스 고인물 선배가 경악했다',
        '4주 식비 영수증을 비교해보니 충격이었다',
        '머니핏 3초 무료 계산기로 식비 반값 성공!'
      ],
      notes: [
        [['의욕MAX'], ['헬린이 1일차', '편의점 단품']],
        [['팩트폭격⚡'], ['3대 500', '벌크 장보기']],
        [['식비파산😭'], ['낱개 구매의', '무서운 최후']],
        [['득근성공✨'], ['프로필 링크', '3초 무료계산']]
      ]
    },
    pet: {
      narrations: [
        '귀여운 반려동물 밥그릇에 사료를 부어주었다',
        '동물병원 수의사 선생님이 한숨을 쉬었다',
        '과급여 병원비와 1g 정량표를 비교해보니...',
        '머니핏 3초 무료 계산기로 정량 급여 성공!'
      ],
      notes: [
        [['사랑MAX'], ['초보 집사', '종이컵 눈대중']],
        [['팩트폭격⚡'], ['수의영양학', '1g 정량원칙']],
        [['병원비위기😭'], ['조금 더 준 게', '비만 직행💦']],
        [['건강지킴✨'], ['프로필 링크', '3초 무료계산']]
      ]
    },
    room: {
      narrations: [
        '설레는 첫 독립 가전·가구를 고르러 갔다',
        '인테리어 만렙 선배가 장바구니를 말렸다',
        '단품 구매와 황금배분 견적을 비교해보니...',
        '머니핏 3초 무료 계산기로 예산 내 졸업!'
      ],
      notes: [
        [['설렘MAX'], ['독립 1일차', '무계획 장보기']],
        [['팩트폭격⚡'], ['프로 자취러', '황금비율 배분']],
        [['예산초과😭'], ['따로 사니까', '수십만원 손해']],
        [['세팅완료✨'], ['프로필 링크', '3초 무료계산']]
      ]
    },
    auto: {
      narrations: [
        '드디어 인생 첫 신차 견적서를 뽑아보았다',
        '세무사 선배가 계산기를 두드리며 말렸다',
        '4년 실제 총비용(TCO)을 비교해보니...',
        '머니핏 3초 무료 계산기로 최저가 출고!'
      ],
      notes: [
        [['설렘MAX'], ['계약 1초전', '취등록세 모름']],
        [['팩트폭격⚡'], ['세무사 선배', '세금+보험 비교']],
        [['호구될뻔😭'], ['할부 이자에', '보험료 폭탄']],
        [['최저가출고✨'], ['프로필 링크', '3초 무료계산']]
      ]
    },
    telecom: {
      narrations: [
        '인터넷 약정과 위약금이 무서워 참고 썼다',
        '통신비 재테크 고수가 당장 바꾸라고 했다',
        '위약금 차감 후 당일 현금 순익을 따져보니...',
        '머니핏 3초 무료 계산기로 현금 47만원 수령!'
      ],
      notes: [
        [['인내심MAX'], ['약정 노예', '혜택 0원 방치']],
        [['팩트폭격⚡'], ['성지 고수', '당일 현금지원']],
        [['손해막심😭'], ['가만히 참으면', '나만 손해💸']],
        [['현금입금✨'], ['프로필 링크', '3초 무료계산']]
      ]
    }
  };

  const catMeta = metaByCat[calcKey] || metaByCat.electric;

  return {
    episodeTitle: sc.epTitle || preset.title,
    narrations: catMeta.narrations,
    notes: catMeta.notes,
    p1Lines: sc.p1,
    p2Lines: sc.p2,
    p3Lines: sc.p3,
    p4Lines: sc.p4
  };
}

function drawPanel(ctx, num, x, y, w, h, isFullSlide) {
  const s = isFullSlide ? w / 502 : 1;
  const panelRadius = Math.round(12 * s);
  const conv = getConversationalScript(preset.calcKey, story);

  // 1. Softly Blurred Realistic Indoor Background (Reference Image Aesthetic)
  drawBlurredRoomBackground(ctx, x, y, w, h, num, panelRadius);

  // 2. Top Rectangular Narration Box ("[ 회사에 의욕이 넘치는 인턴이 새로 들어왔다 ]" style)
  const narrationText = (conv.narrations && conv.narrations[num - 1]) || conv.episodeTitle;
  drawTopNarrationBox(ctx, narrationText, x, y, w, s);

  // 3. Giant Smooth Oval Speech Bubble with Dynamic Word-Size Contrast ("글자 강약!")
  const linesByNum = [conv.p1Lines, conv.p2Lines, conv.p3Lines, conv.p4Lines][num - 1] || conv.p1Lines;
  const accentByNum = ['#111111', '#dc2626', '#be123c', '#047857'][num - 1];
  const hlByNum = ['#fef08a', '#fecdd3', '#fde047', '#bbf7d0'][num - 1];
  drawOvalSpeechBubbleWithContrast(
    ctx,
    linesByNum,
    x + w * 0.48,
    y + 138 * s,
    200 * s,
    62 * s,
    s,
    accentByNum,
    hlByNum
  );

  // 4. Center Hand-Drawn 2D Mochi Character (사람이 직접 그린 하얀 찹쌀떡 캐릭터)
  drawHumanInstatoonCharacter(ctx, x + w * 0.5, y + 328 * s, preset.calcKey, num, s * 1.06);

  // 5. Left & Right Handwritten Side Annotations + Curved Arrows (↗, ↙)
  const pairNotes = (conv.notes && conv.notes[num - 1]) || [['의욕MAX'], ['자취 1년차']];
  drawHandwrittenSideNotes(ctx, pairNotes[0], pairNotes[1], x, y, w, h, s);

  // 6. Clean Comic Panel Frame (only in 2x2 grid mode)
  if (!isFullSlide) {
    ctx.save();
    roundRect(ctx, x, y, w, h, panelRadius);
    ctx.lineWidth = 4 * s;
    ctx.strokeStyle = '#111111';
    ctx.stroke();
    ctx.restore();
  }
}

function renderAll() {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const conv = getConversationalScript(preset.calcKey, story);

  if (mode === 'grid') {
    ctx.fillStyle = '#f5f3ef';
    ctx.fillRect(0, 0, 1080, 1080);

    // Top Episode Pill + Handwritten/Bold Title
    ctx.save();
    roundRect(ctx, 28, 13, 128, 36, 18);
    ctx.fillStyle = '#111111';
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.font = '800 18px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('공감 인스타툰', 92, 32);
    ctx.restore();

    ctx.fillStyle = '#111111';
    ctx.font = '900 30px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText(conv.episodeTitle, 168, 42);

    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = '800 20px sans-serif';
    ctx.fillText('@moneyfit2026', 1052, 41);
    ctx.restore();

    const pW = 502;
    const pH = 474;
    drawPanel(ctx, 1, 28, 60, pW, pH, false);
    drawPanel(ctx, 2, 550, 60, pW, pH, false);
    drawPanel(ctx, 3, 28, 550, pW, pH, false);
    drawPanel(ctx, 4, 550, 550, pW, pH, false);

    // Bottom Callout Bar
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111111';
    ctx.font = '900 22px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText('🔎 프로필 링크 또는 검색창에 「머니핏」 검색 → 3초 무료 계산기!', 540, 1058);
    ctx.restore();
  } else {
    drawPanel(ctx, slideNum, 0, 0, 1080, 1080, true);
  }
}
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(renderAll);
}
window.addEventListener('load', () => {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(renderAll);
  } else {
    renderAll();
  }
});
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
