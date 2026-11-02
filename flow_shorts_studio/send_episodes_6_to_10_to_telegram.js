#!/usr/bin/env node
/**
 * KISFIT Global × Google Flow 6화~10화 단일 베스트 버전(1A_Punchline) + 유튜브 쇼츠 & 인스타 릴스 순수 복붙 멘트 텔레그램 일괄 발송기
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const tn = require('../scripts/telegram-notify.js');
const { SHORTS_REELS_CATALOG } = require('../scripts/send_daily_6am_shorts_reels.js');

function sendTelegramVideoFile(botToken, chatId, filePath, caption) {
  return new Promise((resolve, reject) => {
    const boundary = '----KisFitFlowShorts6to10' + Date.now().toString(16);
    const filename = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption || ''}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="supports_streaming"\r\n\r\ntrue\r\n`),
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
        timeout: 180000
      },
      res => {
        let chunks = '';
        res.on('data', d => (chunks += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(chunks));
          } catch (e) {
            resolve({ ok: false, error: chunks });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sendRawText(botToken, chatId, text, parseMode = null) {
  const payload = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true
  };
  if (parseMode) payload.parse_mode = parseMode;
  return tn.telegramApiRequest(botToken, 'sendMessage', payload);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const cfg = tn.getTelegramConfig();
  const outDir = path.join(__dirname, 'ai_shorts_output');
  const episodes6to10 = SHORTS_REELS_CATALOG.filter(item => item.ep >= 6 && item.ep <= 10);

  await sendRawText(
    cfg.botToken,
    cfg.chatId,
    [
      '🎬 <b>[KISFIT Global × Google Flow 6화 ~ 10화 (단일 베스트 버전) 마스터링 완료 & 일괄 전송]</b>',
      '━━━━━━━━━━━━━━━━━━━━━━',
      '✅ <b>요청사항 100% 반영:</b>',
      '• 가장 조회수·전환율이 높은 <b>단일 베스트 버전(1A_Punchline.mp4) 1개씩만</b> 발송합니다.',
      '• <b>오전 6시 순차 발송 큐(#6번 ~ #10번)</b>에도 순서대로 자동 추가 완료되었습니다 (11월 6일 ~ 11월 10일 오전 6시 순차 발송).',
      '• 각 화마다 <b>[영상 파일 1개] -> [유튜브 쇼츠 제목] -> [유튜브 쇼츠 설명란] -> [인스타 릴스 본문]</b> 순서로 바로 길게 눌러 복사하실 수 있게 전송합니다!'
    ].join('\n'),
    'HTML'
  );
  await sleep(1000);

  for (const item of episodes6to10) {
    const fileA = path.join(outDir, item.filename);
    console.log(`📤 Sending Episode ${item.ep}: ${item.koTopic}...`);

    await sendRawText(
      cfg.botToken,
      cfg.chatId,
      `━━━━━━━━━━━━━━━━━━━━━━\n🔥 <b>[${item.koTopic}]</b>\n• 오전 6시 자동 발송 순번: <b>#${item.ep}번</b>\n• 유튜브 쇼츠: https://www.youtube.com/@kisfitglobal\n• 인스타 릴스: https://www.instagram.com/kisfitglobal`,
      'HTML'
    );
    await sleep(600);

    if (fs.existsSync(fileA)) {
      const resA = await sendTelegramVideoFile(
        cfg.botToken,
        cfg.chatId,
        fileA,
        `🎬 [제${item.ep}화 단일 베스트 버전 (순번 #${item.ep}번)]\n• 파일명: ${path.basename(fileA)}\n• KisFitGlobal.com 전환 클로징 + 서브베이스 붐 마스터링`
      );
      console.log(`  -> Video (${path.basename(fileA)}):`, resA.ok);
      await sleep(1200);
    }

    await sendRawText(
      cfg.botToken,
      cfg.chatId,
      `1️⃣ <b>[제${item.ep}화 · 유튜브 쇼츠 제목 (YouTube Shorts Title)]</b>\n👇 아래 메시지를 길게 눌러 <b>[복사]</b> 후 유튜브 쇼츠 제목란에 붙여넣으세요.`,
      'HTML'
    );
    await sleep(400);
    await sendRawText(cfg.botToken, cfg.chatId, item.ytTitle, null);
    await sleep(700);

    await sendRawText(
      cfg.botToken,
      cfg.chatId,
      `2️⃣ <b>[제${item.ep}화 · 유튜브 쇼츠 설명란 & 고정댓글 (Description)]</b>\n👇 아래 메시지를 길게 눌러 <b>[복사]</b> 후 설명란 및 고정댓글에 붙여넣으세요.`,
      'HTML'
    );
    await sleep(400);
    await sendRawText(cfg.botToken, cfg.chatId, item.ytDescription, null);
    await sleep(700);

    await sendRawText(
      cfg.botToken,
      cfg.chatId,
      `3️⃣ <b>[제${item.ep}화 · 인스타그램 릴스 캡션 (Instagram Reels @kisfitglobal)]</b>\n👇 아래 메시지를 길게 눌러 <b>[복사]</b> 후 인스타 릴스 본문에 붙여넣으세요.`,
      'HTML'
    );
    await sleep(400);
    await sendRawText(cfg.botToken, cfg.chatId, item.igReelsCaption, null);
    await sleep(1200);
  }

  console.log('🎉 All 5 episodes (6~10) delivered to Telegram!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
