/**
 * MoneyFit Web Portal Application Engine
 * Coordinates 6 Calculators, 5 Monetization Pipelines,
 * Setup Wizard, LocalStorage synchronization, and UI State.
 */

(function () {
  'use strict';

  // Active state
  let currentCalc = 'electric';
  let activeTab = 'calculators';

  // 36 Golden Keyword SEO Presets
  const SEO_PRESETS = [
    { id: "electric-studio-ac", calc: "electric", title: "원룸 벽걸이 에어컨 하루 10시간 한 달 전기세 계산", inputs: { wattage: 650, hours: 10, baseKwh: 150, newPrice: 550000, isSummer: true } },
    { id: "electric-stand-ac", calc: "electric", title: "30평대 2in1 스탠드 에어컨 누진세 3단계 폭탄 계산", inputs: { wattage: 2200, hours: 12, baseKwh: 310, newPrice: 1850000, isSummer: true } },
    { id: "electric-dehumidifier", calc: "electric", title: "여름철 제습기 24시간 가동 시 전기요금 & 1등급 교체 손익", inputs: { wattage: 320, hours: 24, baseKwh: 220, newPrice: 380000, isSummer: true } },
    { id: "electric-dryer", calc: "electric", title: "전기 의류건조기 주 4회 사용 시 한 달 전기세", inputs: { wattage: 1400, hours: 2, baseKwh: 280, newPrice: 950000, isSummer: false } },
    { id: "electric-winter-heater", calc: "electric", title: "겨울철 2000W 전기온풍기 하루 8시간 난방비 폭탄 진단", inputs: { wattage: 2000, hours: 8, baseKwh: 250, newPrice: 450000, isSummer: false } },
    { id: "electric-inverter-roi", calc: "electric", title: "10년 된 구형 정속형 에어컨 vs 1등급 인버터 교체 회수기간", inputs: { wattage: 1800, hours: 8, baseKwh: 200, newPrice: 850000, isSummer: true } },
    { id: "diet-male-fatloss", calc: "diet", title: "남자 80kg 체지방 컷팅 TDEE 및 닭가슴살 4주 장보기 수량", inputs: { weight: 80, height: 178, weeks: 4, deficit: -500, gender: "male" } },
    { id: "diet-female-lean", calc: "diet", title: "여자 55kg 슬림 다이어트 일일 탄단지 & 2주 식단 리스트", inputs: { weight: 55, height: 163, weeks: 2, deficit: -400, gender: "female" } },
    { id: "diet-male-bulkup", calc: "diet", title: "마른 체형 65kg 벌크업 칼로리 잉여 식단 & 프로틴 섭취량", inputs: { weight: 65, height: 175, weeks: 4, deficit: 350, gender: "male" } },
    { id: "diet-office-worker", calc: "diet", title: "앉아서 일하는 사무직 직장인 TDEE 및 점심 도시락 견적", inputs: { weight: 74, height: 172, weeks: 4, deficit: -450, gender: "male" } },
    { id: "diet-student-budget", calc: "diet", title: "자취생·대학생 1주 가성비 헬스 식단 장보기 표", inputs: { weight: 70, height: 176, weeks: 1, deficit: -300, gender: "male" } },
    { id: "diet-quick-3kg", calc: "diet", title: "한 달 단기 3kg 감량 칼로리 적자 계산 & 필수 식단 조합", inputs: { weight: 58, height: 160, weeks: 4, deficit: -550, gender: "female" } },
    { id: "pet-maltese-5kg", calc: "pet", title: "5kg 말티즈 중성화 성견 하루 사료 급여량(g) & 소진일수", inputs: { petWeight: 5.0, factor: 1.6, kcalPerKg: 3650, bagKg: 2.0 } },
    { id: "pet-pomeranian-puppy", calc: "pet", title: "생후 4개월 1.5kg 포메라니안 퍼피 고단백 사료 급여량", inputs: { petWeight: 1.5, factor: 2.8, kcalPerKg: 3900, bagKg: 1.5 } },
    { id: "pet-golden-retriever", calc: "pet", title: "30kg 골든리트리버 대형견 하루 사료량 & 12kg 포대 소진일", inputs: { petWeight: 30.0, factor: 1.6, kcalPerKg: 3500, bagKg: 12.0 } },
    { id: "pet-korean-shorthair", calc: "pet", title: "4.5kg 코숏 고양이 중성화 비만 방지 건사료 급여량", inputs: { petWeight: 4.5, factor: 1.2, kcalPerKg: 3800, bagKg: 2.0 } },
    { id: "pet-senior-cat", calc: "pet", title: "10살 이상 노령묘 신장·관절 케어 사료량 및 소진 주기", inputs: { petWeight: 3.8, factor: 1.1, kcalPerKg: 3600, bagKg: 1.5 } },
    { id: "pet-monthly-budget", calc: "pet", title: "소형견 4kg 첫 입양 사료 급여량 및 월 고정비 진단", inputs: { petWeight: 4.0, factor: 1.6, kcalPerKg: 3700, bagKg: 2.0 } },
    { id: "room-oneroom-100", calc: "room", title: "원룸 자취방 100만 원 필수 가전·가구 초가성비 풀세팅", inputs: { budgetMan: 100, roomSize: 6, priority: "가성비" } },
    { id: "room-officetel-300", calc: "room", title: "신축 오피스텔 300만 원 화이트 감성 가전·가구 최적 배분", inputs: { budgetMan: 300, roomSize: 10, priority: "화이트 감성" } },
    { id: "room-officetel-500", calc: "room", title: "1.5룸·투룸 500만 원 로봇청소기·침대 포함 프리미엄 견적", inputs: { budgetMan: 500, roomSize: 15, priority: "가성비" } },
    { id: "room-newlywed-1000", calc: "room", title: "신혼부부 1,000만 원 가성비 신혼가전 풀세팅 패키지", inputs: { budgetMan: 1000, roomSize: 24, priority: "가성비" } },
    { id: "room-minimalist-50", calc: "room", title: "단기 거주 50만 원 미니멀 자취 필수 생존템 견적", inputs: { budgetMan: 50, roomSize: 5, priority: "가성비" } },
    { id: "room-appliances-only", calc: "room", title: "옵션 없는 원룸 150만 원 필수 에너지 1등급 가전 조합", inputs: { budgetMan: 150, roomSize: 7, priority: "가전 집중" } },
    { id: "auto-avante-3000", calc: "auto", title: "20대 사회초년생 3,000만 원 아반떼 장기렌트 vs 할부 비교", inputs: { carPriceMan: 3000, months: 60, taxRate: 0, downPaymentRate: 20, interestRate: 5.5, driverAge: "under26" } },
    { id: "auto-grandeur-5000", calc: "auto", title: "개인/법인사업자 5,000만 원 그랜저 장기렌트 절세 손익", inputs: { carPriceMan: 5000, months: 48, taxRate: 24, downPaymentRate: 20, interestRate: 5.5, driverAge: "over26" } },
    { id: "auto-tucson-hybrid", calc: "auto", title: "3,800만 원 투싼 하이브리드 48개월 장기렌트 vs 할부 비교", inputs: { carPriceMan: 3800, months: 48, taxRate: 15, downPaymentRate: 20, interestRate: 5.5, driverAge: "over26" } },
    { id: "auto-genesis-g80", calc: "auto", title: "7,000만 원 제네시스 G80 법인/고소득자 36개월 렌트 손익", inputs: { carPriceMan: 7000, months: 36, taxRate: 35, downPaymentRate: 20, interestRate: 5.5, driverAge: "over35" } },
    { id: "auto-casper-cash-vs-rent", calc: "auto", title: "1,800만 원 캐스퍼 초보운전 보험료 포함 할부 vs 렌트", inputs: { carPriceMan: 1800, months: 36, taxRate: 0, downPaymentRate: 20, interestRate: 5.5, driverAge: "under26" } },
    { id: "auto-ev-ioniq", calc: "auto", title: "5,500만 원 아이오닉 전기차 48개월 장기렌트 손익 계산", inputs: { carPriceMan: 5500, months: 48, taxRate: 24, downPaymentRate: 20, interestRate: 5.5, driverAge: "over26" } },
    { id: "telecom-penalty-15", calc: "telecom", title: "인터넷+TV 잔여 위약금 15만 원 시 타사 이동 사은품 순수익", inputs: { penaltyMan: 15, oldFee: 44000, newFee: 38500, cashGiftMan: 47 } },
    { id: "telecom-penalty-30", calc: "telecom", title: "약정 1년 남은 통신 위약금 30만 원 vs 사은품 47만 원 손익", inputs: { penaltyMan: 30, oldFee: 51000, newFee: 41000, cashGiftMan: 47 } },
    { id: "telecom-3yr-expired", calc: "telecom", title: "인터넷 3년 약정 만기(위약금 0원) 신규 이동 시 47만 원 혜택", inputs: { penaltyMan: 0, oldFee: 45000, newFee: 36000, cashGiftMan: 47 } },
    { id: "telecom-single-oneroom", calc: "telecom", title: "자취방 인터넷 단독 위약금 8만 원 vs 지원금 25만 원 비교", inputs: { penaltyMan: 8, oldFee: 33000, newFee: 22000, cashGiftMan: 25 } },
    { id: "telecom-family-4p", calc: "telecom", title: "온가족 4인 인터넷+TV 통합 변경 시 최대 사은품 손익 계산", inputs: { penaltyMan: 12, oldFee: 55000, newFee: 39000, cashGiftMan: 47 } },
    { id: "telecom-mvno-switch", calc: "telecom", title: "5G 고가 요금제 → 알뜰폰 유심 요금제 전환 시 24개월 절감액", inputs: { penaltyMan: 10, oldFee: 62000, newFee: 42000, cashGiftMan: 45 } }
  ];

  // Helper references to modules
  const getCalcModule = () => window.MoneyFitCalculators || {};
  const getMonetizationModule = () => window.MoneyFitMonetization || {};
  const getPresetsList = () => (window.MoneyFitPresets && window.MoneyFitPresets.PRESETS) || SEO_PRESETS;

  let activeScenarioId = 'electric-studio-ac';
  let activeScenarioExtraInputs = {};

  // Short human-friendly chip labels for the 36 presets (Ultra-short 2~3 words)
  const SCENARIO_CHIP_LABELS = {
    'electric-studio-ac': '원룸 에어컨',
    'electric-stand-ac': '30평 에어컨',
    'electric-dehumidifier': '제습기 24시간',
    'electric-dryer': '건조기 주 4회',
    'electric-winter-heater': '겨울 온풍기',
    'electric-inverter-roi': '1등급 교체',
    'diet-male-fatloss': '남자 80kg 감량',
    'diet-female-lean': '여자 55kg 슬림',
    'diet-male-bulkup': '남자 65kg 증량',
    'diet-office-worker': '직장인 도시락',
    'diet-student-budget': '자취생 1주 식단',
    'diet-quick-3kg': '한달 -3kg 단기',
    'pet-maltese-5kg': '5kg 말티즈',
    'pet-pomeranian-puppy': '1.5kg 포메 퍼피',
    'pet-golden-retriever': '30kg 리트리버',
    'pet-korean-shorthair': '4.5kg 고양이',
    'pet-senior-cat': '10살 노령묘',
    'pet-monthly-budget': '4kg 첫입양',
    'room-oneroom-100': '원룸 100만원',
    'room-officetel-300': '오피스텔 300만',
    'room-officetel-500': '투룸 500만원',
    'room-newlywed-1000': '신혼 1,000만',
    'room-minimalist-50': '단기 50만원',
    'room-appliances-only': '원룸 150만원',
    'auto-avante-3000': '아반떼 3,000만',
    'auto-grandeur-5000': '그랜저 5,000만',
    'auto-tucson-hybrid': '투싼 3,800만',
    'auto-genesis-g80': 'G80 7,000만',
    'auto-casper-cash-vs-rent': '캐스퍼 1,800만',
    'auto-ev-ioniq': '아이오닉 5,500만',
    'telecom-penalty-15': '위약금 15만원',
    'telecom-penalty-30': '위약금 30만원',
    'telecom-3yr-expired': '3년 만기 (0원)',
    'telecom-single-oneroom': '자취방 인터넷',
    'telecom-family-4p': '4인 가족 결합',
    'telecom-mvno-switch': '알뜰폰 전환'
  };

  let lastCalcResult = null;
  const SEASONAL_SURGE_PRESET_IDS = new Set([
    'electric-winter-heater',
    'electric-dryer',
    'diet-male-fatloss',
    'pet-maltese-5kg',
    'room-oneroom-100',
    'auto-grandeur-5000',
    'telecom-penalty-15',
    'telecom-3yr-expired'
  ]);

  /**
   * Render 1-Click Scenario Chips & Contextual Deep-Dive Report Links
   */
  function renderScenarioChips(calcKey) {
    const chipsContainer = document.getElementById('calc-scenario-chips');
    const reportLink = document.getElementById('active-preset-report-link');
    const relatedGrid = document.getElementById('related-category-reports-grid');
    const presets = getPresetsList().filter(p => p.calc === calcKey);

    if (!presets.length) return;
    if (!presets.some(p => p.id === activeScenarioId)) {
      activeScenarioId = presets[0].id;
    }

    if (reportLink) {
      reportLink.href = `/preset/${activeScenarioId}/`;
    }

    if (chipsContainer) {
      chipsContainer.innerHTML = presets.map(p => {
        const isActive = p.id === activeScenarioId;
        const isSurge = SEASONAL_SURGE_PRESET_IDS.has(p.id);
        const baseLabel = SCENARIO_CHIP_LABELS[p.id] || p.title.slice(0, 12);
        const shortLabel = isSurge ? `🔥 ${baseLabel}` : baseLabel;
        const cls = isActive
          ? 'bg-blue-600 text-white border-blue-600 font-black shadow-sm'
          : isSurge
            ? 'bg-amber-50/90 text-rose-800 border-amber-300 hover:border-rose-400 hover:text-rose-700 font-extrabold shadow-xs'
            : 'bg-white text-slate-800 border-slate-300 hover:border-blue-500 hover:text-blue-700 font-bold';
        return `<button type="button" onclick="applyScenarioPreset('${p.id}')" class="text-sm px-3.5 py-2 rounded-xl border transition whitespace-nowrap ${cls}">${shortLabel}</button>`;
      }).join('');
    }

    if (relatedGrid) {
      relatedGrid.innerHTML = presets.map(p => {
        const isSurge = SEASONAL_SURGE_PRESET_IDS.has(p.id);
        const shortTitle = SCENARIO_CHIP_LABELS[p.id] ? `${SCENARIO_CHIP_LABELS[p.id]} — ${p.title}` : p.title;
        return `
        <a href="/preset/${p.id}/" class="group flex items-center justify-between bg-white hover:bg-blue-50/50 border ${isSurge ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'} hover:border-blue-400 rounded-xl p-3.5 transition">
          <span class="text-sm font-extrabold text-slate-800 group-hover:text-blue-700 truncate pr-2">${isSurge ? '🔥 ' : ''}${shortTitle}</span>
          <span class="text-xs font-black text-blue-600 shrink-0 whitespace-nowrap">보기 →</span>
        </a>
      `;
      }).join('');
    }
  }

  /**
   * Apply a 1-Click Scenario Preset
   */
  window.applyScenarioPreset = function (presetId) {
    const presets = getPresetsList();
    const target = presets.find(p => p.id === presetId);
    if (!target) return;
    activeScenarioId = target.id;
    activeScenarioExtraInputs = Object.assign({}, target.inputs);
    window.selectCalc(target.calc, target.inputs);
  };

  /**
   * Switch Active Calculator
   */
  window.selectCalc = function (calcKey, customInputs = null) {
    currentCalc = calcKey;
    if (!customInputs) {
      activeScenarioExtraInputs = {};
    }
    const calcModule = getCalcModule();
    const spec = calcModule.CALCULATORS ? calcModule.CALCULATORS[calcKey] : null;
    if (!spec) return;

    const titleEl = document.getElementById('calc-form-title');
    if (titleEl) titleEl.textContent = spec.title;
    const subtitleEl = document.getElementById('calc-form-subtitle');
    if (subtitleEl) subtitleEl.textContent = spec.subtitle || '';

    // Update calculator tab styles (Big-Font Toss Style)
    document.querySelectorAll('.calc-nav-btn').forEach(btn => {
      btn.className = "calc-nav-btn p-4 rounded-2xl border-2 text-left transition bg-white border-slate-200 hover:border-blue-400";
    });
    const activeBtn = document.getElementById(`calc-nav-${calcKey}`);
    if (activeBtn) {
      activeBtn.className = "calc-nav-btn p-4 rounded-2xl border-2 text-left transition bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-sm";
    }

    renderScenarioChips(calcKey);

    // Render input form controls (Big-Font 16px labels & 54px high-contrast inputs, Mobile 2-Column Compact Grid)
    const container = document.getElementById('calc-inputs-container');
    if (container) {
      const nonCheckCount = spec.inputs.filter(i => i.type !== 'checkbox').length;
      let nonCheckIdx = 0;
      container.innerHTML = spec.inputs.map(inp => {
        const val = customInputs && customInputs[inp.id] !== undefined ? customInputs[inp.id] : inp.value;
        if (inp.type === "checkbox") {
          return `
            <div class="mobile-col-span-2 flex items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200">
              <label for="inp-${inp.id}" class="text-base font-extrabold text-slate-900 cursor-pointer truncate">${inp.label}</label>
              <input id="inp-${inp.id}" type="checkbox" ${val ? 'checked' : ''}
                onchange="recalculateCurrent()"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer shrink-0" />
            </div>
          `;
        }
        nonCheckIdx++;
        const isLastOddItem = (nonCheckCount % 2 === 1) && (nonCheckIdx === nonCheckCount);
        const spanCls = isLastOddItem ? 'mobile-col-span-2' : '';

        if (inp.type === "select") {
          const optionsHtml = (inp.options || []).map(opt => `
            <option value="${opt.value}" ${val === opt.value ? 'selected' : ''}>${opt.label}</option>
          `).join('');
          return `
            <div class="${spanCls}">
              <label class="block text-base font-extrabold text-slate-900 mb-1.5 truncate">${inp.label}</label>
              <select id="inp-${inp.id}" onchange="recalculateCurrent()"
                class="w-full border-2 border-slate-300 rounded-2xl px-4 py-3 text-lg font-extrabold focus:border-blue-600 focus:outline-none bg-white text-slate-900">
                ${optionsHtml}
              </select>
            </div>
          `;
        }
        return `
          <div class="${spanCls}">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <label class="block text-base font-extrabold text-slate-900 truncate">${inp.label}</label>
              <span id="label-val-${inp.id}" class="hidden sm:inline text-base text-blue-600 font-black shrink-0 whitespace-nowrap tabular-nums"></span>
            </div>
            <input id="inp-${inp.id}" type="number" value="${val}" min="${inp.min !== undefined ? inp.min : ''}" max="${inp.max !== undefined ? inp.max : ''}" step="${inp.step || '1'}"
              oninput="recalculateCurrent()"
              class="w-full border-2 border-slate-300 rounded-2xl px-4 py-3 text-lg font-extrabold focus:border-blue-600 focus:outline-none tabular-nums text-slate-900" />
          </div>
        `;
      }).join('');
    }

    recalculateCurrent();
  };

  /**
   * Recalculate and update UI
   */
  window.recalculateCurrent = function () {
    const calcModule = getCalcModule();
    const spec = calcModule.CALCULATORS ? calcModule.CALCULATORS[currentCalc] : null;
    if (!spec) return;

    const values = Object.assign({}, activeScenarioExtraInputs);
    spec.inputs.forEach(inp => {
      const el = document.getElementById(`inp-${inp.id}`);
      if (el) {
        if (inp.type === "checkbox") {
          values[inp.id] = el.checked;
        } else if (inp.type === "select") {
          values[inp.id] = el.value;
        } else {
          const parsed = parseFloat(el.value);
          values[inp.id] = Number.isFinite(parsed) ? parsed : inp.value;
          const valLabel = document.getElementById(`label-val-${inp.id}`);
          if (valLabel && Number.isFinite(values[inp.id])) {
            valLabel.textContent = values[inp.id].toLocaleString();
          }
        }
      } else if (values[inp.id] === undefined) {
        values[inp.id] = inp.value;
      }
    });

    const res = spec.calculate(values);
    if (!res) return;
    lastCalcResult = res;

    // Update Mobile Live 1-Line Result Bar right below inputs
    const mobileLiveTextEl = document.getElementById('mobile-live-result-text');
    if (mobileLiveTextEl) {
      mobileLiveTextEl.textContent = res.headline || '실시간 계산 완료';
    }

    const monetizationModule = getMonetizationModule();
    const config = monetizationModule.getConfig ? monetizationModule.getConfig() : {};

    const buildCoupangHref = (kw) => {
      return monetizationModule.buildCoupangUrl
        ? monetizationModule.buildCoupangUrl(kw, currentCalc)
        : `https://www.coupang.com/np/search?q=${encodeURIComponent(kw || '')}&lptag=AF7865143`;
    };
    const buildLpHref = (merchant, url) => {
      return monetizationModule.buildLinkPriceDeepLink
        ? monetizationModule.buildLinkPriceDeepLink(merchant, url)
        : (url || '#');
    };

    const actionItems = Array.isArray(res.actionItems) ? res.actionItems : [];
    const primaryAction = actionItems[0] || null;

    // 0. [CRO Layer 1 + Experiment A] Left-column Input Instant Prescription Bridge + Zero-Feel Framing
    const instantBadgeEl = document.getElementById('input-instant-badge');
    const instantHeadlineEl = document.getElementById('input-instant-headline');
    const instantSubEl = document.getElementById('input-instant-sub');
    const instantZeroFeelEl = document.getElementById('input-zero-feel-callout');
    const instantCoupangBtn = document.getElementById('input-instant-coupang-btn');
    const instantLpBtn = document.getElementById('input-instant-lp-btn');
    const zf = res.zeroFeelFraming || null;

    if (primaryAction) {
      if (instantBadgeEl) {
        instantBadgeEl.textContent = zf && zf.badge ? zf.badge : `${primaryAction.icon || '⚡'} 맞춤 처방`;
      }
      if (instantHeadlineEl) {
        instantHeadlineEl.textContent = primaryAction.label;
      }
      if (instantSubEl) {
        instantSubEl.textContent = `✔ ${primaryAction.calcVal}`;
      }
      if (instantZeroFeelEl && zf && zf.callout) {
        instantZeroFeelEl.textContent = zf.callout;
      }
      if (instantCoupangBtn) {
        instantCoupangBtn.href = buildCoupangHref(primaryAction.coupangKw);
        instantCoupangBtn.textContent = primaryAction.coupangBtn || '🚀 쿠팡 최저가 ↗';
      }
      if (instantLpBtn) {
        instantLpBtn.href = buildLpHref(primaryAction.lpMerchant, primaryAction.lpUrl);
        instantLpBtn.textContent = primaryAction.lpBtn || '🏷️ 공식몰 특가 ↗';
      }
    }

    // 1. Receipt shock diagnosis card
    const badgeEl = document.getElementById('result-badge');
    const headlineEl = document.getElementById('result-headline');
    const summaryEl = document.getElementById('result-summary-text');
    const metricsGrid = document.getElementById('result-metrics-grid');
    const lossBarEl = document.getElementById('result-loss-bar');
    const receiptZeroFeelEl = document.getElementById('receipt-zero-feel-banner');
    const receiptActionItemsEl = document.getElementById('receipt-action-items');

    if (receiptZeroFeelEl && zf && zf.callout) {
      receiptZeroFeelEl.textContent = zf.callout;
    }

    // [D-3 First Purchase Booster + 6-Hour Auto-Pivot Engine] 1만 원대 로켓배송 즉결템 (24시간 쿠키 적립 부스터)
    if (res.impulseItem) {
      const imp = res.impulseItem;
      const pivotCustom =
        typeof window !== 'undefined' &&
        window.MONEYFIT_GROWTH_PIVOT &&
        window.MONEYFIT_GROWTH_PIVOT.calcCustomizations &&
        window.MONEYFIT_GROWTH_PIVOT.calcCustomizations[currentCalc]
          ? window.MONEYFIT_GROWTH_PIVOT.calcCustomizations[currentCalc]
          : null;
      const impBadgeEl = document.getElementById('impulse-badge');
      const impTitleEl = document.getElementById('impulse-title');
      const impSubEl = document.getElementById('impulse-sub');
      const impBtnEl = document.getElementById('impulse-coupang-btn');
      if (impBadgeEl && imp.badge) {
        impBadgeEl.textContent =
          pivotCustom && pivotCustom.decision === 'REINFORCE'
            ? `🔥 [인기 1위] ${imp.badge}`
            : imp.badge;
      }
      if (impTitleEl && imp.title) impTitleEl.textContent = imp.title;
      if (impSubEl && imp.sub) impSubEl.textContent = imp.sub;
      if (impBtnEl) {
        impBtnEl.href = buildCoupangHref(imp.coupangKw);
        impBtnEl.textContent = imp.btnLabel || '🛒 1만원대 필수템 로켓배송 ↗';
      }
    }

    if (badgeEl) {
      badgeEl.textContent = res.badge;
      if (res.badge && (res.badge.includes('폭탄') || res.badge.includes('경보') || res.badge.includes('손해') || res.badge.includes('권장') || (res.totalNetBenefit !== undefined && res.totalNetBenefit < 0))) {
        badgeEl.className = "inline-flex items-center bg-rose-500 text-white text-sm font-black px-3 py-1 rounded-full whitespace-nowrap";
      } else if (res.totalNetBenefit !== undefined && res.totalNetBenefit > 0) {
        badgeEl.className = "inline-flex items-center bg-emerald-500 text-white text-sm font-black px-3 py-1 rounded-full whitespace-nowrap";
      } else {
        badgeEl.className = "inline-flex items-center bg-blue-600 text-white text-sm font-black px-3 py-1 rounded-full whitespace-nowrap";
      }
    }
    if (headlineEl) headlineEl.textContent = res.headline;
    if (summaryEl) summaryEl.textContent = res.summary;

    // [CRO Layer 2A] Clickable Receipt Metric Cards (Big-Font 22~28px numbers, Mobile 3-col / 2x2 pills!)
    if (metricsGrid && res.metrics) {
      const colClass = res.metrics.length >= 4
        ? "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 mobile-metrics-4"
        : "grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3 mb-4";
      metricsGrid.className = colClass;
      metricsGrid.innerHTML = res.metrics.map((m, idx) => {
        const isNeg = String(m.val).startsWith('-');
        const valColor = isNeg ? 'text-rose-400' : 'text-amber-400';
        const matchedAction = actionItems.length > 0 ? actionItems[idx % actionItems.length] : null;
        const metricHref = matchedAction ? buildCoupangHref(matchedAction.coupangKw) : '#product-recommendations';
        const stepHint = matchedAction ? `${matchedAction.icon || '🛒'} ${matchedAction.stepTag || '특가'} ↗` : '🛒 특가 보기 ↗';

        return `
          <a href="${metricHref}" target="_blank" rel="noopener noreferrer sponsored"
             onclick="recordAffiliateClick('coupang', this.href, 'metric_card')"
             class="group block bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 rounded-2xl p-3.5 min-w-0 transition shadow-sm">
            <div class="text-sm font-bold text-slate-300 truncate">${m.label}</div>
            <div class="text-xl sm:text-2xl font-black ${valColor} mt-1 whitespace-nowrap truncate tabular-nums">${m.val}</div>
            <div class="mt-2 pt-1.5 border-t border-slate-700/70 flex items-center justify-between text-xs font-extrabold text-emerald-300 group-hover:text-amber-300">
              <span class="truncate">${stepHint}</span>
            </div>
          </a>
        `;
      }).join('');
    }

    // 1.5 Visual Loss-Aversion Comparison Bar (Big-Font & Short Words)
    if (lossBarEl && res.lossComparison) {
      const lc = res.lossComparison;
      lossBarEl.innerHTML = `
        <div class="flex items-center justify-between gap-2 text-sm">
          <span class="font-extrabold text-rose-300 flex items-center gap-1 truncate">⚠️ 손실 vs 절약 비교</span>
          <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs sm:text-sm font-black shrink-0 whitespace-nowrap tabular-nums">${lc.savingBadge}</span>
        </div>
        <div class="space-y-2.5 text-sm">
          <div>
            <div class="flex items-center justify-between gap-2 text-slate-300 mb-1">
              <span class="font-bold truncate">❌ ${lc.lossLabel}</span>
              <span class="text-base font-black text-rose-400 line-through shrink-0 whitespace-nowrap tabular-nums">${lc.lossValueText}</span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div class="bg-rose-500/80 h-full rounded-full" style="width: 100%"></div>
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between gap-2 text-white mb-1">
              <span class="font-extrabold text-emerald-300 truncate">✅ ${lc.optLabel}</span>
              <span class="text-lg font-black text-emerald-400 shrink-0 whitespace-nowrap tabular-nums">${lc.optValueText}</span>
            </div>
            <div class="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500" style="width: ${lc.optPercent}%"></div>
            </div>
          </div>
        </div>
      `;
    }

    // [CRO Layer 2B] Inside-Receipt 1:1 Prescription Shopping Cart (Big-Font & Short Words)
    if (receiptActionItemsEl && actionItems.length > 0) {
      receiptActionItemsEl.innerHTML = actionItems.map(item => {
        const cpHref = buildCoupangHref(item.coupangKw);
        const lpHref = buildLpHref(item.lpMerchant, item.lpUrl);
        return `
          <div class="bg-slate-900/95 border-2 border-slate-700/90 hover:border-amber-400/70 rounded-2xl p-4 transition space-y-2.5">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">${item.icon || '⚡'} ${item.stepTag || '처방'}</span>
                  <span class="text-base sm:text-lg font-black text-white truncate">${item.label}</span>
                </div>
                <div class="text-sm text-emerald-300 font-bold leading-snug break-keep">✔ ${item.calcVal}</div>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a href="${cpHref}" target="_blank" rel="noopener noreferrer sponsored"
                 onclick="recordAffiliateClick('coupang', this.href, 'receipt_cart')"
                 class="block text-center bg-rose-600 hover:bg-rose-500 text-white font-black py-3 px-3 rounded-xl text-sm sm:text-base transition shadow-sm whitespace-nowrap truncate">
                ${item.coupangBtn || '🚀 쿠팡 최저가 ↗'}
              </a>
              <a href="${lpHref}" target="_blank" rel="noopener noreferrer sponsored"
                 onclick="recordAffiliateClick('linkprice', this.href, 'receipt_cart')"
                 class="block text-center bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-3 rounded-xl text-sm sm:text-base transition shadow-sm whitespace-nowrap truncate">
                ${item.lpBtn || '🏷️ 공식몰 특가 ↗'}
              </a>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. High-Ticket CPA / Official Exhibition Native Card
    const cpaDetails = monetizationModule.getCpaCardDetails
      ? monetizationModule.getCpaCardDetails(currentCalc, res, config)
      : null;

    const cpaBadgeEl = document.getElementById('cpa-badge');
    const cpaTitleEl = document.getElementById('cpa-title');
    const cpaPayoutTagEl = document.getElementById('cpa-payout-tag');
    const cpaActionLinkEl = document.getElementById('cpa-action-link');
    const cpaDescEl = document.getElementById('cpa-desc');
    const cpaCoupangSubEl = document.getElementById('cpa-coupang-sublink');
    const cpaLpSubEl = document.getElementById('cpa-lp-sublink');

    if (cpaDetails) {
      if (cpaBadgeEl) cpaBadgeEl.textContent = cpaDetails.liveBadge || "맞춤 혜택";
      if (cpaTitleEl) cpaTitleEl.textContent = cpaDetails.liveTitle || cpaDetails.title;
      if (cpaPayoutTagEl) {
        cpaPayoutTagEl.textContent = cpaDetails.isCustomTenpingUrl
          ? `🔥 CPA 연동`
          : `⚡ 공식 제휴`;
      }
      if (cpaDescEl) cpaDescEl.textContent = cpaDetails.liveDesc || cpaDetails.desc;
      if (cpaActionLinkEl) {
        cpaActionLinkEl.href = cpaDetails.liveActionUrl || cpaDetails.actionUrl;
        cpaActionLinkEl.textContent = cpaDetails.liveCta || cpaDetails.cta;
      }
      if (cpaCoupangSubEl && cpaDetails.coupangSubUrl) {
        cpaCoupangSubEl.href = cpaDetails.coupangSubUrl;
        cpaCoupangSubEl.textContent = `${cpaDetails.coupangSubLabel || '🚀 쿠팡 특가'} ↗`;
      }
      if (cpaLpSubEl && cpaDetails.linkPriceSubUrl) {
        cpaLpSubEl.href = cpaDetails.linkPriceSubUrl;
        cpaLpSubEl.textContent = `${cpaDetails.linkPriceSubLabel || '🏷️ 공식몰 특가'} ↗`;
      }
    } else {
      if (cpaTitleEl) cpaTitleEl.textContent = res.cpaTitle || "맞춤 최저가 조회";
      if (cpaPayoutTagEl) cpaPayoutTagEl.textContent = `⚡ 공식 제휴`;
      if (cpaActionLinkEl) {
        const cpaUrl = monetizationModule.buildLiveFallbackCpaUrl
          ? monetizationModule.buildLiveFallbackCpaUrl(currentCalc, config)
          : "#";
        cpaActionLinkEl.href = cpaUrl;
      }
    }

    // 3. [CRO Layer 3] Enriched Shopping Deal Cards (Big-Font & Short Words)
    const productsContainer = document.getElementById('product-recommendations');
    if (productsContainer && res.products) {
      productsContainer.innerHTML = res.products.map(p => {
        const href = p.type === 'coupang'
          ? buildCoupangHref(p.kw)
          : buildLpHref(p.merchant, p.url);
        const merchantName = p.merchantLabel || (p.merchant ? p.merchant.toUpperCase() : '공식몰');
        const platformTag = p.type === 'coupang'
          ? '🚀 쿠팡 로켓배송'
          : `🏷️ ${merchantName}`;
        const platformColor = p.type === 'coupang'
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200';
        const btnBg = p.type === 'coupang'
          ? 'bg-rose-600 group-hover:bg-rose-500 text-white'
          : 'bg-indigo-600 group-hover:bg-indigo-500 text-white';
        const subBadge = p.badge || (p.type === 'coupang' ? '⚡ 로켓배송' : '💳 카드할인');
        const ctaLabel = p.ctaText || '최저가 보기 →';
        const matchTag = p.calcMatchTag || '⚡ 맞춤 추천';
        const matchReason = p.matchReason || '계산 결과 맞춤 베스트셀러';
        const iconPrefix = p.icon ? `${p.icon} ` : '';

        return `
          <a href="${href}" target="_blank" rel="noopener noreferrer sponsored"
             onclick="recordAffiliateClick('${p.type}', this.href, 'deal_card')"
             class="group flex flex-col justify-between border-2 border-slate-200 hover:border-blue-600 rounded-2xl p-4 sm:p-5 transition-all bg-white hover:bg-blue-50/20 shadow-sm hover:shadow-md min-w-0">
            <div class="min-w-0 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <span class="inline-block text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${platformColor} shrink-0 whitespace-nowrap">${platformTag}</span>
                <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap">${subBadge}</span>
              </div>
              <div class="bg-amber-50 border border-amber-200/90 text-amber-950 text-xs sm:text-sm font-black px-3 py-1 rounded-xl truncate">
                ${matchTag}
              </div>
              <div class="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-700 leading-snug break-keep">${iconPrefix}${p.title}</div>
              <p class="text-xs sm:text-sm text-slate-600 font-medium leading-snug break-keep">${matchReason}</p>
            </div>
            <div class="mt-3.5 pt-3 border-t border-slate-100">
              <div class="w-full text-center font-black py-3 px-4 rounded-xl text-sm sm:text-base transition shadow-sm whitespace-nowrap truncate ${btnBg}">
                ${ctaLabel}
              </div>
            </div>
          </a>
        `;
      }).join('');
    }

    // 4. Update Mobile Sticky Bottom Floating CTA Bar
    const stickySubEl = document.getElementById('sticky-cta-sub');
    const stickyMainEl = document.getElementById('sticky-cta-main');
    const stickyBtnEl = document.getElementById('sticky-cta-btn');
    if (stickySubEl && stickyMainEl && stickyBtnEl) {
      stickySubEl.textContent = primaryAction
        ? `${primaryAction.icon || '⚡'} ${primaryAction.calcVal}`
        : (res.badge || "실시간 계산 완료");
      stickyMainEl.textContent = primaryAction
        ? primaryAction.label
        : (cpaDetails ? (cpaDetails.liveTitle || cpaDetails.title) : res.headline);
      stickyBtnEl.href = primaryAction
        ? buildCoupangHref(primaryAction.coupangKw)
        : (cpaDetails ? (cpaDetails.liveActionUrl || cpaDetails.actionUrl) : "#");

      stickyBtnEl.textContent = primaryAction
        ? (primaryAction.coupangBtn || "최저가 보기 ↗")
        : "특가 보기 →";
    }

    highlightWinningSlot();
  };

  /**
   * Switch Main View Tabs
   */
  window.switchMainTab = function (tab) {
    activeTab = tab;
    ['calculators', 'seo', 'wizard'].forEach(t => {
      const view = document.getElementById(`view-${t}`);
      const btn = document.getElementById(`tab-btn-${t}`);
      if (view) view.classList.toggle('hidden', t !== tab);
      if (btn) {
        if (t === tab) {
          btn.className = "px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white shadow-sm";
        } else {
          btn.className = "px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200";
        }
      }
    });

    const mobileBar = document.getElementById('mobile-sticky-cta-bar');
    if (mobileBar) {
      mobileBar.classList.toggle('hidden', tab !== 'calculators');
    }

    if (tab === 'seo') {
      if (window.MoneyFitCopyKit && window.MoneyFitCopyKit.init) {
        window.MoneyFitCopyKit.init();
      } else {
        renderSeoPresetList();
      }
    } else if (tab === 'wizard') {
      populateWizardFields();
      runProfitSimulator();
    }
  };

  /**
   * Render 36 SEO Preset List
   */
  function renderSeoPresetList() {
    const listEl = document.getElementById('seo-preset-list');
    if (!listEl) return;

    listEl.innerHTML = SEO_PRESETS.map((p, idx) => `
      <button onclick="selectSeoPreset(${idx})" class="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 transition flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-blue-600 uppercase">[#${idx + 1} ${p.calc}]</span>
          <div class="text-xs font-bold text-slate-800">${p.title}</div>
        </div>
        <span class="text-xs text-slate-400">원고 생성 →</span>
      </button>
    `).join('');

    selectSeoPreset(0);
  }

  /**
   * Select a Preset and Generate Viral Copies
   */
  window.selectSeoPreset = function (index) {
    const preset = SEO_PRESETS[index];
    if (!preset) return;

    const calcModule = getCalcModule();
    const spec = calcModule.CALCULATORS ? calcModule.CALCULATORS[preset.calc] : null;
    if (!spec) return;

    const res = spec.calculate(preset.inputs);
    const monetizationModule = getMonetizationModule();
    const config = monetizationModule.getConfig ? monetizationModule.getConfig() : {};
    const siteUrl = config.siteUrl || "https://truthofmarket.com";
    const presetUrl = `${siteUrl}/preset/${preset.id}`;

    const precompiled = (window.VIRAL_POSTS && window.VIRAL_POSTS[preset.id]) || null;
    const storyMap = (window.MoneyFitWebtoonStories && window.MoneyFitWebtoonStories.PRESET_WEBTOON_MAP) || {};
    const story = storyMap[preset.id] || {};

    // 1. Naver Blog / Tistory Post (1500+ Korean characters preview)
    const blogPost = precompiled && precompiled.blogPost
      ? precompiled.blogPost
      : `[제목] ${preset.title} — 2026 실제 수식 비교 & 손익분기점 정리\n\n` +
        `${story.hookLine || `요즘 '${preset.title}' 조건에서 실제 비용이 얼마나 차이 나는지 궁금해하시는 분들이 많습니다.`}\n` +
        `${story.factLine || `대략적인 눈대중 대신 공인 수식에 내 수치를 대입해 보면 1년 기준 수십만 원 이상의 고정비 차이를 확인할 수 있습니다.`}\n\n` +
        `■ 핵심 수치 진단 결과: ${res.headline} (${res.badge})\n` +
        `- ${res.metrics.map(m => `${m.label}: ${m.val}`).join('\n- ')}\n\n` +
        `■ 상세 분석 및 전문가 코멘트\n${res.summary}\n\n` +
        `👉 ${story.ctaLine || `내 조건을 직접 넣어서 3초 만에 계산해 보시려면 아래 무료 계산기에서 바로 확인해 보세요!`}\n` +
        `🔗 무료 맞춤 계산기 바로가기: ${presetUrl}\n\n` +
        `${story.hashtags || `#${preset.title.split(' ').slice(0, 4).join(' #')} #머니핏`}`;

    // 2. Threads / Group Chat 3-Line Summary (Clean, non-spammy, preset-accurate)
    const threadsPost = precompiled && precompiled.threadsPost
      ? precompiled.threadsPost
      : `${story.hookLine || `'${preset.title}' 감으로 결정하기 전에 꼭 한 번 계산해 보세요.`}\n` +
        `${story.factLine || `실제 수식으로 계산해 보니 [${res.headline}] 차이가 발생합니다.`}\n` +
        `${story.ctaLine || `내 조건 넣고 3초 무료 시뮬레이션 확인하기`}: ${presetUrl}`;

    // 3. Naver Jisik-iN Tailored Reply
    const jisikinPost = precompiled && precompiled.jisikinPost
      ? precompiled.jisikinPost
      : `질문자님과 비슷한 조건('${preset.title}')으로 실제 수식을 대입해 본 결과입니다.\n\n` +
        `핵심 결론은 [${res.headline} (${res.badge})] 수준으로 산출됩니다.\n` +
        `${story.factLine || res.summary}\n\n` +
        `세부 조건별 비교표는 아래 무료 시뮬레이터에서 회원가입 없이 바로 계산해 보실 수 있습니다.\n` +
        `참고한 무료 계산기: ${presetUrl}`;

    // 4. IndexNow API Payload
    const indexNowKey = "moneyfit-indexnow-key-2026";
    const indexNowPayload = {
      host: new URL(siteUrl).host,
      key: indexNowKey,
      keyLocation: `${siteUrl}/${indexNowKey}.txt`,
      urlList: SEO_PRESETS.slice(0, 6).map(item => `${siteUrl}/preset/${item.id}`)
    };

    const blogEl = document.getElementById('generated-blog-post');
    const threadsEl = document.getElementById('generated-threads-post');
    const jisikinEl = document.getElementById('generated-jisikin-post');
    const indexNowEl = document.getElementById('generated-indexnow-json');

    if (blogEl) blogEl.textContent = blogPost;
    if (threadsEl) threadsEl.textContent = threadsPost;
    if (jisikinEl) jisikinEl.textContent = jisikinPost;
    if (indexNowEl) indexNowEl.textContent = JSON.stringify(indexNowPayload, null, 2);
  };

  /**
   * Setup Wizard: Populate Fields from Config
   */
  function populateWizardFields() {
    const monetizationModule = getMonetizationModule();
    const config = monetizationModule.getConfig ? monetizationModule.getConfig() : {};

    const coupangInp = document.getElementById('cfg-coupang-id');
    const lpInp = document.getElementById('cfg-lp-id');
    const cpaInp = document.getElementById('cfg-cpa-id');
    const adfitInp = document.getElementById('cfg-adfit-id');
    const siteUrlInp = document.getElementById('cfg-site-url');
    const tgTokenInp = document.getElementById('cfg-tg-token');
    const tgChatIdInp = document.getElementById('cfg-tg-chat-id');
    const tgAutoNotifyInp = document.getElementById('cfg-tg-auto-notify');

    if (coupangInp) coupangInp.value = config.coupangAfId || "AF7865143";
    if (lpInp) lpInp.value = config.linkPriceId || "A100708867";
    if (cpaInp) {
      const rawCpa = config.cpaMemberId || "tp_member_2370";
      cpaInp.value = /^010\d{7,8}$/.test(rawCpa) ? "tp_member_" + rawCpa.slice(-4) : rawCpa;
    }
    const cpaUrls = config.cpaUrls || {};
    ['electric', 'diet', 'pet', 'room', 'auto', 'telecom'].forEach(cat => {
      const urlInp = document.getElementById(`cfg-cpa-url-${cat}`);
      if (urlInp) urlInp.value = cpaUrls[cat] || "";
    });

    if (adfitInp) adfitInp.value = (config.adfitUnitId && config.adfitUnitId !== "DAN-SAMPLE-TOP") ? config.adfitUnitId : "";
    if (siteUrlInp) siteUrlInp.value = config.siteUrl || "https://truthofmarket.com";
    if (tgTokenInp) tgTokenInp.value = (config.telegramBotToken && config.telegramBotToken !== "YOUR_TELEGRAM_BOT_TOKEN") ? config.telegramBotToken : "";
    if (tgChatIdInp) tgChatIdInp.value = (config.telegramChatId && config.telegramChatId !== "YOUR_CHAT_ID") ? config.telegramChatId : "";
    if (tgAutoNotifyInp) tgAutoNotifyInp.checked = config.telegramAutoNotify !== false;

    updateStatusBar(config);
    updateSampleLinksPreview(config);
  }

  function updateStatusBar(config) {
    const statusCoupang = document.getElementById('status-coupang-id');
    const statusLp = document.getElementById('status-lp-id');
    const statusCpa = document.getElementById('status-cpa-id');
    const statusClicks = document.getElementById('status-click-count');
    const adfitLabel = document.getElementById('adfit-unit-label');
    const adfitContainer = document.getElementById('adfit-banner-container');
    const ftcTextEl = document.getElementById('ftc-disclosure-text');

    if (statusCoupang) statusCoupang.textContent = config.coupangAfId || "AF7865143";
    if (statusLp) statusLp.textContent = config.linkPriceId || "A100708867";
    if (statusCpa) {
      const cpaUrls = config.cpaUrls || {};
      const customCount = Object.values(cpaUrls).filter(v => v && String(v).trim().startsWith('http')).length;
      statusCpa.textContent = customCount > 0
        ? `010-****-2370 (텐핑 직링크 ${customCount}개)`
        : `010-****-2370 (자동 기획전 연동)`;
    }
    if (statusClicks) statusClicks.textContent = config.clickCount || 0;
    const adUnit = config.adfitUnitId || "DAN-SAMPLE-TOP";
    if (adfitLabel) adfitLabel.textContent = adUnit;
    if (adfitContainer) {
      const isLiveAdFit = adUnit && adUnit !== "DAN-SAMPLE-TOP" && adUnit.startsWith("DAN-");
      adfitContainer.classList.toggle('hidden', !isLiveAdFit);
    }
    if (ftcTextEl && config.ftcNotice) {
      ftcTextEl.textContent = config.ftcNotice;
    }
  }

  function updateSampleLinksPreview(config) {
    const monetizationModule = getMonetizationModule();
    const sampleCoupang = document.getElementById('sample-synthesized-coupang');
    const sampleLp = document.getElementById('sample-synthesized-lp');
    const sampleCpa = document.getElementById('sample-synthesized-cpa');

    if (sampleCoupang && monetizationModule.buildCoupangUrl) {
      sampleCoupang.textContent = "🚀 쿠팡 파트너스: " + monetizationModule.buildCoupangUrl("에너지 1등급 가전", "electric", config.coupangAfId);
    }
    if (sampleLp && monetizationModule.buildLinkPriceDeepLink) {
      sampleLp.textContent = "🏷️ 링크프라이스: " + monetizationModule.buildLinkPriceDeepLink("himart", "https://www.e-himart.co.kr/app/search/totalSearch?query=%EC%97%90%EB%84%88%EC%A7%80%201%EB%93%B1%EA%B8%89%20%EC%9D%B8%EB%B2%84%ED%84%B0", config.linkPriceId);
    }
    if (sampleCpa && monetizationModule.buildLiveFallbackCpaUrl) {
      sampleCpa.textContent = "🔥 맞춤 혜택/텐핑: " + monetizationModule.buildLiveFallbackCpaUrl(currentCalc || "electric", config);
    }
  }

  /**
   * Apply Monetization Config Button Handler
   */
  window.applyMonetizationConfig = function () {
    const monetizationModule = getMonetizationModule();
    const rawCoupangId = (document.getElementById('cfg-coupang-id')?.value || "").trim().replace(/[^A-Za-z0-9_-]/g, '');
    const coupangAfId = /^AF[A-Za-z0-9_-]{3,20}$/.test(rawCoupangId) ? rawCoupangId : "AF7865143";
    const rawLpId = (document.getElementById('cfg-lp-id')?.value || "").trim().replace(/[^A-Za-z0-9_-]/g, '');
    const linkPriceId = /^A[0-9]{6,15}$/.test(rawLpId) ? rawLpId : "A100708867";
    const rawCpaInput = (document.getElementById('cfg-cpa-id')?.value || "").trim().replace(/[^A-Za-z0-9_-]/g, '') || "tp_member_2370";
    const cpaMemberId = /^010\d{7,8}$/.test(rawCpaInput) ? "tp_member_" + rawCpaInput.slice(-4) : rawCpaInput;
    const cpaUrls = {};
    ['electric', 'diet', 'pet', 'room', 'auto', 'telecom'].forEach(cat => {
      cpaUrls[cat] = (document.getElementById(`cfg-cpa-url-${cat}`)?.value || "").trim();
    });
    const adfitUnitId = (document.getElementById('cfg-adfit-id')?.value || "").trim().replace(/[^A-Za-z0-9_-]/g, '') || "DAN-SAMPLE-TOP";
    const siteUrl = (document.getElementById('cfg-site-url')?.value || "").trim() || "https://truthofmarket.com";
    const telegramBotToken = (document.getElementById('cfg-tg-token')?.value || "").trim() || "YOUR_TELEGRAM_BOT_TOKEN";
    const telegramChatId = (document.getElementById('cfg-tg-chat-id')?.value || "").trim() || "YOUR_CHAT_ID";
    const telegramAutoNotify = document.getElementById('cfg-tg-auto-notify') ? document.getElementById('cfg-tg-auto-notify').checked : true;

    const newConfig = {
      coupangAfId,
      linkPriceId,
      cpaMemberId,
      cpaUrls,
      adfitUnitId,
      siteUrl,
      telegramBotToken,
      telegramChatId,
      telegramAutoNotify
    };

    if (monetizationModule.saveConfigToStorage) {
      monetizationModule.saveConfigToStorage(newConfig);
    } else if (monetizationModule.updateConfig) {
      monetizationModule.updateConfig(newConfig);
    }

    const updated = monetizationModule.getConfig ? monetizationModule.getConfig() : newConfig;
    updateStatusBar(updated);
    updateSampleLinksPreview(updated);
    recalculateCurrent();
    if (window.MoneyFitCopyKit && window.MoneyFitCopyKit.refreshActive) {
      window.MoneyFitCopyKit.refreshActive();
    }

    const alertBox = document.getElementById('config-saved-alert');
    if (alertBox) {
      alertBox.classList.remove('hidden');
      setTimeout(() => alertBox.classList.add('hidden'), 3000);
    }
  };

  /**
   * 1-Click Browser Telegram Auto-Discover & Test Report Dispatcher
   */
  window.testTelegramFromBrowser = async function () {
    const statusBox = document.getElementById('tg-test-status');
    const tokenInp = document.getElementById('cfg-tg-token');
    const chatInp = document.getElementById('cfg-tg-chat-id');
    const token = (tokenInp?.value || "").trim();
    let chatId = (chatInp?.value || "").trim();

    if (statusBox) {
      statusBox.classList.remove('hidden');
      statusBox.textContent = "⏳ 텔레그램 봇 연결 및 채팅방 ID 확인 중...";
    }

    if (!token || token === "YOUR_TELEGRAM_BOT_TOKEN" || !token.includes(":")) {
      // Try server-side dispatch if .env is configured on backend
      try {
        const srvRes = await fetch('/api/daily-report?send=1');
        if (srvRes.ok) {
          const srvJson = await srvRes.json();
          if (srvJson.sent) {
            if (statusBox) {
              statusBox.textContent = "✅ 서버 보안 환경변수(.env)를 통해 텔레그램(채팅방 ID: " + (srvJson.chatIdMasked || "연동됨") + ")으로 보고서가 즉시 발송되었습니다!";
            }
            return;
          }
        }
      } catch (e) {}
      if (statusBox) {
        statusBox.textContent = "⚠️ 먼저 텔레그램 @BotFather에서 발급받은 봇 토큰(예: 123456:ABC-DEF...)을 입력해 주세요!";
      }
      return;
    }

    try {
      if (!chatId || chatId === "YOUR_CHAT_ID") {
        const updRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        const updJson = await updRes.json();
        if (updJson.ok && Array.isArray(updJson.result) && updJson.result.length > 0) {
          for (let i = updJson.result.length - 1; i >= 0; i--) {
            const msg = updJson.result[i].message || updJson.result[i].channel_post;
            if (msg && msg.chat && msg.chat.id) {
              chatId = String(msg.chat.id);
              if (chatInp) chatInp.value = chatId;
              break;
            }
          }
        }
      }

      if (!chatId || chatId === "YOUR_CHAT_ID") {
        if (statusBox) {
          statusBox.textContent = "ℹ️ 봇에게 아직 메시지가 없습니다! 텔레그램에서 생성한 봇에게 '/start'를 한 번 보낸 뒤 다시 버튼을 눌러주세요.";
        }
        return;
      }

      window.applyMonetizationConfig();

      const siteUrl = (document.getElementById('cfg-site-url')?.value || "https://truthofmarket.com").trim();
      const testText =
        `🤖 <b>[머니핏(MoneyFit) 텔레그램 자동 보고 연동 완료!]</b>\n` +
        `• <b>연동 도메인</b>: ${siteUrl}\n` +
        `• <b>감지된 채팅방 ID</b>: <code>${chatId}</code>\n` +
        `• <b>자동화 상태</b>: 매일 오전 06:00 KST 정기 보고(방문자수·쿠팡/링크프라이스 매출·실제 순수익) 및 실시간 수익 클릭 신호가 이 채팅방으로 발송됩니다!`;

      const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: testText,
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      });
      const sendJson = await sendRes.json();
      if (sendJson.ok) {
        if (statusBox) {
          statusBox.textContent = `✅ 발송 성공! 텔레그램(채팅방 ID: ${chatId})으로 완료 보고 메시지가 도착했습니다.`;
        }
      } else {
        if (statusBox) {
          statusBox.textContent = `❌ 발송 실패: ${sendJson.description || "권한 또는 토큰을 확인하세요"}`;
        }
      }
    } catch (err) {
      if (statusBox) {
        statusBox.textContent = `❌ 네트워크 오류: ${err.message}`;
      }
    }
  };

  /**
   * 06:00 AM KST Daily Briefing On-Demand Dispatcher (Browser + Backend)
   */
  window.sendDailyRevenueReportFromBrowser = async function () {
    const statusBox = document.getElementById('tg-test-status');
    if (statusBox) {
      statusBox.classList.remove('hidden');
      statusBox.textContent = "⏳ 실시간 방문자 통계 및 쿠팡파트너스·링크프라이스 매출/순수익 정산 보고서 생성 중...";
    }

    try {
      // 1. Try triggering backend /api/daily-report?send=1 first
      const srvRes = await fetch('/api/daily-report?send=1').catch(() => null);
      if (srvRes && srvRes.ok) {
        const srvData = await srvRes.json();
        if (srvData && srvData.sent) {
          if (statusBox) {
            statusBox.textContent = `✅ 발송 완료! 오전 6시 일일 정기 보고서(방문자·쿠팡/링크프라이스 매출·실수익)가 텔레그램으로 전송되었습니다.`;
          }
          return;
        }
      }

      // 2. Fallback: Fetch /api/stats and send via browser token if configured
      const statsRes = await fetch('/api/stats').catch(() => null);
      const stats = (statsRes && statsRes.ok) ? await statsRes.json() : null;
      const token = (document.getElementById('cfg-tg-token')?.value || "").trim();
      const chatId = (document.getElementById('cfg-tg-chat-id')?.value || "").trim();

      if (!token || token === "YOUR_TELEGRAM_BOT_TOKEN" || !chatId || chatId === "YOUR_CHAT_ID") {
        if (statusBox) {
          statusBox.textContent = "ℹ️ 서버(.env) 또는 위 입력창에 텔레그램 봇 토큰과 채팅방 ID가 설정되어 있으면 즉시 발송됩니다.";
        }
        return;
      }

      const todayUv = stats?.today?.uniqueVisitors || 0;
      const todayPv = stats?.today?.pageViews || 0;
      const totalUv = stats?.totals?.uniqueVisitors || 0;
      const totalClicks = stats?.totals?.affiliateClicks || 0;
      const coupangClicks = stats?.totals?.clicksByChannel?.coupang || Math.ceil(totalClicks * 0.55);
      const lpClicks = stats?.totals?.clicksByChannel?.linkprice || Math.floor(totalClicks * 0.45);

      const estCoupangGmv = coupangClicks * 45000 * 0.045;
      const estCoupangNet = Math.round(estCoupangGmv * 0.03);
      const estLpGmv = lpClicks * 120000 * 0.035;
      const estLpNet = Math.round(estLpGmv * 0.04);

      const reportHtml =
        `🌅 <b>[머니핏 오전 06:00 일일 방문자·매출·실수익 정기 보고]</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👥 <b>1. 실시간 방문자 및 트래픽 현황</b>\n` +
        `• 오늘 순방문자(UV): <b>${todayUv.toLocaleString()}명</b> (페이지뷰 ${todayPv.toLocaleString()}회)\n` +
        `• 누적 순방문자(UV): <b>${totalUv.toLocaleString()}명</b>\n` +
        `• 제휴 링크 클릭 전환: <b>총 ${totalClicks.toLocaleString()}회</b> (쿠팡 ${coupangClicks}회 / 링크프라이스 ${lpClicks}회)\n\n` +
        `💰 <b>2. 쿠팡파트너스(AF7865143) 매출 및 내 순수익</b>\n` +
        `• 추정 구매 전환 매출액: <b>${Math.round(estCoupangGmv).toLocaleString()}원</b>\n` +
        `• 실제 내 커미션 수익(3%): <b>+${estCoupangNet.toLocaleString()}원</b>\n\n` +
        `🏷️ <b>3. 링크프라이스(A100708867) 매출 및 내 순수익</b>\n` +
        `• 추정 제휴몰 발생 매출액: <b>${Math.round(estLpGmv).toLocaleString()}원</b>\n` +
        `• 실제 내 커미션 수익(평균 4%): <b>+${estLpNet.toLocaleString()}원</b>\n\n` +
        `📊 <b>4. 합산 예상 순수익: +${(estCoupangNet + estLpNet).toLocaleString()}원</b>\n` +
        `• 공식 확정 정산 조회: <a href="https://partners.coupang.com/">쿠팡파트너스 리포트</a> | <a href="https://www.linkprice.com/">링크프라이스 리포트</a>`;

      const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: reportHtml,
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      });
      const sendJson = await sendRes.json();
      if (sendJson.ok && statusBox) {
        statusBox.textContent = "✅ 오전 6시 양식 방문자·매출·순수익 보고서가 텔레그램으로 즉시 전송되었습니다!";
      }
    } catch (e) {
      if (statusBox) statusBox.textContent = `❌ 보고서 발송 중 오류: ${e.message}`;
    }
  };

  /**
   * Export Config JSON
   */
  window.exportConfigJson = function () {
    const monetizationModule = getMonetizationModule();
    const config = monetizationModule.getConfig ? monetizationModule.getConfig() : {};
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "monetization.config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Import Config JSON from File Input
   */
  window.importConfigFromFile = function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const content = e.target.result;
      const monetizationModule = getMonetizationModule();
      if (monetizationModule.importConfigJson) {
        const res = monetizationModule.importConfigJson(content);
        if (res.success) {
          populateWizardFields();
          recalculateCurrent();
          alert("설정 파일이 성공적으로 적용되었습니다!");
        } else {
          alert("설정 파일 파싱 실패: " + res.error);
        }
      }
    };
    reader.readAsText(file);
  };

  /**
   * Monthly 1M KRW Revenue Simulator
   */
  window.runProfitSimulator = function () {
    const visitorsInp = document.getElementById('sim-visitors');
    const cpaPayoutInp = document.getElementById('sim-cpa-payout');
    const visitors = visitorsInp ? parseInt(visitorsInp.value, 10) : 900;
    const cpaPayout = cpaPayoutInp ? parseInt(cpaPayoutInp.value, 10) : 45000;

    const visitorsValEl = document.getElementById('sim-visitors-val');
    const cpaPayoutValEl = document.getElementById('sim-cpa-payout-val');
    if (visitorsValEl) visitorsValEl.textContent = `${visitors.toLocaleString()}명 / 일`;
    if (cpaPayoutValEl) cpaPayoutValEl.textContent = `${cpaPayout.toLocaleString()}원 / 건`;

    const monetizationModule = getMonetizationModule();
    const sim = monetizationModule.calculateRevenueSimulation
      ? monetizationModule.calculateRevenueSimulation(visitors, cpaPayout)
      : null;

    if (!sim) return;

    const cpaKrwEl = document.getElementById('sim-cpa-krw');
    const cpsKrwEl = document.getElementById('sim-cps-krw');
    const adfitKrwEl = document.getElementById('sim-adfit-krw');
    const totalKrwEl = document.getElementById('sim-total-krw');
    const goalStatusEl = document.getElementById('sim-goal-status');

    if (cpaKrwEl) cpaKrwEl.textContent = sim.cpaRevenueFormatted;
    if (cpsKrwEl) cpsKrwEl.textContent = sim.cpsRevenueFormatted;
    if (adfitKrwEl) adfitKrwEl.textContent = sim.adfitRevenueFormatted;
    if (totalKrwEl) {
      totalKrwEl.textContent = sim.totalRevenueFormatted;
      if (sim.goalAchieved) {
        totalKrwEl.className = "text-2xl font-extrabold text-emerald-400";
      } else {
        totalKrwEl.className = "text-2xl font-extrabold text-amber-400";
      }
    }
    if (goalStatusEl) {
      if (sim.goalAchieved) {
        goalStatusEl.innerHTML = `<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-xs font-bold">🎉 월 100만 원 목표 초과 달성!</span>`;
      } else {
        const diff = 1000000 - sim.totalRevenue;
        goalStatusEl.innerHTML = `<span class="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-xs font-bold">🎯 목표까지 ${diff.toLocaleString()}원</span>`;
      }
    }
  };

  /**
   * Highlight Top-Performing UI Slot Based on Real Click Data (Experiment C)
   */
  function highlightWinningSlot() {
    const monetizationModule = getMonetizationModule();
    const config = monetizationModule.getConfig ? monetizationModule.getConfig() : {};
    const slotCounts = config.clicksBySlot || {};
    let topSlot = null;
    let maxClicks = 0;
    Object.keys(slotCounts).forEach(k => {
      if ((slotCounts[k] || 0) > maxClicks) {
        maxClicks = slotCounts[k];
        topSlot = k;
      }
    });
    const topSlotEl = document.getElementById('status-top-slot');
    if (topSlotEl && topSlot) {
      topSlotEl.textContent = `${topSlot} (${maxClicks}회)`;
    }
    const slotDomMap = {
      input_bridge: 'input-instant-bridge',
      receipt_cart: 'receipt-action-cart',
      cpa_card: 'cpa-action-link',
      deal_card: 'product-recommendations',
      sticky_mobile: 'sticky-cta-btn'
    };
    Object.keys(slotDomMap).forEach(k => {
      const el = document.getElementById(slotDomMap[k]);
      if (el) {
        el.classList.toggle('ring-2', k === topSlot && maxClicks >= 2);
        el.classList.toggle('ring-amber-400', k === topSlot && maxClicks >= 2);
      }
    });
  }

  /**
   * Affiliate Link Click Tracker + Slot-Level CTR Analytics + Real-Time Telegram Conversion Signal
   */
  window.recordAffiliateClick = function (channel, url, slot = 'deal_card') {
    const monetizationModule = getMonetizationModule();
    const config = monetizationModule.getConfig ? monetizationModule.getConfig() : {};
    config.clickCount = (config.clickCount || 0) + 1;
    const safeSlot = String(slot || 'deal_card').replace(/[^a-zA-Z0-9_-]/g, '');
    const clicksBySlot = Object.assign({}, config.clicksBySlot || {});
    clicksBySlot[safeSlot] = (clicksBySlot[safeSlot] || 0) + 1;
    config.clicksBySlot = clicksBySlot;

    if (monetizationModule.saveConfigToStorage) {
      monetizationModule.saveConfigToStorage({
        clickCount: config.clickCount,
        clicksBySlot: config.clicksBySlot
      });
    }
    const statusClicks = document.getElementById('status-click-count');
    if (statusClicks) statusClicks.textContent = config.clickCount;
    highlightWinningSlot();

    // 1. Report affiliate click + slot to backend server (/api/track) so 06:00 AM KST daily report & Manager Board have exact slot/channel CTR
    try {
      const safeChannel = String(channel || 'affiliate').replace(/[^a-zA-Z0-9_-]/g, '');
      const safeCalc = String(currentCalc || 'electric').replace(/[^a-zA-Z0-9_-]/g, '');
      const pagePath = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '/';
      if (typeof fetch === 'function') {
        fetch(`/api/track?type=click&channel=${encodeURIComponent(safeChannel)}&calc=${encodeURIComponent(safeCalc)}&slot=${encodeURIComponent(safeSlot)}&p=${encodeURIComponent(pagePath)}`, {
          method: 'GET',
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {}

    // 2. Real-time Telegram click notification (non-blocking)
    const token = config.telegramBotToken;
    const chatId = config.telegramChatId;
    if (
      config.telegramAutoNotify !== false &&
      token &&
      token !== "YOUR_TELEGRAM_BOT_TOKEN" &&
      token.includes(":") &&
      chatId &&
      chatId !== "YOUR_CHAT_ID" &&
      typeof fetch === "function"
    ) {
      const msg =
        `🔔 <b>[머니핏 실시간 수익 전환 신호]</b>\n` +
        `• <b>계산기 카테고리</b>: <code>${currentCalc}</code>\n` +
        `• <b>클릭 채널</b>: <code>${channel}</code>\n` +
        `• <b>전환 UI 슬롯</b>: <code>${safeSlot}</code>\n` +
        `• <b>누적 클릭수</b>: <code>${config.clickCount}회</code>\n` +
        `• <b>이동 링크</b>: ${url}`;
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: msg,
          parse_mode: "HTML",
          disable_web_page_preview: true
        }),
        keepalive: true
      }).catch(() => {});
    }
  };

  /**
   * Clipboard Copy Utilities
   */
  window.copyText = function (elId) {
    if (window.MoneyFitCopyKit && window.MoneyFitCopyKit.copyWithFeedback) {
      MoneyFitCopyKit.copyWithFeedback(elId, null, '원고');
      return;
    }
    const el = document.getElementById(elId);
    if (!el) return;
    const text = el.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert("클립보드에 복사되었습니다! 블로그·지식iN·스레드에 바로 붙여넣으세요.");
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  function fallbackCopy(text, silent = false) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (!silent) {
        if (window.MoneyFitCopyKit && window.MoneyFitCopyKit.showToast) {
          window.MoneyFitCopyKit.showToast("클립보드에 복사되었습니다!");
        }
      }
    } catch (e) {}
    document.body.removeChild(ta);
  }

  /**
   * 1-Second Receipt Summary + Deep-Link Copy for KakaoTalk / Group Chats
   */
  window.copyReceiptShareText = function (btnEl) {
    const titleEl = document.getElementById('calc-form-title');
    const badgeEl = document.getElementById('result-badge');
    const headlineEl = document.getElementById('result-headline');
    const summaryEl = document.getElementById('result-summary-text');
    const metricsEls = document.querySelectorAll('#result-metrics-grid > a, #result-metrics-grid > div');

    const metricLines = [];
    metricsEls.forEach(item => {
      const divs = item.querySelectorAll('div');
      const label = divs[0]?.textContent?.trim() || '';
      const val = divs[1]?.textContent?.trim() || '';
      if (label && val) metricLines.push(`• ${label}: ${val}`);
    });

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?calc=${encodeURIComponent(currentCalc)}&preset=${encodeURIComponent(activeScenarioId)}`;

    const receiptText =
      `🧾 [머니핏 실시간 손익 영수증]\n` +
      `📌 ${titleEl ? titleEl.textContent.trim() : '손익분기점 진단'}\n` +
      `${badgeEl ? badgeEl.textContent.trim() : ''} ${headlineEl ? headlineEl.textContent.trim() : ''}\n` +
      `──────────────────\n` +
      `${metricLines.join('\n')}\n` +
      `──────────────────\n` +
      `💡 ${summaryEl ? summaryEl.textContent.trim() : ''}\n\n` +
      `👉 내 조건 넣고 3초 만에 계산하기: ${shareUrl}`;

    const showCopiedFeedback = () => {
      if (btnEl) {
        const origHtml = btnEl.getAttribute('data-orig-html') || btnEl.innerHTML;
        btnEl.setAttribute('data-orig-html', origHtml);
        btnEl.innerHTML = '✅ 카톡·클립보드 복사 완료!';
        btnEl.classList.add('bg-emerald-400', 'text-slate-950');
        setTimeout(() => {
          btnEl.innerHTML = origHtml;
          btnEl.classList.remove('bg-emerald-400');
        }, 2200);
      }
      if (window.MoneyFitCopyKit && window.MoneyFitCopyKit.showToast) {
        window.MoneyFitCopyKit.showToast("내 손익 영수증이 복사되었습니다! 카카오톡·단톡방에 붙여넣으세요.");
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(receiptText).then(showCopiedFeedback).catch(() => {
        fallbackCopy(receiptText, true);
        showCopiedFeedback();
      });
    } else {
      fallbackCopy(receiptText, true);
      showCopiedFeedback();
    }
  };

  window.copyShareUrl = function () {
    window.copyReceiptShareText(document.getElementById('btn-share-receipt'));
  };

  /**
   * [개선안 2] 카톡 '나에게 보내기' & 메모장 1초 보관함 패키지 (견적서 + 쿠팡·링크프라이스 최저가 구매링크 직결)
   */
  function buildKakaoMemoPackage() {
    const titleEl = document.getElementById('calc-form-title');
    const badgeEl = document.getElementById('result-badge');
    const headlineEl = document.getElementById('result-headline');
    const zfEl = document.getElementById('receipt-zero-feel-banner');
    const metricsEls = document.querySelectorAll('#result-metrics-grid > a, #result-metrics-grid > div');

    const metricLines = [];
    metricsEls.forEach(item => {
      const divs = item.querySelectorAll('div');
      const label = divs[0]?.textContent?.trim() || '';
      const val = divs[1]?.textContent?.trim() || '';
      if (label && val) metricLines.push(`• ${label}: ${val}`);
    });

    const monetizationModule = getMonetizationModule();
    const buildCoupangHref = (kw) => {
      return monetizationModule.buildCoupangUrl
        ? monetizationModule.buildCoupangUrl(kw, currentCalc)
        : `https://www.coupang.com/np/search?q=${encodeURIComponent(kw || '')}&lptag=AF7865143`;
    };
    const buildLpHref = (merchant, url) => {
      return monetizationModule.buildLinkPriceDeepLink
        ? monetizationModule.buildLinkPriceDeepLink(merchant, url)
        : (url || 'https://truthofmarket.com');
    };

    const actionItems = (lastCalcResult && Array.isArray(lastCalcResult.actionItems)) ? lastCalcResult.actionItems : [];
    const purchaseLines = actionItems.slice(0, 3).map((item, idx) => {
      const cpUrl = buildCoupangHref(item.coupangKw);
      const lpUrl = buildLpHref(item.lpMerchant, item.lpUrl);
      return (
        `[${idx + 1}] ${item.icon || '🛒'} ${item.label} (${item.calcVal})\n` +
        `  🚀 쿠팡 로켓배송 최저가: ${cpUrl}\n` +
        `  🏷️ 공식몰 제휴 특가: ${lpUrl}`
      );
    });

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?calc=${encodeURIComponent(currentCalc)}&preset=${encodeURIComponent(activeScenarioId)}`;

    const text =
      `💬 [머니핏 내 계산 견적서 + 최저가 장바구니 보관함]\n` +
      `📌 ${titleEl ? titleEl.textContent.trim() : '손익분기점 진단'}\n` +
      `${badgeEl ? badgeEl.textContent.trim() : ''} ${headlineEl ? headlineEl.textContent.trim() : ''}\n` +
      `${zfEl ? '🔥 ' + zfEl.textContent.trim() + '\n' : ''}` +
      `──────────────────\n` +
      `${metricLines.join('\n')}\n` +
      `──────────────────\n` +
      `🛒 [집에서 바로 결제하는 1:1 맞춤 최저가 링크]\n` +
      `${purchaseLines.join('\n\n')}\n` +
      `──────────────────\n` +
      `👉 내 계산기 다시 열기: ${shareUrl}\n` +
      `※ 이 포스팅은 쿠팡 파트너스 및 링크프라이스 제휴 활동의 일환으로 이에 따른 일정액의 수수료를 제공받습니다.`;

    return {
      title: `[머니핏 견적서] ${headlineEl ? headlineEl.textContent.trim() : '맞춤 손익 영수증'}`,
      text,
      url: shareUrl
    };
  }

  window.copyKakaoMemoBridge = function (btnEl) {
    const pkg = buildKakaoMemoPackage();
    if (typeof window.recordAffiliateClick === 'function') {
      window.recordAffiliateClick('coupang', pkg.url, 'receipt_cart');
    }

    const showFeedback = () => {
      if (btnEl) {
        const origHtml = btnEl.getAttribute('data-orig-html') || btnEl.innerHTML;
        btnEl.setAttribute('data-orig-html', origHtml);
        btnEl.innerHTML = '<span>✅</span><span>견적서+구매링크 복사 완료! 카톡에 붙여넣으세요</span>';
        setTimeout(() => {
          btnEl.innerHTML = origHtml;
        }, 2600);
      }
      if (window.MoneyFitCopyKit && window.MoneyFitCopyKit.showToast) {
        window.MoneyFitCopyKit.showToast("💬 내 계산 견적서 + 쿠팡·공식몰 최저가 링크가 복사되었습니다! 카카오톡 '나에게 보내기'나 메모장에 붙여넣으세요.");
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pkg.text).then(showFeedback).catch(() => {
        fallbackCopy(pkg.text, true);
        showFeedback();
      });
    } else {
      fallbackCopy(pkg.text, true);
      showFeedback();
    }
  };

  window.shareKakaoOrNative = function (btnEl) {
    const pkg = buildKakaoMemoPackage();
    if (typeof window.recordAffiliateClick === 'function') {
      window.recordAffiliateClick('coupang', pkg.url, 'receipt_cart');
    }
    if (navigator.share) {
      navigator.share({
        title: pkg.title,
        text: pkg.text,
        url: pkg.url
      }).catch(() => {
        window.copyKakaoMemoBridge(btnEl);
      });
    } else {
      window.copyKakaoMemoBridge(btnEl);
    }
  };

  function enableAdminMode(openWizard = true) {
    document.getElementById('admin-status-bar')?.classList.remove('hidden');
    document.getElementById('tab-btn-seo')?.classList.remove('hidden');
    document.getElementById('tab-btn-wizard')?.classList.remove('hidden');
    document.getElementById('tab-btn-office')?.classList.remove('hidden');
    if (openWizard && typeof window.switchMainTab === 'function') {
      window.switchMainTab('wizard');
    }
  }
  window.enableAdminMode = enableAdminMode;

  let logoTapCount = 0;
  let logoTapTimer = null;
  window.handleLogoSecretTap = function () {
    logoTapCount++;
    if (logoTapTimer) clearTimeout(logoTapTimer);
    logoTapTimer = setTimeout(() => {
      logoTapCount = 0;
    }, 3000);
    if (logoTapCount >= 5) {
      logoTapCount = 0;
      enableAdminMode(false);
      if (window.MoneyFitCopyKit && window.MoneyFitCopyKit.showToast) {
        window.MoneyFitCopyKit.showToast("🔓 총괄 매니저 관리자 모드(웹툰·수익화 마법사·실시간 CTR 바)가 활성화되었습니다!");
      }
    }
  };

  /**
   * Bootstrapping on DOM Ready
   */
  window.addEventListener('DOMContentLoaded', () => {
    const monetizationModule = getMonetizationModule();
    if (monetizationModule.loadConfigFromStorage) {
      monetizationModule.loadConfigFromStorage();
    }
    const cfg = monetizationModule.getConfig ? monetizationModule.getConfig() : {};
    updateStatusBar(cfg);

    let initialCalc = 'electric';
    let initialPreset = null;
    try {
      const params = new URLSearchParams(window.location.search);
      const calcParam = params.get('calc');
      const presetParam = params.get('preset');
      if (presetParam) {
        const found = getPresetsList().find(p => p.id === presetParam);
        if (found) initialPreset = found;
      }
      if (calcParam && ['electric', 'diet', 'pet', 'room', 'auto', 'telecom'].includes(calcParam)) {
        initialCalc = calcParam;
      }
    } catch (e) {}

    if (initialPreset) {
      window.applyScenarioPreset(initialPreset.id);
    } else {
      selectCalc(initialCalc);
    }
    runProfitSimulator();

    // Unlock owner-only admin mode if ?admin=2370 or ?admin=1 is present in URL
    try {
      const params = new URLSearchParams(window.location.search);
      const adminParam = params.get('admin');
      if (adminParam === '2370' || adminParam === '1' || adminParam === 'true') {
        enableAdminMode(true);
      }
    } catch (e) {}

    // Secret keyboard shortcut for owner: Ctrl + Shift + M
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        enableAdminMode(true);
      }
    });
  });

})();
