/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * Core 4: Neuro-Cognitive & Exploration Matrix (연령별 뇌인지 발달 & 주말 하브루타 탐구 로드맵)
 * 
 * Clinical Principles:
 * 1. 5-Axis Neuro-Cognitive Dimension Balance:
 *    - Math / Spatial / Logic (수리·공간·논리적 사고력)
 *    - Language / Literacy / Critical Reading (언어·문해력·비판적 독서)
 *    - Science / Nature / Technology (과학·자연·기술 탐구력)
 *    - Sensory / Arts / Creative Expression (감각·예술·창의적 표현력)
 *    - Prefrontal Executive Function & Focus (전두엽 실행기능 & 자기주도 집중력)
 * 2. Cortical Rewiring & Developmental Golden Times:
 *    - Toddler (1~3 yrs): Sensorimotor synaptogenesis & fine motor pathways.
 *    - Childhood (4~7 yrs): Linguistic lateralization in Broca/Wernicke areas & spatial induction.
 *    - Early Puberty (8~11 yrs): Prefrontal cortical thickness peak & abstract logic.
 *    - Adolescence (12~18 yrs): Axonal myelination & executive stabilization.
 * 3. 3-Step Havruta Inquiry Model:
 *    - Step 1: Observation & Inquiry (특이한 점 / unexpected pattern)
 *    - Step 2: Hypothesis & Deduction (달라졌을까 / reversed variable)
 *    - Step 3: Application & Reflection (해결할 수 있을까 / real-world application)
 */

(function (global) {
  'use strict';

  // 1. Definition of 5 Cognitive Pillars
  const COGNITIVE_PILLARS = [
    {
      id: 'math_logic',
      nameKo: '수리·공간·논리',
      nameEn: 'Math & Spatial',
      fullKo: '수리·공간·논리적 사고력',
      fullEn: 'Mathematical, Spatial & Logical Reasoning',
      descKo: '도형 위상 감각, 멘탈 로테이션, 알고리즘 분해 및 원인-결과 인과 추론 능력',
      descEn: 'Mental rotation, geometric topology, algorithmic puzzles, and causal reasoning.'
    },
    {
      id: 'language_reading',
      nameKo: '언어·문해력',
      nameEn: 'Language & Literacy',
      fullKo: '언어·문해력·비판적 독서',
      fullEn: 'Linguistic Literacy & Critical Reading',
      descKo: '어휘 다면성, 문맥 추론, 비판적 독해 및 복합 서사 구조화 능력',
      descEn: 'Vocabulary acquisition, syntax complexity, narrative comprehension, and contextual analysis.'
    },
    {
      id: 'science_nature',
      nameKo: '과학·자연탐구',
      nameEn: 'Science & Nature',
      fullKo: '과학·자연·기술 탐구력',
      fullEn: 'Empirical Science & Technological Inquiry',
      descKo: '경험적 가설 설정, 생태 관찰, 물리 원리 실험 및 지적 호기심 확장',
      descEn: 'Empirical hypothesis testing, biological observation, and physical science curiosity.'
    },
    {
      id: 'sensory_arts',
      nameKo: '감각·예술창의',
      nameEn: 'Sensory & Arts',
      fullKo: '감각·예술·창의적 표현력',
      fullEn: 'Sensory Aesthetics & Fine-Motor Creativity',
      descKo: '양측성 소근육 정밀 협응, 시각 예술적 비례 감각, 입체 조형 및 감정 표현',
      descEn: 'Bilateral fine motor coordination, visual-spatial aesthetics, and creative craftsmanship.'
    },
    {
      id: 'executive_focus',
      nameKo: '전두엽 실행집중',
      nameEn: 'Executive Focus',
      fullKo: '전두엽 실행기능 & 자기주도 집중력',
      fullEn: 'Prefrontal Executive Function & Working Memory',
      descKo: '작업 기억(Working Memory), 충동 억제 자기조절력, 목표 지향적 몰입 지속성',
      descEn: 'Working memory, inhibitory self-regulation, goal persistence, and deep-focus stamina.'
    }
  ];

  // 2. Developmental Golden Windows & Cortical Rewiring Protocols
  const CORTICAL_GOLDEN_WINDOWS = [
    {
      id: 'toddler',
      ageMinYears: 1,
      ageMaxYears: 3,
      ageRangeStr: '1~3세 (12~47개월)',
      ageRangeStrEn: '1-3 yrs (Toddler)',
      focus: 'sensorimotor synaptogenesis',
      focusKo: '감각운동 피질 시냅스 폭발적 형성기 (Sensorimotor Synaptogenesis)',
      targetCortex: '감각운동 피질(Sensorimotor Cortex) & 두정엽(Parietal Lobe)',
      principleKo: '초당 100만 개 시냅스가 연결되는 시기로, 양손 촉각·소근육 자극이 기초 두뇌 배선을 완성합니다.',
      principleEn: 'Rapid synaptogenesis forming 1M connections/sec via bilateral fine-motor play.',
      dailyRegimenKo: '하루 15분: 촉각 놀이 · 원목 블록 쌓기 · 손끝 집게/가위질',
      dailyRegimenEn: '15 min/day: Tactile exploration, block sorting, fine-motor tasks.',
      recommendedToolsKo: '몬테소리 일상 감각 교구 · 실리콘 촉각 볼 · 원목 퍼즐',
      recommendedToolsEn: 'Montessori sensorial apparatus, tactile spheres, wooden puzzles.'
    },
    {
      id: 'childhood',
      ageMinYears: 4,
      ageMaxYears: 7,
      ageRangeStr: '4~7세 (48~95개월)',
      ageRangeStrEn: '4-7 yrs (Childhood)',
      focus: 'linguistic lateralization',
      focusKo: '언어 편측화 & 전두-두정 신경망 가지치기',
      targetCortex: '브로카·베르니케 언어 영역 & 좌우 뇌량',
      principleKo: '시냅스 가지치기로 사고 회로가 정교해지며 언어 표현과 입체 공간 추론의 기초가 확립됩니다.',
      principleEn: 'Linguistic lateralization and synaptic pruning stabilize inductive logic.',
      dailyRegimenKo: '하루 20분: 그림책 낭독 · "왜 그럴까?" 질문 · 은물·자석블록 입체 조형',
      dailyRegimenEn: '20 min/day: Dialogic reading, causal inquiry, 3D block construction.',
      recommendedToolsKo: '프뢰벨 은물/가베 · 자석 블록 · 자연 관찰 도감 · 입문 현미경',
      recommendedToolsEn: 'Froebel gifts, magnetic blocks, beginner optical microscopes.'
    },
    {
      id: 'early_puberty',
      ageMinYears: 8,
      ageMaxYears: 11,
      ageRangeStr: '8~11세 (96~143개월)',
      ageRangeStrEn: '8-11 yrs (Early Puberty)',
      focus: 'prefrontal cortical thickness',
      focusKo: '전두엽 피질 두께 피크 & 메타인지 형성',
      targetCortex: '배외측 전전두엽(DLPFC) & 전대상회(ACC)',
      principleKo: '추상적 사고와 메타인지(스스로 생각을 점검하는 힘)를 관장하는 전두엽이 최고조로 발달합니다.',
      principleEn: 'Prefrontal cortex thickness peaks, enabling abstract logic and meta-cognition.',
      dailyRegimenKo: '하루 25분: 하브루타 질문 토론 · 전략 보드게임 · 과학 탐구 일지',
      dailyRegimenEn: '25 min/day: Socratic debate, strategy games, science journaling.',
      recommendedToolsKo: '과학 실험 키트 · 그래비트랙스 · 전략 보드게임 · 역사·과학 필독서',
      recommendedToolsEn: 'Science lab kits, marble runs, chess, classic literature.'
    },
    {
      id: 'adolescence',
      ageMinYears: 12,
      ageMaxYears: 18,
      ageRangeStr: '12~18세 (144~240개월)',
      ageRangeStrEn: '12-18 yrs (Adolescence)',
      focus: 'axonal myelination',
      focusKo: '신경 축삭 수초화 & 자기주도 딥워크 완성',
      targetCortex: '전두엽 백질 신경망 & 변연계',
      principleKo: '신경 전달 속도를 100배 높이는 수초화가 완성되어 장기 목표 몰입과 고차원 추론이 자리잡습니다.',
      principleEn: 'Axonal myelination accelerates neural speed 100x for deep academic stamina.',
      dailyRegimenKo: '하루 30분: 무방해 딥워크 몰입 · 원전 심층 독서 · 요약 노트 작성',
      dailyRegimenEn: '30 min/day: Distraction-free deep work, deep reading, essay writing.',
      recommendedToolsKo: '무소음 시각 타이머 · 코딩 키트 · 인문·과학 고전 · 자세교정 독서대',
      recommendedToolsEn: 'Visual focus timer, coding kits, classic treatises, ergonomic stand.'
    }
  ];

  // 3. Weekend Exploration Sites & 3-Step Havruta Parent-Child Questions
  const HAVRUTA_QUESTIONS = {
    step1: {
      step: 1,
      titleKo: '1단계: 관찰 & 질문',
      titleEn: 'Step 1: Observation & Inquiry',
      modelKo: '이 전시물에서 가장 규칙적이지 않거나 특이한 점은 무엇일까?',
      modelEn: 'What is the most unexpected pattern or irregularity you observe here?',
      guideKo: '• 정답 대신 아이가 색·모양·움직임에서 느낀 특이한 점을 먼저 말하게 해주세요.'
    },
    step2: {
      step: 2,
      titleKo: '2단계: 가설 & 추론',
      titleEn: 'Step 2: Hypothesis & Deduction',
      modelKo: '만약 이 조건이 반대로 바뀌었다면, 구조나 역사적 결과는 어떻게 달라졌을까?',
      modelEn: 'If this core variable had been reversed, how would the structural or historical outcome have changed?',
      guideKo: '• "만약 재료가 나무였다면?"처럼 핵심 조건을 반대로 뒤집어 상상하게 해주세요.'
    },
    step3: {
      step: 3,
      titleKo: '3단계: 적용 & 확장',
      titleEn: 'Step 3: Application & Reflection',
      modelKo: '오늘 발견한 원리를 우리 일상이나 미래 과학에 적용한다면 어떤 문제를 해결할 수 있을까?',
      modelEn: 'How can the principle discovered today be applied to modern engineering or our daily lives to solve real-world challenges?',
      guideKo: '• 오늘 본 원리를 우리 집이나 일상 속 물건과 연결해 보게 질문해 주세요.'
    }
  };

  const EXPLORATION_SITES = [
    {
      nameKo: '국립과천과학관 / 국립중앙과학관',
      nameEn: 'National Science Museum',
      category: 'science',
      themeKo: '기초과학·우주항공·미래기술 탐구',
      promptKo: '중력 가속도와 우주 발사체 로켓 분리 원리를 관찰하며 하브루타 3단계 질문을 적용해보세요.'
    },
    {
      nameKo: '국립현대미술관 / 서울시립미술관',
      nameEn: 'Museum of Modern Art',
      category: 'arts',
      themeKo: '현대 조형·색채 대비 & 공간 지각력',
      promptKo: '작품의 비대칭 구도와 빛의 반사 방식을 관찰하며 작가가 의도한 감정 변수를 추론해보세요.'
    },
    {
      nameKo: '국립중앙박물관 / 경복궁·창덕궁 역사 현장',
      nameEn: 'National Museum of History',
      category: 'history',
      themeKo: '청동기·조선 과학문화재 & 역사적 의사결정',
      promptKo: '자격루(물시계)와 앙부일구의 기계 장치 구조를 살피며 조선의 과학적 인과관계를 추론해보세요.'
    }
  ];

  // 4. Mathematical Engine: Cognitive Balance Scoring & Radar Coordinates
  function clampScore(score) {
    return Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
  }

  function calculateCognitiveScores(cognitiveAxes = []) {
    const scores = {};
    const hasSelection = Array.isArray(cognitiveAxes) && cognitiveAxes.length > 0;

    COGNITIVE_PILLARS.forEach(pillar => {
      if (!hasSelection) {
        // Default balanced baseline 70 when none are selected
        scores[pillar.id] = 70;
      } else if (cognitiveAxes.includes(pillar.id)) {
        // Selected prioritized cognitive axis
        scores[pillar.id] = 90;
      } else {
        // Non-selected axis
        scores[pillar.id] = 70;
      }
    });

    // If all 5 selected, make all 90
    if (hasSelection && cognitiveAxes.length === 5) {
      COGNITIVE_PILLARS.forEach(p => { scores[p.id] = 90; });
    }

    return scores;
  }

  /**
   * Generates radar polygon coordinate points for SVG rendering.
   * ViewBox: 0 0 400 400, Center: (200, 200), Max Radius: 135
   */
  function calculateRadarPoints(scores, radius = 135, cx = 200, cy = 200) {
    const points = [];
    const n = COGNITIVE_PILLARS.length; // 5 axes

    COGNITIVE_PILLARS.forEach((pillar, i) => {
      const angle = -Math.PI / 2 + i * ((2 * Math.PI) / n);
      const score = clampScore(scores[pillar.id] || 70);
      const r = (score / 100) * radius;
      const x = Math.round((cx + r * Math.cos(angle)) * 10) / 10;
      const y = Math.round((cy + r * Math.sin(angle)) * 10) / 10;
      points.push({ x, y, score, pillar: pillar.id, angle });
    });

    return points;
  }

  function pointsToSvgPolygonPath(points) {
    if (!points || points.length === 0) return '';
    const d = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';
    return d;
  }

  function pointsToString(points) {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  }

  // 5. SVG Radar Chart Generator
  function renderRadarSvg(scores = {}, isGlobal = false) {
    const cx = 200;
    const cy = 200;
    const maxR = 130;
    const n = 5;

    // Normative baseline scores (70 across all axes)
    const baselineScores = { math_logic: 70, language_reading: 70, science_nature: 70, sensory_arts: 70, executive_focus: 70 };
    const baselinePoints = calculateRadarPoints(baselineScores, maxR, cx, cy);
    const baselinePath = pointsToSvgPolygonPath(baselinePoints);

    // Child profile points
    const childPoints = calculateRadarPoints(scores, maxR, cx, cy);
    const childPath = pointsToSvgPolygonPath(childPoints);
    const childPointsStr = pointsToString(childPoints);

    // Concentric grid webs at 20, 40, 60, 80, 100
    let gridSvg = '';
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach(ratio => {
      const r = maxR * ratio;
      const polyPts = [];
      for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + i * ((2 * Math.PI) / n);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        polyPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      gridSvg += `<polygon points="${polyPts.join(' ')}" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />`;
      // Grid label
      gridSvg += `<text x="${cx + 4}" y="${(cy - r + 4).toFixed(1)}" font-size="9" fill="rgba(255, 255, 255, 0.25)" font-family="var(--font-mono)">${Math.round(ratio * 100)}</text>`;
    });

    // Axis spokes & labels
    let spokesSvg = '';
    COGNITIVE_PILLARS.forEach((pillar, i) => {
      const angle = -Math.PI / 2 + i * ((2 * Math.PI) / n);
      const x = cx + maxR * Math.cos(angle);
      const y = cy + maxR * Math.sin(angle);
      spokesSvg += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255, 255, 255, 0.12)" stroke-dasharray="2,2" />`;

      // Label coordinate outside radius
      const lx = cx + (maxR + 24) * Math.cos(angle);
      const ly = cy + (maxR + 20) * Math.sin(angle);
      const anchor = Math.abs(x - cx) < 10 ? 'middle' : (x > cx ? 'start' : 'end');
      const labelText = isGlobal ? pillar.nameEn : pillar.nameKo;

      spokesSvg += `
        <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-size="11" font-weight="700" fill="var(--text-primary)" dominant-baseline="central">
          ${labelText}
        </text>
      `;
    });

    // Child vertex markers
    let verticesSvg = '';
    childPoints.forEach(p => {
      verticesSvg += `
        <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="var(--cyan-pulse)" stroke="#FFFFFF" stroke-width="1.5">
          <title>${p.pillar}: ${p.score}</title>
        </circle>
      `;
    });

    return `
      <svg viewBox="0 0 400 400" class="radar-svg" style="width: 100%; max-width: 380px; height: auto; display: block; margin: 0 auto;" aria-label="5-Axis Neuro-Cognitive Balance Radar Chart">
        <defs>
          <radialGradient id="childRadarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(56, 189, 248, 0.45)" />
            <stop offset="100%" stop-color="rgba(16, 185, 129, 0.15)" />
          </radialGradient>
        </defs>

        <!-- Background Concentric Webs -->
        ${gridSvg}

        <!-- 5 Axis Spokes -->
        ${spokesSvg}

        <!-- Baseline Normative 70 Polygon (Dashed Slate) -->
        <path d="${baselinePath}" fill="rgba(148, 163, 184, 0.08)" stroke="#64748B" stroke-width="1.5" stroke-dasharray="4,4" />

        <!-- Child Profile Polygon (Glowing Cyan/Emerald) -->
        <path d="${childPath}" fill="url(#childRadarGrad)" stroke="var(--cyan-pulse)" stroke-width="2.5" />
        <polygon points="${childPointsStr}" fill="none" opacity="0" />

        <!-- Vertex Point Pins -->
        ${verticesSvg}
      </svg>
    `;
  }

  // 6. Age Golden Window Resolver
  function getGoldenTimeInfo(ageYears = 10) {
    const y = Math.max(1, Math.min(20, Number(ageYears) || 10));
    return CORTICAL_GOLDEN_WINDOWS.find(w => y >= w.ageMinYears && y <= w.ageMaxYears) || CORTICAL_GOLDEN_WINDOWS[2];
  }

  // 7. Full HTML Section Renderer
  function renderNeuroSection(profile = {}, affConfig = {}) {
    const isGlobal = (typeof document !== 'undefined' && document.documentElement.lang === 'en') || profile.language === 'en';
    const ageYears = profile.ageYears || (profile.ageMonths ? Math.round(profile.ageMonths / 12) : 10);
    const cogAxes = profile.cognitiveAxes || [];

    const scores = calculateCognitiveScores(cogAxes);
    const goldenWindow = getGoldenTimeInfo(ageYears);
    const radarSvg = renderRadarSvg(scores, isGlobal);

    const titleStr = isGlobal ? 'Neuro-Cognitive Matrix & Havruta Exploration' : '5각 뇌인지 발달 매트릭스 & 주말 하브루타 탐구 로드맵';
    const subStr = isGlobal
      ? '5-Axis developmental radar balance, age-specific cortical rewiring windows, and 3-step Havruta parent-child inquiry protocols.'
      : '수리·언어·과학·감각·전두엽 5대 인지 영역 밸런스, 연령별 대뇌 피질 재조직화 원리 및 주말 현장 탐구 3단계 하브루타 질문 세트입니다.';

    let html = `
      <div id="core-4-container" class="core-module-container neuro-cognitive-container">
        <!-- Core 4 Header Card -->
        <div class="bento-card neuro-header-card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--bio-emerald);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="tab-badge tab-badge-mint" style="display: inline-block; margin-bottom: 0.5rem;">
                🧠 Core 4 · Neuro-Cognitive Architecture
              </span>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
                ${titleStr}
              </h3>
              <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.55; max-width: 800px;">
                ${subStr}
              </p>
            </div>
            <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-inner); padding: 0.75rem 1.25rem; text-align: center;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); display: block;">
                ${isGlobal ? 'Neuroplasticity Golden Age' : '현재 두뇌 발달 골든타임'}
              </span>
              <span style="font-size: 1.15rem; font-weight: 800; color: var(--bio-emerald);">
                ${isGlobal ? goldenWindow.ageRangeStrEn : goldenWindow.ageRangeStr}
              </span>
            </div>
          </div>
        </div>

        <!-- 2-Column Grid: Radar Chart vs. Cortical Rewiring Guide -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
          
          <!-- Column 1: 5-Axis Radar Chart & Scores -->
          <div class="bento-card radar-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0;">
                  📊 ${isGlobal ? '5-Axis Cognitive Balance Radar' : '5각 뇌인지 밸런스 레이더 차트'}
                </h4>
                <div style="font-size: 0.75rem; color: var(--text-secondary); display: flex; gap: 0.75rem;">
                  <span style="display: inline-flex; align-items: center; gap: 0.25rem;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--cyan-pulse);"></span>
                    ${isGlobal ? 'Child Profile' : '아이 프로필'}
                  </span>
                  <span style="display: inline-flex; align-items: center; gap: 0.25rem;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #64748B;"></span>
                    ${isGlobal ? 'Age Norm (70)' : '또래 기준치 (70)'}
                  </span>
                </div>
              </div>

              <!-- SVG Radar Graphic -->
              <div class="radar-chart-container" style="padding: 0.5rem 0; text-align: center;">
                ${radarSvg}
              </div>
            </div>

            <!-- Domain Score Badges -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--theme-border-subtle);">
              ${COGNITIVE_PILLARS.map(p => {
                const s = scores[p.id] || 70;
                const isHigh = s >= 85;
                const name = isGlobal ? p.nameEn : p.nameKo;
                return `
                  <div style="background: var(--theme-surface-sub); padding: 0.5rem 0.65rem; border-radius: 8px; border: 1px solid ${isHigh ? 'rgba(56, 189, 248, 0.3)' : 'var(--theme-border-subtle)'}; text-align: center;">
                    <div style="font-size: 0.72rem; color: var(--text-secondary);">${name}</div>
                    <div style="font-size: 1.05rem; font-weight: 800; color: ${isHigh ? 'var(--cyan-pulse)' : 'var(--text-primary)'}; font-family: var(--font-mono);">
                      ${s} <span style="font-size: 0.7rem; font-weight: 500; color: var(--text-muted);">/100</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Column 2: Cortical Rewiring Protocol -->
          <div class="bento-card rewiring-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--bio-emerald); background: rgba(16, 185, 129, 0.12); padding: 0.2rem 0.6rem; border-radius: 9999px;">
                  🔬 ${isGlobal ? 'Cortical Rewiring Science' : '대뇌 피질 신경가소성'}
                </span>
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">
                  ${goldenWindow.ageRangeStr}
                </span>
              </div>

              <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
                ${isGlobal ? goldenWindow.focus : goldenWindow.focusKo}
              </h4>

              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.25rem;">
                ${isGlobal ? goldenWindow.principleEn : goldenWindow.principleKo}
              </p>

              <!-- Daily Regimen Box -->
              <div style="background: var(--theme-surface-sub); border-left: 3px solid var(--bio-emerald); border-radius: 0 var(--radius-inner) var(--radius-inner) 0; padding: 0.85rem 1rem; margin-bottom: 1rem;">
                <span style="font-size: 0.75rem; font-weight: 800; color: var(--bio-emerald); text-transform: uppercase; display: block; margin-bottom: 0.25rem;">
                  ⏱️ ${isGlobal ? 'Daily 15~25 Min Regimen' : '매일 15~25분 가정 두뇌 훈련법'}
                </span>
                <p style="font-size: 0.82rem; color: var(--text-primary); margin: 0; line-height: 1.5;">
                  ${isGlobal ? goldenWindow.dailyRegimenEn : goldenWindow.dailyRegimenKo}
                </p>
              </div>

              <!-- Tools Category -->
              <div style="background: var(--theme-surface-sub); border-radius: var(--radius-inner); padding: 0.85rem 1rem;">
                <span style="font-size: 0.75rem; font-weight: 800; color: var(--theme-accent); text-transform: uppercase; display: block; margin-bottom: 0.25rem;">
                  🧩 ${isGlobal ? 'Recommended Development Tools' : '추천 두뇌·탐구 도구 카테고리'}
                </span>
                <p style="font-size: 0.82rem; color: var(--text-primary); margin: 0; line-height: 1.5;">
                  ${isGlobal ? goldenWindow.recommendedToolsEn : goldenWindow.recommendedToolsKo}
                </p>
              </div>
            </div>

            <!-- Target Cortex Badge -->
            <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--theme-border-subtle); font-size: 0.75rem; color: var(--text-muted);">
              <strong>${isGlobal ? 'Target Area' : '핵심 신경 타깃'}:</strong> ${goldenWindow.targetCortex}
            </div>
          </div>

        </div>

        <!-- Weekend Cultural & Scientific Havruta 3-Question System -->
        <div class="bento-card havruta-card" style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
            <div>
              <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0 0 0.25rem 0;">
                🏛️ ${isGlobal ? 'Weekend Cultural / Science Exploration & Havruta 3-Question Sets' : '주말 박물관·과학관 현장 탐구 & 부모-자녀 하브루타 대화 질문 3선'}
              </h4>
              <p style="font-size: 0.83rem; color: var(--text-secondary); margin: 0;">
                ${isGlobal ? 'Transform weekend outings into critical scientific deductions using Socratic Havruta dialogue.' : '단순 관람을 넘어 아이의 비판적 인과 추론과 전두엽 사고력을 폭발시키는 3단계 문답 모델입니다.'}
              </p>
            </div>
            <span class="spec-tag" style="font-size: 0.75rem; padding: 0.25rem 0.65rem; background: rgba(56, 189, 248, 0.12); color: var(--cyan-pulse); border-radius: 9999px;">
              ${isGlobal ? 'Socratic Dialogue' : '하브루타 문답법'}
            </span>
          </div>

          <!-- 3-Step Question Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
            
            <!-- Step 1 -->
            <div style="background: var(--theme-surface-sub); border: 1px solid var(--theme-border-subtle); border-radius: var(--radius-inner); padding: 1.1rem; border-top: 3px solid var(--cyan-pulse);">
              <span style="font-size: 0.75rem; font-weight: 800; color: var(--cyan-pulse); display: block; margin-bottom: 0.4rem;">
                ${isGlobal ? HAVRUTA_QUESTIONS.step1.titleEn : HAVRUTA_QUESTIONS.step1.titleKo}
              </span>
              <p style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); line-height: 1.45; margin-bottom: 0.5rem;">
                "${isGlobal ? HAVRUTA_QUESTIONS.step1.modelEn : HAVRUTA_QUESTIONS.step1.modelKo}"
              </p>
              <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                ${HAVRUTA_QUESTIONS.step1.guideKo}
              </p>
            </div>

            <!-- Step 2 -->
            <div style="background: var(--theme-surface-sub); border: 1px solid var(--theme-border-subtle); border-radius: var(--radius-inner); padding: 1.1rem; border-top: 3px solid var(--amber-caution);">
              <span style="font-size: 0.75rem; font-weight: 800; color: var(--amber-caution); display: block; margin-bottom: 0.4rem;">
                ${isGlobal ? HAVRUTA_QUESTIONS.step2.titleEn : HAVRUTA_QUESTIONS.step2.titleKo}
              </span>
              <p style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); line-height: 1.45; margin-bottom: 0.5rem;">
                "${isGlobal ? HAVRUTA_QUESTIONS.step2.modelEn : HAVRUTA_QUESTIONS.step2.modelKo}"
              </p>
              <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                ${HAVRUTA_QUESTIONS.step2.guideKo}
              </p>
            </div>

            <!-- Step 3 -->
            <div style="background: var(--theme-surface-sub); border: 1px solid var(--theme-border-subtle); border-radius: var(--radius-inner); padding: 1.1rem; border-top: 3px solid var(--bio-emerald);">
              <span style="font-size: 0.75rem; font-weight: 800; color: var(--bio-emerald); display: block; margin-bottom: 0.4rem;">
                ${isGlobal ? HAVRUTA_QUESTIONS.step3.titleEn : HAVRUTA_QUESTIONS.step3.titleKo}
              </span>
              <p style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); line-height: 1.45; margin-bottom: 0.5rem;">
                "${isGlobal ? HAVRUTA_QUESTIONS.step3.modelEn : HAVRUTA_QUESTIONS.step3.modelKo}"
              </p>
              <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                ${HAVRUTA_QUESTIONS.step3.guideKo}
              </p>
            </div>

          </div>
        </div>

        <!-- Recommended Products at Bottom of Core 4 -->
        <div class="bento-card" id="core-4-recommended-products" style="margin-top: 1.25rem; margin-bottom: 1.25rem; padding: 1.35rem; background: linear-gradient(145deg, rgba(56, 189, 248, 0.1), rgba(15, 23, 42, 0.92)); border: 1.5px solid rgba(56, 189, 248, 0.35); border-radius: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.9rem;">
            <span style="font-size: 1.05rem; font-weight: 900; color: #FFFFFF;">
              🎁 두뇌 발달 · 자기주도 집중력에 도움이 되는 엄선 추천 상품 TOP 3
            </span>
            <span style="font-size: 0.78rem; font-weight: 800; color: #7DD3FC; background: rgba(56, 189, 248, 0.16); padding: 0.22rem 0.65rem; border-radius: 9999px;">
              Core 4 맞춤 큐레이션
            </span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.9rem;">
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.65rem;">
              <div>
                <span style="font-size: 0.74rem; font-weight: 800; color: #38BDF8;">🏆 엄선 1위 · 수리·공간·과학 사고력</span>
                <div style="font-size: 0.96rem; font-weight: 800; color: #FFFFFF; margin: 0.25rem 0;">그래비트랙스 트랙 빌딩 &amp; 입체 자석블록 코딩 교구</div>
                <p style="font-size: 0.84rem; color: #CBD5E1; margin: 0; line-height: 1.45;">중력·가속도 원리와 3차원 공간 도형 감각을 손끝으로 설계하는 두뇌 교구입니다.</p>
              </div>
              <a href="https://www.coupang.com/np/search?q=%EA%B7%B8%EB%9E%98%EB%B9%84%ED%8A%B8%EB%9E%99%EC%8A%A4+%EC%9E%90%EC%84%9D%EB%B8%94%EB%A1%9D&channel=user&lptag=AF7865143" target="_blank" rel="noopener noreferrer" style="display: inline-flex; justify-content: center; align-items: center; padding: 0.6rem 0.9rem; border-radius: 10px; background: linear-gradient(135deg, #0284C7, #2563EB); color: #FFFFFF; font-size: 0.85rem; font-weight: 800; text-decoration: none;">
                🚀 그래비트랙스·자석블록 보기 ↗
              </a>
            </div>
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.65rem;">
              <div>
                <span style="font-size: 0.74rem; font-weight: 800; color: #34D399;">✨ 엄선 2위 · 전두엽 실행기능 &amp; 몰입</span>
                <div style="font-size: 0.96rem; font-weight: 800; color: #FFFFFF; margin: 0.25rem 0;">무소음 시각 타이머 (타임타이머) &amp; 집중력 보드게임</div>
                <p style="font-size: 0.84rem; color: #CBD5E1; margin: 0; line-height: 1.45;">남은 시간을 눈으로 확인하며 스스로 스마트폰을 멈추고 25분 몰입하는 습관을 길러줍니다.</p>
              </div>
              <a href="https://www.coupang.com/np/search?q=%EB%AC%B4%EC%86%8C%EC%9D%8C+%ED%83%80%EC%9E%84%ED%83%80%EC%9D%B4%EB%A8%B8+%EB%B3%B4%EB%93%9C%EA%B2%8C%EC%9E%84&channel=user&lptag=AF7865143" target="_blank" rel="noopener noreferrer" style="display: inline-flex; justify-content: center; align-items: center; padding: 0.6rem 0.9rem; border-radius: 10px; background: linear-gradient(135deg, #059669, #10B981); color: #FFFFFF; font-size: 0.85rem; font-weight: 800; text-decoration: none;">
                🚀 무소음 시각 타이머 보러가기 ↗
              </a>
            </div>
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.65rem;">
              <div>
                <span style="font-size: 0.74rem; font-weight: 800; color: #FBBF24;">💎 엄선 3위 · 문해력 &amp; 하브루타 필독서</span>
                <div style="font-size: 0.96rem; font-weight: 800; color: #FFFFFF; margin: 0.25rem 0;">초등·유아 하브루타 질문독서 &amp; 과학·역사 탐구 도서</div>
                <p style="font-size: 0.84rem; color: #CBD5E1; margin: 0; line-height: 1.45;">주말 박물관·과학관 나들이 전후에 부모와 함께 읽으며 사고력을 확장하는 필독서입니다.</p>
              </div>
              <a href="https://click.linkprice.com/click.php?m=yes24&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=https%3A%2F%2Fwww.yes24.com%2FProduct%2FSearch%3Fdomain%3DALL%26query%3D%25ED%2595%2598%25EB%25B8%258C%25EB%25A3%25A8%25ED%2583%2580%2B%25EA%25B3%25BC%25ED%2595%2599" target="_blank" rel="noopener noreferrer" style="display: inline-flex; justify-content: center; align-items: center; padding: 0.6rem 0.9rem; border-radius: 10px; background: linear-gradient(135deg, #D97706, #EA580C); color: #FFFFFF; font-size: 0.85rem; font-weight: 800; text-decoration: none;">
                📚 YES24 하브루타·탐구 도서 보기 ↗
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
            return rc.renderCitations(['fine_motor_neuroscience', 'pedagogy_montessori_froebel', 'parent_child_interaction_museum'], 3, isGlobal);
          }
          return '';
        })()}

        <!-- Reference Archival Chip -->
        <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
          <a href="https://click.linkprice.com/click.php?m=yes24&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=https%3A%2F%2Fwww.yes24.com%2FProduct%2FSearch%3Fdomain%3DALL%26query%3D%25ED%2595%2598%25EB%25B8%258C%25EB%25A3%25A8%25ED%2583%2580%2B%25EA%25B3%25BC%25ED%2595%2599" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="reference-chip" 
             id="ref-chip-neuro"
             style="font-size: 12px; color: var(--text-secondary); border: 1px solid var(--theme-border); padding: 0.35rem 0.75rem; border-radius: 9999px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; background: var(--theme-surface-sub);">
            <span>📚</span>
            <span>${isGlobal ? '[Cognitive Tools & Books Archive Reference (Yes24) ↗]' : '[관련 도구·도서 아카이브 참고 ↗]'}</span>
          </a>
        </div>
      </div>
    `;

    return html;
  }

  // 8. Public Module Exports
  const NeuroCognitiveMatrix = {
    COGNITIVE_PILLARS,
    CORTICAL_GOLDEN_WINDOWS,
    HAVRUTA_QUESTIONS,
    EXPLORATION_SITES,
    calculateCognitiveScores,
    calculateRadarPoints,
    pointsToSvgPolygonPath,
    renderRadarSvg,
    getGoldenTimeInfo,
    renderNeuroSection
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeuroCognitiveMatrix;
  }
  if (typeof global !== 'undefined') {
    global.KidsFitNeuroCognitiveMatrix = NeuroCognitiveMatrix;
    global.TallerNeuroMatrix = NeuroCognitiveMatrix;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
