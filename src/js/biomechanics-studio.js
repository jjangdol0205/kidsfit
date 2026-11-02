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
      summaryKo: '철봉에 매달려 낮 동안 눌린 척추 디스크 간격을 펴고 수분을 재흡수시킵니다.',
      summaryEn: 'Passive hanging unloads vertebrae and rehydrates intervertebral discs.',
      instructionsKo: [
        '철봉을 어깨너비로 잡고 발을 바닥에서 뗍니다.',
        '어깨·하체 힘을 툭 빼고 척추를 자연스럽게 늘립니다.',
        '30초 매달리기 + 30초 휴식 (총 3세트 반복)'
      ],
      instructionsEn: [
        'Grip bar shoulder-width apart and suspend feet.',
        'Relax shoulders and lower body for passive traction.',
        'Hold 30s + rest 30s (3 sets total).'
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
      summaryKo: '스마트폰·책상 자세로 굽은 등과 거북목을 펴 숨은 키(+1.8cm)를 복원합니다.',
      summaryEn: 'Extends thoracic spine and tight hip flexors to unlock +1.8 cm of posture height.',
      instructionsKo: [
        '등(날개뼈 사이) 아래에 폼롤러나 둥근 베개를 받치고 눕습니다.',
        '양손을 머리 뒤로 깍지 끼고 가슴을 천장으로 활짝 엽니다.',
        '런지 자세로 골반 앞쪽을 45초간 늘려줍니다 (2세트).'
      ],
      instructionsEn: [
        'Place foam roller under upper back with knees bent.',
        'Clasp hands behind head and open chest upward.',
        'Hold hip flexor lunge stretch for 45s (2 sets).'
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
      summaryKo: '가벼운 수직 점핑으로 무릎 성장판(Runx2/Sox9) 연골세포 분열을 촉진합니다.',
      summaryEn: 'Cyclic vertical hops stimulate epiphyseal growth plate chondrocyte proliferation.',
      instructionsKo: [
        '충격 흡수 매트 위에서 운동화를 신고 준비합니다.',
        '45초 가볍게 양발 점프 후 15초 제자리 걷기를 반복합니다.',
        '발 앞꿈치로 사뿐히 착지하며 10~15분간 진행합니다.'
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
        <svg viewBox="0 0 380 185" width="100%" style="display: block; width: 100%; height: auto; aspect-ratio: 380 / 185; background: #F8FAFC; border-radius: 14px; border: 1px solid #BFDBFE;">
          <!-- Pull-up Bar -->
          <line x1="50" y1="26" x2="330" y2="26" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
          <circle cx="50" cy="26" r="6" fill="#1D4ED8"/>
          <circle cx="330" cy="26" r="6" fill="#1D4ED8"/>
          <!-- Child Hanging Figure -->
          <!-- Hands & Arms -->
          <circle cx="155" cy="26" r="5.5" fill="#FBBF24"/>
          <circle cx="225" cy="26" r="5.5" fill="#FBBF24"/>
          <line x1="155" y1="26" x2="172" y2="62" stroke="#1D4ED8" stroke-width="5" stroke-linecap="round"/>
          <line x1="225" y1="26" x2="208" y2="62" stroke="#1D4ED8" stroke-width="5" stroke-linecap="round"/>
          <!-- Head -->
          <circle cx="190" cy="48" r="13" fill="#F8FAFC" stroke="#1D4ED8" stroke-width="2.5"/>
          <!-- Torso & Decompressing Spine Vertebrae -->
          <line x1="172" y1="62" x2="208" y2="62" stroke="#1D4ED8" stroke-width="5" stroke-linecap="round"/>
          <line x1="190" y1="64" x2="190" y2="124" stroke="#1D4ED8" stroke-width="6" stroke-dasharray="6,5" stroke-linecap="round"/>
          <!-- Pelvis & Relaxed Legs -->
          <line x1="176" y1="124" x2="204" y2="124" stroke="#1D4ED8" stroke-width="5" stroke-linecap="round"/>
          <line x1="180" y1="124" x2="176" y2="166" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
          <line x1="200" y1="124" x2="204" y2="166" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
          <!-- Spine Decompression Arrows -->
          <path d="M 135 76 L 135 112" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>
          <polygon points="135,70 130,78 140,78" fill="#94A3B8"/>
          <polygon points="135,118 130,110 140,110" fill="#94A3B8"/>
          <!-- Callout Labels -->
          <rect x="16" y="42" width="110" height="24" rx="6" fill="#EFF6FF" stroke="rgba(56, 189, 248, 0.4)"/>
          <text x="71" y="58" fill="#334155" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Grip Wide' : '① 어깨너비 그립'}</text>
          <rect x="232" y="72" width="134" height="26" rx="6" fill="#EFF6FF" stroke="rgba(16, 185, 129, 0.45)"/>
          <text x="299" y="89" fill="#1D4ED8" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Spine Unload +1.2cm' : '② 척추 마디 쭉 펴기'}</text>
          <rect x="232" y="128" width="134" height="26" rx="6" fill="rgba(251, 191, 36, 0.16)" stroke="rgba(251, 191, 36, 0.4)"/>
          <text x="299" y="145" fill="#1D4ED8" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Relax Lower Body' : '③ 하체 힘 빼고 툭!'}</text>
        </svg>
      `;
    }
    if (routineId === 'thoracic_stretch') {
      return `
        <svg viewBox="0 0 380 185" width="100%" style="display: block; width: 100%; height: auto; aspect-ratio: 380 / 185; background: #F8FAFC; border-radius: 14px; border: 1px solid #BFDBFE;">
          <!-- Floor Mat Line -->
          <line x1="30" y1="152" x2="350" y2="152" stroke="#475569" stroke-width="5" stroke-linecap="round"/>
          <!-- Foam Roller under Thoracic Spine -->
          <circle cx="175" cy="134" r="16" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="3"/>
          <circle cx="175" cy="134" r="5" fill="#1D4ED8"/>
          <!-- Child Arching Thoracic Spine Over Roller -->
          <!-- Pelvis on floor -->
          <circle cx="235" cy="144" r="6" fill="#1D4ED8"/>
          <!-- Bent Knees & Feet -->
          <line x1="235" y1="144" x2="275" y2="108" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
          <line x1="275" y1="108" x2="305" y2="148" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
          <!-- Arched Spine Curve -->
          <path d="M 235 144 Q 180 102 125 126" fill="none" stroke="#1D4ED8" stroke-width="6" stroke-linecap="round"/>
          <!-- Head & Hands Behind Head -->
          <circle cx="112" cy="122" r="12" fill="#F8FAFC" stroke="#1D4ED8" stroke-width="2.5"/>
          <path d="M 125 120 Q 112 98 102 116" fill="none" stroke="#FBBF24" stroke-width="4" stroke-linecap="round"/>
          <!-- Chest Opening Upward Arrow -->
          <path d="M 175 95 L 175 56" stroke="#1D4ED8" stroke-width="3" stroke-linecap="round"/>
          <polygon points="175,48 169,58 181,58" fill="#1D4ED8"/>
          <!-- Callout Labels -->
          <rect x="20" y="36" width="136" height="26" rx="6" fill="#EFF6FF" stroke="rgba(16, 185, 129, 0.45)"/>
          <text x="88" y="53" fill="#1D4ED8" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Open Chest Upward' : '① 가슴을 천장으로 활짝'}</text>
          <rect x="205" y="42" width="155" height="26" rx="6" fill="#EFF6FF" stroke="rgba(56, 189, 248, 0.4)"/>
          <text x="282" y="59" fill="#334155" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Foam Roller Under Back' : '② 등 아래 폼롤러·베개 받치기'}</text>
          <rect x="218" y="76" width="142" height="24" rx="6" fill="#EFF6FF" stroke="rgba(244, 63, 94, 0.4)"/>
          <text x="289" y="92" fill="#0F172A" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Unlock +1.8cm Posture' : '③ 거북목·굽은등 +1.8cm 복원'}</text>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 380 185" width="100%" style="display: block; width: 100%; height: auto; aspect-ratio: 380 / 185; background: #F8FAFC; border-radius: 14px; border: 1px solid #BFDBFE;">
        <!-- Shock Absorbing Mat -->
        <rect x="95" y="152" width="190" height="10" rx="5" fill="#1D4ED8" opacity="0.5"/>
        <!-- Jump Rope Arc -->
        <path d="M 125 92 Q 190 12 255 92" fill="none" stroke="#FBBF24" stroke-width="2.5" stroke-dasharray="5,4"/>
        <!-- Jumping Child Figure -->
        <circle cx="190" cy="48" r="12" fill="#F8FAFC" stroke="#FBBF24" stroke-width="2.5"/>
        <line x1="190" y1="60" x2="190" y2="102" stroke="#1D4ED8" stroke-width="5" stroke-linecap="round"/>
        <line x1="160" y1="78" x2="220" y2="78" stroke="#1D4ED8" stroke-width="4.5" stroke-linecap="round"/>
        <!-- Legs & Glowing Knee/Ankle Growth Plates -->
        <line x1="190" y1="102" x2="178" y2="138" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
        <line x1="190" y1="102" x2="202" y2="138" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
        <!-- Glowing Epiphyseal Growth Plates (Knees & Forefoot) -->
        <circle cx="182" cy="118" r="6" fill="#94A3B8"/>
        <circle cx="198" cy="118" r="6" fill="#94A3B8"/>
        <circle cx="176" cy="142" r="5" fill="#1D4ED8"/>
        <circle cx="204" cy="142" r="5" fill="#1D4ED8"/>
        <!-- Upward Bounce Arrows -->
        <path d="M 148 138 L 148 104" stroke="#1D4ED8" stroke-width="2.5" stroke-linecap="round"/>
        <polygon points="148,96 143,105 153,105" fill="#1D4ED8"/>
        <!-- Callout Labels -->
        <rect x="14" y="42" width="128" height="26" rx="6" fill="rgba(251, 191, 36, 0.16)" stroke="rgba(251, 191, 36, 0.4)"/>
        <text x="78" y="59" fill="#1D4ED8" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Rhythmic Hops' : '① 가볍게 사뿐 점핑!'}</text>
        <rect x="234" y="102" width="134" height="26" rx="6" fill="#EFF6FF" stroke="rgba(244, 63, 94, 0.45)"/>
        <text x="301" y="119" fill="#0F172A" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Knee Growth Plate' : '② 무릎 성장판 자극 '}</text>
        <rect x="234" y="134" width="134" height="26" rx="6" fill="#EFF6FF" stroke="rgba(16, 185, 129, 0.45)"/>
        <text x="301" y="151" fill="#1D4ED8" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Forefoot Landing' : '③ 발 앞꿈치로 탄성 착지'}</text>
      </svg>
    `;
  }

  const ROUTINE_4_LOWER_BODY_STRETCH = {
    id: 'lower_body_core_stretch',
    nameKo: '하체 성장판(햄스트링·무릎) 이완 & 골반·코어 브릿지 스트레칭',
    nameEn: 'Lower-Limb Growth Plate Release & Core Pelvic Bridge Stretch',
    category: 'lower_body_bridge',
    duration: 60,
    durationMinutes: 1,
    sets: 2,
    restSeconds: 20,
    principle: 'Lower-Extremity Myofascial Release & Lumbo-Pelvic Stabilization',
    molecularTrigger: 'Epiphyseal Vascular Perfusion & IGF-1 Delivery',
    restorationEstimate: '+0.8 ~ +1.4 cm (하체 정렬 & 성장판 혈류 촉진)',
    summaryKo: '점핑 운동 후 긴장된 허벅지·종아리 근막을 쭉 펴주고 골반 브릿지로 하체 성장판 혈류를 높입니다.',
    summaryEn: 'Releases tight hamstrings/calves after jumping and aligns pelvis to boost growth plate blood flow.',
    instructionsKo: [
      '바닥에 누워 두 무릎을 세우고 엉덩이를 천천히 들어 올려 어깨-골반-무릎을 일직선으로 만듭니다 (15초 유지 × 2회).',
      '한쪽 다리를 천장으로 곧게 펴고 발끝을 몸쪽으로 당겨 허벅지 뒤(햄스트링)와 종아리를 20초간 늘려줍니다.',
      '양 무릎을 가슴 쪽으로 가볍게 안아 허리와 골반 긴장을 부드럽게 풀어주며 마무리합니다.'
    ],
    instructionsEn: [
      'Lie on back with knees bent and lift hips to align shoulders, pelvis, and knees for 15s (2 reps).',
      'Extend one leg upward and pull toes toward shin for 20s to stretch hamstrings and calves.',
      'Hug both knees gently to chest to release lower back and pelvic tension.'
    ]
  };

  function getRoutine4IllustrationSvg(isGlobal) {
    return `
      <svg viewBox="0 0 380 185" width="100%" style="display: block; width: 100%; height: auto; aspect-ratio: 380 / 185; background: #F8FAFC; border-radius: 14px; border: 1px solid #BFDBFE;">
        <!-- Floor Mat Line -->
        <line x1="26" y1="152" x2="354" y2="152" stroke="#475569" stroke-width="5" stroke-linecap="round"/>
        <!-- Child Doing Pelvic Bridge & Leg Stretch -->
        <circle cx="105" cy="138" r="12" fill="#F8FAFC" stroke="#64748B" stroke-width="2.5"/>
        <!-- Shoulders to Raised Pelvis -->
        <line x1="120" y1="142" x2="205" y2="104" stroke="#64748B" stroke-width="6" stroke-linecap="round"/>
        <!-- Supporting Bent Leg -->
        <line x1="205" y1="104" x2="248" y2="96" stroke="#1D4ED8" stroke-width="5" stroke-linecap="round"/>
        <line x1="248" y1="96" x2="262" y2="148" stroke="#1D4ED8" stroke-width="5" stroke-linecap="round"/>
        <!-- Extended Upward Leg (Hamstring & Calf Stretch) -->
        <line x1="205" y1="104" x2="232" y2="38" stroke="#1D4ED8" stroke-width="5.5" stroke-linecap="round"/>
        <circle cx="218" cy="72" r="6" fill="#94A3B8"/>
        <!-- Upward Pelvis Lift Arrow -->
        <path d="M 185 138 L 185 112" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/>
        <polygon points="185,104 179,114 191,114" fill="#FBBF24"/>
        <!-- Callout Labels -->
        <rect x="16" y="42" width="142" height="26" rx="6" fill="#EFF6FF" stroke="rgba(192, 132, 252, 0.45)"/>
        <text x="87" y="59" fill="#0F172A" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '① Pelvic Core Bridge' : '① 골반·코어 브릿지 들기'}</text>
        <rect x="242" y="34" width="126" height="26" rx="6" fill="#EFF6FF" stroke="rgba(16, 185, 129, 0.45)"/>
        <text x="305" y="51" fill="#1D4ED8" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '② Stretch Hamstring' : '② 다리 펴고 발끝 당기기'}</text>
        <rect x="242" y="68" width="126" height="26" rx="6" fill="#EFF6FF" stroke="rgba(244, 63, 94, 0.45)"/>
        <text x="305" y="85" fill="#0F172A" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '③ Growth Plate Flow' : '③ 하체 성장판 혈류 2배'}</text>
      </svg>
    `;
  }

  function renderIllustratedMassageSection(isGlobal) {
    return `
      <div class="bento-card" id="illustrated-growth-massage-guide" style="margin-bottom: 1.5rem; padding: 1.5rem; border: 1.5px solid #BFDBFE; background: #F8FAFC;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
          <div>
            <span style="display: inline-block; font-size: 0.78rem; font-weight: 800; color: #1D4ED8; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 0.25rem 0.75rem; border-radius: 9999px; margin-bottom: 0.4rem;">
              ${isGlobal ? 'Bedtime 5-Min Growth Plate Massage Guide' : '잠들기 전 5분 · 엄마 손 성장판 마사지 그림 가이드'}
            </span>
            <h4 style="font-size: 1.22rem; font-weight: 800; color: #0F172A; margin: 0;">
              ${isGlobal ? 'How to Massage Knee & Calf Growth Plates Before Sleep' : '타이머 없이 그림 보고 쉽게 따라 하는 무릎·종아리 성장판 마사지법'}
            </h4>
          </div>
          <span style="font-size: 0.85rem; font-weight: 700; color: #1D4ED8; background: #EFF6FF; padding: 0.35rem 0.85rem; border-radius: 9999px;">
            ${isGlobal ? 'Relieves Night Growing Pains & Boosts Blood Flow' : '야간 성장통 완화 & 성장판 혈류량 2배 촉진'}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <!-- Massage Card 1: Knee Acupressure Points (Dokbi & Zusanli) -->
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 18px; padding: 1.15rem;">
            <div style="font-size: 1.04rem; font-weight: 800; color: #1D4ED8; margin-bottom: 0.65rem;">
              ${isGlobal ? 'Step 1. Knee Growth Plate Acupressure (3 Mins)' : '1단계. 무릎뼈 아래 성장판 혈자리 엄지 지압 (3분)'}
            </div>
            <svg viewBox="0 0 380 180" width="100%" style="display: block; width: 100%; height: auto; aspect-ratio: 380 / 180; background: #FFFFFF; border-radius: 14px; border: 1px solid #BFDBFE; margin-bottom: 0.85rem;">
              <!-- Femur & Tibia Outline -->
              <path d="M 155 18 L 162 72 Q 190 82 218 72 L 225 18" fill="rgba(148, 163, 184, 0.15)" stroke="#94A3B8" stroke-width="3"/>
              <path d="M 158 105 Q 190 95 222 105 L 215 168 L 165 168 Z" fill="rgba(148, 163, 184, 0.15)" stroke="#94A3B8" stroke-width="3"/>
              <!-- Patella (Kneecap) -->
              <ellipse cx="190" cy="82" rx="24" ry="16" fill="#EFF6FF" stroke="#93C5FD" stroke-width="2.5"/>
              <text x="190" y="86" fill="#0F172A" font-size="10" font-weight="800" text-anchor="middle">${isGlobal ? 'Kneecap' : '무릎뼈'}</text>
              <!-- Epiphyseal Growth Plate Line -->
              <line x1="152" y1="108" x2="228" y2="108" stroke="#1D4ED8" stroke-width="4" stroke-dasharray="6,4"/>
              <!-- Acupressure Points: Dokbi (Lateral/Medial Hollows) & Zusanli -->
              <circle cx="166" cy="98" r="8" fill="#94A3B8" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="214" cy="98" r="8" fill="#94A3B8" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="222" cy="134" r="9" fill="#FBBF24" stroke="#FFFFFF" stroke-width="2"/>
              <!-- Circular Massage Arrows -->
              <path d="M 148 92 A 12 12 0 1 1 148 106" fill="none" stroke="#1D4ED8" stroke-width="2.5"/>
              <path d="M 232 106 A 12 12 0 1 1 232 92" fill="none" stroke="#1D4ED8" stroke-width="2.5"/>
              <!-- Callouts -->
              <rect x="12" y="84" width="126" height="26" rx="6" fill="#EFF6FF" stroke="#94A3B8"/>
              <text x="75" y="101" fill="#1D4ED8" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '① Hollow Below Knee' : '① 무릎 아래 오목한 곳'}</text>
              <rect x="240" y="120" width="128" height="26" rx="6" fill="rgba(251, 191, 36, 0.2)" stroke="#FBBF24"/>
              <text x="304" y="137" fill="#334155" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '② Zusanli Point' : '② 바깥 아래(족삼리)'}</text>
              <text x="190" y="162" fill="#1D4ED8" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? 'Press Gently with Thumbs for 5s in Circles' : '엄지손가락으로 5초씩 지그시 누르며 원 그리기'}</text>
            </svg>
            <ul style="margin: 0; padding-left: 1.15rem; font-size: 0.9rem; color: #0F172A; line-height: 1.55;">
              <li><strong>따뜻한 온기:</strong> 양손을 비벼 아이 무릎을 30초간 감싸기</li>
              <li><strong>독비혈 지압:</strong> 무릎뼈 아래 양옆 오목한 곳 엄지로 5초씩 지압</li>
              <li><strong>족삼리 마사지:</strong> 무릎 바깥 아래 3cm를 원 그리듯 10회 풀기</li>
            </ul>
          </div>

          <!-- Massage Card 2: Calf & Achilles Upward Sweep -->
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 18px; padding: 1.15rem;">
            <div style="font-size: 1.04rem; font-weight: 800; color: #1D4ED8; margin-bottom: 0.65rem;">
              ${isGlobal ? 'Step 2. Calf & Achilles Upward Sweep Massage (2 Mins)' : '2단계. 종아리·아킬레스건 위로 쓸어올리기 (2분)'}
            </div>
            <svg viewBox="0 0 380 180" width="100%" style="display: block; width: 100%; height: auto; aspect-ratio: 380 / 180; background: #FFFFFF; border-radius: 14px; border: 1px solid #BFDBFE; margin-bottom: 0.85rem;">
              <!-- Lower Leg & Calf Muscle Outline -->
              <path d="M 162 24 C 142 65 152 115 168 145 L 198 145 C 214 115 224 65 204 24 Z" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="3"/>
              <!-- Foot Outline -->
              <path d="M 168 145 L 155 164 L 222 164 L 198 145 Z" fill="rgba(148, 163, 184, 0.2)" stroke="#94A3B8" stroke-width="2.5"/>
              <!-- Upward Sweeping Massage Arrows along Calf -->
              <path d="M 174 136 L 174 44" stroke="#1D4ED8" stroke-width="4" stroke-linecap="round"/>
              <polygon points="174,34 167,46 181,46" fill="#1D4ED8"/>
              <path d="M 194 136 L 194 44" stroke="#1D4ED8" stroke-width="4" stroke-linecap="round"/>
              <polygon points="194,34 187,46 201,46" fill="#1D4ED8"/>
              <!-- Popliteal (Back of Knee) Point -->
              <circle cx="184" cy="28" r="7" fill="#FBBF24" stroke="#FFFFFF" stroke-width="2"/>
              <!-- Callouts -->
              <rect x="14" y="42" width="132" height="26" rx="6" fill="rgba(251, 191, 36, 0.2)" stroke="#FBBF24"/>
              <text x="80" y="59" fill="#334155" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '② Back of Knee' : '② 무릎 뒤 오금까지 쭉'}</text>
              <rect x="228" y="82" width="138" height="26" rx="6" fill="#EFF6FF" stroke="#1D4ED8"/>
              <text x="297" y="99" fill="#334155" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '① Sweep Upward 10x' : '① 발목→종아리 쓸어올리기'}</text>
              <rect x="228" y="132" width="138" height="26" rx="6" fill="#EFF6FF" stroke="#1D4ED8"/>
              <text x="297" y="149" fill="#1D4ED8" font-size="11" font-weight="800" text-anchor="middle">${isGlobal ? '③ Pull Toes Gently' : '③ 발끝을 몸쪽으로 당기기'}</text>
            </svg>
            <ul style="margin: 0; padding-left: 1.15rem; font-size: 0.9rem; color: #0F172A; line-height: 1.55;">
              <li><strong>쓸어올리기:</strong> 발목부터 무릎 뒤 오금까지 양손으로 10회 쓸어올리기</li>
              <li><strong>발끝 당기기:</strong> 발끝을 몸쪽으로 당겨 종아리 근육 10초 늘리기</li>
              <li><strong>성장통 완화:</strong> 다리 근막 긴장을 풀어 밤새 깊은 숙면 유도</li>
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

    const titleStr = isGlobal ? 'Illustrated Growth Massage & 4-Step Spine/Growth Plate Exercise Guide' : '그림으로 쉽게 따라 하는 성장판 마사지 & 숨은 키 4단계 운동 가이드';
    const subStr = isGlobal
      ? 'No complicated timers needed! Follow the step-by-step visual illustrations below for 5-minute bedtime knee/calf massage and 4 spine-lengthening & growth plate exercises.'
      : '복잡한 타이머 없이 그림만 보고 집에서 바로 따라 해보세요. 잠들기 전 5분 엄마 손 성장판 마사지와 숨은 키 +1.8cm를 찾아주는 4단계 맞춤 운동법입니다.';

    let html = `
      <div id="core-3-container" class="core-module-container biomechanics-studio-container">
        <!-- Studio Clinical Header Card -->
        <div class="bento-card studio-header-card" style="margin-bottom: 1.25rem; border-left: 4px solid var(--rose-alert);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="tab-badge tab-badge-rose" style="display: inline-block; margin-bottom: 0.5rem;">
                Core 3 · Visual Massage & 4-Step Exercise Guide
              </span>
              <h3 style="font-size: 1.22rem; font-weight: 800; color: #0F172A; margin-bottom: 0.35rem;">
                ${titleStr}
              </h3>
              <p style="font-size: 0.94rem; color: #0F172A; line-height: 1.65; max-width: 780px;">
                ${subStr}
              </p>
            </div>
            <div class="biomechanics-potential-badge" style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: var(--radius-inner); padding: 0.75rem 1.25rem; text-align: center;">
              <span style="font-size: 0.78rem; font-weight: 700; color: #0F172A; display: block;">
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

        <!-- 4 Illustrated Exercise Routine Cards (1-Card-Per-Row Sequential Layout) -->
        <div class="routines-grid" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.35rem;">
    `;

    const displayRoutines = [...ROUTINES, ROUTINE_4_LOWER_BODY_STRETCH];

    displayRoutines.forEach((r, idx) => {
      const name = isGlobal ? r.nameEn : r.nameKo;
      const summary = isGlobal ? r.summaryEn : r.summaryKo;
      const instructions = isGlobal ? r.instructionsEn : r.instructionsKo;
      const timer = getOrCreateTimer(r.id) || { currentSet: 1, remainingSeconds: r.duration || 60 };
      const initialTime = formatTime(timer.remainingSeconds);

      const categoryLabel = r.category === 'decompression'
        ? (isGlobal ? 'Exercise 1: Spine Decompression' : '운동 1단계: 척추 마디 늘리기')
        : (r.category === 'alignment'
          ? (isGlobal ? 'Exercise 2: Posture Alignment' : '운동 2단계: 굽은 등·골반 펴기')
          : (r.category === 'epiphyseal_stimulation'
            ? (isGlobal ? 'Exercise 3: Growth Plate Jumping' : '운동 3단계: 성장판 탄성 점핑')
            : (isGlobal ? 'Exercise 4: Lower-Body & Core Stretch' : '운동 4단계: 하체 성장판 이완 & 코어 브릿지')));

      const freqBadge = r.id === 'dead_hang'
        ? (isGlobal ? 'Morning & Night · 30s × 3 times' : '권장: 아침·저녁 30초씩 3번')
        : (r.id === 'thoracic_stretch'
          ? (isGlobal ? 'Before Bed · 45s × 2 times' : '권장: 잠들기 전 45초씩 2번')
          : (r.id === 'plyometrics'
            ? (isGlobal ? 'Afternoon · 10~15 mins' : '권장: 하교 후 하루 10~15분')
            : (isGlobal ? 'After Jumping / Bedtime · 1 min × 2' : '권장: 점핑 후·취침 전 1분씩 2번')));

      const illustrationSvg = r.id === 'lower_body_core_stretch'
        ? getRoutine4IllustrationSvg(isGlobal)
        : getRoutineIllustrationSvg(r.id, isGlobal);

      html += `
        <div class="bento-card routine-timer-card" id="routine-card-${r.id}" style="display: flex; flex-direction: column; justify-content: space-between; position: relative; padding: 1.2rem;">
          <!-- Card Header -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 800; color: #1D4ED8; background: #EFF6FF; padding: 0.25rem 0.7rem; border-radius: 9999px;">
                ${categoryLabel}
              </span>
              <span style="font-size: 0.8rem; font-weight: 800; color: #1D4ED8; background: #EFF6FF; padding: 0.22rem 0.65rem; border-radius: 9999px;">
                ${freqBadge}
              </span>
            </div>

            <h4 style="font-size: 1.04rem; font-weight: 800; color: #0F172A; margin-bottom: 0.45rem;">
              ${idx + 1}. ${name}
            </h4>

            <p style="font-size: 0.94rem; color: #0F172A; line-height: 1.65; margin-bottom: 0.9rem;">
              ${summary}
            </p>

            <!-- Illustrated Exercise Visual Guide (Replaces Stopwatch Timer UI) -->
            <div class="exercise-visual-guide-box" style="margin-bottom: 1rem;">
              ${illustrationSvg}
            </div>

            <!-- Always-Visible Step-by-Step How-To Guide (Large Readable Font) -->
            <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 14px; padding: 0.95rem 1rem;">
              <div style="font-size: 0.88rem; font-weight: 800; color: #1D4ED8; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <span>${isGlobal ? 'Step-by-Step How to Do It' : '그림 보고 따라 하는 동작 순서'}</span>
                <span style="color: #1D4ED8; font-size: 0.8rem;">${isGlobal ? 'Gain' : '기대 효과'}: ${r.restorationEstimate}</span>
              </div>
              <ol style="margin: 0; padding-left: 1.2rem; font-size: 0.92rem; color: #0F172A; line-height: 1.65;">
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

        <!-- Recommended Products at Bottom of Core 3 (Hidden by default so pure report shows first) -->
        <div class="bento-card curated-product-recommendation-section growth-product-section" id="core-3-recommended-products" style="display: none; margin-top: 1.25rem; margin-bottom: 1.25rem; padding: 1.35rem; background: #F8FAFC; border: 1.5px solid #BFDBFE; border-radius: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.9rem;">
            <span style="font-size: 1.05rem; font-weight: 900; color: #0F172A;">
              척추 감압 · 바른 자세 교정에 도움이 되는 엄선 추천 상품 TOP 3
            </span>
            <span style="font-size: 0.78rem; font-weight: 800; color: #1D4ED8; background: #EFF6FF; padding: 0.22rem 0.65rem; border-radius: 9999px;">
              Core 3 맞춤 큐레이션
            </span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.65rem;">
              <div>
                <span style="font-size: 0.74rem; font-weight: 800; color: #1D4ED8;">엄선 1위 · 운동 1단계 필수템</span>
                <div style="font-size: 0.96rem; font-weight: 800; color: #0F172A; margin: 0.25rem 0;">안전 고정형 실내 문틀 철봉 (데드행 스트레칭 바)</div>
                <p style="font-size: 0.84rem; color: #475569; margin: 0; line-height: 1.45;">아침·저녁 30초 매달리기로 낮 동안 눌린 척추 디스크 간격을 안전하게 펴줍니다.</p>
              </div>
              <a href="https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EB%A9%9C%ED%82%88%EC%8A%A4%ED%8F%AC%EC%B8%A0+%EB%AC%B4%ED%83%80%EA%B3%B5+%EC%95%88%EC%A0%84+%EB%AC%B8%ED%8B%80+%EC%B2%A0%EB%B4%89" target="_blank" rel="noopener noreferrer" style="display: inline-flex; justify-content: center; align-items: center; padding: 0.6rem 0.9rem; border-radius: 10px; background: #1D4ED8; color: #FFFFFF; font-size: 0.85rem; font-weight: 800; text-decoration: none;">
                실내 문틀 철봉 보러가기 ↗
              </a>
            </div>
            <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.65rem;">
              <div>
                <span style="font-size: 0.74rem; font-weight: 800; color: #1D4ED8;">엄선 2위 · 운동 2단계 필수템</span>
                <div style="font-size: 0.96rem; font-weight: 800; color: #0F172A; margin: 0.25rem 0;">멜킨스포츠 척추 신전 고밀도 EPP 폼롤러 90cm</div>
                <p style="font-size: 0.84rem; color: #475569; margin: 0; line-height: 1.45;">흉추 신전 스트레칭과 책상 시선 각도 교정으로 숨은 키(+1.8cm)를 복원합니다.</p>
              </div>
              <a href="https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EB%A9%9C%ED%82%88%EC%8A%A4%ED%8F%AC%EC%B8%A0+%EA%B3%A0%EB%B0%80%EB%8F%84+EPP+%ED%8F%BC%EB%A1%A4%EB%9F%AC+90cm" target="_blank" rel="noopener noreferrer" style="display: inline-flex; justify-content: center; align-items: center; padding: 0.6rem 0.9rem; border-radius: 10px; background: #1D4ED8; color: #FFFFFF; font-size: 0.85rem; font-weight: 800; text-decoration: none;">
                멜킨 고밀도 EPP 폼롤러 보기 ↗
              </a>
            </div>
            <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.65rem;">
              <div>
                <span style="font-size: 0.74rem; font-weight: 800; color: #1D4ED8;">엄선 3위 · 운동 3단계 필수템</span>
                <div style="font-size: 0.96rem; font-weight: 800; color: #0F172A; margin: 0.25rem 0;">멜킨스포츠 어린이 무소음 실내 점핑 트램폴린</div>
                <p style="font-size: 0.84rem; color: #475569; margin: 0; line-height: 1.45;">관절 무리 없이 무릎 성장판에 탄성 미세 자극을 전달하는 실내 운동 기구입니다.</p>
              </div>
              <a href="https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EB%A9%9C%ED%82%88%EC%8A%A4%ED%8F%AC%EC%B8%A0+%EC%96%B4%EB%A6%B0%EC%9D%B4+%EB%AC%B4%EC%86%8C%EC%9D%8C+%EC%8B%A4%EB%82%B4+%ED%8A%B8%EB%9E%A8%ED%8F%B4%EB%A6%B0" target="_blank" rel="noopener noreferrer" style="display: inline-flex; justify-content: center; align-items: center; padding: 0.6rem 0.9rem; border-radius: 10px; background: #1D4ED8; color: #FFFFFF; font-size: 0.85rem; font-weight: 800; text-decoration: none;">
                멜킨 무소음 실내 트램폴린 보기 ↗
              </a>
            </div>
          </div>
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

        <!-- Biomechanics Reference Archival Chip (Hidden by default in pure report) -->
        <div class="curated-product-recommendation-section growth-product-section" style="display: none; justify-content: flex-end; margin-top: 1rem;">
          <a href="https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%9C%84%EC%A6%88%EB%8F%85%EC%84%9C%EB%8C%80+%EB%86%92%EC%9D%B4%EC%A1%B0%EC%A0%88+%EC%9B%90%EB%AA%A9+2%EB%8B%A8+%EB%8F%85%EC%84%9C%EB%8C%80" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="reference-chip" 
             id="ref-chip-biomechanics"
             style="font-size: 12px; color: #334155; border: 1px solid var(--theme-border); padding: 0.35rem 0.75rem; border-radius: 9999px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; background: var(--theme-surface-sub);">
            <span></span>
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
          stateEl.textContent = 'ALL SETS COMPLETED! ';
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
