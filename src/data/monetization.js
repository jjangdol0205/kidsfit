/**
 * MoneyFit Multi-Monetization Engine (SSOT)
 * Implements 5 Monetization Pipelines, Deep Link Generators,
 * Setup Wizard Config Persistence, and Revenue Simulator.
 * Compatible with Node.js and Browser environments.
 */

const DEFAULT_MONETIZATION_CONFIG = {
  siteUrl: "https://truthofmarket.com",
  coupangAfId: "AF7865143",
  linkPriceId: "A100123456",
  cpaMemberId: "01080142370",
  adfitUnitId: "DAN-SAMPLE-TOP",
  adfitBottomUnitId: "DAN-SAMPLE-BOTTOM",
  telegramBotToken: "YOUR_TELEGRAM_BOT_TOKEN",
  telegramChatId: "YOUR_CHAT_ID",
  telegramAutoNotify: true,
  clickCount: 0,
  ftcNotice: "이 포스팅은 쿠팡 파트너스 및 제휴마케팅 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다. (이용자 추가 부담금 없음)",
  campaigns: {
    electric_grade1_rental: {
      cpaKey: "electric_grade1_rental",
      name: "에너지 1등급 가전 렌탈 & 정부 환급금 조회",
      payout: 35000,
      payoutLabel: "35,000원",
      targetUrl: "https://leaderscpa.com/merchant/electric_grade1_rental"
    },
    diet_custom_consulting: {
      cpaKey: "diet_custom_consulting",
      name: "1:1 맞춤 체질 다이어트 무료 진단",
      payout: 45000,
      payoutLabel: "45,000원",
      targetUrl: "https://leaderscpa.com/merchant/diet_custom_consulting"
    },
    pet_insurance_compare: {
      cpaKey: "pet_insurance_compare",
      name: "다이렉트 펫보험 90% 보장 최저가 비교견적",
      payout: 35000,
      payoutLabel: "35,000원",
      targetUrl: "https://leaderscpa.com/merchant/pet_insurance_compare"
    },
    room_moving_quote: {
      cpaKey: "room_moving_quote",
      name: "원룸·포장이사 3초 최저가 비교견적 + 입주청소 특가",
      payout: 30000,
      payoutLabel: "30,000원",
      targetUrl: "https://leaderscpa.com/merchant/room_moving_quote"
    },
    auto_longterm_rent: {
      cpaKey: "auto_longterm_rent",
      name: "국내 21개 렌트·리스사 무서류 1분 최저가 견적",
      payout: 60000,
      payoutLabel: "60,000원",
      targetUrl: "https://leaderscpa.com/merchant/auto_longterm_rent"
    },
    telecom_internet_switch: {
      cpaKey: "telecom_internet_switch",
      name: "인터넷+TV 위약금 전액 지원 + 현금 47만 원 당일 입금",
      payout: 55000,
      payoutLabel: "55,000원",
      targetUrl: "https://leaderscpa.com/merchant/telecom_internet_switch"
    }
  },
  merchants: {
    himart: {
      name: "롯데하이마트",
      merchantId: "himart",
      defaultUrl: "https://www.e-himart.co.kr/",
      commission: "1.5%~3.5%"
    },
    gmarket: {
      name: "지마켓",
      merchantId: "gmarket",
      defaultUrl: "https://www.gmarket.co.kr/",
      commission: "1.0%~3.0%"
    },
    "11st": {
      name: "11번가",
      merchantId: "11st",
      defaultUrl: "https://www.11st.co.kr/",
      commission: "1.0%~3.0%"
    },
    hanssem: {
      name: "한샘몰",
      merchantId: "hanssem",
      defaultUrl: "https://mall.hanssem.com/",
      commission: "2.5%~4.0%"
    },
    ssg: {
      name: "SSG닷컴",
      merchantId: "ssg",
      defaultUrl: "https://www.ssg.com/",
      commission: "1.5%~3.5%"
    },
    ktshop: {
      name: "KT샵",
      merchantId: "ktshop",
      defaultUrl: "https://shop.kt.com/",
      commission: "건당 15,000원~40,000원"
    },
    ohou: {
      name: "오늘의집",
      merchantId: "ohou",
      defaultUrl: "https://ohou.se/",
      commission: "2.0%~4.0%"
    }
  }
};

// Global active configuration state
let currentConfig = { ...DEFAULT_MONETIZATION_CONFIG };

/**
 * Get current configuration
 */
function getConfig() {
  return currentConfig;
}

/**
 * Update current configuration
 */
function updateConfig(newConfig = {}) {
  currentConfig = {
    ...currentConfig,
    ...newConfig
  };
  return currentConfig;
}

/**
 * Pipeline 1: Coupang Partners Deep Link Generator
 * Formula: https://www.coupang.com/np/search?q={encoded}&channel=user&lptag={afId}&subid=mf_{calcId}_{afId}
 */
function buildCoupangUrl(keyword, afIdOrCalcId = null, optionalCalcId = null) {
  let afId = currentConfig.coupangAfId || "AF7865143";
  let calcId = "portal";

  if (typeof afIdOrCalcId === "string") {
    if (afIdOrCalcId.startsWith("AF")) {
      afId = afIdOrCalcId;
      if (optionalCalcId) calcId = optionalCalcId;
    } else {
      calcId = afIdOrCalcId;
      if (optionalCalcId && optionalCalcId.startsWith("AF")) {
        afId = optionalCalcId;
      }
    }
  }

  const encoded = encodeURIComponent(keyword || "");
  const subId = `mf_${calcId}_${afId}`;
  return `https://www.coupang.com/np/search?q=${encoded}&channel=user&lptag=${afId}&subid=${subId}`;
}

/**
 * Pipeline 2: LinkPrice Deep Link Generator
 * Formula: https://click.linkprice.com/click.php?m={merchantId}&a={lpId}&l=9999&u={encodedTargetUrl}
 */
function buildLinkPriceDeepLink(merchantId, targetUrl, lpId = null) {
  const effectiveLpId = lpId || currentConfig.linkPriceId || "A100123456";
  const encodedUrl = encodeURIComponent(targetUrl || "");
  return `https://click.linkprice.com/click.php?m=${merchantId}&a=${effectiveLpId}&l=9999&u=${encodedUrl}`;
}

/**
 * Pipeline 3: High-Ticket CPA Campaign URL Generator
 * Formula: https://leaderscpa.com/merchant/{campaignKey}?member={cpaMemberId}&benefit={encodedBenefit}
 */
function buildCpaUrl(campaignKey, dynamicValue = "", memberId = null) {
  const effectiveMemberId = memberId || currentConfig.cpaMemberId || "01080142370";
  const encodedValue = encodeURIComponent(dynamicValue || "");
  return `https://leaderscpa.com/merchant/${campaignKey}?member=${effectiveMemberId}&benefit=${encodedValue}`;
}

/**
 * Pipeline 4: High-ticket CPA Recommendation Card Data Generator
 * Substitutes calculated saving amounts into copy and links
 */
function getCpaCardDetails(calcId, calculatedResult, config = null) {
  const cfg = config || currentConfig;
  const memberId = cfg.cpaMemberId || "01080142370";

  const map = {
    electric: {
      campaignKey: "electric_grade1_rental",
      payout: "35,000원",
      payoutWon: 35000,
      title: `초기비용 0원! 에너지 1등급 가전 렌탈 & 정부 환급금 조회 (월 ${(calculatedResult.monthlySaving || 10000).toLocaleString()}원 절감)`,
      desc: "에너지소비효율 1등급 환급금 최대 30만 원 지원 및 렌탈 제휴 프로모션",
      cta: `👉 월 ${(calculatedResult.monthlySaving || 10000).toLocaleString()}원 아끼는 1등급 가전 렌탈 지원금 조회하기`,
      benefit: `${calculatedResult.monthlySaving || 10000}`
    },
    diet: {
      campaignKey: "diet_custom_consulting",
      payout: "45,000원",
      payoutWon: 45000,
      title: `혼자 빼기 힘들다면? ${calculatedResult.weeks || 4}주 책임 감량 1:1 체질 맞춤 다이어트 무료 진단`,
      desc: "체성분 분석 기반 한약/식단 1:1 처방 무료 상담",
      cta: `👉 ${calculatedResult.weeks || 4}주 목표 체중 달성 1:1 무료 상담 신청하기`,
      benefit: `${calculatedResult.chickenPacks || 0}팩`
    },
    pet: {
      campaignKey: "pet_insurance_compare",
      payout: "35,000원",
      payoutWon: 35000,
      title: `슬개골·피부병 병원비 평균 180만 원! ${calculatedResult.petWeight || 5}kg 우리 아이 펫보험 90% 보장 최저가 비교`,
      desc: "수술비·통원비 1일 최대 30만 원 지원 다이렉트 펫보험 즉시비교",
      cta: `👉 ${calculatedResult.petWeight || 5}kg 맞춤 펫보험 최저가 비교견적 1초 확인`,
      benefit: `${calculatedResult.dailyGrams || 100}g`
    },
    room: {
      campaignKey: "room_moving_quote",
      payout: "30,000원",
      payoutWon: 30000,
      title: `${calculatedResult.roomSize || 7}평 맞춤 원룸·포장이사 3초 최저가 비교견적 + 입주청소 특가`,
      desc: "전국 검증 우수 이사업체 실시간 역경매 무료 견적",
      cta: `👉 ${calculatedResult.roomSize || 7}평 최저가 이사 견적 3초 만에 무료 받기`,
      benefit: `${calculatedResult.budgetMan || 150}만원`
    },
    auto: {
      campaignKey: "auto_longterm_rent",
      payout: "60,000원",
      payoutWon: 60000,
      title: `할부보다 ${calculatedResult.diffMan || 0}만 원 아끼는 국내 21개 렌트·리스사 무서류 1분 최저가 견적`,
      desc: "초기비용 0원 무보증 특판, 사업자 연 1,500만 원 전액 비용처리",
      cta: `👉 할부보다 ${calculatedResult.diffMan || 0}만 원 저렴한 최저가 특판 즉시출고 조회`,
      benefit: `${calculatedResult.diffMan || 0}만원`
    },
    telecom: {
      campaignKey: "telecom_internet_switch",
      payout: "55,000원",
      payoutWon: 55000,
      title: `위약금 ${calculatedResult.penaltyMan || 0}만 원 완벽 방어 + 현금 사은품 ${calculatedResult.cashGiftMan || 47}만 원 당일 입금 무료 상담`,
      desc: "통신 3사 당일 설치 + 방통위 경품고시제 최대 현금 사은품 47만 원",
      cta: "👉 위약금 전액 지원 + 현금 47만 원 당일 입금 신청하기",
      benefit: `${calculatedResult.totalNetBenefit || 0}`
    }
  };

  const details = map[calcId] || map.electric;
  const actionUrl = buildCpaUrl(details.campaignKey, details.benefit, memberId);

  return {
    ...details,
    actionUrl
  };
}

/**
 * Pipeline 5: Kakao AdFit Responsive Banner Markup Generator
 */
function renderAdfitSlot(unitId = null, position = "top") {
  const effectiveId = unitId || (position === "bottom" ? currentConfig.adfitBottomUnitId : currentConfig.adfitUnitId);
  const sizeClass = position === "bottom" ? "w-[300px] h-[250px]" : "w-full max-w-[728px] h-[90px]";

  return `
    <div class="adfit-slot ${sizeClass} mx-auto my-3 flex items-center justify-center bg-slate-100 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 overflow-hidden">
      <div>
        <div class="font-bold text-slate-700">📢 Kakao AdFit (${position === "bottom" ? "300x250" : "728x90"})</div>
        <div class="text-[11px] text-slate-400 mt-0.5">단위 ID: <code class="text-blue-600">${effectiveId}</code></div>
      </div>
    </div>
  `;
}

/**
 * Monthly 1,000,000 KRW Revenue Goal Simulator
 * Formula:
 * - V_month = V_daily * 30
 * - CPA Revenue: V_month * 0.045 (CTR) * 0.013 (CVR) * cpaPayout
 * - CPS Revenue: V_month * 0.08 (CTR) * 0.055 (CVR) * 45,000 * 0.03
 * - AdFit Revenue: V_month * 1.8 (PV) * (1400 / 1000) (eCPM)
 */
function calculateRevenueSimulation(visitorsArg = 900, cpaPayoutArg = 45000) {
  let dailyVisitors = 900;
  let cpaPayout = 45000;

  if (typeof visitorsArg === "object" && visitorsArg !== null) {
    dailyVisitors = Number(visitorsArg.visitors || visitorsArg.dailyVisitors) || 900;
    cpaPayout = Number(visitorsArg.cpaPayout) || 45000;
  } else {
    dailyVisitors = Number(visitorsArg) || 900;
    cpaPayout = Number(cpaPayoutArg) || 45000;
  }

  // If passed as monthly visits
  if (dailyVisitors > 10000) {
    dailyVisitors = Math.round(dailyVisitors / 30);
  }

  const monthlyVisits = dailyVisitors * 30;

  // 1. CPA Revenue
  const cpaCtr = 0.045;
  const cpaCvr = 0.013;
  const cpaRevenue = Math.round(monthlyVisits * cpaCtr * cpaCvr * cpaPayout);

  // 2. CPS (Coupang + LinkPrice) Revenue
  const cpsCtr = 0.08;
  const cpsCvr = 0.055;
  const avgOrderPrice = 45000;
  const cpsCommissionRate = 0.03;
  const cpsRevenue = Math.round(monthlyVisits * cpsCtr * cpsCvr * avgOrderPrice * cpsCommissionRate);

  // 3. Kakao AdFit Revenue
  const impressionsPerVisitor = 1.8;
  const ecpm = 1400;
  const adfitRevenue = Math.round(monthlyVisits * impressionsPerVisitor * (ecpm / 1000));

  // 4. Total Monthly Revenue
  const totalRevenue = cpaRevenue + cpsRevenue + adfitRevenue;
  const goalAchieved = totalRevenue >= 1000000;

  return {
    dailyVisitors,
    monthlyVisits,
    cpaPayout,
    cpaRevenue,
    cpsRevenue,
    adfitRevenue,
    totalRevenue,
    goalAchieved,
    cpaRevenueFormatted: `${cpaRevenue.toLocaleString()}원`,
    cpsRevenueFormatted: `${cpsRevenue.toLocaleString()}원`,
    adfitRevenueFormatted: `${adfitRevenue.toLocaleString()}원`,
    totalRevenueFormatted: `${totalRevenue.toLocaleString()}원`
  };
}

/**
 * 10-Minute Setup Wizard: LocalStorage & JSON Management
 */
const STORAGE_KEY = "moneyfit_monetization_config_v1";

function loadConfigFromStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        currentConfig = { ...currentConfig, ...parsed };
      }
    } catch (e) {
      console.warn("Failed to read config from localStorage:", e);
    }
  }
  return currentConfig;
}

function saveConfigToStorage(configToSave = null) {
  if (configToSave) {
    updateConfig(configToSave);
  }
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig, null, 2));
    } catch (e) {
      console.warn("Failed to save config to localStorage:", e);
    }
  }
  return currentConfig;
}

function exportConfigJson() {
  return JSON.stringify(currentConfig, null, 2);
}

function importConfigJson(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid JSON: root must be an object");
    }
    updateConfig(parsed);
    saveConfigToStorage();
    return { success: true, config: currentConfig };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Universal Module Definition
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_MONETIZATION_CONFIG,
    getConfig,
    updateConfig,
    buildCoupangUrl,
    buildLinkPriceDeepLink,
    buildCpaUrl,
    getCpaCardDetails,
    renderAdfitSlot,
    calculateRevenueSimulation,
    loadConfigFromStorage,
    saveConfigToStorage,
    exportConfigJson,
    importConfigJson
  };
}

if (typeof window !== "undefined") {
  window.MoneyFitMonetization = {
    DEFAULT_MONETIZATION_CONFIG,
    getConfig,
    updateConfig,
    buildCoupangUrl,
    buildLinkPriceDeepLink,
    buildCpaUrl,
    getCpaCardDetails,
    renderAdfitSlot,
    calculateRevenueSimulation,
    loadConfigFromStorage,
    saveConfigToStorage,
    exportConfigJson,
    importConfigJson
  };
  window.buildCoupangUrl = buildCoupangUrl;
  window.buildLinkPriceDeepLink = buildLinkPriceDeepLink;
  window.buildCpaUrl = buildCpaUrl;
  window.calculateRevenueSimulation = calculateRevenueSimulation;
}
