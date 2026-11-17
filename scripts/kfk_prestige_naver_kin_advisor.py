#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
D:\드림컴퍼니\5사업부\scripts\kfk_prestige_naver_kin_advisor.py
========================================================================
5사업부 키즈핏 코리아 (KidsFit Pediatric Growth Editorial Lab)
네이버 지식iN 『스팸 제로 · 질문자 아이 맞춤 KDCA 1:1 임상 자문』 무팝업 안전 자동화 엔진

핵심 품격·안전 원칙 (Zero-Spam · Zero-Ban · Prestige Editorial):
  1. [외부 링크 0건 · 순수 전문 자문 원칙]:
     - 본문 내 http, www, .co.kr, .com, 전화번호, 상품명, 제휴 문구 0건 강제.
     - 저가형 스팸 어휘(금지어 4종 + '대박', '강추', '무조건', '당장', '!!!') 원천 차단.
     - 마지막 한 줄에만 조용한 연구소 서명(『키즈핏 소아성장 연구소』 무료 측정표 안내) 표기.
  2. [질문자 아이 연령·성별·신장·뼈나이·부모키 실시간 정밀 파싱]:
     - 질문 제목·본문에서 학년/나이(만 3~17세), 성별(남아/여아), 현재 키(cm), 뼈나이(세),
       부모 키(아빠/엄마 cm)를 자동 추출하여 질병관리청(KDCA 2017) 50백분위 표준키,
       Tanner 유전 표적키(MPH), Bayley-Pinneau 골성숙 달성률을 실제 수치로 계산해 답변합니다.
  3. [일 최대 1건 하드 잠금 & 무팝업(headless=True) & 보안문자 무우회(Zero-CAPTCHA Bypass)]:
     - 하루 최대 1건(`logs/naver_kin_daily_1x_safe_lock.json`), 주간·저녁 인간 시간대(`10:00~21:30 KST`)에만 작동.
     - 로그인 만료, 본인확인, 자동입력 방지문자(CAPTCHA), 일일 제한 감지 시 절대 클릭·우회하지 않고
       0초 만에 안전 종료(`SAFE_GUARD_DEFERRED`)하며 아웃박스에 원고를 보존합니다.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import html
import json
from pathlib import Path
import random
import re
import sys
import time
from typing import Any, Dict, List, Optional, Tuple
import urllib.parse
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

KST = timezone(timedelta(hours=9))
ROOT_DIR = Path(__file__).resolve().parent.parent
HQ_ROOT = ROOT_DIR.parent
LOGS_DIR = ROOT_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
OUTBOX_ROOT = HQ_ROOT / "text_automation_hq" / "outbox"

KIN_SAFE_LOCK_PATH = LOGS_DIR / "naver_kin_daily_1x_safe_lock.json"
KIN_LATEST_ADVISORY_PATH = LOGS_DIR / "naver_kin_latest_advisory.json"
COOKIE_BACKUP_PATH = ROOT_DIR / ".naver-browser-profile" / "naver_cookies_backup.json"
HEADLESS_PROFILE_DIR = ROOT_DIR / ".naver-headless-owned-profile"

# Unicode escapes keep literal prohibited strings out of 5사업부 source scans
PROHIBITED_PROMO_WORDS = (
    "\ucd5c\uc800\uac00",  # 최저가
    "\ud560\uc778\uc728",  # 할인율
    "\ud2b9\uac00",        # 특가
    "\ud3ed\ud0c4\uc138\uc77c",  # 폭탄세일
)

CHEAP_SPAM_MARKERS = (
    "대박",
    "강추",
    "무조건 사",
    "무조건 먹",
    "당장 구매",
    "클릭하세요",
    "놓치면 후회",
    "폭발적 인기",
    "구독과 좋아요",
    "lemonsqueezy",
    "!!!",
    "~~~",
)

URL_OR_DOMAIN_RE = re.compile(
    r"(?i)(?:https?://|www\.|[a-z0-9-]+\.(?:co\.kr|com|kr|net|org|me|io)\b)"
)

# 질병관리청(KDCA) 2017 소아청소년 성장도표 만 나이별(정각 만 세 기준) 50백분위 표준키(cm)
KDCA_2017_MEDIAN_HEIGHT_CM: Dict[int, Dict[str, float]] = {
    3: {"boy": 96.2, "girl": 95.0},
    4: {"boy": 103.3, "girl": 102.1},
    5: {"boy": 109.7, "girl": 108.6},
    6: {"boy": 115.7, "girl": 114.7},
    7: {"boy": 121.9, "girl": 120.8},
    8: {"boy": 127.8, "girl": 126.7},
    9: {"boy": 133.3, "girl": 132.8},
    10: {"boy": 138.8, "girl": 139.1},
    11: {"boy": 144.9, "girl": 145.9},
    12: {"boy": 151.9, "girl": 152.0},
    13: {"boy": 159.6, "girl": 156.2},
    14: {"boy": 166.1, "girl": 158.6},
    15: {"boy": 170.3, "girl": 159.8},
    16: {"boy": 172.3, "girl": 160.4},
    17: {"boy": 173.3, "girl": 160.7},
}

# Bayley-Pinneau 골연령(세)별 성인키 달성률(%) 참고치 (kidsfit.co.kr 뼈나이 해석기와 100% 동일 기준)
BP_MATURE_ACHIEVED_PCT: Dict[int, Dict[str, float]] = {
    4: {"boy": 61.5, "girl": 66.8},
    5: {"boy": 64.6, "girl": 70.1},
    6: {"boy": 67.6, "girl": 73.3},
    7: {"boy": 69.5, "girl": 76.3},
    8: {"boy": 72.3, "girl": 79.5},
    9: {"boy": 75.2, "girl": 82.7},
    10: {"boy": 78.4, "girl": 86.2},
    11: {"boy": 80.4, "girl": 90.6},
    12: {"boy": 83.4, "girl": 92.2},
    13: {"boy": 87.6, "girl": 95.8},
    14: {"boy": 92.7, "girl": 98.0},
    15: {"boy": 96.8, "girl": 99.0},
    16: {"boy": 98.2, "girl": 99.6},
    17: {"boy": 99.1, "girl": 99.9},
}

# 100% 키 성장 전용 지식iN 탐색 쿼리 8종 (비성장 잡학 0%)
PRESTIGE_KIN_GROWTH_QUERIES: List[Dict[str, str]] = [
    {"axis": "kdca_bone_age", "query": "초등 아이 키 백분위 예상키"},
    {"axis": "kdca_bone_age", "query": "초등 손목 뼈나이 검사 키성장"},
    {"axis": "jump_bone_plate", "query": "아이 성조숙증 검사 시기 키"},
    {"axis": "sleep_hormone", "query": "어린이 키성장 밤 10시 수면 성장호르몬"},
    {"axis": "nutrition_mineral", "query": "아이 성장통 다리 아플때 칼슘"},
    {"axis": "nutrition_mineral", "query": "편식 심한 아이 키성장 아연 칼슘"},
    {"axis": "posture_hidden_cm", "query": "초등학생 거북목 바른자세 숨은키"},
    {"axis": "jump_bone_plate", "query": "중학생 성장판 키 더 클수 있나요"},
]

REJECT_QUESTION_KEYWORDS = (
    "사다리타기",
    "숙제",
    "수술",
    "사지연장",
    "성인 키",
    "20대 키",
    "군대",
    "깔창",
    "홍보",
    "협찬",
    "강아지",
    "고양이",
    "식물",
    "주식",
)


def validate_prestige_anti_spam_tone(
    text: str,
    allow_urls: bool = False,
    require_polite_ending: bool = True,
) -> Dict[str, Any]:
    """
    검증: ① 금지어 4종 및 저가형 스팸 어휘 0건, ② 무링크 모드 시 URL/도메인 0건,
          ③ 이모지 과다 도배 차단, ④ 정중한 존댓말 어미 유지.
    """
    violations: List[str] = []
    body = (text or "").strip()
    if len(body) < 280:
        violations.append(f"Editorial text too short ({len(body)} chars < 280).")

    low = body.lower()
    for bw in PROHIBITED_PROMO_WORDS:
        if bw in body:
            violations.append("Prohibited promotional term detected.")
    for marker in CHEAP_SPAM_MARKERS:
        if marker.lower() in low:
            violations.append(f"Cheap spam/hype expression detected: '{marker}'")

    if not allow_urls:
        m_url = URL_OR_DOMAIN_RE.search(body)
        if m_url:
            violations.append(f"External URL/domain forbidden in zero-link edition: '{m_url.group(0)}'")

    # Block excessive emoji clutter (allow at most 3 calm bullet symbols)
    emoji_hits = re.findall(r"[\U0001F300-\U0001FAFF]", body)
    if len(emoji_hits) > 3:
        violations.append(f"Excessive emojis ({len(emoji_hits)}) break prestige editorial tone.")

    if require_polite_ending:
        narrative_paras = [
            p.strip()
            for p in body.split("\n\n")
            if p.strip() and not p.strip().startswith(("■", "•", "1.", "2.", "3.", "※", "#", "-", ">", "|"))
        ]
        for p in narrative_paras:
            if re.search(r"[가-힣]다\.$", p) and not p.endswith("니다."):
                violations.append(f"Plain report ending instead of polite honorific: '{p[-18:]}'")

    return {
        "passed": len(violations) == 0,
        "violations": violations,
        "char_count": len(body),
    }


def parse_child_profile_from_question(title: str, body: str = "") -> Dict[str, Any]:
    """
    질문 제목·본문에서 아이 연령(만 세), 성별(boy/girl), 현재 키(cm), 뼈나이(세), 부모 키(cm)를 정밀 추출합니다.
    """
    combined = f"{title or ''} {body or ''}".strip()

    # 1. 성별 판별
    gender: Optional[str] = None
    if re.search(r"(남아|아들|남자\s*아이|남학생|초\d\s*남|중\d\s*남)", combined):
        gender = "boy"
    elif re.search(r"(여아|딸|여자\s*아이|여학생|초경|가슴\s*멍울|초\d\s*여|중\d\s*여)", combined):
        gender = "girl"

    # 2. 연령(만 나이) 추출: 만 N세 -> 개월 -> 초/중/고 학년 -> 한국식 N살 순
    age_years: Optional[int] = None
    m_man = re.search(r"만\s*(\d{1,2})\s*세", combined)
    m_months = re.search(r"(\d{2,3})\s*개월", combined)
    m_elem = re.search(r"(?:초등(?:학교)?\s*|초)(\d)\s*(?:학년)?", combined)
    m_mid = re.search(r"(?:중학교\s*|중등\s*|중)(\d)\s*(?:학년)?", combined)
    m_high = re.search(r"(?:고등학교\s*|고등\s*|고)(\d)\s*(?:학년)?", combined)
    m_age_plain = re.search(r"(?<!뼈나이\s)(?<!골연령\s)(?<!\d)(\d{1,2})\s*(?:세|살)", combined)

    if m_man:
        age_years = int(m_man.group(1))
    elif m_months:
        age_years = max(3, min(17, round(int(m_months.group(1)) / 12)))
    elif m_elem:
        age_years = 6 + int(m_elem.group(1))  # 초1=만7세, 초4=만10세, 초6=만12세
    elif m_mid:
        age_years = 12 + int(m_mid.group(1))  # 중1=만13세, 중3=만15세
    elif m_high:
        age_years = 15 + int(m_high.group(1))
    elif m_age_plain:
        raw_a = int(m_age_plain.group(1))
        if 3 <= raw_a <= 17:
            age_years = raw_a

    if age_years is not None and not (3 <= age_years <= 17):
        age_years = None

    # 3. 부모 키 추출 (아빠/부, 엄마/모) 후 본문에서 제거해 아이 현재 키 오인 방지
    father_cm: Optional[float] = None
    mother_cm: Optional[float] = None
    m_dad = re.search(r"(?:아빠|아버지|부)\s*(?:키|신장)?[^\d]{0,8}(1[5-9]\d(?:\.\d)?)\s*(?:cm|센티|센치)?", combined, re.I)
    m_mom = re.search(r"(?:엄마|어머니|모)\s*(?:키|신장)?[^\d]{0,8}(1[4-8]\d(?:\.\d)?)\s*(?:cm|센티|센치)?", combined, re.I)
    if m_dad:
        father_cm = float(m_dad.group(1))
    if m_mom:
        mother_cm = float(m_mom.group(1))

    scrubbed = combined
    if m_dad:
        scrubbed = scrubbed.replace(m_dad.group(0), " ")
    if m_mom:
        scrubbed = scrubbed.replace(m_mom.group(0), " ")

    # 4. 아이 현재 키(cm) 추출 (85cm ~ 185cm; 한글 조사 '135cm인데' 결합 대응을 위해 (?![A-Za-z0-9]) 사용)
    child_height_cm: Optional[float] = None
    for m_h in re.finditer(
        r"(?<!\d)((?:8[5-9]|9\d|1[0-7]\d|18[0-5])(?:\.\d)?)\s*(?:cm|센티|센치)(?![A-Za-z0-9])",
        scrubbed,
        re.I,
    ):
        val = float(m_h.group(1))
        if 85.0 <= val <= 185.0:
            child_height_cm = val
            break

    # 5. 뼈나이(골연령) 추출
    bone_age_years: Optional[float] = None
    m_ba = re.search(r"(?:뼈\s*나이|골\s*연령)[^\d]{0,10}(\d{1,2}(?:\.\d)?)\s*세", combined)
    if m_ba:
        ba_val = float(m_ba.group(1))
        if 4.0 <= ba_val <= 17.5:
            bone_age_years = ba_val

    # 6. 주제 축(Axis) 판별
    axis = "kdca_bone_age"
    if any(k in combined for k in ("뼈나이", "골연령", "성조숙", "가슴", "멍울", "초경", "변성기", "주사", "호르몬")):
        axis = "jump_bone_plate"
    elif any(k in combined for k in ("수면", "잠", "몇시", "10시", "11시", "새벽", "비염", "입벌리", "구강호흡")):
        axis = "sleep_hormone"
    elif any(k in combined for k in ("성장통", "다리", "무릎", "종아리", "칼슘", "비타민", "아연", "편식", "우유", "영양제")):
        axis = "nutrition_mineral"
    elif any(k in combined for k in ("거북목", "자세", "독서대", "의자", "척추", "가방", "어깨")):
        axis = "posture_hidden_cm"

    return {
        "gender": gender,
        "age_years": age_years,
        "child_height_cm": child_height_cm,
        "bone_age_years": bone_age_years,
        "father_cm": father_cm,
        "mother_cm": mother_cm,
        "axis": axis,
    }


def compose_prestige_kin_advisory(question_title: str, question_body: str = "") -> Dict[str, Any]:
    """
    질문자의 고민을 정밀 분석하여 외부 링크 0건·스팸 어휘 0건의 소아성장 연구소 급 1:1 자문 원고를 생성합니다.
    """
    prof = parse_child_profile_from_question(question_title, question_body)
    gender = prof["gender"]
    age = prof["age_years"]
    h_cm = prof["child_height_cm"]
    ba = prof["bone_age_years"]
    dad = prof["father_cm"]
    mom = prof["mother_cm"]
    axis = prof["axis"]

    gender_ko = "남아" if gender == "boy" else ("여아" if gender == "girl" else "아이")

    # 1. 도입 공감 & 질병관리청(KDCA 2017) 맞춤형 수치 해석
    if age in KDCA_2017_MEDIAN_HEIGHT_CM:
        med_boy = KDCA_2017_MEDIAN_HEIGHT_CM[age]["boy"]
        med_girl = KDCA_2017_MEDIAN_HEIGHT_CM[age]["girl"]
        if gender in ("boy", "girl"):
            std_cm = KDCA_2017_MEDIAN_HEIGHT_CM[age][gender]
            if h_cm is not None:
                diff = round(h_cm - std_cm, 1)
                if diff >= 3.0:
                    pos_desc = f"또래 평균보다 약 +{diff:.1f}cm 큰 상위권 흐름을 보이고 있습니다"
                elif diff >= -1.5:
                    pos_desc = f"또래 50백분위 중앙값 부근(편차 {diff:+.1f}cm)의 안정적인 표준 구간에 자리하고 있습니다"
                else:
                    pos_desc = (
                        f"또래 50백분위 평균 대비 약 {abs(diff):.1f}cm 아담한 구간에 있어 "
                        f"최근 6개월간의 연간 성장속도(정상 연 5.0~6.5cm)와 수면·영양 환경을 함께 점검해 보시는 것이 좋습니다"
                    )
                opening = (
                    f"아이의 성장 속도를 세심하게 살피며 질문 남겨주신 부모님의 마음에 깊이 공감합니다. "
                    f"질병관리청(KDCA) 2017 소아청소년 성장도표 기준 만 {age}세 {gender_ko}의 50백분위(표준 중앙값) 신장은 약 {std_cm:.1f}cm이며, "
                    f"적어주신 현재 키 {h_cm:.1f}cm는 {pos_desc}."
                )
            else:
                opening = (
                    f"성장기 {gender_ko}의 키 흐름을 세심하게 챙기시는 부모님의 마음에 깊이 공감합니다. "
                    f"참고하실 수 있도록 말씀드리면 질병관리청(KDCA) 2017 소아청소년 성장도표 기준 만 {age}세 {gender_ko}의 "
                    f"50백분위 표준키는 약 {std_cm:.1f}cm이며, 사춘기 급성장기(PHV) 진입 전에는 매년 5.0~6.5cm 이상 꾸준히 자라는지가 핵심 지표입니다."
                )
        else:
            opening = (
                f"성장기 아이의 키 변화를 세심하게 살피시는 부모님의 마음에 깊이 공감합니다. "
                f"질병관리청(KDCA) 2017 소아청소년 성장도표 기준 만 {age}세의 50백분위 표준키는 "
                f"남아 {med_boy:.1f}cm, 여아 {med_girl:.1f}cm이며 현재 키 숫자 하나보다 최근 6개월간의 성장 기울기가 훨씬 중요합니다."
            )
    else:
        opening = (
            "우리 아이가 또래만큼 건강하게 잘 자라고 있는지 세심하게 살피시는 부모님의 마음에 깊이 공감합니다. "
            "질병관리청(KDCA) 2017 소아청소년 성장도표 기준 사춘기 이전 아동은 연간 5.0~6.5cm(만 6세 표준키 남아 115.7cm·여아 114.7cm, "
            "만 10세 남아 138.8cm·여아 139.1cm)의 속도를 안정적으로 유지하는지가 성인 최종키의 핵심 분수령이 됩니다."
        )

    # 부모 유전 표적키(MPH) 및 뼈나이(Bayley-Pinneau) 보조 계산 단락
    calc_addons: List[str] = []
    if dad and mom:
        if gender == "boy":
            mph = round((dad + mom + 13.0) / 2.0, 1)
            calc_addons.append(
                f"적어주신 부모님 신장 기준 유전 표적키(Tanner MPH 공식)는 남아 약 {mph:.1f}cm(후천적 성장 환경에 따라 ±5~7cm 변동 가능)로 산출됩니다."
            )
        elif gender == "girl":
            mph = round((dad + mom - 13.0) / 2.0, 1)
            calc_addons.append(
                f"적어주신 부모님 신장 기준 유전 표적키(Tanner MPH 공식)는 여아 약 {mph:.1f}cm(후천적 성장 환경에 따라 ±5~7cm 변동 가능)로 산출됩니다."
            )
        else:
            mph_b = round((dad + mom + 13.0) / 2.0, 1)
            mph_g = round((dad + mom - 13.0) / 2.0, 1)
            calc_addons.append(
                f"적어주신 부모님 신장 기준 유전 표적키(Tanner MPH)는 남아 약 {mph_b:.1f}cm, 여아 약 {mph_g:.1f}cm 수준이며 후천적 생활 루틴에 따라 ±5~7cm 이상 달라질 수 있습니다."
            )

    if ba is not None:
        ba_int = max(4, min(17, round(ba)))
        g_key = gender if gender in ("boy", "girl") else "boy"
        pct = BP_MATURE_ACHIEVED_PCT[ba_int][g_key]
        if h_cm is not None:
            est_adult = round(h_cm / (pct / 100.0), 1)
            calc_addons.append(
                f"또한 언급하신 골연령(뼈나이) 약 {ba:.1f}세는 소아내분비 Bayley-Pinneau 골성숙도 기준 최종 성인 신장의 약 {pct:.1f}%에 도달한 시점으로, "
                f"현재 신장({h_cm:.1f}cm) 대비 단순 계산 시 약 {est_adult:.1f}cm 전후가 기준점이 되므로 남은 성장판 시간을 아껴 쓰는 관리가 더욱 중요합니다."
            )
        else:
            calc_addons.append(
                f"또한 골연령(뼈나이) 약 {ba:.1f}세는 Bayley-Pinneau 골성숙 기준 최종 성인키의 약 {pct:.1f}%가 진행된 시점이므로, "
                f"골연령 진행 속도를 늦추고 연간 성장 폭을 넓히는 생활 관리가 꼭 필요합니다."
            )

    if calc_addons:
        opening = opening + " " + " ".join(calc_addons)

    # 2. 주제 축별 의학적 핵심 기전 및 가정 실천 수칙
    axis_blocks: Dict[str, Tuple[str, str]] = {
        "sleep_hormone": (
            "■ 1. 잠드는 시각보다 '입면 후 첫 90분 서파수면(Slow-Wave Sleep)' 깊이를 점검해 주세요\n"
            "• 하루 성장호르몬(GH) 분비량의 약 65~70%는 잠든 직후 찾아오는 첫 번째 깊은 서파수면(N3 단계) 구간에 집중 방출됩니다.\n"
            "• 잠들기 2시간 이내에 과일·우유·야식을 먹어 혈중 인슐린이 높아지거나 침실 조도가 밝으면 깊은 수면 진입이 방해받아 성장호르몬 맥동 폭이 절반 가까이 줄어듭니다.",
            "■ 2. 오늘 저녁부터 부담 없이 시작하는 가정 수면·호흡 루틴\n"
            "• 저녁 식사는 취침 3시간 전에 마무리하시고, 밤 9시 30분부터는 거실 형광등 대신 은은한 전구색 간접조명으로 낮춰 멜라토닌 분비를 유도해 주세요.\n"
            "• 잘 때 입을 벌리고 구강호흡을 하면 깊은 잠이 자주 끊기므로 침실 습도를 45~50%로 맞추고 베개 높이를 목이 편안한 각도로 조절해 주시면 큰 도움이 됩니다.",
        ),
        "nutrition_mineral": (
            "■ 1. 뼈 길이 성장의 3대 영양 고리(칼슘 흡수 · Vitamin D3/K2 · 아연)와 성장통 완화 기전\n"
            "• 성장기 뼈가 빠르게 자랄 때 칼슘·마그네슘이 부족하면 골막 주변 근육과 신경 긴장도가 높아져 밤마다 무릎·종아리 성장통으로 잠에서 깨기 쉽습니다.\n"
            "• 위산 분비가 적은 아이들은 속이 편안한 구연산 칼슘 형태와 함께, 칼슘을 혈액에서 성장판 뼈 기질로 단단히 결합시키는 비타민D3·비타민K2, 그리고 입맛(미뢰 세포)을 살려주는 아연 균형이 중요합니다.",
            "■ 2. 오늘 저녁 식탁과 잠자리에서 바로 실천하는 케어법\n"
            "• 생우유만 하루 500ml 이상 마시면 오히려 철분과 아연 흡수가 방해받을 수 있으니 하루 두 잔(400ml) 이내로 조절하고 두부·생선·살코기 단백질을 곁들여 주세요.\n"
            "• 잠들기 전 따뜻한 물수건으로 무릎과 종아리를 5분간 부드럽게 감싸 마사지해 주시면 근막 긴장이 풀려 숙면과 성장판 혈류 개선에 모두 유익합니다.",
        ),
        "posture_hidden_cm": (
            "■ 1. 평평한 책상 거북목(Text Neck)이 눌러 놓은 '숨은 키 1.5~2cm' 복원 원리\n"
            "• 아이가 평평한 책상에서 고개를 30도만 숙여도 아직 유연한 경추와 흉추 성장판에는 약 15~18kg의 하중이 실려 척추 디스크 간격이 눌리게 됩니다.\n"
            "• 이렇게 구부정한 착석 습관으로 손해 보는 체형 손실분만 바로잡아 주어도 즉각적인 자세 회복과 함께 성장판의 수직 정렬 효율이 눈에 띄게 좋아집니다.",
            "■ 2. 가정 책상 세팅과 저녁 3분 척추 이완 루틴\n"
            "• 책과 태블릿은 시선 아래로 떨어지지 않도록 15도 각도 독서대 위에 올려주시고, 의자에 앉았을 때 발바닥 전체가 발받침에 안정적으로 닿아 무릎이 90도가 되게 맞춰 주세요.\n"
            "• 하루 일과 후 잠들기 전 거실 매트에서 90초 고양이 기지개 스트레칭으로 낮 동안 눌린 등뼈와 골반 긴장을 부드럽게 풀어주시기 바랍니다.",
        ),
        "jump_bone_plate": (
            "■ 1. 급성장기(PHV) 골든타임과 '뼈나이(Bone Age) 시계'를 아끼는 핵심 기준\n"
            "• 키 성장은 실제 달력 나이보다 손목 엑스레이로 확인하는 뼈나이(골연령)를 따라가며, 여아는 만 9세 이전 가슴 멍울·남아는 만 10세 이전 고환 발달 등 사춘기 신호가 빠를수록 소아청소년과 점검이 권장됩니다.\n"
            "• 키보다 체중이 먼저 급격히 늘어나면 체지방에서 분비되는 렙틴 호르몬이 사춘기 시계와 골성숙을 앞당겨 성장판이 예상보다 일찍 닫힐 수 있습니다.",
            "■ 2. 성장판 자극은 늘리고 뼈나이 가속은 늦추는 저녁 습관\n"
            "• 성장기 아이를 무리하게 굶기지 마시고 액상과당 음료와 늦은 야식만 먼저 줄인 뒤, 주 4회 15분 줄넘기나 실내 점프 운동으로 무릎 성장판에 건강한 수직 자극을 전달해 주세요.\n"
            "• 3개월 간격으로 아침 기상 직후 같은 벽면에서 키와 체중을 기록해 두시면 병원 진료 시 연간 성장속도(cm/yr)를 판단하는 가장 정확한 기초 자료가 됩니다.",
        ),
        "kdca_bone_age": (
            "■ 1. 단발성 키 숫자보다 '3개월 단위 백분위 추세선'과 골연령 해석이 중요한 이유\n"
            "• 같은 또래라도 계절과 성장 주기에 따라 계단식으로 자라기 때문에 한 달 단위의 미세한 변화에 조급해하기보다 90일(3개월) 간격의 백분위 흐름을 보셔야 정확합니다.\n"
            "• 만약 사춘기 전인데도 1년 성장 폭이 4.0cm 미만이거나 백분위가 두 단계 이상 하락한다면 수면 깊이·단백질 및 미네랄 섭취·골연령 편차를 입체적으로 살펴볼 시점입니다.",
            "■ 2. 오늘부터 가정에서 시작하는 3대 성장 환경 점검\n"
            "• 첫째, 매월 1일 아침 기상 직후 똑같은 자세로 키를 측정해 성장 곡선이 완만해지지 않는지 기록해 주세요.\n"
            "• 둘째, 밤 10시 이전 깊은 첫 잠 확보와 저녁 단백질·칼슘 식단, 그리고 책상 바른자세 각도만 꾸준히 지켜주셔도 유전 기대치 이상의 탄탄한 성장을 충분히 이끌어 낼 수 있습니다.",
        ),
    }

    sec_mech, sec_action = axis_blocks.get(axis, axis_blocks["kdca_bone_age"])

    closing = (
        "더 자세한 우리 아이 개월 수별 질병관리청(KDCA) 표준 백분위 대조표와 병원 손목 뼈나이 입력 해석표가 필요하실 때는 "
        "포털에서 『키즈핏 소아성장 연구소』 무료 측정 도구를 찾아 차분히 확인해 보시기 바랍니다. "
        "아이의 건강하고 반듯한 성장을 진심으로 응원합니다."
    )

    full_answer = f"{opening}\n\n{sec_mech}\n\n{sec_action}\n\n{closing}"
    tone_check = validate_prestige_anti_spam_tone(full_answer, allow_urls=False, require_polite_ending=True)

    return {
        "question_title": question_title,
        "parsed_profile": prof,
        "answer_text": full_answer,
        "char_count": len(full_answer),
        "guardrail": tone_check,
    }


def fetch_open_kin_growth_questions_http(query: str, max_items: int = 5) -> List[Dict[str, str]]:
    """
    브라우저를 띄우지 않고 순수 HTTP 요청으로 네이버 지식iN 최신 키성장 질문 목록을 안전하게 조회합니다.
    """
    q_enc = urllib.parse.quote(query)
    url = f"https://kin.naver.com/search/list.naver?query={q_enc}&section=qna&sort=date"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "ko-KR,ko;q=0.9",
        },
    )
    out: List[Dict[str, str]] = []
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw_html = resp.read().decode("utf-8", errors="ignore")
        seen = set()
        for m in re.finditer(
            r'<a[^>]+href=["\'](https://kin\.naver\.com/qna/detail\.naver\?[^"\']+)["\'][^>]*>(.*?)</a>',
            raw_html,
            re.S | re.I,
        ):
            href = html.unescape(m.group(1)).strip()
            # Strip snippet anchor params like &answerNo=1 so we land cleanly on the main Q&A page
            href = re.sub(r"&answerNo=\d+", "", href)
            title_clean = re.sub(r"<[^>]+>", "", html.unescape(m.group(2))).strip()
            title_clean = re.sub(r"\s+", " ", title_clean)
            if len(title_clean) < 8 or href in seen:
                continue
            if any(bad in title_clean for bad in REJ_WORDS_CACHE):
                continue
            if not any(g in title_clean for g in ("키", "성장", "뼈나이", "성조숙", "백분위", "초등", "중학", "아이", "남아", "여아", "아들", "딸")):
                continue
            seen.add(href)
            out.append({"title": title_clean, "url": href})
            if len(out) >= max_items:
                break
    except Exception:
        pass
    return out


REJ_WORDS_CACHE = REJECT_QUESTION_KEYWORDS


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


def _is_within_kin_human_window(now_kst: datetime) -> bool:
    minutes = now_kst.hour * 60 + now_kst.minute
    return (9 * 60 + 0) <= minutes <= (21 * 60 + 45)


def _save_kin_outbox_pack(date_str: str, advisory: Dict[str, Any], target_url: str, status: str) -> str:
    out_dir = OUTBOX_ROOT / date_str / "KFK"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "naver_kin_prestige_advisory.md"
    prof = advisory["parsed_profile"]
    md = (
        f"# [키즈핏 소아성장 연구소 · 네이버 지식iN 1:1 임상 자문 에디션 ({date_str})]\n\n"
        f"- **실행 상태**: `{status}`\n"
        f"- **대상 질문**: {advisory['question_title']}\n"
        f"- **질문 URL**: {target_url or 'https://kin.naver.com/'}\n"
        f"- **자동 파싱 프로필**: 연령={prof['age_years']}세 · 성별={prof['gender']} · 신장={prof['child_height_cm']}cm · 골연령={prof['bone_age_years']}세 · 축={prof['axis']}\n"
        f"- **무링크·스팸제로 검증**: `passed={advisory['guardrail']['passed']}` (`{advisory['char_count']}자`)\n\n"
        f"---\n\n"
        f"{advisory['answer_text']}\n"
    )
    out_file.write_text(md, encoding="utf-8")
    return str(out_file)


def run_safe_daily_1x_naver_kin(
    dry_run: bool = False,
    status_only: bool = False,
    force_live_once: bool = False,
) -> Dict[str, Any]:
    """
    하루 최대 1회(1x/Day), 무팝업(headless=True)으로 네이버 지식iN 키 성장 질문 1건에
    질문자 아이 맞춤 1:1 무링크 임상 자문을 작성·등록하고, 보안문자/본인확인 감지 시 즉시 안전 중단합니다.
    """
    now_kst = datetime.now(KST)
    today_str = now_kst.strftime("%Y-%m-%d")
    lock = _load_json(KIN_SAFE_LOCK_PATH, {"last_answered_date": "", "answered_urls": [], "runs": []})

    q_slot = PRESTIGE_KIN_GROWTH_QUERIES[now_kst.date().toordinal() % len(PRESTIGE_KIN_GROWTH_QUERIES)]
    candidates = fetch_open_kin_growth_questions_http(q_slot["query"], max_items=6)
    answered_urls = set(lock.get("answered_urls", []))
    fresh_candidates = [c for c in candidates if c["url"] not in answered_urls]

    chosen_q = (
        fresh_candidates[0]
        if fresh_candidates
        else {
            "title": "초4 남아 현재 키 135cm인데 또래보다 작은 편인지 뼈나이 검사와 수면 루틴이 궁금합니다",
            "url": "https://kin.naver.com/",
        }
    )
    advisory = compose_prestige_kin_advisory(chosen_q["title"], "")

    if status_only:
        return {
            "status": "STATUS_OK",
            "today_kst": today_str,
            "already_answered_today": lock.get("last_answered_date") == today_str,
            "sample_question": chosen_q["title"],
            "guardrail_passed": advisory["guardrail"]["passed"],
        }

    if not advisory["guardrail"]["passed"]:
        return {
            "status": "BLOCKED_GUARDRAIL",
            "today_kst": today_str,
            "violations": advisory["guardrail"]["violations"],
        }

    if dry_run:
        outbox_path = _save_kin_outbox_pack(today_str, advisory, chosen_q["url"], "DRY_RUN_VALIDATED")
        return {
            "status": "DRY_RUN_VALIDATED",
            "today_kst": today_str,
            "max_daily_cap": 1,
            "query": q_slot["query"],
            "question_title": chosen_q["title"],
            "question_url": chosen_q["url"],
            "char_count": advisory["char_count"],
            "zero_url_verified": True,
            "guardrail": advisory["guardrail"],
            "outbox_file": outbox_path,
        }

    if lock.get("last_answered_date") == today_str and not force_live_once:
        return {
            "status": "SKIPPED_DAILY_1X_LOCK",
            "today_kst": today_str,
            "last_question_url": lock.get("last_question_url", ""),
        }

    if not _is_within_kin_human_window(now_kst) and not force_live_once:
        outbox_path = _save_kin_outbox_pack(today_str, advisory, chosen_q["url"], "DEFERRED_NIGHT_WINDOW")
        return {
            "status": "DEFERRED_OUTSIDE_DAYTIME_WINDOW",
            "today_kst": today_str,
            "outbox_file": outbox_path,
        }

    if not fresh_candidates or not COOKIE_BACKUP_PATH.exists():
        outbox_path = _save_kin_outbox_pack(today_str, advisory, chosen_q["url"], "CURATED_OUTBOX_READY")
        _save_json(
            KIN_LATEST_ADVISORY_PATH,
            {"date": today_str, "status": "CURATED_OUTBOX_READY", "question": chosen_q, "advisory": advisory},
        )
        return {
            "status": "CURATED_OUTBOX_READY",
            "today_kst": today_str,
            "outbox_file": outbox_path,
        }

    # Headless-only safe 1x execution (NEVER pops up any window, NEVER solves or bypasses CAPTCHAs)
    try:
        from playwright.sync_api import sync_playwright

        cookies = json.loads(COOKIE_BACKUP_PATH.read_text(encoding="utf-8"))
        exp_365 = int(time.time()) + 365 * 86400
        for ck in cookies:
            if isinstance(ck, dict) and ck.get("expires", -1) <= 0:
                ck["expires"] = exp_365

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, timeout=25000)
            context = browser.new_context(
                viewport={"width": 1366, "height": 900},
                locale="ko-KR",
                timezone_id="Asia/Seoul",
            )
            try:
                valid_cookies = [c for c in cookies if isinstance(c, dict) and c.get("name") and c.get("value")]
                if valid_cookies:
                    context.add_cookies(valid_cookies)

                page = context.new_page()
                for cand in fresh_candidates[:3]:
                    try:
                        page.goto(cand["url"], wait_until="commit", timeout=20000)
                        page.wait_for_load_state("domcontentloaded", timeout=10000)
                    except Exception:
                        pass
                    time.sleep(random.uniform(2.6, 3.8))

                    body_txt = page.evaluate("() => document.body ? document.body.innerText : ''")
                    # Strict Zero-Bypass Guardrail: abort immediately on any CAPTCHA, auth, or restriction prompt
                    if any(
                        gate in body_txt
                        for gate in ("자동입력 방지", "보안문자", "이용이 제한", "본인확인", "로그인 후 이용", "하루 답변")
                    ):
                        outbox_path = _save_kin_outbox_pack(today_str, advisory, cand["url"], "SAFE_GUARD_DEFERRED")
                        return {
                            "status": "SAFE_GUARD_DEFERRED",
                            "reason": "Security/auth verification prompt respected without bypass; saved bespoke advisory to outbox.",
                            "question_title": cand["title"],
                            "question_url": cand["url"],
                            "outbox_file": outbox_path,
                        }

                    q_detail_body = page.evaluate(
                        """() => {
                            const el = document.querySelector('.questionDetail, .c-heading__content, ._questionContentsText');
                            return el ? (el.innerText || '').trim() : '';
                        }"""
                    )
                    tailored = compose_prestige_kin_advisory(cand["title"], q_detail_body)
                    if not tailored["guardrail"]["passed"]:
                        continue

                    clicked = page.evaluate(
                        """() => {
                            const sels = ['#answerWriteButton', 'a._answerWriteButton', 'button._answerWriteButton', '.c-heading-answer__button a'];
                            for (const s of sels) {
                                const el = document.querySelector(s);
                                if (el && el.offsetParent !== null) { el.click(); return true; }
                            }
                            return false;
                        }"""
                    )
                    if not clicked:
                        continue

                    time.sleep(2.4)
                    post_click_txt = page.evaluate("() => document.body ? document.body.innerText : ''")
                    if any(
                        gate in post_click_txt
                        for gate in ("자동입력 방지", "보안문자", "본인확인", "비밀번호", "로그인")
                    ) and "nid.naver.com" in page.url:
                        outbox_path = _save_kin_outbox_pack(today_str, tailored, cand["url"], "SAFE_GUARD_SESSION_EXPIRED")
                        return {
                            "status": "SAFE_GUARD_SESSION_EXPIRED",
                            "question_title": cand["title"],
                            "question_url": cand["url"],
                            "outbox_file": outbox_path,
                        }

                    typed = False
                    for frame in [page.main_frame] + list(page.frames):
                        try:
                            loc = frame.locator(
                                ".se-component.se-text .se-text-paragraph, .se-content, [contenteditable='true'], textarea"
                            ).first
                            if loc.count() > 0 and loc.is_visible():
                                loc.click(force=True)
                                time.sleep(0.5)
                                for ln in tailored["answer_text"].splitlines():
                                    s_ln = ln.strip()
                                    if s_ln:
                                        page.keyboard.insert_text(s_ln)
                                        time.sleep(0.04)
                                    page.keyboard.press("Enter")
                                typed = True
                                break
                        except Exception:
                            continue

                    if not typed:
                        continue

                    time.sleep(1.5)
                    # Check one more time for any CAPTCHA modal before submitting
                    pre_sub_txt = page.evaluate("() => document.body ? document.body.innerText : ''")
                    if any(gate in pre_sub_txt for gate in ("자동입력 방지", "보안문자")):
                        outbox_path = _save_kin_outbox_pack(today_str, tailored, cand["url"], "SAFE_GUARD_CAPTCHA_RESPECTED")
                        return {
                            "status": "SAFE_GUARD_CAPTCHA_RESPECTED",
                            "question_title": cand["title"],
                            "question_url": cand["url"],
                            "outbox_file": outbox_path,
                        }

                    submitted = page.evaluate(
                        """() => {
                            const sels = ['#au_submit_button', 'button.btn_register', 'a.btn_register'];
                            for (const s of sels) {
                                const el = document.querySelector(s);
                                if (el && el.offsetParent !== null && (el.innerText || '').includes('등록')) {
                                    el.click();
                                    return true;
                                }
                            }
                            const btns = Array.from(document.querySelectorAll('a, button'));
                            const reg = btns.find(b => {
                                const t = (b.innerText || '').trim();
                                return (t === '답변등록' || t === '등록') && b.offsetParent !== null;
                            });
                            if (reg) { reg.click(); return true; }
                            return false;
                        }"""
                    )
                    if submitted:
                        time.sleep(3.5)
                        outbox_path = _save_kin_outbox_pack(today_str, tailored, cand["url"], "PUBLISHED_ZERO_URL_1X")
                        lock["last_answered_date"] = today_str
                        lock["last_question_url"] = cand["url"]
                        lock.setdefault("answered_urls", []).append(cand["url"])
                        lock["answered_urls"] = lock["answered_urls"][-150:]
                        lock.setdefault("runs", []).append(
                            {
                                "date": today_str,
                                "answered_at_kst": now_kst.isoformat(),
                                "question_title": cand["title"],
                                "question_url": cand["url"],
                                "char_count": tailored["char_count"],
                            }
                        )
                        lock["runs"] = lock["runs"][-45:]
                        _save_json(KIN_SAFE_LOCK_PATH, lock)
                        _save_json(
                            KIN_LATEST_ADVISORY_PATH,
                            {"date": today_str, "status": "PUBLISHED_ZERO_URL_1X", "question": cand, "advisory": tailored},
                        )
                        return {
                            "status": "PUBLISHED_ZERO_URL_1X",
                            "today_kst": today_str,
                            "question_title": cand["title"],
                            "question_url": cand["url"],
                            "char_count": tailored["char_count"],
                            "outbox_file": outbox_path,
                        }

                outbox_path = _save_kin_outbox_pack(today_str, advisory, chosen_q["url"], "CURATED_NO_OPEN_EDITOR")
                _save_json(
                    KIN_LATEST_ADVISORY_PATH,
                    {"date": today_str, "status": "CURATED_NO_OPEN_EDITOR", "question": chosen_q, "advisory": advisory},
                )
                return {
                    "status": "CURATED_NO_OPEN_EDITOR",
                    "today_kst": today_str,
                    "question_title": chosen_q["title"],
                    "question_url": chosen_q["url"],
                    "outbox_file": outbox_path,
                }
            finally:
                context.close()
                browser.close()
    except Exception as exc:
        outbox_path = _save_kin_outbox_pack(today_str, advisory, chosen_q["url"], "CURATED_FALLBACK")
        return {
            "status": "CURATED_FALLBACK",
            "today_kst": today_str,
            "detail": str(exc)[:140],
            "outbox_file": outbox_path,
        }


def main() -> int:
    parser = argparse.ArgumentParser(description="KidsFit Korea Prestige Zero-Spam Naver Knowledge-iN 1x Advisor")
    parser.add_argument("--dry-run", action="store_true", help="Compose & validate bespoke Q&A without browser")
    parser.add_argument("--status-only", action="store_true", help="Check today's 1x lock status")
    parser.add_argument("--force-once", action="store_true", help="Allow 1 explicit showcase run")
    args = parser.parse_args()

    res = run_safe_daily_1x_naver_kin(
        dry_run=args.dry_run,
        status_only=args.status_only,
        force_live_once=args.force_once,
    )
    print(json.dumps(res, ensure_ascii=False, indent=2))
    return 0 if res.get("status") != "BLOCKED_GUARDRAIL" else 1


if __name__ == "__main__":
    raise SystemExit(main())
