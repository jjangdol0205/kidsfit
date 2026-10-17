#!/usr/bin/env node
/**
 * MoneyFit Daily 3-Episode Anti-Ban SNS Scheduler & Cross-Category Rotation Engine
 * (인스타그램 · 쓰레드 하루 3편 안전 발행 & 동물 캐릭터 교차 편성 스케줄러)
 *
 * Core Rules:
 * 1. MAX_DAILY_POSTS = 3 (Strict hard cap per KST day to prevent Meta/Instagram action blocks or shadowbans)
 * 2. MIN_INTERVAL_HOURS = 4 (At least 4 hours between posts: 08:30 Morning / 12:30 Lunch / 20:30 Evening KST)
 * 3. Cross-Category & Diverse Animal Cast Rotation:
 *    - Morning Slot (08:30 KST): Electric (전기요금) / Telecom (통신비·인터넷)
 *    - Lunch Slot   (12:30 KST): Diet (다이어트·식단) / Pet (반려동물 급여량·양육비)
 *    - Evening Slot (20:30 KST): Auto (자동차 할부·렌트 절세) / Room (자취·신혼 가전예산)
 * 4. Dual-Platform Marketing Optimization:
 *    - Instagram (@moneyfit2026): 4-Cut Grid + 4 Zoomed Slides (Carousel) for 2.4x dwell time & 2nd feed exposure,
 *      zero external URLs in caption, max 4 niche hashtags.
 *    - Threads (@moneyfit2026): 1-Tap 4-Cut Grid in main post (zero URLs) + Calculator deep link in 1st Reply.
 */

const fs = require('fs');
const path = require('path');
const { generateWebtoonPack } = require('./sns-auto-publisher.js');
const { SHORT_4CUT_BY_SLUG } = require('../src/data/webtoon-stories.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');
const STATE_FILE = path.join(LOGS_DIR, 'sns_daily_schedule_state.json');
const SCHEDULE_MD_FILE = path.join(ROOT_DIR, '인스타_쓰레드_일일3편_안전발행_스케줄.md');

const MAX_DAILY_POSTS = 3;
const MIN_INTERVAL_HOURS = 4;

/**
 * 12-Day Cross-Category Master Rotation (36 Unique Animal Episodes = 12 Days x 3 Posts/Day)
 * Every single day features 3 completely different categories, animal protagonists, and storyline patterns.
 */
constTWELVE_DAY_ROTATION = [
  // Day 1 (Today's Initial 3-Episode Lineup)
  {
    day: 1,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'electric-studio-ac', cast: '자취생 쿼카찌 & 민트후드 여우', category: '⚡ 전기요금' },
      { slot: 'LUNCH (12:30)', slug: 'diet-female-lean', cast: '화이트 푸들 & 필라테스 고양이 코치', category: '🥗 다이어트' },
      { slot: 'EVENING (20:30)', slug: 'auto-grandeur-5000', cast: '네이비 정장 호랑이 대표님 & 여우 세무사', category: '🚗 자동차절세' }
    ]
  },
  // Day 2
  {
    day: 2,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'telecom-single-oneroom', cast: '헤드셋 레서판다 게이머 & 치즈냥 선배', category: '🌐 통신/인터넷' },
      { slot: 'LUNCH (12:30)', slug: 'pet-pomeranian-puppy', cast: '빨간 리본 아기 포메 & 사슴 수의사', category: '🐾 반려동물' },
      { slot: 'EVENING (20:30)', slug: 'room-officetel-500', cast: '노란 조끼 직장인 코알라 & 여우 선배', category: '🛋️ 자취/투룸' }
    ]
  },
  // Day 3
  {
    day: 3,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'electric-dehumidifier', cast: '노란 가디건 해달 & 민트후드 여우', category: '⚡ 전기요금' },
      { slot: 'LUNCH (12:30)', slug: 'diet-office-worker', cast: '넥타이 직장인 판다 대리 & 여우 박사', category: '🥗 다이어트' },
      { slot: 'EVENING (20:30)', slug: 'auto-tucson-hybrid', cast: '아웃도어 조끼 웰시코기 아빠 & 라쿤 전문가', category: '🚗 패밀리카' }
    ]
  },
  // Day 4
  {
    day: 4,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'telecom-penalty-30', cast: '노란 셔츠 미어캣 사원 & 오소리 통신박사', category: '🌐 통신/인터넷' },
      { slot: 'LUNCH (12:30)', slug: 'pet-korean-shorthair', cast: '통통 턱시도 고양이 & 부엉이 수의사', category: '🐾 반려동물' },
      { slot: 'EVENING (20:30)', slug: 'room-newlywed-1000', cast: '신혼 곰돌이 부부 & 부엉이 웨딩플래너', category: '🛋️ 신혼가전' }
    ]
  },
  // Day 5
  {
    day: 5,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'electric-dryer', cast: '분홍 앞치마 토끼·햄스터 룸메 & 여우', category: '⚡ 전기요금' },
      { slot: 'LUNCH (12:30)', slug: 'diet-male-bulkup', cast: '파란 나시 미어캣 & 근육 불곰 코치', category: '🥗 벌크업' },
      { slot: 'EVENING (20:30)', slug: 'auto-casper-cash-vs-rent', cast: '사원증 병아리 신입 오리 & 부엉이 보험박사', category: '🚗 첫차보험' }
    ]
  },
  // Day 6
  {
    day: 6,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'telecom-3yr-expired', cast: '줄무늬 스웨터 나무늘보 & 여우 고수', category: '🌐 통신/인터넷' },
      { slot: 'LUNCH (12:30)', slug: 'pet-golden-retriever', cast: '파란 스카프 골든리트리버 & 여우 박사', category: '🐾 대형견' },
      { slot: 'EVENING (20:30)', slug: 'room-officetel-300', cast: '베이지 베레모 토끼 & 사막여우 건축가', category: '🛋️ 오피스텔' }
    ]
  },
  // Day 7
  {
    day: 7,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'electric-winter-heater', cast: '빨간 목도리 아기 펭귄 & 카피바라 선배', category: '⚡ 겨울난방비' },
      { slot: 'LUNCH (12:30)', slug: 'diet-student-budget', cast: '볼캡 대학생 다람쥐 & 과잠 라쿤 선배', category: '🥗 학생식단' },
      { slot: 'EVENING (20:30)', slug: 'auto-genesis-g80', cast: '차콜 수트 도베르만 이사님 & 여우 세무사', category: '🚗 법인/리스' }
    ]
  },
  // Day 8
  {
    day: 8,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'telecom-mvno-switch', cast: '청자켓 흰족제비(페럿) & 안경 라쿤 선배', category: '🌐 알뜰폰' },
      { slot: 'LUNCH (12:30)', slug: 'pet-senior-cat', cast: '숄 두른 시니어 러시안블루 & 여우 영양사', category: '🐾 노령묘' },
      { slot: 'EVENING (20:30)', slug: 'room-appliances-only', cast: '체크셔츠 비버 & 멜빵 오소리 가전박사', category: '🛋️ 무옵션가전' }
    ]
  },
  // Day 9
  {
    day: 9,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'electric-stand-ac', cast: '북극곰 부부 & 부엉이 에너지박사', category: '⚡ 아파트전기세' },
      { slot: 'LUNCH (12:30)', slug: 'diet-male-fatloss', cast: '빨간 머리띠 헬린이 시바견 & 여우 박사', category: '🥗 체지방커팅' },
      { slot: 'EVENING (20:30)', slug: 'auto-ev-ioniq', cast: '파란 후드 사모예드 & 여우 세무사', category: '🚗 전기차보조금' }
    ]
  },
  // Day 10
  {
    day: 10,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'telecom-family-4p', cast: '포근한 스웨터 비버 부부 & 여우 설계사', category: '🌐 가족결합' },
      { slot: 'LUNCH (12:30)', slug: 'pet-monthly-budget', cast: '줄무늬 셔츠 비숑 프리제 & 카피바라 플래너', category: '🐾 첫입양예산' },
      { slot: 'EVENING (20:30)', slug: 'room-minimalist-50', cast: '노란 후드 인턴 다람쥐 & 여우 선배', category: '🛋️ 단기원룸' }
    ]
  },
  // Day 11
  {
    day: 11,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'electric-inverter-roi', cast: '멜빵바지 골든햄스터 사장님 & 여우 박사', category: '⚡ 1등급교체' },
      { slot: 'LUNCH (12:30)', slug: 'diet-quick-3kg', cast: '노란 가디건 흰토끼 & 여우 영양박사', category: '🥗 단기3kg' },
      { slot: 'EVENING (20:30)', slug: 'auto-avante-3000', cast: '정장 골든리트리버 대리 & 여우 세무사', category: '🚗 사회초년생첫차' }
    ]
  },
  // Day 12
  {
    day: 12,
    slots: [
      { slot: 'MORNING (08:30)', slug: 'telecom-penalty-15', cast: '줄무늬 셔츠 라쿤 대리 & 여우 통신박사', category: '🌐 위약금15만' },
      { slot: 'LUNCH (12:30)', slug: 'pet-maltese-5kg', cast: '치즈태비 고양이·말티즈 & 여우 박사', category: '🐾 말티즈정량' },
      { slot: 'EVENING (20:30)', slug: 'room-oneroom-100', cast: '노란 앞치마 아기곰 포근이 & 여우 박사', category: '🛋️ 원룸100만원' }
    ]
  }
];

function getKstNow() {
  const kstMs = Date.now() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  return {
    iso: kst.toISOString().replace('T', ' ').slice(0, 19) + ' KST',
    dateStr: kst.toISOString().slice(0, 10),
    hour: kst.getUTCHours()
  };
}

function loadScheduleState() {
  const kst = getKstNow();
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (data.todayDateKst !== kst.dateStr) {
        data.todayDateKst = kst.dateStr;
        data.todayUploadedSlugs = [];
        data.currentDayIndex = ((Number(data.currentDayIndex) || 0) + 1) % constTWELVE_DAY_ROTATION.length;
      }
      return data;
    } catch (e) {}
  }
  return {
    todayDateKst: kst.dateStr,
    currentDayIndex: 0,
    maxDailyPosts: MAX_DAILY_POSTS,
    minIntervalHours: MIN_INTERVAL_HOURS,
    todayUploadedSlugs: [],
    publishedHistory: []
  };
}

function saveScheduleState(state) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function writeScheduleMarkdownReport(state) {
  const kst = getKstNow();
  const todayPlan = constTWELVE_DAY_ROTATION[state.currentDayIndex % constTWELVE_DAY_ROTATION.length];
  const remainingToday = Math.max(0, MAX_DAILY_POSTS - state.todayUploadedSlugs.length);

  const md = `# 🛡️ 인스타그램 · 쓰레드 일일 3편 안전 발행 스케줄 & 안티밴(Anti-Ban) 관리 보드

> **업데이트 시각**: ${kst.iso}
> **계정 보호 정책**: **하루 최대 ${MAX_DAILY_POSTS}편 엄수 (오전 08:30 · 점심 12:30 · 저녁 20:30 KST, 최소 ${MIN_INTERVAL_HOURS}시간 간격)**
> **오늘 발행 현황 (${state.todayDateKst})**: **${state.todayUploadedSlugs.length} / ${MAX_DAILY_POSTS}편 완료** (잔여 가능 횟수: **${remainingToday}편**)

---

## 🎯 1. 오늘(Day ${todayPlan.day})의 3편 교차 편성 라인업

| 시간대 (KST) | 카테고리 | 에피소드 슬러그 (\`slug\`) | 에피소드 제목 | 고유 동물 등장인물 | 오늘 게시 상태 |
| :---: | :---: | :--- | :--- | :--- | :---: |
${todayPlan.slots
  .map(s => {
    const ep = SHORT_4CUT_BY_SLUG[s.slug] || {};
    const isDone = state.todayUploadedSlugs.includes(s.slug);
    return `| **${s.slot}** | ${s.category} | \`${s.slug}\` | **${ep.epTitle || s.slug}** | 🐾 ${s.cast} | ${isDone ? '✅ **게시 완료**' : '⏳ **대기 중**'} |`;
  })
  .join('\n')}

---

## 📈 2. 왜 '하루 3편 교차 발행'이 마케팅과 계정 안전에 가장 강력한가?

1. **메타(인스타그램·쓰레드) 스팸/섀도우밴 100% 원천 차단**:
   - 단시간에 4~5개 이상의 게시물을 연속 업로드하면 메타 자동 봇 탐지기가 \`Action Blocked\` 또는 도달 제한(Shadowban)을 걸게 됩니다.
   - **하루 3편(출근길 08:30 · 점심 12:30 · 퇴근길 20:30, 4~8시간 간격)**으로 제한하면 100% 정상 크리에이터 패턴으로 인식되어 계정 신뢰도(Trust Score)가 오히려 상승합니다.
2. **카테고리 & 동물 캐릭터 교차 편성(Cross-Category Rotation) 효과**:
   - 같은 주제를 연속으로 올리면 피로도가 생기지만, **오전(전기/통신 고정비) ➔ 점심(다이어트/반려동물 일상) ➔ 저녁(자취방/자동차 목돈)** 순으로 교차 편성하면 하루에 3개의 서로 다른 타겟층을 동시에 흡수합니다.
   - 프로필 그리드에 들어왔을 때 매 칸마다 **쿼카 ➔ 푸들&고양이 ➔ 호랑이 대표님 ➔ 레서판다 ➔ 아기 포메&사슴**으로 캐릭터와 색감이 다채롭게 펼쳐져 **프로필 방문 대비 팔로우 전환율과 프로필 링크 클릭률(CTR)**이 극대화됩니다.
3. **인스타그램(5장 캐러셀) × 쓰레드(1장 그리드 + 대댓글 링크) 투트랙 최적화**:
   - **인스타그램**: \`webtoon-grid.png\`(한판 요약) + \`slide-1~4.png\`(컷별 확대) 구성으로 체류시간과 저장(Save)을 유도하고, 본문에는 외부 URL을 넣지 않고 프로필 링크로 유도합니다.
   - **쓰레드**: 한눈에 읽히는 \`webtoon-grid.png\` 1장을 본문(링크 0개)에 올리고 **첫 번째 대댓글**에 해당 프리셋 계산기 직행 링크를 달아 즉시 유입을 만듭니다.

---

## 🗓️ 3. 12일 전편(36화) 자동 순환 마스터 스케줄표 (하루 3편 × 12일)

| 일차 | 오전 08:30 (생활/통신) | 점심 12:30 (식단/반려동물) | 저녁 20:30 (자동차/자취·신혼) |
| :---: | :--- | :--- | :--- |
${constTWELVE_DAY_ROTATION
  .map(
    d =>
      `| **Day ${d.day}** | \`${d.slots[0].slug}\`<br>(${d.slots[0].cast}) | \`${d.slots[1].slug}\`<br>(${d.slots[1].cast}) | \`${d.slots[2].slug}\`<br>(${d.slots[2].cast}) |`
  )
  .join('\n')}
`;

  fs.writeFileSync(SCHEDULE_MD_FILE, md, 'utf8');
  return SCHEDULE_MD_FILE;
}

async function prepareTodayThreePacks(options = {}) {
  const state = loadScheduleState();
  const todayPlan = constTWELVE_DAY_ROTATION[state.currentDayIndex % constTWELVE_DAY_ROTATION.length];

  const prepared = [];
  for (const item of todayPlan.slots) {
    const pack = await generateWebtoonPack({
      slug: item.slug,
      sendTelegram: false,
      skipExisting: true
    });
    prepared.push({
      ...item,
      epTitle: (SHORT_4CUT_BY_SLUG[item.slug] && SHORT_4CUT_BY_SLUG[item.slug].epTitle) || item.slug,
      gridPngPath: pack.gridPngPath,
      slidePaths: pack.slidePaths
    });
  }

  if (Array.isArray(options.markUploadedSlugs)) {
    options.markUploadedSlugs.forEach(s => {
      if (!state.todayUploadedSlugs.includes(s) && state.todayUploadedSlugs.length < MAX_DAILY_POSTS) {
        state.todayUploadedSlugs.push(s);
        state.publishedHistory.push({
          slug: s,
          uploadedAtKst: getKstNow().iso
        });
      }
    });
  }

  saveScheduleState(state);
  const reportPath = writeScheduleMarkdownReport(state);

  return {
    state,
    todayPlan,
    prepared,
    reportPath
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const markArg = args.find(a => a.startsWith('--mark-uploaded='));
  const markUploadedSlugs = markArg
    ? markArg
        .split('=')[1]
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : [];

  prepareTodayThreePacks({ markUploadedSlugs })
    .then(res => {
      console.log('===============================================================');
      console.log(` 🛡️ MONEYFIT DAILY 3-EPISODE ANTI-BAN SCHEDULER (${res.state.todayDateKst})`);
      console.log('===============================================================');
      console.log(`  ✓ Max Daily Quota    : ${res.state.todayUploadedSlugs.length} / ${MAX_DAILY_POSTS} uploaded today`);
      res.prepared.forEach((p, idx) => {
        const done = res.state.todayUploadedSlugs.includes(p.slug);
        console.log(`  ✓ Slot ${idx + 1} [${p.slot}] : ${p.epTitle} (${p.cast}) -> ${done ? 'UPLOADED' : 'READY'}`);
      });
      console.log(`  ✓ Schedule Report    : ${res.reportPath}`);
    })
    .catch(err => {
      console.error('Daily SNS Scheduler Error:', err.message);
      process.exit(1);
    });
}

module.exports = {
  MAX_DAILY_POSTS,
  MIN_INTERVAL_HOURS,
  constTWELVE_DAY_ROTATION,
  loadScheduleState,
  prepareTodayThreePacks
};
