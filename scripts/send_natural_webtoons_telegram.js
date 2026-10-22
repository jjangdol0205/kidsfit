#!/usr/bin/env node
/**
 * scripts/send_natural_webtoons_telegram.js
 * Sends the updated @gangjidol style natural hand-drawn Instatoon Webtoons (Episodes 1~3) to Telegram.
 */

const fs = require('fs');
const path = require('path');
const { getTelegramConfig, telegramApiRequest, sendTelegramPhoto } = require('./telegram-notify');

const ROOT_DIR = path.resolve(__dirname, '..');
const WEBTOON_DIR = path.join(ROOT_DIR, '웹툰_모음');

async function main() {
  const cfg = getTelegramConfig();
  if (!cfg.isConfigured || !cfg.chatId) {
    console.error('[Telegram] Not configured.');
    process.exit(1);
  }

  const introHtml = [
    `💬 <b>[@gangjidol(강지돌) 인스타툰 감성 자연스러운 말풍선 전면 적용 완료!]</b>`,
    ``,
    `보내주신 <code>@gangjidol</code> 인스타툰 스타일에 맞춰 웹툰 말풍선을 완전히 새롭게 바꿨습니다!`,
    `• <b>딱딱한 UI 이름표 배지·형광펜·보라색 테두리·길쭉한 바늘 꼬리 100% 제거</b>`,
    `• <b>일러스트 펜선과 똑같은 따뜻한 다크브라운 손그림 라인 + 크림화이트 동글동글 타원형 말풍선</b>`,
    `• <b>캐릭터 머리 바로 옆에 붙어 짧고 귀엽게 쏙 나오는 자연스러운 만화 말풍선 꼬리 + 둥근 라운드 폰트 적용</b>`,
    ``,
    `🌐 <b>웹에서도 즉시 확인</b>: <a href="https://truthofmarket.com/samples/8_insta_threads_webtoon_pack/">https://truthofmarket.com/samples/8_insta_threads_webtoon_pack/</a>`,
    `👇 아래로 자연스러운 인스타툰 말풍선이 적용된 <b>1화 · 2화 · 3화</b> 이미지를 바로 보내드립니다!`
  ].join('\n');

  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: introHtml,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  });

  const folders = [
    { folder: '1화_만3세소근육민감기_웹툰', label: '🌱 [1화: 만 3세 손끝 소근육 민감기 인스타툰]' },
    { folder: '2화_초등문장제수학작업기억_웹툰', label: '🧠 [2화: 초등 문장제 수학과 전두엽 작업기억 인스타툰]' },
    { folder: '3화_밤10시숙면숨은키7cm_웹툰', label: '📏 [3화: 밤 10시 숙면과 숨은 키 +7cm 인스타툰]' }
  ];

  for (const f of folders) {
    const dir = path.join(WEBTOON_DIR, f.folder);
    const gridPath = path.join(dir, '00_전체_4컷_한눈에보기_합본.png');
    if (fs.existsSync(gridPath)) {
      await sendTelegramPhoto(cfg.botToken, cfg.chatId, gridPath, `${f.label} — 4컷 한눈에 보기 (자연스러운 말풍선)`);
    }
    for (let i = 1; i <= 4; i++) {
      const cp = path.join(dir, `0${i}_${i}컷.png`);
      if (fs.existsSync(cp)) {
        await sendTelegramPhoto(cfg.botToken, cfg.chatId, cp, `${f.label} — ${i}컷`);
      }
    }
  }
  console.log('  ✓ Sent all natural Instatoon webtoons to Telegram!');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
