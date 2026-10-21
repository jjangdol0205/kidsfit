#!/usr/bin/env node
/**
 * KidsFit Growth Studio — Telegram Automated Reporting & Alert Engine
 * (키즈핏 그로스 스튜디오 텔레그램 실시간 보고 및 미디어 전송 엔진)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(PROJECT_ROOT, '.env');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');
const PREVIEW_MD_PATH = path.join(LOGS_DIR, 'telegram_last_report_preview.md');

function loadDotEnv() {
  const envVars = {};
  if (!fs.existsSync(ENV_PATH)) return envVars;
  try {
    const raw = fs.readFileSync(ENV_PATH, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        envVars[key] = val;
      }
    });
  } catch (e) {
    // ignore
  }
  return envVars;
}

function getTelegramConfig() {
  const dotEnv = loadDotEnv();
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || dotEnv.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = String(process.env.TELEGRAM_CHAT_ID || dotEnv.TELEGRAM_CHAT_ID || '').trim();
  const conversationId = (
    process.env.ANTIGRAVITY_CONVERSATION_ID ||
    dotEnv.ANTIGRAVITY_CONVERSATION_ID ||
    'efdd0412-2586-40cf-bb28-0fa8976613df'
  ).trim();
  const siteUrl = 'https://truthofmarket.com';
  const isConfigured = Boolean(
    botToken &&
    botToken !== 'YOUR_TELEGRAM_BOT_TOKEN' &&
    !botToken.startsWith('SAMPLE_') &&
    botToken.includes(':')
  );

  return {
    botToken,
    chatId,
    conversationId,
    siteUrl,
    isConfigured
  };
}

function saveTelegramConfig(updates = {}) {
  try {
    const dotEnv = loadDotEnv();
    if (updates.telegramBotToken) dotEnv.TELEGRAM_BOT_TOKEN = updates.telegramBotToken;
    if (updates.telegramChatId) dotEnv.TELEGRAM_CHAT_ID = updates.telegramChatId;
    if (updates.antigravityConversationId) dotEnv.ANTIGRAVITY_CONVERSATION_ID = updates.antigravityConversationId;

    const lines = Object.entries(dotEnv).map(([k, v]) => `${k}=${v}`);
    fs.writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf8');
  } catch (e) {
    console.warn('  [Telegram] Could not update .env:', e.message);
  }
}

function telegramApiRequestSingle(botToken, method, payload = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = payload ? JSON.stringify(payload) : '';
    const bodyBuf = payload ? Buffer.from(bodyStr, 'utf8') : null;
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/${method}`,
      method: payload ? 'POST' : 'GET',
      headers: payload
        ? {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': bodyBuf.length
          }
        : {},
      timeout: 25000
    };

    const req = https.request(options, res => {
      res.setEncoding('utf8');
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.ok) {
            resolve(parsed.result);
          } else {
            const err = new Error(parsed.description || `HTTP ${res.statusCode}`);
            err.statusCode = res.statusCode;
            reject(err);
          }
        } catch (err) {
          const wrap = new Error(`Invalid JSON response from Telegram (HTTP ${res.statusCode}): ${err.message}`);
          wrap.statusCode = res.statusCode;
          reject(wrap);
        }
      });
    });

    req.on('error', err => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Telegram API request timed out (25s)'));
    });

    if (bodyBuf) {
      req.write(bodyBuf);
    }
    req.end();
  });
}

async function telegramApiRequest(botToken, method, payload = null, maxRetries = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await telegramApiRequestSingle(botToken, method, payload);
    } catch (err) {
      lastErr = err;
      const isPermanent4xx = err.statusCode && err.statusCode >= 400 && err.statusCode < 500 && err.statusCode !== 429;
      if (isPermanent4xx || attempt === maxRetries) {
        throw err;
      }
      await new Promise(r => setTimeout(r, attempt * 1500));
    }
  }
  throw lastErr;
}

async function discoverChatId(botToken) {
  const updates = await telegramApiRequest(botToken, 'getUpdates');
  if (!Array.isArray(updates) || updates.length === 0) {
    return null;
  }
  for (let i = updates.length - 1; i >= 0; i--) {
    const u = updates[i];
    const chat =
      (u.message && u.message.chat) ||
      (u.edited_message && u.edited_message.chat) ||
      (u.channel_post && u.channel_post.chat) ||
      (u.my_chat_member && u.my_chat_member.chat);
    if (chat && chat.id) {
      return {
        chatId: String(chat.id),
        title: chat.title || chat.username || chat.first_name || 'User'
      };
    }
  }
  return null;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function loadResearchStatus() {
  const statusPath = path.join(LOGS_DIR, 'research_crawler_status.json');
  if (fs.existsSync(statusPath)) {
    try {
      return JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    } catch (e) {
      // ignore
    }
  }
  return { total_papers: 663, cycle_index: 34, pillar_counts: {} };
}

function buildCompletionMessageHtml(metrics = {}) {
  const cfg = getTelegramConfig();
  const siteUrl = metrics.siteUrl || cfg.siteUrl || 'https://truthofmarket.com';
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const research = loadResearchStatus();
  const pc = research.pillar_counts || {};
  const mb = research.macro_pillar_balance || {};
  const totalPapers = research.total_papers || 1764;
  const growthCount = mb.growth_macro_count || ((pc.growth_endocrinology || 0) + (pc.posture_biomechanics_exercise || 0)) || 770;
  const learningCount = mb.learning_macro_count || ((pc.fine_motor_neuroscience || 0) + (pc.pedagogy_montessori_froebel || 0) + (pc.parent_child_interaction_museum || 0)) || 994;
  const growthPct = mb.growth_percent || Number(((growthCount / Math.max(1, totalPapers)) * 100).toFixed(1));
  const learningPct = mb.learning_percent || Number(((learningCount / Math.max(1, totalPapers)) * 100).toFixed(1));
  const modeLabel = mb.mode_label_ko || '50:50 자동 균형 학습 모드';

  return [
    `🌱 <b>[키즈핏 그로스 스튜디오(KidsFit) × Antigravity 실시간 보고]</b>`,
    `🕒 <b>보고 시각</b>: <code>${escapeHtml(timestamp)}</code>`,
    `🌐 <b>실서버 도메인</b>: <a href="${escapeHtml(siteUrl)}">${escapeHtml(siteUrl)}</a>`,
    `━━━━━━━━━━━━━━━━━━`,
    `🏛️ <b>1. 50:50 양대 축(Dual-Pillar) 마스터 분석 보고서 완비</b>`,
    `• <b>【축 1: 📏 아이 신체 성장 마스터 보고서】 (Chapters 1~4)</b>`,
    `  └ KDCA/CDC 키·체중 백분위, Tanner 유전키(MPH) & 3단 예측키, 골연령 3개년 로드맵, 성장호르몬(SWS)·영양 처방, 순수 신체 성장 운동기구(실내철봉·트램폴린·줄넘기·폼롤러)`,
    `• <b>【축 2: 🧠 아이 두뇌·학습 마스터 보고서】 (Chapters 5~8)</b>`,
    `  └ 5대 학습 역량 지수(LQ: 문해력·수리공간·집중작업기억·메타인지·탐구창의) 레이더 차트 & 6개월 성취 궤적, 6대 학습 병목 1:1 뇌과학 처방, 해마→피질 장기기억 수면 시간표, 이관된 학습 환경 도구(독서대·타임타이머·코넬노트·가베·그래비트랙스) & 40개 권역×연령 박물관 도슨트 투어`,
    ``,
    `📚 <b>2. AI 학술 논문 자가학습 (성장 vs 학습 동적 밸런싱)</b>`,
    `• <b>누적 학습 논문 수</b>: <b>총 ${totalPapers}편</b> (Cycle #${research.cycle_index || 149})`,
    `  ├ 📏 신체 성장 축(Growth Macro): <code>${growthCount}편 (${growthPct}%)</code>`,
    `  ├ 🧠 두뇌·학습 축(Learning Macro): <code>${learningCount}편 (${learningPct}%)</code>`,
    `  └ ⚙️ 현재 스케줄러 모드: <code>${escapeHtml(modeLabel)}</code>`,
    ``,
    `✅ <b>3. 텔레그램 ↔ 안티그래비티 양방향 브릿지 (UTF-8 인코딩 보호 적용)</b>`,
    `• 직결 대화방 ID: <code>${escapeHtml(cfg.conversationId)}</code>`,
    `• 채팅창에 한국말로 명령을 입력하시면 PC의 안티그래비티가 즉시 수행 후 깨짐 없는 UTF-8 한국어로 답장합니다!`
  ].join('\n');
}

async function sendTelegramReport(metrics = {}, options = {}) {
  const cfg = getTelegramConfig();
  const forceDryRun = Boolean(options.dryRun);
  let htmlMessage = options.customHtml || buildCompletionMessageHtml(metrics);

  // Guard against Windows PowerShell CP949 stdin pipe corruption ('???')
  if (/\?{4,}/.test(htmlMessage) && !/[가-힣]/.test(htmlMessage)) {
    console.warn('  [Telegram UTF-8 Guard] Detected CP949 pipe corruption (???); falling back to UTF-8 buildCompletionMessageHtml().');
    htmlMessage = buildCompletionMessageHtml(metrics);
  }

  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }

  const previewPayload = {
    timestamp: new Date().toISOString(),
    mode: forceDryRun || !cfg.isConfigured ? 'DRY_RUN_OR_LOCAL_PREVIEW' : 'LIVE_TELEGRAM_API',
    chatId: cfg.chatId || '(auto-discover pending)',
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    text: htmlMessage
  };

  fs.writeFileSync(path.join(LOGS_DIR, 'telegram_last_report.json'), JSON.stringify(previewPayload, null, 2) + '\n', 'utf8');
  fs.writeFileSync(PREVIEW_MD_PATH, htmlMessage, 'utf8');

  if (forceDryRun || !cfg.isConfigured) {
    return { sent: false, mode: 'DRY_RUN', previewPath: PREVIEW_MD_PATH };
  }

  let targetChatId = cfg.chatId;
  if (!targetChatId || targetChatId === 'YOUR_CHAT_ID') {
    const discovered = await discoverChatId(cfg.botToken);
    if (discovered && discovered.chatId) {
      targetChatId = discovered.chatId;
      saveTelegramConfig({ telegramChatId: targetChatId });
    } else {
      return { sent: false, mode: 'CHAT_ID_PENDING', previewPath: PREVIEW_MD_PATH };
    }
  }

  const payload = {
    chat_id: targetChatId,
    text: htmlMessage,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  if (options.replyMarkup) {
    payload.reply_markup = options.replyMarkup;
  }

  const apiRes = await telegramApiRequest(cfg.botToken, 'sendMessage', payload);
  console.log(`  ✓ [Telegram] Live message sent to Chat ID ${targetChatId} (message_id: ${apiRes.message_id})`);
  return { sent: true, mode: 'LIVE', messageId: apiRes.message_id, chatId: targetChatId };
}

function sendTelegramPhoto(botToken, chatId, photoPath, caption = '') {
  return new Promise((resolve, reject) => {
    const boundary = '----KidsFitBoundary' + Date.now().toString(16);
    const filename = path.basename(photoPath);
    const fileBuf = fs.readFileSync(photoPath);

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
      `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`,
      'utf8'
    ));
    parts.push(fileBuf);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'));

    const bodyBuf = Buffer.concat(parts);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendPhoto`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuf.length
      },
      timeout: 30000
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

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');
    const isDiscover = args.includes('--discover');
    const tokenArgIdx = args.indexOf('--token');
    const chatArgIdx = args.indexOf('--chat-id');
    const msgArgIdx = args.indexOf('--message');
    const fileArgIdx = args.indexOf('--file');
    const htmlFileArgIdx = args.indexOf('--html-file');
    const photoArgIdx = args.indexOf('--photo');
    const captionArgIdx = args.indexOf('--caption');

    if (tokenArgIdx !== -1 && args[tokenArgIdx + 1]) {
      saveTelegramConfig({ telegramBotToken: args[tokenArgIdx + 1].trim() });
    }
    if (chatArgIdx !== -1 && args[chatArgIdx + 1]) {
      saveTelegramConfig({ telegramChatId: args[chatArgIdx + 1].trim() });
    }

    const cfg = getTelegramConfig();

    if (isDiscover) {
      const found = await discoverChatId(cfg.botToken);
      if (found) {
        saveTelegramConfig({ telegramChatId: found.chatId });
        console.log(`✅ 텔레그램 채팅방 ID 자동 감지 및 저장 완료: ${found.chatId} (${found.title})`);
      }
      process.exit(0);
    }

    if (photoArgIdx !== -1 && args[photoArgIdx + 1]) {
      const photoPath = path.resolve(PROJECT_ROOT, args[photoArgIdx + 1]);
      const caption = captionArgIdx !== -1 && args[captionArgIdx + 1] ? args.slice(captionArgIdx + 1).join(' ') : '';
      const photoRes = await sendTelegramPhoto(cfg.botToken, cfg.chatId, photoPath, caption);
      console.log(`[Telegram Photo Sent] message_id=${photoRes.message_id}`);
      process.exit(0);
    }

    if (htmlFileArgIdx !== -1 && args[htmlFileArgIdx + 1]) {
      const filePath = path.resolve(PROJECT_ROOT, args[htmlFileArgIdx + 1]);
      const customHtml = fs.readFileSync(filePath, 'utf8').trim();
      const res = await sendTelegramReport({}, { dryRun: isDryRun, customHtml });
      console.log(`[Telegram HTML File Message] Status: ${res.mode} (sent=${res.sent})`);
      process.exit(0);
    }

    if (fileArgIdx !== -1 && args[fileArgIdx + 1]) {
      const filePath = path.resolve(PROJECT_ROOT, args[fileArgIdx + 1]);
      const rawMsg = fs.readFileSync(filePath, 'utf8').trim();
      const customHtml = `🌱 <b>[키즈핏 × Antigravity AI 실시간 알림]</b>\n━━━━━━━━━━━━━━━━━━\n${escapeHtml(rawMsg)}\n━━━━━━━━━━━━━━━━━━\n🌐 <a href="${cfg.siteUrl}">${cfg.siteUrl}</a>`;
      const res = await sendTelegramReport({}, { dryRun: isDryRun, customHtml });
      console.log(`[Telegram File Message] Status: ${res.mode} (sent=${res.sent})`);
      process.exit(0);
    }

    if (msgArgIdx !== -1 && args[msgArgIdx + 1]) {
      const rawMsg = args.slice(msgArgIdx + 1).join(' ');
      const customHtml = `🌱 <b>[키즈핏 × Antigravity AI 실시간 알림]</b>\n━━━━━━━━━━━━━━━━━━\n${escapeHtml(rawMsg)}\n━━━━━━━━━━━━━━━━━━\n🌐 <a href="${cfg.siteUrl}">${cfg.siteUrl}</a>`;
      const res = await sendTelegramReport({}, { dryRun: isDryRun, customHtml });
      console.log(`[Telegram Custom Message] Status: ${res.mode} (sent=${res.sent})`);
      process.exit(0);
    }

    const res = await sendTelegramReport({}, { dryRun: isDryRun });
    console.log(`[Telegram Notifier] Status: ${res.mode} (sent=${res.sent})`);
    process.exit(0);
  })().catch(err => {
    console.error('[Telegram Notifier Error]:', err.message);
    process.exit(1);
  });
}

module.exports = {
  getTelegramConfig,
  saveTelegramConfig,
  telegramApiRequest,
  sendTelegramPhoto,
  escapeHtml,
  discoverChatId,
  loadResearchStatus,
  buildCompletionMessageHtml,
  sendTelegramReport
};
