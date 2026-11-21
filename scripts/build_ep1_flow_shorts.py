import os
import sys
import shutil
import math
import struct
import wave
import asyncio
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import edge_tts
import imageio_ffmpeg

ROOT = Path("D:/드림컴퍼니/5사업부")
OUT_DIR = ROOT / "samples" / "shorts_ep1_newborn"
DIST_OUT_DIR = ROOT / "dist" / "samples" / "shorts_ep1_newborn"
AUDIO_DIR = OUT_DIR / "audio"
FLOW_CLIPS_DIR = OUT_DIR / "flow_clips"
FRAMES_DIR = OUT_DIR / "_frames_tmp"

OUT_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
FLOW_CLIPS_DIR.mkdir(parents=True, exist_ok=True)
FRAMES_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# ---------------------------------------------------------------------------
# Episode 1 Script & Scene Definition (5 Newborn Essentials from KidsFit Mall)
# Snappy 42~46s YouTube Shorts Creator Tempo (PangPangCouple Benchmark)
# ---------------------------------------------------------------------------
SCENES = [
    {
        "id": "scene1_hook",
        "clip_file": "scene1.mp4",
        "step_badge": "출산준비 필수체크",
        "title": "조리원 퇴소 전 무조건 있어야 할\n신생아 생존 필수템 5가지",
        "product_id": "prod_nb_gear_1",
        "product_img": "src/images/products/prod_nb_gear_1.webp",
        "product_name": "신생아 육아 필수 장비 BEST 5",
        "product_badge": "선배맘 98% 재구매 리스트",
        "product_price": "프로필 [키즈핏 스토어] 한눈에 보기",
        "product_point": "조리원 나오기 전 안 사두면 새벽마다 후회하는 찐 필수템",
        "speaker_duet": "mom",
        "rate_duet": "+26%",
        "pitch_duet": "+2Hz",
        "lines": [
            "아기 태어나기 전에 다른 건 다 천천히 사도 되는데요,",
            "이 다섯 가지는 조리원 나오기 전에 무조건 집에 있어야 합니다!",
            "특히 세 번째는 없으면 새벽마다 진짜 후회해요."
        ],
        "subtitles": [
            "출산 전 다른 건 다 천천히 사도 되는데",
            "이 5가지는 조리원 퇴소 전 무조건 있어야 해요!",
            "특히 3번째는 없으면 새벽마다 진짜 후회합니다"
        ],
        "bg_colors": [(255, 248, 240), (254, 242, 232)],
        "flow_prompt_en": "Vertical 9:16 handheld iPhone 15 Pro home vlog shot. Warm sunlit Korean apartment living room with ivory baby play mat and sheer white curtains. A young mother's hands gently arranging neatly folded newborn baby clothes and baby essentials on a wooden table, warm natural morning light, shallow depth of field, photorealistic, authentic home video aesthetic, no stiff AI face."
    },
    {
        "id": "scene2_item1",
        "clip_file": "scene2.mp4",
        "step_badge": "필수템 01 · 면역/배앓이",
        "title": "1위. 베이비 비타민D3 드롭스 & 유산균",
        "product_id": "prod_nb_nut_1",
        "product_img": "src/images/products/prod_nb_nut_1.webp",
        "product_name": "닥터에디션 베이비 비타민D3 400IU & 유산균",
        "product_badge": "글로벌 안심인증 베스트 ★4.9 (14,200+)",
        "product_price": "공식 혜택가 26,400원",
        "product_point": "하루 딱 1방울! 모유수유 필수 비타민D + 신생아 배앓이 진정",
        "speaker_duet": "dad",
        "rate_duet": "+25%",
        "pitch_duet": "+0Hz",
        "lines": [
            "첫 번째, 액상 비타민D 드롭스랑 배앓이 유산균!",
            "모유엔 비타민D가 부족해서 소아과도 생후 당장 먹이라고 하거든요.",
            "기울이면 딱 한 방울만 톡 떨어져서 쪽쪽이에 묻혀주기 진짜 편해요."
        ],
        "subtitles": [
            "1위! 액상 비타민D 드롭스 & 배앓이 유산균",
            "모유엔 비타민D가 부족해 생후 즉시 보충 필수!",
            "딱 한 방울만 톡 떨어져서 쪽쪽이에 주면 끝이에요"
        ],
        "bg_colors": [(240, 253, 244), (220, 252, 231)],
        "flow_prompt_en": "Vertical 9:16 close-up POV shot on iPhone 15 Pro. Warm cozy Korean nursery room. A parent's hand holding a small amber glass baby vitamin D dropper bottle, a single clear drop forming at the tip over a clean baby pacifier, soft natural window lighting, ultra-realistic macro details, authentic parenting vlog style."
    },
    {
        "id": "scene3_item2",
        "clip_file": "scene3.mp4",
        "step_badge": "필수템 02 · 새벽 통잠",
        "title": "2위. 모로반사 방지 오가닉 스와들업",
        "product_id": "prod_nb_gear_1",
        "product_img": "src/images/products/prod_nb_gear_1.webp",
        "product_name": "모로반사 숙면 방지 오가닉 순면 스와들업 속싸개",
        "product_badge": "꿀잠 수면 1위 ★4.8 (16,540+)",
        "product_price": "공식 혜택가 28,500원",
        "product_point": "나비잠 자세 고정으로 깜짝 놀람(모로반사) 방지 & 새벽 통잠 유도",
        "speaker_duet": "mom",
        "rate_duet": "+26%",
        "pitch_duet": "+2Hz",
        "lines": [
            "두 번째, 오가닉 스와들업 속싸개!",
            "신생아는 자다가 자기 손에 깜짝 놀라 깨는 모로반사가 심한데요,",
            "지퍼만 쓱 올려주면 나비잠 자세로 새벽에 안 깨고 꿀잠 잡니다."
        ],
        "subtitles": [
            "2위! 모로반사 잡아주는 오가닉 스와들업 속싸개",
            "자다가 자기 손에 놀라 깨는 모로반사 완벽 방지!",
            "지퍼만 쓱 올려주면 나비잠 자세로 새벽 통잠 자요"
        ],
        "bg_colors": [(239, 246, 255), (219, 234, 254)],
        "flow_prompt_en": "Vertical 9:16 overhead soft shot on iPhone 15 Pro. Dimly lit warm nursery at night with a soft amber nightlight. A newborn baby sleeping peacefully in a cream organic cotton butterfly swaddle suit inside a wooden crib, chest gently rising and falling, parent's hand softly zipping up the swaddle, cozy realistic home video."
    },
    {
        "id": "scene4_item3",
        "clip_file": "scene4.mp4",
        "step_badge": "필수템 03 · 새벽수유 구원템",
        "title": "3위. 원터치 분유포트 & 정밀 온습도계",
        "product_id": "prod_nb_gear_2",
        "product_img": "src/images/products/prod_nb_gear_2.webp",
        "product_name": "무소음 자동 출수 분유포트 & 아기방 온습도계",
        "product_badge": "새벽수유 생존템 ★4.9 (11,300+)",
        "product_price": "공식 혜택가 68,900원",
        "product_point": "새벽 3시 물 식힐 필요 없이 43℃ 정량 1초 출수 & 태열 예방 온습도 체크",
        "speaker_duet": "dad",
        "rate_duet": "+25%",
        "pitch_duet": "+0Hz",
        "lines": [
            "세 번째, 원터치 자동 출수 분유포트랑 온습도계!",
            "새벽 세 시에 아기는 자지러지게 우는데 뜨거운 물 식히려면 진짜 멘붕 오거든요.",
            "사십삼 도 딱 맞춰 일 초 만에 나오는 걸로 부부 수면 시간 지키세요."
        ],
        "subtitles": [
            "3위! 1초 자동 출수 분유포트 & 온습도계",
            "새벽 3시에 아기는 우는데 물 식히려면 진짜 멘붕 와요",
            "43도 딱 맞춰 1초 출수되는 걸로 수면 시간 지키세요!"
        ],
        "bg_colors": [(245, 243, 255), (237, 233, 254)],
        "flow_prompt_en": "Vertical 9:16 iPhone 15 Pro close-up shot in a modern Korean kitchen at night under warm under-cabinet lighting. A sleek white digital baby formula water dispenser pouring warm water into a baby feeding bottle with one touch, digital temperature display glowing 43C, realistic steam and water droplets, authentic home vlog."
    },
    {
        "id": "scene5_item4",
        "clip_file": "scene5.mp4",
        "step_badge": "필수템 04 · 시신경/두뇌자극",
        "title": "4위. 신생아 흑백/컬러 초점책 & 헝겊인형",
        "product_id": "prod_nb_dev_1",
        "product_img": "src/images/products/prod_nb_dev_1.webp",
        "product_name": "신생아 흑백/컬러 초점책 & 오감발달 헝겊 촉각 인형",
        "product_badge": "에디터 셀렉트 1위 ★4.9 (8,930+)",
        "product_price": "공식 혜택가 19,800원",
        "product_point": "생후 0~3개월 시신경·두뇌 망막 자극 병풍책 & 구강기 안심 촉각 인형",
        "speaker_duet": "mom",
        "rate_duet": "+26%",
        "pitch_duet": "+2Hz",
        "lines": [
            "네 번째, 신생아 흑백 초점 병풍책과 촉각 인형!",
            "생후 백일까지는 시신경이랑 두뇌가 폭발적으로 크는 시기라,",
            "터미타임 할 때 세워두면 혼자서도 초점 맞추느라 엄청 집중합니다."
        ],
        "subtitles": [
            "4위! 신생아 흑백/컬러 초점 병풍책 & 촉각 인형",
            "생후 100일까지 시신경·두뇌 발달 골든타임 필수 교구!",
            "터미타임 때 세워두면 혼자서도 초점 맞추며 초집중해요"
        ],
        "bg_colors": [(254, 249, 195), (254, 240, 138)],
        "flow_prompt_en": "Vertical 9:16 low-angle iPhone 15 Pro shot on a soft cream Korean living room mat. A black-and-white high-contrast accordion baby visual stimulation book standing upright in front of a baby doing tummy time (seen from behind/over-the-shoulder of the baby's cute back of head and tiny hands), bright natural daylight, realistic textures."
    },
    {
        "id": "scene6_item5_cta",
        "clip_file": "scene6.mp4",
        "step_badge": "필수템 05 · 무료혜택 & 스토어",
        "title": "5위. 출산축하 무료 기프트박스 & 키즈핏 스토어",
        "product_id": "prod_nb_learn_1",
        "product_img": "src/images/products/prod_nb_learn_1.webp",
        "product_name": "베베클럽 임산부·출산 축하 10종 본품 무료 기프트박스",
        "product_badge": "100% 무료증정 이벤트 ★4.9 (21,400+)",
        "product_price": "공식 혜택가 0원 (무료신청)",
        "product_point": "프로필 링크 [키즈핏 스토어]에서 5가지 혜택가 확인 시 1:1 발달진단 무료 오픈!",
        "speaker_duet": "dad",
        "rate_duet": "+25%",
        "pitch_duet": "+1Hz",
        "lines": [
            "다섯 번째, 임산부 출산 축하 무료 기프트박스까지!",
            "오늘 소개한 필수템 다섯 가지 공식 판매처와 선배맘 비교표는 프로필 링크 키즈핏 스토어에 모아뒀어요.",
            "구경만 하셔도 우리 아기 일대일 발달 진단권이 무료로 열리니까 꼭 챙겨가세요!"
        ],
        "subtitles": [
            "5위! 임산부·출산 축하 10종 무료 기프트박스까지",
            "오늘 소개한 5가지 공식 판매처 & 선배맘 비교표는",
            "프로필 링크 [키즈핏 스토어]에서 확인하세요! (+무료 발달진단)"
        ],
        "bg_colors": [(236, 253, 245), (209, 250, 229)],
        "flow_prompt_en": "Vertical 9:16 iPhone 15 Pro POV shot. A clean white gift box filled with baby skincare samples, wet wipes, and a developmental guide ribbon being opened by gentle hands on a sunlit wooden table, warm joyful morning atmosphere, photorealistic Korean home vlog."
    }
]

VOICE_MAP = {
    "mom": "ko-KR-SunHiNeural",
    "dad": "ko-KR-HyunsuMultilingualNeural"
}


def run_ffmpeg(args):
    cmd = [FFMPEG_EXE, "-y"] + args
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="ignore")
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {res.stderr[-600:]}")
    return res


async def synthesize_line(text, voice, rate, pitch, raw_mp3_path, trimmed_wav_path):
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(str(raw_mp3_path))
    # Tight YouTube Shorts creator jump-cut: remove all internal & trailing dead air > 0.06s
    af_filter = (
        "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-42dB:"
        "stop_periods=-1:stop_duration=0.06:stop_threshold=-42dB,"
        "equalizer=f=220:t=q:w=1.2:g=2.0,"
        "equalizer=f=3600:t=q:w=1.4:g=1.5,"
        "apad=pad_dur=0.04"
    )
    run_ffmpeg([
        "-i", str(raw_mp3_path),
        "-af", af_filter,
        "-ar", "44100",
        "-ac", "2",
        str(trimmed_wav_path)
    ])


def get_wav_duration(wav_path):
    with wave.open(str(wav_path), "rb") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        return frames / float(rate)


def concat_wavs(wav_paths, out_wav_path):
    if not wav_paths:
        return
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


def generate_soft_bgm_and_sfx(total_duration, scene_starts, out_bgm_wav):
    sample_rate = 44100
    n_samples = int((total_duration + 0.5) * sample_rate)
    chords = [
        [261.63, 329.63, 392.00, 493.88],
        [220.00, 261.63, 329.63, 392.00],
        [174.61, 220.00, 261.63, 329.63],
        [196.00, 246.94, 293.66, 392.00],
    ]
    buf = bytearray(n_samples * 4)
    beat_sec = 0.42
    for i in range(n_samples):
        t = i / sample_rate
        chord_idx = int(t / 1.68) % len(chords)
        chord = chords[chord_idx]
        beat_pos = (t % beat_sec) / beat_sec
        env = math.exp(-beat_pos * 4.8) * 0.032
        note = chord[int(t / beat_sec) % len(chord)]
        val = math.sin(2 * math.pi * note * t) * env
        val += 0.5 * math.sin(2 * math.pi * (note * 0.5) * t) * (env * 0.6)

        for st in scene_starts:
            dt = t - st
            if 0.0 <= dt < 0.18:
                pop_env = math.exp(-dt * 24.0) * 0.13
                pop_freq = 660.0 if dt < 0.08 else 880.0
                val += math.sin(2 * math.pi * pop_freq * dt) * pop_env

        sample_int = max(-32767, min(32767, int(val * 32767)))
        struct.pack_into("<hh", buf, i * 4, sample_int, sample_int)

    with wave.open(str(out_bgm_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(buf)


async def build_all_voiceovers():
    print("[1/4] Generating Method B Human-Paced Voiceovers (Couple Duet, Mom Solo, Dad Solo)...")
    modes = {
        "couple_duet": lambda sc: VOICE_MAP[sc["speaker_duet"]],
        "mom_solo": lambda sc: VOICE_MAP["mom"],
        "dad_solo": lambda sc: VOICE_MAP["dad"],
    }
    timings_by_mode = {}

    for mode_name, voice_selector in modes.items():
        all_line_wavs = []
        scene_timings = []
        cur_time = 0.0

        for s_idx, sc in enumerate(SCENES):
            voice = voice_selector(sc)
            rate = sc["rate_duet"] if mode_name == "couple_duet" else "+25%"
            pitch = sc["pitch_duet"] if mode_name == "couple_duet" else "+1Hz"
            line_durations = []

            for l_idx, line_text in enumerate(sc["lines"]):
                raw_mp3 = AUDIO_DIR / f"_{mode_name}_s{s_idx}_l{l_idx}.mp3"
                trim_wav = AUDIO_DIR / f"_{mode_name}_s{s_idx}_l{l_idx}.wav"
                await synthesize_line(line_text, voice, rate, pitch, raw_mp3, trim_wav)
                dur = get_wav_duration(trim_wav)
                line_durations.append(dur)
                all_line_wavs.append(trim_wav)
                if raw_mp3.exists():
                    raw_mp3.unlink()

            scene_dur = sum(line_durations)
            scene_timings.append({
                "scene_id": sc["id"],
                "start": cur_time,
                "duration": scene_dur,
                "line_durations": line_durations
            })
            cur_time += scene_dur

        voice_wav = AUDIO_DIR / f"ep1_voice_{mode_name}_raw.wav"
        concat_wavs(all_line_wavs, voice_wav)

        for w in all_line_wavs:
            if w.exists():
                w.unlink()

        bgm_wav = AUDIO_DIR / f"_bgm_{mode_name}.wav"
        scene_starts = [st["start"] for st in scene_timings]
        generate_soft_bgm_and_sfx(cur_time, scene_starts, bgm_wav)

        final_mp3 = AUDIO_DIR / f"ep1_voice_{mode_name}.mp3"
        final_wav = AUDIO_DIR / f"ep1_voice_{mode_name}.wav"
        run_ffmpeg([
            "-i", str(voice_wav),
            "-i", str(bgm_wav),
            "-filter_complex", "[0:a]volume=1.35[v];[1:a]volume=0.85[b];[v][b]amix=inputs=2:duration=first:dropout_transition=1,alimiter=limit=0.95[out]",
            "-map", "[out]",
            "-ar", "44100",
            "-ac", "2",
            str(final_wav)
        ])
        run_ffmpeg([
            "-i", str(final_wav),
            "-b:a", "192k",
            str(final_mp3)
        ])
        if voice_wav.exists():
            voice_wav.unlink()
        if bgm_wav.exists():
            bgm_wav.unlink()

        timings_by_mode[mode_name] = {
            "total_duration": cur_time,
            "scenes": scene_timings,
            "wav_path": str(final_wav),
            "mp3_path": str(final_mp3)
        }
        print(f"  -> Saved {final_mp3.name} ({cur_time:.1f}s)")

    return timings_by_mode


def load_korean_font(size, bold=True):
    candidates = [
        "C:/Windows/Fonts/malgunbd.ttf" if bold else "C:/Windows/Fonts/malgun.ttf",
        "C:/Windows/Fonts/NanumGothicBold.ttf",
        "C:/Windows/Fonts/gulim.ttc"
    ]
    for c in candidates:
        if os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


def strip_emojis_for_font(text):
    out = []
    for ch in text:
        code = ord(ch)
        if code <= 0xFFFF and not (0xD800 <= code <= 0xDFFF):
            out.append(ch)
    return "".join(out).strip()


def extract_flow_clip_frames(clip_path, n_frames, fps):
    """If the user placed a Google Flow clip (e.g., flow_clips/scene1.mp4), extract its frames scaled to 1080x1920."""
    tmp_dir = FRAMES_DIR / "_flow_extract"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    for f in tmp_dir.glob("*.jpg"):
        f.unlink()
    run_ffmpeg([
        "-stream_loop", "-1",
        "-i", str(clip_path),
        "-vf", f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps={fps}",
        "-vframes", str(n_frames),
        str(tmp_dir / "bg_%04d.jpg")
    ])
    return sorted(tmp_dir.glob("bg_*.jpg"))


def render_shorts_frame(sc, sub_text, progress_in_scene, bg_image=None):
    W, H = 1080, 1920
    if bg_image is not None:
        base = bg_image.convert("RGB")
        # Slight dark overlay so cards & captions pop clearly over Google Flow video
        overlay = Image.new("RGB", (W, H), (15, 23, 42))
        base = Image.blend(base, overlay, 0.18)
    else:
        c1, c2 = sc["bg_colors"]
        base = Image.new("RGB", (W, H), c1)
        draw_bg = ImageDraw.Draw(base)
        for y in range(H):
            ratio = y / float(H)
            r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
            g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
            b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
            draw_bg.line([(0, y), (W, y)], fill=(r, g, b))

    draw = ImageDraw.Draw(base)

    f_top_pill = load_korean_font(34, True)
    f_header = load_korean_font(52, True)
    f_card_badge = load_korean_font(30, True)
    f_card_title = load_korean_font(42, True)
    f_card_price = load_korean_font(44, True)
    f_card_point = load_korean_font(31, False)
    f_sub = load_korean_font(46, True)
    f_footer = load_korean_font(30, True)

    # 1. Top Shorts Hook Bar
    draw.rounded_rectangle([60, 85, W - 60, 345], radius=36, fill=(15, 23, 42), outline=(59, 130, 246), width=4)
    draw.rounded_rectangle([95, 112, 430, 168], radius=28, fill=(37, 99, 235))
    draw.text((120, 118), strip_emojis_for_font(sc["step_badge"]), font=f_top_pill, fill=(255, 255, 255))

    spk_label = "선배맘 픽" if sc["speaker_duet"] == "mom" else "육아대디 픽"
    spk_bg = (236, 72, 153) if sc["speaker_duet"] == "mom" else (16, 185, 129)
    draw.rounded_rectangle([W - 335, 112, W - 95, 168], radius=28, fill=spk_bg)
    draw.text((W - 300, 118), spk_label, font=f_top_pill, fill=(255, 255, 255))

    title_lines = sc["title"].split("\n")
    ty = 190
    for tl in title_lines:
        draw.text((95, ty), strip_emojis_for_font(tl), font=f_header, fill=(255, 255, 255))
        ty += 66

    # 2. Center Curation Product Card (if Google Flow background clip is present, make card compact lower-middle so B-roll shines)
    float_offset = int(math.sin(progress_in_scene * math.pi * 2) * 8)
    card_top = 395 + float_offset
    card_bottom = 1365 + float_offset

    draw.rounded_rectangle([78, card_top + 14, W - 62, card_bottom + 14], radius=44, fill=(203, 213, 225))
    draw.rounded_rectangle([70, card_top, W - 70, card_bottom], radius=44, fill=(255, 255, 255), outline=(191, 219, 254), width=5)

    prod_img_path = ROOT / sc["product_img"]
    if prod_img_path.exists():
        pimg = Image.open(prod_img_path).convert("RGBA")
        scale = 1.0 + 0.05 * min(1.0, progress_in_scene)
        target_w = int(820 * scale)
        target_h = int(520 * scale)
        pimg = pimg.resize((target_w, target_h), Image.Resampling.LANCZOS)
        left = (target_w - 820) // 2
        top = (target_h - 520) // 2
        pimg = pimg.crop((left, top, left + 820, top + 520))
        base.paste(pimg.convert("RGB"), (130, card_top + 45))

    info_y = card_top + 590
    draw.rounded_rectangle([120, info_y, W - 120, info_y + 58], radius=18, fill=(239, 246, 255))
    draw.text((145, info_y + 10), strip_emojis_for_font(sc["product_badge"]), font=f_card_badge, fill=(29, 78, 216))

    info_y += 78
    pname = strip_emojis_for_font(sc["product_name"])
    if len(pname) > 22:
        draw.text((120, info_y), pname[:22], font=f_card_title, fill=(15, 23, 42))
        draw.text((120, info_y + 52), pname[22:], font=f_card_title, fill=(15, 23, 42))
        info_y += 114
    else:
        draw.text((120, info_y), pname, font=f_card_title, fill=(15, 23, 42))
        info_y += 64

    draw.text((120, info_y), strip_emojis_for_font(sc["product_price"]), font=f_card_price, fill=(220, 38, 38))
    info_y += 66

    draw.rounded_rectangle([120, info_y, W - 120, info_y + 90], radius=20, fill=(248, 250, 252), outline=(226, 232, 240), width=2)
    pt_text = strip_emojis_for_font(sc["product_point"])
    draw.text((142, info_y + 24), pt_text[:30], font=f_card_point, fill=(51, 65, 85))

    # 3. Dynamic Pop-up Subtitle Box
    sub_clean = strip_emojis_for_font(sub_text)
    draw.rounded_rectangle([65, 1435, W - 65, 1615], radius=34, fill=(15, 23, 42), outline=(250, 204, 21), width=5)
    bbox = draw.textbbox((0, 0), sub_clean, font=f_sub)
    tw = bbox[2] - bbox[0]
    tx = max(90, (W - tw) // 2)
    draw.text((tx, 1495), sub_clean, font=f_sub, fill=(254, 240, 138))

    # 4. Bottom Store & Free Diagnosis Membership Banner
    draw.rounded_rectangle([65, 1665, W - 65, 1815], radius=28, fill=(29, 78, 216))
    draw.text((110, 1692), "프로필 링크 [키즈핏 큐레이션 스토어] 공식 혜택가 모음", font=f_footer, fill=(255, 255, 255))
    draw.text((110, 1742), "스토어에서 상세 확인 시 [4대 발달·성장 진단] 100% 무료 오픈!", font=f_card_badge, fill=(191, 219, 254))

    return base


def build_shorts_mp4(timing_info, out_mp4_path):
    print("[2/4] Rendering 9:16 Vertical Shorts Video with Synchronized Subtitles & Product Cards...")
    fps = 15
    frame_idx = 0
    for f in FRAMES_DIR.glob("*.jpg"):
        f.unlink()

    scenes_timing = timing_info["scenes"]
    for s_idx, st in enumerate(scenes_timing):
        sc = SCENES[s_idx]
        line_durs = st["line_durations"]
        total_sc_dur = max(0.1, st["duration"])
        total_sc_frames = sum(max(1, int(round(d * fps))) for d in line_durs)

        flow_clip_path = FLOW_CLIPS_DIR / sc["clip_file"]
        flow_bg_files = []
        if flow_clip_path.exists():
            print(f"  -> Detected Google Flow clip: {flow_clip_path.name}, compositing as background!")
            flow_bg_files = extract_flow_clip_frames(flow_clip_path, total_sc_frames + 5, fps)

        elapsed_in_scene = 0.0
        sc_frame_cursor = 0

        for l_idx, l_dur in enumerate(line_durs):
            sub_text = sc["subtitles"][l_idx]
            n_frames = max(1, int(round(l_dur * fps)))
            for k in range(n_frames):
                prog = (elapsed_in_scene + (k / float(fps))) / total_sc_dur
                bg_img = None
                if sc_frame_cursor < len(flow_bg_files):
                    bg_img = Image.open(flow_bg_files[sc_frame_cursor])
                img = render_shorts_frame(sc, sub_text, prog, bg_img)
                frame_path = FRAMES_DIR / f"frame_{frame_idx:05d}.jpg"
                img.save(str(frame_path), quality=92)
                frame_idx += 1
                sc_frame_cursor += 1
            elapsed_in_scene += l_dur

    run_ffmpeg([
        "-framerate", str(fps),
        "-i", str(FRAMES_DIR / "frame_%05d.jpg"),
        "-i", timing_info["wav_path"],
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "20",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(out_mp4_path)
    ])

    for f in FRAMES_DIR.glob("*.jpg"):
        f.unlink()
    print(f"  -> Saved MP4 Video: {out_mp4_path} ({timing_info['total_duration']:.1f}s)")


def write_google_flow_guide(timings_by_mode):
    guide_path = OUT_DIR / "EP1_GOOGLE_FLOW_GUIDE.md"
    duet_dur = timings_by_mode["couple_duet"]["total_duration"]
    lines = [
        "# 🎬 [1편] 신생아 필수템 5가지 추천 — 구글 Flow 프롬프트 & 더빙 마스터 패키지",
        "",
        f"- **레퍼런스 스타일**: 팡팡쀼 (`육아는 장비빨! 신생아 육아 필수템 5가지 추천` 쇼츠 포맷)",
        f"- **총 러닝타임**: `{duet_dur:.1f}초` (유튜브 쇼츠 1.25배 속도감 + 무음 점프컷 적용 완료)",
        "- **생성된 더빙 오디오 파일 (`samples/shorts_ep1_newborn/audio/`)**:",
        "  1. `ep1_voice_couple_duet.mp3` (**★강추: 부부 티키타카 버전** — 엄마·아빠가 컷마다 번갈아 대화하듯 소개하여 단일 TTS 특유의 AI 지루함이 전혀 없는 버전)",
        "  2. `ep1_voice_mom_solo.mp3` (**30대 선배맘 단독 버전** — 무음 호흡 컷편집 + 1.25배속 + 콘덴서 마이크 EQ 적용)",
        "  3. `ep1_voice_dad_solo.mp3` (**다정한 육아대디 단독 버전** — 최신 다국어 자연 억양 모델 적용)",
        "- **즉시 재생 가능한 완성본 영상**:",
        "  - 로컬 파일: `D:\\드림컴퍼니\\5사업부\\samples\\shorts_ep1_newborn\\ep1_newborn_essential5_shorts.mp4`",
        "  - 브라우저 확인: `http://localhost:3000/samples/shorts_ep1_newborn/ep1_newborn_essential5_shorts.mp4`",
        "",
        "---",
        "",
        "## 📋 구글 Flow (`labs.google/fx/tools/flow`) 장면별 복사·붙여넣기 프롬프트 (6컷)",
        "> **핵심 팁**: AI 특유의 어색한 한국인 얼굴 정면 클로즈업을 피하고, **아이폰 15 Pro로 찍은 현실 육아 손동작·측면·1인칭 시점(POV)**으로 설계되어 실제 육아 유튜버 브이로그처럼 뽑힙니다.",
        "> 구글 Flow에서 생성하신 클립을 `samples/shorts_ep1_newborn/flow_clips/scene1.mp4` ~ `scene6.mp4` 이름으로 폴더에 넣고 `python scripts/build_ep1_flow_shorts.py`를 실행하시면 배경에 자동 합성됩니다!",
        ""
    ]
    for idx, sc in enumerate(SCENES, 1):
        lines.append(f"### Cut {idx} (`{sc['clip_file']}`). {sc['step_badge']} — {sc['product_name']}")
        lines.append(f"- **내레이션 대본 ({'선배맘' if sc['speaker_duet']=='mom' else '육아대디'})**:")
        for l in sc["lines"]:
            lines.append(f"  > \"{l}\"")
        lines.append("- **구글 Flow 입력 프롬프트 (복사해서 바로 붙여넣기)**:")
        lines.append("```text")
        lines.append(sc["flow_prompt_en"])
        lines.append("```")
        lines.append("")

    guide_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"[3/4] Saved Google Flow Prompt & Script Guide: {guide_path}")


async def main():
    timings = await build_all_voiceovers()
    out_mp4 = OUT_DIR / "ep1_newborn_essential5_shorts.mp4"
    build_shorts_mp4(timings["couple_duet"], out_mp4)
    write_google_flow_guide(timings)

    # Copy to dist/samples/shorts_ep1_newborn/ so http://localhost:3000 serves it immediately
    if DIST_OUT_DIR.exists():
        shutil.rmtree(DIST_OUT_DIR)
    shutil.copytree(OUT_DIR, DIST_OUT_DIR, ignore=shutil.ignore_patterns("_frames_tmp"))
    print("[4/4] Synced to dist/samples/shorts_ep1_newborn/ - Ready!")


if __name__ == "__main__":
    asyncio.run(main())
