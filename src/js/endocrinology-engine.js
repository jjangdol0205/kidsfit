/**
 * src/js/endocrinology-engine.js
 * Core 2: Endocrinology & 24-Hour Hormone Trajectory Simulator
 * 
 * Mathematical Models & Clinical Invariants:
 * 1. Slow-Wave Sleep (SWS) Growth Hormone (GH) Secretion:
 *    - 60~70% of daily pulsatile GH is secreted during NREM Stage 3-4 delta sleep.
 *    - Peak window centered at 22:00 ~ 02:00 (1320 min ~ 1560 min).
 * 2. Bedtime Delay Penalty:
 *    - 8.0% suppression per 30 minutes past 22:00 (1320 min):
 *      DelayPenalty = max(0, ((bedtimeMin - 1320) / 30.0) * 8.0)
 * 3. Carbohydrate & Postprandial Insulin / Somatostatin Suppression:
 *    - Gap = (bedtimeMin - lastMealMin) / 60.0
 *    - If gap <= 0: CarbPenalty = 52.0%
 *    - If gap < 1.0h: CarbPenalty = 40.0%
 *    - If gap < 2.0h: CarbPenalty = 28.0%
 *    - If gap < 3.0h: CarbPenalty = 14.0%
 *    - If gap >= 3.0h: CarbPenalty = 0.0%
 * 4. Strict Ceiling Cap:
 *    - Total GH Suppression Rate = min(52.0%, DelayPenalty + CarbPenalty)
 * 5. High-Resolution Dynamic SVG Wave Generator:
 *    - Responsive viewBox "0 0 600 260"
 *    - Optimal GH pulse wave (Bio Emerald #10B981)
 *    - Suppressed GH wave (Coral #F43F5E)
 *    - Insulin/Somatostatin inhibitory wave (Cyan #38BDF8 / Blue #3B82F6)
 */

(function(global) {
  'use strict';

  // Helper: Convert minutes from midnight (e.g. 1320 = 22:00, 1500 = 01:00 next day) to HH:MM format
  function minutesToTimeStr(totalMinutes) {
    const norm = Math.round(totalMinutes) % 1440;
    const hours = Math.floor(norm / 60);
    const mins = norm % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // 1. Precise Biochemical Hormone Suppression Calculation
  function simulateSuppression(bedtimeMin, lastMealMin) {
    const bMin = Number(bedtimeMin) || 1320;
    const mMin = Number(lastMealMin) || 1140;

    let gapHours = (bMin - mMin) / 60.0;
    if (gapHours <= 0) {
      return {
        suppressionPercent: 52.0,
        delayPenalty: 0.0,
        carbPenalty: 52.0,
        gapHours: 0.0,
        bedtimeStr: minutesToTimeStr(bMin),
        mealStr: minutesToTimeStr(mMin)
      };
    }

    let delayPenalty = 0.0;
    if (bMin > 1320) {
      delayPenalty = Math.max(0.0, ((bMin - 1320) / 30.0) * 8.0);
    }

    let carbPenalty = 0.0;
    if (gapHours < 1.0) carbPenalty = 40.0;
    else if (gapHours < 2.0) carbPenalty = 28.0;
    else if (gapHours < 3.0) carbPenalty = 14.0;
    else carbPenalty = 0.0;

    const total = Math.min(52.0, Math.round((delayPenalty + carbPenalty) * 10.0) / 10.0);

    return {
      suppressionPercent: total,
      delayPenalty: Math.round(delayPenalty * 10.0) / 10.0,
      carbPenalty: carbPenalty,
      gapHours: Math.round(gapHours * 10.0) / 10.0,
      bedtimeStr: minutesToTimeStr(bMin),
      mealStr: minutesToTimeStr(mMin)
    };
  }

  // 2. High-Precision 24-Hour Hormone Waveform Simulation
  function simulateHormoneCurve(bedtimeMin, lastMealMin) {
    const suppression = simulateSuppression(bedtimeMin, lastMealMin);
    const bMin = Number(bedtimeMin) || 1320;
    const mMin = Number(lastMealMin) || 1140;

    // Timeline spanning from 16:00 (day) to 12:00 next day (20 hours total, represented in minutes)
    // Reference origin: 16:00 = 960 min, ending at 36:00 (12:00 next day) = 2160 min
    const startMin = 960;  // 16:00
    const endMin = 2160;  // 12:00 next day (36:00)
    const totalDuration = endMin - startMin; // 1200 minutes (20 hours)

    // Pulse parameters:
    // SWS GH peak centered around sleep onset + 75 minutes (typical slow-wave stage 3-4 delta wave)
    const sleepOnset = bMin;
    const peakCenter = sleepOnset + 75; // Peak 75 min after bedtime
    const peakWidth = 110; // Standard deviation / spread

    // Insulin peak: 45 min after last meal, half-life decay over 2.5 hours
    const insulinCenter = mMin + 45;
    const insulinWidth = 60;

    const steps = 80;
    const timeline = [];

    for (let i = 0; i <= steps; i++) {
      const t = startMin + (i / steps) * totalDuration;

      // Base GH daytime secretion (low basal ~ 1.5 ng/mL)
      let optimalGh = 1.2 + 0.8 * Math.sin(((t - 960) / 1200) * Math.PI);

      // Primary SWS peak pulse
      const dtSleep = t - peakCenter;
      const ghPulse = 28.0 * Math.exp(-0.5 * Math.pow(dtSleep / peakWidth, 2));
      optimalGh += ghPulse;

      // Secondary smaller REM/NREM pulse 3.5 hours later
      const dtSleep2 = t - (peakCenter + 210);
      const ghPulse2 = 11.0 * Math.exp(-0.5 * Math.pow(dtSleep2 / 80, 2));
      optimalGh += ghPulse2;

      // Insulin wave
      let insulin = 5.0;
      if (t >= mMin) {
        const dtMeal = t - insulinCenter;
        if (dtMeal >= -45) {
          insulin += 45.0 * Math.exp(-0.5 * Math.pow(dtMeal / insulinWidth, 2));
        }
      }

      // Suppressed GH: scaled down by suppression factor during sleep window
      const factor = (100.0 - suppression.suppressionPercent) / 100.0;
      let suppressedGh = optimalGh;
      if (t >= sleepOnset - 30 && t <= sleepOnset + 420) {
        const base = 1.5;
        const pulsatile = Math.max(0, optimalGh - base);
        suppressedGh = base + pulsatile * factor;
      }

      timeline.push({
        timeMin: t,
        timeStr: minutesToTimeStr(t),
        optimalGh: Math.round(optimalGh * 10) / 10,
        suppressedGh: Math.round(suppressedGh * 10) / 10,
        insulin: Math.round(insulin * 10) / 10
      });
    }

    let clinicalAdvice = '밤 10시 이전 입면 · 취침 3시간 전 식사 마감으로 성장호르몬 효율 100% 최적 상태입니다.';
    if (suppression.suppressionPercent >= 40.0) {
      clinicalAdvice = `긴급 경보 (-${suppression.suppressionPercent}% 손실): 저녁 식사를 19시 이전으로 앞당기고 밤 10시 전 암막 수면을 시작하세요.`;
    } else if (suppression.suppressionPercent > 0.0) {
      clinicalAdvice = `부분 손실 (-${suppression.suppressionPercent}%): 취침 지연(-${suppression.delayPenalty}%) · 야간 당질(-${suppression.carbPenalty}%)을 줄이면 성장호르몬 피크가 회복됩니다.`;
    }

    return {
      timeline,
      ghLossPercent: suppression.suppressionPercent,
      delayPenalty: suppression.delayPenalty,
      carbPenalty: suppression.carbPenalty,
      gapHours: suppression.gapHours,
      bedtimeStr: suppression.bedtimeStr,
      mealStr: suppression.mealStr,
      swsPeakWindow: { start: '22:00', end: '02:00', label: '서파수면(SWS) 3~4단계 GH 피크' },
      clinicalAdvice
    };
  }

  // 3. Dynamic Interactive SVG Chart Generator
  function renderHormoneSvg(bedtimeMin, lastMealMin, options = {}) {
    const width = 600;
    const height = 260;
    const padding = { top: 34, right: 35, bottom: 40, left: 50 };

    const sim = simulateHormoneCurve(bedtimeMin, lastMealMin);
    const startMin = 960;  // 16:00
    const endMin = 2160;  // 12:00 next day
    const maxGh = 32.0;

    const scaleX = (m) => padding.left + ((m - startMin) / (endMin - startMin)) * (width - padding.left - padding.right);
    const scaleY = (gh) => height - padding.bottom - (gh / maxGh) * (height - padding.top - padding.bottom);

    // Build SVG paths for optimal GH, suppressed GH, and insulin
    const ptsOpt = sim.timeline.map((pt, i) => `${i === 0 ? 'M' : 'L'}${scaleX(pt.timeMin).toFixed(1)},${scaleY(pt.optimalGh).toFixed(1)}`);
    const ptsSup = sim.timeline.map((pt, i) => `${i === 0 ? 'M' : 'L'}${scaleX(pt.timeMin).toFixed(1)},${scaleY(pt.suppressedGh).toFixed(1)}`);

    const optPathD = ptsOpt.join(' ');
    const supPathD = ptsSup.join(' ');

    // Optimal Shaded Area under Curve
    const optAreaD = `${optPathD} L${scaleX(endMin).toFixed(1)},${scaleY(0).toFixed(1)} L${scaleX(startMin).toFixed(1)},${scaleY(0).toFixed(1)} Z`;
    // Suppressed Shaded Area
    const supAreaD = `${supPathD} L${scaleX(endMin).toFixed(1)},${scaleY(0).toFixed(1)} L${scaleX(startMin).toFixed(1)},${scaleY(0).toFixed(1)} Z`;

    // SWS Peak Window Box (22:00 = 1320 min to 02:00 = 1560 min)
    const swsX1 = scaleX(1320);
    const swsX2 = scaleX(1560);
    const swsWidth = swsX2 - swsX1;

    // Marker X coordinates for current Bedtime & Dinner (with safe clamped label centers)
    const bedX = scaleX(Number(bedtimeMin) || 1320);
    const mealX = scaleX(Number(lastMealMin) || 1140);
    const mealLabelX = Math.max(padding.left + 52, Math.min(width - padding.right - 52, mealX));
    const bedLabelX = Math.max(padding.left + 52, Math.min(width - padding.right - 52, bedX));

    return `
      <svg viewBox="0 0 ${width} ${height}" class="hormone-curve-svg" style="width: 100%; height: auto; max-height: 290px;" aria-label="24시간 성장호르몬 분비 및 억제 곡선 차트">
        <defs>
          <linearGradient id="optHormoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1D4ED8" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.03" />
          </linearGradient>
          <linearGradient id="supHormoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#64748B" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#64748B" stop-opacity="0.08" />
          </linearGradient>
          <linearGradient id="swsWindowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1D4ED8" stop-opacity="0.16" />
            <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.04" />
          </linearGradient>
        </defs>

        <!-- SWS Growth Hormone Gold Window Highlight (22:00 ~ 02:00) -->
        <rect x="${swsX1.toFixed(1)}" y="${padding.top}" width="${swsWidth.toFixed(1)}" height="${height - padding.top - padding.bottom}" fill="url(#swsWindowGrad)" stroke="#1D4ED8" stroke-width="1" stroke-dasharray="3,3" opacity="0.85" rx="4" />
        <text x="${(swsX1 + swsWidth / 2).toFixed(1)}" y="${padding.top - 10}" font-size="11" font-weight="900" fill="#1D4ED8" text-anchor="middle">
          SWS 성장호르몬 골든 피크 (22:00 ~ 02:00)
        </text>

        <!-- Grid Lines -->
        <line x1="${padding.left}" y1="${scaleY(10)}" x2="${width - padding.right}" y2="${scaleY(10)}" stroke="#CBD5E1" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(20)}" x2="${width - padding.right}" y2="${scaleY(20)}" stroke="#CBD5E1" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(30)}" x2="${width - padding.right}" y2="${scaleY(30)}" stroke="#CBD5E1" stroke-dasharray="3,3" />

        <!-- Shaded Areas -->
        <path d="${optAreaD}" fill="url(#optHormoneGrad)" />
        ${sim.ghLossPercent > 0 ? `<path d="${supAreaD}" fill="url(#supHormoneGrad)" />` : ''}

        <!-- Curves -->
        <!-- 1. Optimal Pulsatile GH (Bio Emerald #10B981) -->
        <path d="${optPathD}" fill="none" stroke="#1D4ED8" stroke-width="2.8" stroke-linecap="round" />

        <!-- 2. Suppressed GH Curve (Coral / Rose #F43F5E) -->
        ${sim.ghLossPercent > 0 ? `
          <path d="${supPathD}" fill="none" stroke="#94A3B8" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="5,3" />
        ` : ''}

        <!-- Marker: Last Meal Line & Pill Badge (Row 1) -->
        <line x1="${mealX.toFixed(1)}" y1="${padding.top}" x2="${mealX.toFixed(1)}" y2="${height - padding.bottom}" stroke="#94A3B8" stroke-width="1.8" stroke-dasharray="3,3" />
        <rect x="${(mealLabelX - 48).toFixed(1)}" y="${padding.top + 6}" width="96" height="20" rx="6" fill="#EFF6FF" stroke="#94A3B8" stroke-width="1.2" />
        <text x="${mealLabelX.toFixed(1)}" y="${padding.top + 20}" font-size="10.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">
          식사 ${sim.mealStr}
        </text>

        <!-- Marker: Bedtime Line & Pill Badge (Row 2 - never overlaps Meal badge) -->
        <line x1="${bedX.toFixed(1)}" y1="${padding.top}" x2="${bedX.toFixed(1)}" y2="${height - padding.bottom}" stroke="#64748B" stroke-width="2" />
        <rect x="${(bedLabelX - 48).toFixed(1)}" y="${padding.top + 32}" width="96" height="20" rx="6" fill="#EFF6FF" stroke="#64748B" stroke-width="1.2" />
        <text x="${bedLabelX.toFixed(1)}" y="${padding.top + 46}" font-size="10.5" font-weight="800" fill="#0F172A" text-anchor="middle">
          취침 ${sim.bedtimeStr}
        </text>

        <!-- Axes -->
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#475569" stroke-width="1.4" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#475569" stroke-width="1.4" />

        <!-- Time Axis Ticks (16:00 to 12:00) -->
        <text x="${scaleX(960)}" y="${height - 14}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="middle">16:00</text>
        <text x="${scaleX(1140)}" y="${height - 14}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="middle">19:00</text>
        <text x="${scaleX(1320)}" y="${height - 14}" font-size="11" font-weight="900" fill="#1D4ED8" text-anchor="middle">22:00</text>
        <text x="${scaleX(1500)}" y="${height - 14}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="middle">01:00</text>
        <text x="${scaleX(1680)}" y="${height - 14}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="middle">04:00</text>
        <text x="${scaleX(1860)}" y="${height - 14}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="middle">07:00</text>
        <text x="${scaleX(2040)}" y="${height - 14}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="middle">10:00</text>
        <text x="${scaleX(2160)}" y="${height - 14}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="middle">12:00</text>

        <!-- Y Axis Ticks (GH ng/mL) -->
        <text x="${padding.left - 7}" y="${scaleY(0) + 4}" font-size="10" font-weight="700" fill="#0F172A" text-anchor="end">0</text>
        <text x="${padding.left - 7}" y="${scaleY(10) + 4}" font-size="10" font-weight="700" fill="#0F172A" text-anchor="end">10</text>
        <text x="${padding.left - 7}" y="${scaleY(20) + 4}" font-size="10" font-weight="700" fill="#0F172A" text-anchor="end">20</text>
        <text x="${padding.left - 7}" y="${scaleY(30) + 4}" font-size="10" font-weight="700" fill="#0F172A" text-anchor="end">30</text>

        <!-- Y Axis Unit Label -->
        <text x="${padding.left - 6}" y="${padding.top - 10}" font-size="9.5" font-weight="700" fill="#334155" text-anchor="middle">GH(ng/mL)</text>
      </svg>
    `;
  }

  // 4. Master Endocrinology Interactive Report Section
  function renderEndocrinologySection(profile = {}) {
    const bMin = profile.bedtimeMinutes || 1320; // 22:00 default
    const mMin = profile.mealMinutes || 1140;   // 19:00 default

    const sim = simulateHormoneCurve(bMin, mMin);
    const lossBadgeColor = sim.ghLossPercent >= 40.0 ? '#1D4ED8' : (sim.ghLossPercent > 0 ? '#1D4ED8' : '#1D4ED8');
    const lossBadgeBg = sim.ghLossPercent >= 40.0 ? '#EFF6FF' : (sim.ghLossPercent > 0 ? '#EFF6FF' : '#EFF6FF');

    return `
      <div id="core-2-endocrinology-sub" style="margin-bottom: 2rem;">
        
        <!-- Header & Live Loss Badge -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div>
            <h4 style="font-size: 1.15rem; font-weight: 800; color: #0F172A; margin: 0;">
              24시간 호르몬 궤적 &amp; 서파수면(SWS) GH 분비 시뮬레이터
            </h4>
            <p style="font-size: 0.84rem; color: #334155; margin: 0.25rem 0 0 0;">
              취침 시각 지연 및 야식 혈당 스파이크에 따른 성장호르몬 분비 억제율(-52% max) 정밀 연산
            </p>
          </div>
          <div id="hormone-loss-badge" style="background: ${lossBadgeBg}; border: 1.5px solid ${lossBadgeColor}; border-radius: 9999px; padding: 0.45rem 1.1rem; text-align: center;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #334155; display: block;">성장호르몬 분비 손실률</span>
            <span style="font-size: 1.25rem; font-weight: 800; color: ${lossBadgeColor};">
              -${sim.ghLossPercent}% <span style="font-size: 0.75rem; font-weight: 600;">(최대 -52% 억제)</span>
            </span>
          </div>
        </div>

        <!-- Interactive Sliders Bento Card (Clean 1-Per-Row Layout) -->
        <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 20px; padding: 1.15rem 1.25rem; margin-bottom: 1.25rem;">
          <div style="display: flex; flex-direction: column; gap: 1.15rem;">
            
            <!-- Slider 1: Bedtime -->
            <div class="form-group" style="margin: 0;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.4rem;">
                <label for="hormone-bedtime-slider" style="font-size: 0.88rem; font-weight: 700; color: #0F172A;">
                  아이 취침 시각 (입면 기준)
                </label>
                <span id="hormone-bedtime-display" style="font-size: 1rem; font-weight: 800; color: #1D4ED8;">
                  ${sim.bedtimeStr}
                </span>
              </div>
              <input type="range" id="hormone-bedtime-slider" min="1230" max="1500" step="15" value="${bMin}" class="form-input" style="padding: 0.35rem 0; width: 100%; cursor: pointer;">
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #475569; margin-top: 0.25rem;">
                <span>20:30 (이른 입면)</span>
                <span>22:00 (표준 골든타임)</span>
                <span>01:00 (심야 지연)</span>
              </div>
            </div>

            <!-- Slider 2: Last Meal / Late Carbs -->
            <div class="form-group" style="margin: 0;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.4rem;">
                <label for="hormone-meal-slider" style="font-size: 0.88rem; font-weight: 700; color: #0F172A;">
                  마지막 음식·당질 섭취 시각
                </label>
                <span id="hormone-meal-display" style="font-size: 1rem; font-weight: 800; color: #1D4ED8;">
                  ${sim.mealStr}
                </span>
              </div>
              <input type="range" id="hormone-meal-slider" min="1020" max="1380" step="15" value="${mMin}" class="form-input" style="padding: 0.35rem 0; width: 100%; cursor: pointer;">
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #475569; margin-top: 0.25rem;">
                <span>17:00 (이른 저녁)</span>
                <span>19:00 (표준 마감)</span>
                <span>23:00 (심야 야식)</span>
              </div>
            </div>

          </div>

          <!-- Gap Status Bar -->
          <div style="margin-top: 1rem; padding-top: 0.85rem; border-top: 1px dashed #BFDBFE; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div style="font-size: 0.82rem; color: #334155;">
              소화기 공복 간격: <strong id="hormone-gap-display" style="color: ${sim.gapHours >= 3.0 ? '#1D4ED8' : '#1D4ED8'};">${sim.gapHours}시간</strong>
              (식후 인슐린 반감기 2.5시간 충족 필요)
            </div>
            <div style="font-size: 0.78rem; color: #475569;">
              취침 지연 감점: <span id="hormone-delay-penalty">-${sim.delayPenalty}%</span> · 야간 당질 감점: <span id="hormone-carb-penalty">-${sim.carbPenalty}%</span>
            </div>
          </div>
        </div>

        <!-- High-Resolution Dynamic SVG Chart Card -->
        <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 1.25rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
            <span style="font-size: 0.85rem; font-weight: 700; color: #334155;">
              실시간 24시간 성장호르몬 분비 곡선 (녹색: 최적 100% vs 적색 점선: 현재 손실)
            </span>
            <div style="display: flex; gap: 0.75rem; font-size: 0.78rem; font-weight: 700;">
              <span style="color: #1D4ED8;">● 최적 서파수면 맥동</span>
              <span style="color: #64748B;">● 지연/야식 손실 곡선</span>
            </div>
          </div>

          <div id="hormone-svg-container">
            ${renderHormoneSvg(bMin, mMin)}
          </div>
        </div>

        <!-- Clinical Advice Box -->
        <div id="hormone-advice-card" style="background: #EFF6FF; border: 1px solid #BFDBFE; border-left: 4px solid ${lossBadgeColor}; border-radius: 12px; padding: 1rem 1.25rem;">
          <div style="font-size: 0.88rem; line-height: 1.6; color: #0F172A;" id="hormone-advice-text">
            ${sim.clinicalAdvice}
          </div>
        </div>

      </div>
    `;
  }

  // Dual Export
  const EndocrinologyEngine = {
    minutesToTimeStr,
    simulateSuppression,
    simulateHormoneCurve,
    renderHormoneSvg,
    renderEndocrinologySection
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EndocrinologyEngine;
  }
  if (typeof window !== 'undefined') {
    window.KidsFitEndocrinologyEngine = EndocrinologyEngine;
    window.TallerEndocrinologyEngine = EndocrinologyEngine;
  }
  if (typeof global !== 'undefined' && typeof window === 'undefined') {
    global.KidsFitEndocrinologyEngine = EndocrinologyEngine;
    global.TallerEndocrinologyEngine = EndocrinologyEngine;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
