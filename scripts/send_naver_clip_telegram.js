#!/usr/bin/env node
/**
 * scripts/send_naver_clip_telegram.js
 * Sends the newly generated Naver Clip bundled webtoon videos + guide to Telegram.
 */
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
const CLIP_DIR = path.resolve(__dirname, '../네이버클립_웹툰영상_모음');

function sendMultipart(endpoint, fieldName, filePath, contentType, caption) {
  return new Promise((resolve, reject) => {
    const boundary = '----KidsFitBoundary' + Date.now().toString(16);
    const filename = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);

    const parts = [];
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${CHAT_ID}\r\n`
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
      timeout: 120000
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
  const files = [
    {
      file: path.join(CLIP_DIR, '00_네이버클립_웹툰_1~3화_통합묶음_합본영상.mp4'),
      caption: '🎬 [네이버 클립용 웹툰 1~3화 통합 묶음 합본 영상 (1080x1920 세로형, 전체 12컷 연속)]\n• 1화(만 3세 소근육 민감기) + 2화(초등 문장제 수학 작업기억) + 3화(밤 10시 숙면 숨은 키 7cm) 전체 묶음 영상입니다!\n• 정보 스티커 링크: https://truthofmarket.com'
    },
    {
      file: path.join(CLIP_DIR, '01_네이버클립_웹툰1화_만3세소근육민감기.mp4'),
      caption: '🎬 [네이버 클립 1화] "내가 혼자 할 거야!" 만 3세 고집의 진짜 이유 (손끝 소근육 민감기 4컷 웹툰 영상)'
    },
    {
      file: path.join(CLIP_DIR, '02_네이버클립_웹툰2화_초등문장제수학작업기억.mp4'),
      caption: '🎬 [네이버 클립 2화] 연산은 100점인데 문장제 수학만 별표 치는 이유 (전두엽 작업기억 4컷 웹툰 영상)'
    },
    {
      file: path.join(CLIP_DIR, '03_네이버클립_웹툰3화_밤10시숙면숨은키7cm.mp4'),
      caption: '🎬 [네이버 클립 3화] 밤마다 우유 마셨는데 키 성장을 방해했다고? (밤 10시 성장호르몬 4컷 웹툰 영상)'
    },
    {
      file: path.join(CLIP_DIR, '04_네이버클립_카드뉴스_핵심요약_영상.mp4'),
      caption: '🎬 [네이버 클립 보너스] 6컷 핵심요약 카드뉴스 영상 (1080x1920 세로형)'
    },
    {
      file: path.join(CLIP_DIR, '05_네이버클립_업로드_제목_태그_정보스티커_가이드.txt'),
      caption: '📋 네이버 클립 업로드용 제목 · 해시태그 · 정보 스티커(링크) 복사 가이드 텍스트 파일'
    }
  ];

  for (const item of files) {
    if (!fs.existsSync(item.file)) continue;
    const isVideo = item.file.endsWith('.mp4');
    const res = await sendMultipart(
      isVideo ? 'sendVideo' : 'sendDocument',
      isVideo ? 'video' : 'document',
      item.file,
      isVideo ? 'video/mp4' : 'text/plain',
      item.caption
    );
    console.log('Sent:', path.basename(item.file), 'ok=', res.ok);
  }
})();
