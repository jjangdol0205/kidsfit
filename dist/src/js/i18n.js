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
      'brand.title': 'KIDS-FIT AI',
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

      // Hero
      'hero.badge': '질병관리청 성장도표 · 소아내분비·영양학 학술논문 1,277편 검증',
      'hero.headline': '<span class="hero-single-line">성장기 우리 아이, 어떤 걸 챙겨줘야 쑥쑥 클까요?</span><br><span class="hero-headline-highlight hero-single-line" style="background: linear-gradient(90deg, #38BDF8 0%, #34D399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700;">숨은 잠재키 · 아침저녁 맞춤 영양 · 학습 가이드북</span>',
      'hero.subtitle': '생년월일 1분 입력으로 6개월 이상 꾸준히 챙길 맞춤 루틴을 확인하세요~!',
      'nav.forWhom': '대상 안내',
      'nav.services': '제공 서비스',
      'hero.cta.parent': '학부모용 · 우리 아이 진단 시작 →',
      'hero.cta.youth': '학생용 · 내 잠재키 진단 시작 →',

      // For Whom Section
      'forWhom.kicker': 'WHO IT\'S FOR',
      'forWhom.title': '어떤 고민으로 찾아오셨나요?',
      'forWhom.sub': '복잡한 공부 대신 아침·저녁으로 간편하게 챙길 핵심만 알려드려요~!',
      'forWhom.parent.badge': 'FOR PARENTS · 학부모님',
      'forWhom.parent.title': '우리 아이 키 성장 & 잘 먹는 영양 루틴',
      'forWhom.parent.b1': '• 성장기 아이에게 어떤 영양제·식단을 먹일지 고민될 때',
      'forWhom.parent.b2': '• 유전키를 넘어 몇 cm까지 더 클 수 있을지 궁금할 때',
      'forWhom.parent.b3': '• 아이들이 맛있게 잘 먹고 꾸준히 챙길 루틴을 찾을 때',
      'forWhom.parent.btn': '학부모용 진단 시작 →',
      'forWhom.student.badge': 'FOR STUDENTS · 초·중·고 학생',
      'forWhom.student.title': '나의 숨은 잠재키 & 자기주도 습관',
      'forWhom.student.b1': '• 성장판이 닫히기 전 내 최대 잠재키가 궁금할 때',
      'forWhom.student.b2': '• 성장호르몬이 쏟아지는 밤 10시 숙면·자세 루틴이 필요할 때',
      'forWhom.student.b3': '• 스마트폰을 줄이고 짧은 시간에 깊게 집중하고 싶을 때',
      'forWhom.student.btn': '학생 본인용 진단 시작 →',

      // Services Section
      'services.kicker': '3 CORE REPORTS',
      'services.title': '1분 진단으로 바로 받는 3가지 맞춤 처방',
      'services.sub': '선택키만 톡톡 누르면 우리 아이 맞춤 가이드북이 즉시 열립니다~!',
      'services.s1.title': '유전키 · 방치키 · 관리키 3단 비교',
      'services.s1.desc': '성장호르몬(GH·IGF-1) 논문 기반으로 숨은 잠재키를 찾아드려요',
      'services.s2.title': '칼슘 · 초유 · 비타민D3 · 아연 맞춤 배합',
      'services.s2.desc': '아침·저녁 간편하게 아이들이 맛있게 잘 먹는 영양 루틴을 추천해요',
      'services.s3.title': '월령별 두뇌 교구 · 필독서 · 나들이 코스',
      'services.s3.desc': '6개월 이상 꾸준히 실천하기 좋은 검증된 교구와 책만 콕 집어드려요',
      'services.basis': '질병관리청(KDCA) 성장도표 · 대한소아내분비학회지 · 한국영양학회지 · BMC Pediatrics 학술 근거 적용',

      // Studio & Quiz Extra Keys
      'studio.bar.title': '✦ KIDS-FIT AI · 1:1 맞춤 진단',
      'studio.bar.back': '← 첫 화면으로',
      'presets.bar.label': '⚡ 연령별 1초 자동입력:',
      'preset.chip.1': '👶 영유아 3세',
      'preset.chip.2': '🧒 아동기 7세',
      'preset.chip.3': '👦 사춘기 10세',
      'preset.chip.4': '⚡ 급성장 13세',
      'preset.chip.5': '🌟 청소년 16세',
      'quiz.edition.label': '📘 누구의 성장을 진단할까요? (한 줄 선택)',
      'quiz.edition.child': '👶 학부모용 — 우리 아이 맞춤 진단',
      'quiz.edition.self': '🙋 학생·본인용 — 나의 잠재키 진단',
      'quiz.dob.hint1': '✨ 같은 해에 태어나도 1월생과 12월생은 평균 키가 최대 4.8cm 차이 납니다 (일수 자동 보정)',
      'quiz.mph.label': '실시간 부모 유전 표적키 (Tanner MPH)',
      'quiz.region.label': '거주 지역 (주말 나들이 코스 연동)',
      'quiz.autostage.badge': '🤖 독자 개발 K-GROWTH AI™ 기반 【성장단계 & 골연령 진행도】 자동 설정 완료!',
      'quiz.autostage.manualLabel': '자동 매핑된 성장 단계 확인 (터치하여 변경 가능)',
      'quiz.habits.label': '현재 고치고 싶은 생활 습관 체크 (복수 선택)',
      'quiz.habits.hint': '해당하는 항목을 가볍게 터치해 주세요~!',
      'quiz.cog.label': '키워주고 싶은 두뇌·학습 영역 (복수 선택)',
      'quiz.cog.hint': '우리 아이가 흥미를 보이는 분야를 골라주세요~!',
      'quiz.submit.btn': '✦ 우리 아이 맞춤 가이드북 결과 보기 →',
      'loader.desc': '생년월일 일수 보정 데이터와 학술 논문 코퍼스를 대조하여 맞춤 가이드북을 편찬하고 있습니다.',
      'results.tab1.title': '신체 성장 백분위 & 골연령 예측 궤적 (Auxology)',
      'results.tab1.desc': '독자 개발 K-GROWTH AI™ 기반 Z-Score, 연간 성장속도(cm/yr), 부모 유전 표적키(MPH ±8.5cm) 및 3단 성인 예측키 시뮬레이션입니다.',
      'results.tab2.title': '24시간 호르몬 궤적 & 임상 영양 생체이용률',
      'results.tab2.desc': '취침 시각 및 야식 시간에 따른 서파수면(SWS) 성장호르몬 분비 억제율(-52% max)과 체중 비례 영양소 흡수율 게이지입니다.',
      'results.tab3.title': '척추 감압 & 성장판 미세자극 스튜디오',
      'results.tab3.desc': '추간판 수분 복원(+1.8cm) 및 볼프의 법칙(Wolff\'s Law)에 기반한 3대 임상 운동 루틴과 실시간 카운트다운 스톱워치입니다.',
      'results.tab4.title': '연령별 뇌인지 발달 & 주말 하브루타 탐구 로드맵',
      'results.tab4.desc': '5각 뇌인지 밸런스 레이더 SVG 차트, 연령대별 대뇌 피질 재조직화 가이드 및 주말 탐구 3단계 하브루타 질문 세트입니다.',
      'results.tab5.title': '90일 성장·루틴 트래커 & 대학병원 스타일 A4 정밀 리포트',
      'results.tab5.desc': '신장·체중 연속 기록 트래커와 클릭 한 번으로 인쇄/PDF 저장 가능한 2페이지 정밀 임상 결과지입니다.',
      'footer.disclaimer': '본 서비스는 KIDS-FIT AI가 독자 개발한 K-GROWTH AI™ 알고리즘 및 US CDC 2000, WHO Growth Standards, 질병관리청(KDCA 2017) 소아청소년 성장도표, 보건복지부 한국 영유아 발달선별검사(K-DST) 학술 지표를 기반으로 산출된 맞춤형 가이드북이며, 전문의의 진료를 대신하지 않습니다.',

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
      'wizard.step1.title': '우리 아이 생년월일 & 현재 키·몸무게 입력',
      'wizard.step1.sub': '생년월일 일수 단위로 또래 백분위와 부모 유전 예상키를 바로 계산해요~!',
      'wizard.step2.title': '생년월일 맞춤 [성장단계 & 골연령] 자동 설정 완료!',
      'wizard.step2.sub': '아이 나이에 맞춰 AI가 성장 단계를 자동으로 맞춰드렸어요~!',
      'wizard.step3.title': '평소 수면 · 식습관 · 다리 성장통 · 기질 체크',
      'wizard.step3.sub': '해당하는 선택키만 가볍게 터치해 주세요! 아침·저녁 루틴에 반영됩니다~!',
      'wizard.step4.title': '고쳐주고 싶은 생활 습관 (한 줄 선택)',
      'wizard.step4.sub': '성장호르몬과 숨은 키를 방해하는 습관을 골라주세요~!',
      'wizard.step5.title': '키워주고 싶은 두뇌·학습 영역 선택',
      'wizard.step5.sub': '아이 나이에 딱 맞는 교구·필독서·주말 나들이 코스를 추천해 드려요~!',
      'wizard.step6.title': '우리 아이 고민 한 줄 메모 (선택)',
      'wizard.step6.sub': '아래 빠른 선택키를 누르거나 고민을 적어주시면 1:1 답변이 완성돼요~!',

      // Form Labels
      'label.gender': '아이 성별',
      'label.gender.boy': '남아 (Boy)',
      'label.gender.girl': '여아 (Girl)',
      'label.age': '만 나이 (연령 슬라이더)',
      'label.height': '현재 신장 (Height)',
      'label.weight': '현재 체중 (Weight)',
      'label.recentGrowth': '최근 6개월간 자란 키 (연간 성장속도 산출용)',
      'label.fatherHeight': '아버지 신장 (Father Height)',
      'label.motherHeight': '어머니 신장 (Mother Height)',
      'label.prev': '← 이전 단계',
      'label.next': '다음 단계 →',
      'label.scan': '🔬 3초 바이오 스캔 분석 시작',

      // Tanner Phases
      'phase.1.title': 'Phase 1. 기초 성장기 (영유아·아동기)',
      'phase.1.desc': '성장판 개방률 90%+, 연 5~6cm 꾸준한 성장 구간',
      'phase.2.title': 'Phase 2. 급성장 피크기 (사춘기 초기 PHV)',
      'phase.2.desc': '성장호르몬 및 IGF-1 분비 폭발, 골든타임 최대 가속 구간',
      'phase.3.title': 'Phase 3. 감속·성숙기 (변성기·초경 이후)',
      'phase.3.desc': '성장판 폐쇄 직전, 마지막 잔여 잠재력 4~7cm 보존 구간',
      'phase.4.title': 'Phase 4. 체형·자세 완성기 (후기 청소년)',
      'phase.4.desc': '척추 디스크 감압 및 거북목·골반 정렬로 숨은 키 1.5~2.5cm 복원 구간',

      // Habits
      'habit.late_sleep': '밤 10시 30분 이후 늦은 취침 (얕은 잠)',
      'habit.night_carbs': '취침 2시간 전 야식·단 음료 섭취',
      'habit.poor_posture': '스마트폰·책상 거북목 & 구부정한 자세',
      'habit.picky_eater': '고기·채소 편식 & 우유 소화 불편',
      'habit.sedentary': '하루 30분 미만 실내 생활 (점프 운동 부족)',

      // Cognitive Axes
      'cog.math_logic': '수리·공간·도형 퍼즐 사고력',
      'cog.language_reading': '어휘력·독서 습관 & 글쓰기',
      'cog.science_nature': '우주·공룡·과학 원리 실험 탐구',
      'cog.sensory_arts': '미술·음악·오감 창의 표현력',
      'cog.executive_focus': '전두엽 집중력 & 스스로 공부 습관',

      // Loader
      'loader.step1': 'CDC 2000 & KDCA 2017 LMS 파라미터 매트릭스 로딩 중...',
      'loader.step2': 'Z-Score 표준화 및 3단 성인 예측키 궤적 모델링 연산 중...',
      'loader.step3': '호르몬 분비 억제율 및 5각 신경인지 밸런스 프로토콜 생성 완료!',
      'loader.skip': '즉시 결과 보기 ↗',

      // Results
      'rx.retest': '🔄 재문진 및 데이터 변경',
      'rx.standard.kdca': '질병관리청(KDCA 2017) 소아청소년 표준 성장도표 적용',
      'rx.standard.cdc': 'US CDC 2000 & WHO Clinical Growth Standards Applied',

      // Deep Child Trait Questions (Multi-Select Expanded)
      'quiz.trait.sleep.label': '🌙 잠드는 시간 & 수면 습관 (복수 선택)',
      'quiz.trait.sleep.hint': '해당하는 항목을 톡톡 눌러주세요~!',
      'quiz.trait.sleep.opt1': '밤 9시 30분 전 숙면 · 아침 개운 기상',
      'quiz.trait.sleep.opt2': '밤 10시 30분 이후 늦게 잠듦',
      'quiz.trait.sleep.opt3': '입 벌리고 잠 · 코골이 · 비염 뒤척임',
      'quiz.trait.sleep.opt4': '자기 직전 우유·간식·야식 섭취',
      'quiz.trait.sleep.opt5': '아침에 일어나기 힘들고 피곤해함',
      'quiz.trait.sleep.opt6': '새벽에 자주 깨거나 잠투정이 있음',
      'quiz.trait.sleep.opt7': '잠들기 직전까지 스마트폰·영상 시청',
      'quiz.trait.sleep.opt8': '평일 수면 부족 & 주말 몰아서 늦잠',
      'quiz.trait.diet.label': '🍽️ 평소 식습관 & 영양 흡수 체질 (복수 선택)',
      'quiz.trait.diet.hint': '아이가 잘 먹는 맞춤 영양소(칼슘·초유·비타민D3·아연)를 추천해 드려요~!',
      'quiz.trait.diet.opt1': '입이 짧고 밥 먹는 양이 적은 소식형',
      'quiz.trait.diet.opt2': '고기나 채소·나물 편식이 심한 편',
      'quiz.trait.diet.opt3': '우유·유제품 마시면 배앓이·설사 잦음',
      'quiz.trait.diet.opt4': '밥 대신 빵·면·과자·단 간식을 더 찾음',
      'quiz.trait.diet.opt5': '밥을 입에 오래 물고 식사 시간이 김',
      'quiz.trait.diet.opt6': '배가 자주 아프거나 변비·묽은 변이 있음',
      'quiz.trait.diet.opt7': '아침밥을 거르거나 식사 시간이 불규칙함',
      'quiz.trait.diet.opt8': '골고루 잘 먹고 소화·배변도 편안함',
      'quiz.trait.posture.label': '🦴 평소 자세 & 다리 성장통 체크 (복수 선택)',
      'quiz.trait.posture.opt1': '책상·스마트폰 볼 때 거북목·굽은 등',
      'quiz.trait.posture.opt2': '다리 꼬기·짝다리·한쪽으로 기대어 앉기',
      'quiz.trait.posture.opt3': '저녁·밤에 무릎·종아리 성장통 호소',
      'quiz.trait.posture.opt4': '바닥에 W자로 앉거나 안짱걸음·평발',
      'quiz.trait.posture.opt5': '어깨가 안으로 말리고 가슴이 움츠러듦',
      'quiz.trait.posture.opt6': '허리와 목을 곧게 펴고 바르게 앉는 편',
      'quiz.trait.exercise.label': '🏃 일주일 평균 뛰어노는 운동 횟수',
      'quiz.trait.exercise.opt1': '주 1회 이하 · 실내 활동 위주 (운동 부족)',
      'quiz.trait.exercise.opt2': '주 2~3회 체육·태권도·줄넘기 (보통)',
      'quiz.trait.exercise.opt3': '주 4회 이상 매일 땀 흘리는 활동형',
      'quiz.trait.temp.label': '🧩 우리 아이 성향 & 좋아하는 놀이 (복수 선택)',
      'quiz.trait.temp.opt1': '몸으로 직접 부딪히며 체험하는 활동 탐구형',
      'quiz.trait.temp.opt2': '블록 조립·만들기·그리기에 빠지는 손끝 몰입형',
      'quiz.trait.temp.opt3': '"왜?" 질문이 많고 대화를 좋아하는 사고형',
      'quiz.trait.temp.opt4': '신중하게 관찰한 뒤 시작하는 섬세·완벽형',
      'quiz.trait.temp.opt5': '음악·역할극·동화 스토리를 좋아하는 감성형',
      'quiz.trait.temp.opt6': '퀴즈·보드게임·미션 달성을 좋아하는 성취형',
      'quiz.trait.focus.label': '⏱️ 한 가지 놀이나 책에 집중하는 시간',
      'quiz.trait.focus.opt1': '10분 미만 (짧고 재미있는 미션 필요)',
      'quiz.trait.focus.opt2': '15~20분 집중 (단계별 성취감 자극 적합)',
      'quiz.trait.focus.opt3': '30분 이상 깊은 몰입 가능 (심화 독서·탐구)',
      'quiz.freenote.label': '💬 자주 묻는 고민 선택키 터치 또는 한 줄 메모 (선택)',
      'quiz.freenote.hint': '아래 선택키를 터치하시면 아이 맞춤 영양제·식단·수면 처방이 바로 완성됩니다~!',
      'quiz.freenote.placeholder': '예: 성장기 아이에게 어떤 영양제를 먹일지 고민이에요. 아침저녁으로 잘 먹는 걸 찾고 있어요~!'
    },

    en: {
      // Header & Brand
      'brand.title': 'KIDS-FIT AI',
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
      'hero.badge': '🧬 Powered by KDCA Growth Standards & 1,260+ Clinical Papers · K-GROWTH AI™',
      'hero.headline': 'How Tall Will Your Child Grow?\n<span class="hero-headline-highlight" style="background: linear-gradient(90deg, #38BDF8 0%, #34D399 60%, #A7F3D0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Unlock +6.7cm Hidden Height & Tailored Learning in 1 Min</span>',
      'hero.subtitle': '1-Min Input → Instant [Adult Height Forecast · Daily Routine · Pinpoint Supplements & Books]',
      'nav.forWhom': 'Who It\'s For',
      'nav.services': 'Our Services',
      'hero.cta.parent': '👨‍👩‍👧 Parents · Start 1-Min Child Diagnosis →',
      'hero.cta.youth': '🙋 Students · Start 1-Min Height Diagnosis →',

      // For Whom Section
      'forWhom.kicker': 'WHO IT\'S FOR',
      'forWhom.title': 'Who Needs This?',
      'forWhom.sub': 'Zero fluff. Only the exact growth and learning answers you need right now.',
      'forWhom.parent.badge': '👨‍👩‍👧 FOR PARENTS',
      'forWhom.parent.title': 'Child Height Growth & Age-Fit Learning',
      'forWhom.parent.b1': '✓ Curious about your child\'s final adult height',
      'forWhom.parent.b2': '✓ Want a clear 4-year brain & study roadmap',
      'forWhom.parent.b3': '✓ Need exact supplements, toys & books for their traits',
      'forWhom.parent.btn': 'Start 1-Min Parent Diagnosis →',
      'forWhom.student.badge': '🙋 FOR STUDENTS',
      'forWhom.student.title': 'Unlock +6.7cm Hidden Height & Deep Focus',
      'forWhom.student.b1': '✓ Want to know your max potential height before plates close',
      'forWhom.student.b2': '✓ Need a 10 PM sleep, posture & nutrition routine',
      'forWhom.student.b3': '✓ Want to cut screen time and focus deeper in less time',
      'forWhom.student.btn': 'Start 1-Min Student Diagnosis →',

      // Services Section
      'services.kicker': '3 CORE REPORTS',
      'services.title': '3 Core Results in 1 Minute',
      'services.sub': 'Finish the quick survey to unlock your complete bespoke guidebook.',
      'services.s1.title': 'Genetic vs. Unmanaged vs. Managed Height',
      'services.s1.desc': 'Finds height loss bottlenecks and prescribes a 90-day sleep, diet & posture routine.',
      'services.s2.title': 'Age N → N+3 Brain & Study Milestones',
      'services.s2.desc': 'Auto-detects growth stage and maps out 4 years of brain & self-directed study focus.',
      'services.s3.title': 'Pinpoint Supplements · Toys · Books',
      'services.s3.desc': 'Matches verified specific products directly to your child\'s appetite, sleep & temperament.',
      'services.basis': '🏛️ Clinical Basis: KDCA Growth Charts · US CDC 2000 · K-DST Milestones · 1,260-Paper DB',

      // Studio & Quiz Extra Keys
      'studio.bar.title': '✦ KIDS-FIT AI · 1:1 Personalized Growth & Learning Diagnosis',
      'studio.bar.back': '← Back to Service Overview',
      'presets.bar.label': '⚡ 1-Sec Demo Presets:',
      'preset.chip.1': '👶 Age 3',
      'preset.chip.2': '🧒 Age 7',
      'preset.chip.3': '👦 Age 10',
      'preset.chip.4': '⚡ Age 13',
      'preset.chip.5': '🌟 Age 16',
      'quiz.edition.label': '📘 Select Personalized Guidebook Edition',
      'quiz.edition.child': '👶 Parent Mode — Child Growth & Learning Guidebook',
      'quiz.edition.self': '🙋 Student Mode — My Potential Height & Learning Guidebook',
      'quiz.dob.hint1': '✨ Even in the same birth year, Jan vs. Dec births differ by up to 4.8 cm (AI day-level calibration active)',
      'quiz.mph.label': 'Real-Time Mid-Parental Target Height (Tanner MPH)',
      'quiz.region.label': 'Region (For Local Museum & Inquiry Courses)',
      'quiz.autostage.badge': '🤖 K-GROWTH AI™ Auto-Detected Growth Stage & Bone Maturation!',
      'quiz.autostage.manualLabel': 'Auto-Selected Growth Stage (Click below only if you wish to override)',
      'quiz.habits.label': 'Sleep, Nutrition & Posture Inhibition Factors (Select all that apply)',
      'quiz.habits.hint': 'Selected factors are used to compute nocturnal GH suppression (-52% max) and height loss penalties.',
      'quiz.cog.label': 'Core Brain & Learning Focus Domains (Select all that apply)',
      'quiz.cog.hint': 'Generates age-specific neuroplasticity and inquiry learning protocols.',
      'quiz.submit.btn': '✦ Generate My Growth & Learning Guidebook →',
      'loader.desc': 'Cross-referencing day-calibrated birth data with 1,200+ peer-reviewed studies to compile your guidebook.',
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
      'footer.disclaimer': 'Powered by proprietary K-GROWTH AI™ algorithms and official US CDC 2000, WHO Growth Standards, KDCA 2017 Growth Charts, and K-DST developmental milestones. This guidebook is for educational and wellness guidance and does not replace medical diagnosis.',

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
      'wizard.step1.title': 'Basic Biometrics & Genetics',
      'wizard.step1.sub': 'Utilized for CDC/KDCA LMS Z-scores and Tanner Mid-Parental Height (MPH).',
      'wizard.step2.title': 'Skeletal Maturation & Tanner Stage',
      'wizard.step2.sub': 'Evaluates epiphyseal plate open ratio and Peak Height Velocity (PHV) runway.',
      'wizard.step3.title': 'Lifestyle & Bio-Inhibition Factors',
      'wizard.step3.sub': 'Diagnoses nocturnal GH suppression and adult height penalty factors.',
      'wizard.step4.title': 'Neuro-Cognitive Key Axes (5 Major Domains)',
      'wizard.step4.sub': 'Configures age-specific cortical rewiring and developmental inquiry.',
      'wizard.step5.title': 'Clinical Computation & Modeling',
      'wizard.step5.sub': 'Calculating LMS Z-scores, 24h hormone curves, and 3 adult trajectories.',
      'wizard.step6.title': 'Custom Note & Questions (Optional)',
      'wizard.step6.sub': 'Tap a quick concern chip or write a note for 1:1 bespoke answers.',

      // Form Labels
      'label.gender': 'Biological Sex',
      'label.gender.boy': 'Boy',
      'label.gender.girl': 'Girl',
      'label.age': 'Age (Years Slider)',
      'label.height': 'Current Height',
      'label.weight': 'Current Weight',
      'label.recentGrowth': 'Recent 6-Month Height Gain (for Annual Velocity)',
      'label.fatherHeight': 'Father\'s Height',
      'label.motherHeight': 'Mother\'s Height',
      'label.prev': '← Previous',
      'label.next': 'Next Step →',
      'label.scan': '🔬 Run 3-Second Clinical Scan',

      // Tanner Phases
      'phase.1.title': 'Phase 1. Foundation Growth (Infancy & Childhood)',
      'phase.1.desc': 'Open growth plate ratio 90%+, steady 5~6 cm/yr velocity',
      'phase.2.title': 'Phase 2. Peak Height Velocity (Early Puberty PHV)',
      'phase.2.desc': 'Pulsatile GH & IGF-1 surge; maximum velocity golden window',
      'phase.3.title': 'Phase 3. Deceleration & Maturation (Post-Menarche/Voice Break)',
      'phase.3.desc': 'Final residual potential of 4~7 cm before epiphyseal fusion',
      'phase.4.title': 'Phase 4. Structural Postural Alignment (Late Adolescence)',
      'phase.4.desc': 'Spinal disc decompression recovering +1.5~2.5 cm of hidden height',

      // Habits
      'habit.late_sleep': 'Delayed Bedtime (Sleep after 10:30 PM / Fragmented Sleep)',
      'habit.night_carbs': 'Late-Night Glycemic Spike (Snacks/Sugar within 2 hrs of bed)',
      'habit.poor_posture': 'Postural Misalignment (Tech-neck, thoracic kyphosis, pelvic tilt)',
      'habit.picky_eater': 'Nutritional Deficit (Protein/micronutrient avoidance, lactose intolerance)',
      'habit.sedentary': 'Physical Inactivity (Lack of 30+ min daily impact/jumping exercise)',

      // Cognitive Axes
      'cog.math_logic': 'Mathematical, Spatial & Logical Reasoning',
      'cog.language_reading': 'Language, Literacy & Critical Reading',
      'cog.science_nature': 'Scientific, Natural & Technological Inquiry',
      'cog.sensory_arts': 'Sensory, Artistic & Creative Motor Expression',
      'cog.executive_focus': 'Prefrontal Executive Function & Focused Autonomy',

      // Loader
      'loader.step1': 'Loading CDC 2000 & KDCA 2017 LMS Parameter Matrices...',
      'loader.step2': 'Computing Standardized Z-Scores & 3-Tier Predicted Trajectories...',
      'loader.step3': 'Finalizing GH Suppression Ratio & 5-Axis Neuro-Cognitive Protocol!',
      'loader.skip': 'Skip & View Results ↗',

      // Results
      'rx.retest': '🔄 Re-evaluate Biometrics',
      'rx.standard.kdca': 'Korean KDCA 2017 Clinical Growth Charts Applied',
      'rx.standard.cdc': 'US CDC 2000 & WHO Clinical Growth Standards Applied',

      // Deep Child Trait Questions (Multi-Select Expanded)
      'quiz.trait.sleep.label': '🌙 Sleep Depth & Morning Wake-Up Pattern (Select all that apply)',
      'quiz.trait.sleep.hint': 'Tap all sleep patterns that apply. All selected traits are reflected in your SWS hormone protocol.',
      'quiz.trait.sleep.opt1': 'Deep sleep before 21:30 · Wakes up refreshed',
      'quiz.trait.sleep.opt2': 'Late bedtime after 22:30 (study, academy, screen)',
      'quiz.trait.sleep.opt3': 'Frequent tossing, mouth-breathing, snoring, or rhinitis',
      'quiz.trait.sleep.opt4': 'Drinks milk, fruit, or snacks right before bedtime',
      'quiz.trait.sleep.opt5': 'Hard to wake up in the morning · Tired or irritable',
      'quiz.trait.sleep.opt6': 'Night sweats on head/neck & kicks off blankets',
      'quiz.trait.sleep.opt7': 'Wakes easily to small noises or vivid dreams',
      'quiz.trait.sleep.opt8': 'Weekday sleep debt & oversleeps on weekends',
      'quiz.trait.diet.label': '🍽️ Appetite & Digestive Constitution (Select all that apply)',
      'quiz.trait.diet.hint': 'Select all eating and digestive patterns that apply to customize your nutrition protocol.',
      'quiz.trait.diet.opt1': 'Small appetite · Eats small portions per meal',
      'quiz.trait.diet.opt2': 'Avoids meat (chewy texture) or vegetables/greens',
      'quiz.trait.diet.opt3': 'Sensitive to milk/dairy (bloating, diarrhea, gas)',
      'quiz.trait.diet.opt4': 'Balanced eater with smooth digestion & bowel habits',
      'quiz.trait.diet.opt5': 'Frequent constipation or hard/painful stools',
      'quiz.trait.diet.opt6': 'Prefers bread, noodles, sweets, or sugary drinks over meals',
      'quiz.trait.diet.opt7': 'Holds food in mouth too long or swallows too fast (indigestion)',
      'quiz.trait.diet.opt8': 'Drinks less than 3 cups of plain water per day',
      'quiz.trait.posture.label': '🦴 Sitting Posture & Growing Pains (Select all that apply)',
      'quiz.trait.posture.opt1': 'Forward head (tech-neck) & rounded shoulders at desk',
      'quiz.trait.posture.opt2': 'Crossed legs, uneven standing, or W-sitting on floor',
      'quiz.trait.posture.opt3': 'Complains of evening knee/calf growing pains or fatigue',
      'quiz.trait.posture.opt4': 'Maintains relatively upright spine and neck posture',
      'quiz.trait.posture.opt5': 'Rests chin on hand or leans to one side at desk',
      'quiz.trait.posture.opt6': 'Quick foot fatigue when walking · Flat feet or in-toeing',
      'quiz.trait.exercise.label': '🏃 Weekly Active Jumping & Outdoor Exercise',
      'quiz.trait.exercise.opt1': '1x/week or less · Mostly indoor sedentary activity',
      'quiz.trait.exercise.opt2': '2–3x/week moderate sports, jump rope, or PE',
      'quiz.trait.exercise.opt3': '4x+/week active daily sweating & outdoor play',
      'quiz.trait.temp.label': '🧩 Child Temperament & Learning Style (Select all that apply)',
      'quiz.trait.temp.opt1': 'Active Explorer · Thrives on hands-on experiments & motion',
      'quiz.trait.temp.opt2': 'Focused Builder · Immerses in blocks, crafting & drawing',
      'quiz.trait.temp.opt3': 'Verbal Questioner · Loves asking "Why?" and storytelling',
      'quiz.trait.temp.opt4': 'Careful Observer · Cautious, detail-oriented perfectionist',
      'quiz.trait.temp.opt5': 'Creative Expressive · Responds quickly to music, art & roleplay',
      'quiz.trait.temp.opt6': 'Goal Achiever · Motivated by praise, stickers & step missions',
      'quiz.trait.focus.label': '⏱️ Average Single-Task Attention Span',
      'quiz.trait.focus.opt1': 'Under 10 mins (Needs short, high-reward micro-missions)',
      'quiz.trait.focus.opt2': '15–20 mins (Fits step-by-step milestone challenges)',
      'quiz.trait.focus.opt3': '30+ mins deep immersion (Ready for advanced projects)',
      'quiz.freenote.label': '💬 Tell Us Directly About Your Child (Bespoke AI Narrative Synthesis)',
      'quiz.freenote.hint': 'Write any unique traits, daily habits, or concerns in your own words. Our AI engine cross-references 1,260+ clinical papers to add a 1:1 Bespoke Q&A and Action Plan to your report.',
      'quiz.freenote.placeholder': 'e.g., Wakes up at night with calf/knee growing pains, refuses milk, and we worry about short parental height limits...'
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
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.setAttribute('placeholder', translated);
        } else {
          el.textContent = translated;
        }
      }
    });

    // 2. Elements with data-i18n-html
    const htmlElements = document.querySelectorAll('[data-i18n-html]');
    htmlElements.forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (key) {
        el.innerHTML = t(key).replace(/\n/g, '<br>');
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
