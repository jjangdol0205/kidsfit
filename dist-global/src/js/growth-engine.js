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

  // 4-1. KDCA Weight & BMI Status Evaluator (Full Weight Percentile + Height-Adjusted Optimal Weight)
  function evaluateWeightAndBmi(heightCm, weightKg, lms) {
    const hVal = Math.max(50.0, Number(heightCm) || Number(lms && lms.M) || 137.0);
    const hMeter = hVal / 100.0;
    const stdWeight = Math.round((Number(lms && lms.wM) || 35.5) * 10) / 10;
    const stdHeight = Math.round((Number(lms && lms.M) || 137.0) * 10) / 10;
    const wKg = Math.round(Math.max(3.0, Number(weightKg) || stdWeight) * 10) / 10;
    const bmi = Math.round((wKg / (hMeter * hMeter)) * 10) / 10;
    const wPct = calculateKdcaPercentile(wKg, 1.0, stdWeight, (lms && lms.wS) || 0.15);

    const stdBmiP50 = (lms && lms.bmiP50) ? Number(lms.bmiP50) : (stdWeight / Math.pow(stdHeight / 100.0, 2));
    const optimalWeightForHeight = Math.round((stdBmiP50 * hMeter * hMeter) * 10) / 10;
    const weightVsHeightDelta = Math.round((wKg - optimalWeightForHeight) * 10) / 10;
    const futureHeight6mMeter = (hVal + 3.2) / 100.0;
    const targetWeight6m = Math.round(Math.max(optimalWeightForHeight + 1.0, stdBmiP50 * futureHeight6mMeter * futureHeight6mMeter) * 10) / 10;

    let bmiStatus = '표준 균형 체형 (정상 5~84백분위)';
    let bmiShortStatus = '키 성장 최적 표준 체중';
    let bmiNote = '키 대비 체중 밸런스가 이상적입니다. 단백질·칼슘 섭취를 꾸준히 유지하세요.';
    let bmiBadgeColor = '#1D4ED8';

    if (bmi < ((lms && lms.bmiP5) || 13.8) || wKg < optimalWeightForHeight * 0.88) {
      bmiStatus = '저체중 · 영양 보충 필요 (<5백분위)';
      bmiShortStatus = '저체중 · 골밀도 영양 보충 필요';
      bmiNote = `현재 키(${hVal}cm) 맞춤 적정 체중(${optimalWeightForHeight}kg)보다 ${Math.abs(weightVsHeightDelta).toFixed(1)}kg 부족합니다. 키 성장의 재료가 되는 단백질·칼슘·아연·초유 보강이 우선입니다.`;
      bmiBadgeColor = '#1D4ED8';
    } else if (bmi >= ((lms && lms.bmiP95) || 21.0) || wKg > optimalWeightForHeight * 1.2) {
      bmiStatus = '과체중·성조숙 주의 (≥95백분위)';
      bmiShortStatus = '과체중 · 성장판 조기 골화 주의';
      bmiNote = `현재 키(${hVal}cm) 적정 체중(${optimalWeightForHeight}kg)보다 +${Math.abs(weightVsHeightDelta).toFixed(1)}kg 높습니다. 과도한 체지방(렙틴 호르몬)은 사춘기와 성장판 골화를 앞당길 수 있으므로 야식·단 음료를 줄이고 줄넘기·점핑 운동으로 전환해주세요.`;
      bmiBadgeColor = '#1D4ED8';
    } else if (bmi >= ((lms && lms.bmiP85) || 18.8) || wKg > optimalWeightForHeight * 1.1) {
      bmiStatus = '과체중 경계 (85~94백분위)';
      bmiShortStatus = '과체중 경계 · 체지방 관리 권장';
      bmiNote = `현재 키(${hVal}cm) 적정 체중(${optimalWeightForHeight}kg) 대비 +${Math.abs(weightVsHeightDelta).toFixed(1)}kg입니다. 체중 증가 속도가 키 성장 속도보다 빠르지 않도록 야식과 액상과당 음료를 조절해주세요.`;
      bmiBadgeColor = '#1D4ED8';
    }

    return {
      bmi,
      currentWeight: wKg,
      standardWeight: stdWeight,
      weightPercentile: wPct.percentile,
      weightTopPercent: wPct.topPercent,
      weightZScore: wPct.zScore,
      weightDelta: wPct.deltaMedian,
      optimalWeightForHeight,
      weightVsHeightDelta,
      targetWeight6m,
      bmiStatus,
      bmiShortStatus,
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

  // 8-1. Age & Sex Accurate Epiphyseal Growth Plate Remaining Window Calculator
  function calculateRemainingGrowthWindow(ageMonths = 120, sex = 'boy', pubertyStage = 'none') {
    const isBoy = normalizeSex(sex) === 'boy';
    const exactYears = Math.max(1.0, Math.min(20.0, (Number(ageMonths) || 120) / 12.0));
    const ageYearsInt = Math.floor(exactYears);
    // Korean Pediatric Endocrinology standard epiphyseal closure age: Boy ~16.5-17.0 yrs, Girl ~14.5-15.0 yrs
    const closureAge = isBoy ? 17.0 : 15.0;
    const phvAge = isBoy ? 12.5 : 10.5;
    const rawRemYears = Math.max(0, closureAge - exactYears);
    const remMinYr = Math.max(1, Math.floor(rawRemYears - 0.5));
    const remMaxYr = Math.max(remMinYr + 1, Math.ceil(rawRemYears + 0.5));

    if (pubertyStage === 'phase_4' || rawRemYears <= 0.8) {
      return {
        headline: '약 6~12개월 (체형·숨은키 복원기)',
        shortBadge: '약 6~12개월 잔여',
        subLabel: '성장판 마감 단계 · 척추 디스크 감압(+1.8cm) 집중 구간',
        fullText: '약 6~12개월 (성장판 마감 단계 / 척추 디스크 수분 복원 및 숨은 키 +1.8cm 교정 구간)',
        meaningKo: `성장판 마감 단계로, 거북목·척추 디스크 감압으로 숨은 키 1.5~2.2cm를 복원하는 골든타임입니다.`
      };
    }

    if (pubertyStage === 'urgent_secondary_signs' || pubertyStage === 'phase_3' || rawRemYears <= 2.2) {
      const remMosMin = Math.max(6, Math.round((rawRemYears - 0.5) * 12));
      const remMosMax = Math.max(remMosMin + 6, Math.round((rawRemYears + 0.3) * 12));
      return {
        headline: `약 ${remMosMin}~${remMosMax}개월 남음`,
        shortBadge: `약 ${remMosMin}~${remMosMax}개월 잔여`,
        subLabel: `만 ${closureAge}세 성장판 폐쇄 전 마지막 스퍼트 구간`,
        fullText: `약 ${remMosMin}~${remMosMax}개월 남음 (만 ${closureAge}세 성장판 닫히기 전 마지막 집중 방어 골든타임!)`,
        meaningKo: `2차 성징 후반부로 성장판이 빠르게 닫히는 시기입니다. ${isBoy ? '남아 평균 만 17세' : '여아 평균 만 15세'} 완전 폐쇄 전 남은 ${remMosMin}~${remMosMax}개월 동안 수면·칼슘·철봉 감압을 밀착 관리해야 최종 키를 지킬 수 있습니다.`
      };
    }

    if (ageYearsInt <= 6) {
      return {
        headline: `약 ${remMinYr}~${remMaxYr}년 여유`,
        shortBadge: `약 ${remMinYr}~${remMaxYr}년 여유 (개방률 95%+)`,
        subLabel: `만 ${closureAge}세 성장판 닫힐 때까지 기초키 비축기`,
        fullText: `약 ${remMinYr}~${remMaxYr}년 여유 (현재 만 ${ageYearsInt}세 · 성장판 95%+ 열림 → 만 ${closureAge}세 폐쇄까지 매년 6~7cm 기초키 비축기)`,
        meaningKo: `만 ${ageYearsInt}세는 성장판이 95% 이상 활짝 열려 있으며, 성장판이 닫히는 만 ${closureAge}세까지 약 ${remMinYr}~${remMaxYr}년의 충분한 성장 기간이 남아 있습니다! 사춘기 급성장기(만 ${phvAge}세경)가 오기 전 기초 키를 매년 6~7cm씩 탄탄하게 쌓아올리는 황금기입니다.`
      };
    }

    if (ageYearsInt <= Math.floor(phvAge - 1)) {
      return {
        headline: `약 ${remMinYr}~${remMaxYr}년 여유`,
        shortBadge: `약 ${remMinYr}~${remMaxYr}년 남음 (개방률 85%+)`,
        subLabel: `사춘기 전 기초키 비축 · 만 ${closureAge}세 폐쇄 기준`,
        fullText: `약 ${remMinYr}~${remMaxYr}년 남음 (만 ${closureAge}세 성장판 폐쇄 기준 · 사춘기 급성장 진입 전 기초신장 비축 골든타임)`,
        meaningKo: `성장판이 닫히는 만 ${closureAge}세까지 약 ${remMinYr}~${remMaxYr}년이 남아 있으며, 사춘기 폭풍 성장기(만 ${phvAge}세경) 진입 전에 기초 키를 최대한 높여두고 성조숙증(체지방 과다)을 예방해야 하는 핵심 골든타임입니다.`
      };
    }

    return {
      headline: `약 ${remMinYr}~${remMaxYr}년 남음`,
      shortBadge: `약 ${remMinYr}~${remMaxYr}년 남음 (급성장 피크 PHV)`,
      subLabel: `만 ${closureAge}세 성장판 폐쇄 전 최대 가속 골든타임`,
      fullText: `약 ${remMinYr}~${remMaxYr}년 남음 (사춘기 급성장 피크 PHV · 만 ${closureAge}세 성장판 닫히기 전 1cm가 아쉬운 핵심 골든타임)`,
      meaningKo: `사춘기 급성장 피크(PHV) 구간 → 칼슘·단백질·밤 10시 숙면으로 잠재키를 최대 +7~9cm 끌어올릴 시기입니다.`
    };
  }

  // Legacy calculateHeightPrediction for compatibility (now age & sex aware!)
  function calculateHeightPrediction(mph, habits = [], pubertyStage = 'none', ageMonths = null, sex = 'boy') {
    habits = Array.isArray(habits) ? habits : [];
    let loss = 0;
    habits.forEach((h) => {
      if (HABIT_LOSS_MAP[h]) loss += HABIT_LOSS_MAP[h];
    });
    const unmanagedLoss = Math.min(5.0, Math.round(loss * 10) / 10);
    const unmanagedHeight = Math.round((mph - unmanagedLoss) * 10) / 10;

    let goldenBoost = 5.0;
    let legacyStageMonths = '약 36~48개월 여유';
    if (pubertyStage === 'growth_spurt' || pubertyStage === 'phase_2') {
      goldenBoost = 4.0;
      legacyStageMonths = '약 18~24개월 골든타임';
    } else if (pubertyStage === 'urgent_secondary_signs' || pubertyStage === 'phase_3') {
      goldenBoost = 2.5;
      legacyStageMonths = '약 6~12개월 긴급 골든타임!';
    } else if (pubertyStage === 'phase_4') {
      goldenBoost = 1.8;
      legacyStageMonths = '약 6개월 이내 마감기';
    }

    const effectiveAgeMonths = (ageMonths !== null && ageMonths !== undefined && Number(ageMonths) > 0) ? Number(ageMonths) : 120;
    const windowInfo = calculateRemainingGrowthWindow(effectiveAgeMonths, sex, pubertyStage);
    const monthsRemaining = (ageMonths !== null && ageMonths !== undefined && Number(ageMonths) > 0)
      ? windowInfo.fullText
      : `${windowInfo.fullText} (${legacyStageMonths})`;

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
      monthsRemaining,
      windowHeadline: windowInfo.headline,
      windowShortBadge: windowInfo.shortBadge,
      windowSubLabel: windowInfo.subLabel,
      windowMeaningKo: windowInfo.meaningKo
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
    const padding = { top: 28, right: 138, bottom: 40, left: 50 };

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

    // Anti-collision right-hand label Y coordinates (minimum 24px vertical gap)
    const endX = scaleX(240);
    const rawYOpt = scaleY(traj.optimized.height);
    const rawYBase = scaleY(traj.baselineMPH.height);
    const rawYUnm = scaleY(traj.unmanaged.height);
    const labelYBase = Math.max(padding.top + 28, Math.min(height - padding.bottom - 28, rawYBase));
    const labelYOpt = Math.max(padding.top + 4, Math.min(labelYBase - 24, rawYOpt));
    const labelYUnm = Math.min(height - padding.bottom - 4, Math.max(labelYBase + 24, rawYUnm));

    // Mid-chart reference index (~144 months = 12 yrs) for P97/P50/P3 badges so they never collide with right-edge trajectory labels
    const refIdx = Math.max(0, normData.months.findIndex((m) => m >= 144));
    const refX = scaleX(normData.months[refIdx] || 144);
    const refYP97 = scaleY(normData.p97[refIdx] || 162);
    const refYP50 = scaleY(normData.p50[refIdx] || 150);
    const refYP3 = scaleY(normData.p3[refIdx] || 138);

    return `
      <svg viewBox="0 0 ${width} ${height}" class="growth-curve-svg" style="width: 100%; height: auto; max-height: 360px;" aria-label="3중 인터랙티브 임상 성장 곡선 차트">
        <defs>
          <linearGradient id="optZoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1D4ED8" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#93C5FD" stop-opacity="0.08" />
          </linearGradient>
          <filter id="glowPulse" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Grid Lines & Shaded Area -->
        <line x1="${padding.left}" y1="${scaleY(80)}" x2="${width - padding.right}" y2="${scaleY(80)}" stroke="#CBD5E1" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(100)}" x2="${width - padding.right}" y2="${scaleY(100)}" stroke="#CBD5E1" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(120)}" x2="${width - padding.right}" y2="${scaleY(120)}" stroke="#CBD5E1" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(140)}" x2="${width - padding.right}" y2="${scaleY(140)}" stroke="#CBD5E1" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(160)}" x2="${width - padding.right}" y2="${scaleY(160)}" stroke="#CBD5E1" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(180)}" x2="${width - padding.right}" y2="${scaleY(180)}" stroke="#CBD5E1" stroke-dasharray="3,3" />

        ${shadedAreaPath ? `<path d="${shadedAreaPath}" fill="url(#optZoneGrad)" class="trajectory-target-zone" />` : ''}

        <!-- Normative Reference Background Curves (P3, P50, P97) with non-overlapping mid-chart badges -->
        <path d="${pathP97}" fill="none" stroke="#64748B" stroke-width="1.3" stroke-dasharray="4,4" id="curve-p97" />
        <rect x="${(refX - 28).toFixed(1)}" y="${(refYP97 - 15).toFixed(1)}" width="56" height="15" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1" />
        <text x="${refX.toFixed(1)}" y="${(refYP97 - 4).toFixed(1)}" font-size="9.5" fill="#334155" font-weight="700" text-anchor="middle" font-family="monospace">P97 (97%)</text>

        <path d="${pathP50}" fill="none" stroke="#475569" stroke-width="1.8" id="curve-p50" />
        <rect x="${(refX - 28).toFixed(1)}" y="${(refYP50 - 7).toFixed(1)}" width="56" height="15" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1" />
        <text x="${refX.toFixed(1)}" y="${(refYP50 + 4).toFixed(1)}" font-size="9.5" fill="#0F172A" font-weight="800" text-anchor="middle" font-family="monospace">P50 (50%)</text>

        <path d="${pathP3}" fill="none" stroke="#64748B" stroke-width="1.3" stroke-dasharray="4,4" id="curve-p3" />
        <rect x="${(refX - 26).toFixed(1)}" y="${(refYP3 + 2).toFixed(1)}" width="52" height="15" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1" />
        <text x="${refX.toFixed(1)}" y="${(refYP3 + 13).toFixed(1)}" font-size="9.5" fill="#334155" font-weight="700" text-anchor="middle" font-family="monospace">P3 (3%)</text>

        <!-- 3 Color-Coded Trajectory Path Lines & Anti-Collision Right Badges -->
        <!-- 1. Optimized Intervention Trajectory (Cyan Blue #38BDF8) -->
        <path d="${pathOptimized}" fill="none" stroke="#1D4ED8" stroke-width="3" stroke-linecap="round" id="curve-optimized" />
        <line x1="${endX.toFixed(1)}" y1="${rawYOpt.toFixed(1)}" x2="${(endX + 8).toFixed(1)}" y2="${labelYOpt.toFixed(1)}" stroke="#1D4ED8" stroke-width="1.2" />
        <rect x="${(endX + 8).toFixed(1)}" y="${(labelYOpt - 11).toFixed(1)}" width="130" height="20" rx="6" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.2" />
        <text x="${(endX + 73).toFixed(1)}" y="${(labelYOpt + 3).toFixed(1)}" font-size="11" fill="#1D4ED8" font-weight="900" text-anchor="middle">최대 잠재 ${traj.optimized.height}cm</text>

        <!-- 2. Genetic Baseline Trajectory (Amber #F59E0B) -->
        <path d="${pathBaseline}" fill="none" stroke="#94A3B8" stroke-width="2.4" stroke-dasharray="5,3" stroke-linecap="round" id="curve-baseline" />
        <line x1="${endX.toFixed(1)}" y1="${rawYBase.toFixed(1)}" x2="${(endX + 8).toFixed(1)}" y2="${labelYBase.toFixed(1)}" stroke="#94A3B8" stroke-width="1.2" />
        <rect x="${(endX + 8).toFixed(1)}" y="${(labelYBase - 11).toFixed(1)}" width="130" height="20" rx="6" fill="#EFF6FF" stroke="#94A3B8" stroke-width="1.2" />
        <text x="${(endX + 73).toFixed(1)}" y="${(labelYBase + 3).toFixed(1)}" font-size="11" fill="#1D4ED8" font-weight="800" text-anchor="middle">유전 MPH ${traj.baselineMPH.height}cm</text>

        <!-- 3. Current Unmanaged Trajectory (Coral/Rose #F43F5E) -->
        <path d="${pathUnmanaged}" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" id="curve-unmanaged" />
        <line x1="${endX.toFixed(1)}" y1="${rawYUnm.toFixed(1)}" x2="${(endX + 8).toFixed(1)}" y2="${labelYUnm.toFixed(1)}" stroke="#94A3B8" stroke-width="1.2" />
        <rect x="${(endX + 8).toFixed(1)}" y="${(labelYUnm - 11).toFixed(1)}" width="130" height="20" rx="6" fill="#EFF6FF" stroke="#94A3B8" stroke-width="1.2" />
        <text x="${(endX + 73).toFixed(1)}" y="${(labelYUnm + 3).toFixed(1)}" font-size="11" fill="#1D4ED8" font-weight="800" text-anchor="middle">방치 손실 ${traj.unmanaged.height}cm</text>

        <!-- Axes -->
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#475569" stroke-width="1.5" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#475569" stroke-width="1.5" />

        <!-- X-Axis Age Ticks (1 to 20 yrs) -->
        <text x="${scaleX(24)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">2세</text>
        <text x="${scaleX(72)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">6세</text>
        <text x="${scaleX(120)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">10세</text>
        <text x="${scaleX(168)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">14세</text>
        <text x="${scaleX(216)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">18세</text>
        <text x="${scaleX(240)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">20세</text>

        <!-- Y-Axis Height Ticks -->
        <text x="${padding.left - 8}" y="${scaleY(80) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">80cm</text>
        <text x="${padding.left - 8}" y="${scaleY(100) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">100cm</text>
        <text x="${padding.left - 8}" y="${scaleY(120) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">120cm</text>
        <text x="${padding.left - 8}" y="${scaleY(140) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">140cm</text>
        <text x="${padding.left - 8}" y="${scaleY(160) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">160cm</text>
        <text x="${padding.left - 8}" y="${scaleY(180) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">180cm</text>

        <!-- Current Child Coordinate: Pulsing Bio-Emerald Point (#10B981) -->
        <circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="14" fill="#1D4ED8" fill-opacity="0.25">
          <animate attributeName="r" values="7;15;7" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="6" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="2.5" filter="url(#glowPulse)" />

        <!-- Tooltip Badge -->
        <g transform="translate(${Math.max(padding.left + 6, Math.min(width - padding.right - 140, curX - 68))}, ${Math.max(padding.top + 4, curY - 38)})">
          <rect x="0" y="0" width="136" height="26" rx="6" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.4" />
          <text x="68" y="17" font-size="11" font-weight="900" fill="#1D4ED8" text-anchor="middle">
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
        <div class="bento-card-sub" style="background: #FFFFFF; border-left: 4px solid #93C5FD; border-radius: 14px; padding: 1.05rem 1.15rem;">
          <div style="font-size: 0.98rem; font-weight: 900; color: #1D4ED8; margin-bottom: 0.35rem;">① 식단 &amp; 뼈성장 영양 핵심</div>
          <div style="font-size: 0.92rem; color: #0F172A; line-height: 1.55;">
            ${hasMilk 
              ? '• <strong>구연산 칼슘 · 어골칼슘(흡수율 45%)</strong> + 비타민D3·K2를 아침·저녁 보충해 우유 배앓이 없이 뼈 기질을 채워주세요.' 
              : '• <strong>구연산 칼슘 · 비타민D3(1000~2000IU) · 아연 · 초유</strong>를 아침·저녁 꾸준히 보충해 성장판 연골 증식을 돕습니다.'}
          </div>
        </div>

        <!-- Card 2: Sleep -->
        <div class="bento-card-sub" style="background: #FFFFFF; border-left: 4px solid #93C5FD; border-radius: 14px; padding: 1.05rem 1.15rem;">
          <div style="font-size: 0.98rem; font-weight: 900; color: #1D4ED8; margin-bottom: 0.35rem;">② 밤 10시 수면 골든타임</div>
          <div style="font-size: 0.92rem; color: #0F172A; line-height: 1.55;">
            ${hasLateSleep 
              ? '• 밤 10시~새벽 2시에 일일 성장호르몬의 <strong>65%가 분비</strong>됩니다. 21:45 소등 &amp; 취침 2시간 전 금식을 지켜주세요.' 
              : '• 취침 후 첫 90분 깊은 서파수면(SWS)에서 성장호르몬이 폭발합니다. 잠들기 전 5분 다리 마사지로 숙면을 유도하세요.'}
          </div>
        </div>

        <!-- Card 3: Posture -->
        <div class="bento-card-sub" style="background: #FFFFFF; border-left: 4px solid #93C5FD; border-radius: 14px; padding: 1.05rem 1.15rem;">
          <div style="font-size: 0.98rem; font-weight: 900; color: #1D4ED8; margin-bottom: 0.35rem;">③ 숨은 키 2cm 감압 &amp; 점핑</div>
          <div style="font-size: 0.92rem; color: #0F172A; line-height: 1.55;">
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
      <div style="background: #FFFFFF; border: 1.5px solid #BFDBFE; border-radius: 18px; padding: 1.2rem; margin-top: 1.15rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
          <h4 style="font-size: 1.02rem; font-weight: 900; color: #0F172A; margin: 0;">
            대한소아내분비학회 · 미국수면재단(NSF) 핵심 기준 요약
          </h4>
          <span style="background: #EFF6FF; color: #1D4ED8; font-size: 0.78rem; font-weight: 800; padding: 0.22rem 0.65rem; border-radius: 9999px;">
            ${velocityGuide.ageRangeLabel}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 12px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.84rem; color: #475569; font-weight: 800;">정상 성장속도 기준</span>
            <span style="font-size: 0.98rem; font-weight: 900; color: #1D4ED8;">${velocityGuide.normalVelocityCmPerYear}</span>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 12px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.84rem; color: #475569; font-weight: 800;">연령 권장 수면시간</span>
            <span style="font-size: 0.95rem; font-weight: 900; color: #1D4ED8;">${velocityGuide.sleepRecommendation}</span>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 12px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.84rem; color: #475569; font-weight: 800;">체질량지수 (BMI ${bmiInfo.bmi})</span>
            <span style="font-size: 0.95rem; font-weight: 900; color: ${bmiInfo.bmiBadgeColor};">${bmiInfo.bmiStatus} (연 4cm 미만 시 진료 권장)</span>
          </div>
        </div>
      </div>
    `;
  }

  // 14. Age-Appropriate Recommended Products & Compact Reference Section for Tab 1 (신체성장)
  function renderAcademicEvidenceSection(profile = {}) {
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));

    let ageBandTitle = `만 ${ageYears}세 맞춤`;
    let prod1, prod2, prod3;

    if (ageYears <= 3) {
      ageBandTitle = `만 ${ageYears}세(영유아기) 맞춤`;
      prod1 = {
        badge: `만 ${ageYears}세 맞춤 1위 · 액상 칼슘·D3`,
        title: '차일드라이프 액상 구연산 칼슘·마그네슘 오렌지맛 & 비타민D3 1000IU 드롭',
        desc: `생후 ${ageMonths}개월 영유아는 정제 알약 대신 위산과 무관하게 흡수되는 액상 구연산 칼슘과 비타민D3 드롭으로 기초 골격을 다져주어야 합니다.`,
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%B0%A8%EC%9D%BC%EB%93%9C%EB%9D%BC%EC%9D%B4%ED%94%84+%EC%95%A1%EC%83%81+%EC%B9%BC%EC%8A%98+%EB%A7%88%EA%B7%B8%EB%84%A4%EC%8A%98+%EB%B9%84%ED%83%80%EB%AF%BCD+%EC%9C%A0%EC%95%84',
        btnText: `쿠팡에서 만 ${ageYears}세 액상 칼슘·D3 보기 ↗`
      };
      prod2 = {
        badge: `만 ${ageYears}세 맞춤 2위 · 초유·아연 면역·식욕`,
        title: '일동후디스 하이키즈 초유 분말 / 영유아 글루콘산 아연·초유 스틱',
        desc: '편식·입짧음을 예방하고 성장호르몬 수용체(IGF-1) 활성과 기초 면역력을 동시에 챙겨주는 영유아 맞춤 초유·아연입니다.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%9C%A0%EC%95%84+%EC%B4%88%EC%9C%A0+%EB%B6%84%EB%A7%90+%EC%95%84%EC%97%B0+%EC%96%B4%EB%A6%B0%EC%9D%B4+%EC%98%81%EC%96%91%EC%A0%9C',
        btnText: `쿠팡에서 영유아 초유·아연 영양제 보기 ↗`
      };
      prod3 = {
        badge: `만 ${ageYears}세 맞춤 3위 · 안전 손잡이 트램폴린`,
        title: '멜킨 유아 안전 손잡이형 무소음 밴드 실내 트램폴린 & 초음파 신장계',
        desc: '영유아 소뇌 평형감각 발달과 하지 성장판 미세자극을 층간소음 없이 안전하게 도와주는 손잡이형 점핑 기구입니다.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EB%A9%9C%ED%82%88+%EC%9C%A0%EC%95%84+%EC%95%88%EC%A0%84+%EC%86%90%EC%9E%A1%EC%9D%B4+%EB%AC%B4%EC%86%8C%EC%9D%8C+%EC%8B%A4%EB%82%B4+%ED%8A%B8%EB%9E%A8%ED%8F%B4%EB%A6%B0',
        btnText: `쿠팡에서 유아 손잡이 트램폴린 보기 ↗`
      };
    } else if (ageYears <= 6) {
      ageBandTitle = `만 ${ageYears}세(유아·유치원기) 맞춤`;
      prod1 = {
        badge: `만 ${ageYears}세 맞춤 1위 · 키성장 기능성 젤리/분말`,
        title: '종근당건강 아이커 / 키클래오042 (식약처 인정 HT042 황기추출물 + 칼슘·비타민D·아연)',
        desc: `만 ${ageYears}세 유아기 하지 성장판 연골세포 증식 인자(IGF-1)를 깨워주는 식약처 인정 원료! 우유나 간식처럼 맛있게 챙기는 1위 제품입니다.`,
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%A2%85%EA%B7%BC%EB%8B%B9%EA%B1%B4%EA%B0%95+%EC%95%84%EC%9D%B4%EC%BB%A4+HT042+%ED%99%A9%EA%B8%B0%EC%B6%94%EC%B6%9C%EB%AC%BC+%ED%82%A4%EC%84%B1%EC%9E%A5',
        btnText: `쿠팡에서 만 ${ageYears}세 HT042 키성장 영양제 보기 ↗`
      };
      prod2 = {
        badge: `만 ${ageYears}세 맞춤 2위 · 츄어블 칼슘 올인원`,
        title: '뉴질랜드 초유 칼슘·어골칼슘 + 비타민D3·아연·마그네슘 오렌지맛 츄어블',
        desc: '알약을 삼키기 힘든 유아도 사탕처럼 맛있게 씹어 먹으며 칼슘·초유·비타민D3·아연을 한 번에 채우는 스테디셀러입니다.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EB%89%B4%EC%A7%88%EB%9E%9C%EB%93%9C+%EC%B4%88%EC%9C%A0+%EC%B9%BC%EC%8A%98+%EB%B9%84%ED%83%80%EB%AF%BCD+%EC%95%84%EC%97%B0+%EC%96%B4%EB%A6%B0%EC%9D%B4+%EC%B8%84%EC%96%B4%EB%B8%94',
        btnText: `쿠팡에서 유아 초유·칼슘 츄어블 보기 ↗`
      };
      prod3 = {
        badge: `만 ${ageYears}세 맞춤 3위 · 무소음 점핑 트램폴린`,
        title: '층간소음 방어 어린이 실내 무소음 점핑 트램폴린 & 초음파 디지털 신장계',
        desc: '하루 15분 수직 점핑(볼프의 법칙)으로 대퇴골·경골 성장판을 자극하고 매달 1일 아침 키를 0.1cm 단위로 측정합니다.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%96%B4%EB%A6%B0%EC%9D%B4+%EB%AC%B4%EC%86%8C%EC%9D%8C+%EC%8B%A4%EB%82%B4+%ED%8A%B8%EB%9E%A8%ED%8F%B4%EB%A6%B0+%EC%A0%90%ED%95%91%EB%A7%A4%ED%8A%B8',
        btnText: `쿠팡에서 어린이 무소음 트램폴린 보기 ↗`
      };
    } else if (ageYears <= 10) {
      ageBandTitle = `만 ${ageYears}세(초등 학령기) 맞춤`;
      prod1 = {
        badge: `만 ${ageYears}세 맞춤 1위 · 사춘기 전 기초키 확보`,
        title: '종근당건강 아이커 / 키즈텐042 (식약처 인정 HT042 황기추출물 + 칼슘·비타민D·아연)',
        desc: `사춘기 급성장기 진입 전 기초 신장을 최대한 높여주어야 하는 만 ${ageYears}세 초등 핵심 기능성 원료입니다.`,
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%A2%85%EA%B7%BC%EB%8B%B9%EA%B1%B4%EA%B0%95+%EC%95%84%EC%9D%B4%EC%BB%A4+HT042+%ED%99%A9%EA%B8%B0%EC%B6%94%EC%B6%9C%EB%AC%BC+%ED%82%A4%EC%84%B1%EC%9E%A5',
        btnText: `쿠팡에서 초등 HT042 키성장 영양제 보기 ↗`
      };
      prod2 = {
        badge: `만 ${ageYears}세 맞춤 2위 · 고흡수 어골·연골칼슘`,
        title: '초등 고흡수 비소성 어골·연골칼슘(800mg) + 비타민D3·K2·아연·마그네슘',
        desc: '초등 시기 급격히 늘어나는 뼈 길이 성장을 단단한 골기질로 채워주는 생체흡수율 45% 칼슘·D3·K2 배합입니다.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%96%B4%EB%A6%B0%EC%9D%B4+%EC%96%B4%EA%B3%A8%EC%B9%BC%EC%8A%98+%EC%97%B0%EA%B3%A8%EC%B9%BC%EC%8A%98+%EB%B9%84%ED%83%80%EB%AF%BCD3+K2+%EC%95%84%EC%97%B0',
        btnText: `쿠팡에서 초등 어골·연골칼슘 보기 ↗`
      };
      prod3 = {
        badge: `만 ${ageYears}세 맞춤 3위 · 초음파 신장계 & 카운터 줄넘기`,
        title: '인바디 초음파 디지털 신장계(1초 정밀 키재기) & 초등 디지털 카운터 줄넘기',
        desc: '초등 줄넘기 급수제 대비 하루 500회 점핑으로 성장판을 자극하고, 매월 1일 아침 성장속도(cm/년)를 정밀 측정합니다.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%9D%B8%EB%B0%94%EB%94%94+%EC%B4%88%EC%9D%8C%ED%8C%8C+%EC%8B%A0%EC%9E%A5%EA%B3%84+%EC%96%B4%EB%A6%B0%EC%9D%B4+%EB%94%94%EC%A7%80%ED%84%B8+%ED%82%A4%EC%9E%AC%EA%B8%B0',
        btnText: `쿠팡에서 초음파 신장계·줄넘기 보기 ↗`
      };
    } else {
      ageBandTitle = `만 ${ageYears}세(초등 고학년·청소년 급성장기) 맞춤`;
      prod1 = {
        badge: `만 ${ageYears}세 급성장 1위 · HT042 & 고함량 칼슘`,
        title: '식약처 인정 HT042 황기추출물 + 청소년 고함량 어골·연골칼슘(1100mg)·아르기닌',
        desc: `성장판이 닫히기 전 마지막 골든타임(만 ${ageYears}세)에 폭발하는 뼈 성장 요구량을 채워주는 고함량 집중 배합입니다.`,
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%A2%85%EA%B7%BC%EB%8B%B9%EA%B1%B4%EA%B0%95+%EC%95%84%EC%9D%B4%EC%BB%A4+HT042+%ED%99%A9%EA%B8%B0%EC%B6%94%EC%B6%9C%EB%AC%BC+%ED%82%A4%EC%84%B1%EC%9E%A5',
        btnText: `쿠팡에서 청소년 HT042·고함량 칼슘 보기 ↗`
      };
      prod2 = {
        badge: `만 ${ageYears}세 맞춤 2위 · 심야 수면·성장통 마그네슘`,
        title: '청소년 킬레이트 글리시네이트 마그네슘·타트체리 슬립케어 & 비타민D3·K2',
        desc: '학원·학업 스트레스로 늦게 자는 청소년의 서파수면(SWS) 성장호르몬 피크를 회복시키고 다리 성장통을 완화합니다.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%B2%AD%EC%86%8C%EB%85%84+%EB%A7%88%EA%B7%B8%EB%84%A4%EC%8A%98+%ED%83%80%ED%8A%B8%EC%B2%B4%EB%A6%AC+%EC%96%B4%EA%B3%A8%EC%B9%BC%EC%8A%98+%EB%B9%84%ED%83%80%EB%AF%BCD',
        btnText: `쿠팡에서 청소년 수면·마그네슘 칼슘 보기 ↗`
      };
      prod3 = {
        badge: `만 ${ageYears}세 맞춤 3위 · 숨은키 +1.8cm 문틀 철봉`,
        title: '무타공 안전 잠금 실내 문틀 철봉(데드행 바) & 척추 신전 고밀도 EPP 폼롤러',
        desc: '하루 종일 책상에 앉아 눌린 척추 디스크를 저녁 90초 매달리기(Dead Hang)로 감압해 숨은 키 1.8~2.2cm를 즉시 복원합니다.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EB%AC%B4%ED%83%80%EA%B3%B5+%EC%95%88%EC%A0%84+%EC%9E%A0%EA%B8%88+%EB%AC%B8%ED%8B%80+%EC%B2%A0%EB%B4%89+%EC%8B%A4%EB%82%B4+%ED%84%B1%EA%B1%B8%EC%9D%B4%EB%B4%89+%ED%8F%BC%EB%A1%A4%EB%9F%AC',
        btnText: `쿠팡에서 문틀 철봉·척추 폼롤러 보기 ↗`
      };
    }

    return `
      <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 0.85rem 1.1rem; margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span style="font-size: 0.86rem; font-weight: 800; color: #1D4ED8;">동료심사(Peer-Reviewed) 학술 논문 임상 근거: 질병관리청(KDCA 2017) 및 황기추출물(HT042) 임상</span>
        <a href="https://pubmed.ncbi.nlm.nih.gov/25374566/" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; color: #1D4ED8; font-weight: 800; text-decoration: none;">PMID:25374566 원문 ↗</a>
      </div>

      <!-- Bottom Recommended Products for Core 1 (Age-Tailored & Hidden by default so pure report shows first) -->
      <div id="core-1-recommended-products" class="curated-product-recommendation-section growth-product-section" style="display: none; background: #FFFFFF; border: 1.5px solid #BFDBFE; border-radius: 18px; padding: 1.25rem; margin-top: 1.25rem; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem;">
          <h4 style="font-size: 1.1rem; font-weight: 900; color: #1D4ED8; margin: 0;">
            [${ageBandTitle}] 신체성장 · 숨은 키 목표 달성 엄선 추천 상품 TOP 3
          </h4>
          <span style="font-size: 0.8rem; color: #1D4ED8; font-weight: 800;">만 ${ageYears}세(${ageMonths}개월) 연령별 발달 단계 1:1 맞춤 큐레이션</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <!-- Product 1 -->
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 14px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 0.76rem; font-weight: 900; color: #1D4ED8; background: #EFF6FF; padding: 0.18rem 0.55rem; border-radius: 9999px;">${prod1.badge}</span>
              <div style="font-size: 1.0rem; font-weight: 900; color: #0F172A; margin: 0.45rem 0 0.35rem; line-height: 1.4;">${prod1.title}</div>
              <p style="font-size: 0.86rem; color: #0F172A; line-height: 1.5; margin: 0 0 0.75rem 0;">${prod1.desc}</p>
            </div>
            <a href="${prod1.url}" target="_blank" rel="noopener noreferrer" id="ref-chip-growth" class="reference-chip mobile-touch-btn" style="display: flex; min-height: 44px; align-items: center; justify-content: center; background: #FFFFFF; color: #0F172A; font-size: 0.88rem; font-weight: 900; padding: 0.55rem 0.85rem; border-radius: 10px; text-decoration: none;">
              ${prod1.btnText}
            </a>
          </div>

          <!-- Product 2 -->
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 14px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 0.76rem; font-weight: 900; color: #1D4ED8; background: #EFF6FF; padding: 0.18rem 0.55rem; border-radius: 9999px;">${prod2.badge}</span>
              <div style="font-size: 1.0rem; font-weight: 900; color: #0F172A; margin: 0.45rem 0 0.35rem; line-height: 1.4;">${prod2.title}</div>
              <p style="font-size: 0.86rem; color: #0F172A; line-height: 1.5; margin: 0 0 0.75rem 0;">${prod2.desc}</p>
            </div>
            <a href="${prod2.url}" target="_blank" rel="noopener noreferrer" class="mobile-touch-btn" style="display: flex; min-height: 44px; align-items: center; justify-content: center; background: #EFF6FF; border: 1px solid #93C5FD; color: #1D4ED8; font-size: 0.88rem; font-weight: 900; padding: 0.55rem 0.85rem; border-radius: 10px; text-decoration: none;">
              ${prod2.btnText}
            </a>
          </div>

          <!-- Product 3 -->
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 14px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 0.76rem; font-weight: 900; color: #1D4ED8; background: #EFF6FF; padding: 0.18rem 0.55rem; border-radius: 9999px;">${prod3.badge}</span>
              <div style="font-size: 1.0rem; font-weight: 900; color: #0F172A; margin: 0.45rem 0 0.35rem; line-height: 1.4;">${prod3.title}</div>
              <p style="font-size: 0.86rem; color: #0F172A; line-height: 1.5; margin: 0 0 0.75rem 0;">${prod3.desc}</p>
            </div>
            <a href="${prod3.url}" target="_blank" rel="noopener noreferrer" class="mobile-touch-btn" style="display: flex; min-height: 44px; align-items: center; justify-content: center; background: #EFF6FF; border: 1px solid #93C5FD; color: #1D4ED8; font-size: 0.88rem; font-weight: 900; padding: 0.55rem 0.85rem; border-radius: 10px; text-decoration: none;">
              ${prod3.btnText}
            </a>
          </div>
        </div>
        <div style="margin-top: 0.85rem; padding-top: 0.65rem; border-top: 1px dashed #BFDBFE; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; font-size: 0.76rem; color: #475569;">
          <span>학술 레퍼런스: Kim JH et al. (2018) 2017 Korean National Growth Charts · Lee D et al. HT042 Clinical Trial</span>
          <a href="https://pubmed.ncbi.nlm.nih.gov/29628905/" target="_blank" rel="noopener noreferrer" style="color: #1D4ED8; text-decoration: underline;">PubMed PMID: 29628905 ↗</a>
        </div>
      </div>
    `;
  }

  // 14-B. 3-Tier Weight & Body Composition Balance Card (Matches Height 3-Tier Card)
  function render3TierWeightCard(profile, bmiInfo, pred, gender) {
    const curW = bmiInfo.currentWeight || Number(profile.currentWeight) || 35.5;
    const stdW = bmiInfo.standardWeight || 35.5;
    const optW = bmiInfo.optimalWeightForHeight || stdW;
    const target6mW = bmiInfo.targetWeight6m || Math.round((optW + 1.5) * 10) / 10;
    const curH = Number(profile.currentHeight) || 137.0;
    const wTop = bmiInfo.weightTopPercent !== undefined ? bmiInfo.weightTopPercent : 50.0;
    const wPct = bmiInfo.weightPercentile !== undefined ? bmiInfo.weightPercentile : 50.0;
    const wDelta = bmiInfo.weightDelta !== undefined ? bmiInfo.weightDelta : 0.0;
    const wDeltaStr = wDelta >= 0 ? `+${wDelta}kg` : `${wDelta}kg`;
    const optDelta = bmiInfo.weightVsHeightDelta !== undefined ? bmiInfo.weightVsHeightDelta : 0.0;
    const optDeltaStr = optDelta >= 0 ? `+${optDelta}kg` : `${optDelta}kg`;

    const maxRefW = Math.max(curW, stdW, optW, target6mW) * 1.18;
    const minRefW = Math.max(2.0, Math.min(curW, stdW, optW) * 0.65);
    const calcWWidth = (val) => Math.max(18, Math.min(100, Math.round(((val - minRefW) / Math.max(4, maxRefW - minRefW)) * 100)));

    const wStdPct = calcWWidth(stdW);
    const wCurPct = calcWWidth(curW);
    const wOptPct = calcWWidth(optW);
    const wTargetPct = calcWWidth(target6mW);

    return `
      <div id="weight-3tier-analysis-card" style="background: #FFFFFF; border: 1.5px solid #BFDBFE; border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
          <div>
            <h4 style="font-size: 1.05rem; font-weight: 800; margin: 0; color: #0F172A;">
              우리 아이 몸무게 &amp; 체질량(BMI) 3단 밸런스 비교 (키 성장 연동 진단)
            </h4>
            <p style="font-size: 0.82rem; color: #334155; margin: 0.2rem 0 0 0;">
              질병관리청(KDCA) 또래 평균 몸무게 · 현재 키(${curH}cm) 맞춤 적정 몸무게 · 6개월 후 목표 몸무게
            </p>
          </div>
          <span style="background: #EFF6FF; border: 1px solid ${bmiInfo.bmiBadgeColor}; color: ${bmiInfo.bmiBadgeColor}; font-size: 0.8rem; font-weight: 900; padding: 0.28rem 0.75rem; border-radius: 9999px;">
            BMI ${bmiInfo.bmi} · ${bmiInfo.bmiShortStatus || bmiInfo.bmiStatus}
          </span>
        </div>

        <div class="predicted-bars-container">
          <!-- Weight Bar 1: KDCA Peer Standard Weight -->
          <div class="predicted-bar-row">
            <div class="predicted-bar-header">
              <span class="bar-title">① 동월령 또래 표준 평균 몸무게 (KDCA 50백분위)</span>
              <span class="bar-val">${stdW}kg</span>
            </div>
            <div class="predicted-bar-track">
              <div class="predicted-bar-fill bar-fill-mph" style="width: ${wStdPct}%;"></div>
            </div>
            <div class="predicted-bar-caption">질병관리청 성장도표 기준 같은 개월 수 ${gender === 'boy' ? '남아' : '여아'}의 표준 중앙값 체중</div>
          </div>

          <!-- Weight Bar 2: Current Child Weight -->
          <div class="predicted-bar-row" style="margin-top: 1rem;">
            <div class="predicted-bar-header">
              <span class="bar-title">② 현재 우리 아이 몸무게 (상위 ${wTop}% · ${wPct}백분위)</span>
              <span class="bar-val" style="color: ${bmiInfo.bmiBadgeColor};">${curW}kg <small style="font-size: 0.84rem;">(또래 평균 대비 ${wDeltaStr} / 현재 키 적정 대비 ${optDeltaStr})</small></span>
            </div>
            <div class="predicted-bar-track">
              <div class="predicted-bar-fill" style="width: ${wCurPct}%; background: ${bmiInfo.bmiBadgeColor};"></div>
            </div>
            <div class="predicted-bar-caption">${bmiInfo.bmiNote}</div>
          </div>

          <!-- Weight Bar 3: Optimal Weight for Current Height & 6-Month Goal -->
          <div class="predicted-bar-row" style="margin-top: 1rem;">
            <div class="predicted-bar-header">
              <span class="bar-title">③ 현재 키(${curH}cm) 맞춤 적정 몸무게 → 6개월 후 목표</span>
              <span class="bar-val bar-val-mint">적정 ${optW}kg <small style="color: #1D4ED8; font-size: 0.88rem; font-weight: 800;">→ 6개월 후 ${target6mW}kg</small></span>
            </div>
            <div class="predicted-bar-track">
              <div class="predicted-bar-fill bar-fill-mint" style="width: ${Math.max(wOptPct, wTargetPct)}%;"></div>
            </div>
            <div class="predicted-bar-caption">성조숙증(체지방 과다)과 영양 부족 없이 잠재키(${pred.potentialHeight}cm)까지 가장 잘 자라는 황금 체중 궤적</div>
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
    const pred = calculateHeightPrediction(mphObj.mph, profile.habits, profile.tannerPhase || profile.pubertyStage, ageMonths, gender);

    const deltaSign = kdca.deltaMedian >= 0 ? `+${kdca.deltaMedian}` : `${kdca.deltaMedian}`;
    const wDeltaSign = bmiInfo.weightDelta >= 0 ? `+${bmiInfo.weightDelta}` : `${bmiInfo.weightDelta}`;
    const genderKorean = gender === 'boy' ? '남아' : '여아';
    const vel = calculateVelocity(profile.recentGrowth6m || 3.0, Math.round(ageMonths / 12));

    return `
      <!-- Core 1 Container -->
      <div id="core-1-container" class="core-module-container">

        <!-- Big Stats Bento Header (2x2 Grid — 2 Cards Per Row Filling the Screen Cleanly) -->
        <div class="growth-stats-grid" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 0.85rem;">
          <div class="stat-card" style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 1.15rem 0.9rem; text-align: center;">
            <span style="font-size: 0.84rem; font-weight: 800; color: var(--cyan-pulse, #38BDF8);">키·몸무게 백분위</span>
            <div style="font-size: 1.55rem; font-weight: 900; color: var(--cyan-pulse, #38BDF8); margin: 0.3rem 0;">키 상위 ${kdca.topPercent}%</div>
            <span style="font-size: 0.8rem; color: #0F172A; font-weight: 700; display: block;">몸무게 상위 ${bmiInfo.weightTopPercent}% (${bmiInfo.currentWeight}kg)</span>
            <span style="font-size: 0.75rem; color: #334155;">키 ${kdca.percentile}th · 체중 ${bmiInfo.weightPercentile}th Pct</span>
          </div>

          <div class="stat-card" style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 1.15rem 0.9rem; text-align: center;">
            <span style="font-size: 0.84rem; font-weight: 800; color: var(--growth-mint, #10B981);">연간 성장속도</span>
            <div style="font-size: 1.55rem; font-weight: 900; color: ${vel.alert ? '#1D4ED8' : 'var(--growth-mint, #10B981)'}; margin: 0.3rem 0;">
              ${vel.velocityCmPerYear} cm/년
            </div>
            <span style="font-size: 0.8rem; color: #0F172A; font-weight: 700; display: block;">적정체중 ${bmiInfo.optimalWeightForHeight}kg 기준</span>
            <span style="font-size: 0.75rem; color: ${vel.alert ? '#1D4ED8' : 'var(--text-secondary)'};">
              ${vel.alert ? '저성장 주의 (<4.0cm/yr)' : vel.status === 'accelerated' ? '급성장 가속 피크' : '정상 성장 궤도'}
            </span>
          </div>

          <div class="stat-card" style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 1.15rem 0.9rem; text-align: center;">
            <span style="font-size: 0.84rem; font-weight: 800; color: var(--amber-caution, #F59E0B);">유전 표적키 (MPH)</span>
            <div style="font-size: 1.55rem; font-weight: 900; color: var(--amber-caution, #F59E0B); margin: 0.3rem 0;">${mphObj.mph}cm</div>
            <span style="font-size: 0.8rem; color: #1D4ED8; font-weight: 700; display: block;">잠재키 최대 ${pred.potentialHeight}cm</span>
            <span style="font-size: 0.75rem; color: #334155;">${mphObj.rangeStr} (±8.5cm)</span>
          </div>

          <div class="stat-card" style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 1.15rem 0.9rem; text-align: center;">
            <span style="font-size: 0.84rem; font-weight: 800; color: var(--rose-alert, #F43F5E);">성장판 잔여 기간</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: var(--rose-alert, #F43F5E); margin: 0.35rem 0;">
              ${pred.windowHeadline || pred.monthsRemaining.split('(')[0].trim()}
            </div>
            <span style="font-size: 0.78rem; color: #1D4ED8; font-weight: 700; display: block;">${pred.windowSubLabel || ''}</span>
          </div>
        </div>

        <!-- Clear Clinical Explanation of Growth Plate Remaining Window -->
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 0.8rem 1rem; margin-bottom: 1.25rem; font-size: 0.84rem; color: #0F172A; line-height: 1.55;">
          <strong style="color: #1D4ED8;">[골든타임 성장판 잔여 기간이란?]</strong> 뼈 끝의 연골 성장판이 완전히 닫혀 키 성장이 멈추는 시기(${gender === 'boy' ? '남아 평균 만 16.5~17세' : '여아 평균 만 14.5~15세'})까지 <strong>실제로 키가 더 자랄 수 있는 남은 시간</strong>입니다. ${pred.windowMeaningKo || ''}
        </div>

        <!-- High-Resolution Interactive 3-Curve SVG Chart Card -->
        <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
            <div>
              <h4 style="font-size: 1.1rem; font-weight: 800; margin: 0; color: #0F172A;">
                3중 성인 예측키 성장 궤적 곡선 (Auxology Trajectory)
              </h4>
              <p style="font-size: 0.82rem; color: #334155; margin: 0.2rem 0 0 0;">
                현재 나이(${Math.round(ageMonths / 12)}세)부터 만 20세까지 3가지 성장 경로 시뮬레이션
              </p>
            </div>
            <div style="display: flex; gap: 0.85rem; font-size: 0.78rem; font-weight: 700;">
              <span style="color: #1D4ED8;">● 최대 잠재 궤적</span>
              <span style="color: #1D4ED8;">● 유전 기준(MPH)</span>
              <span style="color: #1D4ED8;">● 방치 손실 궤적</span>
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
        <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <h4 style="font-size: 1.05rem; font-weight: 800; margin: 0 0 1rem 0; color: #0F172A;">
            성인 예측키 3단 비교 (유전 MPH vs 현재 습관 유지 vs 골든타임 최적화)
          </h4>
          ${render3TierBarChart(pred)}
        </div>

        <!-- 3-Tier Weight & BMI Balance Card (Same Depth as Height!) -->
        ${render3TierWeightCard(profile, bmiInfo, pred, gender)}

        <!-- Official Pediatric Authority Guidance -->
        ${renderOfficialClinicalAndNutritionBox(ageMonths, bmiInfo)}

        <!-- 3 Habit Prescriptive Coaching Cards -->
        <div style="margin-top: 1.5rem;">
          <h4 style="font-size: 1.05rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #0F172A;">
            성장 방해 생체 요인별 임상 프로토콜
          </h4>
          ${renderCoachingCards(profile.habits)}
        </div>

        ${renderAcademicEvidenceSection(profile)}

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
    calculateRemainingGrowthWindow,
    calculateHeightPrediction,
    getGrowthCurveData,
    renderSvgGrowthCurve,
    render3TierBarChart,
    render3TierWeightCard,
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
