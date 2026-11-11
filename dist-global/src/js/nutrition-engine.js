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

  function isGlobalEnRuntime(explicitFlag) {
    if (explicitFlag === true) return true;
    if (explicitFlag === false) return false;
    if (typeof window !== 'undefined' && window.__KIDSFIT_GLOBAL_PAID_EDITION === true) return true;
    if (typeof global !== 'undefined' && global.__KIDSFIT_GLOBAL_PAID_EDITION === true) return true;
    if (typeof document !== 'undefined' && document.documentElement) {
      const lang = String(document.documentElement.lang || '').toLowerCase();
      const edition = typeof document.documentElement.getAttribute === 'function'
        ? document.documentElement.getAttribute('data-edition')
        : '';
      if (lang.startsWith('en') || edition === 'global-paid') return true;
    }
    if (typeof window !== 'undefined' && window.location && /kisfitglobal\.com|kidsfitglobal\.com/i.test(String(window.location.hostname || ''))) {
      return true;
    }
    return false;
  }

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
  function renderBioavailabilityGauges(targets, isGlobalMode = null) {
    const useGlobal = isGlobalEnRuntime(isGlobalMode !== null ? isGlobalMode : (targets && typeof targets.isGlobalMode === 'boolean' ? targets.isGlobalMode : null));
    const citratePct = targets.calciumCitrateAbsorption || 45;
    const carbonatePct = targets.calciumCarbonateAbsorption || 22;
    const ratio = targets.bioavailabilityRatio || 2.05;

    return `
      <div class="bioavailability-gauge-card" style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 18px; padding: 1.25rem; margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem;">
          <h5 style="font-size: 0.95rem; font-weight: 800; color: #0F172A; margin: 0;">
            ${useGlobal ? 'Calcium Source Bioavailability Comparison Gauge' : '칼슘 원료별 생체 흡수율(Bioavailability) 비교 게이지'}
          </h5>
          <span style="background: #EFF6FF; color: #1D4ED8; font-size: 0.78rem; font-weight: 800; padding: 0.2rem 0.65rem; border-radius: 9999px;">
            ${useGlobal ? `~${ratio}x Higher Absorption` : `흡수 효율 약 ${ratio}배 우수`}
          </span>
        </div>

        <!-- Gauge 1: Citrate / MCHA (~45%) -->
        <div style="margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem;">
            <span style="font-weight: 700; color: #1D4ED8;">
              ${useGlobal ? '① Calcium Citrate / Microcrystalline MCHA' : '① 구연산 칼슘 / 어골칼슘 (MCHA, Calcium Citrate)'}
            </span>
            <span style="font-weight: 800; color: #1D4ED8;">${useGlobal ? `~${citratePct}% Absorbed (pH-independent · Gentle on GI)` : `~${citratePct}% 흡수 (공복 흡수·변비 없음)`}</span>
          </div>
          <div style="background: #E2E8F0; border: 1px solid #CBD5E1; border-radius: 9999px; height: 12px; overflow: hidden; position: relative;">
            <div style="background: #1D4ED8; height: 100%; width: ${citratePct * 1.8}%; border-radius: 9999px;"></div>
          </div>
        </div>

        <!-- Gauge 2: Standard Carbonate (~22%) -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem;">
            <span style="font-weight: 700; color: #334155;">
              ${useGlobal ? '② Standard Calcium Carbonate (Oyster/Limestone)' : '② 일반 탄산칼슘 (Calcium Carbonate, 조개/석회 유래)'}
            </span>
            <span style="font-weight: 800; color: #1D4ED8;">${useGlobal ? `~${carbonatePct}% Absorbed (Requires post-meal gastric acid)` : `~${carbonatePct}% 흡수 (식후 위산 필요)`}</span>
          </div>
          <div style="background: #E2E8F0; border: 1px solid #CBD5E1; border-radius: 9999px; height: 12px; overflow: hidden; position: relative;">
            <div style="background: #64748B; height: 100%; width: ${carbonatePct * 1.8}%; border-radius: 9999px;"></div>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Master Bio-Nutrition Section Renderer
  function renderNutritionSection(profile = {}, affConfig = {}, isGlobalMode = null) {
    const useGlobal = isGlobalEnRuntime(isGlobalMode !== null ? isGlobalMode : (profile && profile.language === 'en' ? true : null));
    const ageYears = profile.ageYears || (profile.ageMonths ? Math.round(profile.ageMonths / 12) : 10);
    const weightKg = profile.currentWeight || 35.5;
    const targets = calculateTargets(weightKg, ageYears, useGlobal);
    const weightLbs = Math.round(targets.weightKg * 2.20462262 * 10) / 10;

    return `
      <div id="core-2-nutrition-sub">
        
        <!-- Header -->
        <div style="margin-bottom: 1rem;">
          <h4 style="font-size: 1.15rem; font-weight: 800; color: #0F172A; margin: 0;">
            ${useGlobal
              ? `Daily Micronutrient &amp; Bone-Matrix Targets (Weight ${weightLbs} lbs / ${targets.weightKg} kg · Age ${targets.ageYears} yrs)`
              : `체중(${targets.weightKg}kg) · 만 ${targets.ageYears}세 하루 권장 영양 정량 요약`}
          </h4>
        </div>

        <!-- 4 Nutrient Bento Grid (Clean 1-Card-Per-Row Layout) -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.15rem;">
          
          <!-- Card 1: Calcium -->
          <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 18px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.9rem; font-weight: 800; color: #0F172A;">${useGlobal ? 'Elemental Calcium' : '원소 칼슘'}</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #1D4ED8; background: #EFF6FF; padding: 0.18rem 0.5rem; border-radius: 6px;">${useGlobal ? 'Bone Mineralization' : '뼈 광물화'}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 900; color: #1D4ED8; margin: 0.2rem 0;">
              ${targets.calciumMg} <span style="font-size: 0.88rem; font-weight: 600;">${useGlobal ? 'mg/day' : 'mg/일'}</span>
            </div>
            <p style="font-size: 0.85rem; color: #0F172A; line-height: 1.45; margin: 0;">
              ${useGlobal ? '• Split doses (≤400 mg per serving) using GI-gentle Calcium Citrate or MCHA' : '• 속 쓰림 없는 구연산·어골칼슘 1회 400mg 이하 분할 섭취'}
            </p>
          </div>

          <!-- Card 2: Vitamin D3 + K2 -->
          <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 18px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.9rem; font-weight: 800; color: #0F172A;">${useGlobal ? 'Vitamin D3 + K2 (MK-7)' : '비타민 D3 + K2'}</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #1D4ED8; background: #EFF6FF; padding: 0.18rem 0.5rem; border-radius: 6px;">${useGlobal ? 'Osteocalcin Activation' : '칼슘 뼈 침착'}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 900; color: #1D4ED8; margin: 0.2rem 0;">
              ${targets.vitDIU} <span style="font-size: 0.85rem; font-weight: 600;">IU</span> + ${targets.vitK2Mcg} <span style="font-size: 0.85rem; font-weight: 600;">mcg</span>
            </div>
            <p style="font-size: 0.85rem; color: #0F172A; line-height: 1.45; margin: 0;">
              ${useGlobal ? '• Upregulates intestinal calcium absorption and directs deposition into epiphyseal bone matrix' : '• 장내 칼슘 흡수를 돕고 성장판 뼈 기질로 직접 운반'}
            </p>
          </div>

          <!-- Card 3: Zinc + Magnesium -->
          <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 18px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.9rem; font-weight: 800; color: #0F172A;">${useGlobal ? 'Zinc + Magnesium Glycinate' : '아연 + 마그네슘'}</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #1D4ED8; background: #EFF6FF; padding: 0.18rem 0.5rem; border-radius: 6px;">${useGlobal ? 'IGF-1 &amp; Deep SWS' : 'IGF-1 &amp; 숙면'}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 900; color: #1D4ED8; margin: 0.2rem 0;">
              ${targets.zincMg} <span style="font-size: 0.85rem; font-weight: 600;">mg</span> + ${targets.magMg} <span style="font-size: 0.85rem; font-weight: 600;">mg</span>
            </div>
            <p style="font-size: 0.85rem; color: #0F172A; line-height: 1.45; margin: 0;">
              ${useGlobal ? '• Supports hepatic IGF-1 synthesis and 10 PM slow-wave delta sleep depth' : '• 성장인자(IGF-1) 합성 촉진 및 밤 10시 깊은 서파수면 유도'}
            </p>
          </div>

          <!-- Card 4: Bone Matrix Protein -->
          <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 18px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.9rem; font-weight: 800; color: #0F172A;">${useGlobal ? 'Bone Matrix Protein' : '뼈 기질 단백질'}</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #1D4ED8; background: #EFF6FF; padding: 0.18rem 0.5rem; border-radius: 6px;">${useGlobal ? 'Weight × 1.3 g/kg' : '체중 × 1.3g'}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 900; color: #1D4ED8; margin: 0.2rem 0;">
              ${targets.proteinG} <span style="font-size: 0.88rem; font-weight: 600;">${useGlobal ? 'g/day' : 'g/일'}</span>
            </div>
            <p style="font-size: 0.85rem; color: #0F172A; line-height: 1.45; margin: 0;">
              ${useGlobal ? '• Supplies essential amino acids for epiphyseal chondrocyte &amp; collagen scaffolding' : '• 성장판 연골·콜라겐 뼈대를 세우는 필수 아미노산 공급'}
            </p>
          </div>

        </div>

        <!-- Bioavailability Visual Comparison Gauges -->
        ${renderBioavailabilityGauges(targets, useGlobal)}

        <!-- Academic Research Citations with clickable PMID & DOI -->
        ${(function() {
          const rc = (typeof window !== 'undefined' && window.TallerReferenceChips) || 
                     (typeof global !== 'undefined' && global.TallerReferenceChips) ||
                     (typeof require !== 'undefined' ? (function() { try { return require('./reference-chips'); } catch(e) { return null; } })() : null);
          if (rc && typeof rc.renderCitations === 'function') {
            return rc.renderCitations(['growth_endocrinology'], 3, useGlobal);
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
              return rc.getReferenceChipsHtml('calcium', useGlobal, affConfig);
            }
            const fallbackHref = useGlobal
              ? 'https://www.iherb.com/search?kw=ChildLife+Liquid+Calcium+Magnesium&rcode=IPZ1547'
              : 'https://kr.iherb.com/search?kw=%EA%B5%AC%EC%97%B0%EC%82%B0+%EC%B9%BC%EC%8A%B4&rcode=IPZ1547';
            return `
              <a href="${fallbackHref}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="reference-chip" 
                 id="ref-chip-nutrition"
                 style="font-size: 12px; color: #334155; border: 1px solid var(--theme-border); padding: 0.35rem 0.75rem; border-radius: 9999px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; background: var(--theme-surface-sub);">
                <span></span>
                <span>${useGlobal ? '[Ingredient Spec Reference (iHerb) ↗]' : '[성분 스펙 레퍼런스 (iHerb) ↗]'}</span>
              </a>
            `;
          })()}
        </div>

      </div>
    `;
  }

  // 4. Combined Master Core 2 Report Renderer
  function renderTab2Report(profile = {}, affConfig = {}, isGlobalMode = null) {
    const useGlobal = isGlobalEnRuntime(isGlobalMode !== null ? isGlobalMode : (profile && profile.language === 'en' ? true : null));
    const endoEngine = (typeof window !== 'undefined' && window.KidsFitEndocrinologyEngine) || 
                      (typeof global !== 'undefined' && global.KidsFitEndocrinologyEngine);

    const endoHtml = endoEngine ? endoEngine.renderEndocrinologySection(profile, useGlobal) : '';
    const nutritionHtml = renderNutritionSection(profile, affConfig, useGlobal);

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
