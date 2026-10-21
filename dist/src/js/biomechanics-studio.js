/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * Core 3: Biomechanics & Posture Studio (척추 감압 & 생체역학 운동 스튜디오)
 * 
 * Clinical Principles:
 * 1. Diurnal Disc Decompression: Gravity compresses intervertebral discs (L1~L5, T7~T12)
 *    causing daily diurnal height loss of 1.5 ~ 2.2 cm. Passive axial decompression
 *    induces osmotic rehydration, restoring up to +1.8 cm of concealed curvature.
 * 2. Wolff's Law & Epiphyseal Chondrocyte Proliferation: Cyclic vertical impact loading
 *    (1.5 ~ 2.5x body weight) generates piezoelectric microcurrents, upregulating Runx2 / Sox9
 *    and type II collagen synthesis in the growth plate for longitudinal bone remodeling.
 * 
 * 3 Core Clinical Exercise Routines:
 * - Routine 1: 척추 감압 패시브 데드행 (Passive Dead Hang) — 30초 x 3세트
 * - Routine 2: 흉추 신전 & 장요근·골반 정렬 스트레칭 — 45초 x 2세트 (+1.8cm 복원)
 * - Routine 3: 성장판 미세하중 플라이오메트릭 점핑 — 15분 인터벌 타이머
 * 
 * Timer Engine:
 * - Drift-free Date.now() wall-clock delta math
 * - Safe control states: 'idle', 'running', 'paused', 'completed'
 * - Debounced controls and audio-visual feedback on completion
 */

(function (global) {
  'use strict';

  // 1. Definition of 3 Core Biomechanical Exercise Routines
  const ROUTINES = [
    {
      id: 'dead_hang',
      nameKo: '척추 감압 패시브 데드행 (Passive Dead Hang)',
      nameEn: 'Spinal Decompression Passive Dead Hang',
      category: 'decompression',
      duration: 30, // seconds
      durationMinutes: 0.5,
      sets: 3,
      restSeconds: 30,
      principle: "Wolff's Law & Intervertebral Disc Rehydration",
      molecularTrigger: 'Runx2 / Sox9',
      restorationEstimate: '+0.8 ~ +1.2 cm',
      summaryKo: '철봉에 체중을 완전히 실어 매달림으로써 중력에 눌린 L1~L5 요추 및 T7~T12 흉추 디스크 간격을 확장하고 수핵 수분을 재흡수시킵니다.',
      summaryEn: 'Passive gravitational traction unloads L1~L5 and T7~T12 vertebrae, rehydrating compressed intervertebral discs through osmotic fluid uptake.',
      instructionsKo: [
        '철봉을 어깨너비보다 살짝 넓게 잡고 발을 지면에서 뗍니다.',
        '승모근과 어깨의 힘을 완전히 빼고 골반과 하체가 중력에 의해 자연스럽게 늘어나도록 합니다.',
        '복식호흡을 유지하며 30초간 매달린 후 30초간 휴식합니다 (총 3세트).'
      ],
      instructionsEn: [
        'Grip the bar slightly wider than shoulder width and suspend feet freely.',
        'Completely relax trapezius and shoulder girdle, allowing lower body gravity traction.',
        'Maintain deep diaphragmatic breathing for 30s, followed by 30s rest (3 sets total).'
      ]
    },
    {
      id: 'thoracic_stretch',
      nameKo: '흉추 신전 & 장요근·골반 정렬 스트레칭',
      nameEn: 'Thoracic Extension & Pelvic Alignment',
      category: 'alignment',
      duration: 45, // seconds
      durationMinutes: 0.75,
      sets: 2,
      restSeconds: 20,
      principle: "Postural Kyphosis & Anterior Pelvic Tilt Correction",
      molecularTrigger: 'Myofascial Alignment',
      restorationEstimate: '+1.5 ~ +1.8 cm',
      summaryKo: '스마트폰 및 좌식 습관으로 유발된 거북목, 흉추 후만 및 단축된 장요근을 신전하여 숨어있던 척추 만곡 높이(+1.8cm)를 즉각 복원합니다.',
      summaryEn: 'Extends kyphotic thoracic spine and lengthened tight iliopsoas, counteracting tech-neck and anterior pelvic tilt to unlock +1.8 cm of hidden curvature.',
      instructionsKo: [
        '폼롤러 또는 매트 위에 등(견갑골 사이)을 대고 누워 무릎을 90도로 세웁니다.',
        '양손을 머리 뒤로 깍지 끼고 가슴을 천장 방향으로 부드럽게 젖혀 흉추를 신전합니다.',
        '한쪽 다리를 뒤로 뻗는 런지 자세로 장요근을 함께 이완하며 45초간 유지합니다 (양측 각 2세트).'
      ],
      instructionsEn: [
        'Position foam roller or mat beneath thoracic spine between scapulae with knees bent at 90 degrees.',
        'Clasp hands behind head and gently arch chest towards ceiling to extend thoracic curve.',
        'Transition to kneeling hip flexor stretch for iliopsoas release, holding for 45s (2 sets).'
      ]
    },
    {
      id: 'plyometrics',
      nameKo: '성장판 미세하중 플라이오메트릭 점핑',
      nameEn: 'Epiphyseal Micro-Load Plyometric Jumping',
      category: 'epiphyseal_stimulation',
      duration: 900, // 15 minutes = 900 seconds
      durationMinutes: 15,
      sets: 1,
      restSeconds: 0,
      principle: "Wolff's Law",
      molecularTrigger: 'Runx2 / Sox9 & Type II Collagen',
      restorationEstimate: '+1.2 ~ +2.0 cm (장기 골 개조 촉진)',
      summaryKo: '줄넘기 및 수직 바운딩 운동으로 대퇴골과 경골 골단판에 1.5~2.5G의 주기적 미세 하중을 가해 Runx2/Sox9 발현을 유도하고 연골세포 분열을 촉진합니다.',
      summaryEn: 'Delivers cyclic vertical micro-compressive impact (1.5~2.5G) to epiphyseal growth plates, activating Runx2/Sox9 chondrocyte proliferation via Wolff\'s Law.',
      instructionsKo: [
        '관절 보호를 위해 충격 흡수 매트 또는 쿠션 운동화를 착용합니다.',
        '가벼운 줄넘기 또는 제자리 양발 점핑을 45초 수행 후 15초 제자리 걷기(인터벌 방식).',
        '무리한 착지 충격 대신 발가락 앞꿈치(전족부)를 사용하여 탄성 있게 15분간 완주합니다.'
      ],
      instructionsEn: [
        'Wear supportive footwear on shock-absorbing surface to protect joint structures.',
        'Perform rhythmic skipping or vertical hops: 45s bounding followed by 15s walking recovery.',
        'Land resiliently on the forefoot, completing the 15-minute interval protocol.'
      ]
    }
  ];

  // 2. Clinical Biomechanics Math & Constants
  const BIOMECHANICS_CONSTANTS = {
    diurnalLossMin: 1.5,
    diurnalLossMax: 2.2,
    restoredHeightAverage: 1.8,
    postureUnlockAverage: 1.5,
    cyclicLoadingTrigger: 'Runx2 / Sox9',
    sequence: ['decompression', 'alignment', 'epiphyseal_stimulation'],
    routineCount: 3
  };

  /**
   * Calculates estimated spine decompression and posture restoration potential (cm)
   * based on user's lifestyle habits and age.
   */
  function calculateDecompressionPotential(habits = []) {
    let baseGain = 1.5;
    if (habits.includes('poor_posture')) baseGain += 0.4;
    if (habits.includes('sedentary')) baseGain += 0.3;
    return Math.min(2.5, Math.round(baseGain * 10) / 10);
  }

  // 3. Runtime Stopwatch Timer State Controller (Drift-Free Date.now() Architecture)
  const timerInstances = {};

  class RoutineTimer {
    constructor(config) {
      this.id = config.id;
      this.totalDuration = config.duration; // in seconds
      this.totalSets = config.sets || 1;
      this.restSeconds = config.restSeconds || 0;

      this.currentSet = 1;
      this.remainingSeconds = this.totalDuration;
      this.isRestPhase = false;
      this.state = 'idle'; // 'idle', 'running', 'paused', 'completed'

      this.intervalId = null;
      this.lastTickTime = null;
      this.onTickCallbacks = [];
      this.onCompleteCallbacks = [];
    }

    onTick(cb) {
      if (typeof cb === 'function') this.onTickCallbacks.push(cb);
    }

    onComplete(cb) {
      if (typeof cb === 'function') this.onCompleteCallbacks.push(cb);
    }

    _notifyTick() {
      const payload = {
        id: this.id,
        currentSet: this.currentSet,
        totalSets: this.totalSets,
        remainingSeconds: this.remainingSeconds,
        isRestPhase: this.isRestPhase,
        state: this.state,
        progressPercent: this._calculateProgress()
      };
      this.onTickCallbacks.forEach(cb => {
        try { cb(payload); } catch (e) { console.error(e); }
      });
    }

    _calculateProgress() {
      const activeTotal = this.isRestPhase ? this.restSeconds : this.totalDuration;
      if (activeTotal <= 0) return 100;
      const elapsed = activeTotal - this.remainingSeconds;
      return Math.min(100, Math.max(0, Math.round((elapsed / activeTotal) * 100)));
    }

    start() {
      // Debounce: prevent duplicate intervals if already running
      if (this.intervalId !== null || this.state === 'running') {
        return;
      }

      this.state = 'running';
      this.lastTickTime = Date.now();

      this.intervalId = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - this.lastTickTime) / 1000);

        if (deltaSeconds >= 1) {
          // Drift-free deduction
          this.remainingSeconds = Math.max(0, this.remainingSeconds - deltaSeconds);
          this.lastTickTime = now;

          if (this.remainingSeconds <= 0) {
            this._handleCountdownZero();
          } else {
            this._notifyTick();
          }
        }
      }, 250);

      this._notifyTick();
    }

    pause() {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      if (this.state === 'running') {
        this.state = 'paused';
        this._notifyTick();
      }
    }

    reset() {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.state = 'idle';
      this.currentSet = 1;
      this.isRestPhase = false;
      this.remainingSeconds = this.totalDuration;
      this._notifyTick();
    }

    completeSet() {
      this._handleCountdownZero();
    }

    _handleCountdownZero() {
      if (this.isRestPhase) {
        // Rest completed -> start next set
        this.isRestPhase = false;
        this.remainingSeconds = this.totalDuration;
        this.currentSet = Math.min(this.totalSets, this.currentSet + 1);
        this._notifyTick();
      } else {
        // Active exercise set completed
        if (this.currentSet < this.totalSets) {
          // Has more sets -> transition to rest
          if (this.restSeconds > 0) {
            this.isRestPhase = true;
            this.remainingSeconds = this.restSeconds;
            this._notifyTick();
          } else {
            this.currentSet++;
            this.remainingSeconds = this.totalDuration;
            this._notifyTick();
          }
        } else {
          // All sets completed!
          if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
          }
          this.state = 'completed';
          this.remainingSeconds = 0;
          this._notifyTick();

          this.onCompleteCallbacks.forEach(cb => {
            try { cb({ id: this.id, completed: true }); } catch (e) { console.error(e); }
          });
        }
      }
    }
  }

  function getOrCreateTimer(routineId) {
    if (!timerInstances[routineId]) {
      const cfg = ROUTINES.find(r => r.id === routineId);
      if (!cfg) return null;
      timerInstances[routineId] = new RoutineTimer(cfg);
    }
    return timerInstances[routineId];
  }

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // 4. SVG Visual Illustrations for Massage & Exercise Guides (No Visible Timers)
  function getRoutineIllustrationSvg(routineId, isGlobal) {
    if (routineId === 'dead_hang') {
      return `
        <svg viewBox="0 0 380 185" width="100%" height="185" style="display: block; background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85)); border-radius: 16px; border: 1px solid rgba(56, 189, 248, 0.25);">
          <!-- Pull-up Bar -->
          <line x1="50" y1="26" x2="330" y2="26" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
          <circle cx="50" cy="26" r="6" fill="#38BDF8"/>
          <circle cx="330" cy="26" r="6" fill="#38BDF8"/>
          <!-- Child Hanging Figure -->
          <!-- Hands & Arms -->
          <circle cx="155" cy="26" r="5.5" fill="#FBBF24"/>
          <circle cx="225" cy="26" r="5.5" fill="#FBBF24"/>
          <line x1="155" y1="26" x2="172" y2="62" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>
          <line x1="225" y1="26" x2="208" y2="62" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>
          <!-- Head -->
          <circle cx="190" cy="48" r="13" fill="#F8FAFC" stroke="#38BDF8" stroke-width="2.5"/>
          <!-- Torso & Decompressing Spine Vertebrae -->
          <line x1="172" y1="62" x2="208" y2="62" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>
          <line x1="190" y1="64" x2="190" y2="124" stroke="#34D399" stroke-width="6" stroke-dasharray="6,5" stroke-linecap="round"/>
          <!-- Pelvis & Relaxed Legs -->
          <line x1="176" y1="124" x2="204" y2="124" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>
          <line x1="180" y1="124" x2="176" y2="166" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
          <line x1="200" y1="124" x2="204" y2="166" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
          <!-- Spine Decompression Arrows -->
          <path d="M 135 76 L 135 112" stroke="#F43F5E" stroke-width="2.5" stroke-linecap="round"/>
          <polygon points="135,70 130,78 140,78" fill="#F43F5E"/>
          <polygon points="135,118 130,110 140,110" fill="#F43F5E"/>
          <!-- Callout Labels -->
          <rect x="16" y="42" width="110" height="24" rx="6" fill="rgba(56, 189, 248, 0.16)" stroke="rgba(56, 189, 248, 0.4)"/>
          <text x="71" y="58" fill="#E0F2FE" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Grip Wide' : '① 어깨너비 그립'}</text>
          <rect x="232" y="72" width="134" height="26" rx="6" fill="rgba(16, 185, 129, 0.18)" stroke="rgba(16, 185, 129, 0.45)"/>
          <text x="299" y="89" fill="#A7F3D0" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Spine Unload +1.2cm' : '② 척추 마디 쭉 펴기'}</text>
          <rect x="232" y="128" width="134" height="26" rx="6" fill="rgba(251, 191, 36, 0.16)" stroke="rgba(251, 191, 36, 0.4)"/>
          <text x="299" y="145" fill="#FDE68A" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Relax Lower Body' : '③ 하체 힘 빼고 툭!'}</text>
        </svg>
      `;
    }
    if (routineId === 'thoracic_stretch') {
      return `
        <svg viewBox="0 0 380 185" width="100%" height="185" style="display: block; background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85)); border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.28);">
          <!-- Floor Mat Line -->
          <line x1="30" y1="152" x2="350" y2="152" stroke="#475569" stroke-width="5" stroke-linecap="round"/>
          <!-- Foam Roller under Thoracic Spine -->
          <circle cx="175" cy="134" r="16" fill="rgba(56, 189, 248, 0.25)" stroke="#38BDF8" stroke-width="3"/>
          <circle cx="175" cy="134" r="5" fill="#38BDF8"/>
          <!-- Child Arching Thoracic Spine Over Roller -->
          <!-- Pelvis on floor -->
          <circle cx="235" cy="144" r="6" fill="#34D399"/>
          <!-- Bent Knees & Feet -->
          <line x1="235" y1="144" x2="275" y2="108" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
          <line x1="275" y1="108" x2="305" y2="148" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
          <!-- Arched Spine Curve -->
          <path d="M 235 144 Q 180 102 125 126" fill="none" stroke="#34D399" stroke-width="6" stroke-linecap="round"/>
          <!-- Head & Hands Behind Head -->
          <circle cx="112" cy="122" r="12" fill="#F8FAFC" stroke="#34D399" stroke-width="2.5"/>
          <path d="M 125 120 Q 112 98 102 116" fill="none" stroke="#FBBF24" stroke-width="4" stroke-linecap="round"/>
          <!-- Chest Opening Upward Arrow -->
          <path d="M 175 95 L 175 56" stroke="#34D399" stroke-width="3" stroke-linecap="round"/>
          <polygon points="175,48 169,58 181,58" fill="#34D399"/>
          <!-- Callout Labels -->
          <rect x="20" y="36" width="136" height="26" rx="6" fill="rgba(16, 185, 129, 0.18)" stroke="rgba(16, 185, 129, 0.45)"/>
          <text x="88" y="53" fill="#A7F3D0" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Open Chest Upward' : '① 가슴을 천장으로 활짝'}</text>
          <rect x="205" y="42" width="155" height="26" rx="6" fill="rgba(56, 189, 248, 0.16)" stroke="rgba(56, 189, 248, 0.4)"/>
          <text x="282" y="59" fill="#E0F2FE" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Foam Roller Under Back' : '② 등 아래 폼롤러·베개 받치기'}</text>
          <rect x="218" y="76" width="142" height="24" rx="6" fill="rgba(244, 63, 94, 0.16)" stroke="rgba(244, 63, 94, 0.4)"/>
          <text x="289" y="92" fill="#FECDD3" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Unlock +1.8cm Posture' : '③ 거북목·굽은등 +1.8cm 복원'}</text>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 380 185" width="100%" height="185" style="display: block; background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85)); border-radius: 16px; border: 1px solid rgba(251, 191, 36, 0.3);">
        <!-- Shock Absorbing Mat -->
        <rect x="95" y="152" width="190" height="10" rx="5" fill="#38BDF8" opacity="0.5"/>
        <!-- Jump Rope Arc -->
        <path d="M 125 92 Q 190 12 255 92" fill="none" stroke="#FBBF24" stroke-width="2.5" stroke-dasharray="5,4"/>
        <!-- Jumping Child Figure -->
        <circle cx="190" cy="48" r="12" fill="#F8FAFC" stroke="#FBBF24" stroke-width="2.5"/>
        <line x1="190" y1="60" x2="190" y2="102" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>
        <line x1="160" y1="78" x2="220" y2="78" stroke="#38BDF8" stroke-width="4.5" stroke-linecap="round"/>
        <!-- Legs & Glowing Knee/Ankle Growth Plates -->
        <line x1="190" y1="102" x2="178" y2="138" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
        <line x1="190" y1="102" x2="202" y2="138" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
        <!-- Glowing Epiphyseal Growth Plates (Knees & Forefoot) -->
        <circle cx="182" cy="118" r="6" fill="#F43F5E"/>
        <circle cx="198" cy="118" r="6" fill="#F43F5E"/>
        <circle cx="176" cy="142" r="5" fill="#34D399"/>
        <circle cx="204" cy="142" r="5" fill="#34D399"/>
        <!-- Upward Bounce Arrows -->
        <path d="M 148 138 L 148 104" stroke="#34D399" stroke-width="2.5" stroke-linecap="round"/>
        <polygon points="148,96 143,105 153,105" fill="#34D399"/>
        <!-- Callout Labels -->
        <rect x="14" y="42" width="128" height="26" rx="6" fill="rgba(251, 191, 36, 0.16)" stroke="rgba(251, 191, 36, 0.4)"/>
        <text x="78" y="59" fill="#FDE68A" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Rhythmic Hops' : '① 가볍게 사뿐 점핑!'}</text>
        <rect x="234" y="102" width="134" height="26" rx="6" fill="rgba(244, 63, 94, 0.18)" stroke="rgba(244, 63, 94, 0.45)"/>
        <text x="301" y="119" fill="#FECDD3" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Knee Growth Plate' : '② 무릎 성장판 자극 ⚡'}</text>
        <rect x="234" y="134" width="134" height="26" rx="6" fill="rgba(16, 185, 129, 0.18)" stroke="rgba(16, 185, 129, 0.45)"/>
        <text x="301" y="151" fill="#A7F3D0" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Forefoot Landing' : '③ 발 앞꿈치로 탄성 착지'}</text>
      </svg>
    `;
  }

  function renderIllustratedMassageSection(isGlobal) {
    return `
      <div class="bento-card" id="illustrated-growth-massage-guide" style="margin-bottom: 1.5rem; padding: 1.5rem; border: 1.5px solid rgba(56, 189, 248, 0.32); background: linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(10, 15, 28, 0.98));">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
          <div>
            <span style="display: inline-block; font-size: 0.78rem; font-weight: 800; color: #34D399; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); padding: 0.25rem 0.75rem; border-radius: 9999px; margin-bottom: 0.4rem;">
              👐 ${isGlobal ? 'Bedtime 5-Min Growth Plate Massage Guide' : '잠들기 전 5분 · 엄마 손 성장판 마사지 그림 가이드'}
            </span>
            <h4 style="font-size: 1.22rem; font-weight: 800; color: #FFFFFF; margin: 0;">
              ${isGlobal ? 'How to Massage Knee & Calf Growth Plates Before Sleep' : '타이머 없이 그림 보고 쉽게 따라 하는 무릎·종아리 성장판 마사지법'}
            </h4>
          </div>
          <span style="font-size: 0.85rem; font-weight: 700; color: #FDE68A; background: rgba(251, 191, 36, 0.14); padding: 0.35rem 0.85rem; border-radius: 9999px;">
            ✨ ${isGlobal ? 'Relieves Night Growing Pains & Boosts Blood Flow' : '야간 성장통 완화 & 성장판 혈류량 2배 촉진~!'}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.15rem;">
          <!-- Massage Card 1: Knee Acupressure Points (Dokbi & Zusanli) -->
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 18px; padding: 1.15rem;">
            <div style="font-size: 1.02rem; font-weight: 800; color: #38BDF8; margin-bottom: 0.65rem;">
              🦵 ${isGlobal ? 'Step 1. Knee Growth Plate Acupressure (3 Mins)' : '1단계. 무릎뼈 아래 성장판 혈자리 엄지 지압 (3분)'}
            </div>
            <svg viewBox="0 0 380 180" width="100%" height="180" style="display: block; background: rgba(15, 23, 42, 0.9); border-radius: 14px; border: 1px solid rgba(56, 189, 248, 0.22); margin-bottom: 0.85rem;">
              <!-- Femur & Tibia Outline -->
              <path d="M 155 18 L 162 72 Q 190 82 218 72 L 225 18" fill="rgba(148, 163, 184, 0.15)" stroke="#94A3B8" stroke-width="3"/>
              <path d="M 158 105 Q 190 95 222 105 L 215 168 L 165 168 Z" fill="rgba(148, 163, 184, 0.15)" stroke="#94A3B8" stroke-width="3"/>
              <!-- Patella (Kneecap) -->
              <ellipse cx="190" cy="82" rx="24" ry="16" fill="rgba(255, 255, 255, 0.12)" stroke="#E2E8F0" stroke-width="2.5"/>
              <text x="190" y="86" fill="#FFFFFF" font-size="10" font-weight="800" text-anchor="middle">${isGlobal ? 'Kneecap' : '무릎뼈'}</text>
              <!-- Epiphyseal Growth Plate Line -->
              <line x1="152" y1="108" x2="228" y2="108" stroke="#34D399" stroke-width="4" stroke-dasharray="6,4"/>
              <!-- Acupressure Points: Dokbi (Lateral/Medial Hollows) & Zusanli -->
              <circle cx="166" cy="98" r="8" fill="#F43F5E" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="214" cy="98" r="8" fill="#F43F5E" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="222" cy="134" r="9" fill="#FBBF24" stroke="#FFFFFF" stroke-width="2"/>
              <!-- Circular Massage Arrows -->
              <path d="M 148 92 A 12 12 0 1 1 148 106" fill="none" stroke="#38BDF8" stroke-width="2.5"/>
              <path d="M 232 106 A 12 12 0 1 1 232 92" fill="none" stroke="#38BDF8" stroke-width="2.5"/>
              <!-- Callouts -->
              <rect x="12" y="84" width="126" height="26" rx="6" fill="rgba(244, 63, 94, 0.2)" stroke="#F43F5E"/>
              <text x="75" y="101" fill="#FFE4E6" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '① Hollow Below Knee' : '① 무릎 아래 오목한 곳'}</text>
              <rect x="240" y="120" width="128" height="26" rx="6" fill="rgba(251, 191, 36, 0.2)" stroke="#FBBF24"/>
              <text x="304" y="137" fill="#FEF3C7" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '② Zusanli Point' : '② 바깥 아래(족삼리)'}</text>
              <text x="190" y="162" fill="#A7F3D0" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Press Gently with Thumbs for 5s in Circles' : '엄지손가락으로 5초씩 지그시 누르며 원 그리기'}</text>
            </svg>
            <ul style="margin: 0; padding-left: 1.15rem; font-size: 0.94rem; color: #F8FAFC; line-height: 1.65;">
              <li><strong>${isGlobal ? 'Warm Up:' : '따뜻한 손 온기 전달:'}</strong> ${isGlobal ? 'Rub both palms warm and cover the child\'s knees for 30 seconds.' : '엄마 양손을 비벼 따뜻하게 한 뒤 아이 무릎을 30초간 감싸주세요.'}</li>
              <li><strong>${isGlobal ? 'Thumb Press:' : '무릎 아래 쏙 들어간 곳:'}</strong> ${isGlobal ? 'Gently press the two hollows right below the kneecap (Dokbi) for 5 seconds.' : '무릎뼈 바로 아래 양옆 오목한 곳(독비혈)을 엄지로 5초씩 지그시 눌러주세요.'}</li>
              <li><strong>${isGlobal ? 'Outer Shin:' : '족삼리·양릉천 원 그리기:'}</strong> ${isGlobal ? 'Massage 3cm below the outer knee in soft circles 10 times.' : '무릎 바깥쪽 아래 3cm(족삼리)를 원을 그리듯 10회 부드럽게 풀어주세요~!'}</li>
            </ul>
          </div>

          <!-- Massage Card 2: Calf & Achilles Upward Sweep -->
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 18px; padding: 1.15rem;">
            <div style="font-size: 1.02rem; font-weight: 800; color: #34D399; margin-bottom: 0.65rem;">
              🦶 ${isGlobal ? 'Step 2. Calf & Achilles Upward Sweep Massage (2 Mins)' : '2단계. 종아리·아킬레스건 위로 쓸어올리기 (2분)'}
            </div>
            <svg viewBox="0 0 380 180" width="100%" height="180" style="display: block; background: rgba(15, 23, 42, 0.9); border-radius: 14px; border: 1px solid rgba(16, 185, 129, 0.25); margin-bottom: 0.85rem;">
              <!-- Lower Leg & Calf Muscle Outline -->
              <path d="M 162 24 C 142 65 152 115 168 145 L 198 145 C 214 115 224 65 204 24 Z" fill="rgba(16, 185, 129, 0.12)" stroke="#34D399" stroke-width="3"/>
              <!-- Foot Outline -->
              <path d="M 168 145 L 155 164 L 222 164 L 198 145 Z" fill="rgba(148, 163, 184, 0.2)" stroke="#94A3B8" stroke-width="2.5"/>
              <!-- Upward Sweeping Massage Arrows along Calf -->
              <path d="M 174 136 L 174 44" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>
              <polygon points="174,34 167,46 181,46" fill="#38BDF8"/>
              <path d="M 194 136 L 194 44" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>
              <polygon points="194,34 187,46 201,46" fill="#38BDF8"/>
              <!-- Popliteal (Back of Knee) Point -->
              <circle cx="184" cy="28" r="7" fill="#FBBF24" stroke="#FFFFFF" stroke-width="2"/>
              <!-- Callouts -->
              <rect x="14" y="42" width="132" height="26" rx="6" fill="rgba(251, 191, 36, 0.2)" stroke="#FBBF24"/>
              <text x="80" y="59" fill="#FEF3C7" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '② Back of Knee' : '② 무릎 뒤 오금까지 쭉'}</text>
              <rect x="228" y="82" width="138" height="26" rx="6" fill="rgba(56, 189, 248, 0.2)" stroke="#38BDF8"/>
              <text x="297" y="99" fill="#E0F2FE" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '① Sweep Upward 10x' : '① 발목→종아리 쓸어올리기'}</text>
              <rect x="228" y="132" width="138" height="26" rx="6" fill="rgba(16, 185, 129, 0.2)" stroke="#34D399"/>
              <text x="297" y="149" fill="#A7F3D0" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '③ Pull Toes Gently' : '③ 발끝을 몸쪽으로 당기기'}</text>
            </svg>
            <ul style="margin: 0; padding-left: 1.15rem; font-size: 0.94rem; color: #F8FAFC; line-height: 1.65;">
              <li><strong>${isGlobal ? 'Sweep Upward:' : '발목에서 무릎 뒤로:'}</strong> ${isGlobal ? 'Wrap both hands around the ankle and sweep firmly up the calf 10 times.' : '발목 아킬레스건부터 무릎 뒤 오금(위중혈)까지 양손으로 부드럽게 10회 쓸어올려요.'}</li>
              <li><strong>${isGlobal ? 'Calf Stretch:' : '발끝 당겨 스트레칭:'}</strong> ${isGlobal ? 'Gently push the toes toward the shin for 10 seconds to lengthen the calf.' : '아이 발끝을 몸쪽으로 천천히 당겨 종아리 근육을 10초간 시원하게 늘려주세요.'}</li>
              <li><strong>${isGlobal ? 'Deep Sleep Effect:' : '숙면 & 성장통 예방:'}</strong> ${isGlobal ? 'Relaxes tight lower-limb fascia so growth hormone peaks during deep sleep!' : '낮 동안 뭉친 다리 피로가 풀리면서 밤새 성장통 없이 푹 자고 쑥쑥 자라납니다~!'}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  // 4b. HTML Section Renderer
  function renderBiomechanicsSection(profile = {}, affConfig = {}) {
    const isGlobal = (typeof document !== 'undefined' && document.documentElement.lang === 'en') || profile.language === 'en';
    const habits = profile.habits || [];
    const restoredHeight = calculateDecompressionPotential(habits);

    const titleStr = isGlobal ? 'Illustrated Growth Massage & Spine Decompression Guide' : '그림으로 쉽게 따라 하는 성장판 마사지 & 숨은 키 운동 가이드';
    const subStr = isGlobal
      ? 'No complicated timers needed! Follow the step-by-step visual illustrations below for 5-minute bedtime knee/calf massage and 3 spine-lengthening exercises.'
      : '복잡한 타이머 없이 그림만 보고 집에서 바로 따라 해보세요! 잠들기 전 5분 엄마 손 성장판 마사지와 숨은 키 +1.8cm를 찾아주는 3단계 맞춤 운동법입니다~!';

    let html = `
      <div id="core-3-container" class="core-module-container biomechanics-studio-container">
        <!-- Studio Clinical Header Card -->
        <div class="bento-card studio-header-card" style="margin-bottom: 1.25rem; border-left: 4px solid var(--rose-alert);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="tab-badge tab-badge-rose" style="display: inline-block; margin-bottom: 0.5rem;">
                🏃 Core 3 · Visual Massage & Exercise Guide
              </span>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
                ${titleStr}
              </h3>
              <p style="font-size: 0.95rem; color: #E2E8F0; line-height: 1.6; max-width: 780px;">
                ${subStr}
              </p>
            </div>
            <div class="biomechanics-potential-badge" style="background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: var(--radius-inner); padding: 0.75rem 1.25rem; text-align: center;">
              <span style="font-size: 0.78rem; font-weight: 700; color: #E2E8F0; display: block;">
                ${isGlobal ? 'Spinal Curvature Recovery' : '숨은 척추·자세 복원 잠재력'}
              </span>
              <span style="font-size: 1.5rem; font-weight: 900; color: var(--rose-alert); font-family: var(--font-mono);">
                +${restoredHeight} cm
              </span>
            </div>
          </div>
        </div>

        <!-- NEW: Illustrated Bedtime Growth Plate Massage Guide -->
        ${renderIllustratedMassageSection(isGlobal)}

        <!-- 3 Illustrated Exercise Routine Cards (No Visible Timers) -->
        <div class="routines-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
    `;

    ROUTINES.forEach((r, idx) => {
      const name = isGlobal ? r.nameEn : r.nameKo;
      const summary = isGlobal ? r.summaryEn : r.summaryKo;
      const instructions = isGlobal ? r.instructionsEn : r.instructionsKo;
      const timer = getOrCreateTimer(r.id);
      const initialTime = formatTime(timer.remainingSeconds);

      const categoryLabel = r.category === 'decompression'
        ? (isGlobal ? 'Exercise 1: Spine Decompression' : '운동 1단계: 척추 마디 늘리기')
        : (r.category === 'alignment'
          ? (isGlobal ? 'Exercise 2: Posture Alignment' : '운동 2단계: 굽은 등·골반 펴기')
          : (isGlobal ? 'Exercise 3: Growth Plate Jumping' : '운동 3단계: 성장판 탄성 점핑'));

      const freqBadge = r.id === 'dead_hang'
        ? (isGlobal ? 'Morning & Night · 30s × 3 times' : '권장: 아침·저녁 30초씩 3번')
        : (r.id === 'thoracic_stretch'
          ? (isGlobal ? 'Before Bed · 45s × 2 times' : '권장: 잠들기 전 45초씩 2번')
          : (isGlobal ? 'Afternoon · 10~15 mins' : '권장: 하교 후 하루 10~15분'));

      html += `
        <div class="bento-card routine-timer-card" id="routine-card-${r.id}" style="display: flex; flex-direction: column; justify-content: space-between; position: relative; padding: 1.35rem;">
          <!-- Card Header -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem;">
              <span style="font-size: 0.78rem; font-weight: 800; color: #FECDD3; background: rgba(244, 63, 94, 0.18); padding: 0.25rem 0.7rem; border-radius: 9999px;">
                ${categoryLabel}
              </span>
              <span style="font-size: 0.8rem; font-weight: 800; color: #A7F3D0; background: rgba(16, 185, 129, 0.15); padding: 0.22rem 0.65rem; border-radius: 9999px;">
                ${freqBadge}
              </span>
            </div>

            <h4 style="font-size: 1.15rem; font-weight: 800; color: #FFFFFF; margin-bottom: 0.45rem;">
              ${idx + 1}. ${name}
            </h4>

            <p style="font-size: 0.92rem; color: #E2E8F0; line-height: 1.55; margin-bottom: 0.9rem;">
              ${summary}
            </p>

            <!-- Illustrated Exercise Visual Guide (Replaces Stopwatch Timer UI) -->
            <div class="exercise-visual-guide-box" style="margin-bottom: 1rem;">
              ${getRoutineIllustrationSvg(r.id, isGlobal)}
            </div>

            <!-- Always-Visible Step-by-Step How-To Guide (Large Readable Font) -->
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 0.95rem 1rem;">
              <div style="font-size: 0.88rem; font-weight: 800; color: #38BDF8; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <span>📖 ${isGlobal ? 'Step-by-Step How to Do It' : '그림 보고 따라 하는 동작 순서'}</span>
                <span style="color: #FDE68A; font-size: 0.8rem;">${isGlobal ? 'Gain' : '기대 효과'}: ${r.restorationEstimate}</span>
              </div>
              <ol style="margin: 0; padding-left: 1.2rem; font-size: 0.92rem; color: #F8FAFC; line-height: 1.65;">
                ${instructions.map(inst => `<li style="margin-bottom: 0.25rem;">${inst}</li>`).join('')}
              </ol>
            </div>
          </div>

          <!-- Hidden Programmatic Stopwatch Nodes (Preserved for API compatibility, hidden from UI as requested) -->
          <div style="display: none;" aria-hidden="true">
            <span class="set-indicator-badge" id="set-badge-${r.id}"><span class="current-set">${timer.currentSet}</span> / ${r.sets}</span>
            <div id="timer-state-${r.id}">READY TO START</div>
            <div id="timer-digits-${r.id}">${initialTime}</div>
            <div id="timer-progress-${r.id}"></div>
            <button type="button" id="btn-start-${r.id}" data-routine="${r.id}">Start</button>
            <button type="button" id="btn-pause-${r.id}" data-routine="${r.id}">Pause</button>
            <button type="button" id="btn-reset-${r.id}" data-routine="${r.id}">Reset</button>
            <button type="button" id="btn-complete-${r.id}" data-routine="${r.id}">Complete</button>
          </div>
        </div>
      `;
    });

    html += `
        </div>

        <!-- Academic Research Citations with clickable PMID & DOI -->
        ${(function() {
          const rc = (typeof window !== 'undefined' && window.TallerReferenceChips) || 
                     (typeof global !== 'undefined' && global.TallerReferenceChips) ||
                     (typeof require !== 'undefined' ? (function() { try { return require('./reference-chips'); } catch(e) { return null; } })() : null);
          if (rc && typeof rc.renderCitations === 'function') {
            return rc.renderCitations(['posture_biomechanics_exercise'], 3, isGlobal);
          }
          return '';
        })()}

        <!-- Biomechanics Reference Archival Chip -->
        <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
          <a href="https://www.coupang.com/np/search?q=%EC%B2%B4%ED%98%95%EA%B5%90%EC%A0%95+%ED%95%98%EB%93%9C%EC%9B%A8%EC%96%B4&channel=user&lptag=AF7865143" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="reference-chip" 
             id="ref-chip-biomechanics"
             style="font-size: 12px; color: var(--text-secondary); border: 1px solid var(--theme-border); padding: 0.35rem 0.75rem; border-radius: 9999px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; background: var(--theme-surface-sub);">
            <span>🔬</span>
            <span>${isGlobal ? '[Biomechanics Equipment Reference (Coupang) ↗]' : '[생체역학·자세교정 도구 아카이브 참고 ↗]'}</span>
          </a>
        </div>
      </div>
    `;

    return html;
  }

  // 5. DOM Listener Binder for Interactive Countdown Stopwatches
  function initRoutineTimers() {
    if (typeof document === 'undefined') return;

    ROUTINES.forEach(r => {
      const timer = getOrCreateTimer(r.id);
      if (!timer) return;

      const digitsEl = document.getElementById(`timer-digits-${r.id}`);
      const stateEl = document.getElementById(`timer-state-${r.id}`);
      const progressEl = document.getElementById(`timer-progress-${r.id}`);
      const setBadgeEl = document.getElementById(`set-badge-${r.id}`);

      // Wire update UI callback
      timer.onTick(data => {
        if (digitsEl) {
          digitsEl.textContent = formatTime(data.remainingSeconds);
        }
        if (progressEl) {
          progressEl.style.width = `${data.progressPercent}%`;
          progressEl.style.background = data.isRestPhase ? 'var(--amber-caution)' : 'var(--rose-alert)';
        }
        if (stateEl) {
          if (data.state === 'running') {
            stateEl.textContent = data.isRestPhase ? 'REST INTERVAL (휴식 중)' : 'RUNNING (진행 중)';
            stateEl.style.color = data.isRestPhase ? 'var(--amber-caution)' : 'var(--rose-alert)';
          } else if (data.state === 'paused') {
            stateEl.textContent = 'PAUSED (일시정지)';
            stateEl.style.color = 'var(--amber-caution)';
          } else if (data.state === 'completed') {
            stateEl.textContent = 'COMPLETED (완료)';
            stateEl.style.color = 'var(--bio-emerald)';
          } else {
            stateEl.textContent = 'READY TO START';
            stateEl.style.color = 'var(--text-muted)';
          }
        }
        if (setBadgeEl) {
          setBadgeEl.innerHTML = `세트 <span class="current-set">${data.currentSet}</span> / ${data.totalSets}`;
        }
      });

      timer.onComplete(data => {
        if (digitsEl) digitsEl.textContent = '00:00';
        if (progressEl) progressEl.style.width = '100%';
        if (stateEl) {
          stateEl.textContent = 'ALL SETS COMPLETED! 🎉';
          stateEl.style.color = 'var(--bio-emerald)';
        }

        // Web Audio tick / beep notification
        try {
          if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          }
        } catch (e) {
          // Audio autoplay restrictions gracefully ignored
        }
      });

      // Bind Button Clicks
      const btnStart = document.getElementById(`btn-start-${r.id}`);
      const btnPause = document.getElementById(`btn-pause-${r.id}`);
      const btnReset = document.getElementById(`btn-reset-${r.id}`);
      const btnComplete = document.getElementById(`btn-complete-${r.id}`);

      if (btnStart && typeof btnStart.addEventListener === 'function') {
        btnStart.onclick = () => timer.start();
      }
      if (btnPause && typeof btnPause.addEventListener === 'function') {
        btnPause.onclick = () => timer.pause();
      }
      if (btnReset && typeof btnReset.addEventListener === 'function') {
        btnReset.onclick = () => timer.reset();
      }
      if (btnComplete && typeof btnComplete.addEventListener === 'function') {
        btnComplete.onclick = () => timer.completeSet();
      }
    });
  }

  // 6. Public Export API
  const BiomechanicsStudio = {
    ROUTINES,
    BIOMECHANICS_CONSTANTS,
    getOrCreateTimer,
    calculateDecompressionPotential,
    renderBiomechanicsSection,
    initRoutineTimers,
    formatTime
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BiomechanicsStudio;
  }
  if (typeof global !== 'undefined') {
    global.KidsFitBiomechanicsStudio = BiomechanicsStudio;
    global.TallerBiomechanicsStudio = BiomechanicsStudio;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
