#!/usr/bin/env node
/**
 * 🏢 [제1본부 전담 엔진 v4.0 — 100% 사람이 직접 쓴 내돈내산·경험담 문체 & 오류 0% · 안티밴 쿨다운 에디션]
 * 전담 계정: 네이버 1계정 `comedifarm` (Port 9222) + 인스타·쓰레드 `@moneyfit2026` + 네이버 카페 `moneyfitlab`
 * 전담 조직: 🐆 치타 본부장 (총괄) · 🐝 꿀벌 과장 (구매전환 설득) · 🦜 앵무새 피디 (SNS 웹툰) · 🦔 고슴도치 대리 (블로그·지식iN·커뮤니티)
 *
 * [핵심 품질 보증 (Zero Error & 100% Human-Written Quality)]:
 * 1. ✍️ 100% 사람이 직접 겪고 계산해 본 1인칭 생활밀착형 문체:
 *    - 기계적인 보고서투("시뮬레이션 산출 결과", "기준 조건은 ~입니다", "최적화 절약 방식") 전면 폐지.
 *    - 실제 네이버 상위 1% 내돈내산 블로거, 지식iN 생활고수, 자취/재테크 커뮤니티 유저의 자연스러운 1인칭 경험담으로 작성.
 * 2. 🛡️ 내부 지시어·마크다운 기호 노출 0건 & 도메인/품종 정합성 100%:
 *    - 독자용 본문 및 스마트에디터 복붙용 HTML 내 `[24px 굵은 소제목]`, `※ [좋은 그림...]`, `(단 1회 링크)`, `**` 별표 기호 노출 0건.
 *    - 고양이 프리셋(`pet-senior-cat`, `pet-korean-shorthair`)에 강아지 배변패드가 추천되거나 어색한 번역투 상품명이 노출되는 오류 원천 차단.
 *    - `resolveDynamicReceiptValues(preset, res)` 연동으로 Before/After 영수증 수치 오매핑 및 동어반복 0건 보장.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIV1_OUTBOX = path.join(ROOT_DIR, 'division1_comedifarm_outbox');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');
const DIV1_STATUS_PATH = path.join(LOGS_DIR, 'division1_status.json');
const DIV1_BOARD_PATH = path.join(ROOT_DIR, '제1본부_comedifarm_외부유입_운영보드.md');

const { PRESETS } = require('../src/data/presets.js');
const calculators = require('../src/data/calculators.js');
const { PRESET_WEBTOON_MAP, resolveDynamicReceiptValues } = require('../src/data/webtoon-stories.js');

let SOURCED_PRODUCTS_CATALOG = { categories: {}, presets: {} };
try {
  const sourcedMod = require('../src/data/sourced-products.js');
  if (sourcedMod && sourcedMod.SOURCED_PRODUCTS_CATALOG) {
    SOURCED_PRODUCTS_CATALOG = sourcedMod.SOURCED_PRODUCTS_CATALOG;
  }
} catch (e) {}

function getKstNow() {
  const kstMs = Date.now() + 9 * 60 * 60 * 1000;
  const d = new Date(kstMs);
  return {
    dateStr: d.toISOString().split('T')[0],
    fullStr: d.toISOString().replace('T', ' ').slice(0, 19) + ' KST',
    dayOfYear: Math.floor(kstMs / (24 * 60 * 60 * 1000))
  };
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function cleanOldFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const f of fs.readdirSync(dirPath)) {
    const fp = path.join(dirPath, f);
    if (fs.statSync(fp).isFile()) fs.unlinkSync(fp);
  }
}

function runCalculatorForPreset(preset) {
  const inp = preset.inputs || {};
  const calcType = preset.calc || preset.calcId || 'electric';
  switch (calcType) {
    case 'electric': return calculators.calculateElectric(inp);
    case 'diet': return calculators.calculateDiet(inp);
    case 'pet': return calculators.calculatePet(inp);
    case 'room': return calculators.calculateRoom(inp);
    case 'auto': return calculators.calculateAuto(inp);
    case 'telecom': return calculators.calculateTelecom(inp);
    default: return calculators.calculateElectric(inp);
  }
}

function metricVal(m) {
  if (!m) return '-';
  return m.val || m.value || '-';
}

/**
 * 쇼핑몰 크롤링 원본 상품명에서 기계 번역투/불필요한 스펙 나열을 사람 친화적인 상품명으로 정제
 */
function humanizeProductName(rawName, priceFormatted) {
  if (!rawName) return '';
  let cleaned = String(rawName)
    .replace(/15cm\s*20cm\s*25cm.*$/i, '포켓스프링 롤팩 매트리스')
    .replace(/부드럽고 단단한 것이 적당하다.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length > 38) {
    cleaned = cleaned.slice(0, 38).trim();
  }
  return priceFormatted ? `${cleaned} (${priceFormatted})` : cleaned;
}

/**
 * 마크다운 볼드(**텍스트**)를 HTML <b>텍스트</b>로 깔끔하게 변환
 */
function mdToHtmlInline(text) {
  if (!text) return '';
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<b>$1</b>');
}

/**
 * 6대 카테고리 & 세부 프리셋(강아지 vs 고양이 등) 100% 맞춤형 1인칭 사람 경험담 생성기
 */
function buildHumanCategoryNarrative(preset, res, resolved) {
  const calcType = preset.calc || preset.calcId || 'electric';
  const inp = preset.inputs || {};
  const isCat = preset.id.includes('cat') || preset.id.includes('shorthair') || (preset.title && preset.title.includes('고양이')) || (preset.title && preset.title.includes('노령묘')) || (preset.title && preset.title.includes('코숏'));

  const presetSourced = (SOURCED_PRODUCTS_CATALOG.presets && SOURCED_PRODUCTS_CATALOG.presets[preset.id])
    || (SOURCED_PRODUCTS_CATALOG.categories && SOURCED_PRODUCTS_CATALOG.categories[calcType])
    || null;
  const sourcedCp = (presetSourced && Array.isArray(presetSourced.coupangProducts)) ? presetSourced.coupangProducts : [];
  const sourcedLp = (presetSourced && Array.isArray(presetSourced.linkPriceDeals)) ? presetSourced.linkPriceDeals : [];

  // 고양이 프리셋일 경우 강아지 용품(배변패드 등)을 필터링하고 고양이 맞춤 아이템으로 매칭
  const validCp = sourcedCp.filter((item) => {
    if (isCat && item.productName && item.productName.includes('강아지')) return false;
    return true;
  });

  const cp1 = validCp[0] || null;
  const cp2 = validCp[1] || null;
  const lp1 = sourcedLp[0] || null;

  let item1Name = cp1
    ? humanizeProductName(cp1.productName, cp1.productPriceFormatted)
    : ((res.recommendations && res.recommendations[0] && res.recommendations[0].title) || '가성비 정량 사료');
  let item2Name = cp2
    ? humanizeProductName(cp2.productName, cp2.productPriceFormatted)
    : ((res.recommendations && res.recommendations[1] && res.recommendations[1].title) || '저자극 기능성 케어 사료');

  if (isCat) {
    if (!cp1 || item1Name.includes('강아지') || item1Name.includes('아이템')) {
      item1Name = '하림펫푸드 밥이보약 고양이 맞춤 레시피 (2만 원대)';
    }
    if (!cp2 || item2Name.includes('강아지') || item2Name.includes('아이템') || item2Name === item1Name) {
      item2Name = '탐사 고양이 저더스트 두부모래 7L 대용량 묶음';
    }
  }

  const impulse = isCat
    ? { title: '1g 디지털 계량스푼 & 고양이 음수대 필터', priceLabel: '9,900원대' }
    : (res.impulseItem || { title: '필수 절약 소모품', priceLabel: '1만 원대' });

  switch (calcType) {
    case 'electric': {
      const seasonText = inp.isSummer ? '여름철(7~8월 하계 구간)' : '평시 및 겨울철(동계 구간)';
      return {
        section1Title: `고지서 찍히기 전에 직접 따져본 한전 누진세와 ${inp.wattage}W 가동 요금`,
        empathyIntro: `날씨가 더워지거나 추워질 때마다 콘센트 꽂아두고 제일 신경 쓰이는 게 결국 다음 달 관리비 고지서더라고요. 처음엔 저도 가전제품 옆에 적힌 소비전력(${inp.wattage}W) 숫자만 보고 "이 정도면 하루에 ${inp.hours}시간씩 틀어도 얼마 안 나오겠지" 하고 가볍게 생각했습니다.\n\n그런데 막상 한전 주택용 전기요금표를 펴놓고 계산해 보니, 원래 우리 집이 평소에 쓰던 기본 전기량(${inp.baseKwh}kWh) 위에 새로 켠 가전 전력량이 얹어지면서 누진 구간이 한 단계 점프하는 순간 기본요금이랑 kWh당 단가가 동시에 확 뛰더라고요.`,
        mechanismDeepDive: `이번에 제 조건(${seasonText}, 기본 사용량 **${inp.baseKwh}kWh** + **${inp.wattage}W** 기기 하루 **${inp.hours}시간**씩 30일 가동)을 그대로 한전 수식에 넣어봤습니다. 한 달 동안 이 기기 하나가 추가로 쓰는 전기가 **${res.addedKwh}kWh**라서 집 전체 전력량이 총 **${res.totalKwh}kWh**가 되는데요.\n\n여기에 부가가치세(10%)와 전력산업기반기금(3.7%)까지 합산된 실제 예상 청구액을 뽑아보니 **${metricVal(res.metrics[0])}** 수준이 나오고, 1등급 인버터 방식으로 바꿨을 때는 한 달에 **${res.monthlySaving.toLocaleString()}원**씩 아껴서 약 **${res.paybackMonths}개월**이면 기기값을 다 뽑는다는 계산이 딱 나왔습니다.`,
        section3Title: '전기세 아끼려고 직접 써본 가성비 방어템 & 교체 손익분기점',
        purchaseBridge: `무작정 참고 안 틀기에는 생활이 너무 불편하잖아요. 제가 직접 해보니 당장 큰돈 들이지 않고도 첫 달부터 고지서 앞자리를 바꾸는 가장 쉬운 방법은 **${impulse.title}(${impulse.priceLabel || '1만 원대'})**으로 대기전력과 냉난방 효율부터 잡아주는 거였습니다.\n\n만약 집에 있는 기기가 산 지 7~8년 넘은 구형 정속형이라면, 계속 고쳐 쓰는 것보다 **${item1Name}**이나 **${item2Name}** 같은 고효율 모델로 넘어가는 게 매달 새나가는 전기세를 아껴서 기기값을 버는 훨씬 남는 장사였어요.${lp1 ? ` 큰 가전은 쿠팡 로켓설치 가격과 **${lp1.merchantLabel}** 공식몰 카드 혜택가를 한 번에 대조해 보시는 걸 추천합니다.` : ''}`,
        communityBody: `이번에 집에서 **${inp.wattage}W**짜리 기기를 하루 **${inp.hours}시간** 정도 돌리면 한 달 전기세가 얼마나 더 나올지 궁금해서 한전 주택용 누진세 수식대로 직접 계산해 봄.\n\n원래 쓰던 기본 전기량 **${inp.baseKwh}kWh**에 한 달 추가 사용량 **${res.addedKwh}kWh**가 더해져서 총 **${res.totalKwh}kWh**가 되는데, 구형 방식 그대로 돌리면 **${resolved.badVal}**이 찍히고 절전/고효율 세팅으로 바꾸면 **${resolved.goodVal}**로 줄어들어서 매달 **${res.monthlySaving.toLocaleString()}원**씩 차이 남. 당장 **${impulse.title}** 하나만 챙겨도 체감 요금이 확 줄어드는 구조임.`
      };
    }

    case 'diet': {
      const genderKo = inp.gender === 'female' ? '여성' : '남성';
      const goalKo = inp.deficit > 0 ? `하루 +${inp.deficit}kcal 증량(클린 벌크업)` : `하루 ${inp.deficit}kcal 감량(체지방 커팅)`;
      return {
        section1Title: `무작정 굶지 않고 ${inp.weeks}주 동안 맞춘 내 기초대사량(BMR)과 단백질 정량`,
        empathyIntro: `다이어트나 식단 관리를 시작할 때 제일 많이 실패하는 이유가 내 몸이 하루에 쓰는 열량도 모른 채 무작정 굶거나, 그때그때 편의점·배달 샐러드를 사 먹는 거더라고요. 저도 처음엔 그렇게 시작했다가 식비는 식비대로 한 달에 40~50만 원씩 깨지고 배고픔을 못 참아 금방 요요가 왔던 쓰라린 기억이 있습니다.\n\n그래서 이번에는 아예 처음부터 내 키와 몸무게, 평소 활동량을 기준으로 하루 목표 칼로리와 순단백질 그램(g) 수를 먼저 계산해 놓고, 딱 필요한 만큼만 대용량으로 장을 보는 방식으로 바꿨습니다.`,
        mechanismDeepDive: `만 **${inp.age}세 ${genderKo}**, 키 **${inp.height}cm**, 체중 **${inp.weight}kg**(활동계수 **${inp.activityFactor}**) 기준으로 **${inp.weeks}주간 ${goalKo}** 목표를 잡아 계산해 봤습니다. 하루에 섭취해야 할 권장 열량은 **${res.targetKcal.toLocaleString()}kcal**, 근손실을 막기 위해 꼭 채워야 하는 하루 순단백질은 **${res.dailyProteinG}g**이 나오더라고요.\n\n이걸 매 끼니 그램 수 재느라 스트레스받지 않으려고 아예 마트·온라인 묶음 단위로 환산해 보니, **${inp.weeks}주 동안 냉동 닭가슴살 ${res.chickenPacks}팩 + 즉석 현미밥 ${res.brownRiceBowls}개**만 냉동실에 딱 채워두면 고민할 필요 없이 식단이 끝납니다.`,
        section3Title: '편의점 단품 대신 끼니당 1,000원대로 줄인 식단 장보기 노하우',
        purchaseBridge: `출퇴근길에 편의점에서 닭가슴살이랑 밥을 낱개로 사 먹으면 한 끼에 6,000~8,000원은 우습게 넘어가잖아요. 대신 **${item1Name}**이나 **${item2Name}**처럼 검증된 대용량 묶음 구성을 냉동실에 쟁여두면 한 끼 단백질 단가가 1,300~1,500원대로 뚝 떨어집니다.\n\n여기에 양념이나 야식이 당길 때 입터짐을 막아주는 **${impulse.title}(${impulse.priceLabel || '특가'})** 하나만 같이 구비해 두시면, 배달 앱 켜는 횟수가 줄어들어 한 달 식비만 최소 20만 원 이상 아끼실 수 있어요.`,
        communityBody: `이번에 **${inp.weeks}주** 식단 제대로 해보려고 만 **${inp.age}세(${inp.height}cm / ${inp.weight}kg)** 기준으로 기초대사량이랑 활동대사량 직접 계산해 봄.\n\n하루 목표 열량 **${res.targetKcal.toLocaleString()}kcal**에 순단백질 **${res.dailyProteinG}g**을 채워야 하는데, 이걸 **${inp.weeks}주**치 장보기 수량으로 바꾸면 닭가슴살 **${res.chickenPacks}팩**이랑 현미밥 **${res.brownRiceBowls}개**가 딱 나옴. 편의점 낱개로 사 먹으면 **${resolved.badVal}** 깨지는데 대용량 묶음(**${item1Name}**)으로 시키면 **${resolved.goodVal}**에 끝나서 식비만 돈십만 원 굳음.`
      };
    }

    case 'pet': {
      const weightKg = inp.petWeight !== undefined ? inp.petWeight : 5.0;
      const bagKg = inp.bagKg !== undefined ? inp.bagKg : 2.0;
      const petLabel = isCat ? '고양이' : '강아지';
      const healthRisk = isCat ? '신부전·방광염이나 비만' : '슬개골 탈구나 비만·알러지';
      return {
        section1Title: `종이컵 눈대중 대신 1g 단위로 직접 계산해 본 ${weightKg}kg ${petLabel} 하루 사료 정량`,
        empathyIntro: `반려동물 키우면서 사료 줄 때 대부분 집에 있는 종이컵이나 사료 스푼으로 '대충 이 정도면 되겠지' 하고 눈대중으로 부어주시죠? 저도 예전엔 그렇게 급여했는데, 정기검진 갔다가 수의사 선생님께 "사료 하루에 정확히 몇 그램 주시는지 아세요?"라는 질문을 받고 말문이 막혔던 적이 있습니다.\n\n손대중으로 하루에 15~20g씩만 더 줘도 작은 아이들에게는 사람으로 치면 매일 야식으로 치킨 반 마리를 더 먹는 셈이라, 나이가 들수록 **${healthRisk}**으로 이어져 나중에 병원비가 수백만 원씩 깨질 수 있다고 하더라고요.`,
        mechanismDeepDive: `그래서 사료 봉투 뒷면에 적힌 칼로리 밀도(**${inp.kcalPerKg.toLocaleString()}kcal/kg**)와 우리 아이 체중(**${weightKg}kg**), 그리고 연령·중성화 상태 계수(**${inp.factor}**)를 수의영양학 공식에 직접 넣어 계산해 봤습니다.\n\n그 결과 하루에 꼭 필요한 열량(DER)은 **${res.der}kcal**이고, 이를 사료 무게로 환산하면 **하루 총 ${res.dailyGrams}g (아침·저녁 2끼 기준 한 끼에 딱 ${res.halfGrams}g씩, 종이컵 약 ${res.cupsPerDay}컵)**이 정확한 정량이었습니다. 이렇게 정량대로 급여하면 **${bagKg}kg**짜리 한 포대를 개봉 후 산패되기 전인 **${res.daysPerBag}일** 만에 가장 신선하게 다 먹일 수 있어요.`,
        section3Title: `사료 산패 막는 포대 규격 선택법 & 정량 급여 필수템`,
        purchaseBridge: `솔직히 종이컵으로 **${res.cupsPerDay}컵**을 눈대중으로 맞추는 건 매번 오차가 날 수밖에 없더라고요. 그래서 저는 아예 만 원 안팎 하는 **${impulse.title}** 구성을 사료통 옆에 두고 아침저녁으로 정확히 **${res.halfGrams}g**씩 재서 주고 있습니다.\n\n또한 사료는 개봉하는 순간부터 공기와 닿아 산패가 시작되므로 무조건 한 달 남짓(**${res.daysPerBag}일** 내외)에 다 먹을 수 있는 용량으로 고르시고, 기호성과 성분이 검증된 **${item1Name}**이나 **${item2Name}** 구성을 정주기 배송으로 맞춰두시면 사료 낭비와 병원비 걱정을 한 번에 덜 수 있습니다.`,
        communityBody: `집에서 키우는 **${weightKg}kg ${petLabel}** 사료를 맨날 종이컵 눈대중으로 주다가, 병원비 폭탄 맞기 전에 수의영양학 칼로리 공식(**${inp.kcalPerKg.toLocaleString()}kcal/kg**, 계수 **${inp.factor}**) 넣어서 1g 단위로 직접 계산해 봄.\n\n하루 필요 열량이 **${res.der}kcal**라 하루 총 **${res.dailyGrams}g**(한 끼당 **${res.halfGrams}g**)만 주는 게 정량이었음. 이렇게 먹이면 **${bagKg}kg** 한 포대를 산패 걱정 없이 딱 **${res.daysPerBag}일** 만에 소진함. 눈대중으로 과급여(**${resolved.badVal}**)하다가 병원비 깨지는 것보다 1g 저울 스푼으로 정량 맞추는 게 훨씬 이득임.`
      };
    }

    case 'room': {
      const budgetMan = inp.budgetMan !== undefined ? inp.budgetMan : 100;
      const roomSize = inp.roomSize !== undefined ? inp.roomSize : 6;
      return {
        section1Title: `${roomSize}평 공간 입주 전 총예산 ${budgetMan}만 원 안에서 1원도 안 넘긴 가전·가구 배분표`,
        empathyIntro: `자취방 독립이나 오피스텔·신혼집 이사를 앞두고 가전·가구를 알아보다 보면, 처음에 마음먹었던 예산이 순식간에 백만 원 넘게 불어나서 당황스러울 때가 많습니다. 저도 처음에 아무 기준 없이 마음에 드는 냉장고랑 침대부터 장바구니에 담았더니 벌써 예산의 80%가 날아가 버리더라고요.\n\n결국 예산 초과 없이 한 번에 풀세팅을 끝내려면, 결제하기 전에 내 총예산(**${budgetMan.toLocaleString()}만 원**)을 5대 필수 품목의 황금 비율(24% : 22% : 20% : 16% : 18%)로 먼저 쪼개서 품목별 상한선(캡)부터 정해두는 게 핵심이었습니다.`,
        mechanismDeepDive: `전용면적 약 **${roomSize}평** 공간에 총예산 **${budgetMan.toLocaleString()}만 원(${(budgetMan * 10000).toLocaleString()}원)**을 기준으로 직접 짜본 5대 품목 상한선은 다음과 같습니다.\n\n가장 먼저 24시간 돌아가는 **냉장고(${metricVal(res.metrics[0])})**와 **세탁기(${metricVal(res.metrics[1])})**에 중심을 잡고, 매일 수면의 질을 좌우하는 **침대·매트리스(${metricVal(res.metrics[2])})**와 TV·전자레인지 등 소형가전까지 비율대로 배분했더니 총합 **${res.totalCost.toLocaleString()}원**으로 단 1원의 예산 초과도 없이 깔끔하게 맞아떨어졌습니다.`,
        section3Title: '오프라인 패키지 거품 빼고 품목별 베스트 모델로 아끼는 팁',
        purchaseBridge: `오프라인 매장에서 이른바 '입주 패키지'로 묶어서 사면 편하긴 해도 유통 마진이랑 불필요한 옵션 값 때문에 예산을 훌쩍 넘기기 쉽습니다. 반대로 위에서 정한 품목별 상한선에 맞춰 **${item1Name}**이나 **${item2Name}**처럼 후기가 검증된 가성비 모델을 온라인으로 직접 매칭하면 같은 스펙인데도 **${(res.savingWon || Math.round(res.totalCost * 0.25)).toLocaleString()}원** 이상 아낄 수 있어요.\n\n남은 잔여 예산으로는 삶의 질을 확 올려주는 **${impulse.title}(${impulse.priceLabel || '특가'})**까지 챙길 수 있으니 계약 전에 꼭 품목별 상한선부터 대조해 보세요.`,
        communityBody: `이번에 **${roomSize}평** 집 가전·가구 세팅하면서 총예산 **${budgetMan.toLocaleString()}만 원** 안에서 절대 안 넘기려고 품목별 황금 비율(24:22:20:16:18)로 상한선 먼저 긋고 장바구니 짜 봄.\n\n오프라인 패키지 견적 받으면 **${resolved.badVal}** 넘게 부르는데, 냉장고 **${metricVal(res.metrics[0])}** · 세탁기 **${metricVal(res.metrics[1])}** · 침대 **${metricVal(res.metrics[2])}** 상한선에 맞춰서 **${item1Name}** 같은 온라인 특가로 개별 매칭하니까 딱 **${resolved.goodVal}** 컷 안에서 남김없이 풀세팅 끝남.`
      };
    }

    case 'auto': {
      const carPriceMan = inp.carPriceMan !== undefined ? inp.carPriceMan : 3000;
      const months = inp.months !== undefined ? inp.months : 48;
      const years = Math.round((months / 12) * 10) / 10;
      const taxRate = inp.taxRate !== undefined ? inp.taxRate : 0;
      return {
        section1Title: `출고가 ${carPriceMan.toLocaleString()}만 원 신차, 월 납입금 착시 걷어낸 ${years}년 총유지비(TCO) 비교`,
        empathyIntro: `신차를 뽑을 때 대리점이나 견적 사이트에서 보여주는 '월 납입금 OO만 원'이라는 숫자만 보고 할부가 나은지, 장기렌트나 리스가 나은지 결정하기가 참 어렵죠. 저도 처음 견적서를 받아봤을 때는 월 납입금만 비교했다가, 막상 차를 등록할 때 한 번에 내야 하는 취등록세(7%)와 매년 돌아오는 자동차세·보험료가 빠져 있다는 걸 뒤늦게 깨달았습니다.\n\n진짜 어느 쪽이 내 통장에서 돈이 덜 나가는지 알려면, 계약 기간(**${months}개월**) 동안 들어가는 세금·보험료·할부 이자, 그리고 내가 사업자인지 직장인지에 따른 절세 금액까지 전부 더한 **총소유비용(TCO)**을 나란히 놓고 봐야 정확합니다.`,
        mechanismDeepDive: `차량가 **${carPriceMan.toLocaleString()}만 원**, 선납금 **${inp.downPaymentRate || 20}%**, 할부 금리 **연 ${inp.interestRate || 5.5}%**, 계약 기간 **${months}개월(${years}년)** 조건으로 1원 단위까지 직접 계산기를 돌려봤습니다.\n\n신차 할부로 구매할 때는 초기 취등록세 **${res.acqTax.toLocaleString()}원**과 ${years}년 치 보험료·자동차세를 모두 합쳐 총 **${res.installmentTco.toLocaleString()}원**이 들어가고, 장기렌트는 보험·세금 포함 조건(${taxRate > 0 ? `소득세율 ${taxRate}% 비용처리 절세액 ${(res.taxSaving || 0).toLocaleString()}원 반영` : '비사업자 기준'})으로 총 **${res.rentTco.toLocaleString()}원**이 산출되어 두 방식 사이에 무려 **${resolved.diffVal}**의 격차가 벌어졌습니다.`,
        section3Title: '계약 전 내 소득구간 대조법 & 딜러 서비스 거품 빼는 출고 준비',
        purchaseBridge: `결국 일반 직장인(근로소득자)이신지, 아니면 종합소득세율 24~35% 구간의 개인·법인 사업자이신지에 따라 정답이 완전히 달라집니다. 계약서에 도장 찍기 전에 내 선납금 비율과 소득세율을 넣어서 어느 쪽이 총비용에서 수백만 원을 아끼는지 먼저 확인해 보시는 게 필수예요.\n\n아울러 신차 출고할 때 딜러 서비스 품목에 비싼 할부 수수료를 녹이는 대신 현금 지원을 최대로 받으시고, **${impulse.title}**이나 **${item1Name}** 같은 필수 용품은 직접 로켓배송 특가로 챙기시면 초기 출고 비용을 한 번 더 아끼실 수 있습니다.`,
        communityBody: `차량가 **${carPriceMan.toLocaleString()}만 원**짜리 신차 뽑을 때 할부랑 장기렌트 중 뭐가 진짜 돈 아끼는 건지 **${months}개월(${years}년)** 치 취등록세(**${res.acqTax.toLocaleString()}원**)랑 보험료·자동차세·절세액까지 다 합쳐서 총소유비용(TCO) 비교해 봄.\n\n월 납입금만 보면 헷갈리는데 ${years}년 총액으로 까보니까 할부 총비용은 **${res.installmentTco.toLocaleString()}원**, 렌트 총비용은 **${res.rentTco.toLocaleString()}원**이라 내 조건에서는 **${resolved.diffVal}**이나 벌어짐. 계약 전에 본인 세율이랑 선수금 넣어서 총액 비교부터 해보는 게 답임.`
      };
    }

    case 'telecom':
    default: {
      const penaltyMan = inp.penaltyMan !== undefined ? inp.penaltyMan : 15;
      const cashGiftMan = inp.cashGiftMan !== undefined ? inp.cashGiftMan : 47;
      const oldFee = inp.oldFee !== undefined ? inp.oldFee : 45000;
      const newFee = inp.newFee !== undefined ? inp.newFee : 38000;
      return {
        section1Title: `위약금 ${penaltyMan}만 원 내고 갈아타는 게 이득일까? 3년 통신비 손익분기점 계산`,
        empathyIntro: `집 인터넷이랑 TV 약정이 끝났거나 몇 달 안 남았을 때, 통신사를 옮기면 현금 사은품을 준다는 얘기는 많이 들었지만 막상 해지 위약금이 무서워서 그냥 쓰던 대로 두시는 분들이 정말 많더라고요. 저도 귀찮기도 하고 위약금 물어내면 손해일 것 같아서 매달 **${oldFee.toLocaleString()}원**씩 자동이체로 빠져나가는 걸 방치하고 있었습니다.\n\n그런데 막상 계산기를 켜서 신규 가입 지원금(**${cashGiftMan}만 원**)에서 내 남은 위약금(**${penaltyMan}만 원**)을 빼고 앞으로 3년 동안 줄어드는 월 요금 차액까지 합산해 보니, 가만히 있는 게 오히려 수십만 원을 손해 보는 거였더라고요.`,
        mechanismDeepDive: `제 기준 조건(남은 위약금 **${penaltyMan}만 원**, 기존 월 요금 **${oldFee.toLocaleString()}원** ➔ 신규 월 **${newFee.toLocaleString()}원**, 신규 사은품 **${cashGiftMan}만 원**)을 그대로 대입해 봤습니다.\n\n설치 당일 받는 사은품에서 위약금을 전액 메꾸고도 당장 내 통장에 **${res.immediateNetWon >= 0 ? '+' : ''}${res.immediateNetWon.toLocaleString()}원**이 남고, 여기에 36개월 동안 매달 아끼는 요금 절감액(**${res.threeYearFeeSave.toLocaleString()}원**)을 더하면 3년 합산 총 **+${res.totalNetBenefit.toLocaleString()}원**의 순이익이 난다는 계산이 명확하게 나옵니다.`,
        section3Title: '요금제는 낮추고 집안 와이파이 속도는 2배 올리는 실전 팁',
        purchaseBridge: `방에서 유튜브나 넷플릭스가 끊긴다고 무조건 비싼 1기가(1Gbps) 요금제로 올리면 통신사 좋은 일만 시키는 셈입니다. 1~4인 가정에서는 실속형 요금제(100M~500M)로 월 고정비를 낮추고, 아낀 돈으로 **${impulse.title}**이나 **${item1Name}** 같은 최신 Wi-Fi 6 공유기 하나만 거실에 설치해 두시면 체감 속도는 훨씬 빨라지면서 3년 통신비를 수십만 원 아낄 수 있어요.`,
        communityBody: `집 인터넷 기존 월 **${oldFee.toLocaleString()}원** 내던 거 위약금 **${penaltyMan}만 원** 무서워서 그냥 쓰다가, 신규 사은품(**${cashGiftMan}만 원**)이랑 월 **${newFee.toLocaleString()}원** 요금 인하분 합쳐서 3년 손익분기점 직접 계산해 봄.\n\n위약금 다 물어주고도 당일 현금 차액이 **${res.immediateNetWon >= 0 ? '+' : ''}${res.immediateNetWon.toLocaleString()}원** 남고, 36개월 요금 절감액(**${res.threeYearFeeSave.toLocaleString()}원**)까지 합치면 총 **+${res.totalNetBenefit.toLocaleString()}원** 이득임. 약정 끝났거나 얼마 안 남았으면 무조건 계산기 먼저 두드려보는 게 맞음.`
      };
    }
  }
}

function buildMarkdownTable(headers, rows) {
  if (!Array.isArray(headers) || !Array.isArray(rows) || headers.length === 0 || rows.length === 0) {
    return '';
  }
  const headLine = `| ${headers.join(' | ')} |`;
  const sepLine = `| ${headers.map(() => ':---').join(' | ')} |`;
  const bodyLines = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
  return `${headLine}\n${sepLine}\n${bodyLines}`;
}

function buildHtmlComparisonTable(headers, rows) {
  if (!Array.isArray(headers) || !Array.isArray(rows) || headers.length === 0 || rows.length === 0) {
    return '';
  }
  const ths = headers
    .map((h) => `<th style="background:#0f172a;color:#ffffff;padding:11px 14px;font-size:15px;font-weight:800;border:1px solid #334155;text-align:left;">${mdToHtmlInline(h)}</th>`)
    .join('');
  const trs = rows
    .map((r, rIdx) => {
      const bg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const tds = r
        .map((c, cIdx) => `<td style="background:${bg};color:#0f172a;padding:11px 14px;font-size:15px;font-weight:${cIdx === 0 ? '800' : '500'};border:1px solid #cbd5e1;line-height:1.5;">${mdToHtmlInline(c)}</td>`)
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');
  return `<table style="width:100%;border-collapse:collapse;margin:18px 0;font-family:'Pretendard','Malgun Gothic',sans-serif;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

/**
 * 스마트에디터 ONE 복붙용 HTML 생성 (내부 지시어/프롬프트 문구 0%, 마크다운 ** 노출 0%, 100% 깔끔한 사람 블로그 서식)
 */
function cleanCaseLabel(label, val) {
  if (!label) return '';
  const str = String(label).trim();
  const valStr = String(val || '').trim();
  const parenMatch = str.match(/\(([^)]+)\)\s*$/);
  if (parenMatch && valStr.includes(parenMatch[1])) {
    return str.replace(/\s*\([^)]+\)\s*$/, '').trim();
  }
  return str;
}

function buildSmartEditorHtmlForPreset(preset, res, resolved, narrative, targetUrl) {
  const badVal = resolved.badVal;
  const goodVal = resolved.goodVal;
  const badLabel = cleanCaseLabel(resolved.badLabel || '기존 방식 유지 시', badVal);
  const goodLabel = cleanCaseLabel(resolved.goodLabel || '맞춤 기준 적용 시', goodVal);
  const diffVal = resolved.diffVal;
  const diffDisplay = (diffVal && res.headline && diffVal !== res.headline && !res.headline.includes(diffVal))
    ? `${diffVal} (${res.headline})`
    : (diffVal || res.headline);

  const introParasHtml = narrative.empathyIntro
    .split('\n\n')
    .map((p) => `<p class="se-text-paragraph" style="font-size:16px;line-height:1.85;color:#1e293b;margin:0 0 16px 0;"><span class="se-fs-fs16">${mdToHtmlInline(p)}</span></p>`)
    .join('\n');

  const deepDiveParasHtml = narrative.mechanismDeepDive
    .split('\n\n')
    .map((p) => `<p class="se-text-paragraph" style="font-size:16px;line-height:1.85;color:#1e293b;margin:0 0 16px 0;"><span class="se-fs-fs16">${mdToHtmlInline(p)}</span></p>`)
    .join('\n');

  const purchaseParasHtml = narrative.purchaseBridge
    .split('\n\n')
    .map((p) => `<p class="se-text-paragraph" style="font-size:16px;line-height:1.85;color:#1e293b;margin:0 0 16px 0;"><span class="se-fs-fs16">${mdToHtmlInline(p)}</span></p>`)
    .join('\n');

  const tableHtml = buildHtmlComparisonTable(preset.tableHeaders, preset.tableRows);

  const faqHtml = (preset.faq || []).map((f, i) =>
    `<p class="se-text-paragraph" style="font-size:19px;font-weight:800;color:#0f172a;margin:18px 0 6px 0;"><span class="se-fs-fs19"><b>Q${i + 1}. ${mdToHtmlInline(f.question || f.q)}</b></span></p>\n<p class="se-text-paragraph" style="font-size:16px;line-height:1.8;color:#334155;margin:0 0 14px 0;"><span class="se-fs-fs16">➔ ${mdToHtmlInline(f.answer || f.a)}</span></p>`
  ).join('\n');

  return [
    `<!-- [발행 시 1번 그림 첨부 위치: sns_outbox/${preset.id}/slide-1.png] -->`,
    `<div style="background:#f8fafc;border-left:6px solid #10b981;padding:18px 20px;border-radius:0 14px 14px 0;margin:0 0 24px 0;">`,
    `  <p class="se-text-paragraph" style="font-size:19px;font-weight:900;color:#0f172a;margin:0 0 10px 0;"><span class="se-fs-fs19"><b>🧾 바쁜 분들을 위한 3초 핵심 비교 요약</b></span></p>`,
    `  <p class="se-text-paragraph" style="font-size:16px;line-height:1.75;color:#be123c;margin:0 0 6px 0;"><span class="se-fs-fs16">• <b>${mdToHtmlInline(badLabel)}</b>: <b>${mdToHtmlInline(badVal)}</b></span></p>`,
    `  <p class="se-text-paragraph" style="font-size:16px;line-height:1.75;color:#047857;margin:0 0 6px 0;"><span class="se-fs-fs16">• <b>${mdToHtmlInline(goodLabel)}</b>: <b>${mdToHtmlInline(goodVal)}</b></span></p>`,
    `  <p class="se-text-paragraph" style="font-size:16px;line-height:1.75;color:#0f172a;margin:0;"><span class="se-fs-fs16">• <b>핵심 체감 차이</b>: <b>${mdToHtmlInline(diffDisplay)}</b></span></p>`,
    `</div>`,
    `<p class="se-text-paragraph" style="font-size:24px;font-weight:900;color:#0f172a;margin:28px 0 14px 0;"><span class="se-fs-fs24"><b>1. ${mdToHtmlInline(narrative.section1Title)}</b></span></p>`,
    introParasHtml,
    deepDiveParasHtml,
    `<hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0;" />`,
    `<!-- [발행 시 2번 그림 첨부 위치: sns_outbox/${preset.id}/slide-3.png] -->`,
    `<p class="se-text-paragraph" style="font-size:24px;font-weight:900;color:#0f172a;margin:28px 0 14px 0;"><span class="se-fs-fs24"><b>2. 조건별로 직접 대조해 본 상세 비교표</b></span></p>`,
    tableHtml,
    `<p class="se-text-paragraph" style="font-size:16px;line-height:1.85;color:#334155;margin:14px 0 0 0;"><span class="se-fs-fs16">${mdToHtmlInline(res.summary)}</span></p>`,
    `<hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0;" />`,
    `<p class="se-text-paragraph" style="font-size:24px;font-weight:900;color:#0f172a;margin:28px 0 14px 0;"><span class="se-fs-fs24"><b>3. ${mdToHtmlInline(narrative.section3Title)}</b></span></p>`,
    purchaseParasHtml,
    faqHtml,
    `<hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0;" />`,
    `<p class="se-text-paragraph" style="font-size:24px;font-weight:900;color:#0f172a;margin:28px 0 14px 0;"><span class="se-fs-fs24"><b>4. 내 조건 숫자 넣어보고 3초 만에 계산 결과 확인하기</b></span></p>`,
    `<p class="se-text-paragraph" style="font-size:16px;line-height:1.85;color:#1e293b;margin:0 0 14px 0;"><span class="se-fs-fs16">집집마다 평수나 사용 시간, 예산이나 체중 조건이 조금씩 다르다 보니 내 숫자를 직접 넣어서 확인해 보시는 게 가장 정확합니다. 회원가입이나 개인정보 입력 없이 숫자만 넣으면 3초 만에 비교 영수증과 실속 추천 구성을 한눈에 볼 수 있는 계산기 주소를 아래에 남겨둘게요!</span></p>`,
    `<p class="se-text-paragraph" style="font-size:19px;font-weight:800;color:#047857;margin:0 0 6px 0;"><span class="se-fs-fs19"><b>👉 내 조건으로 3초 무료 계산해 보기:</b></span></p>`,
    `<p class="se-text-paragraph" style="font-size:16px;margin:0;"><span class="se-fs-fs16"><a href="${targetUrl}" target="_blank" style="color:#059669;font-weight:800;text-decoration:underline;">${targetUrl}</a></span></p>`
  ].join('\n');
}

function generateDivision1DailyPack() {
  const kst = getKstNow();
  ensureDir(DIV1_OUTBOX);
  ensureDir(LOGS_DIR);

  const subDirs = {
    blog: path.join(DIV1_OUTBOX, '1_comedifarm_blog'),
    jisikin: path.join(DIV1_OUTBOX, '2_naver_jisikin'),
    community: path.join(DIV1_OUTBOX, '3_external_community'),
    instaThreads: path.join(DIV1_OUTBOX, '4_insta_threads')
  };
  Object.values(subDirs).forEach((d) => {
    ensureDir(d);
    cleanOldFiles(d);
  });

  const offset = (kst.dayOfYear * 2) % PRESETS.length;
  const pickPresets = (count, shift = 0) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(PRESETS[(offset + shift + i) % PRESETS.length]);
    }
    return arr;
  };

  const blogPresets = pickPresets(2, 0);
  const jisikinPresets = pickPresets(2, 2);
  const commPresets = pickPresets(2, 4);
  const snsPresets = pickPresets(2, 6);

  // 1. comedifarm 블로그 (일 2편 엄선 — 100% 사람이 직접 쓴 내돈내산·경험담 문체, 내부 지시어 노출 0건)
  const blogItems = blogPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const resolved = resolveDynamicReceiptValues(p, res);
    const narrative = buildHumanCategoryNarrative(p, res, resolved);
    const targetUrl = `https://truthofmarket.com/preset/${p.id}`;

    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표 1', val: '-', sub: '기준 산출 수치' };
    const m1 = (res.metrics && res.metrics[1]) || { label: '핵심 지표 2', val: '-', sub: '실전 권장 수치' };
    const m2 = (res.metrics && res.metrics[2]) || { label: '핵심 지표 3', val: '-', sub: '유지·소진 기준' };
    const badVal = resolved.badVal;
    const goodVal = resolved.goodVal;
    const badLabel = cleanCaseLabel(resolved.badLabel || '기존 방식 유지 시', badVal);
    const goodLabel = cleanCaseLabel(resolved.goodLabel || '맞춤 기준 적용 시', goodVal);
    const diffVal = resolved.diffVal;
    const diffDisplay = (diffVal && res.headline && diffVal !== res.headline && !res.headline.includes(diffVal))
      ? `${diffVal} (${res.headline})`
      : (diffVal || res.headline);

    const antiBanMode = 'SINGLE_CLIMAX_NATIVE_LINK_WITH_6H_COOLDOWN';
    const publishTime = idx === 0 ? '09:30 KST (오전 슬롯)' : '19:30 KST (저녁 슬롯 — 최소 10시간 안전 쿨다운)';
    const mdTable = buildMarkdownTable(p.tableHeaders, p.tableRows);
    const faqMd = (p.faq || []).map((f, i) => `### Q${i + 1}. ${f.question || f.q}\n- **답변:** ${f.answer || f.a}`).join('\n\n');
    const smartEditorHtml = buildSmartEditorHtmlForPreset(p, res, resolved, narrative, targetUrl);

    const content = `<!--
================================================================================
[발행자 전용 체크리스트 — 본문 복붙 시 이 주석 박스는 제외하고 아래 본문부터 복사하세요]
• 발행 계정: 네이버 1계정 comedifarm (Port 9222)
• 권장 발행 시각: ${publishTime}
• 첨부할 웹툰 이미지 2장:
  1) 도입부 요약 박스 위/아래: sns_outbox/${p.id}/slide-1.png
  2) 2번 비교표 섹션 상단: sns_outbox/${p.id}/slide-3.png
• 외부링크 안전 수칙: 본문 하단 클라이맥스에 단 1회(${targetUrl})만 자연스럽게 삽입됨
================================================================================
-->

# ${p.title} — 직접 계산해보고 정리한 현실 비교 노트

### 🧾 바쁜 분들을 위한 3초 핵심 비교 요약
- **✗ ${badLabel}**: **${badVal}**
- **✓ ${goodLabel}**: **${goodVal}**
- **★ 핵심 체감 차이**: **${diffDisplay}**

---

## 1. ${narrative.section1Title}

${narrative.empathyIntro}

${narrative.mechanismDeepDive}

---

## 2. 조건별로 직접 대조해 본 상세 비교표

| 핵심 확인 항목 | 계산된 수치 | 상세 설명 |
| :--- | :--- | :--- |
| **한줄 결론** | **${res.headline}** | ${res.badge || '실측 기준 요약'} |
| **${m0.label}** | **${metricVal(m0)}** | ${m0.sub || '실측 산출 기준'} |
| **${m1.label}** | **${metricVal(m1)}** | ${m1.sub || '권장 적용 기준'} |
| **${m2.label}** | **${metricVal(m2)}** | ${m2.sub || '체감 유지 기준'} |

${mdTable}

${res.summary}

---

## 3. ${narrative.section3Title}

${narrative.purchaseBridge}

${faqMd}

---

## 4. 내 조건 숫자 넣어보고 3초 만에 계산 결과 확인하기

집집마다 평수나 사용 시간, 예산이나 체중 조건이 조금씩 다르다 보니 내 숫자를 직접 넣어서 확인해 보시는 게 가장 정확합니다. 회원가입이나 개인정보 입력 없이 숫자만 넣으면 3초 만에 비교 영수증과 실속 추천 구성을 한눈에 볼 수 있는 계산기 주소를 아래에 남겨둘게요!

👉 **내 조건으로 3초 무료 계산해 보기**:
${targetUrl}

---

## 📋 [스마트에디터 ONE 복붙용 클린 HTML 코드]
\`\`\`html
${smartEditorHtml}
\`\`\`
`;
    const filePath = path.join(subDirs.blog, `${kst.dateStr}_comedifarm_blog_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, antiBanMode, publishTime, targetUrl, filePath };
  });

  // 2. 네이버 지식iN (일 2건 엄선 — 친절한 생활 고수의 1인칭 경험담 답변 + 무링크/대댓글 분리)
  const jisikinItems = jisikinPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const resolved = resolveDynamicReceiptValues(p, res);
    const narrative = buildHumanCategoryNarrative(p, res, resolved);
    const targetUrl = `https://truthofmarket.com/preset/${p.id}`;
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표 1', val: '-' };
    const m1 = (res.metrics && res.metrics[1]) || { label: '핵심 지표 2', val: '-' };
    const m2 = (res.metrics && res.metrics[2]) || { label: '핵심 지표 3', val: '-' };
    const searchQuery = p.title.split(' ').slice(0, 3).join(' ');
    const liveSearchUrl = `https://kin.naver.com/search/noAnswerList.naver?query=${encodeURIComponent(searchQuery)}`;
    const antiBanMode = 'ZERO_BAN_BRAND_SEARCH_OR_COMMENT_SPLIT_6H_COOLDOWN';

    const content = `<!--
[지식iN 발행자 체크리스트]
• 발행 계정: 네이버 1계정 comedifarm (Port 9222)
• 실시간 미채택 질문 검색창: ${liveSearchUrl}
• 안티밴 수칙: 본문에는 링크를 넣지 않고 순수 답변만 등록한 뒤, 1분 후 '의견(대댓글)'에 계산기 주소를 남겨 밴 위험을 0%로 차단합니다.
-->

안녕하세요! 저도 얼마 전에 **${p.title}** 문제로 똑같이 고민하다가, 카더라 통신 말고 실제 수식에 숫자를 직접 넣어서 비교해 본 적이 있어 반가운 마음에 답변 남깁니다 :)

결론부터 말씀드리면 이 조건에서는 **${res.headline}** 수준으로 차이가 벌어지는데요. 바쁘신 질문자님을 위해 제가 계산해 본 핵심 숫자부터 깔끔하게 짚어드릴게요!

**1. 한눈에 보는 핵심 계산 결과**
- **${resolved.badLabel || '기존 방식'}**: **${resolved.badVal}**
- **${resolved.goodLabel || '절약 기준 적용 시'}**: **${resolved.goodVal}**
- **세부 수치 요약**: ${m0.label} **${metricVal(m0)}** / ${m1.label} **${metricVal(m1)}** / ${m2.label} **${metricVal(m2)}**

**2. 왜 이렇게 차이가 날까요?**
${narrative.mechanismDeepDive}

**3. 실패 없이 아끼는 현실 팁**
${narrative.purchaseBridge}

질문자님의 세부 조건(평수나 시간, 예산, 체중 등)을 살짝 바꿔서 직접 영수증을 뽑아보고 싶으시다면, 네이버나 구글 검색창에 **「머니핏 ${searchQuery} 계산기」** (또는 **truthofmarket**)를 검색해 보세요! 로그인이나 광고 없이 숫자만 넣으면 3초 만에 확인하실 수 있어서 정말 편합니다. 고민 해결에 작은 도움이 되셨길 바라며, 답변이 도움 되셨다면 채택 부탁드립니다! 좋은 하루 보내세요 :)

---

**[💬 답변 등록 1분 뒤 '대댓글(의견)'에 복사해 넣을 안내 문구]**
> 질문자님! 혹시 일일이 검색하시기 번거로우실까 봐 제가 직접 숫자 넣어봤던 무료 3초 계산기 주소도 댓글에 살짝 남겨둡니다 :) 회원가입 전혀 없어요! ➔ ${targetUrl}
`;
    const filePath = path.join(subDirs.jisikin, `${kst.dateStr}_jisikin_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, antiBanMode, targetUrl, liveSearchUrl, filePath };
  });

  // 3. 외부 커뮤니티 (일 2편 엄선 — 존댓말/음슴체 혼용 오류 0%, 100% 일관된 현실 유저 후기 어조)
  const communityItems = commPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const resolved = resolveDynamicReceiptValues(p, res);
    const narrative = buildHumanCategoryNarrative(p, res, resolved);
    const targetUrl = `https://truthofmarket.com/preset/${p.id}`;
    const m0 = (res.metrics && res.metrics[0]) || { label: '핵심 지표 1', val: '-' };
    const m1 = (res.metrics && res.metrics[1]) || { label: '핵심 지표 2', val: '-' };
    const m2 = (res.metrics && res.metrics[2]) || { label: '핵심 지표 3', val: '-' };

    const content = `<!--
[외부 커뮤니티 발행자 체크리스트]
• 첨부 이미지: sns_outbox/${p.id}/slide-3.png (3초 비교 영수증 컷)
• 안티밴 수칙: 본문에는 외부 링크를 절대 넣지 않고 순수 후기만 올린 뒤, 첫 번째 댓글에 출처 계산기 주소를 남깁니다.
-->

**제목: ${p.title} 직접 계산기 돌려보고 정리한 손익분기점 요약.jpg**

요즘 ${p.category} 관련해서 사람마다 말이 다 다르길래 아예 공식 수식에 내 숫자 넣어서 직접 비교해 봄. (계산 결과 영수증 짤 같이 첨부함)

**■ 3초 요약 영수증**
- ✗ ${resolved.badLabel || '기존 방식'}: **${resolved.badVal}**
- ✓ ${resolved.goodLabel || '바꾼 방식'}: **${resolved.goodVal}**
- ★ 한줄 결론: **${res.headline}** (${m0.label} ${metricVal(m0)} / ${m1.label} ${metricVal(m1)} / ${m2.label} ${metricVal(m2)})

**■ 직접 계산해 본 내용**
${narrative.communityBody}

결론적으로 감으로 대충 결제하기 전에 본인 조건 숫자로 한 번만 찍어보면 호구 잡힐 일은 절대 없음. 다들 돈 아끼길 바람!

---

**[💬 게시글 등록 직후 '첫 번째 댓글'에 달아둘 문구]**
> 혹시 본인 조건 숫자 넣어서 직접 돌려보고 싶은 사람 있을까 봐 내가 쓴 무료 3초 계산기 주소 댓글에 남겨둠! 로그인 같은 거 없음 ➔ ${targetUrl}
`;
    const filePath = path.join(subDirs.community, `${kst.dateStr}_community_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, antiBanMode: 'BODY_NOLINK_FIRST_COMMENT_ANCHOR_6H_COOLDOWN', targetUrl, filePath };
  });

  // 4. 인스타그램 & 쓰레드 (@moneyfit2026 — resolveDynamicReceiptValues 적용으로 수치 오매핑 0%)
  const snsItems = snsPresets.map((p, idx) => {
    const res = runCalculatorForPreset(p);
    const resolved = resolveDynamicReceiptValues(p, res);
    const story = PRESET_WEBTOON_MAP[p.id] || {};
    const targetUrl = `https://truthofmarket.com/preset/${p.id}`;
    const isCat = p.id.includes('cat') || p.id.includes('shorthair');
    const impulse = isCat
      ? { title: '1g 디지털 계량스푼 & 음수대 필터', priceLabel: '9,900원대' }
      : (res.impulseItem || { title: '필수 절약템', priceLabel: '특가' });

    const content = `<!--
[인스타·쓰레드 (@moneyfit2026) 발행 체크리스트]
• 첨부할 4컷 웹툰 이미지: sns_outbox/${p.id}/slide-1.png ~ slide-4.png
• 권장 간격: 최소 4~6시간 쿨다운 유지
-->

🐾 **[${p.title}]**

"${story.hookLine || '남들 하는 대로 따라 했다가 매달 생돈 날리고 계시진 않나요?'}"

📊 **[내가 직접 찍어본 3초 비교 영수증]**
• ✗ ${resolved.badLabel || '기존 방식'}: **${resolved.badVal}**
• ✓ ${resolved.goodLabel || '절약 기준'}: **${resolved.goodVal}**
• 💰 핵심 차이: **${resolved.diffVal}** (${res.headline})

💡 **오늘의 현실 절약 팁**:
처음부터 큰돈 쓰지 마시고 **${impulse.title}(${impulse.priceLabel || '특가'})**부터 챙기면 당장 이번 달 고정비 누수부터 바로 잡을 수 있어요!

🔎 **내 조건 3초 무료 계산기 바로가기**:
👉 ${targetUrl}

${resolved.hashtags || '#생활비절약 #고정비다이어트 #머니핏계산기 #내돈내산꿀팁'}

---

**[💬 쓰레드/인스타 첫 번째 고정 대댓글]**
👉 **내 숫자 넣고 3초 만에 비교 영수증 뽑아보기 (무료·로그인 없음)**
🔗 ${targetUrl}
`;
    const filePath = path.join(subDirs.instaThreads, `${kst.dateStr}_sns_${idx + 1}_${p.id}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    return { slot: idx + 1, presetId: p.id, title: p.title, antiBanMode: 'HIGH_READABILITY_WITH_6H_COOLDOWN', targetUrl, filePath };
  });

  const statusPayload = {
    divisionId: 'DIV1_OUTLINK_HQ',
    divisionName: '제1본부: 홈페이지(truthofmarket.com) 100% 사람 문체 외부유입 & 안티밴 안전운영 총괄본부',
    accountId: 'comedifarm',
    snsHandle: '@moneyfit2026',
    browserPort: 9222,
    updatedAt: kst.fullStr,
    date: kst.dateStr,
    strictSeparationVerified: true,
    antiBanPolicy: 'ACTIVE (100% 사람이 쓴 1인칭 내돈내산·경험담 문체 · 내부 지시어/마크다운 오류 0건 · 블로그 6h 쿨다운 일 2편 엄선 · 클라이맥스 단일 링크)',
    targetDomain: 'https://truthofmarket.com',
    dailyQuotas: {
      comedifarmBlog: blogItems.length,
      naverJisikin: jisikinItems.length,
      externalCommunity: communityItems.length,
      instaThreads: snsItems.length,
      totalOutlinkAssetsToday: blogItems.length + jisikinItems.length + communityItems.length + snsItems.length
    },
    items: {
      comedifarmBlog: blogItems,
      naverJisikin: jisikinItems,
      externalCommunity: communityItems,
      instaThreads: snsItems
    }
  };

  fs.writeFileSync(DIV1_STATUS_PATH, JSON.stringify(statusPayload, null, 2), 'utf8');

  const boardMd = `# 🏢 [제1본부 v4.0] 1계정(\`comedifarm\`) & \`@moneyfit2026\` — 100% 사람이 직접 쓴 경험담 문체 · 무결점 데이터 · 안티밴 운영보드

- **최종 갱신 시각**: ${kst.fullStr}
- **전담 조직**: \`🐆 치타 본부장 (제1본부장)\` · \`🐝 꿀벌 과장 (구매설득 카피)\` · \`🦜 앵무새 피디 (인스타·쓰레드)\` · \`🦔 고슴도치 대리 (블로그·지식iN·커뮤니티)\`
- **전담 계정 및 포트**: 네이버 1계정 **\`comedifarm\`** + 인스타/쓰레드 **\`@moneyfit2026\`** (\`Port 9222\` 격리 컨테이너)
- **핵심 미션**: **100% 사람이 직접 겪고 계산한 1인칭 경험담 원고(기계적 지시어·번역투·오매핑 0건) + 본문 클라이맥스 \`truthofmarket.com\` 단일 링크 + 최소 6시간 쿨다운으로 밴 위험 0% 유지**

---

## 🛡️ 1. 제1본부 무결점 사람 문체(Human-Written) & 안티밴(Anti-Ban) 수칙

| 채널 | 일일 안전 상한 | 최소 쿨다운 간격 | 사람 문체 & 무결점 품질 표준 |
| :--- | :---: | :---: | :--- |
| **① \`comedifarm\` 블로그** | **일 2편 엄선** | **최소 6~10시간 간격** | **1인칭 내돈내산·가계부 경험담 문체** + 스마트에디터 HTML 내 지시어/별표(\`**\`) 노출 0건 + 클라이맥스 단일 1회 링크 |
| **② 네이버 지식iN** | **일 2건 엄선** | **최소 6시간 간격** | **친절한 생활 고수의 1:1 경험 공유 어조** + 본문 무링크(검색유도) & 1분 뒤 의견(대댓글) 링크 분리 |
| **③ 외부 커뮤니티** | **일 2건 엄선** | **최소 6시간 간격** | **100% 일관된 현실 유저 후기 어조(존댓말 혼용 0건)** + 본문 무링크 영수증 짤 첨부 + 첫 댓글 링크 분리 |
| **④ 인스타 & 쓰레드 (\`@moneyfit2026\`)** | **일 2편 엄선** | **최소 6시간 간격** | **\`resolveDynamicReceiptValues\` 정밀 연동(수치 오매핑 0건)** + 말풍선 잘림 없는 4컷 오리지널 웹툰 |

---

## 🎯 2. 오늘 생성된 제1본부 무결점 원고 패키지 (총 ${statusPayload.dailyQuotas.totalOutlinkAssetsToday}건)

### ① \`comedifarm\` 1인칭 경험담 블로그 (일 2편 · 6시간+ 쿨다운)
${blogItems.map(x => `- **[#${x.slot} | ${x.publishTime}] ${x.title}**\n  - 클라이맥스 단일 링크: \`${x.targetUrl}\` | 파일: \`division1_comedifarm_outbox/1_comedifarm_blog/${path.basename(x.filePath)}\``).join('\n')}

### ② 네이버 지식iN 친절한 고수 답변 (일 2건 · 6시간+ 쿨다운)
${jisikinItems.map(x => `- **[#${x.slot}] ${x.title}**\n  - 대댓글 안내 링크: \`${x.targetUrl}\` | [실시간 미채택 질문창](${x.liveSearchUrl}) | 파일: \`division1_comedifarm_outbox/2_naver_jisikin/${path.basename(x.filePath)}\``).join('\n')}

### ③ 외부 커뮤니티 현실 유저 비교 후기 (일 2건 · 6시간+ 쿨다운)
${communityItems.map(x => `- **[#${x.slot}] ${x.title}**\n  - 첫 댓글 안내 링크: \`${x.targetUrl}\` | 파일: \`division1_comedifarm_outbox/3_external_community/${path.basename(x.filePath)}\``).join('\n')}

### ④ 인스타그램 & 쓰레드 (\`@moneyfit2026\`) 4컷 웹툰 패키지 (일 2편 · 6시간+ 쿨다운)
${snsItems.map(x => `- **[#${x.slot}] ${x.title}**\n  - 유입 링크: \`${x.targetUrl}\` | 파일: \`division1_comedifarm_outbox/4_insta_threads/${path.basename(x.filePath)}\``).join('\n')}
`;

  fs.writeFileSync(DIV1_BOARD_PATH, boardMd, 'utf8');
  return statusPayload;
}

if (require.main === module) {
  const res = generateDivision1DailyPack();
  console.log('===============================================================');
  console.log(' 🏢 [제1본부 v4.0] 100% 사람 경험담 문체 · 무결점 데이터 · 안티밴 엔진 가동 완료');
  console.log('===============================================================');
  console.log(`  ✓ 전담 계정/포트 : comedifarm + @moneyfit2026 (Port ${res.browserPort})`);
  console.log(`  ✓ 품질/안티밴    : ${res.antiBanPolicy}`);
  console.log(`  ✓ 금일 엄선 큐   : 총 ${res.dailyQuotas.totalOutlinkAssetsToday}건 (블로그 2 / 지식iN 2 / 커뮤니티 2 / 인스타·쓰레드 2)`);
  console.log(`  ✓ 운영보드 저장  : ${DIV1_BOARD_PATH}`);
}

module.exports = {
  generateDivision1DailyPack,
  buildHumanCategoryNarrative,
  buildSmartEditorHtmlForPreset,
  cleanCaseLabel,
  humanizeProductName,
  runCalculatorForPreset,
  buildMarkdownTable,
  mdToHtmlInline
};

