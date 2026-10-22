#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/generate_naver_clip_webtoon_videos.py
Generates 9:16 vertical (1080x1920) Naver Clip videos bundling the 3 Webtoon Episodes
and 3 Cardnews Series, with Korean TTS narration, warm acoustic BGM, smooth zoom/pan
motion, and Naver Clip copy-ready captions/stickers.
"""

import math
import shutil
import struct
import subprocess
import urllib.parse
import urllib.request
import wave
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT_DIR = Path(__file__).resolve().parent.parent
WEBTOON_ROOT_KO = ROOT_DIR / "웹툰_모음"
CARDNEWS_ROOT_KO = ROOT_DIR / "카드뉴스_모음"

CLIP_OUT_KO = ROOT_DIR / "네이버클립_웹툰영상_모음"
CLIP_SAMPLE_DIR = ROOT_DIR / "samples" / "10_naver_clip_videos"


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


def generate_warm_music_wav(wav_path: Path, duration_sec: float, sample_rate: int = 44100):
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
            if t < 0.4:
                master *= t / 0.4
            elif duration_sec - t < 0.6:
                master *= max(0.0, (duration_sec - t) / 0.6)

            sample = int(max(-1.0, min(1.0, val * master)) * 32767)
            frames.extend(struct.pack("<h", sample))

        wf.writeframes(frames)


def synthesize_tts_wav(text: str, out_wav: Path, target_dur: float = 3.0):
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    mp3_path = out_wav.with_suffix(".mp3")
    q = urllib.parse.quote(text)
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q={q}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    mp3_bytes = urllib.request.urlopen(req, timeout=15).read()
    mp3_path.write_bytes(mp3_bytes)

    subprocess.run(
        [
            ffmpeg_exe, "-y", "-i", str(mp3_path),
            "-af", f"atempo=1.28,apad=whole_dur={target_dur},atrim=0:{target_dur}",
            "-ar", "44100", "-ac", "1",
            str(out_wav)
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    mp3_path.unlink(missing_ok=True)


EPISODES_CLIP_SPEC = [
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
                "tts": "단추도 내가! 물도 내가! 만 3세 아이의 고집, 반항인 줄 아셨나요?",
                "sub": "단추도 물컵도 혼자 하겠다는 만 3세,\n엄마를 힘들게 하려는 반항이 아닙니다!",
            },
            {
                "img": "02_2컷.png",
                "tts": "손가락은 제2의 뇌! 대뇌 운동피질의 30퍼센트가 손끝에 연결된 소근육 민감기 신호입니다.",
                "sub": "대뇌 운동피질 30%가 손끝에 직결된\n결정적 ‘손끝 소근육 민감기’ 신호!",
            },
            {
                "img": "03_3컷.png",
                "tts": "비싼 전집 대신 나무 집게와 색깔 공 옮기기 놀이로 손끝 악력을 키워주세요.",
                "sub": "비싼 교구 대신 주방 집게와 공 옮기기로\n엄지·검지 악어 손가락 힘을 키워요",
            },
            {
                "img": "04_4컷.png",
                "tts": "낮에 손끝을 쓴 아이가 밤 10시 깊은 잠으로 키도 쑥쑥 자랍니다.",
                "sub": "아이의 속도를 기다려 주는 다정한 엄마,\n키즈핏에서 1분 무료 진단을 받아보세요!",
            },
        ],
        "clip_title": "[육아웹툰 1화] 만 3세 '내가 혼자 할 거야!' 고집의 진짜 이유 (손끝 소근육 민감기)",
        "clip_tags": "#네이버클립 #육아웹툰 #인스타툰 #만3세발달 #소근육발달 #몬테소리 #가베 #육아소통 #워킹맘 #키즈핏",
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
                "tts": "단순 연산은 100점인데, 세 줄 넘는 문장제 수학만 나오면 별표부터 치는 아이!",
                "sub": "단순 연산은 100점인데 문장제만 나오면\n읽지도 않고 별표(★)부터 치는 이유?",
            },
            {
                "img": "02_2컷.png",
                "tts": "국어 문제가 아니라 머릿속 칠판인 전두엽 작업기억 용량이 꽉 찼기 때문입니다.",
                "sub": "국어 어휘력 부족이 아니라 머릿속 칠판\n‘전두엽 작업기억 과부하’ 때문입니다!",
            },
            {
                "img": "03_3컷.png",
                "tts": "암산을 멈추고 구하는 것에 동그라미, 여백에 상자 그림부터 그려보세요!",
                "sub": "암산 대신 여백에 ‘상자·막대 그림’을 그리면\n더할지 뺄지 한눈에 바로 보입니다!",
            },
            {
                "img": "04_4컷.png",
                "tts": "열 문제 푸는 것보다 한 문제를 내 말로 30초 설명하는 것이 진짜 수학 실력입니다.",
                "sub": "열 문제 풀이보다 ‘30초 말로 설명하기’!\n키즈핏에서 5대 학습역량(LQ)을 진단하세요",
            },
        ],
        "clip_title": "[교육웹툰 2화] 연산은 100점인데 문장제 수학만 별표 치는 진짜 이유 (작업기억 도해법)",
        "clip_tags": "#네이버클립 #교육웹툰 #초등수학 #문장제수학 #서술형수학 #작업기억 #메타인지 #백지복습 #초등맘 #키즈핏",
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
                "tts": "키 크라고 매일 밤 우유를 챙겨줬는데, 배만 꾸르륵거리고 왜 키는 그대로일까요?",
                "sub": "키 크라고 자기 직전 챙겨준 찬 우유,\n배앓이와 수면 방해의 원인이 됩니다!",
            },
            {
                "img": "02_2컷.png",
                "tts": "취침 직전 우유와 야식은 성장호르몬을 억제합니다! 밤 10시 공복 숙면에서 70퍼센트가 분비됩니다.",
                "sub": "취침 2시간 전 공복 유지 필수!\n밤 10시~2시 서파수면에서 성장호르몬 70% 폭발",
            },
            {
                "img": "03_3컷.png",
                "tts": "잠들기 전 5분, 무릎과 종아리 성장판 이완 스트레칭으로 숨은 키를 깨워주세요.",
                "sub": "밤 9시 40분 무릎·종아리 5분 스트레칭으로\n낮 동안 눌린 성장판과 디스크를 펴주세요",
            },
            {
                "img": "04_4컷.png",
                "tts": "부모 유전키를 넘어 숨은 키 7센티미터 도약! 키즈핏에서 1분 무료 진단을 확인하세요.",
                "sub": "질병관리청 성장도표 기준 우리 아이 키 백분위 &\n3단 예상키 무료 진단 👉 truthofmarket.com",
            },
        ],
        "clip_title": "[성장웹툰 3화] 밤마다 우유 먹였는데 키가 안 큰다고요? (밤 10시 성장호르몬 & 스트레칭)",
        "clip_tags": "#네이버클립 #성장웹툰 #아이키성장 #어린이키성장 #키크는습관 #밤10시수면 #성장판스트레칭 #어린이칼슘 #키즈핏",
    },
]


def render_clip_video_from_cuts(
    cuts_spec: list,
    out_mp4: Path,
    cut_dur: float = 3.0,
    fps: int = 24,
):
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    work_dir = out_mp4.parent
    work_dir.mkdir(parents=True, exist_ok=True)

    wav_files = []
    for idx, c in enumerate(cuts_spec):
        w_path = work_dir / f"_tmp_tts_{idx:02d}.wav"
        synthesize_tts_wav(c["tts"], w_path, target_dur=cut_dur)
        wav_files.append(w_path)

    concat_voice_wav = work_dir / "_tmp_voice_concat.wav"
    with wave.open(str(concat_voice_wav), "w") as out_wf:
        out_wf.setnchannels(1)
        out_wf.setsampwidth(2)
        out_wf.setframerate(44100)
        for wf_path in wav_files:
            with wave.open(str(wf_path), "r") as in_wf:
                out_wf.writeframes(in_wf.readframes(in_wf.getnframes()))

    total_dur = cut_dur * len(cuts_spec)
    bgm_wav = work_dir / "_tmp_bgm.wav"
    generate_warm_music_wav(bgm_wav, total_dur + 0.3, 44100)

    mixed_audio_aac = work_dir / "_tmp_mixed.m4a"
    subprocess.run(
        [
            ffmpeg_exe, "-y",
            "-i", str(concat_voice_wav),
            "-i", str(bgm_wav),
            "-filter_complex", "[0:a]volume=1.20[v];[1:a]volume=0.32[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2[aout]",
            "-map", "[aout]",
            "-c:a", "aac", "-b:a", "192k",
            str(mixed_audio_aac)
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

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
        "-i", str(mixed_audio_aac),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "17",
        "-c:a", "copy",
        "-shortest",
        "-movflags", "+faststart",
        str(out_mp4)
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    n_frames_per_cut = int(round(cut_dur * fps))
    total_frames = n_frames_per_cut * len(cuts_spec)
    global_f = 0

    for c in cuts_spec:
        src_img = Image.open(c["img_path"]).convert("RGB").resize((1080, 1080), Image.Resampling.LANCZOS)
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

            # Step indicator at top-right
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

            # Center Webtoon Cut with gentle Ken-Burns zoom (1000x1000 card at y=340)
            card_w, card_h = 1000, 1000
            card_x, card_y = 40, 340
            zoom = 1.0 + 0.035 * math.sin(prog * math.pi)
            zw, zh = int(card_w * zoom), int(card_h * zoom)
            resized = src_img.resize((zw, zh), Image.Resampling.BILINEAR)
            cx = (zw - card_w) // 2
            cy = (zh - card_h) // 2
            cropped = resized.crop((cx, cy, cx + card_w, cy + card_h))
            frame.paste(cropped, (card_x, card_y))
            draw.rounded_rectangle((card_x, card_y, card_x + card_w, card_y + card_h), radius=28, outline=acc, width=4)

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
            cta_txt = "📌 우리 아이 키 백분위 & 두뇌 역량 1분 무료 진단 👉 truthofmarket.com"
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

    concat_voice_wav.unlink(missing_ok=True)
    bgm_wav.unlink(missing_ok=True)
    mixed_audio_aac.unlink(missing_ok=True)
    for wf in wav_files:
        wf.unlink(missing_ok=True)


def main():
    CLIP_OUT_KO.mkdir(parents=True, exist_ok=True)
    CLIP_SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

    all_bundled_cuts = []
    guide_lines = [
        "======================================================================",
        "🎬 [키즈핏 네이버 클립(Naver Clip) & 인스타 릴스 웹툰 영상 패키지 가이드]",
        "======================================================================",
        "",
        "1. 수록된 영상 파일 목록:",
        "  • 00_네이버클립_웹툰_1~3화_통합묶음_합본영상.mp4 (1~3화 전체 12컷 연속 묶음 영상, 약 34초)",
        "  • 01_네이버클립_웹툰1화_만3세소근육민감기.mp4 (1화 4컷 영상, 약 12초)",
        "  • 02_네이버클립_웹툰2화_초등문장제수학작업기억.mp4 (2화 4컷 영상, 약 12초)",
        "  • 03_네이버클립_웹툰3화_밤10시숙면숨은키7cm.mp4 (3화 4컷 영상, 약 12초)",
        "  • 04_네이버클립_카드뉴스_핵심요약_영상.mp4 (카드뉴스 6컷 영상, 약 15초)",
        "",
        "2. 네이버 클립 업로드 시 【정보 스티커(링크 스티커)】 연결 주소:",
        "  • 공식 진단 홈페이지: https://truthofmarket.com",
        "  • 공식 네이버 블로그: https://blog.naver.com/expertise333",
        "  • 공식 네이버 카페: https://cafe.naver.com/moneyfitlab",
        "",
    ]

    for ep in EPISODES_CLIP_SPEC:
        ep_cuts = []
        total_c = len(ep["cuts"])
        for idx, c in enumerate(ep["cuts"], start=1):
            cut_entry = {
                "img_path": ep["folder"] / c["img"],
                "tts": c["tts"],
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
        print(f"🎬 생성 중: {out_mp4.name} ...")
        render_clip_video_from_cuts(ep_cuts, out_mp4, cut_dur=3.0, fps=24)
        shutil.copy2(out_mp4, CLIP_SAMPLE_DIR / ep["filename"])
        print(f"✅ 완료: {out_mp4.name} ({out_mp4.stat().st_size:,} bytes)")

        guide_lines.extend([
            "----------------------------------------------------------------------",
            f"📌 [{ep['filename']}] 업로드용 제목 & 해시태그",
            f"• 제목: {ep['clip_title']}",
            f"• 설명/태그: 우리 아이 1분 무료 성장·두뇌 진단 👉 https://truthofmarket.com  {ep['clip_tags']}",
            "",
        ])

    # Build the 1~3화 Combined Bundled Naver Clip Video!
    bundled_mp4 = CLIP_OUT_KO / "00_네이버클립_웹툰_1~3화_통합묶음_합본영상.mp4"
    print(f"🎬 생성 중 (1~3화 전체 묶음 합본): {bundled_mp4.name} ...")
    render_clip_video_from_cuts(all_bundled_cuts, bundled_mp4, cut_dur=2.8, fps=24)
    shutil.copy2(bundled_mp4, CLIP_SAMPLE_DIR / bundled_mp4.name)
    print(f"✅ 완료: {bundled_mp4.name} ({bundled_mp4.stat().st_size:,} bytes)")

    # Also copy the Cardnews video into the Naver Clip folder for convenience
    cn_vid_src = ROOT_DIR / "samples" / "5_cardnews_video_sample" / "cardnews_parenting_video.mp4"
    if cn_vid_src.exists():
        cn_dst_name = "04_네이버클립_카드뉴스_핵심요약_영상.mp4"
        shutil.copy2(cn_vid_src, CLIP_OUT_KO / cn_dst_name)
        shutil.copy2(cn_vid_src, CLIP_SAMPLE_DIR / cn_dst_name)

    guide_txt_path = CLIP_OUT_KO / "05_네이버클립_업로드_제목_태그_정보스티커_가이드.txt"
    guide_txt_path.write_text("\n".join(guide_lines) + "\n", encoding="utf-8")
    shutil.copy2(guide_txt_path, CLIP_SAMPLE_DIR / guide_txt_path.name)

    # Create ZIP archive of all Naver Clip videos
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
