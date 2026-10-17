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
  const tailW = 22 * s;
  const tailH = 16 * s;
  const tx = Math.max(x + r + tailW, Math.min(x + w - r - tailW, tailX));

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6 * s;

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

  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 4.8 * s;
  ctx.strokeStyle = '#0f172a';
  ctx.stroke();
  ctx.restore();
}

function drawCutBadge(ctx, num, bx, by, s = 1) {
  const labels = ['1컷 · 착각', '2컷 · 팩폭', '3컷 · 충격', '4컷 · 해결'];
  const colors = ['#f59e0b', '#ef4444', '#e11d48', '#10b981'];
  const label = labels[num - 1] || (num + '컷');
  const bg = colors[num - 1] || '#0f172a';

  ctx.save();
  ctx.font = '900 ' + (16.5 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  const tw = ctx.measureText(label).width;
  const pw = tw + 24 * s;
  const ph = 28 * s;
  const px = bx + 16 * s;
  const py = by - 13 * s;

  roundRect(ctx, px, py, pw, ph, 14 * s);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 3.5 * s;
  ctx.strokeStyle = '#0f172a';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, px + pw / 2, py + ph / 2 + 1 * s);
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

function getConversationalScript(calcKey, storyObj) {
  const sc = (storyObj && storyObj.shortCartoon) || null;
  if (sc) {
    return {
      episodeTitle: sc.epTitle || preset.title,
      p1Lines: sc.p1,
      p2Lines: sc.p2,
      p3Lines: sc.p3,
      p4Lines: sc.p4
    };
  }
  return {
    episodeTitle: '원룸 에어컨 껐다 켰다의 참사 ⚡',
    p1Lines: ['에어컨 아낀다고', '**2시간마다 껐다 켰지~**'],
    p2Lines: ['구형은 껐다 켜면', '**누진세 폭탄** 맞아!!'],
    p3Lines: ['으앙 **월 8만8천원**?!', '인버터는 **3만원대**인데!'],
    p4Lines: ['내 방 에어컨 전기세', '**머니핏 3초 계산** 끝!']
  };
}

function drawCenteredBubbleText(
  ctx,
  lines,
  cx,
  startY,
  lineHeight,
  fontSize,
  color = '#0f172a',
  maxWidth = 0,
  accentColor = '#dc2626',
  highlightBg = '#fde047'
) {
  ctx.save();
  ctx.textAlign = 'left';

  let fSize = fontSize;
  ctx.font = '900 ' + fSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  if (maxWidth > 0) {
    lines.forEach(rawLine => {
      const plainLine = String(rawLine || '').split('**').join('');
      while (fSize > 26 && ctx.measureText(plainLine).width > maxWidth) {
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
        roundRect(ctx, curX - 5, baseY - fSize * 0.84, segW + 10, fSize * 1.02, 8);
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
  const panelRadius = Math.round(14 * s);
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
    drawAnimalCharacter(ctx, x + w * 0.5, y + h * 0.68, sp, mood, '#fecdd3', s * 1.18);
  }

  // 2. SINGLE Giant-Typography Speech Bubble per panel (Benchmark Instatoon Style: 38px in grid / 76px in slide!)
  const bx = x + 12 * s;
  const by = y + 18 * s;
  const bw = w - 24 * s;
  const bh = 124 * s;
  const tailRatio = num === 1 ? 0.42 : num === 2 ? 0.34 : num === 3 ? 0.64 : 0.38;
  const tailDir = num === 3 ? 1 : -1;

  drawSpeechBubble(ctx, bx, by, bw, bh, 32 * s, x + w * tailRatio, tailDir, s);
  drawCutBadge(ctx, num, bx, by, s);

  const linesByNum = [conv.p1Lines, conv.p2Lines, conv.p3Lines, conv.p4Lines][num - 1] || conv.p1Lines;
  const accentByNum = ['#b45309', '#dc2626', '#be123c', '#047857'][num - 1];
  const bgByNum = ['#fde047', '#fecdd3', '#ffe4e6', '#bbf7d0'][num - 1];

  drawCenteredBubbleText(
    ctx,
    linesByNum,
    bx + bw / 2,
    by + 56 * s,
    46 * s,
    38 * s,
    '#0f172a',
    bw - 26 * s,
    accentByNum,
    bgByNum
  );

  // 3. Crisp Authentic Comic Panel Outline (#0f172a, 5px)
  ctx.save();
  roundRect(ctx, x, y, w, h, panelRadius);
  ctx.lineWidth = 5 * s;
  ctx.strokeStyle = '#0f172a';
  ctx.stroke();
  ctx.restore();
}

function renderAll() {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const conv = getConversationalScript(preset.calcKey, story);

  if (mode === 'grid') {
    ctx.fillStyle = '#faf7f2';
    ctx.fillRect(0, 0, 1080, 1080);

    // Top Episode Pill + Giant 32px Title
    ctx.save();
    roundRect(ctx, 28, 13, 128, 36, 18);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.font = '900 18px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('공감 4컷툰', 92, 32);
    ctx.restore();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 31px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText(conv.episodeTitle, 168, 42);

    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = '900 20px sans-serif';
    ctx.fillText('@moneyfit2026', 1052, 41);
    ctx.restore();

    const pW = 502;
    const pH = 474;
    drawPanel(ctx, 1, 28, 60, pW, pH, false);
    drawPanel(ctx, 2, 550, 60, pW, pH, false);
    drawPanel(ctx, 3, 28, 550, pW, pH, false);
    drawPanel(ctx, 4, 550, 550, pW, pH, false);

    // Bold, clean bottom callout bar
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText('🔎 프로필 링크 또는 검색창에 「머니핏」 검색 → 3초 무료 계산기!', 540, 1058);
    ctx.restore();
  } else {
    ctx.fillStyle = '#faf7f2';
    ctx.fillRect(0, 0, 1080, 1080);
    drawPanel(ctx, slideNum, 36, 28, 1008, 992, true);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 24px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText('🔎 프로필 링크 또는 검색창에 「머니핏」 검색 → 3초 무료 계산기!', 540, 1056);
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
