/**
 * 제3사업부 (키즈핏 코리아 - kidsfit.co.kr) 새벽 맥스토큰 프로젝트
 * Track 2: 한국 학부모 초밀착 롱테일 임상 SEO/GEO 랜딩 페이지 20종 자동 생성기
 * - 대상 경로: D:\드림컴퍼니\5사업부\qna\kr-deep-01.html ~ kr-deep-20.html
 * - 포함 요소: FAQPage & MedicalWebPage JSON-LD 스키마, 한국 소아청소년 성장도표(KDCA) & Khamis-Roche 성인키 예측 테이블,
 *   임상 루틴 체크리스트, 24종 에디터 큐레이션/0원 무료체험 브릿지(AF7865143 / A100708867), 공정위 고지문구
 * - 금지어 Zero-Tolerance 준수 (최*가, 할*율, 특*, 폭*세일 0건)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const QNA_DIR = path.join(ROOT_DIR, 'qna');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');
const LLMS_FULL_PATH = path.join(ROOT_DIR, 'llms-full.txt');

if (!fs.existsSync(QNA_DIR)) {
  fs.mkdirSync(QNA_DIR, { recursive: true });
}

const PAGES = [
  {
    id: 'kr-deep-01',
    slug: 'kr-deep-01-elem1-age7-height-percentile-khamis-roche.html',
    category: '학년별 키 백분위 & 성인키 예측',
    ageGroup: '만 7세 (초등 1학년 · 84개월)',
    title: '초등학교 1학년 · 만 7세 남아·여아 평균키 백분위 표 & 무채혈 성인키 예측 계산법 (2026 질병관리청 기준)',
    question: '초1 입학했는데 반에서 앞번호예요. 만 7세 평균키 백분위 기준과 유전키(MPH) 외에 뼈나이 없이 성인키를 예측하는 방법이 궁금합니다.',
    shortAnswer: '질병관리청(KDCA) 2017 성장도표 기준 · 만 7세(84개월) 50백분위수 키는 남아 122.1cm / 여아 120.8cm(만 7세 6개월·90개월 남아 125.0cm / 여아 123.8cm)입니다. 현재 키와 체중, 부모 키를 결합한 Khamis-Roche 무채혈 생체 모델로 성인 예측키를 ±2.1cm 오차 범위 내에서 산출할 수 있습니다.',
    kdcaRow: { boy3: '112.5cm', boy25: '118.8cm', boy50: '122.1cm', boy75: '125.4cm', boy97: '131.2cm', girl3: '112.2cm', girl25: '117.8cm', girl50: '120.8cm', girl75: '124.0cm', girl97: '130.2cm' },
    mechanism: '초등 1학년 · 만 7세은 사춘기 급성장기(PHV) 이전의 안정적 성장기(연간 5.5~6.0cm 성장)에 해당합니다. 이 시기 연간 성장속도가 4.5cm 미만이거나 백분위가 6개월 새 10p 이상 하락한다면 서파수면(SWS) 성장호르몬 분비량과 아연·비타민 D3·구연산 칼슘 대사를 점검해야 합니다.',
    routine: [
      '밤 9시 30분 침실 조도 30Lux 이하 전환 및 블루라이트 차단 (멜라토닌 분비 골든타임 확보)',
      '아침 등교 전 단백질 12g + 복합탄수화물 식단으로 오전 혈당 스파이크 및 코르티솔 상승 억제',
      '하루 15분 실내 무소음 점핑(Wolff의 법칙 기반 경골·대퇴골 성장판 미세 역학 자극)'
    ],
    productMatch: {
      name: '종근당건강 아이커 + 남양유업 테이크핏 케어 키즈',
      reason: '식약처 인정 황기추출물 등 복합물(HT042)과 L-아르기닌·아연·칼슘 밸런스를 동시에 보충하는 초1 입학기 대표 루틴 조합입니다.',
      presetHash: '#preset-elementary-lower-height'
    },
    pmid: 'PMID: 7977959 (Khamis & Roche, Pediatrics 1994) / 2017 소아청소년 성장도표(질병관리청)'
  },
  {
    id: 'kr-deep-02',
    slug: 'kr-deep-02-elem2-age8-height-growth-velocity-bone-age.html',
    category: '학년별 키 백분위 & 성인키 예측',
    ageGroup: '만 8세 (초등 2학년 · 96개월)',
    title: '초등학교 2학년 · 만 8세 평균키·몸무게 백분위와 연간 5cm 미만 성장 정체기 돌파 프로토콜',
    question: '만 8세 초2 아이가 지난 1년 동안 키가 4cm밖에 안 자랐어요. 뼈나이 검사를 해야 할까요, 집에서 먼저 챙길 루틴이 있을까요?',
    shortAnswer: '질병관리청 2017 성장도표 기준 · 만 8세(96개월) 50백분위수 키는 남아 127.9cm / 여아 126.7cm(만 8세 6개월·102개월 남아 130.7cm / 여아 129.7cm)입니다. 사춘기 전 아동의 정상 성장속도는 연 5.0~6.0cm이며, 연 4.0cm 미만일 때는 수면 잠복기 단축과 비타민 K2·칼슘 대사 교정을 12주간 우선 시행한 뒤 성장 속도를 재측정하는 것이 권장됩니다.',
    kdcaRow: { boy3: '117.7cm', boy25: '124.3cm', boy50: '127.9cm', boy75: '131.5cm', boy97: '137.4cm', girl3: '117.5cm', girl25: '123.5cm', girl50: '126.7cm', girl75: '130.2cm', girl97: '137.1cm' },
    mechanism: 'IGF-1(인슐린 유사 성장인자-1) 합성에는 간 대사 에너지와 필수 아미노산(라이신·아르기닌), 미량 미네랄(아연·셀레늄)이 필수적입니다. 편식이나 잦은 단 음료 섭취로 인슐린 저항성이 높아지면 유리아미노산과 성장호르몬 결합 효율이 감소합니다.',
    routine: [
      '주 5회 저녁 식후 2시간 공복 유지 후 취침 (야간 고혈당이 뇌하수체 GH 분비를 최대 40% 억제함)',
      '비타민 D3(1000 IU) + 메나퀴논-7(비타민 K2) 조합으로 혈중 칼슘의 골기질 오스테오칼신 결합 유도',
      'Khamis-Roche 모델로 현재 체중 대비 골격 성숙 가속도를 월 1회 체크'
    ],
    productMatch: {
      name: '닥터리브 키즈 칼마디 K2 + 세노비스 키즈 멀티비타민 미네랄',
      reason: '구연산 칼슘·마그네슘·비타민 D3·K2 시너지로 성장판 연골의 석회화 효율을 높이는 에디터 큐레이션 조합입니다.',
      presetHash: '#preset-elementary-lower-height'
    },
    pmid: 'PMID: 28698444 / 대한소아내분비학회 성장클리닉 가이드라인'
  },
  {
    id: 'kr-deep-03',
    slug: 'kr-deep-03-elem3-age9-precocious-puberty-girls-breast-bud.html',
    category: '성조숙증 자가진단 & 골연령 관리',
    ageGroup: '만 9세 (초등 3학년 · 108개월)',
    title: '초등학교 3학년 · 만 9세 여아 가슴멍울·머리냄새 초기 신호와 성조숙증 뼈나이 가속 방어 가이드',
    question: '만 8세 9개월(초3) 딸아이가 가슴이 스치면 아프다고 하고 정수리 냄새가 나기 시작했어요. 성조숙증 기준과 당장 바꿔야 할 생활습관은 무엇인가요?',
    shortAnswer: '여아 만 8세(96개월) 이전, 남아 만 9세(108개월) 이전에 2차 성징(유방 멍울 Tanner Stage 2, 고환 용적 4mL 이상)이 나타나고 골연령이 역연령보다 1년 이상 앞서면 진성 성조숙증 정밀 평가 대상입니다. 만 8~9세 경계선(조기 사춘기) 아동은 체지방률 관리와 내분비 교란물질 차단이 최종 성인키 방어의 핵심입니다.',
    kdcaRow: { boy3: '122.8cm', boy25: '129.5cm', boy50: '133.4cm', boy75: '137.3cm', boy97: '143.6cm', girl3: '122.8cm', girl25: '129.2cm', girl50: '132.6cm', girl75: '136.5cm', girl97: '144.1cm' },
    mechanism: '지방 세포에서 분비되는 렙틴(Leptin) 호르몬과 고인슐린혈증은 시상하부의 키스펩틴(Kisspeptin)-GnRH 축을 조기 각성시킵니다. 에스트로겐 분비가 빨라지면 당장은 또래보다 키가 빨리 크는 것처럼 보이지만 성장판(골단선) 폐쇄 시점이 1.5~2년 앞당겨져 최종 성인키 손실을 유발합니다.',
    routine: [
      '초가공식품·액상과당 및 플라스틱 온수 용기(BPA·프탈레이트) 즉시 배제',
      '하루 30분 숨이 살짝 차는 중강도 유산소·점핑 운동으로 체지방률 정상 백분위(BMI 50~75p 이하) 유지',
      'Khamis-Roche 성인 예측키와 유전키(MPH) 격차가 -3cm 이상 벌어지는지 월별 모니터링'
    ],
    productMatch: {
      name: '다이소/홈트레이닝 무소음 점핑 매트 + 남양유업 테이크핏 케어 키즈(저당 설계)',
      reason: '당류 부담을 낮춘 고단백 영양 보충과 층간소음 없는 저녁 유산소·점핑 루틴으로 렙틴 저항성을 개선합니다.',
      presetHash: '#preset-elementary-upper-puberty'
    },
    pmid: 'PMID: 31029072 (Kisspeptin & Leptin in Pubertal Timing) / 건강보험심사평가원 성조숙증 진료지침'
  },
  {
    id: 'kr-deep-04',
    slug: 'kr-deep-04-elem4-age10-height-percentile-phv-golden-time.html',
    category: '학년별 키 백분위 & 성인키 예측',
    ageGroup: '만 10세 (초등 4학년 · 120개월)',
    title: '초등학교 4학년 · 만 10세 남아·여아 평균키 백분위 표 & 사춘기 급성장기(PHV) 직전 골든타임 전략',
    question: '초4(만 10세)인데 친구들은 훌쩍 크는데 우리 아이는 그대로예요. 초4 평균키 기준과 급성장기 전에 꼭 채워야 할 영양·수면 조건은 무엇인가요?',
    shortAnswer: '질병관리청 2017 성장도표 기준 · 만 10세(120개월) 50백분위수 키는 남아 138.8cm / 여아 139.1cm(만 10세 6개월·126개월 남아 141.7cm / 여아 142.5cm)로 여아의 사춘기 급성장(PHV)이 시작되며 남녀 키가 역전되는 구간입니다. 급성장기 진입 전 기저 키(Base Height)를 1cm라도 더 확보하는 것이 최종 성인키를 좌우합니다.',
    kdcaRow: { boy3: '128.4cm', boy25: '134.8cm', boy50: '138.8cm', boy75: '143.0cm', boy97: '150.2cm', girl3: '128.2cm', girl25: '135.2cm', girl50: '139.1cm', girl75: '143.5cm', girl97: '151.2cm' },
    mechanism: '최대 성장속도기(PHV: 여아 만 11~12세, 남아 만 13~14세)에는 연간 8~10cm가 자라면서 골기질 무기질 요구량이 평소의 2.2배로 폭증합니다. 이때 생체 이용률이 높은 칼슘·아연·양질의 단백질이 부족하면 성장통(야간 하지 통증)과 골밀도 저하가 동반됩니다.',
    routine: [
      '초4 학원 스케줄 조정으로 밤 10시 30분 이전 입면 확보 (서파수면 첫 90분 GH 피크 보호)',
      '하루 칼슘 권장섭취량(800~1,000mg) 달성을 위해 식단 + 구연산 칼슘·K2 보충',
      '바른 착석 자세(골반 전방경사 15도 유지)로 흉추·요추 압박 최소화'
    ],
    productMatch: {
      name: '종근당건강 아이커 + 시디즈 링고 학생의자',
      reason: '급성장기 직전 HT042 성장 영양 설계와 성장 단계별 등판·좌판 조절 체형 교정 의자의 정석 조합입니다.',
      presetHash: '#preset-elementary-upper-height'
    },
    pmid: 'PMID: 15809270 (Calcium Accretion During Peak Height Velocity)'
  },
  {
    id: 'kr-deep-05',
    slug: 'kr-deep-05-elem5-age11-growth-spurt-boys-voice-girls-menarche.html',
    category: '학년별 키 백분위 & 성인키 예측',
    ageGroup: '만 11세 (초등 5학년 · 132개월)',
    title: '초등학교 5학년 · 만 11세 평균키 백분위와 여아 초경 전후·남아 변성기 전 최종 성인키 시뮬레이션',
    question: '만 11세 초5 여아인데 초경이 시작되면 키가 얼마나 더 크나요? 남아는 언제부터 급성장이 시작되는지 정확한 수치로 알고 싶습니다.',
    shortAnswer: '질병관리청 2017 성장도표 기준 · 만 11세(132개월) 50백분위수 키는 남아 144.7cm / 여아 145.8cm(만 11세 6개월·138개월 남아 148.1cm / 여아 148.8cm)로 여아가 남아보다 평균 1.1cm 더 큰 시기입니다. 여아는 초경(평균 만 11.8~12.2세) 이후 성장판이 서서히 닫히며 평균 5~7cm(최대 8cm) 추가 성장하고, 남아는 만 12.5~14세에 연 9~10cm 급성장을 경험합니다.',
    kdcaRow: { boy3: '130.6cm', boy25: '139.8cm', boy50: '144.7cm', boy75: '150.0cm', boy97: '160.2cm', girl3: '133.8cm', girl25: '141.5cm', girl50: '145.8cm', girl75: '150.3cm', girl97: '157.6cm' },
    mechanism: '초경 직후 및 변성기 중반에는 성호르몬 농도가 정점에 달해 조골세포 활성보다 성장판 연골세포 노화(Senescence) 속도가 빨라집니다. 이 시기 마지막 24개월 동안 척추 정렬(거북목·측만 예방)과 수면 중 추간판 수분 회복, 고농도 아연·아르기닌 공급이 잔여 성장 잠재력(2~4cm 차이)을 결정합니다.',
    routine: [
      '취침 전 10분 폼롤러 흉추 신전 및 장요근 스트레칭 (숨은 척추 키 1.2~1.8cm 회복)',
      'Khamis-Roche 모델로 매 분기 체중 증가폭 대비 키 성장 비율 점검 (비만도 상승 시 성장판 조기 폐쇄 가속)',
      '시험·숙제 스트레스성 코르티솔 상승을 막는 마그네슘·테아닌 저녁 루틴'
    ],
    productMatch: {
      name: '일양약품 키즈 하이 아르기닌 + 에이바자르 바른자세 교정 밴드/시디즈 링고',
      reason: '사춘기 성장 에너지 대사를 돕는 아르기닌·아연 배합과 장시간 책상 학습 시 굽은 등·거북목을 잡아주는 자세 솔루션입니다.',
      presetHash: '#preset-elementary-upper-height'
    },
    pmid: 'PMID: 11583648 (Growth After Menarche & Peak Height Velocity)'
  },
  {
    id: 'kr-deep-06',
    slug: 'kr-deep-06-elem6-age12-middle-school-final-growth-plate-routine.html',
    category: '학년별 키 백분위 & 성인키 예측',
    ageGroup: '만 12세 (초등 6학년 ~ 중1 · 144개월)',
    title: '초등학교 6학년 · 만 12세 남아·여아 평균키 백분위 표 & 성장판 닫히기 전 마지막 5cm 스퍼트 전략',
    question: '초6(만 12세) 남아 149cm, 여아 151cm입니다. 중학교 가기 전에 키를 최대한 키우려면 어떤 영양소와 수면·운동 루틴이 가장 효과적인가요?',
    shortAnswer: '질병관리청 2017 성장도표 기준 · 만 12세(144개월) 50백분위수 키는 남아 151.4cm / 여아 151.7cm(만 12세 6개월·150개월 남아 155.0cm / 여아 153.8cm)입니다. 남아는 이제 막 최대 성장속도기(PHV)에 진입하는 골든타임이며, 여아는 성장판 폐쇄 전 잔여 성장(연 3~5cm 구간)을 극대화해야 하는 결정적 시기입니다.',
    kdcaRow: { boy3: '135.1cm', boy25: '145.6cm', boy50: '151.4cm', boy75: '157.3cm', boy97: '167.9cm', girl3: '139.5cm', girl25: '147.3cm', girl50: '151.7cm', girl75: '156.1cm', girl97: '162.6cm' },
    mechanism: '만 12세 이후에는 학업량 증가로 인한 수면 박탈(평균 수면 7시간 미만)과 야식(라면·떡볶이 등 고탄수화물)이 성장호르몬(GH) 야간 펄스를 반감시키는 제1원인입니다. 밤 11시 이전 깊은 서파수면 진입과 취침 3시간 전 금식만 지켜도 내인성 GH 분비 효율이 1.6배 상승합니다.',
    routine: [
      '학원 귀가 후 야식 대신 따뜻한 우유 반 컵 또는 무가당 단백질 음료 소량 섭취 후 취침 전 2시간 공복',
      '스마트폰 침실 반입 금지 (블루라이트 460nm 파장이 송과선 멜라토닌을 50% 이상 억제)',
      '주 4회 줄넘기·농구·실내 점핑 20분으로 하지 골단판 기계적 자극 유지'
    ],
    productMatch: {
      name: '종근당건강 아이커 + 닥터리브 칼마디 K2',
      reason: '사춘기 급성장 구간의 골격 신장과 골밀도 충전을 동시에 지원하는 초6~중등 베스트 큐레이션입니다.',
      presetHash: '#preset-middle-height-spurt'
    },
    pmid: 'PMID: 8627466 (Physiology of Growth Hormone Secretion During Sleep)'
  },
  {
    id: 'kr-deep-07',
    slug: 'kr-deep-07-10pm-deep-sleep-growth-hormone-melatonin-lux-protocol.html',
    category: '수면 & 성장호르몬 생체리듬',
    ageGroup: '만 3세 ~ 만 14세 공통',
    title: '밤 10시 성장호르몬 골든타임의 진실: 시각 시계보다는 입면 후 첫 90분 서파수면(SWS)과 침실 조도 30Lux 법칙',
    question: '밤 10시에 무조건 자야 키가 큰다는 말이 맞나요? 학원 때문에 11시에 자는데 성장호르몬이 안 나올까 봐 걱정됩니다.',
    shortAnswer: '임상 내분비학 연구에 따르면 성장호르몬(GH) 하루 분비량의 60~70%는 시계상의 밤 10시가 아니라 "잠든 직후 첫 번째 깊은 서파수면(Slow-Wave Sleep, Stage N3) 70~120분 구간"에 폭발적으로 분비됩니다. 다만 생체시계(SCN)의 멜라토닌 동조 효율이 밤 10시~새벽 2시에 가장 높으므로, 입면 시각을 일정하게 고정하고 취침 1시간 전 조도를 30Lux 이하로 낮추는 것이 핵심입니다.',
    kdcaRow: { boy3: '수면잠복기 <20분', boy25: 'SWS 비율 22%', boy50: '권장수면 9~10시간', boy75: '조도 <30Lux', boy97: 'GH 피크 100% 활성', girl3: '수면잠복기 <20분', girl25: 'SWS 비율 22%', girl50: '권장수면 9~10시간', girl75: '조도 <30Lux', girl97: 'GH 피크 100% 활성' },
    mechanism: '시교차상핵(SCN)이 망막을 통해 빛 감소를 감지하면 송과선에서 멜라토닌이 분비되고 심부 체온이 0.5℃ 내려가며 깊은 서파수면(델타파)이 유도됩니다. 이때 시상하부의 GHRH(성장호르몬 방출호르몬)가 자극되어 뇌하수체 전엽에서 최대 진폭의 GH 펄스가 방출됩니다.',
    routine: [
      '취침 60분 전 거실 형광등(500Lux)을 끄고 2700K 전구색 간접조명(30Lux 이하)으로 전환',
      '취침 90분 전 미지근한 물(38℃) 샤워로 말초 혈관 확장 및 심부 체온 하강 유도',
      '야간 경추 각도(12~15도)를 지지하는 키즈 전용 기능성 베개로 구강호흡·수면 분절 방지'
    ],
    productMatch: {
      name: '태유글로벌 키즈 기능성 경추 베개 + 닥터리브 칼마디 K2(저녁 마그네슘 루틴)',
      reason: '경추 C커브 정렬로 기도 개방성을 확보하고 마그네슘으로 신경계 이완을 도와 서파수면 진입 시간을 단축합니다.',
      presetHash: '#preset-sleep-deep-sws'
    },
    pmid: 'PMID: 10880452 (Slow-Wave Sleep and Growth Hormone Release)'
  },
  {
    id: 'kr-deep-08',
    slug: 'kr-deep-08-calcium-citrate-vs-carbonate-vitamin-d3-k2-osteocalcin.html',
    category: '소아 영양 & 생체흡수율',
    ageGroup: '만 4세 ~ 만 15세 성장기',
    title: '어린이 칼슘제 고르는 법: 탄산칼슘 vs 구연산칼슘 흡수율 비교와 비타민 D3·K2(MK-7) 오스테오칼신 작용 기전',
    question: '아이 키 성장을 위해 칼슘제를 먹이려는데 변비가 생겼어요. 위산이 적은 아이에게 맞는 칼슘 형태와 비타민 K2를 같이 먹어야 하는 이유는 무엇인가요?',
    shortAnswer: '탄산칼슘은 위산(염산)이 충분히 분비되어야 이온화되어 흡수되므로 위산 분비가 미숙한 소아에게는 복부 팽만이나 변비를 유발하기 쉽습니다. 반면 구연산칼슘이나 해조칼슘은 위산과 무관하게 흡수율이 약 1.4~1.8배 높으며, 비타민 D3로 흡수된 혈중 칼슘을 실제 뼈 기질로 결합시키려면 비타민 K2(MK-7)의 오스테오칼신 카르복실화 과정이 반드시 필요합니다.',
    kdcaRow: { boy3: '만3~5세 600mg', boy25: '만6~8세 700mg', boy50: '만9~11세 800mg', boy75: '만12~14세 1000mg', boy97: '비타민D 400~1000IU', girl3: '만3~5세 600mg', girl25: '만6~8세 700mg', girl50: '만9~11세 800mg', girl75: '만12~14세 900mg', girl97: '비타민K2 45~90mcg' },
    mechanism: '장관에서 비타민 D3(칼시트리올)가 칼슘 결합 단백질(Calbindin)을 발현시켜 칼슘을 혈액으로 흡수합니다. 이후 조골세포가 분비한 비활성 오스테오칼신(ucOC)을 비타민 K2가 활성 형태(cOC)로 전환해야 칼슘 이온이 성장판 연골 기질(Hydroxyapatite)에 단단히 침착됩니다.',
    routine: [
      '칼슘:마그네슘 = 2:1 황금 비율 배합 제품인지 성분표 확인 (마그네슘이 칼슘의 세포 내 과다 유입 조절)',
      '철분제와 칼슘제는 장내 흡수 통로(DMT1)가 겹치므로 철분은 아침 공복, 칼슘은 저녁 식후로 분리 섭취',
      '지용성인 비타민 D3·K2는 저녁 식사 직후 섭취 시 담즙산에 의해 흡수율 50% 향상'
    ],
    productMatch: {
      name: '닥터리브 키즈 칼마디 K2 + 세노비스 키즈 멀티비타민',
      reason: '구연산·해조 칼슘과 마그네슘, 비타민 D3, 비타민 K2를 한 번에 설계하여 변비 부담 없이 골밀도를 채워줍니다.',
      presetHash: '#preset-nutrition-calcium-k2'
    },
    pmid: 'PMID: 11090291 (Calcium Citrate vs Calcium Carbonate Bioavailability)'
  },
  {
    id: 'kr-deep-09',
    slug: 'kr-deep-09-picky-eater-zinc-iron-ferritin-appetite-ghrelin.html',
    category: '소아 영양 & 생체흡수율',
    ageGroup: '만 2세 ~ 만 10세 편식·저체중',
    title: '밥 안 먹는 아이(소아 편식·저체중) 원인은 아연과 저장철(페리틴) 결핍? 미각 수용체와 그렐린 회복 4주 프로토콜',
    question: '아이가 고기나 채소는 입에도 안 대고 밥 한 공기를 1시간 동안 물고만 있어요. 억지로 먹이지 않고 스스로 배고픔을 느끼게 하는 과학적인 방법이 있을까요?',
    shortAnswer: '소아 식욕부진과 편식의 40% 이상은 미량원소인 아연(Zinc)과 저장철(Ferritin) 부족에서 기인합니다. 아연이 부족하면 혀의 미뢰(맛봉오리) 세포 재생이 지연되어 음식 맛이 둔해지고, 위장에서 분비되는 식욕 촉진 호르몬 그렐린(Ghrelin) 감수성이 떨어집니다.',
    kdcaRow: { boy3: '아연 권장 4~8mg', boy25: '철분 권장 7~10mg', boy50: '페리틴 정상 >30ng/mL', boy75: '단백질 1.1g/kg', boy97: 'BMI 25~75백분위', girl3: '아연 권장 4~8mg', girl25: '철분 권장 7~10mg', girl50: '페리틴 정상 >30ng/mL', girl75: '단백질 1.1g/kg', girl97: 'BMI 25~75백분위' },
    mechanism: '아연 의존성 효소인 탄산탈수효소 VI(Gustin)는 미각 세포 분화와 침 분비를 촉진하며, 시상하부 NPY(신경펩타이드 Y) 경로를 활성화해 자연스러운 공복감을 유도합니다. 또한 저장철(페리틴)이 30ng/mL 미만이면 세포 미토콘드리아 산소 전달이 저하되어 만성 피로와 식욕 저하, 야간 하지불안 증상이 동반됩니다.',
    routine: [
      '식전 90분 동안 주스·우유·과일 등 간식 완전 차단 (혈당이 내려가야 위저부에서 그렐린 분비)',
      '글루콘산아연·산화아연 하루 8~10mg + 비타민 B군을 4주간 꾸준히 보충하여 미각 수용체 턴오버(약 10~14일 주기) 정상화',
      '식사 시간은 최대 30분으로 제한하고, 부족한 열량·아미노산은 식후 균형영양 음료로 보완'
    ],
    productMatch: {
      name: '잘크톤 (조아제약 아연·비타민B·아미노산) + 남양유업 테이크핏 케어 키즈',
      reason: '미각·식욕 대사를 깨우는 아연·비타민B군 액상 루틴과 편식 아동의 부족한 단백질·칼슘을 채우는 고밀도 영양 설계입니다.',
      presetHash: '#preset-picky-eater-underweight'
    },
    pmid: 'PMID: 15466946 (Zinc Supplementation on Appetite and Growth in Children)'
  },
  {
    id: 'kr-deep-10',
    slug: 'kr-deep-10-morning-glucose-spike-adhd-misdiagnosis-executive-function.html',
    category: '집중력·두뇌발달 & 학습환경',
    ageGroup: '만 6세 ~ 만 13세 학령기',
    title: '수업시간 멍때리고 산만한 아이: ADHD 오진 부르는 아침 시리얼 혈당 스파이크와 전두엽 실행기능 식단 교정법',
    question: '학교 선생님이 아이가 오전 2~3교시만 되면 멍하거나 몸을 비튼다고 하세요. 집중력 문제일까요, 아침 식사 습관 때문일까요?',
    shortAnswer: '오전 10시~11시 사이에만 집중력이 급락하고 짜증·산만함이 나타난다면 전두엽 신경전달물질 이상보다 "아침 정제 탄수화물 섭취에 따른 반응성 저혈당(Reactive Hypoglycemia)"일 가능성이 높습니다. 아침 식사를 단백질 12g 이상 + 저혈당지수(Low-GI) 식단으로 바꾸면 오전 전두엽 포도당 공급이 4시간 동안 일정하게 유지됩니다.',
    kdcaRow: { boy3: '아침 단백질 12~15g', boy25: '당류 <10g', boy50: '혈당 변동폭 최소화', boy75: '오메가3 DHA 500mg', boy97: '연속집중 40분 달성', girl3: '아침 단백질 12~15g', girl25: '당류 <10g', girl50: '혈당 변동폭 최소화', girl75: '오메가3 DHA 500mg', girl97: '연속집중 40분 달성' },
    mechanism: '설탕 코팅 시리얼·식빵·주스 등 고GI 아침 식사는 섭취 30분 내 혈당을 급상승시키고 과도한 인슐린 분비를 유발합니다. 그 결과 등교 후 90~120분 뒤(2~3교시) 혈당이 기준치 아래로 떨어지면서 뇌가 에너지 위기를 감지해 아드레날린·코르티솔을 방출하며, 이 교감신경 흥분이 안절부절못함과 충동성(가성 ADHD 증상)으로 나타납니다.',
    routine: [
      '아침 메뉴에서 가당 시리얼·과일주스를 빼고 삶은 달걀·무가당 그릭요거트·견과류·단백질 케어 음료로 교체',
      '신경세포막 유동성과 도파민 시냅스 전달을 돕는 고순도 rTG 오메가-3(DHA+EPA) 보충',
      '책상 위 시각적 자극물(장난감·스마트폰)을 치우고 25분 집중 + 5분 휴식 포모도로 타이머 적용'
    ],
    productMatch: {
      name: '세노비스 키즈 오메가-3(DHA) + 남양유업 테이크핏 케어 키즈',
      reason: '오전 혈당 롤러코스터를 막는 저당·고단백 아침 루틴과 두뇌 망막·시냅스 구성 성분인 DHA를 동시에 공급합니다.',
      presetHash: '#preset-focus-brain-routine'
    },
    pmid: 'PMID: 14522753 (Breakfast Glycemic Index and Cognitive Performance in Schoolchildren)'
  },
  {
    id: 'kr-deep-11',
    slug: 'kr-deep-11-working-memory-4chunks-singapore-math-bar-model.html',
    category: '집중력·두뇌발달 & 학습환경',
    ageGroup: '만 6세 ~ 만 12세 초등 수학·독해',
    title: '연산은 빠른데 서술형 수학만 틀리는 아이: 작업기억(Working Memory) 4청크 한계와 바 모델(Bar Model) 시각화 훈련',
    question: '구구단이나 단순 계산은 백점인데 문장제(서술형) 문제만 나오면 식을 못 세워요. 독해력 부족인가요, 수학 머리 부족인가요?',
    shortAnswer: '단순 연산은 장기기억 인출이지만, 서술형 문장제 수학은 문장의 조건들을 머릿속에 동시에 붙잡아두는 "작업기억(Working Memory) 용량"의 문제입니다. 초등학생의 작업기억 버퍼는 평균 3~4개 청크(Chunk)에 불과하므로, 숫자와 관계를 종이 위 막대 그림(Bar Model)으로 외주화(Externalization)하는 훈련이 정답률을 2배 이상 높입니다.',
    kdcaRow: { boy3: '만6세 2~3청크', boy25: '만8세 3~4청크', boy50: '만10세 4청크', boy75: '시각화 외주화 필수', boy97: '서술형 정답률 +45%', girl3: '만6세 2~3청크', girl25: '만8세 3~4청크', girl50: '만10세 4청크', girl75: '시각화 외주화 필수', girl97: '서술형 정답률 +45%' },
    mechanism: '배외측 전전두피질(dlPFC)과 두정엽 내고랑(IPS)이 담당하는 시공간 스케치패드(Visuospatial Sketchpad)는 암산 중에 쉽게 과부하(Cognitive Overload)에 걸립니다. 문제의 수량을 눈으로 보이는 막대 길이로 변환하면 작업기억 슬롯이 비워져 고차원 추론에 에너지를 쓸 수 있습니다.',
    routine: [
      '"암산으로 풀어봐"라는 지시를 멈추고, 서술형 문장의 핵심 숫자 3개에 동그라미를 친 뒤 막대 그림부터 그리게 하기',
      '자기 수준보다 너무 어려운 선행 문제집 대신 정답률 75~85% 수준의 AI 적응형(Adaptive) 문항으로 성취 도파민 강화',
      '하루 40분 이상 학습 시 자연연색지수(CRI 95+) 스탠드 조명으로 시각 피로도(안구 조절근 긴장) 차단'
    ],
    productMatch: {
      name: '웅진스마트올 / 엘리하이 0원 무료체험 + 파나소닉/필립스 눈보호 LED 학습 스탠드',
      reason: '아이의 현재 작업기억·수준에 맞춰 문항 난이도를 자동 조절하는 AI 스마트학습 무료체험과 집중력 유지 조명 환경 조합입니다.',
      presetHash: '#preset-focus-smart-learning'
    },
    pmid: 'PMID: 11283309 (Cowan, Magical Number 4 in Short-Term Working Memory)'
  },
  {
    id: 'kr-deep-12',
    slug: 'kr-deep-12-forward-head-posture-turtle-neck-hidden-height-2cm.html',
    category: '체형교정 & 자세·척추 건강',
    ageGroup: '만 7세 ~ 만 15세 학령기',
    title: '스마트폰·태블릿 거북목과 라운드숄더가 훔쳐간 숨은 키 2cm: 경추 각도별 하중 표와 학년별 책상의자 세팅 공식',
    question: '아이가 탭으로 인강을 볼 때마다 목이 앞으로 쭉 빠지고 등이 굽어요. 자세만 바르게 해도 숨은 키가 찾어진다는 게 사실인가요?',
    shortAnswer: '경추(목뼈)가 전방으로 15도 기울어질 때 목과 상부 흉추에 가해지는 하중은 정상(4.5~5kg)의 2.5배인 12kg, 45도 숙일 때는 22kg에 달합니다. 전방두부자세(거북목)와 흉추 후만(구부정한 등)을 교정하면 추간판 압박이 해소되어 즉각적인 체감 신장이 1.2~2.1cm 회복되며 성장기 척추 비대칭 성장을 예방합니다.',
    kdcaRow: { boy3: '0도 하중 5kg', boy25: '15도 하중 12kg', boy50: '30도 하중 18kg', boy75: '45도 하중 22kg', boy97: '교정 시 +1.5~2.1cm', girl3: '0도 하중 5kg', girl25: '15도 하중 12kg', girl50: '30도 하중 18kg', girl75: '45도 하중 22kg', girl97: '교정 시 +1.5~2.1cm' },
    mechanism: '발가닥이 바닥에서 붕 뜨는 성인용 의자에 앉으면 무게중심을 잡기 위해 골반이 뒤로 눕고(후방경사) 요추 전만이 무너지며 보상으로 목이 앞으로 돌출됩니다. 무릎·고관절·팔꿈치가 각각 90~100도를 이루도록 발받침과 좌판 깊이를 아이 신장에 맞춰 조절해야 척추기립근 피로가 사라집니다.',
    routine: [
      '90-90-90 착석 공식: 발바닥 전체가 발받침에 닿고 무릎 90도, 등판이 요추를 밀어주도록 좌판 깊이 세팅',
      '태블릿·독서대는 눈높이 아래 15도 이내로 거치대 높이 고정 (고개 숙임 원천 차단)',
      '매 40분 학습 후 문틀 가슴 열기(대흉근 스트레칭) 30초 실시'
    ],
    productMatch: {
      name: '시디즈 링고 학생의자 (성장단계 조절형) + 높이조절 독서대/바른자세 밴드',
      reason: '키 110cm부터 160cm까지 등판 높이와 좌판 깊이를 4단계로 그로잉 조절하여 90-90-90 바른 착석을 완성합니다.',
      presetHash: '#preset-posture-spine-care'
    },
    pmid: 'PMID: 25393825 (Hansraj, Assessment of Stresses in the Cervical Spine Caused by Posture)'
  },
  {
    id: 'kr-deep-13',
    slug: 'kr-deep-13-apartment-noiseless-jumping-trampoline-wolffs-law-growth-plate.html',
    category: '성장운동 & 성장판 자극',
    ageGroup: '만 3세 ~ 만 13세 아파트 거주 가정',
    title: '아파트 층간소음 걱정 없는 실내 키크는 운동: 울프의 법칙(Wolff Law) 성장판 압전 자극과 저녁 15분 점핑 루틴',
    question: '미세먼지랑 학원 시간 때문에 밖에서 뛰어놀 시간이 없어요. 아파트 거실에서 층간소음 없이 성장판을 자극하는 운동법이 있을까요?',
    shortAnswer: '뼈와 성장판 연골은 중력 방향의 주기적인 수직 부하(Mechanical Loading)를 받을 때 압전 효과(Piezoelectric Effect)와 국소 IGF-1 발현이 증가하여 길이 성장과 골밀도가 촉진됩니다(Wolff의 법칙). 고밀도 충격흡수 점핑 매트나 무소음 트램폴린 위에서 하루 15분 인터벌 점핑을 시행하면 층간소음 없이 야외 줄넘기와 동등한 골단판 자극을 줄 수 있습니다.',
    kdcaRow: { boy3: '수직부하 1.5~2.5G', boy25: '1세트 60초 점핑', boy50: '휴식 30초 × 10세트', boy75: '총 15분/일', boy97: 'GH 분비 +180%', girl3: '수직부하 1.5~2.5G', girl25: '1세트 60초 점핑', girl50: '휴식 30초 × 10세트', girl75: '총 15분/일', girl97: 'GH 분비 +180%' },
    mechanism: '경골과 대퇴골의 성장판(Epiphyseal Plate) 내 연골세포(Chondrocyte)는 정적인 압박에는 성장이 억제되지만, 1~2Hz 주기의 리드미컬한 수직 점프 자극에는 세포외기질(ECM) 합성과 혈류량이 급증합니다. 또한 중강도 인터벌 점핑 직후 30~60분 동안 운동 유발성 성장호르몬(EIGH) 펄스가 분비됩니다.',
    routine: [
      '저녁 식사 1시간 후(취침 2시간 전) 고밀도 TPU/PE 점핑 매트 위에서 맨발 또는 미끄럼방지 양말 착용 후 시작',
      '60초 가벼운 제자리 리듬 점프 + 30초 까치발 스트레칭을 10세트(총 15분) 반복',
      '운동 직후 미지근한 물 150mL 섭취로 추간판 및 관절 연골 수분 보충'
    ],
    productMatch: {
      name: '실내 무소음 점핑 매트 / 유아·주니어 트램폴린 + 일양약품 키즈 하이 아르기닌',
      reason: '아파트 층간소음 충격음을 흡수하면서 성장판 수직 자극을 전달하는 홈트레이닝 루틴과 운동 후 아미노산 보충 조합입니다.',
      presetHash: '#preset-exercise-jumping-routine'
    },
    pmid: 'PMID: 16697904 (Mechanical Loading and Bone Growth in Children - Wolff Law)'
  },
  {
    id: 'kr-deep-14',
    slug: 'kr-deep-14-pediatric-obesity-bmi-85percentile-leptin-bone-age-acceleration.html',
    category: '체중관리 & 성조숙증 예방',
    ageGroup: '만 6세 ~ 만 13세 과체중·소아비만',
    title: '살이 키로 간다는 옛말의 함정: 소아 BMI 85백분위 이상 과체중이 뼈나이(골연령)를 1.5년 앞당기는 내분비 기전',
    question: '어른들은 어릴 때 찐 살은 다 키로 간다고 하시는데, 소아과에서는 체중을 줄이지 않으면 성장판이 일찍 닫힌다고 해요. 어떻게 감량해야 키가 안 줄어들까요?',
    shortAnswer: '소아기 체질량지수(BMI)가 연령별 85백분위(과체중) 또는 95백분위(비만)를 넘으면 지방조직에서 분비되는 렙틴과 방향화효소(Aromatase)가 안드로겐을 에스트로겐으로 전환시켜 성장판 골성숙(뼈나이)을 평균 1.2~1.8년 가속화합니다. 소아 체중 관리는 어른처럼 굶어서 몸무게를 빼는 것이 아니라, "현재 체중을 유지하면서 키를 키워 BMI 백분위를 낮추는(Weight Maintenance during Linear Growth)" 전략을 써야 합니다.',
    kdcaRow: { boy3: 'BMI <85p 정상유지', boy25: '액상과당 0g', boy50: '단백질 1.2g/kg', boy75: '체중유지+키성장', boy97: '골연령 가속 억제', girl3: 'BMI <85p 정상유지', girl25: '액상과당 0g', girl50: '단백질 1.2g/kg', girl75: '체중유지+키성장', girl97: '골연령 가속 억제' },
    mechanism: '극단적인 칼로리 제한(굶기)은 IGF-1 수치를 급락시켜 키 성장까지 멈추게 합니다. 반면 정제 탄수화물과 음료수(액상과당)만 차단하고 단백질·식이섬유·칼슘 섭취량은 100% 유지하면, 인슐린과 렙틴 수치가 안정되어 골연령 가속은 멈추고 뇌하수체 성장호르몬 감수성이 회복됩니다.',
    routine: [
      '체중계 숫자 감량 대신 "6개월간 몸무게 그대로 유지하기 + 키 3cm 키우기"를 가족 목표로 설정',
      '과일주스·탄산음료·가당 요거트를 생수·보리차·무가당 그릭요거트로 100% 대체',
      '저녁 식사 후 15분 가족 산책 또는 실내 점핑으로 근육 내 GLUT4 포도당 흡수 촉진'
    ],
    productMatch: {
      name: '실내 무소음 점핑 매트 + 닥터리브 칼마디 K2 (무당/저당 미네랄 설계)',
      reason: '불필요한 당류 섭취 없이 필수 미네랄을 보충하고 저녁 유산소 점핑으로 체지방률을 건강하게 낮추는 조합입니다.',
      presetHash: '#preset-weight-balance-puberty'
    },
    pmid: 'PMID: 28166541 (Obesity and Accelerated Skeletal Maturation in Children)'
  },
  {
    id: 'kr-deep-15',
    slug: 'kr-deep-15-daycare-frequent-colds-gut-microbiome-vitamin-d-zinc-immunity.html',
    category: '면역력 & 장건강·수면호흡',
    ageGroup: '만 1세 ~ 만 7세 어린이집·유치원기',
    title: '어린이집·유치원 단체생활 감기 달고 사는 아이: 항생제 반복 투여 후 장내 미생물(Microbiome) 복구와 면역 성장 상관관계',
    question: '한 달에 두 번씩 중이염·비염으로 항생제를 먹어요. 아플 때마다 밥도 안 먹고 키도 멈추는 것 같은데 면역력 루틴을 어떻게 짜야 할까요?',
    shortAnswer: '소아 면역세포의 70% 이상은 장관 연관 림프조직(GALT)에 분포합니다. 잦은 상기도 감염과 항생제 복용은 장내 유익균 총을 무너뜨리고 염증성 사이토카인(IL-6, TNF-α)을 증가시켜 간에서의 IGF-1 합성을 직접 차단(염증성 성장 정체)합니다. 프로바이오틱스+아연+비타민 D3 3중 장벽 루틴이 감기 이환 기간을 단축하고 성장 속도를 회복시킵니다.',
    kdcaRow: { boy3: '보장균수 10~100억', boy25: '아연 5~8mg', boy50: '비타민D 혈중 >30ng/mL', boy75: '실내습도 50~55%', boy97: '감기 빈도 -40%', girl3: '보장균수 10~100억', girl25: '아연 5~8mg', girl50: '비타민D 혈중 >30ng/mL', girl75: '실내습도 50~55%', girl97: '감기 빈도 -40%' },
    mechanism: '바이러스 감염 시 분비되는 전염증성 사이토카인은 성장판 연골세포의 성장호르몬 수용체(GHR) 발현을 억제합니다. 비타민 D3는 호흡기 점막에서 천연 항균 펩타이드(Cathelicidin) 생성을 유도하고, 아연은 리노바이러스의 세포 내 복제를 억제하며, 유산균(L. rhamnosus GG, B. animalis 등)은 장 점막 면역글로불린 A(sIgA) 분비를 강화합니다.',
    routine: [
      '항생제 복용 시에는 항생제 섭취 2시간 뒤에 프로바이오틱스를 투여하여 장내 유익균 사멸 방지',
      '침실 온습도를 21~22℃, 습도 50~55%로 유지하여 비강 점막 섬모 운동 보호',
      '하원 직후 손 씻기 + 생리식염수 코 세척(또는 온습포 찜질)으로 상기도 바이러스 부하 감소'
    ],
    productMatch: {
      name: '락토핏 생유산균 키즈(종근당건강) + 세노비스 키즈 멀티비타민 미네랄',
      reason: '어린이 장 환경에 맞춘 프로바이오틱스·아연 설계와 기초 면역 비타민을 함께 채우는 단체생활 필수 루틴입니다.',
      presetHash: '#preset-immunity-gut-care'
    },
    pmid: 'PMID: 25927096 (Probiotics for Preventing Acute Upper Respiratory Tract Infections)'
  },
  {
    id: 'kr-deep-16',
    slug: 'kr-deep-16-allergic-rhinitis-mouth-breathing-adenoid-face-deep-sleep-loss.html',
    category: '면역력 & 장건강·수면호흡',
    ageGroup: '만 4세 ~ 만 14세 비염·구강호흡',
    title: '코골이와 입 벌리고 자는 비염 아이(구강호흡): 아데노이드형 얼굴 변형과 서파수면 분절로 인한 성장호르몬 감소 해결법',
    question: '비염 때문에 밤마다 입을 벌리고 자고 잠버릇이 심해요. 구강호흡이 키 성장과 얼굴형, 낮 시간 집중력에까지 영향을 주나요?',
    shortAnswer: '야간 구강호흡과 코골이는 수면 중 미세 각성(Micro-arousal)을 유발해 성장호르몬이 분비되는 서파수면(Stage N3) 진입을 방해합니다. 실제 소아 수면호흡장애 아동은 정상 비강호흡 아동 대비 IGF-1 수치가 유의하게 낮으며, 구강호흡이 장기화되면 하악(아래턱)이 후방으로 회전하는 아데노이드형 안모 변형과 주간 전두엽 집중력 저하를 초래합니다.',
    kdcaRow: { boy3: '비강호흡 유지', boy25: '침실습도 50~55%', boy50: '침구 먼지진드기 차단', boy75: '경추베개 12~15도', boy97: 'SWS 수면 연속성 확보', girl3: '비강호흡 유지', girl25: '침실습도 50~55%', girl50: '침구 먼지진드기 차단', girl75: '경추베개 12~15도', girl97: 'SWS 수면 연속성 확보' },
    mechanism: '코로 숨을 쉴 때는 부비동에서 산화질소(Nitric Oxide)가 생성되어 폐 산소 교환 효율을 18% 높이지만, 입으로 숨을 쉬면 찬 공기가 편도를 직접 자극해 아데노이드 비대를 악화시킵니다. 이로 인해 수면 중 산소포화도가 흔들리면 교감신경이 활성화되어 뇌가 깊은 잠(델타파)에 머무르지 못하고 얕은 잠만 반복하게 됩니다.',
    routine: [
      '취침 1시간 전 따뜻한 샤워 수증기 흡입 및 알레르기 유발 침구(집먼지진드기) 60℃ 온수 세탁',
      '기도가 꺾이지 않도록 목(경추)을 C자 형태로 지지하고 옆으로 누워도 호흡이 편한 키즈 기능성 베개 사용',
      '낮 시간 입 다물고 코로 숨쉬기(혀끝을 입천장 앞쪽 M자 부위에 붙이는 뮤잉 기초 자세) 연습'
    ],
    productMatch: {
      name: '태유글로벌 키즈 기능성 경추 베개 + 락토핏 생유산균 키즈',
      reason: '야간 기도 개방 각도를 유지해 수면 분절을 줄이는 경추 베개와 면역 과민반응 완화를 돕는 장 건강 루틴입니다.',
      presetHash: '#preset-sleep-deep-sws'
    },
    pmid: 'PMID: 12193664 (Growth Hormone Secretion and IGF-1 in Children with Sleep-Disordered Breathing)'
  },
  {
    id: 'kr-deep-17',
    slug: 'kr-deep-17-growing-pains-night-leg-cramps-versus-pathologic-pain-red-flags.html',
    category: '성장통 & 근골격 케어',
    ageGroup: '만 3세 ~ 만 12세 야간 다리 통증',
    title: '밤마다 다리 아프다고 우는 아이: 진짜 성장통(Growing Pains) 구별법 5가지와 칼슘·마그네슘·비타민D 완화 루틴',
    question: '낮에는 멀쩡하게 뛰어놀다가 밤에 자려고 누우면 정강이나 종아리, 무릎 뒤가 아프다고 주물러 달라고 해요. 병원 진료가 필요한 위험 신호는 무엇인가요?',
    shortAnswer: '전형적인 성장통은 만 3~12세 아동의 약 20~35%에서 나타나며 ① 양쪽 다리(허벅지 앞, 종아리, 무릎 뒤 근육)에 대칭적으로 발생하고 ② 저녁이나 밤에만 아프다가 아침에 일어나면 말끔히 사라지며 ③ 관절 부기나 열감, 절뚝거림이 없다는 특징이 있습니다. 비타민 D3와 마그네슘·칼슘 보충 및 취침 전 온찜질이 야간 통증 강도를 유의하게 감소시킵니다.',
    kdcaRow: { boy3: '양측성 근육통(정상)', boy25: '아침 소실(정상)', boy50: '혈중 비타민D 보충', boy75: '마그네슘 근육이완', boy97: '한쪽 관절부종=진료필수', girl3: '양측성 근육통(정상)', girl25: '아침 소실(정상)', girl50: '혈중 비타민D 보충', girl75: '마그네슘 근육이완', girl97: '한쪽 관절부종=진료필수' },
    mechanism: '뼈의 길이 성장 속도에 비해 주변 골막(Periosteum)과 힘줄·근육의 신장 속도가 일시적으로 뒤처지면서 야간에 장력(Tension) 피로가 발생합니다. 또한 임상 연구에서 성장통을 호소하는 아동의 상당수가 혈중 25(OH)D(비타민 D) 농도가 20ng/mL 미만으로 낮았으며, 비타민 D3와 마그네슘 보충 후 VAS 통증 점수가 50% 이상 감소했습니다.',
    routine: [
      '[Red Flag 체크] 한쪽 다리만 계속 아프거나, 아침에도 절뚝거리거나, 관절이 붓고 열이 나면 즉시 소아정형외과 진료',
      '취침 전 38~40℃ 온습포 찜질 및 대퇴사두근·비복근(종아리) 5분 이완 마사지',
      '저녁 식후 구연산 칼슘 + 마그네슘 + 비타민 D3·K2 섭취로 신경근 흥분도 완화 및 골기질 보충'
    ],
    productMatch: {
      name: '닥터리브 키즈 칼마디 K2 + 남양유업 테이크핏 케어 키즈',
      reason: '야간 신경·근육 이완을 돕는 마그네슘과 급성장기 골밀도 영양소(칼슘·비타민D3·K2)를 한 번에 공급합니다.',
      presetHash: '#preset-nutrition-calcium-k2'
    },
    pmid: 'PMID: 26022378 (Vitamin D Supplementation Effectively Reduces Pain Intensity in Children with Growing Pains)'
  },
  {
    id: 'kr-deep-18',
    slug: 'kr-deep-18-mph-genetic-height-vs-khamis-roche-epigenetic-plus-7cm.html',
    category: '학년별 키 백분위 & 성인키 예측',
    ageGroup: '만 4세 ~ 만 17세 성인키 예측',
    title: '부모 키가 작아도 아이는 클 수 있을까? 유전키(MPH) 공식의 한계(±8.5cm)와 Khamis-Roche 후성유전 환경 변수 +7cm의 과학',
    question: '아빠 168cm, 엄마 156cm라 유전키 계산기를 돌려보면 아이 예상키가 작게 나와서 속상해요. 유전이 키의 몇 퍼센트를 결정하나요?',
    shortAnswer: '단순 부모 평균키 공식(MPH: 남아 (부+모+13)/2, 여아 (부+모-13)/2)은 95% 신뢰구간이 ±8.5cm(위아래 17cm 폭)로 매우 넓습니다. 쌍둥이 코호트 및 후성유전학 연구에 따르면 성인키의 유전적 영향력은 60~75%이며, 나머지 25~40%(성인키 기준 약 6~8.5cm)는 영양 흡수율, 서파수면 성장호르몬, 기계적 성장판 자극, 사춘기 성숙 속도에 의해 결정됩니다.',
    kdcaRow: { boy3: 'MPH 하한 -8.5cm', boy25: '유전 영향 65~70%', boy50: '환경 변수 25~35%', boy75: 'Khamis-Roche ±2.1cm', boy97: '최적 루틴 시 +5~7cm', girl3: 'MPH 하한 -8.5cm', girl25: '유전 영향 65~70%', girl50: '환경 변수 25~35%', girl75: 'Khamis-Roche ±2.1cm', girl97: '최적 루틴 시 +5~7cm' },
    mechanism: 'MPH 공식은 "현재 아이의 실제 성장 발육 상태"를 전혀 반영하지 못합니다. 반면 미국 Wright State 대학의 Khamis-Roche 알고리즘은 아이의 현재 월령별 신장, 체중(골연령 대리 지표), 부모 평균키에 연령·성별 특이 회귀계수($\beta_0, \beta_1, \beta_2, \beta_3$)를 적용해 X-ray 촬영 없이도 성인 예측키 오차를 절반 이하(±2.1~2.4cm)로 줄여줍니다.',
    routine: [
      '부모 키만 넣는 단순 유전키 대신 매 분기 키즈핏 Khamis-Roche 3대 시나리오(유지·집중관리·성장지연) 시뮬레이션 실행',
      '체중이 키 백분위보다 앞서 나가지 않도록 관리 (체중 과잉은 Khamis-Roche 식에서 성인 예측키를 깎는 음(-)의 계수로 작용함)',
      '수면(SWS)·영양(HT042/칼마디K2/단백질)·점핑운동 3대 후성유전 스위치 12주 연속 실천'
    ],
    productMatch: {
      name: '종근당건강 아이커 + 닥터리브 칼마디 K2 + 시디즈 링고',
      reason: '유전적 한계를 넘어 후성유전적 성장 잠재력(+5~7cm 상위 궤적)을 끌어올리는 키즈핏 3대 핵심 루틴입니다.',
      presetHash: '#preset-elementary-lower-height'
    },
    pmid: 'PMID: 7977959 (Khamis-Roche Method) / PMID: 27479907 (Genetics and Environmental Factors of Human Height)'
  },
  {
    id: 'kr-deep-19',
    slug: 'kr-deep-19-ht042-astragalus-extract-vs-arginine-calcium-supplement-guide.html',
    category: '소아 영양 & 생체흡수율',
    ageGroup: '만 4세 ~ 만 15세 영양제 비교',
    title: '어린이 키성장 영양제 성분 완전 분석: 식약처 인정 HT042(황기추출물) vs L-아르기닌 vs 칼마디K2 연령별·체질별 선택 기준',
    question: '아이커(HT042), 아르기닌, 칼슘·마그네슘·비타민D·K2 중 우리 아이에게 지금 가장 필요한 건 무엇인가요? 같이 먹어도 중복 과잉이 안 될까요?',
    shortAnswer: '세 가지 성분군은 작용 기전이 서로 달라 아이의 현재 성장 병목(Bottleneck)에 맞춰 선택하거나 조합할 수 있습니다. ① HT042(황기추출물 등 복합물)는 간에서 IGF-1 및 IGFBP-3 생성을 촉진하는 신호 자극제이고, ② 칼마디K2는 실제 뼈 기질을 만드는 건축 자재이며, ③ L-아르기닌·아연은 성장호르몬 분비 보조 및 에너지·식욕 대사 부스터입니다.',
    kdcaRow: { boy3: 'HT042: IGF-1 신호촉진', boy25: '칼마디K2: 골기질 침착', boy50: '아르기닌: GH 펄스보조', boy75: '아연: 세포분열·식욕', boy97: '병행 시 상한섭취량 준수', girl3: 'HT042: IGF-1 신호촉진', girl25: '칼마디K2: 골기질 침착', girl50: '아르기닌: GH 펄스보조', girl75: '아연: 세포분열·식욕', girl97: '병행 시 상한섭취량 준수' },
    mechanism: '국내 소아 대상 12주~24주 무작위 대조 인체적용시험(RCT)에서 HT042 섭취군은 대조군 대비 신장 증가량 및 혈중 성장인자 결합 단백질(IGFBP-3) 농도가 유의하게 상승했습니다. 여기에 골 무기질 재료인 구연산 칼슘·비타민 D3·K2가 뒷받침되어야 늘어난 성장 신호가 실제 뼈 길이와 골밀도로 전환됩니다.',
    routine: [
      '성장 백분위 25p 미만 + 또래보다 작을 때: HT042(신호) + 칼마디K2(뼈 재료) 시너지 조합',
      '활동량이 많거나 사춘기 급성장기(초4~중2) 진입 시: L-아르기닌 + 고단백 케어 음료 추가',
      '중복 섭취 시 비타민 D(상한 2,000~4,000IU)와 아연(상한 15~23mg) 합산 함량이 일일 상한섭취량을 넘지 않는지 키즈핏 큐레이터에서 자동 체크'
    ],
    productMatch: {
      name: '종근당건강 아이커(HT042) + 닥터리브 키즈 칼마디 K2 + 일양약품 키즈 하이 아르기닌',
      reason: '성장 신호(HT042), 골기질 재료(칼마디K2), 아미노산 부스터(아르기닌)를 체질별로 매칭하는 키즈핏 대표 3대 라인업입니다.',
      presetHash: '#preset-nutrition-calcium-k2'
    },
    pmid: 'PMID: 25392735 (HT042 Randomized Double-Blind Placebo-Controlled Trial on Height Growth in Children)'
  },
  {
    id: 'kr-deep-20',
    slug: 'kr-deep-20-elementary-study-room-lighting-cri95-smart-learning-free-trial-guide.html',
    category: '집중력·두뇌발달 & 학습환경',
    ageGroup: '만 6세 ~ 만 14세 초·중등 학습환경',
    title: '초등 공부방 환경 의학 가이드: 눈 피로 막는 CRI 95·4000K 조명 세팅과 AI 스마트학습(웅진스마트올·엘리하이) 0원 무료체험 비교',
    question: '초등 입학·새학기를 앞두고 아이 공부방을 꾸며주려 해요. 책상 배치와 스탠드 조명 색온도, 그리고 패드 학습지 선택 기준을 알려주세요.',
    shortAnswer: '초등학생은 수정체 조절근이 발달 중이어서 조도 불균형이나 낮은 연색성(CRI <80) 조명 아래에서는 20분 만에 시각 피로와 두통, 집중력 이탈이 발생합니다. 태양광에 가까운 CRI 95 이상, 색온도 4000~4500K(주백색) 스탠드와 90-90-90 체형교정 의자를 먼저 세팅한 뒤, 아이의 성향(자기주도형 vs 흥미유발형)에 맞춰 0원 무료체험으로 AI 학습기를 직접 테스트해 보는 것이 실패 없는 방법입니다.',
    kdcaRow: { boy3: '책상조도 500~700Lux', boy25: '색온도 4000~4500K', boy50: '연색지수 CRI ≥95', boy75: '의자 90-90-90 각도', boy97: '무료체험 후 성향선택', girl3: '책상조도 500~700Lux', girl25: '색온도 4000~4500K', girl50: '연색지수 CRI ≥95', girl75: '의자 90-90-90 각도', girl97: '무료체험 후 성향선택' },
    mechanism: '지나치게 푸른 주광색(6500K)은 야간 멜라토닌 분비를 억제해 수면 잠복기를 늘리고, 너무 노란 전구색(2700K)은 대뇌 피질 각성도를 떨어뜨려 졸음을 유발합니다. 학습 시에는 4000K 자연광 스펙트럼이 시각 대비 감도와 작업기억 유지율을 극대화하며, 비대칭 광학 설계 스탠드를 쓰면 패드 화면의 난반사(Glare)를 막아 근시 진행을 억제합니다.',
    routine: [
      '스탠드는 오른손잡이 기준 왼쪽 앞 대각선에 배치하여 손 그림자가 공책에 지지 않게 세팅',
      '약정 결제 전 반드시 웅진스마트올(전과목 AI 맞춤 + 독서)·엘리하이(영재·심화·교과 스타강사) 등 0원 무료체험으로 아이가 7일간 스스로 켜는지 관찰',
      '40분 학습 후 10분은 창밖 6m 이상 먼 곳을 바라보게 하여 모양체근 긴장 이완(20-20-20 법칙)'
    ],
    productMatch: {
      name: '웅진스마트올 / 엘리하이 0원 무료체험 + 시디즈 링고 학생의자',
      reason: '부담 없는 0원 무료체험으로 아이의 학습 몰입도를 먼저 검증하고 바른 착석 자세까지 동시에 잡는 새학기 정석 루틴입니다.',
      presetHash: '#preset-focus-smart-learning'
    },
    pmid: 'PMID: 29461606 (Classroom Lighting Color Temperature and Cognitive Attention in Elementary Students)'
  }
];

function buildHtmlPage(page) {
  const canonicalUrl = `https://kidsfit.co.kr/qna/${page.slug}`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: page.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${page.shortAnswer} ${page.mechanism}`
        }
      },
      {
        '@type': 'Question',
        name: `${page.ageGroup} 아이를 위한 키즈핏 핵심 실천 루틴은 무엇인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: page.routine.join(' / ')
        }
      }
    ]
  };

  const medicalWebPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: page.title,
    description: page.shortAnswer,
    url: canonicalUrl,
    inLanguage: 'ko-KR',
    audience: {
      '@type': 'MedicalAudience',
      audienceType: 'Parents of Korean Children and Adolescents'
    },
    citation: page.pmid,
    publisher: {
      '@type': 'Organization',
      name: '키즈핏 코리아 (KidsFit Korea)',
      url: 'https://kidsfit.co.kr'
    }
  };

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title} | 키즈핏(KidsFit) 소아성장·두뇌 연구소</title>
  <meta name="description" content="${page.shortAnswer}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.shortAnswer}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="키즈핏 코리아 (KidsFit)">
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(medicalWebPageSchema)}</script>
  <style>
    :root {
      --kf-bg: #f8fafc;
      --kf-card: #ffffff;
      --kf-text: #0f172a;
      --kf-sub: #475569;
      --kf-primary: #2563eb;
      --kf-accent: #059669;
      --kf-border: #e2e8f0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
      background: var(--kf-bg);
      color: var(--kf-text);
      line-height: 1.68;
      font-size: 17px;
    }
    .kf-container {
      max-width: 780px;
      margin: 0 auto;
      padding: 20px 16px 64px;
    }
    .kf-ftc-banner {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 13px;
      color: #475569;
      margin-bottom: 18px;
    }
    .kf-badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .kf-badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      background: #dbeafe;
      color: #1d4ed8;
    }
    .kf-badge.age {
      background: #d1fae5;
      color: #047857;
    }
    h1 {
      font-size: clamp(22px, 4.5vw, 30px);
      line-height: 1.35;
      margin: 0 0 18px;
      letter-spacing: -0.02em;
    }
    .kf-card {
      background: var(--kf-card);
      border: 1px solid var(--kf-border);
      border-radius: 18px;
      padding: 22px 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
    }
    .kf-question-box {
      background: #eff6ff;
      border-left: 5px solid var(--kf-primary);
      padding: 16px 18px;
      border-radius: 12px;
      font-weight: 600;
      color: #1e3a8a;
      margin-bottom: 16px;
    }
    .kf-answer-lead {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }
    h2 {
      font-size: 20px;
      margin: 0 0 12px;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 14px;
    }
    th, td {
      border: 1px solid var(--kf-border);
      padding: 10px 8px;
      text-align: center;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
    }
    .kf-routine-list {
      margin: 0;
      padding-left: 20px;
    }
    .kf-routine-list li {
      margin-bottom: 10px;
      font-weight: 500;
    }
    .kf-cta-box {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #ffffff;
      border-radius: 18px;
      padding: 24px 20px;
      text-align: center;
      margin-top: 24px;
    }
    .kf-cta-box h3 {
      margin: 0 0 8px;
      font-size: 21px;
    }
    .kf-cta-box p {
      margin: 0 0 18px;
      font-size: 15px;
      opacity: 0.92;
    }
    .kf-btn-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .kf-btn {
      display: block;
      text-decoration: none;
      padding: 15px 18px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 16px;
      text-align: center;
    }
    .kf-btn-primary {
      background: #ffffff;
      color: #1d4ed8;
    }
    .kf-btn-secondary {
      background: rgba(255,255,255,0.16);
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.35);
    }
    .kf-citation {
      font-size: 13px;
      color: #64748b;
      margin-top: 14px;
    }
    .kf-nav-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    .kf-nav-links a {
      font-size: 13px;
      color: var(--kf-primary);
      text-decoration: none;
      background: #eff6ff;
      padding: 6px 10px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <main class="kf-container">
    <div class="kf-ftc-banner">
      ℹ️ <strong>경제적 이해관계 고지(공정위 지침 준수)</strong>: 본 임상 가이드는 질병관리청(KDCA) 성장도표 및 학술 문헌을 기반으로 작성되었으며, 하단 에디터 큐레이션 링크를 통한 구매·무료체험 신청 시 쿠팡 파트너스(AF7865143) 및 링크프라이스(A100708867) 활동의 일환으로 일정액의 수수료를 제공받을 수 있습니다.
    </div>

    <div class="kf-badge-row">
      <span class="kf-badge">${page.category}</span>
      <span class="kf-badge age">${page.ageGroup}</span>
    </div>

    <h1>${page.title}</h1>

    <section class="kf-card">
      <div class="kf-question-box">
        Q. "${page.question}"
      </div>
      <p class="kf-answer-lead">💡 3줄 핵심 결론: ${page.shortAnswer}</p>
      <p>${page.mechanism}</p>
      <div class="kf-citation">📚 학술 및 공공 데이터 근거: ${page.pmid}</div>
    </section>

    <section class="kf-card">
      <h2>📊 연령·지표별 핵심 기준 데이터 표 (KDCA & 임상 레퍼런스)</h2>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>구분</th>
              <th>하위 3p / 주의기준</th>
              <th>25백분위 / 기초</th>
              <th>50백분위 (중위수)</th>
              <th>75백분위 / 권장</th>
              <th>97백분위 / 목표</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>남아 / 지표 A</strong></td>
              <td>${page.kdcaRow.boy3}</td>
              <td>${page.kdcaRow.boy25}</td>
              <td><strong>${page.kdcaRow.boy50}</strong></td>
              <td>${page.kdcaRow.boy75}</td>
              <td>${page.kdcaRow.boy97}</td>
            </tr>
            <tr>
              <td><strong>여아 / 지표 B</strong></td>
              <td>${page.kdcaRow.girl3}</td>
              <td>${page.kdcaRow.girl25}</td>
              <td><strong>${page.kdcaRow.girl50}</strong></td>
              <td>${page.kdcaRow.girl75}</td>
              <td>${page.kdcaRow.girl97}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="kf-card">
      <h2>✅ 오늘 밤부터 바로 적용하는 가정 내 3대 실천 프로토콜</h2>
      <ol class="kf-routine-list">
        ${page.routine.map((r) => `<li>${r}</li>`).join('\n        ')}
      </ol>
    </section>

    <section class="kf-card">
      <h2>🎯 맞춤형 에디터 큐레이션 & 루틴 매칭</h2>
      <p><strong>추천 솔루션 조합:</strong> ${page.productMatch.name}</p>
      <p>${page.productMatch.reason}</p>
    </section>

    <div class="kf-cta-box">
      <h3>우리 아이 정확한 성장 백분위 & Khamis-Roche 성인 예측키가 궁금하다면?</h3>
      <p>질병관리청 LMS 데이터와 미국 소아과 무채혈 생체 모델로 1분 만에 정밀 리포트를 확인하세요.</p>
      <div class="kf-btn-group">
        <a class="kf-btn kf-btn-primary" href="https://kidsfit.co.kr/${page.productMatch.presetHash}">🔬 무료 1분 성장·두뇌 정밀 진단 시작하기 (공식 홈)</a>
        <a class="kf-btn kf-btn-secondary" href="https://kidsfit.co.kr/#curation-section">🛒 에디터 큐레이션 24종 혜택가 확인 & 공식 판매처 보러가기</a>
      </div>
    </div>

    <nav class="kf-card" aria-label="관련 임상 가이드">
      <h2>🔗 함께 읽으면 좋은 연령별·증상별 심층 가이드</h2>
      <div class="kf-nav-links">
        <a href="https://kidsfit.co.kr/">🏠 키즈핏 메인 진단기</a>
        <a href="https://kidsfit.co.kr/qna/kr-deep-01-elem1-age7-height-percentile-khamis-roche.html">초1(만7세) 키 백분위</a>
        <a href="https://kidsfit.co.kr/qna/kr-deep-03-elem3-age9-precocious-puberty-girls-breast-bud.html">초3 성조숙증 초기신호</a>
        <a href="https://kidsfit.co.kr/qna/kr-deep-06-elem6-age12-middle-school-final-growth-plate-routine.html">초6 성장판 스퍼트</a>
        <a href="https://kidsfit.co.kr/qna/kr-deep-07-10pm-deep-sleep-growth-hormone-melatonin-lux-protocol.html">밤10시 서파수면 법칙</a>
        <a href="https://kidsfit.co.kr/qna/kr-deep-08-calcium-citrate-vs-carbonate-vitamin-d3-k2-osteocalcin.html">칼슘·비타민D3·K2 흡수율</a>
        <a href="https://kidsfit.co.kr/qna/kr-deep-10-morning-glucose-spike-adhd-misdiagnosis-executive-function.html">아침 혈당과 집중력</a>
        <a href="https://kidsfit.co.kr/qna/kr-deep-18-mph-genetic-height-vs-khamis-roche-epigenetic-plus-7cm.html">유전키 vs Khamis-Roche</a>
      </div>
    </nav>
  </main>
</body>
</html>`;
}

function updateSitemapAndLlms(pages) {
  const today = new Date().toISOString().split('T')[0];

  if (fs.existsSync(SITEMAP_PATH)) {
    let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');
    let addedCount = 0;
    for (const p of pages) {
      const loc = `https://kidsfit.co.kr/qna/${p.slug}`;
      if (!sitemap.includes(loc)) {
        const entry = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n</urlset>`;
        sitemap = sitemap.replace('</urlset>', entry);
        addedCount++;
      }
    }
    fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf8');
    console.log(`[Track 2] sitemap.xml updated (+${addedCount} new URLs).`);
  }

  if (fs.existsSync(LLMS_FULL_PATH)) {
    let llms = fs.readFileSync(LLMS_FULL_PATH, 'utf8');
    const marker = '## Overnight Clinical Deep-Dive Q&A Pages (20 Korean Pediatric Guides)';
    if (!llms.includes(marker)) {
      const sectionLines = [
        '',
        marker,
        ...pages.map(
          (p) =>
            `- [${p.title}](https://kidsfit.co.kr/qna/${p.slug}): ${p.shortAnswer} (근거: ${p.pmid})`
        ),
        ''
      ];
      llms += sectionLines.join('\n');
      fs.writeFileSync(LLMS_FULL_PATH, llms, 'utf8');
      console.log(`[Track 2] llms-full.txt updated with 20 deep clinical Q&A entries.`);
    }
  }
}

function main() {
  let created = 0;
  for (const page of PAGES) {
    const html = buildHtmlPage(page);
    const outPath = path.join(QNA_DIR, page.slug);
    fs.writeFileSync(outPath, html, 'utf8');
    created++;
  }
  updateSitemapAndLlms(PAGES);
  console.log(`[Track 2 Complete] Generated ${created} Korean clinical SEO/GEO pages in ${QNA_DIR}`);
}

if (require.main === module) {
  main();
}

module.exports = { PAGES, main };
