#!/usr/bin/env python3
"""
MoneyFit Natural Webtoon Motion Cinema Engine (9:16 Vertical Short-Form MP4 — 1080x1920, 15fps, 11.2s)
Stitches `slide-1.png` ~ `slide-4.png` into a smooth, natural animated short-form video (`clip.mp4`)
for Naver Clip (네이버 클립), Naver Blog Short-Form Video, Naver Cafe, Instagram Reels, and YouTube Shorts.

Features:
- Smooth 15fps playback (168 frames = 11.2 seconds total)
- Natural Ken Burns camera zoom & pan on each webtoon panel (1.00x -> 1.045x ease-out)
- Smooth slide + cross-dissolve transition (0.4s cubic ease-in-out) between Cut 1 -> Cut 2 -> Cut 3 -> Cut 4
- Continuous animated top progress bar + '@moneyfit2026' brand badge (no '1/4' numbers)
- Animated bottom Naver Shopping Connect & 3-Second Receipt Calculator CTA card
"""
import os
import sys
import math
from PIL import Image, ImageDraw, ImageFont
import imageio
import numpy as np

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUTBOX_DIR = os.path.join(ROOT_DIR, 'sns_outbox')
FONTS_DIR = os.path.join(ROOT_DIR, 'src', 'assets', 'fonts')


def ease_in_out_cubic(t):
    return 4 * t * t * t if t < 0.5 else 1 - pow(-2 * t + 2, 3) / 2


def ease_out_quad(t):
    return 1 - (1 - t) * (1 - t)


def load_fonts():
    jua_path = os.path.join(FONTS_DIR, 'Jua-400.ttf')
    if not os.path.exists(jua_path):
        jua_path = os.path.join(FONTS_DIR, 'Jua-Regular.ttf')
    gaegu_path = os.path.join(FONTS_DIR, 'Gaegu-700.ttf')
    if not os.path.exists(gaegu_path):
        gaegu_path = os.path.join(FONTS_DIR, 'Gaegu-Bold.ttf')
    try:
        font_badge = ImageFont.truetype(jua_path, 36)
        font_hook = ImageFont.truetype(jua_path, 40)
        font_cta = ImageFont.truetype(gaegu_path, 46)
        font_sub = ImageFont.truetype(jua_path, 32)
    except Exception:
        font_badge = ImageFont.load_default()
        font_hook = ImageFont.load_default()
        font_cta = ImageFont.load_default()
        font_sub = ImageFont.load_default()
    return font_badge, font_hook, font_cta, font_sub


def apply_ken_burns(slide_img, local_progress, step_idx):
    """
    Apply subtle natural camera zoom & pan to a 1080x1080 webtoon slide
    so the characters and receipt feel alive like an animated webtoon.
    """
    w, h = slide_img.size
    zoom = 1.0 + 0.042 * ease_out_quad(local_progress)
    crop_w = int(w / zoom)
    crop_h = int(h / zoom)

    pan_dirs = [
        (0.35, 0.45, 0.55, 0.50),  # Cut 1: gentle pan left -> center
        (0.55, 0.45, 0.45, 0.50),  # Cut 2: gentle pan right -> center
        (0.50, 0.35, 0.50, 0.58),  # Cut 3: pan down along the receipt
        (0.50, 0.55, 0.50, 0.45),  # Cut 4: gentle lift on solution
    ]
    sx, sy, ex, ey = pan_dirs[step_idx % 4]
    cx_ratio = sx + (ex - sx) * ease_in_out_cubic(local_progress)
    cy_ratio = sy + (ey - sy) * ease_in_out_cubic(local_progress)

    max_dx = max(0, w - crop_w)
    max_dy = max(0, h - crop_h)
    left = int(max_dx * cx_ratio)
    top = int(max_dy * cy_ratio)

    cropped = slide_img.crop((left, top, left + crop_w, top + crop_h))
    return cropped.resize((1080, 1080), Image.Resampling.BILINEAR)


def blend_transition(img_a, img_b, t):
    """
    Smooth horizontal comic-panel slide + cross-dissolve transition between two 1080x1080 panels.
    """
    et = ease_in_out_cubic(t)
    offset = int(1080 * et)
    combined = Image.new('RGB', (1080, 1080), (255, 255, 255))
    combined.paste(img_a, (-offset, 0))
    combined.paste(img_b, (1080 - offset, 0))
    alpha_blend = Image.blend(img_a, img_b, et)
    return Image.blend(combined, alpha_blend, 0.35)


CLIP_REVENUE_META = {
    'electric': {
        'hook_tag': '⚡ 전기세 폭탄 3초 팩트체크',
        'bc_product': '듀플렉스 스탠드 서큘레이터 (리뷰 20,951개)',
        'bc_url': 'https://naver.me/xm0ZVnAW',
    },
    'diet': {
        'hook_tag': '🥗 다이어트 식비·칼로리 팩트체크',
        'bc_product': '한끼통살 소스 닭가슴살 10팩 (리뷰 49,365개)',
        'bc_url': 'https://naver.me/xvClW9nJ',
    },
    'pet': {
        'hook_tag': '🐾 강아지·고양이 사료비 팩트체크',
        'bc_product': '라비앙독 가수분해 연어 사료 4.8kg (리뷰 26,136개)',
        'bc_url': 'https://naver.me/xAfcU6Im',
    },
    'room': {
        'hook_tag': '🛋️ 자취·이사 가전 예산 팩트체크',
        'bc_product': '[슈퍼적립] 로보락 Qrevo Curv 26년 로봇청소기',
        'bc_url': 'https://naver.me/GgUlTvYj',
    },
    'auto': {
        'hook_tag': '🚗 신차 할부 vs 장기렌트 팩트체크',
        'bc_product': '아이테라 26년형 2채널 FHD 블랙박스 (3년 AS)',
        'bc_url': 'https://naver.me/G5kYoDj6',
    },
    'telecom': {
        'hook_tag': '🌐 인터넷 위약금 vs 47만 사은품 팩트체크',
        'bc_product': '티피링크 Archer AX1500 Wi-Fi 6 기가 공유기',
        'bc_url': 'https://naver.me/FpwR436o',
    },
}


def get_cat_meta(slug):
    prefix = slug.split('-')[0] if '-' in slug else 'electric'
    return CLIP_REVENUE_META.get(prefix, CLIP_REVENUE_META['electric'])


def build_base_templates(fonts, slug='electric-studio-ac'):
    """
    Pre-render base 1080x1920 templates for the 4 cuts (with active vs alt CTA button color)
    including category-specific Brand Connect revenue product + truthofmarket.com URL.
    """
    font_badge, font_hook, font_cta, font_sub = fonts
    meta = get_cat_meta(slug)
    cut_hooks = [
        "[1컷] 흔한 생활비 착각, 진짜 아껴질까?",
        "[2컷] 여우실장님의 1원 단위 팩트폭격!",
        "[3컷] 충격의 3초 실물 비교 영수증 공개!",
        "[4컷] 호구 탈출 솔루션 & 최저가 확인!"
    ]
    templates = {}
    for step_idx in range(4):
        for btn_state in (0, 1):
            canvas = Image.new('RGB', (1080, 1920), (250, 248, 244))
            draw = ImageDraw.Draw(canvas)

            # Top Header Bar
            draw.rounded_rectangle([48, 62, 420, 128], radius=33, fill=(28, 25, 23))
            draw.text((234, 95), "MF @moneyfit2026", fill=(52, 211, 153), font=font_badge, anchor="mm")

            draw.rounded_rectangle([440, 62, 1032, 128], radius=33, fill=(254, 243, 199), outline=(28, 25, 23), width=3)
            draw.text((736, 95), cut_hooks[step_idx % 4], fill=(28, 25, 23), font=font_sub, anchor="mm")

            # Timeline background track
            draw.rounded_rectangle([48, 154, 1032, 174], radius=10, fill=(229, 231, 235), outline=(28, 25, 23), width=2)

            # Panel divider lines
            draw.line([(0, 218), (1080, 218)], fill=(28, 25, 23), width=5)
            draw.line([(0, 1302), (1080, 1302)], fill=(28, 25, 23), width=5)

            # Bottom Revenue-Linked CTA Card (y = 1338..1845)
            card_top = 1338
            card_bot = 1845
            bg_fill = (236, 253, 245) if step_idx >= 2 else (255, 255, 255)
            draw.rounded_rectangle([48, card_top, 1032, card_bot], radius=36, fill=bg_fill, outline=(28, 25, 23), width=5)

            draw.rounded_rectangle([84, card_top + 24, 650, card_top + 82], radius=29, fill=(254, 240, 138), outline=(28, 25, 23), width=3)
            draw.text((367, card_top + 53), meta['hook_tag'], fill=(28, 25, 23), font=font_sub, anchor="mm")

            draw.text((540, card_top + 132), "내 조건 넣으면 매달 얼마 아낄 수 있을까?", fill=(28, 25, 23), font=font_cta, anchor="mm")

            # Button 1: Homepage 3-Second Calculator (Inflow Engine)
            btn_fill = (15, 23, 42) if btn_state == 0 else (30, 41, 59)
            draw.rounded_rectangle([84, card_top + 182, 996, card_top + 288], radius=24, fill=btn_fill, outline=(52, 211, 153), width=4)
            draw.text((540, card_top + 235), "🔎 무료 3초 계산기 : 검색창에 [ 머니핏 ] 검색!", fill=(52, 211, 153), font=font_hook, anchor="mm")

            # Button 2: Verified Naver Brand Connect Revenue Product
            bc_fill = (3, 199, 90) if btn_state == 0 else (5, 150, 105)
            draw.rounded_rectangle([84, card_top + 306, 996, card_top + 412], radius=24, fill=bc_fill, outline=(28, 25, 23), width=4)
            draw.text((540, card_top + 359), f"🛍️ 특가템: {meta['bc_product']}", fill=(255, 255, 255), font=font_sub, anchor="mm")

            draw.text((540, card_top + 455), f"👉 고정댓글 & 정보 스티커 클릭 ({meta['bc_url']})", fill=(225, 29, 72), font=font_sub, anchor="mm")

            templates[(step_idx, btn_state)] = canvas
    return templates


def render_vertical_frame(center_panel, global_progress, step_idx, templates):
    btn_state = int(global_progress * 14) % 2
    canvas = templates[(step_idx % 4, btn_state)].copy()
    draw = ImageDraw.Draw(canvas)

    fill_w = max(24, int(984 * global_progress))
    draw.rounded_rectangle([48, 154, 48 + fill_w, 174], radius=10, fill=(16, 185, 129))
    canvas.paste(center_panel, (0, 220))
    return np.array(canvas)


def generate_clip_for_slug(slug):
    ep_dir = os.path.join(OUTBOX_DIR, slug)
    slides_paths = [os.path.join(ep_dir, f"slide-{i}.png") for i in range(1, 5)]
    if not all(os.path.exists(p) for p in slides_paths):
        print(f"Skipping {slug}: missing slide PNGs")
        return None

    slides = [Image.open(p).convert('RGB') for p in slides_paths]
    fonts = load_fonts()
    templates = build_base_templates(fonts, slug=slug)
    meta = get_cat_meta(slug)

    out_mp4 = os.path.join(ep_dir, "clip.mp4")
    fps = 15
    hold_frames = 54       # 3.60s hold with natural Ken Burns motion per panel
    trans_frames = 8       # 0.53s smooth slide + dissolve transition between panels
    total_frames = 4 * hold_frames + 3 * trans_frames  # 240 frames = 16.0 seconds @ 15fps

    writer = imageio.get_writer(
        out_mp4,
        fps=fps,
        codec='libx264',
        quality=8,
        pixelformat='yuv420p',
        macro_block_size=None
    )

    frame_idx = 0
    for idx in range(4):
        for f in range(hold_frames):
            local_p = f / max(1, hold_frames - 1)
            global_p = frame_idx / max(1, total_frames - 1)
            kb_panel = apply_ken_burns(slides[idx], local_p, idx)
            frame = render_vertical_frame(kb_panel, global_p, idx, templates)
            writer.append_data(frame)
            frame_idx += 1

        if idx < 3:
            end_curr = apply_ken_burns(slides[idx], 1.0, idx)
            start_next = apply_ken_burns(slides[idx + 1], 0.0, idx + 1)
            for tf in range(trans_frames):
                t = (tf + 1) / (trans_frames + 1)
                global_p = frame_idx / max(1, total_frames - 1)
                blended = blend_transition(end_curr, start_next, t)
                frame = render_vertical_frame(blended, global_p, idx + 1 if t > 0.5 else idx, templates)
                writer.append_data(frame)
                frame_idx += 1

    writer.close()

    # Write revenue-linked Naver Clip caption & pinned comment kit
    caption_path = os.path.join(ep_dir, "clip_revenue_caption.txt")
    caption_text = (
        f"[네이버 클립 수익 연동 패키지 — {slug}]\n"
        f"1. 클립 제목: {meta['hook_tag']} | 모르고 쓰면 매달 새는 생돈 3초 비교 영수증!\n"
        f"2. 클립 정보(링크) 스티커 1 (홈페이지 유입): https://truthofmarket.com/preset/{slug}\n"
        f"3. 클립 쇼핑/링크 스티커 2 (브랜드커넥트 수익): {meta['bc_url']} ({meta['bc_product']})\n"
        f"4. 클립 고정 댓글 (수익 + 유입 동시 전환):\n"
        f"📌 [3초 무료 계산기 & 검증 특가템 좌표]\n"
        f"• 내 조건 1원 단위 무료 계산기: https://truthofmarket.com/preset/{slug}\n"
        f"• 영상 속 추천 절약템 최저가: {meta['bc_url']}\n"
        f"(※ 네이버 브랜드커넥트 활동의 일환으로 판매 발생 시 수수료를 제공받습니다.)\n"
    )
    with open(caption_path, "w", encoding="utf-8") as cf:
        cf.write(caption_text)

    print(f"[OK] Generated Revenue-Linked 9:16 Naver Clip MP4 (15fps, 16.0s): {out_mp4}", flush=True)
    return out_mp4


if __name__ == '__main__':
    slugs = sys.argv[1:] if len(sys.argv) > 1 else [
        'electric-studio-ac',
        'diet-male-fatloss',
        'pet-maltese-5kg',
        'room-officetel-500',
        'auto-grandeur-5000',
        'telecom-penalty-15'
    ]
    for s in slugs:
        generate_clip_for_slug(s)

