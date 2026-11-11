"""
5사업부 (kidsfit.co.kr · @kidsfit01) — Clean 3D CGI & 1:1 Chart Comparison Mastering Engine
--------------------------------------------------------------------------------
- 어설픈 가짜 AI 육아용품 실사 이미지(스와들업·핀덴베베·차일드라이프 등) 영구 금지!
- 80% 한국어판 3D 성장판·뇌과학 CGI 쇼츠 + 20% 깔끔한 1:1 도표 비교 카드 및 검증 실물 클립만 사용
- 한국형 레이아웃 & 자막 세이프존:
  1) 상단 훅 배너 (y=200~300)
  2) 중앙 자막 세이프존 (y=1020~1100, 84~92pt 굵은 한글 폰트 + 검정 테두리 + 노랑/민트 강조)
  3) 유튜브(@kidsfit01, 09:30 KST, categoryId=27, MadeForKids=False) + 네이버 클립(_NaverClip_Clean.mp4 -> cshop.naver.com/paradiseshop) 동시 출력!
"""
import os
import sys
import math
import wave
import shutil
import asyncio
import subprocess
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import edge_tts
import yt_dlp
import imageio_ffmpeg

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path("D:/드림컴퍼니/5사업부")
BASE_DIR = ROOT / "samples" / "shorts_10eps"
RAW_CLIPS_DIR = BASE_DIR / "raw_clips"
YT_CLEAN_DIR = BASE_DIR / "yt_clean_clips"
OUT_DIR = BASE_DIR / "mastered"
WORK_DIR = BASE_DIR / "_work_clean_yt"
DIST_OUT_DIR = ROOT / "dist" / "samples" / "shorts_10eps"
FONT_PATH = ROOT / "src" / "fonts" / "NanumSquareRoundEB.ttf"

YT_CLEAN_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)
WORK_DIR.mkdir(parents=True, exist_ok=True)
DIST_OUT_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30
SAMPLE_RATE = 48000
SAMPLES_PER_FRAME = SAMPLE_RATE // FPS

W_WHITE = (255, 255, 255, 255)
W_YELLOW = (255, 232, 0, 255)
W_MINT = (110, 255, 210, 255)

VOICE_SPECS = {
    "mom": {"voice": "ko-KR-SunHiNeural", "rate": "+8%", "pitch": "+2Hz"},
    "dad": {"voice": "ko-KR-InJoonNeural", "rate": "+7%", "pitch": "+1Hz"},
}

# Reuse already-verified 100% clean clips (ep06_a, ep07_a) and fetch clean no-subtitle hands-on clips
CLEAN_YT_SOURCES = {
    "ep06_gummy": {
        "existing": BASE_DIR / "yt_real_clips" / "ep06_a.mp4",
        "query": "ytsearch5:SmartyPants kids gummies review shorts",
        "ss": 1.5,
    },
    "ep07_mag_a": {
        "existing": BASE_DIR / "yt_real_clips" / "ep07_a.mp4",
        "query": "ytsearch5:magnetic tiles castle build shorts",
        "ss": 1.5,
    },
    "ep07_mag_b": {
        "existing": BASE_DIR / "yt_real_clips" / "ep07_a.mp4",
        "query": "ytsearch5:magnetic tiles castle build shorts",
        "ss": 5.5,
    },
    "ep08_bookstand": {
        "existing": None,
        "query": "ytsearch8:wooden book stand reading holder desk setup aesthetic shorts",
        "ss": 3.5,
    },
    "ep09_gravitrax": {
        "existing": None,
        "query": "ytsearch8:GraviTrax marble run action POV shorts",
        "ss": 3.5,
    },
    "ep10_picturebook": {
        "existing": None,
        "query": "ytsearch8:baby board book flip through hands on shorts",
        "ss": 4.0,
    },
}


def run_ffmpeg(args):
    cmd = [FFMPEG_EXE, "-y"] + args
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="ignore")
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {res.stderr[-600:]}")
    return res


def ensure_clean_yt_clip(key: str) -> Path:
    out_mp4 = YT_CLEAN_DIR / f"{key}.mp4"
    if out_mp4.exists() and out_mp4.stat().st_size > 150_000:
        return out_mp4

    spec = CLEAN_YT_SOURCES[key]
    if spec.get("existing") and Path(spec["existing"]).exists():
        src = Path(spec["existing"])
        ss = spec.get("ss", 1.5)
        run_ffmpeg([
            "-ss", f"{ss:.1f}", "-t", "6.0",
            "-i", str(src),
            "-vf", "scale=1180:2098:force_original_aspect_ratio=increase,crop=1080:1920,fps=30",
            "-c:v", "libx264", "-preset", "fast", "-crf", "19", "-an",
            str(out_mp4),
        ])
        if out_mp4.exists() and out_mp4.stat().st_size > 100_000:
            return out_mp4

    ydl_opts = {
        "format": "bestvideo[ext=mp4][height<=1920]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl": str(YT_CLEAN_DIR / f"{key}_raw.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "ignoreerrors": True,
        "max_filesize": 35 * 1024 * 1024,
        "ffmpeg_location": FFMPEG_EXE,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(spec["query"], download=False)
        except Exception:
            info = None
        for entry in (info or {}).get("entries") or []:
            if not entry:
                continue
            dur = entry.get("duration") or 0
            if 8 <= dur <= 120:
                url = entry.get("webpage_url") or entry.get("url")
                print(f"  [yt-clean] Downloading [{key}] ({dur}s): {entry.get('title', '')}", flush=True)
                try:
                    ydl.download([url])
                    raws = list(YT_CLEAN_DIR.glob(f"{key}_raw.*"))
                    if raws:
                        break
                except Exception:
                    continue

    raws = list(YT_CLEAN_DIR.glob(f"{key}_raw.*"))
    if raws:
        src = raws[0]
        ss = spec.get("ss", 3.5)
        run_ffmpeg([
            "-ss", f"{ss:.1f}", "-t", "8.0",
            "-i", str(src),
            "-vf", "scale=1220:2168:force_original_aspect_ratio=increase,crop=1080:1920,fps=30",
            "-c:v", "libx264", "-preset", "fast", "-crf", "19", "-an",
            str(out_mp4),
        ])
        try:
            src.unlink()
        except Exception:
            pass
    return out_mp4


def resolve_clip(clip_spec: str, fallback_hex: str) -> Path:
    if clip_spec.startswith("yt:"):
        k = clip_spec.split(":", 1)[1]
        p = ensure_clean_yt_clip(k)
        if p and p.exists() and p.stat().st_size > 100_000:
            return p
    matches = list(RAW_CLIPS_DIR.glob(f"*{fallback_hex}*.mp4"))
    return matches[0]


from master_10eps_google_flow_shorts import (
    EPISODES,
    generate_phrase_wav,
    render_overlay_png,
    make_cheerful_bgm,
)

# Map clean real YouTube product clips into Episodes 6-10 Cuts!
REAL_YT_CUT_OVERRIDES = {
    (6, 3): "yt:ep06_gummy",       # Real SmartyPants Kids Plus bottle in hand
    (7, 1): "yt:ep07_mag_a",       # Real hands building 3D magnetic tiles
    (7, 2): "yt:ep07_mag_b",       # Real 3D magnetic castle structure build
    (8, 3): "yt:ep08_bookstand",   # Real wooden reading bookstand setup
    (9, 3): "yt:ep09_gravitrax",   # Real GraviTrax marble run action
    (10, 1): "yt:ep10_picturebook" # Real hands flipping baby board picture book
}


async def master_clean_yt_episode(ep_spec: dict) -> Path:
    ep_num = ep_spec["ep"]
    slug = ep_spec["slug"]
    print(f"\n=======================================================", flush=True)
    print(f"🎬 Clean Real-YT + Subtitle-Only Mastering Ep {ep_num:02d}: {slug}", flush=True)
    print(f"=======================================================", flush=True)

    ep_work = WORK_DIR / f"ep{ep_num:02d}"
    ep_work.mkdir(parents=True, exist_ok=True)

    rendered_beat_mp4s = []
    phrase_wavs = []
    total_ep_frames = 0

    for cut_idx, cut in enumerate(ep_spec["cuts"], start=1):
        override = REAL_YT_CUT_OVERRIDES.get((ep_num, cut_idx), "")
        src_clip = resolve_clip(override, cut["clip"])
        is_yt = "yt_clean_clips" in str(src_clip)
        speaker = cut["speaker"]
        vlines = cut["voice_lines"]

        beat_frames = []
        beat_pngs = []
        for b_idx, vl in enumerate(vlines):
            wav_p = ep_work / f"c{cut_idx}_b{b_idx}.wav"
            nf = await generate_phrase_wav(vl["text"], speaker, wav_p, ep_work)
            beat_frames.append(nf)
            phrase_wavs.append(wav_p)

            is_final_beat = bool(cut_idx == len(ep_spec["cuts"]) and b_idx == len(vlines) - 1)
            hb = (ep_spec.get("hook_top"), ep_spec.get("hook_bot")) if (cut_idx == 1 and b_idx == 0) else None
            png_p = ep_work / f"c{cut_idx}_b{b_idx}.png"
            render_overlay_png(vl["lines"], is_final_beat, ep_num, png_p, hook_banner=hb, include_cta=False)
            beat_pngs.append(png_p)

        for b_idx, (nf, png_p) in enumerate(zip(beat_frames, beat_pngs)):
            dur_target = nf / FPS
            src_consume = min(3.4, dur_target * 1.25)
            if is_yt:
                ss = 0.2 + b_idx * 2.2
                vf_crop = "scale=1160:2062:force_original_aspect_ratio=increase,crop=1080:1920"
            else:
                if b_idx == 0:
                    ss = 0.25
                    vf_crop = "scale=1220:2168,crop=1080:1920:70:110"
                else:
                    ss = 2.85
                    vf_crop = "scale=1360:2418,crop=1080:1920:140:210"

            pts_factor = dur_target / max(src_consume, 0.1)
            beat_mp4 = ep_work / f"c{cut_idx}_b{b_idx}_v.mp4"

            filter_complex = (
                f"[0:v]trim=start={ss:.3f}:duration={src_consume:.3f},"
                f"setpts={pts_factor:.5f}*(PTS-STARTPTS),"
                f"{vf_crop},fps={FPS},"
                f"eq=contrast=1.04:saturation=1.08:brightness=0.01[bg];"
                f"[bg][1:v]overlay=0:0:format=auto,format=yuv420p[outv]"
            )

            run_ffmpeg([
                "-i", str(src_clip),
                "-loop", "1", "-t", f"{dur_target + 0.5:.3f}", "-i", str(png_p),
                "-filter_complex", filter_complex,
                "-map", "[outv]",
                "-frames:v", str(nf),
                "-c:v", "libx264", "-preset", "fast", "-crf", "18",
                "-r", str(FPS),
                "-an",
                str(beat_mp4),
            ])
            rendered_beat_mp4s.append(beat_mp4)
            total_ep_frames += nf

    concat_txt = ep_work / "concat_v.txt"
    concat_txt.write_text("\n".join(f"file '{p.as_posix()}'" for p in rendered_beat_mp4s), encoding="utf-8")
    merged_v = ep_work / "merged_v.mp4"
    run_ffmpeg([
        "-f", "concat", "-safe", "0",
        "-i", str(concat_txt),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p", "-r", str(FPS),
        str(merged_v),
    ])

    voice_track_wav = ep_work / "voice_full.wav"
    chunks = []
    for wp in phrase_wavs:
        with wave.open(str(wp), "rb") as w:
            chunks.append(np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16))
    full_voice_pcm = np.concatenate(chunks)
    with wave.open(str(voice_track_wav), "wb") as w_out:
        w_out.setnchannels(1)
        w_out.setsampwidth(2)
        w_out.setframerate(SAMPLE_RATE)
        w_out.writeframes(full_voice_pcm.tobytes())

    total_sec = total_ep_frames / FPS
    bgm_wav = ep_work / "bgm.wav"
    make_cheerful_bgm(total_sec, bgm_wav)

    final_mp4 = OUT_DIR / f"{slug}.mp4"
    run_ffmpeg([
        "-i", str(merged_v),
        "-i", str(voice_track_wav),
        "-i", str(bgm_wav),
        "-filter_complex",
        "[1:a]volume=1.35[va];[2:a]volume=0.72[ba];[va][ba]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.944[outa]",
        "-map", "0:v:0",
        "-map", "[outa]",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", str(SAMPLE_RATE),
        "-movflags", "+faststart",
        str(final_mp4),
    ])

    naver_clip_mp4 = OUT_DIR / f"{slug}_NaverClip_Clean.mp4"
    shutil.copy2(final_mp4, naver_clip_mp4)
    shutil.copy2(final_mp4, OUT_DIR / f"{slug}_IG_Reels.mp4")
    shutil.copy2(final_mp4, OUT_DIR / f"{slug}_YT_Shorts.mp4")
    shutil.copy2(final_mp4, DIST_OUT_DIR / final_mp4.name)
    print(f"  ✅ Completed Clean Ep {ep_num:02d}: {final_mp4.name} + {naver_clip_mp4.name} ({total_sec:.2f}s)", flush=True)
    return final_mp4


async def main():
    for ep_spec in EPISODES:
        if ep_spec["ep"] in (6, 7, 8, 9, 10):
            await master_clean_yt_episode(ep_spec)


if __name__ == "__main__":
    asyncio.run(main())
