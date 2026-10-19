/**
 * KidsFit Growth Studio - Growth Engine (src/js/growth-engine.js)
 * Implements KDCA 2017 LMS Box-Cox Z-Score & erf normal CDF percentiles,
 * Tanner Mid-Parental Height (MPH), 3-tier height chart, and SVG growth curve rendering.
 */

(function (global) {
  'use strict';

  // 1. Data Loader (Node.js require or Browser global/embedded)
  let growthData = null;
  if (typeof require !== 'undefined') {
    try {
      growthData = require('../data/growth-standards.json');
    } catch (e) {
      // fallback
    }
  }
  if (!growthData && typeof window !== 'undefined' && window.KIDSFIT_GROWTH_DATA) {
    growthData = window.KIDSFIT_GROWTH_DATA;
  }

  // Fallback representative tables if json not loaded
  const FALLBACK_KDCA = {
    boy: [
      { m: 12, L: 1.0, M: 75.7, S: 0.0337, p3: 71.0, p50: 75.7, p97: 80.5 },
      { m: 18, L: 1.0, M: 82.3, S: 0.0352, p3: 76.9, p50: 82.3, p97: 87.8 },
      { m: 24, L: 1.0, M: 87.1, S: 0.0371, p3: 81.0, p50: 87.1, p97: 93.2 },
      { m: 30, L: 1.0, M: 91.9, S: 0.0385, p3: 85.3, p50: 91.9, p97: 98.6 },
      { m: 36, L: 1.0, M: 96.5, S: 0.0401, p3: 89.7, p50: 96.5, p97: 104.4 },
      { m: 42, L: 1.0, M: 99.8, S: 0.0408, p3: 92.7, p50: 99.8, p97: 107.8 },
      { m: 48, L: 1.0, M: 103.1, S: 0.0416, p3: 95.6, p50: 103.1, p97: 111.2 },
      { m: 54, L: 1.0, M: 106.3, S: 0.0423, p3: 98.6, p50: 106.3, p97: 114.7 },
      { m: 60, L: 1.0, M: 109.6, S: 0.0429, p3: 101.6, p50: 109.6, p97: 118.0 },
      { m: 72, L: 1.0, M: 115.5, S: 0.0441, p3: 106.7, p50: 115.5, p97: 124.5 },
      { m: 84, L: 1.0, M: 121.1, S: 0.0453, p3: 111.5, p50: 121.1, p97: 130.9 },
      { m: 96, L: 1.0, M: 126.5, S: 0.0468, p3: 116.0, p50: 126.5, p97: 137.1 },
      { m: 108, L: 1.0, M: 131.7, S: 0.0483, p3: 120.3, p50: 131.7, p97: 143.3 },
      { m: 120, L: 1.0, M: 137.0, S: 0.0498, p3: 124.5, p50: 137.0, p97: 149.7 },
      { m: 132, L: 1.0, M: 142.5, S: 0.0521, p3: 128.8, p50: 142.5, p97: 156.4 },
      { m: 144, L: 1.0, M: 148.7, S: 0.0545, p3: 133.5, p50: 148.7, p97: 163.9 },
      { m: 156, L: 1.0, M: 155.6, S: 0.0558, p3: 138.9, p50: 155.6, p97: 171.9 },
      { m: 168, L: 1.0, M: 162.4, S: 0.0560, p3: 145.1, p50: 162.4, p97: 179.5 },
      { m: 180, L: 1.0, M: 167.4, S: 0.0489, p3: 151.3, p50: 167.4, p97: 182.2 },
      { m: 192, L: 1.0, M: 170.0, S: 0.0441, p3: 155.7, p50: 170.0, p97: 184.1 },
      { m: 204, L: 1.0, M: 171.4, S: 0.0436, p3: 157.9, p50: 171.4, p97: 185.5 },
      { m: 216, L: 1.0, M: 172.0, S: 0.0430, p3: 158.6, p50: 172.0, p97: 185.8 }
    ],
    girl: [
      { m: 12, L: 1.0, M: 74.0, S: 0.0349, p3: 69.2, p50: 74.0, p97: 78.9 },
      { m: 18, L: 1.0, M: 80.7, S: 0.0366, p3: 75.2, p50: 80.7, p97: 86.3 },
      { m: 24, L: 1.0, M: 85.7, S: 0.0384, p3: 79.3, p50: 85.7, p97: 92.1 },
      { m: 30, L: 1.0, M: 90.7, S: 0.0396, p3: 84.0, p50: 90.7, p97: 97.4 },
      { m: 36, L: 1.0, M: 95.4, S: 0.0409, p3: 88.1, p50: 95.4, p97: 103.0 },
      { m: 42, L: 1.0, M: 98.8, S: 0.0415, p3: 91.3, p50: 98.8, p97: 106.6 },
      { m: 48, L: 1.0, M: 102.2, S: 0.0422, p3: 94.4, p50: 102.2, p97: 110.1 },
      { m: 54, L: 1.0, M: 105.3, S: 0.0428, p3: 97.2, p50: 105.3, p97: 113.6 },
      { m: 60, L: 1.0, M: 108.4, S: 0.0435, p3: 99.9, p50: 108.4, p97: 117.0 },
      { m: 72, L: 1.0, M: 114.7, S: 0.0445, p3: 106.6, p50: 114.7, p97: 123.3 },
      { m: 84, L: 1.0, M: 120.8, S: 0.0460, p3: 112.2, p50: 120.8, p97: 130.2 },
      { m: 96, L: 1.0, M: 126.7, S: 0.0478, p3: 117.5, p50: 126.7, p97: 137.1 },
      { m: 108, L: 1.0, M: 132.6, S: 0.0501, p3: 122.8, p50: 132.6, p97: 144.1 },
      { m: 120, L: 1.0, M: 139.1, S: 0.0526, p3: 128.2, p50: 139.1, p97: 151.2 },
      { m: 132, L: 1.0, M: 145.8, S: 0.0532, p3: 133.8, p50: 145.8, p97: 157.6 },
      { m: 144, L: 1.0, M: 151.7, S: 0.0494, p3: 139.5, p50: 151.7, p97: 162.6 },
      { m: 156, L: 1.0, M: 155.9, S: 0.0438, p3: 144.7, p50: 155.9, p97: 166.0 },
      { m: 168, L: 1.0, M: 158.3, S: 0.0416, p3: 147.9, p50: 158.3, p97: 168.1 },
      { m: 180, L: 1.0, M: 159.5, S: 0.0408, p3: 149.3, p50: 159.5, p97: 169.2 },
      { m: 192, L: 1.0, M: 160.0, S: 0.0403, p3: 150.3, p50: 160.0, p97: 169.8 },
      { "m": 204, L: 1.0, M: 160.2, S: 0.0400, p3: 151.0, p50: 160.2, p97: 170.1 },
      { "m": 216, L: 1.0, M: 160.3, S: 0.0398, p3: 151.2, p50: 160.3, p97: 170.2 }
    ]
  };

  function getStandardsTable(gender) {
    if (growthData && growthData[gender]) {
      return growthData[gender];
    }
    return FALLBACK_KDCA[gender] || FALLBACK_KDCA.boy;
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
    return 0.5 * (1.0 + erf(z / Math.SQRT2));
  }

  // 3. Interpolate LMS for any arbitrary month (12~216)
  function getLmsForMonth(gender, months) {
    const table = getStandardsTable(gender);
    const clampedM = Math.max(12, Math.min(216, months));

    if (clampedM <= table[0].m) return table[0];
    if (clampedM >= table[table.length - 1].m) return table[table.length - 1];

    for (let i = 0; i < table.length - 1; i++) {
      const r1 = table[i];
      const r2 = table[i + 1];
      if (clampedM >= r1.m && clampedM <= r2.m) {
        const alpha = (clampedM - r1.m) / (r2.m - r1.m);
        return {
          m: clampedM,
          L: (1 - alpha) * r1.L + alpha * r2.L,
          M: (1 - alpha) * r1.M + alpha * r2.M,
          S: (1 - alpha) * r1.S + alpha * r2.S,
          p3: (1 - alpha) * r1.p3 + alpha * r2.p3,
          p50: (1 - alpha) * r1.p50 + alpha * r2.p50,
          p97: (1 - alpha) * r1.p97 + alpha * r2.p97
        };
      }
    }
    return table[0];
  }

  // 4. KDCA LMS Percentile Calculator
  function calculateKdcaPercentile(val, L, M, S) {
    let z;
    if (Math.abs(L) < 0.0001) {
      z = Math.log(val / M) / S;
    } else {
      z = (Math.pow(val / M, L) - 1.0) / (L * S);
    }
    const rawP = normalCDF(z) * 100;
    const percentile = Math.min(99.9, Math.max(0.1, Math.round(rawP * 10) / 10));
    const topPercent = Math.round((100 - percentile) * 10) / 10;
    const deltaMedian = Math.round((val - M) * 10) / 10;
    return {
      zScore: Math.round(z * 100) / 100,
      percentile,
      topPercent,
      deltaMedian
    };
  }

  // 5. Tanner Mid-Parental Height (MPH) Formula
  function calculateMph(fatherHeight, motherHeight, gender) {
    const f = (!fatherHeight || fatherHeight <= 0) ? 173.5 : fatherHeight;
    const m = (!motherHeight || motherHeight <= 0) ? 161.0 : motherHeight;

    if (gender === 'boy') {
      return Math.round(((f + m + 13.0) / 2.0) * 10) / 10;
    } else {
      return Math.round(((f + m - 13.0) / 2.0) * 10) / 10;
    }
  }

  // 6. Growth Inhibiting Habits Penalty Map
  const HABIT_LOSS_MAP = {
    late_sleep: 1.5,
    poor_posture: 1.2,
    picky_eater: 1.3,
    milk_trouble: 0.8,
    obesity_risk: 1.7
  };

  // 7. 3-Tier Predicted Height Bar Calculations
  function calculateHeightPrediction(mph, habits = [], pubertyStage = 'none') {
    let loss = 0;
    habits.forEach((h) => {
      if (HABIT_LOSS_MAP[h]) loss += HABIT_LOSS_MAP[h];
    });
    // Cap at -5.0cm max penalty
    const unmanagedLoss = Math.min(5.0, Math.round(loss * 10) / 10);
    const unmanagedHeight = Math.round((mph - unmanagedLoss) * 10) / 10;

    let goldenBoost = 5.0;
    let monthsRemaining = '약 36~48개월 (성장판 여유 / 기초체질 형성기)';
    if (pubertyStage === 'growth_spurt') {
      goldenBoost = 4.0;
      monthsRemaining = '약 18~24개월 (급성장기 / 1cm가 아쉬운 골든타임)';
    } else if (pubertyStage === 'urgent_secondary_signs') {
      goldenBoost = 2.5;
      monthsRemaining = '약 6~12개월 (성장판 폐쇄 직전 긴급 카운트다운!)';
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

  // 8. Growth Curve Points for Chart
  function getGrowthCurveData(gender) {
    const table = getStandardsTable(gender);
    return {
      months: table.map((r) => r.m),
      p3: table.map((r) => r.p3),
      p50: table.map((r) => r.p50),
      p97: table.map((r) => r.p97)
    };
  }

  // 9. Generate SVG Growth Trajectory Curve
  function renderSvgGrowthCurve(gender, currentAgeMonths, currentHeight) {
    const data = getGrowthCurveData(gender);
    const width = 500;
    const height = 240;
    const padding = { top: 20, right: 30, bottom: 35, left: 45 };

    const minM = 12;
    const maxM = 216;
    const minH = 65;
    const maxH = 190;

    const scaleX = (m) => padding.left + ((m - minM) / (maxM - minM)) * (width - padding.left - padding.right);
    const scaleY = (h) => height - padding.bottom - ((h - minH) / (maxH - minH)) * (height - padding.top - padding.bottom);

    const makePath = (values) => {
      return values.map((val, idx) => {
        const x = scaleX(data.months[idx]);
        const y = scaleY(val);
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
    };

    const pathP97 = makePath(data.p97);
    const pathP50 = makePath(data.p50);
    const pathP3 = makePath(data.p3);

    // Current point
    const curX = scaleX(Math.max(12, Math.min(216, currentAgeMonths)));
    const curY = scaleY(Math.max(65, Math.min(190, currentHeight)));

    return `
      <svg viewBox="0 0 ${width} ${height}" class="growth-curve-svg" style="width: 100%; height: auto; max-height: 260px;" aria-label="질병관리청 성장 곡선">
        <defs>
          <linearGradient id="curveGridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#5B4BFF" stop-opacity="0.08" />
            <stop offset="100%" stop-color="#FAF8F5" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Grid Lines -->
        <line x1="${padding.left}" y1="${scaleY(100)}" x2="${width - padding.right}" y2="${scaleY(100)}" stroke="#E2E8F0" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(140)}" x2="${width - padding.right}" y2="${scaleY(140)}" stroke="#E2E8F0" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(170)}" x2="${width - padding.right}" y2="${scaleY(170)}" stroke="#E2E8F0" stroke-dasharray="3,3" />

        <!-- Axes -->
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#CBD5E1" stroke-width="1.5" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#CBD5E1" stroke-width="1.5" />

        <!-- Ticks -->
        <text x="${scaleX(24)}" y="${height - 12}" font-size="10" fill="#64748B" text-anchor="middle">2세</text>
        <text x="${scaleX(72)}" y="${height - 12}" font-size="10" fill="#64748B" text-anchor="middle">6세</text>
        <text x="${scaleX(120)}" y="${height - 12}" font-size="10" fill="#64748B" text-anchor="middle">10세</text>
        <text x="${scaleX(168)}" y="${height - 12}" font-size="10" fill="#64748B" text-anchor="middle">14세</text>
        <text x="${scaleX(216)}" y="${height - 12}" font-size="10" fill="#64748B" text-anchor="middle">18세</text>

        <text x="${padding.left - 8}" y="${scaleY(100) + 4}" font-size="10" fill="#64748B" text-anchor="end">100cm</text>
        <text x="${padding.left - 8}" y="${scaleY(140) + 4}" font-size="10" fill="#64748B" text-anchor="end">140cm</text>
        <text x="${padding.left - 8}" y="${scaleY(170) + 4}" font-size="10" fill="#64748B" text-anchor="end">170cm</text>

        <!-- Percentile Curves -->
        <path d="${pathP97}" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="4,3" />
        <text x="${width - padding.right + 4}" y="${scaleY(data.p97[data.p97.length - 1]) + 3}" font-size="9" fill="#94A3B8">97%</text>

        <path d="${pathP50}" fill="none" stroke="#5B4BFF" stroke-width="2.5" />
        <text x="${width - padding.right + 4}" y="${scaleY(data.p50[data.p50.length - 1]) + 3}" font-size="10" fill="#5B4BFF" font-weight="700">50%</text>

        <path d="${pathP3}" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4,3" />
        <text x="${width - padding.right + 4}" y="${scaleY(data.p3[data.p3.length - 1]) + 3}" font-size="9" fill="#94A3B8">3%</text>

        <!-- Current Child Coordinate -->
        <circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="7" fill="#10B981" stroke="#FFFFFF" stroke-width="2.5" />
        <circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="12" fill="#10B981" fill-opacity="0.25">
          <animate attributeName="r" values="7;13;7" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="${curX.toFixed(1)}" y="${(curY - 12).toFixed(1)}" font-size="11" font-weight="800" fill="#047857" text-anchor="middle">현재 ${currentHeight}cm</text>
      </svg>
    `;
  }

  // 10. Generate 3-Tier Predicted Height Bar Chart HTML
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
          <div class="predicted-bar-caption">부모 키 표준 의학식 기반 기대 유전 잠재력</div>
        </div>

        <!-- Bar 2: Unmanaged Loss -->
        <div class="predicted-bar-row" style="margin-top: 1rem;">
          <div class="predicted-bar-header">
            <span class="bar-title">② 방해 습관 방치 시 예측키</span>
            <span class="bar-val bar-val-alert">${pred.unmanagedHeight}cm <small style="color: var(--coral-alert); font-size: 0.85rem;">(-${pred.unmanagedLoss}cm 손실)</small></span>
          </div>
          <div class="predicted-bar-track">
            <div class="predicted-bar-fill bar-fill-alert" style="width: ${wUnmanaged}%;"></div>
          </div>
          <div class="predicted-bar-caption">늦은 취침·구부정한 자세 등 방해 습관 방치 시 최종 손실 위험치</div>
        </div>

        <!-- Bar 3: Golden Time Max Potential -->
        <div class="predicted-bar-row" style="margin-top: 1rem;">
          <div class="predicted-bar-header">
            <span class="bar-title">③ 골든타임 밀착 관리 시 최대 잠재키</span>
            <span class="bar-val bar-val-mint">${pred.potentialHeight}cm <small style="color: var(--growth-mint-hover); font-size: 0.9rem; font-weight: 800;">(+${pred.goldenTimeGain}cm 잠재력)</small></span>
          </div>
          <div class="predicted-bar-track">
            <div class="predicted-bar-fill bar-fill-mint" style="width: ${wPotential}%;"></div>
          </div>
          <div class="predicted-bar-caption">성장판 닫히기 전 영양·수면·바른 자세 집중 교정 시 도달 가능한 최상위 키</div>
        </div>
      </div>
    `;
  }

  // 11. Render 3 Habit Coaching Cards
  function renderCoachingCards(habits) {
    const hasMilk = habits.includes('milk_trouble');
    const hasPicky = habits.includes('picky_eater');
    const hasLateSleep = habits.includes('late_sleep');
    const hasPosture = habits.includes('poor_posture');

    return `
      <div class="coaching-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
        <!-- Card 1: Nutrition -->
        <div class="bento-card-sub" style="background: #FFFFFF; border: 1px solid var(--border-clinic); border-radius: 20px; padding: 1.35rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.65rem;">
            <span style="font-size: 1.4rem;">🥛</span>
            <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0;">식단 &amp; 뼈성장 영양소 처방</h4>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
            ${hasMilk 
              ? '<strong>유당불내증 배앓이 안심 포뮬러:</strong> 우유 소화가 어려운 아이는 일반 탄산칼슘 대신 위산 분비 없이 흡수되는 <em>구연산 칼슘 + 비타민D3</em> 시럽을 처방합니다.' 
              : '<strong>골아세포 분열 촉진:</strong> 성장판 연골세포 분열을 돕는 필수 아미노산(L-아르기닌), 흡수율 높은 활성형 비타민D3와 아연 복합 공급이 필수적입니다.'}
          </p>
        </div>

        <!-- Card 2: Sleep -->
        <div class="bento-card-sub" style="background: #FFFFFF; border: 1px solid var(--border-clinic); border-radius: 20px; padding: 1.35rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.65rem;">
            <span style="font-size: 1.4rem;">🌙</span>
            <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0;">밤 10시 수면 골든타임 루틴</h4>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
            ${hasLateSleep 
              ? '<strong>성장호르몬 분비 피크 사수:</strong> 늦은 취침은 하루 분비량의 65%에 달하는 서파 수면 피크를 절단합니다. 밤 9시 30분 암막 환경 조성과 스마트폰 차단이 급선무입니다.' 
              : '<strong>깊은 서파 수면 3~4단계:</strong> 취침 후 1~2시간 사이 숙면 시 맥동성 성장호르몬이 가장 왕성하게 분비됩니다. 규칙적인 취침 루틴을 지속해주세요.'}
          </p>
        </div>

        <!-- Card 3: Posture -->
        <div class="bento-card-sub" style="background: #FFFFFF; border: 1px solid var(--border-clinic); border-radius: 20px; padding: 1.35rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.65rem;">
            <span style="font-size: 1.4rem;">🧘</span>
            <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0;">숨은 키 2cm 자세 &amp; 점프 교정</h4>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
            ${hasPosture 
              ? '<strong>척추 정렬 복원:</strong> 거북목과 구부정한 자세로 압박받은 추간판을 펴주면 숨은 키 1.5~2cm가 즉시 복원됩니다. 바른 각도의 독서대와 인체공학 의자가 효과적입니다.' 
              : '<strong>성장판 수직 견인 운동:</strong> 매일 10분 실내 트램폴린 점핑 및 스트레칭은 무릎·발목 성장판 연골에 적절한 물리적 압력과 이완 자극을 전달합니다.'}
          </p>
        </div>
      </div>
    `;
  }

  // 12. Full Report Renderer for Tab 1
  function renderTab1Report(profile) {
    const lms = getLmsForMonth(profile.gender, profile.ageMonths);
    const kdca = calculateKdcaPercentile(profile.currentHeight, lms.L, lms.M, lms.S);
    const mph = calculateMph(profile.fatherHeight, profile.motherHeight, profile.gender);
    const pred = calculateHeightPrediction(mph, profile.habits, profile.pubertyStage);

    const deltaSign = kdca.deltaMedian >= 0 ? `+${kdca.deltaMedian}` : `${kdca.deltaMedian}`;
    const genderKorean = profile.gender === 'boy' ? '남아' : '여아';

    return `
      <!-- Big Stats Bento Header -->
      <div class="growth-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="stat-card" style="background: var(--primary-indigo-sub); border: 1px solid #D7DDFD; border-radius: 20px; padding: 1.25rem; text-align: center;">
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary-indigo);">또래 100명 중 신체 백분위</span>
          <div style="font-size: 2rem; font-weight: 800; color: var(--primary-indigo); margin: 0.35rem 0;">상위 ${kdca.topPercent}%</div>
          <span style="font-size: 0.82rem; color: #475569;">전체 ${kdca.percentile} 백분위수</span>
        </div>

        <div class="stat-card" style="background: var(--growth-mint-sub); border: 1px solid #C4F3DE; border-radius: 20px; padding: 1.25rem; text-align: center;">
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--growth-mint-hover);">표준 평균키 대비 차이</span>
          <div style="font-size: 2rem; font-weight: 800; color: var(--growth-mint-hover); margin: 0.35rem 0;">${deltaSign}cm</div>
          <span style="font-size: 0.82rem; color: #475569;">동일 월령 표준키 ${lms.M.toFixed(1)}cm 기준</span>
        </div>

        <div class="stat-card" style="background: var(--coral-alert-sub); border: 1px solid #FEE0E0; border-radius: 20px; padding: 1.25rem; text-align: center;">
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--coral-alert);">사춘기 골든타임 신호</span>
          <div style="font-size: 1.15rem; font-weight: 800; color: var(--coral-alert); margin: 0.65rem 0;">${pred.monthsRemaining.split('(')[0].trim()}</div>
          <span style="font-size: 0.82rem; color: #475569;">${pred.monthsRemaining}</span>
        </div>
      </div>

      <!-- Growth Curve Visualization -->
      <div style="background: #FFFFFF; border: 1px solid var(--border-clinic); border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h4 style="font-size: 1.05rem; font-weight: 700; margin: 0; color: var(--text-primary);">📈 질병관리청(KDCA) 2017 소아 성장 곡선 대조</h4>
          <span style="font-size: 0.82rem; color: var(--text-secondary);">만 ${Math.floor(profile.ageMonths / 12)}세 (${profile.ageMonths}개월) ${genderKorean}</span>
        </div>
        ${renderSvgGrowthCurve(profile.gender, profile.ageMonths, profile.currentHeight)}
      </div>

      <!-- 3-Tier Predicted Height Bar Chart -->
      <div style="background: #FFFFFF; border: 1px solid var(--border-clinic); border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h4 style="font-size: 1.05rem; font-weight: 700; margin: 0 0 1rem 0; color: var(--text-primary);">📊 3단 예상키 진단 (유전 MPH vs 방치 손실 vs 최대 잠재키)</h4>
        ${render3TierBarChart(pred)}
      </div>

      <!-- 3 Prescriptive Habit Coaching Cards -->
      <div>
        <h4 style="font-size: 1.05rem; font-weight: 700; margin: 0 0 0.5rem 0; color: var(--text-primary);">🩺 전문 소아성장 맞춤 코칭 솔루션</h4>
        ${renderCoachingCards(profile.habits)}
      </div>
    `;
  }

  // Export
  const GrowthEngine = {
    erf,
    normalCDF,
    getLmsForMonth,
    calculateKdcaPercentile,
    calculateMph,
    calculateHeightPrediction,
    getGrowthCurveData,
    renderSvgGrowthCurve,
    render3TierBarChart,
    renderCoachingCards,
    renderTab1Report
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GrowthEngine;
  } else {
    global.KidsFitGrowthEngine = GrowthEngine;
  }

})(typeof window !== 'undefined' ? window : global);
