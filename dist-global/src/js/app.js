/**
 * KidsFit Growth Studio (키즈핏 그로스 스튜디오)
 * Core Application Engine & Onboarding Funnel (Milestone 2)
 * 
 * Features:
 * - 6 Quick 1-Second Presets (Auto-fill & reactive trigger)
 * - 6-Step Deep Diagnosis Onboarding Form (Validation, progress tracking)
 * - Interactive Prescription Analysis Transition Overlay
 * - 3 Floating Capsule Tab Navigation
 * - Secret Admin Studio Trigger (5 consecutive clicks or ?admin=1)
 * - Affiliate ID & URL synchronization via localStorage
 */

(function (global) {
  'use strict';

  // Domain & Monetization Engine References
  let GrowthEngine = typeof require !== 'undefined' ? require('./growth-engine') : (global.KidsFitGrowthEngine || null);
  let EndocrinologyEngine = typeof require !== 'undefined' ? require('./endocrinology-engine') : (global.KidsFitEndocrinologyEngine || null);
  let NutritionEngine = typeof require !== 'undefined' ? require('./nutrition-engine') : (global.KidsFitNutritionEngine || null);
  let BiomechanicsStudio = typeof require !== 'undefined' ? require('./biomechanics-studio') : (global.KidsFitBiomechanicsStudio || null);
  let NeuroCognitiveMatrix = typeof require !== 'undefined' ? require('./neuro-cognitive-matrix') : (global.KidsFitNeuroCognitiveMatrix || null);
  let GrowthTracker = typeof require !== 'undefined' ? require('./growth-tracker') : (global.KidsFitGrowthTracker || null);
  let DevelopmentEngine = typeof require !== 'undefined' ? require('./development-engine') : (global.KidsFitDevelopmentEngine || null);
  let WeekendCurator = typeof require !== 'undefined' ? require('./weekend-curator') : (global.KidsFitWeekendCurator || null);
  let Monetization = typeof require !== 'undefined' ? require('./monetization') : (global.KidsFitMonetization || null);
  let AdminOsmu = typeof require !== 'undefined' ? require('./admin-osmu') : (global.KidsFitAdminOsmu || null);
  let ReferenceChips = typeof require !== 'undefined' ? (function() { try { return require('./reference-chips'); } catch(e){ return null; } })() : (global.TallerReferenceChips || global.KidsFitReferenceChips || null);
  let AdminStudio = typeof require !== 'undefined' ? (function() { try { return require('./admin-studio'); } catch(e){ return null; } })() : (global.TallerAdminStudio || global.KidsFitAdminStudio || null);
  let MasterBriefingEngine = typeof require !== 'undefined' ? (function() { try { return require('./master-briefing'); } catch(e){ return null; } })() : (global.MasterBriefingEngine || global.KidsFitMasterBriefing || global.TallerMasterBriefing || null);

  // 1. Definition of 5 Clinical Age-Group Presets
  const PRESETS = {
    'preset-1': {
      id: 'preset-1',
      label: '영유아기 3세 (36개월) — 기초 성장기 & 소근육 감각 협응',
      gender: 'boy',
      ageYears: 3,
      ageMonths: 36,
      currentHeight: 96.5,
      currentWeight: 14.7,
      recentGrowth6m: 3.5,
      fatherHeight: 175.0,
      motherHeight: 162.0,
      region: 'United States',
      pubertyStage: 'phase_1',
      tannerPhase: 'phase_1',
      habits: ['picky_eater'],
      developmentConcerns: ['fine_motor', 'emotion_art'],
      cognitiveAxes: ['sensory_arts'],
      philosophy: 'montessori',
      interest: 'art_making'
    },
    'preset-2': {
      id: 'preset-2',
      label: '아동기 7세 (84개월) — 수리·공간 논리 & 척추 정렬 플랜',
      gender: 'girl',
      ageYears: 7,
      ageMonths: 84,
      currentHeight: 120.8,
      currentWeight: 23.6,
      recentGrowth6m: 2.8,
      fatherHeight: 176.0,
      motherHeight: 163.0,
      region: 'Canada',
      pubertyStage: 'phase_1',
      tannerPhase: 'phase_1',
      habits: ['poor_posture'],
      developmentConcerns: ['math_space'],
      cognitiveAxes: ['math_logic'],
      philosophy: 'froebel_gabe',
      interest: 'dino_nature'
    },
    'preset-3': {
      id: 'preset-3',
      label: '사춘기 진입 10세 (120개월) — 사춘기 초기 수면·호르몬 최적화',
      gender: 'boy',
      ageYears: 10,
      ageMonths: 120,
      currentHeight: 137.0,
      currentWeight: 35.5,
      recentGrowth6m: 3.2,
      fatherHeight: 173.5,
      motherHeight: 160.5,
      region: 'United Kingdom & Europe',
      pubertyStage: 'phase_2',
      tannerPhase: 'phase_2',
      habits: ['late_sleep'],
      developmentConcerns: ['language_reading', 'math_space'],
      cognitiveAxes: ['science_nature'],
      philosophy: 'science_coding',
      interest: 'space_science'
    },
    'preset-4': {
      id: 'preset-4',
      label: '급성장기 13세 (156개월) — PHV 급성장 피크 & 골든타임 집중',
      gender: 'boy',
      ageYears: 13,
      ageMonths: 156,
      currentHeight: 155.6,
      currentWeight: 51.0,
      recentGrowth6m: 4.5,
      fatherHeight: 174.0,
      motherHeight: 161.0,
      region: 'Australia & New Zealand',
      pubertyStage: 'phase_2',
      tannerPhase: 'phase_2',
      habits: ['late_sleep', 'night_carbs'],
      developmentConcerns: ['gross_motor'],
      cognitiveAxes: ['executive_focus'],
      philosophy: 'science_coding',
      interest: 'space_science'
    },
    'preset-5': {
      id: 'preset-5',
      label: '후기 청소년 16세 (192개월) — 체형 완성기 척추 디스크 복원',
      gender: 'girl',
      ageYears: 16,
      ageMonths: 192,
      currentHeight: 160.0,
      currentWeight: 54.1,
      recentGrowth6m: 0.8,
      fatherHeight: 177.0,
      motherHeight: 164.0,
      region: 'Asia-Pacific & Global',
      pubertyStage: 'phase_4',
      tannerPhase: 'phase_4',
      habits: ['poor_posture', 'late_sleep'],
      developmentConcerns: ['language_reading'],
      cognitiveAxes: ['language_reading'],
      philosophy: 'montessori',
      interest: 'history_tradition'
    }
  };

  // 2. Stepper Meta Information (5-Stage Bio Funnel)
  const STEP_INFO = [
    {
      step: 1,
      title: '아이 기본 프로필 & 거주 지역',
      subtitle: '질병관리청 표준 성장도표 백분위와 지역 맞춤 나들이 매칭에 활용됩니다.'
    },
    {
      step: 2,
      title: '성장 단계 & 골연령 (Tanner Stage) 진행도',
      subtitle: '성장판 개방률과 급성장 피크기(PHV) 잔여 잠재력을 평가합니다.'
    },
    {
      step: 3,
      title: '라이프스타일 & 생체 저해 요인 체크',
      subtitle: '수면 중 성장호르몬 분비 억제 및 예측키 손실 요인을 진단합니다.'
    },
    {
      step: 4,
      title: '두뇌·신경인지 핵심 관심 축 (5대 영역)',
      subtitle: '연령별 대뇌 피질 재조직화 및 신경가소성 자극 프로토콜을 설정합니다.'
    },
    {
      step: 5,
      title: '바이오 통계 연산 및 궤적 모델링',
      subtitle: 'LMS Z-Score, 24시간 호르몬 곡선 및 3단 성인 예측키를 산출 중입니다.'
    }
  ];

  // 3. Application State
  const state = {
    currentStep: 1,
    maxStep: 5,
    activeTab: 'tab-auxology',
    activePresetId: null,
    isPrescriptionIssued: false,
    adminClickCount: 0,
    adminTimer: null,
    profile: {
      gender: 'boy',
      ageYears: 10,
      ageMonths: 120,
      currentHeight: 137.0,
      currentWeight: 35.5,
      recentGrowth6m: 3.2,
      fatherHeight: 173.5,
      motherHeight: 160.5,
      region: 'US National (CDC/AAP Standard)',
      pubertyStage: 'phase_2',
      tannerPhase: 'phase_2',
      habits: ['late_sleep'],
      developmentConcerns: ['math_space'],
      cognitiveAxes: ['science_nature'],
      philosophy: 'science_coding',
      interest: 'space_science'
    }
  };

  // 4. Step Navigation Logic
  function goToStep(stepNumber) {
    if (stepNumber < 1) stepNumber = 1;
    if (stepNumber > state.maxStep) stepNumber = state.maxStep;

    state.currentStep = stepNumber;

    if (typeof document === 'undefined') return;

    // Toggle active step content
    for (let i = 1; i <= state.maxStep; i++) {
      const stepEl = document.getElementById(`step-content-${i}`);
      if (stepEl) {
        if (i === stepNumber) {
          stepEl.classList.add('active');
        } else {
          stepEl.classList.remove('active');
        }
      }
    }

    // Update Step Indicators
    const tagEl = document.getElementById('quiz-step-tag');
    if (tagEl) {
      const totalSteps = (typeof document !== 'undefined' && (document.getElementById('slide-step-6') || document.getElementById('step-content-6'))) ? 6 : state.maxStep;
      tagEl.textContent = `Step ${stepNumber} / ${totalSteps}`;
    }

    const isEn = typeof document !== 'undefined' && document.documentElement && (document.documentElement.lang === 'en' || (typeof document.documentElement.getAttribute === 'function' && document.documentElement.getAttribute('data-edition') === 'global-paid'));
    const info = STEP_INFO[stepNumber - 1];
    const titleEl = document.getElementById('quiz-step-title');
    if (titleEl && info) {
      if (isEn && global.TallerI18n && typeof global.TallerI18n.t === 'function') {
        titleEl.textContent = global.TallerI18n.t(`quiz.step${stepNumber}.title`) || info.title;
      } else {
        titleEl.textContent = info.title;
      }
    }

    const subtitleEl = document.getElementById('quiz-step-subtitle');
    if (subtitleEl && info) {
      if (isEn && global.TallerI18n && typeof global.TallerI18n.t === 'function') {
        subtitleEl.textContent = global.TallerI18n.t(`quiz.step${stepNumber}.subtitle`) || info.subtitle;
      } else {
        subtitleEl.textContent = info.subtitle;
      }
    }

    const percent = Math.round((stepNumber / state.maxStep) * 100);
    const progressTextEl = document.getElementById('quiz-progress-text');
    if (progressTextEl) progressTextEl.textContent = isEn ? `${percent}% Complete` : `${percent}% 완료`;

    const progressFillEl = document.getElementById('quiz-progress-fill');
    if (progressFillEl) progressFillEl.style.width = `${percent}%`;

    // Button visibility
    const prevBtn = document.getElementById('btn-prev-step');
    const nextBtn = document.getElementById('btn-next-step');
    const submitBtn = document.getElementById('btn-submit-quiz');

    if (prevBtn) {
      prevBtn.style.display = stepNumber === 1 ? 'none' : 'inline-flex';
    }
    if (nextBtn) {
      nextBtn.style.display = stepNumber === state.maxStep ? 'none' : 'inline-flex';
    }
    if (submitBtn) {
      submitBtn.style.display = stepNumber === state.maxStep ? 'inline-flex' : 'none';
    }
  }

  function validateStep(stepNumber) {
    if (typeof document === 'undefined') return true;
    if (state.profile && state.profile.preferredReportMode === 'learning') {
      return true;
    }

    const yearEl = document.getElementById('child-birth-year');
    const monthEl = document.getElementById('child-birth-month');
    const dayEl = document.getElementById('child-birth-day');
    const hasDobSelects = Boolean(yearEl && monthEl && dayEl);

    if (stepNumber === 1) {
      if (hasDobSelects) {
        // Full DOM environment: Step 1 validates ONLY Gender & DOB
        const boyEl = document.getElementById('gender-boy');
        const girlEl = document.getElementById('gender-girl');
        if (boyEl && girlEl && !boyEl.checked && !girlEl.checked) {
          const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
          alert(isEn ? 'Please select a gender.' : '성별을 선택해 주세요.');
          return false;
        }

        const y = (yearEl.value !== '' && yearEl.value !== undefined) ? parseInt(yearEl.value, 10) : 2016;
        const m = (monthEl.value !== '' && monthEl.value !== undefined) ? parseInt(monthEl.value, 10) : 10;
        const d = (dayEl.value !== '' && dayEl.value !== undefined) ? parseInt(dayEl.value, 10) : 15;
        if (isNaN(y) || y < 2005 || y > 2026 || isNaN(m) || m < 1 || m > 12 || isNaN(d) || d < 1 || d > 31) {
          const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
          alert(isEn ? 'Please enter a valid date of birth.' : '생년월일을 올바르게 선택해 주세요.');
          return false;
        }
        return true;
      }
      // If legacy mock test environment without DOB selects, fall through to height/weight check
    }

    if (stepNumber === 2 || (stepNumber === 1 && !hasDobSelects)) {
      const ageInput = document.getElementById('child-age-months');
      const heightInput = document.getElementById('child-height');
      const weightInput = document.getElementById('child-weight');
      const recentInput = document.getElementById('child-recent-gain');
      const fatherInput = document.getElementById('father-height');
      const motherInput = document.getElementById('mother-height');

      let age = ageInput ? parseFloat(ageInput.value) : state.profile.ageMonths;
      let height = heightInput ? parseFloat(heightInput.value) : state.profile.currentHeight;
      let weight = weightInput ? parseFloat(weightInput.value) : state.profile.currentWeight;
      let recent = recentInput ? parseFloat(recentInput.value) : state.profile.recentGrowth6m;
      let father = fatherInput ? parseFloat(fatherInput.value) : state.profile.fatherHeight;
      let mother = motherInput ? parseFloat(motherInput.value) : state.profile.motherHeight;

      const isImperial = typeof document !== 'undefined' && document.documentElement.lang === 'en' && typeof global.TallerI18n !== 'undefined' && global.TallerI18n.getUnitSystem() === 'imperial';
      if (isImperial) {
        height = height * 2.54;
        weight = weight / 2.20462262;
        recent = recent * 2.54;
        father = father * 2.54;
        mother = mother * 2.54;
      }

      if (isNaN(age) || age < 12 || age > 240) {
        alert('아이의 현재 월령을 12~240개월(1~20세) 사이로 입력해주세요.');
        if (ageInput) ageInput.focus();
        return false;
      }
      if (isNaN(height) || height < 45 || height > 230) {
        alert(isImperial ? 'Please enter a valid height (18 to 90 inches / 45 to 230 cm).' : '아이의 현재 키를 45~230cm 사이로 입력해주세요.');
        if (heightInput) heightInput.focus();
        return false;
      }
      if (isNaN(weight) || weight < 2 || weight > 160) {
        alert(isImperial ? 'Please enter a valid weight (5 to 350 lbs / 2 to 160 kg).' : '아이의 현재 몸무게를 2~160kg 사이로 입력해주세요.');
        if (weightInput) weightInput.focus();
        return false;
      }
      if (isNaN(recent) || recent < 0 || recent > 20) {
        alert(isImperial ? 'Please enter recent 6-month growth (0 to 8 inches).' : '최근 6개월 성장폭을 0 ~ 20cm 사이로 입력해 주세요.');
        if (recentInput) recentInput.focus();
        return false;
      }
      if (isNaN(father) || father < 100 || father > 240) {
        if (fatherInput) fatherInput.value = isImperial ? 68.3 : 173.5;
      }
      if (isNaN(mother) || mother < 100 || mother > 240) {
        if (motherInput) motherInput.value = isImperial ? 63.2 : 160.5;
      }
    } else if (stepNumber === 3) {
      const fatherInput = document.getElementById('father-height');
      const motherInput = document.getElementById('mother-height');
      if (fatherInput && motherInput) {
        let father = parseFloat(fatherInput.value);
        let mother = parseFloat(motherInput.value);
        const isImperial = typeof document !== 'undefined' && document.documentElement.lang === 'en' && typeof global.TallerI18n !== 'undefined' && global.TallerI18n.getUnitSystem() === 'imperial';
        if (isImperial) {
          father = father * 2.54;
          mother = mother * 2.54;
        }
        if (isNaN(father) || father < 100 || father > 240) {
          fatherInput.value = isImperial ? 68.3 : 173.5;
        }
        if (isNaN(mother) || mother < 100 || mother > 240) {
          motherInput.value = isImperial ? 63.2 : 160.5;
        }
      }
      return true;
    }
    return true;
  }

  function nextStep() {
    syncFormToState();
    if (!validateStep(state.currentStep)) return;
    goToStep(state.currentStep + 1);
  }

  function prevStep() {
    goToStep(state.currentStep - 1);
  }

  // 5. Form Synchronization Logic
  function syncFormToState() {
    if (typeof document === 'undefined') return state.profile;

    // Step 1
    const genderChecked = document.querySelector('input[name="child-gender"]:checked');
    if (genderChecked) state.profile.gender = genderChecked.value;

    const ageInput = document.getElementById('child-age-months');
    if (ageInput && ageInput.value) state.profile.ageMonths = parseInt(ageInput.value, 10);

    const isImperial = typeof document !== 'undefined' && document.documentElement.lang === 'en' && typeof global.TallerI18n !== 'undefined' && global.TallerI18n.getUnitSystem() === 'imperial';

    const heightInput = document.getElementById('child-height');
    if (heightInput && heightInput.value) {
      const v = parseFloat(heightInput.value);
      state.profile.currentHeight = isImperial ? Math.round(v * 2.54 * 10) / 10 : v;
    }

    const weightInput = document.getElementById('child-weight');
    if (weightInput && weightInput.value) {
      const v = parseFloat(weightInput.value);
      state.profile.currentWeight = isImperial ? Math.round((v / 2.20462262) * 10) / 10 : v;
    }

    const fatherInput = document.getElementById('father-height');
    if (fatherInput && fatherInput.value) {
      const v = parseFloat(fatherInput.value);
      state.profile.fatherHeight = isImperial ? Math.round(v * 2.54 * 10) / 10 : v;
    }

    const motherInput = document.getElementById('mother-height');
    if (motherInput && motherInput.value) {
      const v = parseFloat(motherInput.value);
      state.profile.motherHeight = isImperial ? Math.round(v * 2.54 * 10) / 10 : v;
    }

    const recentInput = document.getElementById('child-recent-gain');
    if (recentInput && recentInput.value) {
      const v = parseFloat(recentInput.value);
      state.profile.recentGrowth6m = isImperial ? Math.round(v * 2.54 * 10) / 10 : v;
    }

    const regionSelect = document.getElementById('user-region');
    if (regionSelect) state.profile.region = regionSelect.value;

    const ethnicitySelect = document.getElementById('child-ethnicity');
    if (ethnicitySelect && ethnicitySelect.value) {
      state.profile.ethnicity = ethnicitySelect.value;
    }

    const formEl = document.getElementById('diagnosis-form');
    if (formEl && formEl.className && formEl.className.includes('wizard-mode-learning')) {
      state.profile.preferredReportMode = 'learning';
    } else if (typeof window !== 'undefined' && (window.__KIDSFIT_PREFERRED_REPORT_MODE === 'learning' || window.__KIDSFIT_PREFERRED_REPORT_MODE === 'growth')) {
      state.profile.preferredReportMode = window.__KIDSFIT_PREFERRED_REPORT_MODE;
    } else if (!state.profile.preferredReportMode) {
      state.profile.preferredReportMode = 'growth';
    }

    // Step 2: Tanner Phase
    const tannerChecked = document.querySelector('input[name="tanner-phase"]:checked') || document.querySelector('input[name="puberty-stage"]:checked');
    if (tannerChecked) {
      state.profile.tannerPhase = tannerChecked.value;
      state.profile.pubertyStage = tannerChecked.value;
    }

    // Step 3: Habits
    const habitsChecked = document.querySelectorAll('input[name="growth-habits"]:checked');
    state.profile.habits = Array.from(habitsChecked).map(el => el.value);

    // Step 4: Cognitive Axes
    const cogChecked = document.querySelectorAll('input[name="cognitive-axes"]:checked');
    if (cogChecked.length > 0) {
      state.profile.cognitiveAxes = Array.from(cogChecked).map(el => el.value);
    }

    const kdstChecked = document.querySelectorAll('input[name="kdst-concerns"]:checked');
    if (kdstChecked.length > 0) {
      state.profile.developmentConcerns = Array.from(kdstChecked).map(el => el.value);
    }

    return state.profile;
  }

  function syncStateToForm(profile) {
    if (!profile) profile = state.profile;
    if (typeof document === 'undefined') return;

    // Gender
    const genderRadio = document.querySelector(`input[name="child-gender"][value="${profile.gender}"]`);
    if (genderRadio) genderRadio.checked = true;

    // Numeric inputs (Respect user-edited Imperial ft/in companion inputs on initial load)
    const isImperial = typeof document !== 'undefined' && document.documentElement.lang === 'en' && typeof global.TallerI18n !== 'undefined' && global.TallerI18n.getUnitSystem() === 'imperial';
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && !(el.dataset && el.dataset.userEdited === 'true')) {
        el.value = val;
      }
    };
    setVal('child-age-months', profile.ageMonths);
    setVal('child-age-slider', profile.ageYears || Math.round(profile.ageMonths / 12));
    setVal('child-height', isImperial ? Number((profile.currentHeight / 2.54).toFixed(1)) : profile.currentHeight);
    setVal('child-weight', isImperial ? Number((profile.currentWeight * 2.20462262).toFixed(1)) : profile.currentWeight);
    setVal('child-recent-gain', isImperial ? Number(((profile.recentGrowth6m || 3.2) / 2.54).toFixed(1)) : (profile.recentGrowth6m || 3.2));
    setVal('father-height', isImperial ? Number((profile.fatherHeight / 2.54).toFixed(1)) : profile.fatherHeight);
    setVal('mother-height', isImperial ? Number((profile.motherHeight / 2.54).toFixed(1)) : profile.motherHeight);
    if (isImperial && global.TallerOnboardingWizard && typeof global.TallerOnboardingWizard.syncCompanionInputs === 'function') {
      const chH = document.getElementById('child-height');
      if (!chH || !(chH.dataset && chH.dataset.userEdited === 'true')) {
        global.TallerOnboardingWizard.syncCompanionInputs();
      }
    }

    // Region
    const regionSelect = document.getElementById('user-region');
    if (regionSelect && profile.region) regionSelect.value = profile.region;

    // Tanner Phase
    const phaseValue = profile.tannerPhase || profile.pubertyStage || 'phase_2';
    const phaseRadio = document.querySelector(`input[name="tanner-phase"][value="${phaseValue}"]`) ||
                       document.querySelector(`input[name="puberty-stage"][value="${phaseValue}"]`);
    if (phaseRadio) phaseRadio.checked = true;

    // Habits (multi-select)
    const habitInputs = document.querySelectorAll('input[name="growth-habits"]');
    habitInputs.forEach(input => {
      input.checked = profile.habits.includes(input.value);
    });

    // Cognitive Axes (multi-select)
    const cogInputs = document.querySelectorAll('input[name="cognitive-axes"]');
    cogInputs.forEach(input => {
      input.checked = (profile.cognitiveAxes || []).includes(input.value);
    });
  }

  // 6. Preset Application
  function applyPreset(presetId) {
    const preset = PRESETS[presetId];
    if (!preset) return false;

    const preservedMode = (typeof window !== 'undefined' && window.__KIDSFIT_PREFERRED_REPORT_MODE) ||
      (state.profile && state.profile.preferredReportMode) ||
      'growth';
    state.activePresetId = presetId;
    state.profile = Object.assign({}, JSON.parse(JSON.stringify(preset)), {
      preferredReportMode: preservedMode
    });

    if (typeof document !== 'undefined') {
      // Highlight preset card
      document.querySelectorAll('.preset-card').forEach(card => {
        if (card.getAttribute('data-preset-id') === presetId) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });

      syncStateToForm(state.profile);
    }

    // Trigger instant prescription transition with preset
    issuePrescription({ presetId });
    return true;
  }

  // 7. Interactive Prescription Analysis Transition
  function issuePrescription(options = {}) {
    syncFormToState();

    if (typeof document === 'undefined') {
      state.isPrescriptionIssued = true;
      return;
    }

    const overlay = document.getElementById('analysis-overlay');
    const titleEl = document.getElementById('analysis-title');
    const descEl = document.getElementById('analysis-desc');
    const fillEl = document.getElementById('analysis-bar-fill');
    const container = document.getElementById('prescription-container');
    const headerTitle = document.getElementById('rx-header-title');
    const avatarEl = document.getElementById('rx-avatar');

    const isImmediate = options.immediate || false;

    if (overlay && !isImmediate) {
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');

      const isEnMsg = typeof document !== 'undefined' && document.documentElement && (document.documentElement.lang === 'en' || (typeof document.documentElement.getAttribute === 'function' && document.documentElement.getAttribute('data-edition') === 'global-paid'));
      const messages = isEnMsg ? [
        {
          pct: 28,
          title: 'Cross-Referencing US CDC 2000 & WHO Growth Percentiles...',
          desc: `Computing exact LMS Z-scores for ${state.profile.ageMonths} mos (${state.profile.gender === 'boy' ? 'Male' : 'Female'}).`
        },
        {
          pct: 68,
          title: 'Analyzing ASQ-3 / 5-Axis Neuro-Cognitive & Auxology Matrix...',
          desc: 'Synthesizing personalized growth-plate and cognitive development protocols.'
        },
        {
          pct: 100,
          title: 'Your Child\'s Personalized Clinical Report is Ready!',
          desc: '3-Tier Adult Height Trajectory, Bio-Nutrition & Daily Action Plan prepared.'
        }
      ] : [
        {
          pct: 28,
          title: '소아성장도표(KDCA 2017) 표준 백분위 대조 중...',
          desc: `${state.profile.ageMonths}개월 ${state.profile.gender === 'boy' ? '남아' : '여아'} 기준 표준 키·몸무게 Z-Score를 산출하고 있습니다.`
        },
        {
          pct: 68,
          title: 'K-DST 6대 발달 영역 & 몬테소리/은물 판정 분석 중...',
          desc: '선택하신 발달 고민과 월령 특성을 고려하여 최적의 교구 영역을 분석하고 있습니다.'
        },
        {
          pct: 100,
          title: '우리 아이 맞춤형 종합 처방전 생성 완료!',
          desc: '신체 성장 곡선, 족집게 발달 교구, 주말 핀셋 나들이 코스가 준비되었습니다.'
        }
      ];

      let step = 0;
      function nextAnalysisStep() {
        if (step < messages.length) {
          const m = messages[step];
          if (titleEl) titleEl.textContent = m.title;
          if (descEl) descEl.textContent = m.desc;
          if (fillEl) fillEl.style.width = `${m.pct}%`;
          step++;
          setTimeout(nextAnalysisStep, 250);
        } else {
          finalizePrescription();
        }
      }
      nextAnalysisStep();
    } else {
      finalizePrescription();
    }

    function finalizePrescription() {
      if (overlay) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
      }

      state.isPrescriptionIssued = true;

      const dashboard = document.getElementById('results-dashboard') || container;
      if (dashboard) {
        dashboard.classList.remove('hidden');
        dashboard.style.display = 'block';
        if (headerTitle) {
          const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
          headerTitle.textContent = isEn
            ? `Custom Growth & Learning Guidebook (${state.profile.ageMonths} mos · ${state.profile.gender === 'boy' ? 'Male' : 'Female'})`
            : `만 ${state.profile.ageMonths}개월 ${state.profile.gender === 'boy' ? '남아' : '여아'} 맞춤 처방전`;
        }
        if (avatarEl) {
          avatarEl.textContent = state.profile.gender === 'boy' ? '👦' : '👧';
        }
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
          window.scrollTo(0, 0);
        }
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      }

      const quizSection = document.getElementById('quiz-section');
      if (quizSection) quizSection.style.display = 'none';
      const heroSection = document.getElementById('hero-section');
      if (heroSection) heroSection.style.display = 'none';
      const presetsBar = document.getElementById('quick-presets-bar');
      if (presetsBar) presetsBar.style.display = 'none';

      // Render Milestone 3 and Milestone 4 Reports & Monetization
      renderPrescriptionResults();

      // Dispatch Custom Event for Milestone 3 domain engine and Milestone 4 monetization listeners
      if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') {
        const event = new CustomEvent('kidsfit:prescription-issued', {
          detail: { profile: state.profile }
        });
        window.dispatchEvent(event);
      }
    }
  }

  // 7-1. Render Results for Tab 1, Tab 2, Tab 3 & Monetization
  function renderPrescriptionResults(profile) {
    if (profile && typeof profile === 'object') {
      Object.assign(state.profile, profile);
      state.isPrescriptionIssued = true;
      if (typeof document !== 'undefined') {
        const container = document.getElementById('results-dashboard') || document.getElementById('prescription-container');
        if (container) {
          container.classList.remove('hidden');
          container.style.display = 'block';
          const headerTitle = document.getElementById('rx-header-title');
          const avatarEl = document.getElementById('rx-avatar');
          if (headerTitle) {
            const isEn = document.documentElement && (document.documentElement.lang === 'en' || (typeof document.documentElement.getAttribute === 'function' && document.documentElement.getAttribute('data-edition') === 'global-paid'));
            headerTitle.textContent = isEn
              ? `Custom Growth & Learning Master Report (${state.profile.ageMonths} mos · ${state.profile.gender === 'boy' ? 'Male' : 'Female'})`
              : `만 ${state.profile.ageMonths}개월 ${state.profile.gender === 'boy' ? '남아' : '여아'} 맞춤 처방전`;
          }
          if (avatarEl) {
            avatarEl.textContent = state.profile.gender === 'boy' ? '👦' : '👧';
          }
          if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
            window.scrollTo(0, 0);
          }
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
        }
        const quizSection = document.getElementById('quiz-section');
        if (quizSection) quizSection.style.display = 'none';
        const heroSection = document.getElementById('hero-section');
        if (heroSection) heroSection.style.display = 'none';
        const presetsBar = document.getElementById('quick-presets-bar');
        if (presetsBar) presetsBar.style.display = 'none';
      }
    }

    if (!GrowthEngine && global.KidsFitGrowthEngine) GrowthEngine = global.KidsFitGrowthEngine;
    if (!EndocrinologyEngine && global.KidsFitEndocrinologyEngine) EndocrinologyEngine = global.KidsFitEndocrinologyEngine;
    if (!NutritionEngine && global.KidsFitNutritionEngine) NutritionEngine = global.KidsFitNutritionEngine;
    if (!BiomechanicsStudio && global.KidsFitBiomechanicsStudio) BiomechanicsStudio = global.KidsFitBiomechanicsStudio;
    if (!NeuroCognitiveMatrix && global.KidsFitNeuroCognitiveMatrix) NeuroCognitiveMatrix = global.KidsFitNeuroCognitiveMatrix;
    if (!GrowthTracker && global.KidsFitGrowthTracker) GrowthTracker = global.KidsFitGrowthTracker;
    if (!DevelopmentEngine && global.KidsFitDevelopmentEngine) DevelopmentEngine = global.KidsFitDevelopmentEngine;
    if (!WeekendCurator && global.KidsFitWeekendCurator) WeekendCurator = global.KidsFitWeekendCurator;
    if (!Monetization && global.KidsFitMonetization) Monetization = global.KidsFitMonetization;
    if (!AdminOsmu && global.KidsFitAdminOsmu) AdminOsmu = global.KidsFitAdminOsmu;

    if (typeof document === 'undefined') return;

    const resolvedReportMode = (profile && profile.preferredReportMode)
      ? profile.preferredReportMode
      : ((typeof window !== 'undefined' && window.__KIDSFIT_PREFERRED_REPORT_MODE)
        ? window.__KIDSFIT_PREFERRED_REPORT_MODE
        : ((state.profile && state.profile.preferredReportMode) || 'growth'));
    if (state.profile) {
      state.profile.preferredReportMode = resolvedReportMode;
    }
    if (typeof window !== 'undefined') {
      window.__KIDSFIT_PREFERRED_REPORT_MODE = resolvedReportMode;
    }
    if (typeof global !== 'undefined') {
      global.__KIDSFIT_PREFERRED_REPORT_MODE = resolvedReportMode;
    }
    const headerTitleEl = document.getElementById('rx-header-title');
    const headerSubEl = document.getElementById('rx-header-subtitle');
    const isLearningModeActive = (resolvedReportMode === 'learning');
    if (headerTitleEl) {
      const isEn = document.documentElement.lang === 'en';
      headerTitleEl.textContent = isEn
        ? (isLearningModeActive
          ? `Brain & Learning Disposition Master Report (${state.profile.ageMonths} mos · ${state.profile.gender === 'boy' ? 'Male' : 'Female'})`
          : `Physical Growth Master Report (${state.profile.ageMonths} mos · ${state.profile.gender === 'boy' ? 'Male' : 'Female'})`)
        : (isLearningModeActive
          ? `만 ${Math.max(1, Math.floor((state.profile.ageMonths || 120) / 12))}세(${state.profile.ageMonths}개월) ${state.profile.gender === 'boy' ? '남아' : '여아'} 두뇌·학습 성향 & 진로 맞춤 보고서`
          : `만 ${Math.max(1, Math.floor((state.profile.ageMonths || 120) / 12))}세(${state.profile.ageMonths}개월) ${state.profile.gender === 'boy' ? '남아' : '여아'} 신체 성장 맞춤 보고서`);
    }
    if (headerSubEl) {
      const isEn = document.documentElement && (document.documentElement.lang === 'en' || (typeof document.documentElement.getAttribute === 'function' && document.documentElement.getAttribute('data-edition') === 'global-paid'));
      headerSubEl.textContent = isEn
        ? (isLearningModeActive
          ? '6-Step Clinical Scan + Phenotype Synthesis · US CDC & 3,714 Neuro-Cognitive Studies Analyzed'
          : '6-Step Clinical Scan + Phenotype Synthesis · US CDC 2000 & 3,722 Pediatric Endocrine Studies Analyzed')
        : (isLearningModeActive
          ? '진단 6단계 + 우리 아이 상세 특징 합산 · K-DST & 뇌인지 학습 논문 3,722편 정밀 분석 완료'
          : '진단 6단계 + 우리 아이 상세 특징 합산 · 질병관리청(KDCA 2017) & 소아내분비 논문 3,722편 정밀 분석 완료');
    }

    const affConfig = getAffiliateConfig();

    // Render Tab 1: Core 1 Auxology & Growth Trajectories
    const growthCard = document.getElementById('growth-report-card');
    if (growthCard && GrowthEngine && GrowthEngine.renderTab1Report) {
      growthCard.innerHTML = GrowthEngine.renderTab1Report(state.profile);
    }

    // Render Tab 2: Core 2 Endocrinology & Bio-Nutrition
    const endoCard = document.getElementById('endocrinology-report-card');
    if (endoCard) {
      if (NutritionEngine && NutritionEngine.renderTab2Report) {
        endoCard.innerHTML = NutritionEngine.renderTab2Report(state.profile, affConfig);
      } else if (EndocrinologyEngine && EndocrinologyEngine.renderEndocrinologySection) {
        endoCard.innerHTML = `
          <div id="core-2-container" class="core-module-container">
            ${EndocrinologyEngine.renderEndocrinologySection(state.profile)}
            ${NutritionEngine && NutritionEngine.renderNutritionSection ? NutritionEngine.renderNutritionSection(state.profile, affConfig) : ''}
          </div>
        `;
      }
      attachHormoneSliderListeners();
    }

    // Render Core 3: Biomechanics & Posture Studio
    const biomechanicsCard = document.getElementById('core-3-container') || document.getElementById('biomechanics-report-card');
    if (biomechanicsCard && BiomechanicsStudio && BiomechanicsStudio.renderBiomechanicsSection) {
      biomechanicsCard.innerHTML = BiomechanicsStudio.renderBiomechanicsSection(state.profile, affConfig);
      if (typeof BiomechanicsStudio.initRoutineTimers === 'function') {
        BiomechanicsStudio.initRoutineTimers();
      }
    }

    // Render Core 4: Neuro-Cognitive Matrix
    const neuroCard = document.getElementById('core-4-container') || document.getElementById('neuro-report-card');
    if (neuroCard && NeuroCognitiveMatrix && NeuroCognitiveMatrix.renderNeuroSection) {
      neuroCard.innerHTML = NeuroCognitiveMatrix.renderNeuroSection(state.profile, affConfig);
    }

    // Render Core 5: 90-Day Tracker & Hospital Clinic A4 PDF
    const trackerCard = document.getElementById('core-5-container') || document.getElementById('tracker-report-card');
    if (trackerCard && GrowthTracker && GrowthTracker.renderTrackerSection) {
      trackerCard.innerHTML = GrowthTracker.renderTrackerSection(state.profile);
      if (typeof GrowthTracker.initTrackerControls === 'function') {
        GrowthTracker.initTrackerControls(state.profile);
      }
    }
    if (GrowthTracker && typeof GrowthTracker.preparePrintReport === 'function') {
      GrowthTracker.preparePrintReport(state.profile);
    }

    // Render Tab 2 (Legacy Dev Card if present)
    const devCard = document.getElementById('dev-report-card');
    if (devCard && DevelopmentEngine) {
      devCard.innerHTML = DevelopmentEngine.renderTab2Report(state.profile, affConfig);
    }

    // Render Tab 3
    const outingCard = document.getElementById('outing-report-card');
    if (outingCard && WeekendCurator) {
      outingCard.innerHTML = WeekendCurator.renderTab3Report(state.profile, affConfig);
    }

    // Render Monetization Appendix
    const monetizationContainer = document.getElementById('monetization-appendix-container');
    if (monetizationContainer && Monetization) {
      monetizationContainer.innerHTML = Monetization.renderAllMonetizationLayers(state.profile, affConfig);
      
      const shareBtn = document.getElementById('btn-share-prescription');
      if (shareBtn) {
        shareBtn.addEventListener('click', handleSharePrescription);
      }
    }

    // Render Master Briefing Card & Papers Matching
    const masterCard = document.getElementById('master-briefing-card');
    if (masterCard) {
      if (!MasterBriefingEngine && (global.MasterBriefingEngine || global.KidsFitMasterBriefing || global.TallerMasterBriefing)) {
        MasterBriefingEngine = global.MasterBriefingEngine || global.KidsFitMasterBriefing || global.TallerMasterBriefing;
      }
      if (MasterBriefingEngine && (typeof MasterBriefingEngine.renderMasterBriefingCard === 'function' || typeof MasterBriefingEngine.render === 'function')) {
        const renderFn = MasterBriefingEngine.renderMasterBriefingCard || MasterBriefingEngine.render;
        masterCard.innerHTML = renderFn(state.profile);
        if (typeof MasterBriefingEngine.attachRetestListener === 'function') {
          MasterBriefingEngine.attachRetestListener();
        } else if (typeof MasterBriefingEngine.attachRetestHandler === 'function') {
          MasterBriefingEngine.attachRetestHandler();
        }
        if (typeof MasterBriefingEngine.switchActiveReport === 'function') {
          const activeMode = (state.profile && state.profile.preferredReportMode === 'learning') ||
            (typeof window !== 'undefined' && window.__KIDSFIT_PREFERRED_REPORT_MODE === 'learning')
            ? 'learning'
            : 'growth';
          MasterBriefingEngine.switchActiveReport(activeMode);
        }
      }
      if (global.KidsFitGlobalPaywall && typeof global.KidsFitGlobalPaywall.isGlobalPaidEdition === 'function' && global.KidsFitGlobalPaywall.isGlobalPaidEdition()) {
        global.KidsFitGlobalPaywall.transformGlobalReportAndApplyPaywall();
      }
      // Bind interactive 24h hormone sliders (Chapter 3) & biomechanics routine timers (Chapter 4) inside the One-Page 7-Chapter Report
      attachHormoneSliderListeners();
      if (BiomechanicsStudio && typeof BiomechanicsStudio.initRoutineTimers === 'function') {
        BiomechanicsStudio.initRoutineTimers();
      }
      if (typeof window !== 'undefined' && window.location && window.location.hash) {
        try {
          const targetEl = document.querySelector(window.location.hash);
          if (targetEl && typeof targetEl.scrollIntoView === 'function') {
            setTimeout(() => targetEl.scrollIntoView({ behavior: 'instant', block: 'start' }), 80);
          }
        } catch (_) {}
      } else {
        const forceTop = () => {
          try {
            if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
          } catch (_) {}
        };
        forceTop();
        if (typeof setTimeout === 'function') {
          setTimeout(forceTop, 10);
          setTimeout(forceTop, 80);
        }
      }
    }
  }

  // 7-1B. Interactive 24h Hormone Slider Listeners
  function attachHormoneSliderListeners() {
    if (typeof document === 'undefined') return;
    const bedtimeSlider = document.getElementById('hormone-bedtime-slider');
    const mealSlider = document.getElementById('hormone-meal-slider');
    if (!bedtimeSlider || !mealSlider) return;

    const bedtimeDisplay = document.getElementById('hormone-bedtime-display');
    const mealDisplay = document.getElementById('hormone-meal-display');
    const gapDisplay = document.getElementById('hormone-gap-display');
    const delayPenaltyEl = document.getElementById('hormone-delay-penalty');
    const carbPenaltyEl = document.getElementById('hormone-carb-penalty');
    const svgContainer = document.getElementById('hormone-svg-container');
    const lossBadge = document.getElementById('hormone-loss-badge');
    const adviceText = document.getElementById('hormone-advice-text');
    const adviceCard = document.getElementById('hormone-advice-card');

    function updateHormoneView() {
      const bMin = Number(bedtimeSlider.value) || 1320;
      const mMin = Number(mealSlider.value) || 1140;

      if (!EndocrinologyEngine) return;

      const sim = EndocrinologyEngine.simulateHormoneCurve(bMin, mMin);

      const isEnH = typeof document !== 'undefined' && document.documentElement && (document.documentElement.lang === 'en' || (typeof document.documentElement.getAttribute === 'function' && document.documentElement.getAttribute('data-edition') === 'global-paid'));
      if (bedtimeDisplay) bedtimeDisplay.textContent = sim.bedtimeStr;
      if (mealDisplay) mealDisplay.textContent = sim.mealStr;
      if (gapDisplay) {
        gapDisplay.textContent = isEnH ? `${sim.gapHours}h` : `${sim.gapHours}시간`;
        gapDisplay.style.color = '#1D4ED8';
      }
      if (delayPenaltyEl) delayPenaltyEl.textContent = `-${sim.delayPenalty}%`;
      if (carbPenaltyEl) carbPenaltyEl.textContent = `-${sim.carbPenalty}%`;

      if (lossBadge) {
        const badgeColor = '#1D4ED8';
        const badgeBg = '#EFF6FF';
        lossBadge.style.border = `1.5px solid ${badgeColor}`;
        lossBadge.style.background = badgeBg;
        lossBadge.innerHTML = isEnH ? `
          <span style="font-size: 0.75rem; font-weight: 700; color: #334155; display: block;">GH Secretion Loss Rate</span>
          <span style="font-size: 1.25rem; font-weight: 800; color: ${badgeColor};">
            -${sim.ghLossPercent}% <span style="font-size: 0.75rem; font-weight: 600;">(Max -52% suppression)</span>
          </span>
        ` : `
          <span style="font-size: 0.75rem; font-weight: 700; color: #334155; display: block;">성장호르몬 분비 손실률</span>
          <span style="font-size: 1.25rem; font-weight: 800; color: ${badgeColor};">
            -${sim.ghLossPercent}% <span style="font-size: 0.75rem; font-weight: 600;">(최대 -52% 억제)</span>
          </span>
        `;
      }

      if (svgContainer) {
        svgContainer.innerHTML = EndocrinologyEngine.renderHormoneSvg(bMin, mMin);
      }

      if (adviceText) {
        adviceText.innerHTML = isEnH
          ? (sim.ghLossPercent >= 40.0
              ? `Urgent Alert (-${sim.ghLossPercent}% loss): Finish dinner before 19:00 and start dark-room sleep before 22:00.`
              : (sim.ghLossPercent > 0.0
                  ? `Partial Suppression (-${sim.ghLossPercent}%): Reducing bedtime delay (-${sim.delayPenalty}%) and late-night carbs (-${sim.carbPenalty}%) restores peak GH pulses.`
                  : 'Optimal 100% GH Pulsatile State: Bedtime before 22:00 & 3-hour pre-sleep fasting achieved.'))
          : sim.clinicalAdvice;
      }
      if (adviceCard) {
        adviceCard.style.borderLeft = '4px solid #1D4ED8';
      }
    }

    if (typeof bedtimeSlider.removeEventListener === 'function') {
      bedtimeSlider.removeEventListener('input', updateHormoneView);
    }
    if (typeof bedtimeSlider.addEventListener === 'function') {
      bedtimeSlider.addEventListener('input', updateHormoneView);
    }
    if (typeof mealSlider.removeEventListener === 'function') {
      mealSlider.removeEventListener('input', updateHormoneView);
    }
    if (typeof mealSlider.addEventListener === 'function') {
      mealSlider.addEventListener('input', updateHormoneView);
    }
  }

  // 7-2. Share Prescription Handler
  function handleSharePrescription() {
    const lms = GrowthEngine ? GrowthEngine.getLmsForMonth(state.profile.gender, state.profile.ageMonths) : { L: 1, M: 100, S: 0.04 };
    const kdca = GrowthEngine ? GrowthEngine.calculateKdcaPercentile(state.profile.currentHeight, lms.L, lms.M, lms.S) : { topPercent: 30 };
    const mph = GrowthEngine ? GrowthEngine.calculateMph(state.profile.fatherHeight, state.profile.motherHeight, state.profile.gender) : 170;
    const pred = GrowthEngine ? GrowthEngine.calculateHeightPrediction(mph, state.profile.habits, state.profile.pubertyStage) : { potentialHeight: 178 };
    const outing = WeekendCurator ? WeekendCurator.getWeekendOuting(state.profile.region, state.profile.interest) : { destination: '어린이박물관' };

    const isEnShare = typeof document !== 'undefined' && document.documentElement && (document.documentElement.lang === 'en' || (typeof document.documentElement.getAttribute === 'function' && document.documentElement.getAttribute('data-edition') === 'global-paid'));
    const childGender = state.profile.gender === 'boy' ? (isEnShare ? 'Boy' : '남아') : (isEnShare ? 'Girl' : '여아');
    const text = isEnShare
      ? `✨ KidsFit Clinical Growth Report (${state.profile.ageMonths} mos ${childGender}): Top ${kdca.topPercent}% on US CDC Growth Charts! With clinical optimization, projected adult height reaches ${pred.potentialHeight} cm (${Math.floor((pred.potentialHeight / 2.54) / 12)}'${Math.round((pred.potentialHeight / 2.54) % 12)}")! 👉 https://kisfitglobal.com`
      : `💌 여보! 방금 우리 아이(만 ${state.profile.ageMonths}개월 ${childGender}) 질병관리청 성장도표 진단해봤는데, 또래 상위 ${kdca.topPercent}%래!\n골든타임 관리하면 최대 ${pred.potentialHeight}cm까지 클 수 있대!\n이번 주말엔 [${outing.destination}] 같이 가보자 👉 https://kidsfit.co.kr`;

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert(isEnShare ? 'Your child\'s clinical report summary link has been copied to the clipboard!' : '카톡 공유용 맞춤 처방전 메시지가 클립보드에 복사되었습니다!\n카카오톡 대화창에 붙여넣기(Ctrl+V) 해주세요.');
      }).catch(() => {
        alert(text);
      });
    } else {
      alert(text);
    }
  }

  // 8. Capsule Tab Switching
  function switchTab(tabId) {
    state.activeTab = tabId;

    if (typeof document === 'undefined') return;

    // Tabs
    const tabs = document.querySelectorAll('.capsule-tab');
    // Update tabs
    tabs.forEach(tab => {
      const target = tab.getAttribute('data-tab');
      const isMatch = target === tabId ||
        (target === 'tab-growth' && (tabId === 'tab-auxology' || tabId === 'tab-growth')) ||
        (target === 'tab-auxology' && (tabId === 'tab-growth' || tabId === 'tab-auxology')) ||
        (target === 'tab-development' && (tabId === 'tab-neuro' || tabId === 'tab-development')) ||
        (target === 'tab-neuro' && (tabId === 'tab-development' || tabId === 'tab-neuro'));
      if (isMatch) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    // Panes - Strict Single Active Tab View
    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(pane => {
      const paneId = pane.getAttribute('id');
      const cleanId = tabId.replace('tab-', '');
      const isMatch = paneId === `tab-pane-${cleanId}` ||
        (paneId === 'tab-pane-growth' && (cleanId === 'auxology' || cleanId === 'growth')) ||
        (paneId === 'tab-pane-auxology' && (cleanId === 'growth' || cleanId === 'auxology')) ||
        (paneId === 'tab-pane-development' && (cleanId === 'neuro' || cleanId === 'development')) ||
        (paneId === 'tab-pane-neuro' && (cleanId === 'development' || cleanId === 'neuro'));
      if (isMatch) {
        pane.classList.add('active');
        pane.classList.remove('hidden');
        pane.style.display = 'block';
      } else {
        pane.classList.remove('active');
        pane.classList.add('hidden');
        pane.style.display = 'none';
      }
    });

    if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') {
      const event = new CustomEvent('kidsfit:tab-changed', {
        detail: { tabId }
      });
      window.dispatchEvent(event);
    }
  }

  // 9. Secret Admin Studio Logic (9-Platform Integrated)
  const DEFAULT_AFFILIATE_CONFIG = {
    chipsEnabled: true,
    coupang: 'AF7865143',
    linkprice: 'A100708867',
    iherb: 'IPZ1547',
    amazon: 'kidfit-20',
    tenping: '010-****-2370',
    tenpingUrl: 'https://iryan.kr/t8g8qxgcc2',
    adpickAffId: '4d31d3',
    adpickApiUrl: 'https://adpick.co.kr/apis/offers.php?affid=4d31d3&os=&adtype=&category=notgame&order=rand',
    naverBrandConnectHealth: 'https://naver.me/5Jq9LnLT',
    naverBrandConnectTour: 'https://naver.me/xJcOADhA',
    myrealtripKey: '',
    myrealtripMylinkId: '6226316',
    klookAid: '140161',
    klookAdId: '1514603',
    cafeUrl: 'https://cafe.naver.com/kidsfitgrowth',
    blogUrl: 'https://blog.naver.com/kidsfit_studio'
  };

  let inMemoryAffiliateConfig = null;

  function getAffiliateConfig() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem('kidsfit_affiliate_config');
        if (raw) {
          return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, JSON.parse(raw));
        }
      } catch (e) {
        // fallback
      }
    }
    if (inMemoryAffiliateConfig) {
      return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, inMemoryAffiliateConfig);
    }
    return Object.assign({}, DEFAULT_AFFILIATE_CONFIG);
  }

  function saveAffiliateConfig(config) {
    inMemoryAffiliateConfig = Object.assign({}, config);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('kidsfit_affiliate_config', JSON.stringify(config));
      } catch (e) {
        console.error('Failed to save affiliate config to localStorage', e);
      }
    }
  }

  let currentOsmuScenario = 'scenario-1';
  function renderAdminOsmuStudio() {
    if (!AdminOsmu && global.KidsFitAdminOsmu) AdminOsmu = global.KidsFitAdminOsmu;
    if (typeof document === 'undefined') return;

    const osmuContainer = document.getElementById('admin-osmu-container');
    if (osmuContainer && AdminOsmu) {
      osmuContainer.innerHTML = AdminOsmu.renderOsmuStudioUI(currentOsmuScenario, getAffiliateConfig());

      const scenarioSelect = document.getElementById('osmu-scenario-select');
      if (scenarioSelect) {
        scenarioSelect.addEventListener('change', (e) => {
          currentOsmuScenario = e.target.value;
          renderAdminOsmuStudio();
        });
      }

      const channelTabs = osmuContainer.querySelectorAll('.osmu-tab-btn');
      channelTabs.forEach(btn => {
        btn.addEventListener('click', () => {
          const channel = btn.getAttribute('data-channel');
          channelTabs.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const panels = osmuContainer.querySelectorAll('.osmu-panel');
          panels.forEach(p => p.style.display = 'none');
          const targetPanel = document.getElementById(`osmu-panel-${channel}`);
          if (targetPanel) targetPanel.style.display = 'block';
        });
      });

      const copyBtns = osmuContainer.querySelectorAll('.btn-copy-osmu');
      copyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          const targetTextarea = document.getElementById(targetId);
          if (targetTextarea && typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(targetTextarea.value).then(() => {
              const origText = btn.textContent;
              btn.textContent = '✓ 복사완료!';
              btn.style.background = '#059669';
              setTimeout(() => {
                btn.textContent = origText;
                btn.style.background = '';
              }, 2000);
            });
          }
        });
      });
    }
  }

  function openAdminModal() {
    if (typeof document === 'undefined') return;
    let modal = document.getElementById('admin-modal');
    if (!modal && AdminStudio && typeof AdminStudio.openAdminModal === 'function' && document.body && typeof document.createElement === 'function') {
      AdminStudio.openAdminModal();
      modal = document.getElementById('admin-modal');
    }
    if (modal) {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');

      const cfg = getAffiliateConfig();
      const coupangEl = document.getElementById('cfg-coupang');
      const linkpriceEl = document.getElementById('cfg-linkprice');
      const iherbEl = document.getElementById('cfg-iherb');
      const amazonEl = document.getElementById('cfg-amazon');
      const tenpingEl = document.getElementById('cfg-tenping');
      const chipsToggleEl = document.getElementById('cfg-chips-toggle');
      const cafeEl = document.getElementById('cfg-cafe');
      const blogEl = document.getElementById('cfg-blog');

      if (coupangEl) coupangEl.value = cfg.coupang || DEFAULT_AFFILIATE_CONFIG.coupang;
      if (linkpriceEl) linkpriceEl.value = cfg.linkprice || DEFAULT_AFFILIATE_CONFIG.linkprice;
      if (iherbEl) iherbEl.value = cfg.iherb || DEFAULT_AFFILIATE_CONFIG.iherb;
      if (amazonEl) amazonEl.value = cfg.amazon || DEFAULT_AFFILIATE_CONFIG.amazon;
      if (tenpingEl) tenpingEl.value = cfg.tenping || DEFAULT_AFFILIATE_CONFIG.tenping;
      if (chipsToggleEl) chipsToggleEl.checked = (cfg.chipsEnabled !== false);
      if (cafeEl) cafeEl.value = cfg.cafeUrl || DEFAULT_AFFILIATE_CONFIG.cafeUrl;
      if (blogEl) blogEl.value = cfg.blogUrl || DEFAULT_AFFILIATE_CONFIG.blogUrl;

      // Render live OSMU studio inside modal
      renderAdminOsmuStudio();
    }
  }

  function closeAdminModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('admin-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function handleFooterClick() {
    state.adminClickCount++;
    if (state.adminTimer) clearTimeout(state.adminTimer);
    state.adminTimer = setTimeout(() => {
      state.adminClickCount = 0;
    }, 3000);

    if (state.adminClickCount >= 5) {
      state.adminClickCount = 0;
      openAdminModal();
    }
  }

  // 10. Initialization
  function initApp() {
    if (typeof document === 'undefined') return;

    // Capsule tab navigation click
    const capsuleTabs = document.querySelectorAll('.capsule-tab');
    capsuleTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = tab.getAttribute('data-tab');
        if (tabId) switchTab(tabId);
      });
    });

    // NOTE: Onboarding stepper navigation (#btn-next-step, #btn-prev-step), preset cards (.preset-card),
    // and form submission (#diagnosis-form) are authoritatively managed by src/js/onboarding-wizard.js
    // to prevent dual-controller race conditions and state desynchronization.
    // app.js retains nextStep, prevStep, applyPreset, and validateStep for testing and programmatic use.

    const retestBtn = document.getElementById('btn-retest');
    if (retestBtn && !retestBtn._retestDelegatorBound) {
      retestBtn._currentRetestFn = () => {
        const quiz = document.getElementById('quiz-section');
        if (quiz) quiz.scrollIntoView({ behavior: 'smooth' });
      };
      retestBtn._retestDelegatorBound = true;
      retestBtn.addEventListener('click', (e) => {
        if (typeof retestBtn._currentRetestFn === 'function') {
          retestBtn._currentRetestFn(e);
        }
      });
    }

    // Secret Admin Triggers ( Separated from client HTML & unauthenticated URL auto-open disabled )
    const footerCopyright = document.getElementById('footer-copyright');
    if (footerCopyright) {
      footerCopyright.addEventListener('click', handleFooterClick);
    }

    // Admin modal actions
    const closeAdminBtn = document.getElementById('btn-close-admin');
    if (closeAdminBtn) closeAdminBtn.addEventListener('click', closeAdminModal);

    const cancelAdminBtn = document.getElementById('btn-cancel-admin');
    if (cancelAdminBtn) cancelAdminBtn.addEventListener('click', closeAdminModal);

    const resetNaverBtn = document.getElementById('btn-reset-naver-channels');
    if (resetNaverBtn) {
      resetNaverBtn.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.toLowerCase().includes('moneyfit') || k.toLowerCase().includes('naver') || k.toLowerCase().includes('affiliate'))) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        }
        saveAffiliateConfig(DEFAULT_AFFILIATE_CONFIG);
        const cafeEl = document.getElementById('cfg-cafe');
        const blogEl = document.getElementById('cfg-blog');
        if (cafeEl) cafeEl.value = DEFAULT_AFFILIATE_CONFIG.cafeUrl;
        if (blogEl) blogEl.value = DEFAULT_AFFILIATE_CONFIG.blogUrl;
        renderPrescriptionResults();
        renderAdminOsmuStudio();
        alert('기존 머니핏 네이버 블로그·카페 연동 캐시 및 설정이 100% 초기화되었으며, 키즈핏 그로스 스튜디오 기본값으로 재설정되었습니다.');
      });
    }

    const saveAdminBtn = document.getElementById('btn-save-admin');
    if (saveAdminBtn) {
      saveAdminBtn.addEventListener('click', () => {
        const chipsToggle = document.getElementById('cfg-chips-toggle');
        const cfg = {
          chipsEnabled: chipsToggle ? chipsToggle.checked : true,
          coupang: document.getElementById('cfg-coupang') ? document.getElementById('cfg-coupang').value : DEFAULT_AFFILIATE_CONFIG.coupang,
          linkprice: document.getElementById('cfg-linkprice') ? document.getElementById('cfg-linkprice').value : DEFAULT_AFFILIATE_CONFIG.linkprice,
          iherb: document.getElementById('cfg-iherb') ? document.getElementById('cfg-iherb').value : DEFAULT_AFFILIATE_CONFIG.iherb,
          amazon: document.getElementById('cfg-amazon') ? document.getElementById('cfg-amazon').value : DEFAULT_AFFILIATE_CONFIG.amazon,
          tenping: document.getElementById('cfg-tenping') ? document.getElementById('cfg-tenping').value : DEFAULT_AFFILIATE_CONFIG.tenping,
          cafeUrl: document.getElementById('cfg-cafe') ? document.getElementById('cfg-cafe').value : DEFAULT_AFFILIATE_CONFIG.cafeUrl,
          blogUrl: document.getElementById('cfg-blog') ? document.getElementById('cfg-blog').value : DEFAULT_AFFILIATE_CONFIG.blogUrl
        };
        saveAffiliateConfig(cfg);
        renderPrescriptionResults();
        renderAdminOsmuStudio();
        alert('관리자 설정이 저장되었으며 실시간으로 동기화됩니다.');
        closeAdminModal();
      });
    }

    // Initialize to Step 1 (Preserve 6-Step OnboardingWizard header, progress, and DOB-matched Imperial ft/in & lbs defaults)
    const activeWizard = (typeof window !== 'undefined' && (window.KidsFitOnboardingWizard || window.TallerOnboardingWizard)) ||
      (typeof global !== 'undefined' && (global.KidsFitOnboardingWizard || global.TallerOnboardingWizard)) || null;
    let hasSavedProfile = false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        hasSavedProfile = Boolean(window.localStorage.getItem('kidsfit_last_quiz_profile_v1'));
      }
    } catch (_) {}

    if (activeWizard) {
      if (typeof activeWizard.goToStep === 'function') {
        activeWizard.goToStep(1);
      }
      if (hasSavedProfile) {
        syncStateToForm(state.profile);
      } else if (typeof activeWizard.syncDobAndAutoStage === 'function') {
        activeWizard.syncDobAndAutoStage();
        if (typeof activeWizard.getState === 'function' && activeWizard.getState() && activeWizard.getState().profile) {
          state.profile = Object.assign({}, state.profile, activeWizard.getState().profile);
        }
      }
    } else {
      goToStep(1);
      const initialStepTag = document.getElementById('quiz-step-tag');
      if (initialStepTag) {
        initialStepTag.textContent = 'Step 1 / 6';
      }
      syncStateToForm(state.profile);
    }

    // Support direct URL view, preset, and mode parameters (?view=... | ?preset=... | ?mode=growth|learning)
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      try {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        const presetParam = params.get('preset');
        const modeParam = params.get('mode');

        const PRESET_ALIAS_MAP = {
          'preset-1': 'preset-1',
          'infant_1': 'preset-1',
          'infant_12_23': 'preset-1',
          'toddler_2_3': 'preset-1',
          'preset-2': 'preset-2',
          'child_4_5': 'preset-2',
          'elem_low': 'preset-2',
          'elem_low_7_9': 'preset-2',
          'preset-3': 'preset-3',
          'elem_high': 'preset-3',
          'elem_high_10_13': 'preset-3',
          'working_mom': 'preset-3',
          'working_mom_weekend': 'preset-3',
          'preset-4': 'preset-4',
          'preset-5': 'preset-5'
        };

        if (modeParam === 'growth' || modeParam === 'learning') {
          window.__KIDSFIT_PREFERRED_REPORT_MODE = modeParam;
          state.profile.preferredReportMode = modeParam;
        }

        if (presetParam && PRESET_ALIAS_MAP[presetParam]) {
          const mappedPreset = PRESET_ALIAS_MAP[presetParam];
          if (PRESETS[mappedPreset]) {
            state.activePresetId = mappedPreset;
            state.profile = Object.assign({}, JSON.parse(JSON.stringify(PRESETS[mappedPreset])), {
              preferredReportMode: (modeParam === 'learning' || viewParam === 'learning-report') ? 'learning' : 'growth'
            });
            syncStateToForm(state.profile);
          }
          if (document.body && document.body.classList) {
            document.body.classList.add('studio-mode-active');
          }
          const quizSec = document.getElementById('quiz-section');
          if (quizSec) quizSec.style.display = 'none';
          const heroSec = document.getElementById('hero-section');
          if (heroSec) heroSec.style.display = 'none';
          const presetsBar = document.getElementById('quick-presets-bar');
          if (presetsBar) presetsBar.style.display = 'none';
          const dashboard = document.getElementById('results-dashboard') || document.getElementById('prescription-container');
          if (dashboard) {
            dashboard.classList.remove('hidden');
            dashboard.style.display = 'block';
          }
          state.isPrescriptionIssued = true;
          renderPrescriptionResults(state.profile);
        } else if (viewParam === 'growth-report' || viewParam === 'learning-report') {
          const mode = viewParam === 'learning-report' ? 'learning' : 'growth';
          window.__KIDSFIT_PREFERRED_REPORT_MODE = mode;
          state.profile.preferredReportMode = mode;
          if (document.body && document.body.classList) {
            document.body.classList.add('studio-mode-active');
          }
          const quizSec = document.getElementById('quiz-section');
          if (quizSec) quizSec.style.display = 'none';
          const presetsBar = document.getElementById('quick-presets-bar');
          if (presetsBar) presetsBar.style.display = 'none';
          const dashboard = document.getElementById('results-dashboard') || document.getElementById('prescription-container');
          if (dashboard) {
            dashboard.classList.remove('hidden');
            dashboard.style.display = 'block';
          }
          state.isPrescriptionIssued = true;
          renderPrescriptionResults(state.profile);
        } else if (viewParam === 'survey' || modeParam === 'growth' || modeParam === 'learning') {
          const targetMode = modeParam === 'learning' ? 'learning' : 'growth';
          if (global.TallerOnboardingWizard && typeof global.TallerOnboardingWizard.enterStudioMode === 'function') {
            global.TallerOnboardingWizard.enterStudioMode('child', targetMode);
          }
        }
      } catch (_) {}
    }

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('taller-language-change', () => {
        const dashboard = document.getElementById('results-dashboard') || document.getElementById('prescription-container');
        if (state.isPrescriptionIssued || (dashboard && !dashboard.classList.contains('hidden'))) {
          renderPrescriptionResults();
        }
      });
    }
  }

  // Auto-init in browser
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }

  // Export for testing and module systems
  const KidsFitApp = {
    PRESETS,
    STEP_INFO,
    state,
    goToStep,
    nextStep,
    prevStep,
    validateStep,
    syncFormToState,
    syncStateToForm,
    applyPreset,
    issuePrescription,
    renderPrescriptionResults,
    renderPrescriptionReport: renderPrescriptionResults, // Alias for backward compatibility
    attachHormoneSliderListeners,
    switchTab,
    openAdminModal,
    closeAdminModal,
    handleFooterClick,
    getAffiliateConfig,
    saveAffiliateConfig,
    renderAdminOsmuStudio,
    handleSharePrescription,
    initApp,
    GrowthEngine,
    EndocrinologyEngine,
    NutritionEngine,
    DevelopmentEngine,
    WeekendCurator,
    Monetization,
    AdminOsmu,
    ReferenceChips,
    AdminStudio
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = KidsFitApp;
  }
  if (typeof window !== 'undefined') {
    window.KidsFitApp = KidsFitApp;
    window.TallerApp = KidsFitApp;
  }
  if (typeof global !== 'undefined' && typeof window === 'undefined') {
    global.KidsFitApp = KidsFitApp;
    global.TallerApp = KidsFitApp;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
