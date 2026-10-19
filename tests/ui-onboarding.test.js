/**
 * tests/ui-onboarding.test.js
 * Comprehensive unit and DOM structure test suite for Milestone 2:
 * Design System, Onboarding Quiz, 6 Quick Presets, 3 Capsule Tabs,
 * 100% Ad-Free initial landing view, and Secret Admin triggers.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const STYLE_CSS_PATH = path.join(ROOT_DIR, 'src', 'css', 'style.css');
const APP_JS_PATH = path.join(ROOT_DIR, 'src', 'js', 'app.js');

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

function runSuite() {
  console.log('====================================================');
  console.log('   Milestone 2: Design System & Onboarding Tests');
  console.log('====================================================');

  const indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const styleCss = fs.readFileSync(STYLE_CSS_PATH, 'utf8');
  const KidsFitApp = require(APP_JS_PATH);

  // --------------------------------------------------------------------------
  console.log('\n[Suite 1: Korean 3040 Moms Design System & Visual Aesthetic]');
  // --------------------------------------------------------------------------

  it('contains Warm Ivory (#FAF8F5) and Clinic White (#FFFFFF) surface tokens', () => {
    assert(styleCss.includes('#FAF8F5'), 'Missing Warm Ivory (#FAF8F5)');
    assert(styleCss.includes('#FFFFFF'), 'Missing Clinic White (#FFFFFF)');
    assert(styleCss.includes('--bg-clinic-ivory'), 'Missing --bg-clinic-ivory CSS variable');
    assert(styleCss.includes('--bg-clinic-surface'), 'Missing --bg-clinic-surface CSS variable');
  });

  it('contains Royal Indigo (#5B4BFF), Growth Mint (#10B981), and Warm Coral (#F97316) accents', () => {
    assert(styleCss.includes('#5B4BFF'), 'Missing Royal Indigo (#5B4BFF)');
    assert(styleCss.includes('#10B981'), 'Missing Growth Mint (#10B981)');
    assert(styleCss.includes('#F97316'), 'Missing Warm Coral (#F97316)');
    assert(styleCss.includes('#F59E0B'), 'Missing Butter Yellow (#F59E0B)');
  });

  it('specifies Pretendard font stack and responsive line-height', () => {
    assert(styleCss.includes('Pretendard'), 'Missing Pretendard font declaration');
  });

  it('defines Capsule Tabs radius (9999px) and Bento Grid radius (20px~28px)', () => {
    assert(styleCss.includes('9999px'), 'Missing 9999px capsule radius');
    assert(styleCss.includes('24px') || styleCss.includes('20px') || styleCss.includes('28px'), 'Missing Bento card radius (20px~28px)');
  });

  it('prohibits dark mode / black background across primary body', () => {
    // Body background must be Warm Ivory
    assert(styleCss.includes('body {'), 'Missing body CSS rule');
    assert(!styleCss.includes('body {\n  background-color: #000'), 'Body background is black');
    assert(!styleCss.includes('body {\n  background-color: #121212'), 'Body background is dark mode');
  });

  // --------------------------------------------------------------------------
  console.log('\n[Suite 2: 100% Ad-Free Initial Onboarding Screen & Trust Badge]');
  // --------------------------------------------------------------------------

  it('includes official KDCA and K-DST header trust badge', () => {
    assert(indexHtml.includes('Built on Official Standards: 질병관리청 소아청소년 성장도표 &amp; 보건복지부 영유아 발달선별검사(K-DST) 기준 적용') ||
           indexHtml.includes('Built on Official Standards: 질병관리청 소아청소년 성장도표 & 보건복지부 영유아 발달선별검사(K-DST) 기준 적용'),
           'Missing official KDCA & K-DST trust badge text');
  });

  it('renders 3 floating capsule navigation tabs', () => {
    assert(indexHtml.includes('data-tab="tab-growth"'), 'Missing Tab 1 (tab-growth)');
    assert(indexHtml.includes('data-tab="tab-development"'), 'Missing Tab 2 (tab-development)');
    assert(indexHtml.includes('data-tab="tab-outing"'), 'Missing Tab 3 (tab-outing)');
    assert(indexHtml.includes('신체 성장 &amp; 숨은 키 7cm 처방') || indexHtml.includes('신체 성장 & 숨은 키 7cm 처방'), 'Missing Tab 1 label');
    assert(indexHtml.includes('월령별 소근육·두뇌 발달 &amp; 맞춤 교구') || indexHtml.includes('월령별 소근육·두뇌 발달 & 맞춤 교구'), 'Missing Tab 2 label');
    assert(indexHtml.includes('성향·지역 맞춤 미술관·전시·역사 코스'), 'Missing Tab 3 label');
  });

  it('guarantees 100% ad-free initial onboarding screen (no discount/commercial tags)', () => {
    // Check the quiz section for prohibited commercial marketing keywords
    const quizStart = indexHtml.indexOf('<section class="quiz-section"');
    const quizEnd = indexHtml.indexOf('</section>', quizStart);
    const quizSlice = indexHtml.substring(quizStart, quizEnd);

    assert(!quizSlice.includes('최저가'), 'Initial quiz screen contains "최저가" commercial copy');
    assert(!quizSlice.includes('특가'), 'Initial quiz screen contains "특가" commercial copy');
    assert(!quizSlice.includes('폭탄 세일'), 'Initial quiz screen contains "폭탄 세일" commercial copy');
    assert(!quizSlice.includes('DAN-SAMPLE-TOP'), 'Initial quiz screen contains legacy DAN ad banner container');
  });

  // --------------------------------------------------------------------------
  console.log('\n[Suite 3: 6 Quick 1-Second Presets]');
  // --------------------------------------------------------------------------

  it('renders all 6 quick preset cards in index.html', () => {
    for (let i = 1; i <= 6; i++) {
      assert(indexHtml.includes(`data-preset-id="preset-${i}"`), `Missing preset card ${i}`);
    }
  });

  it('defines 6 accurate presets in KidsFitApp.PRESETS', () => {
    const p = KidsFitApp.PRESETS;
    assert.strictEqual(Object.keys(p).length, 6, 'Must have exactly 6 presets');

    // Preset 1: 만 2~3세 소근육/몬테소리
    assert.strictEqual(p['preset-1'].ageMonths, 36);
    assert.strictEqual(p['preset-1'].gender, 'girl');
    assert.strictEqual(p['preset-1'].philosophy, 'montessori');
    assert.strictEqual(p['preset-1'].interest, 'art_making');

    // Preset 2: 만 4~5세 수리/편식
    assert.strictEqual(p['preset-2'].ageMonths, 60);
    assert.strictEqual(p['preset-2'].gender, 'boy');
    assert.strictEqual(p['preset-2'].philosophy, 'froebel_gabe');
    assert.strictEqual(p['preset-2'].interest, 'dino_nature');

    // Preset 3: 초등 저학년 역사/바른자세
    assert.strictEqual(p['preset-3'].ageMonths, 96);
    assert.strictEqual(p['preset-3'].gender, 'girl');
    assert.strictEqual(p['preset-3'].pubertyStage, 'growth_spurt');
    assert(p['preset-3'].habits.includes('poor_posture'));

    // Preset 4: 초등 고학년 사춘기 골든타임 긴급
    assert.strictEqual(p['preset-4'].ageMonths, 132);
    assert.strictEqual(p['preset-4'].gender, 'boy');
    assert.strictEqual(p['preset-4'].pubertyStage, 'urgent_secondary_signs');
    assert.strictEqual(p['preset-4'].budgetTier, 'tier_unlimited');

    // Preset 5: 영아기 18개월
    assert.strictEqual(p['preset-5'].ageMonths, 18);
    assert.strictEqual(p['preset-5'].gender, 'boy');
    assert(p['preset-5'].habits.includes('milk_trouble'));

    // Preset 6: 바쁜 워킹맘 전용
    assert.strictEqual(p['preset-6'].ageMonths, 48);
    assert.strictEqual(p['preset-6'].gender, 'girl');
    assert(p['preset-6'].habits.includes('late_sleep'));
  });

  it('applies preset data to app state reactively', () => {
    KidsFitApp.applyPreset('preset-4');
    assert.strictEqual(KidsFitApp.state.activePresetId, 'preset-4');
    assert.strictEqual(KidsFitApp.state.profile.ageMonths, 132);
    assert.strictEqual(KidsFitApp.state.profile.pubertyStage, 'urgent_secondary_signs');
    assert.strictEqual(KidsFitApp.state.isPrescriptionIssued, true);
  });

  // --------------------------------------------------------------------------
  console.log('\n[Suite 4: 6-Step Deep Diagnosis Form Structure & Navigation]');
  // --------------------------------------------------------------------------

  it('includes 6 distinct step containers in index.html', () => {
    for (let s = 1; s <= 6; s++) {
      assert(indexHtml.includes(`id="step-content-${s}"`), `Missing step content container ${s}`);
    }
  });

  it('contains Step 1 profile fields (gender, age, heights, weight, 8 regions)', () => {
    assert(indexHtml.includes('name="child-gender"'), 'Missing gender input');
    assert(indexHtml.includes('id="child-age-months"'), 'Missing ageMonths input');
    assert(indexHtml.includes('id="child-height"'), 'Missing child height input');
    assert(indexHtml.includes('id="child-weight"'), 'Missing child weight input');
    assert(indexHtml.includes('id="father-height"'), 'Missing father height input');
    assert(indexHtml.includes('id="mother-height"'), 'Missing mother height input');
    assert(indexHtml.includes('id="user-region"'), 'Missing region select');

    const regions = [
      '서울 강남·서초·송파',
      '서울 강북·마포·용산',
      '경기 남부(분당·수원·용인·동탄)',
      '경기 북부·인천',
      '부산·경남',
      '대구·경북',
      '대전·충청',
      '광주·전라·기타'
    ];
    regions.forEach(r => {
      assert(indexHtml.includes(r), `Missing region option: ${r}`);
    });
  });

  it('contains Step 2 puberty (3 options) and 5 inhibiting habits', () => {
    assert(indexHtml.includes('name="puberty-stage"'), 'Missing puberty stage radio');
    assert(indexHtml.includes('value="none"'), 'Missing puberty none');
    assert(indexHtml.includes('value="growth_spurt"'), 'Missing puberty growth spurt');
    assert(indexHtml.includes('value="urgent_secondary_signs"'), 'Missing puberty urgent signs');

    const habits = ['picky_eater', 'milk_trouble', 'late_sleep', 'poor_posture', 'obesity_risk'];
    habits.forEach(h => {
      assert(indexHtml.includes(`value="${h}"`), `Missing habit checkbox: ${h}`);
    });
  });

  it('contains Step 3 K-DST 5 tags', () => {
    const kdstTags = ['fine_motor', 'gross_motor', 'language_reading', 'math_space', 'emotion_art'];
    kdstTags.forEach(t => {
      assert(indexHtml.includes(`value="${t}"`), `Missing K-DST tag checkbox: ${t}`);
    });
  });

  it('contains Step 4 teaching philosophies (4 options)', () => {
    const philosophies = ['montessori', 'froebel_gabe', 'waldorf_art', 'science_coding'];
    philosophies.forEach(p => {
      assert(indexHtml.includes(`value="${p}"`), `Missing teaching philosophy option: ${p}`);
    });
  });

  it('contains Step 5 child interests (5 themes)', () => {
    const interests = ['art_making', 'history_tradition', 'dino_nature', 'space_science', 'music_musical'];
    interests.forEach(i => {
      assert(indexHtml.includes(`value="${i}"`), `Missing child interest option: ${i}`);
    });
  });

  it('contains Step 6 budget tiers (3 tiers)', () => {
    const tiers = ['tier_5_10', 'tier_15_30', 'tier_unlimited'];
    tiers.forEach(t => {
      assert(indexHtml.includes(`value="${t}"`), `Missing budget tier option: ${t}`);
    });
  });

  it('provides stepper navigation functions with proper boundaries', () => {
    KidsFitApp.goToStep(1);
    assert.strictEqual(KidsFitApp.state.currentStep, 1);

    KidsFitApp.goToStep(3);
    assert.strictEqual(KidsFitApp.state.currentStep, 3);

    KidsFitApp.goToStep(10); // clamp
    assert.strictEqual(KidsFitApp.state.currentStep, 6);

    KidsFitApp.goToStep(-2); // clamp
    assert.strictEqual(KidsFitApp.state.currentStep, 1);
  });

  // --------------------------------------------------------------------------
  console.log('\n[Suite 5: Interactive Transition & Tab Switching]');
  // --------------------------------------------------------------------------

  it('includes interactive prescription transition overlay with progress indicators', () => {
    assert(indexHtml.includes('id="analysis-overlay"'), 'Missing analysis transition overlay');
    assert(indexHtml.includes('class="analysis-spinner"'), 'Missing analysis spinner');
    assert(indexHtml.includes('id="analysis-title"'), 'Missing analysis title element');
    assert(indexHtml.includes('id="analysis-bar-fill"'), 'Missing analysis bar fill element');
  });

  it('switches capsule tabs correctly in state', () => {
    KidsFitApp.switchTab('tab-development');
    assert.strictEqual(KidsFitApp.state.activeTab, 'tab-development');

    KidsFitApp.switchTab('tab-outing');
    assert.strictEqual(KidsFitApp.state.activeTab, 'tab-outing');

    KidsFitApp.switchTab('tab-growth');
    assert.strictEqual(KidsFitApp.state.activeTab, 'tab-growth');
  });

  // --------------------------------------------------------------------------
  console.log('\n[Suite 6: Secret Admin Studio Trigger & Storage]');
  // --------------------------------------------------------------------------

  it('includes secret admin modal with affiliate configuration inputs', () => {
    assert(indexHtml.includes('id="admin-modal"'), 'Missing secret admin modal');
    assert(indexHtml.includes('id="cfg-coupang"'), 'Missing Coupang config input');
    assert(indexHtml.includes('id="cfg-linkprice"'), 'Missing LinkPrice config input');
    assert(indexHtml.includes('id="cfg-tenping"'), 'Missing Tenping config input');
  });

  it('provides correct default affiliate settings', () => {
    const cfg = KidsFitApp.getAffiliateConfig();
    assert.strictEqual(cfg.coupang, 'AF7865143');
    assert.strictEqual(cfg.linkprice, 'A100708867');
    assert.strictEqual(cfg.tenping, '010-****-2370');
  });

  it('handles 5 consecutive clicks for secret admin trigger', () => {
    KidsFitApp.state.adminClickCount = 0;
    for (let c = 0; c < 4; c++) {
      KidsFitApp.handleFooterClick();
    }
    assert.strictEqual(KidsFitApp.state.adminClickCount, 4, 'Should have 4 clicks recorded');

    KidsFitApp.handleFooterClick(); // 5th click
    assert.strictEqual(KidsFitApp.state.adminClickCount, 0, 'Should reset click counter upon opening admin modal');
  });

  it('includes footer copyright © 2026 KidsFit Studio', () => {
    assert(indexHtml.includes('© 2026 KidsFit Studio'), 'Missing footer copyright');
  });

  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`Summary: ${passedTests}/${totalTests} tests passed.`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite();
