#!/usr/bin/env node
/**
 * scripts/send_naver_cafe_pack_telegram.js
 * Sends the complete Naver Cafe All-in-One Launch Pack (3 Printable A4 PDFs, Preview PNGs,
 * 4 Ready-to-Paste Cafe Notices/Posts, and Web Copy/Download Center Link) directly to Telegram.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { getTelegramConfig, telegramApiRequest, sendTelegramPhoto, escapeHtml } = require('./telegram-notify');

const ROOT_DIR = path.resolve(__dirname, '..');
const PACK_DIR = path.join(ROOT_DIR, 'samples', '6_naver_cafe_pack');
const POSTS_DIR = path.join(PACK_DIR, 'posts');

function sendTelegramDocument(botToken, chatId, filePath, caption = '', mimeType = 'application/pdf') {
  return new Promise((resolve, reject) => {
    const boundary = '----KidsFitDocBoundary' + Date.now().toString(16) + Math.random().toString(16).slice(2);
    const filename = path.basename(filePath);
    const fileBuf = fs.readFileSync(filePath);

    const parts = [];
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`,
      'utf8'
    ));
    if (caption) {
      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`,
        'utf8'
      ));
    }
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
      'utf8'
    ));
    parts.push(fileBuf);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'));

    const bodyBuf = Buffer.concat(parts);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendDocument`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuf.length
      },
      timeout: 45000
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.ok) {
            resolve(parsed.result);
          } else {
            reject(new Error(parsed.description || `HTTP ${res.statusCode}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

async function main() {
  const cfg = getTelegramConfig();
  if (!cfg.isConfigured || !cfg.chatId) {
    console.error('[Telegram] Bot token or Chat ID not configured.');
    process.exit(1);
  }

  // 1. Send Overview & 5-Min Setup Guide Message
  const introHtml = [
    `🎁 <b>[키즈핏 공식 네이버 카페 올인원 오픈 패키지 제작 &amp; 전송 완료!]</b>`,
    ``,
    `요청하신 네이버 카페 운영용 <b>① 연령별 무료 프린트 워크지 PDF 3종</b>과 <b>② 카페에 그대로 복사해 붙여넣는 공지글·게시글·메뉴 세팅 4종</b>을 모두 제작하여 지금 바로 텔레그램 파일과 메시지로 보내드립니다!`,
    ``,
    `🌐 <b>웹에서 1초 복사 &amp; PDF 다운로드 센터</b>:`,
    `<a href="https://truthofmarket.com/samples/6_naver_cafe_pack/">https://truthofmarket.com/samples/6_naver_cafe_pack/</a>`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `🛠️ <b>[5분 완성] 네이버 카페 게시판(메뉴) 세팅 구조</b>`,
    `• <b>그룹 1: 📌 키즈핏 필독 &amp; 공지</b>`,
    `  └ 📢 전체 공지사항 / 👋 반가운 가입인사 / 🌐 1분 무료 진단 바로가기`,
    `• <b>그룹 2: 🎁 무료 워크지 PDF &amp; 칼럼 자료실</b>`,
    `  └ 🖨️ 연령별 무료 워크지 PDF 나눔 / 📏 신체성장 칼럼 / 🧠 두뇌학습 칼럼 / 🎨 주말 박물관 코스`,
    `• <b>그룹 3: 📅 매월 1일 성장·학습 인증 &amp; 소통</b>`,
    `  └ 📸 매월 1일 키즈핏 리포트 인증방 / 💬 또래 학부모 고민 수다방 / ⭐ 내돈내산 교구·도서 후기방`,
    `━━━━━━━━━━━━━━━━━━`,
    `👇 아래로 <b>워크지 미리보기 이미지 + 인쇄용 고화질 A4 PDF 원본 3개 + 카페 공지글 복붙 원고 3개</b>를 순서대로 전송합니다!`
  ].join('\n');

  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: introHtml,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  });
  console.log('  ✓ [1/6] Sent Intro & Menu Setup message');

  // 2. Send 3 Preview Photos + 3 Printable A4 PDF Documents
  const pdfItems = [
    {
      png: '01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.png',
      pdf: '01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.pdf',
      caption: '① [만 3~6세 유아용] 손끝 소근육 선긋기·대칭도형·안전가위 워크지 (A4 프린트용 PDF)'
    },
    {
      png: '02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.png',
      pdf: '02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.pdf',
      caption: '② [초·중등 학령기용] 학원 직후 5분 코넬식 백지복습 노트 & 주간 자기주도 계획표 (A4 프린트용 PDF)'
    },
    {
      png: '03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.png',
      pdf: '03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.pdf',
      caption: '③ [전 연령 공통] 냉장고 부착용 매월 1일 키·몸무게 기록표 & 밤 10시 꿀잠 30일 스티커판 (A4 프린트용 PDF)'
    }
  ];

  for (let i = 0; i < pdfItems.length; i++) {
    const item = pdfItems[i];
    const pngPath = path.join(PACK_DIR, item.png);
    const pdfPath = path.join(PACK_DIR, item.pdf);
    if (fs.existsSync(pngPath)) {
      await sendTelegramPhoto(cfg.botToken, cfg.chatId, pngPath, `🖼️ 미리보기 ${item.caption}`);
    }
    if (fs.existsSync(pdfPath)) {
      await sendTelegramDocument(cfg.botToken, cfg.chatId, pdfPath, `📥 카페 첨부용 원본 파일: ${item.caption}`, 'application/pdf');
    }
    console.log(`  ✓ [${i + 2}/6] Sent Photo + PDF for Worksheet #${i + 1}`);
  }

  // 3. Send Combined Text File + Individual Copy-Ready Cafe Posts
  const combinedTxtPath = path.join(PACK_DIR, '키즈핏_네이버카페_즉시복붙_공지및게시글_4종세트.txt');
  if (fs.existsSync(combinedTxtPath)) {
    await sendTelegramDocument(
      cfg.botToken,
      cfg.chatId,
      combinedTxtPath,
      '📋 [통합 텍스트 파일] 네이버 카페 즉시 복붙용 공지글·게시글·메뉴세팅 4종 세트 (.txt)',
      'text/plain; charset=utf-8'
    );
  }

  const postFiles = [
    { file: 'post_01_카페대문_전체환영공지글.txt', header: '📌 <b>[그대로 복사해서 쓰세요 ①: 카페 전체 환영 공지글]</b>' },
    { file: 'post_02_연령별_무료워크지3종_나눔게시글.txt', header: '🎁 <b>[그대로 복사해서 쓰세요 ②: 무료 워크지 PDF 3종 나눔 게시글]</b>\n<i>(위에서 보내드린 PDF 3개를 첨부해서 올려주세요!)</i>' },
    { file: 'post_03_매월1일_키즈핏리포트_인증챌린지_공지글.txt', header: '📅 <b>[그대로 복사해서 쓰세요 ③: 매월 1일 키즈핏 리포트 인증 챌린지 공지글]</b>' }
  ];

  for (const pf of postFiles) {
    const pPath = path.join(POSTS_DIR, pf.file);
    if (fs.existsSync(pPath)) {
      const content = fs.readFileSync(pPath, 'utf8').trim();
      const msgHtml = `${pf.header}\n━━━━━━━━━━━━━━━━━━\n${escapeHtml(content)}`;
      await telegramApiRequest(cfg.botToken, 'sendMessage', {
        chat_id: cfg.chatId,
        text: msgHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
    }
  }
  console.log('  ✓ [6/6] Sent all copy-ready Cafe posts to Telegram!');
}

main().catch(err => {
  console.error('[Error sending Naver Cafe pack]:', err.message);
  process.exit(1);
});
