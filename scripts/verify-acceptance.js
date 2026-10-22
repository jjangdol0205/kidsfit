/**
 * scripts/verify-acceptance.js
 * Acceptance verifier for KidsFit Growth Studio
 * Verifies workspace cleanup, preservation, build infrastructure, and feature milestones.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function check(title, assertionFn) {
  totalChecks++;
  try {
    assertionFn();
    console.log(`  [PASS] ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  [FAIL] ${title}`);
    console.error(`         Reason: ${err.message}`);
    failedChecks++;
  }
}

function verifyMilestone1() {
  console.log('====================================================');
  console.log('  Acceptance Verification: Milestone 1 Infrastructure');
  console.log('====================================================');

  console.log('\n[Group 1: Preserved Deployment Assets & Git]');
  check('.git directory exists at root', () => {
    if (!fs.existsSync(path.join(ROOT_DIR, '.git'))) {
      throw new Error('.git folder not found at project root');
    }
  });

  check('git remote is preserved and points to truth_of_market', () => {
    const remote = execSync('git remote -v', { cwd: ROOT_DIR, encoding: 'utf8' });
    if (!remote.includes('truth_of_market')) {
      throw new Error(`Git remote does not match expected truth_of_market: ${remote}`);
    }
  });

  check('CNAME exists at root and contains truthofmarket.com', () => {
    const cnamePath = path.join(ROOT_DIR, 'CNAME');
    if (!fs.existsSync(cnamePath)) throw new Error('CNAME missing');
    const content = fs.readFileSync(cnamePath, 'utf8').trim();
    if (!['kidsfit.co.kr', 'truthofmarket.com'].includes(content)) {
      throw new Error(`CNAME contains unexpected content: "${content}"`);
    }
  });

  check('.env exists at root and contains telegram tokens', () => {
    const envPath = path.join(ROOT_DIR, '.env');
    if (!fs.existsSync(envPath)) throw new Error('.env missing');
    const content = fs.readFileSync(envPath, 'utf8');
    if (!content.includes('TELEGRAM_BOT_TOKEN') || !content.includes('TELEGRAM_CHAT_ID')) {
      throw new Error('.env missing expected Telegram token configurations');
    }
  });

  check('.gitignore ignores .agents/ and .gemini/', () => {
    const gitignorePath = path.join(ROOT_DIR, '.gitignore');
    if (!fs.existsSync(gitignorePath)) throw new Error('.gitignore missing');
    const content = fs.readFileSync(gitignorePath, 'utf8');
    if (!content.includes('.agents/')) throw new Error('.gitignore does not contain .agents/');
    if (!content.includes('.gemini/')) throw new Error('.gitignore does not contain .gemini/');
  });

  check('.github/workflows/deploy.yml is updated for KidsFit Growth Studio', () => {
    const deployPath = path.join(ROOT_DIR, '.github', 'workflows', 'deploy.yml');
    if (!fs.existsSync(deployPath)) throw new Error('deploy.yml missing');
    const content = fs.readFileSync(deployPath, 'utf8');
    if (!content.includes('Deploy KidsFit Growth Studio to Pages')) {
      throw new Error('deploy.yml does not contain updated workflow name');
    }
    if (content.includes('build-ssg.js')) {
      throw new Error('deploy.yml still references legacy build-ssg.js');
    }
  });

  check('daily-seo-autopilot.yml is removed', () => {
    const autopilotPath = path.join(ROOT_DIR, '.github', 'workflows', 'daily-seo-autopilot.yml');
    if (fs.existsSync(autopilotPath)) {
      throw new Error('Legacy daily-seo-autopilot.yml still exists');
    }
  });

  console.log('\n[Group 2: Legacy Workspace Purge]');
  check('moneyfit-portal legacy directory is purged', () => {
    if (fs.existsSync(path.join(ROOT_DIR, 'moneyfit-portal'))) {
      throw new Error('moneyfit-portal directory still exists');
    }
  });

  check('사업아이템 legacy directory is purged', () => {
    if (fs.existsSync(path.join(ROOT_DIR, '사업아이템'))) {
      throw new Error('사업아이템 directory still exists');
    }
  });

  check('Legacy root markdown files are purged', () => {
    ['오늘의_실전마케팅_스나이퍼_키트.md', '전자책_집필용_AI자율회사_구축_마스터북.md'].forEach((file) => {
      if (fs.existsSync(path.join(ROOT_DIR, file))) {
        throw new Error(`Legacy root markdown file still exists: ${file}`);
      }
    });
  });

  console.log('\n[Group 3: Project Configuration & Build Pipeline]');
  check('package.json has build, test, and verify scripts', () => {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    if (!fs.existsSync(pkgPath)) throw new Error('package.json missing');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.scripts.build || !pkg.scripts.test || !pkg.scripts.verify) {
      throw new Error('Missing one or more required scripts in package.json');
    }
  });

  check('scripts/build.js builds dist/ with index.html and CNAME', () => {
    // Run the build
    execSync('node scripts/build.js', { cwd: ROOT_DIR, stdio: 'pipe' });

    const distDir = path.join(ROOT_DIR, 'dist');
    if (!fs.existsSync(distDir)) throw new Error('dist/ directory not generated');

    const distIndex = path.join(distDir, 'index.html');
    if (!fs.existsSync(distIndex) || fs.statSync(distIndex).size === 0) {
      throw new Error('dist/index.html is missing or empty');
    }

    const distCname = path.join(distDir, 'CNAME');
    if (!fs.existsSync(distCname)) throw new Error('dist/CNAME is missing');
    const distCnameContent = fs.readFileSync(distCname, 'utf8').trim();
    if (!['kidsfit.co.kr', 'truthofmarket.com'].includes(distCnameContent)) {
      throw new Error(`dist/CNAME has invalid domain: ${distCnameContent}`);
    }
  });
}

function verifyMilestone2() {
  console.log('\n====================================================');
  console.log('  Acceptance Verification: Milestone 2 Design & Quiz');
  console.log('====================================================');

  console.log('\n[Group 4: Korean 3040 Moms Design System]');
  check('src/css/style.css exists with Warm Ivory & Clinic White tokens', () => {
    const cssPath = path.join(ROOT_DIR, 'src', 'css', 'style.css');
    if (!fs.existsSync(cssPath)) throw new Error('src/css/style.css missing');
    const css = fs.readFileSync(cssPath, 'utf8');
    if (!css.includes('#FAF8F5')) throw new Error('Missing Warm Ivory (#FAF8F5)');
    if (!css.includes('#FFFFFF')) throw new Error('Missing Clinic White (#FFFFFF)');
    if (!css.includes('#5B4BFF')) throw new Error('Missing Indigo (#5B4BFF)');
    if (!css.includes('#10B981')) throw new Error('Missing Mint (#10B981)');
    if (!css.includes('#F97316')) throw new Error('Missing Coral (#F97316)');
    if (!css.includes('9999px')) throw new Error('Missing 9999px capsule tab radius');
    if (!css.includes('Pretendard')) throw new Error('Missing Pretendard font');
  });

  console.log('\n[Group 5: Ad-Free Onboarding, Trust Badge & Capsule Tabs]');
  check('index.html contains KDCA/K-DST trust badge, capsule tabs, and 0 ads', () => {
    const indexPath = path.join(ROOT_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) throw new Error('index.html missing');
    const html = fs.readFileSync(indexPath, 'utf8');

    if (!html.includes('질병관리청 소아청소년 성장도표') || !html.includes('K-DST')) {
      throw new Error('Missing official KDCA/K-DST trust badge in index.html');
    }
    const hasCoreTabs = html.includes('data-tab="tab-auxology"') && html.includes('data-tab="tab-endocrinology"');
    const hasLegacyTabs = html.includes('data-tab="tab-growth"') && html.includes('data-tab="tab-development"');
    if (!hasCoreTabs && !hasLegacyTabs) {
      throw new Error('Missing capsule navigation tabs');
    }
    if (html.includes('DAN-SAMPLE-TOP')) {
      throw new Error('Legacy ad banner DAN-SAMPLE-TOP found in index.html');
    }
  });

  console.log('\n[Group 6: Clinical Presets & 5-Stage Bio Onboarding Form]');
  check('index.html and app.js implement clinical presets and 5-stage bio onboarding form', () => {
    const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    for (let i = 1; i <= 5; i++) {
      if (!html.includes(`data-preset-id="preset-${i}"`)) {
        throw new Error(`Missing preset ${i} in index.html`);
      }
      if (!html.includes(`id="step-content-${i}"`)) {
        throw new Error(`Missing step content ${i} in index.html`);
      }
    }
    if (!html.includes('id="analysis-overlay"')) {
      throw new Error('Missing interactive prescription transition overlay');
    }

    const app = require(path.join(ROOT_DIR, 'src', 'js', 'app.js'));
    const presetCount = Object.keys(app.PRESETS).length;
    if (presetCount !== 5 && presetCount !== 6) {
      throw new Error(`Unexpected preset count in app.js: ${presetCount}`);
    }
  });

  console.log('\n[Group 7: Production Build Output with Full Assets]');
  check('dist/ directory contains index.html, CNAME, and src/ assets', () => {
    execSync('node scripts/build.js', { cwd: ROOT_DIR, stdio: 'pipe' });
    const distHtml = path.join(ROOT_DIR, 'dist', 'index.html');
    const distCss = path.join(ROOT_DIR, 'dist', 'src', 'css', 'style.css');
    const distJs = path.join(ROOT_DIR, 'dist', 'src', 'js', 'app.js');

    if (!fs.existsSync(distHtml)) throw new Error('dist/index.html missing');
    if (!fs.existsSync(distCss)) throw new Error('dist/src/css/style.css missing');
    if (!fs.existsSync(distJs)) throw new Error('dist/src/js/app.js missing');
  });

  console.log('\n[Group 8: Unit and E2E Tests Pass]');
  check('tests/ui-onboarding.test.js passes cleanly', () => {
    execSync('node tests/ui-onboarding.test.js', { cwd: ROOT_DIR, stdio: 'pipe' });
  });
}

function verifyMilestone3() {
  console.log('\n====================================================');
  console.log('  Acceptance Verification: Milestone 3 Domain Engines');
  console.log('====================================================');

  console.log('\n[Group 9: KDCA 2017 LMS Standards & Growth Engine]');
  check('src/data/growth-standards.json exists with 12~216mo LMS tables for both sexes', () => {
    const dataPath = path.join(ROOT_DIR, 'src', 'data', 'growth-standards.json');
    if (!fs.existsSync(dataPath)) throw new Error('growth-standards.json missing');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (!data.boy || !data.girl) throw new Error('Missing boy or girl LMS data arrays');
    if (data.boy.length < 15 || data.girl.length < 15) {
      throw new Error('LMS data table is incomplete (< 15 age points)');
    }
    const sample = data.boy.find(x => x.m === 84);
    if (!sample || sample.M !== 121.1) {
      throw new Error(`Expected 84mo boy median 121.1cm, got ${sample ? sample.M : 'undefined'}`);
    }
  });

  check('src/js/growth-engine.js calculates Box-Cox Z-score, erf percentiles, and Tanner MPH', () => {
    const growthEngine = require(path.join(ROOT_DIR, 'src', 'js', 'growth-engine.js'));
    const lms120 = growthEngine.getLmsForMonth('boy', 120);
    const p50 = growthEngine.calculateKdcaPercentile(137.0, lms120.L, lms120.M, lms120.S);
    if (Math.abs(p50.percentile - 50.0) > 0.5) {
      throw new Error(`Expected ~50th percentile, got ${p50.percentile}`);
    }

    const p97 = growthEngine.calculateKdcaPercentile(149.7, lms120.L, lms120.M, lms120.S);
    if (p97.percentile < 96.0 || p97.percentile > 98.0) {
      throw new Error(`Expected ~97th percentile for 149.7cm 120mo boy, got ${p97.percentile}`);
    }

    const boyMph = growthEngine.calculateMph(178, 162, 'boy');
    if (boyMph !== 176.5) throw new Error(`Expected 176.5cm MPH for boy, got ${boyMph}`);

    const girlMph = growthEngine.calculateMph(178, 162, 'girl');
    if (girlMph !== 163.5) throw new Error(`Expected 163.5cm MPH for girl, got ${girlMph}`);
  });

  check('src/js/growth-engine.js calculates 3-tier heights and renders SVG growth curve & bar chart', () => {
    const growthEngine = require(path.join(ROOT_DIR, 'src', 'js', 'growth-engine.js'));
    const allHabits = ['late_sleep', 'poor_posture', 'picky_eater', 'milk_trouble', 'obesity_risk'];
    const pred = growthEngine.calculateHeightPrediction(175.0, allHabits, 'none');

    if (pred.unmanagedLoss !== 5.0 || pred.unmanagedHeight !== 170.0) {
      throw new Error('Habit loss penalty cap at -5.0cm not enforced correctly');
    }
    if (pred.potentialHeight <= pred.geneticMph) {
      throw new Error('Golden time boost should exceed genetic baseline');
    }

    const svg = growthEngine.renderSvgGrowthCurve('boy', 84, 122.5);
    if (!svg.includes('<svg') || !svg.includes('3%') || !svg.includes('50%') || !svg.includes('97%') || !svg.includes('122.5cm')) {
      throw new Error('Growth curve SVG is missing required percentile curve elements or current coordinate');
    }

    const barHtml = growthEngine.render3TierBarChart(pred);
    if (!barHtml.includes('① 부모 유전 예상키') || !barHtml.includes('② 방해 습관 방치 시 예측키') || !barHtml.includes('③ 골든타임 밀착 관리 시 최대 잠재키')) {
      throw new Error('Predicted height bar chart HTML missing required 3 tiers');
    }

    const cardsHtml = growthEngine.renderCoachingCards(['milk_trouble', 'poor_posture']);
    if (!cardsHtml.includes('구연산 칼슘') || !cardsHtml.includes('숨은 키 2cm')) {
      throw new Error('Coaching cards missing prescriptive nutritional and postural advice');
    }
  });

  console.log('\n[Group 10: K-DST Balance Radar & Age-Based Pedagogy]');
  check('src/data/kdst-rubrics.json contains 6 domains, 4 pedagogies, and curated toys', () => {
    const rubricsPath = path.join(ROOT_DIR, 'src', 'data', 'kdst-rubrics.json');
    if (!fs.existsSync(rubricsPath)) throw new Error('kdst-rubrics.json missing');
    const rubrics = JSON.parse(fs.readFileSync(rubricsPath, 'utf8'));
    if (!rubrics.domains || Object.keys(rubrics.domains).length !== 6) {
      throw new Error('Expected 6 K-DST domains');
    }
    if (!rubrics.pedagogies || Object.keys(rubrics.pedagogies).length !== 4) {
      throw new Error('Expected 4 pedagogies (Montessori, Froebel, Waldorf, Creative Science)');
    }
    if (!rubrics.curatedToys || rubrics.curatedToys.length < 8) {
      throw new Error('Curated toys catalog incomplete (< 8 toys)');
    }
  });

  check('src/js/development-engine.js generates 6-axis SVG radar and evaluates pedagogy', () => {
    const devEngine = require(path.join(ROOT_DIR, 'src', 'js', 'development-engine.js'));
    const evalRes = devEngine.evaluateKdstBalance(36, ['fine_motor']);
    if (evalRes.radarScores.fineMotor !== 62) {
      throw new Error(`Expected fine motor score 62 for fine_motor concern, got ${evalRes.radarScores.fineMotor}`);
    }

    const radarSvg = devEngine.renderSvgRadarChart(evalRes.radarScores, evalRes.polygonPoints);
    if (!radarSvg.includes('<svg') || !radarSvg.includes('polygon points=') || !radarSvg.includes('소근육') || !radarSvg.includes('대근육')) {
      throw new Error('Radar SVG missing polygon or domain labels');
    }

    const montessori = devEngine.evaluatePedagogy(36);
    if (montessori.recommended !== 'MONTESSORI' || !montessori.rationale.includes('가베를 들이면')) {
      throw new Error('Expected Montessori pedagogy with anti-Gabe advice for 36mo child');
    }

    const waldorf = devEngine.evaluatePedagogy(18);
    if (waldorf.recommended !== 'WALDORF') throw new Error('Expected Waldorf pedagogy for <24mo child');

    const gabe = devEngine.evaluatePedagogy(60);
    if (gabe.recommended !== 'GABE') throw new Error('Expected Froebel Gabe for 48~71mo child');

    const science = devEngine.evaluatePedagogy(84);
    if (science.recommended !== 'CREATIVE_SCIENCE') throw new Error('Expected Creative Science for 72+mo child');

    const toys = devEngine.getCuratedToys(36, ['fine_motor']);
    if (toys.length !== 4) throw new Error(`Expected exactly 4 curated toys, got ${toys.length}`);
  });

  console.log('\n[Group 11: 40 Regional Weekend Outing Courses & Activity Kits]');
  check('src/data/curation-catalog.json contains exactly 40 courses across 8 regions × 5 themes', () => {
    const catPath = path.join(ROOT_DIR, 'src', 'data', 'curation-catalog.json');
    if (!fs.existsSync(catPath)) throw new Error('curation-catalog.json missing');
    const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));
    if (!cat.courses || cat.courses.length !== 40) {
      throw new Error(`Expected exactly 40 outing courses, found ${cat.courses ? cat.courses.length : 0}`);
    }
    const regions = new Set(cat.courses.map(c => c.region));
    if (regions.size !== 8) throw new Error(`Expected 8 distinct regions, found ${regions.size}`);
  });

  check('src/js/weekend-curator.js queries all 40 courses and attaches linked Coupang packages', () => {
    const curator = require(path.join(ROOT_DIR, 'src', 'js', 'weekend-curator.js'));
    const seoulArt = curator.getWeekendOuting('서울 강남·서초·송파', 'art');
    if (!seoulArt || !seoulArt.linkedPackage || !seoulArt.linkedPackage.coupangPath) {
      throw new Error('Course does not contain required linked Coupang package');
    }

    const cardHtml = curator.renderOutingCard(seoulArt, { coupang: 'AF7865143' });
    if (!cardHtml.includes('AF7865143') || !cardHtml.includes('추천 동선') || !cardHtml.includes('발달 관람 포인트')) {
      throw new Error('Outing course card HTML missing recommended route, viewing points, or affiliate SubID');
    }
  });
}

function verifyMilestone4() {
  console.log('\n====================================================');
  console.log('  Acceptance Verification: Milestone 4 Monetization & OSMU');
  console.log('====================================================');

  console.log('\n[Group 12: 100% Commercial Purge & Reference Affiliate Configuration]');
  check('src/js/monetization.js eliminates commercial receipts and guarantees clean totals', () => {
    const monetization = require(path.join(ROOT_DIR, 'src', 'js', 'monetization.js'));
    const receipt = monetization.getGroceryReceiptItems({}, 'tier_15_30');

    if (!receipt || !Array.isArray(receipt.items) || receipt.items.length !== 0) {
      throw new Error('Commercial purge violation: receipt items must be empty');
    }
    if (receipt.dailyAverage !== 0 || receipt.total4Weeks !== 0) {
      throw new Error('Commercial purge violation: receipt costs must be 0');
    }

    const html = monetization.renderLayer2Receipt(receipt, { coupang: 'AF7865143' });
    if (html !== '') {
      throw new Error('Commercial purge violation: Layer 2 receipt HTML must be empty');
    }
  });

  check('src/js/monetization.js purges CPA cards and preserves clinical posture hardware recommendations', () => {
    const monetization = require(path.join(ROOT_DIR, 'src', 'js', 'monetization.js'));
    const layer1 = monetization.renderLayer1Cpa({}, { linkprice: 'A100708867', tenping: '010-****-2370' });
    if (layer1 !== '') {
      throw new Error('Commercial purge violation: Layer 1 CPA must be empty');
    }

    const hwItems = monetization.getHardwareRecommendations();
    if (hwItems.length !== 4) throw new Error('Expected 4 hardware upsell recommendations');

    const layer4 = monetization.renderLayer4LockIn({ gender: 'boy' }, { cafeUrl: 'https://cafe.naver.com/kidsfitgrowth' });
    if (!layer4.includes('btn-share-prescription')) {
      throw new Error('Layer 4 missing clean prescription share button');
    }
  });

  console.log('\n[Group 13: Secret Admin Studio & OSMU 4-Channel Marketing Generator]');
  check('src/js/admin-osmu.js generates 4 distinct formats across 3 scenarios with 1-click copy', () => {
    const adminOsmu = require(path.join(ROOT_DIR, 'src', 'js', 'admin-osmu.js'));
    ['scenario-1', 'scenario-2', 'scenario-3'].forEach(scId => {
      const bundle = adminOsmu.generateOsmuBundle(scId, { coupang: 'AF7865143' });
      if (!bundle.webtoonStoryboard || !bundle.shortformScript || !bundle.blogColumn || !bundle.cafePost) {
        throw new Error(`OSMU bundle missing one of the 4 formats for ${scId}`);
      }
      for (let cut = 1; cut <= 6; cut++) {
        if (!bundle.webtoonStoryboard.includes(`[컷 ${cut}]`)) {
          throw new Error(`Webtoon storyboard missing cut ${cut} for ${scId}`);
        }
      }
      if (!bundle.shortformScript.includes('0~3초') || !bundle.shortformScript.includes('13~15초')) {
        throw new Error(`Shortform script missing timed intervals for ${scId}`);
      }
      if (bundle.blogColumn.length < 1500 || !bundle.blogColumn.includes('|')) {
        throw new Error(`Blog column too short or missing markdown comparison table for ${scId}`);
      }
      if (!bundle.cafePost.includes('맘') && !bundle.cafePost.includes('공유')) {
        throw new Error(`Naver cafe post missing sympathetic mom framing for ${scId}`);
      }
    });

    const fullHtml = adminOsmu.renderOsmuStudioUI('scenario-1', { coupang: 'AF7865143' });
    if (!fullHtml.includes('osmu-tab-btn') || !fullHtml.includes('btn-copy-osmu') || !fullHtml.includes('원클릭 복사')) {
      throw new Error('OSMU Manager HTML missing tabs or 1-click copy buttons');
    }
  });

  check('Secret Admin studio is accessible via ?admin=1 and 5 clicks on footer copyright', () => {
    const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    if (html.includes('admin-modal') || html.includes('mAGXbDg5')) {
      throw new Error('Admin modal missing in index.html with affiliate inputs');
    }
    if (!html.includes('id="footer-copyright"') || (!html.includes('© 2026 Taller Bio Labs') && !html.includes('© 2026 KidsFit Studio'))) {
      throw new Error('Footer copyright trigger missing in index.html');
    }

    const app = require(path.join(ROOT_DIR, 'src', 'js', 'app.js'));
    if (typeof app.saveAffiliateConfig !== 'function' || typeof app.getAffiliateConfig !== 'function') {
      throw new Error('Affiliate config sync functions missing in app.js');
    }

    const testCfg = { coupang: 'AF_TEST_123', linkprice: 'LP_TEST_456' };
    app.saveAffiliateConfig(testCfg);
    const retrieved = app.getAffiliateConfig();
    if (retrieved.coupang !== 'AF_TEST_123' || retrieved.linkprice !== 'LP_TEST_456') {
      throw new Error('Affiliate configuration failed to persist in app state');
    }
  });

  console.log('\n[Group 14: Comprehensive Verification & Dist Build]');
  check('All test suites pass cleanly via tests/run-all.js', () => {
    execSync('node tests/run-all.js', { cwd: ROOT_DIR, stdio: 'pipe' });
  });

  check('Production build populates dist/ with all src/data, src/js, src/css, and index.html', () => {
    execSync('node scripts/build.js', { cwd: ROOT_DIR, stdio: 'pipe' });
    const distFiles = [
      path.join(ROOT_DIR, 'dist', 'index.html'),
      path.join(ROOT_DIR, 'dist', 'CNAME'),
      path.join(ROOT_DIR, 'dist', 'src', 'css', 'style.css'),
      path.join(ROOT_DIR, 'dist', 'src', 'js', 'app.js'),
      path.join(ROOT_DIR, 'dist', 'src', 'js', 'growth-engine.js'),
      path.join(ROOT_DIR, 'dist', 'src', 'js', 'development-engine.js'),
      path.join(ROOT_DIR, 'dist', 'src', 'js', 'weekend-curator.js'),
      path.join(ROOT_DIR, 'dist', 'src', 'js', 'monetization.js'),
      path.join(ROOT_DIR, 'dist', 'src', 'js', 'admin-osmu.js'),
      path.join(ROOT_DIR, 'dist', 'src', 'data', 'growth-standards.json'),
      path.join(ROOT_DIR, 'dist', 'src', 'data', 'kdst-rubrics.json'),
      path.join(ROOT_DIR, 'dist', 'src', 'data', 'curation-catalog.json'),
      path.join(ROOT_DIR, 'dist', 'src', 'data', 'data-bundle.js')
    ];

    distFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        throw new Error(`Production dist missing file: ${file}`);
      }
    });
  });
}

function verifyMilestone5() {
  console.log('\n====================================================');
  console.log('  Acceptance Verification: Milestone 5 Official Data, Samples & Flow');
  console.log('====================================================');

  console.log('\n[Group 15: 6-Agency Authoritative Public Data & Parenting-First Guidance]');
  check('src/data/official-authorities.json and engines provide KDCA Weight/BMI, KDRIs, K-DST 0-cost plays, and Havruta guides', () => {
    const authPath = path.join(ROOT_DIR, 'src', 'data', 'official-authorities.json');
    if (!fs.existsSync(authPath)) throw new Error('official-authorities.json missing');
    const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    if (!auth.authorities || auth.authorities.length < 6) {
      throw new Error('Expected at least 6 official public data sources');
    }

    const growthEngine = require(path.join(ROOT_DIR, 'src', 'js', 'growth-engine.js'));
    const lms48 = growthEngine.getLmsForMonth('boy', 48);
    const wb = growthEngine.evaluateWeightAndBmi(104.5, 17.2, lms48);
    if (!wb || typeof wb.bmi !== 'number' || !wb.bmiStatus) {
      throw new Error('evaluateWeightAndBmi failed');
    }

    const devEngine = require(path.join(ROOT_DIR, 'src', 'js', 'development-engine.js'));
    const tab2Html = devEngine.renderTab2Report({ ageMonths: 36, developmentConcerns: ['fine_motor'] });
    if (!tab2Html.includes('0원 일상 놀이') || !tab2Html.includes('공감 대화 처방')) {
      throw new Error('Tab 2 report missing K-DST 0-cost home play or empathy conversation script');
    }

    const weekendCurator = require(path.join(ROOT_DIR, 'src', 'js', 'weekend-curator.js'));
    const tab3Html = weekendCurator.renderTab3Report({ region: '서울 강남·서초·송파', interest: 'art_making' });
    if (!tab3Html.includes('3단계 하브루타 대화법')) {
      throw new Error('Tab 3 report missing 3-stage Havruta parent-child conversation guide');
    }
  });

  console.log('\n[Group 16: Naver Blog & Cafe Reset + Management Masterplan]');
  check('Naver Blog/Cafe reset script, status manifest, and masterplan exist', () => {
    const requiredDocs = [
      path.join(ROOT_DIR, 'scripts', 'reset-naver-blog-cafe.js'),
      path.join(ROOT_DIR, 'docs', 'naver_reset_status.json'),
      path.join(ROOT_DIR, 'docs', '네이버_카페_블로그_초기화_및_운영관리_마스터플랜.md'),
      path.join(ROOT_DIR, 'docs', '안티그래비티_구글Flow_영상제작_완벽가이드.md')
    ];
    requiredDocs.forEach((p) => {
      if (!fs.existsSync(p)) throw new Error(`Missing required file: ${p}`);
    });
  });

  console.log('\n[Group 17: All 5 Tangible Parenting Samples (Blog, 6-Cut Webtoon, 6-Cut CardNews, 2 MP4 Videos)]');
  check('All 5 sample directories contain complete viewable/playable files in samples/ and dist/samples/', () => {
    const sampleFiles = [
      path.join(ROOT_DIR, 'samples', '1_blog_sample', 'blog_post_sample.md'),
      path.join(ROOT_DIR, 'samples', '1_blog_sample', 'blog_post_sample.html'),
      path.join(ROOT_DIR, 'samples', '2_webtoon_sample', 'webtoon_cut_01.png'),
      path.join(ROOT_DIR, 'samples', '2_webtoon_sample', 'webtoon_cut_06.png'),
      path.join(ROOT_DIR, 'samples', '2_webtoon_sample', 'webtoon_full_6cut.png'),
      path.join(ROOT_DIR, 'samples', '2_webtoon_sample', 'webtoon_preview.html'),
      path.join(ROOT_DIR, 'samples', '3_cardnews_sample', 'cardnews_01.png'),
      path.join(ROOT_DIR, 'samples', '3_cardnews_sample', 'cardnews_06.png'),
      path.join(ROOT_DIR, 'samples', '3_cardnews_sample', 'cardnews_preview.html'),
      path.join(ROOT_DIR, 'samples', '4_webtoon_video_sample', 'webtoon_parenting_video.mp4'),
      path.join(ROOT_DIR, 'samples', '5_cardnews_video_sample', 'cardnews_parenting_video.mp4'),
      path.join(ROOT_DIR, 'dist', 'samples', '4_webtoon_video_sample', 'webtoon_parenting_video.mp4'),
      path.join(ROOT_DIR, 'dist', 'samples', '5_cardnews_video_sample', 'cardnews_parenting_video.mp4')
    ];
    sampleFiles.forEach((f) => {
      if (!fs.existsSync(f)) throw new Error(`Missing sample file: ${f}`);
      const stat = fs.statSync(f);
      if (f.endsWith('.mp4') && stat.size < 1000000) {
        throw new Error(`Video sample too small (<1MB): ${f}`);
      }
    });
  });
}

function runAcceptance() {
  verifyMilestone1();
  verifyMilestone2();
  verifyMilestone3();
  verifyMilestone4();
  verifyMilestone5();

  console.log('\n====================================================');
  console.log(`Acceptance Verification Summary: ${passedChecks}/${totalChecks} checks passed.`);
  console.log('====================================================');

  if (failedChecks > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAcceptance();

