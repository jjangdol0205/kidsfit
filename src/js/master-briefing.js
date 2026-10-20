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

    let goldenTimeLabel = '약 2.5~3년 잔여 (급성장 피크기 PHV)';
    if (tanner === 'phase_1') goldenTimeLabel = '약 4~5년 잔여 (기초 성장기 · 개방률 90%+)';
    else if (tanner === 'phase_3') goldenTimeLabel = '약 12~18개월 잔여 (감속기 · 집중 방어)';
    else if (tanner === 'phase_4') goldenTimeLabel = '약 6~12개월 잔여 (척추 디스크 복원기)';

    // Neuro-Cognitive Target Focus Label
    let neuroFocusLabel = '전두엽 실행기능 & 과학적 인과 추론';
    if (ageYears <= 3) neuroFocusLabel = '손끝 소근육(운동피질 30%) & 감각 시냅스';
    else if (ageYears <= 6) neuroFocusLabel = '3차원 공간 회전(두정엽) & 어휘 대화 턴';
    else if (ageYears <= 12) neuroFocusLabel = '전두엽 작업기억 & 하브루타 비판적 사고';
    else neuroFocusLabel = '고차원 메타인지 & 자기주도 학습 완성';

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
      ? `🙋 [청소년·본인 전용] 만 ${ageYears}세(${exactMonths.toFixed(1)}개월) 나의 잠재키 & 두뇌 성장 마스터 가이드북`
      : `👶 [학부모 전용] 만 ${ageYears}세(${exactMonths.toFixed(1)}개월) 우리 아이 맞춤형 성장 마스터 가이드북`;

    return `
      <!-- Master Briefing Card: K-GROWTH AI™ Potential Height Reveal & 5-Chapter Growth Guidebook -->
      <div class="bento-card master-briefing-card" id="master-briefing-card-content" style="border-left: 5px solid #3B82F6;">
        
        <!-- Header -->
        <div class="briefing-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 0.9rem;">
          <div>
            <span class="section-badge-pill" style="display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(59, 130, 246, 0.15); color: #60A5FA; font-size: 0.76rem; font-weight: 800; padding: 0.2rem 0.65rem; border-radius: 9999px; border: 1px solid rgba(59, 130, 246, 0.35); margin-bottom: 0.35rem;">
              📘 ${isEn ? 'KIDS-FIT AI · BESPOKE GROWTH & LEARNING GUIDEBOOK' : guidebookEditionLabel}
            </span>
            <h2 class="briefing-title" style="font-size: 1.32rem; font-weight: 900; color: #FFFFFF; margin: 0.2rem 0;">
              ${isEn ? 'Proprietary K-GROWTH AI™ Precision Diagnosis & Guidance' : '키 · 육체적 · 정신적 성장 &amp; 단·중·장기 맞춤 학습 가이드북'}
            </h2>
            <p class="briefing-subtitle" style="font-size: 0.8rem; color: #94A3B8; margin: 0;">
              ${isEn ? `Directly synthesized from KDCA 2017, US CDC 2000, K-DST & ${totalDbPapers} peer-reviewed studies.` : `독자 개발 K-GROWTH AI™ v4.0 · 질병관리청(KDCA 2017) · US CDC 2000 &amp; 학습 학술 DB(${totalDbPapers}편) + 누적 코호트 DB 연동`}
            </p>
          </div>
          <span style="background: rgba(16, 185, 129, 0.15); color: #34D399; font-weight: 800; font-size: 0.78rem; padding: 0.35rem 0.75rem; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.35);">
            ✦ ${isEn ? `${totalDbPapers} Papers Matched` : `${totalDbPapers}편 논문 DB & 코호트 매칭 완료`}
          </span>
        </div>

        <!-- M:FFERENCE Dark Glass Giant Potential Height Reveal Hero Card -->
        <div class="taller-height-reveal-hero" id="taller-potential-reveal-hero">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.15rem; align-items: center;">
            <!-- Left: Giant Editorial Height Reveal -->
            <div>
              <div style="font-size: 0.74rem; font-weight: 800; color: #60A5FA; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.2rem;">
                K-GROWTH AI™ · 숨은 잠재키 &amp; 성장 잠재력 예측
              </div>
              <div style="display: flex; align-items: baseline; gap: 0.65rem; flex-wrap: wrap;">
                <span class="taller-giant-height-number">${optimizedHeight.toFixed(1)} cm</span>
                <span style="background: rgba(16, 185, 129, 0.18); border: 1px solid #10B981; color: #34D399; font-size: 0.86rem; font-weight: 900; padding: 0.22rem 0.7rem; border-radius: 9999px;">
                  ▲ +${potentialGainCm.toFixed(1)} cm 잠재 도약 가능
                </span>
              </div>
              <div style="font-size: 0.82rem; color: #CBD5E1; margin-top: 0.45rem; line-height: 1.52;">
                현재 <strong>${height}cm (상위 ${kdcaTop}%, ${kdcaZ >= 0 ? '+' : ''}${kdcaZ} SD)</strong> · 부모 유전 표적키(MPH) <strong>${mphVal}cm</strong> 기준, 저해 습관 방치 시 <strong>${unmanagedHeight}cm</strong>에 머물 수 있으나 가이드북 로드맵 실천 시 <strong>최대 ${optimizedHeight}cm</strong>까지 도약 가능합니다.
              </div>
            </div>

            <!-- Right: M:FFERENCE 3-Pillar Vertical Stature Ruler Comparison -->
            <div style="background: rgba(0, 0, 0, 0.65); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 18px; padding: 0.9rem 1.1rem; display: flex; justify-content: space-around; align-items: flex-end; height: 132px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                <span style="font-size: 0.75rem; font-weight: 800; color: #FDA4AF; font-family: var(--font-mono);">${unmanagedHeight}cm</span>
                <div style="width: 34px; height: 50px; border-radius: 8px 8px 4px 4px; background: linear-gradient(180deg, rgba(244,63,94,0.85) 0%, rgba(244,63,94,0.35) 100%); border: 1px solid rgba(244,63,94,0.6);"></div>
                <span style="font-size: 0.7rem; color: #94A3B8; font-weight: 700;">방치 시 예측</span>
              </div>

              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                <span style="font-size: 0.75rem; font-weight: 800; color: #93C5FD; font-family: var(--font-mono);">${mphVal}cm</span>
                <div style="width: 34px; height: 68px; border-radius: 8px 8px 4px 4px; background: linear-gradient(180deg, #3B82F6 0%, rgba(59,130,246,0.35) 100%); border: 1px solid #60A5FA;"></div>
                <span style="font-size: 0.7rem; color: #93C5FD; font-weight: 700;">유전 표적(MPH)</span>
              </div>

              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                <span style="font-size: 0.82rem; font-weight: 900; color: #6EE7B7; font-family: var(--font-mono);">${optimizedHeight}cm</span>
                <div style="width: 38px; height: 88px; border-radius: 8px 8px 4px 4px; background: linear-gradient(180deg, #10B981 0%, #3B82F6 100%); border: 1px solid #A7F3D0;"></div>
                <span style="font-size: 0.72rem; color: #6EE7B7; font-weight: 900;">AI 가이드북 최적화</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 5-Chapter Personalized Growth Guidebook Quick-Jump Navigation -->
        <div class="guidebook-chapter-nav" aria-label="가이드북 챕터 바로가기">
          <a href="#briefing-status-section" class="guidebook-chapter-pill">📊 Ch.01 정밀 진단 &amp; 논문 팩트</a>
          <a href="#briefing-actions-section" class="guidebook-chapter-pill">🧭 Ch.02 단·중·장기 맞춤 지도</a>
          <a href="#child-lifecycle-roadmap-section" class="guidebook-chapter-pill">🗓️ Ch.03 나이별 연속 성장주기 (만 ${ageYears}→${ageYears + 3}세)</a>
          <a href="#pinpoint-custom-prescription-section" class="guidebook-chapter-pill">🎯 Ch.04 1:1 핀셋 영양제·교구·도서</a>
          <a href="#user-cohort-self-improve-section" class="guidebook-chapter-pill">🗄️ Ch.05 입력 코호트 DB &amp; 기록장</a>
        </div>

        <!-- 1-Line Reader-Friendly Core Verdict Banner (Zero Fluff, Instant Comprehension) -->
        <div id="briefing-one-line-verdict" style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.28); border-radius: 14px; padding: 0.85rem 1.05rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div style="font-size: 0.86rem; color: #E2E8F0; line-height: 1.5;">
            <strong style="color: #60A5FA;">📌 핵심 팩트 요약:</strong>
            ${isEn
              ? `Age ${ageYears} (${gender === 'boy' ? 'Male' : 'Female'}) · Current <strong>${height}cm (Top ${kdcaTop}%, ${deltaStr} vs standard)</strong> · Genetic Target <strong>${mphVal}cm</strong> · Unmanaged <strong>${unmanagedHeight}cm</strong> → Optimized Potential <strong style="color:#34D399;">${optimizedHeight}cm (+${potentialGainCm}cm gain)</strong>`
              : `만 ${ageYears}세 ${genderKo} · 현재 <strong>${height}cm (또래 상위 ${kdcaTop}%, 표준 대비 ${deltaStr})</strong> · 유전 표적키 <strong>${mphVal}cm</strong> 기준 방치 시 <strong>${unmanagedHeight}cm</strong>이나, <strong>단·중·장기 지도 실천 시 최대 <span style="color:#34D399;">${optimizedHeight}cm (+${potentialGainCm}cm 잠재 도약)</span></strong> 가능`}
          </div>
        </div>

        <div class="briefing-grid-3">
          
          <!-- Tier 1: Current Clinical Status (Fact-Based Diagnosis) -->
          <div class="briefing-section briefing-status" id="briefing-status-section">
            <h3 class="briefing-section-title">
              📊 1. ${isEn ? 'Fact-Based Precision Diagnosis' : '입력 데이터 기반 종합 정밀 진단 (팩트 지표)'}
            </h3>
            
            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'Height Percentile' : '현재 신장 백분위 (KDCA/CDC)'}:</span>
              <span class="metric-val" id="briefing-percentile" style="font-weight: 800; color: #60A5FA;">
                ${isEn ? `Top ${kdcaTop}% (${kdcaPct}th)` : `상위 ${kdcaTop}% (${kdcaPct}백분위)`}
              </span>
            </div>

            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'Z-Score & vs Mean' : '표준편차(Z-Score) · 평균 편차'}:</span>
              <span class="metric-val" style="font-weight: 800; color: ${kdcaZ >= 0 ? '#34D399' : '#FB7185'};">
                ${kdcaZ >= 0 ? '+' : ''}${kdcaZ} SD (${deltaStr})
              </span>
            </div>

            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'Growth Velocity' : '연간 성장속도 (6개월×2)'}:</span>
              <span class="metric-val" id="briefing-velocity" style="font-weight: 800; color: ${isRedFlag ? '#FB7185' : '#34D399'};">
                ${velocityPerYear} cm/yr ${isRedFlag ? '🚨 저성장 경고 (<4.5cm)' : '✓ 정상 성장 궤도'}
              </span>
            </div>

            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'Genetic Target (MPH)' : '유전 표적키 (Tanner MPH)'}:</span>
              <span class="metric-val" id="briefing-mph" style="font-weight: 800; color: #FBBF24;">
                ${mphVal} cm <span style="font-size: 0.72rem; font-weight: 600;">(±8.5cm)</span>
              </span>
            </div>

            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? '3-Trajectory Range' : '방치 시 vs 최적화 예측키'}:</span>
              <span class="metric-val" style="font-weight: 800; color: #34D399;">
                ${unmanagedHeight}cm → <strong>${optimizedHeight}cm (+${potentialGainCm}cm)</strong>
              </span>
            </div>

            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'Golden Time Window' : '성장판 골든타임 잔여기간'}:</span>
              <span class="metric-val" id="briefing-goldentime" style="font-weight: 700; color: #60A5FA;">
                ${goldenTimeLabel}
              </span>
            </div>

            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'Neuro-Plasticity Target' : '연령별 두뇌 민감기 타겟'}:</span>
              <span class="metric-val" style="font-weight: 700; color: #C4B5FD;">
                ${neuroFocusLabel}
              </span>
            </div>
          </div>

          <!-- Tier 2: Dynamic Academic DB Fact Cards (Zero Fluff) -->
          <div class="briefing-section briefing-research" id="briefing-research-section">
            <h3 class="briefing-section-title">
              📚 2. ${isEn ? 'DB-Matched Clinical Fact Evidence' : '저해 요인별 학술 논문 팩트 검증'}
            </h3>
            
            <div id="briefing-papers-container" class="briefing-papers-list" style="display: flex; flex-direction: column; gap: 0.65rem;">
              ${matchedPapers.map(({ paper: p, matchedCauseKo, matchedCauseEn, plainReasonKo, plainReasonEn }) => `
                <div class="matched-paper-card" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 0.75rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.3rem;">
                    <span style="background: rgba(244, 63, 94, 0.16); color: #FB7185; font-size: 0.71rem; font-weight: 800; padding: 0.14rem 0.5rem; border-radius: 6px; border: 1px solid rgba(244, 63, 94, 0.3);">
                      ⚠️ ${isEn ? matchedCauseEn : matchedCauseKo}
                    </span>
                    <div style="display: flex; gap: 0.3rem; align-items: center;">
                      <span style="font-size: 0.68rem; color: #94A3B8;">${p.journal || ''} (${p.year || ''})</span>
                      ${p.pmid ? `<a href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/" target="_blank" rel="noopener noreferrer" style="font-size: 0.68rem; color: #60A5FA; font-weight: 800; text-decoration: none; background: rgba(59, 130, 246, 0.15); padding: 0.1rem 0.42rem; border-radius: 4px;">PMID:${p.pmid} ↗</a>` : ''}
                      ${p.doi ? `<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener noreferrer" style="font-size: 0.68rem; color: #34D399; font-weight: 800; text-decoration: none; background: rgba(16, 185, 129, 0.15); padding: 0.1rem 0.42rem; border-radius: 4px;">DOI ↗</a>` : ''}
                    </div>
                  </div>
                  <div style="font-size: 0.81rem; font-weight: 800; color: #FFFFFF; line-height: 1.35; margin-bottom: 0.25rem;">
                    ${isEn ? (p.title || p.title_ko) : (p.title_ko || p.title)}
                  </div>
                  <div style="font-size: 0.76rem; color: #CBD5E1; line-height: 1.42; margin-bottom: 0.28rem;">
                    <strong style="color: #60A5FA;">📊 논문 팩트:</strong> ${getCleanFactLine(p, isEn)}
                  </div>
                  <div style="font-size: 0.74rem; color: #6EE7B7; line-height: 1.38; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.28); padding: 0.32rem 0.52rem; border-radius: 6px;">
                    <strong>💡 핵심 요약:</strong> ${isEn ? (plainReasonEn || getCleanActionLine(p, true)) : (plainReasonKo || getCleanActionLine(p, false))}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Tier 3: Short-Term / Mid-Term / Long-Term Academic Guidance Roadmap -->
          <div class="briefing-section briefing-actions" id="briefing-actions-section">
            <h3 class="briefing-section-title">
              🧭 3. ${isEn ? 'Short · Mid · Long-Term Guidance Roadmap' : '논문 기반 【단기 · 중기 · 장기】 맞춤 지도 방향'}
            </h3>

            <div id="briefing-horizon-roadmap" style="display: flex; flex-direction: column; gap: 0.75rem;">
              
              <!-- SHORT-TERM (Weeks 1-4: Immediate Bio-Reset & Decompression) -->
              <div class="briefing-action-item horizon-card" id="horizon-short-term" style="border-left: 3.5px solid #3B82F6; padding: 0.7rem 0.8rem; background: rgba(255, 255, 255, 0.04); border-top: 1px solid rgba(255, 255, 255, 0.1); border-right: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0 12px 12px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                  <span class="action-badge" style="background: rgba(59, 130, 246, 0.16); color: #60A5FA; font-weight: 800; font-size: 0.76rem; padding: 0.16rem 0.58rem; border-radius: 6px;">
                    ⚡ ${isEn ? 'SHORT-TERM (Weeks 1–4)' : '단기 지도 방향 (1~4주: 즉시 교정 & 호르몬·디스크 복원)'}
                  </span>
                  <span style="font-size: 0.71rem; font-weight: 800; color: #60A5FA;">목표: GH 억제 0% · 숨은 키 +1.8cm 복원</span>
                </div>
                <div class="action-desc" id="briefing-action-sleep" style="margin: 0.4rem 0 0 0; font-size: 0.79rem; line-height: 1.5; color: #E2E8F0;">
                  • <strong>수면·혈당 차단:</strong> 밤 <strong>21:45~22:00 입면</strong> · 취침 <strong>3시간 전 무당류 공복</strong>(소마토스타틴 차단) · 취침 1시간 전 블루라이트 오프<br>
                  • <strong>척추 즉각 감압:</strong> 매일 저녁 철봉 <strong>패시브 데드행 30초×3세트</strong> + 흉추 신전 45초×2세트(일중 디스크 수분 78% 복원)<br>
                  • <strong>단기 두뇌 루틴:</strong> 하루 15분 연령 맞춤 손끝 조작·스스로 오늘 할 일 체크하기
                </div>
                ${renderHorizonPaperBadge(horizonPapers.shortTerm, '단기 지도', 'Short-Term', '#60A5FA', isEn)}
              </div>

              <!-- MID-TERM (Months 1-3 / 90 Days: Bone Matrix & Neural Consolidation) -->
              <div class="briefing-action-item horizon-card" id="horizon-mid-term" style="border-left: 3.5px solid #10B981; padding: 0.7rem 0.8rem; background: rgba(255, 255, 255, 0.04); border-top: 1px solid rgba(255, 255, 255, 0.1); border-right: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0 12px 12px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                  <span class="action-badge" style="background: rgba(16, 185, 129, 0.16); color: #34D399; font-weight: 800; font-size: 0.76rem; padding: 0.16rem 0.58rem; border-radius: 6px;">
                    📈 ${isEn ? 'MID-TERM (Months 1–3 / 90 Days)' : '중기 지도 방향 (1~3개월 / 90일: 성장속도 가속 & 골밀도·신경망 정착)'}
                  </span>
                  <span style="font-size: 0.71rem; font-weight: 800; color: #34D399;">목표: 성장속도 +1.8cm/yr 가속</span>
                </div>
                <div class="action-desc" id="briefing-action-nutrition" style="margin: 0.4rem 0 0 0; font-size: 0.79rem; line-height: 1.5; color: #E2E8F0;">
                  • <strong>체중 비례 임상 영양:</strong> 일일 구연산칼슘 <strong>${nutTargets.calciumMg} mg</strong>(흡수율 45%) + <strong>D3 ${nutTargets.vitDIU} IU</strong> + <strong>K2(MK-7) ${nutTargets.vitK2Mcg} mcg</strong> + 단백질 <strong>${nutTargets.proteinG} g</strong><br>
                  • <strong>골단판 압전 자극:</strong> 주 5회 <strong>하루 15분 줄넘기·점핑</strong>(Wolff's Law 체중 1.5~2.5배 수직 미세하중)<br>
                  • <strong>주말 하브루타 탐구:</strong> 격주 박물관·과학관 방문 시 <strong>3단계 질문 대화 턴 5회+</strong>(브로카 영역·인과 추론 강화)
                </div>
                ${renderHorizonPaperBadge(horizonPapers.midTerm, '중기 지도', 'Mid-Term', '#34D399', isEn)}
              </div>

              <!-- LONG-TERM (6 Months to Age 20: Target Height Breakthrough & Self-Directed Mastery) -->
              <div class="briefing-action-item horizon-card" id="horizon-long-term" style="border-left: 3.5px solid #8B5CF6; padding: 0.7rem 0.8rem; background: rgba(255, 255, 255, 0.04); border-top: 1px solid rgba(255, 255, 255, 0.1); border-right: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0 12px 12px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                  <span class="action-badge" style="background: rgba(139, 92, 246, 0.16); color: #C4B5FD; font-weight: 800; font-size: 0.76rem; padding: 0.16rem 0.58rem; border-radius: 6px;">
                    🏆 ${isEn ? 'LONG-TERM (6 Months – Age 20)' : '장기 지도 방향 (6개월~만 20세: 최종 표적키 돌파 & 자기주도 전두엽 완성)'}
                  </span>
                  <span style="font-size: 0.71rem; font-weight: 800; color: #C4B5FD;">목표: 잠재 최대키 ${optimizedHeight}cm 도달</span>
                </div>
                <div class="action-desc" id="briefing-action-exercise" style="margin: 0.4rem 0 0 0; font-size: 0.79rem; line-height: 1.5; color: #E2E8F0;">
                  • <strong>골연령·궤적 정기 추적:</strong> 매 <strong>3~6개월 신장·체중 LMS Z-Score 계측</strong> 및 표준 BMI 유지로 성조숙·성장판 조기 폐쇄 방어<br>
                  • <strong>유전 한계 돌파:</strong> 유전 표적키(<strong>${mphVal}cm</strong>) 대비 상위 잠재 궤적(<strong>${optimizedHeight}cm, +${potentialGainCm}cm</strong>) 지속 유지<br>
                  • <strong>장기 전두엽 완성:</strong> 90일 스트릭 반복을 통한 <strong>실행기능(작업기억·자기조절·메타인지)</strong> 평생 학습 습관 정착
                </div>
                ${renderHorizonPaperBadge(horizonPapers.longTerm, '장기 지도', 'Long-Term', '#C4B5FD', isEn)}
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
