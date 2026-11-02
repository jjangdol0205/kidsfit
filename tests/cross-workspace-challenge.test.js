/**
 * tests/cross-workspace-challenge.test.js
 * Empirical Boundary & Cross-Workspace Isolation Test Harness
 * Executed by challenger_2
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ENG_ROOT = path.resolve(__dirname, '..');
const KOR_ROOT = path.resolve('D:\\사업아이템');

let passedAssertions = 0;
let failedAssertions = 0;
const failureDetails = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedAssertions++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedAssertions++;
    console.error(`  [FAIL] ${testName}: ${details}`);
    failureDetails.push({ testName, details });
  }
}

function walkSync(dir, excludeDirs = ['.git', '.agents', 'node_modules', 'dist']) {
  let results = [];
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of list) {
      if (excludeDirs.includes(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        results = results.concat(walkSync(full, excludeDirs));
      } else {
        results.push(full);
      }
    }
  } catch (err) {
    console.error(`Walk error on ${dir}:`, err.message);
  }
  return results;
}

async function fetchHttps(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', (err) => reject(err));
  });
}

async function runEmpiricalChallenge() {
  console.log('===============================================================');
  console.log('   CROSS-WORKSPACE AUTONOMY & ISOLATION EMPIRICAL CHALLENGE    ');
  console.log('===============================================================');

  // -------------------------------------------------------------
  // TEST 1: AUTONOMY TEST
  // -------------------------------------------------------------
  console.log('\n--- 1. Autonomy & Boundary Isolation Test ---');

  const engFiles = walkSync(ENG_ROOT);
  const korFiles = walkSync(KOR_ROOT);

  console.log(`Scanned ${engFiles.length} files in English workspace (excluding .git/.agents/dist)`);
  console.log(`Scanned ${korFiles.length} files in Korean workspace (excluding .git/.agents/dist)`);

  // 1.1 Relative paths traversing across root
  const KOR_DIR_NAME = '사업' + '아이템';
  const ENG_DIR_NAME = '키즈핏' + ' 영문';
  const korRel1 = '..' + path.sep + KOR_DIR_NAME;
  const korRel2 = '../' + KOR_DIR_NAME;
  const engRel1 = '..' + path.sep + ENG_DIR_NAME;
  const engRel2 = '../' + ENG_DIR_NAME;

  let engClimbingRefs = [];
  for (const f of engFiles) {
    if (f.endsWith('cross-workspace-challenge.test.js')) continue;
    if (/\.(js|json|html|css|py|env|txt|xml|sh|bat)$/i.test(f)) {
      const content = fs.readFileSync(f, 'utf8');
      if (content.includes(korRel1) || content.includes(korRel2) || content.includes('..\\\\' + KOR_DIR_NAME)) {
        engClimbingRefs.push({ file: path.relative(ENG_ROOT, f) });
      }
    }
  }
  assert(engClimbingRefs.length === 0, 'No climbing relative paths from English workspace to Korean workspace', JSON.stringify(engClimbingRefs));

  let korClimbingRefs = [];
  for (const f of korFiles) {
    if (/\.(js|json|html|css|py|env|txt|xml|sh|bat)$/i.test(f)) {
      const content = fs.readFileSync(f, 'utf8');
      if (content.includes(engRel1) || content.includes(engRel2) || content.includes('..\\\\' + ENG_DIR_NAME)) {
        korClimbingRefs.push({ file: path.relative(KOR_ROOT, f) });
      }
    }
  }
  assert(korClimbingRefs.length === 0, 'No climbing relative paths from Korean workspace to English workspace', JSON.stringify(korClimbingRefs));

  // 1.2 Cross-workspace runtime dependencies
  const engPkg = JSON.parse(fs.readFileSync(path.join(ENG_ROOT, 'package.json'), 'utf8'));
  const korPkg = JSON.parse(fs.readFileSync(path.join(KOR_ROOT, 'package.json'), 'utf8'));

  assert(!engPkg.dependencies || Object.keys(engPkg.dependencies).length === 0, 'English workspace has zero external runtime dependencies in package.json');
  assert(!korPkg.dependencies || Object.keys(korPkg.dependencies).length === 0, 'Korean workspace has zero external runtime dependencies in package.json');

  // 1.3 Symlinks / Junctions crossing workspaces
  function findSymlinks(dir) {
    let syms = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (['.git', '.agents'].includes(ent.name)) continue;
        const full = path.join(dir, ent.name);
        if (ent.isSymbolicLink()) syms.push(full);
        if (ent.isDirectory()) syms = syms.concat(findSymlinks(full));
      }
    } catch (e) {}
    return syms;
  }
  const engSyms = findSymlinks(ENG_ROOT);
  const korSyms = findSymlinks(KOR_ROOT);
  assert(engSyms.length === 0, 'English workspace has zero symbolic links or junctions', JSON.stringify(engSyms));
  assert(korSyms.length === 0, 'Korean workspace has zero symbolic links or junctions', JSON.stringify(korSyms));

  // 1.4 Check server.js root directories and static serves
  const engServer = fs.readFileSync(path.join(ENG_ROOT, 'server.js'), 'utf8');
  const korServer = fs.readFileSync(path.join(KOR_ROOT, 'server.js'), 'utf8');
  assert(!engServer.includes('사업아이템'), 'English server.js does not reference Korean workspace directory');
  assert(!korServer.includes('키즈핏 영문'), 'Korean server.js does not reference English workspace directory');

  // -------------------------------------------------------------
  // TEST 2: STRICT EXCLUSION TEST
  // -------------------------------------------------------------
  console.log('\n--- 2. Strict Exclusion Test (Korean domestic assets in English workspace) ---');

  const prohibitedFolders = [
    '네이버블로그_글모음',
    '네이버카페_글모음',
    '네이버클립_웹툰영상_모음',
    '웹툰_모음',
    '인스타_쓰레드_프로필_모음',
    '카드뉴스_모음',
    '.naver-browser-profile',
    '.flow-browser-profile'
  ];

  for (const folder of prohibitedFolders) {
    const exists = fs.existsSync(path.join(ENG_ROOT, folder));
    assert(!exists, `Prohibited folder '${folder}' does NOT exist in English workspace root`);
  }

  // Recursive scan for any nested occurrence of prohibited folders
  function searchDirName(dir, targetPatterns) {
    let matches = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (['.git', '.agents', 'node_modules'].includes(ent.name)) continue;
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          for (const pat of targetPatterns) {
            if (ent.name.includes(pat)) {
              matches.push(path.relative(ENG_ROOT, full));
            }
          }
          matches = matches.concat(searchDirName(full, targetPatterns));
        }
      }
    } catch (e) {}
    return matches;
  }

  const domesticDirMatches = searchDirName(ENG_ROOT, ['네이버블로그', '네이버카페', '네이버클립', '웹툰_모음', '인스타_쓰레드', '카드뉴스']);
  assert(domesticDirMatches.length === 0, 'Zero nested Korean domestic marketing directories in English workspace', JSON.stringify(domesticDirMatches));

  // Check marketing zip files
  const rootZips = fs.readdirSync(ENG_ROOT).filter(f => f.endsWith('.zip'));
  assert(rootZips.length === 0, 'Zero marketing zip archives in English workspace root', JSON.stringify(rootZips));

  // Scripts exclusion: English scripts directory must ONLY contain standard infrastructure scripts
  const engScriptFiles = fs.readdirSync(path.join(ENG_ROOT, 'scripts'));
  const approvedScripts = [
    'audit_all_purchase_links.js',
    'build.js',
    'crawl_research_papers.py',
    'e2e-real-chrome-button-audit.js',
    'generate_og_image.js',
    'self-improve-engine.js',
    'telegram-antigravity-bridge.js',
    'telegram-notify.js',
    'verify-acceptance.js'
  ];

  const unapprovedScripts = engScriptFiles.filter(f => !approvedScripts.includes(f));
  assert(unapprovedScripts.length === 0, 'English workspace scripts/ contains ONLY approved non-domestic scripts', JSON.stringify(unapprovedScripts));

  // Korean domestic marketing scripts check (e.g. naver, blog, cafe, kin automation)
  const domesticScriptKeywords = ['naver', 'blog', 'cafe', 'kin', 'insta', 'threads', 'flow', 'webtoon', 'clip'];
  const leakedScripts = engScriptFiles.filter(f => domesticScriptKeywords.some(kw => f.toLowerCase().includes(kw)));
  assert(leakedScripts.length === 0, 'Zero domestic marketing automation scripts in English workspace scripts/', JSON.stringify(leakedScripts));

  // -------------------------------------------------------------
  // TEST 3: STRICT PURGE TEST
  // -------------------------------------------------------------
  console.log('\n--- 3. Strict Purge Test (Lemon Squeezy in Korean workspace) ---');

  // 3.1 Paywall script & order logs files
  const engPaywallSrc = fs.existsSync(path.join(ENG_ROOT, 'src', 'js', 'global-paywall-edition.js'));
  const engOrderLogs = fs.existsSync(path.join(ENG_ROOT, 'logs', 'lemonsqueezy_orders.jsonl'));
  assert(engPaywallSrc, 'global-paywall-edition.js present in English src/js/');
  assert(engOrderLogs, 'lemonsqueezy_orders.jsonl present in English logs/');

  const korOrderLogs = fs.existsSync(path.join(KOR_ROOT, 'logs', 'lemonsqueezy_orders.jsonl'));
  assert(!korOrderLogs, 'lemonsqueezy_orders.jsonl purged from Korean logs/');

  // 3.2 Check Lemon Squeezy environment variables in Korean .env
  const korEnvPath = path.join(KOR_ROOT, '.env');
  const korEnv = fs.existsSync(korEnvPath) ? fs.readFileSync(korEnvPath, 'utf8') : '';
  const korEnvLsMatches = korEnv.split('\n').filter(l => l.toUpperCase().includes('LEMONSQUEEZY'));
  assert(korEnvLsMatches.length === 0, 'Korean .env contains ZERO LEMONSQUEEZY_* variables', JSON.stringify(korEnvLsMatches));

  // 3.3 Check Korean server.js for Lemon Squeezy routes
  const korServerLsEndpoints = ['/api/lemonsqueezy-config', '/api/lemonsqueezy-webhook'].filter(ep => korServer.includes(ep));
  assert(korServerLsEndpoints.length === 0, 'Korean server.js contains ZERO Lemon Squeezy API endpoints', JSON.stringify(korServerLsEndpoints));

  // 3.4 Check Korean index.html & dist/index.html for Lemon Squeezy
  const korIndexHtml = fs.readFileSync(path.join(KOR_ROOT, 'index.html'), 'utf8');
  assert(!korIndexHtml.includes('global-paywall-edition.js'), 'Korean index.html does not reference global-paywall-edition.js');
  assert(!korIndexHtml.includes('lemonsqueezy.com'), 'Korean index.html contains zero lemonsqueezy.com references');

  if (fs.existsSync(path.join(KOR_ROOT, 'dist', 'index.html'))) {
    const korDistHtml = fs.readFileSync(path.join(KOR_ROOT, 'dist', 'index.html'), 'utf8');
    assert(!korDistHtml.includes('global-paywall-edition.js'), 'Korean dist/index.html does not reference global-paywall-edition.js');
    assert(!korDistHtml.includes('lemonsqueezy.com'), 'Korean dist/index.html contains zero lemonsqueezy.com references');
  }

  // 3.5 Check CNAMEs
  const korCname = fs.readFileSync(path.join(KOR_ROOT, 'CNAME'), 'utf8').trim();
  const engCname = fs.readFileSync(path.join(ENG_ROOT, 'CNAME'), 'utf8').trim();
  assert(['kidsfit.co.kr', 'kisfitglobal.com', 'kisfitglobal.com'].includes(korCname), `Korean CNAME is valid domain (got: '${korCname}')`);
  assert(engCname === 'kisfitglobal.com', `English CNAME is 'kisfitglobal.com' (got: '${engCname}')`);

  // -------------------------------------------------------------
  // TEST 4: TELEGRAM BOT ISOLATION TEST
  // -------------------------------------------------------------
  console.log('\n--- 4. Telegram Bot Isolation Test ---');

  const engEnv = fs.readFileSync(path.join(ENG_ROOT, '.env'), 'utf8');

  function parseEnv(text) {
    const res = {};
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        res[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
      }
    }
    return res;
  }

  const engEnvVars = parseEnv(engEnv);
  const korEnvVars = parseEnv(korEnv);

  const EXPECTED_ENG_TOKEN = '8884379894:AAEEyfqtYTc4fRMmySZhjHUAU1ji5Vh5KRw';
  const EXPECTED_KOR_TOKEN = '8874740009:AAHecAzLm5wYe_OyHDCDxrR92P0CcTMd6JE';
  const EXPECTED_ENG_CONV = '278ac9cd-25e2-4d75-93ae-f407a1e6de5d';
  const EXPECTED_KOR_CONV = 'efdd0412-2586-40cf-bb28-0fa8976613df';

  assert(engEnvVars.TELEGRAM_BOT_TOKEN === EXPECTED_ENG_TOKEN, `English .env has token ${EXPECTED_ENG_TOKEN}`);
  assert(korEnvVars.TELEGRAM_BOT_TOKEN === EXPECTED_KOR_TOKEN, `Korean .env has token ${EXPECTED_KOR_TOKEN}`);
  assert(engEnvVars.TELEGRAM_BOT_TOKEN !== korEnvVars.TELEGRAM_BOT_TOKEN, 'English and Korean Telegram tokens are completely distinct');

  assert(engEnvVars.ANTIGRAVITY_CONVERSATION_ID === EXPECTED_ENG_CONV, `English .env conversation ID is ${EXPECTED_ENG_CONV}`);
  assert(korEnvVars.ANTIGRAVITY_CONVERSATION_ID === EXPECTED_KOR_CONV, `Korean .env conversation ID is ${EXPECTED_KOR_CONV}`);
  assert(engEnvVars.ANTIGRAVITY_CONVERSATION_ID !== korEnvVars.ANTIGRAVITY_CONVERSATION_ID, 'English and Korean conversation IDs are distinct (zero crosstalk)');

  // Check bridge script target directories
  const engBridge = fs.readFileSync(path.join(ENG_ROOT, 'scripts', 'telegram-antigravity-bridge.js'), 'utf8');
  const korBridge = fs.readFileSync(path.join(KOR_ROOT, 'scripts', 'telegram-antigravity-bridge.js'), 'utf8');

  assert(engBridge.includes('278ac9cd-25e2-4d75-93ae-f407a1e6de5d'), 'English telegram-antigravity-bridge.js references English conversation ID');
  assert(korBridge.includes('efdd0412-2586-40cf-bb28-0fa8976613df'), 'Korean telegram-antigravity-bridge.js references Korean conversation ID');

  assert(engBridge.includes('키즈핏 영문'), 'English telegram-antigravity-bridge.js directs worker to English workspace');
  assert(!engBridge.includes('d:\\사업아이템') && !engBridge.includes('d:\\\\사업아이템'), 'English telegram-antigravity-bridge.js does NOT direct worker to Korean workspace');
  assert(korBridge.includes('사업아이템'), 'Korean telegram-antigravity-bridge.js directs worker to Korean workspace');

  // Live Telegram API verification for both tokens
  console.log('\n--- 4.1 Live Telegram API getMe Verification ---');
  try {
    const engBotInfo = await fetchHttps(`https://api.telegram.org/bot${EXPECTED_ENG_TOKEN}/getMe`);
    assert(engBotInfo.status === 200 && engBotInfo.body.ok === true, 'Live Telegram API call for English bot returns 200 OK');
    assert(engBotInfo.body.result && engBotInfo.body.result.username === 'kidsfittbot', `English bot username verified as @kidsfittbot (ID: ${engBotInfo.body.result.id})`);
    assert(String(engBotInfo.body.result.id) === '8884379894', 'English bot ID matches token prefix 8884379894');
  } catch (err) {
    assert(false, 'Live Telegram API call for English bot succeeded', err.message);
  }

  try {
    const korBotInfo = await fetchHttps(`https://api.telegram.org/bot${EXPECTED_KOR_TOKEN}/getMe`);
    assert(korBotInfo.status === 200 && korBotInfo.body.ok === true, 'Live Telegram API call for Korean bot returns 200 OK');
    assert(korBotInfo.body.result && String(korBotInfo.body.result.id) === '8874740009', `Korean bot ID matches token prefix 8874740009 (username: @${korBotInfo.body.result?.username})`);
  } catch (err) {
    assert(false, 'Live Telegram API call for Korean bot succeeded', err.message);
  }

  // -------------------------------------------------------------
  // SUMMARY & VERDICT
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`Empirical Test Summary: ${passedAssertions} PASSED, ${failedAssertions} FAILED`);
  console.log('===============================================================');

  if (failedAssertions > 0) {
    console.error('FAILURES ENCOUNTERED:');
    failureDetails.forEach(f => console.error(` - [${f.testName}]: ${f.details}`));
    process.exit(1);
  } else {
    console.log('ALL EMPIRICAL BOUNDARY & ISOLATION CHECKS PASSED PERFECTLY!');
    process.exit(0);
  }
}

runEmpiricalChallenge().catch(err => {
  console.error('Unhandled challenge runner error:', err);
  process.exit(1);
});
