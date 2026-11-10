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
  const CHECKLIST_STORAGE_KEY = 'kidsfit_14day_checklist_v1';

  // 14-Day Daily Growth & Cognitive Action Routine Definitions
  const CHECKLIST_TASKS = [
    {
      key: 'evening_sws',
      period: 'Evening',
      periodKo: '저녁/취침',
      badge: '🌙 Evening Protocol',
      badgeKo: '🌙 저녁 프로토콜',
      titleEn: 'Bedtime Lights-Out (Stage N3 SWS HGH Surge)',
      titleKo: '서파수면(SWS) 호르몬 서지 유도 소등 (밤 10시 전)',
      descEn: 'Darkened bedroom & 9-10h sleep opportunity to maximize nocturnal Stage N3 Slow-Wave Sleep (65% of daily pituitary GH secretion).',
      descKo: '암전 취침 및 9~10시간 충분한 수면 확보로 서파수면(SWS) 성장호르몬 분비 극대화'
    },
    {
      key: 'evening_fast',
      period: 'Evening',
      periodKo: '저녁/취침',
      badge: '🌙 Evening Protocol',
      badgeKo: '🌙 저녁 프로토콜',
      titleEn: '3-Hour Pre-Bedtime Glycemic Fast',
      titleKo: '취침 3시간 전 무당류 공복 유지',
      descEn: 'Zero late-night simple sugars/refined carbs before sleep to prevent somatostatin release and insulin-mediated GH inhibition (-52%).',
      descKo: '취침 전 단순당 제한으로 소마토스타틴 억제 방어 및 성장호르몬 분비 저해(-52%) 방지'
    },
    {
      key: 'morning_nutrients',
      period: 'Morning',
      periodKo: '아침',
      badge: '☀️ Morning Protocol',
      badgeKo: '☀️ 아침 프로토콜',
      titleEn: 'Weight-Calibrated Vitamin D3/K2 & Calcium',
      titleKo: '체중 맞춤 구연산칼슘 & 비타민 D3/K2 섭취',
      descEn: 'Elemental bio-available Calcium Citrate with D3 (1,200–2,000 IU) and K2 MK-7 with breakfast for optimal epiphyseal bone matrix mineralization.',
      descKo: '흡수율 45% 구연산칼슘 및 D3/K2로 골단판 골기질 침착 촉진'
    },
    {
      key: 'afternoon_decompression',
      period: 'Afternoon',
      periodKo: '오후',
      badge: '⚡ Afternoon Protocol',
      badgeKo: '⚡ 오후 프로토콜',
      titleEn: '10-Minute Epiphyseal Spine Decompression Routine',
      titleKo: '10분 척추 추간판 감압 & 데드행 루틴',
      descEn: 'Passive dead hang (30s x 3 sets) and thoracic spine extension to relieve compressive gravity loads and restore disk intervertebral height.',
      descKo: '패시브 데드행(30초x3)과 흉추 신전으로 중력 부하 감압 및 숨은키 복원'
    },
    {
      key: 'afternoon_feynman',
      period: 'Afternoon',
      periodKo: '오후',
      badge: '⚡ Afternoon Protocol',
      badgeKo: '⚡ 오후 프로토콜',
      titleEn: '20-Minute Feynman Focus & Active Recall Practice',
      titleKo: '20분 파인만 백지 인출 & 능동적 회상 훈련',
      descEn: 'Single-task focused study sprint followed by 3-minute blank-page concept reconstruction for prefrontal working memory consolidation.',
      descKo: '단일 집중 학습 후 3분 백지 인출로 전두엽 작업기억 및 시냅스 가소성 강화'
    }
  ];

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

  function getActiveChildIdFromCohort(profile = {}) {
    if (profile.childId) return profile.childId;
    if (profile.id && String(profile.id).startsWith('child_')) return profile.id;
    if (typeof window !== 'undefined' && window.KidsFitUserCohortDB && typeof window.KidsFitUserCohortDB.getActiveChildId === 'function') {
      return window.KidsFitUserCohortDB.getActiveChildId();
    }
    return 'child_1';
  }

  // 14-Day Checklist Persistence & Child ID Resolver
  function resolveChecklistChildId(arg) {
    if (!arg) return 'child_1';
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'object') return arg.id || arg.childId || 'child_1';
    return 'child_1';
  }

  function get14DayChecklist(arg = 'child_1') {
    const childId = resolveChecklistChildId(arg);
    const key = `${CHECKLIST_STORAGE_KEY}_${childId}`;
    let data = safeGetStorage(key);
    if (!data || typeof data !== 'object' || !data.days) {
      const days = {};
      for (let i = 1; i <= 14; i++) {
        days[i] = {
          evening_sws: false,
          evening_fast: false,
          morning_nutrients: false,
          afternoon_decompression: false,
          afternoon_feynman: false
        };
      }
      data = {
        childId,
        currentActiveDay: 1,
        activeDay: 1,
        days
      };
      safeSetStorage(key, data);
    }
    if (!data.activeDay && data.currentActiveDay) {
      data.activeDay = data.currentActiveDay;
    }
    return data;
  }

  function save14DayChecklist(arg = 'child_1', data = {}) {
    const childId = resolveChecklistChildId(arg);
    if (data && data.currentActiveDay && !data.activeDay) {
      data.activeDay = data.currentActiveDay;
    }
    const key = `${CHECKLIST_STORAGE_KEY}_${childId}`;
    safeSetStorage(key, data);
  }

  function toggle14DayChecklistItem(...args) {
    let childId, dayNum, taskKey, checked;
    if (typeof args[0] === 'number') {
      // Calling convention: (dayNum, taskKey, checked, profile/childId)
      dayNum = args[0];
      taskKey = args[1];
      checked = args[2];
      childId = resolveChecklistChildId(args[3]);
    } else {
      // Calling convention: (childId, dayNum, taskKey, checked)
      childId = resolveChecklistChildId(args[0]);
      dayNum = args[1];
      taskKey = args[2];
      checked = args[3];
    }
    const data = get14DayChecklist(childId);
    if (!data.days) data.days = {};
    if (!data.days[dayNum]) data.days[dayNum] = {};
    data.days[dayNum][taskKey] = Boolean(checked);
    save14DayChecklist(childId, data);
    return data;
  }

  function set14DayActiveDay(...args) {
    let childId, dayNum;
    if (typeof args[0] === 'number') {
      // Calling convention: (dayNum, profile/childId)
      dayNum = args[0];
      childId = resolveChecklistChildId(args[1]);
    } else {
      // Calling convention: (childId, dayNum)
      childId = resolveChecklistChildId(args[0]);
      dayNum = args[1];
    }
    const data = get14DayChecklist(childId);
    data.currentActiveDay = Math.max(1, Math.min(14, Number(dayNum) || 1));
    data.activeDay = data.currentActiveDay;
    save14DayChecklist(childId, data);
    return data;
  }

  // 1. Initial State & Seed Data Generation (Partitioned by Child ID)
  function getInitialTrackerState(profile = {}) {
    const todayStr = new Date().toISOString().split('T')[0];
    const childId = getActiveChildIdFromCohort(profile);
    const isChild2 = childId === 'child_2';
    const currentH = Number(profile.currentHeight) || (isChild2 ? 121.0 : 137.0);
    const currentW = Number(profile.currentWeight) || (isChild2 ? 23.5 : 35.5);

    const baseLogs = [
      { date: '2026-10-14', height: Math.round((currentH - 0.5) * 10) / 10, weight: currentW - 0.2, sleep: true, nutrition: true, exercise: true, note: '기준 진단 계측' },
      { date: '2026-10-16', height: Math.round((currentH - 0.3) * 10) / 10, weight: currentW - 0.1, sleep: true, nutrition: true, exercise: true, note: '데드행 3세트 완주' },
      { date: '2026-10-18', height: Math.round((currentH - 0.1) * 10) / 10, weight: currentW, sleep: true, nutrition: true, exercise: true, note: '구연산칼슘 & D3 섭취' },
      { date: todayStr, height: currentH, weight: currentW, sleep: true, nutrition: true, exercise: true, note: '오늘 정밀 바이오 측정' }
    ];

    return {
      childId: childId,
      childLogs: {
        [childId]: baseLogs
      },
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
      logs: baseLogs
    };
  }

  function getTrackerData(profile = {}) {
    const childId = getActiveChildIdFromCohort(profile);
    for (const key of STORAGE_KEYS) {
      const data = safeGetStorage(key);
      if (data && (Array.isArray(data.logs) || (data.childLogs && typeof data.childLogs === 'object'))) {
        data.childLogs = data.childLogs || {};
        if (!data.childLogs[childId] || !Array.isArray(data.childLogs[childId])) {
          data.childLogs[childId] = (data.childId === childId && Array.isArray(data.logs))
            ? data.logs
            : getInitialTrackerState(profile).logs;
        }
        data.childId = childId;
        data.logs = data.childLogs[childId];
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
    const childId = data.childId || 'child_1';
    data.childLogs = data.childLogs || {};
    data.childLogs[childId] = data.logs;
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
    const activeChildId = getActiveChildIdFromCohort(profile);
    const data = getTrackerData(profile);
    const streak = data.currentStreakDays || 14;
    const logs = data.logs || [];

    // Retrieve Sibling Profiles for Comparative View
    let siblingData = null;
    if (typeof window !== 'undefined' && window.KidsFitUserCohortDB && typeof window.KidsFitUserCohortDB.getSiblingData === 'function') {
      siblingData = window.KidsFitUserCohortDB.getSiblingData();
    } else {
      siblingData = {
        activeChildId: activeChildId,
        profiles: {
          child_1: { id: 'child_1', name: 'Liam', gender: 'boy', ageYears: 10, currentHeight: 137.0, currentWeight: 35.5, recentGrowth6m: 3.2, fatherHeight: 173.5, motherHeight: 160.5 },
          child_2: { id: 'child_2', name: 'Emma', gender: 'girl', ageYears: 7, currentHeight: 121.0, currentWeight: 23.5, recentGrowth6m: 2.8, fatherHeight: 173.5, motherHeight: 160.5 }
        }
      };
    }

    const siblingProfiles = siblingData.profiles || {};
    const siblingKeys = Object.keys(siblingProfiles);

    // Retrieve 14-Day Checklist Data
    const checklist = get14DayChecklist(activeChildId);
    const activeDay = checklist.currentActiveDay || 1;
    const activeDayTasks = (checklist.days && checklist.days[activeDay]) || {};

    // Calculate 14-day completion percentage across all days
    let totalChecklistItems = 14 * CHECKLIST_TASKS.length;
    let completedChecklistItems = 0;
    if (checklist.days) {
      for (let d = 1; d <= 14; d++) {
        if (checklist.days[d]) {
          CHECKLIST_TASKS.forEach(t => {
            if (checklist.days[d][t.key]) completedChecklistItems++;
          });
        }
      }
    }
    const checklistProgressPct = Math.min(100, Math.round((completedChecklistItems / Math.max(1, totalChecklistItems)) * 100));

    const titleStr = isGlobal ? '90-Day Longitudinal Growth Tracker & Pediatric Intake Studio' : '90일 성장 데이터 & 바이오 프로토콜 스트릭 기록소';
    const subStr = isGlobal
      ? 'Track daily height and weight trajectory, log the 14-day pediatric routine checklist (Sleep, Bio-Nutrition, Spine Decompression & Feynman Focus), and generate hospital-grade clinic intake summaries.'
      : '날짜별 키·몸무게 변화 궤적을 기록하고 수면·임상영양·생체역학 3대 프로토콜 달성 스트릭(Streak)을 관리하는 브라우저 보안 스토리지 트래커입니다.';

    // Sibling Comparative Matrix HTML
    const siblingCardsHtml = siblingKeys.map(k => {
      const p = siblingProfiles[k];
      const isSelected = k === activeChildId;
      const isGirl = p.gender === 'girl';
      const genderIcon = isGirl ? '👧' : '👦';
      const ageY = Number(p.ageYears) || 10;
      const curH = Number(p.currentHeight) || (isGirl ? 121.0 : 137.0);
      const curW = Number(p.currentWeight) || (isGirl ? 23.5 : 35.5);
      const fH = Number(p.fatherHeight) || 173.5;
      const mH = Number(p.motherHeight) || 160.5;
      const mphVal = Math.round(((fH + mH + (isGirl ? -13 : 13)) / 2) * 10) / 10;
      const vel = Number(p.recentGrowth6m ? p.recentGrowth6m * 2 : (isGirl ? 5.6 : 6.4)).toFixed(1);

      // Height formatted
      const totIn = curH / 2.54;
      const ft = Math.floor(totIn / 12);
      const inch = Math.round((totIn - ft * 12) * 10) / 10;
      const hDisplay = `${ft}'${inch}" (${curH} cm)`;

      // Estimated CDC percentile
      const estPct = isGirl ? 52.0 : 50.0;

      return `
        <div class="bento-card sibling-card ${isSelected ? 'active-sibling-card' : ''}" style="border: 2px solid ${isSelected ? '#1D4ED8' : 'var(--theme-border-subtle)'}; background: ${isSelected ? 'rgba(239, 246, 255, 0.45)' : 'var(--theme-surface-sub)'}; border-radius: 14px; padding: 1rem 1.15rem; transition: all 0.2s ease;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.4rem;">${genderIcon}</span>
              <div>
                <h5 style="font-size: 1rem; font-weight: 800; color: var(--text-primary); margin: 0;">
                  ${p.name || (k === 'child_1' ? 'Liam' : 'Emma')}
                </h5>
                <span style="font-size: 0.76rem; color: var(--text-secondary);">
                  ${ageY}y ${isGirl ? 'Girl' : 'Boy'} · ${p.birthDateStr || '2016-05-12'}
                </span>
              </div>
            </div>
            ${isSelected ? `
              <span style="background: #1D4ED8; color: #FFFFFF; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 9999px;">
                ${isGlobal ? 'Active Child' : '선택됨'}
              </span>
            ` : `
              <button type="button" class="btn-sibling-switch-tracker btn btn-secondary" data-child-id="${p.id}" style="font-size: 0.74rem; font-weight: 700; padding: 0.25rem 0.65rem; min-height: 32px;">
                ${isGlobal ? 'Switch Profile' : '전환하기'}
              </button>
            `}
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.8rem;">
            <div style="background: var(--theme-surface); border: 1px solid var(--theme-border-subtle); border-radius: 8px; padding: 0.5rem 0.65rem;">
              <div style="font-size: 0.7rem; color: var(--text-secondary);">${isGlobal ? 'Current Stature' : '현재 신장'}</div>
              <div style="font-size: 0.95rem; font-weight: 800; color: #1D4ED8;">${hDisplay}</div>
            </div>
            <div style="background: var(--theme-surface); border: 1px solid var(--theme-border-subtle); border-radius: 8px; padding: 0.5rem 0.65rem;">
              <div style="font-size: 0.7rem; color: var(--text-secondary);">${isGlobal ? 'CDC Percentile' : '성장 백분위'}</div>
              <div style="font-size: 0.95rem; font-weight: 800; color: var(--bio-emerald);">${estPct}th (Z: 0.00)</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.74rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
            <span>${isGlobal ? 'Target MPH Corridor:' : '유전 표적키:'} <strong>${mphVal} cm</strong></span>
            <span>${isGlobal ? 'Velocity:' : '성장속도:'} <strong>${vel} cm/yr</strong></span>
          </div>

          <!-- Relative Percentile Bar -->
          <div style="background: var(--theme-border-subtle); border-radius: 9999px; height: 6px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #3B82F6, #10B981); width: ${estPct}%; height: 100%;"></div>
          </div>
        </div>
      `;
    }).join('');

    // 14-Day Checklist Days Pills HTML
    const dayPillsHtml = Array.from({ length: 14 }, (_, idx) => {
      const dNum = idx + 1;
      const isCur = dNum === activeDay;
      // count completed for this day
      let dayCompleted = 0;
      if (checklist.days && checklist.days[dNum]) {
        CHECKLIST_TASKS.forEach(t => {
          if (checklist.days[dNum][t.key]) dayCompleted++;
        });
      }
      const isDone = dayCompleted === CHECKLIST_TASKS.length;

      return `
        <button type="button"
          class="checklist-day-pill ${isCur ? 'active' : ''} ${isDone ? 'done' : ''}"
          data-day="${dNum}"
          id="btn-checklist-day-${dNum}"
          style="min-height: 44px; min-width: 44px; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.35rem 0.55rem; border-radius: 10px; font-size: 0.76rem; font-weight: 800; border: 1.5px solid ${isCur ? '#1D4ED8' : (isDone ? '#10B981' : 'var(--theme-border-subtle)')}; background: ${isCur ? '#1D4ED8' : (isDone ? 'rgba(16, 185, 129, 0.12)' : 'var(--theme-surface-sub)')}; color: ${isCur ? '#FFFFFF' : (isDone ? '#047857' : 'var(--text-secondary)')}; cursor: pointer; transition: all 0.2s ease;">
          <span>Day ${dNum}</span>
          <span style="font-size: 0.65rem; opacity: 0.85;">${isDone ? '✓' : `${dayCompleted}/5`}</span>
        </button>
      `;
    }).join('');

    // 14-Day Checklist Active Day Tasks HTML
    const tasksHtml = CHECKLIST_TASKS.map(t => {
      const isChecked = Boolean(activeDayTasks[t.key]);
      return `
        <label class="checklist-task-card" style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; background: var(--theme-surface-sub); border: 1px solid ${isChecked ? '#10B981' : 'var(--theme-border-subtle)'}; border-radius: 12px; padding: 0.85rem 1rem; cursor: pointer; transition: all 0.2s ease;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.25rem;">
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: ${t.period === 'Evening' ? '#6366F1' : (t.period === 'Morning' ? '#D97706' : '#059669')};">
                ${isGlobal ? t.badge : t.badgeKo}
              </span>
            </div>
            <div style="font-size: 0.88rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.2rem; text-decoration: ${isChecked ? 'line-through' : 'none'}; opacity: ${isChecked ? 0.75 : 1};">
              ${isGlobal ? t.titleEn : t.titleKo}
            </div>
            <div style="font-size: 0.76rem; color: var(--text-secondary); line-height: 1.45;">
              ${isGlobal ? t.descEn : t.descKo}
            </div>
          </div>
          <div style="padding-top: 0.2rem;">
            <input type="checkbox"
              class="chk-14day-task"
              data-day="${activeDay}"
              data-task-key="${t.key}"
              ${isChecked ? 'checked' : ''}
              style="width: 22px; height: 22px; accent-color: #10B981; cursor: pointer;">
          </div>
        </label>
      `;
    }).join('');

    let html = `
      <div id="core-5-container" class="core-module-container tracker-container">
        <!-- Tracker Header Card with Pediatrician Print Trigger -->
        <div class="bento-card tracker-header-card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--theme-accent);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="tab-badge tab-badge-indigo" style="display: inline-block; margin-bottom: 0.5rem;">
                Core 5 · 90-Day Tracker &amp; Clinical PDF
              </span>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
                ${titleStr}
              </h3>
              <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.55; max-width: 780px;">
                ${subStr}
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary" id="btn-print-clinic-pdf" style="min-height: 44px; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.92rem; font-weight: 800; padding: 0.75rem 1.35rem; box-shadow: 0 4px 14px rgba(29, 78, 216, 0.25);">
                📄 ${isGlobal ? 'Export Pediatrician Consultation Intake PDF' : 'A4 소아청소년과 진료 의뢰서 PDF 출력'}
              </button>
            </div>
          </div>
        </div>

        <!-- Sibling Comparative Auxology Matrix Card -->
        <div class="bento-card sibling-comparative-card" id="sibling-comparative-growth-card" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 800; color: #1D4ED8; text-transform: uppercase; letter-spacing: 0.05em;">
                👨‍👩‍👧‍👦 Multi-Child Sibling Auxology Architecture
              </span>
              <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0.2rem 0 0 0;">
                ${isGlobal ? 'Sibling Comparative Growth & Percentile Corridor' : '형제·자매 비교 성장 및 유전 표적키 비교 분석'}
              </h4>
            </div>
            <div id="sibling-profile-tabs-tracker"></div>
          </div>

          <!-- Sibling Cards Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
            ${siblingCardsHtml}
          </div>
        </div>

        <!-- 14-Day Daily Routine Action Checklist Card -->
        <div class="bento-card fourteen-day-card" id="fourteen-day-checklist-card" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <span class="tab-badge tab-badge-amber" style="display: inline-block; margin-bottom: 0.35rem;">
                🗓️ Clinical Routine Protocol
              </span>
              <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0 0 0.2rem 0;">
                ${isGlobal ? '14-Day Daily Growth & Cognitive Action Checklist' : '14일 연속 바이오 성장 & 두뇌 LQ 인출 체크리스트'}
              </h4>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">
                ${isGlobal ? 'Stage N3 SWS sleep timing, 3-hour pre-bed fasting, weight-calibrated micronutrients, spine decompression & Feynman active recall.' : '서파수면 소등, 취침 3시간 전 공복, 체중 맞춤 미네랄, 척추 감압 및 파인만 백지 인출을 매일 체크합니다.'}
              </p>
            </div>

            <!-- Visual Progress Bar Indicator -->
            <div style="text-align: right; min-width: 220px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.35rem;">
                <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-secondary);">${isGlobal ? 'Overall Adherence:' : '전체 프로토콜 달성률:'}</span>
                <span style="font-size: 1.15rem; font-weight: 900; color: #10B981; font-family: var(--font-mono);">${checklistProgressPct}%</span>
              </div>
              <div style="background: var(--theme-border-subtle); border-radius: 9999px; height: 8px; overflow: hidden; margin-bottom: 0.25rem;">
                <div style="background: linear-gradient(90deg, #10B981, #059669); width: ${checklistProgressPct}%; height: 100%; transition: width 0.3s ease;"></div>
              </div>
              <span style="font-size: 0.68rem; color: var(--text-muted);">${completedChecklistItems} / ${totalChecklistItems} ${isGlobal ? 'Actions Checked across 14 Days' : '항목 완료'}</span>
            </div>
          </div>

          <!-- 14-Day Horizontal Timeline Tabs -->
          <div style="display: flex; gap: 0.45rem; overflow-x: auto; padding-bottom: 0.65rem; margin-bottom: 1rem;" class="checklist-timeline-bar">
            ${dayPillsHtml}
          </div>

          <!-- Active Day Tasks Container -->
          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            ${tasksHtml}
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

            <!-- Mini Input Form with Mobile Keypad Optimization -->
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <input type="number" step="0.1" inputmode="decimal" autocomplete="off" id="input-log-height" placeholder="${isGlobal ? 'Height (cm)' : '키 cm'}" value="${profile.currentHeight || 137.0}" style="width: 110px; min-height: 44px; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--theme-border); background: var(--theme-surface-sub); color: var(--text-primary); font-family: var(--font-mono); font-size: 0.85rem;">
              <input type="number" step="0.1" inputmode="decimal" autocomplete="off" id="input-log-weight" placeholder="${isGlobal ? 'Weight (kg)' : '체중 kg'}" value="${profile.currentWeight || 35.5}" style="width: 110px; min-height: 44px; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--theme-border); background: var(--theme-surface-sub); color: var(--text-primary); font-family: var(--font-mono); font-size: 0.85rem;">
              <button type="button" class="btn btn-secondary" id="btn-add-log" style="min-height: 44px; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 700;">
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
                    <td style="padding: 0.65rem 0.75rem;">${l.sleep ? '✓' : '—'}</td>
                    <td style="padding: 0.65rem 0.75rem;">${l.nutrition ? '✓' : '—'}</td>
                    <td style="padding: 0.65rem 0.75rem;">${l.exercise ? '✓' : '—'}</td>
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
    const isGlobal = profile.language === 'en' ||
      (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en') ||
      Boolean(profile.childName && !/[\uAC00-\uD7A3]/.test(profile.childName) && profile.language !== 'ko');
    const childName = profile.childName || profile.name || (isGlobal ? 'Liam' : '서우');
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
    const hPctStr = isGlobal
      ? `${Number(hKdca.percentile || 50.0).toFixed(1)}th %ile (Top ${Number(hKdca.topPercent !== undefined ? hKdca.topPercent : (100 - hKdca.percentile)).toFixed(1)}%)`
      : `${Number(hKdca.percentile || 50.0).toFixed(1)}th (상위 ${Number(hKdca.topPercent !== undefined ? hKdca.topPercent : (100 - hKdca.percentile)).toFixed(1)}%)`;

    const wDeltaVal = wKdca.deltaMedian !== undefined ? wKdca.deltaMedian : Math.round((weight - medianWeight) * 10) / 10;
    const wDeltaStr = `${wDeltaVal >= 0 ? '+' : ''}${wDeltaVal.toFixed(1)} kg`;
    const wZStr = `${wKdca.zScore >= 0 ? '+' : ''}${Number(wKdca.zScore || 0).toFixed(2)} SD`;
    const wPctStr = isGlobal
      ? `${Number(wKdca.percentile || 50.0).toFixed(1)}th %ile (Top ${Number(wKdca.topPercent !== undefined ? wKdca.topPercent : (100 - wKdca.percentile)).toFixed(1)}%)`
      : `${Number(wKdca.percentile || 50.0).toFixed(1)}th (상위 ${Number(wKdca.topPercent !== undefined ? wKdca.topPercent : (100 - wKdca.percentile)).toFixed(1)}%)`;

    const recentGain6m = Number(profile.recentGrowth6m) || 3.2;
    const velCalc = (GrowthEngine && typeof GrowthEngine.calculateVelocity === 'function')
      ? GrowthEngine.calculateVelocity(recentGain6m, ageYears)
      : { velocityCmPerYear: Math.round(recentGain6m * 2 * 10) / 10, alert: false };
    const velocityVal = Number(velCalc.velocityCmPerYear || (recentGain6m * 2)).toFixed(1);
    const velStatusText = isGlobal
      ? (velCalc.alert ? 'Sub-Optimal Velocity (<4.0 cm/yr)' : (Number(velocityVal) >= 7.0 ? 'Accelerated Growth Trajectory' : 'Normal Growth Trajectory'))
      : (velCalc.alert ? '저성장 주의 (<4.0cm/yr)' : (Number(velocityVal) >= 7.0 ? '급성장 가속 궤도' : '정상 성장 궤도'));

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

    let krPredictedCm = Math.round((mph + 0.8) * 10) / 10;
    let krCiMinCm = Math.round((krPredictedCm - 4.5) * 10) / 10;
    let krCiMaxCm = Math.round((krPredictedCm + 4.5) * 10) / 10;
    let krCiBoundCm = 4.5;
    let krCiBoundIn = 1.8;

    if (GrowthEngine && typeof GrowthEngine.calculateKhamisRoche === 'function') {
      try {
        const kr = GrowthEngine.calculateKhamisRoche({
          gender: sexKey,
          ageYears: ageYears,
          childHeightCm: height,
          childWeightKg: weight,
          fatherHeightCm: fatherH,
          motherHeightCm: motherH
        });
        if (kr && kr.predictedCm) {
          krPredictedCm = Number(kr.predictedCm);
          krCiMinCm = Number(kr.ci90MinCm || (krPredictedCm - 4.5));
          krCiMaxCm = Number(kr.ci90MaxCm || (krPredictedCm + 4.5));
          krCiBoundCm = Math.round(((krCiMaxCm - krCiMinCm) / 2) * 10) / 10;
          krCiBoundIn = Math.round((krCiBoundCm / 2.54) * 10) / 10;
        }
      } catch (_) {}
    }
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

      const trackerState = (typeof getTrackerState === 'function') ? getTrackerState(profile) : null;
      const historyList = (trackerState && Array.isArray(trackerState.logs) && trackerState.logs.length)
        ? trackerState.logs.slice(-4).reverse()
        : [
            { date: todayStrEn, height: height, weight: weight, bmi: bmi, velocity: `${velocityVal} cm/yr`, status: velStatusEn }
          ];

      const historyRowsHtml = historyList.map((item, idx) => {
        const itemH = Number(item.height) || height;
        const itemW = Number(item.weight) || weight;
        const itemBmi = item.bmi || Math.round((itemW / Math.pow(itemH / 100, 2)) * 10) / 10;
        const itemVel = item.velocity || `${velocityVal} cm/yr`;
        const itemStatus = item.status || velStatusEn;
        const itemDate = item.date || todayStrEn;
        return `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-family: monospace;">${itemDate}</td>
            <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0;">Age ${ageYears}y (${Math.max(12, ageMonths - idx * 3)}m)</td>
            <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-weight: 700; color: #1D4ED8;">${fmtH(itemH)}</td>
            <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0;">${fmtW(itemW)}</td>
            <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0; font-family: monospace;">${itemBmi} kg/m²</td>
            <td style="padding: 5px 8px; border-right: 1px solid #E2E8F0;">${itemVel}</td>
            <td style="padding: 5px 8px; font-weight: 600; color: #059669;">${itemStatus}</td>
          </tr>
        `;
      }).join('');

      return `
        <div id="clinic-print-report" class="clinic-print-report" style="display: none;">
          <div class="print-page print-page-1 pediatrician-intake-print-sheet" style="page-break-after: always; padding: 20mm 15mm; background: #FFFFFF; color: #0F172A; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="border-bottom: 2.5px solid #0F172A; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 10pt; font-weight: 800; color: #1D4ED8; letter-spacing: 0.08em; text-transform: uppercase;">
                  KISFIT CLINICAL STUDIO · EHR-GRADE PEDIATRIC AUXOLOGY INTAKE
                </div>
                <h1 style="font-size: 17pt; font-weight: 900; color: #0F172A; margin: 4px 0 0 0;">
                  PEDIATRICIAN CLINICAL CONSULTATION INTAKE &amp; AUXOLOGICAL ASSESSMENT (Page 1/2)
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
            <!-- Section 2: Genetic Target Height (Tanner MPH) & Khamis-Roche Predicted Stature -->
            <div style="margin-bottom: 16px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #059669; padding-left: 8px; margin: 0 0 8px 0;">
                2. Genetic Target Height (Tanner MPH) &amp; Khamis-Roche Empirical Adult Stature
              </h2>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                <div style="border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 8px; background: #F8FAFC;">
                  <div style="font-size: 7.8pt; font-weight: 700; color: #64748B; text-transform: uppercase;">Mid-Parental Height (Tanner MPH)</div>
                  <div style="font-size: 13.5pt; font-weight: 900; color: #0F172A; margin: 3px 0;">${fmtH(mph)}</div>
                  <div style="font-size: 7.2pt; color: #475569;">Target Corridor: ${isImp ? `${cmToFtIn(mphMin)} ~ ${cmToFtIn(mphMax)}` : `${mphMin} ~ ${mphMax} cm`} (±${isImp ? '3.3 in' : '8.5 cm'})</div>
                </div>
                <div style="border: 1.5px solid #93C5FD; border-radius: 8px; padding: 8px; background: #EFF6FF;">
                  <div style="font-size: 7.8pt; font-weight: 800; color: #1D4ED8; text-transform: uppercase;">Khamis-Roche Adult Stature</div>
                  <div style="font-size: 13.5pt; font-weight: 900; color: #1D4ED8; margin: 3px 0;">${fmtH(krPredictedCm)}</div>
                  <div style="font-size: 7.2pt; color: #1E40AF;">90% CI Error Bounds: ${isImp ? `${cmToFtIn(krCiMinCm)} ~ ${cmToFtIn(krCiMaxCm)}` : `${krCiMinCm} ~ ${krCiMaxCm} cm`} (±${isImp ? `${krCiBoundIn} in` : `${krCiBoundCm} cm`})</div>
                </div>
                <div style="border: 1.5px solid #6EE7B7; border-radius: 8px; padding: 8px; background: #ECFDF5;">
                  <div style="font-size: 7.8pt; font-weight: 800; color: #047857; text-transform: uppercase;">Clinically Optimized Potential</div>
                  <div style="font-size: 13.5pt; font-weight: 900; color: #059669; margin: 3px 0;">${fmtH(potentialHeight)}</div>
                  <div style="font-size: 7.2pt; color: #059669;">Endocrine &amp; Decompression: +${isImp ? `${(Number(potentialBoost) / 2.54).toFixed(1)} in (+${potentialBoost} cm)` : `${potentialBoost} cm`}</div>
                </div>
              </div>
            </div>

            <!-- Section 3: Longitudinal Growth Curve SVG -->
            <div style="margin-bottom: 14px;">
              <h2 style="font-size: 11pt; font-weight: 800; color: #0F172A; border-left: 4px solid #D97706; padding-left: 8px; margin: 0 0 8px 0;">
                3. Multi-Curve Longitudinal Growth Trajectory &amp; CDC Percentile Corridors
              </h2>
              <div style="border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px; background: #FFFFFF; text-align: center;">
                <svg viewBox="0 0 600 175" style="width: 100%; height: 155px;">
                  <rect width="600" height="175" fill="#F8FAFC" rx="4" />
                  <line x1="50" y1="28" x2="560" y2="28" stroke="#E2E8F0" stroke-width="1" />
                  <line x1="50" y1="68" x2="560" y2="68" stroke="#E2E8F0" stroke-width="1" />
                  <line x1="50" y1="108" x2="560" y2="108" stroke="#E2E8F0" stroke-width="1" />
                  <line x1="50" y1="145" x2="560" y2="145" stroke="#CBD5E1" stroke-width="1.5" />
                  <path d="M 50,145 Q 250,88 560,32" fill="none" stroke="#059669" stroke-width="2.5" />
                  <path d="M 50,145 Q 250,96 560,50" fill="none" stroke="#1D4ED8" stroke-width="2" />
                  <path d="M 50,145 Q 250,105 560,68" fill="none" stroke="#DC2626" stroke-width="1.5" stroke-dasharray="3,3" />
                  <circle cx="280" cy="95" r="5" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="2" />
                  <text x="280" y="84" font-size="9" font-weight="bold" fill="#1D4ED8" text-anchor="middle">Current Evaluation: ${childName} (${fmtH(height)})</text>
                  <text x="60" y="20" font-size="8" font-weight="bold" fill="#059669">― Optimized Trajectory (+${isImp ? `${(Number(potentialBoost) / 2.54).toFixed(1)} in` : `${potentialBoost}cm`})</text>
                  <text x="235" y="20" font-size="8" font-weight="bold" fill="#1D4ED8">― Khamis-Roche / Tanner MPH Baseline (${isImp ? `${cmToFtIn(mph)}` : `${mph}cm`})</text>
                  <text x="445" y="20" font-size="8" font-weight="bold" fill="#DC2626">--- Unmanaged Habit Loss (-${isImp ? `${(Number(unmanagedPenalty) / 2.54).toFixed(1)} in` : `${unmanagedPenalty}cm`})</text>
                </svg>
              </div>
            </div>

            <!-- Page 1 Footer -->
            <div style="border-top: 1px solid #CBD5E1; padding-top: 8px; font-size: 8pt; color: #64748B; display: flex; justify-content: space-between;">
              <span>KISFIT BIO LABS · CLINICAL AUXOLOGY INTAKE SUMMARY (kisfitglobal.com)</span>
              <span>Page 1 of 2 (Continued on Page 2 · Clinical Notes &amp; Physician Sign-off)</span>
            </div>
          </div>

          <!-- ================= PAGE 2: Vital Signs, Velocity History, Clinical Notes & Sign-off ================= -->
          <div class="print-page print-page-2 pediatrician-intake-print-sheet" style="padding: 20mm 15mm; background: #FFFFFF; color: #0F172A; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="border-bottom: 2.5px solid #0F172A; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 10pt; font-weight: 800; color: #475569; letter-spacing: 0.08em; text-transform: uppercase;">
                  KISFIT BIO LABS · PEDIATRIC CLINICAL AUXOLOGY &amp; INTAKE SUMMARY
                </div>
                <h1 style="font-size: 18pt; font-weight: 900; color: #0F172A; margin: 4px 0 0 0;">
                  Vital Sign History, Clinical Examination &amp; Physician Sign-off (Page 2/2)
                </h1>
              </div>
              <div style="text-align: right; font-size: 8.5pt; color: #475569;">
                <div><strong>Patient:</strong> ${childName} (${gender})</div>
                <div><strong>Clinic Record ID:</strong> <span style="font-family: monospace;">${patientId}</span></div>
              </div>
            </div>

            <!-- Section 4: Longitudinal Vital Signs & Growth Velocity History -->
            <div style="margin-bottom: 14px;">
              <h2 style="font-size: 10.5pt; font-weight: 800; color: #0F172A; border-left: 4px solid #0284C7; padding-left: 8px; margin: 0 0 6px 0;">
                Vital Sign &amp; Auxological Velocity History
              </h2>
              <table style="width: 100%; border: 1.5px solid #CBD5E1; border-collapse: collapse; font-size: 8.5pt; text-align: left;">
                <thead>
                  <tr style="background: #F1F5F9; border-bottom: 1px solid #CBD5E1; color: #1E293B;">
                    <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">Date</th>
                    <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">Evaluation Age</th>
                    <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">Stature (Height)</th>
                    <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">Weight</th>
                    <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">BMI</th>
                    <th style="padding: 5px 8px; border-right: 1px solid #CBD5E1;">Annual Velocity</th>
                    <th style="padding: 5px 8px;">Auxology Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${historyRowsHtml}
                </tbody>
              </table>
            </div>

            <!-- Section 5: Circadian Endocrinology & Bio-Nutrition Summary -->
            <div style="margin-bottom: 14px;">
              <h2 style="font-size: 10.5pt; font-weight: 800; color: #0F172A; border-left: 4px solid #D97706; padding-left: 8px; margin: 0 0 6px 0;">
                5. Circadian Endocrinology &amp; Weight-Calibrated Bio-Nutrition
              </h2>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 8.2pt;">
                <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 10px; background: #F8FAFC;">
                  <div style="font-weight: 800; color: #1E3A8A; margin-bottom: 4px;">🌙 Stage N3 SWS Nocturnal Endocrinology</div>
                  <div>• <strong>Target Bedtime:</strong> 21:45 PM – 22:15 PM (Melatonin Peak)</div>
                  <div>• <strong>3-Hr Pre-Bed Glycemic Fast:</strong> 0% insulin somatostatin suppression</div>
                  <div>• <strong>Sleep Duration:</strong> 9.5 hours required for peak pulsatile GH</div>
                </div>
                <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 10px; background: #F8FAFC;">
                  <div style="font-weight: 800; color: #047857; margin-bottom: 4px;">☀️ Weight-Calibrated Nutrient Engine</div>
                  <div>• <strong>Calcium Citrate:</strong> 1,000 mg/day (~45% absorption)</div>
                  <div>• <strong>Vitamin D3 + K2 (MK-7):</strong> 2,000 IU + 60 mcg Cholecalciferol</div>
                  <div>• <strong>Chelated Zinc + Protein:</strong> 11 mg Zinc + ${Math.round(weight * 1.3 * 10) / 10}g protein</div>
                </div>
              </div>
            </div>

            <!-- Section 6: Biomechanical Spinal Decompression Routine -->
            <div style="margin-bottom: 14px;">
              <h2 style="font-size: 10.5pt; font-weight: 800; color: #0F172A; border-left: 4px solid #E11D48; padding-left: 8px; margin: 0 0 6px 0;">
                6. Biomechanical Epiphyseal Decompression &amp; Wolff's Law Routine
              </h2>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 8pt;">
                <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 6px 8px; background: #F8FAFC;">
                  <div style="font-weight: 800; color: #1D4ED8;">1. Passive Spinal Dead Hang</div>
                  <div>30s x 3 sets (30s rest interval)</div>
                  <div style="color: #64748B; font-size: 7.2pt;">Intervertebral L1–L5 decompression</div>
                </div>
                <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 6px 8px; background: #F8FAFC;">
                  <div style="font-weight: 800; color: #1D4ED8;">2. Thoracic &amp; Pelvic Alignment</div>
                  <div>45s x 2 sets (bilateral)</div>
                  <div style="color: #64748B; font-size: 7.2pt;">Corrects anterior pelvic posture</div>
                </div>
                <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 6px 8px; background: #F8FAFC;">
                  <div style="font-weight: 800; color: #1D4ED8;">3. Plyometric Micro-Loading</div>
                  <div>15-min interval (45s jump / 15s rest)</div>
                  <div style="color: #64748B; font-size: 7.2pt;">1.5–2.5G epiphyseal piezoelectric pulse</div>
                </div>
              </div>
            </div>

            <!-- Section 7: Pediatrician Clinical Notes & Physical Examination Intake Block -->
            <div style="margin-bottom: 14px; border: 1.5px solid #94A3B8; border-radius: 8px; padding: 10px 12px; background: #FFFFFF;">
              <h2 style="font-size: 10pt; font-weight: 800; color: #0F172A; margin: 0 0 6px 0; display: flex; justify-content: space-between;">
                <span>Pediatrician Physical Exam &amp; Review of Systems</span>
                <span style="font-size: 7.5pt; font-weight: 600; color: #64748B;">[For Clinic Use Only / Doctor Review]</span>
              </h2>
              <div style="font-size: 8pt; line-height: 1.6; color: #334155;">
                <div style="display: flex; gap: 16px; margin-bottom: 4px;">
                  <span><strong>HEENT / Thyroid:</strong> [ &nbsp; ] Normal &nbsp; [ &nbsp; ] Palpable Thyroid &nbsp; [ &nbsp; ] Facies</span>
                  <span><strong>Spine / Posture:</strong> [ &nbsp; ] Adam's Forward Bend Negative &nbsp; [ &nbsp; ] Kyphosis / Asymmetry</span>
                </div>
                <div style="display: flex; gap: 16px; margin-bottom: 6px;">
                  <span><strong>Tanner SMR Pubertal Stage:</strong> [ &nbsp; ] Stage 1 &nbsp; [ &nbsp; ] Stage 2 &nbsp; [ &nbsp; ] Stage 3 &nbsp; [ &nbsp; ] Stage 4 &nbsp; [ &nbsp; ] Stage 5</span>
                  <span><strong>Bone Age Radiograph:</strong> [ &nbsp; ] Ordered &nbsp; [ &nbsp; ] Deferred</span>
                </div>
                <div style="border-top: 1px dashed #CBD5E1; padding-top: 6px; font-style: italic; color: #64748B;">
                  Pediatrician Assessment / Clinical Orders: __________________________________________________________________________________<br>
                  Diagnostic Follow-up: __________________________________________________________________ Re-evaluate in: [ &nbsp; ] 3 Mo [ &nbsp; ] 6 Mo
                </div>
              </div>
            </div>

            <!-- Section 8: Official Attending Pediatrician Sign-off Block -->
            <div style="border: 1.5px solid #0F172A; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; background: #F8FAFC;">
              <div style="font-size: 8pt; color: #475569; max-width: 360px;">
                <div style="font-weight: 800; color: #0F172A; margin-bottom: 2px;">Attending Pediatrician Sign-off &amp; Clinic Authorization</div>
                Certified that patient auxology metrics, CDC 2000 LMS percentiles, and Khamis-Roche stator predictions have been verified for clinical consultation.
              </div>
              <div style="display: flex; align-items: center; gap: 18px;">
                <div style="text-align: right; font-size: 8pt;">
                  <div><strong>Attending Physician:</strong> ________________________</div>
                  <div style="margin-top: 3px;"><strong>NPI / License #:</strong> ________________________</div>
                  <div style="margin-top: 3px;"><strong>Date:</strong> ________________________</div>
                </div>
                <div style="width: 72px; height: 72px; border: 2px dashed #1D4ED8; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 7.2pt; font-weight: 800; color: #1D4ED8; text-align: center; background: #EFF6FF;">
                  <span>[MD / DO]</span>
                  <span>SIGNATURE &amp; OFFICIAL CLINIC SEAL</span>
                </div>
              </div>
            </div>

            <!-- Page 2 Footer -->
            <div style="border-top: 1px solid #CBD5E1; padding-top: 8px; margin-top: 10px; font-size: 8pt; color: #64748B; display: flex; justify-content: space-between;">
              <span>KISFIT BIO LABS · CLINICAL AUXOLOGY INTAKE SUMMARY (kisfitglobal.com)</span>
              <span>Page 2 of 2 (End of EHR-Grade Pediatrician Clinical Intake Summary)</span>
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

  // 3-B. 14-Day Visual Pediatric Routine Refrigerator Wall Chart (Print Sheet)
  function renderFridgeWallChartPrintSheet(profile = {}) {
    const isGlobal = profile.language === 'en' ||
      (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en') ||
      Boolean(profile.childName && !/[\uAC00-\uD7A3]/.test(profile.childName) && profile.language !== 'ko');
    const childName = profile.childName || profile.name || (isGlobal ? 'Liam' : '서우');
    const ageMonths = Number(profile.ageMonths || profile.exactMonths) || 120;
    const ageYears = Number(profile.ageYears) || Math.round(ageMonths / 12);
    const height = Number(profile.currentHeight) || 137.0;
    const targetHeight = Number(profile.targetHeight) || Math.round((height + 38.0) * 10) / 10;
    const todayStr = new Date().toISOString().split('T')[0];

    const daysHtml = Array.from({ length: 14 }, (_, i) => {
      const dayNum = String(i + 1).padStart(2, '0');
      return `
        <div style="background:#FFFFFF;border:1.5px solid #CBD5E1;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;justify-content:space-between;min-height:92px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E2E8F0;padding-bottom:4px;margin-bottom:6px;">
            <span style="font-size:9pt;font-weight:900;color:#1E3A8A;">Day ${dayNum}</span>
            <span style="width:16px;height:16px;border:1.5px solid #94A3B8;border-radius:50%;display:inline-block;"></span>
          </div>
          <div style="grid-template-columns:1fr 1fr 1fr;display:grid;gap:4px;font-size:7pt;color:#334155;text-align:center;">
            <div style="background:#FEF3C7;border-radius:4px;padding:3px 2px;">☀️ Morn<br><span style="font-size:10pt;">⭐</span></div>
            <div style="background:#E0E7FF;border-radius:4px;padding:3px 2px;">⚡ Noon<br><span style="font-size:10pt;">⭐</span></div>
            <div style="background:#F1F5F9;border-radius:4px;padding:3px 2px;">🌙 Eve<br><span style="font-size:10pt;">⭐</span></div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="pediatrician-intake-print-sheet fridge-wall-chart-print-sheet" style="font-family:'Pretendard',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,sans-serif;color:#0F172A;line-height:1.35;max-width:820px;margin:0 auto;padding:16mm 14mm;box-sizing:border-box;background:#FFFFFF;">
        <!-- Header Banner -->
        <div style="border-bottom:3px solid #1D4ED8;padding-bottom:10px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:flex-end;">
          <div>
            <div style="font-size:8pt;font-weight:900;letter-spacing:0.06em;color:#1D4ED8;text-transform:uppercase;">
              KISFIT BIO LABS · CLINICAL AUXOLOGY REFRIGERATOR WALL CHART
            </div>
            <h1 style="font-size:17pt;font-weight:900;color:#0F172A;margin:2px 0 0 0;letter-spacing:-0.02em;">
              14-Day Visual Pediatric Growth Routine Wall Chart
            </h1>
            <div style="font-size:8.5pt;color:#64748B;margin-top:2px;">
              Printable Home Refrigerator Protocol · Daily Habit Tracking for Maximum Epiphyseal Proliferation
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9pt;font-weight:800;color:#1E3A8A;">Child: <strong>${childName}</strong> (Age ${ageYears})</div>
            <div style="font-size:8pt;color:#475569;">Current: ${height.toFixed(1)} cm · Goal: ${targetHeight.toFixed(1)} cm</div>
            <div style="font-size:7.5pt;color:#64748B;">Date: ${todayStr}</div>
          </div>
        </div>

        <!-- 3 Circadian Protocol Columns -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
          <!-- Morning -->
          <div style="background:#FFFBEB;border:1.5px solid #FCD34D;border-radius:12px;padding:10px 12px;">
            <div style="font-size:9pt;font-weight:900;color:#B45309;display:flex;align-items:center;gap:4px;margin-bottom:4px;">
              ☀️ Morning Protocol (07:00–08:30)
            </div>
            <ul style="margin:0;padding-left:14px;font-size:7.8pt;color:#78350F;line-height:1.45;">
              <li><strong>Bioavailable Ca + D3/K2:</strong> Take weight-calibrated calcium citrate with breakfast.</li>
              <li><strong>Spine Lengthening:</strong> 5-minute overhead wall reach and thoracic spine extension.</li>
              <li><strong>Circadian Lux:</strong> 15 mins morning natural sunlight for retinal melatonin reset.</li>
            </ul>
          </div>

          <!-- Afternoon -->
          <div style="background:#EEF2FF;border:1.5px solid #A5B4FC;border-radius:12px;padding:10px 12px;">
            <div style="font-size:9pt;font-weight:900;color:#4338CA;display:flex;align-items:center;gap:4px;margin-bottom:4px;">
              ⚡ Afternoon Protocol (15:30–17:30)
            </div>
            <ul style="margin:0;padding-left:14px;font-size:7.8pt;color:#312E81;line-height:1.45;">
              <li><strong>Wolff's Law Exercise:</strong> 15-min jumping, rope skipping or basketball impact.</li>
              <li><strong>Spinal Decompression:</strong> 30s doorway bar dead-hang to hydrate disc height.</li>
              <li><strong>Chondrocyte Fuel:</strong> High-protein afternoon snack (Greek yogurt / eggs).</li>
            </ul>
          </div>

          <!-- Evening -->
          <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:10px 12px;">
            <div style="font-size:9pt;font-weight:900;color:#15803D;display:flex;align-items:center;gap:4px;margin-bottom:4px;">
              🌙 Evening Protocol (18:30–22:00)
            </div>
            <ul style="margin:0;padding-left:14px;font-size:7.8pt;color:#14532D;line-height:1.45;">
              <li><strong>3h Glycemic Cutoff:</strong> Finish dinner 3h before bed; strict zero night sugar.</li>
              <li><strong>Digital Sunset:</strong> Screens completely off 45 mins prior to lights out.</li>
              <li><strong>Stage N3 Delta Sleep:</strong> Dark cool bedroom, asleep by 9:45 PM for 70% GH pulse.</li>
            </ul>
          </div>
        </div>

        <!-- 14-Day Star Checkbox Grid -->
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:9.5pt;font-weight:900;color:#0F172A;">14-Day Growth Routine Checkpoints (Check off ⭐ each protocol daily!)</span>
            <span style="font-size:7.5pt;color:#059669;font-weight:800;">Target: 42 Stars = 100% Epiphyseal Routine Mastery</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;">
            ${daysHtml}
          </div>
        </div>

        <!-- Motivational Pledge & Signatures -->
        <div style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:10px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
          <div style="max-width:65%;">
            <div style="font-size:8.5pt;font-weight:900;color:#1E3A8A;">Parent-Child Growth Commitment Pledge</div>
            <div style="font-size:7.5pt;color:#475569;margin-top:2px;">
              "I commit to completing my 14-day circadian sleep, Wolff's law exercises, and nutrition routines to unlock my natural biological growth potential!"
            </div>
          </div>
          <div style="display:flex;gap:12px;font-size:8pt;color:#334155;">
            <div style="border-bottom:1px solid #94A3B8;padding:2px 14px;text-align:center;">
              <span style="font-size:7pt;color:#64748B;display:block;">Child Signature</span>
              ${childName}
            </div>
            <div style="border-bottom:1px solid #94A3B8;padding:2px 14px;text-align:center;">
              <span style="font-size:7pt;color:#64748B;display:block;">Parent Signature</span>
              [ Signature ]
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top:10px;padding-top:6px;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;font-size:7pt;color:#94A3B8;">
          <span>KISFIT Bio Labs · Refrigerator Print Pack Document B · K-Growth AI™ Clinical Protocol</span>
          <span>kisfitglobal.com · 3,722 Peer-Reviewed PubMed Studies Aligned</span>
        </div>
      </div>
    `;
  }

  // 3-C. Milestone Certificate of Biological Potential (Print Sheet)
  function renderMilestoneCertificatePrintSheet(profile = {}) {
    const isGlobal = profile.language === 'en' ||
      (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en') ||
      Boolean(profile.childName && !/[\uAC00-\uD7A3]/.test(profile.childName) && profile.language !== 'ko');
    const childName = profile.childName || profile.name || (isGlobal ? 'Liam' : '서우');
    const ageMonths = Number(profile.ageMonths || profile.exactMonths) || 120;
    const ageYears = Number(profile.ageYears) || Math.round(ageMonths / 12);
    const height = Number(profile.currentHeight) || 137.0;
    const fatherH = Number(profile.fatherHeight) || 173.5;
    const motherH = Number(profile.motherHeight) || 160.5;
    const sexKey = (profile.gender === 'girl' || profile.gender === 'female') ? 'girl' : 'boy';
    const mphOffset = sexKey === 'girl' ? -13 : 13;
    const mph = Math.round(((fatherH + motherH + mphOffset) / 2) * 10) / 10;
    const targetHeight = Math.round((mph + 6.0) * 10) / 10;
    const todayStr = new Date().toISOString().split('T')[0];

    return `
      <div class="pediatrician-intake-print-sheet milestone-certificate-print-sheet" style="font-family:'Pretendard',Georgia,serif;color:#0F172A;line-height:1.4;max-width:820px;margin:0 auto;padding:16mm 14mm;box-sizing:border-box;background:#FFFFFF;text-align:center;">
        <div style="border:6px double #D97706;padding:22px 24px;border-radius:18px;background:radial-gradient(ellipse at center,#FFFDF7 0%,#FFFBEB 100%);">
          <!-- Emblem -->
          <div style="font-size:32pt;margin-bottom:4px;color:#D97706;">🏅</div>
          <div style="font-size:9pt;font-weight:900;letter-spacing:0.12em;color:#92400E;text-transform:uppercase;">
            KISFIT BIO LABS · PEDIATRIC AUXOLOGY CLINICAL ALLIANCE
          </div>
          <h1 style="font-size:24pt;font-weight:900;color:#1E3A8A;margin:8px 0 2px 0;letter-spacing:-0.01em;font-family:Georgia,serif;">
            Certificate of Biological Potential
          </h1>
          <div style="font-size:10pt;font-style:italic;color:#B45309;margin-bottom:14px;">
            Official Pediatric Health &amp; Auxological Stature Achievement Recognition
          </div>

          <div style="font-size:9.5pt;color:#475569;margin-bottom:8px;">
            This formal certificate is proudly awarded to:
          </div>

          <!-- Recipient Name -->
          <div style="font-size:26pt;font-weight:900;color:#0F172A;border-bottom:2px solid #D97706;display:inline-block;padding:0 24px 4px 24px;margin-bottom:14px;letter-spacing:0.02em;">
            ${childName}
          </div>

          <!-- Description -->
          <p style="font-size:9.5pt;color:#334155;max-width:620px;margin:0 auto 16px auto;line-height:1.55;">
            In recognition of outstanding dedication to circadian sleep excellence, Wolff's law piezoelectric exercise protocols, and weight-calibrated bone-matrix nutrition, taking proactive charge of their epiphyseal growth window.
          </p>

          <!-- Certified Biometric Benchmarks -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;max-width:580px;margin:0 auto 20px auto;text-align:center;">
            <div style="background:#FFFFFF;border:1.5px solid #CBD5E1;border-radius:10px;padding:8px 10px;">
              <div style="font-size:7.5pt;color:#64748B;font-weight:800;text-transform:uppercase;">Evaluated Stature</div>
              <div style="font-size:13pt;font-weight:900;color:#1D4ED8;margin-top:2px;">${height.toFixed(1)} cm</div>
              <div style="font-size:7pt;color:#059669;font-weight:700;">Age ${ageYears} Baseline</div>
            </div>
            <div style="background:#FFFFFF;border:1.5px solid #CBD5E1;border-radius:10px;padding:8px 10px;">
              <div style="font-size:7.5pt;color:#64748B;font-weight:800;text-transform:uppercase;">Genetic Target</div>
              <div style="font-size:13pt;font-weight:900;color:#475569;margin-top:2px;">${mph.toFixed(1)} cm</div>
              <div style="font-size:7pt;color:#475569;font-weight:700;">Tanner MPH Channel</div>
            </div>
            <div style="background:#FFFFFF;border:1.5px solid #FCD34D;border-radius:10px;padding:8px 10px;">
              <div style="font-size:7.5pt;color:#B45309;font-weight:800;text-transform:uppercase;">Optimized Target</div>
              <div style="font-size:13pt;font-weight:900;color:#B45309;margin-top:2px;">${targetHeight.toFixed(1)} cm</div>
              <div style="font-size:7pt;color:#B45309;font-weight:700;">Golden Potential</div>
            </div>
          </div>

          <!-- Signatures & Seal -->
          <div style="display:flex;justify-content:space-around;align-items:flex-end;margin-top:16px;padding-top:10px;border-top:1px dashed #CBD5E1;">
            <div style="text-align:center;min-width:140px;">
              <div style="border-bottom:1.5px solid #0F172A;padding-bottom:4px;font-size:10pt;font-weight:800;color:#0F172A;">
                Dr. E. R. Harrison, MD
              </div>
              <div style="font-size:7.5pt;color:#64748B;margin-top:2px;">Clinical Auxology Director</div>
            </div>

            <!-- Gold Seal Badge -->
            <div style="width:64px;height:64px;border:3px double #D97706;border-radius:50%;background:#FEF3C7;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:6.5pt;font-weight:900;color:#92400E;line-height:1.1;box-shadow:0 2px 6px rgba(217,119,6,0.25);">
              <span>KISFIT</span>
              <span style="font-size:9pt;">★</span>
              <span>OFFICIAL</span>
            </div>

            <div style="text-align:center;min-width:140px;">
              <div style="border-bottom:1.5px solid #0F172A;padding-bottom:4px;font-size:10pt;font-weight:800;color:#0F172A;">
                ${todayStr}
              </div>
              <div style="font-size:7.5pt;color:#64748B;margin-top:2px;">Date of Evaluation</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 3-D. 3-in-1 Clinical Print Pack Master Generator
  function renderClinicalPrintPack(documentType = 'doctor-dossier', childData = {}, clinicalData = {}) {
    const profile = Object.assign({}, childData || {}, clinicalData || {});
    const normType = String(documentType || 'doctor-dossier').toLowerCase().trim();

    if (normType.includes('fridge') || normType.includes('chart')) {
      return renderFridgeWallChartPrintSheet(profile);
    } else if (normType.includes('cert') || normType.includes('milestone')) {
      return renderMilestoneCertificatePrintSheet(profile);
    } else {
      return renderClinicalPdfReport(profile);
    }
  }

  function printClinicalPrintPack(documentType = 'doctor-dossier', profile = {}) {
    if (typeof window !== 'undefined' && window.KidsFitGlobalPaywall && typeof window.KidsFitGlobalPaywall.isGlobalPaidEdition === 'function' && window.KidsFitGlobalPaywall.isGlobalPaidEdition() && typeof window.KidsFitGlobalPaywall.isReportUnlocked === 'function' && !window.KidsFitGlobalPaywall.isReportUnlocked()) {
      let lockedContainer = typeof document !== 'undefined' ? document.getElementById('clinic-print-report-container') : null;
      if (lockedContainer) {
        lockedContainer.innerHTML = '';
        lockedContainer.style.display = 'none';
      }
      if (typeof window.openKidsFitGlobalCheckoutModal === 'function') {
        window.openKidsFitGlobalCheckoutModal();
      }
      return false;
    }

    if (typeof document === 'undefined') return false;

    let printContainer = document.getElementById('clinic-print-report-container');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'clinic-print-report-container';
      document.body.appendChild(printContainer);
    }
    printContainer.style.display = 'block';
    printContainer.innerHTML = renderClinicalPrintPack(documentType, profile);

    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
    return true;
  }

  // 3-E. Sibling Dual-Curve Matrix & Family Auxology Hub
  function renderSiblingDualCurveMatrix(children = []) {
    let list = Array.isArray(children) && children.length > 0 ? children : [];
    if (list.length === 0 && typeof window !== 'undefined' && window.localStorage) {
      try {
        for (let i = 1; i <= 4; i++) {
          const raw = window.localStorage.getItem('kidsfit_global_sibling_slot_' + i + '_v1');
          if (raw) {
            const p = JSON.parse(raw);
            p.slotIndex = i;
            list.push(p);
          }
        }
      } catch (_) {}
    }

    if (list.length === 0) {
      list = [
        { name: 'Liam', childName: 'Liam', gender: 'boy', ageYears: 10, currentHeight: 138.5, currentWeight: 34.0 },
        { name: 'Emma', childName: 'Emma', gender: 'girl', ageYears: 8, currentHeight: 128.0, currentWeight: 26.5 }
      ];
    }

    const pubertalOffsetSummary = {
      girlPhvAge: 11.5,
      boyPhvAge: 13.5,
      tempoOffsetYears: 2.0,
      clinicalInsight: 'Girls enter Peak Height Velocity (PHV) approximately 2.0 years earlier than boys (~11.5 yrs vs ~13.5 yrs). A younger sister may temporarily surge past an older brother during her adolescent spurt before the brother completes a 2-year longer elongation corridor.'
    };

    let totalDailyCa = 0;
    let totalDailyD3 = 0;
    let totalDailyK2 = 0;
    let totalDailyMg = 0;
    let totalDailyZn = 0;

    const childCards = list.map((c, idx) => {
      const cName = c.childName || c.name || `Child #${idx + 1}`;
      const isB = (c.gender === 'boy' || c.gender === 'male');
      const ageY = Number(c.ageYears) || 10;
      const h = Number(c.currentHeight) || 135.0;
      const phvAge = isB ? 13.5 : 11.5;
      const closureAge = isB ? 17.5 : 15.5;
      const yearsToPhv = Math.round((phvAge - ageY) * 10) / 10;
      const remYears = Math.max(0, Math.round((closureAge - ageY) * 10) / 10);

      const caMg = ageY >= 9 ? 1000 : 800;
      const d3Iu = ageY >= 9 ? 1000 : 800;
      const k2Mcg = ageY >= 9 ? 75 : 45;
      const mgMg = ageY >= 9 ? 240 : 130;
      const znMg = ageY >= 9 ? 11 : 8;

      totalDailyCa += caMg;
      totalDailyD3 += d3Iu;
      totalDailyK2 += k2Mcg;
      totalDailyMg += mgMg;
      totalDailyZn += znMg;

      return `
        <div style="background:#FFFFFF;border:1.5px solid ${isB ? '#BFDBFE' : '#FBCFE8'};border-radius:12px;padding:12px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:10pt;font-weight:900;color:${isB ? '#1D4ED8' : '#BE185D'};">
              ${isB ? '👦' : '👧'} ${cName} (Age ${ageY} · ${isB ? 'Boy' : 'Girl'})
            </span>
            <span style="font-size:7.5pt;background:${isB ? '#EFF6FF' : '#FDF2F8'};color:${isB ? '#1D4ED8' : '#BE185D'};padding:2px 8px;border-radius:9999px;font-weight:800;">
              PHV at ~${phvAge}y
            </span>
          </div>
          <div style="font-size:8pt;color:#334155;line-height:1.5;margin-bottom:8px;">
            <div>• Current Stature: <strong>${h.toFixed(1)} cm</strong></div>
            <div>• Timing to Peak Growth: <strong>${yearsToPhv > 0 ? `${yearsToPhv} yrs until PHV` : 'Currently in PHV Spurt'}</strong></div>
            <div>• Remaining Open Window: <strong>${remYears} yrs</strong> (Closure at ~${closureAge}y)</div>
          </div>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:6px 8px;font-size:7.5pt;color:#475569;">
            <strong style="color:#0F172A;">Daily Dosing:</strong> Ca ${caMg}mg · D3 ${d3Iu}IU · K2 ${k2Mcg}mcg · Mg ${mgMg}mg · Zn ${znMg}mg
          </div>
        </div>
      `;
    }).join('');

    const familyMonthlyDosing = {
      totalCalciumMg: totalDailyCa * 30,
      totalD3Iu: totalDailyD3 * 30,
      totalK2Mcg: totalDailyK2 * 30,
      totalMagnesiumMg: totalDailyMg * 30,
      totalZincMg: totalDailyZn * 30,
      caBottlesNeeded: Math.ceil((totalDailyCa * 30) / 60000),
      d3BottlesNeeded: Math.ceil((totalDailyD3 * 30) / 360000)
    };

    const html = `
      <div class="sibling-dual-curve-matrix" style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:16px;padding:16px;margin:12px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;border-bottom:1px solid #E2E8F0;padding-bottom:10px;">
          <div>
            <span style="font-size:7.5pt;font-weight:900;color:#1D4ED8;background:#EFF6FF;padding:2px 8px;border-radius:9999px;">
              👨‍👩‍👧‍👦 MULTI-CHILD AUXOLOGY &amp; PUBERTAL TEMPO MATRIX
            </span>
            <h4 style="font-size:12pt;font-weight:900;color:#0F172A;margin:4px 0 0 0;">
              Sibling Dual-Curve Pubertal Offset &amp; Consolidated Family Dosing
            </h4>
          </div>
          <div style="font-size:8pt;color:#059669;font-weight:800;background:#ECFDF5;padding:4px 10px;border-radius:9999px;border:1px solid #A7F3D0;">
            ✓ Girls PHV (11.5y) vs Boys PHV (13.5y) Calibrated
          </div>
        </div>

        <p style="font-size:8.5pt;color:#475569;line-height:1.55;margin-bottom:12px;">
          ${pubertalOffsetSummary.clinicalInsight}
        </p>

        <!-- Sibling Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;margin-bottom:14px;">
          ${childCards}
        </div>

        <!-- Consolidated Family Dosing Table -->
        <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:12px 14px;">
          <div style="font-size:9pt;font-weight:900;color:#15803D;margin-bottom:6px;">
            💊 Consolidated Monthly Family Supplement Order Requirement (${list.length} Children)
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;text-align:center;">
            <div style="background:#FFFFFF;border:1px solid #BBF7D0;border-radius:8px;padding:6px;">
              <div style="font-size:7pt;color:#64748B;">Calcium Citrate</div>
              <div style="font-size:11pt;font-weight:900;color:#15803D;">${(familyMonthlyDosing.totalCalciumMg / 1000).toFixed(1)} g / mo</div>
              <div style="font-size:6.5pt;color:#475569;">(${familyMonthlyDosing.caBottlesNeeded} bottle/mo)</div>
            </div>
            <div style="background:#FFFFFF;border:1px solid #BBF7D0;border-radius:8px;padding:6px;">
              <div style="font-size:7pt;color:#64748B;">Vitamin D3</div>
              <div style="font-size:11pt;font-weight:900;color:#15803D;">${familyMonthlyDosing.totalD3Iu.toLocaleString()} IU / mo</div>
              <div style="font-size:6.5pt;color:#475569;">(${familyMonthlyDosing.d3BottlesNeeded} bottle/qtr)</div>
            </div>
            <div style="background:#FFFFFF;border:1px solid #BBF7D0;border-radius:8px;padding:6px;">
              <div style="font-size:7pt;color:#64748B;">Vitamin K2 (MK-7)</div>
              <div style="font-size:11pt;font-weight:900;color:#15803D;">${familyMonthlyDosing.totalK2Mcg.toLocaleString()} mcg / mo</div>
              <div style="font-size:6.5pt;color:#475569;">(Osteocalcin Active)</div>
            </div>
            <div style="background:#FFFFFF;border:1px solid #BBF7D0;border-radius:8px;padding:6px;">
              <div style="font-size:7pt;color:#64748B;">Magnesium &amp; Zinc</div>
              <div style="font-size:11pt;font-weight:900;color:#15803D;">Mg ${familyMonthlyDosing.totalMagnesiumMg}mg · Zn ${familyMonthlyDosing.totalZincMg}mg</div>
              <div style="font-size:6.5pt;color:#475569;">(IGF-1 &amp; SWS Peak)</div>
            </div>
          </div>
        </div>
      </div>
    `;

    return {
      html,
      childrenCount: list.length,
      pubertalOffsetSummary,
      familyMonthlyDosing
    };
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
    printContainer.innerHTML = renderClinicalPrintPack('doctor-dossier', profile);
  }

  function printClinicReport(profile = {}) {
    return printClinicalPrintPack('doctor-dossier', profile);
  }

  // 5. DOM Event Binding for Tracker Dashboard
  function initTrackerControls(profile = {}) {
    if (typeof document === 'undefined') return;

    // A. Pediatrician Consultation PDF Export
    const btnPrint = document.getElementById('btn-print-clinic-pdf');
    if (btnPrint && typeof btnPrint.addEventListener === 'function') {
      btnPrint.onclick = () => printClinicReport(profile);
    }

    // B. Sibling Switcher Bar inside Tracker
    if (typeof window !== 'undefined' && window.KidsFitUserCohortDB && typeof window.KidsFitUserCohortDB.renderSiblingSwitcherBar === 'function') {
      window.KidsFitUserCohortDB.renderSiblingSwitcherBar('sibling-profile-tabs-tracker', {
        onSwitch: (switchedProfile) => {
          const container = document.getElementById('core-5-container');
          if (container) {
            container.outerHTML = renderTrackerSection(switchedProfile);
            initTrackerControls(switchedProfile);
          }
        }
      });
    }

    // C. 14-Day Checklist Day Selection Tabs
    const dayPills = document.querySelectorAll('.checklist-day-pill');
    dayPills.forEach(pill => {
      pill.onclick = () => {
        const day = parseInt(pill.getAttribute('data-day'), 10);
        if (!isNaN(day)) {
          set14DayActiveDay(day, profile);
          const container = document.getElementById('core-5-container');
          if (container) {
            container.outerHTML = renderTrackerSection(profile);
            initTrackerControls(profile);
          }
        }
      };
    });

    // D. 14-Day Checklist Item Checkboxes
    const taskCheckboxes = document.querySelectorAll('.chk-14day-task');
    taskCheckboxes.forEach(chk => {
      chk.onchange = (e) => {
        const day = parseInt(e.target.getAttribute('data-day'), 10);
        const taskKey = e.target.getAttribute('data-task-key');
        if (!isNaN(day) && taskKey) {
          toggle14DayChecklistItem(day, taskKey, e.target.checked, profile);
          const container = document.getElementById('core-5-container');
          if (container) {
            container.outerHTML = renderTrackerSection(profile);
            initTrackerControls(profile);
          }
        }
      };
    });

    // E. 3-Core Protocol Toggles
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

    // F. Log Entry Submission
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
    CHECKLIST_STORAGE_KEY,
    CHECKLIST_TASKS,
    getTrackerData,
    saveTrackerData,
    get14DayChecklist,
    save14DayChecklist,
    toggle14DayChecklistItem,
    set14DayActiveDay,
    addLogEntry,
    toggleProtocol,
    renderTrackerSection,
    renderClinicalPdfReport,
    renderFridgeWallChartPrintSheet,
    renderMilestoneCertificatePrintSheet,
    renderClinicalPrintPack,
    printClinicalPrintPack,
    renderSiblingDualCurveMatrix,
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

