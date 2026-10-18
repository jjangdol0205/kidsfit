#!/usr/bin/env python3
"""
🏛️ [제2본부 expertise333 전용 미디어 렌더러]
1. 네이버 모바일 홈판(추천피드) 진입용 고해상도 1080x1080 대표 썸네일 이미지 (.png) 5종 렌더링
2. 요즘 유행하는 네이버 클립(Clip) 웹툰 숏폼 동영상 (1080x1920 세로형 .mp4) 5종 렌더링
   - 상단 어그로 고정 배너 (검정/형광 옐로우)
   - 중앙 4컷 웹툰 모션 프레임 (Ken Burns 줌인 + 슬라이드 전환)
   - 하단 유행 쇼츠 자막 바 (굵은 외곽선 + 노란색 하이라이트)
   - 최하단 블로그 정보 스티커 클릭 유도 배너 (클립 -> 블로그 유입 -> 애드포스트 수익 극대화)
"""
import os
import sys
import json
from datetime import datetime, timedelta, timezone
from PIL import Image, ImageDraw, ImageFont
import imageio
import numpy as np

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DIV2_OUTBOX = os.path.join(ROOT_DIR, 'division2_expertise333_outbox')
THUMB_DIR = os.path.join(DIV2_OUTBOX, '2_homefeed_thumbnails')
CLIP_DIR = os.path.join(DIV2_OUTBOX, '3_clip_webtoon_crank_safe')
SNS_OUTBOX = os.path.join(ROOT_DIR, 'sns_outbox')
LOGS_DIR = os.path.join(ROOT_DIR, 'logs')
CA_JSON_PATH = os.path.join(LOGS_DIR, 'creator_advisor_yesterday_keywords.json')
FONTS_DIR = os.path.join(ROOT_DIR, 'src', 'assets', 'fonts')


def get_font(size, bold=True):
    candidates = [
        'C:\\Windows\\Fonts\\malgunbd.ttf' if bold else 'C:\\Windows\\Fonts\\malgun.ttf',
        os.path.join(FONTS_DIR, 'Jua-400.ttf'),
        os.path.join(FONTS_DIR, 'Gaegu-700.ttf'),
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_centered_text(draw, y, text, font, fill, width=1080, stroke_width=0, stroke_fill=(0, 0, 0)):
    bbox = draw.textbbox((0, 0), text, font=font, stroke_width=stroke_width)
    tw = bbox[2] - bbox[0]
    x = (width - tw) // 2
    draw.text((x, y), text, font=font, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill)


def render_homefeed_thumbnail_png(topic, slot, today_str, yesterday_str):
    palettes = [
        {'bg_top': (15, 23, 42), 'bg_bot': (30, 41, 59), 'accent': (250, 204, 21), 'badge': (245, 158, 11)},
        {'bg_top': (6, 78, 59), 'bg_bot': (2, 44, 34), 'accent': (52, 211, 153), 'badge': (16, 185, 129)},
        {'bg_top': (30, 27, 75), 'bg_bot': (15, 23, 42), 'accent': (56, 189, 248), 'badge': (14, 165, 233)},
        {'bg_top': (59, 7, 100), 'bg_bot': (30, 27, 75), 'accent': (251, 191, 36), 'badge': (236, 72, 153)},
        {'bg_top': (69, 10, 10), 'bg_bot': (28, 25, 23), 'accent': (250, 204, 21), 'badge': (239, 68, 68)},
    ]
    pal = palettes[(slot - 1) % len(palettes)]

    img = Image.new('RGB', (1080, 1080), pal['bg_top'])
    draw = ImageDraw.Draw(img)

    # Outer border frame
    draw.rounded_rectangle([36, 36, 1044, 1044], radius=40, outline=pal['accent'], width=6)

    # Top Creator Advisor Category Pill
    draw.rounded_rectangle([110, 110, 970, 200], radius=45, fill=pal['badge'])
    f_badge = get_font(38, bold=True)
    draw_centered_text(draw, 130, topic.get('shortThumbBadge', '경제 트렌드 핵심 요약'), f_badge, (255, 255, 255))

    # Main Hook Line 1
    f_line1 = get_font(74, bold=True)
    draw_centered_text(
        draw,
        310,
        topic.get('shortThumbLine1', ''),
        f_line1,
        (255, 255, 255),
        stroke_width=4,
        stroke_fill=(0, 0, 0),
    )

    # Main Hook Line 2 inside High-Contrast Yellow/Accent Box
    draw.rounded_rectangle([70, 440, 1010, 610], radius=32, fill=pal['accent'])
    f_line2 = get_font(76, bold=True)
    draw_centered_text(draw, 475, topic.get('shortThumbLine2', ''), f_line2, (15, 23, 42))

    # Sub-topics summary box at bottom
    draw.rounded_rectangle([80, 680, 1000, 940], radius=28, fill=(30, 41, 59), outline=(148, 163, 184), width=3)
    f_sub1 = get_font(38, bold=True)
    f_sub2 = get_font(32, bold=True)
    draw_centered_text(draw, 725, '✔ 2026년 최신 구간별 금액 비교표 수록', f_sub1, (248, 250, 252))
    draw_centered_text(draw, 795, '✔ 스마트폰 1분 조회 및 계좌 입금 신청 3단계', f_sub1, pal['accent'])
    draw_centered_text(
        draw,
        868,
        f'네이버 크리에이터 어드바이저 [비즈니스·경제] ({yesterday_str} 기준)',
        f_sub2,
        (148, 163, 184),
    )

    out_name = f"{today_str}_slot{slot}_{topic['id']}_thumb.png"
    out_path = os.path.join(THUMB_DIR, out_name)
    img.save(out_path, 'PNG', optimize=True)
    return out_path


def render_trendy_clip_mp4(topic, slot, today_str):
    preset_map = {
        1: 'electric-inverter-roi',
        2: 'electric-studio-ac',
        3: 'telecom-3yr-expired',
        4: 'auto-grandeur-5000',
        5: 'room-officetel-500',
    }
    preset_slug = preset_map.get(slot, 'electric-studio-ac')
    preset_dir = os.path.join(SNS_OUTBOX, preset_slug)

    slides = []
    for i in range(1, 5):
        sp = os.path.join(preset_dir, f'slide-{i}.png')
        if os.path.exists(sp):
            slides.append(Image.open(sp).convert('RGB').resize((960, 960), Image.Resampling.BILINEAR))
    while len(slides) < 4:
        fallback = Image.new('RGB', (960, 960), (30, 41, 59))
        slides.append(fallback)

    f_top_badge = get_font(34, bold=True)
    f_top_title = get_font(54, bold=True)
    f_cap_badge = get_font(34, bold=True)
    f_cap_line1 = get_font(46, bold=True)
    f_cap_line2 = get_font(52, bold=True)
    f_bot_cta = get_font(40, bold=True)
    f_bot_sub = get_font(30, bold=True)

    clip_slides_meta = topic.get('clipSlides', [])
    fps = 12
    frames_per_cut = 24  # 2.0 seconds per cut -> 8.0 seconds total crisp video
    frames = []

    for cut_idx in range(4):
        base_slide = slides[cut_idx]
        meta = clip_slides_meta[cut_idx] if cut_idx < len(clip_slides_meta) else {
            'cut': cut_idx + 1,
            'badge': f'{cut_idx + 1}컷 핵심',
            'line1': topic.get('shortThumbLine1', ''),
            'line2': topic.get('shortThumbLine2', ''),
        }

        for f_idx in range(frames_per_cut):
            progress = f_idx / float(max(1, frames_per_cut - 1))
            canvas = Image.new('RGB', (1080, 1920), (11, 17, 32))
            draw = ImageDraw.Draw(canvas)

            # 1. Top Trendy Viral Header Box
            draw.rounded_rectangle([40, 60, 1040, 310], radius=32, fill=(23, 37, 84), outline=(250, 204, 21), width=4)
            draw.rounded_rectangle([260, 84, 820, 148], radius=32, fill=(250, 204, 21))
            draw_centered_text(draw, 96, topic.get('shortThumbBadge', '경제 트렌드'), f_top_badge, (15, 23, 42))
            draw_centered_text(
                draw,
                168,
                topic.get('shortThumbLine1', ''),
                f_top_title,
                (255, 255, 255),
                stroke_width=3,
                stroke_fill=(0, 0, 0),
            )
            draw_centered_text(
                draw,
                235,
                topic.get('shortThumbLine2', ''),
                f_top_title,
                (250, 204, 21),
                stroke_width=3,
                stroke_fill=(0, 0, 0),
            )

            # 2. Center Animated Webtoon Panel (Subtle Zoom)
            zoom = 1.0 + 0.04 * progress
            cw = int(960 / zoom)
            left = (960 - cw) // 2
            cropped = base_slide.crop((left, left, left + cw, left + cw)).resize((960, 960), Image.Resampling.BILINEAR)
            canvas.paste(cropped, (60, 350))
            draw.rounded_rectangle([58, 348, 1022, 1312], radius=24, outline=(255, 255, 255), width=4)

            # 3. Trendy Shorts Caption Overlay Bar (1340 ~ 1610)
            draw.rounded_rectangle([40, 1345, 1040, 1615], radius=28, fill=(15, 23, 42), outline=(52, 211, 153), width=4)
            draw.rounded_rectangle([420, 1365, 660, 1420], radius=24, fill=(16, 185, 129))
            draw_centered_text(draw, 1373, meta.get('badge', ''), f_cap_badge, (255, 255, 255))
            draw_centered_text(
                draw,
                1440,
                meta.get('line1', ''),
                f_cap_line1,
                (255, 255, 255),
                stroke_width=3,
                stroke_fill=(0, 0, 0),
            )
            draw_centered_text(
                draw,
                1515,
                meta.get('line2', ''),
                f_cap_line2,
                (250, 204, 21),
                stroke_width=3,
                stroke_fill=(0, 0, 0),
            )

            # 4. Bottom Blog Sticker CTA Card (1645 ~ 1855)
            pulse_color = (3, 199, 90) if (f_idx // 6) % 2 == 0 else (16, 185, 129)
            draw.rounded_rectangle([40, 1650, 1040, 1850], radius=32, fill=pulse_color)
            draw_centered_text(
                draw,
                1682,
                '👆 상단 [블로그] 스티커 누르면 구간별 금액표 3초 확인!',
                f_bot_cta,
                (255, 255, 255),
                stroke_width=2,
                stroke_fill=(0, 0, 0),
            )
            draw_centered_text(
                draw,
                1755,
                '네이버 공식 블로그 (expertise333) · 애드포스트 공식 파트너',
                f_bot_sub,
                (240, 253, 244),
            )

            frames.append(np.array(canvas))

    out_name = f"{today_str}_clip{slot}_{topic['id']}.mp4"
    out_path = os.path.join(CLIP_DIR, out_name)
    imageio.mimsave(out_path, frames, fps=fps, codec='libx264', quality=7, macro_block_size=None)
    return out_path


def main():
    os.makedirs(THUMB_DIR, exist_ok=True)
    os.makedirs(CLIP_DIR, exist_ok=True)

    if not os.path.exists(CA_JSON_PATH):
        print('Creator Advisor JSON not found yet.')
        return

    with open(CA_JSON_PATH, 'r', encoding='utf-8') as f:
        ca_data = json.load(f)

    kst = timezone(timedelta(hours=9))
    today_str = datetime.now(kst).strftime('%Y-%m-%d')
    yesterday_str = ca_data.get('referenceDateYesterday', today_str)
    topics = ca_data.get('topics', [])[:5]

    for idx, topic in enumerate(topics):
        slot = idx + 1
        render_homefeed_thumbnail_png(topic, slot, today_str, yesterday_str)
        render_trendy_clip_mp4(topic, slot, today_str)

    print(f'Rendered {len(topics)} PNG thumbnails and {len(topics)} MP4 webtoon clips.')


if __name__ == '__main__':
    main()
