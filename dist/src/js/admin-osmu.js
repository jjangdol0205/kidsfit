/**
 * KidsFit Growth Studio - Secret Admin OSMU Marketing Studio (src/js/admin-osmu.js)
 * Implements 4-Channel OSMU Marketing Content Generator for 3 Real-World Scenarios:
 * 1) 6-cut parenting webtoon storyboard & 30s TTS voiceover script
 * 2) 15s GoTall-style viral screen recording shortform script
 * 3) 2,000-char DIA+ search-optimized blog column with comparison table & bridge copy
 * 4) Naver Cafe rank-up & group buy demand survey post
 */

(function (global) {
  'use strict';

  const SCENARIOS = {
    'scenario-1': {
      id: 'scenario-1',
      title: '시나리오 1: 워킹맘이 놓친 만 3세 소근육 & 몬테소리 발견기',
      target: '만 2~4세 소근육/가위질 서툰 자녀를 둔 3040 워킹맘',
      keyword: '만 3세 소근육 발달, 몬테소리 가베 차이, 36개월 가위질'
    },
    'scenario-2': {
      id: 'scenario-2',
      title: '시나리오 2: 엄마 158 아빠 171 초2 남아 숨은 키 7cm 찾은 법',
      target: '초등 저학년 또래보다 작은 아이 부모 & 사춘기 골든타임 관심층',
      keyword: '초등학생 예상키, 유전키 계산법, 밤10시 성장호르몬, 숨은키'
    },
    'scenario-3': {
      id: 'scenario-3',
      title: '시나리오 3: 이번 주말 초등 역사 박물관 코스 & 필수 보드게임',
      target: '주말마다 키즈카페 가다 지친 수도권·지방 학부모',
      keyword: '주말 아이와 가볼만한곳, 국립중앙박물관 어린이박물관, 역사 팝업북'
    }
  };

  function generateOsmuBundle(scenarioId = 'scenario-1', affiliateConfig = {}) {
    const coupangId = affiliateConfig.coupang || 'AF7865143';
    const linkpriceId = affiliateConfig.linkprice || 'A100708867';
    const cafeUrl = affiliateConfig.cafeUrl || 'https://cafe.naver.com/kidsfitgrowth';
    const blogUrl = affiliateConfig.blogUrl || 'https://blog.naver.com/kidsfit_studio';

    if (scenarioId === 'scenario-2') {
      // Scenario 2: 초2 남아 숨은키 7cm
      const webtoonStoryboard = `[네이버 클립·인스타 릴스 6컷 공감 육아 웹툰 콘티 & 30초 TTS 대본]
시나리오: 엄마 158cm, 아빠 171cm 초2 남아 숨은 키 7cm 찾은 법

[컷 1]
- AI 이미지 프롬프트: Korean webtoon pastel style, elementary school classroom entrance, worried mother looking at height chart, a cute 8yo boy standing at the back of the line, soft emotional lighting.
- 말풍선: "초등학교 2학년 반 배정 날... 우리 아이가 맨 앞줄이네요. 엄마 158, 아빠 171이라 유전 탓인가요?"
- 30초 TTS 나레이션: "초등학교 2학년 반 배정 날, 또래보다 한 뼘 작은 아이를 보며 부모 탓인가 가슴 철렁했던 날."

[컷 2]
- AI 이미지 프롬프트: Mom calculating with smartphone calculator, showing formula (171 + 158 + 13)/2 = 171cm, sighing with a sad expression.
- 말풍선: "유전 예상키(MPH) 계산해보니 딱 171cm... 정말 유전이라 어쩔 수 없는 걸까?"
- 30초 TTS 나레이션: "유전 예상키 공식으로 계산해보니 딱 171cm. 정말 부모 유전이 한계일까요?"

[컷 3]
- AI 이미지 프롬프트: Smartphone screen showing KidsFit Growth Studio app, glowing green potential height bar (+9.5cm potential growth), surprised joyful mother.
- 말풍선: "질병관리청 성장도표 진단해봤더니... 늦은 취침과 거북목만 교정해도 최대 178cm까지 가능?!"
- 30초 TTS 나레이션: "하지만 질병관리청 표준 성장도표 진단 결과, 방해 습관만 잡으면 최대 178cm까지 가능하다는 반전!"

[컷 4]
- AI 이미지 프롬프트: 8yo boy sleeping soundly at 9:30 PM with moon outside, sitting straight on an ergonomic posture chair, drinking calcium syrup.
- 말풍선: "밤 10시 성장호르몬 골든타임 사수! 구연산 칼슘과 바른자세 의자로 척추 곧게 펴주기."
- 30초 TTS 나레이션: "밤 10시 이전 숙면과 흡수율 3배 구연산 칼슘, 그리고 척추를 세워주는 자세 교정 루틴."

[컷 5]
- AI 이미지 프롬프트: 6 months later, smiling pediatrician measuring height, boy standing tall and proud with mother hugging him happily.
- 말풍선: "6개월 정기검진 결과! 또래 평균 훌쩍 넘겨 상위 20%로 껑충 뛰었어요!"
- 30초 TTS 나레이션: "6개월 뒤 정기검진, 또래 평균을 훌쩍 넘긴 아이의 당당한 미소."

[컷 6]
- AI 이미지 프롬프트: Clean clinic banner with KidsFit logo and URL, CTA button saying '우리 아이 숨은 잠재키 무료 확인'.
- 말풍선: "성장판 닫히기 전 우리 아이 숨은 잠재키, 지금 프로필 링크에서 1초 만에 확인해보세요!"
- 30초 TTS 나레이션: "성장판 닫히기 전 마지막 골든타임, 프로필 링크에서 우리 아이 숨은 키를 지금 확인하세요!"`;

      const shortformScript = `[GoTall 스타일 '맘카페 댓글 대신 진단해 주기' 15초 화면녹화 숏폼 대본]
타겟: 초등 성장기 학부모
사운드: 경쾌한 비트 BGM (GoTall 스타일)

[0~3초: 훅(Hook)]
- 화면: 맘카페 실제 질문 캡처 ("초2 남아 키 124cm인데 부모 키 작으면 가망 없나요?")
- 자막/음성: "엄마 158, 아빠 171 아이의 유전 예상키는 171cm... 하지만 방해 습관 잡으면?"

[4~8초: 빠른 진단 입력(Fast Interaction)]
- 화면: 스마트폰 손가락 터치 녹화 화면. 키즈핏 앱에서 [남아], [만 8세/96개월], [아빠 171 / 엄마 158], [늦은 취침 + 거북목] 톡톡 누르고 [처방전 발급] 클릭.
- 효과: 삐빅! 효과음과 함께 분석 게이지 100% 도달.

[9~12초: 충격 반전 수치 공개(Shocking Reveal)]
- 화면: 3단 막대차트 수치 폭발 애니메이션!
  - ① 유전 예상키: 171.5cm
  - ② 방치 예측키: 168.5cm (-3.0cm 손실)
  - ③ 최대 잠재키: 178.0cm (+9.5cm 성장 폭발!)
- 자막/음성: "손실 -3cm 방치할래? 골든타임 관리로 +7cm 더 키울래?!"

[13~15초: 행동 유도(Call To Action)]
- 화면: 댓글란 화살표 애니메이션 & 프로필 링크 배너.
- 자막/음성: "질병관리청 공식 데이터 기반 무료 진단, 지금 프로필 링크에서 확인!"`;

      const blogColumn = `# 초등 저학년 성장판 닫히기 전 골든타임! 부모 유전키 극복하고 숨은 키 7cm 찾는 3대 원칙

안녕하세요! 두 아이를 키우며 육아와 성장의 최신 의학 정보를 나누는 워킹맘 에디터입니다.

새 학기가 시작되고 학교 상담이나 반 배정표를 볼 때마다 부모님들의 가장 큰 고민 중 하나는 바로 **"우리 아이가 또래보다 작은 건 아닐까?"** 하는 불안감입니다. 특히 엄마 키가 158cm, 아빠 키가 171cm처럼 대한민국 평균 체형이거나 다소 아담한 부모님들은 "결국 키는 유전이라는데 내가 물려준 유전자 때문에 아이가 손해 보는 건 아닐까" 자책하시곤 합니다.

하지만 소아청소년 내분비학 전문의들이 공통적으로 강조하는 진실이 있습니다. **유전이 최종 키에 미치는 영향은 약 70%이며, 나머지 30%의 환경적 관리(영양, 수면, 자세)에 따라 최종 성인 키는 무려 ±7~10cm까지 달라질 수 있습니다.**

오늘은 질병관리청(KDCA) 소아청소년 성장도표 공인 데이터를 바탕으로, 성장판이 활짝 열려 있는 초등 저학년 시기에 숨은 잠재키를 극대화하는 3대 핵심 원칙을 정리해 드립니다.

---

## 1. 부모 유전 예상키(MPH) 계산과 잔여 성장판 골든타임

의학계에서 표준적으로 사용하는 **부모 유전 예상키(Mid-Parental Height, MPH)** 공식은 다음과 같습니다:

- **남아 MPH** = (아빠 키 + 엄마 키 + 13cm) ÷ 2
- **여아 MPH** = (아빠 키 + 엄마 키 - 13cm) ÷ 2

예를 들어 아빠 키가 171cm이고 엄마 키가 158cm인 집의 아들이라면:
(171 + 158 + 13) ÷ 2 = **171.0cm**가 유전적 기준선이 됩니다.

하지만 이 기준선은 아이가 올바른 수면과 영양을 섭취했을 때의 평균치일 뿐입니다. 만약 밤 10시 30분 이후 늦게 자고, 스마트폰을 보느라 거북목 자세로 지낸다면 성장 손실치가 누적되어 **168.0cm 이하**로 떨어질 위험이 큽니다. 반대로 성장판 개방기인 지금 집중 관리하면 **178.0cm**까지 도약할 수 있습니다.

| 성장 단계 | 임상 특징 | 성장판 개방 상태 | 골든타임 잔여기간 |
| :--- | :--- | :--- | :--- |
| **안정 성장기 (초등 저학년)** | 연간 5~6cm 안정 성장 | **완전 개방** | **약 36~48개월 (기초체질 형성 최적기)** |
| **급성장기 (PHV)** | 연간 8~10cm 폭풍 성장 | **개방 유지** | 약 18~24개월 (1cm가 아쉬운 골든타임) |
| **사춘기 후기 (2차 성징)** | 체모, 변성기, 가슴멍울 | **점진적 폐쇄 진행** | 약 6~12개월 (성장판 폐쇄 긴급 카운트다운) |

---

## 2. 숨은 키 7cm를 되찾아주는 3대 홈케어 처방

### (1) 밤 10시 이전 숙면과 성장호르몬 분비 피크 사수
성장호르몬(Growth Hormone)의 일일 분비량 중 무려 65% 이상은 **밤 10시부터 새벽 2시 사이의 깊은 서파 수면(Slow-wave Sleep)** 단계에서 박동성으로 뿜어져 나옵니다. 취침 시간이 밤 11시로 밀리면 뇌하수체 호르몬 분비 피크가 통째로 절단됩니다. 최소 밤 9시 30분에는 조명을 낮추고 스마트폰 블루라이트를 차단해 멜라토닌 분비를 유도해야 합니다.

### (2) 흡수율 3배 구연산 칼슘과 활성형 비타민D3 공급
우유를 많이 먹인다고 키가 크는 시대는 지났습니다. 특히 한국 아동의 70% 이상은 유당불내증으로 인해 우유 섭취 시 장내 염증이나 복통을 겪으며 칼슘 흡수율이 급감합니다. 위산 분비 없이도 흡수율이 일반 탄산칼슘 대비 3배 높은 **구연산 칼슘**과 골기질 형성을 돕는 **아연·초유 단백질**을 선택하는 것이 현명합니다.

### (3) 척추 기립선을 살리는 거북목 교정과 실내 수직 점프 운동
책상에 웅크리고 앉아 스마트폰을 보는 습관은 경추 전만을 무너뜨리고 흉추를 굽게 만들어 척추 추간판을 강하게 압박합니다. 이것만 교정해도 즉시 **물리적 숨은 키 1.5~2.0cm**가 회복됩니다. 인체공학적 의자와 각도조절 독서대를 구비해주고, 매일 10분씩 무소음 실내 트램폴린으로 성장판에 수직 자극을 주는 루틴을 만들어주세요.

---

## 3. 우리 아이 맞춤 성장 단계 확인하는 법

시중에 수많은 영양제와 교구 광고가 넘쳐나지만, 남들이 좋다는 것을 무작정 따라 사기보다는 **우리 아이의 현재 월령과 사춘기 골든타임 단계에 맞춘 정확한 진단**이 선행되어야 합니다.

질병관리청 2017 소아청소년 성장도표 표준 Z-Score와 부모 유전키 MPH 공식을 적용하여, 우리 아이의 또래 백분위와 최대 잠재키, 그리고 이번 주말 맞춤 나들이 코스까지 한 번에 진단해주는 전문 서비스 **[키즈핏 그로스 스튜디오(KidsFit Growth Studio)]**를 적극 추천합니다.

로그인이나 복잡한 절차 없이 1초 만에 우리 아이 맞춤 처방전을 무료로 확인해보세요:
👉 **[키즈핏 그로스 스튜디오 무료 진단 바로가기](https://kidsfit.co.kr (글로벌 영문판: https://kidsfit.co.kr))**

더불어 같은 또래 아이를 키우는 엄마들과 함께 영양제·교구 최저가 공동구매 정보와 '월령별 소근육·선긋기 워크지 50종 PDF' 무료 혜택을 나누고 싶으시다면 공식 네이버 카페도 방문해보세요:
👉 **[키즈핏 공식 네이버 카페 바로가기](${cafeUrl})**`;

      const cafePost = `[제목] 초2 남아 키 124cm... 유전키 171 극복하고 숨은키 7cm 찾은 처방전 공유해요 (+영양제 최저가 공구 수요조사)

안녕하세요 선배맘님들! 8살 초등 2학년 아들 키우는 워킹맘입니다.

이번에 반 배정받고 학교 가보니 저희 아이가 번호 3번... 또래보다 한 뼘이나 작아서 가슴이 덜컥 내려앉더라고요.
제가 158cm, 남편이 171cm라 유전 예상키 계산해보니 딱 171cm 나오는데, 정말 유전 탓인가 싶어 미안한 마음에 며칠 밤을 잠 못 잤어요.

그러다 질병관리청 성장도표 공식 데이터 기반으로 진단해주는 키즈핏 그로스 스튜디오를 알게 돼서 정밀 진단을 돌려봤는데요.
저희 아이가 밤 10시 넘어 늦게 자고 스마트폰 보느라 거북목이 심한 편이었는데, 이 방해 습관만 잡아도 유전키를 뛰어넘어 최대 178cm까지 잠재력이 있다는 결과가 나오더라고요!

소아성장 전문 처방대로 딱 3가지 바꿨습니다:
1. 밤 9시 30분 암막 커튼 치고 10시 이전 서파 수면 확보
2. 우유 대신 배앓이 없는 구연산 칼슘 + 뉴질랜드 초유 단백 스틱 루틴
3. 거북목 교정용 원목 독서대 세팅 & 실내 트램폴린 점핑 매일 10분

혹시 저처럼 아이 키 때문에 고민이신 분 계시면 질병관리청 백분위랑 숨은키 먼저 무료로 진단해보세요:
👉 https://kidsfit.co.kr (글로벌 영문판: https://kidsfit.co.kr)

---
[공구 수요조사]
그리고 이번에 키즈핏 제휴로 약국 판매 정품 [흡수율 3배 구연산 칼슘 시럽 + 초유 단백 스틱 세트] 최저가 공구 추진 중인데, 함께 참여하실 분 계실까요?
참여 원하시는 분은 댓글로 아이 성별/나이 남겨주시면 공구 오픈 시 가장 먼저 쪽지 알림 드리겠습니다!`;

      return { webtoonStoryboard, shortformScript, blogColumn, cafePost };
    } else if (scenarioId === 'scenario-3') {
      // Scenario 3: 주말 역사 박물관 코스
      const webtoonStoryboard = `[네이버 클립·릴스 6컷 공감 육아 웹툰 콘티 & 30초 TTS 대본]
시나리오: 이번 주말 초등 역사 박물관 코스 & 필수 보드게임

[컷 1]
- AI 이미지 프롬프트: Exhausted parents sitting at a crowded kids cafe, noisy environment with crying children, looking drained.
- 말풍선: "주말마다 키즈카페만 가다 보니 돈은 10만 원씩 깨지고... 애도 나도 피곤하기만 해."
- 30초 TTS 나레이션: "매주 주말 반복되는 키즈카페 뺑뺑이, 지갑은 털리고 아이도 부모도 지쳐가나요?"

[컷 2]
- AI 이미지 프롬프트: Smartphone opening KidsFit app, selecting Region [Seoul] and Interest [History], showing curated course card C07.
- 말풍선: "키즈핏 주말 나들이 큐레이션! 내 동네 × 아이 관심사 누르면 1초 만에 원데이 성장 코스 추천?"
- 30초 TTS 나레이션: "내 사는 동네와 아이 관심사를 누르면 1초 만에 완성되는 주말 원데이 나들이 코스."

[컷 3]
- AI 이미지 프롬프트: National Museum of Korea, bright sunny day, father and daughter entering the children's museum holding hands happily.
- 말풍선: "국립중앙박물관 어린이박물관! 발달 관람 포인트와 예약 꿀팁까지 다 알려주네!"
- 30초 TTS 나레이션: "관람 포인트와 예약 꿀팁, 추천 동선까지 완벽하게 정리된 맞춤 코스."

[컷 4]
- AI 이미지 프롬프트: Living room floor, child assembling a 3D wooden palace model and reading pop-up history book with sparkling eyes.
- 말풍선: "다녀오기 전 연계 팝업북 3회독 했더니 박물관 유물을 스스로 척척 찾아내요!"
- 30초 TTS 나레이션: "다녀오기 전 연계 팝업북 3회독, 박물관 유물을 스스로 찾아내는 놀라운 집중력!"

[컷 5]
- AI 이미지 프롬프트: Happy family high-fiving at home playing Korean history board game on a cozy rug.
- 말풍선: "단순한 나들이가 아니라 역사 인지력이 폭발하는 진짜 주말 성장 체험 완성!"
- 30초 TTS 나레이션: "비싼 키카 대신 아이 머릿속에 평생 남는 최고의 주말 성장 코스."

[컷 6]
- AI 이미지 프롬프트: KidsFit app screen showing 40 regional courses with Coupang rocket delivery badge.
- 말풍선: "이번 주말 어디 갈지 고민 끝! 프로필 링크에서 우리 동네 맞춤 나들이를 확인하세요!"
- 30초 TTS 나레이션: "이번 주말 어디 갈지 고민 끝! 프로필 링크에서 1초 만에 확인해보세요!"`;

      const shortformScript = `[GoTall 스타일 15초 화면녹화 숏폼 대본]
타겟: 주말 나들이 고민 학부모
사운드: 신나는 비트 BGM

[0~3초: 훅(Hook)]
- 화면: "주말에 키즈카페 가서 10만 원 쓰고 후회하는 엄마들 주목!" 텍스트 강조.
- 자막/음성: "이번 주말 어디 가지? 아직도 키카 가시나요?"

[4~8초: 빠른 입력(Fast Interaction)]
- 화면: 키즈핏 탭 3에서 [거주 지역]과 [역사/전통] 칩 누르는 화면 녹화.
- 자막/음성: "내 사는 동네랑 아이 관심사만 누르면?"

[9~12초: 맞춤 코스 & 연계 팝업북 공개(Reveal)]
- 화면: 국립중앙박물관 어린이박물관 코스 + 관람 포인트 + 쿠팡 로켓배송 연계 팝업북 세트가 한눈에 펼쳐짐.
- 자막/음성: "1초 만에 주말 코스 & 전후 연계 도서 패키지 완벽 매칭!"

[13~15초: 행동 유도(Call To Action)]
- 화면: 40개 전국 권역 코스 지도와 프로필 링크 클릭 유도.
- 자막/음성: "이번 주말 코스, 지금 무료로 확인하세요!"`;

      const blogColumn = `# 이번 주말 아이와 어디 가지? 키즈카페 대신 역사 인지력 200% 키우는 국립중앙박물관 핀셋 나들이 코스

주말만 되면 "이번엔 또 어디를 가야 하나" 스마트폰을 붙잡고 고민하는 대한민국 부모님들의 마음은 다 똑같을 것입니다. 비싼 입장료를 내고 대형 키즈카페에 다녀와도 아이는 금세 지루해하고, 부모는 소음에 지쳐 돌아오기 일쑤입니다. 실제로 4인 가족 기준 키즈카페 2시간 입장료와 식음료 비용으로 8~10만 원이 순식간에 지출되지만, 아이에게 남는 것은 일시적인 도파민 분비뿐입니다.

하지만 같은 3시간을 쓰더라도 **아이의 관심사(역사, 미술, 공룡, 과학)에 꼭 맞춘 전시 코스에 다녀오기 전 연계 도서로 배경지식을 미리 채워주면, 아이의 인지력과 어휘력은 폭발적으로 성장합니다.**

| 비교 항목 | 일반 대형 키즈카페 방문 | 키즈핏 핀셋 맞춤 나들이 코스 |
| :--- | :--- | :--- |
| **1회 지출 비용** | 4인 기준 약 80,000 ~ 120,000원 | **국공립 박물관 무료 (사전 예약제)** |
| **아이 뇌 자극 영역** | 단순 대근육 소모 및 청각 자극 피로 | **시지각 변별력, 공간 추론, 역사 서사 이해** |
| **방문 전후 연속성** | 귀가 후 즉시 휘발 (단발성 소비) | **전후 연계 팝업북 & 탐정 워크북으로 지식 내재화** |
| **부모 피로도** | 소음과 인파 속 단순 대기·감시 | **큐레이션 동선과 해설 포인트로 함께 즐기는 문화 체험** |

오늘은 서울 강북·마포·용산 및 수도권 학부모님들을 위해 준비된 **국립중앙박물관 어린이박물관 & 경복궁 원데이 코스**와 실패 없는 꿀팁을 소개해 드립니다.

---

## 1. 코스 개요 및 발달 관람 포인트

- **추천 대상**: 만 5세~초등 3학년 (호기심과 시대 순서 인지력이 형성되는 시기)
- **대표 명소**: 국립중앙박물관 어린이박물관 & 경복궁 근정전 해설 투어
- **핵심 발달 포인트**:
  1. 신라 금관과 토기 복원 퍼즐을 통한 고고학적 형태 인지 및 소근육 조작
  2. 조선 궁궐의 목조 짜맞춤 결구 방식을 직접 맞춰보며 3차원 입체 공간감각 체득
  3. 경복궁 근정전과 사정전을 걸으며 조선 국왕의 일상과 역사적 서사 이해

---

## 2. 사전 예약 꿀팁 및 추천 동선

국립중앙박물관 어린이박물관은 쾌적한 관람을 위해 100% 회차별 사전 예약제로 운영됩니다:

- **예약 오픈 일정**: 매월 25일 00시에 익월 예약 시스템이 열립니다. 주말 황금 시간대(오전 11시, 오후 2시)는 조기 마감되므로 사전 알림 설정이 필수입니다.
- **추천 동선**:
  - 오전 10:00: 어린이박물관 입장 (토기 맞추기, 가옥 조립 인터랙티브 체험)
  - 오전 11:30: 박물관 야외 거울못과 청자정 산책 및 점심 식사
  - 오후 01:30: 경복궁으로 이동하여 근정전 해설 투어 관람

---

## 3. 다녀오기 전후 효과를 200% 극대화하는 연계 패키지

박물관에 가기 전 아무런 사전 지식 없이 도착하면 아이 눈에는 그저 '오래된 돌과 그릇'으로 보일 뿐입니다. 하지만 전날 밤 **입체 팝업북과 조립 키트**로 미리 만나본 문화재를 전시관에서 실물로 발견하는 순간, 아이의 눈빛은 완전히 달라집니다:

- **추천 패키지**: [국보 문화재 입체 3D 퍼즐 + 만화 한국사 입문 세트]
- **활용법**: 가기 전날 팝업북을 함께 읽으며 "내일 박물관에 가서 이 금관을 직접 찾아보자!"는 탐정 미션을 부여하세요.
- **사후 독후 활동**: 돌아온 날 저녁에는 관람 티켓을 스크랩북에 붙이고, 박물관에서 가장 인상 깊었던 유물을 점토나 레고로 직접 만들어보는 시간을 가지면 장기 기억으로 전환됩니다.

---

## 4. 우리 동네 맞춤 주말 나들이 찾는 법

주말마다 "이번 주엔 또 어디 가지?" 고민하며 맘카페 검색창을 헤맬 필요가 없습니다. 전국 8개 권역(서울 강남/강북, 경기 남부/북부, 부산, 대구, 대전, 광주) × 5개 테마(그림, 역사, 공룡, 과학, 음악)별 40종의 나들이 코스와 연계 도서 패키지는 **[키즈핏 그로스 스튜디오]**에서 1초 만에 무료로 확인하실 수 있습니다:
👉 **[키즈핏 그로스 스튜디오 주말 코스 확인하기](https://kidsfit.co.kr (글로벌 영문판: https://kidsfit.co.kr))**

더 많은 주말 나들이 후기와 무료 워크지를 원하신다면 네이버 카페로 놀러오세요:
👉 **[키즈핏 공식 네이버 카페 바로가기](${cafeUrl})**`;

      const cafePost = `[제목] 주말 키카 대신 국립중앙박물관 어린이박물관 다녀왔어요! 꿀팁 & 연계 팝업북 나눔해요 (+역사 보드게임 공구)

안녕하세요 맘님들! 이번 주말에 7살 딸아이 데리고 국중박 어린이박물관 다녀왔는데 너무 만족스러워서 후기 남깁니다.

그동안 주말마다 키카 가느라 돈만 쓰고 남는 게 없었는데, 키즈핏에서 추천해준 코스대로 다녀오니 아이 집중력이 완전 다르더라고요!
가기 전에 쿠팡으로 [문화재 입체 3D 퍼즐 팝업북] 시켜서 하루 전날 밤에 같이 맞춰보고 갔더니, 박물관 가자마자 "엄마! 어제 책에서 본 빗살무늬토기 저기 있어!" 하면서 뛰어가는 모습에 감동받았습니다.

혹시 주말 코스 고민이신 분들은 내 지역이랑 관심사 넣으면 바로 나오는 키즈핏 코스 꼭 확인해보세요:
👉 https://kidsfit.co.kr (글로벌 영문판: https://kidsfit.co.kr)

---
[카페 회원 나눔 & 공구]
박물관 다녀와서 집에서 풀기 좋은 '초등 역사 인물 스티커 워크지 PDF' 카페 자료실에 무료로 올려두었으니 다운받아가시고요!
다음 주에 박물관 필수 3D 입체 퍼즐 & 보드게임 최저가 공구 진행 예정이니 원하시는 분은 댓글 남겨주세요!`;

      return { webtoonStoryboard, shortformScript, blogColumn, cafePost };
    }

    // Default: Scenario 1 (워킹맘이 놓친 만 3세 소근육 & 몬테소리 발견기)
    const webtoonStoryboard = `[네이버 클립·인스타 릴스 6컷 공감 육아 웹툰 콘티 & 30초 TTS 대본]
시나리오: 워킹맘이 놓친 만 3세 소근육 & 몬테소리 발견기

[컷 1]
- AI 이미지 프롬프트: Korean webtoon pastel style, cute 3yo toddler girl crying holding plastic safety scissors, paper torn unevenly, tired working mom in office attire looking guilty and worried, warm interior lighting.
- 말풍선: "퇴근하고 보니 어린이집 알림장에 또래 친구들은 가위질을 척척 하는데... 내가 바빠서 놓쳤나?"
- 30초 TTS 나레이션: "야근하고 돌아온 저녁, 어린이집 알림장을 보다 또래보다 서툰 아이의 손가락을 보며 왈칵 눈물이 났습니다."

[컷 2]
- AI 이미지 프롬프트: Working mom looking at smartphone screen with dozens of shopping tabs: Gabe, Eunmul, Montessori, price tags of 2,000,000 KRW, overwhelmed expression.
- 말풍선: "가베? 은물? 몬테소리? 백만 원 넘는 비싼 전집을 사줘야 하나... 대체 뭘 먼저 시작해야 하지?"
- 30초 TTS 나레이션: "백만 원이 훌쩍 넘는 비싼 교구들, 이름도 생소한 가베와 몬테소리 중 대체 뭘 사야 할지 막막했던 순간."

[컷 3]
- AI 이미지 프롬프트: Clean clinic smartphone app screen showing KidsFit Growth Studio, pediatric diagnostic badge, green clear advice saying '만 3세 가베 비추천! 몬테소리 일상 소근육 적기'.
- 말풍선: "보건복지부 K-DST 기준 만 3세는 가베보다 몬테소리 손끝 삼지창 조작이 먼저라고?!"
- 30초 TTS 나레이션: "하지만 K-DST 발달 진단 결과, 만 3세에 가베는 중복 지출! 지금은 손끝 삼지창을 쓰는 몬테소리 소근육이 먼저였습니다."

[컷 4]
- AI 이미지 프롬프트: Cozy living room, 3yo toddler girl deeply focused using wooden tweezers and cylinder blocks, bright focused eyes, smiling mother.
- 말풍선: "단돈 2~3만 원대 원목 핀셋과 꼭지 원기둥으로 아이가 30분 넘게 초집중해요!"
- 30초 TTS 나레이션: "비싼 전집 대신 손끝 힘을 길러주는 원목 핀셋과 원기둥, 아이의 눈빛이 몰입으로 빛나기 시작했습니다."

[컷 5]
- AI 이미지 프롬프트: Weekend children's art museum studio, mother and daughter happily finger-painting on a large canvas, colorful pastel smears.
- 말풍선: "주말에는 집 근처 촉각 미술관 나들이로 소근육 자극 200% 완성!"
- 30초 TTS 나레이션: "주말에는 동네 맞춤 촉각 미술관 나들이로 이어지는 오감 자극 성장 루틴."

[컷 6]
- AI 이미지 프롬프트: Warm illustration of mother hugging child, KidsFit studio logo and website preview, soft pastel CTA banner.
- 말풍선: "우리 아이 지금 딱 맞는 발달 교구와 주말 코스, 프로필 링크에서 1초 만에 무료로 확인해보세요!"
- 30초 TTS 나레이션: "엄마의 지갑을 지켜주고 아이의 잠재력을 깨우는 맞춤 처방전, 프로필 링크에서 지금 무료로 확인하세요!"`;

    const shortformScript = `[GoTall 스타일 '맘카페 댓글 대신 진단해 주기' 15초 화면녹화 숏폼 대본]
타겟: 만 2~4세 자녀 둔 육아맘·워킹맘
사운드: 틱톡/릴스 유행 경쾌한 스탭 사운드

[0~3초: 훅(Hook)]
- 화면: 맘카페 실제 글 캡처 클로즈업 ("만 3세인데 소근육 늦은 아이... 200만 원짜리 프뢰벨 가베 들여야 할까요?")
- 자막/음성: "만 3세 소근육 늦은 아이, 200만 원 가베 결제 직전이라면 멈추세요!"

[4~8초: 빠른 진단 입력(Fast Interaction)]
- 화면: 키즈핏 웹 화면에서 [여아], [36개월], [소근육 발달 고민], [몬테소리]를 빠르게 톡톡 누르는 화면 녹화.
- 자막/음성: "보건복지부 K-DST 기준으로 딱 1초 만에 돌려보니?"

[9~12초: 충격 반전 진단 결과(Reveal)]
- 화면: 6각 발달 레이더에서 소근육 집중 처방 & [만 3세 가베 결제 비추! 몬테소리 일상 조작 교구 우선] 팝업 클로즈업.
- 자막/음성: "만 3세에 가베 사면 엄마표 방치템 됩니다! 2만 원대 몬테소리 핀셋부터 시작하세요!"

[13~15초: 행동 유도(Call To Action)]
- 화면: 영수증 UI와 함께 "댓글 링크에서 내 아이 개월 수 1초 무료 진단!" 화살표 번쩍임.
- 자막/음성: "엄마 지갑 지켜주는 무료 발달 처방전, 지금 댓글 링크에서 확인!"`;

    const blogColumn = `# 만 3세(36개월) 소근육 발달 늦은 아이, 가베 vs 몬테소리 중복 지출 없이 끝내는 법

안녕하세요! 일과 육아를 병행하며 아이의 매 순간 골든타임을 고민하는 워킹맘입니다.

아이가 만 3세(36개월) 전후가 되면 어린이집 선생님으로부터 이런 피드백을 자주 받게 됩니다:
*"어머니, 지우가 가위질할 때 손가락 힘이 조금 부족해서 종이가 찢어져요."*
*"블록을 꽉 쥐거나 숟가락질할 때 손끝 조작을 조금 더 연습하면 좋겠어요."*

이런 말을 듣는 순간 가슴이 철렁 내려앉으며 맘카페를 뒤지기 시작합니다. 검색창에는 온갖 고가의 교구 이름들이 쏟아져 나옵니다.
*"프뢰벨 은물 가베 150만 원 풀세트 들였어요."*
*"몬테소리 정품 센터 수업 주 1회 20만 원이에요."*

하지만 수백만 원을 결제하기 전, 소아 발달학적으로 지금 우리 아이에게 정말 필요한 것이 무엇인지 따져보셨나요? 오늘은 보건복지부 한국 영유아 발달선별검사(K-DST) 기준에 따라, **불필요한 중복 지출을 막고 아이의 손끝 전두엽 시냅스를 확실하게 깨워주는 월령별 교구 판정법**을 정리해 드립니다.

---

## 1. 36개월 소근육 골든타임을 놓치면 안 되는 의학적 이유

인간의 뇌 지도(호문쿨루스)를 살펴보면 손가락을 관장하는 뇌 영역이 전체 운동 피질의 3분의 1 이상을 차지합니다. 특히 만 2~4세는 엄지, 검지, 중지 세 손가락으로 물건을 쥐는 **'삼지창 파지(Three-jaw chuck grasp)'** 능력이 완성되는 결정적 민감기입니다.

이 시기에 손끝 힘과 협응력을 길러주지 않으면:
1. 만 5세 이후 연필 잡기(바른 파지법)에 심한 피로감을 느끼며 쓰기 학습을 거부하게 됩니다.
2. 젓가락질, 옷 단추 끼우기, 신발 신기 등 자조 기능이 늦어져 또래 집단에서 자존감이 저하될 수 있습니다.

---

## 2. 몬테소리 vs 프뢰벨 가베의 결정적 차이 비교

많은 부모님들이 몬테소리와 가베를 혼동하여 동시에 들이거나, 시기에 맞지 않는 교구를 사서 방치하곤 합니다. 두 교육법은 지향점과 적기 연령이 완전히 다릅니다.

| 비교 항목 | 몬테소리 (Montessori) | 프뢰벨 은물 / 가베 (Froebel Gabe) |
| :--- | :--- | :--- |
| **핵심 발달 목표** | **손끝 소근육 악력, 일상 자율성, 감각 탐색** | **3차원 공간지각, 기하 도형, 수학적 분할과 합성** |
| **최적 권장 월령** | **만 2~3세 (24~47개월)** | **만 4~5세 (48~71개월)** |
| **주요 활동 형태** | 핀셋 집기, 끈 꿰기, 단추 잠그기, 원기둥 맞추기 | 구·정육면체 분해, 점·선·면을 이용한 건축 조립 |
| **조기 도입 시 부작용**| 부작용 거의 없음 (일상생활 밀착형) | **손끝 힘이 없어 블록을 무너뜨리고 흥미 상실, 방치템 전락** |

> **⚠️ 워킹맘 지갑 지킴이 한 줄 조언:**
> 만 2~3세 아이에게 3차원 입체 기하 도형인 가베를 사주면 아이는 조작하지 못해 좌절하고, 엄마는 비싼 교구가 거실에 굴러다니는 모습을 보며 스트레스만 받습니다. **만 3세에는 무조건 손가락 힘을 기르는 몬테소리 일상·감각 교구부터 시작하세요!** 가베는 만 4세 이후 손끝 힘이 다져졌을 때 들여도 결코 늦지 않습니다.

---

## 3. 워킹맘이 직접 써보고 검증한 가성비 핫템 교구 3선

비싼 백만 원대 풀세트를 통째로 들일 필요가 전혀 없습니다. 아이의 발달 수준에 딱 맞는 핵심 아이템 2~3가지만으로도 충분합니다:

1. **몬테소리 꼭지원기둥 원목 실린더 4종 세트 (3만 원대)**: 굵기와 높이가 다른 실린더를 엄지·검지로 집어 홈에 맞추며 손끝 감각과 눈-손 협응력을 완성합니다.
2. **일상 조작 원목 핀셋 & 단추 끼우기 세트 (2만 원대)**: 안전 원목 핀셋으로 구슬을 옮기며 연필을 잡는 기초 소근육 악력을 단련합니다.
3. **무독성 안전 가위 & 입체 선긋기 워크북 (1만 원대)**: 손잡이에 스프링이 달린 안전 가위로 직선과 곡선을 오리며 가위질 근육 기억을 만듭니다.

---

## 4. 우리 아이 맞춤 발달 처방전 무료로 받는 법

아이마다 손끝 발달 속도와 기질이 모두 다릅니다. 남들의 추천 글만 보고 덜컥 결제하기 전에, **우리 아이의 정확한 월령과 발달 고민에 맞춘 소아 발달 처방전**을 먼저 받아보시는 것을 추천합니다.

질병관리청(KDCA) 소아청소년 성장도표와 보건복지부 K-DST 영유아 발달선별검사 공표 기준을 적용한 **[키즈핏 그로스 스튜디오(KidsFit Growth Studio)]**에서는 아이의 월령과 고민 태그를 클릭하면 1초 만에 6각 발달 레이더 차트와 맞춤 교육법 판정 리포트를 제공합니다:

👉 **[키즈핏 그로스 스튜디오 무료 처방전 발급받기](https://kidsfit.co.kr (글로벌 영문판: https://kidsfit.co.kr))**

또한 같은 개월 수 아이를 키우는 엄마들이 모여 '월령별 소근육 가위질·선긋기 워크지 50종 PDF'를 무료로 나누고 교구 공동구매를 진행하는 공식 네이버 카페도 함께 확인해보세요:
👉 **[키즈핏 공식 네이버 카페 바로가기](${cafeUrl})**`;

    const cafePost = `[제목] 만 3세 소근육 늦은 아이, 200만 원 가베 대신 3만 원 몬테소리로 대성공한 후기 (+가위질 워크지 PDF 무료나눔)

안녕하세요 선배맘님들! 36개월 딸아이 키우는 워킹맘입니다.

어린이집에서 아이가 가위질도 서툴고 블록 쥘 때 손에 힘이 너무 없다는 말을 듣고 덜컥 겁이 났습니다.
주변에서 프뢰벨 가베를 사줘야 하네, 몬테소리 센터를 등록해야 하네 해서 수백만 원짜리 결제 직전까지 갔었는데요.

우연히 보건복지부 K-DST 발달검사 기준을 적용해주는 '키즈핏 그로스 스튜디오'에서 진단을 받아보고 정신이 번쩍 들었습니다.
만 3세에는 추상적인 가베를 사주면 아이가 손끝 힘이 없어 블록을 못 다루고 방치템이 되기 십상이고, 지금은 손끝 삼지창 근육을 키우는 몬테소리 원목 핀셋이랑 원기둥이 최적이라는 판정이 나오더라고요!

그래서 200만 원짜리 전집 대신 쿠팡에서 딱 3만 원대 원목 꼭지원기둥 세트 사줬는데, 아이가 하루에 30분씩 꼼짝도 않고 집중해서 맞추더니 한 달 만에 가위질이랑 젓가락질을 척척 해냅니다!

혹시 저처럼 비싼 교구 고민 중이신 분들은 지갑 열기 전에 키즈핏에서 내 아이 월령에 맞는 교육법 먼저 무료로 확인해보세요:
👉 https://kidsfit.co.kr (글로벌 영문판: https://kidsfit.co.kr)

---
[워크지 무료 나눔]
그리고 제가 집에서 아이 가위질 연습시키려고 직접 만든 '월령별 소근육 선긋기·가위질 워크지 50종 PDF' 카페 자료실에 무료로 올려두었습니다!
댓글로 아이 개월 수 남겨주시면 PDF 다운로드 링크 1:1 쪽지 보내드릴게요 :)`;

    return { webtoonStoryboard, shortformScript, blogColumn, cafePost };
  }

  function generateCardNewsAndFlowBundle(scenarioId = 'scenario-1') {
    const cardnewsStoryboard = `[네이버 블로그·인스타·유튜브 쇼츠 6컷 양육 공감 카드뉴스 & 영상 TTS 대본]
주제: "퇴근 후 매일 미안한 엄마에게 — 만 3세 아이의 고집은 '손끝 소근육 민감기' 신호입니다" (보건복지부 K-DST & 질병관리청 데이터 기반)

[카드 1 — 표지 (공감 훅)]
- 헤드라인: "내가 다 할 거야!" 매일 밤 단추 씨름하며 울컥하는 엄마에게
- 서브카피: 만 2~4세 아이의 고집, 사실은 전두엽이 보내는 '소근육 성장 신호'입니다
- 영상 TTS (0~5초): "퇴근 후 바쁜 저녁, 내가 할 거라며 고집부리고 물을 쏟는 아이 앞에서 오늘도 한숨 쉬셨나요?"

[카드 2 — 의학적 팩트체크 (뇌과학 & K-DST)]
- 헤드라인: 손가락은 '제2의 뇌' — 대뇌 운동피질의 30%가 손끝에 연결됩니다
- 핵심 데이터: 보건복지부 K-DST 영유아 발달선별검사 기준, 24~47개월은 엄지·검지·중지 '삼지창 파지(Three-jaw chuck)'가 완성되는 결정적 민감기!
- 영상 TTS (5~11초): "아이의 고집은 엄마를 힘들게 하려는 게 아닙니다. 뇌 운동피질의 30%와 연결된 손끝 시냅스를 스스로 깨우려는 기특한 발달 본능입니다."

[카드 3 — 워킹맘 지갑 지킴이 비교표 (몬테소리 vs 가베)]
- 헤드라인: 만 3세에 150만 원 가베 전집? 시기가 다르면 '거실 방치템' 됩니다
- 비교 핵심: 만 2~3세는 [몬테소리 일상·소근육 조작] 적기 / 만 4~5세 이후 [프뢰벨 은물·가베 3D 공간지각] 적기
- 영상 TTS (11~17초): "불안한 마음에 백만 원대 가베 전집부터 찾지 마세요. 만 3세에는 추상 도형보다 손가락 힘을 기르는 일상 조작 놀이가 먼저입니다."

[카드 4 — 오늘 저녁 거실 0원 일상 놀이 처방 3선]
- 헤드라인: 비싼 교구 사기 전, 오늘 저녁 주방 서랍으로 시작하는 '0원 놀이'
- 실천 3선: ① 나무 빨래집게 색깔 짝맞추기 (손끝 악력) ② 페트병 뚜껑 저금통 넣기 (눈-손 협응) ③ 휴지심 사자 갈기 안전가위 오리기
- 영상 TTS (17~23초): "오늘 저녁엔 비싼 장난감 대신 빨래집게와 페트병 뚜껑을 건네주세요. 아이가 20분 넘게 초집중하는 기적이 시작됩니다."

[카드 5 — 숨은 키 7cm 신체 성장 골든타임 루틴]
- 헤드라인: 두뇌만큼 중요한 '밤 10시 성장호르몬 & 바른 식탁 루틴'
- 핵심 데이터: 질병관리청(KDCA) 성장도표 & 한국인 영양소 섭취기준(KDRIs) — 밤 10시 서파수면(GH 65% 분비) + 일일 칼슘 600mg·비타민D 400IU 충족
- 영상 TTS (23~29초): "낮에 손끝을 충분히 쓴 아이는 밤 10시 깊은 서파수면에 빠져 성장호르몬이 3배 더 활발하게 분비됩니다."

[카드 6 — 부모 마음 처방 & 무료 진단 안내]
- 헤드라인: 완벽한 엄마보다 '아이의 속도를 읽어주는 다정한 엄마'면 충분합니다
- 하단 안내: 질병관리청 성장도표 × 보건복지부 K-DST 기반 우리 아이 1분 무료 발달·성장 처방소 [키즈핏 그로스 스튜디오]
- 영상 TTS (29~35초): "오늘도 최선을 다한 엄마 아빠를 응원합니다. 우리 아이 월령별 맞춤 성장·발달 방향, 키즈핏 그로스 스튜디오에서 무료로 확인해 보세요."`;

    const googleFlowPrompts = `[안티그래비티 × 구글 Flow (labs.google/fx/tools/flow · Veo 3.1) 영상 제작 프롬프트 세트]
활용 모드:
① Ingredients to Video: 엄마 캐릭터 시트 + 아이 캐릭터 시트 + 파스텔 배경 시트 3장을 Ingredients에 등록하여 6컷 전체 캐릭터 일관성 100% 고정
② Frames to Video: 키즈핏에서 생성한 웹툰/카드뉴스 각 컷 이미지를 시작 프레임(Start Frame)으로 업로드 후 아래 카메라 모션 프롬프트 입력

[Cut 1 — Frames to Video 프롬프트]
Warm Korean pastel watercolor webtoon animation. A tired 35-year-old Korean mother in a cream cardigan kneels in a cozy apartment entryway at evening, gently watching her 3-year-old toddler in a mint striped shirt trying to button his shirt and spilling a little water. Subtle slow push-in camera motion, warm ambient indoor lighting, soft breathing and natural blinking, emotional cinematic parenting mood, 9:16 vertical.

[Cut 2 — Frames to Video 프롬프트]
Warm Korean pastel webtoon style. Late night under a warm desk lamp, the Korean mother looks lovingly at her sleeping toddler under a soft blanket, resting her chin on her hand with a tender, reflective expression. Gentle warm light particles floating, slow camera pan, peaceful lullaby atmosphere, 9:16 vertical.

[Cut 3 — Frames to Video 프롬프트]
Warm Korean pastel webtoon style. The mother looks at a glowing pediatric brain-and-hand development illustration on her tablet, her face brightening with a warm relieved smile ("Aha!" moment). Soft golden-mint light glow around the synapse graphic, subtle zoom-in, 9:16 vertical.

[Cut 4 — Frames to Video 프롬프트]
Warm Korean pastel webtoon style. Sunny weekend morning in a bright Korean living room. The toddler happily picks up colorful pom-poms with wooden tongs and threads large wooden beads with focused little hands while the mother smiles warmly beside him. Natural morning sunlight streaming through sheer curtains, gentle motion, 9:16 vertical.

[Cut 5 — Frames to Video 프롬프트]
Warm Korean pastel webtoon style. Sunlit children's art museum park. Mother and father squat down to eye-level with their beaming 3-year-old toddler, pointing and talking happily about a colorful art sculpture together. Gentle breeze moving hair and leaves, warm family joy, 9:16 vertical.

[Cut 6 — Frames to Video 프롬프트]
Warm Korean pastel webtoon style. Close-up heartwarming hug between the smiling mother and her 3-year-old toddler holding up a paper heart cut with safety scissors. Soft pastel sparkles and warm bokeh in background, gentle pull-back camera motion, 9:16 vertical.`;

    return { cardnewsStoryboard, googleFlowPrompts };
  }

  // Render OSMU Admin Studio Tabs
  function renderOsmuStudioUI(scenarioId = 'scenario-1', affiliateConfig = {}) {
    const bundle = generateOsmuBundle(scenarioId, affiliateConfig);
    const extra = generateCardNewsAndFlowBundle(scenarioId);

    return `
      <div class="osmu-studio-wrapper" style="margin-top: 1.5rem; border-top: 1.5px solid #E2E8F0; padding-top: 1.5rem;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
          <div>
            <h4 style="font-size: 1.15rem; font-weight: 800; color: #1E293B; margin: 0 0 0.25rem 0;">
              📢 OSMU 6채널 원소스 멀티유즈 양육 콘텐츠 &amp; 구글 Flow 영상 스튜디오
            </h4>
            <p style="font-size: 0.84rem; color: #64748B; margin: 0;">
              시나리오를 선택하면 6컷 웹툰, 카드뉴스, 숏폼, 2,000자 블로그, 카페 글, 구글 Flow 영상 프롬프트가 1초 만에 생성됩니다.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label for="osmu-scenario-select" style="font-size: 0.85rem; font-weight: 700; color: #334155;">시나리오 선택:</label>
            <select id="osmu-scenario-select" class="form-select" style="font-size: 0.85rem; padding: 0.4rem 0.8rem; border-radius: 10px;">
              <option value="scenario-1" ${scenarioId === 'scenario-1' ? 'selected' : ''}>시나리오 1: 3세 소근육 &amp; 몬테소리</option>
              <option value="scenario-2" ${scenarioId === 'scenario-2' ? 'selected' : ''}>시나리오 2: 초2 남아 숨은 키 7cm</option>
              <option value="scenario-3" ${scenarioId === 'scenario-3' ? 'selected' : ''}>시나리오 3: 주말 역사 박물관 코스</option>
            </select>
          </div>
        </div>

        <!-- Channel Navigation Tabs -->
        <div class="osmu-channel-tabs" style="display: flex; gap: 0.5rem; border-bottom: 2px solid #E2E8F0; padding-bottom: 0.5rem; margin-bottom: 1rem; overflow-x: auto;">
          <button type="button" class="btn btn-secondary osmu-tab-btn active" data-channel="webtoon" style="font-size: 0.82rem; padding: 0.45rem 0.75rem;">🎨 6컷 웹툰 &amp; 영상대본</button>
          <button type="button" class="btn btn-secondary osmu-tab-btn" data-channel="cardnews" style="font-size: 0.82rem; padding: 0.45rem 0.75rem;">📊 6컷 카드뉴스 &amp; 영상대본</button>
          <button type="button" class="btn btn-secondary osmu-tab-btn" data-channel="flow" style="font-size: 0.82rem; padding: 0.45rem 0.75rem;">🎬 구글 Flow 영상 프롬프트</button>
          <button type="button" class="btn btn-secondary osmu-tab-btn" data-channel="shortform" style="font-size: 0.82rem; padding: 0.45rem 0.75rem;">📱 15초 숏폼 대본</button>
          <button type="button" class="btn btn-secondary osmu-tab-btn" data-channel="blog" style="font-size: 0.82rem; padding: 0.45rem 0.75rem;">✍️ 2,000자 블로그 칼럼</button>
          <button type="button" class="btn btn-secondary osmu-tab-btn" data-channel="cafe" style="font-size: 0.82rem; padding: 0.45rem 0.75rem;">☕ 카페 양육칼럼 &amp; 관리</button>
        </div>

        <!-- Channel Content Displays -->
        <div class="osmu-content-panels">
          
          <!-- Panel 1: Webtoon -->
          <div class="osmu-panel" id="osmu-panel-webtoon">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #475569;">네이버 클립·인스타 릴스용 6컷 웹툰 콘티 &amp; 30초 TTS</span>
              <button type="button" class="btn btn-primary btn-copy-osmu" data-target="osmu-text-webtoon" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">📋 원클릭 복사</button>
            </div>
            <textarea id="osmu-text-webtoon" readonly style="width: 100%; height: 220px; font-family: monospace; font-size: 0.82rem; padding: 0.85rem; border: 1px solid #CBD5E1; border-radius: 12px; background: #F8FAFC; resize: vertical; box-sizing: border-box;">${bundle.webtoonStoryboard}</textarea>
          </div>

          <!-- Panel 1-B: CardNews -->
          <div class="osmu-panel" id="osmu-panel-cardnews" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #475569;">6컷 양육 공감 카드뉴스 슬라이드 원고 &amp; 영상 나레이션 대본</span>
              <button type="button" class="btn btn-primary btn-copy-osmu" data-target="osmu-text-cardnews" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">📋 원클릭 복사</button>
            </div>
            <textarea id="osmu-text-cardnews" readonly style="width: 100%; height: 220px; font-family: monospace; font-size: 0.82rem; padding: 0.85rem; border: 1px solid #CBD5E1; border-radius: 12px; background: #F8FAFC; resize: vertical; box-sizing: border-box;">${extra.cardnewsStoryboard}</textarea>
          </div>

          <!-- Panel 1-C: Google Flow Prompts -->
          <div class="osmu-panel" id="osmu-panel-flow" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #475569;">안티그래비티 × 구글 Flow (Veo 3.1) Ingredients/Frames to Video 프롬프트</span>
              <button type="button" class="btn btn-primary btn-copy-osmu" data-target="osmu-text-flow" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">📋 원클릭 복사</button>
            </div>
            <textarea id="osmu-text-flow" readonly style="width: 100%; height: 220px; font-family: monospace; font-size: 0.82rem; padding: 0.85rem; border: 1px solid #CBD5E1; border-radius: 12px; background: #F8FAFC; resize: vertical; box-sizing: border-box;">${extra.googleFlowPrompts}</textarea>
          </div>

          <!-- Panel 2: Shortform -->
          <div class="osmu-panel" id="osmu-panel-shortform" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #475569;">GoTall 스타일 15초 화면녹화 바이럴 숏폼 대본</span>
              <button type="button" class="btn btn-primary btn-copy-osmu" data-target="osmu-text-shortform" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">📋 원클릭 복사</button>
            </div>
            <textarea id="osmu-text-shortform" readonly style="width: 100%; height: 220px; font-family: monospace; font-size: 0.82rem; padding: 0.85rem; border: 1px solid #CBD5E1; border-radius: 12px; background: #F8FAFC; resize: vertical; box-sizing: border-box;">${bundle.shortformScript}</textarea>
          </div>

          <!-- Panel 3: Blog -->
          <div class="osmu-panel" id="osmu-panel-blog" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #475569;">네이버 블로그 2,000자 칼럼 (비교표 &amp; 브릿지 포함)</span>
              <button type="button" class="btn btn-primary btn-copy-osmu" data-target="osmu-text-blog" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">📋 원클릭 복사</button>
            </div>
            <textarea id="osmu-text-blog" readonly style="width: 100%; height: 220px; font-family: monospace; font-size: 0.82rem; padding: 0.85rem; border: 1px solid #CBD5E1; border-radius: 12px; background: #F8FAFC; resize: vertical; box-sizing: border-box;">${bundle.blogColumn}</textarea>
          </div>

          <!-- Panel 4: Cafe -->
          <div class="osmu-panel" id="osmu-panel-cafe" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #475569;">네이버 카페 등업 &amp; 공동구매 수요조사 게시글</span>
              <button type="button" class="btn btn-primary btn-copy-osmu" data-target="osmu-text-cafe" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">📋 원클릭 복사</button>
            </div>
            <textarea id="osmu-text-cafe" readonly style="width: 100%; height: 220px; font-family: monospace; font-size: 0.82rem; padding: 0.85rem; border: 1px solid #CBD5E1; border-radius: 12px; background: #F8FAFC; resize: vertical; box-sizing: border-box;">${bundle.cafePost}</textarea>
          </div>

        </div>

      </div>
    `;
  }

  // Export
  const AdminOsmu = {
    SCENARIOS,
    generateOsmuBundle,
    generateCardNewsAndFlowBundle,
    renderOsmuStudioUI
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminOsmu;
  } else {
    global.KidsFitAdminOsmu = AdminOsmu;
  }

})(typeof window !== 'undefined' ? window : global);
