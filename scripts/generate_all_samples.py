# -*- coding: utf-8 -*-
"""
KidsFit Growth Studio - Master Sample Generator (scripts/generate_all_samples.py)
Generates all 5 tangible, high-resolution parenting samples with REAL 2.5D CHARACTER & SCENE MOTION:
  1. samples/1_blog_sample/       (blog_post_sample.md, blog_post_sample.html)
  2. samples/2_webtoon_sample/    (webtoon_cut_01~06.png [with conversational speech bubbles], webtoon_full_6cut.png, webtoon_preview.html)
  3. samples/3_cardnews_sample/   (cardnews_01~06.png [1-line concise points, large 36pt/58pt unclipped font], cardnews_preview.html)
  4. samples/4_webtoon_video_sample/webtoon_parenting_video.mp4  (1080x1920 MP4, 2.5s/cut = 15s, OpenCV 2.5D Moving Characters + Speech Bubbles)
  5. samples/5_cardnews_video_sample/cardnews_parenting_video.mp4 (1080x1920 MP4, 2.5s/cut = 15s, OpenCV 2.5D Moving Characters)
"""

import asyncio
import math
import os
import struct
import subprocess
import wave
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = Path(r"d:\사업아이템")
SAMPLES_DIR = ROOT / "samples"
BLOG_DIR = SAMPLES_DIR / "1_blog_sample"
WEBTOON_DIR = SAMPLES_DIR / "2_webtoon_sample"
WEBTOON_RAW_DIR = WEBTOON_DIR / "raw"
CARDNEWS_DIR = SAMPLES_DIR / "3_cardnews_sample"
WEBTOON_VID_DIR = SAMPLES_DIR / "4_webtoon_video_sample"
CARDNEWS_VID_DIR = SAMPLES_DIR / "5_cardnews_video_sample"

for d in [BLOG_DIR, WEBTOON_DIR, CARDNEWS_DIR, WEBTOON_VID_DIR, CARDNEWS_VID_DIR]:
    d.mkdir(parents=True, exist_ok=True)

FONT_REG_PATH = r"C:\Windows\Fonts\malgun.ttf"
FONT_BOLD_PATH = r"C:\Windows\Fonts\malgunbd.ttf"

# Fixed duration per cut: 2.5 seconds (between 2~3 seconds as requested)
CUT_DURATION_SEC = 2.5


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD_PATH if bold and os.path.exists(FONT_BOLD_PATH) else FONT_REG_PATH
    return ImageFont.truetype(path, size)


def draw_rounded_rect(draw: ImageDraw.ImageDraw, xy, radius: int, fill=None, outline=None, width: int = 1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


# ==============================================================================
# OPENCV 2.5D CHARACTER PUPPET & DYNAMIC SCENE ANIMATION ENGINE
# ==============================================================================
_GRID_SIZE = 240
_GY, _GX = np.meshgrid(
    np.linspace(0.0, 1.0, _GRID_SIZE, dtype=np.float32),
    np.linspace(0.0, 1.0, _GRID_SIZE, dtype=np.float32),
    indexing="ij",
)


def apply_puppet_warp(img_rgb: np.ndarray, bones: list) -> np.ndarray:
    """
    Applies non-rigid 2.5D skeletal/puppet mesh deformation using Gaussian RBF bones.
    Each bone is a tuple: (cx_norm, cy_norm, radius_norm, dx_pixels, dy_pixels)
    In inverse mapping for cv2.remap, to move image content by (+dx, +dy),
    we sample from (x - dx, y - dy).
    """
    H, W = img_rgb.shape[:2]
    dx_low = np.zeros((_GRID_SIZE, _GRID_SIZE), dtype=np.float32)
    dy_low = np.zeros((_GRID_SIZE, _GRID_SIZE), dtype=np.float32)

    for (cx, cy, sigma, dx, dy) in bones:
        dist2 = (_GX - cx) ** 2 + (_GY - cy) ** 2
        weight = np.exp(-dist2 / (2.0 * (sigma ** 2)))
        dx_low -= weight * float(dx)
        dy_low -= weight * float(dy)

    # Pin image borders smoothly to zero displacement so edges never tear
    edge_x = np.minimum(_GX, 1.0 - _GX) / 0.08
    edge_y = np.minimum(_GY, 1.0 - _GY) / 0.08
    edge_mask = np.clip(np.minimum(edge_x, edge_y), 0.0, 1.0)
    dx_low *= edge_mask
    dy_low *= edge_mask

    dx_full = cv2.resize(dx_low, (W, H), interpolation=cv2.INTER_CUBIC)
    dy_full = cv2.resize(dy_low, (W, H), interpolation=cv2.INTER_CUBIC)

    base_x = np.arange(W, dtype=np.float32)[None, :]
    base_y = np.arange(H, dtype=np.float32)[:, None]
    map_x = base_x + dx_full
    map_y = base_y + dy_full

    return cv2.remap(img_rgb, map_x, map_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)


def draw_heart_polygon(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float, fill_rgba):
    pts = []
    for deg in range(0, 360, 10):
        rad = math.radians(deg)
        x = 16 * (math.sin(rad) ** 3)
        y = -(13 * math.cos(rad) - 5 * math.cos(2 * rad) - 2 * math.cos(3 * rad) - math.cos(4 * rad))
        pts.append((cx + x * (size / 16.0), cy + y * (size / 16.0)))
    draw.polygon(pts, fill=fill_rgba)


def draw_sparkle_star(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float, fill_rgba):
    pts = [
        (cx, cy - r),
        (cx + r * 0.28, cy - r * 0.28),
        (cx + r, cy),
        (cx + r * 0.28, cy + r * 0.28),
        (cx, cy + r),
        (cx - r * 0.28, cy + r * 0.28),
        (cx - r, cy),
        (cx - r * 0.28, cy - r * 0.28),
    ]
    draw.polygon(pts, fill=fill_rgba)


def animate_illustration_frame(base_rgb: np.ndarray, cut_num: int, prog: float, with_bubbles: bool = False) -> Image.Image:
    """
    Produces a live-animated frame (1080x1080) for `cut_num` (1..6) at normalized progress `prog` in [0, 1].
    Combines OpenCV non-rigid character puppet movement (head nod/shake, arm/hand action, breathing)
    with dynamic scene lighting and particle effects.
    If `with_bubbles=True`, overlays the crisp conversational speech bubbles after character deformation.
    """
    t = prog * 2.0 * math.pi  # 1 full cycle = 2*pi
    H, W = base_rgb.shape[:2]
    scale = W / 1080.0

    bones = []
    if cut_num == 1:
        # Cut 1: Toddler shakes head stubbornly & pushes hand; Mother sighs & reaches hands; water puddle ripples
        bones = [
            # Toddler head shaking "싫어!" side-to-side
            (0.67, 0.48, 0.11, 20.0 * math.sin(t * 3.0) * scale, -6.0 * abs(math.sin(t * 3.0)) * scale),
            # Toddler right arm pushing away mom's hand
            (0.53, 0.55, 0.09, -22.0 * abs(math.sin(t * 2.5)) * scale, -10.0 * math.sin(t * 2.5) * scale),
            # Toddler body stubborn bounce
            (0.66, 0.68, 0.13, 8.0 * math.sin(t * 3.0) * scale, -12.0 * abs(math.sin(t * 2.0)) * scale),
            # Mother head tilting/nodding with worried sigh
            (0.43, 0.34, 0.12, -10.0 * math.sin(t * 1.5) * scale, 14.0 * math.sin(t * 1.5) * scale),
            # Mother reaching hands
            (0.54, 0.64, 0.10, 18.0 * math.sin(t * 2.0) * scale, -8.0 * math.cos(t * 2.0) * scale),
            # Spilled water ripple on floor
            (0.86, 0.89, 0.09, 14.0 * math.sin(t * 4.0) * scale, 6.0 * math.cos(t * 4.0) * scale),
        ]
    elif cut_num == 2:
        # Cut 2: Mother sighs & strokes sleeping child's blanket; sleeping child breathes; warm lamp glows
        bones = [
            # Mother head leaning forward in gentle sorrow
            (0.44, 0.34, 0.13, 8.0 * math.sin(t * 1.2) * scale, 15.0 * (0.5 - 0.5 * math.cos(t * 1.5)) * scale),
            # Mother right hand gently stroking blanket
            (0.54, 0.64, 0.10, 22.0 * math.sin(t * 2.0) * scale, 6.0 * math.cos(t * 2.0) * scale),
            # Sleeping child chest/blanket rising & falling peacefully
            (0.60, 0.72, 0.16, 0.0, -16.0 * math.sin(t * 1.5) * scale),
            # Sleeping child head subtle breathing nod
            (0.80, 0.65, 0.10, -5.0 * math.sin(t * 1.5) * scale, -7.0 * math.sin(t * 1.5) * scale),
        ]
    elif cut_num == 3:
        # Cut 3: Mother nods "Aha!" in realization; child's hand on tablet wiggles fingers; brain pulses
        bones = [
            # Mother head lifting & nodding in realization
            (0.60, 0.31, 0.14, -12.0 * math.sin(t * 2.0) * scale, 16.0 * math.sin(t * 2.5) * scale),
            # Mother ponytail swaying
            (0.83, 0.39, 0.10, 18.0 * math.cos(t * 2.0) * scale, 10.0 * math.sin(t * 2.0) * scale),
            # Mother right hand pointing/holding tablet
            (0.51, 0.71, 0.11, -14.0 * math.sin(t * 2.0) * scale, -12.0 * abs(math.sin(t * 2.0)) * scale),
            # Child's hand on tablet flexing fingers
            (0.29, 0.63, 0.10, 15.0 * math.sin(t * 3.0) * scale, -15.0 * math.cos(t * 3.0) * scale),
            # Brain illustration pulsing on tablet
            (0.40, 0.53, 0.09, 10.0 * math.cos(t * 3.0) * scale, 10.0 * math.sin(t * 3.0) * scale),
        ]
    elif cut_num == 4:
        # Cut 4: Toddler uses wooden tongs to pick up pom-pom; Mother nods warmly watching
        bones = [
            # Toddler right hand with tongs moving up & down picking pom-pom
            (0.53, 0.73, 0.11, 16.0 * math.cos(t * 2.5) * scale, -24.0 * abs(math.sin(t * 2.5)) * scale),
            # Toddler left hand holding red pom-pom
            (0.68, 0.71, 0.09, -12.0 * math.sin(t * 2.5) * scale, -10.0 * math.cos(t * 2.5) * scale),
            # Toddler head bobbing in concentration
            (0.67, 0.50, 0.12, -8.0 * math.sin(t * 2.0) * scale, 14.0 * math.sin(t * 2.5) * scale),
            # Mother head nodding proudly
            (0.43, 0.33, 0.13, 10.0 * math.sin(t * 1.5) * scale, 15.0 * math.sin(t * 2.5) * scale),
            # Mother hands clapping/encouraging
            (0.44, 0.73, 0.10, 12.0 * math.sin(t * 2.5) * scale, -10.0 * abs(math.sin(t * 2.5)) * scale),
        ]
    elif cut_num == 5:
        # Cut 5: Toddler bounces & waves pointing arm at sculpture; Mom & Dad nod; flower sculpture spins/sways
        bones = [
            # Toddler pointing arm waving up and down excitedly
            (0.66, 0.58, 0.10, 14.0 * math.cos(t * 3.0) * scale, -26.0 * math.sin(t * 3.0) * scale),
            # Toddler head & body bouncing happily
            (0.53, 0.54, 0.13, 8.0 * math.sin(t * 2.0) * scale, -18.0 * abs(math.sin(t * 2.5)) * scale),
            # Mother head nodding & smiling
            (0.38, 0.41, 0.12, 10.0 * math.sin(t * 2.0) * scale, 12.0 * math.cos(t * 2.0) * scale),
            # Father head nodding warmly
            (0.63, 0.36, 0.12, -10.0 * math.sin(t * 2.0) * scale, 12.0 * math.sin(t * 2.0) * scale),
            # Colorful flower/sun sculpture swaying in park breeze
            (0.85, 0.36, 0.14, 18.0 * math.sin(t * 2.0) * scale, 10.0 * math.cos(t * 2.0) * scale),
        ]
    else:
        # Cut 6: Mother & toddler sway in warm hug; child waves paper heart & safety scissors
        bones = [
            # Mother & toddler hugging sway
            (0.48, 0.35, 0.16, 16.0 * math.sin(t * 1.5) * scale, 10.0 * math.cos(t * 1.5) * scale),
            (0.68, 0.52, 0.15, 16.0 * math.sin(t * 1.5) * scale, -12.0 * abs(math.sin(t * 2.0)) * scale),
            # Red paper heart pulsing & waving
            (0.52, 0.71, 0.11, 14.0 * math.cos(t * 2.5) * scale, -18.0 * abs(math.sin(t * 2.5)) * scale),
            # Hand holding safety scissors waving proudly
            (0.82, 0.70, 0.11, -14.0 * math.sin(t * 2.5) * scale, -20.0 * abs(math.cos(t * 2.5)) * scale),
        ]

    warped_rgb = apply_puppet_warp(base_rgb, bones)
    pil_img = Image.fromarray(warped_rgb).convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)

    # Dynamic scene effects per cut
    if cut_num == 1:
        # Animated comic sweat drop on mom & motion lines above stubborn toddler + expanding water rings
        drop_y = int((0.31 + 0.025 * (prog * 2.0 % 1.0)) * H)
        drop_x = int(0.35 * W)
        odraw.ellipse((drop_x - 8, drop_y - 12, drop_x + 8, drop_y + 12), fill=(125, 211, 252, 210))
        # Stress/action lines above toddler's head
        for k in range(3):
            ang = -0.5 + k * 0.45
            r1 = 95 + 18 * math.sin(t * 3.0 + k)
            r2 = r1 + 28
            cx, cy = 0.67 * W, 0.42 * H
            x1, y1 = cx + math.sin(ang) * r1, cy - math.cos(ang) * r1
            x2, y2 = cx + math.sin(ang) * r2, cy - math.cos(ang) * r2
            odraw.line([(x1, y1), (x2, y2)], fill=(239, 68, 68, 190), width=5)
        # Expanding ripple on spilled water puddle
        rip_r = int((25 + 45 * ((prog * 2.0) % 1.0)) * scale)
        rip_alpha = int(190 * (1.0 - ((prog * 2.0) % 1.0)))
        wx, wy = int(0.85 * W), int(0.90 * H)
        odraw.ellipse((wx - rip_r, wy - rip_r // 2, wx + rip_r, wy + rip_r // 2), outline=(255, 255, 255, rip_alpha), width=4)

    elif cut_num == 2:
        # Pulsing warm golden lamp glow + floating sleep sparkles
        glow_r = int((110 + 25 * math.sin(t * 2.0)) * scale)
        lx, ly = int(0.70 * W), int(0.42 * H)
        odraw.ellipse((lx - glow_r, ly - glow_r, lx + glow_r, ly + glow_r), fill=(253, 224, 71, 48))
        # Animated tear drop rolling down mom's cheek
        ty = int((0.365 + 0.025 * ((prog * 1.5) % 1.0)) * H)
        tx = int(0.442 * W)
        odraw.ellipse((tx - 5, ty - 8, tx + 5, ty + 8), fill=(186, 230, 253, 220))
        # Gentle floating sleep orbs rising from sleeping child
        for i in range(3):
            p_loc = (prog + i * 0.33) % 1.0
            sx = int((0.81 + 0.03 * math.sin(p_loc * 6.0 + i)) * W)
            sy = int((0.60 - 0.14 * p_loc) * H)
            sr = int((8 + 6 * (1.0 - p_loc)) * scale)
            odraw.ellipse((sx - sr, sy - sr, sx + sr, sy + sr), fill=(254, 240, 138, int(170 * (1.0 - p_loc))))

    elif cut_num == 3:
        # Glowing neural synapse particles traveling from hand (0.29, 0.63) to brain (0.40, 0.52)
        path_pts = [
            (0.29, 0.63),
            (0.31, 0.56),
            (0.35, 0.51),
            (0.40, 0.52),
        ]
        for i in range(6):
            p_pos = (prog * 2.0 + i / 6.0) % 1.0
            seg = p_pos * (len(path_pts) - 1)
            idx = min(int(seg), len(path_pts) - 2)
            frac = seg - idx
            px = (path_pts[idx][0] * (1 - frac) + path_pts[idx + 1][0] * frac) * W
            py = (path_pts[idx][1] * (1 - frac) + path_pts[idx + 1][1] * frac) * H
            odraw.ellipse((px - 10, py - 10, px + 10, py + 10), fill=(253, 224, 71, 220))
            odraw.ellipse((px - 5, py - 5, px + 5, py + 5), fill=(255, 255, 255, 255))
        # Realization sparkles around mom
        draw_sparkle_star(odraw, 0.45 * W, 0.22 * H, (22 + 8 * math.sin(t * 3.0)) * scale, (250, 204, 21, 230))
        draw_sparkle_star(odraw, 0.74 * W, 0.19 * H, (18 + 7 * math.cos(t * 3.0)) * scale, (250, 204, 21, 210))

    elif cut_num == 4:
        # Shimmering sunbeams + concentration sparkles around the tongs & pom-poms
        for i in range(4):
            ang = i * 1.57 + t * 0.5
            sx = (0.53 + 0.09 * math.cos(ang)) * W
            sy = (0.76 + 0.06 * math.sin(ang)) * H
            r = (14 + 6 * math.sin(t * 3.0 + i)) * scale
            draw_sparkle_star(odraw, sx, sy, r, (251, 191, 36, 220))
        draw_heart_polygon(
            odraw,
            0.55 * W,
            (0.34 - 0.05 * prog) * H,
            (22 + 4 * math.sin(t * 2.0)) * scale,
            (244, 114, 182, 200),
        )

    elif cut_num == 5:
        # Sunlight rays & floating hearts/sparkles in the park
        sun_r = int((95 + 22 * math.sin(t * 2.5)) * scale)
        sx, sy = int(0.94 * W), int(0.27 * H)
        odraw.ellipse((sx - sun_r, sy - sun_r, sx + sun_r, sy + sun_r), fill=(253, 224, 71, 60))
        for i in range(4):
            p_loc = (prog + i * 0.25) % 1.0
            hx = (0.48 + 0.18 * (i % 2) + 0.03 * math.sin(p_loc * 6.0 + i)) * W
            hy = (0.42 - 0.16 * p_loc) * H
            draw_heart_polygon(odraw, hx, hy, (18 + 4 * (1 - p_loc)) * scale, (251, 113, 133, int(210 * (1 - p_loc))))

    else:
        # Cut 6: Floating warm pastel hearts & golden sparkles rising around hugging mom & child
        for i in range(6):
            p_loc = (prog + i * 0.17) % 1.0
            hx = (0.18 + 0.13 * i + 0.03 * math.sin(p_loc * 6.28 + i)) * W
            hy = (0.78 - 0.55 * p_loc) * H
            alpha = int(225 * math.sin(p_loc * math.pi))
            draw_heart_polygon(odraw, hx, hy, (22 + (i % 3) * 6) * scale, (244, 63, 94, alpha))
        draw_sparkle_star(odraw, 0.14 * W, 0.28 * H, (26 + 8 * math.sin(t * 3.0)) * scale, (250, 204, 21, 230))
        draw_sparkle_star(odraw, 0.86 * W, 0.24 * H, (24 + 8 * math.cos(t * 3.0)) * scale, (250, 204, 21, 230))

    combined = Image.alpha_composite(pil_img, overlay).convert("RGB")
    if with_bubbles:
        combined = draw_webtoon_speech_bubbles(combined, cut_num)
    return combined


# ==============================================================================
# 1. 6-CUT WEBTOON DATA & CONVERSATIONAL SPEECH BUBBLE RENDERER
# ==============================================================================
WEBTOON_CUTS = [
    {
        "num": 1,
        "raw": "cut_01.jpg",
        "tts": "아이고 물 다 쏟았네! 싫어, 내가 혼자 끼울 거야!",
        "sub": "도와주겠다는 엄마 손을 뿌리치며\n혼자 하겠다고 고집부리는 세 살 아이",
        "bubbles": [
            {
                "speaker": "엄마",
                "speaker_bg": (79, 70, 229),
                "box": (36, 36, 560, 184),
                "tail": ((370, 180), (415, 180), (425, 232)),
                "text": "아이고 지우야, 물 다 쏟았잖아…\n엄마가 단추 빨리 끼워줄게!",
                "border": (79, 70, 229),
                "fill": (255, 255, 255, 246),
            },
            {
                "speaker": "지우 (3세)",
                "speaker_bg": (225, 29, 72),
                "box": (585, 170, 1044, 318),
                "tail": ((700, 314), (745, 314), (725, 385)),
                "text": "싫어!! 엄마 가!\n내가 혼자 끼울 거야!!",
                "border": (225, 29, 72),
                "fill": (255, 250, 251, 248),
            },
        ],
    },
    {
        "num": 2,
        "raw": "cut_02.jpg",
        "tts": "내가 바빠서 늦는 걸까? 화내서 미안해 우리 아가.",
        "sub": "잠든 아이의 작은 손을 보며\n밤마다 찾아오는 엄마의 미안함",
        "bubbles": [
            {
                "speaker": "엄마의 속마음",
                "speaker_bg": (79, 70, 229),
                "box": (36, 38, 565, 186),
                "tail": ((410, 182), (455, 182), (445, 228)),
                "text": "내가 일하느라 바빠서\n우리 지우만 손끝이 늦는 걸까…",
                "border": (79, 70, 229),
                "fill": (255, 255, 255, 246),
            },
            {
                "speaker": "엄마",
                "speaker_bg": (217, 119, 6),
                "box": (36, 895, 650, 1036),
                "tail": ((400, 898), (445, 898), (440, 820)),
                "text": "아까 화내서 정말 미안해,\n잘 자 우리 아가… 사랑해♥",
                "border": (217, 119, 6),
                "fill": (255, 252, 245, 248),
            },
        ],
    },
    {
        "num": 3,
        "raw": "cut_03.jpg",
        "tts": "만 3세 고집은 두뇌와 연결된 손끝 민감기 신호였구나!",
        "sub": "반항이 아니었습니다! 두뇌와 연결된\n'손끝 소근육 민감기'의 건강한 신호",
        "bubbles": [
            {
                "speaker": "소아발달 팁",
                "speaker_bg": (5, 150, 105),
                "box": (36, 40, 520, 192),
                "tail": ((305, 188), (350, 188), (335, 420)),
                "text": "만 3세 고집은 두뇌 30%와 연결된\n'손끝 소근육 민감기' 신호예요!",
                "border": (5, 150, 105),
                "fill": (240, 253, 244, 248),
            },
            {
                "speaker": "엄마",
                "speaker_bg": (79, 70, 229),
                "box": (375, 892, 1044, 1040),
                "tail": ((660, 895), (705, 895), (675, 795)),
                "text": "아하! 엄마를 힘들게 하려는 게 아니라\n혼자 크려는 기특한 신호였구나!",
                "border": (79, 70, 229),
                "fill": (255, 255, 255, 248),
            },
        ],
    },
    {
        "num": 4,
        "raw": "cut_04.jpg",
        "tts": "천천히 해도 기다려 줄게! 엄마 봐봐요, 파란 공 집었어!",
        "sub": "비싼 전집 대신 손끝 힘을 기르는\n집게 놀이와 엄마의 다정한 기다림",
        "bubbles": [
            {
                "speaker": "엄마",
                "speaker_bg": (79, 70, 229),
                "box": (36, 36, 565, 184),
                "tail": ((410, 180), (455, 180), (445, 225)),
                "text": "옳지~ 악어 손가락으로 집어볼까?\n천천히 해도 엄마가 기다려 줄게!",
                "border": (79, 70, 229),
                "fill": (255, 255, 255, 246),
            },
            {
                "speaker": "지우 (3세)",
                "speaker_bg": (5, 150, 105),
                "box": (585, 180, 1044, 328),
                "tail": ((700, 324), (745, 324), (720, 398)),
                "text": "우와 엄마 봐봐요!\n파란 공 집었어, 진짜 재밌다!!",
                "border": (5, 150, 105),
                "fill": (240, 253, 244, 248),
            },
        ],
    },
    {
        "num": 5,
        "raw": "cut_05.jpg",
        "tts": "이 꽃은 어떤 느낌일까? 반짝반짝 따뜻해요!",
        "sub": "주말엔 눈높이 대화로 정서를 채우고\n밤 10시 깊은 숙면으로 키 성장을 지켜요",
        "bubbles": [
            {
                "speaker": "엄마 · 아빠",
                "speaker_bg": (79, 70, 229),
                "box": (36, 38, 555, 186),
                "tail": ((375, 182), (420, 182), (405, 305)),
                "text": "지우야, 이 알록달록한 꽃은\n만지면 어떤 느낌일까?",
                "border": (79, 70, 229),
                "fill": (255, 255, 255, 246),
            },
            {
                "speaker": "지우 (3세)",
                "speaker_bg": (217, 119, 6),
                "box": (420, 895, 1044, 1042),
                "tail": ((565, 898), (610, 898), (575, 830)),
                "text": "반짝반짝 따뜻해요!\n오늘 밤엔 10시에 쿨쿨 잘래요!",
                "border": (217, 119, 6),
                "fill": (255, 252, 245, 248),
            },
        ],
    },
    {
        "num": 6,
        "raw": "cut_06.jpg",
        "tts": "엄마 내가 하트 오렸어요! 고마워 우리 아가.",
        "sub": "완벽한 엄마보다 아이의 속도를 읽어주는\n다정한 엄마면 충분합니다",
        "bubbles": [
            {
                "speaker": "지우 (3세)",
                "speaker_bg": (225, 29, 72),
                "box": (540, 36, 1044, 186),
                "tail": ((735, 182), (780, 182), (755, 295)),
                "text": "엄마! 내가 혼자 가위로\n하트 오렸어요! 선물이에요!",
                "border": (225, 29, 72),
                "fill": (255, 250, 251, 248),
            },
            {
                "speaker": "엄마",
                "speaker_bg": (79, 70, 229),
                "box": (36, 892, 650, 1040),
                "tail": ((395, 895), (440, 895), (435, 815)),
                "text": "고마워 우리 아가,\n네 속도로 자라줘서 정말 고마워♥",
                "border": (79, 70, 229),
                "fill": (255, 255, 255, 248),
            },
        ],
    },
]


def draw_webtoon_speech_bubbles(img_rgb_pil: Image.Image, cut_num: int) -> Image.Image:
    """
    Draws warm, crisp Korean webtoon conversational speech bubbles with pointer tails
    and speaker badges onto a 1080x1080 webtoon illustration.
    """
    cut_data = next((c for c in WEBTOON_CUTS if c["num"] == cut_num), None)
    if not cut_data or "bubbles" not in cut_data:
        return img_rgb_pil

    base = img_rgb_pil.convert("RGBA")
    W, H = base.size
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font_text = get_font(29, bold=True)
    font_badge = get_font(20, bold=True)

    for b in cut_data["bubbles"]:
        x1, y1, x2, y2 = b["box"]
        (tb1x, tb1y), (tb2x, tb2y), (ttx, tty) = b["tail"]
        border_col = b["border"] + (255,)
        fill_col = b["fill"]
        shadow_col = (15, 23, 42, 42)

        # 1. Soft drop shadow for bubble & tail
        draw.polygon([(tb1x + 4, tb1y + 6), (tb2x + 4, tb2y + 6), (ttx + 4, tty + 6)], fill=shadow_col)
        draw.rounded_rectangle((x1 + 4, y1 + 6, x2 + 4, y2 + 6), radius=30, fill=shadow_col)

        # 2. Main bubble rounded rectangle
        draw.rounded_rectangle((x1, y1, x2, y2), radius=30, fill=fill_col, outline=border_col, width=4)

        # 3. Pointer tail polygon + outer border strokes (seamless join with bubble)
        draw.polygon([(tb1x, tb1y), (tb2x, tb2y), (ttx, tty)], fill=fill_col)
        draw.line([(tb1x, tb1y), (ttx, tty)], fill=border_col, width=4)
        draw.line([(tb2x, tb2y), (ttx, tty)], fill=border_col, width=4)
        # Erase border seam along the base of the tail inside the bubble
        seam_y_shift = -3 if tty > tb1y else 3
        draw.line([(tb1x + 3, tb1y), (tb2x - 3, tb2y)], fill=fill_col, width=6)
        draw.line([(tb1x + 3, tb1y + seam_y_shift), (tb2x - 3, tb2y + seam_y_shift)], fill=fill_col, width=6)

        # 4. Centered multi-line conversational dialogue text inside bubble
        lines = b["text"].split("\n")
        line_gap = 42
        total_text_h = len(lines) * line_gap
        cur_y = y1 + (y2 - y1 - total_text_h) // 2
        for line in lines:
            l_bbox = draw.textbbox((0, 0), line, font=font_text)
            lw = l_bbox[2] - l_bbox[0]
            lh = l_bbox[3] - l_bbox[1]
            tx = x1 + (x2 - x1 - lw) // 2 - l_bbox[0]
            ty = cur_y + (line_gap - lh) // 2 - l_bbox[1]
            draw.text((tx, ty), line, font=font_text, fill=(15, 23, 42, 255))
            cur_y += line_gap

    return Image.alpha_composite(base, overlay).convert("RGB")


def render_webtoon_samples():
    print("🎨 [Sample 2] 6컷 양육 공감 웹툰 렌더링 중 (캐릭터 대화형 말풍선 포함)...")
    cut_images = []
    W, H = 1080, 1080

    for c in WEBTOON_CUTS:
        raw_path = WEBTOON_RAW_DIR / c["raw"]
        art = Image.open(raw_path).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
        canvas = draw_webtoon_speech_bubbles(art, c["num"])

        out_path = WEBTOON_DIR / f"webtoon_cut_0{c['num']}.png"
        canvas.save(out_path, "PNG", optimize=True)
        cut_images.append(canvas)

    # Combine into full vertical strip
    strip_w = W
    strip_h = H * len(cut_images)
    strip = Image.new("RGB", (strip_w, strip_h), (250, 248, 245))
    for idx, img in enumerate(cut_images):
        strip.paste(img, (0, idx * H))
    strip.save(WEBTOON_DIR / "webtoon_full_6cut.png", "PNG", optimize=True)

    # Create clean HTML preview viewer
    html = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[웹툰 샘플] 퇴근 후 매일 미안한 워킹맘, 만 3세 고집의 진짜 이유 (6컷 육아웹툰)</title>
  <style>
    body { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; background: #FAF8F5; color: #1E293B; margin: 0; padding: 2rem 1rem; }
    .container { max-width: 720px; margin: 0 auto; background: #FFFFFF; border-radius: 28px; padding: 2rem; box-shadow: 0 12px 32px rgba(20,30,55,0.06); }
    h1 { font-size: 1.55rem; line-height: 1.35; margin: 0 0 1.5rem 0; text-align: center; }
    .cut-card { margin-bottom: 1.5rem; border-radius: 20px; overflow: hidden; }
    .cut-card img { width: 100%; display: block; }
    .cta-box { background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 20px; padding: 1.5rem; text-align: center; margin-top: 2rem; }
    .btn { display: inline-block; background: #4F46E5; color: #FFFFFF; font-weight: 800; padding: 0.85rem 1.5rem; border-radius: 9999px; text-decoration: none; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>“내가 다 할 거야!” 만 3세 아이의 고집, 사실은 '손끝 소근육 민감기' 신호였습니다</h1>
    <div class="cut-card"><img src="webtoon_cut_01.png" alt="웹툰 1컷"></div>
    <div class="cut-card"><img src="webtoon_cut_02.png" alt="웹툰 2컷"></div>
    <div class="cut-card"><img src="webtoon_cut_03.png" alt="웹툰 3컷"></div>
    <div class="cut-card"><img src="webtoon_cut_04.png" alt="웹툰 4컷"></div>
    <div class="cut-card"><img src="webtoon_cut_05.png" alt="웹툰 5컷"></div>
    <div class="cut-card"><img src="webtoon_cut_06.png" alt="웹툰 6컷"></div>
    <div class="cta-box">
      <h3 style="margin: 0 0 0.4rem 0; color: #065F46;">🎬 캐릭터가 살아 움직이는 15초(컷당 2.5초) 애니메이션 영상 샘플도 확인해보세요!</h3>
      <a class="btn" href="../4_webtoon_video_sample/webtoon_parenting_video.mp4">▶ 움직이는 웹툰 영상 샘플 재생하기 (15초)</a>
      <a class="btn" style="background: #059669; margin-left: 0.5rem;" href="../../index.html">🏠 키즈핏 그로스 스튜디오 홈으로</a>
    </div>
  </div>
</body>
</html>"""
    (WEBTOON_DIR / "webtoon_preview.html").write_text(html, encoding="utf-8")
    print("✅ [Sample 2] 대화형 말풍선 6컷 웹툰 PNG 6장 + 합본 + HTML 뷰어 생성 완료!")


# ==============================================================================
# 2. 6-CUT CARD NEWS DATA & RENDERER (1-LINE CONCISE COPY, LARGE UNCLIPPED FONT)
# ==============================================================================
CARDNEWS_SLIDES = [
    {
        "num": 1,
        "cut_num": 1,
        "title": "“내가 혼자 할 거야!”\n만 3세 고집의 진짜 이유",
        "subtitle": "혼내기 전에 꼭 알아야 할 두뇌 발달의 비밀",
        "accent": (79, 70, 229),
        "bg_tint": (238, 242, 255),
        "raw_bg": "cut_01.jpg",
        "points": [
            "① 반항이 아닌 ‘손끝 소근육 민감기’",
            "② 비싼 교구 대신 ‘거실 0원 놀이’",
            "③ 낮의 몰입이 ‘밤 10시 키성장’ 연결",
        ],
        "tts": "만 3세 아이의 고집, 혼내면 안 되는 진짜 이유!",
        "sub": "“내가 혼자 할 거야!” 만 3세 아이의 고집,\n혼내기 전에 꼭 알아야 할 발달과 성장의 비밀",
    },
    {
        "num": 2,
        "cut_num": 3,
        "title": "손가락은 ‘제2의 뇌’\n뇌 운동피질 30% 연결",
        "subtitle": "만 24~47개월에 찾아오는 결정적 손끝 성장기",
        "accent": (5, 150, 105),
        "bg_tint": (236, 253, 245),
        "raw_bg": "cut_03.jpg",
        "points": [
            "① 대뇌 운동피질 30%가 손끝에 집중",
            "② 엄지·검지·중지 세 손가락 협응 완성",
            "③ 스스로 해보는 과정이 전두엽을 자극",
        ],
        "tts": "손가락은 제2의 뇌! 운동피질의 30퍼센트가 연결됩니다.",
        "sub": "손가락은 제2의 뇌! 뇌 운동피질의 30%가 연결된\n세 손가락 협응의 결정적 민감기입니다.",
    },
    {
        "num": 3,
        "cut_num": 2,
        "title": "만 3세에 비싼 가베?\n시기 안 맞으면 방치템!",
        "subtitle": "내 아이 개월 수에 맞는 교구 순서가 핵심",
        "accent": (249, 115, 22),
        "bg_tint": (255, 247, 237),
        "raw_bg": "cut_02.jpg",
        "points": [
            "① 만 2~3세: 손끝 힘 기르는 일상교구",
            "② 만 4~5세: 입체 공간지각 은물·가베",
            "③ 손끝 악력이 먼저 잡혀야 흥미 지속",
        ],
        "tts": "만 3세엔 일상 소근육 놀이가 먼저, 가베는 만 4세 이후에!",
        "sub": "만 2~3세는 손끝 힘을 기르는 일상 소근육 놀이가 먼저!\n가베는 만 4세 이후에 시작해야 중복 지출을 막습니다.",
    },
    {
        "num": 4,
        "cut_num": 4,
        "title": "장난감 사기 전 시작하는\n우리 집 ‘0원 놀이 3선’",
        "subtitle": "오늘 저녁 주방 서랍 소품으로 하루 15분!",
        "accent": (79, 70, 229),
        "bg_tint": (238, 242, 255),
        "raw_bg": "cut_04.jpg",
        "points": [
            "① 나무 빨래집게 찍기 (손끝 악력 강화)",
            "② 물티슈 캡에 병뚜껑 넣기 (눈손 협응)",
            "③ 다 쓴 휴지심 가위 오리기 (성취감)",
        ],
        "tts": "빨래집게와 휴지심으로 오늘 저녁 0원 놀이를 시작해 보세요!",
        "sub": "나무 빨래집게, 페트병 뚜껑, 다 쓴 휴지심으로\n오늘 저녁 15분 '거실 0원 소근육 놀이'를 시작해보세요.",
    },
    {
        "num": 5,
        "cut_num": 5,
        "title": "낮에 손끝을 쓴 아이가\n밤 10시 숨은 키도 쑥!",
        "subtitle": "깊은 숙면과 자연식 영양의 키 성장 시너지",
        "accent": (5, 150, 105),
        "bg_tint": (236, 253, 245),
        "raw_bg": "cut_05.jpg",
        "points": [
            "① 밤 10시~2시 성장호르몬 65% 분비",
            "② 우유 배앓이엔 잔멸치·두부·치즈 대체",
            "③ 거북목 예방 & 하루 10분 점프 스트레칭",
        ],
        "tts": "밤 10시 깊은 숙면과 자연식 칼슘으로 숨은 키를 깨워주세요!",
        "sub": "밤 10시 깊은 숙면과 자연식 칼슘·바른 자세로\n우리 아이 숨은 키 7cm를 지켜주세요.",
    },
    {
        "num": 6,
        "cut_num": 6,
        "title": "아이의 속도를 읽어주는\n다정한 엄마면 충분해요",
        "subtitle": "우리 아이 성장·발달·주말 나들이 1분 진단",
        "accent": (79, 70, 229),
        "bg_tint": (238, 242, 255),
        "raw_bg": "cut_06.jpg",
        "points": [
            "① 우리 아이 키·몸무게 백분위 & 예상키",
            "② 월령별 6각 발달 밸런스 & 0원 놀이",
            "③ 내 지역 × 관심사 주말 미술관 코스",
        ],
        "tts": "아이의 속도를 읽어주는 다정한 엄마, 키즈핏이 함께합니다.",
        "sub": "아이의 성장 속도를 읽어주는 다정한 나침반,\n키즈핏 그로스 스튜디오에서 맞춤 가이드를 확인하세요.",
    },
]


def render_single_cardnews_frame(s: dict, animated_art_pil: Image.Image = None) -> Image.Image:
    W, H = 1080, 1350
    font_title = get_font(60, bold=True)
    font_sub = get_font(34, bold=True)
    font_point = get_font(38, bold=True)

    # Full-bleed background with ZERO outer whitespace margin
    canvas = Image.new("RGB", (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)
    acc = s["accent"]
    tint = s["bg_tint"]

    # Top Header Band (Full-bleed 0..W)
    draw.rectangle((0, 0, W, 240), fill=tint)
    draw.line([(0, 240), (W, 240)], fill=acc, width=4)

    # Main Headline (2 concise lines, 60pt bold, centered horizontally, zero clipping)
    ty = 26
    for line in s["title"].split("\n"):
        t_bbox = draw.textbbox((0, 0), line, font=font_title)
        tw = t_bbox[2] - t_bbox[0]
        tx = (W - tw) // 2 - t_bbox[0]
        draw.text((tx, ty - t_bbox[1]), line, font=font_title, fill=(15, 23, 42))
        ty += 76

    # Subtitle (strictly 1 concise line, 34pt bold, centered horizontally)
    ty += 8
    sub_line = s["subtitle"].replace("\n", " ")
    s_bbox = draw.textbbox((0, 0), sub_line, font=font_sub)
    sw = s_bbox[2] - s_bbox[0]
    sx = (W - sw) // 2 - s_bbox[0]
    draw.text((sx, ty - s_bbox[1]), sub_line, font=font_sub, fill=acc)

    # Full-Bleed Center Visual Illustration (Zero Left/Right Margin: x=0..W, y=240..945)
    if animated_art_pil is not None:
        art = animated_art_pil
    else:
        raw_path = WEBTOON_RAW_DIR / s["raw_bg"]
        art = Image.open(raw_path).convert("RGB")

    vw, vh = W, 705
    vy = 240
    art_ratio = art.width / art.height
    box_ratio = vw / vh
    if art_ratio > box_ratio:
        nh = vh
        nw = int(nh * art_ratio)
    else:
        nw = vw
        nh = int(nw / art_ratio)
    art_r = art.resize((nw, nh), Image.Resampling.BILINEAR)
    crop_l = (nw - vw) // 2
    crop_t = (nh - vh) // 2
    art_c = art_r.crop((crop_l, crop_t, crop_l + vw, crop_t + vh))
    canvas.paste(art_c, (0, vy))
    draw.line([(0, vy + vh), (W, vy + vh)], fill=acc, width=4)

    # 3 Key Points at bottom: Full-width edge-to-edge bands (y=945..1350, 135px each, zero outer margin)
    py = 945
    box_h = 135
    for idx, pt in enumerate(s["points"]):
        band_bg = tint if idx % 2 == 0 else (255, 255, 255)
        draw.rectangle((0, py, W, py + box_h), fill=band_bg)
        if idx < 2:
            draw.line([(0, py + box_h), (W, py + box_h)], fill=acc, width=3)
        p_bbox = draw.textbbox((0, 0), pt, font=font_point)
        pw = p_bbox[2] - p_bbox[0]
        ph = p_bbox[3] - p_bbox[1]
        px = (W - pw) // 2 - p_bbox[0]
        pty = py + (box_h - ph) // 2 - p_bbox[1]
        draw.text((px, pty), pt, font=font_point, fill=(15, 23, 42))
        py += box_h

    return canvas


def render_cardnews_samples():
    print("📊 [Sample 3] 6컷 양육 카드뉴스 렌더링 중 (한줄 요약 & 큰 글씨 완벽 정렬)...")
    for s in CARDNEWS_SLIDES:
        canvas = render_single_cardnews_frame(s, animated_art_pil=None)
        out_path = CARDNEWS_DIR / f"cardnews_0{s['num']}.png"
        canvas.save(out_path, "PNG", optimize=True)

    # Create clean HTML preview for Card News
    html = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[카드뉴스 샘플] 만 3세 아이의 고집, 혼내면 안 되는 진짜 이유 (6컷 카드뉴스)</title>
  <style>
    body { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; background: #FAF8F5; color: #1E293B; margin: 0; padding: 2rem 1rem; }
    .container { max-width: 980px; margin: 0 auto; background: #FFFFFF; border-radius: 28px; padding: 2rem; box-shadow: 0 12px 32px rgba(20,30,55,0.06); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1.25rem; margin-top: 1.5rem; }
    .card { border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 14px rgba(0,0,0,0.04); }
    .card img { width: 100%; display: block; }
    .cta-box { background: #EEF2FF; border: 1.5px solid #C7D2FE; border-radius: 20px; padding: 1.5rem; text-align: center; margin-top: 2rem; }
    .btn { display: inline-block; background: #4F46E5; color: #FFFFFF; font-weight: 800; padding: 0.85rem 1.5rem; border-radius: 9999px; text-decoration: none; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="margin: 0 0 0.5rem 0;">“내가 혼자 할 거야!” 만 3세 아이의 고집, 혼내면 안 되는 진짜 이유</h1>
    <div class="grid">
      <div class="card"><img src="cardnews_01.png" alt="카드뉴스 1"></div>
      <div class="card"><img src="cardnews_02.png" alt="카드뉴스 2"></div>
      <div class="card"><img src="cardnews_03.png" alt="카드뉴스 3"></div>
      <div class="card"><img src="cardnews_04.png" alt="카드뉴스 4"></div>
      <div class="card"><img src="cardnews_05.png" alt="카드뉴스 5"></div>
      <div class="card"><img src="cardnews_06.png" alt="카드뉴스 6"></div>
    </div>
    <div class="cta-box">
      <h3 style="margin: 0 0 0.4rem 0; color: #312E81;">🎬 캐릭터가 살아 움직이는 15초(컷당 2.5초) 카드뉴스 영상 샘플도 확인해보세요!</h3>
      <a class="btn" href="../5_cardnews_video_sample/cardnews_parenting_video.mp4">▶ 움직이는 카드뉴스 영상 샘플 재생하기 (15초)</a>
      <a class="btn" style="background: #059669; margin-left: 0.5rem;" href="../../index.html">🏠 키즈핏 그로스 스튜디오 홈으로</a>
    </div>
  </div>
</body>
</html>"""
    (CARDNEWS_DIR / "cardnews_preview.html").write_text(html, encoding="utf-8")
    print("✅ [Sample 3] 6컷 카드뉴스 PNG 6장 + HTML 뷰어 생성 완료!")


# ==============================================================================
# 3. SYNTHESIZE WARM ACOUSTIC BGM WAV & SHORT TTS + BUILD 2.5s/CUT MOVING VIDEOS
# ==============================================================================
def generate_warm_music_wav(wav_path: Path, duration_sec: float, sample_rate: int = 44100):
    """Generates a gentle, warm music-box / electric-piano chord progression WAV."""
    chords = [
        [261.63, 329.63, 392.00, 493.88],  # Cmaj7
        [220.00, 261.63, 329.63, 392.00],  # Am7
        [174.61, 220.00, 261.63, 349.23],  # Fmaj7
        [196.00, 246.94, 293.66, 392.00],  # G6
    ]
    total_samples = int(duration_sec * sample_rate)
    beat_sec = 1.25

    with wave.open(str(wav_path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)

        frames = bytearray()
        for i in range(total_samples):
            t = i / sample_rate
            chord_idx = int(t // beat_sec) % len(chords)
            local_t = t % beat_sec
            chord = chords[chord_idx]

            env = math.exp(-local_t * 1.4) * min(1.0, local_t / 0.05)
            val = 0.0
            for idx, freq in enumerate(chord):
                val += math.sin(2.0 * math.pi * freq * t) * 0.22 * env
                arp_offset = idx * 0.25
                if local_t >= arp_offset:
                    at = local_t - arp_offset
                    a_env = math.exp(-at * 2.5) * min(1.0, at / 0.03)
                    val += math.sin(2.0 * math.pi * (freq * 2.0) * t) * 0.12 * a_env

            master = 0.18
            if t < 0.5:
                master *= t / 0.5
            elif duration_sec - t < 0.8:
                master *= max(0.0, (duration_sec - t) / 0.8)

            sample = int(max(-1.0, min(1.0, val * master)) * 32767)
            frames.extend(struct.pack("<h", sample))

        wf.writeframes(frames)


async def synthesize_tts_clips(items, out_dir: Path, prefix: str, target_dur: float = CUT_DURATION_SEC):
    import urllib.parse
    import urllib.request

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    wav_files = []
    durations = []

    for item in items:
        num = item["num"]
        mp3_path = out_dir / f"{prefix}_tts_0{num}.mp3"
        wav_path = out_dir / f"{prefix}_tts_0{num}.wav"

        q = urllib.parse.quote(item["tts"])
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q={q}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        mp3_bytes = urllib.request.urlopen(req, timeout=15).read()
        mp3_path.write_bytes(mp3_bytes)

        # Fit each cut's audio to exactly `target_dur` (2.5s) using atempo + apad + atrim
        subprocess.run(
            [
                ffmpeg_exe, "-y", "-i", str(mp3_path),
                "-af", f"atempo=1.28,apad=whole_dur={target_dur},atrim=0:{target_dur}",
                "-ar", "44100", "-ac", "1",
                str(wav_path)
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        wav_files.append(wav_path)
        durations.append(target_dur)
        mp3_path.unlink(missing_ok=True)

    return wav_files, durations


def build_vertical_video(
    items,
    wav_files,
    durations,
    out_mp4_path: Path,
    header_title_text: str,
    accent_rgb=(79, 70, 229),
    is_webtoon: bool = False,
):
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    work_dir = out_mp4_path.parent

    # 1. Concatenate voice WAVs and mix with warm BGM WAV
    concat_voice_wav = work_dir / "voice_concat.wav"
    with wave.open(str(concat_voice_wav), "w") as out_wf:
        out_wf.setnchannels(1)
        out_wf.setsampwidth(2)
        out_wf.setframerate(44100)
        for wf_path in wav_files:
            with wave.open(str(wf_path), "r") as in_wf:
                out_wf.writeframes(in_wf.readframes(in_wf.getnframes()))

    total_dur = sum(durations)
    bgm_wav = work_dir / "warm_bgm.wav"
    generate_warm_music_wav(bgm_wav, total_dur + 0.2, 44100)

    mixed_audio_aac = work_dir / "mixed_audio.m4a"
    subprocess.run(
        [
            ffmpeg_exe, "-y",
            "-i", str(concat_voice_wav),
            "-i", str(bgm_wav),
            "-filter_complex", "[0:a]volume=1.15[v];[1:a]volume=0.35[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2[aout]",
            "-map", "[aout]",
            "-c:a", "aac", "-b:a", "192k",
            str(mixed_audio_aac)
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # 2. Render 1080x1920 vertical video frames @ 24fps with OpenCV 2.5D Moving Character Animation
    fps = 24
    VW, VH = 1080, 1920
    font_top_title = get_font(40, bold=True)
    font_sub = get_font(33, bold=True)

    cmd = [
        ffmpeg_exe, "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{VW}x{VH}",
        "-pix_fmt", "rgb24",
        "-r", str(fps),
        "-i", "-",
        "-i", str(mixed_audio_aac),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "16",
        "-c:a", "copy",
        "-shortest",
        "-movflags", "+faststart",
        str(out_mp4_path)
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    elapsed_global = 0.0
    for idx, (item, dur) in enumerate(zip(items, durations)):
        raw_path = WEBTOON_RAW_DIR / (item["raw"] if is_webtoon else item["raw_bg"])
        raw_pil = Image.open(raw_path).convert("RGB").resize((1080, 1080), Image.Resampling.LANCZOS)
        base_rgb = np.array(raw_pil)
        cut_num = item["num"] if is_webtoon else item.get("cut_num", item["num"])

        n_frames = max(1, int(round(dur * fps)))

        for f_idx in range(n_frames):
            prog = f_idx / float(max(1, n_frames - 1))
            global_prog = (elapsed_global + (f_idx / fps)) / max(0.1, total_dur)

            # Generate live 2.5D character & scene animation frame
            animated_art = animate_illustration_frame(base_rgb, cut_num, prog, with_bubbles=is_webtoon)

            frame = Image.new("RGB", (VW, VH), (250, 248, 245))
            draw = ImageDraw.Draw(frame)

            # Clean Title at top
            bbox_t = draw.textbbox((0, 0), header_title_text, font=font_top_title)
            tw = bbox_t[2] - bbox_t[0]
            draw.text(((VW - tw) // 2, 95), header_title_text, font=font_top_title, fill=(15, 23, 42))

            if is_webtoon:
                card_w, card_h = 992, 992
                card_y = 260
                src_img = animated_art
            else:
                card_w, card_h = 992, 1240
                card_y = 190
                src_img = render_single_cardnews_frame(item, animated_art_pil=animated_art)

            zoom = 1.0 + 0.03 * prog
            zw, zh = int(card_w * zoom), int(card_h * zoom)
            resized = src_img.resize((zw, zh), Image.Resampling.BILINEAR)
            cx = (zw - card_w) // 2
            cy = (zh - card_h) // 2
            cropped = resized.crop((cx, cy, cx + card_w, cy + card_h))
            frame.paste(cropped, (44, card_y))
            draw_rounded_rect(draw, (44, card_y, 44 + card_w, card_y + card_h), radius=28, outline=accent_rgb, width=3)

            # Subtitle Box at bottom
            sub_y1 = 1330 if is_webtoon else 1485
            sub_y2 = sub_y1 + 240
            draw_rounded_rect(draw, (44, sub_y1, VW - 44, sub_y2), radius=28, fill=(15, 23, 42), outline=accent_rgb, width=3)
            sub_lines = item["sub"].split("\n")
            sy = sub_y1 + (60 if len(sub_lines) == 2 else 90)
            for sline in sub_lines:
                bbox = draw.textbbox((0, 0), sline, font=font_sub)
                lw = bbox[2] - bbox[0]
                draw.text(((VW - lw) // 2, sy), sline, font=font_sub, fill=(255, 255, 255))
                sy += 54

            # Progress bar
            pb_y = sub_y2 + 45
            draw_rounded_rect(draw, (44, pb_y, VW - 44, pb_y + 18), radius=9, fill=(226, 232, 240))
            bar_w = int((VW - 88) * min(1.0, global_prog))
            if bar_w > 12:
                draw_rounded_rect(draw, (44, pb_y, 44 + bar_w, pb_y + 18), radius=9, fill=accent_rgb)

            proc.stdin.write(frame.tobytes())

        elapsed_global += dur

    proc.stdin.close()
    proc.wait()

    # Clean up temp audio files
    concat_voice_wav.unlink(missing_ok=True)
    bgm_wav.unlink(missing_ok=True)
    mixed_audio_aac.unlink(missing_ok=True)
    for wf in wav_files:
        wf.unlink(missing_ok=True)


# ==============================================================================
# 4. SAMPLE 1: AUTHORITATIVE PARENTING BLOG COLUMN (MD + HTML)
# ==============================================================================
def generate_blog_sample():
    print("📝 [Sample 1] 최고 퀄리티 양육 블로그 칼럼 샘플 생성 중...")
    md_content = """# [소아성장·발달 칼럼] "내가 다 할 거야!" 만 3세 아이의 고집, 혼내기 전에 꼭 알아야 할 '손끝 소근육 민감기'와 밤 10시 성장의 비밀

> **🏛️ 국가 표준 데이터 기반 양육 가이드**
> 본 칼럼은 **보건복지부·질병관리청 『한국 영유아 발달선별검사(K-DST)』**, **질병관리청 『소아청소년 성장도표(KDCA)』**, **보건복지부·한국영양학회 『한국인 영양소 섭취기준(KDRIs)』**, 그리고 **대한소아내분비학회**의 공식 가이드라인을 바탕으로 작성된 학부모 양육 지원 칼럼입니다.

---

## 1. 퇴근 후 현관에서 시작되는 단추 씨름, 왜 이토록 눈물이 날까요?

퇴근하고 돌아와 저녁밥을 올려놓아야 하는 바쁜 저녁 7시.
어린이집 가방을 내려놓기도 전에 세 살배기 아이가 조그만 손으로 외투 단추를 붙잡고 소리칩니다.

*"싫어! 엄마 가! 내가 혼자 할 거야!!"*

마음은 급한데 아이는 10분째 단추 구멍 하나를 끼우지 못해 낑낑대고, 급기야 식탁 위 물컵까지 혼자 따르겠다며 바지에 물을 다 쏟아버립니다. 결국 참았던 한숨이 터져 나오며 *"아이고, 엄마 바쁜데 가만히 좀 있어!"* 하고 큰소리를 내고 말지요.

그날 밤, 곤히 잠든 아이의 작고 통통한 손을 쓰다듬으며 엄마는 또 자책합니다.
*'낮에 어린이집 선생님도 지우가 가위질할 때 손끝 힘이 조금 부족하다고 하셨는데... 내가 일하느라 바빠서 우리 아이만 늦는 걸까?'*

만약 오늘 밤 같은 마음으로 스마트폰 검색창을 열어보셨다면, 먼저 어머니의 잘못이 전혀 아니라는 말씀부터 드리고 싶습니다. **만 2~4세(24~47개월) 아이가 유독 "내가 혼자 할 거야!"라며 고집을 부리는 것은 엄마를 힘들게 하려는 반항이 아니라, 아이의 전두엽이 보내는 가장 건강한 '손끝 소근육 민감기' 신호이기 때문입니다.**

---

## 2. 손가락은 '제2의 뇌' — 보건복지부 K-DST가 말하는 36개월의 비밀

캐나다의 신경외과 의사 와일더 펜필드(Wilder Penfield) 박사가 밝혀낸 인간의 뇌 지도(**호문쿨루스, Homunculus**)를 보면 놀라운 사실을 발견할 수 있습니다. 우리 몸의 움직임을 관장하는 **대뇌 운동피질 전체 면적의 무려 30% 이상이 '손과 손가락'에 배정**되어 있습니다.

즉, 아이가 손끝으로 단추를 만지작거리고, 집게로 콩을 집고, 종이를 오리는 순간 아이의 대뇌 전두엽 시냅스는 불꽃처럼 연결되고 있는 것입니다.

### 📊 보건복지부 영유아 발달선별검사(K-DST) 만 2~3세 핵심 발달 이정표 점검표

| 발달 영역 (K-DST 6대 영역) | 만 24~35개월 핵심 이정표 | 만 36~47개월 핵심 이정표 |
| :--- | :--- | :--- |
| **✂️ 소근육 운동 (Fine Motor)** | 책장을 한 장씩 넘기고, 작은 구슬에 끈을 꿴다 | **안전가위로 종이를 자르고, 엄지·검지·중지 '삼지창 파지'가 형성된다** |
| **🧩 인지 발달 (Cognitive)** | 크고 작음, 같고 다름을 변별하고 도형 판을 맞춘다 | **부분을 보고 전체를 유추하며 원·네모를 모방해 그린다** |
| **🗣️ 언어 발달 (Language)** | 3~4단어 문장으로 자신의 요구를 표현한다 | **“왜?”, “어떻게?” 질문을 쏟아내며 과거 경험을 이야기한다** |
| **👕 자조 행동 (Self-care)** | 혼자 숟가락질을 시도하고 양말을 벗는다 | **큰 단추를 스스로 끼우고 풀며 혼자 손을 씻는다** |

이 시기의 아이가 어설픈 손짓으로 "내가 할 거야!"라고 외치는 것은 **"엄마, 지금 내 뇌 속의 손가락 시냅스를 연결해야 해요! 내가 스스로 해볼 수 있게 딱 3분만 기다려 주세요!"**라고 말하는 것과 같습니다.

---

## 3. 비싼 150만 원 교구 전집 사기 전! 오늘 저녁 주방 서랍으로 시작하는 '0원 일상 놀이 3선'

소근육이 걱정된다고 해서 덜컥 수백만 원짜리 가베(은물) 전집부터 결제하실 필요가 전혀 없습니다. 오히려 손끝 악력이 완성되지 않은 만 2~3세에게 작고 미끄러운 3차원 기하 도형(가베)을 주면, 블록이 자꾸 무너져 아이는 좌절하고 교구는 거실 구석의 방치템이 되기 쉽습니다.

| 구분 | 몬테소리 일상·감각 영역 | 프뢰벨 은물 / 가베 영역 |
| :--- | :--- | :--- |
| **권장 시작 월령** | **만 2~3세 (24~47개월) 최적** | **만 4~5세 (48~71개월) 최적** |
| **핵심 발달 목표** | 손끝 삼지창 악력, 눈-손 협응, 자조 자립심 | 3차원 입체 공간지각, 도형의 분할과 합성 |
| **지갑 지킴이 조언** | 집안 일상 도구와 핀셋·원기둥 소품만으로 충분 | 손끝 힘이 완성된 만 4세 이후 도입해야 효과 200% |

교구를 사기 전에 **오늘 저녁 거실에서 돈 한 푼 들이지 않고 시작할 수 있는 '0원 일상 소근육 놀이 3선'**을 먼저 실천해 보세요:

1. **🏠 나무 빨래집게 '악어 손가락' 놀이 (하루 10분)**:
   - 다 쓴 두부 용기나 종이접시 테두리에 나무 빨래집게를 꽂고 빼는 놀이입니다. 엄지와 검지에 힘을 주는 과정이 향후 바른 연필 파지법과 가위질 근육을 직결시켜 줍니다.
2. **🏠 물티슈 캡 & 페트병 뚜껑 저금통 놀이**:
   - 빈 상자에 다 쓴 물티슈 뚜껑을 붙여주고, 그 안으로 큼직한 우유병·페트병 뚜껑을 밀어 넣게 해주세요. 눈과 손의 정교한 협응력이 몰라보게 좋아집니다.
3. **🏠 다 쓴 휴지심 '사자 갈기' 안전가위 오리기**:
   - 얇은 종이는 흐물거려서 처음 가위질하는 아이가 오리기 어렵습니다. 적당히 도톰한 **휴지심 끝을 1cm 간격으로 톡톡 오려 사자 갈기**를 만들게 해주면 아이가 성취감을 느끼며 까르르 웃습니다.

> **💬 아이의 자존감을 살리는 엄마의 대화 처방 (Before & After)**
> - ❌ **Before**: *"답답해, 이리 줘 봐! 엄마가 빨리 단추 채워줄게!"*
> - ⭕ **After**: *"우리 OO이가 스스로 단추를 끼워보고 싶었구나! 엄지랑 검지 악어 손가락으로 단추 끝을 꼭 잡고 구멍으로 쏙 밀어 넣어볼까? 엄마가 옆에서 응원하며 기다려 줄게!"*

---

## 4. 낮에 손끝을 쓴 아이가 밤 10시 '숨은 키 7cm'도 자랍니다

소근육과 두뇌 발달만큼이나 부모님들이 놓치지 말아야 할 것이 바로 **신체 성장 골든타임**입니다.
**대한소아내분비학회**와 **미국수면재단(NSF)**의 연구에 따르면, 낮 동안 손끝과 신체를 충분히 움직이며 몰입한 아이는 밤에 뇌파가 안정되어 **깊은 서파수면(Slow-Wave Sleep)**에 훨씬 빠르게 진입합니다. 그리고 하루 성장호르몬(GH)의 **65~70%는 바로 밤 10시~새벽 2시 깊은 서파수면 구간**에 집중 분비됩니다.

### 🥗 보건복지부 한국인 영양소 섭취기준(KDRIs) 연령별 1일 권장량 & 집밥 식단표

| 연령 기준 (KDRIs 2020) | 일일 칼슘 권장량 | 일일 비타민D / 단백질 | 우유 배앓이 없는 자연식 밥상 1일 환산 예시 |
| :--- | :--- | :--- | :--- |
| **만 1~2세 (12~35개월)** | **500 mg / 일** | 400 IU / 20 g | 아기치즈 1장(130mg) + 두부 반 모(140mg) + 잔멸치 다짐 1큰술(120mg) + 플레인 요거트 |
| **만 3~5세 (36~71개월)** | **600 mg / 일** | 400 IU / 25 g | 슬라이스 치즈 1.5장(200mg) + 잔멸치 주먹밥(180mg) + 달걀노른자 1개 + 브로콜리 무침 |
| **만 6~8세 (초등 저학년)** | **700 mg / 일** | 400 IU / 35 g | 두부구이 1모(280mg) + 뱅어포·멸치볶음(220mg) + 소고기 장조림 + 구운 연어 |
| **만 9~11세 (사춘기 진입)** | **800 mg / 일** | 400 IU / 50 g | 고칼슘 치즈 2장(300mg) + 뼈째 먹는 생선 + 두부 된장국 + 소고기·달걀 단백질 식단 |

---

## 5. 우리 아이만의 성장·발달 속도를 무료로 점검해 보세요

아이마다 자라나는 속도와 기질은 세상에 단 하나뿐인 지문처럼 다릅니다.
옆집 아이의 교구나 영양제를 따라 사기보다, 먼저 **공신력 있는 국가 표준 데이터에 우리 아이의 현재 키·몸무게와 개월 수를 대입해 객관적인 방향**을 확인해 보시는 건 어떨까요?

👉 **[키즈핏 그로스 스튜디오 — 우리 아이 무료 성장·발달 처방전 확인하기](https://truthofmarket.com)**
"""
    (BLOG_DIR / "blog_post_sample.md").write_text(md_content, encoding="utf-8")

    html_content = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[블로그 글 샘플] 만 3세 아이의 고집, 혼내기 전에 꼭 알아야 할 '손끝 소근육 민감기'와 밤 10시 성장의 비밀</title>
  <style>
    body { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; background: #FAF8F5; color: #1E293B; line-height: 1.75; margin: 0; padding: 2rem 1rem; }
    .post-wrap { max-width: 820px; margin: 0 auto; background: #FFFFFF; border-radius: 28px; padding: 2.5rem 2rem; box-shadow: 0 12px 32px rgba(20,30,55,0.06); }
    .top-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; border-bottom: 2px solid #F1F5F9; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .badge { background: #EEF2FF; color: #4F46E5; font-weight: 800; font-size: 0.85rem; padding: 0.35rem 0.85rem; border-radius: 9999px; }
    h1 { font-size: 1.75rem; line-height: 1.38; color: #0F172A; margin: 0 0 1rem 0; }
    h2 { font-size: 1.3rem; color: #1E1B4B; margin-top: 2.2rem; padding-left: 0.75rem; border-left: 5px solid #4F46E5; }
    .authority-box { background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 18px; padding: 1.15rem 1.35rem; font-size: 0.9rem; color: #065F46; margin-bottom: 1.75rem; }
    .quote-box { background: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 14px; padding: 1.1rem 1.35rem; margin: 1.25rem 0; color: #78350F; }
    table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.9rem; }
    th { background: #EEF2FF; color: #312E81; font-weight: 800; padding: 0.75rem; border: 1px solid #CBD5E1; text-align: left; }
    td { padding: 0.75rem; border: 1px solid #E2E8F0; color: #334155; }
    .visual-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
    .visual-grid img { width: 100%; border-radius: 16px; border: 1px solid #E2E8F0; }
    .bridge-card { background: linear-gradient(135deg, #EEF2FF 0%, #ECFDF5 100%); border: 1.5px solid #A5B4FC; border-radius: 22px; padding: 1.75rem; text-align: center; margin-top: 2.5rem; }
    .btn { display: inline-block; background: #4F46E5; color: #FFFFFF; font-weight: 800; padding: 0.85rem 1.6rem; border-radius: 9999px; text-decoration: none; margin-top: 0.75rem; border: none; cursor: pointer; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="post-wrap" id="blog-article-body">
    <div class="top-bar">
      <span class="badge">📝 네이버 블로그 최고 퀄리티 양육 칼럼 샘플</span>
      <button class="btn" style="margin-top:0; padding: 0.5rem 1rem; font-size: 0.82rem;" onclick="navigator.clipboard.writeText(document.getElementById('blog-article-body').innerText).then(()=>alert('블로그 본문 전체가 클립보드에 복사되었습니다! 네이버 스마트에디터에 붙여넣기 하세요.'))">📋 스마트에디터용 원클릭 복사</button>
    </div>

    <h1>“내가 다 할 거야!” 만 3세 아이의 고집, 혼내기 전에 꼭 알아야 할 '손끝 소근육 민감기'와 밤 10시 성장의 비밀</h1>

    <div class="authority-box">
      <strong>🏛️ 국가 표준 데이터 기반 양육 가이드:</strong> 본 칼럼은 <strong>보건복지부 『한국 영유아 발달선별검사(K-DST)』</strong>, <strong>질병관리청 『소아청소년 성장도표(KDCA)』</strong>, <strong>보건복지부·한국영양학회 『한국인 영양소 섭취기준(KDRIs)』</strong>, <strong>대한소아내분비학회</strong> 기준을 바탕으로 작성된 양육 지원 칼럼입니다.
    </div>

    <h2>1. 퇴근 후 현관에서 시작되는 단추 씨름, 왜 이토록 눈물이 날까요?</h2>
    <p>퇴근하고 돌아와 저녁밥을 올려놓아야 하는 바쁜 저녁 7시. 어린이집 가방을 내려놓기도 전에 세 살배기 아이가 조그만 손으로 외투 단추를 붙잡고 소리칩니다. <em>“싫어! 엄마 가! 내가 혼자 할 거야!!”</em></p>
    <p>마음은 급한데 아이는 10분째 단추 구멍 하나를 끼우지 못해 낑낑대고, 급기야 식탁 위 물컵까지 혼자 따르겠다며 바지에 물을 다 쏟아버립니다. 그날 밤 곤히 잠든 아이의 작은 손을 쓰다듬으며 엄마는 <em>‘내가 일하느라 바빠서 우리 아이만 소근육이 늦는 걸까?’</em> 자책하곤 합니다.</p>

    <div class="visual-grid">
      <img src="../2_webtoon_sample/webtoon_cut_01.png" alt="육아웹툰 1컷">
      <img src="../2_webtoon_sample/webtoon_cut_03.png" alt="육아웹툰 3컷">
    </div>

    <h2>2. 손가락은 '제2의 뇌' — 대뇌 운동피질의 30%가 손끝에 연결됩니다</h2>
    <p>신경외과 의사 와일더 펜필드 박사의 <strong>뇌 지도(Homunculus)</strong>를 보면, 인간 대뇌 운동피질의 무려 <strong>30% 이상이 손과 손가락</strong>에 배정되어 있습니다. 만 2~3세 아이가 “내가 할 거야!”라며 고집을 부리는 것은 반항이 아니라, <strong>엄지·검지·중지 ‘삼지창 파지(Three-jaw chuck)’와 전두엽 시냅스를 스스로 연결하려는 기특한 발달 본능</strong>입니다.</p>

    <table>
      <thead>
        <tr>
          <th>K-DST 발달 영역</th>
          <th>만 24~35개월 핵심 이정표</th>
          <th>만 36~47개월 핵심 이정표</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>✂️ 소근육 운동</strong></td>
          <td>책장을 한 장씩 넘기고 큰 구슬에 끈을 꿴다</td>
          <td><strong>안전가위로 종이를 자르고 세 손가락 삼지창 파지가 형성된다</strong></td>
        </tr>
        <tr>
          <td><strong>🧩 인지 발달</strong></td>
          <td>크고 작음을 변별하고 도형 판을 맞춘다</td>
          <td><strong>부분을 보고 전체를 유추하며 원·십자가를 모방해 그린다</strong></td>
        </tr>
        <tr>
          <td><strong>👕 자조 행동</strong></td>
          <td>혼자 숟가락질을 시도하고 양말을 벗는다</td>
          <td><strong>큰 단추를 스스로 끼우고 풀며 혼자 손을 씻는다</strong></td>
        </tr>
      </tbody>
    </table>

    <h2>3. 비싼 150만 원 전집 사기 전! 오늘 저녁 거실 '0원 일상 놀이 3선'</h2>
    <p>손끝 힘이 아직 다져지지 않은 만 2~3세 아이에게 150만 원대 가베(은물) 전집을 들이면 블록이 자꾸 무너져 흥미를 잃기 쉽습니다. 교구를 사기 전 오늘 저녁 주방 서랍으로 시작하는 <strong>0원 일상 놀이 3선</strong>을 먼저 해보세요:</p>
    <ul>
      <li><strong>① 나무 빨래집게 ‘악어 손가락’ 놀이:</strong> 두부 용기 테두리에 빨래집게를 꽂고 빼며 엄지·검지 악력을 기릅니다.</li>
      <li><strong>② 물티슈 캡 &amp; 페트병 뚜껑 저금통:</strong> 빈 상자에 물티슈 캡을 붙여 페트병 뚜껑을 넣으며 눈-손 협응력을 키웁니다.</li>
      <li><strong>③ 다 쓴 휴지심 ‘사자 갈기’ 오리기:</strong> 도톰한 휴지심 끝을 1cm씩 안전가위로 오리며 가위질 성취감을 선물합니다.</li>
    </ul>

    <div class="quote-box">
      <strong>💬 아이의 자존감을 살리는 엄마의 대화 처방</strong><br>
      ❌ <strong>Before:</strong> “답답해, 이리 줘 봐! 엄마가 빨리 단추 채워줄게!”<br>
      ⭕ <strong>After:</strong> “우리 지우가 스스로 단추를 끼워보고 싶었구나! 악어 손가락으로 단추 끝을 꼭 잡고 구멍으로 쏙 밀어 넣어볼까? 엄마가 옆에서 기다려 줄게!”
    </div>

    <h2>4. 낮에 손끝을 쓴 아이가 밤 10시 '숨은 키 7cm'도 자랍니다</h2>
    <p>낮 동안 손끝과 몸을 충분히 움직인 아이는 밤 10시 <strong>깊은 서파수면(Slow-Wave Sleep, 일일 성장호르몬의 65% 분비)</strong>에 빠르게 진입합니다. 우유 배앓이가 있는 아이라면 아래 <strong>보건복지부 한국인 영양소 섭취기준(KDRIs) 자연식 환산표</strong>로 칼슘을 채워주세요.</p>

    <table>
      <thead>
        <tr>
          <th>연령 구분 (KDRIs)</th>
          <th>일일 칼슘 권장량</th>
          <th>일일 비타민D / 단백질</th>
          <th>우유 배앓이 없는 자연식 식탁 1일 환산 예시</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>만 1~2세</strong></td>
          <td>500 mg / 일</td>
          <td>400 IU / 20 g</td>
          <td>아기치즈 1장(130mg) + 두부 반 모(140mg) + 잔멸치 볶음 1큰술(120mg) + 요거트</td>
        </tr>
        <tr>
          <td><strong>만 3~5세</strong></td>
          <td>600 mg / 일</td>
          <td>400 IU / 25 g</td>
          <td>슬라이스 치즈 1.5장(200mg) + 잔멸치 주먹밥(180mg) + 달걀노른자 1개 + 브로콜리</td>
        </tr>
        <tr>
          <td><strong>만 6~8세</strong></td>
          <td>700 mg / 일</td>
          <td>400 IU / 35 g</td>
          <td>두부구이 1모(280mg) + 뱅어포·멸치볶음(220mg) + 소고기 장조림 + 구운 연어</td>
        </tr>
      </tbody>
    </table>

    <div class="bridge-card">
      <h3 style="margin: 0 0 0.5rem 0; color: #1E1B4B;">🌱 우리 아이 개월 수에 딱 맞는 성장 백분위 &amp; 발달 방향이 궁금하다면?</h3>
      <p style="margin: 0; font-size: 0.92rem; color: #334155;">질병관리청 성장도표와 보건복지부 K-DST 기준을 연동한 무료 진단 리포트를 1분 만에 확인해 보세요.</p>
      <a class="btn" href="../../index.html">👉 키즈핏 그로스 스튜디오 무료 진단 바로가기</a>
    </div>
  </div>
</body>
</html>"""
    (BLOG_DIR / "blog_post_sample.html").write_text(html_content, encoding="utf-8")
    print("✅ [Sample 1] 블로그 칼럼 MD + HTML 샘플 생성 완료!")


async def main_async():
    generate_blog_sample()
    render_webtoon_samples()
    render_cardnews_samples()

    print(f"🎬 [Sample 4] 6컷 움직이는 웹툰 영상 샘플(OpenCV 2.5D 캐릭터 모션 + 대화형 말풍선, 1컷당 {CUT_DURATION_SEC}초, 총 {CUT_DURATION_SEC * 6:.0f}초) 생성 중...")
    wt_wavs, wt_durs = await synthesize_tts_clips(WEBTOON_CUTS, WEBTOON_VID_DIR, "wt", CUT_DURATION_SEC)
    wt_mp4 = WEBTOON_VID_DIR / "webtoon_parenting_video.mp4"
    build_vertical_video(
        WEBTOON_CUTS,
        wt_wavs,
        wt_durs,
        wt_mp4,
        header_title_text="만 3세 아이의 고집, 진짜 이유는?",
        accent_rgb=(79, 70, 229),
        is_webtoon=True,
    )
    print(f"✅ [Sample 4] 움직이는 웹툰 영상 생성 완료: {wt_mp4} ({wt_mp4.stat().st_size:,} bytes)")

    print(f"🎬 [Sample 5] 6컷 움직이는 카드뉴스 영상 샘플(OpenCV 2.5D 캐릭터 모션 + 한줄 요약 카드뉴스, 1컷당 {CUT_DURATION_SEC}초, 총 {CUT_DURATION_SEC * 6:.0f}초) 생성 중...")
    cn_wavs, cn_durs = await synthesize_tts_clips(CARDNEWS_SLIDES, CARDNEWS_VID_DIR, "cn", CUT_DURATION_SEC)
    cn_mp4 = CARDNEWS_VID_DIR / "cardnews_parenting_video.mp4"
    build_vertical_video(
        CARDNEWS_SLIDES,
        cn_wavs,
        cn_durs,
        cn_mp4,
        header_title_text="손끝은 제2의 뇌! 0원 놀이 & 성장비법",
        accent_rgb=(5, 150, 105),
        is_webtoon=False,
    )
    print(f"✅ [Sample 5] 움직이는 카드뉴스 영상 생성 완료: {cn_mp4} ({cn_mp4.stat().st_size:,} bytes)")


if __name__ == "__main__":
    asyncio.run(main_async())
