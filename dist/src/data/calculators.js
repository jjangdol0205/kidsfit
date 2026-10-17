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
    ? `가전 미가동 상태 (기본 전기세 ${beforeBill.toLocaleString()}원 유지)`
    : `이번 달 추가 전기세 +${addedBill.toLocaleString()}원 (총 ${afterBill.toLocaleString()}원)`;

  const summary = isZeroUsage || addedKwh === 0
    ? `가전을 가동하지 않아 추가 전력소비가 발생하지 않습니다. 월 기본 사용량 ${baseKwh}kWh 기준 예상 전기요금은 ${beforeBill.toLocaleString()}원입니다.`
    : `현재 구형 가전(${wattage}W)을 하루 ${hours}시간 틀면 총 ${totalKwh}kWh로 전기요금이 급증합니다. 에너지 1등급 인버터 모델로 교체 시 매달 ${monthlySaving.toLocaleString()}원을 아껴 약 ${paybackMonths}개월 만에 기기값을 100% 회수합니다!`;

  // 입력 전력(W) 및 계절에 따른 가전 종류 1:1 자동 판별
  let targetApplianceName = "1등급 인버터 에어컨";
  let targetApplianceIcon = "❄️";
  let targetCoupangKw = "에너지소비효율 1등급 인버터 에어컨 로켓설치";
  let subHelperName = "무소음 에어서큘레이터 (냉방효율 +35%)";
  let subHelperKw = "BLDC 무소음 에어서큘레이터";
  let himartQuery = "%EC%97%90%EB%84%88%EC%A7%80%201%EB%93%B1%EA%B8%89%20%EC%9D%B8%EB%B2%84%ED%84%B0%20%EC%97%90%EC%96%B4%EC%BB%A8";

  if (wattage > 0 && wattage <= 480) {
    targetApplianceName = "1등급 듀얼 인버터 제습기";
    targetApplianceIcon = "💧";
    targetCoupangKw = "에너지소비효율 1등급 인버터 제습기";
    subHelperName = "옷장·욕실 습기제거제 대용량 세트";
    subHelperKw = "습기제거제 대용량 제습제";
    himartQuery = "1%EB%93%B1%EA%B8%89%20%EC%9D%B8%EB%B2%84%ED%84%B0%20%EC%A0%9C%EC%8A%B5%EA%B8%B0";
  } else if (!isSummer && wattage >= 1100 && wattage <= 1650 && hours <= 5) {
    targetApplianceName = "1등급 인버터 히트펌프 의류건조기";
    targetApplianceIcon = "👕";
    targetCoupangKw = "에너지소비효율 1등급 인버터 의류건조기 로켓설치";
    subHelperName = "건조기 시간 30% 단축 양모 드라이어볼";
    subHelperKw = "건조기 양모볼 드라이어볼";
    himartQuery = "1%EB%93%B1%EA%B8%89%20%EC%9D%98%EB%A5%98%EA%B1%B4%EC%A1%B0%EA%B8%B0";
  } else if (!isSummer && wattage >= 1700) {
    targetApplianceName = "저전력 PTC 난방기 · 1등급 카본매트";
    targetApplianceIcon = "🔥";
    targetCoupangKw = "저전력 카본매트 온수매트 1등급 난방기";
    subHelperName = "창문 외풍차단 방풍비닐·문풍지 단열세트";
    subHelperKw = "창문 방풍비닐 외풍차단 문풍지";
    himartQuery = "%EC%B9%B4%EB%B3%B8%EB%A7%A4%ED%8A%B8%20%EC%98%A8%EC%88%98%EB%A7%A4%ED%8A%B8";
  } else if (wattage >= 1500) {
    targetApplianceName = "1등급 2in1 멀티 인버터 스탠드 에어컨";
    targetApplianceIcon = "❄️";
    targetCoupangKw = "에너지소비효율 1등급 2in1 인버터 에어컨 로켓설치";
  } else {
    targetApplianceName = "원룸·침실 1등급 무풍 인버터 벽걸이 에어컨";
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
      { label: "월 추가 전력량", val: isZeroUsage || addedKwh === 0 ? "0 kWh" : `+${addedKwh} kWh` },
      { label: "1등급 교체 월 절감", val: isZeroUsage || addedKwh === 0 ? "0원" : `-${monthlySaving.toLocaleString()}원` },
      { label: "기기값 본전 회수", val: paybackMonths > 0 ? `${paybackMonths}개월` : "미가동" }
    ],
    lossComparison: {
      lossLabel: "구형 가전 방치 시 월 전기세",
      lossValueText: `${afterBill.toLocaleString()}원`,
      optLabel: "1등급 인버터 교체 시 월 전기세",
      optValueText: `${inverterBill.toLocaleString()}원`,
      savingBadge: isZeroUsage || addedKwh === 0
        ? "가전 미가동 상태"
        : `월 ${monthlySaving.toLocaleString()}원 · 연 ${(monthlySaving * 12).toLocaleString()}원 절약`,
      optPercent: afterBill > 0 ? Math.max(18, Math.min(92, Math.round((inverterBill / afterBill) * 100))) : 50
    },
    actionItems: [
      {
        icon: targetApplianceIcon,
        stepTag: "1순위 본전처방",
        label: `${wattage}W 구형 → ${targetApplianceName} 교체`,
        calcVal: `월 -${monthlySaving.toLocaleString()}원 절감 · ${paybackMonths}개월 만에 ${priceManText}만원 본전 회수`,
        coupangKw: targetCoupangKw,
        coupangBtn: `🚀 ${priceManText}만원대 로켓설치 최저가 ↗`,
        lpMerchant: "himart",
        lpUrl: `https://www.e-himart.co.kr/app/search/totalSearch?query=${himartQuery}`,
        lpBtn: "🏷️ 하이마트 1등급 환급전 ↗"
      },
      {
        icon: "⚡",
        stepTag: "2순위 누진방어",
        label: `월 총 ${totalKwh}kWh 누진세 구간 실시간 차단 플러그`,
        calcVal: `추가 전기세 +${addedBill.toLocaleString()}원 주범 대기전력·과전류 원격 차단`,
        coupangKw: "스마트 플러그 실시간 전력측정기 타이머",
        coupangBtn: "🚀 전력측정 스마트플러그 ↗",
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=%EC%8A%A4%EB%A7%88%ED%8A%B8%ED%94%8C%EB%9F%AC%EA%B7%B8%20%EC%A0%84%EB%A0%A5%EC%B8%A1%EC%A0%95",
        lpBtn: "🏷️ 지마켓 절전탭 특가 ↗"
      },
      {
        icon: "🌀",
        stepTag: "3순위 가동단축",
        label: `하루 ${hours}시간 가동 → 체감효율 2배 ${subHelperName}`,
        calcVal: `실외기·열선 가동시간 30% 단축으로 매달 추가 요금 방어`,
        coupangKw: subHelperKw,
        coupangBtn: "🚀 쿠팡 로켓배송 최저가 ↗",
        lpMerchant: "lotteon",
        lpUrl: `https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=${encodeURIComponent(subHelperKw)}`,
        lpBtn: "🏷️ 롯데ON 특가 보기 ↗"
      }
    ],
    summary,
    cpaTitle: `초기비용 0원! 에너지 1등급 가전 렌탈 & 정부 환급금 조회 (월 ${monthlySaving.toLocaleString()}원 절감)`,
    cpaPayout: "35,000원",
    cpaKey: "electric_grade1_rental",
    cpaBenefit: `${monthlySaving}`,
    products: [
      {
        icon: targetApplianceIcon,
        title: `${targetApplianceName} (${priceManText}만 원대 추천)`,
        kw: targetCoupangKw,
        type: "coupang",
        badge: "🚀 내일 도착 · 로켓설치",
        calcMatchTag: `⚡ 내 계산 연동: 월 ${monthlySaving.toLocaleString()}원 절감 (${paybackMonths}개월 본전)`,
        matchReason: `현재 ${wattage}W 가전(월 ${afterBill.toLocaleString()}원)을 인버터(${inverterBill.toLocaleString()}원)로 낮추는 핵심 처방`,
        ctaText: `월 ${monthlySaving.toLocaleString()}원 아끼는 1등급 특가 확인 →`
      },
      {
        icon: "🔌",
        title: `티피링크 스마트 플러그 실시간 전력측정기 (${wattage}W 감시용)`,
        kw: "스마트 플러그 전력측정기",
        type: "coupang",
        badge: "⚡ 누진세 방어 필수템",
        calcMatchTag: `⚡ 내 계산 연동: 월 +${addedKwh}kWh 추가전력 실시간 측정`,
        matchReason: `우리 집 누적 ${totalKwh}kWh 누진세 폭탄 구간 진입 전 스마트폰 알림 및 자동 전원 차단`,
        ctaText: "실시간 전기세 측정 플러그 최저가 →"
      },
      {
        icon: "🏅",
        title: `롯데하이마트 ${targetApplianceName} 으뜸효율 기획전`,
        merchant: "himart",
        merchantLabel: "롯데하이마트",
        url: `https://www.e-himart.co.kr/app/search/totalSearch?query=${himartQuery}`,
        type: "linkprice",
        badge: "💳 카드 할인 · 환급",
        calcMatchTag: `⚡ 내 계산 연동: 연 ${(monthlySaving * 12).toLocaleString()}원 전기세 세이브`,
        matchReason: `공식몰 카드 청구할인 + 에너지 1등급 으뜸효율 환급 대상 모델 한눈에 비교`,
        ctaText: "하이마트 1등급 공식 혜택 비교 →"
      },
      {
        icon: "🌀",
        title: `지마켓 ${subHelperName} · 고효율 절전가전 베스트`,
        merchant: "gmarket",
        merchantLabel: "지마켓",
        url: `https://www.gmarket.co.kr/n/search?keyword=${encodeURIComponent(targetCoupangKw)}`,
        type: "linkprice",
        badge: "🔥 냉·난방 효율 2배",
        calcMatchTag: `⚡ 내 계산 연동: 하루 ${hours}시간 가동 부담 완화`,
        matchReason: `에어컨·난방기 단독 가동 대비 전력 소모를 최대 35% 줄여주는 필수 조합`,
        ctaText: "지마켓 절전가전 베스트 특가 →"
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

  const badge = `🔥 ${weeks}주 맞춤 식단 BOM 산출 완료`;
  const headline = `일일 ${targetKcal.toLocaleString()}kcal 권장 · ${weeks}주 닭가슴살 총 ${chickenPacks}팩 필요!`;
  const summary = `목표 달성을 위해 앞으로 ${weeks}주(${days}일) 동안 닭가슴살 100g ${chickenPacks}팩, 즉석 현미밥 ${brownRiceBowls}개, WPI 프로틴 파우더 ${proteinTubs}통을 구비하시면 가장 저렴하고 정확하게 식단을 완주할 수 있습니다. (일일 영양성분: 탄수화물 ${dailyCarbG}g, 단백질 ${dailyProteinG}g, 지방 ${dailyFatG}g)`;

  const dietSavingWon = chickenPacks * 1650 + brownRiceBowls * 1150;
  const goalModeLabel = deficit >= 0 ? "벌크업·근성장을 위한" : "체지방 컷팅을 위한";

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
      { label: "일일 탄·단·지(g)", val: `${dailyCarbG} / ${dailyProteinG} / ${dailyFatG}g` },
      { label: `${weeks}주 닭가슴살(100g)`, val: `총 ${chickenPacks}팩` },
      { label: `${weeks}주 즉석 현미밥`, val: `총 ${brownRiceBowls}개` }
    ],
    lossComparison: {
      lossLabel: `편의점·배달 단품 구매 시 (${weeks}주)`,
      lossValueText: `약 ${(chickenPacks * 2900 + brownRiceBowls * 2200).toLocaleString()}원`,
      optLabel: `대용량 묶음 장보기 특가 (${weeks}주)`,
      optValueText: `약 ${(chickenPacks * 1250 + brownRiceBowls * 1050).toLocaleString()}원`,
      savingBadge: `${weeks}주 식단비 약 ${dietSavingWon.toLocaleString()}원 절약 (-54%)`,
      optPercent: 46
    },
    actionItems: [
      {
        icon: "🍗",
        stepTag: "단백질 정량",
        label: `[일일 단백질 ${dailyProteinG}g] 닭가슴살 100g 대용량 묶음`,
        calcVal: `${weeks}주(${days}일) 총 ${chickenPacks}팩 필수 · 팩당 1,200원대 특가`,
        coupangKw: "냉동 닭가슴살 100g 대용량 패키지",
        coupangBtn: `🚀 닭가슴살 ${chickenPacks}팩 로켓프레시 ↗`,
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=%EB%83%89%EB%8F%99%20%EB%8B%AD%EA%B0%80%EC%8A%B4%EC%82%B4%20100g%20%EB%8C%80%EC%9A%A9%EB%9F%89",
        lpBtn: "🏷️ 지마켓 묶음특가 ↗"
      },
      {
        icon: "🍚",
        stepTag: "탄수화물 정량",
        label: `[일일 탄수화물 ${dailyCarbG}g] 저당 즉석 현미밥·곤약밥`,
        calcVal: `${weeks}주(${days}일) 총 ${brownRiceBowls}개 필수 (1일 2공기 기준)`,
        coupangKw: "즉석 현미밥 곤약밥 대용량 박스",
        coupangBtn: `🚀 현미밥 ${brownRiceBowls}개 박스 최저가 ↗`,
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=%EC%A6%89%EC%84%9D%20%ED%98%84%EB%AF%B8%EB%B0%A5%20%EB%8C%80%EC%9A%A9%EB%9F%89%20%EB%B0%95%EC%8A%A4",
        lpBtn: "🏷️ 지마켓 박스할인 ↗"
      },
      {
        icon: "💪",
        stepTag: "근손실 방어",
        label: `[운동 직후 1스쿱] WPI 분리유청 프로틴 보충제`,
        calcVal: `${weeks}주 총 ${proteinTubs}통 (${weight}kg 체중 단백질 나머지 35% 보충)`,
        coupangKw: "WPI 분리유청단백질 프로틴 파우더",
        coupangBtn: `🚀 WPI 프로틴 ${proteinTubs}통 로켓배송 ↗`,
        lpMerchant: "lotteon",
        lpUrl: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EB%B6%84%EB%A6%AC%EC%9C%A0%EC%B2%AD%EB%8B%A8%EB%B0%B1%EC%A7%88%20WPI",
        lpBtn: "🏷️ 롯데ON 공식몰 특가 ↗"
      }
    ],
    summary,
    cpaTitle: `혼자 빼기 힘들다면? ${weeks}주 책임 감량 1:1 체질 맞춤 다이어트 무료 진단`,
    cpaPayout: "45,000원",
    cpaKey: "diet_custom_consulting",
    cpaBenefit: `${chickenPacks}팩`,
    products: [
      {
        icon: "🍗",
        title: `하림·곰곰 냉동 닭가슴살 100g (${chickenPacks}팩 맞춤 구성)`,
        kw: "냉동 닭가슴살 100g 대용량 패키지",
        type: "coupang",
        badge: "❄️ 로켓프레시 새벽도착",
        calcMatchTag: `🍗 내 계산 연동: ${weeks}주 총 ${chickenPacks}팩 (일일 단백질 ${dailyProteinG}g)`,
        matchReason: `${weight}kg 체중의 ${goalModeLabel} 일일 단백질 요구량 65%를 가장 저렴하게 채우는 필수 수량`,
        ctaText: `닭가슴살 ${chickenPacks}팩 묶음 최저가 보기 →`
      },
      {
        icon: "🍚",
        title: `곰곰·오뚜기 즉석 현미밥·곤약밥 (${brownRiceBowls}개입 대용량 박스)`,
        kw: "즉석 현미밥 대용량 박스",
        type: "coupang",
        badge: "📦 대용량 박스 할인가",
        calcMatchTag: `🍚 내 계산 연동: ${weeks}주 총 ${brownRiceBowls}개 (일일 탄수 ${dailyCarbG}g)`,
        matchReason: `일일 목표 ${targetKcal.toLocaleString()}kcal 달성을 위해 혈당 스파이크 없이 하루 2끼 섭취할 정확한 수량`,
        ctaText: `현미밥 ${brownRiceBowls}개입 박스 특가 확인 →`
      },
      {
        icon: "💪",
        title: `롯데ON WPI 분리유청 프로틴 보충제 (${proteinTubs}통 공식특가)`,
        merchant: "lotteon",
        merchantLabel: "롯데ON",
        url: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EB%B6%84%EB%A6%AC%EC%9C%A0%EC%B2%AD%EB%8B%A8%EB%B0%B1%EC%A7%88%20WPI",
        type: "linkprice",
        badge: `💪 ${proteinTubs}통 공식몰 특가`,
        calcMatchTag: `💪 내 계산 연동: ${weeks}주 ${proteinTubs}통 (하루 1스쿱 30g)`,
        matchReason: `닭가슴살만으로 부족한 일일 단백질(${dailyProteinG}g)의 나머지 35%를 운동 직후 즉시 흡수`,
        ctaText: `WPI 프로틴 ${proteinTubs}통 최저가 비교 →`
      },
      {
        icon: "🥗",
        title: `지마켓 닭가슴살 ${chickenPacks}팩 + 현미밥 ${brownRiceBowls}개 올인원 기획전`,
        merchant: "gmarket",
        merchantLabel: "지마켓",
        url: "https://www.gmarket.co.kr/n/search?keyword=%EB%83%89%EB%8F%99%20%EB%8B%AD%EA%B0%80%EC%8A%B4%EC%82%B4%20%EB%8C%80%EC%9A%A9%EB%9F%89%20%ED%98%84%EB%AF%B8%EB%B0%A5",
        type: "linkprice",
        badge: "🏷️ 스마일배송 묶음할인",
        calcMatchTag: `💰 내 계산 연동: 편의점 대비 ${dietSavingWon.toLocaleString()}원 절약`,
        matchReason: `${weeks}주 식단 장보기 품목을 한 번에 묶음 배송받아 식비를 54% 아끼는 가성비 루트`,
        ctaText: "지마켓 식단 대용량 묶음할인 보기 →"
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

  const badge = "🐾 수의영양학 RER/DER 정밀 계산";
  const headline = `하루 권장 급여량 ${dailyGrams}g (종이컵 ${cupsPerDay}컵) · ${daysPerBag}일 만에 소진!`;
  const summary = `${petWeight}kg 반려동물의 하루 적정 사료량은 ${dailyGrams}g입니다. ${bagKg}kg 사료 구매 시 정확히 ${daysPerBag}일 뒤 떨어지므로 미리 정기배송이나 대용량 포대를 준비하시는 것이 유리합니다.`;

  // 생애주기 계수(factor) 및 체중(petWeight)에 따른 맞춤형 사료/케어 품목 자동 매칭
  let petStageLabel = `${petWeight}kg 성견 맞춤`;
  let feedTitle = `${petWeight}kg 맞춤 로얄캐닌 가수분해 알러지 사료 (${bagKg}kg)`;
  let feedCoupangKw = `강아지 가수분해 사료 로얄캐닌 ${bagKg}kg`;
  let careTitle = "하림펫푸드 슬개골·관절·유산균 영양제";
  let careKw = "강아지 슬개골 관절 영양제 유산균";

  if (factor <= 1.25 && petWeight <= 8) {
    petStageLabel = `${petWeight}kg 반려묘·시니어 맞춤`;
    feedTitle = `${petWeight}kg 고양이·시니어 체중조절 인도어 사료 (${bagKg}kg)`;
    feedCoupangKw = "로얄캐닌 인도어 고양이 사료 체중조절";
    careTitle = "고양이 신장·헤어볼·유산균 & 두부모래 세트";
    careKw = "고양이 신장 영양제 유산균 두부모래";
  } else if (factor >= 2.0) {
    petStageLabel = `${petWeight}kg 퍼피(자견) 면역 맞춤`;
    feedTitle = `${petWeight}kg 퍼피 고단백 면역 사료 로얄캐닌 미니 인도어 퍼피 (${bagKg}kg)`;
    feedCoupangKw = "로얄캐닌 미니 인도어 퍼피 강아지 사료";
    careTitle = "퍼피 초유 면역·장건강 유산균 영양제";
    careKw = "강아지 퍼피 유산균 초유 영양제";
  } else if (petWeight >= 15) {
    petStageLabel = `${petWeight}kg 대형견 맞춤`;
    feedTitle = `${petWeight}kg 대형견 대용량 지퍼백 사료 (${bagKg}kg 포대)`;
    feedCoupangKw = "대형견 대용량 사료 12kg 로얄캐닌";
    careTitle = "대형견 고관절·슬개골 고함량 콘드로이친 영양제";
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
      { label: "일일 필요 에너지", val: `${der} kcal` },
      { label: "하루 급여량(1회)", val: `${dailyGrams}g (${halfGrams}g)` },
      { label: `${bagKg}kg 1포대 소진일`, val: `약 ${daysPerBag}일` }
    ],
    lossComparison: {
      lossLabel: "눈대중 자율배식·비만 방치 시 수술비",
      lossValueText: "평균 180만 원+",
      optLabel: `${dailyGrams}g 정량 급여 + 펫보험·특가 케어`,
      optValueText: `월 약 ${Math.max(25000, Math.round((dailyGrams * 30 / 1000) * 14000)).toLocaleString()}원`,
      savingBadge: "슬개골·대사질환 병원비 및 사료 낭비 85% 방어",
      optPercent: 22
    },
    actionItems: [
      {
        icon: "🐾",
        stepTag: "사료 정량",
        label: `[${petStageLabel}] ${bagKg}kg 사료 포대 (${daysPerBag}일분)`,
        calcVal: `하루 ${dailyGrams}g 급여 시 정확히 ${daysPerBag}일 소진 · 품절 전 정기배송`,
        coupangKw: feedCoupangKw,
        coupangBtn: `🚀 ${bagKg}kg 사료 로켓배송 최저가 ↗`,
        lpMerchant: "gmarket",
        lpUrl: `https://www.gmarket.co.kr/n/search?keyword=${encodeURIComponent(feedCoupangKw)}`,
        lpBtn: "🏷️ 지마켓 사료 특가 ↗"
      },
      {
        icon: "🥄",
        stepTag: "1끼 계량필수",
        label: `[1끼 ${halfGrams}g 정밀 계량] 디지털 전자저울 사료스푼`,
        calcVal: `종이컵(${cupsPerDay}컵) 눈대중 과급여로 인한 비만·관절병 원천 차단`,
        coupangKw: "강아지 고양이 디지털 전자저울 사료스푼 자동급식기",
        coupangBtn: `🚀 1끼 ${halfGrams}g 정밀 계량스푼 ↗`,
        lpMerchant: "lotteon",
        lpUrl: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EB%B0%98%EB%A0%A4%EB%8F%99%EB%AC%BC%20%EC%82%AC%EB%A3%8C%20%EC%A0%84%EC%9E%90%EC%A0%80%EC%9A%B8%20%EC%8A%A4%ED%91%BC",
        lpBtn: "🏷️ 롯데ON 급식기 특가 ↗"
      },
      {
        icon: "🏥",
        stepTag: "병원비 방어",
        label: `[${petWeight}kg 맞춤 예방] ${careTitle}`,
        calcVal: `일일 ${der}kcal 대사 균형 + 슬개골·신장 수술비(180만원) 사전 예방`,
        coupangKw: careKw,
        coupangBtn: "🚀 수의사 추천 영양제 로켓배송 ↗",
        lpMerchant: "gmarket",
        lpUrl: `https://www.gmarket.co.kr/n/search?keyword=${encodeURIComponent(careKw)}`,
        lpBtn: "🏷️ 지마켓 영양제 기획전 ↗"
      }
    ],
    summary,
    cpaTitle: `슬개골·피부병 병원비 평균 180만 원! ${petWeight}kg 우리 아이 펫보험 90% 보장 최저가 비교`,
    cpaPayout: "35,000원",
    cpaKey: "pet_insurance_compare",
    cpaBenefit: `${dailyGrams}g`,
    products: [
      {
        icon: "🐾",
        title: feedTitle,
        kw: feedCoupangKw,
        type: "coupang",
        badge: `🐾 정확히 ${daysPerBag}일분 로켓배송`,
        calcMatchTag: `🐾 내 계산 연동: 하루 ${dailyGrams}g × ${daysPerBag}일분 (${bagKg}kg)`,
        matchReason: `${petWeight}kg 체중(일일 ${der}kcal) 아이가 ${daysPerBag}일 동안 신선하게 먹을 수 있는 맞춤 용량`,
        ctaText: `${bagKg}kg 사료(${daysPerBag}일분) 최저가 보기 →`
      },
      {
        icon: "🥄",
        title: `1g 정밀 디지털 사료 계량스푼 · 스마트 자동급식기 (1끼 ${halfGrams}g 세팅)`,
        kw: "강아지 고양이 디지털 전자저울 사료스푼 자동급식기",
        type: "coupang",
        badge: "⚖️ 과급여 비만 0% 차단",
        calcMatchTag: `🥄 내 계산 연동: 아침 ${halfGrams}g · 저녁 ${halfGrams}g 정량 배식`,
        matchReason: `종이컵(${cupsPerDay}컵) 눈대중 급여로 인한 체중 증가와 관절 무리를 막아주는 필수 계량템`,
        ctaText: `1끼 ${halfGrams}g 정량 계량스푼·급식기 →`
      },
      {
        icon: "🏥",
        title: `지마켓 ${careTitle} 공식 할인전`,
        merchant: "gmarket",
        merchantLabel: "지마켓",
        url: `https://www.gmarket.co.kr/n/search?keyword=${encodeURIComponent(careKw)}`,
        type: "linkprice",
        badge: "💳 스마일클럽 특가",
        calcMatchTag: `🏥 내 계산 연동: ${petWeight}kg 맞춤 관절·대사 케어`,
        matchReason: `평균 180만 원이 넘는 슬개골·신장 병원비를 사료 급여 시 하루 1포로 예방`,
        ctaText: "지마켓 펫 영양제·사료 최저가 →"
      },
      {
        icon: "📦",
        title: `롯데ON ${petStageLabel} 대용량 사료·배변패드·모래 특가`,
        merchant: "lotteon",
        merchantLabel: "롯데ON",
        url: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EA%B0%95%EC%95%84%EC%A7%80%20%EA%B3%A0%EC%96%91%EC%9D%B4%20%EC%82%AC%EB%A3%8C%20%EB%B0%B0%EB%B3%80%ED%8C%A8%EB%93%9C",
        type: "linkprice",
        badge: "📦 반값 생필품 모음",
        calcMatchTag: `💰 내 계산 연동: ${daysPerBag}일 주기 정기 장보기`,
        matchReason: `${daysPerBag}일마다 돌아오는 사료 소진 주기에 맞춰 패드·간식을 묶음 할인가로 구비`,
        ctaText: "롯데ON 반려동물 생필품 특가 →"
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

  // 우선순위 스타일별 황금 가중치 배분 (각각 합산 100%)
  // 1. 가성비: 냉장고 24%, 세탁기 22%, 침대 20%, TV 16%, 소형가전 18%
  // 2. 가전 집중: 냉장고 30%, 세탁기 28%, 침대 15%, TV 15%, 소형가전 12%
  // 3. 화이트 감성: 냉장고 18%, 세탁기 18%, 침대 30%, TV 18%, 소형가전 16%
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
    bedName = "실속형 매트리스+프레임";
    smallName = "고화력 전자레인지+IH밥솥+청소기";
  } else if (priority === "화이트 감성") {
    rRef = 0.18;
    rWash = 0.18;
    rBed = 0.30;
    rTv = 0.18;
    rSmall = 0.16;
    bedName = "화이트 감성 침대프레임+호텔식 매트리스";
    smallName = "화이트 감성 소형가전(토스터·드립포트·청소기)";
  }

  const refWon = Math.floor(budgetWon * rRef);
  const washWon = Math.floor(budgetWon * rWash);
  const bedWon = Math.floor(budgetWon * rBed);
  const tvWon = Math.floor(budgetWon * rTv);
  // 오차 방지: 나머지 금액을 소형가전에 할당하여 정확히 budgetWon 일치 (초과 0원 보장)
  const smallWon = budgetWon - (refWon + washWon + bedWon + tvWon);

  const items = [
    { category: "가전", name: "냉장고/김치냉장고", rate: rRef, cost: refWon },
    { category: "가전", name: "세탁기/건조기", rate: rWash, cost: washWon },
    { category: "가구", name: bedName, rate: rBed, cost: bedWon },
    { category: "가전", name: "스마트TV/모니터", rate: rTv, cost: tvWon },
    { category: "가전", name: smallName, rate: rSmall, cost: smallWon }
  ];

  const totalCost = items.reduce((sum, item) => sum + item.cost, 0);
  // Strict Invariant Check
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

  // 평수 및 스타일별 맞춤 가전/가구 키워드 세밀화
  let refTitle = `${top1}만 원대 무소음 2도어/콤비 냉장고 로켓설치`;
  let refKw = "원룸 자취방 무소음 냉장고 로켓설치";
  let washTitle = `${top2}만 원대 통돌이·드럼 세탁기 로켓설치`;
  let washKw = "원룸 세탁기 로켓설치";
  let bedKw = "지누스 독립스프링 매트리스 침대프레임";

  if (roomSize >= 18 || budgetMan >= 400) {
    refTitle = `${top1}만 원대 비스포크·오브제 4도어 냉장고 로켓설치`;
    refKw = "양문형 4도어 냉장고 로켓설치";
    washTitle = `${top2}만 원대 드럼세탁기·건조기 세트 로켓설치`;
    washKw = "드럼세탁기 건조기 로켓설치";
    bedKw = "퀸 침대프레임 호텔식 독립스프링 매트리스";
  } else if (priority === "화이트 감성") {
    refTitle = `${top1}만 원대 화이트 감성 비스포크·레트로 냉장고`;
    refKw = "화이트 냉장고 로켓설치";
    washTitle = `${top2}만 원대 화이트 드럼·미니 세탁기 로켓설치`;
    washKw = "화이트 드럼세탁기 로켓설치";
    bedKw = "화이트 수납 침대프레임 포켓스프링 매트리스";
  }

  const badge = `🏠 ${roomSize}평 [${priority}] 예산 초과 0원 황금 배분`;
  const headline = `총 ${budgetMan}만 원 풀세팅 견적 (가전 ${Math.round(appliancesTotalWon / 10000)}만 + 가구 ${Math.round(furnitureTotalWon / 10000)}만)`;
  const summary = `${roomSize}평 공간에 총예산 ${budgetMan}만 원 [${priority}] 기준으로 절대 예산이 터지지 않는 황금 비율입니다. 오프라인 매장 대비 온라인 로켓설치·제휴몰 이용 시 약 ${Math.round(savingWon / 10000)}만 원을 즉시 아낄 수 있습니다.`;

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
      { label: "냉장고 적정 예산", val: `${top1}만 원` },
      { label: "세탁기 적정 예산", val: `${top2}만 원` },
      { label: "침대·매트리스 예산", val: `${top3}만 원` }
    ],
    lossComparison: {
      lossLabel: "오프라인 백화점·매장 정가 구매 시",
      lossValueText: `${Math.round((budgetWon + savingWon) / 10000).toLocaleString()}만 원`,
      optLabel: "온라인 로켓설치·특가 황금배분 BOM",
      optValueText: `${budgetMan.toLocaleString()}만 원`,
      savingBadge: `유통 마진 약 ${Math.round(savingWon / 10000).toLocaleString()}만 원 절약 (-22%)`,
      optPercent: 78
    },
    actionItems: [
      {
        icon: "🧊",
        stepTag: `예산 ${Math.round(rRef * 100)}% 배정`,
        label: `[1순위 가전] ${refTitle}`,
        calcVal: `배정 예산 ${top1}만 원 (${refWon.toLocaleString()}원) 이내 무료 로켓설치`,
        coupangKw: refKw,
        coupangBtn: `🚀 ${top1}만 원대 냉장고 로켓설치 ↗`,
        lpMerchant: "lotteon",
        lpUrl: `https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=${encodeURIComponent(refKw)}`,
        lpBtn: "🏷️ 롯데ON 냉장고 특가 ↗"
      },
      {
        icon: "🧺",
        stepTag: `예산 ${Math.round(rWash * 100)}% 배정`,
        label: `[2순위 가전] ${washTitle}`,
        calcVal: `배정 예산 ${top2}만 원 (${washWon.toLocaleString()}원) 이내 수평·배수 무료설치`,
        coupangKw: washKw,
        coupangBtn: `🚀 ${top2}만 원대 세탁기 로켓설치 ↗`,
        lpMerchant: "himart",
        lpUrl: `https://www.e-himart.co.kr/app/search/totalSearch?query=${encodeURIComponent(washKw)}`,
        lpBtn: "🏷️ 하이마트 세탁기 할인 ↗"
      },
      {
        icon: "🛏️",
        stepTag: `예산 ${Math.round(rBed * 100)}% 배정`,
        label: `[3순위 가구] ${top3}만 원대 ${bedName}`,
        calcVal: `배정 예산 ${top3}만 원 (${bedWon.toLocaleString()}원) 이내 ${roomSize}평 맞춤 사이즈`,
        coupangKw: bedKw,
        coupangBtn: `🚀 ${top3}만 원대 침대·매트리스 ↗`,
        lpMerchant: "hmall",
        lpUrl: `https://www.hmall.com/md/pde/search?searchTerm=${encodeURIComponent(bedKw)}`,
        lpBtn: "🏷️ 현대Hmall 가구 특가 ↗"
      },
      {
        icon: "📺",
        stepTag: `예산 ${Math.round(rTv * 100)}% 배정`,
        label: `[4순위 가전] ${top4}만 원대 4K 스마트TV · 삼탠바이미 모니터`,
        calcVal: `배정 예산 ${top4}만 원 (${tvWon.toLocaleString()}원) 이내 넷플릭스·유튜브 직결`,
        coupangKw: "4K 스마트TV 삼탠바이미 이동식 모니터",
        coupangBtn: `🚀 ${top4}만 원대 스마트TV 특가 ↗`,
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=4K%20%EC%8A%A4%EB%A7%88%ED%8A%B8TV%20%EC%9D%B4%EB%8F%99%EC%8B%9D%20%ED%8B%B0%EB%B9%84",
        lpBtn: "🏷️ 지마켓 TV 빅세일 ↗"
      },
      {
        icon: "🍳",
        stepTag: `예산 ${Math.round(rSmall * 100)}% 배정`,
        label: `[5순위 필수] ${top5}만 원대 ${smallName}`,
        calcVal: `잔여 예산 ${top5}만 원 (${smallWon.toLocaleString()}원)으로 필수 소형가전 3종 완비`,
        coupangKw: "자취방 전자레인지 전기밥솥 무선청소기 세트",
        coupangBtn: `🚀 ${top5}만 원대 소형가전 3종 ↗`,
        lpMerchant: "auction",
        lpUrl: "http://browse.auction.co.kr/search?keyword=%EC%A0%84%EC%9E%90%EB%A0%88%EC%9D%B8%EC%A7%80%20%EB%AC%B4%EC%84%A0%EC%B2%AD%EC%86%8C%EA%B8%B0",
        lpBtn: "🏷️ 옥션 소형가전 모음 ↗"
      }
    ],
    summary,
    cpaTitle: `${roomSize}평 맞춤 원룸·포장이사 3초 최저가 비교견적 + 입주청소 특가`,
    cpaPayout: "30,000원",
    cpaKey: "room_moving_quote",
    cpaBenefit: `${budgetMan}만원`,
    products: [
      {
        icon: "🧊",
        title: refTitle,
        kw: refKw,
        type: "coupang",
        badge: "🚛 원하는 날 무료 로켓설치",
        calcMatchTag: `🧊 내 계산 연동: 냉장고 배정 예산 ${top1}만 원 (${Math.round(rRef * 100)}%)`,
        matchReason: `총예산 ${budgetMan}만 원 중 ${top1}만 원 한도 내에서 ${roomSize}평 공간에 딱 들어가는 베스트셀러`,
        ctaText: `예산 ${top1}만원 맞춤 냉장고 특가 →`
      },
      {
        icon: "🛏️",
        title: `${top3}만 원대 ${bedName} 로켓설치`,
        kw: bedKw,
        type: "coupang",
        badge: "🛏️ 호텔식 숙면 베스트",
        calcMatchTag: `🛏️ 내 계산 연동: 침대·가구 배정 예산 ${top3}만 원 (${Math.round(rBed * 100)}%)`,
        matchReason: `[${priority}] 스타일에 맞춰 ${top3}만 원 예산으로 프레임과 매트리스를 한 번에 해결`,
        ctaText: `예산 ${top3}만원 침대·매트리스 →`
      },
      {
        icon: "🛋️",
        title: `현대Hmall ${roomSize}평 [${priority}] 침대·수납가구 기획전`,
        merchant: "hmall",
        merchantLabel: "현대Hmall",
        url: `https://www.hmall.com/md/pde/search?searchTerm=${encodeURIComponent(bedKw)}`,
        type: "linkprice",
        badge: "🏷️ 쿠폰 · 카드청구할인",
        calcMatchTag: `🛋️ 내 계산 연동: 가구 예산 ${top3}만 원 + 유통마진 절감`,
        matchReason: `오프라인 백화점 대비 약 ${Math.round(savingWon / 10000)}만 원을 아끼는 브랜드 가구 온라인 특가`,
        ctaText: `${roomSize}평 맞춤 가구 특가 비교 →`
      },
      {
        icon: "🧺",
        title: `롯데ON 세탁기(${top2}만)·TV(${top4}만)·소형가전(${top5}만) 풀세팅`,
        merchant: "lotteon",
        merchantLabel: "롯데ON",
        url: `https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=${encodeURIComponent(washKw)}`,
        type: "linkprice",
        badge: "⚡ 입주가전 묶음할인",
        calcMatchTag: `🧺 내 계산 연동: 세탁기 ${top2}만 + TV ${top4}만 + 소형 ${top5}만`,
        matchReason: `나머지 가전 예산(${top2 + top4 + top5}만 원)을 초과 없이 한 번에 맞추는 묶음 기획전`,
        ctaText: "롯데ON 입주가전 최저가 비교 →"
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

  // 선납금 비율 (%, 기본 20%)
  const rawDown = toNum(inputs.downPaymentRate, 20);
  const downPaymentRate = rawDown > 1 ? rawDown / 100 : rawDown;
  const financedRate = Math.max(0, 1 - downPaymentRate);

  // 할부 연 금리 (%, 기본 5.5%)
  const interestRate = toNum(inputs.interestRate, 5.5);

  // 운전자 연령 / 경력 계수 (기본 1.0)
  let driverAgeFactor = 1.0;
  if (inputs.driverAge === "under26" || (typeof inputs.driverAge === "number" && inputs.driverAge < 26)) {
    driverAgeFactor = 1.35;
  } else if (inputs.driverAge === "over35" || (typeof inputs.driverAge === "number" && inputs.driverAge >= 35)) {
    driverAgeFactor = 0.90;
  } else if (inputs.driverAgeFactor !== undefined) {
    driverAgeFactor = toNum(inputs.driverAgeFactor, 1.0);
  }

  // 중고차 만기 잔존가치 비율 (36개월 50%, 48개월 45%, 60개월 40% 기준)
  const residualRate = inputs.residualRate !== undefined
    ? toNum(inputs.residualRate, 0.45)
    : (months <= 36 ? 0.50 : (months <= 48 ? 0.45 : 0.40));

  const price = carPriceMan * 10000;
  // 취등록세 (승용차 7%)
  const acqTax = Math.round(price * 0.07);
  // 자동차세 + 개인 자동차보험료 총액
  const insuranceTotal = Math.round(1450000 * driverAgeFactor * (months / 12));
  // 할부 금융 이자 (원금 * 대출비율 * 연금리 * 기간)
  const installmentInterest = Math.round(price * financedRate * (interestRate / 100) * (months / 24));
  // 할부 총지출
  const installmentTco = price + acqTax + insuranceTotal + installmentInterest;

  // 장기렌트 대량구매 할인 반영 공급가(94%) + 단체보험 분담액(65%)
  // 사업자 비용처리 절세액 (연 최대 1,500만 원 한도)
  const taxSaving = taxRate > 0
    ? Math.round(Math.min(15000000, price * 0.3) * (taxRate / 100) * (months / 12))
    : 0;

  const rentTco = Math.round(price * 0.94 + insuranceTotal * 0.65 - taxSaving);
  const diffMan = Math.round(Math.abs(installmentTco - rentTco) / 10000);
  const winner = rentTco < installmentTco ? "신차 장기렌트" : "신차 할부";

  // 중고차 잔존가치 및 만기 인수 옵션가
  const residualValue = Math.round(price * residualRate);
  const netInstallmentTco = installmentTco - residualValue;
  const rentBuyoutPrice = Math.round(price * (residualRate * 1.05));

  const acqTaxMan = Math.round(acqTax / 10000);
  const insTaxSaveMan = Math.round((taxSaving + insuranceTotal * 0.35) / 10000);
  const residualMan = Math.round(residualValue / 10000);

  // 차량 가격대별 차급 매칭
  let carSegmentLabel = "중형 SUV·세단(쏘렌토·싼타페·그랜저급)";
  let matKw = "쏘렌토 싼타페 그랜저 6D 코일매트 신차패키지";
  if (carPriceMan <= 2100) {
    carSegmentLabel = "경차·소형(캐스퍼·레이·아반떼급)";
    matKw = "캐스퍼 레이 아반떼 전용 코일매트 트렁크매트";
  } else if (carPriceMan <= 3200) {
    carSegmentLabel = "준중형·중형(아반떼·스포티지·쏘나타급)";
    matKw = "아반떼 스포티지 투싼 전용 6D 코일매트";
  } else if (carPriceMan >= 4700 && carPriceMan <= 5800) {
    carSegmentLabel = "전기차·준대형(아이오닉5·EV6·카니발급)";
    matKw = "아이오닉5 EV6 카니발 전용 코일매트 V2L 액세서리";
  } else if (carPriceMan > 5800) {
    carSegmentLabel = "프리미엄 대형(제네시스 G80·GV80·수입차급)";
    matKw = "제네시스 G80 GV70 GV80 전용 고급 코일매트 가죽케어";
  }

  const badge = `🏆 ${months}개월 실지출 총비용(TCO) 판정 완료`;
  const headline = `[${winner}] 선택 시 총 ${diffMan.toLocaleString()}만 원 더 이득!`;
  const summary = `차량가 ${carPriceMan.toLocaleString()}만 원 기준 취등록세(${acqTaxMan}만 원), ${months}개월 보험료·자동차세, ${Math.round(residualRate * 100)}% 중고차 잔존가치(약 ${residualMan}만 원) 회수 및 사업자 절세 효과를 종합 분석하면 [${winner}] 방식이 총 ${diffMan.toLocaleString()}만 원 유리합니다.`;

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
      { label: "초기 취등록세(7%)", val: `${acqTaxMan}만 원` },
      { label: "절세·보험 절감액", val: `${insTaxSaveMan}만 원` },
      { label: "최종 TCO 절약액", val: `${diffMan.toLocaleString()}만 원` }
    ],
    lossComparison: {
      lossLabel: `${winner === "신차 장기렌트" ? "일반 신차 할부" : "신차 장기렌트"} 선택 시 총지출`,
      lossValueText: `${Math.round(maxTco / 10000).toLocaleString()}만 원`,
      optLabel: `[${winner}] 최적 승자 플랜 총지출`,
      optValueText: `${Math.round(minTco / 10000).toLocaleString()}만 원`,
      savingBadge: `${months}개월간 총 ${diffMan.toLocaleString()}만 원 세이브`,
      optPercent: maxTco > 0 ? Math.max(25, Math.min(90, Math.round((minTco / maxTco) * 100))) : 75
    },
    actionItems: [
      {
        icon: "🎥",
        stepTag: "보험료 특약할인",
        label: `[보험료 최대 5% 할인] 아이나비·파인뷰 2채널 QHD 블랙박스`,
        calcVal: `${months}개월 보험·세금 부담(취등록세 ${acqTaxMan}만 원) 중 블랙박스 특약 즉시 절감`,
        coupangKw: "아이나비 파인뷰 2채널 QHD 블랙박스 무료출장장착",
        coupangBtn: "🚀 QHD 블랙박스 로켓배송 ↗",
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=2%EC%B1%84%EB%84%90%20QHD%20%EB%B8%94%EB%9E%99%EB%B0%95%EC%8A%A4%20%EB%AC%B4%EB%A3%8C%EC%9E%A5%EC%B0%A9",
        lpBtn: "🏷️ 지마켓 무료출장장착 특가 ↗"
      },
      {
        icon: "🛡️",
        stepTag: `잔존가치 ${residualMan}만원 방어`,
        label: `[${carSegmentLabel}] 맞춤 6D 코일매트 & 신차 실내 보호 패키지`,
        calcVal: `${months}개월 뒤 중고차 잔존가치 ${residualMan}만 원(${Math.round(residualRate * 100)}%) 감가·반납 패널티 0원 방어`,
        coupangKw: matKw,
        coupangBtn: `🚀 ${carPriceMan}만 원급 신차 코일매트 ↗`,
        lpMerchant: "auction",
        lpUrl: `http://browse.auction.co.kr/search?keyword=${encodeURIComponent(matKw)}`,
        lpBtn: "🏷️ 옥션 차종별 맞춤매트 ↗"
      },
      {
        icon: "⚡",
        stepTag: `${diffMan}만원 세이브 활용`,
        label: `[신차 출고 필수템] 15W 맥세이프 고속충전 거치대 & 에어컨 필터`,
        calcVal: `[${winner}] 선택으로 아낀 ${diffMan}만 원 중 3만 원으로 신차 편의성 200% 업그레이드`,
        coupangKw: "신지모루 차량용 맥세이프 고속충전 거치대 활성탄 에어컨필터",
        coupangBtn: "🚀 신차 필수 맥세이프 거치대 ↗",
        lpMerchant: "lotteon",
        lpUrl: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EC%B0%A8%EB%9F%89%EC%9A%A9%20%EB%A7%A5%EC%84%B8%EC%9D%B4%ED%94%84%20%EA%B1%B0%EC%B9%98%EB%8C%80",
        lpBtn: "🏷️ 롯데ON 차량용품 할인 ↗"
      }
    ],
    summary,
    cpaTitle: `할부보다 ${diffMan}만 원 아끼는 국내 21개 렌트·리스사 무서류 1분 최저가 견적`,
    cpaPayout: "60,000원",
    cpaKey: "auto_longterm_rent",
    cpaBenefit: `${diffMan}만원`,
    products: [
      {
        icon: "🎥",
        title: `아이나비 2채널 QHD 블랙박스 (보험료 특약할인 필수템)`,
        kw: "2채널 QHD 블랙박스",
        type: "coupang",
        badge: "🎥 자동차보험 특약 5% 할인",
        calcMatchTag: `🎥 내 계산 연동: 초기 취등록세 ${acqTaxMan}만 원 · 보험료 절감`,
        matchReason: `${carPriceMan.toLocaleString()}만 원 신차 출고 시 장착 사진 한 장으로 ${months}개월 내내 자동차보험료를 할인받는 필수품`,
        ctaText: "쿠팡 QHD 블랙박스 특가 확인 →"
      },
      {
        icon: "⚡",
        title: `신지모루 차량용 맥세이프 15W 무선충전 거치대 (${carSegmentLabel})`,
        kw: "차량용 맥세이프 고속충전 거치대",
        type: "coupang",
        badge: "🚀 오늘 주문 내일 도착",
        calcMatchTag: `🏆 내 계산 연동: [${winner}] ${diffMan}만 원 절약분 활용`,
        matchReason: `딜러 서비스 저가 거치대 대신 ${carPriceMan.toLocaleString()}만 원 신차 송풍구에 완벽 밀착되는 1위 거치대`,
        ctaText: "15W 초고속 충전거치대 인기순위 →"
      },
      {
        icon: "🛠️",
        title: "지마켓 2채널 QHD 블랙박스 전국 무료출장장착 패키지",
        merchant: "gmarket",
        merchantLabel: "지마켓",
        url: "https://www.gmarket.co.kr/n/search?keyword=2%EC%B1%84%EB%84%90%20QHD%20%EB%B8%94%EB%9E%99%EB%B0%95%EC%8A%A4%20%EB%AC%B4%EB%A3%8C%EC%9E%A5%EC%B0%A9",
        type: "linkprice",
        badge: "🛠️ 전국 무료출장장착",
        calcMatchTag: `💰 내 계산 연동: 절세·보험 절감액 ${insTaxSaveMan}만 원 극대화`,
        matchReason: `신차 인도 장소(집·회사)로 전문 기사님이 직접 방문해 공임비 0원으로 장착`,
        ctaText: "지마켓 블랙박스 무료장착 특가 →"
      },
      {
        icon: "🛡️",
        title: `옥션 ${carSegmentLabel} 맞춤 6D 코일매트·세차용품 풀세트`,
        merchant: "auction",
        merchantLabel: "옥션",
        url: `http://browse.auction.co.kr/search?keyword=${encodeURIComponent(matKw)}`,
        type: "linkprice",
        badge: "✨ 잔존가치 감가 방어",
        calcMatchTag: `🛡️ 내 계산 연동: 만기 잔존가치 ${residualMan}만 원(${Math.round(residualRate * 100)}%) 보존`,
        matchReason: `${months}개월 계약 만기 시 실내 오염 감가나 반납 패널티 없이 ${residualMan}만 원 가치를 지키는 필수 매트`,
        ctaText: "옥션 차종별 코일매트 할인가 →"
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

  // 손익분기점(BEP) 개월 수
  let bepMonths = 0;
  if (cashGiftMan >= penaltyMan) {
    bepMonths = 0; // 당일 즉시 흑자
  } else if (monthlyDiff > 0) {
    bepMonths = Math.ceil(((penaltyMan - cashGiftMan) * 10000) / monthlyDiff);
  } else {
    bepMonths = -1; // 만기 이동 권장
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
    headline = `위약금 ${penaltyMan}만 원 내고도 총 +${benefitMan}만 원 순수익!`;
    if (immediateDiffMan >= 0) {
      summary = `현재 위약금 ${penaltyMan}만 원을 물더라도 신규 현금 사은품 ${cashGiftMan}만 원을 즉시 수령하면 당장 +${immediateDiffMan}만 원이 남고, ${monthlyDiff >= 0 ? `매달 요금까지 ${monthlyDiff.toLocaleString()}원씩 절감되어` : `매달 요금이 ${Math.abs(monthlyDiff).toLocaleString()}원 오르더라도`} 3년간 총 ${totalNetBenefit.toLocaleString()}원 이득입니다.`;
    } else {
      summary = `현재 위약금 ${penaltyMan}만 원이 사은품(${cashGiftMan}만 원)보다 ${Math.abs(immediateDiffMan)}만 원 많지만, 매달 요금이 ${monthlyDiff.toLocaleString()}원씩 절감되어 약 ${bepMonths}개월 후 손익분기점을 넘고 3년간 총 ${totalNetBenefit.toLocaleString()}원 이득입니다.`;
    }
  } else if (totalNetBenefit === 0) {
    badge = "⚖️ 손익 동일 (현상 유지 권장)";
    headline = `위약금과 신규 혜택이 동일하여 실질적인 손익 차이가 없습니다.`;
    summary = `현재 위약금과 신규 가입 혜택이 정확히 일치하여 금전적 이득이 발생하지 않습니다. 약정 만료 시점까지 유지하는 것을 권장합니다.`;
  } else {
    badge = "⏳ 만기 후 이동 권장";
    headline = `지금 이동 시 총 ${Math.abs(benefitMan)}만 원 손해! (만기 후 이동 권장)`;
    summary = `현재 위약금 ${penaltyMan}만 원 대비 신규 사은품이 ${cashGiftMan}만 원에 불과하여 당장 ${Math.abs(immediateDiffMan)}만 원 손실이 발생하며, ${monthlyDiff <= 0 ? `매달 요금도 ${Math.abs(monthlyDiff).toLocaleString()}원 더 비싸지므로` : `매달 요금이 ${monthlyDiff.toLocaleString()}원 절감되더라도 3년 내 위약금을 만회하지 못해`} 지금 이동 시 총 ${Math.abs(totalNetBenefit).toLocaleString()}원 손해입니다.`;
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
      { label: "사은품 - 위약금 차액", val: formatSignedManWon(immediateDiffMan) },
      { label: monthlyDiff >= 0 ? "3년 요금 절감액" : "3년 요금 추가부담", val: formatSignedManWon(threeYearFeeSaveMan) },
      { label: totalNetBenefit >= 0 ? "총 순이익 합계" : "총 예상 손실액", val: formatSignedWon(totalNetBenefit) }
    ],
    lossComparison: {
      lossLabel: "기존 통신사 유지 시 (3년 요금·사은품 0원)",
      lossValueText: `${(oldFee * 36).toLocaleString()}원`,
      optLabel: `신규 이동 시 (사은품 ${cashGiftMan}만 - 위약금 ${penaltyMan}만)`,
      optValueText: `${Math.max(0, newFee * 36 - immediateNetWon).toLocaleString()}원`,
      savingBadge: totalNetBenefit >= 0
        ? `갈아타는 즉시 총 +${totalNetBenefit.toLocaleString()}원 순수익!`
        : `약정 만기 후 이동 시 +${(cashGiftMan * 10000).toLocaleString()}원 혜택`,
      optPercent: oldFee > 0
        ? Math.max(20, Math.min(92, Math.round((Math.max(0, newFee * 36 - immediateNetWon) / (oldFee * 36)) * 100)))
        : 60
    },
    actionItems: [
      {
        icon: "📡",
        stepTag: "임대료 15.8만원 절약",
        label: `[통신사 공유기 임대료 0원] ipTIME 기가 와이파이6 공유기 AX3000`,
        calcVal: `월 4,400원 공유기 임대료(3년 158,400원) 면제 + 사은품 차액(${formatSignedManWon(immediateDiffMan)})으로 장만`,
        coupangKw: "ipTIME 와이파이6 공유기 AX3000 메쉬",
        coupangBtn: "🚀 와이파이6 공유기 로켓배송 ↗",
        lpMerchant: "himart",
        lpUrl: "https://www.e-himart.co.kr/app/search/totalSearch?query=%EA%B8%B0%EA%B0%80%20%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0",
        lpBtn: "🏷️ 하이마트 공유기 특가 ↗"
      },
      {
        icon: "🧹",
        stepTag: "설치 당일 필수",
        label: `[기사님 방문 전 구비] TV 뒷면 셋톱박스·공유기 무타공 정리함 & CAT.8 랜선`,
        calcVal: `신규 인터넷(월 ${newFee.toLocaleString()}원) 개통 당일 거실 벽면 타공 없이 3분 선정리 완료`,
        coupangKw: "셋톱박스 공유기 무타공 정리함 거치대 CAT8 랜선",
        coupangBtn: "🚀 무타공 셋톱박스 정리함 ↗",
        lpMerchant: "lotteon",
        lpUrl: "https://www.lotteon.com/csearch/search/search?render=search&platform=pc&q=%EC%85%8B%ED%86%B1%EB%B0%95%EC%8A%A4%20%EA%B3%B5%EC%9C%A0%EA%B8%B0%20%EC%A0%95%EB%A6%AC%ED%95%A8",
        lpBtn: "🏷️ 롯데ON 선정리함 할인 ↗"
      },
      {
        icon: "📱",
        stepTag: "3년 요금 절감",
        label: `[3년 요금 ${formatSignedManWon(threeYearFeeSaveMan)} 연동] 알뜰폰 무약정 NFC 유심칩 자급제 개통`,
        calcVal: `총 순이익(${formatSignedWon(totalNetBenefit)})에 더해 휴대폰 요금까지 매달 3만 원씩 추가 절약`,
        coupangKw: "알뜰폰 무약정 공용 유심칩 NFC 바로배송",
        coupangBtn: "🚀 알뜰폰 반값 유심칩 로켓배송 ↗",
        lpMerchant: "gmarket",
        lpUrl: "https://www.gmarket.co.kr/n/search?keyword=%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0%20%EC%9E%90%EA%B8%89%EC%A0%9C",
        lpBtn: "🏷️ 지마켓 통신기기 모음 ↗"
      }
    ],
    summary,
    cpaTitle: totalNetBenefit >= 0
      ? `위약금 ${penaltyMan}만 원 완벽 방어 + 현금 사은품 ${cashGiftMan}만 원 당일 입금 무료 상담`
      : `위약금 부담 없는 최저 요금제 전환 & 당일 사은품 극대화 무료 맞춤 컨설팅`,
    cpaPayout: "55,000원",
    cpaKey: "telecom_internet_switch",
    cpaBenefit: `${Math.abs(totalNetBenefit)}`,
    products: [
      {
        icon: "📡",
        title: "ipTIME 기가 와이파이6 공유기 AX3000 (통신사 임대료 3년 15.8만 원 절약)",
        kw: "와이파이6 공유기 AX3000",
        type: "coupang",
        badge: "📡 통신사 임대료 평생 0원",
        calcMatchTag: `📡 내 계산 연동: 사은품 차액(${formatSignedManWon(immediateDiffMan)}) + 임대료 15.8만 원 세이브`,
        matchReason: `통신사 공유기 임대료(월 4,400원×36개월)를 내지 않고 더 빠른 와이파이6 속도를 평생 무료로 사용`,
        ctaText: "기가 와이파이6 공유기 로켓배송 →"
      },
      {
        icon: "🧹",
        title: "코멧 TV 뒷면 셋톱박스·공유기 무타공 정리함 (개통 기사님 방문 당일 세팅)",
        kw: "셋톱박스 공유기 정리함",
        type: "coupang",
        badge: "🧹 선정리 3분 해결",
        calcMatchTag: `🧹 내 계산 연동: 월 ${newFee.toLocaleString()}원 신규 인터넷·TV 깔끔 설치`,
        matchReason: `신규 통신사 설치 기사님이 오셨을 때 드릴 타공 없이 TV 뒷면에 셋톱박스를 숨기는 필수템`,
        ctaText: "무타공 셋톱박스 거치대 최저가 →"
      },
      {
        icon: "💳",
        title: "롯데하이마트 기가 와이파이6 공유기·메쉬 증폭기 공식 할인전",
        merchant: "himart",
        merchantLabel: "롯데하이마트",
        url: "https://www.e-himart.co.kr/app/search/totalSearch?query=%EA%B8%B0%EA%B0%80%20%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0",
        type: "linkprice",
        badge: "💳 하이마트 즉시할인",
        calcMatchTag: `💰 내 계산 연동: 3년 순이익 ${formatSignedWon(totalNetBenefit)} 극대화`,
        matchReason: `사은품 현금(${cashGiftMan}만 원) 수령 후 음영지역 없는 기가 와이파이 환경을 최저가로 구축`,
        ctaText: "하이마트 통신·공유기 특가전 →"
      },
      {
        icon: "🔥",
        title: "지마켓 알뜰폰 무약정 유심·자급제 통신기기 특가 기획전",
        merchant: "gmarket",
        merchantLabel: "지마켓",
        url: "https://www.gmarket.co.kr/n/search?keyword=%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0%20%EC%9E%90%EA%B8%89%EC%A0%9C",
        type: "linkprice",
        badge: "🔥 통신비 반값 절약",
        calcMatchTag: `📉 내 계산 연동: 3년 요금 ${formatSignedManWon(threeYearFeeSaveMan)} + 알뜰폰 추가 절감`,
        matchReason: `인터넷 갈아타기와 동시에 스마트폰까지 알뜰폰 유심으로 결합해 가계 통신비를 절반으로 감축`,
        ctaText: "지마켓 통신기기 최저가 비교 →"
      }
    ]
  };
}

/**
 * 6대 계산기 UI 및 입력 스펙 정의 (토스·핀다 스타일 1줄 타이틀 + 서브타이틀 구조)
 */
const CALCULATORS = {
  electric: {
    id: "electric",
    title: "⚡ 전기요금·누진세 & 1등급 본전 계산기",
    subtitle: "가전 소비전력별 월 추가 전기세와 1등급 인버터 회수 기간 진단",
    calculate: calculateElectric,
    inputs: [
      { id: "wattage", label: "가전 소비전력 (W)", type: "number", value: 1800, min: 50, max: 5000 },
      { id: "hours", label: "하루 가동 시간 (시간/일)", type: "number", value: 10, min: 1, max: 24 },
      { id: "baseKwh", label: "우리 집 기본 월 사용량 (kWh)", type: "number", value: 250, min: 50, max: 1000 },
      { id: "newPrice", label: "교체할 1등급 가전 가격 (원)", type: "number", value: 850000, min: 100000, max: 5000000 },
      { id: "isSummer", label: "하계(7~8월) 누진구간 완화 적용", type: "checkbox", value: false }
    ]
  },
  diet: {
    id: "diet",
    title: "🍗 탄단지(TDEE) & 식단 장보기 계산기",
    subtitle: "체중·목표별 일일 권장 칼로리와 닭가슴살·현미밥 구매 수량 산출",
    calculate: calculateDiet,
    inputs: [
      { id: "weight", label: "현재 체중 (kg)", type: "number", value: 78, min: 35, max: 180 },
      { id: "height", label: "신장 (cm)", type: "number", value: 175, min: 130, max: 210 },
      { id: "weeks", label: "식단 진행 기간 (주)", type: "number", value: 4, min: 1, max: 12 },
      { id: "deficit", label: "일일 칼로리 조절 (감량 -500 · 증량 +300)", type: "number", value: -500, min: -1000, max: 1000 },
      { id: "gender", label: "성별", type: "select", value: "male", options: [{ label: "남성", value: "male" }, { label: "여성", value: "female" }] }
    ]
  },
  pet: {
    id: "pet",
    title: "🐶 반려동물 사료 급여량 & 소진일 계산기",
    subtitle: "수의영양학(RER/DER) 기준 하루 권장 급여량(g)과 포대 소진 주기",
    calculate: calculatePet,
    inputs: [
      { id: "petWeight", label: "반려동물 체중 (kg)", type: "number", value: 5.0, min: 0.5, max: 60, step: 0.1 },
      { id: "factor", label: "생애주기 계수 (성견 1.6 · 퍼피 2.5 · 묘 1.2)", type: "number", value: 1.6, min: 0.8, max: 3.5, step: 0.1 },
      { id: "kcalPerKg", label: "사료 1kg당 칼로리 (kcal/kg)", type: "number", value: 3650, min: 2500, max: 4800 },
      { id: "bagKg", label: "구매할 사료 1포대 무게 (kg)", type: "number", value: 2.0, min: 0.5, max: 20, step: 0.5 }
    ]
  },
  room: {
    id: "room",
    title: "🛋️ 자취·신혼 가전·가구 풀세팅 견적기",
    subtitle: "예산 초과 0원 보장! 평수·스타일별 5대 필수 가전·가구 황금 배분",
    calculate: calculateRoom,
    inputs: [
      { id: "budgetMan", label: "총 가용 예산 (만 원)", type: "number", value: 150, min: 50, max: 2000 },
      { id: "roomSize", label: "주거 평수 (원룸 6평 · 오피스텔 10평 · 24평)", type: "number", value: 7, min: 4, max: 50 },
      { id: "priority", label: "인테리어 스타일 / 우선순위", type: "select", value: "가성비", options: [
        { label: "가성비 균형형 (기본)", value: "가성비" },
        { label: "가전 집중형 (냉장고·세탁기 고스펙)", value: "가전 집중" },
        { label: "화이트 감성형 (침대·인테리어 중심)", value: "화이트 감성" }
      ]}
    ]
  },
  auto: {
    id: "auto",
    title: "🚗 신차 장기렌트 vs 할부 총비용 계산기",
    subtitle: "취등록세·보험료·중고 잔존가치·사업자 절세 통합 실지출(TCO) 비교",
    calculate: calculateAuto,
    inputs: [
      { id: "carPriceMan", label: "차량 가격 (만 원)", type: "number", value: 3500, min: 1500, max: 15000 },
      { id: "months", label: "계약/할부 기간 (개월)", type: "number", value: 48, min: 24, max: 60 },
      { id: "taxRate", label: "종합소득세율 (%, 일반 직장인은 0)", type: "number", value: 24, min: 0, max: 45 },
      { id: "downPaymentRate", label: "선납금/선수금 비율 (%)", type: "number", value: 20, min: 0, max: 50 },
      { id: "interestRate", label: "할부 연 이자율 (%)", type: "number", value: 5.5, min: 2.0, max: 12.0, step: 0.1 },
      { id: "driverAge", label: "운전자 연령 / 경력", type: "select", value: "over26", options: [
        { label: "만 26세 이상 (표준)", value: "over26" },
        { label: "만 21세~25세 (보험료 할증 +35%)", value: "under26" },
        { label: "만 35세 이상 무사고 (보험료 할인 -10%)", value: "over35" }
      ]}
    ]
  },
  telecom: {
    id: "telecom",
    title: "🌐 인터넷 위약금 vs 사은품 손익 계산기",
    subtitle: "잔여 약정 위약금 대비 신규 현금 사은품(47만원)·3년 요금 순수익",
    calculate: calculateTelecom,
    inputs: [
      { id: "penaltyMan", label: "현재 남은 약정 위약금 (만 원)", type: "number", value: 15, min: 0, max: 60 },
      { id: "oldFee", label: "현재 월 인터넷+TV 요금 (원)", type: "number", value: 46000, min: 15000, max: 100000 },
      { id: "newFee", label: "신규 이동 시 결합 월 요금 (원)", type: "number", value: 38500, min: 15000, max: 100000 },
      { id: "cashGiftMan", label: "신규 가입 현금 사은품 (만 원, 최대 47)", type: "number", value: 47, min: 10, max: 47 }
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
