/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * Bilingual (EN ↔ KO) Internationalization & Unit Conversion Engine (src/js/i18n.js)
 * 
 * Features:
 * - Dual Standard & Language Support:
 *   - Global Mode (EN): US CDC 2000 & WHO Growth Standards, Imperial units (ft/in, lbs)
 *   - Korean Mode (KO): KDCA 2017 Growth Standards, Metric units (cm, kg)
 * - Bidirectional precision unit conversions:
 *   - cm <-> ft/in
 *   - kg <-> lbs
 * - Reactive dictionary lookup & DOM synchronization
 * - localStorage persistence ('taller_lang', 'taller_unit')
 */

(function (global) {
  'use strict';

  // 1. Translation Dictionary
  const DICTIONARY = {
    ko: {
      // Header & Brand
      'brand.title': 'KIDS-FIT',
      'brand.tagline': '키 · 육체적 · 정신적 성장 & 맞춤 학습 가이드 플랫폼',
      'trust.badge': 'Built on Official Standards: 질병관리청 소아청소년 성장도표 & 보건복지부 영유아 발달선별검사(K-DST) 기준 적용',
      'nav.auxology': '신체 성장 & 골연령 궤적',
      'nav.endocrinology': '호르몬·수면 & 임상 영양',
      'nav.biomechanics': '척추 감압 & 생체역학',
      'nav.neuro': '뇌인지 & 탐구 로드맵',
      'nav.tracker': '90일 트래커 & A4 리포트',
      'theme.dark': '🌙 Dark Mode',
      'theme.light': '☀️ Light Mode',
      'lang.toggle': '🇺🇸 EN',

      // Hero (Ultra-Concise & Unified — No Parent/Student Split)
      'hero.badge': '🌱 신체 성장(키·골연령) × 두뇌·학습(문해력·수리·집중력) 논문 2,887편 기반 진단',
      'hero.headline': '<span class="hero-single-line">우리 아이 키 성장과 두뇌 학습,</span><br><span class="hero-headline-highlight hero-single-line" style="background: linear-gradient(90deg, #38BDF8 0%, #34D399 55%, #C084FC 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700;">1분 설문으로 각각 맞춤 보고서를 받아보세요</span>',
      'hero.subtitle': '원하는 진단을 선택해 설문을 마치면 해당 영역의 전문 분석 보고서를 바로 발행합니다.',
      'nav.forWhom': '신체 성장 보고서',
      'nav.services': '두뇌·학습 보고서',
      'hero.cta.parent': '📏 신체 성장 진단 시작 →',
      'hero.cta.learning': '🧠 두뇌·학습 진단 시작 →',
      'hero.cta.youth': '⚡ 1분 맞춤 진단 시작 →',

      // For Whom Section (Unified without Parent/Student split)
      'forWhom.kicker': '2 DEDICATED REPORTS',
      'forWhom.title': '원하는 전용 보고서를 선택하세요',
      'forWhom.sub': '신체 성장 보고서와 두뇌·학습 보고서가 전용 설문과 함께 각각 독립 발행됩니다.',
      'forWhom.parent.badge': 'REPORT 01 · 신체 성장 전용',
      'forWhom.parent.title': '📏 신체 성장 마스터 분석 보고서',
      'forWhom.parent.b1': '• KDCA 키·체중 백분위 & 부모 유전키(MPH) · 3단 예측키',
      'forWhom.parent.b2': '• 성장호르몬 서파수면 골든타임 & 체중 비례 맞춤 영양',
      'forWhom.parent.b3': '• 거북목·척추 디스크 감압(+1.8cm) & 성장판 자극 운동',
      'forWhom.parent.btn': '📏 신체 성장 진단 시작 →',
      'forWhom.student.badge': 'REPORT 02 · 두뇌·학습 전용',
      'forWhom.student.title': '🧠 두뇌·학습 마스터 분석 보고서',
      'forWhom.student.b1': '• 5각 학습역량지수(LQ) & 6개월 집중력·기억력 궤적 예측',
      'forWhom.student.b2': '• 문해력·수리추론·백지복습·도파민 6대 학습 병목 처방',
      'forWhom.student.b3': '• 해마→피질 수면 기억공고화 루틴 & 맞춤 교재·교구·탐구',
      'forWhom.student.btn': '🧠 두뇌·학습 진단 시작 →',

      // Services Section
      'services.kicker': 'CORE DIAGNOSTIC SYSTEM',
      'services.title': '1분 진단으로 받아보는 핵심 분석',
      'services.sub': '아이의 신체 성장과 두뇌·학습이 균형 있게 자라도록 핵심만 담았습니다.',
      'services.s1.title': '유전키 · 방치키 · 6개월 관리키 비교',
      'services.s1.desc': '숨은 키 손실을 막는 수면·영양·척추 감압 루틴을 안내합니다.',
      'services.s2.title': '5대 학습지수(LQ) & 만 N세 → N+3세 로드맵',
      'services.s2.desc': '문해력·수리추론·집중력 병목 진단과 자기주도 공부법을 제시합니다.',
      'services.s3.title': '신체 성장 영양·운동기구 & 학습 교재·교구·탐구',
      'services.s3.desc': '성장용 영양제·철봉과 학습용 독서대·워크북·박물관 투어를 분리 매칭합니다.',
      'services.basis': '대한소아내분비학회지 · 대한소아과학회지 · 질병관리청(KDCA) · 논문 2,887편 기반',

      // Studio & Quiz Extra Keys
      'studio.bar.title': '✦ 우리 아이 1:1 성장·학습 진단',
      'studio.bar.back': '← 첫 화면으로',
      'presets.bar.label': '⚡ 1초 연령 예시:',
      'preset.chip.1': '👶 만 3세',
      'preset.chip.2': '🧒 만 7세',
      'preset.chip.3': '👦 만 10세',
      'preset.chip.4': '⚡ 만 13세',
      'preset.chip.5': '🌟 만 16세',
      'quiz.edition.label': '📘 맞춤 진단 유형',
      'quiz.edition.child': '👶 1:1 맞춤 성장·학습 정밀 진단',
      'quiz.edition.self': '🙋 1:1 맞춤 성장·학습 정밀 진단',
      'quiz.dob.hint1': '✨ 같은 해에 태어나도 1월생과 12월생은 평균 키가 최대 4.8cm 차이 납니다 (생년월일 일수 정밀 보정 완료)',
      'quiz.mph.label': '실시간 부모 유전 표적키 (Tanner MPH)',
      'quiz.region.label': '거주 지역 (지역 환경 & 탐구 코스 연동)',
      'quiz.autostage.badge': '✓ 질병관리청 성장도표 기반 【성장단계 & 골연령 진행도】 자동 설정 완료',
      'quiz.autostage.manualLabel': '자동 매핑된 성장 단계 확인 (필요 시 터치하여 수동 변경 가능)',
      'quiz.habits.label': '키 성장을 방해하는 생활 습관 체크 (복수 선택)',
      'quiz.habits.hint': '해당하는 습관을 고쳐주면 숨은 키를 최대 5cm 더 찾을 수 있습니다.',
      'quiz.cog.label': '키워주고 싶은 두뇌·학습 영역 (복수 선택)',
      'quiz.cog.hint': '아이 나이에 딱 맞는 교구와 도서를 추천해 드립니다.',
      'quiz.submit.btn': '✦ 선택한 설문 항목 기반 맞춤 보고서 즉시 보기 →',
      'loader.desc': '생년월일 일수 보정 데이터와 학술 논문 2,887편 코퍼스를 대조하여 맞춤 가이드북을 편찬하고 있습니다.',
      'results.tab1.title': '신체 성장 백분위 & 골연령 예측 궤적 (Auxology)',
      'results.tab1.desc': '질병관리청(KDCA) 성장도표 기반 Z-Score, 연간 성장속도(cm/yr), 부모 유전 표적키(MPH ±8.5cm) 및 3단 성인 예측키 시뮬레이션입니다.',
      'results.tab2.title': '24시간 호르몬 궤적 & 임상 영양 생체이용률',
      'results.tab2.desc': '취침 시각 및 야식 시간에 따른 서파수면(SWS) 성장호르몬 분비 억제율(-52% max)과 체중 비례 영양소 흡수율 게이지입니다.',
      'results.tab3.title': '척추 감압 & 성장판 미세자극 스튜디오',
      'results.tab3.desc': '추간판 수분 복원(+1.8cm) 및 볼프의 법칙(Wolff\'s Law)에 기반한 3대 임상 운동 루틴과 실시간 카운트다운 스톱워치입니다.',
      'results.tab4.title': '연령별 뇌인지 발달 & 주말 하브루타 탐구 로드맵',
      'results.tab4.desc': '5각 뇌인지 밸런스 레이더 SVG 차트, 연령대별 대뇌 피질 재조직화 가이드 및 주말 탐구 3단계 하브루타 질문 세트입니다.',
      'results.tab5.title': '90일 성장·루틴 트래커 & 대학병원 스타일 A4 정밀 리포트',
      'results.tab5.desc': '신장·체중 연속 기록 트래커와 클릭 한 번으로 인쇄/PDF 저장 가능한 2페이지 정밀 임상 결과지입니다.',
      'footer.disclaimer': '본 서비스는 질병관리청(KDCA 2017) 소아청소년 성장도표, 보건복지부 한국 영유아 발달선별검사(K-DST), US CDC 2000 및 WHO Growth Standards 학술 지표를 기반으로 산출된 맞춤형 가이드북이며, 전문의의 진료를 대신하지 않습니다. 본 서비스의 추천 상품 링크는 쿠팡 파트너스 및 제휴 마케팅 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.',

      // Presets
      'presets.badge': '연령대별 빠른 데모',
      'presets.title': '임상 케이스 1초 시뮬레이션 프리셋',
      'presets.hint': '연령별 전형적인 성장·발달 임상 데이터를 즉시 로드하여 분석을 확인합니다.',
      'preset.1.badge': '영유아기 3세',
      'preset.1.title': '기초 성장기 & 소근육 협응',
      'preset.1.desc': '성장판 개방률 90%+, 감각·예술 표현 골든타임',
      'preset.2.badge': '아동기 7세',
      'preset.2.title': '수리·공간 논리 & 바른 자세 정렬',
      'preset.2.desc': '안정적 성장속도 유지 및 척추 정렬 관리',
      'preset.3.badge': '사춘기 진입 10세',
      'preset.3.title': '사춘기 초기 수면·호르몬 최적화',
      'preset.3.desc': '성장호르몬 분비 극대화 및 심야 혈당 스파이크 방어',
      'preset.4.badge': '급성장기 13세',
      'preset.4.title': 'PHV 급성장 피크 집중 처방',
      'preset.4.desc': '연 8~10cm 폭풍 성장 골든타임 & 전두엽 실행기능 몰입',
      'preset.5.badge': '후기 청소년 16세',
      'preset.5.title': '체형 완성기 척추 디스크 복원',
      'preset.5.desc': '성장판 폐쇄 전 척추 감압으로 숨은 키 1.5~2.5cm 복원',

      // Wizard Steps
      'wizard.step': '단계',
      'wizard.step1.title': '우리 아이 기본 정보 (성별 · 생년월일)',
      'wizard.step1.sub': '생년월일 일수까지 계산해 또래 평균키와 비교해 드립니다.',
      'wizard.step2.title': '현재 키 · 몸무게 · 최근 6개월 성장폭 입력',
      'wizard.step2.sub': '아이의 현재 체격과 연간 성장속도(cm/년)를 정밀하게 계산합니다.',
      'wizard.step3.title': '부모님 신장 입력 & 거주 지역 선택',
      'wizard.step3.sub': '부모 유전 표적키(MPH)와 우리 동네 주말 탐구·여행 코스를 연결합니다.',
      'wizard.step4.title': '생년월일 맞춤 성장단계 확인 & 수면·식습관 체크',
      'wizard.step4.sub': '우리 아이에게 해당하는 수면·식습관 모습을 편하게 골라주세요.',
      'wizard.step5.title': '키 성장 방해 습관 & 평소 자세·운동량 체크',
      'wizard.step5.sub': '해당하는 습관을 고쳐주면 숨은 키를 최대 5cm 더 찾을 수 있습니다.',
      'wizard.step6.title': '두뇌·학습 영역 & 우리 아이 기질·고민 메모',
      'wizard.step6.sub': '아이 나이와 성향에 딱 맞는 영양제·교구·도서·여행 코스를 추천해 드립니다.',

      // Form Labels
      'label.gender': '아이 성별',
      'label.gender.boy': '남아 (Boy)',
      'label.gender.girl': '여아 (Girl)',
      'label.age': '아이 생년월일 (정밀 개월·일수 산출)',
      'label.height': '현재 신장',
      'label.weight': '현재 체중',
      'label.recentGrowth': '최근 6개월 성장폭',
      'label.fatherHeight': '아버지 신장 (유전 표적키용)',
      'label.motherHeight': '어머니 신장 (유전 표적키용)',
      'label.prev': '← 이전 단계',
      'label.next': '다음 단계 →',
      'label.scan': '🔬 3초 바이오 스캔 분석 시작',

      // Tanner Phases
      'phase.1.title': 'Phase 1. 기초 성장기',
      'phase.1.desc': '성장판 개방률 90%+, 연 5~6cm 꾸준한 성장 구간',
      'phase.2.title': 'Phase 2. 급성장 피크기 (PHV)',
      'phase.2.desc': '성장호르몬 및 IGF-1 분비 폭발, 골든타임 최대 가속 구간',
      'phase.3.title': 'Phase 3. 감속·성숙기',
      'phase.3.desc': '변성기·초경 이후, 성장판 닫히기 전 마지막 잔여 잠재력 4~7cm 구간',
      'phase.4.title': 'Phase 4. 체형·자세 완성기',
      'phase.4.desc': '척추 디스크 감압 및 거북목·골반 교정으로 숨은 키 1.5~2.5cm 복원 구간',

      // Habits
      'habit.late_sleep': '밤 10시 반 이후 늦은 취침',
      'habit.night_carbs': '자기 전 야식·단 간식 섭취',
      'habit.poor_posture': '스마트폰·책상 거북목 자세',
      'habit.picky_eater': '고기·채소 편식 & 영양 부족',
      'habit.sedentary': '하루 30분 미만 운동 부족',

      // Cognitive Axes
      'cog.math_logic': '수리·공간·도형 사고력',
      'cog.language_reading': '어휘·문해력·독서 습관',
      'cog.science_nature': '과학·자연·원리 탐구력',
      'cog.sensory_arts': '감각·미술·창의 표현력',
      'cog.executive_focus': '전두엽 집중력·자기조절',

      // Loader
      'loader.step1': '질병관리청 성장도표 & 발달 파라미터 매트릭스 대조 중...',
      'loader.step2': 'Z-Score 표준화 및 3단 성인 예측키 궤적 모델링 연산 중...',
      'loader.step3': '호르몬 분비 억제율 및 5각 신경인지 밸런스 프로토콜 생성 완료.',
      'loader.skip': '⚡ 기다리지 않고 분석 결과 즉시 보기 ↗',

      // Results
      'rx.retest': '🔄 정보 다시 입력하기',
      'rx.standard.kdca': '질병관리청(KDCA 2017) 소아청소년 성장도표 & K-DST 발달기준 정밀 분석 완료',
      'rx.standard.cdc': 'US CDC 2000 & WHO Clinical Growth Standards Applied',

      // Deep Child Trait Questions (100% synced with index.html checkbox values)
      'quiz.trait.sleep.label': '🌙 평소 수면 & 아침 기상 습관 (복수 선택)',
      'quiz.trait.sleep.hint': '우리 아이에게 해당하는 모습을 편하게 모두 골라주세요.',
      'quiz.trait.sleep.opt1': '밤 9시 반 전 일찍 푹 잘 자요',
      'quiz.trait.sleep.opt2': '밤 10시 반 이후 늦게 자요',
      'quiz.trait.sleep.opt3': '자주 뒤척이고 입 벌려 자요',
      'quiz.trait.sleep.opt4': '자기 직전 우유·간식을 찾아요',
      'quiz.trait.sleep.opt5': '아침에 깨워도 일어나기 힘들어해요',
      'quiz.trait.sleep.opt6': '잘 때 머리·목에 땀이 많아요',
      'quiz.trait.sleep.opt7': '작은 소리에 깨고 잠꼬대해요',
      'quiz.trait.sleep.opt8': '주말에 몰아서 늦잠을 자요',
      'quiz.trait.diet.label': '🍽️ 평소 식사량 & 소화 체질 (복수 선택)',
      'quiz.trait.diet.hint': '입이 짧은 아이도 맛있게 잘 먹는 맞춤 성분을 찾아드립니다.',
      'quiz.trait.diet.opt1': '입이 짧고 밥을 조금만 먹어요',
      'quiz.trait.diet.opt2': '고기·채소는 골라내고 안 먹어요',
      'quiz.trait.diet.opt3': '우유 마시면 배앓이·설사를 해요',
      'quiz.trait.diet.opt4': '가리는 것 없이 골고루 잘 먹어요',
      'quiz.trait.diet.opt5': '변비가 있거나 배변이 힘들어요',
      'quiz.trait.diet.opt6': '밥보다 빵·면·단 간식을 찾아요',
      'quiz.trait.diet.opt7': '밥을 오래 물거나 자주 체해요',
      'quiz.trait.diet.opt8': '물을 하루 3컵도 안 마셔요',
      'quiz.trait.posture.label': '🦴 평소 앉는 자세 & 성장통 체크 (복수 선택)',
      'quiz.trait.posture.opt1': '책상·영상 볼 때 거북목·굽은 등',
      'quiz.trait.posture.opt2': '다리 꼬기·짝다리·W자 앉기',
      'quiz.trait.posture.opt3': '밤마다 무릎·종아리 성장통 호소',
      'quiz.trait.posture.opt4': '허리와 목을 곧게 펴고 바른 자세',
      'quiz.trait.posture.opt5': '턱 괴기·한쪽으로 기대어 앉기',
      'quiz.trait.posture.opt6': '조금만 걸어도 발 피로·평발',
      'quiz.trait.exercise.label': '🏃 일주일 동안 땀 흘리며 뛰어노는 횟수',
      'quiz.trait.exercise.opt1': '주 1회 이하 · 집에서 정적 활동 위주',
      'quiz.trait.exercise.opt2': '주 2~3회 체육·태권도·줄넘기 수준',
      'quiz.trait.exercise.opt3': '주 4회 이상 매일 땀 흘리는 활동형',
      'quiz.trait.temp.label': '🧩 우리 아이 평소 기질 & 성향 (복수 선택)',
      'quiz.trait.temp.opt1': '몸으로 직접 부딪히는 활동·탐구형',
      'quiz.trait.temp.opt2': '손끝으로 조립·만들기 좋아하는 몰입형',
      'quiz.trait.temp.opt3': '"왜?" 질문과 대화를 좋아하는 사고형',
      'quiz.trait.temp.opt4': '신중하게 관찰하고 시작하는 섬세형',
      'quiz.trait.temp.opt5': '음악·역할극·상상 좋아하는 감성형',
      'quiz.trait.temp.opt6': '칭찬·미션 스티커에 불타는 성취형',
      'quiz.trait.focus.label': '⏱️ 한 가지 놀이나 공부에 집중하는 시간',
      'quiz.trait.focus.opt1': '10분 미만 · 짧은 성취감 놀이가 필요해요',
      'quiz.trait.focus.opt2': '15~20분 집중 · 단계별 미션이 잘 맞아요',
      'quiz.trait.focus.opt3': '30분 이상 · 깊은 독서·프로젝트가 맞아요',
      'quiz.trait.learning.label': '📚 현재 가장 고민되는 학습·공부 병목 (복수 선택 · 1:1 학습 상담 연동)',
      'quiz.trait.learning.hint': '선택하신 학습 고민의 뇌과학적 원인을 진단하고 딱 맞는 공부법·도서·워크북을 큐레이팅해 드립니다.',
      'quiz.trait.learning.opt1': '긴 글·문장제 문제를 읽고 이해하는 문해력이 부족해요',
      'quiz.trait.learning.opt2': '단순 연산은 해도 도형·응용·사고력 수학에서 막혀해요',
      'quiz.trait.learning.opt3': '학원·설명을 들어도 금방 잊어버리고 자기주도 복습이 안 돼요',
      'quiz.trait.learning.opt4': '스마트폰·유튜브 자극에 익숙해 책·공부에 흥미가 없어요',
      'quiz.trait.learning.opt5': '책상에 15~20분 이상 바른 자세로 앉아 있기 힘들고 산만해요',
      'quiz.trait.learning.opt6': '어휘력이 부족하거나 생각을 말·서술형 글로 표현하기 어려워해요',
      'quiz.trait.learning.opt7': '아는 문제도 문제집·시험에서 덤벙대며 실수하거나 긴장해서 틀려요',
      'quiz.trait.learning.opt8': '스스로 분량을 정해 매일 꾸준히 실천하는 자기주도 습관이 부족해요',
      'quiz.trait.studystyle.label': '🎯 가장 잘 맞는 학습 흡수 스타일',
      'quiz.trait.studystyle.opt1': '🗣️ 질문·대화형 — 부모님과 문답하고 말로 설명할 때 가장 잘 이해해요 (하브루타형)',
      'quiz.trait.studystyle.opt2': '🧩 교구·조작형 — 손으로 블록·입체도형·실험키트를 직접 만질 때 눈이 반짝여요 (체험형)',
      'quiz.trait.studystyle.opt3': '🎨 비주얼·마인드맵형 — 그림·도표·만화·인포그래픽으로 정리할 때 오래 기억해요 (시각형)',
      'quiz.trait.studystyle.opt4': '🏆 일일 미션·성취형 — 하루 2쪽 워크북 완수와 칭찬 스티커가 있을 때 집중해요 (목표형)',
      'quiz.freenote.label': '💬 추가 특징 메모',
      'quiz.freenote.hint': '선택하신 객관식 설문 항목을 바탕으로 1:1 맞춤 처방을 담아드립니다.',
      'quiz.freenote.placeholder': '예: 밤에 늦게 자고 입이 짧아서 키 성장이 걱정돼요.'
    },

    en: {
      // Header & Brand
      'brand.title': 'KIDS-FIT',
      'brand.tagline': 'Height · Physical · Mental Growth & Personalized Learning Platform',
      'trust.badge': 'Built on Official Standards: US CDC 2000, WHO & KDCA Pediatric Auxology',
      'nav.auxology': 'Physical Growth & Auxology',
      'nav.endocrinology': 'Endocrinology & Bio-Nutrition',
      'nav.biomechanics': 'Biomechanics & Posture',
      'nav.neuro': 'Neuro-Cognitive Matrix',
      'nav.tracker': '90-Day Tracker & A4 PDF',
      'theme.dark': '🌙 Dark Mode',
      'theme.light': '☀️ Light Mode',
      'lang.toggle': '🇰🇷 한국어',

      // Hero
      'hero.badge': '🌱 Powered by KDCA Growth Standards & 2,887 Clinical Papers · K-GROWTH AI™',
      'hero.headline': 'How Tall Will Your Child Grow?\n<span class="hero-headline-highlight" style="background: linear-gradient(90deg, #38BDF8 0%, #34D399 60%, #A7F3D0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Separate Physical Growth Report & Brain Learning Report in 1 Min</span>',
      'hero.subtitle': '1-Min Input → Independent [Physical Growth Report] & [Brain Learning Report]',
      'nav.forWhom': 'Who It\'s For',
      'nav.services': 'Our Services',
      'hero.cta.parent': '📏 Start Physical Growth Report →',
      'hero.cta.learning': '🧠 Start Brain & Learning Report →',
      'hero.cta.youth': 'Students · Start Self Diagnosis →',

      // For Whom Section
      'forWhom.kicker': 'WHO IT\'S FOR',
      'forWhom.title': 'Who Needs This?',
      'forWhom.sub': 'Zero fluff. Only the exact growth and learning answers you need right now.',
      'forWhom.parent.badge': 'FOR PARENTS',
      'forWhom.parent.title': 'Child Height Growth & Age-Fit Learning',
      'forWhom.parent.b1': '• Curious about your child\'s final adult height',
      'forWhom.parent.b2': '• Want a clear 4-year brain & study roadmap',
      'forWhom.parent.b3': '• Need exact supplements, toys & books for their traits',
      'forWhom.parent.btn': 'Start Parent Diagnosis →',
      'forWhom.student.badge': 'FOR STUDENTS',
      'forWhom.student.title': 'Unlock +6.7cm Hidden Height & Deep Focus',
      'forWhom.student.b1': '• Want to know your max potential height before plates close',
      'forWhom.student.b2': '• Need a 10 PM sleep, posture & nutrition routine',
      'forWhom.student.b3': '• Want to cut screen time and focus deeper in less time',
      'forWhom.student.btn': 'Start Student Diagnosis →',

      // Services Section
      'services.kicker': '3 CORE REPORTS',
      'services.title': '3 Core Results in 1 Minute',
      'services.sub': 'Finish the quick survey to unlock your complete bespoke guidebook.',
      'services.s1.title': 'Genetic vs. Unmanaged vs. Managed Height',
      'services.s1.desc': 'Finds height loss bottlenecks and prescribes a daily sleep, diet & posture routine.',
      'services.s2.title': 'Age N → N+3 Brain & Study Milestones',
      'services.s2.desc': 'Auto-detects growth stage and maps out 4 years of brain & self-directed study focus.',
      'services.s3.title': 'Pinpoint Supplements · Toys · Books · Edu Travel',
      'services.s3.desc': 'Matches verified specific products directly to your child\'s appetite, sleep & temperament.',
      'services.basis': 'Clinical Basis: KDCA Growth Charts · US CDC 2000 · K-DST Milestones · 2,887-Paper DB',

      // Studio & Quiz Extra Keys
      'studio.bar.title': '✦ KIDS-FIT AI · 1:1 Personalized Growth & Learning Diagnosis',
      'studio.bar.back': '← Back to Overview',
      'presets.bar.label': '⚡ 1-Sec Demo Presets:',
      'preset.chip.1': '👶 Age 3',
      'preset.chip.2': '🧒 Age 7',
      'preset.chip.3': '👦 Age 10',
      'preset.chip.4': '⚡ Age 13',
      'preset.chip.5': '🌟 Age 16',
      'quiz.edition.label': '📘 Personalized Diagnosis Type',
      'quiz.edition.child': '👶 1:1 Personalized Growth & Learning Diagnosis',
      'quiz.edition.self': '🙋 1:1 Personalized Growth & Learning Diagnosis',
      'quiz.dob.hint1': '✨ Even in the same birth year, Jan vs. Dec births differ by up to 4.8 cm (AI day-level calibration active)',
      'quiz.mph.label': 'Real-Time Mid-Parental Target Height (Tanner MPH)',
      'quiz.region.label': 'Region (For Local Museum & Educational Travel Courses)',
      'quiz.autostage.badge': '🤖 K-GROWTH AI™ Auto-Detected Growth Stage & Bone Maturation!',
      'quiz.autostage.manualLabel': 'Auto-Selected Growth Stage (Click below only if you wish to override)',
      'quiz.habits.label': 'Sleep, Nutrition & Posture Inhibition Factors (Select all that apply)',
      'quiz.habits.hint': 'Selected factors are used to compute nocturnal GH suppression (-52% max) and height loss penalties.',
      'quiz.cog.label': 'Core Brain & Learning Focus Domains (Select all that apply)',
      'quiz.cog.hint': 'Generates age-specific neuroplasticity and inquiry learning protocols.',
      'quiz.submit.btn': '✦ Generate My Growth & Learning Guidebook →',
      'loader.desc': 'Cross-referencing day-calibrated birth data with 2,887 peer-reviewed studies to compile your guidebook.',
      'results.tab1.title': 'Physical Growth Percentile & Bone Age Trajectory (Auxology)',
      'results.tab1.desc': 'K-GROWTH AI™ Z-Score, annual growth velocity, Tanner Mid-Parental Height (MPH ±8.5 cm), and 3-tier adult height simulation.',
      'results.tab2.title': '24-Hour Hormone Curve & Clinical Bio-Nutrition',
      'results.tab2.desc': 'Slow-wave sleep (SWS) GH suppression simulation (-52% max) and weight-proportional nutrient bioavailability gauges.',
      'results.tab3.title': 'Spinal Decompression & Epiphyseal Biomechanics Studio',
      'results.tab3.desc': 'Intervertebral disc rehydration (+1.8 cm) and Wolff\'s Law mechanical loading routines with interactive countdown timers.',
      'results.tab4.title': 'Neuro-Cognitive Matrix & Weekend Havruta Inquiry Roadmap',
      'results.tab4.desc': '5-axis neuro-cognitive balance radar chart, age-specific cortical development guide, and 3-step inquiry dialogue prompts.',
      'results.tab5.title': '90-Day Growth Tracker & Hospital-Style A4 Clinical Report',
      'results.tab5.desc': 'Continuous height/weight streak tracker and 1-click printable 2-page A4 clinical report.',
      'footer.disclaimer': 'Powered by proprietary K-GROWTH AI™ algorithms and official US CDC 2000, WHO Growth Standards, KDCA 2017 Growth Charts, and K-DST developmental milestones (2,887 papers). This guidebook is for educational and wellness guidance and does not replace medical diagnosis. Product recommendation links on this service are part of Coupang Partners and affiliate marketing programs, through which we may receive a commission.',

      // Presets
      'presets.badge': 'Clinical Demo Presets',
      'presets.title': 'Instant 1-Second Pediatric Simulations',
      'presets.hint': 'Select an age profile to instantly simulate official growth trajectories and intervention protocols.',
      'preset.1.badge': 'Toddler 3 Yrs',
      'preset.1.title': 'Foundation Auxology & Motor Skills',
      'preset.1.desc': 'Epiphyseal plate 90%+ open; sensory-motor integration window',
      'preset.2.badge': 'Childhood 7 Yrs',
      'preset.2.title': 'Spatial Logic & Postural Alignment',
      'preset.2.desc': 'Steady annual velocity monitoring and thoracic posture alignment',
      'preset.3.badge': 'Puberty 10 Yrs',
      'preset.3.title': 'Early Pubertal Hormone Optimization',
      'preset.3.desc': 'Deep-sleep GH maximization & prevention of late-night glycemic spikes',
      'preset.4.badge': 'Peak Spurt 13 Yrs',
      'preset.4.title': 'Peak Height Velocity (PHV) Intervention',
      'preset.4.desc': 'Critical 8~10 cm/yr growth spurt & executive cognitive focus',
      'preset.5.badge': 'Adolescent 16 Yrs',
      'preset.5.title': 'Spinal Disc Recovery & Alignment',
      'preset.5.desc': 'Decompression traction recovering +1.5~2.5 cm prior to plate closure',

      // Wizard Steps
      'wizard.step': 'Step',
      'wizard.step1.title': 'Child Basic Info (Sex · Date of Birth)',
      'wizard.step1.sub': 'Calculates exact days since birth for KDCA/CDC LMS percentile comparison.',
      'wizard.step2.title': 'Current Height · Weight · 6-Month Growth Gain',
      'wizard.step2.sub': 'Evaluates current stature and annual growth velocity (cm/yr).',
      'wizard.step3.title': 'Parents\' Height & Region Selection',
      'wizard.step3.sub': 'Computes Tanner Mid-Parental Height (MPH) and local educational courses.',
      'wizard.step4.title': 'Auto-Detected Growth Stage & Sleep/Diet Patterns',
      'wizard.step4.sub': 'Select all sleep and eating patterns that apply to your child.',
      'wizard.step5.title': 'Growth Inhibition Habits & Posture/Activity Check',
      'wizard.step5.sub': 'Correcting these habits can unlock up to +5cm of hidden growth potential.',
      'wizard.step6.title': 'Brain & Learning Focus + Temperament & Custom Note',
      'wizard.step6.sub': 'Matches tailored supplements, play tools, books, and educational travel courses.',

      // Form Labels
      'label.gender': 'Biological Sex',
      'label.gender.boy': 'Boy',
      'label.gender.girl': 'Girl',
      'label.age': 'Date of Birth (Exact Month & Day Calibration)',
      'label.height': 'Current Height',
      'label.weight': 'Current Weight',
      'label.recentGrowth': 'Recent 6-Month Height Gain',
      'label.fatherHeight': 'Father\'s Height',
      'label.motherHeight': 'Mother\'s Height',
      'label.prev': '← Previous',
      'label.next': 'Next Step →',
      'label.scan': '🔬 Run 3-Second Clinical Scan',

      // Tanner Phases
      'phase.1.title': 'Phase 1. Foundation Growth',
      'phase.1.desc': 'Open growth plate ratio 90%+, steady 5~6 cm/yr velocity',
      'phase.2.title': 'Phase 2. Peak Height Velocity (PHV)',
      'phase.2.desc': 'Pulsatile GH & IGF-1 surge; maximum velocity golden window',
      'phase.3.title': 'Phase 3. Deceleration & Maturation',
      'phase.3.desc': 'Final residual potential of 4~7 cm before epiphyseal fusion',
      'phase.4.title': 'Phase 4. Structural Postural Alignment',
      'phase.4.desc': 'Spinal disc decompression recovering +1.5~2.5 cm of hidden height',

      // Habits
      'habit.late_sleep': 'Delayed Bedtime (Sleep after 10:30 PM)',
      'habit.night_carbs': 'Pre-Sleep Snacks or Sugary Drinks',
      'habit.poor_posture': 'Tech-Neck & Slouched Desk Posture',
      'habit.picky_eater': 'Meat/Veggie Picky Eating & Nutrient Deficit',
      'habit.sedentary': 'Under 30 Mins/Day Active Exercise',

      // Cognitive Axes
      'cog.math_logic': 'Math, Spatial & Geometric Logic',
      'cog.language_reading': 'Vocabulary, Literacy & Reading',
      'cog.science_nature': 'Science, Nature & Principle Inquiry',
      'cog.sensory_arts': 'Sensory, Art & Creative Expression',
      'cog.executive_focus': 'Prefrontal Focus & Self-Regulation',

      // Loader
      'loader.step1': 'Loading K-GROWTH AI™ Parameter Matrices...',
      'loader.step2': 'Computing Standardized Z-Scores & 3-Tier Predicted Trajectories...',
      'loader.step3': 'Finalizing GH Suppression Ratio & 5-Axis Neuro-Cognitive Protocol!',
      'loader.skip': '⚡ Skip Wait & View Results Immediately ↗',

      // Results
      'rx.retest': '🔄 Re-enter Information',
      'rx.standard.kdca': 'K-GROWTH AI™ · KDCA 2017 & US CDC 2000 Precision Analysis Complete',
      'rx.standard.cdc': 'US CDC 2000 & WHO Clinical Growth Standards Applied',

      // Deep Child Trait Questions (Multi-Select Expanded)
      'quiz.trait.sleep.label': '🌙 Sleep Depth & Morning Wake-Up Pattern (Select all that apply)',
      'quiz.trait.sleep.hint': 'Tap all sleep patterns that apply to your child.',
      'quiz.trait.sleep.opt1': 'Deep sleep before 21:30 · Wakes up refreshed',
      'quiz.trait.sleep.opt2': 'Late bedtime after 22:30',
      'quiz.trait.sleep.opt3': 'Frequent tossing & mouth-breathing',
      'quiz.trait.sleep.opt4': 'Looks for milk or snacks right before bed',
      'quiz.trait.sleep.opt5': 'Hard to wake up in the morning',
      'quiz.trait.sleep.opt6': 'Heavy head/neck night sweats during sleep',
      'quiz.trait.sleep.opt7': 'Wakes easily to small sounds & sleep-talks',
      'quiz.trait.sleep.opt8': 'Oversleeps on weekends',
      'quiz.trait.diet.label': '🍽️ Appetite & Digestive Constitution (Select all that apply)',
      'quiz.trait.diet.hint': 'Finds delicious, high-absorption nutrients even picky eaters love!',
      'quiz.trait.diet.opt1': 'Small appetite · Eats small portions',
      'quiz.trait.diet.opt2': 'Picks out meat or vegetables',
      'quiz.trait.diet.opt3': 'Stomachache or diarrhea from milk/dairy',
      'quiz.trait.diet.opt4': 'Eats a balanced diet with good digestion',
      'quiz.trait.diet.opt5': 'Constipation or difficult bowel movements',
      'quiz.trait.diet.opt6': 'Prefers bread, noodles & sweet snacks over rice',
      'quiz.trait.diet.opt7': 'Holds food in mouth long or gets indigestion often',
      'quiz.trait.diet.opt8': 'Drinks less than 3 cups of water a day',
      'quiz.trait.posture.label': '🦴 Sitting Posture & Growing Pains (Select all that apply)',
      'quiz.trait.posture.opt1': 'Tech-neck & rounded back at desk/screens',
      'quiz.trait.posture.opt2': 'Crossed legs, uneven standing, or W-sitting',
      'quiz.trait.posture.opt3': 'Nighttime knee/calf growing pains',
      'quiz.trait.posture.opt4': 'Maintains upright back and neck posture',
      'quiz.trait.posture.opt5': 'Rests chin on hand or leans to one side',
      'quiz.trait.posture.opt6': 'Quick foot fatigue when walking · Flat feet',
      'quiz.trait.exercise.label': '🏃 Weekly Active Sweating & Outdoor Play',
      'quiz.trait.exercise.opt1': '1x/week or less · Mostly indoor quiet play',
      'quiz.trait.exercise.opt2': '2–3x/week PE, Taekwondo, or jump rope',
      'quiz.trait.exercise.opt3': '4x+/week active daily sweating play',
      'quiz.trait.temp.label': '🧩 Child Temperament & Style (Select all that apply)',
      'quiz.trait.temp.opt1': 'Active Explorer · Hands-on physical learner',
      'quiz.trait.temp.opt2': 'Focused Builder · Loves blocks & crafting',
      'quiz.trait.temp.opt3': 'Verbal Questioner · Loves asking "Why?"',
      'quiz.trait.temp.opt4': 'Careful Observer · Cautious & detail-oriented',
      'quiz.trait.temp.opt5': 'Creative Expressive · Loves music, art & roleplay',
      'quiz.trait.temp.opt6': 'Goal Achiever · Motivated by praise & mission stickers',
      'quiz.trait.focus.label': '⏱️ Attention Span on Single Play or Study Task',
      'quiz.trait.focus.opt1': 'Under 10 mins · Needs short rewarding play',
      'quiz.trait.focus.opt2': '15–20 mins · Fits step-by-step missions',
      'quiz.trait.focus.opt3': '30+ mins · Fits deep reading & projects',
      'quiz.trait.learning.label': '📚 Current Learning Bottlenecks (Multi-Select · 1:1 Study Rx)',
      'quiz.trait.learning.hint': 'Pinpoints neuro-cognitive root causes and tailors study strategies, books, and workbooks.',
      'quiz.trait.learning.opt1': 'Struggles with reading comprehension on long text problems',
      'quiz.trait.learning.opt2': 'Can do basic math but gets stuck on applied problem-solving',
      'quiz.trait.learning.opt3': 'Forgets tutoring content quickly & lacks self-directed review',
      'quiz.trait.learning.opt4': 'Used to smartphone/YouTube stimuli & lacks interest in books',
      'quiz.trait.learning.opt5': 'Cannot sit upright at desk for 15-20 mins & easily distracted',
      'quiz.trait.learning.opt6': 'Limited vocabulary or struggles to express ideas in writing',
      'quiz.trait.learning.opt7': 'Knows concepts but makes careless calculation or reading mistakes on tests',
      'quiz.trait.learning.opt8': 'Struggles to plan daily study volume and schedule independently',
      'quiz.trait.studystyle.label': '🎯 Preferred Learning & Study Absorption Style',
      'quiz.trait.studystyle.opt1': '🗣️ Dialogue & Inquiry — Understands best when asking and explaining aloud (Havruta)',
      'quiz.trait.studystyle.opt2': '🧩 Hands-On Manipulative — Thrives when touching blocks, 3D shapes & experiment kits',
      'quiz.trait.studystyle.opt3': '🎨 Visual & Mind-Map — Remembers longer with diagrams, charts & visual stories',
      'quiz.trait.studystyle.opt4': '🏆 Daily Mission & Goal — Focuses best with 15-min timer missions & daily checklists',
      'quiz.freenote.label': '💬 Share Your Concerns Freely (1:1 Live Antigravity AI Synthesis)',
      'quiz.freenote.hint': 'Write any concerns about supplements, sleep, or growth to get a 1:1 custom answer in your report! (Tap a chip below to auto-fill)',
      'quiz.freenote.placeholder': 'e.g., Wondering which supplement to give my growing child. Wakes up with leg pain at night and has a small appetite...'
    }
  };

  // 2. Unit Conversions
  function cmToFtIn(cm) {
    if (typeof cm !== 'number' || isNaN(cm) || cm <= 0) return { ft: 0, in: 0, str: '0 ft 0 in' };
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = Math.round((totalInches % 12) * 10) / 10;
    return {
      ft: ft,
      in: inches,
      str: `${ft} ft ${inches.toFixed(1)} in`
    };
  }

  function ftInToCm(ft, inches = 0) {
    const f = parseFloat(ft) || 0;
    const i = parseFloat(inches) || 0;
    const cm = (f * 12 + i) * 2.54;
    return Math.round(cm * 10) / 10;
  }

  function cmToInches(cm) {
    if (typeof cm !== 'number' || isNaN(cm) || cm <= 0) return 0;
    return Math.round((cm / 2.54) * 10) / 10;
  }

  function inchesToCm(inches) {
    if (typeof inches !== 'number' || isNaN(inches) || inches <= 0) return 0;
    return Math.round((inches * 2.54) * 10) / 10;
  }

  function kgToLbs(kg) {
    if (typeof kg !== 'number' || isNaN(kg) || kg <= 0) return 0;
    return Math.round(kg * 2.20462262 * 10) / 10;
  }

  function lbsToKg(lbs) {
    if (typeof lbs !== 'number' || isNaN(lbs) || lbs <= 0) return 0;
    return Math.round((lbs / 2.20462262) * 10) / 10;
  }

  // 3. State Management
  let currentLang = 'ko';
  let currentUnitSystem = 'metric'; // 'metric' (cm, kg) or 'imperial' (ft/in, lbs)
  let prevUnitSystem = 'metric';

  function initI18n() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedLang = window.localStorage.getItem('taller_lang');
        if (savedLang === 'en' || savedLang === 'ko') {
          currentLang = savedLang;
        } else if (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('en')) {
          currentLang = 'en';
        }
        const savedUnit = window.localStorage.getItem('taller_unit');
        if (savedUnit === 'imperial' || savedUnit === 'metric') {
          currentUnitSystem = savedUnit;
        } else {
          currentUnitSystem = currentLang === 'en' ? 'imperial' : 'metric';
        }
      } catch (e) {
        // Fallback
      }
    }
    updateDocumentLang();
    updateDOM();

    // Wire #btn-lang-toggle click listener
    if (typeof document !== 'undefined') {
      const langBtn = document.getElementById('btn-lang-toggle');
      if (langBtn && !langBtn._hasI18nListener) {
        langBtn.addEventListener('click', () => {
          toggleLanguage();
        });
        langBtn._hasI18nListener = true;
      }
    }
  }

  function getLanguage() {
    return currentLang;
  }

  function getUnitSystem() {
    return currentUnitSystem;
  }

  function setLanguage(lang) {
    if (lang !== 'ko' && lang !== 'en') return;
    currentLang = lang;
    currentUnitSystem = lang === 'en' ? 'imperial' : 'metric';

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('taller_lang', currentLang);
        localStorage.setItem('taller_unit', currentUnitSystem);
      } catch (e) {}
    }

    updateDocumentLang();
    updateDOM();
  }

  function toggleLanguage() {
    setLanguage(currentLang === 'ko' ? 'en' : 'ko');
  }

  function setUnitSystem(unit) {
    if (unit !== 'metric' && unit !== 'imperial') return;
    currentUnitSystem = unit;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('taller_unit', currentUnitSystem);
      } catch (e) {}
    }
    updateDOM();
  }

  function updateDocumentLang() {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLang;
    }
  }

  function t(key, lang = currentLang) {
    const dict = DICTIONARY[lang] || DICTIONARY.ko;
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to KO if missing in EN
    if (DICTIONARY.ko && DICTIONARY.ko[key]) {
      return DICTIONARY.ko[key];
    }
    return key;
  }

  function updateDOM() {
    if (typeof document === 'undefined') return;

    // 1. Elements with data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translated = t(key);
        // Fallback guard: If key is not in dictionary, preserve existing meaningful DOM text
        if (translated !== key) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.setAttribute('placeholder', translated);
          } else {
            el.textContent = translated;
          }
        }
      }
    });

    // 2. Elements with data-i18n-html
    const htmlElements = document.querySelectorAll('[data-i18n-html]');
    htmlElements.forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (key) {
        const translated = t(key);
        if (translated !== key) {
          el.innerHTML = translated.replace(/\n/g, '<br>');
        }
      }
    });

    // 3. Language button
    const langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) {
      langBtn.textContent = currentLang === 'ko' ? '🇺🇸 EN (CDC)' : '🇰🇷 KO (KDCA)';
      langBtn.title = currentLang === 'ko' ? 'Switch to Global Mode (EN / CDC / Imperial)' : '한국어 모드로 전환 (KDCA / Metric)';
    }

    // 3b. Translate DOB & Region select option labels
    const yearSel = document.getElementById('child-birth-year');
    if (yearSel && yearSel.options) {
      Array.from(yearSel.options).forEach((opt) => {
        opt.textContent = currentLang === 'en' ? `Born ${opt.value}` : `${opt.value}년생`;
      });
    }
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthSel = document.getElementById('child-birth-month');
    if (monthSel && monthSel.options) {
      Array.from(monthSel.options).forEach((opt) => {
        const mIdx = (parseInt(opt.value, 10) || 1) - 1;
        opt.textContent = currentLang === 'en' ? (monthNamesEn[mIdx] || `Month ${opt.value}`) : `${opt.value}월`;
      });
    }
    const daySel = document.getElementById('child-birth-day');
    if (daySel && daySel.options) {
      Array.from(daySel.options).forEach((opt) => {
        opt.textContent = currentLang === 'en' ? `Day ${opt.value}` : `${opt.value}일`;
      });
    }
    const regionMapEn = {
      '서울 강남·서초·송파': 'Seoul South (Gangnam · Seocho · Songpa)',
      '서울 강북·마포·용산': 'Seoul Central/North (Mapo · Yongsan)',
      '경기 남부(분당·수원·용인·동탄)': 'Gyeonggi South (Bundang · Suwon · Yongin)',
      '경기 북부·인천': 'Gyeonggi North & Incheon',
      '부산·경남': 'Busan & Gyeongnam',
      '대구·경북': 'Daegu & Gyeongbuk',
      '대전·충청': 'Daejeon & Chungcheong',
      '광주·전라·기타': 'Gwangju · Jeolla & Other Regions'
    };
    const regionSel = document.getElementById('user-region');
    if (regionSel && regionSel.options) {
      Array.from(regionSel.options).forEach((opt) => {
        opt.textContent = currentLang === 'en' ? (regionMapEn[opt.value] || opt.value) : opt.value;
      });
    }

    // 4. Update unit labels in inputs
    const heightUnitLabels = document.querySelectorAll('.unit-label-height');
    heightUnitLabels.forEach((el) => {
      el.textContent = currentUnitSystem === 'imperial' ? 'in (or ft/in)' : 'cm';
    });
    const weightUnitLabels = document.querySelectorAll('.unit-label-weight');
    weightUnitLabels.forEach((el) => {
      el.textContent = currentUnitSystem === 'imperial' ? 'lbs' : 'kg';
    });

    if (prevUnitSystem !== currentUnitSystem) {
      const childH = document.getElementById('child-height');
      const childW = document.getElementById('child-weight');
      const childR = document.getElementById('child-recent-gain');
      const fatH = document.getElementById('father-height');
      const motH = document.getElementById('mother-height');

      if (currentUnitSystem === 'imperial') {
        if (childH) {
          if (childH.value) {
            const v = parseFloat(childH.value);
            if (!isNaN(v) && v > 0) childH.value = (Math.round((v / 2.54) * 10) / 10).toFixed(1);
          }
          childH.min = '18'; childH.max = '90'; childH.placeholder = '54.0';
        }
        if (childW) {
          if (childW.value) {
            const v = parseFloat(childW.value);
            if (!isNaN(v) && v > 0) childW.value = (Math.round(v * 2.20462262 * 10) / 10).toFixed(1);
          }
          childW.min = '5'; childW.max = '350'; childW.placeholder = '78.0';
        }
        if (childR) {
          if (childR.value) {
            const v = parseFloat(childR.value);
            if (!isNaN(v) && v >= 0) childR.value = (Math.round((v / 2.54) * 10) / 10).toFixed(1);
          }
          childR.min = '0'; childR.max = '8'; childR.placeholder = '1.2';
        }
        if (fatH) {
          if (fatH.value) {
            const v = parseFloat(fatH.value);
            if (!isNaN(v) && v > 0) fatH.value = (Math.round((v / 2.54) * 10) / 10).toFixed(1);
          }
          fatH.min = '40'; fatH.max = '95'; fatH.placeholder = '68.3';
        }
        if (motH) {
          if (motH.value) {
            const v = parseFloat(motH.value);
            if (!isNaN(v) && v > 0) motH.value = (Math.round((v / 2.54) * 10) / 10).toFixed(1);
          }
          motH.min = '40'; motH.max = '95'; motH.placeholder = '63.2';
        }
      } else {
        if (childH) {
          if (childH.value) {
            const v = parseFloat(childH.value);
            if (!isNaN(v) && v > 0) childH.value = (Math.round(v * 2.54 * 10) / 10).toFixed(1);
          }
          childH.min = '45'; childH.max = '230'; childH.placeholder = '137.0';
        }
        if (childW) {
          if (childW.value) {
            const v = parseFloat(childW.value);
            if (!isNaN(v) && v > 0) childW.value = (Math.round((v / 2.20462262) * 10) / 10).toFixed(1);
          }
          childW.min = '2'; childW.max = '160'; childW.placeholder = '35.5';
        }
        if (childR) {
          if (childR.value) {
            const v = parseFloat(childR.value);
            if (!isNaN(v) && v >= 0) childR.value = (Math.round(v * 2.54 * 10) / 10).toFixed(1);
          }
          childR.min = '0'; childR.max = '20'; childR.placeholder = '3.2';
        }
        if (fatH) {
          if (fatH.value) {
            const v = parseFloat(fatH.value);
            if (!isNaN(v) && v > 0) fatH.value = (Math.round(v * 2.54 * 10) / 10).toFixed(1);
          }
          fatH.min = '100'; fatH.max = '240'; fatH.placeholder = '173.5';
        }
        if (motH) {
          if (motH.value) {
            const v = parseFloat(motH.value);
            if (!isNaN(v) && v > 0) motH.value = (Math.round(v * 2.54 * 10) / 10).toFixed(1);
          }
          motH.min = '100'; motH.max = '240'; motH.placeholder = '160.5';
        }
      }
      prevUnitSystem = currentUnitSystem;
    }

    // 5. Fire global custom event
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('taller-language-change', {
        detail: { language: currentLang, unitSystem: currentUnitSystem }
      }));
    }
  }

  // Export
  const I18n = {
    DICTIONARY,
    initI18n,
    getLanguage,
    setLanguage,
    toggleLanguage,
    getUnitSystem,
    setUnitSystem,
    t,
    updateDOM,
    cmToFtIn,
    ftInToCm,
    cmToInches,
    inchesToCm,
    kgToLbs,
    lbsToKg
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
  } else {
    global.TallerI18n = I18n;
    if (typeof window !== 'undefined') {
      window.addEventListener('DOMContentLoaded', () => {
        initI18n();
        const langBtn = document.getElementById('btn-lang-toggle');
        if (langBtn && !langBtn._hasI18nListener) {
          langBtn.addEventListener('click', () => {
            toggleLanguage();
          });
          langBtn._hasI18nListener = true;
        }
      });
    }
  }

})(typeof window !== 'undefined' ? window : global);
