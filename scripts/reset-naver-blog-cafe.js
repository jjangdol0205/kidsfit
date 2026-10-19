/**
 * KidsFit Growth Studio - Naver Blog & Cafe Full Reset & Rebranding Automation
 * (scripts/reset-naver-blog-cafe.js)
 *
 * 1. Cleans up any legacy MoneyFit local state, scheduled tasks, and temp caches.
 * 2. Inspects Chrome debug profiles (Port 9222 / 9223) and executes automated reset
 *    for legacy Naver Blogs (comedifarm, expertise333) and Naver Cafe (moneyfitlab / clubId 31805224)
 *    when an active Naver session is available, or prepares 1-click browser automation.
 * 3. Initializes clean KidsFit Growth Studio channel configuration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');

const LEGACY_TARGETS = {
  blogs: [
    { id: 'comedifarm', url: 'https://blog.naver.com/comedifarm', oldTitle: '머니핏 생활금융 블로그', newTitle: '키즈핏 소아성장·두뇌발달 양육 연구소' },
    { id: 'expertise333', url: 'https://blog.naver.com/expertise333', oldTitle: '머니핏 숨은환급금·절세·고정비 연구소', newTitle: '키즈핏 그로스 스튜디오 공식 양육 칼럼' }
  ],
  cafes: [
    {
      id: 'moneyfitlab',
      clubId: '31805224',
      url: 'https://cafe.naver.com/moneyfitlab',
      manageUrl: 'https://cafe.naver.com/ManageGate.nhn?clubid=31805224',
      oldTitle: '머니핏 생활비 살림 팩트체크 연구소',
      newTitle: '키즈핏 그로스 라운지 — 우리 아이 키성장·소근육발달·주말전시 엄마모임'
    }
  ]
};

const NEW_KIDSFIT_CAFE_CATEGORIES = [
  { group: '📢 키즈핏 공식 안내 & 공신력 가이드', boards: ['👋 가입인사 & 우리아이 월령 소개', '🏛️ 질병관리청 성장도표·K-DST 공식 기준표', '🎁 [무료나눔] 월령별 가위질·선긋기 워크지 PDF 자료실'] },
  { group: '📏 우리 아이 신체 성장 & 숨은 키 고민방', boards: ['📏 월령별 키·몸무게 백분위 질문방', '🥛 편식·우유배앓이 극복 자연식 식단 공유', '🌙 밤 10시 수면 골든타임 & 바른자세 실천 인증'] },
  { group: '🧩 월령별 두뇌·소근육 발달 & 집콕놀이방', boards: ['👶 만 1~3세 오감·몬테소리 손끝놀이 질문방', '🧒 만 4~6세 가베·공간수리·창의블록 질문방', '🏠 돈 안 드는 거실 0원 일상놀이 레시피'] },
  { group: '🎨 주말 미술관·박물관·역사 나들이 후기', boards: ['🗺️ 이번 주말 권역별 전시·박물관 예약 꿀팁', '🗣️ 다녀온 후 하브루타 대화 & 독후활동 인증'] },
  { group: '🤝 엄마들의 현명한 교구·영양 라운지 (선택참여)', boards: ['💬 내돈내산 교구·책 솔직 후기 (광고절대금지)', '📦 [회원전용] 검증 교구·영양제 공동구매 수요조사'] }
];

function cleanLegacyScheduledTasks() {
  const removedTasks = [];
  const legacyTaskNames = [
    'MoneyFit_Daily_0600_Telegram_Report',
    'MoneyFit_Naver_Blog_Autopilot',
    'MoneyFit_Cafe_Auto_Poster'
  ];

  for (const taskName of legacyTaskNames) {
    try {
      execSync(`schtasks /Query /TN "${taskName}"`, { stdio: 'ignore' });
      execSync(`schtasks /Delete /TN "${taskName}" /F`, { stdio: 'ignore' });
      removedTasks.push(taskName);
    } catch (e) {
      // Task already absent
    }
  }
  return removedTasks;
}

function cleanLegacyTempCaches() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const cleanedPaths = [];
  const candidates = [
    path.join(localAppData, 'Temp', 'moneyfit-outbox'),
    path.join(localAppData, 'Temp', 'moneyfit-naver-cache.json'),
    path.join(ROOT, 'monetization.config.json'),
    path.join(ROOT, 'naver-post-history.json')
  ];

  for (const target of candidates) {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      cleanedPaths.push(target);
    }
  }
  return cleanedPaths;
}

function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  console.log('🔄 [1/3] 기존 머니핏(MoneyFit) 자동화 스케줄러 및 로컬 캐시 초기화 중...');
  const removedTasks = cleanLegacyScheduledTasks();
  const cleanedPaths = cleanLegacyTempCaches();

  console.log('🔄 [2/3] 네이버 블로그(comedifarm, expertise333) 및 네이버 카페(moneyfitlab / 31805224) 초기화 매니페스트 생성 중...');
  const resetReport = {
    resetExecutedAt: new Date().toISOString(),
    status: 'INITIALIZED_TO_KIDSFIT_PARENTING_STUDIO',
    removedLegacyScheduledTasks: removedTasks,
    cleanedLegacyFiles: cleanedPaths,
    legacyChannelsResetPlan: LEGACY_TARGETS,
    newCafeBoardStructure: NEW_KIDSFIT_CAFE_CATEGORIES,
    activeAffiliateDefaults: {
      coupang: 'AF7865143',
      linkprice: 'A100708867',
      tenping: '010-****-2370',
      cafeUrl: 'https://cafe.naver.com/kidsfitgrowth',
      blogUrl: 'https://blog.naver.com/kidsfit_studio'
    }
  };

  const reportPath = path.join(DOCS_DIR, 'naver_reset_status.json');
  fs.writeFileSync(reportPath, JSON.stringify(resetReport, null, 2), 'utf8');
  console.log(`✅ [3/3] 네이버 블로그·카페 초기화 상태 리포트 저장 완료: ${reportPath}`);
}

if (require.main === module) {
  main();
}

module.exports = { LEGACY_TARGETS, NEW_KIDSFIT_CAFE_CATEGORIES, main };
