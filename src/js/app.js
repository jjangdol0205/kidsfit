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
  let DevelopmentEngine = typeof require !== 'undefined' ? require('./development-engine') : (global.KidsFitDevelopmentEngine || null);
  let WeekendCurator = typeof require !== 'undefined' ? require('./weekend-curator') : (global.KidsFitWeekendCurator || null);
  let Monetization = typeof require !== 'undefined' ? require('./monetization') : (global.KidsFitMonetization || null);
  let AdminOsmu = typeof require !== 'undefined' ? require('./admin-osmu') : (global.KidsFitAdminOsmu || null);

  // 1. Definition of 6 Quick 1-Second Presets
  const PRESETS = {
    'preset-1': {
      id: 'preset-1',
      label: '만 2~3세 소근육·감각 골든타임 (몬테소리 입문 & 촉각 미술관 코스)',
      gender: 'girl',
      ageMonths: 36,
      currentHeight: 95.0,
      currentWeight: 14.2,
      fatherHeight: 175.0,
      motherHeight: 162.0,
      region: '서울 강남·서초·송파',
      pubertyStage: 'none',
      habits: ['milk_trouble', 'picky_eater'],
      developmentConcerns: ['fine_motor', 'emotion_art'],
      philosophy: 'montessori',
      interest: 'art_making',
      budgetTier: 'tier_15_30'
    },
    'preset-2': {
      id: 'preset-2',
      label: '만 4~5세 수리·공간 창의력 & 편식 아이 폭풍 성장 플랜 (은물·가베·자석교구 & 공룡·과학 코스)',
      gender: 'boy',
      ageMonths: 60,
      currentHeight: 109.0,
      currentWeight: 18.5,
      fatherHeight: 173.0,
      motherHeight: 160.0,
      region: '경기 남부(분당·수원·용인·동탄)',
      pubertyStage: 'none',
      habits: ['picky_eater', 'late_sleep'],
      developmentConcerns: ['math_space'],
      philosophy: 'froebel_gabe',
      interest: 'dino_nature',
      budgetTier: 'tier_15_30'
    },
    'preset-3': {
      id: 'preset-3',
      label: '초등 저학년 역사·예술 흥미 유발 & 또래 키 상위 20% 도약 플랜 (박물관 역사 코스 & 바른 자세 교정)',
      gender: 'girl',
      ageMonths: 96,
      currentHeight: 126.5,
      currentWeight: 25.0,
      fatherHeight: 171.0,
      motherHeight: 158.0,
      region: '서울 강북·마포·용산',
      pubertyStage: 'growth_spurt',
      habits: ['poor_posture'],
      developmentConcerns: ['language_reading', 'math_space'],
      philosophy: 'waldorf_art',
      interest: 'history_tradition',
      budgetTier: 'tier_15_30'
    },
    'preset-4': {
      id: 'preset-4',
      label: '초등 고학년 사춘기 신호 시작! 성장판 닫히기 전 마지막 숨은 키 7cm 집중 플랜',
      gender: 'boy',
      ageMonths: 132,
      currentHeight: 144.0,
      currentWeight: 38.0,
      fatherHeight: 172.0,
      motherHeight: 160.0,
      region: '경기 북부·인천',
      pubertyStage: 'urgent_secondary_signs',
      habits: ['late_sleep', 'poor_posture'],
      developmentConcerns: ['gross_motor'],
      philosophy: 'science_coding',
      interest: 'space_science',
      budgetTier: 'tier_unlimited'
    },
    'preset-5': {
      id: 'preset-5',
      label: '영아기(만 12~23개월) 대근육·오감 자극 & 우유 배앓이 없는 기초 뼈성장 루틴',
      gender: 'boy',
      ageMonths: 18,
      currentHeight: 82.0,
      currentWeight: 11.5,
      fatherHeight: 176.0,
      motherHeight: 163.0,
      region: '부산·경남',
      pubertyStage: 'none',
      habits: ['milk_trouble'],
      developmentConcerns: ['gross_motor', 'fine_motor'],
      philosophy: 'montessori',
      interest: 'music_musical',
      budgetTier: 'tier_5_10'
    },
    'preset-6': {
      id: 'preset-6',
      label: '바쁜 워킹맘 전용 주말 3시간 고효율 육아 (실패 없는 발달 장난감 TOP 3 + 집 근처 예약 필수 전시 코스)',
      gender: 'girl',
      ageMonths: 48,
      currentHeight: 102.5,
      currentWeight: 16.0,
      fatherHeight: 174.0,
      motherHeight: 161.0,
      region: '서울 강남·서초·송파',
      pubertyStage: 'none',
      habits: ['poor_posture', 'late_sleep'],
      developmentConcerns: ['fine_motor', 'language_reading'],
      philosophy: 'montessori',
      interest: 'art_making',
      budgetTier: 'tier_15_30'
    }
  };

  // 2. Stepper Meta Information
  const STEP_INFO = [
    {
      step: 1,
      title: '아이 기본 프로필 & 거주 지역',
      subtitle: '질병관리청 표준 성장도표 백분위와 지역 맞춤 나들이 매칭에 활용됩니다.'
    },
    {
      step: 2,
      title: '신체 성장 & 사춘기 골든타임 체크',
      subtitle: '사춘기 신호와 성장 방해 습관에 따른 잠재키 손실치를 진단합니다.'
    },
    {
      step: 3,
      title: '두뇌 & 소근육 발달 고민 체크',
      subtitle: '보건복지부 K-DST 6대 영역 기준 맞춤 발달 밸런스를 측정합니다.'
    },
    {
      step: 4,
      title: '선호 교육철학 & 교구 성향',
      subtitle: '아이 성향과 부모님의 교육 방향에 부합하는 교구를 판정합니다.'
    },
    {
      step: 5,
      title: '아이 관심사 테마 선택',
      subtitle: '이번 주말 아이가 가장 즐겁게 몰입할 나들이 코스를 연결합니다.'
    },
    {
      step: 6,
      title: '월 성장·교육 투자 예산 티어',
      subtitle: '가계 부담 없이 지속 가능한 최적의 홈케어 솔루션을 제안합니다.'
    }
  ];

  // 3. Application State
  const state = {
    currentStep: 1,
    maxStep: 6,
    activeTab: 'tab-growth',
    activePresetId: null,
    isPrescriptionIssued: false,
    adminClickCount: 0,
    adminTimer: null,
    profile: {
      gender: 'boy',
      ageMonths: 48,
      currentHeight: 104.5,
      currentWeight: 17.2,
      fatherHeight: 175.0,
      motherHeight: 162.0,
      region: '서울 강남·서초·송파',
      pubertyStage: 'none',
      habits: [],
      developmentConcerns: ['fine_motor'],
      philosophy: 'montessori',
      interest: 'art_making',
      budgetTier: 'tier_15_30'
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
    if (tagEl) tagEl.textContent = `Step ${stepNumber} / ${state.maxStep}`;

    const info = STEP_INFO[stepNumber - 1];
    const titleEl = document.getElementById('quiz-step-title');
    if (titleEl && info) titleEl.textContent = info.title;

    const subtitleEl = document.getElementById('quiz-step-subtitle');
    if (subtitleEl && info) subtitleEl.textContent = info.subtitle;

    const percent = Math.round((stepNumber / state.maxStep) * 100);
    const progressTextEl = document.getElementById('quiz-progress-text');
    if (progressTextEl) progressTextEl.textContent = `${percent}% 완료`;

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

    if (stepNumber === 1) {
      const ageInput = document.getElementById('child-age-months');
      const heightInput = document.getElementById('child-height');
      const weightInput = document.getElementById('child-weight');
      const fatherInput = document.getElementById('father-height');
      const motherInput = document.getElementById('mother-height');

      const age = ageInput ? parseFloat(ageInput.value) : state.profile.ageMonths;
      const height = heightInput ? parseFloat(heightInput.value) : state.profile.currentHeight;
      const weight = weightInput ? parseFloat(weightInput.value) : state.profile.currentWeight;
      const father = fatherInput ? parseFloat(fatherInput.value) : state.profile.fatherHeight;
      const mother = motherInput ? parseFloat(motherInput.value) : state.profile.motherHeight;

      if (isNaN(age) || age < 12 || age > 216) {
        alert('아이의 현재 월령을 12~216개월 사이로 입력해주세요.');
        if (ageInput) ageInput.focus();
        return false;
      }
      if (isNaN(height) || height < 50 || height > 210) {
        alert('아이의 현재 키를 50~210cm 사이로 입력해주세요.');
        if (heightInput) heightInput.focus();
        return false;
      }
      if (isNaN(weight) || weight < 5 || weight > 120) {
        alert('아이의 현재 몸무게를 5~120kg 사이로 입력해주세요.');
        if (weightInput) weightInput.focus();
        return false;
      }
      if (isNaN(father) || father < 130 || father > 220) {
        alert('아빠 키를 130~220cm 사이로 입력해주세요.');
        if (fatherInput) fatherInput.focus();
        return false;
      }
      if (isNaN(mother) || mother < 120 || mother > 210) {
        alert('엄마 키를 120~210cm 사이로 입력해주세요.');
        if (motherInput) motherInput.focus();
        return false;
      }
    } else if (stepNumber === 3) {
      const checkedConcerns = document.querySelectorAll('input[name="kdst-concerns"]:checked');
      if (checkedConcerns.length === 0) {
        alert('보건복지부 K-DST 발달 고민 중 최소 1개 이상 항목을 선택해주세요.');
        return false;
      }
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

    const heightInput = document.getElementById('child-height');
    if (heightInput && heightInput.value) state.profile.currentHeight = parseFloat(heightInput.value);

    const weightInput = document.getElementById('child-weight');
    if (weightInput && weightInput.value) state.profile.currentWeight = parseFloat(weightInput.value);

    const fatherInput = document.getElementById('father-height');
    if (fatherInput && fatherInput.value) state.profile.fatherHeight = parseFloat(fatherInput.value);

    const motherInput = document.getElementById('mother-height');
    if (motherInput && motherInput.value) state.profile.motherHeight = parseFloat(motherInput.value);

    const regionSelect = document.getElementById('user-region');
    if (regionSelect) state.profile.region = regionSelect.value;

    // Step 2
    const pubertyChecked = document.querySelector('input[name="puberty-stage"]:checked');
    if (pubertyChecked) state.profile.pubertyStage = pubertyChecked.value;

    const habitsChecked = document.querySelectorAll('input[name="growth-habits"]:checked');
    state.profile.habits = Array.from(habitsChecked).map(el => el.value);

    // Step 3
    const kdstChecked = document.querySelectorAll('input[name="kdst-concerns"]:checked');
    state.profile.developmentConcerns = Array.from(kdstChecked).map(el => el.value);

    // Step 4
    const philChecked = document.querySelector('input[name="teaching-philosophy"]:checked');
    if (philChecked) state.profile.philosophy = philChecked.value;

    // Step 5
    const interestChecked = document.querySelector('input[name="child-interest"]:checked');
    if (interestChecked) state.profile.interest = interestChecked.value;

    // Step 6
    const budgetChecked = document.querySelector('input[name="budget-tier"]:checked');
    if (budgetChecked) state.profile.budgetTier = budgetChecked.value;

    return state.profile;
  }

  function syncStateToForm(profile) {
    if (!profile) profile = state.profile;
    if (typeof document === 'undefined') return;

    // Gender
    const genderRadio = document.querySelector(`input[name="child-gender"][value="${profile.gender}"]`);
    if (genderRadio) genderRadio.checked = true;

    // Numeric inputs
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    };
    setVal('child-age-months', profile.ageMonths);
    setVal('child-height', profile.currentHeight);
    setVal('child-weight', profile.currentWeight);
    setVal('father-height', profile.fatherHeight);
    setVal('mother-height', profile.motherHeight);

    // Region
    const regionSelect = document.getElementById('user-region');
    if (regionSelect && profile.region) regionSelect.value = profile.region;

    // Puberty
    const pubertyRadio = document.querySelector(`input[name="puberty-stage"][value="${profile.pubertyStage}"]`);
    if (pubertyRadio) pubertyRadio.checked = true;

    // Habits (multi-select)
    const habitInputs = document.querySelectorAll('input[name="growth-habits"]');
    habitInputs.forEach(input => {
      input.checked = profile.habits.includes(input.value);
    });

    // KDST (multi-select)
    const kdstInputs = document.querySelectorAll('input[name="kdst-concerns"]');
    kdstInputs.forEach(input => {
      input.checked = profile.developmentConcerns.includes(input.value);
    });

    // Philosophy
    const philRadio = document.querySelector(`input[name="teaching-philosophy"][value="${profile.philosophy}"]`);
    if (philRadio) philRadio.checked = true;

    // Interest
    const interestRadio = document.querySelector(`input[name="child-interest"][value="${profile.interest}"]`);
    if (interestRadio) interestRadio.checked = true;

    // Budget
    const budgetRadio = document.querySelector(`input[name="budget-tier"][value="${profile.budgetTier}"]`);
    if (budgetRadio) budgetRadio.checked = true;
  }

  // 6. Preset Application
  function applyPreset(presetId) {
    const preset = PRESETS[presetId];
    if (!preset) return false;

    state.activePresetId = presetId;
    state.profile = JSON.parse(JSON.stringify(preset));

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

      const messages = [
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

      if (container) {
        container.style.display = 'block';
        if (headerTitle) {
          headerTitle.textContent = `만 ${state.profile.ageMonths}개월 ${state.profile.gender === 'boy' ? '남아' : '여아'} 맞춤 처방전`;
        }
        if (avatarEl) {
          avatarEl.textContent = state.profile.gender === 'boy' ? '👦' : '👧';
        }

        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

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
  function renderPrescriptionResults() {
    if (!GrowthEngine && global.KidsFitGrowthEngine) GrowthEngine = global.KidsFitGrowthEngine;
    if (!DevelopmentEngine && global.KidsFitDevelopmentEngine) DevelopmentEngine = global.KidsFitDevelopmentEngine;
    if (!WeekendCurator && global.KidsFitWeekendCurator) WeekendCurator = global.KidsFitWeekendCurator;
    if (!Monetization && global.KidsFitMonetization) Monetization = global.KidsFitMonetization;
    if (!AdminOsmu && global.KidsFitAdminOsmu) AdminOsmu = global.KidsFitAdminOsmu;

    if (typeof document === 'undefined') return;

    const affConfig = getAffiliateConfig();

    // Render Tab 1
    const growthCard = document.getElementById('growth-report-card');
    if (growthCard && GrowthEngine) {
      growthCard.innerHTML = GrowthEngine.renderTab1Report(state.profile);
    }

    // Render Tab 2
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
  }

  // 7-2. Share Prescription Handler
  function handleSharePrescription() {
    const lms = GrowthEngine ? GrowthEngine.getLmsForMonth(state.profile.gender, state.profile.ageMonths) : { L: 1, M: 100, S: 0.04 };
    const kdca = GrowthEngine ? GrowthEngine.calculateKdcaPercentile(state.profile.currentHeight, lms.L, lms.M, lms.S) : { topPercent: 30 };
    const mph = GrowthEngine ? GrowthEngine.calculateMph(state.profile.fatherHeight, state.profile.motherHeight, state.profile.gender) : 170;
    const pred = GrowthEngine ? GrowthEngine.calculateHeightPrediction(mph, state.profile.habits, state.profile.pubertyStage) : { potentialHeight: 178 };
    const outing = WeekendCurator ? WeekendCurator.getWeekendOuting(state.profile.region, state.profile.interest) : { destination: '어린이박물관' };

    const childGender = state.profile.gender === 'boy' ? '남아' : '여아';
    const text = `💌 여보! 방금 우리 아이(만 ${state.profile.ageMonths}개월 ${childGender}) 질병관리청 성장도표 진단해봤는데, 또래 상위 ${kdca.topPercent}%래!\n골든타임 관리하면 최대 ${pred.potentialHeight}cm까지 클 수 있대!\n이번 주말엔 [${outing.destination}] 같이 가보자 👉 https://truthofmarket.com`;

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert('카톡 공유용 맞춤 처방전 메시지가 클립보드에 복사되었습니다!\n카카오톡 대화창에 붙여넣기(Ctrl+V) 해주세요.');
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
    tabs.forEach(tab => {
      const match = tab.getAttribute('data-tab') === tabId;
      if (match) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    // Panes
    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(pane => {
      const match = pane.getAttribute('id') === `tab-pane-${tabId.replace('tab-', '')}`;
      if (match) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') {
      const event = new CustomEvent('kidsfit:tab-changed', {
        detail: { tabId }
      });
      window.dispatchEvent(event);
    }
  }

  // 9. Secret Admin Studio Logic
  const DEFAULT_AFFILIATE_CONFIG = {
    coupang: 'AF7865143',
    linkprice: 'A100708867',
    tenping: '010-****-2370',
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
    const modal = document.getElementById('admin-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');

      const cfg = getAffiliateConfig();
      const coupangEl = document.getElementById('cfg-coupang');
      const linkpriceEl = document.getElementById('cfg-linkprice');
      const tenpingEl = document.getElementById('cfg-tenping');
      const cafeEl = document.getElementById('cfg-cafe');
      const blogEl = document.getElementById('cfg-blog');

      if (coupangEl) coupangEl.value = cfg.coupang;
      if (linkpriceEl) linkpriceEl.value = cfg.linkprice;
      if (tenpingEl) tenpingEl.value = cfg.tenping;
      if (cafeEl) cafeEl.value = cfg.cafeUrl;
      if (blogEl) blogEl.value = cfg.blogUrl;

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

    // Preset cards click
    const presetCards = document.querySelectorAll('.preset-card');
    presetCards.forEach(card => {
      card.addEventListener('click', () => {
        const presetId = card.getAttribute('data-preset-id');
        if (presetId) applyPreset(presetId);
      });
    });

    // Stepper navigation buttons
    const nextBtn = document.getElementById('btn-next-step');
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        nextStep();
      });
    }

    const prevBtn = document.getElementById('btn-prev-step');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        prevStep();
      });
    }

    const form = document.getElementById('diagnosis-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateStep(state.currentStep)) {
          issuePrescription();
        }
      });
    }

    const retestBtn = document.getElementById('btn-retest');
    if (retestBtn) {
      retestBtn.addEventListener('click', () => {
        const quiz = document.getElementById('quiz-section');
        if (quiz) quiz.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Secret Admin Triggers
    const footerCopyright = document.getElementById('footer-copyright');
    if (footerCopyright) {
      footerCopyright.addEventListener('click', handleFooterClick);
    }

    if (typeof window !== 'undefined' && window.location && window.location.search) {
      if (window.location.search.includes('admin=1')) {
        openAdminModal();
      }
    }

    // Admin modal actions
    const closeAdminBtn = document.getElementById('btn-close-admin');
    if (closeAdminBtn) closeAdminBtn.addEventListener('click', closeAdminModal);

    const cancelAdminBtn = document.getElementById('btn-cancel-admin');
    if (cancelAdminBtn) cancelAdminBtn.addEventListener('click', closeAdminModal);

    const saveAdminBtn = document.getElementById('btn-save-admin');
    if (saveAdminBtn) {
      saveAdminBtn.addEventListener('click', () => {
        const cfg = {
          coupang: document.getElementById('cfg-coupang') ? document.getElementById('cfg-coupang').value : DEFAULT_AFFILIATE_CONFIG.coupang,
          linkprice: document.getElementById('cfg-linkprice') ? document.getElementById('cfg-linkprice').value : DEFAULT_AFFILIATE_CONFIG.linkprice,
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

    // Initialize to Step 1
    goToStep(1);
    syncStateToForm(state.profile);
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
    DevelopmentEngine,
    WeekendCurator,
    Monetization,
    AdminOsmu
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = KidsFitApp;
  } else {
    global.KidsFitApp = KidsFitApp;
  }

})(typeof window !== 'undefined' ? window : global);
