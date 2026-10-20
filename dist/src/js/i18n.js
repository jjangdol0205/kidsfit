/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * Bilingual (EN ↔ KO) Internationalization & Unit Conversion Engine (src/js/i18n.js)
 * 
 * Features:
 * - Dual Standard & Language Support:
 *   - Global Mode (EN): US CDC 2000 & WHO Growth Standards, Imperial units (ft/in, lbs)
 *   - Korean Mode (KO): KDCA 2017 Growth Standards, Metric units (cm, kg)
 * - Bidirectional precision unit conversions:
 *   - cm <-> ft/in
 *   - kg <-> lbs
 * - Reactive dictionary lookup & DOM synchronization
 * - localStorage persistence ('taller_lang', 'taller_unit')
 */

(function (global) {
  'use strict';

  // 1. Translation Dictionary
  const DICTIONARY = {
    ko: {
      // Header & Brand
      'brand.title': 'KIDS-FIT AI',
      'brand.tagline': '키 · 육체적 · 정신적 성장 & 맞춤 학습 가이드 플랫폼',
      'trust.badge': 'Built on Official Standards: 질병관리청 소아청소년 성장도표 & 보건복지부 영유아 발달선별검사(K-DST) 기준 적용',
      'nav.auxology': '신체 성장 & 골연령 궤적',
      'nav.endocrinology': '호르몬·수면 & 임상 영양',
      'nav.biomechanics': '척추 감압 & 생체역학',
      'nav.neuro': '뇌인지 & 탐구 로드맵',
      'nav.tracker': '90일 트래커 & A4 리포트',
      'theme.dark': '🌙 Dark Mode',
      'theme.light': '☀️ Light Mode',
      'lang.toggle': '🇺🇸 EN',

      // Hero
      'hero.badge': 'K-GROWTH AI™ · 학부모 & 초·중·고 학생 맞춤 성장·학습 플랫폼',
      'hero.headline': '아이의 키·몸·마음 성장과 학습이 고민인 부모님,\n더 크고 싶은 학생이 찾던 해답이 여기 있습니다',
      'hero.subtitle': '생년월일과 현재 상태만 입력하면, 독자 개발 AI가 숨은 잠재키 예측부터 시기별 정신·두뇌 발달, 맞춤 학습법, 꼭 필요한 영양제·교구·도서까지 한 권의 가이드북으로 정리해 드립니다.',

      // Presets
      'presets.badge': '연령대별 빠른 데모',
      'presets.title': '임상 케이스 1초 시뮬레이션 프리셋',
      'presets.hint': '연령별 전형적인 성장·발달 임상 데이터를 즉시 로드하여 분석을 확인합니다.',
      'preset.1.badge': '영유아기 3세',
      'preset.1.title': '기초 성장기 & 소근육 협응',
      'preset.1.desc': '성장판 개방률 90%+, 감각·예술 표현 골든타임',
      'preset.2.badge': '아동기 7세',
      'preset.2.title': '수리·공간 논리 & 바른 자세 정렬',
      'preset.2.desc': '안정적 성장속도 유지 및 척추 정렬 관리',
      'preset.3.badge': '사춘기 진입 10세',
      'preset.3.title': '사춘기 초기 수면·호르몬 최적화',
      'preset.3.desc': '성장호르몬 분비 극대화 및 심야 혈당 스파이크 방어',
      'preset.4.badge': '급성장기 13세',
      'preset.4.title': 'PHV 급성장 피크 집중 처방',
      'preset.4.desc': '연 8~10cm 폭풍 성장 골든타임 & 전두엽 실행기능 몰입',
      'preset.5.badge': '후기 청소년 16세',
      'preset.5.title': '체형 완성기 척추 디스크 복원',
      'preset.5.desc': '성장판 폐쇄 전 척추 감압으로 숨은 키 1.5~2.5cm 복원',

      // Wizard Steps
      'wizard.step': '단계',
      'wizard.step1.title': '기본 신체 계측 & 유전 데이터',
      'wizard.step1.sub': 'CDC 및 질병관리청 LMS 파라미터 백분위와 유전 표적키(MPH) 산출에 사용됩니다.',
      'wizard.step2.title': '성장 단계 & 골연령 (Tanner Stage) 진행도',
      'wizard.step2.sub': '성장판 개방률과 급성장 피크기(PHV) 잔여 잠재력을 평가합니다.',
      'wizard.step3.title': '라이프스타일 & 생체 저해 요인 체크',
      'wizard.step3.sub': '성장호르몬 분비 억제 및 잠재키 손실 요인을 복수 진단합니다.',
      'wizard.step4.title': '두뇌·신경인지 핵심 관심 축 (5대 영역)',
      'wizard.step4.sub': '연령별 대뇌 피질 재조직화 및 신경가소성 자극 프로토콜을 설정합니다.',
      'wizard.step5.title': '바이오 통계 연산 및 궤적 모델링',
      'wizard.step5.sub': 'LMS Z-Score, 24시간 호르몬 곡선 및 3단 성인 예측키를 산출 중입니다.',

      // Form Labels
      'label.gender': '아이 성별',
      'label.gender.boy': '남아 (Boy)',
      'label.gender.girl': '여아 (Girl)',
      'label.age': '만 나이 (연령 슬라이더)',
      'label.height': '현재 신장 (Height)',
      'label.weight': '현재 체중 (Weight)',
      'label.recentGrowth': '최근 6개월간 자란 키 (연간 성장속도 산출용)',
      'label.fatherHeight': '아버지 신장 (Father Height)',
      'label.motherHeight': '어머니 신장 (Mother Height)',
      'label.prev': '← 이전 단계',
      'label.next': '다음 단계 →',
      'label.scan': '🔬 3초 바이오 스캔 분석 시작',

      // Tanner Phases
      'phase.1.title': 'Phase 1. 기초 성장기 (영유아·아동기)',
      'phase.1.desc': '성장판 개방률 90%+, 연 5~6cm 꾸준한 성장 구간',
      'phase.2.title': 'Phase 2. 급성장 피크기 (사춘기 초기 PHV)',
      'phase.2.desc': '성장호르몬 및 IGF-1 분비 폭발, 골든타임 최대 가속 구간',
      'phase.3.title': 'Phase 3. 감속·성숙기 (변성기·초경 이후)',
      'phase.3.desc': '성장판 폐쇄 직전, 마지막 잔여 잠재력 4~7cm 보존 구간',
      'phase.4.title': 'Phase 4. 체형·자세 완성기 (후기 청소년)',
      'phase.4.desc': '척추 디스크 감압 및 거북목·골반 정렬로 숨은 키 1.5~2.5cm 복원 구간',

      // Habits
      'habit.late_sleep': '수면 리듬 지연 (밤 10:30 이후 취침 또는 얕은 수면)',
      'habit.night_carbs': '야간 혈당 스파이크 (취침 2시간 전 야식·단 음료 섭취)',
      'habit.poor_posture': '자세 불균형 (스마트폰·책상 거북목·굽은 등·골반 비대칭)',
      'habit.picky_eater': '영양 불균형 (단백질·채소 편식 또는 유제품 소화 불편)',
      'habit.sedentary': '신체활동 부족 (하루 30분 이상 점프·유산소 운동 부족)',

      // Cognitive Axes
      'cog.math_logic': '수리·공간·논리적 사고력 (도형·구조·퍼즐·문제해결)',
      'cog.language_reading': '언어·문해력·비판적 독서 (어휘 확장·글쓰기·인문 맥락)',
      'cog.science_nature': '과학·자연·기술 탐구력 (우주·생물·원리 실험·탐구)',
      'cog.sensory_arts': '감각·예술·창의적 표현력 (시각예술·음악·신체 협응)',
      'cog.executive_focus': '전두엽 실행기능 & 자기주도 집중력 (목표 설정·자기조절)',

      // Loader
      'loader.step1': 'CDC 2000 & KDCA 2017 LMS 파라미터 매트릭스 로딩 중...',
      'loader.step2': 'Z-Score 표준화 및 3단 성인 예측키 궤적 모델링 연산 중...',
      'loader.step3': '호르몬 분비 억제율 및 5각 신경인지 밸런스 프로토콜 생성 완료!',
      'loader.skip': '즉시 결과 보기 ↗',

      // Results
      'rx.retest': '🔄 재문진 및 데이터 변경',
      'rx.standard.kdca': '질병관리청(KDCA 2017) 소아청소년 표준 성장도표 적용',
      'rx.standard.cdc': 'US CDC 2000 & WHO Clinical Growth Standards Applied'
    },

    en: {
      // Header & Brand
      'brand.title': 'KIDS-FIT AI',
      'brand.tagline': 'Height · Physical · Mental Growth & Personalized Learning Platform',
      'trust.badge': 'Built on Official Standards: US CDC 2000, WHO & KDCA Pediatric Auxology',
      'nav.auxology': 'Physical Growth & Auxology',
      'nav.endocrinology': 'Endocrinology & Bio-Nutrition',
      'nav.biomechanics': 'Biomechanics & Posture',
      'nav.neuro': 'Neuro-Cognitive Matrix',
      'nav.tracker': '90-Day Tracker & A4 PDF',
      'theme.dark': '🌙 Dark Mode',
      'theme.light': '☀️ Light Mode',
      'lang.toggle': '🇰🇷 한국어',

      // Hero
      'hero.badge': 'K-GROWTH AI™ · For Concerned Parents & Growing Students',
      'hero.headline': 'For Parents Concerned About Growth & Learning,\nAnd Students Who Want to Grow Taller — Your Answer Is Here',
      'hero.subtitle': 'Enter your birth date and current stats. Our proprietary AI builds a clear, personalized guidebook covering potential height, mental & brain development, age-fit learning, and pinpoint nutrition & books.',

      // Presets
      'presets.badge': 'Clinical Demo Presets',
      'presets.title': 'Instant 1-Second Pediatric Simulations',
      'presets.hint': 'Select an age profile to instantly simulate official growth trajectories and intervention protocols.',
      'preset.1.badge': 'Toddler 3 Yrs',
      'preset.1.title': 'Foundation Auxology & Motor Skills',
      'preset.1.desc': 'Epiphyseal plate 90%+ open; sensory-motor integration window',
      'preset.2.badge': 'Childhood 7 Yrs',
      'preset.2.title': 'Spatial Logic & Postural Alignment',
      'preset.2.desc': 'Steady annual velocity monitoring and thoracic posture alignment',
      'preset.3.badge': 'Puberty 10 Yrs',
      'preset.3.title': 'Early Pubertal Hormone Optimization',
      'preset.3.desc': 'Deep-sleep GH maximization & prevention of late-night glycemic spikes',
      'preset.4.badge': 'Peak Spurt 13 Yrs',
      'preset.4.title': 'Peak Height Velocity (PHV) Intervention',
      'preset.4.desc': 'Critical 8~10 cm/yr growth spurt & executive cognitive focus',
      'preset.5.badge': 'Adolescent 16 Yrs',
      'preset.5.title': 'Spinal Disc Recovery & Alignment',
      'preset.5.desc': 'Decompression traction recovering +1.5~2.5 cm prior to plate closure',

      // Wizard Steps
      'wizard.step': 'Step',
      'wizard.step1.title': 'Basic Biometrics & Genetics',
      'wizard.step1.sub': 'Utilized for CDC/KDCA LMS Z-scores and Tanner Mid-Parental Height (MPH).',
      'wizard.step2.title': 'Skeletal Maturation & Tanner Stage',
      'wizard.step2.sub': 'Evaluates epiphyseal plate open ratio and Peak Height Velocity (PHV) runway.',
      'wizard.step3.title': 'Lifestyle & Bio-Inhibition Factors',
      'wizard.step3.sub': 'Diagnoses nocturnal GH suppression and adult height penalty factors.',
      'wizard.step4.title': 'Neuro-Cognitive Key Axes (5 Major Domains)',
      'wizard.step4.sub': 'Configures age-specific cortical rewiring and developmental inquiry.',
      'wizard.step5.title': 'Clinical Computation & Modeling',
      'wizard.step5.sub': 'Calculating LMS Z-scores, 24h hormone curves, and 3 adult trajectories.',

      // Form Labels
      'label.gender': 'Biological Sex',
      'label.gender.boy': 'Boy',
      'label.gender.girl': 'Girl',
      'label.age': 'Age (Years Slider)',
      'label.height': 'Current Height',
      'label.weight': 'Current Weight',
      'label.recentGrowth': 'Recent 6-Month Height Gain (for Annual Velocity)',
      'label.fatherHeight': 'Father\'s Height',
      'label.motherHeight': 'Mother\'s Height',
      'label.prev': '← Previous',
      'label.next': 'Next Step →',
      'label.scan': '🔬 Run 3-Second Clinical Scan',

      // Tanner Phases
      'phase.1.title': 'Phase 1. Foundation Growth (Infancy & Childhood)',
      'phase.1.desc': 'Open growth plate ratio 90%+, steady 5~6 cm/yr velocity',
      'phase.2.title': 'Phase 2. Peak Height Velocity (Early Puberty PHV)',
      'phase.2.desc': 'Pulsatile GH & IGF-1 surge; maximum velocity golden window',
      'phase.3.title': 'Phase 3. Deceleration & Maturation (Post-Menarche/Voice Break)',
      'phase.3.desc': 'Final residual potential of 4~7 cm before epiphyseal fusion',
      'phase.4.title': 'Phase 4. Structural Postural Alignment (Late Adolescence)',
      'phase.4.desc': 'Spinal disc decompression recovering +1.5~2.5 cm of hidden height',

      // Habits
      'habit.late_sleep': 'Delayed Bedtime (Sleep after 10:30 PM / Fragmented Sleep)',
      'habit.night_carbs': 'Late-Night Glycemic Spike (Snacks/Sugar within 2 hrs of bed)',
      'habit.poor_posture': 'Postural Misalignment (Tech-neck, thoracic kyphosis, pelvic tilt)',
      'habit.picky_eater': 'Nutritional Deficit (Protein/micronutrient avoidance, lactose intolerance)',
      'habit.sedentary': 'Physical Inactivity (Lack of 30+ min daily impact/jumping exercise)',

      // Cognitive Axes
      'cog.math_logic': 'Mathematical, Spatial & Logical Reasoning',
      'cog.language_reading': 'Language, Literacy & Critical Reading',
      'cog.science_nature': 'Scientific, Natural & Technological Inquiry',
      'cog.sensory_arts': 'Sensory, Artistic & Creative Motor Expression',
      'cog.executive_focus': 'Prefrontal Executive Function & Focused Autonomy',

      // Loader
      'loader.step1': 'Loading CDC 2000 & KDCA 2017 LMS Parameter Matrices...',
      'loader.step2': 'Computing Standardized Z-Scores & 3-Tier Predicted Trajectories...',
      'loader.step3': 'Finalizing GH Suppression Ratio & 5-Axis Neuro-Cognitive Protocol!',
      'loader.skip': 'Skip & View Results ↗',

      // Results
      'rx.retest': '🔄 Re-evaluate Biometrics',
      'rx.standard.kdca': 'Korean KDCA 2017 Clinical Growth Charts Applied',
      'rx.standard.cdc': 'US CDC 2000 & WHO Clinical Growth Standards Applied'
    }
  };

  // 2. Unit Conversions
  function cmToFtIn(cm) {
    if (typeof cm !== 'number' || isNaN(cm) || cm <= 0) return { ft: 0, in: 0, str: '0 ft 0 in' };
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = Math.round((totalInches % 12) * 10) / 10;
    return {
      ft: ft,
      in: inches,
      str: `${ft} ft ${inches.toFixed(1)} in`
    };
  }

  function ftInToCm(ft, inches = 0) {
    const f = parseFloat(ft) || 0;
    const i = parseFloat(inches) || 0;
    const cm = (f * 12 + i) * 2.54;
    return Math.round(cm * 10) / 10;
  }

  function cmToInches(cm) {
    if (typeof cm !== 'number' || isNaN(cm) || cm <= 0) return 0;
    return Math.round((cm / 2.54) * 10) / 10;
  }

  function inchesToCm(inches) {
    if (typeof inches !== 'number' || isNaN(inches) || inches <= 0) return 0;
    return Math.round((inches * 2.54) * 10) / 10;
  }

  function kgToLbs(kg) {
    if (typeof kg !== 'number' || isNaN(kg) || kg <= 0) return 0;
    return Math.round(kg * 2.20462262 * 10) / 10;
  }

  function lbsToKg(lbs) {
    if (typeof lbs !== 'number' || isNaN(lbs) || lbs <= 0) return 0;
    return Math.round((lbs / 2.20462262) * 10) / 10;
  }

  // 3. State Management
  let currentLang = 'ko';
  let currentUnitSystem = 'metric'; // 'metric' (cm, kg) or 'imperial' (ft/in, lbs)
  let prevUnitSystem = 'metric';

  function initI18n() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedLang = window.localStorage.getItem('taller_lang');
        if (savedLang === 'en' || savedLang === 'ko') {
          currentLang = savedLang;
        } else if (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('en')) {
          currentLang = 'en';
        }
        const savedUnit = window.localStorage.getItem('taller_unit');
        if (savedUnit === 'imperial' || savedUnit === 'metric') {
          currentUnitSystem = savedUnit;
        } else {
          currentUnitSystem = currentLang === 'en' ? 'imperial' : 'metric';
        }
      } catch (e) {
        // Fallback
      }
    }
    updateDocumentLang();
    updateDOM();

    // Wire #btn-lang-toggle click listener
    if (typeof document !== 'undefined') {
      const langBtn = document.getElementById('btn-lang-toggle');
      if (langBtn && !langBtn._hasI18nListener) {
        langBtn.addEventListener('click', () => {
          toggleLanguage();
        });
        langBtn._hasI18nListener = true;
      }
    }
  }

  function getLanguage() {
    return currentLang;
  }

  function getUnitSystem() {
    return currentUnitSystem;
  }

  function setLanguage(lang) {
    if (lang !== 'ko' && lang !== 'en') return;
    currentLang = lang;
    currentUnitSystem = lang === 'en' ? 'imperial' : 'metric';

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('taller_lang', currentLang);
        localStorage.setItem('taller_unit', currentUnitSystem);
      } catch (e) {}
    }

    updateDocumentLang();
    updateDOM();
  }

  function toggleLanguage() {
    setLanguage(currentLang === 'ko' ? 'en' : 'ko');
  }

  function setUnitSystem(unit) {
    if (unit !== 'metric' && unit !== 'imperial') return;
    currentUnitSystem = unit;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('taller_unit', currentUnitSystem);
      } catch (e) {}
    }
    updateDOM();
  }

  function updateDocumentLang() {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLang;
    }
  }

  function t(key, lang = currentLang) {
    const dict = DICTIONARY[lang] || DICTIONARY.ko;
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to KO if missing in EN
    if (DICTIONARY.ko && DICTIONARY.ko[key]) {
      return DICTIONARY.ko[key];
    }
    return key;
  }

  function updateDOM() {
    if (typeof document === 'undefined') return;

    // 1. Elements with data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translated = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.setAttribute('placeholder', translated);
        } else {
          el.textContent = translated;
        }
      }
    });

    // 2. Elements with data-i18n-html
    const htmlElements = document.querySelectorAll('[data-i18n-html]');
    htmlElements.forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (key) {
        el.innerHTML = t(key).replace(/\n/g, '<br>');
      }
    });

    // 3. Language button
    const langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) {
      langBtn.textContent = currentLang === 'ko' ? '🇺🇸 EN (CDC)' : '🇰🇷 KO (KDCA)';
      langBtn.title = currentLang === 'ko' ? 'Switch to Global Mode (EN / CDC / Imperial)' : '한국어 모드로 전환 (KDCA / Metric)';
    }

    // 4. Update unit labels in inputs
    const heightUnitLabels = document.querySelectorAll('.unit-label-height');
    heightUnitLabels.forEach((el) => {
      el.textContent = currentUnitSystem === 'imperial' ? 'in (or ft/in)' : 'cm';
    });
    const weightUnitLabels = document.querySelectorAll('.unit-label-weight');
    weightUnitLabels.forEach((el) => {
      el.textContent = currentUnitSystem === 'imperial' ? 'lbs' : 'kg';
    });

    if (prevUnitSystem !== currentUnitSystem) {
      const childH = document.getElementById('child-height');
      const childW = document.getElementById('child-weight');
      const childR = document.getElementById('child-recent-gain');
      const fatH = document.getElementById('father-height');
      const motH = document.getElementById('mother-height');

      if (currentUnitSystem === 'imperial') {
        if (childH) {
          if (childH.value) {
            const v = parseFloat(childH.value);
            if (!isNaN(v) && v > 0) childH.value = (Math.round((v / 2.54) * 10) / 10).toFixed(1);
          }
          childH.min = '18'; childH.max = '90'; childH.placeholder = '54.0';
        }
        if (childW) {
          if (childW.value) {
            const v = parseFloat(childW.value);
            if (!isNaN(v) && v > 0) childW.value = (Math.round(v * 2.20462262 * 10) / 10).toFixed(1);
          }
          childW.min = '5'; childW.max = '350'; childW.placeholder = '78.0';
        }
        if (childR) {
          if (childR.value) {
            const v = parseFloat(childR.value);
            if (!isNaN(v) && v >= 0) childR.value = (Math.round((v / 2.54) * 10) / 10).toFixed(1);
          }
          childR.min = '0'; childR.max = '8'; childR.placeholder = '1.2';
        }
        if (fatH) {
          if (fatH.value) {
            const v = parseFloat(fatH.value);
            if (!isNaN(v) && v > 0) fatH.value = (Math.round((v / 2.54) * 10) / 10).toFixed(1);
          }
          fatH.min = '40'; fatH.max = '95'; fatH.placeholder = '68.3';
        }
        if (motH) {
          if (motH.value) {
            const v = parseFloat(motH.value);
            if (!isNaN(v) && v > 0) motH.value = (Math.round((v / 2.54) * 10) / 10).toFixed(1);
          }
          motH.min = '40'; motH.max = '95'; motH.placeholder = '63.2';
        }
      } else {
        if (childH) {
          if (childH.value) {
            const v = parseFloat(childH.value);
            if (!isNaN(v) && v > 0) childH.value = (Math.round(v * 2.54 * 10) / 10).toFixed(1);
          }
          childH.min = '45'; childH.max = '230'; childH.placeholder = '137.0';
        }
        if (childW) {
          if (childW.value) {
            const v = parseFloat(childW.value);
            if (!isNaN(v) && v > 0) childW.value = (Math.round((v / 2.20462262) * 10) / 10).toFixed(1);
          }
          childW.min = '2'; childW.max = '160'; childW.placeholder = '35.5';
        }
        if (childR) {
          if (childR.value) {
            const v = parseFloat(childR.value);
            if (!isNaN(v) && v >= 0) childR.value = (Math.round(v * 2.54 * 10) / 10).toFixed(1);
          }
          childR.min = '0'; childR.max = '20'; childR.placeholder = '3.2';
        }
        if (fatH) {
          if (fatH.value) {
            const v = parseFloat(fatH.value);
            if (!isNaN(v) && v > 0) fatH.value = (Math.round(v * 2.54 * 10) / 10).toFixed(1);
          }
          fatH.min = '100'; fatH.max = '240'; fatH.placeholder = '173.5';
        }
        if (motH) {
          if (motH.value) {
            const v = parseFloat(motH.value);
            if (!isNaN(v) && v > 0) motH.value = (Math.round(v * 2.54 * 10) / 10).toFixed(1);
          }
          motH.min = '100'; motH.max = '240'; motH.placeholder = '160.5';
        }
      }
      prevUnitSystem = currentUnitSystem;
    }

    // 5. Fire global custom event
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('taller-language-change', {
        detail: { language: currentLang, unitSystem: currentUnitSystem }
      }));
    }
  }

  // Export
  const I18n = {
    DICTIONARY,
    initI18n,
    getLanguage,
    setLanguage,
    toggleLanguage,
    getUnitSystem,
    setUnitSystem,
    t,
    updateDOM,
    cmToFtIn,
    ftInToCm,
    cmToInches,
    inchesToCm,
    kgToLbs,
    lbsToKg
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
  } else {
    global.TallerI18n = I18n;
    if (typeof window !== 'undefined') {
      window.addEventListener('DOMContentLoaded', () => {
        initI18n();
        const langBtn = document.getElementById('btn-lang-toggle');
        if (langBtn && !langBtn._hasI18nListener) {
          langBtn.addEventListener('click', () => {
            toggleLanguage();
          });
          langBtn._hasI18nListener = true;
        }
      });
    }
  }

})(typeof window !== 'undefined' ? window : global);
