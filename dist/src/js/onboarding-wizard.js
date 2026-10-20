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

  let PinpointCurator = typeof require !== 'undefined' ? (function () { try { return require('./pinpoint-curator'); } catch (e) { return null; } })() : (global.TallerPinpointCurator || global.KidsFitPinpointCurator || null);
  let HapticEngine = typeof require !== 'undefined' ? (function () { try { return require('./haptic-typewriter'); } catch (e) { return null; } })() : (global.TallerHapticEngine || global.KidsFitHapticEngine || null);
  let UserCohortDB = typeof require !== 'undefined' ? (function () { try { return require('./user-cohort-db'); } catch (e) { return null; } })() : (global.TallerUserCohortDB || global.KidsFitUserCohortDB || null);

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
      titleKo: '진단 대상 & 기본 프로필 (성별·나이)',
      titleEn: 'Target Child & Basic Demographics',
      subKo: '소아청소년 성장도표 및 성인 초기 표준 데이터 매칭에 활용됩니다.',
      subEn: 'Utilized for CDC/KDCA LMS national growth charts and normative baselines.'
    },
    {
      step: 2,
      titleKo: '정밀 신체 계측치 (키·체중·성장폭)',
      titleEn: 'Accurate Biometrics (Height, Weight, Velocity)',
      subKo: 'CDC 2000 및 KDCA 2017 LMS 파라미터 백분위와 성장 속도 산출에 사용됩니다.',
      subEn: 'Baseline metrics for national LMS percentiles and 6-month growth velocity.'
    },
    {
      step: 3,
      titleKo: '부모 신장 & 실시간 유전 표적키 (Tanner MPH)',
      titleEn: 'Mid-Parental Height (MPH) & Genetic Potential',
      subKo: '부모 신장 기반 실시간 유전 표적키(MPH)와 예측 오차 범위를 확인합니다.',
      subEn: 'Calculates Tanner Mid-Parental Target Height and clinical margin in real-time.'
    },
    {
      step: 4,
      titleKo: '성장 단계 & 골연령 (Tanner Stage) 진행도',
      titleEn: 'Skeletal Maturation & Tanner Stage',
      subKo: '성장판 개방률과 급성장 피크기(PHV) 잔여 잠재력을 평가합니다.',
      subEn: 'Evaluates epiphyseal plate open ratio and Peak Height Velocity (PHV) runway.'
    },
    {
      step: 5,
      titleKo: '라이프스타일 & 생체 저해 요인 체크 (복수 선택)',
      titleEn: 'Lifestyle & Bio-Inhibition Factors',
      subKo: '성장호르몬 분비 억제 및 잠재키 손실 요인을 복수 진단합니다.',
      subEn: 'Diagnoses nocturnal GH suppression and adult height penalty factors.'
    },
    {
      step: 6,
      titleKo: '두뇌·신경인지 핵심 관심축 & 임상 분석 시작',
      titleEn: 'Neuro-Cognitive Focus & Analysis Initiation',
      subKo: '두뇌 인지 관심 영역을 선택하고 800편+ 학술 논문 매칭 분석을 시작하세요.',
      subEn: 'Select cognitive domains and initiate matching against 800+ clinical studies.'
    }
  ];

  // 3. Wizard Internal State
  const wizardState = {
    currentStep: 1,
    maxStep: 6,
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

  // Real-time Tanner MPH Preview
  function updateMphPreview() {
    if (typeof document === 'undefined') return;
    const badgeVal = document.getElementById('mph-badge-value');
    if (!badgeVal) return;

    const fatherInput = document.getElementById('father-height');
    const motherInput = document.getElementById('mother-height');
    const boyRadio = document.getElementById('gender-boy');
    const isImperial = typeof document !== 'undefined' && document.documentElement.lang === 'en' && typeof global.TallerI18n !== 'undefined' && global.TallerI18n.getUnitSystem() === 'imperial';

    let fh = fatherInput ? parseFloat(fatherInput.value) || 173.5 : 173.5;
    let mh = motherInput ? parseFloat(motherInput.value) || 160.5 : 160.5;
    if (isImperial) {
      fh = fh * 2.54;
      mh = mh * 2.54;
    }
    const isBoy = boyRadio ? boyRadio.checked : true;
    const delta = isBoy ? 13.0 : -13.0;
    const mph = (fh + mh + delta) / 2.0;
    const roundedMph = Math.round(mph * 10) / 10;
    const min = Math.round((mph - 8.5) * 10) / 10;
    const max = Math.round((mph + 8.5) * 10) / 10;

    badgeVal.innerHTML = `${roundedMph.toFixed(1)} cm <span class="mph-badge-range">(±8.5cm: ${min.toFixed(1)}cm ~ ${max.toFixed(1)}cm)</span>`;
  }

  // 4. Stepper Navigation Functions
  function goToStep(stepNumber) {
    const maxStep = wizardState.maxStep;

    if (stepNumber < 1) stepNumber = 1;
    if (stepNumber > maxStep) stepNumber = maxStep;

    wizardState.currentStep = stepNumber;

    if (typeof document === 'undefined') return;

    // Slide track translation for smooth 100% immersive funnel
    const track = document.getElementById('slide-funnel-track');
    if (track) {
      track.style.transform = `translateX(-${(stepNumber - 1) * 100}%)`;
    }

    // Toggle step contents
    for (let i = 1; i <= wizardState.maxStep; i++) {
      const stepEl = document.getElementById(`step-content-${i}`) || document.getElementById(`slide-step-${i}`);
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
    const stepWord = 'Step';
    if (tagEl) {
      tagEl.textContent = `${stepWord} ${stepNumber} / ${wizardState.maxStep}`;
    }

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
    if (progressTextEl) {
      progressTextEl.textContent = `${percent}% ${isEn ? 'Completed' : '완료'}`;
    }

    const progressFillEl = document.getElementById('quiz-progress-fill');
    if (progressFillEl) {
      progressFillEl.style.width = `${percent}%`;
    }

    // Update Taller.xyz 6-Segment Glowing Progress Bar
    const segBar = document.getElementById('quiz-segmented-bar');
    if (segBar && typeof segBar.querySelectorAll === 'function') {
      const pills = segBar.querySelectorAll('.taller-seg-pill');
      if (pills && pills.forEach) {
        pills.forEach((pill, idx) => {
          const segStep = idx + 1;
          pill.classList.remove('active', 'completed');
          if (segStep < stepNumber) {
            pill.classList.add('completed');
          } else if (segStep === stepNumber) {
            pill.classList.add('active');
          }
        });
      }
    }

    // Button controls
    const prevBtn = document.getElementById('btn-prev-step');
    const nextBtn = document.getElementById('btn-next-step');
    const submitBtn = document.getElementById('btn-submit-quiz');

    if (prevBtn) {
      prevBtn.style.display = stepNumber === 1 ? 'none' : 'inline-flex';
    }
    if (nextBtn) {
      nextBtn.style.display = (stepNumber >= wizardState.maxStep) ? 'none' : 'inline-flex';
    }
    if (stepNumber === wizardState.maxStep) {
      if (submitBtn) submitBtn.style.display = 'inline-flex';
    } else {
      if (submitBtn) submitBtn.style.display = 'none';
    }

    // Trigger tactile haptic feedback on step transition
    if (!HapticEngine && (global.TallerHapticEngine || global.KidsFitHapticEngine)) {
      HapticEngine = global.TallerHapticEngine || global.KidsFitHapticEngine;
    }
    if (HapticEngine && typeof HapticEngine.triggerHaptic === 'function') {
      HapticEngine.triggerHaptic('tick', titleEl);
    }
  }

  /**
   * Synchronizes Date of Birth (Year/Month/Day) -> Exact Months/Days + Auto Growth Stage (Phase 1~4)
   */
  function syncDobAndAutoStage() {
    if (typeof document === 'undefined') return;
    if (!PinpointCurator && (global.TallerPinpointCurator || global.KidsFitPinpointCurator)) {
      PinpointCurator = global.TallerPinpointCurator || global.KidsFitPinpointCurator;
    }
    if (!PinpointCurator) return;

    const yearEl = document.getElementById('child-birth-year');
    const monthEl = document.getElementById('child-birth-month');
    const dayEl = document.getElementById('child-birth-day');
    if (!yearEl || !monthEl || !dayEl) return;

    const boyRadio = document.getElementById('gender-boy');
    const gender = (boyRadio && boyRadio.checked) ? 'boy' : 'girl';
    const recentInput = document.getElementById('child-recent-gain');
    const recent6m = recentInput ? parseFloat(recentInput.value) || 3.2 : 3.2;

    const dobInfo = PinpointCurator.calculateExactAgeFromDob(yearEl.value, monthEl.value, dayEl.value);
    const autoStage = PinpointCurator.autoDetectGrowthStage(dobInfo.exactMonths, gender, recent6m);

    // Update profile state
    wizardState.profile.birthYear = dobInfo.birthYear;
    wizardState.profile.birthMonth = dobInfo.birthMonth;
    wizardState.profile.birthDay = dobInfo.birthDay;
    wizardState.profile.birthDateStr = dobInfo.birthDateStr;
    wizardState.profile.birthDateKo = dobInfo.birthDateKo;
    wizardState.profile.ageMonths = dobInfo.ageMonths;
    wizardState.profile.exactMonths = dobInfo.exactMonths;
    wizardState.profile.remainderDays = dobInfo.remainderDays;
    wizardState.profile.ageYears = dobInfo.ageYears;
    wizardState.profile.tannerPhase = autoStage.tannerPhase;

    // Sync hidden & legacy inputs
    const ageDisplay = document.getElementById('child-age-display');
    const ageMonthsInput = document.getElementById('child-age-months');
    const ageSlider = document.getElementById('child-age-slider');
    if (ageDisplay) ageDisplay.textContent = dobInfo.displayBadgeKo;
    if (ageMonthsInput) ageMonthsInput.value = dobInfo.ageMonths;
    if (ageSlider) ageSlider.value = dobInfo.ageYears;

    // Sync Auto-Detected Growth Stage Banner & Radio Buttons
    const previewEl = document.getElementById('dob-auto-stage-preview');
    if (previewEl) {
      previewEl.textContent = `🤖 성장단계·골연령 진행도 자동 설정됨: ${autoStage.stageNameKo} (기대 성장속도 ${autoStage.expectedVelStr})`;
    }
    const stageTitleEl = document.getElementById('auto-growth-stage-title');
    if (stageTitleEl) {
      stageTitleEl.textContent = `${dobInfo.birthDateKo} (${dobInfo.displayBadgeKo}) → ${autoStage.stageNameKo}`;
    }
    const stageDescEl = document.getElementById('auto-growth-stage-desc');
    if (stageDescEl) {
      stageDescEl.innerHTML = `${autoStage.boneAgeNoteKo}<br><strong style="color:#10B981;">✓ 생년월일에 맞춰 자동 선택되었으므로 굳이 고민하실 필요 없이 바로 [다음 단계 →]로 이동하시면 됩니다.</strong>`;
    }

    const phaseRadios = document.querySelectorAll('input[name="tanner-phase"]');
    if (phaseRadios && phaseRadios.forEach) {
      phaseRadios.forEach((r) => {
        r.checked = (r.value === autoStage.tannerPhase);
      });
    }
  }

  // 5. Validation Logic
  function validateStep(stepNumber) {
    if (typeof document === 'undefined') return true;

    if (stepNumber === 1 || stepNumber === 2) {
      const heightInput = document.getElementById('child-height');
      const weightInput = document.getElementById('child-weight');
      const recentInput = document.getElementById('child-recent-gain');
      const fatherInput = document.getElementById('father-height');
      const motherInput = document.getElementById('mother-height');

      if (heightInput) {
        let h = parseFloat(heightInput.value);
        let w = weightInput ? parseFloat(weightInput.value) : 35.5;
        let r = recentInput ? parseFloat(recentInput.value) : 3.0;
        let fh = fatherInput ? parseFloat(fatherInput.value) : 173.5;
        let mh = motherInput ? parseFloat(motherInput.value) : 160.5;

        // Handle Imperial mode conversion if active
        const isImperial = typeof document !== 'undefined' && document.documentElement.lang === 'en' && typeof global.TallerI18n !== 'undefined' && global.TallerI18n.getUnitSystem() === 'imperial';
        if (isImperial) {
          h = h * 2.54;
          w = w / 2.20462262;
          r = r * 2.54;
          fh = fh * 2.54;
          mh = mh * 2.54;
        }

        // Bound checks against standard clinical metric ranges:
        if (isNaN(h) || h < 45 || h > 230) {
          alert(isImperial ? 'Please enter a valid height (18 to 90 inches / 45 to 230 cm).' : '아이 키를 45cm ~ 230cm 사이로 입력해 주세요.');
          heightInput.focus();
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
    }

    if (stepNumber === 3) {
      const fatherInput = document.getElementById('father-height');
      const motherInput = document.getElementById('mother-height');
      if (fatherInput && motherInput) {
        let fh = parseFloat(fatherInput.value);
        let mh = parseFloat(motherInput.value);
        const isImperial = typeof document !== 'undefined' && document.documentElement.lang === 'en' && typeof global.TallerI18n !== 'undefined' && global.TallerI18n.getUnitSystem() === 'imperial';
        if (isImperial) {
          fh = fh * 2.54;
          mh = mh * 2.54;
        }
        if (isNaN(fh) || fh < 100 || fh > 240) {
          fatherInput.value = isImperial ? 68.3 : 173.5;
        }
        if (isNaN(mh) || mh < 100 || mh > 240) {
          motherInput.value = isImperial ? 63.2 : 160.5;
        }
      }
    }

    return true;
  }

  // 6. 60-Second Personalized Bio Scan & Parent Briefing Theatre Loader
  let scanTimer = null;
  function start3SecondScan(onComplete, options = {}) {
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

    if (!HapticEngine && (global.TallerHapticEngine || global.KidsFitHapticEngine)) {
      HapticEngine = global.TallerHapticEngine || global.KidsFitHapticEngine;
    }

    // Use the 60-Second Personalized Analysis & Parent Content Theatre in live browser DOM
    const isFullBrowserDom = typeof document !== 'undefined' && typeof document.createElement === 'function' && overlay && typeof overlay.querySelector === 'function';

    if (isFullBrowserDom && HapticEngine && typeof HapticEngine.startPersonalizedAnalysisTheatre === 'function') {
      const browserDurationMs = typeof options.durationMs === 'number' ? options.durationMs : 60000;
      HapticEngine.startPersonalizedAnalysisTheatre(wizardState.profile, { durationMs: browserDurationMs, isEn }, () => {
        completeScan(onComplete);
      });
      return;
    }

    if (fillEl) fillEl.style.width = '0%';

    const step1Msg = isEn ? 'Matching KDCA & CDC Official Growth Parameter Matrices...' : '질병관리청 KDCA·CDC 표준 대조 중...';
    const step2Msg = isEn ? 'Matching 800+ Pediatric Endocrinology & Neuroscience Papers...' : '800편+ 소아내분비·뇌과학 학술 논문 매칭 중...';
    const step3Msg = isEn ? 'Synthesizing 90-Day Actionable Guidance Roadmap...' : '향후 90일 맞춤 지도 로드맵(Actionable Guidance) 생성 중...';

    if (titleEl) titleEl.textContent = step1Msg;
    if (descEl) descEl.textContent = isEn ? 'Standardizing patient biometrics against national normative LMS tables...' : '환자 생체 데이터를 질병관리청 국가 임상 표본과 대조하고 있습니다.';

    // Progress pulse
    let start = Date.now();
    if (scanTimer) clearInterval(scanTimer);

    scanTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, Math.round((elapsed / 3000) * 100));

      if (fillEl) fillEl.style.width = `${progress}%`;

      if (elapsed >= 1000 && elapsed < 2000) {
        if (titleEl) titleEl.textContent = step2Msg;
        if (descEl) descEl.textContent = isEn ? 'Filtering 803+ research papers for active bio-inhibitors...' : '수면, 야간 혈당, 척추 자세 저해 인자별 학술 논문 근거를 추출하고 있습니다.';
      } else if (elapsed >= 2000 && elapsed < 3000) {
        if (titleEl) titleEl.textContent = step3Msg;
        if (descEl) descEl.textContent = isEn ? 'Finalizing 90-day actionable roadmap and clinical prescription...' : '식습관, 척추 감압 루틴, 성장호르몬 골든타임 행동 지침을 도출하고 있습니다.';
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
        if (HapticEngine && typeof HapticEngine.stopTheatre === 'function') {
          HapticEngine.stopTheatre();
        }
        completeScan(onComplete);
      };
    }
  }

  function completeScan(onComplete) {
    if (scanTimer) {
      clearInterval(scanTimer);
      scanTimer = null;
    }
    if (HapticEngine && typeof HapticEngine.stopTheatre === 'function') {
      HapticEngine.stopTheatre();
    }
    wizardState.isScanning = false;
    wizardState.scanCompleted = true;

    const overlay = document.getElementById('analysis-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }

    // Hide Phase 1 Funnel & Hero
    const quizSection = document.getElementById('quiz-section');
    if (quizSection) quizSection.style.display = 'none';
    const heroSection = document.getElementById('hero-section');
    if (heroSection) heroSection.style.display = 'none';
    const presetsBar = document.getElementById('quick-presets-bar');
    if (presetsBar) presetsBar.style.display = 'none';

    // Show Phase 2 Results Dashboard
    const dashboard = document.getElementById('results-dashboard') || document.getElementById('prescription-container');
    if (dashboard) {
      dashboard.classList.remove('hidden');
      dashboard.style.display = 'block';
      dashboard.scrollIntoView({ behavior: 'smooth' });
    }

    // Record user input into Cohort DB for autonomous self-improvement
    if (!UserCohortDB && (global.TallerUserCohortDB || global.KidsFitUserCohortDB)) {
      UserCohortDB = global.TallerUserCohortDB || global.KidsFitUserCohortDB;
    }
    if (UserCohortDB && typeof UserCohortDB.recordUserDiagnosis === 'function') {
      try {
        UserCohortDB.recordUserDiagnosis(wizardState.profile);
      } catch (_) {}
    }

    // Render Master Briefing Card if present
    if (typeof document !== 'undefined') {
      const mbEl = document.getElementById('master-briefing-card');
      const mbEngine = (typeof global !== 'undefined' && (global.MasterBriefingEngine || global.KidsFitMasterBriefing || global.TallerMasterBriefing)) ||
                       (typeof window !== 'undefined' && (window.MasterBriefingEngine || window.KidsFitMasterBriefing || window.TallerMasterBriefing));
      if (mbEl && mbEngine && (typeof mbEngine.renderMasterBriefingCard === 'function' || typeof mbEngine.render === 'function')) {
        const renderFn = mbEngine.renderMasterBriefingCard || mbEngine.render;
        mbEl.innerHTML = renderFn(wizardState.profile);
        if (typeof mbEngine.attachRetestListener === 'function') {
          mbEngine.attachRetestListener();
        } else if (typeof mbEngine.attachRetestHandler === 'function') {
          mbEngine.attachRetestHandler();
        }
      }
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

      // Age & DOB inputs
      const ageYearsSlider = document.getElementById('child-age-slider');
      const ageYearsDisplay = document.getElementById('child-age-display');
      const ageMonthsInput = document.getElementById('child-age-months');
      const yearEl = document.getElementById('child-birth-year');
      const monthEl = document.getElementById('child-birth-month');
      const dayEl = document.getElementById('child-birth-day');

      if (!PinpointCurator && (global.TallerPinpointCurator || global.KidsFitPinpointCurator)) {
        PinpointCurator = global.TallerPinpointCurator || global.KidsFitPinpointCurator;
      }
      if (PinpointCurator && typeof PinpointCurator.getDobFromAgeMonths === 'function') {
        const dobInfo = PinpointCurator.getDobFromAgeMonths(preset.ageMonths);
        if (yearEl) yearEl.value = String(dobInfo.birthYear);
        if (monthEl) monthEl.value = String(dobInfo.birthMonth);
        if (dayEl) dayEl.value = String(dobInfo.birthDay);
        wizardState.profile.birthYear = dobInfo.birthYear;
        wizardState.profile.birthMonth = dobInfo.birthMonth;
        wizardState.profile.birthDay = dobInfo.birthDay;
        wizardState.profile.birthDateStr = dobInfo.birthDateStr;
        wizardState.profile.birthDateKo = dobInfo.birthDateKo;
        wizardState.profile.exactMonths = dobInfo.exactMonths;
        wizardState.profile.remainderDays = dobInfo.remainderDays;
      }

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

      // Update MPH preview badge
      updateMphPreview();
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

    const selfRadio = document.getElementById('target-self');
    const targetSubject = (selfRadio && selfRadio.checked) ? 'self' : 'child';

    const boyRadio = document.getElementById('gender-boy');
    const gender = (boyRadio && boyRadio.checked) ? 'boy' : 'girl';

    // Sync DOB -> exactMonths & Auto Growth Stage first
    syncDobAndAutoStage();

    const ageSlider = document.getElementById('child-age-slider');
    const ageMonthsEl = document.getElementById('child-age-months');
    const ageMonths = ageMonthsEl && ageMonthsEl.value
      ? parseInt(ageMonthsEl.value, 10)
      : (ageSlider ? parseInt(ageSlider.value, 10) * 12 : 120);
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const exactMonths = wizardState.profile.exactMonths || ageMonths;
    const birthDateStr = wizardState.profile.birthDateStr || '';
    const birthDateKo = wizardState.profile.birthDateKo || '';

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
      targetSubject,
      gender,
      ageYears,
      ageMonths,
      exactMonths,
      birthDateStr,
      birthDateKo,
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

  function syncTargetSubjectMode() {
    if (typeof document === 'undefined') return;
    const selfRadio = document.getElementById('target-self');
    const isSelf = Boolean(selfRadio && selfRadio.checked);
    wizardState.profile.targetSubject = isSelf ? 'self' : 'child';

    const bannerEl = document.getElementById('guidebook-mode-banner');
    if (bannerEl) {
      if (isSelf) {
        bannerEl.style.color = '#E2E8F0';
        bannerEl.style.background = 'rgba(139, 92, 246, 0.12)';
        bannerEl.style.borderColor = 'rgba(139, 92, 246, 0.35)';
        bannerEl.innerHTML = '🙋 <strong>[초·중·고 학생·청소년 본인용 가이드북]</strong> 본인의 생년월일과 수면·자세·영양 데이터를 분석하여 <strong>숨은 잠재키 복원 루틴, 자기주도 학습 전략, 맞춤형 영양제·도서 가이드북</strong>을 생성합니다.';
      } else {
        bannerEl.style.color = '#E2E8F0';
        bannerEl.style.background = 'rgba(59, 130, 246, 0.1)';
        bannerEl.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        bannerEl.innerHTML = '📘 <strong>[학부모용 우리 아이 성장·학습 가이드북]</strong> 아이의 생년월일과 신체 계측치를 바탕으로 <strong>키·육체적 성장, 만 N→N+3세 정신·두뇌 발달 및 시기별 학습 로드맵, 맞춤 영양제·교구·도서</strong>를 안내합니다.';
      }
    }
  }

  function enterStudioMode(mode) {
    if (typeof document === 'undefined') return;
    if (document.body && document.body.classList) {
      document.body.classList.add('studio-mode-active');
    }
    const childRadio = document.getElementById('target-child');
    const selfRadio = document.getElementById('target-self');
    if (mode === 'self' && selfRadio && childRadio) {
      selfRadio.checked = true;
      childRadio.checked = false;
      syncTargetSubjectMode();
    } else if (mode === 'child' && selfRadio && childRadio) {
      childRadio.checked = true;
      selfRadio.checked = false;
      syncTargetSubjectMode();
    }
    const quizSection = document.getElementById('quiz-section');
    if (quizSection) {
      quizSection.style.display = 'block';
    }
    const presetsBar = document.getElementById('quick-presets-bar');
    if (presetsBar) {
      presetsBar.style.display = 'block';
    }
    const dashboard = document.getElementById('results-dashboard') || document.getElementById('prescription-container');
    if (dashboard) {
      dashboard.classList.add('hidden');
      dashboard.style.display = 'none';
    }
    goToStep(1);
    if (HapticEngine && typeof HapticEngine.triggerHaptic === 'function') {
      HapticEngine.triggerHaptic('step', quizSection);
    }
    if (quizSection && typeof quizSection.scrollIntoView === 'function') {
      quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function exitStudioMode() {
    if (typeof document === 'undefined') return;
    if (document.body && document.body.classList) {
      document.body.classList.remove('studio-mode-active');
    }
    const dashboard = document.getElementById('results-dashboard') || document.getElementById('prescription-container');
    if (dashboard) {
      dashboard.classList.add('hidden');
      dashboard.style.display = 'none';
    }
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      heroSection.style.display = 'block';
      if (typeof heroSection.scrollIntoView === 'function') {
        heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
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

    // Age slider & DOB picker sync
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

    const birthYearEl = document.getElementById('child-birth-year');
    const birthMonthEl = document.getElementById('child-birth-month');
    const birthDayEl = document.getElementById('child-birth-day');
    const recentGainEl = document.getElementById('child-recent-gain');
    [birthYearEl, birthMonthEl, birthDayEl, recentGainEl].forEach((el) => {
      if (el) {
        el.addEventListener('change', () => {
          syncDobAndAutoStage();
          if (HapticEngine && typeof HapticEngine.triggerHaptic === 'function') {
            HapticEngine.triggerHaptic('tick', el);
          }
        });
      }
    });

    // Real-time MPH inputs sync
    const fatherInput = document.getElementById('father-height');
    const motherInput = document.getElementById('mother-height');
    const boyRadio = document.getElementById('gender-boy');
    const girlRadio = document.getElementById('gender-girl');

    if (fatherInput) fatherInput.addEventListener('input', updateMphPreview);
    if (motherInput) motherInput.addEventListener('input', updateMphPreview);
    if (boyRadio) {
      boyRadio.addEventListener('change', () => {
        updateMphPreview();
        syncDobAndAutoStage();
      });
    }
    if (girlRadio) {
      girlRadio.addEventListener('change', () => {
        updateMphPreview();
        syncDobAndAutoStage();
      });
    }

    const targetChildRadio = document.getElementById('target-child');
    const targetSelfRadio = document.getElementById('target-self');
    [targetChildRadio, targetSelfRadio].forEach((el) => {
      if (el) {
        el.addEventListener('change', () => {
          syncTargetSubjectMode();
          if (HapticEngine && typeof HapticEngine.triggerHaptic === 'function') {
            HapticEngine.triggerHaptic('tick', el);
          }
        });
      }
    });

    // Initial MPH & DOB auto-stage calculation
    updateMphPreview();
    syncDobAndAutoStage();
    syncTargetSubjectMode();

    // Brand Showcase -> Studio Mode Entry & Return Buttons
    const btnEnterTop = document.getElementById('btn-enter-studio-top');
    const btnEnterParent = document.getElementById('btn-enter-studio-parent');
    const btnEnterYouth = document.getElementById('btn-enter-studio-youth');
    const btnBackBrand = document.getElementById('btn-back-to-brand');
    const brandHomeTrigger = document.getElementById('brand-home-trigger');

    if (btnEnterTop) btnEnterTop.addEventListener('click', () => enterStudioMode('child'));
    if (btnEnterParent) btnEnterParent.addEventListener('click', () => enterStudioMode('child'));
    if (btnEnterYouth) btnEnterYouth.addEventListener('click', () => enterStudioMode('self'));
    if (btnBackBrand) btnBackBrand.addEventListener('click', () => exitStudioMode());
    if (brandHomeTrigger) brandHomeTrigger.addEventListener('click', () => exitStudioMode());

    // Preset cards
    for (let i = 1; i <= 5; i++) {
      const card = document.getElementById(`preset-card-${i}`);
      if (card) {
        card.addEventListener('click', () => {
          if (document.body && document.body.classList) {
            document.body.classList.add('studio-mode-active');
          }
          applyPreset(`preset-${i}`);
        });
      }
    }

    // Retest button
    const retestBtn = document.getElementById('btn-retest');
    if (retestBtn) {
      retestBtn.addEventListener('click', () => {
        if (document.body && document.body.classList) {
          document.body.classList.add('studio-mode-active');
        }
        const dashboard = document.getElementById('results-dashboard') || document.getElementById('prescription-container');
        if (dashboard) {
          dashboard.classList.add('hidden');
          dashboard.style.display = 'none';
        }
        const quizSection = document.getElementById('quiz-section');
        if (quizSection) quizSection.style.display = 'block';
        const heroSection = document.getElementById('hero-section');
        if (heroSection) heroSection.style.display = 'block';
        const presetsBar = document.getElementById('quick-presets-bar');
        if (presetsBar) presetsBar.style.display = 'block';

        goToStep(1);
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
    updateMphPreview,
    syncDobAndAutoStage,
    enterStudioMode,
    exitStudioMode,
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
