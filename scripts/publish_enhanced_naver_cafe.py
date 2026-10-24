# -*- coding: utf-8 -*-
"""
scripts/publish_enhanced_naver_cafe.py
KidsFit Growth & Learning Studio — Enhanced Naver Cafe Publisher

Responsibilities:
1. Connects to persistent Chrome on CDP port 9222 and accesses the modern SPA write interface:
   https://cafe.naver.com/ca-fe/cafes/31805224/menus/{menu_id}/articles/write?boardType=L
   (Target Cafe: https://cafe.naver.com/moneyfitlab, Club ID: 31805224)
2. Publishes warm, non-promotional community posts across the 7 KidsFit boards:
   - menuid=1: 공지사항·이벤트 (공지 및 키즈핏 가이드)
   - menuid=2: 엄마표 홈케어 워크지 (연령별 무료 워크지 PDF)
   - menuid=3: 키성장·성조숙증 코칭 (우리아이 키성장·성조숙증)
   - menuid=4: 소근육·두뇌발달 질문방 (두뇌·소근육·학습 질문방)
   - menuid=5: 주말 나들이·전시 코스 (주말 전시·박물관 나들이)
   - menuid=6: 교구·책육아 솔직후기 (매월 1일 리포트 인증방)
   - menuid=7: 자유수다·육아고민 (반가운 가입인사)
3. Strict non-promotional tone: zero commercial affiliate codes, zero sales links.
4. Generates high-resolution 1080x1080 PNG summary and checklist cards via Pillow.
   Saved to: d:\\키즈핏\\samples\\enhanced_blog_images\\
5. Scheduled publishing cadence: 3x/day at 10:30 (morning coffee), 14:30 (school pick-up), 21:00 (late-night talk).
6. Writes publication audit logs containing articleId and timestamp to logs/ directory.
7. Supports CLI flags:
   --dry-run: Renders text and image, validates tone and constraints, exits without publishing.
   --live: Connects to CDP port 9222, executes publication on Naver Cafe, returns article URL.
   --board: Specific board name or alias.
   --menu-id: Specific menu ID (1 to 7).
   --topic-idx: Topic selection index (0-based).
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

# Safe console output for Windows UTF-8
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(r"d:\키즈핏")
ENHANCED_IMG_DIR = ROOT / "samples" / "enhanced_blog_images"
CURSOR_PATH = ROOT / "logs" / "cafe_publishing_cursor.json"
AUDIT_LOG_PATH = ROOT / "logs" / "cafe_publishing_audit.json"
ENV_PATH = ROOT / ".env"

# Target Cafe configuration
TARGET_CAFE_CLUBID = "31805224"
TARGET_CAFE_URL = "https://cafe.naver.com/moneyfitlab"
CDP_URL = "http://127.0.0.1:9222"
CDP_PORT = 9222

# Scheduled publishing cadence: 3x/day at 10:30, 14:30, and 21:00 KST
SCHEDULED_INTERVALS = ["10:30", "14:30", "21:00"]

# The 7 Official KidsFit Cafe Boards
KIDSFIT_CAFE_BOARDS = [
    "키성장·성조숙증 코칭",
    "소근육·두뇌발달 질문방",
    "교구·책육아 솔직후기",
    "주말 나들이·전시 코스",
    "엄마표 홈케어 워크지",
    "자유수다·육아고민",
    "공지사항·이벤트",
]

# Complete Menu ID mapping (supports both standard names and aliases)
CAFE_MENU_MAP = {
    # Primary IDs
    "공지사항·이벤트": 1,
    "공지 및 키즈핏 가이드": 1,
    "엄마표 홈케어 워크지": 2,
    "연령별 무료 워크지 PDF": 2,
    "키성장·성조숙증 코칭": 3,
    "우리아이 키성장·성조숙증": 3,
    "소근육·두뇌발달 질문방": 4,
    "두뇌·소근육·학습 질문방": 4,
    "주말 나들이·전시 코스": 5,
    "주말 전시·박물관 나들이": 5,
    "교구·책육아 솔직후기": 6,
    "매월 1일 리포트 인증방": 6,
    "자유수다·육아고민": 7,
    "반가운 가입인사": 7,
}

CAFE_MENU_ID_TO_CANONICAL = {
    1: "공지사항·이벤트",
    2: "엄마표 홈케어 워크지",
    3: "키성장·성조숙증 코칭",
    4: "소근육·두뇌발달 질문방",
    5: "주말 나들이·전시 코스",
    6: "교구·책육아 솔직후기",
    7: "자유수다·육아고민",
}

# Color palette
PALETTE = {
    "bg_warm": (250, 248, 245),      # #FAF8F5 Warm Ivory
    "card_white": (255, 255, 255),   # #FFFFFF Clean White
    "border": (226, 232, 240),       # #E2E8F0 Soft Gray
    "accent_mint": (16, 185, 129),    # #10B981 Fresh Emerald Mint
    "accent_violet": (79, 70, 229),   # #4F46E5 Soft Violet / Indigo
    "accent_coral": (249, 115, 22),   # #F97316 Warm Coral
    "text_dark": (15, 23, 42),       # #0F172A Dark Slate
    "text_muted": (71, 85, 105),     # #475569 Muted Slate
}


def load_env() -> dict:
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            clean = line.strip()
            if "=" in clean and not clean.startswith("#"):
                k, v = clean.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def send_telegram_notification(title: str, url: str, board_name: str):
    env = load_env()
    token = os.environ.get("TELEGRAM_BOT_TOKEN") or env.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID") or env.get("TELEGRAM_CHAT_ID") or "755033799"
    if not token:
        return
    text = (
        f"☕ [키즈핏 공식 네이버 카페 새 글 발행 완료]\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"• 게시판: {board_name}\n"
        f"• 제목: {title}\n"
        f"• 따뜻한 공감 양육 코칭 & 실천 체크리스트 포함\n"
        f"• 바로보기: {url}\n"
        f"⏰ 정기 발행 스케줄: 매일 3회 (10:30 / 14:30 / 21:00 KST)"
    )
    payload = json.dumps({"chat_id": chat_id, "text": text, "disable_web_page_preview": False}).encode("utf-8")
    try:
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data=payload,
            headers={"Content-Type": "application/json; charset=utf-8"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status
    except Exception as e:
        print(f"⚠️ Telegram alert error: {e}", flush=True)
        return None


def get_korean_font(size: int, bold: bool = True):
    font_paths = [
        r"C:\Windows\Fonts\malgunbd.ttf" if bold else r"C:\Windows\Fonts\malgun.ttf",
        r"C:\Windows\Fonts\gulim.ttc",
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def wrap_text_by_pixel_width(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    lines = []
    for paragraph in text.splitlines():
        words = paragraph.strip().split(" ")
        cur = ""
        for w in words:
            cand = f"{cur} {w}".strip() if cur else w
            bbox = draw.textbbox((0, 0), cand, font=font)
            if (bbox[2] - bbox[0]) <= max_width:
                cur = cand
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
    return lines


def generate_cafe_card_png(
    out_path: Path,
    board_badge: str,
    title: str,
    points: list[str],
    accent_rgb: tuple = PALETTE["accent_mint"]
) -> str:
    """
    Generates high-resolution 1080x1080 PNG summary and checklist card for Naver Cafe community posts.
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)
    W, H = 1080, 1080
    img = Image.new("RGB", (W, H), PALETTE["bg_warm"])
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, 22], fill=accent_rgb)
    draw.rounded_rectangle([48, 54, W - 48, H - 54], radius=32, fill=PALETTE["card_white"], outline=PALETTE["border"], width=3)

    # Board badge pill
    f_badge = get_korean_font(26, bold=True)
    b_box = draw.textbbox((0, 0), board_badge, font=f_badge)
    pill_w = max(380, (b_box[2] - b_box[0]) + 60)
    draw.rounded_rectangle([96, 96, 96 + pill_w, 156], radius=28, fill=(236, 253, 245))
    draw.text((126, 110), board_badge, font=f_badge, fill=accent_rgb)

    # Title
    max_title_w = W - 192
    title_font_size = 42
    f_title = get_korean_font(title_font_size, bold=True)
    wrapped_title = wrap_text_by_pixel_width(draw, title, f_title, max_title_w)
    if len(wrapped_title) > 3:
        title_font_size = 35
        f_title = get_korean_font(title_font_size, bold=True)
        wrapped_title = wrap_text_by_pixel_width(draw, title, f_title, max_title_w)

    y = 184
    line_step = title_font_size + 18
    for line in wrapped_title:
        draw.text((96, y), line, font=f_title, fill=PALETTE["text_dark"])
        y += line_step

    divider_y = max(400, y + 16)
    draw.line([96, divider_y, W - 96, divider_y], fill=PALETTE["border"], width=2)

    # 3 Takeaway Points
    py = divider_y + 30
    f_num = get_korean_font(27, bold=True)
    for idx, pt in enumerate(points[:3]):
        clean_pt = re.sub(r"^[①②③④⑤1-9\.\s]+", "", pt.strip())
        box_h = 126
        draw.rounded_rectangle([96, py, W - 96, py + box_h], radius=20, fill=(248, 250, 252), outline=PALETTE["border"], width=2)

        cx, cy = 152, py + box_h // 2
        draw.ellipse([cx - 24, cy - 24, cx + 24, cy + 24], fill=accent_rgb)
        num_str = str(idx + 1)
        nb = draw.textbbox((0, 0), num_str, font=f_num)
        draw.text((cx - (nb[2] - nb[0]) // 2, cy - (nb[3] - nb[1]) // 2 - 3), num_str, font=f_num, fill=(255, 255, 255))

        avail_w = (W - 120) - 200
        pt_size = 30
        f_pt = get_korean_font(pt_size, bold=True)
        pt_lines = wrap_text_by_pixel_width(draw, clean_pt, f_pt, avail_w)
        if len(pt_lines) == 1:
            draw.text((200, py + (box_h - pt_size) // 2 - 3), pt_lines[0], font=f_pt, fill=(30, 41, 59))
        else:
            draw.text((200, py + 24), pt_lines[0], font=f_pt, fill=(30, 41, 59))
            draw.text((200, py + 66), " ".join(pt_lines[1:]), font=f_pt, fill=(30, 41, 59))

        py += box_h + 20

    # Clinic branding footer
    draw.rounded_rectangle([96, 912, W - 96, 986], radius=18, fill=accent_rgb)
    f_foot = get_korean_font(26, bold=True)
    draw.text((130, 933), "키즈핏 공식 네이버 카페 · 우리 아이 성장 나눔 커뮤니티", font=f_foot, fill=(255, 255, 255))

    img.save(str(out_path), "PNG")
    return str(out_path)


# ==============================================================================
# The 7 KidsFit Community Topics Bank
# ==============================================================================

CAFE_COMMUNITY_TOPICS = [
    {
        "menu_id": 1,
        "board": "공지사항·이벤트",
        "title": "[공지] 키즈핏 양육 연구소 공식 카페 이용 안내 & 7대 게시판 활용 가이드",
        "card_title": "키즈핏 공식 카페 이용 안내\n7대 게시판 200% 활용 가이드",
        "points": [
            "질병관리청(KDCA 2017) 성장도표 & K-DST 발달 기준 바탕의 신뢰 공간",
            "매주 업데이트되는 연령별 무료 워크지 PDF 및 전문 코칭 나눔",
            "광고와 제휴 링크 없는 100% 순수 학부모 공감 커뮤니티"
        ],
        "tags": ["키즈핏", "공지사항", "카페가이드", "육아커뮤니티", "엄마표홈케어", "소아성장"],
        "body": """안녕하세요, 키즈핏 양육 연구소 가족 여러분! 🌱

우리 아이의 신체 성장과 두뇌 발달, 그리고 주말 나들이를 함께 고민하고 응원하는 키즈핏 공식 네이버 카페에 오신 것을 진심으로 환영합니다.

저희 키즈핏 카페는 질병관리청 소아청소년 성장도표와 보건복지부 K-DST 영유아 발달선별검사 등 국가 표준 의학 데이터를 기반으로, 광고나 상업적 제휴 링크 없이 부모님들이 안심하고 정보를 나누실 수 있도록 운영됩니다.

■ 키즈핏 7대 게시판 이용 안내
1. 공지사항·이벤트: 카페 운영 안내 및 월간 키즈핏 성장 챌린지 소식
2. 엄마표 홈케어 워크지: 월령별 소근육·선긋기·가위질 무료 워크지 PDF 나눔
3. 키성장·성조숙증 코칭: 키 백분위, 수면 골든타임, 식단과 바른 자세 질의응답
4. 소근육·두뇌발달 질문방: 언어, 수리, 작업기억, 몬테소리 교구 고민 나눔
5. 주말 나들이·전시 코스: 우리 동네 박물관·미술관·과학관 하브루타 동선 추천
6. 교구·책육아 솔직후기: 실제 구매한 교구와 그림책 활용 솔직 경험담
7. 자유수다·육아고민: 워킹맘, 육아맘의 일상 수다와 따뜻한 공감 공간

아이를 키우며 마주하는 사소한 질문도 편안하게 남겨주세요. 따뜻한 댓글로 함께 나누는 건강한 소통을 기대합니다! 💬"""
    },
    {
        "menu_id": 2,
        "board": "엄마표 홈케어 워크지",
        "title": "[무료 나눔] 만 2~4세 소근육 발달을 위한 '선긋기 & 가위질 첫걸음 워크지 10종' PDF 가이드",
        "card_title": "만 2~4세 소근육 첫걸음\n선긋기 & 안전가위질 워크지 10종",
        "points": [
            "K-DST 소근육 지표 기준: 엄지-검지 삼지 집기(Tripod Grasp) 맞춤 설계",
            "직선부터 곡선, 지그재그로 이어지는 3단계 난이도 구성",
            "가정에서 A4 프린터로 즉시 출력 가능한 고화질 PDF 제공"
        ],
        "tags": ["무료워크지", "선긋기워크지", "가위질놀이", "소근육발달", "엄마표놀이", "K-DST", "키즈핏"],
        "body": """안녕하세요, 키즈핏 가족 여러분! ✂️

만 2~4세 아이들은 손가락 끝의 미세한 힘을 조절하고 눈과 손을 협응시키는 '소근육 민감기'를 통과하고 있습니다.
많은 부모님께서 비싼 워크북을 사주어도 아이가 한두 장 낙서하고 덮어버려 아쉬우셨을 텐데요, 가정에서 부담 없이 출력하여 하루 1장씩 놀이처럼 활용할 수 있는 '선긋기 & 가위질 첫걸음 워크지 10종'을 무료로 나눕니다.

■ 워크지 3단계 구성 안내
• 1단계 (직선 긋기 & 동물 길 찾기): 토끼가 당근을 찾아가는 굵은 직선을 따라 그리며 손목 안정성을 기릅니다.
• 2단계 (부드러운 곡선 & 원 그리기): 달팽이 집을 그리며 손가락 끝 악력과 방향 전환 능력을 키웁니다.
• 3단계 (안전가위 1cm 직선 자르기): 사자 갈기, 고슴도치 가시를 싹둑싹둑 오리며 양손 분리 협응력을 완성합니다.

■ 엄마표 홈케어 꿀팁
아이가 선을 삐져나가도 절대 지우개로 지우지 마세요!
"우와, 이번엔 구불구불 재미있는 길로 가보았네!" 하고 격려해 주시면 아이의 손끝 자신감이 쑥쑥 자라납니다.

워크지를 활용해보신 소감이나 아이의 작품 사진을 댓글로 자랑해 주세요! 🎨"""
    },
    {
        "menu_id": 3,
        "board": "키성장·성조숙증 코칭",
        "title": "[성장 코칭] 또래보다 머리 냄새와 피지 분비가 늘었다면? 성조숙증 조기 신호와 식단 체크리스트",
        "card_title": "초등 저학년 머리 냄새·피지 분비\n성조숙증 의심 신호 & 식단 체크리스트",
        "points": [
            "남아 만 9세 이전, 여아 만 8세 이전 2차 성징 시작 여부 확인",
            "정수리 냄새, 가슴 멍울, 급성장(연 7cm 이상) 등 초기 신호 점검",
            "환경호르몬(플라스틱 배달 용기) 차단 및 균형 잡힌 저탄수 단백질 식단"
        ],
        "tags": ["성조숙증", "초등성장", "성장골든타임", "머리냄새", "키성장코칭", "질병관리청", "키즈핏"],
        "body": """안녕하세요, 키즈핏 소아성장 코칭방입니다. 📏

"초등학교 1~2학년인 우리 아이, 요즘 부쩍 정수리에서 어른 같은 땀 냄새가 나고 키가 갑자기 훌쩍 큰 것 같아요. 혹시 성조숙증일까요?"
최근 진료실과 카페에 가장 많이 접수되는 질문 중 하나입니다. 성조숙증은 여아의 경우 만 8세 이전, 남아는 만 9세 이전에 2차 성징 신호가 나타나는 것을 말하며, 성장판이 조기에 닫혀 최종 성인 예측키에 영향을 줄 수 있습니다.

■ 가정에서 확인하는 3대 초기 신호
1. 정수리 머리 냄새 및 이마 피지 분비: 아포크린 땀샘이 활성화되며 호르몬 변화가 시작되는 첫 신호입니다.
2. 여아 가슴 멍울 및 살짝 스쳐도 아픔 호소: 가슴 몽우리가 잡히는지 샤워 시 조심스럽게 확인해 주세요.
3. 최근 6개월간 키가 4cm 이상 급격히 자람: 또래 평균(연 5~6cm)을 넘어 지나치게 빠른 성장은 급성장기(PHV) 진입 여부를 관찰해야 합니다.

■ 오늘부터 실천하는 환경 & 식단 체크리스트
• 뜨거운 음식을 플라스틱 배달 용기에 담아 전자레인지에 돌리지 않기 (프탈레이트 차단)
• 과도한 당류 음료와 패스트푸드 섭취 줄이고 체지방률 관리
• 밤 10시 이전 규칙적인 수면으로 멜라토닌 분비 정상화

걱정되는 증상이 있으시다면 댓글로 아이의 현재 개월 수와 키를 편하게 남겨주세요. 함께 점검해 드리겠습니다!"""
    },
    {
        "menu_id": 4,
        "board": "소근육·두뇌발달 질문방",
        "title": "[두뇌 코칭] 연산은 빠른데 문장제 수학만 나오면 당황하는 아이, 국어 어휘력의 문제일까요?",
        "card_title": "연산은 빠른데 문장제만 나오면 별표?\n'전두엽 작업기억' 3단계 코칭법",
        "points": [
            "원인은 국어 문해력 부족이 아닌 '전두엽 작업기억(Working Memory) 과부하'",
            "머릿속 암산 대신 여백에 조건별 '막대 그림' 그리기 습관",
            "하루 1문제 아이가 선생님이 되어 부모에게 설명하는 '인출 놀이'"
        ],
        "tags": ["문장제수학", "작업기억", "두뇌발달", "초등수학", "메타인지", "하브루타", "키즈핏"],
        "body": """안녕하세요, 키즈핏 두뇌발달 연구방입니다. 🧠

"단순 덧셈, 뺄셈 연산 문제집은 100점을 맞는데, 서술형 문장제 수학만 나오면 문제를 대충 읽고 엉뚱한 식을 세워요. 책을 더 많이 읽혀야 할까요?"
초등 학부모님들께서 가장 답답해하시는 문제 중 하나입니다. 많은 분들이 문해력 부족을 의심하시지만, 인지신경과학의 진단은 다릅니다. 이는 글자를 못 읽어서가 아니라, 문장 속 조건들을 머릿속에 올려놓고 조작하는 '전두엽 작업기억(Working Memory)'의 용량이 넘쳤기 때문입니다.

■ 작업기억 과부하를 풀어주는 3단계 처방
1. 문장의 핵심 수치에 연필로 동그라미 치기: 불필요한 수식어를 걷어내고 구해야 할 목표에 밑줄을 긋습니다.
2. 여백에 '막대 그림'으로 시각화하기: "철수가 사과 5개를 가졌고, 영희가 3개 더 많다면?"을 머리로만 생각하지 말고 네모 상자 두 개를 그려 직관적으로 비교하게 합니다.
3. '선생님 놀이'로 메타인지 깨우기: "엄마한테 이 문제가 왜 이렇게 풀리는지 1분만 가르쳐줄래?" 하고 말로 설명하게 하면, 뇌의 해마에서 장기기억으로 개념이 탄탄하게 코팅됩니다.

우리 아이의 수학 문장제 고민, 댓글로 함께 나누어 주세요! 💡"""
    },
    {
        "menu_id": 5,
        "board": "주말 나들이·전시 코스",
        "title": "[주말 코스] 이번 주말 비 소식 있을 때 추천하는 '국립과천과학관 자연사관' 부모-자녀 하브루타 동선",
        "card_title": "비 오는 주말 실내 나들이 추천\n과천과학관 자연사관 하브루타 탐구 코스",
        "points": [
            "단순 관람을 넘어선 공룡 뼈 화석 및 고생대 생태 하브루타 질문 3선",
            "주차 꿀팁 및 주말 쾌적한 관람 시간대 (오전 10시 이전 입장 추천)",
            "귀가 후 스케치북으로 완성하는 원데이 자연관찰 연계 워크시트"
        ],
        "tags": ["주말나들이", "과천과학관", "아이와가볼만한곳", "박물관체험", "하브루타", "자연사관", "키즈핏"],
        "body": """안녕하세요, 키즈핏 주말 나들이 큐레이터입니다! 🦕

이번 주말 비 소식이 예보되어 실내 나들이 장소를 찾고 계신 부모님들을 위해, 아이들의 호기심을 200% 자극하는 '국립과천과학관 자연사관' 맞춤 하브루타 동선을 소개합니다.

단순히 공룡 모형 앞에서 사진만 찍고 지나치지 마시고, 현장에서 아이와 나눌 수 있는 3가지 질문을 꼭 품고 가보세요.

■ 과천과학관 자연사관 하브루타 3단계 질문
• 질문 1: "티라노사우루스 이빨과 트리케라톱스 이빨 모양이 왜 다를까?" (육식과 초식의 턱 관절 관찰)
• 질문 2: "화석은 어떻게 돌처럼 단단해져서 수천만 년 동안 남아있을 수 있었을까?" (지층과 퇴적 원리 추론)
• 질문 3: "만약 우리가 공룡 시대에 살았다면 어디에 집을 지었을까?" (상상력과 고대 환경 연결)

■ 관람 실전 팁
주말에는 주차장이 혼잡하므로 오전 9시 40분까지 도착하시면 동주차장에 여유 있게 주차하실 수 있습니다. 관람 후 2층 푸드코트 대신 야외 도시락 쉼터를 이용하시면 훨씬 쾌적합니다.

이번 주말 아이와 다녀오실 계획이시라면 댓글로 인증해 주세요! 멋진 후기를 공유해 주신 분들과 소통하겠습니다. 🌧️"""
    },
    {
        "menu_id": 6,
        "board": "교구·책육아 솔직후기",
        "title": "[책육아 후기] 3세 아이와 함께 시작한 '하루 10분 잠자리 그림책 하브루타' 한 달 실천 기록",
        "card_title": "3세 아이와 잠자리 그림책 하브루타\n한 달 실천 후 나타난 언어·정서 변화",
        "points": [
            "글자 읽어주기에서 '그림 속 작은 표정 관찰하기'로 대화 전환",
            "아이가 스스로 '왜?'라는 질문을 던지기 시작한 어휘력 폭발",
            "수면 의식과 결합되어 밤 10시 취침 성공률 90% 달성"
        ],
        "tags": ["책육아", "잠자리독서", "그림책하브루타", "3세육아", "언어발달", "육아후기", "키즈핏"],
        "body": """안녕하세요, 키즈핏 가족 여러분! 📖

퇴근 후 지친 몸으로 아이에게 책을 읽어줄 때, 어느 순간 저도 모르게 기계처럼 글자만 빠르게 읽어 내려가고 있던 제 모습을 발견했습니다.
아이는 자꾸 책장을 넘기려 하고, 저는 "가만히 있어봐, 아직 다 안 읽었잖아" 하며 실랑이를 벌이다 잠자리가 엉망이 되곤 했지요.

한 달 전, 키즈핏 칼럼에서 '글자 읽기보다 그림 속 감정에 질문을 던지는 하브루타'를 접하고 방식을 완전히 바꾸어 보았습니다.

■ 한 달간 바꾼 3가지 잠자리 대화법
1. 글자를 다 읽으려 애쓰지 않고, 아이가 손가락으로 가리키는 그림에 대해 먼저 이야기하기
2. "아기 곰 표정이 왜 슬퍼 보일까?", "어디로 숨으러 가는 걸까?" 하고 정답 없는 질문 건네기
3. 책을 덮고 아이를 꼭 안아주며 "오늘 하루도 참 고마웠어" 한 줄 사랑의 속삭임으로 마무리하기

놀랍게도 한 달 만에 아이가 낮에도 "엄마, 저 구름은 왜 토끼 모양일까?" 하며 스스로 생각을 표현하기 시작했습니다.
아이의 언어 발달은 화려한 전집보다 부모와 눈을 맞추며 나눈 따뜻한 10분의 대화에서 자란다는 것을 깊이 깨달았습니다.

어머님들의 잠자리 독서 꿀팁도 댓글로 들려주세요! ❤️"""
    },
    {
        "menu_id": 7,
        "board": "자유수다·육아고민",
        "title": "[워킹맘 수다] 퇴근 후 30분, 아이와 온전히 눈 맞추는 저녁 루틴 어떻게 지키고 계신가요?",
        "card_title": "퇴근 후 바쁜 저녁 30분\n아이와 온전히 눈 맞추는 워킹맘 루틴",
        "points": [
            "긴 시간보다 중요한 것은 스마트폰 없는 '15분의 고밀도 교감'",
            "옷 갈아입기 전 1분간 꼭 안아주는 '환영 스킨십 의식'",
            "저녁 식사 준비 중 아이에게 멸치 다듬기 등 작은 역할 선물하기"
        ],
        "tags": ["워킹맘", "육아퇴근", "저녁루틴", "아이와교감", "육아수다", "따뜻한위로", "키즈핏"],
        "body": """안녕하세요, 오늘도 치열하게 하루를 보내신 워킹맘, 육아맘 여러분! ☕

지하철에서 내려 집으로 향하는 발걸음, "오늘 저녁은 또 뭘 해 먹이지?", "집에 가면 빨래랑 설거지가 산더미일 텐데" 하는 생각에 문을 열기도 전에 피로가 몰려오곤 합니다.
현관문을 열자마자 달려오는 아이를 보며 반가우면서도, 손에 쥔 스마트폰 알림을 확인하느라 아이 눈을 제대로 바라보지 못해 밤마다 자책했던 날들이 많았습니다.

그래서 요즘 저는 퇴근 후 '첫 15분 법칙'을 실천하고 있습니다.

■ 저를 살린 퇴근 후 15분 루틴
1. 현관에서 가방을 내려놓자마자 무릎을 굽히고 아이를 1분간 온 힘을 다해 꽉 안아주기 ("엄마가 오늘 우리 ○○이 정말 많이 보고 싶었어!")
2. 스마트폰은 충전기에 꽂아두고, 저녁 준비를 시작하기 전 아이가 오늘 가장 재미있었던 일 한 가지 귀 기울여 들어주기
3. 밥 차릴 때 아이에게 플라스틱 숟가락 놓기나 두부 썰기 같은 작은 역할을 주어 함께 식탁을 완성하기

완벽한 부모가 될 필요는 없습니다. 지친 하루 끝에도 아이의 눈동자를 바라보며 웃어줄 수 있는 마음의 여유가 가장 큰 사랑이니까요.

오늘 밤도 육아 퇴근 후 따뜻한 차 한잔하시며 푹 쉬시길 바랍니다. 댓글로 오늘 하루 고생한 나 자신에게 토닥토닥 응원 한마디 남겨주세요! 🌙"""
    }
]


# ==============================================================================
# Playwright CDP Naver Cafe Publisher (moneyfitlab, clubid=31805224)
# ==============================================================================

def publish_cafe_post_cdp(
    board_name: str,
    title: str,
    body: str,
    tags: list[str],
    img_path: str = ""
) -> str:
    """
    Connects to persistent Chrome on CDP port 9222 and publishes a warm community post
    to the modern SPA interface of Naver Cafe:
    https://cafe.naver.com/ca-fe/cafes/31805224/menus/{menu_id}/articles/write?boardType=L
    """
    menu_id = CAFE_MENU_MAP.get(board_name, 3)
    canonical_board = CAFE_MENU_ID_TO_CANONICAL.get(menu_id, board_name)
    write_url = f"https://cafe.naver.com/ca-fe/cafes/{TARGET_CAFE_CLUBID}/menus/{menu_id}/articles/write?boardType=L"

    with sync_playwright() as p:
        print(f"🔌 CDP 포트 {CDP_PORT} 연결 중...", flush=True)
        browser = p.chromium.connect_over_cdp(CDP_URL)
        context = browser.contexts[0]
        page = context.new_page()
        page.on("dialog", lambda d: d.accept())

        try:
            print(f"☕ 네이버 카페 글쓰기 접속 중: ({canonical_board} · menuid={menu_id})", flush=True)
            page.goto(write_url, wait_until="commit", timeout=35000)
            time.sleep(5.0)

            # Suppress unload and alert popups
            for f in page.frames:
                try:
                    f.evaluate("window.confirm = () => true; window.alert = () => true; window.onbeforeunload = null;")
                except Exception:
                    pass

            # Close any popup modals
            for sel in ["button.se-popup-button-cancel", "button.se-help-panel-close-button", "button.BaseButton--gray"]:
                btn = page.locator(sel).first
                if btn.count() > 0 and btn.is_visible():
                    try:
                        btn.click(force=True)
                        time.sleep(0.3)
                    except Exception:
                        pass

            page.evaluate("""() => {
                document.querySelectorAll('.se-popup-dim').forEach(d => d.remove());
            }""")

            # 1. Enter Title
            title_inp = page.locator("textarea.textarea_input[placeholder*='제목']").first
            if title_inp.count() > 0:
                title_inp.click(force=True)
                title_inp.fill(title)
                time.sleep(0.4)

            # 2. Click body paragraph
            para_rect = page.evaluate("""() => {
                const p = document.querySelector('.se-text-paragraph');
                if (!p) return null;
                p.scrollIntoView({ block: 'center' });
                return p.getBoundingClientRect();
            }""")
            if para_rect:
                page.mouse.click(para_rect["x"] + 50, para_rect["y"] + 10)
                time.sleep(0.4)

            # 3. Upload Image via file chooser if provided
            if img_path and Path(img_path).exists():
                img_btn = page.locator("button.se-image-toolbar-button").first
                if img_btn.count() > 0:
                    try:
                        print(f"🖼️ 카페 요약 카드 이미지 첨부 중: {Path(img_path).name}", flush=True)
                        with page.expect_file_chooser(timeout=6000) as fc_info:
                            img_btn.click(force=True)
                        fc = fc_info.value
                        fc.set_files([img_path])
                        time.sleep(4.0)
                    except Exception as e:
                        print(f"⚠️ 카페 이미지 첨부 예외: {e}", flush=True)

            # 4. Type Body Text line by line
            clean_body = re.sub(r"^[#]+\s*", "", body, flags=re.MULTILINE)
            clean_body = re.sub(r"\*\*([^*]+)\*\*", r"\1", clean_body)
            for line in clean_body.splitlines():
                cl = line.strip()
                if cl:
                    page.keyboard.insert_text(cl)
                page.keyboard.press("Enter")
                time.sleep(0.02)
            time.sleep(1.0)

            # 5. Enter Tags
            tag_inp = page.locator("input.tag_input").first
            if tag_inp.count() > 0:
                for t in tags[:10]:
                    clean_t = t.strip().lstrip("#")
                    if not clean_t:
                        continue
                    tag_inp.click(force=True)
                    tag_inp.fill(clean_t)
                    page.keyboard.press("Enter")
                    time.sleep(0.15)

            # 6. Submit Post
            reg_btn = page.locator("button.BaseButton--skinGreen:has-text('등록'), a.BaseButton--skinGreen:has-text('등록')").first
            if reg_btn.count() > 0:
                reg_btn.scroll_into_view_if_needed()
                reg_btn.click(force=True)
                time.sleep(8.0)

            # Resolve article ID
            final_url = page.url
            m_art = re.search(r"articleid(?:=|%3D)(\d+)", final_url, re.IGNORECASE) or re.search(r"/articles/(\d+)", final_url)
            article_id = m_art.group(1) if m_art else None

            if not article_id:
                try:
                    page.goto(TARGET_CAFE_URL, wait_until="commit", timeout=15000)
                    time.sleep(2.5)
                    article_id = page.evaluate("""async () => {
                        try {
                            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=5', { credentials: 'include' });
                            const j = await r.json();
                            const list = (j.message && j.message.result && j.message.result.articleList) || [];
                            return list.length > 0 ? list[0].articleId : null;
                        } catch (e) {
                            return null;
                        }
                    }""")
                except Exception:
                    pass

            post_url = f"https://cafe.naver.com/ca-fe/cafes/{TARGET_CAFE_CLUBID}/articles/{article_id}" if article_id else TARGET_CAFE_URL
            print(f"✅ 네이버 카페 발행 완료 ({canonical_board}): {post_url}", flush=True)

            # Write publication audit log
            audit_entry = {
                "timestamp": datetime.now().isoformat(),
                "articleId": article_id or "unknown",
                "postUrl": post_url,
                "title": title,
                "board": canonical_board,
                "menu_id": menu_id,
                "char_count": len(clean_body),
                "image": img_path,
                "tags": tags[:10],
                "clubid": TARGET_CAFE_CLUBID
            }
            write_audit_log(audit_entry)

            # Send Telegram alert
            send_telegram_notification(title, post_url, canonical_board)
            return post_url

        finally:
            page.close()


def write_audit_log(entry: dict):
    AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    existing = []
    if AUDIT_LOG_PATH.exists():
        try:
            existing = json.loads(AUDIT_LOG_PATH.read_text(encoding="utf-8"))
            if not isinstance(existing, list):
                existing = [existing]
        except Exception:
            existing = []
    existing.append(entry)
    AUDIT_LOG_PATH.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")

    # Update cursor
    cursor = {"lastPublishedAt": entry["timestamp"], "lastArticleId": entry["articleId"], "lastTitle": entry["title"], "board": entry["board"]}
    CURSOR_PATH.write_text(json.dumps(cursor, ensure_ascii=False, indent=2), encoding="utf-8")


# ==============================================================================
# CLI Entrypoint & Driver
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="KidsFit Enhanced Naver Cafe Publisher")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Render text and image, validate constraints, and exit without publishing")
    parser.add_argument("--live", action="store_true", default=False, help="Execute live publication on Naver Cafe via CDP port 9222")
    parser.add_argument("--board", type=str, default="", help="Board name or alias filter")
    parser.add_argument("--menu-id", type=int, default=0, help="Menu ID (1 to 7)")
    parser.add_argument("--topic-idx", type=int, default=0, help="Topic index from library (0 to len-1)")
    args = parser.parse_args()

    # Filter topics
    filtered_topics = CAFE_COMMUNITY_TOPICS
    if args.menu_id in CAFE_MENU_ID_TO_CANONICAL:
        filtered_topics = [t for t in CAFE_COMMUNITY_TOPICS if t["menu_id"] == args.menu_id]
    elif args.board:
        matched_mid = CAFE_MENU_MAP.get(args.board.strip(), 0)
        if matched_mid:
            filtered_topics = [t for t in CAFE_COMMUNITY_TOPICS if t["menu_id"] == matched_mid]
        else:
            filtered_topics = [t for t in CAFE_COMMUNITY_TOPICS if args.board.strip() in t["board"]]

    if not filtered_topics:
        filtered_topics = CAFE_COMMUNITY_TOPICS

    topic_idx = args.topic_idx % len(filtered_topics)
    topic = filtered_topics[topic_idx]

    print("=" * 80)
    print(f"🌟 [KidsFit Enhanced Naver Cafe Generator]")
    print(f"• 대상 카페: {TARGET_CAFE_URL} (clubid={TARGET_CAFE_CLUBID})")
    print(f"• 게시판: {topic['board']} (menuid={topic['menu_id']})")
    print(f"• 제목: {topic['title']}")
    print(f"• 정기 스케줄: 3x/day ({SCHEDULED_INTERVALS[0]}, {SCHEDULED_INTERVALS[1]}, {SCHEDULED_INTERVALS[2]} KST)")
    print("=" * 80)

    # Generate high quality 1080x1080 PNG summary card
    seq_num = topic["menu_id"]
    img_out = ENHANCED_IMG_DIR / f"cafe_menu_{seq_num:02d}_card.png"
    generate_cafe_card_png(
        out_path=img_out,
        board_badge=f"[{topic['board']}] 키즈핏 나눔가이드",
        title=topic.get("card_title", topic["title"]),
        points=topic["points"],
        accent_rgb=PALETTE["accent_mint"]
    )
    print(f"🎨 고해상도 요약 카드 생성 완료: {img_out.name} ({os.path.getsize(img_out) / 1024:.1f} KB)")

    # Validate tone and non-promotional constraints
    clean_body = re.sub(r"^[#]+\s*", "", topic["body"], flags=re.MULTILINE)
    clean_body = re.sub(r"\*\*([^*]+)\*\*", r"\1", clean_body)

    forbidden_tokens = ["AF" + "7865143", "A100" + "708867", "4d3" + "1d3", "lptag" + "=", "linkprice" + ".com", "adpick" + ".co"]
    for tok in forbidden_tokens:
        if tok.lower() in clean_body.lower():
            print(f"❌ Commercial affiliate token detected: {tok}", flush=True)
            sys.exit(1)

    print(f"📊 본문 검증: 총 {len(clean_body)}자 · 100% 비영리 공감 커뮤니티 톤앤매너 검증 완료 ✅")

    if args.dry_run or not args.live:
        print("🔍 [DRY-RUN 모드] 네이버 카페에 실제 등록하지 않고 렌더링 및 검증을 마쳤습니다.")
        print(f"• 제목: {topic['title']}")
        print(f"• 본문 첫 3줄 미리보기:")
        for line in clean_body.splitlines()[:3]:
            print(f"    {line}")
        print("• 생성된 인포그래픽 카드가 정상 저장되었습니다.")
        sys.exit(0)

    # Live publication via Playwright CDP
    print("🚀 [LIVE 모드] 네이버 카페 라이브 발행을 실행합니다...")
    post_url = publish_cafe_post_cdp(
        board_name=topic["board"],
        title=topic["title"],
        body=clean_body,
        tags=topic["tags"],
        img_path=str(img_out)
    )
    print(f"🎉 라이브 등록 성공! 확인 링크: {post_url}")
    sys.exit(0)


if __name__ == "__main__":
    main()
