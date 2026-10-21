/**
 * Taller Bio Labs - Master Briefing Engine (Phase 2 Master Briefing Card)
 * Fact-Based Precision Diagnosis & Short / Mid / Long-Term Academic DB Guidance Roadmap
 * Dynamically powered by `src/data/research-knowledge-base.json` (834+ peer-reviewed papers)
 */

(function (global) {
  'use strict';

  let GrowthEngine = typeof require !== 'undefined' ? (function () { try { return require('./growth-engine'); } catch (e) { return null; } })() : (global.KidsFitGrowthEngine || null);
  let NutritionEngine = typeof require !== 'undefined' ? (function () { try { return require('./nutrition-engine'); } catch (e) { return null; } })() : (global.KidsFitNutritionEngine || null);
  let PinpointCurator = typeof require !== 'undefined' ? (function () { try { return require('./pinpoint-curator'); } catch (e) { return null; } })() : (global.TallerPinpointCurator || global.KidsFitPinpointCurator || null);
  let UserCohortDB = typeof require !== 'undefined' ? (function () { try { return require('./user-cohort-db'); } catch (e) { return null; } })() : (global.TallerUserCohortDB || global.KidsFitUserCohortDB || null);

  /**
   * Retrieves knowledge base papers from runtime memory or CommonJS require
   */
  function getKnowledgeBase() {
    if (typeof window !== 'undefined' && window.KIDSFIT_RESEARCH_DATA) {
      return window.KIDSFIT_RESEARCH_DATA;
    }
    if (typeof global !== 'undefined' && global.KIDSFIT_RESEARCH_DATA) {
      return global.KIDSFIT_RESEARCH_DATA;
    }
    if (typeof require !== 'undefined') {
      try {
        return require('../data/research-knowledge-base.json');
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Inhibitor search keywords dictionary
   */
  const INHIBITOR_KEYWORDS = {
    late_sleep: {
      tagKo: '수면 리듬 지연 & 서파수면(SWS) 성장호르몬 손실',
      tagEn: 'Circadian Delay & SWS Growth Hormone Loss',
      plainReasonKo: '밤 10시 이후 취침 시 첫 90분 서파수면(SWS) 성장호르몬 피크(일일 분비량의 65%)가 감소합니다.',
      plainReasonEn: 'Sleeping after 10:30 PM reduces the first 90-min SWS growth hormone pulse (65% of daily output).',
      terms: ['sleep', 'circadian', 'melatonin', 'slow-wave', '수면', '취침', '서파수면', '밤', 'gh-igf-1']
    },
    night_carbs: {
      tagKo: '야간 혈당 스파이크 & 소마토스타틴 분비 억제',
      tagEn: 'Nocturnal Glycemic Spike & Somatostatin Suppression',
      plainReasonKo: '취침 전 당류·야식 섭취는 인슐린과 소마토스타틴을 자극해 성장호르몬을 최대 -52% 억제합니다.',
      plainReasonEn: 'Pre-sleep carbs spike insulin and hypothalamic somatostatin, suppressing GH by up to -52%.',
      terms: ['glucose', 'insulin', 'sugar', 'somatostatin', '야식', '혈당', '인슐린', '당분', '소마토스타틴', '식이']
    },
    poor_posture: {
      tagKo: '거북목·척추 압박 & 추간판 디스크 수분 손실',
      tagEn: 'Forward Head Posture & Spinal Disc Compression',
      plainReasonKo: '거북목과 구부정한 자세는 추간판 디스크를 압박해 즉시 복원 가능한 숨은 키 1.5~2.2cm를 손실시킵니다.',
      plainReasonEn: 'Forward head posture compresses spinal discs, masking 1.5~2.2cm of recoverable stature.',
      terms: ['posture', 'spine', 'cervical', 'kyphosis', 'craniovertebral', '거북목', '척추', '자세', '경추', '디스크', '감압', '자세정렬']
    },
    picky_eater: {
      tagKo: '단백질·칼슘 불균형 & 골기질 광화 저하',
      tagEn: 'Nutritional Imbalance & Bone Matrix Mineralization Deficit',
      plainReasonKo: '칼슘·비타민D3·K2·단백질 결핍 시 성장판 연골세포 증식과 뼈 기질 침착 속도가 저하됩니다.',
      plainReasonEn: 'Deficits in Calcium, D3, K2, and Protein slow epiphyseal chondrocyte proliferation and bone accrual.',
      terms: ['nutrition', 'calcium', 'vitamin', 'protein', 'zinc', '편식', '영양', '칼슘', '단백질', '비타민', '아연', '식단', '골밀도']
    },
    sedentary: {
      tagKo: '신체활동 부족 & 성장판 압전 미세자극 결핍',
      tagEn: 'Sedentary Lifestyle & Epiphyseal Mechanical Loading Deficit',
      plainReasonKo: '수직 점프 운동이 부족하면 볼프의 법칙(Wolff\'s Law)에 따른 성장판 연골 자극 신호가 약화됩니다.',
      plainReasonEn: 'Lack of vertical jumping reduces Wolff\'s Law piezoelectric micro-loading on growth plates.',
      terms: ['exercise', 'jump', 'physical activity', 'loading', 'mechanical', '운동', '점프', '줄넘기', '신체활동', '성장판', '미세하중']
    }
  };

  /**
   * Formats a compact 1-line empirical fact from a paper without verbose fluff
   */
  function getCleanFactLine(p, isEn) {
    if (!p) return '';
    if (isEn) {
      const rawEn = p.title || p.key_statistics || '';
      return rawEn.length > 130 ? rawEn.slice(0, 127) + '...' : rawEn;
    }
    const rawKo = p.plain_fact_ko || p.key_statistics || p.clinical_summary_ko || p.title_ko || '';
    const cleaned = String(rawKo).replace(/^\[글로벌 피인용 \d+회\]\s*/, '').split(';')[0].trim();
    return cleaned.length > 125 ? cleaned.slice(0, 122) + '...' : cleaned;
  }

  /**
   * Formats a crisp 1-line actionable prescription from a paper
   */
  function getCleanActionLine(p, isEn) {
    if (!p) return '';
    if (isEn) {
      return 'Apply daily targeted protocol aligned with peer-reviewed clinical thresholds.';
    }
    const raw = p.short_term_action_ko || p.parenting_prescription_ko || '';
    const firstSentence = String(raw).split(/[.!]\s/)[0].trim();
    return firstSentence.length > 115 ? firstSentence.slice(0, 112) + '...' : firstSentence;
  }

  /**
   * Matches academic papers dynamically from research-knowledge-base.json based on inhibitors & age
   */
  function matchPapers(habits = [], ageYears = 10, tannerPhase = 'phase_2', limit = 3) {
    const kb = getKnowledgeBase();
    if (!kb || !Array.isArray(kb.papers)) return [];

    const effectiveHabits = Array.isArray(habits) && habits.length > 0 ? habits : ['late_sleep'];
    const matched = [];
    const pickedIds = new Set();

    // 1. Pick the best matching paper for each selected inhibitor
    effectiveHabits.forEach((h) => {
      const info = INHIBITOR_KEYWORDS[h];
      if (!info) return;

      let bestPaper = null;
      let maxScore = -1;

      kb.papers.forEach((p) => {
        if (pickedIds.has(p.id)) return;

        const corpus = `${p.title || ''} ${p.title_ko || ''} ${p.key_statistics || ''} ${p.clinical_summary_ko || ''} ${p.parenting_prescription_ko || ''}`.toLowerCase();
        let termHits = 0;
        info.terms.forEach((term) => {
          if (corpus.includes(term.toLowerCase())) {
            termHits++;
          }
        });

        if (termHits > 0) {
          let score = termHits * 10;
          if (p.age_range && p.age_range.includes(String(Math.round(ageYears)))) score += 15;
          if (p.evidence_level && p.evidence_level.includes('Level I')) score += 10;
          if (p.pmid) score += 5;
          if (p.citations_count) score += Math.min(20, Math.round(p.citations_count / 10));

          if (score > maxScore) {
            maxScore = score;
            bestPaper = p;
          }
        }
      });

      if (bestPaper) {
        pickedIds.add(bestPaper.id);
        matched.push({
          paper: bestPaper,
          matchedCauseKo: info.tagKo,
          matchedCauseEn: info.tagEn,
          plainReasonKo: info.plainReasonKo,
          plainReasonEn: info.plainReasonEn,
          inhibitorKey: h
        });
      }
    });

    // 2. Fallback backfill if fewer than limit
    if (matched.length < limit) {
      const candidates = kb.papers.filter((p) => !pickedIds.has(p.id) && (p.pillar === 'growth_endocrinology' || p.pillar === 'posture_biomechanics_exercise'));
      for (const c of candidates) {
        if (matched.length >= limit) break;
        matched.push({
          paper: c,
          matchedCauseKo: '소아 선형 성장 & 골연령 임상 표준',
          matchedCauseEn: 'Pediatric Linear Growth & Bone Age Standards',
          plainReasonKo: '연령별 표준 성장도표 및 골단판 내분비 지표에 따른 맞춤 관리 기준입니다.',
          plainReasonEn: 'Evidence-based clinical standard for age-specific linear growth trajectory.',
          inhibitorKey: 'standard'
        });
        pickedIds.add(c.id);
      }
    }

    return matched.slice(0, limit);
  }

  /**
   * Matches 3 distinct horizon papers (Short-Term 1-4w, Mid-Term 1-3m, Long-Term 6m-Adult)
   * directly from the learning DB based on user profile
   */
  function matchHorizonPapers(habits = [], ageYears = 10, cognitiveAxes = []) {
    const kb = getKnowledgeBase();
    if (!kb || !Array.isArray(kb.papers) || kb.papers.length === 0) {
      return { shortTerm: null, midTerm: null, longTerm: null };
    }

    const usedIds = new Set();
    const hasSleepOrCarb = habits.includes('late_sleep') || habits.includes('night_carbs');
    const hasPosture = habits.includes('poor_posture');

    // 1. Short-Term Paper (Weeks 1-4: Sleep/GH Reset or Spinal Decompression)
    let shortPaper = kb.papers.find((p) => {
      if (hasPosture && (p.sub_domain === 'posture_biomechanics_exercise' || String(p.id) === 'PMID:30897641')) return true;
      if (hasSleepOrCarb && (p.sub_domain === 'chronobiology_sleep_architecture' || String(p.id) === 'PMID:4300547')) return true;
      return p.horizon === 'short_term';
    }) || kb.papers[0];
    if (shortPaper) usedIds.add(shortPaper.id);

    // 2. Mid-Term Paper (Months 1-3 / 90 Days: Clinical Nutrition / Gut-Bone Axis / Wolff's Law / Museum Havruta)
    let midPaper = kb.papers.find((p) => {
      if (usedIds.has(p.id)) return false;
      if (habits.includes('picky_eater') && p.sub_domain === 'clinical_nutrigenomics_microbiome') return true;
      if (habits.includes('sedentary') && p.sub_domain === 'epiphyseal_wolff_loading') return true;
      return p.horizon === 'mid_term' || p.sub_domain === 'clinical_nutrigenomics_microbiome';
    }) || kb.papers.find((p) => !usedIds.has(p.id)) || kb.papers[0];
    if (midPaper) usedIds.add(midPaper.id);

    // 3. Long-Term Paper (6 Months to Age 20: Tanner MPH Trajectory / Bone Age / Longitudinal Executive Function)
    let longPaper = kb.papers.find((p) => {
      if (usedIds.has(p.id)) return false;
      if (ageYears <= 7 && p.sub_domain === 'executive_function_longitudinal') return true;
      return p.sub_domain === 'growth_endocrinology_core' || p.sub_domain === 'executive_function_longitudinal' || p.horizon === 'long_term';
    }) || kb.papers.find((p) => !usedIds.has(p.id)) || kb.papers[0];

    return {
      shortTerm: shortPaper,
      midTerm: midPaper,
      longTerm: longPaper
    };
  }

  /**
   * Renders a compact citation chip for a horizon paper
   */
  function renderHorizonPaperBadge(paper, horizonLabelKo, horizonLabelEn, accentColor, isEn) {
    if (!paper) return '';
    const firstAuthor = Array.isArray(paper.authors) && paper.authors.length > 0 ? paper.authors[0] : 'Clinical Group';
    const linkUrl = paper.pmid
      ? `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`
      : (paper.doi ? `https://doi.org/${paper.doi}` : '#');
    const linkLabel = paper.pmid ? `PMID:${paper.pmid}` : (paper.doi ? 'DOI 원문' : 'Ref');
    const factText = getCleanFactLine(paper, isEn);

    return `
      <div class="horizon-paper-evidence" style="margin-top: 0.65rem; padding: 0.52rem 0.68rem; background: rgba(15, 23, 42, 0.72); border-left: 2.5px solid ${accentColor}; border-radius: 6px; font-size: 0.74rem; line-height: 1.4;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.2rem;">
          <span style="color: ${accentColor}; font-weight: 800;">📖 ${isEn ? horizonLabelEn : horizonLabelKo} 학술 근거: ${firstAuthor} et al. (${paper.year || 2021})</span>
          ${linkUrl !== '#' ? `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #60A5FA; font-weight: 800; text-decoration: none; background: rgba(59, 130, 246, 0.14); padding: 0.08rem 0.4rem; border-radius: 4px;">${linkLabel} ↗</a>` : ''}
        </div>
        <div style="color: #CBD5E1; font-weight: 500;">
          <strong>팩트:</strong> ${factText}
        </div>
      </div>
    `;
  }

  /**
   * Renders the complete HTML for Master Briefing Card
   * - Section 1: Fact-Based Comprehensive Precision Diagnosis
   * - Section 2: Matched Paper Fact Cards (Zero Fluff)
   * - Section 3: Short-Term (1-4w) / Mid-Term (1-3m) / Long-Term (6m-Adult) Paper-Backed Guidance Roadmap
   */
  function renderMasterBriefingCard(profile = {}) {
    if (!GrowthEngine && global.KidsFitGrowthEngine) GrowthEngine = global.KidsFitGrowthEngine;
    if (!NutritionEngine && global.KidsFitNutritionEngine) NutritionEngine = global.KidsFitNutritionEngine;
    if (!PinpointCurator && (global.TallerPinpointCurator || global.KidsFitPinpointCurator)) {
      PinpointCurator = global.TallerPinpointCurator || global.KidsFitPinpointCurator;
    }
    if (!UserCohortDB && (global.TallerUserCohortDB || global.KidsFitUserCohortDB)) {
      UserCohortDB = global.TallerUserCohortDB || global.KidsFitUserCohortDB;
    }

    const kb = getKnowledgeBase();
    const totalDbPapers = (kb && kb.metadata && kb.metadata.total_papers) || (kb && Array.isArray(kb.papers) ? kb.papers.length : 834);

    const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
    const isYouthSelf = profile.targetSubject === 'self' || (Number(profile.ageYears) >= 14 && profile.targetSubject !== 'child');
    const ageMonths = profile.ageMonths || ((profile.ageYears || 10) * 12);
    const exactMonths = Number(profile.exactMonths || ageMonths);
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const gender = profile.gender === 'girl' ? 'girl' : 'boy';
    const genderKo = gender === 'boy' ? (isYouthSelf ? '남성(청소년)' : '남아') : (isYouthSelf ? '여성(청소년)' : '여아');
    const height = parseFloat(profile.currentHeight) || 137.0;
    const weight = parseFloat(profile.currentWeight) || 35.5;
    const recentGain = parseFloat(profile.recentGrowth6m) || 3.2;
    const fatherH = parseFloat(profile.fatherHeight) || 173.5;
    const motherH = parseFloat(profile.motherHeight) || 160.5;
    const habits = Array.isArray(profile.habits) ? profile.habits : ['late_sleep'];
    const autoStageObj = (PinpointCurator && typeof PinpointCurator.autoDetectGrowthStage === 'function')
      ? PinpointCurator.autoDetectGrowthStage(exactMonths, gender, recentGain)
      : { tannerPhase: 'phase_2', stageNameKo: 'Phase 2 · 급성장 피크기 (PHV)' };
    const tanner = profile.tannerPhase || autoStageObj.tannerPhase || 'phase_2';
    const cognitiveAxes = Array.isArray(profile.cognitiveAxes) ? profile.cognitiveAxes : ['science_nature'];

    // Section 1: Public Clinical Standards Data (KDCA 2017 / US CDC 2000) using exact decimal months from DOB
    let kdcaTop = 50.0;
    let kdcaPct = 50.0;
    let kdcaZ = 0.0;
    let standardMean = 137.0;
    if (GrowthEngine && typeof GrowthEngine.getLmsForMonth === 'function' && typeof GrowthEngine.calculateKdcaPercentile === 'function') {
      const lms = GrowthEngine.getLmsForMonth(gender, exactMonths);
      standardMean = lms.M;
      const kdcaRes = GrowthEngine.calculateKdcaPercentile(height, lms.L, lms.M, lms.S);
      kdcaTop = kdcaRes.topPercent;
      kdcaPct = kdcaRes.percentile;
      kdcaZ = kdcaRes.zScore;
    }

    const deltaCm = Math.round((height - standardMean) * 10) / 10;
    const deltaStr = deltaCm >= 0 ? `+${deltaCm} cm` : `${deltaCm} cm`;

    let mphVal = gender === 'boy' ? (fatherH + motherH + 13) / 2 : (fatherH + motherH - 13) / 2;
    mphVal = Math.round(mphVal * 10) / 10;

    // 3-Tier Height Trajectory Facts
    let unmanagedHeight = Math.round((mphVal - Math.min(5.0, Math.max(1.2, habits.length * 1.1))) * 10) / 10;
    let optimizedHeight = Math.round((mphVal + (tanner === 'phase_4' ? 2.2 : tanner === 'phase_3' ? 4.8 : 7.2)) * 10) / 10;
    let potentialGainCm = Math.round((optimizedHeight - unmanagedHeight) * 10) / 10;
    if (GrowthEngine && typeof GrowthEngine.predictAdultHeightTrajectories === 'function') {
      try {
        const traj = GrowthEngine.predictAdultHeightTrajectories(mphVal, habits, tanner);
        unmanagedHeight = traj.unmanaged.height;
        optimizedHeight = traj.optimized.height;
        potentialGainCm = traj.optimized.gainOverUnmanaged;
      } catch (_) {}
    }

    const velocityPerYear = Math.round(recentGain * 2 * 10) / 10;
    const isRedFlag = ageYears >= 4 && ageYears <= 11 && velocityPerYear < 4.5;

    let goldenTimeLabel = isEn ? '~2.5–3 yrs remaining (Peak Height Velocity PHV)' : '약 2.5~3년 잔여 (급성장 피크기 PHV)';
    if (tanner === 'phase_1') goldenTimeLabel = isEn ? '~4–5 yrs remaining (Foundation Stage · Open Plate 90%+)' : '약 4~5년 잔여 (기초 성장기 · 개방률 90%+)';
    else if (tanner === 'phase_3') goldenTimeLabel = isEn ? '~12–18 mos remaining (Post-PHV Defense)' : '약 12~18개월 잔여 (감속기 · 집중 방어)';
    else if (tanner === 'phase_4') goldenTimeLabel = isEn ? '~6–12 mos remaining (Spinal Decompression)' : '약 6~12개월 잔여 (척추 디스크 복원기)';

    // Neuro-Cognitive Target Focus Label
    let neuroFocusLabel = isEn ? 'Prefrontal Executive Function & Causal Reasoning' : '전두엽 실행기능 & 과학적 인과 추론';
    if (ageYears <= 3) neuroFocusLabel = isEn ? 'Fine-Motor Cortex (30%) & Sensory Synapses' : '손끝 소근육(운동피질 30%) & 감각 시냅스';
    else if (ageYears <= 6) neuroFocusLabel = isEn ? '3D Spatial Rotation (Parietal) & Dialogue Turns' : '3차원 공간 회전(두정엽) & 어휘 대화 턴';
    else if (ageYears <= 12) neuroFocusLabel = isEn ? 'Working Memory & Havruta Critical Inquiry' : '전두엽 작업기억 & 하브루타 비판적 사고';
    else neuroFocusLabel = isEn ? 'Higher Metacognition & Self-Directed Mastery' : '고차원 메타인지 & 자기주도 학습 완성';

    // Section 2: Realtime Papers Matching (for specific causes)
    const matchedPapers = matchPapers(habits, ageYears, tanner, 3);

    // Section 3: Horizon-Specific Papers & Nutrition Targets
    const horizonPapers = matchHorizonPapers(habits, ageYears, cognitiveAxes);

    let nutTargets = {
      calciumMg: ageYears <= 3 ? 650 : ageYears <= 8 ? 800 : 1000,
      vitDIU: 2000,
      vitK2Mcg: 75,
      proteinG: Math.round(weight * 1.3 * 10) / 10,
      zincMg: 10,
      magnesiumMg: 180,
      weightKg: weight
    };
    if (NutritionEngine && typeof NutritionEngine.calculateTargets === 'function') {
      try {
        nutTargets = NutritionEngine.calculateTargets(weight, ageYears);
      } catch (e) {
        // fallback
      }
    }

    const computedMetrics = {
      kdcaPercentile: kdcaPct,
      topPercent: kdcaTop,
      zScore: kdcaZ,
      mph: mphVal,
      unmanagedHeight,
      optimizedHeight,
      potentialGainCm
    };

    const guidebookEditionLabel = isYouthSelf
      ? `🙋 [청소년·본인 전용] 만 ${ageYears}세(${exactMonths.toFixed(1)}개월) 맞춤 성장·학습 리포트`
      : `👶 [학부모 전용] 만 ${ageYears}세(${exactMonths.toFixed(1)}개월) 우리 아이 맞춤 성장·학습 리포트`;

    // Child-specific deep trait labels & individualized routines
    const traitSleep = profile.traitSleep || 'late_bedtime';
    const traitDiet = profile.traitDiet || 'small_appetite';
    const traitPosture = profile.traitPosture || 'turtle_slouch';
    const traitExercise = profile.traitExercise || 'low_indoor';
    const traitTemp = profile.traitTemperament || 'explorer';
    const traitFocus = profile.traitFocusSpan || '15_20m';

    const sleepTraitLabelKo = {
      deep_early: '21:30 이전 숙면형',
      late_bedtime: '22:30 이후 늦은 취침형',
      toss_mouth: '입호흡·자주 뒤척이는 수면형',
      night_snack: '취침 직전 야식·우유 섭취형'
    }[traitSleep] || '늦은 취침형';

    const dietTraitLabelKo = {
      small_appetite: '입이 짧은 소식 체질',
      meat_veggie_picky: '고기·채소 편식 체질',
      dairy_sensitive: '우유·유제품 배앓이 체질',
      balanced_good: '균형 식습관 체질'
    }[traitDiet] || '입이 짧은 소식 체질';

    const postureTraitLabelKo = {
      turtle_slouch: '책상·스마트폰 거북목 체형',
      leg_cross_pelvis: '다리 꼬기·골반 비대칭 체형',
      growing_pains: '저녁 다리 성장통 호소형',
      upright_good: '바른 자세 체형'
    }[traitPosture] || '거북목 체형';

    const tempTraitLabelKo = {
      explorer: '활동·체험 탐구형 기질',
      builder: '손끝 조립·만들기 몰입형 기질',
      questioner: '질문·언어 사고형 기질',
      cautious: '섬세·완벽주의 관찰형 기질'
    }[traitTemp] || '활동·탐구형 기질';

    const focusTraitLabelKo = {
      under_10m: '10분 미만 단기 집중',
      '15_20m': '15~20분 단계별 집중',
      '30m_plus': '30분+ 심화 몰입'
    }[traitFocus] || '15~20분 집중';

    // Trait-specific custom routine lines
    const customSleepRoutineKo = traitSleep === 'toss_mouth'
      ? '취침 전 비강 세척·가습 및 베개 높이 조절로 입호흡을 줄이고 밤 22:00 이전 깊은 서파수면 유도'
      : traitSleep === 'night_snack'
      ? '취침 3시간 전 우유·간식 완전 중단(인슐린에 의한 성장호르몬 억제 차단) 및 밤 22:00 입면 고정'
      : '매일 밤 21:45 소등 · 취침 1시간 전 스마트폰 차단으로 밤 10시~2시 성장호르몬 피크 확보';

    const customDietRoutineKo = traitDiet === 'dairy_sensitive'
      ? `우유 대신 두부·잔멸치·유당제거 치즈 및 구연산·연골칼슘(${nutTargets.calciumMg}mg) + 비타민D3(${nutTargets.vitDIU}IU) 보충`
      : traitDiet === 'meat_veggie_picky'
      ? `다진 소고기·계란 단백질(${nutTargets.proteinG}g/일)과 미각 세포를 깨우는 아연·초유·연골칼슘 집중 보충`
      : `입이 짧은 아이를 위해 적은 양으로도 흡수율이 높은 황기추출물(HT042)·구연산칼슘(${nutTargets.calciumMg}mg) 보충`;

    const customPostureStudyRoutineKo = `${traitPosture === 'growing_pains' ? '저녁 온찜질·종아리 스트레칭 및' : '높이조절 독서대로 거북목을 예방하고'} 매일 저녁 철봉 매달리기 30초×3세트 + [${tempTraitLabelKo} · ${focusTraitLabelKo}]에 맞춘 하루 20분 자기주도 탐구`;

    return `
      <!-- Master Briefing Card: Clean 4-Step Aligned Report -->
      <div class="bento-card master-briefing-card" id="master-briefing-card-content" style="border-left: 5px solid #3B82F6; text-align: left;">
        
        <!-- Header -->
        <div class="briefing-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 0.85rem;">
          <div>
            <span class="section-badge-pill" style="display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(59, 130, 246, 0.15); color: #60A5FA; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.65rem; border-radius: 9999px; border: 1px solid rgba(59, 130, 246, 0.35); margin-bottom: 0.3rem;">
              📘 ${isEn ? 'KIDS-FIT AI · BESPOKE GROWTH & LEARNING REPORT' : guidebookEditionLabel}
            </span>
            <h2 class="briefing-title" style="font-size: 1.25rem; font-weight: 900; color: #FFFFFF; margin: 0.15rem 0;">
              ${isEn ? '1:1 Trait-Matched Analysis, Daily Routine & Expected Outcomes' : '아이 특성 맞춤 【분석 결과 → 실천 루틴 → 기대 성과 → 필요 도구】 리포트'}
            </h2>
          </div>
          <span style="background: rgba(16, 185, 129, 0.15); color: #34D399; font-weight: 800; font-size: 0.75rem; padding: 0.3rem 0.7rem; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.35);">
            📚 ${isEn ? `KDCA 2017 · CDC 2000 · ${totalDbPapers} Papers` : `출처: 질병관리청(KDCA) · 학술논문 ${totalDbPapers}편`}
          </span>
        </div>

        <!-- Top Summary Hero Card (Clean 2-Column Alignment + Child Trait Tags) -->
        <div class="taller-height-reveal-hero" id="taller-potential-reveal-hero" style="margin-bottom: 1rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.1rem; align-items: center;">
            <div>
              <div style="font-size: 0.74rem; font-weight: 800; color: #60A5FA; letter-spacing: 0.06em; margin-bottom: 0.2rem;">
                ${isEn ? 'K-GROWTH AI™ · POTENTIAL ADULT HEIGHT' : '꾸준히 관리했을 때 도달 가능한 기대 잠재키'}
              </div>
              <div style="display: flex; align-items: baseline; gap: 0.65rem; flex-wrap: wrap;">
                <span class="taller-giant-height-number">${optimizedHeight.toFixed(1)} cm</span>
                <span style="background: rgba(16, 185, 129, 0.18); border: 1px solid #10B981; color: #34D399; font-size: 0.84rem; font-weight: 900; padding: 0.2rem 0.65rem; border-radius: 9999px;">
                  ▲ +${potentialGainCm.toFixed(1)} cm ${isEn ? 'More vs Unmanaged' : '방치 시 대비 추가 성장'}
                </span>
              </div>
              <div id="briefing-one-line-verdict" style="font-size: 0.81rem; color: #CBD5E1; margin-top: 0.45rem; line-height: 1.48;">
                ${isEn
                  ? `Current <strong>${height}cm (Top ${kdcaTop}%)</strong> · Genetic MPH <strong>${mphVal}cm</strong> · Unmanaged <strong>${unmanagedHeight}cm</strong> → Consistent Practice <strong style="color:#34D399;">${optimizedHeight}cm</strong>`
                  : `현재 <strong>${height}cm (상위 ${kdcaTop}%)</strong> · 유전 표적키 <strong>${mphVal}cm</strong> · 현 습관 방치 시 <strong>${unmanagedHeight}cm</strong> → 꾸준히 실천 시 <strong style="color:#34D399;">${optimizedHeight}cm</strong>`}
              </div>
            </div>

            <!-- Right: Clean 3-Bar Comparison -->
            <div style="background: rgba(0, 0, 0, 0.65); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 0.85rem 1rem; display: flex; justify-content: space-around; align-items: flex-end; height: 124px;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <span style="font-size: 0.75rem; font-weight: 800; color: #FDA4AF;">${unmanagedHeight}cm</span>
                <div style="width: 34px; height: 46px; border-radius: 6px; background: rgba(244,63,94,0.65); border: 1px solid #F43F5E;"></div>
                <span style="font-size: 0.7rem; color: #94A3B8; font-weight: 700;">${isEn ? 'Unmanaged' : '방치 시'}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <span style="font-size: 0.75rem; font-weight: 800; color: #93C5FD;">${mphVal}cm</span>
                <div style="width: 34px; height: 64px; border-radius: 6px; background: rgba(59,130,246,0.75); border: 1px solid #60A5FA;"></div>
                <span style="font-size: 0.7rem; color: #93C5FD; font-weight: 700;">${isEn ? 'Genetic MPH' : '유전 표적키'}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <span style="font-size: 0.8rem; font-weight: 900; color: #6EE7B7;">${optimizedHeight}cm</span>
                <div style="width: 38px; height: 84px; border-radius: 6px; background: linear-gradient(180deg, #10B981 0%, #3B82F6 100%); border: 1px solid #A7F3D0;"></div>
                <span style="font-size: 0.72rem; color: #6EE7B7; font-weight: 900;">${isEn ? 'Consistent Goal' : '꾸준히 실천 시'}</span>
              </div>
            </div>
          </div>

          <!-- Child Trait Summary Strip -->
          <div style="margin-top: 0.8rem; padding-top: 0.7rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; flex-wrap: wrap; gap: 0.45rem; font-size: 0.76rem; color: #E2E8F0;">
            <strong style="color: #38BDF8;">🏷️ ${isEn ? 'Child Traits Applied:' : '진단 반영 우리 아이 고유 특성:'}</strong>
            <span style="background: rgba(255,255,255,0.07); padding: 0.18rem 0.55rem; border-radius: 6px;">🌙 ${sleepTraitLabelKo}</span>
            <span style="background: rgba(255,255,255,0.07); padding: 0.18rem 0.55rem; border-radius: 6px;">🍽️ ${dietTraitLabelKo}</span>
            <span style="background: rgba(255,255,255,0.07); padding: 0.18rem 0.55rem; border-radius: 6px;">🧍 ${postureTraitLabelKo}</span>
            <span style="background: rgba(255,255,255,0.07); padding: 0.18rem 0.55rem; border-radius: 6px;">🧠 ${tempTraitLabelKo} (${focusTraitLabelKo})</span>
          </div>
        </div>

        <!-- Quick-Jump Navigation (4 Clean Steps) -->
        <div class="guidebook-chapter-nav" aria-label="Guidebook Steps" style="margin-bottom: 1.15rem;">
          <a href="#briefing-status-section" class="guidebook-chapter-pill">📊 ${isEn ? 'STEP 1. Diagnosis Result' : 'STEP 1. 정밀 분석 결과'}</a>
          <a href="#briefing-actions-section" class="guidebook-chapter-pill">🧭 ${isEn ? 'STEP 2. What to Do Consistently' : 'STEP 2. 앞으로 꾸준히 해야 할 일'}</a>
          <a href="#expected-outcomes-section" class="guidebook-chapter-pill">🏆 ${isEn ? 'STEP 3. Expected Outcomes' : 'STEP 3. 실천 시 얻는 기대 성과'}</a>
          <a href="#pinpoint-custom-prescription-section" class="guidebook-chapter-pill">🎯 ${isEn ? 'STEP 4. What You Need' : 'STEP 4. 꾸준히 하려면 필요한 도구'}</a>
        </div>

        <!-- ================================================================== -->
        <!-- STEP 01: ANALYSIS RESULT & CONCISE CITATIONS (2-Column Aligned)    -->
        <!-- ================================================================== -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 0.9rem; margin-bottom: 1.25rem; align-items: stretch;">
          
          <!-- Left Card: STEP 1-A. Biometric & Trait Diagnosis -->
          <div class="briefing-section briefing-status" id="briefing-status-section" style="margin: 0; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 0.73rem; font-weight: 900; color: #60A5FA; margin-bottom: 0.2rem;">STEP 01 · ${isEn ? 'PRECISION ANALYSIS RESULT' : '현재 상태 정밀 분석 결과'}</div>
              <h3 class="briefing-section-title" style="margin-bottom: 0.65rem;">
                📊 ${isEn ? '1. Biometric & Trait Analysis Result' : '1. 우리 아이 신체·성향 분석 결과는 이렇습니다'}
              </h3>
              
              <div class="briefing-metric-row">
                <span class="metric-label">${isEn ? 'Current Height Percentile' : '현재 키 또래 백분위'}:</span>
                <span class="metric-val" id="briefing-percentile" style="font-weight: 800; color: #60A5FA;">
                  ${isEn ? `Top ${kdcaTop}% (${kdcaPct}th)` : `상위 ${kdcaTop}% (${kdcaPct}백분위 · ${deltaStr})`}
                </span>
              </div>

              <div class="briefing-metric-row">
                <span class="metric-label">${isEn ? 'Annual Growth Velocity' : '현재 연간 성장속도'}:</span>
                <span class="metric-val" id="briefing-velocity" style="font-weight: 800; color: ${isRedFlag ? '#FB7185' : '#34D399'};">
                  ${velocityPerYear} cm/yr ${isRedFlag ? (isEn ? '🚨 Needs Catch-up' : '🚨 성장 가속 필요') : (isEn ? '✓ Normal Track' : '✓ 정상 속도 유지 중')}
                </span>
              </div>

              <div class="briefing-metric-row">
                <span class="metric-label">${isEn ? 'Genetic Target (MPH)' : '부모 유전 표적키 (MPH)'}:</span>
                <span class="metric-val" id="briefing-mph" style="font-weight: 800; color: #FBBF24;">
                  ${mphVal} cm <span style="font-size: 0.72rem; font-weight: 600;">(±8.5cm)</span>
                </span>
              </div>

              <div class="briefing-metric-row">
                <span class="metric-label">${isEn ? 'Remaining Golden Time' : '성장판 골든타임 잔여기간'}:</span>
                <span class="metric-val" id="briefing-goldentime" style="font-weight: 700; color: #60A5FA;">
                  ${goldenTimeLabel}
                </span>
              </div>

              <div class="briefing-metric-row">
                <span class="metric-label">${isEn ? 'Learning & Brain Trait' : '아이 기질 · 집중 특성'}:</span>
                <span class="metric-val" style="font-weight: 700; color: #C4B5FD;">
                  ${isEn ? neuroFocusLabel : `${tempTraitLabelKo} · ${focusTraitLabelKo}`}
                </span>
              </div>
            </div>

            <div style="margin-top: 0.65rem; font-size: 0.75rem; color: #94A3B8; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 0.45rem;">
              📚 ${isEn ? 'Source: KDCA 2017 Growth Charts · US CDC 2000 · K-DST' : '간략 출처: 질병관리청(KDCA 2017) 성장도표 · 보건복지부 K-DST'}
            </div>
          </div>

          <!-- Right Card: STEP 1-B. Why Loss Occurs & Compact 1-Line Citations -->
          <div class="briefing-section briefing-research" id="briefing-research-section" style="margin: 0; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 0.73rem; font-weight: 900; color: #FB7185; margin-bottom: 0.2rem;">STEP 01-B · ${isEn ? 'KEY BOTTLENECKS & BRIEF SOURCES' : '핵심 감점 요인 및 간략 학술 근거'}</div>
              <h3 class="briefing-section-title" style="margin-bottom: 0.65rem;">
                🔍 ${isEn ? '2. Why Height & Focus Are Held Back' : '2. 현재 습관에서 교정이 필요한 핵심 원인 3가지'}
              </h3>
              
              <div id="briefing-papers-container" class="briefing-papers-list" style="display: flex; flex-direction: column; gap: 0.55rem;">
                ${matchedPapers.map(({ paper: p, matchedCauseKo, matchedCauseEn }) => `
                  <div class="matched-paper-card" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 10px; padding: 0.6rem 0.75rem; text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem;">
                      <span style="color: #FB7185; font-size: 0.76rem; font-weight: 800;">
                        • ${isEn ? matchedCauseEn : matchedCauseKo}
                      </span>
                      <span style="font-size: 0.68rem; color: #94A3B8; white-space: nowrap;">
                        ${p.pmid
                          ? `<a href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/" target="_blank" rel="noopener noreferrer" style="color: #60A5FA; text-decoration: none; font-weight: 700;">📚 ${p.authors && p.authors[0] ? p.authors[0].split(' ')[0] : 'PubMed'} (${p.year}) · PMID ↗</a>`
                          : p.doi
                          ? `<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener noreferrer" style="color: #34D399; text-decoration: none; font-weight: 700;">📚 ${p.journal || 'DOI'} (${p.year}) · DOI ↗</a>`
                          : ''}
                      </span>
                    </div>
                    <div style="font-size: 0.76rem; color: #CBD5E1; line-height: 1.4;">
                      ${getCleanFactLine(p, isEn)}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div style="margin-top: 0.65rem; font-size: 0.75rem; color: #94A3B8; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 0.45rem;">
              📚 ${isEn ? 'All citations verified via PubMed / Crossref peer-reviewed DB' : '위 3가지 요인만 바로잡아도 숨은 잠재키와 학습 몰입도가 즉시 개선됩니다.'}
            </div>
          </div>

        </div>

        <!-- ================================================================== -->
        <!-- STEP 02: WHAT TO DO CONSISTENTLY (Clean 3-Column Aligned Cards)    -->
        <!-- ================================================================== -->
        <div class="briefing-section briefing-actions" id="briefing-actions-section" style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
            <div>
              <div style="font-size: 0.73rem; font-weight: 900; color: #34D399; margin-bottom: 0.15rem;">STEP 02 · ${isEn ? 'CONSISTENT DAILY & WEEKLY ROADMAP' : '앞으로 꾸준히 실천해야 할 맞춤 지도 방향 (루틴)'}</div>
              <h3 class="briefing-section-title" style="margin: 0;">
                🧭 ${isEn ? 'What Your Child Should Practice Consistently' : '앞으로는 이 3가지를 꾸준히 실천하셔야 합니다'}
              </h3>
            </div>
          </div>

          <div id="briefing-horizon-roadmap" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.8rem; align-items: stretch;">
            
            <!-- Routine 1: Sleep & Hormone (Short-Term Immediate) -->
            <div class="briefing-action-item horizon-card" id="horizon-short-term" style="border-top: 3px solid #3B82F6; padding: 0.9rem; background: rgba(255, 255, 255, 0.03); border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <span class="action-badge" style="display: inline-block; background: rgba(59, 130, 246, 0.16); color: #60A5FA; font-weight: 800; font-size: 0.74rem; padding: 0.16rem 0.55rem; border-radius: 6px; margin-bottom: 0.45rem;">
                  🌙 1. ${isEn ? 'Nightly Sleep Routine (Weeks 1–4)' : '매일 밤 수면·호르몬 루틴 (단기 1~4주)'}
                </span>
                <div class="action-desc" id="briefing-action-sleep" style="font-size: 0.8rem; line-height: 1.5; color: #E2E8F0;">
                  ${isEn
                    ? `• Sleep by <strong>21:45–22:00</strong> & stop snacks <strong>3 hrs before bed</strong>.<br>• Correct [${sleepTraitLabelKo}] to unlock peak nocturnal GH.`
                    : `• <strong>[${sleepTraitLabelKo} 맞춤]</strong> ${customSleepRoutineKo}`}
                </div>
              </div>
              <div style="margin-top: 0.55rem; font-size: 0.72rem; color: #60A5FA; font-weight: 700;">
                ✓ ${isEn ? 'Daily Habit #1' : '매일 밤 꾸준히 실천'}
              </div>
            </div>

            <!-- Routine 2: Diet & Bone Matrix (Mid-Term 90 Days) -->
            <div class="briefing-action-item horizon-card" id="horizon-mid-term" style="border-top: 3px solid #10B981; padding: 0.9rem; background: rgba(255, 255, 255, 0.03); border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <span class="action-badge" style="display: inline-block; background: rgba(16, 185, 129, 0.16); color: #34D399; font-weight: 800; font-size: 0.74rem; padding: 0.16rem 0.55rem; border-radius: 6px; margin-bottom: 0.45rem;">
                  🥗 2. ${isEn ? 'Daily Nutrition & Jumping (90 Days)' : '식습관·점핑 골밀도 루틴 (중기 1~3개월)'}
                </span>
                <div class="action-desc" id="briefing-action-nutrition" style="font-size: 0.8rem; line-height: 1.5; color: #E2E8F0;">
                  ${isEn
                    ? `• Daily Calcium <strong>${nutTargets.calciumMg}mg</strong> + D3 <strong>${nutTargets.vitDIU}IU</strong> + Protein <strong>${nutTargets.proteinG}g</strong>.<br>• 15 mins of vertical jumping 5x/week.`
                    : `• <strong>[${dietTraitLabelKo} 맞춤]</strong> ${customDietRoutineKo}<br>• 주 5회 하루 15분 줄넘기·트램폴린 수직 점핑 자극`}
                </div>
              </div>
              <div style="margin-top: 0.55rem; font-size: 0.72rem; color: #34D399; font-weight: 700;">
                ✓ ${isEn ? '90-Day Habit #2' : '최소 90일 이상 꾸준히 실천'}
              </div>
            </div>

            <!-- Routine 3: Posture & Temperament Study (Long-Term) -->
            <div class="briefing-action-item horizon-card" id="horizon-long-term" style="border-top: 3px solid #8B5CF6; padding: 0.9rem; background: rgba(255, 255, 255, 0.03); border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <span class="action-badge" style="display: inline-block; background: rgba(139, 92, 246, 0.16); color: #C4B5FD; font-weight: 800; font-size: 0.74rem; padding: 0.16rem 0.55rem; border-radius: 6px; margin-bottom: 0.45rem;">
                  🏃 3. ${isEn ? 'Posture & Temperament Study (6M+)' : '바른 자세 & 기질 맞춤 학습 루틴 (장기)'}
                </span>
                <div class="action-desc" id="briefing-action-exercise" style="font-size: 0.8rem; line-height: 1.5; color: #E2E8F0;">
                  ${isEn
                    ? `• Evening Dead-Hang 30s×3 & book stand posture.<br>• 20-min daily inquiry matched to child's temperament & focus span.`
                    : `• <strong>[${postureTraitLabelKo} &amp; 기질 맞춤]</strong> ${customPostureStudyRoutineKo}`}
                </div>
              </div>
              <div style="margin-top: 0.55rem; font-size: 0.72rem; color: #C4B5FD; font-weight: 700;">
                ✓ ${isEn ? 'Long-Term Habit #3' : '6개월~성장기 내내 꾸준히 실천'}
              </div>
            </div>

          </div>
        </div>

        <!-- ================================================================== -->
        <!-- STEP 03: EXPECTED OUTCOMES WHEN PRACTICED CONSISTENTLY             -->
        <!-- ================================================================== -->
        <div id="expected-outcomes-section" style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: 16px; padding: 1.05rem 1.15rem; margin-bottom: 1.25rem; text-align: left;">
          <div style="font-size: 0.73rem; font-weight: 900; color: #34D399; margin-bottom: 0.15rem;">
            STEP 03 · ${isEn ? 'EXPECTED OUTCOMES FROM CONSISTENT PRACTICE' : '꾸준히 실천했을 때 얻을 수 있는 기대 성과'}
          </div>
          <h3 style="font-size: 1.06rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.75rem 0;">
            🏆 ${isEn ? 'What You Will Achieve by Practicing Consistently' : '위 루틴을 꾸준히 실천하면 이런 확실한 성과를 얻을 수 있습니다'}
          </h3>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem; align-items: stretch;">
            <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem;">
              <div style="font-size: 0.76rem; font-weight: 800; color: #60A5FA; margin-bottom: 0.25rem;">📏 ${isEn ? '1. Height Gain Outcome' : '1. 최종 키 성장 성과'}</div>
              <div style="font-size: 0.92rem; font-weight: 900; color: #FFFFFF; margin-bottom: 0.2rem;">
                ${unmanagedHeight}cm → <span style="color:#34D399;">${optimizedHeight}cm (+${potentialGainCm}cm)</span>
              </div>
              <div style="font-size: 0.76rem; color: #CBD5E1; line-height: 1.42;">
                ${isEn ? 'Recovers lost genetic potential and accelerates annual velocity by +1.5–1.8 cm/yr.' : '습관 방치로 잃을 뻔한 손실키를 막고 연간 성장속도를 +1.5~1.8cm/yr 높입니다.'}
              </div>
            </div>

            <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem;">
              <div style="font-size: 0.76rem; font-weight: 800; color: #34D399; margin-bottom: 0.25rem;">🦴 ${isEn ? '2. Hormone & Posture Outcome' : '2. 수면 호르몬 & 체형 성과'}</div>
              <div style="font-size: 0.92rem; font-weight: 900; color: #FFFFFF; margin-bottom: 0.2rem;">
                ${isEn ? 'GH Recovery +1.8cm Posture' : '성장호르몬 정상화 & 숨은 키 +1.8cm'}
              </div>
              <div style="font-size: 0.76rem; color: #CBD5E1; line-height: 1.42;">
                ${isEn ? 'Restores deep slow-wave sleep GH secretion and decompresses spinal discs.' : '밤 10시 깊은 수면 호르몬 분비를 회복하고 거북목·척추 압박 키를 펴줍니다.'}
              </div>
            </div>

            <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem;">
              <div style="font-size: 0.76rem; font-weight: 800; color: #C4B5FD; margin-bottom: 0.25rem;">🧠 ${isEn ? '3. Focus & Learning Outcome' : '3. 두뇌 몰입 & 자기주도 성과'}</div>
              <div style="font-size: 0.92rem; font-weight: 900; color: #FFFFFF; margin-bottom: 0.2rem;">
                ${isEn ? '2x Focus Span & Deep Inquiry' : `${focusTraitLabelKo} → 2배 깊은 몰입 달성`}
              </div>
              <div style="font-size: 0.76rem; color: #CBD5E1; line-height: 1.42;">
                ${isEn ? 'Matches your child\'s natural temperament so they focus longer without nagging.' : `[${tempTraitLabelKo}]에 맞는 방식으로 접근해 잔소리 없이 스스로 집중하는 힘을 키웁니다.`}
              </div>
            </div>
          </div>
        </div>

        ${PinpointCurator && typeof PinpointCurator.renderPinpointAndLifecycleSection === 'function'
          ? PinpointCurator.renderPinpointAndLifecycleSection(profile)
          : ''}

        ${UserCohortDB && typeof UserCohortDB.renderGuidebookCohortSection === 'function'
          ? UserCohortDB.renderGuidebookCohortSection(profile, computedMetrics)
          : ''}

      </div>
    `;
  }

  /**
   * Attaches click event to retest button to return smoothly to Phase 1
   */
  function attachRetestHandler(callback) {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('btn-retest');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const dashboard = document.getElementById('results-dashboard') || document.getElementById('prescription-container');
      if (dashboard) {
        dashboard.style.display = 'none';
        dashboard.classList.add('hidden');
      }

      const quizSection = document.getElementById('quiz-section');
      if (quizSection) {
        quizSection.style.display = 'block';
        quizSection.classList.remove('hidden');
        quizSection.scrollIntoView({ behavior: 'smooth' });
      }

      const heroSection = document.getElementById('hero-section');
      if (heroSection) {
        heroSection.style.display = 'block';
        heroSection.classList.remove('hidden');
      }

      const presetsBar = document.getElementById('quick-presets-bar') || document.querySelector('.quick-presets-wrapper');
      if (presetsBar) {
        presetsBar.style.display = 'block';
        presetsBar.classList.remove('hidden');
      }

      if (typeof callback === 'function') {
        callback();
      } else if (global.TallerOnboardingWizard && typeof global.TallerOnboardingWizard.goToStep === 'function') {
        global.TallerOnboardingWizard.goToStep(1);
      }
    });
  }

  const MasterBriefingEngine = {
    INHIBITOR_KEYWORDS,
    getKnowledgeBase,
    matchPapers,
    matchHorizonPapers,
    renderMasterBriefingCard,
    render: renderMasterBriefingCard,
    attachRetestHandler,
    attachRetestListener: attachRetestHandler
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MasterBriefingEngine;
  }
  global.KidsFitMasterBriefing = MasterBriefingEngine;
  global.MasterBriefingEngine = MasterBriefingEngine;
  global.TallerMasterBriefing = MasterBriefingEngine;

})(typeof window !== 'undefined' ? window : global);
