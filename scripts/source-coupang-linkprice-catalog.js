#!/usr/bin/env node
/**
 * MoneyFit Real Product Sourcing Engine (Coupang Partners Open API AF7865143 + LinkPrice A100708867)
 * Queries official Coupang Open API (/products/search & /products/bestcategories) to source real,
 * high-converting Rocket-Delivery products with live prices, thumbnails, and direct AFFSDP product URLs,
 * paired 1:1 with LinkPrice official mall comparison links across all 6 categories & 36 presets.
 */

const fs = require('fs');
const path = require('path');
const { getApiCredentials, callCoupangApi } = require('./sync-coupang-openapi.js');
const { PRESETS } = require('../src/data/presets.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_JS_PATH = path.join(ROOT_DIR, 'src', 'data', 'sourced-products.js');
const OUTPUT_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'sourced-products.json');

function buildLpUrl(merchant, targetUrl, lpId = 'A100708867') {
  return `https://click.linkprice.com/click.php?m=${merchant}&a=${lpId}&l=9999&tu=${encodeURIComponent(targetUrl)}`;
}

// 18 targeted sourcing queries covering all 36 presets (each returns up to 6 real products)
const SOURCING_QUERIES = [
  // Category 1: Electric (6)
  { key: 'elec_ac_wall', calc: 'electric', query: '벽걸이 인버터 에어컨 1등급', presetIds: ['electric-studio-ac', 'electric-inverter-roi'] },
  { key: 'elec_circulator', calc: 'electric', query: 'BLDC 무소음 서큘레이터', presetIds: ['electric-stand-ac'] },
  { key: 'elec_dehumidifier', calc: 'electric', query: '1등급 인버터 제습기', presetIds: ['electric-dehumidifier'] },
  { key: 'elec_dryer_ball', calc: 'electric', query: '건조기 양모볼 섬유유연제 시트', presetIds: ['electric-dryer'] },
  { key: 'elec_winter_mat', calc: 'electric', query: 'EMF 무자계 카본매트 단열 에어캡', presetIds: ['electric-winter-heater'] },
  { key: 'elec_smart_plug', calc: 'electric', query: '스마트플러그 전력측정 절전 멀티탭', presetIds: ['electric-studio-ac', 'electric-stand-ac', 'electric-dehumidifier', 'electric-dryer', 'electric-winter-heater', 'electric-inverter-roi'] },

  // Category 2: Diet (6)
  { key: 'diet_chicken_bulk', calc: 'diet', query: '하림 닭가슴살 냉동 대용량', presetIds: ['diet-male-fatloss', 'diet-quick-3kg'] },
  { key: 'diet_chicken_steam', calc: 'diet', query: '촉촉한 닭가슴살 혼합 맛보기 세트', presetIds: ['diet-female-lean'] },
  { key: 'diet_whey_protein', calc: 'diet', query: 'WPI 분리유청 단백질 보충제', presetIds: ['diet-male-bulkup'] },
  { key: 'diet_brown_rice', calc: 'diet', query: '곰곰 현미밥 곤약밥 즉석밥 대용량', presetIds: ['diet-office-worker'] },
  { key: 'diet_eggs_tofu', calc: 'diet', query: '무항생제 구운계란 60구 단백질바', presetIds: ['diet-student-budget'] },

  // Category 3: Pet (6)
  { key: 'pet_dog_small', calc: 'pet', query: '로얄캐닌 강아지 사료 미니 인도어', presetIds: ['pet-maltese-5kg', 'pet-monthly-budget'] },
  { key: 'pet_dog_puppy', calc: 'pet', query: '로얄캐닌 퍼피 사료 강아지 계량스푼', presetIds: ['pet-pomeranian-puppy'] },
  { key: 'pet_dog_large_joint', calc: 'pet', query: '강아지 관절 영양제 대용량 사료', presetIds: ['pet-golden-retriever'] },
  { key: 'pet_cat_indoor', calc: 'pet', query: '고양이 인도어 사료 자동급수기', presetIds: ['pet-korean-shorthair'] },
  { key: 'pet_cat_senior_pad', calc: 'pet', query: '강아지 배변패드 100매 고양이 모래', presetIds: ['pet-senior-cat', 'pet-monthly-budget'] },

  // Category 4: Room (6)
  { key: 'room_mattress', calc: 'room', query: '지누스 독립스프링 매트리스 침대프레임', presetIds: ['room-oneroom-100', 'room-officetel-300'] },
  { key: 'room_robot_vac', calc: 'room', query: '로봇청소기 물걸레 올인원 무선청소기', presetIds: ['room-officetel-500', 'room-newlywed-1000'] },
  { key: 'room_storage_hanger', calc: 'room', query: '코멧 이동식 행거 암막커튼 수납선반', presetIds: ['room-minimalist-50'] },
  { key: 'room_kitchen_app', calc: 'room', query: '원룸 전자레인지 에어프라이어 소형냉장고', presetIds: ['room-appliances-only'] },

  // Category 5: Auto (6)
  { key: 'auto_dashcam', calc: 'auto', query: '아이나비 2채널 QHD 블랙박스 무료장착', presetIds: ['auto-avante-3000', 'auto-casper-cash-vs-rent'] },
  { key: 'auto_magsafe', calc: 'auto', query: '신지모루 맥세이프 차량용 무선충전 거치대', presetIds: ['auto-grandeur-5000', 'auto-genesis-g80'] },
  { key: 'auto_fuel_filter', calc: 'auto', query: '불스원샷 연료첨가제 차량용 에어컨필터', presetIds: ['auto-tucson-hybrid', 'auto-ev-ioniq'] },

  // Category 6: Telecom (6)
  { key: 'telecom_router', calc: 'telecom', query: 'ipTIME AX3000 와이파이6 공유기', presetIds: ['telecom-penalty-15', 'telecom-3yr-expired', 'telecom-family-4p'] },
  { key: 'telecom_usim_cable', calc: 'telecom', query: '알뜰폰 공용 유심칩 기가랜선 정리함', presetIds: ['telecom-penalty-30', 'telecom-single-oneroom', 'telecom-mvno-switch'] }
];

// LinkPrice Official Mall Sourcing Pairings per Category
const LINKPRICE_SOURCED_DEALS = {
  electric: [
    {
      merchant: 'himart',
      merchantLabel: '롯데하이마트 공식몰',
      badge: '💳 카드 즉시할인 + 으뜸효율 1등급 환급',
      title: '롯데하이마트 에너지 1등급 인버터 에어컨·제습기·건조기 단독 특가전',
      specSummary: '구형 정속형 대비 소비전력 -55% 절감 · 한전 1등급 환급 대상 모델 모음',
      priceText: '제휴 카드 최대 15% 청구할인',
      lpUrl: buildLpUrl('himart', 'https://www.e-himart.co.kr/app/search/totalSearch?query=%EC%97%90%EB%84%88%EC%A7%80%201%EB%93%B1%EA%B8%89%20%EC%9D%B8%EB%B2%84%ED%84%B0')
    },
    {
      merchant: 'gmarket',
      merchantLabel: '지마켓 슈퍼딜',
      badge: '⚡ 9,900원대 대기전력 0원 차단',
      title: '지마켓 실시간 전력측정 스마트플러그 & 개별스위치 절전 멀티탭 베스트',
      specSummary: '스마트폰 앱으로 누진세 3단계 진입 전 원격 전원 차단 · 타이머 스케줄',
      priceText: '스마일클럽 추가 쿠폰 할인',
      lpUrl: buildLpUrl('gmarket', 'https://www.gmarket.co.kr/n/search?keyword=%EC%8A%A4%EB%A7%88%ED%8A%B8%ED%94%8C%EB%9F%AC%EA%B7%B8%20%EC%A0%84%EB%A0%A5%EC%B8%A1%EC%A0%95%20%EC%A0%88%EC%A0%84%EB%A9%80%ED%8B%B0%ED%83%AD')
    }
  ],
  diet: [
    {
      merchant: 'gmarket',
      merchantLabel: '지마켓 식품 슈퍼딜',
      badge: '🍗 1팩당 1,100원대 대용량 최저가',
      title: '지마켓 하림·한끼통살 냉동 닭가슴살 30~50팩 & 현미곤약밥 묶음 특가',
      specSummary: '편의점 낱개(2,900원) 대비 식단비 -58% 절감 · 단백질 1g당 51원 최저가',
      priceText: '대용량 묶음 무료배송 특가',
      lpUrl: buildLpUrl('gmarket', 'https://www.gmarket.co.kr/n/search?keyword=%EB%8B%AD%EA%B0%80%EC%8A%B4%EC%82%B4%2050%ED%8C%A9%20%ED%98%84%EB%AF%B8%EB%B0%A5')
    },
    {
      merchant: '11st',
      merchantLabel: '11번가 쇼킹딜',
      badge: '💪 1스쿱 단백질 24g · 가성비 보충제',
      title: '11번가 WPI 분리유청 프로틴 보충제 & 무설탕 단백질바 베스트 기획전',
      specSummary: '유당불내증 없는 순수 WPI 90% · 운동 직후 근합성 골든타임 1스쿱 980원',
      priceText: '쇼킹딜 즉시할인 + 무료배송',
      lpUrl: buildLpUrl('11st', 'https://search.11st.co.kr/pc/total-search?kwd=WPI%20%EB%8B%A8%EB%B0%B1%EC%A7%88%20%EB%B3%B4%EC%B6%A9%EC%A0%9C%20%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8')
    }
  ],
  pet: [
    {
      merchant: 'gmarket',
      merchantLabel: '지마켓 반려동물 특가',
      badge: '🐶 정품 유통기한 보증 · 대용량 포대할인',
      title: '지마켓 로얄캐닌·하림펫푸드 가수분해 사료 & 관절영양제 공식 기획전',
      specSummary: '수의영양학 RER/DER 기준 100g당 최저 단가 · 알러지·눈물자국 케어 1위',
      priceText: '대용량 포대 최대 28% 할인',
      lpUrl: buildLpUrl('gmarket', 'https://www.gmarket.co.kr/n/search?keyword=%EB%A1%9C%EC%96%84%EC%BA%90%EB%8B%8C%20%EA%B0%80%EC%88%98%EB%B6%84%ED%95%B4%20%EC%82%AC%EB%A3%8C%20%EA%B4%88%EC%A0%88%EC%98%81%EC%96%91%EC%A0%9C')
    },
    {
      merchant: '11st',
      merchantLabel: '11번가 펫마트',
      badge: '🐾 배변패드·고양이모래 박스 특가',
      title: '11번가 초흡수 배변패드 200매 & 무먼지 벤토나이트·두부모래 대용량',
      specSummary: '매달 나가는 필수 소모품 박스 구매로 월 양육 고정비 -45% 절감',
      priceText: '박스 단가 최저가 보장',
      lpUrl: buildLpUrl('11st', 'https://search.11st.co.kr/pc/total-search?kwd=%EA%B0%95%EC%95%84%EC%A7%80%20%EB%B0%B0%EB%B3%80%ED%8C%A8%EB%93%9C%20200%EB%A7%A4%20%EA%B3%A0%EC%96%91%EC%9D%B4%EB%AA%A8%EB%9E%98')
    }
  ],
  room: [
    {
      merchant: 'ohou',
      merchantLabel: '오늘의집 공식스토어',
      badge: '🛋️ 자취·신혼 인테리어 가구 1위',
      title: '오늘의집 원룸·오피스텔 수납침대·매트리스·암막커튼 베스트셀러 특가',
      specSummary: '오프라인 가구점 대비 유통마진 -35% 절감 · 실거주자 포토리뷰 1만건 검증',
      priceText: '오늘의집 오늘의딜 특가',
      lpUrl: buildLpUrl('ohou', 'https://ohou.se/store/search?query=%EC%9B%90%EB%A3%B8%20%EC%B9%A8%EB%8C%80%20%EB%A7%A4%ED%8A%B8%EB%A6%AC%EC%8A%A4%20%EC%88%98%EB%82%A9')
    },
    {
      merchant: 'himart',
      merchantLabel: '롯데하이마트 가전패키지',
      badge: '🏆 원룸·신혼 필수가전 세트 할인',
      title: '롯데하이마트 냉장고·세탁기·로봇청소기·전자레인지 온라인 단독 패키지',
      specSummary: '백화점·대리점 개별 구매 대비 최대 280만 원 절약 + 희망일 무료설치',
      priceText: '다품목 동시구매 캐시백',
      lpUrl: buildLpUrl('himart', 'https://www.e-himart.co.kr/app/search/totalSearch?query=%EC%9B%90%EB%A3%B8%20%EB%83%89%EC%9E%A5%EA%B3%A0%20%EC%84%B8%ED%83%81%EA%B8%B0%20%EB%A1%9C%EB%B4%87%EC%B2%AD%EC%86%8C%EA%B8%B0')
    }
  ],
  auto: [
    {
      merchant: 'gmarket',
      merchantLabel: '지마켓 자동차용품관',
      badge: '🚗 전국 무료출장장착 포함 특가',
      title: '지마켓 아이나비·파인뷰 2채널 QHD 블랙박스 & 맥세이프 거치대 슈퍼딜',
      specSummary: '신차 딜러 서비스 저가 블박 대신 QHD 초고화질 + 무상 출장장착 10만원대 끝판왕',
      priceText: '무료출장장착 쿠폰 포함',
      lpUrl: buildLpUrl('gmarket', 'https://www.gmarket.co.kr/n/search?keyword=2%EC%B1%84%EB%84%90%20QHD%20%EB%B8%94%EB%9E%99%EB%B0%95%EC%8A%A4%20%EB%AC%B4%EB%A3%8C%EC%9E%A5%EC%B0%A9')
    },
    {
      merchant: '11st',
      merchantLabel: '11번가 카용품 베스트',
      badge: '⛽ 셀프 정비로 공임비 80% 절약',
      title: '11번가 불스원샷 연료첨가제 & 활성탄 에어컨필터·워셔액 대용량 세트',
      specSummary: '정비소 교체비용 5만 원 → 5분 셀프 교체로 개당 6,900원에 연비·실내공기 완벽 관리',
      priceText: '대용량 묶음 특가',
      lpUrl: buildLpUrl('11st', 'https://search.11st.co.kr/pc/total-search?kwd=%EB%B6%88%EC%8A%A4%EC%9B%90%EC%83%B7%20%EC%B0%A8%EB%9F%89%EC%9A%A9%20%EC%97%90%EC%96%B4%EC%BB%A8%ED%95%84%ED%84%B0')
    }
  ],
  telecom: [
    {
      merchant: 'gmarket',
      merchantLabel: '지마켓 네트워크 공식관',
      badge: '🌐 통신사 임대료 15.8만원 즉시 절약',
      title: '지마켓 ipTIME·티피링크 AX3000 와이파이6 공유기 & CAT.8 기가랜선 특가',
      specSummary: '통신사 공유기 임대료(월 4,400원×36개월=158,400원) 아끼고 속도 3배 업그레이드',
      priceText: '1년 만에 임대료 본전 회수',
      lpUrl: buildLpUrl('gmarket', 'https://www.gmarket.co.kr/n/search?keyword=ipTIME%20AX3000%20%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B46%20%EA%B3%B5%EC%9C%A0%EA%B8%B0')
    },
    {
      merchant: 'ktshop',
      merchantLabel: 'KT샵 / 알뜰유심 공식몰',
      badge: '📱 24개월 통신비 -132만원 절감',
      title: '자급제폰 + NFC 호환 알뜰폰 무제한 유심칩 5분 셀프개통 기획전',
      specSummary: '통신 3사 5G 고가 요금제(월 8.9만) → 알뜰폰 무제한(월 3.3만) 전환으로 매달 5.6만원 절약',
      priceText: '유심비 할인 + 사은품 혜택',
      lpUrl: buildLpUrl('gmarket', 'https://www.gmarket.co.kr/n/search?keyword=%EC%95%8C%EB%9C%B0%ED%8F%B0%20NFC%20%EA%B3%B5%EC%9A%A9%20%EC%9C%A0%EC%8B%AC%EC%B9%A9%20%EC%9E%90%EA%B8%89%EC%A0%9C')
    }
  ]
};

// Detailed sourcing spec annotations per category
const CATEGORY_SOURCING_SPECS = {
  electric: {
    categoryTitle: '⚡ 전기세·누진세 방어 1등급 & 절전 소싱템',
    sourcingHeadline: '누진세 3단계(307.3원/kWh) 폭탄을 막아주는 실구매 1위 절전 가전·스마트플러그',
    unitMetricLabel: '예상 절감 효과',
    defaultUnitBadge: '월 전기세 -45~55% 절감 · 기기값 단기 본전 회수'
  },
  diet: {
    categoryTitle: '🍗 단백질 1g당 최저가 식단·보충제 소싱템',
    sourcingHeadline: '편의점·배달음식 대비 식비를 54% 아끼는 가성비 닭가슴살·현미밥·WPI 프로틴',
    unitMetricLabel: '단백질 1g당 가성비',
    defaultUnitBadge: '단백질 1g당 51원대 · 편의점 대비 -58% 절약'
  },
  pet: {
    categoryTitle: '🐶 수의영양학 정량 급여 사료·영양제 소싱템',
    sourcingHeadline: '슬개골·신장 병원비 180만 원을 예방하는 연령·체중별 맞춤 사료 & 소모품',
    unitMetricLabel: '100g당 급여 가성비',
    defaultUnitBadge: '정량 배식으로 사료비 -30% · 병원비 리스크 방어'
  },
  room: {
    categoryTitle: '🛋️ 자취·오피스텔·신혼 가성비 가전·가구 소싱템',
    sourcingHeadline: '오프라인 매장 유통마진 35%를 걷어낸 로켓설치 침대·냉장고·로봇청소기',
    unitMetricLabel: '오프라인 대비 절감액',
    defaultUnitBadge: '유통마진 -35% 절감 · 내일 바로 무료 로켓설치'
  },
  auto: {
    categoryTitle: '🚗 신차·장기렌트·할부 유지비 방어 차량용품 소싱템',
    sourcingHeadline: '딜러 서비스 거품과 정비소 공임비를 아끼는 QHD 블랙박스·맥세이프·셀프정비템',
    unitMetricLabel: '정비소/딜러 대비 절감',
    defaultUnitBadge: '무료출장장착 포함 · 정비 공임비 -80% 절약'
  },
  telecom: {
    categoryTitle: '🌐 통신사 임대료·요금 폭탄 해방 공유기·유심 소싱템',
    sourcingHeadline: '매달 빠져나가는 공유기 임대료와 고가 요금제를 끝내는 와이파이6 & 알뜰유심',
    unitMetricLabel: '3년 약정 대비 순이익',
    defaultUnitBadge: '임대료 15.8만원 절약 + 사은품 최대 47만원 혜택'
  }
};

async function runProductSourcing() {
  const { accessKey, secretKey, afId } = getApiCredentials();
  const searchPath = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';

  const queryResults = {};
  console.log(`[Sourcing Engine] Querying Coupang Partners Open API (${afId}) for ${SOURCING_QUERIES.length} core product lines...`);

  for (const item of SOURCING_QUERIES) {
    try {
      const qs = `keyword=${encodeURIComponent(item.query)}&limit=5&subId=mf_${item.calc}`;
      const res = await callCoupangApi('GET', searchPath, qs, null, accessKey, secretKey);
      if (res.statusCode === 200 && res.body && res.body.data && Array.isArray(res.body.data.productData)) {
        const products = res.body.data.productData.map(p => ({
          productId: p.productId,
          productName: p.productName,
          productPrice: p.productPrice,
          productPriceFormatted: `${Number(p.productPrice || 0).toLocaleString()}원`,
          productImage: p.productImage,
          productUrl: p.productUrl,
          categoryName: p.categoryName || '',
          isRocket: Boolean(p.isRocket),
          isFreeShipping: Boolean(p.isFreeShipping),
          rank: p.rank || 1,
          query: item.query
        }));
        queryResults[item.key] = {
          landingUrl: res.body.data.landingUrl,
          products
        };
        console.log(`  ✓ Sourced [${item.key}] "${item.query}": ${products.length} real products (Top: ${products[0]?.productName?.slice(0, 32)}... @ ${products[0]?.productPriceFormatted})`);
      } else {
        console.warn(`  ! Warning [${item.key}]:`, res.statusCode, res.body?.rMessage || '');
      }
      await new Promise(r => setTimeout(r, 650));
    } catch (err) {
      console.warn(`  ! Error [${item.key}]:`, err.message);
    }
  }

  // Build Category-level Sourced Product Lineups (6 categories)
  const categories = {};
  for (const calcId of ['electric', 'diet', 'pet', 'room', 'auto', 'telecom']) {
    const catQueries = SOURCING_QUERIES.filter(q => q.calc === calcId);
    const coupangItems = [];
    const seenIds = new Set();

    for (const cq of catQueries) {
      const qData = queryResults[cq.key];
      if (qData && Array.isArray(qData.products)) {
        for (const prod of qData.products) {
          if (!seenIds.has(prod.productId) && coupangItems.length < 8) {
            seenIds.add(prod.productId);
            coupangItems.push(prod);
          }
        }
      }
    }

    categories[calcId] = {
      ...CATEGORY_SOURCING_SPECS[calcId],
      coupangProducts: coupangItems,
      linkPriceDeals: LINKPRICE_SOURCED_DEALS[calcId] || []
    };
  }

  // Build Preset-level 1:1 Sourced Product Lineups (36 presets)
  const presetsMap = {};
  for (const preset of PRESETS) {
    const matchingQueries = SOURCING_QUERIES.filter(q => q.presetIds.includes(preset.id));
    const catQueries = SOURCING_QUERIES.filter(q => q.calc === preset.calc);
    const combinedQueries = [...matchingQueries, ...catQueries];

    const presetCoupangProducts = [];
    const seen = new Set();

    for (const mq of combinedQueries) {
      const qData = queryResults[mq.key];
      if (qData && Array.isArray(qData.products)) {
        for (const prod of qData.products) {
          if (!seen.has(prod.productId) && presetCoupangProducts.length < 4) {
            seen.add(prod.productId);
            presetCoupangProducts.push(prod);
          }
        }
      }
    }

    presetsMap[preset.id] = {
      presetId: preset.id,
      calc: preset.calc,
      title: preset.title,
      sourcingSpec: CATEGORY_SOURCING_SPECS[preset.calc] || CATEGORY_SOURCING_SPECS.electric,
      coupangProducts: presetCoupangProducts,
      linkPriceDeals: LINKPRICE_SOURCED_DEALS[preset.calc] || []
    };
  }

  const catalog = {
    syncedAt: new Date().toISOString(),
    coupangAfId: afId,
    linkPriceId: 'A100708867',
    totalPresets: Object.keys(presetsMap).length,
    categories,
    presets: presetsMap
  };

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(catalog, null, 2) + '\n', 'utf8');

  const jsContent = `/**
 * MoneyFit Sourced Products Catalog (SSOT)
 * Real Coupang Partners Open API (AF7865143) products with live KRW prices, thumbnails,
 * Rocket badges, and direct AFFSDP product URLs + LinkPrice (A100708867) official mall comparisons.
 */
const SOURCED_PRODUCTS_CATALOG = ${JSON.stringify(catalog, null, 2)};

if (typeof window !== 'undefined') {
  window.SOURCED_PRODUCTS_CATALOG = SOURCED_PRODUCTS_CATALOG;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SOURCED_PRODUCTS_CATALOG };
}
`;
  fs.writeFileSync(OUTPUT_JS_PATH, jsContent, 'utf8');
  console.log(`[Sourcing Engine] Saved sourced product catalog to ${OUTPUT_JS_PATH}`);
}

if (require.main === module) {
  runProductSourcing().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runProductSourcing };
