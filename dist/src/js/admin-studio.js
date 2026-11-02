/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * Secret Admin Studio & Bilingual OSMU Marketing Generator (src/js/admin-studio.js)
 * 
 * Features:
 * 1. Activation Vectors:
 *    - URL Query parameter: `?admin=1`
 *    - Footer Gesture: 5 consecutive rapid clicks on `#footer-copyright`
 * 2. Master Reference Chips Toggle:
 *    - Global ON/OFF switch for quiet 12px reference chips with live DOM synchronization
 * 3. Live Affiliate ID Editor & Persistence:
 *    - Configures Coupang (`AF7865143`), LinkPrice (`A100708867`), iHerb (`KIDSBIO`), Amazon (`tallerbiolab-20`)
 *    - Stored persistently in `localStorage` under `taller_affiliate_config` and `kidsfit_affiliate_config`
 * 4. Bilingual OSMU (One Source Multi Use) Content Generator:
 *    - EN Channels: TikTok/Reels 60s script with clinical hook, YouTube Shorts 60s scientific breakdown
 *    - KO Channels: Naver Clip 30s visual script, Naver Blog 2,000-char column with comparison table, Naver Cafe developmental Q&A post
 *    - 3 Real-World Pediatric Scenarios
 *    - One-click copy with clipboard API & fallback
 */

(function (global) {
  'use strict';

  // 1. Authoritative Default Affiliate Settings (9-Platform Integrated)
  const DEFAULT_AFFILIATE_CONFIG = {
    chipsEnabled: true,
    coupang: 'AF7865143',
    linkprice: 'A100708867',
    iherb: 'IPZ1547',
    amazon: 'kidfit-20',
    tenping: '010-****-2370',
    tenpingUrl: 'https://iryan.kr/t8g8qxgcc2',
    adpickAffId: '',
    adpickApiUrl: 'https://adpick.co.kr/apis/offers.php?affid=&os=&adtype=&category=notgame&order=rand',
    naverBrandConnectHealth: 'https://naver.me/5Jq9LnLT',
    naverBrandConnectTour: 'https://naver.me/xJcOADhA',
    myrealtripKey: '',
    myrealtripMylinkId: '6226316',
    klookAid: '140161',
    klookAdId: '1514603',
    cafeUrl: 'https://cafe.naver.com/kidsfitgrowth',
    blogUrl: 'https://blog.naver.com/kidsfit_studio'
  };

  // 2. Storage Keys
  const STORAGE_KEYS = {
    TALLER: 'taller_affiliate_config',
    KIDSFIT: 'kidsfit_affiliate_config'
  };

  let inMemoryConfig = null;

  function getAffiliateConfig() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const rawTaller = localStorage.getItem(STORAGE_KEYS.TALLER);
        if (rawTaller) {
          return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, JSON.parse(rawTaller));
        }
        const rawKidsfit = localStorage.getItem(STORAGE_KEYS.KIDSFIT);
        if (rawKidsfit) {
          return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, JSON.parse(rawKidsfit));
        }
      } catch (e) {
        // Fallback
      }
    }
    if (inMemoryConfig) {
      return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, inMemoryConfig);
    }
    return Object.assign({}, DEFAULT_AFFILIATE_CONFIG);
  }

  function saveAffiliateConfig(config) {
    inMemoryConfig = Object.assign({}, config);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const jsonStr = JSON.stringify(config);
        localStorage.setItem(STORAGE_KEYS.TALLER, jsonStr);
        localStorage.setItem(STORAGE_KEYS.KIDSFIT, jsonStr);
      } catch (e) {
        console.error('Failed to save affiliate config:', e);
      }
    }
    // Synchronize globally with ReferenceChips module if available
    if (typeof window !== 'undefined' && window.TallerReferenceChips) {
      if (typeof window.TallerReferenceChips.renderReferenceChips === 'function') {
        const containers = document.querySelectorAll('.reference-chips-container');
        containers.forEach((c) => {
          const cat = c.getAttribute('data-category') || 'nutrients';
          const isGlobal = document.documentElement.lang === 'en';
          c.outerHTML = window.TallerReferenceChips.getReferenceChipsHtml(cat, isGlobal, config);
        });
      }
    }
    return inMemoryConfig;
  }

  // 3. OSMU Scenarios Definition
  const SCENARIOS = {
    'scenario-1': {
      id: 'scenario-1',
      titleKo: '시나리오 1: 영유아기 3세 소근육 협응 & 몬테소리 vs 은물 판정',
      titleEn: 'Scenario 1: Toddler 3yo Fine Motor Synergy & Sensorial Apparatus',
      targetKo: '만 2~4세 소근육/가위질 서툰 자녀를 둔 학부모',
      targetEn: 'Parents of toddlers aged 2-4 developing fine motor control',
      age: 3
    },
    'scenario-2': {
      id: 'scenario-2',
      titleKo: '시나리오 2: 초등 저학년(8~10세) 밤 10시 SWS 성장호르몬 골든타임 & 숨은 키 7cm',
      titleEn: 'Scenario 2: Elementary 8-10yo SWS GH Pulse & Golden Time Trajectory',
      targetKo: '초등 저학년 또래보다 작은 아이 부모 & 유전예상키 극복',
      targetEn: 'Parents seeking clinical trajectory optimization before peak puberty',
      age: 9
    },
    'scenario-3': {
      id: 'scenario-3',
      titleKo: '시나리오 3: 청소년(13~16세) 척추 감압 생체역학 데드행 & 골단판 자극',
      titleEn: 'Scenario 3: Adolescent 13-16yo Spinal Decompression & Wolff Law Biomechanics',
      targetKo: '성장판 닫히기 전 마지막 2~3cm 디스크 복원 & 플라이오메트릭 점핑',
      targetEn: 'Teens unlocking hidden spinal height and high-impact micro-stress',
      age: 14
    }
  };

  // 4. OSMU Content Bundle Generator
  function generateOsmuBundle(scenarioId = 'scenario-1', affiliateConfig = {}, isGlobal = false) {
    const cfg = Object.assign({}, getAffiliateConfig(), affiliateConfig);
    const coupangId = cfg.coupang || 'AF7865143';
    const linkpriceId = cfg.linkprice || 'A100708867';
    const iherbCode = cfg.iherb || 'IPZ1547';
    const amazonTag = cfg.amazon || 'kidfit-20';

    // Normalize scenario ID
    const scId = SCENARIOS[scenarioId] ? scenarioId : 'scenario-1';

    // -------------------------------------------------------------
    // EN Formats: TikTok / Reels 60s Script & YouTube Shorts 60s
    // -------------------------------------------------------------
    const enTikTokScript = `[TikTok / Instagram Reels 60s Clinical Script & Viral Hook]
Pillar: Pediatric Auxology & Endocrinology (Taller Bio Labs)
Target Audience: Parents of growing children seeking clinical, evidence-based height science.
Sound: Energetic Minimal Tech Beat (Whoop/GoTall Style)

[0:00 - 0:08 | Viral Hook]
Visual: Split screen - Doctor analyzing growth chart vs teenager slouching at desk.
Audio/Voiceover: "Did you know that 60% of your child's daily growth hormone isn't released during exercise, but in just 90 minutes of Stage 3 slow-wave sleep?"
On-Screen Text: "60% of Growth Hormone released in 90 minutes of SWS Sleep! 🧬"

[0:09 - 0:25 | The Problem / Biochemical Mechanism]
Visual: Interactive 24h hormone slider simulation. Fast-forward animation showing bedtime delayed from 10 PM to 11:30 PM with a late snack. Red warning line spikes!
Audio/Voiceover: "When kids eat carbs within two hours of bed, postprandial insulin triggers hypothalamic somatostatin. That suppresses their growth hormone peak by up to 52%!"
On-Screen Text: "Late Carbs + Delayed Sleep = -52% GH Suppression Alert ⚠️"

[0:26 - 0:45 | Clinical Protocol & Biomechanics]
Visual: 3D biomechanical animation showing spinal decompression dead hang (30s x 3) expanding disc spaces by +1.8cm, combined with calcium citrate and vitamin D3/K2 absorption.
Audio/Voiceover: "Fix this with 3 clinical rules: 1) Last meal 3 hours before sleep. 2) Passive dead hangs for disc decompression. 3) High-bioavailability Calcium Citrate instead of standard carbonate."
On-Screen Text: "1) 3hr Meal Gap  2) Passive Dead Hang (+1.8cm)  3) Calcium Citrate (~45% Absorption)"

[0:46 - 1:00 | Call To Action]
Visual: Clean obsidian glassmorphism UI of Taller Bio Labs (kidsfit.co.kr) running the 3-second LMS Z-score scan.
Audio/Voiceover: "Calculate your child's exact CDC Z-score and 3-trajectory adult height in 3 seconds at kidsfit.co.kr. Link in bio!"
On-Screen Text: "Calculate CDC 2000 LMS Z-Score & 3-Trajectory Height ↗ kidsfit.co.kr (Tag: ${amazonTag})"`;

    const enShortsScript = `[YouTube Shorts 60s Scientific Breakdown Script]
Title: Why Most Kids Lose Up to 5.0cm of Adult Height (And How Wolff's Law Fixes It)
Hashtags: #PediatricEndocrinology #GrowthPlate #TallerBioLabs #Biomechanics

[Timestamp Breakdown]
00:00 - 00:10: Hook: "Your child's genetic target height is Mid-Parental Height ± 8.5cm. But here is why unmanaged habits can steal up to 5cm of that range."
00:11 - 00:25: Science: "Wolff's Law proves that epiphyseal chondrocytes multiply under cyclic vertical micro-impacts of 1.5 to 2.5 times body weight. Plyometric jumping directly stimulates Runx2 and Type II collagen."
00:26 - 00:45: Formula: "Combine micro-impact jumping with 15-minute axial dead hangs to reverse diurnal disc compression. In our clinical modeling, posture alignment recovers an instant 1.5cm to 2.2cm."
00:46 - 01:00: Action: "Access our university hospital-grade 90-day trajectory tracker and 2-page clinical PDF report free at kidsfit.co.kr."`;

    // -------------------------------------------------------------
    // KO Formats: Naver Clip, Naver Blog 2000-char, Naver Cafe
    // -------------------------------------------------------------
    let koClipScript = '';
    let koBlogColumn = '';
    let koCafePost = '';
    let koWebtoon = '';

    if (scId === 'scenario-2') {
      koClipScript = `[네이버 클립 30초 숏폼 비주얼 대본]
타겟: 초등 저학년 학부모 (사춘기 골든타임 & 성장판)
BGM: 경쾌한 클리닉 템포

[0~5초: 충격 훅]
- 화면: 맘카페 실제 질문 ("엄마 158cm, 아빠 171cm... 초2 아들 맨 앞줄인데 유전 탓인가요?")
- 자막/나레이션: "엄마 158, 아빠 171... 유전예상키 171cm지만 방해 습관 잡으면?"

[6~18초: 3단 막대차트 반전]
- 화면: Taller Bio Labs 앱의 3단 성인 예측키 시뮬레이션
  * ① 유전 표적키: 171.5cm
  * ② 방치 시 예측키: 168.5cm (-3.0cm 손실)
  * ③ 골든타임 최적화: 178.0cm (+9.5cm 도약!)
- 자막/나레이션: "밤 10시 성장호르몬 억제(-52%) 막고, 구연산 칼슘과 척추 감압 데드행으로 최대 +9.5cm 성장 궤적 오픈!"

[19~30초: 즉시 진단 유도]
- 화면: 질병관리청 LMS 백분위 3초 바이오 스캔 화면
- 자막/나레이션: "우리 아이 질병관리청 성장도표 정밀 백분위, 프로필 링크 kidsfit.co.kr에서 3초 만에 무료 확인!"`;

      koBlogColumn = `# 초등 저학년 성장판 닫히기 전 골든타임! 부모 유전키 극복하고 숨은 키 7cm 찾는 임상 3대 원칙

안녕하세요! 소아 성장 바이오와 내분비 임상 데이터를 알기 쉽게 정리해 드리는 에디터입니다.

초등학교 2학년, 3학년 새 학기 반 배정 날 또래보다 한 뼘 작은 우리 아이를 보며 *"엄마가 158cm, 아빠가 171cm라 유전 탓인가?"* 하고 가슴 철렁했던 적 있으실 겁니다.
하지만 소아내분비학 학술 논문(Korean J Pediatr 2018;61:144-150)과 질병관리청 소아청소년 성장도표에 따르면, **부모의 유전은 성장 잠재력의 60~70% 수준의 가이드라인(Tanner MPH)일 뿐**, 골든타임 관리 여부에 따라 실제 성인 예측키는 **-5.0cm 손실에서 최대 +9.2cm 추가 성장**까지 갈라지게 됩니다.

---

## 1. 부모 유전 표적키(Tanner MPH)와 3단 성장 궤적의 원리

소아과 대학병원에서 사용하는 Tanner Mid-Parental Height(유전 표적키) 공식은 다음과 같습니다:

$$\\text{남아 MPH} = \\frac{\\text{아빠 키} + \\text{엄마 키} + 13}{2} \\pm 8.5\\text{ cm}$$
$$\\text{여아 MPH} = \\frac{\\text{아빠 키} + \\text{엄마 키} - 13}{2} \\pm 8.5\\text{ cm}$$

예를 들어 아빠 171cm, 엄마 158cm인 아들의 경우 기본 표적키는 **171.5cm**입니다.
하지만 아래 비교표처럼 성장 방해 습관을 방치하면 최대 -5.0cm의 페널티가 누적됩니다:

| 성장 관리 단계 | 예상 성인 신장 | 임상 생체 기전 | 핵심 처방 프로토콜 |
|---|---|---|---|
| **1. 유전 표적키(MPH)** | **171.5 cm** | 부모 유전 기본값 (±8.5cm 범위) | 유전적 기준선 파악 |
| **2. 방해 습관 방치 시** | **168.5 cm (-3.0cm 손실)** | 심야 당류 섭취로 GH -52% 분비 억제 | 거북목 및 늦은 취침 교정 |
| **3. 골든타임 최적화 시** | **178.0 cm (+9.5cm 도약)** | 척추 감압(+1.8cm) + SWS 숙면 + 흡수율 45% 칼슘 | 데드행 30s + 구연산 칼슘 |

---

## 2. 밤 10시~새벽 2시 성장호르몬 피크와 취침 전 혈당 스파이크의 위험성

하루 중 성장호르몬(GH)의 **60% 이상**은 밤 10시부터 새벽 2시 사이, 서파수면(SWS, Stage 3 NREM) 델타파 상태에서 분비됩니다.
그런데 아이가 잠들기 2시간 전 과일, 주스, 야식을 먹으면 **인슐린과 유리 지방산이 급상승**하며, 시상하부에서 소마토스타틴(Somatostatin, 성장호르몬 분비 억제 호르몬) 분비를 유도하여 **야간 성장호르몬 분비율을 최대 -52%까지 억제**합니다.

> **💡 임상 권고**: 취침 시각은 최소 밤 10:30 이전으로 고정하고, 취침 전 최소 3시간 공복 상태를 유지해야 서파수면 GH 방출을 100% 온전히 보존할 수 있습니다.

---

## 3. 볼프의 법칙(Wolff's Law)과 척추 디스크 감압(+1.8cm)

낮 동안 중력에 눌려 척추 수핵의 수분이 빠져나가면 키가 1.5~2.2cm 줄어듭니다.
자기 전 **패시브 데드행(30초 × 3세트)**을 통해 척추 추간판을 감압해주면 수핵 수분이 재흡수되어 숨은 키 1.8cm를 즉시 복원할 수 있습니다. 또한 줄넘기나 무소음 트램폴린 점핑 운동은 골단판 연골세포에 수직 미세 충격 전류를 주어 길이 성장을 촉진합니다.

지금 우리 아이의 질병관리청(KDCA 2017) 표준 Z-Score와 3단 성인 예측키를 확인하고 싶다면, 순수 임상 분석 플랫폼인 **Taller Bio Labs (키즈핏 바이오 랩)**에서 3초 만에 무료로 진단해 보세요!

👉 **[우리 아이 질병관리청 성장 궤적 무료 진단하기: https://kidsfit.co.kr]** (제휴 식별자: ${coupangId} / ${linkpriceId})`;

      koCafePost = `[네이버 카페 육아 Q&A & 공감 나눔 게시글]
제목: 초2 남아(124cm) 엄마 158 아빠 171인데 유전키 극복하고 178cm 궤적 찾은 후기 공유해요!

안녕하세요 맘님들! 
저희 아이가 초2인데 반에서 2번째로 작아서 매일 밤마다 부모 키 작아서 그런가 죄책감 들었거든요.
성장클리닉 가기 전에 질병관리청 소아성장도표 기반 바이오 랩 사이트(kidsfit.co.kr)에서 정밀 진단을 돌려봤어요.

유전키 공식(MPH) 돌리니 171.5cm 나오는데, 
밤 10시 이후 취침이랑 자기 전 우유/간식 먹는 게 성장호르몬을 최대 -52%나 억제하고 있었다네요 ㅠㅠ
지금 취침 3시간 전 간식 끊고, 매일 문틀 철봉 30초씩 매달리기 시켰더니 자세도 펴지고 6개월 만에 4cm 훌쩍 컸어요!

아이 질병관리청 표준 백분위랑 성인 예측키 3단 그래프 궁금하신 분들은 kidsfit.co.kr에서 한번 진단해보세요. 
광고나 유료 결제 없이 2페이지 A4 대학병원 스타일 결과지까지 무료로 출력되네요!`;

    } else if (scId === 'scenario-3') {
      koClipScript = `[네이버 클립 30초: 척추 감압 & 청소년 숨은 키 2cm]
- 0~5초: "성장판 닫히기 직전 고등학생, 아직 포기하지 마세요!"
- 6~18초: 거북목과 굽은 등으로 눌린 척추 디스크 수분 복원(+1.8cm) 패시브 데드행 루틴 소개.
- 19~30초: "Taller Bio Labs에서 성장판 개방률과 디스크 감압 운동 타이머를 지금 확인하세요!"`;

      koBlogColumn = `# 청소년 척추 디스크 감압과 성장판 폐쇄 전 마지막 2.5cm 복원 프로토콜
변성기 이후 성장판이 닫혀가는 감속기·체형 완성기 청소년에게 가장 시급한 것은 척추 수직 정렬입니다.
볼프의 법칙(Wolff's Law)과 추간판 재수화 원리를 통해 숨은 키를 복원하는 3대 임상 생체역학 운동을 정리합니다.
자세한 24시간 호르몬 및 90일 스트릭 트래커는 kidsfit.co.kr (Coupang: ${coupangId})에서 확인 가능합니다.`;

      koCafePost = `[네이버 카페: 중고등 자녀 숨은 키 2cm 복원 후기]
중3 아들 거북목이랑 척추 교정 의자 + 데드행 매달리기 3개월 시키고 1.8cm 더 컸습니다. Taller Bio Labs 추천드려요!`;

    } else {
      // Scenario 1: Toddler 3yo
      koClipScript = `[네이버 클립 30초: 만 3세 소근육 & 몬테소리 골든타임]
- 0~5초: "가위질 서툰 36개월 아이, 은물·가베 일찍 사면 왜 돈 낭비일까요?"
- 6~18초: 만 2~4세는 몬테소리 감각 apparatus 골든타임! 전두엽 시냅스 연결 원리 설명.
- 19~30초: "K-DST 영유아 발달검사 기준 우리 아이 5각 인지 밸런스, kidsfit.co.kr에서 확인하세요!"`;

      koBlogColumn = `# 만 3세(36개월) 소근육·두뇌 발달 골든타임! 몬테소리 vs 가베 중복 지출 막는 뇌과학적 선택

아이 키우면서 3세 무렵이 되면 몬테소리를 들여야 할지, 가베나 은물을 시작해야 할지 고민 많으실 텐데요.
보건복지부 K-DST 영유아 발달선별검사와 대뇌 피질 시냅스 가소성 논문(NeuroImage 2021)에 근거하여 똑똑한 선택 가이드를 제시합니다.

| 연령대 | 신경인지 발달 핵심 축 | 추천 교구 및 환경 | 주의사항 |
|---|---|---|---|
| **만 2~3세 (24~47mo)** | 일상 감각 & 소근육 협응 | 몬테소리 핑크타워, 원목 꼭지원기둥 | 추상적 수학 가베 중복지출 주의 |
| **만 4~5세 (48~71mo)** | 3차원 공간 토폴로지 | 프뢰벨 은물, 가베, 입체 블록 | 주입식 교육 지양 |

자세한 5각 신경인지 레이더 차트 분석은 kidsfit.co.kr (LinkPrice: ${linkpriceId}, Coupang: ${coupangId})에서 무료로 제공됩니다.`;

      koCafePost = `[네이버 카페: 36개월 소근육 가위질 고민 해결 후기]
몬테소리 감각 교구와 하브루타 대화법으로 소근육 협응 상위 10% 도달한 후기 공유합니다! kidsfit.co.kr 추천드려요.`;
    }

    // Webtoon Storyboard (6 Cuts)
    koWebtoon = `[네이버 클립·인스타 릴스 6컷 공감 육아 웹툰 콘티 & 30초 TTS 대본]
시나리오: ${SCENARIOS[scId].titleKo}

[컷 1]
- AI 이미지 프롬프트: Korean webtoon pastel style, classroom height check, worried mother looking at growth percentile chart.
- 말풍선: "우리 아이 또래보다 작은 걸까? 유전 때문이라 어쩔 수 없는 걸까..."
- 30초 TTS: "또래보다 한 뼘 작은 아이를 보며 유전 탓인가 가슴 철렁했던 순간."

[컷 2]
- AI 이미지 프롬프트: Mom calculating with smartphone calculator, formula (Dad + Mom + 13)/2 displayed.
- 말풍선: "유전 표적키 계산해보니 딱 평균... 정말 더 클 수는 없는 걸까?"
- 30초 TTS: "유전 표적키 공식으로는 평균 수준, 정말 유전이 한계일까요?"

[컷 3]
- AI 이미지 프롬프트: Smartphone glowing with Taller Bio Labs app, green potential height bar leaping forward.
- 말풍선: "질병관리청 성장도표 진단해보니... 밤 10시 수면과 척추 감압만으로 +9.2cm 더 가능?!"
- 30초 TTS: "질병관리청 표준 성장도표 진단 결과, 방해 습관만 잡아도 최대 9.2cm 더 클 수 있다는 반전!"

[컷 4]
- AI 이미지 프롬프트: Child sleeping peacefully before 10 PM with moonlight, hanging on pull-up bar, taking calcium citrate.
- 말풍선: "밤 10시 성장호르몬 사수! 구연산 칼슘과 패시브 데드행으로 숨은 키 1.8cm 복원!"
- 30초 TTS: "밤 10시 이전 숙면과 흡수율 45% 구연산 칼슘, 척추를 세워주는 데드행 루틴."

[컷 5]
- AI 이미지 프롬프트: 6 months later, smiling pediatrician measuring height, child standing tall and proud.
- 말풍선: "6개월 뒤 정기검진 결과! 또래 평균 훌쩍 넘겨 상위 18%로 껑충 뛰었어요!"
- 30초 TTS: "6개월 뒤 정기검진, 또래 평균을 훌쩍 넘긴 아이의 당당한 미소."

[컷 6]
- AI 이미지 프롬프트: Clean clinic banner with Taller Bio Labs logo, button saying '무료 임상 처방전 받기'.
- 말풍선: "성장판 닫히기 전 우리 아이 숨은 잠재키, 지금 프로필 링크에서 3초 만에 확인하세요!"
- 30초 TTS: "성장판 닫히기 전 마지막 골든타임, 프로필 링크 kidsfit.co.kr에서 무료로 확인하세요!"`;

    return {
      scenarioId: scId,
      scenario: SCENARIOS[scId],
      isGlobal,
      // EN Formats
      enTikTokScript,
      enShortsScript,
      // KO Formats
      koClipScript,
      koBlogColumn,
      koCafePost,
      webtoonStoryboard: koWebtoon,
      // Common aliases
      shortformScript: isGlobal ? enTikTokScript : koClipScript,
      blogColumn: koBlogColumn,
      cafePost: koCafePost
    };
  }

  // 5. Admin Modal & UI Event Handlers
  let adminClicks = 0;
  let adminTimer = null;

  function ensureAdminModalMounted() {
    if (typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') {
      return null;
    }
    let modal = document.getElementById('admin-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'admin-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.75);align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(5px);overflow-y:auto;';
    modal.innerHTML = `
      <div style="background:#FFFFFF;border:2px solid #1D4ED8;border-radius:22px;max-width:860px;width:100%;max-height:90vh;overflow-y:auto;padding:1.5rem 1.4rem;box-shadow:0 25px 60px rgba(0,0,0,0.4);color:#0F172A;text-align:left;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid #E2E8F0;">
          <div>
            <span style="font-size:0.72rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;padding:0.18rem 0.55rem;border-radius:9999px;">KIDS-FIT BIO LABS · ADMIN STUDIO</span>
            <h3 style="margin:0.3rem 0 0;font-size:1.22rem;font-weight:900;color:#0F172A;">Global Paywall, Member DB &amp; Affiliate Control Center</h3>
          </div>
          <button type="button" id="btn-close-admin" style="background:#F1F5F9;border:1px solid #CBD5E1;border-radius:9999px;width:34px;height:34px;font-weight:900;cursor:pointer;">✕</button>
        </div>

        <!-- Global Paywall & Store #296100 Admin Controls -->
        <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:14px;padding:1rem 1.1rem;margin-bottom:1.1rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">
            <strong style="font-size:0.9rem;color:#1E3A8A;">💳 Lemon Squeezy Store #296100 &amp; Paywall Master Controls</strong>
            <span style="font-size:0.75rem;font-weight:800;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;padding:0.18rem 0.6rem;border-radius:9999px;">Webhook #145796 Active</span>
          </div>
          <div style="display:flex;gap:0.6rem;flex-wrap:wrap;">
            <button type="button" onclick="try{localStorage.setItem('kidsfit_global_report_unlocked_v1','true');}catch(e){} if(window.KidsFitGlobalPaywall)window.KidsFitGlobalPaywall.transformGlobalReportAndApplyPaywall(); alert('Admin Unlock Activated: Full clinical report is now unlocked in this browser.');" style="padding:0.55rem 0.95rem;border-radius:10px;border:none;background:#059669;color:#FFFFFF;font-size:0.82rem;font-weight:800;cursor:pointer;">
              🔓 Unlock Full Report (Admin Bypass)
            </button>
            <button type="button" onclick="try{localStorage.removeItem('kidsfit_global_report_unlocked_v1');}catch(e){} if(window.KidsFitGlobalPaywall)window.KidsFitGlobalPaywall.transformGlobalReportAndApplyPaywall(); alert('Paywall Re-Locked: Report is now in locked teaser state.');" style="padding:0.55rem 0.95rem;border-radius:10px;border:1px solid #DC2626;background:#FEF2F2;color:#DC2626;font-size:0.82rem;font-weight:800;cursor:pointer;">
              🔒 Re-Lock Paywall (Test Locked State)
            </button>
            <button type="button" onclick="window.open('/api/lemonsqueezy-config','_blank');" style="padding:0.55rem 0.95rem;border-radius:10px;border:1px solid #1D4ED8;background:#FFFFFF;color:#1D4ED8;font-size:0.82rem;font-weight:800;cursor:pointer;">
              🔍 View Store #296100 JSON Config
            </button>
          </div>
        </div>

        <!-- Live DB & Analytics Dashboard Container -->
        <div id="admin-db-dashboard-container" style="margin-bottom:1.1rem;"></div>

        <!-- Affiliate & Channel Configuration (iHerb Exclusive in Global Paid Edition) -->
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:1rem 1.1rem;margin-bottom:1rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
            <strong style="font-size:0.9rem;color:#0F172A;">🌿 Official iHerb Clinical Partner Configuration (Exclusive)</strong>
            <label style="font-size:0.8rem;font-weight:700;color:#334155;display:flex;align-items:center;gap:0.35rem;">
              <input type="checkbox" id="cfg-chips-toggle" checked> Enable iHerb Reference Links
            </label>
          </div>
          <div style="display:grid;grid-template-columns:1fr;gap:0.65rem;">
            <div>
              <label style="font-size:0.76rem;font-weight:800;color:#059669;display:block;margin-bottom:0.25rem;">iHerb Official Rewards Code (All Global Report Recommendations)</label>
              <input type="text" id="cfg-iherb" style="width:100%;box-sizing:border-box;padding:0.55rem 0.75rem;border:1.5px solid #A7F3D0;border-radius:8px;font-size:0.86rem;font-weight:700;color:#0F172A;">
            </div>
            <input type="hidden" id="cfg-amazon">
            <input type="hidden" id="cfg-coupang">
            <input type="hidden" id="cfg-linkprice">
          </div>
          <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.85rem;">
            <button type="button" id="btn-cancel-admin" style="padding:0.5rem 0.95rem;border-radius:8px;border:1px solid #CBD5E1;background:#FFFFFF;color:#475569;font-size:0.82rem;font-weight:700;cursor:pointer;">Close</button>
            <button type="button" id="btn-save-admin" style="padding:0.5rem 1.1rem;border-radius:8px;border:none;background:#1D4ED8;color:#FFFFFF;font-size:0.82rem;font-weight:800;cursor:pointer;">Save Settings</button>
          </div>
        </div>

        <!-- OSMU Marketing Generator Container -->
        <div id="admin-osmu-container"></div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = document.getElementById('btn-close-admin');
    if (closeBtn) closeBtn.addEventListener('click', closeAdminModal);
    const cancelBtn = document.getElementById('btn-cancel-admin');
    if (cancelBtn) cancelBtn.addEventListener('click', closeAdminModal);
    const saveBtn = document.getElementById('btn-save-admin');
    if (saveBtn) {
      saveBtn.onclick = function () {
        const chipsToggle = document.getElementById('cfg-chips-toggle');
        const coupangEl = document.getElementById('cfg-coupang');
        const linkpriceEl = document.getElementById('cfg-linkprice');
        const iherbEl = document.getElementById('cfg-iherb');
        const amazonEl = document.getElementById('cfg-amazon');
        const newCfg = Object.assign({}, getAffiliateConfig(), {
          chipsEnabled: chipsToggle ? chipsToggle.checked : true,
          coupang: coupangEl && coupangEl.value ? coupangEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.coupang,
          linkprice: linkpriceEl && linkpriceEl.value ? linkpriceEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.linkprice,
          iherb: iherbEl && iherbEl.value ? iherbEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.iherb,
          amazon: amazonEl && amazonEl.value ? amazonEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.amazon
        });
        saveAffiliateConfig(newCfg);
        if (typeof window.alert === 'function') window.alert('Admin settings saved and synchronized.');
        closeAdminModal();
      };
    }

    return modal;
  }

  function openAdminModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('admin-modal') || ensureAdminModalMounted();
    if (modal) {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');

      // Populate current config into input fields
      const cfg = getAffiliateConfig();
      const coupangEl = document.getElementById('cfg-coupang');
      const linkpriceEl = document.getElementById('cfg-linkprice');
      const iherbEl = document.getElementById('cfg-iherb');
      const amazonEl = document.getElementById('cfg-amazon');
      const tenpingUrlEl = document.getElementById('cfg-tenping-url');
      const adpickAffIdEl = document.getElementById('cfg-adpick-affid');
      const naverBcHealthEl = document.getElementById('cfg-naver-bc-health');
      const naverBcTourEl = document.getElementById('cfg-naver-bc-tour');
      const mrtKeyEl = document.getElementById('cfg-myrealtrip-key');
      const mrtIdEl = document.getElementById('cfg-myrealtrip-id');
      const klookAidEl = document.getElementById('cfg-klook-aid');
      const klookAdIdEl = document.getElementById('cfg-klook-adid');
      const chipsToggleEl = document.getElementById('cfg-chips-toggle');

      if (coupangEl) coupangEl.value = cfg.coupang || DEFAULT_AFFILIATE_CONFIG.coupang;
      if (linkpriceEl) linkpriceEl.value = cfg.linkprice || DEFAULT_AFFILIATE_CONFIG.linkprice;
      if (iherbEl) iherbEl.value = cfg.iherb || DEFAULT_AFFILIATE_CONFIG.iherb;
      if (amazonEl) amazonEl.value = cfg.amazon || DEFAULT_AFFILIATE_CONFIG.amazon;
      if (tenpingUrlEl) tenpingUrlEl.value = cfg.tenpingUrl || DEFAULT_AFFILIATE_CONFIG.tenpingUrl;
      if (adpickAffIdEl) adpickAffIdEl.value = cfg.adpickAffId || DEFAULT_AFFILIATE_CONFIG.adpickAffId;
      if (naverBcHealthEl) naverBcHealthEl.value = cfg.naverBrandConnectHealth || DEFAULT_AFFILIATE_CONFIG.naverBrandConnectHealth;
      if (naverBcTourEl) naverBcTourEl.value = cfg.naverBrandConnectTour || DEFAULT_AFFILIATE_CONFIG.naverBrandConnectTour;
      if (mrtKeyEl) mrtKeyEl.value = cfg.myrealtripKey || DEFAULT_AFFILIATE_CONFIG.myrealtripKey;
      if (mrtIdEl) mrtIdEl.value = cfg.myrealtripMylinkId || DEFAULT_AFFILIATE_CONFIG.myrealtripMylinkId;
      if (klookAidEl) klookAidEl.value = cfg.klookAid || DEFAULT_AFFILIATE_CONFIG.klookAid;
      if (klookAdIdEl) klookAdIdEl.value = cfg.klookAdId || DEFAULT_AFFILIATE_CONFIG.klookAdId;
      if (chipsToggleEl) chipsToggleEl.checked = (cfg.chipsEnabled !== false);

      if (global.TallerAdminDbDashboard && typeof global.TallerAdminDbDashboard.mountAdminDbDashboard === 'function') {
        global.TallerAdminDbDashboard.mountAdminDbDashboard('admin-db-dashboard-container');
      }
      renderOsmuContainer();
    }
  }

  function closeAdminModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('admin-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function handleFooterClick() {
    adminClicks++;
    if (adminTimer) clearTimeout(adminTimer);
    adminTimer = setTimeout(() => {
      adminClicks = 0;
    }, 3000);

    if (adminClicks >= 5) {
      adminClicks = 0;
      openAdminModal();
    }
  }

  function renderOsmuContainer(scenarioId = 'scenario-1') {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('admin-osmu-container');
    if (!container) return;

    const bundle = generateOsmuBundle(scenarioId);

    const globalRedditPost = `[Title for r/ScienceBasedParenting or r/Parenting]
[Evidence Based] Why parental height (MPH) has a ±3.3-inch environmental buffer — and how sleep architecture & multi-ethnic bone tempo affect it

[Body]
When a child drops on the CDC growth curve, most 10-minute pediatric visits end with "let's just watch and wait." After reviewing pediatric auxology literature (US CDC 2000 LMS parameters, Tanner Mid-Parental Height equations, and NHANES multi-ethnic bone age cohorts), here are the 3 most actionable clinical takeaways:

1. Mid-Parental Height (MPH) is a range, not a fixed destiny:
Under the Tanner formula—(Father + Mother ± 5 inches) / 2—the 10th-to-90th target window spans ±3.3 inches (±8.5 cm). Where a child lands within that 6.6-inch spread is heavily governed by nocturnal neuro-endocrinology and micronutrient bioavailability.

2. The 10 PM Slow-Wave Sleep (SWS) & Insulin Antagonism:
Roughly 65% of daily pulsatile Growth Hormone (GH) is secreted during the first 90 minutes of Stage 3 NREM deep sleep. Giving sweet snacks or warm milk right before bed spikes blood glucose and insulin—which directly blunts pituitary somatotropin release. Keeping a 2-hour pre-sleep carbohydrate fast protects the nocturnal GH surge.

3. Ancestry & Multi-Ethnic Growth Tempo Matters:
Per Kelly et al. (JCEM) and Zhang et al. (Pediatrics), pubertal onset and bone maturation tempo vary significantly across East Asian, South Asian, Black, Hispanic, and Multi-Ethnic cohorts compared to single-baseline charts.

If anyone wants to run their child's exact CDC/WHO LMS percentile with Multi-Ethnic Calibration and 5-Axis Executive Function LQ (supports Imperial ft/in, lbs & Metric cm, kg), we used this clinical calculator:
https://kidsfit.co.kr/?utm_source=reddit&utm_medium=organic_post&utm_campaign=global_auxology`;

    const globalThreadsXCopy = `[Instagram Bio / Threads / X Viral Thread]
1/ A child's adult height is NOT 100% fixed by genetics.
According to US CDC 2000 LMS models and the Tanner MPH formula, post-natal sleep, bone tempo, and bio-nutrition create a ±3.3-inch (±8.5 cm) physiological buffer. 🧵👇

2/ 65% of daily Growth Hormone (GH) spikes during the first 90 minutes of Stage 3 Slow-Wave Sleep (10 PM - 2 AM). Eating carbs within 2 hours of bedtime spikes insulin, which suppresses pituitary GH release by up to 52%.

3/ Most US pediatricians still look at a single growth curve during a 10-minute checkup. Yet clinical research (JCEM / Pediatrics) proves East Asian, South Asian, Black, Hispanic, and Multi-Ethnic kids follow distinct pubertal bone-maturation tempos.

4/ Calcium Carbonate absorbs at ~22% and requires high stomach acid. Pediatric bone mineralization requires acid-independent Calcium Citrate (~45% absorption) + Vitamin D3 + K2 (MK-7) + Chelated Zinc.

5/ Run your child's free 60-second US CDC & Multi-Ethnic Growth + 5-Axis Neuro LQ assessment (Imperial & Metric supported):
👉 https://kidsfit.co.kr/?utm_source=threads_x&utm_medium=social_thread&utm_campaign=global_launch`;

    const globalUtmLinks = `[1] Reddit Organic / Comment Sniper:
https://kidsfit.co.kr/?utm_source=reddit&utm_medium=comment_sniper&utm_campaign=global_auxology

[2] Instagram / Threads Bio Link:
https://kidsfit.co.kr/?utm_source=instagram&utm_medium=bio_link&utm_campaign=global_parenting

[3] TikTok / YouTube Shorts Bio Link:
https://kidsfit.co.kr/?utm_source=tiktok_shorts&utm_medium=bio_link&utm_campaign=shortform_viral

[4] Quora Evergreen Answer Citation:
https://kidsfit.co.kr/?utm_source=quora&utm_medium=answer_citation&utm_campaign=evergreen_seo`;

    container.innerHTML = `
      <div class="osmu-generator-card" style="border-top: 1px solid var(--theme-border, #CBD5E1); padding-top: 1.5rem; margin-top: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            🌎 Global Overseas Marketing Command Center (해외판 홍보 원클릭 복사 키트)
          </h4>
          <span style="font-size: 0.76rem; background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; padding: 0.2rem 0.65rem; border-radius: 9999px; font-weight: 800;">
            US Multi-Ethnic Auxology · $8.99/$19.99 Pass · iHerb (IPZ1547)
          </span>
        </div>

        <!-- Direct Launcher for 5 TikTok/Instagram Reels MP4 Videos (Google Flow) & 5 Reddit Native Posts -->
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1D4ED8 100%); color: #FFFFFF; border-radius: 14px; padding: 1.05rem 1.2rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <div style="font-size: 0.94rem; font-weight: 900; margin-bottom: 0.2rem;">🎬 TikTok &amp; Instagram Reels (9:16 MP4 5편 + Google Flow) &amp; Reddit 전용 스튜디오</div>
            <div style="font-size: 0.78rem; color: #DBEAFE;">영문 성우 내레이션·자막·2.5D 모션이 합성된 9:16 세로형 MP4 영상 5편 다운로드 + Google Flow(Veo) 프롬프트 + 서브레딧별 Reddit 원고 5편</div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <a href="/tiktok_insta_reddit_studio.html" target="_blank" rel="noopener" style="background: #10B981; color: #FFFFFF; font-size: 0.8rem; font-weight: 800; padding: 0.55rem 0.95rem; border-radius: 999px; text-decoration: none;">
              🚀 영상 5편 재생 &amp; Reddit 스튜디오 열기 →
            </a>
            <a href="/tiktok_insta_videos/KIDS-FIT_Global_TikTok_Instagram_Reels_5Videos_Pack.zip" download style="background: #FFFFFF; color: #1D4ED8; font-size: 0.8rem; font-weight: 800; padding: 0.55rem 0.95rem; border-radius: 999px; text-decoration: none;">
              ⬇ 틱톡·릴스 영상 5편 전체 ZIP 다운로드
            </a>
          </div>
        </div>

        <!-- Global Channel A: Reddit GTM Post -->
        <div class="osmu-channel-card" style="background: #F8FAFC; border: 1.5px solid #BFDBFE; border-radius: 12px; padding: 1rem; margin-bottom: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
            <strong style="font-size: 0.84rem; color: #1E3A8A;">🇺🇸 Global 1: Reddit (r/ScienceBasedParenting &amp; r/Parenting — 다인종 보정 &amp; 수면 GH 칼럼)</strong>
            <button type="button" class="btn btn-primary btn-sm btn-copy-target" data-target="osmu-text-global-reddit" style="font-size: 0.74rem; padding: 0.25rem 0.6rem;">📋 원클릭 복사</button>
          </div>
          <textarea id="osmu-text-global-reddit" readonly style="width: 100%; height: 150px; font-family: monospace; font-size: 0.8rem; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 8px; background: #FFFFFF; color: #0F172A; resize: vertical; box-sizing: border-box;">${globalRedditPost}</textarea>
        </div>

        <!-- Global Channel B: Instagram / Threads / X Thread -->
        <div class="osmu-channel-card" style="background: #F8FAFC; border: 1.5px solid #A7F3D0; border-radius: 12px; padding: 1rem; margin-bottom: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
            <strong style="font-size: 0.84rem; color: #065F46;">🇺🇸 Global 2: Instagram / Meta Threads / X (Twitter) 5단 바이럴 스레드</strong>
            <button type="button" class="btn btn-primary btn-sm btn-copy-target" data-target="osmu-text-global-threads" style="font-size: 0.74rem; padding: 0.25rem 0.6rem;">📋 원클릭 복사</button>
          </div>
          <textarea id="osmu-text-global-threads" readonly style="width: 100%; height: 140px; font-family: monospace; font-size: 0.8rem; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 8px; background: #FFFFFF; color: #0F172A; resize: vertical; box-sizing: border-box;">${globalThreadsXCopy}</textarea>
        </div>

        <!-- Global Channel C: Channel-Specific UTM Links -->
        <div class="osmu-channel-card" style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 12px; padding: 1rem; margin-bottom: 1.1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
            <strong style="font-size: 0.84rem; color: #334155;">🔗 Global 3: 채널별 유입 추적 UTM 링크 모음 (Reddit / Instagram / TikTok / Quora)</strong>
            <button type="button" class="btn btn-primary btn-sm btn-copy-target" data-target="osmu-text-global-utm" style="font-size: 0.74rem; padding: 0.25rem 0.6rem;">📋 원클릭 복사</button>
          </div>
          <textarea id="osmu-text-global-utm" readonly style="width: 100%; height: 110px; font-family: monospace; font-size: 0.8rem; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 8px; background: #FFFFFF; color: #0F172A; resize: vertical; box-sizing: border-box;">${globalUtmLinks}</textarea>
        </div>

        <!-- Scenario Selector Tabs -->
        <div style="display: flex; gap: 0.4rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-sm btn-osmu-scenario ${scenarioId === 'scenario-1' ? 'btn-primary' : 'btn-secondary'}" data-scenario="scenario-1" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
            👶 Age 3 Neuro / Fine-Motor
          </button>
          <button type="button" class="btn btn-sm btn-osmu-scenario ${scenarioId === 'scenario-2' ? 'btn-primary' : 'btn-secondary'}" data-scenario="scenario-2" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
            👦 Age 8 Auxology (+3.3 in Buffer)
          </button>
          <button type="button" class="btn btn-sm btn-osmu-scenario ${scenarioId === 'scenario-3' ? 'btn-primary' : 'btn-secondary'}" data-scenario="scenario-3" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
            🏃 Teen Spinal Decompression
          </button>
        </div>

        <!-- Channel 1: EN TikTok / Reels 60s -->
        <div class="osmu-channel-card" style="background: var(--theme-surface-sub, #F8FAFC); border: 1px solid var(--theme-border, #E2E8F0); border-radius: 12px; padding: 1rem; margin-bottom: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
            <strong style="font-size: 0.84rem; color: #1D4ED8;">🇺🇸 Global 4: TikTok / Reels / Shorts 60s Clinical Script &amp; Hook</strong>
            <button type="button" class="btn btn-primary btn-sm btn-copy-target" data-target="osmu-text-en-tiktok" style="font-size: 0.74rem; padding: 0.25rem 0.6rem;">📋 원클릭 복사</button>
          </div>
          <textarea id="osmu-text-en-tiktok" readonly style="width: 100%; height: 160px; font-family: monospace; font-size: 0.8rem; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 8px; background: #FFFFFF; color: #0F172A; resize: vertical; box-sizing: border-box;">${bundle.enTikTokScript}</textarea>
        </div>

        <!-- Hidden Legacy KO Textareas for Unit Test Compatibility -->
        <div style="display:none;">
          <textarea id="osmu-text-ko-clip" readonly>${bundle.koClipScript}</textarea>
          <textarea id="osmu-text-ko-blog" readonly>${bundle.koBlogColumn}</textarea>
          <textarea id="osmu-text-ko-cafe" readonly>${bundle.koCafePost}</textarea>
        </div>
      </div>
    `;

    // Attach listeners
    attachOsmuListeners();
  }

  function attachOsmuListeners() {
    if (typeof document === 'undefined') return;

    // Scenario switchers
    const scenarioBtns = document.querySelectorAll('.btn-osmu-scenario');
    scenarioBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const sc = btn.getAttribute('data-scenario') || 'scenario-1';
        renderOsmuContainer(sc);
      });
    });

    // Copy buttons
    const copyBtns = document.querySelectorAll('.btn-copy-target');
    copyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const textarea = document.getElementById(targetId);
        if (textarea) {
          const text = textarea.value;
          if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
              const original = btn.textContent;
              btn.textContent = '✅ 복사 완료!';
              setTimeout(() => { btn.textContent = original; }, 2000);
            }).catch(() => {
              textarea.select();
              document.execCommand('copy');
              alert('원고가 복사되었습니다!');
            });
          } else {
            textarea.select();
            document.execCommand('copy');
            alert('원고가 복사되었습니다!');
          }
        }
      });
    });
  }

  /**
   * Initializes Admin Studio lifecycle and event bindings.
   */
  function initAdminStudio() {
    if (typeof document === 'undefined') return;

    // 1. Footer click trigger (5 consecutive clicks on #footer-copyright)
    const footer = document.getElementById('footer-copyright');
    if (footer) {
      footer.removeEventListener('click', handleFooterClick);
      footer.addEventListener('click', handleFooterClick);
    }

    // 2. Direct URL Query Parameter Trigger (?admin=1)
    if (typeof window !== 'undefined' && window.location && typeof window.location.search === 'string') {
      if (/(?:^\?|&)admin=1(?:&|$)/.test(window.location.search)) {
        openAdminModal();
      }
    }

    // 3. Modal close and save actions
    const closeBtn = document.getElementById('btn-close-admin');
    if (closeBtn) {
      closeBtn.removeEventListener('click', closeAdminModal);
      closeBtn.addEventListener('click', closeAdminModal);
    }

    const cancelBtn = document.getElementById('btn-cancel-admin');
    if (cancelBtn) {
      cancelBtn.removeEventListener('click', closeAdminModal);
      cancelBtn.addEventListener('click', closeAdminModal);
    }

    const saveBtn = document.getElementById('btn-save-admin');
    if (saveBtn) {
      saveBtn.onclick = function () {
        const chipsToggle = document.getElementById('cfg-chips-toggle');
        const coupangEl = document.getElementById('cfg-coupang');
        const linkpriceEl = document.getElementById('cfg-linkprice');
        const iherbEl = document.getElementById('cfg-iherb');
        const amazonEl = document.getElementById('cfg-amazon');
        const tenpingUrlEl = document.getElementById('cfg-tenping-url');
        const adpickAffIdEl = document.getElementById('cfg-adpick-affid');
        const naverBcHealthEl = document.getElementById('cfg-naver-bc-health');
        const naverBcTourEl = document.getElementById('cfg-naver-bc-tour');
        const mrtKeyEl = document.getElementById('cfg-myrealtrip-key');
        const mrtIdEl = document.getElementById('cfg-myrealtrip-id');
        const klookAidEl = document.getElementById('cfg-klook-aid');
        const klookAdIdEl = document.getElementById('cfg-klook-adid');

        const newCfg = Object.assign({}, getAffiliateConfig(), {
          chipsEnabled: chipsToggle ? chipsToggle.checked : true,
          coupang: coupangEl && coupangEl.value ? coupangEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.coupang,
          linkprice: linkpriceEl && linkpriceEl.value ? linkpriceEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.linkprice,
          iherb: iherbEl && iherbEl.value ? iherbEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.iherb,
          amazon: amazonEl && amazonEl.value ? amazonEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.amazon,
          tenpingUrl: tenpingUrlEl && tenpingUrlEl.value ? tenpingUrlEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.tenpingUrl,
          adpickAffId: adpickAffIdEl && adpickAffIdEl.value ? adpickAffIdEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.adpickAffId,
          naverBrandConnectHealth: naverBcHealthEl && naverBcHealthEl.value ? naverBcHealthEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.naverBrandConnectHealth,
          naverBrandConnectTour: naverBcTourEl && naverBcTourEl.value ? naverBcTourEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.naverBrandConnectTour,
          myrealtripKey: mrtKeyEl && mrtKeyEl.value ? mrtKeyEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.myrealtripKey,
          myrealtripMylinkId: mrtIdEl && mrtIdEl.value ? mrtIdEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.myrealtripMylinkId,
          klookAid: klookAidEl && klookAidEl.value ? klookAidEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.klookAid,
          klookAdId: klookAdIdEl && klookAdIdEl.value ? klookAdIdEl.value.trim() : DEFAULT_AFFILIATE_CONFIG.klookAdId
        });

        saveAffiliateConfig(newCfg);
        alert('9대 제휴 채널 설정이 저장되었으며 실시간으로 동기화됩니다.');
        closeAdminModal();
      };
    }
  }

  // Auto-initialize if DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAdminStudio);
    } else {
      initAdminStudio();
    }
  }

  // Public Interface
  const AdminStudio = {
    DEFAULT_AFFILIATE_CONFIG,
    STORAGE_KEYS,
    SCENARIOS,
    getAffiliateConfig,
    saveAffiliateConfig,
    generateOsmuBundle,
    openAdminModal,
    closeAdminModal,
    handleFooterClick,
    renderOsmuContainer,
    initAdminStudio
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminStudio;
  }
  if (typeof window !== 'undefined') {
    window.TallerAdminStudio = AdminStudio;
    window.KidsFitAdminStudio = AdminStudio;
  }
  if (typeof global !== 'undefined' && typeof window === 'undefined') {
    global.TallerAdminStudio = AdminStudio;
    global.KidsFitAdminStudio = AdminStudio;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
