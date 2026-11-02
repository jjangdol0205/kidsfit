#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KISFIT BIO LABS — Reference-Matched (FaCwVEgCL6k Style) 30-Second US Shorts / TikTok / Reels Generator
(scripts/generate_global_tiktok_insta_videos.py)

Matches the exact visual layout of https://youtube.com/shorts/FaCwVEgCL6k:
  1. Pure Black Background (#000000, 1080x1920 9:16 vertical).
  2. Top Black Letterbox (y=0..445):
     - Line 1: Bold White (#FFFFFF) Hook Title
     - Line 2: Bold Gold-Yellow (#F6C445) Highlight Title
  3. Center Photorealistic US Family Video Viewport (y=445..1405, 1080x960):
     - Stitches 3 x 10-Second Photorealistic American Home Scenes (= 30-Second Shorts Video).
     - Uses raw 10s Google Flow (Veo) clips from `tiktok_insta_videos/flow_raw/` if present,
       or animates our 35mm photorealistic US family scenes (`samples/us_family_scenes/`) with
       OpenCV 2.5D skeletal life motion + cinema lens push-in/pan.
     - Natural Spoken-Cadence English Subtitle Box overlaid at the bottom of the video viewport:
       Solid White Box (#FFFFFF) with Dark Black Text (#0A0A0A) changing every ~3.3s across
       9 natural conversational segments per 30-second video.
  4. Bottom Black Letterbox (y=1405..1920):
     - Emerald Shield Crest Icon + Bold White "KISFIT" signature centered right below the video.
"""

import math
import os
import shutil
import struct
import subprocess
import sys
import urllib.parse
import urllib.request
import wave
import zipfile
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
US_SCENES_DIR = ROOT_DIR / "samples" / "us_family_scenes"
VIDEOS_OUT_DIR = ROOT_DIR / "tiktok_insta_videos"
FLOW_RAW_DIR = VIDEOS_OUT_DIR / "flow_raw"
REDDIT_OUT_DIR = ROOT_DIR / "reddit_marketing_pack"
LOGS_DIR = ROOT_DIR / "logs"

for d in [US_SCENES_DIR, VIDEOS_OUT_DIR, FLOW_RAW_DIR, REDDIT_OUT_DIR, LOGS_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def get_en_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    candidates = (
        [
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/calibrib.ttf",
            "C:/Windows/Fonts/malgunbd.ttf",
        ]
        if bold
        else [
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/calibri.ttf",
            "C:/Windows/Fonts/malgun.ttf",
        ]
    )
    for fp in candidates:
        if Path(fp).exists():
            return ImageFont.truetype(fp, size)
    return ImageFont.load_default()


# ==============================================================================
# 1. OPENCV 2.5D PHOTOREALISTIC CINEMA MOTION ENGINE (3 x 10s CLIPS = 30s)
# ==============================================================================
_GRID_SIZE = 180
_GY, _GX = np.meshgrid(
    np.linspace(0.0, 1.0, _GRID_SIZE, dtype=np.float32),
    np.linspace(0.0, 1.0, _GRID_SIZE, dtype=np.float32),
    indexing="ij",
)


def apply_puppet_warp(img_rgb: np.ndarray, bones: list) -> np.ndarray:
    H, W = img_rgb.shape[:2]
    dx_low = np.zeros((_GRID_SIZE, _GRID_SIZE), dtype=np.float32)
    dy_low = np.zeros((_GRID_SIZE, _GRID_SIZE), dtype=np.float32)

    for (cx, cy, sigma, dx, dy) in bones:
        dist2 = (_GX - cx) ** 2 + (_GY - cy) ** 2
        weight = np.exp(-dist2 / (2.0 * (sigma ** 2)))
        dx_low -= weight * float(dx)
        dy_low -= weight * float(dy)

    edge_x = np.minimum(_GX, 1.0 - _GX) / 0.08
    edge_y = np.minimum(_GY, 1.0 - _GY) / 0.08
    edge_mask = np.clip(np.minimum(edge_x, edge_y), 0.0, 1.0)
    dx_low *= edge_mask
    dy_low *= edge_mask

    dx_full = cv2.resize(dx_low, (W, H), interpolation=cv2.INTER_CUBIC)
    dy_full = cv2.resize(dy_low, (W, H), interpolation=cv2.INTER_CUBIC)

    base_x = np.arange(W, dtype=np.float32)[None, :]
    base_y = np.arange(H, dtype=float)[:, None].astype(np.float32)
    map_x = base_x + dx_full
    map_y = base_y + dy_full

    return cv2.remap(img_rgb, map_x, map_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)


def animate_us_cinema_scene(img_rgb: np.ndarray, scene_idx: int, prog: float, out_w: int = 1080, out_h: int = 960) -> Image.Image:
    """
    Renders a photorealistic 10-second American family home scene with subtle natural human breathing,
    head/hand micro-movements, and 35mm cinema dolly push-in/pan.
    """
    t = prog * 4.0 * math.pi  # 2 natural breathing/movement cycles over a 10-second clip
    bones = [
        (0.36, 0.42, 0.14, 8.5 * math.sin(t * 1.2), 6.5 * math.cos(t * 1.2)),
        (0.64, 0.46, 0.14, -9.0 * math.cos(t * 1.4), 7.5 * math.sin(t * 1.1)),
        (0.48, 0.68, 0.16, 6.0 * math.sin(t * 1.0), -7.0 * abs(math.sin(t * 1.0))),
    ]
    warped = apply_puppet_warp(img_rgb, bones)

    H, W = warped.shape[:2]
    zoom = 1.04 + 0.07 * prog
    crop_w = int(W / zoom)
    crop_h = int(crop_w * (out_h / float(out_w)))
    if crop_h > H:
        crop_h = int(H / zoom)
        crop_w = int(crop_h * (out_w / float(out_h)))

    pan_dir = 1 if (scene_idx % 2 == 1) else -1
    cx = int(W * 0.5 + pan_dir * (W * 0.025) * (prog - 0.5))
    cy = int(H * 0.48 - (H * 0.018) * (prog - 0.5))
    x0 = max(0, min(W - crop_w, cx - crop_w // 2))
    y0 = max(0, min(H - crop_h, cy - crop_h // 2))
    cropped = warped[y0 : y0 + crop_h, x0 : x0 + crop_w]
    resized = cv2.resize(cropped, (out_w, out_h), interpolation=cv2.INTER_LANCZOS4)
    return Image.fromarray(resized)


# ==============================================================================
# 2. AUDIO SYNTHESIS (US ENGLISH CONVERSATIONAL VOICEOVER + SUBTLE BGM)
# ==============================================================================
def generate_bgm_wav(wav_path: Path, duration_sec: float, sample_rate: int = 44100):
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

            env = math.exp(-local_t * 1.45) * min(1.0, local_t / 0.04)
            val = 0.0
            for idx, freq in enumerate(chord):
                val += math.sin(2.0 * math.pi * freq * t) * 0.20 * env
                arp_offset = idx * 0.24
                if local_t >= arp_offset:
                    at = local_t - arp_offset
                    a_env = math.exp(-at * 2.6) * min(1.0, at / 0.03)
                    val += math.sin(2.0 * math.pi * (freq * 2.0) * t) * 0.10 * a_env

            master = 0.12
            if t < 0.4:
                master *= t / 0.4
            elif duration_sec - t < 0.6:
                master *= max(0.0, (duration_sec - t) / 0.6)

            sample = int(max(-1.0, min(1.0, val * master)) * 32767)
            frames.extend(struct.pack("<h", sample))

        wf.writeframes(frames)


def synthesize_en_tts_wav(text: str, out_wav: Path, fps: int = 24) -> int:
    """
    Synthesizes full natural English TTS speech without cutting off the end of any sentence.
    Adds a 0.45s natural breathing pause after the speech finishes, pads to an exact multiple
    of (1 / fps) seconds, and returns the exact number of video frames (`seg_frames`) for this segment.
    """
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    mp3_path = out_wav.with_suffix(".mp3")
    raw_wav_path = out_wav.with_suffix(".raw.wav")
    sample_rate = 44100
    try:
        q = urllib.parse.quote(text)
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q={q}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        mp3_bytes = urllib.request.urlopen(req, timeout=15).read()
        mp3_path.write_bytes(mp3_bytes)

        subprocess.run(
            [
                ffmpeg_exe, "-y", "-i", str(mp3_path),
                "-af", "atempo=1.08,apad=pad_dur=0.45",
                "-ar", str(sample_rate), "-ac", "1",
                str(raw_wav_path),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        mp3_path.unlink(missing_ok=True)

        with wave.open(str(raw_wav_path), "r") as wf_in:
            n_frames_audio = wf_in.getnframes()
            pcm_bytes = wf_in.readframes(n_frames_audio)
        raw_wav_path.unlink(missing_ok=True)

        actual_sec = n_frames_audio / float(sample_rate)
        seg_video_frames = max(int(fps * 3.0), int(math.ceil(actual_sec * fps)))
        target_audio_samples = int(round((seg_video_frames / float(fps)) * sample_rate))
        cur_samples = len(pcm_bytes) // 2
        if cur_samples < target_audio_samples:
            pcm_bytes += b"\x00\x00" * (target_audio_samples - cur_samples)
        else:
            pcm_bytes = pcm_bytes[: target_audio_samples * 2]

        with wave.open(str(out_wav), "w") as wf_out:
            wf_out.setnchannels(1)
            wf_out.setsampwidth(2)
            wf_out.setframerate(sample_rate)
            wf_out.writeframes(pcm_bytes)

        return seg_video_frames
    except Exception:
        fallback_frames = int(fps * 3.5)
        generate_bgm_wav(out_wav, fallback_frames / float(fps), sample_rate=sample_rate)
        return fallback_frames


# ==============================================================================
# 3. 5 FLAGSHIP 30-SECOND US SHORTS VIDEOS (3 x 10s SCENES = 30s)
#    MANDATORY CASTING RULE: Every scene MUST feature children (ages 3-12),
#    teenagers (ages 13-17), and their parents (Mom & Dad) primarily.
# ==============================================================================
VIDEO_CASTING_MANDATE = (
    "MANDATORY CASTING RULE: All video scenes must prominently feature children, "
    "teenagers, and their parents (mother & father) together in warm American family settings."
)

US_SHORTS_VIDEOS = [
    {
        "ep_id": "us_short_01_sleep_height",
        "filename": "01_US_Shorts_Late_Bedtime_Height_Loss_30s.mp4",
        "title_line1_white": "Why Pediatricians Warn Against",
        "title_line2_yellow": "Bedtimes After 10 PM",
        "scenes_10s": [
            {
                "scene_num": 1,
                "image": "v1_scene1_late_bedtime.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, American suburban bedroom at 11:15 PM. A 10-year-old boy and his 14-year-old teenage brother sit up in bed looking at a glowing tablet in the dark while their concerned mother and father open the bedroom door from the warm hallway.",
                "sub_segments": [
                    {
                        "tts": "When your child stays up past ten thirty on an iPad,",
                        "lines": ["When your child stays up", "past 10:30 PM on an iPad,"],
                    },
                    {
                        "tts": "it doesn't just make them tired the next morning.",
                        "lines": ["it doesn't just make them", "tired the next morning."],
                    },
                    {
                        "tts": "Clinical studies show it cuts nighttime growth hormone by fifty two percent.",
                        "lines": ["Clinical studies show it cuts", "growth hormone by 52%."],
                    },
                ],
            },
            {
                "scene_num": 2,
                "image": "v1_scene2_deep_sleep_930pm.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, warm American bedroom at 9:30 PM. A caring American mother and father gently tuck their 10-year-old son and teenage sibling into bed under a soft amber bedside lamp and turn off the light.",
                "sub_segments": [
                    {
                        "tts": "Seventy percent of daily growth hormone surges between ten P M and two A M,",
                        "lines": ["70% of daily growth hormone", "surges between 10 PM and 2 AM"],
                    },
                    {
                        "tts": "only when your child is in deep slow-wave sleep.",
                        "lines": ["only when your child is in", "deep slow-wave sleep."],
                    },
                    {
                        "tts": "Stopping sugary snacks two hours before bed keeps insulin from blocking it.",
                        "lines": ["Stopping snacks 2 hours before bed", "stops insulin from blocking HGH."],
                    },
                ],
            },
            {
                "scene_num": 3,
                "image": "v1_scene3_height_chart_morning.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, sunlit American suburban hallway in the morning. A proud American dad and mom measure their smiling 10-year-old son and 15-year-old teenage daughter against a wooden wall height chart and high-five.",
                "sub_segments": [
                    {
                        "tts": "That single routine unlocks up to two point six inches of hidden adult height.",
                        "lines": ["That single routine unlocks up to", "+2.6 inches of hidden height."],
                    },
                    {
                        "tts": "Check your child's exact U S C D C percentile and bone-age projection,",
                        "lines": ["Check your child's US CDC percentile", "and 3-tier height projection"],
                    },
                    {
                        "tts": "in sixty seconds at KisFit, kisfit global dot com.",
                        "lines": ["in 60 seconds at KISFIT", "(kisfitglobal.com in Bio)"],
                    },
                ],
            },
        ],
        "tiktok_caption": (
            "Why pediatricians & endocrinologists warn against bedtimes after 10:00 PM 📏🧬\n\n"
            "70% of a child's daily pulsatile Human Growth Hormone (HGH) is secreted during deep Slow-Wave Sleep between 10 PM and 2 AM (JCEM). Staying up on a tablet or eating late carbs spikes insulin and suppresses nocturnal HGH by up to 52%.\n\n"
            "🔗 Run your child's 60-Second US CDC 2000 & Khamis-Roche Adult Height Scan at kisfitglobal.com (Link in Bio!)\n\n"
            "#ChildGrowth #PediatricianTips #HeightPredictor #ParentingScience #KidsHealth #SleepScience #MomTok #DadTok #KisFit"
        ),
    },
    {
        "ep_id": "us_short_02_picky_eater_zinc",
        "filename": "02_US_Shorts_Picky_Eater_Zinc_IGF1_30s.mp4",
        "title_line1_white": "Why Picky Eaters Refuse",
        "title_line2_yellow": "Meat & Green Veggies",
        "scenes_10s": [
            {
                "scene_num": 1,
                "image": "v2_scene1_picky_eater_dinner.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, modern American family dinner table. A 7-year-old American child frowns and pushes away a plate of grilled chicken and broccoli while his teenage sister and concerned parents look on.",
                "sub_segments": [
                    {
                        "tts": "If your child pushes away meat and broccoli every single night,",
                        "lines": ["If your child pushes away", "meat and broccoli every night,"],
                    },
                    {
                        "tts": "forcing them to finish their plate actually makes it worse.",
                        "lines": ["forcing them to finish their plate", "actually makes it worse."],
                    },
                    {
                        "tts": "Pediatric nutrition studies point to a hidden taste-bud zinc deficiency.",
                        "lines": ["Pediatric studies point to a", "taste-bud zinc deficiency."],
                    },
                ],
            },
            {
                "scene_num": 2,
                "image": "v2_scene2_morning_zinc_d3.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, bright sunlit American kitchen in the morning. A smiling American mother and father give their 7-year-old child and 13-year-old teenager morning liquid zinc and vitamin D3 drops before school.",
                "sub_segments": [
                    {
                        "tts": "Zinc powers the enzyme that regenerates taste buds on your child's tongue.",
                        "lines": ["Zinc powers the enzyme that", "regenerates a child's taste buds."],
                    },
                    {
                        "tts": "When zinc is low, healthy protein literally tastes metallic or bitter,",
                        "lines": ["When zinc is low, healthy protein", "tastes metallic or bitter,"],
                    },
                    {
                        "tts": "and liver I G F one bone growth hormone drops at the same time.",
                        "lines": ["and liver IGF-1 bone growth", "drops at the same time."],
                    },
                ],
            },
            {
                "scene_num": 3,
                "image": "v2_scene3_happy_dinner_growth.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, warm American dining room. The 7-year-old child and his teenage sibling happily eat chicken and vegetables with big smiles while their mom and dad smile warmly.",
                "sub_segments": [
                    {
                        "tts": "Pairing morning chelated zinc with vitamin D three and K two",
                        "lines": ["Pairing morning chelated zinc", "with Vitamin D3 and K2"],
                    },
                    {
                        "tts": "wakes up natural dinner appetite and bone growth within four weeks.",
                        "lines": ["wakes up natural appetite and", "bone growth within 4 weeks."],
                    },
                    {
                        "tts": "Get your child's custom nutrition and height report at KisFit.",
                        "lines": ["Get your child's 1:1 Growth Rx", "at KISFIT (Link in Bio)"],
                    },
                ],
            },
        ],
        "tiktok_caption": (
            "Why picky eaters refuse meat & green vegetables—it's often biology, not behavior 🥦🧬\n\n"
            "Taste-bud renewal relies on a zinc-dependent enzyme called Carbonic Anhydrase VI (AJCN). When a child has mild subclinical zinc deficiency, protein tastes bitter or metallic, and hepatic IGF-1 bone growth slows down.\n\n"
            "🔗 Check your child's US CDC Growth Percentile & Personalized iHerb Nutrition Protocol in 60 seconds at kisfitglobal.com (Link in Bio!)\n\n"
            "#PickyEater #KidsNutrition #Pediatrician #ChildGrowth #ZincDeficiency #HealthyKids #ParentingTips #MomTok #KisFit"
        ),
    },
    {
        "ep_id": "us_short_03_math_working_memory",
        "filename": "03_US_Shorts_Smart_Kids_Math_Word_Problems_30s.mp4",
        "title_line1_white": "Why Smart Kids Freeze on",
        "title_line2_yellow": "Math Word Problems",
        "scenes_10s": [
            {
                "scene_num": 1,
                "image": "v3_scene1_math_word_problem_stuck.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, American home desk in the evening. An 8-year-old boy and his 14-year-old teenage sister look frustrated staring at a math word problem workbook while their caring mother watches.",
                "sub_segments": [
                    {
                        "tts": "Does your child solve number equations fast, but freeze on word problems?",
                        "lines": ["Fast at number equations, but", "freezes on math word problems?"],
                    },
                    {
                        "tts": "Stop buying extra math workbooks—it is not a math ability problem.",
                        "lines": ["Stop buying extra workbooks—", "it's not a math ability issue."],
                    },
                    {
                        "tts": "Brain imaging shows it is a prefrontal working memory overload.",
                        "lines": ["Brain science shows it is a", "working memory overload."],
                    },
                ],
            },
            {
                "scene_num": 2,
                "image": "v3_scene2_bar_model_drawing.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, American kitchen island. A supportive American father and mother sit beside their 8-year-old son and teenage daughter showing them how to draw simple visual bar blocks on paper.",
                "sub_segments": [
                    {
                        "tts": "A child's working memory can only hold three to four chunks at once.",
                        "lines": ["A child's working memory only", "holds 3 to 4 chunks at once."],
                    },
                    {
                        "tts": "Reading four long sentences while calculating wipes out the first sentence.",
                        "lines": ["Reading 4 sentences while", "calculating overflows the brain."],
                    },
                    {
                        "tts": "Drawing a visual bar block after each sentence frees up seventy percent of memory.",
                        "lines": ["Drawing a visual bar block frees", "70% of working memory instantly."],
                    },
                ],
            },
            {
                "scene_num": 3,
                "image": "v3_scene3_feynman_whiteboard_proud.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, bright American living room. The confident 8-year-old boy and his teenage sister hold up a small whiteboard with a bar diagram and explain their solution proudly to their smiling parents.",
                "sub_segments": [
                    {
                        "tts": "Then have them explain the answer back to you on a blank whiteboard.",
                        "lines": ["Have them explain the solution", "back on a blank whiteboard."],
                    },
                    {
                        "tts": "That Feynman recall habit wires long-term prefrontal problem solving.",
                        "lines": ["That Feynman recall habit wires", "prefrontal problem solving."],
                    },
                    {
                        "tts": "Test your child's five-axis Brain L Q in sixty seconds at KisFit.",
                        "lines": ["Test your child's 5-Axis Brain LQ", "at KISFIT (Link in Bio)"],
                    },
                ],
            },
        ],
        "tiktok_caption": (
            "If your child is fast at calculation but freezes on Math Word Problems, stop drilling more worksheets 🧠📐\n\n"
            "According to Baddeley's Working Memory Model, holding 4 sentences of text in head while setting up an equation overflows a child's prefrontal working memory buffer.\n\n"
            "🔗 Run our 60-Second 5-Axis Brain Learning Quotient (LQ) Scan at https://kisfitglobal.com/?preset=elem_high (Link in Bio!)\n\n"
            "#SmartKids #MathTips #WorkingMemory #ExecutiveFunction #ParentingHacks #ElementarySchool #BrainDevelopment #MomTok #KisFit"
        ),
    },
    {
        "ep_id": "us_short_04_tech_neck_posture",
        "filename": "04_US_Shorts_Tech_Neck_Posture_Hidden_Height_30s.mp4",
        "title_line1_white": "How Tablet Tech-Neck Steals",
        "title_line2_yellow": "+0.7 Inches of Standing Height",
        "scenes_10s": [
            {
                "scene_num": 1,
                "image": "v1_scene1_late_bedtime.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, American living room. A 10-year-old boy and his 14-year-old sister hunch forward at a 60-degree neck angle looking at a tablet while their parents notice their rounded shoulders.",
                "sub_segments": [
                    {
                        "tts": "Looking down at a tablet at sixty degrees puts sixty pounds of pressure",
                        "lines": ["Looking down at a tablet at 60°", "puts 60 lbs of spine pressure"],
                    },
                    {
                        "tts": "directly onto your child's growing neck and thoracic spine.",
                        "lines": ["directly onto your child's", "growing neck and upper back."],
                    },
                    {
                        "tts": "Orthopedic studies show it compresses spinal discs and hides zero point seven inches.",
                        "lines": ["It compresses spinal discs and", "hides +0.7 inches of height."],
                    },
                ],
            },
            {
                "scene_num": 2,
                "image": "v1_scene3_height_chart_morning.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, bright American hallway. An American father and mother guide their 10-year-old son and teenage daughter through a 30-second doorway bar dead-hang stretch.",
                "sub_segments": [
                    {
                        "tts": "Hanging from a doorway bar for thirty seconds right after waking up",
                        "lines": ["Hanging from a doorway bar for", "30 seconds after waking up"],
                    },
                    {
                        "tts": "decompresses intervertebral discs and opens up a rounded ribcage.",
                        "lines": ["decompresses spinal discs and", "opens up a rounded ribcage."],
                    },
                    {
                        "tts": "Adding three hundred daily rope jumps stimulates tibial growth plates.",
                        "lines": ["Adding 300 daily rope jumps", "stimulates bone growth plates."],
                    },
                ],
            },
            {
                "scene_num": 3,
                "image": "v3_scene3_feynman_whiteboard_proud.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, sunlit American home. The 10-year-old boy and teenage daughter stand tall with straight posture against a wall height chart while their parents celebrate.",
                "sub_segments": [
                    {
                        "tts": "Children reclaim up to zero point seven inches of upright standing stature.",
                        "lines": ["Kids reclaim up to +0.7 inches", "of upright standing stature."],
                    },
                    {
                        "tts": "Calculate your child's spinal decompression and U S C D C height projection",
                        "lines": ["Calculate your child's posture", "and US CDC height projection"],
                    },
                    {
                        "tts": "in sixty seconds at KisFit, kisfit global dot com.",
                        "lines": ["in 60 seconds at KISFIT", "(kisfitglobal.com in Bio)"],
                    },
                ],
            },
        ],
        "tiktok_caption": (
            "How tablet Tech-Neck silently steals up to +0.7 inches (1.8 cm) of your child's standing height 📱📏\n\n"
            "Tilting the head forward 60 degrees places 60 lbs of compressive load on a child's cervical & thoracic spine (Surgical Technology International). A 30-second morning doorway dead-hang + 300 vertical skips decompresses discs and stimulates growth plates.\n\n"
            "🔗 Run your child's 60-Second US CDC Height & Posture Scan at https://kisfitglobal.com/?preset=elem_high (Link in Bio!)\n\n"
            "#PostureCorrection #TechNeck #ChildGrowth #GrowTaller #PediatricianTips #KidsHealth #ParentingScience #KisFit"
        ),
    },
    {
        "ep_id": "us_short_05_age3_fine_motor",
        "filename": "05_US_Shorts_Age3_Fine_Motor_Brain_Window_30s.mp4",
        "title_line1_white": "Why Finger Play Beats Flashcards",
        "title_line2_yellow": "For Preschool Brain Growth",
        "scenes_10s": [
            {
                "scene_num": 1,
                "image": "v3_scene2_bar_model_drawing.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, warm American playroom. A 4-year-old child and older sibling practice pinching wooden clothespins and stacking blocks with their smiling mother and father.",
                "sub_segments": [
                    {
                        "tts": "Want your preschooler to excel at elementary math and reading later on?",
                        "lines": ["Want your child to excel at", "math and reading later on?"],
                    },
                    {
                        "tts": "Neuroscience shows tactile finger play beats digital flashcards every time.",
                        "lines": ["Brain science shows finger play", "beats flashcards every time."],
                    },
                    {
                        "tts": "Over thirty percent of the brain's motor cortex is wired directly to the fingers.",
                        "lines": ["Over 30% of the motor cortex", "is wired directly to the fingers."],
                    },
                ],
            },
            {
                "scene_num": 2,
                "image": "v3_scene1_math_word_problem_stuck.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, bright American kitchen table. Parents guide their young child and older sibling in building 3D geometric block towers and pouring water.",
                "sub_segments": [
                    {
                        "tts": "Ten minutes a day of pincer-grasp clothespin play and 3 D block building",
                        "lines": ["10 mins a day of pincer-grasp", "and 3D block building"],
                    },
                    {
                        "tts": "co-activates the prefrontal cortex and parietal math circuitry.",
                        "lines": ["co-activates the prefrontal", "and parietal math network."],
                    },
                    {
                        "tts": "Asking open-ended how and why questions doubles vocabulary growth.",
                        "lines": ["Asking open-ended 'Why' questions", "doubles expressive vocabulary."],
                    },
                ],
            },
            {
                "scene_num": 3,
                "image": "v3_scene3_feynman_whiteboard_proud.jpg",
                "flow_10s_prompt": "Photorealistic 35mm cinema video, 10 seconds, sunlit American living room. The happy child and teenage sibling proudly show their finished 3D block structure to their cheering mom and dad.",
                "sub_segments": [
                    {
                        "tts": "Fine-motor mastery at age four is the number one predictor of grade-school math.",
                        "lines": ["Fine-motor skill is the #1", "predictor of elementary math."],
                    },
                    {
                        "tts": "Check your child's five-axis Brain L Q and developmental milestones",
                        "lines": ["Check your child's 5-Axis Brain LQ", "and developmental milestones"],
                    },
                    {
                        "tts": "in sixty seconds at KisFit, kisfit global dot com.",
                        "lines": ["in 60 seconds at KISFIT", "(kisfitglobal.com in Bio)"],
                    },
                ],
            },
        ],
        "tiktok_caption": (
            "Why 10 minutes of finger play beats flashcards for preschool & early-elementary brain growth 🖐️🧠\n\n"
            "Over 30% of the human sensorimotor cortex is dedicated to the thumb and fingertips (Penfield Homunculus), and fine-motor precision is the #1 longitudinal predictor of elementary math achievement (Developmental Psychology).\n\n"
            "🔗 Run your child's 60-Second 5-Axis Brain Learning Quotient (LQ) Scan at https://kisfitglobal.com/?preset=child_4_5 (Link in Bio!)\n\n"
            "#ToddlerMom #PreschoolActivities #BrainDevelopment #MontessoriAtHome #FineMotorSkills #RaisingSmartKids #ParentingScience #KisFit"
        ),
    },
]


# ==============================================================================
# 4. EXACT FaCwVEgCL6k-STYLE FRAME COMPOSITOR (BLACK LETTERBOX + KISFIT SHIELD)
# ==============================================================================
def draw_kidsfit_shield_logo(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int = 38):
    """
    Draws the green/emerald shield crest emblem next to 'KISFIT' in the bottom black bar,
    matching the exact visual style of the reference Shorts video (FaCwVEgCL6k).
    """
    w = size
    h = int(size * 1.12)
    pts = [
        (cx, cy - h // 2),
        (cx + w // 2, cy - int(h * 0.28)),
        (cx + int(w * 0.42), cy + int(h * 0.18)),
        (cx, cy + h // 2),
        (cx - int(w * 0.42), cy + int(h * 0.18)),
        (cx - w // 2, cy - int(h * 0.28)),
    ]
    draw.polygon(pts, fill=(16, 185, 129), outline=(167, 243, 208))
    font_kf = get_en_font(int(size * 0.48), bold=True)
    draw.text((cx, cy + 1), "KF", font=font_kf, fill=(255, 255, 255), anchor="mm")


def render_reference_style_frame(
    scene_img: Image.Image,
    title_line1_white: str,
    title_line2_yellow: str,
    sub_lines: list,
    scene_idx: int = 1,
    overall_prog: float = 0.5,
) -> np.ndarray:
    """
    Composes a 1080x1920 frame matching https://youtube.com/shorts/FaCwVEgCL6k
    (identical to Episodes 1, 2, and 3):
      - Pure #000000 Black background
      - Top 2-line centered title (Line 1 White, Line 2 Warm Gold-Yellow #F6C445)
      - Center 1080x960 photorealistic live-action American home scene (y=445..1405)
      - Natural White Rectangular Subtitle Box (#FFFFFF) with crisp black text (#0A0A0A)
      - Bottom centered [Shield Icon] KISFIT brand mark in the black letterbox
    """
    W, H = 1080, 1920
    canvas = Image.new("RGB", (W, H), (0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    # 1. Top Black Letterbox: 2-Line Hook Headline (y=0..445)
    font_t1 = get_en_font(56, bold=True)
    font_t2 = get_en_font(62, bold=True)
    draw.text((540, 232), title_line1_white, font=font_t1, fill=(255, 255, 255), anchor="mm")
    draw.text((540, 322), title_line2_yellow, font=font_t2, fill=(246, 196, 69), anchor="mm")

    # 2. Center Photorealistic Live-Action US Family Video Viewport (y=445..1405, 1080x960)
    canvas.paste(scene_img, (0, 445))

    # 3. White Box English Subtitle Overlay inside bottom of video viewport
    if sub_lines:
        font_sub = get_en_font(42, bold=True)
        line_widths = []
        for ln in sub_lines:
            bbox = draw.textbbox((0, 0), ln, font=font_sub)
            line_widths.append(bbox[2] - bbox[0])
        max_w = max(line_widths) if line_widths else 400
        pad_x = 34
        pad_y = 20
        line_h = 54
        box_w = min(1000, max_w + pad_x * 2)
        box_h = len(sub_lines) * line_h + pad_y * 2
        box_x0 = (W - box_w) // 2
        box_y1 = 1384
        box_y0 = box_y1 - box_h

        draw.rectangle((box_x0, box_y0, box_x0 + box_w, box_y1), fill=(255, 255, 255))
        ty = box_y0 + pad_y + line_h // 2
        for ln in sub_lines:
            draw.text((540, ty), ln, font=font_sub, fill=(10, 10, 10), anchor="mm")
            ty += line_h

    # 4. Bottom Black Letterbox Brand Mark: [Shield Crest] KISFIT (y=1498)
    font_brand = get_en_font(52, bold=True)
    brand_text = "KISFIT"
    t_bbox = draw.textbbox((0, 0), brand_text, font=font_brand)
    t_w = t_bbox[2] - t_bbox[0]
    shield_w = 54
    gap = 18
    total_w = shield_w + gap + t_w
    start_x = (W - total_w) // 2

    draw_kidsfit_shield_logo(draw, start_x + shield_w // 2, 1498, size=52)
    draw.text((start_x + shield_w + gap, 1498), brand_text, font=font_brand, fill=(255, 255, 255), anchor="lm")

    return np.array(canvas)


def build_single_30s_us_short(ep_spec: dict, save_preview_jpg: bool = False) -> Path:
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    out_mp4 = VIDEOS_OUT_DIR / ep_spec["filename"]
    tmp_dir = VIDEOS_OUT_DIR / f"_tmp_{ep_spec['ep_id']}"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    fps = 24
    scenes = ep_spec["scenes_10s"]

    # 1. Synthesize 9 conversational English TTS segments with dynamic full-sentence duration (zero cutoff)
    seg_wavs = []
    total_video_frames = 0
    for s_idx, sc in enumerate(scenes, start=1):
        for sub_idx, seg in enumerate(sc["sub_segments"], start=1):
            w_path = tmp_dir / f"tts_s{s_idx}_{sub_idx}.wav"
            seg_frames = synthesize_en_tts_wav(seg["tts"], w_path, fps=fps)
            seg["_frames"] = seg_frames
            total_video_frames += seg_frames
            seg_wavs.append(w_path)

    total_dur = total_video_frames / float(fps)
    bgm_wav = tmp_dir / "bgm.wav"
    generate_bgm_wav(bgm_wav, total_dur)

    concat_tts_wav = tmp_dir / "tts_all.wav"
    with wave.open(str(concat_tts_wav), "w") as wf_out:
        wf_out.setnchannels(1)
        wf_out.setsampwidth(2)
        wf_out.setframerate(44100)
        for cw in seg_wavs:
            with wave.open(str(cw), "r") as wf_in:
                wf_out.writeframes(wf_in.readframes(wf_in.getnframes()))

    # 2. Stream 1080x1920 frames to FFmpeg
    raw_vid_mp4 = tmp_dir / "video_silent.mp4"
    cmd_vid = [
        ffmpeg_exe,
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", "1080x1920",
        "-pix_fmt", "rgb24",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "23",
        str(raw_vid_mp4),
    ]
    proc = subprocess.Popen(cmd_vid, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    preview_saved = False
    global_frame_counter = 0
    for s_idx, sc in enumerate(scenes, start=1):
        raw_clip_path = FLOW_RAW_DIR / f"{ep_spec['ep_id']}_scene{s_idx}.mp4"
        live_frames_pil = []
        if raw_clip_path.exists() and raw_clip_path.stat().st_size > 50000:
            cap = cv2.VideoCapture(str(raw_clip_path))
            out_w, out_h = 1080, 960
            target_aspect = out_w / float(out_h)
            while len(live_frames_pil) < 1200:
                ret, bgr = cap.read()
                if not ret or bgr is None:
                    break
                rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                fh, fw = rgb.shape[:2]
                cur_aspect = fw / float(fh)
                if cur_aspect > target_aspect:
                    new_w = int(fh * target_aspect)
                    x0 = (fw - new_w) // 2
                    cropped = rgb[:, x0 : x0 + new_w]
                else:
                    new_h = int(fw / target_aspect)
                    y0 = (fh - new_h) // 2
                    cropped = rgb[y0 : y0 + new_h, :]
                resized = cv2.resize(cropped, (out_w, out_h), interpolation=cv2.INTER_AREA)
                live_frames_pil.append(Image.fromarray(resized))
            cap.release()

        img_path = US_SCENES_DIR / sc["image"]
        if not live_frames_pil:
            if img_path.exists():
                src_pil = Image.open(img_path).convert("RGB").resize((1080, 1080), Image.Resampling.LANCZOS)
                base_rgb = np.array(src_pil)
            else:
                base_rgb = np.full((1080, 1080, 3), 40, dtype=np.uint8)

        total_scene_frames = sum(seg.get("_frames", int(fps * 3.5)) for seg in sc["sub_segments"])
        scene_frame_counter = 0

        for seg in sc["sub_segments"]:
            seg_frames = seg.get("_frames", int(fps * 3.5))
            for _ in range(seg_frames):
                prog = scene_frame_counter / max(1, total_scene_frames - 1)
                if live_frames_pil:
                    n_live = len(live_frames_pil)
                    forward_idx = int(round(prog * max(0, n_live - 1)))
                    scene_img = live_frames_pil[max(0, min(n_live - 1, forward_idx))]
                else:
                    scene_img = animate_us_cinema_scene(base_rgb, s_idx, prog, out_w=1080, out_h=960)
                scene_frame_counter += 1
                global_frame_counter += 1
                overall_prog = global_frame_counter / max(1, total_video_frames)
                frame_rgb = render_reference_style_frame(
                    scene_img=scene_img,
                    title_line1_white=ep_spec["title_line1_white"],
                    title_line2_yellow=ep_spec["title_line2_yellow"],
                    sub_lines=seg["lines"],
                    scene_idx=s_idx,
                    overall_prog=overall_prog,
                )
                if save_preview_jpg and not preview_saved and scene_frame_counter == 15:
                    try:
                        Image.fromarray(frame_rgb).save(LOGS_DIR / "us_shorts_preview_rl_evolved.jpg", quality=92)
                    except Exception:
                        pass
                    preview_saved = True
                proc.stdin.write(frame_rgb.tobytes())

    proc.stdin.close()
    proc.wait()

    # 3. Mux video + natural US English voiceover + subtle BGM
    cmd_mux = [
        ffmpeg_exe,
        "-y",
        "-i", str(raw_vid_mp4),
        "-i", str(concat_tts_wav),
        "-i", str(bgm_wav),
        "-filter_complex", "[1:a]volume=1.45[v1];[2:a]volume=0.16[v2];[v1][v2]amix=inputs=2:duration=first:dropout_transition=2[aout]",
        "-map", "0:v:0",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        str(out_mp4),
    ]
    subprocess.run(cmd_mux, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    caption_file = out_mp4.with_suffix(".caption.txt")
    caption_file.write_text(ep_spec["tiktok_caption"], encoding="utf-8")

    shutil.rmtree(tmp_dir, ignore_errors=True)
    print(f"  ✓ [30s US Shorts Video Ready] {out_mp4.name} ({out_mp4.stat().st_size // 1024} KB)")
    return out_mp4


def update_studio_dashboard_html():
    video_cards_html = ""
    for idx, ep in enumerate(US_SHORTS_VIDEOS, start=1):
        vid_rel = f"tiktok_insta_videos/{ep['filename']}"
        flow_prompts_list = "\n\n".join(
            [
                f"[10-Second Clip {sc['scene_num']}/3] (Keyframe: samples/us_family_scenes/{sc['image']}):\n{sc['flow_10s_prompt']}"
                for sc in ep["scenes_10s"]
            ]
        )
        esc_caption = ep["tiktok_caption"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        esc_flow = flow_prompts_list.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        video_cards_html += f"""
        <div class="card">
          <div class="badge">30-SEC SHORTS (3 × 10s US FAMILY SCENES) · BLACK LETTERBOX + KISFIT</div>
          <h3>0{idx}. {ep['title_line1_white']} <span style="color:#D97706;">{ep['title_line2_yellow']}</span></h3>
          <video controls preload="metadata" playsinline src="{vid_rel}"></video>
          <div class="btn-row">
            <a class="btn btn-primary" href="{vid_rel}" download="{ep['filename']}">⬇ Download 30s 9:16 MP4 ({ep['filename']})</a>
            <button class="btn btn-secondary" onclick="copyText('cap-{idx}', 'TikTok / Shorts / Reels Caption copied!')">📋 Copy TikTok / Reels / Shorts Caption</button>
            <button class="btn btn-outline" onclick="copyText('flow-{idx}', '3x10s Google Flow (Veo) Prompts copied!')">🎬 Copy 3×10s Google Flow (Veo) Prompts</button>
          </div>
          <div class="label">TikTok / Instagram Reels / YouTube Shorts Caption:</div>
          <pre id="cap-{idx}" class="box">{esc_caption}</pre>
          <div class="label">Google Flow (Veo) — 3 × 10-Second Photorealistic US Home Prompts:</div>
          <pre id="flow-{idx}" class="box">{esc_flow}</pre>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KISFIT Global — 30s US Shorts (Black Letterbox + Photorealistic US Family) &amp; Reddit Studio</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #090D16; color: #F8FAFC; margin: 0; padding: 2rem 1rem; }}
    .container {{ max-width: 1240px; margin: 0 auto; }}
    .hero {{ background: linear-gradient(135deg, #111827 0%, #1E3A8A 100%); border: 1px solid #334155; color: #FFFFFF; padding: 2rem; border-radius: 24px; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }}
    .hero h1 {{ margin: 0 0 0.5rem 0; font-size: 1.6rem; font-weight: 900; }}
    .hero p {{ margin: 0; color: #CBD5E1; font-size: 0.95rem; max-width: 760px; line-height: 1.5; }}
    .hero-links {{ display: flex; gap: 0.65rem; flex-wrap: wrap; }}
    .section-title {{ font-size: 1.35rem; font-weight: 900; margin: 2rem 0 1rem; color: #FACC15; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.35rem; }}
    .card {{ background: #111827; border: 1.5px solid #1E293B; border-radius: 20px; padding: 1.35rem; display: flex; flex-direction: column; }}
    .badge {{ display: inline-block; align-self: flex-start; background: #10B981; color: #052E16; font-size: 0.72rem; font-weight: 900; padding: 0.25rem 0.7rem; border-radius: 999px; margin-bottom: 0.6rem; }}
    .card h3 {{ font-size: 1.12rem; font-weight: 800; margin: 0 0 0.85rem 0; color: #FFFFFF; line-height: 1.35; }}
    video {{ width: 100%; max-height: 560px; background: #000000; border-radius: 14px; margin-bottom: 0.9rem; border: 1px solid #334155; }}
    .btn-row {{ display: flex; flex-direction: column; gap: 0.45rem; margin-bottom: 0.9rem; }}
    .btn {{ display: block; width: 100%; text-align: center; padding: 0.72rem 0.95rem; border-radius: 11px; font-size: 0.84rem; font-weight: 800; text-decoration: none; cursor: pointer; border: none; }}
    .btn-primary {{ background: #2563EB; color: #FFFFFF; }}
    .btn-secondary {{ background: #10B981; color: #052E16; }}
    .btn-outline {{ background: #1E293B; color: #F8FAFC; border: 1px solid #475569; }}
    .label {{ font-size: 0.75rem; font-weight: 800; color: #94A3B8; margin: 0.4rem 0 0.25rem; text-transform: uppercase; }}
    .box {{ background: #090D16; border: 1px solid #334155; border-radius: 10px; padding: 0.7rem; font-size: 0.78rem; color: #E2E8F0; white-space: pre-wrap; word-break: break-word; max-height: 165px; overflow-y: auto; margin: 0 0 0.5rem 0; font-family: inherit; line-height: 1.45; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <div>
        <h1>🎬 KISFIT Global — 30-Second US Family Shorts (Black Letterbox + KISFIT Crest)</h1>
        <p>Exact YouTube Shorts / Reels / TikTok format: Pure Black Background (#000000), Top 2-Line White &amp; Gold-Yellow Hook Title, 3 × 10-Second Photorealistic American Home Scenes, Natural Spoken English Subtitles, and Bottom KISFIT Shield Signature.</p>
      </div>
      <div class="hero-links">
        <a class="btn btn-secondary" style="width:auto;padding:0.8rem 1.3rem;" href="https://labs.google/fx/tools/flow" target="_blank" rel="noopener">🚀 Open Google Flow (Veo)</a>
        <a class="btn btn-outline" style="width:auto;padding:0.8rem 1.3rem;" href="/">🏠 Back to kisfitglobal.com</a>
      </div>
    </div>

    <div class="section-title">📱 30-Second Photorealistic US Family Shorts (3 × 10s Scenes Stitched)</div>
    <div class="grid">
      {video_cards_html}
    </div>
  </div>

  <script>
    function copyText(elId, msg) {{
      var el = document.getElementById(elId);
      if (!el) return;
      var text = el.innerText || el.textContent || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {{
        navigator.clipboard.writeText(text).then(function() {{ alert(msg); }});
      }} else {{
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        alert(msg);
      }}
    }}
  </script>
</body>
</html>
"""
    studio_path = ROOT_DIR / "tiktok_insta_reddit_studio.html"
    studio_path.write_text(html, encoding="utf-8")
    return studio_path


def main():
    target_ep = None
    for arg in sys.argv[1:]:
        if arg.startswith("--ep="):
            try:
                target_ep = int(arg.split("=")[1])
            except Exception:
                target_ep = None

    print("=== Rendering Reference-Matched 30-Second Photorealistic US Family Shorts (FaCwVEgCL6k Black Letterbox + KISFIT Style) ===")
    for idx, ep in enumerate(US_SHORTS_VIDEOS, start=1):
        if target_ep is not None and idx != target_ep:
            continue
        build_single_30s_us_short(ep, save_preview_jpg=(idx == 1 or idx == target_ep))

    zip_path = VIDEOS_OUT_DIR / "KISFIT_Global_TikTok_Instagram_Reels_5Videos_Pack.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for f in VIDEOS_OUT_DIR.glob("0*_US_Shorts_*.mp4"):
            zf.write(f, arcname=f.name)
        for f in VIDEOS_OUT_DIR.glob("0*_US_Shorts_*.txt"):
            zf.write(f, arcname=f.name)
    print(f"  ✓ [ZIP Bundle Updated] {zip_path.name} ({zip_path.stat().st_size // 1024} KB)")

    studio_html = update_studio_dashboard_html()

    for target_root in [ROOT_DIR / "dist", ROOT_DIR / "dist-global", Path(r"d:\사업아이템\dist-global")]:
        if target_root.exists():
            shutil.copy2(studio_html, target_root / "tiktok_insta_reddit_studio.html")
            target_vid_dir = target_root / "tiktok_insta_videos"
            target_vid_dir.mkdir(parents=True, exist_ok=True)
            for f in VIDEOS_OUT_DIR.glob("0*_US_Shorts_*"):
                shutil.copy2(f, target_vid_dir / f.name)
            if zip_path.exists():
                shutil.copy2(zip_path, target_vid_dir / zip_path.name)

    print("\n✅ ALL 30-SECOND PHOTOREALISTIC US FAMILY SHORTS COMPLETED!")


if __name__ == "__main__":
    main()
