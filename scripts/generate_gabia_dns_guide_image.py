#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates a high-resolution visual cheat-sheet image for setting up `kidsfit.co.kr`
in Gabia DNS (dns.gabia.com) and Render Custom Domains (dashboard.render.com).
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT_DIR / "인스타_쓰레드_프로필_모음"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = OUT_DIR / "05_가비아_kidsfit_DNS설정_한눈에보기_표.png"


def get_font(size: int, bold: bool = True):
    candidates = (
        ["C:/Windows/Fonts/malgunbd.ttf", "C:/Windows/Fonts/NanumGothicBold.ttf"]
        if bold
        else ["C:/Windows/Fonts/malgun.ttf", "C:/Windows/Fonts/NanumGothic.ttf"]
    )
    for c in candidates:
        if os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


def main():
    W, H = 1200, 1380
    img = Image.new("RGB", (W, H), (248, 250, 252))
    draw = ImageDraw.Draw(img)

    # Top Header Banner
    draw.rounded_rectangle((36, 32, W - 36, 195), radius=28, fill=(15, 23, 42))
    f_badge = get_font(22, True)
    f_title = get_font(40, True)
    f_sub = get_font(22, False)

    draw.rounded_rectangle((68, 56, 410, 96), radius=14, fill=(56, 189, 248))
    draw.text((86, 62), "KIDS-FIT 도메인 연결 가이드", font=f_badge, fill=(15, 23, 42))
    draw.text((68, 108), "kidsfit.co.kr 가비아 DNS 1분 설정표", font=f_title, fill=(255, 255, 255))

    # Step 1 Card: Gabia DNS
    draw.rounded_rectangle((36, 220, W - 36, 860), radius=28, fill=(255, 255, 255), outline=(203, 213, 225), width=2)
    draw.rounded_rectangle((68, 250, 240, 294), radius=12, fill=(79, 70, 229))
    draw.text((88, 258), "STEP 1", font=get_font(24, True), fill=(255, 255, 255))
    draw.text((258, 254), "가비아 DNS 관리툴 (dns.gabia.com) 접속", font=get_font(30, True), fill=(15, 23, 42))
    draw.text(
        (68, 308),
        "① [DNS 관리툴] → kidsfit.co.kr 우측 [설정] 클릭 → [레코드 수정] 클릭 후 아래 2줄을 추가하세요.",
        font=get_font(22, False),
        fill=(71, 85, 105),
    )

    # Table Header
    table_x1, table_x2 = 68, W - 68
    col_x = [68, 230, 410, 930, 1060, W - 68]
    header_y1, header_y2 = 360, 425
    draw.rounded_rectangle((table_x1, header_y1, table_x2, header_y2), radius=14, fill=(241, 245, 249))
    headers = ["타입(Type)", "호스트(Host)", "값 / 위치 (Value)", "TTL", "상태"]
    for i, h_text in enumerate(headers):
        draw.text((col_x[i] + 18, header_y1 + 18), h_text, font=get_font(22, True), fill=(30, 41, 59))

    # Row 1: A Record
    r1_y1, r1_y2 = 440, 545
    draw.rounded_rectangle((table_x1, r1_y1, table_x2, r1_y2), radius=16, fill=(239, 246, 255), outline=(147, 197, 253), width=2)
    draw.text((col_x[0] + 24, r1_y1 + 32), "A", font=get_font(30, True), fill=(37, 99, 235))
    draw.text((col_x[1] + 24, r1_y1 + 32), "@", font=get_font(30, True), fill=(15, 23, 42))
    draw.text((col_x[2] + 20, r1_y1 + 20), "216.24.57.1", font=get_font(30, True), fill=(15, 23, 42))
    draw.text((col_x[2] + 20, r1_y1 + 62), "(기본 도메인 kidsfit.co.kr 연결 IP)", font=get_font(19, False), fill=(71, 85, 105))
    draw.text((col_x[3] + 18, r1_y1 + 35), "3600", font=get_font(24, True), fill=(71, 85, 105))
    draw.text((col_x[4] + 14, r1_y1 + 35), "[확인]", font=get_font(22, True), fill=(37, 99, 235))

    # Row 2: CNAME Record
    r2_y1, r2_y2 = 565, 685
    draw.rounded_rectangle((table_x1, r2_y1, table_x2, r2_y2), radius=16, fill=(236, 253, 245), outline=(110, 231, 183), width=2)
    draw.text((col_x[0] + 18, r2_y1 + 38), "CNAME", font=get_font(28, True), fill=(5, 150, 105))
    draw.text((col_x[1] + 18, r2_y1 + 38), "www", font=get_font(28, True), fill=(15, 23, 42))
    draw.text((col_x[2] + 20, r2_y1 + 20), "truth-of-market.onrender.com.", font=get_font(27, True), fill=(5, 150, 105))
    draw.text((col_x[2] + 20, r2_y1 + 64), "★주의: 맨 끝에 마침표(.)까지 꼭 찍어야 입력됩니다!", font=get_font(20, True), fill=(220, 38, 38))
    draw.text((col_x[3] + 18, r2_y1 + 40), "3600", font=get_font(24, True), fill=(71, 85, 105))
    draw.text((col_x[4] + 14, r2_y1 + 40), "[확인]", font=get_font(22, True), fill=(5, 150, 105))

    # Warning / Tip Box inside Step 1
    draw.rounded_rectangle((68, 710, W - 68, 830), radius=16, fill=(255, 251, 235), outline=(252, 211, 77), width=2)
    draw.text(
        (86, 728),
        "★ 가비아 입력 꿀팁: 두 줄 모두 우측 [확인]을 누른 뒤, 화면 맨 아래 파란색 [저장] 버튼을 꼭 눌러주세요!",
        font=get_font(21, True),
        fill=(180, 83, 9),
    )
    draw.text(
        (92, 772),
        "   (만약 기존에 @ 나 www 로 등록된 주차페이지 A레코드가 있다면 삭제 후 위 2줄만 남겨주시면 됩니다.)",
        font=get_font(20, False),
        fill=(146, 64, 14),
    )

    # Step 2 Card: Render Custom Domain Registration
    draw.rounded_rectangle((36, 890, W - 36, 1340), radius=28, fill=(255, 255, 255), outline=(203, 213, 225), width=2)
    draw.rounded_rectangle((68, 920, 240, 964), radius=12, fill=(16, 185, 129))
    draw.text((88, 928), "STEP 2", font=get_font(24, True), fill=(255, 255, 255))
    draw.text((258, 924), "Render 서버에 kidsfit.co.kr 도메인 & 무료 SSL 등록", font=get_font(30, True), fill=(15, 23, 42))

    steps_text = [
        "1. Render 대시보드 (dashboard.render.com) 접속 → [truth-of-market] 클릭",
        "2. 왼쪽 메뉴에서 [Settings] 클릭 → 아래로 스크롤하여 [Custom Domains] 섹션 이동",
        "3. [+ Add Custom Domain] 버튼 클릭 → 입력창에  kidsfit.co.kr  입력 후 [Save] 클릭",
        "4. [Verify] 버튼을 누르면 1~2분 내 무료 보안인증서(HTTPS)가 자동 발급되어 즉시 연결 완료!",
        "※ 홈페이지 코드·서버·메타태그·웹툰/블로그 링크는 이미 kidsfit.co.kr 로 100% 세팅 완료되었습니다!",
    ]
    y_cursor = 995
    for idx, line in enumerate(steps_text):
        color = (5, 150, 105) if idx == 4 else (30, 41, 59)
        font_use = get_font(23, True if idx in (2, 3, 4) else False)
        draw.text((68, y_cursor), line, font=font_use, fill=color)
        y_cursor += 62

    img.save(OUT_PATH, "PNG")
    print(f"Saved: {OUT_PATH}")


if __name__ == "__main__":
    main()
