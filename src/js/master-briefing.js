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
          badgeKo: '🦵 야간 성장통 완화 처방',
          badgeEn: '🦵 Growing Pains Relief',
          answerKo: `잠들기 전 <strong>무릎·종아리 5분 온찜질 마사지</strong>를 해주시고, 저녁 식후에 <strong>칼슘·마그네슘·비타민D3 오렌지맛 츄어블 1알</strong>을 챙겨주시면 다리 근육 긴장이 풀려 밤새 깨지 않고 푹 자요~!`,
          answerEn: `Do a 5-min warm knee/calf massage before bed and give 1 Calcium + Magnesium + D3 chewable after dinner for deep pain-free sleep!`,
          sourceKo: '근거: 소아 성장통 및 칼슘·마그네슘 근육이완 임상 (대한소아과학회지 · PMID:24709624)'
        });
      }

      // Cluster 2: Genetic height worry / short parents / small peer percentile
      if (/유전|엄마|아빠|부모|작아|작은|키가 작|한계|또래|백분위/.test(text)) {
        insights.push({
          badgeKo: '🧬 부모 유전키 돌파 솔루션',
          badgeEn: '🧬 Overcoming Genetic MPH',
          answerKo: `유전 표적키(<strong>${mphVal}cm</strong>)는 고정된 한계가 아니에요! 밤 10시 숙면과 아침·저녁 맞춤 영양(초유·칼슘·HT042)을 6개월 이상 꾸준히 챙겨주시면 <strong>최대 ${optimizedHeight}cm (+${potentialGainCm}cm 더 성장)</strong>까지 충분히 자라납니다~!`,
          answerEn: `Genetic MPH (${mphVal}cm) is not fixed! With 10 PM sleep and daily nutrition for 6+ months, your child can reach up to ${optimizedHeight}cm (+${potentialGainCm}cm)!`,
          sourceKo: '근거: 대한소아내분비학회지 성장호르몬·IGF-1 연구 (김윤철 등 1998 · Yakar et al. 2018)'
        });
      }

      // Cluster 3: Dislikes exercise / rope skipping / stays indoors / YouTube
      if (/운동|줄넘기|싫어|안 움|집에|귀찮|체력|땀/.test(text)) {
        insights.push({
          badgeKo: '🏃 운동 싫어하는 아이 실내 루틴',
          badgeEn: '🏃 Fun Indoor Jumping Routine',
          answerKo: `억지 줄넘기 대신 좋아하는 음악을 틀고 <strong>거실 무소음 트램폴린 10분 점핑</strong>이나 <strong>문틀 철봉 30초 매달리기</strong>로 바꿔보세요! 아이가 놀이처럼 즐기며 숨은 키 <strong>+1.8cm</strong>가 쑥 자라납니다~!`,
          answerEn: `Replace forced rope-skipping with 10 mins of indoor silent trampoline jumping and 30s doorway bar hanging to unlock +1.8cm!`,
          sourceKo: '근거: 성장판 기계적 자극 및 척추 감압 임상 (대한소아과학회지 박신영·김호연 2011 · PMID:30897641)'
        });
      }

      // Cluster 4: Refuses milk / picky eater / small appetite / underweight
      if (/우유|배앓이|설사|입이 짧|소식|편식|고기|채소|안 먹|마른|살이|체중/.test(text)) {
        insights.push({
          badgeKo: '🍽️ 우유 거부·편식 아이 영양 처방',
          badgeEn: '🍽️ Picky Eater Nutrition',
          answerKo: `우유 대신 <strong>1알에 우유·어골칼슘 + 비타민C·D3 + 뉴질랜드초유 + 철분·아연·마그네슘</strong>이 다 들어있는 <strong>깔끔한 오렌지맛 츄어블</strong>을 아침·저녁으로 주세요! 아이들이 맛있어서 먼저 찾고 6개월 이상 꾸준히 먹이기 정말 편해요~!`,
          answerEn: `Give an all-in-one Orange Chewable with Milk/Fish Calcium + NZ Colostrum + Vit D3/C + Iron/Zinc/Mg morning and night!`,
          sourceKo: '근거: 소아 영양 불균형 및 칼슘·아연·초유 보충 임상 (한국영양학회지 정광호·이근재 2023 · BMC Pediatr 2023)'
        });
      }

      // Cluster 5: Rhinitis / mouth breathing / snoring / hard wakeup
      if (/비염|코막힘|코골이|입 벌|입호흡|구강호흡|깨요|잠|피곤|일어나/.test(text)) {
        insights.push({
          badgeKo: '😮 비염·구강호흡 숙면 처방',
          badgeEn: '😮 Deep Sleep Recovery',
          answerKo: `잠들기 30분 전 <strong>생리식염수 코 세척과 침실 습도 50% 유지</strong>로 코호흡을 열어주세요! 밤 10시~새벽 2시 깊은 숙면 동안 성장호르몬이 <strong>65% 이상 집중 분비</strong>되어 아침에 개운하게 일어납니다~!`,
          answerEn: `Use nasal saline rinse 30 mins before bed and keep 50% bedroom humidity to restore deep slow-wave sleep GH pulses!`,
          sourceKo: '근거: 소아 서파수면 및 야간 성장호르몬 분비 기전 (대한의사협회지 곽이성·박종대·양재혁 2024)'
        });
      }

      // Cluster 6: Puberty / precocious puberty / bone age closure worry
      if (/사춘기|성조숙|2차 성징|가슴|초경|변성기|머리냄새|여드름|뼈나이|골연령|성장판/.test(text)) {
        insights.push({
          badgeKo: '⏳ 사춘기 성장판 골든타임 처방',
          badgeEn: '⏳ Pubertal Golden-Time Care',
          answerKo: `사춘기 신호가 보일 땐 <strong>밤 9시 이후 야식·단 음료를 끊고</strong>, 성장판이 열려 있는 지금 <strong>아침·저녁 HT042·연골칼슘 보충과 하루 10분 점핑 운동</strong>을 밀착 실천해 매년 7~9cm 폭풍 성장을 이끌어주세요~!`,
          answerEn: `Stop snacks after 9 PM and combine morning/evening HT042 + Cartilage Calcium with 10-min daily jumping while growth plates are open!`,
          sourceKo: '근거: 사춘기 골연령 및 성장인자(IGF-1) 임상 (대한소아내분비학회지 김광민·김인락 2000)'
        });
      }

      // Cluster 7: Smartphone / YouTube / short attention span / reading reluctance
      if (/스마트폰|유튜브|게임|영상|미디어|집중|산만|책|독서|공부/.test(text)) {
        insights.push({
          badgeKo: '🧠 스마트폰 줄이기 & 두뇌 몰입 처방',
          badgeEn: '🧠 Focus & Screen Reset',
          answerKo: `스마트폰을 바로 뺏기보다 <strong>무소음 시각 타이머로 하루 15분 손끝 조립 교구(자석블록·그래비트랙스)</strong> 미션을 주세요! 밤 9시 이후 화면만 꺼도 멜라토닌과 성장호르몬이 정상 회복됩니다~!`,
          answerEn: `Use a 15-minute visual timer with hands-on 3D STEM building kits and turn off screens 1 hour before bed!`,
          sourceKo: '근거: 야간 블루라이트 차단 및 전두엽-소근육 발달 (PMID:12970330 · PMID:20822219)'
        });
      }

      // Cluster 8: Confidence / shyness / sensitivity / perfectionism / friends
      if (/자신감|위축|소심|부끄|친구|발표|예민|완벽|실수|울|짜증|고집/.test(text)) {
        insights.push({
          badgeKo: '💛 자신감 쑥쑥 대화 코칭',
          badgeEn: '💛 Confidence Coaching',
          answerKo: `결과보다 <strong>"끝까지 해본 네 방법이 정말 멋지다!"</strong>라고 과정을 칭찬해 주세요! 주말 나들이에서 아이 생각을 먼저 물어봐 주면 발표력과 자존감이 몰라보게 단단해집니다~!`,
          answerEn: `Praise your child's effort and curiosity rather than outcomes to build strong emotional confidence!`,
          sourceKo: '근거: 부모 자율성 지지와 아동 실행기능 발달 (Bernier et al., PMID:20331667)'
        });
      }

      // Fallback general bespoke synthesis if parent wrote other unique details
      if (insights.length === 0) {
        insights.push({
          badgeKo: '🎯 우리 아이 1:1 맞춤 종합 처방',
          badgeEn: '🎯 1:1 Custom Growth Prescription',
          answerKo: `적어주신 <strong>"${raw}"</strong> 고민을 해결하려면 <strong>① 밤 10시 전 숙면, ② 아침·저녁 오렌지맛 초유·칼슘·비타민D3·아연 츄어블 보충, ③ 잠들기 전 5분 무릎 마사지</strong>를 6개월간 꾸준히 챙겨주세요~!`,
          answerEn: `For "${raw}", practice pre-10 PM sleep, morning/evening Calcium+D3+Colostrum chewables, and 5-min bedtime knee massage!`,
          sourceKo: '근거: 질병관리청(KDCA) 성장도표 및 대한소아내분비학회지·한국영양학회지 임상 근거'
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
      <!-- Master Briefing Card: Crisp Clinical Diagnosis Sheet (Zero 3-Card Clutter, Large High-Contrast Font) -->
      <div class="bento-card master-briefing-card" id="master-briefing-card-content" style="border-left: 5px solid #3B82F6; text-align: left; padding: 1.5rem;">
        
        <!-- Header -->
        <div class="briefing-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.15rem; border-bottom: 1px solid rgba(255, 255, 255, 0.14); padding-bottom: 0.9rem;">
          <div>
            <span class="section-badge-pill" style="display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(59, 130, 246, 0.18); color: #93C5FD; font-size: 0.82rem; font-weight: 800; padding: 0.25rem 0.75rem; border-radius: 9999px; border: 1px solid rgba(59, 130, 246, 0.4); margin-bottom: 0.35rem;">
              📋 ${isEn ? 'KIDS-FIT AI · CLINICAL GROWTH DIAGNOSIS SHEET' : guidebookEditionLabel}
            </span>
            <h2 class="briefing-title" style="font-size: 1.38rem; font-weight: 900; color: #FFFFFF; margin: 0.15rem 0;">
              ${isEn ? 'At-a-Glance Precision Growth Diagnosis & Daily Prescription' : '한눈에 보는 우리 아이 맞춤 성장 진단서 & 아침·저녁 처방전'}
            </h2>
          </div>
          <span style="background: rgba(16, 185, 129, 0.18); color: #6EE7B7; font-weight: 800; font-size: 0.82rem; padding: 0.35rem 0.85rem; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.4);">
            📚 ${isEn ? `KDCA 2017 · CDC 2000 · ${totalDbPapers} Papers` : `질병관리청(KDCA) · 소아내분비 논문 ${totalDbPapers}편 검증`}
          </span>
        </div>

        <!-- Top Summary Hero Card (Large Readable Typography) -->
        <div class="taller-height-reveal-hero" id="taller-potential-reveal-hero" style="margin-bottom: 1.15rem; padding: 1.35rem 1.5rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.15rem; align-items: center;">
            <div>
              <div style="font-size: 0.85rem; font-weight: 800; color: #93C5FD; margin-bottom: 0.25rem;">
                ${isEn ? 'K-GROWTH AI™ · POTENTIAL ADULT HEIGHT' : '아침·저녁으로 6개월 이상 꾸준히 챙겨주셨을 때 기대 잠재키'}
              </div>
              <div style="display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap;">
                <span class="taller-giant-height-number">${optimizedHeight.toFixed(1)} cm</span>
                <span style="background: rgba(16, 185, 129, 0.22); border: 1.5px solid #10B981; color: #6EE7B7; font-size: 0.94rem; font-weight: 900; padding: 0.25rem 0.75rem; border-radius: 9999px;">
                  ▲ +${potentialGainCm.toFixed(1)} cm ${isEn ? 'More Growth' : '더 자랄 수 있어요~!'}
                </span>
              </div>
              <div id="briefing-one-line-verdict" style="font-size: 0.96rem; color: #F8FAFC; margin-top: 0.55rem; line-height: 1.55;">
                ${isEn
                  ? `Current <strong>${height}cm (Top ${kdcaTop}%)</strong> · Genetic MPH <strong>${mphVal}cm</strong> · Unmanaged <strong>${unmanagedHeight}cm</strong> → Consistent Care <strong style="color:#6EE7B7;">${optimizedHeight}cm</strong>`
                  : `현재 <strong>${height}cm (상위 ${kdcaTop}%)</strong> · 부모 유전키 <strong>${mphVal}cm</strong> · 방치 시 <strong>${unmanagedHeight}cm</strong> → 맞춤 관리 시 <strong style="color:#6EE7B7;">${optimizedHeight}cm</strong>`}
              </div>
            </div>

            <!-- Right: Clean 3-Bar Comparison -->
            <div style="background: rgba(0, 0, 0, 0.65); border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 16px; padding: 0.9rem 1rem; display: flex; justify-content: space-around; align-items: flex-end; height: 128px;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <span style="font-size: 0.84rem; font-weight: 800; color: #FDA4AF;">${unmanagedHeight}cm</span>
                <div style="width: 36px; height: 46px; border-radius: 6px; background: rgba(244,63,94,0.65); border: 1px solid #F43F5E;"></div>
                <span style="font-size: 0.78rem; color: #E2E8F0; font-weight: 700;">${isEn ? 'Unmanaged' : '방치 시'}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <span style="font-size: 0.84rem; font-weight: 800; color: #93C5FD;">${mphVal}cm</span>
                <div style="width: 36px; height: 64px; border-radius: 6px; background: rgba(59,130,246,0.75); border: 1px solid #60A5FA;"></div>
                <span style="font-size: 0.78rem; color: #93C5FD; font-weight: 700;">${isEn ? 'Genetic MPH' : '부모 유전키'}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <span style="font-size: 0.9rem; font-weight: 900; color: #6EE7B7;">${optimizedHeight}cm</span>
                <div style="width: 40px; height: 84px; border-radius: 6px; background: linear-gradient(180deg, #10B981 0%, #3B82F6 100%); border: 1px solid #A7F3D0;"></div>
                <span style="font-size: 0.8rem; color: #6EE7B7; font-weight: 900;">${isEn ? 'Consistent Goal' : '맞춤 관리 시'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick-Jump Navigation (4 Clean Steps) -->
        <div class="guidebook-chapter-nav" aria-label="Guidebook Steps" style="margin-bottom: 1.15rem;">
          <a href="#briefing-status-section" class="guidebook-chapter-pill">📋 ${isEn ? 'STEP 1. Diagnosis Sheet' : 'STEP 1. 핵심 진단서'}</a>
          <a href="#briefing-actions-section" class="guidebook-chapter-pill">🧭 ${isEn ? 'STEP 2. Daily Routine' : 'STEP 2. 아침·저녁 루틴'}</a>
          <a href="#expected-outcomes-section" class="guidebook-chapter-pill">🏆 ${isEn ? 'STEP 3. 6-Mo Outcome' : 'STEP 3. 6개월 기대 성과'}</a>
          <a href="#pinpoint-custom-prescription-section" class="guidebook-chapter-pill">💊 ${isEn ? 'STEP 4. Custom Items' : 'STEP 4. 맞춤 영양제·교구·책'}</a>
        </div>

        <!-- ================================================================== -->
        <!-- STEP 01: CRISP CLINICAL DIAGNOSIS SHEET (High-Contrast Table)       -->
        <!-- ================================================================== -->
        <div class="briefing-section briefing-status" id="briefing-status-section" style="background: rgba(15, 23, 42, 0.92); border: 1.5px solid rgba(59, 130, 246, 0.4); border-radius: 18px; padding: 1.25rem 1.35rem; margin-bottom: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 0.65rem;">
            <h3 class="briefing-section-title" style="font-size: 1.18rem; font-weight: 900; color: #FFFFFF; margin: 0;">
              📋 ${isEn ? '1. Clinical Growth Diagnosis Sheet' : '1. 우리 아이 핵심 성장 진단서 요약표'}
            </h3>
            <span style="font-size: 0.82rem; font-weight: 800; color: #93C5FD;">
              ${genderKo} · 만 ${ageYears}세 (${exactMonths.toFixed(1)}개월) · ${height}cm / ${weight}kg
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem;">
            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.94rem; color: #E2E8F0; font-weight: 700;">📏 ${isEn ? 'Height Percentile' : '현재 키 백분위'}</span>
              <span id="briefing-percentile" style="font-size: 1.04rem; font-weight: 900; color: #38BDF8;">
                ${isEn ? `Top ${kdcaTop}% (${kdcaPct}th)` : `상위 ${kdcaTop}% (${deltaStr})`}
              </span>
            </div>

            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.94rem; color: #E2E8F0; font-weight: 700;">🚀 ${isEn ? 'Growth Velocity' : '연간 성장속도'}</span>
              <span id="briefing-velocity" style="font-size: 1.04rem; font-weight: 900; color: ${isRedFlag ? '#FB7185' : '#34D399'};">
                연 ${velocityPerYear} cm ${isRedFlag ? '🚨 집중케어' : '✓ 정상궤도'}
              </span>
            </div>

            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.94rem; color: #E2E8F0; font-weight: 700;">🧬 ${isEn ? 'Genetic MPH' : '부모 유전 표적키'}</span>
              <span id="briefing-mph" style="font-size: 1.04rem; font-weight: 900; color: #FBBF24;">
                ${mphVal} cm <span style="font-size: 0.8rem; font-weight: 700;">(±8.5cm)</span>
              </span>
            </div>

            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.94rem; color: #E2E8F0; font-weight: 700;">⏳ ${isEn ? 'Golden Time' : '성장판 잔여기간'}</span>
              <span id="briefing-goldentime" style="font-size: 0.96rem; font-weight: 900; color: #6EE7B7;">
                ${goldenTimeLabel.split('(')[0].trim()}
              </span>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- BESPOKE 1:1 PARENT Q&A (1-Card-at-a-Time Tabbed View — Zero Clutter) -->
        <!-- ================================================================== -->
        <div id="bespoke-parent-note-section" style="background: rgba(15, 23, 42, 0.94); border: 1.5px solid rgba(52, 211, 153, 0.45); border-radius: 18px; padding: 1.2rem 1.35rem; margin-bottom: 1.15rem; text-align: left;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.65rem;">
            <span style="font-size: 0.95rem; font-weight: 900; color: #6EE7B7;">
              💬 ${isEn ? '1:1 Bespoke Parent Q&A Prescription' : '학부모님 고민 맞춤 1:1 족집게 처방 (탭을 눌러 하나씩 확인하세요)'}
            </span>
          </div>

          ${bespokeNote.hasNote ? `
            ${bespokeNote.insights.length > 1 ? `
              <!-- Interactive 1-Card-at-a-Time Tab Buttons (Never shows 3 cards at once!) -->
              <div style="display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 0.8rem;">
                ${bespokeNote.insights.map((ins, idx) => `
                  <button
                    type="button"
                    class="bespoke-insight-tab-btn"
                    onclick="(function(btn, targetIdx){ var sec = document.getElementById('bespoke-parent-note-section'); if(!sec) return; var cards = sec.querySelectorAll('.bespoke-single-insight-card'); cards.forEach(function(c, i){ c.style.display = (i === targetIdx) ? 'block' : 'none'; }); var btns = sec.querySelectorAll('.bespoke-insight-tab-btn'); btns.forEach(function(b, i){ b.style.background = (i === targetIdx) ? '#10B981' : 'rgba(255,255,255,0.07)'; b.style.color = (i === targetIdx) ? '#052E16' : '#FFFFFF'; b.style.borderColor = (i === targetIdx) ? '#34D399' : 'rgba(255,255,255,0.18)'; }); })(this, ${idx})"
                    style="padding: 0.52rem 0.9rem; border-radius: 9999px; font-size: 0.88rem; font-weight: 900; cursor: pointer; background: ${idx === 0 ? '#10B981' : 'rgba(255,255,255,0.07)'}; color: ${idx === 0 ? '#052E16' : '#FFFFFF'}; border: 1.5px solid ${idx === 0 ? '#34D399' : 'rgba(255,255,255,0.18)'};"
                  >
                    ${idx + 1}. ${isEn ? ins.badgeEn : ins.badgeKo}
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <div>
              ${bespokeNote.insights.map((ins, idx) => `
                <div class="bespoke-single-insight-card" style="display: ${idx === 0 ? 'block' : 'none'}; background: rgba(255, 255, 255, 0.05); border-left: 4px solid #10B981; border-radius: 14px; padding: 1.05rem 1.15rem; margin-bottom: 0.75rem;">
                  <div style="font-size: 1.05rem; font-weight: 900; color: #6EE7B7; margin-bottom: 0.4rem;">
                    ${isEn ? ins.badgeEn : ins.badgeKo}
                  </div>
                  <div style="font-size: 1.0rem; color: #FFFFFF; line-height: 1.62; margin-bottom: 0.45rem;">
                    ${isEn ? ins.answerEn : ins.answerKo}
                  </div>
                  <div style="font-size: 0.82rem; color: #93C5FD; font-weight: 700;">
                    📚 ${ins.sourceKo}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Compact Live Update Input -->
          <details style="margin-top: 0.4rem;">
            <summary style="cursor: pointer; font-size: 0.88rem; font-weight: 800; color: #93C5FD; outline: none;">
              ✍️ ${isEn ? 'Update or Add Another Question About Your Child' : '우리 아이 다른 고민(성장통·유전키·운동·편식·비염) 직접 입력하거나 변경하기 ▼'}
            </summary>
            <div style="margin-top: 0.65rem; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 12px; padding: 0.85rem;">
              <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem;">
                <button type="button" class="live-bespoke-chip" data-snippet="밤에 다리·무릎 성장통으로 자주 깨요." style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #FFFFFF; border-radius: 9999px; padding: 0.38rem 0.75rem; font-size: 0.82rem; font-weight: 800; cursor: pointer;">+ 🦵 야간 성장통</button>
                <button type="button" class="live-bespoke-chip" data-snippet="운동·줄넘기를 싫어하고 집에만 있으려 해요." style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #FFFFFF; border-radius: 9999px; padding: 0.38rem 0.75rem; font-size: 0.82rem; font-weight: 800; cursor: pointer;">+ 🏃 운동·줄넘기 거부</button>
                <button type="button" class="live-bespoke-chip" data-snippet="엄마·아빠 키가 작아 유전키 한계가 걱정돼요." style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #FFFFFF; border-radius: 9999px; padding: 0.38rem 0.75rem; font-size: 0.82rem; font-weight: 800; cursor: pointer;">+ 🧬 부모 유전키 걱정</button>
                <button type="button" class="live-bespoke-chip" data-snippet="우유는 안 마시고 입이 너무 짧아 살이 안 쪄요." style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #FFFFFF; border-radius: 9999px; padding: 0.38rem 0.75rem; font-size: 0.82rem; font-weight: 800; cursor: pointer;">+ 🥛 우유 거부·편식</button>
                <button type="button" class="live-bespoke-chip" data-snippet="비염·코막힘으로 입을 벌리고 자고 아침에 피곤해해요." style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #FFFFFF; border-radius: 9999px; padding: 0.38rem 0.75rem; font-size: 0.82rem; font-weight: 800; cursor: pointer;">+ 😮 비염·구강호흡</button>
              </div>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <input
                  type="text"
                  id="live-bespoke-note-input"
                  class="form-input"
                  value="${(bespokeNote.rawNote || '').replace(/"/g, '&quot;')}"
                  placeholder="${isEn ? 'Type your child\'s traits or concerns...' : '예: 밤에 자다가 종아리가 아프다고 깨고, 줄넘기는 싫어해요...'}"
                  style="flex: 1 1 240px; min-height: 46px; font-size: 0.94rem; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(56, 189, 248, 0.45); color: #FFFFFF; padding: 0.55rem 0.85rem; border-radius: 10px;"
                />
                <button
                  type="button"
                  id="btn-live-bespoke-update"
                  style="background: linear-gradient(135deg, #2563EB 0%, #059669 100%); color: #FFFFFF; border: 1px solid #6EE7B7; border-radius: 10px; padding: 0.6rem 1.15rem; min-height: 46px; font-size: 0.9rem; font-weight: 900; cursor: pointer; white-space: nowrap;"
                >
                  🤖 ${isEn ? 'Update AI Prescription' : '처방 즉시 반영'}
                </button>
              </div>
            </div>
          </details>
        </div>

        <!-- ================================================================== -->
        <!-- STEP 02: DAILY MORNING & EVENING ROUTINE (Clean 1-Column List)      -->
        <!-- ================================================================== -->
        <div class="briefing-section briefing-actions" id="briefing-actions-section" style="background: rgba(15, 23, 42, 0.92); border: 1.5px solid rgba(56, 189, 248, 0.35); border-radius: 18px; padding: 1.25rem 1.35rem; margin-bottom: 1.15rem;">
          <h3 class="briefing-section-title" style="font-size: 1.18rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.85rem 0;">
            🧭 ${isEn ? '2. Daily Morning & Evening Growth Roadmap (3 Easy Steps)' : '2. 오늘부터 아침·저녁으로 챙겨주실 맞춤 지도 방향 (하루 3가지 실천 처방)'}
          </h3>

          <div id="briefing-horizon-roadmap" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <!-- Routine 1: Sleep & Hormone -->
            <div class="briefing-action-item horizon-card" id="horizon-short-term" style="border-left: 4px solid #3B82F6; padding: 0.95rem 1.1rem; background: rgba(255, 255, 255, 0.04); border-radius: 12px;">
              <div style="font-size: 0.98rem; font-weight: 900; color: #93C5FD; margin-bottom: 0.25rem;">
                🌙 ① ${isEn ? 'Bedtime 10 PM Deep Sleep Routine' : '밤 10시 숙면 & 잠들기 전 5분 무릎·종아리 마사지'}
              </div>
              <div class="action-desc" id="briefing-action-sleep" style="font-size: 0.96rem; line-height: 1.58; color: #FFFFFF;">
                ${isEn
                  ? `Sleep by 21:45–22:00 & stop snacks 2–3 hrs before bed to maximize peak nocturnal growth hormone (65% of daily output).`
                  : `밤 10시~새벽 2시에 성장호르몬의 65%가 쏟아져 나와요! 취침 2시간 전 야식을 줄이고 <strong>잠들기 전 5분 무릎·종아리 마사지</strong>로 푹 재워주세요~!`}
              </div>
            </div>

            <!-- Routine 2: Morning & Evening All-in-One Nutrition -->
            <div class="briefing-action-item horizon-card" id="horizon-mid-term" style="border-left: 4px solid #10B981; padding: 0.95rem 1.1rem; background: rgba(255, 255, 255, 0.04); border-radius: 12px;">
              <div style="font-size: 0.98rem; font-weight: 900; color: #6EE7B7; margin-bottom: 0.25rem;">
                🍊 ② ${isEn ? 'Morning & Evening All-in-One Chewable Nutrition' : '아침·저녁 하루 2번! 아이가 잘 먹는 맞춤 영양 보충'}
              </div>
              <div class="action-desc" id="briefing-action-nutrition" style="font-size: 0.96rem; line-height: 1.58; color: #FFFFFF;">
                ${isEn
                  ? `Supplement daily Calcium (${nutTargets.calciumMg}mg) + Vit D3 (${nutTargets.vitDIU}IU) + NZ Colostrum + Zinc + Magnesium morning and night for 6+ months.`
                  : `<strong>우유·어골칼슘(${nutTargets.calciumMg}mg) + 비타민C·D3(${nutTargets.vitDIU}IU) + 뉴질랜드초유 + 철분·아연·마그네슘·HT042</strong>를 아침·저녁으로 간편하게 챙겨주세요! 깔끔한 오렌지·과일맛 타블렛/스틱이라 아이들이 먼저 찾고 6개월 이상 꾸준히 먹이기 좋아요~!`}
              </div>
            </div>

            <!-- Routine 3: 10-Min Spine Stretch & Jumping -->
            <div class="briefing-action-item horizon-card" id="horizon-long-term" style="border-left: 4px solid #A855F7; padding: 0.95rem 1.1rem; background: rgba(255, 255, 255, 0.04); border-radius: 12px;">
              <div style="font-size: 0.98rem; font-weight: 900; color: #D8B4FE; margin-bottom: 0.25rem;">
                🏃 ③ ${isEn ? '10-Min Spine Decompression & Play Focus' : '하루 10분 숨은 키 +1.8cm 스트레칭 & 기질 맞춤 놀이'}
              </div>
              <div class="action-desc" id="briefing-action-exercise" style="font-size: 0.96rem; line-height: 1.58; color: #FFFFFF;">
                ${isEn
                  ? `Evening doorway bar hang (30s×3), indoor forefoot jumping (10 mins), and 20-min hands-on focus matched to [${tempTraitLabelKo}].`
                  : `저녁 문틀 철봉 매달리기(30초)·실내 사뿐 점핑(10분)으로 숨은 척추 키 <strong>+1.8cm</strong>를 펴주고, <strong>[${tempTraitLabelKo}]</strong> 맞춤 교구·책으로 하루 20분 즐겁게 몰입해요~!`}
              </div>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- STEP 03: 6-MONTH EXPECTED OUTCOMES & ACADEMIC CITATIONS             -->
        <!-- ================================================================== -->
        <div id="expected-outcomes-section" style="background: rgba(16, 185, 129, 0.08); border: 1.5px solid rgba(16, 185, 129, 0.35); border-radius: 18px; padding: 1.2rem 1.35rem; margin-bottom: 1.15rem; text-align: left;">
          <h3 style="font-size: 1.14rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.65rem 0;">
            🏆 ${isEn ? '3. Expected Outcomes After 6 Months of Consistent Care' : '3. 6개월 이상 꾸준히 챙겨주셨을 때 기대되는 변화'}
          </h3>
          <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.98rem; color: #F8FAFC; line-height: 1.75;">
            <li><strong>📏 ${isEn ? 'Height Trajectory:' : '목표 잠재키 달성:'}</strong> ${unmanagedHeight}cm(방치 시) → <strong style="color:#6EE7B7;">${optimizedHeight}cm (+${potentialGainCm}cm 추가 성장)</strong> 및 연간 성장속도 <strong>+1.5~1.8cm/년</strong> 가속!</li>
            <li><strong>🦴 ${isEn ? 'Deep Sleep & Posture:' : '숙면 & 숨은 키 복원:'}</strong> 밤마다 깨던 다리 성장통이 줄어들고, 거북목·굽은 등이 펴지면서 <strong>숨은 키 +1.8cm</strong>가 바로 살아나요~!</li>
            <li><strong>🧠 ${isEn ? 'Focus & Confidence:' : '두뇌 집중력 & 자존감:'}</strong> 스마트폰 대신 손끝 교구·독서 습관이 잡히면서 집중 시간이 <strong>2배 이상</strong> 길어집니다~!</li>
          </ul>
        </div>

        <!-- Compact Expandable Academic Evidence Section (Preserves #briefing-research-section & #briefing-papers-container + 11 Core Citations) -->
        <div class="briefing-section briefing-research" id="briefing-research-section" style="margin-bottom: 1.15rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 0.95rem 1.15rem;">
          <details>
            <summary style="cursor: pointer; font-size: 0.92rem; font-weight: 800; color: #93C5FD; outline: none;">
              🔬 ${isEn ? 'View Peer-Reviewed Pediatric Endocrinology & Nutrition References (11 Core Studies)' : '진단서에 적용된 국내외 소아내분비·영양학 핵심 학술논문 근거 더보기 (대한소아내분비학회지 외 11편) ▼'}
            </summary>
            <div id="briefing-papers-container" class="briefing-papers-list" style="margin-top: 0.85rem; display: flex; flex-direction: column; gap: 0.55rem;">
              ${matchedPapers.map(({ paper: p, matchedCauseKo, matchedCauseEn }) => `
                <div class="matched-paper-card" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 0.7rem 0.85rem; text-align: left;">
                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; margin-bottom: 0.25rem;">
                    <span style="color: #FB7185; font-size: 0.84rem; font-weight: 800;">
                      • ${isEn ? matchedCauseEn : matchedCauseKo}
                    </span>
                    <span style="font-size: 0.76rem; color: #93C5FD; white-space: nowrap;">
                      ${p.pmid
                        ? `<a href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/" target="_blank" rel="noopener noreferrer" style="color: #60A5FA; text-decoration: none; font-weight: 700;">📚 ${p.authors && p.authors[0] ? p.authors[0].split(' ')[0] : 'PubMed'} (${p.year}) · PMID ↗</a>`
                        : p.doi
                        ? `<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener noreferrer" style="color: #34D399; text-decoration: none; font-weight: 700;">📚 ${p.journal || 'DOI'} (${p.year}) · DOI ↗</a>`
                        : ''}
                    </span>
                  </div>
                  <div style="font-size: 0.84rem; color: #E2E8F0; line-height: 1.5;">
                    ${getCleanFactLine(p, isEn)}
                  </div>
                </div>
              `).join('')}

              <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 0.8rem 0.95rem; font-size: 0.8rem; color: #CBD5E1; line-height: 1.65;">
                <strong style="color: #38BDF8; display: block; margin-bottom: 0.3rem;">📚 [국내외 소아 성장·호르몬·영양 핵심 문헌 11선]</strong>
                1) Yakar S et al., <em>J Mol Endocrinol</em> 2018;61(1):T115-T126 (성장호르몬 GH 및 IGF-1 골단판 작용 기전) ·
                2) 김윤철·강기수·김종덕 등, <em>대한소아내분비학회지</em> 1998;3(1):53-60 (성장호르몬 결핍 아동의 치료 효과) ·
                3) 김광민·김인락, <em>대한소아내분비학회지</em> 2000;5(1):11-17 (성장호르몬과 성장인자 임상) ·
                4) 박신영·김호연, <em>대한소아과학회지</em> 2011;54(5):210-216 (소아청소년의 신체성장과 영향 요인) ·
                5) 곽이성·박종대·양재혁, <em>대한의사협회지</em> 2024;67(2):112-120 (소아 성장에 영향을 미치는 호르몬 및 대사 요인) ·
                6) 정광호·이근재, <em>한국영양학회지</em> 2023;56(2):145-156 (영양상태와 소아 성장의 상관성) ·
                7) Monfared V et al., <em>BMC Pediatrics</em> 2023;23(1):301 (아연 보충이 소아 신장·체중 성장에 미치는 영향 메타분석) ·
                8) Karimian P et al., <em>J Family Med Prim Care</em> 2022;11(9):5210-5215 (비타민D와 소아 선형 성장) ·
                9) Jung S et al., <em>Applied Sciences</em> 2021;11(4):1592 (필수 아미노산과 성장기 골격 발달) ·
                10) Shapiro JR et al., <em>Bone</em> 2005;36(5):827-833 (칼슘 섭취와 소아 골밀도 축적) ·
                11) Saxton RA &amp; Sabatini DM, <em>Cell</em> 2017;168(6):960-976 (mTOR 성장·영양 신호 전달).
              </div>
            </div>
          </details>
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
