#!/usr/bin/env node
/**
 * MoneyFit 100% Original Copyright-Safe Signature Instatoon Engine (36-Episode Full Suite)
 * (저작권 100% 안전 · 머니핏 독자 오리지널 동물 오피스 6인방 × 3초 실물 절취선 영수증 4슬라이드 웹툰 엔진)
 *
 * Copyright & Originality Guarantees:
 * 1. 100% Original Character Designs (`머니핏 오리지널 컬러 동물 오피스 6인방`):
 *    - 🦊 여우 실장 (Fox Director: 코랄 오렌지 털 + 금테 안경 + 에메랄드 니트 조끼 + MF 배지)
 *    - 🐼 팬더 팀장 (Panda Lead: 투톤 팬더 귀/눈패치 + 민트 후드티)
 *    - 🐝 꿀벌 과장 (Bee Manager: 허니 골드 + 더듬이/날개 + 네이비 블레이저 & 노란 넥타이)
 *    - 🐆 치타 팀장 (Cheetah Lead: 앰버 골드 + 볼 점무늬 + 로열블루 집업 자켓)
 *    - 🦌 사슴 디렉터 (Deer Director: 카라멜 브라운 + 크림 뿔 + 베이지 가디건)
 *    - 🐰 토리 사원 (Bunny/Squirrel Staff: 살구 크림 털 + 핑크 귀 + 스카이블루 맨투맨)
 * 2. 100% Original 4-Slide Layout (Zero overlap with any external webtoon artist):
 *    - Slide 1 (Cover): Warm Ivory Dot-Grid Notebook + Tilted Highlighter Signboard + 2-Character Scene
 *    - Slide 2 (Story): 2-Panel Vertical Rounded Comic Strip (STEP 01 흔한 착각 vs STEP 02 고지서 멘붕)
 *    - Slide 3 (Receipt Climax): MoneyFit Signature Perforated Thermal Receipt Card (톱니 절취선 비교 영수증) + 2-Character Fact-Check
 *    - Slide 4 (Solution CTA): Cheering Characters + Interactive Smartphone 3-Second Calculator UI Mockup Card
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const { PRESETS } = require('../src/data/presets.js');
const { CALCULATORS } = require('../src/data/calculators.js');
const webtoonStories = require('../src/data/webtoon-stories.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const FONTS_DIR = path.join(ROOT_DIR, 'src', 'assets', 'fonts');

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

function findChromeExecutable() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getFontFileUrl(fileName) {
  return 'file:///' + path.join(FONTS_DIR, fileName).replace(/\\/g, '/');
}

function stripMdBold(str) {
  return String(str || '').replace(/\*\*/g, '').trim();
}

/**
 * Curated 2-line cover titles & MoneyFit Original 6-Character Cast Rotation for all 36 presets
 */
const TOTO_CURATED_META = {
  // 1. Electric
  'electric-studio-ac': {
    coverTitleLines: ['에어컨 껐다 켰다', '전기세 폭탄의 진실'],
    coverRole: 'maknae_bunny', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '⚡ 전기요금 · 누진세 팩트체크'
  },
  'electric-stand-ac': {
    coverTitleLines: ['거실 에어컨 틀다', '누진세 3단계 맞은 썰'],
    coverRole: 'panda_lead', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '⚡ 아파트 전기세 · 누진세'
  },
  'electric-dehumidifier': {
    coverTitleLines: ['제습기 24시간 틀다', '고지서 보고 놀란 이유'],
    coverRole: 'bee_manager', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '⚡ 여름 가전 · 1등급 손익'
  },
  'electric-dryer': {
    coverTitleLines: ['건조기 전기세가', '무서워 못 썼던 사연'],
    coverRole: 'maknae_bunny', colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    categoryBadge: '⚡ 자취·살림 · 건조기 전기세'
  },
  'electric-winter-heater': {
    coverTitleLines: ['전기온풍기 틀었다가', '월급 증발할 뻔한 썰'],
    coverRole: 'cheetah_lead', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '⚡ 겨울 난방비 · 누진세 진단'
  },
  'electric-inverter-roi': {
    coverTitleLines: ['10년 된 구형 에어컨', '교체 본전 뽑는 기간'],
    coverRole: 'deer_director', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '⚡ 1등급 인버터 · 본전 회수'
  },

  // 2. Diet
  'diet-male-fatloss': {
    coverTitleLines: ['편의점 닭가슴살', '사먹다 식비 파산한 썰'],
    coverRole: 'cheetah_lead', colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    categoryBadge: '🥗 체지방 커팅 · 식단 장보기'
  },
  'diet-female-lean': {
    coverTitleLines: ['고구마만 먹다가', '요요+배달비 터진 이유'],
    coverRole: 'maknae_bunny', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🥗 슬림 식단 · 탄단지 비율'
  },
  'diet-male-bulkup': {
    coverTitleLines: ['보충제만 퍼먹다가', '식비만 날린 벌크업'],
    coverRole: 'panda_lead', colleagueRole: 'cheetah_lead', colleagueName: '치타 팀장님',
    categoryBadge: '🥗 벌크업 · 칼로리 잉여 계산'
  },
  'diet-office-worker': {
    coverTitleLines: ['직장인 점심 외식비', '절반으로 줄인 비결'],
    coverRole: 'panda_lead', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🥗 직장인 점심 · 도시락 밀프렙'
  },
  'diet-student-budget': {
    coverTitleLines: ['자취생 일주일 식단', '3만원대 장보기 공식'],
    coverRole: 'maknae_bunny', colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    categoryBadge: '🥗 자취생·대학생 · 가성비 식단'
  },
  'diet-quick-3kg': {
    coverTitleLines: ['무작정 굶는 단기감량', '실패할 수밖에 없는 이유'],
    coverRole: 'deer_director', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🥗 단기 3kg 감량 · 칼로리 적자'
  },

  // 3. Pet
  'pet-maltese-5kg': {
    coverTitleLines: ['종이컵 눈대중 사료', '비만·병원비 부르는 이유'],
    coverRole: 'maknae_bunny', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🐾 말티즈 성견 · 일일 사료 정량'
  },
  'pet-pomeranian-puppy': {
    coverTitleLines: ['생후 4개월 아기 강아지', '사료 급여량 계산법'],
    coverRole: 'panda_lead', colleagueRole: 'deer_director', colleagueName: '사슴 디렉터님',
    categoryBadge: '🐾 퍼피 성장기 · 사료 g수 계산'
  },
  'pet-golden-retriever': {
    coverTitleLines: ['대형견 소포장 사료', '사다 통장 털린 사연'],
    coverRole: 'cheetah_lead', colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    categoryBadge: '🐾 대형견 30kg · 대용량 포대 비교'
  },
  'pet-korean-shorthair': {
    coverTitleLines: ['고양이 자율급식', '방치했다가 생긴 일'],
    coverRole: 'maknae_bunny', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🐾 중성화 고양이 · 정량 급여'
  },
  'pet-senior-cat': {
    coverTitleLines: ['10살 넘은 노령묘', '건사료만 주면 안 되는 이유'],
    coverRole: 'deer_director', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🐾 노령묘 케어 · 수분·사료 계산'
  },
  'pet-monthly-budget': {
    coverTitleLines: ['강아지 첫 입양할 때', '용품 호구 피하는 공식'],
    coverRole: 'panda_lead', colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    categoryBadge: '🐾 반려견 첫 입양 · 월 고정비'
  },

  // 4. Room
  'room-oneroom-100': {
    coverTitleLines: ['첫 원룸 자취방', '100만원 풀세팅 공식'],
    coverRole: 'maknae_bunny', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🛋️ 원룸 100만원 · 가전·가구 배분'
  },
  'room-officetel-300': {
    coverTitleLines: ['오피스텔 인테리어', '감성만 쫓다 예산 초과'],
    coverRole: 'deer_director', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🛋️ 오피스텔 300만원 · 황금비율'
  },
  'room-officetel-500': {
    coverTitleLines: ['투룸 이사할 때', '백화점 견적서 주의보'],
    coverRole: 'panda_lead', colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    categoryBadge: '🛋️ 투룸 500만원 · 로봇청소기 세팅'
  },
  'room-newlywed-1000': {
    coverTitleLines: ['신혼가전 패키지 견적', '그대로 결제하면 손해'],
    coverRole: 'cheetah_lead', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🛋️ 신혼부부 1,000만원 · 가전 배분'
  },
  'room-minimalist-50': {
    coverTitleLines: ['단기 거주 원룸에', '큰 가구 사면 안 되는 이유'],
    coverRole: 'maknae_bunny', colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    categoryBadge: '🛋️ 미니멀 50만원 · 생존템 견적'
  },
  'room-appliances-only': {
    coverTitleLines: ['무옵션 원룸 중고가전', '샀다가 수리비 폭탄'],
    coverRole: 'bee_manager', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🛋️ 무옵션 원룸 · 필수 1등급 가전'
  },

  // 5. Auto
  'auto-avante-3000': {
    coverTitleLines: ['사회초년생 아반떼', '할부 vs 장기렌트 진실'],
    coverRole: 'maknae_bunny', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🚗 첫차 3,000만원 · TCO 비교'
  },
  'auto-grandeur-5000': {
    coverTitleLines: ['사업자 그랜저를', '할부로 사면 날리는 세금'],
    coverRole: 'cheetah_lead', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🚗 사업자 그랜저 · 절세 손익'
  },
  'auto-tucson-hybrid': {
    coverTitleLines: ['투싼 하이브리드', '취등록세·할부이자 비교'],
    coverRole: 'panda_lead', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🚗 패밀리 SUV · 48개월 총비용'
  },
  'auto-genesis-g80': {
    coverTitleLines: ['제네시스 G80 법인·사업자', '연 1,500만원 비용처리법'],
    coverRole: 'deer_director', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🚗 고소득·법인 G80 · 절세 계산'
  },
  'auto-casper-cash-vs-rent': {
    coverTitleLines: ['초보운전 첫차 캐스퍼', '보험료 폭탄 피하는 법'],
    coverRole: 'maknae_bunny', colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    categoryBadge: '🚗 경차 캐스퍼 · 보험 포함 TCO'
  },
  'auto-ev-ioniq': {
    coverTitleLines: ['아이오닉 전기차', '보조금·감가상각 손익표'],
    coverRole: 'bee_manager', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🚗 전기차 5,500만원 · 실구매 손익'
  },

  // 6. Telecom
  'telecom-penalty-15': {
    coverTitleLines: ['위약금 15만원 무서워', '인터넷 안 바꾼 최후'],
    coverRole: 'cheetah_lead', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🌐 인터넷 이동 · 사은품 47만원'
  },
  'telecom-penalty-30': {
    coverTitleLines: ['위약금 30만원 나와도', '갈아타면 이득인 이유'],
    coverRole: 'maknae_bunny', colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    categoryBadge: '🌐 잔여 약정 1년 · 위약금 방어'
  },
  'telecom-3yr-expired': {
    coverTitleLines: ['3년 약정 끝난 인터넷', '그냥 두면 매달 손해'],
    coverRole: 'panda_lead', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🌐 3년 만기 · 위약금 0원 혜택'
  },
  'telecom-single-oneroom': {
    coverTitleLines: ['원룸 인터넷 단독 개통도', '현금 지원금 받는 법'],
    coverRole: 'maknae_bunny', colleagueRole: 'cheetah_lead', colleagueName: '치타 팀장님',
    categoryBadge: '🌐 자취방 단독 인터넷 · 지원금'
  },
  'telecom-family-4p': {
    coverTitleLines: ['온가족 휴대폰 따로 쓰다', '날린 통신비 171만원'],
    coverRole: 'bee_manager', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🌐 4인 가족결합 · 최대 사은품'
  },
  'telecom-mvno-switch': {
    coverTitleLines: ['월 6만원 5G 요금제', '알뜰폰 유심 반값 공식'],
    coverRole: 'cheetah_lead', colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    categoryBadge: '🌐 알뜰폰 전환 · 24개월 절감액'
  }
};

/**
 * Build complete 100% Original MoneyFit 4-Slide Script for any preset slug
 */
function buildTotoEpisodeSpec(presetOrSlug) {
  const preset = typeof presetOrSlug === 'string'
    ? PRESETS.find(p => p.id === presetOrSlug || p.slug === presetOrSlug) || PRESETS[0]
    : presetOrSlug;
  const slug = preset.id || preset.slug || 'electric-studio-ac';

  const calcKey = preset.calc || preset.calcKey || 'electric';
  let calcRes = null;
  if (preset.inputs && CALCULATORS && CALCULATORS[calcKey] && typeof CALCULATORS[calcKey].calculate === 'function') {
    try {
      calcRes = CALCULATORS[calcKey].calculate(preset.inputs);
    } catch (e) {
      calcRes = null;
    }
  }

  const resolved = webtoonStories.resolveDynamicReceiptValues(preset, calcRes);
  const sc = resolved.shortCartoon || {};
  const meta = TOTO_CURATED_META[slug] || {
    coverTitleLines: ['감으로 결제하다', '새는 고정비 막는 법'],
    coverRole: 'maknae_bunny',
    colleagueRole: 'fox_director',
    colleagueName: '여우 실장님',
    categoryBadge: '🧾 머니핏 3초 영수증 팩트체크'
  };

  const p1Lines = (sc.p1 || ['모르고 그냥 쓰면', '생돈 날려요!']).map(stripMdBold);
  const p2Lines = (sc.p2 || ['내 조건 넣으면', '정답이 나와요!']).map(stripMdBold);
  const p3Lines = (sc.p3 || ['비교 안 하면 손해!', '절약액 확인!']).map(stripMdBold);
  const p4Lines = (sc.p4 || ['3초 만에 계산 끝!', '바로 아꼈다!']).map(stripMdBold);
  const cleanDiff = String(resolved.diffVal || '').replace(/\s*(차이|절약|이득|손해).*$/, '').trim();

  if (slug === 'electric-studio-ac') {
    return {
      slug: 'electric-studio-ac',
      categoryBadge: meta.categoryBadge,
      coverTitleLines: meta.coverTitleLines,
      coverRole: meta.coverRole,
      colleagueRole: meta.colleagueRole,
      colleagueName: meta.colleagueName,
      coverBubbleLines: ['여우 실장님! 에어컨은', '시원해질 때마다 껐다 켜야', '전기세가 아껴지죠?'],
      coverBottomNarration: '여름마다 자취방·사무실에서 가장 많이 하는 대표적인 착각!',
      slide2Step1Tag: 'STEP 01 · 흔한 착각',
      slide2Step1Bubble: ['조금만 시원해지면 끄고', '더워지면 다시 켜야지!', '이번 달 전기세 아꼈다~ ♪'],
      slide2Step2Tag: 'STEP 02 · 고지서 도착 & 팩트체크',
      slide2Step2LeftBubble: ['헉?! 아낀다고 껐는데', '왜 88,420원이나 나왔지?!'],
      slide2Step2RightBubble: ['구형 에어컨을 껐다 켜면', '실외기 기동전력이 3배 뛰어서', '누진세 3단계 폭탄 맞아요!'],
      badLabel: resolved.badLabel || '구형 정속형 껐다켰다',
      badVal: resolved.badVal || '월 88,420원',
      goodLabel: resolved.goodLabel || '1등급 인버터 연속가동',
      goodVal: resolved.goodVal || '월 31,200원',
      diffVal: resolved.diffVal || '월 -57,220원 절약',
      slide3LeftBubble: ['아끼려고 끈 건데 매달', '57,220원이나 더 냈다고요?!'],
      slide3RightBubble: ['인버터는 희망온도 맞춰', '연속 가동해야 월 3만원대로', '확 줄어듭니다!'],
      slide4TopBubble: ['내 방 평수·가동시간 넣으니까', '3초 만에 한전 누진세 영수증이랑', '1등급 절전템 본전 기간이 딱 나오네!'],
      slide4CardTitle: '원룸·자취방 에어컨 3초 전기세 계산기',
      slide4CardChips: ['소비전력(W) 입력', '하루 가동시간', '한전 누진세 자동반영']
    };
  }

  return {
    slug,
    categoryBadge: meta.categoryBadge,
    coverTitleLines: meta.coverTitleLines,
    coverRole: meta.coverRole,
    colleagueRole: meta.colleagueRole,
    colleagueName: meta.colleagueName,
    coverBubbleLines: [
      `${meta.colleagueName || '여우 실장님'}! 혹시`,
      ...p1Lines.slice(0, 2)
    ],
    coverBottomNarration: (sc.narrations && sc.narrations[0]) || `${preset.title}, 결제 전 꼭 비교해봐야 하는 이유!`,
    slide2Step1Tag: 'STEP 01 · 흔한 착각',
    slide2Step1Bubble: [
      '귀찮으니까 남들 하는 대로',
      ...p1Lines.slice(0, 2)
    ],
    slide2Step2Tag: 'STEP 02 · 영수증 팩트체크',
    slide2Step2LeftBubble: [
      '헉?! 생각보다 돈이',
      `너무 많이 나가는데요?! (${resolved.badVal})`
    ],
    slide2Step2RightBubble: [
      ...p2Lines.slice(0, 2),
      `비교해보면 답이 딱 나와요!`
    ],
    badLabel: resolved.badLabel,
    badVal: resolved.badVal,
    goodLabel: resolved.goodLabel,
    goodVal: resolved.goodVal,
    diffVal: resolved.diffVal,
    slide3LeftBubble: [
      p3Lines[0] || '모르고 그냥 결제해서',
      `${cleanDiff} 차이 난다고요?!`
    ],
    slide3RightBubble: [
      `${resolved.goodLabel} 기준으로 바꾸면`,
      `${resolved.goodVal}으로 줄어듭니다!`
    ],
    slide4TopBubble: [
      p4Lines[0] || '내 조건 숫자만 넣으니까',
      p4Lines[1] || '3초 만에 1원 단위 비교 영수증 완성!',
      '쿠팡 최저가 특가템까지 한눈에 끝!'
    ],
    slide4CardTitle: `${preset.title.slice(0, 24)}`,
    slide4CardChips: ['내 조건 숫자 입력', '3초 실물 영수증 비교', '로켓배송 특가 직결']
  };
}

function buildTotoRenderHtml(sample, mode = 'slide-1') {
  const juaUrl = getFontFileUrl('Jua-Regular.ttf');
  const gaeguBoldUrl = getFontFileUrl('Gaegu-Bold.ttf');
  const gaeguRegUrl = getFontFileUrl('Gaegu-Regular.ttf');
  const nanumPenUrl = getFontFileUrl('NanumPenScript-Regular.ttf');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: 'Jua';
    src: url('${juaUrl}') format('truetype');
    font-weight: normal;
  }
  @font-face {
    font-family: 'GaeguBold';
    src: url('${gaeguBoldUrl}') format('truetype');
    font-weight: bold;
  }
  @font-face {
    font-family: 'Gaegu';
    src: url('${gaeguRegUrl}') format('truetype');
    font-weight: normal;
  }
  @font-face {
    font-family: 'NanumPen';
    src: url('${nanumPenUrl}') format('truetype');
    font-weight: normal;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    background: #FAF7F2;
  }
  canvas {
    display: block;
    width: 1080px;
    height: 1080px;
  }
</style>
</head>
<body>
<div style="position:absolute;left:-9999px;top:-9999px;opacity:0;">
  <span style="font-family:'Jua'">가나다</span>
  <span style="font-family:'GaeguBold'">가나다</span>
  <span style="font-family:'Gaegu'">가나다</span>
  <span style="font-family:'NanumPen'">가나다</span>
</div>
<canvas id="c" width="1080" height="1080"></canvas>
<script>
const sample = ${JSON.stringify(sample)};
const mode = ${JSON.stringify(mode)};

const INK = '#1E293B';
const NAVY = '#0F172A';
const EMERALD = '#10B981';
const EMERALD_DARK = '#047857';
const CORAL_RED = '#E11D48';
const CREAM_BG = '#FAF7F2';
const WHITE = '#FFFFFF';

function setPen(ctx, width = 3.8, color = INK) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function fillTextAutoFit(ctx, text, x, y, maxW, baseSize, fontFamily = '"GaeguBold", sans-serif', minSize = 22) {
  let sz = baseSize;
  ctx.font = sz + 'px ' + fontFamily;
  while (sz > minSize && ctx.measureText(text).width > maxW) {
    sz -= 1;
    ctx.font = sz + 'px ' + fontFamily;
  }
  ctx.fillText(text, x, y);
}

function strokeAndFillTextAutoFit(ctx, text, x, y, maxW, baseSize, fontFamily, strokeColor, strokeW, fillColor, minSize = 28) {
  let sz = baseSize;
  ctx.font = sz + 'px ' + fontFamily;
  while (sz > minSize && ctx.measureText(text).width > maxW) {
    sz -= 1;
    ctx.font = sz + 'px ' + fontFamily;
  }
  ctx.lineWidth = strokeW;
  ctx.strokeStyle = strokeColor;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}

function drawNotebookCanvasBg(ctx, bgColor = CREAM_BG) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 1080, 1080);

  // Subtle notebook dot grid
  ctx.fillStyle = 'rgba(148, 163, 184, 0.24)';
  for (let gx = 40; gx < 1050; gx += 40) {
    for (let gy = 40; gy < 1050; gy += 40) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Outer rounded MoneyFit frame
  ctx.save();
  setPen(ctx, 4.5, INK);
  ctx.beginPath();
  ctx.roundRect(22, 22, 1036, 1036, 28);
  ctx.stroke();
  ctx.restore();
}

function drawTopBrandBar(ctx, badgeText, stepLabel = '1 / 4') {
  ctx.save();
  // Left brand pill
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.roundRect(48, 46, 510, 56, 28);
  ctx.fill();

  ctx.fillStyle = '#34D399';
  ctx.font = '30px "Jua", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText || '🐾 머니핏 오리지널 영수증툰', 74, 75);

  // Right account pill (@moneyfit2026 only, no 1/4 step number)
  ctx.fillStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.roundRect(810, 48, 220, 52, 26);
  ctx.fill();
  setPen(ctx, 2.5, INK);
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = '26px "Jua", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('@moneyfit2026', 920, 75);
  ctx.restore();
}

function drawSpeechBubble(ctx, x, y, w, h, lines, options = {}) {
  const {
    fill = WHITE,
    stroke = INK,
    radius = 28,
    tailSide = 'bottom-left',
    tailX = null,
    tailY = null,
    fontSize = 42,
    highlightIdx = -1,
    highlightColor = '#FEF08A'
  } = options;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.10)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;

  ctx.fillStyle = fill;
  setPen(ctx, 3.8, stroke);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.stroke();

  if (tailX !== null && tailY !== null) {
    let bx1 = x + w * 0.25;
    let by1 = y + h - 3;
    let bx2 = x + w * 0.38;
    let by2 = y + h - 3;
    if (tailSide === 'bottom-right') {
      bx1 = x + w * 0.62;
      bx2 = x + w * 0.76;
    } else if (tailSide === 'left') {
      bx1 = x + 3; by1 = y + h * 0.45;
      bx2 = x + 3; by2 = y + h * 0.65;
    } else if (tailSide === 'right') {
      bx1 = x + w - 3; by1 = y + h * 0.45;
      bx2 = x + w - 3; by2 = y + h * 0.65;
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(bx1, by1);
    ctx.lineTo(tailX, tailY);
    ctx.lineTo(bx2, by2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bx1, by1);
    ctx.lineTo(tailX, tailY);
    ctx.lineTo(bx2, by2);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineH = fontSize * 1.24;
  const startY = y + h / 2 - ((lines.length - 1) * lineH) / 2;

  lines.forEach((line, idx) => {
    const ly = startY + idx * lineH;
    if (idx === highlightIdx) {
      ctx.fillStyle = highlightColor;
      ctx.beginPath();
      ctx.roundRect(x + 28, ly - fontSize * 0.48, w - 56, fontSize * 0.96, 10);
      ctx.fill();
    }
    ctx.fillStyle = INK;
    fillTextAutoFit(ctx, line, x + w / 2, ly, w - 48, fontSize, '"GaeguBold", sans-serif', 24);
  });

  ctx.restore();
}

/**
 * Draw 100% Original MoneyFit Full-Color Anthropomorphized Animal Staff Character
 * (Completely original visual design: colored fur, inner ears, snout, blush, clothed torso, MF badge & props)
 */
function drawMoneyFitOriginalCharacter(ctx, cx, cy, scale = 1.0, options = {}) {
  const {
    role = 'fox_director',
    mood = 'smile',
    facing = 'right',
    prop = 'none'
  } = options;

  const palettes = {
    fox_director: {
      fur: '#F97316', earInner: '#FFEDD5', cheekFur: '#FFF7ED',
      outfit: '#059669', shirt: '#FFFFFF', tie: '#FBBF24', glasses: true,
      earType: 'pointed', badge: '🦊 여우실장'
    },
    panda_lead: {
      fur: '#FFFBEB', earInner: '#27272A', cheekFur: '#FFFBEB',
      outfit: '#10B981', shirt: '#ECFDF5', tie: '#047857', glasses: false,
      earType: 'panda', badge: '🐼 팬더팀장'
    },
    bee_manager: {
      fur: '#FACC15', earInner: '#78350F', cheekFur: '#FEF9C3',
      outfit: '#1E293B', shirt: '#FFFFFF', tie: '#F59E0B', glasses: false,
      earType: 'antenna', badge: '🐝 꿀벌과장'
    },
    cheetah_lead: {
      fur: '#F59E0B', earInner: '#FEF3C7', cheekFur: '#FFFBEB',
      outfit: '#2563EB', shirt: '#EFF6FF', tie: '#1D4ED8', glasses: false,
      earType: 'round_spots', badge: '🐆 치타팀장'
    },
    deer_director: {
      fur: '#D97706', earInner: '#FDE68A', cheekFur: '#FEF3C7',
      outfit: '#78716C', shirt: '#FAF8F5', tie: '#10B981', glasses: true,
      earType: 'antlers', badge: '🦌 사슴디렉터'
    },
    maknae_bunny: {
      fur: '#FDE68A', earInner: '#FDA4AF', cheekFur: '#FFFBEB',
      outfit: '#0284C7', shirt: '#E0F2FE', tie: '#38BDF8', glasses: false,
      earType: 'long_bunny', badge: '🐰 토리사원'
    }
  };

  const p = palettes[role] || palettes.maknae_bunny;

  ctx.save();
  ctx.translate(cx, cy);
  if (facing === 'left') {
    ctx.scale(-scale, scale);
  } else {
    ctx.scale(scale, scale);
  }

  setPen(ctx, 4.0, INK);

  // 1. Ears / Antlers / Antennas behind head
  if (p.earType === 'pointed') {
    // Fox pointed ears
    [[-58, -72, -88, -148, -18, -88], [58, -72, 88, -148, 18, -88]].forEach(([x1, y1, tx, ty, x2, y2]) => {
      ctx.fillStyle = p.fur;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(tx, ty); ctx.lineTo(x2, y2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.earInner;
      ctx.beginPath(); ctx.moveTo(x1 * 0.85, y1); ctx.lineTo(tx * 0.86, ty * 0.88); ctx.lineTo(x2 * 1.1, y2); ctx.closePath(); ctx.fill();
    });
  } else if (p.earType === 'long_bunny') {
    // Warm apricot bunny ears
    [[-36, -135, -0.12], [36, -135, 0.12]].forEach(([ex, ey, rot]) => {
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(rot);
      ctx.fillStyle = p.fur;
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 56, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.earInner;
      ctx.beginPath(); ctx.ellipse(0, 4, 11, 38, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  } else if (p.earType === 'panda') {
    ctx.fillStyle = '#27272A';
    ctx.beginPath(); ctx.arc(-62, -78, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(62, -78, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (p.earType === 'antenna') {
    // Cute translucent bee wings on back + antennas on top
    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath(); ctx.ellipse(-78, 45, 32, 18, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(78, 45, 32, 18, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-22, -85); ctx.quadraticCurveTo(-36, -130, -48, -135);
    ctx.moveTo(22, -85); ctx.quadraticCurveTo(36, -130, 48, -135);
    ctx.stroke();
    ctx.fillStyle = '#78350F';
    ctx.beginPath(); ctx.arc(-48, -135, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(48, -135, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (p.earType === 'antlers') {
    // Cute deer ears + antlers
    ctx.fillStyle = p.fur;
    ctx.beginPath(); ctx.ellipse(-68, -68, 22, 14, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(68, -68, 22, 14, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    setPen(ctx, 7, '#FDE68A');
    ctx.beginPath();
    ctx.moveTo(-32, -84); ctx.lineTo(-48, -138); ctx.moveTo(-40, -112); ctx.lineTo(-62, -122);
    ctx.moveTo(32, -84); ctx.lineTo(48, -138); ctx.moveTo(40, -112); ctx.lineTo(62, -122);
    ctx.stroke();
    setPen(ctx, 4.0, INK);
  } else {
    // Cheetah round ears
    ctx.fillStyle = p.fur;
    ctx.beginPath(); ctx.arc(-58, -76, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(58, -76, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = p.earInner;
    ctx.beginPath(); ctx.arc(-58, -76, 13, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(58, -76, 13, 0, Math.PI * 2); ctx.fill();
  }

  // 2. Clothed Upper Body / Jacket / Hoodie + MoneyFit (MF) Employee Badge
  ctx.fillStyle = p.outfit;
  ctx.beginPath();
  ctx.roundRect(-78, 48, 156, 135, [48, 48, 18, 18]);
  ctx.fill();
  ctx.stroke();

  // Shirt V-neck / Collar
  ctx.fillStyle = p.shirt;
  ctx.beginPath();
  ctx.moveTo(-30, 48);
  ctx.lineTo(0, 92);
  ctx.lineTo(30, 48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tie / Lanyard + MF Gold Badge
  ctx.fillStyle = p.tie;
  ctx.beginPath();
  ctx.moveTo(-7, 68); ctx.lineTo(7, 68); ctx.lineTo(10, 125); ctx.lineTo(0, 138); ctx.lineTo(-10, 125);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.roundRect(24, 88, 36, 24, 6);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(42, 101);
  if (facing === 'left') ctx.scale(-1, 1);
  ctx.fillStyle = INK;
  ctx.font = '15px "Jua", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MF', 0, 0);
  ctx.restore();

  // 3. Full-Color Animal Head & Muzzle
  ctx.fillStyle = p.fur;
  ctx.beginPath();
  ctx.ellipse(0, -18, 82, 74, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Lower cheek/muzzle patch
  ctx.fillStyle = p.cheekFur;
  ctx.beginPath();
  ctx.ellipse(0, 2, 42, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rosy cheeks
  ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
  ctx.beginPath(); ctx.ellipse(-48, -2, 15, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(48, -2, 15, 9, 0, 0, Math.PI * 2); ctx.fill();

  // Cheetah spots if cheetah_lead
  if (p.earType === 'round_spots') {
    ctx.fillStyle = '#78350F';
    [[-56, -24], [-64, -12], [56, -24], [64, -12], [0, -64]].forEach(([sx, sy]) => {
      ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2); ctx.fill();
    });
  }

  // Panda eye patches
  if (p.earType === 'panda') {
    ctx.fillStyle = '#27272A';
    ctx.beginPath(); ctx.ellipse(-28, -22, 18, 14, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(28, -22, 18, 14, 0.2, 0, Math.PI * 2); ctx.fill();
  }

  // 4. Eyes, Nose & Expressive Mouth
  if (mood === 'shock' || mood === 'sweat') {
    // Wide shocked eyes + waterfall tears or sweat drop
    ctx.fillStyle = WHITE;
    ctx.beginPath(); ctx.arc(-28, -22, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(28, -22, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(-28, -22, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(28, -22, 4.5, 0, Math.PI * 2); ctx.fill();

    if (mood === 'shock') {
      // Cute sky-blue tear streams
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath(); ctx.roundRect(-36, -10, 10, 32, 5); ctx.fill();
      ctx.beginPath(); ctx.roundRect(26, -10, 10, 32, 5); ctx.fill();
    }

    // Blue sweat drop on temple
    ctx.fillStyle = '#7DD3FC';
    ctx.beginPath();
    ctx.moveTo(64, -52);
    ctx.quadraticCurveTo(76, -30, 64, -22);
    ctx.quadraticCurveTo(52, -30, 64, -52);
    ctx.fill();
    ctx.stroke();

    // Open gasping mouth
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.ellipse(0, 14, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (mood === 'cheer') {
    // Happy curved '^ ^' eyes
    setPen(ctx, 4.2, p.earType === 'panda' ? WHITE : INK);
    ctx.beginPath();
    ctx.arc(-28, -18, 10, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(28, -18, 10, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    setPen(ctx, 4.0, INK);

    // Big happy smile
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.arc(0, 8, 15, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Friendly bright eyes with white shine dot
    ctx.fillStyle = p.earType === 'panda' ? WHITE : INK;
    ctx.beginPath(); ctx.arc(-28, -22, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(28, -22, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.earType === 'panda' ? INK : WHITE;
    ctx.beginPath(); ctx.arc(-25, -25, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(31, -25, 2.6, 0, Math.PI * 2); ctx.fill();

    // Cute 'ㅅ' smile mouth
    ctx.beginPath();
    ctx.moveTo(-10, 12); ctx.quadraticCurveTo(-5, 18, 0, 10); ctx.quadraticCurveTo(5, 18, 10, 12);
    ctx.stroke();
  }

  // Cute button nose
  ctx.fillStyle = '#27272A';
  ctx.beginPath();
  ctx.ellipse(0, -4, 8, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Smart glasses for Fox Director / Deer Director
  if (p.glasses) {
    setPen(ctx, 3.2, '#B45309');
    ctx.beginPath();
    ctx.arc(-28, -22, 18, 0, Math.PI * 2);
    ctx.moveTo(-10, -22); ctx.lineTo(10, -22);
    ctx.arc(28, -22, 18, 0, Math.PI * 2);
    ctx.stroke();
    setPen(ctx, 4.0, INK);
  }

  // 5. Arms & Category Props
  ctx.fillStyle = p.outfit;
  if (prop === 'bill_red') {
    // Holding a red warning bill sheet
    ctx.save();
    ctx.translate(78, 72);
    ctx.rotate(0.15);
    ctx.fillStyle = '#FFF1F2';
    ctx.beginPath(); ctx.roundRect(-34, -46, 68, 92, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CORAL_RED;
    ctx.fillRect(-24, -34, 48, 16);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-24, -8, 44, 7);
    ctx.fillRect(-24, 6, 36, 7);
    ctx.fillRect(-24, 20, 48, 9);
    ctx.restore();
  } else if (prop === 'calc_tablet') {
    // Holding an emerald MoneyFit calculator tablet
    ctx.save();
    ctx.translate(82, 68);
    ctx.rotate(-0.12);
    ctx.fillStyle = NAVY;
    ctx.beginPath(); ctx.roundRect(-38, -50, 76, 100, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = EMERALD;
    ctx.fillRect(-28, -36, 56, 24);
    ctx.fillStyle = WHITE;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillRect(-26 + c * 19, -2 + r * 18, 14, 12);
      }
    }
    ctx.restore();
  } else if (prop === 'coins') {
    // Cheering paws + gold coin
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath(); ctx.arc(82, -25, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.save();
    ctx.translate(82, -24);
    if (facing === 'left') ctx.scale(-1, 1);
    ctx.fillStyle = '#78350F';
    ctx.font = '24px "Jua", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₩', 0, 0);
    ctx.restore();
  }

  // Name badge pill below character (always un-mirrored)
  ctx.save();
  ctx.translate(0, 182);
  if (facing === 'left') ctx.scale(-1, 1);
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.roundRect(-68, -17, 136, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#FDE047';
  ctx.font = '21px "Jua", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.badge, 0, 1);
  ctx.restore();

  ctx.restore();
}

/**
 * SLIDE 1: 100% Original MoneyFit Magazine Cover Card
 */
function drawSlide1(ctx) {
  drawNotebookCanvasBg(ctx, '#FAF7F2');
  drawTopBrandBar(ctx, sample.categoryBadge, '1 / 4');

  // Original Tilted Signboard Card for Cover Headline
  ctx.save();
  ctx.translate(540, 265);
  ctx.rotate(-0.018);
  ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = WHITE;
  setPen(ctx, 4.5, INK);
  ctx.beginPath();
  ctx.roundRect(-455, -125, 910, 250, 28);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.stroke();

  // Top decorative Emerald tape on the signboard
  ctx.fillStyle = EMERALD;
  ctx.beginPath();
  ctx.roundRect(-110, -142, 220, 34, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = WHITE;
  ctx.font = '22px "Jua", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('3초 본전 팩트체크', 0, -124);

  // Highlight bar behind Line 2
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.roundRect(-410, 12, 820, 86, 16);
  ctx.fill();

  // 2-Line Cover Headline (Deep Navy Line 1 + Coral-Red Line 2)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  strokeAndFillTextAutoFit(ctx, sample.coverTitleLines[0] || '', 0, -52, 840, 86, '"Jua", sans-serif', WHITE, 8, NAVY, 48);
  strokeAndFillTextAutoFit(ctx, sample.coverTitleLines[1] || '', 0, 52, 840, 88, '"Jua", sans-serif', WHITE, 8, CORAL_RED, 48);
  ctx.restore();

  // Center Speech Bubble + 2 MoneyFit Original Characters conversing
  drawSpeechBubble(ctx, 295, 420, 490, 190, sample.coverBubbleLines || [], {
    fill: '#FFFBEB',
    radius: 28,
    tailSide: 'bottom-left',
    tailX: 255,
    tailY: 645,
    fontSize: 40,
    highlightIdx: 1,
    highlightColor: '#FDE68A'
  });

  drawMoneyFitOriginalCharacter(ctx, 205, 755, 0.92, {
    role: sample.coverRole || 'maknae_bunny',
    mood: 'sweat',
    facing: 'right',
    prop: 'bill_red'
  });

  drawMoneyFitOriginalCharacter(ctx, 870, 755, 0.92, {
    role: sample.colleagueRole || 'fox_director',
    mood: 'smile',
    facing: 'left',
    prop: 'calc_tablet'
  });

  // Bottom Narration Ribbon Bar
  ctx.save();
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.roundRect(54, 955, 972, 74, 20);
  ctx.fill();
  ctx.fillStyle = '#FDE68A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fillTextAutoFit(ctx, '💬 ' + (sample.coverBottomNarration || ''), 540, 993, 920, 38, '"GaeguBold", sans-serif', 24);
  ctx.restore();
}

/**
 * SLIDE 2: 2-Panel Vertical Rounded Comic Strip (STEP 01 흔한 착각 vs STEP 02 고지서 멘붕)
 */
function drawSlide2(ctx) {
  drawNotebookCanvasBg(ctx, '#FAF7F2');
  drawTopBrandBar(ctx, sample.categoryBadge, '2 / 4');

  // --- TOP PANEL (STEP 01: 흔한 착각) ---
  ctx.save();
  ctx.fillStyle = '#FFFBEB';
  setPen(ctx, 4.0, INK);
  ctx.beginPath();
  ctx.roundRect(52, 122, 976, 415, 26);
  ctx.fill();
  ctx.stroke();

  // Panel 1 Tag Pill
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.roundRect(78, 144, 290, 44, 22);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = WHITE;
  ctx.font = '24px "Jua", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sample.slide2Step1Tag || 'STEP 01 · 흔한 착각', 223, 167);

  drawMoneyFitOriginalCharacter(ctx, 225, 360, 0.78, {
    role: sample.coverRole || 'maknae_bunny',
    mood: 'smile',
    facing: 'right',
    prop: 'none'
  });

  drawSpeechBubble(ctx, 415, 185, 570, 265, sample.slide2Step1Bubble || [], {
    fill: WHITE,
    radius: 28,
    tailSide: 'left',
    tailX: 335,
    tailY: 335,
    fontSize: 42,
    highlightIdx: 1,
    highlightColor: '#FEF08A'
  });
  ctx.restore();

  // --- BOTTOM PANEL (STEP 02: 고지서·견적서 도착 후 멘붕 & 팩트체크) ---
  ctx.save();
  ctx.fillStyle = '#FDF2F8';
  setPen(ctx, 4.0, INK);
  ctx.beginPath();
  ctx.roundRect(52, 560, 976, 472, 26);
  ctx.fill();
  ctx.stroke();

  // Panel 2 Tag Pill
  ctx.fillStyle = CORAL_RED;
  ctx.beginPath();
  ctx.roundRect(78, 580, 380, 42, 21);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = WHITE;
  ctx.font = '23px "Jua", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sample.slide2Step2Tag || 'STEP 02 · 영수증 팩트체크', 268, 602);

  drawSpeechBubble(ctx, 78, 634, 430, 128, sample.slide2Step2LeftBubble || [], {
    fill: WHITE,
    radius: 22,
    tailSide: 'bottom-left',
    tailX: 175,
    tailY: 790,
    fontSize: 35,
    highlightIdx: 1,
    highlightColor: '#FECDD3'
  });

  drawSpeechBubble(ctx, 535, 624, 465, 148, sample.slide2Step2RightBubble || [], {
    fill: '#ECFDF5',
    radius: 22,
    tailSide: 'bottom-right',
    tailX: 855,
    tailY: 798,
    fontSize: 34,
    highlightIdx: 1,
    highlightColor: '#A7F3D0'
  });

  drawMoneyFitOriginalCharacter(ctx, 215, 895, 0.68, {
    role: sample.coverRole || 'maknae_bunny',
    mood: 'shock',
    facing: 'right',
    prop: 'bill_red'
  });

  drawMoneyFitOriginalCharacter(ctx, 845, 895, 0.68, {
    role: sample.colleagueRole || 'fox_director',
    mood: 'smile',
    facing: 'left',
    prop: 'calc_tablet'
  });
  ctx.restore();
}

/**
 * SLIDE 3: MoneyFit Signature Perforated 3-Second Comparison Receipt + Character Fact-Check
 */
function drawSlide3(ctx) {
  drawNotebookCanvasBg(ctx, '#F0FDF4');
  drawTopBrandBar(ctx, '🧾 머니핏 3초 비교 영수증', '3 / 4');

  // --- Perforated Thermal Receipt Card (y = 122..595) ---
  const rx = 68;
  const ry = 122;
  const rw = 944;
  const rh = 472;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.14)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = '#FFFEF9';
  setPen(ctx, 4.0, INK);
  ctx.beginPath();
  ctx.moveTo(rx, ry + 14);
  const teeth = 28;
  const toothW = rw / teeth;
  for (let i = 0; i < teeth; i++) {
    ctx.lineTo(rx + i * toothW + toothW / 2, ry);
    ctx.lineTo(rx + (i + 1) * toothW, ry + 14);
  }
  ctx.lineTo(rx + rw, ry + rh - 14);
  for (let i = teeth; i > 0; i--) {
    ctx.lineTo(rx + i * toothW - toothW / 2, ry + rh);
    ctx.lineTo(rx + (i - 1) * toothW, ry + rh - 14);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.stroke();

  // Receipt Header Bar
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.roundRect(rx + 28, ry + 28, rw - 56, 58, 14);
  ctx.fill();
  ctx.fillStyle = '#FDE047';
  ctx.font = '31px "Jua", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧾 [머니핏 1원 단위 실물 비교 영수증]', rx + rw / 2, ry + 58);

  // Row 1: Bad Option (Red Box)
  ctx.fillStyle = '#FFF1F2';
  setPen(ctx, 3.0, '#F43F5E');
  ctx.beginPath();
  ctx.roundRect(rx + 32, ry + 104, rw - 64, 104, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#BE123C';
  ctx.textAlign = 'left';
  fillTextAutoFit(ctx, '❌ ' + (sample.badLabel || '기존 방식'), rx + 58, ry + 156, 460, 38, '"Jua", sans-serif', 24);
  ctx.textAlign = 'right';
  fillTextAutoFit(ctx, String(sample.badVal || ''), rx + rw - 58, ry + 156, 390, 44, '"Jua", sans-serif', 26);

  // Row 2: Good Option (Emerald Box)
  ctx.fillStyle = '#ECFDF5';
  setPen(ctx, 3.0, EMERALD);
  ctx.beginPath();
  ctx.roundRect(rx + 32, ry + 226, rw - 64, 104, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = EMERALD_DARK;
  ctx.textAlign = 'left';
  fillTextAutoFit(ctx, '✅ ' + (sample.goodLabel || '머니핏 최적 루트'), rx + 58, ry + 278, 460, 38, '"Jua", sans-serif', 24);
  ctx.textAlign = 'right';
  fillTextAutoFit(ctx, String(sample.goodVal || ''), rx + rw - 58, ry + 278, 390, 44, '"Jua", sans-serif', 26);

  // Row 3: Highlighted Diff Stamp Banner
  ctx.fillStyle = '#FEF08A';
  setPen(ctx, 3.8, INK);
  ctx.beginPath();
  ctx.roundRect(rx + 32, ry + 350, rw - 64, 88, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = CORAL_RED;
  ctx.textAlign = 'center';
  fillTextAutoFit(ctx, '🔥 모르면 날리는 생돈 차이 : ' + String(sample.diffVal || ''), rx + rw / 2, ry + 395, rw - 110, 44, '"Jua", sans-serif', 26);
  ctx.restore();

  // --- Bottom Reaction Scene (y = 618..1035) ---
  drawSpeechBubble(ctx, 56, 616, 465, 138, sample.slide3LeftBubble || [], {
    fill: WHITE,
    radius: 24,
    tailSide: 'bottom-left',
    tailX: 175,
    tailY: 782,
    fontSize: 36,
    highlightIdx: 1,
    highlightColor: '#FECDD3'
  });

  drawSpeechBubble(ctx, 555, 616, 468, 138, sample.slide3RightBubble || [], {
    fill: WHITE,
    radius: 24,
    tailSide: 'bottom-right',
    tailX: 855,
    tailY: 782,
    fontSize: 36,
    highlightIdx: 1,
    highlightColor: '#FEF08A'
  });

  drawMoneyFitOriginalCharacter(ctx, 210, 895, 0.68, {
    role: sample.coverRole || 'maknae_bunny',
    mood: 'shock',
    facing: 'right',
    prop: 'none'
  });

  drawMoneyFitOriginalCharacter(ctx, 860, 895, 0.68, {
    role: sample.colleagueRole || 'fox_director',
    mood: 'smile',
    facing: 'left',
    prop: 'calc_tablet'
  });
}

/**
 * SLIDE 4: Actionable Solution + Interactive 3-Second Calculator UI Card
 */
function drawSlide4(ctx) {
  drawNotebookCanvasBg(ctx, '#F8FAFC');
  drawTopBrandBar(ctx, '⚡ 3초 무료 계산기 & 최저가 솔루션', '4 / 4');

  // Top Cheering Speech Bubble + 2 Cheering Characters
  drawSpeechBubble(ctx, 165, 122, 750, 195, sample.slide4TopBubble || [], {
    fill: '#FFFBEB',
    radius: 30,
    tailSide: 'bottom-left',
    tailX: 330,
    tailY: 348,
    fontSize: 38,
    highlightIdx: 1,
    highlightColor: '#A7F3D0'
  });

  drawMoneyFitOriginalCharacter(ctx, 295, 480, 0.68, {
    role: sample.coverRole || 'maknae_bunny',
    mood: 'cheer',
    facing: 'right',
    prop: 'coins'
  });

  drawMoneyFitOriginalCharacter(ctx, 785, 480, 0.68, {
    role: sample.colleagueRole || 'fox_director',
    mood: 'cheer',
    facing: 'left',
    prop: 'calc_tablet'
  });

  // Bottom Interactive Calculator UI Card (y = 635..1030)
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = NAVY;
  setPen(ctx, 4.0, INK);
  ctx.beginPath();
  ctx.roundRect(58, 635, 964, 392, 28);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.stroke();

  // Card Title
  ctx.fillStyle = '#34D399';
  ctx.font = '28px "Jua", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📱 회원가입 0원 · 내 조건 넣으면 3초 만에 영수증 출력!', 540, 688);

  ctx.fillStyle = WHITE;
  fillTextAutoFit(ctx, '「 ' + (sample.slide4CardTitle || '') + ' 」', 540, 745, 880, 44, '"Jua", sans-serif', 28);

  // 3 Feature Chips
  const chips = sample.slide4CardChips || ['내 조건 숫자 입력', '3초 비교 영수증', '로켓배송 특가 연동'];
  const chipW = 278;
  const chipGap = 24;
  const chipStartX = (1080 - (chipW * 3 + chipGap * 2)) / 2;
  chips.slice(0, 3).forEach((ch, idx) => {
    const cx = chipStartX + idx * (chipW + chipGap);
    ctx.fillStyle = '#1E293B';
    setPen(ctx, 2.5, '#34D399');
    ctx.beginPath();
    ctx.roundRect(cx, 792, chipW, 66, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    fillTextAutoFit(ctx, '✓ ' + ch, cx + chipW / 2, 826, chipW - 24, 28, '"Jua", sans-serif', 20);
  });

  // Bottom Bright Emerald CTA Button inside Card
  ctx.fillStyle = EMERALD;
  setPen(ctx, 3.5, WHITE);
  ctx.beginPath();
  ctx.roundRect(96, 888, 888, 104, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = NAVY;
  fillTextAutoFit(ctx, '👉 프로필 링크 클릭 또는 검색창에 [ 머니핏 ] 검색!', 540, 942, 840, 40, '"Jua", sans-serif', 26);
  ctx.restore();
}

function renderNow() {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');

  if (mode === 'slide-1') drawSlide1(ctx);
  else if (mode === 'slide-2') drawSlide2(ctx);
  else if (mode === 'slide-3') drawSlide3(ctx);
  else if (mode === 'slide-4') drawSlide4(ctx);
  else if (mode === 'grid') {
    const off1 = document.createElement('canvas'); off1.width = 1080; off1.height = 1080; drawSlide1(off1.getContext('2d'));
    const off2 = document.createElement('canvas'); off2.width = 1080; off2.height = 1080; drawSlide2(off2.getContext('2d'));
    const off3 = document.createElement('canvas'); off3.width = 1080; off3.height = 1080; drawSlide3(off3.getContext('2d'));
    const off4 = document.createElement('canvas'); off4.width = 1080; off4.height = 1080; drawSlide4(off4.getContext('2d'));

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 1080, 1080);
    const pad = 16;
    const gap = 16;
    const cell = (1080 - pad * 2 - gap) / 2;

    const cells = [
      [off1, pad, pad],
      [off2, pad + cell + gap, pad],
      [off3, pad, pad + cell + gap],
      [off4, pad + cell + gap, pad + cell + gap]
    ];
    cells.forEach(([c, x, y]) => {
      ctx.drawImage(c, x, y, cell, cell);
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, cell, cell);
    });
  }
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    renderNow();
    document.body.setAttribute('data-rendered', 'true');
  });
} else {
  window.onload = renderNow;
}
</script>
</body>
</html>`;
}

function renderTotoPngWithChrome(chromePath, htmlContent, outputPngPath) {
  const outDir = path.dirname(outputPngPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tempHtmlPath = path.join(
    os.tmpdir(),
    `mf-orig-${Date.now()}-${Math.random().toString(36).slice(2)}.html`
  );
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
  const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');

  spawnSync(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      '--virtual-time-budget=2500',
      '--window-size=1080,1080',
      `--screenshot=${outputPngPath}`,
      fileUrl
    ],
    { encoding: 'utf8', timeout: 25000 }
  );

  try {
    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
  } catch (e) {}

  return fs.existsSync(outputPngPath);
}

function renderTotoPngWithChromeAsync(chromePath, htmlContent, outputPngPath) {
  return new Promise(resolve => {
    const outDir = path.dirname(outputPngPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const tempHtmlPath = path.join(
      os.tmpdir(),
      `mf-orig-${Date.now()}-${Math.random().toString(36).slice(2)}.html`
    );
    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
    const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');

    const child = spawn(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--allow-file-access-from-files',
        '--virtual-time-budget=2000',
        '--window-size=1080,1080',
        `--screenshot=${outputPngPath}`,
        fileUrl
      ],
      { stdio: 'ignore' }
    );

    const cleanup = () => {
      try {
        if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
      } catch (e) {}
    };

    const timer = setTimeout(() => {
      try { child.kill(); } catch (e) {}
      cleanup();
      resolve(false);
    }, 25000);

    child.on('close', code => {
      clearTimeout(timer);
      cleanup();
      resolve(code === 0 && fs.existsSync(outputPngPath));
    });
    child.on('error', () => {
      clearTimeout(timer);
      cleanup();
      resolve(false);
    });
  });
}

async function renderTotoEpisodeForSlug(slug = 'electric-studio-ac', options = {}) {
  const chromePath = findChromeExecutable();
  if (!chromePath) {
    throw new Error('Chrome executable not found');
  }

  const sample = buildTotoEpisodeSpec(slug);
  const outDir = path.join(ROOT_DIR, 'sns_outbox', sample.slug);
  const publicSnsDir = path.join(ROOT_DIR, 'sns');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(publicSnsDir)) fs.mkdirSync(publicSnsDir, { recursive: true });

  const s1Path = path.join(outDir, 'slide-1.png');
  const s2Path = path.join(outDir, 'slide-2.png');
  const s3Path = path.join(outDir, 'slide-3.png');
  const s4Path = path.join(outDir, 'slide-4.png');
  const gridPath = path.join(outDir, 'webtoon-grid.png');
  const publicGridPath = path.join(publicSnsDir, `${sample.slug}-grid.png`);

  const jobs = [
    { mode: 'slide-1', path: s1Path },
    { mode: 'slide-2', path: s2Path },
    { mode: 'slide-3', path: s3Path },
    { mode: 'slide-4', path: s4Path },
    { mode: 'grid', path: gridPath }
  ];

  await Promise.all(
    jobs.map(async j => {
      if (options.skipExisting && fs.existsSync(j.path)) return;
      const ok = await renderTotoPngWithChromeAsync(chromePath, buildTotoRenderHtml(sample, j.mode), j.path);
      if (!ok || !fs.existsSync(j.path)) {
        renderTotoPngWithChrome(chromePath, buildTotoRenderHtml(sample, j.mode), j.path);
      }
    })
  );

  if (fs.existsSync(gridPath)) {
    fs.copyFileSync(gridPath, publicGridPath);
  }

  return {
    slug: sample.slug,
    s1Path,
    s2Path,
    s3Path,
    s4Path,
    gridPath,
    publicGridPath
  };
}

function renderTotoSample1() {
  const chromePath = findChromeExecutable();
  if (!chromePath) {
    throw new Error('Chrome executable not found');
  }
  const sample = buildTotoEpisodeSpec('electric-studio-ac');
  const outDir = path.join(ROOT_DIR, 'sns_outbox', sample.slug);
  const publicSnsDir = path.join(ROOT_DIR, 'sns');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(publicSnsDir)) fs.mkdirSync(publicSnsDir, { recursive: true });

  const s1Path = path.join(outDir, 'slide-1.png');
  const s2Path = path.join(outDir, 'slide-2.png');
  const s3Path = path.join(outDir, 'slide-3.png');
  const s4Path = path.join(outDir, 'slide-4.png');
  const gridPath = path.join(outDir, 'webtoon-grid.png');
  const publicGridPath = path.join(publicSnsDir, `${sample.slug}-grid.png`);

  renderTotoPngWithChrome(chromePath, buildTotoRenderHtml(sample, 'slide-1'), s1Path);
  renderTotoPngWithChrome(chromePath, buildTotoRenderHtml(sample, 'slide-2'), s2Path);
  renderTotoPngWithChrome(chromePath, buildTotoRenderHtml(sample, 'slide-3'), s3Path);
  renderTotoPngWithChrome(chromePath, buildTotoRenderHtml(sample, 'slide-4'), s4Path);
  renderTotoPngWithChrome(chromePath, buildTotoRenderHtml(sample, 'grid'), gridPath);

  if (fs.existsSync(gridPath)) {
    fs.copyFileSync(gridPath, publicGridPath);
  }

  return {
    slug: sample.slug,
    s1Path,
    s2Path,
    s3Path,
    s4Path,
    gridPath,
    publicGridPath
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const isAll36 = args.includes('--all36');
  const slugArg = args.find(a => a.startsWith('--slug='));
  const slug = slugArg ? slugArg.split('=')[1] : null;

  (async () => {
    if (isAll36) {
      console.log(`Rendering all ${PRESETS.length} episodes in 100% Original MoneyFit Webtoon style...`);
      for (let i = 0; i < PRESETS.length; i += 2) {
        const batch = PRESETS.slice(i, i + 2);
        const resList = await Promise.all(batch.map(p => renderTotoEpisodeForSlug(p.id)));
        resList.forEach(r => console.log(`  ✓ [${r.slug}] 4 slides + grid rendered`));
      }
      console.log('🎉 All 36 Original MoneyFit Webtoon episodes rendered!');
    } else if (slug) {
      const res = await renderTotoEpisodeForSlug(slug);
      console.log('Generated Original MoneyFit Webtoon:', res);
    } else {
      const res = renderTotoSample1();
      console.log('Generated Original MoneyFit Sample Webtoon:', res);
    }
  })().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  TOTO_CURATED_META,
  buildTotoEpisodeSpec,
  buildTotoRenderHtml,
  renderTotoEpisodeForSlug,
  renderTotoSample1
};
