#!/usr/bin/env python3
"""
Generate 1080x1920 (9:16 vertical short-form) 10-second MP4 video (`clip.mp4`)
from `slide-1.png` ~ `slide-4.png` for Naver Clip (네이버 클립), Instagram Reels, and YouTube Shorts.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont
import imageio
import numpy as np

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUTBOX_DIR = os.path.join(ROOT_DIR, 'sns_outbox')
FONTS_DIR = os.path.join(ROOT_DIR, 'src', 'assets', 'fonts')

def build_vertical_frame(slide_img, step_idx, total_steps=4):
    # Create 1080x1920 Warm Ivory MoneyFit Original vertical canvas
    canvas = Image.new('RGB', (1080, 1920), (250, 247, 242))
    draw = ImageDraw.Draw(canvas)

    # Top progress bar & brand pill (y = 80..180)
    jua_path = os.path.join(FONTS_DIR, 'Jua-400.ttf')
    gaegu_path = os.path.join(FONTS_DIR, 'Gaegu-700.ttf')
    try:
        font_badge = ImageFont.truetype(jua_path, 36)
        font_cta = ImageFont.truetype(gaegu_path, 44)
        font_sub = ImageFont.truetype(jua_path, 32)
    except Exception:
        font_badge = ImageFont.load_default()
        font_cta = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    # Step progress pills at top (y = 95)
    bar_w = 220
    gap = 20
    start_x = (1080 - (bar_w * 4 + gap * 3)) // 2
    for i in range(4):
        bx = start_x + i * (bar_w + gap)
        color = (16, 185, 129) if i <= step_idx else (203, 213, 225)
        draw.rounded_rectangle([bx, 95, bx + bar_w, 113], radius=9, fill=color)

    # Top badge pill (MoneyFit Original Deep Navy & Emerald)
    draw.rounded_rectangle([280, 145, 800, 215], radius=35, fill=(15, 23, 42), outline=(16, 185, 129), width=3)
    draw.text((540, 180), f"🧾 머니핏 오리지널 3초 영수증툰 ({step_idx + 1}/4)", fill=(52, 211, 153), font=font_badge, anchor="mm")

    # Paste 1080x1080 slide in the center (y = 280..1360)
    slide_rgb = slide_img.convert('RGB').resize((1080, 1080), Image.Resampling.LANCZOS)
    canvas.paste(slide_rgb, (0, 280))

    # Bottom CTA Box for Naver Shopping Connect Sticker & MoneyFit Search (y = 1420..1670)
    draw.rounded_rectangle([60, 1420, 1020, 1665], radius=32, fill=(15, 23, 42), outline=(16, 185, 129), width=4)
    draw.text((540, 1495), "👇 내 조건 넣으면 1원 단위 영수증 얼마 나올까?", fill=(255, 255, 255), font=font_cta, anchor="mm")
    draw.rounded_rectangle([120, 1545, 960, 1630], radius=22, fill=(16, 185, 129))
    draw.text((540, 1588), "🛍️ 쇼핑커넥트 스티커 확인 또는 [ 머니핏 ] 검색!", fill=(15, 23, 42), font=font_sub, anchor="mm")

    return np.array(canvas)

def generate_clip_for_slug(slug):
    ep_dir = os.path.join(OUTBOX_DIR, slug)
    slides = [os.path.join(ep_dir, f"slide-{i}.png") for i in range(1, 5)]
    if not all(os.path.exists(p) for p in slides):
        print(f"Skipping {slug}: missing slide PNGs")
        return None

    out_mp4 = os.path.join(ep_dir, "clip.mp4")
    fps = 10  # 10 fps * 25 frames per slide = 2.5s per slide = 10.0s total (ultra-fast encoding)
    frames_per_slide = 25

    writer = imageio.get_writer(out_mp4, fps=fps, codec='libx264', quality=8, pixelformat='yuv420p', macro_block_size=None)
    for idx, sp in enumerate(slides):
        img = Image.open(sp)
        frame = build_vertical_frame(img, idx, 4)
        for _ in range(frames_per_slide):
            writer.append_data(frame)
    writer.close()
    print(f"[OK] Generated 9:16 Naver Clip MP4 (10.0s): {out_mp4}")
    return out_mp4

if __name__ == '__main__':
    slugs = sys.argv[1:] if len(sys.argv) > 1 else ['electric-studio-ac', 'diet-female-lean', 'auto-grandeur-5000']
    for s in slugs:
        generate_clip_for_slug(s)
