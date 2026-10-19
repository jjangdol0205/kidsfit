# 🎬 안티그래비티(Antigravity) × 구글 Flow (`labs.google/fx/tools/flow`) 양육 웹툰·카드뉴스 영상 제작 완벽 가이드

> **핵심 요약**
> **구글 Flow(`https://labs.google/fx/tools/flow`)**는 구글의 최신 동영상 생성 AI 모델인 **Veo (Veo 2 / Veo 3.1)**와 이미지 모델 **Imagen(Nano Banana)**을 결합한 AI 스토리텔링 영상 스튜디오입니다.
> 기존 AI 영상 툴들의 가장 큰 문제였던 **“컷마다 엄마와 아이 얼굴·그림체가 달라지는 현상”**과 **“한글 텍스트가 깨지는 현상”**을 **안티그래비티(Antigravity) + 구글 Flow 하이브리드 파이프라인**으로 100% 완벽하게 해결할 수 있습니다.

---

## 1. 왜 '안티그래비티 + 구글 Flow' 조합이 양육 영상에 최고인가요?

구글 Flow 단독으로 한글 말풍선이나 한국어 내레이션을 넣으려 하면 영문 위주 모델 특성상 한글 자막이 깨지거나 발음이 어색해질 수 있습니다. 반대로 **역할을 분담**하면 방송국 수준의 퀄리티가 나옵니다:

| 제작 단계 | 담당 도구 | 핵심 역할 |
| :--- | :--- | :--- |
| **1단계: 기획 & 원화 생성** | **안티그래비티 (`image-generator`)** | 질병관리청·K-DST 데이터 기반 대본 작성 + 3040 한국 엄마들이 좋아하는 파스텔 수채화풍 **웹툰 원화 6컷(`raw/cut_01~06.jpg`)** 및 **카드뉴스 6컷** 생성 |
| **2단계: 모션 애니메이션화** | **구글 Flow (`Frames` / `Ingredients`)** | 안티그래비티가 만든 정지 원화를 **시작 프레임(Start Frame)**으로 넣어, 엄마가 아이를 쓰다듬고 아이가 눈을 깜빡이며 웃는 **5~8초 시네마틱 모션 클립**으로 변환 |
| **3단계: 한국어 더빙·자막·마스터링** | **안티그래비티 (`generate_all_samples.py`)** | 한국어 신경망 성우 음성(`edge-tts ko-KR-SunHiNeural`) + 깨짐 없는 또렷한 한글 말풍선·자막 + 감성 오르골 BGM을 자동 합성하여 최종 `1080×1920` MP4 완성 |

---

## 2. 안티그래비티에서 구글 Flow로 영상 만드는 3가지 실전 방법

### 방법 ① [`Frames to Video` (프레임 투 비디오)] — 가장 추천! (캐릭터·구도 100% 일치)
안티그래비티가 이미 그려놓은 6컷 웹툰 원화(`d:\사업아이템\samples\2_webtoon_sample\raw\cut_01.jpg` ~ `cut_06.jpg`)를 그대로 살아 움직이게 만드는 방법입니다.

1. 크롬 브라우저에서 **[Google Flow (`https://labs.google/fx/tools/flow`)](https://labs.google/fx/tools/flow)**에 접속하여 `[New Project]`를 클릭합니다.
2. 하단 프롬프트 입력창 왼쪽의 모드를 **`Frames to Video` (프레임으로 동영상 만들기)**로 변경합니다.
3. **`[+ First Frame (시작 프레임)]`** 버튼을 누르고, 안티그래비티가 생성한 **`d:\사업아이템\samples\2_webtoon_sample\raw\cut_01.jpg`** 파일을 업로드합니다.
   - *(꿀팁)* 컷과 컷 사이를 자연스럽게 잇고 싶다면 `[+ Last Frame (끝 프레임)]`에 다음 컷(`cut_02.jpg`)을 넣으면 두 장면 사이가 마법처럼 연결됩니다!
4. 화면 비율을 **`9:16 (Portrait / 세로형)`**으로 설정하고, 아래 **[3장. 복붙용 구글 Flow 프롬프트]**를 붙여넣은 뒤 `[Generate]`를 누릅니다.

---

### 방법 ② [`Ingredients to Video` (재료 투 비디오)] — 새로운 에피소드를 계속 만들 때!
매주 새로운 육아 웹툰 에피소드를 만들 때 **엄마와 아이 캐릭터의 얼굴·머리스타일·옷차림·파스텔 수채화 화풍을 고정**하는 구글 Flow만의 핵심 기능입니다.

1. Google Flow 좌측의 **`Ingredients (재료)`** 탭을 열고 다음 **3장의 기준 이미지**를 업로드합니다:
   - **Ingredient 1 (엄마 캐릭터)**: `samples/2_webtoon_sample/raw/cut_02.jpg` (35세 한국 엄마, 크림색 가디건, 로우 포니테일)
   - **Ingredient 2 (아이 캐릭터)**: `samples/2_webtoon_sample/raw/cut_04.jpg` (만 3세 한국 아이, 민트 스트라이프 티셔츠)
   - **Ingredient 3 (화풍/배경 스타일)**: `samples/2_webtoon_sample/raw/cut_01.jpg` (따뜻한 한국 아파트 거실 & 파스텔 수채화 톤)
2. 프롬프트 모드를 **`Ingredients to Video`**로 선택하고 위 3개의 재료를 체크합니다.
3. 이제 어떤 상황(박물관 나들이, 식탁에서 밥 먹는 장면, 밤 10시 잠드는 장면)을 프롬프트로 입력하더라도 **항상 똑같은 엄마와 아이 캐릭터가 등장하는 일관된 웹툰 영상**이 생성됩니다!

---

### 방법 ③ 안티그래비티 자동 마스터링 스크립트 연동 (`flow_clips` 하이브리드)
Google Flow의 `SceneBuilder`에서 생성한 6개의 MP4 클립을 다운로드한 뒤, 안티그래비티에게 다음과 같이 지시하거나 스크립트를 실행하면 **한글 말풍선 + 한국어 성우 내레이션 + BGM**이 자동으로 입혀집니다:

1. Google Flow에서 다운로드한 6개 영상을 `d:\사업아이템\samples\2_webtoon_sample\flow_clips\clip_01.mp4` ~ `clip_06.mp4`로 저장합니다.
2. 안티그래비티 채팅창에 **"방금 구글 Flow에서 뽑은 클립 6개에 한국어 내레이션이랑 한글 자막 입혀서 최종 영상으로 합쳐줘"**라고 말하거나 `python -X utf8 scripts/generate_all_samples.py`를 실행하면 즉시 완제품 MP4가 출력됩니다.

---

## 3. 복사해서 바로 쓰는 [6컷 양육 웹툰] 구글 Flow 전용 모션 프롬프트

안티그래비티의 **[시크릿 관리자 스튜디오 (`?admin=1`) → `🎬 구글 Flow 영상 프롬프트` 탭]**에서도 원클릭으로 복사하실 수 있습니다.

### 🎨 Cut 01 (현관 단추 씨름 & 물 쏟은 아이)
- **시작 프레임 업로드**: `d:\사업아이템\samples\2_webtoon_sample\raw\cut_01.jpg`
- **Google Flow 프롬프트**:
```text
Warm Korean pastel watercolor webtoon animation. A tired 35-year-old Korean mother in a cream cardigan kneels in a cozy apartment entryway at evening, gently watching her 3-year-old toddler in a mint striped shirt trying to button his shirt while water spills softly on the floor. Subtle slow push-in camera motion, warm ambient indoor lighting, soft breathing and natural blinking, emotional empathetic parenting mood, 9:16 vertical, no text.
```

### 🎨 Cut 02 (잠든 아이 손을 보며 미안해하는 밤)
- **시작 프레임 업로드**: `d:\사업아이템\samples\2_webtoon_sample\raw\cut_02.jpg`
- **Google Flow 프롬프트**:
```text
Warm Korean pastel watercolor webtoon animation. Late night under a warm desk lamp, a 35-year-old Korean mother looks lovingly and tearfully at her sleeping toddler under a soft blanket, gently touching the child's tiny hand. Soft warm light particles floating in the air, slow gentle camera pan, tender lullaby atmosphere, 9:16 vertical, no text.
```

### 🎨 Cut 03 (손끝 소근육 민감기와 전두엽 시냅스의 비밀 발견)
- **시작 프레임 업로드**: `d:\사업아이템\samples\2_webtoon_sample\raw\cut_03.jpg`
- **Google Flow 프롬프트**:
```text
Warm Korean pastel watercolor webtoon animation. The Korean mother looks at a glowing pediatric brain-and-hand development illustration on her tablet screen, her expression brightening into a relieved, warm "Aha!" smile. Soft golden and emerald light particles glowing around the brain synapse graphic, subtle zoom-in camera motion, 9:16 vertical, no text.
```

### 🎨 Cut 04 (주말 아침 거실에서 원목 집게 & 구슬 꿰기 몰입)
- **시작 프레임 업로드**: `d:\사업아이템\samples\2_webtoon_sample\raw\cut_04.jpg`
- **Google Flow 프롬프트**:
```text
Warm Korean pastel watercolor webtoon animation. Sunny weekend morning in a bright warm-ivory Korean living room. The 3-year-old toddler happily picks up colorful pom-poms with wooden tongs with focused little hands while the mother smiles warmly and patiently beside him. Natural morning sunlight streaming through sheer curtains, gentle lifelike movement, 9:16 vertical, no text.
```

### 🎨 Cut 05 (어린이미술관 눈높이 하브루타 대화)
- **시작 프레임 업로드**: `d:\사업아이템\samples\2_webtoon_sample\raw\cut_05.jpg`
- **Google Flow 프롬프트**:
```text
Warm Korean pastel watercolor webtoon animation. Sunlit children's art museum park. Korean mother and father squat down to eye-level with their beaming 3-year-old toddler, pointing and talking happily about a colorful sculpture together. Gentle breeze moving their hair and tree leaves, warm family happiness, slow camera tracking, 9:16 vertical, no text.
```

### 🎨 Cut 06 (안전가위로 오린 하트 선물과 따뜻한 포옹)
- **시작 프레임 업로드**: `d:\사업아이템\samples\2_webtoon_sample\raw\cut_06.jpg`
- **Google Flow 프롬프트**:
```text
Warm Korean pastel watercolor webtoon animation. Close-up heartwarming hug between the smiling Korean mother and her 3-year-old toddler proudly holding up a pink paper heart cut with safety scissors. Soft pastel sparkles and warm bokeh glowing in the background, gentle pull-back camera motion, emotional happy ending, 9:16 vertical, no text.
```

---

## 4. 카드뉴스 기반 영상을 구글 Flow로 업그레이드하는 팁

카드뉴스(`samples/3_cardnews_sample/cardnews_01.png` ~ `06.png`)는 이미 한글 타이포그래피와 표가 완성된 이미지입니다.
- **카드뉴스 전체 이미지를 그대로 Google Flow에 넣으면** AI가 한글 글자를 움직이려다 글자가 일그러질 수 있습니다.
- 따라서 카드뉴스 영상을 만들 때는:
  1. 카드뉴스 중앙에 들어가는 **일러스트 영역(`raw/cut_01.jpg` ~ `cut_06.jpg`)만 Google Flow에서 5초 모션 영상으로 변환**하고,
  2. 상단 헤드라인·핵심 포인트 3줄·하단 공신력 배지는 안티그래비티의 Python 렌더링 엔진(`scripts/generate_all_samples.py`)으로 **깨끗한 벡터급 한글 레이어**로 얹어주면, 글자는 100% 선명하면서 중앙 그림만 살아 움직이는 **최고급 모션 카드뉴스 영상**이 완성됩니다!
