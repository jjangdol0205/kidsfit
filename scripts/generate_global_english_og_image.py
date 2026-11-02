# -*- coding: utf-8 -*-
"""
Generates a 100% Native US English 1200x630 OpenGraph / Social Share Thumbnail
for https://kisfitglobal.com (ZERO Korean characters).
Outputs to:
- samples/og-kisfit-global-en-v5.png (new cache-busted URL for Telegram/WhatsApp/iMessage)
- samples/og-kidsfit-studio-v3.png (overwrites legacy Korean image)
- samples/og-kidsfit-studio-v2.png
- samples/og-k-growth-ai-v2.png
"""
import os
import shutil
from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAMPLES_DIR = os.path.join(ROOT_DIR, "samples")


def load_en_font(size, bold=True):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf",
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


def generate_english_og():
    os.makedirs(SAMPLES_DIR, exist_ok=True)
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), (244, 247, 254))
    draw = ImageDraw.Draw(img, "RGBA")

    for y in range(H):
        ratio = y / float(H)
        r = int(246 - 10 * ratio)
        g = int(249 - 8 * ratio)
        b = int(255 - 2 * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    draw.ellipse([(680, -60), (1260, 560)], fill=(219, 234, 254, 140))
    draw.ellipse([(-80, 320), (420, 720)], fill=(209, 250, 229, 120))

    f_brand = load_en_font(21, bold=True)
    f_sub_brand = load_en_font(16, bold=True)
    f_h1 = load_en_font(50, bold=True)
    f_h2 = load_en_font(44, bold=True)
    f_desc = load_en_font(21, bold=False)
    f_pill = load_en_font(16, bold=True)
    f_card_title = load_en_font(19, bold=True)
    f_big_val = load_en_font(50, bold=True)
    f_unit = load_en_font(23, bold=True)
    f_small = load_en_font(16, bold=True)

    # Top-left KISFIT badge
    draw.rounded_rectangle([(60, 68), (108, 116)], radius=14, fill=(15, 23, 42))
    draw_centered_text(draw, (60, 68, 108, 116), "K", load_en_font(26, bold=True), (255, 255, 255))
    draw.text((122, 72), "KISFIT BIO LABS", font=f_brand, fill=(15, 23, 42))
    draw.text((122, 98), "US CDC 2000 Growth Charts · 3,722 PubMed Studies", font=f_sub_brand, fill=(71, 85, 105))

    # Main English Headlines (Left Column)
    draw.text((60, 152), "How Tall Will", font=f_h1, fill=(15, 23, 42))
    draw.text((60, 216), "Your Child Be?", font=f_h1, fill=(37, 99, 235))
    draw.text((60, 286), "+ 5-Axis Brain LQ Scan", font=f_h2, fill=(15, 23, 42))

    # Sub-description
    draw.text((60, 366), "60-Second Clinical Growth Percentile,", font=f_desc, fill=(71, 85, 105))
    draw.text((60, 400), "Adult Height & Executive Function Report", font=f_desc, fill=(71, 85, 105))

    # Bottom 3 Feature Pills
    pills = [
        ("3-Tier Height Forecast", (37, 99, 235), (60, 466, 294, 514)),
        ("Sleep HGH & D3/K2 Rx", (16, 185, 129), (308, 466, 540, 514)),
        ("5-Axis Brain LQ & Study Rx", (124, 58, 237), (60, 528, 330, 576)),
    ]
    for label, dot_col, box in pills:
        draw.rounded_rectangle(box, radius=24, fill=(255, 255, 255), outline=(203, 213, 225), width=2)
        cx = box[0] + 20
        cy = (box[1] + box[3]) // 2
        draw.ellipse([(cx - 6, cy - 6), (cx + 6, cy + 6)], fill=dot_col)
        draw.text((cx + 14, cy - 10), label, font=f_pill, fill=(15, 23, 42))

    # Right Column: Clinical Dashboard Card
    card_box = (636, 68, 1144, 562)
    draw.rounded_rectangle(card_box, radius=32, fill=(255, 255, 255), outline=(191, 219, 254), width=3)

    draw.text((668, 106), "1:1 Growth & Brain Report", font=f_card_title, fill=(51, 65, 85))
    badge_cdc = (962, 100, 1112, 138)
    draw.rounded_rectangle(badge_cdc, radius=18, fill=(239, 246, 255))
    draw_centered_text(draw, badge_cdc, "US CDC LMS", load_en_font(15, bold=True), (29, 78, 216))

    # Big Height Number in Imperial + Metric
    draw.text((668, 162), "5' 10.2\"", font=f_big_val, fill=(15, 23, 42))
    draw.text((864, 184), "(178.4 cm)", font=f_unit, fill=(71, 85, 105))

    gain_box = (948, 152, 1112, 188)
    draw.rounded_rectangle(gain_box, radius=16, fill=(220, 252, 231))
    draw_centered_text(draw, gain_box, "+3.1 in Potential", load_en_font(15, bold=True), (5, 150, 105))

    # Inner Chart Box
    chart_box = (668, 242, 1112, 420)
    draw.rounded_rectangle(chart_box, radius=20, fill=(248, 250, 252), outline=(226, 232, 240), width=2)
    draw.text((692, 260), "US CDC 2000 Trajectory Simulation", font=f_small, fill=(71, 85, 105))

    draw.line([(706, 382), (870, 358), (1072, 338)], fill=(148, 163, 184), width=4)
    draw.line([(706, 382), (870, 332), (1072, 292)], fill=(37, 99, 235), width=6)
    draw.ellipse([(862, 324), (878, 340)], fill=(255, 255, 255), outline=(37, 99, 235), width=4)
    draw.ellipse([(1062, 282), (1082, 302)], fill=(37, 99, 235))

    draw.text((702, 390), "Age 7", font=load_en_font(14, bold=True), fill=(100, 116, 139))
    draw.text((828, 390), "PHV Window", font=load_en_font(14, bold=True), fill=(29, 78, 216))
    draw.text((1034, 390), "Age 18", font=load_en_font(14, bold=True), fill=(15, 23, 42))

    # Bottom 2 Mini Cards inside Right Card
    b1 = (668, 438, 882, 530)
    b2 = (896, 438, 1112, 530)
    draw.rounded_rectangle(b1, radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=2)
    draw.rounded_rectangle(b2, radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=2)

    draw.text((684, 454), "Physical Growth Rx", font=load_en_font(14, bold=True), fill=(100, 116, 139))
    draw.text((684, 482), "10 PM SWS · Ca/D3/K2", font=load_en_font(15, bold=True), fill=(15, 23, 42))

    draw.text((912, 454), "5-Axis Brain LQ Rx", font=load_en_font(14, bold=True), fill=(100, 116, 139))
    draw.text((912, 482), "Bar Model · Recall", font=load_en_font(15, bold=True), fill=(29, 78, 216))

    primary_out = os.path.join(SAMPLES_DIR, "og-kisfit-global-en-v5.png")
    img.save(primary_out, "PNG", optimize=True)

    for alias in [
        "og-kidsfit-studio-v3.png",
        "og-kidsfit-studio-v2.png",
        "og-k-growth-ai-v2.png",
    ]:
        shutil.copyfile(primary_out, os.path.join(SAMPLES_DIR, alias))

    print("OK: Generated 100% English OG image")


if __name__ == "__main__":
    generate_english_og()
