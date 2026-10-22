#!/usr/bin/env node
/**
 * scripts/send_webtoon_cardnews_telegram.js
 * Sends the newly organized Folder Structure Summary + 3 Sensuous 4-Cut Webtoon Episodes
 * + 3 High-Contrast Zero-Margin Cardnews Series directly to Telegram.
 */

const fs = require('fs');
const path = require('path');
const { getTelegramConfig, telegramApiRequest, sendTelegramPhoto, escapeHtml } = require('./telegram-notify');

const ROOT_DIR = path.resolve(__dirname, '..');
const WEBTOON_DIR = path.join(ROOT_DIR, '웹툰_모음');
const CARDNEWS_DIR = path.join(ROOT_DIR, '카드뉴스_모음');

async function main() {
  const cfg = getTelegramConfig();
  if (!cfg.isConfigured || !cfg.chatId) {
    console.error('[Telegram] Bot token or Chat ID not configured.');
    process.exit(1);
  }

  // 1. Send Folder Organization + Webtoon/Cardnews Overview Message
  const introHtml = [
    `🎨 <b>[폴더별 개별 정리 완료 + 감각적 4컷 웹툰 3화 &amp; 여백 없는 카드뉴스 3탄 제작 완료!]</b>`,
    ``,
    `요청하신 대로 <b>① 블로그 글 7개와 카페 글 4개를 각각 전용 폴더로 개별 정리</b>했고, <b>② 인스타·쓰레드·블로그에 바로 올릴 수 있는 감각적인 4컷 공감 웹툰(1~3화)과 형광펜 하이라이트 카드뉴스(1~3탄)</b>도 각각 폴더별로 제작해 넣었습니다!`,
    ``,
    `📂 <b>PC 작업 폴더(<code>d:\\사업아이템</code>) 내 정리된 4대 보관함</b>`,
    `1️⃣ <b><code>d:\\사업아이템\\네이버블로그_글모음\\</code></b>`,
    `  ├ 📁 <code>1일차_신체성장_키백분위와숨은키7cm</code> (제목·본문·태그·대표이미지)`,
    `  ├ 📁 <code>2일차_두뇌학습_나이별교구와공부법순서</code>`,
    `  ├ 📁 <code>3일차_신체성장_우유배앓이와칼슘시너지</code>`,
    `  ├ 📁 <code>4일차_두뇌학습_문장제수학과작업기억</code>`,
    `  ├ 📁 <code>5일차_신체성장_사춘기신호와급성장기골든타임</code>`,
    `  ├ 📁 <code>6일차_두뇌학습_주말박물관하브루타질문법</code>`,
    `  └ 📁 <code>7일차_통합칼럼_밤10시수면과장기기억키성장</code>`,
    ``,
    `2️⃣ <b><code>d:\\사업아이템\\네이버카페_글모음\\</code></b>`,
    `  ├ 📁 <code>1번글_카페대문_전체환영공지글</code>`,
    `  ├ 📁 <code>2번글_연령별_무료워크지3종_나눔게시글</code> (A4 PDF 3종 동봉)`,
    `  ├ 📁 <code>3번글_매월1일_키즈핏리포트_인증챌린지_공지글</code>`,
    `  └ 📁 <code>4번글_5분완성_네이버카페_메뉴세팅_운영가이드</code>`,
    ``,
    `3️⃣ <b><code>d:\\사업아이템\\웹툰_모음\\</code></b> (입체 말풍선 + 화자 배지 + 형광펜 강조)`,
    `  ├ 📁 <code>1화_만3세소근육민감기_웹툰</code> (1~4컷 개별본 + 합본 + 인스타/쓰레드 글)`,
    `  ├ 📁 <code>2화_초등문장제수학작업기억_웹툰</code>`,
    `  └ 📁 <code>3화_밤10시숙면숨은키7cm_웹툰</code>`,
    ``,
    `4️⃣ <b><code>d:\\사업아이템\\카드뉴스_모음\\</code></b> (여백 0px 풀블리드 + 딥컬러 헤더 + 형광펜 하이라이트)`,
    `  ├ 📁 <code>1탄_만3세고집과소근육발달_카드뉴스</code> (6장)`,
    `  ├ 📁 <code>2탄_초등문장제수학과백지복습_카드뉴스</code> (4장)`,
    `  └ 📁 <code>3탄_밤10시숙면과숨은키7cm_카드뉴스</code> (4장)`,
    ``,
    `🌐 <b>웹툰 &amp; 카드뉴스 전체 보기 센터</b>:`,
    `<a href="https://truthofmarket.com/samples/8_insta_threads_webtoon_pack/">https://truthofmarket.com/samples/8_insta_threads_webtoon_pack/</a>`,
    `━━━━━━━━━━━━━━━━━━`,
    `👇 아래로 방금 완성된 <b>감각적인 4컷 웹툰(1~3화)과 여백 없는 카드뉴스(1~3탄) 이미지 및 인스타·쓰레드 복붙용 본문</b>을 바로 전송해 드립니다!`
  ].join('\n');

  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: introHtml,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  });
  console.log('  ✓ Sent Folder & Visual Pack Intro');

  // 2. Send Webtoon Episodes (4-cut summary grid + Cut 1 & Cut 3 closeups + Instagram/Threads text)
  const webtoonFolders = [
    {
      folder: '1화_만3세소근육민감기_웹툰',
      label: '💬 [웹툰 1화] 만 3세 고집의 진짜 이유 — 손끝 소근육 민감기 (4컷)'
    },
    {
      folder: '2화_초등문장제수학작업기억_웹툰',
      label: '💬 [웹툰 2화] 연산은 100점인데 문장제 수학만 별표 치는 아이 — 전두엽 작업기억 (4컷)'
    },
    {
      folder: '3화_밤10시숙면숨은키7cm_웹툰',
      label: '💬 [웹툰 3화] 밤마다 우유 먹였는데 키가 안 큰다고요? — 밤 10시 성장호르몬 & 스트레칭 (4컷)'
    }
  ];

  for (const wf of webtoonFolders) {
    const dir = path.join(WEBTOON_DIR, wf.folder);
    const gridPath = path.join(dir, '00_전체_4컷_한눈에보기_합본.png');
    const cut1Path = path.join(dir, '01_1컷.png');
    const cut2Path = path.join(dir, '02_2컷.png');
    const cut3Path = path.join(dir, '03_3컷.png');
    const cut4Path = path.join(dir, '04_4컷.png');

    if (fs.existsSync(gridPath)) {
      await sendTelegramPhoto(cfg.botToken, cfg.chatId, gridPath, `${wf.label} — 4컷 한눈에 보기`);
    }
    for (const [idx, cp] of [[1, cut1Path], [2, cut2Path], [3, cut3Path], [4, cut4Path]]) {
      if (fs.existsSync(cp)) {
        await sendTelegramPhoto(cfg.botToken, cfg.chatId, cp, `${wf.label} — [${idx}/4컷 개별 슬라이드]`);
      }
    }

    const instaTxt = path.join(dir, '인스타그램_본문_해시태그.txt');
    const threadsTxt = path.join(dir, '쓰레드_공감질문_본문_대댓글.txt');
    if (fs.existsSync(instaTxt) && fs.existsSync(threadsTxt)) {
      const iStr = fs.readFileSync(instaTxt, 'utf8').trim();
      const tStr = fs.readFileSync(threadsTxt, 'utf8').trim();
      await telegramApiRequest(cfg.botToken, 'sendMessage', {
        chat_id: cfg.chatId,
        text: `📋 <b>[${escapeHtml(wf.label)} — 인스타 &amp; 쓰레드 복붙용 본문]</b>\n━━━━━━━━━━━━━━━━━━\n<b>[인스타그램 본문]</b>\n${escapeHtml(iStr)}\n\n━━━━━━━━━━━━━━━━━━\n${escapeHtml(tStr)}`,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
    }
    console.log(`  ✓ Sent Webtoon folder: ${wf.folder}`);
  }

  // 3. Send Cardnews Series (Cover + Slide 2 + Slide 3 + Slide 4 for each of the 3 series)
  const cardnewsFolders = [
    {
      folder: '1탄_만3세고집과소근육발달_카드뉴스',
      label: '📊 [카드뉴스 1탄] 만 3세 고집과 소근육 발달 (여백 0px 풀블리드)'
    },
    {
      folder: '2탄_초등문장제수학과백지복습_카드뉴스',
      label: '📊 [카드뉴스 2탄] 연산 100점 아이가 문장제 수학만 별표 치는 이유 (여백 0px 풀블리드)'
    },
    {
      folder: '3탄_밤10시숙면과숨은키7cm_카드뉴스',
      label: '📊 [카드뉴스 3탄] 밤 10시 숙면과 숨은 키 +7cm 골든타임 (여백 0px 풀블리드)'
    }
  ];

  for (const cf of cardnewsFolders) {
    const dir = path.join(CARDNEWS_DIR, cf.folder);
    for (let s = 1; s <= 4; s++) {
      const sp = path.join(dir, `0${s}_카드뉴스_${s}장.png`);
      if (fs.existsSync(sp)) {
        await sendTelegramPhoto(cfg.botToken, cfg.chatId, sp, `${cf.label} — ${s}장`);
      }
    }
    console.log(`  ✓ Sent Cardnews folder: ${cf.folder}`);
  }

  console.log('  ✓ All Webtoon & Cardnews packs sent to Telegram!');
}

main().catch(err => {
  console.error('[Error sending Webtoon/Cardnews pack]:', err.message);
  process.exit(1);
});
