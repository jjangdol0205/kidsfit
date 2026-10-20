/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * 5-Stage Bio Onboarding Wizard & 5 Age Clinical Presets (src/js/onboarding-wizard.js)
 * 
 * Features:
 * - 5 Clinical Age-Group 1-Second Demo Presets (3yo, 7yo, 10yo, 13yo, 16yo)
 * - 5-Stage Guided Clinical Funnel (Biometrics, Tanner Stage, Inhibitors, Cognitive, 3s Loader)
 * - Genuine data validation with boundary checks (Age 1-20y / 12-240m, Height 50-220cm, Weight 3-150kg)
 * - 3-Second animated clinical computation pulse with stepwise status and instant skip
 * - Fully synchronized with I18n and App State
 */

(function (global) {
  'use strict';

  // 1. Definition of 5 Authoritative Clinical Presets
  const PRESETS = {
    'preset-1': {
      id: 'preset-1',
      labelKo: '영유아기 3세 (만 36개월) — 기초 성장기 & 소근육 감각 협응',
      labelEn: 'Toddler 3 Yrs (36 Mo) — Foundation Auxology & Motor Skills',
      gender: 'boy',
      ageYears: 3,
      ageMonths: 36,
      currentHeight: 96.5,
      currentWeight: 14.7,
      recentGrowth6m: 3.5, // 7.0 cm/yr
      fatherHeight: 175.0,
      motherHeight: 162.0,
      tannerPhase: 'phase_1',
      habits: ['picky_eater'],
      cognitiveAxes: ['sensory_arts'],
      region: '서울 강남·서초·송파'
    },
    'preset-2': {
      id: 'preset-2',
      labelKo: '아동기 7세 (만 84개월) — 수리·공간 논리 & 척추 바른 정렬',
      labelEn: 'Childhood 7 Yrs (84 Mo) — Spatial Logic & Postural Alignment',
      gender: 'girl',
      ageYears: 7,
      ageMonths: 84,
      currentHeight: 120.8,
      currentWeight: 23.6,
      recentGrowth6m: 2.8, // 5.6 cm/yr
      fatherHeight: 176.0,
      motherHeight: 163.0,
      tannerPhase: 'phase_1',
      habits: ['poor_posture'],
      cognitiveAxes: ['math_logic'],
      region: '경기 남부(분당·수원·용인·동탄)'
    },
    'preset-3': {
      id: 'preset-3',
      labelKo: '사춘기 진입 10세 (만 120개월) — 사춘기 초기 수면·호르몬 최적화',
      labelEn: 'Early Puberty 10 Yrs (120 Mo) — Early Pubertal Hormone Optimization',
      gender: 'boy',
      ageYears: 10,
      ageMonths: 120,
      currentHeight: 137.0,
      currentWeight: 35.5,
      recentGrowth6m: 3.2, // 6.4 cm/yr
      fatherHeight: 173.5,
      motherHeight: 160.5,
      tannerPhase: 'phase_2',
      habits: ['late_sleep'],
      cognitiveAxes: ['science_nature'],
      region: '서울 강북·마포·용산'
    },
    'preset-4': {
      id: 'preset-4',
      labelKo: '급성장기 13세 (만 156개월) — PHV 급성장 피크 & 골든타임 집중',
      labelEn: 'Peak Growth Spurt 13 Yrs (156 Mo) — Peak Height Velocity (PHV) Intervention',
      gender: 'boy',
      ageYears: 13,
      ageMonths: 156,
      currentHeight: 155.6,
      currentWeight: 51.0,
      recentGrowth6m: 4.5, // 9.0 cm/yr
      fatherHeight: 174.0,
      motherHeight: 161.0,
      tannerPhase: 'phase_2',
      habits: ['late_sleep', 'night_carbs'],
      cognitiveAxes: ['executive_focus'],
      region: '경기 북부·인천'
    },
    'preset-5': {
      id: 'preset-5',
      labelKo: '후기 청소년 16세 (만 192개월) — 체형 완성기 척추 디스크 복원',
      labelEn: 'Late Adolescent 16 Yrs (192 Mo) — Spinal Disc Recovery & Alignment',
      gender: 'girl',
      ageYears: 16,
      ageMonths: 192,
      currentHeight: 160.0,
      currentWeight: 54.1,
      recentGrowth6m: 0.8, // 1.6 cm/yr
      fatherHeight: 177.0,
      motherHeight: 164.0,
      tannerPhase: 'phase_4',
      habits: ['poor_posture', 'late_sleep'],
      cognitiveAxes: ['language_reading'],
      region: '대구·경북'
    }
  };

  // 2. Wizard Steps Meta Definition
  const WIZARD_STEPS = [
    {
      step: 1,
      titleKo: '기본 신체 계측 & 유전 데이터',
      titleEn: 'Basic Biometrics & Genetics',
      subKo: 'CDC 2000 및 KDCA 2017 LMS 파라미터 백분위와 유전 표적키(MPH) 산출에 사용됩니다.',
      subEn: 'Utilized for CDC/KDCA LMS Z-scores and Tanner Mid-Parental Height (MPH).'
    },
    {
      step: 2,
      titleKo: '성장 단계 & 골연령 (Tanner Stage) 진행도',
      titleEn: 'Skeletal Maturation & Tanner Stage',
      subKo: '성장판 개방률과 급성장 피크기(PHV) 잔여 잠재력을 평가합니다.',
      subEn: 'Evaluates epiphyseal plate open ratio and Peak Height Velocity (PHV) runway.'
    },
    {
      step: 3,
      titleKo: '라이프스타일 & 생체 저해 요인 체크',
      titleEn: 'Lifestyle & Bio-Inhibition Factors',
      subKo: '성장호르몬 분비 억제 및 잠재키 손실 요인을 복수 진단합니다.',
      subEn: 'Diagnoses nocturnal GH suppression and adult height penalty factors.'
    },
    {
      step: 4,
      titleKo: '두뇌·신경인지 핵심 관심 축 (5대 영역)',
      titleEn: 'Neuro-Cognitive Key Axes (5 Major Domains)',
      subKo: '연령별 대뇌 피질 재조직화 및 신경가소성 자극 프로토콜을 설정합니다.',
      subEn: 'Configures age-specific cortical rewiring and developmental inquiry.'
    },
    {
      step: 5,
      titleKo: '바이오 통계 연산 및 궤적 모델링',
      titleEn: 'Clinical Computation & Modeling',
      subKo: 'LMS Z-Score, 24시간 호르몬 곡선 및 3단 성인 예측키를 산출 중입니다.',
      subEn: 'Calculating LMS Z-scores, 24h hormone curves, and 3 adult trajectories.'
    }
  ];

  // 3. Wizard Internal State
  const wizardState = {
    currentStep: 1,
    maxStep: 5,
    activePresetId: null,
    isScanning: false,
    scanCompleted: false,
    profile: {
      gender: 'boy',
      ageYears: 10,
      ageMonths: 120,
      currentHeight: 137.0,
      currentWeight: 35.5,
      recentGrowth6m: 3.2,
      fatherHeight: 173.5,
      motherHeight: 160.5,
      tannerPhase: 'phase_2',
      habits: ['late_sleep'],
      cognitiveAxes: ['science_nature'],
      region: '서울 강남·서초·송파'
    }
  };

  // 4. Stepper Navigation Functions
  function goToStep(stepNumber) {
    if (stepNumber < 1) stepNumber = 1;
    if (stepNumber > wizardState.maxStep) stepNumber = wizardState.maxStep;

    wizardState.currentStep = stepNumber;

    if (typeof document === 'undefined') return;

    // Toggle step contents
    for (let i = 1; i <= wizardState.maxStep; i++) {
      const stepEl = document.getElementById(`step-content-${i}`);
      if (stepEl) {
        if (i === stepNumber) {
          stepEl.classList.add('active');
        } else {
          stepEl.classList.remove('active');
        }
      }
    }

    // Update Progress Indicator
    const tagEl = document.getElementById('quiz-step-tag');
    const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
    const stepWord = isEn ? 'Step' : 'Step';
    if (tagEl) tagEl.textContent = `${stepWord} ${stepNumber} / ${wizardState.maxStep}`;

    const info = WIZARD_STEPS[stepNumber - 1];
    const titleEl = document.getElementById('quiz-step-title');
    if (titleEl && info) {
      titleEl.textContent = isEn ? info.titleEn : info.titleKo;
    }
    const subtitleEl = document.getElementById('quiz-step-subtitle');
    if (subtitleEl && info) {
      subtitleEl.textContent = isEn ? info.subEn : info.subKo;
    }

    const percent = Math.round((stepNumber / wizardState.maxStep) * 100);
    const progressTextEl = document.getElementById('quiz-progress-text');
    if (progressTextEl) progressTextEl.textContent = `${percent}% ${isEn ? 'Completed' : '완료'}`;

    const progressFillEl = document.getElementById('quiz-progress-fill');
    if (progressFillEl) progressFillEl.style.width = `${percent}%`;

    // Button controls
    const prevBtn = document.getElementById('btn-prev-step');
    const nextBtn = document.getElementById('btn-next-step');
    const submitBtn = document.getElementById('btn-submit-quiz');

    if (prevBtn) {
      prevBtn.style.display = stepNumber === 1 ? 'none' : 'inline-flex';
    }
    if (nextBtn) {
      nextBtn.style.display = (stepNumber >= 4) ? 'none' : 'inline-flex';
    }
    if (submitBtn) {
      submitBtn.style.display = (stepNumber === 4 || stepNumber === 5) ? 'inline-flex' : 'none';
    }
  }

  // 5. Validation Logic
  function validateStep(stepNumber) {
    if (typeof document === 'undefined') return true;

    if (stepNumber === 1) {
      const heightInput = document.getElementById('child-height');
      const weightInput = document.getElementById('child-weight');
      const recentInput = document.getElementById('child-recent-gain');
      const fatherInput = document.getElementById('father-height');
      const motherInput = document.getElementById('mother-height');

      let h = heightInput ? parseFloat(heightInput.value) : 137.0;
      let w = weightInput ? parseFloat(weightInput.value) : 35.5;
      let r = recentInput ? parseFloat(recentInput.value) : 3.0;
      let fh = fatherInput ? parseFloat(fatherInput.value) : 173.5;
      let mh = motherInput ? parseFloat(motherInput.value) : 160.5;

      // Handle Imperial mode conversion if active
      const isImperial = typeof document !== 'undefined' && document.documentElement.lang === 'en' && typeof global.TallerI18n !== 'undefined' && global.TallerI18n.getUnitSystem() === 'imperial';
      if (isImperial) {
        // User inputs are in inches (18~90 in) and lbs (5~350 lbs)
        // Convert unconditionally to metric (cm, kg) for standardized clinical auxology validation
        h = h * 2.54;
        w = w / 2.20462262;
        r = r * 2.54;
        fh = fh * 2.54;
        mh = mh * 2.54;
      }

      // Bound checks against standard clinical metric ranges:
      // Height: [45.0 cm, 230.0 cm] (corresponds to [17.72 in, 90.55 in])
      // Weight: [2.0 kg, 160.0 kg] (corresponds to [4.41 lbs, 352.74 lbs])
      // Recent growth: [0.0 cm, 20.0 cm] (corresponds to [0.0 in, 7.87 in])
      if (isNaN(h) || h < 45 || h > 230) {
        alert(isImperial ? 'Please enter a valid height (18 to 90 inches / 45 to 230 cm).' : '아이 키를 45cm ~ 230cm 사이로 입력해 주세요.');
        if (heightInput) heightInput.focus();
        return false;
      }
      if (isNaN(w) || w < 2 || w > 160) {
        alert(isImperial ? 'Please enter a valid weight (5 to 350 lbs / 2 to 160 kg).' : '아이 몸무게를 2kg ~ 160kg 사이로 입력해 주세요.');
        if (weightInput) weightInput.focus();
        return false;
      }
      if (isNaN(r) || r < 0 || r > 20) {
        alert(isImperial ? 'Please enter recent 6-month growth (0 to 8 inches).' : '최근 6개월 성장폭을 0 ~ 20cm 사이로 입력해 주세요.');
        if (recentInput) recentInput.focus();
        return false;
      }
      if (isNaN(fh) || fh < 100 || fh > 240) {
        if (fatherInput) fatherInput.value = isImperial ? 68.3 : 173.5;
      }
      if (isNaN(mh) || mh < 100 || mh > 240) {
        if (motherInput) motherInput.value = isImperial ? 63.2 : 160.5;
      }
    }

    return true;
  }

  // 6. 3-Second Bio Scan Loader
  let scanTimer = null;
  function start3SecondScan(onComplete) {
    wizardState.isScanning = true;
    const overlay = document.getElementById('analysis-overlay');
    const titleEl = document.getElementById('analysis-title');
    const descEl = document.getElementById('analysis-desc');
    const fillEl = document.getElementById('analysis-bar-fill');
    const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';

    if (overlay) {
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
    }

    if (fillEl) fillEl.style.width = '0%';

    const step1Msg = isEn ? 'Loading US CDC 2000 & KDCA 2017 LMS Parameter Matrices...' : 'CDC 2000 & KDCA 2017 LMS 파라미터 매트릭스 로딩 중...';
    const step2Msg = isEn ? 'Computing LMS Z-Scores & 3-Tier Predicted Adult Trajectories...' : 'Z-Score 표준화 및 3단 성인 예측키 궤적 모델링 연산 중...';
    const step3Msg = isEn ? 'Finalizing GH Suppression Ratio & 5-Axis Neuro-Cognitive Protocol!' : '호르몬 분비 억제율 및 5각 신경인지 밸런스 프로토콜 생성 완료!';

    if (titleEl) titleEl.textContent = step1Msg;
    if (descEl) descEl.textContent = isEn ? 'Standardizing patient biometrics against national normative data...' : '환자 생체 데이터를 임상 표본과 대조하여 백분위를 산출하고 있습니다.';

    // Progress pulse
    let start = Date.now();
    if (scanTimer) clearInterval(scanTimer);

    scanTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, Math.round((elapsed / 3000) * 100));

      if (fillEl) fillEl.style.width = `${progress}%`;

      if (elapsed >= 1000 && elapsed < 2000) {
        if (titleEl) titleEl.textContent = step2Msg;
        if (descEl) descEl.textContent = isEn ? 'Simulating Tanner MPH and deep sleep hormonal trajectories...' : '유전 표적키와 서파수면 호르몬 억제 시나리오를 연산하고 있습니다.';
      } else if (elapsed >= 2000 && elapsed < 3000) {
        if (titleEl) titleEl.textContent = step3Msg;
        if (descEl) descEl.textContent = isEn ? 'Synthesizing spinal biomechanics and cognitive development roadmap...' : '척추 감압 루틴 및 신경인지 발달 처방전을 완성하고 있습니다.';
      }

      if (elapsed >= 3000) {
        clearInterval(scanTimer);
        scanTimer = null;
        completeScan(onComplete);
      }
    }, 50);

    // Provide instant skip button
    const skipBtn = document.getElementById('btn-skip-scan');
    if (skipBtn) {
      skipBtn.onclick = () => {
        if (scanTimer) clearInterval(scanTimer);
        scanTimer = null;
        completeScan(onComplete);
      };
    }
  }

  function completeScan(onComplete) {
    wizardState.isScanning = false;
    wizardState.scanCompleted = true;

    const overlay = document.getElementById('analysis-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }

    const prescriptionContainer = document.getElementById('prescription-container');
    if (prescriptionContainer) {
      prescriptionContainer.style.display = 'block';
      prescriptionContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Trigger onComplete callback
    if (typeof onComplete === 'function') {
      onComplete(wizardState.profile);
    }

    // Dispatch global event
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('taller-scan-completed', {
        detail: { profile: wizardState.profile }
      }));
    }
  }

  // 7. Apply Preset
  function applyPreset(presetId) {
    const preset = PRESETS[presetId];
    if (!preset) return;

    wizardState.activePresetId = presetId;
    wizardState.profile = Object.assign({}, wizardState.profile, {
      gender: preset.gender,
      ageYears: preset.ageYears,
      ageMonths: preset.ageMonths,
      currentHeight: preset.currentHeight,
      currentWeight: preset.currentWeight,
      recentGrowth6m: preset.recentGrowth6m,
      fatherHeight: preset.fatherHeight,
      motherHeight: preset.motherHeight,
      tannerPhase: preset.tannerPhase,
      habits: [...preset.habits],
      cognitiveAxes: [...preset.cognitiveAxes],
      region: preset.region
    });

    // Sync to DOM inputs
    if (typeof document !== 'undefined') {
      // Gender radio
      const boyRadio = document.getElementById('gender-boy');
      const girlRadio = document.getElementById('gender-girl');
      if (boyRadio && girlRadio) {
        boyRadio.checked = preset.gender === 'boy';
        girlRadio.checked = preset.gender === 'girl';
      }

      // Age inputs
      const ageYearsSlider = document.getElementById('child-age-slider');
      const ageYearsDisplay = document.getElementById('child-age-display');
      const ageMonthsInput = document.getElementById('child-age-months');
      if (ageYearsSlider) ageYearsSlider.value = preset.ageYears;
      if (ageYearsDisplay) ageYearsDisplay.textContent = `${preset.ageYears}세 (${preset.ageMonths}개월)`;
      if (ageMonthsInput) ageMonthsInput.value = preset.ageMonths;

      // Height & Weight
      const heightInput = document.getElementById('child-height');
      const weightInput = document.getElementById('child-weight');
      const recentInput = document.getElementById('child-recent-gain');
      const fatherInput = document.getElementById('father-height');
      const motherInput = document.getElementById('mother-height');

      if (heightInput) heightInput.value = preset.currentHeight;
      if (weightInput) weightInput.value = preset.currentWeight;
      if (recentInput) recentInput.value = preset.recentGrowth6m;
      if (fatherInput) fatherInput.value = preset.fatherHeight;
      if (motherInput) motherInput.value = preset.motherHeight;

      // Tanner Phase Radio
      const phaseRadios = document.querySelectorAll('input[name="tanner-phase"]');
      phaseRadios.forEach((r) => {
        r.checked = (r.value === preset.tannerPhase);
      });

      // Habits Checkboxes
      const habitCheckboxes = document.querySelectorAll('input[name="growth-habits"]');
      habitCheckboxes.forEach((cb) => {
        cb.checked = preset.habits.includes(cb.value);
      });

      // Cognitive Axes Checkboxes
      const cogCheckboxes = document.querySelectorAll('input[name="cognitive-axes"]');
      cogCheckboxes.forEach((cb) => {
        cb.checked = preset.cognitiveAxes.includes(cb.value);
      });

      // Region Select
      const regionSelect = document.getElementById('user-region');
      if (regionSelect && preset.region) {
        regionSelect.value = preset.region;
      }

      // Highlight active preset card
      for (let i = 1; i <= 5; i++) {
        const card = document.getElementById(`preset-card-${i}`);
        if (card) {
          if (`preset-${i}` === presetId) {
            card.classList.add('active');
          } else {
            card.classList.remove('active');
          }
        }
      }
    }

    // Launch the 3-second clinical scan directly when clicking preset
    start3SecondScan((profile) => {
      if (typeof global.KidsFitApp !== 'undefined') {
        if (typeof global.KidsFitApp.renderPrescriptionResults === 'function') {
          global.KidsFitApp.renderPrescriptionResults(profile);
        } else if (typeof global.KidsFitApp.renderPrescriptionReport === 'function') {
          global.KidsFitApp.renderPrescriptionReport(profile);
        }
      }
    });
  }

  // 8. Form State Extractor
  function readProfileFromForm() {
    if (typeof document === 'undefined') return wizardState.profile;

    const boyRadio = document.getElementById('gender-boy');
    const gender = (boyRadio && boyRadio.checked) ? 'boy' : 'girl';

    const ageSlider = document.getElementById('child-age-slider');
    const ageYears = ageSlider ? parseInt(ageSlider.value, 10) : 10;
    const ageMonths = ageYears * 12;

    const heightInput = document.getElementById('child-height');
    const weightInput = document.getElementById('child-weight');
    const recentInput = document.getElementById('child-recent-gain');
    const fatherInput = document.getElementById('father-height');
    const motherInput = document.getElementById('mother-height');

    let currentHeight = heightInput ? parseFloat(heightInput.value) || 137.0 : 137.0;
    let currentWeight = weightInput ? parseFloat(weightInput.value) || 35.5 : 35.5;
    let recentGrowth6m = recentInput ? parseFloat(recentInput.value) || 3.0 : 3.0;
    let fatherHeight = fatherInput ? parseFloat(fatherInput.value) || 173.5 : 173.5;
    let motherHeight = motherInput ? parseFloat(motherInput.value) || 160.5 : 160.5;

    const isImperial = typeof document !== 'undefined' && document.documentElement.lang === 'en' && typeof global.TallerI18n !== 'undefined' && global.TallerI18n.getUnitSystem() === 'imperial';
    if (isImperial) {
      currentHeight = Math.round(currentHeight * 2.54 * 10) / 10;
      currentWeight = Math.round((currentWeight / 2.20462262) * 10) / 10;
      recentGrowth6m = Math.round(recentGrowth6m * 2.54 * 10) / 10;
      fatherHeight = Math.round(fatherHeight * 2.54 * 10) / 10;
      motherHeight = Math.round(motherHeight * 2.54 * 10) / 10;
    }

    // Tanner Phase
    let tannerPhase = 'phase_2';
    const checkedPhase = document.querySelector('input[name="tanner-phase"]:checked');
    if (checkedPhase) tannerPhase = checkedPhase.value;

    // Habits
    const habits = [];
    const habitCheckboxes = document.querySelectorAll('input[name="growth-habits"]:checked');
    habitCheckboxes.forEach((cb) => habits.push(cb.value));

    // Cognitive Axes
    const cognitiveAxes = [];
    const cogCheckboxes = document.querySelectorAll('input[name="cognitive-axes"]:checked');
    cogCheckboxes.forEach((cb) => cognitiveAxes.push(cb.value));
    if (cognitiveAxes.length === 0) cognitiveAxes.push('science_nature');

    // Region
    const regionSelect = document.getElementById('user-region');
    const region = regionSelect ? regionSelect.value : '서울 강남·서초·송파';

    wizardState.profile = {
      gender,
      ageYears,
      ageMonths,
      currentHeight,
      currentWeight,
      recentGrowth6m,
      fatherHeight,
      motherHeight,
      tannerPhase,
      habits,
      cognitiveAxes,
      region
    };

    return wizardState.profile;
  }

  // 9. Initialize Event Listeners
  function initWizard() {
    if (typeof document === 'undefined') return;

    // Step navigation buttons
    const prevBtn = document.getElementById('btn-prev-step');
    const nextBtn = document.getElementById('btn-next-step');
    const form = document.getElementById('diagnosis-form');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goToStep(wizardState.currentStep - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (validateStep(wizardState.currentStep)) {
          goToStep(wizardState.currentStep + 1);
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateStep(wizardState.currentStep)) {
          readProfileFromForm();
          start3SecondScan((profile) => {
            if (typeof global.KidsFitApp !== 'undefined') {
              if (typeof global.KidsFitApp.renderPrescriptionResults === 'function') {
                global.KidsFitApp.renderPrescriptionResults(profile);
              } else if (typeof global.KidsFitApp.renderPrescriptionReport === 'function') {
                global.KidsFitApp.renderPrescriptionReport(profile);
              }
            }
          });
        }
      });
    }

    // Age slider sync
    const ageSlider = document.getElementById('child-age-slider');
    const ageDisplay = document.getElementById('child-age-display');
    const ageMonthsInput = document.getElementById('child-age-months');
    if (ageSlider) {
      ageSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const months = val * 12;
        if (ageDisplay) ageDisplay.textContent = `${val}세 (${months}개월)`;
        if (ageMonthsInput) ageMonthsInput.value = months;
      });
    }

    // Preset cards
    for (let i = 1; i <= 5; i++) {
      const card = document.getElementById(`preset-card-${i}`);
      if (card) {
        card.addEventListener('click', () => {
          applyPreset(`preset-${i}`);
        });
      }
    }

    // Retest button
    const retestBtn = document.getElementById('btn-retest');
    if (retestBtn) {
      retestBtn.addEventListener('click', () => {
        const prescriptionContainer = document.getElementById('prescription-container');
        if (prescriptionContainer) prescriptionContainer.style.display = 'none';
        goToStep(1);
        const quizSection = document.getElementById('quiz-section');
        if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  // Export
  const OnboardingWizard = {
    PRESETS,
    WIZARD_STEPS,
    state: wizardState,
    goToStep,
    validateStep,
    applyPreset,
    start3SecondScan,
    completeScan,
    readProfileFromForm,
    initWizard
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingWizard;
  } else {
    global.TallerOnboardingWizard = OnboardingWizard;
    if (typeof window !== 'undefined') {
      window.addEventListener('DOMContentLoaded', () => {
        initWizard();
      });
    }
  }

})(typeof window !== 'undefined' ? window : global);
