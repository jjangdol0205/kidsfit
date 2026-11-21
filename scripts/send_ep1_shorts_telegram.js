#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const VIDEO_PATH = path.resolve(__dirname, '../samples/shorts_ep1_newborn/ep1_newborn_flow_couple_duet.mp4');

function sendMultipart(endpoint, fieldName, filePath, contentType, caption) {
  return new Promise((resolve, reject) => {
    const boundary = '----KidsFitBoundary' + Date.now().toString(16);
    const filename = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);

    const parts = [];
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${CHAT_ID}\r\n`
    ));
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="supports_streaming"\r\n\r\ntrue\r\n`
    ));
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="width"\r\n\r\n1080\r\n`
    ));
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="height"\r\n\r\n1920\r\n`
    ));
    if (caption) {
      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`
      ));
    }
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
    ));
    parts.push(fileData);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(parts);
    const req = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      },
      timeout: 180000
    }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(chunks);
          resolve(parsed);
        } catch (e) {
          resolve({ ok: false, raw: chunks });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  const stat = fs.statSync(VIDEO_PATH);
  console.log(`Uploading ${path.basename(VIDEO_PATH)} (${(stat.size / 1024 / 1024).toFixed(2)} MB) to Telegram...`);
  const caption =
    '🎬 [유튜브 쇼츠 1편 최종본] 신생아 육아 필수템 5가지 (1순위 추천: 부부 티키타카 더빙 · 초대형 후킹 자막 에디션)\n\n' +
    '✅ 러닝타임: 21.5초 (30fps · 1.2~1.3배속 실속도 컷편집)\n' +
    '✅ 오프닝 후킹 타이틀: 88pt / 98pt 초대형 사이즈 ("육아는 장비빨! / 신생아 필수템 5가지")\n' +
    '✅ 전체 본문 자막: 86pt~90pt 대형 1~2줄 키워드 자막 (음성 1:1 프레임 동기화 · 짤림 0%)\n' +
    '✅ AI 어색 구간 완벽 제거 (컷2 완결 지퍼 클로즈업/풀샷, 컷3 오픈 젖병 VFX, 컷5 클린 언박싱)\n\n' +
    '📌 유튜브 쇼츠 업로드 제목 추천:\n' +
    '육아는 장비빨! 조리원 퇴소 전 무조건 사야 할 신생아 필수템 5가지 #출산준비 #육아템 #신생아\n\n' +
    '📌 고정댓글 / 설명란 링크 문구:\n' +
    '영상 속 신생아 필수템 5가지 공식 혜택가 비교표 & 우리 아기 1:1 무료 발달진단 라운지 👉 https://kidsfit.co.kr';

  const res = await sendMultipart('sendVideo', 'video', VIDEO_PATH, 'video/mp4', caption);
  console.log('Telegram sendVideo result: ok=', res.ok, 'message_id=', res.result && res.result.message_id);
  if (!res.ok) {
    console.error('Error:', res);
    process.exit(1);
  }
})();
