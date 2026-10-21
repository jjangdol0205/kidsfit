/**
 * tests/challenger-dual-pillar-empirical.js
 * Challenger 1 (Empirical & Stress Verifier) Test Suite
 * 
 * Objectives:
 * 1. Evaluate 5 LQ metrics across diverse user profiles (ages 1..20, boys/girls, habit permutations,
 *    cognitive axes, study styles, focus spans) and confirm no NaN, null, or out-of-bound scores (58~96).
 * 2. Test 6-month expected academic trajectory simulation across presets 1~5 (monotonicity, sums, invariants).
 * 3. DOM selector stress test across presets 1~5 and edge profiles:
 *    Assert #pillar-1-container, #pillar-2-container, #lq-radar-svg, #pinpoint-toys-box,
 *    #pillar2-learning-tools-box, and all Section 1/2/3 IDs exist and render non-empty HTML.
 * 4. Purity assertion:
 *    Assert #pinpoint-toys-box contains 0 bookstands, time timers, microscopes, or STEM kits across all profiles.
 *    Assert #pillar2-learning-tools-box contains appropriate educational tools.
 */

'use strict';

const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const MasterBriefing = require(path.join(ROOT_DIR, 'src', 'js', 'master-briefing.js'));
const NeuroMatrix = require(path.join(ROOT_DIR, 'src', 'js', 'neuro-cognitive-matrix.js'));
const PinpointCurator = require(path.join(ROOT_DIR, 'src', 'js', 'pinpoint-curator.js'));
const OnboardingWizard = require(path.join(ROOT_DIR, 'src', 'js', 'onboarding-wizard.js'));

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${title}`);
    console.error(`         ${err.message}`);
    failedChecks++;
    failures.push({ title, error: err.message, stack: err.stack });
  }
}

console.log('================================================================');
console.log('  CHALLENGER 1: Dual-Pillar Empirical & Adversarial Stress Suite');
console.log('================================================================\n');

// ============================================================================
// TEST SUITE 1: 5 LQ Metrics Evaluation Across Diverse Profiles & Boundaries
// ============================================================================
console.log('[SUITE 1] 5 LQ Metrics Evaluation (Ages 1..20, Genders, Habits, Edge Permutations)');

check('1.1 Comprehensive LQ Metric Stress Matrix: 20 Ages x 2 Genders x Combinations', () => {
  const habitsPool = ['late_sleep', 'night_carbs', 'poor_posture', 'picky_eater', 'sedentary'];
  const cogAxesPool = ['math_logic', 'language_reading', 'science_nature', 'sensory_arts', 'executive_focus'];
  const studyStylesPool = ['dialogue_question', 'play_manipulative', 'visual_story', 'goal_workbook'];
  const focusSpansPool = ['under_10m', '15_20m', '30m_plus'];
  const tempsPool = ['questioner', 'builder', 'explorer', 'cautious'];
  const concernsPool = ['reading_literacy', 'math_concept', 'passive_forget', 'screen_dopamine', 'desk_endurance', 'vocab_expression'];

  let profilesTested = 0;

  for (let age = 1; age <= 20; age++) {
    for (const gender of ['boy', 'girl']) {
      // Test different slices and permutations
      const testCases = [
        { desc: 'Empty profile', habits: [], cogAxes: [], concerns: [], temps: [], studyStyle: 'dialogue_question', focusSpan: '15_20m' },
        { desc: 'All habits & concerns', habits: habitsPool, cogAxes: cogAxesPool, concerns: concernsPool, temps: tempsPool, studyStyle: 'goal_workbook', focusSpan: 'under_10m' },
        { desc: 'High focus & dialogue', habits: ['late_sleep'], cogAxes: ['language_reading', 'executive_focus'], concerns: [], temps: ['questioner'], studyStyle: 'dialogue_question', focusSpan: '30m_plus' },
        { desc: 'Math & manipulative', habits: ['poor_posture'], cogAxes: ['math_logic'], concerns: ['math_concept'], temps: ['builder'], studyStyle: 'play_manipulative', focusSpan: '15_20m' },
        { desc: 'Science & explorer', habits: ['picky_eater'], cogAxes: ['science_nature'], concerns: ['screen_dopamine'], temps: ['explorer'], studyStyle: 'visual_story', focusSpan: 'under_10m' }
      ];

      for (const tc of testCases) {
        profilesTested++;
        const profile = {
          ageYears: age,
          ageMonths: age * 12,
          gender,
          currentHeight: 100 + age * 4,
          currentWeight: 15 + age * 2.5,
          habits: tc.habits,
          cognitiveAxes: tc.cogAxes,
          traitLearningConcerns: tc.concerns,
          traitTemperament: tc.temps,
          traitStudyStyle: tc.studyStyle,
          traitFocusSpan: tc.focusSpan
        };

        const result = NeuroMatrix.calculateLqMetrics(profile);
        assert(result && typeof result === 'object', `Age ${age} ${gender} returned non-object`);

        // Check scores object
        assert(result.scores && typeof result.scores === 'object', `Missing scores object`);
        const expectedKeys = ['literacy_vocab', 'math_spatial', 'working_memory_focus', 'metacognition_retrieval', 'inquiry_creative'];
        for (const k of expectedKeys) {
          const val = result.scores[k];
          assert(typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val),
            `Score ${k} is NaN or not finite: ${val} (Age ${age}, ${gender}, ${tc.desc})`);
          assert(val >= 58 && val <= 96,
            `Score ${k} out of bounds [58, 96]: ${val} (Age ${age}, ${gender}, ${tc.desc})`);
        }

        // Check overallLQ
        assert(typeof result.overallLQ === 'number' && !Number.isNaN(result.overallLQ) && Number.isFinite(result.overallLQ),
          `overallLQ is NaN or non-finite: ${result.overallLQ}`);
        assert(result.overallLQ >= 58 && result.overallLQ <= 96,
          `overallLQ out of bounds [58, 96]: ${result.overallLQ}`);

        // Check topPercent
        assert(typeof result.topPercent === 'number' && !Number.isNaN(result.topPercent) && Number.isFinite(result.topPercent),
          `topPercent is NaN: ${result.topPercent}`);
        assert(result.topPercent >= 1 && result.topPercent <= 99,
          `topPercent out of bounds [1, 99]: ${result.topPercent}`);

        // Check trajectory fields
        assert(result.trajectory && result.trajectory.unmanaged && result.trajectory.baseline && result.trajectory.coached,
          `Trajectory incomplete`);
        assert(!Number.isNaN(result.trajectory.unmanaged.lqScore) && result.trajectory.unmanaged.lqScore >= 58,
          `unmanaged.lqScore invalid: ${result.trajectory.unmanaged.lqScore}`);
        assert(!Number.isNaN(result.trajectory.coached.lqScore) && result.trajectory.coached.lqScore <= 96,
          `coached.lqScore invalid: ${result.trajectory.coached.lqScore}`);
      }
    }
  }

  console.log(`    -> Evaluated ${profilesTested} diverse user profiles. Zero NaN, zero out-of-bound scores.`);
});

check('1.2 Adversarial & Boundary Input Stress to calculateLqMetrics', () => {
  const edgeProfiles = [
    { desc: 'Empty profile {}', profile: {} },
    { desc: 'Undefined profile', profile: undefined },
    { desc: 'Null habits & non-array fields', profile: { ageYears: 10, habits: null, cognitiveAxes: 'not_an_array', traitLearningConcerns: 123 } },
    { desc: 'Negative age & extreme weights', profile: { ageYears: -5, currentHeight: -100, currentWeight: 9999 } },
    { desc: 'Over-age 99', profile: { ageYears: 99, habits: ['late_sleep'] } },
    { desc: 'Unknown habit & concern codes', profile: { ageYears: 10, habits: ['unknown_1', 'unknown_2'], traitLearningConcerns: ['fake_concern'] } },
    { desc: 'Corrupted strings', profile: { ageYears: 'NaN', traitStudyStyle: 'nonexistent_style', traitFocusSpan: 'infinite' } }
  ];

  for (const ep of edgeProfiles) {
    const res = NeuroMatrix.calculateLqMetrics(ep.profile);
    assert(res && res.scores, `Edge case ${ep.desc} failed to return scores`);
    for (const k of ['literacy_vocab', 'math_spatial', 'working_memory_focus', 'metacognition_retrieval', 'inquiry_creative']) {
      const val = res.scores[k];
      assert(!Number.isNaN(val) && Number.isFinite(val), `Edge case ${ep.desc} generated NaN for ${k}`);
      assert(val >= 58 && val <= 96, `Edge case ${ep.desc} generated out of bounds for ${k}: ${val}`);
    }
  }
});


// ============================================================================
// TEST SUITE 2: 6-Month Academic Trajectory Simulation Across Presets 1~5
// ============================================================================
console.log('\n[SUITE 2] 6-Month Expected Academic Trajectory Simulation Across Presets 1~5');

check('2.1 Trajectory Mathematical Invariants & Monotonicity Across Presets 1~5', () => {
  const presets = OnboardingWizard.PRESETS;
  const presetKeys = Object.keys(presets).sort();
  assert.strictEqual(presetKeys.length, 5, `Expected 5 clinical presets, found ${presetKeys.length}`);

  for (const pKey of presetKeys) {
    const profile = presets[pKey];
    const lqResult = NeuroMatrix.calculateLqMetrics(profile);
    const traj = lqResult.trajectory;

    assert(traj, `Preset ${pKey} missing trajectory`);
    const { unmanaged, baseline, coached } = traj;

    // Verify fields existence
    assert(unmanaged && baseline && coached, `Preset ${pKey} trajectory missing one of 3 tiers`);

    // Invariant 1: Focus Minutes Progression (12m < 20m < 35m)
    assert.strictEqual(unmanaged.focusMinutes, 12, `Preset ${pKey} unmanaged focusMinutes != 12`);
    assert.strictEqual(baseline.focusMinutes, 20, `Preset ${pKey} baseline focusMinutes != 20`);
    assert.strictEqual(coached.focusMinutes, 35, `Preset ${pKey} coached focusMinutes != 35`);
    assert.strictEqual(coached.focusGainMinutes, 23, `Preset ${pKey} coached.focusGainMinutes != 23`);

    // Invariant 2: Retention + Forget Rate = 100%
    assert.strictEqual(unmanaged.forgetRatePercent + unmanaged.retentionPercent, 100,
      `Preset ${pKey} unmanaged forget+retention != 100`);
    assert.strictEqual(baseline.forgetRatePercent + baseline.retentionPercent, 100,
      `Preset ${pKey} baseline forget+retention != 100`);
    assert.strictEqual(coached.forgetRatePercent + coached.retentionPercent, 100,
      `Preset ${pKey} coached forget+retention != 100`);
    assert.strictEqual(coached.retentionPercent, 92, `Preset ${pKey} coached retention != 92%`);

    // Invariant 3: LQ Score Monotonicity (coached > unmanaged)
    assert(coached.lqScore > unmanaged.lqScore,
      `Preset ${pKey} coached LQ (${coached.lqScore}) must be greater than unmanaged LQ (${unmanaged.lqScore})`);
    assert(unmanaged.lqScore >= 58 && unmanaged.lqScore <= 96,
      `Preset ${pKey} unmanaged LQ out of range: ${unmanaged.lqScore}`);
    assert(coached.lqScore >= 58 && coached.lqScore <= 96,
      `Preset ${pKey} coached LQ out of range: ${coached.lqScore}`);

    // Invariant 4: LQ Gain is positive and matches delta (clamped to max 25)
    assert(coached.gainLq > 0, `Preset ${pKey} coached.gainLq must be positive`);
    assert(coached.gainLq <= 25, `Preset ${pKey} coached.gainLq exceeded 25 points`);

    // Invariant 5: Status strings exist
    assert(unmanaged.statusKo && unmanaged.statusEn, `Preset ${pKey} unmanaged missing status labels`);
    assert(baseline.statusKo && baseline.statusEn, `Preset ${pKey} baseline missing status labels`);
    assert(coached.statusKo && coached.statusEn, `Preset ${pKey} coached missing status labels`);

    console.log(`    -> [${pKey}] overallLQ: ${lqResult.overallLQ} | Unmanaged: ${unmanaged.lqScore} (12m, 48% ret) -> Coached: ${coached.lqScore} (+${coached.gainLq} pts, 35m, 92% ret)`);
  }
});


// ============================================================================
// TEST SUITE 3: DOM Selector Stress Test
// ============================================================================
console.log('\n[SUITE 3] DOM Selector Stress Test Across Presets 1~5 and Edge Profiles');

check('3.1 Essential Containers and Section 1/2/3 DOM IDs Exist and Render Non-Empty Across Presets 1~5', () => {
  const presets = OnboardingWizard.PRESETS;

  const requiredIds = [
    // Dual-Pillar Containers
    'pillar-1-container',
    'pillar-2-container',
    'lq-radar-svg',
    'pinpoint-toys-box',
    'pillar2-learning-tools-box',
    
    // Section 1 IDs (Pillar 1 Auxology Status)
    'master-briefing-card-content',
    'briefing-status-section',
    'briefing-percentile',
    'briefing-velocity',
    'briefing-mph',
    'briefing-goldentime',
    
    // Section 2 IDs (Pillar 1 Research Evidence)
    'briefing-research-section',
    'briefing-papers-container',
    
    // Section 3 IDs (Pillar 1 Actions)
    'briefing-actions-section',
    'briefing-action-sleep',
    'briefing-action-nutrition',
    'briefing-action-exercise',

    // Pillar 2 Chapter Containers
    'report-ch-5',
    'report-ch-6',
    'report-ch-7',
    'report-ch-8'
  ];

  for (const [pKey, profile] of Object.entries(presets)) {
    const html = MasterBriefing.renderMasterBriefingCard(profile);
    assert(typeof html === 'string' && html.length > 50000,
      `Preset ${pKey} generated anemic HTML (length: ${html ? html.length : 0})`);

    for (const id of requiredIds) {
      assert(html.includes(`id="${id}"`) || html.includes(`id='${id}'`),
        `Missing critical DOM id: #${id} in rendered output for ${pKey}`);
    }

    // Verify non-empty content inside container sections
    const p1Index = html.indexOf('id="pillar-1-container"');
    const p2Index = html.indexOf('id="pillar-2-container"');
    assert(p1Index !== -1 && p2Index !== -1, `Missing pillar containers in ${pKey}`);
    assert(p2Index > p1Index, `Pillar 2 must be positioned after Pillar 1 in DOM flow`);
  }
});

check('3.2 DOM Stress Test on Extreme Age Boundary Profiles (Ages 1, 2, 7, 10, 13, 16, 20)', () => {
  const testAges = [1, 2, 7, 10, 13, 16, 20];
  const requiredCoreIds = [
    'pillar-1-container',
    'pillar-2-container',
    'lq-radar-svg',
    'pinpoint-toys-box',
    'pillar2-learning-tools-box'
  ];

  for (const age of testAges) {
    const profile = {
      gender: age % 2 === 0 ? 'girl' : 'boy',
      ageYears: age,
      ageMonths: age * 12,
      currentHeight: 80 + age * 5,
      currentWeight: 10 + age * 3,
      recentGrowth6m: 3.0,
      fatherHeight: 175,
      motherHeight: 162,
      habits: ['late_sleep'],
      cognitiveAxes: ['science_nature']
    };

    const html = MasterBriefing.renderMasterBriefingCard(profile);
    for (const id of requiredCoreIds) {
      assert(html.includes(`id="${id}"`) || html.includes(`id='${id}'`),
        `Missing id: #${id} for age ${age} profile`);
    }

    assert(html.length > 50000, `Age ${age} generated truncated HTML: ${html.length} bytes`);
  }
});


// ============================================================================
// TEST SUITE 4: Domain Purity Assertion (#pinpoint-toys-box vs #pillar2-learning-tools-box)
// ============================================================================
console.log('\n[SUITE 4] Domain Purity Assertion: Zero Contamination in #pinpoint-toys-box');

check('4.1 Purity: #pinpoint-toys-box Contains ZERO Bookstands, Timers, Microscopes, STEM Kits Across All Presets 1~5', () => {
  const presets = OnboardingWizard.PRESETS;

  // Forbidden terms in Pillar 1 physical equipment box
  const forbiddenTerms = [
    '독서대', 'bookstand',
    '타이머', 'time timer', '시각 타이머',
    '현미경', 'microscope',
    'stem', 'STEM', '과학키트', '실험키트',
    '그래비트랙스', 'gravitrax',
    '가베', '은물', 'froebel',
    '몬테소리', 'montessori',
    '워크북', 'workbook'
  ];

  function extractBox(html, id) {
    const needle = `id="${id}"`;
    const startIdx = html.indexOf(needle);
    if (startIdx === -1) return '';
    // Take from startIdx up to the next sibling box or section
    const nextBox = html.indexOf('class="pinpoint-category-box"', startIdx + needle.length);
    const nextPillar = html.indexOf('id="pillar-2-container"', startIdx + needle.length);
    const stopIdx = [nextBox, nextPillar].filter(i => i !== -1).sort((a, b) => a - b)[0] || (startIdx + 10000);
    return html.slice(startIdx, stopIdx);
  }

  for (const [pKey, profile] of Object.entries(presets)) {
    const html = MasterBriefing.renderMasterBriefingCard(profile);
    const toysBoxHtml = extractBox(html, 'pinpoint-toys-box');
    assert(toysBoxHtml && toysBoxHtml.length > 100, `Could not extract #pinpoint-toys-box for ${pKey}`);

    // Purity Check A: Zero forbidden educational/study terms
    for (const term of forbiddenTerms) {
      const termRegex = new RegExp(term, 'i');
      const found = termRegex.test(toysBoxHtml);
      assert(!found,
        `PURITY VIOLATION: #pinpoint-toys-box in ${pKey} contains forbidden educational term "${term}"!`);
    }

    // Purity Check B: Zero nutritional supplements in the physical exercise equipment box
    const hasNutritionalSupplements = /(아이커|보타니스타|황기추출물|HT042|영양제)/.test(toysBoxHtml);
    if (hasNutritionalSupplements) {
      throw new Error(`PURITY VIOLATION in ${pKey}: #pinpoint-toys-box is contaminated with nutritional supplements (e.g. 아이커/보타니스타/HT042) because newly added physical gear IDs (doorway_bar_6_8, etc.) are missing from CURATED_SPECIFIC_PRODUCTS_DB and fallback to ht042_growth at line 864 of pinpoint-curator.js!`);
    }

    // Purity Check C: Verify that #pinpoint-toys-box contains expected physical equipment
    const hasPhysicalGear = /(철봉|트램폴린|줄넘기|폼롤러|스톤|턱걸이)/.test(toysBoxHtml);
    assert(hasPhysicalGear, `Preset ${pKey} #pinpoint-toys-box missing expected physical growth equipment!`);
  }
});

check('4.2 Purity: Sweep Across All Ages 1..20 to Guarantee 100% Zero Educational Contamination in curatePinpointItems toys', () => {
  const forbiddenTerms = [
    '독서대', 'bookstand',
    '타이머', 'time timer',
    '현미경', 'microscope',
    'stem', 'STEM',
    '그래비트랙스', 'gravitrax',
    '가베', '은물',
    '몬테소리', 'montessori'
  ];

  for (let age = 1; age <= 20; age++) {
    const profile = {
      ageYears: age,
      ageMonths: age * 12,
      gender: age % 2 === 0 ? 'girl' : 'boy',
      currentHeight: 80 + age * 5,
      currentWeight: 10 + age * 3,
      habits: ['late_sleep', 'poor_posture'],
      cognitiveAxes: ['science_nature', 'math_logic']
    };

    const curated = PinpointCurator.curatePinpointItems(profile);
    assert(Array.isArray(curated.toys), `curated.toys is not an array for age ${age}`);
    assert(curated.toys.length > 0, `curated.toys is empty for age ${age}`);

    for (const item of curated.toys) {
      const fullText = `${item.id} ${item.name} ${item.categoryBadge} ${item.activeSpec} ${item.whyNeeded} ${item.buttonLabelCoupang}`;
      for (const term of forbiddenTerms) {
        assert(!new RegExp(term, 'i').test(fullText),
          `PURITY VIOLATION in curated.toys for age ${age}: item "${item.name}" contains forbidden term "${term}"`);
      }
    }
  }
});

check('4.3 Contrast Verification: Educational Items ARE Successfully Present in #pillar2-learning-tools-box', () => {
  const presets = OnboardingWizard.PRESETS;

  function extractPillar2Box(html, id) {
    const needle = `id="${id}"`;
    const startIdx = html.indexOf(needle);
    if (startIdx === -1) return '';
    const nextSec = html.indexOf('id="report-ch-8"', startIdx + needle.length);
    const stopIdx = nextSec !== -1 ? nextSec : (startIdx + 12000);
    return html.slice(startIdx, stopIdx);
  }

  for (const [pKey, profile] of Object.entries(presets)) {
    const html = MasterBriefing.renderMasterBriefingCard(profile);
    const toolsBoxHtml = extractPillar2Box(html, 'pillar2-learning-tools-box');
    assert(toolsBoxHtml && toolsBoxHtml.length > 100, `Could not extract #pillar2-learning-tools-box for ${pKey}`);

    // Educational tools SHOULD be present here
    const hasEducationalGear = /(몬테소리|가베|은물|타이머|소마큐브|그래비트랙스|독서대|플랩북|칠교)/.test(toolsBoxHtml);
    assert(hasEducationalGear,
      `Pillar 2 learning tools box in ${pKey} missing expected educational items!`);
  }
});

console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('================================================================');

if (failedChecks > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
