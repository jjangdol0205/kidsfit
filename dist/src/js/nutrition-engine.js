/**
 * src/js/nutrition-engine.js
 * Core 2: Bio-Nutrition & Weight-Proportional Bioavailability Engine
 * 
 * Clinical Formulas & Nutritional Invariants:
 * 1. Elemental Calcium Targets:
 *    - Age <= 3: 650 mg/day
 *    - Age 4~8: 800 mg/day
 *    - Age >= 9: 1100 mg/day (1,000~1,200 mg)
 * 2. Calcium Bioavailability Gauges:
 *    - Microcrystalline Hydroxyapatite (MCHA) / Calcium Citrate: ~45% absorption (gastric pH independent)
 *    - Standard Calcium Carbonate: ~22% absorption (requires stomach acid, prone to GI upset)
 *    - Bioavailability Efficiency Ratio: ~2.05x higher
 * 3. Vitamin D3 & Vitamin K2 (MK-7) Synergy:
 *    - Vit D3: Age <= 3: 1,000 IU; Age > 3: 2,000 IU (upregulates Calbindin-D9k)
 *    - Vit K2: Age <= 5: 45 mcg; Age > 5: 75 mcg (activates osteocalcin via gamma-carboxylation)
 * 4. Trace Minerals:
 *    - Zinc Picolinate: Age <= 5: 8 mg; Age > 5: 12 mg (GHR-IGF1 phosphorylation)
 *    - Magnesium Glycinate: Weight(kg) * 4.5 mg (NMDA/GABA slow-wave sleep depth)
 * 5. Bone Matrix Protein & Amino Acids:
 *    - Weight(kg) * 1.3 g (minimum weight floor 5.0 kg)
 *    - Collagen synthesis, L-Arginine, whey protein isolate (WPI)
 */

(function(global) {
  'use strict';

  // 1. Dynamic Weight & Age Proportional Targets Calculator
  function calculateTargets(weightKg, ageYears, isGlobalMode = false) {
    const rawW = Number(weightKg);
    const w = Math.max(5.0, !isNaN(rawW) && rawW > 0 ? rawW : 20.0);
    const age = Math.max(1, Math.min(20, Number(ageYears) || 7));

    // Calcium
    let calciumMg = 800;
    if (age <= 3) calciumMg = 650;
    else if (age >= 9) calciumMg = 1100;

    const calciumCitrateAbsorption = 45;
    const calciumCarbonateAbsorption = 22;
    const bioavailabilityRatio = Math.round((calciumCitrateAbsorption / calciumCarbonateAbsorption) * 100) / 100;

    // Vitamin D3 & K2
    const vitDIU = age <= 3 ? 1000 : 2000;
    const vitK2Mcg = age <= 5 ? 45 : 75;

    // Minerals
    const zincMg = age <= 5 ? 8 : 12;
    const magMg = Math.round(w * 4.5);

    // Protein (1.3g per kg with safety floor of 5.0kg)
    const proteinG = Math.round(w * 1.3 * 10) / 10;

    return {
      weightKg: w,
      ageYears: age,
      calciumMg,
      calciumCitrateAbsorption,
      calciumCarbonateAbsorption,
      bioavailabilityRatio,
      vitDIU,
      vitK2Mcg,
      zincMg,
      magMg,
      proteinG,
      isGlobalMode
    };
  }

  // Alias for compatibility
  function calculateBioNutrients(weightKg, ageYears, isGlobalMode) {
    return calculateTargets(weightKg, ageYears, isGlobalMode);
  }

  // 2. Visual Bioavailability Gauges Component
  function renderBioavailabilityGauges(targets) {
    const citratePct = targets.calciumCitrateAbsorption || 45;
    const carbonatePct = targets.calciumCarbonateAbsorption || 22;
    const ratio = targets.bioavailabilityRatio || 2.05;

    return `
      <div class="bioavailability-gauge-card" style="background: var(--theme-surface-sub, rgba(30, 41, 59, 0.6)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 18px; padding: 1.25rem; margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem;">
          <h5 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            🧪 칼슘 원료별 생체 흡수율(Bioavailability) 비교 게이지
          </h5>
          <span style="background: rgba(16, 185, 129, 0.15); color: #10B981; font-size: 0.78rem; font-weight: 800; padding: 0.2rem 0.65rem; border-radius: 9999px;">
            흡수 효율 약 ${ratio}배 우수
          </span>
        </div>

        <!-- Gauge 1: Citrate / MCHA (~45%) -->
        <div style="margin-bottom: 0.85rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.35rem;">
            <span style="font-weight: 700; color: #38BDF8;">
              ① 구연산 칼슘 / 어골칼슘 (MCHA, Calcium Citrate)
            </span>
            <span style="font-weight: 800; color: #10B981;">~${citratePct}% 흡수 (위산 무관 공복 흡수)</span>
          </div>
          <div style="background: rgba(15, 23, 42, 0.6); border-radius: 9999px; height: 12px; overflow: hidden; position: relative;">
            <div style="background: linear-gradient(90deg, #38BDF8, #10B981); height: 100%; width: ${citratePct * 1.8}%; border-radius: 9999px;"></div>
          </div>
          <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; display: block;">
            위산 분비량과 무관하여 공복에도 안정 흡수되며 위장장애·가스·변비 유발률이 극히 낮음
          </span>
        </div>

        <!-- Gauge 2: Standard Carbonate (~22%) -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.35rem;">
            <span style="font-weight: 700; color: var(--text-secondary);">
              ② 일반 탄산칼슘 (Calcium Carbonate, 조개/석회 유래)
            </span>
            <span style="font-weight: 800; color: #F59E0B;">~${carbonatePct}% 흡수 (강한 위산 필요)</span>
          </div>
          <div style="background: rgba(15, 23, 42, 0.6); border-radius: 9999px; height: 12px; overflow: hidden; position: relative;">
            <div style="background: #64748B; height: 100%; width: ${carbonatePct * 1.8}%; border-radius: 9999px;"></div>
          </div>
          <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; display: block;">
            식후 강한 위산이 필수적이며 소아·청소년의 38%에서 더부룩함 및 변비 유발
          </span>
        </div>
      </div>
    `;
  }

  // 3. Master Bio-Nutrition Section Renderer
  function renderNutritionSection(profile = {}, affConfig = {}, isGlobalMode = false) {
    const ageYears = profile.ageYears || (profile.ageMonths ? Math.round(profile.ageMonths / 12) : 10);
    const weightKg = profile.currentWeight || 35.5;
    const targets = calculateTargets(weightKg, ageYears, isGlobalMode);

    return `
      <div id="core-2-nutrition-sub">
        
        <!-- Header -->
        <div style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            🥗 체중 비례 정밀 영양 처방 &amp; 생체이용률(Bioavailability) 매트릭스
          </h4>
          <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0.25rem 0 0 0;">
            현재 체중(${targets.weightKg}kg) 및 만 ${targets.ageYears}세 골격 성장 속도에 최적화된 하루 필수 영양소 정량 계산
          </p>
        </div>

        <!-- 4 Nutrient Bento Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          
          <!-- Card 1: Calcium -->
          <div style="background: var(--theme-surface-card, rgba(15, 23, 42, 0.74)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 20px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 1.3rem;">🥛</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #38BDF8; background: rgba(56, 189, 248, 0.12); padding: 0.2rem 0.55rem; border-radius: 6px;">
                골격 기질 광물화
              </span>
            </div>
            <div style="font-size: 0.84rem; font-weight: 700; color: var(--text-secondary);">원소 칼슘 (Elemental Calcium)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #38BDF8; margin: 0.25rem 0;">
              ${targets.calciumMg} <span style="font-size: 0.9rem; font-weight: 600;">mg/일</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
              위산 무관 흡수 구연산 칼슘 또는 어골칼슘(MCHA) 형태 권장. 1회 400mg 이하 분할 섭취 시 흡수율 극대화.
            </p>
          </div>

          <!-- Card 2: Vitamin D3 + K2 -->
          <div style="background: var(--theme-surface-card, rgba(15, 23, 42, 0.74)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 20px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 1.3rem;">☀️</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #F59E0B; background: rgba(245, 158, 11, 0.12); padding: 0.2rem 0.55rem; border-radius: 6px;">
                오스테오칼신 활성화
              </span>
            </div>
            <div style="font-size: 0.84rem; font-weight: 700; color: var(--text-secondary);">활성형 D3 + K2 (MK-7)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #F59E0B; margin: 0.25rem 0;">
              ${targets.vitDIU} <span style="font-size: 0.85rem; font-weight: 600;">IU</span> + ${targets.vitK2Mcg} <span style="font-size: 0.85rem; font-weight: 600;">mcg</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
              D3는 장내 칼슘 수송단백(Calbindin-D9k)을 증폭하고, K2는 오스테오칼신 감마-카르복실화로 칼슘을 성장판 뼈로 침착시킵니다.
            </p>
          </div>

          <!-- Card 3: Zinc + Magnesium -->
          <div style="background: var(--theme-surface-card, rgba(15, 23, 42, 0.74)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 20px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 1.3rem;">⚡</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.12); padding: 0.2rem 0.55rem; border-radius: 6px;">
                GHR-IGF1 &amp; SWS 수면
              </span>
            </div>
            <div style="font-size: 0.84rem; font-weight: 700; color: var(--text-secondary);">피콜린산 아연 + 킬레이트 마그네슘</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.25rem 0;">
              ${targets.zincMg} <span style="font-size: 0.85rem; font-weight: 600;">mg</span> + ${targets.magMg} <span style="font-size: 0.85rem; font-weight: 600;">mg</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
              아연은 간세포 성장호르몬 수용체(GHR) 인산화 촉진, 글리시네이트 마그네슘(체중×4.5mg)은 GABA 서파수면 깊이를 증진합니다.
            </p>
          </div>

          <!-- Card 4: Bone Matrix Protein -->
          <div style="background: var(--theme-surface-card, rgba(15, 23, 42, 0.74)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 20px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 1.3rem;">🥩</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #EC4899; background: rgba(236, 72, 153, 0.12); padding: 0.2rem 0.55rem; border-radius: 6px;">
                콜라겐 유기 기질
              </span>
            </div>
            <div style="font-size: 0.84rem; font-weight: 700; color: var(--text-secondary);">뼈 기질 단백질 (체중 × 1.3g)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #EC4899; margin: 0.25rem 0;">
              ${targets.proteinG} <span style="font-size: 0.9rem; font-weight: 600;">g/일</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
              뼈 부피의 30%를 차지하는 유기 콜라겐 네트워크 형성을 위한 필수 아미노산 및 L-아르기닌(1.5~3g) 공급 목표.
            </p>
          </div>

        </div>

        <!-- Bioavailability Visual Comparison Gauges -->
        ${renderBioavailabilityGauges(targets)}

        <!-- Academic Research Citations with clickable PMID & DOI -->
        ${(function() {
          const rc = (typeof window !== 'undefined' && window.TallerReferenceChips) || 
                     (typeof global !== 'undefined' && global.TallerReferenceChips) ||
                     (typeof require !== 'undefined' ? (function() { try { return require('./reference-chips'); } catch(e) { return null; } })() : null);
          if (rc && typeof rc.renderCitations === 'function') {
            return rc.renderCitations(['growth_endocrinology'], 3, isGlobalMode);
          }
          return '';
        })()}

        <!-- Discrete 12px Academic Reference Chip -->
        <div id="ref-chip-nutrition" class="reference-chips-wrapper" style="margin-top: 1rem; display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          ${(function() {
            const rc = (typeof window !== 'undefined' && window.TallerReferenceChips) || 
                       (typeof global !== 'undefined' && global.TallerReferenceChips) ||
                       (typeof require !== 'undefined' ? (function() { try { return require('./reference-chips'); } catch(e) { return null; } })() : null);
            if (rc && typeof rc.getReferenceChipsHtml === 'function') {
              return rc.getReferenceChipsHtml('calcium', isGlobalMode, affConfig);
            }
            return `
              <a href="https://kr.iherb.com/search?kw=%EA%B5%AC%EC%97%B0%EC%82%B0+%EC%B9%BC%EC%8A%B4&rcode=KIDSBIO" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="reference-chip" 
                 id="ref-chip-nutrition"
                 style="font-size: 12px; color: var(--text-secondary); border: 1px solid var(--theme-border); padding: 0.35rem 0.75rem; border-radius: 9999px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; background: var(--theme-surface-sub);">
                <span>🌿</span>
                <span>${isGlobalMode ? '[Ingredient Spec Reference (iHerb) ↗]' : '[성분 스펙 레퍼런스 (iHerb) ↗]'}</span>
              </a>
            `;
          })()}
        </div>

      </div>
    `;
  }

  // 4. Combined Master Core 2 Report Renderer
  function renderTab2Report(profile = {}, affConfig = {}, isGlobalMode = false) {
    const endoEngine = (typeof window !== 'undefined' && window.KidsFitEndocrinologyEngine) || 
                      (typeof global !== 'undefined' && global.KidsFitEndocrinologyEngine);

    const endoHtml = endoEngine ? endoEngine.renderEndocrinologySection(profile) : '';
    const nutritionHtml = renderNutritionSection(profile, affConfig, isGlobalMode);

    return `
      <!-- Core 2 Container -->
      <div id="core-2-container" class="core-module-container">
        ${endoHtml}
        ${nutritionHtml}
      </div>
    `;
  }

  // Dual Export
  const NutritionEngine = {
    calculateTargets,
    calculateBioNutrients,
    renderBioavailabilityGauges,
    renderNutritionSection,
    renderTab2Report
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NutritionEngine;
  }
  if (typeof window !== 'undefined') {
    window.KidsFitNutritionEngine = NutritionEngine;
    window.TallerNutritionEngine = NutritionEngine;
  }
  if (typeof global !== 'undefined' && typeof window === 'undefined') {
    global.KidsFitNutritionEngine = NutritionEngine;
    global.TallerNutritionEngine = NutritionEngine;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
