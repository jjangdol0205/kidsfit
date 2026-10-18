#!/usr/bin/env node
/**
 * MoneyFit @to_to_studio_ Style Human-Drawn Instatoon Engine (36-Episode Full Suite)
 * (토토 스튜디오 `@to_to_studio_` 감성 100% 학습 · 머니핏 직원 캐릭터 4슬라이드 인스타툰 엔진)
 *
 * Key Visual DNA from @to_to_studio_:
 * 1. Never crams 4 panels into a 2x2 grid for Instagram — renders 4 full 1080x1080 slides (`slide-1.png` ~ `slide-4.png`)
 *    plus a composite `webtoon-grid.png` for web/Naver preview.
 * 2. Slide 1 (Cover): Borderless pure white canvas (#FFFFFF), giant 2-line yellow title (#FFD15C) with thick black outline
 *    in 'Jua' font, 1 minimalist white marshmallow staff character (open-bottom stroke) holding a prop, pale mint/pastel
 *    speech bubble (#E2F3F1), and 1-line bottom narration in 'Gaegu' handwriting font.
 * 3. Slide 2 (Office Reality & Side Notes): Horizontal 2-split at y=365 with blue gloom vertical streaks at top,
 *    yellow rectangular caption box (#FFF59D) flush left on the divider line, and 3 freeform vignettes in open white space
 *    with handwritten side notes & curved arrows ("↗ 여우 실장님..", "뭔 소리여..") in 'Nanum Pen' font.
 * 4. Slide 3 (Climax Scolding & Fact-Check Shock): Horizontal 2-split at y=545 with dark stormy (#52525B) top panel,
 *    glowing white storm spots + lightning, angry 🐯 호랑이 이사님 + "극대노.." + 2 black spiky explosion bubbles with real
 *    calculator numbers, and white bottom panel with frozen hollow-eyed staff character + spiky radial urchin bubble.
 * 5. Slide 4 (Conclusion): Borderless white canvas, 2-line top narration, yellow note box (#FFF59D) on left,
 *    handwritten note + swirl lines, and staff character at white desk with tablet/calculator.
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
 * Curated 2-line @to_to_studio_ cover titles & staff cast rotation for all 36 presets
 */
const TOTO_CURATED_META = {
  // 1. Electric
  'electric-studio-ac': {
    coverTitleLines: ['에어컨 아끼다', '호구 되는 이유'],
    coverRole: 'maknae_bunny', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'bee_manager', deskRole: 'fox_director'
  },
  'electric-stand-ac': {
    coverTitleLines: ['거실 에어컨 틀다', '폭탄 맞는 이유'],
    coverRole: 'panda_lead', coverFacing: 'right', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'maknae_bunny', deskRole: 'panda_lead'
  },
  'electric-dehumidifier': {
    coverTitleLines: ['제습기 계속 틀다', '눈물 흘린 사연'],
    coverRole: 'bee_manager', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'cheetah_lead', deskRole: 'fox_director'
  },
  'electric-dryer': {
    coverTitleLines: ['건조기 전기세가', '무서웠던 막내'],
    coverRole: 'maknae_bunny', coverFacing: 'right', coverProp: 'bag',
    colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    thirdRole: 'panda_lead', deskRole: 'maknae_bunny'
  },
  'electric-winter-heater': {
    coverTitleLines: ['전기히터 틀었다가', '월급 증발한 썰'],
    coverRole: 'cheetah_lead', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'maknae_bunny', deskRole: 'fox_director'
  },
  'electric-inverter-roi': {
    coverTitleLines: ['구형 에어컨 버티다', '생돈 날린 이유'],
    coverRole: 'bee_manager', coverFacing: 'right', coverProp: 'pointer',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'panda_lead', deskRole: 'bee_manager'
  },

  // 2. Diet
  'diet-male-fatloss': {
    coverTitleLines: ['편의점 닭가슴살', '사먹다 파산한 썰'],
    coverRole: 'cheetah_lead', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    thirdRole: 'maknae_bunny', deskRole: 'cheetah_lead'
  },
  'diet-female-lean': {
    coverTitleLines: ['고구마만 먹다가', '요요 터진 이유'],
    coverRole: 'maknae_bunny', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'panda_lead', deskRole: 'fox_director'
  },
  'diet-male-bulkup': {
    coverTitleLines: ['보충제만 퍼먹다', '배만 나온 사연'],
    coverRole: 'panda_lead', coverFacing: 'right', coverProp: 'bag',
    colleagueRole: 'cheetah_lead', colleagueName: '치타 팀장님',
    thirdRole: 'bee_manager', deskRole: 'panda_lead'
  },
  'diet-office-worker': {
    coverTitleLines: ['직장인 점심값', '반값 줄인 비결'],
    coverRole: 'panda_lead', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'maknae_bunny', deskRole: 'fox_director'
  },
  'diet-student-budget': {
    coverTitleLines: ['자취생 일주일', '식단비 아끼는 법'],
    coverRole: 'maknae_bunny', coverFacing: 'right', coverProp: 'phone',
    colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    thirdRole: 'cheetah_lead', deskRole: 'maknae_bunny'
  },
  'diet-quick-3kg': {
    coverTitleLines: ['급찐급빠 굶다가', '폭식 터진 이유'],
    coverRole: 'bee_manager', coverFacing: 'left', coverProp: 'pointer',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'maknae_bunny', deskRole: 'bee_manager'
  },

  // 3. Pet
  'pet-maltese-5kg': {
    coverTitleLines: ['종이컵으로 사료', '주다 큰일난 이유'],
    coverRole: 'maknae_bunny', coverFacing: 'left', coverProp: 'bag',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'bee_manager', deskRole: 'fox_director'
  },
  'pet-pomeranian-puppy': {
    coverTitleLines: ['아기 강아지 사료', '눈대중의 최후'],
    coverRole: 'panda_lead', coverFacing: 'right', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'maknae_bunny', deskRole: 'panda_lead'
  },
  'pet-golden-retriever': {
    coverTitleLines: ['대형견 소포장 사료', '사다 통장 털린 썰'],
    coverRole: 'cheetah_lead', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    thirdRole: 'panda_lead', deskRole: 'cheetah_lead'
  },
  'pet-korean-shorthair': {
    coverTitleLines: ['고양이 자율급식', '믿었다가 생긴 일'],
    coverRole: 'maknae_bunny', coverFacing: 'right', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'cheetah_lead', deskRole: 'fox_director'
  },
  'pet-senior-cat': {
    coverTitleLines: ['노령묘 건사료만', '주다 후회한 이유'],
    coverRole: 'bee_manager', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'maknae_bunny', deskRole: 'bee_manager'
  },
  'pet-monthly-budget': {
    coverTitleLines: ['강아지 첫 입양', '용품 호구 피하기'],
    coverRole: 'panda_lead', coverFacing: 'left', coverProp: 'bag',
    colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    thirdRole: 'maknae_bunny', deskRole: 'fox_director'
  },

  // 4. Room
  'room-oneroom-100': {
    coverTitleLines: ['첫 자취방 가구', '예산 초과 막는 법'],
    coverRole: 'maknae_bunny', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'bee_manager', deskRole: 'maknae_bunny'
  },
  'room-officetel-300': {
    coverTitleLines: ['오피스텔 인테리어', '감성만 쫓은 최후'],
    coverRole: 'bee_manager', coverFacing: 'right', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'panda_lead', deskRole: 'fox_director'
  },
  'room-officetel-500': {
    coverTitleLines: ['투룸 이사할 때', '백화점 가면 안됨'],
    coverRole: 'panda_lead', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    thirdRole: 'cheetah_lead', deskRole: 'panda_lead'
  },
  'room-newlywed-1000': {
    coverTitleLines: ['신혼가전 견적서', '그대로 사면 손해'],
    coverRole: 'cheetah_lead', coverFacing: 'right', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'bee_manager', deskRole: 'fox_director'
  },
  'room-minimalist-50': {
    coverTitleLines: ['단기 원룸에', '큰 가구 사면 안됨'],
    coverRole: 'maknae_bunny', coverFacing: 'left', coverProp: 'bag',
    colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    thirdRole: 'panda_lead', deskRole: 'maknae_bunny'
  },
  'room-appliances-only': {
    coverTitleLines: ['중고가전 샀다가', '수리비 폭탄 맞음'],
    coverRole: 'bee_manager', coverFacing: 'right', coverProp: 'pointer',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'maknae_bunny', deskRole: 'bee_manager'
  },

  // 5. Auto
  'auto-avante-3000': {
    coverTitleLines: ['사회초년생 첫차', '렌트 vs 할부 진실'],
    coverRole: 'maknae_bunny', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'cheetah_lead', deskRole: 'fox_director'
  },
  'auto-grandeur-5000': {
    coverTitleLines: ['사업자 그랜저를', '할부로 사면 손해'],
    coverRole: 'fox_director', coverFacing: 'left', coverProp: 'tablet',
    colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    thirdRole: 'maknae_bunny', deskRole: 'fox_director'
  },
  'auto-tucson-hybrid': {
    coverTitleLines: ['투싼 하이브리드', '취등록세 아끼는법'],
    coverRole: 'panda_lead', coverFacing: 'right', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'bee_manager', deskRole: 'panda_lead'
  },
  'auto-genesis-g80': {
    coverTitleLines: ['제네시스 G80', '절세 폭탄 피하기'],
    coverRole: 'cheetah_lead', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'panda_lead', deskRole: 'fox_director'
  },
  'auto-casper-cash-vs-rent': {
    coverTitleLines: ['캐스퍼 첫차 보험료', '폭탄 피하는 방법'],
    coverRole: 'maknae_bunny', coverFacing: 'right', coverProp: 'phone',
    colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    thirdRole: 'panda_lead', deskRole: 'maknae_bunny'
  },
  'auto-ev-ioniq': {
    coverTitleLines: ['전기차 보조금', '못 받을 뻔한 사연'],
    coverRole: 'bee_manager', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'cheetah_lead', deskRole: 'fox_director'
  },

  // 6. Telecom
  'telecom-penalty-15': {
    coverTitleLines: ['위약금 15만원', '무서워 참은 최후'],
    coverRole: 'cheetah_lead', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'bee_manager', deskRole: 'fox_director'
  },
  'telecom-penalty-30': {
    coverTitleLines: ['위약금 30만원도', '바꾸면 이득인 이유'],
    coverRole: 'maknae_bunny', coverFacing: 'right', coverProp: 'phone',
    colleagueRole: 'bee_manager', colleagueName: '꿀벌 과장님',
    thirdRole: 'panda_lead', deskRole: 'maknae_bunny'
  },
  'telecom-3yr-expired': {
    coverTitleLines: ['3년 끝난 인터넷', '방치하면 호구됨'],
    coverRole: 'panda_lead', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'maknae_bunny', deskRole: 'panda_lead'
  },
  'telecom-single-oneroom': {
    coverTitleLines: ['자취방 인터넷만', '써도 현금 나오는법'],
    coverRole: 'maknae_bunny', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'cheetah_lead', colleagueName: '치타 팀장님',
    thirdRole: 'bee_manager', deskRole: 'fox_director'
  },
  'telecom-family-4p': {
    coverTitleLines: ['가족 휴대폰 따로', '쓰다 날린 171만원'],
    coverRole: 'bee_manager', coverFacing: 'right', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'panda_lead', deskRole: 'bee_manager'
  },
  'telecom-mvno-switch': {
    coverTitleLines: ['6만원 5G 요금제', '반값 줄인 비결'],
    coverRole: 'cheetah_lead', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'maknae_bunny', deskRole: 'cheetah_lead'
  }
};

/**
 * Build complete @to_to_studio_ 4-slide script for any preset slug
 */
function buildTotoEpisodeSpec(presetOrSlug) {
  const preset = typeof presetOrSlug === 'string'
    ? PRESETS.find(p => p.id === presetOrSlug || p.slug === presetOrSlug) || PRESETS[0]
    : presetOrSlug;
  const slug = preset.id || preset.slug || 'electric-studio-ac';

  if (slug === 'electric-studio-ac') {
    return {
      slug: 'electric-studio-ac',
      coverTitleLines: ['에어컨 아끼다', '호구 되는 이유'],
      coverRole: 'maknae_bunny',
      coverFacing: 'left',
      coverProp: 'phone',
      colleagueRole: 'fox_director',
      thirdRole: 'bee_manager',
      deskRole: 'fox_director',
      coverBubbleLines: ['실장님 혹시', '에어컨 껐다 켰다', '하면 아껴지나요?'],
      coverBottomNarration: '여름마다 머니핏 사무실에 가장 많이 오는 질문이다.',
      slide2TopBubble: ['솔직히 전기세 무서워서', '조금만 시원해지면 끄고', '더우면 다시 켜긴 합니다.'],
      slide2YellowBox: '더우면 켜고, 추우면 끄고를 반복함',
      slide2Vignette1Bubble: ['시원하니까', '일단 끄자!'],
      slide2Vignette2Bubble: ['실외기님..', '방금 또 켜서', '전력 3배 소모중..'],
      slide2SideNoteRight: ['↗ 여우 실장님.', '실외기 감시 중'],
      slide2Vignette3Bubble: ['전기세는 다음달의', '내가 내겠지.'],
      slide2SideNoteBottom: '뭔 소리여..',
      slide3TopBubble1: ['그렇게 껐다 켰다 해서', '한 달 88,420원 나온다고?'],
      slide3TopBubble2: ['그냥 켜두면 31,200원인데??'],
      slide3BottomUrchinBubble: ['아낀다고 끈 건데', '57,220원 더 냈다고요????'],
      slide4TopNarration: ['나는 내 감을 믿지 않는다.', '그래서 3초 계산기로 통제한다.'],
      slide4YellowBoxLines: ['우리집 평수·시간만 넣으면', '누진세 폭탄 구간이랑', '절전템까지 바로 계산해 둠'],
      slide4HandwrittenNote: '계산기 돌려봐야지..'
    };
  }

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
    coverTitleLines: ['감으로 결제하다', '호구 되는 이유'],
    coverRole: 'maknae_bunny', coverFacing: 'left', coverProp: 'phone',
    colleagueRole: 'fox_director', colleagueName: '여우 실장님',
    thirdRole: 'bee_manager', deskRole: 'fox_director'
  };

  const p1Lines = (sc.p1 || ['모르고 그냥 쓰면', '생돈 날려요!']).map(stripMdBold);
  const p2Lines = (sc.p2 || ['내 조건 넣으면', '정답이 나와요!']).map(stripMdBold);
  const p3Lines = (sc.p3 || ['비교 안 하면 손해!', '절약액 확인!']).map(stripMdBold);
  const p4Lines = (sc.p4 || ['3초 만에 계산 끝!', '바로 아꼈다!']).map(stripMdBold);

  return {
    slug,
    coverTitleLines: meta.coverTitleLines,
    coverRole: meta.coverRole,
    coverFacing: meta.coverFacing,
    coverProp: meta.coverProp,
    colleagueRole: meta.colleagueRole,
    thirdRole: meta.thirdRole,
    deskRole: meta.deskRole,
    coverBubbleLines: [
      `${meta.colleagueName || '실장님'} 혹시`,
      ...p1Lines.slice(0, 2)
    ],
    coverBottomNarration: (sc.narrations && sc.narrations[0]) || `${preset.title} 고민할 때 가장 많이 하는 착각이다.`,
    slide2TopBubble: [
      (sc.replies && sc.replies[0] ? sc.replies[0].replace(/[^\w\s가-힣,.?!~+%]/g, '').slice(0, 18) : '솔직히 귀찮아서'),
      ...p1Lines.slice(0, 2)
    ],
    slide2YellowBox: (resolved.panel1Sub || preset.title).slice(0, 22),
    slide2Vignette1Bubble: ['일단 그냥', '결제하자!'],
    slide2Vignette2Bubble: [
      ...p2Lines.slice(0, 2),
      `(${resolved.goodVal.slice(0, 12)})`
    ],
    slide2SideNoteRight: [`↗ ${meta.colleagueName || '여우 실장님'}.`, '영수증 팩트체크 중'],
    slide2Vignette3Bubble: ['호구 영수증은 다음달', '내가 감당하겠지.'],
    slide2SideNoteBottom: '뭔 소리여..',
    slide3TopBubble1: [
      `${resolved.badLabel.slice(0, 14)}하면`,
      `${resolved.badVal} 나간다고?`
    ],
    slide3TopBubble2: [
      `바꾸면 ${resolved.goodVal}인데??`
    ],
    slide3BottomUrchinBubble: [
      p3Lines[0] || '모르고 그냥 써서',
      `${String(resolved.diffVal || '').replace(/\s*(차이|절약|이득|손해).*$/, '').trim()} 차이난다고요????`
    ],
    slide4TopNarration: ['나는 내 감을 믿지 않는다.', '그래서 3초 계산기로 통제한다.'],
    slide4YellowBoxLines: [
      p4Lines[0] || '내 조건 숫자만 넣으면',
      p4Lines[1] || '1원 단위 비교 영수증이랑',
      '최저가 특가템까지 계산해 둠'
    ],
    slide4HandwrittenNote: '계산기 돌려봐야지..'
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
    background: #FFFFFF;
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

const INK = '#1C1917';
const WHITE = '#FFFFFF';
const YELLOW_TITLE = '#FFD15C';
const YELLOW_BOX = '#FFF59D';
const MINT_BUBBLE = '#E2F3F1';
const PHONE_BLUE = '#5B9BD5';

function setInkPen(ctx, width = 3.5, color = INK) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function drawHandBubble(ctx, x, y, w, h, options = {}) {
  const {
    fill = WHITE,
    stroke = INK,
    lineWidth = 3.3,
    radius = 42,
    tailDir = 'bottom-right',
    tailTargetX = null,
    tailTargetY = null
  } = options;

  ctx.save();
  setInkPen(ctx, lineWidth, stroke);
  ctx.fillStyle = fill;

  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.bezierCurveTo(x + w * 0.35, y - 2, x + w * 0.65, y + 1, x + w - r, y);
  ctx.quadraticCurveTo(x + w + 1, y, x + w, y + r);
  ctx.bezierCurveTo(x + w + 2, y + h * 0.35, x + w - 1, y + h * 0.65, x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h + 1, x + w - r, y + h);
  ctx.bezierCurveTo(x + w * 0.65, y + h + 2, x + w * 0.35, y + h - 1, x + r, y + h);
  ctx.quadraticCurveTo(x - 1, y + h, x, y + h - r);
  ctx.bezierCurveTo(x - 2, y + h * 0.65, x + 1, y + h * 0.35, x, y + r);
  ctx.quadraticCurveTo(x, y - 1, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (tailDir !== 'none' && tailTargetX !== null && tailTargetY !== null) {
    let bx1, by1, bx2, by2;
    if (tailDir === 'bottom-right') {
      bx1 = x + w * 0.70; by1 = y + h - 4;
      bx2 = x + w * 0.84; by2 = y + h - 10;
    } else if (tailDir === 'bottom-left') {
      bx1 = x + w * 0.18; by1 = y + h - 10;
      bx2 = x + w * 0.32; by2 = y + h - 4;
    } else if (tailDir === 'left') {
      bx1 = x + 5; by1 = y + h * 0.60;
      bx2 = x + 6; by2 = y + h * 0.78;
    } else if (tailDir === 'right') {
      bx1 = x + w - 5; by1 = y + h * 0.58;
      bx2 = x + w - 6; by2 = y + h * 0.76;
    }

    if (bx1 !== undefined) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(bx1, by1);
      ctx.lineTo(tailTargetX, tailTargetY);
      ctx.lineTo(bx2, by2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(bx1, by1);
      ctx.lineTo(tailTargetX, tailTargetY);
      ctx.lineTo(bx2, by2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function fillTextAutoFit(ctx, text, x, y, maxW, baseSize, fontFamily = '"GaeguBold", sans-serif', minSize = 24) {
  let sz = baseSize;
  ctx.font = sz + 'px ' + fontFamily;
  while (sz > minSize && ctx.measureText(text).width > maxW) {
    sz -= 1;
    ctx.font = sz + 'px ' + fontFamily;
  }
  ctx.fillText(text, x, y);
}

function drawBlackSpikyBubble(ctx, cx, cy, rx, ry, lines, fontSize = 42) {
  ctx.save();
  const spikes = 28;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes;
    const isOuter = i % 2 === 0;
    const jitter = ((i * 7) % 5) - 2;
    const radX = isOuter ? rx + 30 + jitter * 2 : rx - 6;
    const radY = isOuter ? ry + 24 + jitter * 2 : ry - 5;
    const px = cx + Math.cos(angle) * radX;
    const py = cy + Math.sin(angle) * radY;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#141413';
  ctx.fill();

  ctx.fillStyle = WHITE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineHeight = fontSize * 1.18;
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, idx) => {
    fillTextAutoFit(ctx, line, cx, startY + idx * lineHeight, rx * 1.72, fontSize);
  });
  ctx.restore();
}

function drawUrchinFocusBubble(ctx, cx, cy, rx, ry, lines, fontSize = 44) {
  ctx.save();
  const numSpikes = 148;
  for (let i = 0; i < numSpikes; i++) {
    const angle = (i * Math.PI * 2) / numSpikes;
    const innerR = 0.88 + ((i * 13) % 7) * 0.01;
    const outerR = 1.15 + ((i * 17) % 9) * 0.014;
    const x1 = cx + Math.cos(angle) * rx * innerR;
    const y1 = cy + Math.sin(angle) * ry * innerR;
    const x2 = cx + Math.cos(angle) * rx * outerR;
    const y2 = cy + Math.sin(angle) * ry * outerR;
    ctx.strokeStyle = INK;
    ctx.lineWidth = i % 2 === 0 ? 2.8 : 1.8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.91, ry * 0.89, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineHeight = fontSize * 1.22;
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, idx) => {
    fillTextAutoFit(ctx, line, cx, startY + idx * lineHeight, rx * 1.62, fontSize);
  });
  ctx.restore();
}

/**
 * Draw Minimalist @to_to_studio_ Style Marshmallow Staff Character with Open-Bottom Strokes
 */
function drawTotoStaffCharacter(ctx, cx, cy, scale = 1.0, options = {}) {
  const {
    role = 'maknae_bunny',
    mood = 'normal',
    facing = 'left',
    prop = 'none',
    bodyHeight = 195
  } = options;

  ctx.save();
  ctx.translate(cx, cy);
  if (facing === 'right') {
    ctx.scale(-scale, scale);
  } else {
    ctx.scale(scale, scale);
  }

  setInkPen(ctx, 3.6, INK);
  ctx.fillStyle = WHITE;

  if (role === 'tiger_exec' && mood === 'angry') {
    ctx.fillStyle = '#8FA8BE';
    ctx.beginPath();
    ctx.moveTo(-115, 210);
    ctx.bezierCurveTo(-125, 110, -95, 55, -55, 48);
    ctx.lineTo(55, 48);
    ctx.bezierCurveTo(95, 55, 125, 110, 125, 210);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(0, 48, 34, 0, Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FDE68A';
    ctx.beginPath(); ctx.arc(-68, -74, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(68, -74, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.arc(0, -20, 82, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    setInkPen(ctx, 3.8, INK);
    ctx.beginPath();
    ctx.moveTo(-18, -82); ctx.lineTo(18, -82);
    ctx.moveTo(-24, -70); ctx.lineTo(24, -70);
    ctx.moveTo(0, -90); ctx.lineTo(0, -62);
    ctx.moveTo(-76, -24); ctx.lineTo(-56, -20);
    ctx.moveTo(-74, -10); ctx.lineTo(-54, -8);
    ctx.moveTo(76, -24); ctx.lineTo(56, -20);
    ctx.moveTo(74, -10); ctx.lineTo(54, -8);
    ctx.stroke();

    setInkPen(ctx, 3.4, INK);
    ctx.beginPath();
    ctx.moveTo(-36, -42); ctx.quadraticCurveTo(-20, -34, -10, -40);
    ctx.moveTo(10, -40); ctx.quadraticCurveTo(20, -34, 36, -42);
    ctx.moveTo(-42, -24); ctx.quadraticCurveTo(-26, -32, -12, -24);
    ctx.moveTo(12, -24); ctx.quadraticCurveTo(26, -32, 42, -24);
    ctx.stroke();

    ctx.fillStyle = '#D97777';
    ctx.beginPath();
    ctx.roundRect(-30, -4, 60, 38, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.rect(-26, -3, 52, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8FA8BE';
    ctx.beginPath();
    ctx.moveTo(-20, 185);
    ctx.quadraticCurveTo(-65, 155, -80, 95);
    ctx.lineTo(-42, 85);
    ctx.quadraticCurveTo(-25, 130, 15, 150);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.moveTo(-74, 88);
    ctx.lineTo(-74, 24);
    ctx.arc(-64, 24, 10, Math.PI, 0);
    ctx.lineTo(-54, 62);
    ctx.arc(-42, 72, 18, -Math.PI * 0.5, Math.PI * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
    return;
  }

  if (role === 'maknae_bunny') {
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(-76, bodyHeight);
    ctx.bezierCurveTo(-80, bodyHeight * 0.65, -74, 105, -58, 68);
    ctx.bezierCurveTo(-92, 45, -96, -35, -48, -68);
    ctx.bezierCurveTo(-62, -165, -45, -205, -26, -202);
    ctx.bezierCurveTo(-8, -198, -10, -145, -14, -74);
    ctx.quadraticCurveTo(0, -78, 14, -74);
    ctx.bezierCurveTo(16, -145, 18, -198, 36, -200);
    ctx.bezierCurveTo(55, -202, 66, -160, 48, -66);
    ctx.bezierCurveTo(96, -35, 92, 45, 62, 68);
    ctx.bezierCurveTo(80, 105, 86, bodyHeight * 0.65, 84, bodyHeight);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-76, bodyHeight);
    ctx.bezierCurveTo(-80, bodyHeight * 0.65, -74, 105, -58, 68);
    ctx.bezierCurveTo(-92, 45, -96, -35, -48, -68);
    ctx.bezierCurveTo(-62, -165, -45, -205, -26, -202);
    ctx.bezierCurveTo(-8, -198, -10, -145, -14, -74);
    ctx.quadraticCurveTo(0, -78, 14, -74);
    ctx.bezierCurveTo(16, -145, 18, -198, 36, -200);
    ctx.bezierCurveTo(55, -202, 66, -160, 48, -66);
    ctx.bezierCurveTo(96, -35, 92, 45, 62, 68);
    ctx.bezierCurveTo(80, 105, 86, bodyHeight * 0.65, 84, bodyHeight);
    ctx.stroke();
  } else if (role === 'fox_director') {
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(-76, bodyHeight);
    ctx.bezierCurveTo(-80, bodyHeight * 0.65, -74, 105, -58, 68);
    ctx.lineTo(-92, 42);
    ctx.lineTo(-78, 25);
    ctx.quadraticCurveTo(-90, -15, -62, -55);
    ctx.lineTo(-96, -152);
    ctx.lineTo(-22, -76);
    ctx.quadraticCurveTo(0, -82, 22, -76);
    ctx.lineTo(96, -152);
    ctx.lineTo(62, -55);
    ctx.quadraticCurveTo(90, -15, 78, 25);
    ctx.lineTo(92, 42);
    ctx.lineTo(62, 68);
    ctx.bezierCurveTo(80, 105, 86, bodyHeight * 0.65, 84, bodyHeight);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-76, bodyHeight);
    ctx.bezierCurveTo(-80, bodyHeight * 0.65, -74, 105, -58, 68);
    ctx.lineTo(-92, 42);
    ctx.lineTo(-78, 25);
    ctx.quadraticCurveTo(-90, -15, -62, -55);
    ctx.lineTo(-96, -152);
    ctx.lineTo(-22, -76);
    ctx.quadraticCurveTo(0, -82, 22, -76);
    ctx.lineTo(96, -152);
    ctx.lineTo(62, -55);
    ctx.quadraticCurveTo(90, -15, 78, 25);
    ctx.lineTo(92, 42);
    ctx.lineTo(62, 68);
    ctx.bezierCurveTo(80, 105, 86, bodyHeight * 0.65, 84, bodyHeight);
    ctx.stroke();

    setInkPen(ctx, 2.4, INK);
    ctx.beginPath();
    ctx.moveTo(-78, -125); ctx.lineTo(-42, -72);
    ctx.moveTo(78, -125); ctx.lineTo(42, -72);
    ctx.stroke();
    setInkPen(ctx, 3.6, INK);
  } else if (role === 'panda_lead') {
    // 📱 팬더 팀장: Round dark panda ears on marshmallow head
    ctx.fillStyle = '#3F3F46';
    ctx.beginPath(); ctx.arc(-62, -74, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(62, -74, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(-76, bodyHeight);
    ctx.bezierCurveTo(-80, bodyHeight * 0.65, -74, 105, -58, 68);
    ctx.bezierCurveTo(-92, 45, -96, -35, -48, -68);
    ctx.bezierCurveTo(-20, -86, 20, -86, 48, -68);
    ctx.bezierCurveTo(96, -35, 92, 45, 62, 68);
    ctx.bezierCurveTo(80, 105, 86, bodyHeight * 0.65, 84, bodyHeight);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-76, bodyHeight);
    ctx.bezierCurveTo(-80, bodyHeight * 0.65, -74, 105, -58, 68);
    ctx.bezierCurveTo(-92, 45, -96, -35, -48, -68);
    ctx.bezierCurveTo(-20, -86, 20, -86, 48, -68);
    ctx.bezierCurveTo(96, -35, 92, 45, 62, 68);
    ctx.bezierCurveTo(80, 105, 86, bodyHeight * 0.65, 84, bodyHeight);
    ctx.stroke();
  } else if (role === 'cheetah_lead') {
    // 🐆 치타 팀장: Rounded ears + cute cheek whisker marks
    ctx.fillStyle = WHITE;
    ctx.beginPath(); ctx.arc(-58, -72, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(58, -72, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(-76, bodyHeight);
    ctx.bezierCurveTo(-80, bodyHeight * 0.65, -74, 105, -58, 68);
    ctx.bezierCurveTo(-92, 45, -96, -35, -48, -68);
    ctx.bezierCurveTo(-20, -86, 20, -86, 48, -68);
    ctx.bezierCurveTo(96, -35, 92, 45, 62, 68);
    ctx.bezierCurveTo(80, 105, 86, bodyHeight * 0.65, 84, bodyHeight);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-76, bodyHeight);
    ctx.bezierCurveTo(-80, bodyHeight * 0.65, -74, 105, -58, 68);
    ctx.bezierCurveTo(-92, 45, -96, -35, -48, -68);
    ctx.bezierCurveTo(-20, -86, 20, -86, 48, -68);
    ctx.bezierCurveTo(96, -35, 92, 45, 62, 68);
    ctx.bezierCurveTo(80, 105, 86, bodyHeight * 0.65, 84, bodyHeight);
    ctx.stroke();

    ctx.fillStyle = INK;
    [[-46, 2], [-54, 10], [46, 2], [54, 10]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.arc(dx, dy, 2.2, 0, Math.PI * 2); ctx.fill();
    });
  } else {
    // 🐝 꿀벌 과장 (bee_manager)
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(-76, bodyHeight);
    ctx.bezierCurveTo(-80, bodyHeight * 0.65, -74, 105, -58, 68);
    ctx.bezierCurveTo(-92, 45, -96, -35, -48, -68);
    ctx.bezierCurveTo(-20, -86, 20, -86, 48, -68);
    ctx.bezierCurveTo(96, -35, 92, 45, 62, 68);
    ctx.bezierCurveTo(80, 105, 86, bodyHeight * 0.65, 84, bodyHeight);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-76, bodyHeight);
    ctx.bezierCurveTo(-80, bodyHeight * 0.65, -74, 105, -58, 68);
    ctx.bezierCurveTo(-92, 45, -96, -35, -48, -68);
    ctx.bezierCurveTo(-20, -86, 20, -86, 48, -68);
    ctx.bezierCurveTo(96, -35, 92, 45, 62, 68);
    ctx.bezierCurveTo(80, 105, 86, bodyHeight * 0.65, 84, bodyHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-18, -78); ctx.quadraticCurveTo(-28, -118, -36, -124);
    ctx.moveTo(18, -78); ctx.quadraticCurveTo(28, -118, 36, -124);
    ctx.stroke();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath(); ctx.arc(-38, -128, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(38, -128, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // Facial Expression
  if (mood === 'shock') {
    ctx.fillStyle = WHITE;
    ctx.beginPath(); ctx.ellipse(-18, -8, 7, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(18, -8, 7, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 12, 8, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(-52, 8);
    ctx.quadraticCurveTo(-58, 24, -52, 28);
    ctx.quadraticCurveTo(-46, 24, -52, 8);
    ctx.fill();
    ctx.stroke();

    setInkPen(ctx, 2.4, INK);
    const drawSpark = (sx, sy) => {
      ctx.beginPath();
      ctx.moveTo(sx - 8, sy - 8); ctx.lineTo(sx - 3, sy - 3);
      ctx.moveTo(sx + 8, sy - 8); ctx.lineTo(sx + 3, sy - 3);
      ctx.moveTo(sx - 8, sy + 8); ctx.lineTo(sx - 3, sy + 3);
      ctx.moveTo(sx + 8, sy + 8); ctx.lineTo(sx + 3, sy + 3);
      ctx.stroke();
    };
    drawSpark(-98, -75);
    drawSpark(88, -135);
    drawSpark(95, 25);
    setInkPen(ctx, 3.6, INK);
  } else {
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(-16, -8, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(16, -8, 4.2, 0, Math.PI * 2); ctx.fill();

    ctx.beginPath();
    if (mood === 'sweat') {
      ctx.moveTo(-8, 10);
      ctx.quadraticCurveTo(0, 5, 8, 10);
    } else {
      ctx.moveTo(-6, 11);
      ctx.lineTo(0, 5);
      ctx.lineTo(6, 11);
    }
    ctx.stroke();

    if (mood === 'sweat') {
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.moveTo(-58, -15);
      ctx.quadraticCurveTo(-65, 2, -58, 6);
      ctx.quadraticCurveTo(-51, 2, -58, -15);
      ctx.fill();
      ctx.stroke();
    }
  }

  if (role === 'fox_director') {
    setInkPen(ctx, 2.5, INK);
    ctx.beginPath();
    ctx.arc(-18, -8, 13, 0, Math.PI * 2);
    ctx.moveTo(-5, -8); ctx.lineTo(5, -8);
    ctx.arc(18, -8, 13, 0, Math.PI * 2);
    ctx.stroke();
    setInkPen(ctx, 3.6, INK);
  }

  if (prop === 'phone') {
    ctx.save();
    ctx.translate(-75, 92);
    ctx.rotate(-0.22);
    ctx.fillStyle = PHONE_BLUE;
    ctx.beginPath();
    ctx.roundRect(-36, -58, 72, 118, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(10, -36, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(-52, 82);
    ctx.quadraticCurveTo(-92, 78, -94, 96);
    ctx.quadraticCurveTo(-92, 114, -48, 110);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(22, 95);
    ctx.bezierCurveTo(-18, 92, -62, 102, -64, 122);
    ctx.bezierCurveTo(-62, 140, -10, 138, 32, 130);
    ctx.fill();
    ctx.stroke();
  } else if (prop === 'tablet') {
    ctx.save();
    ctx.translate(-82, 85);
    ctx.rotate(-0.08);
    ctx.fillStyle = '#4B5563';
    ctx.beginPath();
    ctx.roundRect(-38, -68, 78, 132, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(15, 78);
    ctx.bezierCurveTo(-25, 76, -68, 78, -70, 96);
    ctx.bezierCurveTo(-68, 114, -20, 112, 24, 108);
    ctx.fill();
    ctx.stroke();
  } else if (prop === 'pointer') {
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(-25, 95);
    ctx.quadraticCurveTo(-32, 42, -16, 26);
    ctx.quadraticCurveTo(-4, 24, -4, 48);
    ctx.quadraticCurveTo(10, 48, 10, 88);
    ctx.fill();
    ctx.stroke();
  } else if (prop === 'bag') {
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(-45, 75);
    ctx.quadraticCurveTo(-95, 95, -88, 120);
    ctx.quadraticCurveTo(-75, 132, -35, 105);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(25, 82);
    ctx.quadraticCurveTo(-28, 98, -38, 118);
    ctx.quadraticCurveTo(-28, 135, 32, 112);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawTotoCoverTitle(ctx, lines, startY = 185) {
  ctx.save();
  ctx.font = '115px "Jua", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineHeight = 138;

  lines.forEach((line, idx) => {
    const y = startY + idx * lineHeight;
    ctx.lineWidth = 13;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(line, 540, y);

    ctx.fillStyle = YELLOW_TITLE;
    ctx.fillText(line, 540, y);
  });
  ctx.restore();
}

function drawHandwrittenNoteWithArrow(ctx, textLines, textX, textY, arrowFromX, arrowFromY, arrowToX, arrowToY) {
  ctx.save();
  ctx.font = '40px "NanumPen", sans-serif';
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  textLines.forEach((l, i) => {
    ctx.fillText(l, textX, textY + i * 38);
  });

  if (arrowFromX !== null && arrowToX !== null) {
    setInkPen(ctx, 2.5, INK);
    ctx.beginPath();
    const midX = (arrowFromX + arrowToX) / 2;
    const midY = Math.min(arrowFromY, arrowToY) - 18;
    ctx.moveTo(arrowFromX, arrowFromY);
    ctx.quadraticCurveTo(midX, midY, arrowToX, arrowToY);
    ctx.stroke();

    const angle = Math.atan2(arrowToY - midY, arrowToX - midX);
    ctx.beginPath();
    ctx.moveTo(arrowToX - 12 * Math.cos(angle - 0.5), arrowToY - 12 * Math.sin(angle - 0.5));
    ctx.lineTo(arrowToX, arrowToY);
    ctx.lineTo(arrowToX - 12 * Math.cos(angle + 0.5), arrowToY - 12 * Math.sin(angle + 0.5));
    ctx.stroke();
  }
  ctx.restore();
}

function drawSlide1(ctx) {
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, 1080, 1080);

  drawTotoCoverTitle(ctx, sample.coverTitleLines, 180);

  const isRightFacing = sample.coverFacing === 'right';
  if (isRightFacing) {
    drawTotoStaffCharacter(ctx, 375, 665, 1.08, {
      role: sample.coverRole || 'maknae_bunny',
      mood: 'normal',
      facing: 'right',
      prop: sample.coverProp || 'phone',
      bodyHeight: 175
    });
    drawHandBubble(ctx, 540, 510, 440, 240, {
      fill: MINT_BUBBLE,
      radius: 42,
      tailDir: 'bottom-left',
      tailTargetX: 535,
      tailTargetY: 770
    });
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    sample.coverBubbleLines.forEach((l, i) => {
      fillTextAutoFit(ctx, l, 540 + 440 / 2, 572 + i * 56, 396, 44);
    });
  } else {
    drawHandBubble(ctx, 95, 510, 440, 240, {
      fill: MINT_BUBBLE,
      radius: 42,
      tailDir: 'bottom-right',
      tailTargetX: 505,
      tailTargetY: 770
    });
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    sample.coverBubbleLines.forEach((l, i) => {
      fillTextAutoFit(ctx, l, 95 + 440 / 2, 572 + i * 56, 396, 44);
    });

    drawTotoStaffCharacter(ctx, 695, 665, 1.08, {
      role: sample.coverRole || 'maknae_bunny',
      mood: 'normal',
      facing: 'left',
      prop: sample.coverProp || 'phone',
      bodyHeight: 175
    });
  }

  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  fillTextAutoFit(ctx, sample.coverBottomNarration, 540, 965, 980, 48);
}

function drawSlide2(ctx) {
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, 1080, 1080);

  const splitY = 365;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1080, splitY);
  ctx.clip();

  for (let x = 12; x < 1080; x += 22) {
    const alpha = 0.25 + ((x * 7) % 10) * 0.025;
    ctx.strokeStyle = 'rgba(135, 178, 218, ' + alpha + ')';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 125 + ((x * 13) % 45));
    ctx.moveTo(x, splitY);
    ctx.lineTo(x, splitY - 95 - ((x * 11) % 35));
    ctx.stroke();
  }

  drawTotoStaffCharacter(ctx, 275, 255, 0.92, {
    role: sample.coverRole || 'maknae_bunny',
    mood: 'sweat',
    facing: 'right',
    prop: 'pointer',
    bodyHeight: 150
  });

  drawHandBubble(ctx, 435, 52, 585, 230, {
    fill: WHITE,
    radius: 95,
    tailDir: 'left',
    tailTargetX: 375,
    tailTargetY: 225
  });
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  sample.slide2TopBubble.forEach((l, i) => {
    fillTextAutoFit(ctx, l, 435 + 585 / 2, 112 + i * 54, 520, 42);
  });
  ctx.restore();

  setInkPen(ctx, 3.8, INK);
  ctx.beginPath();
  ctx.moveTo(0, splitY);
  ctx.lineTo(1080, splitY);
  ctx.stroke();

  ctx.fillStyle = YELLOW_BOX;
  ctx.fillRect(0, splitY, 640, 82);
  ctx.strokeRect(0, splitY, 640, 82);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fillTextAutoFit(ctx, sample.slide2YellowBox, 320, splitY + 42, 600, 42);

  drawHandBubble(ctx, 42, 515, 240, 150, {
    fill: WHITE,
    radius: 55,
    tailDir: 'bottom-right',
    tailTargetX: 285,
    tailTargetY: 675
  });
  sample.slide2Vignette1Bubble.forEach((l, i) => {
    fillTextAutoFit(ctx, l, 42 + 120, 565 + i * 44, 210, 38);
  });
  drawTotoStaffCharacter(ctx, 355, 650, 0.72, {
    role: sample.coverRole || 'maknae_bunny',
    mood: 'normal',
    facing: 'left',
    prop: 'bag',
    bodyHeight: 145
  });

  drawHandBubble(ctx, 705, 420, 345, 195, {
    fill: WHITE,
    radius: 75,
    tailDir: 'bottom-left',
    tailTargetX: 720,
    tailTargetY: 655
  });
  sample.slide2Vignette2Bubble.forEach((l, i) => {
    fillTextAutoFit(ctx, l, 705 + 172, 470 + i * 44, 310, 36);
  });
  drawTotoStaffCharacter(ctx, 645, 695, 0.74, {
    role: sample.colleagueRole || 'fox_director',
    mood: 'sweat',
    facing: 'right',
    prop: 'none',
    bodyHeight: 145
  });
  drawHandwrittenNoteWithArrow(
    ctx,
    sample.slide2SideNoteRight,
    835,
    735,
    760,
    755,
    825,
    720
  );

  drawHandBubble(ctx, 48, 825, 340, 155, {
    fill: WHITE,
    radius: 65,
    tailDir: 'right',
    tailTargetX: 395,
    tailTargetY: 945
  });
  sample.slide2Vignette3Bubble.forEach((l, i) => {
    fillTextAutoFit(ctx, l, 48 + 170, 878 + i * 46, 305, 38);
  });

  ctx.save();
  ctx.translate(485, 955);
  ctx.rotate(-0.35);
  drawTotoStaffCharacter(ctx, 0, 0, 0.72, {
    role: sample.thirdRole || 'bee_manager',
    mood: 'normal',
    facing: 'left',
    prop: 'phone',
    bodyHeight: 165
  });
  ctx.restore();

  ctx.font = '44px "NanumPen", sans-serif';
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.fillText(sample.slide2SideNoteBottom, 735, 920);

  ctx.fillStyle = '#D4D4D8';
  setInkPen(ctx, 3.4, INK);
  ctx.beginPath();
  ctx.moveTo(860, 1080);
  ctx.bezierCurveTo(855, 980, 915, 945, 950, 945);
  ctx.bezierCurveTo(942, 875, 955, 845, 972, 845);
  ctx.bezierCurveTo(988, 845, 992, 895, 988, 935);
  ctx.bezierCurveTo(1005, 885, 1020, 850, 1036, 852);
  ctx.bezierCurveTo(1052, 855, 1048, 910, 1032, 955);
  ctx.bezierCurveTo(1065, 975, 1078, 1025, 1078, 1080);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = '40px "GaeguBold", sans-serif';
  ctx.fillText('다음달의 나', 975, 1030);
}

function drawSlide3(ctx) {
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, 1080, 1080);

  const splitY = 545;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1080, splitY);
  ctx.clip();

  ctx.fillStyle = '#52525B';
  ctx.fillRect(0, 0, 1080, splitY);

  const drawStormGlow = (gx, gy, r) => {
    const grad = ctx.createRadialGradient(gx, gy, 5, gx, gy, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.92)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  drawStormGlow(160, 90, 140);
  drawStormGlow(580, 120, 160);
  drawStormGlow(920, 80, 150);
  drawStormGlow(380, 460, 150);
  drawStormGlow(120, 440, 130);

  setInkPen(ctx, 5, 'rgba(255,255,255,0.85)');
  ctx.beginPath();
  ctx.moveTo(520, 10); ctx.lineTo(560, 95); ctx.lineTo(510, 145); ctx.lineTo(585, 250);
  ctx.moveTo(880, 20); ctx.lineTo(830, 110); ctx.lineTo(890, 175);
  ctx.moveTo(180, 320); ctx.lineTo(250, 410); ctx.lineTo(210, 495);
  ctx.stroke();

  drawTotoStaffCharacter(ctx, 745, 345, 1.05, {
    role: 'tiger_exec',
    mood: 'angry',
    facing: 'left'
  });

  ctx.font = '52px "NanumPen", sans-serif';
  ctx.lineWidth = 10;
  ctx.strokeStyle = WHITE;
  ctx.strokeText('극대노..', 935, 265);
  ctx.fillStyle = INK;
  ctx.fillText('극대노..', 935, 265);

  drawBlackSpikyBubble(ctx, 300, 195, 275, 115, sample.slide3TopBubble1, 40);
  drawBlackSpikyBubble(ctx, 300, 415, 275, 76, sample.slide3TopBubble2, 40);
  ctx.restore();

  setInkPen(ctx, 3.8, INK);
  ctx.beginPath();
  ctx.moveTo(0, splitY);
  ctx.lineTo(1080, splitY);
  ctx.stroke();

  drawTotoStaffCharacter(ctx, 255, 865, 1.08, {
    role: sample.coverRole || 'maknae_bunny',
    mood: 'shock',
    facing: 'left',
    prop: 'none',
    bodyHeight: 210
  });

  drawUrchinFocusBubble(ctx, 715, 815, 305, 145, sample.slide3BottomUrchinBubble, 42);
}

function drawSlide4(ctx) {
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  sample.slide4TopNarration.forEach((l, i) => {
    fillTextAutoFit(ctx, l, 540, 105 + i * 64, 980, 48);
  });

  ctx.fillStyle = YELLOW_BOX;
  setInkPen(ctx, 3.2, INK);
  ctx.fillRect(115, 265, 485, 235);
  ctx.strokeRect(115, 265, 485, 235);

  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  sample.slide4YellowBoxLines.forEach((l, i) => {
    fillTextAutoFit(ctx, l, 115 + 485 / 2, 325 + i * 58, 450, 42);
  });

  ctx.font = '52px "NanumPen", sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText(sample.slide4HandwrittenNote, 365, 595);

  setInkPen(ctx, 2.8, INK);
  ctx.beginPath();
  ctx.moveTo(195, 765);
  ctx.bezierCurveTo(265, 775, 325, 725, 315, 685);
  ctx.bezierCurveTo(308, 655, 272, 665, 280, 695);
  ctx.bezierCurveTo(286, 712, 305, 705, 300, 690);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(855, 625);
  ctx.bezierCurveTo(915, 645, 920, 720, 868, 725);
  ctx.bezierCurveTo(838, 728, 835, 692, 860, 690);
  ctx.stroke();

  drawTotoStaffCharacter(ctx, 645, 645, 1.08, {
    role: sample.deskRole || 'fox_director',
    mood: 'normal',
    facing: 'left',
    prop: 'tablet',
    bodyHeight: 200
  });

  ctx.fillStyle = WHITE;
  setInkPen(ctx, 3.6, INK);
  ctx.beginPath();
  ctx.moveTo(145, 855);
  ctx.lineTo(545, 785);
  ctx.lineTo(955, 815);
  ctx.lineTo(955, 865);
  ctx.lineTo(145, 905);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(165, 904);
  ctx.lineTo(165, 1080);
  ctx.lineTo(935, 1080);
  ctx.lineTo(935, 864);
  ctx.fill();
  ctx.stroke();
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

    ctx.fillStyle = '#F5F5F4';
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
      ctx.strokeStyle = INK;
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
    `mf-toto-${Date.now()}-${Math.random().toString(36).slice(2)}.html`
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
      `mf-toto-${Date.now()}-${Math.random().toString(36).slice(2)}.html`
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

  // Render all 5 images for this episode in parallel
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
      console.log(`Rendering all ${PRESETS.length} episodes in @to_to_studio_ style...`);
      for (let i = 0; i < PRESETS.length; i += 2) {
        const batch = PRESETS.slice(i, i + 2);
        const resList = await Promise.all(batch.map(p => renderTotoEpisodeForSlug(p.id)));
        resList.forEach(r => console.log(`  ✓ [${r.slug}] 4 slides + grid rendered`));
      }
      console.log('🎉 All 36 @to_to_studio_ style episodes rendered!');
    } else if (slug) {
      const res = await renderTotoEpisodeForSlug(slug);
      console.log('Generated @to_to_studio_ style webtoon:', res);
    } else {
      const res = renderTotoSample1();
      console.log('Generated @to_to_studio_ style sample webtoon:', res);
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
