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
      'brand.tagline': '프리미엄 육아 필수템 큐레이션 셀렉트샵 & 맞춤 발달 리포트',
      'trust.badge': 'Built on Official Standards: 질병관리청 소아청소년 성장도표 & 보건복지부 영유아 발달선별검사(K-DST) 기준 적용',
      'nav.auxology': '신체 성장 · 골연령 궤적',
      'nav.endocrinology': '성장호르몬 · 수면 · 임상 영양',
      'nav.biomechanics': '척추 감압 · 생체역학',
      'nav.neuro': '신경인지 · 5각 두뇌 밸런스',
      'nav.tracker': '90일 트래커 · 임상 결과지',
      'theme.dark': 'Clinical Mode',
      'theme.light': 'Light Mode',
      'lang.toggle': 'EN (CDC)',

      // Hero (Psychological Hook + Clinical Authority + Immediate CTA)
      'hero.badge': '질병관리청(KDCA) 표준 성장도표 · 보건복지부 K-DST · 소아내분비·뇌인지 학술논문 3,894편 교차 검증',
      'hero.headline': '<span class="hero-single-line">실패 없는 시기별 육아 필수템,</span><br><span class="hero-headline-highlight hero-single-line">선배맘과 발달 에디터가 깐깐하게 골랐습니다</span>',
      'hero.subtitle': '신생아부터 학령기까지 꼭 필요한 정착템만 모았습니다. 관심 아이템의 상세 가이드를 확인하시면 우리 아이 1:1 발달·성장 리포트가 무료로 열립니다.',
      'nav.forWhom': '신체 성장 정밀 진단',
      'nav.services': '두뇌·학습 정밀 진단',
      'hero.cta.parent': '소아 신체 성장 · 최종 예상키 1분 진단 시작하기',
      'hero.cta.learning': '5각 두뇌 밸런스 · 학습 병목 1분 진단 시작하기',
      'hero.cta.youth': '1분 맞춤 정밀 진단 시작하기',

      // For Whom Section
      'forWhom.kicker': 'CLINICAL DIAGNOSTIC SYSTEM',
      'forWhom.title': '1분 객관식 설문으로 부모님이 즉시 확인하는 핵심 진단',
      'forWhom.sub': '병원 방문 없이 생년월일과 생활·학습 습관 체크만으로 의학·학술 기준의 정밀 보고서를 발행합니다.',
      'forWhom.parent.badge': 'DIAGNOSIS 01 · 소아 신체 성장 정밀 판독',
      'forWhom.parent.title': '우리아이 최종 예상키 및 성장판 골든타임 리포트',
      'forWhom.parent.b1': '• 성인이 되었을 때 최종 몇 cm까지 클 수 있는지 3단 예상키와 숨은 잠재키(+6.7cm) 확인',
      'forWhom.parent.b2': '• 성장판이 닫히기 전 남은 급성장 골든타임 개월 수 및 수면·체중 비례 필수 영양 기준 확보',
      'forWhom.parent.b3': '• 낮 동안 눌린 척추 디스크를 펴서 숨은 키 1.8~2.5cm를 복원하는 가정 내 교정 솔루션 확보',
      'forWhom.parent.btn': '우리 아이 예상키 · 성장판 골든타임 1분 진단하기',
      'forWhom.student.badge': 'DIAGNOSIS 02 · 아동 신경인지 · 학습 역량 판독',
      'forWhom.student.title': '5각 두뇌 밸런스 차트 및 전두엽 학습 병목 리포트',
      'forWhom.student.b1': '• 5각 두뇌 밸런스 차트로 문장제 수학·긴 글 독해가 막히는 진짜 뇌인지 병목 원인 규명',
      'forWhom.student.b2': '• 사교육비 중복 지출을 막는 아이 두뇌 흡수 성향별 1:1 자기주도 복습법 및 맞춤 교재·교구 선별',
      'forWhom.student.b3': '• 6개월 집중 코칭 시 변화할 학업 성취도 성장 곡선과 강점 지능 기반 유망 진로 로드맵 확보',
      'forWhom.student.btn': '우리 아이 5각 두뇌 밸런스 · 학습 병목 1분 진단하기',

      // Services Section
      'services.kicker': 'CORE DIAGNOSTIC SYSTEM',
      'services.title': '1분 설문 진단으로 부모님이 얻게 되는 실질적 해답',
      'services.sub': '질병관리청 국가 표준 지표와 2,918편의 학술 논문을 대조하여 신뢰도 높은 솔루션을 제시합니다.',
      'services.s1.title': '유전 표적키 · 현재 습관 유지 시 · 골든타임 관리 시 3단 비교',
      'services.s1.desc': '숨은 키 손실을 막는 수면·영양·척추 감압 루틴을 수치로 안내합니다.',
      'services.s2.title': '5각 두뇌 밸런스 차트 & 향후 3개년 연령별 학습 로드맵',
      'services.s2.desc': '문해력·수리추론·전두엽 집중력 병목 진단과 자기주도 공부법을 제시합니다.',
      'services.s3.title': '체질별 맞춤 영양·운동 기구 & 두뇌 성향별 교재·교구 매칭',
      'services.s3.desc': '불필요한 지출 없이 아이의 현재 상태에 검증된 핵심 솔루션만 선별합니다.',
      'services.basis': '대한소아내분비학회지 · 대한소아과학회지 · 질병관리청(KDCA) · 학술논문 3,894편 기반',

      // Studio & Quiz Extra Keys
      'studio.bar.title': 'KIDS-FIT 임상 데이터 기반 1:1 정밀 설문 진단',
      'studio.bar.back': '첫 화면으로 돌아가기',
      'presets.bar.label': '연령별 표준 임상 데이터 예시:',
      'preset.chip.1': '만 3세 (영유아기)',
      'preset.chip.2': '만 7세 (학령기 진입)',
      'preset.chip.3': '만 10세 (사춘기 진입)',
      'preset.chip.4': '만 13세 (급성장 피크)',
      'preset.chip.5': '만 16세 (체형 완성기)',
      'quiz.edition.label': '맞춤 정밀 진단 유형',
      'quiz.edition.child': '소아·청소년 1:1 성장·학습 정밀 진단',
      'quiz.edition.self': '소아·청소년 1:1 성장·학습 정밀 진단',
      'quiz.dob.hint1': '동일 연도 출생아도 1월생과 12월생은 표준 신장이 최대 4.8cm 차이 납니다 (생년월일 일수 정밀 보정 적용)',
      'quiz.mph.label': '실시간 부모 유전 표적키 (Tanner MPH)',
      'quiz.region.label': '거주 지역 (지역 교육·탐구 인프라 연동)',
      'quiz.autostage.badge': '질병관리청 성장도표 기반 [성장단계 및 골연령 진행도] 자동 산출 완료',
      'quiz.autostage.manualLabel': '자동 산출된 성장 단계 확인 (병원 골연령 판독 결과가 다른 경우 수동 변경 가능)',
      'quiz.habits.label': '신체 성장을 저해하는 생활 습관 점검 (복수 선택)',
      'quiz.habits.hint': '성장 방해 요인을 교정하면 유전적 한계를 넘어 숨은 잠재키를 최대 5~6.7cm 추가 확보할 수 있습니다.',
      'quiz.cog.label': '중점 강화 희망 두뇌·학습 영역 (복수 선택)',
      'quiz.cog.hint': '현재 연령의 뇌 발달 주기에 부합하는 학습법과 교구·도서를 매칭합니다.',
      'quiz.submit.btn': '설문 응답 기반 정밀 진단 보고서 발행하기',
      'loader.desc': '생년월일 일수 보정 데이터와 학술 논문 3,894편 코퍼스를 대조하여 정밀 진단 보고서를 생성하고 있습니다.',
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
      'presets.badge': '연령대별 표준 데이터',
      'presets.title': '임상 케이스 표준 시뮬레이션 프리셋',
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
      'wizard.step1.title': '기본 인적 사항 및 생년월일 정밀 산출',
      'wizard.step1.sub': '생년월일 일수까지 정밀 보정하여 질병관리청(KDCA) 월령별 표준 백분위와 대조합니다.',
      'wizard.step2.title': '현재 신장 · 체중 · 최근 6개월 성장 속도 입력',
      'wizard.step2.sub': '현재 신체 백분위(Z-Score)와 연간 성장 속도(cm/yr)를 산출합니다.',
      'wizard.step3.title': '부모 신장 기반 유전 표적키(MPH) 및 거주 권역 설정',
      'wizard.step3.sub': 'Tanner 공식 기반 유전 예상키와 권역별 교육·체험 인프라를 매칭합니다.',
      'wizard.step4.title': '골연령 성장 단계 확인 및 수면·영양 대사 패턴 점검',
      'wizard.step4.sub': '성장호르몬 분비 효율과 직결되는 수면 품질 및 소화·영양 흡수 특성을 선택해 주세요.',
      'wizard.step5.title': '성장 저해 요인 및 척추 정렬 · 신체 활동량 점검',
      'wizard.step5.sub': '생활 습관 및 자세 교정 시 추가로 확보 가능한 잠재 신장(cm)을 계산합니다.',
      'wizard.step6.title': '세부 신체·학습 병목 최종 점검 및 정밀 보고서 발행',
      'wizard.step6.sub': '해당하는 항목을 선택하시면 2,918편 학술 데이터 기반 1:1 정밀 보고서가 즉시 발행됩니다.',

      // Form Labels
      'label.gender': '성별 구분',
      'label.gender.boy': '남아 (Male)',
      'label.gender.girl': '여아 (Female)',
      'label.age': '생년월일 (정밀 월령·일수 보정)',
      'label.height': '현재 신장',
      'label.weight': '현재 체중',
      'label.recentGrowth': '최근 6개월 성장폭',
      'label.fatherHeight': '아버지 신장 (유전 표적키 산출용)',
      'label.motherHeight': '어머니 신장 (유전 표적키 산출용)',
      'label.prev': '이전 단계',
      'label.next': '다음 단계',
      'label.scan': '정밀 진단 분석 시작',

      // Tanner Phases
      'phase.1.title': 'Phase 1. 기초 성장기 (Pre-Pubertal)',
      'phase.1.desc': '성장판 개방률 90% 이상, 연간 5~6cm 안정적 성장 구간',
      'phase.2.title': 'Phase 2. 급성장 피크기 (PHV Golden Time)',
      'phase.2.desc': '성장호르몬 및 IGF-1 분비 극대화, 연간 7~10cm 최대 가속 구간',
      'phase.3.title': 'Phase 3. 감속·성숙기 (Deceleration Phase)',
      'phase.3.desc': '2차 성징 후기, 성장판 폐쇄 전 잔여 잠재력 4~7cm 집중 확보 구간',
      'phase.4.title': 'Phase 4. 체형·자세 완성기 (Postural Recovery)',
      'phase.4.desc': '추간판 디스크 감압 및 척추·골반 정렬로 숨은 키 1.5~2.5cm 복원 구간',

      // Habits
      'habit.late_sleep': '22시 30분 이후 취침 (서파수면 성장호르몬 감소)',
      'habit.night_carbs': '취침 전 야식·당류 섭취 (인슐린 분비로 성장호르몬 억제)',
      'habit.poor_posture': '스마트폰·책상 거북목 및 흉추 후만 자세',
      'habit.picky_eater': '단백질·채소 편식 및 미량영양소 불균형',
      'habit.sedentary': '일일 30분 미만 신체 활동 부족 (성장판 자극 부족)',

      // Cognitive Axes
      'cog.math_logic': '수리·공간·도형 추론 역량',
      'cog.language_reading': '어휘·문해력·독해 역량',
      'cog.science_nature': '과학·수리 원리 탐구 역량',
      'cog.sensory_arts': '시공간 감각·창의 융합 역량',
      'cog.executive_focus': '전두엽 작업기억·집중 지속력',

      // Loader
      'loader.step1': '질병관리청(KDCA) 성장도표 및 K-DST 발달 지표 대조 중...',
      'loader.step2': 'Z-Score 표준화 및 3단 성인 예측키 궤적 모델링 연산 중...',
      'loader.step3': '호르몬 분비 효율 및 5각 두뇌 밸런스 프로토콜 생성 완료.',
      'loader.skip': '대기 없이 진단 결과 즉시 확인하기',

      // Results
      'rx.retest': '설문 정보 다시 입력하기',
      'rx.standard.kdca': '질병관리청(KDCA 2017) 소아청소년 성장도표 및 K-DST 발달기준 정밀 판독 완료',
      'rx.standard.cdc': 'US CDC 2000 & WHO Clinical Growth Standards Applied',

      // Deep Child Trait Questions (Clean Clinical Terminology, Zero Emojis)
      'quiz.trait.sleep.label': '수면 개시 시각 및 야간 숙면 품질 점검 (복수 선택)',
      'quiz.trait.sleep.hint': '성장호르몬(GH)의 65~70%가 분비되는 야간 서파수면(SWS) 효율을 평가합니다.',
      'quiz.trait.sleep.opt1': '21시 30분 이전 취침하며 깊은 숙면을 유지함',
      'quiz.trait.sleep.opt2': '22시 30분 이후 늦게 입면하는 경우가 잦음',
      'quiz.trait.sleep.opt3': '수면 중 잦은 뒤척임 또는 구강호흡(입 벌림)이 관찰됨',
      'quiz.trait.sleep.opt4': '취침 직전 우유·간식 등 야식 섭취 습관이 있음',
      'quiz.trait.sleep.opt5': '아침 기상 시 피로감이 크고 깨우기 어려움',
      'quiz.trait.sleep.opt6': '입면 초기 두경부(머리·목) 다한증이 나타남',
      'quiz.trait.sleep.opt7': '작은 소음에도 쉽게 각성하거나 잠꼬대가 잦음',
      'quiz.trait.sleep.opt8': '주중 수면 부족으로 주말에 장시간 보충 수면을 취함',
      'quiz.trait.diet.label': '식이 섭취량 및 위장관 소화·흡수 특성 점검 (복수 선택)',
      'quiz.trait.diet.hint': '골기질 합성에 필수적인 단백질·칼슘·아연·철분의 생체이용률을 평가합니다.',
      'quiz.trait.diet.opt1': '1회 식사량이 적고 조기 포만감을 호소함',
      'quiz.trait.diet.opt2': '육류(철분·아연) 및 채소류 편식 경향이 뚜렷함',
      'quiz.trait.diet.opt3': '우유·유제품 섭취 시 복통 또는 설사(유당불내증 의심)가 있음',
      'quiz.trait.diet.opt4': '주요 영양군을 편식 없이 균형 있게 섭취함',
      'quiz.trait.diet.opt5': '배변 주기가 불규칙하거나 기능성 변비 경향이 있음',
      'quiz.trait.diet.opt6': '정제 탄수화물(빵·면류) 및 단순당 간식 선호도가 높음',
      'quiz.trait.diet.opt7': '저작(씹기) 시간이 길거나 식후 소화불량이 잦음',
      'quiz.trait.diet.opt8': '일일 순수 수분 섭취량이 3컵(600ml) 미만임',
      'quiz.trait.posture.label': '척추·골반 정렬 상태 및 성장통 유무 점검 (복수 선택)',
      'quiz.trait.posture.opt1': '착석 및 스마트기기 시청 시 경추 전방전위(거북목)·흉추 후만',
      'quiz.trait.posture.opt2': '다리 꼬기·편측 체중 지지(짝다리)·W자 좌식 습관',
      'quiz.trait.posture.opt3': '야간 슬관절(무릎)·하퇴부(종아리) 성장통 호소',
      'quiz.trait.posture.opt4': '경추 및 요추의 정상 생리적 만곡과 바른 착석 자세 유지',
      'quiz.trait.posture.opt5': '착석 시 턱 괴기 또는 편측 기대기 자세 습관',
      'quiz.trait.posture.opt6': '보행 시 족부 피로감 호소 또는 편평족(평발) 경향',
      'quiz.trait.exercise.label': '주간 중강도 이상 신체 활동(성장판 압전 자극) 빈도',
      'quiz.trait.exercise.opt1': '주 1회 이하 · 실내 정적 활동 위주',
      'quiz.trait.exercise.opt2': '주 2~3회 · 체육 수업·줄넘기 등 중등도 활동',
      'quiz.trait.exercise.opt3': '주 4회 이상 · 규칙적인 유산소·점프 운동 수행',
      'quiz.trait.temp.label': '아동 신경인지 기질 및 과제 수행 성향 (복수 선택)',
      'quiz.trait.temp.opt1': '신체 활동 및 직접 실험을 통한 탐색 선호형',
      'quiz.trait.temp.opt2': '소근육 조작·조립·구조화 과제에 높은 몰입을 보이는 유형',
      'quiz.trait.temp.opt3': '원리 질문 및 언어적 상호작용(문답)을 선호하는 분석형',
      'quiz.trait.temp.opt4': '충분한 사전 관찰 후 신중하게 과제를 수행하는 숙고형',
      'quiz.trait.temp.opt5': '시각적 이미지·스토리텔링·예술적 표현에 강점을 보이는 유형',
      'quiz.trait.temp.opt6': '명확한 단기 목표와 성취 피드백이 주어질 때 동기화되는 유형',
      'quiz.trait.focus.label': '단일 학습 과제에 대한 전두엽 주의집중 지속 시간',
      'quiz.trait.focus.opt1': '10분 미만 · 짧은 단위의 모듈형 성취 과제가 필요함',
      'quiz.trait.focus.opt2': '15~20분 유지 · 단계별 구조화된 학습 루틴이 적합함',
      'quiz.trait.focus.opt3': '30분 이상 유지 · 심화 독해 및 프로젝트형 탐구가 가능함',
      'quiz.trait.learning.label': '현재 가장 두드러진 학습·인지 병목 구간 (복수 선택)',
      'quiz.trait.learning.hint': '선택하신 학습 병목의 신경인지적 원인을 규명하고 1:1 교정 학습법과 교재를 처방합니다.',
      'quiz.trait.learning.opt1': '긴 지문 및 서술형 문장제 문제의 핵심 구조 파악(문해력) 병목',
      'quiz.trait.learning.opt2': '단순 연산은 가능하나 도형·공간추론·응용 수학 전환 병목',
      'quiz.trait.learning.opt3': '수업 청취 후 자기주도 인출(백지복습) 및 장기기억 정착 병목',
      'quiz.trait.learning.opt4': '디지털 미디어(숏폼·게임) 도파민 과노출로 인한 텍스트 몰입 저하',
      'quiz.trait.learning.opt5': '착석 지구력(15~20분 미만) 부족 및 외부 자극에 의한 주의 분산',
      'quiz.trait.learning.opt6': '어휘 인출 부족 및 논리적 말하기·서술형 답안 작성 병목',
      'quiz.trait.learning.opt7': '개념은 이해하나 문제 풀이 시 절차 누락·실수 및 시험 불안',
      'quiz.trait.learning.opt8': '일일 학습 분량 계획 수립 및 규칙적 자기주도 실행 습관 부재',
      'quiz.trait.studystyle.label': '아동의 인지 정보 처리 및 학습 흡수 우세 유형',
      'quiz.trait.studystyle.opt1': '질문·인출형 — 학습 내용을 말로 설명하고 문답할 때 장기기억 전환율이 가장 높음',
      'quiz.trait.studystyle.opt2': '조작·체험형 — 입체 교구·실험·구체물을 직접 조작할 때 개념 이해도가 가장 높음',
      'quiz.trait.studystyle.opt3': '시각·구조화형 — 도표·다이어그램·마인드맵으로 시각화할 때 정보 처리가 가장 빠름',
      'quiz.trait.studystyle.opt4': '목표·완수형 — 일일 정량 과업(워크북·체크리스트)을 완수할 때 학습 효능감이 극대화됨',
      'quiz.freenote.label': '추가 임상 참고 메모',
      'quiz.freenote.hint': '선택하신 객관식 설문 데이터를 바탕으로 1:1 맞춤 보고서를 발행합니다.',
      'quiz.freenote.placeholder': '예: 취침 시간이 늦고 편식이 있어 최종 예상키와 집중력이 고민됩니다.'
    },

    en: {
      // Header & Brand
      'brand.title': 'KIDS-FIT',
      'brand.tagline': 'Height · Physical · Mental Growth & Personalized Learning Platform',
      'trust.badge': 'Built on Official Standards: US CDC 2000, WHO & AAP Pediatric Auxology',
      'nav.auxology': 'Physical Growth & Auxology',
      'nav.endocrinology': 'Endocrinology & Bio-Nutrition',
      'nav.biomechanics': 'Biomechanics & Posture',
      'nav.neuro': 'Neuro-Cognitive Matrix',
      'nav.tracker': '90-Day Tracker & A4 PDF',
      'theme.dark': '🌙 Dark Mode',
      'theme.light': '☀️ Light Mode',
      'lang.toggle': '🇰🇷 한국어',

      // Hero
      'hero.badge': '🌱 Powered by US CDC 2000, WHO Growth Standards & 3,894 Clinical Papers · KIDS-FIT AI™',
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
      'services.basis': 'Clinical Basis: US CDC 2000 · WHO Growth Standards · ASQ-3 / AAP Milestones · 3,894-Paper DB',

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
      'loader.desc': 'Cross-referencing day-calibrated birth data with 3,894 peer-reviewed studies to compile your guidebook.',
      'results.tab1.title': 'Physical Growth Percentile & Bone Age Trajectory (Auxology)',
      'results.tab1.desc': 'K-GROWTH AI™ Z-Score, annual growth velocity, Tanner Mid-Parental Height (MPH ±8.5 cm), and 3-tier adult height simulation.',
      'results.tab2.title': '24-Hour Hormone Curve & Clinical Bio-Nutrition',
      'results.tab2.desc': 'Slow-wave sleep (SWS) GH suppression simulation (-52% max) and weight-proportional nutrient bioavailability gauges.',
      'results.tab3.title': 'Spinal Decompression & Epiphyseal Biomechanics Studio',
      'results.tab3.desc': 'Intervertebral disc rehydration (+1.8 cm) and Wolff\'s Law mechanical loading routines with interactive countdown timers.',
      'results.tab4.title': 'Neuro-Cognitive Matrix & Weekend Socratic Inquiry Roadmap',
      'results.tab4.desc': '5-axis neuro-cognitive balance radar chart, age-specific cortical development guide, and 3-step inquiry dialogue prompts.',
      'results.tab5.title': '90-Day Growth Tracker & Hospital-Style A4 Clinical Report',
      'results.tab5.desc': 'Continuous height/weight streak tracker and 1-click printable 2-page A4 clinical report.',
      'footer.disclaimer': 'Powered by proprietary KIDS-FIT AI™ algorithms and official US CDC 2000, WHO Growth Standards, AAP, PES, and ASQ-3 developmental milestones (3,894 papers). This guidebook is for educational and wellness guidance and does not replace medical diagnosis. Product recommendation links on this service are part of Amazon Associates and global affiliate programs, through which we may receive a commission.',

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
      'wizard.step1.sub': 'Calculates exact days since birth for US CDC 2000 & WHO LMS percentile comparison.',
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
      'rx.standard.kdca': 'KIDS-FIT AI™ · US CDC 2000, WHO & AAP Precision Analysis Complete',
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
      'quiz.trait.studystyle.opt1': '🗣️ Dialogue & Inquiry — Understands best when asking and explaining aloud (Socratic / Feynman)',
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
  function isGlobalPaidEditionLock() {
    try {
      if (typeof window !== 'undefined' && window.__KIDSFIT_GLOBAL_PAID_EDITION === false) return false;
      if (typeof window !== 'undefined' && window.__KIDSFIT_GLOBAL_PAID_EDITION === true) return true;
      if (typeof document !== 'undefined' && document.documentElement && typeof document.documentElement.getAttribute === 'function') {
        const edition = document.documentElement.getAttribute('data-edition');
        if (edition === 'global-paid') return true;
        if (edition === 'ko') return false;
      }
      if (typeof window !== 'undefined' && window.location) {
        const host = String(window.location.hostname || '').toLowerCase();
        const search = String(window.location.search || '').toLowerCase();
        if (search.indexOf('edition=ko') !== -1) return false;
        if (search.indexOf('edition=global') !== -1 || search.indexOf('paywall=1') !== -1) return true;
        if (host.indexOf('en.kidsfit.co.kr') !== -1 && typeof navigator !== 'undefined' && navigator.userAgent) {
          return true;
        }
      }
      if (typeof document === 'undefined') return true;
    } catch (_) {}
    return false;
  }

  let currentLang = isGlobalPaidEditionLock() ? 'en' : 'ko';
  let currentUnitSystem = isGlobalPaidEditionLock() ? 'imperial' : 'metric'; // 'metric' (cm, kg) or 'imperial' (ft/in, lbs)
  let prevUnitSystem = 'metric';

  function initI18n() {
    if (isGlobalPaidEditionLock()) {
      currentLang = 'en';
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('taller_lang', 'en');
          const savedUnit = window.localStorage.getItem('taller_unit');
          currentUnitSystem = (savedUnit === 'metric' || savedUnit === 'imperial') ? savedUnit : 'imperial';
        } catch (e) {
          currentUnitSystem = 'imperial';
        }
      } else {
        currentUnitSystem = 'imperial';
      }
    } else if (typeof window !== 'undefined' && window.localStorage) {
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
    return isGlobalPaidEditionLock() ? 'en' : currentLang;
  }

  function getUnitSystem() {
    return currentUnitSystem;
  }

  function setLanguage(lang) {
    if (lang !== 'ko' && lang !== 'en') return;
    if (isGlobalPaidEditionLock()) {
      lang = 'en';
    }
    const langChanged = currentLang !== lang;
    currentLang = lang;
    if (langChanged) {
      currentUnitSystem = lang === 'en' ? 'imperial' : 'metric';
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('taller_lang', currentLang);
        localStorage.setItem('taller_unit', currentUnitSystem);
      } catch (e) {}
    }

    updateDocumentLang();
    if (langChanged) {
      updateDOM();
    }
  }

  function toggleLanguage() {
    if (isGlobalPaidEditionLock()) {
      setUnitSystem(currentUnitSystem === 'imperial' ? 'metric' : 'imperial');
      return;
    }
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
      if (isGlobalPaidEditionLock()) {
        langBtn.textContent = currentUnitSystem === 'imperial' ? '🇺🇸 Units: ft/in · lbs' : '🌐 Units: cm · kg';
        langBtn.title = 'Toggle between Imperial (ft/in, lbs) and Metric (cm, kg)';
      } else {
        langBtn.textContent = currentLang === 'ko' ? '🇺🇸 EN (CDC)' : '🇰🇷 KO (KDCA)';
        langBtn.title = currentLang === 'ko' ? 'Switch to Global Mode (EN / CDC / Imperial)' : '한국어 모드로 전환 (KDCA / Metric)';
      }
    }

    // 3a. Translate extra quiz checkboxes & headers when in English
    if (currentLang === 'en') {
      const extraCheckboxMapEn = {
        'learning-literacy:reading_comprehension': 'Struggles to grasp the core structure of long passages or word problems',
        'learning-literacy:vocab_context': 'Gets stuck on unfamiliar vocabulary instead of inferring meaning from context',
        'learning-literacy:slow_subvocal': 'Reads very slowly or subvocalizes (moves lips while reading)',
        'learning-literacy:summary_expression': 'Finds it hard to summarize a book or express thoughts in words/writing after reading',
        'learning-literacy:active_reader': 'Actively enjoys reading books and understands context & subtext well',
        'learning-math:applied_math_block': 'Fast at basic arithmetic, but struggles to set up equations for word problems',
        'learning-math:spatial_logic_difficulty': 'Finds mental rotation, 3D nets, and spatial geometry problems especially difficult',
        'learning-math:formula_memorizer': 'Relies on rote formula memorization rather than conceptual proof; misses modified problems',
        'learning-math:error_transfer_gap': 'Repeats the same mistakes on similar problem types even after reviewing explanations',
        'learning-math:math_explorer': 'Enjoys finding patterns, logic puzzles, and exploring new mathematical principles',
        'learning-focus:distracted_desk': 'Finds it hard to sit at a desk for 15–20+ minutes; easily distracted by small noises or objects',
        'learning-focus:dopamine_media': 'Used to high-dopamine short-form video/games; gets bored quickly with text or study',
        'learning-focus:procrastination': 'Procrastinates starting homework or study tasks with frequent off-task behavior',
        'learning-focus:impulsive_mistakes': 'Skips reading full problem statements or makes frequent careless sign/calculation errors',
        'learning-focus:deep_focus': 'Immerses deeply for 30–40+ minutes when working on interesting topics or problems',
        'learning-meta:passive_illusion': 'Understands when listening to a teacher/tutor, but goes blank when solving alone',
        'learning-meta:metacognition_lack': 'Cannot close the book and explain or summarize what was just learned in their own words',
        'learning-meta:cramming_forget': 'Crams the night before tests and quickly forgets the material right after',
        'learning-meta:sleep_consolidation_loss': 'Studies or sleeps late at night, resulting in morning brain fog and daytime fatigue',
        'learning-meta:daily_retrieval_active': 'Has a habit of spending 15 minutes reviewing and asking questions about daily lessons',
        'trait-growth-detail:growing_pain_night': 'Frequent nighttime knee, calf, or ankle growing pains or lower-body fatigue',
        'trait-growth-detail:underweight_thin': 'Small meal volume and slow weight gain; tends to be underweight compared to peers',
        'trait-growth-detail:overweight_fat_gain': 'Weight (body fat) gaining faster than height; concerned about bone-age acceleration',
        'trait-growth-detail:rhinitis_mouth': 'Allergic rhinitis, nasal congestion, or mouth breathing disrupting deep slow-wave sleep',
        'trait-growth-detail:early_puberty_worry': 'Early pubertal signs (breast buds, body hair, scalp oil/odor) appearing earlier than peers',
        'trait-growth-detail:bone_age_delay': 'Shorter than peer average with annual height velocity slowing below 5 cm/yr (<2 in/yr)',
        'trait-growth-detail:dairy_calcium_lack': 'Low dairy intake or weak digestion raising concern for Calcium, Vitamin D3 & protein deficit',
        'trait-growth-detail:slouch_disc_loss': 'Forward head posture (tech neck) and slouched spine when seated causing hidden height loss'
      };
      Object.keys(extraCheckboxMapEn).forEach((k) => {
        const parts = k.split(':');
        const input = document.querySelector(`input[name="${parts[0]}"][value="${parts[1]}"]`);
        if (input && input.parentElement) {
          const pill = input.parentElement.querySelector('.chip-pill');
          if (pill) {
            const spans = pill.querySelectorAll('span');
            const targetSpan = spans.length > 0 ? spans[spans.length - 1] : pill;
            if (targetSpan) targetSpan.textContent = extraCheckboxMapEn[k];
          }
        }
      });

      const groupHeadersEn = [
        { id: 'learning-reading-literacy-group', label: 'Reading Habits & Cognitive Literacy Processing (Multi-Select)', hint: 'Evaluates long-passage comprehension, contextual vocabulary inference, and reading fluency based on cognitive linguistics.' },
        { id: 'learning-math-logic-group', label: 'Mathematical Logic & 3D Spatial Reasoning (Multi-Select)', hint: 'Diagnoses the cognitive transition from basic arithmetic to applied word problems and 3D spatial geometry.' },
        { id: 'learning-focus-dopamine-group', label: 'Prefrontal Attention Span & Digital Dopamine Habits (Multi-Select)', hint: 'Assesses prefrontal executive function (working memory, impulse control) and digital reward-circuit sensitivity.' },
        { id: 'learning-metacognition-group', label: 'Metacognitive Active Recall & SWS Memory Consolidation (Multi-Select)', hint: 'Evaluates hippocampal-to-neocortical sleep memory consolidation and blank-sheet self-explanation habits.' },
        { id: 'trait-growth-detail-group', label: 'Additional Auxology, Weight-for-Height & Endocrine Checkpoints (Multi-Select)', hint: 'Selected clinical checkpoints are directly integrated into your child\'s bespoke growth & bone-age report.' }
      ];
      groupHeadersEn.forEach((g) => {
        const grp = document.getElementById(g.id);
        if (grp && grp.parentElement) {
          const lbl = grp.parentElement.querySelector('.form-label');
          const hnt = grp.parentElement.querySelector('.section-hint');
          if (lbl) lbl.textContent = g.label;
          if (hnt) hnt.textContent = g.hint;
        }
      });

      const printTopBtn = document.getElementById('btn-print-report-top');
      if (printTopBtn) printTopBtn.textContent = '🖨️ Print / Save PDF Report';
      const rxTitle = document.getElementById('rx-header-title');
      if (rxTitle && /[가-힣]/.test(rxTitle.textContent)) {
        rxTitle.textContent = 'KIDS-FIT Personalized Clinical Growth & Brain LQ Report';
      }
      const progText = document.getElementById('quiz-progress-text');
      if (progText && progText.textContent.indexOf('완료') !== -1) {
        progText.textContent = progText.textContent.replace('완료', 'Completed');
      }
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

    // Note: Primary input element conversion is authoritatively managed by
    // OnboardingWizard.applyUnitSwitch() to eliminate double-conversion bugs.
    if (prevUnitSystem !== currentUnitSystem) {
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
    applyTranslations: updateDOM,
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
