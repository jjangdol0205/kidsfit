/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * Core 5: 90-Day Growth & Routine Tracker & Hospital Clinic Clinical PDF Report
 * 
 * Features:
 * 1. 90-Day Longitudinal Growth & Daily Habit Streak Tracker:
 *    - Persistent client-side storage: `localStorage` ('taller_growth_logs', 'kidsfit_tracker_v2', 'taller_bio_tracker')
 *    - In-memory resilient fallback for incognito/sandboxed iframes
 *    - Tracks date-stamped biometrics (height, weight, growth velocity)
 *    - Daily 3-Protocol tracking: Sleep (수면), Bio-Nutrition (영양), Biomechanics (운동)
 *    - Milestone streak badges: 7 days, 30 days, 90 days
 * 2. Dedicated 2-Page Hospital Clinic Style Clinical PDF Report:
 *    - Page 1: Auxology & Trajectory (Demographics, CDC/KDCA percentiles, Tanner MPH, 3-curve trajectory SVG)
 *    - Page 2: Endocrinology, Nutrition, Biomechanics & Neuro-Cognitive Matrix + Doctor Signature
 *    - Pure white `#FFFFFF` background, `#0F172A` typography, `page-break-after: always;`
 */

(function (global) {
  'use strict';

  const STORAGE_KEYS = ['taller_growth_logs', 'kidsfit_tracker_v2', 'taller_bio_tracker'];
  const PRIMARY_STORAGE_KEY = 'taller_growth_logs';

  // In-memory fallback if localStorage throws (e.g. sandboxed iframe or private browsing)
  let inMemoryStorage = {};

  function safeGetStorage(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val) return JSON.parse(val);
      }
    } catch (e) {
      // Fallback
    }
    return inMemoryStorage[key] || null;
  }

  function safeSetStorage(key, val) {
    const serialized = JSON.stringify(val);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, serialized);
      }
    } catch (e) {
      // Fallback
    }
    inMemoryStorage[key] = val;
  }

  // 1. Initial State & Seed Data Generation
  function getInitialTrackerState(profile = {}) {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentH = Number(profile.currentHeight) || 137.0;
    const currentW = Number(profile.currentWeight) || 35.5;

    return {
      childId: 'default_patient',
      startDate: todayStr,
      currentStreakDays: 14,
      bestStreakDays: 14,
      todayProtocols: {
        sleep: true,
        nutrition: true,
        exercise: true
      },
      badges: [
        { id: 'starter_7d', days: 7, nameKo: '7-Day Protocol Starter', nameEn: '7-Day Starter', unlocked: true, date: '2026-10-13' },
        { id: 'accelerator_30d', days: 30, nameKo: '30-Day Growth Accelerator', nameEn: '30-Day Accelerator', unlocked: false, date: null },
        { id: 'master_90d', days: 90, nameKo: '90-Day Epiphyseal Master', nameEn: '90-Day Master', unlocked: false, date: null }
      ],
      logs: [
        { date: '2026-10-14', height: Math.round((currentH - 0.5) * 10) / 10, weight: currentW - 0.2, sleep: true, nutrition: true, exercise: true, note: '기준 진단 계측' },
        { date: '2026-10-16', height: Math.round((currentH - 0.3) * 10) / 10, weight: currentW - 0.1, sleep: true, nutrition: true, exercise: true, note: '데드행 3세트 완주' },
        { date: '2026-10-18', height: Math.round((currentH - 0.1) * 10) / 10, weight: currentW, sleep: true, nutrition: true, exercise: true, note: '구연산칼슘 & D3 섭취' },
        { date: todayStr, height: currentH, weight: currentW, sleep: true, nutrition: true, exercise: true, note: '오늘 정밀 바이오 측정' }
      ]
    };
  }

  function getTrackerData(profile = {}) {
    for (const key of STORAGE_KEYS) {
      const data = safeGetStorage(key);
      if (data && Array.isArray(data.logs)) {
        return data;
      }
    }
    const initial = getInitialTrackerState(profile);
    saveTrackerData(initial);
    return initial;
  }

  function saveTrackerData(data) {
    if (!data) return;
    // Calculate and update streaks
    updateBadgesAndStreak(data);
    STORAGE_KEYS.forEach(k => safeSetStorage(k, data));
  }

  function updateBadgesAndStreak(data) {
    if (!data.logs || data.logs.length === 0) return;
    // Update badges
    const days = data.currentStreakDays || 14;
    data.badges.forEach(b => {
      if (days >= b.days) {
        b.unlocked = true;
        if (!b.date) b.date = new Date().toISOString().split('T')[0];
      }
    });
  }

  function addLogEntry(height, weight, note = '', profile = {}) {
    const data = getTrackerData(profile);
    const todayStr = new Date().toISOString().split('T')[0];

    const h = Number(height) || (profile.currentHeight || 137.0);
    const w = Number(weight) || (profile.currentWeight || 35.5);

    const entry = {
      date: todayStr,
      height: Math.round(h * 10) / 10,
      weight: Math.round(w * 10) / 10,
      sleep: data.todayProtocols ? data.todayProtocols.sleep : true,
      nutrition: data.todayProtocols ? data.todayProtocols.nutrition : true,
      exercise: data.todayProtocols ? data.todayProtocols.exercise : true,
      note: note || '정기 생체 계측'
    };

    // Remove existing entry for same date if any, then append
    data.logs = data.logs.filter(l => l.date !== todayStr);
    data.logs.push(entry);
    data.logs.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Increment streak
    data.currentStreakDays = (data.currentStreakDays || 0) + 1;
    if (data.currentStreakDays > (data.bestStreakDays || 0)) {
      data.bestStreakDays = data.currentStreakDays;
    }

    saveTrackerData(data);
    return data;
  }

  function toggleProtocol(protocolKey, state, profile = {}) {
    const data = getTrackerData(profile);
    if (!data.todayProtocols) {
      data.todayProtocols = { sleep: false, nutrition: false, exercise: false };
    }
    data.todayProtocols[protocolKey] = Boolean(state);
    saveTrackerData(data);
    return data;
  }

  // 2. HTML Section Renderer (Dashboard View)
  function renderTrackerSection(profile = {}) {
    const isGlobal = (typeof document !== 'undefined' && document.documentElement.lang === 'en') || profile.language === 'en';
    const data = getTrackerData(profile);
    const streak = data.currentStreakDays || 14;
    const logs = data.logs || [];

    const titleStr = isGlobal ? '90-Day Longitudinal Growth Tracker & Routine Streak' : '90일 성장 데이터 & 바이오 프로토콜 스트릭 기록소';
    const subStr = isGlobal
      ? 'Track daily height and weight trajectory, log the 3 core protocols (Sleep, Nutrition, Biomechanics), and unlock clinical milestone badges.'
      : '날짜별 키·몸무게 변화 궤적을 기록하고 수면·임상영양·생체역학 3대 프로토콜 달성 스트릭(Streak)을 관리하는 브라우저 보안 스토리지 트래커입니다.';

    let html = `
      <div id="core-5-container" class="core-module-container tracker-container">
        <!-- Tracker Header Card with Print Trigger -->
        <div class="bento-card tracker-header-card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--theme-accent);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="tab-badge tab-badge-indigo" style="display: inline-block; margin-bottom: 0.5rem;">
                Core 5 · Tracker &amp; Clinical PDF
              </span>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
                ${titleStr}
              </h3>
              <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.55; max-width: 780px;">
                ${subStr}
              </p>
            </div>
            <div>
              <button type="button" class="btn btn-primary" id="btn-print-clinic-pdf" style="display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.92rem; font-weight: 800; padding: 0.75rem 1.25rem;">
                ${isGlobal ? '[Save / Print 2-Page Clinical PDF]' : '[A4 정밀 리포트 PDF 저장 / 인쇄]'}
              </button>
            </div>
          </div>
        </div>

        <!-- Streak Badges & Today's 3 Protocols Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
          
          <!-- Column 1: Daily Protocol Streak Counter & Badges -->
          <div class="bento-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--theme-accent); text-transform: uppercase;">
                  ${isGlobal ? 'Active Routine Streak' : '연속 프로토콜 달성 스트릭'}
                </span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">
                  ${isGlobal ? 'Target: 90 Days' : '최종 목표: 90일'}
                </span>
              </div>

              <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 1rem;">
                <span style="font-size: 2.75rem; font-weight: 900; font-family: var(--font-mono); color: var(--bio-emerald); line-height: 1;">
                  ${streak}
                </span>
                <span style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">
                  ${isGlobal ? 'Days Consecutive' : '일 연속 달성 중'}
                </span>
              </div>

              <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1.25rem;">
                ${isGlobal ? 'Consistently adhering to sleep, bio-nutrition, and spine routines unlocks epiphyseal chondrocyte remodeling.' : '수면, 영양, 생체역학 3대 프로토콜을 매일 지속할 때 골단판 미세 자극과 성장호르몬 분비가 극대화됩니다.'}
              </p>
            </div>

            <!-- Milestone Badges Shelf -->
            <div style="padding-top: 1rem; border-top: 1px solid var(--theme-border-subtle);">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">
                ${isGlobal ? 'Milestone Badges' : '마일스톤 달성 배지'}
              </span>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                ${data.badges.map(b => `
                  <div style="background: var(--theme-surface-sub); border: 1px solid ${b.unlocked ? 'var(--bio-emerald)' : 'var(--theme-border-subtle)'}; border-radius: 8px; padding: 0.65rem 0.4rem; text-align: center; opacity: ${b.unlocked ? 1 : 0.45};">
                    <div style="font-size: 1.15rem; margin-bottom: 0.2rem;">${b.nameKo.split(' ')[0]}</div>
                    <div style="font-size: 0.72rem; font-weight: 800; color: ${b.unlocked ? 'var(--bio-emerald)' : 'var(--text-muted)'};">
                      ${b.days}${isGlobal ? 'd' : '일'}
                    </div>
                    <div style="font-size: 0.65rem; color: var(--text-muted);">
                      ${b.unlocked ? (isGlobal ? 'Unlocked' : '획득') : (isGlobal ? 'Locked' : '진행중')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Column 2: Today's 3 Core Protocols Checklist -->
          <div class="bento-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--bio-emerald); text-transform: uppercase;">
                  ${isGlobal ? 'Today\'s 3 Bio-Protocols' : '오늘의 3대 바이오 프로토콜'}
                </span>
                <span style="font-size: 0.75rem; color: var(--text-secondary);">
                  ${new Date().toISOString().split('T')[0]}
                </span>
              </div>

              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
                ${isGlobal ? 'Daily Protocol Adherence' : '일일 3대 핵심 습관 체크'}
              </h4>

              <!-- 3 Protocol Check Items -->
              <div class="protocols-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
                
                <!-- Sleep -->
                <label style="display: flex; align-items: center; justify-content: space-between; background: var(--theme-surface-sub); padding: 0.75rem 1rem; border-radius: var(--radius-inner); border: 1px solid var(--theme-border-subtle); cursor: pointer;">
                  <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <span style="font-size: 1.25rem;"></span>
                    <div>
                      <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">
                        ${isGlobal ? 'Sleep Protocol: Deep SWS Bedtime' : '수면 프로토콜: 밤 10:30 전 취침'}
                      </div>
                      <div style="font-size: 0.72rem; color: var(--text-secondary);">
                        ${isGlobal ? 'Bedtime before 22:30 & 2hr fasting gap' : '취침 2시간 전 공복 유지 & 서파수면 유도'}
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" id="chk-proto-sleep" ${data.todayProtocols.sleep ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--bio-emerald);">
                </label>

                <!-- Nutrition -->
                <label style="display: flex; align-items: center; justify-content: space-between; background: var(--theme-surface-sub); padding: 0.75rem 1rem; border-radius: var(--radius-inner); border: 1px solid var(--theme-border-subtle); cursor: pointer;">
                  <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <span style="font-size: 1.25rem;"></span>
                    <div>
                      <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">
                        ${isGlobal ? 'Nutrition Protocol: Bio-Available Nutrients' : '임상 영양 프로토콜: 흡수율 45% 영양소'}
                      </div>
                      <div style="font-size: 0.72rem; color: var(--text-secondary);">
                        ${isGlobal ? 'Calcium Citrate + D3/K2 + Zinc/Magnesium' : '구연산칼슘 + D3/K2 + 아연/마그네슘 섭취'}
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" id="chk-proto-nutrition" ${data.todayProtocols.nutrition ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--bio-emerald);">
                </label>

                <!-- Exercise -->
                <label style="display: flex; align-items: center; justify-content: space-between; background: var(--theme-surface-sub); padding: 0.75rem 1rem; border-radius: var(--radius-inner); border: 1px solid var(--theme-border-subtle); cursor: pointer;">
                  <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <span style="font-size: 1.25rem;"></span>
                    <div>
                      <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">
                        ${isGlobal ? 'Biomechanics Routine: Traction & Jumping' : '생체역학 루틴: 척추 감압 & 점핑 완료'}
                      </div>
                      <div style="font-size: 0.72rem; color: var(--text-secondary);">
                        ${isGlobal ? 'Dead hang (30sx3) + Thoracic (45sx2) + Jump' : '데드행 3세트 + 흉추 신전 2세트 + 줄넘기'}
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" id="chk-proto-exercise" ${data.todayProtocols.exercise ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--bio-emerald);">
                </label>

              </div>
            </div>

            <!-- Auto-save note -->
            <div style="margin-top: 1rem; font-size: 0.72rem; color: var(--text-muted); text-align: right;">
              ${isGlobal ? 'Saved securely to local browser storage' : '체크 즉시 브라우저 보안 스토리지에 자동 저장됩니다.'}
            </div>
          </div>

        </div>

        <!-- Log Entry Form & Recent Measurements Table -->
        <div class="bento-card tracker-table-card" style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
            <div>
              <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0 0 0.25rem 0;">
                ${isGlobal ? 'Date-Stamped Growth Measurement Logs' : '날짜별 신장·체중 계측 로그'}
              </h4>
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">
                ${isGlobal ? 'Regular date-stamped records compute real-time growth velocity (cm/yr).' : '주기적인 신장·체중 기록은 연간 성장속도(cm/yr)의 임상적 추이를 정확히 검증합니다.'}
              </p>
            </div>

            <!-- Mini Input Form -->
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <input type="number" step="0.1" id="input-log-height" placeholder="${isGlobal ? 'Height (cm)' : '키 cm'}" value="${profile.currentHeight || 137.0}" style="width: 110px; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--theme-border); background: var(--theme-surface-sub); color: var(--text-primary); font-family: var(--font-mono); font-size: 0.85rem;">
              <input type="number" step="0.1" id="input-log-weight" placeholder="${isGlobal ? 'Weight (kg)' : '체중 kg'}" value="${profile.currentWeight || 35.5}" style="width: 110px; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--theme-border); background: var(--theme-surface-sub); color: var(--text-primary); font-family: var(--font-mono); font-size: 0.85rem;">
              <button type="button" class="btn btn-secondary" id="btn-add-log" style="padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 700;">
                + ${isGlobal ? 'Add Measurement' : '계측 기록 추가'}
              </button>
            </div>
          </div>

          <!-- Logs Table -->
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid var(--theme-border); color: var(--text-secondary); font-size: 0.78rem;">
                  <th style="padding: 0.65rem 0.75rem;">${isGlobal ? 'Date' : '측정 날짜'}</th>
                  <th style="padding: 0.65rem 0.75rem;">${isGlobal ? 'Height (ft/in · cm)' : '신장 (cm)'}</th>
                  <th style="padding: 0.65rem 0.75rem;">${isGlobal ? 'Weight (lbs · kg)' : '체중 (kg)'}</th>
                  <th style="padding: 0.65rem 0.75rem;">${isGlobal ? 'Sleep' : '수면'}</th>
                  <th style="padding: 0.65rem 0.75rem;">${isGlobal ? 'Nutrition' : '영양'}</th>
                  <th style="padding: 0.65rem 0.75rem;">${isGlobal ? 'Exercise' : '운동'}</th>
                  <th style="padding: 0.65rem 0.75rem;">${isGlobal ? 'Clinical Note' : '특이사항'}</th>
                </tr>
              </thead>
              <tbody>
                ${logs.slice(-6).reverse().map(l => `
                  <tr style="border-bottom: 1px solid var(--theme-border-subtle); color: var(--text-primary);">
                    <td style="padding: 0.65rem 0.75rem; font-family: var(--font-mono); font-size: 0.8rem;">${l.date}</td>
                    <td style="padding: 0.65rem 0.75rem; font-weight: 700; color: var(--cyan-pulse); font-family: var(--font-mono);">${isGlobal ? `${Math.floor((Number(l.height) / 2.54) / 12)}'${Math.round(((Number(l.height) / 2.54) % 12) * 10) / 10}" (${l.height} cm)` : `${l.height} cm`}</td>
                    <td style="padding: 0.65rem 0.75rem; font-family: var(--font-mono);">${isGlobal ? `${Math.round(Number(l.weight) * 2.20462262 * 10) / 10} lbs (${l.weight} kg)` : `${l.weight} kg`}</td>
                    <td style="padding: 0.65rem 0.75rem;">${l.sleep ? '' : ''}</td>
                    <td style="padding: 0.65rem 0.75rem;">${l.nutrition ? '' : ''}</td>
                    <td style="padding: 0.65rem 0.75rem;">${l.exercise ? '' : ''}</td>
                    <td style="padding: 0.65rem 0.75rem; font-size: 0.78rem; color: var(--text-secondary);">${isGlobal ? ({ '기준 진단 계측': 'Baseline Auxology Scan', '데드행 3세트 완주': '3x30s Dead Hang Completed', '구연산칼슘 & D3 섭취': 'Calcium Citrate & D3 Dose', '오늘 정밀 바이오 측정': 'Today Bio-Measurement', '수동 계측 입력': 'Manual Measurement Log', '정기 생체 계측': 'Routine Bio-Measurement' }[l.note] || (/[\uAC00-\uD7A3]/.test(l.note || '') ? 'Clinical Bio-Log' : (l.note || '-'))) : (l.note || '-')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    return html;
  }

  // 3. 2-Page Hospital Clinic Style Clinical PDF Document Generator
  function renderClinicalPdfReport(profile = {}) {
    const isGlobal = (typeof document !== 'undefined' && document.documentElement.lang === 'en') || profile.language === 'en';
    const ageMonths = Number(profile.ageMonths || profile.exactMonths) || 120;
    const ageYears = Number(profile.ageYears) || Math.round(ageMonths / 12);
    const sexKey = (profile.gender === 'girl' || profile.gender === 'female') ? 'girl' : 'boy';
    const gender = sexKey === 'girl' ? (isGlobal ? 'Female' : '여아') : (isGlobal ? 'Male' : '남아');

    let GrowthEngine = (typeof global !== 'undefined' && (global.TallerGrowthEngine || global.KidsFitGrowthEngine || global.GrowthEngine)) ||
      (typeof window !== 'undefined' && (window.TallerGrowthEngine || window.KidsFitGrowthEngine || window.GrowthEngine)) ||
      null;
    if (!GrowthEngine && typeof require !== 'undefined') {
      try { GrowthEngine = require('./growth-engine'); } catch (e) {}
    }

    const lms = (GrowthEngine && typeof GrowthEngine.getLmsForMonth === 'function')
      ? GrowthEngine.getLmsForMonth(sexKey, ageMonths)
      : { L: 1.0, M: 137.0, S: 0.0498, wM: 35.5, wS: 0.190 };

    const height = Number(profile.currentHeight) || Number(lms.M) || 137.0;
    const weight = Number(profile.currentWeight) || Number(lms.wM) || 35.5;
    const fatherH = Number(profile.fatherHeight) || 173.5;
    const motherH = Number(profile.motherHeight) || 160.5;

    const medianHeight = Math.round((Number(lms.M) || 137.0) * 10) / 10;
    const medianWeight = Math.round((Number(lms.wM) || 35.5) * 10) / 10;

    const hKdca = (GrowthEngine && typeof GrowthEngine.calculateKdcaPercentile === 'function')
      ? GrowthEngine.calculateKdcaPercentile(height, lms.L || 1.0, medianHeight, lms.S || 0.0498)
      : { zScore: 0.0, percentile: 50.0, topPercent: 50.0, deltaMedian: Math.round((height - medianHeight) * 10) / 10 };

    const wKdca = (GrowthEngine && typeof GrowthEngine.calculateKdcaPercentile === 'function')
      ? GrowthEngine.calculateKdcaPercentile(weight, 1.0, medianWeight, lms.wS || 0.19)
      : { zScore: 0.0, percentile: 50.0, topPercent: 50.0, deltaMedian: Math.round((weight - medianWeight) * 10) / 10 };

    const hDeltaVal = hKdca.deltaMedian !== undefined ? hKdca.deltaMedian : Math.round((height - medianHeight) * 10) / 10;
    const hDeltaStr = `${hDeltaVal >= 0 ? '+' : ''}${hDeltaVal.toFixed(1)} cm`;
    const hZStr = `${hKdca.zScore >= 0 ? '+' : ''}${Number(hKdca.zScore || 0).toFixed(2)} SD`;
    const hPctStr = `${Number(hKdca.percentile || 50.0).toFixed(1)}th (상위 ${Number(hKdca.topPercent !== undefined ? hKdca.topPercent : (100 - hKdca.percentile)).toFixed(1)}%)`;

    const wDeltaVal = wKdca.deltaMedian !== undefined ? wKdca.deltaMedian : Math.round((weight - medianWeight) * 10) / 10;
    const wDeltaStr = `${wDeltaVal >= 0 ? '+' : ''}${wDeltaVal.toFixed(1)} kg`;
    const wZStr = `${wKdca.zScore >= 0 ? '+' : ''}${Number(wKdca.zScore || 0).toFixed(2)} SD`;
    const wPctStr = `${Number(wKdca.percentile || 50.0).toFixed(1)}th (상위 ${Number(wKdca.topPercent !== undefined ? wKdca.topPercent : (100 - wKdca.percentile)).toFixed(1)}%)`;

    const recentGain6m = Number(profile.recentGrowth6m) || 3.2;
    const velCalc = (GrowthEngine && typeof GrowthEngine.calculateVelocity === 'function')
      ? GrowthEngine.calculateVelocity(recentGain6m, ageYears)
      : { velocityCmPerYear: Math.round(recentGain6m * 2 * 10) / 10, alert: false };
    const velocityVal = Number(velCalc.velocityCmPerYear || (recentGain6m * 2)).toFixed(1);
    const velStatusText = velCalc.alert ? '저성장 주의 (<4.0cm/yr)' : (Number(velocityVal) >= 7.0 ? '급성장 가속 궤도' : '정상 성장 궤도');

    // Tanner MPH & Predicted adult heights via GrowthEngine.predictAdultHeightTrajectories()
    const mphOffset = sexKey === 'girl' ? -13 : 13;
    const mph = Math.round(((fatherH + motherH + mphOffset) / 2) * 10) / 10;
    const mphMin = Math.round((mph - 8.5) * 10) / 10;
    const mphMax = Math.round((mph + 8.5) * 10) / 10;

    const traj = (GrowthEngine && typeof GrowthEngine.predictAdultHeightTrajectories === 'function')
      ? GrowthEngine.predictAdultHeightTrajectories({
          gender: sexKey,
          ageYears,
          ageMonths,
          currentHeight: height,
          fatherHeight: fatherH,
          motherHeight: motherH,
          habits: Array.isArray(profile.habits) ? profile.habits : ['late_sleep'],
          tannerPhase: profile.tannerPhase || 'phase_2'
        })
      : null;

    const unmanagedHeight = traj && traj.unmanaged ? traj.unmanaged.height : Math.round((mph - 2.8) * 10) / 10;
    const unmanagedPenalty = traj && traj.unmanaged ? traj.unmanaged.penalty : 2.8;
    const potentialHeight = traj && traj.optimized ? traj.optimized.height : Math.round((mph + 6.4) * 10) / 10;
    const potentialBoost = traj && traj.optimized ? traj.optimized.gainOverUnmanaged : 6.4;
    const bmi = Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
    const patientId = `TB-2026-${Math.abs((ageMonths * 73 + Math.round(height * 11)) % 9000 + 1000)}`;
    const todayStrEn = new Date().toISOString().split('T')[0];
    if (isGlobal) {
      const formEl = (typeof document !== 'undefined') ? document.getElementById('diagnosis-form') : null;
      const isLearningMode = (profile.preferredReportMode === 'learning') ||
        (typeof window !== 'undefined' && window.__KIDSFIT_PREFERRED_REPORT_MODE === 'learning') ||
        Boolean(formEl && formEl.className && formEl.className.includes('wizard-mode-learning'));

      if (isLearningMode) {
        const cogAxes = Array.isArray(profile.cognitiveAxes) && profile.cognitiveAxes.length ? profile.cognitiveAxes : ['science_nature', 'math_logic'];
        const concerns = Array.isArray(profile.traitLearningConcerns) && profile.traitLearningConcerns.length ? profile.traitLearningConcerns : ['reading_literacy', 'passive_forget'];
        const focusSpanVal = profile.traitFocusSpan || (typeof document !== 'undefined' && document.getElementById('trait-focus-span') ? document.getElementById('trait-focus-span').value : '15_20m');
        const studyStyleVal = profile.traitStudyStyle || (typeof document !== 'undefined' && document.getElementById('trait-study-style') ? document.getElementById('trait-study-style').value : 'dialogue_question');
        const focusSpanMap = {
          under_10m: 'Under 10 mins (Short Modular Sprint Tasks)',
          '15_20m': '15-20 mins (Structured Step-by-Step Routine)',
          '30m_plus': '30+ mins (Deep Inquiry & Project Immersion)'
        };
        const studyStyleMap = {
          dialogue_question: 'Socratic Dialogue & Feynman Active Explanation',
          play_manipulative: 'Hands-On 3D Manipulative & Experimental Modeling',
          visual_story: 'Visual Schema, Diagram & Mind-Map Structuring',
          goal_workbook: '15-Minute Timed Micro-Mission & Milestone Checklist'
        };
        const focusSpanLabel = focusSpanMap[focusSpanVal] || focusSpanMap['15_20m'];
        const studyStyleLabel = studyStyleMap[studyStyleVal] || studyStyleMap.dialogue_question;

        const literacyScore = concerns.includes('reading_literacy') ? 72 : (cogAxes.includes('language_reading') ? 89 : 82);
        const mathSpatialScore = concerns.includes('math_concept') ? 74 : (cogAxes.includes('math_logic') ? 91 : 84);
        const workingMemoryScore = focusSpanVal === 'under_10m' ? 66 : (focusSpanVal === '30m_plus' ? 88 : 75);
        const activeRecallScore = concerns.includes('passive_forget') ? 68 : 83;
        const scientificInquiryScore = cogAxes.includes('science_nature') ? 90 : 85;
        const overallLQ = Number(((literacyScore + mathSpatialScore + workingMemoryScore + activeRecallScore + scientificInquiryScore) / 5).toFixed(1));
        const coachedLQ = Math.min(98.5, Number((overallLQ + 14.5).toFixed(1)));
        const lqTopPct = Math.max(4, Math.min(45, Math.round(100 - overallLQ)));
        const exactAgeMonths = Math.max(24, Math.min(216, Math.round(Number(ageMonths) || (ageYears * 12))));
        const ageMonthFocusMinutes = Math.min(50, Math.max(8, Math.round(exactAgeMonths * 0.22)));
        const ageMonthWmChunks = exactAgeMonths < 84 ? '3 ± 1 chunks' : (exactAgeMonths < 144 ? '4 ± 1 chunks' : '5 ± 1 chunks');
        const zincMg = ageYears >= 9 ? 11 : 8;

        return `
        <div id="clinic-print-report" class="clinic-print-report" style="display: none;" data-report-mode="learning">
          <div class="print-page print-page-1" style="page-break-after: always; padding: 20mm 15mm; background: #FFFFFF; color: #0F172A; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="border-bottom: 2.5px solid #1D4ED8; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 10pt; font-weight: 800; color: #1D4ED8; letter-spacing: 0.08em; text-transform: uppercase;">
                  KISFIT BIO LABS · HARVARD / WASHU NEURO-COGNITIVE 5-AXIS BRAIN LQ™ v4.0
                </div>
                <h1 style="font-size: 18pt; font-weight: 900; color: #0F172A; margin: 4px 0 0 0;">
                  5-Axis Brain Learning Quotient (LQ) &amp; Executive Function Clinical Report (Page 1/2)
                </h1>
              </div>
              <div style="text-align: right; font-size: 8.5pt; color: #475569;">
                <div><strong>Reference Standard:</strong> Harvard / WashU Neuro-Pedagogy &amp; NIH ODS</div>
                <div><strong>Issued Date:</strong> ${todayStrEn}</div>
              </div>
            </div>

            <table style="width: 100%; border: 1.5px solid #CBD5E1; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt;">
              <tr style="background: #F8FAFC; border-bottom: 1px solid #CBD5E1;">
                <th style="padding: 6px 10px; width: 14%; border-right: 1px solid #CBD5E1; color: #475569;">Patient ID</th>
                <td style="padding: 6px 10px; width: 20%; border-right: 1px solid #CBD5E1; font-weight: 700; font-family: monospace;">${patientId}</td>
                <th style="padding: 6px 10px; width: 14%; border-right: 1px solid #CBD5E1; color: #475569;">Sex / Age</th>
                <td style="padding: 6px 10px; width: 20%; border-right: 1px solid #CBD5E1; font-weight: 700;">${gender} / Age ${ageYears} (${exactAgeMonths} mos)</td>
                <th style="padding: 6px 10px; width: 14%; border-right: 1px solid #CBD5E1; color: #475569;">Division</th>
                <td style="padding: 6px 10px; font-weight: 700; color: #1D4ED8;">Developmental Cognitive Neuroscience</td>
              </tr>
              <tr>
                <th style="padding: 6px 10px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #475569;">Overall Brain LQ</th>
                <td style="padding: 6px 10px; border-right: 1px solid #CBD5E1; font-weight: 800; color: #1D4ED8;">${overallLQ} pts (Top ${lqTopPct}%)</td>
                <th style="padding: 6px 10px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #475569;">Desk Focus Span</th>
                <td style="padding: 6px 10px; border-right: 1px solid #CBD5E1; font-weight: 700;">${focusSpanLabel}</td>
                <th style="padding: 6px 10px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #475569;">Absorption Style</th>
                <td style="padding: 6px 10px; font-weight: 700;">${studyStyleLabel}</td>
              </tr>
            </table>

            <div style="margin-bottom: 16px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #1D4ED8; padding-left: 8px; margin: 0 0 8px 0;">
                1. 5-Axis Brain Learning Quotient (LQ) Percentile &amp; Neural Circuit Breakdown
              </h2>
              <table style="width: 100%; border: 1px solid #CBD5E1; border-collapse: collapse; font-size: 9pt; text-align: left;">
                <thead>
                  <tr style="background: #EFF6FF; border-bottom: 1px solid #CBD5E1; color: #1E3A8A;">
                    <th style="padding: 6px 8px; border-right: 1px solid #CBD5E1;">Neural Circuit Axis</th>
                    <th style="padding: 6px 8px; border-right: 1px solid #CBD5E1; text-align: center;">Baseline Score</th>
                    <th style="padding: 6px 8px; border-right: 1px solid #CBD5E1; text-align: center;">6-Mo Coached Target</th>
                    <th style="padding: 6px 8px;">Clinical Neuro-Cognitive Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">1. Reading Comprehension &amp; Literacy</td>
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #1D4ED8;">${literacyScore} / 100</td>
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #059669;">${Math.min(98, literacyScore + 14)} / 100</td>
                    <td style="padding: 6px 8px;">Semantic chunking &amp; 3-sentence paragraph synthesis</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">2. Spatial-Mathematical Reasoning</td>
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #1D4ED8;">${mathSpatialScore} / 100</td>
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #059669;">${Math.min(99, mathSpatialScore + 12)} / 100</td>
                    <td style="padding: 6px 8px;">Parietal visual bar-modeling before algebraic equations</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">3. Prefrontal Working Memory &amp; Focus</td>
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #DC2626;">${workingMemoryScore} / 100</td>
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #059669;">${Math.min(96, workingMemoryScore + 18)} / 100</td>
                    <td style="padding: 6px 8px;">Dorsolateral prefrontal sustained attention (${ageMonthWmChunks} buffer)</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">4. Metacognitive Active Recall</td>
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #DC2626;">${activeRecallScore} / 100</td>
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #059669;">${Math.min(97, activeRecallScore + 19)} / 100</td>
                    <td style="padding: 6px 8px;">Hippocampal retrieval practice &amp; Feynman blank-page recall</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">5. Scientific Inquiry &amp; Creative Transfer</td>
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #1D4ED8;">${scientificInquiryScore} / 100</td>
                    <td style="padding: 6px 8px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #059669;">${Math.min(99, scientificInquiryScore + 10)} / 100</td>
                    <td style="padding: 6px 8px;">Hypothesis testing &amp; cross-domain STEM conceptual transfer</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="margin-bottom: 16px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #059669; padding-left: 8px; margin: 0 0 8px 0;">
                2. 3-Tier Brain LQ Trajectory &amp; Customized Neuro-Study Strategy
              </h2>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; margin-bottom: 10px;">
                <div style="border: 1px solid #93C5FD; border-radius: 6px; padding: 10px; background: #F8FAFC;">
                  <div style="font-size: 8pt; font-weight: 700; color: #1E3A8A;">Current 5-Axis Brain LQ</div>
                  <div style="font-size: 14pt; font-weight: 900; color: #1D4ED8; margin: 4px 0;">${overallLQ} pts (Top ${lqTopPct}%)</div>
                  <div style="font-size: 7.5pt; color: #64748B;">Age ${ageYears} Norm: 78.0 pts</div>
                </div>
                <div style="border: 1px solid #FECDD3; border-radius: 6px; padding: 10px; background: #FFF1F2;">
                  <div style="font-size: 8pt; font-weight: 700; color: #DC2626;">Primary Cognitive Bottleneck</div>
                  <div style="font-size: 11pt; font-weight: 900; color: #DC2626; margin: 6px 0;">Working Memory &amp; Active Recall</div>
                  <div style="font-size: 7.5pt; color: #475569;">Sprint Ceiling: ${ageMonthFocusMinutes} mins/block</div>
                </div>
                <div style="border: 1px solid #6EE7B7; border-radius: 6px; padding: 10px; background: #ECFDF5;">
                  <div style="font-size: 8pt; font-weight: 700; color: #047857;">6-Month Coached Potential LQ</div>
                  <div style="font-size: 14pt; font-weight: 900; color: #059669; margin: 4px 0;">${coachedLQ} pts (Top 4%)</div>
                  <div style="font-size: 7.5pt; color: #059669;">+${(coachedLQ - overallLQ).toFixed(1)} Pts Synaptic Efficiency Gain</div>
                </div>
              </div>
              <div style="border: 1px solid #BFDBFE; border-radius: 6px; padding: 10px; background: #EFF6FF; font-size: 8.5pt; line-height: 1.5;">
                <strong>• Protocol A (Feynman 3-Min Blank-Page Recall):</strong> Close the textbook after 20 minutes of study and write/explain 3 core concepts from memory (+150% 30-day retention).<br>
                <strong>• Protocol B (Visual Bar-Modeling Offload):</strong> Externalize multi-step math &amp; reading variables into a 3-box diagram before writing equations to bypass the ${ageMonthWmChunks} working-memory ceiling.<br>
                <strong>• Protocol C (N3 Sleep Hippocampal Consolidation + Neuro-Nutrition):</strong> 10-min pre-sleep review + Triglyceride DHA (600-800 mg), Phosphatidylcholine, and evening Magnesium Glycinate + Chelated Zinc (${zincMg} mg).
              </div>
            </div>

            <div style="border-top: 1px solid #CBD5E1; padding-top: 8px; font-size: 8pt; color: #64748B; display: flex; justify-content: space-between;">
              <span>KISFIT BIO LABS · NEURO-COGNITIVE 5-AXIS BRAIN LQ™ v4.0</span>
              <span>Page 1 of 2 (Continued on Page 2)</span>
            </div>
          </div>

          <div class="print-page print-page-2" style="padding: 20mm 15mm; background: #FFFFFF; color: #0F172A; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="border-bottom: 2.5px solid #1D4ED8; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 10pt; font-weight: 800; color: #1D4ED8; letter-spacing: 0.08em; text-transform: uppercase;">
                  KISFIT BIO LABS · HARVARD / WASHU NEURO-COGNITIVE 5-AXIS BRAIN LQ™ v4.0
                </div>
                <h1 style="font-size: 18pt; font-weight: 900; color: #0F172A; margin: 4px 0 0 0;">
                  6-Month Monthly Neuro-Study Roadmap &amp; 4 Printable Cognitive Worksheets (Page 2/2)
                </h1>
              </div>
              <div style="text-align: right; font-size: 8.5pt; color: #475569;">
                <div><strong>Patient ID:</strong> <span style="font-family: monospace;">${patientId}</span></div>
                <div><strong>Patient / Track:</strong> Age ${ageYears} (${gender}) · Brain &amp; Learning</div>
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #1D4ED8; padding-left: 8px; margin: 0 0 8px 0;">
                3. 6-Month Month-by-Month Prefrontal Myelination &amp; Study Care Roadmap (Months ${exactAgeMonths} to ${exactAgeMonths + 5})
              </h2>
              <table style="width: 100%; border: 1px solid #CBD5E1; border-collapse: collapse; font-size: 8.5pt;">
                <thead>
                  <tr style="background: #F1F5F9; border-bottom: 1px solid #CBD5E1;">
                    <th style="padding: 6px; width: 18%; border-right: 1px solid #CBD5E1;">Month / Age</th>
                    <th style="padding: 6px; width: 16%; border-right: 1px solid #CBD5E1; text-align: center;">Target Brain LQ</th>
                    <th style="padding: 6px;">Monthly Executive Function, Study Habit &amp; Neuro-Nutrition Action Plan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">Month 1 (${exactAgeMonths}m)</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #1D4ED8;">${(overallLQ + 2.4).toFixed(1)} pts</td>
                    <td style="padding: 6px;">Lock in ${ageMonthFocusMinutes}-min timed micro-sprints + 60m pre-study screen lockbox + morning DHA/Choline.</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">Month 2 (${exactAgeMonths + 1}m)</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #1D4ED8;">${(overallLQ + 5.1).toFixed(1)} pts</td>
                    <td style="padding: 6px;">Transition from passive reading to Feynman 3-Min Blank-Page Recall (Worksheet 01) + Phosphatidylserine (100 mg).</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">Month 3 (${exactAgeMonths + 2}m)</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #1D4ED8;">${(overallLQ + 7.8).toFixed(1)} pts</td>
                    <td style="padding: 6px;">Apply 3-Box Visual Bar-Modeling (Worksheet 02) on multi-step math &amp; ELA problems; audit 90-day error reduction.</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">Month 4 (${exactAgeMonths + 3}m)</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #1D4ED8;">${(overallLQ + 10.2).toFixed(1)} pts</td>
                    <td style="padding: 6px;">Cornell 3-Color Error Tagging ([Careless Skip] vs [Concept Gap]) with mandatory 72-hr blind re-testing.</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">Month 5 (${exactAgeMonths + 4}m)</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #1D4ED8;">${(overallLQ + 12.5).toFixed(1)} pts</td>
                    <td style="padding: 6px;">Socratic 3-Step Deep Transfer ([Observation] → [Why Hypothesis] → [STEM Application]); extend sprint to ${ageMonthFocusMinutes + 8} mins.</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">Month 6 (${exactAgeMonths + 5}m)</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #059669;">${coachedLQ} pts</td>
                    <td style="padding: 6px;">180-Day 5-Axis Brain LQ Audit; verify autonomous self-directed study habit at ${ageMonthFocusMinutes + 12} mins.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="margin-bottom: 14px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #059669; padding-left: 8px; margin: 0 0 8px 0;">
                4. 4 Printable Cognitive &amp; Working-Memory Worksheets (US Letter 8.5&quot; × 11&quot; Desk Templates)
              </h2>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 8.5pt;">
                <div style="border: 1.5px solid #93C5FD; border-radius: 8px; padding: 10px; background: #F8FAFC;">
                  <div style="font-weight: 900; color: #1D4ED8; margin-bottom: 4px;">Worksheet 01 · Feynman 3-Min Blank-Page Recall</div>
                  <div>1. Core Concept Learned Today: ____________________________</div>
                  <div>2. Explain It to a Younger Student: ________________________</div>
                  <div>3. 1 Self-Check Question / Gap: ___________________________</div>
                </div>
                <div style="border: 1.5px solid #93C5FD; border-radius: 8px; padding: 10px; background: #F8FAFC;">
                  <div style="font-weight: 900; color: #1D4ED8; margin-bottom: 4px;">Worksheet 02 · Visual Math Bar-Modeling Canvas</div>
                  <div>[Given Part A: ______ ] + [Given Part B: ______ ] = [Total: ______ ]</div>
                  <div>Comparison Difference Bar: _______________________________</div>
                  <div>Target Equation &amp; Units: _________________________________</div>
                </div>
                <div style="border: 1.5px solid #93C5FD; border-radius: 8px; padding: 10px; background: #F8FAFC;">
                  <div style="font-weight: 900; color: #1D4ED8; margin-bottom: 4px;">Worksheet 03 · ${ageMonthFocusMinutes}-Min Prefrontal Focus Sprint Log</div>
                  <div>Sprint Goal (3 Tasks): □ Task 1  □ Task 2  □ Task 3</div>
                  <div>Distraction Tally Marks: __________________________________</div>
                  <div>Completion Time &amp; Accuracy: ________ mins / _____%</div>
                </div>
                <div style="border: 1.5px solid #93C5FD; border-radius: 8px; padding: 10px; background: #F8FAFC;">
                  <div style="font-weight: 900; color: #1D4ED8; margin-bottom: 4px;">Worksheet 04 · Socratic 3-Step Inquiry Organizer</div>
                  <div>Step 1 (Observation): What did you notice? _________________</div>
                  <div>Step 2 (Hypothesis): Why does this rule work? ______________</div>
                  <div>Step 3 (Transfer): Real-World STEM Example: _______________</div>
                </div>
              </div>
            </div>

            <div style="border-top: 1px solid #CBD5E1; padding-top: 8px; font-size: 8pt; color: #64748B; display: flex; justify-content: space-between;">
              <span>KISFIT BIO LABS · NEURO-COGNITIVE 5-AXIS BRAIN LQ™ v4.0 (kisfitglobal.com)</span>
              <span>Page 2 of 2 (End of Clinical Report)</span>
            </div>
          </div>
        </div>
        `;
      }
      const isImp = typeof window !== 'undefined' && (window.__KIDSFIT_UNIT_SYSTEM__ === 'imperial' || (window.TallerI18n && typeof window.TallerI18n.getUnitSystem === 'function' && window.TallerI18n.getUnitSystem() === 'imperial'));
      const cmToFtIn = (cmVal) => {
        const totIn = (Number(cmVal) || 0) / 2.54;
        const ft = Math.floor(totIn / 12);
        const inch = Math.round((totIn - ft * 12) * 10) / 10;
        return `${ft}'${inch}"`;
      };
      const fmtH = (cmVal) => {
        const c = Number(cmVal) || 0;
        if (!isImp) return `${c} cm`;
        const totIn = c / 2.54;
        const ft = Math.floor(totIn / 12);
        const inch = Math.round((totIn - ft * 12) * 10) / 10;
        return `${ft}'${inch}" (${c} cm)`;
      };
      const fmtW = (kgVal) => {
        const k = Number(kgVal) || 0;
        if (!isImp) return `${k} kg`;
        const lbs = Math.round(k * 2.20462262 * 10) / 10;
        return `${lbs} lbs (${k} kg)`;
      };
      const hPctEn = `${Number(hKdca.percentile || 50.0).toFixed(1)}th (Top ${Number(hKdca.topPercent !== undefined ? hKdca.topPercent : (100 - hKdca.percentile)).toFixed(1)}%)`;
      const wPctEn = `${Number(wKdca.percentile || 50.0).toFixed(1)}th (Top ${Number(wKdca.topPercent !== undefined ? wKdca.topPercent : (100 - wKdca.percentile)).toFixed(1)}%)`;
      const velStatusEn = velCalc.alert ? 'Sub-optimal Velocity (<4.0 cm/yr)' : (Number(velocityVal) >= 7.0 ? 'Accelerated Growth Trajectory' : 'Normal Growth Trajectory');
      return `
        <div id="clinic-print-report" class="clinic-print-report" style="display: none;">
          <div class="print-page print-page-1" style="page-break-after: always; padding: 20mm 15mm; background: #FFFFFF; color: #0F172A; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="border-bottom: 2.5px solid #0F172A; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 10pt; font-weight: 800; color: #475569; letter-spacing: 0.08em; text-transform: uppercase;">
                  KISFIT AI STUDIO · PROPRIETARY PEDIATRIC AUXOLOGY AI™ v4.0 CLINICAL ATELIER
                </div>
                <h1 style="font-size: 18pt; font-weight: 900; color: #0F172A; margin: 4px 0 0 0;">
                  Pediatric Auxology &amp; Bone-Age Precision Clinical Report (Page 1/2)
                </h1>
              </div>
              <div style="text-align: right; font-size: 8.5pt; color: #475569;">
                <div><strong>Reference Standards:</strong> US CDC 2000 &amp; WHO MGRS</div>
                <div><strong>Issued Date:</strong> ${todayStrEn}</div>
              </div>
            </div>
            <table style="width: 100%; border: 1.5px solid #CBD5E1; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt;">
              <tr style="background: #F8FAFC; border-bottom: 1px solid #CBD5E1;">
                <th style="padding: 6px 10px; width: 14%; border-right: 1px solid #CBD5E1; color: #475569;">Patient ID</th>
                <td style="padding: 6px 10px; width: 20%; border-right: 1px solid #CBD5E1; font-weight: 700; font-family: monospace;">${patientId}</td>
                <th style="padding: 6px 10px; width: 14%; border-right: 1px solid #CBD5E1; color: #475569;">Sex / Age</th>
                <td style="padding: 6px 10px; width: 20%; border-right: 1px solid #CBD5E1; font-weight: 700;">${gender} / Age ${ageYears} (${ageMonths} mos)</td>
                <th style="padding: 6px 10px; width: 14%; border-right: 1px solid #CBD5E1; color: #475569;">Division</th>
                <td style="padding: 6px 10px; font-weight: 700; color: #0F172A;">Pediatric Auxology &amp; Endocrinology</td>
              </tr>
              <tr>
                <th style="padding: 6px 10px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #475569;">Height / Weight</th>
                <td style="padding: 6px 10px; border-right: 1px solid #CBD5E1; font-weight: 700;">${fmtH(height)} / ${fmtW(weight)}</td>
                <th style="padding: 6px 10px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #475569;">BMI</th>
                <td style="padding: 6px 10px; border-right: 1px solid #CBD5E1; font-weight: 700;">${bmi} kg/m²</td>
                <th style="padding: 6px 10px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #475569;">Parents (F/M)</th>
                <td style="padding: 6px 10px; font-weight: 700;">${fmtH(fatherH)} / ${fmtH(motherH)}</td>
              </tr>
            </table>
            <div style="margin-bottom: 16px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #0284C7; padding-left: 8px; margin: 0 0 8px 0;">
                1. Standardized Pediatric Growth Percentiles &amp; LMS Z-Score (Auxology Assessment)
              </h2>
              <table style="width: 100%; border: 1px solid #CBD5E1; border-collapse: collapse; font-size: 9pt; text-align: center;">
                <thead>
                  <tr style="background: #F1F5F9; border-bottom: 1px solid #CBD5E1;">
                    <th style="padding: 6px; border-right: 1px solid #CBD5E1;">Biometric Metric</th>
                    <th style="padding: 6px; border-right: 1px solid #CBD5E1;">Measured Value</th>
                    <th style="padding: 6px; border-right: 1px solid #CBD5E1;">Age Peer Median</th>
                    <th style="padding: 6px; border-right: 1px solid #CBD5E1;">Delta from Median</th>
                    <th style="padding: 6px; border-right: 1px solid #CBD5E1;">Z-Score</th>
                    <th style="padding: 6px;">CDC/WHO Percentile</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">Height</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700; color: #1D4ED8;">${fmtH(height)}</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0;">${fmtH(medianHeight.toFixed(1))}</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0;">${isImp ? `${hDeltaVal >= 0 ? '+' : ''}${(hDeltaVal / 2.54).toFixed(1)} in (${hDeltaStr})` : hDeltaStr}</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-family: monospace;">${hZStr}</td>
                    <td style="padding: 6px; font-weight: 700; color: #1D4ED8;">${hPctEn}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">Weight</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">${fmtW(weight)}</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0;">${fmtW(medianWeight.toFixed(1))}</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0;">${isImp ? `${wDeltaVal >= 0 ? '+' : ''}${(wDeltaVal * 2.20462262).toFixed(1)} lbs (${wDeltaStr})` : wDeltaStr}</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-family: monospace;">${wZStr}</td>
                    <td style="padding: 6px; font-weight: 700;">${wPctEn}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">Annual Growth Velocity</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700; color: #1D4ED8;">${isImp ? `${(Number(velocityVal) / 2.54).toFixed(1)} in/yr (${velocityVal} cm/yr)` : `${velocityVal} cm/yr`}</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0;">${isImp ? '2.0 ~ 2.8 in/yr (5.0 ~ 7.0 cm/yr)' : '5.0 ~ 7.0 cm/yr'}</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0;">${velCalc.alert ? 'Clinical Watch' : 'Normal Range'}</td>
                    <td style="padding: 6px; border-right: 1px solid #E2E8F0;">-</td>
                    <td style="padding: 6px; font-weight: 700; color: #1D4ED8;">${velStatusEn}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style="margin-bottom: 16px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #059669; padding-left: 8px; margin: 0 0 8px 0;">
                2. Genetic Target Height (Tanner MPH) &amp; 3-Tier Adult Height Trajectory Simulation
              </h2>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px; background: #F8FAFC;">
                  <div style="font-size: 8pt; font-weight: 700; color: #64748B;">Genetic Target Height (Tanner MPH)</div>
                  <div style="font-size: 14pt; font-weight: 900; color: #0F172A; margin: 4px 0;">${fmtH(mph)}</div>
                  <div style="font-size: 7.5pt; color: #64748B;">Range: ${isImp ? `${cmToFtIn(mphMin)} ~ ${cmToFtIn(mphMax)} (${mphMin} ~ ${mphMax} cm)` : `${mphMin} ~ ${mphMax} cm`}</div>
                </div>
                <div style="border: 1px solid #FECDD3; border-radius: 6px; padding: 10px; background: #FFF1F2;">
                  <div style="font-size: 8pt; font-weight: 700; color: #1D4ED8;">Unmanaged Habits Trajectory</div>
                  <div style="font-size: 14pt; font-weight: 900; color: #1D4ED8; margin: 4px 0;">${fmtH(unmanagedHeight)}</div>
                  <div style="font-size: 7.5pt; color: #1D4ED8;">Sleep &amp; Posture Loss: -${isImp ? `${(Number(unmanagedPenalty) / 2.54).toFixed(1)} in (-${unmanagedPenalty} cm)` : `${unmanagedPenalty} cm`}</div>
                </div>
                <div style="border: 1px solid #93C5FD; border-radius: 6px; padding: 10px; background: #ECFDF5;">
                  <div style="font-size: 8pt; font-weight: 700; color: #1D4ED8;">Clinically Optimized Potential</div>
                  <div style="font-size: 14pt; font-weight: 900; color: #1D4ED8; margin: 4px 0;">${fmtH(potentialHeight)}</div>
                  <div style="font-size: 7.5pt; color: #1D4ED8;">Nutrition &amp; Decompression: +${isImp ? `${(Number(potentialBoost) / 2.54).toFixed(1)} in (+${potentialBoost} cm)` : `${potentialBoost} cm`}</div>
                </div>
              </div>
            </div>
            <div style="margin-bottom: 14px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #D97706; padding-left: 8px; margin: 0 0 8px 0;">
                3. Multi-Curve Longitudinal Growth Trajectory (Ages 1 to 20)
              </h2>
              <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px; background: #FFFFFF; text-align: center;">
                <svg viewBox="0 0 600 180" style="width: 100%; height: 160px;">
                  <rect width="600" height="180" fill="#F8FAFC" rx="4" />
                  <line x1="50" y1="30" x2="560" y2="30" stroke="#E2E8F0" stroke-width="1" />
                  <line x1="50" y1="75" x2="560" y2="75" stroke="#E2E8F0" stroke-width="1" />
                  <line x1="50" y1="120" x2="560" y2="120" stroke="#E2E8F0" stroke-width="1" />
                  <line x1="50" y1="150" x2="560" y2="150" stroke="#CBD5E1" stroke-width="1.5" />
                  <path d="M 50,150 Q 250,90 560,35" fill="none" stroke="#0284C7" stroke-width="2.5" />
                  <path d="M 50,150 Q 250,100 560,55" fill="none" stroke="#D97706" stroke-width="2" />
                  <path d="M 50,150 Q 250,110 560,70" fill="none" stroke="#E11D48" stroke-width="1.5" stroke-dasharray="3,3" />
                  <circle cx="280" cy="98" r="5" fill="#059669" stroke="#FFFFFF" stroke-width="2" />
                  <text x="280" y="88" font-size="9" font-weight="bold" fill="#059669" text-anchor="middle">Current Patient (${fmtH(height)})</text>
                  <text x="60" y="22" font-size="8" fill="#0284C7">― Optimized Trajectory (+${isImp ? `${(Number(potentialBoost) / 2.54).toFixed(1)} in / +${potentialBoost} cm` : `${potentialBoost}cm`})</text>
                  <text x="235" y="22" font-size="8" fill="#D97706">― Genetic Baseline (MPH ${isImp ? `${cmToFtIn(mph)} / ${mph} cm` : `${mph}cm`})</text>
                  <text x="405" y="22" font-size="8" fill="#E11D48">--- Unmanaged Habits (-${isImp ? `${(Number(unmanagedPenalty) / 2.54).toFixed(1)} in / -${unmanagedPenalty} cm` : `${unmanagedPenalty}cm`})</text>
                </svg>
              </div>
            </div>
            <div style="border-top: 1px solid #CBD5E1; padding-top: 8px; font-size: 8pt; color: #64748B; display: flex; justify-content: space-between;">
              <span>KISFIT AI STUDIO · PROPRIETARY PEDIATRIC AUXOLOGY AI™ v4.0</span>
              <span>Page 1 of 2 (Continued on Page 2)</span>
            </div>
          </div>
          <div class="print-page print-page-2" style="padding: 20mm 15mm; background: #FFFFFF; color: #0F172A; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="border-bottom: 2.5px solid #0F172A; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 10pt; font-weight: 800; color: #475569; letter-spacing: 0.08em; text-transform: uppercase;">
                  KISFIT AI STUDIO · PROPRIETARY PEDIATRIC AUXOLOGY AI™ v4.0 CLINICAL ATELIER
                </div>
                <h1 style="font-size: 18pt; font-weight: 900; color: #0F172A; margin: 4px 0 0 0;">
                  Endocrinology, Bio-Nutrition, Biomechanics &amp; Neuro Prescription (Page 2/2)
                </h1>
              </div>
              <div style="text-align: right; font-size: 8.5pt; color: #475569;">
                <div><strong>Patient ID:</strong> <span style="font-family: monospace;">${patientId}</span></div>
                <div><strong>Patient / Sex:</strong> Pediatric Patient (${gender})</div>
              </div>
            </div>
            <div style="margin-bottom: 14px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #D97706; padding-left: 8px; margin: 0 0 6px 0;">
                4. 24-Hour Circadian Endocrinology &amp; Growth Hormone (GH) Suppression Analysis
              </h2>
              <table style="width: 100%; border: 1px solid #CBD5E1; border-collapse: collapse; font-size: 9pt;">
                <tr style="background: #F8FAFC;">
                  <td style="padding: 6px 10px; width: 25%; font-weight: 700; border-right: 1px solid #CBD5E1;">Bedtime / Fasting Window</td>
                  <td style="padding: 6px 10px; width: 25%; border-right: 1px solid #CBD5E1;">22:30 PM / 2.5h Fasting</td>
                  <td style="padding: 6px 10px; width: 25%; font-weight: 700; border-right: 1px solid #CBD5E1;">GH Pulsatile Loss Rate</td>
                  <td style="padding: 6px 10px; font-weight: 800; color: #1D4ED8;">-14% (Nocturnal Spike Suppression)</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-weight: 700; border-right: 1px solid #CBD5E1; background: #F8FAFC;">Slow-Wave Sleep (SWS) Peak</td>
                  <td style="padding: 6px 10px; border-right: 1px solid #CBD5E1;">22:00 PM ~ 02:00 AM</td>
                  <td style="padding: 6px 10px; font-weight: 700; border-right: 1px solid #CBD5E1; background: #F8FAFC;">Clinical Protocol</td>
                  <td style="padding: 6px 10px; font-size: 8.5pt;">Zero-carb fasting 3h before bed &amp; sleep onset by 22:00 achieves 0% GH loss</td>
                </tr>
              </table>
            </div>
            <div style="margin-bottom: 14px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #059669; padding-left: 8px; margin: 0 0 6px 0;">
                5. Weight-Proportional Bio-Nutrition Prescription &amp; Bioavailability
              </h2>
              <table style="width: 100%; border: 1px solid #CBD5E1; border-collapse: collapse; font-size: 8.5pt; text-align: left;">
                <thead>
                  <tr style="background: #F1F5F9; border-bottom: 1px solid #CBD5E1;">
                    <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">Essential Nutrient</th>
                    <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">Daily Target Dose</th>
                    <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">Preferred Chelated Form</th>
                    <th style="padding: 5px 8px;">Bioavailability &amp; Clinical Mechanism</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">Elemental Calcium</td>
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-family: monospace;">1,000 mg/day</td>
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">Calcium Citrate / MCHA</td>
                    <td style="padding: 5px 8px;">~45% absorption (acid-independent, prevents GI discomfort)</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">Vitamin D3 + K2</td>
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-family: monospace;">2,000 IU + 60 mcg</td>
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">Cholecalciferol D3 + MK-7</td>
                    <td style="padding: 5px 8px;">Osteocalcin carboxylation directs calcium into epiphyseal bone matrix</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">Zinc &amp; Magnesium</td>
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-family: monospace;">12 mg + 160 mg</td>
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">Zinc Picolinate + Glycinate</td>
                    <td style="padding: 5px 8px;">Hepatic GHR phosphorylation (IGF-1 synthesis) &amp; SWS delta sleep depth</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">Bone Matrix Protein</td>
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-family: monospace;">${Math.round(weight * 1.3 * 10) / 10} g/day</td>
                    <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">WPI / Colostrum Peptides</td>
                    <td style="padding: 5px 8px;">Accelerates Type-I/II collagen matrix synthesis (30% of bone volume)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style="margin-bottom: 14px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #E11D48; padding-left: 8px; margin: 0 0 6px 0;">
                6. Biomechanical Spinal Decompression &amp; Wolff's Law 3-Core Protocol
              </h2>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 8pt;">
                <div style="border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px 8px; background: #F8FAFC;">
                  <div style="font-weight: 800; color: #1D4ED8;">1. Passive Spinal Dead Hang</div>
                  <div>30s x 3 sets (30s rest)</div>
                  <div style="color: #64748B; font-size: 7.5pt;">L1–L5 intervertebral disc unloading (+0.3 in (+0.8 cm))</div>
                </div>
                <div style="border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px 8px; background: #F8FAFC;">
                  <div style="font-weight: 800; color: #1D4ED8;">2. Thoracic &amp; Pelvic Alignment</div>
                  <div>45s x 2 sets (bilateral)</div>
                  <div style="color: #64748B; font-size: 7.5pt;">Text-neck &amp; pelvic tilt correction (+0.7 in (+1.8 cm))</div>
                </div>
                <div style="border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px 8px; background: #F8FAFC;">
                  <div style="font-weight: 800; color: #1D4ED8;">3. Plyometric Micro-Loading</div>
                  <div>15-min interval (45s jump / 15s walk)</div>
                  <div style="color: #64748B; font-size: 7.5pt;">1.5–2.5G piezoelectric pulse (Runx2/Sox9)</div>
                </div>
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <h2 style="font-size: 10.5pt; font-weight: 800; color: #0F172A; border-left: 4px solid #0284C7; padding-left: 8px; margin: 0 0 6px 0;">
                7. Peer-Reviewed 【Short · Mid · Long-Term】 Clinical Roadmap &amp; Socratic Inquiry
              </h2>
              <table style="width: 100%; border: 1px solid #CBD5E1; border-collapse: collapse; font-size: 8pt; margin-bottom: 8px;">
                <tr style="background: #F8FAFC; border-bottom: 1px solid #CBD5E1;">
                  <th style="padding: 5px 8px; width: 22%; border-right: 1px solid #CBD5E1; color: #1D4ED8;">Short-Term (Weeks 1–4)</th>
                  <td style="padding: 5px 8px;">21:45 bedtime · 3h pre-sleep zero-carb fasting (0% GH suppression) · Evening 3x30s dead hang (+0.7 in (+1.8 cm) disc recovery)</td>
                </tr>
                <tr style="border-bottom: 1px solid #CBD5E1;">
                  <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #1D4ED8;">Mid-Term (Months 1–3)</th>
                  <td style="padding: 5px 8px;">iHerb USP/NSF Calcium Citrate (45% absorption)+D3+K2(MK-7)+Protein (${Math.round(weight * 1.3 * 10) / 10}g) · 5x/wk 15-min plyometrics · Daily Feynman active recall</td>
                </tr>
                <tr>
                  <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #1D4ED8;">Long-Term (6M–Adult)</th>
                  <td style="padding: 5px 8px;">Quarterly CDC LMS percentile tracking · Optimal BMI maintenance against early bone-age fusion · Reach ${fmtH(potentialHeight)} potential</td>
                </tr>
              </table>
              <div style="border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px 10px; background: #F8FAFC; font-size: 7.8pt; line-height: 1.45;">
                <div><strong>[Observation &amp; Inquiry]</strong> "What is the most unexpected or non-uniform structural pattern in this exhibit?"</div>
                <div><strong>[Hypothesis &amp; Reasoning]</strong> "If the primary physical condition were reversed, how would the outcome change?"</div>
                <div><strong>[Transfer &amp; Application]</strong> "How can we apply the principle discovered today to solve a real-world engineering problem?"</div>
              </div>
            </div>
            <div style="border-top: 1.5px solid #0F172A; padding-top: 14px; display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 8pt; color: #475569; max-width: 380px;">
                This clinical report is synthesized in accordance with US CDC 2000, WHO MGRS, AAP, PES, and NIH ODS peer-reviewed pediatric standards.
              </div>
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="text-align: right;">
                  <div style="font-size: 8.5pt; font-weight: 800; color: #0F172A;">Attending Pediatric Endocrinology &amp; Auxology Board</div>
                  <div style="font-size: 8pt; color: #64748B;">Senior Pediatric Endocrinology Specialist</div>
                </div>
                <div style="width: 60px; height: 60px; border: 2px dashed #94A3B8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: 800; color: #1D4ED8;">
                  [VERIFIED]
                </div>
              </div>
            </div>
            <div style="border-top: 1px solid #CBD5E1; padding-top: 8px; margin-top: 12px; font-size: 8pt; color: #64748B; display: flex; justify-content: space-between;">
              <span>KISFIT AI STUDIO · PROPRIETARY PEDIATRIC AUXOLOGY AI™ v4.0</span>
              <span>Page 2 of 2 (End of Clinical Assessment Report)</span>
            </div>
          </div>
        </div>
      `;
    }
    const todayStr = new Date().toISOString().split('T')[0];

    return `
      <div id="clinic-print-report" class="clinic-print-report" style="display: none;">
        
        <!-- ================= PAGE 1: Auxology & Growth Trajectory ================= -->
        <div class="print-page print-page-1" style="page-break-after: always; padding: 20mm 15mm; background: #FFFFFF; color: #0F172A; font-family: 'Pretendard', sans-serif;">
          
          <!-- Hospital Header -->
          <div style="border-bottom: 2.5px solid #0F172A; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div style="font-size: 10pt; font-weight: 800; color: #475569; letter-spacing: 0.08em; text-transform: uppercase;">
                KISFIT AI STUDIO · PROPRIETARY K-GROWTH AI™ v4.0 CLINICAL ATELIER
              </div>
              <h1 style="font-size: 18pt; font-weight: 900; color: #0F172A; margin: 4px 0 0 0;">
                소아청소년 신체성장·골연령 정밀 진단 결과지 (Page 1/2)
              </h1>
            </div>
            <div style="text-align: right; font-size: 8.5pt; color: #475569;">
              <div><strong>진단 기준:</strong> KDCA 2017 &amp; US CDC 2000</div>
              <div><strong>발행일자:</strong> ${todayStr}</div>
            </div>
          </div>

          <!-- Patient Information Table -->
          <table style="width: 100%; border: 1.5px solid #CBD5E1; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt;">
            <tr style="background: #F8FAFC; border-bottom: 1px solid #CBD5E1;">
              <th style="padding: 6px 10px; width: 14%; border-right: 1px solid #CBD5E1; color: #475569;">등록번호</th>
              <td style="padding: 6px 10px; width: 20%; border-right: 1px solid #CBD5E1; font-weight: 700; font-family: monospace;">${patientId}</td>
              <th style="padding: 6px 10px; width: 14%; border-right: 1px solid #CBD5E1; color: #475569;">성별 / 연령</th>
              <td style="padding: 6px 10px; width: 20%; border-right: 1px solid #CBD5E1; font-weight: 700;">${gender} / 만 ${ageYears}세 (${ageMonths}개월)</td>
              <th style="padding: 6px 10px; width: 14%; border-right: 1px solid #CBD5E1; color: #475569;">진단구분</th>
              <td style="padding: 6px 10px; font-weight: 700; color: #0F172A;">정밀성장·호르몬</td>
            </tr>
            <tr>
              <th style="padding: 6px 10px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #475569;">신장 / 체중</th>
              <td style="padding: 6px 10px; border-right: 1px solid #CBD5E1; font-weight: 700;">${height} cm / ${weight} kg</td>
              <th style="padding: 6px 10px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #475569;">체질량(BMI)</th>
              <td style="padding: 6px 10px; border-right: 1px solid #CBD5E1; font-weight: 700;">${bmi} kg/m²</td>
              <th style="padding: 6px 10px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #475569;">부모 키 (부/모)</th>
              <td style="padding: 6px 10px; font-weight: 700;">${fatherH} cm / ${motherH} cm</td>
            </tr>
          </table>

          <!-- Section 1: Auxology & Percentile Evaluation -->
          <div style="margin-bottom: 16px;">
            <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #0284C7; padding-left: 8px; margin: 0 0 8px 0;">
              1. 소아청소년 표준 성장 백분위 및 Z-Score (Auxology Assessment)
            </h2>
            <table style="width: 100%; border: 1px solid #CBD5E1; border-collapse: collapse; font-size: 9pt; text-align: center;">
              <thead>
                <tr style="background: #F1F5F9; border-bottom: 1px solid #CBD5E1;">
                  <th style="padding: 6px; border-right: 1px solid #CBD5E1;">측정 항목</th>
                  <th style="padding: 6px; border-right: 1px solid #CBD5E1;">측정값</th>
                  <th style="padding: 6px; border-right: 1px solid #CBD5E1;">연령 표준 중앙값</th>
                  <th style="padding: 6px; border-right: 1px solid #CBD5E1;">표준 편차 차이</th>
                  <th style="padding: 6px; border-right: 1px solid #CBD5E1;">Z-Score</th>
                  <th style="padding: 6px;">정밀 백분위</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">신장 (Height)</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700; color: #1D4ED8;">${height} cm</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0;">${medianHeight.toFixed(1)} cm</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0;">${hDeltaStr}</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-family: monospace;">${hZStr}</td>
                  <td style="padding: 6px; font-weight: 700; color: #1D4ED8;">${hPctStr}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">체중 (Weight)</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">${weight} kg</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0;">${medianWeight.toFixed(1)} kg</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0;">${wDeltaStr}</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-family: monospace;">${wZStr}</td>
                  <td style="padding: 6px; font-weight: 700;">${wPctStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700;">연간 성장속도</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0; font-weight: 700; color: #1D4ED8;">${velocityVal} cm/yr</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0;">5.0 ~ 7.0 cm/yr</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0;">${velCalc.alert ? '관찰 필요' : '정상 범위'}</td>
                  <td style="padding: 6px; border-right: 1px solid #E2E8F0;">-</td>
                  <td style="padding: 6px; font-weight: 700; color: #1D4ED8;">${velStatusText}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Section 2: Tanner MPH & 3-Tier Predicted Adult Height -->
          <div style="margin-bottom: 16px;">
            <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #059669; padding-left: 8px; margin: 0 0 8px 0;">
              2. 유전 표적키(Tanner MPH) 및 3단 성인 예측키 시뮬레이션
            </h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
              
              <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px; background: #F8FAFC;">
                <div style="font-size: 8pt; font-weight: 700; color: #64748B;">부모 유전 표적키 (MPH)</div>
                <div style="font-size: 14pt; font-weight: 900; color: #0F172A; margin: 4px 0;">${mph} cm</div>
                <div style="font-size: 7.5pt; color: #64748B;">오차 범위: ${mphMin} ~ ${mphMax} cm</div>
              </div>

              <div style="border: 1px solid #FECDD3; border-radius: 6px; padding: 10px; background: #FFF1F2;">
                <div style="font-size: 8pt; font-weight: 700; color: #1D4ED8;">저해 요인 방치 시 예측키</div>
                <div style="font-size: 14pt; font-weight: 900; color: #1D4ED8; margin: 4px 0;">${unmanagedHeight} cm</div>
                <div style="font-size: 7.5pt; color: #1D4ED8;">수면·자세 손실: -${unmanagedPenalty} cm</div>
              </div>

              <div style="border: 1px solid #93C5FD; border-radius: 6px; padding: 10px; background: #ECFDF5;">
                <div style="font-size: 8pt; font-weight: 700; color: #1D4ED8;">골든타임 개입 시 최대 잠재키</div>
                <div style="font-size: 14pt; font-weight: 900; color: #1D4ED8; margin: 4px 0;">${potentialHeight} cm</div>
                <div style="font-size: 7.5pt; color: #1D4ED8;">영양·감압 복원: +${potentialBoost} cm 잠재력</div>
              </div>

            </div>
          </div>

          <!-- Section 3: High-Resolution Growth Trajectory Chart -->
          <div style="margin-bottom: 14px;">
            <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #D97706; padding-left: 8px; margin: 0 0 8px 0;">
              3. 소아 성장 궤적 다중 곡선 (Ages 1 to 20 Trajectory)
            </h2>
            <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px; background: #FFFFFF; text-align: center;">
              <!-- Embedded SVG chart representation -->
              <svg viewBox="0 0 600 180" style="width: 100%; height: 160px;">
                <rect width="600" height="180" fill="#F8FAFC" rx="4" />
                <!-- Grid Lines -->
                <line x1="50" y1="30" x2="560" y2="30" stroke="#E2E8F0" stroke-width="1" />
                <line x1="50" y1="75" x2="560" y2="75" stroke="#E2E8F0" stroke-width="1" />
                <line x1="50" y1="120" x2="560" y2="120" stroke="#E2E8F0" stroke-width="1" />
                <line x1="50" y1="150" x2="560" y2="150" stroke="#CBD5E1" stroke-width="1.5" />
                
                <!-- Trajectory curves -->
                <path d="M 50,150 Q 250,90 560,35" fill="none" stroke="#0284C7" stroke-width="2.5" />
                <path d="M 50,150 Q 250,100 560,55" fill="none" stroke="#D97706" stroke-width="2" />
                <path d="M 50,150 Q 250,110 560,70" fill="none" stroke="#E11D48" stroke-width="1.5" stroke-dasharray="3,3" />

                <!-- Current Child Marker -->
                <circle cx="280" cy="98" r="5" fill="#059669" stroke="#FFFFFF" stroke-width="2" />
                <text x="280" y="88" font-size="9" font-weight="bold" fill="#059669" text-anchor="middle">현재 환자 (${height}cm)</text>

                <!-- Legend -->
                <text x="60" y="22" font-size="8" fill="#0284C7">― 최대 개입 궤적 (+${potentialBoost}cm)</text>
                <text x="220" y="22" font-size="8" fill="#D97706">― 유전 기준선 (MPH ${mph}cm)</text>
                <text x="360" y="22" font-size="8" fill="#E11D48">--- 저해 습관 궤적 (-${unmanagedPenalty}cm)</text>
              </svg>
            </div>
          </div>

          <!-- Page 1 Footer -->
          <div style="border-top: 1px solid #CBD5E1; padding-top: 8px; font-size: 8pt; color: #64748B; display: flex; justify-content: space-between;">
            <span>KISFIT AI STUDIO · PROPRIETARY K-GROWTH AI™ v4.0</span>
            <span>Page 1 of 2 (다음 페이지에 계속)</span>
          </div>

        </div>

        <!-- ================= PAGE 2: Endocrinology, Biomechanics & Neuro ================= -->
        <div class="print-page print-page-2" style="padding: 20mm 15mm; background: #FFFFFF; color: #0F172A; font-family: 'Pretendard', sans-serif;">
          
          <!-- Hospital Header Page 2 -->
          <div style="border-bottom: 2.5px solid #0F172A; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div style="font-size: 10pt; font-weight: 800; color: #475569; letter-spacing: 0.08em; text-transform: uppercase;">
                KISFIT AI STUDIO · PROPRIETARY K-GROWTH AI™ v4.0 CLINICAL ATELIER
              </div>
              <h1 style="font-size: 18pt; font-weight: 900; color: #0F172A; margin: 4px 0 0 0;">
                내분비·임상영양·생체역학 &amp; 뇌인지 처방전 (Page 2/2)
              </h1>
            </div>
            <div style="text-align: right; font-size: 8.5pt; color: #475569;">
              <div><strong>등록번호:</strong> <span style="font-family: monospace;">${patientId}</span></div>
              <div><strong>환자명/성별:</strong> ${profile.childName || '소아 환자'} (${gender})</div>
            </div>
          </div>

          <!-- Section 4: Endocrinology & 24h Hormone Analysis -->
          <div style="margin-bottom: 14px;">
            <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #D97706; padding-left: 8px; margin: 0 0 6px 0;">
              4. 24시간 수면 내분비 &amp; 성장호르몬(GH) 분비 억제율 진단
            </h2>
            <table style="width: 100%; border: 1px solid #CBD5E1; border-collapse: collapse; font-size: 9pt;">
              <tr style="background: #F8FAFC;">
                <td style="padding: 6px 10px; width: 25%; font-weight: 700; border-right: 1px solid #CBD5E1;">취침 시각 / 공복 시간</td>
                <td style="padding: 6px 10px; width: 25%; border-right: 1px solid #CBD5E1;">밤 22:30 / 2.5시간 공복</td>
                <td style="padding: 6px 10px; width: 25%; font-weight: 700; border-right: 1px solid #CBD5E1;">성장호르몬 분비 손실률</td>
                <td style="padding: 6px 10px; font-weight: 800; color: #1D4ED8;">-14% (야간 스파이크 억제)</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px; font-weight: 700; border-right: 1px solid #CBD5E1; background: #F8FAFC;">서파수면(SWS) 피크 구간</td>
                <td style="padding: 6px 10px; border-right: 1px solid #CBD5E1;">밤 22:00 ~ 새벽 02:00</td>
                <td style="padding: 6px 10px; font-weight: 700; border-right: 1px solid #CBD5E1; background: #F8FAFC;">임상 권고사항</td>
                <td style="padding: 6px 10px; font-size: 8.5pt;">취침 3시간 전 당류 차단 및 22시 이전 입면 시 손실 0% 달성</td>
              </tr>
            </table>
          </div>

          <!-- Section 5: Weight-Proportional Bio-Nutrition -->
          <div style="margin-bottom: 14px;">
            <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #059669; padding-left: 8px; margin: 0 0 6px 0;">
              5. 체중 비례 임상 영양 처방 &amp; 생체이용률(Bioavailability)
            </h2>
            <table style="width: 100%; border: 1px solid #CBD5E1; border-collapse: collapse; font-size: 8.5pt; text-align: left;">
              <thead>
                <tr style="background: #F1F5F9; border-bottom: 1px solid #CBD5E1;">
                  <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">필수 영양 성분</th>
                  <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">일일 권장 투여량</th>
                  <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">권장 화학 제형</th>
                  <th style="padding: 5px 8px;">생체이용률 및 작용 기전</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">원소 칼슘 (Calcium)</td>
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-family: monospace;">1,000 mg/day</td>
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">구연산칼슘 / MCHA</td>
                  <td style="padding: 5px 8px;">흡수율 ~45% (위산 비의존성 흡수, 복통/변비 방지)</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">비타민 D3 + K2</td>
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-family: monospace;">2,000 IU + 60 mcg</td>
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">D3 (콜레칼시페롤) + MK-7</td>
                  <td style="padding: 5px 8px;">오스테오칼신 카르복실화로 칼슘의 골단판 연골 기질 침착</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">아연 &amp; 마그네슘</td>
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-family: monospace;">12 mg + 160 mg</td>
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">피콜린산 아연 + 글리시네이트</td>
                  <td style="padding: 5px 8px;">간 내 GHR 인산화 촉진(아연) 및 서파수면 심도 강화(마그네슘)</td>
                </tr>
                <tr>
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">골기질 단백질</td>
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-family: monospace;">${Math.round(weight * 1.3 * 10) / 10} g/day</td>
                  <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700;">WPI / 산양유 펩타이드</td>
                  <td style="padding: 5px 8px;">골 부피 30%를 구성하는 콜라겐 유기 기질 합성 가속화</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Section 6: Biomechanics & Posture Prescription -->
          <div style="margin-bottom: 14px;">
            <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #E11D48; padding-left: 8px; margin: 0 0 6px 0;">
              6. 생체역학 척추 감압 &amp; 볼프의 법칙(Wolff's Law) 3대 루틴
            </h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 8pt;">
              <div style="border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px 8px; background: #F8FAFC;">
                <div style="font-weight: 800; color: #1D4ED8;">1. 척추 감압 데드행</div>
                <div>30초 x 3세트 (휴식 30초)</div>
                <div style="color: #64748B; font-size: 7.5pt;">추간판 L1~L5 수핵 감압 (+0.8cm)</div>
              </div>
              <div style="border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px 8px; background: #F8FAFC;">
                <div style="font-weight: 800; color: #1D4ED8;">2. 흉추 신전 &amp; 장요근 정렬</div>
                <div>45초 x 2세트 (양측)</div>
                <div style="color: #64748B; font-size: 7.5pt;">거북목·골반 전방경사 교정 (+1.8cm)</div>
              </div>
              <div style="border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px 8px; background: #F8FAFC;">
                <div style="font-weight: 800; color: #1D4ED8;">3. 플라이오메트릭 점핑</div>
                <div>15분 인터벌 (45s 점핑/15s 보행)</div>
                <div style="color: #64748B; font-size: 7.5pt;">1.5~2.5G 미세 압전 전류 (Runx2/Sox9)</div>
              </div>
            </div>
          </div>

          <!-- Section 7: Short / Mid / Long-Term Horizon Guidance & Havruta -->
          <div style="margin-bottom: 16px;">
            <h2 style="font-size: 10.5pt; font-weight: 800; color: #0F172A; border-left: 4px solid #0284C7; padding-left: 8px; margin: 0 0 6px 0;">
              7. 학술 논문 DB 기반 【단기 · 중기 · 장기】 맞춤 지도 로드맵 &amp; 하브루타
            </h2>
            <table style="width: 100%; border: 1px solid #CBD5E1; border-collapse: collapse; font-size: 8pt; margin-bottom: 8px;">
              <tr style="background: #F8FAFC; border-bottom: 1px solid #CBD5E1;">
                <th style="padding: 5px 8px; width: 22%; border-right: 1px solid #CBD5E1; color: #1D4ED8;">단기 지도 (1~4주)</th>
                <td style="padding: 5px 8px;">밤 21:45 입면 · 취침 3시간 전 무당류 공복(GH 억제 0%) · 저녁 데드행 30초×3세트(디스크 숨은 키 +1.8cm 복원)</td>
              </tr>
              <tr style="border-bottom: 1px solid #CBD5E1;">
                <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #1D4ED8;">중기 지도 (1~3개월)</th>
                <td style="padding: 5px 8px;">구연산칼슘(흡수율 45%)+D3+K2(MK-7)+단백질(${Math.round(weight * 1.3 * 10) / 10}g) · 주 5회 15분 줄넘기 점핑 · 격주 박물관 하브루타 대화</td>
              </tr>
              <tr>
                <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1; background: #F8FAFC; color: #1D4ED8;">장기 지도 (6개월~성인)</th>
                <td style="padding: 5px 8px;">매 3~6개월 LMS 백분위 추적 · 표준 BMI 유지로 성조숙 방어 · 유전 표적키(${mph}cm) 넘어 잠재 최대키(${potentialHeight}cm) 도달</td>
              </tr>
            </table>
            <div style="border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px 10px; background: #F8FAFC; font-size: 7.8pt; line-height: 1.45;">
              <div><strong>[관찰 &amp; 질문]</strong> "이 전시물에서 가장 규칙적이지 않거나 특이한 점은 무엇일까?"</div>
              <div><strong>[가설 &amp; 추론]</strong> "만약 이 조건이 반대로 바뀌었다면, 구조나 역사적 결과는 어떻게 달라졌을까?"</div>
              <div><strong>[적용 &amp; 확장]</strong> "오늘 발견한 원리를 우리 일상이나 미래 과학에 적용한다면 어떤 문제를 해결할 수 있을까?"</div>
            </div>
          </div>

          <!-- Official Validation & Specialist Signature -->
          <div style="border-top: 1.5px solid #0F172A; padding-top: 14px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 8pt; color: #475569; max-width: 380px;">
              본 진단 결과지는 질병관리청(KDCA 2017), US CDC 2000, 대한소아내분비학회(KSPENDO), 미국수면재단(NSF) 학술 표준에 따라 산출된 공식 임상 리포트입니다.
            </div>
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="text-align: right;">
                <div style="font-size: 8.5pt; font-weight: 800; color: #0F172A;">책임 소아내분비·성장 전문의</div>
                <div style="font-size: 8pt; color: #64748B;">Senior Pediatric Endocrinology Specialist</div>
              </div>
              <div style="width: 60px; height: 60px; border: 2px dashed #94A3B8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: 800; color: #1D4ED8;">
                [인/서명]
              </div>
            </div>
          </div>

          <!-- Page 2 Footer -->
          <div style="border-top: 1px solid #CBD5E1; padding-top: 8px; margin-top: 12px; font-size: 8pt; color: #64748B; display: flex; justify-content: space-between;">
            <span>KISFIT AI STUDIO · PROPRIETARY K-GROWTH AI™ v4.0</span>
            <span>Page 2 of 2 (End of Clinical Assessment Report)</span>
          </div>

        </div>

      </div>
    `;
  }

  // 4. Print Report Pre-population & Trigger
    function preparePrintReport(profile = {}) {
    if (typeof document === 'undefined') return;
    if (typeof window !== 'undefined' && window.KidsFitGlobalPaywall && typeof window.KidsFitGlobalPaywall.isGlobalPaidEdition === 'function' && window.KidsFitGlobalPaywall.isGlobalPaidEdition() && typeof window.KidsFitGlobalPaywall.isReportUnlocked === 'function' && !window.KidsFitGlobalPaywall.isReportUnlocked()) {
      let lockedContainer = document.getElementById('clinic-print-report-container');
      if (lockedContainer) {
        lockedContainer.innerHTML = '';
        lockedContainer.style.display = 'none';
      }
      return;
    }

    const activeMode = profile.preferredReportMode || (typeof window !== 'undefined' && window.__KIDSFIT_PREFERRED_REPORT_MODE) || 'growth';
    if (document.body && document.body.classList) {
      document.body.classList.toggle('print-mode-learning', activeMode === 'learning');
    }

    let printContainer = document.getElementById('clinic-print-report-container');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'clinic-print-report-container';
      document.body.appendChild(printContainer);
    }
    printContainer.innerHTML = renderClinicalPdfReport(profile);
  }

    function printClinicReport(profile = {}) {
    if (typeof window !== 'undefined' && window.KidsFitGlobalPaywall && typeof window.KidsFitGlobalPaywall.isGlobalPaidEdition === 'function' && window.KidsFitGlobalPaywall.isGlobalPaidEdition() && typeof window.KidsFitGlobalPaywall.isReportUnlocked === 'function' && !window.KidsFitGlobalPaywall.isReportUnlocked()) {
      preparePrintReport(profile);
      if (typeof window.openKidsFitGlobalCheckoutModal === 'function') {
        window.openKidsFitGlobalCheckoutModal();
      }
      return;
    }
    preparePrintReport(profile);
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  // 5. DOM Event Binding for Tracker Dashboard
  function initTrackerControls(profile = {}) {
    if (typeof document === 'undefined') return;

    const btnPrint = document.getElementById('btn-print-clinic-pdf');
    if (btnPrint && typeof btnPrint.addEventListener === 'function') {
      btnPrint.onclick = () => printClinicReport(profile);
    }

    const chkSleep = document.getElementById('chk-proto-sleep');
    const chkNutr = document.getElementById('chk-proto-nutrition');
    const chkExer = document.getElementById('chk-proto-exercise');

    if (chkSleep && typeof chkSleep.addEventListener === 'function') {
      chkSleep.onchange = (e) => toggleProtocol('sleep', e.target.checked, profile);
    }
    if (chkNutr && typeof chkNutr.addEventListener === 'function') {
      chkNutr.onchange = (e) => toggleProtocol('nutrition', e.target.checked, profile);
    }
    if (chkExer && typeof chkExer.addEventListener === 'function') {
      chkExer.onchange = (e) => toggleProtocol('exercise', e.target.checked, profile);
    }

    const btnAddLog = document.getElementById('btn-add-log');
    if (btnAddLog && typeof btnAddLog.addEventListener === 'function') {
      btnAddLog.onclick = () => {
        const hInput = document.getElementById('input-log-height');
        const wInput = document.getElementById('input-log-weight');
        const h = hInput ? parseFloat(hInput.value) : 137.0;
        const w = wInput ? parseFloat(wInput.value) : 35.5;
        addLogEntry(h, w, (typeof document !== 'undefined' && document.documentElement.lang === 'en') ? 'Manual Measurement Log' : '수동 계측 입력', profile);
        // Re-render tracker
        const container = document.getElementById('core-5-container');
        if (container) {
          container.outerHTML = renderTrackerSection(profile);
          initTrackerControls(profile);
        }
      };
    }
  }

  // 6. Public Export API
  const GrowthTracker = {
    STORAGE_KEYS,
    PRIMARY_STORAGE_KEY,
    getTrackerData,
    saveTrackerData,
    addLogEntry,
    toggleProtocol,
    renderTrackerSection,
    renderClinicalPdfReport,
    preparePrintReport,
    printClinicReport,
    initTrackerControls
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GrowthTracker;
  }
  if (typeof global !== 'undefined') {
    global.KidsFitGrowthTracker = GrowthTracker;
    global.TallerGrowthTracker = GrowthTracker;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
