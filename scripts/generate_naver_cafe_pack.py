#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KidsFit Growth & Learning Studio — Naver Cafe All-in-One Pack Generator
Generates:
1. 3 Printable A4 PDFs + PNG Previews (1654 x 2339 px @ 200 DPI):
   - 01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.pdf / .png
   - 02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.pdf / .png
   - 03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.pdf / .png
2. 4 Ready-to-Paste Naver Cafe Posts (.txt) + Combined Master Text File
3. Interactive Web Hub (samples/6_naver_cafe_pack/index.html) for 1-click copy & download
"""

import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT_DIR / "samples" / "6_naver_cafe_pack"
POSTS_DIR = OUT_DIR / "posts"

A4_W = 1654
A4_H = 2339


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = (
        ["C:/Windows/Fonts/malgunbd.ttf", "C:/Windows/Fonts/NanumGothicBold.ttf"]
        if bold
        else ["C:/Windows/Fonts/malgun.ttf", "C:/Windows/Fonts/NanumGothic.ttf"]
    )
    for fp in candidates:
        if Path(fp).exists():
            return ImageFont.truetype(fp, size)
    return ImageFont.load_default()


def draw_dashed_line(draw: ImageDraw.ImageDraw, start, end, fill, width=4, dash_len=18, gap_len=14):
    x1, y1 = start
    x2, y2 = end
    dx = x2 - x1
    dy = y2 - y1
    dist = math.hypot(dx, dy)
    if dist == 0:
        return
    ux = dx / dist
    uy = dy / dist
    pos = 0.0
    while pos < dist:
        seg_end = min(pos + dash_len, dist)
        sx = x1 + ux * pos
        sy = y1 + uy * pos
        ex = x1 + ux * seg_end
        ey = y1 + uy * seg_end
        draw.line([(sx, sy), (ex, ey)], fill=fill, width=width)
        pos += dash_len + gap_len


def draw_dashed_circle(draw: ImageDraw.ImageDraw, cx, cy, r, fill, width=4, segments=36):
    for i in range(0, segments, 2):
        a1 = (2 * math.pi * i) / segments
        a2 = (2 * math.pi * (i + 1)) / segments
        x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
        x2, y2 = cx + r * math.cos(a2), cy + r * math.sin(a2)
        draw.line([(x1, y1), (x2, y2)], fill=fill, width=width)


def draw_common_header(draw: ImageDraw.ImageDraw, badge_text: str, title_text: str, sub_text: str, accent_color, light_bg):
    # Top banner
    draw.rectangle([(0, 0), (A4_W, 250)], fill=light_bg)
    draw.rectangle([(0, 0), (A4_W, 16)], fill=accent_color)

    f_badge = get_font(26, bold=True)
    f_title = get_font(44, bold=True)
    f_sub = get_font(26, bold=False)

    # Badge pill
    draw.rounded_rectangle([(70, 38), (760, 88)], radius=25, fill=accent_color)
    draw.text((98, 46), badge_text, font=f_badge, fill=(255, 255, 255))

    # Right brand tag
    draw.text((A4_W - 470, 48), "키즈핏 그로스 & 러닝 스튜디오", font=f_badge, fill=accent_color)

    # Title & subtitle
    draw.text((70, 108), title_text, font=f_title, fill=(24, 32, 56))
    draw.text((70, 178), sub_text, font=f_sub, fill=(90, 102, 128))
    draw.line([(0, 250), (A4_W, 250)], fill=accent_color, width=3)


def draw_common_footer(draw: ImageDraw.ImageDraw, accent_color):
    y_top = A4_H - 110
    draw.rectangle([(0, y_top), (A4_W, A4_H)], fill=(246, 248, 252))
    draw.line([(0, y_top), (A4_W, y_top)], fill=(215, 222, 235), width=2)
    f_foot_b = get_font(25, bold=True)
    f_foot = get_font(23, bold=False)
    draw.text(
        (70, y_top + 22),
        "★ 키즈핏(KIDS-FIT) 공식 네이버 카페 무료 배포 워크지 | 무단 상업적 도용 금지",
        font=f_foot_b,
        fill=accent_color,
    )
    draw.text(
        (70, y_top + 60),
        "▶ 우리 아이 키 백분위 & 두뇌·학습 역량(LQ) 1분 무료 진단: https://truthofmarket.com",
        font=f_foot,
        fill=(80, 92, 115),
    )


def generate_pdf_01_fine_motor():
    """PDF 1: Ages 3-6 Fine Motor Line Tracing, Shape Matching & Scissors Cutting Worksheet"""
    img = Image.new("RGB", (A4_W, A4_H), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    accent = (79, 70, 229)  # Indigo
    light_bg = (238, 242, 255)
    mint = (16, 185, 129)
    coral = (249, 115, 22)

    draw_common_header(
        draw,
        "키즈핏 유아 발달 워크지 #1 (만 3~6세용)",
        "손끝 소근육 선긋기 · 대칭 도형 · 가위질 놀이",
        "보건복지부 K-DST 소근육 발달 기준 | 대뇌 운동피질 30%와 연결된 세 손가락 협응력 기르기",
        accent,
        light_bg,
    )

    # Child profile bar
    draw.rounded_rectangle([(70, 280), (A4_W - 70, 365)], radius=18, fill=(250, 251, 255), outline=(210, 218, 240), width=2)
    f_info = get_font(28, bold=True)
    draw.text(
        (105, 305),
        "■ 아이 이름: ________________    ■ 날짜: 2026년 ___월 ___일    ★ 엄마·아빠 칭찬 별:  ☆  ☆  ☆",
        font=f_info,
        fill=(45, 55, 72),
    )

    f_sec = get_font(32, bold=True)
    f_desc = get_font(24, bold=False)
    f_label = get_font(26, bold=True)

    # SECTION 1: Line tracing (Straight, Zigzag, Wave)
    draw.rounded_rectangle([(70, 395), (A4_W - 70, 1020)], radius=24, fill=(255, 255, 255), outline=(220, 226, 242), width=3)
    draw.rounded_rectangle([(70, 395), (A4_W - 70, 468)], radius=24, fill=light_bg)
    draw.text((105, 413), "STEP 1. 출발점(●)에서 도착점(★)까지 점선을 따라 천천히 선을 그어보세요!", font=f_sec, fill=accent)

    # Track 1: Straight line
    y1 = 555
    draw.text((105, y1 - 52), "① 반듯반듯 곧은 길 (눈-손 협응 기초)", font=f_label, fill=(51, 65, 85))
    draw.ellipse([(115, y1 - 22), (159, y1 + 22)], fill=accent)
    draw.ellipse([(A4_W - 165, y1 - 24), (A4_W - 115, y1 + 24)], fill=coral)
    draw_dashed_line(draw, (170, y1), (A4_W - 175, y1), fill=(120, 130, 175), width=6, dash_len=24, gap_len=16)

    # Track 2: Zigzag mountain path
    y2 = 735
    draw.text((105, y2 - 75), "② 뾰족뾰족 산맥 길 (방향 전환 & 손목 조절력)", font=f_label, fill=(51, 65, 85))
    draw.ellipse([(115, y2 - 22), (159, y2 + 22)], fill=mint)
    draw.ellipse([(A4_W - 165, y2 - 24), (A4_W - 115, y2 + 24)], fill=coral)
    pts_zig = [(170, y2)]
    step_x = (A4_W - 350) // 8
    for i in range(1, 8):
        px = 170 + i * step_x
        py = y2 - 48 if i % 2 == 1 else y2 + 48
        pts_zig.append((px, py))
    pts_zig.append((A4_W - 175, y2))
    for i in range(len(pts_zig) - 1):
        draw_dashed_line(draw, pts_zig[i], pts_zig[i + 1], fill=(80, 165, 135), width=6, dash_len=20, gap_len=14)

    # Track 3: Gentle wave path
    y3 = 925
    draw.text((105, y3 - 75), "③ 출렁출렁 파도 길 (부드러운 곡선 소근육 조절)", font=f_label, fill=(51, 65, 85))
    draw.ellipse([(115, y3 - 22), (159, y3 + 22)], fill=coral)
    draw.ellipse([(A4_W - 165, y3 - 24), (A4_W - 115, y3 + 24)], fill=accent)
    wave_pts = []
    total_w = (A4_W - 175) - 170
    for s in range(0, 121):
        t = s / 120.0
        wx = 170 + total_w * t
        wy = y3 + 45 * math.sin(t * 4 * math.pi)
        wave_pts.append((wx, wy))
    for i in range(0, len(wave_pts) - 1, 2):
        draw.line([wave_pts[i], wave_pts[i + 1]], fill=(235, 135, 75), width=6)

    # SECTION 2: Shape Tracing & Coloring (4 Shapes)
    draw.rounded_rectangle([(70, 1055), (A4_W - 70, 1690)], radius=24, fill=(255, 255, 255), outline=(220, 226, 242), width=3)
    draw.rounded_rectangle([(70, 1055), (A4_W - 70, 1128)], radius=24, fill=(236, 253, 245))
    draw.text((105, 1073), "STEP 2. 점선 도형을 따라 그리고 예쁜 색연필로 색칠해 보세요! (공간·도형 감각)", font=f_sec, fill=(5, 150, 105))

    shapes = [
        ("동그라미 (원)", "circle", (79, 70, 229)),
        ("세모 (삼각형)", "triangle", (16, 185, 129)),
        ("네모 (사각형)", "square", (249, 115, 22)),
        ("다이아몬드 (마름모)", "diamond", (236, 72, 153)),
    ]
    box_w = (A4_W - 140 - 90) // 4
    for idx, (s_name, s_type, s_col) in enumerate(shapes):
        bx = 90 + idx * (box_w + 24)
        by = 1165
        bh = 485
        draw.rounded_rectangle([(bx, by), (bx + box_w, by + bh)], radius=20, fill=(250, 252, 255), outline=(215, 224, 238), width=2)
        draw.text((bx + 45, by + 22), s_name, font=f_label, fill=s_col)

        cx = bx + box_w // 2
        cy = by + 255
        r = 115
        if s_type == "circle":
            draw_dashed_circle(draw, cx, cy, r, fill=s_col, width=6, segments=40)
        elif s_type == "triangle":
            p1 = (cx, cy - r)
            p2 = (cx - r, cy + r - 15)
            p3 = (cx + r, cy + r - 15)
            draw_dashed_line(draw, p1, p2, fill=s_col, width=6)
            draw_dashed_line(draw, p2, p3, fill=s_col, width=6)
            draw_dashed_line(draw, p3, p1, fill=s_col, width=6)
        elif s_type == "square":
            p1 = (cx - r + 10, cy - r + 10)
            p2 = (cx + r - 10, cy - r + 10)
            p3 = (cx + r - 10, cy + r - 10)
            p4 = (cx - r + 10, cy + r - 10)
            draw_dashed_line(draw, p1, p2, fill=s_col, width=6)
            draw_dashed_line(draw, p2, p3, fill=s_col, width=6)
            draw_dashed_line(draw, p3, p4, fill=s_col, width=6)
            draw_dashed_line(draw, p4, p1, fill=s_col, width=6)
        elif s_type == "diamond":
            p1 = (cx, cy - r - 10)
            p2 = (cx + r, cy)
            p3 = (cx, cy + r + 10)
            p4 = (cx - r, cy)
            draw_dashed_line(draw, p1, p2, fill=s_col, width=6)
            draw_dashed_line(draw, p2, p3, fill=s_col, width=6)
            draw_dashed_line(draw, p3, p4, fill=s_col, width=6)
            draw_dashed_line(draw, p4, p1, fill=s_col, width=6)

        draw.text((bx + 52, by + bh - 62), "따라 그리고 색칠하기!", font=f_desc, fill=(110, 120, 145))

    # SECTION 3: Safe Scissors Cutting Track & Parenting Tip
    draw.rounded_rectangle([(70, 1725), (A4_W - 70, 2190)], radius=24, fill=(255, 251, 235), outline=(251, 191, 36), width=3)
    draw.text((105, 1750), "STEP 3. [가위질 트랙] 안전가위 오리기 & 오늘 저녁 0원 소근육 놀이 팁", font=f_sec, fill=(180, 83, 9))
    draw.text(
        (105, 1805),
        "엄지·검지·중지 세 손가락에 힘을 주어 아래 점선을 따라 안전가위로 오려보세요! (연필 잡기 기초 근력 완성)",
        font=f_desc,
        fill=(120, 53, 15),
    )

    for line_idx, ly in enumerate([1890, 1985]):
        label_str = "▶ 가위질 1단계 (직선 오리기)" if line_idx == 0 else "▶ 가위질 2단계 (긴 호흡 오리기)"
        draw.text((105, ly - 38), label_str, font=f_label, fill=(146, 64, 14))
        draw_dashed_line(draw, (105, ly + 10), (A4_W - 105, ly + 10), fill=(217, 119, 6), width=5, dash_len=28, gap_len=16)

    # Bottom tip box inside Section 3
    draw.rounded_rectangle([(100, 2045), (A4_W - 100, 2160)], radius=16, fill=(255, 255, 255), outline=(252, 211, 77), width=2)
    draw.text(
        (125, 2065),
        "★ 엄마·아빠 코칭 팁: 아이가 선을 조금 벗어나도 절대 지우개로 지우거나 대신 그려주지 마세요!",
        font=f_label,
        fill=(30, 41, 59),
    )
    draw.text(
        (125, 2108),
        "   \"우와, 끝까지 스스로 힘을 줘서 그었네!\" 하고 과정만 칭찬해주시면 아이의 전두엽 자기효능감이 2배로 자랍니다.",
        font=f_desc,
        fill=(71, 85, 105),
    )

    draw_common_footer(draw, accent)

    png_path = OUT_DIR / "01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.png"
    pdf_path = OUT_DIR / "01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.pdf"
    img.save(png_path, "PNG")
    img.save(pdf_path, "PDF", resolution=200.0)
    return png_path, pdf_path


def generate_pdf_02_cornell_study():
    """PDF 2: Elementary & Middle School 5-Min Cornell Active Recall Note & Weekly Self-Directed Planner"""
    img = Image.new("RGB", (A4_W, A4_H), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    accent = (13, 148, 136)  # Teal
    light_bg = (240, 253, 250)
    indigo = (79, 70, 229)

    draw_common_header(
        draw,
        "키즈핏 초·중등 두뇌·학습 워크지 #2 (초등~중등용)",
        "학원·수업 직후 5분! 코넬식 백지복습 노트 & 주간 계획표",
        "Roediger & Karpicke(2006) 인출 연습(Retrieval Practice) 논문 적용 | 눈으로만 읽는 가짜 공부를 진짜 실력으로!",
        accent,
        light_bg,
    )

    f_info = get_font(27, bold=True)
    f_sec = get_font(31, bold=True)
    f_label = get_font(25, bold=True)
    f_desc = get_font(23, bold=False)

    # Top Profile Bar
    draw.rounded_rectangle([(70, 280), (A4_W - 70, 365)], radius=18, fill=(248, 250, 252), outline=(203, 213, 225), width=2)
    draw.text(
        (105, 306),
        "■ 학생 이름: ______________   ■ 날짜: 2026년 ___월 ___일   ★ 오늘 복습 과목/단원: _______________________",
        font=f_info,
        fill=(30, 41, 59),
    )

    # PART 1: Cornell Active Recall Box
    draw.rounded_rectangle([(70, 395), (A4_W - 70, 1340)], radius=24, fill=(255, 255, 255), outline=(153, 246, 228), width=3)
    draw.rounded_rectangle([(70, 395), (A4_W - 70, 468)], radius=24, fill=light_bg)
    draw.text((105, 413), "PART 1. 교과서·문제집을 덮고 오늘 배운 내용을 내 말로 꺼내보세요! (5분 백지복습)", font=f_sec, fill=accent)

    # Left Column (Keywords / Questions) & Right Column (Active Recall Notes)
    col_split_x = 570
    draw.line([(col_split_x, 468), (col_split_x, 1175)], fill=(203, 213, 225), width=3)
    draw.line([(70, 1175), (A4_W - 70, 1175)], fill=(203, 213, 225), width=3)

    draw.text((100, 490), "◆ 핵심 키워드 & 질문 3가지", font=f_label, fill=indigo)
    draw.text((100, 528), "(단어만 보고 오른쪽에 설명 쓰기)", font=f_desc, fill=(100, 116, 139))

    for q_idx in range(3):
        qy = 580 + q_idx * 190
        draw.rounded_rectangle([(95, qy), (col_split_x - 25, qy + 165)], radius=14, fill=(248, 250, 252), outline=(226, 232, 240), width=2)
        draw.text((115, qy + 18), f"핵심 키워드 #{q_idx + 1}", font=f_label, fill=(51, 65, 85))
        draw.line([(115, qy + 115), (col_split_x - 45, qy + 115)], fill=(203, 213, 225), width=2)

    draw.text((col_split_x + 35, 490), "★ 백지 인출 & 도식화 노트 (공식 암기 대신 원리·그림·화살표로 정리!)", font=f_label, fill=accent)
    draw.text((col_split_x + 35, 528), "※ 막히는 부분은 별표(★) 해두고 백지복습이 끝난 뒤 교과서를 펼쳐 다른 색 펜으로 채우세요.", font=f_desc, fill=(100, 116, 139))

    # Ruled lines in Right Column
    for ry in range(620, 1150, 72):
        draw.line([(col_split_x + 35, ry), (A4_W - 105, ry)], fill=(226, 232, 240), width=2)

    # Bottom Summary Row of Cornell Note (Havruta 1-sentence summary)
    draw.text((105, 1195), "▶ [1분 하브루타 요약] 오늘 배운 핵심을 동생이나 부모님께 한 문장으로 설명한다면?", font=f_label, fill=(30, 41, 59))
    draw.line([(105, 1295), (A4_W - 105, 1295)], fill=(148, 163, 184), width=2)

    # PART 2: Weekly Self-Directed Habit & Study Matrix (Mon-Sun)
    draw.rounded_rectangle([(70, 1375), (A4_W - 70, 2190)], radius=24, fill=(255, 255, 255), outline=(219, 234, 254), width=3)
    draw.rounded_rectangle([(70, 1375), (A4_W - 70, 1448)], radius=24, fill=(238, 242, 255))
    draw.text((105, 1393), "PART 2. 전두엽 실행기능을 키우는 주간 자기주도 학습 · 수면 루틴 체크표", font=f_sec, fill=indigo)

    # Table grid
    table_x1, table_y1 = 95, 1475
    table_x2, table_y2 = A4_W - 95, 2045
    habit_col_w = 690
    day_col_w = (table_x2 - table_x1 - habit_col_w) // 7

    # Header row
    draw.rectangle([(table_x1, table_y1), (table_x2, table_y1 + 75)], fill=(241, 245, 249), outline=(203, 213, 225), width=2)
    draw.text((table_x1 + 25, table_y1 + 22), "실천할 핵심 학습·생활 루틴 (매일 O / ★ 체크)", font=f_label, fill=(30, 41, 59))
    days = ["월", "화", "수", "목", "금", "토", "일"]
    for d_idx, d_name in enumerate(days):
        dx = table_x1 + habit_col_w + d_idx * day_col_w
        draw.line([(dx, table_y1), (dx, table_y2)], fill=(203, 213, 225), width=2)
        draw.text((dx + day_col_w // 2 - 14, table_y1 + 22), d_name, font=f_label, fill=indigo if d_idx < 5 else (225, 29, 72))

    rows = [
        "① 수업/학원 후 5분 백지복습 3줄 쓰기 (메타인지)",
        "② 수학 문장제 문제는 여백에 조건·그림 먼저 그리기",
        "③ 공부 시작할 때 스마트폰 거실 충전소에 두기",
        "④ 타이머 맞춰 25분 고밀도 집중 + 5분 스트레칭",
        "⑤ 잠들기 전 종이책 독서 20분 (어휘·문해력 충전)",
        "⑥ 밤 10시(중등 11시) 숙면으로 해마 장기기억 코팅!",
    ]
    row_h = (table_y2 - (table_y1 + 75)) // len(rows)
    for r_idx, r_text in enumerate(rows):
        ry = table_y1 + 75 + r_idx * row_h
        draw.line([(table_x1, ry), (table_x2, ry)], fill=(203, 213, 225), width=2)
        draw.text((table_x1 + 22, ry + 26), r_text, font=f_desc, fill=(30, 41, 59))
        for d_idx in range(7):
            dx = table_x1 + habit_col_w + d_idx * day_col_w
            cx = dx + day_col_w // 2
            cy = ry + row_h // 2
            draw.ellipse([(cx - 20, cy - 20), (cx + 20, cy + 20)], outline=(203, 213, 225), width=2)

    draw.rectangle([(table_x1, table_y1), (table_x2, table_y2)], outline=(148, 163, 184), width=2)

    # Bottom Reward Promise Box
    draw.rounded_rectangle([(95, 2068), (A4_W - 95, 2165)], radius=16, fill=(240, 253, 250), outline=(153, 246, 228), width=2)
    draw.text(
        (125, 2100),
        "★ 이번 주 목표 달성 시 우리 가족 주말 보상 약속: ____________________________________ (부모님 사인: ________)",
        font=f_label,
        fill=(15, 118, 110),
    )

    draw_common_footer(draw, accent)

    png_path = OUT_DIR / "02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.png"
    pdf_path = OUT_DIR / "02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.pdf"
    img.save(png_path, "PNG")
    img.save(pdf_path, "PDF", resolution=200.0)
    return png_path, pdf_path


def generate_pdf_03_growth_sleep_tracker():
    """PDF 3: All-Ages Monthly 1st Height/Weight Tracker & 10PM Sleep Golden-Time 30-Day Sticker Board"""
    img = Image.new("RGB", (A4_W, A4_H), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    accent = (234, 88, 12)  # Warm Coral Orange
    light_bg = (255, 247, 237)
    indigo = (79, 70, 229)
    mint = (5, 150, 105)

    draw_common_header(
        draw,
        "키즈핏 전 연령 성장 워크지 #3 (냉장고 부착용)",
        "매월 1일 키·몸무게 성장 기록표 & 밤 10시 꿀잠 스티커판",
        "질병관리청(KDCA) 성장도표 & 서파수면(SWS) 성장호르몬 연구 기반 | 숨은 키 +7cm를 깨우는 한 달 루틴",
        accent,
        light_bg,
    )

    f_info = get_font(27, bold=True)
    f_sec = get_font(31, bold=True)
    f_label = get_font(25, bold=True)
    f_desc = get_font(23, bold=False)

    # Top Profile Bar
    draw.rounded_rectangle([(70, 280), (A4_W - 70, 365)], radius=18, fill=(255, 251, 235), outline=(253, 186, 116), width=2)
    draw.text(
        (105, 306),
        "■ 아이 이름: ____________   ■ 시작 키: ______cm   ★ 올해 목표 키: ______cm   ◆ 부모님 유전예상키(MPH): ______cm",
        font=f_info,
        fill=(124, 45, 18),
    )

    # PART 1: Monthly 1st Height & Weight Record Table (6 Months)
    draw.rounded_rectangle([(70, 395), (A4_W - 70, 1065)], radius=24, fill=(255, 255, 255), outline=(254, 215, 170), width=3)
    draw.rounded_rectangle([(70, 395), (A4_W - 70, 468)], radius=24, fill=light_bg)
    draw.text((105, 413), "PART 1. 매월 1일 아침 기상 직후 키·몸무게 기록표 (키즈핏 홈페이지에서 백분위 확인!)", font=f_sec, fill=accent)

    tx1, ty1 = 95, 490
    tx2, ty2 = A4_W - 95, 1035
    col_widths = [230, 230, 230, 230, 250, (tx2 - tx1) - 1170]
    col_headers = ["측정 월 (매월 1일)", "아침 키 (cm)", "몸무게 (kg)", "지난달 대비 (+cm)", "키즈핏 백분위(%)", "이번 달 성장 칭찬 메모"]

    draw.rectangle([(tx1, ty1), (tx2, ty1 + 72)], fill=(255, 237, 213), outline=(253, 186, 116), width=2)
    cur_x = tx1
    for c_idx, (cw, ch_text) in enumerate(zip(col_widths, col_headers)):
        if c_idx > 0:
            draw.line([(cur_x, ty1), (cur_x, ty2)], fill=(253, 186, 116), width=2)
        draw.text((cur_x + 16, ty1 + 20), ch_text, font=f_desc, fill=(154, 52, 18))
        cur_x += cw

    row_h = (ty2 - (ty1 + 72)) // 6
    for r_idx in range(6):
        ry = ty1 + 72 + r_idx * row_h
        draw.line([(tx1, ry), (tx2, ry)], fill=(254, 215, 170), width=2)
        draw.text((tx1 + 25, ry + 24), f"2026년 ___월 1일", font=f_desc, fill=(71, 85, 105))
        draw.text((tx1 + col_widths[0] + 95, ry + 24), ".     cm", font=f_desc, fill=(148, 163, 184))
        draw.text((tx1 + col_widths[0] + col_widths[1] + 95, ry + 24), ".     kg", font=f_desc, fill=(148, 163, 184))
        draw.text((tx1 + col_widths[0] + col_widths[1] + col_widths[2] + 65, ry + 24), "+      .   cm", font=f_desc, fill=(148, 163, 184))
        draw.text((tx1 + col_widths[0] + col_widths[1] + col_widths[2] + col_widths[3] + 65, ry + 24), "상위      %", font=f_desc, fill=(148, 163, 184))

    draw.rectangle([(tx1, ty1), (tx2, ty2)], outline=(251, 146, 60), width=2)

    # PART 2: 30-Day Golden-Time Sticker Board
    draw.rounded_rectangle([(70, 1095), (A4_W - 70, 2190)], radius=24, fill=(255, 255, 255), outline=(199, 210, 254), width=3)
    draw.rounded_rectangle([(70, 1095), (A4_W - 70, 1168)], radius=24, fill=(238, 242, 255))
    draw.text((105, 1113), "PART 2. 한 달 30일 '밤 10시 꿀잠 & 성장판 스트레칭' 성공 스티커판", font=f_sec, fill=indigo)

    # 3 Core Golden Rules banner
    draw.rounded_rectangle([(95, 1190), (A4_W - 95, 1280)], radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=2)
    draw.text(
        (120, 1220),
        "★ 매일 저녁 3가지 약속:  ① 밤 10시 전 불 끄고 쿨쿨!   ② 잠들기 전 5분 성장판 스트레칭!   ③ 야식·단 음료 참기!",
        font=f_label,
        fill=(30, 41, 59),
    )

    # 6 cols x 5 rows = 30 Day Circles
    grid_x1, grid_y1 = 105, 1310
    grid_w = A4_W - 210
    grid_h = 740
    cols = 6
    rows = 5
    cell_w = grid_w // cols
    cell_h = grid_h // rows

    for idx in range(30):
        c = idx % cols
        r = idx // cols
        cx = grid_x1 + c * cell_w + cell_w // 2
        cy = grid_y1 + r * cell_h + cell_h // 2
        day_num = idx + 1
        is_milestone = day_num in (7, 14, 21, 30)
        fill_c = (236, 253, 245) if is_milestone else (250, 251, 255)
        border_c = mint if is_milestone else (165, 180, 252)

        draw.rounded_rectangle(
            [(cx - 98, cy - 58), (cx + 98, cy + 58)],
            radius=22,
            fill=fill_c,
            outline=border_c,
            width=3 if is_milestone else 2,
        )
        f_day = get_font(24, bold=True)
        label_day = f"DAY {day_num:02d} ★" if is_milestone else f"DAY {day_num:02d}"
        draw.text((cx - 56, cy - 42), label_day, font=f_day, fill=mint if is_milestone else indigo)
        draw.text((cx - 32, cy + 2), "칭찬 스티커", font=get_font(20, bold=False), fill=(148, 163, 184))

    # Bottom Cafe Challenge Banner
    draw.rounded_rectangle([(95, 2070), (A4_W - 95, 2165)], radius=16, fill=(236, 253, 245), outline=(110, 231, 183), width=2)
    draw.text(
        (125, 2100),
        "★ [매월 1일 카페 인증 이벤트] 기록표와 truthofmarket.com 진단 캡처를 네이버 카페에 올리면 우수회원 혜택 증정!",
        font=f_label,
        fill=mint,
    )

    draw_common_footer(draw, accent)

    png_path = OUT_DIR / "03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.png"
    pdf_path = OUT_DIR / "03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.pdf"
    img.save(png_path, "PNG")
    img.save(pdf_path, "PDF", resolution=200.0)
    return png_path, pdf_path


def generate_cafe_posts():
    """Generates 4 ready-to-copy Naver Cafe posts + 1 combined file"""
    POSTS_DIR.mkdir(parents=True, exist_ok=True)

    post_1 = """[전체 공지] 🌱 키즈핏(KIDS-FIT) 공식 네이버 카페에 오신 학부모님들을 환영합니다! (무료 진단 & 워크지 PDF 받는 법)

안녕하세요, 대한민국 3040 부모님들의 든든한 성장·학습 연구소 【키즈핏 그로스 & 러닝 스튜디오】 공식 카페입니다 😊

아이 키가 또래보다 작은 건 아닌지, 지금 나이에 어떤 교구와 공부법을 시작해야 시행착오를 줄일 수 있을지 매일 고민이 많으시죠?
저희 카페는 광고성 카더라 정보 대신 **질병관리청(KDCA) 성장도표, 보건복지부 영유아 발달선별검사(K-DST), 그리고 국내외 소아내분비·뇌과학 학술 논문**을 바탕으로 우리 아이의 신체 성장과 두뇌 학습을 함께 키우는 학부모 소통 공간입니다.

━━━━━━━━━━━━━━━━━━━━━━
🎁 카페 가입 학부모님께 드리는 3대 무료 혜택
━━━━━━━━━━━━━━━━━━━━━━

1️⃣ 【1분 무료 진단】 우리 아이 신체 성장 백분위 & 두뇌·학습 역량(LQ) 보고서
• 아직 홈페이지 진단을 안 해보셨다면 지금 바로 아이 키·몸무게와 학습 고민을 클릭해 보세요!
• 부모 유전키(MPH) 대비 숨은 키 +7cm 잠재력과 나이별 맞춤 공부법이 1분 만에 나옵니다.
👉 무료 진단 바로가기: https://truthofmarket.com

2️⃣ 【연령별 무료 워크지 PDF 자료실】 집에서 바로 뽑아 쓰는 고화질 A4 프린트 도안
• [만 3~6세용] 손끝 소근육 선긋기 · 대칭 도형 · 안전가위 오리기 워크지 PDF
• [초·중등용] 학원 다녀와서 5분! 코넬식 백지복습 노트 & 주간 자기주도 계획표 PDF
• [전 연령 공통] 냉장고에 붙이는 매월 1일 키·몸무게 기록표 & 밤 10시 꿀잠 30일 스티커판 PDF
👉 카페 내 [🎁 연령별 무료 워크지 PDF] 게시판에서 조건 없이 바로 다운로드하실 수 있습니다!

3️⃣ 【매월 1일 성장·학습 인증 챌린지】
• 매월 1일 아침, 홈페이지(https://truthofmarket.com)에서 다시 측정한 우리 아이 키 백분위 또는 학습 리포트 캡처 화면을 [📅 매월 1일 리포트 인증방]에 올려주세요!
• 꾸준히 기록하시는 부모님들께 특별 워크지 풀팩과 이달의 추천 도서·교구 혜택을 가장 먼저 챙겨드립니다.

━━━━━━━━━━━━━━━━━━━━━━
📌 10초 만에 끝나는 가입 인사 안내
━━━━━━━━━━━━━━━━━━━━━━
• [👋 반가운 가입인사] 게시판에 아이 나이(또는 개월 수)와 요즘 가장 큰 고민(키 성장 / 식습관 / 문해력 / 수학 / 집중력 등)을 한 줄로 남겨주시면 바로 정회원 혜택을 누리실 수 있습니다!

오늘도 아이의 속도에 맞춰 다정하게 걸어가는 엄마·아빠를 키즈핏이 진심으로 응원합니다 ♥
"""

    post_2 = """[무료 자료 나눔] 🎁 집에서 바로 프린트해 쓰는 '키즈핏 연령별 성장·학습 워크지 PDF 3종' 무료 다운로드!

안녕하세요, 키즈핏 가족 여러분! 😊
집에서 아이와 하루 10분이라도 의미 있는 시간을 보내고 싶은데 막상 무엇을 해줘야 할지 막막하셨던 부모님들을 위해, 키즈핏 연구소에서 직접 제작한 **고화질 A4 프린트용 워크지 PDF 3종 세트**를 무료로 공유합니다!

첨부파일(PDF)을 다운로드하셔서 가정용 프린터로 A4 용지에 인쇄해 바로 사용해 보세요.

━━━━━━━━━━━━━━━━━━━━━━
📂 첨부된 무료 워크지 PDF 3종 안내
━━━━━━━━━━━━━━━━━━━━━━

✅ 1번 파일: [만 3~6세 유아용] 손끝 소근육 선긋기 · 대칭 도형 · 안전가위 워크지.pdf
• 대상: 만 24개월 ~ 만 6세 (유치원생)
• 효과: 대뇌 운동피질의 30%와 직결된 엄지·검지·중지 세 손가락 협응력을 길러주어, 초등학교 입학 전 바른 운필력(연필 잡기)과 전두엽 집중력의 기초를 만들어 줍니다.
• 엄마·아빠 팁: 선을 조금 삐뚤게 그어도 지우개로 지우지 마시고 "끝까지 힘줘서 그었네!" 하고 꼭 칭찬해 주세요!

✅ 2번 파일: [초·중등 학령기용] 학원 다녀와서 5분! 코넬식 백지복습 노트 & 주간 계획표.pdf
• 대상: 초등 1학년 ~ 중학생
• 효과: 학원 수업만 듣고 내 것으로 만들지 못하는 '메타인지 착각'을 해결합니다. 책을 덮고 오늘 배운 키워드 3가지를 내 말로 꺼내 쓰는 '인출 연습(Retrieval Practice)'은 단순 반복 읽기보다 장기기억 보존율을 2배 이상 높여줍니다.
• 엄마·아빠 팁: 저녁 식사 시간에 "오늘 정리한 1분 하브루타 한 줄 요약이 뭐야?" 하고 가볍게 물어봐 주세요!

✅ 3번 파일: [전 연령 공통] 냉장고 부착용! 매월 1일 키·몸무게 기록표 & 밤 10시 꿀잠 스티커판.pdf
• 대상: 전 연령 (만 2세 ~ 만 16세)
• 효과: 성장호르몬의 65~70%가 분비되는 밤 10시~새벽 2시 깊은 서파수면(SWS) 습관과 잠들기 전 5분 성장판 스트레칭을 아이 스스로 재미있게 실천하도록 돕는 30일 칭찬 스티커판입니다.

━━━━━━━━━━━━━━━━━━━━━━
💡 워크지 200% 활용하는 방법!
━━━━━━━━━━━━━━━━━━━━━━
1. 지금 첨부된 PDF 파일을 다운로드해 프린트합니다. (3번 키 성장 기록표는 냉장고에 붙여두세요!)
2. 매월 1일 아침, 키즈핏 공식 홈페이지( https://truthofmarket.com )에서 우리 아이 키·몸무게와 학습 상태를 입력해 **이번 달 백분위와 맞춤 처방**을 확인합니다.
3. 댓글로 **"다운로드 완료! 우리 아이도 오늘부터 시작해요 ♥"** 한 줄 응원 댓글을 남겨주시면 다음 달 새로운 워크지 제작에 큰 힘이 됩니다!
"""

    post_3 = """[매월 1일 공식 이벤트] 📅 '우리 아이 숨은 키 +7cm & 두뇌 역량' 매월 1일 키즈핏 리포트 인증 챌린지!

안녕하세요, 키즈핏 학부모님 여러분! 🌱
아이의 키 성장과 공부 습관은 '한 번의 비싼 처방'보다 **'매달 1일, 한 달에 한 번씩 우리 아이의 성장 궤적을 점검하는 작은 루틴'**에서 결정됩니다.

혼자 기록하면 작심삼일이 되기 쉽지만, 같은 나이대 아이를 키우는 엄마·아빠들과 함께 인증하면 6개월 뒤 놀라운 변화가 찾아옵니다!

━━━━━━━━━━━━━━━━━━━━━━
🏆 매월 1일 '키즈핏 리포트' 인증 챌린지 참여 방법 (1분 컷!)
━━━━━━━━━━━━━━━━━━━━━━

📌 STEP 1. 매월 1일 아침(또는 첫째 주 주말), 아이의 아침 키와 몸무게를 잽니다.
📌 STEP 2. 키즈핏 공식 홈페이지( https://truthofmarket.com )에 접속해 **[📏 아이 신체 성장 보고서]** 또는 **[🧠 아이 학습 분석 보고서]**를 생성합니다.
📌 STEP 3. 결과 화면 상단의 **[키 백분위 / 3단 예상키 차트]** 또는 **[5대 학습 역량 지수(LQ) 차트]** 화면을 스마트폰으로 캡처합니다.
📌 STEP 4. 본 게시판([📅 매월 1일 리포트 인증방])에 캡처 사진 1장과 함께 **이번 달 우리 아이 칭찬 한 줄 & 다짐 한 줄**을 올리면 참여 완료!

(예시 글 제목: "[10월 인증] 만 8세 남아 키 백분위 42% → 46% 상승! 밤 10시 소등 2주 성공했어요!")

━━━━━━━━━━━━━━━━━━━━━━
🎁 챌린지 참여 학부모님 특별 혜택
━━━━━━━━━━━━━━━━━━━━━━
• 1회 이상 인증 시: 카페 우수 등급 즉시 등업 + 연령별 심화 워크지 PDF 추가 열람권
• 3개월 연속 인증 시: 키즈핏 선정 이달의 연령별 추천 도서·교구 또는 성장 영양제 특별 혜택 우선 안내

오늘 바로 우리 아이의 첫 번째 기준점(Baseline) 리포트를 뽑아 첫 인증글을 남겨보세요!
👉 1분 무료 리포트 뽑으러 가기: https://truthofmarket.com
"""

    post_4 = """[운영자 전용 가이드] 🛠️ 5분 만에 끝내는 키즈핏 네이버 카페 개설 & 메뉴(게시판) 세팅 마스터표

이 문서는 네이버 카페 관리자(꾸미기/메뉴 관리) 화면에서 그대로 복사·붙여넣기 하여 5분 만에 카페 구조를 완성할 수 있도록 정리한 세팅 가이드입니다.

━━━━━━━━━━━━━━━━━━━━━━
1. 카페 기본 정보 설정값 (그대로 복붙하세요)
━━━━━━━━━━━━━━━━━━━━━━
• 카페 이름 추천:
  - 키즈핏(KIDS-FIT) 공식 카페 | 아이 키성장·두뇌학습·무료워크지 모임
• 카페 한줄 소개 (검색 노출용):
  - 질병관리청 성장도표 & 뇌과학 논문 기반 우리 아이 숨은 키 +7cm·문해력·수리력 무료 진단(truthofmarket.com) 및 연령별 무료 워크지 PDF 나눔 커뮤니티
• 카페 검색어(태그) 10개:
  - 아이키성장, 어린이영양제, 소근육발달, 가베, 몬테소리, 초등문해력, 백지복습, 무료워크지, 유아프린트학습지, 주말아이와가볼만한곳

━━━━━━━━━━━━━━━━━━━━━━
2. 카페 좌측 메뉴(게시판) 구조 (이대로 만드시면 가장 깔끔합니다)
━━━━━━━━━━━━━━━━━━━━━━

📂 [그룹 1] 📌 키즈핏 필독 & 공지
  └ 📢 전체 공지사항 (글쓰기 권한: 매니저)
  └ 👋 반가운 가입인사 (등업용)
  └ 🌐 1분 무료 성장·학습 진단 바로가기 (링크 메뉴: https://truthofmarket.com 연결)

📂 [그룹 2] 🎁 무료 워크지 PDF & 칼럼 자료실
  └ 🖨️ 연령별 무료 워크지 PDF 나눔 (위 3종 PDF 첨부 게시글 업로드!)
  └ 📏 [신체성장 칼럼] 숨은 키·수면·영양·운동 팩트체크
  └ 🧠 [두뇌학습 칼럼] 문해력·수리력·교구·백지복습 노하우
  └ 🎨 [주말 나들이] 지역별 박물관·과학관 도슨트 코스

📂 [그룹 3] 📅 매월 1일 성장·학습 인증 & 소통
  └ 📸 매월 1일 키즈핏 리포트 인증방
  └ 💬 또래 학부모 육아·학습 고민 수다방
  └ ⭐ 내돈내산 교구·도서·영양제 리얼 후기방

━━━━━━━━━━━━━━━━━━━━━━
3. 회원 등급 이름 설정 (4단계 추천)
━━━━━━━━━━━━━━━━━━━━━━
• 1단계 (가입 직후): 🌱 새싹 학부모 (가입인사 작성 시 자동 등업 설정!)
• 2단계 (정회원): 🌿 키즈핏 정회원 (가입인사 1회 작성 시 무료 워크지 PDF 전체 다운로드 가능)
• 3단계 (우수회원): 🌳 열정 성장맘·대디 (매월 1일 리포트 인증 1회 이상 참여)
• 4단계 (VIP회원): 👑 키즈핏 명예연구원 (3개월 연속 인증 및 베스트 후기 작성)
"""

    p1_path = POSTS_DIR / "post_01_카페대문_전체환영공지글.txt"
    p2_path = POSTS_DIR / "post_02_연령별_무료워크지3종_나눔게시글.txt"
    p3_path = POSTS_DIR / "post_03_매월1일_키즈핏리포트_인증챌린지_공지글.txt"
    p4_path = POSTS_DIR / "post_04_5분완성_네이버카페_메뉴세팅_운영가이드.txt"
    combined_path = OUT_DIR / "키즈핏_네이버카페_즉시복붙_공지및게시글_4종세트.txt"

    p1_path.write_text(post_1.strip() + "\n", encoding="utf-8")
    p2_path.write_text(post_2.strip() + "\n", encoding="utf-8")
    p3_path.write_text(post_3.strip() + "\n", encoding="utf-8")
    p4_path.write_text(post_4.strip() + "\n", encoding="utf-8")

    combined = (
        "====================================================================\n"
        "  키즈핏(KIDS-FIT) 공식 네이버 카페 즉시 복붙용 공지·게시글·세팅 4종 패키지\n"
        "====================================================================\n\n"
        "--- [1/4] 카페 전체 환영 공지글 ---\n\n" + post_1.strip() + "\n\n\n"
        "--- [2/4] 연령별 무료 워크지 PDF 3종 나눔 게시글 ---\n\n" + post_2.strip() + "\n\n\n"
        "--- [3/4] 매월 1일 키즈핏 리포트 인증 챌린지 공지글 ---\n\n" + post_3.strip() + "\n\n\n"
        "--- [4/4] 5분 완성 네이버 카페 메뉴 & 등급 세팅 가이드 ---\n\n" + post_4.strip() + "\n"
    )
    combined_path.write_text(combined, encoding="utf-8")
    return [p1_path, p2_path, p3_path, p4_path, combined_path], [post_1.strip(), post_2.strip(), post_3.strip(), post_4.strip()]


def generate_web_hub(posts_list):
    """Generates samples/6_naver_cafe_pack/index.html for 1-click copy & PDF download on mobile/PC"""
    import html

    p1, p2, p3, p4 = [html.escape(p) for p in posts_list]
    html_content = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>키즈핏 공식 네이버 카페 올인원 오픈 패키지 (무료 워크지 PDF 3종 & 공지글 4종)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <style>
    :root {{
      --bg: #FAF8F5;
      --surface: #FFFFFF;
      --primary: #4F46E5;
      --mint: #059669;
      --coral: #EA580C;
      --text: #1E293B;
      --sub: #475569;
      --border: #E2E8F0;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
      padding: 24px 16px 80px;
    }}
    .container {{ max-width: 820px; margin: 0 auto; }}
    .hero {{
      background: linear-gradient(135deg, #4F46E5 0%, #0D9488 100%);
      color: #fff;
      padding: 28px 24px;
      border-radius: 22px;
      margin-bottom: 24px;
      box-shadow: 0 12px 28px rgba(79, 70, 229, 0.18);
    }}
    .hero-badge {{
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 5px 14px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 700;
      margin-bottom: 10px;
    }}
    .hero h1 {{ font-size: 1.45rem; font-weight: 800; margin-bottom: 8px; }}
    .hero p {{ font-size: 0.95rem; opacity: 0.94; }}
    .section-title {{
      font-size: 1.2rem;
      font-weight: 800;
      margin: 28px 0 14px;
      color: #0F172A;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .card {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
    }}
    .card h3 {{ font-size: 1.06rem; font-weight: 800; margin-bottom: 6px; color: #1E293B; }}
    .card p {{ font-size: 0.92rem; color: var(--sub); margin-bottom: 14px; }}
    .preview-img {{
      width: 100%;
      max-height: 460px;
      object-fit: contain;
      background: #F8FAFC;
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 14px;
    }}
    .btn-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }}
    .btn {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 0.92rem;
      font-weight: 700;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
      flex: 1 1 200px;
    }}
    .btn-primary {{ background: var(--primary); color: #fff; }}
    .btn-mint {{ background: var(--mint); color: #fff; }}
    .btn-outline {{ background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; }}
    pre {{
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px;
      font-family: inherit;
      font-size: 0.9rem;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 280px;
      overflow-y: auto;
      margin-bottom: 12px;
      color: #334155;
    }}
    .toast {{
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #0F172A;
      color: #fff;
      padding: 12px 24px;
      border-radius: 999px;
      font-size: 0.92rem;
      font-weight: 700;
      display: none;
      z-index: 9999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <span class="hero-badge">🎁 키즈핏 공식 네이버 카페 즉시 오픈 패키지</span>
      <h1>연령별 무료 워크지 PDF 3종 &amp; 카페 공지·게시글 4종 센터</h1>
      <p>아래에서 A4 고화질 워크지 PDF 3종을 다운로드해 카페에 첨부하시고, 공지글 본문은 <strong>[1초 복사하기]</strong> 버튼을 눌러 그대로 붙여넣으세요!</p>
    </div>

    <h2 class="section-title">🖨️ 1. 카페 자료실 업로드용 A4 고화질 워크지 PDF 3종</h2>

    <div class="card">
      <h3>① [만 3~6세 유아용] 손끝 소근육 선긋기 · 대칭 도형 · 안전가위 워크지</h3>
      <p>보건복지부 K-DST 소근육 발달 기준 적용 | 직선·지그재그·곡선 운필력 &amp; 도형 그리기·가위질 트랙</p>
      <img class="preview-img" src="./01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.png" alt="워크지 1 미리보기" />
      <div class="btn-row">
        <a class="btn btn-primary" href="./01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.pdf" download>📥 A4 인쇄용 PDF 다운로드</a>
        <a class="btn btn-outline" href="./01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.png" download>🖼️ 미리보기 이미지(PNG) 저장</a>
      </div>
    </div>

    <div class="card">
      <h3>② [초·중등 학령기용] 학원 다녀와서 5분! 코넬식 백지복습 노트 &amp; 주간 계획표</h3>
      <p>Roediger &amp; Karpicke(2006) 인출 연습 논문 기반 | 핵심 키워드 3개 백지 인출 + 1분 하브루타 요약 + 주간 루틴표</p>
      <img class="preview-img" src="./02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.png" alt="워크지 2 미리보기" />
      <div class="btn-row">
        <a class="btn btn-primary" href="./02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.pdf" download>📥 A4 인쇄용 PDF 다운로드</a>
        <a class="btn btn-outline" href="./02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.png" download>🖼️ 미리보기 이미지(PNG) 저장</a>
      </div>
    </div>

    <div class="card">
      <h3>③ [전 연령 공통] 냉장고 부착용! 매월 1일 키·몸무게 기록표 &amp; 밤 10시 꿀잠 스티커판</h3>
      <p>질병관리청(KDCA) 성장도표 &amp; 서파수면(SWS) 성장호르몬 연구 기반 | 6개월 키 백분위 기록표 + 30일 칭찬 스티커판</p>
      <img class="preview-img" src="./03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.png" alt="워크지 3 미리보기" />
      <div class="btn-row">
        <a class="btn btn-primary" href="./03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.pdf" download>📥 A4 인쇄용 PDF 다운로드</a>
        <a class="btn btn-outline" href="./03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.png" download>🖼️ 미리보기 이미지(PNG) 저장</a>
      </div>
    </div>

    <h2 class="section-title">📋 2. 네이버 카페 즉시 복붙용 공지 &amp; 게시글 4종 세트</h2>

    <div class="card">
      <h3>📌 [공지글 1] 카페 전체 환영 공지글 (가입 인사 &amp; 3대 혜택 안내)</h3>
      <pre id="post-1">{p1}</pre>
      <button class="btn btn-mint" onclick="copyText('post-1', '카페 전체 환영 공지글이 복사되었습니다!')">📋 공지글 1 본문 1초 복사하기</button>
    </div>

    <div class="card">
      <h3>🎁 [게시글 2] 연령별 무료 워크지 PDF 3종 나눔 게시글 (위 PDF 3개 첨부용)</h3>
      <pre id="post-2">{p2}</pre>
      <button class="btn btn-mint" onclick="copyText('post-2', '무료 워크지 나눔 게시글이 복사되었습니다!')">📋 게시글 2 본문 1초 복사하기</button>
    </div>

    <div class="card">
      <h3>📅 [공지글 3] 매월 1일 '키즈핏 리포트' 성장·학습 인증 챌린지 공지글</h3>
      <pre id="post-3">{p3}</pre>
      <button class="btn btn-mint" onclick="copyText('post-3', '매월 1일 인증 챌린지 공지글이 복사되었습니다!')">📋 공지글 3 본문 1초 복사하기</button>
    </div>

    <div class="card">
      <h3>🛠️ [가이드 4] 5분 완성 네이버 카페 메뉴(게시판) &amp; 등급 세팅 마스터표</h3>
      <pre id="post-4">{p4}</pre>
      <button class="btn btn-mint" onclick="copyText('post-4', '카페 메뉴 세팅 가이드가 복사되었습니다!')">📋 세팅 가이드 1초 복사하기</button>
    </div>
  </div>

  <div id="toast" class="toast">복사 완료!</div>
  <script>
    function copyText(elId, msg) {{
      var text = document.getElementById(elId).innerText;
      if (navigator.clipboard && navigator.clipboard.writeText) {{
        navigator.clipboard.writeText(text).then(function() {{ showToast(msg); }});
      }} else {{
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(msg);
      }}
    }}
    function showToast(msg) {{
      var t = document.getElementById('toast');
      t.textContent = '✅ ' + msg;
      t.style.display = 'block';
      setTimeout(function() {{ t.style.display = 'none'; }}, 2400);
    }}
  </script>
</body>
</html>
"""
    index_path = OUT_DIR / "index.html"
    index_path.write_text(html_content, encoding="utf-8")
    return index_path


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    print("🖨️ [Naver Cafe Pack] 1/3: 만 3~6세 소근육 워크지 PDF & PNG 생성 중...")
    generate_pdf_01_fine_motor()
    print("🖨️ [Naver Cafe Pack] 2/3: 초·중등 5분 코넬 백지복습 노트 & 주간계획표 PDF & PNG 생성 중...")
    generate_pdf_02_cornell_study()
    print("🖨️ [Naver Cafe Pack] 3/3: 전 연령 매월 1일 키성장 기록표 & 밤 10시 꿀잠 스티커판 PDF & PNG 생성 중...")
    generate_pdf_03_growth_sleep_tracker()
    print("📝 [Naver Cafe Pack] 카페 즉시 복붙용 공지·게시글 4종 및 웹 센터(index.html) 생성 중...")
    _, posts_list = generate_cafe_posts()
    generate_web_hub(posts_list)
    print("✅ [Naver Cafe Pack] 전체 파일 생성 완료! ->", OUT_DIR)


if __name__ == "__main__":
    main()
