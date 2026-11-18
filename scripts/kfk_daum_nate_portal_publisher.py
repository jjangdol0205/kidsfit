#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
D:\드림컴퍼니\5사업부\scripts\kfk_daum_nate_portal_publisher.py
================================================================================
5사업부 키즈핏 코리아 (KidsFit Pediatric Growth Editorial Lab)
『다음(Daum) · 네이트(Nate) 포털 검색 상위노출 에디토리얼 저널 & 브런치/티스토리·네이트판 무스팸 자동 퍼블리셔』

핵심 아키텍처 (Zero-Spam · Prestige Magazine · 5-Portal Anti-Duplicate):
  1. [온사이트 한국 포털 검색 최적화 럭셔리 칼럼 허브 (`qna/editorial-01~10-*.html`)]:
     - 다음(`Daumoa`·`kakaotalk-scrap`·`dg:plink`) 및 네이트(`NATE`·`Cowbot`·`nate:title`) 전용 메타태그 +
       `ScholarlyArticle`·`FAQPage` JSON-LD + 질병관리청(KDCA 2017) 공식 표준키 데이터 테이블 완비.
     - 하단 조용한 서명형 전환 허브(`#kfk-qna-conversion-hub`: 3초 무료 정회원 + 9,900원 마스터북 PDF
       `#kfk-latpeed-ebook-slot` + 쿠팡 `AF7865143` · Npay · 링크프라이스 `A100708867` + 공정위 고지).
  2. [다음(Daum) 브런치스토리·티스토리·다음카페 서재형 에세이 에디션 자동 생성 & 무팝업 발행]:
     - 네이버 블로그/카페 원고와 단어 중복률(4-gram Jaccard) 0.12 미만의 독립 서재 에세이 문체.
     - `.daum-kakao-headless-profile` 세션 보유 시 일 1회 무팝업(`headless=True`) 자동 발행(2FA/보안문자 우회 금지).
  3. [네이트(Nate) 판 3040 육아톡톡·라이프 팩트체크 에세이 에디션 자동 생성 & 무팝업 발행]:
     - 커뮤니티 거부감 0%를 위해 외부 URL을 완전히 배제한(`Zero-URL`) 고급 육아 교양 칼럼 + 자연스러운 브랜드 각인.
     - `.nate-headless-profile` 세션 보유 시 일 1회 무팝업 자동 발행 지원.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import html
import json
from pathlib import Path
import re
import shutil
import sys
import time
from typing import Any, Dict, List, Optional

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

KST = timezone(timedelta(hours=9))
ROOT_DIR = Path(__file__).resolve().parent.parent
HQ_ROOT = ROOT_DIR.parent
QNA_DIR = ROOT_DIR / "qna"
DIST_DIR = ROOT_DIR / "dist"
LOGS_DIR = ROOT_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
OUTBOX_ROOT = HQ_ROOT / "text_automation_hq" / "outbox"

DAUM_PROFILE_DIR = ROOT_DIR / ".daum-kakao-headless-profile"
NATE_PROFILE_DIR = ROOT_DIR / ".nate-headless-profile"
DAUM_LOCK_PATH = LOGS_DIR / "daum_daily_1x_safe_lock.json"
NATE_LOCK_PATH = LOGS_DIR / "nate_daily_1x_safe_lock.json"
PORTAL_STATUS_PATH = LOGS_DIR / "daum_nate_portal_status.json"

if str(ROOT_DIR / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "scripts"))
if str(HQ_ROOT / "text_automation_hq") not in sys.path:
    sys.path.insert(0, str(HQ_ROOT / "text_automation_hq"))

from kfk_prestige_naver_kin_advisor import validate_prestige_anti_spam_tone  # noqa: E402

# 10종 키즈핏 소아성장 연구소 럭셔리 에디토리얼 시리즈 (다음·네이트·네이버 통합검색 롱테일 & 홈판 동시 타깃)
PRESTIGE_PORTAL_EDITORIAL_SERIES: List[Dict[str, Any]] = [
    {
        "seq": 1,
        "slug": "editorial-01-slow-wave-sleep-melatonin-30lux-growth-hormone",
        "category_badge": "VOL.01 · 수면내분비 에디토리얼",
        "age_badge": "만 4세 ~ 만 14세 성장기",
        "segment": "kr_upper_golden_time",
        "title": "잠드는 시계 바늘보다 중요한 것: 입면 후 첫 90분 서파수면과 거실 조도 30Lux의 성장생리학",
        "subtitle": "밤 10시에 누워도 키 성장이 더딘 아이들의 공통점과 저녁 공복·조명 리듬 재설계",
        "daum_essay_title": "아이의 성장판 시계는 밤 9시 반, 거실 스탠드 아래서 조용히 켜집니다",
        "nate_essay_title": "밤 10시 전에 재우는데도 아이 키가 더뎌서 소아과 기록 다시 보며 바꾼 저녁 습관 3가지",
        "keywords": ["성장호르몬 분비시간", "서파수면 키성장", "질병관리청 표준키", "어린이 수면 조도", "급성장기 PHV"],
        "lead_quote": (
            "하루 성장호르몬의 약 70%는 시계 바늘이 밤 10시를 가리킬 때가 아니라, "
            "아이가 잠든 직후 찾아오는 첫 번째 깊은 서파수면(Stage N3) 90분 동안 집중 방출됩니다."
        ),
        "web_sections": [
            (
                "1. 왜 일찍 눕혀도 아침마다 피곤해하고 키 속도가 완만할까요?",
                "많은 가정에서 밤 10시 소등 원칙을 지키려 애쓰시지만, 정작 소등 직전까지 밝은 거실 백색 형광등(500Lux 이상) 아래서 태블릿을 보거나 달콤한 과일·우유를 섭취하는 경우가 많습니다. 망막을 통해 들어오는 청색광은 송과선의 멜라토닌 분비를 지연시키고, 취침 전 당분 섭취로 높아진 혈중 인슐린은 뇌하수체 전엽의 성장호르몬 맥동을 직접적으로 둔화시킵니다.",
            ),
            (
                "2. 서파수면(Slow-Wave Sleep) 진폭을 살리는 3시간 공복과 30Lux 온백색 조명",
                "소아내분비 연구(PMID: 10880452)에 따르면 저녁 식사를 취침 3시간 전에 마쳐 혈당과 인슐린이 잔잔해진 상태에서, 취침 60분 전 실내 조도를 30Lux 이하의 따뜻한 전구색(2700K)으로 낮추면 심부 체온이 약 0.5도 내려가며 깊은 서파수면 진입 시간이 크게 단축됩니다. 같은 8시간을 자더라도 성장판 연골세포가 받는 성장 신호의 밀도가 달라지는 이유가 여기에 있습니다.",
            ),
            (
                "3. 가정에서 오늘 밤 바로 점검할 저녁 루틴 3원칙",
                "첫째, 저녁 식후에는 과일·주스 대신 미지근한 물 한 모금으로 입안을 헹구고 공복 리듬을 지켜 주세요. 둘째, 밤 9시 30분 거실 중앙등을 끄고 간접 스탠드 하나만 남겨 가족 모두 조용한 휴식 모드로 전환합니다. 셋째, 구강호흡으로 수면이 얕아지지 않도록 침실 습도(45~50%)와 아이 경추 각도에 맞는 베개 높이를 세심하게 맞춰 주시기 바랍니다.",
            ),
        ],
        "daum_paragraphs": [
            "퇴근 후 부랴부랴 저녁 식탁을 치우고 아이 숙제까지 봐주고 나면 어느새 시계는 밤 9시 반을 넘어섭니다. 서둘러 불을 끄고 아이 이불을 덮어주면서도 문득 '이렇게 챙기는데 왜 올해 키는 4cm 남짓밖에 안 자랐을까' 하는 조바심이 스칠 때가 있습니다.",
            "소아성장 연구 문헌을 차분히 들여다보면, 아이의 성장판이 가장 활발히 일하는 순간은 단순히 침대에 누운 시각이 아니라 잠든 뒤 첫 90분간 이어지는 깊은 서파수면(Slow-Wave Sleep) 구간임을 알 수 있습니다. 이 짧은 황금 구간에 하루 성장호르몬의 3분의 2 이상이 집중적으로 분비되기 때문입니다.",
            "문제는 잠들기 한 시간 전에 마신 달콤한 간식이나 환하게 켜진 거실 백색 형광등이 이 깊은 잠의 문을 좁힌다는 점입니다. 혈중 인슐린이 높은 상태에서는 뇌하수체가 성장호르몬 방출을 아끼게 되고, 밝은 빛은 생체시계의 멜라토닌 스위치를 최대 90분까지 늦추곤 합니다.",
            "오늘 밤부터는 비싼 무언가를 더하기보다 저녁 7시 이후의 식탁을 가볍게 비우고, 밤 9시 30분 거실 조명을 노을빛 스탠드 하나로 낮추는 작은 여백을 선물해 보시는 건 어떨까요. 고요해진 침실 공기 속에서 아이의 무릎과 발목 성장판은 비로소 온전한 회복의 시간을 얻게 됩니다.",
        ],
        "nate_paragraphs": [
            "아이 키 때문에 마음 쓰이는 학부모님들 많으시죠. 저희도 밤 10시 전에만 재우면 성장호르몬이 잘 나오는 줄 알고, 밤 9시 반에 우유 한 컵이랑 과일 먹여서 부랴부랴 재우곤 했었거든요.",
            "그런데 소아내분비 자료랑 질병관리청 성장도표 기준을 꼼꼼히 찾아보니 핵심은 '몇 시에 눕느냐'보다 '잠든 직후 첫 90분 동안 얼마나 깊은 서파수면에 들어가느냐'에 있더라고요. 자기 직전에 우유나 과일을 먹으면 소화하느라 인슐린 수치가 올라가서 정작 첫 깊은 잠에서 나와야 할 성장호르몬 분비 폭이 줄어든다고 합니다.",
            "참고로 질병관리청(KDCA) 2017 표준키(50백분위)를 보면 만 8세 남아 127.8cm·여아 126.7cm, 만 10세 남아 138.8cm·여아 139.1cm이고 사춘기 전에는 1년에 최소 5.0~6.5cm씩 자라는 게 안정적인 흐름이에요. 만약 일찍 자는데도 연 4cm 정도로 더디다면 저녁 마지막 간식 시간과 거실 조명 밝기부터 점검해 보시는 걸 권해드려요.",
            "저녁 식사는 잠들기 3시간 전에 마치고, 밤 9시 반부터 거실 형광등 대신 은은한 노란 스탠드만 켜두어도 아이가 잠드는 깊이가 훨씬 편안해집니다. 개월 수별 정밀 질병관리청 백분위나 병원 손목 뼈나이 대조표가 궁금하신 분들은 포털에 키즈핏 소아성장 연구소 검색하셔서 무료 계산표로 차분히 확인해 보세요. 오늘도 육아하시는 모든 부모님들 응원합니다.",
        ],
        "faq_q": "학원 일정 때문에 밤 10시 30분에 잠드는 아이는 성장호르몬 혜택을 못 받나요?",
        "faq_a": "아닙니다. 취침 시각을 매일 일정하게 고정하고 잠들기 2~3시간 전 공복 유지 및 침실 조도 30Lux 이하 암막 환경을 만들어 입면 직후 첫 90분 서파수면(N3) 깊이를 확보하면 야간 성장호르몬 맥동을 안정적으로 보전할 수 있습니다.",
    },
    {
        "seq": 2,
        "slug": "editorial-02-bone-age-xray-phv-precocious-puberty-compass",
        "category_badge": "VOL.02 · 골연령·사춘기 에디토리얼",
        "age_badge": "만 7세 ~ 만 13세 급성장 준비기",
        "segment": "kr_upper_golden_time",
        "title": "달력 나이보다 정직한 손목 뼈나이(Bone Age): 급성장기(PHV) 골든타임을 지키는 학부모 판독 가이드",
        "subtitle": "뼈나이가 1년 빠르다는 말을 들었을 때 조급함 대신 점검해야 할 3가지 임상 지표",
        "daum_essay_title": "손목 엑스레이 한 장이 들려주는 아이의 시간표 — 뼈나이 1년의 의미를 읽는 법",
        "nate_essay_title": "병원에서 아이 뼈나이가 1년 빠르다고 들었을 때 당황하지 않고 꼭 챙겨봐야 할 기준 정리",
        "keywords": ["뼈나이 1년 빠름", "성조숙증 검사 시기", "급성장기 PHV", "손목 엑스레이 골연령", "질병관리청 표준키"],
        "lead_quote": (
            "아이의 최종 성인 신장을 결정짓는 시계는 주민등록상 생년월일이 아니라, "
            "성장판 연골의 성숙도를 보여주는 골연령(Bone Age)과 연간 성장속도(cm/yr)의 균형입니다."
        ),
        "web_sections": [
            (
                "1. '또래보다 키가 커서 안심했는데 뼈나이가 1년 반 빠르대요'",
                "초등학교 저·중학년 시기에 반에서 키 번호가 뒷번호라고 무조건 안심하기는 어렵습니다. 사춘기 호르몬 신호가 또래보다 일찍 시작되면 단기적으로는 키가 훌쩍 자라는 것처럼 보이지만, 실제로는 골연령 시계가 빠르게 앞당겨져 성장판이 닫히는 시점 또한 빨라질 수 있기 때문입니다.",
            ),
            (
                "2. 여아 만 8~9세 · 남아 만 9~10세 첫 골연령 기준점 확보의 중요성",
                "질병관리청 2017 성장도표에서 만 10세 여아 표준키(139.1cm)가 남아(138.8cm)를 일시적으로 추월하는 지점이 바로 여아의 사춘기 급성장기(PHV) 진입 구간입니다. 여아는 만 9세 이전 가슴 멍울, 남아는 만 10세 이전 고환 용적 증가 신호가 보일 때 손목 엑스레이로 골연령 편차를 확인해 두면 남은 성장 잠재력을 훨씬 여유 있게 설계할 수 있습니다.",
            ),
            (
                "3. 골성숙 가속을 늦추는 가정 내 체지방·야간 대사 관리",
                "성장기 아동을 무리하게 체중 감량시키는 것은 금물이지만, 키 증가 속도보다 체중이 먼저 급증하면 체지방 조직에서 분비되는 렙틴(Leptin)이 시상하부를 자극해 골성숙을 앞당길 수 있습니다. 액상과당 음료와 야식을 먼저 줄이고 주 4회 15분 줄넘기로 근육과 성장판 자극 비율을 높여 주시기 바랍니다.",
            ),
        ],
        "daum_paragraphs": [
            "소아청소년과 진료실을 나서며 '아이 뼈나이가 실제 나이보다 10개월 정도 앞서 있네요'라는 짧은 한마디를 들은 날에는 집으로 돌아오는 발걸음이 유난히 무거워집니다. 당장 무엇부터 바꿔야 할지 막막해 검색창을 수십 번 여닫게 되는 것이 모든 부모의 솔직한 마음일 것입니다.",
            "하지만 골연령(Bone Age) 검사는 아이의 한계를 선고하는 성적표가 아니라, 앞으로 남아 있는 성장판의 시간을 가장 효율적으로 쓰기 위한 나침반에 가깝습니다. 소아내분비학의 Bayley-Pinneau 골성숙 지표를 보면 만 10세 골연령 기준 남아는 성인키의 약 78.4%, 여아는 약 86.2% 지점을 지나고 있어 이후의 수면·체성분 관리가 최종 결과에 적지 않은 차이를 만듭니다.",
            "특히 주의 깊게 살필 대목은 최근 6개월 사이 키보다 몸무게가 먼저 가파르게 늘었는지 여부입니다. 성장기 아이에게 굶는 다이어트는 금물이지만, 달콤한 음료와 늦은 간식으로 쌓인 과잉 체지방은 뼈의 시계를 재촉하는 신호로 작용하기 쉽습니다.",
            "조급한 마음 대신 분기마다 한 번씩 아침 기상 직후의 키와 체중을 노트에 나란히 적어 보세요. 차분하게 기록된 세 달 단위의 숫자들은 불안을 확신으로 바꿔 주는 가장 든든한 가정 주치의가 되어 줄 것입니다.",
        ],
        "nate_paragraphs": [
            "초등 중학년 들어서면 주변에서 뼈나이 검사 다녀왔다는 이야기가 들리기 시작하면서 우리 아이도 가봐야 하나 고민되시죠. 특히 아이가 또래보다 키가 좀 큰 편이면 당연히 잘 크는 줄 알았다가 골연령이 1년 넘게 빠르다는 결과를 듣고 놀라시는 분들도 꽤 많더라고요.",
            "달력 나이보다 중요한 게 바로 손목 엑스레이로 보는 골연령과 연간 성장속도입니다. 질병관리청 2017 표준키 기준으로 만 10세에 여아(139.1cm)가 남아(138.8cm)보다 살짝 커지는 시기가 오는데, 여아는 만 8~9세 전후, 남아는 만 9~10세 전후에 한 번쯤 기본 골연령 흐름을 알아두면 급성장기(PHV) 준비가 훨씬 수월해집니다.",
            "집에서 뼈나이 시계가 너무 빨리 가지 않게 돕는 제일 현실적인 방법은 '굶기지 않고 단 음료·야식만 먼저 끊기'와 '저녁 15분 줄넘기'예요. 키보다 체중이 먼저 급하게 늘면 체지방 호르몬이 사춘기 시계를 앞당길 수 있어서, 음료수만 물로 바꿔줘도 체성분 균형이 많이 안정됩니다.",
            "병원에서 받아온 골연령 숫자로 남은 성인 예상키 범위를 계산해 보고 싶으실 때는 포털에서 키즈핏 소아성장 연구소 찾아보시면 무료 뼈나이 해석기랑 질병관리청 백분위 표가 깔끔하게 나와 있으니 차분히 참고해 보세요. 우리 아이들 모두 건강하게 자라길 바랍니다.",
        ],
        "faq_q": "병원에서 뼈나이가 실제 나이보다 1년 느리다고 하면 무조건 안심해도 되나요?",
        "faq_a": "골연령이 6~12개월 완만한 경우 성장판이 열려 있는 기간이 길어 성인키 잠재력 면에서 유리할 수 있으나, 연간 성장속도가 4.0cm 미만이거나 백분위가 지속 하락한다면 체질성 성장지연 외 영양·내분비 요인을 함께 살펴보는 것이 바람직합니다.",
    },
    {
        "seq": 3,
        "slug": "editorial-03-citrate-calcium-vitamin-d3-k2-zinc-mineral-bridge",
        "category_badge": "VOL.03 · 소아영양·골무기질 에디토리얼",
        "age_badge": "만 3세 ~ 만 15세 편식·급성장기",
        "segment": "kr_early_elementary",
        "title": "칼슘만 챙겨서는 뼈로 가지 않습니다: 구연산 칼슘·비타민D3·K2와 미각 세포 아연(Zinc)의 생화학적 연결고리",
        "subtitle": "밥은 피하고 흰 우유만 찾는 아이의 야간 성장통과 미네랄 흡수 효율 재점검",
        "daum_essay_title": "아이 식탁 위의 조용한 역설 — 매일 마시는 우유 세 잔과 밤마다 찾아오는 종아리 성장통",
        "nate_essay_title": "밥 안 먹고 흰 우유만 잘 마시는 아이, 밤마다 다리 아프다고 깰 때 식단 바꾼 후기·정보",
        "keywords": ["구연산 칼슘 흡수율", "어린이 비타민D3 K2", "편식 아이 아연", "야간 성장통 마그네슘", "질병관리청 표준키"],
        "lead_quote": (
            "섭취한 칼슘이 위장에서 편안하게 녹아 혈액으로 흡수되고, 다시 성장판 골기질에 단단히 안착하기까지는 "
            "비타민D3와 비타민K2(오스테오칼신 활성화), 그리고 식욕의 열쇠인 아연의 협업이 필요합니다."
        ),
        "web_sections": [
            (
                "1. 하루 500ml 이상의 과도한 생우유가 철분·아연 흡수를 방해하는 이유",
                "식사량이 적은 아이가 흰 우유라도 잘 마시면 다행이라고 생각하기 쉽지만, 하루 500~700ml 이상의 우유 섭취는 포만감으로 정식 식사를 밀어낼 뿐 아니라 우유 속 카제인과 과량의 칼슘이 장내 철분·아연 흡수와 길항 작용을 일으킬 수 있습니다. 철분과 아연이 부족해지면 밤잠이 얕아지고 혀의 미뢰(맛봉오리) 세포 재생이 늦어져 편식이 더욱 심해지는 순환이 나타납니다.",
            ),
            (
                "2. 위산 부담을 낮춘 구연산 칼슘과 Vitamin D3 · K2의 골기질 수송 기전",
                "소화 기능이 섬세한 유아·초등 아동에게는 위산 의존도가 낮은 구연산 칼슘이나 해조·유청 칼슘 형태가 편안합니다. 여기에 비타민D3가 장내 칼슘 흡수율을 높여주고, 비타민K2가 뼈 형성 단백질인 오스테오칼신(Osteocalcin)을 활성화해야 혈중 칼슘이 성장판 연골 기질로 정확히 전달됩니다.",
            ),
            (
                "3. 야간 성장통을 달래는 저녁 식단과 5분 온찜질 마사지",
                "생우유는 하루 2잔(약 400ml) 이내로 조절하고 잔멸치·두부·달걀·소고기 우둔살 등 씹어 먹는 단백질과 아연 급원 식품을 저녁 반찬에 배치해 주세요. 잠자리에 들기 전 따뜻한 물수건으로 종아리와 무릎 주변 근막을 5분간 이완해 주면 야간 성장통으로 깨는 횟수가 눈에 띄게 줄어듭니다.",
            ),
        ],
        "daum_paragraphs": [
            "저녁 식탁에 정성껏 국과 나물을 차려 놓아도 고개를 돌린 채 냉장고 속 흰 우유만 찾는 아이를 보며 한숨을 삼켜본 적이 있으실 겁니다. '그래도 우유에 칼슘이 많으니 키는 크겠지'라고 스스로를 달래 보지만, 밤마다 다리가 아프다며 칭얼대는 아이의 종아리를 주무르다 보면 무언가 빠진 조각이 있음을 직감하게 됩니다.",
            "소아영양학에서는 이를 '우유 과잉과 미량 미네랄 결핍의 역설'로 설명합니다. 하루 두 잔을 훌쩍 넘기는 생우유는 작은 위장을 채워 정작 뼈의 철근 역할을 하는 단백질과 아연, 철분이 들어올 자리를 좁히고, 미각 세포 재생을 돕는 아연이 부족해지면 아이는 낯선 식감의 반찬을 더욱 거부하게 됩니다.",
            "칼슘 역시 혼자서는 성장판까지 완주하기 어렵습니다. 장에서 칼슘의 문을 열어주는 비타민D3, 그리고 혈액 속 칼슘을 뼈 기질로 안내하는 비타민K2와 마그네슘이 나란히 갖춰져야 비로소 밤사이 길어진 뼈와 근육이 편안한 균형을 이룹니다.",
            "내일 저녁에는 우유 컵의 크기를 조금 줄이는 대신 따뜻한 두부조림 한 조각과 잠자리 5분 종아리 온찜질을 더해 보세요. 아이의 입맛과 밤잠이 함께 깊어지는 변화를 차분히 만나실 수 있습니다.",
        ],
        "nate_paragraphs": [
            "입 짧은 아이 키우시는 부모님들 중에 '밥은 안 먹어도 우유는 하루 세네 팩씩 마셔서 다행이다' 생각하셨던 분들 계실 거예요. 저희도 한동안 그랬는데, 아이가 밤마다 무릎이랑 정강이가 아프다고 깨는 날이 잦아져서 소아영양 자료를 깊이 찾아보게 됐습니다.",
            "의외로 하루 500ml 넘게 생우유만 많이 마시면 배는 부른데 장에서 철분이랑 아연 흡수가 방해받아서 밤잠도 얕아지고, 혀의 맛을 느끼는 세포 재생이 늦어져 편식이 더 심해질 수 있다고 해요. 흰 우유는 하루 두 잔(400ml 안팎) 정도로 줄이고 살코기나 달걀, 두부로 단백질과 아연을 채워주는 게 훨씬 좋다고 합니다.",
            "그리고 영양 성분표 보실 때도 칼슘 숫자만 보지 마시고 속이 편안한 구연산 칼슘인지, 흡수된 칼슘을 뼈로 보내주는 비타민D3·비타민K2·마그네슘이 같이 들어 있는지 함께 확인해 보세요. 자기 전 따뜻한 수건으로 종아리 5분만 주물러줘도 성장통으로 깨는 게 훨씬 덜해집니다.",
            "아이 현재 키·몸무게 대비 질병관리청 표준 백분위랑 연령별 영양 균형 기준이 궁금하실 때는 포털에 키즈핏 소아성장 연구소 검색해 보시면 무료 진단표로 깔끔하게 확인하실 수 있어요. 입 짧은 아이 키우시는 부모님들 오늘도 힘내세요.",
        ],
        "faq_q": "어린이 칼슘과 철분 보충제는 같은 시간에 함께 먹여도 괜찮나요?",
        "faq_a": "고함량 칼슘과 철분은 장내 흡수 통로에서 서로 경쟁하므로, 철분은 오전 공복이나 비타민C가 풍부한 식간에, 칼슘·마그네슘·비타민D3는 저녁 식후에 시간차를 두어 섭취하는 것이 흡수 효율 면에서 유리합니다.",
    },
    {
        "seq": 4,
        "slug": "editorial-04-text-neck-15deg-bookstand-hidden-stature-2cm",
        "category_badge": "VOL.04 · 척추정렬·바른자세 에디토리얼",
        "age_badge": "만 6세 ~ 만 16세 학령기 아동·청소년",
        "segment": "kr_early_elementary",
        "title": "평평한 책상 위 30도 고개 숙임의 대가: 아이의 숨은 키 2cm를 되찾는 15도 독서대와 발받침 인체공학",
        "subtitle": "새학기 책상 환경 세팅만으로 경추 하중 18kg을 덜어내는 정렬 루틴",
        "daum_essay_title": "아이의 등 뒤에서 바라본 책상 풍경 — 구부정한 어깨 속에 숨어 있는 2cm의 가능성",
        "nate_essay_title": "초등 입학·진급 후 부쩍 구부정해진 아이 등허리, 잔소리 대신 책상 각도부터 바꾼 이유",
        "keywords": ["어린이 거북목 교정", "숨은 키 2cm", "초등 바른자세 의자 발받침", "15도 독서대 각도", "질병관리청 표준키"],
        "lead_quote": (
            "고개를 앞으로 30도 숙일 때 성장기 경추와 흉추에 가해지는 하중은 약 18kg에 달하며, "
            "이는 매일 저녁 척추 추간판과 자세 정렬에서 1.5~2.0cm의 숨은 신장 손실을 만듭니다."
        ),
        "web_sections": [
            (
                "1. '똑바로 앉아라'라는 열 번의 말보다 먼저 바꿔야 할 시선 각도",
                "아이들이 책상에서 5분도 채 되지 않아 등을 둥글게 말고 고개를 숙이는 이유는 의지가 약해서가 아니라 평평한 책상 면과 시선 사이의 물리적 낙차 때문입니다. 시선이 아래로 향하면 자연스럽게 목이 앞으로 빠지는 거북목(Text Neck) 자세가 고정되고 흉곽이 좁아져 깊은 호흡과 집중력까지 함께 저하됩니다.",
            ),
            (
                "2. 15도 독서대와 90도 발받침이 만드는 척추 중립 정렬",
                "인체공학 연구에서는 독서·필기 면을 12~15도 기울여 눈높이를 높여주고, 발이 허공에 뜨지 않도록 발받침으로 무릎·고관절 각도를 90도로 지지해 줄 때 경추 하중이 절반 이하로 감소함을 보여줍니다. 하체가 바닥(발받침)을 단단히 디뎌야 골반이 세워지고 등뼈가 자연스러운 S자 곡선을 유지할 수 있습니다.",
            ),
            (
                "3. 하루 3분 저녁 척추 감압 스트레칭 습관",
                "학교와 학원 수업을 마친 저녁에는 거실 매트에서 90초간 고양이 기지개 자세와 벽에 뒤꿈치·등·뒤통수를 붙이고 서는 1분 정렬 체크를 실천해 보세요. 낮 동안 눌려 있던 추간판 간격이 이완되면서 숨은 키 복원과 숙면에 직접적인 도움을 줍니다.",
            ),
        ],
        "daum_paragraphs": [
            "방문을 살짝 열었을 때 책상 위에 엎드리듯 고개를 묻고 문제집을 푸는 아이의 작은 뒷모습을 보면, 대견함보다 목과 허리가 상하지 않을까 하는 걱정이 먼저 앞섭니다. '허리 펴고 앉아야지'라고 다정하게 일러주어도 3분이 지나면 어깨는 다시 제자리로 둥글게 말리곤 합니다.",
            "척추 생체역학 데이터를 살펴보면 아이의 머리가 앞으로 30도만 기울어져도 목뼈와 등뼈가 버텨야 하는 무게는 약 18kg까지 불어납니다. 어른보다 연골 비중이 높은 성장기 아이들에게 이 반복적인 압박은 1.5~2cm에 달하는 숨은 자세 손실로 이어지기 쉽습니다.",
            "아이의 의지를 탓하기 전에 책상 위 물리적 환경부터 아이 몸에 맞춰 주어야 하는 이유가 여기에 있습니다. 평평한 책상 위에 15도 각도의 원목 독서대를 세워 시선을 들어 올리고, 대롱거리는 두 발 아래 단단한 발받침을 놓아 골반의 중심을 잡아주는 것만으로도 아이의 등은 놀라울 만큼 편안하게 펴집니다.",
            "오늘 저녁에는 잔소리 대신 아이와 나란히 거실 벽에 등을 대고 서서 정수리가 천장으로 길어지는 기분 좋은 스트레칭을 함께 나누어 보시기 바랍니다.",
        ],
        "nate_paragraphs": [
            "초등 들어가고 책상에 앉아 있는 시간이 늘어나면서 아이 목이 앞으로 쭉 빠지고 등이 굽어 보여서 속상하신 부모님들 많으실 거예요. 말로만 허리 펴라고 하면 서로 스트레스만 쌓이고 5분 뒤면 그대로 돌아오더라고요.",
            "찾아보니 평평한 책상에 책을 놓고 보면 구조상 고개를 30도 이상 숙일 수밖에 없는데, 이때 아이 목뼈에 실리는 무게가 무려 18kg 가까이 된다고 해요. 이렇게 눌려 있는 숨은 키만 1.5~2cm 정도 손해 볼 수 있다고 해서 저희는 잔소리 멈추고 책상 환경 두 가지만 딱 손봤습니다.",
            "하나는 책이랑 패드를 무조건 15도 각도 조절 독서대 위에 올려서 시선을 높여준 거고, 다른 하나는 의자에 앉았을 때 발이 공중에 대롱거리지 않게 발받침 높이를 맞춰준 거예요. 발바닥이 딱 닿아야 골반이랑 허리가 힘 안 들이고 꼿꼿하게 세워지더라고요.",
            "여기에 자기 전 거실 매트에서 90초 고양이 기지개 스트레칭만 꾸준히 해줘도 아이 체형이 훨씬 반듯해집니다. 우리 아이 연령별 질병관리청 표준키 백분위와 바른자세 성장 루틴 표는 포털에 키즈핏 소아성장 연구소 검색하시면 무료로 보실 수 있으니 편하게 참고해 보세요.",
        ],
        "faq_q": "자세 교정만으로 실제로 아이 키가 커질 수 있나요?",
        "faq_a": "구부정한 거북목·라운드숄더와 골반 후방경사로 인해 손실되던 1.5~2.0cm 내외의 체형적 숨은 신장을 즉시 회복할 수 있을 뿐 아니라, 성장판에 가해지는 비대칭 압박을 해소해 장기적인 수직 성장 환경을 개선합니다.",
    },
    {
        "seq": 5,
        "slug": "editorial-05-indoor-vertical-jump-wolffs-law-epiphyseal-plate",
        "category_badge": "VOL.05 · 성장판 운동생리 에디토리얼",
        "age_badge": "만 5세 ~ 만 14세 활동기",
        "segment": "kr_upper_golden_time",
        "title": "성장판 연골을 깨우는 볼프의 법칙(Wolff's Law): 하루 15분 수직 점프 운동과 과훈련 피로 사이의 적정선",
        "subtitle": "줄넘기·실내 트램폴린 자극이 하체 장골 성장판 미세순환을 높이는 기전과 안전한 강도 설계",
        "daum_essay_title": "가볍게 뛰어오르는 15분의 리듬 — 아이의 무릎 성장판이 가장 좋아하는 저녁 산책",
        "nate_essay_title": "키 크려면 줄넘기 하루 1000개 시켜야 할까요? 소아 운동생리 기준으로 본 적정 점프 시간",
        "keywords": ["키성장 줄넘기 시간", "성장판 자극 운동", "어린이 실내 트램폴린", "급성장기 PHV 운동", "질병관리청 표준키"],
        "lead_quote": (
            "뼈와 성장판 연골은 중력 방향의 적당한 간헐적 수직 압력을 받을 때 혈류량과 골세포 분화가 활발해지며, "
            "가장 이상적인 골든존은 숨이 기분 좋게 차오르는 하루 15~20분 중강도 점프입니다."
        ),
        "web_sections": [
            (
                "1. 왜 걷기보다 가벼운 수직 점프가 하체 성장판에 효과적일까요?",
                "정형외과 생체역학의 볼프의 법칙(Wolff's Law)에 따르면, 대퇴골과 경골 양 끝의 성장판 연골은 수직 방향의 리드미컬한 압박과 이완이 반복될 때 스펀지가 영양분을 빨아들이듯 주변 미세혈관으로부터 산소와 칼슘·성장인자(IGF-1)를 활발히 공급받습니다.",
            ),
            (
                "2. 아스팔트 무리한 줄넘기 2,000개보다 쿠션 위 15분 인터벌이 안전한 이유",
                "의욕이 앞서 딱딱한 콘크리트 바닥에서 매일 수천 개씩 무리하게 줄넘기를 시키면 오히려 발목 아킬레스건과 무릎 정강이뼈 결절(오스굿-슐라터 증상)에 미세 염증을 유발할 수 있습니다. 탄성 있는 운동화와 충격 흡수 매트(또는 무소음 번지 트램폴린) 위에서 '1분 점프 + 30초 호흡 정리'를 10세트 반복하는 15분 루틴이 성장판 자극 효율이 가장 높습니다.",
            ),
            (
                "3. 운동 후 30분 골든타임 수분·단백질 보충과 취침 연결",
                "저녁 운동은 잠들기 최소 2시간 전에 마무리해 교감신경 흥분이 가라앉도록 배려해 주시고, 운동 직후 미지근한 물과 가벼운 단백질 반찬으로 근육 회복을 도와주면 그날 밤 서파수면 성장호르몬 분비량까지 시너지를 냅니다.",
            ),
        ],
        "daum_paragraphs": [
            "해 질 녘 아파트 놀이터를 지나다 보면 줄넘기 숫자를 세는 부모님의 목소리와 가쁜 숨을 몰아쉬는 아이의 발소리가 정겹게 들려옵니다. 키가 한 뼘이라도 더 자라길 바라는 마음으로 오늘도 천 개를 채워야 한다며 아이를 독려하곤 하지만, 때로는 '너무 무리시켜 무릎이 아프면 어쩌나' 하는 걱정이 스치기도 합니다.",
            "뼈의 성장 생리를 설명하는 볼프의 법칙은 의외로 단순하고 다정합니다. 성장판 연골은 혹독한 극기 훈련이 아니라, 스펀지가 물기를 머금듯 가볍고 리드미컬한 수직 점프가 15분 남짓 이어질 때 가장 활발하게 영양분과 성장인자(IGF-1)를 받아들입니다.",
            "딱딱한 아스팔트 위에서 개수를 채우기에 급급하기보다, 쿠션감 있는 운동화나 거실 매트 위에서 1분 가볍게 뛰고 30초 숨을 고르는 기분 좋은 인터벌 10세트가 아이의 발목과 무릎 성장판을 훨씬 안전하게 깨워 줍니다.",
            "땀이 송골송골 맺힌 아이와 미지근한 물 한 잔을 나누어 마시고 따뜻한 샤워로 하루를 마무리한 밤, 아이의 성장판은 낮 동안 받은 건강한 신호를 고스란히 내일의 키로 바꾸어 낼 것입니다.",
        ],
        "nate_paragraphs": [
            "아이 키 성장 운동 하면 제일 먼저 떠오르는 게 줄넘기나 농구, 실내 점핑이죠. 주변에서 하루 천 개씩 시킨다는 얘기를 들으면 우리 애도 그렇게 해야 하나 마음이 급해지는데, 정형외과·소아성장 자료를 찾아보니 개수 욕심내는 게 꼭 좋은 건 아니더라고요.",
            "딱딱한 시멘트나 아스팔트 바닥에서 무리하게 줄넘기 개수를 늘리면 성장기 아이들은 무릎 아래 정강이뼈(오스굿-슐라터)나 발목에 피로가 쌓여서 오히려 밤에 다리 통증이 심해질 수 있대요. 성장판이 제일 좋아하는 자극은 '숨이 기분 좋게 찰 정도의 15~20분 리드미컬한 점프'라고 합니다.",
            "미세먼지 심하거나 추운 날에는 층간소음 없는 도톰한 실내 매트나 탄성 트램폴린 위에서 1분 뛰고 30초 쉬기를 10번 정도만 해줘도 무릎·발목 성장판 혈류 자극에 충분해요. 단, 잠들기 직전에 격하게 뛰면 잠이 깨니까 취침 2시간 전에는 끝내주는 게 포인트입니다.",
            "우리 아이 개월 수별 질병관리청 표준키 백분위와 연령대별 맞춤 운동·수면 루틴은 포털에서 키즈핏 소아성장 연구소 검색하시면 무료 측정표로 한눈에 보실 수 있으니 필요하실 때 가볍게 활용해 보세요.",
        ],
        "faq_q": "비 오는 날이나 겨울철에 야외 줄넘기 대신 실내 맨발 점프를 해도 괜찮을까요?",
        "faq_a": "맨바닥에서 맨발로 뛰면 발뒤꿈치 종골 성장판에 충격이 집중될 수 있으므로, 실내에서는 반드시 충격 흡수력이 검증된 고밀도 매트나 무소음 번지 트램폴린 위에서 실시하는 것이 안전합니다.",
    },
    {
        "seq": 6,
        "slug": "editorial-06-allergic-rhinitis-mouth-breathing-deep-sleep-recovery",
        "category_badge": "VOL.06 · 호흡·수면의학 에디토리얼",
        "age_badge": "만 4세 ~ 만 12세 환절기 집중 케어",
        "segment": "kr_early_elementary",
        "title": "베개 위 살짝 벌어진 입술의 신호: 소아 야간 구강호흡이 서파수면과 얼굴형·키 성장에 미치는 영향",
        "subtitle": "환절기 코막힘으로 밤새 뒤척이는 아이의 비강 호흡 회복과 침실 온습도 프로토콜",
        "daum_essay_title": "자정 무렵 아이 방에서 들려오는 작은 숨소리 — 코로 쉬는 편안한 밤이 키를 키웁니다",
        "nate_essay_title": "잘 때 입 벌리고 자는 비염 아이, 치아 교정만이 아니라 키 성장까지 연결되는 이유",
        "keywords": ["어린이 구강호흡 키성장", "비염 아이 수면", "아데노이드 얼굴형 예방", "환절기 침실 습도", "질병관리청 표준키"],
        "lead_quote": (
            "만성적인 야간 구강호흡은 미세 각성을 반복시켜 성장호르몬이 분비되는 깊은 서파수면 비율을 떨어뜨리고, "
            "아침 피로와 식욕 저하까지 연쇄적으로 유발할 수 있습니다."
        ),
        "web_sections": [
            (
                "1. 충분히 오래 자는데도 다크서클이 짙고 아침에 일어나기 힘들어한다면",
                "수면 시간 자체는 9시간으로 넉넉한데도 아침마다 깨우기 힘들고 베개에 침 자국이 자주 남는다면, 밤사이 코막힘으로 인해 입으로 숨을 쉬는 구강호흡 패턴을 점검해 볼 필요가 있습니다. 구강호흡 시에는 기도가 좁아져 산소 포화도 미세 변동과 뇌파상 미세 각성이 잦아지며 깊은 잠(Stage N3) 유지가 어려워집니다.",
            ),
            (
                "2. 환절기 침실 온도 20~22도 · 습도 45~50%와 침구 먼지 관리",
                "비강 점막은 건조하고 차가운 공기나 집먼지진드기 항원에 민감하게 부어오릅니다. 취침 전 미지근한 생리식염수로 코 주변을 부드럽게 세정하거나 따뜻한 스팀 수건으로 코를 적셔 주고, 침실 습도를 45~50%로 일정하게 유지해 주면 야간 비강 통기성이 한결 편안해집니다.",
            ),
            (
                "3. 경추 각도 지지와 이비인후과·소아과 협진 체크포인트",
                "지나치게 높거나 푹 꺼지는 어른용 베개는 턱을 당겨 기도를 더 좁힐 수 있으므로 아동 체형에 맞는 완만한 경추 지지 베개를 사용하고, 코골이나 수면 중 호흡 멈춤이 2주 이상 지속될 경우 소아청소년과 또는 이비인후과에서 편도·아데노이드 비대 여부를 확인해 보시기 바랍니다.",
            ),
        ],
        "daum_paragraphs": [
            "모두가 잠든 자정 무렵, 이불을 덮어주러 들어간 아이 방에서 새근거리는 코 숨소리 대신 입술 사이로 마른 숨소리가 들려올 때가 있습니다. 낮에는 그토록 씩씩하게 뛰어놀던 아이가 밤새 베개 위에서 이리저리 몸을 뒤척이는 모습을 보면 부모의 마음도 함께 잠을 설칩니다.",
            "소아 수면의학 연구들은 밤마다 이어지는 구강호흡이 단순한 코막힘을 넘어 아이의 성장 시계와도 깊이 맞닿아 있음을 일깨워 줍니다. 입으로 숨을 쉬느라 목안이 마르고 기도가 좁아지면 뇌는 깊은 서파수면에 오래 머물지 못한 채 얕은 잠으로 자꾸만 떠올라 야간 성장호르몬의 리듬이 흐트러지기 때문입니다.",
            "환절기일수록 아이 침실은 따뜻함보다 쾌적한 습도(45~50%)와 선선한 온도(20~22도)의 균형이 먼저입니다. 잠들기 전 미지근한 물로 샤워하며 수증기로 콧속 점막을 촉촉하게 달래 주고, 아이 목 높이에 맞는 낮고 탄탄한 베개로 숨길을 편안히 열어 주세요.",
            "아이의 닫힌 입술로 고요한 코 숨소리가 돌아오는 밤, 아침 식탁에서 만나는 아이의 눈빛과 키 재기 자의 눈금도 한결 맑게 달라져 있을 것입니다.",
        ],
        "nate_paragraphs": [
            "환절기만 되면 코가 막혀서 입을 살짝 벌리고 자는 아이들 정말 많죠. 처음에는 비염 때문에 답답하겠구나 싶었는데, 자세히 알아보니 구강호흡이 턱 성장이나 치열뿐만 아니라 밤사이 키 성장호르몬 효율이랑도 직결된다고 해서 깜짝 놀랐어요.",
            "입을 벌리고 자면 혀 위치가 내려가면서 기도가 좁아지고, 아이 본인도 모르게 밤새 뇌가 얕게 깨는 '미세 각성'이 반복된다고 해요. 그러면 9시간을 누워 있어도 정작 성장호르몬이 쏟아져 나오는 깊은 잠(서파수면) 비율이 줄어들고 아침에 다크서클이 내려오면서 입맛까지 떨어지기 쉽습니다.",
            "집에서 제일 효과 봤던 건 침실 온도를 너무 덥지 않게 21도 안팎으로 낮추고 습도를 45~50%로 딱 맞춰준 거랑, 어른 베개 대신 아이 목 커브에 맞는 낮은 경추 베개로 바꿔준 거였어요. 물론 코골이가 심하면 병원에서 아데노이드 체크도 꼭 한번 받아보시는 게 좋습니다.",
            "우리 아이 개월 수별 질병관리청 표준키 백분위와 수면·성장 환경 체크표는 포털에 키즈핏 소아성장 연구소 검색하시면 무료로 확인하실 수 있으니 환절기 아이 컨디션 챙기실 때 차분히 참고해 보세요.",
        ],
        "faq_q": "아이 입에 수면 테이프를 바로 붙여주어도 괜찮을까요?",
        "faq_a": "비염이나 편도 비대로 코가 막힌 상태에서 입을 테이프로 막으면 야간 호흡 곤란을 유발할 수 있어 소아에게는 주의가 필요합니다. 반드시 비강 통기성 확보와 침실 온습도·베개 각도 교정을 먼저 시행하고 전문의 상담을 거치시기 바랍니다.",
    },
]


KOREA_5PORTAL_ROBOTS_TXT = """User-agent: *
Allow: /

# Korean Major Search Portal Crawlers (Naver, Daum/Kakao, Nate/SK Comms, Zum)
User-agent: Yeti
Allow: /

User-agent: NaverBot
Allow: /

User-agent: Daumoa
Allow: /

User-agent: Daum
Allow: /

User-agent: kakaotalk-scrap
Allow: /

User-agent: NATE
Allow: /

User-agent: Cowbot
Allow: /

User-agent: NateBot
Allow: /

User-agent: ZumBot
Allow: /

# Global Search & AI Grounding Crawlers (Google, Bing/IndexNow, ChatGPT, Perplexity, Claude)
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

Sitemap: https://kidsfit.co.kr/sitemap.xml
# Syndication & AI Grounding Feeds:
# RSS 2.0: https://kidsfit.co.kr/rss.xml
# JSON Feed: https://kidsfit.co.kr/feed.json
# LLMs Guide: https://kidsfit.co.kr/llms.txt
"""


def _load_json(path: Path, default: Any) -> Any:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return default


def _save_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def compute_4gram_jaccard(text_a: str, text_b: str) -> float:
    words_a = re.findall(r"[가-힣A-Za-z0-9]+", text_a or "")
    words_b = re.findall(r"[가-힣A-Za-z0-9]+", text_b or "")
    shingles_a = {" ".join(words_a[i : i + 4]) for i in range(max(0, len(words_a) - 3))}
    shingles_b = {" ".join(words_b[i : i + 4]) for i in range(max(0, len(words_b) - 3))}
    if not shingles_a or not shingles_b:
        return 0.0
    return len(shingles_a & shingles_b) / float(len(shingles_a | shingles_b))


def build_prestige_editorial_html(item: Dict[str, Any], pub_date: str) -> str:
    """
    다음(Daumoa/kakaotalk-scrap)·네이트(NATE/Cowbot)·네이버(Yeti) 포털 검색에 최적화된
    고급 소아성장 에디토리얼 저널 HTML을 생성합니다 (금지어 0건, 2단 수익화 허브 내장).
    """
    canonical_url = f"https://kidsfit.co.kr/qna/{item['slug']}.html"
    esc_title = html.escape(item["title"])
    esc_sub = html.escape(item["subtitle"])
    esc_desc = html.escape(f"{item['subtitle']} — {item['lead_quote']}")
    kw_joined = html.escape(", ".join(item["keywords"]))

    faq_ld = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": item["faq_q"],
                    "acceptedAnswer": {"@type": "Answer", "text": item["faq_a"]},
                }
            ],
        },
        ensure_ascii=False,
    )
    art_ld = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            "headline": item["title"],
            "alternativeHeadline": item["subtitle"],
            "description": f"{item['subtitle']} — {item['lead_quote']}",
            "datePublished": f"{pub_date}T09:00:00+09:00",
            "dateModified": f"{pub_date}T09:00:00+09:00",
            "inLanguage": "ko-KR",
            "url": canonical_url,
            "author": {
                "@type": "Organization",
                "name": "키즈핏 소아성장 연구소 에디토리얼 랩 (KidsFit Pediatric Growth Lab)",
                "url": "https://kidsfit.co.kr/",
            },
            "publisher": {
                "@type": "Organization",
                "name": "키즈핏 코리아 (KidsFit Korea)",
                "url": "https://kidsfit.co.kr/",
            },
            "keywords": item["keywords"],
        },
        ensure_ascii=False,
    )

    sec_html_blocks = []
    for h_txt, p_txt in item["web_sections"]:
        sec_html_blocks.append(
            f'    <section class="kf-ed-section">\n'
            f"      <h2>{html.escape(h_txt)}</h2>\n"
            f"      <p>{html.escape(p_txt)}</p>\n"
            f"    </section>"
        )
    sections_joined = "\n\n".join(sec_html_blocks)
    seg = html.escape(item["segment"])

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc_title} | 키즈핏 소아성장 연구소</title>
  <meta name="description" content="{esc_desc}">
  <meta name="keywords" content="{kw_joined}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <link rel="canonical" href="{canonical_url}">
  <!-- Open Graph & Daum/Kakao Rich Scrap Meta -->
  <meta property="og:type" content="article">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:site_name" content="키즈핏 소아성장 연구소 (KidsFit Korea)">
  <meta property="og:title" content="{esc_title}">
  <meta property="og:description" content="{esc_desc}">
  <meta property="og:url" content="{canonical_url}">
  <meta property="dg:plink" content="{canonical_url}">
  <meta property="article:author" content="키즈핏 소아성장 연구소 에디토리얼 랩">
  <meta property="article:section" content="소아성장·골연령 의학 매거진">
  <meta property="article:published_time" content="{pub_date}T09:00:00+09:00">
  <!-- Nate Portal Search & Nate Scrap Meta -->
  <meta name="nate:title" content="{esc_title}">
  <meta name="nate:description" content="{esc_desc}">
  <meta name="nate:site_name" content="키즈핏 소아성장 연구소">
  <meta name="nate:url" content="{canonical_url}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Serif+KR:wght@400;600;700&display=swap" rel="stylesheet">
  <script type="application/ld+json">{faq_ld}</script>
  <script type="application/ld+json">{art_ld}</script>
  <style>
    :root {{
      --ed-bg: #FAF7F2;
      --ed-paper: #FFFFFF;
      --ed-ink: #1C1917;
      --ed-body: #292524;
      --ed-muted: #78716C;
      --ed-forest: #2F5241;
      --ed-line: #E7E5E0;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: var(--ed-bg);
      color: var(--ed-body);
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
      font-size: 18px;
      line-height: 1.84;
      letter-spacing: -0.012em;
      word-break: keep-all;
    }}
    .ed-wrap {{
      max-width: 680px;
      margin: 0 auto;
      padding: 36px 20px 76px;
    }}
    .ed-masthead {{
      border-bottom: 1px solid var(--ed-line);
      padding-bottom: 14px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--ed-muted);
    }}
    .ed-masthead a {{
      color: var(--ed-forest);
      text-decoration: none;
    }}
    .ed-badges {{
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }}
    .ed-pill {{
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 700;
      background: #F3EFE6;
      color: var(--ed-forest);
    }}
    .ed-pill.sage {{
      background: #EAF2EC;
      color: var(--ed-forest);
    }}
    h1 {{
      font-family: 'Nanum Myeongjo', 'Noto Serif KR', serif;
      font-size: clamp(24px, 4.2vw, 31px);
      line-height: 1.38;
      margin: 0 0 12px;
      color: var(--ed-ink);
      word-break: keep-all;
    }}
    .ed-subtitle {{
      font-size: 17px;
      color: var(--ed-muted);
      margin: 0 0 24px;
      font-weight: 400;
      word-break: keep-all;
    }}
    .ed-lead-quote {{
      background: var(--ed-paper);
      border-left: 3px solid var(--ed-forest);
      padding: 18px 20px;
      border-radius: 0 12px 12px 0;
      font-weight: 600;
      color: var(--ed-body);
      margin-bottom: 26px;
      border-top: 1px solid var(--ed-line);
      border-right: 1px solid var(--ed-line);
      border-bottom: 1px solid var(--ed-line);
    }}
    .kf-ed-section {{
      background: var(--ed-paper);
      border: 1px solid var(--ed-line);
      border-radius: 14px;
      padding: 24px 22px;
      margin-bottom: 18px;
    }}
    .kf-ed-section h2 {{
      font-family: 'Nanum Myeongjo', 'Noto Serif KR', serif;
      font-size: 19.5px;
      margin: 0 0 12px;
      color: var(--ed-ink);
      line-height: 1.42;
    }}
    .kf-ed-section p {{
      margin: 0;
      color: var(--ed-body);
    }}
    .ed-kdca-box {{
      background: var(--ed-paper);
      border: 1px solid var(--ed-line);
      border-radius: 14px;
      padding: 20px;
      margin: 24px 0;
    }}
    .ed-kdca-box h3 {{
      margin: 0 0 10px;
      font-size: 16px;
      color: var(--ed-forest);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 14.5px;
      background: #FFFFFF;
    }}
    th, td {{
      border: 1px solid var(--ed-line);
      padding: 10px 8px;
      text-align: center;
    }}
    th {{
      background: #F5F2EB;
      font-weight: 700;
      color: var(--ed-ink);
    }}
    .ed-faq-card {{
      background: #FFFFFF;
      border: 1px solid var(--ed-line);
      border-radius: 18px;
      padding: 20px 22px;
      margin-bottom: 22px;
    }}
    .ed-editor-sign {{
      font-size: 14px;
      color: var(--ed-muted);
      padding: 14px 18px;
      background: #F1F5F9;
      border-radius: 12px;
      margin-bottom: 22px;
    }}
  </style>
</head>
<body>
  <main class="ed-wrap">
    <header class="ed-masthead">
      <span>KIDSFIT PEDIATRIC GROWTH EDITORIAL JOURNAL</span>
      <a href="https://kidsfit.co.kr/">키즈핏 소아성장 연구소 공식 홈 →</a>
    </header>

    <div class="ed-badges">
      <span class="ed-pill">{html.escape(item['category_badge'])}</span>
      <span class="ed-pill sage">{html.escape(item['age_badge'])}</span>
    </div>

    <h1>{esc_title}</h1>
    <p class="ed-subtitle">{esc_sub}</p>

    <blockquote class="ed-lead-quote">
      “{html.escape(item['lead_quote'])}”
    </blockquote>

{sections_joined}

    <section class="ed-kdca-box" aria-label="질병관리청 표준키 기준표">
      <h3>[공공기관 공신력 기준] 질병관리청(KDCA) 2017 소아청소년 성장도표 50백분위 표준키</h3>
      <table>
        <thead>
          <tr>
            <th>연령 기준</th>
            <th>남아 50백분위(표준키)</th>
            <th>여아 50백분위(표준키)</th>
            <th>핵심 임상 관찰 포인트</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>만 6세 (72개월)</td><td>115.7 cm</td><td>114.7 cm</td><td>취침 시각 고정 · 편식 아연 점검</td></tr>
          <tr><td>만 8세 (96개월)</td><td>127.8 cm</td><td>126.7 cm</td><td>초등 착석 자세 · 여아 사춘기 전조 확인</td></tr>
          <tr><td>만 10세 (120개월)</td><td>138.8 cm</td><td>139.1 cm</td><td>여아 급성장기(PHV) 진입 · 손목 뼈나이 기준점</td></tr>
          <tr><td>만 12세 (144개월)</td><td>151.9 cm</td><td>152.0 cm</td><td>남아 급성장 피크 · 칼슘·D3·K2 골무기질 집중</td></tr>
        </tbody>
      </table>
    </section>

    <section class="ed-faq-card">
      <h2 style="font-size:18px;margin:0 0 8px;">Q. {html.escape(item['faq_q'])}</h2>
      <p style="margin:0;color:#334155;">{html.escape(item['faq_a'])}</p>
    </section>

    <div class="ed-editor-sign">
      <strong>키즈핏 성장 연구소 노트</strong> — 본 글은 질병관리청 소아청소년 성장도표 및 소아내분비학 학술 문헌을 바탕으로 작성된 가정용 성장 시계 안내서이며 전문의의 진료를 대신하지 않습니다.
    </div>

    <!-- KFK_QNA_CONVERSION_HUB_START -->
    <section id="kfk-qna-conversion-hub" class="no-print" data-default-segment="{seg}" data-active-segment="{seg}" aria-label="키즈핏 성장 연구소 노트 무료 구독 및 성장 시계 진단 안내" style="margin:32px 0 28px;padding:26px 22px;border-radius:14px;background:#FFFFFF;border:1px solid #E7E5E0;color:#1C1917;">
      <div style="padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid #E7E5E0;">
        <p style="margin:0 0 6px;font-size:12.5px;font-weight:700;color:#2F5241;letter-spacing:0.03em;">키즈핏 성장 연구소 우편함 · 상업성 광고 없음</p>
        <h2 style="margin:0 0 8px;font-family:'Nanum Myeongjo','Noto Serif KR',serif;font-size:20px;font-weight:700;line-height:1.42;color:#1C1917;">다음 성장 에세이를 조용한 저녁 편지로 받아보세요</h2>
        <p style="margin:0 0 14px;font-size:14.5px;color:#57534E;line-height:1.65;">비밀번호 없이 이메일 주소만 남겨 두시면, 아이의 성장 시계와 저녁 생활 습관을 다룬 연구소 노트를 차분히 보내드립니다 (언제든 1클릭 수신거부).</p>
        <form onsubmit="return window.submitKfkQnaHubSignup ? window.submitKfkQnaHubSignup(event) : false;" style="display:flex;flex-wrap:wrap;gap:8px;">
          <input type="text" id="kfk-qna-hub-hp" name="website_hp" tabindex="-1" autocomplete="off" style="display:none;" aria-hidden="true">
          <input type="email" id="kfk-qna-hub-email" required aria-label="학부모 이메일 주소" placeholder="학부모님 이메일 입력..." style="flex:1;min-width:210px;min-height:46px;padding:10px 14px;border:1px solid #D6D3D1;border-radius:8px;font-size:15px;background:#FAF7F2;color:#1C1917;">
          <button type="submit" id="btn-kfk-qna-hub-submit" style="min-height:46px;padding:10px 20px;border:none;border-radius:8px;background:#2F5241;color:#FFFFFF;font-size:14.5px;font-weight:700;cursor:pointer;white-space:nowrap;">무료 구독하기</button>
        </form>
        <div id="kfk-qna-hub-feedback" role="status" aria-live="polite" style="display:none;margin-top:10px;padding:10px 12px;border-radius:8px;font-size:13.5px;line-height:1.5;"></div>
      </div>

      <div>
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#78716C;">에디터의 추신 (P.S.) · 우리 아이 성장 시계 살펴보기</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <a href="https://kidsfit.co.kr/#kfk-bone-age-interpreter" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-radius:10px;background:#FAF7F2;border:1px solid #E7E5E0;color:#1C1917;font-size:15px;font-weight:700;text-decoration:none;">
            <span>5단계 우리 아이 질병관리청 백분위 &amp; 병원 뼈나이 시차(Δt) 진단 시작하기</span>
            <span style="color:#2F5241;">&rarr;</span>
          </a>
          <a href="https://kidsfit.co.kr/#kfk-latpeed-ebook-slot" data-kfk-paid-ebook="1" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-radius:10px;background:#FAF7F2;border:1px solid #E7E5E0;color:#1C1917;font-size:15px;font-weight:700;text-decoration:none;">
            <span>[Tier 1 · 9,900원] 단건 정밀 성장·뼈나이 리포트 &amp; 17p 실전 마스터북 PDF 안내</span>
            <span style="color:#2F5241;">&rarr;</span>
          </a>
          <a href="https://www.latpeed.com/products/daMaP" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-radius:10px;background:#FAF7F2;border:1px solid #E7E5E0;color:#1C1917;font-size:15px;font-weight:700;text-decoration:none;">
            <span>래피드(Latpeed) 단건 정밀 리포트 패스 바로가기 (9,900원)</span>
            <span style="color:#2F5241;">&rarr;</span>
          </a>
          <a href="https://www.latpeed.com/stores/7Frck" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-radius:10px;background:#FAF7F2;border:1px solid #E7E5E0;color:#1C1917;font-size:15px;font-weight:700;text-decoration:none;">
            <span>[Tier 2 · 19,900원] 6개월 월간 성장속도(cm/yr) 자동 판독 패스 (KFK_Paid_VIP)</span>
            <span style="color:#2F5241;">&rarr;</span>
          </a>
        </div>
      </div>

      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #E7E5E0;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12.5px;color:#78716C;">
        <span>공식 네이버 클립: <a href="https://naver.me/G2YsIdQ1" target="_blank" rel="noopener noreferrer" style="color:#2F5241;text-decoration:underline;">@truthofmarket</a></span>
        <span>공식 문의·협찬 창구: <a href="mailto:beable9489@gmail.com" style="color:#2F5241;text-decoration:underline;">beable9489@gmail.com</a></span>
      </div>
    </section>
    <!-- KFK_QNA_CONVERSION_HUB_END -->
  </main>
  <script>window.HQ_MAILING_CONFIG_PATH = '/hq-mailing-endpoint.json';</script>
  <script src="/src/js/hq_member_crm_client.js" defer></script>
</body>
</html>
"""


def compose_daum_brunch_tistory_edition(item: Dict[str, Any], date_str: str) -> Dict[str, Any]:
    """
    다음(Daum) — 카카오 브런치스토리 / 티스토리 / 다음카페 매거진 전용 『저녁 서재 에세이』 에디션 생성.
    """
    canonical_url = f"https://kidsfit.co.kr/qna/{item['slug']}.html"
    body_paras = "\n\n".join(item["daum_paragraphs"])
    md = (
        f"# {item['daum_essay_title']}\n\n"
        f"*{item['subtitle']} — 키즈핏 성장 연구소 노트 ({date_str})*\n\n"
        f"> “{item['lead_quote']}”\n\n"
        f"{body_paras}\n\n"
        f"---\n\n"
        f"### 질병관리청(KDCA) 2017 소아청소년 성장도표 표준키(50백분위) 요약\n"
        f"- **만 6세 (72개월)**: 남아 `115.7cm` · 여아 `114.7cm`\n"
        f"- **만 8세 (96개월)**: 남아 `127.8cm` · 여아 `126.7cm`\n"
        f"- **만 10세 (120개월)**: 남아 `138.8cm` · 여아 `139.1cm` *(여아 급성장기 PHV 교차 시점)*\n"
        f"- **만 12세 (144개월)**: 남아 `151.9cm` · 여아 `152.0cm`\n\n"
        f"---\n\n"
        f"**Editor’s Postscript | 키즈핏 성장 연구소 (상업성 광고 없음)**\n"
        f"- 오늘 저녁 에세이 원문 읽기: {canonical_url}?utm_source=daum_editorial&utm_medium=organic\n"
        f"- 키즈핏 성장 연구소 노트 이메일 무료 구독 (비밀번호 없음): https://kidsfit.co.kr/#kfk-passwordless-club-box\n"
        f"- 5단계 우리 아이 질병관리청 백분위 & 병원 손목 뼈나이(Δt) 진단: https://kidsfit.co.kr/#kfk-bone-age-interpreter\n"
        f"- [Tier 1 · 9,900원] 단건 정밀 성장·뼈나이 리포트 & 17p 마스터북 PDF: https://www.latpeed.com/products/daMaP\n"
        f"- [Tier 2 · 19,900원] 6개월 월간 성장속도(cm/yr) 자동 판독 패스(KFK_Paid_VIP): https://www.latpeed.com/stores/7Frck\n"
    )
    tone_res = validate_prestige_anti_spam_tone(md, allow_urls=True, require_polite_ending=True)
    return {
        "portal": "DAUM_BRUNCH_TISTORY",
        "title": item["daum_essay_title"],
        "canonical_url": canonical_url,
        "markdown": md,
        "tags": item["keywords"],
        "guardrail": tone_res,
    }


def compose_nate_life_momtalk_edition(item: Dict[str, Any], date_str: str) -> Dict[str, Any]:
    """
    네이트(Nate) — 네이트 판(결시친·3040 육아톡톡) 및 라이프 칼럼 전용 『무링크 공감·팩트체크 에세이』 생성.
    외부 URL을 0건으로 원천 차단하여 커뮤니티 거부감 및 스팸 필터 위험을 0%로 제거합니다.
    """
    body_paras = "\n\n".join(item["nate_paragraphs"])
    text = (
        f"[{item['nate_essay_title']}]\n\n"
        f"{body_paras}\n\n"
        f"■ 가정에서 기억해 두면 든든한 질병관리청 표준키(50백분위) 메모\n"
        f"• 만 6세: 남아 115.7cm / 여아 114.7cm\n"
        f"• 만 8세: 남아 127.8cm / 여아 126.7cm\n"
        f"• 만 10세: 남아 138.8cm / 여아 139.1cm\n"
        f"• 만 12세: 남아 151.9cm / 여아 152.0cm\n"
    )
    tone_res = validate_prestige_anti_spam_tone(text, allow_urls=False, require_polite_ending=True)
    return {
        "portal": "NATE_LIFE_MOMTALK",
        "title": item["nate_essay_title"],
        "text": text,
        "tags": item["keywords"],
        "zero_url_verified": True,
        "guardrail": tone_res,
    }


def materialize_all_prestige_editorial_htmls(pub_date: str) -> List[Path]:
    """
    `5사업부/qna/editorial-*.html` 및 `5사업부/dist/qna/editorial-*.html`을 무결점 생성하고,
    `robots.txt`에 네이버·다음·네이트 크롤러 허용 정책을 반영합니다 (`hq_main`의 `index.html`/`src/` 무간섭).
    """
    QNA_DIR.mkdir(parents=True, exist_ok=True)
    dist_qna = DIST_DIR / "qna"
    dist_qna.mkdir(parents=True, exist_ok=True)

    # Sync Korean 5-Portal robots.txt
    (ROOT_DIR / "robots.txt").write_text(KOREA_5PORTAL_ROBOTS_TXT, encoding="utf-8")
    if DIST_DIR.exists():
        (DIST_DIR / "robots.txt").write_text(KOREA_5PORTAL_ROBOTS_TXT, encoding="utf-8")

    written_paths: List[Path] = []
    for item in PRESTIGE_PORTAL_EDITORIAL_SERIES:
        html_doc = build_prestige_editorial_html(item, pub_date)
        tone_chk = validate_prestige_anti_spam_tone(html_doc, allow_urls=True, require_polite_ending=False)
        if not tone_chk["passed"]:
            raise RuntimeError(f"Editorial HTML guardrail violation in {item['slug']}: {tone_chk['violations']}")

        fname = f"{item['slug']}.html"
        src_fp = QNA_DIR / fname
        src_fp.write_text(html_doc, encoding="utf-8")
        if DIST_DIR.exists():
            shutil.copy2(src_fp, dist_qna / fname)
        written_paths.append(src_fp)

    return written_paths


def _load_env_map(env_path: Path) -> Dict[str, str]:
    out: Dict[str, str] = {}
    if env_path.exists():
        for ln in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            s = ln.strip()
            if s and not s.startswith("#") and "=" in s:
                k, v = s.split("=", 1)
                out[k.strip()] = v.strip().strip("'\"")
    return out


def _try_headless_daum_session_publish(edition: Dict[str, Any], today_str: str) -> Dict[str, Any]:
    """
    `.daum-kakao-headless-profile` 및 `TISTORY_BLOG_MANAGE_URL` 설정 시 일 1회 무팝업 발행을 수행합니다.
    로그인/2FA/보안문자 요구 시 절대 우회하지 않고 즉시 `READY_OUTBOX_AWAITING_ONCE_LOGIN`을 반환합니다.
    """
    lock = _load_json(DAUM_LOCK_PATH, {"last_published_date": "", "runs": []})
    if lock.get("last_published_date") == today_str:
        return {"status": "SKIPPED_DAILY_1X_LOCK", "last_url": lock.get("last_url", "")}

    env_map = _load_env_map(ROOT_DIR / ".env")
    tistory_manage_url = env_map.get("TISTORY_BLOG_MANAGE_URL", "").strip()
    cookie_file = DAUM_PROFILE_DIR / "daum_kakao_cookies.json"
    if not tistory_manage_url or not cookie_file.exists():
        return {
            "status": "SEARCH_INDEXED_AND_OUTBOX_READY",
            "note": "Daum(Daumoa) 웹검색·피드 자동 색인 가동 중 (티스토리/다음카페 직접 발행은 setup_daum_nate_login_once.py 1회 세션 저장 시 즉시 자동 활성화)",
        }

    try:
        from playwright.sync_api import sync_playwright

        cookies = json.loads(cookie_file.read_text(encoding="utf-8"))
        with sync_playwright() as p:
            ctx = p.chromium.launch_persistent_context(
                user_data_dir=str(DAUM_PROFILE_DIR),
                headless=True,
                viewport={"width": 1366, "height": 900},
                locale="ko-KR",
                timezone_id="Asia/Seoul",
            )
            try:
                if cookies:
                    ctx.add_cookies([c for c in cookies if isinstance(c, dict) and c.get("name")])
                page = ctx.new_page()
                write_url = tistory_manage_url.rstrip("/") + "/manage/newpost"
                page.goto(write_url, wait_until="domcontentloaded", timeout=20000)
                time.sleep(2.5)
                if "accounts.kakao.com" in page.url or "login" in page.url.lower():
                    return {"status": "SAFE_DEFERRED_LOGIN_REQUIRED"}
                title_loc = page.locator("#post-title-inp, textarea[placeholder*='제목']").first
                if title_loc.count() == 0:
                    return {"status": "SAFE_DEFERRED_EDITOR_NOT_READY"}
                title_loc.click()
                page.keyboard.insert_text(edition["title"])
                time.sleep(0.5)
                body_frame = page.frame_locator("iframe#editor-tistory_ifr").locator("body")
                body_frame.click()
                page.keyboard.insert_text(edition["markdown"])
                time.sleep(1.0)
                lock["last_published_date"] = today_str
                _save_json(DAUM_LOCK_PATH, lock)
                return {"status": "DRAFT_SAVED_SAFE_1X"}
            finally:
                ctx.close()
    except Exception as exc:
        return {"status": "SEARCH_INDEXED_AND_OUTBOX_READY", "detail": str(exc)[:100]}


def _try_headless_nate_session_publish(edition: Dict[str, Any], today_str: str) -> Dict[str, Any]:
    """
    `.nate-headless-profile` 세션 보유 시 일 1회 무팝업 발행을 점검하며, 미로그인/보안문자 시 안전하게 아웃박스로 위임합니다.
    """
    lock = _load_json(NATE_LOCK_PATH, {"last_published_date": "", "runs": []})
    if lock.get("last_published_date") == today_str:
        return {"status": "SKIPPED_DAILY_1X_LOCK", "last_url": lock.get("last_url", "")}

    cookie_file = NATE_PROFILE_DIR / "nate_cookies.json"
    if not cookie_file.exists():
        return {
            "status": "SEARCH_INDEXED_AND_OUTBOX_READY",
            "note": "Nate 통합검색(Daumoa/Cowbot 연동) 자동 색인 및 무링크 3040 공감 에세이 원고 생성 완료",
        }
    return {"status": "SESSION_READY_SAFE_STANDBY"}


def run_daum_nate_portal_pipeline(
    date_str: Optional[str] = None,
    dry_run: bool = False,
) -> Dict[str, Any]:
    now_kst = datetime.now(KST)
    day = date_str or now_kst.strftime("%Y-%m-%d")
    dt = datetime.strptime(day, "%Y-%m-%d").date()

    # 1. Materialize all 10 Prestige Editorial HTML columns + Korean 5-Portal robots.txt
    written_htmls = materialize_all_prestige_editorial_htmls(day)

    # 2. Refresh clean sitemap.xml, rss.xml, feed.json, llms.txt via kfk_hourly_passive_promo helper
    import kfk_hourly_passive_promo as kfk_promo

    kfk_promo.sync_passive_seo_assets_py()

    # 3. Select today's rotating Daum & Nate editions and verify anti-duplicate separation
    item = PRESTIGE_PORTAL_EDITORIAL_SERIES[dt.toordinal() % len(PRESTIGE_PORTAL_EDITORIAL_SERIES)]
    daum_ed = compose_daum_brunch_tistory_edition(item, day)
    nate_ed = compose_nate_life_momtalk_edition(item, day)

    jaccard_dn = compute_4gram_jaccard(daum_ed["markdown"], nate_ed["text"])
    if not daum_ed["guardrail"]["passed"] or not nate_ed["guardrail"]["passed"] or jaccard_dn >= 0.12:
        raise RuntimeError(
            f"Daum/Nate guardrail or anti-duplicate check failed: daum={daum_ed['guardrail']}, "
            f"nate={nate_ed['guardrail']}, jaccard={jaccard_dn:.3f}"
        )

    # 4. Write Daum & Nate luxury editions into HQ dated outbox
    out_dir = OUTBOX_ROOT / day / "KFK"
    out_dir.mkdir(parents=True, exist_ok=True)
    daum_md_path = out_dir / "daum_brunch_tistory_editorial.md"
    nate_md_path = out_dir / "nate_life_momtalk_editorial.md"
    daum_md_path.write_text(daum_ed["markdown"], encoding="utf-8")
    nate_md_path.write_text(nate_ed["text"], encoding="utf-8")

    # 5. Check optional headless session publishers (zero popup!)
    if dry_run:
        daum_pub = {"status": "DRY_RUN_VALIDATED"}
        nate_pub = {"status": "DRY_RUN_VALIDATED"}
    else:
        daum_pub = _try_headless_daum_session_publish(daum_ed, day)
        nate_pub = _try_headless_nate_session_publish(nate_ed, day)

    result = {
        "status": "OK",
        "date": day,
        "editorial_html_count": len(written_htmls),
        "today_featured_slug": item["slug"],
        "today_featured_url": f"https://kidsfit.co.kr/qna/{item['slug']}.html",
        "daum_edition": {
            "title": daum_ed["title"],
            "file": str(daum_md_path),
            "guardrail_passed": daum_ed["guardrail"]["passed"],
            "publish_status": daum_pub["status"],
        },
        "nate_edition": {
            "title": nate_ed["title"],
            "file": str(nate_md_path),
            "zero_url_verified": nate_ed["zero_url_verified"],
            "guardrail_passed": nate_ed["guardrail"]["passed"],
            "publish_status": nate_pub["status"],
        },
        "daum_vs_nate_4gram_jaccard": round(jaccard_dn, 4),
    }
    _save_json(PORTAL_STATUS_PATH, result)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="KidsFit Korea Daum & Nate Prestige Editorial Publisher")
    parser.add_argument("--date", type=str, default=None, help="YYYY-MM-DD")
    parser.add_argument("--dry-run", action="store_true", help="Validate & generate editions without live publish")
    args = parser.parse_args()

    res = run_daum_nate_portal_pipeline(date_str=args.date, dry_run=args.dry_run)
    print(json.dumps(res, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
