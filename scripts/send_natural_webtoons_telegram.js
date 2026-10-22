#!/usr/bin/env node
/**
 * scripts/send_natural_webtoons_telegram.js
 * Sends the @gangjidol style natural hand-drawn Instatoon Webtoons organized episode-by-episode
 * (1화, 2화, 3화 individual ZIP packages + vertical scroll strip + copy-ready caption TXT) to Telegram.
 */

const fs = require('fs');
const path = require('path');
const { getTelegramConfig, telegramApiRequest, sendTelegramDocument } = require('./telegram-notify');

const ROOT_DIR = path.resolve(__dirname, '..');
const WEBTOON_DIR = path.join(ROOT_DIR, '웹툰_모음');

async function main() {
  const cfg = getTelegramConfig();
  if (!cfg.isConfigured || !cfg.chatId) {
    console.error('[Telegram] Not configured.');
    process.exit(1);
  }

  const introHtml = [
    `📂 <b>[웹툰 1화 · 2화 · 3화 각 화별 개별 폴더 &amp; 화별 ZIP 저장 완료!]</b>`,
    ``,
    `요청하신 대로 <code>@gangjidol</code> 감성의 자연스러운 말풍선 웹툰을 <b>각 화별(1화 · 2화 · 3화) 전용 폴더와 화별 통합 압축파일(ZIP)</b>로 각각 깔끔하게 분리 저장했습니다!`,
    ``,
    `📁 <b>PC 저장 경로 (<code>d:\\사업아이템\\웹툰_모음\\</code>)</b>`,
    `• <b>1화 폴더</b>: <code>웹툰_모음\\1화_만3세소근육민감기_웹툰\\</code>`,
    `• <b>2화 폴더</b>: <code>웹툰_모음\\2화_초등문장제수학작업기억_웹툰\\</code>`,
    `• <b>3화 폴더</b>: <code>웹툰_모음\\3화_밤10시숙면숨은키7cm_웹툰\\</code>`,
    `<i>(각 폴더 안에 ① 4컷 바둑판 합본, ② 4컷 세로 스크롤 합본, ③ 1~4컷 개별 원본 PNG, ④ 인스타·쓰레드 본문 TXT가 모두 들어 있습니다!)</i>`,
    ``,
    `🌐 <b>웹에서도 화별 원클릭 다운로드</b>: <a href="https://truthofmarket.com/samples/8_insta_threads_webtoon_pack/">https://truthofmarket.com/samples/8_insta_threads_webtoon_pack/</a>`,
    `👇 스마트폰에서도 바로 화별로 저장하실 수 있도록 <b>[1화] · [2화] · [3화] 화별 원본 ZIP + 세로합본 + 본문 파일</b>을 순서대로 보내드립니다!`
  ].join('\n');

  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: introHtml,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  });

  const episodes = [
    {
      num: 1,
      folder: '1화_만3세소근육민감기_웹툰',
      label: '🌱 [웹툰 1화] 만 3세 손끝 소근육 민감기 인스타툰'
    },
    {
      num: 2,
      folder: '2화_초등문장제수학작업기억_웹툰',
      label: '🧠 [웹툰 2화] 초등 문장제 수학과 전두엽 작업기억 인스타툰'
    },
    {
      num: 3,
      folder: '3화_밤10시숙면숨은키7cm_웹툰',
      label: '📏 [웹툰 3화] 밤 10시 숙면과 숨은 키 +7cm 인스타툰'
    }
  ];

  for (const ep of episodes) {
    const dir = path.join(WEBTOON_DIR, ep.folder);
    const zipPath = path.join(WEBTOON_DIR, `${ep.folder}_전체파일.zip`);
    const vstripPath = path.join(dir, '00_전체_4컷_세로연속보기_스크롤합본.png');
    const txtPath = path.join(dir, '07_인스타_쓰레드_통합본.txt');

    if (fs.existsSync(zipPath)) {
      await sendTelegramDocument(
        cfg.botToken,
        cfg.chatId,
        zipPath,
        `📦 ${ep.label} — 화별 전체 묶음 (1~4컷 + 바둑판/세로 합본 + 본문 TXT)`
      );
    }
    if (fs.existsSync(vstripPath)) {
      await sendTelegramDocument(
        cfg.botToken,
        cfg.chatId,
        vstripPath,
        `📜 ${ep.label} — 블로그/카페용 4컷 세로 연속 합본 원본 (고화질 무압축)`
      );
    }
    if (fs.existsSync(txtPath)) {
      await sendTelegramDocument(
        cfg.botToken,
        cfg.chatId,
        txtPath,
        `📝 ${ep.label} — 인스타 & 쓰레드 복붙용 본문·해시태그 통합본.txt`
      );
    }
  }

  console.log('  ✓ Sent episode-by-episode webtoon packages to Telegram!');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
