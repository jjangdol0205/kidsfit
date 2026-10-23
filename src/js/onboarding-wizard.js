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
  let GrowthEngine = typeof require !== 'undefined' ? (function () { try { return require('./growth-engine'); } catch (e) { return null; } })() : (global.GrowthEngine || global.KidsFitGrowthEngine || global.TallerGrowthEngine || null);

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
      traitLearningConcerns: ['desk_endurance', 'vocab_expression'],
      traitStudyStyle: 'play_manipulative',
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
      traitLearningConcerns: ['math_concept', 'reading_literacy'],
      traitStudyStyle: 'play_manipulative',
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
      traitLearningConcerns: ['reading_literacy', 'passive_forget'],
      traitStudyStyle: 'dialogue_question',
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
      traitLearningConcerns: ['passive_forget', 'screen_dopamine'],
      traitStudyStyle: 'goal_workbook',
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
      traitLearningConcerns: ['reading_literacy', 'passive_forget'],
      traitStudyStyle: 'dialogue_question',
      region: '대구·경북'
    }
  };

  // 2. Wizard Steps Meta Definition
  const WIZARD_STEPS_GROWTH = [
    {
      step: 1,
      titleKo: '우리 아이 기본 정보 (성별 · 생년월일)',
      titleEn: 'Basic Demographics (Sex · Date of Birth)',
      subKo: '생년월일 일수까지 계산해 또래 평균키와 골연령을 정밀 비교합니다.',
      subEn: 'Utilized for CDC/KDCA LMS national growth charts and normative baselines.'
    },
    {
      step: 2,
      titleKo: '현재 키 · 몸무게 · 최근 6개월 성장폭',
      titleEn: 'Current Stature & Growth Velocity',
      subKo: '요즘 얼마나 자랐는지 입력하면 숨은 잠재키를 정확히 찾아냅니다.',
      subEn: 'Baseline metrics for national LMS percentiles and 6-month growth velocity.'
    },
    {
      step: 3,
      titleKo: '엄마·아빠 키 & 실시간 유전 예상키',
      titleEn: 'Mid-Parental Height (MPH) & Genetic Potential',
      subKo: '부모님 키를 바탕으로 유전 예상키와 관리 후 최대 키를 계산합니다.',
      subEn: 'Calculates Tanner Mid-Parental Target Height and clinical margin in real-time.'
    },
    {
      step: 4,
      titleKo: '성장단계 확인 & 평소 수면·식습관 체크',
      titleEn: 'Growth Stage & Sleep/Diet Habits',
      subKo: '해당하는 습관을 골라주시면 아이에게 딱 맞는 맞춤 영양을 찾아드립니다.',
      subEn: 'Evaluates epiphyseal plate open ratio and sleep/diet traits.'
    },
    {
      step: 5,
      titleKo: '평소 앉는 자세 & 운동 습관 체크',
      titleEn: 'Posture Alignment & Physical Activity',
      subKo: '거북목이나 다리 성장통이 있는지 체크해 숨은 키 2cm를 찾아드립니다.',
      subEn: 'Diagnoses nocturnal GH suppression and adult height penalty factors.'
    },
    {
      step: 6,
      titleKo: '성장·체질 세부 체크 & 맞춤 보고서 발행',
      titleEn: 'Growth Details & Personalized Report',
      subKo: '우리 아이에게 해당하는 항목을 클릭하면 1:1 신체 성장 보고서를 즉시 발행합니다.',
      subEn: 'Generates tailored clinical growth guidance and supplement/exercise prescriptions.'
    }
  ];

  const WIZARD_STEPS_LEARNING = [
    {
      step: 1,
      titleKo: '기본 정보 (성별 · 생년월일)',
      titleEn: 'Basic Demographics (Sex · Date of Birth)',
      subKo: '연령 및 발달 단계에 맞춰 질문과 추천 기준을 자동으로 세팅합니다.',
      subEn: 'Classifies neuro-developmental stage and cognitive baseline.'
    },
    {
      step: 2,
      titleKo: '📖 평소 독서 습관 & 언어·문해력 패턴',
      titleEn: 'Reading Habits & Literacy Comprehension',
      subKo: '아이 나이에 맞춘 그림책·줄글 읽기 및 언어 이해 패턴을 진단합니다.',
      subEn: 'Pinpoints language cognitive processing and reading comprehension gaps.'
    },
    {
      step: 3,
      titleKo: '📐 수리·공간 감각 & 도형 추론 패턴',
      titleEn: 'Mathematical Logic & Spatial Reasoning',
      subKo: '아이 연령에 맞는 수 감각, 도형·공간 지각, 응용 사고력을 진단합니다.',
      subEn: 'Evaluates conceptual mathematics transfer and spatial logic capacity.'
    },
    {
      step: 4,
      titleKo: '⏱️ 놀이·학습 집중 시간 & 미디어 습관',
      titleEn: 'Executive Focus & Dopamine Regulation',
      subKo: '전두엽 자기조절력, 착석 몰입 시간, 미디어 노출 습관을 진단합니다.',
      subEn: 'Measures prefrontal executive function and digital distraction resilience.'
    },
    {
      step: 5,
      titleKo: '🧠 기억·표현 습관 & 자기주도 패턴',
      titleEn: 'Metacognition & SWS Memory Consolidation',
      subKo: '배운 내용을 기억하고 스스로 말·행동으로 표현하는 습관을 진단합니다.',
      subEn: 'Assesses hippocampal long-term consolidation and self-explanation mastery.'
    },
    {
      step: 6,
      titleKo: '🧩 아이 성향·병목 클릭 & 맞춤 보고서 발행',
      titleEn: 'Study Temperament & Personalized Report',
      subKo: '해당하는 성향과 고민을 클릭하면 아이 나이에 맞춘 1:1 두뇌·학습 보고서를 발행합니다.',
      subEn: 'Synthesizes personalized learning roadmap, study methodology, and workbook curation.'
    }
  ];

  let WIZARD_STEPS = WIZARD_STEPS_GROWTH;

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
      traitLearningConcerns: ['reading_literacy'],
      traitStudyStyle: 'dialogue_question',
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

    // Reset Step 6 choices vs Additional Step 7 narrative view when navigating to Step 1..6
    const choicesView = document.getElementById('step-6-choices-view');
    const narrativeView = document.getElementById('step-7-narrative-view');
    if (choicesView) choicesView.style.display = 'block';
    if (narrativeView) narrativeView.style.display = 'none';

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

    // Keep selection keys immediately visible at top of smartphone screen on step transition
    if (typeof document !== 'undefined' && document.body && document.body.classList && document.body.classList.contains('studio-mode-active')) {
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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

    // Clamp valid days per year/month (28/29/30/31)
    const yearNum = parseInt(yearEl.value, 10) || 2016;
    const monthNum = parseInt(monthEl.value, 10) || 5;
    const maxDaysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayEl.options && dayEl.options.length) {
      for (let i = 0; i < dayEl.options.length; i++) {
        const optDay = parseInt(dayEl.options[i].value, 10);
        if (!isNaN(optDay)) {
          dayEl.options[i].disabled = optDay > maxDaysInMonth;
          dayEl.options[i].hidden = optDay > maxDaysInMonth;
        }
      }
    }
    if (parseInt(dayEl.value, 10) > maxDaysInMonth) {
      dayEl.value = String(maxDaysInMonth);
    }

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

    // Auto-sync KDCA 50th percentile standard height & weight unless user manually edited
    if (!GrowthEngine && (global.GrowthEngine || global.KidsFitGrowthEngine || global.TallerGrowthEngine)) {
      GrowthEngine = global.GrowthEngine || global.KidsFitGrowthEngine || global.TallerGrowthEngine;
    }
    if (GrowthEngine && typeof GrowthEngine.getLmsForMonth === 'function') {
      const lms = GrowthEngine.getLmsForMonth(gender, dobInfo.exactMonths || dobInfo.ageMonths);
      if (lms) {
        const heightInput = document.getElementById('child-height');
        const weightInput = document.getElementById('child-weight');
        const roundedH = Math.round((Number(lms.M) || 137.0) * 10) / 10;
        const roundedW = Math.round((Number(lms.wM) || 35.5) * 10) / 10;
        if (heightInput && !(heightInput.dataset && heightInput.dataset.userEdited === 'true')) {
          heightInput.value = roundedH.toFixed(1);
          wizardState.profile.currentHeight = roundedH;
        }
        if (weightInput && !(weightInput.dataset && weightInput.dataset.userEdited === 'true')) {
          weightInput.value = roundedW.toFixed(1);
          wizardState.profile.currentWeight = roundedW;
        }
      }
    }

    // Sync hidden & legacy inputs
    const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
    const ageDisplay = document.getElementById('child-age-display');
    const ageMonthsInput = document.getElementById('child-age-months');
    const ageSlider = document.getElementById('child-age-slider');
    if (ageDisplay) ageDisplay.textContent = isEn ? dobInfo.displayBadgeEn : dobInfo.displayBadgeKo;
    if (ageMonthsInput) ageMonthsInput.value = dobInfo.ageMonths;
    if (ageSlider) ageSlider.value = dobInfo.ageYears;

    // Sync Auto-Detected Growth Stage Banner & Radio Buttons
    const previewEl = document.getElementById('dob-auto-stage-preview');
    if (previewEl) {
      previewEl.textContent = isEn
        ? `✓ Auto-Detected Growth Stage & Bone Age: ${autoStage.stageNameEn} (Expected Velocity: ${autoStage.expectedVelStrEn || autoStage.expectedVelStr})`
        : `✓ 성장단계·골연령 진행도 자동 설정됨: ${autoStage.stageNameKo} (기대 성장속도 ${autoStage.expectedVelStr})`;
    }
    const stageTitleEl = document.getElementById('auto-growth-stage-title');
    if (stageTitleEl) {
      stageTitleEl.textContent = isEn
        ? `${dobInfo.birthDateEn || dobInfo.birthDateStr} (${dobInfo.displayBadgeEn}) → ${autoStage.stageNameEn}`
        : `${dobInfo.birthDateKo} (${dobInfo.displayBadgeKo}) → ${autoStage.stageNameKo}`;
    }
    const stageDescEl = document.getElementById('auto-growth-stage-desc');
    if (stageDescEl) {
      stageDescEl.innerHTML = isEn
        ? `${autoStage.boneAgeNoteEn || autoStage.stageNameEn}<br><strong style="color:#10B981;">✓ Automatically selected based on Date of Birth — proceed directly to [Next Step →] or adjust below if needed.</strong>`
        : `${autoStage.boneAgeNoteKo}<br><strong style="color:#10B981;">✓ 생년월일에 맞춰 자동 선택되었으므로 굳이 고민하실 필요 없이 바로 [다음 단계 →]로 이동하시면 됩니다.</strong>`;
    }

    const phaseRadios = document.querySelectorAll('input[name="tanner-phase"]');
    if (phaseRadios && phaseRadios.forEach) {
      phaseRadios.forEach((r) => {
        r.checked = (r.value === autoStage.tannerPhase);
      });
    }

    syncAgeAppropriateQuizOptions(dobInfo.ageYears);
  }

  /**
   * Adapts survey option text to match the child's age (e.g., 3yo toddler vs 5~6yo vs 7~9yo vs 10+yo)
   * so a 3yo parent never sees "시험 전날 벼락치기" or "복잡한 줄글 책읽기", and an 11yo never sees infant wording.
   */
  function syncAgeAppropriateQuizOptions(ageYears) {
    if (typeof document === 'undefined') return;
    const isEn = document.documentElement.lang === 'en';
    if (isEn) return;

    const age = Number(ageYears) || 10;
    const isToddler = age <= 4;
    const isKinder = age >= 5 && age <= 6;

    const setCheckboxLabel = (name, value, text) => {
      const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (!input || !input.parentElement) return;
      const pill = input.parentElement.querySelector('.chip-pill');
      if (!pill) return;
      const spans = pill.querySelectorAll('span');
      const targetSpan = spans.length > 0 ? spans[spans.length - 1] : pill;
      if (targetSpan) targetSpan.textContent = text;
    };

    if (isToddler) {
      // Ages 1~4: Play, Picture Books, Sensory & Autonomy
      setCheckboxLabel('learning-literacy', 'reading_comprehension', '그림책을 읽어줄 때 끝까지 집중하지 못하고 금방 다른 장난감을 찾아요');
      setCheckboxLabel('learning-literacy', 'vocab_context', '또래보다 새로운 단어를 따라 말하거나 뜻을 이해하는 속도가 느린 편이에요');
      setCheckboxLabel('learning-literacy', 'slow_subvocal', '말소리를 정확하게 발음하거나 두세 문장으로 이어 말하는 게 아직 서툴러요');
      setCheckboxLabel('learning-literacy', 'summary_expression', '자기가 원하는 것이나 감정을 말 대신 떼쓰기·울음·행동으로 먼저 표현해요');
      setCheckboxLabel('learning-literacy', 'active_reader', '그림책 보는 것을 좋아하고 그림 속 사물 이름을 손가락으로 짚으며 잘 말해요');

      setCheckboxLabel('learning-math', 'applied_math_block', '하나·둘·셋 숫자 이름은 말하지만 실제 사물 개수와 일대일로 짝짓기 어려워해요');
      setCheckboxLabel('learning-math', 'spatial_logic_difficulty', '모양 맞추기 퍼즐이나 블록을 위아래·앞뒤로 쌓고 조립하는 걸 힘들어해요');
      setCheckboxLabel('learning-math', 'formula_memorizer', '크다·작다, 길다·짧다, 많다·적다 같은 기초 비교 개념을 헷갈려해요');
      setCheckboxLabel('learning-math', 'error_transfer_gap', '장난감 정리나 색깔·모양별로 끼리끼리 분류하는 놀이를 혼자 하기 어려워해요');
      setCheckboxLabel('learning-math', 'math_explorer', '블록 쌓기나 모양 맞추기, 규칙적인 배열 놀이에 큰 흥미를 보여요');

      setCheckboxLabel('learning-focus', 'distracted_desk', '한 가지 놀잇감에 5~10분 이상 머무르지 못하고 이리저리 자주 옮겨 다녀요');
      setCheckboxLabel('learning-focus', 'dopamine_media', '식사할 때나 이동할 때 스마트폰·태블릿 영상을 봐야만 가만히 있어요');
      setCheckboxLabel('learning-focus', 'procrastination', '손끝을 써야 하는 단추 끼우기·집게 집기·가위질 놀이를 답답해하며 피하려 해요');
      setCheckboxLabel('learning-focus', 'impulsive_mistakes', '기다리는 것을 힘들어하고 마음이 급해 장난감을 던지거나 먼저 손이 나가요');
      setCheckboxLabel('learning-focus', 'deep_focus', '좋아하는 블록이나 촉감·역할 놀이를 할 때는 15분 이상 깊게 빠져들어요');

      setCheckboxLabel('learning-meta', 'passive_illusion', '엄마·아빠가 옆에서 같이 해줄 때만 놀고 혼자서는 놀이를 이어가지 못해요');
      setCheckboxLabel('learning-meta', 'metacognition_lack', '낮에 다녀온 곳이나 방금 읽은 그림책 이야기를 물어보면 대답하기 어려워해요');
      setCheckboxLabel('learning-meta', 'cramming_forget', '어제 배운 단어나 생활 약속(장난감 정리 등)을 다음 날이면 금방 잊어버려요');
      setCheckboxLabel('learning-meta', 'sleep_consolidation_loss', '낮잠 시간이 불규칙하거나 밤 10시 넘어 늦게 자서 낮에 짜증·피로가 많아요');
      setCheckboxLabel('learning-meta', 'daily_retrieval_active', '"이거 왜 그래요?" 질문을 자주 하고 배운 단어를 일상에서 바로 써먹어요');

      setCheckboxLabel('trait-learning-concern', 'reading_literacy', '그림책에 집중하는 시간이 짧고 이야기 흐름을 따라가기 어려워해요');
      setCheckboxLabel('trait-learning-concern', 'math_concept', '수 세기, 모양 맞추기, 블록 조립 같은 기초 공간·수 감각 놀이를 어색해해요');
      setCheckboxLabel('trait-learning-concern', 'passive_forget', '엄마가 도와주지 않으면 혼자 스스로 해보려는 자율성이 부족해요');
      setCheckboxLabel('trait-learning-concern', 'screen_dopamine', '스마트폰·영상 자극에 익숙해져서 손으로 만지는 놀이를 심심해해요');
      setCheckboxLabel('trait-learning-concern', 'desk_endurance', '자리에 앉아 손끝 소근육 놀이(집게·구슬·퍼즐)에 집중하기 힘들어해요');
      setCheckboxLabel('trait-learning-concern', 'vocab_expression', '단어 표현력이 부족하거나 자기 생각을 말로 표현하기 어려워해요');
      setCheckboxLabel('trait-learning-concern', 'test_mistake_anxiety', '낯선 환경이나 새로운 놀이를 만났을 때 실패할까 봐 쉽게 위축돼요');
      setCheckboxLabel('trait-learning-concern', 'habit_self_directed', '매일 정해진 시간에 그림책을 보거나 스스로 정리하는 생활 루틴이 부족해요');
    } else if (isKinder) {
      // Ages 5~6: Kindergarten / Preschool Readiness
      setCheckboxLabel('learning-literacy', 'reading_comprehension', '한글 낱글자는 읽지만 문장 단위로 뜻을 이해하는 속도가 느려요');
      setCheckboxLabel('learning-literacy', 'vocab_context', '모르는 단어가 나오면 앞뒤 그림·이야기 맥락으로 유추하기 어려워해요');
      setCheckboxLabel('learning-literacy', 'slow_subvocal', '글자보다 그림만 대충 넘겨 보거나 소리 내어 읽기를 부담스러워해요');
      setCheckboxLabel('learning-literacy', 'summary_expression', '동화책을 읽고 난 뒤 "왜 그랬을까?" 질문에 자기 생각을 말하기 힘들어해요');
      setCheckboxLabel('learning-literacy', 'active_reader', '이야기책을 즐겨 보고 등장인물의 마음이나 줄거리를 말로 잘 표현해요');

      setCheckboxLabel('learning-math', 'applied_math_block', '손가락으로 숫자는 더하지만 이야기 속 수 놀이(가르기·모으기)를 어려워해요');
      setCheckboxLabel('learning-math', 'spatial_logic_difficulty', '칠교놀이·가베·자석블록으로 입체 모양을 똑같이 만드는 공간 놀이를 힘들어해요');
      setCheckboxLabel('learning-math', 'formula_memorizer', '10 만들기나 수의 크기 비교를 원리보다 단순 순서 외우기로만 해결하려 해요');
      setCheckboxLabel('learning-math', 'error_transfer_gap', '조금만 문제 모양이 바뀌어도 "모르겠어요" 하고 먼저 도움을 요청해요');
      setCheckboxLabel('learning-math', 'math_explorer', '퍼즐 맞추기, 규칙 찾기, 입체 블록 구조물 만들기를 스스로 즐겨요');

      setCheckboxLabel('trait-learning-concern', 'reading_literacy', '한글 읽기 유창성과 짧은 동화책 내용 이해력을 키워주고 싶어요');
      setCheckboxLabel('trait-learning-concern', 'math_concept', '수 가르기·모으기와 도형·공간 감각(칠교·은물·블록)을 탄탄히 잡아주고 싶어요');
      setCheckboxLabel('trait-learning-concern', 'passive_forget', '배운 내용을 엄마에게 말로 설명해 보는 표현·기억 습관이 부족해요');
      setCheckboxLabel('trait-learning-concern', 'screen_dopamine', '영상·미디어 자극에 익숙해져 종이책이나 보드게임에 흥미가 덜해요');
      setCheckboxLabel('trait-learning-concern', 'desk_endurance', '초등학교 입학 전 15~20분 바른 자세로 앉아 집중하는 연습이 필요해요');
      setCheckboxLabel('trait-learning-concern', 'vocab_expression', '어휘력이 부족하거나 자기 생각을 조리 있게 말로 표현하기 어려워해요');
      setCheckboxLabel('trait-learning-concern', 'test_mistake_anxiety', '조금만 어려운 퍼즐이나 활동지가 나오면 틀릴까 봐 시도를 피하려 해요');
      setCheckboxLabel('trait-learning-concern', 'habit_self_directed', '매일 15분씩 스스로 책 읽고 활동지를 끝내는 성취 습관을 길러주고 싶어요');
    } else {
      // Ages 7+: Elementary / Middle / High School
      setCheckboxLabel('learning-literacy', 'reading_comprehension', '긴 글이나 서술형 문장제 문제를 읽고 핵심 파악을 어려워해요');
      setCheckboxLabel('learning-literacy', 'vocab_context', '모르는 어휘가 나오면 앞뒤 문맥 유추를 못 하고 글 전체를 놓쳐요');
      setCheckboxLabel('learning-literacy', 'slow_subvocal', '책을 읽는 속도가 지나치게 느리거나 눈으로만 대충 훑어 읽어요');
      setCheckboxLabel('learning-literacy', 'summary_expression', '책을 다 읽은 후 줄거리 요약이나 느낀 점을 말·서술형 글로 표현하기 힘들어요');
      setCheckboxLabel('learning-literacy', 'active_reader', '스스로 책을 찾아 읽고 글의 행간이나 핵심 문맥을 잘 파악해요');

      setCheckboxLabel('learning-math', 'applied_math_block', '단순 계산·연산은 빠르지만, 문장제 응용문제에서 식을 못 세워요');
      setCheckboxLabel('learning-math', 'spatial_logic_difficulty', '도형 돌리기, 입체 전개도, 기하·공간 추론 문제를 유독 어려워해요');
      setCheckboxLabel('learning-math', 'formula_memorizer', '원리나 개념 이해보다 공식 암기에만 의존해 조금만 변형되어도 틀려요');
      setCheckboxLabel('learning-math', 'error_transfer_gap', '틀린 문제를 설명해줘도 비슷한 유형의 문제에서 똑같이 반복 오답이 나와요');
      setCheckboxLabel('learning-math', 'math_explorer', '규칙 찾기나 논리 추론, 새로운 수학 원리를 스스로 탐구하는 편이에요');

      setCheckboxLabel('learning-focus', 'distracted_desk', '책상에 15~20분 이상 앉아 있기 힘들고 주변 작은 소리나 물건에 산만해져요');
      setCheckboxLabel('learning-focus', 'dopamine_media', '스마트폰 숏폼·유튜브·게임 자극에 익숙해 글자나 공부에 쉽게 지루해해요');
      setCheckboxLabel('learning-focus', 'procrastination', '숙제나 공부를 해야 할 때 자꾸 뒤로 미루고 시작하기까지 딴짓이 많아요');
      setCheckboxLabel('learning-focus', 'impulsive_mistakes', '문제를 꼼꼼히 끝까지 안 읽고 건너뛰거나 계산 부호를 잘못 보는 실수가 잦아요');
      setCheckboxLabel('learning-focus', 'deep_focus', '흥미 있는 분야나 문제에 30~40분 이상 스스로 깊이 몰입해요');

      setCheckboxLabel('learning-meta', 'passive_illusion', '학원·선생님 설명을 들을 땐 알겠는데 혼자 풀면 백지 상태가 돼요');
      setCheckboxLabel('learning-meta', 'metacognition_lack', '배운 내용을 책을 덮고 내 말로 설명하거나 정리(백지복습)하지 못해요');
      setCheckboxLabel('learning-meta', 'cramming_forget', '시험 전날 벼락치기로 외우고, 시험이 끝나면 배운 내용을 금방 잊어버려요');
      setCheckboxLabel('learning-meta', 'sleep_consolidation_loss', '밤늦게까지 공부하거나 늦게 자서 아침에 멍하고 낮에 뇌 피로감이 커요');
      setCheckboxLabel('learning-meta', 'daily_retrieval_active', '그날 배운 핵심 내용을 15분 스스로 정리하고 질문하는 습관이 있어요');

      setCheckboxLabel('trait-learning-concern', 'reading_literacy', '긴 글·문장제 문제를 읽고 이해하는 문해력이 부족해요');
      setCheckboxLabel('trait-learning-concern', 'math_concept', '단순 연산은 해도 도형·응용·사고력 수학에서 막혀해요');
      setCheckboxLabel('trait-learning-concern', 'passive_forget', '학원·설명을 들어도 금방 잊어버리고 자기주도 복습이 안 돼요');
      setCheckboxLabel('trait-learning-concern', 'screen_dopamine', '스마트폰·유튜브 자극에 익숙해 책·공부에 흥미가 없어요');
      setCheckboxLabel('trait-learning-concern', 'desk_endurance', '책상에 20분 이상 바른 자세로 앉아 있기 힘들고 산만해요');
      setCheckboxLabel('trait-learning-concern', 'vocab_expression', '어휘력이 부족하거나 생각을 말·서술형 글로 표현하기 어려워해요');
      setCheckboxLabel('trait-learning-concern', 'test_mistake_anxiety', '아는 문제도 문제집·시험에서 덤벙대며 실수하거나 긴장해서 틀려요');
      setCheckboxLabel('trait-learning-concern', 'habit_self_directed', '스스로 분량을 정해 매일 꾸준히 실천하는 자기주도 습관이 부족해요');
    }
  }

  // 5. Validation Logic
  function validateStep(stepNumber) {
    if (typeof document === 'undefined') return true;
    if (wizardState.preferredReportMode === 'learning') {
      return true; // Skip physical height/weight check in learning mode
    }

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
      const browserDurationMs = typeof options.durationMs === 'number' ? options.durationMs : 4000;
      HapticEngine.startPersonalizedAnalysisTheatre(wizardState.profile, { durationMs: browserDurationMs, isEn }, () => {
        completeScan(onComplete);
      });
      return;
    }

    if (fillEl) fillEl.style.width = '0%';

    const isLearningScan = wizardState.preferredReportMode === 'learning';
    const step1Msg = isEn
      ? (isLearningScan ? 'Matching K-DST & Prefrontal Working Memory Norms...' : 'Matching KDCA & CDC Official Growth Parameter Matrices...')
      : (isLearningScan ? 'K-DST 두뇌 발달 & 전두엽 작업기억 표준 대조 중...' : '질병관리청 KDCA · CDC 국제 표준 성장 파라미터 대조 중...');
    const step2Msg = isEn
      ? (isLearningScan ? 'Matching 2,864 Cognitive Neuroscience & Literacy Papers...' : 'Matching 2,864 Pediatric Endocrinology & Neuroscience Papers...')
      : (isLearningScan ? '2,864편 인지뇌과학·문해력·수리추론 학술 논문 매칭 중...' : '2,864편 소아내분비·뇌과학 학술 논문 매칭 중...');
    const step3Msg = isEn
      ? (isLearningScan ? 'Synthesizing 6-Month Brain & Study Roadmap...' : 'Synthesizing 90-Day Actionable Guidance Roadmap...')
      : (isLearningScan ? '향후 6개월 맞춤 두뇌·공부법 & 연령별 교구 로드맵 생성 중...' : '향후 90일 맞춤 지도 로드맵(Actionable Guidance) 생성 중...');

    if (titleEl) titleEl.textContent = step1Msg;
    if (descEl) {
      descEl.textContent = isEn
        ? 'Standardizing patient biometrics against national normative LMS tables...'
        : (isLearningScan
          ? '아이의 월령별 두뇌 민감기·집중 지속시간·학습 병목 데이터를 인지발달 표본과 대조하고 있습니다.'
          : '아이의 현재 키·몸무게·유전 예상키 데이터를 질병관리청 국가 임상 표본과 대조하고 있습니다.');
    }

    // Progress pulse
    let start = Date.now();
    if (scanTimer) clearInterval(scanTimer);

    scanTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, Math.round((elapsed / 3000) * 100));

      if (fillEl) fillEl.style.width = `${progress}%`;

      if (elapsed >= 1000 && elapsed < 2000) {
        if (titleEl) titleEl.textContent = step2Msg;
        if (descEl) {
          descEl.textContent = isEn
            ? 'Filtering 2,864 research papers for active bio-inhibitors...'
            : (isLearningScan
              ? '문해력, 수리 공간추론, 메타인지 백지복습, 해마 수면 기억코팅 논문 근거를 추출하고 있습니다.'
              : '수면 성장호르몬, 야간 혈당, 척추 자세 및 골든타임 성장판 저해 인자별 논문 근거를 추출하고 있습니다.');
        }
      } else if (elapsed >= 2000 && elapsed < 3000) {
        if (titleEl) titleEl.textContent = step3Msg;
        if (descEl) {
          descEl.textContent = isEn
            ? 'Finalizing 90-day actionable roadmap and clinical prescription...'
            : (isLearningScan
              ? '아이 연령에 꼭 맞는 공부 루틴, 두뇌 교구·도서, 박물관 배경지식 코스를 도출하고 있습니다.'
              : '식습관, 적정 몸무게 밸런스, 척추 감압 루틴, 연령별 성장 영양 행동 지침을 도출하고 있습니다.');
        }
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

    // Async sync of parent free-text narrative to Antigravity server endpoint (non-blocking)
    if (typeof window !== 'undefined' && typeof window.fetch === 'function' && wizardState.profile && wizardState.profile.parentFreeNote) {
      try {
        window.fetch('/api/bespoke-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            profile: wizardState.profile,
            parentFreeNote: wizardState.profile.parentFreeNote
          })
        }).catch(() => {});
      } catch (_) {}
    }

    // Trigger onComplete callback (or fallback render if no callback provided)
    if (typeof onComplete === 'function') {
      onComplete(wizardState.profile);
    } else if (typeof document !== 'undefined') {
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
        if (typeof mbEngine.switchActiveReport === 'function') {
          mbEngine.switchActiveReport(wizardState.preferredReportMode || 'growth');
        }
      }
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

    const formEl = typeof document !== 'undefined' ? document.getElementById('diagnosis-form') : null;
    const isLearningFormActive = Boolean(formEl && formEl.className && formEl.className.includes('wizard-mode-learning'));
    const activeReportMode = isLearningFormActive
      ? 'learning'
      : ((wizardState.preferredReportMode === 'learning') ? 'learning' : 'growth');

    wizardState.preferredReportMode = activeReportMode;
    if (typeof window !== 'undefined') {
      window.__KIDSFIT_PREFERRED_REPORT_MODE = activeReportMode;
    }
    if (typeof global !== 'undefined') {
      global.__KIDSFIT_PREFERRED_REPORT_MODE = activeReportMode;
    }

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
      traitLearningConcerns: Array.isArray(preset.traitLearningConcerns) ? [...preset.traitLearningConcerns] : ['reading_literacy'],
      traitStudyStyle: preset.traitStudyStyle || 'dialogue_question',
      region: preset.region,
      preferredReportMode: activeReportMode
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

      if (heightInput) {
        heightInput.value = preset.currentHeight;
        if (heightInput.dataset) delete heightInput.dataset.userEdited;
      }
      if (weightInput) {
        weightInput.value = preset.currentWeight;
        if (weightInput.dataset) delete weightInput.dataset.userEdited;
      }
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

      // Learning Concerns Checkboxes & Study Style Select
      const learningCheckboxes = document.querySelectorAll('input[name="trait-learning-concern"]');
      if (learningCheckboxes && learningCheckboxes.forEach && Array.isArray(preset.traitLearningConcerns)) {
        learningCheckboxes.forEach((cb) => {
          cb.checked = preset.traitLearningConcerns.includes(cb.value);
        });
      }
      const studyStyleSelect = document.getElementById('trait-study-style');
      if (studyStyleSelect && preset.traitStudyStyle) {
        studyStyleSelect.value = preset.traitStudyStyle;
      }

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

    // Child-Specific Deep Traits (Multi-Select Checkboxes + Fallback Select)
    const readMultiTrait = (name, idFallback, defaultVal) => {
      const checked = [];
      const boxes = document.querySelectorAll(`input[name="${name}"]:checked`);
      if (boxes && boxes.length > 0) {
        boxes.forEach((cb) => checked.push(cb.value));
      } else {
        const el = document.getElementById(idFallback);
        if (el && el.value) checked.push(el.value);
      }
      if (checked.length === 0) checked.push(defaultVal);
      return checked;
    };

    const traitSleepList = readMultiTrait('trait-sleep-quality', 'trait-sleep-quality', 'late_bedtime');
    const traitDietList = readMultiTrait('trait-diet-digestion', 'trait-diet-digestion', 'small_appetite');
    const traitPostureList = readMultiTrait('trait-posture-type', 'trait-posture-type', 'turtle_slouch');
    const traitTemperamentList = readMultiTrait('trait-temperament', 'trait-temperament', 'explorer');
    let traitLearningConcerns = readMultiTrait('trait-learning-concern', 'trait-learning-concern', 'reading_literacy');

    const exerciseTraitEl = document.getElementById('trait-exercise-freq');
    const focusTraitEl = document.getElementById('trait-focus-span');
    const studyStyleEl = document.getElementById('trait-study-style');
    const freeNoteEl = document.getElementById('parent-free-note');

    const traitSleep = traitSleepList[0] || 'late_bedtime';
    const traitDiet = traitDietList[0] || 'small_appetite';
    const traitPosture = traitPostureList[0] || 'turtle_slouch';
    const traitExercise = exerciseTraitEl && exerciseTraitEl.value ? exerciseTraitEl.value : 'low_indoor';
    const traitTemperament = traitTemperamentList[0] || 'explorer';
    const traitFocusSpan = focusTraitEl && focusTraitEl.value ? focusTraitEl.value : '15_20m';
    const traitStudyStyle = studyStyleEl && studyStyleEl.value ? studyStyleEl.value : 'dialogue_question';

    const getCheckedValues = (name) => {
      const arr = [];
      if (typeof document === 'undefined') return arr;
      const boxes = document.querySelectorAll(`input[name="${name}"]:checked`);
      if (boxes && boxes.length > 0) {
        boxes.forEach((cb) => arr.push(cb.value));
      }
      return arr;
    };

    const learningLiteracy = getCheckedValues('learning-literacy');
    const learningMath = getCheckedValues('learning-math');
    const learningFocus = getCheckedValues('learning-focus');
    const learningMeta = getCheckedValues('learning-meta');
    const traitGrowthDetails = getCheckedValues('trait-growth-detail');

    if (learningLiteracy.length || learningMath.length || learningFocus.length || learningMeta.length) {
      const mappedConcerns = [...traitLearningConcerns];
      if (learningLiteracy.some(v => v !== 'active_reader')) mappedConcerns.push('reading_literacy');
      if (learningLiteracy.includes('vocab_context') || learningLiteracy.includes('summary_expression')) mappedConcerns.push('vocab_expression');
      if (learningMath.some(v => v !== 'math_explorer')) mappedConcerns.push('math_concept');
      if (learningFocus.includes('distracted_desk') || learningFocus.includes('procrastination') || learningFocus.includes('impulsive_mistakes')) mappedConcerns.push('desk_endurance');
      if (learningFocus.includes('dopamine_media')) mappedConcerns.push('screen_dopamine');
      if (learningMeta.some(v => v !== 'daily_retrieval_active')) mappedConcerns.push('passive_forget');

      traitLearningConcerns = Array.from(new Set([
        ...mappedConcerns,
        ...learningLiteracy,
        ...learningMath,
        ...learningFocus,
        ...learningMeta
      ]));
    }

    const parentFreeNote = freeNoteEl && typeof freeNoteEl.value === 'string'
      ? freeNoteEl.value.trim()
      : (wizardState.profile.parentFreeNote || '');

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
      region,
      traitSleep,
      traitSleepList,
      traitDiet,
      traitDietList,
      traitPosture,
      traitPostureList,
      traitExercise,
      traitTemperament,
      traitTemperamentList,
      traitFocusSpan,
      traitLearningConcerns,
      learningLiteracy,
      learningMath,
      learningFocus,
      learningMeta,
      traitGrowthDetails,
      traitStudyStyle,
      parentFreeNote,
      preferredReportMode: wizardState.preferredReportMode || (typeof window !== 'undefined' && window.__KIDSFIT_PREFERRED_REPORT_MODE) || 'growth'
    };

    return wizardState.profile;
  }

  function syncTargetSubjectMode() {
    if (typeof document === 'undefined') return;
    const isEn = document.documentElement.lang === 'en';
    const selfRadio = document.getElementById('target-self');
    const isSelf = Boolean(selfRadio && selfRadio.checked);
    wizardState.profile.targetSubject = isSelf ? 'self' : 'child';
    const prefMode = wizardState.preferredReportMode || (typeof window !== 'undefined' && window.__KIDSFIT_PREFERRED_REPORT_MODE) || 'both';

    const bannerEl = document.getElementById('guidebook-mode-banner');
    if (bannerEl) {
      if (isSelf) {
        bannerEl.style.color = '#E2E8F0';
        bannerEl.style.background = 'rgba(139, 92, 246, 0.12)';
        bannerEl.style.borderColor = 'rgba(139, 92, 246, 0.35)';
        bannerEl.innerHTML = isEn
          ? '🙋 <strong>[Youth & Student Self-Coaching Guidebook]</strong> Hidden Height Recovery Routine & Supplement/Book Guide.'
          : '🙋 <strong>[학생·본인용 맞춤 가이드북]</strong> 내 잠재키·수면·자세·영양 및 자기주도 학습 루틴을 안내해 드립니다.';
      } else if (prefMode === 'growth') {
        bannerEl.style.color = '#BAE6FD';
        bannerEl.style.background = 'rgba(14, 116, 144, 0.2)';
        bannerEl.style.borderColor = 'rgba(56, 189, 248, 0.45)';
        bannerEl.innerHTML = isEn
          ? '📏 <strong>[Report 1: Physical Growth Master Mode]</strong> Dedicated physical growth, bone-age & nutrition report.'
          : '📏 <strong>[별도 보고서 1 · 신체 성장 진단 모드]</strong> 진단 완료 시 【아이 신체 성장 마스터 분석 보고서】가 먼저 단독으로 열립니다.';
      } else if (prefMode === 'learning') {
        bannerEl.style.color = '#E9D5FF';
        bannerEl.style.background = 'rgba(88, 28, 135, 0.24)';
        bannerEl.style.borderColor = 'rgba(168, 85, 247, 0.5)';
        bannerEl.innerHTML = isEn
          ? '🧠 <strong>[Report 2: Brain & Learning Master Mode]</strong> Dedicated 5-axis LQ, study bottlenecks & textbook roadmap report.'
          : '🧠 <strong>[별도 보고서 2 · 두뇌·학습 진단 모드]</strong> 진단 완료 시 【아이 두뇌·학습 마스터 분석 보고서】가 먼저 단독으로 열립니다.';
      } else {
        bannerEl.style.color = '#E2E8F0';
        bannerEl.style.background = 'rgba(59, 130, 246, 0.1)';
        bannerEl.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        bannerEl.innerHTML = isEn
          ? '📘 <strong>[Parent\'s Child Growth & Learning Guidebook]</strong> Height Growth, Brain Roadmap & Pinpoint Supplements/Toys/Books.'
          : '📘 <strong>[학부모용 가이드북]</strong> 【보고서 1: 신체 성장】과 【보고서 2: 두뇌·학습】을 각각 정밀 발행합니다.';
      }
    }
  }

  function enterStudioMode(mode, reportMode) {
    if (typeof document === 'undefined') return;
    const activeMode = (reportMode === 'learning') ? 'learning' : 'growth';
    wizardState.preferredReportMode = activeMode;
    if (wizardState.profile) {
      wizardState.profile.preferredReportMode = activeMode;
    }
    if (typeof window !== 'undefined') {
      window.__KIDSFIT_PREFERRED_REPORT_MODE = activeMode;
      if (window.KidsFitApp && window.KidsFitApp.state && window.KidsFitApp.state.profile) {
        window.KidsFitApp.state.profile.preferredReportMode = activeMode;
      }
    }
    if (typeof global !== 'undefined') {
      global.__KIDSFIT_PREFERRED_REPORT_MODE = activeMode;
      if (global.KidsFitApp && global.KidsFitApp.state && global.KidsFitApp.state.profile) {
        global.KidsFitApp.state.profile.preferredReportMode = activeMode;
      }
    }
    WIZARD_STEPS = (activeMode === 'learning') ? WIZARD_STEPS_LEARNING : WIZARD_STEPS_GROWTH;

    const formEl = document.getElementById('diagnosis-form');
    if (formEl) {
      formEl.className = (activeMode === 'learning') ? 'wizard-mode-learning' : 'wizard-mode-growth';
    }

    const bannerEl = document.getElementById('guidebook-mode-banner');
    if (bannerEl) {
      if (activeMode === 'learning') {
        bannerEl.style.color = '#DDD6FE';
        bannerEl.style.background = 'rgba(168, 85, 247, 0.15)';
        bannerEl.style.borderColor = 'rgba(192, 132, 252, 0.45)';
        bannerEl.innerHTML = '🧠 <strong>[두뇌·학습 뇌과학 정밀 진단]</strong> K-DST 발달검사 & 뇌인지 과학 논문 기반 문해력·수리사고·집중력·공부법 가이드북을 발행합니다.';
      } else {
        bannerEl.style.color = '#38BDF8';
        bannerEl.style.background = 'rgba(56, 189, 248, 0.12)';
        bannerEl.style.borderColor = 'rgba(56, 189, 248, 0.35)';
        bannerEl.innerHTML = '📏 <strong>[신체 성장 정밀 진단]</strong> 질병관리청(KDCA) 소아청소년 성장도표 & 논문 기반 키·골연령·성장판 가이드북을 발행합니다.';
      }
    }

    const submitBtnEl = document.getElementById('btn-submit-quiz');
    if (submitBtnEl) {
      submitBtnEl.textContent = (activeMode === 'learning')
        ? '✦ 선택한 설문 항목 기반 두뇌·학습 보고서 보기 →'
        : '✦ 선택한 설문 항목 기반 신체 성장 보고서 보기 →';
    }

    if (document.body && document.body.classList) {
      document.body.classList.add('studio-mode-active');
    }
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      heroSection.style.display = 'none';
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
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (quizSection && typeof quizSection.scrollIntoView === 'function') {
      quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function exitStudioMode() {
    if (typeof document === 'undefined') return;
    if (document.body && document.body.classList) {
      document.body.classList.remove('studio-mode-active');
    }
    const quizSection = document.getElementById('quiz-section');
    if (quizSection) {
      quizSection.style.display = 'none';
    }
    const presetsBar = document.getElementById('quick-presets-bar');
    if (presetsBar) {
      presetsBar.style.display = 'none';
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

    const submitBtn = document.getElementById('btn-submit-quiz');

    const triggerFinalSubmission = (e) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      if (wizardState.isScanning) return;
      if (validateStep(wizardState.currentStep)) {
        try {
          readProfileFromForm();
        } catch (err) {
          if (typeof console !== 'undefined' && console.error) {
            console.error('[OnboardingWizard] readProfileFromForm error:', err);
          }
        }
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
    };

    if (form) {
      form.addEventListener('submit', triggerFinalSubmission);
    }
    if (submitBtn) {
      submitBtn.addEventListener('click', triggerFinalSubmission);
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
    const heightInputEl = document.getElementById('child-height');
    const weightInputEl = document.getElementById('child-weight');
    [heightInputEl, weightInputEl].forEach((el) => {
      if (el) {
        el.addEventListener('input', () => {
          if (el.dataset) el.dataset.userEdited = 'true';
        });
      }
    });
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

    // Listen to language switch events so dynamic wizard labels update immediately
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('taller-language-change', () => {
        goToStep(wizardState.currentStep);
        syncDobAndAutoStage();
        syncTargetSubjectMode();
        updateMphPreview();
      });
    }

    // Brand Showcase -> Studio Mode Entry & Return Buttons
    const btnEnterTop = document.getElementById('btn-enter-studio-top');
    const btnEnterLearning = document.getElementById('btn-enter-studio-learning');
    const btnHomeStartGrowth = document.getElementById('btn-home-start-growth-report');
    const btnHomeStartLearning = document.getElementById('btn-home-start-learning-report');
    const btnEnterParent = document.getElementById('btn-enter-studio-parent');
    const btnEnterYouth = document.getElementById('btn-enter-studio-youth');
    const btnBackBrand = document.getElementById('btn-back-to-brand');
    const brandHomeTrigger = document.getElementById('brand-home-trigger');

    if (btnEnterTop) btnEnterTop.addEventListener('click', () => enterStudioMode('child', 'growth'));
    if (btnEnterLearning) btnEnterLearning.addEventListener('click', () => enterStudioMode('child', 'learning'));
    if (btnHomeStartGrowth) btnHomeStartGrowth.addEventListener('click', () => enterStudioMode('child', 'growth'));
    if (btnHomeStartLearning) btnHomeStartLearning.addEventListener('click', () => enterStudioMode('child', 'learning'));
    if (btnEnterParent) btnEnterParent.addEventListener('click', () => enterStudioMode('child', 'growth'));
    if (btnEnterYouth) btnEnterYouth.addEventListener('click', () => enterStudioMode('self', 'growth'));
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

    // Quick-Tap Example Chips for Parent Free-Text Narrative Input
    const freeNoteChips = typeof document.querySelectorAll === 'function'
      ? document.querySelectorAll('.free-note-chip-btn')
      : [];
    const freeNoteTextarea = document.getElementById('parent-free-note');
    if (freeNoteChips && freeNoteChips.forEach && freeNoteTextarea) {
      freeNoteChips.forEach((btn) => {
        btn.addEventListener('click', () => {
          const snippet = btn.getAttribute('data-note-snippet') || '';
          if (!snippet) return;
          const cur = (freeNoteTextarea.value || '').trim();
          if (!cur.includes(snippet)) {
            freeNoteTextarea.value = cur ? `${cur} ${snippet}` : snippet;
          }
          wizardState.profile.parentFreeNote = freeNoteTextarea.value.trim();
          btn.style.borderColor = '#34D399';
          btn.style.background = 'rgba(16, 185, 129, 0.18)';
          btn.style.color = '#6EE7B7';
          if (HapticEngine && typeof HapticEngine.triggerHaptic === 'function') {
            HapticEngine.triggerHaptic('tick', btn);
          }
        });
      });
    }

    // Retest button (deduplicated single delegator)
    const retestBtn = document.getElementById('btn-retest');
    if (retestBtn) {
      retestBtn._currentRetestFn = () => {
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
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (quizSection) {
          quizSection.scrollIntoView({ behavior: 'smooth' });
        }
      };
      if (!retestBtn._retestDelegatorBound) {
        retestBtn._retestDelegatorBound = true;
        retestBtn.addEventListener('click', (e) => {
          if (typeof retestBtn._currentRetestFn === 'function') {
            retestBtn._currentRetestFn(e);
          }
        });
      }
    }
  }

  function openAdditionalNarrativeStep() {
    if (typeof document === 'undefined') return;
    const choicesView = document.getElementById('step-6-choices-view');
    const narrativeView = document.getElementById('step-7-narrative-view');
    if (choicesView) choicesView.style.display = 'none';
    if (narrativeView) narrativeView.style.display = 'block';

    const tagEl = document.getElementById('quiz-step-tag');
    const titleEl = document.getElementById('quiz-step-title');
    const subtitleEl = document.getElementById('quiz-step-subtitle');
    const prevBtn = document.getElementById('btn-prev-step');

    if (tagEl) tagEl.textContent = '추가 심층 단계 (진단 6단계 + 아이 특징 합산)';
    if (titleEl) titleEl.textContent = '💬 우리 아이 특징·잘하는 점·부족한 점을 길게 적어주세요';
    if (subtitleEl) subtitleEl.textContent = '진단 1~6단계 객관식 결과와 부모님이 적어주신 아이 특징을 더해서 세상에 하나뿐인 맞춤 보고서를 만듭니다.';
    if (prevBtn) prevBtn.style.display = 'none';

    const noteEl = document.getElementById('parent-free-note');
    if (noteEl && typeof noteEl.focus === 'function') {
      try { noteEl.focus(); } catch (_) {}
    }
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function closeAdditionalNarrativeStep() {
    if (typeof document === 'undefined') return;
    goToStep(6);
  }

  function submitQuiz(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (wizardState.isScanning) return;
    if (validateStep(wizardState.currentStep)) {
      try {
        readProfileFromForm();
      } catch (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[OnboardingWizard] readProfileFromForm error:', err);
        }
      }
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
  }

  // Export
  const OnboardingWizard = {
    PRESETS,
    WIZARD_STEPS,
    state: wizardState,
    getState: () => wizardState,
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
    openAdditionalNarrativeStep,
    closeAdditionalNarrativeStep,
    submitQuiz,
    initWizard
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingWizard;
  } else {
    global.TallerOnboardingWizard = OnboardingWizard;
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
          initWizard();
        });
      } else {
        initWizard();
      }
    }
  }

})(typeof window !== 'undefined' ? window : global);
