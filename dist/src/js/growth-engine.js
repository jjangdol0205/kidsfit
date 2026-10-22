/**
 * Taller Bio Labs - Auxology & Skeletal Maturation Engine (src/js/growth-engine.js)
 * Implements Core 1:
 * - US CDC 2000 & KDCA 2017 LMS Box-Cox Z-Score & erf normal CDF percentiles (Height, Weight, BMI)
 * - Tanner Mid-Parental Height (MPH +/- 8.5cm)
 * - Annualized Growth Velocity (cm/yr) with < 4.0 cm/yr pediatric red-flag alert
 * - 3 Adult Predicted Height Trajectories (Genetic baseline, Unmanaged -5cm cap, Optimized +5~+9.2cm)
 * - Interactive 3-curve SVG chart with tooltips, percentile bands (P3, P50, P97), and pulse dot
 */

(function (global) {
  'use strict';

  // 1. Data Loader (Node.js require or Browser global/embedded)
  let growthData = null;
  let authoritiesData = null;
  let researchData = null;

  if (typeof require !== 'undefined') {
    try {
      growthData = require('../data/growth-standards.json');
    } catch (e) {}
    try {
      authoritiesData = require('../data/official-authorities.json');
    } catch (e) {}
    try {
      researchData = require('../data/research-knowledge-base.json');
    } catch (e) {}
  }
  if (!growthData && typeof window !== 'undefined' && window.KIDSFIT_GROWTH_DATA) {
    growthData = window.KIDSFIT_GROWTH_DATA;
  }
  if (!authoritiesData && typeof window !== 'undefined' && window.KIDSFIT_AUTHORITIES_DATA) {
    authoritiesData = window.KIDSFIT_AUTHORITIES_DATA;
  }
  if (!researchData && typeof window !== 'undefined' && window.KIDSFIT_RESEARCH_DATA) {
    researchData = window.KIDSFIT_RESEARCH_DATA;
  }

  // Fallback table for standalone operation
  const FALLBACK_KDCA = {
    boy: [
      { m: 12, L: 1.0, M: 75.7, S: 0.0337, p3: 71.0, p50: 75.7, p97: 80.5, wM: 9.8, wS: 0.102, bmiP5: 14.5, bmiP50: 17.0, bmiP85: 18.8, bmiP95: 19.8 },
      { m: 24, L: 1.0, M: 87.1, S: 0.0371, p3: 81.0, p50: 87.1, p97: 93.2, wM: 12.3, wS: 0.107, bmiP5: 14.0, bmiP50: 16.2, bmiP85: 17.8, bmiP95: 18.8 },
      { m: 36, L: 1.0, M: 96.5, S: 0.0401, p3: 89.7, p50: 96.5, p97: 104.4, wM: 14.7, wS: 0.115, bmiP5: 13.8, bmiP50: 15.8, bmiP85: 17.4, bmiP95: 18.4 },
      { m: 48, L: 1.0, M: 103.1, S: 0.0416, p3: 95.6, p50: 103.1, p97: 111.2, wM: 16.7, wS: 0.124, bmiP5: 13.6, bmiP50: 15.7, bmiP85: 17.3, bmiP95: 18.5 },
      { m: 60, L: 1.0, M: 109.6, S: 0.0429, p3: 101.6, p50: 109.6, p97: 118.0, wM: 19.0, wS: 0.136, bmiP5: 13.6, bmiP50: 15.8, bmiP85: 17.6, bmiP95: 19.0 },
      { m: 72, L: 1.0, M: 115.5, S: 0.0441, p3: 106.7, p50: 115.5, p97: 124.5, wM: 21.5, wS: 0.149, bmiP5: 13.7, bmiP50: 16.0, bmiP85: 18.1, bmiP95: 19.8 },
      { m: 84, L: 1.0, M: 121.1, S: 0.0453, p3: 111.5, p50: 121.1, p97: 130.9, wM: 24.4, wS: 0.163, bmiP5: 13.9, bmiP50: 16.5, bmiP85: 19.0, bmiP95: 21.0 },
      { m: 96, L: 1.0, M: 126.5, S: 0.0468, p3: 116.0, p50: 126.5, p97: 137.1, wM: 27.6, wS: 0.175, bmiP5: 14.1, bmiP50: 17.1, bmiP85: 20.0, bmiP95: 22.3 },
      { m: 108, L: 1.0, M: 131.7, S: 0.0483, p3: 120.3, p50: 131.7, p97: 143.3, wM: 31.3, wS: 0.184, bmiP5: 14.4, bmiP50: 17.8, bmiP85: 21.1, bmiP95: 23.6 },
      { m: 120, L: 1.0, M: 137.0, S: 0.0498, p3: 124.5, p50: 137.0, p97: 149.7, wM: 35.5, wS: 0.190, bmiP5: 14.8, bmiP50: 18.6, bmiP85: 22.1, bmiP95: 24.8 },
      { m: 132, L: 1.0, M: 142.5, S: 0.0521, p3: 128.8, p50: 142.5, p97: 156.4, wM: 40.2, wS: 0.193, bmiP5: 15.2, bmiP50: 19.4, bmiP85: 23.0, bmiP95: 25.8 },
      { m: 144, L: 1.0, M: 148.7, S: 0.0545, p3: 133.5, p50: 148.7, p97: 163.9, wM: 45.4, wS: 0.191, bmiP5: 15.7, bmiP50: 20.1, bmiP85: 23.8, bmiP95: 26.6 },
      { m: 156, L: 1.0, M: 155.6, S: 0.0558, p3: 138.9, p50: 155.6, p97: 171.9, wM: 51.0, wS: 0.185, bmiP5: 16.3, bmiP50: 20.8, bmiP85: 24.4, bmiP95: 27.2 },
      { m: 168, L: 1.0, M: 162.4, S: 0.0560, p3: 145.1, p50: 162.4, p97: 179.5, wM: 56.5, wS: 0.176, bmiP5: 16.9, bmiP50: 21.3, bmiP85: 24.9, bmiP95: 27.6 },
      { m: 180, L: 1.0, M: 167.4, S: 0.0489, p3: 151.3, p50: 167.4, p97: 182.2, wM: 61.0, wS: 0.168, bmiP5: 17.4, bmiP50: 21.7, bmiP85: 25.2, bmiP95: 27.9 },
      { m: 192, L: 1.0, M: 170.0, S: 0.0441, p3: 155.7, p50: 170.0, p97: 184.1, wM: 63.8, wS: 0.162, bmiP5: 17.8, bmiP50: 22.0, bmiP85: 25.4, bmiP95: 28.0 },
      { m: 204, L: 1.0, M: 171.4, S: 0.0436, p3: 157.9, p50: 171.4, p97: 185.5, wM: 65.3, wS: 0.158, bmiP5: 18.1, bmiP50: 22.2, bmiP85: 25.5, bmiP95: 28.1 },
      { m: 216, L: 1.0, M: 172.0, S: 0.0430, p3: 158.6, p50: 172.0, p97: 185.8, wM: 66.2, wS: 0.155, bmiP5: 18.3, bmiP50: 22.4, bmiP85: 25.6, bmiP95: 28.2 },
      { m: 240, L: 1.0, M: 172.0, S: 0.0430, p3: 158.8, p50: 172.0, p97: 186.0, wM: 67.2, wS: 0.152, bmiP5: 18.6, bmiP50: 22.6, bmiP85: 25.8, bmiP95: 28.4 }
    ],
    girl: [
      { m: 12, L: 1.0, M: 74.0, S: 0.0349, p3: 69.2, p50: 74.0, p97: 78.9, wM: 9.2, wS: 0.105, bmiP5: 14.1, bmiP50: 16.6, bmiP85: 18.4, bmiP95: 19.4 },
      { m: 24, L: 1.0, M: 85.7, S: 0.0384, p3: 79.3, p50: 85.7, p97: 92.1, wM: 11.7, wS: 0.111, bmiP5: 13.7, bmiP50: 15.9, bmiP85: 17.5, bmiP95: 18.5 },
      { m: 36, L: 1.0, M: 95.4, S: 0.0409, p3: 88.1, p50: 95.4, p97: 103.0, wM: 14.1, wS: 0.119, bmiP5: 13.5, bmiP50: 15.5, bmiP85: 17.2, bmiP95: 18.2 },
      { m: 48, L: 1.0, M: 102.2, S: 0.0422, p3: 94.4, p50: 102.2, p97: 110.1, wM: 16.1, wS: 0.129, bmiP5: 13.4, bmiP50: 15.4, bmiP85: 17.2, bmiP95: 18.4 },
      { m: 60, L: 1.0, M: 108.4, S: 0.0435, p3: 99.9, p50: 108.4, p97: 117.0, wM: 18.3, wS: 0.141, bmiP5: 13.4, bmiP50: 15.5, bmiP85: 17.4, bmiP95: 18.8 },
      { m: 72, L: 1.0, M: 114.7, S: 0.0445, p3: 106.6, p50: 114.7, p97: 123.3, wM: 20.8, wS: 0.153, bmiP5: 13.5, bmiP50: 15.7, bmiP85: 17.8, bmiP95: 19.4 },
      { m: 84, L: 1.0, M: 120.8, S: 0.0460, p3: 112.2, p50: 120.8, p97: 130.2, wM: 23.6, wS: 0.165, bmiP5: 13.6, bmiP50: 16.1, bmiP85: 18.5, bmiP95: 20.3 },
      { m: 96, L: 1.0, M: 126.7, S: 0.0478, p3: 117.5, p50: 126.7, p97: 137.1, wM: 26.8, wS: 0.175, bmiP5: 13.8, bmiP50: 16.6, bmiP85: 19.3, bmiP95: 21.3 },
      { m: 108, L: 1.0, M: 132.6, S: 0.0501, p3: 122.8, p50: 132.6, p97: 144.1, wM: 30.5, wS: 0.183, bmiP5: 14.1, bmiP50: 17.2, bmiP85: 20.2, bmiP95: 22.3 },
      { m: 120, L: 1.0, M: 139.1, S: 0.0526, p3: 128.2, p50: 139.1, p97: 151.2, wM: 34.8, wS: 0.187, bmiP5: 14.5, bmiP50: 17.9, bmiP85: 21.1, bmiP95: 23.3 },
      { m: 132, L: 1.0, M: 145.8, S: 0.0532, p3: 133.8, p50: 145.8, p97: 157.6, wM: 39.7, wS: 0.186, bmiP5: 15.0, bmiP50: 18.6, bmiP85: 21.9, bmiP95: 24.2 },
      { m: 144, L: 1.0, M: 151.7, S: 0.0494, p3: 139.5, p50: 151.7, p97: 162.6, wM: 44.5, wS: 0.180, bmiP5: 15.5, bmiP50: 19.3, bmiP85: 22.6, bmiP95: 24.9 },
      { m: 156, L: 1.0, M: 155.9, S: 0.0438, p3: 144.7, p50: 155.9, p97: 166.0, wM: 48.6, wS: 0.171, bmiP5: 16.1, bmiP50: 19.9, bmiP85: 23.2, bmiP95: 25.5 },
      { m: 168, L: 1.0, M: 158.3, S: 0.0416, p3: 147.9, p50: 158.3, p97: 168.1, wM: 51.5, wS: 0.162, bmiP5: 16.6, bmiP50: 20.4, bmiP85: 23.6, bmiP95: 25.9 },
      { m: 180, L: 1.0, M: 159.5, S: 0.0408, p3: 149.3, p50: 159.5, p97: 169.2, wM: 53.2, wS: 0.155, bmiP5: 17.0, bmiP50: 20.8, bmiP85: 23.9, bmiP95: 26.2 },
      { m: 192, L: 1.0, M: 160.0, S: 0.0403, p3: 150.3, p50: 160.0, p97: 169.8, wM: 54.1, wS: 0.150, bmiP5: 17.2, bmiP50: 21.0, bmiP85: 24.1, bmiP95: 26.3 },
      { m: 204, L: 1.0, M: 160.2, S: 0.0400, p3: 151.0, p50: 160.2, p97: 170.1, wM: 54.5, wS: 0.147, bmiP5: 17.4, bmiP50: 21.1, bmiP85: 24.2, bmiP95: 26.4 },
      { m: 216, L: 1.0, M: 160.3, S: 0.0398, p3: 151.2, p50: 160.3, p97: 170.2, wM: 54.7, wS: 0.145, bmiP5: 17.5, bmiP50: 21.2, bmiP85: 24.3, bmiP95: 26.5 },
      { m: 240, L: 1.0, M: 160.5, S: 0.0395, p3: 151.4, p50: 160.5, p97: 170.4, wM: 55.0, wS: 0.143, bmiP5: 17.7, bmiP50: 21.4, bmiP85: 24.5, bmiP95: 26.7 }
    ]
  };

  function normalizeSex(sex) {
    if (!sex) return 'boy';
    const s = String(sex).toLowerCase();
    if (s.startsWith('g') || s.startsWith('f')) return 'girl';
    return 'boy';
  }

  function getStandardsTable(sex, standard = 'KDCA') {
    if (!growthData && typeof window !== 'undefined' && window.KIDSFIT_GROWTH_DATA) {
      growthData = window.KIDSFIT_GROWTH_DATA;
    }
    const s = normalizeSex(sex);
    const isCdc = String(standard).toUpperCase().includes('CDC');

    if (growthData) {
      if (isCdc) {
        if (growthData[`cdc_${s}`]) return growthData[`cdc_${s}`];
        if (growthData.cdc && growthData.cdc[s]) return growthData.cdc[s];
      }
      if (growthData[s]) return growthData[s];
    }
    return FALLBACK_KDCA[s] || FALLBACK_KDCA.boy;
  }

  // 2. Numerical Approximation of Error Function erf(x) & Normal CDF
  function erf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return sign * y;
  }

  function normalCDF(z) {
    if (z === Infinity) return 1.0;
    if (z === -Infinity) return 0.0;
    return 0.5 * (1.0 + erf(z / Math.SQRT2));
  }

  // 3. Interpolate LMS for any arbitrary month (12~240)
  function getLmsForMonth(sex, months, standard = 'KDCA') {
    const table = getStandardsTable(sex, standard);
    const clampedM = Math.max(12, Math.min(240, Number(months) || 120));

    if (clampedM <= table[0].m) return table[0];
    if (clampedM >= table[table.length - 1].m) return table[table.length - 1];

    for (let i = 0; i < table.length - 1; i++) {
      const r1 = table[i];
      const r2 = table[i + 1];
      if (clampedM >= r1.m && clampedM <= r2.m) {
        const alpha = (clampedM - r1.m) / (r2.m - r1.m);
        return {
          m: clampedM,
          L: (1 - alpha) * (r1.L !== undefined ? r1.L : 1.0) + alpha * (r2.L !== undefined ? r2.L : 1.0),
          M: Math.round(((1 - alpha) * r1.M + alpha * r2.M) * 10) / 10,
          S: (1 - alpha) * r1.S + alpha * r2.S,
          p3: Math.round(((1 - alpha) * r1.p3 + alpha * r2.p3) * 10) / 10,
          p50: Math.round(((1 - alpha) * r1.p50 + alpha * r2.p50) * 10) / 10,
          p97: Math.round(((1 - alpha) * r1.p97 + alpha * r2.p97) * 10) / 10,
          wM: Math.round(((1 - alpha) * (r1.wM || 16.5) + alpha * (r2.wM || 16.5)) * 10) / 10,
          wS: (1 - alpha) * (r1.wS || 0.13) + alpha * (r2.wS || 0.13),
          bmiP5: (1 - alpha) * (r1.bmiP5 || 13.8) + alpha * (r2.bmiP5 || 13.8),
          bmiP50: (1 - alpha) * (r1.bmiP50 || 16.0) + alpha * (r2.bmiP50 || 16.0),
          bmiP85: (1 - alpha) * (r1.bmiP85 || 18.0) + alpha * (r2.bmiP85 || 18.0),
          bmiP95: (1 - alpha) * (r1.bmiP95 || 19.5) + alpha * (r2.bmiP95 || 19.5)
        };
      }
    }
    return table[0];
  }

  // 4. Box-Cox LMS Z-Score & Percentile Engine
  function calculateLMSZScore(measure, ageMonths, sex, type = 'height', standard = 'KDCA') {
    const val = Number(measure) || 0;
    const stdName = String(standard).toUpperCase().includes('CDC') ? 'CDC 2000' : 'KDCA 2017';
    if (val <= 0) {
      return { zScore: 0.0, percentile: 50.0, standard: stdName };
    }

    const lms = getLmsForMonth(sex, ageMonths, standard);
    let L = lms.L !== undefined ? lms.L : 1.0;
    let M = lms.M;
    let S = lms.S;

    if (type === 'weight' || type === 'w') {
      L = 1.0;
      M = lms.wM || 16.5;
      S = lms.wS || 0.13;
    } else if (type === 'bmi') {
      L = 1.0;
      M = lms.bmiP50 || 16.0;
      S = 0.11;
    }

    let z;
    if (Math.abs(L) <= 0.0001) {
      z = Math.log(val / M) / S;
    } else {
      z = (Math.pow(val / M, L) - 1.0) / (L * S);
    }

    const rawP = normalCDF(z) * 100.0;
    const percentile = Math.min(99.9, Math.max(0.1, Math.round(rawP * 10) / 10));

    return {
      zScore: Math.round(z * 100) / 100,
      percentile,
      standard: stdName
    };
  }

  // KDCA LMS Percentile Calculator (Backward compatible)
  function calculateKdcaPercentile(val, L, M, S) {
    const v = Number(val) || 0;
    if (v <= 0 || !M || !S) {
      return { zScore: 0, percentile: 50.0, topPercent: 50.0, deltaMedian: 0 };
    }
    let z;
    if (Math.abs(L) <= 0.0001) {
      z = Math.log(v / M) / S;
    } else {
      z = (Math.pow(v / M, L) - 1.0) / (L * S);
    }
    const rawP = normalCDF(z) * 100.0;
    const percentile = Math.min(99.9, Math.max(0.1, Math.round(rawP * 10) / 10));
    const topPercent = Math.round((100.0 - percentile) * 10) / 10;
    const deltaMedian = Math.round((v - M) * 10) / 10;
    return {
      zScore: Math.round(z * 100) / 100,
      percentile,
      topPercent,
      deltaMedian
    };
  }

  // 4-1. KDCA Weight & BMI Status Evaluator
  function evaluateWeightAndBmi(heightCm, weightKg, lms) {
    const hMeter = Math.max(0.5, (heightCm || 100) / 100.0);
    const wKg = Math.max(5.0, weightKg || lms.wM || 16.5);
    const bmi = Math.round((wKg / (hMeter * hMeter)) * 10) / 10;
    const wPct = calculateKdcaPercentile(wKg, 1.0, lms.wM || 16.5, lms.wS || 0.13);

    let bmiStatus = '표준 균형 체형 (정상 5~84백분위)';
    let bmiNote = '현재 키 대비 체중 밸런스가 이상적입니다. 근육과 골격 성장을 위한 양질의 단백질 섭취를 유지해주세요.';
    let bmiBadgeColor = '#059669';

    if (bmi < (lms.bmiP5 || 13.6)) {
      bmiStatus = '저체중 주의 (<5백분위)';
      bmiNote = '또래 대비 체중과 열량 비축이 부족합니다. 키 성장의 재료가 되는 단백질·아연·철분 보강이 우선입니다.';
      bmiBadgeColor = '#D97706';
    } else if (bmi >= (lms.bmiP95 || 19.5)) {
      bmiStatus = '소아비만·성조숙 주의 (≥95백분위)';
      bmiNote = '과도한 체지방(렙틴 호르몬)은 사춘기 신호와 성장판 골화를 앞당길 수 있습니다. 정제 탄수화물을 줄이고 점프·유산소 운동을 늘려주세요.';
      bmiBadgeColor = '#E11D48';
    } else if (bmi >= (lms.bmiP85 || 17.8)) {
      bmiStatus = '과체중 경계 (85~94백분위)';
      bmiNote = '체중 증가 속도가 키 성장 속도보다 빠르지 않도록 야식과 액상과당 음료를 조절해주세요.';
      bmiBadgeColor = '#D97706';
    }

    return {
      bmi,
      weightPercentile: wPct.percentile,
      weightDelta: wPct.deltaMedian,
      bmiStatus,
      bmiNote,
      bmiBadgeColor
    };
  }

  // 5. Tanner Mid-Parental Height (MPH) Formula
  function calculateMPH(fatherHeight, motherHeight, sex) {
    const f = Number(fatherHeight) > 0 ? Number(fatherHeight) : 173.5;
    const m = Number(motherHeight) > 0 ? Number(motherHeight) : 161.0;
    const isBoy = normalizeSex(sex) === 'boy';
    const delta = isBoy ? 13.0 : -13.0;
    const mph = (f + m + delta) / 2.0;
    const roundedMph = Math.round(mph * 10) / 10;
    const min = Math.round((mph - 8.5) * 10) / 10;
    const max = Math.round((mph + 8.5) * 10) / 10;

    return {
      mph: roundedMph,
      min,
      max,
      margin: 8.5,
      rangeStr: `${min}cm ~ ${max}cm`
    };
  }

  function calculateMph(fatherHeight, motherHeight, gender) {
    return calculateMPH(fatherHeight, motherHeight, gender).mph;
  }

  // 6. Annual Growth Velocity Engine
  function calculateVelocity(currentHeight, previousHeightOrAge, monthsDiff = 6) {
    let velocity;
    let age = 7;

    if (monthsDiff === 6 && typeof previousHeightOrAge === 'number' && previousHeightOrAge < 30) {
      // (recentGain6m, ageYears) signature
      velocity = Math.round(Number(currentHeight || 0) * 2 * 10) / 10;
      age = previousHeightOrAge;
    } else if (typeof previousHeightOrAge === 'number' && previousHeightOrAge > 30) {
      // (currentHeight, previousHeight, monthsDiff) signature
      const mDiff = monthsDiff > 0 ? monthsDiff : 6;
      velocity = Math.round(((Number(currentHeight) - Number(previousHeightOrAge)) * (12.0 / mDiff)) * 10) / 10;
    } else {
      velocity = Math.round(Number(currentHeight || 0) * 2 * 10) / 10;
    }

    const isRedFlag = age >= 4 && age <= 9 && velocity < 4.0;
    return {
      velocityCmPerYear: velocity,
      alert: isRedFlag,
      isRedFlag: isRedFlag,
      status: velocity >= 7.0 ? 'accelerated' : (isRedFlag ? 'red_flag' : 'normal')
    };
  }

  // 7. Growth Inhibiting Habits Penalty Map
  const HABIT_LOSS_MAP = {
    late_sleep: 1.5,
    night_carbs: 1.2,
    poor_posture: 1.2,
    picky_eater: 1.3,
    sedentary: 1.0,
    milk_trouble: 0.8,
    obesity_risk: 1.7
  };

  // 8. 3 Trajectories Prediction Engine
  function predictAdultHeightTrajectories(childData, growthHistory, inhibitionFactors) {
    let mph = 175.0;
    let habits = [];
    let tannerPhase = 'phase_1';
    let curAgeYears = 10;
    let curHeight = 137.0;

    if (typeof childData === 'number') {
      mph = childData;
      habits = Array.isArray(growthHistory) ? growthHistory : (Array.isArray(inhibitionFactors) ? inhibitionFactors : []);
      if (typeof inhibitionFactors === 'string') tannerPhase = inhibitionFactors;
    } else if (childData && typeof childData === 'object') {
      if (childData.fatherHeight && childData.motherHeight) {
        mph = calculateMPH(childData.fatherHeight, childData.motherHeight, childData.gender).mph;
      } else if (childData.mph) {
        mph = childData.mph;
      }
      habits = childData.habits || inhibitionFactors || [];
      tannerPhase = childData.tannerPhase || childData.pubertyStage || 'phase_1';
      curAgeYears = childData.ageYears || (childData.ageMonths ? Math.round(childData.ageMonths / 12) : 10);
      curHeight = childData.currentHeight || 137.0;
    }

    habits = Array.isArray(habits) ? habits : [];
    let totalPenalty = 0;
    for (const h of habits) {
      if (HABIT_LOSS_MAP[h]) totalPenalty += HABIT_LOSS_MAP[h];
    }
    const cappedPenalty = Math.min(5.0, Math.round(totalPenalty * 10) / 10);
    const unmanaged = Math.round((mph - cappedPenalty) * 10) / 10;

    let goldenBoost = 6.0;
    if (tannerPhase === 'phase_2') goldenBoost = 5.0;
    else if (tannerPhase === 'phase_3') goldenBoost = 4.0;
    else if (tannerPhase === 'phase_4') goldenBoost = 1.8;

    let optimizedGain;
    if (tannerPhase === 'phase_4') {
      optimizedGain = Math.min(2.5, Math.max(1.5, Math.round((goldenBoost + cappedPenalty * 0.5) * 10) / 10));
    } else {
      optimizedGain = Math.min(9.2, Math.max(5.0, Math.round((goldenBoost + cappedPenalty * 0.5) * 10) / 10));
    }
    const optimized = Math.round((unmanaged + optimizedGain) * 10) / 10;

    // Generate curve points from current age to 20
    const startAge = Math.max(1, Math.min(19, curAgeYears));
    const ageArray = [];
    const baselineCurve = [];
    const unmanagedCurve = [];
    const optimizedCurve = [];

    const yearsRemaining = Math.max(1, 20 - startAge);
    for (let a = startAge; a <= 20; a++) {
      ageArray.push(a);
      const frac = (a - startAge) / yearsRemaining;
      baselineCurve.push(Math.round((curHeight + (mph - curHeight) * frac) * 10) / 10);
      unmanagedCurve.push(Math.round((curHeight + (unmanaged - curHeight) * frac) * 10) / 10);
      optimizedCurve.push(Math.round((curHeight + (optimized - curHeight) * frac) * 10) / 10);
    }

    return {
      baselineMPH: {
        height: mph,
        range: [Math.round((mph - 8.5) * 10) / 10, Math.round((mph + 8.5) * 10) / 10]
      },
      unmanaged: {
        height: unmanaged,
        penalty: cappedPenalty,
        lossPercent: Math.round((cappedPenalty / mph) * 1000) / 10
      },
      optimized: {
        height: optimized,
        gainOverUnmanaged: optimizedGain,
        potentialGain: [5.0, 9.2]
      },
      curvePoints: {
        ageArray,
        baselineCurve,
        unmanagedCurve,
        optimizedCurve
      }
    };
  }

  // Legacy calculateHeightPrediction for compatibility
  function calculateHeightPrediction(mph, habits = [], pubertyStage = 'none') {
    habits = Array.isArray(habits) ? habits : [];
    let loss = 0;
    habits.forEach((h) => {
      if (HABIT_LOSS_MAP[h]) loss += HABIT_LOSS_MAP[h];
    });
    const unmanagedLoss = Math.min(5.0, Math.round(loss * 10) / 10);
    const unmanagedHeight = Math.round((mph - unmanagedLoss) * 10) / 10;

    let goldenBoost = 5.0;
    let monthsRemaining = '약 36~48개월 (성장판 여유 / 기초체질 형성기)';
    if (pubertyStage === 'growth_spurt' || pubertyStage === 'phase_2') {
      goldenBoost = 4.0;
      monthsRemaining = '약 18~24개월 (급성장기 / 1cm가 아쉬운 골든타임)';
    } else if (pubertyStage === 'urgent_secondary_signs' || pubertyStage === 'phase_3') {
      goldenBoost = 2.5;
      monthsRemaining = '약 6~12개월 (성장판 폐쇄 직전 긴급 카운트다운!)';
    } else if (pubertyStage === 'phase_4') {
      goldenBoost = 1.8;
      monthsRemaining = '체형 완성기 (척추 디스크 수분 복원 및 자세 교정 구간)';
    }

    const rawGain = Math.round((mph + goldenBoost + (unmanagedLoss * 0.5) - unmanagedHeight) * 10) / 10;
    const goldenTimeGain = Math.min(9.5, Math.max(0, rawGain));
    const potentialHeight = Math.round((unmanagedHeight + goldenTimeGain) * 10) / 10;

    return {
      geneticMph: mph,
      unmanagedLoss,
      unmanagedHeight,
      goldenBoost,
      potentialHeight,
      goldenTimeGain,
      monthsRemaining
    };
  }

  // 9. Normative Growth Curve Data
  function getGrowthCurveData(sex, standard = 'KDCA') {
    const table = getStandardsTable(sex, standard);
    return {
      months: table.map((r) => r.m),
      p3: table.map((r) => r.p3),
      p50: table.map((r) => r.p50),
      p97: table.map((r) => r.p97)
    };
  }

  // 10. High-Resolution Interactive 3-Curve SVG Chart
  function renderSvgGrowthCurve(sex, currentAgeMonths, currentHeight, options = {}) {
    const width = 600;
    const height = 320;
    const padding = { top: 25, right: 45, bottom: 40, left: 50 };

    const normData = getGrowthCurveData(sex, options.standard || 'KDCA');
    const minM = 12;
    const maxM = 240;
    const minH = 65;
    const maxH = 195;

    const scaleX = (m) => padding.left + ((m - minM) / (maxM - minM)) * (width - padding.left - padding.right);
    const scaleY = (h) => height - padding.bottom - ((h - minH) / (maxH - minH)) * (height - padding.top - padding.bottom);

    // Build normative reference paths (P3, P50, P97)
    const makeNormPath = (values) => {
      return values.map((val, idx) => {
        const x = scaleX(normData.months[idx]);
        const y = scaleY(val);
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
    };

    const pathP97 = makeNormPath(normData.p97);
    const pathP50 = makeNormPath(normData.p50);
    const pathP3 = makeNormPath(normData.p3);

    // Trajectory curves from current age to 20 years (240m)
    const curM = Math.max(12, Math.min(240, Number(currentAgeMonths) || 120));
    const curH = Math.max(minH, Math.min(maxH, Number(currentHeight) || 137.0));
    const curAgeYears = Math.round(curM / 12);

    const traj = predictAdultHeightTrajectories({
      mph: options.mph || 175.0,
      habits: options.habits || [],
      tannerPhase: options.tannerPhase || 'phase_2',
      ageYears: curAgeYears,
      currentHeight: curH
    });

    const cp = traj.curvePoints;
    const makeTrajPath = (curveVals) => {
      return cp.ageArray.map((ageYr, idx) => {
        const x = scaleX(ageYr * 12);
        const y = scaleY(curveVals[idx]);
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
    };

    const pathOptimized = makeTrajPath(cp.optimizedCurve);
    const pathBaseline = makeTrajPath(cp.baselineCurve);
    const pathUnmanaged = makeTrajPath(cp.unmanagedCurve);

    // Shaded target zone between unmanaged and optimized
    let shadedAreaPath = '';
    if (cp.ageArray.length > 1) {
      const topPoints = cp.ageArray.map((ageYr, idx) => `${scaleX(ageYr * 12).toFixed(1)},${scaleY(cp.optimizedCurve[idx]).toFixed(1)}`);
      const bottomPoints = cp.ageArray.map((ageYr, idx) => `${scaleX(ageYr * 12).toFixed(1)},${scaleY(cp.unmanagedCurve[idx]).toFixed(1)}`).reverse();
      shadedAreaPath = `M${topPoints.join(' L')} L${bottomPoints.join(' L')} Z`;
    }

    const curX = scaleX(curM);
    const curY = scaleY(curH);

    // Current percentile
    const curLms = getLmsForMonth(sex, curM, options.standard || 'KDCA');
    const curZ = calculateKdcaPercentile(curH, curLms.L, curLms.M, curLms.S);

    return `
      <svg viewBox="0 0 ${width} ${height}" class="growth-curve-svg" style="width: 100%; height: auto; max-height: 340px;" aria-label="3중 인터랙티브 임상 성장 곡선 차트">
        <defs>
          <linearGradient id="optZoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#F43F5E" stop-opacity="0.05" />
          </linearGradient>
          <filter id="glowPulse" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Grid Lines & Shaded Area -->
        <line x1="${padding.left}" y1="${scaleY(80)}" x2="${width - padding.right}" y2="${scaleY(80)}" stroke="#1E293B" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(100)}" x2="${width - padding.right}" y2="${scaleY(100)}" stroke="#1E293B" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(120)}" x2="${width - padding.right}" y2="${scaleY(120)}" stroke="#1E293B" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(140)}" x2="${width - padding.right}" y2="${scaleY(140)}" stroke="#1E293B" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(160)}" x2="${width - padding.right}" y2="${scaleY(160)}" stroke="#1E293B" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(180)}" x2="${width - padding.right}" y2="${scaleY(180)}" stroke="#1E293B" stroke-dasharray="3,3" />

        ${shadedAreaPath ? `<path d="${shadedAreaPath}" fill="url(#optZoneGrad)" class="trajectory-target-zone" />` : ''}

        <!-- Normative Reference Background Curves (P3, P50, P97) -->
        <path d="${pathP97}" fill="none" stroke="#64748B" stroke-width="1.2" stroke-dasharray="4,4" id="curve-p97" />
        <text x="${width - padding.right + 4}" y="${scaleY(normData.p97[normData.p97.length - 1]) + 3}" font-size="9" fill="#94A3B8" font-family="monospace">P97 (97%)</text>

        <path d="${pathP50}" fill="none" stroke="#334155" stroke-width="1.8" id="curve-p50" />
        <text x="${width - padding.right + 4}" y="${scaleY(normData.p50[normData.p50.length - 1]) + 3}" font-size="10" fill="#64748B" font-weight="700" font-family="monospace">P50 (50%)</text>

        <path d="${pathP3}" fill="none" stroke="#64748B" stroke-width="1.2" stroke-dasharray="4,4" id="curve-p3" />
        <text x="${width - padding.right + 4}" y="${scaleY(normData.p3[normData.p3.length - 1]) + 3}" font-size="9" fill="#94A3B8" font-family="monospace">P3 (3%)</text>

        <!-- 3 Color-Coded Trajectory Path Lines -->
        <!-- 1. Optimized Intervention Trajectory (Cyan Blue #38BDF8) -->
        <path d="${pathOptimized}" fill="none" stroke="#38BDF8" stroke-width="2.8" stroke-linecap="round" id="curve-optimized" />
        <text x="${scaleX(240) + 4}" y="${scaleY(traj.optimized.height) - 4}" font-size="10" fill="#38BDF8" font-weight="800">최대 잠재 ${traj.optimized.height}cm</text>

        <!-- 2. Genetic Baseline Trajectory (Amber #F59E0B) -->
        <path d="${pathBaseline}" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-dasharray="5,3" stroke-linecap="round" id="curve-baseline" />
        <text x="${scaleX(240) + 4}" y="${scaleY(traj.baselineMPH.height) + 3}" font-size="10" fill="#F59E0B" font-weight="700">유전 MPH ${traj.baselineMPH.height}cm</text>

        <!-- 3. Current Unmanaged Trajectory (Coral/Rose #F43F5E) -->
        <path d="${pathUnmanaged}" fill="none" stroke="#F43F5E" stroke-width="2.4" stroke-linecap="round" id="curve-unmanaged" />
        <text x="${scaleX(240) + 4}" y="${scaleY(traj.unmanaged.height) + 10}" font-size="10" fill="#F43F5E" font-weight="700">방치 손실 ${traj.unmanaged.height}cm</text>

        <!-- Axes -->
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#475569" stroke-width="1.5" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#475569" stroke-width="1.5" />

        <!-- X-Axis Age Ticks (1 to 20 yrs) -->
        <text x="${scaleX(24)}" y="${height - 12}" font-size="10" fill="#94A3B8" text-anchor="middle">2세</text>
        <text x="${scaleX(72)}" y="${height - 12}" font-size="10" fill="#94A3B8" text-anchor="middle">6세</text>
        <text x="${scaleX(120)}" y="${height - 12}" font-size="10" fill="#94A3B8" text-anchor="middle">10세</text>
        <text x="${scaleX(168)}" y="${height - 12}" font-size="10" fill="#94A3B8" text-anchor="middle">14세</text>
        <text x="${scaleX(216)}" y="${height - 12}" font-size="10" fill="#94A3B8" text-anchor="middle">18세</text>
        <text x="${scaleX(240)}" y="${height - 12}" font-size="10" fill="#94A3B8" text-anchor="middle">20세</text>

        <!-- Y-Axis Height Ticks -->
        <text x="${padding.left - 8}" y="${scaleY(80) + 4}" font-size="10" fill="#94A3B8" text-anchor="end">80cm</text>
        <text x="${padding.left - 8}" y="${scaleY(100) + 4}" font-size="10" fill="#94A3B8" text-anchor="end">100cm</text>
        <text x="${padding.left - 8}" y="${scaleY(120) + 4}" font-size="10" fill="#94A3B8" text-anchor="end">120cm</text>
        <text x="${padding.left - 8}" y="${scaleY(140) + 4}" font-size="10" fill="#94A3B8" text-anchor="end">140cm</text>
        <text x="${padding.left - 8}" y="${scaleY(160) + 4}" font-size="10" fill="#94A3B8" text-anchor="end">160cm</text>
        <text x="${padding.left - 8}" y="${scaleY(180) + 4}" font-size="10" fill="#94A3B8" text-anchor="end">180cm</text>

        <!-- Current Child Coordinate: Pulsing Bio-Emerald Point (#10B981) -->
        <circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="14" fill="#10B981" fill-opacity="0.25">
          <animate attributeName="r" values="7;15;7" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="6" fill="#10B981" stroke="#FFFFFF" stroke-width="2.5" filter="url(#glowPulse)" />

        <!-- Tooltip Badge -->
        <g transform="translate(${Math.max(padding.left + 5, Math.min(width - padding.right - 130, curX - 60))}, ${Math.max(padding.top + 5, curY - 38)})">
          <rect x="0" y="0" width="125" height="26" rx="6" fill="#0F172A" stroke="#10B981" stroke-width="1.2" opacity="0.95" />
          <text x="62" y="17" font-size="10.5" font-weight="800" fill="#10B981" text-anchor="middle">
            현재 ${curH}cm (${curZ.percentile}th Pct)
          </text>
        </g>
      </svg>
    `;
  }

  // 11. Generate 3-Tier Predicted Height Bar Chart HTML
  function render3TierBarChart(pred) {
    const minScale = 140;
    const maxScale = 190;
    const calcWidthPct = (val) => Math.max(15, Math.min(100, Math.round(((val - minScale) / (maxScale - minScale)) * 100)));

    const wMph = calcWidthPct(pred.geneticMph);
    const wUnmanaged = calcWidthPct(pred.unmanagedHeight);
    const wPotential = calcWidthPct(pred.potentialHeight);

    return `
      <div class="predicted-bars-container">
        <!-- Bar 1: Genetic MPH -->
        <div class="predicted-bar-row">
          <div class="predicted-bar-header">
            <span class="bar-title">① 부모 유전 예상키 (MPH)</span>
            <span class="bar-val">${pred.geneticMph}cm</span>
          </div>
          <div class="predicted-bar-track">
            <div class="predicted-bar-fill bar-fill-mph" style="width: ${wMph}%;"></div>
          </div>
          <div class="predicted-bar-caption">부모 키 표준 의학식 기반 기대 유전 잠재력 (±8.5cm 신뢰구간)</div>
        </div>

        <!-- Bar 2: Unmanaged Loss -->
        <div class="predicted-bar-row" style="margin-top: 1rem;">
          <div class="predicted-bar-header">
            <span class="bar-title">② 방해 습관 방치 시 예측키</span>
            <span class="bar-val bar-val-alert">${pred.unmanagedHeight}cm <small style="color: var(--rose-alert, #F43F5E); font-size: 0.85rem;">(-${pred.unmanagedLoss}cm 손실)</small></span>
          </div>
          <div class="predicted-bar-track">
            <div class="predicted-bar-fill bar-fill-alert" style="width: ${wUnmanaged}%;"></div>
          </div>
          <div class="predicted-bar-caption">늦은 취침·심야 혈당 스파이크·자세 불균형 지속 시 누적 손실치 (최대 -5cm 캡)</div>
        </div>

        <!-- Bar 3: Golden Time Max Potential -->
        <div class="predicted-bar-row" style="margin-top: 1rem;">
          <div class="predicted-bar-header">
            <span class="bar-title">③ 골든타임 밀착 관리 시 최대 잠재키</span>
            <span class="bar-val bar-val-mint">${pred.potentialHeight}cm <small style="color: var(--cyan-pulse, #38BDF8); font-size: 0.9rem; font-weight: 800;">(+${pred.goldenTimeGain}cm 잠재력)</small></span>
          </div>
          <div class="predicted-bar-track">
            <div class="predicted-bar-fill bar-fill-mint" style="width: ${wPotential}%;"></div>
          </div>
          <div class="predicted-bar-caption">서파수면 GH 회복·척추 감압(+1.8cm)·흡수율 45% 칼슘 처방 시 도달 가능한 최적 궤적</div>
        </div>
      </div>
    `;
  }

  // 12. Render 3 Habit Coaching Cards (Concise 1-Line Bullet Style)
  function renderCoachingCards(habits = []) {
    const hasMilk = habits.includes('milk_trouble') || habits.includes('picky_eater');
    const hasLateSleep = habits.includes('late_sleep');
    const hasPosture = habits.includes('poor_posture');

    return `
      <div class="coaching-cards-grid" style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
        <!-- Card 1: Nutrition -->
        <div class="bento-card-sub" style="background: rgba(15, 23, 42, 0.88); border-left: 4px solid #10B981; border-radius: 14px; padding: 1.05rem 1.15rem;">
          <div style="font-size: 0.98rem; font-weight: 900; color: #6EE7B7; margin-bottom: 0.35rem;">🥛 ① 식단 &amp; 뼈성장 영양 핵심</div>
          <div style="font-size: 0.92rem; color: #F8FAFC; line-height: 1.55;">
            ${hasMilk 
              ? '• <strong>구연산 칼슘 · 어골칼슘(흡수율 45%)</strong> + 비타민D3·K2를 아침·저녁 보충해 우유 배앓이 없이 뼈 기질을 채워주세요.' 
              : '• <strong>구연산 칼슘 · 비타민D3(1000~2000IU) · 아연 · 초유</strong>를 아침·저녁 꾸준히 보충해 성장판 연골 증식을 돕습니다.'}
          </div>
        </div>

        <!-- Card 2: Sleep -->
        <div class="bento-card-sub" style="background: rgba(15, 23, 42, 0.88); border-left: 4px solid #38BDF8; border-radius: 14px; padding: 1.05rem 1.15rem;">
          <div style="font-size: 0.98rem; font-weight: 900; color: #93C5FD; margin-bottom: 0.35rem;">🌙 ② 밤 10시 수면 골든타임</div>
          <div style="font-size: 0.92rem; color: #F8FAFC; line-height: 1.55;">
            ${hasLateSleep 
              ? '• 밤 10시~새벽 2시에 일일 성장호르몬의 <strong>65%가 분비</strong>됩니다. 21:45 소등 &amp; 취침 2시간 전 금식을 지켜주세요.' 
              : '• 취침 후 첫 90분 깊은 서파수면(SWS)에서 성장호르몬이 폭발합니다. 잠들기 전 5분 다리 마사지로 숙면을 유도하세요.'}
          </div>
        </div>

        <!-- Card 3: Posture -->
        <div class="bento-card-sub" style="background: rgba(15, 23, 42, 0.88); border-left: 4px solid #A855F7; border-radius: 14px; padding: 1.05rem 1.15rem;">
          <div style="font-size: 0.98rem; font-weight: 900; color: #D8B4FE; margin-bottom: 0.35rem;">🧘 ③ 숨은 키 2cm 감압 &amp; 점핑</div>
          <div style="font-size: 0.92rem; color: #F8FAFC; line-height: 1.55;">
            ${hasPosture 
              ? '• 저녁 <strong>문틀 철봉 매달리기(30초×3세트)</strong>로 눌린 척추 디스크를 펴주면 <strong>숨은 키 2cm(1.5~2.2cm)</strong>가 복원됩니다.' 
              : '• 하루 15분 <strong>실내 트램폴린·줄넘기 점핑</strong>은 성장판 연골세포를 자극해 숨은 키 2cm와 골성장을 깨웁니다.'}
          </div>
        </div>
      </div>
    `;
  }

  // 13. Official Clinical Velocity, Sleep & Nutrition Box (Concise Summary)
  function renderOfficialClinicalAndNutritionBox(ageMonths, bmiInfo) {
    const clampedM = Math.max(12, Math.min(240, ageMonths || 120));

    const velocityList = (authoritiesData && authoritiesData.growthVelocityAndRedFlags) || [];
    const velocityGuide = velocityList.find((v) => clampedM >= v.minMonths && clampedM <= v.maxMonths) || {
      ageRangeLabel: '소아·학령기 표준 기준',
      normalVelocityCmPerYear: '연간 5.0 ~ 7.0cm 성장',
      sleepRecommendation: '일일 총 9~12시간 (밤 10시 전 취침)'
    };

    return `
      <div style="background: rgba(15, 23, 42, 0.88); border: 1.5px solid rgba(56, 189, 248, 0.3); border-radius: 18px; padding: 1.2rem; margin-top: 1.15rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
          <h4 style="font-size: 1.02rem; font-weight: 900; color: #FFFFFF; margin: 0;">
            🏛️ 대한소아내분비학회 · 미국수면재단(NSF) 핵심 기준 요약
          </h4>
          <span style="background: rgba(56, 189, 248, 0.15); color: #93C5FD; font-size: 0.78rem; font-weight: 800; padding: 0.22rem 0.65rem; border-radius: 9999px;">
            ${velocityGuide.ageRangeLabel}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.84rem; color: #94A3B8; font-weight: 800;">📏 정상 성장속도 기준</span>
            <span style="font-size: 0.98rem; font-weight: 900; color: #34D399;">${velocityGuide.normalVelocityCmPerYear}</span>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.84rem; color: #94A3B8; font-weight: 800;">🌙 연령 권장 수면시간</span>
            <span style="font-size: 0.95rem; font-weight: 900; color: #38BDF8;">${velocityGuide.sleepRecommendation}</span>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.84rem; color: #94A3B8; font-weight: 800;">⚖️ 체질량지수 (BMI ${bmiInfo.bmi})</span>
            <span style="font-size: 0.95rem; font-weight: 900; color: ${bmiInfo.bmiBadgeColor};">${bmiInfo.bmiStatus} (연 4cm 미만 시 진료 권장)</span>
          </div>
        </div>
      </div>
    `;
  }

  // 14. Recommended Products & Compact Reference Section for Tab 1 (신체성장)
  function renderAcademicEvidenceSection() {
    return `
      <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 0.85rem 1.1rem; margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span style="font-size: 0.86rem; font-weight: 800; color: #93C5FD;">🔬 동료심사(Peer-Reviewed) 학술 논문 임상 근거: 질병관리청(KDCA 2017) 및 황기추출물(HT042) 임상</span>
        <a href="https://pubmed.ncbi.nlm.nih.gov/25374566/" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; color: #38BDF8; font-weight: 800; text-decoration: none;">PMID:25374566 원문 ↗</a>
      </div>

      <!-- Bottom Recommended Products for Core 1 (Hidden by default so pure report shows first) -->
      <div id="core-1-recommended-products" class="curated-product-recommendation-section growth-product-section" style="display: none; background: rgba(15, 23, 42, 0.94); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 18px; padding: 1.25rem; margin-top: 1.25rem; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem;">
          <h4 style="font-size: 1.1rem; font-weight: 900; color: #38BDF8; margin: 0;">
            🎁 신체성장 · 숨은 키 목표 달성에 도움이 되는 엄선 추천 상품 TOP 3
          </h4>
          <span style="font-size: 0.8rem; color: #6EE7B7; font-weight: 800;">아침·저녁 6개월 이상 꾸준히 챙기는 핵심 구비템</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <!-- Product 1: HT042 -->
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 14px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 0.76rem; font-weight: 900; color: #FBBF24; background: rgba(251,191,36,0.15); padding: 0.18rem 0.55rem; border-radius: 9999px;">🏆 엄선 1위 · 키성장 기능성</span>
              <div style="font-size: 1.0rem; font-weight: 900; color: #FFFFFF; margin: 0.45rem 0 0.35rem; line-height: 1.4;">종근당건강 아이커 / 키즈텐042 (식약처 인정 HT042 황기추출물 + 칼슘·비타민D·아연)</div>
              <p style="font-size: 0.86rem; color: #E2E8F0; line-height: 1.5; margin: 0 0 0.75rem 0;">성장판 연골세포 증식 인자(IGF-1)를 깨워주는 식약처 인정 원료! 아이들이 잘 먹어 6개월 이상 재주문하는 1위 제품입니다.</p>
            </div>
            <a href="https://www.coupang.com/np/search?q=%EC%A2%85%EA%B7%BC%EB%8B%B9%EA%B1%B4%EA%B0%95+%EC%95%84%EC%9D%B4%EC%BB%A4+HT042+%ED%99%A9%EA%B8%B0%EC%B6%94%EC%B6%9C%EB%AC%BC+%ED%82%A4%EC%84%B1%EC%9E%A5&channel=user&lptag=AF7865143" target="_blank" rel="noopener noreferrer" id="ref-chip-growth" class="reference-chip mobile-touch-btn" style="display: flex; min-height: 44px; align-items: center; justify-content: center; background: #FFFFFF; color: #0F172A; font-size: 0.88rem; font-weight: 900; padding: 0.55rem 0.85rem; border-radius: 10px; text-decoration: none;">
              📦 쿠팡에서 HT042 키성장 영양제 보기 ↗
            </a>
          </div>

          <!-- Product 2: Colostrum + Calcium Chewable -->
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 14px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 0.76rem; font-weight: 900; color: #6EE7B7; background: rgba(16,185,129,0.15); padding: 0.18rem 0.55rem; border-radius: 9999px;">✨ 엄선 2위 · 뼈기질 올인원</span>
              <div style="font-size: 1.0rem; font-weight: 900; color: #FFFFFF; margin: 0.45rem 0 0.35rem; line-height: 1.4;">뉴질랜드 초유 칼슘·어골칼슘 + 비타민D3·아연·마그네슘 오렌지맛 츄어블</div>
              <p style="font-size: 0.86rem; color: #E2E8F0; line-height: 1.5; margin: 0 0 0.75rem 0;">1알에 칼슘·비타민C·D3·초유·철분·아연·마그네슘이 모두 들어있어 아침·저녁 간편하게 씹어 먹는 스테디셀러입니다.</p>
            </div>
            <a href="https://www.coupang.com/np/search?q=%EB%89%B4%EC%A7%88%EB%9E%9C%EB%93%9C+%EC%B4%88%EC%9C%A0+%EC%B9%BC%EC%8A%98+%EB%B9%84%ED%83%80%EB%AF%BCD+%EC%95%84%EC%97%B0+%EC%96%B4%EB%A6%B0%EC%9D%B4+%EC%B8%84%EC%96%B4%EB%B8%94&channel=user&lptag=AF7865143" target="_blank" rel="noopener noreferrer" class="mobile-touch-btn" style="display: flex; min-height: 44px; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #A7F3D0; font-size: 0.88rem; font-weight: 900; padding: 0.55rem 0.85rem; border-radius: 10px; text-decoration: none;">
              📦 쿠팡에서 초유·칼슘 올인원 보기 ↗
            </a>
          </div>

          <!-- Product 3: Ultrasonic Height Stadiometer -->
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 14px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 0.76rem; font-weight: 900; color: #D8B4FE; background: rgba(168,85,247,0.15); padding: 0.18rem 0.55rem; border-radius: 9999px;">💎 엄선 3위 · 매월 1일 키 측정</span>
              <div style="font-size: 1.0rem; font-weight: 900; color: #FFFFFF; margin: 0.45rem 0 0.35rem; line-height: 1.4;">인바디 다이얼 키즈 / 가정용 초음파 디지털 신장계 (1초 정밀 키재기)</div>
              <p style="font-size: 0.86rem; color: #E2E8F0; line-height: 1.5; margin: 0 0 0.75rem 0;">매월 1일 아침 키를 0.1cm 단위로 정확히 측정해 우리 아이 성장속도(cm/년)를 관리해 주는 필수 홈케어 기기입니다.</p>
            </div>
            <a href="https://www.coupang.com/np/search?q=%EC%9D%B8%EB%B0%94%EB%94%94+%EC%B4%88%EC%9D%8C%ED%8C%8C+%EC%8B%A0%EC%9E%A5%EA%B3%84+%EC%96%B4%EB%A6%B0%EC%9D%B4+%EB%94%94%EC%A7%80%ED%84%B8+%ED%82%A4%EC%9E%AC%EA%B8%B0&channel=user&lptag=AF7865143" target="_blank" rel="noopener noreferrer" class="mobile-touch-btn" style="display: flex; min-height: 44px; align-items: center; justify-content: center; background: rgba(168, 85, 247, 0.22); border: 1px solid #A855F7; color: #E9D5FF; font-size: 0.88rem; font-weight: 900; padding: 0.55rem 0.85rem; border-radius: 10px; text-decoration: none;">
              📦 쿠팡에서 초음파 신장계 보기 ↗
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 15. Master Tab 1 Report Renderer
  function renderTab1Report(profile) {
    const ageMonths = profile.ageMonths || ((profile.ageYears || 10) * 12);
    const gender = normalizeSex(profile.gender);
    const standard = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en') ? 'CDC' : 'KDCA';

    const lms = getLmsForMonth(gender, ageMonths, standard);
    const kdca = calculateKdcaPercentile(profile.currentHeight, lms.L, lms.M, lms.S);
    const bmiInfo = evaluateWeightAndBmi(profile.currentHeight, profile.currentWeight, lms);
    const mphObj = calculateMPH(profile.fatherHeight, profile.motherHeight, gender);
    const pred = calculateHeightPrediction(mphObj.mph, profile.habits, profile.tannerPhase || profile.pubertyStage);

    const deltaSign = kdca.deltaMedian >= 0 ? `+${kdca.deltaMedian}` : `${kdca.deltaMedian}`;
    const genderKorean = gender === 'boy' ? '남아' : '여아';
    const vel = calculateVelocity(profile.recentGrowth6m || 3.0, Math.round(ageMonths / 12));

    return `
      <!-- Core 1 Container -->
      <div id="core-1-container" class="core-module-container">

        <!-- Big Stats Bento Header (Clean 1-Card-Per-Row Layout) -->
        <div class="growth-stats-grid" style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div class="stat-card" style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 20px; padding: 1.25rem; text-align: center;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--cyan-pulse, #38BDF8);">소아 신체 백분위 &amp; Z-Score</span>
            <div style="font-size: 1.9rem; font-weight: 800; color: var(--cyan-pulse, #38BDF8); margin: 0.35rem 0;">상위 ${kdca.topPercent}%</div>
            <span style="font-size: 0.82rem; color: var(--text-secondary);">${kdca.percentile}th Pct (Z: ${kdca.zScore >= 0 ? `+${kdca.zScore}` : kdca.zScore} SD)</span>
          </div>

          <div class="stat-card" style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 1.25rem; text-align: center;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--growth-mint, #10B981);">연간 성장속도 (Velocity)</span>
            <div style="font-size: 1.9rem; font-weight: 800; color: ${vel.alert ? '#F43F5E' : 'var(--growth-mint, #10B981)'}; margin: 0.35rem 0;">
              ${vel.velocityCmPerYear} cm/yr
            </div>
            <span style="font-size: 0.82rem; color: ${vel.alert ? '#FDA4AF' : 'var(--text-secondary)'};">
              ${vel.alert ? '🚨 저신장 적신호 (<4.0cm/yr)' : vel.status === 'accelerated' ? '⚡ 급성장 가속 피크' : '정상 성장 궤도'}
            </span>
          </div>

          <div class="stat-card" style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 20px; padding: 1.25rem; text-align: center;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--amber-caution, #F59E0B);">유전 표적키 (Tanner MPH)</span>
            <div style="font-size: 1.9rem; font-weight: 800; color: var(--amber-caution, #F59E0B); margin: 0.35rem 0;">${mphObj.mph}cm</div>
            <span style="font-size: 0.82rem; color: var(--text-secondary);">${mphObj.rangeStr} (±8.5cm)</span>
          </div>

          <div class="stat-card" style="background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 20px; padding: 1.25rem; text-align: center;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--rose-alert, #F43F5E);">골든타임 성장판 잔여 기간</span>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--rose-alert, #F43F5E); margin: 0.65rem 0;">
              ${pred.monthsRemaining.split('(')[0].trim()}
            </div>
            <span style="font-size: 0.82rem; color: var(--text-secondary);">${pred.monthsRemaining}</span>
          </div>
        </div>

        <!-- High-Resolution Interactive 3-Curve SVG Chart Card -->
        <div style="background: var(--theme-surface-card, rgba(15, 23, 42, 0.74)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
            <div>
              <h4 style="font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--text-primary);">
                📈 3중 성인 예측키 성장 궤적 곡선 (Auxology Trajectory)
              </h4>
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
                현재 나이(${Math.round(ageMonths / 12)}세)부터 만 20세까지 3가지 성장 경로 시뮬레이션
              </p>
            </div>
            <div style="display: flex; gap: 0.85rem; font-size: 0.78rem; font-weight: 700;">
              <span style="color: #38BDF8;">● 최대 잠재 궤적</span>
              <span style="color: #F59E0B;">● 유전 기준(MPH)</span>
              <span style="color: #F43F5E;">● 방치 손실 궤적</span>
            </div>
          </div>
          ${renderSvgGrowthCurve(gender, ageMonths, profile.currentHeight, {
            mph: mphObj.mph,
            habits: profile.habits,
            tannerPhase: profile.tannerPhase || profile.pubertyStage,
            standard
          })}
        </div>

        <!-- 3-Tier Predicted Height Bar Chart -->
        <div style="background: var(--theme-surface-card, rgba(15, 23, 42, 0.74)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <h4 style="font-size: 1.05rem; font-weight: 800; margin: 0 0 1rem 0; color: var(--text-primary);">
            📊 성인 예측키 3단 비교 (유전 MPH vs 현재 습관 유지 vs 골든타임 최적화)
          </h4>
          ${render3TierBarChart(pred)}
        </div>

        <!-- Official Pediatric Authority Guidance -->
        ${renderOfficialClinicalAndNutritionBox(ageMonths, bmiInfo)}

        <!-- 3 Habit Prescriptive Coaching Cards -->
        <div style="margin-top: 1.5rem;">
          <h4 style="font-size: 1.05rem; font-weight: 800; margin: 0 0 0.5rem 0; color: var(--text-primary);">
            🩺 성장 방해 생체 요인별 임상 프로토콜
          </h4>
          ${renderCoachingCards(profile.habits)}
        </div>

        ${renderAcademicEvidenceSection()}

      </div>
    `;
  }

  // Master Export Interface
  const GrowthEngine = {
    erf,
    normalCDF,
    getLmsForMonth,
    calculateLMSZScore,
    calculateKdcaPercentile,
    evaluateWeightAndBmi,
    calculateMPH,
    calculateMph,
    calculateVelocity,
    predictAdultHeightTrajectories,
    calculateHeightPrediction,
    getGrowthCurveData,
    renderSvgGrowthCurve,
    render3TierBarChart,
    renderCoachingCards,
    renderOfficialClinicalAndNutritionBox,
    renderAcademicEvidenceSection,
    renderTab1Report
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GrowthEngine;
  }
  if (typeof window !== 'undefined') {
    window.KidsFitGrowthEngine = GrowthEngine;
    window.TallerGrowthEngine = GrowthEngine;
  }
  if (typeof global !== 'undefined' && typeof window === 'undefined') {
    global.KidsFitGrowthEngine = GrowthEngine;
    global.TallerGrowthEngine = GrowthEngine;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
