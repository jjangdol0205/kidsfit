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
    }
    for dst_name, src_name in mapping_ep23.items():
        dst = RAW_EP23_DIR / dst_name
        src = ARTIFACTS_DIR / src_name
        if not dst.exists() and src.exists():
            shutil.copy2(src, dst)


WEBTOON_EPISODES = [
    {
        "ep_num": 1,
        "folder_name": "1화_만3세소근육민감기_웹툰",
        "ep_badge": "키즈핏 육아툰 EP.01",
        "title": "1화: 만 3세 '내가 혼자 할 거야!' 고집의 진짜 이유 (손끝 소근육 민감기)",
        "accent": (79, 70, 229),
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
        "insta_caption": """"내가 혼자 할 거야!! 엄마 저리 가!!" 😭
퇴근하고 돌아오면 단추도 혼자 끼우겠다, 물도 혼자 따르겠다며 고집부리는 만 3세 아이 때문에 한숨 쉬신 적 있나요?

사실 이 시기 아이의 고집은 엄마를 힘들게 하려는 반항이 아니라, 대뇌 운동피질의 30%와 연결된 【손끝 소근육 민감기】가 열렸다는 아주 기특한 신호랍니다! 🌱

✅ 오늘 저녁부터 이렇게 바꿔보세요!
1️⃣ 비싼 교구 대신 주방 나무 집게·물티슈 캡·안전가위로 손끝 힘 길러주기
2️⃣ 서툴러도 대신 해주지 않고 딱 10초만 미소 지으며 기다려주기
3️⃣ 낮에 손끝과 전두엽을 충분히 쓴 아이가 밤 10시 깊은 잠에서 키도 쑥쑥 자랍니다!

👉 우리 아이 개월 수별 소근육·두뇌 발달 밸런스 & 숨은 키 백분위 1분 무료 진단은 프로필 링크( https://truthofmarket.com )에서 바로 확인해 보세요!

#육아툰 #인스타툰 #육아공감 #만3세발달 #소근육발달 #몬테소리 #유아교구 #워킹맘육아 #엄마표놀이 #키즈핏""",
        "threads_post": """【쓰레드 본문 (그대로 복사해서 이미지 4장과 함께 올리세요)】
퇴근하고 집에 오면 "내가 혼자 할 거야!!" 하며 단추 하나 끼우는 데 10분씩 걸리는 만 2~4세 아이… 😅
혼내야 할지 기다려줘야 할지 매일 갈등이었는데, 이게 대뇌 운동피질 30%가 열리는 '손끝 소근육 민감기' 신호였더라고요!
어머님들은 요즘 아이가 "내가 혼자 할래!" 제일 많이 외치는 순간이 언제인가요? 👇

──────────────────────────────────
【쓰레드 첫 번째 고정 대댓글 (업로드 직후 내 글에 댓글로 달아두세요)】
우리 아이 개월 수에 딱 맞는 소근육·두뇌 발달 단계와 키 백분위는 여기서 회원가입 없이 1분 만에 무료로 뽑아보실 수 있어요 😊
👉 https://truthofmarket.com""",
    },
    {
        "ep_num": 2,
        "folder_name": "2화_초등문장제수학작업기억_웹툰",
        "ep_badge": "키즈핏 학습툰 EP.02",
        "title": "2화: 연산은 100점인데 문장제 수학만 별표 치는 아이 (전두엽 작업기억의 비밀)",
        "accent": (13, 148, 136),
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
        "insta_caption": """"단순 연산은 100점인데 왜 세 줄짜리 문장제 문제만 나오면 별표(★)부터 칠까?" 🤔
책을 덜 읽어서 국어 문해력이 부족한 걸까 고민하셨다면 주목해 주세요!

인지뇌과학 연구에 따르면, 초등 아이가 문장제 수학에서 막히는 가장 큰 원인은 머릿속 작은 칠판인 【전두엽 작업기억(Working Memory) 과부하】 때문입니다. 숫자와 조건을 머릿속으로만 암산하려다 앞줄 조건을 잊어버리는 것이죠!

✅ 오늘 저녁 수학 문제집 풀 때 딱 3가지만 해보세요!
1️⃣ 구하는 것에 동그라미(○), 핵심 조건에 밑줄(ㅡ) 긋기
2️⃣ 식부터 쓰지 말고 종이 여백에 간단한 상자·막대 그림 그리기
3️⃣ 정답 맞힌 뒤 "왜 이 식을 세웠는지" 엄마에게 30초 설명하기(하브루타)

👉 우리 아이 5대 학습 역량 지수(문해력·수리력·작업기억·메타인지) 1분 무료 진단은 프로필 링크( https://truthofmarket.com )에서 확인하세요!

#초등수학 #문장제수학 #서술형수학 #초등공부법 #작업기억 #메타인지 #하브루타 #초등맘 #교육툰 #키즈핏""",
        "threads_post": """【쓰레드 본문 (그대로 복사해서 이미지 4장과 함께 올리세요)】
연산 학습지는 다 맞으면서 문제가 세 줄만 넘어가면 읽지도 않고 "엄마 이거 더하는 거야 빼는 거야?" 물어보는 아이… 😂
국어 문제인 줄 알았더니 머릿속 칠판(전두엽 작업기억) 용량이 꽉 차서 생기는 현상이래요! 여백에 상자 그림 하나만 그리게 해도 정답률이 2배 올라갑니다.
초등 맘님들, 요즘 아이 수학 봐주실 때 제일 혈압 오르는(?) 단원이 어디인가요? 👇

──────────────────────────────────
【쓰레드 첫 번째 고정 대댓글 (업로드 직후 내 글에 댓글로 달아두세요)】
우리 아이 전두엽 작업기억·수리추론·문해력 5대 학습 역량(LQ) 점수랑 맞춤 공부법은 여기서 1분 만에 무료로 확인하실 수 있어요!
👉 https://truthofmarket.com""",
    },
    {
        "ep_num": 3,
        "folder_name": "3화_밤10시숙면숨은키7cm_웹툰",
        "ep_badge": "키즈핏 성장툰 EP.03",
        "title": "3화: 밤마다 우유 먹였는데 키가 안 큰다고요? (밤 10시 성장호르몬 & 하체 스트레칭의 비밀)",
        "accent": (234, 88, 12),
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
        "insta_caption": """"키 크라고 밤마다 우유 챙겨줬는데, 오히려 성장호르몬을 방해하고 있었다고?!" 😱
아이 키 때문에 고민이신 부모님들이 가장 많이 하시는 실수 2가지!

1️⃣ 우유를 마시면 배가 꾸르륵거리는 아이(유당불내증)는 칼슘이 흡수되지 못하고 배출됩니다.
2️⃣ 잠들기 직전 먹는 우유·과일·야식은 인슐린을 높여 밤 10시~새벽 2시에 분비되는 【성장호르몬(GH) 스위치】를 꺼버립니다!

✅ 오늘 밤부터 시작하는 '숨은 키 +7cm' 골든타임 루틴
• 저녁 식사 때 두부·잔멸치·치즈 + 칼슘·비타민D3·아연으로 뼈 재료 채우기
• 취침 2시간 전부터 공복 유지하기
• 밤 9시 40분, 무릎·종아리 하체 성장판 5분 스트레칭 후 10시 정각 암막 소등!

👉 질병관리청 성장도표 기준 우리 아이 정확한 키 백분위 & 부모 유전키 대비 3단 예상키는 프로필 링크( https://truthofmarket.com )에서 1분 만에 무료로 확인하세요!

#아이키성장 #어린이키성장 #키크는습관 #성장호르몬 #밤10시수면 #어린이칼슘 #성장판스트레칭 #초등키성장 #육아툰 #키즈핏""",
        "threads_post": """【쓰레드 본문 (그대로 복사해서 이미지 4장과 함께 올리세요)】
키 크라고 자기 직전에 우유나 과일 챙겨주시는 부모님 계신가요? 😭
소아내분비학 논문을 보니 잠들기 2시간 전 당분·음식이 들어오면 인슐린이 올라가서 밤 10시 성장호르몬 분비가 멈춘다고 해요!
오늘부터 밤 9시 40분 하체 성장판 마사지 + 10시 공복 칼퇴근 수면 도전합니다 💪 어머님들 아이들은 보통 몇 시에 잠드나요? 👇

──────────────────────────────────
【쓰레드 첫 번째 고정 대댓글 (업로드 직후 내 글에 댓글로 달아두세요)】
질병관리청 성장도표 기준 우리 아이 정확한 키·몸무게 백분위랑 부모 유전키(MPH) 대비 최대 잠재키는 여기서 1분 만에 무료로 계산해 보실 수 있어요!
👉 https://truthofmarket.com""",
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


def generate_all_webtoons_and_cardnews():
    ensure_ep1_raw_files()
    WEBTOON_ROOT_KO.mkdir(parents=True, exist_ok=True)
    WEBTOON_SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    CARDNEWS_ROOT_KO.mkdir(parents=True, exist_ok=True)
    CARDNEWS_SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Render All 3 Webtoon Episodes into Dedicated Folders
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

            # Save 4-cut 2x2 grid summary image
            grid_img = build_grid_2x2(rendered_cuts)
            grid_img.save(f_dir / "00_전체_4컷_한눈에보기_합본.png", "PNG")

            # Save Instagram & Threads copy-ready text files inside the episode folder
            (f_dir / "인스타그램_본문_해시태그.txt").write_text(ep["insta_caption"] + "\n", encoding="utf-8")
            (f_dir / "쓰레드_공감질문_본문_대댓글.txt").write_text(ep["threads_post"] + "\n", encoding="utf-8")

        print(f"✅ 웹툰 {ep_num}화 렌더링 및 폴더 정리 완료 -> {folder_name}")

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

        print(f"✅ 카드뉴스 {sr_num}탄 렌더링 및 폴더 정리 완료 -> {folder_name}")

    # 3. Generate Web Hub for Webtoons & Cardnews (samples/8_insta_threads_webtoon_pack/index.html)
    generate_webtoon_cardnews_web_hub()


def generate_webtoon_cardnews_web_hub():
    web_html = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>키즈핏 감각적 4컷 웹툰 & 여백 없는 카드뉴스 올인원 발행 센터</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <style>
    :root { --bg: #0F172A; --card: #1E293B; --accent: #6366F1; --mint: #10B981; --yellow: #FACC15; --text: #F8FAFC; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Pretendard', sans-serif; background: var(--bg); color: var(--text); padding: 24px 14px 90px; line-height: 1.6; }
    .container { max-width: 960px; margin: 0 auto; }
    .hero { background: linear-gradient(135deg, #4F46E5 0%, #EC4899 100%); padding: 28px 22px; border-radius: 22px; margin-bottom: 24px; }
    .hero h1 { font-size: 1.45rem; font-weight: 800; margin-bottom: 8px; }
    .section-title { font-size: 1.25rem; font-weight: 800; margin: 28px 0 14px; color: var(--yellow); }
    .card { background: var(--card); border: 1px solid #334155; border-radius: 20px; padding: 20px; margin-bottom: 22px; }
    .card h3 { font-size: 1.1rem; font-weight: 800; margin-bottom: 12px; color: #fff; }
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 14px; }
    .grid-4 img { width: 100%; border-radius: 12px; border: 1px solid #475569; }
    pre { background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 14px; font-family: inherit; font-size: 0.9rem; white-space: pre-wrap; color: #E2E8F0; margin-bottom: 12px; }
    .btn { display: inline-block; background: var(--mint); color: #0F172A; font-weight: 800; padding: 12px 18px; border-radius: 12px; border: none; cursor: pointer; font-size: 0.92rem; text-decoration: none; margin-right: 8px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>🎨 키즈핏 감각적 4컷 공감 웹툰 (1~3화) &amp; 여백 없는 카드뉴스 (1~3탄) 센터</h1>
      <p>인스타그램과 쓰레드에 동시 업로드할 수 있는 고해상도 4컷 웹툰 시리즈와 꽉 찬 풀블리드 카드뉴스 시리즈입니다.</p>
    </div>

    <h2 class="section-title">💬 1. 인스타·쓰레드 동시 업로드용 4컷 공감 웹툰 (폴더별 1화 ~ 3화)</h2>
    <div class="card">
      <h3>EP.01 만 3세 '내가 혼자 할 거야!' 고집의 진짜 이유 (손끝 소근육 민감기)</h3>
      <div class="grid-4">
        <img src="./1화_만3세소근육민감기_웹툰/01_1컷.png" alt="1화 1컷" />
        <img src="./1화_만3세소근육민감기_웹툰/02_2컷.png" alt="1화 2컷" />
        <img src="./1화_만3세소근육민감기_웹툰/03_3컷.png" alt="1화 3컷" />
        <img src="./1화_만3세소근육민감기_웹툰/04_4컷.png" alt="1화 4컷" />
      </div>
    </div>

    <div class="card">
      <h3>EP.02 연산은 100점인데 문장제 수학만 별표 치는 아이 (전두엽 작업기억의 비밀)</h3>
      <div class="grid-4">
        <img src="./2화_초등문장제수학작업기억_웹툰/01_1컷.png" alt="2화 1컷" />
        <img src="./2화_초등문장제수학작업기억_웹툰/02_2컷.png" alt="2화 2컷" />
        <img src="./2화_초등문장제수학작업기억_웹툰/03_3컷.png" alt="2화 3컷" />
        <img src="./2화_초등문장제수학작업기억_웹툰/04_4컷.png" alt="2화 4컷" />
      </div>
    </div>

    <div class="card">
      <h3>EP.03 밤마다 우유 먹였는데 키가 안 큰다고요? (밤 10시 성장호르몬 &amp; 하체 스트레칭)</h3>
      <div class="grid-4">
        <img src="./3화_밤10시숙면숨은키7cm_웹툰/01_1컷.png" alt="3화 1컷" />
        <img src="./3화_밤10시숙면숨은키7cm_웹툰/02_2컷.png" alt="3화 2컷" />
        <img src="./3화_밤10시숙면숨은키7cm_웹툰/03_3컷.png" alt="3화 3컷" />
        <img src="./3화_밤10시숙면숨은키7cm_웹툰/04_4컷.png" alt="3화 4컷" />
      </div>
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
