#!/usr/bin/env python3
"""
flow_shorts_studio/render_dual_yt_ig_cta.py
Generates two platform-specific videos from a single master MP4 (zero extra Flow generation load):
  1) <base>_YT_Shorts.mp4 : YouTube Shorts edition (Profile Tap + Pinned Comment CTA)
  2) <base>_IG_Reels.mp4  : Instagram Reels edition (ManyChat Comment Keyword -> Auto-DM CTA)

Harmonious Layout Rule:
  - Voice kinetic subtitles occupy the Golden Safezone y = 1060..1180 (55.2%..61.5% of 1080x1920).
  - In the final 2.8s ending slate ONLY, the CTA pill appears cleanly at y = 1480..1618
    using clean stroked text and matching Mint/Yellow accents so it never covers
    voice subtitles or YouTube Shorts bottom 3-line UI.
"""

import os
import re
import subprocess
import sys
import tempfile
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

FONT_CANDIDATES_EN = [
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\malgunbd.ttf",
]


def load_font(size):
    for fp in FONT_CANDIDATES_EN:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                pass
    return ImageFont.load_default()


def get_video_info(video_path):
    res = subprocess.run(
        [FFMPEG_EXE, "-i", video_path],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    info = res.stderr
    dur = 8.0
    m_dur = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", info)
    if m_dur:
        dur = int(m_dur.group(1)) * 3600 + int(m_dur.group(2)) * 60 + float(m_dur.group(3))
    w, h = 1080, 1920
    m_dim = re.search(r"Stream #.*Video:.*?\s(\d{3,4})x(\d{3,4})", info)
    if m_dim:
        w, h = int(m_dim.group(1)), int(m_dim.group(2))
    return w, h, dur


def create_cta_overlay_png(width, height, badge_title, badge_sub, border_rgb, title_rgb):
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    box_w = int(width * 0.88)
    box_h = int(height * 0.072)
    x0 = (width - box_w) // 2
    y0 = int(height * 0.77)
    x1 = x0 + box_w
    y1 = y0 + box_h

    draw.rounded_rectangle(
        [x0, y0, x1, y1],
        radius=int(box_h * 0.28),
        fill=(10, 16, 28, 255),
        outline=border_rgb + (255,),
        width=4,
    )

    f_title = load_font(max(20, int(width * 0.036)))
    f_sub = load_font(max(16, int(width * 0.030)))

    tb1 = draw.textbbox((0, 0), badge_title, font=f_title)
    tw1 = tb1[2] - tb1[0]

    tb2 = draw.textbbox((0, 0), badge_sub, font=f_sub)
    tw2 = tb2[2] - tb2[0]

    ty1 = y0 + int(box_h * 0.14)
    ty2 = y0 + int(box_h * 0.56)

    draw.text(
        ((width - tw1) // 2, ty1),
        badge_title,
        font=f_title,
        fill=title_rgb + (255,),
        stroke_width=4,
        stroke_fill=(0, 0, 0, 230),
    )
    draw.text(
        ((width - tw2) // 2, ty2),
        badge_sub,
        font=f_sub,
        fill=(255, 255, 255, 255),
        stroke_width=3,
        stroke_fill=(0, 0, 0, 230),
    )

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    img.save(tmp.name, "PNG")
    tmp.close()
    return tmp.name


def render_overlay_video(src_video, dst_video, png_path, start_sec):
    filter_complex = f"[0:v][1:v]overlay=0:0:enable='gte(t,{start_sec:.2f})'[v]"
    cmd = [
        FFMPEG_EXE,
        "-y",
        "-i",
        src_video,
        "-i",
        png_path,
        "-filter_complex",
        filter_complex,
        "-map",
        "[v]",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-maxrate",
        "5M",
        "-bufsize",
        "10M",
        "-c:a",
        "copy",
        "-movflags",
        "+faststart",
        dst_video,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg error: {res.stderr[-500:]}")


def ensure_dual_videos(src_video, division="KFG", force=False):
    if not os.path.exists(src_video):
        raise FileNotFoundError(src_video)

    base, ext = os.path.splitext(src_video)
    yt_out = f"{base}_YT_Shorts{ext}"
    ig_out = f"{base}_IG_Reels{ext}"

    if not force and os.path.exists(yt_out) and os.path.exists(ig_out):
        return yt_out, ig_out

    w, h, dur = get_video_info(src_video)
    start_sec = max(0.5, dur - 2.8)

    if str(division).upper() == "KFK":
        yt_title = "📏 우리 아이 최종 예상키 & 성조숙증 신호등 1분 무료 진단"
        yt_sub = "👉 @kidsfit01 프로필 상단 [kidsfit.co.kr] 클릭!"
        ig_title = "💬 인스타그램 릴스: 댓글에 [키성장] 남겨주세요!"
        ig_sub = "1초 만에 무료 성장·발달 진단 링크를 DM으로 보내드려요!"
    else:
        yt_title = "📏 Predict Your Child's Adult Height in 60s"
        yt_sub = "👉 Tap kisfitglobal.com in @kisfitglobal bio!"
        ig_title = '▶ INSTAGRAM REELS: COMMENT "GROWTH" BELOW'
        ig_sub = "We'll DM You the Free 60s Adult Height Scan Link Instantly!"
    png_yt = create_cta_overlay_png(w, h, yt_title, yt_sub, (110, 255, 210), (255, 232, 0))
    png_ig = create_cta_overlay_png(w, h, ig_title, ig_sub, (255, 232, 0), (110, 255, 210))

    try:
        render_overlay_video(src_video, yt_out, png_yt, start_sec)
        render_overlay_video(src_video, ig_out, png_ig, start_sec)
    finally:
        for p in (png_yt, png_ig):
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass

    return yt_out, ig_out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python render_dual_yt_ig_cta.py <src_video> [KFG] [--force]")
        sys.exit(1)
    src = sys.argv[1]
    div = sys.argv[2] if len(sys.argv) >= 3 and not sys.argv[2].startswith("-") else "KFG"
    force = "--force" in sys.argv
    yt_path, ig_path = ensure_dual_videos(src, div, force=force)
    print(f"YT_SHORTS={yt_path}")
    print(f"IG_REELS={ig_path}")
