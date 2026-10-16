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
 * Calc 1: 전기요금·누진세 폭탄 & 1등급 인버터 교체 손익분기점 계산기
 */
function calculateElectric(inputs = {}) {
  const wattage = inputs.wattage !== undefined ? Number(inputs.wattage) : 1800;
  const hours = inputs.hours !== undefined ? Number(inputs.hours) : 10;
  const baseKwh = inputs.baseKwh !== undefined ? Number(inputs.baseKwh) : 250;
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
      { label: "1등급 교체 시 월 절감", val: isZeroUsage || addedKwh === 0 ? "0원" : `-${monthlySaving.toLocaleString()}원` },
      { label: "기기값 본전 회수", val: paybackMonths > 0 ? `${paybackMonths}개월` : "미가동" }
    ],
    summary,
    cpaTitle: `초기비용 0원! 에너지 1등급 가전 렌탈 & 정부 환급금 조회 (월 ${monthlySaving.toLocaleString()}원 절감)`,
    cpaPayout: "35,000원",
    cpaKey: "electric_grade1_rental",
    cpaBenefit: `${monthlySaving}`,
    products: [
      { title: "쿠팡 1등급 듀얼인버터 에어컨/제습기 로켓배송", kw: "에너지소비효율 1등급 인버터 에어컨 제습기", type: "coupang" },
      { title: "실시간 대기전력 차단 스마트 플러그 전력측정기", kw: "스마트 플러그 전력측정기", type: "coupang" },
      { title: "하이마트 으뜸효율 1등급 가전 특별 기획전", merchant: "himart", url: "https://www.e-himart.co.kr/", type: "linkprice" },
      { title: "지마켓 고효율 서큘레이터·절전 가전 베스트", merchant: "gmarket", url: "https://www.gmarket.co.kr/", type: "linkprice" }
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
  const deficit = inputs.deficit !== undefined ? Number(inputs.deficit) : -500;

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
  const headline = `하루 ${targetKcal.toLocaleString()}kcal (탄 ${dailyCarbG}g·단 ${dailyProteinG}g·지 ${dailyFatG}g) · 닭가슴살 총 ${chickenPacks}팩 필요!`;
  const summary = `목표 달성을 위해 앞으로 ${weeks}주(${days}일) 동안 닭가슴살 100g ${chickenPacks}팩, 즉석 현미밥 ${brownRiceBowls}개, WPI 프로틴 파우더 ${proteinTubs}통을 구비하시면 가장 저렴하고 정확하게 식단을 완주할 수 있습니다. (일일 영양성분: 탄수화물 ${dailyCarbG}g, 단백질 ${dailyProteinG}g, 지방 ${dailyFatG}g)`;

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
      { label: "일일 탄/단/지 권장", val: `탄 ${dailyCarbG}g · 단 ${dailyProteinG}g · 지 ${dailyFatG}g` },
      { label: `${weeks}주 닭가슴살(100g)`, val: `총 ${chickenPacks}팩` },
      { label: `${weeks}주 즉석 현미밥`, val: `총 ${brownRiceBowls}개` }
    ],
    summary,
    cpaTitle: `혼자 빼기 힘들다면? ${weeks}주 책임 감량 1:1 체질 맞춤 다이어트 무료 진단`,
    cpaPayout: "45,000원",
    cpaKey: "diet_custom_consulting",
    cpaBenefit: `${chickenPacks}팩`,
    products: [
      { title: `냉동 닭가슴살 100g 대용량 (${chickenPacks}팩 맞춤 묶음)`, kw: "냉동 닭가슴살 100g 대용량 패키지", type: "coupang" },
      { title: `즉석 현미밥·곤약밥 (${brownRiceBowls}개입 로켓프레시)`, kw: "즉석 현미밥 대용량 박스", type: "coupang" },
      { title: "WPI 분리유청 단백질 보충제 대용량 특가", kw: "WPI 분리유청단백질 프로틴", type: "coupang" },
      { title: "그램(g) 정밀 계량 디지털 주방저울", kw: "디지털 주방저울", type: "coupang" }
    ]
  };
}

/**
 * Calc 3: 반려동물(강아지·고양이) 맞춤 칼로리·사료 급여량 & 소진일 진단기
 */
function calculatePet(inputs = {}) {
  const petWeight = inputs.petWeight !== undefined ? Number(inputs.petWeight) : 5.0;
  const safeWeight = Math.max(0.5, petWeight);
  const factor = inputs.factor !== undefined ? Number(inputs.factor) : 1.6;
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
      { label: "하루 급여량(g)", val: `${dailyGrams}g (회당 ${halfGrams}g)` },
      { label: `${bagKg}kg 1포대 소진일`, val: `약 ${daysPerBag}일` }
    ],
    summary,
    cpaTitle: `슬개골·피부병 병원비 평균 180만 원! ${petWeight}kg 우리 아이 펫보험 90% 보장 최저가 비교`,
    cpaPayout: "35,000원",
    cpaKey: "pet_insurance_compare",
    cpaBenefit: `${dailyGrams}g`,
    products: [
      { title: `${petWeight}kg 맞춤 별점 4.8+ 가수분해 알러지 사료`, kw: "강아지 가수분해 사료 로얄캐닌", type: "coupang" },
      { title: "반려동물 슬개골·관절·유산균 영양제 베스트", kw: "강아지 관절 영양제 유산균", type: "coupang" },
      { title: "1g 단위 정밀 계량 펫 사료 전자저울 스쿱", kw: "강아지 사료 전자저울 스쿱", type: "coupang" },
      { title: "대용량 고흡수 배변패드 / 고양이 벤토나이트 모래", kw: "강아지 배변패드 대용량", type: "coupang" }
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

  if (inputs.budget !== undefined) {
    const raw = Number(inputs.budget);
    if (raw >= 100000) {
      budgetWon = Math.floor(raw);
      budgetMan = Math.round(budgetWon / 10000);
    } else {
      budgetMan = Math.floor(raw);
      budgetWon = budgetMan * 10000;
    }
  } else if (inputs.budgetMan !== undefined) {
    budgetMan = Number(inputs.budgetMan);
    budgetWon = Math.floor(budgetMan * 10000);
  } else {
    budgetMan = 150;
    budgetWon = 1500000;
  }

  const roomSize = inputs.roomSize !== undefined ? Number(inputs.roomSize) : 7;
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
  const savingWon = Math.round(budgetWon * 0.22);

  const badge = `🏠 ${roomSize}평 [${priority}] 예산 초과 0원 황금 배분`;
  const headline = `총 ${budgetMan}만 원 풀세팅 견적서 (가전 ${Math.round(appliancesTotalWon / 10000)}만 + 가구 ${Math.round(furnitureTotalWon / 10000)}만)`;
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
    savingWon,
    badge,
    headline,
    metrics: [
      { label: "냉장고 적정 예산", val: `${top1}만 원` },
      { label: "세탁기 적정 예산", val: `${top2}만 원` },
      { label: "침대·매트리스 예산", val: `${top3}만 원` }
    ],
    summary,
    cpaTitle: `${roomSize}평 맞춤 원룸·포장이사 3초 최저가 비교견적 + 입주청소 특가`,
    cpaPayout: "30,000원",
    cpaKey: "room_moving_quote",
    cpaBenefit: `${budgetMan}만원`,
    products: [
      { title: `${top1}만 원대 무소음 가성비 냉장고 로켓설치`, kw: "원룸 자취방 냉장고 로켓설치", type: "coupang" },
      { title: `${top3}만 원대 독립스프링 롤팩 매트리스·침대`, kw: "독립스프링 매트리스 침대프레임", type: "coupang" },
      { title: "현대Hmall 자취·신혼 가구 공간별 베스트 기획전", merchant: "hmall", url: "https://www.hmall.com/", type: "linkprice" },
      { title: "필수 소형가전 3종 (전자레인지·전기밥솥·무선청소기)", kw: "자취 전자레인지 무선청소기", type: "coupang" }
    ]
  };
}

/**
 * Calc 5: 자동차 구매방식(장기렌트 vs 리스 vs 할부 vs 현금) TCO 손익 계산기
 */
function calculateAuto(inputs = {}) {
  const carPriceMan = inputs.carPriceMan !== undefined ? Number(inputs.carPriceMan) : 3500;
  const months = Number(inputs.months) || 48;
  const taxRate = inputs.taxRate !== undefined ? Number(inputs.taxRate) : 24;

  // 선납금 비율 (%, 기본 20%)
  const rawDown = inputs.downPaymentRate !== undefined ? Number(inputs.downPaymentRate) : 20;
  const downPaymentRate = rawDown > 1 ? rawDown / 100 : rawDown;
  const financedRate = Math.max(0, 1 - downPaymentRate);

  // 할부 연 금리 (%, 기본 5.5%)
  const interestRate = inputs.interestRate !== undefined ? Number(inputs.interestRate) : 5.5;

  // 운전자 연령 / 경력 계수 (기본 1.0)
  let driverAgeFactor = 1.0;
  if (inputs.driverAge === "under26" || (typeof inputs.driverAge === "number" && inputs.driverAge < 26)) {
    driverAgeFactor = 1.35;
  } else if (inputs.driverAge === "over35" || (typeof inputs.driverAge === "number" && inputs.driverAge >= 35)) {
    driverAgeFactor = 0.90;
  } else if (inputs.driverAgeFactor !== undefined) {
    driverAgeFactor = Number(inputs.driverAgeFactor);
  }

  // 중고차 만기 잔존가치 비율 (36개월 50%, 48개월 45%, 60개월 40% 기준)
  const residualRate = inputs.residualRate !== undefined
    ? Number(inputs.residualRate)
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

  const badge = `🏆 ${months}개월 실지출 총비용(TCO) 판정 완료`;
  const headline = `[${winner}] 선택 시 총 ${diffMan.toLocaleString()}만 원 더 이득!`;
  const summary = `차량가 ${carPriceMan.toLocaleString()}만 원 기준 취등록세(${Math.round(acqTax / 10000)}만 원), ${months}개월 보험료·자동차세, ${Math.round(residualRate * 100)}% 중고차 잔존가치(약 ${Math.round(residualValue / 10000)}만 원) 회수 및 사업자 절세 효과를 종합 분석하면 [${winner}] 방식이 총 ${diffMan.toLocaleString()}만 원 유리합니다.`;

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
      { label: "초기 취등록세(7%)", val: `${Math.round(acqTax / 10000)}만 원` },
      { label: `만기 잔존가치(${Math.round(residualRate * 100)}%)`, val: `약 ${Math.round(residualValue / 10000)}만 원` },
      { label: "절세+보험료 절감액", val: `${Math.round((taxSaving + insuranceTotal * 0.35) / 10000)}만 원` },
      { label: "최종 손익 차이", val: `${diffMan}만 원 절약` }
    ],
    summary,
    cpaTitle: `할부보다 ${diffMan}만 원 아끼는 국내 21개 렌트·리스사 무서류 1분 최저가 견적`,
    cpaPayout: "60,000원",
    cpaKey: "auto_longterm_rent",
    cpaBenefit: `${diffMan}만원`,
    products: [
      { title: "신차 출고 필수! 2채널 QHD 아이나비/파인뷰 블랙박스", kw: "2채널 QHD 블랙박스", type: "coupang" },
      { title: "차량용 맥세이프 고속 무선충전 거치대 베스트", kw: "차량용 맥세이프 고속충전 거치대", type: "coupang" },
      { title: "실내 오염 방지 친환경 확장형 코일 카매트", kw: "차량용 코일매트", type: "coupang" },
      { title: "초보운전·신차 관리 세차용품 올인원 버킷 세트", kw: "세차용품 세트", type: "coupang" }
    ]
  };
}

/**
 * Calc 6: 인터넷·TV 약정 위약금 vs 현금 사은품(최대 47만 원) 갈아타기 손익 계산기
 */
function calculateTelecom(inputs = {}) {
  const penaltyMan = inputs.penaltyMan !== undefined ? Number(inputs.penaltyMan) : 15;
  const oldFee = Number(inputs.oldFee) || 46000;
  const newFee = Number(inputs.newFee) || 38500;
  const cashGiftMan = inputs.cashGiftMan !== undefined ? Number(inputs.cashGiftMan) : 47;

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
    headline = `위약금 부담으로 지금 갈아타면 총 ${Math.abs(benefitMan)}만 원 손해! (만기 후 이동 권장)`;
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
    summary,
    cpaTitle: totalNetBenefit >= 0
      ? `위약금 ${penaltyMan}만 원 완벽 방어 + 현금 사은품 ${cashGiftMan}만 원 당일 입금 무료 상담`
      : `위약금 부담 없는 최저 요금제 전환 & 당일 사은품 극대화 무료 맞춤 컨설팅`,
    cpaPayout: "55,000원",
    cpaKey: "telecom_internet_switch",
    cpaBenefit: `${Math.abs(totalNetBenefit)}`,
    products: [
      { title: "방마다 빵빵한 속도! 기가 와이파이6 공유기 AX3000", kw: "와이파이6 공유기 AX3000", type: "coupang" },
      { title: "거실 TV 뒤 지저분한 셋톱박스·공유기 무타공 정리함", kw: "셋톱박스 공유기 정리함", type: "coupang" },
      { title: "하이마트 통신·자급제·기가 공유기 특별 기획전", merchant: "himart", url: "http://www.e-himart.co.kr/", type: "linkprice" },
      { title: "초고속 CAT.8 기가 랜선 케이블 로켓배송", kw: "CAT8 기가 랜선", type: "coupang" }
    ]
  };
}

/**
 * 6대 계산기 UI 및 입력 스펙 정의
 */
const CALCULATORS = {
  electric: {
    id: "electric",
    title: "⚡ 전기요금·누진세 폭탄 & 1등급 교체 본전 계산기",
    calculate: calculateElectric,
    inputs: [
      { id: "wattage", label: "가전 소비전력 (W)", type: "number", value: 1800, min: 50, max: 5000 },
      { id: "hours", label: "하루 가동 시간 (시간/일)", type: "number", value: 10, min: 1, max: 24 },
      { id: "baseKwh", label: "우리 집 기본 월 사용량 (kWh)", type: "number", value: 250, min: 50, max: 1000 },
      { id: "newPrice", label: "교체할 1등급 인버터 가전 가격 (원)", type: "number", value: 850000, min: 100000, max: 5000000 },
      { id: "isSummer", label: "하계(7~8월) 누진구간 완화 적용", type: "checkbox", value: false }
    ]
  },
  diet: {
    id: "diet",
    title: "🍗 다이어트·벌크업 탄단지(TDEE) & 장보기 수량 계산기",
    calculate: calculateDiet,
    inputs: [
      { id: "weight", label: "현재 체중 (kg)", type: "number", value: 78, min: 35, max: 180 },
      { id: "height", label: "신장 (cm)", type: "number", value: 175, min: 130, max: 210 },
      { id: "weeks", label: "식단 진행 기간 (주)", type: "number", value: 4, min: 1, max: 12 },
      { id: "deficit", label: "일일 칼로리 조절 (감량 -500 / 증량 +300)", type: "number", value: -500, min: -1000, max: 1000 },
      { id: "gender", label: "성별 (male/female)", type: "select", value: "male", options: [{ label: "남성", value: "male" }, { label: "여성", value: "female" }] }
    ]
  },
  pet: {
    id: "pet",
    title: "🐶 반려동물 맞춤 칼로리·사료 급여량(g) & 소진일 진단기",
    calculate: calculatePet,
    inputs: [
      { id: "petWeight", label: "반려동물 체중 (kg)", type: "number", value: 5.0, min: 0.5, max: 60, step: 0.1 },
      { id: "factor", label: "생애주기 계수 (성견 1.6 / 비만 1.4 / 퍼피 2.5 / 고양이 1.2)", type: "number", value: 1.6, min: 0.8, max: 3.5, step: 0.1 },
      { id: "kcalPerKg", label: "사료 1kg당 칼로리 (kcal/kg)", type: "number", value: 3650, min: 2500, max: 4800 },
      { id: "bagKg", label: "구매할 사료 1포대 무게 (kg)", type: "number", value: 2.0, min: 0.5, max: 20, step: 0.5 }
    ]
  },
  room: {
    id: "room",
    title: "🛋️ 자취·이사·신혼 예산별 가전/가구 풀세팅 최적 견적기",
    calculate: calculateRoom,
    inputs: [
      { id: "budgetMan", label: "총 가용 예산 (만 원)", type: "number", value: 150, min: 50, max: 2000 },
      { id: "roomSize", label: "평수 (원룸 6평 / 오피스텔 10평 / 신혼 24평)", type: "number", value: 7, min: 4, max: 50 },
      { id: "priority", label: "인테리어 스타일 / 우선순위", type: "select", value: "가성비", options: [
        { label: "가성비 균형형 (기본)", value: "가성비" },
        { label: "가전 집중형 (냉장고·세탁기 고스펙)", value: "가전 집중" },
        { label: "화이트 감성형 (침대·인테리어 중심)", value: "화이트 감성" }
      ]}
    ]
  },
  auto: {
    id: "auto",
    title: "🚗 자동차 구매(장기렌트 vs 리스 vs 할부) 총비용 손익 계산기",
    calculate: calculateAuto,
    inputs: [
      { id: "carPriceMan", label: "차량 가격 (만 원)", type: "number", value: 3500, min: 1500, max: 15000 },
      { id: "months", label: "계약/할부 기간 (개월)", type: "number", value: 48, min: 24, max: 60 },
      { id: "taxRate", label: "사업자/프리랜서 종합소득세율 (%, 일반직장인은 0)", type: "number", value: 24, min: 0, max: 45 },
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
    title: "🌐 인터넷·TV 약정 위약금 vs 현금 사은품(47만원) 갈아타기 계산기",
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
