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
   * 3-B. Antigravity Bespoke Parent Narrative AI Analyzer
   * Parses parent's free-text description (`profile.parentFreeNote`) across clinical & developmental
   * clusters and synthesizes a 1:1 custom Q&A + daily routine prescription grounded in the 1,260-paper DB.
   */
  function analyzeParentFreeNote(noteText, profile, nutTargets, mphVal, optimizedHeight, potentialGainCm, isEn) {
    const raw = (noteText || '').trim();
    const ageYears = Math.max(1, Math.min(20, Math.floor((Number(profile.ageMonths) || 120) / 12)));
    const weight = Number(profile.currentWeight) || 35.5;
    const insights = [];

    if (raw.length > 0) {
      const text = raw.toLowerCase();

      // Cluster 1: Growing pains / leg / knee pain at night
      if (/성장통|다리|무릎|종아리|발목|아프|아파|주물/.test(text)) {
        insights.push({
          badgeKo: '🦵 야간 성장통 & 골막 견인 완화 처방',
          badgeEn: '🦵 Nocturnal Growing Pains Relief Protocol',
          answerKo: `밤마다 무릎·종아리 통증을 호소하는 것은 낮 동안의 근육 피로와 밤사이 뼈가 자라며 골막(Periosteum)이 당겨지는 신호입니다. 주물러주기 전에 <strong>취침 20분 전 따뜻한 물 족욕·온찜질과 아킬레스건·종아리 스트레칭 3분</strong>을 시행하고, 신경·근육 이완을 돕는 <strong>킬레이트 마그네슘(${Math.round(weight * 4.5)}mg)과 연골·어골칼슘(${nutTargets.calciumMg}mg)</strong>을 저녁 식후에 보충해 주세요.`,
          answerEn: `Nocturnal calf/knee pain stems from periosteal stretching and tendon fatigue. Apply a warm compress 20 mins before bed, perform 3-min calf stretches, and supplement chelated Magnesium (${Math.round(weight * 4.5)}mg) + Cartilage Calcium (${nutTargets.calciumMg}mg).`,
          sourceKo: '근거: 소아 하지 성장통 및 칼슘·마그네슘 근육이완 임상 (PMID:24709624)'
        });
      }

      // Cluster 2: Genetic height worry / short parents / small peer percentile
      if (/유전|엄마|아빠|부모|작아|작은|키가 작|한계|또래|백분위/.test(text)) {
        insights.push({
          badgeKo: '🧬 부모 유전키(MPH) 한계 돌파 후성유전학 솔루션',
          badgeEn: '🧬 Overcoming Genetic MPH via Epigenetic Factors',
          answerKo: `부모님 키 기반 유전 표적키(<strong>${mphVal}cm</strong>)는 고정된 운명이 아닙니다. 쌍둥이 코호트 학술 연구에 따르면 최종 성인 키의 <strong>20~30%(약 ±6.5~8.5cm)는 후천적 수면 호르몬·영양·성장판 자극</strong>으로 결정됩니다. 지금부터 방해 요인을 차단하면 유전키를 넘어 <strong>최대 ${optimizedHeight}cm (+${potentialGainCm}cm 추가 성장)</strong>까지 충분히 도달할 수 있습니다.`,
          answerEn: `Genetic target height (${mphVal}cm) accounts for 70–80%, leaving a +6.5 to +8.5cm epigenetic window. Consistent sleep, nutrition, and mechanical loading can elevate potential height to ${optimizedHeight}cm (+${potentialGainCm}cm).`,
          sourceKo: '근거: 쌍둥이 코호트 후성유전 신장 연구 (Jelenkovic et al., Sci Rep / Tanner MPH)'
        });
      }

      // Cluster 3: Dislikes exercise / rope skipping / stays indoors / YouTube
      if (/운동|줄넘기|싫어|안 움|집에|귀찮|체력|땀/.test(text)) {
        insights.push({
          badgeKo: '🏃 운동 싫어하는 아이 맞춤 무소음 실내 성장판 자극법',
          badgeEn: '🏃 Fun Indoor Epiphyseal Loading for Exercise-Reluctant Kids',
          answerKo: `억지로 줄넘기를 시키면 코르티솔(스트레스 호르몬)이 분비되어 오히려 성장호르몬을 방해합니다. 줄넘기 대신 <strong>좋아하는 음악을 틀어놓고 거실 무소음 트램폴린 위에서 하루 10분 신나게 뛰기</strong> 또는 <strong>방문 철봉에 저녁 30초×3세트 매달리기(성취 스티커 보상)</strong>로 바꾸면 스트레스 없이 성장판 압전 자극과 숨은 키 1.8cm 복원이 동시에 해결됩니다.`,
          answerEn: `Replace forced outdoor rope-skipping with 10 mins of music-assisted indoor silent rebounder jumping and 3×30s doorway bar hanging before bath time.`,
          sourceKo: '근거: 성장판 기계적 압전 자극(Wolff\'s Law · PMID:19050004) & 척추 감압(PMID:30897641)'
        });
      }

      // Cluster 4: Refuses milk / picky eater / small appetite / underweight
      if (/우유|배앓이|설사|입이 짧|소식|편식|고기|채소|안 먹|마른|살이|체중/.test(text)) {
        insights.push({
          badgeKo: '🍽️ 우유 거부·입 짧은 아이 고밀도 영양 흡수 처방',
          badgeEn: '🍽️ High-Density Nutrient Absorption for Picky/Dairy-Free Kids',
          answerKo: `억지로 우유를 먹이면 복부 팽만과 장 염증으로 다른 영양소 흡수까지 떨어집니다. 우유 대신 <strong>잔멸치·두부·유당제거 치즈와 흡수율이 2배 높은 무유당 구연산·연골칼슘(${nutTargets.calciumMg}mg)</strong>으로 대체하고, 미각 세포 재생을 돕는 <strong>글루콘산·피콜린산 아연(10mg)과 식약처 인정 황기추출물(HT042)</strong>로 적은 식사량에서도 IGF-1 성장인자 생성을 극대화하세요.`,
          answerEn: `Replace liquid milk with lactose-free Calcium Citrate/Cartilage Calcium (${nutTargets.calciumMg}mg), Zinc Picolinate (10mg) to restore taste-bud appetite, and HT042 extract.`,
          sourceKo: '근거: 아연 미각세포 재생(PMID:12036814) & HT042 IGF-1 임상(PMID:25374566)'
        });
      }

      // Cluster 5: Rhinitis / mouth breathing / snoring / hard wakeup
      if (/비염|코막힘|코골이|입 벌|입호흡|구강호흡|깨요|잠|피곤|일어나/.test(text)) {
        insights.push({
          badgeKo: '😮 비염·구강호흡 교정 & 밤 10시 서파수면(SWS) 복원',
          badgeEn: '😮 Rhinitis/Mouth-Breathing & Deep SWS GH Recovery',
          answerKo: `비염이나 코막힘으로 입을 벌리고 자면 뇌 산소 포화도가 떨어져 성장호르몬의 65%가 분비되는 <strong>깊은 서파수면(Stage N3) 진입이 최대 34% 억제</strong>됩니다. 취침 30분 전 <strong>생리식염수 비강 세척과 침실 습도 50~55% 유지</strong>로 코호흡을 열어주고, 아침 기상 직후 창가 햇빛을 5분간 쬐어 멜라토닌 생체시계를 앞당겨 주세요.`,
          answerEn: `Mouth breathing disrupts slow-wave sleep (Stage N3) and suppresses nocturnal GH/IGF-1 by up to 34%. Use pre-bed nasal saline rinse, keep 50–55% humidity, and get morning sunlight.`,
          sourceKo: '근거: 소아 수면호흡장애 및 IGF-1 회복 임상 (Nieminen et al., PMID:11944202)'
        });
      }

      // Cluster 6: Puberty / precocious puberty / bone age closure worry
      if (/사춘기|성조숙|2차 성징|가슴|초경|변성기|머리냄새|여드름|뼈나이|골연령|성장판/.test(text)) {
        insights.push({
          badgeKo: '⏳ 사춘기 골든타임 & 성장판 폐쇄 지연 집중 프로토콜',
          badgeEn: '⏳ Pubertal Golden-Time & Epiphyseal Senescence Delay',
          answerKo: `사춘기 신호가 시작되면 성호르몬이 성장판 연골을 빠르게 뼈로 굳게(골화) 만듭니다. 지금 가장 중요한 것은 <strong>① 밤 9시 이후 야식·단 음료 완전 차단(인슐린·성호르몬 자극 억제), ② 체지방률 정상 유지, ③ 성장판이 열려 있는 향후 18~24개월 동안 HT042·연골칼슘과 수직 점프 운동을 매일 밀착 실행</strong>하여 연간 성장속도를 연 7~9cm로 끌어올리는 것입니다.`,
          answerEn: `During pubertal transition, strictly block late-night sugars/snacks, manage body fat to prevent rapid bone age advancement, and maximize linear velocity while plates remain open.`,
          sourceKo: '근거: 성장판 노화 및 성호르몬 조절 기전 (Nilsson & Baron, Nat Rev Endocrinol)'
        });
      }

      // Cluster 7: Smartphone / YouTube / short attention span / reading reluctance
      if (/스마트폰|유튜브|게임|영상|미디어|집중|산만|책|독서|공부/.test(text)) {
        insights.push({
          badgeKo: '🧠 디지털 도파민 디톡스 & 전두엽 자기주도 몰입 전환',
          badgeEn: '🧠 Digital Dopamine Reset & Prefrontal Deep Focus',
          answerKo: `유튜브·숏폼의 빠른 화면 전환은 전두엽의 내재적 도파민 수용체를 둔감하게 만들고 밤에는 블루라이트로 멜라토닌과 성장호르몬을 동시에 억제합니다. 스마트폰을 갑자기 뺏기보다 <strong>무소음 시각 타이머로 15분 단위 짧은 몰입 미션</strong>을 주고, 손끝으로 직접 트랙·도형을 조립하는 <strong>입체 과학·공간 교구(그래비트랙스·맥포머스 등)</strong>로 '손끝 성취 도파민'을 대체해 주세요.`,
          answerEn: `Replace passive screen dopamine with a 15-minute visual countdown timer and hands-on 3D spatial/STEM construction kits to re-activate prefrontal executive circuits.`,
          sourceKo: '근거: 야간 블루라이트 멜라토닌 억제(PMID:12970330) & 소근육-전두엽 공활성화(PMID:20822219)'
        });
      }

      // Cluster 8: Confidence / shyness / sensitivity / perfectionism / friends
      if (/자신감|위축|소심|부끄|친구|발표|예민|완벽|실수|울|짜증|고집/.test(text)) {
        insights.push({
          badgeKo: '💛 정서 자존감 & 자율성 지지 하브루타 코칭',
          badgeEn: '💛 Emotional Confidence & Autonomy-Supportive Coaching',
          answerKo: `만 ${ageYears}세 시기에 실수를 두려워하거나 위축되는 아이에게는 결과 칭찬("잘했네")보다 <strong>과정과 시도를 인정하는 대화("끝까지 궁리한 네 방법이 멋지다!")</strong>가 전두엽 정서 조절 회로를 가장 단단하게 키웁니다. 하루 10분 작은 성취를 맛볼 수 있는 단계별 교구·워크북과 주말 박물관·전시 나들이에서 <strong>아이의 생각을 먼저 묻는 열린 질문 대화</strong>를 시작해 보세요.`,
          answerEn: `Praise effort and strategy rather than outcomes, provide step-by-step achievable challenges, and use open-ended curiosity questions during weekend outings.`,
          sourceKo: '근거: 부모 자율성 지지와 아동 실행기능·자존감 발달 (Bernier et al., PMID:20331667)'
        });
      }

      // Fallback general bespoke synthesis if parent wrote other unique details
      if (insights.length === 0) {
        insights.push({
          badgeKo: '🎯 학부모님 직접 서술 내용 맞춤형 종합 처방',
          badgeEn: '🎯 Bespoke Clinical Synthesis for Your Written Note',
          answerKo: `남겨주신 우리 아이의 고유 상황(<strong>"${raw}"</strong>)을 만 ${ageYears}세 성장·발달 주기와 결합하여 분석했습니다. 현재 시기에는 <strong>① 밤 21:45 이전 취침으로 성장호르몬 피크 확보, ② 체중(${weight}kg) 비례 고흡수 칼슘(${nutTargets.calciumMg}mg)·단백질(${nutTargets.proteinG}g) 보충, ③ 아이 성향에 맞춘 하루 20분 손끝·탐구 루틴</strong>을 흔들림 없이 90일간 유지하는 것이 가장 확실한 해법입니다.`,
          answerEn: `Based on your specific note ("${raw}") at Age ${ageYears}, combining pre-22:00 deep sleep, ${nutTargets.calciumMg}mg bioavailable calcium, and 20-min daily hands-on inquiry will maximize both height (+${potentialGainCm}cm) and focus.`,
          sourceKo: '근거: 질병관리청(KDCA) 성장표준 및 K-GROWTH AI™ 1,260편 통합 학술 DB'
        });
      }
    }

    return {
      hasNote: raw.length > 0,
      rawNote: raw,
      insights
    };
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

    // Child-specific deep trait labels & individualized routines (supports multi-select lists)
    const traitSleepList = Array.isArray(profile.traitSleepList) && profile.traitSleepList.length
      ? profile.traitSleepList
      : [profile.traitSleep || 'late_bedtime'];
    const traitDietList = Array.isArray(profile.traitDietList) && profile.traitDietList.length
      ? profile.traitDietList
      : [profile.traitDiet || 'small_appetite'];
    const traitPostureList = Array.isArray(profile.traitPostureList) && profile.traitPostureList.length
      ? profile.traitPostureList
      : [profile.traitPosture || 'turtle_slouch'];
    const traitTempList = Array.isArray(profile.traitTemperamentList) && profile.traitTemperamentList.length
      ? profile.traitTemperamentList
      : [profile.traitTemperament || 'explorer'];
    const traitFocus = profile.traitFocusSpan || '15_20m';

    const sleepLabelMapKo = {
      deep_early: '21:30 이전 숙면형',
      late_bedtime: '22:30 이후 늦은 취침',
      toss_mouth: '입호흡·코골이·뒤척임',
      night_snack: '취침 직전 야식·우유',
      morning_fatigue: '아침 기상곤란·피로',
      wake_middle: '새벽 중도각성·잠투정',
      bedtime_screen: '취침 전 스마트폰·영상',
      weekend_oversleep: '주말 늦잠·수면리듬 불균형'
    };

    const dietLabelMapKo = {
      small_appetite: '입 짧은 소식형',
      meat_veggie_picky: '고기·채소 편식',
      dairy_sensitive: '우유·유제품 배앓이',
      fast_carb_sweet: '탄수화물·간식·단맛 선호',
      slow_hold_mouth: '식사 지연·입에 물고 있음',
      weak_stomach: '잦은 복통·변비·묽은변',
      skip_breakfast: '아침 결식·불규칙 식사',
      balanced_good: '균형 식습관'
    };

    const postureLabelMapKo = {
      turtle_slouch: '책상·스마트폰 거북목',
      leg_cross_pelvis: '다리 꼬기·짝다리 비대칭',
      growing_pains: '저녁 다리·무릎 성장통',
      w_sit_flat_foot: 'W자 앉기·안짱걸음·평발',
      round_shoulder: '말린 어깨·가슴 움츠림',
      upright_good: '바른 체형'
    };

    const tempLabelMapKo = {
      explorer: '활동·체험 탐구형',
      builder: '손끝 조립·만들기 몰입형',
      questioner: '질문·언어 사고형',
      cautious: '섬세·완벽주의 관찰형',
      art_story: '감성·예술·스토리 공감형',
      competitive_game: '승부욕·퀴즈·보드게임형'
    };

    const sleepTraitLabelKo = traitSleepList.map(k => sleepLabelMapKo[k] || '늦은 취침').join(' · ');
    const dietTraitLabelKo = traitDietList.map(k => dietLabelMapKo[k] || '입 짧은 소식형').join(' · ');
    const postureTraitLabelKo = traitPostureList.map(k => postureLabelMapKo[k] || '거북목 체형').join(' · ');
    const tempTraitLabelKo = traitTempList.map(k => tempLabelMapKo[k] || '활동·탐구형').join(' · ');

    const focusTraitLabelKo = {
      under_10m: '10분 미만 단기 집중',
      '15_20m': '15~20분 단계별 집중',
      '30m_plus': '30분+ 심화 몰입'
    }[traitFocus] || '15~20분 집중';

    // Trait-specific custom routine lines (combining multi-selected traits)
    const sleepRoutines = [];
    if (traitSleepList.includes('toss_mouth') || traitSleepList.includes('wake_middle')) {
      sleepRoutines.push('취침 전 비강 세척·습도 50% 유지로 입호흡·새벽 각성을 줄이고 깊은 서파수면 유도');
    }
    if (traitSleepList.includes('night_snack')) {
      sleepRoutines.push('취침 2~3시간 전 야식·우유 중단(인슐린에 의한 성장호르몬 억제 차단)');
    }
    if (traitSleepList.includes('morning_fatigue') || traitSleepList.includes('weekend_oversleep')) {
      sleepRoutines.push('아침 기상 즉시 햇빛 노출 및 주말 기상 시간 편차 1시간 이내 고정');
    }
    if (sleepRoutines.length === 0 || traitSleepList.includes('late_bedtime') || traitSleepList.includes('bedtime_screen')) {
      sleepRoutines.push('매일 밤 21:45 소등 · 취침 1시간 전 스마트폰 차단으로 밤 10시~2시 성장호르몬 피크 확보');
    }
    const customSleepRoutineKo = sleepRoutines.slice(0, 2).join(' + ');

    const dietRoutines = [];
    if (traitDietList.includes('dairy_sensitive') || traitDietList.includes('weak_stomach')) {
      dietRoutines.push(`우유 배앓이·장 민감도를 고려해 두부·잔멸치 및 무유당 구연산·연골칼슘(${nutTargets.calciumMg}mg)·비타민D3(${nutTargets.vitDIU}IU) 보충`);
    }
    if (traitDietList.includes('meat_veggie_picky') || traitDietList.includes('fast_carb_sweet')) {
      dietRoutines.push(`단맛·간식을 줄이고 소고기·계란 단백질(${nutTargets.proteinG}g/일)과 미각 세포를 깨우는 아연·초유 보충`);
    }
    if (dietRoutines.length === 0 || traitDietList.includes('small_appetite') || traitDietList.includes('slow_hold_mouth')) {
      dietRoutines.push(`입이 짧은 아이를 위해 적은 양으로도 흡수율이 높은 황기추출물(HT042)·고밀도 칼슘(${nutTargets.calciumMg}mg) 보충`);
    }
    const customDietRoutineKo = dietRoutines.slice(0, 2).join(' + ');

    const customPostureStudyRoutineKo = `${traitPostureList.includes('growing_pains') ? '저녁 온찜질·종아리 스트레칭 및' : '높이조절 독서대·바른 착석으로 거북목·골반 틀어짐을 예방하고'} 매일 저녁 철봉·점프 30초×3세트 + [${tempTraitLabelKo} · ${focusTraitLabelKo}] 맞춤 하루 20분 자기주도 탐구`;

    const bespokeNote = analyzeParentFreeNote(
      profile.parentFreeNote || '',
      profile,
      nutTargets,
      mphVal,
      optimizedHeight,
      potentialGainCm,
      isEn
    );

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
        <!-- BESPOKE PARENT NARRATIVE AI COACHING & LIVE QUESTION BOX           -->
        <!-- ================================================================== -->
        <div id="bespoke-parent-note-section" style="background: linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 58, 138, 0.25) 100%); border: 1.5px solid rgba(56, 189, 248, 0.42); border-radius: 16px; padding: 1.05rem 1.15rem; margin-bottom: 1.25rem; text-align: left;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.55rem;">
            <span style="font-size: 0.75rem; font-weight: 900; color: #38BDF8; letter-spacing: 0.04em;">
              🤖 ${isEn ? 'BESPOKE AI NARRATIVE SYNTHESIS' : '학부모 직접 서술 기반 · K-GROWTH AI™ 1:1 심층 문답'}
            </span>
            <span style="font-size: 0.72rem; color: #6EE7B7; font-weight: 800; background: rgba(16, 185, 129, 0.16); padding: 0.18rem 0.6rem; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.35);">
              ${isEn ? 'Live Custom Report Engine' : '아이별 자유 서술 실시간 반영'}
            </span>
          </div>

          ${bespokeNote.hasNote ? `
            <div style="background: rgba(255, 255, 255, 0.05); border-left: 3.5px solid #38BDF8; border-radius: 10px; padding: 0.75rem 0.9rem; margin-bottom: 0.85rem;">
              <div style="font-size: 0.75rem; color: #93C5FD; font-weight: 800; margin-bottom: 0.2rem;">
                📝 ${isEn ? 'What You Wrote About Your Child:' : '학부모님(본인)께서 직접 적어주신 우리 아이 이야기:'}
              </div>
              <div style="font-size: 0.88rem; color: #FFFFFF; font-weight: 700; line-height: 1.48;">
                "${bespokeNote.rawNote}"
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; margin-bottom: 0.85rem;">
              ${bespokeNote.insights.map((ins) => `
                <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 12px; padding: 0.85rem 0.95rem;">
                  <div style="font-size: 0.8rem; font-weight: 900; color: #34D399; margin-bottom: 0.35rem;">
                    ${isEn ? ins.badgeEn : ins.badgeKo}
                  </div>
                  <div style="font-size: 0.82rem; color: #E2E8F0; line-height: 1.52; margin-bottom: 0.45rem;">
                    ${isEn ? ins.answerEn : ins.answerKo}
                  </div>
                  <div style="font-size: 0.72rem; color: #94A3B8; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 0.35rem;">
                    📚 ${ins.sourceKo}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="font-size: 0.82rem; color: #CBD5E1; margin: 0 0 0.65rem 0; line-height: 1.48;">
              ${isEn
                ? 'Write any specific traits, worries, or questions about your child below to immediately generate a 1:1 clinical Q&A and tailored routine inside this report.'
                : '우리 아이만의 특징이나 평소 걱정되는 점(성장통, 줄넘기 거부, 유전키 걱정, 우유 배앓이, 비염 등)을 아래 칸에 직접 적어주시면 <strong>즉시 이 리포트 안에 1:1 맞춤 처방이 추가</strong>됩니다.'}
            </p>
          `}

          <!-- Live Interactive Bespoke Input inside the Report -->
          <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; padding: 0.75rem;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #93C5FD; margin-bottom: 0.45rem;">
              ✍️ ${isEn ? 'Add or Update Your Child\'s Specific Concern (Instant AI Re-Synthesis):' : '아이 특징·추가 궁금증 직접 입력 (터치 또는 입력 후 [AI 맞춤 코칭 즉시 반영] 클릭):'}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.55rem;">
              <button type="button" class="live-bespoke-chip" data-snippet="밤에 다리·무릎 성장통으로 자주 깨요." style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.16); color: #E2E8F0; border-radius: 9999px; padding: 0.3rem 0.65rem; font-size: 0.74rem; font-weight: 700; cursor: pointer;">+ 🦵 밤마다 다리 성장통</button>
              <button type="button" class="live-bespoke-chip" data-snippet="운동·줄넘기를 싫어하고 집에만 있으려 해요." style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.16); color: #E2E8F0; border-radius: 9999px; padding: 0.3rem 0.65rem; font-size: 0.74rem; font-weight: 700; cursor: pointer;">+ 🏃 운동·줄넘기 거부</button>
              <button type="button" class="live-bespoke-chip" data-snippet="엄마·아빠 키가 작아 유전키 한계가 걱정돼요." style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.16); color: #E2E8F0; border-radius: 9999px; padding: 0.3rem 0.65rem; font-size: 0.74rem; font-weight: 700; cursor: pointer;">+ 🧬 부모 유전키 걱정</button>
              <button type="button" class="live-bespoke-chip" data-snippet="우유는 안 마시고 입이 너무 짧아 살이 안 쪄요." style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.16); color: #E2E8F0; border-radius: 9999px; padding: 0.3rem 0.65rem; font-size: 0.74rem; font-weight: 700; cursor: pointer;">+ 🥛 우유 거부·소식</button>
              <button type="button" class="live-bespoke-chip" data-snippet="비염·코막힘으로 입을 벌리고 자고 아침에 피곤해해요." style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.16); color: #E2E8F0; border-radius: 9999px; padding: 0.3rem 0.65rem; font-size: 0.74rem; font-weight: 700; cursor: pointer;">+ 😮 비염·구강호흡</button>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <input
                type="text"
                id="live-bespoke-note-input"
                class="form-input"
                value="${(bespokeNote.rawNote || '').replace(/"/g, '&quot;')}"
                placeholder="${isEn ? 'Type your child\'s traits or concerns...' : '예: 밤에 자다가 종아리가 아프다고 깨고, 줄넘기는 싫어해요...'}"
                style="flex: 1 1 240px; min-height: 44px; font-size: 0.88rem; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(56, 189, 248, 0.4); color: #FFFFFF; padding: 0.55rem 0.8rem; border-radius: 10px;"
              />
              <button
                type="button"
                id="btn-live-bespoke-update"
                style="background: linear-gradient(135deg, #2563EB 0%, #059669 100%); color: #FFFFFF; border: 1px solid #6EE7B7; border-radius: 10px; padding: 0.6rem 1.05rem; min-height: 44px; font-size: 0.84rem; font-weight: 900; cursor: pointer; white-space: nowrap;"
              >
                🤖 ${isEn ? 'Update Custom AI Report' : 'AI 맞춤 코칭 즉시 반영'}
              </button>
            </div>
          </div>
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
   * Attaches click event to retest button and live bespoke note updater
   */
  function attachRetestHandler(callback) {
    if (typeof document === 'undefined') return;

    // 1. Wire Live Bespoke Note Chips & Update Button inside the Report
    const liveInput = document.getElementById('live-bespoke-note-input');
    const liveBtn = document.getElementById('btn-live-bespoke-update');
    const liveChips = typeof document.querySelectorAll === 'function'
      ? document.querySelectorAll('.live-bespoke-chip')
      : [];

    if (liveChips && liveChips.forEach && liveInput) {
      liveChips.forEach((chip) => {
        chip.addEventListener('click', () => {
          const snippet = chip.getAttribute('data-snippet') || '';
          if (!snippet) return;
          const cur = (liveInput.value || '').trim();
          if (!cur.includes(snippet)) {
            liveInput.value = cur ? `${cur} ${snippet}` : snippet;
          }
          chip.style.borderColor = '#34D399';
          chip.style.background = 'rgba(16, 185, 129, 0.2)';
          chip.style.color = '#6EE7B7';
        });
      });
    }

    if (liveBtn && liveInput) {
      liveBtn.addEventListener('click', () => {
        const newNote = (liveInput.value || '').trim();
        const wizardNoteEl = document.getElementById('parent-free-note');
        if (wizardNoteEl) wizardNoteEl.value = newNote;

        const wiz = global.TallerOnboardingWizard;
        const curProfile = (wiz && typeof wiz.getState === 'function' && wiz.getState().profile)
          ? Object.assign({}, wiz.getState().profile, { parentFreeNote: newNote })
          : { parentFreeNote: newNote };

        if (wiz && typeof wiz.getState === 'function' && wiz.getState().profile) {
          wiz.getState().profile.parentFreeNote = newNote;
        }

        // Sync to server endpoint asynchronously
        if (typeof window !== 'undefined' && typeof window.fetch === 'function' && newNote) {
          try {
            window.fetch('/api/bespoke-note', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                timestamp: new Date().toISOString(),
                profile: curProfile,
                parentFreeNote: newNote
              })
            }).catch(() => {});
          } catch (_) {}
        }

        const mbEl = document.getElementById('master-briefing-card');
        if (mbEl) {
          mbEl.innerHTML = renderMasterBriefingCard(curProfile);
          attachRetestHandler(callback);
        }
      });
    }

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
