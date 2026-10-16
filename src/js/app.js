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

  /**
   * Switch Active Calculator
   */
  window.selectCalc = function (calcKey, customInputs = null) {
    currentCalc = calcKey;
    const calcModule = getCalcModule();
    const spec = calcModule.CALCULATORS ? calcModule.CALCULATORS[calcKey] : null;
    if (!spec) return;

    const titleEl = document.getElementById('calc-form-title');
    if (titleEl) titleEl.textContent = spec.title;

    // Update calculator tab styles
    document.querySelectorAll('.calc-nav-btn').forEach(btn => {
      btn.className = "calc-nav-btn p-3 rounded-xl border text-left transition bg-white border-slate-200 hover:border-blue-400";
    });
    const activeBtn = document.getElementById(`calc-nav-${calcKey}`);
    if (activeBtn) {
      activeBtn.className = "calc-nav-btn p-3 rounded-xl border text-left transition bg-blue-50 border-blue-600 text-blue-900 font-bold";
    }

    // Render input form controls
    const container = document.getElementById('calc-inputs-container');
    if (container) {
      container.innerHTML = spec.inputs.map(inp => {
        const val = customInputs && customInputs[inp.id] !== undefined ? customInputs[inp.id] : inp.value;
        if (inp.type === "checkbox") {
          return `
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label for="inp-${inp.id}" class="text-xs font-bold text-slate-700 cursor-pointer">${inp.label}</label>
              <input id="inp-${inp.id}" type="checkbox" ${val ? 'checked' : ''}
                onchange="recalculateCurrent()"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" />
            </div>
          `;
        }
        if (inp.type === "select") {
          const optionsHtml = (inp.options || []).map(opt => `
            <option value="${opt.value}" ${val === opt.value ? 'selected' : ''}>${opt.label}</option>
          `).join('');
          return `
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">${inp.label}</label>
              <select id="inp-${inp.id}" onchange="recalculateCurrent()"
                class="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:border-blue-600 focus:outline-none bg-white">
                ${optionsHtml}
              </select>
            </div>
          `;
        }
        return `
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-700">${inp.label}</label>
              <span id="label-val-${inp.id}" class="text-xs text-blue-600 font-semibold"></span>
            </div>
            <input id="inp-${inp.id}" type="number" value="${val}" min="${inp.min !== undefined ? inp.min : ''}" max="${inp.max !== undefined ? inp.max : ''}" step="${inp.step || '1'}"
              oninput="recalculateCurrent()"
              class="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:border-blue-600 focus:outline-none" />
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

    const values = {};
    spec.inputs.forEach(inp => {
      const el = document.getElementById(`inp-${inp.id}`);
      if (el) {
        if (inp.type === "checkbox") {
          values[inp.id] = el.checked;
        } else if (inp.type === "select") {
          values[inp.id] = el.value;
        } else {
          values[inp.id] = parseFloat(el.value);
          const valLabel = document.getElementById(`label-val-${inp.id}`);
          if (valLabel && !isNaN(values[inp.id])) {
            valLabel.textContent = values[inp.id].toLocaleString();
          }
        }
      } else {
        values[inp.id] = inp.value;
      }
    });

    const res = spec.calculate(values);
    if (!res) return;

    // 1. Receipt shock diagnosis card
    const badgeEl = document.getElementById('result-badge');
    const headlineEl = document.getElementById('result-headline');
    const summaryEl = document.getElementById('result-summary-text');
    const metricsGrid = document.getElementById('result-metrics-grid');

    if (badgeEl) {
      badgeEl.textContent = res.badge;
      if (res.badge && (res.badge.includes('폭탄') || res.badge.includes('경보') || res.badge.includes('손해') || res.badge.includes('권장') || (res.totalNetBenefit !== undefined && res.totalNetBenefit < 0))) {
        badgeEl.className = "inline-block bg-rose-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full mb-1";
      } else if (res.totalNetBenefit !== undefined && res.totalNetBenefit > 0) {
        badgeEl.className = "inline-block bg-emerald-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full mb-1";
      } else {
        badgeEl.className = "inline-block bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full mb-1";
      }
    }
    if (headlineEl) headlineEl.textContent = res.headline;
    if (summaryEl) summaryEl.textContent = res.summary;

    if (metricsGrid && res.metrics) {
      const colClass = res.metrics.length >= 4 ? "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" : "grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4";
      metricsGrid.className = colClass;
      metricsGrid.innerHTML = res.metrics.map(m => {
        const isNeg = String(m.val).startsWith('-');
        const valColor = isNeg ? 'text-rose-400' : 'text-amber-400';
        return `
          <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
            <div class="text-[11px] text-slate-400">${m.label}</div>
            <div class="text-base font-extrabold ${valColor} mt-0.5">${m.val}</div>
          </div>
        `;
      }).join('');
    }

    // 2. High-Ticket CPA Native Card
    const monetizationModule = getMonetizationModule();
    const config = monetizationModule.getConfig ? monetizationModule.getConfig() : {};
    const cpaDetails = monetizationModule.getCpaCardDetails
      ? monetizationModule.getCpaCardDetails(currentCalc, res, config)
      : null;

    const cpaTitleEl = document.getElementById('cpa-title');
    const cpaPayoutTagEl = document.getElementById('cpa-payout-tag');
    const cpaActionLinkEl = document.getElementById('cpa-action-link');
    const cpaDescEl = document.getElementById('cpa-desc');

    if (cpaDetails) {
      if (cpaTitleEl) cpaTitleEl.textContent = cpaDetails.title;
      if (cpaPayoutTagEl) cpaPayoutTagEl.textContent = `승인 시 예상 수익: 건당 ${cpaDetails.payout}`;
      if (cpaDescEl) cpaDescEl.textContent = cpaDetails.desc;
      if (cpaActionLinkEl) {
        cpaActionLinkEl.href = cpaDetails.actionUrl;
        cpaActionLinkEl.textContent = cpaDetails.cta;
      }
    } else {
      if (cpaTitleEl) cpaTitleEl.textContent = res.cpaTitle || "맞춤 무료 견적 조회";
      if (cpaPayoutTagEl) cpaPayoutTagEl.textContent = `승인 시 예상 수익: 건당 ${res.cpaPayout || "45,000원"}`;
      if (cpaActionLinkEl) {
        const cpaUrl = monetizationModule.buildCpaUrl
          ? monetizationModule.buildCpaUrl(res.cpaKey || "cpa", res.cpaBenefit || "")
          : "#";
        cpaActionLinkEl.href = cpaUrl;
      }
    }

    // 3. Products Recommendations (Coupang + LinkPrice)
    const productsContainer = document.getElementById('product-recommendations');
    if (productsContainer && res.products) {
      productsContainer.innerHTML = res.products.map(p => {
        let href = "#";
        if (p.type === 'coupang') {
          href = monetizationModule.buildCoupangUrl
            ? monetizationModule.buildCoupangUrl(p.kw, currentCalc)
            : `https://www.coupang.com/np/search?q=${encodeURIComponent(p.kw)}`;
        } else {
          href = monetizationModule.buildLinkPriceDeepLink
            ? monetizationModule.buildLinkPriceDeepLink(p.merchant, p.url)
            : p.url;
        }
        const tag = p.type === 'coupang' ? '쿠팡 로켓배송 (CPS 3%)' : `링크프라이스 제휴 (${p.merchant})`;
        const tagColor = p.type === 'coupang' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700';

        return `
          <a href="${href}" target="_blank" rel="noopener noreferrer sponsored"
             onclick="recordAffiliateClick('${p.type}', this.href)"
             class="block border border-slate-200 hover:border-blue-500 rounded-xl p-3.5 transition bg-slate-50/60 hover:bg-blue-50/40">
            <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded ${tagColor} mb-1">${tag}</span>
            <div class="text-xs font-bold text-slate-800">${p.title}</div>
            <div class="text-[11px] text-blue-600 font-semibold mt-1">최저가 확인 및 혜택 보기 →</div>
          </a>
        `;
      }).join('');
    }
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

    // 1. Naver Blog / Tistory Post (1500+ Korean characters preview)
    const blogPost = `[제목] ${preset.title} (2026 최신 손익분기점 총정리)\n\n` +
      `안녕하세요! 매달 고정비 지출과 생활 예산 때문에 고민하시는 분들을 위해 오늘은 '${preset.title}' 주제를 심층 분석해 드립니다.\n` +
      `단순히 대략적인 감으로 지출을 관리하면 1년에 수십만 원에서 수백만 원까지 불필요한 금전적 손실이 발생할 수 있습니다.\n\n` +
      `■ 핵심 수치 진단 결과: ${res.headline}\n` +
      `- ${res.metrics.map(m => `${m.label}: ${m.val}`).join('\n- ')}\n\n` +
      `■ 상세 분석 및 전문가 코멘트\n${res.summary}\n\n` +
      `■ 손해를 막는 3대 실천 전략\n` +
      `1. 내 상황에 정확히 맞는 수치를 입력해 오차 없는 손익분기점을 먼저 확인하세요.\n` +
      `2. 불필요하게 낭비되는 누진 구간, 약정 위약금, 과다 사료비 지출을 즉시 차단하세요.\n` +
      `3. 검증된 고효율 환급 기기 또는 제휴 프로모션을 통해 초기비용 부담을 최소화하세요.\n\n` +
      `👉 내 조건(평수/체중/약정기간)을 직접 넣어서 3초 만에 계산해 보시려면 아래 무료 계산기에서 바로 확인해 보세요!\n` +
      `🔗 무료 맞춤 계산기 바로가기: ${presetUrl}\n\n` +
      `#${preset.title.split(' ').slice(0, 4).join(' #')} #손익분기점계산기 #생활꿀팁 #머니핏`;

    // 2. Threads / Group Chat 3-Line Summary
    const threadsPost = `🚨 아직도 '${preset.title}' 모르고 돈 날리는 분 계신가요?\n` +
      `방금 계산기 돌려봤는데 ${res.headline} 나옵니다 ㄷㄷ\n` +
      `내 조건 넣고 3초 만에 손익분기점 확인하기 👉 ${presetUrl}`;

    // 3. Naver Jisik-iN Tailored Reply
    const jisikinPost = `질문자님 조건('${preset.title}')으로 실제 수식을 돌려본 결과입니다.\n\n` +
      `결론부터 말씀드리면 [${res.headline}] 입니다.\n` +
      `${res.summary}\n\n` +
      `더 정확한 본인 수치(시간/금액)별 비교표는 아래 무료 시뮬레이터에서 로그인 없이 바로 계산해 보실 수 있습니다.\n` +
      `출처 및 계산기: ${presetUrl}`;

    // 4. IndexNow API Payload
    const indexNowPayload = {
      host: new URL(siteUrl).host,
      key: "moneyfit8f92a1b4c3d2e1f0",
      keyLocation: `${siteUrl}/moneyfit8f92a1b4c3d2e1f0.txt`,
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

    if (coupangInp) coupangInp.value = config.coupangAfId || "AF1234567";
    if (lpInp) lpInp.value = config.linkPriceId || "A100123456";
    if (cpaInp) cpaInp.value = config.cpaMemberId || "tenping_myid";
    if (adfitInp) adfitInp.value = config.adfitUnitId || "DAN-SAMPLE-TOP";
    if (siteUrlInp) siteUrlInp.value = config.siteUrl || "https://truthofmarket.com";
    if (tgTokenInp) tgTokenInp.value = config.telegramBotToken || "YOUR_TELEGRAM_BOT_TOKEN";
    if (tgChatIdInp) tgChatIdInp.value = config.telegramChatId || "YOUR_CHAT_ID";
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

    if (statusCoupang) statusCoupang.textContent = config.coupangAfId || "AF1234567";
    if (statusLp) statusLp.textContent = config.linkPriceId || "A100123456";
    if (statusCpa) statusCpa.textContent = config.cpaMemberId || "tenping_myid";
    if (statusClicks) statusClicks.textContent = config.clickCount || 0;
    if (adfitLabel) adfitLabel.textContent = config.adfitUnitId || "DAN-SAMPLE-TOP";
  }

  function updateSampleLinksPreview(config) {
    const monetizationModule = getMonetizationModule();
    const sampleCoupang = document.getElementById('sample-synthesized-coupang');
    const sampleLp = document.getElementById('sample-synthesized-lp');

    if (sampleCoupang && monetizationModule.buildCoupangUrl) {
      sampleCoupang.textContent = "쿠팡: " + monetizationModule.buildCoupangUrl("에너지 1등급 가전", "electric");
    }
    if (sampleLp && monetizationModule.buildLinkPriceDeepLink) {
      sampleLp.textContent = "링크프라이스: " + monetizationModule.buildLinkPriceDeepLink("himart", "https://www.e-himart.co.kr/");
    }
  }

  /**
   * Apply Monetization Config Button Handler
   */
  window.applyMonetizationConfig = function () {
    const monetizationModule = getMonetizationModule();
    const coupangAfId = (document.getElementById('cfg-coupang-id')?.value || "").trim() || "AF1234567";
    const linkPriceId = (document.getElementById('cfg-lp-id')?.value || "").trim() || "A100123456";
    const cpaMemberId = (document.getElementById('cfg-cpa-id')?.value || "").trim() || "tenping_myid";
    const adfitUnitId = (document.getElementById('cfg-adfit-id')?.value || "").trim() || "DAN-SAMPLE-TOP";
    const siteUrl = (document.getElementById('cfg-site-url')?.value || "").trim() || "https://truthofmarket.com";
    const telegramBotToken = (document.getElementById('cfg-tg-token')?.value || "").trim() || "YOUR_TELEGRAM_BOT_TOKEN";
    const telegramChatId = (document.getElementById('cfg-tg-chat-id')?.value || "").trim() || "YOUR_CHAT_ID";
    const telegramAutoNotify = document.getElementById('cfg-tg-auto-notify') ? document.getElementById('cfg-tg-auto-notify').checked : true;

    const newConfig = {
      coupangAfId,
      linkPriceId,
      cpaMemberId,
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
        `• <b>자동화 상태</b>: 야간 자율 증식(36개 SEO 페이지 + 108편 홍보 원고 + 스나이퍼 키트) 완료 시 및 실시간 수익 클릭 발생 시 이 채팅방으로 즉시 보고됩니다!`;

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
   * Affiliate Link Click Tracker + Real-Time Telegram Conversion Signal
   */
  window.recordAffiliateClick = function (channel, url) {
    const monetizationModule = getMonetizationModule();
    const config = monetizationModule.getConfig ? monetizationModule.getConfig() : {};
    config.clickCount = (config.clickCount || 0) + 1;
    if (monetizationModule.saveConfigToStorage) {
      monetizationModule.saveConfigToStorage({ clickCount: config.clickCount });
    }
    const statusClicks = document.getElementById('status-click-count');
    if (statusClicks) statusClicks.textContent = config.clickCount;

    // Real-time Telegram click notification (non-blocking)
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

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      alert("클립보드에 복사되었습니다!");
    } catch (e) {
      alert("클립보드 복사에 실패했습니다.");
    }
    document.body.removeChild(ta);
  }

  window.copyShareUrl = function () {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        alert("계산 결과 공유 링크가 복사되었습니다!");
      }).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
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

    selectCalc('electric');
    runProfitSimulator();
  });

})();
