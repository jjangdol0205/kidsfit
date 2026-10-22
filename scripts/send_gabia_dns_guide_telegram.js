#!/usr/bin/env node
/**
 * scripts/send_gabia_dns_guide_telegram.js
 * Sends the complete Gabia DNS + Render Custom Domain setup guide for `kidsfit.co.kr`
 * (including visual table image + 1-tap copyable record values) to Telegram.
 */

const fs = require('fs');
const path = require('path');
const {
  getTelegramConfig,
  telegramApiRequest,
  sendTelegramPhoto
} = require('./telegram-notify');

const ROOT_DIR = path.resolve(__dirname, '..');
const IMG_PATH = path.join(
  ROOT_DIR,
  '인스타_쓰레드_프로필_모음',
  '05_가비아_kidsfit_DNS설정_한눈에보기_표.png'
);

async function main() {
  const cfg = getTelegramConfig();
  if (!cfg.isConfigured || !cfg.chatId) {
    console.error('Telegram not configured.');
    process.exit(1);
  }

  // 1. Send Visual Cheat-Sheet Image
  if (fs.existsSync(IMG_PATH)) {
    await sendTelegramPhoto(
      cfg.botToken,
      cfg.chatId,
      IMG_PATH,
      '🌐 [kidsfit.co.kr 도메인 이전 완료 & 가비아 DNS 1분 설정표]'
    );
  }

  // 2. Send Step-by-Step Guide Message
  const guideHtml = [
    `🎉 <b>[kidsfit.co.kr 도메인 홈페이지·서버·마케팅 링크 100% 적용 완료!]</b>`,
    ``,
    `대표님! 홈페이지(<code>CNAME</code>, <code>server.js</code>, 카카오톡 오픈그래프 미리보기, 사이트맵, 그리고 매일 새벽 6시 발송되는 인스타/쓰레드/블로그/카페 링크 전체)를 새 도메인 <b>https://kidsfit.co.kr</b> 기준으로 모두 세팅하여 배포 완료했습니다! <i>(기존 truthofmarket.com 주소로 들어오는 방문자도 끊김 없이 100% 정상 작동합니다.)</i>`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `📌 <b>[STEP 1] 가비아 DNS 설정 방법 (딱 2줄만 입력!)</b>`,
    `👉 가비아 DNS 관리툴 접속: https://dns.gabia.com`,
    `1️⃣ 로그인 후 <b>kidsfit.co.kr</b> 우측의 <b>[설정]</b> 클릭 ➔ <b>[레코드 수정]</b> 클릭`,
    `2️⃣ 하단 <b>[+ 레코드 추가]</b>를 눌러 아래 <b>2줄</b>을 그대로 입력해 주세요:`,
    ``,
    `🔹 <b>첫 번째 줄 (기본 도메인 kidsfit.co.kr 연결)</b>`,
    `• <b>타입</b>: <code>A</code>`,
    `• <b>호스트</b>: <code>@</code>`,
    `• <b>값/위치</b>: <code>216.24.57.1</code>`,
    `• <b>TTL</b>: <code>3600</code> ➔ 우측 <b>[확인]</b> 클릭`,
    ``,
    `🔹 <b>두 번째 줄 (www.kidsfit.co.kr 연결)</b>`,
    `• <b>타입</b>: <code>CNAME</code>`,
    `• <b>호스트</b>: <code>www</code>`,
    `• <b>값/위치</b>: <code>truth-of-market.onrender.com.</code>`,
    `  <i>(⚠️ 중요: 가비아는 CNAME 값 맨 끝에 <b>마침표(.)</b>까지 꼭 찍어야 저장됩니다!)</i>`,
    `• <b>TTL</b>: <code>3600</code> ➔ 우측 <b>[확인]</b> 클릭`,
    ``,
    `3️⃣ 두 줄 모두 [확인]을 누른 뒤, 화면 맨 아래 파란색 <b>[저장]</b> 버튼을 꼭 눌러주세요!`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `📌 <b>[STEP 2] Render 서버에 도메인 1초 등록 (무료 SSL 자동 발급)</b>`,
    `👉 Render 대시보드 접속: https://dashboard.render.com`,
    `1️⃣ <b>truth-of-market</b> 서비스 클릭 ➔ 왼쪽 메뉴 <b>[Settings]</b> 클릭`,
    `2️⃣ 아래로 스크롤하여 <b>Custom Domains</b> 섹션에서 <b>[+ Add Custom Domain]</b> 클릭`,
    `3️⃣ 입력창에 <code>kidsfit.co.kr</code> 입력 후 <b>[Save]</b> 클릭`,
    `4️⃣ 우측의 <b>[Verify]</b> 버튼을 누르면 1~2분 내로 무료 보안인증서(<code>https://kidsfit.co.kr</code>)가 자동 발급되어 즉시 연결됩니다!`,
    ``,
    `👇 바로 아래에 스마트폰/PC에서 <b>길게 눌러 1초 만에 복사</b>하실 수 있도록 입력값 3개를 단독 말풍선으로 보내드립니다!`
  ].join('\n');

  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: guideHtml,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });

  // 3. Send 1-Tap Standalone Copy Bubbles
  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: '216.24.57.1',
    disable_web_page_preview: true
  });

  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: 'truth-of-market.onrender.com.',
    disable_web_page_preview: true
  });

  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: 'kidsfit.co.kr',
    disable_web_page_preview: true
  });

  console.log('Successfully sent Gabia DNS & Render Custom Domain guide to Telegram!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
