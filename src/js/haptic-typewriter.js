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
 *    - User Toggle: 📳 햅틱·진동 ON/OFF safety switch
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
    el.innerHTML = `<span class="tw-text"></span><span class="tw-cursor" style="display:inline-block;margin-left:3px;color:#38BDF8;font-weight:900;">▋</span>`;
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

  /**
   * Builds 6 dynamically personalized child waiting cards based on exact DOB, gender, height, and habits
   */
  function buildChildWaitingCards(profile = {}) {
    const genderKo = profile.gender === 'girl' ? '여아' : '남아';
    const ageMonths = Number(profile.ageMonths) || 120;
    const exactMonths = Number(profile.exactMonths || ageMonths).toFixed(1);
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const nextAge1 = Math.min(20, ageYears + 1);
    const nextAge2 = Math.min(20, ageYears + 2);
    const height = Number(profile.currentHeight) || 137.0;
    const fatherH = Number(profile.fatherHeight) || 173.5;
    const motherH = Number(profile.motherHeight) || 160.5;
    const mph = Math.round(((fatherH + motherH + (profile.gender === 'girl' ? -13 : 13)) / 2) * 10) / 10;
    const dobDisplay = profile.birthDateStr || `${new Date().getFullYear() - ageYears}년생`;
    const habits = Array.isArray(profile.habits) ? profile.habits : ['late_sleep'];

    // Age-specific focus preview
    let currentFocus = '전두엽 실행기능 & 골단판 연골 증식';
    let next1Focus = '추상적 수리 추론 & 사춘기 전 골밀도 비축';
    let next2Focus = '급성장 피크(PHV) 호르몬 최적화 & 메타인지 독해';
    let keyIngredient = '식약처 인정 황기추출물 등 복합물(HT042) & 연골·어골칼슘';

    if (ageYears <= 3) {
      currentFocus = '대뇌 운동피질 30% 손끝 소근육(집게·가위질) 민감기 & 제1급성장 기초 골격';
      next1Focus = `만 ${nextAge1}세: 평면에서 3D 입체 공간지각(원목 은물·가베·자석블록)으로 두뇌 확장`;
      next2Focus = `만 ${nextAge2}세: 전두엽 자기조절력·운필력 완성 & 실내 점핑 성장판 자극`;
      keyIngredient = '영유아 구연산·연골 액상 칼슘 마그네슘 & 비타민D3 1000IU 드롭';
    } else if (ageYears <= 6) {
      currentFocus = '두정엽 3차원 공간회전(은물·가베) & 브로카 언어 폭발기 · 연 5.5~6.5cm 성장';
      next1Focus = `만 ${nextAge1}세: 초등 입학 전 40분 바른 착석 자세(거북목 예방 독서대) & 수리 규칙성`;
      next2Focus = `만 ${nextAge2}세: 박물관·과학관 3단계 하브루타 질문 대화 & 성장판 기계적 점핑 자극`;
      keyIngredient = '황기추출물(HT042) 키성장 영양제 & 어린이 연골·구연산 칼슘 800mg';
    } else if (ageYears <= 10) {
      currentFocus = '배외측 전전두엽(DLPFC) 피질 두께 피크기 & 사춘기 진입 전 숨은 키 비축 골든타임';
      next1Focus = `만 ${nextAge1}세: 사춘기 초기 골연령 가속 방어(야간 혈당·체지방 관리) & 과학 인과 추론`;
      next2Focus = `만 ${nextAge2}세: 제2급성장 피크(PHV 연 7~10cm) 폭발 지원 & 철봉 데드행 척추 감압`;
      keyIngredient = '식약처 인정 황기추출물(HT042) + 연골·어골칼슘(MCHA) + 비타민D3·K2';
    } else {
      currentFocus = '급성장 피크(PHV)~감속기 성장판 마감 방어 & 신경 축삭 수초화(Myelination) 딥워크';
      next1Focus = `만 ${nextAge1}세: 성장판 연골 잔여 잠재력(4~7cm) 극대화 & 거북목·척추 디스크 1.8cm 복원`;
      next2Focus = `만 ${nextAge2}세: 성인 최종 표적키 안착 & 고차원 메타인지 학술 추론 완성`;
      keyIngredient = '고함량 어골·연골칼슘 1100mg + 글리시네이트 마그네슘 + 아르기닌·초유 단백질';
    }

    return [
      {
        badge: `📅 브리핑 1/6 · 생년월일 일수 단위 정밀 보정`,
        title: `${dobDisplay} (생후 ${exactMonths}개월) ${genderKo}, 같은 나이여도 '월령'이 핵심입니다`,
        body: `만 ${ageYears}세 아동도 1월생과 12월생은 평균 키가 최대 <strong>4.2~5.5cm</strong> 차이 납니다. 현재 입력하신 <strong>${height}cm</strong>를 단순 연 나이가 아닌 <strong>생후 ${exactMonths}개월 일수 단위 질병관리청(KDCA) LMS 표준치</strong>로 정밀 보정하고 있습니다.`,
        highlight: `💡 우리 아이 유전 표적키(Tanner MPH): ${mph}cm (±8.5cm 범위 내에서 후천적 환경이 최대 17cm 차이를 만듭니다)`
      },
      {
        badge: `🌱 브리핑 2/6 · 이 시기 부모님이 꼭 봐야 할 핵심`,
        title: `지금 만 ${ageYears}세(${ageMonths}개월)에 가장 중요한 성장·발달 포인트`,
        body: `학부모님들이 가장 많이 놓치시는 부분입니다! 지금 우리 아이 시기에는 <strong>[${currentFocus}]</strong>에 집중해야 중복 지출 없이 키와 두뇌가 함께 자랍니다.`,
        highlight: `🎯 선택하신 습관(${habits.length}개 요인)과 현재 월령에 꼭 맞는 맞춤형 놀이 교구·필독서를 매칭 중입니다.`
      },
      {
        badge: `🧭 브리핑 3/6 · 다가올 만 ${nextAge1}세 → 만 ${nextAge2}세 미리보기`,
        title: `내년(만 ${nextAge1}세)과 내후년(만 ${nextAge2}세)에는 무엇을 신경써야 할까요?`,
        body: `아이가 자라면서 핵심 과제가 바뀝니다.<br>• <strong>다가올 만 ${nextAge1}세:</strong> ${next1Focus}<br>• <strong>다가올 만 ${nextAge2}세:</strong> ${next2Focus}`,
        highlight: `📋 잠시 후 열리는 결과 리포트에서 만 ${ageYears}세 → 만 ${nextAge1}세 → 만 ${nextAge2}세 연령별 로드맵을 한눈에 확인하세요!`
      },
      {
        badge: `🧪 브리핑 4/6 · 아이 맞춤형 핵심 영양 성분 매칭`,
        title: `아무 영양제나 먹이지 마세요! 우리 아이 핀셋 성분 처방`,
        body: `현재 ${ageMonths}개월 ${genderKo}의 골격 성장 속도와 식습관/수면 데이터를 분석한 결과, 일반 탄산칼슘(흡수율 22%) 대신 <strong>[${keyIngredient}]</strong> 조합이 최우선으로 필요합니다.`,
        highlight: `🔬 경희대 등 임상 논문(PMID:25374566)과 KDRIs 기준에 맞춘 단일 타겟 상품을 큐레이션 중입니다.`
      },
      {
        badge: `🌙 브리핑 5/6 · 수면 호르몬 & 숨은 키 1.8cm의 비밀`,
        title: `밤 10시 첫 서파수면(SWS) 90분이 하루 성장호르몬의 65%를 결정합니다`,
        body: `취침 전 단 음식(야간 혈당 스파이크)은 시상하부 소마토스타틴을 자극해 성장호르몬을 최대 <strong>-52% 억제</strong>하며, 낮 동안 눌린 척추 디스크는 저녁 <strong>패시브 데드행 90초</strong>로 즉시 복원됩니다.`,
        highlight: `⚡ 단기(1~4주) → 중기(90일) → 장기(만 20세) 논문 기반 실천 가이드를 생성하고 있습니다.`
      },
      {
        badge: `✨ 브리핑 6/6 · 1,108편 국제 학술 논문 DB 대조 완료 임박`,
        title: `우리 아이만을 위한 1:1 정밀 진단 & 핀셋 추천 리스트가 완성됩니다!`,
        body: `질병관리청 성장도표 백분위, 나이별 자동 골연령 단계, 만 ${ageYears}~${nextAge2}세 성장주기 타임라인, 그리고 클릭 즉시 연결되는 <strong>맞춤 영양제·교구·도서 핀셋 처방전</strong>이 곧 열립니다.`,
        highlight: `🏆 결과 화면 상단에서 [우리 아이 맞춤 핀셋 처방 & 연령별 성장주기 로드맵]을 바로 확인하세요!`
      }
    ];
  }

  /**
   * Interactive 1-Second O/X Parent Fact Quizzes shown during the 60s wait
   */
  const PARENT_OX_QUIZZES = [
    {
      q: 'Q1. 아이의 최종 성인 키는 부모 유전이 70% 이상 절대적으로 결정한다?',
      answer: 'X',
      explain: '정답은 ❌ 아닙니다! 일란성 쌍둥이 종단 연구에 따르면 유전 영향은 약 23~30%에 불과하며, 수면(GH 분비)·흡수율 높은 칼슘/황기추출물 등 영양·점프 운동이 최대 ±8.5cm(총 17cm 폭)를 좌우합니다.'
    },
    {
      q: 'Q2. 만 2~4세 유아기 때 손끝 소근육(집게·가위질·블록)을 많이 쓰면 초등 수학·읽기 성적이 높아진다?',
      answer: 'O',
      explain: '정답은 ⭕ 맞습니다! Grissmer 교수팀의 35,000명 종단 연구(PMID:20822219)에서 유아기 손끝 소근육 정교성은 초등 입학 후 수학·독해 성취도를 가장 강력하게 예측하는 1위 지표로 입증되었습니다.'
    },
    {
      q: 'Q3. 어린이 칼슘 영양제는 탄산칼슘이나 구연산·연골칼슘이나 흡수율이 똑같다?',
      answer: 'X',
      explain: '정답은 ❌ 아닙니다! 일반 탄산칼슘은 위산이 필요해 흡수율이 22%에 그치고 변비를 유발하기 쉽지만, 구연산·어골·연골칼슘(MCHA)은 흡수율이 약 45%(2.05배)로 높고 속쓰림이 없습니다.'
    },
    {
      q: 'Q4. 밤에 잠들기 1시간 전에 과일이나 달콤한 우유·간식을 먹고 자면 키가 더 잘 큰다?',
      answer: 'X',
      explain: '정답은 ❌ 아닙니다! 취침 2~3시간 이내 당류·탄수화물 섭취는 인슐린과 소마토스타틴을 분비시켜 밤 10시~2시 성장호르몬 피크를 최대 52%까지 억제합니다.'
    }
  ];

  const SIX_STAGES_60S = [
    {
      step: 1,
      rangeSec: [0, 10],
      titleKo: 'Step 1/6 · 생년월일 기반 일수 단위 정밀 월령 산출 및 질병관리청(KDCA) LMS 대조 중...',
      titleEn: 'Step 1/6 · Computing Exact Chronological Age (Days/Months) & KDCA/CDC LMS Z-Score...'
    },
    {
      step: 2,
      rangeSec: [10, 20],
      titleKo: 'Step 2/6 · 나이·성별 맞춤 골연령 진행 단계 자동 설정 및 부모 유전키(MPH) 보정 중...',
      titleEn: 'Step 2/6 · Auto-Detecting Skeletal Maturation Stage & Tanner Mid-Parental Height...'
    },
    {
      step: 3,
      rangeSec: [20, 30],
      titleKo: 'Step 3/6 · 수면·영양·자세 저해 요인별 24시간 성장호르몬(GH-IGF1) 분비 곡선 시뮬레이션 중...',
      titleEn: 'Step 3/6 · Simulating 24-Hour GH-IGF1 Secretion & Bio-Inhibition Factors...'
    },
    {
      step: 4,
      rangeSec: [30, 40],
      titleKo: 'Step 4/6 · 1,108편 국제 소아내분비·뇌신경 학술 논문 DB에서 우리 아이 맞춤 근거 추출 중...',
      titleEn: 'Step 4/6 · Matching Child Profile Against 1,108+ Peer-Reviewed Clinical Studies...'
    },
    {
      step: 5,
      rangeSec: [40, 50],
      titleKo: 'Step 5/6 · 현재 나이부터 내년·내후년 연령별 성장주기 핵심 과제 로드맵 설계 중...',
      titleEn: 'Step 5/6 · Building Year-by-Year Sequential Developmental Lifecycle Roadmap...'
    },
    {
      step: 6,
      rangeSec: [50, 60],
      titleKo: 'Step 6/6 · 아이 맞춤 핀셋 영양제(황기추출물·연골칼슘 등)·놀이교구·도서 큐레이션 완성 중...',
      titleEn: 'Step 6/6 · Finalizing Pinpoint Supplement, Manipulative Toy & Book Prescriptions...'
    }
  ];

  /**
   * Renders the interactive waiting content studio inside #analysis-theatre-content
   */
  function renderTheatreSubView(profile, elapsedSec, durationMs) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('analysis-theatre-content');
    if (!container) return;

    const cards = buildChildWaitingCards(profile);
    const cardIdx = Math.min(cards.length - 1, Math.max(0, state.activeCardIndex));
    const currentCard = cards[cardIdx];

    const quizIdx = state.activeQuizIndex % PARENT_OX_QUIZZES.length;
    const currentQuiz = PARENT_OX_QUIZZES[quizIdx];
    const remainingSec = Math.max(0, Math.ceil((durationMs - elapsedSec * 1000) / 1000));

    // Update top countdown badge if present
    const countdownEl = document.getElementById('analysis-countdown-badge');
    if (countdownEl) {
      countdownEl.textContent = `정밀 맞춤 연산 중 · 약 ${remainingSec}초 남음`;
    }

    // Update 6 step pills
    const activeStageIdx = Math.min(5, Math.floor(elapsedSec / 10));
    for (let i = 0; i < 6; i++) {
      const pill = document.getElementById(`theatre-stage-pill-${i + 1}`);
      if (pill) {
        if (i < activeStageIdx) {
          pill.style.background = '#ECFDF5';
          pill.style.borderColor = '#059669';
          pill.style.color = '#059669';
          pill.textContent = `✓ Step ${i + 1}`;
        } else if (i === activeStageIdx) {
          pill.style.background = '#FDF3F0';
          pill.style.borderColor = '#C86D51';
          pill.style.color = '#C86D51';
          pill.textContent = `✦ Step ${i + 1} 분석중`;
        } else {
          pill.style.background = '#FAF8F5';
          pill.style.borderColor = '#E6DFD5';
          pill.style.color = '#8C857B';
          pill.textContent = `Step ${i + 1}`;
        }
      }
    }

    const cardBodyEl = document.getElementById('theatre-dynamic-card');
    if (cardBodyEl && cardBodyEl.getAttribute('data-card-idx') !== String(cardIdx)) {
      cardBodyEl.setAttribute('data-card-idx', String(cardIdx));
      cardBodyEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.55rem; flex-wrap: wrap;">
          <span style="background: #FDF3F0; color: #C86D51; font-size: 0.78rem; font-weight: 800; padding: 0.22rem 0.65rem; border-radius: 9999px; border: 1px solid rgba(200,109,81,0.3);">
            ${currentCard.badge}
          </span>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" id="btn-theatre-prev-card" style="background: #FFFFFF; border: 1px solid #E6DFD5; color: #181512; border-radius: 6px; padding: 0.18rem 0.55rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;">◀ 이전</button>
            <button type="button" id="btn-theatre-next-card" style="background: #181512; border: 1px solid #181512; color: #FAF8F5; border-radius: 6px; padding: 0.18rem 0.55rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;">다음 브리핑 ▶</button>
          </div>
        </div>
        <h4 style="font-size: 1.05rem; font-weight: 900; color: #181512; margin: 0 0 0.5rem 0; line-height: 1.4;">
          ${currentCard.title}
        </h4>
        <p style="font-size: 0.88rem; color: #44403C; line-height: 1.58; margin: 0 0 0.65rem 0;">
          ${currentCard.body}
        </p>
        <div style="background: #ECFDF5; border-left: 3.5px solid #059669; padding: 0.55rem 0.75rem; border-radius: 6px; font-size: 0.81rem; color: #065F46; font-weight: 800;">
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
    if (quizBoxEl && quizBoxEl.getAttribute('data-quiz-idx') !== `${quizIdx}-${state.quizAnswered}`) {
      quizBoxEl.setAttribute('data-quiz-idx', `${quizIdx}-${state.quizAnswered}`);
      quizBoxEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
          <span style="font-size: 0.76rem; font-weight: 800; color: #4F46E5;">
            ⚡ 기다리는 동안 1초 터치 O/X 논문 팩트 퀴즈 (${quizIdx + 1}/${PARENT_OX_QUIZZES.length})
          </span>
          <button type="button" id="btn-theatre-next-quiz" style="background: transparent; border: none; color: #57534E; font-size: 0.74rem; font-weight: 700; cursor: pointer; text-decoration: underline;">다른 퀴즈 보기 ↻</button>
        </div>
        <div style="font-size: 0.92rem; font-weight: 900; color: #181512; margin-bottom: 0.65rem; line-height: 1.4;">
          ${currentQuiz.q}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
          <button type="button" id="btn-ox-o" style="padding: 0.6rem; border-radius: 10px; font-size: 0.9rem; font-weight: 800; cursor: pointer; border: 1.5px solid #059669; background: #ECFDF5; color: #059669;">
            ⭕ 맞다 (O)
          </button>
          <button type="button" id="btn-ox-x" style="padding: 0.6rem; border-radius: 10px; font-size: 0.9rem; font-weight: 800; cursor: pointer; border: 1.5px solid #C86D51; background: #FDF3F0; color: #C86D51;">
            ❌ 아니다 (X)
          </button>
        </div>
        <div id="theatre-ox-answer" style="display: ${state.quizAnswered ? 'block' : 'none'}; margin-top: 0.6rem; padding: 0.65rem 0.8rem; background: #FFFFFF; border: 1px solid #059669; border-radius: 8px; font-size: 0.8rem; color: #181512; line-height: 1.48;">
          ${currentQuiz.explain}
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
          state.activeQuizIndex = (state.activeQuizIndex + 1) % PARENT_OX_QUIZZES.length;
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

    const durationMs = typeof options.durationMs === 'number' ? options.durationMs : 60000;
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
            <span id="analysis-countdown-badge" style="font-size: 0.8rem; font-weight: 800; color: #059669; background: #ECFDF5; border: 1px solid rgba(5,150,105,0.3); padding: 0.22rem 0.65rem; border-radius: 9999px;">
              정밀 맞춤 연산 중 · 약 60초 남음
            </span>
            <button type="button" id="btn-haptic-toggle" style="font-size: 0.75rem; font-weight: 700; color: #C86D51; background: #FDF3F0; border: 1px solid rgba(200,109,81,0.35); padding: 0.2rem 0.6rem; border-radius: 9999px; cursor: pointer;">
              📳 햅틱·진동 ON
            </button>
          </div>
          <div id="theatre-stage-pills" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.3rem; margin-bottom: 0.85rem;">
            ${[1, 2, 3, 4, 5, 6].map(n => `<div id="theatre-stage-pill-${n}" style="font-size: 0.68rem; font-weight: 800; text-align: center; padding: 0.25rem 0.15rem; border-radius: 6px; border: 1px solid #E6DFD5;">Step ${n}</div>`).join('')}
          </div>
          <div id="theatre-dynamic-card" data-card-idx="-1" style="background: #FAF8F5; border: 1px solid #E6DFD5; border-radius: 14px; padding: 1rem; margin-bottom: 0.85rem;"></div>
          <div id="theatre-ox-quiz-box" data-quiz-idx="-1" style="background: #F4EFE6; border: 1px solid #E6DFD5; border-radius: 14px; padding: 0.85rem;"></div>
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
            hapticBtn.textContent = state.hapticEnabled ? '📳 햅틱·진동 ON' : '🔇 햅틱·진동 OFF';
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

    triggerHaptic('step', overlay);
    renderTheatreSubView(profile, 0, durationMs);

    // Stage 1 initial typewriter
    if (titleEl) {
      typewriteText(titleEl, isEn ? SIX_STAGES_60S[0].titleEn : SIX_STAGES_60S[0].titleKo, { charInterval: 28 });
    }
    if (descEl) {
      descEl.textContent = `${profile.birthDateStr || ''} (생후 ${profile.exactMonths || profile.ageMonths}개월) ${profile.gender === 'girl' ? '여아' : '남아'} 데이터를 1,108편 학술 DB 및 국가 표준 성장도표와 1:1 정밀 매칭하고 있습니다.`;
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
        const st = SIX_STAGES_60S[currentStageIdx];
        triggerHaptic('step', titleEl);
        if (titleEl && st) {
          typewriteText(titleEl, isEn ? st.titleEn : st.titleKo, { charInterval: 28 });
        }
      }

      // Auto-rotate waiting cards every 10 seconds
      if (elapsedSec - lastCardSwitchSec >= 10) {
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
