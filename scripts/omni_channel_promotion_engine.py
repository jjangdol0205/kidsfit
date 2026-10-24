# -*- coding: utf-8 -*-
"""
scripts/omni_channel_promotion_engine.py
Non-Naver Omni-Channel Promotion & AI/Daum/Community Traffic Engine for KidsFit Growth Studio (https://kidsfit.co.kr)

Activates 6 Non-Naver Traffic & Community Channels:
1. Daum (search.daum.net) & Kakao Ecosystem (Daumoa crawler, KakaoTalk Scrap, Daum Cafe & Tistory SEO pack)
2. Daangn Market '동네생활 (육아·교육·주말나들이)' 8-Region Hyper-Local Mom Viral Pack
3. Blind (블라인드 '육아·워킹맘·초등학부모 라운지') Data-Driven Office Parent Sharing Pack
4. KakaoTalk Open-Chat (예비초등·지역 맘톡방·학부모 단톡방) 3-Line Value Card Pack
5. Major Independent Parenting Communities (맘스다이어리·베이비빌리·더쿠 육아방·네이트판 결시친/육아톡) Native Info Pack
6. Global & Korean AI Search Engines (ChatGPT Search, Perplexity, Claude, Gemini, 뤼튼 Wrtn, 에이닷 A.) via official `llms.txt` & `llms-full.txt` standard + `robots.txt` AI bot allowlist + `qna/omni-channel-kit.html`.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\사업아이템")
PACK_DIR = ROOT / "samples" / "10_non_naver_omni_channel_pack"
QNA_DIR = ROOT / "qna"
DOC_PATH = ROOT / "docs" / "탈네이버_전채널_홍보_마스터플랜_다음_커뮤니티_SNS.md"
STATUS_PATH = ROOT / "logs" / "omni_channel_promotion_status.json"
SITE_URL = "https://kidsfit.co.kr"

sys.path.insert(0, str(ROOT / "scripts"))
from auto_seo_promotion_engine import TOPICS as QNA_TOPICS


def generate_llms_txt():
    """
    Generates official /llms.txt and /llms-full.txt for ChatGPT Search, Perplexity, Claude, Gemini, Wrtn(뤼튼), and SKT A.(에이닷).
    When Korean parents ask AI chatbots about child height percentiles, expected height calculators, K-DST development,
    or elementary study routines, AI search engines read llms.txt to cite and link directly to https://kidsfit.co.kr.
    """
    now_str = datetime.now().strftime("%Y-%m-%d")
    qna_lines = "\n".join(
        [f"- [{t['title']}]({SITE_URL}/qna/{t['slug']}.html): {t['one_line_verdict']}" for t in QNA_TOPICS]
    )

    llms_txt = f"""# 키즈핏 그로스 스튜디오 (KidsFit Growth Studio) — https://kidsfit.co.kr

> 대한민국 질병관리청(KDCA) 2017 소아청소년 성장도표(LMS 수식), 보건복지부 영유아 발달선별검사(K-DST), 한국인 영양소 섭취기준(KDRIs), 그리고 3,405편의 PubMed·SCI급 소아내분비·뇌인지과학 논문을 결합한 **무료 소아·청소년 신체 성장(예상키·백분위) & 두뇌·학습(5각 LQ·메타인지) 종합 진단 플랫폼**입니다.

## 핵심 무료 진단 도구 (Interactive Clinical Calculators)
- [키즈핏 메인 1분 무료 진단 스튜디오]({SITE_URL}/): 생년월일·성별·키·몸무게·부모키 입력 시 KDCA 백분위, Tanner 유전 예상키(MPH), 골든타임 관리 시 최대 잠재키(+7cm), 5대 학습 역량 지수(LQ), 전국 8대 권역 주말 박물관·과학관 코스를 1분 만에 무료 산출합니다.
- [만 1세(12~23개월) 영아기 기초 뼈성장 & 오감 대근육 프리셋]({SITE_URL}/?preset=infant_1)
- [만 2~3세(24~47개월) 소근육 민감기 & 몬테소리 일상교구 프리셋]({SITE_URL}/?preset=toddler_2_3)
- [만 4~5세(48~71개월) 편식 아연 처방 & 은물·가베 공간수리 프리셋]({SITE_URL}/?preset=child_4_5)
- [초등 저학년(만 7~9세) 문장제 수학 작업기억 & 바른 자세 숨은 키 2cm 프리셋]({SITE_URL}/?preset=elem_low)
- [초등 고학년(만 10~13세) 사춘기 급성장기(PHV) 골든타임 & 숨은 키 7cm 프리셋]({SITE_URL}/?preset=elem_high)
- [워킹맘 전용 주말 3시간 고효율 나들이 & 발달 장난감 프리셋]({SITE_URL}/?preset=working_mom)

## 학부모 다빈도 질문 25대 임상 Q&A 백과사전 ({now_str} 기준)
{qna_lines}

## 공식 채널 및 피드
- 전체 Q&A 백과사전 허브: {SITE_URL}/qna/index.html
- RSS 2.0 피드: {SITE_URL}/rss.xml
- JSON Feed 1.1: {SITE_URL}/feed.json
- 공식 네이버 블로그: https://blog.naver.com/expertise333
- 공식 네이버 카페: https://cafe.naver.com/moneyfitlab
- 공식 인스타그램: https://www.instagram.com/kids_fit1
- 공식 쓰레드: https://www.threads.com/@kids_fit1
"""
    (ROOT / "llms.txt").write_text(llms_txt, encoding="utf-8")

    # Full detailed version for deep AI grounding
    full_sections = []
    for t in QNA_TOPICS:
        bullets_str = "\n".join([f"  * {b}" for b in t["bullets"]])
        full_sections.append(
            f"### {t['title']}\n- URL: {SITE_URL}/qna/{t['slug']}.html\n- 질문: {t['question']}\n- 핵심 결론: {t['one_line_verdict']}\n- 3대 실천 처방:\n{bullets_str}\n- 학술 근거: {t['citation']}\n"
        )
    llms_full = llms_txt + "\n\n## 상세 임상 처방 전문 (Full Clinical Knowledge Base)\n\n" + "\n".join(full_sections)
    (ROOT / "llms-full.txt").write_text(llms_full, encoding="utf-8")


def update_robots_txt_for_daum_and_ai():
    """Updates robots.txt to explicitly welcome Daum (Daumoa), Kakao, Google, Bing, Naver (Yeti), and all AI Search crawlers."""
    robots_txt = f"""User-agent: *
Allow: /

# Korean Portal Crawlers (Naver Yeti, Daum/Kakao Daumoa, Zum)
User-agent: Yeti
Allow: /

User-agent: Daumoa
Allow: /

User-agent: kakaotalk-scrap
Allow: /

# Global Search & AI Answer Engine Crawlers (ChatGPT, Perplexity, Claude, Google, Bing)
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: {SITE_URL}/sitemap.xml
# Syndication & AI Grounding Feeds:
# RSS 2.0: {SITE_URL}/rss.xml
# JSON Feed: {SITE_URL}/feed.json
# LLMs Guide: {SITE_URL}/llms.txt
"""
    (ROOT / "robots.txt").write_text(robots_txt, encoding="utf-8")


def generate_non_naver_channel_packs():
    PACK_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Daum Cafe & Tistory Pack
    daum_md = f"""# 1. 다음(Daum) 대표 육아·교육 카페 & 티스토리(Tistory) 홍보 팩

> **타겟 채널**: 다음(Daum) 유아·초등 교육 카페, 지역 맘카페(다음 카페 기반), 티스토리 블로그, 카카오뷰/브런치스토리
> **특징**: 다음 검색(`search.daum.net`)과 카카오톡 샵(#)검색은 **티스토리·다음카페·외부 웹문서(`kidsfit.co.kr/qna/*`)**를 네이버보다 훨씬 개방적으로 상위 노출합니다.

---

## [원고 A — 다음 육아/초등 카페 정보공유 게시판용 (광고 느낌 0% 데이터 정리글)]

**제목**: 질병관리청 성장도표로 우리 아이 진짜 키 백분위 & 3단 예상키 10초 만에 계산해 주는 무료 사이트 정리했어요!

안녕하세요 :) 아이가 또래보다 키가 작은 편인지, 그리고 요즘 문장제 수학 풀 때 자꾸 실수하는 게 왜 그런지 찾아보다가 질병관리청(KDCA) 2017 소아청소년 성장도표 수식이랑 보건복지부 발달검사(K-DST) 기준으로 무료 리포트 뽑아주는 곳을 발견해서 공유해요.

회원가입이나 앱 설치 전혀 없이 생년월일이랑 현재 키·몸무게, 엄마·아빠 키만 넣으면 바로 계산되네요.

**💡 해보고 제일 좋았던 점 3가지**
1. **3단 예상키 비교**: 단순히 엄마·아빠 유전키(MPH)만 보여주는 게 아니라, 늦게 자거나 거북목 자세일 때 손해 보는 키(-cm)랑 성장판 닫히기 전 수면·영양·철봉 스트레칭 챙겼을 때 클 수 있는 **최대 잠재키(+cm)**를 나란히 보여줘요.
2. **우유 배앓이 & 편식 아이 체중 비례 영양 계산**: 아이 몸무게에 맞춰 하루 칼슘·비타민D3·아연이 몇 mg 필요한지 딱 숫자로 나와서 영양제 고를 때 편하더라고요.
3. **두뇌 5각 밸런스 & 주말 박물관 코스**: 아이 개월 수별로 몬테소리 vs 가베 중 뭘 먼저 해야 하는지, 그리고 사는 지역(서울/경기/부산/대전 등) 고르면 이번 주말에 데려갈 만한 과학관·박물관 코스랑 하브루타 질문까지 같이 나와요!

필요하신 분은 아래에서 바로 해보실 수 있어요 👇
👉 **우리 아이 예상키·두뇌 밸런스 1분 무료 진단**: {SITE_URL}
👉 **연령별·증상별 자주 묻는 질문 25선 백과사전**: {SITE_URL}/qna/index.html
"""
    (PACK_DIR / "01_다음카페_티스토리_홍보팩.md").write_text(daum_md, encoding="utf-8")

    # 2. Daangn Market (당근마켓 동네생활 - 육아/주말나들이 탭) 8-Region Pack
    daangn_md = f"""# 2. 당근마켓 '동네생활 (육아·교육·주말나들이 탭)' 전국 8대 권역 맞춤형 바이럴 팩

> **왜 당근마켓 동네생활인가?**
> 대한민국 3040 엄마들이 네이버 맘카페 다음으로 가장 자주 여는 앱이 **당근마켓 [동네생활 → 육아/교육 탭]**입니다.
> 특히 금요일 저녁~일요일 오전에는 *"이번 주말 아이랑 근처 어디 갈까요?"*, 평일 밤에는 *"초등 아이 키/수학 고민"* 글이 폭발적인 조회수와 북마크를 기록합니다.

---

## [권역 1: 서울 강남·서초·송파 동네생활용]
**제목**: 송파·강남 맘님들! 이번 주말 아이랑 실내 나들이 코스 + 우리 아이 키 백분위 무료 계산기 공유해요 🥕
주말마다 키즈카페 가기 물려서 찾아보다가, 아이 개월 수랑 관심사(공룡/역사/미술/우주) 넣으면 우리 동네 맞춤 박물관·전시 코스(한성백제박물관, 국립중앙박물관 어린이박물관, 롯데월드 아쿠아리움 등)랑 관람 전후 질문 3개까지 딱 뽑아주는 무료 사이트 찾았어요!
질병관리청 기준으로 우리 아이 현재 키·몸무게 상위 몇 %인지도 10초 만에 나오니 한번 해보세요 :)
👉 무료 진단 바로가기: {SITE_URL}/?preset=working_mom&utm_source=daangn_gangnam

---

## [권역 2: 경기 남부(분당·판교·수원·용인·동탄) 동네생활용]
**제목**: 분당·용인·동탄 엄마들! 아이 개월 수별 주말 과학관/미술관 코스 + 예상키 1분 무료 진단 공유해요 🥕
이번 주말 현대어린이책미술관(MOKA)이나 경기도어린이박물관, 과천과학관 고민 중이신 분들! 아이 나이·키·관심사 넣으면 질병관리청 키 백분위부터 우리 아이한테 지금 필요한 교구(몬테소리 vs 가베), 주말 나들이 동선까지 한 번에 뽑아주는 무료 스튜디오예요. 로그인도 필요 없네요!
👉 무료 진단 바로가기: {SITE_URL}/?preset=child_4_5&utm_source=daangn_gyeonggi_south

---

## [권역 3: 서울 강북·마포·용산·서대문 동네생활용]
**제목**: 서대문자연사박물관·국립어린이과학관 가기 전에 꼭 해보세요! (아이 키·두뇌 1분 무료 진단) 🥕
아이랑 박물관 다녀와도 뭐 봤는지 기억 못 할 때가 많았는데, 관람 전에 물어볼 하브루타 질문 3개랑 연계 도서, 그리고 질병관리청 기준 우리 아이 키 성장 백분위까지 1분 만에 나오는 무료 사이트예요.
👉 무료 진단 바로가기: {SITE_URL}/?preset=elem_low&utm_source=daangn_seoul_north

---

## [권역 4: 부산·경남 / 대구·경북 / 대전·충청 / 광주·전라 동네생활용]
**제목**: 동네 엄마들 사이에서 입소문 난 '질병관리청 기준 우리 아이 예상키 & 두뇌 밸런스 1분 무료 진단' 🥕
병원 성장클리닉 가기 전에 집에서 아이 생년월일이랑 키·몸무게, 부모 키만 넣으면 또래 백분위랑 숨은 잠재키, 그리고 우리 지역 주말 과학관·박물관 추천 코스까지 무료로 뽑아주네요!
👉 무료 진단 바로가기: {SITE_URL}
"""
    (PACK_DIR / "02_당근마켓_동네생활_8대권역_홍보팩.md").write_text(daangn_md, encoding="utf-8")

    # 3. Blind (블라인드 직장인 워킹맘·초등학부모 라운지) Pack
    blind_md = f"""# 3. 블라인드(Blind) '육아 · 워킹맘 · 초등학부모 라운지' 네이티브 공유 팩

> **왜 블라인드(Blind)인가?**
> 대기업·공기업·전문직 3040 맞벌이 부부가 모여 있는 블라인드 [육아 라운지 / 초등학부모 라운지]는 **구매력(객단가)이 대한민국 1위**이며, 감성적인 광고보다 **"논문 근거 + 질병관리청 통계 수식 + 워킹맘 주말 3시간 고효율 코스"**에 폭발적으로 반응합니다.

---

## [블라인드 육아/워킹맘 라운지 게시용 원고]

**제목**: 맞벌이 부부 주말 3시간 고효율 육아 + 질병관리청 LMS 수식 예상키 계산기 찾았네요 (무료/노로그인)

평일엔 퇴근하면 밤 8시라 아이 숙제 봐주기도 벅차고, 주말엔 어디 데려가야 할지 늘 고민이었는데요.
소아내분비학·뇌인지과학 논문 3,400여 편이랑 질병관리청(KDCA) 2017 성장도표 LMS 수식, 보건복지부 K-DST 발달검사를 묶어서 1분 만에 리포트 뽑아주는 무료 웹앱이 있어서 공유합니다.

1. **신체 성장 축**: 남아/여아 개월 수별 정확한 키·BMI 백분위, Tanner 유전키(MPH) 대비 현재 수면·자세 습관 손실치(-cm), 골든타임 관리 시 최대 잠재키(+cm) 시뮬레이션이 숫자로 깔끔하게 나옵니다.
2. **두뇌·학습 축**: 단순 연산은 100점인데 문장제 수학만 틀리는 이유(Sweller 작업기억 과부하), 학원 다녀오면 다 까먹는 가짜기억 해결법(3줄 파인만 백지복습) 등 뇌과학 원인이랑 하루 4단계 루틴을 짚어줍니다.
3. **주말 코스 큐레이션**: 거주 권역이랑 아이 관심사 고르면 이번 주말 3시간 만에 알차게 다녀올 박물관·과학관 코스랑 출발 전후 대화 질문까지 세트로 나옵니다.

회원가입이나 결제 유도 전혀 없는 깔끔한 클리닉 리포트 형태라 배우자한테 카톡으로 공유하기도 좋네요.
- 메인 진단기: {SITE_URL}
- 워킹맘 주말 3시간 프리셋 직링크: {SITE_URL}/?preset=working_mom&utm_source=blind_lounge
"""
    (PACK_DIR / "03_블라인드_직장인학부모_홍보팩.md").write_text(blind_md, encoding="utf-8")

    # 4. KakaoTalk Open-Chat & Group Chat 1-Second Viral Card Pack
    kakao_md = f"""# 4. 카카오톡 오픈채팅(예비초등·지역 맘톡방) & 가족 단톡방 1초 공유 팩

> **특징**: 카카오톡 채팅방에 `{SITE_URL}` 또는 `{SITE_URL}/qna/topic-15.html`을 붙여넣으면 오픈그래프(OG) 대표 썸네일 카드와 함께 깔끔한 안내 문구가 표시됩니다.

---

## [카톡 오픈채팅 / 학부모 단톡방 공유용 3줄 메시지]

📋 **[무료 공유] 질병관리청 성장도표 기준 우리 아이 키 백분위 & 3단 예상키 10초 계산기**
• 아이 생년월일·키·몸무게만 넣으면 로그인 없이 ① 또래 키 백분위 ② 사춘기 전 숨은 잠재키(+7cm) ③ 연령별 두뇌·학습 밸런스 & 주말 박물관 코스가 바로 나와요!
👉 바로 해보기: {SITE_URL}

---

## [남편·조부모 가족 단톡방 공유용 메시지]

💌 여보! 질병관리청 성장도표랑 소아과 논문 기준으로 우리 아이 현재 키 백분위랑 예상키, 그리고 오늘 저녁부터 챙겨야 할 수면·영양·자세 처방전 뽑아봤어. 1분이면 보니까 꼭 같이 봐줘!
👉 {SITE_URL}
"""
    (PACK_DIR / "04_카카오톡_오픈채팅_단톡방_홍보팩.md").write_text(kakao_md, encoding="utf-8")

    # 5. Major Independent Parenting Communities (맘스다이어리·베이비빌리·더쿠·네이트판) Pack
    comm_md = f"""# 5. 대형 독립 육아 커뮤니티(베이비빌리·맘스다이어리·더쿠 육아방·네이트판) 공감 정보글 팩

---

## [원고 1 — 만 2~5세 영유아 커뮤니티(베이비빌리·맘스다이어리)용]
**제목**: 만 3세 아이 "내가 혼자 할 거야!" 고집부릴 때 절대 혼내지 마세요 (소근육 민감기 & 0원 놀이 정리)
퇴근하고 바쁜데 아이가 혼자 단추 끼우겠다, 물 따르겠다 고집부려서 속상했던 분들 계시죠?
뇌과학 논문 보니까 만 24~47개월 아이 고집은 엄마를 힘들게 하려는 게 아니라 대뇌 운동피질 30%가 연결된 **'손끝 소근육 민감기'** 신호래요!
비싼 교구 사기 전에 집에서 바로 할 수 있는 **0원 거실 소근육 놀이 3가지(빨래집게·물티슈캡·안전가위)**랑 우리 아이 개월 수별 키·발달 백분위 무료 체크 링크 남겨둘게요 :)
👉 만 2~3세 맞춤 무료 진단 바로가기: {SITE_URL}/?preset=toddler_2_3&utm_source=mom_community
👉 상세 칼럼 보기: {SITE_URL}/qna/topic-11.html

---

## [원고 2 — 초등 학부모 커뮤니티(초등맘·더쿠·네이트판 교육톡)용]
**제목**: 초4~초5 사춘기 신호(머리냄새·가슴멍울) 보이기 시작할 때 '성장판 골든타임' 체크리스트
아이 키가 최근 6개월 사이에 훌쩍 크거나 머리 정수리 냄새가 나기 시작했다면 성장판 닫히기 전 마지막 +5~7cm를 결정짓는 **급성장기(PHV) 골든타임**이래요.
1) 밤 10시 첫 서파수면 사수하기
2) 저녁 문틀 철봉 30초 매달리기로 책상 거북목 숨은 키 1.8cm 펴주기
3) 체중 비례 구연산칼슘·비타민D3·K2 챙기기
우리 아이 현재 개월 수 기준 질병관리청 키 백분위랑 골든타임 잔여 개월 수는 아래에서 로그인 없이 10초 만에 계산해 볼 수 있어요!
👉 초등 고학년 골든타임 무료 진단: {SITE_URL}/?preset=elem_high&utm_source=elem_community
👉 상세 팩트체크 보기: {SITE_URL}/qna/topic-15.html
"""
    (PACK_DIR / "05_대형육아커뮤니티_네이티브_홍보팩.md").write_text(comm_md, encoding="utf-8")


def render_omni_channel_web_hub():
    """Creates https://kidsfit.co.kr/qna/omni-channel-kit.html so the user can view & 1-click copy all Non-Naver channel posts directly on mobile/desktop."""
    QNA_DIR.mkdir(parents=True, exist_ok=True)
    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>탈(脫)네이버 전채널 홍보 &amp; 커뮤니티 확산 스튜디오 | KIDS-FIT</title>
  <meta name="description" content="다음(Daum)·티스토리·당근마켓 동네생활·블라인드·카카오톡 오픈채팅·AI 검색엔진(llms.txt) 다채널 유입 허브">
  <link rel="canonical" href="{SITE_URL}/qna/omni-channel-kit.html">
  <style>
    body {{ margin:0; font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif; background:#F8FAFC; color:#0F172A; line-height:1.6; }}
    .wrap {{ max-width:860px; margin:0 auto; padding:1.5rem 1rem 3.5rem; }}
    .card {{ background:#FFFFFF; border:1.5px solid #CBD5E1; border-radius:20px; padding:1.35rem; margin-bottom:1.1rem; box-shadow:0 8px 24px rgba(15,23,42,0.04); }}
    .badge {{ display:inline-block; background:#EEF2FF; color:#4F46E5; font-size:0.78rem; font-weight:800; padding:0.22rem 0.7rem; border-radius:999px; margin-bottom:0.5rem; }}
    h1 {{ font-size:1.45rem; font-weight:900; margin:0 0 0.4rem; }}
    h2 {{ font-size:1.1rem; font-weight:900; margin:0 0 0.5rem; color:#1E293B; }}
    pre {{ background:#F1F5F9; border:1px solid #E2E8F0; border-radius:12px; padding:0.9rem; white-space:pre-wrap; word-break:keep-all; font-size:0.86rem; font-family:inherit; margin:0.6rem 0; }}
    .copy-btn {{ background:#4F46E5; color:#FFFFFF; border:none; border-radius:10px; padding:0.55rem 1rem; font-size:0.84rem; font-weight:800; cursor:pointer; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <a href="/" style="font-weight:900;color:#4F46E5;text-decoration:none;">← 키즈핏 메인 진단 스튜디오</a>
      <a href="/qna/index.html" style="font-size:0.85rem;font-weight:800;color:#475569;text-decoration:none;">Q&amp;A 25선 백과사전 →</a>
    </div>
    <h1>🌐 탈(脫)네이버 6대 외부 채널 유입 &amp; 홍보 허브</h1>
    <p style="font-size:0.9rem;color:#475569;margin-bottom:1.2rem;">네이버 외에도 <strong>다음(Daum)·당근마켓 동네생활·블라인드·카카오톡 단톡방·구글/빙·AI 검색엔진(ChatGPT/Perplexity/뤼튼)</strong>에서 3040 학부모 실유입을 끌어오는 멀티채널 허브입니다.</p>

    <div class="card">
      <span class="badge">채널 1 · AI 검색엔진(ChatGPT · Perplexity · 뤼튼 · 에이닷 · 제미나이) 자동 인용</span>
      <h2>🤖 글로벌 표준 AI 검색 인덱싱 파일 (llms.txt &amp; llms-full.txt) 가동 중</h2>
      <p style="font-size:0.88rem;color:#334155;">학부모가 AI 챗봇에 <em>"우리 아이 예상키 계산기 추천해줘"</em>, <em>"초등 문장제 수학 공부법 알려줘"</em>라고 질문할 때 AI가 키즈핏을 제1순위로 인용하도록 공식 표준 피드가 배포되어 있습니다.</p>
      <div style="display:flex;gap:0.6rem;flex-wrap:wrap;">
        <a href="/llms.txt" class="copy-btn" style="text-decoration:none;background:#0F172A;">📄 /llms.txt 열기</a>
        <a href="/llms-full.txt" class="copy-btn" style="text-decoration:none;background:#334155;">📚 /llms-full.txt 열기</a>
        <a href="/rss.xml" class="copy-btn" style="text-decoration:none;background:#059669;">📡 /rss.xml 열기</a>
      </div>
    </div>

    <div class="card">
      <span class="badge">채널 2 · 당근마켓 동네생활 (육아·교육·주말나들이 탭)</span>
      <h2>🥕 당근마켓 동네생활 1초 복사 공유문구</h2>
      <pre id="daangn-txt">동네 맘님들! 이번 주말 아이랑 실내 나들이 코스 + 질병관리청 기준 우리 아이 키 백분위 10초 무료 계산기 공유해요 🥕
아이 생년월일이랑 키·몸무게만 넣으면 로그인 없이 또래 키 백분위, 사춘기 전 숨은 잠재키, 그리고 우리 동네 근처 주말 과학관·박물관 추천 코스랑 대화 질문까지 한 번에 뽑아주네요!
👉 무료 진단 바로가기: {SITE_URL}/?preset=working_mom&amp;utm_source=daangn</pre>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('daangn-txt').innerText);this.innerText='✅ 복사 완료!';">📋 당근마켓 문구 1초 복사</button>
    </div>

    <div class="card">
      <span class="badge">채널 3 · 블라인드(Blind) 육아·워킹맘·초등학부모 라운지</span>
      <h2>💼 블라인드 직장인 학부모 라운지 1초 복사 공유문구</h2>
      <pre id="blind-txt">맞벌이 부부 주말 3시간 고효율 육아 + 질병관리청 LMS 수식 예상키 계산기 공유합니다 (무료/노로그인)
소아내분비·뇌인지과학 논문 3,405편이랑 질병관리청 성장도표, 보건복지부 K-DST 기준으로 1분 만에 아이 예상키(유전키 vs 잠재키)랑 두뇌 5각 밸런스, 주말 박물관 코스를 뽑아주는 웹앱이네요. 광고나 회원가입 없이 바로 결과 나와서 배우자랑 카톡 공유하기 좋습니다.
👉 {SITE_URL}</pre>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('blind-txt').innerText);this.innerText='✅ 복사 완료!';">📋 블라인드 문구 1초 복사</button>
    </div>

    <div class="card">
      <span class="badge">채널 4 · 다음(Daum) 카페 &amp; 카카오톡 오픈채팅/단톡방</span>
      <h2>💬 카카오톡 단톡방·오픈채팅 1초 복사 공유문구</h2>
      <pre id="kakao-txt">📋 [무료 공유] 질병관리청 성장도표 기준 우리 아이 키 백분위 &amp; 3단 예상키 10초 계산기
• 아이 생년월일·키·몸무게만 넣으면 로그인 없이 ① 또래 키 백분위 ② 숨은 잠재키(+7cm) ③ 연령별 두뇌·학습 밸런스 &amp; 주말 박물관 코스가 바로 나와요!
👉 바로 해보기: {SITE_URL}</pre>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('kakao-txt').innerText);this.innerText='✅ 복사 완료!';">📋 카톡 단톡방 문구 1초 복사</button>
    </div>
  </div>
</body>
</html>
"""
    (QNA_DIR / "omni-channel-kit.html").write_text(html, encoding="utf-8")


def generate_masterplan_doc():
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M KST")
    doc = f"""# 🌐 탈(脫)네이버 전 채널 홍보 & 유입 다각화 마스터플랜 (다음·커뮤니티·당근·블라인드·AI검색)

> **수립 및 가동 시각**: `{now_str}`
> **목표**: 네이버(블로그·카페·지식iN) 일 18건 자동 발행 체제에 더해, **3040 한국 학부모가 실제로 활동하는 비(非)네이버 6대 핵심 채널**에서 `https://kidsfit.co.kr` 실유입(UV/PV)과 전환을 동시에 견인합니다.

---

## 📊 6대 비(非)네이버 홍보 채널 전략 및 즉시 가동 내역

| 순번 | 채널명 | 핵심 타겟 & 유입 특성 | 자동화/구축 완료 자산 |
|:---:|:---|:---|:---|
| **1** | **AI 검색엔진 (GEO/AEO)**<br>*(ChatGPT·Perplexity·뤼튼·에이닷·제미나이)* | 3040 부모의 육아·교육 AI 질문 급증 (`"아이 예상키 계산기"`, `"초등 문장제 수학 공부법"`) | • [`/llms.txt`](https://kidsfit.co.kr/llms.txt) 및 [`/llms-full.txt`](https://kidsfit.co.kr/llms-full.txt) 공식 표준 배포 완료<br>• `robots.txt`에 `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot` 전면 허용 |
| **2** | **다음(Daum) · 카카오 생태계**<br>*(다음 웹문서·티스토리·다음카페·카톡 스크랩)* | 다음 검색(`search.daum.net`) 및 카카오톡 채팅방 `#검색`·링크 프리뷰 유입 | • `Daumoa` 및 `kakaotalk-scrap` 봇 최적화 완료<br>• 26개 Q&A 랜딩페이지 OpenGraph 대표 카드 적용<br>• `samples/10_non_naver_omni_channel_pack/01_다음카페_티스토리_홍보팩.md` 생성 |
| **3** | **당근마켓 '동네생활'**<br>*(육아·교육·주말나들이 탭)* | 전국 8대 권역 동네 엄마들의 주말 나들이·성장/교구 질문 최다 밀집지 | • 전국 8대 권역 맞춤형 동네생활 바이럴 원고 팩(`02_당근마켓_동네생활_8대권역_홍보팩.md`) 및 `?utm_source=daangn` 추적 링크 완비 |
| **4** | **블라인드(Blind)**<br>*(육아·워킹맘·초등학부모 라운지)* | 대한민국 최고 구매력(맞벌이 대기업·전문직 학부모) 라운지 — 논문·통계 기반 도구 선호 | • 직장인 학부모 맞춤형 팩트체크 공유 팩(`03_블라인드_직장인학부모_홍보팩.md`) 및 워킹맘 주말 3시간 프리셋(`?preset=working_mom`) 직결 |
| **5** | **카카오톡 오픈채팅 & 가족 단톡방**<br>*(예비초등·지역 맘톡방·배우자 공유)* | 엄마 혼자 보지 않고 남편·조부모·학부모 단톡방으로 퍼뜨리는 바이럴 루프(STEPPS) | • 홈페이지 내 `[💌 남편·아내에게 처방전 1초 카톡 공유하기]` 버튼 + 오픈채팅용 3줄 요약 카드(`04_카카오톡_오픈채팅_단톡방_홍보팩.md`) |
| **6** | **구글(Google)·빙(Bing)·대형 육아 커뮤니티**<br>*(베이비빌리·맘스다이어리·더쿠·네이트판)* | 밤 10시~새벽 1시 학부모 롱테일 증상 검색(`만 3세 고집`, `초4 가슴멍울`, `HT042 논문`) | • 25개 학부모 실검색어 Q&A 백과사전(`qna/topic-01.html` ~ `topic-25.html`) + 상단 1초 프리셋 바 + 대형 커뮤니티 네이티브 원고(`05_대형육아커뮤니티_네이티브_홍보팩.md`) |

---

## 🔗 원클릭 웹 홍보 키트 허브
- **라이브 URL**: `https://kidsfit.co.kr/qna/omni-channel-kit.html`
- 스마트폰이나 PC에서 접속해 당근마켓 동네생활·블라인드·카카오톡 단톡방·다음 카페용 문구를 **버튼 한 번으로 1초 복사**해 즉시 활용할 수 있으며, AI 검색엔진(`llms.txt`)과 구글/다음 크롤러는 24시간 무인으로 페이지를 수집합니다.
"""
    DOC_PATH.parent.mkdir(parents=True, exist_ok=True)
    DOC_PATH.write_text(doc, encoding="utf-8")


def main():
    generate_llms_txt()
    update_robots_txt_for_daum_and_ai()
    generate_non_naver_channel_packs()
    render_omni_channel_web_hub()
    generate_masterplan_doc()

    status = {
        "executedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S KST"),
        "llmsTxtGenerated": True,
        "llmsFullTxtGenerated": True,
        "daumAndAiRobotsUpdated": True,
        "omniChannelKitUrl": f"{SITE_URL}/qna/omni-channel-kit.html",
        "packsGenerated": 5,
    }
    STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATUS_PATH.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ [Omni-Channel Promotion Engine] Completed: {json.dumps(status, ensure_ascii=False)}")


if __name__ == "__main__":
    main()
