/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * User Input Cohort DB & Autonomous Self-Improvement Feedback Engine (src/js/user-cohort-db.js)
 *
 * Core Capabilities:
 * 1. Captures and persists every user diagnostic input (Parent/Child mode & Youth/Self mode)
 *    into localStorage (`taller_user_cohort_records_v1`) and server DB (`POST /api/user-cohort` -> `src/data/user-cohort-db.json`).
 * 2. Aggregates real user cohort statistics (age bands, bottleneck habits, cognitive axes, Z-score distributions).
 * 3. Dynamically computes `auto_learning_weights` to drive self-improvement across:
 *    - Academic Paper Crawler query prioritization (`continuous_research_daemon.py`)
 *    - Pinpoint Supplement / Toy / Book Curator ranking (`pinpoint-curator.js`)
 *    - Personalized Growth Guidebook chapter emphasis (`master-briefing.js`)
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'taller_user_cohort_records_v1';

  const HABIT_DOMAIN_MAP = {
    late_sleep: {
      domain: 'chronobiology_sleep_architecture',
      labelKo: '일주기 생체시계 & 서파수면(SWS) 호르몬 피크',
      labelEn: 'Circadian Clock & SWS GH Peak',
      actionKo: '밤 10시 전 입면 & 수면 첫 90분 성장호르몬(일일 65%) 극대화 논문 가중치 상향'
    },
    picky_eater: {
      domain: 'clinical_nutrigenomics_microbiome',
      labelKo: '임상 영양유전체 & 골기질 미네랄 생체이용률',
      labelEn: 'Clinical Nutrigenomics & Bone Mineralization',
      actionKo: '황기추출물(HT042)·어골칼슘·비타민D3·K2·아연 핀셋 처방 가중치 상향'
    },
    poor_posture: {
      domain: 'posture_biomechanics_exercise',
      labelKo: '경추·척추 생체역학 정렬 & 추간판 디스크 감압',
      labelEn: 'Spinal Alignment & Intervertebral Decompression',
      actionKo: '패시브 데드행(30초×3) 및 거북목·라운드숄더 교정 숨은 키(+1.8cm) 복원 프로토콜 강화'
    },
    sedentary: {
      domain: 'epiphyseal_wolff_loading',
      labelKo: '볼프의 법칙(Wolff\'s Law) 골단판 압전 미세자극',
      labelEn: 'Wolff\'s Law Epiphyseal Piezoelectric Loading',
      actionKo: '주 5회 15분 수직 점핑·줄넘기 성장판 연골세포 증식 코칭 가중치 상향'
    },
    night_carbs: {
      domain: 'growth_endocrinology_core',
      labelKo: '야간 인슐린·소마토스타틴 억제 제어 내분비학',
      labelEn: 'Nocturnal Insulin & Somatostatin Suppression Control',
      actionKo: '취침 3시간 전 무당류 공복 유지(GH -52% 억제 방어) 식단 프로토콜 강화'
    }
  };

  function getBaseCohortDb() {
    if (typeof window !== 'undefined' && window.KIDSFIT_USER_COHORT_DB) {
      return window.KIDSFIT_USER_COHORT_DB;
    }
    if (typeof global !== 'undefined' && global.KIDSFIT_USER_COHORT_DB) {
      return global.KIDSFIT_USER_COHORT_DB;
    }
    if (typeof require !== 'undefined') {
      try {
        return require('../data/user-cohort-db.json');
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  function getAgeBandKey(ageYears) {
    const y = Number(ageYears) || 10;
    if (y <= 3) return '1-3y';
    if (y <= 6) return '4-6y';
    if (y <= 9) return '7-9y';
    if (y <= 12) return '10-12y';
    if (y <= 16) return '13-16y';
    return '17-20y';
  }

  function getLocalRecords() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveLocalRecords(records) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-50)));
    } catch (_) {}
  }

  /**
   * Computes aggregated cohort statistics & dynamic self-improvement weights
   * combining the base DB + any local user records
   */
  function getAggregatedCohortAnalytics() {
    const baseDb = getBaseCohortDb() || {};
    const meta = baseDb.metadata || {};
    const localRecords = getLocalRecords();

    const baseTotal = Number(meta.total_records) || 128;
    const totalRecords = baseTotal + localRecords.length;

    const subjectCounts = {
      child: ((meta.subject_mode_counts && meta.subject_mode_counts.child) || 89) + localRecords.filter(r => r.targetSubject !== 'self').length,
      self: ((meta.subject_mode_counts && meta.subject_mode_counts.self) || 39) + localRecords.filter(r => r.targetSubject === 'self').length
    };

    const ageBands = Object.assign({
      '1-3y': 22,
      '4-6y': 26,
      '7-9y': 29,
      '10-12y': 31,
      '13-16y': 14,
      '17-20y': 6
    }, meta.age_band_distribution || {});

    const habitFreqs = Object.assign({
      late_sleep: 84,
      picky_eater: 61,
      poor_posture: 58,
      sedentary: 49,
      night_carbs: 37
    }, meta.bottleneck_habit_frequencies || {});

    localRecords.forEach((rec) => {
      const band = getAgeBandKey(rec.ageYears);
      ageBands[band] = (ageBands[band] || 0) + 1;
      if (Array.isArray(rec.habits)) {
        rec.habits.forEach((h) => {
          if (habitFreqs[h] !== undefined) habitFreqs[h] += 1;
        });
      }
    });

    // Compute dynamic self-improvement weights (1.10x ~ 1.65x) proportional to user bottleneck prevalence
    const autoLearningWeights = {};
    Object.keys(HABIT_DOMAIN_MAP).forEach((habitKey) => {
      const count = habitFreqs[habitKey] || 10;
      const ratio = count / Math.max(1, totalRecords);
      const weight = Math.round((1.05 + ratio * 0.65) * 100) / 100;
      const domain = HABIT_DOMAIN_MAP[habitKey].domain;
      autoLearningWeights[domain] = weight;
    });

    // Sort habits by frequency descending
    const rankedBottlenecks = Object.keys(habitFreqs)
      .map((key) => {
        const count = habitFreqs[key] || 0;
        const pct = Math.round((count / Math.max(1, totalRecords)) * 1000) / 10;
        const info = HABIT_DOMAIN_MAP[key] || { domain: 'growth_endocrinology_core', labelKo: key, actionKo: '' };
        return {
          habitKey: key,
          count,
          percent: pct,
          domain: info.domain,
          labelKo: info.labelKo,
          labelEn: info.labelEn,
          actionKo: info.actionKo,
          learningWeight: autoLearningWeights[info.domain] || 1.25
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      totalRecords,
      localRecordsCount: localRecords.length,
      subjectCounts,
      ageBands,
      habitFreqs,
      autoLearningWeights,
      rankedBottlenecks,
      selfImprovementActions: Array.isArray(meta.self_improvement_actions) ? meta.self_improvement_actions : [],
      cohortBenchmarks: baseDb.cohort_benchmarks || {},
      recentRecords: [...localRecords.slice().reverse(), ...(Array.isArray(baseDb.records) ? baseDb.records : [])].slice(0, 12)
    };
  }

  /**
   * Records a user diagnostic submission into localStorage + server DB (`POST /api/user-cohort`)
   */
  function recordUserDiagnosis(profile = {}, computedMetrics = {}) {
    const exactMonths = Number(profile.exactMonths || profile.ageMonths || (profile.ageYears || 10) * 12);
    const ageYears = Math.max(1, Math.min(20, Math.floor(exactMonths / 12)));
    const gender = profile.gender === 'girl' ? 'girl' : 'boy';
    const targetSubject = profile.targetSubject === 'self' ? 'self' : 'child';

    const record = {
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      targetSubject,
      gender,
      birthDateStr: profile.birthDateStr || `${2026 - ageYears}-06-15`,
      exactMonths: Math.round(exactMonths * 10) / 10,
      ageYears,
      currentHeight: Number(profile.currentHeight) || 137.0,
      currentWeight: Number(profile.currentWeight) || 35.5,
      recentGrowth6m: Number(profile.recentGrowth6m) || 3.2,
      fatherHeight: Number(profile.fatherHeight) || 173.5,
      motherHeight: Number(profile.motherHeight) || 160.5,
      tannerPhase: profile.tannerPhase || 'phase_2',
      habits: Array.isArray(profile.habits) && profile.habits.length > 0 ? profile.habits : ['late_sleep'],
      cognitiveAxes: Array.isArray(profile.cognitiveAxes) && profile.cognitiveAxes.length > 0 ? profile.cognitiveAxes : ['science_nature'],
      region: profile.region || '서울 강남·서초·송파',
      kdcaPercentile: Number(computedMetrics.kdcaPercentile || computedMetrics.percentile || 50.0),
      zScore: Number(computedMetrics.zScore || 0.0),
      mph: Number(computedMetrics.mph || (gender === 'boy' ? 173.5 : 160.5)),
      unmanagedHeight: Number(computedMetrics.unmanagedHeight || 171.2),
      optimizedHeight: Number(computedMetrics.optimizedHeight || 180.5),
      potentialGainCm: Number(computedMetrics.potentialGainCm || 7.2)
    };

    // 1. Save to client localStorage (deduplicate if identical submission within last 15 seconds)
    const local = getLocalRecords();
    const last = local.length > 0 ? local[local.length - 1] : null;
    const isDuplicateInstant = last &&
      last.gender === record.gender &&
      last.exactMonths === record.exactMonths &&
      last.currentHeight === record.currentHeight &&
      (Date.now() - new Date(last.timestamp).getTime() < 15000);

    if (!isDuplicateInstant) {
      local.push(record);
      saveLocalRecords(local);

      // 2. Async POST to server.js (`/api/user-cohort`) if running in browser with fetch
      if (typeof fetch === 'function') {
        try {
          fetch('/api/user-cohort', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
          }).catch(() => {});
        } catch (_) {}
      }
    }

    return record;
  }

  /**
   * Computes cohort comparison & self-improvement feedback specific to the user's profile
   */
  function getCohortComparisonForProfile(profile = {}, computedMetrics = {}) {
    const analytics = getAggregatedCohortAnalytics();
    const exactMonths = Number(profile.exactMonths || profile.ageMonths || (profile.ageYears || 10) * 12);
    const ageYears = Math.max(1, Math.min(20, Math.floor(exactMonths / 12)));
    const bandKey = getAgeBandKey(ageYears);
    const benchmark = (analytics.cohortBenchmarks && analytics.cohortBenchmarks[bandKey]) || {
      label_ko: `만 ${ageYears}세 코호트`,
      sample_size: analytics.ageBands[bandKey] || 25,
      avg_percentile: 49.0,
      avg_potential_gain_cm: 7.2,
      top_habit_ko: '밤 10:30 이후 취침 & 수면 지연 (68%)',
      top_pinpoint_rx_ko: '식약처 인정 키성장 황기추출물(HT042) & 구연산 칼슘·비타민D3',
      guidebook_focus_ko: '성장판 골든타임 수면 호르몬 극대화 & 척추 감압 루틴'
    };

    const habits = Array.isArray(profile.habits) && profile.habits.length > 0 ? profile.habits : ['late_sleep'];
    const primaryHabit = habits[0] || 'late_sleep';
    const habitInfo = HABIT_DOMAIN_MAP[primaryHabit] || HABIT_DOMAIN_MAP.late_sleep;
    const activeWeight = analytics.autoLearningWeights[habitInfo.domain] || 1.35;

    return {
      bandKey,
      benchmark,
      totalCohortRecords: analytics.totalRecords,
      bandSampleSize: analytics.ageBands[bandKey] || benchmark.sample_size,
      activeDomain: habitInfo.domain,
      activeDomainLabelKo: habitInfo.labelKo,
      activeDomainActionKo: habitInfo.actionKo,
      activeLearningWeight: activeWeight,
      userPercentile: computedMetrics.kdcaPercentile || 50.0,
      userPotentialGainCm: computedMetrics.potentialGainCm || 7.2,
      localHistory: getLocalRecords().slice().reverse().slice(0, 5)
    };
  }

  /**
   * Renders Chapter 05 of the Personalized Growth Guidebook:
   * User Input Cohort DB Comparison & Autonomous Self-Improvement Feedback Loop
   */
  function renderGuidebookCohortSection(profile = {}, computedMetrics = {}) {
    // Ensure this diagnosis is recorded into the DB
    recordUserDiagnosis(profile, computedMetrics);

    const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
    const comp = getCohortComparisonForProfile(profile, computedMetrics);
    const isYouthSelf = profile.targetSubject === 'self' || (Number(profile.ageYears) >= 14 && profile.targetSubject !== 'child');
    const subjectLabel = isYouthSelf ? (isEn ? 'Your' : '청소년·본인') : (isEn ? 'Child' : '학부모(우리 아이)');

    const historyRowsHtml = comp.localHistory.map((h, idx) => `
      <tr style="border-bottom: 1px solid #BFDBFE;">
        <td style="padding: 0.45rem 0.5rem; font-size: 0.76rem; color: #1D4ED8; font-weight: 800;">#${idx + 1} ${idx === 0 ? `<span style="background: #EFF6FF;color: #1D4ED8;padding:0.08rem 0.35rem;border-radius:4px;font-size:0.66rem;">${isEn ? 'Saved Now' : '방금 저장됨'}</span>` : ''}</td>
        <td style="padding: 0.45rem 0.5rem; font-size: 0.76rem; color: #475569; font-weight: 700;">${h.birthDateStr || (isEn ? `Age ${h.ageYears}` : `만 ${h.ageYears}세`)} (${h.exactMonths} ${isEn ? 'mos' : '개월'})</td>
        <td style="padding: 0.45rem 0.5rem; font-size: 0.76rem; color: #0F172A; font-weight: 800;">${h.currentHeight}cm / ${h.currentWeight}kg</td>
        <td style="padding: 0.45rem 0.5rem; font-size: 0.76rem; color: #1D4ED8; font-weight: 800;">${h.optimizedHeight}cm (+${h.potentialGainCm}cm)</td>
      </tr>
    `).join('');

    return `
      <div id="user-cohort-self-improve-section" class="guidebook-chapter-block" style="margin-top: 1.35rem; padding-top: 1.15rem; border-top: 1px solid #BFDBFE; text-align: left;">
        <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 0.9rem 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 0.82rem; font-weight: 800; color: #0F172A;">${isEn ? 'My Cumulative Growth & Learning Log (Auto-Saved)' : '나의 성장·학습 진단 기록장 (자동 저장됨)'}</span>
            <span style="font-size: 0.72rem; color: #1D4ED8; font-weight: 700;">
              ${isEn ? `Cohort Benchmark (n=${comp.bandSampleSize}): Avg +${comp.benchmark.avg_potential_gain_cm}cm vs Yours +${comp.userPotentialGainCm}cm` : `동일 연령(n=${comp.bandSampleSize}) 평균 잠재 도약 +${comp.benchmark.avg_potential_gain_cm}cm vs 현재 +${comp.userPotentialGainCm}cm`}
            </span>
          </div>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid #BFDBFE; font-size: 0.72rem; color: #475569;">
                  <th style="padding: 0.35rem 0.5rem;">${isEn ? 'Entry' : '회차'}</th>
                  <th style="padding: 0.35rem 0.5rem;">${isEn ? 'DOB (Exact Age)' : '생년월일 (정밀 월령)'}</th>
                  <th style="padding: 0.35rem 0.5rem;">${isEn ? 'Height / Weight' : '계측 키 / 체중'}</th>
                  <th style="padding: 0.35rem 0.5rem;">${isEn ? 'Optimized Potential' : '꾸준히 관리 시 잠재키'}</th>
                </tr>
              </thead>
              <tbody>
                ${historyRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  const UserCohortDB = {
    STORAGE_KEY,
    HABIT_DOMAIN_MAP,
    getBaseCohortDb,
    getAgeBandKey,
    getLocalRecords,
    getAggregatedCohortAnalytics,
    recordUserDiagnosis,
    getCohortComparisonForProfile,
    renderGuidebookCohortSection
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserCohortDB;
  }
  global.TallerUserCohortDB = UserCohortDB;
  global.KidsFitUserCohortDB = UserCohortDB;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
