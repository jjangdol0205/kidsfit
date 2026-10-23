#!/usr/bin/env node
/**
 * scripts/send_daily_visitor_briefing_telegram.js
 * Fetches live visitor & funnel analytics from https://kidsfit.co.kr/api/stats
 * (with fallback/merge from local logs/visitor_analytics.json) and sends a
 * daily executive visitor briefing to the user's Telegram.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { getTelegramConfig, telegramApiRequest } = require('./telegram-notify');

const ROOT_DIR = path.resolve(__dirname, '..');
const LOCAL_ANALYTICS_PATH = path.join(ROOT_DIR, 'logs', 'visitor_analytics.json');
const KB_PATH = path.join(ROOT_DIR, 'src', 'data', 'research-knowledge-base.json');

function fetchJson(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'KidsFit-Daily-Briefing-Internal/1.0',
          Accept: 'application/json',
        },
        timeout: timeoutMs,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (_) {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

function getKstDateString(offsetDays = 0) {
  const ms = Date.now() + 9 * 3600 * 1000 + offsetDays * 86400 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

async function main() {
  const cfg = getTelegramConfig();
  if (!cfg.isConfigured || !cfg.chatId) {
    throw new Error('Telegram configuration missing in .env');
  }

  // 1. Fetch live stats from https://kidsfit.co.kr/api/stats
  const liveResp = await fetchJson('https://kidsfit.co.kr/api/stats');
  let analytics = liveResp && liveResp.analytics ? liveResp.analytics : null;

  // Fallback to local logs/visitor_analytics.json if live endpoint hasn't updated yet
  if (!analytics && fs.existsSync(LOCAL_ANALYTICS_PATH)) {
    try {
      const localData = JSON.parse(fs.readFileSync(LOCAL_ANALYTICS_PATH, 'utf8'));
      const todayStr = getKstDateString(0);
      const yesterdayStr = getKstDateString(-1);
      analytics = {
        kstDate: todayStr,
        today: (localData.daily && localData.daily[todayStr]) || {},
        yesterday: (localData.daily && localData.daily[yesterdayStr]) || {},
        total: localData.total || {},
      };
    } catch (_) {}
  }

  const todayStr = (analytics && analytics.kstDate) || getKstDateString(0);
  const today = (analytics && analytics.today) || {};
  const yesterday = (analytics && analytics.yesterday) || {};
  const total = (analytics && analytics.total) || {};

  const tUv = Number(today.uv || 0);
  const tPv = Number(today.pv || 0);
  const yUv = Number(yesterday.uv || 0);
  const yPv = Number(yesterday.pv || 0);
  const totUv = Number(total.uv || tUv);
  const totPv = Number(total.pv || tPv);

  const devMobile = Number((today.devices && today.devices.mobile) || 0);
  const devDesktop = Number((today.devices && today.devices.desktop) || 0);
  const tBots = Number(today.bots || 0);
  const totBots = Number(total.bots || tBots);

  const refs = today.referrers || {};
  const rInsta = Number(refs.instagram || 0);
  const rThreads = Number(refs.threads || 0);
  const rBlog = Number(refs.naver_blog || 0);
  const rCafe = Number(refs.naver_cafe || 0);
  const rNaver = Number(refs.naver_search_clip || 0);
  const rOtherSearch = Number(refs.google_daum_kakao || 0);
  const rDirect = Number(refs.direct || 0);

  const diag = today.diagnoses || {};
  const tDiagTotal = Number(diag.total || 0);
  const tDiagGrowth = Number(diag.growth || 0);
  const tDiagLearning = Number(diag.learning || 0);
  const totDiagTotal = Number((total.diagnoses && total.diagnoses.total) || tDiagTotal);

  const tAffClicks = Number(today.affiliateClicks || 0);
  const totAffClicks = Number(total.affiliateClicks || tAffClicks);

  // 2. Read paper KB count
  let totalPapers = 2810;
  let growthPapers = 1195;
  let learningPapers = 1615;
  if (fs.existsSync(KB_PATH)) {
    try {
      const kb = JSON.parse(fs.readFileSync(KB_PATH, 'utf8'));
      const meta = kb.metadata || {};
      totalPapers = Number(meta.total_papers) || (Array.isArray(kb.papers) ? kb.papers.length : 2810);
      const bal = (meta.learning_analytics && meta.learning_analytics.macro_pillar_balance) || {};
      growthPapers = Number(bal.growth_macro_count || 1195);
      learningPapers = Number(bal.learning_macro_count || 1615);
    } catch (_) {}
  }

  const msg =
    `📊 [키즈핏(kidsfit.co.kr) 일일 홈페이지 방문자 & 성과 브리핑]\n` +
    `📅 기준 일자: ${todayStr} (한국시간 KST)\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👥 1. 홈페이지 방문자 현황 (실시간 집계)\n` +
    `• 오늘 순방문자(UV): ${tUv.toLocaleString()}명 (페이지뷰 PV: ${tPv.toLocaleString()}회)\n` +
    `• 어제 순방문자(UV): ${yUv.toLocaleString()}명 (페이지뷰 PV: ${yPv.toLocaleString()}회)\n` +
    `• 누적 총 방문자(UV): ${totUv.toLocaleString()}명 (누적 PV: ${totPv.toLocaleString()}회)\n` +
    `• 접속 기기: 📱 모바일 ${devMobile.toLocaleString()}회 / 💻 PC ${devDesktop.toLocaleString()}회\n` +
    `• 검색엔진 로봇 수집: 🤖 오늘 ${tBots.toLocaleString()}회 (누적 ${totBots.toLocaleString()}회)\n\n` +
    `🌐 2. 오늘 채널별 유입 경로\n` +
    `• 📸 인스타그램 (@kids_fit1): ${rInsta.toLocaleString()}회\n` +
    `• 🧵 쓰레드 (@kids_fit1): ${rThreads.toLocaleString()}회\n` +
    `• 📝 네이버 블로그 (expertise333): ${rBlog.toLocaleString()}회\n` +
    `• ☕ 네이버 카페 (moneyfitlab): ${rCafe.toLocaleString()}회\n` +
    `• 🔍 네이버 검색 · 클립: ${rNaver.toLocaleString()}회\n` +
    `• 🌍 구글 · 다음 · 카톡 공유: ${rOtherSearch.toLocaleString()}회\n` +
    `• 🔗 직접 접속 · 북마크: ${rDirect.toLocaleString()}회\n\n` +
    `🎯 3. 진단 완료 & 제휴 클릭 전환\n` +
    `• 오늘 진단 리포트 발급: 총 ${tDiagTotal.toLocaleString()}건 (📏 신체성장 ${tDiagGrowth}건 / 🧠 두뇌·학습 ${tDiagLearning}건)\n` +
    `• 오늘 제휴 상품 클릭(쿠팡·YES24 등): 총 ${tAffClicks.toLocaleString()}건\n` +
    `• 누적 진단 리포트: 총 ${totDiagTotal.toLocaleString()}건 / 누적 제휴 클릭: ${totAffClicks.toLocaleString()}건\n\n` +
    `📚 4. AI 학술논문 자가학습 누적 (보고서 최하단 반영)\n` +
    `• 총 ${totalPapers.toLocaleString()}편 (신체성장 ${growthPapers.toLocaleString()}편 / 두뇌·학습 ${learningPapers.toLocaleString()}편)\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⏰ 매일 하루 1번(오전 9시 KST) 이 양식으로 홈페이지 방문자 수와 채널별 유입·전환 브리핑을 자동 전송해 드립니다!`;

  await telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text: msg,
    disable_web_page_preview: true,
  });

  console.log('✅ 일일 홈페이지 방문자 브리핑 텔레그램 전송 완료!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
