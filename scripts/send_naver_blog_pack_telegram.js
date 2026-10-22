#!/usr/bin/env node
/**
 * scripts/send_naver_blog_pack_telegram.js
 * Sends the 7-Day Daily Naver Blog Publishing Pack (7 Custom Infographics, 7 Full 2,200+ Char Posts,
 * Combined Master TXT, and Copy-Ready Messages) directly to Telegram.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { getTelegramConfig, telegramApiRequest, sendTelegramPhoto, escapeHtml } = require('./telegram-notify');

const ROOT_DIR = path.resolve(__dirname, '..');
const PACK_DIR = path.join(ROOT_DIR, 'samples', '7_naver_blog_daily_pack');
const POSTS_DIR = path.join(PACK_DIR, 'posts');

function sendTelegramDocument(botToken, chatId, filePath, caption = '', mimeType = 'text/plain; charset=utf-8') {
  return new Promise((resolve, reject) => {
    const boundary = '----KidsFitBlogBoundary' + Date.now().toString(16) + Math.random().toString(16).slice(2);
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

  // 1. Send Overview & 7-Day Schedule Message
  const introHtml = [
    `✍️ <b>[키즈핏 네이버 블로그 1일 1포스팅 7일 연속 패키지 제작 &amp; 전송 완료!]</b>`,
    ``,
    `매일 하나씩 바로 복사해서 올리실 수 있도록 <b>상업적 키워드를 100% 뺀 순수 고품질 정보 칼럼 7편(DAY 1 ~ DAY 7, 각 2,000자 이상)</b>과 <b>각 글에 넣을 전용 대표 인포그래픽 이미지 7장</b>을 모두 제작했습니다!`,
    ``,
    `🌐 <b>스마트폰·PC 1초 복사 &amp; 이미지 다운로드 웹 센터</b>:`,
    `<a href="https://truthofmarket.com/samples/7_naver_blog_daily_pack/">https://truthofmarket.com/samples/7_naver_blog_daily_pack/</a>`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `📅 <b>7일 연속 1일 1포스팅 발행 스케줄 (성장 50 : 학습 50)</b>`,
    `• <b>DAY 1 (오늘)</b>: 📏 아이 키 백분위 계산법 &amp; 부모 유전키(MPH) 넘어 숨은 키 +7cm 3가지 습관`,
    `• <b>DAY 2 (내일)</b>: 🧠 아이 나이에 안 맞는 교구 사주면 100% 방치템 되는 이유 (3세 소근육 vs 5세 가베 vs 초등 소마큐브)`,
    `• <b>DAY 3 (3일차)</b>: 🥛 우유 하루 3팩 마셔도 키 안 크는 이유? 배앓이 아이 체중별 칼슘·D3·아연 황금 조합`,
    `• <b>DAY 4 (4일차)</b>: 📐 단순 연산은 100점인데 문장제 수학만 별표 치는 아이 (전두엽 작업기억 3단계 도해법)`,
    `• <b>DAY 5 (5일차)</b>: 🔥 초등 사춘기 신호 시작됐나요? 급성장기(PHV) 골든타임 부모 체크리스트 5가지`,
    `• <b>DAY 6 (6일차)</b>: 🏛️ 주말 박물관 다녀와도 기억 못 하는 아이? 출발 전후 10분 하브루타 질문 3가지`,
    `• <b>DAY 7 (7일차)</b>: 🌙 밤 10시 서파수면이 낮에 배운 공부(장기기억)와 키 성장을 동시에 결정하는 이유`,
    `━━━━━━━━━━━━━━━━━━`,
    `👇 아래로 <b>DAY 1~7 전용 대표 이미지 7장 + 개별 원고 파일(.txt) + 오늘 바로 복붙하실 DAY 1 원고 전문</b>을 전송해 드립니다! (7일 치를 다 쓰신 뒤 언제든 <i>"블로그 글 또 만들어줘"</i>라고 말씀하시면 8일차~14일차 새 주제를 즉시 만들어 드립니다!)`
  ].join('\n');

  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: introHtml,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  });
  console.log('  ✓ [1/4] Sent 7-Day Blog Pack Intro');

  // 2. Send Combined 7-Day Master TXT
  const masterTxt = path.join(PACK_DIR, '키즈핏_네이버블로그_7일연속_1일1포스팅_마스터팩.txt');
  if (fs.existsSync(masterTxt)) {
    await sendTelegramDocument(
      cfg.botToken,
      cfg.chatId,
      masterTxt,
      '📚 [통합 합본] 키즈핏 네이버 블로그 7일 연속(DAY 1~7) 1일 1포스팅 전체 원고 모음집 (.txt)'
    );
  }

  // 3. Send Each Day's Custom Infographic Image + TXT File (DAY 1 ~ DAY 7)
  const days = [
    { day: 1, img: 'blog_day01_growth_mph.png', txt: 'blog_day01_신체성장_키백분위와숨은키7cm.txt', label: 'DAY 1 (신체 성장 #1): 키 백분위 & 부모 유전키(MPH) 넘어 숨은 키 +7cm' },
    { day: 2, img: 'blog_day02_age_pedagogy.png', txt: 'blog_day02_두뇌학습_나이별교구와공부법순서.txt', label: 'DAY 2 (두뇌 학습 #1): 나이별 맞춤 교구(3세 소근육 vs 5세 가베 vs 초등 소마큐브)' },
    { day: 3, img: 'blog_day03_calcium_nutrition.png', txt: 'blog_day03_신체성장_우유배앓이와칼슘시너지.txt', label: 'DAY 3 (신체 성장 #2): 우유 배앓이 아이를 위한 칼슘·비타민D3·아연 황금 조합' },
    { day: 4, img: 'blog_day04_math_word_problem.png', txt: 'blog_day04_두뇌학습_문장제수학과작업기억.txt', label: 'DAY 4 (두뇌 학습 #2): 문장제 수학 별표 치는 진짜 이유 (전두엽 작업기억 도해법)' },
    { day: 5, img: 'blog_day05_puberty_goldentime.png', txt: 'blog_day05_신체성장_사춘기신호와급성장기골든타임.txt', label: 'DAY 5 (신체 성장 #3): 초등 사춘기 신호 체크리스트 5가지 & 급성장기 골든타임' },
    { day: 6, img: 'blog_day06_museum_havruta.png', txt: 'blog_day06_두뇌학습_주말박물관하브루타질문법.txt', label: 'DAY 6 (두뇌 학습 #3): 주말 박물관·과학관 효과 2배 높이는 하브루타 질문 3가지' },
    { day: 7, img: 'blog_day07_sleep_memory_growth.png', txt: 'blog_day07_통합칼럼_밤10시수면이공부와키를동시에바꾸는이유.txt', label: 'DAY 7 (성장×학습 통합 #4): 밤 10시 서파수면이 장기기억과 키 성장을 동시에 바꾸는 이유' }
  ];

  for (const d of days) {
    const imgPath = path.join(PACK_DIR, d.img);
    const txtPath = path.join(POSTS_DIR, d.txt);
    if (fs.existsSync(imgPath)) {
      await sendTelegramPhoto(cfg.botToken, cfg.chatId, imgPath, `🖼️ [${d.label}] 블로그 본문 삽입용 대표 이미지`);
    }
    if (fs.existsSync(txtPath)) {
      await sendTelegramDocument(cfg.botToken, cfg.chatId, txtPath, `📝 [${d.label}] 블로그 제목+본문+태그 원고 (.txt)`);
    }
    console.log(`  ✓ Sent DAY ${d.day} image + txt`);
  }

  // 4. Send DAY 1 Full Copy-Ready Text Directly in Chat so user can copy-paste right now
  const day1TxtPath = path.join(POSTS_DIR, 'blog_day01_신체성장_키백분위와숨은키7cm.txt');
  if (fs.existsSync(day1TxtPath)) {
    const rawDay1 = fs.readFileSync(day1TxtPath, 'utf8').trim();
    await telegramApiRequest(cfg.botToken, 'sendMessage', {
      chat_id: cfg.chatId,
      text: `📌 <b>[오늘 바로 복사해 올리실 DAY 1 블로그 원고 전문]</b>\n━━━━━━━━━━━━━━━━━━\n${escapeHtml(rawDay1)}`,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
  }

  console.log('  ✓ [4/4] All 7-Day Naver Blog items sent to Telegram!');
}

main().catch(err => {
  console.error('[Error sending Naver Blog pack]:', err.message);
  process.exit(1);
});
