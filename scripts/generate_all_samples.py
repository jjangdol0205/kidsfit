# -*- coding: utf-8 -*-
"""
KidsFit Growth Studio - Master Sample Generator (scripts/generate_all_samples.py)
Generates all 5 tangible, high-resolution parenting samples:
  1. samples/1_blog_sample/       (blog_post_sample.md, blog_post_sample.html)
  2. samples/2_webtoon_sample/    (webtoon_cut_01~06.png [pure illustration only], webtoon_full_6cut.png, webtoon_preview.html)
  3. samples/3_cardnews_sample/   (cardnews_01~06.png [no CARD badge, no 공신력 검증 text], cardnews_preview.html)
  4. samples/4_webtoon_video_sample/webtoon_parenting_video.mp4  (1080x1920 MP4, 2.5s per cut = 15s total)
  5. samples/5_cardnews_video_sample/cardnews_parenting_video.mp4 (1080x1920 MP4, 2.5s per cut = 15s total)
"""

import asyncio
import math
import os
import struct
import subprocess
import wave
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
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

# Fixed duration per cut: 2.5 seconds (between 2~3 seconds as requested)
CUT_DURATION_SEC = 2.5


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
# 1. 6-CUT WEBTOON DATA & RENDERER (PURE ILLUSTRATION ONLY - NO EP.01 / SPEAKER)
# ==============================================================================
WEBTOON_CUTS = [
    {
        "num": 1,
        "raw": "cut_01.jpg",
        "tts": "내가 혼자 단추 끼울 거야!",
        "sub": "도와주겠다는 엄마 손을 뿌리치며\n혼자 하겠다고 고집부리는 세 살 아이"
    },
    {
        "num": 2,
        "raw": "cut_02.jpg",
        "tts": "내가 바빠서 우리 아이만 늦는 걸까?",
        "sub": "잠든 아이의 작은 손을 보며\n밤마다 찾아오는 엄마의 미안함"
    },
    {
        "num": 3,
        "raw": "cut_03.jpg",
        "tts": "고집이 아니라 손끝 소근육 민감기 신호!",
        "sub": "반항이 아니었습니다! 두뇌와 연결된\n'손끝 소근육 민감기'의 건강한 신호"
    },
    {
        "num": 4,
        "raw": "cut_04.jpg",
        "tts": "집게 놀이와 기다림으로 30분 초집중!",
        "sub": "비싼 전집 대신 손끝 힘을 기르는\n집게 놀이와 엄마의 다정한 기다림"
    },
    {
        "num": 5,
        "raw": "cut_05.jpg",
        "tts": "주말엔 눈높이 대화, 밤 10시엔 꿀잠!",
        "sub": "주말엔 눈높이 대화로 정서를 채우고\n밤 10시 깊은 숙면으로 키 성장을 지켜요"
    },
    {
        "num": 6,
        "raw": "cut_06.jpg",
        "tts": "아이 속도를 읽어주는 다정한 엄마면 충분해요.",
        "sub": "완벽한 엄마보다 아이의 속도를 읽어주는\n다정한 엄마면 충분합니다"
    }
]


def render_webtoon_samples():
    print("🎨 [Sample 2] 6컷 양육 공감 웹툰 렌더링 중 (텍스트 박스 없이 순수 그림만 출력)...")
    cut_images = []
    W, H = 1080, 1080

    for c in WEBTOON_CUTS:
        raw_path = WEBTOON_RAW_DIR / c["raw"]
        art = Image.open(raw_path).convert("RGB")
        # Pure illustration only (no EP.01 bar, no speech bubble, no 아이&엄마 box)
        canvas = art.resize((W, H), Image.Resampling.LANCZOS)

        out_path = WEBTOON_DIR / f"webtoon_cut_0{c['num']}.png"
        canvas.save(out_path, "PNG", optimize=True)
        cut_images.append(canvas)

    # Combine into full vertical strip
    strip_w = W
    strip_h = H * len(cut_images)
    strip = Image.new("RGB", (strip_w, strip_h), (250, 248, 245))
    for idx, img in enumerate(cut_images):
        strip.paste(img, (0, idx * H))
    strip.save(WEBTOON_DIR / "webtoon_full_6cut.png", "PNG", optimize=True)

    # Create clean HTML preview viewer
    html = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[웹툰 샘플] 퇴근 후 매일 미안한 워킹맘, 만 3세 고집의 진짜 이유 (6컷 육아웹툰)</title>
  <style>
    body { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; background: #FAF8F5; color: #1E293B; margin: 0; padding: 2rem 1rem; }
    .container { max-width: 720px; margin: 0 auto; background: #FFFFFF; border-radius: 28px; padding: 2rem; box-shadow: 0 12px 32px rgba(20,30,55,0.06); }
    h1 { font-size: 1.55rem; line-height: 1.35; margin: 0 0 1.5rem 0; text-align: center; }
    .cut-card { margin-bottom: 1.5rem; border-radius: 20px; overflow: hidden; }
    .cut-card img { width: 100%; display: block; }
    .cta-box { background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 20px; padding: 1.5rem; text-align: center; margin-top: 2rem; }
    .btn { display: inline-block; background: #4F46E5; color: #FFFFFF; font-weight: 800; padding: 0.85rem 1.5rem; border-radius: 9999px; text-decoration: none; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>“내가 다 할 거야!” 만 3세 아이의 고집, 사실은 '손끝 소근육 민감기' 신호였습니다</h1>
    <div class="cut-card"><img src="webtoon_cut_01.png" alt="웹툰 1컷"></div>
    <div class="cut-card"><img src="webtoon_cut_02.png" alt="웹툰 2컷"></div>
    <div class="cut-card"><img src="webtoon_cut_03.png" alt="웹툰 3컷"></div>
    <div class="cut-card"><img src="webtoon_cut_04.png" alt="웹툰 4컷"></div>
    <div class="cut-card"><img src="webtoon_cut_05.png" alt="웹툰 5컷"></div>
    <div class="cut-card"><img src="webtoon_cut_06.png" alt="웹툰 6컷"></div>
    <div class="cta-box">
      <h3 style="margin: 0 0 0.4rem 0; color: #065F46;">🎬 1컷당 2.5초 호흡으로 제작된 웹툰 영상 샘플도 확인해보세요!</h3>
      <a class="btn" href="../4_webtoon_video_sample/webtoon_parenting_video.mp4">▶ 웹툰 기반 영상 샘플 재생하기 (15초)</a>
      <a class="btn" style="background: #059669; margin-left: 0.5rem;" href="../../index.html">🏠 키즈핏 그로스 스튜디오 홈으로</a>
    </div>
  </div>
</body>
</html>"""
    (WEBTOON_DIR / "webtoon_preview.html").write_text(html, encoding="utf-8")
    print("✅ [Sample 2] 순수 일러스트 6컷 웹툰 PNG 6장 + 합본 + HTML 뷰어 생성 완료!")


# ==============================================================================
# 2. 6-CUT CARD NEWS DATA & RENDERER (NO 'CARD' BADGE, NO '공신력 검증' TEXT)
# ==============================================================================
CARDNEWS_SLIDES = [
    {
        "num": 1,
        "title": "“내가 혼자 할 거야!”\n만 3세 아이의 고집,\n혼내면 안 되는 진짜 이유",
        "subtitle": "퇴근 후 단추 씨름하며 울컥하는 엄마·아빠를 위한\n우리아이 두뇌 발달 & 성장 골든타임 가이드",
        "accent": (79, 70, 229),
        "bg_tint": (238, 242, 255),
        "raw_bg": "cut_01.jpg",
        "points": [
            "● 만 2~4세 아이가 혼자 하겠다고 고집부리는 뇌과학적 이유",
            "● 비싼 교구 사기 전 거실에서 시작하는 '0원 소근육 놀이'",
            "● 낮의 손끝 놀이가 밤 10시 '숨은 키 7cm'로 이어지는 비밀"
        ],
        "tts": "만 3세 아이의 고집, 혼내면 안 되는 진짜 이유!",
        "sub": "“내가 혼자 할 거야!” 만 3세 아이의 고집,\n혼내기 전에 꼭 알아야 할 발달과 성장의 비밀"
    },
    {
        "num": 2,
        "title": "손가락은 '제2의 뇌'\n뇌 운동피질의 30%가\n아이 손끝에 연결됩니다",
        "subtitle": "만 24~47개월 영유아 시기에 찾아오는 결정적 손끝 민감기",
        "accent": (5, 150, 105),
        "bg_tint": (236, 253, 245),
        "raw_bg": "cut_03.jpg",
        "points": [
            "● 뇌 지도(Homunculus): 손가락 영역이 대뇌 운동피질의 30% 차지",
            "● 삼지창 파지: 엄지·검지·중지 세 손가락 협응이 완성되는 시기",
            "★ 아이의 고집 = 전두엽 시냅스를 스스로 연결하려는 기특한 본능!"
        ],
        "tts": "손가락은 제2의 뇌! 운동피질의 30퍼센트가 연결됩니다.",
        "sub": "손가락은 제2의 뇌! 뇌 운동피질의 30%가 연결된\n세 손가락 협응의 결정적 민감기입니다."
    },
    {
        "num": 3,
        "title": "만 3세에 150만 원 가베?\n시기가 맞지 않으면\n‘거실 방치템’이 됩니다",
        "subtitle": "내 아이 월령에 딱 맞는 교육법 순서를 알아야 중복 지출을 막습니다",
        "accent": (249, 115, 22),
        "bg_tint": (255, 247, 237),
        "raw_bg": "cut_02.jpg",
        "points": [
            "● 만 2~3세 (24~47개월) 적기: 일상·감각 소근육 조작 놀이",
            "● 만 4~5세 (48~71개월) 적기: 은물·가베 입체 기하·공간지각 놀이",
            "★ 핵심 조언: 손끝 힘이 약한 만 3세에 추상 도형 가베는 좌절감만 유발!"
        ],
        "tts": "만 3세엔 일상 소근육 놀이가 먼저, 가베는 만 4세 이후에!",
        "sub": "만 2~3세는 손끝 힘을 기르는 일상 소근육 놀이가 먼저!\n가베는 만 4세 이후에 시작해야 중복 지출을 막습니다."
    },
    {
        "num": 4,
        "title": "비싼 장난감 사기 전,\n오늘 저녁 주방 서랍으로\n시작하는 '0원 놀이 3선'",
        "subtitle": "하루 15분, 엄마·아빠의 다정한 눈맞춤과 집안 소품이면 충분합니다",
        "accent": (79, 70, 229),
        "bg_tint": (238, 242, 255),
        "raw_bg": "cut_04.jpg",
        "points": [
            "① 나무 빨래집게 색깔 놀이: 엄지·검지 '악어 손가락' 악력 강화",
            "② 페트병 뚜껑 저금통 넣기: 다 쓴 물티슈 캡 구멍에 뚜껑 밀어 넣기",
            "③ 휴지심 사자 갈기 오리기: 도톰한 휴지심 끝을 안전가위로 톡톡 오리기"
        ],
        "tts": "빨래집게와 휴지심으로 오늘 저녁 0원 놀이를 시작해 보세요!",
        "sub": "나무 빨래집게, 페트병 뚜껑, 다 쓴 휴지심으로\n오늘 저녁 15분 '거실 0원 소근육 놀이'를 시작해보세요."
    },
    {
        "num": 5,
        "title": "낮에 손끝을 쓴 아이가\n밤 10시 '숨은 키 7cm'\n성장호르몬도 폭발합니다",
        "subtitle": "깊은 숙면과 자연식 영양·바른 자세가 만드는 키 성장 시너지",
        "accent": (5, 150, 105),
        "bg_tint": (236, 253, 245),
        "raw_bg": "cut_05.jpg",
        "points": [
            "● 밤 10시~새벽 2시: 깊은 숙면 중 일일 성장호르몬(GH) 65% 집중 분비",
            "● 일일 칼슘(600~800mg): 우유 배앓이 시 잔멸치·두부·치즈로 대체",
            "● 숨은 키 2cm 자세 습관: 스마트폰 거북목 예방 & 하루 10분 점프 운동"
        ],
        "tts": "밤 10시 깊은 숙면과 자연식 칼슘으로 숨은 키를 깨워주세요!",
        "sub": "밤 10시 깊은 숙면과 자연식 칼슘·바른 자세로\n우리 아이 숨은 키 7cm를 지켜주세요."
    },
    {
        "num": 6,
        "title": "완벽한 엄마보다\n아이의 속도를 읽어주는\n다정한 엄마면 충분합니다",
        "subtitle": "우리 아이 신체 성장 × 소근육 발달 × 주말 나들이 맞춤 가이드",
        "accent": (79, 70, 229),
        "bg_tint": (238, 242, 255),
        "raw_bg": "cut_06.jpg",
        "points": [
            "① 신체 성장: 우리 아이 키·몸무게 백분위 & 부모 유전키 대비 예상키",
            "② 두뇌·소근육 발달: 6각 발달 밸런스 & 월령별 0원 집콕놀이 처방",
            "③ 주말 나들이 코스: 내 지역 × 아이 관심사 미술관·박물관 대화 가이드"
        ],
        "tts": "아이의 속도를 읽어주는 다정한 엄마, 키즈핏이 함께합니다.",
        "sub": "아이의 성장 속도를 읽어주는 다정한 나침반,\n키즈핏 그로스 스튜디오에서 맞춤 가이드를 확인하세요."
    }
]


def render_cardnews_samples():
    print("📊 [Sample 3] 6컷 양육 카드뉴스 렌더링 중 (CARD 배지 및 공신력 검증 문구 제거)...")
    W, H = 1080, 1350

    font_title = get_font(52, bold=True)
    font_sub = get_font(28, bold=False)
    font_point = get_font(27, bold=True)

    for s in CARDNEWS_SLIDES:
        canvas = Image.new("RGB", (W, H), (250, 248, 245))
        draw = ImageDraw.Draw(canvas)
        acc = s["accent"]
        tint = s["bg_tint"]

        # Outer card frame (no top CARD pill, no bottom 공신력 검증 footer)
        draw_rounded_rect(draw, (36, 36, W - 36, H - 36), radius=36, fill=(255, 255, 255), outline=(226, 232, 240), width=3)

        # Main Headline starting cleanly at top
        ty = 96
        for line in s["title"].split("\n"):
            draw.text((84, ty), line, font=font_title, fill=(15, 23, 42))
            ty += 68

        # Subtitle
        ty += 14
        for line in s["subtitle"].split("\n"):
            draw.text((86, ty), line, font=font_sub, fill=(100, 116, 139))
            ty += 40

        # Center Visual Illustration Strip (from raw webtoon art)
        raw_path = WEBTOON_RAW_DIR / s["raw_bg"]
        art = Image.open(raw_path).convert("RGB")
        vw, vh = W - 168, 450
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
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, vw, vh), radius=28, fill=255)
        canvas.paste(art_c, (84, 425), mask)
        draw_rounded_rect(draw, (84, 425, 84 + vw, 425 + vh), radius=28, outline=acc, width=3)

        # 3 Key Actionable Points Box
        py = 915
        for pt in s["points"]:
            draw_rounded_rect(draw, (84, py, W - 84, py + 104), radius=22, fill=tint, outline=acc, width=2)
            pt_lines = wrap_korean_text(draw, pt, font_point, W - 220)
            ly = py + (104 - len(pt_lines) * 34) // 2 - 4
            for pl in pt_lines:
                draw.text((114, ly), pl, font=font_point, fill=(30, 41, 59))
                ly += 34
            py += 120

        out_path = CARDNEWS_DIR / f"cardnews_0{s['num']}.png"
        canvas.save(out_path, "PNG", optimize=True)

    # Create clean HTML preview for Card News
    html = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[카드뉴스 샘플] 만 3세 아이의 고집, 혼내면 안 되는 진짜 이유 (6컷 카드뉴스)</title>
  <style>
    body { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; background: #FAF8F5; color: #1E293B; margin: 0; padding: 2rem 1rem; }
    .container { max-width: 980px; margin: 0 auto; background: #FFFFFF; border-radius: 28px; padding: 2rem; box-shadow: 0 12px 32px rgba(20,30,55,0.06); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1.25rem; margin-top: 1.5rem; }
    .card { border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 14px rgba(0,0,0,0.04); }
    .card img { width: 100%; display: block; }
    .cta-box { background: #EEF2FF; border: 1.5px solid #C7D2FE; border-radius: 20px; padding: 1.5rem; text-align: center; margin-top: 2rem; }
    .btn { display: inline-block; background: #4F46E5; color: #FFFFFF; font-weight: 800; padding: 0.85rem 1.5rem; border-radius: 9999px; text-decoration: none; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="margin: 0 0 0.5rem 0;">“내가 혼자 할 거야!” 만 3세 아이의 고집, 혼내면 안 되는 진짜 이유</h1>
    <div class="grid">
      <div class="card"><img src="cardnews_01.png" alt="카드뉴스 1"></div>
      <div class="card"><img src="cardnews_02.png" alt="카드뉴스 2"></div>
      <div class="card"><img src="cardnews_03.png" alt="카드뉴스 3"></div>
      <div class="card"><img src="cardnews_04.png" alt="카드뉴스 4"></div>
      <div class="card"><img src="cardnews_05.png" alt="카드뉴스 5"></div>
      <div class="card"><img src="cardnews_06.png" alt="카드뉴스 6"></div>
    </div>
    <div class="cta-box">
      <h3 style="margin: 0 0 0.4rem 0; color: #312E81;">🎬 1컷당 2.5초 호흡으로 제작된 카드뉴스 영상 샘플도 확인해보세요!</h3>
      <a class="btn" href="../5_cardnews_video_sample/cardnews_parenting_video.mp4">▶ 카드뉴스 기반 영상 샘플 재생하기 (15초)</a>
      <a class="btn" style="background: #059669; margin-left: 0.5rem;" href="../../index.html">🏠 키즈핏 그로스 스튜디오 홈으로</a>
    </div>
  </div>
</body>
</html>"""
    (CARDNEWS_DIR / "cardnews_preview.html").write_text(html, encoding="utf-8")
    print("✅ [Sample 3] 6컷 카드뉴스 PNG 6장 + HTML 뷰어 생성 완료!")


# ==============================================================================
# 3. SYNTHESIZE WARM ACOUSTIC BGM WAV & SHORT TTS + BUILD 2.5s/CUT MP4 VIDEOS
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
    beat_sec = 1.25

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

            env = math.exp(-local_t * 1.4) * min(1.0, local_t / 0.05)
            val = 0.0
            for idx, freq in enumerate(chord):
                val += math.sin(2.0 * math.pi * freq * t) * 0.22 * env
                arp_offset = idx * 0.25
                if local_t >= arp_offset:
                    at = local_t - arp_offset
                    a_env = math.exp(-at * 2.5) * min(1.0, at / 0.03)
                    val += math.sin(2.0 * math.pi * (freq * 2.0) * t) * 0.12 * a_env

            master = 0.18
            if t < 0.5:
                master *= t / 0.5
            elif duration_sec - t < 0.8:
                master *= max(0.0, (duration_sec - t) / 0.8)

            sample = int(max(-1.0, min(1.0, val * master)) * 32767)
            frames.extend(struct.pack("<h", sample))

        wf.writeframes(frames)


async def synthesize_tts_clips(items, out_dir: Path, prefix: str, target_dur: float = CUT_DURATION_SEC):
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

        # Fit each cut's audio to exactly `target_dur` (2.5s) using atempo + apad + atrim
        subprocess.run(
            [
                ffmpeg_exe, "-y", "-i", str(mp3_path),
                "-af", f"atempo=1.28,apad=whole_dur={target_dur},atrim=0:{target_dur}",
                "-ar", "44100", "-ac", "1",
                str(wav_path)
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        wav_files.append(wav_path)
        durations.append(target_dur)
        mp3_path.unlink(missing_ok=True)

    return wav_files, durations


def build_vertical_video(
    items,
    slide_images,
    wav_files,
    durations,
    out_mp4_path: Path,
    header_title_text: str,
    accent_rgb=(79, 70, 229),
    is_webtoon: bool = False,
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
    generate_warm_music_wav(bgm_wav, total_dur + 0.2, 44100)

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

    # 2. Render 1080x1920 vertical video frames @ 24fps (2.5s per cut = 60 frames/cut, 15s total)
    fps = 24
    VW, VH = 1080, 1920
    font_top_title = get_font(40, bold=True)
    font_sub = get_font(33, bold=True)

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
        "-crf", "16",
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

            # Clean Title at top (no EP.01 / CARD / 공신력 검증 text)
            bbox_t = draw.textbbox((0, 0), header_title_text, font=font_top_title)
            tw = bbox_t[2] - bbox_t[0]
            draw.text(((VW - tw) // 2, 95), header_title_text, font=font_top_title, fill=(15, 23, 42))

            # Subtle Ken Burns zoom on the image
            if is_webtoon:
                card_w, card_h = 992, 992
                card_y = 260
            else:
                card_w, card_h = 992, 1240
                card_y = 190

            zoom = 1.0 + 0.04 * prog
            zw, zh = int(card_w * zoom), int(card_h * zoom)
            resized = src_img.resize((zw, zh), Image.Resampling.BILINEAR)
            cx = (zw - card_w) // 2
            cy = (zh - card_h) // 2
            cropped = resized.crop((cx, cy, cx + card_w, cy + card_h))
            frame.paste(cropped, (44, card_y))
            draw_rounded_rect(draw, (44, card_y, 44 + card_w, card_y + card_h), radius=28, outline=accent_rgb, width=3)

            # Subtitle Box at bottom
            sub_y1 = 1330 if is_webtoon else 1485
            sub_y2 = sub_y1 + 240
            draw_rounded_rect(draw, (44, sub_y1, VW - 44, sub_y2), radius=28, fill=(15, 23, 42), outline=accent_rgb, width=3)
            sub_lines = item["sub"].split("\n")
            sy = sub_y1 + (60 if len(sub_lines) == 2 else 90)
            for sline in sub_lines:
                bbox = draw.textbbox((0, 0), sline, font=font_sub)
                lw = bbox[2] - bbox[0]
                draw.text(((VW - lw) // 2, sy), sline, font=font_sub, fill=(255, 255, 255))
                sy += 54

            # Progress bar
            pb_y = sub_y2 + 45
            draw_rounded_rect(draw, (44, pb_y, VW - 44, pb_y + 18), radius=9, fill=(226, 232, 240))
            bar_w = int((VW - 88) * min(1.0, global_prog))
            if bar_w > 12:
                draw_rounded_rect(draw, (44, pb_y, 44 + bar_w, pb_y + 18), radius=9, fill=accent_rgb)

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

## 2. 손가락은 '제2의 뇌' — 보건복지부 K-DST가 말하는 36개월의 비밀

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

## 4. 낮에 손끝을 쓴 아이가 밤 10시 '숨은 키 7cm'도 자랍니다

소근육과 두뇌 발달만큼이나 부모님들이 놓치지 말아야 할 것이 바로 **신체 성장 골든타임**입니다.
**대한소아내분비학회**와 **미국수면재단(NSF)**의 연구에 따르면, 낮 동안 손끝과 신체를 충분히 움직이며 몰입한 아이는 밤에 뇌파가 안정되어 **깊은 서파수면(Slow-Wave Sleep)**에 훨씬 빠르게 진입합니다. 그리고 하루 성장호르몬(GH)의 **65~70%는 바로 밤 10시~새벽 2시 깊은 서파수면 구간**에 집중 분비됩니다.

### 🥗 보건복지부 한국인 영양소 섭취기준(KDRIs) 연령별 1일 권장량 & 집밥 식단표

| 연령 기준 (KDRIs 2020) | 일일 칼슘 권장량 | 일일 비타민D / 단백질 | 우유 배앓이 없는 자연식 밥상 1일 환산 예시 |
| :--- | :--- | :--- | :--- |
| **만 1~2세 (12~35개월)** | **500 mg / 일** | 400 IU / 20 g | 아기치즈 1장(130mg) + 두부 반 모(140mg) + 잔멸치 다짐 1큰술(120mg) + 플레인 요거트 |
| **만 3~5세 (36~71개월)** | **600 mg / 일** | 400 IU / 25 g | 슬라이스 치즈 1.5장(200mg) + 잔멸치 주먹밥(180mg) + 달걀노른자 1개 + 브로콜리 무침 |
| **만 6~8세 (초등 저학년)** | **700 mg / 일** | 400 IU / 35 g | 두부구이 1모(280mg) + 뱅어포·멸치볶음(220mg) + 소고기 장조림 + 구운 연어 |
| **만 9~11세 (사춘기 진입)** | **800 mg / 일** | 400 IU / 50 g | 고칼슘 치즈 2장(300mg) + 뼈째 먹는 생선 + 두부 된장국 + 소고기·달걀 단백질 식단 |

---

## 5. 우리 아이만의 성장·발달 속도를 무료로 점검해 보세요

아이마다 자라나는 속도와 기질은 세상에 단 하나뿐인 지문처럼 다릅니다.
옆집 아이의 교구나 영양제를 따라 사기보다, 먼저 **공신력 있는 국가 표준 데이터에 우리 아이의 현재 키·몸무게와 개월 수를 대입해 객관적인 방향**을 확인해 보시는 건 어떨까요?

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
      <strong>🏛️ 국가 표준 데이터 기반 양육 가이드:</strong> 본 칼럼은 <strong>보건복지부 『한국 영유아 발달선별검사(K-DST)』</strong>, <strong>질병관리청 『소아청소년 성장도표(KDCA)』</strong>, <strong>보건복지부·한국영양학회 『한국인 영양소 섭취기준(KDRIs)』</strong>, <strong>대한소아내분비학회</strong> 기준을 바탕으로 작성된 양육 지원 칼럼입니다.
    </div>

    <h2>1. 퇴근 후 현관에서 시작되는 단추 씨름, 왜 이토록 눈물이 날까요?</h2>
    <p>퇴근하고 돌아와 저녁밥을 올려놓아야 하는 바쁜 저녁 7시. 어린이집 가방을 내려놓기도 전에 세 살배기 아이가 조그만 손으로 외투 단추를 붙잡고 소리칩니다. <em>“싫어! 엄마 가! 내가 혼자 할 거야!!”</em></p>
    <p>마음은 급한데 아이는 10분째 단추 구멍 하나를 끼우지 못해 낑낑대고, 급기야 식탁 위 물컵까지 혼자 따르겠다며 바지에 물을 다 쏟아버립니다. 그날 밤 곤히 잠든 아이의 작은 손을 쓰다듬으며 엄마는 <em>‘내가 일하느라 바빠서 우리 아이만 소근육이 늦는 걸까?’</em> 자책하곤 합니다.</p>

    <div class="visual-grid">
      <img src="../2_webtoon_sample/webtoon_cut_01.png" alt="육아웹툰 1컷">
      <img src="../2_webtoon_sample/webtoon_cut_03.png" alt="육아웹툰 3컷">
    </div>

    <h2>2. 손가락은 '제2의 뇌' — 대뇌 운동피질의 30%가 손끝에 연결됩니다</h2>
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

    <h2>4. 낮에 손끝을 쓴 아이가 밤 10시 '숨은 키 7cm'도 자랍니다</h2>
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

    print(f"🎬 [Sample 4] 6컷 웹툰 기반 영상 샘플(1컷당 {CUT_DURATION_SEC}초, 총 {CUT_DURATION_SEC * 6:.0f}초) 생성 중...")
    wt_wavs, wt_durs = await synthesize_tts_clips(WEBTOON_CUTS, WEBTOON_VID_DIR, "wt", CUT_DURATION_SEC)
    wt_imgs = [WEBTOON_DIR / f"webtoon_cut_0{c['num']}.png" for c in WEBTOON_CUTS]
    wt_mp4 = WEBTOON_VID_DIR / "webtoon_parenting_video.mp4"
    build_vertical_video(
        WEBTOON_CUTS,
        wt_imgs,
        wt_wavs,
        wt_durs,
        wt_mp4,
        header_title_text="만 3세 아이의 고집, 진짜 이유는?",
        accent_rgb=(79, 70, 229),
        is_webtoon=True,
    )
    print(f"✅ [Sample 4] 웹툰 기반 영상 생성 완료: {wt_mp4} ({wt_mp4.stat().st_size:,} bytes)")

    print(f"🎬 [Sample 5] 6컷 카드뉴스 기반 영상 샘플(1컷당 {CUT_DURATION_SEC}초, 총 {CUT_DURATION_SEC * 6:.0f}초) 생성 중...")
    cn_wavs, cn_durs = await synthesize_tts_clips(CARDNEWS_SLIDES, CARDNEWS_VID_DIR, "cn", CUT_DURATION_SEC)
    cn_imgs = [CARDNEWS_DIR / f"cardnews_0{s['num']}.png" for s in CARDNEWS_SLIDES]
    cn_mp4 = CARDNEWS_VID_DIR / "cardnews_parenting_video.mp4"
    build_vertical_video(
        CARDNEWS_SLIDES,
        cn_imgs,
        cn_wavs,
        cn_durs,
        cn_mp4,
        header_title_text="손끝은 제2의 뇌! 0원 놀이 & 성장비법",
        accent_rgb=(5, 150, 105),
        is_webtoon=False,
    )
    print(f"✅ [Sample 5] 카드뉴스 기반 영상 생성 완료: {cn_mp4} ({cn_mp4.stat().st_size:,} bytes)")


if __name__ == "__main__":
    asyncio.run(main_async())
