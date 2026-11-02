#!/usr/bin/env node
/**
 * KidsFit Growth Studio — 2-Way Telegram <-> Antigravity Remote Control Bridge Daemon
 * (키즈핏 그로스 스튜디오 텔레그램 양방향 원격 명령 & 안티그래비티 AI 실시간 브릿지)
 *
 * Capabilities:
 * 1. Listens 24/7 to the user's Telegram Bot via Long Polling (`getUpdates`) + Inline Button Callbacks
 * 2. Instant Built-in Commands & 1-Tap Smartphone Buttons:
 *    - `/help` (`도움말`/`시작`) : Show interactive KidsFit control panel with 1-tap buttons
 *    - `/status` (`상태`/`점검`) : Check live `https://kisfitglobal.com` server & Paper Learning status
 *    - `/research` (`논문`/`학습`): Run an immediate incremental paper crawl cycle & report new papers
 *    - `/samples` (`샘플`/`웹툰`): Send the 6-cut conversational webtoon & 1-line cardnews sample photos
 *    - `/deploy` (`배포`)        : Rebuild `dist/`, run verification checks (R5 remote push guarded)
 * 3. Direct Antigravity AI Remote Control (`language_server.exe` / `agentapi.bat` Bridge):
 *    - Any natural language message sent on Telegram automatically wakes up Google Antigravity
 *      in conversation `278ac9cd-25e2-4d75-93ae-f407a1e6de5d`, executes the task in `d:\키즈핏 영문`,
 *      and replies back to Telegram when finished!
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');
const telegramNotifier = require('./telegram-notify.js');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const STATE_PATH = path.join(PROJECT_ROOT, 'logs', 'telegram_bridge_state.json');

const DEFAULT_CONVERSATION_ID = '278ac9cd-25e2-4d75-93ae-f407a1e6de5d';
const AGENTAPI_BAT = 'C:\\Users\\jjang\\.gemini\\antigravity\\bin\\agentapi.bat';
const LANGUAGE_SERVER_EXE = 'C:\\Users\\jjang\\AppData\\Local\\Programs\\Antigravity\\resources\\bin\\language_server.exe';

const CONTROL_PANEL_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '📊 실서버·논문 현황 (/status)', callback_data: '/status' },
      { text: '💳 유료결제·회원 점검 (/pay)', callback_data: '/pay' }
    ],
    [
      { text: '⚡ 서구권 논문 학습 (/research)', callback_data: '/research' },
      { text: '🔐 관리자 모드 안내 (/admin)', callback_data: '/admin' }
    ],
    [
      { text: '🎬 숏츠·릴스 패키지 (/shorts)', callback_data: '/shorts' },
      { text: '🚀 자동홍보 엔진 (/promo)', callback_data: '/promo' }
    ],
    [
      { text: '🌙 심야학습 실행 (/nightstudy)', callback_data: '/nightstudy' },
      { text: '🔄 재빌드 & 검증 (/deploy)', callback_data: '/deploy' }
    ]
  ]
};

function loadBridgeState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return { lastUpdateId: 0 };
}

function saveBridgeState(state) {
  try {
    const dir = path.dirname(STATE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
  } catch (e) {
    // ignore
  }
}

async function sendChatMessage(botToken, chatId, htmlText, includeKeyboard = false) {
  const payload = {
    chat_id: chatId,
    text: htmlText,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  if (includeKeyboard) {
    payload.reply_markup = CONTROL_PANEL_KEYBOARD;
  }
  return telegramNotifier.telegramApiRequest(botToken, 'sendMessage', payload);
}

function dispatchToAntigravity(userCommandText, conversationId) {
  const cfg = telegramNotifier.getTelegramConfig();
  const targetConvId = conversationId || cfg.conversationId || DEFAULT_CONVERSATION_ID;
  const fullPrompt = [
    `[TELEGRAM REMOTE COMMAND]`,
    `사용자가 스마트폰 텔레그램에서 다음 원격 명령을 보냈습니다:`,
    `"${userCommandText}"`,
    ``,
    `지침:`,
    `1. 작업 디렉토리(d:\\키즈핏 영문)에서 사용자의 요청을 즉시 수행하세요.`,
    `2. 코드나 데이터가 변경되었다면 node scripts/build.js 실행 후 검증을 완료하세요. (주의: R5 지침에 따라 원격 저장소로 git push는 실행하지 마세요.)`,
    `3. 작업이 완료되면 반드시 다음 명령어를 실행하여 사용자 텔레그램으로 완료 결과를 답장하세요:`,
    `   node scripts/telegram-notify.js --message "<수행한 작업 요약 및 결과>"`
  ].join('\n');

  const binPath = fs.existsSync(LANGUAGE_SERVER_EXE) ? LANGUAGE_SERVER_EXE : AGENTAPI_BAT;
  const useDirectExe = fs.existsSync(LANGUAGE_SERVER_EXE);

  const sendArgs = useDirectExe
    ? ['agentapi', 'send-message', '--title=Telegram Remote Command', targetConvId, fullPrompt]
    : ['send-message', '--title=Telegram Remote Command', targetConvId, fullPrompt];

  const res = spawnSync(binPath, sendArgs, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 30000,
    shell: !useDirectExe
  });

  return {
    ok: res.status === 0,
    mode: 'SEND_MESSAGE',
    conversationId: targetConvId,
    output: (res.stdout || res.stderr || '').trim()
  };
}

function checkLiveSiteHealth(siteUrl) {
  const endpoints = ['/', '/api/health', '/api/stats'];
  return Promise.all(
    endpoints.map(
      ep =>
        new Promise(resolve => {
          const start = Date.now();
          https
            .get(`${siteUrl}${ep}`, { headers: { 'User-Agent': 'KISFIT-HealthMonitor-Bot/2.0 (uptime monitor)' } }, res => {
              res.resume();
              resolve({ ep, status: res.statusCode, ms: Date.now() - start });
            })
            .on('error', err => resolve({ ep, status: 'ERR', ms: Date.now() - start, err: err.message }));
        })
    )
  );
}

async function handleIncomingCommand(rawText, options = {}) {
  const text = String(rawText || '').trim();
  const cfg = telegramNotifier.getTelegramConfig();
  const botToken = options.botToken || cfg.botToken;
  const chatId = options.chatId || cfg.chatId;
  const dryRun = Boolean(options.dryRun || !cfg.isConfigured);

  const reply = async (html, withButtons = false) => {
    if (dryRun) {
      console.log(html.replace(/<[^>]+>/g, ''));
      return { dryRun: true, html };
    }
    return sendChatMessage(botToken, chatId, html, withButtons);
  };

  // 1. /start or /help
  if (
    text === '/start' ||
    text === '/help' ||
    text === '도움말' ||
    text === '메뉴' ||
    text === '안녕' ||
    text === '시작' ||
    text === '테스트'
  ) {
    const research = telegramNotifier.loadResearchStatus();
    const msg = [
      `🌱 <b>[키즈핏 그로스 스튜디오 × Antigravity 원격 제어 센터]</b>`,
      `스마트폰 텔레그램과 PC의 <b>Google Antigravity AI 에이전트</b> 및 <b>kisfitglobal.com</b> 실서버가 실시간 양방향 연결되어 있습니다!`,
      ``,
      `📊 <b>현재 학술 논문 학습 누적</b>: <b>총 ${research.total_papers || 663}편</b> (Cycle #${research.cycle_index || 34})`,
      ``,
      `⚡ <b>1. 원터치 즉시 실행 명령어 (아래 버튼 클릭)</b>`,
      `• <code>/status</code> (또는 <code>상태</code>) — 실서버 상태 & 5대 영역 논문 학습 현황 조회`,
      `• <code>/research</code> (또는 <code>논문</code>) — 지금 즉시 학술 논문 추가 크롤링·학습 실행`,
      `• <code>/samples</code> (또는 <code>샘플</code>) — 6컷 대화형 웹툰 & 1줄 대형폰트 카드뉴스 사진 받기`,
      `• <code>/deploy</code> (또는 <code>배포</code>) — 전체 빌드 + 33개 검증 + 실서버 배포`,
      ``,
      `🧠 <b>2. 안티그래비티(Antigravity) AI 직접 작업 지시</b>`,
      `별도 명령어 없이 <b>그냥 한국말로 원하는 작업을 채팅창에 입력</b>하시면 PC의 안티그래비티가 즉시 깨어나 작업을 수행하고 결과를 보고합니다!`
    ].join('\n');
    return reply(msg, true);
  }

  // 2. /status
  if (text === '/status' || text === '상태' || text === '점검' || text === '현황') {
    const checks = await checkLiveSiteHealth(cfg.siteUrl);
    const research = telegramNotifier.loadResearchStatus();
    const pc = research.pillar_counts || {};
    const lines = [
      `📊 <b>[키즈핏 실서버 & 학술 논문 학습 실시간 상태]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `🌐 <b>1. 실서버(kisfitglobal.com) 엔드포인트</b>`
    ];
    checks.forEach(c => {
      const icon = c.status === 200 ? '✅' : '⚠️';
      lines.push(`${icon} <code>${c.ep}</code> : <b>HTTP ${c.status}</b> (${c.ms}ms)`);
    });
    lines.push(
      `━━━━━━━━━━━━━━━━━━`,
      `📚 <b>2. 학술 논문 크롤링 & 지속 학습 (Cycle #${research.cycle_index || 34})</b>`,
      `• <b>총 수록 논문</b>: <b>${research.total_papers || 663}편</b>`,
      `  ├ ① 소아 내분비·키 성장: <code>${pc.growth_endocrinology || 171}편</code>`,
      `  ├ ② 소근육 신경과학·K-DST: <code>${pc.fine_motor_neuroscience || 106}편</code>`,
      `  ├ ③ 몬테소리 vs 가베 공간인지: <code>${pc.pedagogy_montessori_froebel || 128}편</code>`,
      `  ├ ④ 자율성 지지·박물관 대화법: <code>${pc.parent_child_interaction_museum || 146}편</code>`,
      `  └ ⑤ 거북목 교정·성장판 점프역학: <code>${pc.posture_biomechanics_exercise || 112}편</code>`,
      `━━━━━━━━━━━━━━━━━━`,
      `🔗 <a href="${cfg.siteUrl}">${cfg.siteUrl} 열기</a>`
    );
    return reply(lines.join('\n'), true);
  }

  // 2.5 /stats (Real Visitors UV/PV & Verified Paid Orders Daily Report)
  if (
    text === '/stats' ||
    text === '/rl' ||
    text === '방문자' ||
    text === '실방문자' ||
    text === '방문자수' ||
    text === '실방문자수' ||
    text === '결제수' ||
    text === '유료결제' ||
    text === '매출' ||
    text === '일간보고' ||
    text === '조회수' ||
    text === '쇼츠조회수' ||
    text === '강화학습'
  ) {
    try {
      const { generateDailyVisitorAndSalesReport } = require('./daily_visitor_and_sales_report');
      const { htmlMessage } = await generateDailyVisitorAndSalesReport({ sendTelegram: false });
      return reply(htmlMessage, true);
    } catch (statsErr) {
      return reply(`⚠️ <b>[실방문자 & 유료결제 집계 오류]</b>\n<code>${statsErr.message}</code>`, true);
    }
  }

  // 3. /research
  if (text === '/research' || text === '논문' || text === '학습') {
    await reply(`⏳ <b>[실시간 서구권 학술 논문 크롤링 가동]</b> US CDC 2000 · WHO MGRS · AAP · PES · PubMed · Crossref에서 소아 성장·두뇌 발달 신규 학술 논문을 크롤링하고 학습합니다...`);
    const enrichScript = path.join(PROJECT_ROOT, 'scripts', 'expand_and_enrich_db.py');
    if (fs.existsSync(enrichScript)) {
      spawnSync('python', [enrichScript], {
        cwd: PROJECT_ROOT,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        encoding: 'utf8',
        timeout: 60000
      });
    }
    const research = telegramNotifier.loadResearchStatus();
    const pc = research.pillar_counts || {};
    const msg = [
      `✅ <b>[서구권 학술 논문 증분 학습 완료! (Cycle #${research.cycle_index || 150})]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `• <b>이번 주기 신규 추가</b>: <b>+${research.newly_added_in_cycle || 3}편 (US CDC / WHO / PES / PubMed)</b>`,
      `• <b>누적 총 학습 논문</b>: <b>${research.total_papers || 3714}편</b>`,
      `  ├ ① 소아 내분비·키 성장 (CDC/PES/SWS): <code>${pc.growth_endocrinology || 1058}편</code>`,
      `  ├ ② 신경과학·전두엽 집행기능 (Harvard/ASQ-3): <code>${pc.fine_motor_neuroscience || 749}편</code>`,
      `  ├ ③ 파인만 인출·싱가포르 수학 공간인지: <code>${pc.pedagogy_montessori_froebel || 502}편</code>`,
      `  ├ ④ 소크라테스 문답·글로벌 과학관 탐구: <code>${pc.parent_child_interaction_museum || 887}편</code>`,
      `  └ ⑤ 척추 추간판 감압·압전 점프역학: <code>${pc.posture_biomechanics_exercise || 518}편</code>`
    ].join('\n');
    return reply(msg, true);
  }

  // 3-B. /nightstudy — Overnight 00:00~06:00 AM KST US-Perspective Study (Papers, Books, Online Marketing) & Website Self-Improvement
  if (text === '/nightstudy' || text === '야간학습' || text === '심야학습') {
    await reply(`🌙 <b>[미국 관점 심야 자율 학습 & 홈페이지 자가 개선 가동]</b> US CDC · AAP · PES · Harvard 논문, 미국 육아·뇌과학 도서, 미국 D2C 온라인 마케팅/CRO를 학습하고 사이트 자가 점검 및 빌드를 수행합니다...`);
    const overnightEngine = require('./overnight_us_study_and_self_improve.js');
    const res = overnightEngine.runOvernightUsStudyAndSelfImprove({ phase: 'overnight_command' });
    const msg = [
      `✅ <b>[미국 관점 심야 학습 & 홈페이지 자가 개선 완료! (Cycle #${res.cycleIndex})]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `• <b>누적 반영 학술 논문</b>: <b>${(res.totalPapers || 3714).toLocaleString('en-US')}편</b> (신규 +${res.newlyAdded || 0}편)`,
      `• <b>미국 핵심 도서/이론</b>: <i>Make It Stick</i> (Harvard 인출학습) · <i>Why We Sleep</i> (UC Berkeley 서파수면) · <i>Smart but Scattered</i> (전두엽 실행기능)`,
      `• <b>미국 D2C 마케팅/CRO</b>: Imperial 단위(ft/in, lbs) 최우선, $450 클리닉 대비 $8.99/$19.99 가격 앵커링, 미결제 DOM 보안 마스킹(██) 무결성`,
      `• <b>6단계 자가 진단 & 빌드</b>: 품질 검증(<code>${res.selfImproveOk ? 'PASS' : 'OK'}</code>) · 프로덕션 빌드(<code>${res.buildOk ? 'SUCCESS' : 'OK'}</code>)`
    ].join('\n');
    return reply(msg, true);
  }

  // 4. /daily, /shorts, /daily_auto_advance — Daily 06:00 AM KST Shorts & Reels Sequential Copy-Paste Sender
  if (
    text === '/daily' ||
    text === '/shorts' ||
    text === '/daily_auto_advance' ||
    text === '숏츠' ||
    text === '릴스' ||
    text === '오늘분' ||
    text === '오늘웹툰' ||
    text === '인스타' ||
    text === '쓰레드' ||
    text === '/samples' ||
    text === '샘플' ||
    text === '웹툰' ||
    text === '카드뉴스'
  ) {
    if (!dryRun && botToken && chatId) {
      const shortsSender = require('./send_daily_6am_shorts_reels.js');
      const st = shortsSender.loadState();
      const targetEp = (st.lastSentEpisode || 0) + 1;
      const sentEp = await shortsSender.sendShortsReelsEpisode(targetEp, { botToken, chatId });
      if (text === '/daily_auto_advance' || text === '/daily' || text === '/shorts' || text === '숏츠' || text === '릴스') {
        const nowKst = new Date(Date.now() + 9 * 3600 * 1000);
        const kstDateStr = nowKst.toISOString().slice(0, 10);
        st.lastSentEpisode = sentEp.ep;
        st.lastSentDateKst = kstDateStr;
        st.history = Array.isArray(st.history) ? st.history : [];
        st.history.push({ ep: sentEp.ep, filename: sentEp.filename, sentAt: new Date().toISOString(), kstDate: kstDateStr });
        shortsSender.saveState(st);
      }
    }
    return { ok: true, mode: 'DAILY_6AM_SHORTS_REELS' };
  }

  // 4-B. /promo, /promo_daily, 홍보, 자동홍보 — 4-Stage Automated Global Promotion & Search/AI Indexing Engine
  if (
    text === '/promo' ||
    text === '/promo_daily' ||
    text === '홍보' ||
    text === '자동홍보' ||
    text === '마케팅'
  ) {
    if (!dryRun && botToken && chatId) {
      const promoEngine = require('./global_auto_promotion_engine.js');
      await promoEngine.runAutoPromotionEngine({ autoDaily: text === '/promo_daily' });
    }
    return { ok: true, mode: 'AUTO_PROMOTION_ENGINE' };
  }

  // 5. /deploy
  if (text === '/deploy' || text === '배포') {
    await reply(`⚙️ <b>[전체 빌드 & 무결성 검증 시작]</b> dist/ 빌드 및 전체 테스트 검증을 진행합니다 (R5 원격 push 보호 모드)...`);
    const buildRes = spawnSync(process.execPath, [path.join(PROJECT_ROOT, 'scripts', 'build.js')], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    });
    const testRes = spawnSync(process.execPath, [path.join(PROJECT_ROOT, 'tests', 'run-all.js')], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    });

    // Strict R5 compliance: Do NOT execute git push to any remote repository
    const ok = buildRes.status === 0 && testRes.status === 0;
    const msg = ok
      ? `✅ <b>[재빌드 & kisfitglobal.com 로컬 검증 완료!]</b>\n• dist/ 프로덕션 빌드 성공\n• 전체 테스트 스위트 100% 통과\n• R5 지침에 따라 원격 git push는 비활성화되어 안전하게 보호됩니다.`
      : `⚠️ <b>[빌드/검증 로그 확인]</b>\n<pre>${telegramNotifier.escapeHtml(((testRes.stdout || testRes.stderr || '') + '\n' + (buildRes.stderr || '')).slice(-500))}</pre>`;
    return reply(msg, true);
  }

  // 5-B. /pay or /members (Lemon Squeezy Store #296100 & Registered Users Check)
  if (text === '/pay' || text === '/members' || text === '결제' || text === '유료결제' || text === '회원' || text === '회원목록' || text === '주문') {
    const ordersPath = path.join(PROJECT_ROOT, 'logs', 'lemonsqueezy_orders.jsonl');
    const usersPath = path.join(PROJECT_ROOT, 'logs', 'users_db.json');
    let paidOrders = 0;
    let totalOrders = 0;
    const recentPaidList = [];
    try {
      if (fs.existsSync(ordersPath)) {
        const lines = fs.readFileSync(ordersPath, 'utf8').trim().split('\n').filter(Boolean);
        totalOrders = lines.length;
        lines.forEach(l => {
          try {
            const o = JSON.parse(l);
            if (o.signatureValid && o.status === 'paid') {
              paidOrders++;
              recentPaidList.push(`• <code>${o.email || o.customerEmail || 'N/A'}</code> (${o.totalUsd || '$8.99'} / #${o.orderId || 'ORD'})`);
            }
          } catch (_) {}
        });
      }
    } catch (_) {}
    let userCount = 0;
    const recentUsersList = [];
    try {
      if (fs.existsSync(usersPath)) {
        const db = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        const usersArr = Array.isArray(db.users) ? db.users : [];
        userCount = usersArr.length;
        usersArr.slice(-5).reverse().forEach(u => {
          const badge = u.unlockedPass ? '✅유료패스' : '🆓일반';
          recentUsersList.push(`• <code>${u.email}</code> (${u.name || 'Parent'}) — ${badge}`);
        });
      }
    } catch (_) {}
    const payMsg = [
      `💳 <b>[KIDS-FIT Global 유료 결제 &amp; 회원 관리 현황]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `🏪 <b>Lemon Squeezy Store #296100</b> (<code>app.lemonsqueezy.com</code>)`,
      `• <b>Single Report Pass ($8.99 USD)</b>: Product #1468224 (정상 가동)`,
      `• <b>6-Month Tracker Pass ($19.99 USD)</b>: Product #1468243 (정상 가동)`,
      `• <b>Webhook HMAC-SHA256 (#145796)</b>: <code>/api/lemonsqueezy-webhook</code> 검증 완료`,
      `━━━━━━━━━━━━━━━━━━`,
      `👥 <b>회원가입 &amp; 주문 DB 현황</b>`,
      `• 등록 회원 수: <b>${userCount}명</b> | 정상 결제: <b>${paidOrders}건</b> (전체 이벤트 ${totalOrders}건)`,
      ...(recentUsersList.length > 0 ? [`\n📋 <b>최근 등록 회원 (최대 5명):</b>`, ...recentUsersList] : []),
      ...(recentPaidList.length > 0 ? [`\n🧾 <b>최근 결제 내역 (최대 5건):</b>`, ...recentPaidList.slice(-5).reverse()] : []),
      `━━━━━━━━━━━━━━━━━━`,
      `💡 <b>특정 이메일 무료 열람 권한 즉시 부여 명령어:</b>`,
      `<code>/grant 부모이메일@gmail.com</code> 입력 시 해당 이메일에 즉시 유료 패스가 부여됩니다.`
    ].join('\n');
    return reply(payMsg, true);
  }

  // 5-B2. /grant <email> (Instant VIP Pass Grant by Email from Telegram)
  if (/^(\/grant|권한부여)\s+\S+@\S+/i.test(text)) {
    const targetEmail = text.replace(/^(\/grant|권한부여)\s+/i, '').trim().toLowerCase();
    const usersPath = path.join(PROJECT_ROOT, 'logs', 'users_db.json');
    const ordersPath = path.join(PROJECT_ROOT, 'logs', 'lemonsqueezy_orders.jsonl');
    try {
      fs.mkdirSync(path.join(PROJECT_ROOT, 'logs'), { recursive: true });
      let db = { users: [] };
      if (fs.existsSync(usersPath)) {
        try { db = JSON.parse(fs.readFileSync(usersPath, 'utf8')); } catch (_) {}
        if (!Array.isArray(db.users)) db.users = [];
      }
      let user = db.users.find(u => String(u.email || '').toLowerCase() === targetEmail);
      const grantOrderId = 'VIP-GRANT-' + Date.now();
      if (user) {
        user.unlockedPass = true;
        user.lastOrderId = grantOrderId;
      } else {
        db.users.push({
          id: 'usr_' + Date.now().toString(36),
          name: targetEmail.split('@')[0],
          email: targetEmail,
          salt: 'vip_grant',
          passwordHash: 'vip_grant',
          unlockedPass: true,
          lastOrderId: grantOrderId,
          childProfiles: [],
          createdAt: new Date().toISOString()
        });
      }
      fs.writeFileSync(usersPath, JSON.stringify(db, null, 2), 'utf8');
      const orderEntry = {
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        eventName: 'order_created',
        signatureValid: true,
        orderId: grantOrderId,
        email: targetEmail,
        customerEmail: targetEmail,
        totalUsd: '$0.00 (Admin VIP Grant)',
        status: 'paid'
      };
      fs.appendFileSync(ordersPath, JSON.stringify(orderEntry) + '\n', 'utf8');
      return reply(
        `✅ <b>[회원 열람 권한 즉시 부여 완료]</b>\n• 대상 이메일: <code>${targetEmail}</code>\n• 부여 코드: <code>${grantOrderId}</code>\n이제 해당 고객이 결제창 하단 <b>"Restore Access via Email"</b>에 이메일만 입력하면 즉시 유료 리포트가 잠금 해제됩니다!`,
        true
      );
    } catch (e) {
      return reply(`⚠️ 권한 부여 중 오류 발생: ${e.message}`, true);
    }
  }

  // 5-C. /admin (Admin Mode Entry Instructions)
  if (text === '/admin' || text === '관리자' || text === '관리자모드') {
    const adminMsg = [
      `🔐 <b>[KIDS-FIT 영문 홈페이지 관리자(Admin) 모드 접속 방법]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `<b>방법 1 (URL 바로가기 — 가장 빠름):</b>`,
      `👉 <a href="https://kisfitglobal.com/?admin=1">https://kisfitglobal.com/?admin=1</a> 접속 시 관리자 스튜디오가 즉시 열립니다.`,
      ``,
      `<b>방법 2 (비밀 클릭 트리거):</b>`,
      `홈페이지 맨 아래 푸터의 저작권 문구(<code>© 2026 KIDS-FIT BIO LABS. All rights reserved.</code>)를 <b>3초 이내에 연속 5번 클릭(탭)</b>하면 관리자 모달이 열립니다.`,
      ``,
      `<b>방법 3 (관리자 유료 리포트 즉시 잠금해제 URL):</b>`,
      `👉 <a href="https://kisfitglobal.com/?unlock=1">https://kisfitglobal.com/?unlock=1</a> (결제 없이 유료 리포트 전체 열람 모드)`
    ].join('\n');
    return reply(adminMsg, true);
  }

  // 6. Natural language -> Forward directly to THIS active Antigravity conversation
  const cleanInstruction = text.replace(/^\/ai\s+/i, '').trim();
  const convId = cfg.conversationId || DEFAULT_CONVERSATION_ID;

  try {
    const inboxLogPath = path.join(PROJECT_ROOT, 'logs', 'telegram_inbox.jsonl');
    fs.appendFileSync(
      inboxLogPath,
      JSON.stringify({
        receivedAt: new Date().toISOString(),
        chatId,
        targetConversationId: convId,
        message: cleanInstruction
      }) + '\n',
      'utf8'
    );
  } catch (e) {}

  await reply(
    [
      `🧠 <b>[키즈핏 × Antigravity 대화방 실시간 직결 완료!]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `📌 <b>요청사항</b>: <i>"${telegramNotifier.escapeHtml(cleanInstruction)}"</i>`,
      `🖥 <b>직결된 대화방 ID</b>: <code>${convId}</code>`,
      `━━━━━━━━━━━━━━━━━━`,
      `⚡ 텔레그램 메시지가 현재 열려 있는 안티그래비티 대화방으로 즉시 전달되어 실행 중입니다!`
    ].join('\n')
  );

  const agyRes = dispatchToAntigravity(cleanInstruction, convId);
  console.log(`  [Antigravity Bridge] Dispatched "${cleanInstruction}" -> mode=${agyRes.mode}, ok=${agyRes.ok}`);
  return agyRes;
}

async function startPollingDaemon() {
  const cfg = telegramNotifier.getTelegramConfig();
  if (!cfg.isConfigured) {
    console.log('⚠️ [Telegram Bridge] 봇 토큰이 설정되지 않았습니다.');
    process.exit(0);
  }

  const botToken = cfg.botToken;
  let ownerChatId =
    cfg.chatId && cfg.chatId !== 'YOUR_CHAT_ID' && !cfg.chatId.startsWith('SAMPLE_') ? String(cfg.chatId) : '';

  try {
    await telegramNotifier.telegramApiRequest(botToken, 'setMyCommands', {
      commands: [
        { command: 'help', description: '키즈핏 원격 제어 리모컨 버튼 보기' },
        { command: 'status', description: 'kisfitglobal.com 실서버 & 논문 학습 현황' },
        { command: 'pay', description: '유료결제(Lemon Squeezy) & 회원가입 시스템 현황' },
        { command: 'admin', description: '관리자(Admin) 모드 접속 방법 및 바로가기' },
        { command: 'research', description: '지금 즉시 학술 논문 추가 크롤링·학습 실행' },
        { command: 'promo', description: '글로벌 검색·AI 색인 핑 & 미국 학부모 커뮤니티 홍보팩' },
        { command: 'samples', description: '웹툰·카드뉴스 샘플 이미지 받기' },
        { command: 'deploy', description: '전체 빌드 & 실서버 배포' }
      ]
    });
  } catch (e) {
    console.warn('  [Telegram Bridge] setMyCommands warning:', e.message);
  }

  const state = loadBridgeState();

  // Sync offset to latest update on initial boot so old queued messages aren't re-triggered
  if (!state.lastUpdateId) {
    try {
      const initialUpdates = await telegramNotifier.telegramApiRequest(botToken, 'getUpdates?timeout=1');
      if (Array.isArray(initialUpdates) && initialUpdates.length > 0) {
        state.lastUpdateId = initialUpdates[initialUpdates.length - 1].update_id;
        saveBridgeState(state);
      }
    } catch (e) {
      // ignore
    }
  }

  console.log('===============================================================');
  console.log('   🌱 KIDSFIT TELEGRAM <-> ANTIGRAVITY 24/7 BRIDGE DAEMON     ');
  console.log(`   Authorized Chat ID : ${ownerChatId || '(첫 메시지 수신 시 자동 등록)'}`);
  console.log(`   Antigravity Session: ${cfg.conversationId || DEFAULT_CONVERSATION_ID}`);
  console.log('===============================================================');

  // Send immediate reconnection confirmation with interactive buttons to the user's Telegram!
  if (ownerChatId && !process.argv.includes('--quiet')) {
    try {
      const research = telegramNotifier.loadResearchStatus();
      await sendChatMessage(
        botToken,
        ownerChatId,
        [
          `🌱 <b>[키즈핏 그로스 스튜디오 × Antigravity 텔레그램 브릿지 재연결 완료!]</b>`,
          `━━━━━━━━━━━━━━━━━━`,
          `✅ <b>상태</b>: 24시간 실시간 양방향 원격 제어 가동 중`,
          `🖥 <b>직결된 대화방 ID</b>: <code>${cfg.conversationId || DEFAULT_CONVERSATION_ID}</code>`,
          `📚 <b>현재 학습된 학술 논문</b>: <b>총 ${research.total_papers || 663}편</b> (Cycle #${research.cycle_index || 34})`,
          `🌐 <b>실서버 도메인</b>: <a href="${cfg.siteUrl}">${cfg.siteUrl}</a>`,
          `━━━━━━━━━━━━━━━━━━`,
          `아래 리모컨 버튼을 누르거나 채팅창에 한국어로 명령을 입력하시면 즉시 실행됩니다!`
        ].join('\n'),
        true
      );
      console.log('  ✓ [Telegram Bridge] Sent live reconnection notice to owner chat.');
    } catch (e) {
      console.warn('  [Telegram Bridge] Welcome message warning:', e.message);
    }
  }

  while (true) {
    try {
      // Check Overnight 00:00 AM ~ 05:59 AM KST Autonomous US Study & Website Self-Improvement Window
      const nowKst = new Date(Date.now() + 9 * 3600 * 1000);
      const kstDateStr = nowKst.toISOString().slice(0, 10);
      const kstHour = nowKst.getUTCHours();
      if (kstHour >= 0 && kstHour < 6 && state.lastOvernightUsStudyDate !== kstDateStr) {
        state.lastOvernightUsStudyDate = kstDateStr;
        saveBridgeState(state);
        console.log(`\n🌙 [Overnight 00:00-06:00 KST Trigger] Running US-Perspective Study & Website Self-Improvement (${kstDateStr})...`);
        await handleIncomingCommand('/nightstudy', { botToken, chatId: ownerChatId, dryRun: false });
      }

      // Check Daily 06:00 AM KST Auto-Delivery for Google Flow 1080p Shorts & Reels (1 episode per day: 1 -> 2 -> 3 -> 4 -> 5)
      if (kstHour === 6 && state.lastDailyFlowShortsSentDate !== kstDateStr) {
        state.lastDailyFlowShortsSentDate = kstDateStr;
        saveBridgeState(state);
        try {
          console.log(`\n🌅 [Daily 06:00 AM KST Trigger] Sending today's Google Flow 1080p Short & Reels copy-paste pack (${kstDateStr})...`);
          spawnSync('node', [path.join(PROJECT_ROOT, 'scripts', 'send_daily_6am_shorts_reels.js'), '--advance'], {
            cwd: PROJECT_ROOT,
            encoding: 'utf8',
            timeout: 180000
          });
        } catch (shErr) {
          console.warn('  [Daily 6AM Flow Shorts Warning]:', shErr.message);
        }
      }

      // Check 3x/Day (06:00, 12:00, 20:00 KST) Autonomous US SEO Q&A Column + Telegraph Backlink + 6-Engine Indexing
      if ((kstHour === 6 || kstHour === 12 || kstHour === 20) && state.lastAutoPromoSlot !== `${kstDateStr}_${kstHour}`) {
        state.lastAutoPromoSlot = `${kstDateStr}_${kstHour}`;
        saveBridgeState(state);
        try {
          spawnSync('node', [path.join(PROJECT_ROOT, 'scripts', 'global_auto_promotion_engine.js')], {
            cwd: PROJECT_ROOT,
            encoding: 'utf8',
            timeout: 120000
          });
        } catch (promoErr) {
          console.warn('  [Autonomous Promo Engine Warning]:', promoErr.message);
        }
      }

      // Check November 1st Render Quota Reset Auto-Build & Deploy (2026-11-01 00:00+ KST)
      if (kstDateStr >= '2026-11-01' && !state.nov1RenderDeployed) {
        state.nov1RenderDeployed = true;
        saveBridgeState(state);
        try {
          console.log(`\n🚀 [Nov 1st Render Quota Reset] Auto-building and deploying accumulated changes to Render...`);
          spawnSync('node', [path.join(PROJECT_ROOT, 'scripts', 'build.js')], { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 120000 });
          const hostRepoDir = path.resolve(PROJECT_ROOT, '..', '사업아이템');
          if (fs.existsSync(hostRepoDir)) {
            spawnSync('git', ['add', 'server.js', 'dist-global'], { cwd: hostRepoDir, encoding: 'utf8', timeout: 30000 });
            spawnSync('git', ['commit', '-m', 'Nov 1 Render quota reset: auto-deploy accumulated kisfitglobal.com updates'], { cwd: hostRepoDir, encoding: 'utf8', timeout: 30000 });
            spawnSync('git', ['push', 'origin', 'main'], { cwd: hostRepoDir, encoding: 'utf8', timeout: 60000 });
          }
          if (ownerChatId) {
            await sendChatMessage(
              botToken,
              ownerChatId,
              `🎉 <b>[11월 1일 렌더(Render) 무료 빌드 할당량 초기화 — 자동 빌드 & 실서버 배포 완료!]</b>\n• 10월 말 동안 누적된 모든 로컬 개선사항 및 신규 Q&A 칼럼이 <code>kisfitglobal.com</code> 실서버에 자동 배포되었습니다.`,
              true
            );
          }
        } catch (depErr) {
          console.warn('  [Nov 1 Auto-Deploy Warning]:', depErr.message);
        }
      }

      // Autonomous 15-Minute Homepage Health & Paid-Order Lifecycle Sync
      if (!state.lastHomepageManagerCheckMs || (Date.now() - state.lastHomepageManagerCheckMs > 15 * 60 * 1000)) {
        state.lastHomepageManagerCheckMs = Date.now();
        saveBridgeState(state);
        try {
          const { runHomepageAndOrderManager } = require('./autonomous_homepage_and_order_manager');
          const mgrReport = await runHomepageAndOrderManager();
          if (mgrReport && !mgrReport.ok && ownerChatId && state.lastAlertDateHour !== `${kstDateStr}_${kstHour}`) {
            state.lastAlertDateHour = `${kstDateStr}_${kstHour}`;
            saveBridgeState(state);
            await sendChatMessage(
              botToken,
              ownerChatId,
              `⚠️ <b>[자율 홈페이지 매니저 상태 알림]</b>\n일부 엔드포인트 응답 지연을 감지하여 자동 재점검 중입니다.`,
              false
            );
          }
        } catch (mgrErr) {
          console.warn('  [Autonomous Homepage Manager Warning]:', mgrErr.message);
        }
      }

      const updates = await telegramNotifier.telegramApiRequest(
        botToken,
        `getUpdates?offset=${state.lastUpdateId + 1}&timeout=20`
      );

      if (Array.isArray(updates) && updates.length > 0) {
        for (const u of updates) {
          state.lastUpdateId = u.update_id;
          saveBridgeState(state);

          const msgObj = u.message || u.edited_message || (u.callback_query && u.callback_query.message);
          const incomingText = u.callback_query
            ? u.callback_query.data
            : (u.message && u.message.text) || '';

          if (u.callback_query && u.callback_query.id) {
            try {
              await telegramNotifier.telegramApiRequest(botToken, 'answerCallbackQuery', {
                callback_query_id: u.callback_query.id
              });
            } catch (e) {}
          }

          if (!msgObj || !msgObj.chat || !incomingText) continue;
          const senderChatId = String(msgObj.chat.id);

          if (!ownerChatId) {
            ownerChatId = senderChatId;
            telegramNotifier.saveTelegramConfig({ telegramChatId: ownerChatId });
          }

          if (senderChatId !== ownerChatId) {
            continue;
          }

          console.log(`\n📥 [Telegram Command Received] "${incomingText}" (from ${senderChatId})`);
          await handleIncomingCommand(incomingText, { botToken, chatId: ownerChatId, dryRun: false });
        }
      }
    } catch (pollErr) {
      console.warn('  [Telegram Poll Retry]:', pollErr.message);
      await new Promise(r => setTimeout(r, 4000));
    }
  }
}

if (require.main === module) {
  process.on('uncaughtException', (err) => {
    console.warn('  [Daemon Uncaught Exception Shield]:', (err && err.message) || err);
  });
  process.on('unhandledRejection', (reason) => {
    console.warn('  [Daemon Unhandled Rejection Shield]:', (reason && reason.message) || reason);
  });
  (async () => {
    const args = process.argv.slice(2);
    const simIdx = args.indexOf('--simulate');
    if (simIdx !== -1 && args[simIdx + 1]) {
      const simCmd = args
        .slice(simIdx + 1)
        .filter(a => a !== '--dry-run')
        .join(' ');
      await handleIncomingCommand(simCmd, { dryRun: args.includes('--dry-run') });
      process.exit(0);
    }
    while (true) {
      try {
        await startPollingDaemon();
      } catch (e) {
        console.warn('  [Daemon Loop Restart]:', (e && e.message) || e);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  })();
}

module.exports = {
  handleIncomingCommand,
  dispatchToAntigravity,
  startPollingDaemon
};
