/**
 * tests/core3-4-5-biomechanics-neuro-tracker.test.js
 * Comprehensive Behavior & Invariants Test Suite for Master Cores 3, 4 & 5
 * 
 * Tests:
 * 1. Core 3: Biomechanics & Posture Studio (Timer logic, routines, disc decompression, Wolff's law)
 * 2. Core 4: Neuro-Cognitive Matrix (5-axis radar chart, golden windows, Havruta inquiry)
 * 3. Core 5: 90-Day Tracker & Hospital Clinic A4 PDF Report (localStorage, streaks, 2-page printout)
 * 4. Application Integration & DOM Rendering
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const BiomechanicsStudio = require('../src/js/biomechanics-studio');
const NeuroCognitiveMatrix = require('../src/js/neuro-cognitive-matrix');
const GrowthTracker = require('../src/js/growth-tracker');

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

function suite(name, fn) {
  console.log(`\n--- ${name} ---`);
  fn();
}

console.log('====================================================================');
console.log('   Taller Bio Labs: Master Cores 3, 4 & 5 Comprehensive Test Suite   ');
console.log('====================================================================');

// =============================================================================
// SUITE 1: Core 3 - Biomechanics Studio & Countdown Stopwatch Engine
// =============================================================================
suite('Suite 1: Core 3 - Biomechanics Studio & Countdown Stopwatches', () => {

  it('defines exactly 3 clinical exercise routines with correct sequence', () => {
    assert.strictEqual(BiomechanicsStudio.ROUTINES.length, 3);
    const ids = BiomechanicsStudio.ROUTINES.map(r => r.id);
    assert.deepStrictEqual(ids, ['dead_hang', 'thoracic_stretch', 'plyometrics']);

    const categories = BiomechanicsStudio.ROUTINES.map(r => r.category);
    assert.deepStrictEqual(categories, ['decompression', 'alignment', 'epiphyseal_stimulation']);
  });

  it('Routine 1 (dead_hang) enforces 30s x 3 sets with 30s rest interval', () => {
    const r1 = BiomechanicsStudio.ROUTINES[0];
    assert.strictEqual(r1.id, 'dead_hang');
    assert.strictEqual(r1.duration, 30);
    assert.strictEqual(r1.sets, 3);
    assert.strictEqual(r1.restSeconds, 30);
    assert(r1.nameKo.includes('패시브 데드행'));
  });

  it('Routine 2 (thoracic_stretch) enforces 45s x 2 sets for +1.8cm posture curvature', () => {
    const r2 = BiomechanicsStudio.ROUTINES[1];
    assert.strictEqual(r2.id, 'thoracic_stretch');
    assert.strictEqual(r2.duration, 45);
    assert.strictEqual(r2.sets, 2);
    assert(r2.restorationEstimate.includes('1.8'));
    assert(r2.nameKo.includes('흉추 신전'));
  });

  it('Routine 3 (plyometrics) enforces 15 min interval for Wolff\'s Law bone remodeling', () => {
    const r3 = BiomechanicsStudio.ROUTINES[2];
    assert.strictEqual(r3.id, 'plyometrics');
    assert.strictEqual(r3.durationMinutes, 15);
    assert.strictEqual(r3.duration, 900);
    assert.strictEqual(r3.principle, "Wolff's Law");
    assert(r3.molecularTrigger.includes('Runx2 / Sox9'));
  });

  it('models diurnal disc compression (1.5~2.2cm) and posture unlocking (+1.5~2.5cm)', () => {
    assert.strictEqual(BiomechanicsStudio.BIOMECHANICS_CONSTANTS.diurnalLossMin, 1.5);
    assert.strictEqual(BiomechanicsStudio.BIOMECHANICS_CONSTANTS.diurnalLossMax, 2.2);
    assert.strictEqual(BiomechanicsStudio.BIOMECHANICS_CONSTANTS.restoredHeightAverage, 1.8);

    const normalGain = BiomechanicsStudio.calculateDecompressionPotential([]);
    assert.strictEqual(normalGain, 1.5);

    const postureGain = BiomechanicsStudio.calculateDecompressionPotential(['poor_posture']);
    assert.strictEqual(postureGain, 1.9);

    const comboGain = BiomechanicsStudio.calculateDecompressionPotential(['poor_posture', 'sedentary']);
    assert.strictEqual(comboGain, 2.2);
  });

  it('RoutineTimer initializes with idle state and initial duration', () => {
    const timer = BiomechanicsStudio.getOrCreateTimer('dead_hang');
    timer.reset();
    assert.strictEqual(timer.state, 'idle');
    assert.strictEqual(timer.currentSet, 1);
    assert.strictEqual(timer.remainingSeconds, 30);
  });

  it('RoutineTimer start() transitions state to running and debounces duplicate start()', () => {
    const timer = BiomechanicsStudio.getOrCreateTimer('dead_hang');
    timer.reset();
    timer.start();
    assert.strictEqual(timer.state, 'running');
    const firstInterval = timer.intervalId;

    // Call start again
    timer.start();
    assert.strictEqual(timer.intervalId, firstInterval, 'Should not create duplicate interval timer');

    timer.pause();
    assert.strictEqual(timer.state, 'paused');
    assert.strictEqual(timer.intervalId, null);
    timer.reset();
  });

  it('RoutineTimer completeSet() transitions between sets and rest intervals until completed', () => {
    const timer = BiomechanicsStudio.getOrCreateTimer('dead_hang');
    timer.reset();
    assert.strictEqual(timer.currentSet, 1);

    // Set 1 complete -> transitions to rest phase (30s)
    timer.completeSet();
    assert.strictEqual(timer.isRestPhase, true);
    assert.strictEqual(timer.remainingSeconds, 30);

    // Rest complete -> transitions to Set 2
    timer.completeSet();
    assert.strictEqual(timer.isRestPhase, false);
    assert.strictEqual(timer.currentSet, 2);

    // Set 2 complete -> rest
    timer.completeSet();
    assert.strictEqual(timer.isRestPhase, true);

    // Rest complete -> Set 3
    timer.completeSet();
    assert.strictEqual(timer.isRestPhase, false);
    assert.strictEqual(timer.currentSet, 3);

    // Set 3 complete -> All sets completed
    let completionFired = false;
    timer.onComplete(() => { completionFired = true; });
    timer.completeSet();
    assert.strictEqual(timer.state, 'completed');
    assert.strictEqual(timer.remainingSeconds, 0);
    assert.strictEqual(completionFired, true);

    timer.reset();
  });

  it('formatTime formats seconds into MM:SS string correctly and clamps at 00:00', () => {
    assert.strictEqual(BiomechanicsStudio.formatTime(30), '00:30');
    assert.strictEqual(BiomechanicsStudio.formatTime(45), '00:45');
    assert.strictEqual(BiomechanicsStudio.formatTime(900), '15:00');
    assert.strictEqual(BiomechanicsStudio.formatTime(0), '00:00');
    assert.strictEqual(BiomechanicsStudio.formatTime(-10), '00:00');
  });

  it('renderBiomechanicsSection produces complete valid HTML with zero commercial bleed', () => {
    const html = BiomechanicsStudio.renderBiomechanicsSection({ habits: ['poor_posture'] });
    assert(html.includes('id="core-3-container"'), 'Must contain #core-3-container');
    assert(html.includes('id="routine-card-dead_hang"'));
    assert(html.includes('id="routine-card-thoracic_stretch"'));
    assert(html.includes('id="routine-card-plyometrics"'));
    assert(html.includes('id="btn-start-dead_hang"'));
    assert(html.includes('id="btn-pause-dead_hang"'));
    assert(html.includes('id="btn-reset-dead_hang"'));
    assert(html.includes('AF7865143'), 'Must contain Coupang affiliate parameter');
    assert(!html.includes('최저가'), 'Must not contain commercial discount badges');
  });

});

// =============================================================================
// SUITE 2: Core 4 - Neuro-Cognitive Matrix & Havruta Inquiry
// =============================================================================
suite('Suite 2: Core 4 - Neuro-Cognitive Matrix & Havruta Inquiry', () => {

  it('defines all 5 cognitive pillars with descriptions', () => {
    assert.strictEqual(NeuroCognitiveMatrix.COGNITIVE_PILLARS.length, 5);
    const ids = NeuroCognitiveMatrix.COGNITIVE_PILLARS.map(p => p.id);
    assert.deepStrictEqual(ids, ['math_logic', 'language_reading', 'science_nature', 'sensory_arts', 'executive_focus']);
  });

  it('calculateCognitiveScores returns equilateral baseline 70 when none are selected', () => {
    const scores = NeuroCognitiveMatrix.calculateCognitiveScores([]);
    assert.strictEqual(scores.math_logic, 70);
    assert.strictEqual(scores.language_reading, 70);
    assert.strictEqual(scores.science_nature, 70);
    assert.strictEqual(scores.sensory_arts, 70);
    assert.strictEqual(scores.executive_focus, 70);
  });

  it('calculateCognitiveScores boosts selected axes to 90 while maintaining non-selected at 70', () => {
    const scores = NeuroCognitiveMatrix.calculateCognitiveScores(['math_logic', 'science_nature']);
    assert.strictEqual(scores.math_logic, 90);
    assert.strictEqual(scores.science_nature, 90);
    assert.strictEqual(scores.language_reading, 70);
    assert.strictEqual(scores.sensory_arts, 70);
    assert.strictEqual(scores.executive_focus, 70);
  });

  it('calculateCognitiveScores evaluates all 5 selected as uniform 90', () => {
    const scores = NeuroCognitiveMatrix.calculateCognitiveScores(['math_logic', 'language_reading', 'science_nature', 'sensory_arts', 'executive_focus']);
    Object.values(scores).forEach(s => assert.strictEqual(s, 90));
  });

  it('pointsToSvgPolygonPath generates closed SVG polygon path string starting with M and ending with Z', () => {
    const points = [
      { x: 200, y: 70 },
      { x: 323, y: 160 },
      { x: 276, y: 305 },
      { x: 124, y: 305 },
      { x: 76, y: 160 }
    ];
    const pathStr = NeuroCognitiveMatrix.pointsToSvgPolygonPath(points);
    assert(pathStr.startsWith('M 200,70'));
    assert(pathStr.endsWith('Z'));
    assert.strictEqual((pathStr.match(/L /g) || []).length, 4);
  });

  it('renderRadarSvg renders SVG with viewBox 0 0 400 400 and dual overlay paths', () => {
    const scores = { math_logic: 90, language_reading: 70, science_nature: 90, sensory_arts: 70, executive_focus: 70 };
    const svg = NeuroCognitiveMatrix.renderRadarSvg(scores);
    assert(svg.includes('viewBox="0 0 400 400"'));
    assert(svg.includes('stroke-dasharray="4,4"'), 'Must contain baseline dashed polygon');
    assert(svg.includes('stroke="var(--cyan-pulse)"'), 'Must contain child profile glowing path');
  });

  it('getGoldenTimeInfo identifies exact neuroplasticity golden windows across all age brackets', () => {
    const toddler = NeuroCognitiveMatrix.getGoldenTimeInfo(2);
    assert.strictEqual(toddler.focus, 'sensorimotor synaptogenesis');

    const childhood = NeuroCognitiveMatrix.getGoldenTimeInfo(6);
    assert.strictEqual(childhood.focus, 'linguistic lateralization');

    const earlyPuberty = NeuroCognitiveMatrix.getGoldenTimeInfo(10);
    assert.strictEqual(earlyPuberty.focus, 'prefrontal cortical thickness');

    const adolescent = NeuroCognitiveMatrix.getGoldenTimeInfo(15);
    assert.strictEqual(adolescent.focus, 'axonal myelination');
  });

  it('Havruta 3-Question system provides verbatim inquiry, deduction, and application models in KO and EN', () => {
    const q = NeuroCognitiveMatrix.HAVRUTA_QUESTIONS;
    assert(q.step1.modelKo.includes('특이한 점'));
    assert(q.step1.modelEn.includes('unexpected pattern'));

    assert(q.step2.modelKo.includes('달라졌을까'));
    assert(q.step2.modelEn.includes('reversed'));

    assert(q.step3.modelKo.includes('해결할 수 있을까'));
    assert(q.step3.modelEn.includes('real-world challenges'));
  });

  it('renderNeuroSection produces valid HTML with #core-4-container and quiet reference chip', () => {
    const html = NeuroCognitiveMatrix.renderNeuroSection({ ageYears: 10, cognitiveAxes: ['math_logic'] });
    assert(html.includes('id="core-4-container"'));
    assert(html.includes('viewBox="0 0 400 400"'));
    assert(html.includes('A100708867'), 'Must contain LinkPrice affiliate parameter');
    assert(!html.includes('특가'), 'Must not contain promotional jargon');
  });

});

// =============================================================================
// SUITE 3: Core 5 - 90-Day Tracker & Hospital Clinic A4 PDF Report
// =============================================================================
suite('Suite 3: Core 5 - 90-Day Tracker & Hospital Clinic A4 PDF Report', () => {

  it('supports localStorage keys taller_growth_logs, kidsfit_tracker_v2, taller_bio_tracker', () => {
    assert(GrowthTracker.STORAGE_KEYS.includes('taller_growth_logs'));
    assert(GrowthTracker.STORAGE_KEYS.includes('kidsfit_tracker_v2'));
    assert(GrowthTracker.STORAGE_KEYS.includes('taller_bio_tracker'));
  });

  it('survives missing or throwing localStorage gracefully with in-memory fallback', () => {
    const data = GrowthTracker.getTrackerData({ currentHeight: 140.0, currentWeight: 36.0 });
    assert(data);
    assert(Array.isArray(data.logs));
    assert(data.currentStreakDays >= 14);
  });

  it('tracks daily protocol streaks (Sleep, Nutrition, Biomechanics)', () => {
    const data = GrowthTracker.getTrackerData();
    assert.strictEqual(typeof data.todayProtocols.sleep, 'boolean');
    assert.strictEqual(typeof data.todayProtocols.nutrition, 'boolean');
    assert.strictEqual(typeof data.todayProtocols.exercise, 'boolean');

    GrowthTracker.toggleProtocol('sleep', true);
    const updated = GrowthTracker.getTrackerData();
    assert.strictEqual(updated.todayProtocols.sleep, true);
  });

  it('awards milestone badges at 7, 30, and 90 days', () => {
    const data = GrowthTracker.getTrackerData();
    assert.strictEqual(data.badges.length, 3);
    const badgeDays = data.badges.map(b => b.days);
    assert.deepStrictEqual(badgeDays, [7, 30, 90]);

    // When streak is 14, 7-day badge is unlocked, 30 and 90 are locked
    assert.strictEqual(data.badges[0].unlocked, true);
    assert.strictEqual(data.badges[1].unlocked, false);
    assert.strictEqual(data.badges[2].unlocked, false);
  });

  it('adds date-stamped biometric log entry and updates streaks', () => {
    const prevStreak = GrowthTracker.getTrackerData().currentStreakDays;
    const updated = GrowthTracker.addLogEntry(138.5, 36.2, '성장판 운동 후 계측');
    assert(updated.logs.some(l => l.height === 138.5 && l.weight === 36.2));
    assert.strictEqual(updated.currentStreakDays, prevStreak + 1);
  });

  it('renderClinicalPdfReport formats clean 2-page A4 university pediatric hospital report', () => {
    const profile = {
      gender: 'boy',
      ageYears: 10,
      ageMonths: 120,
      currentHeight: 137.0,
      currentWeight: 35.5,
      fatherHeight: 174.0,
      motherHeight: 161.0
    };
    const reportHtml = GrowthTracker.renderClinicalPdfReport(profile);
    
    // Page 1 assertions
    assert(reportHtml.includes('print-page-1'));
    assert(reportHtml.includes('page-break-after: always;'), 'Must enforce page-break-after: always; on Page 1');
    assert(reportHtml.includes('신체성장·골연령 정밀 진단 결과지 (Page 1/2)'));
    assert(reportHtml.includes('137 cm / 35.5 kg'));
    assert(reportHtml.includes('부모 유전 표적키 (MPH)'));
    assert(reportHtml.includes('소아 성장 궤적 다중 곡선'));

    // Page 2 assertions
    assert(reportHtml.includes('print-page-2'));
    assert(reportHtml.includes('내분비·임상영양·생체역학 &amp; 뇌인지 처방전 (Page 2/2)'));
    assert(reportHtml.includes('서파수면(SWS) 피크 구간'));
    assert(reportHtml.includes('구연산칼슘 / MCHA'));
    assert(reportHtml.includes('척추 감압 데드행'));
    assert(reportHtml.includes('이 전시물에서 가장 규칙적이지 않거나 특이한 점은 무엇일까'));
    assert(reportHtml.includes('책임 소아내분비·성장 전문의'));
    assert(reportHtml.includes('[인/서명]'));

    // Commercial purge assertion
    assert(!reportHtml.includes('쿠폰'));
    assert(!reportHtml.includes('로켓배송'));
    assert(!reportHtml.includes('장보기'));
  });

  it('renderTrackerSection generates dashboard view with #core-5-container and print trigger', () => {
    const html = GrowthTracker.renderTrackerSection({ currentHeight: 137.0 });
    assert(html.includes('id="core-5-container"'));
    assert(html.includes('id="btn-print-clinic-pdf"'));
    assert(html.includes('id="chk-proto-sleep"'));
    assert(html.includes('id="chk-proto-nutrition"'));
    assert(html.includes('id="chk-proto-exercise"'));
    assert(html.includes('id="btn-add-log"'));
  });

});

// =============================================================================
// SUITE 4: Stylesheet & Print Rule Verification
// =============================================================================
suite('Suite 4: Stylesheet & Print Rule Verification', () => {

  it('verifies src/css/style.css defines dedicated @media print rules with pure white and deep navy', () => {
    const css = fs.readFileSync(path.join(ROOT_DIR, 'src', 'css', 'style.css'), 'utf8');
    assert(css.includes('@page {'));
    assert(css.includes('size: A4 portrait;'));
    assert(css.includes('margin: 12mm 15mm;'));
    assert(css.includes('@media print {'));
    assert(css.includes('background-color: #FFFFFF !important;'));
    assert(css.includes('color: #0F172A !important;'));
    assert(css.includes('page-break-after: always !important;'));
    assert(css.includes('.btn,'));
  });

  it('verifies index.html has #core-3-container, #core-4-container, #core-5-container and loads scripts', () => {
    const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    assert(html.includes('id="core-3-container"'));
    assert(html.includes('id="core-4-container"'));
    assert(html.includes('id="core-5-container"'));
    assert(html.includes('id="btn-print-clinic-pdf"'));
    assert(html.includes('src="src/js/biomechanics-studio.js'));
    assert(html.includes('src="src/js/neuro-cognitive-matrix.js'));
    assert(html.includes('src="src/js/growth-tracker.js'));
  });

});

// =============================================================================
// SUITE 5: Full Application Integration Simulation
// =============================================================================
suite('Suite 5: Full Application Integration Simulation', () => {

  it('simulates app.js renderPrescriptionResults rendering all 5 master cores without throwing', () => {
    const KidsFitApp = require('../src/js/app');

    // Setup mock DOM for app execution
    const mockElements = {};
    const mockDoc = {
      getElementById: (id) => {
        if (!mockElements[id]) {
          mockElements[id] = {
            id,
            style: { display: '', border: '', background: '' },
            innerHTML: '',
            textContent: '',
            classList: { add: () => {}, remove: () => {} },
            setAttribute: () => {},
            getAttribute: () => '',
            addEventListener: () => {},
            removeEventListener: () => {},
            scrollIntoView: () => {}
          };
        }
        return mockElements[id];
      },
      querySelectorAll: () => [],
      querySelector: () => null,
      documentElement: { lang: 'ko' }
    };

    global.document = mockDoc;
    global.window = {
      document: mockDoc,
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      },
      addEventListener: () => {},
      dispatchEvent: () => {}
    };

    // Apply Preset 3 (10yo Boy)
    const success = KidsFitApp.applyPreset('preset-3');
    assert.strictEqual(success, true);
    assert.strictEqual(KidsFitApp.state.activePresetId, 'preset-3');
    assert.strictEqual(KidsFitApp.state.profile.currentHeight, 137.0);

    // Call renderPrescriptionResults
    KidsFitApp.renderPrescriptionResults(KidsFitApp.state.profile);

    // Verify Core 3, 4, 5 were populated
    const c3 = mockDoc.getElementById('core-3-container');
    const c4 = mockDoc.getElementById('core-4-container');
    const c5 = mockDoc.getElementById('core-5-container');

    assert(c3.innerHTML.includes('id="routine-card-dead_hang"'), 'Core 3 must render routines');
    assert(c4.innerHTML.includes('viewBox="0 0 400 400"'), 'Core 4 must render radar SVG');
    assert(c5.innerHTML.includes('id="btn-print-clinic-pdf"'), 'Core 5 must render tracker');
  });

});

console.log('\n====================================================================');
console.log(`TOTAL TESTS EVALUATED : ${totalTests}`);
console.log(`TOTAL TESTS PASSED    : ${passedTests}`);
console.log(`TOTAL TESTS FAILED    : ${failedTests}`);
console.log('====================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL MASTER CORES 3, 4 & 5 TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}
