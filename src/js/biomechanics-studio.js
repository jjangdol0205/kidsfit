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

  // 4. HTML Section Renderer
  function renderBiomechanicsSection(profile = {}, affConfig = {}) {
    const isGlobal = (typeof document !== 'undefined' && document.documentElement.lang === 'en') || profile.language === 'en';
    const habits = profile.habits || [];
    const restoredHeight = calculateDecompressionPotential(habits);

    const titleStr = isGlobal ? 'Spine Decompression & Wolff\'s Law Biomechanics Studio' : '척추 감압 & 볼프의 법칙 생체역학 운동 스튜디오';
    const subStr = isGlobal
      ? 'Daily diurnal gravity compresses disc space by 1.5~2.2 cm. Passive axial traction and cyclic epiphyseal loading restore +1.8 cm curvature and trigger Runx2/Sox9 osteogenesis.'
      : '일상 중력 압박으로 하루 1.5~2.2cm 감소하는 척추 디스크 수핵을 수화시키고, 볼프의 법칙(Wolff\'s Law)에 따라 성장판 연골세포 분열(Runx2/Sox9)을 자극하는 3대 임상 운동 루틴입니다.';

    let html = `
      <div id="core-3-container" class="core-module-container biomechanics-studio-container">
        <!-- Studio Clinical Header Card -->
        <div class="bento-card studio-header-card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--rose-alert);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="tab-badge tab-badge-rose" style="display: inline-block; margin-bottom: 0.5rem;">
                🏃 Core 3 · Clinical Biomechanics
              </span>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
                ${titleStr}
              </h3>
              <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.55; max-width: 780px;">
                ${subStr}
              </p>
            </div>
            <div class="biomechanics-potential-badge" style="background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: var(--radius-inner); padding: 0.75rem 1.25rem; text-align: center;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); display: block;">
                ${isGlobal ? 'Spinal Curvature Recovery' : '숨은 척추 만곡 복원 잠재력'}
              </span>
              <span style="font-size: 1.5rem; font-weight: 900; color: var(--rose-alert); font-family: var(--font-mono);">
                +${restoredHeight} cm
              </span>
            </div>
          </div>

          <!-- Clinical Mechanism Tags -->
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--theme-border-subtle);">
            <span class="spec-tag" style="font-size: 0.75rem; padding: 0.25rem 0.65rem; background: var(--theme-surface-sub); border-radius: 9999px; color: var(--text-secondary);">
              💧 ${isGlobal ? 'Disc Rehydration: L1~L5 Osmotic Flow' : '추간판 수핵 수화: L1~L5 디스크 압박 해소'}
            </span>
            <span class="spec-tag" style="font-size: 0.75rem; padding: 0.25rem 0.65rem; background: var(--theme-surface-sub); border-radius: 9999px; color: var(--text-secondary);">
              🧬 ${isGlobal ? 'Wolff\'s Law: 1.5~2.5G Micro-Stress' : '볼프의 법칙: 1.5~2.5G 미세 압전 전류'}
            </span>
            <span class="spec-tag" style="font-size: 0.75rem; padding: 0.25rem 0.65rem; background: var(--theme-surface-sub); border-radius: 9999px; color: var(--text-secondary);">
              🔬 ${isGlobal ? 'Chondrocyte Trigger: Runx2 / Sox9' : '골단판 성장 촉진: Runx2 / Sox9 활성화'}
            </span>
          </div>
        </div>

        <!-- 3 Interactive Routine Cards Grid -->
        <div class="routines-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
    `;

    ROUTINES.forEach((r, idx) => {
      const name = isGlobal ? r.nameEn : r.nameKo;
      const summary = isGlobal ? r.summaryEn : r.summaryKo;
      const instructions = isGlobal ? r.instructionsEn : r.instructionsKo;
      const timer = getOrCreateTimer(r.id);
      const initialTime = formatTime(timer.remainingSeconds);

      const categoryLabel = r.category === 'decompression'
        ? (isGlobal ? 'Step 1: Decompression' : '1단계: 척추 견인 감압')
        : (r.category === 'alignment'
          ? (isGlobal ? 'Step 2: Alignment' : '2단계: 체형·골반 정렬')
          : (isGlobal ? 'Step 3: Epiphyseal Micro-Stress' : '3단계: 골단판 미세자극'));

      html += `
        <div class="bento-card routine-timer-card" id="routine-card-${r.id}" style="display: flex; flex-direction: column; justify-content: space-between; position: relative;">
          <!-- Card Header -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--rose-alert); background: rgba(244, 63, 94, 0.12); padding: 0.2rem 0.6rem; border-radius: 9999px;">
                ${categoryLabel}
              </span>
              <span class="set-indicator-badge" id="set-badge-${r.id}" style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">
                ${isGlobal ? 'Set' : '세트'} <span class="current-set">${timer.currentSet}</span> / ${r.sets}
              </span>
            </div>

            <h4 style="font-size: 1.12rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.4rem;">
              ${idx + 1}. ${name}
            </h4>

            <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
              ${summary}
            </p>
          </div>

          <!-- Digital Stopwatch Display & Circular Dial -->
          <div class="timer-dial-container" style="background: var(--theme-surface-sub); border-radius: var(--radius-inner); padding: 1.25rem 1rem; text-align: center; margin-bottom: 1.25rem; border: 1px solid var(--theme-border-subtle);">
            <div class="timer-state-label" id="timer-state-${r.id}" style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.25rem;">
              ${isGlobal ? 'READY TO START' : '준비 완료'}
            </div>

            <div class="timer-digits" id="timer-digits-${r.id}" style="font-size: 2.75rem; font-weight: 900; font-family: var(--font-mono); color: var(--text-primary); letter-spacing: -0.02em; line-height: 1;">
              ${initialTime}
            </div>

            <!-- Progress Bar -->
            <div class="timer-progress-track" style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; margin-top: 1rem; overflow: hidden;">
              <div class="timer-progress-fill" id="timer-progress-${r.id}" style="width: 0%; height: 100%; background: var(--rose-alert); transition: width 0.3s ease;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 0.4rem; font-size: 0.72rem; color: var(--text-muted);">
              <span>${isGlobal ? 'Target' : '목표'}: ${r.duration >= 60 ? (r.duration / 60) + (isGlobal ? ' min' : '분') : r.duration + (isGlobal ? 's' : '초')}</span>
              <span>${isGlobal ? 'Est. Gain' : '예상 복원'}: <strong style="color: var(--rose-alert);">${r.restorationEstimate}</strong></span>
            </div>
          </div>

          <!-- Stopwatch Control Buttons -->
          <div>
            <div class="timer-controls-group" style="display: flex; gap: 0.5rem; margin-bottom: 0.85rem;">
              <button type="button" class="btn btn-primary btn-timer-start" id="btn-start-${r.id}" data-routine="${r.id}" style="flex: 2; padding: 0.65rem 0.5rem; font-size: 0.85rem; font-weight: 700; background: var(--rose-alert); border-color: var(--rose-alert);">
                ▶ ${isGlobal ? 'Start' : '시작'}
              </button>
              <button type="button" class="btn btn-secondary btn-timer-pause" id="btn-pause-${r.id}" data-routine="${r.id}" style="flex: 1; padding: 0.65rem 0.5rem; font-size: 0.85rem; font-weight: 700;">
                ⏸ ${isGlobal ? 'Pause' : '일시정지'}
              </button>
              <button type="button" class="btn btn-secondary btn-timer-reset" id="btn-reset-${r.id}" data-routine="${r.id}" style="flex: 1; padding: 0.65rem 0.5rem; font-size: 0.85rem; font-weight: 700;">
                🔄 ${isGlobal ? 'Reset' : '초기화'}
              </button>
            </div>

            <!-- Set Complete Trigger Button -->
            <button type="button" class="btn btn-secondary btn-timer-complete" id="btn-complete-${r.id}" data-routine="${r.id}" style="width: 100%; padding: 0.5rem; font-size: 0.78rem; color: var(--text-secondary); background: transparent; border: 1px dashed var(--theme-border-subtle);">
              ✓ ${isGlobal ? 'Mark Current Set Complete' : '현재 세트 완료 처리'}
            </button>
          </div>

          <!-- Accordion / Instructions Tooltip -->
          <details style="margin-top: 1rem; font-size: 0.78rem; color: var(--text-secondary); border-top: 1px solid var(--theme-border-subtle); padding-top: 0.75rem;">
            <summary style="cursor: pointer; font-weight: 700; color: var(--text-primary); outline: none;">
              📖 ${isGlobal ? 'Clinical Execution Guide' : '임상 운동 가이드 & 주의사항'}
            </summary>
            <ol style="margin-top: 0.5rem; padding-left: 1.25rem; line-height: 1.55;">
              ${instructions.map(inst => `<li>${inst}</li>`).join('')}
            </ol>
          </details>
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
