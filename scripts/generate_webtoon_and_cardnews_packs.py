#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
scripts/generate_webtoon_and_cardnews_packs.py
Generates sensuous, high-contrast, editorial-grade Webtoon & Cardnews packs:
1. Webtoon Series (3 Episodes, each in its own dedicated folder under d:\사업아이템\웹툰_모음\ and samples/8_insta_threads_webtoon_pack/):
   - 1화_만3세소근육민감기_웹툰 (4-cut Instagram/Threads + 6-cut full)
   - 2화_초등문장제수학작업기억_웹툰 (4-cut Instagram/Threads)
   - 3화_밤10시숙면숨은키7cm_웹툰 (4-cut Instagram/Threads)
2. Cardnews Series (3 Themes, each in its own dedicated folder under d:\사업아이템\카드뉴스_모음\ and samples/9_cardnews_series_pack/):
   - 1탄_만3세고집과소근육발달_카드뉴스 (6 full-bleed 1080x1350 slides, zero outer margin)
   - 2탄_초등문장제수학과백지복습_카드뉴스 (4 full-bleed 1080x1350 slides, zero outer margin)
   - 3탄_밤10시숙면과숨은키7cm_카드뉴스 (4 full-bleed 1080x1350 slides, zero outer margin)
Also updates samples/2_webtoon_sample/ and samples/3_cardnews_sample/ with the upgraded sensuous design!
"""

import html
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = Path(r"C:\Users\jjang\.gemini\antigravity\brain\efdd0412-2586-40cf-bb28-0fa8976613df")

RAW_EP1_DIR = ROOT_DIR / "samples" / "2_webtoon_sample" / "raw"
RAW_EP23_DIR = ROOT_DIR / "samples" / "8_insta_threads_webtoon_pack" / "raw"

WEBTOON_ROOT_KO = ROOT_DIR / "웹툰_모음"
WEBTOON_SAMPLE_DIR = ROOT_DIR / "samples" / "8_insta_threads_webtoon_pack"

CARDNEWS_ROOT_KO = ROOT_DIR / "카드뉴스_모음"
CARDNEWS_SAMPLE_DIR = ROOT_DIR / "samples" / "9_cardnews_series_pack"


def get_font(size: int, bold: bool = False, instatoon: bool = False) -> ImageFont.FreeTypeFont:
    if instatoon:
        insta_candidates = [
            str(ROOT_DIR / "src" / "fonts" / ("NanumSquareRoundEB.ttf" if bold else "NanumSquareRoundB.ttf")),
            str(ROOT_DIR / "src" / "fonts" / "Gaegu-Bold.ttf"),
        ]
        for fp in insta_candidates:
            if Path(fp).exists():
                return ImageFont.truetype(fp, size)
    candidates = (
        [
            str(ROOT_DIR / "src" / "fonts" / "NanumSquareRoundEB.ttf"),
            "C:/Windows/Fonts/malgunbd.ttf",
            "C:/Windows/Fonts/NanumGothicBold.ttf",
        ]
        if bold
        else [
            str(ROOT_DIR / "src" / "fonts" / "NanumSquareRoundB.ttf"),
            "C:/Windows/Fonts/malgun.ttf",
            "C:/Windows/Fonts/NanumGothic.ttf",
        ]
    )
    for fp in candidates:
        if Path(fp).exists():
            return ImageFont.truetype(fp, size)
    return ImageFont.load_default()


def load_square_art(path: Path, size: int = 1080) -> Image.Image:
    if path.exists():
        img = Image.open(path).convert("RGB")
        w, h = img.size
        m = min(w, h)
        left = (w - m) // 2
        top = (h - m) // 2
        img = img.crop((left, top, left + m, top + m))
        return img.resize((size, size), Image.Resampling.LANCZOS)
    return Image.new("RGB", (size, size), (245, 243, 240))


def load_rect_art(path: Path, target_w: int, target_h: int) -> Image.Image:
    if path.exists():
        img = Image.open(path).convert("RGB")
        w, h = img.size
        target_ratio = target_w / target_h
        src_ratio = w / h
        if src_ratio > target_ratio:
            new_w = int(h * target_ratio)
            left = (w - new_w) // 2
            img = img.crop((left, 0, left + new_w, h))
        else:
            new_h = int(w / target_ratio)
            top = max(0, int((h - new_h) * 0.35))
            img = img.crop((0, top, w, top + new_h))
        return img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    return Image.new("RGB", (target_w, target_h), (245, 243, 240))


def draw_sensuous_speech_bubble(
    canvas: Image.Image,
    box_rect,
    tail_target,
    text: str,
    speaker_label: str = "",
    speaker_color=(61, 49, 42),
    highlight_color=None,
    is_narration: bool = False,
):
    """
    Draws an authentic, organic Korean Instatoon (@gangjidol style) speech bubble:
    - Snugly fitted, soft chubby oval/capsule shape around the dialogue text
    - Unified 2x supersampled hand-drawn charcoal-brown ink outline (#3D312A) matching the illustration's line art
    - Warm cream-white fill (#FFFDF9) with zero artificial UI badges, zero neon borders, and zero long needle tails
    - Short, cute comic pointer tail smoothly merged into the bubble body pointing toward the speaker
    """
    scale = 2
    W, H = canvas.size
    SW, SH = W * scale, H * scale

    f_text = get_font(31 * scale, bold=True, instatoon=True)
    temp_draw = ImageDraw.Draw(Image.new("RGBA", (100, 100)))

    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    line_widths = []
    line_heights = []
    for ln in lines:
        bb = temp_draw.textbbox((0, 0), ln, font=f_text)
        line_widths.append(bb[2] - bb[0])
        line_heights.append(bb[3] - bb[1])

    max_tw = max(line_widths) if line_widths else 200
    line_gap = 15 * scale
    total_th = sum(line_heights) + line_gap * max(0, len(lines) - 1)

    # Snug padding around the text for a soft, organic Instatoon oval/pill feel
    pad_x = 44 * scale
    pad_y = 32 * scale
    bw = max_tw + pad_x * 2
    bh = total_th + pad_y * 2

    x1_hint, y1_hint, x2_hint, y2_hint = box_rect
    cx = ((x1_hint + x2_hint) // 2) * scale
    cy = ((y1_hint + y2_hint) // 2) * scale

    # Keep bubble comfortably inside the 1080x1080 frame
    margin = 26 * scale
    bx1 = max(margin, min(SW - margin - bw, cx - bw // 2))
    by1 = max(margin, min(SH - margin - bh, cy - bh // 2))
    bx2 = bx1 + bw
    by2 = by1 + bh
    bcx = (bx1 + bx2) // 2
    bcy = (by1 + by2) // 2

    tx, ty = tail_target[0] * scale, tail_target[1] * scale

    # Clamp tail length so it is ALWAYS a short, cute Instatoon tail (max ~48px outside bubble)
    # pointing in the direction of (tx, ty)
    import math
    if not is_narration:
        # Find anchor point on bubble boundary closest to target
        if ty > by2:
            anchor_x = max(bx1 + 65 * scale, min(bx2 - 65 * scale, bcx + (tx - bcx) // 2))
            anchor_y = by2 - 6 * scale
            dx = tx - anchor_x
            dy = max(24 * scale, ty - anchor_y)
            dist = math.hypot(dx, dy)
            max_len = 38 * scale
            if dist > max_len:
                tx = int(anchor_x + dx * (max_len / dist))
                ty = int(anchor_y + dy * (max_len / dist))
            tail_w = 18 * scale
            tail_poly = [(anchor_x - tail_w, anchor_y), (anchor_x + tail_w, anchor_y), (tx, ty)]
        elif ty < by1:
            anchor_x = max(bx1 + 65 * scale, min(bx2 - 65 * scale, bcx + (tx - bcx) // 2))
            anchor_y = by1 + 6 * scale
            dx = tx - anchor_x
            dy = min(-24 * scale, ty - anchor_y)
            dist = math.hypot(dx, dy)
            max_len = 38 * scale
            if dist > max_len:
                tx = int(anchor_x + dx * (max_len / dist))
                ty = int(anchor_y + dy * (max_len / dist))
            tail_w = 18 * scale
            tail_poly = [(anchor_x - tail_w, anchor_y), (anchor_x + tail_w, anchor_y), (tx, ty)]
        else:
            anchor_x = bx1 + 6 * scale if tx < bcx else bx2 - 6 * scale
            anchor_y = max(by1 + 36 * scale, min(by2 - 36 * scale, bcy))
            dx = tx - anchor_x
            dy = ty - anchor_y
            dist = max(1.0, math.hypot(dx, dy))
            max_len = 36 * scale
            if dist > max_len:
                tx = int(anchor_x + dx * (max_len / dist))
                ty = int(anchor_y + dy * (max_len / dist))
            tail_w = 15 * scale
            tail_poly = [(anchor_x, anchor_y - tail_w), (anchor_x, anchor_y + tail_w), (tx, ty)]
    else:
        tail_poly = None

    # Create 2x supersampled RGBA overlay for silky-smooth hand-drawn outline + fill
    hi_overlay = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hi_overlay)

    ink_color = (58, 46, 39, 255)      # Warm hand-drawn dark brown-charcoal pen line
    fill_color = (255, 253, 249, 250)  # Soft warm cream-white paper fill
    stroke_w = int(3.5 * scale)
    radius = min(bw, bh) // 2 if not is_narration else 26 * scale

    # Subtle, ultra-soft natural ambient shadow (barely noticeable, blends into watercolor)
    sh_off = 4 * scale
    hd.rounded_rectangle(
        [(bx1 + sh_off, by1 + sh_off), (bx2 + sh_off, by2 + sh_off)],
        radius=radius,
        fill=(40, 32, 26, 28),
    )

    # Step A: Draw outer ink shape (capsule + tail) in ink_color
    if tail_poly:
        # Expand tail slightly for outer ink border
        hd.polygon(tail_poly, fill=ink_color, outline=ink_color, width=stroke_w * 2)
    hd.rounded_rectangle(
        [(bx1 - stroke_w, by1 - stroke_w), (bx2 + stroke_w, by2 + stroke_w)],
        radius=radius + stroke_w,
        fill=ink_color,
    )

    # Step B: Draw inner cream fill (capsule + tail interior) so tail and bubble merge with ZERO seam!
    hd.rounded_rectangle(
        [(bx1, by1), (bx2, by2)],
        radius=radius,
        fill=fill_color,
    )
    if tail_poly:
        # Shrink tail tip inward along vector by stroke_w so ink tip stays sharp and clean
        ax = (tail_poly[0][0] + tail_poly[1][0]) / 2.0
        ay = (tail_poly[0][1] + tail_poly[1][1]) / 2.0
        vx, vy = tx - ax, ty - ay
        vlen = max(1.0, math.hypot(vx, vy))
        in_tx = int(tx - (vx / vlen) * (stroke_w * 1.35))
        in_ty = int(ty - (vy / vlen) * (stroke_w * 1.35))
        if abs(tail_poly[0][0] - tail_poly[1][0]) > 0:
            inner_tail = [
                (tail_poly[0][0] + stroke_w, tail_poly[0][1]),
                (tail_poly[1][0] - stroke_w, tail_poly[1][1]),
                (in_tx, in_ty),
            ]
        else:
            inner_tail = [
                (tail_poly[0][0], tail_poly[0][1] + stroke_w),
                (tail_poly[1][0], tail_poly[1][1] - stroke_w),
                (in_tx, in_ty),
            ]
        hd.polygon(inner_tail, fill=fill_color)

    # Step C: Draw warm, expressive Instatoon text centered inside the bubble
    cur_y = by1 + (bh - total_th) // 2 - 2 * scale
    for idx, ln in enumerate(lines):
        tw = line_widths[idx]
        th = line_heights[idx]
        lx = bx1 + (bw - tw) // 2
        hd.text((lx, cur_y), ln, font=f_text, fill=(42, 34, 30, 255))
        cur_y += th + line_gap

    # Downsample 2x -> 1x with LANCZOS for crisp anti-aliased hand-drawn look
    smooth_overlay = hi_overlay.resize((W, H), Image.Resampling.LANCZOS)
    return Image.alpha_composite(canvas.convert("RGBA"), smooth_overlay).convert("RGB")


def render_webtoon_cut(
    raw_path: Path,
    ep_badge: str,
    step_badge: str,
    bubbles: list,
    accent_color=(79, 70, 229),
) -> Image.Image:
    """
    Renders a pure, natural 1080x1080 Instatoon cut (@gangjidol style):
    - NO artificial UI header pills or speaker tags
    - Natural oval/capsule hand-drawn speech bubbles placed right next to the characters
    """
    canvas = load_square_art(raw_path, 1080)

    for b in bubbles:
        spk = b.get("speaker", "")
        is_narr = "팩트" in spk or "팁" in spk
        canvas = draw_sensuous_speech_bubble(
            canvas,
            box_rect=b["box"],
            tail_target=b["tail"],
            text=b["text"],
            is_narration=is_narr,
        )
    return canvas


def render_sensuous_cardnews_slide(
    raw_path: Path,
    series_badge: str,
    slide_num_str: str,
    title_line1: str,
    title_line2_highlight: str,
    subtitle_1line: str,
    floating_tag: str,
    points_3: list,
    theme_palette: dict,
) -> Image.Image:
    """
    Renders an editorial, high-contrast, ZERO-MARGIN 1080x1350 Cardnews slide:
    - Top Zone (y = 0..340): Rich dark editorial background, neon accent pill badge,
      56pt bold white title with fluorescent highlight bar behind line 2, 30pt gold/mint subtitle.
    - Center Zone (y = 340..940): Full-bleed 1080px-wide illustration (zero left/right margin!)
      with a sleek floating insight pill badge at bottom-left of the artwork.
    - Bottom Zone (y = 940..1350): 3 full-width rows (height 136px each, zero margin!)
      with bold circular number badges (01, 02, 03) + large 36pt bold 1-line text + key phrase highlight!
    """
    W, H = 1080, 1350
    canvas = Image.new("RGB", (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    header_bg = theme_palette["header_bg"]          # e.g. (30, 27, 75) Deep Royal Indigo
    accent = theme_palette["accent"]                # e.g. (79, 70, 229)
    neon_badge = theme_palette["neon_badge"]        # e.g. (16, 185, 129)
    highlight_bar = theme_palette["highlight_bar"]  # e.g. (250, 204, 21)
    sub_color = theme_palette["sub_color"]          # e.g. (167, 243, 208)
    row_even = theme_palette["row_even"]            # e.g. (245, 247, 255)
    row_odd = theme_palette["row_odd"]              # e.g. (255, 255, 255)
    point_hl = theme_palette["point_hl"]            # e.g. (254, 240, 138)

    # 1. Top Editorial Header Zone (0..340, 100% Full-Bleed)
    draw.rectangle([(0, 0), (W, 340)], fill=header_bg)
    draw.rectangle([(0, 0), (W, 12)], fill=neon_badge)

    f_badge = get_font(25, bold=True)
    f_title = get_font(55, bold=True)
    f_sub = get_font(30, bold=True)

    # Top Series Badge Pill & Slide Counter
    b_bbox = draw.textbbox((0, 0), series_badge, font=f_badge)
    b_w = (b_bbox[2] - b_bbox[0]) + 40
    draw.rounded_rectangle([(48, 32), (48 + b_w, 78)], radius=23, fill=neon_badge)
    draw.text((68, 38), series_badge, font=f_badge, fill=(15, 23, 42))

    s_bbox = draw.textbbox((0, 0), slide_num_str, font=f_badge)
    s_w = s_bbox[2] - s_bbox[0]
    draw.text((W - s_w - 48, 38), slide_num_str, font=f_badge, fill=(203, 213, 225))

    # Title Line 1 (Centered or Left-aligned at x=48 for strong editorial impact)
    draw.text((48, 96), title_line1, font=f_title, fill=(255, 255, 255))

    # Title Line 2 with Vivid Highlighter Bar behind it
    t2_bbox = draw.textbbox((0, 0), title_line2_highlight, font=f_title)
    t2_w = t2_bbox[2] - t2_bbox[0]
    draw.rounded_rectangle([(42, 174), (58 + t2_w, 242)], radius=12, fill=highlight_bar)
    draw.text((48, 170), title_line2_highlight, font=f_title, fill=(15, 23, 42))

    # Subtitle (1 crisp line)
    draw.text((48, 266), "★ " + subtitle_1line, font=f_sub, fill=sub_color)

    # 2. Center Full-Width Artwork Zone (y = 340..940, width = 1080, height = 600, ZERO margin!)
    art_img = load_rect_art(raw_path, W, 600)
    canvas.paste(art_img, (0, 340))

    # Floating Tag Badge on bottom-left of Artwork
    ft_bbox = draw.textbbox((0, 0), floating_tag, font=f_badge)
    ft_w = (ft_bbox[2] - ft_bbox[0]) + 44
    draw.rounded_rectangle([(36, 868), (36 + ft_w, 918)], radius=25, fill=header_bg, outline=(255, 255, 255), width=2)
    draw.text((58, 876), floating_tag, font=f_badge, fill=highlight_bar)

    draw.line([(0, 340), (W, 340)], fill=neon_badge, width=4)
    draw.line([(0, 940), (W, 940)], fill=accent, width=5)

    # 3. Bottom 3-Row Takeaway Zone (y = 940..1350, 3 rows, ZERO outer margin!)
    row_y_starts = [940, 1076, 1212]
    row_heights = [136, 136, 138]
    f_num = get_font(30, bold=True)
    f_pt = get_font(37, bold=True)

    for idx, pt_text in enumerate(points_3[:3]):
        ry = row_y_starts[idx]
        rh = row_heights[idx]
        bg_c = row_even if idx % 2 == 0 else row_odd
        draw.rectangle([(0, ry), (W, ry + rh)], fill=bg_c)
        if idx > 0:
            draw.line([(0, ry), (W, ry)], fill=(203, 213, 225), width=2)

        # Left vertical accent bar (10px wide, zero margin)
        draw.rectangle([(0, ry), (12, ry + rh)], fill=accent if idx % 2 == 0 else neon_badge)

        # Number Circle Badge (01, 02, 03)
        cx = 76
        cy = ry + rh // 2
        draw.ellipse([(cx - 34, cy - 34), (cx + 34, cy + 34)], fill=accent if idx != 1 else header_bg)
        num_str = f"0{idx + 1}"
        nb = draw.textbbox((0, 0), num_str, font=f_num)
        nw = nb[2] - nb[0]
        nh = nb[3] - nb[1]
        draw.text((cx - nw // 2, cy - nh // 2 - 4), num_str, font=f_num, fill=(255, 255, 255))

        # Clean point text (strip leading ①/②/③ if present)
        clean_pt = pt_text.lstrip("①②③123. ").strip()
        pb = draw.textbbox((0, 0), clean_pt, font=f_pt)
        pw = pb[2] - pb[0]
        ph = pb[3] - pb[1]
        px = 136
        py = ry + (rh - ph) // 2 - 6

        # Subtle highlight bar behind the quoted keyword if present, or under the second half
        draw.rounded_rectangle([(px - 4, py + ph - 10), (px + pw + 6, py + ph + 8)], radius=6, fill=point_hl)
        draw.text((px, py), clean_pt, font=f_pt, fill=(15, 23, 42))

    return canvas


def ensure_ep1_raw_files():
    RAW_EP1_DIR.mkdir(parents=True, exist_ok=True)
    RAW_EP23_DIR.mkdir(parents=True, exist_ok=True)
    mapping_ep1 = {
        "cut_01.jpg": "cut_01_1792414415116.jpg",
        "cut_02.jpg": "cut_02_1792414438722.jpg",
        "cut_03.jpg": "cut_03_1792414465152.jpg",
        "cut_04.jpg": "cut_04_1792414488540.jpg",
        "cut_05.jpg": "cut_05_1792414511707.jpg",
        "cut_06.jpg": "cut_06_1792414538353.jpg",
    }
    for dst_name, src_name in mapping_ep1.items():
        dst = RAW_EP1_DIR / dst_name
        src = ARTIFACTS_DIR / src_name
        if not dst.exists() and src.exists():
            shutil.copy2(src, dst)

    mapping_ep23 = {
        "ep02_cut_01.png": "ep02_cut_01_png_1792631391975.jpg",
        "ep02_cut_02.png": "ep02_cut_02_png_1792631415831.jpg",
        "ep02_cut_03.png": "ep02_cut_03_png_1792631439688.jpg",
        "ep02_cut_04.png": "ep02_cut_04_png_1792631512550.jpg",
        "ep03_cut_01.png": "ep03_cut_01_1792631399681.jpg",
        "ep03_cut_02.png": "ep03_cut_02_1792631421619.jpg",
        "ep03_cut_03.png": "ep03_cut_03_1792631445290.jpg",
        "ep03_cut_04.png": "ep03_cut_04_1792631470429.jpg",
        "ep04_cut_01.png": "ep04_cut_01_1792710170705.jpg",
        "ep04_cut_02.png": "ep04_cut_02_1792710212149.jpg",
        "ep04_cut_03.png": "ep04_cut_03_1792710232497.jpg",
        "ep04_cut_04.png": "ep04_cut_04_1792710252830.jpg",
        "ep05_cut_01.png": "ep05_cut_01_1792710168506.jpg",
        "ep05_cut_02.png": "ep05_cut_02_1792710188347.jpg",
        "ep05_cut_03.png": "ep05_cut_03_1792710208348.jpg",
        "ep05_cut_04.png": "ep05_cut_04_1792710231575.jpg",
    }
    for dst_name, src_name in mapping_ep23.items():
        dst = RAW_EP23_DIR / dst_name
        src = ARTIFACTS_DIR / src_name
        if not dst.exists() and src.exists():
            shutil.copy2(src, dst)


def render_insta_5th_summary_card(ep: dict) -> Image.Image:
    """
    Renders the 5th 1080x1080 square slide for the Instagram Carousel (@kids_fit1 style):
    A warm, save-worthy 3-point parenting cheat-sheet card with @kids_fit1 profile CTA!
    Zero missing-glyph emoji boxes and 100% unclipped text margin.
    """
    W, H = 1080, 1080
    canvas = Image.new("RGB", (W, H), (251, 249, 244))
    draw = ImageDraw.Draw(canvas)

    accent = ep.get("accent", (79, 70, 229))
    # Top header banner
    draw.rectangle([(0, 0), (W, 235)], fill=(30, 27, 75))
    draw.rectangle([(0, 0), (W, 12)], fill=(250, 204, 21))

    f_badge = get_font(26, bold=True)
    f_title = get_font(44, bold=True)
    f_sub = get_font(27, bold=True)
    f_pt_title = get_font(32, bold=True)
    f_pt_desc = get_font(22, bold=True)

    badge_txt = f"{ep['ep_badge']} · 오늘 저녁 실천 요약표"
    bb = draw.textbbox((0, 0), badge_txt, font=f_badge)
    bw = (bb[2] - bb[0]) + 44
    draw.rounded_rectangle([(54, 34), (54 + bw, 82)], radius=24, fill=(250, 204, 21))
    draw.text((76, 41), badge_txt, font=f_badge, fill=(15, 23, 42))

    summary_title = ep.get("summary_card_title", "오늘부터 바로 시작하는 3단계 솔루션")
    draw.text((54, 106), summary_title, font=f_title, fill=(255, 255, 255))
    raw_sub = ep.get("summary_card_sub", "오른쪽 아래 [저장하기] 눌러두고 오늘 저녁 바로 실천해 보세요!")
    clean_sub = raw_sub.replace("🔖", "").replace("  ", " ").replace("[저장 ]", "[저장하기]")
    draw.text((54, 174), "★ " + clean_sub, font=f_sub, fill=(167, 243, 208))

    # 3 Actionable Point Cards
    pts = ep.get("summary_points", [
        ("1단계 · 뇌과학 원인 이해하기", "아이의 행동을 반항이 아닌 발달 신호로 읽어주세요"),
        ("2단계 · 가정 내 10분 맞춤 루틴", "비싼 사교육·교구 대신 일상 속 작은 습관부터 바꾸기"),
        ("3단계 · 밤 10시 숙면과 성장 연결", "낮의 성취감과 깊은 수면이 키와 두뇌를 함께 키웁니다"),
    ])
    y_curr = 268
    for idx, (pt_t, pt_d) in enumerate(pts[:3], start=1):
        draw.rounded_rectangle(
            [(48, y_curr), (W - 48, y_curr + 180)],
            radius=28,
            fill=(255, 255, 255),
            outline=(218, 224, 238),
            width=3,
        )
        draw.ellipse([(76, y_curr + 48), (152, y_curr + 124)], fill=accent)
        n_txt = f"0{idx}"
        nb = draw.textbbox((0, 0), n_txt, font=f_pt_title)
        draw.text(
            (114 - (nb[2] - nb[0]) // 2, y_curr + 86 - (nb[3] - nb[1]) // 2 - 4),
            n_txt,
            font=f_pt_title,
            fill=(255, 255, 255),
        )
        draw.text((176, y_curr + 44), pt_t, font=f_pt_title, fill=(15, 23, 42))
        draw.text((176, y_curr + 104), pt_d, font=f_pt_desc, fill=(71, 85, 105))
        y_curr += 202

    # Bottom @kids_fit1 Profile Link CTA Box
    draw.rounded_rectangle(
        [(48, 886), (W - 48, 1040)],
        radius=28,
        fill=(238, 242, 255),
        outline=accent,
        width=3,
    )
    f_cta1 = get_font(30, bold=True)
    f_cta2 = get_font(24, bold=True)
    draw.text(
        (76, 912),
        "★ 프로필 상단 링크(@kids_fit1)에서 1분 무료 진단!",
        font=f_cta1,
        fill=(49, 46, 129),
    )
    draw.text(
        (76, 968),
        "질병관리청 성장도표 & 논문 2,723편 기반 우리 아이 맞춤 리포트 ▶ truthofmarket.com",
        font=f_cta2,
        fill=(79, 70, 229),
    )
    return canvas


WEBTOON_EPISODES = [
    {
        "ep_num": 1,
        "folder_name": "1화_만3세소근육민감기_웹툰",
        "ep_badge": "키즈핏 육아툰 EP.01",
        "title": "1화: 만 3세 '내가 혼자 할 거야!' 고집의 진짜 이유 (손끝 소근육 민감기)",
        "accent": (79, 70, 229),
        "summary_card_title": "만 2~4세 '내가 할 거야!' 3단계 처방",
        "summary_card_sub": "오른쪽 아래 [저장 🔖] 눌러두고 오늘 저녁 바로 실천해 보세요!",
        "summary_points": [
            ("단추 전쟁 대신 '나무 집게 폼폼이 옮기기'", "엄지·검지·중지 세 손가락 협응력이 길러지면 단추·연필 잡기가 수월해져요"),
            ("물 따르기 대신 '구슬 꿰기 & 안전가위 오리기'", "눈과 손의 협응력과 전두엽 집중력이 동시에 폭발하는 최고의 두뇌 자극"),
            ("결과물보다 '10초 기다림' 선물하기", "삐뚤빼뚤 오린 하트 종이에도 '네 힘으로 해냈네!' 안아주면 자존감이 자랍니다"),
        ],
        "cuts": [
            {
                "raw": RAW_EP1_DIR / "cut_01.jpg",
                "step": "1 / 4 (갈등)",
                "bubbles": [
                    {
                        "speaker": "워킹맘 엄마",
                        "color": (79, 70, 229),
                        "box": (36, 36, 615, 195),
                        "tail": (435, 315),
                        "text": "아이고 지우야, 물 다 쏟았잖아…\n엄마가 단추 빨리 끼워줄게!",
                    },
                    {
                        "speaker": "만 3세 지우",
                        "color": (234, 88, 12),
                        "box": (440, 225, 1044, 385),
                        "tail": (720, 465),
                        "text": "싫어!! 엄마 저리 가!\n내가 혼자 끼울 거야!!",
                    },
                ],
            },
            {
                "raw": RAW_EP1_DIR / "cut_03.jpg",
                "step": "2 / 4 (반전 팩트)",
                "bubbles": [
                    {
                        "speaker": "소아발달 팩트체크",
                        "color": (5, 150, 105),
                        "box": (36, 38, 635, 198),
                        "tail": (360, 440),
                        "text": "만 3세 고집은 반항이 아니라\n뇌 30%와 직결된 '손끝 민감기' 신호!",
                    },
                    {
                        "speaker": "엄마의 깨달음",
                        "color": (79, 70, 229),
                        "box": (395, 860, 1044, 1025),
                        "tail": (640, 340),
                        "text": "아하! 날 힘들게 하려는 게 아니라\n스스로 크려는 기특한 신호였구나!",
                    },
                ],
            },
            {
                "raw": RAW_EP1_DIR / "cut_04.jpg",
                "step": "3 / 4 (오늘의 실천)",
                "bubbles": [
                    {
                        "speaker": "다정한 엄마",
                        "color": (79, 70, 229),
                        "box": (36, 38, 635, 198),
                        "tail": (455, 290),
                        "text": "옳지~ 나무 집게로 꼭 집어볼까?\n천천히 해도 엄마가 기다려 줄게!",
                    },
                    {
                        "speaker": "신난 지우",
                        "color": (16, 185, 129),
                        "box": (445, 225, 1044, 385),
                        "tail": (720, 455),
                        "text": "엄마 봐봐요! 내가 혼자\n파란 공 집었어! 재밌다!!",
                    },
                ],
            },
            {
                "raw": RAW_EP1_DIR / "cut_06.jpg",
                "step": "4 / 4 (성장 결실)",
                "bubbles": [
                    {
                        "speaker": "자신감 뿜뿜 지우",
                        "color": (234, 88, 12),
                        "box": (410, 38, 1044, 198),
                        "tail": (730, 435),
                        "text": "엄마! 내가 혼자 안전가위로\n하트 오렸어요! 엄마 선물!",
                    },
                    {
                        "speaker": "행복한 엄마",
                        "color": (79, 70, 229),
                        "box": (36, 860, 695, 1025),
                        "tail": (480, 470),
                        "text": "고마워 우리 아가,\n네 속도로 자라줘서 정말 고마워♥",
                    },
                ],
            },
        ],
        "insta_caption": """"싫어!! 엄마 저리 가! 내가 혼자 끼울 거야!!" 😭
바쁜 아침, 물은 다 쏟아놓고 단추 하나에 10분째 씨름하는 아이 보며 속에서 천불 나셨던 적 있으시죠?

저도 처음엔 아이가 유독 고집이 세고 반항하는 줄만 알았어요.
그런데 뇌과학 데이터를 찾아보고 머리를 한 대 맞은 것 같았습니다.

🧠 만 2~4세 아이가 유독 "내가! 내가!"를 외치는 이유,
엄마를 힘들게 하려는 반항이 아니라 대뇌 피질의 약 30%와 직결된 [손끝(소근육) 민감기]가 폭발하고 있다는 기특한 신호였어요!

신경외과 학자 펜필드(Penfield)의 뇌 지도에 따르면, 우리 뇌 운동·감각 영역의 30% 이상이 오직 '손과 열 손가락'에 연결되어 있습니다.
아이의 뇌가 "지금 내 손끝 신경회로를 연결해야 전두엽이 자라요! 엄마 대신 해주세요 하지 말고 내가 직접 만지게 해주세요!"라고 온몸으로 외치고 있었던 거죠.

💡 오늘부터 '엄마가 빨리 해줄게!' 대신 이렇게만 바꿔보세요:

1️⃣ 단추·지퍼 전쟁 대신 [나무 집게로 색깔 폼폼이 옮기기]
👉 엄지·검지·중지 세 손가락 힘(소근육 협응력)이 길러지면 단추 끼우기와 연필 잡기가 거짓말처럼 수월해져요.

2️⃣ 쏟고 흘리는 물 따르기 대신 [구슬 꿰기 & 안전가위 종이 오리기]
👉 눈과 손의 협응력(Eye-Hand Coordination)과 전두엽 집중력이 동시에 폭발하는 최고의 두뇌 자극 놀이입니다.

3️⃣ 결과물보다 '기다림' 선물하기
👉 삐뚤빼뚤 오린 하트 종이 하나에도 "네 힘으로 해냈네!" 하고 안아주면, 아이의 자기효능감과 자율성이 단단하게 자라납니다.

우리 아이가 지금 어떤 발달 민감기를 지나고 있는지,
또래 대비 신체 성장 백분위와 두뇌·인지 발달 밸런스는 어떤지 궁금하시다면?

📌 지금 프로필 상단 링크(@kids_fit1)에서
질병관리청 성장도표 & 발달 기준 논문 2,723편 기반
[우리 아이 1:1 성장·두뇌 발달 정밀 리포트]를 1분 만에 무료로 확인해 보세요! 💌

(오늘 저녁 아이와 함께 해보실 분들은 오른쪽 아래 [저장 🔖] 꾹 눌러두세요! ♥)

#육아툰 #인스타툰 #만3세 #미운네살 #소근육발달 #몬테소리 #두뇌발달 #엄마표놀이 #육아스타그램 #워킹맘육아 #아이키성장 #키즈핏""",
        "threads_post_1": """바쁜 아침에 물 다 쏟고 "싫어! 엄마 저리 가! 내가 혼자 단추 끼울 거야!!" 하고 우는 아이 보면서 한숨 쉬어본 엄빠들 계시죠? 😭

저도 애가 왜 이렇게 고집이 세졌나 싶었는데, 소아 신경발달 데이터를 보고 완전히 반성했습니다. 만 2~4세 아이가 갑자기 모든 걸 자기 손으로 하겠다고 고집부리는 건 '반항'이 아니라, 대뇌 피질의 30%와 직결된 [손끝 소근육 민감기]가 열렸다는 뇌의 신호래요.

뇌가 한창 손끝 시냅스를 연결하려고 애쓰는 중이라는 걸 알고 나니, 단추 하나 끼우느라 낑낑대는 고사리손이 그렇게 기특해 보일 수가 없더라고요. 주말에 나무 집게로 공 옮기기랑 안전가위 오리기를 해줬더니 혼자 하트를 오려와서 "엄마 선물!" 하고 건네는데 코끝이 찡했습니다🥹""",
        "threads_reply_2": """오늘도 "내가 혼자 할 거야!" 병에 걸린 아이 기다려주느라 애쓰신 모든 엄빠들, 우리 아이 뇌가 폭풍 성장 중이라는 뜻이니 오늘 밤엔 꼭 한 번 더 안아주자고요 ♥

💡 우리 아이 개월 수별 소근육·두뇌 발달 밸런스랑 질병관리청 기준 키 백분위는 제가 참고한 무료 진단 리포트에서 회원가입 없이 1분 만에 확인해 보실 수 있어요!
👉 https://kidsfit.co.kr""",
    },
    {
        "ep_num": 2,
        "folder_name": "2화_초등문장제수학작업기억_웹툰",
        "ep_badge": "키즈핏 학습툰 EP.02",
        "title": "2화: 연산은 100점인데 문장제 수학만 별표 치는 아이 (전두엽 작업기억의 비밀)",
        "accent": (13, 148, 136),
        "summary_card_title": "문장제 수학 별표(★) 탈출 3단계",
        "summary_card_sub": "오른쪽 아래 [저장 🔖] 눌러두고 오늘 저녁 수학 시간에 바로 써보세요!",
        "summary_points": [
            ("구하는 것에 동그라미(○)·조건에 밑줄(ㅡ)", "눈으로만 읽지 않고 손으로 표시하면 전두엽 작업기억 부담이 50% 줄어들어요"),
            ("식 세우기 전 '여백에 상자·막대 그림' 그리기", "머릿속 암산 대신 종이 여백을 '두 번째 칠판'으로 쓰면 더할지 뺄지 한눈에 보입니다"),
            ("정답 맞힌 뒤 '30초 엄마에게 설명하기'", "열 문제 기계적 풀이보다 한 문제를 내 말로 설명할 때 메타인지가 완성됩니다"),
        ],
        "cuts": [
            {
                "raw": RAW_EP23_DIR / "ep02_cut_01.png",
                "step": "1 / 4 (갈등)",
                "bubbles": [
                    {
                        "speaker": "답답한 엄마",
                        "color": (79, 70, 229),
                        "box": (250, 26, 880, 176),
                        "tail": (665, 215),
                        "text": "연산 시험지는 100점 맞으면서\n왜 세 줄짜리 문장제만 나오면 별표야?",
                    },
                    {
                        "speaker": "초등 2학년 민준",
                        "color": (234, 88, 12),
                        "box": (380, 865, 1044, 1025),
                        "tail": (390, 790),
                        "text": "끝까지 읽으면 앞줄 숫자가\n머릿속에서 다 지워진단 말이에요 ㅠㅠ",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep02_cut_02.png",
                "step": "2 / 4 (뇌과학 팩트)",
                "bubbles": [
                    {
                        "speaker": "인지뇌과학 팩트",
                        "color": (13, 148, 136),
                        "box": (32, 26, 620, 176),
                        "tail": (390, 220),
                        "text": "국어 어휘 부족이 아니라 머릿속 칠판\n'전두엽 작업기억' 용량이 꽉 찬 현상!",
                    },
                    {
                        "speaker": "엄마의 깨달음",
                        "color": (79, 70, 229),
                        "box": (385, 865, 1044, 1025),
                        "tail": (760, 790),
                        "text": "아하! 암산하라고 재촉할 게 아니라\n종이 여백을 칠판으로 쓰게 해야겠네!",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep02_cut_03.png",
                "step": "3 / 4 (3단계 도해법)",
                "bubbles": [
                    {
                        "speaker": "코칭하는 엄마",
                        "color": (13, 148, 136),
                        "box": (240, 26, 880, 176),
                        "tail": (655, 215),
                        "text": "식을 바로 쓰지 말고 구하는 건 동그라미,\n여백에 상자 그림부터 그려볼까?",
                    },
                    {
                        "speaker": "눈이 번쩍 민준",
                        "color": (79, 70, 229),
                        "box": (380, 865, 1044, 1025),
                        "tail": (390, 790),
                        "text": "우와! 그림으로 그리니까 더할지 뺄지\n한눈에 바로 보여요 엄마!!",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep02_cut_04.png",
                "step": "4 / 4 (성취감 폭발)",
                "bubbles": [
                    {
                        "speaker": "자신감 넘치는 민준",
                        "color": (234, 88, 12),
                        "box": (32, 26, 620, 176),
                        "tail": (380, 225),
                        "text": "엄마! 내가 왜 이렇게 식 세웠는지\n30초 만에 설명해 볼게요! 하이파이브!",
                    },
                    {
                        "speaker": "든든한 엄마",
                        "color": (13, 148, 136),
                        "box": (385, 865, 1044, 1025),
                        "tail": (760, 790),
                        "text": "열 문제 푸는 것보다 한 문제를\n내 말로 설명하는 게 진짜 실력이야♥",
                    },
                ],
            },
        ],
        "insta_caption": """"연산 시험지는 100점 맞으면서, 왜 세 줄짜리 문장제 문제만 나오면 읽지도 않고 별표(★)부터 칠까?" 😭
문제집 풀 때마다 "엄마 이거 더하는 거야 빼는 거야?" 물어보는 아이 보며 답답하셨던 적 있으시죠?

저도 처음엔 책을 덜 읽어서 국어 문해력이 부족한 줄만 알았어요.
그런데 인지뇌과학 논문을 찾아보고 완전히 오해였다는 걸 깨달았습니다.

🧠 연산은 잘하는데 문장제 수학만 막히는 진짜 이유,
국어 실력이 부족해서가 아니라 머릿속 작은 칠판인 [전두엽 작업기억(Working Memory)] 용량이 과부하에 걸렸기 때문이었어요!

인지심리학자 배들리(Baddeley)의 작업기억 모델에 따르면, 초등 저학년 아이의 머릿속 칠판에는 한 번에 2~3개의 정보밖에 띄워둘 수 없습니다.
눈으로만 문제를 읽으며 머릿속으로 암산하려고 하니, 마지막 줄을 읽을 때쯤 앞줄의 숫자가 칠판에서 지워져 버리는 거였죠!

💡 오늘 저녁 수학 문제집 풀 때 '다시 읽어봐!' 대신 이렇게만 바꿔보세요:

1️⃣ 눈으로만 읽기 대신 [구하는 것에 동그라미(○), 조건에 밑줄(ㅡ)]
👉 손끝으로 표시하며 읽는 순간 시각 정보가 분리되어 전두엽의 부담이 절반으로 줄어듭니다.

2️⃣ 머릿속 암산 대신 [종이 여백에 간단한 상자·막대 그림 그리기]
👉 문제집 빈 공간을 '두 번째 칠판'으로 쓰게 해주면 더할지 뺄지 아이 스스로 한눈에 찾아냅니다.

3️⃣ 열 문제 양치기 대신 [내가 푼 한 문제 엄마에게 30초 설명하기]
👉 "왜 이 식을 세웠는지 엄마한테 선생님처럼 알려줄래?" 한마디면 메타인지와 수학 자존감이 폭발합니다.

우리 아이의 전두엽 작업기억·수리추론·문해력·메타인지 5대 학습 역량(LQ)은 지금 몇 점인지 궁금하시다면?

📌 지금 프로필 상단 링크(@kids_fit1)에서
질병관리청 성장도표 & 두뇌·학습 논문 2,723편 기반
[우리 아이 1:1 신체 성장 × 두뇌 학습 마스터 리포트]를 1분 만에 무료로 확인해 보세요! 💌

(오늘 저녁 아이 수학 봐주실 분들은 오른쪽 아래 [저장 🔖] 꾹 눌러두세요! ♥)

#초등수학 #문장제수학 #서술형수학 #초등공부법 #작업기억 #메타인지 #하브루타 #초등맘 #육아툰 #인스타툰 #두뇌발달 #키즈핏""",
        "threads_post_1": """연산 시험지는 100점 맞으면서 문제가 세 줄만 넘어가면 읽지도 않고 별표(★)부터 치거나 "엄마 이거 더하는 거야 빼는 거야?" 물어보는 아이 보며 한숨 쉬어본 엄빠들 계시죠? 😭

저도 우리 애가 국어 독해력이 부족한가 싶었는데, 인지뇌과학 데이터를 보고 완전히 반성했습니다. 초등 아이가 문장제 수학에서 막히는 건 국어 문제가 아니라, 머릿속 작은 칠판인 [전두엽 작업기억] 용량이 꽉 차서 앞줄 숫자가 지워지는 현상이래요!

암산하라고 다그칠 게 아니라 문제집 여백에 '상자 그림' 하나만 그리게 해줬더니, 혼자 식 세우고 맞히면서 "엄마 나 수학 천재인가 봐!" 하고 하이파이브하는데 어찌나 기특하던지요🥹""",
        "threads_reply_2": """오늘도 아이 문제집 옆에서 참을 인(忍) 세 번 새기며 애쓰신 모든 엄빠들, 아이 머릿속 칠판을 종이 여백으로 넓혀주는 작은 습관 하나로 오늘 저녁은 웃으며 하이파이브해 보자고요 ♥

💡 우리 아이 전두엽 작업기억·문해력·수리력 5대 학습 역량(LQ) 점수랑 신체 성장 백분위는 제가 참고한 무료 리포트에서 회원가입 없이 1분 만에 확인하실 수 있어요!
👉 https://kidsfit.co.kr""",
    },
    {
        "ep_num": 3,
        "folder_name": "3화_밤10시숙면숨은키7cm_웹툰",
        "ep_badge": "키즈핏 성장툰 EP.03",
        "title": "3화: 밤마다 우유 먹였는데 키가 안 큰다고요? (밤 10시 성장호르몬 & 하체 스트레칭의 비밀)",
        "accent": (234, 88, 12),
        "summary_card_title": "부모 유전키 넘는 '밤 10시 루틴 3원칙'",
        "summary_card_sub": "오른쪽 아래 [저장 🔖] 눌러두고 오늘 밤 9시 40분부터 바로 시작하세요!",
        "summary_points": [
            ("취침 2시간 전 '야식·우유 멈추기'", "혈당과 인슐린이 낮아진 공복 상태여야 밤 10시 성장호르몬 스위치가 켜집니다"),
            ("칼슘은 저녁 식사에 '두부·치즈·비타민D3'로", "배앓이하는 밤 우유 대신 저녁 식사 때 고흡수 칼슘·비타민D3·아연으로 채워주세요"),
            ("밤 9시 40분 '무릎·종아리 5분 스트레칭'", "낮 동안 중력에 눌린 척추와 무릎 성장판을 부드럽게 이완해 숨은 키를 깨웁니다"),
        ],
        "cuts": [
            {
                "raw": RAW_EP23_DIR / "ep03_cut_01.png",
                "step": "1 / 4 (갈등)",
                "bubbles": [
                    {
                        "speaker": "속상한 엄마",
                        "color": (79, 70, 229),
                        "box": (32, 36, 595, 192),
                        "tail": (380, 260),
                        "text": "키 크라고 매일 밤 우유도 챙겨주는데\n왜 6개월째 키가 그대로일까…",
                    },
                    {
                        "speaker": "배 아픈 서연",
                        "color": (234, 88, 12),
                        "box": (415, 865, 1044, 1025),
                        "tail": (280, 680),
                        "text": "엄마… 밤에 찬 우유 마시면\n배가 꾸르륵거려서 잠이 안 와요…",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep03_cut_02.png",
                "step": "2 / 4 (내분비학 팩트)",
                "bubbles": [
                    {
                        "speaker": "소아성장 팩트체크",
                        "color": (234, 88, 12),
                        "box": (32, 36, 595, 192),
                        "tail": (390, 280),
                        "text": "취침 직전 우유·야식은 성장호르몬 억제!\n밤 10시 공복 서파수면에서 70% 분비!",
                    },
                    {
                        "speaker": "엄마의 깨달음",
                        "color": (79, 70, 229),
                        "box": (385, 865, 1044, 1025),
                        "tail": (660, 440),
                        "text": "아하! 칼슘은 저녁 식사 때 두부·치즈·D3로\n챙기고 밤 10시엔 깊은 잠을 재워야겠네!",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep03_cut_03.png",
                "step": "3 / 4 (밤 9시 40분 루틴)",
                "bubbles": [
                    {
                        "speaker": "다정한 엄마",
                        "color": (79, 70, 229),
                        "box": (210, 26, 850, 176),
                        "tail": (605, 215),
                        "text": "불 끄기 전 5분 동안 무릎이랑 종아리\n성장판 쭉쭉 이완 마사지 해줄게~",
                    },
                    {
                        "speaker": "노곤노곤 서연",
                        "color": (5, 150, 105),
                        "box": (380, 865, 1044, 1025),
                        "tail": (380, 790),
                        "text": "다리도 시원하고 따뜻해서\n벌써 눈이 스르륵 감겨요 엄마…♥",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep03_cut_04.png",
                "step": "4 / 4 (숨은 키 도약)",
                "bubbles": [
                    {
                        "speaker": "아침 기지개 서연",
                        "color": (234, 88, 12),
                        "box": (32, 36, 595, 192),
                        "tail": (450, 380),
                        "text": "엄마!! 눈금 봐봐요!\n이번 달에 키가 1cm나 더 컸어요!!",
                    },
                    {
                        "speaker": "감동한 엄마",
                        "color": (5, 150, 105),
                        "box": (385, 865, 1044, 1025),
                        "tail": (760, 440),
                        "text": "밤 10시 꿀잠과 5분 스트레칭의 기적!\n우리 서연이 숨은 키 7cm까지 쑥쑥 크자!",
                    },
                ],
            },
        ],
        "insta_caption": """"키 크라고 매일 밤 자기 전에 우유 한 잔씩 꼭 먹였는데, 오히려 성장호르몬을 방해하고 있었다고?!" 😱
또래보다 작아 보이는 아이 볼 때마다 속상해서 밤마다 우유·간식 챙겨주셨던 엄빠들 계시죠?

저도 자기 전에 우유를 마셔야 밤새 뼈가 자라는 줄만 알았어요.
그런데 소아내분비학 논문을 찾아보고 완전히 반대로 하고 있었다는 걸 알았습니다.

📏 잠들기 직전 먹인 우유와 야식이 키 성장을 막는 진짜 이유,
1️⃣ 우유를 마시면 배가 꾸르륵거리는 아이(유당불내증)는 칼슘이 흡수되지 않고 깊은 잠만 깨웁니다.
2️⃣ 시카고대 반 카우터(Van Cauter) 교수의 수면 내분비 연구에 따르면, 하루 성장호르몬(GH)의 약 70%는 밤 10시~새벽 2시 '첫 깊은 서파수면(Slow-Wave Sleep)'에서 폭발하는데, 자기 전 음식물이 들어와 혈당과 인슐린이 높아지면 뇌하수체의 성장호르몬 스위치가 꺼져버립니다!

💡 오늘 밤부터 '자기 전 우유 한 잔' 대신 이렇게만 바꿔보세요:

1️⃣ 밤 우유 대신 [저녁 식사 때 두부·잔멸치·치즈 + 구연산칼슘·비타민D3·아연]
👉 뼈 재료는 저녁 식사 시간에 미리 채워주고, 잠들기 2시간 전부터는 편안한 공복 상태를 만들어주세요.

2️⃣ 밤 9시 40분 [침대 위 5분 무릎·종아리 성장판 이완 마사지]
👉 낮 동안 뛰어놀며 눌려 있던 하체 성장판 주변 근육을 따뜻하게 풀어주면 성장통도 예방되고 깊은 잠에 스르륵 빠져듭니다.

3️⃣ 밤 10시 정각 [스마트폰 끄고 암막 소등하기]
👉 멜라토닌이 켜져야 성장호르몬과 해마 장기기억 코팅이 동시에 시작됩니다.

질병관리청 성장도표 기준 우리 아이의 정확한 키·몸무게 백분위와
부모 유전 예상키(MPH) 대비 '숨은 키 +7cm 최대 잠재키'가 몇 cm인지 궁금하시다면?

📌 지금 프로필 상단 링크(@kids_fit1)에서
질병관리청 성장도표 & 소아성장 논문 2,723편 기반
[우리 아이 1:1 신체 성장 × 두뇌 발달 정밀 리포트]를 1분 만에 무료로 확인해 보세요! 💌

(오늘 밤 9시 40분 아이 다리 주물러주실 분들은 오른쪽 아래 [저장 🔖] 꾹 눌러두세요! ♥)

#아이키성장 #어린이키성장 #키크는습관 #성장호르몬 #밤10시수면 #어린이칼슘 #성장판스트레칭 #초등키성장 #육아툰 #인스타툰 #키즈핏""",
        "threads_post_1": """키 크라고 매일 밤 자기 직전에 우유나 과일 챙겨주시는 엄빠들 계신가요? 😭

저도 밤에 우유를 먹여야 자면서 키가 크는 줄 알았는데, 소아내분비학 논문을 보고 깜짝 놀랐습니다. 하루 성장호르몬의 70%가 밤 10시~새벽 2시 깊은 서파수면에서 나오는데, 자기 전 2시간 안에 우유나 야식이 들어가서 인슐린 수치가 올라가면 뇌에서 성장호르몬 분비 스위치를 꺼버린대요!

그 길로 밤 우유는 끊고 저녁 식사 때 두부·치즈·비타민D3를 챙겨준 뒤, 밤 9시 40분에 무릎·종아리 성장판 마사지 5분 해주고 10시에 재웠더니 이번 달에 드디어 키가 1cm 훌쩍 자랐습니다🥹""",
        "threads_reply_2": """오늘 밤엔 자기 전 간식 대신 따뜻한 손길로 아이 무릎이랑 종아리를 5분만 토닥여주자고요. 엄마 손길이 세상 최고의 성장호르몬 스위치니까요 ♥

💡 질병관리청 성장도표 기준 우리 아이 정확한 키 백분위랑 부모 유전키(MPH) 대비 최대 잠재키는 제가 참고한 무료 리포트에서 회원가입 없이 1분 만에 계산해 보실 수 있어요!
👉 https://kidsfit.co.kr""",
    },
    {
        "ep_num": 4,
        "folder_name": "4화_편식아이미각민감기아연_웹툰",
        "ep_badge": "키즈핏 영양툰 EP.04",
        "title": "4화: 고기·채소 입에도 안 대는 편식 아이 (미각 세포 아연 부족 & 푸드브릿지의 비밀)",
        "accent": (16, 185, 129),
        "summary_card_title": "입 짧은 편식 아이 '푸드브릿지 3단계'",
        "summary_card_sub": "오른쪽 아래 [저장 🔖] 눌러두고 이번 주말 식탁에서 바로 해보세요!",
        "summary_points": [
            ("'한 입만 더!' 식탁 위 강요 멈추기", "억지로 먹이면 뇌 편도체가 식사 시간을 공포로 기억해 미각 방어기제가 더 강해져요"),
            ("미각 세포를 깨우는 '아연(Zinc)·철분' 보충", "아연이 부족하면 혀의 미뢰 세포 재생이 늦어져 채소의 쓴맛을 3배 더 예민하게 느낍니다"),
            ("주말 10분 '공룡·별 모양 쿠키틀 요리 놀이'", "내가 직접 찍어낸 식재료는 경계심이 사라져 스스로 한 입 베어 무는 기적이 일어납니다"),
        ],
        "cuts": [
            {
                "raw": RAW_EP23_DIR / "ep04_cut_01.png",
                "step": "1 / 4 (식탁 전쟁)",
                "bubbles": [
                    {
                        "speaker": "지친 엄마",
                        "color": (79, 70, 229),
                        "box": (26, 26, 560, 178),
                        "tail": (380, 290),
                        "text": "시우야… 고기랑 브로콜리 딱 한 입만\n먹자, 벌써 한 시간째잖아…",
                    },
                    {
                        "speaker": "입 막은 시우",
                        "color": (234, 88, 12),
                        "box": (440, 200, 1044, 355),
                        "tail": (735, 480),
                        "text": "싫어요 안 먹어!! 초록색 채소랑\n고기는 입에 넣기 싫단 말이에요!",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep04_cut_02.png",
                "step": "2 / 4 (소아영양 팩트)",
                "bubbles": [
                    {
                        "speaker": "소아영양 팩트체크",
                        "color": (16, 185, 129),
                        "box": (430, 30, 1044, 184),
                        "tail": (730, 320),
                        "text": "아연·철분이 부족하면 혀 미각세포가\n둔해져 새로운 식감에 거부감 폭발!",
                    },
                    {
                        "speaker": "엄마의 깨달음",
                        "color": (79, 70, 229),
                        "box": (36, 865, 720, 1025),
                        "tail": (360, 440),
                        "text": "아하! 억지로 먹일 게 아니라 아연을 챙겨주고\n요리 놀이로 친해지게 해야겠구나!",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep04_cut_03.png",
                "step": "3 / 4 (푸드브릿지 놀이)",
                "bubbles": [
                    {
                        "speaker": "다정한 엄마",
                        "color": (79, 70, 229),
                        "box": (26, 26, 575, 178),
                        "tail": (380, 290),
                        "text": "우리 시우가 공룡 모양 틀로\n두부랑 고기 패티 직접 찍어볼까?",
                    },
                    {
                        "speaker": "꼬마 요리사 시우",
                        "color": (16, 185, 129),
                        "box": (450, 200, 1044, 355),
                        "tail": (735, 470),
                        "text": "우와! 내가 누르니까 티라노 공룡이\n나왔어요! 냄새도 고소해요!",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep04_cut_04.png",
                "step": "4 / 4 (스스로 꿀꺽!)",
                "bubbles": [
                    {
                        "speaker": "뿌듯한 시우",
                        "color": (234, 88, 12),
                        "box": (440, 200, 1044, 355),
                        "tail": (735, 470),
                        "text": "엄마 봐봐요! 내가 만든 공룡 고기\n한 입에 앙 먹었어요! 진짜 맛있다!",
                    },
                    {
                        "speaker": "감격한 엄마",
                        "color": (16, 185, 129),
                        "box": (26, 26, 585, 178),
                        "tail": (380, 290),
                        "text": "세상에… 억지로 먹일 땐 그렇게 울더니\n스스로 만든 건 두 개나 다 먹었네♥",
                    },
                ],
            },
        ],
        "insta_caption": """"고기랑 브로콜리 딱 한 입만 먹자… 벌써 밥상 앞에서 한 시간째잖아 😭"
입을 두 손으로 꽉 막고 고개 돌리는 아이와 매일 저녁 식탁 전쟁 치르시는 엄빠들 계시죠?

저도 처음엔 아이 식습관이 나빠질까 봐 "이거 안 먹으면 키 안 큰다!" 하며 억지로 한 숟가락씩 떠먹였어요.
그런데 소아 임상영양학 논문을 찾아보고 제가 오히려 편식을 더 심하게 만들고 있었다는 걸 깨달았습니다.

🥦 입 짧은 아이가 유독 고기·채소를 거부하는 진짜 이유,
단순한 투정이 아니라 혀의 미각 세포(미뢰) 재생을 돕는 [아연(Zinc)과 철분 부족] + 낯선 식감을 독소로 경계하는 유아기 본능적인 [미각 방어기제(Food Neophobia)] 때문이었어요!

콜로라도대 햄비지(Hambidge) 교수의 소아 아연 결핍 연구에 따르면, 체내 아연이 부족한 아이는 혀의 미각 수용체 교체가 늦어져 음식 본연의 감칠맛은 못 느끼고 채소의 쓴맛과 고기의 질긴 식감만 과도하게 예민하게 느낀다고 합니다.

💡 오늘 저녁부터 '억지로 한 입 먹이기' 대신 이렇게만 바꿔보세요:

1️⃣ 식탁 위 강요 대신 [체중 비례 아연·철분·비타민D3로 미각 세포 깨우기]
👉 아연이 채워지면 미각 세포와 식욕 중추가 정상화되어 "배고파요!" 소리가 먼저 나옵니다.

2️⃣ 숟가락 추격전 대신 [공룡·별 모양 쿠키틀로 직접 찍어보는 푸드브릿지]
👉 식재료를 눈으로 보고 손으로 만져보며 내가 직접 모양을 낸 음식에는 뇌의 경계심이 눈 녹듯 사라집니다.

3️⃣ 다진 채소·두부·소고기를 섞은 [한 입 쏙 공룡 스테이크]
👉 "내가 만든 공룡 한 입 먹어볼까?" 하면 입 막던 아이도 스스로 포크를 들고 베어 뭅니다.

우리 아이가 지금 또래 대비 키·몸무게 백분위는 몇 %인지,
현재 체중(kg)에 딱 맞는 일일 칼슘·아연·비타민D3 섭취량은 얼마인지 궁금하시다면?

📌 지금 프로필 상단 링크(@kids_fit1)에서
질병관리청 성장도표 & 소아영양 논문 2,723편 기반
[우리 아이 1:1 신체 성장 × 맞춤 영양 처방 리포트]를 1분 만에 무료로 확인해 보세요! 💌

(이번 주말 아이와 공룡 쿠키틀 요리 해보실 분들은 오른쪽 아래 [저장 🔖] 꾹 눌러두세요! ♥)

#편식아이 #아기편식 #유아식단 #푸드브릿지 #어린이아연 #입짧은아이 #아이키성장 #육아툰 #인스타툰 #엄마표요리 #육아공감 #키즈핏""",
        "threads_post_1": """밥 한 숟가락 먹이는 데 1시간씩 걸리고, 고기나 브로콜리만 보이면 두 손으로 입부터 꽉 막는 아이 보면서 한숨 쉬어본 엄빠들 계시죠? 😭

저도 억지로라도 한 입 먹여야 키가 클 것 같아서 매일 식탁 전쟁을 치렀는데, 소아 임상영양학 논문을 보고 머리를 한 대 맞은 기분이었습니다. 아이가 밥을 거부하는 건 투정이 아니라, 혀의 미각 세포를 재생시키는 [아연(Zinc)]이 부족해서 쓴맛과 낯선 식감에 예민해진 상태래요!

억지로 떠먹이는 걸 멈추고 아연을 챙겨주면서 주말에 두부·다진고기·파프리카를 '공룡 모양 쿠키틀'로 같이 찍어봤더니, 세상에… 자기가 만든 공룡이라며 한 입에 앙 베어 무는데 눈물 날 뻔했습니다🥹""",
        "threads_reply_2": """오늘 저녁도 밥그릇 들고 아이 뒤쫓아 다니느라 고생하신 모든 엄빠들, "한 입만 더!" 대신 아이 손에 귀여운 모양틀 하나 쥐여주며 즐거운 식탁부터 만들어보자고요 ♥

💡 우리 아이 정확한 키·체중 백분위랑 현재 몸무게(kg)에 딱 맞는 일일 칼슘·아연·비타민D3 권장량은 제가 참고한 무료 리포트에서 회원가입 없이 1분 만에 확인하실 수 있어요!
👉 https://kidsfit.co.kr""",
    },
    {
        "ep_num": 5,
        "folder_name": "5화_거북목자세교정숨은키2cm_웹툰",
        "ep_badge": "키즈핏 자세툰 EP.05",
        "title": "5화: 구부정한 거북목·말린 어깨 펴고 '숨은 키 2cm & 집중력' 동시에 찾은 비결",
        "accent": (79, 70, 229),
        "summary_card_title": "숨은 키 2cm & 집중력 깨우는 자세 3원칙",
        "summary_card_sub": "오른쪽 아래 [저장 🔖] 눌러두고 오늘 아이 책상부터 점검해 보세요!",
        "summary_points": [
            ("'허리 펴!' 잔소리 대신 '각도조절 원목 독서대'", "책 각도를 30~45도만 세워줘도 고개가 저절로 들려 목 디스크 하중이 70% 줄어들어요"),
            ("하루 2번 '문틀 철봉 10초 데드행(매달리기)'", "낮 동안 중력에 눌린 척추 추간판(디스크) 사이 공간을 넓혀 숨은 키 2cm를 깨웁니다"),
            ("35분 집중 후 '5분 가슴 활짝 신전 스트레칭'", "말린 어깨가 펴지면 뇌로 가는 산소 공급량이 늘어나 학습 집중력이 2배 살아납니다"),
        ],
        "cuts": [
            {
                "raw": RAW_EP23_DIR / "ep05_cut_01.png",
                "step": "1 / 4 (거북목 걱정)",
                "bubbles": [
                    {
                        "speaker": "걱정스러운 엄마",
                        "color": (79, 70, 229),
                        "box": (30, 26, 600, 176),
                        "tail": (365, 220),
                        "text": "하은아, 목이 책 속으로 들어가겠어…\n어깨도 둥글게 말려서 키까지 작아 보여…",
                    },
                    {
                        "speaker": "초등 3학년 하은",
                        "color": (234, 88, 12),
                        "box": (380, 865, 1044, 1025),
                        "tail": (520, 720),
                        "text": "똑바로 앉으려고 해도 10분만 지나면\n목이랑 등이 뻐근해서 숙여져요 ㅠㅠ",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep05_cut_02.png",
                "step": "2 / 4 (생체역학 팩트)",
                "bubbles": [
                    {
                        "speaker": "척추생체역학 팩트",
                        "color": (79, 70, 229),
                        "box": (30, 26, 620, 176),
                        "tail": (420, 240),
                        "text": "고개가 30도 숙여지면 목 하중 18kg!\n숨은 키 2cm와 뇌 산소 공급까지 차단!",
                    },
                    {
                        "speaker": "엄마의 깨달음",
                        "color": (13, 148, 136),
                        "box": (380, 865, 1044, 1025),
                        "tail": (540, 500),
                        "text": "아하! 허리 펴라고 잔소리할 게 아니라\n독서대 각도와 철봉 감압이 먼저였구나!",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep05_cut_03.png",
                "step": "3 / 4 (독서대 & 데드행)",
                "bubbles": [
                    {
                        "speaker": "편안해진 하은",
                        "color": (13, 148, 136),
                        "box": (26, 26, 560, 176),
                        "tail": (360, 390),
                        "text": "우와! 독서대에 책을 세우니까\n고개 안 숙여도 글씨가 잘 보여요!",
                    },
                    {
                        "speaker": "응원하는 엄마",
                        "color": (79, 70, 229),
                        "box": (390, 865, 1044, 1025),
                        "tail": (730, 550),
                        "text": "쉬는 시간엔 철봉 10초 매달리기!\n척추 디스크가 쭉 펴지는 소리가 들리네~",
                    },
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep05_cut_04.png",
                "step": "4 / 4 (숨은 키 +2cm)",
                "bubbles": [
                    {
                        "speaker": "반듯해진 하은",
                        "color": (234, 88, 12),
                        "box": (420, 26, 1044, 176),
                        "tail": (550, 340),
                        "text": "엄마! 어깨 펴고 서니까 친구들이\n갑자기 키 엄청 커 보인대요!!",
                    },
                    {
                        "speaker": "뿌듯한 엄마",
                        "color": (79, 70, 229),
                        "box": (36, 865, 690, 1025),
                        "tail": (380, 340),
                        "text": "구부정한 자세에 숨어 있던 2cm도 찾고\n공부 집중력까지 살아났네 우리 딸 최고♥",
                    },
                ],
            },
        ],
        "insta_caption": """"허리 좀 펴고 앉아! 목이 책 속으로 들어가겠어!!" 😭
책상에 앉은 지 10분도 안 돼서 등이 동그랗게 말리고 고개가 푹 숙여지는 아이 보며 속상하셨던 적 있으시죠?

저도 처음엔 아이 의지가 약해서 자세가 자꾸 흐트러지는 줄 알았어요.
그런데 척추 생체역학(Biomechanics) 논문을 보고 잔소리로 해결될 문제가 아니라는 걸 깨달았습니다.

📏 구부정한 거북목과 라운드숄더가 아이의 키와 성적을 동시에 깎아먹는 이유,
척추 생체역학 연구(Hansraj, 2014)에 따르면, 아이 고개가 평평한 책상 위 책을 보려고 30~45도 숙여지는 순간 목뼈와 척추에 무려 18~22kg의 압축 하중이 가해집니다!
이로 인해 척추 추간판(디스크)이 눌려 [숨은 키 1.5~2.5cm]가 손실될 뿐 아니라, 경동맥과 흉곽이 압박되어 뇌로 가는 산소량이 줄어들면서 15분 만에 집중력이 바닥나는 거였어요.

💡 오늘부터 "허리 펴!" 잔소리 대신 책상 환경을 이렇게만 바꿔보세요:

1️⃣ 평평한 책상 위 책 대신 [35도 각도조절 원목 독서대 세워주기]
👉 시선이 자연스럽게 정면을 향하게 되어 아이가 애쓰지 않아도 등허리가 반듯하게 펴집니다.

2️⃣ 아침 기상 직후 & 공부 쉬는 시간 [문틀 철봉 10초 데드행(매달리기)]
👉 중력에 눌려 있던 척추 추간판 사이 공간을 자연 견인(Decompression)하여 숨은 키 2cm와 성장판 공간을 열어줍니다.

3️⃣ 35분 집중 후 [양팔 벌려 가슴 활짝 펴기 5회]
👉 말린 어깨가 펴지면서 뇌 혈류량과 전두엽 집중 지속력이 2배 이상 살아납니다.

우리 아이에게 숨어 있는 자세 손실 키는 몇 cm인지,
신체 성장 백분위와 학습 집중력 솔루션을 한 번에 확인하고 싶으시다면?

📌 지금 프로필 상단 링크(@kids_fit1)에서
질병관리청 성장도표 & 생체역학·두뇌 논문 2,723편 기반
[우리 아이 1:1 신체 성장 × 두뇌 학습 마스터 리포트]를 1분 만에 무료로 확인해 보세요! 💌

(오늘 저녁 아이 책상 자세 점검해 주실 분들은 오른쪽 아래 [저장 🔖] 꾹 눌러두세요! ♥)

#거북목교정 #아이바른자세 #초등책상 #독서대추천 #실내철봉 #숨은키찾기 #아이키성장 #초등집중력 #육아툰 #인스타툰 #초등맘 #키즈핏""",
        "threads_post_1": """책상에 앉은 지 10분만 지나면 목이 책 속으로 빨려 들어갈 듯 숙여지고 등이 동그랗게 말리는 아이 보면서 "허리 좀 펴!!" 소리 질러본 엄빠들 계시죠? 😭

저도 애가 습관이 나쁜 줄만 알았는데, 척추 생체역학 데이터를 보고 완전히 반성했습니다. 평평한 책상 위 책을 보려고 고개를 30도만 숙여도 목뼈에 18kg 하중이 실리면서 척추가 눌려 [숨은 키 2cm]가 사라지고 뇌 산소 공급까지 줄어든대요!

잔소리 대신 책상에 '각도조절 원목 독서대' 하나 세워주고 쉬는 시간마다 문틀 철봉에 10초씩 매달리게 해줬더니, 세상에… 구부정하던 어깨가 반듯하게 펴지면서 숨은 키가 2cm나 훌쩍 커 보이더라고요🥹""",
        "threads_reply_2": """오늘도 아이 등 두드리며 "어깨 펴야 키 큰다~" 외치신 모든 엄빠들, 잔소리 대신 책 각도만 35도 세워줘도 아이 목이랑 허리가 거짓말처럼 편안해지니 오늘 저녁 바로 세워주자고요 ♥

💡 우리 아이 자세·수면·영양 습관에 따른 3단 예상키랑 두뇌 학습 집중력 점수는 제가 참고한 무료 리포트에서 회원가입 없이 1분 만에 확인하실 수 있어요!
👉 https://kidsfit.co.kr""",
    },
]


CARDNEWS_SERIES = [
    {
        "series_num": 1,
        "folder_name": "1탄_만3세고집과소근육발달_카드뉴스",
        "series_badge": "키즈핏 발달 카드뉴스 #01",
        "title": "1탄: 만 3세 '내가 혼자 할 거야!' 고집과 손끝 소근육의 비밀 (6장)",
        "palette": {
            "header_bg": (30, 27, 75),
            "accent": (79, 70, 229),
            "neon_badge": (52, 211, 153),
            "highlight_bar": (250, 204, 21),
            "sub_color": (167, 243, 208),
            "row_even": (243, 245, 255),
            "row_odd": (255, 255, 255),
            "point_hl": (254, 240, 138),
        },
        "slides": [
            {
                "raw": RAW_EP1_DIR / "cut_01.jpg",
                "t1": "“내가 혼자 할 거야!”",
                "t2": "만 3세 고집의 진짜 이유",
                "sub": "혼내기 전에 꼭 알아야 할 두뇌 발달의 비밀",
                "tag": "핵심 팩트체크 01",
                "pts": [
                    "① 반항이 아닌 ‘손끝 소근육 민감기’",
                    "② 비싼 교구 대신 ‘거실 0원 놀이’",
                    "③ 낮의 몰입이 ‘밤 10시 키성장’ 연결",
                ],
            },
            {
                "raw": RAW_EP1_DIR / "cut_02.jpg",
                "t1": "손가락은 ‘제2의 뇌’",
                "t2": "뇌 운동피질 30%와 직결!",
                "sub": "만 24~47개월에 찾아오는 결정적 손끝 성장기",
                "tag": "뇌과학 근거 02",
                "pts": [
                    "① 대뇌 운동피질 30%가 손끝에 집중",
                    "② 엄지·검지·중지 세 손가락 협응 완성",
                    "③ 스스로 해보는 과정이 전두엽을 자극",
                ],
            },
            {
                "raw": RAW_EP1_DIR / "cut_03.jpg",
                "t1": "만 3세에 비싼 가베?",
                "t2": "시기 안 맞으면 100% 방치템!",
                "sub": "내 아이 개월 수에 맞는 교구 순서가 핵심",
                "tag": "교구 선택 공식 03",
                "pts": [
                    "① 만 2~4세: 손끝 힘 기르는 일상교구",
                    "② 만 5~7세: 입체 공간지각 은물·가베",
                    "③ 손끝 악력이 먼저 잡혀야 흥미 지속",
                ],
            },
            {
                "raw": RAW_EP1_DIR / "cut_04.jpg",
                "t1": "장난감 사기 전 시작하는",
                "t2": "우리 집 ‘0원 소근육 놀이’",
                "sub": "오늘 저녁 주방 서랍 소품으로 하루 15분!",
                "tag": "오늘 저녁 실천 04",
                "pts": [
                    "① 나무 빨래집게 찍기 (손끝 악력 강화)",
                    "② 물티슈 캡에 병뚜껑 넣기 (눈손 협응)",
                    "③ 다 쓴 휴지심 가위 오리기 (성취감)",
                ],
            },
            {
                "raw": RAW_EP1_DIR / "cut_05.jpg",
                "t1": "낮에 손끝을 쓴 아이가",
                "t2": "밤 10시 숨은 키도 쑥!",
                "sub": "깊은 숙면과 자연식 영양의 키 성장 시너지",
                "tag": "성장×발달 시너지 05",
                "pts": [
                    "① 밤 10시~2시 성장호르몬 65% 분비",
                    "② 우유 배앓이엔 잔멸치·두부·치즈 대체",
                    "③ 거북목 예방 & 하루 10분 점프 스트레칭",
                ],
            },
            {
                "raw": RAW_EP1_DIR / "cut_06.jpg",
                "t1": "아이의 속도를 읽어주는",
                "t2": "다정한 엄마면 충분해요",
                "sub": "우리 아이 성장·발달·주말 나들이 1분 무료 진단",
                "tag": "키즈핏 무료 진단 06",
                "pts": [
                    "① 우리 아이 키·몸무게 백분위 & 예상키",
                    "② 월령별 6각 발달 밸런스 & 0원 놀이",
                    "③ 내 지역 × 관심사 주말 미술관 코스",
                ],
            },
        ],
        "caption": """📌 [저장 필수 카드뉴스 #1] "내가 혼자 할 거야!" 만 3세 고집의 진짜 이유 6장 요약!
손가락은 대뇌 운동피질의 30%와 연결된 '제2의 뇌'입니다.
비싼 교구를 사기 전에 오늘 저녁 주방 나무 집게와 안전가위로 아이의 손끝 자존감을 키워주세요 🌱
👉 우리 아이 개월 수별 정밀 발달 & 키 백분위 1분 무료 진단: https://truthofmarket.com""",
    },
    {
        "series_num": 2,
        "folder_name": "2탄_초등문장제수학과백지복습_카드뉴스",
        "series_badge": "키즈핏 학습 카드뉴스 #02",
        "title": "2탄: 연산은 100점인데 문장제 수학만 별표 치는 아이 솔루션 (4장)",
        "palette": {
            "header_bg": (6, 78, 59),
            "accent": (13, 148, 136),
            "neon_badge": (250, 204, 21),
            "highlight_bar": (110, 231, 183),
            "sub_color": (254, 240, 138),
            "row_even": (240, 253, 250),
            "row_odd": (255, 255, 255),
            "point_hl": (254, 240, 138),
        },
        "slides": [
            {
                "raw": RAW_EP23_DIR / "ep02_cut_01.png",
                "t1": "단순 연산은 100점인데",
                "t2": "문장제 수학만 별표 친다면?",
                "sub": "국어 어휘력보다 먼저 점검해야 할 뇌과학 원인",
                "tag": "학습 병목 진단 01",
                "pts": [
                    "① 세 줄만 넘어가면 앞의 숫자를 망각",
                    "② 문제 읽기도 전에 별표(★)부터 표시",
                    "③ 숫자만 보고 더할지 뺄지 찍어서 풀이",
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep02_cut_02.png",
                "t1": "진짜 원인은 국어가 아닌",
                "t2": "‘전두엽 작업기억 과부하’",
                "sub": "머릿속 작은 칠판에 너무 많은 정보를 띄운 상태",
                "tag": "인지뇌과학 팩트 02",
                "pts": [
                    "① 초등 아동의 작업기억은 2~3개가 한계",
                    "② 눈으로만 읽고 암산하면 용량 초과 발생",
                    "③ 종이 여백을 ‘두 번째 칠판’으로 써야 해결",
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep02_cut_03.png",
                "t1": "오늘 저녁 바로 적용하는",
                "t2": "문장제 3단계 도해 풀이법",
                "sub": "암산을 멈추고 손으로 조건을 시각화하세요!",
                "tag": "실전 코칭 공식 03",
                "pts": [
                    "① 구하는 것에 동그라미·조건에 밑줄 긋기",
                    "② 식 쓰기 전 여백에 막대·상자 그림 그리기",
                    "③ 그림을 보며 단계별로 차근차근 식 세우기",
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep02_cut_04.png",
                "t1": "열 문제 기계적 풀이보다",
                "t2": "‘30초 말로 설명하기’의 힘",
                "sub": "메타인지와 장기기억을 2배 높이는 백지 인출",
                "tag": "상위 1% 공부법 04",
                "pts": [
                    "① 푼 문제를 부모님께 30초 동안 설명하기",
                    "② 수업 직후 ‘핵심 키워드 3줄 백지복습’",
                    "③ 밤 10시 숙면으로 해마 장기기억 코팅!",
                ],
            },
        ],
        "caption": """📌 [저장 필수 카드뉴스 #2] 연산은 100점인데 문장제 수학만 별표 치는 아이 3단계 해결법!
머릿속 암산을 멈추고 종이 여백에 '막대 그림'을 그리는 순간 전두엽 작업기억의 부담이 절반으로 줄어듭니다 🧠
👉 우리 아이 5대 학습 역량 지수(LQ) & 맞춤 공부법 1분 무료 진단: https://truthofmarket.com""",
    },
    {
        "series_num": 3,
        "folder_name": "3탄_밤10시숙면과숨은키7cm_카드뉴스",
        "series_badge": "키즈핏 성장 카드뉴스 #03",
        "title": "3탄: 부모 유전키 넘어 숨은 키 +7cm 깨우는 밤 10시 루틴 (4장)",
        "palette": {
            "header_bg": (67, 20, 7),
            "accent": (234, 88, 12),
            "neon_badge": (251, 191, 36),
            "highlight_bar": (253, 224, 71),
            "sub_color": (254, 215, 170),
            "row_even": (255, 247, 237),
            "row_odd": (255, 255, 255),
            "point_hl": (254, 240, 138),
        },
        "slides": [
            {
                "raw": RAW_EP23_DIR / "ep03_cut_01.png",
                "t1": "밤마다 우유 챙겨줬는데",
                "t2": "왜 또래보다 키가 작을까?",
                "sub": "많은 부모님이 놓치는 밤 우유와 야식의 함정",
                "tag": "성장 방해 요인 01",
                "pts": [
                    "① 유당불내증 배앓이는 칼슘 흡수를 방해",
                    "② 취침 직전 우유·과일은 인슐린 수치 상승",
                    "③ 고인슐린 상태가 성장호르몬 분비 억제!",
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep03_cut_02.png",
                "t1": "하루 성장호르몬 70% 폭발!",
                "t2": "‘밤 10시 공복 서파수면’",
                "sub": "잠든 뒤 첫 90~120분 깊은 잠이 최종 키를 결정",
                "tag": "내분비학 골든타임 02",
                "pts": [
                    "① 밤 10시~새벽 2시 서파수면(SWS) 피크",
                    "② 저녁 식사는 잠들기 2~3시간 전에 완료",
                    "③ 우유 대신 두부·멸치·치즈 + 칼슘·D3·아연",
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep03_cut_03.png",
                "t1": "잠들기 전 딱 5분 투자!",
                "t2": "하체 성장판 이완 스트레칭",
                "sub": "낮 동안 눌린 척추 디스크와 무릎 성장판 깨우기",
                "tag": "운동 4단계 처방 03",
                "pts": [
                    "① 아침 기상 직후 3분 철봉 매달리기 감압",
                    "② 저녁 줄넘기·트램폴린 15분 압전 자극",
                    "③ 취침 전 무릎·햄스트링·골반 브릿지 이완",
                ],
            },
            {
                "raw": RAW_EP23_DIR / "ep03_cut_04.png",
                "t1": "부모 유전 예상키(MPH) 넘어",
                "t2": "우리 아이 숨은 키 +7cm 도약!",
                "sub": "질병관리청 성장도표 기준 1분 무료 진단 리포트",
                "tag": "키즈핏 무료 진단 04",
                "pts": [
                    "① 정확한 생년월일 기준 키·체중 백분위",
                    "② 방치 시 예상키 vs 관리 시 최대 잠재키",
                    "③ 체중 비례 일일 칼슘·비타민D3·아연 처방",
                ],
            },
        ],
        "caption": """📌 [저장 필수 카드뉴스 #3] 부모 유전키 넘어 숨은 키 +7cm 깨우는 밤 10시 골든타임 루틴!
취침 2시간 전 공복 유지 + 밤 9시 40분 하체 성장판 5분 스트레칭 + 밤 10시 정각 암막 소등으로 성장호르몬을 깨워주세요 📏
👉 우리 아이 키 백분위 & 3단 예상키 1분 무료 진단: https://truthofmarket.com""",
    },
]


import zipfile


def build_grid_2x2(cuts_4: list) -> Image.Image:
    grid = Image.new("RGB", (2160, 2160), (255, 255, 255))
    positions = [(0, 0), (1080, 0), (0, 1080), (1080, 1080)]
    for img, (px, py) in zip(cuts_4[:4], positions):
        grid.paste(img, (px, py))
    # crisp divider lines
    draw = ImageDraw.Draw(grid)
    draw.line([(1080, 0), (1080, 2160)], fill=(255, 255, 255), width=8)
    draw.line([(0, 1080), (2160, 1080)], fill=(255, 255, 255), width=8)
    return grid.resize((1080, 1080), Image.Resampling.LANCZOS)


def build_vertical_strip(cuts: list) -> Image.Image:
    gap = 24
    total_h = len(cuts) * 1080 + (len(cuts) - 1) * gap
    strip = Image.new("RGB", (1080, total_h), (255, 253, 249))
    for i, img in enumerate(cuts):
        strip.paste(img, (0, i * (1080 + gap)))
    return strip


def generate_all_webtoons_and_cardnews():
    ensure_ep1_raw_files()
    WEBTOON_ROOT_KO.mkdir(parents=True, exist_ok=True)
    WEBTOON_SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    CARDNEWS_ROOT_KO.mkdir(parents=True, exist_ok=True)
    CARDNEWS_SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Render All 3 Webtoon Episodes into Dedicated Folders + Per-Episode ZIPs
    for ep in WEBTOON_EPISODES:
        ep_num = ep["ep_num"]
        folder_name = ep["folder_name"]

        for base_dir in [WEBTOON_ROOT_KO, WEBTOON_SAMPLE_DIR]:
            f_dir = base_dir / folder_name
            f_dir.mkdir(parents=True, exist_ok=True)

            rendered_cuts = []
            for idx, cut_cfg in enumerate(ep["cuts"], start=1):
                c_img = render_webtoon_cut(
                    raw_path=cut_cfg["raw"],
                    ep_badge=ep["ep_badge"],
                    step_badge=cut_cfg["step"],
                    bubbles=cut_cfg["bubbles"],
                    accent_color=ep["accent"],
                )
                c_img.save(f_dir / f"0{idx}_{idx}컷.png", "PNG")
                rendered_cuts.append(c_img)

            # Save 5th Instagram Carousel Summary Card
            summary_card = render_insta_5th_summary_card(ep)
            summary_card.save(f_dir / "05_5컷_핵심요약저장카드.png", "PNG")

            # Save 4-cut 2x2 grid summary image (for Threads 1-image post)
            grid_img = build_grid_2x2(rendered_cuts)
            grid_img.save(f_dir / "00_전체_4컷_한눈에보기_합본.png", "PNG")

            # Save 4-cut vertical scroll strip (for Naver Blog / Cafe)
            vstrip_img = build_vertical_strip(rendered_cuts)
            vstrip_img.save(f_dir / "00_전체_4컷_세로연속보기_스크롤합본.png", "PNG")

            threads_p1 = ep.get("threads_post_1", "")
            threads_r2 = ep.get("threads_reply_2", "")
            threads_combined = (
                f"【쓰레드 1번째 본문 (00_전체_4컷_한눈에보기_합본.png 1장과 함께 그대로 붙여넣기)】\n"
                f"{threads_p1}\n\n"
                f"──────────────────────────────────\n"
                f"【쓰레드 2번째 이어쓰기 답글 (내 글 바로 아래 댓글로 그대로 붙여넣기)】\n"
                f"{threads_r2}"
            )
            ep["threads_post"] = threads_combined

            # Save Instagram & Threads copy-ready text files inside the episode folder
            combined_txt = (
                f"==================================================\n"
                f"[{ep['title']}]\n"
                f"==================================================\n\n"
                f"【1. 인스타그램 피드 본문 & 해시태그 (@kids_fit1 캐러셀 1~5컷 업로드용)】\n"
                f"--------------------------------------------------\n"
                f"{ep['insta_caption']}\n\n"
                f"==================================================\n\n"
                f"【2. 쓰레드(Threads) 본문 & 이어쓰기 답글 (@kids_fit1 4컷 합본 업로드용)】\n"
                f"--------------------------------------------------\n"
                f"{threads_combined}\n"
            )
            (f_dir / "05_인스타그램_본문_해시태그.txt").write_text(ep["insta_caption"] + "\n", encoding="utf-8")
            (f_dir / "06_쓰레드_1번째본문_4컷합본용.txt").write_text(threads_p1 + "\n", encoding="utf-8")
            (f_dir / "07_쓰레드_2번째이어쓰기_링크댓글용.txt").write_text(threads_r2 + "\n", encoding="utf-8")
            (f_dir / "08_인스타_쓰레드_통합본.txt").write_text(combined_txt, encoding="utf-8")
            (f_dir / "인스타그램_본문_해시태그.txt").write_text(ep["insta_caption"] + "\n", encoding="utf-8")
            (f_dir / "쓰레드_공감질문_본문_대댓글.txt").write_text(threads_combined + "\n", encoding="utf-8")

            # Create per-episode ZIP archive both inside base_dir and inside the episode folder
            zip_path = base_dir / f"{folder_name}_전체파일.zip"
            try:
                with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                    for file_p in sorted(f_dir.glob("*")):
                        if file_p.is_file() and not file_p.name.endswith(".zip"):
                            zf.write(file_p, arcname=f"{folder_name}/{file_p.name}")
            except OSError:
                pass

        print(f"✅ 웹툰 {ep_num}화 렌더링·폴더 저장 및 화별 ZIP 생성 완료 -> {folder_name}")

    # 2. Render All 3 Cardnews Series into Dedicated Folders (and update samples/3_cardnews_sample/)
    sample3_dir = ROOT_DIR / "samples" / "3_cardnews_sample"
    sample3_dir.mkdir(parents=True, exist_ok=True)

    for sr in CARDNEWS_SERIES:
        sr_num = sr["series_num"]
        folder_name = sr["folder_name"]

        for base_dir in [CARDNEWS_ROOT_KO, CARDNEWS_SAMPLE_DIR]:
            f_dir = base_dir / folder_name
            f_dir.mkdir(parents=True, exist_ok=True)

            for idx, sl in enumerate(sr["slides"], start=1):
                s_img = render_sensuous_cardnews_slide(
                    raw_path=sl["raw"],
                    series_badge=sr["series_badge"],
                    slide_num_str=f"{idx:02d} / {len(sr['slides']):02d}",
                    title_line1=sl["t1"],
                    title_line2_highlight=sl["t2"],
                    subtitle_1line=sl["sub"],
                    floating_tag=sl["tag"],
                    points_3=sl["pts"],
                    theme_palette=sr["palette"],
                )
                s_img.save(f_dir / f"0{idx}_카드뉴스_{idx}장.png", "PNG")
                if sr_num == 1 and base_dir == CARDNEWS_SAMPLE_DIR:
                    s_img.save(sample3_dir / f"cardnews_0{idx}.png", "PNG")

            (f_dir / "인스타그램_블로그_동시업로드_본문.txt").write_text(sr["caption"] + "\n", encoding="utf-8")

            zip_path = base_dir / f"{folder_name}_전체파일.zip"
            try:
                with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                    for file_p in sorted(f_dir.glob("*")):
                        if file_p.is_file() and not file_p.name.endswith(".zip"):
                            zf.write(file_p, arcname=f"{folder_name}/{file_p.name}")
            except OSError:
                pass

        print(f"✅ 카드뉴스 {sr_num}탄 렌더링·폴더 저장 및 탄별 ZIP 생성 완료 -> {folder_name}")

    # 3. Generate Web Hub for Webtoons & Cardnews (samples/8_insta_threads_webtoon_pack/index.html)
    generate_webtoon_cardnews_web_hub()


def generate_webtoon_cardnews_web_hub():
    ep1 = WEBTOON_EPISODES[0]
    ep2 = WEBTOON_EPISODES[1]
    ep3 = WEBTOON_EPISODES[2]
    web_html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>키즈핏 @gangjidol 감성 4컷 웹툰(1~3화) & 여백 없는 카드뉴스(1~3탄) 화별 저장 센터</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <style>
    :root {{ --bg: #0F172A; --card: #1E293B; --accent: #6366F1; --mint: #10B981; --yellow: #FACC15; --text: #F8FAFC; }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Pretendard', sans-serif; background: var(--bg); color: var(--text); padding: 24px 14px 90px; line-height: 1.6; }}
    .container {{ max-width: 980px; margin: 0 auto; }}
    .hero {{ background: linear-gradient(135deg, #4F46E5 0%, #EC4899 100%); padding: 28px 22px; border-radius: 22px; margin-bottom: 24px; }}
    .hero h1 {{ font-size: 1.45rem; font-weight: 800; margin-bottom: 8px; }}
    .section-title {{ font-size: 1.25rem; font-weight: 800; margin: 28px 0 14px; color: var(--yellow); }}
    .card {{ background: var(--card); border: 1px solid #334155; border-radius: 20px; padding: 20px; margin-bottom: 22px; }}
    .card h3 {{ font-size: 1.15rem; font-weight: 800; margin-bottom: 12px; color: #fff; }}
    .grid-4 {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 14px; }}
    .grid-4 img {{ width: 100%; border-radius: 12px; border: 1px solid #475569; }}
    pre {{ background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 14px; font-family: inherit; font-size: 0.9rem; white-space: pre-wrap; color: #E2E8F0; margin-bottom: 12px; }}
    .btn-row {{ display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }}
    .btn {{ display: inline-block; background: var(--mint); color: #0F172A; font-weight: 800; padding: 10px 16px; border-radius: 10px; border: none; cursor: pointer; font-size: 0.9rem; text-decoration: none; }}
    .btn-sub {{ background: #334155; color: #F8FAFC; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>🎨 키즈핏 @gangjidol 감성 4컷 웹툰 (1~3화 화별 저장) &amp; 카드뉴스 (1~3탄) 센터</h1>
      <p>각 화별로 폴더 정리 및 원클릭 ZIP·컷별 저장, 인스타·쓰레드 본문 복사가 가능합니다.</p>
    </div>

    <h2 class="section-title">💬 1. 인스타·쓰레드 동시 업로드용 4컷 공감 웹툰 (1화 · 2화 · 3화 화별 저장)</h2>
    <div class="card">
      <h3>🌱 1화: 만 3세 '내가 혼자 할 거야!' 고집의 진짜 이유 (손끝 소근육 민감기)</h3>
      <div class="btn-row">
        <a class="btn" href="./1화_만3세소근육민감기_웹툰_전체파일.zip" download>📦 1화 전체 파일(4컷+합본+본문TXT) ZIP 다운로드</a>
        <a class="btn btn-sub" href="./1화_만3세소근육민감기_웹툰/00_전체_4컷_한눈에보기_합본.png" download>🖼️ 1화 4컷 바둑판 합본 저장</a>
        <a class="btn btn-sub" href="./1화_만3세소근육민감기_웹툰/00_전체_4컷_세로연속보기_스크롤합본.png" download>📜 1화 블로그용 세로 스크롤 합본 저장</a>
      </div>
      <div class="grid-4">
        <a href="./1화_만3세소근육민감기_웹툰/01_1컷.png" download><img src="./1화_만3세소근육민감기_웹툰/01_1컷.png" alt="1화 1컷" /></a>
        <a href="./1화_만3세소근육민감기_웹툰/02_2컷.png" download><img src="./1화_만3세소근육민감기_웹툰/02_2컷.png" alt="1화 2컷" /></a>
        <a href="./1화_만3세소근육민감기_웹툰/03_3컷.png" download><img src="./1화_만3세소근육민감기_웹툰/03_3컷.png" alt="1화 3컷" /></a>
        <a href="./1화_만3세소근육민감기_웹툰/04_4컷.png" download><img src="./1화_만3세소근육민감기_웹툰/04_4컷.png" alt="1화 4컷" /></a>
      </div>
      <pre id="ep1-txt">{ep1['insta_caption']}

{ep1['threads_post']}</pre>
      <button class="btn" onclick="navigator.clipboard.writeText(document.getElementById('ep1-txt').innerText).then(()=>alert('1화 본문이 복사되었습니다!'))">📋 1화 인스타·쓰레드 본문 복사하기</button>
    </div>

    <div class="card">
      <h3>🧠 2화: 연산은 100점인데 문장제 수학만 별표 치는 아이 (전두엽 작업기억의 비밀)</h3>
      <div class="btn-row">
        <a class="btn" href="./2화_초등문장제수학작업기억_웹툰_전체파일.zip" download>📦 2화 전체 파일(4컷+합본+본문TXT) ZIP 다운로드</a>
        <a class="btn btn-sub" href="./2화_초등문장제수학작업기억_웹툰/00_전체_4컷_한눈에보기_합본.png" download>🖼️ 2화 4컷 바둑판 합본 저장</a>
        <a class="btn btn-sub" href="./2화_초등문장제수학작업기억_웹툰/00_전체_4컷_세로연속보기_스크롤합본.png" download>📜 2화 블로그용 세로 스크롤 합본 저장</a>
      </div>
      <div class="grid-4">
        <a href="./2화_초등문장제수학작업기억_웹툰/01_1컷.png" download><img src="./2화_초등문장제수학작업기억_웹툰/01_1컷.png" alt="2화 1컷" /></a>
        <a href="./2화_초등문장제수학작업기억_웹툰/02_2컷.png" download><img src="./2화_초등문장제수학작업기억_웹툰/02_2컷.png" alt="2화 2컷" /></a>
        <a href="./2화_초등문장제수학작업기억_웹툰/03_3컷.png" download><img src="./2화_초등문장제수학작업기억_웹툰/03_3컷.png" alt="2화 3컷" /></a>
        <a href="./2화_초등문장제수학작업기억_웹툰/04_4컷.png" download><img src="./2화_초등문장제수학작업기억_웹툰/04_4컷.png" alt="2화 4컷" /></a>
      </div>
      <pre id="ep2-txt">{ep2['insta_caption']}

{ep2['threads_post']}</pre>
      <button class="btn" onclick="navigator.clipboard.writeText(document.getElementById('ep2-txt').innerText).then(()=>alert('2화 본문이 복사되었습니다!'))">📋 2화 인스타·쓰레드 본문 복사하기</button>
    </div>

    <div class="card">
      <h3>📏 3화: 밤마다 우유 먹였는데 키가 안 큰다고요? (밤 10시 성장호르몬 &amp; 하체 스트레칭)</h3>
      <div class="btn-row">
        <a class="btn" href="./3화_밤10시숙면숨은키7cm_웹툰_전체파일.zip" download>📦 3화 전체 파일(4컷+합본+본문TXT) ZIP 다운로드</a>
        <a class="btn btn-sub" href="./3화_밤10시숙면숨은키7cm_웹툰/00_전체_4컷_한눈에보기_합본.png" download>🖼️ 3화 4컷 바둑판 합본 저장</a>
        <a class="btn btn-sub" href="./3화_밤10시숙면숨은키7cm_웹툰/00_전체_4컷_세로연속보기_스크롤합본.png" download>📜 3화 블로그용 세로 스크롤 합본 저장</a>
      </div>
      <div class="grid-4">
        <a href="./3화_밤10시숙면숨은키7cm_웹툰/01_1컷.png" download><img src="./3화_밤10시숙면숨은키7cm_웹툰/01_1컷.png" alt="3화 1컷" /></a>
        <a href="./3화_밤10시숙면숨은키7cm_웹툰/02_2컷.png" download><img src="./3화_밤10시숙면숨은키7cm_웹툰/02_2컷.png" alt="3화 2컷" /></a>
        <a href="./3화_밤10시숙면숨은키7cm_웹툰/03_3컷.png" download><img src="./3화_밤10시숙면숨은키7cm_웹툰/03_3컷.png" alt="3화 3컷" /></a>
        <a href="./3화_밤10시숙면숨은키7cm_웹툰/04_4컷.png" download><img src="./3화_밤10시숙면숨은키7cm_웹툰/04_4컷.png" alt="3화 4컷" /></a>
      </div>
      <pre id="ep3-txt">{ep3['insta_caption']}

{ep3['threads_post']}</pre>
      <button class="btn" onclick="navigator.clipboard.writeText(document.getElementById('ep3-txt').innerText).then(()=>alert('3화 본문이 복사되었습니다!'))">📋 3화 인스타·쓰레드 본문 복사하기</button>
    </div>

    <h2 class="section-title">📊 2. 여백 없는 고대비 형광펜 하이라이트 카드뉴스 (폴더별 1탄 ~ 3탄)</h2>
    <div class="card">
      <h3>카드뉴스 1탄: 만 3세 고집과 소근육 발달 (6장)</h3>
      <div class="grid-4">
        <img src="../9_cardnews_series_pack/1탄_만3세고집과소근육발달_카드뉴스/01_카드뉴스_1장.png" alt="1탄 1장" />
        <img src="../9_cardnews_series_pack/1탄_만3세고집과소근육발달_카드뉴스/02_카드뉴스_2장.png" alt="1탄 2장" />
        <img src="../9_cardnews_series_pack/1탄_만3세고집과소근육발달_카드뉴스/03_카드뉴스_3장.png" alt="1탄 3장" />
        <img src="../9_cardnews_series_pack/1탄_만3세고집과소근육발달_카드뉴스/04_카드뉴스_4장.png" alt="1탄 4장" />
      </div>
    </div>

    <div class="card">
      <h3>카드뉴스 2탄: 초등 문장제 수학과 전두엽 작업기억 (4장)</h3>
      <div class="grid-4">
        <img src="../9_cardnews_series_pack/2탄_초등문장제수학과백지복습_카드뉴스/01_카드뉴스_1장.png" alt="2탄 1장" />
        <img src="../9_cardnews_series_pack/2탄_초등문장제수학과백지복습_카드뉴스/02_카드뉴스_2장.png" alt="2탄 2장" />
        <img src="../9_cardnews_series_pack/2탄_초등문장제수학과백지복습_카드뉴스/03_카드뉴스_3장.png" alt="2탄 3장" />
        <img src="../9_cardnews_series_pack/2탄_초등문장제수학과백지복습_카드뉴스/04_카드뉴스_4장.png" alt="2탄 4장" />
      </div>
    </div>

    <div class="card">
      <h3>카드뉴스 3탄: 밤 10시 숙면과 숨은 키 +7cm 루틴 (4장)</h3>
      <div class="grid-4">
        <img src="../9_cardnews_series_pack/3탄_밤10시숙면과숨은키7cm_카드뉴스/01_카드뉴스_1장.png" alt="3탄 1장" />
        <img src="../9_cardnews_series_pack/3탄_밤10시숙면과숨은키7cm_카드뉴스/02_카드뉴스_2장.png" alt="3탄 2장" />
        <img src="../9_cardnews_series_pack/3탄_밤10시숙면과숨은키7cm_카드뉴스/03_카드뉴스_3장.png" alt="3탄 3장" />
        <img src="../9_cardnews_series_pack/3탄_밤10시숙면과숨은키7cm_카드뉴스/04_카드뉴스_4장.png" alt="3탄 4장" />
      </div>
    </div>
  </div>
</body>
</html>
"""
    (WEBTOON_SAMPLE_DIR / "index.html").write_text(web_html, encoding="utf-8")
    (CARDNEWS_SAMPLE_DIR / "index.html").write_text(web_html, encoding="utf-8")


if __name__ == "__main__":
    generate_all_webtoons_and_cardnews()
