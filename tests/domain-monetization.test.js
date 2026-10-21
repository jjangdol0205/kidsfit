/**
 * tests/domain-monetization.test.js
 * Comprehensive Unit and Integration Test Suite for Milestones 3 & 4:
 * - Domain Engines: KDCA LMS percentiles, MPH, 3-tier height bar chart, SVG growth curve,
 *   K-DST 6-axis radar, pedagogy decision matrix, TOP 4 toys, 40 weekend outing catalog
 * - Monetization: 4 tiers, 5-item grocery receipt UI, hardware upselling, viral sharing & lock-in
 * - Secret Admin Studio: live storage sync, OSMU 4-channel copy generator (3 scenarios)
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const GrowthEngine = require('../src/js/growth-engine');
const DevelopmentEngine = require('../src/js/development-engine');
const WeekendCurator = require('../src/js/weekend-curator');
const Monetization = require('../src/js/monetization');
const AdminOsmu = require('../src/js/admin-osmu');
const KidsFitApp = require('../src/js/app');

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

function assertApprox(actual, expected, tolerance = 0.5, msg = '') {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${msg} Expected ~${expected} within ±${tolerance}, got ${actual} (diff: ${diff.toFixed(4)})`);
  }
}

console.log('====================================================');
console.log('   Milestones 3 & 4: Domain & Monetization Tests');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: Growth Engine & KDCA Standards
// -----------------------------------------------------------------------------
console.log('[Suite 1: Growth Engine & KDCA 2017 LMS Percentiles]');

it('calculates Abramowitz normal error function and CDF accurately', () => {
  assertApprox(GrowthEngine.normalCDF(0), 0.5, 0.001);
  assertApprox(GrowthEngine.normalCDF(1.96), 0.975, 0.005);
  assertApprox(GrowthEngine.normalCDF(-1.96), 0.025, 0.005);
});

it('retrieves accurate LMS parameters for representative months', () => {
  const boy12 = GrowthEngine.getLmsForMonth('boy', 12);
  assert.strictEqual(boy12.M, 75.7);
  assert.strictEqual(boy12.L, 1.0);

  const girl36 = GrowthEngine.getLmsForMonth('girl', 36);
  assert.strictEqual(girl36.M, 95.4);
});

it('interpolates intermediate months smoothly between reference milestones', () => {
  const boy15 = GrowthEngine.getLmsForMonth('boy', 15);
  // Between 12mo (75.7) and 18mo (82.3), midpoint should be 79.0
  assertApprox(boy15.M, 79.0, 0.2);
});

it('calculates KDCA percentiles: 50th percentile at median', () => {
  const lms = GrowthEngine.getLmsForMonth('boy', 120);
  const res = GrowthEngine.calculateKdcaPercentile(137.0, lms.L, lms.M, lms.S);
  assertApprox(res.percentile, 50.0, 0.5);
  assert.strictEqual(res.deltaMedian, 0.0);
  assert.strictEqual(res.topPercent, Math.round((100 - res.percentile) * 10) / 10);
});

it('calculates KDCA percentiles: 97th percentile and positive delta', () => {
  const lms = GrowthEngine.getLmsForMonth('boy', 120);
  const res = GrowthEngine.calculateKdcaPercentile(149.7, lms.L, lms.M, lms.S);
  assertApprox(res.percentile, 97.0, 1.0);
  assert.strictEqual(res.deltaMedian, 12.7);
});

it('calculates Tanner MPH: Boy (F+M+13)/2 and Girl (F+M-13)/2', () => {
  const boyMph = GrowthEngine.calculateMph(175, 162, 'boy');
  assert.strictEqual(boyMph, 175.0);

  const girlMph = GrowthEngine.calculateMph(175, 162, 'girl');
  assert.strictEqual(girlMph, 162.0);

  // Exactly 13cm difference
  assert.strictEqual(boyMph - girlMph, 13.0);
});

it('falls back to Korean national adult medians when parents heights are 0 or omitted', () => {
  const boyMph = GrowthEngine.calculateMph(0, 0, 'boy');
  const expected = Math.round(((173.5 + 161.0 + 13.0) / 2.0) * 10) / 10;
  assert.strictEqual(boyMph, expected);
});

it('calculates 3-tier predicted heights, habit penalty caps at -5.0cm, and goldenTimeGain clamps to <= 9.5cm', () => {
  const allHabits = ['late_sleep', 'poor_posture', 'picky_eater', 'milk_trouble', 'obesity_risk'];
  const pred = GrowthEngine.calculateHeightPrediction(175.0, allHabits, 'none');
  assert.strictEqual(pred.unmanagedLoss, 5.0);
  assert.strictEqual(pred.unmanagedHeight, 170.0);
  assert.strictEqual(pred.goldenTimeGain, 9.5);
  assert.strictEqual(pred.potentialHeight, 179.5);
});

it('strictly guarantees goldenTimeGain <= 9.5cm and potentialHeight == unmanagedHeight + goldenTimeGain across all 96 scenarios', () => {
  const ALL_HABITS = ['late_sleep', 'poor_posture', 'picky_eater', 'milk_trouble', 'obesity_risk'];
  const STAGES = ['none', 'growth_spurt', 'urgent_secondary_signs'];

  for (const stage of STAGES) {
    for (let mask = 0; mask < (1 << ALL_HABITS.length); mask++) {
      const subset = ALL_HABITS.filter((_, i) => (mask & (1 << i)));
      const pred = GrowthEngine.calculateHeightPrediction(172.0, subset, stage);
      assert.ok(pred.goldenTimeGain <= 9.5, `goldenTimeGain ${pred.goldenTimeGain} exceeded 9.5 for stage ${stage}`);
      assert.strictEqual(pred.potentialHeight, Math.round((pred.unmanagedHeight + pred.goldenTimeGain) * 10) / 10);
    }
  }
});

it('provides puberty stage remaining window text matching clinical stages', () => {
  const p1 = GrowthEngine.calculateHeightPrediction(170, [], 'none');
  const p2 = GrowthEngine.calculateHeightPrediction(170, [], 'growth_spurt');
  const p3 = GrowthEngine.calculateHeightPrediction(170, [], 'urgent_secondary_signs');

  assert.ok(p1.monthsRemaining.includes('36~48개월'));
  assert.ok(p2.monthsRemaining.includes('18~24개월'));
  assert.ok(p3.monthsRemaining.includes('6~12개월'));
});

it('renders valid SVG growth curve containing 3rd, 50th, 97th curves and child coordinate', () => {
  const svg = GrowthEngine.renderSvgGrowthCurve('boy', 48, 104.5);
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('97%'));
  assert.ok(svg.includes('50%'));
  assert.ok(svg.includes('3%'));
  assert.ok(svg.includes('현재 104.5cm'));
});

it('renders 3-tier bar chart HTML with all 3 bars', () => {
  const pred = GrowthEngine.calculateHeightPrediction(171.5, ['late_sleep', 'poor_posture'], 'none');
  const html = GrowthEngine.render3TierBarChart(pred);
  assert.ok(html.includes('① 부모 유전 예상키'));
  assert.ok(html.includes('② 방해 습관 방치 시 예측키'));
  assert.ok(html.includes('③ 골든타임 밀착 관리 시 최대 잠재키'));
});

it('renders 3 coaching cards with nutritional and postural rationale', () => {
  const html = GrowthEngine.renderCoachingCards(['milk_trouble', 'poor_posture']);
  assert.ok(html.includes('구연산 칼슘'));
  assert.ok(html.includes('밤 10시 수면 골든타임'));
  assert.ok(html.includes('숨은 키 2cm'));
});

// -----------------------------------------------------------------------------
// Suite 2: Development Engine & Pedagogy
// -----------------------------------------------------------------------------
console.log('\n[Suite 2: Development Engine & K-DST Radar / Pedagogy]');

it('evaluates K-DST balance scores with default baseline of 90', () => {
  const res = DevelopmentEngine.evaluateKdstBalance(36, []);
  assert.strictEqual(res.radarScores.fineMotor, 90);
  assert.strictEqual(res.radarScores.cognitive, 90);
  assert.strictEqual(res.radarScores.grossMotor, 90);
  assert.strictEqual(res.polygonPoints.split(' ').length, 6);
});

it('adjusts fine motor and cognitive scores when fine_motor concern is selected', () => {
  const res = DevelopmentEngine.evaluateKdstBalance(36, ['fine_motor']);
  assert.strictEqual(res.radarScores.fineMotor, 62);
  assert.strictEqual(res.radarScores.cognitive, 78);
});

it('evaluates pedagogy for under 24 months as Waldorf', () => {
  const p = DevelopmentEngine.evaluatePedagogy(18);
  assert.strictEqual(p.recommended, 'WALDORF');
  assert.ok(p.badge.includes('오감'));
});

it('evaluates pedagogy for 24~47 months as Montessori with anti-Gabe advice', () => {
  const p = DevelopmentEngine.evaluatePedagogy(36);
  assert.strictEqual(p.recommended, 'MONTESSORI');
  assert.ok(p.rationale.includes('가베를 들이면'));
  assert.ok(p.preventOverspendingTip.includes('가베'));
});

it('evaluates pedagogy for 48~71 months as Froebel Gabe', () => {
  const p = DevelopmentEngine.evaluatePedagogy(60);
  assert.strictEqual(p.recommended, 'GABE');
  assert.ok(p.badge.includes('공간·수리'));
});

it('evaluates pedagogy for 72+ months as Creative Science', () => {
  const p = DevelopmentEngine.evaluatePedagogy(96);
  assert.strictEqual(p.recommended, 'CREATIVE_SCIENCE');
  assert.ok(p.badge.includes('탐구·과학'));
});

it('curates exactly 4 toys with developmental rationale, price, and affiliate links', () => {
  const toys = DevelopmentEngine.getCuratedToys(36, ['fine_motor']);
  assert.strictEqual(toys.length, 4);
  toys.forEach((t) => {
    assert.ok(t.name);
    assert.ok(t.benefit);
    assert.ok(t.price > 0);
    assert.ok(t.coupangPath);
    assert.ok(t.cpaTitle);
  });
});

it('renders SVG radar chart with 6 axes and polygon', () => {
  const radar = DevelopmentEngine.evaluateKdstBalance(36, ['fine_motor']);
  const svg = DevelopmentEngine.renderSvgRadarChart(radar.radarScores, radar.polygonPoints);
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('polygon points='));
  assert.ok(svg.includes('소근육'));
  assert.ok(svg.includes('대근육'));
});

// -----------------------------------------------------------------------------
// Suite 3: Weekend Curator & 40 Courses
// -----------------------------------------------------------------------------
console.log('\n[Suite 3: Weekend Curator & 40-Course Outing Catalog]');

it('queries outing courses across all 8 regions × 5 themes (40 combinations)', () => {
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
  const themes = ['art_making', 'history_tradition', 'dino_nature', 'space_science', 'music_musical'];

  let count = 0;
  regions.forEach((r) => {
    themes.forEach((t) => {
      const outing = WeekendCurator.getWeekendOuting(r, t);
      assert.ok(outing, `Missing outing for ${r} x ${t}`);
      assert.ok(outing.id, 'Missing id');
      assert.ok(outing.destination, 'Missing destination');
      assert.ok(outing.viewPoints && outing.viewPoints.length >= 2, 'Missing viewPoints');
      assert.ok(outing.bookingTips, 'Missing bookingTips');
      assert.ok(outing.route, 'Missing route');
      assert.ok(outing.linkedPackage && outing.linkedPackage.title, 'Missing linkedPackage');
      count++;
    });
  });
  assert.strictEqual(count, 40);
});

it('supports theme code aliases (art, history, dino, science, music)', () => {
  const o1 = WeekendCurator.getWeekendOuting('서울 강남·서초·송파', 'art');
  const o2 = WeekendCurator.getWeekendOuting('서울 강남·서초·송파', 'art_making');
  assert.strictEqual(o1.id, o2.id);
  assert.strictEqual(o1.id, 'C01');
});

it('renders outing card HTML with viewing points, tips, and Coupang linked package', () => {
  const outing = WeekendCurator.getWeekendOuting('서울 강남·서초·송파', 'art');
  const html = WeekendCurator.renderOutingCard(outing, { coupang: 'AF7865143' });
  assert.ok(html.includes(outing.destination));
  assert.ok(html.includes('발달 관람 포인트'));
  assert.ok(html.includes('사전 예약 &amp; 추천 동선') || html.includes('사전 예약 & 추천 동선'));
  assert.ok(html.includes('AF7865143'));
});

// -----------------------------------------------------------------------------
// Suite 4: 100% Commercial Purge & Reference Affiliate Configuration
// -----------------------------------------------------------------------------
console.log('\n[Suite 4: 100% Commercial Purge & Reference Affiliate Configuration]');

it('guarantees 100% commercial elimination: getGroceryReceiptItems returns empty items and zero totals', () => {
  const receipt = Monetization.getGroceryReceiptItems({}, 'tier_15_30');
  assert.strictEqual(receipt.items.length, 0);
  assert.strictEqual(receipt.total4Weeks, 0);
  assert.strictEqual(receipt.dailyAverage, 0);
});

it('verifies 100% purge of CPA cards, receipt HTML, and legacy monetization layers', () => {
  assert.strictEqual(Monetization.renderLayer1Cpa(), '');
  assert.strictEqual(Monetization.renderLayer2Receipt(), '');
  assert.strictEqual(Monetization.renderLayer3Hardware(), '');
  assert.strictEqual(Monetization.renderAllMonetizationLayers(), '');
});

it('returns 4 clinical biomechanics and posture recommendations without commercial pricing', () => {
  const hw = Monetization.getHardwareRecommendations();
  assert.strictEqual(hw.length, 4);
  const chair = hw.find((i) => i.name.includes('의자'));
  const desk = hw.find((i) => i.name.includes('독서대'));
  const tramp = hw.find((i) => i.name.includes('트램폴린'));
  const book = hw.find((i) => i.name.includes('교구장'));
  assert.ok(chair && desk && tramp && book);
  assert.strictEqual(chair.price, undefined, 'Hardware items must not expose commercial price attributes');
  assert.ok(chair.benefit.includes('골반') || chair.benefit.includes('척추'));
});

it('verifies clinical affiliate configuration integrity and multi-channel parameters', () => {
  const cfg = Monetization.getAffiliateConfig();
  assert.strictEqual(cfg.coupang, 'AF7865143');
  assert.strictEqual(cfg.linkprice, 'A100708867');
  assert.strictEqual(cfg.iherb, 'IPZ1547');
  assert.strictEqual(cfg.amazon, 'kidfit-20');
  assert.strictEqual(cfg.chipsEnabled, true);
});

it('renders clean clinical prescription share button without commercial marketing', () => {
  const html = Monetization.renderLayer4LockIn({ gender: 'boy' }, { cafeUrl: 'https://cafe.naver.com/kidsfitgrowth' });
  assert.ok(html.includes('btn-share-prescription'));
  assert.ok(html.includes('임상 처방전'));
  assert.ok(!html.includes('최저가'));
  assert.ok(!html.includes('특가'));
});

// -----------------------------------------------------------------------------
// Suite 5: Secret Admin Studio & OSMU 4-Channel Generator
// -----------------------------------------------------------------------------
console.log('\n[Suite 5: Secret Admin Studio & OSMU Marketing Generator]');

it('generates 4 marketing channels for Scenario 1 (3yo Fine Motor & Montessori)', () => {
  const bundle = AdminOsmu.generateOsmuBundle('scenario-1', { coupang: 'AF7865143' });
  assert.ok(bundle.webtoonStoryboard.includes('6컷 공감 육아 웹툰'));
  assert.ok(bundle.shortformScript.includes('15초 화면녹화'));
  assert.ok(bundle.blogColumn.includes('2,000자') || bundle.blogColumn.length >= 1500);
  assert.ok(bundle.cafePost.includes('공유해요') || bundle.cafePost.includes('무료 나눔'));
});

it('generates 4 marketing channels for Scenario 2 (Elementary Grade 2 Hidden 7cm)', () => {
  const bundle = AdminOsmu.generateOsmuBundle('scenario-2', { coupang: 'AF7865143' });
  assert.ok(bundle.webtoonStoryboard.includes('엄마 158cm, 아빠 171cm'));
  assert.ok(bundle.shortformScript.includes('171.5cm'));
  assert.ok(bundle.blogColumn.includes('부모 유전 예상키(MPH)'));
  assert.ok(bundle.cafePost.includes('초2 남아'));
});

it('generates 4 marketing channels for Scenario 3 (Weekend Outing History & Boardgames)', () => {
  const bundle = AdminOsmu.generateOsmuBundle('scenario-3', { coupang: 'AF7865143' });
  assert.ok(bundle.webtoonStoryboard.includes('국립중앙박물관 어린이박물관'));
  assert.ok(bundle.shortformScript.includes('키즈카페'));
  assert.ok(bundle.blogColumn.includes('국립중앙박물관 어린이박물관'));
  assert.ok(bundle.cafePost.includes('국중박'));
});

it('verifies 6-cut webtoon storyboard has AI image prompts and TTS scripts for each cut', () => {
  const bundle = AdminOsmu.generateOsmuBundle('scenario-1');
  for (let cut = 1; cut <= 6; cut++) {
    assert.ok(bundle.webtoonStoryboard.includes(`[컷 ${cut}]`), `Missing cut ${cut}`);
    assert.ok(bundle.webtoonStoryboard.includes('AI 이미지 프롬프트:'));
    assert.ok(bundle.webtoonStoryboard.includes('30초 TTS 나레이션:'));
  }
});

it('verifies DIA+ blog column has comparison table and bridge copy leading to KidsFit app', () => {
  const bundle = AdminOsmu.generateOsmuBundle('scenario-1');
  assert.ok(bundle.blogColumn.length >= 1500, `Blog column too short (${bundle.blogColumn.length} chars)`);
  assert.ok(bundle.blogColumn.includes('|'), 'Missing markdown table');
  assert.ok(bundle.blogColumn.includes('truthofmarket.com'), 'Missing bridge link');
});

it('verifies shortform 15s script has 4 distinct time intervals (0~3s, 4~8s, 9~12s, 13~15s)', () => {
  const bundle = AdminOsmu.generateOsmuBundle('scenario-2');
  assert.ok(bundle.shortformScript.includes('0~3초'));
  assert.ok(bundle.shortformScript.includes('4~8초'));
  assert.ok(bundle.shortformScript.includes('9~12초'));
  assert.ok(bundle.shortformScript.includes('13~15초'));
});

// -----------------------------------------------------------------------------
// Suite 6: App State Integration & Admin Sync
// -----------------------------------------------------------------------------
console.log('\n[Suite 6: App State Integration & Storage Sync]');

it('exports all domain engines and monetization tools via KidsFitApp', () => {
  assert.ok(KidsFitApp.GrowthEngine, 'KidsFitApp.GrowthEngine missing');
  assert.ok(KidsFitApp.DevelopmentEngine, 'KidsFitApp.DevelopmentEngine missing');
  assert.ok(KidsFitApp.WeekendCurator, 'KidsFitApp.WeekendCurator missing');
  assert.ok(KidsFitApp.Monetization, 'KidsFitApp.Monetization missing');
  assert.ok(KidsFitApp.AdminOsmu, 'KidsFitApp.AdminOsmu missing');
});

it('updates affiliate config correctly in localStorage/state', () => {
  const testCfg = {
    coupang: 'AF9998888',
    linkprice: 'A9998888',
    tenping: '010-9999-8888',
    cafeUrl: 'https://cafe.naver.com/testcafe',
    blogUrl: 'https://blog.naver.com/testblog'
  };
  KidsFitApp.saveAffiliateConfig(testCfg);
  const loaded = KidsFitApp.getAffiliateConfig();
  assert.strictEqual(loaded.coupang, 'AF9998888');
  assert.strictEqual(loaded.linkprice, 'A9998888');
});

console.log('====================================================');
console.log(`Summary: ${passedTests}/${totalTests} tests passed.`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
