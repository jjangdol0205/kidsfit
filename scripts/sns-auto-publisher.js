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
function getCategoryArtDataUri(calcKey, slug) {
  const key = slug || calcKey || 'electric';
  if (ART_DATA_URI_CACHE[key] !== undefined) return ART_DATA_URI_CACHE[key];
  const epImgPath = slug ? path.join(PROJECT_ROOT, 'src', 'assets', 'webtoon', 'episodes', `${slug}.jpg`) : '';
  const imgPath = (epImgPath && fs.existsSync(epImgPath))
    ? epImgPath
    : path.join(PROJECT_ROOT, 'src', 'assets', 'webtoon', `${calcKey || 'electric'}.jpg`);
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

  // Find next preset in the same category (or overall) for the Next-Episode Cliffhanger Hook
  const sameCatPresets = PRESETS.filter(p => (p.calc || p.calcKey) === preset.calcKey);
  const catIdx = sameCatPresets.findIndex(p => (p.id || p.slug) === preset.slug);
  const nextPreset = sameCatPresets.length > 1 && catIdx >= 0
    ? sameCatPresets[(catIdx + 1) % sameCatPresets.length]
    : PRESETS[(PRESETS.findIndex(p => (p.id || p.slug) === preset.slug) + 1) % PRESETS.length] || preset;

  // 1. Threads Main Post (Ultra-short 5-line Instatoon punch + A vs B Debate Question for 10x Replies & Follows)
  const threadsMain = [
    `🐾 [${sc.epTitle}]`,
    `💬 "${plainP1}" → "${plainP3}"`,
    '',
    `❌ ${t.badLabel}: ${t.badVal}`,
    `✅ ${t.goodLabel}: ${t.goodVal} (${t.diffVal})`,
    '',
    `⚖️ 쓰친님들의 현실 선택은?`,
    `🅰️ 귀찮아도 기존대로(${t.badLabel}) vs 🅱️ 바꾸고 ${t.diffVal} 아끼기(${t.goodLabel})`,
    `👇 내 조건 3초 무료 계산기 & 다음 화 예고는 첫 댓글에!`
  ].join('\n');

  // 2. Threads & Facebook 1st Self-Reply Comment (Direct Link + Next-Episode Cliffhanger Follow Hook)
  const threadsReply = [
    `🔗 「${preset.title}」 3초 무료 계산기 바로가기`,
    targetUrl,
    '',
    `➕ @moneyfit2026 팔로우해두시면 내일 올라오는 「${nextPreset.title}」 본전 영수증 만화도 놓치지 않아요 🔥`
  ].join('\n');

  // 3. Instagram Caption (Save 📌 + Comment Vote 💬 + Follow @moneyfit2026 ➕ 3-Step Follower Magnet)
  const instagramCaption = [
    `🐾 ${sc.epTitle} (@moneyfit2026)`,
    `💬 "${plainP1}" → "${plainP3}"`,
    '',
    `📊 [3초 핵심 요약]`,
    `• ${t.badLabel}: ${t.badVal}`,
    `• ${t.goodLabel}: ${t.goodVal}`,
    `• 절약 효과: ${t.diffVal}`,
    '',
    `💬 [댓글 투표] 우리 집은 1번(${t.badLabel}) vs 2번(${t.goodLabel})? 댓글에 번호나 '계산기' 남겨주세요!`,
    `📌 [저장 필수] 까먹기 전에 저장해두고 고지서·견적서 나올 때 바로 비교해보세요!`,
    `➕ [팔로우 혜택] @moneyfit2026 팔로우하면 매주 새는 고정비 30만 원 막아주는 '4컷 영수증 만화'가 피드로 배달됩니다!`,
    `👉 3초 무료 계산기는 @moneyfit2026 프로필 링크 클릭!`,
    '',
    t.hashtags || `#인스타툰 #생활비절약 #자취꿀팁 #머니핏`
  ].join('\n');

  // 4. Facebook Post (Concise 4-cut summary + Friend Tag & Page Follow Hook)
  const facebookPost = [
    `🐾 [4컷 공감툰] ${sc.epTitle}`,
    `• ${t.badLabel}: ${t.badVal} → ${t.goodLabel}: ${t.goodVal} (${t.diffVal})`,
    `💡 지금 이거 고민 중인 친구 @태그 해주고 페이지 [팔로우] 해두시면 매주 생활비 아끼는 3초 영수증 만화를 받아보실 수 있어요!`,
    `👇 내 조건 3초 무료 계산기 주소는 첫 댓글에 있습니다!`
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
 * Build 7-Channel Omni-Channel Promotion Kit (`omni_channel_kit.md`) for Naver Clip, Karrot, Blind/Everytime, TikTok/Shorts, Pinterest
 */
function buildOmniChannelKitMd(preset, bundle, siteUrl = 'https://truthofmarket.com') {
  const cleanSiteUrl = String(siteUrl || 'https://truthofmarket.com').replace(/\/+$/, '');
  const t = bundle.story || {};
  const sc = t.shortCartoon || {};
  const epTitle = sc.epTitle || preset.title;
  const p1 = (sc.p1 || []).join(' ').replace(/\*\*/g, '');
  const p2 = (sc.p2 || []).join(' ').replace(/\*\*/g, '');
  const p3 = (sc.p3 || []).join(' ').replace(/\*\*/g, '');
  const p4 = (sc.p4 || []).join(' ').replace(/\*\*/g, '');

  const SHOPPING_CONNECT_MAP = {
    electric: { keyword: '에너지 1등급 인버터 에어컨 / 스마트플러그 전력측정기', label: '🛒 네이버 쇼핑커넥트 1등급 절전 가전 특가' },
    diet: { keyword: '무염 닭가슴살 10kg 대용량 팩 / 주방 전자저울', label: '🛒 네이버 쇼핑커넥트 대용량 식단 최저가' },
    pet: { keyword: '로얄캐닌 사료 대용량 포대 / 반려동물 급여 전자저울', label: '🛒 네이버 쇼핑커넥트 정품 대용량 사료 특가' },
    room: { keyword: '원룸 접이식 토퍼 매트리스 / 올인원 로봇청소기', label: '🛒 네이버 쇼핑커넥트 자취·신혼 가성비 가구' },
    auto: { keyword: '불스원샷 연료첨가제 / 차량용 4K 블랙박스', label: '🛒 네이버 쇼핑커넥트 차량 유지비 절약템' },
    telecom: { keyword: '알뜰폰 무약정 유심칩 / Wi-Fi 6 공유기', label: '🛒 네이버 쇼핑커넥트 자급제·알뜰 유심 특가' }
  };
  const scItem = SHOPPING_CONNECT_MAP[preset.calcKey] || SHOPPING_CONNECT_MAP.electric;

  const karrotUrl = `${cleanSiteUrl}/preset/${preset.slug}?src=karrot_local`;
  const commUrl = `${cleanSiteUrl}/preset/${preset.slug}?src=community_viral`;
  const shortsUrl = `${cleanSiteUrl}/preset/${preset.slug}?src=shorts_tiktok`;
  const pinUrl = `${cleanSiteUrl}/preset/${preset.slug}?src=pinterest_pin`;

  return [
    `# 🚀 [${preset.title}] 전사 옴니채널 웹툰 홍보 키트 (100% 저작권 안전 머니핏 오리지널 × 네이버 쇼핑커넥트)`,
    ``,
    `- **슬러그**: \`${preset.slug}\``,
    `- **에피소드**: ${epTitle}`,
    `- **사용 이미지 & 영상**:`,
    `  - 4컷 슬라이드: \`sns_outbox/${preset.slug}/slide-1.png\` ~ \`slide-4.png\``,
    `  - 10초 클립 영상(9:16): \`sns_outbox/${preset.slug}/clip.mp4\``,
    `  - 1장 요약 합본: \`sns_outbox/${preset.slug}/webtoon-grid.png\` (\`${cleanSiteUrl}/sns/${preset.slug}-grid.png\`)`,
    ``,
    `---`,
    ``,
    `## 1️⃣ 🟢 네이버 클립 (Naver Clip) & 네이버 블로그 — 공식 [네이버 쇼핑커넥트] 1순위 연동 (정책 위배 ZERO!)`,
    `- **핵심 전략**: 네이버 클립·블로그에서는 외부 타사 커머스/리다이렉트 링크 대신 **네이버 공식 [쇼핑커넥트(브랜드커넥트) 쇼핑 스티커 / 상품 태그]**를 부착하여 저품질·외부링크 페널티를 100% 원천 차단하고, 네이버 클립 피드 노출 가산점 + N페이 즉결 구매 수수료를 동시에 확보합니다!`,
    `- **업로드 파일**: \`sns_outbox/${preset.slug}/clip.mp4\` (10초 세로형 영상) 또는 \`slide-1.png ~ slide-4.png\``,
    `- **🛍️ 네이버 쇼핑커넥트 추천 상품 태그 키워드**: \`${scItem.keyword}\``,
    `- **🏷️ 쇼핑 스티커 문구**: \`${scItem.label}\``,
    `- **클립·블로그 제목 (복붙용)**:`,
    `\`\`\`text`,
    `🦊 여우실장 3초 영수증 팩트체크! ${preset.title} ${t.diffVal} 아끼는 현실 꿀팁`,
    `\`\`\``,
    `- **클립 캡션 & 해시태그 (복붙용 — 외부링크 없이 네이버 쇼핑커넥트 스티커 유도)**:`,
    `\`\`\`text`,
    `"${p1}" ➔ "${p3}" 🧾`,
    `❌ ${t.badLabel}: ${t.badVal}`,
    `✅ ${t.goodLabel}: ${t.goodVal} (${t.diffVal})`,
    `화면 아래 [네이버 쇼핑커넥트 상품 스티커]에서 1등급 절약템 최저가를 바로 확인하거나, 네이버에 [ 머니핏 ]을 검색해 3초 무료 계산기를 돌려보세요! 👇`,
    `※ 이 콘텐츠는 네이버 쇼핑커넥트 활동의 일환으로 판매 발생 시 수수료를 제공받습니다.`,
    `#네이버클립 #쇼핑커넥트 #인스타툰 #생활비절약 #머니핏 #자취꿀팁`,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## 2️⃣ 🥕 당근마켓 동네생활 ('동네 질문 / 살림·자취 꿀팁' 탭)`,
    `- **업로드 이미지**: \`slide-1.png\`, \`slide-2.png\`, \`slide-3.png\` (1~3컷 영수증 팩트체크 첨부!)`,
    `- **본문 원고 (복붙용)**:`,
    `\`\`\`text`,
    `동네 이웃님들 혹시 ${preset.title} 계산해보신 분 계신가요? 😭`,
    `저는 귀찮아서 그냥(${t.badLabel}: ${t.badVal}) 썼는데,`,
    `옆자리 여우 실장님이 3초 영수증 계산기 돌려보더니 바꾸면(${t.goodLabel}: ${t.goodVal}) ${t.diffVal}이나 차이 난다고 알려주시네요;;`,
    `혹시 동네 분들은 어떻게 쓰고 계세요?`,
    `\`\`\``,
    `- **첫 댓글 셀프 좌표 (복붙용)**:`,
    `\`\`\`text`,
    `혹시 궁금하신 분 계실까 봐 제가 돌려본 3초 무료 계산기 주소 남겨둘게요! (회원가입 없어요)`,
    `👉 ${karrotUrl}`,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## 3️⃣ 🏢 직장인 블라인드(Blind) · 🎓 에브리타임 · 🤱 맘카페 맞춤 원고`,
    `- **업로드 이미지**: \`webtoon-grid.png\` (1장 요약 합본)`,
    `- **제목 (복붙용)**: \`[머니핏 4컷툰] ${preset.title}, 감으로 결제했다가 영수증 보고 충격받은 썰 (${t.diffVal})\``,
    `- **본문 (복붙용)**:`,
    `\`\`\`text`,
    `1컷: "${p1}"`,
    `2컷: "${p2}"`,
    `3컷(실물 비교 영수증): ❌ ${t.badLabel}(${t.badVal}) vs ✅ ${t.goodLabel}(${t.goodVal}) ➔ ${t.diffVal}!`,
    `4컷: "${p4}"`,
    ``,
    `내 조건 숫자 넣으면 3초 만에 본전 영수증 뽑아주는 무료 계산기 좌표:`,
    `👉 ${commUrl}`,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## 4️⃣ 🎵 틱톡 포토모드 (TikTok Photo Mode) & 📺 유튜브 쇼츠`,
    `- **업로드 방식**: 틱톡 \`[포토모드]\`로 \`slide-1.png ~ slide-4.png\` 4장 업로드 또는 \`clip.mp4\` 업로드`,
    `- **캡션 & 고정 댓글 (복붙용)**:`,
    `\`\`\`text`,
    `3컷 실물 비교 영수증 숫자가 실화냐고요... 😱 (${t.badVal} vs ${t.goodVal})`,
    `내 조건 3초 무료 계산기는 프로필 링크 또는 검색창에 [ 머니핏 ] 검색!`,
    `🔗 ${shortsUrl}`,
    `#인스타툰 #웹툰 #생활비절약 #자취꿀팁 #쇼츠`,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## 5️⃣ 📌 핀터레스트 (Pinterest) & 구글 이미지 검색 영구 파이프라인`,
    `- **업로드 이미지**: \`slide-1.png\` (표지) 또는 \`webtoon-grid.png\``,
    `- **핀 제목**: \`[머니핏 4컷 인스타툰] ${preset.title} — ${t.diffVal} 아끼는 3초 영수증 계산법\``,
    `- **핀 설명**: \`"${p1}" ❌ ${t.badLabel}(${t.badVal}) vs ✅ ${t.goodLabel}(${t.goodVal}). 모르면 날리는 생돈 ${t.diffVal}을 3초 만에 계산해보세요.\``,
    `- **도착 URL (Destination Link)**: \`${pinUrl}\``
  ].join('\n');
}

/**
 * Create standalone HTML for headless Chrome 1080x1080 screenshot
 */
function buildRenderHtml(bundle, mode = 'grid', slideNum = 1) {
  const { preset, story } = bundle;
  const fontsDirUrl = 'file:///' + path.join(PROJECT_ROOT, 'src', 'assets', 'fonts').replace(/\\/g, '/');
  const artDataUri = getCategoryArtDataUri(preset.calcKey, preset.slug);

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
    background: #faf6f0;
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
<img id="art-img" src="${artDataUri}" style="display:none" />
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
 * 3. Hand-Drawn Curved Arrows (↘, ↙) + Handwritten Pen Annotations ("절약왕MAX", "자취 1년차" style)
 *    Positioned cleanly in the upper-mid wall space (y = 212..268) so the lower stage (y = 275..468)
 *    has full room for situation-specific furniture, pets, appliances, and multi-character action!
 */
function drawHandwrittenSideNotes(ctx, leftLines, rightLines, x, y, w, h, s = 1) {
  ctx.save();

  const drawHaloHandwriting = (linesArr, tx, ty, tiltRad, align = 'center') => {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(tiltRad);
    ctx.font = '400 ' + (29.5 * s).toFixed(1) + 'px "Nanum Pen Script", "Gaegu", cursive';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    linesArr.forEach((ln, idx) => {
      const ly = idx * 25 * s;
      ctx.lineWidth = 6.5 * s;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(ln, 0, ly);
      ctx.fillStyle = '#111111';
      ctx.fillText(ln, 0, ly);
    });
    ctx.restore();
  };

  // Left-upper-mid handwritten note + Curved Arrow ↘ pointing to protagonist
  if (leftLines && leftLines.length) {
    drawHaloHandwriting(leftLines, x + 76 * s, y + 216 * s, -0.06, 'center');
    const lStartY = y + (216 + leftLines.length * 23 + 4) * s;
    ctx.save();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3.2 * s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 62 * s, lStartY);
    ctx.quadraticCurveTo(x + 68 * s, y + 286 * s, x + 132 * s, y + 292 * s);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 116 * s, y + 282 * s);
    ctx.lineTo(x + 134 * s, y + 292 * s);
    ctx.lineTo(x + 117 * s, y + 303 * s);
    ctx.stroke();
    ctx.restore();
  }

  // Right-upper-mid handwritten note + Curved Arrow ↙ pointing to situation prop / senior
  if (rightLines && rightLines.length) {
    drawHaloHandwriting(rightLines, x + 422 * s, y + 212 * s, 0.05, 'center');
    const rStartY = y + (212 + rightLines.length * 23 + 4) * s;
    ctx.save();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3.2 * s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 436 * s, rStartY);
    ctx.quadraticCurveTo(x + 432 * s, y + 288 * s, x + 372 * s, y + 294 * s);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 388 * s, y + 283 * s);
    ctx.lineTo(x + 370 * s, y + 294 * s);
    ctx.lineTo(x + 387 * s, y + 305 * s);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Preset-Adaptive Character & Scene Configuration SSOT
 * Keeps the iconic Hand-Drawn Mochi character identity 100%,
 * while providing customized hairstyles, outfits, props, and mentors for every single preset!
 */
function getCharacterConfigForPreset(slug, calcKey) {
  const s = String(slug || '').toLowerCase();
  const def = {
    hero: {
      hairStyle: 'bun',
      hairColor: '#f9a89a',
      headwear: 'none',
      headwearColor: '#fde047',
      outfit: 'home_tee',
      shirtColor: '#bae6fd',
      pose1: 'remote',
      gender: 'female'
    },
    mentor: {
      type: 'senior_pro',
      hairColor: '#a5b4fc',
      shirtColor: '#e0e7ff',
      glasses: true
    }
  };

  if (calcKey === 'auto') {
    if (s.includes('casper')) {
      return {
        hero: { hairStyle: 'twin_buns', hairColor: '#f9a89a', headwear: 'none', headwearColor: '#fde047', outfit: 'hoodie', shirtColor: '#fef08a', pose1: 'wheel', gender: 'female' },
        mentor: { type: 'tax_pro', hairColor: '#64748b', shirtColor: '#e2e8f0', glasses: true }
      };
    } else if (s.includes('tucson') || s.includes('ioniq')) {
      return {
        hero: { hairStyle: 'short', hairColor: '#1e293b', headwear: 'none', headwearColor: '#38bdf8', outfit: 'office_shirt', shirtColor: '#e2e8f0', pose1: 'wheel', gender: 'male' },
        mentor: { type: 'auto_master', hairColor: '#334155', shirtColor: '#0284c7', glasses: true }
      };
    } else if (s.includes('grandeur') || s.includes('genesis')) {
      return {
        hero: { hairStyle: 'short', hairColor: '#0f172a', headwear: 'none', headwearColor: '#94a3b8', outfit: 'office_shirt', shirtColor: '#cbd5e1', pose1: 'car_key', gender: 'male' },
        mentor: { type: 'tax_pro', hairColor: '#1e293b', shirtColor: '#334155', glasses: true }
      };
    } else {
      // auto-avante-3000 (20대 사회초년생 첫차)
      return {
        hero: { hairStyle: 'short', hairColor: '#334155', headwear: 'cap', headwearColor: '#3b82f6', outfit: 'hoodie', shirtColor: '#93c5fd', pose1: 'car_key', gender: 'male' },
        mentor: { type: 'tax_pro', hairColor: '#1e3a8a', shirtColor: '#e0e7ff', glasses: true }
      };
    }
  }

  if (calcKey === 'diet') {
    if (s.includes('female') || s.includes('quick-3kg')) {
      return {
        hero: { hairStyle: s.includes('quick-3kg') ? 'twin_buns' : 'ponytail', hairColor: '#fb7185', headwear: 'sweatband', headwearColor: '#fda4af', outfit: 'gym_tank', shirtColor: '#fda4af', pose1: 'salad', gender: 'female' },
        mentor: { type: 'gym_coach', hairColor: '#1e293b', shirtColor: '#f43f5e', glasses: false }
      };
    } else if (s.includes('bulkup') || s.includes('student')) {
      return {
        hero: { hairStyle: 'short', hairColor: '#475569', headwear: 'none', headwearColor: '#10b981', outfit: 'gym_tank', shirtColor: '#a7f3d0', pose1: 'chicken', gender: 'male' },
        mentor: { type: 'gym_coach', hairColor: '#1e293b', shirtColor: '#10b981', glasses: false }
      };
    } else if (s.includes('office')) {
      return {
        hero: { hairStyle: 'short', hairColor: '#1e293b', headwear: 'none', headwearColor: '#3b82f6', outfit: 'office_shirt', shirtColor: '#e0f2fe', pose1: 'salad', gender: 'male' },
        mentor: { type: 'senior_pro', hairColor: '#3b82f6', shirtColor: '#dbeafe', glasses: true }
      };
    } else {
      // diet-male-fatloss (80kg 헬린이 체지방 컷팅)
      return {
        hero: { hairStyle: 'short', hairColor: '#1e293b', headwear: 'sweatband', headwearColor: '#ef4444', outfit: 'gym_tank', shirtColor: '#fef08a', pose1: 'dumbbell', gender: 'male' },
        mentor: { type: 'gym_coach', hairColor: '#0f172a', shirtColor: '#ef4444', glasses: false }
      };
    }
  }

  if (calcKey === 'pet') {
    if (s.includes('cat') || s.includes('shorthair')) {
      return {
        hero: { hairStyle: 'bob', hairColor: '#ea580c', headwear: 'cat_ears', headwearColor: '#fed7aa', outfit: 'home_tee', shirtColor: '#fed7aa', pose1: 'chicken', gender: 'female' },
        mentor: { type: 'vet_doc', hairColor: '#475569', shirtColor: '#ffffff', glasses: true }
      };
    } else if (s.includes('pomeranian')) {
      return {
        hero: { hairStyle: 'twin_buns', hairColor: '#f9a89a', headwear: 'ribbon', headwearColor: '#fb7185', outfit: 'home_tee', shirtColor: '#fbcfe8', pose1: 'cup', gender: 'female' },
        mentor: { type: 'vet_doc', hairColor: '#334155', shirtColor: '#ffffff', glasses: true }
      };
    } else if (s.includes('golden')) {
      return {
        hero: { hairStyle: 'short', hairColor: '#b45309', headwear: 'cap', headwearColor: '#f59e0b', outfit: 'hoodie', shirtColor: '#fde047', pose1: 'cup', gender: 'male' },
        mentor: { type: 'senior_pro', hairColor: '#78350f', shirtColor: '#fef3c7', glasses: false }
      };
    } else {
      // pet-maltese-5kg
      return {
        hero: { hairStyle: 'bun', hairColor: '#fdba74', headwear: 'dog_ears', headwearColor: '#fed7aa', outfit: 'apron', shirtColor: '#fed7aa', pose1: 'cup', gender: 'female' },
        mentor: { type: 'vet_doc', hairColor: '#475569', shirtColor: '#ffffff', glasses: true }
      };
    }
  }

  if (calcKey === 'electric') {
    if (s.includes('winter') || s.includes('heater')) {
      return {
        hero: { hairStyle: 'short', hairColor: '#1e293b', headwear: 'beanie', headwearColor: '#ef4444', outfit: 'winter_coat', shirtColor: '#ef4444', pose1: 'remote', gender: 'male' },
        mentor: { type: 'senior_pro', hairColor: '#a5b4fc', shirtColor: '#fee2e2', glasses: true }
      };
    } else if (s.includes('dryer')) {
      return {
        hero: { hairStyle: 'twin_buns', hairColor: '#f472b6', headwear: 'ribbon', headwearColor: '#fbcfe8', outfit: 'apron', shirtColor: '#fce7f3', pose1: 'tape', gender: 'female' },
        mentor: { type: 'senior_pro', hairColor: '#a5b4fc', shirtColor: '#e0e7ff', glasses: true }
      };
    } else if (s.includes('dehumidifier')) {
      return {
        hero: { hairStyle: 'sprout', hairColor: '#0284c7', headwear: 'none', headwearColor: '#7dd3fc', outfit: 'home_tee', shirtColor: '#7dd3fc', pose1: 'remote', gender: 'female' },
        mentor: { type: 'senior_pro', hairColor: '#a5b4fc', shirtColor: '#e0e7fe', glasses: true }
      };
    } else {
      // electric-studio-ac / stand-ac / inverter-roi
      return {
        hero: { hairStyle: 'bun', hairColor: '#f9a89a', headwear: 'none', headwearColor: '#fde047', outfit: 'home_tee', shirtColor: '#bae6fd', pose1: 'remote', gender: 'female' },
        mentor: { type: 'senior_pro', hairColor: '#a5b4fc', shirtColor: '#e0e7ff', glasses: true }
      };
    }
  }

  if (calcKey === 'room') {
    if (s.includes('newlywed')) {
      return {
        hero: { hairStyle: 'twin_buns', hairColor: '#fda4af', headwear: 'ribbon', headwearColor: '#fb7185', outfit: 'home_tee', shirtColor: '#ffe4e6', pose1: 'tape', gender: 'female' },
        mentor: { type: 'interior_pro', hairColor: '#334155', shirtColor: '#fce7f3', glasses: true }
      };
    } else if (s.includes('minimalist')) {
      return {
        hero: { hairStyle: 'short', hairColor: '#475569', headwear: 'none', headwearColor: '#64748b', outfit: 'home_tee', shirtColor: '#f1f5f9', pose1: 'tape', gender: 'male' },
        mentor: { type: 'senior_pro', hairColor: '#64748b', shirtColor: '#e2e8f0', glasses: true }
      };
    } else {
      // room-oneroom-100 / officetel-300 / 500
      return {
        hero: { hairStyle: 'short', hairColor: '#78350f', headwear: 'beret', headwearColor: '#d97706', outfit: 'apron', shirtColor: '#fde68a', pose1: 'tape', gender: 'unisex' },
        mentor: { type: 'interior_pro', hairColor: '#334155', shirtColor: '#e0e7ff', glasses: true }
      };
    }
  }

  if (calcKey === 'telecom') {
    if (s.includes('penalty')) {
      return {
        hero: { hairStyle: 'bob', hairColor: '#0d9488', headwear: 'none', headwearColor: '#14b8a6', outfit: 'home_tee', shirtColor: '#ccfbf1', pose1: 'remote', gender: 'female' },
        mentor: { type: 'telecom_pro', hairColor: '#1e293b', shirtColor: '#99f6e4', glasses: true }
      };
    } else if (s.includes('family')) {
      return {
        hero: { hairStyle: 'short', hairColor: '#1e293b', headwear: 'none', headwearColor: '#10b981', outfit: 'home_tee', shirtColor: '#ecfdf5', pose1: 'remote', gender: 'male' },
        mentor: { type: 'telecom_pro', hairColor: '#047857', shirtColor: '#a7f3d0', glasses: true }
      };
    } else {
      // telecom-mvno-switch / 3yr-expired / single-oneroom
      return {
        hero: { hairStyle: 'short', hairColor: '#0f766e', headwear: 'none', headwearColor: '#14b8a6', outfit: 'hoodie', shirtColor: '#99f6e4', pose1: 'remote', gender: 'unisex' },
        mentor: { type: 'telecom_pro', hairColor: '#1e293b', shirtColor: '#a7f3d0', glasses: true }
      };
    }
  }

  return def;
}

/**
 * Helper: Draw our signature consistent Mochi character (or Senior expert) at (cx, cy)
 * Keeps the lovable hand-drawn white mochi body 100%, while dynamically varying
 * hairstyles, headwear, outfits, accessories, and cut poses to fit the exact episode!
 */
function drawMochiFigure(ctx, cx, cy, s, opts = {}) {
  const {
    role = 'hero',
    calcKey = 'electric',
    slug = '',
    pose = 'normal',
    flipX = false
  } = opts;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(flipX ? -s : s, s);

  const ink = '#111111';
  ctx.strokeStyle = ink;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const isMentor = role === 'mentor' || role === 'senior';
  const charCfg = getCharacterConfigForPreset(slug, calcKey);
  const cfg = isMentor ? charCfg.mentor : charCfg.hero;

  const hairStyle = isMentor
    ? ((cfg.type === 'gym_coach' || cfg.type === 'auto_master') ? 'short' : 'bob')
    : (cfg.hairStyle || 'bun');
  const hairColor = cfg.hairColor || (isMentor ? '#a5b4fc' : '#f9a89a');
  const headwear = isMentor ? 'none' : (cfg.headwear || 'none');
  const headwearColor = cfg.headwearColor || '#fde047';
  const outfit = isMentor
    ? ((cfg.type === 'vet_doc') ? 'doctor_coat' : (cfg.type === 'gym_coach') ? 'gym_tank' : (cfg.type === 'tax_pro') ? 'office_shirt' : (cfg.type === 'interior_pro') ? 'apron' : 'office_shirt')
    : (cfg.outfit || 'home_tee');
  const shirtColor = cfg.shirtColor || (isMentor ? '#e0e7ff' : '#bae6fd');
  const gender = isMentor ? ((cfg.type === 'gym_coach') ? 'male' : 'unisex') : (cfg.gender || 'female');

  // Subtle floor shadow
  if (pose !== 'cry_desk') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 126, 36, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 1. Back Hair Bun / Style & Outer Hair Silhouette ---
  ctx.lineWidth = 3.2;
  ctx.fillStyle = hairColor;

  if (hairStyle === 'bun') {
    // Signature top-right round bun + hair tie
    ctx.beginPath();
    ctx.arc(36, -54, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = headwearColor;
    ctx.beginPath();
    ctx.ellipse(23, -42, 8, 4, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hairColor;
  } else if (hairStyle === 'twin_buns') {
    // Cute double buns (Left & Right)
    ctx.beginPath();
    ctx.arc(-35, -52, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(35, -52, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = headwearColor;
    ctx.beginPath();
    ctx.ellipse(-23, -40, 7, 4, 0.6, 0, Math.PI * 2);
    ctx.ellipse(23, -40, 7, 4, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hairColor;
  } else if (hairStyle === 'sprout') {
    // Cute top sprout / ponytail
    ctx.beginPath();
    ctx.arc(0, -56, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(8, -68, 6, 12, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hairColor;
  } else if (hairStyle === 'ponytail') {
    // High perky ponytail
    ctx.beginPath();
    ctx.ellipse(40, -48, 22, 15, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (hairStyle === 'bob') {
    // Cute rounded bob volume on sides
    ctx.beginPath();
    ctx.ellipse(-38, -6, 20, 32, 0.2, 0, Math.PI * 2);
    ctx.ellipse(38, -6, 20, 32, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (hairStyle === 'short') {
    // Neat boyish cropped hair silhouette on top
    ctx.beginPath();
    ctx.arc(-18, -54, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(6, -58, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(28, -52, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Smooth hair dome behind face & ear
  ctx.beginPath();
  ctx.ellipse(0, -10, 61, 51, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Headwear: Dog / Cat ears / Beanie / Beret / Cap behind face
  if (headwear === 'dog_ears') {
    ctx.fillStyle = headwearColor;
    ctx.beginPath();
    ctx.ellipse(-30, -54, 10, 22, -0.25, 0, Math.PI * 2);
    ctx.ellipse(30, -54, 10, 22, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (headwear === 'cat_ears') {
    ctx.fillStyle = headwearColor;
    ctx.beginPath();
    ctx.moveTo(-38, -32);
    ctx.lineTo(-30, -62);
    ctx.lineTo(-12, -42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(38, -32);
    ctx.lineTo(30, -62);
    ctx.lineTo(12, -42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner pink ears
    ctx.fillStyle = '#fecdd3';
    ctx.beginPath();
    ctx.moveTo(-33, -36);
    ctx.lineTo(-28, -55);
    ctx.lineTo(-17, -43);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(33, -36);
    ctx.lineTo(28, -55);
    ctx.lineTo(17, -43);
    ctx.closePath();
    ctx.fill();
  } else if (headwear === 'beanie') {
    roundRect(ctx, -42, -66, 84, 38, 14);
    ctx.fillStyle = headwearColor;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -74, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, -44, -36, 88, 14, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
  } else if (headwear === 'beret') {
    ctx.fillStyle = headwearColor;
    ctx.beginPath();
    ctx.ellipse(8, -48, 38, 18, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, -66);
    ctx.lineTo(12, -72);
    ctx.stroke();
  } else if (headwear === 'cap') {
    roundRect(ctx, -38, -56, 76, 32, 16);
    ctx.fillStyle = headwearColor;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, -26);
    ctx.quadraticCurveTo(46, -30, 56, -20);
    ctx.quadraticCurveTo(36, -18, 12, -22);
    ctx.fillStyle = headwearColor;
    ctx.fill();
    ctx.stroke();
  }

  // Left & Right Arms based on pose
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 3.2;

  if (pose === 'pointer') {
    // Left arm resting, right arm holding wooden pointer stick toward right board
    ctx.beginPath();
    ctx.moveTo(-22, 38);
    ctx.quadraticCurveTo(-34, 66, -30, 92);
    ctx.quadraticCurveTo(-36, 98, -22, 96);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20, 40);
    ctx.quadraticCurveTo(46, 34, 58, 18);
    ctx.quadraticCurveTo(65, 16, 62, 26);
    ctx.quadraticCurveTo(48, 46, 22, 56);
    ctx.fill();
    ctx.stroke();

    // Pointer stick
    ctx.save();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(58, 20);
    ctx.lineTo(106, -12);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(106, -12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (pose === 'cheer_phone') {
    // Left arm holding glowing Smartphone high, right arm cheering up!
    ctx.beginPath();
    ctx.moveTo(-20, 42);
    ctx.quadraticCurveTo(-48, 22, -46, -2);
    ctx.quadraticCurveTo(-36, -8, -30, 8);
    ctx.quadraticCurveTo(-28, 26, -18, 46);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20, 42);
    ctx.quadraticCurveTo(46, 22, 44, -2);
    ctx.quadraticCurveTo(34, -8, 28, 8);
    ctx.quadraticCurveTo(26, 26, 18, 46);
    ctx.fill();
    ctx.stroke();

    // Hand-drawn Smartphone in left hand
    ctx.save();
    ctx.translate(-48, -16);
    ctx.rotate(-0.15);
    roundRect(ctx, -16, -24, 32, 48, 6);
    ctx.fillStyle = '#111111';
    ctx.fill();
    roundRect(ctx, -13, -19, 26, 38, 4);
    ctx.fillStyle = '#34d399';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px "Gaegu", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('3초계산', 0, -2);
    ctx.fillText('OK!', 0, 11);
    ctx.restore();
  } else if (pose === 'shock_side') {
    // Both hands raised in surprise
    ctx.beginPath();
    ctx.moveTo(-20, 40);
    ctx.quadraticCurveTo(-40, 26, -38, 10);
    ctx.quadraticCurveTo(-28, 8, -26, 24);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20, 40);
    ctx.quadraticCurveTo(40, 26, 38, 10);
    ctx.quadraticCurveTo(28, 8, 26, 24);
    ctx.fill();
    ctx.stroke();
  } else if (pose !== 'cry_desk') {
    // Cut 1 situation action arm: left arm down, right arm extended holding situation prop!
    ctx.beginPath();
    ctx.moveTo(-22, 38);
    ctx.quadraticCurveTo(-34, 64, -31, 88);
    ctx.quadraticCurveTo(-40, 94, -34, 101);
    ctx.quadraticCurveTo(-25, 104, -20, 92);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(21, 38);
    ctx.quadraticCurveTo(45, 44, 56, 32);
    ctx.quadraticCurveTo(64, 30, 62, 41);
    ctx.quadraticCurveTo(48, 56, 22, 54);
    ctx.fill();
    ctx.stroke();
  }

  // Central Torso + Legs
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-21, 34);
  ctx.quadraticCurveTo(-25, 74, -23, 112);
  ctx.lineTo(-18, 126);
  ctx.quadraticCurveTo(-14, 128, -11, 110);
  ctx.quadraticCurveTo(0, 108, 11, 110);
  ctx.quadraticCurveTo(14, 128, 18, 126);
  ctx.lineTo(23, 112);
  ctx.quadraticCurveTo(25, 74, 21, 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Situation Outfit Overlay on Upper Torso (y = 35..88)
  ctx.save();
  ctx.fillStyle = shirtColor;

  if (outfit === 'gym_tank') {
    // Sporty tank top with deep scoop neckline
    ctx.beginPath();
    ctx.moveTo(-21, 44);
    ctx.quadraticCurveTo(-24, 64, -23, 86);
    ctx.lineTo(23, 86);
    ctx.quadraticCurveTo(24, 64, 21, 44);
    ctx.quadraticCurveTo(0, 56, -21, 44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Whistle if gym coach
    if (cfg.type === 'gym_coach') {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, 42);
      ctx.quadraticCurveTo(0, 64, 0, 68);
      ctx.quadraticCurveTo(0, 64, 10, 42);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      roundRect(ctx, -5, 68, 10, 8, 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (outfit === 'doctor_coat') {
    // Doctor white coat with blue scrub
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-14, 36);
    ctx.lineTo(14, 36);
    ctx.lineTo(14, 86);
    ctx.lineTo(-14, 86);
    ctx.closePath();
    ctx.fill();
    // White coat flaps
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-21, 35);
    ctx.lineTo(-8, 35);
    ctx.lineTo(-12, 86);
    ctx.lineTo(-23, 86);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(21, 35);
    ctx.lineTo(8, 35);
    ctx.lineTo(12, 86);
    ctx.lineTo(23, 86);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Stethoscope
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-16, 38);
    ctx.quadraticCurveTo(-12, 68, 0, 72);
    ctx.quadraticCurveTo(12, 68, 16, 38);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 72, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (outfit === 'office_shirt') {
    // Collared office shirt with tie
    ctx.beginPath();
    ctx.moveTo(-21, 35);
    ctx.quadraticCurveTo(-24, 62, -23, 86);
    ctx.lineTo(23, 86);
    ctx.quadraticCurveTo(24, 62, 21, 35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Necktie
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(-4, 38);
    ctx.lineTo(4, 38);
    ctx.lineTo(6, 74);
    ctx.lineTo(0, 82);
    ctx.lineTo(-6, 74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (outfit === 'apron') {
    // Bib apron with pocket
    ctx.beginPath();
    ctx.moveTo(-16, 40);
    ctx.lineTo(16, 40);
    ctx.lineTo(20, 86);
    ctx.lineTo(-20, 86);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, -10, 62, 20, 16, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
  } else if (outfit === 'winter_coat') {
    // Thick winter coat with scarf
    ctx.beginPath();
    ctx.moveTo(-21, 35);
    ctx.quadraticCurveTo(-24, 62, -23, 86);
    ctx.lineTo(23, 86);
    ctx.quadraticCurveTo(24, 62, 21, 35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Warm scarf
    roundRect(ctx, -22, 34, 44, 16, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
  } else {
    // Default home_tee or hoodie
    ctx.beginPath();
    ctx.moveTo(-21, 35);
    ctx.quadraticCurveTo(-24, 62, -23, 86);
    ctx.lineTo(23, 86);
    ctx.quadraticCurveTo(24, 62, 21, 35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (outfit === 'home_tee') {
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-21, 56);
      ctx.lineTo(21, 56);
      ctx.moveTo(-22, 70);
      ctx.lineTo(22, 70);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Handheld small prop in Mochi's right hand (at x=58, y=32) for Cut 1
  if (pose === 'remote') {
    ctx.save();
    ctx.translate(60, 24);
    ctx.rotate(-0.25);
    roundRect(ctx, -9, -16, 18, 32, 4);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-5, -11, 10, 8);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (pose === 'dumbbell') {
    ctx.save();
    ctx.translate(60, 28);
    ctx.rotate(-0.3);
    ctx.fillStyle = '#fb7185';
    roundRect(ctx, -16, -5, 32, 10, 3);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, -20, -12, 9, 24, 3);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, 11, -12, 9, 24, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (pose === 'chicken') {
    ctx.save();
    ctx.translate(62, 24);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(0, -6, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fef3c7';
    roundRect(ctx, -3, 2, 6, 14, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (pose === 'cup') {
    // Paper cup pouring kibble pellets
    ctx.save();
    ctx.translate(62, 26);
    ctx.rotate(0.65);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(10, -12);
    ctx.lineTo(7, 12);
    ctx.lineTo(-7, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // Falling brown kibble dots
    ctx.fillStyle = '#92400e';
    [[74, 42], [78, 54], [72, 64]].forEach(([kx, ky]) => {
      ctx.beginPath();
      ctx.arc(kx, ky, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (pose === 'tape') {
    // Yellow tape measure
    ctx.save();
    ctx.translate(60, 28);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(8, -3, 18, 6);
    ctx.strokeRect(8, -3, 18, 6);
    ctx.restore();
  } else if (pose === 'wheel') {
    // Steering wheel
    ctx.save();
    ctx.translate(54, 34);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 16);
    ctx.stroke();
    ctx.restore();
  } else if (pose === 'salad') {
    // Fresh green salad bowl with fork
    ctx.save();
    ctx.translate(56, 30);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, 4, 16, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-4, -2, 5, 0, Math.PI * 2);
    ctx.arc(4, -1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (pose === 'car_key') {
    // Modern car smart key
    ctx.save();
    ctx.translate(60, 26);
    roundRect(ctx, -8, -14, 16, 28, 4);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 16, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // --- 3. Squishy White Mochi Face + Seamless Side Ear + Bangs ---
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-54, 8);
  ctx.bezierCurveTo(-56, 32, -28, 42, -2, 42);
  ctx.bezierCurveTo(24, 42, 46, 34, 48, 14);
  ctx.bezierCurveTo(64, 14, 64, -12, 46, -10);
  ctx.quadraticCurveTo(26, -16, 8, -32);
  ctx.quadraticCurveTo(8, -14, -6, -8);
  ctx.quadraticCurveTo(-16, -14, -16, -30);
  ctx.quadraticCurveTo(-36, -20, -54, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hair part lines
  ctx.beginPath();
  ctx.moveTo(-16, -30);
  ctx.quadraticCurveTo(-15, -36, -12, -40);
  ctx.moveTo(8, -32);
  ctx.quadraticCurveTo(10, -37, 13, -40);
  ctx.moveTo(32, -16);
  ctx.quadraticCurveTo(36, -21, 39, -26);
  ctx.stroke();

  // Inner ear mark
  ctx.beginPath();
  ctx.moveTo(47, 2);
  ctx.lineTo(53, 3);
  ctx.stroke();

  // Dynamic Headband / Sweatband / Ribbon
  if (headwear === 'sweatband') {
    ctx.save();
    ctx.fillStyle = headwearColor;
    roundRect(ctx, -48, -22, 92, 10, 4);
    ctx.fill();
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = ink;
    ctx.stroke();
    // Sporty white stripe
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-44, -17);
    ctx.lineTo(40, -17);
    ctx.stroke();
    ctx.restore();
  } else if (headwear === 'ribbon') {
    // Cute Ribbon Bow
    ctx.save();
    ctx.translate(28, -44);
    ctx.fillStyle = headwearColor;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, -10);
    ctx.lineTo(-14, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(14, -10);
    ctx.lineTo(14, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // --- 4. Soft Pink Cheek Blushes ---
  ctx.fillStyle = '#f9a89a';
  ctx.beginPath();
  ctx.ellipse(-32, 14, 9.5, 4.6, 0, 0, Math.PI * 2);
  ctx.ellipse(18, 14, 9.5, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- 5. Facial Expression ---
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;

  if (isMentor || pose === 'pointer') {
    if (cfg.glasses !== false) {
      // Intellectual Glasses Mentor (tax_pro, vet_doc, senior_pro, interior_pro, telecom_pro)
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(-36, -15);
      ctx.lineTo(-16, -11);
      ctx.moveTo(6, -11);
      ctx.lineTo(26, -15);
      ctx.stroke();

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

      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.ellipse(-4, 17, 6.5, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Energetic Athletic Gym Coach without glasses
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(-36, -14);
      ctx.lineTo(-14, -8);
      ctx.moveTo(26, -14);
      ctx.lineTo(4, -8);
      ctx.stroke();

      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(-23, 1, 4.5, 0, Math.PI * 2);
      ctx.arc(14, 1, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-24, -1, 1.6, 0, Math.PI * 2);
      ctx.arc(13, -1, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Confident wide coach grin
      ctx.fillStyle = '#ef4444';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(-12, 12);
      ctx.lineTo(6, 12);
      ctx.bezierCurveTo(7, 26, -13, 26, -12, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (pose === 'cry_desk' || pose === 'shock_side') {
    // Crying / Shocked Expression
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-36, -9);
    ctx.quadraticCurveTo(-26, -16, -16, -13);
    ctx.moveTo(6, -13);
    ctx.quadraticCurveTo(16, -16, 26, -9);
    ctx.stroke();

    if (pose === 'cry_desk') {
      ctx.fillStyle = '#38bdf8';
      roundRect(ctx, -30, 4, 9.5, 34, 4.5);
      ctx.fill();
      roundRect(ctx, 11, 4, 9.5, 34, 4.5);
      ctx.fill();
    }

    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-32, -2);
    ctx.lineTo(-20, 3);
    ctx.lineTo(-32, 8);
    ctx.moveTo(22, -2);
    ctx.lineTo(10, 3);
    ctx.lineTo(22, 8);
    ctx.stroke();

    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.ellipse(-4, 18, 8.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (pose === 'cry_desk') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-43, 26, 10.5, 14.5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(35, 26, 10.5, 14.5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (pose === 'cheer_phone') {
    // Happy '^ ^' eyes + wide smile
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
  } else {
    // Signature Innocent Mochi Eyes (3 upper eyelashes + hollow oval pupil)
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-36, -12);
    ctx.quadraticCurveTo(-26, -16, -16, -12);
    ctx.moveTo(6, -12);
    ctx.quadraticCurveTo(16, -16, 26, -12);
    ctx.stroke();

    [-25, 15].forEach(ex => {
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(ex - 9, -2);
      ctx.quadraticCurveTo(ex, -6, ex + 9, -2);
      ctx.stroke();

      // Draw 3 cute flutter eyelashes only if female
      if (gender === 'female') {
        ctx.lineWidth = 2.4;
        [-5, 0, 5].forEach(dx => {
          ctx.beginPath();
          ctx.moveTo(ex + dx, -4);
          ctx.lineTo(ex + dx * 1.25, -8.5);
          ctx.stroke();
        });
      }

      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(ex, 3, 2.8, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.lineTo(2, 12);
    ctx.bezierCurveTo(3, 21, -9, 21, -8, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Helper: Draw Situation-Specific Props, Appliances, Pets, Cars, Whiteboards & Crisis/Resolution Scenes
 */
function drawSituationObject(ctx, ox, oy, s, calcKey, slug, cutNum) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(s, s);
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 3.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const slugStr = String(slug || '');

  if (cutNum === 1) {
    // --- CUT 1: Everyday / Naive Action Object ---
    if (calcKey === 'electric') {
      if (slugStr.includes('dryer')) {
        roundRect(ctx, -50, -54, 100, 112, 10);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 8, 28, 0, Math.PI * 2);
        ctx.fillStyle = '#bae6fd';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.arc(-6, 12, 12, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('열풍 건조기', 0, -32);
      } else if (slugStr.includes('dehumidifier')) {
        roundRect(ctx, -44, -48, 88, 106, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        roundRect(ctx, -30, 6, 60, 38, 6);
        ctx.fillStyle = '#7dd3fc';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('24h 제습기💧', 0, -22);
      } else if (slugStr.includes('heater')) {
        roundRect(ctx, -48, -44, 96, 98, 12);
        ctx.fillStyle = '#fee2e2';
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4.5;
        [-12, 2, 16].forEach(ry => {
          ctx.beginPath();
          ctx.moveTo(-26, ry);
          ctx.lineTo(26, ry);
          ctx.stroke();
        });
        ctx.fillStyle = '#dc2626';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('전기온풍기🔥', 0, -26);
      } else {
        roundRect(ctx, -62, -68, 124, 46, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-50, -32);
        ctx.lineTo(50, -32);
        ctx.stroke();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3.2;
        [-28, 0, 28].forEach(wx => {
          ctx.beginPath();
          ctx.moveTo(wx, -14);
          ctx.quadraticCurveTo(wx - 10, 6, wx, 24);
          ctx.quadraticCurveTo(wx + 10, 42, wx - 4, 58);
          ctx.stroke();
        });
        ctx.fillStyle = '#111111';
        ctx.font = '700 19px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('구형 에어컨❄️', 0, -44);
      }
    } else if (calcKey === 'diet') {
      if (slugStr.includes('bulkup')) {
        roundRect(ctx, -56, -12, 112, 68, 8);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#dc2626';
        ctx.font = '700 21px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('야식 치킨🍗', 0, 26);
      } else {
        roundRect(ctx, -58, -46, 116, 104, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        roundRect(ctx, -48, -38, 96, 28, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('편의점 단품', 0, -20);
        ctx.fillStyle = '#111111';
        ctx.font = '700 21px "Gaegu", sans-serif';
        ctx.fillText('1팩 2,900원', 0, 12);
        ctx.fillStyle = '#64748b';
        ctx.font = '700 17px "Gaegu", sans-serif';
        ctx.fillText('(식비 폭탄💦)', 0, 38);
      }
    } else if (calcKey === 'pet') {
      const isCat = slugStr.includes('cat') || slugStr.includes('shorthair');
      ctx.fillStyle = isCat ? '#fed7aa' : '#ffffff';
      ctx.beginPath();
      ctx.ellipse(10, -2, 30, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (isCat) {
        ctx.beginPath();
        ctx.moveTo(-14, -18);
        ctx.lineTo(-22, -40);
        ctx.lineTo(-2, -24);
        ctx.moveTo(34, -18);
        ctx.lineTo(42, -40);
        ctx.lineTo(22, -24);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(-18, -2, 9, 18, 0.3, 0, Math.PI * 2);
        ctx.ellipse(38, -2, 9, 18, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(0, -4, 3.2, 0, Math.PI * 2);
      ctx.arc(20, -4, 3.2, 0, Math.PI * 2);
      ctx.arc(10, 4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(-22, 42, 22, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.moveTo(-46, 40);
      ctx.lineTo(2, 40);
      ctx.lineTo(-4, 58);
      ctx.lineTo(-40, 58);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (calcKey === 'room') {
      roundRect(ctx, -52, -2, 104, 62, 6);
      ctx.fillStyle = '#fcd34d';
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, -42, -52, 84, 50, 6);
      ctx.fillStyle = '#fde68a';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.font = '700 19px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('이사박스📦', 0, -22);
      ctx.fillText('가전·가구?', 0, 32);
    } else if (calcKey === 'auto') {
      // Cute Hand-Drawn New Car Front (text in upper windshield so headlights never overlap!)
      roundRect(ctx, -44, -42, 88, 38, 12);
      ctx.fillStyle = '#e0f2fe';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('신차 할부🚗', 0, -19);

      roundRect(ctx, -58, -8, 116, 46, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-38, 15, 9, 0, Math.PI * 2);
      ctx.arc(38, 15, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, -20, 8, 40, 16, 4);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      ctx.stroke();
    } else {
      roundRect(ctx, -54, -38, 108, 86, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, -54, -38, 108, 26, 8);
      ctx.fillStyle = '#a78bfa';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('약정 달력📅', 0, -20);
      ctx.font = '700 20px "Gaegu", sans-serif';
      ctx.fillText('위약금 무서워', 0, 12);
      ctx.fillText('그냥 쓰자..', 0, 34);
    }
  } else if (cutNum === 2) {
    // --- CUT 2: Wider Situation Whiteboard / Fact-Check Diagram on Right ---
    roundRect(ctx, -68, -56, 136, 114, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();

    roundRect(ctx, -60, -50, 120, 26, 6);
    ctx.fillStyle = '#fee2e2';
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.font = '700 18px "Gaegu", sans-serif';
    ctx.textAlign = 'center';

    if (calcKey === 'electric') {
      ctx.fillText('누진세 3단계📈', 0, -33);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(-42, 22, 22, 24);
      ctx.strokeRect(-42, 22, 22, 24);
      ctx.fillStyle = '#f87171';
      ctx.fillRect(-11, 2, 22, 44);
      ctx.strokeRect(-11, 2, 22, 44);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(20, -22, 22, 68);
      ctx.strokeRect(20, -22, 22, 68);
    } else if (calcKey === 'diet') {
      ctx.fillText('식비 단가 비교📊', 0, -33);
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.fillText('❌ 낱개 2,900원', 0, 0);
      ctx.fillStyle = '#047857';
      ctx.fillText('⭕ 벌크 1,100원', 0, 28);
    } else if (calcKey === 'pet') {
      ctx.fillText('수의학 정량표⚖️', 0, -33);
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.fillText('❌ 눈대중 과급여', 0, 0);
      ctx.fillStyle = '#047857';
      ctx.fillText('⭕ 1g 저울 급여', 0, 28);
    } else if (calcKey === 'room') {
      ctx.fillText('황금배분 공식📐', 0, -33);
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.fillText('❌ 단품 초과구매', 0, 0);
      ctx.fillStyle = '#047857';
      ctx.fillText('⭕ 예산 맞춤배분', 0, 28);
    } else if (calcKey === 'auto') {
      ctx.fillText('4년 총비용 비교🚗', 0, -33);
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.fillText('❌ 할부+세금폭탄', 0, 0);
      ctx.fillStyle = '#047857';
      ctx.fillText('⭕ 특판·절세완승', 0, 28);
    } else {
      ctx.fillText('환승 순익 공식💵', 0, -33);
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.fillText('사은품 47만원', 0, 0);
      ctx.fillStyle = '#047857';
      ctx.fillText('위약금 빼도 이득!', 0, 28);
    }
  } else if (cutNum === 3) {
    // --- CUT 3: Distinct Situation Crisis Object on Right ---
    if (calcKey === 'electric') {
      // Red Electricity Bill Envelope + Lightning
      roundRect(ctx, -64, -44, 128, 88, 8);
      ctx.fillStyle = '#fff1f2';
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, -56, -36, 112, 26, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ 전기요금 고지서', 0, -18);
      ctx.fillStyle = '#be123c';
      ctx.font = '700 20px "Gaegu", sans-serif';
      ctx.fillText('누진 3단계 폭탄!', 0, 18);
    } else if (calcKey === 'diet') {
      // Long Convenience Store Receipt + Empty Wallet with Flying Moth
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-48, -56);
      ctx.lineTo(48, -56);
      ctx.lineTo(42, 48);
      ctx.lineTo(-42, 48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#be123c';
      ctx.font = '700 19px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🧾 편의점 영수증', 0, -28);
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.fillText('낱개 구매 파산💸', 0, 2);
      ctx.fillText('텅장 주의보..', 0, 26);
    } else if (calcKey === 'pet') {
      // Animal Hospital Vet Chart + Chubby Pet on Scale
      roundRect(ctx, -62, -46, 124, 92, 10);
      ctx.fillStyle = '#fff1f2';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#be123c';
      ctx.font = '700 19px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏥 동물병원 차트', 0, -18);
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.fillText('과급여 비만·관절', 0, 8);
      ctx.fillText('수술비 주의보💦', 0, 30);
    } else if (calcKey === 'room') {
      // Overflowing Red Shopping Cart
      roundRect(ctx, -60, -34, 120, 68, 8);
      ctx.fillStyle = '#fee2e2';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(-32, 44, 9, 0, Math.PI * 2);
      ctx.arc(32, 44, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#be123c';
      ctx.font = '700 19px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛒 장바구니 초과!', 0, -8);
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.fillText('단품 거품 폭탄🚨', 0, 18);
    } else if (calcKey === 'auto') {
      // Giant Black 100t Tax + Insurance Iron Weight Bomb
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, 8, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(28, -32, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.font = '700 19px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('세금+보험💣', 0, 4);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 17px "Gaegu", sans-serif';
      ctx.fillText('할부이자 폭탄!', 0, 26);
    } else {
      // Winged Cash Bills Flying Away
      roundRect(ctx, -56, -24, 112, 56, 8);
      ctx.fillStyle = '#dcfce7';
      ctx.fill();
      ctx.stroke();
      // White wings
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-62, -16, 16, 9, -0.4, 0, Math.PI * 2);
      ctx.ellipse(62, -16, 16, 9, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#be123c';
      ctx.font = '700 19px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💸 날아간 47만원', 0, 0);
      ctx.fillStyle = '#111111';
      ctx.font = '700 17px "Gaegu", sans-serif';
      ctx.fillText('가만히 있으면 0원', 0, 22);
    }
  } else if (cutNum === 4) {
    // --- CUT 4: Wide, Clean Happy Resolution Object on Right ---
    if (calcKey === 'electric') {
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.ellipse(0, 12, 58, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -24, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('전기세 세이브🐷', 0, 17);
    } else if (calcKey === 'diet') {
      roundRect(ctx, -58, 10, 116, 34, 8);
      ctx.fillStyle = '#bbf7d0';
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, -52, -24, 104, 34, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('득근 밀프렙💪', 0, -2);
      ctx.fillText('식비 반값 성공!', 0, 31);
    } else if (calcKey === 'pet') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fb7185';
      ctx.font = '700 20px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🐶❤️🐱', 0, 6);
      roundRect(ctx, -58, 28, 116, 28, 8);
      ctx.fillStyle = '#a7f3d0';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.font = '700 17.5px "Gaegu", sans-serif';
      ctx.fillText('1g 정량배식 OK', 0, 46);
    } else if (calcKey === 'room') {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-26, 6);
      ctx.lineTo(26, 6);
      ctx.lineTo(16, -32);
      ctx.lineTo(-16, -32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, -56, 16, 112, 34, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('워너비 내방✨', 0, 38);
    } else if (calcKey === 'auto') {
      roundRect(ctx, -58, -10, 116, 48, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(-14, -16, 14, 8, -0.3, 0, Math.PI * 2);
      ctx.ellipse(14, -16, 14, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('최저가 출고🎀', 0, 19);
    } else {
      roundRect(ctx, -58, -18, 116, 64, 8);
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.font = '700 19px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('당일 현금입금💵', 0, 6);
      ctx.fillStyle = '#dc2626';
      ctx.fillText('+47만원 완료!', 0, 30);
    }
  }

  ctx.restore();
}

/**
 * 4. Master Hand-Drawn Scene Composer (Consistent Mochi Protagonist + Situation-Adaptive Drawings!)
 */
function drawHumanInstatoonCharacter(ctx, cx, cy, calcKey, cutNum, s = 1, slug = '') {
  const pS = s / 1.06;
  const px = cx - 251 * pS;
  const py = cy - 328 * pS;

  const charCfg = getCharacterConfigForPreset(slug, calcKey);

  if (cutNum === 1) {
    // Cut 1: Protagonist Mochi on left interacting with Situation Prop on right
    const poseByCat = {
      electric: 'remote',
      diet: 'dumbbell',
      pet: 'cup',
      room: 'tape',
      auto: 'car_key',
      telecom: 'remote'
    };
    drawMochiFigure(ctx, px + 184 * pS, py + 336 * pS, pS * 1.02, {
      role: 'hero',
      calcKey,
      slug,
      pose: (charCfg.hero && charCfg.hero.pose1) || poseByCat[calcKey] || 'remote'
    });
    drawSituationObject(ctx, px + 382 * pS, py + 372 * pS, pS * 0.96, calcKey, slug, 1);
  } else if (cutNum === 2) {
    // Cut 2: Coaching Scene! Surprised Hero Mochi (left) + Pro Mentor (center) + Whiteboard (right)
    drawMochiFigure(ctx, px + 90 * pS, py + 368 * pS, pS * 0.72, {
      role: 'hero',
      calcKey,
      slug,
      pose: 'shock_side'
    });
    drawMochiFigure(ctx, px + 228 * pS, py + 338 * pS, pS * 0.94, {
      role: 'mentor',
      calcKey,
      slug,
      pose: 'pointer'
    });
    drawSituationObject(ctx, px + 404 * pS, py + 366 * pS, pS * 0.92, calcKey, slug, 2);
  } else if (cutNum === 3) {
    // Cut 3: Crisis Scene! Gloom lines + Hero crying + Category-Specific Crisis Object on Right
    ctx.save();
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.28)';
    ctx.lineWidth = 2.5 * pS;
    for (let gx = 24; gx < 480; gx += 18) {
      ctx.beginPath();
      ctx.moveTo(px + gx * pS, py + 200 * pS);
      ctx.lineTo(px + gx * pS, py + (235 + (gx % 3) * 12) * pS);
      ctx.stroke();
    }
    ctx.restore();

    drawMochiFigure(ctx, px + 188 * pS, py + 334 * pS, pS * 1.02, {
      role: 'hero',
      calcKey,
      slug,
      pose: 'cry_desk'
    });
    drawSituationObject(ctx, px + 378 * pS, py + 376 * pS, pS * 0.96, calcKey, slug, 3);
  } else {
    // Cut 4: Resolution Scene! Sparkles + Cheering Hero Mochi with Smartphone + Happy Situation Prop
    ctx.save();
    ctx.fillStyle = '#facc15';
    [[92, 275], [320, 272], [448, 295]].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(px + sx * pS, py + sy * pS, 5.5 * pS, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    drawMochiFigure(ctx, px + 190 * pS, py + 336 * pS, pS * 1.02, {
      role: 'hero',
      calcKey,
      slug,
      pose: 'cheer_phone'
    });
    drawSituationObject(ctx, px + 382 * pS, py + 372 * pS, pS * 0.96, calcKey, slug, 4);
  }
}

function getQuadrantWallColor(calcKey, quadIdx) {
  if (quadIdx === 0) return '#fcf6e4';
  if (quadIdx === 1) return '#d5eaf8';
  if (quadIdx === 3) return '#fef1a8';
  const q2Colors = {
    electric: '#cfead9',
    diet: '#eadcf8',
    pet: '#fce8dc',
    room: '#f9ebe0',
    auto: '#f4f5ef',
    telecom: '#fcf9f2'
  };
  return q2Colors[calcKey] || '#fcf6e4';
}

function drawAnimalSceneQuadrant(ctx, img, calcKey, quadIdx, flipX, zoom, x, y, w, h, r, s = 1) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();

  const wallColor = getQuadrantWallColor(calcKey, quadIdx);
  ctx.fillStyle = wallColor;
  ctx.fillRect(x, y, w, h);

  if (img && img.complete && img.naturalWidth > 0) {
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const halfW = Math.floor(W / 2);
    const halfH = Math.floor(H / 2);
    const col = quadIdx % 2;
    const row = Math.floor(quadIdx / 2);

    const padOuter = Math.round(W * 0.012);
    const padInner = Math.round(W * 0.012);

    const baseSx = col === 0 ? padOuter : halfW + padInner;
    const baseSy = row === 0 ? padOuter : halfH + padInner;
    const baseSw = halfW - padOuter - padInner;
    const baseSh = halfH - padOuter - padInner;

    const z = Math.max(1.0, Math.min(1.12, Number(zoom) || 1.0));
    const sw = baseSw / z;
    const sh = baseSh / z;
    const sx = baseSx + (baseSw - sw) * 0.5;
    const sy = baseSy + (baseSh - sh) * 0.88;

    const topShift = Math.round(46 * s);
    const destY = y + topShift;
    const destH = h - topShift;

    ctx.save();
    if (flipX) {
      ctx.translate(x + w, destY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, destH);
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, x, destY, w, destH);
    }
    ctx.restore();

    const blendGrad = ctx.createLinearGradient(x, destY - 2 * s, x, destY + 34 * s);
    blendGrad.addColorStop(0, wallColor);
    blendGrad.addColorStop(0.35, wallColor);
    blendGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = blendGrad;
    ctx.fillRect(x, destY - 4 * s, w, 40 * s);
  }

  ctx.restore();
}

function drawAnimalTopNarration(ctx, cutNum, text, x, y, w, s = 1) {
  const boxH = 30 * s;
  const boxY = y + 6 * s;
  ctx.save();

  let fontSize = 17.0 * s;
  ctx.font = '800 ' + fontSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  while (fontSize > 13 * s && ctx.measureText(text).width > w - 82 * s) {
    fontSize -= 0.5 * s;
    ctx.font = '800 ' + fontSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  }
  const textW = ctx.measureText(text).width;
  const badgeW = 42 * s;
  const boxW = Math.min(w - 18 * s, Math.max(w * 0.82, textW + badgeW + 32 * s));
  const boxX = x + (w - boxW) / 2;

  ctx.shadowColor = 'rgba(41, 37, 36, 0.16)';
  ctx.shadowBlur = 5 * s;
  ctx.shadowOffsetY = 2 * s;

  roundRect(ctx, boxX, boxY, boxW, boxH, 9 * s);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.6 * s;
  ctx.strokeStyle = '#292524';
  ctx.stroke();

  const pillColors = ['#f59e0b', '#0284c7', '#e11d48', '#10b981'];
  roundRect(ctx, boxX + 4 * s, boxY + 4 * s, badgeW, boxH - 8 * s, 6 * s);
  ctx.fillStyle = pillColors[(cutNum - 1) % 4];
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 ' + (13.0 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cutNum + '컷', boxX + 4 * s + badgeW / 2, boxY + boxH / 2 + 0.5 * s);

  ctx.fillStyle = '#1c1917';
  ctx.font = '800 ' + fontSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textCenterX = boxX + badgeW + 6 * s + (boxW - badgeW - 10 * s) / 2;
  ctx.fillText(text, textCenterX, boxY + boxH / 2 + 0.5 * s);
  ctx.restore();
}

function drawMainSpeechBubbleWithTail(ctx, lines, x, y, w, s = 1, speakerSide = 'left', accentColor = '#dc2626', highlightColor = '#fef08a') {
  ctx.save();

  const bx = x + 16 * s;
  const by = y + 40 * s;
  const bw = w - 32 * s;
  const bh = 86 * s;
  const br = 24 * s;

  const tailX = speakerSide === 'right' ? x + w * 0.72 : x + w * 0.28;
  const tailDir = speakerSide === 'right' ? 1 : -1;
  const tailW = 16 * s;
  const tailH = 11 * s;

  ctx.shadowColor = 'rgba(41, 37, 36, 0.16)';
  ctx.shadowBlur = 7 * s;
  ctx.shadowOffsetY = 3 * s;

  ctx.beginPath();
  ctx.moveTo(bx + br, by);
  ctx.lineTo(bx + bw - br, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
  ctx.lineTo(bx + bw, by + bh - br);
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
  ctx.lineTo(tailX + tailW * 0.55, by + bh);
  ctx.lineTo(tailX + tailDir * 5 * s, by + bh + tailH);
  ctx.lineTo(tailX - tailW * 0.55, by + bh);
  ctx.lineTo(bx + br, by + bh);
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
  ctx.lineTo(bx, by + br);
  ctx.quadraticCurveTo(bx, by, bx + br, by);
  ctx.closePath();

  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3.4 * s;
  ctx.strokeStyle = '#292524';
  ctx.stroke();

  const maxAllowedW = bw - 28 * s;
  let baseSize = (lines.length === 1 ? 38 : 31.5) * s;
  const emphRatio = 1.32;

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
    while (baseSize > 21 * s && measureRichLine(rawLine, baseSize) > maxAllowedW) {
      baseSize -= 0.5 * s;
    }
  });

  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const lineSpacing = baseSize * 1.18;
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
        ctx.save();
        ctx.fillStyle = highlightColor;
        roundRect(ctx, curX - 3 * s, baseY - sz * 0.54, segW + 6 * s, sz * 0.60, 6 * s);
        ctx.fill();
        ctx.restore();

        const bounceY = baseY - 1.5 * s;
        ctx.lineWidth = 2.2 * s;
        ctx.strokeStyle = accentColor;
        ctx.lineJoin = 'round';
        ctx.strokeText(seg, curX, bounceY);
        ctx.fillStyle = accentColor;
        ctx.fillText(seg, curX, bounceY);
      } else {
        ctx.lineWidth = 1.1 * s;
        ctx.strokeStyle = '#1c1917';
        ctx.lineJoin = 'round';
        ctx.strokeText(seg, curX, baseY);
        ctx.fillStyle = '#1c1917';
        ctx.fillText(seg, curX, baseY);
      }
      curX += segW;
    });
  });

  ctx.restore();
}

function drawReplySpeechBubble(ctx, replyText, x, y, w, s = 1, mainSpeakerSide = 'left', quadIdx = 0) {
  if (!replyText) return;
  ctx.save();

  let fontSize = 22.5 * s;
  ctx.font = '700 ' + fontSize.toFixed(1) + 'px "Gaegu", "Jua", sans-serif';
  while (fontSize > 16.5 * s && ctx.measureText(replyText).width > w - 68 * s) {
    fontSize -= 0.5 * s;
    ctx.font = '700 ' + fontSize.toFixed(1) + 'px "Gaegu", "Jua", sans-serif';
  }

  const textW = ctx.measureText(replyText).width;
  const bw = Math.min(w - 36 * s, Math.max(180 * s, textW + 30 * s));
  const bh = 32 * s;
  const by = y + 135 * s;
  const replySide = mainSpeakerSide === 'left' ? 'right' : 'left';
  const bx = replySide === 'right'
    ? Math.max(x + 18 * s, x + w - bw - 18 * s)
    : x + 18 * s;
  const br = 16 * s;

  const tailX = replySide === 'right' ? bx + bw * 0.68 : bx + bw * 0.32;
  const tailW = 11 * s;
  const tailH = 7 * s;

  const bgByQuad = ['#fffbeb', '#fef9c3', '#fff1f2', '#ecfdf5'];
  const fillCol = bgByQuad[quadIdx % 4] || '#fef9c3';

  ctx.shadowColor = 'rgba(41, 37, 36, 0.12)';
  ctx.shadowBlur = 4 * s;
  ctx.shadowOffsetY = 2 * s;

  ctx.beginPath();
  ctx.moveTo(bx + br, by);
  ctx.lineTo(bx + bw - br, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
  ctx.lineTo(bx + bw, by + bh - br);
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
  ctx.lineTo(tailX + tailW * 0.5, by + bh);
  ctx.lineTo(tailX, by + bh + tailH);
  ctx.lineTo(tailX - tailW * 0.5, by + bh);
  ctx.lineTo(bx + br, by + bh);
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
  ctx.lineTo(bx, by + br);
  ctx.quadraticCurveTo(bx, by, bx + br, by);
  ctx.closePath();

  ctx.fillStyle = fillCol;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.6 * s;
  ctx.strokeStyle = '#292524';
  ctx.stroke();

  ctx.fillStyle = '#292524';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 0.7 * s;
  ctx.strokeText(replyText, bx + bw / 2, by + bh / 2 + 1 * s);
  ctx.fillText(replyText, bx + bw / 2, by + bh / 2 + 1 * s);

  ctx.restore();
}

const ORIG_BASE_SLUGS = [
  'electric-studio-ac',
  'diet-male-fatloss',
  'pet-maltese-5kg',
  'room-oneroom-100',
  'auto-avante-3000',
  'telecom-penalty-15'
];

const TOP_STRIP_RECEIPT_SLUGS = [
  'pet-maltese-5kg',
  'pet-pomeranian-puppy',
  'electric-stand-ac',
  'electric-dryer',
  'room-minimalist-50',
  'room-appliances-only',
  'room-newlywed-1000',
  'telecom-family-4p'
];

function drawCrisisReceiptMemo(ctx, calcKey, slug, storyObj, flipX, x, y, w, h, s = 1) {
  if (!storyObj) return;
  ctx.save();

  if (calcKey === 'pet' || TOP_STRIP_RECEIPT_SLUGS.includes(slug)) {
    const rx = x + 20 * s;
    const ry = y + 135 * s;
    const rw = w - 40 * s;
    const rh = 48 * s;

    ctx.shadowColor = 'rgba(41, 37, 36, 0.16)';
    ctx.shadowBlur = 5 * s;
    ctx.shadowOffsetY = 2 * s;

    roundRect(ctx, rx, ry, rw, rh, 11 * s);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.8 * s;
    ctx.strokeStyle = '#be123c';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 ' + (15.0 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#be123c';
    ctx.fillText('❌ ' + storyObj.badVal + '   ➔   ✅ ' + storyObj.goodVal, rx + rw / 2, ry + 16 * s);

    ctx.font = '900 ' + (16.0 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#047857';
    ctx.fillText('💰 ' + storyObj.diffVal, rx + rw / 2, ry + 34 * s);
    ctx.restore();
    return;
  }

  const isOrigBase = ORIG_BASE_SLUGS.includes(slug);
  const placeOnRight = isOrigBase ? Boolean(flipX) : true;

  const cardW = 218 * s;
  const cardH = 152 * s;
  const cardX = placeOnRight ? x + w - cardW - 14 * s : x + 14 * s;
  const cardY = y + 214 * s;
  const tilt = placeOnRight ? 0.025 : -0.025;

  ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
  ctx.rotate(tilt);
  ctx.translate(-cardW / 2, -cardH / 2);

  ctx.shadowColor = 'rgba(41, 37, 36, 0.20)';
  ctx.shadowBlur = 8 * s;
  ctx.shadowOffsetY = 4 * s;

  roundRect(ctx, 0, 0, cardW, cardH, 10 * s);
  ctx.fillStyle = '#fffef9';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3.0 * s;
  ctx.strokeStyle = '#292524';
  ctx.stroke();

  roundRect(ctx, 6 * s, 6 * s, cardW - 12 * s, 28 * s, 6 * s);
  ctx.fillStyle = '#292524';
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.font = '900 ' + (14.5 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧾 3초 비교 영수증', cardW / 2, 20 * s);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#dc2626';
  ctx.font = '800 ' + (14 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  ctx.fillText('❌ 그냥 쓸 때', 12 * s, 48 * s);
  ctx.font = '900 ' + (15.5 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  ctx.fillText(String(storyObj.badVal || ''), 12 * s, 67 * s);

  ctx.fillStyle = '#047857';
  ctx.font = '800 ' + (14 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  ctx.fillText('✅ 바꿨을 때', 12 * s, 90 * s);
  ctx.font = '900 ' + (15.5 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  ctx.fillText(String(storyObj.goodVal || ''), 12 * s, 109 * s);

  roundRect(ctx, 8 * s, 120 * s, cardW - 16 * s, 25 * s, 6 * s);
  ctx.fillStyle = '#fef08a';
  ctx.fill();
  ctx.lineWidth = 1.8 * s;
  ctx.strokeStyle = '#292524';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#be123c';
  ctx.font = '900 ' + (14 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
  ctx.fillText('🔥 ' + String(storyObj.diffVal || ''), cardW / 2, 133 * s);

  ctx.restore();
}

function getConversationalScript(calcKey, storyObj) {
  const sc = (storyObj && storyObj.shortCartoon) || {
    epTitle: preset.title,
    patternIdx: 0,
    quadOrder: [0, 1, 2, 3],
    flipMask: [false, false, false, false],
    zoomMask: [1.0, 1.0, 1.0, 1.0],
    speakerSide: ['left', 'left', 'right', 'right'],
    narrations: [
      '자취 1년차 쿼카찌만의 눈물겨운 에어컨 절약법',
      '방에 놀러 온 민트후드 여우 선배가 리모컨을 뺏었다',
      '한 달 뒤 우편함에 꽂힌 원룸 전기요금 고지서',
      '내 방 에어컨이 정속형인지 인버터인지 헷갈릴 땐?'
    ],
    p1: ['에어컨 아낀다고', '**2시간마다 껐다 켰지~**'],
    p2: ['구형 정속형 껐다 켜면', '**기동전력 폭탄** 맞아!!'],
    p3: ['으앙 **월 8만8천원**?!', '인버터는 **3만원대**인데!'],
    p4: ['소비전력 W수 넣으니까', '**3초 만에 요금 비교** 끝!'],
    replies: [
      '시원해지면 끄고 더우면 다시 ON! 뿌듯✨',
      '에엥?! 아끼려고 끈 건데 더 나온다고요?! 😱',
      '아낀 줄 알았는데 매달 치킨 3마리 증발 😭',
      '프로필 링크에서 내 방 전기세 미리 찍어봐요 ⚡'
    ]
  };

  return {
    episodeTitle: sc.epTitle || preset.title,
    patternIdx: sc.patternIdx || 0,
    quadOrder: sc.quadOrder || [0, 1, 2, 3],
    flipMask: sc.flipMask || [false, false, false, false],
    zoomMask: sc.zoomMask || [1.0, 1.0, 1.0, 1.0],
    speakerSide: sc.speakerSide || ['left', 'left', 'right', 'right'],
    narrations: sc.narrations || [],
    p1Lines: sc.p1,
    p2Lines: sc.p2,
    p3Lines: sc.p3,
    p4Lines: sc.p4,
    replies: sc.replies || []
  };
}

function drawPanel(ctx, num, x, y, w, h, isFullSlide) {
  const s = isFullSlide ? w / 502 : 1;
  const panelRadius = isFullSlide ? 0 : Math.round(12 * s);
  const conv = getConversationalScript(preset.calcKey, story);
  const panelIdx = num - 1;
  const slug = preset.slug || preset.id || '';

  const quadIdx = (conv.quadOrder && conv.quadOrder[panelIdx] !== undefined) ? conv.quadOrder[panelIdx] : panelIdx;
  const isOrigBase = ORIG_BASE_SLUGS.includes(slug);
  const flipX = isOrigBase ? Boolean(conv.flipMask && conv.flipMask[panelIdx]) : false;
  const zoom = (conv.zoomMask && conv.zoomMask[panelIdx]) || 1.0;
  const speakerSide = (conv.speakerSide && conv.speakerSide[panelIdx]) || (flipX ? 'right' : 'left');

  const artImg = document.getElementById('art-img');

  // 1. @moneyfit2026 Animal Character Scene Quadrant with Dynamic Placement (quadIdx, flipX, zoom)
  drawAnimalSceneQuadrant(ctx, artImg, preset.calcKey, quadIdx, flipX, zoom, x, y, w, h, panelRadius, s);

  // 2. Top Story Narration Strip
  const narrationText = (conv.narrations && conv.narrations[panelIdx]) || conv.episodeTitle;
  drawAnimalTopNarration(ctx, num, narrationText, x, y, w, s);

  // 3. Main Speech Bubble with Tail + Dynamic Word-Size Contrast ("글자 강약!")
  const linesByNum = [conv.p1Lines, conv.p2Lines, conv.p3Lines, conv.p4Lines][panelIdx] || conv.p1Lines;
  const accentByQuad = ['#1d4ed8', '#dc2626', '#be123c', '#047857'][quadIdx % 4];
  const hlByQuad = ['#fef08a', '#fecdd3', '#fde047', '#bbf7d0'][quadIdx % 4];
  drawMainSpeechBubbleWithTail(ctx, linesByNum, x, y, w, s, speakerSide, accentByQuad, hlByQuad);

  // 4. Secondary Conversational Ping-Pong Reply Bubble OR Crisis Receipt Strip
  const replyText = (conv.replies && conv.replies[panelIdx]) || '';
  const useTopStripReceipt = quadIdx === 2 && (preset.calcKey === 'pet' || TOP_STRIP_RECEIPT_SLUGS.includes(slug));
  if (useTopStripReceipt) {
    drawCrisisReceiptMemo(ctx, preset.calcKey, slug, story, flipX, x, y, w, h, s);
  } else {
    drawReplySpeechBubble(ctx, replyText, x, y, w, s, speakerSide, quadIdx);
    if (quadIdx === 2) {
      drawCrisisReceiptMemo(ctx, preset.calcKey, slug, story, flipX, x, y, w, h, s);
    }
  }

  // 5. Crisp Comic Panel Frame (in 2x2 grid mode)
  if (!isFullSlide) {
    ctx.save();
    roundRect(ctx, x, y, w, h, panelRadius);
    ctx.lineWidth = 4.2 * s;
    ctx.strokeStyle = '#292524';
    ctx.stroke();
    ctx.restore();
  }
}

function renderAll() {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const conv = getConversationalScript(preset.calcKey, story);

  if (mode === 'grid') {
    ctx.fillStyle = '#faf6f0';
    ctx.fillRect(0, 0, 1080, 1080);

    // Top Episode Pill + Handwritten/Bold Title
    ctx.save();
    roundRect(ctx, 28, 13, 150, 36, 18);
    ctx.fillStyle = '#292524';
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.font = '800 16.5px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐾 머니핏 동물툰', 103, 31);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#1c1917';
    let titleFs = 27;
    ctx.font = '900 ' + titleFs + 'px "Pretendard", "Malgun Gothic", sans-serif';
    while (titleFs > 20 && ctx.measureText(conv.episodeTitle).width > 700) {
      titleFs -= 1;
      ctx.font = '900 ' + titleFs + 'px "Pretendard", "Malgun Gothic", sans-serif';
    }
    ctx.fillText(conv.episodeTitle, 190, 41, 700);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#57534e';
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
    ctx.fillStyle = '#292524';
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

  if (!options.copyOnly && chromePath) {
    const { renderTotoEpisodeForSlug } = require('./toto-style-webtoon-engine.js');
    await renderTotoEpisodeForSlug(preset.slug, { skipExisting: Boolean(options.skipExisting) });
  } else if (fs.existsSync(gridPngPath) && !fs.existsSync(publicGridPngPath)) {
    fs.copyFileSync(gridPngPath, publicGridPngPath);
  }

  const omniChannelKitMd = buildOmniChannelKitMd(preset, bundle, cfg.siteUrl);

  // Write copy files
  fs.writeFileSync(path.join(outDir, 'threads_main.txt'), bundle.threadsMain + '\n', 'utf8');
  fs.writeFileSync(path.join(outDir, 'threads_reply.txt'), bundle.threadsReply + '\n', 'utf8');
  fs.writeFileSync(path.join(outDir, 'instagram_caption.txt'), bundle.instagramCaption + '\n', 'utf8');
  fs.writeFileSync(path.join(outDir, 'facebook_post.txt'), bundle.facebookPost + '\n', 'utf8');
  fs.writeFileSync(path.join(outDir, 'omni_channel_kit.md'), omniChannelKitMd + '\n', 'utf8');
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
        facebookPost: bundle.facebookPost,
        omniChannelKitPath: path.join(outDir, 'omni_channel_kit.md')
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
    `머니핏(MoneyFit) | 3초 생활·금융 본전 영수증툰 (@moneyfit2026)`,
    ``,
    `[소개글 (Bio) — 인스타 · 쓰레드 · 페북 팔로워 전환 3줄 공식]`,
    `🧾 팔로우만 해도 매달 숨은 고정비 30만 원 아끼는 4컷 영수증 툰`,
    `⚡전기세 · 🚗신차할부/렌트 · 🌐인터넷 성지 · 🥗식단 · 🐾사료 · 🛋️자취예산`,
    `👇 회원가입 0원! 내 조건 3초 본전 계산기 바로가기`,
    ``,
    `[프로필 상단 고정 게시물 3종 (Pinned 3 Posts — 팔로우 전환율 극대화)]`,
    `📌 고정 1번 (전국민 생활비 충격): electric-studio-ac (원룸 에어컨 구형 vs 인버터 전기세 폭탄 비교툰)`,
    `📌 고정 2번 (고가 지출 손익 분기): auto-avante-3000 (사회초년생 첫차 할부 vs 장기렌트 총비용 영수증)`,
    `📌 고정 3번 (즉시 현금 방어): telecom-penalty-15 (인터넷 약정 위약금 vs 현금 사은품 47만 원 손익 계산)`,
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
  const copyOnly = args.includes('--copy-only');

  (async () => {
    if (genBrand) {
      const b = generateBrandAssets();
      console.log(`✓ Generated Official Brand Profile Avatar & Cover in ${path.dirname(b.avatarPath)}`);
    }
    if (genAll36) {
      for (let i = 0; i < PRESETS.length; i += 2) {
        const batch = PRESETS.slice(i, i + 2);
        const results = await Promise.all(
          batch.map(p => generateWebtoonPack({ slug: p.id, sendTelegram: false, skipExisting, copyOnly }))
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
        const r = await generateWebtoonPack({ slug: s, sendTelegram: false, skipExisting, copyOnly });
        console.log(`✓ Generated Top Webtoon Pack: [${r.keyword}] (${r.slug})`);
      }
    } else {
      const res = await generateWebtoonPack({ slug, sendTelegram, skipExisting, copyOnly });
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
