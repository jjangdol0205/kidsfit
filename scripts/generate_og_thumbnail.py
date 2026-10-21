# -*- coding: utf-8 -*-
"""
Generates a high-CTR 1200x630 OpenGraph / KakaoTalk / Social Share Thumbnail
at `samples/og-k-growth-ai-v2.png` for https://truthofmarket.com
Designed to maximize curiosity & click-through rate (CTR) in KakaoTalk, Telegram, and Naver shares.
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(ROOT_DIR, "samples", "og-k-growth-ai-v2.png")


def load_kr_font(size, bold=True):
    candidates = [
        r"C:\Windows\Fonts\malgunbd.ttf" if bold else r"C:\Windows\Fonts\malgun.ttf",
        r"C:\Windows\Fonts\NanumGothicBold.ttf",
        r"C:\Windows\Fonts\gulim.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_centered_text(draw, box, text, font, fill):
    x1, y1, x2, y2 = box
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = x1 + (x2 - x1 - tw) / 2
    ty = y1 + (y2 - y1 - th) / 2 - bbox[1] * 0.35
    draw.text((tx, ty), text, font=font, fill=fill)


def generate_og_image():
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), (7, 11, 22))
    draw = ImageDraw.Draw(img, "RGBA")

    # Dark premium background gradient
    for y in range(H):
        ratio = y / float(H)
        r = int(8 + 6 * ratio)
        g = int(13 + 14 * ratio)
        b = int(28 + 26 * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # Subtle ambient glow circles
    draw.ellipse([(-100, -100), (420, 420)], fill=(59, 130, 246, 26))
    draw.ellipse([(740, 90), (1260, 620)], fill=(16, 185, 129, 30))

    # Outer border frame
    draw.rounded_rectangle(
        [(22, 22), (W - 22, H - 22)],
        radius=28,
        outline=(255, 255, 255, 42),
        width=2,
    )

    # Fonts (Malgun Gothic Bold — 100% glyph support, no emoji boxes)
    f_badge = load_kr_font(20, bold=True)
    f_title_1 = load_kr_font(48, bold=True)
    f_title_2 = load_kr_font(50, bold=True)
    f_sub = load_kr_font(22, bold=True)
    f_cta = load_kr_font(24, bold=True)
    f_card_head = load_kr_font(21, bold=True)
    f_big_num = load_kr_font(48, bold=True)
    f_bar_val = load_kr_font(21, bold=True)
    f_bar_lbl = load_kr_font(19, bold=True)
    f_chip = load_kr_font(19, bold=True)

    # 1. Left Column: Top Authority Pill Badge
    badge_box = (48, 58, 656, 106)
    draw.rounded_rectangle(
        badge_box,
        radius=24,
        fill=(30, 58, 138, 120),
        outline=(96, 165, 250, 180),
        width=2,
    )
    draw_centered_text(
        draw,
        badge_box,
        "K-GROWTH AI  |  질병관리청 성장도표 · 학술논문 1,238편 기반",
        f_badge,
        (147, 197, 253),
    )

    # 2. Left Column: High-CTR Headline (Fits cleanly inside x=56..660)
    draw.text(
        (56, 136),
        "우리 아이 최종 성인 키,",
        font=f_title_1,
        fill=(255, 255, 255),
    )
    draw.text(
        (56, 204),
        "몇 cm까지 클 수 있을까?",
        font=f_title_2,
        fill=(52, 211, 153),
    )

    # 3. Left Column: 3 Concise Value Points with Drawn Check Badges
    bullets = [
        "생년월일·부모 키 기반 [유전키 vs 방치 vs 관리] 3단 비교",
        "수면·식습관·자세·기질 맞춤 [단기·중기·장기 실천 가이드]",
        "시기별 꼭 필요한 [맞춤 영양제 · 두뇌교구 · 도서] 큐레이션",
    ]
    y_pos = 304
    for idx, line in enumerate(bullets, start=1):
        # Number circle badge
        cx, cy = 72, y_pos + 15
        draw.ellipse(
            [(cx - 14, cy - 14), (cx + 14, cy + 14)],
            fill=(16, 185, 129, 60),
            outline=(52, 211, 153),
            width=2,
        )
        draw_centered_text(
            draw,
            (cx - 14, cy - 14, cx + 14, cy + 14),
            str(idx),
            load_kr_font(16, bold=True),
            (110, 231, 183),
        )
        draw.text((98, y_pos), line, font=f_sub, fill=(226, 232, 240))
        y_pos += 48

    # 4. Left Column: High-Contrast Call-To-Action Button Graphic
    cta_box = (56, 474, 646, 554)
    draw.rounded_rectangle(
        cta_box,
        radius=40,
        fill=(37, 99, 235),
        outline=(147, 197, 253),
        width=2,
    )
    draw_centered_text(
        draw,
        cta_box,
        "▶ 1분 무료 AI 성장 · 학습 리포트 즉시 확인하기",
        f_cta,
        (255, 255, 255),
    )

    # 5. Right Column: Sleek Data Visualization Card (3-Bar Height Forecast)
    card_x1, card_y1, card_x2, card_y2 = 684, 58, 1146, 554
    draw.rounded_rectangle(
        [(card_x1, card_y1), (card_x2, card_y2)],
        radius=26,
        fill=(15, 23, 42, 240),
        outline=(56, 189, 248, 130),
        width=2,
    )

    # Card Header
    draw.text(
        (card_x1 + 30, card_y1 + 26),
        "● AI 기대 최종키 시뮬레이션 리포트",
        font=f_card_head,
        fill=(147, 197, 253),
    )

    # Giant Target Height & Gain Badge
    draw.text(
        (card_x1 + 30, card_y1 + 66),
        "178.4 cm",
        font=f_big_num,
        fill=(255, 255, 255),
    )
    gain_box = (card_x1 + 258, card_y1 + 74, card_x2 - 24, card_y1 + 120)
    draw.rounded_rectangle(
        gain_box,
        radius=23,
        fill=(16, 185, 129, 55),
        outline=(52, 211, 153),
        width=2,
    )
    draw_centered_text(
        draw,
        gain_box,
        "▲ +6.7cm 숨은키",
        f_chip,
        (110, 231, 183),
    )

    # Divider line
    draw.line(
        [(card_x1 + 28, card_y1 + 144), (card_x2 - 28, card_y1 + 144)],
        fill=(255, 255, 255, 38),
        width=1,
    )

    # 3 Bars inside the card
    base_y = card_y2 - 70
    bars = [
        {
            "x": card_x1 + 48,
            "w": 96,
            "h": 130,
            "val": "171.7cm",
            "lbl": "습관 방치 시",
            "fill": (244, 63, 94, 190),
            "outline": (251, 113, 133),
            "val_color": (253, 164, 175),
        },
        {
            "x": card_x1 + 182,
            "w": 96,
            "h": 182,
            "val": "174.5cm",
            "lbl": "부모 유전키",
            "fill": (59, 130, 246, 205),
            "outline": (96, 165, 250),
            "val_color": (147, 197, 253),
        },
        {
            "x": card_x1 + 316,
            "w": 98,
            "h": 244,
            "val": "178.4cm",
            "lbl": "AI 밀착관리",
            "fill": (16, 185, 129, 235),
            "outline": (110, 231, 183),
            "val_color": (110, 231, 183),
        },
    ]

    for b in bars:
        bx1 = b["x"]
        by1 = base_y - b["h"]
        bx2 = bx1 + b["w"]
        by2 = base_y
        draw.rounded_rectangle(
            [(bx1, by1), (bx2, by2)],
            radius=12,
            fill=b["fill"],
            outline=b["outline"],
            width=2,
        )
        draw_centered_text(
            draw,
            (bx1 - 12, by1 - 36, bx2 + 12, by1 - 6),
            b["val"],
            f_bar_val,
            b["val_color"],
        )
        draw_centered_text(
            draw,
            (bx1 - 16, by2 + 12, bx2 + 16, by2 + 44),
            b["lbl"],
            f_bar_lbl,
            (226, 232, 240),
        )

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    img.save(OUT_PATH, "PNG", optimize=True)
    print(f"[OG-THUMBNAIL] Generated {OUT_PATH} ({W}x{H})")


if __name__ == "__main__":
    generate_og_image()
