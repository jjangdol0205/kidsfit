import os
import sys
import shutil
import math
import struct
import wave
import asyncio
import subprocess
import traceback
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import edge_tts
import imageio_ffmpeg

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path("D:/드림컴퍼니/5사업부")
OUT_DIR = ROOT / "samples" / "shorts_ep1_newborn"
DIST_OUT_DIR = ROOT / "dist" / "samples" / "shorts_ep1_newborn"
AUDIO_DIR = OUT_DIR / "audio"
FLOW_CLIPS_DIR = OUT_DIR / "flow_clips"
WORK_DIR = OUT_DIR / "_work_master"
FONT_PATH = ROOT / "src" / "fonts" / "NanumSquareRoundEB.ttf"

OUT_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
FLOW_CLIPS_DIR.mkdir(parents=True, exist_ok=True)
WORK_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
DOWNLOADS = Path(r"C:\Users\jjang\Downloads")

FPS = 30
SAMPLE_RATE = 48000
SAMPLES_PER_FRAME = SAMPLE_RATE // FPS  # Exact integer: 1600 samples per 1/30s frame!


def resolve_clip(dl_name, fallback_scene):
    p_dl = DOWNLOADS / dl_name
    if p_dl.exists():
        return p_dl
    return FLOW_CLIPS_DIR / fallback_scene


def run_ffmpeg(args):
    cmd = [FFMPEG_EXE, "-y"] + args
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="ignore")
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {res.stderr[-800:]}")
    return res


def build_vfx_open_bottle_clip(src_mp4, out_mp4):
    if out_mp4.exists() and out_mp4.stat().st_size > 300_000:
        print(f"  [VFX] Using cached open-bottle VFX clip: {out_mp4.name}", flush=True)
        return out_mp4

    print("  [VFX] Removing closed bottle nipple & rendering open-top bottle on Cut 3 (NumPy vectorized)...", flush=True)
    raw_frames_dir = WORK_DIR / "_c3_raw_frames"
    vfx_frames_dir = WORK_DIR / "_c3_vfx_frames"
    raw_frames_dir.mkdir(parents=True, exist_ok=True)
    vfx_frames_dir.mkdir(parents=True, exist_ok=True)

    for f in raw_frames_dir.glob("*.png"):
        f.unlink()
    for f in vfx_frames_dir.glob("*.jpg"):
        f.unlink()

    run_ffmpeg([
        "-ss", "0.80",
        "-t", "5.60",
        "-i", str(src_mp4),
        "-vf", "scale=1080:1920,fps=24",
        str(raw_frames_dir / "f_%04d.png")
    ])

    frame_files = sorted(raw_frames_dir.glob("f_*.png"))
    t_x = np.linspace(0.0, 1.0, 715 - 280, dtype=np.float32)[None, :, None]

    wy_top = np.ones((1296 - 895, 1, 1), dtype=np.float32)
    wy_top[:15, 0, 0] = np.linspace(0.0, 14.0 / 15.0, 15, dtype=np.float32)

    wy_rim = np.linspace(1.0, 1.0 / 16.0, 1312 - 1296, dtype=np.float32)[:, None, None]
    rim_x_idx = np.arange(280, 715)
    outside_neck_mask = ((rim_x_idx < 365) | (rim_x_idx > 632))[None, :, None]

    dx_arr = np.arange(60, dtype=np.float32)
    dist_center = np.abs(dx_arr - 29.5) / 30.0
    alpha_stream = (np.maximum(0.0, 1.0 - (dist_center ** 1.6)) * 0.92)[None, :, None]

    for idx, fp in enumerate(frame_files):
        img = Image.open(fp).convert("RGB")
        arr = np.array(img, dtype=np.float32)

        left_px = np.mean(arr[895:1296, 260:280, :], axis=1, keepdims=True)
        right_px = np.mean(arr[895:1296, 715:735, :], axis=1, keepdims=True)
        bg_top = left_px * (1.0 - t_x) + right_px * t_x
        arr[895:1296, 280:715, :] = arr[895:1296, 280:715, :] * (1.0 - wy_top) + bg_top * wy_top

        left_rim = np.mean(arr[1296:1312, 260:280, :], axis=1, keepdims=True)
        right_rim = np.mean(arr[1296:1312, 715:735, :], axis=1, keepdims=True)
        bg_rim = left_rim * (1.0 - t_x) + right_rim * t_x
        blended_rim = arr[1296:1312, 280:715, :] * (1.0 - wy_rim) + bg_rim * wy_rim
        arr[1296:1312, 280:715, :] = np.where(outside_neck_mask, bg_rim, blended_rim)

        neck_patch = arr[1296:1365, 355:645, :]
        neck_avg = np.mean(neck_patch, axis=2, keepdims=True)
        arr[1296:1365, 355:645, :] = neck_patch * 0.30 + neck_avg * 0.70

        nozzle_patch = arr[860:895, 462:522, :]
        bg_ref = np.mean(arr[860:895, 380:420, :])
        if np.mean(np.abs(nozzle_patch - bg_ref)) > 6.5:
            base_row = np.mean(arr[880:895, 462:522, :], axis=0, keepdims=True)
            shimmer_src = arr[1365:1365 + (1322 - 892), 456:516, :]
            shimmer = shimmer_src * 0.45 + base_row * 0.55
            stream_region = arr[892:1322, 462:522, :]
            arr[892:1322, 462:522, :] = stream_region * (1.0 - alpha_stream) + shimmer * alpha_stream

        out_img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        out_img.save(str(vfx_frames_dir / f"vfx_{idx:04d}.jpg"), quality=95)

    run_ffmpeg([
        "-framerate", "24",
        "-i", str(vfx_frames_dir / "vfx_%04d.jpg"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "17",
        str(out_mp4)
    ])
    print("  [VFX] Cut 3 open-bottle clip ready!", flush=True)
    return out_mp4


# ---------------------------------------------------------------------------
# Giant-Typography High-Impact 2026 YouTube Shorts Structure (~21.5s Total)
# - Opening Hook Title: 88pt / 98pt Ultra-Bold (2x visual impact!)
# - Main Captions: 84pt ~ 90pt Giant 1-or-2-line stacked typography (ZERO small text!)
# - 100% 1:1 Word Match between Voice and Subtitle
# ---------------------------------------------------------------------------
W_WHITE = (255, 255, 255, 255)
W_YELLOW = (255, 232, 88, 255)

SHOTS = [
    {
        "idx": 1,
        "src_file": resolve_clip("Mother_dispensing_vitamin_drop_b3178e9f_1080p.mp4", "scene1.mp4"),
        "speaker_duet": "mom",
        "show_intro_title": True,
        "subclips": [
            {"ss": 0.0, "t": 2.9, "vf": f"scale=1240:2204,crop=1080:1920:140:180,fps={FPS}", "beats": [0, 1]},
            {"ss": 2.9, "t": 1.5, "vf": f"scale=1380:2453,crop=1080:1920:190:340,fps={FPS}", "beats": [2]},
        ],
        "voice_lines": [
            {
                "text": "조리원 퇴소 전 필수템 다섯 가지!",
                "lines": [
                    [("조리원 퇴소 전", W_WHITE)],
                    [("필수템 5가지!", W_YELLOW)],
                ]
            },
            {
                "text": "첫째 액상 비타민D 드롭스!",
                "lines": [
                    [("첫째 액상", W_WHITE)],
                    [("비타민D 드롭스!", W_YELLOW)],
                ]
            },
            {
                "text": "하루 딱 한 방울이면 끝이에요!",
                "lines": [
                    [("하루 딱 ", W_WHITE), ("한 방울", W_YELLOW), ("이면", W_WHITE)],
                    [("끝이에요!", W_WHITE)],
                ]
            }
        ]
    },
    {
        "idx": 2,
        "src_file": resolve_clip("Parent_zipping_baby_swaddle_1103c384_1080p.mp4", "scene2.mp4"),
        "speaker_duet": "dad",
        "show_intro_title": False,
        "subclips": [
            {"ss": 5.25, "t": 1.3, "vf": f"scale=1480:2631,crop=1080:1920:200:80,fps={FPS}", "beats": [0]},
            {"ss": 5.95, "t": 1.9, "vf": f"scale=1240:2204,crop=1080:1920:80:40,fps={FPS}", "beats": [1, 2]},
        ],
        "voice_lines": [
            {
                "text": "둘째 모로반사 스와들업!",
                "lines": [
                    [("둘째 ", W_WHITE), ("모로반사", W_YELLOW)],
                    [("스와들업!", W_YELLOW)],
                ]
            },
            {
                "text": "깜짝 놀라 깨는 걸 막아줘서",
                "lines": [
                    [("깜짝 놀라 ", W_WHITE), ("깨는 걸", W_YELLOW)],
                    [("막아줘서", W_YELLOW)],
                ]
            },
            {
                "text": "새벽 내내 꿀잠 자요!",
                "lines": [
                    [("새벽 내내 ", W_WHITE), ("꿀잠 자요!", W_YELLOW)],
                ]
            }
        ]
    },
    {
        "idx": 3,
        "src_file": resolve_clip("Dispensing_warm_water_into_bottle_752d49af_1080p.mp4", "scene3.mp4"),
        "use_vfx_open_bottle": True,
        "speaker_duet": "mom",
        "show_intro_title": False,
        "subclips": [
            {"ss": 0.2, "t": 1.7, "vf": f"scale=1080:1920,fps={FPS}", "beats": [0]},
            {"ss": 1.9, "t": 3.3, "vf": f"scale=1188:2112,crop=1080:1920:54:96,fps={FPS}", "beats": [1, 2]},
        ],
        "voice_lines": [
            {
                "text": "셋째 사십삼 도 분유포트!",
                "lines": [
                    [("셋째 ", W_WHITE), ("43℃ 분유포트!", W_YELLOW)],
                ]
            },
            {
                "text": "맘마 타는 건 물론이고",
                "lines": [
                    [("맘마 타는 건", W_YELLOW), (" 물론이고", W_WHITE)],
                ]
            },
            {
                "text": "일 초 출수라 진짜 편해요!",
                "lines": [
                    [("1초 출수", W_YELLOW), ("라", W_WHITE)],
                    [("진짜 편해요!", W_WHITE)],
                ]
            }
        ]
    },
    {
        "idx": 4,
        "src_file": resolve_clip("Newborn_doing_tummy_time_b4227629_1080p.mp4", "scene4.mp4"),
        "speaker_duet": "dad",
        "show_intro_title": False,
        "subclips": [
            {"ss": 0.3, "t": 2.6, "vf": f"scale=1080:1920,fps={FPS}", "beats": [0, 1]},
            {"ss": 2.9, "t": 1.6, "vf": f"scale=1200:2133,crop=1080:1920:60:110,fps={FPS}", "beats": [2]},
        ],
        "voice_lines": [
            {
                "text": "넷째 신생아 흑백 초점책!",
                "lines": [
                    [("넷째 ", W_WHITE), ("신생아", W_YELLOW)],
                    [("흑백 초점책!", W_YELLOW)],
                ]
            },
            {
                "text": "터미타임 할 때 세워두면",
                "lines": [
                    [("터미타임", W_YELLOW), (" 할 때", W_WHITE)],
                    [("세워두면", W_WHITE)],
                ]
            },
            {
                "text": "혼자서도 초집중해서 봐요!",
                "lines": [
                    [("혼자서도", W_WHITE)],
                    [("초집중", W_YELLOW), ("해서 봐요!", W_WHITE)],
                ]
            }
        ]
    },
    {
        "idx": 5,
        "src_file": resolve_clip("Hands_opening_newborn_gift_box_0da850de_1080p.mp4", "scene5.mp4"),
        "speaker_duet": "mom",
        "show_intro_title": False,
        "subclips": [
            {"ss": 0.0, "t": 2.9, "vf": f"scale=1260:2240,crop=1080:1920:90:0,fps={FPS}", "beats": [0, 1]},
            {"ss": 5.9, "t": 1.8, "vf": f"scale=1360:2418,crop=1080:1920:140:120,fps={FPS}", "beats": [2]},
        ],
        "voice_lines": [
            {
                "text": "다섯째 출산 축하 기프트박스!",
                "lines": [
                    [("다섯째 ", W_WHITE), ("출산 축하", W_YELLOW)],
                    [("기프트박스!", W_YELLOW)],
                ]
            },
            {
                "text": "다섯 가지 혜택가와 무료 진단은",
                "lines": [
                    [("5가지 ", W_WHITE), ("혜택가와", W_YELLOW)],
                    [("무료 진단은", W_YELLOW)],
                ]
            },
            {
                "text": "프로필 키즈핏에서 확인하세요!",
                "lines": [
                    [("프로필 ", W_WHITE), ("[키즈핏]", W_YELLOW), ("에서", W_WHITE)],
                    [("확인하세요!", W_WHITE)],
                ]
            }
        ]
    }
]

VOICE_MAP = {
    "mom": "ko-KR-SunHiNeural",
    "dad": "ko-KR-HyunsuMultilingualNeural"
}


def get_wav_duration(wav_path):
    with wave.open(str(wav_path), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate())


def concat_wavs(wav_paths, out_wav_path):
    with wave.open(str(wav_paths[0]), "rb") as first:
        params = first.getparams()
        frames_list = [first.readframes(first.getnframes())]
    for p in wav_paths[1:]:
        with wave.open(str(p), "rb") as wf:
            frames_list.append(wf.readframes(wf.getnframes()))
    with wave.open(str(out_wav_path), "wb") as out:
        out.setparams(params)
        for data in frames_list:
            out.writeframes(data)


async def synthesize_snappy_frame_locked_line(text, voice, rate, pitch, out_wav):
    raw_mp3 = out_wav.with_suffix(".raw.mp3")
    tmp_wav = out_wav.with_suffix(".tmp.wav")
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(str(raw_mp3))

    af_filter = (
        "silenceremove=start_periods=1:start_duration=0.0:start_threshold=-38dB,"
        "areverse,silenceremove=start_periods=1:start_duration=0.0:start_threshold=-40dB,areverse,"
        "atempo=1.12,"
        "equalizer=f=220:t=q:w=1.2:g=2.0,"
        "equalizer=f=3600:t=q:w=1.4:g=1.6,"
        "apad=pad_dur=0.03"
    )
    run_ffmpeg([
        "-i", str(raw_mp3),
        "-af", af_filter,
        "-ar", str(SAMPLE_RATE),
        "-ac", "2",
        str(tmp_wav)
    ])
    if raw_mp3.exists():
        raw_mp3.unlink()

    with wave.open(str(tmp_wav), "rb") as wf:
        params = wf.getparams()
        n_samples = wf.getnframes()
        raw_bytes = wf.readframes(n_samples)

    n_frames = max(18, math.ceil(n_samples / float(SAMPLES_PER_FRAME)))
    target_samples = n_frames * SAMPLES_PER_FRAME
    pad_samples = target_samples - n_samples

    with wave.open(str(out_wav), "wb") as out:
        out.setparams(params)
        out.writeframes(raw_bytes)
        if pad_samples > 0:
            out.writeframes(b"\x00\x00\x00\x00" * pad_samples)

    if tmp_wav.exists():
        tmp_wav.unlink()

    return n_frames, target_samples / float(SAMPLE_RATE)


def generate_upbeat_shorts_bgm_and_sfx(total_duration, shot_starts, beat_starts, out_bgm_wav):
    n_samples = int((total_duration + 0.5) * SAMPLE_RATE)
    chords = [
        [261.63, 329.63, 392.00, 523.25],
        [293.66, 369.99, 440.00, 587.33],
        [246.94, 329.63, 392.00, 493.88],
        [261.63, 349.23, 440.00, 523.25],
    ]
    buf = bytearray(n_samples * 4)
    beat_sec = 0.28
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        chord = chords[int(t / 1.12) % len(chords)]
        beat_pos = (t % beat_sec) / beat_sec
        env = math.exp(-beat_pos * 6.2) * 0.026
        note = chord[int(t / beat_sec) % len(chord)]
        val = math.sin(2 * math.pi * note * t) * env
        val += 0.40 * math.sin(2 * math.pi * (note * 0.5) * t) * (env * 0.65)

        for st in shot_starts:
            dt = t - st
            if 0.0 <= dt < 0.12:
                pop_env = math.exp(-dt * 32.0) * 0.12
                pop_freq = 659.25 if dt < 0.05 else 987.77
                val += math.sin(2 * math.pi * pop_freq * dt) * pop_env

        for bt in beat_starts:
            dt = t - bt
            if 0.0 <= dt < 0.04:
                tick_env = math.exp(-dt * 75.0) * 0.045
                val += math.sin(2 * math.pi * 1200.0 * dt) * tick_env

        s_int = max(-32767, min(32767, int(val * 32767)))
        struct.pack_into("<hh", buf, i * 4, s_int, s_int)

    with wave.open(str(out_bgm_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(buf)


def load_creator_font(size):
    if FONT_PATH.exists():
        return ImageFont.truetype(str(FONT_PATH), size)
    return ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", size)


def draw_multi_segment_outlined_line(base_rgba, segments, y, target_font_size=86, stroke_width=16):
    """
    Renders a single centered line of giant rounded Korean typography:
    - Automatically ensures total width <= 960px (leaving >=60px margin on left and right of 1080px screen)
    - Uses 3-Pass rendering (Pass 1: Unified thick black stroke, Pass 2: White fill, Pass 3: Yellow highlight fill)
      so the black outline is 100% seamless and uncut!
    """
    W, H = base_rgba.size
    full_text = "".join(seg[0] for seg in segments)

    font_size = target_font_size
    font = load_creator_font(font_size)
    dummy_draw = ImageDraw.Draw(base_rgba)

    while font_size > 44:
        bbox = dummy_draw.textbbox((0, 0), full_text, font=font, stroke_width=stroke_width)
        tw = bbox[2] - bbox[0]
        if tw <= 960:
            break
        font_size -= 2
        font = load_creator_font(font_size)

    total_adv = dummy_draw.textlength(full_text, font=font)
    start_x = int((W - total_adv) / 2.0)
    start_x = max(60, min(W - 60 - int(total_adv), start_x))

    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d_sh = ImageDraw.Draw(shadow_layer)
    d_sh.text(
        (start_x, y + 8),
        full_text,
        font=font,
        fill=(0, 0, 0, 195),
        stroke_width=stroke_width + 5,
        stroke_fill=(0, 0, 0, 195)
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=7))

    txt_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d_txt = ImageDraw.Draw(txt_layer)
    d_txt.text(
        (start_x, y),
        full_text,
        font=font,
        fill=(0, 0, 0, 255),
        stroke_width=stroke_width,
        stroke_fill=(0, 0, 0, 255)
    )

    fill_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d_fill = ImageDraw.Draw(fill_layer)
    d_fill.text(
        (start_x, y),
        full_text,
        font=font,
        fill=W_WHITE,
        stroke_width=0
    )

    prefix = ""
    for seg_txt, fill_rgba in segments:
        if fill_rgba != W_WHITE:
            x0 = int(round(start_x + dummy_draw.textlength(prefix, font=font)))
            x1 = int(round(start_x + dummy_draw.textlength(prefix + seg_txt, font=font)))
            hl_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d_hl = ImageDraw.Draw(hl_layer)
            d_hl.text((start_x, y), full_text, font=font, fill=fill_rgba, stroke_width=0)
            mask = Image.new("L", (W, H), 0)
            d_mask = ImageDraw.Draw(mask)
            d_mask.rectangle([max(0, x0), 0, min(W, x1 + 2), H], fill=255)
            fill_layer = Image.composite(hl_layer, fill_layer, mask)
        prefix += seg_txt

    txt_layer = Image.alpha_composite(txt_layer, fill_layer)
    merged = Image.alpha_composite(base_rgba, shadow_layer)
    return Image.alpha_composite(merged, txt_layer)


def create_pangpang_style_overlay_png(shot, line_idx, line_obj, out_png_path):
    """
    Creates a 1080x1920 RGBA overlay with GIANT mobile-first Shorts typography:
    - Opening Hook Title (Cut 1 Beats 0 & 1): 88pt / 98pt at y=330..450
    - Main Subtitle: 86pt ~ 90pt (1 or 2 stacked lines at y=1090..1205)
    """
    W, H = 1080, 1920
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # Keep the giant opening hook visible across Beat 0 AND Beat 1 of Shot 1 for maximum hook impact!
    if shot.get("show_intro_title") and line_idx in (0, 1):
        img = draw_multi_segment_outlined_line(
            img,
            [("육아는 장비빨!", W_WHITE)],
            y=330,
            target_font_size=88,
            stroke_width=17
        )
        img = draw_multi_segment_outlined_line(
            img,
            [("신생아 ", W_WHITE), ("필수템 5가지", W_YELLOW)],
            y=448,
            target_font_size=98,
            stroke_width=19
        )

    lines = line_obj["lines"]
    if len(lines) == 1:
        img = draw_multi_segment_outlined_line(
            img,
            lines[0],
            y=1145,
            target_font_size=88,
            stroke_width=17
        )
    else:
        img = draw_multi_segment_outlined_line(
            img,
            lines[0],
            y=1080,
            target_font_size=86,
            stroke_width=17
        )
        img = draw_multi_segment_outlined_line(
            img,
            lines[1],
            y=1195,
            target_font_size=90,
            stroke_width=18
        )

    img.save(str(out_png_path))


async def build_master_flow_video(mode_name="couple_duet", vfx_c3_mp4=None):
    print(f"\n=== Mastering Giant-Text Fast-Paced Shorts ({mode_name}) ===", flush=True)
    segment_mp4s = []
    segment_wavs = []
    shot_starts = []
    beat_starts = []
    cur_t = 0.0

    for shot in SHOTS:
        s_idx = shot["idx"]
        src_video = vfx_c3_mp4 if shot.get("use_vfx_open_bottle") and vfx_c3_mp4 else shot["src_file"]

        voice = VOICE_MAP[shot["speaker_duet"]] if mode_name == "couple_duet" else VOICE_MAP["mom"]
        rate = "+28%" if shot["speaker_duet"] == "mom" else "+26%"
        pitch = "+2Hz" if shot["speaker_duet"] == "mom" else "+0Hz"

        line_wavs = []
        line_frames = []
        line_durs = []
        for l_idx, l_obj in enumerate(shot["voice_lines"]):
            w_path = WORK_DIR / f"{mode_name}_s{s_idx}_l{l_idx}.wav"
            n_frames, dur = await synthesize_snappy_frame_locked_line(l_obj["text"], voice, rate, pitch, w_path)
            line_wavs.append(w_path)
            line_frames.append(n_frames)
            line_durs.append(dur)
            beat_starts.append(cur_t + sum(line_durs[:-1]))

        shot_voice_wav = WORK_DIR / f"{mode_name}_s{s_idx}_voice.wav"
        concat_wavs(line_wavs, shot_voice_wav)
        total_shot_frames = sum(line_frames)
        shot_dur = total_shot_frames / float(FPS)

        png_paths = []
        for l_idx, l_obj in enumerate(shot["voice_lines"]):
            p_path = WORK_DIR / f"ov_{mode_name}_s{s_idx}_l{l_idx}.png"
            create_pangpang_style_overlay_png(shot, l_idx, l_obj, p_path)
            png_paths.append(p_path)

        subclip_mp4s = []
        for sc_idx, sc in enumerate(shot["subclips"]):
            sc_frames = sum(line_frames[b] for b in sc["beats"])
            sc_target_dur = sc_frames / float(FPS)
            sc_src_dur = sc["t"]
            pts_factor = sc_target_dur / float(sc_src_dur)
            sc_mp4 = WORK_DIR / f"{mode_name}_s{s_idx}_sc{sc_idx}.mp4"
            vf_chain = f"setpts={pts_factor:.5f}*(PTS-STARTPTS),{sc['vf']}"
            run_ffmpeg([
                "-ss", f"{sc['ss']:.3f}",
                "-t", f"{sc['t'] + 0.30:.3f}",
                "-i", str(src_video),
                "-vf", vf_chain,
                "-frames:v", str(sc_frames),
                "-r", str(FPS),
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-preset", "fast",
                "-crf", "17",
                "-an",
                str(sc_mp4)
            ])
            subclip_mp4s.append(sc_mp4)

        if len(subclip_mp4s) == 1:
            base_shot_mp4 = subclip_mp4s[0]
        else:
            sc_list = WORK_DIR / f"{mode_name}_s{s_idx}_sc_list.txt"
            sc_list.write_text("\n".join(f"file '{p.as_posix()}'" for p in subclip_mp4s), encoding="utf-8")
            base_shot_mp4 = WORK_DIR / f"{mode_name}_s{s_idx}_base.mp4"
            run_ffmpeg([
                "-f", "concat",
                "-safe", "0",
                "-i", str(sc_list),
                "-c", "copy",
                str(base_shot_mp4)
            ])

        t0 = 0.0
        t1 = line_frames[0] / float(FPS)
        t2 = (line_frames[0] + line_frames[1]) / float(FPS)
        t3 = shot_dur + 0.10

        fc = (
            f"[0:v][1:v]overlay=0:0:enable='between(t,{t0:.4f},{t1 - 0.001:.4f})'[v1];"
            f"[v1][2:v]overlay=0:0:enable='between(t,{t1:.4f},{t2 - 0.001:.4f})'[v2];"
            f"[v2][3:v]overlay=0:0:enable='between(t,{t2:.4f},{t3:.4f})'[vout]"
        )

        seg_mp4 = WORK_DIR / f"{mode_name}_seg_{s_idx}.mp4"
        run_ffmpeg([
            "-i", str(base_shot_mp4),
            "-i", str(png_paths[0]),
            "-i", str(png_paths[1]),
            "-i", str(png_paths[2]),
            "-filter_complex", fc,
            "-map", "[vout]",
            "-frames:v", str(total_shot_frames),
            "-r", str(FPS),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "fast",
            "-crf", "17",
            "-an",
            str(seg_mp4)
        ])

        segment_mp4s.append(seg_mp4)
        segment_wavs.append(shot_voice_wav)
        shot_starts.append(cur_t)
        cur_t += shot_dur
        print(f"  -> Shot {s_idx} mastered: {shot_dur:.2f}s ({total_shot_frames} frames @ {FPS}fps, line durs={[round(d,2) for d in line_durs]})", flush=True)

    concat_list_txt = WORK_DIR / f"{mode_name}_concat.txt"
    concat_list_txt.write_text(
        "\n".join(f"file '{p.as_posix()}'" for p in segment_mp4s),
        encoding="utf-8"
    )
    joined_video_mp4 = WORK_DIR / f"{mode_name}_joined_video.mp4"
    run_ffmpeg([
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list_txt),
        "-c", "copy",
        str(joined_video_mp4)
    ])

    joined_voice_wav = WORK_DIR / f"{mode_name}_joined_voice.wav"
    concat_wavs(segment_wavs, joined_voice_wav)
    total_audio_dur = get_wav_duration(joined_voice_wav)

    bgm_wav = WORK_DIR / f"{mode_name}_bgm.wav"
    generate_upbeat_shorts_bgm_and_sfx(total_audio_dur, shot_starts, beat_starts, bgm_wav)

    final_audio_wav = AUDIO_DIR / f"ep1_flow_{mode_name}.wav"
    final_audio_mp3 = AUDIO_DIR / f"ep1_flow_{mode_name}.mp3"
    run_ffmpeg([
        "-i", str(joined_voice_wav),
        "-i", str(bgm_wav),
        "-filter_complex", "[0:a]volume=1.30[v];[1:a]volume=0.75[b];[v][b]amix=inputs=2:duration=first:dropout_transition=1,alimiter=limit=0.96[out]",
        "-map", "[out]",
        "-ar", str(SAMPLE_RATE),
        "-ac", "2",
        str(final_audio_wav)
    ])
    run_ffmpeg(["-i", str(final_audio_wav), "-b:a", "192k", str(final_audio_mp3)])

    final_mp4 = OUT_DIR / f"ep1_newborn_flow_{mode_name}.mp4"
    run_ffmpeg([
        "-i", str(joined_video_mp4),
        "-i", str(final_audio_wav),
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        str(final_mp4)
    ])
    print(f"=== Saved Giant-Text High-Impact Shorts: {final_mp4.name} ({total_audio_dur:.2f}s) ===", flush=True)
    return final_mp4, shot_starts


async def main():
    try:
        vfx_c3_mp4 = FLOW_CLIPS_DIR / "c3_open_bottle_clean.mp4"
        build_vfx_open_bottle_clip(SHOTS[2]["src_file"], vfx_c3_mp4)

        # Render #1 Recommended Version (Couple Duet)
        mp4_duet, shot_starts = await build_master_flow_video("couple_duet", vfx_c3_mp4)

        primary_mp4 = OUT_DIR / "ep1_newborn_essential5_shorts.mp4"
        shutil.copy2(mp4_duet, primary_mp4)

        for idx, st in enumerate(shot_starts, start=1):
            chk_jpg = FLOW_CLIPS_DIR / f"v4_check_cut{idx}.jpg"
            run_ffmpeg([
                "-ss", f"{st + 0.45:.2f}",
                "-i", str(primary_mp4),
                "-frames:v", "1",
                "-q:v", "2",
                str(chk_jpg)
            ])

        if WORK_DIR.exists():
            shutil.rmtree(WORK_DIR, ignore_errors=True)

        if DIST_OUT_DIR.exists():
            shutil.rmtree(DIST_OUT_DIR, ignore_errors=True)
        shutil.copytree(OUT_DIR, DIST_OUT_DIR, ignore=shutil.ignore_patterns("_frames_tmp", "_work_master"))
        print("Giant-Text High-Impact Couple Duet Shorts synced to samples/ and dist/samples/!", flush=True)
    except Exception as e:
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
