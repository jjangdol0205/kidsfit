#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MASTER_DIR = path.resolve(__dirname, '../samples/shorts_10eps/mastered');
const STATE_PATH = path.resolve(__dirname, '../samples/shorts_10eps/daily_send_state.json');

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@kidsfit01';
const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/kids_fit1';
const NAVER_CREATOR_SHOP_URL = 'https://cshop.naver.com/paradiseshop';

// @kidsfit01 유튜브 쇼츠 & 네이버 클립(Clip) 표준 업로드 규격 (09:30 KST 등원 직후 골든타임)
const KIDSFIT_KR_UPLOAD_CONFIG = {
  channelHandle: '@kidsfit01',
  publishAtKst: '09:30 KST',
  publishAtAltKst: '21:30 KST',
  categoryId: '27', // Education
  selfDeclaredMadeForKids: false,
  deprecatedDuplicateVideoIds: ['AR7DkkXCRo0'],
  fakeAiProductPhotoBan: true,
  coreTags: ['키성장', '성조숙증', '우리아이예상키', '구강호흡', '성장판자극', '육아꿀팁', '키즈핏'],
  standardYtCta: '📏 부모 키 유전 한계를 넘는 우리 아이 최종 예상키 & 성조숙증 신호등 1분 무료 진단 👉 프로필 상단 [kidsfit.co.kr] 클릭!',
  naverCreatorShopUrl: NAVER_CREATOR_SHOP_URL,
  ftcNotice: '이 포스팅은 쿠팡 파트너스 및 네이버 쇼핑 커넥트 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'
};

// 전편 해시태그 5개 이하 엄수 + 공식 유튜브(@kidsfit01) / 인스타(@kids_fit1) + 홈페이지 ?ep=N 자동 하이라이트 연동
const DAILY_EPISODES = [
  {
    ep: 1,
    file: 'ep01_newborn_sleep_combo2.mp4',
    label: '제1편 [2가지 꿀조합] 신생아 새벽 통잠 & 예쁜 두상 공식',
    ytTitle: '새벽마다 놀라 깨는 신생아, 딱 이 2가지만 세팅하세요! #신생아통잠 #스와들업 #두상베개 #출산준비',
    ytDesc:
`새벽마다 모로반사로 깜짝 놀라 깨는 아기 때문에 밤잠 설치셨나요?
조리원 퇴소 전 딱 이 2가지만 세팅해 주면 아기도 꿀잠 자고 엄마 아빠 아침 커피 타임이 생깁니다!

✅ [쇼츠 1편] 신생아 꿀잠 2종 꿀조합
1. 모로반사 숙면 방지 오가닉 순면 스와들업 속싸개 (28,500원)
2. 신생아 척추 보호 3D 통기성 에어메쉬 두상 베개 (34,000원)

👉 [쇼츠 1편] 상품 공식 혜택가 & 0원 무료체험 바로가기:
https://kidsfit.co.kr/?ep=1

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#신생아통잠 #스와들업 #아기두상베개 #출산준비물 #육아템추천`,
    reelsFull:
`[릴스 1편] 새벽마다 놀라 깨는 신생아, 딱 이 2가지만 세팅하세요! 🌙✨

조리원 퇴소하고 새벽마다 모로반사로 깨는 아기 때문에 힘드셨죠?
만세 자세로 감싸주는 '오가닉 스와들업 속싸개'와 태열을 싹 빼주는 '3D 에어메쉬 두상 베개' 꿀조합이면 눕히자마자 새벽 내내 통잠 자요!

📌 [릴스 1편] 꿀조합 2가지
① 모로반사 숙면 방지 오가닉 순면 스와들업 속싸개 (28,500원)
② 신생아 척추 보호 3D 통기성 에어메쉬 두상 베개 (34,000원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 1편] 탭을 누르시면 방금 보신 두 상품을 1초 만에 바로 확인하실 수 있어요!

#신생아통잠 #스와들업 #아기두상베개 #출산준비물 #육아템추천`
  },
  {
    ep: 2,
    file: 'ep02_baby_vitamind_drop1.mp4',
    label: '제2편 [1가지 단독집중] 신생아 비타민D + 배앓이 유산균 하루 1방울',
    ytTitle: '조리원 퇴소 후 영양제 딱 하나만 고른다면? 하루 1방울 비타민D+유산균 #아기비타민D #신생아유산균 #육아템',
    ytDesc:
`신생아 첫 영양제, 가루 날림 없이 하루 딱 한 방울이면 끝납니다!
비타민D3 400IU 일일 권장량에 배앓이 잡는 생유산균까지 한 방울에 쏙 담아 아기 배가 하루 종일 편안해요.

✅ [쇼츠 2편] 에디터 안심큐레이션 핵심 포인트
• 닥터에디션 베이비 비타민D3 400IU 드롭스 & 유산균 (26,400원)

👉 [쇼츠 2편] 상품 공식 혜택가 & 맞춤 영양제 바로가기:
https://kidsfit.co.kr/?ep=2

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#아기비타민D #신생아유산균 #배앓이유산균 #출산선물 #육아필수템`,
    reelsFull:
`[릴스 2편] 조리원 퇴소 후 아기 영양제 딱 하나만 고른다면? 💧✨

가루 섞을 필요 없이 하루 딱 1방울이면 끝!
일일 권장량 400IU 비타민D3와 배앓이 케어 생유산균이 한 병에 들어있어 신생아 첫 영양제로 가장 편하고 든든해요.

📌 [릴스 2편] 에디터 안심큐레이션 포인트
• 닥터에디션 베이비 비타민D3 400IU 드롭스 & 유산균 (26,400원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 2편]을 누르시면 방금 보신 상품을 바로 만나보실 수 있어요!

#아기비타민D #신생아유산균 #배앓이유산균 #출산선물 #육아필수템`
  },
  {
    ep: 3,
    file: 'ep03_liquid_calcium_vs2.mp4',
    label: '제3편 [2가지 1:1 비교] 아기 액상 칼슘, 구연산 시럽 VS 차일드라이프',
    ytTitle: '돌 아기 액상 칼슘 둘 중 뭐 살까? 흡수율 대용량 VS 오렌지맛 직구템 #아기칼슘 #차일드라이프 #유아영양제',
    ytDesc:
`돌 지난 아기 첫 액상 칼슘, 어떤 걸 골라야 할지 고민되시죠? 딱 1:1로 정리해 드립니다!

✅ [쇼츠 3편] 액상 칼슘 1:1 비교
1. 속 편한 흡수율 + 정상 면역 아연까지 원한다면 👉 어린이 구연산 칼슘+비타민D3+아연 액상 시럽 (24,800원)
2. 약 거부 심한 아기 기호성이 1순위라면 👉 차일드라이프 액상 칼슘 마그네슘 천연 오렌지맛 (22,300원)

👉 [쇼츠 3편] 두 제품 한눈에 비교 & 공식 혜택가 바로가기:
https://kidsfit.co.kr/?ep=3

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#아기칼슘 #차일드라이프 #유아영양제 #돌아기영양제 #키즈핏`,
    reelsFull:
`[릴스 3편] 돌 지난 아기 액상 칼슘, 둘 중 뭐 살지 고민 끝! 🍊🥄

우리 아이 성향에 맞춰 딱 골라보세요:
✔️ 속 편한 흡수율과 아연까지 한 번에 챙기려면 👉 [어린이 구연산 칼슘+D3+아연 액상 시럽]
✔️ 약 거부 심한 아기 입맛 저격 1순위는 👉 [차일드라이프 액상 칼슘 마그네슘 천연 오렌지맛]

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 3편]을 누르시면 두 제품을 나란히 비교해 보실 수 있어요!

#아기칼슘 #차일드라이프 #유아영양제 #돌아기영양제 #육아템비교`
  },
  {
    ep: 4,
    file: 'ep04_toddler_walker_montessori2.mp4',
    label: '제4편 [2가지 꿀조합] 1~3세 대근육 걸음마 + 소근육 몬테소리 끝판왕',
    ytTitle: '돌 전후 1~3세 아기 대근육·소근육 발달 끝판왕 꿀조합 2가지! #걸음마학습기 #아기안전헬멧 #몬테소리교구',
    ytDesc:
`돌 전후 1~3세 영아기, 대근육 걸음마와 손끝 소근육 두뇌 발달을 동시에 잡아주는 베스트 꿀조합 2가지입니다!

✅ [쇼츠 4편] 영아기 발달 교구 2종 꿀조합
1. 성장기 바른 보행 걸음마 학습기 & 충격 흡수 유아 안전 헬멧 (38,000원)
2. 몬테소리 소근육 발달 원목 도형 맞추기 & 입체 비즈 롤러코스터 (23,500원)

👉 [쇼츠 4편] 상품 공식 혜택가 & 0원 무료체험 바로가기:
https://kidsfit.co.kr/?ep=4

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#걸음마학습기 #아기안전헬멧 #몬테소리교구 #돌아기장난감 #소근육발달`,
    reelsFull:
`[릴스 4편] 돌 전후 1~3세 아기 대근육·소근육 발달 끝판왕 꿀조합 2가지! 🧸🎈

쿵 넘어져도 머리 다칠 걱정 없는 [안전헬멧+걸음마 학습기]로 바른 보행 대근육을 길러주고,
[몬테소리 원목 도형 맞추기 & 비즈 롤러코스터]로 손끝 소근육과 공간감각을 쑥쑥 키워주세요!

📌 [릴스 4편] 꿀조합 2가지
① 바른 보행 걸음마 학습기 & 충격 흡수 안전 헬멧 (38,000원)
② 몬테소리 원목 도형 맞추기 & 입체 비즈 롤러코스터 (23,500원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 4편]을 누르시면 두 상품을 한눈에 확인하실 수 있어요!

#걸음마학습기 #아기안전헬멧 #몬테소리교구 #돌아기장난감 #소근육발달`
  },
  {
    ep: 5,
    file: 'ep05_silent_bungee_trampoline1.mp4',
    label: '제5편 [1가지 단독집중] 층간소음 0%! 집에서 키 크는 무소음 번지 트램폴린',
    ytTitle: '밤에 뛰어도 층간소음 0%! 성장판 자극하는 무소음 번지 트램폴린 #유아트램폴린 #키성장운동 #실내육아템',
    ytDesc:
`비 오는 날이나 미세먼지 심한 날, 집에서 층간소음 걱정 없이 키 크는 최고의 실내 운동템입니다!
삐걱대는 철제 스프링 대신 고탄성 번지코드를 사용해 밤에 뛰어도 조용하고 무릎 충격 없이 성장판만 수직 자극해 줍니다.

✅ [쇼츠 5편] 에디터 안심큐레이션 핵심 포인트
• 어린이 성장판 수직 자극 무소음 번지코드 트램폴린 (65,000원)

👉 [쇼츠 5편] 무소음 트램폴린 공식 혜택가 바로가기:
https://kidsfit.co.kr/?ep=5

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#유아트램폴린 #키성장운동 #실내육아템 #층간소음방지 #에너자이저육아`,
    reelsFull:
`[릴스 5편] 밤에 뛰어도 층간소음 걱정 끝! 집에서 키 크는 무소음 번지 트램폴린 🤸‍♂️✨

철제 스프링 대신 고탄성 번지코드와 방진 고무패드가 충격을 싹 흡수해 층간소음 걱정 없이 신나게 뛸 수 있어요!
안전 손잡이 잡고 점프하며 성장판은 자극하고 아이 에너지는 기분 좋게 방전시켜 보세요.

📌 [릴스 5편] 에디터 안심큐레이션 포인트
• 어린이 성장판 수직 자극 무소음 번지코드 트램폴린 (65,000원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 5편]을 누르시면 바로 확인하실 수 있어요!

#유아트램폴린 #키성장운동 #실내육아템 #층간소음방지 #육아템추천`
  },
  {
    ep: 6,
    file: 'ep06_probiotics_vs_multigummy2.mp4',
    label: '제6편 [2가지 1:1 비교] 4~6세 면역 생유산균 스틱 VS 스마트팬츠 멀티구미',
    ytTitle: '4~6세 어린이집 면역 영양제 승자는? 초유 유산균 VS 멀티구미 #키즈유산균 #어린이영양제 #스마트팬츠',
    ytDesc:
`단체생활 시작하는 4~6세 유아기, 아침마다 챙겨 먹이기 좋은 영양제 2가지를 1:1로 비교했습니다!

✅ [쇼츠 6편] 4~6세 면역 영양제 1:1 비교
1. 장 면역 + 환절기 아연·초유 케어가 급하다면 👉 키즈 면역 생유산균 100억 CFU + 아연/초유 성장단 (29,900원)
2. 종합비타민 + 오메가3 DHA를 맛있게 먹이려면 👉 스마트팬츠 키즈 컴플리트 멀티구미 (31,500원)

👉 [쇼츠 6편] 두 제품 상세 비교 & 공식 혜택가 바로가기:
https://kidsfit.co.kr/?ep=6

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#키즈유산균 #어린이영양제 #스마트팬츠 #유아면역력 #어린이집준비물`,
    reelsFull:
`[릴스 6편] 4~6세 어린이집 등원 전, 우리 아이 면역 영양제 1:1 비교! 🍓🥛

✔️ 장 면역과 환절기 아연·초유 단백이 필요하다면 👉 [키즈 면역 생유산균 100억 + 아연/초유 스틱]
✔️ 종합비타민부터 오메가3 DHA까지 맛있게 씹어 먹이려면 👉 [스마트팬츠 키즈 멀티구미]

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 6편]을 누르시면 두 제품을 나란히 비교해 보실 수 있어요!

#키즈유산균 #어린이영양제 #스마트팬츠 #유아면역력 #어린이집준비물`
  },
  {
    ep: 7,
    file: 'ep07_magnetic_blocks_120p1.mp4',
    label: '제7편 [1가지 단독집중] 스마트폰 단번에 끊게 만든 3D 입체 자석블록 120P',
    ytTitle: '아이 스마트폰 단번에 끊게 만든 마법 교구! 3D 입체 자석블록 120P #자석블록 #창의력교구 #엄마표놀이',
    ytDesc:
`주말마다 스마트폰 찾는 아이, 이 교구 하나면 아빠랑 2시간 내내 초집중해서 놀아요!
강력한 자석으로 손끝에서 착착 붙고, 120피스 대용량이라 무너지지 않고 대형 입체 성까지 거뜬히 만듭니다.

✅ [쇼츠 7편] 에디터 안심큐레이션 핵심 포인트
• 두뇌 공간지각력 발달 3D 입체 자석 마그네틱 블록 120P (42,000원)

👉 [쇼츠 7편] 3D 자석블록 공식 혜택가 바로가기:
https://kidsfit.co.kr/?ep=7

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#자석블록 #창의력교구 #엄마표놀이 #유아장난감 #공간지각력`,
    reelsFull:
`[릴스 7편] 아이 스마트폰 단번에 끊게 만든 마법의 두뇌 교구! 🏰🌈

햇빛 비치면 스테인드글라스처럼 영롱한 [3D 입체 자석블록 120피스]!
평면 도형이 순식간에 입체로 변신하면서 아이의 공간지각력과 창의력이 폭발해요. 120피스 넉넉한 구성이라 온 가족이 함께 대형 성을 만들 수 있습니다.

📌 [릴스 7편] 에디터 안심큐레이션 포인트
• 두뇌 공간지각력 발달 3D 입체 자석 마그네틱 블록 120P (42,000원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 7편]을 누르시면 바로 확인하실 수 있어요!

#자석블록 #창의력교구 #엄마표놀이 #유아장난감 #공간지각력`
  },
  {
    ep: 8,
    file: 'ep08_ergonomic_chair_bookstand1.mp4',
    label: '제8편 [1가지 단독집중] 초등 입학 전 거북목·척추 잡는 성장 의자 + 독서대',
    ytTitle: '책만 보면 구부정한 아이 거북목! 인체공학 성장의자+독서대로 해결 #초등책상의자 #거북목교정 #독서대',
    ytDesc:
`책만 펼치면 고개가 푹 숙여지는 우리 아이 거북목과 구부정한 허리, 공부 습관보다 바른 자세 세팅이 먼저입니다!
듀얼 등받이와 발받침이 허리와 다리를 90도로 잡아주고, 눈높이 원목 독서대가 시야를 편안하게 맞춰줍니다.

✅ [쇼츠 8편] 에디터 안심큐레이션 핵심 포인트
• 초등학생 인체공학 척추 지지 성장 의자 & 거북목 교정 독서대 (89,000원)

👉 [쇼츠 8편] 초등 공부방 필수템 공식 혜택가 바로가기:
https://kidsfit.co.kr/?ep=8

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#초등책상의자 #거북목교정 #독서대 #초등입학준비 #아이방꾸미기`,
    reelsFull:
`[릴스 8편] 책만 보면 고개 숙이는 우리 아이 거북목, 이렇게 잡아주세요! 🪑📖

듀얼 등받이와 높이조절 발받침이 아이 척추를 빈틈없이 받쳐주고,
45도 눈높이 각도조절 원목 독서대가 고개 숙일 일 없이 편안한 독서 자세를 만들어 줍니다. 오래 앉아도 지치지 않는 첫 공부방을 완성해 보세요!

📌 [릴스 8편] 에디터 안심큐레이션 포인트
• 초등학생 인체공학 척추 지지 성장 의자 & 거북목 교정 독서대 (89,000원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 8편]을 누르시면 바로 확인하실 수 있어요!

#초등책상의자 #거북목교정 #독서대 #초등입학준비 #아이방꾸미기`
  },
  {
    ep: 9,
    file: 'ep09_elementary_growth_brain3.mp4',
    label: '제9편 [3가지 시너지] 초등 급성장기 키 성장 + 두뇌 집중력 3종 풀세트',
    ytTitle: '초등 급성장기 키+두뇌 동시에 잡는 3종 공식! 칼마디+오메가3+그래비트랙스 #초등영양제 #그래비트랙스 #키성장',
    ytDesc:
`초등 급성장기, 훌쩍 크는 키와 깊어지는 사고력을 동시에 채워주는 베스트 시너지 3종 세트입니다!

✅ [쇼츠 9편] 초등 키+두뇌 3종 풀세트
1. 청소년 급성장기 고함량 칼슘마그네슘 D3 K2 츄어블정 (34,500원)
2. 노르딕 네츄럴스 데일리 키즈 고순도 오메가3 DHA (37,800원)
3. 초등 과학탐구 전두엽 문제해결력 그래비트랙스 프로 스타터팩 (58,000원)

👉 [쇼츠 9편] 3종 풀세트 한눈에 보러가기:
https://kidsfit.co.kr/?ep=9

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#초등영양제 #그래비트랙스 #키성장영양제 #키즈오메가3 #초등선물`,
    reelsFull:
`[릴스 9편] 초등 급성장기, 키 성장과 두뇌 집중력을 동시에 잡는 3종 공식! 🚀🧠

① 뼈로 가는 고함량 [칼슘마그네슘 D3 K2 츄어블정]
② 두뇌 인지·집중력 [노르딕 네츄럴스 데일리 키즈 오메가3 DHA]
③ 중력과 가속도를 직접 설계하며 전두엽을 깨우는 [그래비트랙스 프로 스타터팩]

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 9편]을 누르시면 3종 풀세트를 한눈에 만나보실 수 있어요!

#초등영양제 #그래비트랙스 #키성장영양제 #키즈오메가3 #초등선물`
  },
  {
    ep: 10,
    file: 'ep10_free_trial_top4.mp4',
    label: '제10편 [4가지 총정리] 신청만 해도 100% 0원! 연령별 무료체험 4대장',
    ytTitle: '안 받으면 손해! 신청만 해도 100% 0원 연령별 무료체험 4대장 #무료체험 #웅진북클럽 #밀크T아이 #홈런',
    ytDesc:
`엄마들 사이에서 안 받으면 손해라고 소문난 연령별 100% 0원 무료체험 4대장을 총정리했습니다!

✅ [쇼츠 10편] 연령별 0원 무료체험 4대장
1. [0~1세 신생아] 웅진북클럽 베이비 첫 그림책 & 오감 발달 무료체험 (0원)
2. [1~3세 영아기] 한솔교육 핀덴베베 말놀이 그림책 체험팩 & 발달상담 키트 (0원)
3. [4~6세 유아기] 천재교육 밀크T 아이 유아 전과목 AI 학습기 7일 무료체험 (0원)
4. [7~12세 초등] 아이스크림 홈런 초등 문해력·독해력 10일 무료체험 (0원)

👉 [쇼츠 10편] 연령별 0원 무료체험 통합 신청하기:
https://kidsfit.co.kr/?ep=10

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#유아무료체험 #웅진북클럽 #핀덴베베 #밀크T아이 #아이스크림홈런`,
    reelsFull:
`[릴스 10편] 안 받으면 손해! 신청만 해도 100% 0원인 연령별 무료체험 4대장 총정리 🎁✨

우리 아이 나이에 맞는 혜택을 0원으로 챙겨보세요:
👶 [0~1세] 웅진북클럽 베이비 첫 오감 그림책 무료체험 (0원)
🧒 [1~3세] 한솔교육 핀덴베베 말놀이 그림책 체험팩 (0원)
👧 [4~6세] 천재교육 밀크T 아이 AI 놀이학습기 7일 무료체험 (0원)
🧑 [7~12세] 아이스크림 홈런 초등 문해력·전과목 10일 무료체험 (0원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 10편]을 누르시면 4가지 모두 0원으로 바로 신청하실 수 있습니다!

    #유아무료체험 #웅진북클럽 #핀덴베베 #밀크T아이 #아이스크림홈런`
  },
  {
    ep: 11,
    file: 'ep11_newborn_tummytime_focus2.mp4',
    label: '제11편 [2가지 꿀조합] 신생아 터미타임 & 시청각 두뇌 자극 첫 교구 공식',
    ytTitle: '터미타임 싫어하는 아기 고개 번쩍 들게 하는 시청각 첫 교구 2가지! #터미타임 #아기초점책 #사운드북 #신생아장난감',
    ytDesc:
`엎드려 놓기만 하면 우는 아기, 터미타임 어떻게 성공할까요?
시각과 청각을 동시에 열어주면 고개를 번쩍 들고 10분도 신나게 논답니다!

✅ [쇼츠 11편] 신생아~100일 터미타임 & 시청각 두뇌 2종 꿀조합
1. 블루래빗 두뇌계발 초점사운드북 + 헝겊초점책 (24,800원)
2. 어스본 우리 아기 오감발달 동물 오케스트라 사운드북 4종 세트 (43,200원)

👉 [쇼츠 11편] 상품 공식 혜택가 & 맞춤 발달진단 바로가기:
https://kidsfit.co.kr/?ep=11

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#터미타임 #블루래빗초점책 #어스본사운드북 #백일아기장난감 #출산선물추천`,
    reelsFull:
`[릴스 11편] 엎드려 놓기만 하면 우는 아기, 터미타임 10분 성공 공식! 👶🎶

목 가누기 연습할 때 시각(흑백·컬러 초점)과 청각(클래식 사운드)을 동시에 자극해 주면 아기 시선이 딱 고정되어 터미타임이 즐거워져요!

📌 [릴스 11편] 신생아~100일 첫 교구 꿀조합
① 블루래빗 두뇌계발 초점사운드북 + 헝겊초점책 (24,800원)
② 어스본 우리 아기 오감발달 동물 오케스트라 사운드북 4종 (43,200원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 11편]을 누르시면 두 상품 공식 혜택가를 바로 확인하실 수 있어요!

#터미타임 #블루래빗초점책 #어스본사운드북 #백일아기장난감 #출산선물추천`
  },
  {
    ep: 12,
    file: 'ep12_baby_gym_carrier_combo2.mp4',
    label: '제12편 [2가지 꿀조합] 엄마 손목 살리고 등센서 끄는 아기체육관 & 신생아 아기띠',
    ytTitle: '내려놓기만 하면 우는 등센서 아기? 엄마 손목 구원템 딱 2가지! #아기체육관 #신생아아기띠 #육아템추천 #등센서',
    ytDesc:
`내려놓기만 하면 울어서 하루 종일 손목이 시큰거리시나요?
엄마 아빠 커피 타임을 만들어 주는 국민 육아템 2가지 꿀조합을 소개합니다!

✅ [쇼츠 12편] 엄마 손목 구원템 2종 꿀조합
1. 피셔프라이스 레인포레스트 아기체육관 (54,900원)
2. 포그내 스텝원 신생아 슬링 아기띠 (62,000원)

👉 [쇼츠 12편] 상품 공식 혜택가 & 월령별 육아템 바로가기:
https://kidsfit.co.kr/?ep=12

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#피셔프라이스아기체육관 #포그내스텝원 #신생아아기띠 #국민육아템 #출산준비물`,
    reelsFull:
`[릴스 12편] 내려놓기만 하면 우는 등센서 아기, 엄마 손목 구원템 2가지! ☕✨

발로 차면 불빛·멜로디가 나와 혼자서도 30분 신나게 노는 '피셔프라이스 아기체육관'과 안자마자 5분 만에 꿀잠 드는 초경량 '포그내 스텝원 아기띠' 조합이면 육아 퇴근이 빨라집니다!

📌 [릴스 12편] 엄마 손목 구원 꿀조합
① 피셔프라이스 레인포레스트 아기체육관 (54,900원)
② 포그내 스텝원 신생아 슬링 아기띠 (62,000원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 12편]을 누르시면 공식 혜택가를 바로 확인하실 수 있어요!

#피셔프라이스아기체육관 #포그내스텝원 #신생아아기띠 #국민육아템 #출산준비물`
  },
  {
    ep: 13,
    file: 'ep13_soundbook_vs_duplo2.mp4',
    label: '제13편 [2가지 꿀조합] 돌 아기 말문 트이는 동물농장 사운드북 & 소근육 레고 듀플로',
    ytTitle: '돌 지난 아기 말문+소근육 동시에 터지는 베스트 교구 2가지! #돌아기장난감 #레고듀플로 #어스본사운드북 #두뇌발달',
    ytDesc:
`돌 지나고 호기심이 폭발하는 1~3세 아기, 어떤 교구로 놀아주면 좋을까요?
책에서 들은 동물 소리를 실물 블록으로 연결하면 어휘력과 소근육이 2배 빨리 자랍니다!

✅ [쇼츠 13편] 돌 아기 언어·소근육 2종 꿀조합
1. 어스본 우리 아기 오감발달 동물 농장 사운드북 (18,900원)
2. 레고 듀플로 10955 동물 기차 첫 블록 세트 (24,900원)

👉 [쇼츠 13편] 상품 공식 혜택가 & 두뇌 발달 큐레이션 바로가기:
https://kidsfit.co.kr/?ep=13

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#돌아기장난감 #돌선물추천 #어스본사운드북 #레고듀플로 #아기소근육발달`,
    reelsFull:
`[릴스 13편] 돌 지난 아기 말문+소근육 동시에 터지는 1:1 매칭 놀이법! 🚂🐘

어스본 동물농장 사운드북에서 들은 코끼리·기린 소리를 레고 듀플로 동물 기차 블록으로 직접 끼우고 끌어보게 해주세요! 눈손 협응력과 의성어 말문이 뻥 트입니다.

📌 [릴스 13편] 1~3세 언어·소근육 꿀조합
① 어스본 우리 아기 오감발달 동물 농장 사운드북 (18,900원)
② 레고 듀플로 10955 동물 기차 첫 블록 세트 (24,900원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 13편]을 누르시면 공식 혜택가를 바로 확인하실 수 있어요!

#돌아기장난감 #돌선물추천 #어스본사운드북 #레고듀플로 #아기소근육발달`
  },
  {
    ep: 14,
    file: 'ep14_cenovis_vs_smartypants2.mp4',
    label: '제14편 [2가지 1:1 비교] 약 거부 아이 구미 영양제, 세노비스 VS 스마트팬츠',
    ytTitle: '약 거부 심한 아이 젤리 영양제 승자는? 세노비스 VS 스마트팬츠 1:1 비교! #어린이비타민 #세노비스키즈 #스마트팬츠 #유아영양제',
    ytDesc:
`가루약이나 시럽만 보면 도망가는 아이, 맛있게 챙겨줄 구미 영양제 고민되시죠?
엄마들이 가장 많이 비교하는 두 가지 구미 영양제를 1:1로 정리해 드립니다!

✅ [쇼츠 14편] 유아·어린이 구미 영양제 1:1 비교
1. 기초 종합비타민 + 아연 미네랄 밸런스가 1순위라면 👉 세노비스 키즈 멀티비타민 미네랄 구미젤리 2개입 (36,900원)
2. 비타민D3 + 두뇌 오메가3 DHA 올인원을 원한다면 👉 스마트팬츠 키즈 컴플리트 데일리 멀티구미 (31,500원)

👉 [쇼츠 14편] 두 상품 공식 혜택가 1:1 비교 바로가기:
https://kidsfit.co.kr/?ep=14

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#어린이멀티비타민 #세노비스키즈 #스마트팬츠구미 #유아영양제추천 #편식아이영양제`,
    reelsFull:
`[릴스 14편] 약 거부 심한 아이 구미 영양제 1:1 비교! 세노비스 VS 스마트팬츠 🍓🍊

아이들이 먼저 달라고 조르는 양대 산맥 구미 영양제, 우리 아이에게 딱 맞는 쪽으로 골라보세요:
✔ 기초 면역 아연 + 종합비타민 가성비 2통 구성 👉 세노비스 키즈 멀티비타민 미네랄 구미젤리 (36,900원)
✔ 비타민D3 + 두뇌 오메가3 DHA까지 한 알에 올인원 👉 스마트팬츠 키즈 컴플리트 데일리 멀티구미 (31,500원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 14편]을 누르시면 두 상품 공식 혜택가를 한눈에 비교하실 수 있어요!

#어린이멀티비타민 #세노비스키즈 #스마트팬츠구미 #유아영양제추천 #편식아이영양제`
  },
  {
    ep: 15,
    file: 'ep15_hangul_5min_miracle1.mp4',
    label: '제15편 [1가지 단독집중] 5~7세 한글 떼기 전쟁 끝! 하루 15분 기적의 한글 학습',
    ytTitle: '5~7세 엄마표 한글 떼기 전쟁 끝! 누적 200만 부 기적의 한글 학습 5권 세트 #한글떼기 #기적의한글학습 #6세한글 #예비초등',
    ytDesc:
`초등학교 입학은 다가오는데 통글자만 외우고 받침에서 막혀 고민이셨나요?
훈민정음 자음·모음 결합 원리로 처음 보는 글자도 스스로 읽게 만드는 국민 한글 교재입니다!

✅ [쇼츠 15편] 5~7세 엄마표 한글 떼기 원픽
• 길벗스쿨 기적의 한글 학습 1~5권 전권 세트 (37,800원)

👉 [쇼츠 15편] 상품 공식 혜택가 & 연령별 학습 진단 바로가기:
https://kidsfit.co.kr/?ep=15

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#엄마표한글 #기적의한글학습 #5세한글 #6세한글떼기 #예비초등필수템`,
    reelsFull:
`[릴스 15편] 5~7세 한글 떼기 전쟁 끝! 하루 15분 스스로 동화책 읽는 비결 📚✨

누적 200만 부 돌파! 통글자 암기가 아니라 자음+모음 소리의 결합 원리를 놀이처럼 깨우쳐 주니까 처음 보는 간판과 동화책도 스스로 소리 내어 읽어요.

📌 [릴스 15편] 단독 집중 추천 교재
• 길벗스쿨 기적의 한글 학습 1~5권 전권 세트 (37,800원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 15편]을 누르시면 공식 혜택가를 바로 확인하실 수 있어요!

#엄마표한글 #기적의한글학습 #5세한글 #6세한글떼기 #예비초등필수템`
  },
  {
    ep: 16,
    file: 'ep16_night_shin_pain_calmadi1.mp4',
    label: '제16편 [1가지 단독집중] 새벽 정강이 성장통 케어! 금쪽같은 칼슘·마그네슘·비타민D',
    ytTitle: '밤마다 다리 아파 깨는 아이 성장통? 칼슘·마그네슘 2:1 황금비율이 핵심! #성장통 #어린이칼슘 #칼마디 #키성장영양제',
    ytDesc:
`밤마다 정강이나 종아리가 아프다고 깨는 아이, 단순 성장통이라고 그냥 두셨나요?
밤사이 뼈가 자랄 때 팽팽해진 근육까지 편안하게 이완해 주려면 칼슘과 마그네슘 2:1 배합이 필수입니다!

✅ [쇼츠 16편] 급성장기 뼈·근육 케어 원픽
• 비타민마을 금쪽같은 내새끼 어린이 칼슘 마그네슘 비타민D 4개입 세트 (32,900원)

👉 [쇼츠 16편] 상품 공식 혜택가 & 질병관리청 키 성장 백분위 진단 바로가기:
https://kidsfit.co.kr/?ep=16

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#어린이칼마디 #금쪽같은내새끼칼슘 #아이성장통 #어린이키성장영양제 #초등영양제`,
    reelsFull:
`[릴스 16편] 밤마다 정강이 아파 깨는 아이, 칼슘만 먹이면 부족한 이유! 🦵🌙

뼈를 키우는 칼슘·비타민D와 밤사이 당기는 근육을 부드럽게 풀어주는 마그네슘을 2:1 황금비율로 함께 챙겨주세요! 물 없이 맛있게 씹어 먹는 츄어블 4통 대용량 구성입니다.

📌 [릴스 16편] 단독 집중 추천 영양제
• 비타민마을 금쪽같은 내새끼 어린이 칼슘 마그네슘 비타민D 4개입 (32,900원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 16편]을 누르시면 공식 혜택가를 바로 확인하실 수 있어요!

#어린이칼마디 #금쪽같은내새끼칼슘 #아이성장통 #어린이키성장영양제 #초등영양제`
  },
  {
    ep: 17,
    file: 'ep17_nordic_omega3_focus1.mp4',
    label: '제17편 [1가지 단독집중] 초등 두뇌 집중력 원픽! 비린내 0% 노르딕 키즈 오메가3 DHA',
    ytTitle: '책상 앞 10분도 못 앉는 아이? 비린내 0% 초등 두뇌 오메가3 DHA 원픽! #어린이오메가3 #노르딕오메가3 #초등집중력 #두뇌영양제',
    ytDesc:
`초등 입학 후 책상 앞에 앉으면 금방 산만해지고 지치는 아이 때문에 고민이신가요?
두뇌 신경세포막을 구성하는 고순도 rTG 오메가3 DHA를 비린내 없이 상큼하게 챙겨주세요!

✅ [쇼츠 17편] 초등 두뇌·눈 건강 단독 원픽
• 노르딕 네츄럴스 데일리 키즈 고순도 오메가3 DHA (34,500원)

👉 [쇼츠 17편] 상품 공식 혜택가 & 두뇌 학습유형 진단 바로가기:
https://kidsfit.co.kr/?ep=17

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#어린이오메가3 #노르딕네츄럴스 #초등학생영양제 #아이집중력 #키즈오메가3`,
    reelsFull:
`[릴스 17편] 책상 앞 10분도 못 앉는 아이, 수업 눈빛이 달라지는 두뇌 루틴! 🧠🍋

글로벌 오메가3 1위 노르딕 네츄럴스의 고순도 rTG형 키즈 오메가3! 생선 비린내 전혀 없이 상큼한 천연 과일 향 미니 캡슐이라 아이들이 매일 스스로 챙겨 먹어요.

📌 [릴스 17편] 초등 두뇌 집중력 원픽
• 노르딕 네츄럴스 데일리 키즈 고순도 오메가3 DHA (34,500원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 17편]을 누르시면 공식 혜택가를 바로 확인하실 수 있어요!

#어린이오메가3 #노르딕네츄럴스 #초등학생영양제 #아이집중력 #키즈오메가3`
  },
  {
    ep: 18,
    file: 'ep18_gravitrax_spatial_brain1.mp4',
    label: '제18편 [1가지 단독집중] 스마트폰 끊고 2시간 초집중! 그래비트랙스 프로 버티컬 153P',
    ytTitle: '주말마다 스마트폰 찾는 아이 단번에 끊는 독일 과학 교구 끝판왕! #그래비트랙스 #초등장난감 #창의력교구 #초등선물',
    ytDesc:
`주말마다 유튜브와 게임만 찾는 아이, 억지로 뺏지 말고 이 교구를 펼쳐주세요!
중력·가속도·자기장 물리 법칙으로 직접 구슬 트랙을 설계하며 2시간 내내 초집중합니다.

✅ [쇼츠 18편] 초등 공간지각·과학 두뇌 원픽
• 그래비트랙스 프로 스타터 버티컬 레일블록 153P (89,000원)

👉 [쇼츠 18편] 상품 공식 혜택가 & 두뇌 발달 큐레이션 바로가기:
https://kidsfit.co.kr/?ep=18

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#그래비트랙스프로 #초등학생선물 #보드게임추천 #공간지각력 #창의력발달`,
    reelsFull:
`[릴스 18편] 스마트폰 단번에 내려놓고 아빠랑 2시간 초집중하는 독일 과학 교구! 🎢⚡

수직 기둥과 발사대, 커브 트랙을 직접 설계하며 중력과 가속도 원리를 눈으로 깨우치는 '그래비트랙스 프로 버티컬 153P'! 초등 입체 도형·공간지각력이 몰라보게 자랍니다.

📌 [릴스 18편] 초등 과학·창의 교구 원픽
• 그래비트랙스 프로 스타터 버티컬 레일블록 153P (89,000원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 18편]을 누르시면 공식 혜택가를 바로 확인하실 수 있어요!

#그래비트랙스프로 #초등학생선물 #보드게임추천 #공간지각력 #창의력발달`
  },
  {
    ep: 19,
    file: 'ep19_elementary_reading_bookstand2.mp4',
    label: '제19편 [2가지 꿀조합] 초등 1·2학년 문해력 & 바른 자세! 초등국어 독해력 + 원목 독서대',
    ytTitle: '연산은 잘하는데 문장제 수학만 틀리는 이유? 초등 문해력+독서대 꿀조합! #초등문해력 #원목독서대 #뿌리깊은초등국어 #초등입학준비',
    ytDesc:
`연산은 빠른데 서술형·문장제 수학만 나오면 문제를 끝까지 안 읽는 아이!
고개 숙이는 거북목 자세를 잡아주는 원목 독서대와 하루 10분 독해력 교재로 전 과목 기초를 세워주세요.

✅ [쇼츠 19편] 초등 1·2학년 문해력 & 바른 자세 2종 꿀조합
1. 마더텅 뿌리깊은 초등국어 독해력 기본편 1단계 (11,700원)
2. 눈높이 각도조절 친환경 삼나무 원목 독서대 (23,900원)

👉 [쇼츠 19편] 상품 공식 혜택가 & 학습 습관 진단 바로가기:
https://kidsfit.co.kr/?ep=19

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#초등독해력 #마더텅독해력 #삼나무원목독서대 #초등1학년공부 #거북목교정`,
    reelsFull:
`[릴스 19편] 문장제 수학 못 푸는 진짜 이유! 초등 저학년 문해력+바른 자세 꿀조합 📖✏️

눈높이 45도 '삼나무 원목 독서대'로 목뼈 부담 없이 시야를 열어주고, 하루 10분 '마더텅 뿌리깊은 초등국어 독해력'으로 핵심 문장 찾는 습관을 길러주면 전 과목 자신감이 올라갑니다!

📌 [릴스 19편] 초등 공부방 필수 2종 꿀조합
① 마더텅 뿌리깊은 초등국어 독해력 기본편 1단계 (11,700원)
② 눈높이 각도조절 친환경 삼나무 원목 독서대 (23,900원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 19편]을 누르시면 두 상품 공식 혜택가를 바로 확인하실 수 있어요!

#초등독해력 #마더텅독해력 #삼나무원목독서대 #초등1학년공부 #거북목교정`
  },
  {
    ep: 20,
    file: 'ep20_all_stage_bestseller_top4.mp4',
    label: '제20편 [4가지 총정리] 맘카페 재구매율 1위! 신생아~초등 월령별 베스트셀러 4대장',
    ytTitle: '맘카페 재구매율 1위! 신생아부터 초등까지 실패 없는 월령별 베스트셀러 4대장 #육아템추천 #스와들업 #락토핏키즈 #시디즈링고',
    ytDesc:
`수만 건의 부모님 데이터로 검증된 신생아부터 초등까지 월령별 부동의 1위 베스트셀러 4대장을 총정리했습니다!

✅ [쇼츠 20편] 월령별 실패 없는 베스트셀러 4대장
1. [0~1세 신생아 1위] 스와들업 Stage 1 오가닉 순면 속싸개 (28,500원)
2. [1~3세 영아기 1위] 차일드라이프 액상 칼슘 마그네슘 천연 오렌지맛 (22,300원)
3. [4~6세 유아기 1위] 종근당건강 락토핏 생유산균 키즈 (19,800원)
4. [7~12세 초등기 1위] 시디즈 링고 고정형 발받침 학생용 성장 의자 (169,000원)

👉 [쇼츠 20편] 월령별 4대장 공식 혜택가 & 1분 무료 성장진단 바로가기:
https://kidsfit.co.kr/?ep=20

📺 키즈핏 공식 유튜브 구독: https://www.youtube.com/@kidsfit01
📸 키즈핏 공식 인스타그램: https://www.instagram.com/kids_fit1

#육아필수템 #스와들업속싸개 #차일드라이프칼슘 #락토핏키즈 #시디즈링고의자`,
    reelsFull:
`[릴스 20편] 맘카페 재구매율 1위! 신생아~초등 월령별 실패 없는 베스트셀러 4대장 총정리 🏆✨

우리 아이 개월 수에 딱 맞는 부동의 1위 원픽만 모았습니다:
👶 [신생아 통잠 1위] 스와들업 Stage 1 오가닉 속싸개 (28,500원)
🧒 [영아기 첫 칼슘 1위] 차일드라이프 액상 칼슘 마그네슘 오렌지맛 (22,300원)
👧 [유아기 장 면역 1위] 종근당건강 락토핏 생유산균 키즈 (19,800원)
🧑 [초등 바른 자세 1위] 시디즈 링고 발받침 학생용 성장 의자 (169,000원)

🛍️ @kids_fit1 프로필 링크(kidsfit.co.kr)에서 [🎬 쇼츠·릴스 20편]을 누르시면 4가지 모두 공식 혜택가로 한 번에 확인하실 수 있어요!

#육아필수템 #스와들업속싸개 #차일드라이프칼슘 #락토핏키즈 #시디즈링고의자`
  }
];

function sanitizePublicDescription(rawText) {
  return String(rawText || '')
    .replace(/\[쇼츠\s*\d+편\]\s*/g, '')
    .replace(/\[릴스\s*\d+편\]\s*/g, '')
    .replace(/보러가기\s*:\s*kidsfit/gi, '공식 진단 바로가기: https://kidsfit.co.kr')
    .replace(/@키즈핏/g, '@kidsfit01')
    .replace(/@kidsfit(?!01)/gi, '@kidsfit01')
    .trim();
}

for (const epItem of DAILY_EPISODES) {
  epItem.ytDesc = `${KIDSFIT_KR_UPLOAD_CONFIG.standardYtCta}\n\n${sanitizePublicDescription(epItem.ytDesc)}`;
  epItem.reelsFull = sanitizePublicDescription(epItem.reelsFull);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sendVideoMultipartOnce(filePath, caption) {
  return new Promise((resolve, reject) => {
    const boundary = '----KidsFitBoundary' + Date.now().toString(16);
    const filename = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);

    const parts = [];
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${CHAT_ID}\r\n`));
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="supports_streaming"\r\n\r\ntrue\r\n`));
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="width"\r\n\r\n1080\r\n`));
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="height"\r\n\r\n1920\r\n`));
    if (caption) {
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`));
    }
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="video"; filename="${filename}"\r\nContent-Type: video/mp4\r\n\r\n`
    ));
    parts.push(fileData);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(parts);
    const req = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/sendVideo`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      },
      timeout: 180000
    }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(chunks));
        } catch (e) {
          resolve({ ok: false, raw: chunks });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendVideoMultipart(filePath, caption) {
  for (let a = 1; a <= 4; a++) {
    try { const r = await sendVideoMultipartOnce(filePath, caption); if (r && r.ok) return r; if (a === 4) return r; } catch (e) { if (a === 4) throw e; }
    await new Promise(res => setTimeout(res, 3000 * a));
  }
}

function sendHtmlMessage(htmlText) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      chat_id: CHAT_ID,
      text: htmlText,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
    const req = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 30000
    }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(chunks));
        } catch (e) {
          resolve({ ok: false, raw: chunks });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function loadState() {
  if (fs.existsSync(STATE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch (e) {}
  }
  return { next_ep: 1, history: [] };
}

function saveState(st) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(st, null, 2), 'utf8');
}

(async () => {
  const argEp = Number(process.argv[2]);
  const forceSend = process.argv.includes('--force');
  const kstNow = new Date(Date.now() + 9 * 3600 * 1000);
  const todayKst = kstNow.toISOString().slice(0, 10);
  const state = loadState();
  if (!argEp && !forceSend && state.last_sent_date === todayKst) {
    console.log(`Already sent today (${todayKst}). Skipping duplicate send.`);
    process.exit(0);
  }
  const rawNextEp = Number(state.next_ep) || 1;
  const cycledEp = ((rawNextEp - 1) % DAILY_EPISODES.length) + 1;
  const targetEp = (argEp >= 1 && argEp <= DAILY_EPISODES.length) ? argEp : cycledEp;

  const item = DAILY_EPISODES.find(x => x.ep === targetEp);
  if (!item) {
    console.error(`Episode ${targetEp} not found.`);
    process.exit(1);
  }

  const videoPath = path.join(MASTER_DIR, item.file);
  if (!fs.existsSync(videoPath)) {
    console.error(`Video file missing: ${videoPath}`);
    process.exit(1);
  }

  console.log(`Sending Daily 6AM Package for Episode ${item.ep}: ${item.label}...`);

  // 1. 단일 원본에서 유튜브 쇼츠 전용(_YT_Shorts.mp4), 인스타 릴스 전용(_IG_Reels.mp4), 네이버 클립 클린본(_NaverClip_Clean.mp4) 분리 준비
  const { spawnSync } = require('child_process');
  const dualRenderer = path.resolve(__dirname, '../flow_shorts_studio/render_dual_yt_ig_cta.py');
  let ytVideoPath = videoPath.replace(/\.mp4$/i, '_YT_Shorts.mp4');
  let igVideoPath = videoPath.replace(/\.mp4$/i, '_IG_Reels.mp4');
  let naverClipCleanPath = videoPath.replace(/\.mp4$/i, '_NaverClip_Clean.mp4');
  try {
    spawnSync('python', [dualRenderer, videoPath, 'KFK'], { encoding: 'utf8', timeout: 60000 });
  } catch (_) {}
  if (!fs.existsSync(naverClipCleanPath)) {
    try { fs.copyFileSync(videoPath, naverClipCleanPath); } catch (_) { naverClipCleanPath = videoPath; }
  }
  if (!fs.existsSync(ytVideoPath)) ytVideoPath = videoPath;
  if (!fs.existsSync(igVideoPath)) igVideoPath = videoPath;

  const ytVideoCaption =
    `📺 [1/3 영상: 유튜브 쇼츠 전용판 · ${item.ep}/${DAILY_EPISODES.length}편]\n` +
    `${item.label}\n` +
    `⏰ 예약 발행(publishAt): 매일 ${KIDSFIT_KR_UPLOAD_CONFIG.publishAtKst} | Category=Education(27) | MadeForKids=false\n` +
    `✅ 엔딩 자막: 유튜브 맞춤형 (@kidsfit01 프로필 상단 kidsfit.co.kr 클릭 유도)\n` +
    `📺 업로드 유튜브: ${YOUTUBE_CHANNEL_URL}`;
  const vRes = await sendVideoMultipart(ytVideoPath, ytVideoCaption);
  if (!vRes.ok) {
    console.error('Failed to send YT video:', vRes);
    process.exit(1);
  }

  // 2. 유튜브 쇼츠 [제목] 따로 전송
  const msgYtTitle =
    `🔴 <b>[1/4] 유튜브 쇼츠 제목 (@kidsfit01)</b> — 아래 박스 터치 시 바로 복사\n` +
    `<pre>${escapeHtml(item.ytTitle)}</pre>`;
  await sendHtmlMessage(msgYtTitle);

  // 3. 유튜브 쇼츠 [설명글] 따로 전송
  const msgYtDesc =
    `🟠 <b>[2/4] 유튜브 쇼츠 설명란 (@kidsfit01)</b> — 아래 박스 터치 시 바로 복사\n` +
    `<pre>${escapeHtml(item.ytDesc)}</pre>`;
  await sendHtmlMessage(msgYtDesc);

  // 3-2. 유튜브 쇼츠 [무풍지대 안전 고정댓글 (외부 URL 0%)] 따로 전송
  const ytSafePin = `📏 부모 키 유전 한계를 넘는 우리 아이 최종 예상키 & 성조숙증 신호등 1분 무료 진단!\n👉 지금 바로 화면 아래 [@kidsfit01] 채널 아이콘을 누르시고 프로필 상단 [kidsfit.co.kr]에서 1초 만에 무료로 확인해 보세요 😊👇`;
  const msgYtPin =
    `📌 <b>[3/4] 유튜브 쇼츠 안전 고정댓글 (외부 URL 0% · 스팸위험 0%)</b> — 아래 박스 터치 시 바로 복사 후 고정(Pin)\n` +
    `<pre>${escapeHtml(ytSafePin)}</pre>`;
  await sendHtmlMessage(msgYtPin);

  // 4. 인스타 릴스 전용 영상 전송 + 매니챗 키워드 유도 본문 전송
  const igVideoCaption =
    `📸 [2/2 영상: 인스타그램 릴스 전용판 · ${item.ep}/${DAILY_EPISODES.length}편]\n` +
    `✅ 엔딩 자막: 인스타 매니챗 맞춤형 (댓글에 '진단' 또는 '키즈핏' 입력 시 자동 DM 발송 유도)\n` +
    `📸 업로드 인스타: ${INSTAGRAM_PROFILE_URL}`;
  await sendVideoMultipart(igVideoPath, igVideoCaption);

  const msgReels =
    `🟣 <b>[4/4] 인스타그램 릴스 전체 본문 (@kids_fit1)</b> — 아래 박스 터치 시 바로 복사\n` +
    `<pre>${escapeHtml(item.reelsFull + '\n\n💬 댓글에 [키성장] 또는 [통잠]이라고 남겨주시면 1초 만에 DM으로 무료 진단 & 공식 혜택가 바로가기 링크를 보내드려요!')}</pre>`;
  await sendHtmlMessage(msgReels);

  // 4-2. 스레드(Threads) 3줄 팩트폭격 복붙용
  const threadsCopy =
    `🚨 ${item.label}\n` +
    `질병관리청(KDCA) 성장도표 기준 우리 아이 키·두뇌 백분위 1분 무료 진단하고 오늘 영상 속 에디터 엄선 육아템 공식 혜택가까지 한 번에 확인하세요 👇\n` +
    `👉 https://kidsfit.co.kr/?ep=${item.ep}&utm_source=threads&utm_medium=social`;
  const msgThreads =
    `🧵 <b>[5/6] 스레드(Threads) 3줄 팩트폭격 본문</b> — 아래 박스 터치 시 바로 복사\n` +
    `<pre>${escapeHtml(threadsCopy)}</pre>`;
  if (false) await sendHtmlMessage(msgThreads);

  // 4-3. 네이버 클립(Clip) 동시 업로드용 클린 MP4 & 크리에이터샵(cshop.naver.com/paradiseshop) 연결 패키지 전송
  const naverClipCaption =
    `🟢 [3/3 영상: 네이버 클립(Clip) 동시 업로드 전용 클린 MP4 · ${item.ep}/${DAILY_EPISODES.length}편]\n` +
    `✅ 쇼핑 커넥트 상품 태그 & 네이버 공식 브랜드 큐레이션(${NAVER_CREATOR_SHOP_URL}) 직결 업로드용`;
  await sendVideoMultipart(naverClipCleanPath, naverClipCaption);

  const naverCopy =
    `[키즈핏 소아성장 연구소] ${item.ytTitle}\n\n` +
    `✅ 질병관리청(KDCA 2017) 백분위 & 유전 성인 예측키 1분 무료 진단:\n` +
    `https://kidsfit.co.kr/?ep=${item.ep}&utm_source=naver_clip&utm_medium=organic\n` +
    `🟢 네이버 공식 브랜드 큐레이션 · Npay 적립관 보러가기:\n` +
    `${NAVER_CREATOR_SHOP_URL}\n\n` +
    `※ ${KIDSFIT_KR_UPLOAD_CONFIG.ftcNotice}`;
  const msgNaver =
    `🟢 <b>[5/5] 네이버 클립(Clip) &amp; 크리에이터샵 동시 업로드 본문</b> — 아래 박스 터치 시 바로 복사\n` +
    `<pre>${escapeHtml(naverCopy)}</pre>`;
  await sendHtmlMessage(msgNaver);

  // 5. 인스타그램 [댓글 유도 고정댓글 & 자동DM 답장] 전송
  try {
    const { AUTO_DM_RULES } = require('./kidsfit_bot_and_insta_dm');
    const dmRule = AUTO_DM_RULES.find(r => r.ep === item.ep);
    const pinComment = `💬 댓글에 [${item.ep}편] 또는 [링크]라고 남겨주시면 1초 만에 공식 혜택가 & 0원 무료체험 바로가기 DM을 보내드려요! (@kids_fit1 프로필 링크에서도 바로 확인 가능해요 💕)`;
    const dmReply = dmRule ? dmRule.dmText : `안녕하세요! 키즈핏(@kids_fit1)입니다 😊 요청하신 [${item.ep}편] 상품 바로가기 링크입니다 👉 https://kidsfit.co.kr/?ep=${item.ep}`;
    const msgDm =
      `💬 <b>[4/4] 인스타 릴스 고정댓글 &amp; 자동DM 답장 (${item.ep}편)</b>\n` +
      `📌 <b>릴스 고정댓글</b> (박스 터치 시 복사):\n<pre>${escapeHtml(pinComment)}</pre>\n` +
      `📩 <b>댓글 달린 분께 보내는 자동DM 답장</b> (박스 터치 시 복사):\n<pre>${escapeHtml(dmReply)}</pre>`;
    if (false) await sendHtmlMessage(msgDm);
  } catch (_) {}

  // 상태 업데이트 (다음 날 아침 6시에는 다음 편 발송)
  state.history = state.history || [];
  state.history.push({
    ep: item.ep,
    sent_at: new Date().toISOString(),
    video_msg_id: vRes.result && vRes.result.message_id
  });
  if (!argEp) {
    state.next_ep = (item.ep % DAILY_EPISODES.length) + 1;
  }
  state.last_sent_date = todayKst;
  saveState(state);
  console.log(`✅ Daily 6AM Episode ${item.ep} package sent! Next scheduled episode: ${state.next_ep}`);
})();
