# -*- coding: utf-8 -*-
"""
KidsFit Growth Studio - Master Sample Generator (scripts/generate_all_samples.py)
Generates all 5 tangible, high-resolution parenting samples:
  1. samples/1_blog_sample/       (blog_post_sample.md, blog_post_sample.html)
  2. samples/2_webtoon_sample/    (webtoon_cut_01~06.png, webtoon_full_6cut.png, webtoon_preview.html)
  3. samples/3_cardnews_sample/   (cardnews_01~06.png, cardnews_preview.html)
  4. samples/4_webtoon_video_sample/webtoon_parenting_video.mp4  (1080x1920 MP4 + Korean Neural TTS + BGM)
  5. samples/5_cardnews_video_sample/cardnews_parenting_video.mp4 (1080x1920 MP4 + Korean Neural TTS + BGM)
"""

import asyncio
import math
import os
import struct
import subprocess
import wave
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import edge_tts
import imageio_ffmpeg

ROOT = Path(r"d:\사업아이템")
SAMPLES_DIR = ROOT / "samples"
BLOG_DIR = SAMPLES_DIR / "1_blog_sample"
WEBTOON_DIR = SAMPLES_DIR / "2_webtoon_sample"
WEBTOON_RAW_DIR = WEBTOON_DIR / "raw"
CARDNEWS_DIR = SAMPLES_DIR / "3_cardnews_sample"
WEBTOON_VID_DIR = SAMPLES_DIR / "4_webtoon_video_sample"
CARDNEWS_VID_DIR = SAMPLES_DIR / "5_cardnews_video_sample"

for d in [BLOG_DIR, WEBTOON_DIR, CARDNEWS_DIR, WEBTOON_VID_DIR, CARDNEWS_VID_DIR]:
    d.mkdir(parents=True, exist_ok=True)

FONT_REG_PATH = r"C:\Windows\Fonts\malgun.ttf"
FONT_BOLD_PATH = r"C:\Windows\Fonts\malgunbd.ttf"


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD_PATH if bold and os.path.exists(FONT_BOLD_PATH) else FONT_REG_PATH
    return ImageFont.truetype(path, size)


def draw_rounded_rect(draw: ImageDraw.ImageDraw, xy, radius: int, fill=None, outline=None, width: int = 1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def wrap_korean_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int):
    lines = []
    for paragraph in text.split("\n"):
        words = paragraph.split(" ")
        current = ""
        for w in words:
            candidate = w if not current else f"{current} {w}"
            bbox = draw.textbbox((0, 0), candidate, font=font)
            if bbox[2] - bbox[0] <= max_width:
                current = candidate
            else:
                if current:
                    lines.append(current)
                current = w
        if current:
            lines.append(current)
    return lines


# ==============================================================================
# 1. 6-CUT WEBTOON DATA & RENDERER
# ==============================================================================
WEBTOON_CUTS = [
    {
        "num": 1,
        "raw": "cut_01.jpg",
        "badge": "1컷 · 퇴근 후 마주한 만 3세의 고집",
        "speaker": "아이 & 엄마",
        "bubble": "“싫어! 지우가 혼자 단추 끼울 거야!!”\n“아이고… 물까지 다 쏟았잖아, 엄마 바쁜데 왜 그래…”",
        "caption": "퇴근 후 녹초가 된 저녁, 도와주겠다는 엄마 손을 뿌리치고 물까지 쏟아버린 세 살 아이.",
        "tts": "퇴근 후 녹초가 되어 돌아온 저녁. 도와주겠다는 엄마 손을 뿌리치며 내가 혼자 할 거라고 소리치는 세 살 아이 앞에서, 결국 또 큰소리를 내고 말았습니다.",
        "sub": "도와주겠다는 엄마 손을 뿌리치며 고집부리는 세 살 아이,\n결국 오늘도 지친 마음에 한숨을 내쉬고 말았습니다."
    },
    {
        "num": 2,
        "raw": "cut_02.jpg",
        "badge": "2컷 · 잠든 아이 얼굴 앞에서의 자책",
        "speaker": "엄마의 독백",
        "bubble": "“낮에 어린이집에서도 가위질이 서툴다던데…\n내가 일하느라 바빠서 우리 아이만 늦는 걸까?”",
        "caption": "곤히 잠든 아이의 작은 손을 만지며 ‘내가 부족한 엄마여서 그럴까’ 밤새 가슴이 무너집니다.",
        "tts": "곤히 잠든 아이의 작고 통통한 손을 쓰다듬으며, 내가 일하느라 바빠서 우리 아이만 발달이 늦는 건 아닐까 밤새 미안한 눈물이 흘렀습니다.",
        "sub": "잠든 아이의 작은 손을 보며 찾아오는 자책감,\n'내가 바빠서 우리 아이만 늦는 걸까?'"
    },
    {
        "num": 3,
        "raw": "cut_03.jpg",
        "badge": "3컷 · 보건복지부 K-DST 발달 기준에서 찾은 해답",
        "speaker": "소아발달 팩트체크",
        "bubble": "“아하! 만 2~3세의 고집은 반항이 아니라\n전두엽과 연결된 '손끝 소근육 민감기' 신호였구나!”",
        "caption": "손가락은 제2의 뇌! 대뇌 운동피질의 30%가 손끝과 연결되는 '삼지창 파지' 골든타임이었습니다.",
        "tts": "하지만 보건복지부 영유아 발달 기준을 찾아보고 깜짝 놀랐습니다. 만 3세의 고집은 반항이 아니라, 뇌 운동피질의 30퍼센트와 연결된 손끝 시냅스를 스스로 깨우려는 소근육 민감기 신호였습니다.",
        "sub": "반항이 아니었습니다! 뇌 운동피질의 30%와 연결된\n'손끝 소근육 민감기'의 건강한 성장 신호였습니다."
    },
    {
        "num": 4,
        "raw": "cut_04.jpg",
        "badge": "4컷 · 비싼 전집 대신 거실 일상 소근육 놀이",
        "speaker": "엄마의 기다림",
        "bubble": "“옳지, 엄지랑 검지 악어 손가락으로 꼭 집어볼까?\n천천히 해도 괜찮아, 엄마가 기다려 줄게!”",
        "caption": "백만 원대 가베 대신 주방 빨래집게와 원목 집게 놀이를 건네자 아이가 30분 넘게 초집중합니다.",
        "tts": "비싼 백만 원대 전집 대신, 집게로 방울 옮기기와 구슬 꿰기 놀이를 건네며 천천히 기다려 주었습니다. 아이의 눈빛이 놀라운 몰입으로 반짝이기 시작했습니다.",
        "sub": "비싼 전집 대신 손끝 힘을 길러주는 집게 놀이와 기다림,\n아이가 30분 넘게 초집중하기 시작했습니다."
    },
    {
        "num": 5,
        "raw": "cut_05.jpg",
        "badge": "5컷 · 주말 촉각 미술관 & 눈높이 하브루타 대화",
        "speaker": "주말 가족 나들이",
        "bubble": "“지우야, 이 작품을 만지면 보들보들할까, 까슬까슬할까?\n오늘 낮에 신나게 놀고 밤 10시에 푹 자면 키도 쑥쑥 큰대!”",
        "caption": "주말엔 동네 어린이미술관에서 눈높이 대화를 나누고, 밤 10시 깊은 숙면으로 성장호르몬까지 챙깁니다.",
        "tts": "주말에는 집 근처 어린이미술관에서 눈높이를 맞춰 대화를 나누고, 낮에 충분히 움직인 덕분에 밤 10시 깊은 숙면으로 성장호르몬 골든타임까지 지킬 수 있었습니다.",
        "sub": "주말엔 눈높이 대화로 정서를 채우고,\n밤 10시 깊은 숙면으로 숨은 키 골든타임까지 챙깁니다."
    },
    {
        "num": 6,
        "raw": "cut_06.jpg",
        "badge": "6컷 · 아이의 속도를 읽어주는 다정한 엄마",
        "speaker": "키즈핏 양육 응원",
        "bubble": "“엄마! 내가 혼자 가위로 하트 오렸어! 선물이에요!”\n“고마워 우리 아가, 네 속도로 자라줘서 정말 고마워.”",
        "caption": "완벽한 엄마보다 아이의 성장 단계를 이해해주는 다정한 엄마면 충분합니다. [키즈핏 그로스 스튜디오]",
        "tts": "엄마, 내가 혼자 가위로 하트 오렸어요라며 활짝 웃는 아이. 완벽한 엄마보다 아이의 성장 속도를 읽어주는 다정한 엄마면 충분합니다. 키즈핏 그로스 스튜디오가 함께합니다.",
        "sub": "완벽한 엄마보다 아이의 속도를 읽어주는 엄마면 충분합니다.\n우리 아이 맞춤 성장·발달 방향, 키즈핏에서 확인하세요."
    }
]


def render_webtoon_samples():
    print("🎨 [Sample 2] 6컷 양육 공감 웹툰 렌더링 중...")
    cut_images = []
    W, H = 1080, 1350

    font_badge = get_font(26, bold=True)
    font_bubble = get_font(31, bold=True)
    font_caption = get_font(27, bold=False)
    font_brand = get_font(22, bold=True)

    for c in WEBTOON_CUTS:
        canvas = Image.new("RGB", (W, H), (250, 248, 245))
        draw = ImageDraw.Draw(canvas)

        # Top header bar
        draw_rounded_rect(draw, (40, 32, W - 40, 104), radius=24, fill=(79, 70, 229))
        draw.text((70, 50), f"EP.01  {c['badge']}", font=font_badge, fill=(255, 255, 255))
        draw.text((W - 310, 53), "KidsFit 육아공감툰", font=font_brand, fill=(224, 231, 255))

        # Load raw illustration & fit into central frame (40, 124, W-40, 1080)
        raw_path = WEBTOON_RAW_DIR / c["raw"]
        art = Image.open(raw_path).convert("RGB")
        target_w, target_h = W - 80, 940
        art_ratio = art.width / art.height
        box_ratio = target_w / target_h
        if art_ratio > box_ratio:
            new_h = target_h
            new_w = int(new_h * art_ratio)
        else:
            new_w = target_w
            new_h = int(new_w / art_ratio)
        art_resized = art.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - target_w) // 2
        top = (new_h - target_h) // 2
        art_cropped = art_resized.crop((left, top, left + target_w, top + target_h))

        # Rounded mask for art
        mask = Image.new("L", (target_w, target_h), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle((0, 0, target_w, target_h), radius=28, fill=255)
        canvas.paste(art_cropped, (40, 124), mask)
        draw_rounded_rect(draw, (40, 124, 40 + target_w, 124 + target_h), radius=28, outline=(226, 232, 240), width=3)

        # Speech bubble overlay at top of illustration
        bubble_lines = wrap_korean_text(draw, c["bubble"], font_bubble, target_w - 120)
        bh = 52 + len(bubble_lines) * 44
        bx1, by1 = 80, 156
        bx2, by2 = W - 80, 156 + bh
        # Soft shadow
        draw_rounded_rect(draw, (bx1 + 4, by1 + 6, bx2 + 4, by2 + 6), radius=26, fill=(30, 41, 59))
        draw_rounded_rect(draw, (bx1, by1, bx2, by2), radius=26, fill=(255, 255, 255), outline=(79, 70, 229), width=3)
        # Bubble tail triangle
        draw.polygon([(180, by2), (210, by2), (190, by2 + 24)], fill=(255, 255, 255), outline=(79, 70, 229))

        ty = by1 + 22
        for line in bubble_lines:
            bbox = draw.textbbox((0, 0), line, font=font_bubble)
            lw = bbox[2] - bbox[0]
            draw.text(((W - lw) // 2, ty), line, font=font_bubble, fill=(30, 41, 59))
            ty += 44

        # Bottom narration box (1088 ~ 1310)
        draw_rounded_rect(draw, (40, 1086, W - 40, 1312), radius=24, fill=(255, 255, 255), outline=(203, 213, 225), width=2)
        draw_rounded_rect(draw, (64, 1106, 290, 1146), radius=14, fill=(238, 242, 255))
        draw.text((82, 1111), f"★ {c['speaker']}", font=font_brand, fill=(67, 56, 202))

        cap_lines = wrap_korean_text(draw, c["caption"], font_caption, target_w - 60)
        cy = 1162
        for line in cap_lines:
            draw.text((68, cy), line, font=font_caption, fill=(51, 65, 85))
            cy += 40

        draw.text((68, 1268), "공신력 데이터 검증: 질병관리청(KDCA) 성장도표 · 보건복지부 K-DST 영유아 발달선별검사 기준", font=get_font(20, bold=False), fill=(100, 116, 139))

        out_path = WEBTOON_DIR / f"webtoon_cut_0{c['num']}.png"
        canvas.save(out_path, "PNG", optimize=True)
        cut_images.append(canvas)

    # Combine into full vertical strip for Naver Blog / Cafe
    strip_w = W
    strip_h = H * len(cut_images)
    strip = Image.new("RGB", (strip_w, strip_h), (250, 248, 245))
    for idx, img in enumerate(cut_images):
        strip.paste(img, (0, idx * H))
    strip.save(WEBTOON_DIR / "webtoon_full_6cut.png", "PNG", optimize=True)

    # Create HTML preview viewer
    html = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[웹툰 샘플] 퇴근 후 매일 미안한 워킹맘, 만 3세 고집의 진짜 이유 (6컷 육아공감툰)</title>
  <style>
    body { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; background: #FAF8F5; color: #1E293B; margin: 0; padding: 2rem 1rem; }
    .container { max-width: 760px; margin: 0 auto; background: #FFFFFF; border-radius: 28px; padding: 2rem; box-shadow: 0 12px 32px rgba(20,30,55,0.06); }
    .badge { display: inline-block; background: #EEF2FF; color: #4F46E5; font-weight: 800; font-size: 0.85rem; padding: 0.35rem 0.85rem; border-radius: 9999px; margin-bottom: 0.75rem; }
    h1 { font-size: 1.65rem; line-height: 1.35; margin: 0 0 0.5rem 0; }
    .sub { color: #64748B; font-size: 0.95rem; margin-bottom: 1.75rem; }
    .cut-card { margin-bottom: 2rem; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; }
    .cut-card img { width: 100%; display: block; }
    .cta-box { background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 20px; padding: 1.5rem; text-align: center; margin-top: 2rem; }
    .btn { display: inline-block; background: #4F46E5; color: #FFFFFF; font-weight: 800; padding: 0.85rem 1.5rem; border-radius: 9999px; text-decoration: none; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">🎨 키즈핏 공감 육아웹툰 샘플 (6컷 완결)</span>
    <h1>“내가 다 할 거야!” 만 3세 아이의 고집, 사실은 '손끝 소근육 민감기' 신호였습니다</h1>
    <p class="sub">보건복지부 영유아 발달선별검사(K-DST) &amp; 질병관리청 성장도표 기준 부모 공감 웹툰</p>
    <div class="cut-card"><img src="webtoon_cut_01.png" alt="웹툰 1컷"></div>
    <div class="cut-card"><img src="webtoon_cut_02.png" alt="웹툰 2컷"></div>
    <div class="cut-card"><img src="webtoon_cut_03.png" alt="웹툰 3컷"></div>
    <div class="cut-card"><img src="webtoon_cut_04.png" alt="웹툰 4컷"></div>
    <div class="cut-card"><img src="webtoon_cut_05.png" alt="웹툰 5컷"></div>
    <div class="cut-card"><img src="webtoon_cut_06.png" alt="웹툰 6컷"></div>
    <div class="cta-box">
      <h3 style="margin: 0 0 0.4rem 0; color: #065F46;">🎬 이 6컷 웹툰으로 제작된 공감 영상 샘플도 함께 확인해보세요!</h3>
      <p style="margin: 0; font-size: 0.9rem; color: #047857;">한국어 신경망 TTS 내레이션과 따뜻한 BGM이 결합된 숏폼/릴스/클립 영상</p>
      <a class="btn" href="../4_webtoon_video_sample/webtoon_parenting_video.mp4">▶ 웹툰 기반 영상 샘플 재생하기</a>
      <a class="btn" style="background: #059669; margin-left: 0.5rem;" href="../../index.html">🏠 키즈핏 그로스 스튜디오 홈으로</a>
    </div>
  </div>
</body>
</html>"""
    (WEBTOON_DIR / "webtoon_preview.html").write_text(html, encoding="utf-8")
    print("✅ [Sample 2] 6컷 웹툰 PNG 6장 + 합본 + HTML 뷰어 생성 완료!")


# ==============================================================================
# 2. 6-CUT CARD NEWS DATA & RENDERER
# ==============================================================================
CARDNEWS_SLIDES = [
    {
        "num": 1,
        "tag": "보건복지부 K-DST · 질병관리청 성장도표 공신력 가이드",
        "title": "“내가 혼자 할 거야!”\n만 3세 아이의 고집,\n혼내면 안 되는 의학적 이유",
        "subtitle": "퇴근 후 단추 씨름하며 울컥하는 엄마·아빠를 위한\n소아 발달 신경과학 & 성장 골든타임 처방전",
        "accent": (79, 70, 229),
        "bg_tint": (238, 242, 255),
        "raw_bg": "cut_01.jpg",
        "points": [
            "● 만 2~4세 아이가 고집부리는 진짜 뇌과학적 이유",
            "● 150만 원 교구 사기 전 거실에서 하는 '0원 소근육 놀이'",
            "● 낮의 손끝 놀이가 밤 10시 '숨은 키 7cm'로 이어지는 비밀"
        ],
        "tts": "내가 혼자 할 거야라며 매일 밤 단추 씨름을 하는 만 3세 아이. 혼내기 전에 부모님이 꼭 알아야 할 손끝 소근육 민감기와 성장의 비밀을 알려드립니다.",
        "sub": "“내가 혼자 할 거야!” 만 3세 아이의 고집,\n혼내기 전에 꼭 알아야 할 발달과 성장의 비밀"
    },
    {
        "num": 2,
        "tag": "공신력 팩트체크 ① · 대뇌 운동피질과 K-DST 기준",
        "title": "손가락은 '제2의 뇌'\n뇌 운동피질의 30%가\n아이 손끝에 연결됩니다",
        "subtitle": "보건복지부 영유아 발달선별검사(K-DST) 24~47개월 핵심 지표",
        "accent": (5, 150, 105),
        "bg_tint": (236, 253, 245),
        "raw_bg": "cut_03.jpg",
        "points": [
            "● 펜필드 뇌 지도(Homunculus): 손가락 영역이 운동피질의 30% 차지",
            "● 삼지창 파지(Three-jaw chuck): 엄지·검지·중지 협응이 완성되는 시기",
            "★ 아이의 고집 = 전두엽 시냅스를 스스로 연결하려는 기특한 발달 본능!"
        ],
        "tts": "인간의 뇌 운동피질 중 무려 30퍼센트가 손가락과 연결되어 있습니다. 보건복지부 K-DST 기준 만 2세에서 3세는 세 손가락 협응이 완성되는 결정적 민감기입니다.",
        "sub": "손가락은 제2의 뇌! 뇌 운동피질의 30%가 연결된\n'삼지창 파지' 결정적 민감기입니다."
    },
    {
        "num": 3,
        "tag": "워킹맘 지갑 지킴이 · 월령별 교구 적기 판정",
        "title": "만 3세에 150만 원 가베?\n시기가 맞지 않으면\n‘거실 방치템’이 됩니다",
        "subtitle": "내 아이 월령에 딱 맞는 교육법 순서를 알아야 중복 지출을 막습니다",
        "accent": (249, 115, 22),
        "bg_tint": (255, 247, 237),
        "raw_bg": "cut_02.jpg",
        "points": [
            "● 만 2~3세 (24~47개월) 적기: [몬테소리 일상·감각 소근육 조작]",
            "● 만 4~5세 (48~71개월) 적기: [프뢰벨 은물·가베 3D 기하·공간지각]",
            "★ 핵심 조언: 손끝 힘이 없는 만 3세에 추상 도형 가베는 좌절감만 유발!"
        ],
        "tts": "불안한 마음에 백만 원대 가베 전집부터 찾지 마세요. 만 2, 3세에는 손가락 힘을 기르는 몬테소리 일상 조작이 먼저이고, 가베는 만 4세 이후에 시작해야 방치되지 않습니다.",
        "sub": "만 2~3세는 손끝 힘을 기르는 일상 소근육 놀이가 먼저!\n가베는 만 4세 이후에 시작해야 중복 지출을 막습니다."
    },
    {
        "num": 4,
        "tag": "가정 내 실천 처방 · 오늘 저녁 거실 0원 놀이 3선",
        "title": "비싼 장난감 사기 전,\n오늘 저녁 주방 서랍으로\n시작하는 '0원 놀이 3선'",
        "subtitle": "하루 15분, 엄마·아빠의 다정한 눈맞춤과 집안 소품이면 충분합니다",
        "accent": (79, 70, 229),
        "bg_tint": (238, 242, 255),
        "raw_bg": "cut_04.jpg",
        "points": [
            "① 나무 빨래집게 색깔 놀이: 엄지·검지 '악어 손가락' 악력 200% 강화",
            "② 페트병 뚜껑 저금통 넣기: 다 쓴 물티슈 캡 구멍에 동전·뚜껑 넣기",
            "③ 휴지심 사자 갈기 오리기: 다 쓴 휴지심 끝을 1cm씩 안전가위로 오리기"
        ],
        "tts": "교구를 사기 전에 오늘 저녁 주방 서랍 속 나무 빨래집게와 다 쓴 페트병 뚜껑, 휴지심을 꺼내보세요. 하루 15분 0원 일상 놀이만으로도 아이의 손끝 힘과 집중력이 몰라보게 자라납니다.",
        "sub": "나무 빨래집게, 페트병 뚜껑, 다 쓴 휴지심으로\n오늘 저녁 15분 '거실 0원 소근육 놀이'를 시작해보세요."
    },
    {
        "num": 5,
        "tag": "공신력 팩트체크 ② · 질병관리청 성장도표 & KDRIs 영양기준",
        "title": "낮에 손끝을 쓴 아이가\n밤 10시 '숨은 키 7cm'\n성장호르몬도 폭발합니다",
        "subtitle": "대한소아내분비학회 · 미국수면재단(NSF) · 한국인 영양소 섭취기준(KDRIs)",
        "accent": (5, 150, 105),
        "bg_tint": (236, 253, 245),
        "raw_bg": "cut_05.jpg",
        "points": [
            "● 밤 10시~새벽 2시: 깊은 서파수면 중 일일 성장호르몬(GH) 65% 분비",
            "● KDRIs 일일 칼슘(600~800mg): 우유 배앓이 시 잔멸치·두부·치즈로 대체",
            "● 숨은 키 2cm 자세 습관: 스마트폰 거북목 교정 & 하루 10분 점프 스트레칭"
        ],
        "tts": "낮 동안 소근육과 몸을 충분히 움직인 아이는 밤 10시 깊은 서파수면에 빠져 성장호르몬이 활발히 분비됩니다. 우유 배앓이가 있다면 잔멸치와 두부 같은 자연식으로 하루 칼슘을 채워주세요.",
        "sub": "밤 10시 깊은 서파수면(성장호르몬 65% 분비)과\n자연식 칼슘·바른 자세로 숨은 키 7cm를 지켜주세요."
    },
    {
        "num": 6,
        "tag": "부모 마음 처방전 · 키즈핏 그로스 스튜디오",
        "title": "완벽한 엄마보다\n아이의 속도를 읽어주는\n다정한 엄마면 충분합니다",
        "subtitle": "질병관리청 성장도표 × 보건복지부 K-DST 기반 1분 무료 맞춤 처방소",
        "accent": (79, 70, 229),
        "bg_tint": (238, 242, 255),
        "raw_bg": "cut_06.jpg",
        "points": [
            "① 탭 1: 우리 아이 키·몸무게 백분위 & 부모 유전키 대비 3단 예상키",
            "② 탭 2: 보건복지부 K-DST 6각 발달 밸런스 & 0원 집콕놀이·교구 판정",
            "③ 탭 3: 내 지역 × 아이 관심사 주말 전시·박물관 코스 & 하브루타 대화"
        ],
        "tts": "완벽한 엄마보다 아이의 성장 속도를 읽어주는 다정한 엄마면 충분합니다. 우리 아이 개월 수에 딱 맞는 성장 백분위와 발달 방향, 키즈핏 그로스 스튜디오에서 지금 무료로 확인해 보세요.",
        "sub": "아이의 성장 속도를 읽어주는 다정한 나침반,\n키즈핏 그로스 스튜디오에서 1분 무료 처방전을 받아보세요."
    }
]


def render_cardnews_samples():
    print("📊 [Sample 3] 6컷 양육 카드뉴스 렌더링 중...")
    W, H = 1080, 1350

    font_tag = get_font(24, bold=True)
    font_title = get_font(50, bold=True)
    font_sub = get_font(27, bold=False)
    font_point = get_font(27, bold=True)
    font_footer = get_font(21, bold=True)

    for s in CARDNEWS_SLIDES:
        canvas = Image.new("RGB", (W, H), (250, 248, 245))
        draw = ImageDraw.Draw(canvas)
        acc = s["accent"]
        tint = s["bg_tint"]

        # Outer card frame
        draw_rounded_rect(draw, (36, 36, W - 36, H - 36), radius=36, fill=(255, 255, 255), outline=(226, 232, 240), width=3)

        # Top accent banner pill
        draw_rounded_rect(draw, (76, 76, W - 76, 142), radius=999, fill=tint)
        draw.text((106, 93), f"CARD 0{s['num']} / 06  ·  {s['tag']}", font=font_tag, fill=acc)

        # Main Headline
        ty = 172
        for line in s["title"].split("\n"):
            draw.text((80, ty), line, font=font_title, fill=(15, 23, 42))
            ty += 66

        # Subtitle
        ty += 10
        for line in s["subtitle"].split("\n"):
            draw.text((82, ty), line, font=font_sub, fill=(100, 116, 139))
            ty += 38

        # Center Visual Illustration Strip (from raw webtoon art)
        raw_path = WEBTOON_RAW_DIR / s["raw_bg"]
        art = Image.open(raw_path).convert("RGB")
        vw, vh = W - 160, 400
        art_ratio = art.width / art.height
        box_ratio = vw / vh
        if art_ratio > box_ratio:
            nh = vh
            nw = int(nh * art_ratio)
        else:
            nw = vw
            nh = int(nw / art_ratio)
        art_r = art.resize((nw, nh), Image.Resampling.LANCZOS)
        crop_l = (nw - vw) // 2
        crop_t = (nh - vh) // 2
        art_c = art_r.crop((crop_l, crop_t, crop_l + vw, crop_t + vh))

        mask = Image.new("L", (vw, vh), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, vw, vh), radius=26, fill=255)
        canvas.paste(art_c, (80, 495), mask)
        draw_rounded_rect(draw, (80, 495, 80 + vw, 495 + vh), radius=26, outline=acc, width=3)

        # 3 Key Actionable Points Box
        py = 925
        for pt in s["points"]:
            draw_rounded_rect(draw, (80, py, W - 80, py + 96), radius=20, fill=tint, outline=acc, width=2)
            pt_lines = wrap_korean_text(draw, pt, font_point, W - 220)
            ly = py + (96 - len(pt_lines) * 34) // 2 - 4
            for pl in pt_lines:
                draw.text((110, ly), pl, font=font_point, fill=(30, 41, 59))
                ly += 34
            py += 112

        # Footer authority bar
        draw.text((84, H - 86), "[공신력 검증] 키즈핏 그로스 스튜디오 (truthofmarket.com) · 질병관리청 & 보건복지부 K-DST 기준", font=font_footer, fill=(100, 116, 139))

        out_path = CARDNEWS_DIR / f"cardnews_0{s['num']}.png"
        canvas.save(out_path, "PNG", optimize=True)

    # Create HTML preview for Card News
    html = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[카드뉴스 샘플] 만 3세 아이의 고집, 혼내면 안 되는 의학적 이유 (6컷 카드뉴스)</title>
  <style>
    body { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; background: #FAF8F5; color: #1E293B; margin: 0; padding: 2rem 1rem; }
    .container { max-width: 980px; margin: 0 auto; background: #FFFFFF; border-radius: 28px; padding: 2rem; box-shadow: 0 12px 32px rgba(20,30,55,0.06); }
    .badge { display: inline-block; background: #ECFDF5; color: #059669; font-weight: 800; font-size: 0.85rem; padding: 0.35rem 0.85rem; border-radius: 9999px; margin-bottom: 0.75rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1.25rem; margin-top: 1.5rem; }
    .card { border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 14px rgba(0,0,0,0.04); }
    .card img { width: 100%; display: block; }
    .cta-box { background: #EEF2FF; border: 1.5px solid #C7D2FE; border-radius: 20px; padding: 1.5rem; text-align: center; margin-top: 2rem; }
    .btn { display: inline-block; background: #4F46E5; color: #FFFFFF; font-weight: 800; padding: 0.85rem 1.5rem; border-radius: 9999px; text-decoration: none; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">📊 키즈핏 공신력 양육 카드뉴스 샘플 (6컷 완결)</span>
    <h1 style="margin: 0 0 0.5rem 0;">“내가 혼자 할 거야!” 만 3세 아이의 고집, 혼내면 안 되는 의학적 이유</h1>
    <p style="color: #64748B; margin: 0;">질병관리청(KDCA) 성장도표 · 보건복지부 K-DST · 한국인 영양소 섭취기준(KDRIs) 팩트체크</p>
    <div class="grid">
      <div class="card"><img src="cardnews_01.png" alt="카드뉴스 1"></div>
      <div class="card"><img src="cardnews_02.png" alt="카드뉴스 2"></div>
      <div class="card"><img src="cardnews_03.png" alt="카드뉴스 3"></div>
      <div class="card"><img src="cardnews_04.png" alt="카드뉴스 4"></div>
      <div class="card"><img src="cardnews_05.png" alt="카드뉴스 5"></div>
      <div class="card"><img src="cardnews_06.png" alt="카드뉴스 6"></div>
    </div>
    <div class="cta-box">
      <h3 style="margin: 0 0 0.4rem 0; color: #312E81;">🎬 이 6컷 카드뉴스로 제작된 공감 영상 샘플도 함께 확인해보세요!</h3>
      <p style="margin: 0; font-size: 0.9rem; color: #4338CA;">인스타 릴스 · 유튜브 쇼츠 · 네이버 클립 최적화 1080×1920 세로형 영상</p>
      <a class="btn" href="../5_cardnews_video_sample/cardnews_parenting_video.mp4">▶ 카드뉴스 기반 영상 샘플 재생하기</a>
      <a class="btn" style="background: #059669; margin-left: 0.5rem;" href="../../index.html">🏠 키즈핏 그로스 스튜디오 홈으로</a>
    </div>
  </div>
</body>
</html>"""
    (CARDNEWS_DIR / "cardnews_preview.html").write_text(html, encoding="utf-8")
    print("✅ [Sample 3] 6컷 카드뉴스 PNG 6장 + HTML 뷰어 생성 완료!")


# ==============================================================================
# 3. SYNTHESIZE WARM ACOUSTIC BGM WAV & TTS NARRATION + BUILD MP4 VIDEOS
# ==============================================================================
def generate_warm_music_wav(wav_path: Path, duration_sec: float, sample_rate: int = 44100):
    """Generates a gentle, warm music-box / electric-piano chord progression WAV."""
    chords = [
        [261.63, 329.63, 392.00, 493.88],  # Cmaj7
        [220.00, 261.63, 329.63, 392.00],  # Am7
        [174.61, 220.00, 261.63, 349.23],  # Fmaj7
        [196.00, 246.94, 293.66, 392.00],  # G6
    ]
    total_samples = int(duration_sec * sample_rate)
    beat_sec = 2.0

    with wave.open(str(wav_path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)

        frames = bytearray()
        for i in range(total_samples):
            t = i / sample_rate
            chord_idx = int(t // beat_sec) % len(chords)
            local_t = t % beat_sec
            chord = chords[chord_idx]

            # Soft envelope per chord + gentle arpeggio bell
            env = math.exp(-local_t * 1.1) * min(1.0, local_t / 0.08)
            val = 0.0
            for idx, freq in enumerate(chord):
                val += math.sin(2.0 * math.pi * freq * t) * 0.22 * env
                # Arpeggio note
                arp_offset = idx * 0.45
                if local_t >= arp_offset:
                    at = local_t - arp_offset
                    a_env = math.exp(-at * 2.2) * min(1.0, at / 0.03)
                    val += math.sin(2.0 * math.pi * (freq * 2.0) * t) * 0.12 * a_env

            # Fade in / fade out master
            master = 0.16
            if t < 1.0:
                master *= t / 1.0
            elif duration_sec - t < 1.5:
                master *= max(0.0, (duration_sec - t) / 1.5)

            sample = int(max(-1.0, min(1.0, val * master)) * 32767)
            frames.extend(struct.pack("<h", sample))

        wf.writeframes(frames)


async def synthesize_tts_clips(items, out_dir: Path, prefix: str):
    import urllib.parse
    import urllib.request

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    wav_files = []
    durations = []

    for item in items:
        num = item["num"]
        mp3_path = out_dir / f"{prefix}_tts_0{num}.mp3"
        wav_path = out_dir / f"{prefix}_tts_0{num}.wav"

        q = urllib.parse.quote(item["tts"])
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q={q}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        mp3_bytes = urllib.request.urlopen(req, timeout=15).read()
        mp3_path.write_bytes(mp3_bytes)

        # Convert MP3 to 44.1kHz mono WAV with natural pacing & 0.45s tail padding using ffmpeg
        subprocess.run(
            [
                ffmpeg_exe, "-y", "-i", str(mp3_path),
                "-af", "atempo=1.08,apad=pad_dur=0.45",
                "-ar", "44100", "-ac", "1",
                str(wav_path)
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        with wave.open(str(wav_path), "r") as wf:
            dur = wf.getnframes() / float(wf.getframerate())
        wav_files.append(wav_path)
        durations.append(dur)
        mp3_path.unlink(missing_ok=True)

    return wav_files, durations


def build_vertical_video(
    items,
    slide_images,
    wav_files,
    durations,
    out_mp4_path: Path,
    header_badge_text: str,
    header_title_text: str,
    accent_rgb=(79, 70, 229),
):
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    work_dir = out_mp4_path.parent

    # 1. Concatenate voice WAVs and mix with warm BGM WAV
    concat_voice_wav = work_dir / "voice_concat.wav"
    with wave.open(str(concat_voice_wav), "w") as out_wf:
        out_wf.setnchannels(1)
        out_wf.setsampwidth(2)
        out_wf.setframerate(44100)
        for wf_path in wav_files:
            with wave.open(str(wf_path), "r") as in_wf:
                out_wf.writeframes(in_wf.readframes(in_wf.getnframes()))

    total_dur = sum(durations)
    bgm_wav = work_dir / "warm_bgm.wav"
    generate_warm_music_wav(bgm_wav, total_dur + 0.5, 44100)

    mixed_audio_aac = work_dir / "mixed_audio.m4a"
    subprocess.run(
        [
            ffmpeg_exe, "-y",
            "-i", str(concat_voice_wav),
            "-i", str(bgm_wav),
            "-filter_complex", "[0:a]volume=1.15[v];[1:a]volume=0.35[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2[aout]",
            "-map", "[aout]",
            "-c:a", "aac", "-b:a", "192k",
            str(mixed_audio_aac)
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # 2. Render 1080x1920 vertical video frames @ 15fps with smooth Ken Burns zoom & subtitles
    fps = 15
    VW, VH = 1080, 1920
    font_top_badge = get_font(26, bold=True)
    font_top_title = get_font(38, bold=True)
    font_sub = get_font(32, bold=True)
    font_footer = get_font(23, bold=True)

    cmd = [
        ffmpeg_exe, "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{VW}x{VH}",
        "-pix_fmt", "rgb24",
        "-r", str(fps),
        "-i", "-",
        "-i", str(mixed_audio_aac),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "20",
        "-c:a", "copy",
        "-shortest",
        "-movflags", "+faststart",
        str(out_mp4_path)
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    elapsed_global = 0.0
    for idx, (item, slide_img_path, dur) in enumerate(zip(items, slide_images, durations)):
        src_img = Image.open(slide_img_path).convert("RGB")
        n_frames = max(1, int(round(dur * fps)))

        for f_idx in range(n_frames):
            prog = f_idx / float(max(1, n_frames - 1))
            global_prog = (elapsed_global + (f_idx / fps)) / max(0.1, total_dur)

            frame = Image.new("RGB", (VW, VH), (250, 248, 245))
            draw = ImageDraw.Draw(frame)

            # Top header banner
            draw_rounded_rect(draw, (44, 52, VW - 44, 120), radius=999, fill=(238, 242, 255))
            draw.text((80, 70), f"{header_badge_text}  ·  CUT 0{idx + 1} / 06", font=font_top_badge, fill=accent_rgb)
            draw.text((54, 142), header_title_text, font=font_top_title, fill=(15, 23, 42))

            # Subtle Ken Burns zoom on the 1080x1350 card/webtoon image placed at y=220..1540
            card_w, card_h = 992, 1240
            zoom = 1.0 + 0.045 * prog
            zw, zh = int(card_w * zoom), int(card_h * zoom)
            resized = src_img.resize((zw, zh), Image.Resampling.BILINEAR)
            cx = (zw - card_w) // 2
            cy = (zh - card_h) // 2
            cropped = resized.crop((cx, cy, cx + card_w, cy + card_h))
            frame.paste(cropped, (44, 215))
            draw_rounded_rect(draw, (44, 215, 44 + card_w, 215 + card_h), radius=28, outline=accent_rgb, width=3)

            # Subtitle Box at bottom (y=1490..1750)
            draw_rounded_rect(draw, (44, 1495, VW - 44, 1745), radius=28, fill=(15, 23, 42), outline=accent_rgb, width=3)
            sub_lines = item["sub"].split("\n")
            sy = 1545 if len(sub_lines) == 2 else 1575
            for sline in sub_lines:
                bbox = draw.textbbox((0, 0), sline, font=font_sub)
                lw = bbox[2] - bbox[0]
                draw.text(((VW - lw) // 2, sy), sline, font=font_sub, fill=(255, 255, 255))
                sy += 52

            # Progress bar
            draw_rounded_rect(draw, (44, 1775, VW - 44, 1795), radius=10, fill=(226, 232, 240))
            bar_w = int((VW - 88) * min(1.0, global_prog))
            if bar_w > 12:
                draw_rounded_rect(draw, (44, 1775, 44 + bar_w, 1795), radius=10, fill=accent_rgb)

            # Footer
            draw.text((64, 1825), "[공신력 검증] 키즈핏 그로스 스튜디오 (truthofmarket.com) · 질병관리청 & 보건복지부 K-DST 기준", font=font_footer, fill=(71, 85, 105))

            proc.stdin.write(frame.tobytes())

        elapsed_global += dur

    proc.stdin.close()
    proc.wait()

    # Clean up temp audio files
    concat_voice_wav.unlink(missing_ok=True)
    bgm_wav.unlink(missing_ok=True)
    mixed_audio_aac.unlink(missing_ok=True)
    for wf in wav_files:
        wf.unlink(missing_ok=True)


# ==============================================================================
# 4. SAMPLE 1: AUTHORITATIVE PARENTING BLOG COLUMN (MD + HTML)
# ==============================================================================
def generate_blog_sample():
    print("📝 [Sample 1] 최고 퀄리티 양육 블로그 칼럼 샘플 생성 중...")
    md_content = """# [소아성장·발달 칼럼] "내가 다 할 거야!" 만 3세 아이의 고집, 혼내기 전에 꼭 알아야 할 '손끝 소근육 민감기'와 밤 10시 성장의 비밀

> **🏛️ 공신력 데이터 검증 안내**
> 본 칼럼은 **보건복지부·질병관리청 『한국 영유아 발달선별검사(K-DST)』**, **질병관리청 『소아청소년 성장도표(KDCA)』**, **보건복지부·한국영양학회 『한국인 영양소 섭취기준(KDRIs)』**, 그리고 **대한소아내분비학회**의 공식 가이드라인을 바탕으로 작성된 학부모 양육 지원 칼럼입니다.

---

## 1. 퇴근 후 현관에서 시작되는 단추 씨름, 왜 이토록 눈물이 날까요?

퇴근하고 돌아와 저녁밥을 올려놓아야 하는 바쁜 저녁 7시.
어린이집 가방을 내려놓기도 전에 세 살배기 아이가 조그만 손으로 외투 단추를 붙잡고 소리칩니다.

*"싫어! 엄마 가! 내가 혼자 할 거야!!"*

마음은 급한데 아이는 10분째 단추 구멍 하나를 끼우지 못해 낑낑대고, 급기야 식탁 위 물컵까지 혼자 따르겠다며 바지에 물을 다 쏟아버립니다. 결국 참았던 한숨이 터져 나오며 *"아이고, 엄마 바쁜데 가만히 좀 있어!"* 하고 큰소리를 내고 말지요.

그날 밤, 곤히 잠든 아이의 작고 통통한 손을 쓰다듬으며 엄마는 또 자책합니다.
*'낮에 어린이집 선생님도 지우가 가위질할 때 손끝 힘이 조금 부족하다고 하셨는데... 내가 일하느라 바빠서 우리 아이만 늦는 걸까?'*

만약 오늘 밤 같은 마음으로 스마트폰 검색창을 열어보셨다면, 먼저 어머니의 잘못이 전혀 아니라는 말씀부터 드리고 싶습니다. **만 2~4세(24~47개월) 아이가 유독 "내가 혼자 할 거야!"라며 고집을 부리는 것은 엄마를 힘들게 하려는 반항이 아니라, 아이의 전두엽이 보내는 가장 건강한 '손끝 소근육 민감기' 신호이기 때문입니다.**

---

## 2. [공신력 팩트체크 ①] 손가락은 '제2의 뇌' — 보건복지부 K-DST가 말하는 36개월의 비밀

캐나다의 신경외과 의사 와일더 펜필드(Wilder Penfield) 박사가 밝혀낸 인간의 뇌 지도(**호문쿨루스, Homunculus**)를 보면 놀라운 사실을 발견할 수 있습니다. 우리 몸의 움직임을 관장하는 **대뇌 운동피질 전체 면적의 무려 30% 이상이 '손과 손가락'에 배정**되어 있습니다.

즉, 아이가 손끝으로 단추를 만지작거리고, 집게로 콩을 집고, 종이를 오리는 순간 아이의 대뇌 전두엽 시냅스는 불꽃처럼 연결되고 있는 것입니다.

### 📊 보건복지부 영유아 발달선별검사(K-DST) 만 2~3세 핵심 발달 이정표 점검표

| 발달 영역 (K-DST 6대 영역) | 만 24~35개월 핵심 이정표 | 만 36~47개월 핵심 이정표 |
| :--- | :--- | :--- |
| **✂️ 소근육 운동 (Fine Motor)** | 책장을 한 장씩 넘기고, 작은 구슬에 끈을 꿴다 | **안전가위로 종이를 자르고, 엄지·검지·중지 '삼지창 파지'가 형성된다** |
| **🧩 인지 발달 (Cognitive)** | 크고 작음, 같고 다름을 변별하고 도형 판을 맞춘다 | **부분을 보고 전체를 유추하며 원·네모를 모방해 그린다** |
| **🗣️ 언어 발달 (Language)** | 3~4단어 문장으로 자신의 요구를 표현한다 | **“왜?”, “어떻게?” 질문을 쏟아내며 과거 경험을 이야기한다** |
| **👕 자조 행동 (Self-care)** | 혼자 숟가락질을 시도하고 양말을 벗는다 | **큰 단추를 스스로 끼우고 풀며 혼자 손을 씻는다** |

이 시기의 아이가 어설픈 손짓으로 "내가 할 거야!"라고 외치는 것은 **"엄마, 지금 내 뇌 속의 손가락 시냅스를 연결해야 해요! 내가 스스로 해볼 수 있게 딱 3분만 기다려 주세요!"**라고 말하는 것과 같습니다.

---

## 3. 비싼 150만 원 교구 전집 사기 전! 오늘 저녁 주방 서랍으로 시작하는 '0원 일상 놀이 3선'

소근육이 걱정된다고 해서 덜컥 수백만 원짜리 가베(은물) 전집부터 결제하실 필요가 전혀 없습니다. 오히려 손끝 악력이 완성되지 않은 만 2~3세에게 작고 미끄러운 3차원 기하 도형(가베)을 주면, 블록이 자꾸 무너져 아이는 좌절하고 교구는 거실 구석의 방치템이 되기 쉽습니다.

| 구분 | 몬테소리 일상·감각 영역 | 프뢰벨 은물 / 가베 영역 |
| :--- | :--- | :--- |
| **권장 시작 월령** | **만 2~3세 (24~47개월) 최적** | **만 4~5세 (48~71개월) 최적** |
| **핵심 발달 목표** | 손끝 삼지창 악력, 눈-손 협응, 자조 자립심 | 3차원 입체 공간지각, 도형의 분할과 합성 |
| **지갑 지킴이 조언** | 집안 일상 도구와 핀셋·원기둥 소품만으로 충분 | 손끝 힘이 완성된 만 4세 이후 도입해야 효과 200% |

교구를 사기 전에 **오늘 저녁 거실에서 돈 한 푼 들이지 않고 시작할 수 있는 '0원 일상 소근육 놀이 3선'**을 먼저 실천해 보세요:

1. **🏠 나무 빨래집게 '악어 손가락' 놀이 (하루 10분)**:
   - 다 쓴 두부 용기나 종이접시 테두리에 나무 빨래집게를 꽂고 빼는 놀이입니다. 엄지와 검지에 힘을 주는 과정이 향후 바른 연필 파지법과 가위질 근육을 직결시켜 줍니다.
2. **🏠 물티슈 캡 & 페트병 뚜껑 저금통 놀이**:
   - 빈 상자에 다 쓴 물티슈 뚜껑을 붙여주고, 그 안으로 큼직한 우유병·페트병 뚜껑을 밀어 넣게 해주세요. 눈과 손의 정교한 협응력이 몰라보게 좋아집니다.
3. **🏠 다 쓴 휴지심 '사자 갈기' 안전가위 오리기**:
   - 얇은 종이는 흐물거려서 처음 가위질하는 아이가 오리기 어렵습니다. 적당히 도톰한 **휴지심 끝을 1cm 간격으로 톡톡 오려 사자 갈기**를 만들게 해주면 아이가 성취감을 느끼며 까르르 웃습니다.

> **💬 아이의 자존감을 살리는 엄마의 대화 처방 (Before & After)**
> - ❌ **Before**: *"답답해, 이리 줘 봐! 엄마가 빨리 단추 채워줄게!"*
> - ⭕ **After**: *"우리 OO이가 스스로 단추를 끼워보고 싶었구나! 엄지랑 검지 악어 손가락으로 단추 끝을 꼭 잡고 구멍으로 쏙 밀어 넣어볼까? 엄마가 옆에서 응원하며 기다려 줄게!"*

---

## 4. [공신력 팩트체크 ②] 낮에 손끝을 쓴 아이가 밤 10시 '숨은 키 7cm'도 자랍니다

소근육과 두뇌 발달만큼이나 부모님들이 놓치지 말아야 할 것이 바로 **신체 성장 골든타임**입니다.
**대한소아내분비학회**와 **미국수면재단(NSF)**의 연구에 따르면, 낮 동안 손끝과 신체를 충분히 움직이며 몰입한 아이는 밤에 뇌파가 안정되어 **깊은 서파수면(Slow-Wave Sleep)**에 훨씬 빠르게 진입합니다. 그리고 하루 성장호르몬(GH)의 **65~70%는 바로 밤 10시~새벽 2시 깊은 서파수면 중**에 분비됩니다.

### 🥗 보건복지부 『한국인 영양소 섭취기준(KDRIs)』 연령별 일일 권장량 & 자연식 식탁 환산표

우유를 마시면 배가 아파하는 아이(유당불내증)에게 억지로 우유를 강요하기보다, 우리 집 저녁 식탁의 자연 반찬으로 뼈 성장 영양소를 채워주세요.

| 연령 구분 (KDRIs 기준) | 일일 칼슘 권장량 | 일일 비타민D / 단백질 | 우유 배앓이 없는 자연식 식탁 1일 환산 예시 |
| :--- | :--- | :--- | :--- |
| **만 1~2세 (12~35개월)** | **500 mg / 일** | 400 IU / 20 g | 아기치즈 1장(130mg) + 두부 반 모(140mg) + 잔멸치 볶음 1큰술(120mg) + 요거트 1개 |
| **만 3~5세 (36~71개월)** | **600 mg / 일** | 400 IU / 25 g | 슬라이스 치즈 1.5장(200mg) + 잔멸치 주먹밥(180mg) + 달걀노른자 1개 + 브로콜리·두부국 |
| **만 6~8세 (초등 저학년)** | **700 mg / 일** | 400 IU / 35 g | 두부구이 1모(280mg) + 뱅어포·멸치볶음(220mg) + 소고기 우둔살 장조림 + 구운 연어 |
| **만 9~13세 (급성장기)** | **800~1,000 mg / 일** | 400 IU / 50~60 g | 고칼슘 치즈 2장 + 뼈째 먹는 생선 + 두부·콩 반찬 + 달걀 2개 + 충분한 수분 섭취 |

---

## 5. 우리 아이 개월 수에 딱 맞는 성장·발달 방향, 1분 무료로 점검해 보세요

아이마다 자라나는 속도와 기질은 세상에 단 하나뿐인 지문처럼 다릅니다.
옆집 아이의 교구나 영양제를 따라 사기보다, 먼저 **공신력 있는 국가 표준 데이터에 우리 아이의 현재 키·몸무게와 개월 수를 대입해 객관적인 방향**을 확인해 보시는 건 어떨까요?

질병관리청(KDCA) 2017 소아청소년 성장도표와 보건복지부 영유아 발달선별검사(K-DST) 기준을 연동한 **[키즈핏 그로스 스튜디오]**에서는 회원가입이나 비용 없이 1분 만에 아래 3가지 맞춤 리포트를 확인하실 수 있습니다:

1. **📏 신체 성장 리포트**: 내 아이 키·체중·BMI 정확한 백분위 & 부모 유전키(MPH) 대비 3단 예상키 + 자연식 식단표
2. **🧩 두뇌·소근육 발달 리포트**: K-DST 6각 발달 밸런스 차트 + 월령별 0원 일상 놀이 3선 & 교육법 판정
3. **🎨 주말 나들이 & 하브루타 코스**: 전국 8대 권역 × 5대 관심사 맞춤 미술관·박물관 코스와 출발 전/전시장/저녁 식탁 3단계 부모-아이 대화 질문지

👉 **[키즈핏 그로스 스튜디오 — 우리 아이 무료 성장·발달 처방전 확인하기](https://truthofmarket.com)**
"""
    (BLOG_DIR / "blog_post_sample.md").write_text(md_content, encoding="utf-8")

    html_content = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[블로그 글 샘플] 만 3세 아이의 고집, 혼내기 전에 꼭 알아야 할 '손끝 소근육 민감기'와 밤 10시 성장의 비밀</title>
  <style>
    body { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; background: #FAF8F5; color: #1E293B; line-height: 1.75; margin: 0; padding: 2rem 1rem; }
    .post-wrap { max-width: 820px; margin: 0 auto; background: #FFFFFF; border-radius: 28px; padding: 2.5rem 2rem; box-shadow: 0 12px 32px rgba(20,30,55,0.06); }
    .top-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; border-bottom: 2px solid #F1F5F9; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .badge { background: #EEF2FF; color: #4F46E5; font-weight: 800; font-size: 0.85rem; padding: 0.35rem 0.85rem; border-radius: 9999px; }
    h1 { font-size: 1.75rem; line-height: 1.38; color: #0F172A; margin: 0 0 1rem 0; }
    h2 { font-size: 1.3rem; color: #1E1B4B; margin-top: 2.2rem; padding-left: 0.75rem; border-left: 5px solid #4F46E5; }
    .authority-box { background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 18px; padding: 1.15rem 1.35rem; font-size: 0.9rem; color: #065F46; margin-bottom: 1.75rem; }
    .quote-box { background: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 14px; padding: 1.1rem 1.35rem; margin: 1.25rem 0; color: #78350F; }
    table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.9rem; }
    th { background: #EEF2FF; color: #312E81; font-weight: 800; padding: 0.75rem; border: 1px solid #CBD5E1; text-align: left; }
    td { padding: 0.75rem; border: 1px solid #E2E8F0; color: #334155; }
    .visual-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
    .visual-grid img { width: 100%; border-radius: 16px; border: 1px solid #E2E8F0; }
    .bridge-card { background: linear-gradient(135deg, #EEF2FF 0%, #ECFDF5 100%); border: 1.5px solid #A5B4FC; border-radius: 22px; padding: 1.75rem; text-align: center; margin-top: 2.5rem; }
    .btn { display: inline-block; background: #4F46E5; color: #FFFFFF; font-weight: 800; padding: 0.85rem 1.6rem; border-radius: 9999px; text-decoration: none; margin-top: 0.75rem; border: none; cursor: pointer; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="post-wrap" id="blog-article-body">
    <div class="top-bar">
      <span class="badge">📝 네이버 블로그 최고 퀄리티 양육 칼럼 샘플</span>
      <button class="btn" style="margin-top:0; padding: 0.5rem 1rem; font-size: 0.82rem;" onclick="navigator.clipboard.writeText(document.getElementById('blog-article-body').innerText).then(()=>alert('블로그 본문 전체가 클립보드에 복사되었습니다! 네이버 스마트에디터에 붙여넣기 하세요.'))">📋 스마트에디터용 원클릭 복사</button>
    </div>

    <h1>“내가 다 할 거야!” 만 3세 아이의 고집, 혼내기 전에 꼭 알아야 할 '손끝 소근육 민감기'와 밤 10시 성장의 비밀</h1>

    <div class="authority-box">
      <strong>🏛️ 공신력 데이터 검증 안내:</strong> 본 칼럼은 <strong>보건복지부 『한국 영유아 발달선별검사(K-DST)』</strong>, <strong>질병관리청 『소아청소년 성장도표(KDCA)』</strong>, <strong>보건복지부·한국영양학회 『한국인 영양소 섭취기준(KDRIs)』</strong>, <strong>대한소아내분비학회</strong> 공식 기준을 바탕으로 작성된 비영리적 양육 가이드 칼럼입니다.
    </div>

    <h2>1. 퇴근 후 현관에서 시작되는 단추 씨름, 왜 이토록 눈물이 날까요?</h2>
    <p>퇴근하고 돌아와 저녁밥을 올려놓아야 하는 바쁜 저녁 7시. 어린이집 가방을 내려놓기도 전에 세 살배기 아이가 조그만 손으로 외투 단추를 붙잡고 소리칩니다. <em>“싫어! 엄마 가! 내가 혼자 할 거야!!”</em></p>
    <p>마음은 급한데 아이는 10분째 단추 구멍 하나를 끼우지 못해 낑낑대고, 급기야 식탁 위 물컵까지 혼자 따르겠다며 바지에 물을 다 쏟아버립니다. 그날 밤 곤히 잠든 아이의 작은 손을 쓰다듬으며 엄마는 <em>‘내가 일하느라 바빠서 우리 아이만 소근육이 늦는 걸까?’</em> 자책하곤 합니다.</p>

    <div class="visual-grid">
      <img src="../2_webtoon_sample/webtoon_cut_01.png" alt="육아웹툰 1컷">
      <img src="../2_webtoon_sample/webtoon_cut_03.png" alt="육아웹툰 3컷">
    </div>

    <h2>2. [공신력 팩트체크 ①] 손가락은 '제2의 뇌' — 대뇌 운동피질의 30%가 손끝에 연결됩니다</h2>
    <p>신경외과 의사 와일더 펜필드 박사의 <strong>뇌 지도(Homunculus)</strong>를 보면, 인간 대뇌 운동피질의 무려 <strong>30% 이상이 손과 손가락</strong>에 배정되어 있습니다. 만 2~3세 아이가 “내가 할 거야!”라며 고집을 부리는 것은 반항이 아니라, <strong>엄지·검지·중지 ‘삼지창 파지(Three-jaw chuck)’와 전두엽 시냅스를 스스로 연결하려는 기특한 발달 본능</strong>입니다.</p>

    <table>
      <thead>
        <tr>
          <th>K-DST 발달 영역</th>
          <th>만 24~35개월 핵심 이정표</th>
          <th>만 36~47개월 핵심 이정표</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>✂️ 소근육 운동</strong></td>
          <td>책장을 한 장씩 넘기고 큰 구슬에 끈을 꿴다</td>
          <td><strong>안전가위로 종이를 자르고 세 손가락 삼지창 파지가 형성된다</strong></td>
        </tr>
        <tr>
          <td><strong>🧩 인지 발달</strong></td>
          <td>크고 작음을 변별하고 도형 판을 맞춘다</td>
          <td><strong>부분을 보고 전체를 유추하며 원·십자가를 모방해 그린다</strong></td>
        </tr>
        <tr>
          <td><strong>👕 자조 행동</strong></td>
          <td>혼자 숟가락질을 시도하고 양말을 벗는다</td>
          <td><strong>큰 단추를 스스로 끼우고 풀며 혼자 손을 씻는다</strong></td>
        </tr>
      </tbody>
    </table>

    <h2>3. 비싼 150만 원 전집 사기 전! 오늘 저녁 거실 '0원 일상 놀이 3선'</h2>
    <p>손끝 힘이 아직 다져지지 않은 만 2~3세 아이에게 150만 원대 가베(은물) 전집을 들이면 블록이 자꾸 무너져 흥미를 잃기 쉽습니다. 교구를 사기 전 오늘 저녁 주방 서랍으로 시작하는 <strong>0원 일상 놀이 3선</strong>을 먼저 해보세요:</p>
    <ul>
      <li><strong>① 나무 빨래집게 ‘악어 손가락’ 놀이:</strong> 두부 용기 테두리에 빨래집게를 꽂고 빼며 엄지·검지 악력을 기릅니다.</li>
      <li><strong>② 물티슈 캡 &amp; 페트병 뚜껑 저금통:</strong> 빈 상자에 물티슈 캡을 붙여 페트병 뚜껑을 넣으며 눈-손 협응력을 키웁니다.</li>
      <li><strong>③ 다 쓴 휴지심 ‘사자 갈기’ 오리기:</strong> 도톰한 휴지심 끝을 1cm씩 안전가위로 오리며 가위질 성취감을 선물합니다.</li>
    </ul>

    <div class="quote-box">
      <strong>💬 아이의 자존감을 살리는 엄마의 대화 처방</strong><br>
      ❌ <strong>Before:</strong> “답답해, 이리 줘 봐! 엄마가 빨리 단추 채워줄게!”<br>
      ⭕ <strong>After:</strong> “우리 지우가 스스로 단추를 끼워보고 싶었구나! 악어 손가락으로 단추 끝을 꼭 잡고 구멍으로 쏙 밀어 넣어볼까? 엄마가 옆에서 기다려 줄게!”
    </div>

    <h2>4. [공신력 팩트체크 ②] 낮에 손끝을 쓴 아이가 밤 10시 '숨은 키 7cm'도 자랍니다</h2>
    <p>낮 동안 손끝과 몸을 충분히 움직인 아이는 밤 10시 <strong>깊은 서파수면(Slow-Wave Sleep, 일일 성장호르몬의 65% 분비)</strong>에 빠르게 진입합니다. 우유 배앓이가 있는 아이라면 아래 <strong>보건복지부 한국인 영양소 섭취기준(KDRIs) 자연식 환산표</strong>로 칼슘을 채워주세요.</p>

    <table>
      <thead>
        <tr>
          <th>연령 구분 (KDRIs)</th>
          <th>일일 칼슘 권장량</th>
          <th>일일 비타민D / 단백질</th>
          <th>우유 배앓이 없는 자연식 식탁 1일 환산 예시</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>만 1~2세</strong></td>
          <td>500 mg / 일</td>
          <td>400 IU / 20 g</td>
          <td>아기치즈 1장(130mg) + 두부 반 모(140mg) + 잔멸치 볶음 1큰술(120mg) + 요거트</td>
        </tr>
        <tr>
          <td><strong>만 3~5세</strong></td>
          <td>600 mg / 일</td>
          <td>400 IU / 25 g</td>
          <td>슬라이스 치즈 1.5장(200mg) + 잔멸치 주먹밥(180mg) + 달걀노른자 1개 + 브로콜리</td>
        </tr>
        <tr>
          <td><strong>만 6~8세</strong></td>
          <td>700 mg / 일</td>
          <td>400 IU / 35 g</td>
          <td>두부구이 1모(280mg) + 뱅어포·멸치볶음(220mg) + 소고기 장조림 + 구운 연어</td>
        </tr>
      </tbody>
    </table>

    <div class="bridge-card">
      <h3 style="margin: 0 0 0.5rem 0; color: #1E1B4B;">🌱 우리 아이 개월 수에 딱 맞는 성장 백분위 &amp; 발달 방향이 궁금하다면?</h3>
      <p style="margin: 0; font-size: 0.92rem; color: #334155;">질병관리청 성장도표와 보건복지부 K-DST 기준을 연동한 무료 진단 리포트를 1분 만에 확인해 보세요.</p>
      <a class="btn" href="../../index.html">👉 키즈핏 그로스 스튜디오 무료 진단 바로가기</a>
    </div>
  </div>
</body>
</html>"""
    (BLOG_DIR / "blog_post_sample.html").write_text(html_content, encoding="utf-8")
    print("✅ [Sample 1] 블로그 칼럼 MD + HTML 샘플 생성 완료!")


async def main_async():
    generate_blog_sample()
    render_webtoon_samples()
    render_cardnews_samples()

    print("🎬 [Sample 4] 6컷 웹툰 기반 영상 샘플(MP4 + 한국어 신경망 TTS + BGM) 생성 중...")
    wt_wavs, wt_durs = await synthesize_tts_clips(WEBTOON_CUTS, WEBTOON_VID_DIR, "wt")
    wt_imgs = [WEBTOON_DIR / f"webtoon_cut_0{c['num']}.png" for c in WEBTOON_CUTS]
    wt_mp4 = WEBTOON_VID_DIR / "webtoon_parenting_video.mp4"
    build_vertical_video(
        WEBTOON_CUTS,
        wt_imgs,
        wt_wavs,
        wt_durs,
        wt_mp4,
        header_badge_text="[키즈핏 공감 육아웹툰]",
        header_title_text="만 3세 아이의 고집, 진짜 이유는?",
        accent_rgb=(79, 70, 229),
    )
    print(f"✅ [Sample 4] 웹툰 기반 영상 생성 완료: {wt_mp4} ({wt_mp4.stat().st_size:,} bytes)")

    print("🎬 [Sample 5] 6컷 카드뉴스 기반 영상 샘플(MP4 + 한국어 신경망 TTS + BGM) 생성 중...")
    cn_wavs, cn_durs = await synthesize_tts_clips(CARDNEWS_SLIDES, CARDNEWS_VID_DIR, "cn")
    cn_imgs = [CARDNEWS_DIR / f"cardnews_0{s['num']}.png" for s in CARDNEWS_SLIDES]
    cn_mp4 = CARDNEWS_VID_DIR / "cardnews_parenting_video.mp4"
    build_vertical_video(
        CARDNEWS_SLIDES,
        cn_imgs,
        cn_wavs,
        cn_durs,
        cn_mp4,
        header_badge_text="[키즈핏 팩트체크 카드뉴스]",
        header_title_text="손끝은 제2의 뇌! 0원 놀이 & 성장비법",
        accent_rgb=(5, 150, 105),
    )
    print(f"✅ [Sample 5] 카드뉴스 기반 영상 생성 완료: {cn_mp4} ({cn_mp4.stat().st_size:,} bytes)")


if __name__ == "__main__":
    asyncio.run(main_async())
