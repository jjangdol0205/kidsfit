# -*- coding: utf-8 -*-
"""
Generates KidsFit Growth Studio official brand assets matching truthofmarket.com:
1. kidsfit_profile_500.png (500x500) - Blog & Cafe Profile Image
2. kidsfit_cafe_title_1080x220.png (1080x220) - Cafe Top Title Banner
3. kidsfit_cafe_gate_1080x520.png (1080x520) - Cafe Front Gate Image
4. kidsfit_blog_skin_966x240.png (966x240) & kidsfit_blog_skin_1920x440.png (1920x440) - Blog Title/Background Skin
5. kidsfit_post1_welcome_banner.png (1080x640) - Visual header for Cafe Post 1 (Welcome Notice)
6. kidsfit_post3_challenge_banner.png (1080x640) - Visual header for Cafe Post 3 (Monthly 1st Day Challenge)
"""

import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\사업아이템")
OUT_DIR = ROOT / "samples" / "9_naver_brand_assets"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_BOLD = r"C:\Windows\Fonts\malgunbd.ttf"
FONT_REG = r"C:\Windows\Fonts\malgun.ttf"


def fnt(size: int, bold: bool = True):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def draw_rounded_rect(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def make_profile_icon():
    W, H = 500, 500
    img = Image.new("RGB", (W, H), (250, 248, 245))  # #FAF8F5 Warm Ivory
    draw = ImageDraw.Draw(img)

    # Outer soft indigo frame
    draw_rounded_rect(draw, (18, 18, W - 18, H - 18), 96, fill=(255, 255, 255), outline=(79, 70, 229), width=6)

    # Top pill badge
    draw_rounded_rect(draw, (95, 52, W - 95, 102), 25, fill=(238, 242, 255))
    b_text = "KIDS-FIT STUDIO"
    tb = draw.textbbox((0, 0), b_text, font=fnt(24, True))
    draw.text(((W - (tb[2] - tb[0])) // 2, 62), b_text, font=fnt(24, True), fill=(79, 70, 229))

    # Center dual icon badges (Growth + Brain)
    draw_rounded_rect(draw, (70, 128, 238, 245), 28, fill=(236, 253, 245), outline=(16, 185, 129), width=3)
    draw.text((100, 145), "신체 성장", font=fnt(26, True), fill=(5, 150, 105))
    draw.text((92, 188), "+7cm 처방", font=fnt(28, True), fill=(4, 120, 87))

    draw_rounded_rect(draw, (262, 128, 430, 245), 28, fill=(238, 242, 255), outline=(79, 70, 229), width=3)
    draw.text((292, 145), "두뇌 발달", font=fnt(26, True), fill=(79, 70, 229))
    draw.text((284, 188), "5대 LQ 진단", font=fnt(28, True), fill=(67, 56, 202))

    # Main Korean Title
    t1 = "키즈핏"
    tb1 = draw.textbbox((0, 0), t1, font=fnt(74, True))
    draw.text(((W - (tb1[2] - tb1[0])) // 2, 265), t1, font=fnt(74, True), fill=(15, 23, 42))

    t2 = "소아성장 · 두뇌학습 연구소"
    tb2 = draw.textbbox((0, 0), t2, font=fnt(27, True))
    draw.text(((W - (tb2[2] - tb2[0])) // 2, 362), t2, font=fnt(27, True), fill=(71, 85, 105))

    # Bottom domain pill
    draw_rounded_rect(draw, (85, 412, W - 85, 456), 22, fill=(79, 70, 229))
    d_txt = "kidsfit.co.kr"
    tbd = draw.textbbox((0, 0), d_txt, font=fnt(23, True))
    draw.text(((W - (tbd[2] - tbd[0])) // 2, 419), d_txt, font=fnt(23, True), fill=(255, 255, 255))

    out = OUT_DIR / "kidsfit_profile_500.png"
    img.save(out, "PNG")
    return out


def make_banner_card(width: int, height: int, badge: str, title: str, subtitle: str, pills: list[tuple[str, tuple, tuple]], filename: str):
    img = Image.new("RGB", (width, height), (250, 248, 245))  # #FAF8F5 Warm Ivory
    draw = ImageDraw.Draw(img)

    # Soft decorative accent circles
    draw.ellipse((width - 340, -120, width + 80, 300), fill=(238, 242, 255))
    draw.ellipse((-100, height - 220, 240, height + 120), fill=(236, 253, 245))

    # White clinic card container
    pad = 28
    draw_rounded_rect(draw, (pad, pad, width - pad, height - pad), 32, fill=(255, 255, 255), outline=(226, 232, 240), width=3)

    # Left accent bar
    draw_rounded_rect(draw, (pad + 28, pad + 34, pad + 40, height - pad - 34), 6, fill=(79, 70, 229))

    x0 = pad + 68
    y = pad + 36

    # Badge
    tb = draw.textbbox((0, 0), badge, font=fnt(22, True))
    bw = tb[2] - tb[0] + 36
    draw_rounded_rect(draw, (x0, y, x0 + bw, y + 44), 22, fill=(238, 242, 255))
    draw.text((x0 + 18, y + 8), badge, font=fnt(22, True), fill=(79, 70, 229))
    y += 62

    # Main Title
    title_size = 44 if height >= 400 else 34
    for line in title.split("\n"):
        draw.text((x0, y), line, font=fnt(title_size, True), fill=(15, 23, 42))
        y += int(title_size * 1.32)

    y += 6
    sub_size = 25 if height >= 400 else 20
    draw.text((x0, y), subtitle, font=fnt(sub_size, False), fill=(71, 85, 105))
    y += int(sub_size * 1.8)

    # Pills
    if pills and y + 54 < height - pad:
        px = x0
        for p_txt, bg_col, fg_col in pills:
            ptb = draw.textbbox((0, 0), p_txt, font=fnt(22, True))
            pw = ptb[2] - ptb[0] + 36
            draw_rounded_rect(draw, (px, y, px + pw, y + 48), 24, fill=bg_col, outline=fg_col, width=2)
            draw.text((px + 18, y + 10), p_txt, font=fnt(22, True), fill=fg_col)
            px += pw + 16

    out = OUT_DIR / filename
    img.save(out, "PNG")
    return out


def main():
    p_icon = make_profile_icon()
    p_cafe_title = make_banner_card(
        1080, 240,
        badge="KIDS-FIT GROWTH STUDIO · 질병관리청 성장도표 & K-DST 기준",
        title="키즈핏 소아성장 · 두뇌발달 양육 연구소",
        subtitle="우리 아이 숨은 키 +7cm 골든타임 처방 × 5대 두뇌 역량(LQ) 맞춤 학습 로드맵 (kidsfit.co.kr)",
        pills=[],
        filename="kidsfit_cafe_title_1080x240.png",
    )
    p_cafe_gate = make_banner_card(
        1080, 520,
        badge="BUILT ON OFFICIAL STANDARDS · 질병관리청 성장도표 & 보건복지부 K-DST 기준",
        title="우리 아이 숨은 키 +7cm 골든타임과\n두뇌·학습 5대 역량(LQ)을 1분 만에 진단하세요",
        subtitle="질병관리청 성장도표 · 보건복지부 K-DST 기반 맞춤형 신체 성장 & 자기주도 학습 처방 플랫폼 (kidsfit.co.kr)",
        pills=[
            ("📏 키 백분위 & 유전 예상키(MPH)", (236, 253, 245), (5, 150, 105)),
            ("🧠 5대 두뇌 역량 & 공부법 처방", (238, 242, 255), (79, 70, 229)),
            ("🎁 연령별 무료 워크지 PDF 나눔", (255, 247, 237), (234, 88, 12)),
        ],
        filename="kidsfit_cafe_gate_1080x520.png",
    )
    p_blog_skin = make_banner_card(
        966, 260,
        badge="KIDS-FIT OFFICIAL COLUMN · 소아성장 & 두뇌학습 연구소",
        title="키즈핏(KIDS-FIT) 우리 아이 키성장 · 두뇌학습 공식 칼럼",
        subtitle="질병관리청 성장도표 · K-DST 기준 1분 무료 진단 → kidsfit.co.kr",
        pills=[],
        filename="kidsfit_blog_skin_966x260.png",
    )
    p_post1 = make_banner_card(
        1080, 520,
        badge="WELCOME TO KIDS-FIT CAFE · 공식 환영 공지 & 이용 가이드",
        title="키즈핏(KIDS-FIT) 공식 네이버 카페에\n오신 학부모님들을 진심으로 환영합니다!",
        subtitle="질병관리청 성장도표 & 보건복지부 K-DST 기준 우리 아이 1:1 성장·학습 로드맵",
        pills=[
            ("1️⃣ 1분 무료 진단 리포트", (238, 242, 255), (79, 70, 229)),
            ("2️⃣ 무료 워크지 PDF 3종", (236, 253, 245), (5, 150, 105)),
            ("3️⃣ 매월 1일 성장·학습 인증", (255, 247, 237), (234, 88, 12)),
        ],
        filename="kidsfit_post1_welcome_banner.png",
    )
    p_post3 = make_banner_card(
        1080, 520,
        badge="MONTHLY 1ST DAY CHALLENGE · 매월 1일 공식 리포트 인증 이벤트",
        title="매월 1일은 우리 아이 키 & 두뇌 역량\n정기 점검일! 리포트 인증 챌린지",
        subtitle="6개월 누적 기록 시 숨은 키 손실 방어 & 자기주도 학습 루틴 정착",
        pills=[
            ("📏 매월 1일 아침 키·체중 기록", (236, 253, 245), (5, 150, 105)),
            ("🧠 5대 학습 역량(LQ) 점수 비교", (238, 242, 255), (79, 70, 229)),
            ("🏅 우수 인증 학부모 특별 혜택", (255, 247, 237), (234, 88, 12)),
        ],
        filename="kidsfit_post3_challenge_banner.png",
    )
    print("✅ 브랜드 이미지 6종 생성 완료:", p_icon, p_cafe_title, p_cafe_gate, p_blog_skin, p_post1, p_post3, flush=True)


if __name__ == "__main__":
    main()
