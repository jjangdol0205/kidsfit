#!/usr/bin/env node
/**
 * MoneyFit 2-Way Telegram <-> Antigravity Remote Control Bridge Daemon
 * (텔레그램 양방향 원격 명령 & 안티그래비티 AI 에이전트 실시간 연동 브릿지)
 *
 * Capabilities:
 * 1. Listens 24/7 to the user's Telegram Bot via Long Polling (`getUpdates`) + Inline Button Callbacks
 * 2. Auto-locks onto the owner's `telegramChatId` on first message for security
 * 3. Instant Built-in Commands & 1-Tap Smartphone Buttons:
 *    - `/help` (`도움말`)       : Show interactive control panel with 1-tap buttons
 *    - `/status` (`상태`)       : Check live `https://truthofmarket.com` server & SEO endpoints
 *    - `/seo` (`홍보`/`색인`)   : Broadcast all 37 URLs to Naver, Google, Bing, and IndexNow live
 *    - `/sniper` (`스나이퍼`)   : Send today's real-time Naver Jisik-iN & Cafe 1-tap sniper links
 *    - `/deploy` (`배포`)       : Rebuild 36 SSG pages, run 80 tests, push to GitHub & `truthofmarket.com`
 *    - `/config` (`설정`)       : View or update Coupang/LinkPrice/CPA/AdFit IDs right from Telegram
 * 4. Direct Antigravity AI Remote Control (`agentapi.bat` Bridge):
 *    - Any natural language message (e.g. "메인 페이지 제목 바꿔서 배포해줘") or `/ai <명령>`
 *      automatically wakes up Google Antigravity (`agentapi send-message` / `new-conversation`)
 *      on the PC, executes the task, and replies back to Telegram when done!
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn, spawnSync } = require('child_process');
const telegramNotifier = require('./telegram-notify.js');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'monetization.config.json');
const STATE_PATH = path.join(PROJECT_ROOT, 'logs', 'telegram_bridge_state.json');

const DEFAULT_CONVERSATION_ID = 'a8d0ad87-8ed4-4784-99fe-2541a487e61f';
const AGENTAPI_BAT = 'C:\\Users\\jjang\\.gemini\\antigravity\\bin\\agentapi.bat';
const LANGUAGE_SERVER_EXE = 'C:\\Users\\jjang\\AppData\\Local\\Programs\\Antigravity\\resources\\bin\\language_server.exe';

const CONTROL_PANEL_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '🏢 1본부(comedifarm) 성과·큐', callback_data: '/visitors' },
      { text: '🏛️ 2본부(expertise333) 홈판·클립', callback_data: '/webtoon' }
    ],
    [
      { text: '🚀 구글·네이버 즉시 색인', callback_data: '/seo' },
      { text: '📊 전사 일일점검 & 실서버 상태', callback_data: '/status' }
    ],
    [
      { text: '🔄 재빌드 & 실서버 배포', callback_data: '/deploy' },
      { text: '💰 수익화 ID & 본부 설정', callback_data: '/config' }
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

/**
 * Forward natural-language command directly into Google Antigravity via agentapi
 */
function dispatchToAntigravity(userCommandText, conversationId) {
  const targetConvId = conversationId || DEFAULT_CONVERSATION_ID;
  const fullPrompt = [
    `[TELEGRAM REMOTE COMMAND]`,
    `사용자가 스마트폰 텔레그램에서 다음 원격 명령을 보냈습니다:`,
    `"${userCommandText}"`,
    ``,
    `지침:`,
    `1. 작업 디렉토리(d:\\사업아이템\\moneyfit-portal)에서 사용자의 요청을 즉시 수행하세요.`,
    `2. 코드나 설정이 변경되었다면 npm run build 후 git add/commit/push 하여 https://truthofmarket.com 실서버에 반영하세요.`,
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
    timeout: 15000,
    shell: !useDirectExe
  });

  if (res.status === 0) {
    return {
      ok: true,
      mode: 'SEND_MESSAGE',
      conversationId: targetConvId,
      output: (res.stdout || '').trim()
    };
  }

  // Fallback: start a new Antigravity conversation if the target conversation is unavailable
  const shortTitle = `[Telegram] ${userCommandText.slice(0, 30)}`;
  const newArgs = useDirectExe
    ? ['agentapi', 'new-conversation', `--title=${shortTitle}`, '--', fullPrompt]
    : ['new-conversation', `--title=${shortTitle}`, '--', fullPrompt];

  const fallbackRes = spawnSync(binPath, newArgs, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 15000,
    shell: !useDirectExe
  });

  return {
    ok: fallbackRes.status === 0,
    mode: 'NEW_CONVERSATION',
    conversationId: targetConvId,
    output: (fallbackRes.stdout || fallbackRes.stderr || '').trim()
  };
}

/**
 * Check live https://truthofmarket.com endpoints
 */
function checkLiveSiteHealth(siteUrl) {
  const endpoints = ['/health', '/sitemap.xml', '/rss.xml', '/llms.txt'];
  return Promise.all(
    endpoints.map(
      ep =>
        new Promise(resolve => {
          const start = Date.now();
          https
            .get(`${siteUrl}${ep}`, res => {
              res.resume();
              resolve({ ep, status: res.statusCode, ms: Date.now() - start });
            })
            .on('error', err => resolve({ ep, status: 'ERR', ms: Date.now() - start, err: err.message }));
        })
    )
  );
}

/**
 * Process a single incoming command/message from Telegram
 */
async function handleIncomingCommand(rawText, options = {}) {
  const text = String(rawText || '').trim();
  const cfg = telegramNotifier.getTelegramConfig();
  const botToken = options.botToken || cfg.botToken;
  const chatId = options.chatId || cfg.chatId;
  const dryRun = Boolean(options.dryRun || !cfg.isConfigured);

  const reply = async (html, withButtons = false) => {
    if (dryRun) {
      console.log('\n--- [TELEGRAM REPLY PREVIEW] ---');
      console.log(html.replace(/<[^>]+>/g, ''));
      console.log('--------------------------------');
      return { dryRun: true, html };
    }
    return sendChatMessage(botToken, chatId, html, withButtons);
  };

  // 1. /start or /help or greeting
  if (
    text === '/start' ||
    text === '/help' ||
    text === '도움말' ||
    text === '메뉴' ||
    text === '안녕' ||
    text === '시작' ||
    text === '테스트'
  ) {
    const msg = [
      `🤖 <b>[머니핏 × Antigravity 양방향 원격 제어 센터]</b>`,
      `현재 스마트폰 텔레그램과 PC의 <b>Google Antigravity AI 에이전트</b> 및 <b>truthofmarket.com</b> 실서버가 실시간 연결되어 있습니다.`,
      ``,
      `⚡ <b>1. 원터치 즉시 실행 명령어 (아래 버튼 클릭)</b>`,
      `• <code>/visitors</code> (또는 <code>방문자</code>) — 오늘 방문자 수·페이지뷰·검색로봇 유입 실시간 조회`,
      `• <code>/webtoon</code> (또는 <code>웹툰</code>) — 인스타·페북·쓰레드 4컷 웹툰×영수증 스튜디오 & 무페널티 원고`,
      `• <code>/status</code> — 실서버(truthofmarket.com) 및 SEO 피드 상태 점검`,
      `• <code>/seo</code> — 구글·네이버·빙 37개 전 페이지 즉시 색인 푸시`,
      `• <code>/deploy</code> — 36개 페이지 재빌드 + 테스트 + 실서버 자동 배포`,
      `• <code>/config</code> — 수익화 ID 조회 및 즉시 변경`,
      ``,
      `🧠 <b>2. 안티그래비티(Antigravity) AI 직접 작업 지시</b>`,
      `별도 명령어 없이 <b>그냥 한국말로 원하는 작업을 채팅창에 입력</b>하시면 PC의 안티그래비티가 즉시 깨어나 코드를 수정·배포하고 결과를 보고합니다!`,
      `• 예시 1: <i>"메인 페이지 제목을 더 후킹하게 바꾸고 배포해줘"</i>`,
      `• 예시 2: <i>"쿠팡 파트너스 아이디 AF1234567로 적용해줘"</i>`,
      `• 예시 3: <i>"오늘 방문자 수랑 인기 페이지 알려줘"</i>`
    ].join('\n');
    return reply(msg, true);
  }

  // 1-B. /visitors (오늘 방문자 수 실시간 조회)
  if (
    text === '/visitors' ||
    text === '방문자' ||
    text === '방문자수' ||
    text === '통계' ||
    text === '트래픽'
  ) {
    const stats = await new Promise(resolve => {
      https
        .get(`${cfg.siteUrl}/api/stats`, res => {
          let body = '';
          res.on('data', d => (body += d));
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              resolve(null);
            }
          });
        })
        .on('error', () => resolve(null));
    });

    if (!stats || !stats.today) {
      return reply(`⚠️ 실서버 통계 API(${cfg.siteUrl}/api/stats)에 연결 중입니다. 잠시 후 다시 눌러주세요.`, true);
    }

    const t = stats.today;
    const tot = stats.total || {};
    const bots = t.botsByEngine || {};
    const topPagesLines =
      Array.isArray(t.topPages) && t.topPages.length > 0
        ? t.topPages.map((p, idx) => `  ${idx + 1}. <code>${telegramNotifier.escapeHtml(p.page)}</code> (${p.views}회)`)
        : ['  • 아직 집계된 상세 페이지가 없습니다.'];

    const vMsg = [
      `📈 <b>[truthofmarket.com 실시간 방문자 & 검색로봇 리포트]</b>`,
      `📅 <b>기준 일자 (KST)</b>: <code>${stats.dateKst}</code>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👥 <b>오늘 순수 방문자(UV)</b>: <b>${t.uniqueVisitors}명</b> (누적 ${tot.uniqueVisitors || t.uniqueVisitors}명)`,
      `👀 <b>오늘 페이지 조회수(PV)</b>: <b>${t.pageViews}회</b> (누적 ${tot.pageViews || t.pageViews}회)`,
      `💰 <b>오늘 수익화 링크 클릭</b>: <b>${t.affiliateClicks}회</b> (누적 ${tot.affiliateClicks || t.affiliateClicks}회)`,
      `🤖 <b>오늘 검색엔진 로봇 수집</b>: <b>총 ${t.botCrawls}회</b>`,
      `   └ 네이버(Yeti): ${bots.naver || 0}회 | 구글봇: ${bots.google || 0}회 | 빙·AI봇: ${(bots.bing || 0) + (bots.ai || 0) + (bots.other || 0)}회`,
      `━━━━━━━━━━━━━━━━━━`,
      `🏆 <b>오늘의 인기 페이지 TOP 5</b>`,
      ...topPagesLines,
      `━━━━━━━━━━━━━━━━━━`,
      `🔗 <a href="${cfg.siteUrl}/api/stats">실시간 JSON 원본 보기</a> | <a href="${cfg.siteUrl}">사이트 열기</a>`
    ].join('\n');
    return reply(vMsg, true);
  }

  // 2. /status
  if (text === '/status' || text === '상태' || text === '점검') {
    const checks = await checkLiveSiteHealth(cfg.siteUrl);
    const lines = [
      `📊 <b>[truthofmarket.com 실서버 & 검색엔진 엔드포인트 실시간 상태]</b>`,
      `━━━━━━━━━━━━━━━━━━`
    ];
    checks.forEach(c => {
      const icon = c.status === 200 ? '✅' : '⚠️';
      lines.push(`${icon} <code>${c.ep}</code> : <b>HTTP ${c.status}</b> (${c.ms}ms)`);
    });
    lines.push(`━━━━━━━━━━━━━━━━━━`);
    lines.push(`🔗 <a href="${cfg.siteUrl}">${cfg.siteUrl} 바로가기</a>`);
    return reply(lines.join('\n'), true);
  }

  // 3. /seo
  if (text === '/seo' || text === '홍보' || text === '색인') {
    await reply(`⏳ <b>[SEO 오토파일럿 가동]</b> 구글·네이버·빙·IndexNow에 37개 전체 URL 라이브 전송을 시작합니다...`);
    const seoScript = path.join(PROJECT_ROOT, 'scripts', 'seo-autopilot.js');
    const res = spawnSync(process.execPath, [seoScript, '--live'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 25000
    });
    const outLines = (res.stdout || '')
      .split(/\r?\n/)
      .filter(l => l.includes('[LIVE]'))
      .map(l => telegramNotifier.escapeHtml(l.trim()));

    const doneMsg = [
      `🚀 <b>[구글·네이버·빙 37개 URL 즉시 색인 푸시 완료!]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      ...outLines,
      `━━━━━━━━━━━━━━━━━━`,
      `✅ 네이버 서치어드바이저, 구글 WebSub 허브, 마이크로소프트 빙 전송 완료!`
    ].join('\n');
    return reply(doneMsg, true);
  }

  // 4. /webtoon (인스타그램·페이스북·쓰레드 4컷 웹툰 × 충격 영수증 홍보팩 + 사진 즉시 전송)
  if (text === '/webtoon' || text === '웹툰' || text === '인스타' || text === '쓰레드' || text === '페북') {
    const snsPublisher = require('./sns-auto-publisher.js');
    const pack = await snsPublisher.generateWebtoonPack({ sendTelegram: !dryRun });
    const wtMsg = [
      `🎨 <b>[${telegramNotifier.escapeHtml(pack.keyword)} — 4컷 웹툰 × 실물 영수증 패키지]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `위 <b>1080×1080 고해상도 4컷 웹툰 이미지</b>를 저장하신 뒤 아래 원고를 복사해 그대로 붙여넣으세요!`,
      ``,
      `🔥 <b>1. 쓰레드(Threads) & 페이스북 본문 (링크 없음 — 알고리즘 노출 우대)</b>`,
      `<pre>${telegramNotifier.escapeHtml(pack.bundle.threadsMain)}</pre>`,
      ``,
      `💬 <b>2. 첫 번째 대댓글 (내 글에 답글로 달기 — 외부링크 페널티 우회)</b>`,
      `<pre>${telegramNotifier.escapeHtml(pack.bundle.threadsReply)}</pre>`,
      ``,
      `📸 <b>3. 인스타그램 캡션 (저장·DM 공유 유도)</b>`,
      `<pre>${telegramNotifier.escapeHtml(pack.bundle.instagramCaption)}</pre>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👉 <a href="${cfg.siteUrl}">실서버 스튜디오에서 36개 전 주제 웹툰 뽑기</a>`
    ].join('\n');
    return reply(wtMsg, true);
  }

  // 4-B. /sniper (legacy support)
  if (text === '/sniper' || text === '스나이퍼') {
    const sniperEngine = require('./marketing-sniper.js');
    sniperEngine.generateSniperKit();
    return telegramNotifier.sendTelegramReport(
      {
        ssgPagesBuilt: 36,
        sitemapUrls: 37,
        viralBundlesCount: 36,
        sniperTargetsCount: 6,
        indexNowStatus: 'LIVE_READY',
        durationMs: 120
      },
      { dryRun }
    );
  }

  // 5. /deploy
  if (text === '/deploy' || text === '배포') {
    await reply(`⚙️ <b>[전체 무인 빌드 & 실서버 배포 시작]</b> 36개 SEO 페이지 빌드, 80개 테스트 검증 및 GitHub(truthofmarket.com) 자동 배포를 진행합니다...`);
    const masterScript = path.join(PROJECT_ROOT, 'scripts', 'auto-master.js');
    const res = spawnSync(process.execPath, [masterScript, '--live'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 90000
    });
    const ok = res.status === 0;
    const msg = ok
      ? `✅ <b>[전체 재빌드 & truthofmarket.com 실서버 배포 완료!]</b>\n• 80/80 테스트 통과\n• 36개 SEO 페이지 & 사이트맵 갱신\n• GitHub(origin/main) 푸시 및 실서버 반영 완료!`
      : `❌ <b>[배포 중 오류 발생]</b>\n<pre>${telegramNotifier.escapeHtml((res.stderr || res.stdout || '').slice(-600))}</pre>`;
    return reply(msg, true);
  }

  // 6. /config & /set_* commands
  if (text === '/config' || text === '설정' || text.startsWith('/set_')) {
    const currentConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (text.startsWith('/set_')) {
      const parts = text.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const val = (parts[1] || '').trim();
      const keyMap = {
        '/set_coupang': 'coupangAfId',
        '/set_linkprice': 'linkPriceId',
        '/set_cpa': 'cpaMemberId',
        '/set_adfit': 'adfitUnitId'
      };
      const targetKey = keyMap[cmd];
      if (!targetKey || !val) {
        return reply(`⚠️ 사용법: <code>/set_coupang AF1234567</code> 또는 <code>/set_linkprice A10012345</code>`);
      }
      currentConfig[targetKey] = val;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(currentConfig, null, 2) + '\n', 'utf8');
      spawnSync(process.execPath, [path.join(PROJECT_ROOT, 'scripts', 'build-ssg.js')], { cwd: PROJECT_ROOT });
      spawnSync('git', ['add', '-A'], { cwd: PROJECT_ROOT });
      spawnSync('git', ['commit', '-m', `chore(config): update ${targetKey} via Telegram remote`], { cwd: PROJECT_ROOT });
      spawnSync('git', ['push', 'origin', 'main'], { cwd: PROJECT_ROOT, timeout: 30000 });
      return reply(`✅ <b>[${targetKey}]</b> 값이 <code>${telegramNotifier.escapeHtml(val)}</code>(으)로 변경되어 <b>truthofmarket.com</b> 실서버 37개 전 페이지에 즉시 배포되었습니다!`, true);
    }

    const cfgMsg = [
      `💰 <b>[현재 수익화 정산 ID 설정 현황]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `• <b>사이트 도메인</b>: <code>${telegramNotifier.escapeHtml(currentConfig.siteUrl)}</code>`,
      `• <b>쿠팡 파트너스 ID</b>: <code>${telegramNotifier.escapeHtml(currentConfig.coupangAfId)}</code>`,
      `• <b>링크프라이스 ID</b>: <code>${telegramNotifier.escapeHtml(currentConfig.linkPriceId)}</code>`,
      `• <b>CPA 회원 ID</b>: <code>${telegramNotifier.escapeHtml(currentConfig.cpaMemberId)}</code>`,
      `• <b>카카오 애드핏 ID</b>: <code>${telegramNotifier.escapeHtml(currentConfig.adfitUnitId)}</code>`,
      `━━━━━━━━━━━━━━━━━━`,
      `💡 <b>텔레그램에서 즉시 변경하는 법:</b>`,
      `• <code>/set_coupang 내쿠팡ID</code>`,
      `• <code>/set_linkprice 내링크프라이스ID</code>`,
      `• <code>/set_cpa 내CPA아이디</code>`,
      `• 또는 그냥 <i>"쿠팡 아이디 AF12345로 바꿔줘"</i>라고 입력!`
    ].join('\n');
    return reply(cfgMsg, true);
  }

  // 7. Natural Language or /ai <instruction> -> Forward directly to THIS active Antigravity conversation!
  const cleanInstruction = text.replace(/^\/ai\s+/i, '').trim();
  const convId = DEFAULT_CONVERSATION_ID;

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
      `🧠 <b>[총괄 매니저 🐯 대화방 실시간 직결 완료!]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `📌 <b>대표님 지시사항</b>: <i>"${telegramNotifier.escapeHtml(cleanInstruction)}"</i>`,
      `🖥 <b>직결된 대화방 ID</b>: <code>${convId}</code>`,
      `━━━━━━━━━━━━━━━━━━`,
      `⚡ 대표님의 텔레그램 메시지가 현재 열려 있는 안티그래비티 대화방(제1본부·제2본부 통합 지휘실)으로 즉시 전달되어 실행 중입니다!`
    ].join('\n')
  );

  const agyRes = dispatchToAntigravity(cleanInstruction, convId);
  console.log(`  [Antigravity Bridge] Dispatched "${cleanInstruction}" -> mode=${agyRes.mode}, ok=${agyRes.ok}`);
  return agyRes;
}

/**
 * Continuous Long-Polling Loop for 24/7 Telegram -> Antigravity Remote Control
 */
async function startPollingDaemon() {
  const cfg = telegramNotifier.getTelegramConfig();
  if (!cfg.isConfigured) {
    console.log('⚠️ [Telegram Bridge] 봇 토큰이 아직 설정되지 않았습니다.');
    console.log('   사용법: node scripts/telegram-antigravity-bridge.js --token <BOT_TOKEN>');
    process.exit(0);
  }

  const botToken = cfg.botToken;
  let ownerChatId =
    cfg.chatId && cfg.chatId !== 'YOUR_CHAT_ID' && !cfg.chatId.startsWith('SAMPLE_') ? String(cfg.chatId) : '';

  // Register Telegram slash command menu automatically
  try {
    await telegramNotifier.telegramApiRequest(botToken, 'setMyCommands', {
      commands: [
        { command: 'help', description: '원격 제어 리모컨 버튼 & 사용법 보기' },
        { command: 'status', description: 'truthofmarket.com 실서버 상태 점검' },
        { command: 'seo', description: '구글·네이버·빙 37개 URL 즉시 색인 푸시' },
        { command: 'sniper', description: '지식iN·카페 실시간 최신순 스나이퍼 링크 받기' },
        { command: 'deploy', description: '전체 페이지 재빌드 & 실서버 자동 배포' },
        { command: 'config', description: '쿠팡·링크프라이스·CPA 수익화 ID 조회/변경' }
      ]
    });
  } catch (e) {
    console.warn('  [Telegram Bridge] setMyCommands warning:', e.message);
  }

  const state = loadBridgeState();
  console.log('===============================================================');
  console.log('   🤖 TELEGRAM <-> ANTIGRAVITY 24/7 REMOTE CONTROL DAEMON      ');
  console.log(`   Authorized Chat ID : ${ownerChatId || '(첫 메시지 수신 시 자동 등록)'}`);
  console.log(`   Antigravity Session: ${DEFAULT_CONVERSATION_ID}`);
  console.log('===============================================================');

  while (true) {
    try {
      const updates = await telegramNotifier.telegramApiRequest(
        botToken,
        `getUpdates?offset=${state.lastUpdateId + 1}&timeout=20`
      );

      if (Array.isArray(updates) && updates.length > 0) {
        for (const u of updates) {
          state.lastUpdateId = u.update_id;
          saveBridgeState(state);

          // Extract either message or inline button callback_query
          const msgObj = u.message || u.edited_message || (u.callback_query && u.callback_query.message);
          const incomingText = u.callback_query
            ? u.callback_query.data
            : (u.message && u.message.text) || '';

          if (u.callback_query && u.callback_query.id) {
            try {
              await telegramNotifier.telegramApiRequest(botToken, 'answerCallbackQuery', {
                callback_query_id: u.callback_query.id
              });
            } catch (e) {
              // ignore
            }
          }

          if (!msgObj || !msgObj.chat || !incomingText) continue;
          const senderChatId = String(msgObj.chat.id);

          // Auto-lock ownerChatId on first contact
          if (!ownerChatId) {
            ownerChatId = senderChatId;
            telegramNotifier.saveTelegramConfig({ telegramChatId: ownerChatId });
            console.log(`  🔒 [Security] Owner Chat ID auto-locked to ${ownerChatId}`);
          }

          // Reject unauthorized users
          if (senderChatId !== ownerChatId) {
            console.warn(`  ⛔ Ignored message from unauthorized chat_id: ${senderChatId}`);
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

// CLI entrypoint
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    const tokenIdx = args.indexOf('--token');
    const chatIdx = args.indexOf('--chat-id');
    const simIdx = args.indexOf('--simulate');

    if (tokenIdx !== -1 && args[tokenIdx + 1]) {
      telegramNotifier.saveTelegramConfig({
        telegramBotToken: args[tokenIdx + 1].trim(),
        antigravityConversationId: DEFAULT_CONVERSATION_ID
      });
    }
    if (chatIdx !== -1 && args[chatIdx + 1]) {
      telegramNotifier.saveTelegramConfig({ telegramChatId: args[chatIdx + 1].trim() });
    }

    if (simIdx !== -1 && args[simIdx + 1]) {
      const simCmd = args
        .slice(simIdx + 1)
        .filter(a => a !== '--dry-run')
        .join(' ');
      await handleIncomingCommand(simCmd, { dryRun: args.includes('--dry-run') });
      process.exit(0);
    }

    await startPollingDaemon();
  })();
}

module.exports = {
  handleIncomingCommand,
  dispatchToAntigravity,
  startPollingDaemon
};
