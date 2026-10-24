/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * Multimodal Haptic Feedback, Typewriter Streamer & 60-Second Personalized Analysis Theatre
 * (src/js/haptic-typewriter.js)
 *
 * Features:
 * 1. Multimodal Haptic Feedback Engine:
 *    - Android/Mobile: navigator.vibrate() patterns
 *    - iOS/Desktop/All: Web Audio API synthesized mechanical/clinical micro-tick & chimes
 *    - Visual Haptic Pulse: CSS spring bounce & neon cursor glow
 *    - User Toggle: ${isEn ? 'Haptic ON' : '햅틱·진동 ON'}/OFF safety switch
 * 2. Taller-Style Typewriter Streamer:
 *    - Streams clinical analysis headlines character-by-character with punctuation micro-pauses
 *    - Fires subtle tactile ticks every 3 characters
 * 3. 60-Second Personalized Waiting Content Theatre:
 *    - 6-Stage (10s each) live clinical computation progress bar & countdown timer
 *    - 6 Dynamic Child-Specific Briefing Cards (injected with exact DOB months/days, height, MPH, habits, and N -> N+1 -> N+2 age preview)
 *    - Interactive 1-Second Touch O/X Parent Fact Quiz with instant haptic & paper-backed answer reveal
 */

(function (global) {
  'use strict';

  const state = {
    hapticEnabled: true,
    audioCtx: null,
    activeTypewriterTimer: null,
    activeTheatreTimer: null,
    activeCardIndex: 0,
    activeQuizIndex: 0,
    quizAnswered: false
  };

  /**
   * Initializes or resumes Web Audio API context safely on user interaction
   */
  function getAudioContext() {
    if (!state.hapticEnabled) return null;
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!state.audioCtx) {
        state.audioCtx = new AudioCtx();
      }
      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume().catch(() => {});
      }
      return state.audioCtx;
    } catch (e) {
      return null;
    }
  }

  /**
   * Plays a subtle synthesized clinical tactile sound (for iOS/Desktop/Android haptic feel)
   */
  function playTactileTone(freq = 800, durationMs = 12, gainVal = 0.022, type = 'sine') {
    if (!state.hapticEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      // Ignore audio errors on restricted autoplay
    }
  }

  /**
   * Triggers multimodal haptic feedback (Vibration + Audio Micro-Tick + Visual Pulse)
   * @param {'tick'|'step'|'quiz_correct'|'quiz_wrong'|'complete'} kind
   * @param {HTMLElement} [targetEl]
   */
  function triggerHaptic(kind = 'tick', targetEl = null) {
    if (!state.hapticEnabled) return;

    // 1. Hardware Vibration (if supported)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        if (kind === 'tick') navigator.vibrate(8);
        else if (kind === 'step') navigator.vibrate([18, 35, 25]);
        else if (kind === 'quiz_correct') navigator.vibrate([15, 30, 35]);
        else if (kind === 'quiz_wrong') navigator.vibrate([40, 50, 40]);
        else if (kind === 'complete') navigator.vibrate([30, 45, 30, 45, 80]);
      } catch (e) {}
    }

    // 2. Synthesized Micro-Tactile Audio
    if (kind === 'tick') {
      playTactileTone(820, 11, 0.018, 'triangle');
    } else if (kind === 'step') {
      playTactileTone(540, 35, 0.028, 'sine');
      setTimeout(() => playTactileTone(780, 45, 0.03, 'sine'), 45);
    } else if (kind === 'quiz_correct') {
      playTactileTone(587.33, 45, 0.032, 'sine'); // D5
      setTimeout(() => playTactileTone(880, 65, 0.035, 'sine'), 55); // A5
    } else if (kind === 'quiz_wrong') {
      playTactileTone(280, 70, 0.03, 'triangle');
    } else if (kind === 'complete') {
      playTactileTone(523.25, 45, 0.032, 'sine');
      setTimeout(() => playTactileTone(659.25, 45, 0.032, 'sine'), 55);
      setTimeout(() => playTactileTone(783.99, 80, 0.038, 'sine'), 110);
    }

    // 3. Visual Spring Pulse
    if (targetEl && targetEl.style) {
      targetEl.style.transition = 'transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1)';
      targetEl.style.transform = 'scale(1.025)';
      setTimeout(() => {
        if (targetEl && targetEl.style) {
          targetEl.style.transform = 'scale(1)';
        }
      }, 160);
    }
  }

  /**
   * Streams text into an element with Taller-style typewriter cursor & haptic ticks
   */
  function typewriteText(el, text, options = {}) {
    if (!el) return;
    if (state.activeTypewriterTimer) {
      clearInterval(state.activeTypewriterTimer);
      state.activeTypewriterTimer = null;
    }

    const fullText = String(text || '');
    const charInterval = options.charInterval || 34;

    if (typeof window === 'undefined' || options.instant) {
      el.textContent = fullText;
      return;
    }

    let idx = 0;
    el.innerHTML = `<span class="tw-text"></span><span class="tw-cursor" style="display:inline-block;margin-left:3px;color: #1D4ED8;font-weight:900;">▋</span>`;
    const textSpan = el.querySelector('.tw-text');

    state.activeTypewriterTimer = setInterval(() => {
      if (idx < fullText.length) {
        idx++;
        if (textSpan) {
          textSpan.textContent = fullText.slice(0, idx);
        } else {
          el.textContent = fullText.slice(0, idx);
        }
        if (idx % 3 === 1) {
          triggerHaptic('tick');
        }
      } else {
        clearInterval(state.activeTypewriterTimer);
        state.activeTypewriterTimer = null;
        if (typeof options.onDone === 'function') options.onDone();
      }
    }, charInterval);
  }

  function isLearningModeActive(profile = {}) {
    if (profile && profile.preferredReportMode === 'learning') return true;
    if (profile && profile.preferredReportMode === 'growth') return false;
    if (typeof window !== 'undefined' && window.__KIDSFIT_PREFERRED_REPORT_MODE === 'learning') return true;
    if (typeof global !== 'undefined' && global.__KIDSFIT_PREFERRED_REPORT_MODE === 'learning') return true;
    if (typeof document !== 'undefined') {
      const formEl = document.getElementById('diagnosis-form');
      if (formEl && formEl.className && formEl.className.includes('wizard-mode-learning')) return true;
    }
    return false;
  }

  /**
   * Builds 6 dynamically personalized child waiting cards strictly separated by mode:
   * - Physical Growth Mode: 100% Height, Weight, BMI, Growth Plate, Sleep GH, Calcium, Spine Decompression
   * - Brain & Learning Mode: 100% LQ 5-Axis, Literacy, Math Spatial, Working Memory, Active Recall, Careers
   */
  function isGlobalEnMode() {
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        if (document.documentElement.lang === 'en' || document.documentElement.getAttribute('data-edition') === 'global-paid') return true;
      }
      if (typeof window !== 'undefined' && window.__KIDSFIT_GLOBAL_PAID_EDITION === true) return true;
    } catch (_) {}
    return false;
  }

  function buildChildWaitingCards(profile = {}) {
    const isLearning = isLearningModeActive(profile);
    const isEn = isGlobalEnMode();
    if (isEn) {
      const genderEn = profile.gender === 'girl' ? 'Girl' : 'Boy';
      const ageMonths = Number(profile.ageMonths) || 120;
      const exactMonths = Number(profile.exactMonths || ageMonths).toFixed(1);
      const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
      const height = Number(profile.currentHeight) || 137.0;
      const weight = Number(profile.currentWeight) || 35.5;
      const fatherH = Number(profile.fatherHeight) || 173.5;
      const motherH = Number(profile.motherHeight) || 160.5;
      const mph = Math.round(((fatherH + motherH + (profile.gender === 'girl' ? -13 : 13)) / 2) * 10) / 10;
      const closureAge = profile.gender === 'girl' ? 15 : 17;
      const remYearsMax = Math.max(2, closureAge - ageYears);
      if (isLearning) {
        return [
          {
            badge: `Brain Briefing 1/6 · Age ${ageYears} Neuro-Developmental Window`,
            title: `Mapping Prefrontal & Cognitive Synaptic Windows (${exactMonths} mos · ${genderEn})`,
            body: `Cross-referencing your child's age-specific prefrontal cortex (DLPFC) and parietal spatial circuits against <strong>3,714 peer-reviewed neuroscience papers</strong>.`,
            highlight: `Computing 5-Axis Learning Quotient (LQ) & primary cognitive bottleneck...`
          },
          {
            badge: `Brain Briefing 2/6 · 5-Axis Brain Radar & Bottleneck Detection`,
            title: `Analyzing Literacy · Spatial Math · Working Memory · Metacognition · Inquiry`,
            body: `Identifying your child's Top 3 cognitive strengths and Top 3 study bottlenecks to prevent wasted tutoring and study fatigue.`,
            highlight: `Matching 1:1 study methodology (Active Recall / Manipulative / Visual / Goal-Driven)...`
          },
          {
            badge: `Brain Briefing 3/6 · Roediger & Karpicke (2006) Active Recall Effect`,
            title: `3-Min Blank-Sheet Recall Retains 2.4x More Than Re-Reading 4 Times`,
            body: `Closing the book and verbally explaining 3 key takeaways boosts 1-week long-term retention from <strong>48% to 92%</strong>.`,
            highlight: `Synthesizing your child's 4-step daily self-directed study schedule...`
          },
          {
            badge: `Brain Briefing 4/6 · 10 PM Slow-Wave Sleep Memory Consolidation`,
            title: `Hippocampus-to-Neocortex Memory Transfer Peaks Between 10 PM and 2 AM`,
            body: `Vocabulary and math concepts learned during the day are permanently consolidated into the neocortex during deep slow-wave sleep (SWS).`,
            highlight: `Preparing 6-month focus & memory retention growth trajectory...`
          },
          {
            badge: `Brain Briefing 5/6 · Future Career Pathways & 3-Year Roadmap`,
            title: `Matching Top 3 Future Career Tracks to Your Child's Brain Strengths`,
            body: `Mapping a 3-year age-by-age cognitive & academic transition roadmap from Age ${ageYears} to Age ${ageYears + 2}.`,
            highlight: `Finalizing bespoke workbook, STEM kit & museum inquiry curation...`
          },
          {
            badge: `Brain Briefing 6/6 · 1:1 Brain & Learning Master Report Ready`,
            title: `Your Child's 5-Axis Brain Balance Chart & Bottleneck Rx is Ready!`,
            body: `Includes 5-Axis Radar SVG, 6-Month LQ Growth Curve, and step-by-step bottleneck correction protocol.`,
            highlight: `Opening your child's clinical Brain & Learning Report now...`
          }
        ];
      }
      return [
        {
          badge: `Auxology Briefing 1/6 · Day-Exact CDC/WHO LMS Percentile Scan`,
          title: `Cross-Analyzing ${height} cm / ${weight} kg at ${exactMonths} Months (${genderEn})`,
          body: `Even within the same birth year, January vs. December births differ by up to <strong>1.9 in (4.8 cm)</strong>. Computing day-exact US CDC 2000 & WHO LMS Z-scores.`,
          highlight: `Tanner Mid-Parental Height (MPH): ${mph} cm (±8.5 cm epigenetic window = 17 cm total range)`
        },
        {
          badge: `Auxology Briefing 2/6 · Weight-for-Height & Leptin Bone-Age Check`,
          title: `Balancing Weight-for-Height to Protect Epiphyseal Growth Plates`,
          body: `Underweight slows bone matrix synthesis, while excess body fat elevates <strong>Leptin & Aromatase</strong>, accelerating bone age and early growth-plate fusion.`,
          highlight: `Calculating optimal target weight and 3-tier adult height trajectory...`
        },
        {
          badge: `Auxology Briefing 3/6 · Epiphyseal Plate Closure Countdown`,
          title: `Approx. ${remYearsMax} Years Remaining Until Growth Plate Fusion (Age ${closureAge})`,
          body: `Simulating Unmanaged vs. Genetic vs. Clinically Optimized adult height and evaluating <50th percentile rhGH clinical trial ROI.`,
          highlight: `Modeling +2.6 in (+6.7 cm) hidden height recovery potential...`
        },
        {
          badge: `Auxology Briefing 4/6 · Bioavailable Calcium, Vit D3/K2 & Zinc Targets`,
          title: `Computing Exact Daily mg/IU Targets for ${weight} kg Body Weight`,
          body: `Citrate/MCHA Calcium offers <strong>45% bioavailability</strong> (2.05x higher than carbonate) when paired with Vitamin D3 and MK-7 Vitamin K2.`,
          highlight: `Applying peer-reviewed pediatric endocrinology & nutrition standards...`
        },
        {
          badge: `Auxology Briefing 5/6 · 10 PM SWS GH Peak & +0.7 in Spinal Decompression`,
          title: `65–70% of Daily Growth Hormone Pulses During First 90 Min of Deep Sleep`,
          body: `Late-night carbs spike insulin and suppress GH by up to <strong>-52%</strong>, while 3x30s doorway dead-hangs restore <strong>+0.7 in (+1.8 cm)</strong> of intervertebral disc height.`,
          highlight: `Building your child's 4-stage daily growth & posture routine...`
        },
        {
          badge: `Auxology Briefing 6/6 · 1:1 Pediatric Auxology Master Report Ready`,
          title: `Your Child's 3-Tier Height Trajectory & Clinical Report is Ready!`,
          body: `Includes CDC LMS Percentile Curve, Phenotype-Specialized Clinical Module, and 90-Day Action Plan.`,
          highlight: `Opening your child's clinical Height & Growth-Plate Report now...`
        }
      ];
    }
    const genderKo = profile.gender === 'girl' ? '여아' : '남아';
    const ageMonths = Number(profile.ageMonths) || 120;
    const exactMonths = Number(profile.exactMonths || ageMonths).toFixed(1);
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const nextAge1 = Math.min(20, ageYears + 1);
    const nextAge2 = Math.min(20, ageYears + 2);
    const height = Number(profile.currentHeight) || 137.0;
    const weight = Number(profile.currentWeight) || 35.5;
    const fatherH = Number(profile.fatherHeight) || 173.5;
    const motherH = Number(profile.motherHeight) || 160.5;
    const mph = Math.round(((fatherH + motherH + (profile.gender === 'girl' ? -13 : 13)) / 2) * 10) / 10;
    const closureAge = profile.gender === 'girl' ? 15 : 17;
    const remYearsMin = Math.max(1, closureAge - ageYears - 1);
    const remYearsMax = Math.max(remYearsMin + 1, closureAge - ageYears);
    const dobDisplay = profile.birthDateStr || `${new Date().getFullYear() - ageYears}년생`;
    const habits = Array.isArray(profile.habits) ? profile.habits : ['late_sleep'];

    if (isLearning) {
      const brainStageFocus = ageYears <= 3
        ? '대뇌 운동피질 30% 손끝 소근육 시냅스 폭발기 & 상호작용 어휘 형성기'
        : ageYears <= 6
        ? '두정엽 3D 입체 공간회전 민감기 & 이야기 맥락·수 감각 형성기'
        : ageYears <= 9
        ? '배외측 전전두엽(DLPFC) 피질 두께 정점기 & 메타인지·문해력 도약기'
        : '전두엽 고차원 추론·비판적 독해 & 자기주도 인출학습(백지복습) 완성기';

      return [
        {
          badge: `학습 브리핑 1/6 · 만 ${ageYears}세 두뇌 발달 민감기 정밀 매핑`,
          title: `${dobDisplay} (생후 ${exactMonths}개월) ${genderKo}, 지금 가장 활발한 두뇌 회로는?`,
          body: `만 ${ageYears}세는 <strong>[${brainStageFocus}]</strong>입니다. 아이의 연령에 맞지 않는 어려운 문제집이나 단순 암기 대신 지금 깨어나는 뇌 회로를 자극해야 학습 효율이 2배 이상 높아집니다.`,
          highlight: `2,081편 인지신경과학·교육심리학 논문 기준으로 만 ${ageYears}세 맞춤 학습지수(LQ)를 산출 중입니다.`
        },
        {
          badge: `학습 브리핑 2/6 · 5각 두뇌·학습 역량 레이더 & 강약점 판정`,
          title: `문해력 · 수리공간 · 집중력 · 메타인지 · 탐구력 5대 지표 분석 중`,
          body: `설문에서 선택하신 독서·수학·집중·기억 패턴을 분석하여 <strong>우리 아이가 가장 잘하는 강점 TOP 3</strong>와 <strong>지금 바로 보완해주어야 할 학습 병목 TOP 3</strong>를 1순위부터 3순위까지 도출하고 있습니다.`,
          highlight: `강점 영역은 자신감 부스터로 키우고, 약점 병목은 아이 성향에 맞는 1:1 공부법으로 길을 열어드립니다.`
        },
        {
          badge: `학습 브리핑 3/6 · 백지복습(인출학습)과 전두엽 작업기억의 비밀`,
          title: `눈으로 4번 다시 읽기보다 '책 덮고 3분 말하기'가 기억을 2.4배 오래 남깁니다`,
          body: `Roediger & Karpicke(2006)의 뇌과학 연구에 따르면, 공부를 마친 직후 책을 덮고 <strong>오늘 배운 핵심 3가지를 스스로 말하거나 적어보는 인출 연습</strong>만으로도 1주일 뒤 장기기억 보존율이 <strong>48% → 92%</strong>로 도약합니다.`,
          highlight: `잠시 후 열리는 학습 보고서에서 우리 아이 맞춤형 4단계 일일 자기주도 학습 루틴을 확인하세요!`
        },
        {
          badge: `학습 브리핑 4/6 · 밤 10시 수면 기억 공고화 (해마 → 대뇌피질)`,
          title: `낮에 배운 공부가 진짜 실력이 되는 시간은 '밤 10시 깊은 잠'입니다`,
          body: `낮 동안 해마(단기기억 임시저장소)에 들어온 어휘와 수학 개념은 <strong>밤 10시~새벽 2시 깊은 서파수면(SWS)</strong> 동안 대뇌 신피질로 전송되어 영구적인 장기기억으로 코팅됩니다.`,
          highlight: `취침 1시간 전 스마트폰 차단과 충분한 숙면이 집중시간을 ${ageYears <= 4 ? '10분 → 20분' : '15분 → 35분'}으로 늘려줍니다.`
        },
        {
          badge: `학습 브리핑 5/6 · 강점 성향 기반 미래 유망 진로 & 전공 매칭`,
          title: `우리 아이의 두뇌 강점이 가장 빛날 미래 직업 1위~3위는 무엇일까요?`,
          body: `아이의 최상위 강점 역량과 학습 흡수 스타일(문답형·조작형·시각형·성취형)을 결합하여, <strong>미래 핵심 진로 TOP 3와 연계 전공 로드맵</strong>을 함께 설계하고 있습니다.`,
          highlight: `만 ${ageYears}세 → 만 ${nextAge1}세 → 만 ${nextAge2}세로 이어지는 3개년 교과·사고력 전환 로드맵이 곧 공개됩니다.`
        },
        {
          badge: `학습 브리핑 6/6 · 만 ${ageYears}세 맞춤 교구·도서·주말 박물관 코스 완성`,
          title: `우리 아이만을 위한 1:1 두뇌·학습 시각 그래프 & 처방전이 완성됩니다!`,
          body: `5각 두뇌 레이더 차트, 6개월 학습·집중력 3중 성장 곡선, 그림으로 보는 3단계 공부법 가이드, 그리고 연령에 딱 맞는 <strong>사고력 교구·필독서·주말 체험 코스</strong>가 곧 열립니다.`,
          highlight: `결과 화면 상단에서 [5각 두뇌 밸런스 차트 & 6개월 학습 성장 곡선]을 바로 확인하세요!`
        }
      ];
    }

    // Physical Growth Mode (100% Pure Growth: Height, Weight, BMI, Growth Plate, Sleep GH, Nutrition, Posture)
    let growthStageFocus = '유아기 기초 골격 형성 & 밤 9시 30분 성장호르몬 숙면 리듬 고정';
    let keyIngredient = '구연산·어골칼슘 + 비타민D3·K2 + 아연·초유 단백질';
    if (ageYears >= 4 && ageYears <= 6) {
      growthStageFocus = '하지(대퇴골·경골) 성장판 연골 증식 가속 & 실내 점핑 미세하중 자극';
      keyIngredient = '식약처 인정 황기추출물(HT042) + 어린이 구연산·연골칼슘 800mg';
    } else if (ageYears >= 7 && ageYears <= 10) {
      growthStageFocus = '사춘기 진입 전 기초 키 최대 비축 & 적정 체중(체지방·성조숙 방어) 관리';
      keyIngredient = '황기추출물(HT042) + 고흡수 어골·연골칼슘 + 비타민D3·K2';
    } else if (ageYears >= 11) {
      growthStageFocus = '급성장 피크(PHV) 성장판 최대 가속 & 문틀 철봉 척추 디스크 감압(+1.8cm)';
      keyIngredient = '고함량 어골·연골칼슘 1000mg + 마그네슘 + 초유·아르기닌 단백질';
    }

    return [
      {
        badge: `성장 브리핑 1/6 · 생년월일 일수 단위 키·몸무게 백분위 보정`,
        title: `${dobDisplay} (생후 ${exactMonths}개월) ${genderKo}, 키(${height}cm)와 몸무게(${weight}kg) 정밀 대조 중`,
        body: `같은 만 ${ageYears}세라도 1월생과 12월생은 평균 키가 최대 <strong>4.2~5.5cm</strong>, 몸무게는 <strong>2.5~3.8kg</strong> 차이 납니다. 입력하신 <strong>${height}cm / ${weight}kg</strong>을 생후 ${exactMonths}개월 일수 단위 질병관리청(KDCA) 표준 성장도표로 정밀 분석하고 있습니다.`,
        highlight: `부모 유전 표적키(Tanner MPH): ${mph}cm (±8.5cm 범위 내에서 수면·영양·자세 관리가 최대 17cm 차이를 만듭니다)`
      },
      {
        badge: `성장 브리핑 2/6 · 현재 키 맞춤 적정 몸무게 & 체질량(BMI) 분석`,
        title: `키가 잘 크려면 '몸무게 밸런스'가 먼저 맞아야 합니다`,
        body: `현재 키(${height}cm) 대비 몸무게(${weight}kg)가 저체중이면 뼈·근육을 만드는 재료가 부족하고, 과체중(체지방 과다)이면 렙틴 호르몬이 사춘기와 성장판 폐쇄를 앞당깁니다. <strong>우리 아이 키에 딱 맞는 적정 체중과 6개월 목표 체중</strong>을 계산하고 있습니다.`,
        highlight: `잠시 후 결과 화면에서 키 그래프와 함께 [몸무게 3단 밸런스 비교 그래프]가 함께 공개됩니다!`
      },
      {
        badge: `성장 브리핑 3/6 · 만 ${ageYears}세 성장판 잔여 기간 & 골든타임 산출`,
        title: `우리 아이 성장판이 닫히는 만 ${closureAge}세까지 남은 시간은 약 ${remYearsMin}~${remYearsMax}년입니다`,
        body: `성장판 잔여 기간이란 뼈 끝 연골 성장판이 완전히 닫혀 키 성장이 멈추는 시기(${genderKo} 평균 만 ${closureAge}세)까지 실제로 더 자랄 수 있는 시간입니다. 지금 만 ${ageYears}세는 <strong>[${growthStageFocus}]</strong>에 집중해야 할 황금기입니다.`,
        highlight: `현재 습관(${habits.length}개 요인) 교정 시 방치 예측키 대비 숨은 잠재키가 얼마나 더 자라는지 시뮬레이션 중입니다.`
      },
      {
        badge: `성장 브리핑 4/6 · 체중(${weight}kg) 비례 맞춤 칼슘·단백질·영양 성분 매칭`,
        title: `아이 체중과 식습관에 맞춘 고흡수 성장 영양소 조합 도출 중`,
        body: `현재 ${weight}kg ${genderKo}의 골격 성장 속도와 식습관 데이터를 분석한 결과, 흡수율이 낮은 일반 탄산칼슘(22%) 대신 흡수율 45%의 <strong>[${keyIngredient}]</strong>을 아침·저녁으로 보충해 주는 것이 가장 효과적입니다.`,
        highlight: `대한소아내분비학회지·경희대 임상 논문(PMID:25374566) 및 한국인 영양소 섭취기준(KDRIs)을 적용했습니다.`
      },
      {
        badge: `성장 브리핑 5/6 · 밤 10시 성장호르몬 & 숨은 척추 키 +1.8cm 복원`,
        title: `밤 10시 첫 서파수면(SWS) 90분이 하루 성장호르몬의 65%를 분비합니다`,
        body: `취침 2시간 전 야식·단 간식은 인슐린과 소마토스타틴을 분비해 성장호르몬을 최대 <strong>-52% 억제</strong>하며, 낮 동안 눌린 척추 추간판 디스크는 저녁 <strong>문틀 철봉 매달리기 30초×3세트와 점핑 운동</strong>으로 최대 <strong>+1.8cm</strong> 복원됩니다.`,
        highlight: `아침·방과후·저녁·취침 전 4단계로 나눈 하루 밀착 신체 성장 시간표를 생성하고 있습니다.`
      },
      {
        badge: `성장 브리핑 6/6 · 1:1 신체 성장(키·몸무게·골연령) 정밀 보고서 완성`,
        title: `우리 아이 맞춤형 3중 예측키 성장 곡선 & 몸무게 진단서가 곧 열립니다!`,
        body: `질병관리청 키·몸무게 백분위, 부모 유전키(MPH) vs 방치키 vs 맞춤 관리 잠재키 3중 비교 그래프, 그리고 <strong>그림으로 보는 성장판 마사지·스트레칭 가이드</strong>가 모두 준비되었습니다.`,
        highlight: `결과 화면 첫 화면에서 [기대 잠재키 스포트라이트 그래프 & 몸무게 정밀 진단 카드]를 바로 확인하세요!`
      }
    ];
  }

  /**
   * Mode-Specific Interactive 1-Second O/X Parent Fact Quizzes
   */
  const GROWTH_OX_QUIZZES = [
    {
      q: 'Q1. 아이의 최종 성인 키는 부모 유전이 70% 이상 절대적으로 결정한다?',
      answer: 'X',
      explain: '정답은 아닙니다! 일란성 쌍둥이 종단 연구에 따르면 유전 영향은 약 23~30%에 불과하며, 밤 10시 수면(GH 분비)·흡수율 높은 칼슘/황기추출물 영양·점프 운동이 최대 ±8.5cm(총 17cm 폭)를 좌우합니다.'
    },
    {
      q: 'Q2. 키보다 몸무게(체지방)가 너무 빨리 늘어나면 성장판이 일찍 닫힐 수 있다?',
      answer: 'O',
      explain: '정답은 ⭕ 맞습니다! 과도한 체지방에서 분비되는 렙틴(Leptin) 호르몬은 성호르몬 분비와 골연령(뼈나이) 진행을 앞당겨 성장판 조기 폐쇄를 유발할 수 있으므로 키에 맞는 적정 체중 관리가 매우 중요합니다.'
    },
    {
      q: 'Q3. 어린이 칼슘 영양제는 탄산칼슘이나 구연산·어골칼슘이나 흡수율이 똑같다?',
      answer: 'X',
      explain: '정답은 아닙니다! 일반 탄산칼슘은 위산이 필요해 흡수율이 22%에 그치고 변비를 유발하기 쉽지만, 구연산·어골·연골칼슘(MCHA)은 흡수율이 약 45%(2.05배)로 높고 속쓰림이 없습니다.'
    },
    {
      q: 'Q4. 밤에 잠들기 1시간 전에 과일이나 달콤한 우유·간식을 먹고 자면 키가 더 잘 큰다?',
      answer: 'X',
      explain: '정답은 아닙니다! 취침 2~3시간 이내 당류·탄수화물 섭취는 인슐린과 소마토스타틴을 분비시켜 밤 10시~2시 성장호르몬 피크를 최대 52%까지 억제합니다.'
    }
  ];

  const LEARNING_OX_QUIZZES = [
    {
      q: 'Q1. 공부를 마친 뒤 책을 덮고 배운 내용을 3분간 말해보는 것(백지복습)이 눈으로 4번 다시 읽는 것보다 효과적이다?',
      answer: 'O',
      explain: '정답은 ⭕ 맞습니다! Roediger & Karpicke(2006) 연구에 따르면 스스로 기억을 꺼내어 말해보는 인출학습(Active Recall)은 단순 반복 독서보다 1주일 뒤 장기기억 보존율을 2.4배(48% → 92%) 높여줍니다.'
    },
    {
      q: 'Q2. 단순 연산은 100점인데 수학 문장제 응용문제만 틀리는 아이는 연산 문제집을 더 많이 풀어야 한다?',
      answer: 'X',
      explain: '정답은 아닙니다! 문장제 수학에서 막히는 원인은 연산 부족이 아니라 긴 조건을 머릿속에만 담아두려는 전두엽 작업기억 과부하 때문입니다. 여백에 조건을 그림·수직선으로 그리는 습관이 해결책입니다.'
    },
    {
      q: 'Q3. 유아·아동기 때 손끝으로 블록·입체도형을 직접 만지고 조립하는 경험이 수학·공간 추론 성적을 높인다?',
      answer: 'O',
      explain: '정답은 ⭕ 맞습니다! 대뇌 운동피질의 30%가 손끝에 연결되어 있으며, 입체 교구를 손으로 회전·조립하는 경험은 두정엽 3D 심상회전 회로를 직접 발달시켜 도형·기하 문제 해결력을 크게 높입니다.'
    },
    {
      q: 'Q4. 밤잠을 줄여 늦게까지 공부하면 낮에 배운 내용이 뇌에 더 오래 기억된다?',
      answer: 'X',
      explain: '정답은 아닙니다! 낮에 해마에 저장된 단기기억은 밤 10시~2시 깊은 서파수면(SWS) 동안 대뇌피질로 이동해 장기기억으로 코팅됩니다(Diekelmann & Born, 2010). 늦게 자면 어제 배운 내용의 절반 이상이 휘발됩니다.'
    }
  ];

  const PARENT_OX_QUIZZES = GROWTH_OX_QUIZZES;

  const SIX_STAGES_GROWTH = [
    {
      step: 1,
      rangeSec: [0, 10],
      titleKo: 'Step 1/6 · 생년월일 일수 단위 정밀 월령 산출 및 질병관리청(KDCA) 키·몸무게 백분위 대조 중...',
      titleEn: 'Step 1/6 · Computing Exact Chronological Age & KDCA/CDC Height/Weight Percentiles...'
    },
    {
      step: 2,
      rangeSec: [10, 20],
      titleKo: 'Step 2/6 · 현재 키 맞춤 적정 체중(BMI) 및 성장판 잔여 골든타임 연산 중...',
      titleEn: 'Step 2/6 · Evaluating Height-Adjusted Optimal Weight & Epiphyseal Growth Window...'
    },
    {
      step: 3,
      rangeSec: [20, 30],
      titleKo: 'Step 3/6 · 부모 유전 표적키(MPH) 및 방치 시 vs 맞춤 관리 시 3단 성인 예측키 시뮬레이션 중...',
      titleEn: 'Step 3/6 · Simulating Tanner MPH & 3-Stage Adult Height Trajectories...'
    },
    {
      step: 4,
      rangeSec: [30, 40],
      titleKo: 'Step 4/6 · 밤 10시 성장호르몬(GH-IGF1) 분비 곡선 및 체중 비례 칼슘·단백질 요구량 계산 중...',
      titleEn: 'Step 4/6 · Modeling 24-Hour GH-IGF1 Secretion & Weight-Based Nutrient Targets...'
    },
    {
      step: 5,
      rangeSec: [40, 50],
      titleKo: 'Step 5/6 · 거북목·척추 디스크 감압(+1.8cm) 스트레칭 및 성장통 완화 루틴 설계 중...',
      titleEn: 'Step 5/6 · Designing Spinal Decompression (+1.8cm) & Growth Plate Exercise Protocol...'
    },
    {
      step: 6,
      rangeSec: [50, 60],
      titleKo: 'Step 6/6 · 우리 아이 1:1 신체 성장(키·몸무게·골연령) 마스터 분석 보고서 발행 중...',
      titleEn: 'Step 6/6 · Finalizing Personalized Physical Growth & Weight Balance Master Report...'
    }
  ];

  const SIX_STAGES_LEARNING = [
    {
      step: 1,
      rangeSec: [0, 10],
      titleKo: 'Step 1/6 · 생년월일 월령 기반 두뇌 시냅스 민감기 및 5각 학습역량지수(LQ) 산출 중...',
      titleEn: 'Step 1/6 · Mapping Neuro-Developmental Window & 5-Axis Learning Quotient (LQ)...'
    },
    {
      step: 2,
      rangeSec: [10, 20],
      titleKo: 'Step 2/6 · 문해력·수리공간·집중력·메타인지·탐구력 5대 영역 강약점(1위~3위) 판정 중...',
      titleEn: 'Step 2/6 · Analyzing Top 3 Cognitive Strengths & Top 3 Study Bottlenecks...'
    },
    {
      step: 3,
      rangeSec: [20, 30],
      titleKo: 'Step 3/6 · 우리 아이 학습 흡수 스타일 판정 및 6개월 집중력·기억력 성장 곡선 시뮬레이션 중...',
      titleEn: 'Step 3/6 · Simulating 6-Month Focus Duration & Long-Term Memory Retention Curve...'
    },
    {
      step: 4,
      rangeSec: [30, 40],
      titleKo: 'Step 4/6 · 강점 성향 기반 미래 유망 진로 TOP 3 및 향후 3개년 교과 전환 로드맵 설계 중...',
      titleEn: 'Step 4/6 · Matching Future Career Pathways & 3-Year Curriculum Roadmap...'
    },
    {
      step: 5,
      rangeSec: [40, 50],
      titleKo: 'Step 5/6 · 백지복습(인출학습) 및 밤 10시 해마→대뇌피질 수면 기억 공고화 시간표 생성 중...',
      titleEn: 'Step 5/6 · Building Active Recall & SWS Hippocampal Memory Consolidation Schedule...'
    },
    {
      step: 6,
      rangeSec: [50, 60],
      titleKo: 'Step 6/6 · 우리 아이 1:1 두뇌·학습 성향 & 시각 그래프 마스터 보고서 발행 중...',
      titleEn: 'Step 6/6 · Finalizing Personalized Brain & Learning Visual Master Report...'
    }
  ];

  const SIX_STAGES_60S = SIX_STAGES_GROWTH;

  /**
   * Renders the interactive waiting content studio inside #analysis-theatre-content
   */
  function renderTheatreSubView(profile, elapsedSec, durationMs) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('analysis-theatre-content');
    if (!container) return;

    const isLearning = isLearningModeActive(profile);
    const activeQuizzes = isLearning ? LEARNING_OX_QUIZZES : GROWTH_OX_QUIZZES;
    const cards = buildChildWaitingCards(profile);
    const cardIdx = Math.min(cards.length - 1, Math.max(0, state.activeCardIndex));
    const currentCard = cards[cardIdx];

    const quizIdx = state.activeQuizIndex % activeQuizzes.length;
    const currentQuiz = activeQuizzes[quizIdx];
    const remainingSec = Math.max(0, Math.ceil((durationMs - elapsedSec * 1000) / 1000));

    // Update top countdown badge if present
    const isEnSub = isGlobalEnMode();
    const countdownEl = document.getElementById('analysis-countdown-badge');
    if (countdownEl) {
      countdownEl.textContent = isEnSub
        ? (isLearning ? `Brain LQ Clinical Scan · ~${remainingSec}s remaining` : `Pediatric Auxology Scan · ~${remainingSec}s remaining`)
        : (isLearning ? `두뇌·학습 정밀 연산 중 · 약 ${remainingSec}초 남음` : `신체 성장 정밀 연산 중 · 약 ${remainingSec}초 남음`);
    }

    // Update 6 step pills proportionally to durationMs (e.g. 2.5s per step for 15s total)
    const stageLenSec = Math.max(0.5, (durationMs / 1000) / 6);
    const activeStageIdx = Math.min(5, Math.floor(elapsedSec / stageLenSec));
    for (let i = 0; i < 6; i++) {
      const pill = document.getElementById(`theatre-stage-pill-${i + 1}`);
      if (pill) {
        if (i < activeStageIdx) {
          pill.style.background = '#EFF6FF';
          pill.style.borderColor = '#1D4ED8';
          pill.style.color = '#1D4ED8';
          pill.textContent = `Step ${i + 1}`;
        } else if (i === activeStageIdx) {
          pill.style.background = '#EFF6FF';
          pill.style.borderColor = '#3B82F6';
          pill.style.color = '#60A5FA';
          pill.textContent = isEnSub ? `Step ${i + 1} Active` : `Step ${i + 1} 분석중`;
        } else {
          pill.style.background = 'rgba(255, 255, 255, 0.04)';
          pill.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          pill.style.color = '#64748B';
          pill.textContent = `Step ${i + 1}`;
        }
      }
    }

    const cardBodyEl = document.getElementById('theatre-dynamic-card');
    if (cardBodyEl && cardBodyEl.getAttribute('data-card-idx') !== String(cardIdx)) {
      cardBodyEl.setAttribute('data-card-idx', String(cardIdx));
      cardBodyEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.55rem; flex-wrap: wrap;">
          <span style="background: #EFF6FF; color: #1D4ED8; font-size: 0.78rem; font-weight: 800; padding: 0.22rem 0.65rem; border-radius: 9999px; border: 1px solid #BFDBFE;">
            ${currentCard.badge}
          </span>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" id="btn-theatre-prev-card" style="background: #F8FAFC; border: 1px solid #BFDBFE; color: #0F172A; border-radius: 6px; padding: 0.18rem 0.55rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;">${isEnSub ? '◀ Prev' : '◀ 이전'}</button>
            <button type="button" id="btn-theatre-next-card" style="background: #FFFFFF; border: 1px solid #FFFFFF; color: #000000; border-radius: 6px; padding: 0.18rem 0.55rem; font-size: 0.75rem; font-weight: 800; cursor: pointer;">${isEnSub ? 'Next ▶' : '다음 브리핑 ▶'}</button>
          </div>
        </div>
        <h4 style="font-size: 1.05rem; font-weight: 900; color: #0F172A; margin: 0 0 0.5rem 0; line-height: 1.4;">
          ${currentCard.title}
        </h4>
        <p style="font-size: 0.88rem; color: #475569; line-height: 1.58; margin: 0 0 0.65rem 0;">
          ${currentCard.body}
        </p>
        <div style="background: #EFF6FF; border-left: 3.5px solid #93C5FD; padding: 0.55rem 0.75rem; border-radius: 6px; font-size: 0.81rem; color: #1D4ED8; font-weight: 800;">
          ${currentCard.highlight}
        </div>
      `;

      const prevCardBtn = document.getElementById('btn-theatre-prev-card');
      const nextCardBtn = document.getElementById('btn-theatre-next-card');
      if (prevCardBtn) {
        prevCardBtn.onclick = () => {
          state.activeCardIndex = (state.activeCardIndex - 1 + cards.length) % cards.length;
          triggerHaptic('tick', cardBodyEl);
          cardBodyEl.setAttribute('data-card-idx', '-1');
          renderTheatreSubView(profile, elapsedSec, durationMs);
        };
      }
      if (nextCardBtn) {
        nextCardBtn.onclick = () => {
          state.activeCardIndex = (state.activeCardIndex + 1) % cards.length;
          triggerHaptic('tick', cardBodyEl);
          cardBodyEl.setAttribute('data-card-idx', '-1');
          renderTheatreSubView(profile, elapsedSec, durationMs);
        };
      }
    }

    const quizBoxEl = document.getElementById('theatre-ox-quiz-box');
    const quizCacheKey = `${isLearning ? 'L' : 'G'}-${quizIdx}-${state.quizAnswered}`;
    if (quizBoxEl && quizBoxEl.getAttribute('data-quiz-idx') !== quizCacheKey) {
      quizBoxEl.setAttribute('data-quiz-idx', quizCacheKey);
      const enQuizQ = isLearning
        ? 'Fact Check: Does 3-minute blank-sheet active recall retain 2.4x more long-term memory than re-reading 4 times?'
        : 'Fact Check: Do parent genetics strictly determine 70%+ of a child\'s final adult height with no room for change?';
      const enQuizExp = isLearning
        ? 'TRUE (O)! Roediger & Karpicke (2006) proved that active recall boosts 1-week retention from 48% to 92%.'
        : 'FALSE (X)! Twin studies show sleep GH, bioavailable calcium/D3/K2, and posture control up to ±3.3 in (±8.5 cm) of final height.';
      quizBoxEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
          <span style="font-size: 0.76rem; font-weight: 800; color: #1D4ED8;">
            ${isEnSub ? '1-Sec Clinical Paper Fact Check' : ((isLearning ? '두뇌·학습 뇌과학' : '키·체중 신체성장') + ' 1초 O/X 논문 팩트 퀴즈 (' + (quizIdx + 1) + '/' + activeQuizzes.length + ')')}
          </span>
          <button type="button" id="btn-theatre-next-quiz" style="background: transparent; border: none; color: #475569; font-size: 0.74rem; font-weight: 700; cursor: pointer; text-decoration: underline;">${isEnSub ? 'Next Fact ↻' : '다른 퀴즈 보기 ↻'}</button>
        </div>
        <div style="font-size: 0.92rem; font-weight: 900; color: #0F172A; margin-bottom: 0.65rem; line-height: 1.4;">
          ${isEnSub ? enQuizQ : currentQuiz.q}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
          <button type="button" id="btn-ox-o" style="padding: 0.6rem; border-radius: 10px; font-size: 0.9rem; font-weight: 800; cursor: pointer; border: 1.5px solid #93C5FD; background: #EFF6FF; color: #1D4ED8;">
            ${isEnSub ? '⭕ True (O)' : '⭕ 맞다 (O)'}
          </button>
          <button type="button" id="btn-ox-x" style="padding: 0.6rem; border-radius: 10px; font-size: 0.9rem; font-weight: 800; cursor: pointer; border: 1.5px solid #93C5FD; background: #EFF6FF; color: #1D4ED8;">
            ${isEnSub ? '✕ False (X)' : '아니다 (X)'}
          </button>
        </div>
        <div id="theatre-ox-answer" style="display: ${state.quizAnswered ? 'block' : 'none'}; margin-top: 0.6rem; padding: 0.65rem 0.8rem; background: #FFFFFF; border: 1px solid #93C5FD; border-radius: 8px; font-size: 0.8rem; color: #0F172A; line-height: 1.48;">
          ${isEnSub ? enQuizExp : currentQuiz.explain}
        </div>
      `;

      const handleAnswer = (pick) => {
        state.quizAnswered = true;
        const isCorrect = pick === currentQuiz.answer;
        triggerHaptic(isCorrect ? 'quiz_correct' : 'quiz_wrong', quizBoxEl);
        quizBoxEl.setAttribute('data-quiz-idx', '-1');
        renderTheatreSubView(profile, elapsedSec, durationMs);
      };

      const btnO = document.getElementById('btn-ox-o');
      const btnX = document.getElementById('btn-ox-x');
      const btnNextQ = document.getElementById('btn-theatre-next-quiz');
      if (btnO) btnO.onclick = () => handleAnswer('O');
      if (btnX) btnX.onclick = () => handleAnswer('X');
      if (btnNextQ) {
        btnNextQ.onclick = () => {
          state.activeQuizIndex = (state.activeQuizIndex + 1) % activeQuizzes.length;
          state.quizAnswered = false;
          triggerHaptic('tick', quizBoxEl);
          quizBoxEl.setAttribute('data-quiz-idx', '-1');
          renderTheatreSubView(profile, elapsedSec, durationMs);
        };
      }
    }
  }

  /**
   * Launches the 60-Second Personalized Analysis & Parent Content Theatre
   * @param {Object} profile - Child profile
   * @param {Object} options - { durationMs: 60000, isEn: false }
   * @param {Function} onComplete - Callback when scan finishes or is skipped
   */
  function startPersonalizedAnalysisTheatre(profile = {}, options = {}, onComplete) {
    if (state.activeTheatreTimer) {
      clearInterval(state.activeTheatreTimer);
      state.activeTheatreTimer = null;
    }

    const durationMs = typeof options.durationMs === 'number' ? options.durationMs : 4000;
    const overlay = typeof document !== 'undefined' ? document.getElementById('analysis-overlay') : null;
    const titleEl = typeof document !== 'undefined' ? document.getElementById('analysis-title') : null;
    const descEl = typeof document !== 'undefined' ? document.getElementById('analysis-desc') : null;
    const fillEl = typeof document !== 'undefined' ? document.getElementById('analysis-bar-fill') : null;
    const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';

    state.activeCardIndex = 0;
    state.activeQuizIndex = 0;
    state.quizAnswered = false;

    if (overlay) {
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');

      // Inject Theatre Containers if not already present inside .analysis-modal
      const modal = overlay.querySelector('.analysis-modal');
      if (modal && !document.getElementById('analysis-theatre-content')) {
        const theatreDiv = document.createElement('div');
        theatreDiv.id = 'analysis-theatre-content';
        theatreDiv.style.cssText = 'margin-top: 1rem; text-align: left; width: 100%;';
        theatreDiv.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.65rem; flex-wrap: wrap;">
            <span id="analysis-countdown-badge" style="font-size: 0.8rem; font-weight: 800; color: #1D4ED8; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 0.22rem 0.65rem; border-radius: 9999px;">
              정밀 맞춤 연산 중 · 약 4초 남음
            </span>
            <button type="button" id="btn-haptic-toggle" style="font-size: 0.75rem; font-weight: 700; color: #1D4ED8; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 0.2rem 0.6rem; border-radius: 9999px; cursor: pointer;">
              햅틱·진동 ON
            </button>
          </div>
          <div id="theatre-stage-pills" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.3rem; margin-bottom: 0.85rem;">
            ${[1, 2, 3, 4, 5, 6].map(n => `<div id="theatre-stage-pill-${n}" style="font-size: 0.68rem; font-weight: 800; text-align: center; padding: 0.25rem 0.15rem; border-radius: 6px; border: 1px solid #BFDBFE;">Step ${n}</div>`).join('')}
          </div>
          <div id="theatre-dynamic-card" data-card-idx="-1" style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 14px; padding: 1rem; margin-bottom: 0.85rem;"></div>
          <div id="theatre-ox-quiz-box" data-quiz-idx="-1" style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 0.85rem;"></div>
        `;
        const skipBtn = document.getElementById('btn-skip-scan');
        if (skipBtn && skipBtn.parentNode === modal) {
          modal.insertBefore(theatreDiv, skipBtn);
        } else {
          modal.appendChild(theatreDiv);
        }

        const hapticBtn = document.getElementById('btn-haptic-toggle');
        if (hapticBtn) {
          hapticBtn.onclick = () => {
            state.hapticEnabled = !state.hapticEnabled;
            hapticBtn.textContent = state.hapticEnabled ? (isGlobalEnMode() ? 'Haptic ON' : '햅틱·진동 ON') : (isGlobalEnMode() ? 'Haptic OFF' : '햅틱·진동 OFF');
            hapticBtn.style.opacity = state.hapticEnabled ? '1' : '0.6';
            if (state.hapticEnabled) triggerHaptic('tick', hapticBtn);
          };
        }
      }
    }

    if (fillEl) fillEl.style.width = '2%';

    let currentStageIdx = -1;
    let lastCardSwitchSec = 0;
    const startTime = Date.now();
    const isLearning = isLearningModeActive(profile);
    const activeStages = isLearning ? SIX_STAGES_LEARNING : SIX_STAGES_GROWTH;

    // Force fresh card & quiz render when mode changes
    const existingCardEl = typeof document !== 'undefined' ? document.getElementById('theatre-dynamic-card') : null;
    if (existingCardEl) existingCardEl.setAttribute('data-card-idx', '-1');
    const existingQuizEl = typeof document !== 'undefined' ? document.getElementById('theatre-ox-quiz-box') : null;
    if (existingQuizEl) existingQuizEl.setAttribute('data-quiz-idx', '-1');

    triggerHaptic('step', overlay);
    renderTheatreSubView(profile, 0, durationMs);

    // Stage 1 initial typewriter
    if (titleEl) {
      typewriteText(titleEl, isEn ? activeStages[0].titleEn : activeStages[0].titleKo, { charInterval: 28 });
    }
    if (descEl) {
      descEl.textContent = isLearning
        ? `${profile.birthDateStr || ''} (생후 ${profile.exactMonths || profile.ageMonths}개월) ${profile.gender === 'girl' ? '여아' : '남아'}의 두뇌 민감기·전두엽 작업기억·문해/수리 데이터를 3,714편 인지뇌과학 학술 DB와 1:1 정밀 매칭하고 있습니다.`
        : `${profile.birthDateStr || ''} (생후 ${profile.exactMonths || profile.ageMonths}개월) ${profile.gender === 'girl' ? '여아' : '남아'}의 키·체중·성장판 데이터를 3,714편 소아내분비 학술 DB 및 국가 표준 성장도표와 1:1 정밀 매칭하고 있습니다.`;
    }
    currentStageIdx = 0;

    state.activeTheatreTimer = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      const elapsedSec = elapsedMs / 1000;
      const progress = Math.min(100, Math.round((elapsedMs / durationMs) * 100));

      if (fillEl) fillEl.style.width = `${progress}%`;

      // Stage transitions every 10 seconds (or proportional to durationMs)
      const stageDurationSec = (durationMs / 1000) / 6;
      const newStageIdx = Math.min(5, Math.floor(elapsedSec / stageDurationSec));
      if (newStageIdx !== currentStageIdx) {
        currentStageIdx = newStageIdx;
        const st = activeStages[currentStageIdx];
        triggerHaptic('step', titleEl);
        if (titleEl && st) {
          typewriteText(titleEl, isEn ? st.titleEn : st.titleKo, { charInterval: 28 });
        }
      }

      // Auto-rotate waiting cards every 3.5 seconds (for 15s total duration)
      if (elapsedSec - lastCardSwitchSec >= 3.5) {
        lastCardSwitchSec = elapsedSec;
        state.activeCardIndex = (state.activeCardIndex + 1) % 6;
        const cardEl = typeof document !== 'undefined' ? document.getElementById('theatre-dynamic-card') : null;
        if (cardEl) cardEl.setAttribute('data-card-idx', '-1');
      }

      renderTheatreSubView(profile, elapsedSec, durationMs);

      if (elapsedMs >= durationMs) {
        clearInterval(state.activeTheatreTimer);
        state.activeTheatreTimer = null;
        triggerHaptic('complete', overlay);
        if (typeof onComplete === 'function') onComplete();
      }
    }, 100);

    const skipBtn = typeof document !== 'undefined' ? document.getElementById('btn-skip-scan') : null;
    if (skipBtn) {
      skipBtn.onclick = () => {
        if (state.activeTheatreTimer) {
          clearInterval(state.activeTheatreTimer);
          state.activeTheatreTimer = null;
        }
        if (state.activeTypewriterTimer) {
          clearInterval(state.activeTypewriterTimer);
          state.activeTypewriterTimer = null;
        }
        triggerHaptic('complete', skipBtn);
        if (typeof onComplete === 'function') onComplete();
      };
    }
  }

  function stopTheatre() {
    if (state.activeTheatreTimer) {
      clearInterval(state.activeTheatreTimer);
      state.activeTheatreTimer = null;
    }
    if (state.activeTypewriterTimer) {
      clearInterval(state.activeTypewriterTimer);
      state.activeTypewriterTimer = null;
    }
  }

  const TallerHapticEngine = {
    state,
    triggerHaptic,
    typewriteText,
    buildChildWaitingCards,
    PARENT_OX_QUIZZES,
    SIX_STAGES_60S,
    startPersonalizedAnalysisTheatre,
    stopTheatre
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TallerHapticEngine;
  }
  global.TallerHapticEngine = TallerHapticEngine;
  global.KidsFitHapticEngine = TallerHapticEngine;

})(typeof window !== 'undefined' ? window : global);
