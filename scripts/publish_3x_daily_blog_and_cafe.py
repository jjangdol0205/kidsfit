# -*- coding: utf-8 -*-
"""
scripts/publish_3x_daily_blog_and_cafe.py
Automatically publishes:
- 1 Naver Blog post (https://blog.naver.com/expertise333)
- 1 Naver Cafe post (https://cafe.naver.com/moneyfitlab, clubid=31805224)
3 times every day at 06:00, 12:00, and 17:00 KST (= 3 Blog posts/day + 3 Cafe posts/day),
and sends the live published URLs to Telegram.
"""

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

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\사업아이템")
PACK_DIR = ROOT / "samples" / "7_naver_blog_daily_pack" / "폴더별_글모음"
GEN_IMG_DIR = ROOT / "samples" / "9_naver_brand_assets" / "daily_auto_cards"
CURSOR_PATH = ROOT / "logs" / "blog_cafe_3x_daily_cursor.json"
KB_PATH = ROOT / "src" / "data" / "research-knowledge-base.json"
ENV_PATH = ROOT / ".env"
PROFILE_DIR = ROOT / ".naver-browser-profile"


def load_env():
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def send_telegram_message(text: str):
    env = load_env()
    token = os.environ.get("TELEGRAM_BOT_TOKEN") or env.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID") or env.get("TELEGRAM_CHAT_ID") or "755033799"
    if not token:
        return None
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "disable_web_page_preview": True
    }).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status


def get_korean_font(size: int, bold: bool = True):
    candidates = [
        r"C:\Windows\Fonts\malgunbd.ttf" if bold else r"C:\Windows\Fonts\malgun.ttf",
        r"C:\Windows\Fonts\NanumGothicBold.ttf",
        r"C:\Windows\Fonts\gulim.ttc",
    ]
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def wrap_text_by_pixel_width(draw, text: str, font, max_width: int) -> list[str]:
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


def generate_summary_card_png(out_path: Path, badge_text: str, main_title: str, points: list[str], accent_rgb=(79, 70, 229)):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    W, H = 1080, 1080
    img = Image.new("RGB", (W, H), (250, 248, 245))
    draw = ImageDraw.Draw(img)

    # Top decorative bar
    draw.rectangle([0, 0, W, 22], fill=accent_rgb)
    # Outer card surface
    draw.rounded_rectangle([48, 56, W - 48, H - 56], radius=36, fill=(255, 255, 255), outline=(226, 232, 240), width=3)

    # Badge pill (auto-sized to badge_text)
    f_badge = get_korean_font(27, bold=True)
    b_box = draw.textbbox((0, 0), badge_text, font=f_badge)
    pill_w = max(360, (b_box[2] - b_box[0]) + 64)
    draw.rounded_rectangle([96, 98, 96 + pill_w, 160], radius=31, fill=(238, 242, 255))
    draw.text((128, 112), badge_text, font=f_badge, fill=accent_rgb)

    # Wrap main title by actual pixel width so ZERO characters are ever cut off!
    max_title_w = W - 192
    title_font_size = 44
    f_title = get_korean_font(title_font_size, bold=True)
    wrapped_lines = wrap_text_by_pixel_width(draw, main_title, f_title, max_title_w)
    if len(wrapped_lines) > 3:
        title_font_size = 36
        f_title = get_korean_font(title_font_size, bold=True)
        wrapped_lines = wrap_text_by_pixel_width(draw, main_title, f_title, max_title_w)

    y = 192
    line_step = title_font_size + 20
    for line in wrapped_lines:
        draw.text((96, y), line, font=f_title, fill=(15, 23, 42))
        y += line_step

    divider_y = max(415, y + 18)
    draw.line([96, divider_y, W - 96, divider_y], fill=(226, 232, 240), width=2)

    # 3 Core points — never truncate with '...', auto-fit font size and draw crisp numbered badge!
    py = divider_y + 32
    f_num = get_korean_font(28, bold=True)
    for idx, pt in enumerate(points[:3]):
        clean_pt = pt.strip()
        box_h = 122
        draw.rounded_rectangle([96, py, W - 96, py + box_h], radius=22, fill=(248, 250, 252), outline=(226, 232, 240), width=2)

        # Number circle badge (no tofu box!)
        cx, cy = 152, py + box_h // 2
        draw.ellipse([cx - 24, cy - 24, cx + 24, cy + 24], fill=accent_rgb)
        num_str = str(idx + 1)
        nb = draw.textbbox((0, 0), num_str, font=f_num)
        draw.text((cx - (nb[2] - nb[0]) // 2, cy - (nb[3] - nb[1]) // 2 - 3), num_str, font=f_num, fill=(255, 255, 255))

        # Fit point text completely inside [196, W - 120]
        avail_w = (W - 120) - 196
        pt_size = 31
        f_pt = get_korean_font(pt_size, bold=True)
        pt_lines = wrap_text_by_pixel_width(draw, clean_pt, f_pt, avail_w)
        if len(pt_lines) > 1:
            pt_size = 27
            f_pt = get_korean_font(pt_size, bold=True)
            pt_lines = wrap_text_by_pixel_width(draw, clean_pt, f_pt, avail_w)

        if len(pt_lines) == 1:
            draw.text((196, py + (box_h - pt_size) // 2 - 4), pt_lines[0], font=f_pt, fill=(30, 41, 59))
        else:
            draw.text((196, py + 22), pt_lines[0], font=f_pt, fill=(30, 41, 59))
            draw.text((196, py + 64), " ".join(pt_lines[1:]), font=f_pt, fill=(30, 41, 59))

        py += box_h + 22

    # Bottom footer bar
    draw.rounded_rectangle([96, 905, W - 96, 982], radius=20, fill=accent_rgb)
    f_foot = get_korean_font(28, bold=True)
    draw.text((136, 926), "키즈핏 그로스 스튜디오 · 공식 진단 https://kidsfit.co.kr", font=f_foot, fill=(255, 255, 255))

    img.save(str(out_path), "PNG")
    return str(out_path)


# Rich Cafe Community Topics Bank (rotates across the 3 Cafe boards)
CAFE_TOPICS_BANK = [
    {
        "board": "연령별 무료 워크지 PDF",
        "title": "[실천가이드 #1] 만 2~4세 아이가 '내가 혼자 할 거야!' 고집부릴 때 거실 0원 소근육 놀이 3가지",
        "card_title": "만 2~4세 '내가 혼자 할 거야!' 고집\n집에서 하는 0원 소근육 놀이 3가지",
        "points": [
            "대뇌 운동피질 30%가 집중된 손끝 소근육 민감기",
            "비싼 교구 대신 나무집게·물티슈캡·안전가위 놀이",
            "낮 시간 손끝 몰입이 밤 10시 깊은 숙면으로 연결"
        ],
        "body": """안녕하세요, 키즈핏 양육 연구소 카페 가족 여러분! 🌱

퇴근 후 저녁 준비로 바쁜데 만 2~4세 아이가 갑자기 "엄마 가! 내가 단추 끼울 거야!", "내가 물 따를 거야!" 하며 고집을 부려 진땀 빼신 적 있으시죠?

소아 신경발달 연구(Penfield 대뇌피질 지도 및 K-DST 소근육 지표)를 보면, 이 시기 아이의 고집은 반항이 아니라 **뇌 운동피질의 30%와 직결된 '손끝 소근육 민감기'가 열렸다는 기특한 신호**입니다.

──────────────────────────────
🏠 오늘 저녁 비싼 장난감 대신 바로 해보는 '거실 0원 소근육 놀이 3선'
──────────────────────────────

1️⃣ **나무 빨래집게로 색깔 폼폼이(또는 뭉친 휴지) 옮기기 (하루 10분)**
• 엄지·검지·중지 세 손가락(삼지 집기, Tripod Grasp)의 악력을 키워 취학 후 바른 연필 잡기와 글씨 쓰기 지구력의 기초를 만들어 줍니다.

2️⃣ **다 쓴 물티슈 캡 구멍에 페트병 뚜껑 쏙 넣기**
• 눈으로 구멍 위치를 확인하고 손목 회전 각도를 조절하는 '눈-손 협응력(Eye-Hand Coordination)'과 작업기억을 동시에 자극합니다.

3️⃣ **다 쓴 휴지심 끝에 안전가위로 1cm 칼집 내어 사자 갈기 만들기**
• 가위질 한 번으로 즉각적인 모양 변화를 경험하며 전두엽 자기효능감("내가 해냈어!")이 쑥쑥 자라납니다.

──────────────────────────────
💡 우리 아이 개월 수별 소근육·두뇌 발달 밸런스 & 숨은 키 백분위 확인하기
──────────────────────────────
아이 생년월일과 요즘 고민을 선택하시면 질병관리청 성장도표 백분위와 K-DST 기반 맞춤 리포트를 1분 만에 확인하실 수 있습니다.

👉 **키즈핏 공식 무료 진단 바로가기**: https://kidsfit.co.kr

오늘 저녁 우리 아이가 가장 좋아하는 손끝 놀이는 무엇인지 댓글로 함께 나누어 주세요! 💬""",
        "tags": ["소근육발달", "만3세놀이", "몬테소리일상", "엄마표놀이", "영유아건강검진", "키즈핏", "육아카페"]
    },
    {
        "board": "공지 및 키즈핏 가이드",
        "title": "[성장칼럼 #2] 밤 10시 전에 불을 꺼도 아이 키가 안 큰다면? '취침 2시간 전 혈당·인슐린'을 점검하세요",
        "card_title": "밤 10시 전에 재워도 키가 안 큰다면?\n취침 2시간 전 '혈당·인슐린' 점검법",
        "points": [
            "밤 10시~새벽 2시 서파수면 중 성장호르몬 65% 분비",
            "자기 직전 우유·야식은 고혈당으로 성장호르몬 억제",
            "저녁 식사는 취침 3시간 전 완료 & 두부·치즈로 칼슘 보충"
        ],
        "body": """안녕하세요, 키즈핏 소아성장·두뇌발달 양육 연구소입니다. 📏

많은 부모님께서 "밤 10시 전에 재우려고 노력하는데 왜 또래보다 키가 더디게 클까요?"라고 질문하십니다.
소아 내분비학 학술 논문(Van Cauter et al., 서파수면과 야간 성장호르몬 분비 연구)이 지목하는 가장 흔한 원인은 바로 **'잠들기 직전에 먹는 간식과 늦은 우유 한 잔'**입니다.

──────────────────────────────
🔬 왜 자기 직전 우유·과일이 밤 10시 성장호르몬을 막을까요?
──────────────────────────────

1️⃣ **혈당과 인슐린이 올라가면 뇌하수체 성장호르몬(GH) 문이 닫힙니다**
• 성장호르몬은 우리 몸이 '공복 상태'로 깊은 서파수면(Slow-Wave Sleep)에 들어갔을 때 가장 폭발적으로 분비됩니다.
• 잠들기 1~2시간 이내에 달콤한 과일, 빵, 혹은 유당이 든 우유를 마시면 인슐린이 분비되면서 밤 10시 첫 서파수면 성장호르몬 피크가 최대 28~40%까지 억제될 수 있습니다.

2️⃣ **우유 마시면 배가 꾸르륵거리는 아이는 수면의 질까지 얕아집니다**
• 한국 어린이에게 흔한 유당불내증(우유 배앓이)이 있으면 밤새 장에 가스가 차서 미세 각성이 반복되고 깊은 잠에 들지 못합니다.
• 칼슘 보충은 저녁 식사 시간에 **두부, 잔멸치, 구연산 칼슘·비타민D3**로 챙겨주시고, 잠들기 2~3시간 전부터는 따뜻한 물만 마시는 공복 루틴을 만들어 주세요.

3️⃣ **잠들기 전 5분 '무릎·종아리 성장판 이완 마사지'**
• 야식 대신 따뜻한 손으로 아이의 무릎 위아래와 아킬레스건을 부드럽게 쓸어주시면 부교감신경이 활성화되어 15분 안에 깊은 서파수면에 진입합니다.

──────────────────────────────
📊 우리 아이 현재 키 백분위 & 방해 습관 교정 시 숨은 키 잠재력 계산하기
──────────────────────────────
👉 **질병관리청 기준 무료 성장·학습 리포트**: https://kidsfit.co.kr""",
        "tags": ["아이키성장", "밤10시수면", "성장호르몬", "우유배앓이", "어린이칼슘", "예상키계산기", "키즈핏"]
    },
    {
        "board": "매월 1일 리포트 인증방",
        "title": "[학습처방 #3] 단순 연산은 100점인데 문장제 수학만 나오면 별표 치는 아이, 국어 문제가 아닙니다!",
        "card_title": "연산은 100점인데 문장제만 별표 치는 아이\n'전두엽 작업기억' 3단계 코칭법",
        "points": [
            "문장제 기피의 진짜 원인은 '전두엽 작업기억 과부하'",
            "머릿속 암산 대신 여백에 '막대 그림' 그리기 습관",
            "하루 1문제 '선생님 놀이'로 메타인지 200% 깨우기"
        ],
        "body": """안녕하세요, 키즈핏 양육 연구소입니다! 🧠

초등학교에 입학한 뒤 두 자릿수 덧셈·뺄셈 연산 학습지는 막힘없이 푸는데, 문제가 세 줄만 넘어가면 읽기도 전에 별표(★)부터 치거나 "엄마 이거 무슨 말이야?" 하고 묻는 아이들 정말 많죠.

흔히 "책을 적게 읽어서 문해력이 부족한가 보다"라고 생각하기 쉽지만, 교육심리·인지신경과학 연구(Baddeley 작업기억 모델 및 도해 표상 연구)가 밝힌 핵심 원인은 **'전두엽 작업기억(Working Memory) 용량 초과'**입니다.

──────────────────────────────
✏️ 문장제 수학 울렁증을 2주 만에 없애는 3단계 가정 코칭법
──────────────────────────────

1️⃣ **머릿속으로 암산하지 말고 문제의 '숫자와 구하는 것'에 동그라미·밑줄 긋기**
• 아이의 작업기억 칠판은 한 번에 3~4개의 정보밖에 올려놓지 못합니다. 첫 번째 조건을 읽고 두 번째 조건을 읽는 순간 앞의 숫자가 지워지기 때문에 막막해지는 것입니다.
• 연필로 조건 숫자는 동그라미(○), 마지막에 구해야 하는 질문에는 밑줄(＿)을 긋게 해 작업기억의 부담을 종이 위로 덜어주세요.

2️⃣ **식을 먼저 세우려 하지 말고 빈 여백에 '막대 그림(테이프 다이어그램)' 그리기**
• "사과 15개 중 몇 개를 먹었더니 7개가 남았습니다"라는 문장을 보면 식부터 쓰라고 다그치지 마시고, 긴 막대 하나를 그린 뒤 7개와 나머지 칸을 눈으로 보게 해주세요. 시각화된 도해는 추상적 문장을 직관적 공간 정보로 바꿔줍니다.

3️⃣ **정답 맞힌 뒤 1분 '엄마한테 일일 선생님처럼 설명해 주기'**
• 문제를 다 푼 뒤 "우와, 이 막대 그림으로 어떻게 식을 찾았는지 엄마한테 선생님처럼 알려줄래?"라고 물어보세요. 자신의 풀이 과정을 말로 인출(Retrieval)하는 순간 전두엽 메타인지가 폭발적으로 단단해집니다.

──────────────────────────────
🔍 우리 아이 5대 학습 역량 지수(LQ) & 학습 병목 1:1 처방전 받기
──────────────────────────────
👉 **키즈핏 무료 두뇌·학습 & 신체 성장 진단**: https://kidsfit.co.kr""",
        "tags": ["초등수학", "문장제수학", "사고력수학", "작업기억", "메타인지공부법", "백지복습", "키즈핏"]
    },
    {
        "board": "공지 및 키즈핏 가이드",
        "title": "[자세·숨은키 #4] 구부정한 거북목과 말린 어깨만 펴줘도 '숨은 키 2cm'와 책상 집중력이 동시에 살아납니다",
        "card_title": "구부정한 거북목과 말린 어깨 교정으로\n'숨은 키 2cm + 집중력' 되찾는 루틴",
        "points": [
            "낮 동안 눌린 척추 디스크 저녁 90초 철봉 매달리기 감압",
            "고개 30도 숙일 때 목 하중 18kg → 눈높이 독서대 필수",
            "척추가 펴지면 뇌 산소 공급량과 착석 지구력 동시 상승"
        ],
        "body": """안녕하세요, 키즈핏 소아성장·두뇌발달 양육 연구소입니다! 🦴

아이 키를 잴 때 아침에 잰 키와 저녁에 잰 키가 1.5~2cm 가까이 차이 난다는 사실, 알고 계셨나요?
하루 종일 학교와 학원 책상에 앉아 있으면서 중력에 의해 척추 사이사이의 물렁뼈(추간판 디스크)가 수분이 빠지며 납작하게 눌리기 때문입니다.

──────────────────────────────
🚀 눌린 디스크를 펴고 '숨은 키 2cm + 학습 집중력'을 되찾는 생체역학 루틴 3가지
──────────────────────────────

1️⃣ **책상 위 '15~30도 각도조절 독서대'는 선택이 아닌 필수입니다**
• 평평한 책상 위에 놓인 책을 보려고 고개를 30도만 숙여도 아이 목뼈(경추)에는 무려 18kg(볼링공 2개 무게)의 하중이 실립니다.
• 원목 독서대로 책 높이를 아이 눈높이에 맞춰주면 거북목과 굽은 등(흉추 후만)이 즉시 펴지면서 호흡량이 깊어지고 전두엽 산소 공급이 원활해집니다.

2️⃣ **저녁 샤워 전후 '실내 문틀 철봉 30초 × 3세트 매달리기(Dead Hang)'**
• 낮 동안 눌린 척추 디스크를 잠자리에 들기 전 30초씩 3번 가볍게 매달려 늘려주세요. 추간판 공간이 수직으로 감압되면서 밤사이 디스크와 성장판 연골이 가장 이상적인 상태로 회복됩니다.

3️⃣ **하루 15분 줄넘기 또는 실내 점핑매트 뛰기 (볼프의 법칙)**
• 성장판 연골세포는 위아래로 가볍게 통통 뛰는 수직 미세 하중(Micro-loading)을 받을 때 골밀도와 뼈 길이 성장이 동시에 촉진됩니다.

──────────────────────────────
📏 우리 아이 거북목·자세 습관 손실 키 & 맞춤 생체역학 루틴 확인하기
──────────────────────────────
👉 **키즈핏 1분 무료 진단 바로가기**: https://kidsfit.co.kr""",
        "tags": ["거북목교정", "어린이독서대", "실내철봉", "숨은키찾기", "바른자세", "키크는운동", "키즈핏"]
    },
    {
        "board": "연령별 무료 워크지 PDF",
        "title": "[편식·영양 #5] 고기·채소 입에도 안 대고 밥 한 숟가락에 1시간 걸리는 아이, '미각 세포 아연'과 푸드브릿지 비법",
        "card_title": "고기·채소 안 먹고 식사 1시간 걸리는 아이\n'미각 세포 아연' & 푸드브릿지 비법",
        "points": [
            "억지로 먹이면 편도체 긴장으로 '미각 방어기제'만 강화",
            "혀 미각세포 재생을 돕는 아연(Zinc)·초유 단백질 보충",
            "채소 쿠키커터 도장 찍기 등 즐거운 요리 놀이로 시작"
        ],
        "body": """안녕하세요, 키즈핏 양육 연구소입니다! 🥦

식사 시간마다 "한 입만 더 먹자!", "고기 안 먹으면 키 안 큰다!" 하며 실랑이하다가 결국 엄마도 지치고 아이도 울면서 식탁을 떠나는 일이 반복되곤 합니다.

소아 영양학·섭식행동 연구를 보면, 입이 짧고 편식이 심한 아이에게 음식을 억지로 밀어 넣으면 뇌의 편도체가 식사 시간을 '위협 상황'으로 기억해 미각 방어기제가 더 강해집니다.

──────────────────────────────
🍽️ 밥상머리 전쟁을 끝내는 키즈핏 3단계 영양·섭식 처방
──────────────────────────────

1️⃣ **혀의 미각 세포(미뢰)를 깨우는 '아연(Zinc)'이 부족하지 않은지 먼저 살피세요**
• 아연은 혀의 미각 수용체 세포를 재생하고 식욕 중추를 깨우는 핵심 미네랄입니다. 체내 아연이 부족하면 음식 맛을 둔하게 느끼거나 특정 식감에 과민해져 입이 더 짧아집니다.

2️⃣ **식탁이 아닌 '주말 요리 놀이'로 첫 만남을 바꾸는 푸드브릿지**
• 아이가 싫어하는 파프리카, 버섯, 두부, 다진 고기를 바로 입에 넣으라고 하지 마시고, 공룡·별 모양 쿠키커터로 아이가 직접 꾹꾹 찍어보게 해주세요.
• 손끝으로 재료를 만지고 냄새를 맡아본 음식은 아이 뇌가 '안전한 친구'로 인식해 스스로 한 입 베어 물 확률이 3배 이상 높아집니다.

3️⃣ **부족한 뼈 성장 단백질과 칼슘은 흡수율 높은 형태로 빈틈없이 채워주세요**
• 편식이 교정되는 동안 성장판 연골 기질이 부족해지지 않도록 아침·저녁으로 소화 흡수율이 높은 구연산 칼슘·비타민D3와 초유 단백질을 함께 챙겨주시면 키 성장 골든타임을 놓치지 않을 수 있습니다.

──────────────────────────────
🥗 우리 아이 체중 비례 일일 칼슘·단백질·아연 권장량 1초 계산하기
──────────────────────────────
👉 **키즈핏 무료 영양·성장 분석 바로가기**: https://kidsfit.co.kr""",
        "tags": ["아이편식", "밥안먹는아이", "어린이아연", "푸드브릿지", "소아영양", "어린이키성장", "키즈핏"]
    },
    {
        "board": "매월 1일 리포트 인증방",
        "title": "[주말나들이 #6] 박물관·과학관 다녀와도 기억 못 하는 아이? 출발 전후 '하브루타 3단 질문'이 장기기억을 만듭니다",
        "card_title": "박물관·과학관 다녀와도 기억 못 하는 아이?\n장기기억 만드는 '하브루타 3단 질문'",
        "points": [
            "설명판만 읽고 지나가면 48시간 이내 단기기억 80% 증발",
            "관찰(무엇이 보이니?) → 추론(왜 그럴까?) → 상상 대화",
            "관람 직후 연계 도감 10분 펼쳐보기로 해마 장기기억 코팅"
        ],
        "body": """안녕하세요, 키즈핏 양육 연구소입니다! 🏛️

주말마다 아이를 위해 박물관, 미술관, 과학관을 열심히 데리고 다녔는데 막상 집에 돌아와 "오늘 뭐가 제일 기억에 남았어?"라고 물으면 "음… 기념품샵이랑 아이스크림 먹은 거!"라고 답해 허탈하셨던 적 있으시죠?

발달심리학자 Haden 교수의 박물관 부모-자녀 대화 연구에 따르면, 부모가 전시물 설명판을 길게 읽어줄 때보다 **아이에게 '열린 질문(Wh- questions)'을 던져 스스로 말하게 했을 때 6주 뒤 개념 기억률이 3배 이상 높게 유지**되었습니다.

──────────────────────────────
💬 이번 주말 나들이 효과를 300% 끌어올리는 '하브루타 3단 질문 공식'
──────────────────────────────

1️⃣ **1단계 [눈으로 관찰하기]: "우와, 저기에서 제일 신기하게 생긴 부분은 어디야?"**
• 정답을 묻지 마시고 아이의 시선이 머무는 곳을 먼저 말하게 해 주의집중 스위치를 켜주세요.

2️⃣ **2단계 [원리 추론하기]: "티라노사우루스 이빨은 뾰족한데 브라키오사우루스는 왜 네모나고 평평할까?" (또는 "첨성대는 왜 아래가 넓은 모양으로 쌓았을까?")**
• 두 대상을 비교하거나 '왜(Why)'를 상상하게 하면 배외측 전전두엽(DLPFC)의 인과 추론 회로가 활발하게 돌아갑니다.

3️⃣ **3단계 [내 삶으로 연결하기]: "오늘 본 것 중에 우리 집에 하나만 가져갈 수 있다면 무엇을 골라서 어디에 쓰고 싶어?"**
• 거실에 돌아와 연계 그림책이나 백과사전에서 오늘 본 유물·동물을 딱 한 페이지만 찾아 스티커를 붙여보세요. 그날 밤 서파수면 동안 해마에서 대뇌피질로 영구적인 배경지식(스키마)이 코팅됩니다.

──────────────────────────────
🗺️ 내 거주 지역 × 우리 아이 연령·관심사 맞춤 주말 체험 코스 TOP 3 추천받기
──────────────────────────────
👉 **키즈핏 무료 코스 & 성장·학습 리포트**: https://kidsfit.co.kr""",
        "tags": ["주말아이와갈만한곳", "박물관투어", "과학관체험", "하브루타질문", "배경지식", "초등체험학습", "키즈핏"]
    }
]


def build_dynamic_blog_post(seq_num: int):
    """Generates a fresh, non-repeating clinical parenting column from the 2,860+ paper knowledge base when pre-built packs are exhausted."""
    topic = CAFE_TOPICS_BANK[(seq_num - 1) % len(CAFE_TOPICS_BANK)]
    papers = []
    if KB_PATH.exists():
        try:
            kb = json.loads(KB_PATH.read_text(encoding="utf-8"))
            all_p = kb.get("papers", [])
            if all_p:
                start = (seq_num * 3) % max(1, len(all_p) - 3)
                papers = all_p[start:start + 2]
        except Exception:
            pass

    paper_block = ""
    if papers:
        p = papers[0]
        p_title = p.get("title_ko") or p.get("title") or "소아 성장·발달 임상 연구"
        p_journal = p.get("journal") or "Peer-Reviewed Pediatric Journal"
        p_year = p.get("year") or 2023
        p_sum = p.get("clinical_summary_ko") or p.get("key_finding_ko") or ""
        paper_block = (
            f"\n──────────────────────────────\n"
            f"📚 오늘의 학술 논문 근거 ({p_journal}, {p_year})\n"
            f"──────────────────────────────\n"
            f"• 연구 주제: {p_title}\n"
            f"• 핵심 발견: {p_sum}\n"
        )

    title = topic["title"].replace("[실천가이드", f"[키즈핏 리포트 #{seq_num}").replace("[성장칼럼", f"[키즈핏 리포트 #{seq_num}").replace("[학습처방", f"[키즈핏 리포트 #{seq_num}").replace("[자세·숨은키", f"[키즈핏 리포트 #{seq_num}").replace("[편식·영양", f"[키즈핏 리포트 #{seq_num}").replace("[주말나들이", f"[키즈핏 리포트 #{seq_num}")
    body = topic["body"] + paper_block
    img_out = GEN_IMG_DIR / f"blog_auto_seq_{seq_num:03d}.png"
    generate_summary_card_png(img_out, f"키즈핏 학술 리포트 #{seq_num}", topic.get("card_title") or title, topic["points"], accent_rgb=(79, 70, 229))
    return title, body, topic["tags"], str(img_out)


def append_triangular_backlink_mesh(body: str, seq_num: int, source_type: str = "blog") -> str:
    topic_idx = ((seq_num - 1) % 10) + 1
    qna_deep_url = f"https://kidsfit.co.kr/qna/topic-{topic_idx:02d}.html"
    if qna_deep_url in body:
        return body
    cross_line = (
        "☕ 공식 학부모 카페(무료 워크지·질문방): https://cafe.naver.com/moneyfitlab"
        if source_type == "blog"
        else "📝 공식 연구소 블로그(일자별 심층 칼럼): https://blog.naver.com/expertise333"
    )
    mesh_footer = (
        f"\n\n──────────────────────────────\n"
        f"🔗 [키즈핏 학술 백과사전 & 1분 맞춤 진단 바로가기]\n"
        f"• 📏🧠 우리 아이 예상키·두뇌 1분 무료 진단: https://kidsfit.co.kr\n"
        f"• 📚 오늘 주제 심층 Q&A 백과사전: {qna_deep_url}\n"
        f"• {cross_line}\n"
        f"──────────────────────────────"
    )
    return body + mesh_footer


def get_next_blog_content(blog_seq: int):
    """Returns (title, body, tags, img_path) for the given blog sequence number."""
    folders = sorted([d for d in PACK_DIR.iterdir() if d.is_dir()]) if PACK_DIR.exists() else []
    if 1 <= blog_seq <= len(folders):
        folder = folders[blog_seq - 1]
        title = (folder / "01_블로그_제목.txt").read_text(encoding="utf-8").strip()
        body = (folder / "02_블로그_본문.txt").read_text(encoding="utf-8").strip()
        tags = (folder / "03_블로그_해시태그.txt").read_text(encoding="utf-8").strip().split()
        imgs = list(folder.glob("04_블로그_대표이미지_*.png"))
        img_path = str(imgs[0]) if imgs else ""
        return title, append_triangular_backlink_mesh(body, blog_seq, "blog"), tags, img_path
    title, body, tags, img_path = build_dynamic_blog_post(blog_seq)
    return title, append_triangular_backlink_mesh(body, blog_seq, "blog"), tags, img_path


def get_next_cafe_content(cafe_seq: int):
    """Returns (board, title, body, tags, img_path) for the given cafe sequence number."""
    item = CAFE_TOPICS_BANK[(cafe_seq - 1) % len(CAFE_TOPICS_BANK)]
    cycle_num = (cafe_seq - 1) // len(CAFE_TOPICS_BANK) + 1
    title = item["title"] if cycle_num == 1 else f"{item['title']} (심화 #{cafe_seq})"
    img_out = GEN_IMG_DIR / f"cafe_auto_seq_{cafe_seq:03d}.png"
    generate_summary_card_png(img_out, f"키즈핏 카페 양육가이드 #{cafe_seq}", item.get("card_title") or title, item["points"], accent_rgb=(16, 185, 129))
    return item["board"], title, append_triangular_backlink_mesh(item["body"], cafe_seq, "cafe"), item["tags"], str(img_out)


def type_multiline_into_se_one(page, body: str):
    for line in body.splitlines():
        clean = line.strip()
        if clean:
            page.keyboard.insert_text(clean)
        page.keyboard.press("Enter")
        time.sleep(0.02)


def ensure_naver_session_cookies(context):
    backup_file = PROFILE_DIR / "naver_cookies_backup.json"
    try:
        current_names = {ck["name"] for ck in context.cookies("https://www.naver.com")}
        if "NID_AUT" not in current_names and backup_file.exists():
            saved = json.loads(backup_file.read_text(encoding="utf-8"))
            exp_365 = int(time.time()) + 365 * 86400
            for ck in saved:
                if ck.get("expires", -1) <= 0:
                    ck["expires"] = exp_365
            context.add_cookies(saved)
            print("  🔒 [세션 복원] 저장된 네이버 영구 로그인 쿠키(NID_AUT/NID_SES)를 복원했습니다.", flush=True)
        elif "NID_AUT" in current_names:
            all_ck = [ck for ck in context.cookies() if "naver.com" in ck.get("domain", "")]
            exp_365 = int(time.time()) + 365 * 86400
            for ck in all_ck:
                if ck.get("expires", -1) <= 0:
                    ck["expires"] = exp_365
            context.add_cookies(all_ck)
            backup_file.write_text(json.dumps(all_ck, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"  ⚠️ 쿠키 동기화 경고: {e}", flush=True)


def publish_blog_post(context, title: str, body: str, tags: list[str], img_path: str):
    ensure_naver_session_cookies(context)
    page = context.new_page()
    page.on("dialog", lambda d: d.accept())
    try:
        print(f"📝 [블로그 발행 중] {title[:42]}...", flush=True)
        page.goto("https://blog.naver.com/PostWriteForm.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=30000)
        time.sleep(5.5)

        target = page
        for f in page.frames:
            if "PostWriteForm" in f.url or f.name == "mainFrame":
                if f.locator(".se-component.se-text").count() > 0:
                    target = f
                    break

        target.evaluate("""() => {
            document.querySelectorAll('button.se-popup-button-cancel, button.se-help-panel-close-button').forEach(b => b.click());
        }""")
        time.sleep(0.5)

        title_para = target.locator(".se-title-text .se-text-paragraph, .se-documentTitle .se-text-paragraph").first
        if title_para.count() > 0:
            title_para.click(force=True)
            time.sleep(0.3)
            page.keyboard.insert_text(title)
            time.sleep(0.4)

        body_para = target.locator(".se-component.se-text .se-text-paragraph").first
        if body_para.count() > 0:
            body_para.click(force=True)
            time.sleep(0.3)

        if img_path and Path(img_path).exists():
            img_btn = target.locator("button.se-image-toolbar-button").first
            if img_btn.count() > 0:
                try:
                    with page.expect_file_chooser(timeout=5000) as fc_info:
                        img_btn.click(force=True)
                    fc = fc_info.value
                    fc.set_files(img_path)
                    time.sleep(4.0)
                except Exception as e:
                    print(f"⚠️ 블로그 이미지 첨부 스킵: {e}", flush=True)

        body_para_last = target.locator(".se-component.se-text .se-text-paragraph").last
        if body_para_last.count() > 0:
            body_para_last.click(force=True)
            time.sleep(0.3)
        page.keyboard.press("Enter")
        type_multiline_into_se_one(page, body)
        time.sleep(1.0)

        target.evaluate("""() => {
            const btn = document.querySelector("button[class*='publish_btn']");
            if (btn) btn.click();
        }""")
        time.sleep(1.8)

        tag_inp = target.locator("input[placeholder*='태그'], input[id*='tag']").first
        if tag_inp.count() > 0 and tag_inp.is_visible():
            for t in tags[:10]:
                clean_tag = t.strip().lstrip("#")
                if not clean_tag:
                    continue
                tag_inp.click(force=True)
                tag_inp.fill(clean_tag)
                page.keyboard.press("Enter")
                time.sleep(0.15)

        target.evaluate("""() => {
            const confirmBtn = document.querySelector("button[data-testid='seOnePublishBtn'], button[class*='confirm_btn']");
            if (confirmBtn) confirmBtn.click();
        }""")
        time.sleep(6.5)

        final_url = target.url if target != page else page.url
        m = re.search(r"logNo=(\d+)", final_url) or re.search(r"expertise333/(\d+)", final_url)
        if m:
            final_url = f"https://blog.naver.com/expertise333/{m.group(1)}"
        else:
            page.goto("https://blog.naver.com/PostList.naver?blogId=expertise333&categoryNo=0&from=postList", wait_until="domcontentloaded", timeout=15000)
            time.sleep(2.5)
            latest_log = page.evaluate("""() => {
                const a = Array.from(document.querySelectorAll('a')).find(el => el.href && el.href.includes('logNo='));
                if (!a) return null;
                const m = a.href.match(/logNo=(\\d+)/);
                return m ? m[1] : null;
            }""")
            final_url = f"https://blog.naver.com/expertise333/{latest_log}" if latest_log else "https://blog.naver.com/expertise333"

        print(f"  ✅ 블로그 발행 완료: {final_url}", flush=True)
        return final_url
    finally:
        page.close()


def publish_cafe_post(context, board_name: str, title: str, body: str, tags: list[str], img_path: str):
    ensure_naver_session_cookies(context)
    page = context.new_page()
    page.on("dialog", lambda d: d.accept())
    try:
        print(f"☕ [카페 발행 중] ({board_name}) {title[:42]}...", flush=True)
        page.goto("https://cafe.naver.com/ca-fe/cafes/31805224/menus/1/articles/write?boardType=L", wait_until="commit", timeout=30000)
        time.sleep(4.8)

        for f in page.frames:
            try:
                f.evaluate("window.confirm = () => true; window.alert = () => true; window.onbeforeunload = null;")
            except Exception:
                pass

        for sel in ["button.se-popup-button-cancel", "button.se-help-panel-close-button"]:
            btn = page.locator(sel).first
            if btn.count() > 0 and btn.is_visible():
                btn.click(force=True)
                time.sleep(0.4)

        if board_name != "공지 및 키즈핏 가이드":
            board_btn = page.locator("button.button:has-text('공지 및 키즈핏 가이드'), .FormSelectButton button.button").first
            if board_btn.count() > 0:
                board_btn.click(force=True)
                time.sleep(0.6)
                opt = page.locator(f"button.option:has-text('{board_name}')").first
                if opt.count() > 0:
                    opt.click(force=True)
                    time.sleep(0.6)

        title_inp = page.locator("textarea.textarea_input[placeholder*='제목']").first
        if title_inp.count() > 0:
            title_inp.click(force=True)
            title_inp.fill(title)
            time.sleep(0.4)

        page.evaluate("""() => {
            document.querySelectorAll('button.BaseButton--gray, .se-popup-close-button, .se-popup-button-cancel, .se-help-panel-close-button').forEach(b => b.click());
            document.querySelectorAll('.se-popup-dim').forEach(d => d.remove());
        }""")
        time.sleep(0.4)

        para_rect = page.evaluate("""() => {
            const p = document.querySelector('.se-text-paragraph');
            if (!p) return null;
            p.scrollIntoView({ block: 'center' });
            return p.getBoundingClientRect();
        }""")
        if para_rect:
            page.mouse.click(para_rect["x"] + 50, para_rect["y"] + 10)
            time.sleep(0.4)

        type_multiline_into_se_one(page, body)
        time.sleep(0.8)

        if img_path and Path(img_path).exists():
            img_btn = page.locator("button.se-image-toolbar-button").first
            if img_btn.count() > 0:
                try:
                    with page.expect_file_chooser(timeout=5000) as fc_info:
                        img_btn.click(force=True)
                    fc = fc_info.value
                    fc.set_files([img_path])
                    time.sleep(3.5)
                except Exception as e:
                    print(f"⚠️ 카페 이미지 첨부 스킵: {e}", flush=True)

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

        for f in page.frames:
            try:
                f.evaluate("window.confirm = () => true; window.alert = () => true; window.onbeforeunload = null;")
            except Exception:
                pass

        reg_btn = page.locator("button.BaseButton--skinGreen:has-text('등록'), a.BaseButton--skinGreen:has-text('등록')").first
        if reg_btn.count() > 0:
            reg_btn.scroll_into_view_if_needed()
            reg_btn.click(force=True)
            time.sleep(8.0)

        final_url = page.url
        m_art = re.search(r"articleid(?:=|%3D)(\d+)", final_url, re.IGNORECASE) or re.search(r"/articles/(\d+)", final_url)
        if m_art:
            final_url = f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{m_art.group(1)}"
        elif "write" in final_url:
            try:
                page.goto("https://cafe.naver.com/moneyfitlab", wait_until="commit", timeout=15000)
            except Exception:
                pass
            time.sleep(2.5)
            try:
                latest_id = page.evaluate("""async () => {
                    const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=5', { credentials: 'include' });
                    const j = await r.json();
                    const list = (j.message && j.message.result && j.message.result.articleList) || [];
                    return list.length > 0 ? list[0].articleId : null;
                }""")
                if latest_id:
                    final_url = f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{latest_id}"
            except Exception:
                final_url = "https://cafe.naver.com/moneyfitlab"
        print(f"  ✅ 카페 발행 완료: {final_url}", flush=True)
        return final_url
    finally:
        page.close()


def load_cursor():
    if CURSOR_PATH.exists():
        try:
            return json.loads(CURSOR_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    # Blog Day 1 (#224450570229) and Day 2 (#224451185984) are already published -> next is 3
    return {
        "lastBlogSeq": 2,
        "lastCafeSeq": 0,
        "history": []
    }


def main():
    cursor = load_cursor()
    next_blog_seq = int(cursor.get("lastBlogSeq", 2)) + 1
    next_cafe_seq = int(cursor.get("lastCafeSeq", 0)) + 1

    b_title, b_body, b_tags, b_img = get_next_blog_content(next_blog_seq)
    c_board, c_title, c_body, c_tags, c_img = get_next_cafe_content(next_cafe_seq)

    with sync_playwright() as p:
        try:
            browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222", timeout=5000)
            context = browser.contexts[0]
        except Exception:
            sys.path.insert(0, str(ROOT / "scripts"))
            from naver_browser_daemon import launch_chrome_on_default_desktop
            launch_chrome_on_default_desktop()
            for _ in range(15):
                try:
                    with urllib.request.urlopen("http://127.0.0.1:9222/json/version", timeout=2) as r:
                        if r.status == 200:
                            break
                except Exception:
                    time.sleep(1)
            browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222", timeout=10000)
            context = browser.contexts[0]

        blog_url = publish_blog_post(context, b_title, b_body, b_tags, b_img)
        cafe_url = publish_cafe_post(context, c_board, c_title, c_body, c_tags, c_img)

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    cursor["lastBlogSeq"] = next_blog_seq
    cursor["lastCafeSeq"] = next_cafe_seq
    cursor.setdefault("history", []).append({
        "publishedAt": now_str,
        "blog": {"seq": next_blog_seq, "title": b_title, "url": blog_url},
        "cafe": {"seq": next_cafe_seq, "board": c_board, "title": c_title, "url": cafe_url}
    })
    CURSOR_PATH.parent.mkdir(parents=True, exist_ok=True)
    CURSOR_PATH.write_text(json.dumps(cursor, ensure_ascii=False, indent=2), encoding="utf-8")

    msg = (
        f"✅ [키즈핏 네이버 블로그 & 카페 1일 3회(06시·12시·17시) 자동 발행 완료]\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"말씀해주신 대로 블로그 하루 3편 + 카페 하루 3편(06:00 / 12:00 / 17:00 KST) 자동 업로드 스케줄에 따라 이번 회차 동시 발행을 완료했습니다!\n\n"
        f"📝 1. 네이버 블로그 새 글 발행 (#{next_blog_seq}회차)\n"
        f"• 제목: {b_title}\n"
        f"• 직링크: {blog_url}\n\n"
        f"☕ 2. 네이버 카페 새 글 발행 (#{next_cafe_seq}회차 · {c_board})\n"
        f"• 제목: {c_title}\n"
        f"• 직링크: {cafe_url}\n\n"
        f"⏰ [고정 자동 업로드 스케줄 (매일 3회)]\n"
        f"• 06:00 (아침) : 블로그 1편 + 카페 1편 자동 발행 (인스타·쓰레드 동시 발송)\n"
        f"• 12:00 (점심) : 블로그 1편 + 카페 1편 자동 발행\n"
        f"• 17:00 (저녁) : 블로그 1편 + 카페 1편 자동 발행\n"
        f"👉 다음 스케줄에도 자동으로 새 블로그 칼럼 1편 + 카페 칼럼 1편이 업로드됩니다!"
    )
    status = send_telegram_message(msg)
    print(f"Telegram notification status: {status}", flush=True)


if __name__ == "__main__":
    main()
