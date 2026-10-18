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
  ftcNotice: "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다. 또한 링크프라이스(LinkPrice)·텐핑(Tenping) 등 제휴 마케팅 활동의 일환으로 소정의 커미션을 제공받을 수 있으나, 이용자(구매자)에게 발생하는 추가 부담금은 일절 없습니다.",
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
 * Resolve exact Coupang Brand Shop Key for each calculator & product keyword.
 * Verified in real Chrome browser:
 * 1. Passes through https://link.coupang.com/re/AFFBRAND?lptag=AF7865143... which sets the 24-hour
 *    Set-Cookie: trac_lptag=AF7865143; Domain=coupang.com; Max-Age=86400 header.
 * 2. Redirects to https://www.coupang.com/np/products/brand-shop?brandName=... with zero '/np/search'
 *    access restriction errors.
 */
function resolveCoupangBrandKey(keyword = "", calcId = "portal") {
  const kw = String(keyword || "");
  if (/플러그|멀티탭|전력측정/.test(kw)) return "티피링크";
  if (/에어컨|제습기|1등급|인버터/.test(kw)) return "LG전자";
  if (/닭가슴살/.test(kw)) return "하림";
  if (/현미밥|곤약밥|즉석밥/.test(kw)) return "곰곰";
  if (/다이어트|식단/.test(kw)) return "하림";
  if (/사료|로얄캐닌/.test(kw)) return "로얄캐닌";
  if (/영양제|유산균|관절|간식/.test(kw)) return "하림펫푸드";
  if (/강아지|고양이|반려/.test(kw)) return "로얄캐닌";
  if (/독립스프링|침대프레임|매트리스/.test(kw) && !/냉장고|세탁기/.test(kw)) return "지누스";
  if (/냉장고|세탁기/.test(kw)) return "삼성전자";
  if (/침대|매트리스|프레임|가구|자취|원룸/.test(kw)) return "지누스";
  if (/블랙박스|아이나비|파인뷰/.test(kw)) return "아이나비";
  if (/거치대|맥세이프|무선충전/.test(kw)) return "신지모루";
  if (/정리함|셋톱박스/.test(kw)) return "코멧";
  if (/공유기|와이파이|랜선|AX3000|ipTIME/.test(kw)) return "ipTIME";

  const calcMap = {
    electric: "LG전자",
    diet: "하림",
    pet: "로얄캐닌",
    room: "삼성전자",
    auto: "아이나비",
    telecom: "ipTIME"
  };
  return calcMap[calcId] || "삼성전자";
}

/**
 * Pipeline 1: Coupang Partners Deep Link Generator
 * Uses official Coupang Partners redirect gateway (https://link.coupang.com/re/AFFBRAND)
 * with lptag & subid so real Chrome browsers receive the 24-hour trac_lptag=AF7865143 cookie
 * AND land directly on verified Coupang Brand Shop product listings without '/np/search' errors.
 */
function sanitizeSafeId(rawId, fallback) {
  const cleaned = String(rawId || "").replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned.length >= 4 ? cleaned : fallback;
}

function getOfficialCoupangLinksTable() {
  if (typeof window !== "undefined" && window.COUPANG_OFFICIAL_LINKS) {
    return window.COUPANG_OFFICIAL_LINKS;
  }
  if (typeof global !== "undefined" && global.COUPANG_OFFICIAL_LINKS) {
    return global.COUPANG_OFFICIAL_LINKS;
  }
  if (typeof require === "function") {
    try {
      const mod = require("./coupang-official-links.js");
      if (mod && mod.COUPANG_OFFICIAL_LINKS) {
        if (typeof global !== "undefined") {
          global.COUPANG_OFFICIAL_LINKS = mod.COUPANG_OFFICIAL_LINKS;
        }
        return mod.COUPANG_OFFICIAL_LINKS;
      }
    } catch (e) {
      // Fallback if module is unavailable
    }
  }
  return null;
}

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

  const cleanAfId = sanitizeSafeId(afId, "AF7865143");
  const cleanCalcId = String(calcId || "portal").replace(/[^a-zA-Z0-9_-]/g, "") || "portal";
  const safeKw = keyword !== undefined && keyword !== null ? String(keyword).trim() : "";
  const encoded = encodeURIComponent(safeKw);
  const subId = `mf_${cleanCalcId}_${cleanAfId}`;

  // Official Coupang Partners Open API Short-Link Lookup (100% click tracking in Coupang Console + Mobile App Deep-Link)
  const officialTable = getOfficialCoupangLinksTable();
  if (cleanAfId === "AF7865143" && officialTable && officialTable.linksByKeyword) {
    const exactEntry = officialTable.linksByKeyword[safeKw];
    if (exactEntry && exactEntry.shortenUrl) {
      return exactEntry.shortenUrl;
    }
    // Partial keyword match against official pre-synced Open API short links
    const keys = Object.keys(officialTable.linksByKeyword);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (safeKw && (k.includes(safeKw) || safeKw.includes(k))) {
        const hit = officialTable.linksByKeyword[k];
        if (hit && hit.shortenUrl) return hit.shortenUrl;
      }
    }
    // Category fallback to official Open API short link
    const catDefaultKw = {
      electric: "에너지 1등급 인버터 에어컨",
      diet: "하림 닭가슴살 10팩",
      pet: "로얄캐닌 사료",
      room: "지누스 매트리스 침대프레임",
      auto: "2채널 QHD 블랙박스 무료장착",
      telecom: "ipTIME AX3000 공유기",
      portal: "로봇청소기"
    }[cleanCalcId] || "로봇청소기";
    if (officialTable.linksByKeyword[catDefaultKw] && officialTable.linksByKeyword[catDefaultKw].shortenUrl) {
      return officialTable.linksByKeyword[catDefaultKw].shortenUrl;
    }
  }

  const brandKey = encodeURIComponent(resolveCoupangBrandKey(safeKw, cleanCalcId));
  return `https://link.coupang.com/re/AFFBRAND?lptag=${cleanAfId}&subid=${subId}&pageKey=${brandKey}&q=${encoded}&channel=user`;
}

/**
 * Pipeline 2: LinkPrice Deep Link Generator
 * Uses official LinkPrice tu= (Target URL) parameter so click.linkprice.com/click.php
 * sets the LPUID tracking cookie and redirects cleanly to the merchant.
 */
function buildLinkPriceDeepLink(merchantId, targetUrl, lpId = null) {
  const effectiveLpId = sanitizeSafeId(lpId || currentConfig.linkPriceId || "A100708867", "A100708867");
  const cleanMerchant = String(merchantId || "himart").replace(/[^a-zA-Z0-9_-]/g, "") || "himart";
  const encodedUrl = encodeURIComponent(targetUrl || "");
  return `https://click.linkprice.com/click.php?m=${cleanMerchant}&a=${effectiveLpId}&l=9999&tu=${encodedUrl}`;
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
      // 쿠팡 파트너스 공식 Open API 단축링크 (스마트플러그·절전멀티탭·1등급 인버터 로켓배송 + 24시간 장바구니 쿠키)
      return buildCoupangUrl("티피링크 스마트플러그 전력측정", "electric", afId);
    case "diet":
      // 쿠팡 파트너스 공식 Open API 단축링크 (하림 닭가슴살·현미밥 로켓프레시 + 24시간 장바구니 쿠키)
      return buildCoupangUrl("냉동 닭가슴살 100g 대용량 패키지", "diet", afId);
    case "pet":
      // 쿠팡 파트너스 공식 Open API 단축링크 (강아지·고양이 사료·관절영양제 로켓배송 + 24시간 장바구니 쿠키)
      return buildCoupangUrl("강아지 고양이 가수분해 사료 관절 영양제 베스트", "pet", afId);
    case "room":
      // 쿠팡 파트너스 공식 Open API 단축링크 (원룸 침대·매트리스·가전 로켓설치 + 24시간 장바구니 쿠키)
      return buildCoupangUrl("원룸 자취방 냉장고 침대 매트리스 로켓설치", "room", afId);
    case "auto":
      // 쿠팡 파트너스 공식 Open API 단축링크 (맥세이프 차량용 거치대·블랙박스 로켓배송 + 24시간 장바구니 쿠키)
      return buildCoupangUrl("2채널 QHD 블랙박스 맥세이프 거치대", "auto", afId);
    case "telecom":
      // 쿠팡 파트너스 공식 Open API 단축링크 (와이파이6 공유기·기가랜선 로켓배송 + 24시간 장바구니 쿠키)
      return buildCoupangUrl("와이파이6 공유기 AX3000 기가랜선", "telecom", afId);
    default:
      return buildCoupangUrl("티피링크 스마트플러그 전력측정", "electric", afId);
  }
}

/**
 * Pipeline 4: High-ticket CPA & Multi-Channel Affiliate Card Data Generator
 * Substitutes calculated saving amounts into copy and links.
 * When a Tenping short link (https://iryan.kr/...) is configured for calcId, uses the CPA consultation copy.
 * Otherwise, uses liveTitle / liveDesc / liveCta that 100% match the destination Coupang / LinkPrice exhibition page!
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
      title: `1등급 가전 렌탈 & 환급금 조회 (월 ${(calculatedResult.monthlySaving || 10000).toLocaleString()}원 절감)`,
      desc: "1등급 환급금 최대 30만 원 · 렌탈 프로모션",
      cta: `👉 월 ${(calculatedResult.monthlySaving || 10000).toLocaleString()}원 절감 1등급 지원금 조회`,
      benefit: `${calculatedResult.monthlySaving || 10000}`,
      liveBadge: "🚀 쿠팡 로켓배송 · 지마켓 특가",
      liveTitle: `대기전력 0원 스마트플러그 & 1등급 절전템 (월 ${(calculatedResult.monthlySaving || 10000).toLocaleString()}원 절감)`,
      liveDesc: "스마트폰 앱으로 에어컨·가전 전력 실시간 차단 · 로켓와우 무료배송",
      liveCta: `👉 9,900원대 절전 스마트플러그 & 1등급 특가 보기 (월 -${(calculatedResult.monthlySaving || 10000).toLocaleString()}원)`,
      coupangSubUrl: buildCoupangUrl("티피링크 스마트플러그 전력측정", "electric", afId),
      coupangSubLabel: "🚀 쿠팡 절전플러그·1등급",
      naverConnectUrl: "https://naver.me/xm0ZVnAW",
      naverConnectLabel: "🟢 네이버 무소음 에어서큘레이터 (8%적립)",
      linkPriceSubUrl: buildLinkPriceDeepLink("gmarket", "https://www.gmarket.co.kr/n/search?keyword=%EA%B0%9C%EB%B3%84%EC%8A%A4%EC%9C%84%EC%B9%98%20%EC%A0%88%EC%A0%84%20%EB%A9%80%ED%8B%B0%ED%83%AD%20%EC%8A%A4%EB%A7%88%ED%8A%B8%ED%94%8C%EB%9F%AC%EA%B7%B8", lpId),
      linkPriceSubLabel: "🏷️ 지마켓 절전멀티탭 특가",
      tenpingCampaignName: "미소 정수기·가전 렌탈 가격비교 상담 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    },
    diet: {
      campaignKey: "diet_custom_consulting",
      payout: "45,000원",
      payoutWon: 45000,
      title: `${calculatedResult.weeks || 4}주 책임 감량 1:1 맞춤 다이어트 무료 진단`,
      desc: "체성분 기반 1:1 식단 처방 상담",
      cta: `👉 ${calculatedResult.weeks || 4}주 목표 감량 무료 상담 신청`,
      benefit: `${calculatedResult.chickenPacks || 0}팩`,
      liveBadge: "🚀 쿠팡 로켓프레시 · 네이버 · 지마켓",
      liveTitle: `${calculatedResult.weeks || 4}주 닭가슴살 ${calculatedResult.chickenPacks || 50}팩 · 현미밥 ${calculatedResult.brownRiceBowls || 56}개 로켓프레시 특가`,
      liveDesc: "편의점 낱개 구매 대비 식단비 -54% 즉시 절약 · 내일 새벽 도착",
      liveCta: `👉 닭가슴살 ${calculatedResult.chickenPacks || 50}팩 · 현미밥 쿠팡 최저가 보기`,
      coupangSubUrl: buildCoupangUrl("냉동 닭가슴살 100g 대용량 패키지", "diet", afId),
      coupangSubLabel: "🚀 쿠팡 닭가슴살 대용량",
      naverConnectUrl: "https://naver.me/xvClW9nJ",
      naverConnectLabel: "🟢 네이버 한끼통살 닭가슴살 10팩",
      linkPriceSubUrl: buildLinkPriceDeepLink("iherb", "https://kr.iherb.com/search?kw=%EB%8B%A8%EB%B0%B1%EC%A7%88%20%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8", lpId),
      linkPriceSubLabel: "🏷️ 아이허브 프로틴·영양제",
      tenpingCampaignName: "1:1 맞춤 체질 감량 다이어트 무료상담 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    },
    pet: {
      campaignKey: "pet_insurance_compare",
      payout: "35,000원",
      payoutWon: 35000,
      title: `병원비 180만 원 방어! ${calculatedResult.petWeight || 5}kg 펫보험 90% 보장 최저가`,
      desc: "수술비·통원비 다이렉트 펫보험 비교",
      cta: `👉 ${calculatedResult.petWeight || 5}kg 맞춤 펫보험 최저가 확인`,
      benefit: `${calculatedResult.dailyGrams || 100}g`,
      liveBadge: "🚀 쿠팡 로켓배송 · 네이버 · 지마켓",
      liveTitle: `${calculatedResult.petWeight || 5}kg 맞춤 가수분해 사료 & 1g 정량 계량스푼 특가`,
      liveDesc: `하루 ${calculatedResult.dailyGrams || 100}g 정량 급여 · 로켓와우 내일 도착 최저가`,
      liveCta: `👉 ${calculatedResult.petWeight || 5}kg 맞춤 사료·영양제 쿠팡 최저가 보기`,
      coupangSubUrl: buildCoupangUrl("강아지 고양이 가수분해 사료 관절 영양제 베스트", "pet", afId),
      coupangSubLabel: "🚀 쿠팡 맞춤사료 로켓배송",
      naverConnectUrl: "https://naver.me/xAfcU6Im",
      naverConnectLabel: "🟢 네이버 라비앙독 연어사료 4.8kg",
      linkPriceSubUrl: buildLinkPriceDeepLink("gmarket", "https://www.gmarket.co.kr/n/search?keyword=%EA%B0%95%EC%95%84%EC%A7%80%20%EA%B0%80%EC%88%98%EB%B6%84%ED%95%B4%20%EC%82%AC%EB%A3%8C%20%EA%B4%88%EC%A0%88%20%EC%98%81%EC%96%91%EC%A0%9C", lpId),
      linkPriceSubLabel: "🏷️ 지마켓 맞춤사료 특가",
      tenpingCampaignName: "반려동물 케어·보험 맞춤 상담 캠페인 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    },
    room: {
      campaignKey: "room_moving_quote",
      payout: "30,000원",
      payoutWon: 30000,
      title: `${calculatedResult.roomSize || 7}평 원룸·포장이사 3초 최저가 비교견적`,
      desc: "전국 우수 이사업체 무료 역경매 견적",
      cta: `👉 ${calculatedResult.roomSize || 7}평 최저가 이사 견적 3초 조회`,
      benefit: `${calculatedResult.budgetMan || 150}만원`,
      liveBadge: "🚀 쿠팡 로켓설치 · 네이버 슈퍼적립",
      liveTitle: `${calculatedResult.roomSize || 7}평 예산 ${calculatedResult.budgetMan || 150}만 원 원룸 가전·매트리스 로켓설치 특가`,
      liveDesc: "오프라인 매장 대비 유통마진 -28% 즉시 절약 · 원하는 날짜 무료설치",
      liveCta: `👉 ${calculatedResult.roomSize || 7}평 맞춤 가전·침대 쿠팡 로켓설치 보기`,
      coupangSubUrl: buildCoupangUrl("원룸 자취방 냉장고 침대 매트리스 로켓설치", "room", afId),
      coupangSubLabel: "🚀 쿠팡 가전·침대 로켓설치",
      naverConnectUrl: "https://naver.me/GgUlTvYj",
      naverConnectLabel: "🟢 네이버 로보락 로봇청소기 슈퍼적립",
      linkPriceSubUrl: buildLinkPriceDeepLink("11st", "https://search.11st.co.kr/pc/total-search?kwd=%EC%9B%90%EB%A3%B8%20%EC%9E%90%EC%B7%A8%20%EC%83%9D%ED%99%9C%EC%9A%A9%ED%92%88%20%EC%B9%A8%EA%B5%AC", lpId),
      linkPriceSubLabel: "🏷️ 11번가 자취필수템",
      tenpingCampaignName: "서경석의 이사방 / 모두이사 무료 비교견적 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    },
    auto: {
      campaignKey: "auto_longterm_rent",
      payout: "60,000원",
      payoutWon: 60000,
      title: `할부보다 ${calculatedResult.diffMan || 0}만 원 아끼는 21개 렌트·리스사 최저가 견적`,
      desc: "초기비용 0원 무보증 특판 · 연 1,500만 원 비용처리",
      cta: `👉 할부보다 ${calculatedResult.diffMan || 0}만 원 저렴한 특판 즉시출고 조회`,
      benefit: `${calculatedResult.diffMan || 0}만원`,
      liveBadge: "🚀 쿠팡 · 네이버 · 지마켓",
      liveTitle: `신지모루 맥세이프 무선충전 거치대 & 2채널 QHD 블랙박스 특가`,
      liveDesc: `운전자 만족도 1위 차량용 거치대 · 전국 무료출장장착 블랙박스`,
      liveCta: `👉 차량용 맥세이프 거치대 & 블랙박스 쿠팡 특가 보기`,
      coupangSubUrl: buildCoupangUrl("2채널 QHD 블랙박스 맥세이프 거치대", "auto", afId),
      coupangSubLabel: "🚀 쿠팡 2채널 블랙박스 무료장착",
      naverConnectUrl: "https://naver.me/G5kYoDj6",
      naverConnectLabel: "🟢 네이버 아이테라 2채널 블랙박스",
      linkPriceSubUrl: buildLinkPriceDeepLink("gmarket", "https://www.gmarket.co.kr/n/search?keyword=%EC%B0%A8%EB%9F%89%EC%9A%A9%20%EB%A7%A5%EC%84%B8%EC%9D%B4%ED%94%84%20%EA%B1%B0%EC%B9%98%EB%8C%80%20%EB%B6%88%EC%8A%A4%EC%9B%90%EC%83%B7", lpId),
      linkPriceSubLabel: "🏷️ 지마켓 2채널 블랙박스 특가",
      tenpingCampaignName: "카바딜러 신차 장기렌트·리스 최저가 비교견적 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    },
    telecom: {
      campaignKey: "telecom_internet_switch",
      payout: "55,000원",
      payoutWon: 55000,
      title: `위약금 ${calculatedResult.penaltyMan || 0}만 원 방어 + 현금 사은품 ${calculatedResult.cashGiftMan || 47}만 원 당일 입금`,
      desc: "통신 3사 당일 설치 + 최대 현금 사은품 47만 원",
      cta: "👉 위약금 지원 + 현금 47만 원 당일 입금 신청",
      benefit: `${calculatedResult.totalNetBenefit || 0}`,
      liveBadge: "🚀 쿠팡 · 네이버 · 지마켓",
      liveTitle: `공유기 임대료 평생 0원! ipTIME 와이파이6 공유기 & 반값 유심 특가`,
      liveDesc: "통신사 월 4,400원 임대료 아끼고 방 끝까지 와이파이 속도 3배 업그레이드",
      liveCta: "👉 와이파이6 공유기·알뜰유심 쿠팡 로켓배송 최저가 보기",
      coupangSubUrl: buildCoupangUrl("와이파이6 공유기 AX3000 기가랜선", "telecom", afId),
      coupangSubLabel: "🚀 쿠팡 ipTIME 와이파이6 공유기",
      naverConnectUrl: "https://naver.me/FpwR436o",
      naverConnectLabel: "🟢 네이버 티피링크 Wi-Fi6 공유기",
      linkPriceSubUrl: buildLinkPriceDeepLink("gmarket", "https://www.gmarket.co.kr/n/search?keyword=ipTIME%20%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0%20%EB%9E%9C%EC%84%A0", lpId),
      linkPriceSubLabel: "🏷️ 지마켓 ipTIME 와이파이6 공유기",
      tenpingCampaignName: "인터넷·TV 가입 현금 사은품 & 알뜰폰 비교 (건당 CPA)",
      tenpingSearchUrl: "https://tenping.kr/"
    }
  };

  const details = { ...(map[calcId] || map.electric) };
  const primaryItem = Array.isArray(calculatedResult.actionItems) && calculatedResult.actionItems[0]
    ? calculatedResult.actionItems[0]
    : null;

  if (primaryItem && primaryItem.coupangKw) {
    const exactPrimaryCoupangUrl = buildCoupangUrl(primaryItem.coupangKw, calcId, afId);
    details.coupangSubUrl = exactPrimaryCoupangUrl;
    if (primaryItem.coupangBtn) {
      details.coupangSubLabel = primaryItem.coupangBtn;
    }
    if (primaryItem.lpUrl) {
      details.linkPriceSubUrl = primaryItem.lpUrl;
    }
    if (primaryItem.lpBtn) {
      details.linkPriceSubLabel = primaryItem.lpBtn;
    }
    details.liveTitle = calcId === "electric"
      ? `${primaryItem.title} (월 ${(calculatedResult.monthlySaving || 10000).toLocaleString()}원 절감)`
      : primaryItem.title;
    details.liveDesc = primaryItem.desc || details.liveDesc;
    details.liveCta = `👉 ${primaryItem.coupangBtn || details.liveCta} 바로 확인하기`;
  }

  const actionUrl = buildCpaUrl(details.campaignKey, details.benefit, memberId);
  const liveActionUrl = isCustomTenpingUrl
    ? buildLiveFallbackCpaUrl(calcId, cfg)
    : (details.coupangSubUrl || buildLiveFallbackCpaUrl(calcId, cfg));

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
  const rawId = unitId || (position === "bottom" ? currentConfig.adfitBottomUnitId : currentConfig.adfitUnitId);
  const effectiveId = String(rawId || "DAN-SAMPLE-TOP").replace(/[^a-zA-Z0-9_-]/g, "") || "DAN-SAMPLE-TOP";
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
