#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/generate_pageflip_webtoons_and_insta_profiles.py
1. Builds 16-second (4 cuts x 4.0s = 16.0s) Webtoon Videos for Naver Clip / Instagram Reels:
   - NO TTS voice (음성 완전 제거)
   - Warm, soothing acoustic piano & music-box melody (잔잔하고 감성적인 피아노·오르골 선율)
   - Realistic 3D Picture-Book Page-Flip transition (자연스럽게 책장 넘기듯 넘어가는 3D 페이지 컬 효과)
2. Builds KidsFit Instagram & Threads 1080x1080 Circular-Safe Profile Image Pack (3 styles + preview).
"""

import math
import shutil
import struct
import subprocess
import wave
import zipfile
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg

ROOT_DIR = Path(__file__).resolve().parent.parent
WEBTOON_ROOT_KO = ROOT_DIR / "웹툰_모음"
CLIP_OUT_KO = ROOT_DIR / "네이버클립_웹툰영상_모음"
CLIP_SAMPLE_DIR = ROOT_DIR / "samples" / "10_naver_clip_videos"

PROFILE_OUT_KO = ROOT_DIR / "인스타_쓰레드_프로필_모음"
PROFILE_SAMPLE_DIR = ROOT_DIR / "samples" / "11_insta_threads_profile"


def get_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
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


# ==============================================================================
# PART 1: SOOTHING ACOUSTIC PIANO & MUSIC-BOX BGM (NO VOICE)
# ==============================================================================
def generate_soothing_lullaby_piano_wav(wav_path: Path, duration_sec: float, sample_rate: int = 44100):
    """
    Synthesizes a warm, emotional studio-quality acoustic piano & celesta music-box piece
    (Canon / warm K-drama parenting ost vibe in F major / C major) with soft stereo-like warmth
    and subtle page-turn rustle at each 4.0s boundary.
    """
    total_samples = int(duration_sec * sample_rate)
    audio = np.zeros(total_samples, dtype=np.float64)
    t_arr = np.arange(total_samples, dtype=np.float64) / sample_rate

    # Warm, gentle chord progression (each bar = 2.0 seconds -> 8 bars in 16 seconds)
    # Frequencies in Hz:
    # Bar 1: Fmaj7  (F3, A3, C4, E4) + melody A4 -> C5 -> F5 -> E5
    # Bar 2: Em7    (E3, G3, B3, D4) + melody G4 -> B4 -> E5 -> D5
    # Bar 3: Dm7    (D3, F3, A3, C4) + melody F4 -> A4 -> D5 -> C5
    # Bar 4: Cmaj7  (C3, E3, G3, B3) + melody E4 -> G4 -> C5 -> B4
    # Bar 5: Bbmaj7 (Bb2, D3, F3, A3)+ melody D4 -> F4 -> A4 -> D5
    # Bar 6: Am7    (A2, C3, E3, G3) + melody C4 -> E4 ->A4 -> C5
    # Bar 7: Gm7    (G2, Bb2, D3, F3)+ melody D4 -> G4 -> Bb4 -> A4
    # Bar 8: C9sus4 -> Fmaj9 (C3, F3, A3, C4, F4)
    bars = [
        {"chord": [174.61, 220.00, 261.63, 329.63], "melody": [(0.0, 440.00), (0.5, 523.25), (1.0, 698.46), (1.5, 659.25)]},
        {"chord": [164.81, 196.00, 246.94, 293.66], "melody": [(0.0, 392.00), (0.5, 493.88), (1.0, 659.25), (1.5, 587.33)]},
        {"chord": [146.83, 174.61, 220.00, 261.63], "melody": [(0.0, 349.23), (0.5, 440.00), (1.0, 587.33), (1.5, 523.25)]},
        {"chord": [130.81, 164.81, 196.00, 246.94], "melody": [(0.0, 329.63), (0.5, 392.00), (1.0, 523.25), (1.5, 493.88)]},
        {"chord": [116.54, 146.83, 174.61, 220.00], "melody": [(0.0, 293.66), (0.5, 349.23), (1.0, 440.00), (1.5, 587.33)]},
        {"chord": [110.00, 130.81, 164.81, 196.00], "melody": [(0.0, 261.63), (0.5, 329.63), (1.0, 440.00), (1.5, 523.25)]},
        {"chord": [98.00,  116.54, 146.83, 174.61], "melody": [(0.0, 293.66), (0.5, 392.00), (1.0, 466.16), (1.5, 440.00)]},
        {"chord": [174.61, 220.00, 261.63, 349.23], "melody": [(0.0, 392.00), (0.5, 349.23), (1.0, 440.00), (1.5, 349.23)]},
    ]

    def add_piano_note(start_sec: float, freq: float, amp: float, decay_rate: float = 1.6, dur: float = 2.2):
        idx_start = int(start_sec * sample_rate)
        if idx_start >= total_samples:
            return
        idx_end = min(total_samples, idx_start + int(dur * sample_rate))
        nt = np.arange(idx_end - idx_start, dtype=np.float64) / sample_rate
        # Soft piano hammer attack + warm exponential decay
        attack = np.minimum(1.0, nt / 0.018)
        env = attack * np.exp(-nt * decay_rate)
        # Warm fundamental + 2nd & 3rd soft harmonics (Rhodes / warm upright piano timbre)
        wave_note = (
            0.72 * np.sin(2.0 * np.pi * freq * nt)
            + 0.20 * np.sin(2.0 * np.pi * (freq * 2.0) * nt) * np.exp(-nt * 1.2)
            + 0.06 * np.sin(2.0 * np.pi * (freq * 3.0) * nt) * np.exp(-nt * 2.5)
            + 0.02 * np.sin(2.0 * np.pi * (freq * 4.0) * nt) * np.exp(-nt * 4.0)
        )
        audio[idx_start:idx_end] += amp * env * wave_note

    bar_len = 2.0
    num_bars = int(math.ceil(duration_sec / bar_len))
    for b_idx in range(num_bars):
        bar = bars[b_idx % len(bars)]
        b_start = b_idx * bar_len
        # Arpeggiated warm left-hand accompaniment
        for c_i, c_freq in enumerate(bar["chord"]):
            add_piano_note(b_start + c_i * 0.12, c_freq, amp=0.14, decay_rate=1.15, dur=2.2)
        # Expressive right-hand music-box / piano melody
        for m_offset, m_freq in bar["melody"]:
            add_piano_note(b_start + m_offset, m_freq, amp=0.22, decay_rate=1.85, dur=1.4)
            # Soft octave celesta shimmer
            add_piano_note(b_start + m_offset, m_freq * 2.0, amp=0.045, decay_rate=3.2, dur=0.9)

    # Smooth fade-in (0.4s) and fade-out (0.9s)
    fade_in_n = min(total_samples, int(0.4 * sample_rate))
    if fade_in_n > 0:
        audio[:fade_in_n] *= np.linspace(0.0, 1.0, fade_in_n)
    fade_out_n = min(total_samples, int(0.9 * sample_rate))
    if fade_out_n > 0:
        audio[-fade_out_n:] *= np.linspace(1.0, 0.0, fade_out_n)

    # Normalize to warm comfortable listening level (-3 dBFS peak)
    peak = np.max(np.abs(audio))
    if peak > 1e-6:
        audio = audio / peak * 0.72

    pcm16 = np.clip(audio * 32767.0, -32767, 32767).astype(np.int16)
    with wave.open(str(wav_path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm16.tobytes())


# ==============================================================================
# PART 2: REALISTIC 3D PICTURE-BOOK PAGE-FLIP RENDERER
# ==============================================================================
def render_page_flip_card(curr_card: Image.Image, next_card: Image.Image, flip_prog: float) -> Image.Image:
    """
    Renders a natural picture-book page-flip transition from `curr_card` to `next_card`.
    `flip_prog` goes from 0.0 (start of page turn) to 1.0 (page turn finished).
    - Underneath on the right is `next_card`.
    - `curr_card` is compressed horizontally toward the left spine (`x=0..turn_x`)
      with a realistic 3D curled paper back-flap (`turn_x..turn_x+curl_w`) and soft cast shadow!
    """
    W, H = curr_card.size
    # Smooth ease-in-out curve for natural hand page turn
    ease = 0.5 - 0.5 * math.cos(math.pi * min(1.0, max(0.0, flip_prog)))
    turn_x = int(round(W * (1.0 - ease)))

    if turn_x >= W - 2:
        return curr_card.copy()
    if turn_x <= 2:
        return next_card.copy()

    # Start with next_card as base
    out = next_card.copy().convert("RGBA")
    arr_out = np.array(out, dtype=np.float32)

    # 1. Cast drop shadow on `next_card` to the right of `turn_x`
    shadow_w = int(95 * math.sin(math.pi * ease)) + 18
    sx1 = max(0, turn_x)
    sx2 = min(W, turn_x + shadow_w)
    if sx2 > sx1:
        x_grad = np.linspace(0.0, 1.0, sx2 - sx1, dtype=np.float32)
        shadow_mult = 0.55 + 0.45 * (x_grad ** 0.7)  # Darker right under the page edge, fading right
        arr_out[:, sx1:sx2, :3] *= shadow_mult[None, :, None]

    # 2. Compressed front side of `curr_card` on `[0 .. turn_x]`
    if turn_x > 4:
        curr_resized = curr_card.resize((turn_x, H), Image.Resampling.BILINEAR)
        arr_curr = np.array(curr_resized.convert("RGBA"), dtype=np.float32)
        # Subtle shading near the curling right edge of curr_card
        shade_w = min(turn_x, 60)
        if shade_w > 2:
            s_grad = np.linspace(1.0, 0.86, shade_w, dtype=np.float32)
            arr_curr[:, turn_x - shade_w : turn_x, :3] *= s_grad[None, :, None]
        arr_out[:, :turn_x, :] = arr_curr

    # 3. Curled back-of-page paper cylinder (`[max(0, turn_x - curl_w) .. turn_x]`)
    curl_w = int(85 * math.sin(math.pi * ease))
    if curl_w > 6 and turn_x > 6:
        cx1 = max(0, turn_x - curl_w)
        cx2 = turn_x
        cw = cx2 - cx1
        if cw > 2:
            # Take mirrored strip from curr_card and blend with warm cream paper back (#FAF6EE)
            src_strip = curr_card.crop((max(0, W - cw * 2), 0, W, H)).resize((cw, H), Image.Resampling.BILINEAR)
            src_mirror = np.array(src_strip.transpose(Image.Transpose.FLIP_LEFT_RIGHT), dtype=np.float32)
            paper_rgb = np.array([252.0, 249.0, 242.0], dtype=np.float32)
            # 82% warm cream paper + 18% faint show-through of artwork
            flap = 0.82 * paper_rgb[None, None, :] + 0.18 * src_mirror[:, :, :3]
            # Cylindrical specular highlight across the curled paper
            u = np.linspace(0.0, 1.0, cw, dtype=np.float32)
            cyl_light = 0.82 + 0.22 * np.sin(np.pi * u)
            flap = np.clip(flap * cyl_light[None, :, None], 0, 255)
            arr_out[:, cx1:cx2, :3] = flap
            # Left crease line of the curled paper flap
            arr_out[:, cx1 : min(W, cx1 + 2), :3] *= 0.78

    return Image.fromarray(np.clip(arr_out, 0, 255).astype(np.uint8), "RGBA").convert("RGB")


# ==============================================================================
# PART 3: RENDER 16s (4 CUTS x 4s) PAGE-FLIPPING WEBTOON VIDEOS
# ==============================================================================
EPISODES_SPEC = [
    {
        "ep_id": "ep01",
        "filename": "01_네이버클립_웹툰1화_만3세소근육민감기.mp4",
        "badge": "키즈핏 육아웹툰 1화 · 소근육 민감기",
        "header_title": "“내가 혼자 할 거야!”\n만 3세 고집의 진짜 이유",
        "accent": (79, 70, 229),
        "bg_top": (238, 242, 255),
        "folder": WEBTOON_ROOT_KO / "1화_만3세소근육민감기_웹툰",
        "cuts": [
            {
                "img": "01_1컷.png",
                "sub": "단추도 물컵도 혼자 하겠다는 만 3세,\n엄마를 힘들게 하려는 반항이 아닙니다!",
            },
            {
                "img": "02_2컷.png",
                "sub": "대뇌 운동피질 30%가 손끝에 직결된\n결정적 ‘손끝 소근육 민감기’ 신호!",
            },
            {
                "img": "03_3컷.png",
                "sub": "비싼 교구 대신 주방 집게와 공 옮기기로\n엄지·검지 악어 손가락 힘을 키워요",
            },
            {
                "img": "04_4컷.png",
                "sub": "아이의 속도를 기다려 주는 다정한 엄마,\n키즈핏에서 1분 무료 진단을 받아보세요!",
            },
        ],
    },
    {
        "ep_id": "ep02",
        "filename": "02_네이버클립_웹툰2화_초등문장제수학작업기억.mp4",
        "badge": "키즈핏 교육웹툰 2화 · 초등 문장제 수학",
        "header_title": "연산은 100점인데\n문장제 수학만 별표 친다면?",
        "accent": (13, 148, 136),
        "bg_top": (240, 253, 250),
        "folder": WEBTOON_ROOT_KO / "2화_초등문장제수학작업기억_웹툰",
        "cuts": [
            {
                "img": "01_1컷.png",
                "sub": "단순 연산은 100점인데 문장제만 나오면\n읽지도 않고 별표(★)부터 치는 이유?",
            },
            {
                "img": "02_2컷.png",
                "sub": "국어 어휘력 부족이 아니라 머릿속 칠판\n‘전두엽 작업기억 과부하’ 때문입니다!",
            },
            {
                "img": "03_3컷.png",
                "sub": "암산 대신 여백에 ‘상자·막대 그림’을 그리면\n더할지 뺄지 한눈에 바로 보입니다!",
            },
            {
                "img": "04_4컷.png",
                "sub": "열 문제 풀이보다 ‘30초 말로 설명하기’!\n키즈핏에서 5대 학습역량(LQ)을 진단하세요",
            },
        ],
    },
    {
        "ep_id": "ep03",
        "filename": "03_네이버클립_웹툰3화_밤10시숙면숨은키7cm.mp4",
        "badge": "키즈핏 성장웹툰 3화 · 숨은 키 +7cm 루틴",
        "header_title": "밤마다 우유 마셨는데\n오히려 키 성장을 방해했다고?",
        "accent": (234, 88, 12),
        "bg_top": (255, 247, 237),
        "folder": WEBTOON_ROOT_KO / "3화_밤10시숙면숨은키7cm_웹툰",
        "cuts": [
            {
                "img": "01_1컷.png",
                "sub": "키 크라고 자기 직전 챙겨준 찬 우유,\n배앓이와 수면 방해의 원인이 됩니다!",
            },
            {
                "img": "02_2컷.png",
                "sub": "취침 2시간 전 공복 유지 필수!\n밤 10시~2시 서파수면에서 성장호르몬 70% 폭발",
            },
            {
                "img": "03_3컷.png",
                "sub": "밤 9시 40분 무릎·종아리 5분 스트레칭으로\n낮 동안 눌린 성장판과 디스크를 펴주세요",
            },
            {
                "img": "04_4컷.png",
                "sub": "질병관리청 성장도표 기준 우리 아이 키 백분위 &\n3단 예상키 무료 진단 ▶ truthofmarket.com",
            },
        ],
    },
]


def render_pageflip_video(cuts_spec: list, out_mp4: Path, cut_dur: float = 4.0, flip_dur: float = 0.65, fps: int = 24):
    """
    Renders a 1080x1920 vertical video where each cut lasts `cut_dur` seconds (4.0s x 4 = 16.0s),
    with soothing acoustic piano BGM (NO voice) and realistic 3D picture-book page-flip transitions!
    """
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    work_dir = out_mp4.parent
    work_dir.mkdir(parents=True, exist_ok=True)

    total_dur = cut_dur * len(cuts_spec)
    bgm_wav = work_dir / "_tmp_soothing_piano.wav"
    generate_soothing_lullaby_piano_wav(bgm_wav, total_dur + 0.15, 44100)

    VW, VH = 1080, 1920
    f_badge = get_font(26, bold=True)
    f_title = get_font(46, bold=True)
    f_sub = get_font(33, bold=True)
    f_cta = get_font(26, bold=True)

    cmd = [
        ffmpeg_exe, "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{VW}x{VH}",
        "-pix_fmt", "rgb24",
        "-r", str(fps),
        "-i", "-",
        "-i", str(bgm_wav),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "17",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        str(out_mp4)
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    card_w, card_h = 1000, 1000
    card_x, card_y = 40, 340

    # Preload 1000x1000 cards for all cuts
    loaded_cards = [
        Image.open(c["img_path"]).convert("RGB").resize((card_w, card_h), Image.Resampling.LANCZOS)
        for c in cuts_spec
    ]

    n_frames_per_cut = int(round(cut_dur * fps))
    n_flip_frames = int(round(flip_dur * fps))
    total_frames = n_frames_per_cut * len(cuts_spec)
    global_f = 0

    for idx, c in enumerate(cuts_spec):
        curr_base = loaded_cards[idx]
        next_base = loaded_cards[idx + 1] if (idx + 1) < len(loaded_cards) else None
        acc = c["accent"]
        bg_top = c["bg_top"]
        badge_txt = c["badge"]
        title_lines = c["header_title"].split("\n")
        sub_lines = c["sub"].split("\n")
        step_str = c["step_label"]

        for f_idx in range(n_frames_per_cut):
            prog = f_idx / float(max(1, n_frames_per_cut - 1))
            g_prog = global_f / float(max(1, total_frames - 1))
            global_f += 1

            frame = Image.new("RGB", (VW, VH), (250, 248, 245))
            draw = ImageDraw.Draw(frame)

            # Top header band
            draw.rectangle((0, 0, VW, 310), fill=bg_top)
            draw.line([(0, 310), (VW, 310)], fill=acc, width=4)

            # Pill badge at top
            bb_b = draw.textbbox((0, 0), badge_txt, font=f_badge)
            bw = (bb_b[2] - bb_b[0]) + 44
            bx1 = (VW - bw) // 2
            draw.rounded_rectangle((bx1, 42, bx1 + bw, 92), radius=25, fill=acc)
            draw.text((bx1 + 22, 52 - bb_b[1]), badge_txt, font=f_badge, fill=(255, 255, 255))

            # Page number indicator at top-right
            bb_s = draw.textbbox((0, 0), step_str, font=f_badge)
            sw = bb_s[2] - bb_s[0]
            draw.text((VW - sw - 48, 52 - bb_s[1]), step_str, font=f_badge, fill=acc)

            # 2-line Headline
            ty = 114
            for tline in title_lines:
                bb_t = draw.textbbox((0, 0), tline, font=f_title)
                tw = bb_t[2] - bb_t[0]
                draw.text(((VW - tw) // 2, ty - bb_t[1]), tline, font=f_title, fill=(15, 23, 42))
                ty += 62

            # Subtle breathing zoom during reading phase, then 3D page-flip during last `n_flip_frames`
            frames_left = n_frames_per_cut - f_idx
            if next_base is not None and frames_left <= n_flip_frames:
                flip_p = 1.0 - (frames_left / float(max(1, n_flip_frames)))
                card_img = render_page_flip_card(curr_base, next_base, flip_p)
            else:
                zoom = 1.0 + 0.022 * math.sin(prog * math.pi)
                zw, zh = int(card_w * zoom), int(card_h * zoom)
                resized = curr_base.resize((zw, zh), Image.Resampling.BILINEAR)
                cx = (zw - card_w) // 2
                cy = (zh - card_h) // 2
                card_img = resized.crop((cx, cy, cx + card_w, cy + card_h))

            # Book spine & page stack effect around the 1000x1000 webtoon frame
            draw.rounded_rectangle((card_x + 8, card_y + 8, card_x + card_w + 8, card_y + card_h + 8), radius=24, fill=(203, 213, 225))
            draw.rounded_rectangle((card_x + 4, card_y + 4, card_x + card_w + 4, card_y + card_h + 4), radius=24, fill=(241, 245, 249))
            frame.paste(card_img, (card_x, card_y))
            draw.rounded_rectangle((card_x, card_y, card_x + card_w, card_y + card_h), radius=24, outline=acc, width=4)

            # Subtitle Box at y=1375..1605
            sub_y1, sub_y2 = 1375, 1605
            draw.rounded_rectangle((40, sub_y1, VW - 40, sub_y2), radius=26, fill=(15, 23, 42), outline=acc, width=3)
            sy = sub_y1 + (52 if len(sub_lines) == 2 else 82)
            for sline in sub_lines:
                bb_sub = draw.textbbox((0, 0), sline, font=f_sub)
                lw = bb_sub[2] - bb_sub[0]
                draw.text(((VW - lw) // 2, sy - bb_sub[1]), sline, font=f_sub, fill=(255, 255, 255))
                sy += 54

            # Naver Clip Info Sticker CTA Bar at y=1635..1735
            cta_y1, cta_y2 = 1635, 1735
            draw.rounded_rectangle((40, cta_y1, VW - 40, cta_y2), radius=22, fill=bg_top, outline=acc, width=2)
            cta_txt = "★ 우리 아이 키 백분위 & 두뇌 역량 1분 무료 진단 ▶ truthofmarket.com"
            bb_c = draw.textbbox((0, 0), cta_txt, font=f_cta)
            cw = bb_c[2] - bb_c[0]
            draw.text(((VW - cw) // 2, cta_y1 + 34 - bb_c[1]), cta_txt, font=f_cta, fill=(30, 41, 59))

            # Progress Bar at y=1770
            pb_y = 1770
            draw.rounded_rectangle((40, pb_y, VW - 40, pb_y + 18), radius=9, fill=(226, 232, 240))
            bar_w = int((VW - 80) * min(1.0, g_prog))
            if bar_w > 12:
                draw.rounded_rectangle((40, pb_y, 40 + bar_w, pb_y + 18), radius=9, fill=acc)

            proc.stdin.write(frame.tobytes())

    proc.stdin.close()
    proc.wait()
    bgm_wav.unlink(missing_ok=True)


# ==============================================================================
# PART 4: KIDSFIT INSTAGRAM & THREADS 1080x1080 PROFILE IMAGE PACK (3 STYLES)
# ==============================================================================
def build_insta_threads_profiles():
    PROFILE_OUT_KO.mkdir(parents=True, exist_ok=True)
    PROFILE_SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

    S = 1080
    f_eng_top = get_font(34, bold=True)
    f_main_ko = get_font(156, bold=True)
    f_sub = get_font(44, bold=True)
    f_pill = get_font(36, bold=True)
    f_tag = get_font(30, bold=True)

    # ------------------------------------------------------------------
    # Style 1: Royal Indigo & Emerald-Mint Premium Emblem (고급 클리닉 엠블럼형)
    # ------------------------------------------------------------------
    img1 = Image.new("RGB", (S, S), (30, 27, 75))
    d1 = ImageDraw.Draw(img1)
    # Radial gradient feel via concentric circles
    for r in range(540, 0, -4):
        ratio = r / 540.0
        col = (
            int(30 * ratio + 79 * (1 - ratio)),
            int(27 * ratio + 70 * (1 - ratio)),
            int(75 * ratio + 229 * (1 - ratio)),
        )
        d1.ellipse((540 - r, 540 - r, 540 + r, 540 + r), fill=col)

    # Circular safe-zone double ring (r=490 and r=468)
    d1.ellipse((50, 50, 1030, 1030), outline=(167, 243, 208), width=10)
    d1.ellipse((74, 74, 1006, 1006), outline=(255, 255, 255), width=3)

    # Cute sprout + growth crown icon at top center (y=150..275)
    # Stem & two leaves in fresh emerald mint (#34D399) + golden star (#FBBF24)
    d1.polygon([(540, 130), (554, 165), (590, 165), (562, 186), (572, 222), (540, 200), (508, 222), (518, 186), (490, 165), (526, 165)], fill=(251, 191, 36))
    d1.ellipse((475, 215, 538, 265), fill=(52, 211, 153))
    d1.ellipse((542, 215, 605, 265), fill=(16, 185, 129))
    d1.rounded_rectangle((533, 230, 547, 285), radius=7, fill=(167, 243, 208))

    # Top English Pill Badge
    top_txt = "KIDS-FIT GROWTH STUDIO"
    bb = d1.textbbox((0, 0), top_txt, font=f_eng_top)
    tw = bb[2] - bb[0]
    d1.rounded_rectangle((540 - tw // 2 - 36, 305, 540 + tw // 2 + 36, 372), radius=33, fill=(255, 255, 255))
    d1.text((540 - tw // 2, 319 - bb[1]), top_txt, font=f_eng_top, fill=(49, 46, 129))

    # Center Huge Brand Name: 키즈핏
    main_txt = "키즈핏"
    bb_m = d1.textbbox((0, 0), main_txt, font=f_main_ko)
    mw = bb_m[2] - bb_m[0]
    d1.text((540 - mw // 2 + 5, 415 - bb_m[1] + 6), main_txt, font=f_main_ko, fill=(15, 23, 42))
    d1.text((540 - mw // 2, 415 - bb_m[1]), main_txt, font=f_main_ko, fill=(255, 255, 255))

    # Subtitle: 소아성장 · 두뇌학습
    sub_txt = "소아성장 · 두뇌학습 연구소"
    bb_s = d1.textbbox((0, 0), sub_txt, font=f_sub)
    sw = bb_s[2] - bb_s[0]
    d1.text((540 - sw // 2, 625 - bb_s[1]), sub_txt, font=f_sub, fill=(254, 240, 138))

    # 2 Dual-Pillar Capsules inside circular safe zone (y=715..805)
    d1.rounded_rectangle((175, 715, 525, 800), radius=42, fill=(16, 185, 129))
    p1_txt = "★ 숨은키 +7cm"
    bb_p1 = d1.textbbox((0, 0), p1_txt, font=f_pill)
    d1.text((350 - (bb_p1[2] - bb_p1[0]) // 2, 737 - bb_p1[1]), p1_txt, font=f_pill, fill=(255, 255, 255))

    d1.rounded_rectangle((555, 715, 905, 800), radius=42, fill=(249, 115, 22))
    p2_txt = "★ 두뇌역량 LQ"
    bb_p2 = d1.textbbox((0, 0), p2_txt, font=f_pill)
    d1.text((730 - (bb_p2[2] - bb_p2[0]) // 2, 737 - bb_p2[1]), p2_txt, font=f_pill, fill=(255, 255, 255))

    # Bottom Domain Badge
    dom_txt = "truthofmarket.com"
    bb_d = d1.textbbox((0, 0), dom_txt, font=f_tag)
    dw = bb_d[2] - bb_d[0]
    d1.rounded_rectangle((540 - dw // 2 - 34, 835, 540 + dw // 2 + 34, 898), radius=31, fill=(49, 46, 129), outline=(165, 180, 252), width=3)
    d1.text((540 - dw // 2, 850 - bb_d[1]), dom_txt, font=f_tag, fill=(224, 231, 255))

    p1_path = PROFILE_OUT_KO / "01_키즈핏_인스타쓰레드_프로필_로얄인디고_엠블럼.png"
    img1.save(p1_path, "PNG")
    shutil.copy2(p1_path, PROFILE_SAMPLE_DIR / p1_path.name)

    # ------------------------------------------------------------------
    # Style 2: Warm Ivory & Pastel Illustration Instatoon Style (따뜻한 감성 인스타툰형)
    # ------------------------------------------------------------------
    img2 = Image.new("RGB", (S, S), (250, 248, 245))
    d2 = ImageDraw.Draw(img2)
    # Soft circular pastel background with warm illustration crop at top
    d2.ellipse((44, 44, 1036, 1036), fill=(255, 253, 249), outline=(79, 70, 229), width=12)
    d2.ellipse((68, 68, 1012, 1012), outline=(167, 243, 208), width=6)

    # Paste circular-masked warm mother & child illustration in top half (center=540, 340, r=210)
    raw_happy = ROOT_DIR / "samples" / "2_webtoon_sample" / "raw" / "cut_06.jpg"
    if raw_happy.exists():
        art = Image.open(raw_happy).convert("RGB").resize((440, 440), Image.Resampling.LANCZOS)
        mask = Image.new("L", (440, 440), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, 440, 440), fill=255)
        img2.paste(art, (320, 110), mask)
        d2.ellipse((316, 106, 764, 554), outline=(79, 70, 229), width=8)

    # Ribbon banner overlapping bottom of character circle
    d2.rounded_rectangle((220, 495, 860, 570), radius=37, fill=(79, 70, 229))
    rib_txt = "★ 우리 아이 성장 · 두뇌 발달 연구소 ★"
    bb_r = d2.textbbox((0, 0), rib_txt, font=f_pill)
    d2.text((540 - (bb_r[2] - bb_r[0]) // 2, 513 - bb_r[1]), rib_txt, font=f_pill, fill=(255, 255, 255))

    # Big Friendly Brand Name: 키즈핏
    bb_m2 = d2.textbbox((0, 0), main_txt, font=f_main_ko)
    mw2 = bb_m2[2] - bb_m2[0]
    d2.text((540 - mw2 // 2, 588 - bb_m2[1]), main_txt, font=f_main_ko, fill=(30, 27, 75))

    # Bottom dual tags
    d2.rounded_rectangle((185, 775, 895, 855), radius=40, fill=(236, 253, 245), outline=(16, 185, 129), width=4)
    b2_txt = "숨은키 +7cm × 5대 학습역량(LQ) 1분 진단"
    bb_b2 = d2.textbbox((0, 0), b2_txt, font=f_pill)
    d2.text((540 - (bb_b2[2] - bb_b2[0]) // 2, 795 - bb_b2[1]), b2_txt, font=f_pill, fill=(6, 95, 70))

    d2.text((540 - dw // 2, 882 - bb_d[1]), dom_txt, font=f_tag, fill=(79, 70, 229))

    p2_path = PROFILE_OUT_KO / "02_키즈핏_인스타쓰레드_프로필_웜아이보리_감성툰형.png"
    img2.save(p2_path, "PNG")
    shutil.copy2(p2_path, PROFILE_SAMPLE_DIR / p2_path.name)

    # ------------------------------------------------------------------
    # Style 3: Clean Clinic White & Emerald-Indigo Badge (깔끔한 화이트 클리닉 배지형)
    # ------------------------------------------------------------------
    img3 = Image.new("RGB", (S, S), (244, 246, 251))
    d3 = ImageDraw.Draw(img3)
    d3.ellipse((46, 46, 1034, 1034), fill=(255, 255, 255), outline=(79, 70, 229), width=14)
    d3.ellipse((74, 74, 1006, 1006), outline=(16, 185, 129), width=5)

    # Growth chart ascending curve + sparkle nodes at top (y=170..310)
    pts_curve = [(280, 290), (410, 265), (540, 225), (670, 175), (800, 125)]
    d3.line(pts_curve, fill=(16, 185, 129), width=14)
    for idx_p, (px, py) in enumerate(pts_curve):
        r_dot = 22 if idx_p == len(pts_curve) - 1 else 14
        col_dot = (249, 115, 22) if idx_p == len(pts_curve) - 1 else (79, 70, 229)
        d3.ellipse((px - r_dot, py - r_dot, px + r_dot, py + r_dot), fill=col_dot, outline=(255, 255, 255), width=4)

    # Top label
    t3_txt = "질병관리청 성장도표 · K-DST 기준"
    bb_t3 = d3.textbbox((0, 0), t3_txt, font=f_pill)
    tw3 = bb_t3[2] - bb_t3[0]
    d3.rounded_rectangle((540 - tw3 // 2 - 34, 325, 540 + tw3 // 2 + 34, 398), radius=36, fill=(238, 242, 255))
    d3.text((540 - tw3 // 2, 342 - bb_t3[1]), t3_txt, font=f_pill, fill=(67, 56, 202))

    # Center Huge Brand Name: 키즈핏
    d3.text((540 - mw // 2, 425 - bb_m[1]), main_txt, font=f_main_ko, fill=(15, 23, 42))

    # Subtitle
    sub3_txt = "KIDS-FIT 양육 연구소"
    bb_s3 = d3.textbbox((0, 0), sub3_txt, font=f_sub)
    d3.text((540 - (bb_s3[2] - bb_s3[0]) // 2, 630 - bb_s3[1]), sub3_txt, font=f_sub, fill=(79, 70, 229))

    # 2 Capsules
    d3.rounded_rectangle((175, 720, 525, 805), radius=42, fill=(236, 253, 245), outline=(16, 185, 129), width=4)
    d3.text((350 - (bb_p1[2] - bb_p1[0]) // 2, 742 - bb_p1[1]), p1_txt, font=f_pill, fill=(4, 120, 87))

    d3.rounded_rectangle((555, 720, 905, 805), radius=42, fill=(238, 242, 255), outline=(79, 70, 229), width=4)
    d3.text((730 - (bb_p2[2] - bb_p2[0]) // 2, 742 - bb_p2[1]), p2_txt, font=f_pill, fill=(67, 56, 202))

    d3.rounded_rectangle((540 - dw // 2 - 34, 838, 540 + dw // 2 + 34, 900), radius=31, fill=(15, 23, 42))
    d3.text((540 - dw // 2, 853 - bb_d[1]), dom_txt, font=f_tag, fill=(255, 255, 255))

    p3_path = PROFILE_OUT_KO / "03_키즈핏_인스타쓰레드_프로필_화이트클리닉_배지형.png"
    img3.save(p3_path, "PNG")
    shutil.copy2(p3_path, PROFILE_SAMPLE_DIR / p3_path.name)

    # ------------------------------------------------------------------
    # Circular Crop Comparison Sheet (00_인스타쓰레드_원형적용_미리보기_3종비교.png)
    # ------------------------------------------------------------------
    comp = Image.new("RGB", (1600, 680), (248, 250, 252))
    dc = ImageDraw.Draw(comp)
    f_hdr = get_font(38, bold=True)
    f_lbl = get_font(28, bold=True)
    hdr_txt = "★ KidsFit 인스타그램 & 쓰레드 원형 프로필 적용 미리보기 (3종 비교)"
    bb_h = dc.textbbox((0, 0), hdr_txt, font=f_hdr)
    dc.text(((1600 - (bb_h[2] - bb_h[0])) // 2, 36 - bb_h[1]), hdr_txt, font=f_hdr, fill=(15, 23, 42))

    circle_mask = Image.new("L", (400, 400), 0)
    ImageDraw.Draw(circle_mask).ellipse((0, 0, 400, 400), fill=255)

    items_comp = [
        (img1, "① 로얄인디고 엠블럼형", 120),
        (img2, "② 웜아이보리 감성툰형", 600),
        (img3, "③ 화이트 클리닉 배지형", 1080),
    ]
    for src_im, label, x_pos in items_comp:
        # Instagram gradient story ring
        dc.ellipse((x_pos - 8, 122, x_pos + 408, 538), fill=(225, 48, 108))
        dc.ellipse((x_pos - 3, 127, x_pos + 403, 533), fill=(255, 255, 255))
        thumb = src_im.resize((400, 400), Image.Resampling.LANCZOS)
        comp.paste(thumb, (x_pos, 130), circle_mask)
        bb_l = dc.textbbox((0, 0), label, font=f_lbl)
        dc.text((x_pos + 200 - (bb_l[2] - bb_l[0]) // 2, 565 - bb_l[1]), label, font=f_lbl, fill=(30, 41, 59))

    comp_path = PROFILE_OUT_KO / "00_인스타쓰레드_원형적용_미리보기_3종비교.png"
    comp.save(comp_path, "PNG")
    shutil.copy2(comp_path, PROFILE_SAMPLE_DIR / comp_path.name)

    # Also save Instagram & Threads Bio Profile Text guide
    bio_guide = """======================================================================
📱 [KidsFit 인스타그램 & 쓰레드(Threads) 프로필 세팅 가이드]
======================================================================

1. 프로필 이름 (Name):
   키즈핏(KIDS-FIT) | 우리아이 키성장·두뇌발달 연구소

2. 인스타그램 소개글 (Bio — 그대로 복사해서 붙여넣으세요):
   🌱 질병관리청 성장도표 & 보건복지부 K-DST 기준
   📏 제1축: 우리 아이 숨은 키 +7cm 수면·영양·자세 처방
   🧠 제2축: 5대 두뇌 학습역량(LQ) & 연령별 맞춤 공부법
   🎁 아래 링크에서 1분 무료 진단 & 월령별 워크지 PDF 받기 👇

3. 프로필 웹사이트 링크 (Link):
   https://truthofmarket.com

4. 쓰레드(Threads) 소개글 (그대로 복사해서 붙여넣으세요):
   소아내분비·뇌인지 학술 논문 2,690+편 기반으로 우리 아이 숨은 키 +7cm 골든타임과 5대 두뇌 학습역량(LQ)을 연구합니다 🌱
   👇 우리 아이 키 백분위 & 두뇌 역량 1분 무료 진단 리포트
   https://truthofmarket.com
"""
    bio_path = PROFILE_OUT_KO / "04_인스타_쓰레드_프로필소개글_링크_세팅가이드.txt"
    bio_path.write_text(bio_guide, encoding="utf-8")
    shutil.copy2(bio_path, PROFILE_SAMPLE_DIR / bio_path.name)

    # Create ZIP archive
    zip_prof = PROFILE_OUT_KO / "키즈핏_인스타_쓰레드_프로필이미지_3종패키지.zip"
    with zipfile.ZipFile(zip_prof, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in sorted(PROFILE_OUT_KO.glob("*")):
            if fp.is_file() and not fp.name.endswith(".zip"):
                zf.write(fp, arcname=f"인스타_쓰레드_프로필_모음/{fp.name}")
    shutil.copy2(zip_prof, PROFILE_SAMPLE_DIR / zip_prof.name)
    print(f"✅ 인스타/쓰레드 프로필 3종 패키지 생성 완료: {zip_prof}")


def main():
    # 1. Build Instagram & Threads Profile Image Pack
    build_insta_threads_profiles()

    # 2. Build 16-second (4 cuts x 4.0s) Page-Flipping Webtoon Videos with Soothing Piano BGM & NO Voice!
    CLIP_OUT_KO.mkdir(parents=True, exist_ok=True)
    CLIP_SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

    all_bundled_cuts = []
    for ep in EPISODES_SPEC:
        ep_cuts = []
        total_c = len(ep["cuts"])
        for idx, c in enumerate(ep["cuts"], start=1):
            cut_entry = {
                "img_path": ep["folder"] / c["img"],
                "sub": c["sub"],
                "badge": ep["badge"],
                "header_title": ep["header_title"],
                "accent": ep["accent"],
                "bg_top": ep["bg_top"],
                "step_label": f"{idx} / {total_c}",
            }
            ep_cuts.append(cut_entry)
            all_bundled_cuts.append({
                **cut_entry,
                "step_label": f"EP.{ep['ep_id'][-1]} ({idx}/{total_c})",
            })

        out_mp4 = CLIP_OUT_KO / ep["filename"]
        print(f"🎬 [16초 책넘김 + 잔잔한 피아노 BGM (무음성)] 생성 중: {out_mp4.name} ...")
        render_pageflip_video(ep_cuts, out_mp4, cut_dur=4.0, flip_dur=0.65, fps=24)
        shutil.copy2(out_mp4, CLIP_SAMPLE_DIR / ep["filename"])
        print(f"✅ 완료: {out_mp4.name} ({out_mp4.stat().st_size:,} bytes)")

    # Also update the 1~3화 Combined Bundled Video with Page-Flip & Soothing Piano BGM (NO voice)
    bundled_mp4 = CLIP_OUT_KO / "00_네이버클립_웹툰_1~3화_통합묶음_합본영상.mp4"
    print(f"🎬 [1~3화 통합 책넘김 + 잔잔한 피아노 BGM (무음성)] 생성 중: {bundled_mp4.name} ...")
    render_pageflip_video(all_bundled_cuts, bundled_mp4, cut_dur=4.0, flip_dur=0.65, fps=24)
    shutil.copy2(bundled_mp4, CLIP_SAMPLE_DIR / bundled_mp4.name)
    print(f"✅ 완료: {bundled_mp4.name} ({bundled_mp4.stat().st_size:,} bytes)")

    # Also update samples/4_webtoon_video_sample/webtoon_parenting_video.mp4 with the 16s page-flip EP1 video
    sample4_mp4 = ROOT_DIR / "samples" / "4_webtoon_video_sample" / "webtoon_parenting_video.mp4"
    if sample4_mp4.parent.exists():
        shutil.copy2(CLIP_OUT_KO / "01_네이버클립_웹툰1화_만3세소근육민감기.mp4", sample4_mp4)

    # Update ZIP archive
    zip_path = ROOT_DIR / "네이버클립_웹툰영상_모음_전체파일.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in sorted(CLIP_OUT_KO.glob("*")):
            if fp.is_file() and not fp.name.endswith(".zip"):
                zf.write(fp, arcname=f"네이버클립_웹툰영상_모음/{fp.name}")
    shutil.copy2(zip_path, CLIP_OUT_KO / zip_path.name)
    shutil.copy2(zip_path, CLIP_SAMPLE_DIR / zip_path.name)
    print(f"📦 전체 압축 완료: {zip_path} ({zip_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
