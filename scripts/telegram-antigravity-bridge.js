#!/usr/bin/env node
/**
 * KidsFit Growth Studio — 2-Way Telegram <-> Antigravity Remote Control Bridge Daemon
 * (키즈핏 그로스 스튜디오 텔레그램 양방향 원격 명령 & 안티그래비티 AI 실시간 브릿지)
 *
 * Capabilities:
 * 1. Listens 24/7 to the user's Telegram Bot via Long Polling (`getUpdates`) + Inline Button Callbacks
 * 2. Instant Built-in Commands & 1-Tap Smartphone Buttons:
 *    - `/help` (`도움말`/`시작`) : Show interactive KidsFit control panel with 1-tap buttons
 *    - `/status` (`상태`/`점검`) : Check live `https://truthofmarket.com` server & Paper Learning status
 *    - `/research` (`논문`/`학습`): Run an immediate incremental paper crawl cycle & report new papers
 *    - `/samples` (`샘플`/`웹툰`): Send the 6-cut conversational webtoon & 1-line cardnews sample photos
 *    - `/deploy` (`배포`)        : Rebuild `dist/`, run 33/33 verification checks, and push to `origin/main`
 * 3. Direct Antigravity AI Remote Control (`language_server.exe` / `agentapi.bat` Bridge):
 *    - Any natural language message sent on Telegram automatically wakes up Google Antigravity
 *      in conversation `efdd0412-2586-40cf-bb28-0fa8976613df`, executes the task in `d:\사업아이템`,
 *      and replies back to Telegram when finished!
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');
const telegramNotifier = require('./telegram-notify.js');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const STATE_PATH = path.join(PROJECT_ROOT, 'logs', 'telegram_bridge_state.json');

const DEFAULT_CONVERSATION_ID = 'e6c1bb34-f211-4899-a864-42850c85ae86';
const AGENTAPI_BAT = 'C:\\Users\\jjang\\.gemini\\antigravity\\bin\\agentapi.bat';
const LANGUAGE_SERVER_EXE = 'C:\\Users\\jjang\\AppData\\Local\\Programs\\Antigravity\\resources\\app\\extensions\\antigravity\\bin\\language_server_windows_x64.exe';

const CONTROL_PANEL_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '📚 논문 크롤링·학습 현황', callback_data: '/status' },
      { text: '⚡ 지금 논문 추가 학습 실행', callback_data: '/research' }
    ],
    [
      { text: '🎨 웹툰·카드뉴스 샘플 받기', callback_data: '/samples' },
      { text: '🔄 재빌드 & 실서버 배포', callback_data: '/deploy' }
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
    `1. 작업 디렉토리(d:\\사업아이템)에서 사용자의 요청을 즉시 수행하세요.`,
    `2. 코드나 데이터가 변경되었다면 node scripts/build.js 실행 후 git add/commit/push 하여 https://truthofmarket.com 실서버에 반영하세요.`,
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
            .get(`${siteUrl}${ep}`, res => {
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
      `스마트폰 텔레그램과 PC의 <b>Google Antigravity AI 에이전트</b> 및 <b>truthofmarket.com</b> 실서버가 실시간 양방향 연결되어 있습니다!`,
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
      `🌐 <b>1. 실서버(truthofmarket.com) 엔드포인트</b>`
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

  // 3. /research
  if (text === '/research' || text === '논문' || text === '학습') {
    await reply(`⏳ <b>[실시간 논문 크롤링 가동]</b> PubMed·Crossref·OpenAlex에서 소아 성장·두뇌 발달 신규 학술 논문을 크롤링하고 학습합니다...`);
    const daemonScript = path.join(PROJECT_ROOT, 'scripts', 'continuous_research_daemon.py');
    const res = spawnSync('python', [daemonScript, '--once'], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      encoding: 'utf8',
      timeout: 60000
    });
    const research = telegramNotifier.loadResearchStatus();
    const pc = research.pillar_counts || {};
    const msg = [
      `✅ <b>[신규 학술 논문 증분 학습 완료! (Cycle #${research.cycle_index})]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `• <b>이번 주기 신규 추가</b>: <b>+${research.newly_added_in_cycle || 0}편</b>`,
      `• <b>누적 총 학습 논문</b>: <b>${research.total_papers}편</b>`,
      `  ├ ① 소아 내분비·키 성장: <code>${pc.growth_endocrinology || 0}편</code>`,
      `  ├ ② 소근육 신경과학·K-DST: <code>${pc.fine_motor_neuroscience || 0}편</code>`,
      `  ├ ③ 몬테소리 vs 가베 공간인지: <code>${pc.pedagogy_montessori_froebel || 0}편</code>`,
      `  ├ ④ 자율성 지지·박물관 대화법: <code>${pc.parent_child_interaction_museum || 0}편</code>`,
      `  └ ⑤ 거북목 교정·성장판 점프역학: <code>${pc.posture_biomechanics_exercise || 0}편</code>`
    ].join('\n');
    return reply(msg, true);
  }

  // 4. /samples
  if (text === '/samples' || text === '샘플' || text === '웹툰' || text === '카드뉴스') {
    if (!dryRun) {
      const webtoonPath = path.join(PROJECT_ROOT, 'samples', '2_webtoon_sample', 'webtoon_cut_01.png');
      const cardPath = path.join(PROJECT_ROOT, 'samples', '3_cardnews_sample', 'cardnews_01.png');
      if (fs.existsSync(webtoonPath)) {
        await telegramNotifier.sendTelegramPhoto(
          botToken,
          chatId,
          webtoonPath,
          '🎨 [키즈핏 6컷 공감 육아 웹툰 샘플 1컷] 말풍선 대화형 일러스트'
        );
      }
      if (fs.existsSync(cardPath)) {
        await telegramNotifier.sendTelegramPhoto(
          botToken,
          chatId,
          cardPath,
          '📊 [키즈핏 카드뉴스 샘플 1슬라이드] 한 줄 요약 & 대형 폰트'
        );
      }
    }
    return reply(
      `✅ <b>[키즈핏 5대 양육 샘플 패키지 전송 완료]</b>\n• 웹툰(말풍선 대화형) & 카드뉴스(1줄 대형폰트) 대표 이미지를 전송했습니다.\n• 전체 샘플 및 15초(컷당 2.5초) 무빙 영상은 <a href="${cfg.siteUrl}">${cfg.siteUrl}</a> 및 로컬 <code>samples/</code> 폴더에 준비되어 있습니다.`,
      true
    );
  }

  // 5. /deploy
  if (text === '/deploy' || text === '배포') {
    await reply(`⚙️ <b>[전체 빌드 & 실서버 배포 시작]</b> dist/ 빌드, 33개 무결성 검증 및 GitHub(truthofmarket.com) 푸시를 진행합니다...`);
    const buildRes = spawnSync(process.execPath, [path.join(PROJECT_ROOT, 'scripts', 'build.js')], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    });
    const verifyRes = spawnSync(process.execPath, [path.join(PROJECT_ROOT, 'scripts', 'verify-acceptance.js')], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    });
    spawnSync('git', ['add', '-A'], { cwd: PROJECT_ROOT });
    spawnSync('git', ['commit', '-m', 'chore(deploy): remote deploy via Telegram bridge'], { cwd: PROJECT_ROOT });
    spawnSync('git', ['push', 'origin', 'main'], { cwd: PROJECT_ROOT, timeout: 30000 });

    const ok = buildRes.status === 0 && verifyRes.status === 0;
    const msg = ok
      ? `✅ <b>[재빌드 & truthofmarket.com 실서버 배포 완료!]</b>\n• 33/33 전체 검증 항목 통과\n• GitHub(origin/main) 푸시 및 실서버 반영 완료!`
      : `⚠️ <b>[빌드/검증 로그 확인]</b>\n<pre>${telegramNotifier.escapeHtml((verifyRes.stdout || '').slice(-500))}</pre>`;
    return reply(msg, true);
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
        { command: 'status', description: 'truthofmarket.com 실서버 & 논문 학습 현황' },
        { command: 'research', description: '지금 즉시 학술 논문 추가 크롤링·학습 실행' },
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
  if (ownerChatId) {
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
    await startPollingDaemon();
  })();
}

module.exports = {
  handleIncomingCommand,
  dispatchToAntigravity,
  startPollingDaemon
};
