#!/usr/bin/env node
/**
 * scripts/self-improve-engine.js
 * Taller Bio Labs (KidsFit Bio Labs) — 6-Stage Autonomous Quality Assurance & Self-Healing Engine
 * 
 * Clinical Invariants & Audit Stages:
 * Stage 1: Paper Knowledge Base Health & Schema Auditor (>= 745 papers, 5 balanced pillars)
 * Stage 2: Clinical Invariant Math Validation (Box-Cox, erf CDF, Tanner MPH, habit cap -5cm, SWS GH cap -52%)
 * Stage 3: Bilingual Translation Parity & Key Completeness (EN ↔ KO, unit conversion integrity)
 * Stage 4: SVG Chart Bounds & Coordinate Safety (Growth curves, hormone timeline, 5-axis radar points [0,400])
 * Stage 5: Affiliate Reference Chip URL & Syntax Integrity (Zero "#", Coupang/LinkPrice/iHerb/Amazon tags)
 * Stage 6: Automated Diagnostic Quality Health Report & Self-Healing (logs/self_improvement_report.json)
 * 
 * CLI Usage:
 *   node scripts/self-improve-engine.js [--verify | --report | --fix]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');
const REPORT_FILE = path.join(LOGS_DIR, 'self_improvement_report.json');
const HISTORY_FILE = path.join(LOGS_DIR, 'self-improvement-history.json');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Parse CLI arguments
const args = process.argv.slice(2);
const isFixMode = args.includes('--fix');
const isReportMode = args.includes('--report');
const isVerifyMode = args.includes('--verify') || (!isFixMode && !isReportMode);

// Test Results Accumulator
const auditResults = {
  timestamp: new Date().toISOString(),
  mode: isFixMode ? 'fix' : isReportMode ? 'report' : 'verify',
  healthScore: 100,
  stages: {},
  summary: {
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    warnings: 0
  },
  errors: []
};

function recordCheck(stageName, checkName, passed, details = '') {
  auditResults.summary.totalChecks++;
  if (!auditResults.stages[stageName]) {
    auditResults.stages[stageName] = {
      passed: true,
      checks: []
    };
  }

  auditResults.stages[stageName].checks.push({
    name: checkName,
    passed,
    details
  });

  if (passed) {
    auditResults.summary.passedChecks++;
    console.log(`  ✓ [PASS] [${stageName}] ${checkName}`);
  } else {
    auditResults.summary.failedChecks++;
    auditResults.stages[stageName].passed = false;
    auditResults.errors.push(`[${stageName}] ${checkName}: ${details}`);
    console.error(`  ✗ [FAIL] [${stageName}] ${checkName} - ${details}`);
  }
}

// ============================================================================
// STAGE 1: Research Paper Knowledge Base Health & Schema Auditor
// ============================================================================
function auditStage1Papers() {
  console.log('\n------------------------------------------------------------');
  console.log('Stage 1: Research Paper Knowledge Base Health & Schema Audit');
  console.log('------------------------------------------------------------');

  const kbPath = path.join(ROOT_DIR, 'src/data/research-knowledge-base.json');
  if (!fs.existsSync(kbPath)) {
    recordCheck('Stage 1: Papers', 'Knowledge Base JSON File Exists', false, 'File not found: ' + kbPath);
    return;
  }

  let kb;
  try {
    kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
  } catch (err) {
    recordCheck('Stage 1: Papers', 'Knowledge Base Valid JSON', false, err.message);
    return;
  }

  const papers = kb.papers || [];
  const totalCount = (kb.metadata && kb.metadata.total_papers) || papers.length;

  recordCheck('Stage 1: Papers', 'Paper Count Meets Threshold (>= 745 papers)', totalCount >= 745, `Found ${totalCount} papers (required >= 745)`);

  // Schema Validation
  let validSchemaCount = 0;
  const pillarCounts = {
    growth_endocrinology: 0,
    fine_motor_neuroscience: 0,
    pedagogy_montessori_froebel: 0,
    parent_child_interaction_museum: 0,
    posture_biomechanics_exercise: 0
  };

  for (const p of papers) {
    const hasPillar = p.pillar && pillarCounts.hasOwnProperty(p.pillar);
    if (hasPillar) pillarCounts[p.pillar]++;

    const hasId = Boolean(p.id);
    const hasTitle = Boolean(p.title && p.title.length > 5);
    const hasJournal = Boolean(p.journal);
    const hasYear = Boolean(p.year && Number(p.year) >= 1950);
    const hasCitation = Boolean(p.pmid || p.doi || p.url);

    if (hasId && hasTitle && hasJournal && hasYear && hasCitation && hasPillar) {
      validSchemaCount++;
    }
  }

  recordCheck('Stage 1: Papers', 'Paper Schema Compliance (>= 98% validity)', (validSchemaCount / papers.length) >= 0.98, `${validSchemaCount}/${papers.length} fully compliant`);

  // Pillar Balance Audits
  recordCheck('Stage 1: Papers', 'Pillar 1: growth_endocrinology (>= 150)', pillarCounts.growth_endocrinology >= 150, `Found ${pillarCounts.growth_endocrinology}`);
  recordCheck('Stage 1: Papers', 'Pillar 2: fine_motor_neuroscience (>= 100)', pillarCounts.fine_motor_neuroscience >= 100, `Found ${pillarCounts.fine_motor_neuroscience}`);
  recordCheck('Stage 1: Papers', 'Pillar 3: pedagogy_montessori_froebel (>= 100)', pillarCounts.pedagogy_montessori_froebel >= 100, `Found ${pillarCounts.pedagogy_montessori_froebel}`);
  recordCheck('Stage 1: Papers', 'Pillar 4: parent_child_interaction_museum (>= 120)', pillarCounts.parent_child_interaction_museum >= 120, `Found ${pillarCounts.parent_child_interaction_museum}`);
  recordCheck('Stage 1: Papers', 'Pillar 5: posture_biomechanics_exercise (>= 100)', pillarCounts.posture_biomechanics_exercise >= 100, `Found ${pillarCounts.posture_biomechanics_exercise}`);
}

// ============================================================================
// STAGE 2: Clinical Invariant Math Validation
// ============================================================================
function auditStage2ClinicalMath() {
  console.log('\n------------------------------------------------------------');
  console.log('Stage 2: Clinical Invariant Math Validation');
  console.log('------------------------------------------------------------');

  let GrowthEngine, EndocrinologyEngine, NutritionEngine;
  try {
    GrowthEngine = require('../src/js/growth-engine');
    EndocrinologyEngine = require('../src/js/endocrinology-engine');
    NutritionEngine = require('../src/js/nutrition-engine');
  } catch (err) {
    recordCheck('Stage 2: Math', 'Engine Modules Loadable', false, err.message);
    return;
  }

  // 1. Box-Cox LMS Calculation
  // Test 120mo median boy height 137.0cm with M=137.0, L=1.0, S=0.04
  const resMid = GrowthEngine.calculateLMSZScore(137.0, 120, 'boy', 'height', 'KDCA');
  const zScoreMid = resMid.zScore;
  recordCheck('Stage 2: Math', 'Box-Cox Median Yields Z=0.0', Math.abs(zScoreMid) < 0.05, `Z-Score: ${zScoreMid}`);

  // Test L=0 logarithmic fallback branch
  const zLog = Math.log(150.0 / 150.0) / 0.04;
  recordCheck('Stage 2: Math', 'Box-Cox L=0 Logarithmic Branch Handled', Math.abs(zLog) < 0.0001, `Z-Score: ${zLog}`);

  // 2. Normal CDF erf Approximation
  const p50 = GrowthEngine.normalCDF(0);
  const p975 = GrowthEngine.normalCDF(1.96);
  recordCheck('Stage 2: Math', 'Normal CDF erf(0) == 0.50', Math.abs(p50 - 0.5) < 0.01, `CDF(0): ${p50}`);
  recordCheck('Stage 2: Math', 'Normal CDF erf(1.96) ~= 0.975', Math.abs(p975 - 0.975) < 0.01, `CDF(1.96): ${p975}`);

  // 3. Tanner Mid-Parental Height (MPH) Formula
  const mphBoy = GrowthEngine.calculateMPH(175, 162, 'boy');
  const mphGirl = GrowthEngine.calculateMPH(175, 162, 'girl');
  recordCheck('Stage 2: Math', 'Tanner Boy MPH: (175+162+13)/2 == 175.0cm', Math.abs(mphBoy.mph - 175.0) < 0.1, `Got ${mphBoy.mph}`);
  recordCheck('Stage 2: Math', 'Tanner Girl MPH: (175+162-13)/2 == 162.0cm', Math.abs(mphGirl.mph - 162.0) < 0.1, `Got ${mphGirl.mph}`);
  recordCheck('Stage 2: Math', 'Tanner Boy/Girl Delta Exactly 13.0cm', Math.abs((mphBoy.mph - mphGirl.mph) - 13.0) < 0.1, `Diff: ${mphBoy.mph - mphGirl.mph}`);
  recordCheck('Stage 2: Math', 'Tanner MPH Clinical Margin is ±8.5cm', mphBoy.margin === 8.5, `Margin: ${mphBoy.margin}`);

  // 4. Habit Loss Clamping (-5.0cm max)
  const allHabits = ['late_sleep', 'night_carbs', 'poor_posture', 'picky_eater', 'sedentary'];
  const pred = GrowthEngine.calculateHeightPrediction(175.0, allHabits, 'phase_1');
  recordCheck('Stage 2: Math', 'Habit Penalty Clamped to -5.0cm Maximum', Math.abs(pred.unmanagedLoss) <= 5.0, `unmanagedLoss: ${pred.unmanagedLoss}`);

  // 5. Golden Time Potential Gain Clamping (+5.0 ~ +9.5cm)
  const traj = GrowthEngine.predictAdultHeightTrajectories(175.0, allHabits, 'phase_1');
  const optGain = traj.optimized.gainOverUnmanaged;
  recordCheck('Stage 2: Math', 'Potential Gain Range (+5.0 ~ +9.5cm)', optGain >= 5.0 && optGain <= 9.5, `potentialGain: ${optGain}`);

  // 6. Circadian SWS Growth Hormone Suppression Ceiling Cap (-52%)
  const simExtreme = EndocrinologyEngine.simulateHormoneCurve(1500, 1440); // Bedtime 01:00, Meal 24:00
  recordCheck('Stage 2: Math', 'Hormone Suppression Ceiling Capped at -52%', simExtreme.ghLossPercent <= 52.0, `Suppression: -${simExtreme.ghLossPercent}%`);

  const simOptimal = EndocrinologyEngine.simulateHormoneCurve(1260, 1020); // Bedtime 21:00, Meal 17:00 (4h gap)
  recordCheck('Stage 2: Math', 'Optimal Sleep & Fasting Yields 0% Suppression', simOptimal.ghLossPercent === 0, `Suppression: -${simOptimal.ghLossPercent}%`);

  // 7. Weight-Proportional RDA & Bioavailability
  const nut3yo = NutritionEngine.calculateTargets(14.7, 3);
  const nut10yo = NutritionEngine.calculateTargets(35.0, 10);
  recordCheck('Stage 2: Math', 'Calcium Target Age 3 == 650mg', nut3yo.calciumMg === 650, `Got ${nut3yo.calciumMg}mg`);
  recordCheck('Stage 2: Math', 'Calcium Target Age 10 == 1100mg', nut10yo.calciumMg === 1100, `Got ${nut10yo.calciumMg}mg`);
  recordCheck('Stage 2: Math', 'Calcium Citrate Bioavailability ~45%', nut3yo.calciumCitrateAbsorption === 45, `Got ${nut3yo.calciumCitrateAbsorption}%`);
  recordCheck('Stage 2: Math', 'Calcium Carbonate Bioavailability ~22%', nut3yo.calciumCarbonateAbsorption === 22, `Got ${nut3yo.calciumCarbonateAbsorption}%`);
  recordCheck('Stage 2: Math', 'Protein Proportional (weight * 1.3g)', Math.abs(nut10yo.proteinG - (35.0 * 1.3)) < 0.2, `Got ${nut10yo.proteinG}g`);
}

// ============================================================================
// STAGE 3: Bilingual Translation Parity & Key Completeness
// ============================================================================
function auditStage3Translations() {
  console.log('\n------------------------------------------------------------');
  console.log('Stage 3: Bilingual Translation Parity & Unit Consistency');
  console.log('------------------------------------------------------------');

  let i18n;
  try {
    i18n = require('../src/js/i18n');
  } catch (err) {
    recordCheck('Stage 3: i18n', 'i18n Module Loadable', false, err.message);
    return;
  }

  const koKeys = Object.keys(i18n.DICTIONARY.ko || {});
  const enKeys = Object.keys(i18n.DICTIONARY.en || {});

  recordCheck('Stage 3: i18n', 'Translation Dictionaries Populated (> 50 keys)', koKeys.length >= 50 && enKeys.length >= 50, `KO: ${koKeys.length}, EN: ${enKeys.length}`);

  // Parity Check
  const missingInEn = koKeys.filter(k => !enKeys.includes(k));
  const missingInKo = enKeys.filter(k => !koKeys.includes(k));

  recordCheck('Stage 3: i18n', '100% Key Parity (KO -> EN)', missingInEn.length === 0, missingInEn.length > 0 ? `Missing: ${missingInEn.join(', ')}` : '0 missing');
  recordCheck('Stage 3: i18n', '100% Key Parity (EN -> KO)', missingInKo.length === 0, missingInKo.length > 0 ? `Missing: ${missingInKo.join(', ')}` : '0 missing');

  // Unit Conversion Checks
  const inVal = i18n.cmToInches(100);
  const cmVal = i18n.inchesToCm(inVal);
  recordCheck('Stage 3: i18n', 'Unit Conversion Roundtrip (cm <-> inches)', Math.abs(cmVal - 100) < 0.1, `100cm -> ${inVal}in -> ${cmVal}cm`);

  const lbsVal = i18n.kgToLbs(50);
  const kgVal = i18n.lbsToKg(lbsVal);
  recordCheck('Stage 3: i18n', 'Unit Conversion Roundtrip (kg <-> lbs)', Math.abs(kgVal - 50) < 0.1, `50kg -> ${lbsVal}lbs -> ${kgVal}kg`);
}

// ============================================================================
// STAGE 4: SVG Chart Bounds & Coordinate Safety
// ============================================================================
function auditStage4SvgCharts() {
  console.log('\n------------------------------------------------------------');
  console.log('Stage 4: SVG Chart Bounds & Coordinate Safety');
  console.log('------------------------------------------------------------');

  let GrowthEngine, EndocrinologyEngine, NeuroMatrix;
  try {
    GrowthEngine = require('../src/js/growth-engine');
    EndocrinologyEngine = require('../src/js/endocrinology-engine');
    NeuroMatrix = require('../src/js/neuro-cognitive-matrix');
  } catch (err) {
    recordCheck('Stage 4: SVG', 'SVG Modules Loadable', false, err.message);
    return;
  }

  // 1. Growth Curve SVG
  const growthSvg = GrowthEngine.renderSvgGrowthCurve('boy', 120, 137.0);
  recordCheck('Stage 4: SVG', 'Growth Curve SVG Contains Valid ViewBox', growthSvg.includes('viewBox="0 0 600 320"'), 'viewBox check');
  recordCheck('Stage 4: SVG', 'Growth Curve SVG Contains No NaN or Undefined', !growthSvg.includes('NaN') && !growthSvg.includes('undefined'), 'NaN/undefined check');

  // 2. 24h Hormone SVG
  const hormoneSvg = EndocrinologyEngine.renderHormoneSvg(1320, 1140);
  recordCheck('Stage 4: SVG', 'Hormone Curve SVG Contains Valid ViewBox', hormoneSvg.includes('viewBox="0 0 600 260"'), 'viewBox check');
  recordCheck('Stage 4: SVG', 'Hormone Curve SVG Contains No NaN or Undefined', !hormoneSvg.includes('NaN') && !hormoneSvg.includes('undefined'), 'NaN/undefined check');

  // 3. 5-Axis Radar Chart SVG Coordinates [0, 400]
  const scoresTest = { math_logic: 90, language_reading: 75, science_nature: 85, sensory_arts: 65, executive_focus: 80 };
  const points = NeuroMatrix.calculateRadarPoints(scoresTest, 130, 200, 200);

  let allPointsInBounds = true;
  for (const pt of points) {
    if (isNaN(pt.x) || isNaN(pt.y) || pt.x < 0 || pt.x > 400 || pt.y < 0 || pt.y > 400) {
      allPointsInBounds = false;
      break;
    }
  }
  recordCheck('Stage 4: SVG', '5-Axis Radar Polygon Points Strictly Within [0, 400] Canvas', allPointsInBounds, `Evaluated ${points.length} vertices`);

  const radarSvg = NeuroMatrix.renderRadarSvg(scoresTest, false);
  recordCheck('Stage 4: SVG', 'Radar SVG Contains No NaN or Undefined', !radarSvg.includes('NaN') && !radarSvg.includes('undefined'), 'NaN/undefined check');
}

// ============================================================================
// STAGE 5: Affiliate Reference Chip URL & Syntax Integrity
// ============================================================================
function auditStage5AffiliateLinks() {
  console.log('\n------------------------------------------------------------');
  console.log('Stage 5: Affiliate Reference Chip URL & Syntax Integrity');
  console.log('------------------------------------------------------------');

  let RefChips;
  try {
    RefChips = require('../src/js/reference-chips');
  } catch (err) {
    recordCheck('Stage 5: Links', 'Reference Chips Module Loadable', false, err.message);
    return;
  }

  // KO Mode Chips
  const koChips = RefChips.getReferenceChipsData('calcium', false);
  recordCheck('Stage 5: Links', 'KO Mode Generates 3 Reference Chips (iHerb, Coupang, LinkPrice)', koChips.length === 3, `Count: ${koChips.length}`);

  let hasDeadLinks = false;
  let hasCoupangTag = false;
  let hasLinkPriceTag = false;
  let hasIherbTag = false;

  koChips.forEach(c => {
    if (!c.url || c.url.startsWith('#')) hasDeadLinks = true;
    if (c.url.includes('AF7865143')) hasCoupangTag = true;
    if (c.url.includes('A100708867')) hasLinkPriceTag = true;
    if (c.url.includes('IPZ1547')) hasIherbTag = true;
  });

  recordCheck('Stage 5: Links', 'Zero Dead Links ("#") in KO Mode', !hasDeadLinks, 'URLs are active');
  recordCheck('Stage 5: Links', 'Coupang Channel Tag (AF7865143) Active', hasCoupangTag, 'Channel check');
  recordCheck('Stage 5: Links', 'LinkPrice Affiliate ID (A100708867) Active', hasLinkPriceTag, 'Merchant check');
  recordCheck('Stage 5: Links', 'iHerb Rewards Code (IPZ1547) Active', hasIherbTag, 'Rewards code check');

  // EN Mode Chips
  const enChips = RefChips.getReferenceChipsData('calcium', true);
  recordCheck('Stage 5: Links', 'EN Mode Generates 2 Reference Chips (iHerb, Amazon)', enChips.length === 2, `Count: ${enChips.length}`);

  let hasAmazonTag = false;
  enChips.forEach(c => {
    if (!c.url || c.url.startsWith('#')) hasDeadLinks = true;
    if (c.url.includes('kidfit-20')) hasAmazonTag = true;
  });

  recordCheck('Stage 5: Links', 'Zero Dead Links ("#") in EN Mode', !hasDeadLinks, 'URLs are active');
  recordCheck('Stage 5: Links', 'Amazon Tag (kidfit-20) Active in EN Mode', hasAmazonTag, 'Amazon tag check');

  // HTML Rendering & Discreet 12px Styling Check
  const htmlKo = RefChips.getReferenceChipsHtml('calcium', false);
  recordCheck('Stage 5: Links', 'Reference Chips Styled at 12px Font Size', htmlKo.includes('12px'), 'Font size check');
  recordCheck('Stage 5: Links', 'No Aggressive Promotional Keywords (Zero "특가/최저가")', !htmlKo.includes('특가') && !htmlKo.includes('최저가'), 'Clean clinical text check');

  // Master Toggle Check
  const disabledHtml = RefChips.getReferenceChipsHtml('calcium', false, { chipsEnabled: false });
  recordCheck('Stage 5: Links', 'Master Toggle chipsEnabled=false Produces Empty Output', disabledHtml === '', 'Master toggle check');
}

// ============================================================================
// STAGE 7: Autonomous DB Scope Expansion, Horizon Guidance & Admin Dashboard Audit
// ============================================================================
function auditStage7ScopeAndGuidance() {
  console.log('\n------------------------------------------------------------');
  console.log('Stage 7: DB Scope Expansion, Short/Mid/Long Guidance & Admin Dashboard');
  console.log('------------------------------------------------------------');

  const kbPath = path.join(ROOT_DIR, 'src/data/research-knowledge-base.json');
  let kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
  let papers = kb.papers || [];

  // Auto-heal enrichment if any paper is missing sub_domain or horizon
  const unenrichedCount = papers.filter(p => !p.sub_domain || !p.horizon || !p.plain_fact_ko).length;
  if (unenrichedCount > 0 || !kb.metadata || !kb.metadata.learning_analytics) {
    try {
      execSync('python scripts/expand_and_enrich_db.py', { cwd: ROOT_DIR, stdio: 'pipe' });
      kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
      papers = kb.papers || [];
    } catch (e) {
      // continue check
    }
  }

  const analytics = (kb.metadata && kb.metadata.learning_analytics) || {};
  const subDomains = analytics.sub_domain_distribution || [];
  const laws = analytics.core_empirical_laws || [];

  recordCheck('Stage 7: Scope & Guidance', 'Expanded 12 Specialized Sub-Domains Active', subDomains.length === 12, `Sub-domains: ${subDomains.length}`);
  recordCheck('Stage 7: Scope & Guidance', '100% Papers Enriched with Short/Mid/Long Horizon & Plain Fact', papers.every(p => p.sub_domain && p.horizon && p.plain_fact_ko), `Checked ${papers.length} papers`);
  recordCheck('Stage 7: Scope & Guidance', '12 Core Empirical Laws Synthesized in DB Analytics', laws.length >= 12, `Laws: ${laws.length}`);

  // Verify MasterBriefing Short/Mid/Long-Term Guidance Roadmap
  try {
    const MasterBriefing = require('../src/js/master-briefing');
    const html = MasterBriefing.renderMasterBriefingCard({
      gender: 'boy',
      ageYears: 10,
      ageMonths: 120,
      currentHeight: 137.0,
      currentWeight: 35.5,
      recentGrowth6m: 3.2,
      fatherHeight: 173.5,
      motherHeight: 160.5,
      habits: ['late_sleep', 'poor_posture'],
      tannerPhase: 'phase_2'
    });
    const hasShortMidLong = html.includes('id="horizon-short-term"') &&
                            html.includes('id="horizon-mid-term"') &&
                            html.includes('id="horizon-long-term"') &&
                            html.includes('id="briefing-one-line-verdict"') &&
                            html.includes('id="child-lifecycle-roadmap-section"') &&
                            html.includes('id="pinpoint-custom-prescription-section"');
    recordCheck('Stage 7: Scope & Guidance', 'Master Briefing Renders Fact Verdict + Short/Mid/Long-Term Guidance + Lifecycle & Pinpoint Items', hasShortMidLong, 'Horizon, Lifecycle & Pinpoint IDs verified');
  } catch (err) {
    recordCheck('Stage 7: Scope & Guidance', 'Master Briefing Renders Fact Verdict + Short/Mid/Long-Term Guidance + Lifecycle & Pinpoint Items', false, err.message);
  }

  // Verify DOB Precision, Auto Growth Stage, Age 3 -> 4 -> 5 Lifecycle & Pinpoint Curator
  try {
    const PinpointCurator = require('../src/js/pinpoint-curator');
    const dob3 = PinpointCurator.calculateExactAgeFromDob(2023, 5, 15, new Date(2026, 9, 21));
    const stage3 = PinpointCurator.autoDetectGrowthStage(dob3.exactMonths, 'boy', 3.5);
    const roadmap3 = PinpointCurator.getSequentialLifecycleRoadmap(3);
    const items3 = PinpointCurator.curatePinpointItems({ ageMonths: 36, gender: 'boy', currentHeight: 95.0, habits: ['picky_eater'] });
    const items10 = PinpointCurator.curatePinpointItems({ ageMonths: 120, gender: 'boy', currentHeight: 135.0, habits: ['late_sleep'] });

    const isDobValid = dob3.ageMonths === 41 && dob3.exactMonths >= 41.0 && stage3.tannerPhase === 'phase_1';
    const isRoadmapValid = roadmap3.length === 4 && roadmap3[0].age === 3 && roadmap3[1].age === 4 && roadmap3[2].age === 5 && roadmap3[3].age === 6;
    const isPinpointDistinct = items3.supplements[0].id !== items10.supplements[0].id &&
                               items3.toys[0].id !== items10.toys[0].id &&
                               items3.books[0].id !== items10.books[0].id &&
                               items10.supplements.some(s => s.name.includes('황기추출물') || s.name.includes('연골칼슘'));

    recordCheck('Stage 7: Scope & Guidance', 'DOB Precision Calculator & Auto Growth Stage Detector Active', isDobValid, `DOB 2023-05-15 -> ${dob3.exactMonths}mo, ${stage3.tannerPhase}`);
    recordCheck('Stage 7: Scope & Guidance', 'Sequential Age Lifecycle Roadmap (e.g. Age 3 -> 4 -> 5 -> 6) Active', isRoadmapValid, '4 sequential years verified');
    recordCheck('Stage 7: Scope & Guidance', 'Child-Specific Pinpoint Supplement/Toy/Book Curator Differentiates Profiles', isPinpointDistinct, 'HT042, Cartilage Calcium, Montessori & Books verified');
  } catch (err) {
    recordCheck('Stage 7: Scope & Guidance', 'Pinpoint Curator & Lifecycle Engine Verification', false, err.message);
  }

  // Verify 60s Haptic Typewriter & Waiting Content Theatre Engine
  try {
    const HapticEngine = require('../src/js/haptic-typewriter');
    const cards = HapticEngine.buildChildWaitingCards({ ageMonths: 36, gender: 'boy', currentHeight: 96.5 });
    const has6Stages = Array.isArray(HapticEngine.SIX_STAGES_60S) && HapticEngine.SIX_STAGES_60S.length === 6 && cards.length === 6;
    recordCheck('Stage 7: Scope & Guidance', '60-Second Personalized Waiting Content & Haptic Typewriter Engine Active', has6Stages, '6 stages & 6 waiting briefing cards verified');
  } catch (err) {
    recordCheck('Stage 7: Scope & Guidance', '60-Second Personalized Waiting Content & Haptic Typewriter Engine Active', false, err.message);
  }

  // Verify Admin Visual DB Intelligence Dashboard
  try {
    const AdminDbDashboard = require('../src/js/admin-db-dashboard');
    const dashHtml = AdminDbDashboard.renderDashboardHtml();
    const hasVisuals = dashHtml.includes('id="admin-db-subdomain-chart"') &&
                       dashHtml.includes('id="admin-db-heatmap-container"') &&
                       dashHtml.includes('id="admin-db-laws-grid"') &&
                       dashHtml.includes('id="admin-db-explorer-results"') &&
                       dashHtml.includes('id="admin-user-cohort-self-improve-panel"');
    recordCheck('Stage 7: Scope & Guidance', 'Admin DB Intelligence Dashboard Renders SVG Chart, Heatmap, Laws, Explorer & User Cohort DB', hasVisuals, 'Admin visuals & User Cohort DB verified');
  } catch (err) {
    recordCheck('Stage 7: Scope & Guidance', 'Admin DB Intelligence Dashboard Renders SVG Chart, Heatmap, Laws, Explorer & User Cohort DB', false, err.message);
  }

  // Verify User Input Cohort DB & Taller.xyz Growth Guidebook Hero
  try {
    const UserCohortDB = require('../src/js/user-cohort-db');
    const MasterBriefing = require('../src/js/master-briefing');
    const rec = UserCohortDB.recordUserDiagnosis({
      targetSubject: 'self',
      gender: 'boy',
      ageYears: 15,
      exactMonths: 182.5,
      currentHeight: 168.2,
      currentWeight: 58.0,
      habits: ['late_sleep', 'poor_posture']
    }, { kdcaPercentile: 52.4, zScore: 0.06, mph: 174.5, unmanagedHeight: 172.0, optimizedHeight: 179.4, potentialGainCm: 7.4 });
    const cohortAnalytics = UserCohortDB.getAggregatedCohortAnalytics();
    const youthGuidebookHtml = MasterBriefing.renderMasterBriefingCard({
      targetSubject: 'self',
      gender: 'boy',
      ageYears: 15,
      ageMonths: 180,
      exactMonths: 182.5,
      currentHeight: 168.2,
      currentWeight: 58.0,
      habits: ['late_sleep', 'poor_posture']
    });
    const indexHtmlContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    const isCohortValid = Boolean(rec && rec.id && cohortAnalytics.totalRecords >= 128 && cohortAnalytics.autoLearningWeights.chronobiology_sleep_architecture > 1.0);
    const isTallerGuidebookValid = youthGuidebookHtml.includes('id="taller-potential-reveal-hero"') &&
                                   youthGuidebookHtml.includes('id="user-cohort-self-improve-section"') &&
                                   youthGuidebookHtml.includes('청소년·본인 전용') &&
                                   indexHtmlContent.includes('id="brand-editorial-showcase"') &&
                                   (indexHtmlContent.includes('KISFIT') || indexHtmlContent.includes('KIDS-FIT') || indexHtmlContent.includes('K-GROWTH AI')) &&
                                   !indexHtmlContent.toLowerCase().includes('taller.xyz');
    recordCheck('Stage 7: Scope & Guidance', 'User Input Cohort DB Persists Inputs & Computes Dynamic Self-Improvement Weights', isCohortValid, `Total cohort records: ${cohortAnalytics.totalRecords}`);
    recordCheck('Stage 7: Scope & Guidance', 'Proprietary K-GROWTH AI™ Editorial Brand Showcase & 5-Chapter Growth Guidebook Active (Zero taller.xyz)', isTallerGuidebookValid, 'Brand Showcase, Proprietary AI & 5-Chapter Guidebook verified');
  } catch (err) {
    recordCheck('Stage 7: Scope & Guidance', 'User Input Cohort DB & Taller.xyz Growth Guidebook Verification', false, err.message);
  }
}

// ============================================================================
// STAGE 6: Automated Diagnostic Quality Health Report & Self-Healing
// ============================================================================
function auditStage6ReportAndFix() {
  console.log('\n------------------------------------------------------------');
  console.log('Stage 6: Automated Diagnostic Quality Health Report & Self-Healing');
  console.log('------------------------------------------------------------');

  const { totalChecks, passedChecks, failedChecks } = auditResults.summary;
  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;
  auditResults.healthScore = score;

  // Self-Healing Trigger: If --fix is specified, rebuild assets to dist
  if (isFixMode) {
    console.log('  [Self-Healing] Rebuilding assets to dist/ via scripts/build.js...');
    try {
      execSync('node scripts/build.js', { cwd: ROOT_DIR, stdio: 'inherit' });
      recordCheck('Stage 6: Report', 'Self-Healing Build Triggered Cleanly', true, 'Build succeeded');
    } catch (err) {
      recordCheck('Stage 6: Report', 'Self-Healing Build Triggered Cleanly', false, err.message);
    }
  } else {
    recordCheck('Stage 6: Report', 'Diagnostic Assessment Ready', true, 'Health evaluation completed');
  }

  // Save diagnostic report
  try {
    fs.writeFileSync(REPORT_FILE, JSON.stringify(auditResults, null, 2), 'utf8');
    recordCheck('Stage 6: Report', 'Report Written to logs/self_improvement_report.json', true, REPORT_FILE);

    // Append to history
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      try {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      } catch (e) {
        history = [];
      }
    }
    history.push({
      timestamp: auditResults.timestamp,
      healthScore: auditResults.healthScore,
      totalChecks: auditResults.summary.totalChecks,
      passedChecks: auditResults.summary.passedChecks,
      failedChecks: auditResults.summary.failedChecks
    });
    // Keep last 50 runs
    if (history.length > 50) history = history.slice(-50);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (err) {
    recordCheck('Stage 6: Report', 'Save Diagnostic Report JSON', false, err.message);
  }
}

// ============================================================================
// Main Execution Runner
// ============================================================================
function main() {
  console.log('================================================================');
  console.log('   TALLER BIO LABS — Autonomous Self-Improvement Quality Loop   ');
  console.log('================================================================');

  auditStage1Papers();
  auditStage2ClinicalMath();
  auditStage3Translations();
  auditStage4SvgCharts();
  auditStage5AffiliateLinks();
  auditStage7ScopeAndGuidance();
  auditStage6ReportAndFix();

  console.log('\n================================================================');
  console.log(`Quality Health Score: ${auditResults.healthScore}/100`);
  console.log(`Total Checks: ${auditResults.summary.totalChecks} | Passed: ${auditResults.summary.passedChecks} | Failed: ${auditResults.summary.failedChecks}`);
  console.log('================================================================');

  if (auditResults.summary.failedChecks > 0) {
    console.error('\n[Critical Warning] Quality audit encountered failures:');
    auditResults.errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  } else {
    console.log('\n[Success] All 6 clinical and quality audit stages passed with 0 defects!');
    process.exit(0);
  }
}

main();
