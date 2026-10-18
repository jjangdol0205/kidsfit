#!/usr/bin/env python3
"""
🏛️ [제2본부 expertise333 전용 미디어 렌더러 v4.0 — 100% 주제 일치 4컷 웹툰 클립 & 단독 캐릭터 클로즈업 썸네일]
1. 네이버 모바일 홈판(추천피드) 진입용 고해상도 1080x1080 대표 썸네일 이미지 (.png) 5종 렌더링
   - 4분할 시트 전체 축소 오류 해결 ➔ 단독 캐릭터 1컷 클로즈업 크롭(512,512,1024,1024) 적용
   - 좌측 텍스트 Auto-Fit(max_width=620px) 적용으로 우측 캐릭터 액자와 글자 겹침 0% 보장
   - 슬롯별 정확한 순위 배지(★ 전일자 경제 1위 ~ 5위) 적용
2. 요즘 유행하는 네이버 클립(Clip) 웹툰 숏폼 동영상 (1080x1920 세로형 .mp4 · 8.0초) 5종 렌더링
   - 제1본부(sns_outbox) 에어컨/그랜저 슬라이드 재사용 미스매치 완전 폐지!
   - 순수 캐릭터 원화 시트(src/assets/webtoon/*.jpg)의 4개 컷(Quadrant 1~4)을 각각 크롭하고,
     각 크리에이터 어드바이저 주제의 전용 대사(bubble1, bubble2)가 적힌 한국형 웹툰 말풍선을 직접 합성하여
     영상 제목·웹툰 말풍선·하단 자막이 100% 일치하는 무결점 클립 영상 생성!
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
WEBTOON_ART_DIR = os.path.join(ROOT_DIR, 'src', 'assets', 'webtoon')
LOGS_DIR = os.path.join(ROOT_DIR, 'logs')
CA_JSON_PATH = os.path.join(LOGS_DIR, 'creator_advisor_yesterday_keywords.json')
FONTS_DIR = os.path.join(ROOT_DIR, 'src', 'assets', 'fonts')

# Clean text-free 1024x1024 4-panel character art sheets for each of the 5 topics
CLIP_SHEET_MAP = {
    1: 'pet.jpg',       # Slot 1: 건강보험료 환급금 (병원/약국/가계부 캐릭터)
    2: 'electric.jpg',  # Slot 2: 한전 에너지캐시백 & 전기세
    3: 'telecom.jpg',   # Slot 3: 스마트초이스 통신 미환급금 & 인터넷
    4: 'auto.jpg',      # Slot 4: 위택스 자동차세 연납 & 자동차 금융
    5: 'room.jpg',      # Slot 5: 이사·신혼 가전 예산표 & 로봇청소기
}

THUMB_ART_MAP = {
    1: ('profile-avatar.jpg', 'full'),
    2: ('electric.jpg', 'q4'),
    3: ('telecom.jpg', 'q4'),
    4: ('auto.jpg', 'q4'),
    5: ('room.jpg', 'q4'),
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
    """Replace emojis that Malgun Gothic cannot render so there are zero tofu boxes."""
    if not text:
        return ''
    for bad, rep in [('🔥', '★ '), ('👆', '▶ '), ('✔', '▶ '), ('💡', '★ '), ('📌', '★ ')]:
        text = text.replace(bad, rep)
    return text


def fit_font_to_width(draw, text, max_width, start_size, min_size=22, bold=True, stroke_width=0):
    text = clean_glyphs(text)
    sz = start_size
    while sz > min_size:
        f = get_font(sz, bold=bold)
        bbox = draw.textbbox((0, 0), text, font=f, stroke_width=stroke_width)
        if (bbox[2] - bbox[0]) <= max_width:
            return f
        sz -= 2
    return get_font(min_size, bold=bold)


def draw_centered_text(draw, y, text, font, fill, width=1080, stroke_width=0, stroke_fill=(0, 0, 0)):
    text = clean_glyphs(text)
    bbox = draw.textbbox((0, 0), text, font=font, stroke_width=stroke_width)
    tw = bbox[2] - bbox[0]
    x = (width - tw) // 2
    draw.text((x, y), text, font=font, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill)


def draw_autofit_centered_text(draw, y, text, max_width, start_size, fill, canvas_width=1080, stroke_width=0, stroke_fill=(0, 0, 0), min_size=24):
    text = clean_glyphs(text)
    f = fit_font_to_width(draw, text, max_width, start_size, min_size=min_size, bold=True, stroke_width=stroke_width)
    bbox = draw.textbbox((0, 0), text, font=f, stroke_width=stroke_width)
    tw = bbox[2] - bbox[0]
    x = (canvas_width - tw) // 2
    draw.text((x, y), text, font=f, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill)


def draw_autofit_left_text(draw, x, y, text, max_width, start_size, fill, stroke_width=0, stroke_fill=(0, 0, 0), min_size=24):
    text = clean_glyphs(text)
    f = fit_font_to_width(draw, text, max_width, start_size, min_size=min_size, bold=True, stroke_width=stroke_width)
    draw.text((x, y), text, font=f, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill)


def crop_single_character_portrait(art_path, mode='q4'):
    art = Image.open(art_path).convert('RGB')
    aw, ah = art.size
    if mode == 'q4' and aw >= 900 and ah >= 900:
        # Bottom-right quadrant has a close-up single character without 2x2 grid lines
        return art.crop((aw // 2 + 12, ah // 2 + 12, aw - 12, ah - 12))
    side = min(aw, ah)
    left = (aw - side) // 2
    top = (ah - side) // 2
    return art.crop((left, top, left + side, top + side))


def render_homefeed_thumbnail_png(topic, slot, today_str, yesterday_str):
    palettes = [
        {'bg_top': (11, 17, 32), 'bg_card': (23, 37, 84), 'accent': (250, 204, 21), 'badge': (245, 158, 11)},
        {'bg_top': (6, 48, 38), 'bg_card': (12, 74, 58), 'accent': (52, 211, 153), 'badge': (16, 185, 129)},
        {'bg_top': (20, 24, 62), 'bg_card': (30, 41, 89), 'accent': (56, 189, 248), 'badge': (14, 165, 233)},
        {'bg_top': (45, 12, 78), 'bg_card': (68, 20, 110), 'accent': (251, 191, 36), 'badge': (236, 72, 153)},
        {'bg_top': (52, 12, 16), 'bg_card': (82, 20, 26), 'accent': (250, 204, 21), 'badge': (239, 68, 68)},
    ]
    pal = palettes[(slot - 1) % len(palettes)]
    rank_num = topic.get('yesterdayRank', slot)

    img = Image.new('RGB', (1080, 1080), pal['bg_top'])
    draw = ImageDraw.Draw(img)

    # Outer border frame & top visual card background
    draw.rounded_rectangle([32, 32, 1048, 1048], radius=40, outline=pal['accent'], width=7)
    draw.rounded_rectangle([60, 178, 1020, 462], radius=28, fill=pal['bg_card'], outline=(71, 85, 105), width=2)

    # 1. Single-Panel Character Close-Up on the Right Side of the Upper Card (x=748..998, y=195..445)
    art_name, crop_mode = THUMB_ART_MAP.get(slot, ('electric.jpg', 'q4'))
    art_file = os.path.join(WEBTOON_ART_DIR, art_name)
    if os.path.exists(art_file):
        try:
            char_portrait = crop_single_character_portrait(art_file, mode=crop_mode).resize(
                (250, 250), Image.Resampling.BILINEAR
            )
            img.paste(char_portrait, (748, 195))
            draw.rounded_rectangle([744, 191, 1002, 449], radius=24, outline=pal['accent'], width=5)
        except Exception:
            pass

    # Top Creator Advisor Category Pill (Left)
    draw.rounded_rectangle([60, 74, 710, 152], radius=38, fill=pal['badge'])
    draw_autofit_left_text(
        draw,
        88,
        92,
        topic.get('shortThumbBadge', '경제 트렌드 핵심 요약'),
        max_width=595,
        start_size=33,
        fill=(255, 255, 255),
        min_size=24,
    )

    # Top-Right Rank Stamp Badge (Accurate #1위 ~ #5위!)
    draw.rounded_rectangle([730, 74, 1020, 152], radius=38, fill=(220, 38, 38), outline=(254, 240, 138), width=3)
    f_stamp = get_font(30, bold=True)
    draw.text((758, 94), f'★ 전일자 경제 {rank_num}위', font=f_stamp, fill=(255, 255, 255))

    # Left Side of Upper Card: Sub-kicker + Main Hook Line 1 (Strictly bounded to max_width=620px so 0% overlap with portrait!)
    draw_autofit_left_text(
        draw,
        88,
        222,
        '▶ 2026년 모르면 손해 보는 핵심 경제 정보',
        max_width=620,
        start_size=30,
        fill=pal['accent'],
        min_size=22,
    )

    draw_autofit_left_text(
        draw,
        88,
        298,
        topic.get('shortThumbLine1', ''),
        max_width=620,
        start_size=52,
        fill=(255, 255, 255),
        stroke_width=4,
        stroke_fill=(0, 0, 0),
        min_size=34,
    )

    # Main Hook Line 2 inside High-Contrast Neon Box (Full width, auto-fitted)
    draw.rounded_rectangle([60, 490, 1020, 665], radius=32, fill=pal['accent'], outline=(255, 255, 255), width=4)
    draw_autofit_centered_text(
        draw,
        530,
        topic.get('shortThumbLine2', ''),
        max_width=900,
        start_size=70,
        fill=(11, 17, 32),
        canvas_width=1080,
        min_size=44,
    )

    # Sub-topics summary box at bottom
    draw.rounded_rectangle([60, 698, 1020, 990], radius=28, fill=(15, 23, 42), outline=pal['accent'], width=3)
    f_sub1 = get_font(36, bold=True)
    f_sub2 = get_font(29, bold=True)
    slot_sub_line2 = {
        1: '▶ 스마트폰 1분 조회 및 계좌 입금 신청 3단계 순서',
        2: '▶ 한전 에너지캐시백 신청 & 누진세 구간 절약 공식',
        3: '▶ 스마트초이스 미환급금 조회 & 위약금 손익 비교',
        4: '▶ 위택스 자동차세 연납 할인율 & 신차 금융 비교표',
        5: '▶ 예산별 황금 배분 비율 & 올인원 로청 필수 스펙 비교',
    }.get(slot, '▶ 스마트폰 1분 확인 및 핵심 체크리스트 3단계 정리')
    draw_centered_text(draw, 738, '▶ 2026년 최신 구간별 금액 비교표 & 실제 사례 수록', f_sub1, (248, 250, 252))
    draw_centered_text(draw, 812, slot_sub_line2, f_sub1, pal['accent'])
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


def build_topic_matched_webtoon_panels(topic, slot):
    """
    Build 4 custom 960x960 Korean webtoon panels directly from the 4 quadrants of the clean
    character art sheet (`src/assets/webtoon/*.jpg`) and draw a crisp comic speech bubble on each
    panel with the exact topic's `bubble1` & `bubble2` lines.
    Guarantees 100% topic match and zero leaked @moneyfit2026 watermarks!
    """
    sheet_name = CLIP_SHEET_MAP.get(slot, 'electric.jpg')
    sheet_path = os.path.join(WEBTOON_ART_DIR, sheet_name)
    if os.path.exists(sheet_path):
        sheet = Image.open(sheet_path).convert('RGB')
    else:
        sheet = Image.new('RGB', (1024, 1024), (30, 41, 59))

    sw, sh = sheet.size
    hw, hh = sw // 2, sh // 2
    quad_boxes = [
        (8, 8, hw - 8, hh - 8),
        (hw + 8, 8, sw - 8, hh - 8),
        (8, hh + 8, hw - 8, sh - 8),
        (hw + 8, hh + 8, sw - 8, sh - 8),
    ]

    clip_slides_meta = topic.get('clipSlides', [])
    panels = []

    for cut_idx in range(4):
        qbox = quad_boxes[cut_idx]
        panel = sheet.crop(qbox).resize((960, 960), Image.Resampling.BILINEAR)
        pdraw = ImageDraw.Draw(panel)

        meta = clip_slides_meta[cut_idx] if cut_idx < len(clip_slides_meta) else {}
        b1 = meta.get('bubble1') or meta.get('line1') or topic.get('shortThumbLine1', '')
        b2 = meta.get('bubble2') or meta.get('line2') or topic.get('shortThumbLine2', '')
        badge_txt = meta.get('badge', f'{cut_idx + 1}컷 핵심')

        # 1. Draw Top Comic Speech Bubble (x=54..906, y=34..228) with Tail pointing to Character
        pdraw.rounded_rectangle([54, 34, 906, 228], radius=34, fill=(255, 255, 255), outline=(15, 23, 42), width=6)
        # Speech bubble tail
        tail_x = 340 if cut_idx % 2 == 0 else 620
        pdraw.polygon(
            [(tail_x - 28, 224), (tail_x, 268), (tail_x + 28, 224)],
            fill=(255, 255, 255),
            outline=(15, 23, 42),
        )
        pdraw.line([(tail_x - 24, 224), (tail_x + 24, 224)], fill=(255, 255, 255), width=8)

        # Highlight bar behind bubble line 2
        pdraw.rounded_rectangle([96, 132, 864, 202], radius=16, fill=(254, 240, 138))

        draw_autofit_centered_text(
            pdraw,
            60,
            b1,
            max_width=780,
            start_size=42,
            fill=(15, 23, 42),
            canvas_width=960,
            min_size=26,
        )
        draw_autofit_centered_text(
            pdraw,
            142,
            b2,
            max_width=750,
            start_size=44,
            fill=(185, 28, 28) if cut_idx in (0, 2) else (4, 120, 87),
            canvas_width=960,
            min_size=26,
        )

        # 2. Draw Bottom Webtoon Panel Strip (x=36..924, y=862..934)
        pdraw.rounded_rectangle([36, 862, 924, 934], radius=20, fill=(15, 23, 42), outline=(52, 211, 153), width=3)
        f_strip = get_font(28, bold=True)
        draw_centered_text(
            pdraw,
            880,
            f'★ [{badge_txt}] {topic.get("shortThumbLine2", "")} · expertise333 경제웹툰',
            f_strip,
            (254, 240, 138),
            width=960,
        )

        panels.append(panel)

    return panels


def render_trendy_clip_mp4(topic, slot, today_str):
    slides = build_topic_matched_webtoon_panels(topic, slot)

    f_top_badge = get_font(30, bold=True)
    f_step_badge = get_font(28, bold=True)
    f_cap_badge = get_font(34, bold=True)
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

            draw_autofit_centered_text(
                draw,
                160,
                topic.get('shortThumbLine1', ''),
                max_width=940,
                start_size=48,
                fill=(255, 255, 255),
                canvas_width=1080,
                stroke_width=3,
                stroke_fill=(0, 0, 0),
                min_size=30,
            )
            draw_autofit_centered_text(
                draw,
                228,
                topic.get('shortThumbLine2', ''),
                max_width=940,
                start_size=48,
                fill=(250, 204, 21),
                canvas_width=1080,
                stroke_width=3,
                stroke_fill=(0, 0, 0),
                min_size=30,
            )

            # 2. Real-Time Neon Progress Bar (y=318..336)
            draw.rounded_rectangle([60, 318, 1020, 336], radius=9, fill=(30, 41, 59))
            bar_w = max(24, int(960 * overall_progress))
            draw.rounded_rectangle([60, 318, 60 + bar_w, 336], radius=9, fill=(52, 211, 153))

            # 3. Center Animated Webtoon Panel (Gentle 2.5% Zoom so speech bubble stays 100% inside frame)
            zoom = 1.0 + 0.025 * progress
            cw = int(960 / zoom)
            left = (960 - cw) // 2
            cropped = base_slide.crop((left, left, left + cw, left + cw)).resize((960, 960), Image.Resampling.BILINEAR)
            canvas.paste(cropped, (60, 352))
            draw.rounded_rectangle([58, 350, 1022, 1314], radius=24, outline=(255, 255, 255), width=4)

            # 4. Trendy Shorts Caption Overlay Bar with Slide-Up Pop-In Animation
            slide_up_offset = int((1.0 - min(1.0, f_idx / 4.0)) * 22)
            cap_top = 1342 + slide_up_offset
            cap_bot = 1612 + slide_up_offset
            draw.rounded_rectangle([40, cap_top, 1040, cap_bot], radius=28, fill=(15, 23, 42), outline=(52, 211, 153), width=4)
            draw.rounded_rectangle([390, cap_top + 18, 690, cap_top + 74], radius=24, fill=(16, 185, 129))
            draw_centered_text(draw, cap_top + 26, meta.get('badge', ''), f_cap_badge, (255, 255, 255))
            draw_autofit_centered_text(
                draw,
                cap_top + 94,
                meta.get('line1', ''),
                max_width=920,
                start_size=44,
                fill=(255, 255, 255),
                canvas_width=1080,
                stroke_width=3,
                stroke_fill=(0, 0, 0),
                min_size=28,
            )
            draw_autofit_centered_text(
                draw,
                cap_top + 168,
                meta.get('line2', ''),
                max_width=920,
                start_size=48,
                fill=(250, 204, 21),
                canvas_width=1080,
                stroke_width=3,
                stroke_fill=(0, 0, 0),
                min_size=28,
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

    print(f'Rendered {len(topics)} v4.0 single-character PNG thumbnails and {len(topics)} topic-matched 4-cut webtoon MP4 clips.')


if __name__ == '__main__':
    main()
