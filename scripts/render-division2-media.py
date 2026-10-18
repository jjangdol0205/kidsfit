#!/usr/bin/env python3
"""
🏛️ [제2본부 expertise333 전용 미디어 렌더러 v3.1 — 홈판 Top 1% 좋은 그림 & 클립 10만 뷰 좋은 영상]
1. 네이버 모바일 홈판(추천피드) 진입용 고해상도 1080x1080 대표 썸네일 이미지 (.png) 5종 렌더링
   - 순수 캐릭터 원화(src/assets/webtoon/*.jpg) 우측 상단 일러스트 카드 합성 (말풍선 겹침 0%)
   - 깨짐 없는 한글/기호 폰트(★, ▶, [HOT]) + 초특대 네온 금액 하이라이트 박스
2. 요즘 유행하는 네이버 클립(Clip) 웹툰 숏폼 동영상 (1080x1920 세로형 .mp4) 5종 렌더링
   - 상단 어그로 고정 배너 + [STEP 1/4 ~ 4/4] 컷 인디케이터
   - 실시간 네온 프로그레스 바 (시청 지속률 200% 견인)
   - 중앙 4컷 웹툰 모션 프레임 (Ken Burns 줌인)
   - 하단 Slide-Up 탄성 쇼츠 자막 바 + 최하단 바운싱 [블로그 스티커] 클릭 유도 배너
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
WEBTOON_ART_DIR = os.path.join(ROOT_DIR, 'src', 'assets', 'webtoon')
LOGS_DIR = os.path.join(ROOT_DIR, 'logs')
CA_JSON_PATH = os.path.join(LOGS_DIR, 'creator_advisor_yesterday_keywords.json')
FONTS_DIR = os.path.join(ROOT_DIR, 'src', 'assets', 'fonts')

PRESET_MAP = {
    1: 'electric-inverter-roi',
    2: 'electric-studio-ac',
    3: 'telecom-3yr-expired',
    4: 'auto-grandeur-5000',
    5: 'room-officetel-500',
}

ART_MAP = {
    1: 'hero-banner.jpg',
    2: 'electric.jpg',
    3: 'telecom.jpg',
    4: 'auto.jpg',
    5: 'room.jpg',
}


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


def clean_glyphs(text):
    """Remove emoji characters that Malgun Gothic cannot render so there are zero tofu boxes."""
    if not text:
        return ''
    for bad, rep in [('🔥', '★ '), ('👆', '▶ '), ('✔', '▶ '), ('💡', '★ '), ('📌', '★ ')]:
        text = text.replace(bad, rep)
    return text


def draw_centered_text(draw, y, text, font, fill, width=1080, stroke_width=0, stroke_fill=(0, 0, 0)):
    text = clean_glyphs(text)
    bbox = draw.textbbox((0, 0), text, font=font, stroke_width=stroke_width)
    tw = bbox[2] - bbox[0]
    x = (width - tw) // 2
    draw.text((x, y), text, font=font, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill)


def render_homefeed_thumbnail_png(topic, slot, today_str, yesterday_str):
    palettes = [
        {'bg_top': (11, 17, 32), 'bg_card': (23, 37, 84), 'accent': (250, 204, 21), 'badge': (245, 158, 11)},
        {'bg_top': (6, 48, 38), 'bg_card': (12, 74, 58), 'accent': (52, 211, 153), 'badge': (16, 185, 129)},
        {'bg_top': (20, 24, 62), 'bg_card': (30, 41, 89), 'accent': (56, 189, 248), 'badge': (14, 165, 233)},
        {'bg_top': (45, 12, 78), 'bg_card': (68, 20, 110), 'accent': (251, 191, 36), 'badge': (236, 72, 153)},
        {'bg_top': (52, 12, 16), 'bg_card': (82, 20, 26), 'accent': (250, 204, 21), 'badge': (239, 68, 68)},
    ]
    pal = palettes[(slot - 1) % len(palettes)]

    img = Image.new('RGB', (1080, 1080), pal['bg_top'])
    draw = ImageDraw.Draw(img)

    # Outer border frame & top visual card background
    draw.rounded_rectangle([32, 32, 1048, 1048], radius=40, outline=pal['accent'], width=7)
    draw.rounded_rectangle([60, 178, 1020, 462], radius=28, fill=pal['bg_card'], outline=(71, 85, 105), width=2)

    # 1. Composite Pure Character Illustration on the Right Side of the Upper Card (x=735..1000, y=195..445)
    art_file = os.path.join(WEBTOON_ART_DIR, ART_MAP.get(slot, 'electric.jpg'))
    if os.path.exists(art_file):
        try:
            art = Image.open(art_file).convert('RGB')
            aw, ah = art.size
            side = min(aw, ah)
            left = (aw - side) // 2
            top = (ah - side) // 2
            char_portrait = art.crop((left, top, left + side, top + side)).resize((250, 250), Image.Resampling.BILINEAR)
            img.paste(char_portrait, (748, 195))
            draw.rounded_rectangle([744, 191, 1002, 449], radius=24, outline=pal['accent'], width=5)
        except Exception:
            pass

    # Top Creator Advisor Category Pill (Left)
    draw.rounded_rectangle([60, 74, 710, 152], radius=38, fill=pal['badge'])
    f_badge = get_font(33, bold=True)
    draw.text((88, 92), clean_glyphs(topic.get('shortThumbBadge', '경제 트렌드 핵심 요약')), font=f_badge, fill=(255, 255, 255))

    # Top-Right Urgency Stamp Badge (Zero broken emoji)
    draw.rounded_rectangle([730, 74, 1020, 152], radius=38, fill=(220, 38, 38), outline=(254, 240, 138), width=3)
    f_stamp = get_font(30, bold=True)
    draw.text((758, 94), '★ 전일자 경제 1위', font=f_stamp, fill=(255, 255, 255))

    # Left Side of Upper Card: Sub-kicker + Main Hook Line 1 (Never overlaps right character portrait!)
    f_kicker = get_font(30, bold=True)
    draw.text((88, 222), '▶ 2026년 모르면 손해 보는 핵심 경제 정보', font=f_kicker, fill=pal['accent'])

    f_line1 = get_font(54, bold=True)
    draw.text(
        (88, 295),
        clean_glyphs(topic.get('shortThumbLine1', '')),
        font=f_line1,
        fill=(255, 255, 255),
        stroke_width=4,
        stroke_fill=(0, 0, 0),
    )

    # Main Hook Line 2 inside High-Contrast Neon Box (Full width, huge numbers)
    draw.rounded_rectangle([60, 490, 1020, 665], radius=32, fill=pal['accent'], outline=(255, 255, 255), width=4)
    f_line2 = get_font(74, bold=True)
    draw_centered_text(draw, 528, topic.get('shortThumbLine2', ''), f_line2, (11, 17, 32))

    # Sub-topics summary box at bottom
    draw.rounded_rectangle([60, 698, 1020, 990], radius=28, fill=(15, 23, 42), outline=pal['accent'], width=3)
    f_sub1 = get_font(36, bold=True)
    f_sub2 = get_font(29, bold=True)
    draw_centered_text(draw, 738, '▶ 2026년 최신 구간별 금액 비교표 & 실제 사례 수록', f_sub1, (248, 250, 252))
    draw_centered_text(draw, 812, '▶ 스마트폰 1분 조회 및 계좌 입금 신청 3단계 총정리', f_sub1, pal['accent'])
    draw_centered_text(
        draw,
        898,
        f'네이버 크리에이터 어드바이저 [비즈니스·경제] ({yesterday_str} 기준)',
        f_sub2,
        (148, 163, 184),
    )

    out_name = f"{today_str}_slot{slot}_{topic['id']}_thumb.png"
    out_path = os.path.join(THUMB_DIR, out_name)
    img.save(out_path, 'PNG', optimize=True)
    return out_path


def render_trendy_clip_mp4(topic, slot, today_str):
    preset_slug = PRESET_MAP.get(slot, 'electric-studio-ac')
    preset_dir = os.path.join(SNS_OUTBOX, preset_slug)

    slides = []
    for i in range(1, 5):
        sp = os.path.join(preset_dir, f'slide-{i}.png')
        if os.path.exists(sp):
            slides.append(Image.open(sp).convert('RGB').resize((960, 960), Image.Resampling.BILINEAR))
    while len(slides) < 4:
        fallback = Image.new('RGB', (960, 960), (30, 41, 59))
        slides.append(fallback)

    f_top_badge = get_font(30, bold=True)
    f_step_badge = get_font(28, bold=True)
    f_top_title = get_font(50, bold=True)
    f_cap_badge = get_font(34, bold=True)
    f_cap_line1 = get_font(44, bold=True)
    f_cap_line2 = get_font(50, bold=True)
    f_bot_cta = get_font(38, bold=True)
    f_bot_sub = get_font(28, bold=True)

    clip_slides_meta = topic.get('clipSlides', [])
    fps = 12
    frames_per_cut = 24  # 2.0 seconds per cut -> 8.0 seconds total crisp video
    total_frames = frames_per_cut * 4
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
            global_frame_idx = cut_idx * frames_per_cut + f_idx
            overall_progress = (global_frame_idx + 1) / float(total_frames)
            progress = f_idx / float(max(1, frames_per_cut - 1))

            canvas = Image.new('RGB', (1080, 1920), (11, 17, 32))
            draw = ImageDraw.Draw(canvas)

            # 1. Top Trendy Viral Header Box + STEP 1/4 ~ 4/4 Counter Badge
            draw.rounded_rectangle([40, 50, 1040, 305], radius=32, fill=(23, 37, 84), outline=(250, 204, 21), width=4)
            draw.rounded_rectangle([70, 74, 690, 138], radius=32, fill=(250, 204, 21))
            draw.text((95, 86), clean_glyphs(topic.get('shortThumbBadge', '경제 트렌드')), font=f_top_badge, fill=(15, 23, 42))

            # Step Counter Pill at top-right
            draw.rounded_rectangle([720, 74, 1010, 138], radius=32, fill=(16, 185, 129), outline=(255, 255, 255), width=2)
            draw.text((760, 88), f'STEP {cut_idx + 1} / 4 ▶', font=f_step_badge, fill=(255, 255, 255))

            draw_centered_text(
                draw,
                160,
                topic.get('shortThumbLine1', ''),
                f_top_title,
                (255, 255, 255),
                stroke_width=3,
                stroke_fill=(0, 0, 0),
            )
            draw_centered_text(
                draw,
                228,
                topic.get('shortThumbLine2', ''),
                f_top_title,
                (250, 204, 21),
                stroke_width=3,
                stroke_fill=(0, 0, 0),
            )

            # 2. Real-Time Neon Progress Bar (y=318..336)
            draw.rounded_rectangle([60, 318, 1020, 336], radius=9, fill=(30, 41, 59))
            bar_w = max(24, int(960 * overall_progress))
            draw.rounded_rectangle([60, 318, 60 + bar_w, 336], radius=9, fill=(52, 211, 153))

            # 3. Center Animated Webtoon Panel (Smooth Ken Burns Zoom)
            zoom = 1.0 + 0.05 * progress
            cw = int(960 / zoom)
            left = (960 - cw) // 2
            cropped = base_slide.crop((left, left, left + cw, left + cw)).resize((960, 960), Image.Resampling.BILINEAR)
            canvas.paste(cropped, (60, 352))
            draw.rounded_rectangle([58, 350, 1022, 1314], radius=24, outline=(255, 255, 255), width=4)

            # 4. Trendy Shorts Caption Overlay Bar with Slide-Up Pop-In Animation
            slide_up_offset = int((1.0 - min(1.0, f_idx / 4.0)) * 26)
            cap_top = 1342 + slide_up_offset
            cap_bot = 1612 + slide_up_offset
            draw.rounded_rectangle([40, cap_top, 1040, cap_bot], radius=28, fill=(15, 23, 42), outline=(52, 211, 153), width=4)
            draw.rounded_rectangle([390, cap_top + 18, 690, cap_top + 74], radius=24, fill=(16, 185, 129))
            draw_centered_text(draw, cap_top + 26, meta.get('badge', ''), f_cap_badge, (255, 255, 255))
            draw_centered_text(
                draw,
                cap_top + 94,
                meta.get('line1', ''),
                f_cap_line1,
                (255, 255, 255),
                stroke_width=3,
                stroke_fill=(0, 0, 0),
            )
            draw_centered_text(
                draw,
                cap_top + 168,
                meta.get('line2', ''),
                f_cap_line2,
                (250, 204, 21),
                stroke_width=3,
                stroke_fill=(0, 0, 0),
            )

            # 5. Bottom Bouncing Blog Sticker CTA Card (1645 ~ 1855)
            bounce_y = int(np.sin(f_idx * 0.65) * 6)
            pulse_color = (3, 199, 90) if (f_idx // 6) % 2 == 0 else (16, 185, 129)
            draw.rounded_rectangle([40, 1650 + bounce_y, 1040, 1850 + bounce_y], radius=32, fill=pulse_color, outline=(254, 240, 138), width=3)
            draw_centered_text(
                draw,
                1682 + bounce_y,
                '▶ 상단 [블로그] 스티커 누르면 구간별 금액표 3초 확인!',
                f_bot_cta,
                (255, 255, 255),
                stroke_width=2,
                stroke_fill=(0, 0, 0),
            )
            draw_centered_text(
                draw,
                1755 + bounce_y,
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

    print(f'Rendered {len(topics)} v3.1 character-composited PNG thumbnails and {len(topics)} progress-bar MP4 webtoon clips.')


if __name__ == '__main__':
    main()
