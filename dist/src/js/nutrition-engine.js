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
        <div style="margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem;">
            <span style="font-weight: 700; color: #38BDF8;">
              ① 구연산 칼슘 / 어골칼슘 (MCHA, Calcium Citrate)
            </span>
            <span style="font-weight: 800; color: #10B981;">~${citratePct}% 흡수 (공복 흡수·변비 없음)</span>
          </div>
          <div style="background: rgba(15, 23, 42, 0.6); border-radius: 9999px; height: 12px; overflow: hidden; position: relative;">
            <div style="background: linear-gradient(90deg, #38BDF8, #10B981); height: 100%; width: ${citratePct * 1.8}%; border-radius: 9999px;"></div>
          </div>
        </div>

        <!-- Gauge 2: Standard Carbonate (~22%) -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem;">
            <span style="font-weight: 700; color: var(--text-secondary);">
              ② 일반 탄산칼슘 (Calcium Carbonate, 조개/석회 유래)
            </span>
            <span style="font-weight: 800; color: #F59E0B;">~${carbonatePct}% 흡수 (식후 위산 필요)</span>
          </div>
          <div style="background: rgba(15, 23, 42, 0.6); border-radius: 9999px; height: 12px; overflow: hidden; position: relative;">
            <div style="background: #64748B; height: 100%; width: ${carbonatePct * 1.8}%; border-radius: 9999px;"></div>
          </div>
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
        <div style="margin-bottom: 1rem;">
          <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            🥗 체중(${targets.weightKg}kg) · 만 ${targets.ageYears}세 하루 권장 영양 정량 요약
          </h4>
        </div>

        <!-- 4 Nutrient Bento Grid (Concise 1-Line Summary) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.9rem; margin-bottom: 1.15rem;">
          
          <!-- Card 1: Calcium -->
          <div style="background: var(--theme-surface-card, rgba(15, 23, 42, 0.74)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 18px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.9rem; font-weight: 800; color: #F8FAFC;">🥛 원소 칼슘</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #38BDF8; background: rgba(56, 189, 248, 0.12); padding: 0.18rem 0.5rem; border-radius: 6px;">뼈 광물화</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 900; color: #38BDF8; margin: 0.2rem 0;">
              ${targets.calciumMg} <span style="font-size: 0.88rem; font-weight: 600;">mg/일</span>
            </div>
            <p style="font-size: 0.85rem; color: #E2E8F0; line-height: 1.45; margin: 0;">
              • 속 쓰림 없는 구연산·어골칼슘 1회 400mg 이하 분할 섭취
            </p>
          </div>

          <!-- Card 2: Vitamin D3 + K2 -->
          <div style="background: var(--theme-surface-card, rgba(15, 23, 42, 0.74)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 18px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.9rem; font-weight: 800; color: #F8FAFC;">☀️ 비타민 D3 + K2</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #F59E0B; background: rgba(245, 158, 11, 0.12); padding: 0.18rem 0.5rem; border-radius: 6px;">칼슘 뼈 침착</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 900; color: #F59E0B; margin: 0.2rem 0;">
              ${targets.vitDIU} <span style="font-size: 0.85rem; font-weight: 600;">IU</span> + ${targets.vitK2Mcg} <span style="font-size: 0.85rem; font-weight: 600;">mcg</span>
            </div>
            <p style="font-size: 0.85rem; color: #E2E8F0; line-height: 1.45; margin: 0;">
              • 장내 칼슘 흡수를 돕고 성장판 뼈 기질로 직접 운반
            </p>
          </div>

          <!-- Card 3: Zinc + Magnesium -->
          <div style="background: var(--theme-surface-card, rgba(15, 23, 42, 0.74)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 18px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.9rem; font-weight: 800; color: #F8FAFC;">⚡ 아연 + 마그네슘</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.12); padding: 0.18rem 0.5rem; border-radius: 6px;">IGF-1 &amp; 숙면</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 900; color: #10B981; margin: 0.2rem 0;">
              ${targets.zincMg} <span style="font-size: 0.85rem; font-weight: 600;">mg</span> + ${targets.magMg} <span style="font-size: 0.85rem; font-weight: 600;">mg</span>
            </div>
            <p style="font-size: 0.85rem; color: #E2E8F0; line-height: 1.45; margin: 0;">
              • 성장인자(IGF-1) 합성 촉진 및 밤 10시 깊은 서파수면 유도
            </p>
          </div>

          <!-- Card 4: Bone Matrix Protein -->
          <div style="background: var(--theme-surface-card, rgba(15, 23, 42, 0.74)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 18px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.9rem; font-weight: 800; color: #F8FAFC;">🥩 뼈 기질 단백질</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #EC4899; background: rgba(236, 72, 153, 0.12); padding: 0.18rem 0.5rem; border-radius: 6px;">체중 × 1.3g</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 900; color: #EC4899; margin: 0.2rem 0;">
              ${targets.proteinG} <span style="font-size: 0.88rem; font-weight: 600;">g/일</span>
            </div>
            <p style="font-size: 0.85rem; color: #E2E8F0; line-height: 1.45; margin: 0;">
              • 성장판 연골·콜라겐 뼈대를 세우는 필수 아미노산 공급
            </p>
          </div>

        </div>

        <!-- Bioavailability Visual Comparison Gauges -->
        ${renderBioavailabilityGauges(targets)}

        <!-- Recommended Products at Bottom of Core 2 -->
        <div class="bento-card" id="core-2-recommended-products" style="margin-top: 1.25rem; margin-bottom: 1.25rem; padding: 1.35rem; background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.92)); border: 1.5px solid rgba(16, 185, 129, 0.35); border-radius: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.9rem;">
            <span style="font-size: 1.05rem; font-weight: 900; color: #FFFFFF;">
              🎁 호르몬 숙면 &amp; 체중 비례 영양 보충을 위한 엄선 추천 상품 TOP 3
            </span>
            <span style="font-size: 0.78rem; font-weight: 800; color: #34D399; background: rgba(16, 185, 129, 0.16); padding: 0.22rem 0.65rem; border-radius: 9999px;">
              Core 2 맞춤 큐레이션
            </span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.9rem;">
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.65rem;">
              <div>
                <span style="font-size: 0.74rem; font-weight: 800; color: #38BDF8;">🏆 엄선 1위 · 구연산 칼슘 (${targets.calciumMg}mg 타깃)</span>
                <div style="font-size: 0.96rem; font-weight: 800; color: #FFFFFF; margin: 0.25rem 0;">어린이 구연산 칼슘 · 마그네슘 · 비타민D 츄어블</div>
                <p style="font-size: 0.84rem; color: #CBD5E1; margin: 0; line-height: 1.45;">위산과 무관하게 45% 흡수되어 변비·배앓이 없이 뼈 기질을 채워줍니다.</p>
              </div>
              <a href="https://www.coupang.com/np/search?q=%EC%96%B4%EB%A6%B0%EC%9D%B4+%EA%B5%AC%EC%97%B0%EC%82%B0+%EC%B9%BC%EC%8A%B4+%EB%A7%88%EA%B7%B8%EB%84%A4%EC%8A%98+%EB%B9%84%ED%83%80%EB%AF%BCD&channel=user&lptag=AF7865143" target="_blank" rel="noopener noreferrer" style="display: inline-flex; justify-content: center; align-items: center; padding: 0.6rem 0.9rem; border-radius: 10px; background: linear-gradient(135deg, #0284C7, #2563EB); color: #FFFFFF; font-size: 0.85rem; font-weight: 800; text-decoration: none;">
                🚀 구연산 칼슘·마그네슘 보러가기 ↗
              </a>
            </div>
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.65rem;">
              <div>
                <span style="font-size: 0.74rem; font-weight: 800; color: #FBBF24;">✨ 엄선 2위 · 뼈 침착 시너지 (${targets.vitDIU}IU 타깃)</span>
                <div style="font-size: 0.96rem; font-weight: 800; color: #FFFFFF; margin: 0.25rem 0;">키즈 액상 비타민D3 + K2 (MK-7) 드롭스</div>
                <p style="font-size: 0.84rem; color: #CBD5E1; margin: 0; line-height: 1.45;">혈중 칼슘을 성장판 연골 기질로 정확히 타깃팅하는 오스테오칼신 활성 조합입니다.</p>
              </div>
              <a href="https://kr.iherb.com/search?kw=kids+vitamin+d3+k2&rcode=KIDSBIO" target="_blank" rel="noopener noreferrer" style="display: inline-flex; justify-content: center; align-items: center; padding: 0.6rem 0.9rem; border-radius: 10px; background: linear-gradient(135deg, #059669, #10B981); color: #FFFFFF; font-size: 0.85rem; font-weight: 800; text-decoration: none;">
                🌿 아이허브 D3+K2 글로벌 직구 보기 ↗
              </a>
            </div>
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.65rem;">
              <div>
                <span style="font-size: 0.74rem; font-weight: 800; color: #F472B6;">💎 엄선 3위 · 성장인자 &amp; 단백질 (${targets.proteinG}g 타깃)</span>
                <div style="font-size: 0.96rem; font-weight: 800; color: #FFFFFF; margin: 0.25rem 0;">어린이 산양유 초유 단백질 · 아연 · 아르기닌</div>
                <p style="font-size: 0.84rem; color: #CBD5E1; margin: 0; line-height: 1.45;">우유 배앓이 없이 간 IGF-1 합성과 뼈 콜라겐 단백질을 맛있게 보충합니다.</p>
              </div>
              <a href="https://www.coupang.com/np/search?q=%EC%96%B4%EB%A6%B0%EC%9D%B4+%EC%82%B0%EC%96%91%EC%9C%A0+%EC%B4%88%EC%9C%A0+%EB%8B%A8%EB%B0%B1%EC%A7%88+%EC%95%84%EC%97%B0&channel=user&lptag=AF7865143" target="_blank" rel="noopener noreferrer" style="display: inline-flex; justify-content: center; align-items: center; padding: 0.6rem 0.9rem; border-radius: 10px; background: linear-gradient(135deg, #DB2777, #9333EA); color: #FFFFFF; font-size: 0.85rem; font-weight: 800; text-decoration: none;">
                🚀 산양유 초유·아연 보러가기 ↗
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
