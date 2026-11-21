import os
import sys
import subprocess
from pathlib import Path
import yt_dlp
import imageio_ffmpeg

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path("D:/드림컴퍼니/5사업부")
YT_DIR = ROOT / "samples" / "shorts_10eps" / "yt_real_clips"
YT_DIR.mkdir(parents=True, exist_ok=True)
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

SEARCH_QUERIES = {
    "ep06_a": "ytsearch5:SmartyPants kids gummies review shorts",
    "ep06_b": "ytsearch5:어린이 유산균 스틱 키즈 유산균 shorts",
    "ep07_a": "ytsearch5:magnetic tiles castle build shorts",
    "ep07_b": "ytsearch5:자석블록 놀이 마그네틱 타일 shorts",
    "ep08_a": "ytsearch5:초등학생 책상 의자 독서대 추천 shorts",
    "ep08_b": "ytsearch5:kids ergonomic study chair desk shorts",
    "ep09_a": "ytsearch5:GraviTrax Pro marble run shorts",
    "ep09_b": "ytsearch5:그래비트랙스 트랙 shorts",
    "ep10_a": "ytsearch5:밀크티아이 무료체험 유아 학습기 shorts",
    "ep10_b": "ytsearch5:아이스크림 홈런 초등 패드 shorts",
}

def download_best_short(tag: str, query: str) -> Path:
    out_mp4 = YT_DIR / f"{tag}.mp4"
    if out_mp4.exists() and out_mp4.stat().st_size > 200_000:
        print(f"[SKIP] {out_mp4.name} already exists ({out_mp4.stat().st_size // 1024} KB)")
        return out_mp4

    ydl_opts = {
        "format": "bestvideo[ext=mp4][height<=1920]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl": str(YT_DIR / f"{tag}_raw.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "ignoreerrors": True,
        "max_filesize": 35 * 1024 * 1024,
        "ffmpeg_location": FFMPEG_EXE,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(query, download=False)
        except Exception as e:
            print(f"  search warn: {e}", flush=True)
            info = None
        entries = (info or {}).get("entries") or []
        for entry in entries:
            if not entry:
                continue
            dur = entry.get("duration") or 0
            # Prefer short vertical or punchy clips between 5s and 180s
            if 5 <= dur <= 180:
                url = entry.get("webpage_url") or entry.get("url")
                title = entry.get("title", "")
                print(f"Downloading [{tag}] ({dur}s): {title} -> {url}", flush=True)
                try:
                    ret = ydl.download([url])
                    raw_check = list(YT_DIR.glob(f"{tag}_raw.*"))
                    if raw_check:
                        break
                except Exception as e:
                    print(f"  warn: {e}", flush=True)
                    continue

    # Normalize to clean 30fps h264 mp4 via ffmpeg
    raw_candidates = list(YT_DIR.glob(f"{tag}_raw.*"))
    if raw_candidates:
        src = raw_candidates[0]
        cmd = [
            FFMPEG_EXE, "-y",
            "-ss", "1.0", "-t", "12.0",
            "-i", str(src),
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30",
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-an",
            str(out_mp4)
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            src.unlink()
        except Exception:
            pass
        if out_mp4.exists() and out_mp4.stat().st_size > 100_000:
            print(f"  -> Normalized {out_mp4.name} ({out_mp4.stat().st_size // 1024} KB)", flush=True)
            return out_mp4
    return None

if __name__ == "__main__":
    for tag, q in SEARCH_QUERIES.items():
        download_best_short(tag, q)
