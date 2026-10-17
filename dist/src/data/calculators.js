/**
 * MoneyFit Core Domain Calculators (SSOT)
 * Implements 6 Life Financial & Loss Prevention Calculators
 * Compatible with Node.js (CommonJS) and Browser environments.
 */

/**
 * 1. 한전 주택용(저압) 전기요금 계산기 (기본/하계 누진제 반영)
 */
function calcKepcoBill(kwh, isSummer = false) {
  const safeKwh = Math.max(0, Number(kwh) || 0);
  let baseFee = 910;
  let usageFee = 0;

  if (isSummer) {
    // 하계 완화 구간 (7~8월): 1구간 <= 300, 2구간 301~450, 3구간 > 450
    if (safeKwh <= 300) {
      baseFee = 910;
      usageFee = safeKwh * 120.0;
    } else if (safeKwh <= 450) {
      baseFee = 1600;
      usageFee = (300 * 120.0) + ((safeKwh - 300) * 214.6);
    } else {
      baseFee = 7300;
      usageFee = (300 * 120.0) + (150 * 214.6) + ((safeKwh - 450) * 307.3);
    }
  } else {
    // 기타 계절 (1~6월, 9~12월): 1구간 <= 200, 2구간 201~400, 3구간 > 400
    if (safeKwh <= 200) {
      baseFee = 910;
      usageFee = safeKwh * 120.0;
    } else if (safeKwh <= 400) {
      baseFee = 1600;
      usageFee = (200 * 120.0) + ((safeKwh - 200) * 214.6);
    } else {
      baseFee = 7300;
      usageFee = (200 * 120.0) + (200 * 214.6) + ((safeKwh - 400) * 307.3);
    }
  }

  const envFee = safeKwh * 9.0;    // 기후환경요금: 9.0원/kWh
  const fuelFee = safeKwh * 5.0;   // 연료비조정액: 5.0원/kWh
  const subtotal = baseFee + usageFee + envFee + fuelFee;
  // 부가가치세(10%) + 전력산업기반기금(3.7%) 합산 13.7%
  return Math.round(subtotal * 1.137);
}

/**
 * Safe numeric parser that preserves 0 while preventing NaN on empty strings
 */
function toNum(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Calc 1: 전기요금·누진세 폭탄 & 1등급 인버터 교체 손익분기점 계산기
 */
function calculateElectric(inputs = {}) {
  const wattage = toNum(inputs.wattage, 1800);
  const hours = toNum(inputs.hours, 10);
  const baseKwh = toNum(inputs.baseKwh, 250);
  const newPrice = Number(inputs.newPrice) || 850000;
  const isSummer = Boolean(inputs.isSummer);

  const isZeroUsage = wattage === 0 || hours === 0;
  const addedKwh = isZeroUsage ? 0 : Math.round((wattage * hours * 30) / 1000);
  const totalKwh = baseKwh + addedKwh;

  const beforeBill = calcKepcoBill(baseKwh, isSummer);
  const afterBill = calcKepcoBill(totalKwh, isSummer);
  const addedBill = afterBill - beforeBill;

  // 1등급 인버터 교체 시 소비전력 55% 절감 (즉 인버터 소비전력 = 45%)
  const inverterAddedKwh = Math.round(addedKwh * 0.45);
  const inverterKwh = baseKwh + inverterAddedKwh;
  const inverterBill = calcKepcoBill(inverterKwh, isSummer);

  const rawSaving = afterBill - inverterBill;
  let monthlySaving = 0;
  let paybackMonths = 0;

  if (isZeroUsage || addedKwh === 0) {
    monthlySaving = 0;
    paybackMonths = 0;
  } else {
    monthlySaving = Math.max(10000, rawSaving);
    paybackMonths = monthlySaving > 0 ? parseFloat((newPrice / monthlySaving).toFixed(1)) : 0;
  }

  const tierLimit = isSummer ? 450 : 400;
  const badge = totalKwh > tierLimit
    ? "🚨 누진세 3단계 폭탄 경보!"
    : "⚡ 누진세 2단계 진입";

  const headline = isZeroUsage || addedKwh === 0
    ? `미가동 (기본 ${beforeBill.toLocaleString()}원)`
    : `추가 전기세 +${addedBill.toLocaleString()}원 (총 ${afterBill.toLocaleString()}원)`;

  const summary = isZeroUsage || addedKwh === 0
    ? `월 ${baseKwh}kWh 기준 ${beforeBill.toLocaleString()}원`
    : `1등급 교체 시 월 -${monthlySaving.toLocaleString()}원 (${paybackMonths}개월 본전 회수)`;

  // 입력 전력(W) 및 계절에 따른 가전 종류 1:1 자동 판별
  let targetApplianceName = "1등급 인버터 에어컨";
  let targetApplianceIcon = "❄️";
  let targetCoupangKw = "에너지소비효율 1등급 인버터 에어컨 로켓설치";
  let subHelperName = "무소음 에어서큘레이터";
  let subHelperKw = "BLDC 무소음 에어서큘레이터";
  let himartQuery = "%EC%97%90%EB%84%88%EC%A7%80%201%EB%93%B1%EA%B8%89%20%EC%9D%B8%EB%B2%84%ED%84%B0%20%EC%97%90%EC%96%B4%EC%BB%A8";

  if (wattage > 0 && wattage <= 480) {
    targetApplianceName = "1등급 인버터 제습기";
    targetApplianceIcon = "💧";
    targetCoupangKw = "에너지소비효율 1등급 인버터 제습기";
    subHelperName = "대용량 제습제 세트";
    subHelperKw = "습기제거제 대용량 제습제";
    himartQuery = "1%EB%93%B1%EA%B8%89%20%EC%9D%B8%EB%B2%84%ED%84%B0%20%EC%A0%9C%EC%8A%B5%EA%B8%B0";
  } else if (!isSummer && wattage >= 1100 && wattage <= 1650 && hours <= 5) {
    targetApplianceName = "1등급 인버터 건조기";
    targetApplianceIcon = "👕";
    targetCoupangKw = "에너지소비효율 1등급 인버터 의류건조기 로켓설치";
    subHelperName = "양모 드라이어볼";
    subHelperKw = "건조기 양모볼 드라이어볼";
    himartQuery = "1%EB%93%B1%EA%B8%89%20%EC%9D%98%EB%A5%98%EA%B1%B4%EC%A1%B0%EA%B8%B0";
  } else if (!isSummer && wattage >= 1700) {
    targetApplianceName = "1등급 카본매트·난방기";
    targetApplianceIcon = "🔥";
    targetCoupangKw = "저전력 카본매트 온수매트 1등급 난방기";
    subHelperName = "창문 방풍비닐·문풍지";
    subHelperKw = "창문 방풍비닐 외풍차단 문풍지";
    himartQuery = "%EC%B9%B4%EB%B3%B8%EB%A7%A4%ED%8A%B8%20%EC%98%A8%EC%88%98%EB%A7%A4%ED%8A%B8";
  } else if (wattage >= 1500) {
    targetApplianceName = "1등급 2in1 에어컨";
    targetApplianceIcon = "❄️";
    targetCoupangKw = "에너지소비효율 1등급 2in1 인버터 에어컨 로켓설치";
  } else {
    targetApplianceName = "1등급 벽걸이 에어컨";
    targetApplianceIcon = "❄️";
    targetCoupangKw = "에너지소비효율 1등급 벽걸이 인버터 에어컨 로켓설치";
  }

  const priceManText = Math.round(newPrice / 10000).toLocaleString();

  return {
    calcId: "electric",
    wattage,
    hours,
    baseKwh,
    newPrice,
    isSummer,
    addedKwh,
    totalKwh,
    beforeBill,
    afterBill,
    addedBill,
    inverterKwh,
    inverterBill,
    monthlySaving,
    paybackMonths,
    badge,
    headline,
    metrics: [
      { label: "추가 전력", val: isZeroUsage || addedKwh === 0 ? "0 kWh" : `+${addedKwh} kWh` },
      { label: "월 절감액", val: isZeroUsage || addedKwh === 0 ? "0원" : `-${monthlySaving.toLocaleString()}원` },
      { label: "본전 회수", val: paybackMonths > 0 ? `${paybackMonths}개월` : "미가동" }
    ],
    lossComparison: {
      lossLabel: "구형 그대로",
      lossValueText: `${afterBill.toLocaleString()}원`,
      optLabel: "1등급 교체",
      optValueText: `${inverterBill.toLocaleString()}원`,
      savingBadge: isZeroUsage || addedKwh === 0
        ? "미가동"
        : `월 -${monthlySaving.toLocaleString()}원 · 연 -${(monthlySaving * 12).toLocaleString()}원`,
      optPercent: afterBill > 0 ? Math.max(18, Math.min(92, Math.round((inverterBill / afterBill) * 100))) : 50
    },
    zeroFeelFraming: {
      badge: "🔥 체감가 0원",
      callout: isZeroUsage || addedKwh === 0
        ? "대기전력 즉시 차단!"
        : `체감가 0원 (${paybackMonths}개월 본전 · 연 +${(monthlySaving * 12).toLocaleString()}원 이득)`,
      ctaHighlight: `체감가 0원 (${paybackMonths}개월 본전) 최저가 ↗`
    },
    impulseItem: {
      badge: "⚡ 9,900원 절전 1위",
      title: isSummer
        ? "스마트플러그 & 열차단 시트"
        : "방풍비닐·문풍지 & 스마트플러그",
      sub: "1만 원으로 누진세 즉시 방어",
      coupangKw: isSummer ? "스마트 플러그 전력측정기 절전 멀티탭" : "창문 방풍비닐 외풍차단 문풍지 스마트플러그",
      btnLabel: "🛒 9,900원 절전템 로켓배송 ↗"
    },
    actionItems: [
      {
        icon: targetApplianceIcon,
        stepTag: "1순위 본전",
        label: `${targetApplianceName} 교체`,
        calcVal: `월 -${monthlySaving.toLocaleString()}원 · ${paybackMonths}개월 본전`,
        coupangKw: targetCoupangKw,
        coupangBtn: `🚀 ${priceManText}만원대 로켓설치 ↗`,
        lpMerchant: "himart",
        lpUrl: `https://www.e-himart.co.kr/app/search/totalSearch?query=${himartQuery}`,
        lpBtn: "🏷️ 하이마트 특가 ↗"
      },
      {
        icon: "⚡",
        stepTag: "2순위 차단",
        label: `스마트 전력측정 플러그`,
        calcVal: `누진세 3단계 원격 차단`,
        coupangKw: "스마트 플러그 실시간 전력측정기 타이머",
        coupangBtn: "🚀 스마트플러그 특가 ↗",
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=%EC%8A%A4%EB%A7%88%ED%8A%B8%ED%94%8C%EB%9F%AC%EA%B7%B8%20%EC%A0%84%EB%A0%A5%EC%B8%A1%EC%A0%95",
        lpBtn: "🏷️ 지마켓 특가 ↗"
      },
      {
        icon: "🌀",
        stepTag: "3순위 효율",
        label: `${subHelperName}`,
        calcVal: `가동시간 -30% 단축`,
        coupangKw: subHelperKw,
        coupangBtn: "🚀 로켓배송 최저가 ↗",
        lpMerchant: "lotteon",
        lpUrl: `https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=${encodeURIComponent(subHelperKw)}`,
        lpBtn: "🏷️ 롯데ON 특가 ↗"
      }
    ],
    summary,
    cpaTitle: `에너지 1등급 가전 렌탈 & 환급금 조회 (월 ${monthlySaving.toLocaleString()}원 절감)`,
    cpaPayout: "35,000원",
    cpaKey: "electric_grade1_rental",
    cpaBenefit: `${monthlySaving}`,
    products: [
      {
        icon: targetApplianceIcon,
        title: `${targetApplianceName} (${priceManText}만 원대)`,
        kw: targetCoupangKw,
        type: "coupang",
        badge: "🚀 로켓설치",
        calcMatchTag: `⚡ 월 -${monthlySaving.toLocaleString()}원 (${paybackMonths}개월 본전)`,
        matchReason: `월 전기세 ${afterBill.toLocaleString()}원 → ${inverterBill.toLocaleString()}원 단축`,
        ctaText: `1등급 로켓설치 최저가 →`
      },
      {
        icon: "🔌",
        title: `티피링크 전력측정 스마트플러그`,
        kw: "스마트 플러그 전력측정기",
        type: "coupang",
        badge: "⚡ 누진세 차단",
        calcMatchTag: `⚡ 월 +${addedKwh}kWh 실시간 감시`,
        matchReason: `누진세 폭탄 구간 진입 전 스마트폰 자동 차단`,
        ctaText: "스마트플러그 최저가 →"
      },
      {
        icon: "🏅",
        title: `하이마트 ${targetApplianceName} 기획전`,
        merchant: "himart",
        merchantLabel: "롯데하이마트",
        url: `https://www.e-himart.co.kr/app/search/totalSearch?query=${himartQuery}`,
        type: "linkprice",
        badge: "💳 카드할인",
        calcMatchTag: `⚡ 연 -${(monthlySaving * 12).toLocaleString()}원 절약`,
        matchReason: `카드 청구할인 + 1등급 환급 모델 특가`,
        ctaText: "하이마트 1등급 특가 →"
      },
      {
        icon: "🌀",
        title: `지마켓 ${subHelperName} 베스트`,
        merchant: "gmarket",
        merchantLabel: "지마켓",
        url: `https://www.gmarket.co.kr/n/search?keyword=${encodeURIComponent(targetCoupangKw)}`,
        type: "linkprice",
        badge: "🔥 효율 2배",
        calcMatchTag: `⚡ 전력 소모 -35% 절감`,
        matchReason: `냉·난방기 단독 가동 대비 전기세 즉시 절감`,
        ctaText: "지마켓 절전가전 특가 →"
      }
    ]
  };
}

/**
 * Calc 2: 다이어트·벌크업 탄단지(TDEE) & 맞춤 식단 장보기 수량 계산기
 */
function calculateDiet(inputs = {}) {
  const gender = inputs.gender === "female" ? "female" : "male";
  const weight = Number(inputs.weight) || 78;
  const height = Number(inputs.height) || 175;
  const age = Number(inputs.age) || 30;
  const activityFactor = Number(inputs.activityFactor) || 1.55;
  const weeks = Number(inputs.weeks) || 4;
  const deficit = toNum(inputs.deficit, -500);

  // Mifflin-St Jeor 기초대사량(BMR)
  const bmrRaw = gender === "female"
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;
  const bmr = Math.round(bmrRaw);

  // 일일 총 에너지 소비량 (TDEE)
  const tdee = Math.round(bmr * activityFactor);

  // 목표 칼로리 (최소 1,200kcal 하한선)
  const targetKcal = Math.max(1200, Math.round(tdee + deficit));

  // 체중당 단백질 2.0g 권장
  const dailyProteinG = Math.round(weight * 2.0);
  // 지방: 일일 목표 칼로리의 약 25% (9kcal/g, 최소 20g)
  const dailyFatG = Math.max(20, Math.round((targetKcal * 0.25) / 9));
  // 탄수화물: 잔여 칼로리 충당 (4kcal/g, 최소 50g)
  const dailyCarbG = Math.max(50, Math.round((targetKcal - (dailyProteinG * 4) - (dailyFatG * 9)) / 4));
  const days = weeks * 7;

  // 닭가슴살 1팩당 순단백질 23g 기준 (단백질 요구량의 65% 충당)
  const chickenPacks = Math.ceil((dailyProteinG * 0.65 * days) / 23);

  // 즉석 현미밥 (하루 2공기, 1개 탄수화물 약 65g 기준)
  const brownRiceBowls = days * 2;

  // WPI 프로틴 파우더 통 수 (하루 1스쿱 30g, 1통 900g 기준)
  const proteinTubs = Math.ceil((days * 30) / 900);

  const badge = `🔥 ${weeks}주 맞춤 식단 수량`;
  const headline = `하루 ${targetKcal.toLocaleString()}kcal · 닭가슴살 총 ${chickenPacks}팩!`;
  const summary = `${weeks}주간 닭가슴살 ${chickenPacks}팩 · 현미밥 ${brownRiceBowls}개 · 프로틴 ${proteinTubs}통 필요`;

  const dietSavingWon = chickenPacks * 1650 + brownRiceBowls * 1150;

  return {
    calcId: "diet",
    gender,
    weight,
    height,
    age,
    activityFactor,
    weeks,
    deficit,
    bmr,
    tdee,
    targetKcal,
    dailyProteinG,
    dailyCarbG,
    dailyFatG,
    days,
    chickenPacks,
    brownRiceBowls,
    proteinTubs,
    badge,
    headline,
    metrics: [
      { label: "탄·단·지(g)", val: `${dailyCarbG}/${dailyProteinG}/${dailyFatG}g` },
      { label: `닭가슴살(${weeks}주)`, val: `${chickenPacks}팩` },
      { label: `현미밥(${weeks}주)`, val: `${brownRiceBowls}개` }
    ],
    lossComparison: {
      lossLabel: `편의점 단품 (${weeks}주)`,
      lossValueText: `${(chickenPacks * 2900 + brownRiceBowls * 2200).toLocaleString()}원`,
      optLabel: `대용량 묶음 (${weeks}주)`,
      optValueText: `${(chickenPacks * 1250 + brownRiceBowls * 1050).toLocaleString()}원`,
      savingBadge: `식단비 -${dietSavingWon.toLocaleString()}원 절약 (-54%)`,
      optPercent: 46
    },
    zeroFeelFraming: {
      badge: "🔥 식비 반값 세이브",
      callout: `배달·편의점 대비 +${dietSavingWon.toLocaleString()}원 즉시 절약!`,
      ctaHighlight: `식비 +${dietSavingWon.toLocaleString()}원 아끼는 대용량 특가 ↗`
    },
    impulseItem: {
      badge: "🍗 1만원대 맛보기 1위",
      title: "닭가슴살 10+1팩 골라담기",
      sub: `팩당 1,200원대 맛보기 세트`,
      coupangKw: "닭가슴살 혼합 맛보기 10팩 세트",
      btnLabel: "🛒 1만원대 맛보기 10팩 로켓프레시 ↗"
    },
    actionItems: [
      {
        icon: "🍗",
        stepTag: "단백질 정량",
        label: `닭가슴살 100g × ${chickenPacks}팩`,
        calcVal: `일일 단백질 ${dailyProteinG}g · 팩당 1,200원대`,
        coupangKw: "냉동 닭가슴살 100g 대용량 패키지",
        coupangBtn: `🚀 닭가슴살 ${chickenPacks}팩 로켓프레시 ↗`,
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=%EB%83%89%EB%8F%99%20%EB%8B%AD%EA%B0%80%EC%8A%B4%EC%82%B4%20100g%20%EB%8C%80%EC%9A%A9%EB%9F%89",
        lpBtn: "🏷️ 지마켓 특가 ↗"
      },
      {
        icon: "🍚",
        stepTag: "탄수화물 정량",
        label: `즉석 현미밥 × ${brownRiceBowls}개`,
        calcVal: `일일 탄수 ${dailyCarbG}g (하루 2공기)`,
        coupangKw: "즉석 현미밥 곤약밥 대용량 박스",
        coupangBtn: `🚀 현미밥 ${brownRiceBowls}개 최저가 ↗`,
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=%EC%A6%89%EC%84%9D%20%ED%98%84%EB%AF%B8%EB%B0%A5%20%EB%8C%80%EC%9A%A9%EB%9F%89%20%EB%B0%95%EC%8A%A4",
        lpBtn: "🏷️ 지마켓 박스할인 ↗"
      },
      {
        icon: "💪",
        stepTag: "근손실 방어",
        label: `WPI 분리유청 프로틴 × ${proteinTubs}통`,
        calcVal: `운동 직후 1스쿱 단백질 보충`,
        coupangKw: "WPI 분리유청단백질 프로틴 파우더",
        coupangBtn: `🚀 WPI 프로틴 ${proteinTubs}통 ↗`,
        lpMerchant: "lotteon",
        lpUrl: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EB%B6%84%EB%A6%AC%EC%9C%A0%EC%B2%AD%EB%8B%A8%EB%B0%B1%EC%A7%88%20WPI",
        lpBtn: "🏷️ 롯데ON 특가 ↗"
      }
    ],
    summary,
    cpaTitle: `${weeks}주 책임 감량 1:1 체질 맞춤 다이어트 무료 진단`,
    cpaPayout: "45,000원",
    cpaKey: "diet_custom_consulting",
    cpaBenefit: `${chickenPacks}팩`,
    products: [
      {
        icon: "🍗",
        title: `하림·곰곰 닭가슴살 (${chickenPacks}팩 묶음)`,
        kw: "냉동 닭가슴살 100g 대용량 패키지",
        type: "coupang",
        badge: "❄️ 새벽도착",
        calcMatchTag: `🍗 ${weeks}주 총 ${chickenPacks}팩 (하루 ${dailyProteinG}g)`,
        matchReason: `${weight}kg 맞춤 단백질 팩당 1,200원대 최저가`,
        ctaText: `닭가슴살 ${chickenPacks}팩 최저가 →`
      },
      {
        icon: "🍚",
        title: `곰곰·오뚜기 현미밥 (${brownRiceBowls}개 박스)`,
        kw: "즉석 현미밥 대용량 박스",
        type: "coupang",
        badge: "📦 박스특가",
        calcMatchTag: `🍚 ${weeks}주 총 ${brownRiceBowls}개 (하루 2끼)`,
        matchReason: `일일 ${targetKcal.toLocaleString()}kcal 저당 탄수화물 정량`,
        ctaText: `현미밥 ${brownRiceBowls}개입 특가 →`
      },
      {
        icon: "💪",
        title: `롯데ON WPI 프로틴 (${proteinTubs}통 특가)`,
        merchant: "lotteon",
        merchantLabel: "롯데ON",
        url: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EB%B6%84%EB%A6%AC%EC%9C%A0%EC%B2%AD%EB%8B%A8%EB%B0%B1%EC%A7%88%20WPI",
        type: "linkprice",
        badge: `💪 공식몰 특가`,
        calcMatchTag: `💪 ${weeks}주 ${proteinTubs}통 (1일 1스쿱)`,
        matchReason: `운동 직후 빠른 단백질 흡수 보충제`,
        ctaText: `WPI 프로틴 ${proteinTubs}통 최저가 →`
      },
      {
        icon: "🥗",
        title: `지마켓 닭가슴살+현미밥 올인원 특가`,
        merchant: "gmarket",
        merchantLabel: "지마켓",
        url: "https://www.gmarket.co.kr/n/search?keyword=%EB%83%89%EB%8F%99%20%EB%8B%AD%EA%B0%80%EC%8A%B4%EC%82%B4%20%EB%8C%80%EC%9A%A9%EB%9F%89%20%ED%98%84%EB%AF%B8%EB%B0%A5",
        type: "linkprice",
        badge: "🏷️ 스마일배송",
        calcMatchTag: `💰 식단비 -${dietSavingWon.toLocaleString()}원 절약`,
        matchReason: `${weeks}주 식단 묶음배송 54% 절약`,
        ctaText: "지마켓 식단 묶음특가 →"
      }
    ]
  };
}

/**
 * Calc 3: 반려동물(강아지·고양이) 맞춤 칼로리·사료 급여량 & 소진일 진단기
 */
function calculatePet(inputs = {}) {
  const petWeight = toNum(inputs.petWeight, 5.0);
  const safeWeight = Math.max(0.5, petWeight);
  const factor = toNum(inputs.factor, 1.6);
  const kcalPerKg = Number(inputs.kcalPerKg) || 3650;
  const bagKg = Number(inputs.bagKg) || 2.0;

  // 휴식기 에너지 요구량: RER = 70 * weight^0.75
  const rerRaw = 70 * Math.pow(safeWeight, 0.75);
  const rer = Math.round(rerRaw);

  // 일일 에너지 요구량: DER = RER * 생애주기 계수
  const der = Math.round(rerRaw * factor);

  // 일일 권장 급여량 (g)
  const dailyGrams = Math.round((der / kcalPerKg) * 1000);
  const halfGrams = Math.round(dailyGrams / 2);
  const cupsPerDay = parseFloat((dailyGrams / 80).toFixed(1));

  // 사료 1포대 소진 일수 (내림)
  const daysPerBag = Math.floor((bagKg * 1000) / dailyGrams);

  const badge = "🐾 수의영양학 정량 계산";
  const headline = `하루 ${dailyGrams}g (종이컵 ${cupsPerDay}컵) · ${daysPerBag}일 소진!`;
  const summary = `하루 ${dailyGrams}g 급여 시 ${bagKg}kg 1포대는 ${daysPerBag}일 만에 소진됩니다.`;

  // 생애주기 계수(factor) 및 체중(petWeight)에 따른 맞춤형 사료/케어 품목 자동 매칭
  let petStageLabel = `${petWeight}kg 성견 맞춤`;
  let feedTitle = `${petWeight}kg 로얄캐닌 가수분해 사료 (${bagKg}kg)`;
  let feedCoupangKw = `강아지 가수분해 사료 로얄캐닌 ${bagKg}kg`;
  let careTitle = "슬개골·관절·유산균 영양제";
  let careKw = "강아지 슬개골 관절 영양제 유산균";

  if (factor <= 1.25 && petWeight <= 8) {
    petStageLabel = `${petWeight}kg 반려묘·시니어`;
    feedTitle = `${petWeight}kg 인도어 체중조절 사료 (${bagKg}kg)`;
    feedCoupangKw = "로얄캐닌 인도어 고양이 사료 체중조절";
    careTitle = "신장·유산균 & 두부모래 세트";
    careKw = "고양이 신장 영양제 유산균 두부모래";
  } else if (factor >= 2.0) {
    petStageLabel = `${petWeight}kg 퍼피 맞춤`;
    feedTitle = `${petWeight}kg 로얄캐닌 퍼피 사료 (${bagKg}kg)`;
    feedCoupangKw = "로얄캐닌 미니 인도어 퍼피 강아지 사료";
    careTitle = "퍼피 초유 면역·유산균 영양제";
    careKw = "강아지 퍼피 유산균 초유 영양제";
  } else if (petWeight >= 15) {
    petStageLabel = `${petWeight}kg 대형견 맞춤`;
    feedTitle = `${petWeight}kg 대형견 대용량 사료 (${bagKg}kg)`;
    feedCoupangKw = "대형견 대용량 사료 12kg 로얄캐닌";
    careTitle = "대형견 고관절 콘드로이친 영양제";
    careKw = "대형견 관절 영양제 콘드로이친";
  }

  return {
    calcId: "pet",
    petWeight,
    factor,
    kcalPerKg,
    bagKg,
    rer,
    der,
    dailyGrams,
    halfGrams,
    cupsPerDay,
    daysPerBag,
    badge,
    headline,
    metrics: [
      { label: "하루 칼로리", val: `${der} kcal` },
      { label: "하루 급여량(1끼)", val: `${dailyGrams}g (${halfGrams}g)` },
      { label: `${bagKg}kg 소진일`, val: `${daysPerBag}일` }
    ],
    lossComparison: {
      lossLabel: "비만·관절 수술비",
      lossValueText: "평균 180만 원+",
      optLabel: `${dailyGrams}g 정량 급여 케어`,
      optValueText: `월 ${Math.max(25000, Math.round((dailyGrams * 30 / 1000) * 14000)).toLocaleString()}원`,
      savingBadge: "슬개골 병원비 -85% 방어",
      optPercent: 22
    },
    zeroFeelFraming: {
      badge: "🔥 병원비 180만 원 방어",
      callout: `수술비 180만 원 예방 시 사료 체감가 0원! (하루 ${dailyGrams}g · ${daysPerBag}일분)`,
      ctaHighlight: `병원비 아끼는 맞춤 사료·계량템 ↗`
    },
    impulseItem: {
      badge: "🐾 8,900원 집사 필수템",
      title: factor <= 1.25 && petWeight <= 8
        ? `1g 전자저울 스푼 & 두부모래`
        : `1g 전자저울 스푼 & 배변패드 100매`,
      sub: `1끼 ${halfGrams}g 정밀 계량 스푼`,
      coupangKw: factor <= 1.25 && petWeight <= 8 ? "고양이 사료 전자저울 스푼 두부모래" : "강아지 사료 전자저울 스푼 배변패드 100매",
      btnLabel: "🛒 8,900원 계량스푼·패드 로켓배송 ↗"
    },
    actionItems: [
      {
        icon: "🐾",
        stepTag: "사료 정량",
        label: `[${petStageLabel}] ${bagKg}kg 사료 (${daysPerBag}일분)`,
        calcVal: `하루 ${dailyGrams}g · ${daysPerBag}일 소진`,
        coupangKw: feedCoupangKw,
        coupangBtn: `🚀 ${bagKg}kg 사료 로켓배송 ↗`,
        lpMerchant: "gmarket",
        lpUrl: `https://www.gmarket.co.kr/n/search?keyword=${encodeURIComponent(feedCoupangKw)}`,
        lpBtn: "🏷️ 지마켓 특가 ↗"
      },
      {
        icon: "🥄",
        stepTag: "1끼 계량",
        label: `1g 디지털 전자저울 사료스푼`,
        calcVal: `1끼 ${halfGrams}g 정량 배식`,
        coupangKw: "강아지 고양이 디지털 전자저울 사료스푼 자동급식기",
        coupangBtn: `🚀 1끼 ${halfGrams}g 계량스푼 ↗`,
        lpMerchant: "lotteon",
        lpUrl: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EB%B0%98%EB%A0%A4%EB%8F%99%EB%AC%BC%20%EC%82%AC%EB%A3%8C%20%EC%A0%84%EC%9E%90%EC%A0%80%EC%9A%B8%20%EC%8A%A4%ED%91%BC",
        lpBtn: "🏷️ 롯데ON 특가 ↗"
      },
      {
        icon: "🏥",
        stepTag: "관절 예방",
        label: `${careTitle}`,
        calcVal: `슬개골 수술비(180만원) 사전 예방`,
        coupangKw: careKw,
        coupangBtn: "🚀 영양제 로켓배송 ↗",
        lpMerchant: "gmarket",
        lpUrl: `https://www.gmarket.co.kr/n/search?keyword=${encodeURIComponent(careKw)}`,
        lpBtn: "🏷️ 지마켓 특가 ↗"
      }
    ],
    summary,
    cpaTitle: `${petWeight}kg 우리 아이 펫보험 90% 보장 최저가 비교`,
    cpaPayout: "35,000원",
    cpaKey: "pet_insurance_compare",
    cpaBenefit: `${dailyGrams}g`,
    products: [
      {
        icon: "🐾",
        title: feedTitle,
        kw: feedCoupangKw,
        type: "coupang",
        badge: `🐾 ${daysPerBag}일분 로켓배송`,
        calcMatchTag: `🐾 하루 ${dailyGrams}g × ${daysPerBag}일분`,
        matchReason: `${petWeight}kg 아이 ${daysPerBag}일 맞춤 사료 용량`,
        ctaText: `${bagKg}kg 사료 최저가 →`
      },
      {
        icon: "🥄",
        title: `1g 디지털 사료 계량스푼 · 자동급식기`,
        kw: "강아지 고양이 디지털 전자저울 사료스푼 자동급식기",
        type: "coupang",
        badge: "⚖️ 비만 차단",
        calcMatchTag: `🥄 1끼 ${halfGrams}g 정량 배식`,
        matchReason: `종이컵(${cupsPerDay}컵) 눈대중 과급여 원천 차단`,
        ctaText: `1g 계량스푼·급식기 최저가 →`
      },
      {
        icon: "🏥",
        title: `지마켓 ${careTitle} 특가`,
        merchant: "gmarket",
        merchantLabel: "지마켓",
        url: `https://www.gmarket.co.kr/n/search?keyword=${encodeURIComponent(careKw)}`,
        type: "linkprice",
        badge: "💳 스마일클럽",
        calcMatchTag: `🏥 ${petWeight}kg 관절·대사 케어`,
        matchReason: `슬개골·신장 병원비 180만 원 하루 1포 예방`,
        ctaText: "지마켓 영양제 최저가 →"
      },
      {
        icon: "📦",
        title: `롯데ON ${petStageLabel} 생필품 모음`,
        merchant: "lotteon",
        merchantLabel: "롯데ON",
        url: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EA%B0%95%EC%95%84%EC%A7%80%20%EA%B3%A0%EC%96%91%EC%9D%B4%20%EC%82%AC%EB%A3%8C%20%EB%B0%B0%EB%B3%80%ED%8C%A8%EB%93%9C",
        type: "linkprice",
        badge: "📦 반값 생필품",
        calcMatchTag: `💰 ${daysPerBag}일 주기 장보기`,
        matchReason: `사료·배변패드·간식 대용량 묶음 특가`,
        ctaText: "롯데ON 생필품 특가 →"
      }
    ]
  };
}

/**
 * Calc 4: 자취·이사·신혼 예산별 가전/가구 풀세팅 최적 견적 시뮬레이터
 * STRICT INVARIANT: totalCost <= budget (총 품목 금액 합계 <= 사용자 예산)
 */
function calculateRoom(inputs = {}) {
  let budgetWon;
  let budgetMan;

  if (inputs.budget !== undefined && inputs.budget !== null && inputs.budget !== '') {
    const raw = toNum(inputs.budget, 150);
    if (raw >= 100000) {
      budgetWon = Math.floor(raw);
      budgetMan = Math.round(budgetWon / 10000);
    } else {
      budgetMan = Math.floor(raw);
      budgetWon = budgetMan * 10000;
    }
  } else if (inputs.budgetMan !== undefined && inputs.budgetMan !== null && inputs.budgetMan !== '') {
    budgetMan = toNum(inputs.budgetMan, 150);
    budgetWon = Math.floor(budgetMan * 10000);
  } else {
    budgetMan = 150;
    budgetWon = 1500000;
  }

  const roomSize = toNum(inputs.roomSize, 7);
  const priority = inputs.priority || "가성비";

  let rRef = 0.24;
  let rWash = 0.22;
  let rBed = 0.20;
  let rTv = 0.16;
  let rSmall = 0.18;
  let bedName = "매트리스+침대프레임";
  let smallName = "전자레인지+밥솥+청소기";

  if (priority === "가전 집중") {
    rRef = 0.30;
    rWash = 0.28;
    rBed = 0.15;
    rTv = 0.15;
    rSmall = 0.12;
    bedName = "실속형 매트리스+침대프레임";
    smallName = "고화력 전자레인지+밥솥+청소기";
  } else if (priority === "화이트 감성") {
    rRef = 0.18;
    rWash = 0.18;
    rBed = 0.30;
    rTv = 0.18;
    rSmall = 0.16;
    bedName = "화이트 침대프레임+매트리스";
    smallName = "화이트 소형가전 3종";
  }

  const refWon = Math.floor(budgetWon * rRef);
  const washWon = Math.floor(budgetWon * rWash);
  const bedWon = Math.floor(budgetWon * rBed);
  const tvWon = Math.floor(budgetWon * rTv);
  const smallWon = budgetWon - (refWon + washWon + bedWon + tvWon);

  const items = [
    { category: "가전", name: "냉장고/김치냉장고", rate: rRef, cost: refWon },
    { category: "가전", name: "세탁기/건조기", rate: rWash, cost: washWon },
    { category: "가구", name: bedName, rate: rBed, cost: bedWon },
    { category: "가전", name: "스마트TV/모니터", rate: rTv, cost: tvWon },
    { category: "가전", name: smallName, rate: rSmall, cost: smallWon }
  ];

  const totalCost = items.reduce((sum, item) => sum + item.cost, 0);
  if (totalCost > budgetWon) {
    throw new Error(`Invariant Violation: totalCost (${totalCost}) > budgetWon (${budgetWon})`);
  }

  const appliancesTotalWon = refWon + washWon + tvWon + smallWon;
  const furnitureTotalWon = bedWon;

  const top1 = Math.round(refWon / 10000);
  const top2 = Math.round(washWon / 10000);
  const top3 = Math.round(bedWon / 10000);
  const top4 = Math.round(tvWon / 10000);
  const top5 = Math.round(smallWon / 10000);
  const savingWon = Math.round(budgetWon * 0.22);

  let refTitle = `${top1}만 원대 무소음 냉장고`;
  let refKw = "원룸 자취방 무소음 냉장고 로켓설치";
  let washTitle = `${top2}만 원대 세탁기`;
  let washKw = "원룸 세탁기 로켓설치";
  let bedKw = "지누스 독립스프링 매트리스 침대프레임";

  if (roomSize >= 18 || budgetMan >= 400) {
    refTitle = `${top1}만 원대 4도어 냉장고`;
    refKw = "양문형 4도어 냉장고 로켓설치";
    washTitle = `${top2}만 원대 세탁기·건조기`;
    washKw = "드럼세탁기 건조기 로켓설치";
    bedKw = "퀸 침대프레임 호텔식 독립스프링 매트리스";
  } else if (priority === "화이트 감성") {
    refTitle = `${top1}만 원대 화이트 냉장고`;
    refKw = "화이트 냉장고 로켓설치";
    washTitle = `${top2}만 원대 화이트 세탁기`;
    washKw = "화이트 드럼세탁기 로켓설치";
    bedKw = "화이트 수납 침대프레임 포켓스프링 매트리스";
  }

  const badge = `🏠 ${roomSize}평 [${priority}] 초과 0원 배분`;
  const headline = `총 ${budgetMan}만 원 풀세팅 (가전 ${Math.round(appliancesTotalWon / 10000)}만 + 가구 ${Math.round(furnitureTotalWon / 10000)}만)`;
  const summary = `${roomSize}평 ${budgetMan}만 원 황금배분 · 온라인 특가로 -${Math.round(savingWon / 10000)}만 원 절약`;

  return {
    calcId: "room",
    budgetMan,
    budgetWon,
    roomSize,
    priority,
    totalBudget: totalCost,
    totalCost,
    items,
    appliancesTotalWon,
    furnitureTotalWon,
    top1,
    top2,
    top3,
    top4,
    top5,
    savingWon,
    badge,
    headline,
    metrics: [
      { label: "냉장고 예산", val: `${top1}만 원` },
      { label: "세탁기 예산", val: `${top2}만 원` },
      { label: "침대 예산", val: `${top3}만 원` }
    ],
    lossComparison: {
      lossLabel: "오프라인 정가",
      lossValueText: `${Math.round((budgetWon + savingWon) / 10000).toLocaleString()}만 원`,
      optLabel: "온라인 로켓설치",
      optValueText: `${budgetMan.toLocaleString()}만 원`,
      savingBadge: `마진 -${Math.round(savingWon / 10000).toLocaleString()}만 원 절약 (-22%)`,
      optPercent: 78
    },
    zeroFeelFraming: {
      badge: `🔥 마진 -${Math.round(savingWon / 10000)}만 원 세이브`,
      callout: `아낀 ${Math.round(savingWon / 10000)}만 원으로 소형가전 3종 체감가 0원!`,
      ctaHighlight: `마진 -${Math.round(savingWon / 10000)}만 원 아끼는 로켓설치 ↗`
    },
    impulseItem: {
      badge: "🏠 1만원대 입주 필수템",
      title: "고용량 멀티탭 + 건조대 + 압축봉",
      sub: "이사 첫날 당장 필요한 자취 생존템",
      coupangKw: "개별스위치 멀티탭 빨래건조대 자취 필수템",
      btnLabel: "🛒 1만원대 입주 필수템 로켓배송 ↗"
    },
    actionItems: [
      {
        icon: "🧊",
        stepTag: `예산 ${Math.round(rRef * 100)}%`,
        label: `${refTitle}`,
        calcVal: `예산 ${top1}만 원 이내 무료 로켓설치`,
        coupangKw: refKw,
        coupangBtn: `🚀 ${top1}만 원대 냉장고 ↗`,
        lpMerchant: "lotteon",
        lpUrl: `https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=${encodeURIComponent(refKw)}`,
        lpBtn: "🏷️ 롯데ON 특가 ↗"
      },
      {
        icon: "🧺",
        stepTag: `예산 ${Math.round(rWash * 100)}%`,
        label: `${washTitle}`,
        calcVal: `예산 ${top2}만 원 이내 무료설치`,
        coupangKw: washKw,
        coupangBtn: `🚀 ${top2}만 원대 세탁기 ↗`,
        lpMerchant: "himart",
        lpUrl: `https://www.e-himart.co.kr/app/search/totalSearch?query=${encodeURIComponent(washKw)}`,
        lpBtn: "🏷️ 하이마트 특가 ↗"
      },
      {
        icon: "🛏️",
        stepTag: `예산 ${Math.round(rBed * 100)}%`,
        label: `${top3}만 원대 ${bedName}`,
        calcVal: `예산 ${top3}만 원 이내 ${roomSize}평 맞춤`,
        coupangKw: bedKw,
        coupangBtn: `🚀 ${top3}만 원대 침대 ↗`,
        lpMerchant: "hmall",
        lpUrl: `https://www.hmall.com/md/pde/search?searchTerm=${encodeURIComponent(bedKw)}`,
        lpBtn: "🏷️ 현대Hmall 특가 ↗"
      },
      {
        icon: "📺",
        stepTag: `예산 ${Math.round(rTv * 100)}%`,
        label: `${top4}만 원대 4K 스마트TV`,
        calcVal: `예산 ${top4}만 원 이내 넷플릭스 직결`,
        coupangKw: "4K 스마트TV 삼탠바이미 이동식 모니터",
        coupangBtn: `🚀 ${top4}만 원대 TV ↗`,
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=4K%20%EC%8A%A4%EB%A7%88%ED%8A%B8TV%20%EC%9D%B4%EB%8F%99%EC%8B%9D%20%ED%8B%B0%EB%B9%84",
        lpBtn: "🏷️ 지마켓 특가 ↗"
      },
      {
        icon: "🍳",
        stepTag: `예산 ${Math.round(rSmall * 100)}%`,
        label: `${top5}만 원대 ${smallName}`,
        calcVal: `잔여 ${top5}만 원으로 소형가전 완비`,
        coupangKw: "자취방 전자레인지 전기밥솥 무선청소기 세트",
        coupangBtn: `🚀 ${top5}만 원대 소형가전 ↗`,
        lpMerchant: "auction",
        lpUrl: "http://browse.auction.co.kr/search?keyword=%EC%A0%84%EC%9E%90%EB%A0%88%EC%9D%B8%EC%A7%80%20%EB%AC%B4%EC%84%A0%EC%B2%AD%EC%86%8C%EA%B8%B0",
        lpBtn: "🏷️ 옥션 특가 ↗"
      }
    ],
    summary,
    cpaTitle: `${roomSize}평 맞춤 원룸·포장이사 3초 최저가 비교견적`,
    cpaPayout: "30,000원",
    cpaKey: "room_moving_quote",
    cpaBenefit: `${budgetMan}만원`,
    products: [
      {
        icon: "🧊",
        title: `${refTitle} 로켓설치`,
        kw: refKw,
        type: "coupang",
        badge: "🚛 로켓설치",
        calcMatchTag: `🧊 냉장고 예산 ${top1}만 원 (${Math.round(rRef * 100)}%)`,
        matchReason: `${roomSize}평 맞춤 ${top1}만 원대 무소음 냉장고`,
        ctaText: `${top1}만원대 냉장고 특가 →`
      },
      {
        icon: "🛏️",
        title: `${top3}만 원대 ${bedName}`,
        kw: bedKw,
        type: "coupang",
        badge: "🛏️ 숙면 베스트",
        calcMatchTag: `🛏️ 침대 예산 ${top3}만 원 (${Math.round(rBed * 100)}%)`,
        matchReason: `[${priority}] 맞춤 프레임+매트리스 세트`,
        ctaText: `${top3}만원대 침대 특가 →`
      },
      {
        icon: "🛋️",
        title: `현대Hmall ${roomSize}평 침대·가구전`,
        merchant: "hmall",
        merchantLabel: "현대Hmall",
        url: `https://www.hmall.com/md/pde/search?searchTerm=${encodeURIComponent(bedKw)}`,
        type: "linkprice",
        badge: "🏷️ 카드할인",
        calcMatchTag: `🛋️ 유통마진 -${Math.round(savingWon / 10000)}만 원 절약`,
        matchReason: `백화점 대비 -${Math.round(savingWon / 10000)}만 원 아끼는 온라인 특가`,
        ctaText: `${roomSize}평 가구 특가 →`
      },
      {
        icon: "🧺",
        title: `롯데ON 세탁기(${top2}만)·TV(${top4}만) 특가`,
        merchant: "lotteon",
        merchantLabel: "롯데ON",
        url: `https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=${encodeURIComponent(washKw)}`,
        type: "linkprice",
        badge: "⚡ 묶음할인",
        calcMatchTag: `🧺 세탁기 ${top2}만 + TV ${top4}만 + 소형 ${top5}만`,
        matchReason: `나머지 가전 예산(${top2 + top4 + top5}만 원) 한 번에 해결`,
        ctaText: "롯데ON 가전 특가 →"
      }
    ]
  };
}

/**
 * Calc 5: 자동차 구매방식(장기렌트 vs 리스 vs 할부 vs 현금) TCO 손익 계산기
 */
function calculateAuto(inputs = {}) {
  const carPriceMan = toNum(inputs.carPriceMan, 3500);
  const months = Number(inputs.months) || 48;
  const taxRate = toNum(inputs.taxRate, 24);

  const rawDown = toNum(inputs.downPaymentRate, 20);
  const downPaymentRate = rawDown > 1 ? rawDown / 100 : rawDown;
  const financedRate = Math.max(0, 1 - downPaymentRate);

  const interestRate = toNum(inputs.interestRate, 5.5);

  let driverAgeFactor = 1.0;
  if (inputs.driverAge === "under26" || (typeof inputs.driverAge === "number" && inputs.driverAge < 26)) {
    driverAgeFactor = 1.35;
  } else if (inputs.driverAge === "over35" || (typeof inputs.driverAge === "number" && inputs.driverAge >= 35)) {
    driverAgeFactor = 0.90;
  } else if (inputs.driverAgeFactor !== undefined) {
    driverAgeFactor = toNum(inputs.driverAgeFactor, 1.0);
  }

  const residualRate = inputs.residualRate !== undefined
    ? toNum(inputs.residualRate, 0.45)
    : (months <= 36 ? 0.50 : (months <= 48 ? 0.45 : 0.40));

  const price = carPriceMan * 10000;
  const acqTax = Math.round(price * 0.07);
  const insuranceTotal = Math.round(1450000 * driverAgeFactor * (months / 12));
  const installmentInterest = Math.round(price * financedRate * (interestRate / 100) * (months / 24));
  const installmentTco = price + acqTax + insuranceTotal + installmentInterest;

  const taxSaving = taxRate > 0
    ? Math.round(Math.min(15000000, price * 0.3) * (taxRate / 100) * (months / 12))
    : 0;

  const rentTco = Math.round(price * 0.94 + insuranceTotal * 0.65 - taxSaving);
  const diffMan = Math.round(Math.abs(installmentTco - rentTco) / 10000);
  const winner = rentTco < installmentTco ? "신차 장기렌트" : "신차 할부";

  const residualValue = Math.round(price * residualRate);
  const netInstallmentTco = installmentTco - residualValue;
  const rentBuyoutPrice = Math.round(price * (residualRate * 1.05));

  const acqTaxMan = Math.round(acqTax / 10000);
  const insTaxSaveMan = Math.round((taxSaving + insuranceTotal * 0.35) / 10000);
  const residualMan = Math.round(residualValue / 10000);

  let carSegmentLabel = "쏘렌토·싼타페·그랜저급";
  let matKw = "쏘렌토 싼타페 그랜저 6D 코일매트 신차패키지";
  if (carPriceMan <= 2100) {
    carSegmentLabel = "캐스퍼·레이·아반떼급";
    matKw = "캐스퍼 레이 아반떼 전용 코일매트 트렁크매트";
  } else if (carPriceMan <= 3200) {
    carSegmentLabel = "아반떼·스포티지·쏘나타급";
    matKw = "아반떼 스포티지 투싼 전용 6D 코일매트";
  } else if (carPriceMan >= 4700 && carPriceMan <= 5800) {
    carSegmentLabel = "아이오닉5·EV6·카니발급";
    matKw = "아이오닉5 EV6 카니발 전용 코일매트 V2L 액세서리";
  } else if (carPriceMan > 5800) {
    carSegmentLabel = "제네시스 G80·GV80급";
    matKw = "제네시스 G80 GV70 GV80 전용 고급 코일매트 가죽케어";
  }

  const badge = `🏆 ${months}개월 총비용 승자 판정`;
  const headline = `[${winner}] 총 ${diffMan.toLocaleString()}만 원 이득!`;
  const summary = `취등록세(${acqTaxMan}만)·보험·절세 합산 시 [${winner}]가 ${diffMan.toLocaleString()}만 원 유리`;

  const maxTco = Math.max(installmentTco, rentTco);
  const minTco = Math.min(installmentTco, rentTco);

  return {
    calcId: "auto",
    carPriceMan,
    months,
    taxRate,
    downPaymentRate,
    interestRate,
    driverAgeFactor,
    residualRate,
    residualValue,
    netInstallmentTco,
    rentBuyoutPrice,
    price,
    acqTax,
    insuranceTotal,
    installmentInterest,
    installmentTco,
    rentTco,
    taxSaving,
    diffMan,
    winner,
    badge,
    headline,
    metrics: [
      { label: "취등록세(7%)", val: `${acqTaxMan}만 원` },
      { label: "절세·보험 절감", val: `${insTaxSaveMan}만 원` },
      { label: "총 절약액", val: `${diffMan.toLocaleString()}만 원` }
    ],
    lossComparison: {
      lossLabel: `${winner === "신차 장기렌트" ? "일반 할부" : "장기렌트"} 총지출`,
      lossValueText: `${Math.round(maxTco / 10000).toLocaleString()}만 원`,
      optLabel: `[${winner}] 총지출`,
      optValueText: `${Math.round(minTco / 10000).toLocaleString()}만 원`,
      savingBadge: `총 -${diffMan.toLocaleString()}만 원 절약`,
      optPercent: maxTco > 0 ? Math.max(25, Math.min(90, Math.round((minTco / maxTco) * 100))) : 75
    },
    zeroFeelFraming: {
      badge: `🔥 총 +${diffMan.toLocaleString()}만 원 세이브`,
      callout: `[${winner}] 선택으로 +${diffMan.toLocaleString()}만 원 절약!`,
      ctaHighlight: `+${diffMan.toLocaleString()}만 원 아끼는 신차 필수템 ↗`
    },
    impulseItem: {
      badge: "⛽ 1만원대 연비 절감 1위",
      title: "불스원샷 2개입 & 활성탄 에어컨필터",
      sub: "엔진 세정 + 연비 15% 향상 필수템",
      coupangKw: "불스원샷 연료첨가제 2개입 에어컨필터",
      btnLabel: "🛒 1만원대 불스원샷·필터 로켓배송 ↗"
    },
    actionItems: [
      {
        icon: "🎥",
        stepTag: "보험료 할인",
        label: `아이나비·파인뷰 2채널 QHD 블랙박스`,
        calcVal: `보험료 5% 특약할인 즉시 적용`,
        coupangKw: "아이나비 파인뷰 2채널 QHD 블랙박스 무료출장장착",
        coupangBtn: "🚀 QHD 블랙박스 특가 ↗",
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=2%EC%B1%84%EB%84%90%20QHD%20%EB%B8%94%EB%9E%99%EB%B0%95%EC%8A%A4%20%EB%AC%B4%EB%A3%8C%EC%9E%A5%EC%B0%A9",
        lpBtn: "🏷️ 지마켓 무료장착 ↗"
      },
      {
        icon: "🛡️",
        stepTag: `잔존가치 방어`,
        label: `[${carSegmentLabel}] 6D 코일매트`,
        calcVal: `중고차 잔존가치 ${residualMan}만 원 감가 방어`,
        coupangKw: matKw,
        coupangBtn: `🚀 차종별 코일매트 ↗`,
        lpMerchant: "auction",
        lpUrl: `http://browse.auction.co.kr/search?keyword=${encodeURIComponent(matKw)}`,
        lpBtn: "🏷️ 옥션 특가 ↗"
      },
      {
        icon: "⚡",
        stepTag: `신차 필수템`,
        label: `15W 맥세이프 거치대 & 필터`,
        calcVal: `아낀 ${diffMan}만 원으로 신차 풀세팅`,
        coupangKw: "신지모루 차량용 맥세이프 고속충전 거치대 활성탄 에어컨필터",
        coupangBtn: "🚀 맥세이프 거치대 ↗",
        lpMerchant: "lotteon",
        lpUrl: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EC%B0%A8%EB%9F%89%EC%9A%A9%20%EB%A7%A5%EC%84%B8%EC%9D%B4%ED%94%84%20%EA%B1%B0%EC%B9%98%EB%8C%80",
        lpBtn: "🏷️ 롯데ON 특가 ↗"
      }
    ],
    summary,
    cpaTitle: `할부보다 ${diffMan}만 원 아끼는 국내 21개 렌트·리스사 1분 최저가 견적`,
    cpaPayout: "60,000원",
    cpaKey: "auto_longterm_rent",
    cpaBenefit: `${diffMan}만원`,
    products: [
      {
        icon: "🎥",
        title: `아이나비 2채널 QHD 블랙박스`,
        kw: "2채널 QHD 블랙박스",
        type: "coupang",
        badge: "🎥 보험료 5% 할인",
        calcMatchTag: `🎥 취등록세 ${acqTaxMan}만 원 · 보험 절감`,
        matchReason: `장착 사진 1장으로 ${months}개월 보험료 즉시 할인`,
        ctaText: "QHD 블랙박스 최저가 →"
      },
      {
        icon: "⚡",
        title: `신지모루 15W 맥세이프 충전 거치대`,
        kw: "차량용 맥세이프 고속충전 거치대",
        type: "coupang",
        badge: "🚀 로켓배송",
        calcMatchTag: `🏆 [${winner}] ${diffMan}만 원 절약분`,
        matchReason: `${carSegmentLabel} 송풍구 완벽 밀착 1위 거치대`,
        ctaText: "15W 맥세이프 거치대 특가 →"
      },
      {
        icon: "🛠️",
        title: "지마켓 QHD 블랙박스 무료출장장착",
        merchant: "gmarket",
        merchantLabel: "지마켓",
        url: "https://www.gmarket.co.kr/n/search?keyword=2%EC%B1%84%EB%84%90%20QHD%20%EB%B8%94%EB%9E%99%EB%B0%95%EC%8A%A4%20%EB%AC%B4%EB%A3%8C%EC%9E%A5%EC%B0%A9",
        type: "linkprice",
        badge: "🛠️ 무료출장",
        calcMatchTag: `💰 절세·보험 -${insTaxSaveMan}만 원 절감`,
        matchReason: `집·회사 방문 공임비 0원 무료 장착`,
        ctaText: "지마켓 무료장착 특가 →"
      },
      {
        icon: "🛡️",
        title: `옥션 ${carSegmentLabel} 6D 코일매트`,
        merchant: "auction",
        merchantLabel: "옥션",
        url: `http://browse.auction.co.kr/search?keyword=${encodeURIComponent(matKw)}`,
        type: "linkprice",
        badge: "✨ 감가 방어",
        calcMatchTag: `🛡️ 잔존가치 ${residualMan}만 원 보존`,
        matchReason: `만기 반납·매각 시 오염 감가 0원 방어`,
        ctaText: "옥션 차종별 매트 특가 →"
      }
    ]
  };
}

/**
 * Calc 6: 인터넷·TV 약정 위약금 vs 현금 사은품(최대 47만 원) 갈아타기 손익 계산기
 */
function calculateTelecom(inputs = {}) {
  const penaltyMan = toNum(inputs.penaltyMan, 15);
  const oldFee = Number(inputs.oldFee) || 46000;
  const newFee = Number(inputs.newFee) || 38500;
  const cashGiftMan = toNum(inputs.cashGiftMan, 47);

  const immediateNetWon = (cashGiftMan - penaltyMan) * 10000;
  const immediateDiffMan = cashGiftMan - penaltyMan;
  const monthlyDiff = oldFee - newFee;
  const threeYearFeeSave = monthlyDiff * 36;
  const threeYearFeeSaveMan = Math.round(threeYearFeeSave / 10000);
  const totalNetBenefit = immediateNetWon + threeYearFeeSave;
  const benefitMan = Math.round(totalNetBenefit / 10000);

  let bepMonths = 0;
  if (cashGiftMan >= penaltyMan) {
    bepMonths = 0;
  } else if (monthlyDiff > 0) {
    bepMonths = Math.ceil(((penaltyMan - cashGiftMan) * 10000) / monthlyDiff);
  } else {
    bepMonths = -1;
  }

  const formatSignedManWon = (val) => {
    if (val > 0) return `+${val}만 원`;
    if (val < 0) return `-${Math.abs(val)}만 원`;
    return `0원`;
  };

  const formatSignedWon = (val) => {
    if (val > 0) return `+${val.toLocaleString()}원`;
    if (val < 0) return `-${Math.abs(val).toLocaleString()}원`;
    return `0원`;
  };

  let badge = "";
  let headline = "";
  let summary = "";

  if (totalNetBenefit > 0) {
    badge = "💰 지금 바로 갈아타기 무조건 이득!";
    headline = `위약금 ${penaltyMan}만 원 내고도 총 +${benefitMan}만 원 이득!`;
    summary = `사은품 ${cashGiftMan}만 원 - 위약금 ${penaltyMan}만 원 + 3년 요금 절감 = 총 +${totalNetBenefit.toLocaleString()}원 순수익`;
  } else if (totalNetBenefit === 0) {
    badge = "⚖️ 손익 동일 (현상 유지 권장)";
    headline = `위약금과 사은품 손익 동일 (0원)`;
    summary = `위약금과 신규 혜택이 동일하여 약정 만료 시까지 유지를 권장합니다.`;
  } else {
    badge = "⏳ 만기 후 이동 권장";
    headline = `지금 이동 시 -${Math.abs(benefitMan)}만 원 손해!`;
    summary = `위약금이 사은품보다 커서 약정 만기 후 이동하시는 것이 유리합니다.`;
  }

  return {
    calcId: "telecom",
    penaltyMan,
    oldFee,
    newFee,
    cashGiftMan,
    immediateNetWon,
    monthlyDiff,
    threeYearFeeSave,
    totalNetBenefit,
    bepMonths,
    badge,
    headline,
    metrics: [
      { label: "사은품-위약금", val: formatSignedManWon(immediateDiffMan) },
      { label: monthlyDiff >= 0 ? "3년 요금절감" : "3년 추가부담", val: formatSignedManWon(threeYearFeeSaveMan) },
      { label: totalNetBenefit >= 0 ? "총 순이익" : "총 예상손실", val: formatSignedWon(totalNetBenefit) }
    ],
    lossComparison: {
      lossLabel: "기존 유지 (3년)",
      lossValueText: `${(oldFee * 36).toLocaleString()}원`,
      optLabel: `신규 이동 (사은품 ${cashGiftMan}만)`,
      optValueText: `${Math.max(0, newFee * 36 - immediateNetWon).toLocaleString()}원`,
      savingBadge: totalNetBenefit >= 0
        ? `총 +${totalNetBenefit.toLocaleString()}원 순수익`
        : `만기 후 +${(cashGiftMan * 10000).toLocaleString()}원 혜택`,
      optPercent: oldFee > 0
        ? Math.max(20, Math.min(92, Math.round((Math.max(0, newFee * 36 - immediateNetWon) / (oldFee * 36)) * 100)))
        : 60
    },
    zeroFeelFraming: {
      badge: "🔥 위약금 상쇄 후 현금 흑자",
      callout: totalNetBenefit >= 0
        ? `위약금 ${penaltyMan}만 원 내고도 총 +${totalNetBenefit.toLocaleString()}원 현금 이득!`
        : "공유기 임대료(15.8만 원) 면제 시 장비 체감가 0원!",
      ctaHighlight: `최대 +${cashGiftMan}만 원 혜택 확인 ↗`
    },
    impulseItem: {
      badge: "📱 4,400원 반값유심 1위",
      title: "알뜰폰 3사 공용 NFC 무약정 유심칩",
      sub: "5분 셀프개통으로 매달 통신비 -3만원 절약",
      coupangKw: "알뜰폰 공용 NFC 유심칩 바로배송",
      btnLabel: "🛒 4,400원 반값 유심칩 로켓배송 ↗"
    },
    actionItems: [
      {
        icon: "📡",
        stepTag: "임대료 0원",
        label: `ipTIME 와이파이6 공유기 AX3000`,
        calcVal: `통신사 임대료 3년 15.8만 원 평생 면제`,
        coupangKw: "ipTIME 와이파이6 공유기 AX3000 메쉬",
        coupangBtn: "🚀 와이파이6 공유기 ↗",
        lpMerchant: "himart",
        lpUrl: "https://www.e-himart.co.kr/app/search/totalSearch?query=%EA%B8%B0%EA%B0%80%20%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0",
        lpBtn: "🏷️ 하이마트 특가 ↗"
      },
      {
        icon: "🧹",
        stepTag: "3분 선정리",
        label: `TV 뒷면 셋톱박스 무타공 정리함`,
        calcVal: `개통 당일 타공 없이 깔끔 정리`,
        coupangKw: "셋톱박스 공유기 무타공 정리함 거치대 CAT8 랜선",
        coupangBtn: "🚀 무타공 정리함 ↗",
        lpMerchant: "lotteon",
        lpUrl: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EC%85%8B%ED%86%B1%EB%B0%95%EC%8A%A4%20%EA%B3%B5%EC%9C%A0%EA%B8%B0%20%EC%A0%95%EB%A6%AC%ED%95%A8",
        lpBtn: "🏷️ 롯데ON 특가 ↗"
      },
      {
        icon: "📱",
        stepTag: "통신비 반값",
        label: `알뜰폰 무약정 NFC 유심칩`,
        calcVal: `휴대폰 요금 매달 -3만 원 추가 절약`,
        coupangKw: "알뜰폰 무약정 공용 유심칩 NFC 바로배송",
        coupangBtn: "🚀 반값 유심칩 ↗",
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0%20%EC%9E%90%EA%B8%89%EC%A0%9C",
        lpBtn: "🏷️ 지마켓 특가 ↗"
      }
    ],
    summary,
    cpaTitle: totalNetBenefit >= 0
      ? `위약금 ${penaltyMan}만 원 방어 + 현금 사은품 ${cashGiftMan}만 원 당일 입금`
      : `위약금 부담 없는 최저 요금제 & 사은품 맞춤 비교`,
    cpaPayout: "55,000원",
    cpaKey: "telecom_internet_switch",
    cpaBenefit: `${Math.abs(totalNetBenefit)}`,
    products: [
      {
        icon: "📡",
        title: "ipTIME 기가 와이파이6 공유기 AX3000",
        kw: "와이파이6 공유기 AX3000",
        type: "coupang",
        badge: "📡 임대료 0원",
        calcMatchTag: `📡 공유기 임대료 3년 15.8만 원 절약`,
        matchReason: `월 4,400원 임대료 없이 평생 무료 기가 와이파이`,
        ctaText: "와이파이6 공유기 최저가 →"
      },
      {
        icon: "🧹",
        title: "코멧 TV 뒷면 셋톱박스 무타공 정리함",
        kw: "셋톱박스 공유기 정리함",
        type: "coupang",
        badge: "🧹 3분 정리",
        calcMatchTag: `🧹 월 ${newFee.toLocaleString()}원 신규 개통 필수템`,
        matchReason: `벽면 타공 없이 TV 뒤에 셋톱박스 깔끔 수납`,
        ctaText: "무타공 정리함 최저가 →"
      },
      {
        icon: "💳",
        title: "하이마트 와이파이6 공유기 할인전",
        merchant: "himart",
        merchantLabel: "롯데하이마트",
        url: "https://www.e-himart.co.kr/app/search/totalSearch?query=%EA%B8%B0%EA%B0%80%20%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0",
        type: "linkprice",
        badge: "💳 즉시할인",
        calcMatchTag: `💰 3년 순수익 ${formatSignedWon(totalNetBenefit)}`,
        matchReason: `음영지역 없는 기가 와이파이 최저가 세팅`,
        ctaText: "하이마트 공유기 특가 →"
      },
      {
        icon: "🔥",
        title: "지마켓 알뜰폰 유심·자급제 특가전",
        merchant: "gmarket",
        merchantLabel: "지마켓",
        url: "https://www.gmarket.co.kr/n/search?keyword=%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0%20%EC%9E%90%EA%B8%89%EC%A0%9C",
        type: "linkprice",
        badge: "🔥 반값 요금",
        calcMatchTag: `📉 3년 요금 ${formatSignedManWon(threeYearFeeSaveMan)} 절감`,
        matchReason: `인터넷+알뜰폰 결합으로 통신비 50% 감축`,
        ctaText: "지마켓 알뜰폰 특가 →"
      }
    ]
  };
}

/**
 * 6대 계산기 UI 및 입력 스펙 정의 (토스·노써치 스타일 큰 글씨 · 초단문 라벨)
 */
const CALCULATORS = {
  electric: {
    id: "electric",
    title: "⚡ 전기세·1등급 본전 계산기",
    subtitle: "월 추가 전기세 · 1등급 회수기간",
    calculate: calculateElectric,
    inputs: [
      { id: "wattage", label: "소비전력 (W)", type: "number", value: 1800, min: 50, max: 5000 },
      { id: "hours", label: "하루 사용 (시간)", type: "number", value: 10, min: 1, max: 24 },
      { id: "baseKwh", label: "기본 사용량 (kWh)", type: "number", value: 250, min: 50, max: 1000 },
      { id: "newPrice", label: "1등급 기기값 (원)", type: "number", value: 850000, min: 100000, max: 5000000 },
      { id: "isSummer", label: "여름철(7~8월) 누진 완화", type: "checkbox", value: false }
    ]
  },
  diet: {
    id: "diet",
    title: "🍗 식단·닭가슴살 수량 계산기",
    subtitle: "하루 칼로리 · 닭가슴살·현미밥 수량",
    calculate: calculateDiet,
    inputs: [
      { id: "weight", label: "체중 (kg)", type: "number", value: 78, min: 35, max: 180 },
      { id: "height", label: "키 (cm)", type: "number", value: 175, min: 130, max: 210 },
      { id: "weeks", label: "식단 기간 (주)", type: "number", value: 4, min: 1, max: 12 },
      { id: "deficit", label: "칼로리 조절 (감량 -500)", type: "number", value: -500, min: -1000, max: 1000 },
      { id: "gender", label: "성별", type: "select", value: "male", options: [{ label: "남성", value: "male" }, { label: "여성", value: "female" }] }
    ]
  },
  pet: {
    id: "pet",
    title: "🐶 사료 급여량·소진일 계산기",
    subtitle: "하루 권장 사료량(g) · 포대 소진일",
    calculate: calculatePet,
    inputs: [
      { id: "petWeight", label: "아이 체중 (kg)", type: "number", value: 5.0, min: 0.5, max: 60, step: 0.1 },
      { id: "factor", label: "활동 계수 (성견 1.6 · 묘 1.2)", type: "number", value: 1.6, min: 0.8, max: 3.5, step: 0.1 },
      { id: "kcalPerKg", label: "사료 칼로리 (kcal/kg)", type: "number", value: 3650, min: 2500, max: 4800 },
      { id: "bagKg", label: "사료 1포대 무게 (kg)", type: "number", value: 2.0, min: 0.5, max: 20, step: 0.5 }
    ]
  },
  room: {
    id: "room",
    title: "🛋️ 자취·신혼 가전 예산 계산기",
    subtitle: "예산 초과 0원! 5대 가전·가구 배분",
    calculate: calculateRoom,
    inputs: [
      { id: "budgetMan", label: "총 예산 (만 원)", type: "number", value: 150, min: 50, max: 2000 },
      { id: "roomSize", label: "방 평수 (평)", type: "number", value: 7, min: 4, max: 50 },
      { id: "priority", label: "우선순위 스타일", type: "select", value: "가성비", options: [
        { label: "가성비 균형형", value: "가성비" },
        { label: "가전 집중형", value: "가전 집중" },
        { label: "화이트 감성형", value: "화이트 감성" }
      ]}
    ]
  },
  auto: {
    id: "auto",
    title: "🚗 장기렌트 vs 할부 비교기",
    subtitle: "취등록세·보험·절세 합산 실지출 비교",
    calculate: calculateAuto,
    inputs: [
      { id: "carPriceMan", label: "차량 가격 (만 원)", type: "number", value: 3500, min: 1500, max: 15000 },
      { id: "months", label: "계약 기간 (개월)", type: "number", value: 48, min: 24, max: 60 },
      { id: "taxRate", label: "소득세율 (%, 직장인 0)", type: "number", value: 24, min: 0, max: 45 },
      { id: "downPaymentRate", label: "선납금 비율 (%)", type: "number", value: 20, min: 0, max: 50 },
      { id: "interestRate", label: "할부 금리 (연 %)", type: "number", value: 5.5, min: 2.0, max: 12.0, step: 0.1 },
      { id: "driverAge", label: "운전자 연령", type: "select", value: "over26", options: [
        { label: "만 26세 이상", value: "over26" },
        { label: "만 21~25세", value: "under26" },
        { label: "만 35세 이상 무사고", value: "over35" }
      ]}
    ]
  },
  telecom: {
    id: "telecom",
    title: "🌐 인터넷 위약금·사은품 계산기",
    subtitle: "위약금 vs 현금 47만 원 갈아타기 손익",
    calculate: calculateTelecom,
    inputs: [
      { id: "penaltyMan", label: "현재 위약금 (만 원)", type: "number", value: 15, min: 0, max: 60 },
      { id: "oldFee", label: "기존 월 요금 (원)", type: "number", value: 46000, min: 15000, max: 100000 },
      { id: "newFee", label: "신규 월 요금 (원)", type: "number", value: 38500, min: 15000, max: 100000 },
      { id: "cashGiftMan", label: "현금 사은품 (만 원, 최대 47)", type: "number", value: 47, min: 10, max: 47 }
    ]
  }
};

// Universal Module Definition
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calcKepcoBill,
    calculateElectric,
    calculateDiet,
    calculatePet,
    calculateRoom,
    calculateAuto,
    calculateTelecom,
    CALCULATORS
  };
}

if (typeof window !== "undefined") {
  window.MoneyFitCalculators = {
    calcKepcoBill,
    calculateElectric,
    calculateDiet,
    calculatePet,
    calculateRoom,
    calculateAuto,
    calculateTelecom,
    CALCULATORS
  };
  window.CALCULATORS = CALCULATORS;
  window.calculateElectric = calculateElectric;
  window.calculateDiet = calculateDiet;
  window.calculatePet = calculatePet;
  window.calculateRoom = calculateRoom;
  window.calculateAuto = calculateAuto;
  window.calculateTelecom = calculateTelecom;
}
