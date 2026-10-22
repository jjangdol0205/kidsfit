#!/usr/bin/env node
/**
 * scripts/send_daily_6am_insta_threads.js
 * Daily 06:00 AM KST (@kids_fit1) Instagram Carousel + Threads 4-Cut Grid Auto-Sender for Telegram.
 *
 * Designed around the user's exact live workflow on:
 * - Threads: https://www.threads.com/@kids_fit1 (1 Square 2x2 4-Cut Grid image + Post #1 <430 chars + Self-Reply #2 with truthofmarket.com link)
 * - Instagram: https://www.instagram.com/kids_fit1 (5-Slide Square Carousel: Cuts 1~4 + 5th Summary Card + Rich Storytelling Caption with @kids_fit1 pre-filled)
 *
 * Usage:
 *   node scripts/send_daily_6am_insta_threads.js --ep 2
 *   node scripts/send_daily_6am_insta_threads.js --advance
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const {
  getTelegramConfig,
  telegramApiRequest,
  sendTelegramPhoto,
  loadResearchStatus,
  escapeHtml
} = require('./telegram-notify');

function sendTelegramVideoFile(botToken, chatId, filePath, caption) {
  return new Promise((resolve, reject) => {
    const boundary = '----KidsFitDailyVideo' + Date.now().toString(16);
    const filename = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption || ''}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="video"; filename="${filename}"\r\nContent-Type: video/mp4\r\n\r\n`),
      fileData,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ];
    const body = Buffer.concat(parts);
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${botToken}/sendVideo`,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        },
        timeout: 120000
      },
      res => {
        let chunks = '';
        res.on('data', d => (chunks += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(chunks));
          } catch (e) {
            resolve({ ok: false });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const ROOT_DIR = path.resolve(__dirname, '..');
const WEBTOON_DIR = path.join(ROOT_DIR, '웹툰_모음');
const STATE_FILE = path.join(ROOT_DIR, 'logs', 'daily_6am_insta_state.json');

const EPISODE_CATALOG = [
  {
    ep: 1,
    folder: '1화_만3세소근육민감기_웹툰',
    title: '1화: 만 3세 "내가 혼자 할 거야!" 고집의 진짜 이유 (손끝 소근육 민감기)'
  },
  {
    ep: 2,
    folder: '2화_초등문장제수학작업기억_웹툰',
    title: '2화: 연산은 100점인데 문장제 수학만 별표 치는 아이 (전두엽 작업기억의 비밀)'
  },
  {
    ep: 3,
    folder: '3화_밤10시숙면숨은키7cm_웹툰',
    title: '3화: 밤마다 우유 먹였는데 키가 안 큰다고요? (밤 10시 성장호르몬 & 하체 스트레칭)'
  },
  {
    ep: 4,
    folder: '4화_편식아이미각민감기아연_웹툰',
    title: '4화: 고기·채소 입에도 안 대는 편식 아이 (미각 세포 아연 부족 & 푸드브릿지)'
  },
  {
    ep: 5,
    folder: '5화_거북목자세교정숨은키2cm_웹툰',
    title: '5화: 구부정한 거북목·말린 어깨 펴고 숨은 키 2cm & 집중력 동시에 찾은 비결'
  }
];

function loadDailyState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  // User already posted Episode 1 on @kids_fit1, so start next auto-delivery from Episode 2!
  return { lastSentEpisode: 1, history: [] };
}

function saveDailyState(st) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(st, null, 2) + '\n', 'utf8');
  } catch (e) {}
}

async function sendEpisodePack(epMeta, cfg) {
  const dir = path.join(WEBTOON_DIR, epMeta.folder);
  if (!fs.existsSync(dir)) {
    throw new Error(`Episode folder not found: ${dir}`);
  }

  const research = loadResearchStatus();
  const totalPapers = (research.total_papers || 2723).toLocaleString('ko-KR');

  const gridPath = path.join(dir, '00_전체_4컷_한눈에보기_합본.png');
  const cut1 = path.join(dir, '01_1컷.png');
  const cut2 = path.join(dir, '02_2컷.png');
  const cut3 = path.join(dir, '03_3컷.png');
  const cut4 = path.join(dir, '04_4컷.png');
  const cut5 = path.join(dir, '05_5컷_핵심요약저장카드.png');

  let instaCaption = fs.readFileSync(path.join(dir, '05_인스타그램_본문_해시태그.txt'), 'utf8').trim();
  let threadsP1 = fs.readFileSync(path.join(dir, '06_쓰레드_1번째본문_4컷합본용.txt'), 'utf8').trim();
  let threadsR2 = fs.readFileSync(path.join(dir, '07_쓰레드_2번째이어쓰기_링크댓글용.txt'), 'utf8').trim();

  // Dynamically sync paper count and ensure @kids_fit1 is pre-filled
  instaCaption = instaCaption
    .replace(/@계정아이디/g, '@kids_fit1')
    .replace(/논문 [\d,]+편 기반/g, `논문 ${totalPapers}편 기반`);

  // 1. Header Banner Message
  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: [
      `🌅 <b>[@kids_fit1 인스타 &amp; 쓰레드 원터치 업로드 패키지 — 제${epMeta.ep}화]</b>`,
      `📌 <b>주제</b>: <b>${escapeHtml(epMeta.title)}</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `<b>[1단계: 쓰레드(Threads) 업로드용]</b>`,
      `① 바로 아래 <b>4컷 바둑판 합본 이미지 1장</b>을 저장해 쓰레드에 첨부하세요.`,
      `② 이어서 오는 <b>[쓰레드 1번째 본문 메시지]</b>를 길게 눌러 <b>[복사]</b> 후 붙여넣으세요 (500자 제한 안 잘리게 420자 완결 문장으로 맞춤!).`,
      `③ 게시 직후 내 글 댓글에 <b>[쓰레드 2번째 이어쓰기 메시지]</b>를 길게 눌러 <b>[복사]</b>해 달아주시면 끝!`
    ].join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });

  // 2. Threads 2x2 Grid Image + 2 Standalone Copy-Ready Text Bubbles
  if (fs.existsSync(gridPath)) {
    await sendTelegramPhoto(
      cfg.botToken,
      cfg.chatId,
      gridPath,
      `🧵 [쓰레드용 4컷 한장 합본 — 제${epMeta.ep}화] 이 사진 1장을 쓰레드 본문에 첨부하세요!`
    );
  }

  // Standalone bubble #1: Threads Post 1 (100% pure text for 1-tap copy on smartphone)
  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: threadsP1,
    disable_web_page_preview: true
  });

  // Standalone bubble #2: Threads Reply 2 (100% pure text for 1-tap copy into self-reply)
  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: threadsR2,
    disable_web_page_preview: true
  });

  // 3. Instagram Guide Header + 5 Carousel Slides + 1 Standalone Copy-Ready Caption Bubble
  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: [
      `📸 <b>[2단계: 인스타그램(@kids_fit1) 피드 캐러셀 업로드용 — 제${epMeta.ep}화]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `① 아래 순서대로 전송되는 <b>1컷 ~ 5컷(요약카드) 이미지 5장</b>을 저장해 인스타에 선택하세요.`,
      `② 마지막에 오는 <b>[인스타 본문 메시지]</b>는 설명 헤더가 없으니 말풍선을 길게 눌러 <b>[복사]</b>한 뒤 인스타에 그대로 붙여넣으시면 됩니다! (<code>@kids_fit1</code> 계정 아이디까지 자동 입력 완료)`
    ].join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });

  const carouselSlides = [
    [1, cut1, '1/5장 (도입·갈등 컷)'],
    [2, cut2, '2/5장 (뇌과학·의학 반전 팩트 컷)'],
    [3, cut3, '3/5장 (오늘의 실천 코칭 컷)'],
    [4, cut4, '4/5장 (아이의 변화·성취감 컷)'],
    [5, cut5, '5/5장 (저장 유도 3단계 핵심 요약카드)']
  ];

  for (const [idx, sp, desc] of carouselSlides) {
    if (fs.existsSync(sp)) {
      await sendTelegramPhoto(
        cfg.botToken,
        cfg.chatId,
        sp,
        `📸 [인스타 캐러셀 ${desc} — 제${epMeta.ep}화]`
      );
    }
  }

  // Standalone bubble #3: Instagram Caption (100% pure text for 1-tap copy on smartphone)
  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: instaCaption,
    disable_web_page_preview: true
  });

  // Also send the 16-second page-flipping BGM video if available for this episode!
  const clipMap = {
    1: '01_네이버클립_웹툰1화_만3세소근육민감기.mp4',
    2: '02_네이버클립_웹툰2화_초등문장제수학작업기억.mp4',
    3: '03_네이버클립_웹툰3화_밤10시숙면숨은키7cm.mp4',
    4: '04_네이버클립_웹툰4화_편식아이미각민감기아연.mp4',
    5: '05_네이버클립_웹툰5화_거북목자세교정숨은키2cm.mp4'
  };
  const clipFile = clipMap[epMeta.ep];
  if (clipFile) {
    const clipPath = path.join(ROOT_DIR, '네이버클립_웹툰영상_모음', clipFile);
    if (fs.existsSync(clipPath)) {
      await sendTelegramVideoFile(
        cfg.botToken,
        cfg.chatId,
        clipPath,
        `🎬 [제${epMeta.ep}화 인스타 릴스·네이버클립용 16초 책넘김(Page-Flip) 피아노 BGM 영상]`
      );
    }
  }

  console.log(`  ✓ Sent Daily @kids_fit1 Instagram & Threads Pack for Episode ${epMeta.ep}`);
}

async function main() {
  const cfg = getTelegramConfig();
  if (!cfg.isConfigured || !cfg.chatId) {
    console.error('[Telegram] Bot token or Chat ID not configured.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const epIdx = args.indexOf('--ep');
  const st = loadDailyState();

  let targetEpNum = null;
  if (epIdx !== -1 && args[epIdx + 1]) {
    targetEpNum = Number(args[epIdx + 1]);
  } else {
    targetEpNum = (st.lastSentEpisode % EPISODE_CATALOG.length) + 1;
  }

  const epMeta = EPISODE_CATALOG.find(e => e.ep === targetEpNum) || EPISODE_CATALOG[0];
  await sendEpisodePack(epMeta, cfg);

  if (args.includes('--advance') || epIdx !== -1) {
    st.lastSentEpisode = epMeta.ep;
    st.history = st.history || [];
    st.history.push({ ep: epMeta.ep, sentAt: new Date().toISOString() });
    saveDailyState(st);
  }
}

main().catch(err => {
  console.error('[Daily 6AM Insta/Threads Error]:', err.message);
  process.exit(1);
});
