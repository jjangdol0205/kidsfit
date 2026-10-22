#!/usr/bin/env node
/**
 * scripts/send_insta_profiles_and_pageflip_telegram.js
 * Sends:
 * 1) KidsFit Instagram & Threads Circular Profile Images (3 styles + preview + ZIP + Bio guide)
 * 2) Upgraded 16-second Page-Flipping Webtoon Videos (NO voice, soothing acoustic piano BGM only, 4s x 4 cuts = 16s)
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
const PROF_DIR = path.resolve(__dirname, '../인스타_쓰레드_프로필_모음');
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
          resolve(JSON.parse(chunks));
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
  // 1. Send Instagram & Threads Profile Images
  const profItems = [
    {
      file: path.join(PROF_DIR, '00_인스타쓰레드_원형적용_미리보기_3종비교.png'),
      endpoint: 'sendPhoto', field: 'photo', mime: 'image/png',
      caption: '📱 [KidsFit 인스타그램 & 쓰레드 원형 프로필 3종 비교 미리보기]\n인스타·쓰레드 동그란 프로필 프레임에 넣었을 때 가장 또렷하고 예쁘게 보이도록 원형 안전영역(Safe-Zone)에 맞춰 제작한 3가지 스타일입니다!'
    },
    {
      file: path.join(PROF_DIR, '01_키즈핏_인스타쓰레드_프로필_로얄인디고_엠블럼.png'),
      endpoint: 'sendDocument', field: 'document', mime: 'image/png',
      caption: '① [원본 1080x1080] 로얄인디고 프리미엄 엠블럼형 프로필 이미지'
    },
    {
      file: path.join(PROF_DIR, '02_키즈핏_인스타쓰레드_프로필_웜아이보리_감성툰형.png'),
      endpoint: 'sendDocument', field: 'document', mime: 'image/png',
      caption: '② [원본 1080x1080] 웜아이보리 감성 육아툰형 프로필 이미지'
    },
    {
      file: path.join(PROF_DIR, '03_키즈핏_인스타쓰레드_프로필_화이트클리닉_배지형.png'),
      endpoint: 'sendDocument', field: 'document', mime: 'image/png',
      caption: '③ [원본 1080x1080] 화이트 클리닉 성장곡선 배지형 프로필 이미지'
    },
    {
      file: path.join(PROF_DIR, '04_인스타_쓰레드_프로필소개글_링크_세팅가이드.txt'),
      endpoint: 'sendDocument', field: 'document', mime: 'text/plain',
      caption: '📋 인스타그램 & 쓰레드 프로필 이름 · 소개글(Bio) · 링크(truthofmarket.com) 복사 가이드'
    }
  ];

  for (const it of profItems) {
    if (!fs.existsSync(it.file)) continue;
    const r = await sendMultipart(it.endpoint, it.field, it.file, it.mime, it.caption);
    console.log('Profile sent:', path.basename(it.file), 'ok=', r.ok);
  }

  // 2. Send 16-second Page-Flipping Webtoon Videos (BGM only, no voice)
  const clipItems = [
    {
      file: path.join(CLIP_DIR, '01_네이버클립_웹툰1화_만3세소근육민감기.mp4'),
      caption: '📖 [16초 책넘김 웹툰 영상 · 1화 (음성 제거 / 잔잔한 피아노·오르골 BGM 전용)]\n• 4컷 × 4초 = 총 16초 동안 그림책 페이지가 넘어가듯 자연스럽게 넘어가는 영상입니다!'
    },
    {
      file: path.join(CLIP_DIR, '02_네이버클립_웹툰2화_초등문장제수학작업기억.mp4'),
      caption: '📖 [16초 책넘김 웹툰 영상 · 2화 (음성 제거 / 잔잔한 피아노·오르골 BGM 전용)]\n• 초등 문장제 수학 & 전두엽 작업기억 4컷 × 4초 = 16초 책넘김 영상'
    },
    {
      file: path.join(CLIP_DIR, '03_네이버클립_웹툰3화_밤10시숙면숨은키7cm.mp4'),
      caption: '📖 [16초 책넘김 웹툰 영상 · 3화 (음성 제거 / 잔잔한 피아노·오르골 BGM 전용)]\n• 밤 10시 숙면 & 숨은 키 7cm 루틴 4컷 × 4초 = 16초 책넘김 영상'
    },
    {
      file: path.join(CLIP_DIR, '00_네이버클립_웹툰_1~3화_통합묶음_합본영상.mp4'),
      caption: '📖 [웹툰 1~3화 전체 통합 책넘김 합본 영상 (음성 제거 / 잔잔한 피아노·오르골 BGM 전용)]'
    }
  ];

  for (const it of clipItems) {
    if (!fs.existsSync(it.file)) continue;
    const r = await sendMultipart('sendVideo', 'video', it.file, 'video/mp4', it.caption);
    console.log('Clip video sent:', path.basename(it.file), 'ok=', r.ok);
  }
})();
