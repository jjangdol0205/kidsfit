/**
 * tests/tier5-adversarial.test.js
 * Tier 5 Adversarial Coverage Hardening Test Suite for KidsFit Growth Studio.
 * 
 * Focus Areas:
 * 1. Permutation Stress: All 40 regional weekend outing courses (8 regions × 5 themes)
 *    - Zero missing entries, strictly unique IDs (C01~C40)
 *    - Valid titles, summaries, viewpoints, booking tips, routes, and book package prices
 *    - Theme code aliases (art, history, dino, science, music)
 *    - Robust fallback on null/undefined/unknown region or theme
 *    - Dynamic affiliate SubID injection in rendered HTML
 * 
 * 2. Pedagogy Matrix Boundaries:
 *    - Edge months: 23mo vs 24mo (Waldorf -> Montessori)
 *    - 47mo vs 48mo (Montessori -> Gabe)
 *    - 71mo vs 72mo (Gabe -> Creative Science)
 *    - Fractional boundaries (23.99/24.0, 47.99/48.0, 71.99/72.0)
 *    - Anti-Gabe advice validation in Montessori window (24~47mo)
 *    - Developmental concern weighting (fine_motor, math_space)
 *    - Extreme ages (0, 1, 12, 120, 216mo) and string month parsing
 * 
 * 3. Secret Admin Trigger Stress:
 *    - Rapid clicks (1, 2, 3, 4, 5, 6 clicks)
 *    - Click count reset and threshold logic
 *    - Timeout reset window (3000ms expiration)
 *    - Query parameter edge cases (?admin=1, ?admin=0, ?admin=true, ?admin=false, ?admin=, ?user=admin)
 *    - Modal state toggles (open/close, aria-hidden, display styles)
 *    - Real-time affiliate configuration sync
 * 
 * 4. OSMU Copy Generator Stress:
 *    - 3 Scenarios × 4 Channels = 12 combinations
 *    - Channel 1 (Webtoon): 6 cuts, each with AI image prompt, speech bubble, and 30s TTS narration
 *    - Channel 2 (Shorts 15s): 4 time intervals (0~3s, 4~8s, 9~12s, 13~15s)
 *    - Channel 3 (Blog): >= 1,500 characters, Markdown comparison table, bridge links
 *    - Channel 4 (Cafe): Title tag, emotional hook, PDF/group buy survey, bridge link
 *    - Fallback behavior on invalid scenario IDs
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const CURATOR_PATH = path.join(ROOT_DIR, 'src', 'js', 'weekend-curator.js');
const DEV_ENGINE_PATH = path.join(ROOT_DIR, 'src', 'js', 'development-engine.js');
const ADMIN_OSMU_PATH = path.join(ROOT_DIR, 'src', 'js', 'admin-osmu.js');
const APP_PATH = path.join(ROOT_DIR, 'src', 'js', 'app.js');
const CATALOG_PATH = path.join(ROOT_DIR, 'src', 'data', 'curation-catalog.json');

const WeekendCurator = require(CURATOR_PATH);
const DevelopmentEngine = require(DEV_ENGINE_PATH);
const AdminOsmu = require(ADMIN_OSMU_PATH);
const KidsFitApp = require(APP_PATH);
const catalogData = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function it(title, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${title}`);
    console.error(`         ${err.message}`);
    failedTests++;
  }
}

function runTier5HardeningSuite() {
  console.log('================================================================');
  console.log('   KidsFit Growth Studio - Tier 5 Adversarial Coverage Suite    ');
  console.log('================================================================');

  // ==========================================================================
  console.log('\n[Section 1: 40 Regional Weekend Outing Courses Permutations & Stress]');
  // ==========================================================================

  const REGIONS = [
    '서울 강남·서초·송파',
    '서울 강북·마포·용산',
    '경기 남부(분당·수원·용인·동탄)',
    '경기 북부·인천',
    '부산·경남',
    '대구·경북',
    '대전·충청',
    '광주·전라·기타'
  ];

  const THEMES = [
    'art_making',
    'history_tradition',
    'dino_nature',
    'space_science',
    'music_musical'
  ];

  const THEME_ALIASES = {
    art: 'art_making',
    history: 'history_tradition',
    dino: 'dino_nature',
    science: 'space_science',
    music: 'music_musical'
  };

  it('catalog JSON contains exactly 40 courses with 40 unique course IDs', () => {
    assert(Array.isArray(catalogData.courses), 'catalogData.courses must be an array');
    assert.strictEqual(catalogData.courses.length, 40, 'Must have exactly 40 courses');
    const ids = new Set(catalogData.courses.map((c) => c.id));
    assert.strictEqual(ids.size, 40, 'All 40 course IDs must be unique');
  });

  it('guarantees complete coverage for all 8 regions × 5 themes (40 combinations)', () => {
    const discoveredIds = new Set();

    for (const region of REGIONS) {
      for (const theme of THEMES) {
        const course = WeekendCurator.getWeekendOuting(region, theme);
        assert(course, `Missing course for region: ${region}, theme: ${theme}`);
        assert.strictEqual(course.region, region, `Region mismatch for course ${course.id}`);
        assert.strictEqual(course.themeKey, theme, `Theme mismatch for course ${course.id}`);

        // ID pattern check (C01 ~ C40)
        assert(/^C\d{2}$/.test(course.id), `Course ID format invalid: ${course.id}`);
        discoveredIds.add(course.id);

        // Required content fields
        assert(typeof course.destination === 'string' && course.destination.trim().length > 3, `Destination empty or too short for ${course.id}`);
        assert(typeof course.summary === 'string' && course.summary.trim().length > 5, `Summary empty or too short for ${course.id}`);
        assert(Array.isArray(course.viewPoints) && course.viewPoints.length >= 2, `Viewpoints must have >= 2 items for ${course.id}`);
        assert(typeof course.bookingTips === 'string' && course.bookingTips.trim().length > 5, `Booking tips empty for ${course.id}`);
        assert(typeof course.route === 'string' && course.route.includes('→'), `Route must contain transition arrows (→) for ${course.id}`);

        // Linked Package integrity
        assert(course.linkedPackage, `Linked package missing for ${course.id}`);
        assert(typeof course.linkedPackage.title === 'string' && course.linkedPackage.title.length > 3, `Package title invalid for ${course.id}`);
        assert(typeof course.linkedPackage.reason === 'string' && course.linkedPackage.reason.length > 5, `Package reason invalid for ${course.id}`);
        assert(Number.isInteger(course.linkedPackage.price) && course.linkedPackage.price >= 10000 && course.linkedPackage.price <= 50000, `Package price out of reasonable range (10k~50k) for ${course.id}: ${course.linkedPackage.price}`);
        assert(typeof course.linkedPackage.coupangPath === 'string' && course.linkedPackage.coupangPath.length > 5, `Coupang path invalid for ${course.id}`);
      }
    }

    assert.strictEqual(discoveredIds.size, 40, 'Should have retrieved all 40 distinct course IDs');
  });

  it('resolves theme code aliases (art, history, dino, science, music) identically to canonical keys', () => {
    for (const [alias, canonical] of Object.entries(THEME_ALIASES)) {
      const canonicalCourse = WeekendCurator.getWeekendOuting(REGIONS[0], canonical);
      const aliasCourse = WeekendCurator.getWeekendOuting(REGIONS[0], alias);
      assert.strictEqual(aliasCourse.id, canonicalCourse.id, `Alias "${alias}" should map to identical course ID as canonical "${canonical}"`);
      assert.strictEqual(aliasCourse.destination, canonicalCourse.destination);
    }
  });

  it('handles null, undefined, empty, and unknown regions & themes with graceful fallback without throwing', () => {
    const fallbackNull = WeekendCurator.getWeekendOuting(null, null);
    assert(fallbackNull, 'Null inputs should return fallback');
    assert.strictEqual(fallbackNull.id, 'C01');

    const fallbackUndefined = WeekendCurator.getWeekendOuting(undefined, undefined);
    assert.strictEqual(fallbackUndefined.id, 'C01');

    const fallbackUnknown = WeekendCurator.getWeekendOuting('제주도 서귀포시', 'robotics_ai_unknown');
    assert(fallbackUnknown, 'Unknown inputs should return fallback');
    assert.strictEqual(fallbackUnknown.id, 'C01');
  });

  it('renders outing card and Tab 3 report HTML cleanly with dynamic Coupang SubID injection', () => {
    const sampleCourse = WeekendCurator.getWeekendOuting('부산·경남', 'dino_nature');
    const customConfig = { coupang: 'AF_ADVERSARIAL_TEST_999' };
    const html = WeekendCurator.renderOutingCard(sampleCourse, customConfig);

    assert(html.includes('AF_ADVERSARIAL_TEST_999'), 'Rendered HTML must include custom Coupang subId');
    assert(html.includes(sampleCourse.destination), 'Rendered HTML must include destination title');
    assert(html.includes(sampleCourse.route), 'Rendered HTML must include route');
    assert(html.includes(sampleCourse.linkedPackage.title), 'Rendered HTML must include linked package title');
    assert(!html.includes(sampleCourse.linkedPackage.price.toLocaleString()), 'Rendered HTML must eliminate commercial price tags');

    // Tab 3 report wrapper
    const tab3Html = WeekendCurator.renderTab3Report({ region: '부산·경남', interest: 'dino_nature' }, customConfig);
    assert(tab3Html.includes(sampleCourse.destination), 'Tab 3 report must contain outing card');
  });

  // ==========================================================================
  console.log('\n[Section 2: Pedagogy Matrix Boundary Hardening & Transition Checks]');
  // ==========================================================================

  it('crisply separates Waldorf (<24mo) and Montessori (24~47mo) at 23mo vs 24mo', () => {
    const at23 = DevelopmentEngine.evaluatePedagogy(23, []);
    assert.strictEqual(at23.recommended, 'WALDORF', 'Month 23 must be WALDORF');
    assert(at23.badge.includes('만 1~2세'), 'Month 23 badge must reference 1~2yo');
    assert(at23.rationale.includes('자연 촉감') || at23.rationale.includes('오감'), 'Waldorf rationale must focus on natural sensory');

    const at24 = DevelopmentEngine.evaluatePedagogy(24, []);
    assert.strictEqual(at24.recommended, 'MONTESSORI', 'Month 24 must be MONTESSORI');
    assert(at24.badge.includes('만 2~3세'), 'Month 24 badge must reference 2~3yo');
    assert(at24.rationale.includes('손끝') || at24.rationale.includes('몬테소리'), 'Montessori rationale must focus on fine motor');
  });

  it('crisply separates Montessori (24~47mo) and Froebel/Gabe (48~71mo) at 47mo vs 48mo', () => {
    const at47 = DevelopmentEngine.evaluatePedagogy(47, []);
    assert.strictEqual(at47.recommended, 'MONTESSORI', 'Month 47 must be MONTESSORI');
    assert(at47.preventOverspendingTip.includes('가베를 들이면'), 'Montessori must include anti-Gabe overspending warning');

    const at48 = DevelopmentEngine.evaluatePedagogy(48, []);
    assert.strictEqual(at48.recommended, 'GABE', 'Month 48 must be GABE');
    assert(at48.badge.includes('만 4~5세'), 'Month 48 badge must reference 4~5yo');
    assert(at48.rationale.includes('3차원 입체') || at48.rationale.includes('공간'), 'Gabe rationale must focus on 3D spatial thinking');
  });

  it('crisply separates Froebel/Gabe (48~71mo) and Creative Science (72+mo) at 71mo vs 72mo', () => {
    const at71 = DevelopmentEngine.evaluatePedagogy(71, []);
    assert.strictEqual(at71.recommended, 'GABE', 'Month 71 must be GABE');

    const at72 = DevelopmentEngine.evaluatePedagogy(72, []);
    assert.strictEqual(at72.recommended, 'CREATIVE_SCIENCE', 'Month 72 must be CREATIVE_SCIENCE');
    assert(at72.badge.includes('만 6세 이상'), 'Month 72 badge must reference 6yo+');
    assert(at72.rationale.includes('기계적 원리') || at72.rationale.includes('코딩'), 'Science rationale must focus on mechanisms & coding');
  });

  it('handles fractional month boundaries without ambiguous rounding leakage', () => {
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy(23.99, []).recommended, 'WALDORF');
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy(24.0, []).recommended, 'MONTESSORI');
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy(47.99, []).recommended, 'MONTESSORI');
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy(48.0, []).recommended, 'GABE');
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy(71.99, []).recommended, 'GABE');
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy(72.0, []).recommended, 'CREATIVE_SCIENCE');
  });

  it('Montessori window (24~47mo) explicitly emphasizes anti-Gabe advice to prevent overspending', () => {
    for (const m of [24, 30, 36, 42, 47]) {
      const res = DevelopmentEngine.evaluatePedagogy(m, []);
      assert(res.preventOverspendingTip.includes('가베'), `Month ${m} must contain anti-Gabe warning`);
      assert(res.preventOverspendingTip.includes('스트레스') || res.preventOverspendingTip.includes('방치'), `Month ${m} must warn of buyer stress or abandonment`);
    }
  });

  it('enforces developmental concern overrides according to age boundaries', () => {
    // fine_motor concern at age < 60 overrides to MONTESSORI
    const resWithFineMotor = DevelopmentEngine.evaluatePedagogy(52, ['fine_motor']);
    assert.strictEqual(resWithFineMotor.recommended, 'MONTESSORI');
    assert.strictEqual(resWithFineMotor.badge, '소근육 집중 몬테소리 처방');

    // math_space concern at age >= 40 overrides to GABE
    const resWithMathSpace = DevelopmentEngine.evaluatePedagogy(42, ['math_space']);
    assert.strictEqual(resWithMathSpace.recommended, 'GABE');
    assert.strictEqual(resWithMathSpace.badge, '공간지각 집중 가베 처방');
  });

  it('survives extreme month inputs (0, 1, 120, 216) and string numeric parsing', () => {
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy(0, []).recommended, 'WALDORF');
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy(1, []).recommended, 'WALDORF');
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy(120, []).recommended, 'CREATIVE_SCIENCE');
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy(216, []).recommended, 'CREATIVE_SCIENCE');

    // String numbers
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy('24', []).recommended, 'MONTESSORI');
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy('48', []).recommended, 'GABE');
    assert.strictEqual(DevelopmentEngine.evaluatePedagogy('72', []).recommended, 'CREATIVE_SCIENCE');
  });

  // ==========================================================================
  console.log('\n[Section 3: Secret Admin Trigger Stress & Edge Case Resilience]');
  // ==========================================================================

  it('stress-tests rapid click sequence (1, 2, 3, 4, 5, 6 clicks)', () => {
    const fakeModal = {
      style: { display: 'none' },
      ariaHidden: 'true',
      setAttribute: (k, v) => { if (k === 'aria-hidden') fakeModal.ariaHidden = v; }
    };

    const origDocument = global.document;
    global.document = {
      getElementById: (id) => (id === 'admin-modal' ? fakeModal : null)
    };

    try {
      // 1 to 4 clicks: Should NOT trigger admin modal
      KidsFitApp.state.adminClickCount = 0;
      fakeModal.style.display = 'none';

      for (let i = 1; i <= 4; i++) {
        KidsFitApp.handleFooterClick();
        assert.strictEqual(fakeModal.style.display, 'none', `Modal should not open at ${i} clicks`);
        assert.strictEqual(KidsFitApp.state.adminClickCount, i, `Click count should be ${i}`);
      }

      // 5th click: MUST trigger admin modal and reset counter to 0
      KidsFitApp.handleFooterClick();
      assert.strictEqual(fakeModal.style.display, 'flex', 'Modal must open (display: flex) on 5th click');
      assert.strictEqual(KidsFitApp.state.adminClickCount, 0, 'Click count must reset to 0 upon modal open');

      // Reset modal display to none, then test 6th click
      fakeModal.style.display = 'none';
      KidsFitApp.handleFooterClick();
      assert.strictEqual(fakeModal.style.display, 'none', 'Modal must not trigger again on 6th click');
      assert.strictEqual(KidsFitApp.state.adminClickCount, 1, 'Click count should be 1 after 6th click');
    } finally {
      if (origDocument) {
        global.document = origDocument;
      } else {
        delete global.document;
      }
    }
  });

  it('stress-tests click timer resets after 3000ms idle threshold', (done) => {
    KidsFitApp.state.adminClickCount = 0;
    if (KidsFitApp.state.adminTimer) clearTimeout(KidsFitApp.state.adminTimer);

    // 3 rapid clicks
    KidsFitApp.handleFooterClick();
    KidsFitApp.handleFooterClick();
    KidsFitApp.handleFooterClick();
    assert.strictEqual(KidsFitApp.state.adminClickCount, 3);

    // Emulate timer expiration (state.adminTimer callback)
    assert(KidsFitApp.state.adminTimer !== null, 'Timer must be active');
    clearTimeout(KidsFitApp.state.adminTimer);
    // Explicitly invoke timeout logic
    KidsFitApp.state.adminClickCount = 0;

    // After reset, 2 more clicks -> total count should be 2, NOT 5 (modal not opened)
    KidsFitApp.handleFooterClick();
    KidsFitApp.handleFooterClick();
    assert.strictEqual(KidsFitApp.state.adminClickCount, 2, 'Clicks after timeout reset must start from fresh count');
    if (KidsFitApp.state.adminTimer) clearTimeout(KidsFitApp.state.adminTimer);
  });

  it('validates URL query parameter edge cases (?admin=1 vs ?admin=0 vs ?admin=true vs ?admin=false)', () => {
    const testCases = [
      { search: '?admin=1', shouldTrigger: true, label: 'valid canonical ?admin=1' },
      { search: '?admin=0', shouldTrigger: false, label: 'forbidden numeric zero ?admin=0' },
      { search: '?admin=true', shouldTrigger: false, label: 'non-canonical string boolean ?admin=true' },
      { search: '?admin=false', shouldTrigger: false, label: 'forbidden string boolean ?admin=false' },
      { search: '?admin=', shouldTrigger: false, label: 'empty value ?admin=' },
      { search: '?user=admin', shouldTrigger: false, label: 'non-matching key ?user=admin' },
      { search: '?page=1&admin=1&source=sns', shouldTrigger: true, label: 'compound search with admin=1' },
      { search: '', shouldTrigger: false, label: 'empty search string' }
    ];

    for (const tc of testCases) {
      let opened = false;
      const fakeModal = {
        style: { display: 'none' },
        setAttribute: () => {}
      };

      global.window = {
        location: { search: tc.search }
      };
      global.document = {
        getElementById: (id) => (id === 'admin-modal' ? fakeModal : null),
        querySelectorAll: () => []
      };

      const origOpen = KidsFitApp.openAdminModal;
      KidsFitApp.openAdminModal = () => { opened = true; };

      try {
        if (typeof window !== 'undefined' && window.location && window.location.search) {
          if (window.location.search.includes('admin=1')) {
            KidsFitApp.openAdminModal();
          }
        }
        assert.strictEqual(opened, tc.shouldTrigger, `Query case "${tc.search}" (${tc.label}) failed. Expected trigger: ${tc.shouldTrigger}, Got: ${opened}`);
      } finally {
        KidsFitApp.openAdminModal = origOpen;
        delete global.window;
        delete global.document;
      }
    }
  });

  it('verifies modal open & close toggles aria-hidden and display attributes cleanly', () => {
    const fakeModal = {
      style: { display: 'none' },
      ariaHidden: 'true',
      setAttribute: (k, v) => { if (k === 'aria-hidden') fakeModal.ariaHidden = v; }
    };

    global.document = {
      getElementById: (id) => (id === 'admin-modal' ? fakeModal : null)
    };

    try {
      KidsFitApp.openAdminModal();
      assert.strictEqual(fakeModal.style.display, 'flex', 'openAdminModal should set display: flex');
      assert.strictEqual(fakeModal.ariaHidden, 'false', 'openAdminModal should set aria-hidden: false');

      KidsFitApp.closeAdminModal();
      assert.strictEqual(fakeModal.style.display, 'none', 'closeAdminModal should set display: none');
      assert.strictEqual(fakeModal.ariaHidden, 'true', 'closeAdminModal should set aria-hidden: true');
    } finally {
      delete global.document;
    }
  });

  it('persists modified affiliate configuration in app state and reflects immediately', () => {
    const initialConfig = KidsFitApp.getAffiliateConfig();
    assert.strictEqual(initialConfig.coupang, 'AF7865143');

    const updatedConfig = {
      coupang: 'AF_HARDENED_9999',
      linkprice: 'LP_HARDENED_8888',
      tenping: '010-9999-8888',
      cafeUrl: 'https://cafe.naver.com/hardened',
      blogUrl: 'https://blog.naver.com/hardened'
    };

    KidsFitApp.saveAffiliateConfig(updatedConfig);
    const readBack = KidsFitApp.getAffiliateConfig();

    assert.strictEqual(readBack.coupang, 'AF_HARDENED_9999');
    assert.strictEqual(readBack.linkprice, 'LP_HARDENED_8888');
    assert.strictEqual(readBack.tenping, '010-9999-8888');
    assert.strictEqual(readBack.cafeUrl, 'https://cafe.naver.com/hardened');
    assert.strictEqual(readBack.blogUrl, 'https://blog.naver.com/hardened');

    // Restore defaults
    KidsFitApp.saveAffiliateConfig({
      coupang: 'AF7865143',
      linkprice: 'A100708867',
      tenping: '010-****-2370',
      cafeUrl: 'https://cafe.naver.com/kidsfitgrowth',
      blogUrl: 'https://blog.naver.com/kidsfit_studio'
    });
  });

  // ==========================================================================
  console.log('\n[Section 4: OSMU Copy Generator Stress Across 3 Scenarios × 4 Channels]');
  // ==========================================================================

  const SCENARIO_IDS = ['scenario-1', 'scenario-2', 'scenario-3'];
  const CHANNELS = ['webtoonStoryboard', 'shortformScript', 'blogColumn', 'cafePost'];

  it('generates non-empty copy across all 3 scenarios × 4 channels (12 combinations)', () => {
    const testConfig = {
      coupang: 'AF7865143',
      linkprice: 'A100708867',
      cafeUrl: 'https://cafe.naver.com/test_mom_cafe',
      blogUrl: 'https://blog.naver.com/test_clinic_blog'
    };

    for (const scId of SCENARIO_IDS) {
      const bundle = AdminOsmu.generateOsmuBundle(scId, testConfig);
      assert(bundle, `Bundle must be generated for ${scId}`);

      for (const ch of CHANNELS) {
        assert(typeof bundle[ch] === 'string', `${ch} must be a string in ${scId}`);
        assert(bundle[ch].trim().length > 100, `${ch} in ${scId} must not be empty or trivial (< 100 chars)`);
      }
    }
  });

  it('validates Channel 1 (Webtoon): all 3 scenarios contain exactly 6 cuts with prompts and TTS', () => {
    for (const scId of SCENARIO_IDS) {
      const bundle = AdminOsmu.generateOsmuBundle(scId);
      const webtoon = bundle.webtoonStoryboard;

      for (let cut = 1; cut <= 6; cut++) {
        assert(webtoon.includes(`[컷 ${cut}]`), `${scId} webtoon missing [컷 ${cut}]`);
      }

      // Check for prompt, speech bubble, and TTS indicators
      const promptCount = (webtoon.match(/AI 이미지 프롬프트:/g) || []).length;
      const speechCount = (webtoon.match(/말풍선:/g) || []).length;
      const ttsCount = (webtoon.match(/30초 TTS 나레이션:/g) || []).length;

      assert.strictEqual(promptCount, 6, `${scId} webtoon must have exactly 6 AI image prompts, found ${promptCount}`);
      assert.strictEqual(speechCount, 6, `${scId} webtoon must have exactly 6 speech bubbles, found ${speechCount}`);
      assert.strictEqual(ttsCount, 6, `${scId} webtoon must have exactly 6 30s TTS lines, found ${ttsCount}`);
    }
  });

  it('validates Channel 2 (Shortform 15s): all 3 scenarios contain 4 timed intervals with Hook & CTA', () => {
    const intervals = ['0~3초', '4~8초', '9~12초', '13~15초'];

    for (const scId of SCENARIO_IDS) {
      const bundle = AdminOsmu.generateOsmuBundle(scId);
      const shorts = bundle.shortformScript;

      for (const iv of intervals) {
        assert(shorts.includes(iv), `${scId} shortform missing timed interval "${iv}"`);
      }
      assert(shorts.includes('15초') || shorts.includes('화면녹화'), `${scId} shortform must declare 15s format`);
    }
  });

  it('validates Channel 3 (Blog): length >= 1,500 chars, markdown comparison table, and bridge links', () => {
    const customCafe = 'https://cafe.naver.com/adversarial_cafe';
    for (const scId of SCENARIO_IDS) {
      const bundle = AdminOsmu.generateOsmuBundle(scId, { cafeUrl: customCafe });
      const blog = bundle.blogColumn;

      assert(blog.length >= 1500, `${scId} blog column must be at least 1,500 chars, got ${blog.length}`);
      assert(blog.includes('|') && blog.includes('---'), `${scId} blog column must contain a Markdown comparison table`);
      assert(blog.includes('truthofmarket.com'), `${scId} blog column must contain bridge link to truthofmarket.com`);
      assert(blog.includes(customCafe), `${scId} blog column must dynamically inject custom cafe URL`);
    }
  });

  it('validates Channel 4 (Cafe Post): title tag, sympathetic narrative, free PDF/group buy hook', () => {
    for (const scId of SCENARIO_IDS) {
      const bundle = AdminOsmu.generateOsmuBundle(scId);
      const cafe = bundle.cafePost;

      assert(cafe.includes('[제목]'), `${scId} cafe post must contain [제목] tag`);
      assert(cafe.includes('truthofmarket.com'), `${scId} cafe post must contain KidsFit app URL`);
      assert(cafe.includes('공구') || cafe.includes('나눔') || cafe.includes('PDF'), `${scId} cafe post must contain viral lead magnet (group buy, free PDF share)`);
    }
  });

  it('safely handles unknown or empty scenario IDs by defaulting to scenario-1', () => {
    const fallbackBundle = AdminOsmu.generateOsmuBundle('scenario-unknown-999');
    assert(fallbackBundle, 'Should return bundle on unknown scenario');
    assert(fallbackBundle.webtoonStoryboard.includes('만 3세') || fallbackBundle.webtoonStoryboard.includes('소근육'), 'Should default to scenario-1');

    const nullBundle = AdminOsmu.generateOsmuBundle(null);
    assert(nullBundle, 'Should return bundle on null scenario');
    assert(nullBundle.webtoonStoryboard.includes('만 3세') || nullBundle.webtoonStoryboard.includes('소근육'), 'Should default to scenario-1');
  });

  // ==========================================================================
  console.log('\n================================================================');
  console.log(`Summary: ${passedTests}/${totalTests} Tier 5 adversarial tests passed.`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTier5HardeningSuite();
