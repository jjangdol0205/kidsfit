/**
 * MoneyFit Multi-Monetization Engine (SSOT)
 * Implements 5 Monetization Pipelines, Deep Link Generators,
 * Setup Wizard Config Persistence, and Revenue Simulator.
 * Compatible with Node.js and Browser environments.
 */

const DEFAULT_MONETIZATION_CONFIG = {
  siteUrl: "https://truthofmarket.com",
  coupangAfId: "AF7865143",
  linkPriceId: "A100708867",
  cpaMemberId: "tp_member_2370",
  cpaUrls: {
    electric: "",
    diet: "",
    pet: "",
    room: "",
    auto: "",
    telecom: ""
  },
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
  const mergedCpaUrls = {
    ...(currentConfig.cpaUrls || DEFAULT_MONETIZATION_CONFIG.cpaUrls),
    ...((newConfig && newConfig.cpaUrls) || {})
  };
  currentConfig = {
    ...currentConfig,
    ...newConfig,
    cpaUrls: mergedCpaUrls
  };
  return currentConfig;
}

/**
 * Resolve exact Coupang Category ID for each calculator & product keyword
 * Verified in real Chrome browser to open 100% valid Coupang category product listings
 * without any '/np/search' access restriction.
 */
function resolveCoupangCategoryId(keyword = "", calcId = "portal") {
  const kw = String(keyword || "");
  if (/플러그|멀티탭|전력측정/.test(kw)) return "510084"; // 멀티탭/연장선/절전플러그
  if (/에어컨|제습기|1등급|인버터/.test(kw)) return "227812"; // 계절가전(에어컨·제습기)
  if (/현미밥|곤약밥|즉석밥/.test(kw)) return "503674"; // 즉석밥/누룽지(로켓프레시)
  if (/닭가슴살|다이어트|식단/.test(kw)) return "502492"; // 냉장/냉동/간편식(로켓프레시)
  if (/영양제|유산균|관절|간식/.test(kw)) return "503730"; // 반려동물 간식/영양제
  if (/사료|로얄캐닌|강아지|고양이|반려/.test(kw)) return "503727"; // 반려동물 사료/용품
  if (/침대|매트리스|프레임|가구/.test(kw)) return "184559"; // 침실가구(침대·매트리스)
  if (/냉장고|세탁기|자취|원룸/.test(kw)) return "403245"; // 냉장고(로켓설치)
  if (/거치대|맥세이프|무선충전/.test(kw)) return "497774"; // 차량용 무선충전 거치대
  if (/블랙박스|아이나비|파인뷰/.test(kw)) return "401214"; // 차량용 블랙박스
  if (/정리함|셋톱박스|거치/.test(kw)) return "184817"; // 선반/정리대/정리함
  if (/공유기|와이파이|랜선|AX3000/.test(kw)) return "497226"; // 공유기/네트워크

  const calcMap = {
    electric: "227812",
    diet: "502492",
    pet: "503727",
    room: "403245",
    auto: "401214",
    telecom: "497226"
  };
  return calcMap[calcId] || "178255";
}

/**
 * Pipeline 1: Coupang Partners Deep Link Generator
 * Uses verified Coupang Category Exhibition URLs (/np/categories/{categoryId}) with lptag & subid
 * so real Chrome browsers land directly on live product listings without '/np/search' restrictions.
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

  const safeKw = keyword !== undefined && keyword !== null ? String(keyword) : "";
  const encoded = encodeURIComponent(safeKw);
  const subId = `mf_${calcId}_${afId}`;
  const categoryId = resolveCoupangCategoryId(safeKw, calcId);
  return `https://www.coupang.com/np/categories/${categoryId}?lptag=${afId}&subid=${subId}&pageKey=${encoded}&q=${encoded}&channel=user`;
}

/**
 * Pipeline 2: LinkPrice Deep Link Generator
 * Uses official LinkPrice tu= (Target URL) parameter so click.linkprice.com/click.php
 * sets the LPUID tracking cookie and redirects cleanly to the merchant.
 */
function buildLinkPriceDeepLink(merchantId, targetUrl, lpId = null) {
  const effectiveLpId = lpId || currentConfig.linkPriceId || "A100708867";
  const encodedUrl = encodeURIComponent(targetUrl || "");
  return `https://click.linkprice.com/click.php?m=${merchantId}&a=${effectiveLpId}&l=9999&tu=${encodedUrl}`;
}

/**
 * Pipeline 3: High-Ticket CPA Campaign URL Generator
 * Supports direct Tenping short links (https://iryan.kr/...) or standard CPA tracking URLs
 */
function buildCpaUrl(campaignKey, dynamicValue = "", memberId = null) {
  const effectiveMemberId = memberId || currentConfig.cpaMemberId || "tp_member_2370";
  const encodedValue = encodeURIComponent(dynamicValue || "");
  if (/^https?:\/\/(iryan\.kr|tenping\.kr)\//i.test(effectiveMemberId)) {
    return effectiveMemberId;
  }
  return `https://leaderscpa.com/merchant/${campaignKey}?member=${effectiveMemberId}&benefit=${encodedValue}`;
}

/**
 * Resolve 100% affiliate-tracked live URL for CTA cards:
 * 1. If a per-calculator Tenping/CPA short URL (e.g. https://iryan.kr/...) is configured in cfg.cpaUrls[calcId], return it.
 * 2. If cfg.cpaMemberId is itself a full https://iryan.kr/... URL, return it.
 * 3. Otherwise, return a 100% revenue-connected LinkPrice (A100708867) or Coupang Partners (AF7865143) deep link
 *    pointing to the exact matching product/exhibition search page (NEVER a non-affiliate external site or bare root homepage).
 */
function buildLiveFallbackCpaUrl(calcId, config = null) {
  const cfg = config || currentConfig;
  if (cfg && cfg.cpaUrls && typeof cfg.cpaUrls[calcId] === "string" && /^https?:\/\//i.test(cfg.cpaUrls[calcId].trim())) {
    return cfg.cpaUrls[calcId].trim();
  }
  const memberId = (cfg && cfg.cpaMemberId) || "tp_member_2370";
  if (/^https?:\/\//i.test(memberId.trim())) {
    return memberId.trim();
  }
  const afId = (cfg && cfg.coupangAfId) || "AF7865143";
  const lpId = (cfg && cfg.linkPriceId) || "A100708867";

  switch (calcId) {
    case "electric":
      // 롯데하이마트 에너지 1등급 인버터 가전 특별 기획전 (링크프라이스 A100708867 딥링크)
      return buildLinkPriceDeepLink(
        "himart",
        "https://www.e-himart.co.kr/app/search/totalSearch?query=%EC%97%90%EB%84%88%EC%A7%80%201%EB%93%B1%EA%B8%89%20%EC%9D%B8%EB%B2%84%ED%84%B0",
        lpId
      );
    case "diet":
      // 쿠팡 파트너스 냉동 닭가슴살·현미밥 대용량 식단 묶음 특가 (쿠팡 AF7865143 딥링크)
      return buildCoupangUrl("냉동 닭가슴살 100g 대용량 현미밥 다이어트 식단 패키지", "diet", afId);
    case "pet":
      // 쿠팡 파트너스 강아지·고양이 가수분해 사료 및 관절 영양제 베스트 (쿠팡 AF7865143 딥링크)
      return buildCoupangUrl("강아지 고양이 가수분해 사료 관절 영양제 베스트", "pet", afId);
    case "room":
      // 현대Hmall 원룸·자취·신혼 침대·매트리스 공간별 기획전 (링크프라이스 A100708867 딥링크)
      return buildLinkPriceDeepLink(
        "hmall",
        "https://www.hmall.com/md/pde/search?searchTerm=%EC%B9%A8%EB%8C%80%20%EB%A7%A4%ED%8A%B8%EB%A6%AC%EC%8A%A4",
        lpId
      );
    case "auto":
      // 지마켓 아이나비·파인뷰 2채널 QHD 블랙박스 무료출장장착 기획전 (링크프라이스 A100708867 딥링크)
      return buildLinkPriceDeepLink(
        "gmarket",
        "https://www.gmarket.co.kr/n/search?keyword=2%EC%B1%84%EB%84%90%20QHD%20%EB%B8%94%EB%9E%99%EB%B0%95%EC%8A%A4%20%EB%AC%B4%EB%A3%8C%EC%9E%A5%EC%B0%A9",
        lpId
      );
    case "telecom":
      // 롯데하이마트 기가 와이파이6 공유기·자급제 통신비 절약 기획전 (링크프라이스 A100708867 딥링크)
      return buildLinkPriceDeepLink(
        "himart",
        "https://www.e-himart.co.kr/app/search/totalSearch?query=%EA%B8%B0%EA%B0%80%20%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0",
        lpId
      );
    default:
      return buildLinkPriceDeepLink(
        "himart",
        "https://www.e-himart.co.kr/app/search/totalSearch?query=%EC%97%90%EB%84%88%EC%A7%80%201%EB%93%B1%EA%B8%89%20%EC%9D%B8%EB%B2%84%ED%84%B0",
        lpId
      );
  }
}

/**
 * Pipeline 4: High-ticket CPA & Multi-Channel Affiliate Card Data Generator
 * Substitutes calculated saving amounts into copy and links.
 * When a Tenping short link (https://iryan.kr/...) is configured for calcId, uses the CPA consultation copy.
 * Otherwise, uses liveTitle / liveDesc / liveCta that 100% match the destination LinkPrice / Coupang exhibition page!
 */
function getCpaCardDetails(calcId, calculatedResult = {}, config = null) {
  const cfg = config || currentConfig;
  const memberId = cfg.cpaMemberId || "tp_member_2370";
  const afId = cfg.coupangAfId || "AF7865143";
  const lpId = cfg.linkPriceId || "A100708867";

  const customCalcUrl = (cfg.cpaUrls && typeof cfg.cpaUrls[calcId] === "string") ? cfg.cpaUrls[calcId].trim() : "";
  const isCustomTenpingUrl = /^https?:\/\//i.test(customCalcUrl) || /^https?:\/\//i.test(memberId.trim());

  const map = {
    electric: {
      campaignKey: "electric_grade1_rental",
      payout: "35,000원",
      payoutWon: 35000,
      title: `초기비용 0원! 에너지 1등급 가전 렌탈 & 정부 환급금 조회 (월 ${(calculatedResult.monthlySaving || 10000).toLocaleString()}원 절감)`,
      desc: "에너지소비효율 1등급 환급금 최대 30만 원 지원 및 렌탈 제휴 프로모션",
      cta: `👉 월 ${(calculatedResult.monthlySaving || 10000).toLocaleString()}원 아끼는 1등급 가전 렌탈 지원금 조회하기`,
      benefit: `${calculatedResult.monthlySaving || 10000}`,
      liveBadge: "🏷️ 링크프라이스 · 롯데하이마트 공식 제휴",
      liveTitle: `에너지 1등급 인버터 에어컨·제습기·절전가전 최저가 기획전 (월 ${(calculatedResult.monthlySaving || 10000).toLocaleString()}원 절감)`,
      liveDesc: "롯데하이마트 × 쿠팡 파트너스 공식 제휴 — 1등급 고효율 가전 카드 즉시할인 & 로켓설치 비교",
      liveCta: `👉 월 ${(calculatedResult.monthlySaving || 10000).toLocaleString()}원 아끼는 하이마트 1등급 인버터 기획전 보기`,
      coupangSubUrl: buildCoupangUrl("에너지소비효율 1등급 인버터 에어컨 제습기", "electric", afId),
      coupangSubLabel: "🚀 쿠팡 1등급 로켓설치 최저가",
      linkPriceSubUrl: buildLinkPriceDeepLink("himart", "https://www.e-himart.co.kr/app/search/totalSearch?query=%EC%97%90%EB%84%88%EC%A7%80%201%EB%93%B1%EA%B8%89%20%EC%9D%B8%EB%B2%84%ED%84%B0", lpId),
      linkPriceSubLabel: "🏷️ 하이마트 1등급 공식 기획전",
      tenpingCampaignName: "미소 정수기·가전 렌탈 가격비교 상담 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    },
    diet: {
      campaignKey: "diet_custom_consulting",
      payout: "45,000원",
      payoutWon: 45000,
      title: `혼자 빼기 힘들다면? ${calculatedResult.weeks || 4}주 책임 감량 1:1 체질 맞춤 다이어트 무료 진단`,
      desc: "체성분 분석 기반 한약/식단 1:1 처방 무료 상담",
      cta: `👉 ${calculatedResult.weeks || 4}주 목표 체중 달성 1:1 무료 상담 신청하기`,
      benefit: `${calculatedResult.chickenPacks || 0}팩`,
      liveBadge: "🚀 쿠팡 로켓프레시 · 롯데ON 공식 제휴",
      liveTitle: `${calculatedResult.weeks || 4}주 식단 완주! 닭가슴살 ${calculatedResult.chickenPacks || 50}팩 · 현미밥 ${calculatedResult.brownRiceBowls || 56}개 대용량 묶음 특가`,
      liveDesc: "쿠팡 로켓프레시 × 롯데ON × 지마켓 제휴 — 편의점 단품 대비 식단비 54% 즉시 절약",
      liveCta: `👉 ${calculatedResult.weeks || 4}주 맞춤 닭가슴살 ${calculatedResult.chickenPacks || 50}팩·현미밥 로켓프레시 특가 보기`,
      coupangSubUrl: buildCoupangUrl("냉동 닭가슴살 100g 대용량 패키지", "diet", afId),
      coupangSubLabel: "🚀 쿠팡 닭가슴살 로켓프레시",
      linkPriceSubUrl: buildLinkPriceDeepLink("lotteon", "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EB%B6%84%EB%A6%AC%EC%9C%A0%EC%B2%AD%EB%8B%A8%EB%B0%B1%EC%A7%88%20WPI", lpId),
      linkPriceSubLabel: "🏷️ 롯데ON WPI 프로틴 특가",
      tenpingCampaignName: "1:1 맞춤 체질 감량 다이어트 무료상담 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    },
    pet: {
      campaignKey: "pet_insurance_compare",
      payout: "35,000원",
      payoutWon: 35000,
      title: `슬개골·피부병 병원비 평균 180만 원! ${calculatedResult.petWeight || 5}kg 우리 아이 펫보험 90% 보장 최저가 비교`,
      desc: "수술비·통원비 1일 최대 30만 원 지원 다이렉트 펫보험 즉시비교",
      cta: `👉 ${calculatedResult.petWeight || 5}kg 맞춤 펫보험 최저가 비교견적 1초 확인`,
      benefit: `${calculatedResult.dailyGrams || 100}g`,
      liveBadge: "🐾 쿠팡 로켓펫닥터 · 지마켓 공식 제휴",
      liveTitle: `${calculatedResult.petWeight || 5}kg 맞춤 가수분해 알러지 사료 & 슬개골·관절 영양제 최저가 특가전`,
      liveDesc: `일일 권장 ${calculatedResult.dailyGrams || 100}g 정량 급여 — 쿠팡 로켓배송 × 지마켓 × 롯데ON 반려동물 공식 특가`,
      liveCta: `👉 ${calculatedResult.petWeight || 5}kg 맞춤 가수분해 사료·관절영양제 최저가 보기`,
      coupangSubUrl: buildCoupangUrl("강아지 고양이 가수분해 사료 관절 영양제 베스트", "pet", afId),
      coupangSubLabel: "🚀 쿠팡 사료·영양제 로켓배송",
      linkPriceSubUrl: buildLinkPriceDeepLink("gmarket", "https://www.gmarket.co.kr/n/search?keyword=%EA%B0%95%EC%95%84%EC%A7%80%20%EA%B0%80%EC%88%98%EB%B6%84%ED%95%B4%20%EC%82%AC%EB%A3%8C%20%EA%B4%80%EC%A0%88%20%EC%98%81%EC%96%91%EC%A0%9C", lpId),
      linkPriceSubLabel: "🏷️ 지마켓 펫 사료·영양제 특가",
      tenpingCampaignName: "반려동물 케어·보험 맞춤 상담 캠페인 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    },
    room: {
      campaignKey: "room_moving_quote",
      payout: "30,000원",
      payoutWon: 30000,
      title: `${calculatedResult.roomSize || 7}평 맞춤 원룸·포장이사 3초 최저가 비교견적 + 입주청소 특가`,
      desc: "전국 검증 우수 이사업체 실시간 역경매 무료 견적",
      cta: `👉 ${calculatedResult.roomSize || 7}평 최저가 이사 견적 3초 만에 무료 받기`,
      benefit: `${calculatedResult.budgetMan || 150}만원`,
      liveBadge: "🏷️ 링크프라이스 · 현대Hmall · 쿠팡 공식 제휴",
      liveTitle: `${calculatedResult.roomSize || 7}평 자취·신혼 예산 ${calculatedResult.budgetMan || 150}만 원 맞춤 침대·냉장고·가구 풀세팅 기획전`,
      liveDesc: "현대Hmall × 롯데ON × 쿠팡 로켓설치 공식 제휴 — 오프라인 매장 대비 유통마진 22% 즉시 절약",
      liveCta: `👉 ${calculatedResult.roomSize || 7}평 맞춤 현대Hmall 침대·가구 특가 기획전 보기`,
      coupangSubUrl: buildCoupangUrl("원룸 자취방 냉장고 침대 매트리스 로켓설치", "room", afId),
      coupangSubLabel: "🚀 쿠팡 가전·침대 로켓설치",
      linkPriceSubUrl: buildLinkPriceDeepLink("hmall", "https://www.hmall.com/md/pde/search?searchTerm=%EC%B9%A8%EB%8C%80%20%EB%A7%A4%ED%8A%B8%EB%A6%AC%EC%8A%A4", lpId),
      linkPriceSubLabel: "🏷️ 현대Hmall 자취·신혼 가구전",
      tenpingCampaignName: "서경석의 이사방 / 모두이사 무료 비교견적 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    },
    auto: {
      campaignKey: "auto_longterm_rent",
      payout: "60,000원",
      payoutWon: 60000,
      title: `할부보다 ${calculatedResult.diffMan || 0}만 원 아끼는 국내 21개 렌트·리스사 무서류 1분 최저가 견적`,
      desc: "초기비용 0원 무보증 특판, 사업자 연 1,500만 원 전액 비용처리",
      cta: `👉 할부보다 ${calculatedResult.diffMan || 0}만 원 저렴한 최저가 특판 즉시출고 조회`,
      benefit: `${calculatedResult.diffMan || 0}만원`,
      liveBadge: "🏷️ 링크프라이스 · 지마켓 · 쿠팡 공식 제휴",
      liveTitle: `신차 출고·렌트 필수! 아이나비·파인뷰 2채널 QHD 블랙박스 무료출장장착 반값 특가전`,
      liveDesc: `지마켓 × 옥션 × 쿠팡 파트너스 공식 제휴 — 전국 무료출장장착 + 신차 코일매트·맥세이프 최저가`,
      liveCta: `👉 지마켓 2채널 QHD 블랙박스 무료출장장착 특가 보기`,
      coupangSubUrl: buildCoupangUrl("2채널 QHD 블랙박스 맥세이프 거치대", "auto", afId),
      coupangSubLabel: "🚀 쿠팡 블랙박스·차량용품 로켓배송",
      linkPriceSubUrl: buildLinkPriceDeepLink("gmarket", "https://www.gmarket.co.kr/n/search?keyword=2%EC%B1%84%EB%84%90%20QHD%20%EB%B8%94%EB%9E%99%EB%B0%95%EC%8A%A4%20%EB%AC%B4%EB%A3%8C%EC%9E%A5%EC%B0%A9", lpId),
      linkPriceSubLabel: "🏷️ 지마켓 블랙박스 무료장착전",
      tenpingCampaignName: "카바딜러 신차 장기렌트·리스 최저가 비교견적 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    },
    telecom: {
      campaignKey: "telecom_internet_switch",
      payout: "55,000원",
      payoutWon: 55000,
      title: `위약금 ${calculatedResult.penaltyMan || 0}만 원 완벽 방어 + 현금 사은품 ${calculatedResult.cashGiftMan || 47}만 원 당일 입금 무료 상담`,
      desc: "통신 3사 당일 설치 + 방통위 경품고시제 최대 현금 사은품 47만 원",
      cta: "👉 위약금 전액 지원 + 현금 47만 원 당일 입금 신청하기",
      benefit: `${calculatedResult.totalNetBenefit || 0}`,
      liveBadge: "🏷️ 링크프라이스 · 롯데하이마트 공식 제휴",
      liveTitle: `통신사 공유기 임대료 평생 0원! 하이마트 기가 와이파이6 공유기·자급제 특별 기획전`,
      liveDesc: "롯데하이마트 × 지마켓 × 쿠팡 파트너스 공식 제휴 — 매달 나가는 장비 임대료 아끼고 속도 2배 업그레이드",
      liveCta: "👉 롯데하이마트 기가 와이파이6 공유기·통신기기 특가 보기",
      coupangSubUrl: buildCoupangUrl("와이파이6 공유기 AX3000 기가랜선", "telecom", afId),
      coupangSubLabel: "🚀 쿠팡 와이파이6 공유기 로켓배송",
      linkPriceSubUrl: buildLinkPriceDeepLink("himart", "https://www.e-himart.co.kr/app/search/totalSearch?query=%EA%B8%B0%EA%B0%80%20%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0", lpId),
      linkPriceSubLabel: "🏷️ 하이마트 공유기·자급제 기획전",
      tenpingCampaignName: "인터넷·TV 가입 현금 사은품 & 알뜰폰 비교 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    }
  };

  const details = map[calcId] || map.electric;
  const actionUrl = buildCpaUrl(details.campaignKey, details.benefit, memberId);
  const liveActionUrl = buildLiveFallbackCpaUrl(calcId, cfg);

  return {
    ...details,
    isCustomTenpingUrl,
    liveBadge: isCustomTenpingUrl ? "🎯 텐핑(Tenping) 고단가 CPA 캠페인 연동" : details.liveBadge,
    liveTitle: isCustomTenpingUrl ? details.title : details.liveTitle,
    liveDesc: isCustomTenpingUrl ? details.desc : details.liveDesc,
    liveCta: isCustomTenpingUrl ? details.cta : details.liveCta,
    actionUrl,
    liveActionUrl
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
        if (parsed.coupangAfId === "AF1234567") parsed.coupangAfId = "AF7865143";
        if (parsed.linkPriceId === "A100123456") parsed.linkPriceId = "A100708867";
        if (parsed.cpaMemberId && /^010\d{7,8}$/.test(parsed.cpaMemberId)) {
          parsed.cpaMemberId = "tp_member_" + parsed.cpaMemberId.slice(-4);
        }
        currentConfig = { ...currentConfig, ...parsed };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig, null, 2));
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
    buildLiveFallbackCpaUrl,
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
    buildLiveFallbackCpaUrl,
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
  window.buildLiveFallbackCpaUrl = buildLiveFallbackCpaUrl;
  window.calculateRevenueSimulation = calculateRevenueSimulation;
}
