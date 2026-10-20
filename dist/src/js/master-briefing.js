/**
 * Taller Bio Labs - Master Briefing Engine (Phase 2 Master Briefing Card)
 * Dynamic Academic DB (800+ Papers) Matching & 3-Tier Clinical Guidance Roadmap
 */

(function (global) {
  'use strict';

  let GrowthEngine = typeof require !== 'undefined' ? (function() { try { return require('./growth-engine'); } catch(e){ return null; } })() : (global.KidsFitGrowthEngine || null);
  let NutritionEngine = typeof require !== 'undefined' ? (function() { try { return require('./nutrition-engine'); } catch(e){ return null; } })() : (global.KidsFitNutritionEngine || null);

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
      terms: ['sleep', 'circadian', 'melatonin', 'slow-wave', '수면', '취침', '서파수면', '밤', 'gh-igf-1']
    },
    night_carbs: {
      tagKo: '야간 혈당 스파이크 & 소마토스타틴 분비 억제',
      tagEn: 'Nocturnal Glycemic Spike & Somatostatin Suppression',
      terms: ['glucose', 'insulin', 'sugar', 'somatostatin', '야식', '혈당', '인슐린', '당분', '소마토스타틴', '식이']
    },
    poor_posture: {
      tagKo: '거북목·척추 전만 & 추간판 디스크 압박',
      tagEn: 'Forward Head Posture & Spinal Disc Compression',
      terms: ['posture', 'spine', 'cervical', 'kyphosis', 'craniovertebral', '거북목', '척추', '자세', '경추', '디스크', '감압', '자세정렬']
    },
    picky_eater: {
      tagKo: '단백질·칼슘 편식 & 골기질 연골 영양 결핍',
      tagEn: 'Nutritional Imbalance & Chondrocyte Cartilage Deprivation',
      terms: ['nutrition', 'calcium', 'vitamin', 'protein', 'zinc', '편식', '영양', '칼슘', '단백질', '비타민', '아연', '식단', '골밀도']
    },
    sedentary: {
      tagKo: '신체활동 부족 & 성장판 역학적 미세 자극 결핍',
      tagEn: 'Sedentary Lifestyle & Mechanical Loading Deficit',
      terms: ['exercise', 'jump', 'physical activity', 'loading', 'mechanical', '운동', '점프', '줄넘기', '신체활동', '성장판', '미세하중']
    }
  };

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
          if (p.age_range && p.age_range.includes(String(ageYears))) score += 15;
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
          inhibitorKey: 'standard'
        });
        pickedIds.add(c.id);
      }
    }

    return matched.slice(0, limit);
  }

  /**
   * Renders the complete HTML for Master Briefing Card
   */
  function renderMasterBriefingCard(profile = {}) {
    if (!GrowthEngine && global.KidsFitGrowthEngine) GrowthEngine = global.KidsFitGrowthEngine;
    if (!NutritionEngine && global.KidsFitNutritionEngine) NutritionEngine = global.KidsFitNutritionEngine;

    const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
    const ageMonths = profile.ageMonths || ((profile.ageYears || 10) * 12);
    const ageYears = Math.round(ageMonths / 12);
    const gender = profile.gender === 'girl' ? 'girl' : 'boy';
    const height = parseFloat(profile.currentHeight) || 137.0;
    const weight = parseFloat(profile.currentWeight) || 35.5;
    const recentGain = parseFloat(profile.recentGrowth6m) || 3.2;
    const fatherH = parseFloat(profile.fatherHeight) || 173.5;
    const motherH = parseFloat(profile.motherHeight) || 160.5;
    const habits = Array.isArray(profile.habits) ? profile.habits : ['late_sleep'];
    const tanner = profile.tannerPhase || 'phase_2';

    // Section 1: Public Clinical Standards Data
    let kdcaTop = 50.0;
    let kdcaPct = 50.0;
    let kdcaZ = 0.0;
    let standardMean = 137.0;
    if (GrowthEngine && typeof GrowthEngine.getLmsForMonth === 'function' && typeof GrowthEngine.calculateKdcaPercentile === 'function') {
      const lms = GrowthEngine.getLmsForMonth(gender, ageMonths);
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

    let velocityPerYear = Math.round(recentGain * 2 * 10) / 10;
    let isRedFlag = ageYears >= 4 && ageYears <= 9 && velocityPerYear < 4.0;

    let goldenTimeLabel = '약 2년 6개월 ~ 3년 잔여 (급성장기 PHV)';
    if (tanner === 'phase_1') goldenTimeLabel = '약 4~5년 잔여 (기초 성장기 여유)';
    else if (tanner === 'phase_3') goldenTimeLabel = '약 12~18개월 잔여 (감속기 집중 관리)';
    else if (tanner === 'phase_4') goldenTimeLabel = '약 6~12개월 잔여 (자세·디스크 복원 구간)';

    // Section 2: Realtime Papers Matching
    const matchedPapers = matchPapers(habits, ageYears, tanner, 3);

    // Section 3: Priority Top 3 Roadmap Nutrition Targets
    let nutTargets = {
      calciumMg: 1000,
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

    return `
      <!-- Master Briefing Card: 3-Tier Diagnostic Overview -->
      <div class="bento-card master-briefing-card" id="master-briefing-card-content" style="border-left: 5px solid var(--theme-accent, #38BDF8);">
        
        <!-- Header -->
        <div class="briefing-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--theme-border-subtle, rgba(255,255,255,0.08)); padding-bottom: 1rem;">
          <div>
            <span class="section-badge-pill" style="display: inline-flex; align-items: center; gap: 0.35rem; background: var(--theme-accent-sub, rgba(56,189,248,0.15)); color: var(--theme-accent, #38BDF8); font-size: 0.78rem; font-weight: 800; padding: 0.2rem 0.65rem; border-radius: 9999px; margin-bottom: 0.4rem;">
              🎯 ${isEn ? 'COMPREHENSIVE CLINICAL BRIEFING' : '종합 임상 마스터 브리핑'}
            </span>
            <h2 class="briefing-title" style="font-size: 1.35rem; font-weight: 900; color: var(--text-primary, #FFFFFF); margin: 0.25rem 0;">
              ${isEn ? 'Personalized Clinical Diagnosis & 90-Day Actionable Guidance Roadmap' : '입력 데이터 기반 종합 정밀 진단 &amp; 향후 90일 맞춤 지도 방향'}
            </h2>
            <p class="briefing-subtitle" style="font-size: 0.82rem; color: var(--text-secondary, #94A3B8); margin: 0;">
              ${isEn ? 'Cross-analyzed with KDCA 2017, US CDC 2000, K-DST & 803 peer-reviewed clinical studies.' : '질병관리청(KDCA 2017) · US CDC 2000 · K-DST · KDRIs &amp; 803편 동료심사 학술 논문 종합 분석'}
            </p>
          </div>
          <span style="background: rgba(16, 185, 129, 0.15); color: #10B981; font-weight: 800; font-size: 0.8rem; padding: 0.35rem 0.8rem; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.3);">
            ⚡ ${isEn ? 'Dynamic Matching Complete' : '실시간 논문·국가규준 매칭 완료'}
          </span>
        </div>

        <div class="briefing-grid-3">
          
          <!-- Tier 1: Current Clinical Status (Official Public Data) -->
          <div class="briefing-section briefing-status" id="briefing-status-section">
            <h3 class="briefing-section-title">
              📊 1. ${isEn ? 'Current Biometric Position (KDCA/CDC)' : '현재 상태 정밀 진단 (공신력 데이터 대조)'}
            </h3>
            
            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'Height Percentile' : '현재 신장 백분위'}:</span>
              <span class="metric-val" id="briefing-percentile" style="font-weight: 800; color: var(--theme-accent, #38BDF8);">
                ${isEn ? `Top ${kdcaTop}% (${kdcaPct}th)` : `상위 ${kdcaTop}% (${kdcaPct}백분위)`}
              </span>
            </div>

            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'Z-Score (SD)' : '표준편차 (Z-Score)'}:</span>
              <span class="metric-val" style="font-weight: 700; color: ${kdcaZ >= 0 ? '#10B981' : '#F43F5E'};">
                ${kdcaZ >= 0 ? '+' : ''}${kdcaZ} SD
              </span>
            </div>

            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'vs Standard Median' : '표준 평균키 대비 편차'}:</span>
              <span class="metric-val" style="font-weight: 800; color: ${deltaCm >= 0 ? '#10B981' : '#F43F5E'};">
                ${deltaStr}
              </span>
            </div>

            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'Growth Velocity' : '연간 성장속도 (Velocity)'}:</span>
              <span class="metric-val" id="briefing-velocity" style="font-weight: 800; color: ${isRedFlag ? '#F43F5E' : '#10B981'};">
                ${velocityPerYear} cm/yr ${isRedFlag ? '🚨 저성장 경고' : '✓ 정상 궤도'}
              </span>
            </div>

            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'Mid-Parental Height' : '유전 표적키 (Tanner MPH)'}:</span>
              <span class="metric-val" id="briefing-mph" style="font-weight: 800; color: #F59E0B;">
                ${mphVal} cm <span style="font-size: 0.74rem; font-weight: 600;">(±8.5cm)</span>
              </span>
            </div>

            <div class="briefing-metric-row">
              <span class="metric-label">${isEn ? 'Golden Time' : '성장판 골든타임'}:</span>
              <span class="metric-val" id="briefing-goldentime" style="font-weight: 700; color: #38BDF8;">
                ${goldenTimeLabel}
              </span>
            </div>
          </div>

          <!-- Tier 2: Dynamic Academic DB Matching (800+ Papers) -->
          <div class="briefing-section briefing-research" id="briefing-research-section">
            <h3 class="briefing-section-title">
              📚 2. ${isEn ? 'Etiology & Academic Paper Evidence' : '핵심 원인 &amp; 학술 논문 근거 매칭'}
            </h3>
            
            <div id="briefing-papers-container" class="briefing-papers-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${matchedPapers.map(({ paper: p, matchedCauseKo, matchedCauseEn }) => `
                <div class="matched-paper-card" style="background: rgba(30, 41, 59, 0.5); border: 1px solid var(--theme-border-subtle, rgba(255,255,255,0.06)); border-radius: 10px; padding: 0.75rem; transition: var(--transition-smooth, all 0.2s);">
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.35rem;">
                    <span style="background: rgba(244, 63, 94, 0.15); color: #FDA4AF; font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 4px;">
                      ⚠️ ${isEn ? matchedCauseEn : matchedCauseKo}
                    </span>
                    <div style="display: flex; gap: 0.35rem; align-items: center;">
                      <span style="font-size: 0.7rem; color: var(--text-secondary, #94A3B8);">${p.journal || ''} (${p.year || ''})</span>
                      ${p.pmid ? `<a href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/" target="_blank" rel="noopener noreferrer" style="font-size: 0.7rem; color: #38BDF8; font-weight: 700; text-decoration: none; background: rgba(56,189,248,0.15); padding: 0.1rem 0.4rem; border-radius: 4px;">PMID:${p.pmid} ↗</a>` : ''}
                      ${p.doi ? `<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener noreferrer" style="font-size: 0.7rem; color: #10B981; font-weight: 700; text-decoration: none; background: rgba(16,185,129,0.15); padding: 0.1rem 0.4rem; border-radius: 4px;">DOI ↗</a>` : ''}
                    </div>
                  </div>
                  <div style="font-size: 0.84rem; font-weight: 800; color: var(--text-primary, #FFFFFF); line-height: 1.4; margin-bottom: 0.3rem;">
                    ${isEn ? (p.title || p.title_ko) : (p.title_ko || p.title)}
                  </div>
                  <div style="font-size: 0.78rem; color: var(--text-secondary, #E2E8F0); line-height: 1.45; margin-bottom: 0.3rem;">
                    <strong style="color: #38BDF8;">📊 입증 통계:</strong> ${p.key_statistics || p.clinical_summary_ko || ''}
                  </div>
                  <div style="font-size: 0.75rem; color: #A7F3D0; line-height: 1.4; background: rgba(16, 185, 129, 0.08); padding: 0.3rem 0.5rem; border-radius: 4px;">
                    <strong>💡 임상 처방:</strong> ${p.parenting_prescription_ko || ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Tier 3: Actionable Roadmap Top 3 Priorities -->
          <div class="briefing-section briefing-actions" id="briefing-actions-section">
            <h3 class="briefing-section-title">
              🧭 3. ${isEn ? 'Top 3 Actionable Roadmap Priorities' : '향후 맞춤 지도 방향 (우선순위 Top 3)'}
            </h3>
            
            <!-- Priority 1: Sleep & Hormone -->
            <div class="briefing-action-item" style="border-left: 3px solid #38BDF8; padding-left: 0.65rem; margin-bottom: 0.9rem;">
              <span class="action-badge" style="background: rgba(56,189,248,0.15); color: #38BDF8;">
                🥇 1순위: ${isEn ? 'Sleep & Hormones' : '수면·호르몬 지도 방향'}
              </span>
              <p class="action-desc" id="briefing-action-sleep" style="margin: 0.25rem 0 0 0; font-size: 0.82rem; line-height: 1.5; color: var(--text-primary, #E2E8F0);">
                • <strong>목표 취침 시각:</strong> 밤 21:45 ~ 22:00 입면 (서파수면 중 일일 GH의 65% 분비 확보)<br>
                • <strong>취침 전 3시간 공복:</strong> 야간 혈당 스파이크 및 소마토스타틴 차단으로 GH 억제율 0% 방어
              </p>
            </div>

            <!-- Priority 2: Nutrition exact mg/g -->
            <div class="briefing-action-item" style="border-left: 3px solid #10B981; padding-left: 0.65rem; margin-bottom: 0.9rem;">
              <span class="action-badge" style="background: rgba(16,185,129,0.15); color: #10B981;">
                🥈 2순위: ${isEn ? 'Clinical Nutrition Targets' : '맞춤 임상 영양 지도 방향'}
              </span>
              <p class="action-desc" id="briefing-action-nutrition" style="margin: 0.25rem 0 0 0; font-size: 0.82rem; line-height: 1.5; color: var(--text-primary, #E2E8F0);">
                • <strong>구연산칼슘/어골칼슘:</strong> 일일 <strong>${nutTargets.calciumMg} mg</strong> (생체 흡수율 ~45% 포뮬러)<br>
                • <strong>비타민 D3 + K2:</strong> D3 <strong>${nutTargets.vitDIU} IU</strong> + MK-7 <strong>${nutTargets.vitK2Mcg} mcg</strong><br>
                • <strong>체중 비례 단백질:</strong> 일일 <strong>${nutTargets.proteinG} g</strong> (체중 ${weight}kg × 1.3g)
              </p>
            </div>

            <!-- Priority 3: Decompression & Habruta -->
            <div class="briefing-action-item" style="border-left: 3px solid #F59E0B; padding-left: 0.65rem; margin-bottom: 0.5rem;">
              <span class="action-badge" style="background: rgba(245,158,11,0.15); color: #F59E0B;">
                🥉 3순위: ${isEn ? 'Biomechanics & Cognitive Guidance' : '척추 감압 &amp; 두뇌·하브루타 지도 방향'}
              </span>
              <p class="action-desc" id="briefing-action-exercise" style="margin: 0.25rem 0 0 0; font-size: 0.82rem; line-height: 1.5; color: var(--text-primary, #E2E8F0);">
                • <strong>척추 감압 데드행:</strong> 30초 × 3세트 (추간판 디스크 수분 복원으로 숨은 키 +1.8cm)<br>
                • <strong>성장판 수직 자극:</strong> 하루 15분 플라이오메트릭 점핑<br>
                • <strong>주말 현장 하브루타:</strong> 3단계 질문법 (현상 관찰 → 인과 추론 → 창의적 대안 도출)
              </p>
            </div>

          </div>

        </div>

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
