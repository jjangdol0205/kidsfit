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
import imageio_ffmpeg

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path("D:/드림컴퍼니/5사업부")
BASE_DIR = ROOT / "samples" / "shorts_10eps"
RAW_CLIPS_DIR = BASE_DIR / "raw_clips"
YT_DIR = BASE_DIR / "yt_real_clips"
OUT_DIR = BASE_DIR / "mastered"
WORK_DIR = BASE_DIR / "_work_remix"
DIST_OUT_DIR = ROOT / "dist" / "samples" / "shorts_10eps"

FONT_BLACK = ROOT / "src" / "fonts" / "Pretendard-Black.otf"
FONT_GMARKET = ROOT / "src" / "fonts" / "GmarketSansTTFBold.ttf"
FONT_ROUND = ROOT / "src" / "fonts" / "NanumSquareRoundEB.ttf"
if not FONT_BLACK.exists():
    FONT_BLACK = FONT_ROUND
if not FONT_GMARKET.exists():
    FONT_GMARKET = FONT_ROUND

OUT_DIR.mkdir(parents=True, exist_ok=True)
WORK_DIR.mkdir(parents=True, exist_ok=True)
DIST_OUT_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30
SAMPLE_RATE = 48000
SAMPLES_PER_FRAME = SAMPLE_RATE // FPS

W_WHITE = (255, 255, 255, 255)
W_YELLOW = (255, 232, 0, 255)
W_MINT = (94, 255, 208, 255)
W_CORAL = (255, 128, 128, 255)

VOICE_SPECS = {
    "mom": {"voice": "ko-KR-SunHiNeural", "rate": "+26%", "pitch": "+5Hz"},
    "dad": {"voice": "ko-KR-InJoonNeural", "rate": "+25%", "pitch": "+3Hz"},
}

def find_clip(clip_key: str) -> Path:
    if clip_key.startswith("yt:"):
        tag = clip_key.split(":", 1)[1]
        p = YT_DIR / f"{tag}.mp4"
        if p.exists() and p.stat().st_size > 100_000:
            return p
    matches = list(RAW_CLIPS_DIR.glob(f"*{clip_key}*.mp4"))
    if matches:
        return matches[0]
    all_raw = list(RAW_CLIPS_DIR.glob("*.mp4"))
    return all_raw[0]


REMIX_EPISODES_6_TO_10 = [
    {
        "ep": 6,
        "slug": "ep06_probiotics_vs_multigummy2",
        "badge": "🔥 어린이집 등원 전 필수 · 1:1 실물 비교 (EP.06)",
        "hook_top": ("4~6세 면역 영양제 승자는?", W_YELLOW),
        "hook_bot": ("초유 유산균 스틱 VS 멀티구미", W_WHITE),
        "card_title": "📌 [쇼츠 6편] 4~6세 면역 영양제 1:1 공식 혜택가 비교",
        "card_sub": "① 100억 생유산균+초유 (29,900원) VS ② 스마트팬츠 구미 (31,500원)",
        "cta_pill": "👆 프로필 링크 [kidsfit.co.kr] 👉 [6편] 누르면 1초 오픈!",
        "cuts": [
            {
                "clip": "yt:ep06_b",
                "fallback": "98e700ff",
                "is_real_yt": True,
                "speaker": "mom",
                "voice_lines": [
                    {
                        "text": "어린이집 다니는 사세 육세 엄마들 주목!",
                        "lines": [[("4~6세 ", W_WHITE), ("어린이집 면역력", W_YELLOW)], [("영양제 1:1 끝판왕 대결!", W_WHITE)]],
                    },
                    {
                        "text": "백억 초유 유산균 스틱 대 스마트팬츠 멀티구미!",
                        "lines": [[("초유 유산균 스틱", W_MINT)], [("VS ", W_YELLOW), ("스마트팬츠 구미!", W_YELLOW)]],
                    },
                ],
            },
            {
                "clip": "06b45076",
                "fallback": "06b45076",
                "is_real_yt": False,
                "speaker": "dad",
                "voice_lines": [
                    {
                        "text": "감기 달고 살고 배앓이 잦은 아이라면!",
                        "lines": [[("환절기 면역+장 케어", W_YELLOW), ("가", W_WHITE)], [("가장 급하다면?", W_WHITE)]],
                    },
                    {
                        "text": "백억 생유산균에 아연 초유까지 든 스틱이 정답!",
                        "lines": [[("100억 생유산균+", W_WHITE), ("아연·초유", W_YELLOW)], [("하루 1포 스틱 원픽!", W_MINT)]],
                    },
                ],
            },
            {
                "clip": "yt:ep06_a",
                "fallback": "957cda85",
                "is_real_yt": True,
                "speaker": "mom",
                "voice_lines": [
                    {
                        "text": "반대로 약 거부 심한 아이 종합비타민과 오메가쓰리는!",
                        "lines": [[("약 거부 아이 ", W_WHITE), ("종합비타민+DHA", W_YELLOW)], [("맛있게 먹이려면?", W_WHITE)]],
                    },
                    {
                        "text": "미국 직구 일위 스마트팬츠 멀티구미로 끝내세요!",
                        "lines": [[("미국 1위 ", W_WHITE), ("스마트팬츠 구미", W_YELLOW)], [("아이들이 먼저 찾아요!", W_MINT)]],
                    },
                ],
            },
            {
                "clip": "170486bf",
                "fallback": "170486bf",
                "is_real_yt": False,
                "speaker": "dad",
                "voice_lines": [
                    {
                        "text": "프로필 링크 키즈핏에서 육편 누르고 공식 혜택가 비교하세요!",
                        "lines": [[("프로필 링크 ", W_WHITE), ("[6편] 1초 클릭!", W_YELLOW)], [("밀크T 0원 무료체험 보너스까지!", W_MINT)]],
                    },
                ],
            },
        ],
    },
    {
        "ep": 7,
        "slug": "ep07_magnetic_blocks_120p1",
        "badge": "🚨 주말 스마트폰 단번에 끊은 마법 교구 (EP.07)",
        "hook_top": ("유튜브만 보던 아이가 2시간 초집중!", W_YELLOW),
        "hook_bot": ("3D 입체 자석블록 120P 대용량", W_WHITE),
        "card_title": "📌 [쇼츠 7편] 두뇌 공간지각력 3D 자석블록 120P",
        "card_sub": "강력 네오디뮴 자석 · 120피스 대용량 성 만들기 (42,000원)",
        "cta_pill": "👆 프로필 링크 [kidsfit.co.kr] 👉 [7편] 누르면 혜택가 오픈!",
        "cuts": [
            {
                "clip": "yt:ep07_a",
                "fallback": "2a9b5b67",
                "is_real_yt": True,
                "speaker": "mom",
                "voice_lines": [
                    {
                        "text": "주말마다 스마트폰 달라고 떼쓰는 아이 단번에 고쳤어요!",
                        "lines": [[("스마트폰 찾던 아이", W_WHITE)], [("2시간 초집중", W_YELLOW), ("시킨 비결!", W_WHITE)]],
                    },
                    {
                        "text": "쓰리디 입체 자석블록 백이십 피스 대용량 세트예요!",
                        "lines": [[("3D 입체 자석블록", W_YELLOW)], [("120피스 대용량 세트!", W_MINT)]],
                    },
                ],
            },
            {
                "clip": "yt:ep07_b",
                "fallback": "24a75853",
                "is_real_yt": True,
                "speaker": "dad",
                "voice_lines": [
                    {
                        "text": "자력이 강해서 손끝에서 착착 붙고 무너지지 않아요!",
                        "lines": [[("강력 자석이라 ", W_WHITE), ("손끝에서 착착!", W_YELLOW)], [("높게 쌓아도 안 무너져요!", W_WHITE)]],
                    },
                    {
                        "text": "평면 도형이 단숨에 입체 성으로 변신합니다!",
                        "lines": [[("평면 전개도가 순식간에", W_WHITE)], [("초대형 3D 성으로 변신!", W_YELLOW)]],
                    },
                ],
            },
            {
                "clip": "24b96a3c",
                "fallback": "24b96a3c",
                "is_real_yt": False,
                "speaker": "mom",
                "voice_lines": [
                    {
                        "text": "놀면서 초등 도형 감각과 공간지각력이 저절로 커져요!",
                        "lines": [[("초등 수학 ", W_WHITE), ("도형·공간지각력", W_YELLOW)], [("놀이로 단숨에 폭발!", W_MINT)]],
                    },
                ],
            },
            {
                "clip": "bce02296",
                "fallback": "bce02296",
                "is_real_yt": False,
                "speaker": "dad",
                "voice_lines": [
                    {
                        "text": "프로필 링크 키즈핏에서 칠편 누르면 바로 열립니다!",
                        "lines": [[("프로필 링크 ", W_WHITE), ("[7편] 1초 클릭!", W_YELLOW)], [("120P 혜택가 바로 확인!", W_MINT)]],
                    },
                ],
            },
        ],
    },
    {
        "ep": 8,
        "slug": "ep08_ergonomic_chair_bookstand1",
        "badge": "⚡ 책만 보면 구부정한 아이 거북목 해결 (EP.08)",
        "hook_top": ("공부 습관보다 자세가 먼저!", W_YELLOW),
        "hook_bot": ("초등 척추 지지 성장의자 + 독서대", W_WHITE),
        "card_title": "📌 [쇼츠 8편] 초등 척추 지지 성장의자 & 원목 독서대",
        "card_sub": "듀얼 등받이 + 높이조절 발받침 + 45도 눈높이 독서대 (89,000원)",
        "cta_pill": "👆 프로필 링크 [kidsfit.co.kr] 👉 [8편] 누르면 혜택가 오픈!",
        "cuts": [
            {
                "clip": "yt:ep08_a",
                "fallback": "bea9ee2c",
                "is_real_yt": True,
                "speaker": "mom",
                "voice_lines": [
                    {
                        "text": "책만 펼치면 고개가 푹 숙여지는 우리 아이 거북목!",
                        "lines": [[("책만 보면 구부정한", W_WHITE)], [("우리 아이 ", W_WHITE), ("거북목·숨은 키!", W_YELLOW)]],
                    },
                    {
                        "text": "인체공학 성장 의자와 눈높이 독서대로 한 번에 잡았어요!",
                        "lines": [[("인체공학 성장의자", W_YELLOW)], [("+ 눈높이 독서대 꿀조합!", W_MINT)]],
                    },
                ],
            },
            {
                "clip": "yt:ep08_b",
                "fallback": "8f281d4a",
                "is_real_yt": True,
                "speaker": "dad",
                "voice_lines": [
                    {
                        "text": "듀얼 등받이와 발받침이 허리와 다리를 구십도로 잡아주고!",
                        "lines": [[("듀얼 등받이+발받침", W_YELLOW), ("이", W_WHITE)], [("척추를 90도로 밀착 지지!", W_WHITE)]],
                    },
                    {
                        "text": "사십오도 원목 독서대가 고개 숙일 틈을 없애줍니다!",
                        "lines": [[("45도 눈높이 독서대", W_MINT), ("로", W_WHITE)], [("목·어깨 통증 제로!", W_YELLOW)]],
                    },
                ],
            },
            {
                "clip": "1dc16806",
                "fallback": "1dc16806",
                "is_real_yt": False,
                "speaker": "mom",
                "voice_lines": [
                    {
                        "text": "자세가 편해지니까 책상 앞 집중 시간이 두 배로 늘었어요!",
                        "lines": [[("숨은 키 2cm 복원", W_YELLOW), ("하고", W_WHITE)], [("책상 집중력 2배 상승!", W_MINT)]],
                    },
                ],
            },
            {
                "clip": "1f1bf671",
                "fallback": "1f1bf671",
                "is_real_yt": False,
                "speaker": "dad",
                "voice_lines": [
                    {
                        "text": "프로필 링크 키즈핏에서 팔편 누르고 공부방 완성하세요!",
                        "lines": [[("프로필 링크 ", W_WHITE), ("[8편] 1초 클릭!", W_YELLOW)], [("초등 홈런 0원 체험 혜택까지!", W_MINT)]],
                    },
                ],
            },
        ],
    },
    {
        "ep": 9,
        "slug": "ep09_elementary_growth_brain3",
        "badge": "🚀 초등 급성장기 키+두뇌 동시에 잡는 3종 (EP.09)",
        "hook_top": ("초등 급성장기 골든타임 공식!", W_YELLOW),
        "hook_bot": ("칼마디K2 + 노르딕DHA + 그래비트랙스", W_WHITE),
        "card_title": "📌 [쇼츠 9편] 초등 키성장 + 두뇌 집중력 3종 풀세트",
        "card_sub": "칼마디K2(34,500원) · 노르딕DHA(37,800원) · 그래비트랙스 프로(58,000원)",
        "cta_pill": "👆 프로필 링크 [kidsfit.co.kr] 👉 [9편] 누르면 3종 한눈에!",
        "cuts": [
            {
                "clip": "3b05cda1",
                "fallback": "3b05cda1",
                "is_real_yt": False,
                "speaker": "mom",
                "voice_lines": [
                    {
                        "text": "초등 급성장기 키 성장과 두뇌 집중력을 동시에 잡는 공식!",
                        "lines": [[("초등 급성장기 골든타임!", W_YELLOW)], [("키+두뇌 3종 시너지 공식!", W_WHITE)]],
                    },
                    {
                        "text": "첫째 칼슘을 뼈로 쏙 보내주는 고함량 칼마디 케이투!",
                        "lines": [[("① 뼈로 직행하는 ", W_WHITE), ("칼마디 K2!", W_YELLOW)]],
                    },
                ],
            },
            {
                "clip": "f3c66b8e",
                "fallback": "f3c66b8e",
                "is_real_yt": False,
                "speaker": "dad",
                "voice_lines": [
                    {
                        "text": "둘째 전두엽 암기력과 집중력을 깨우는 노르딕 오메가쓰리!",
                        "lines": [[("② 두뇌 집중력 원픽", W_WHITE)], [("노르딕 키즈 오메가3 DHA!", W_MINT)]],
                    },
                ],
            },
            {
                "clip": "yt:ep09_a",
                "fallback": "867ae4b1",
                "is_real_yt": True,
                "speaker": "mom",
                "voice_lines": [
                    {
                        "text": "셋째 중력과 가속도를 직접 설계하는 그래비트랙스 프로!",
                        "lines": [[("③ 중력·가속도 과학 트랙", W_WHITE)], [("그래비트랙스 프로 스타터팩!", W_YELLOW)]],
                    },
                    {
                        "text": "구슬 길을 직접 짜면서 공간추론과 과학 탐구력이 폭발해요!",
                        "lines": [[("구슬 트랙 직접 설계하며", W_WHITE)], [("이과형 전두엽 두뇌 폭발!", W_MINT)]],
                    },
                ],
            },
            {
                "clip": "yt:ep09_b",
                "fallback": "c7d34827",
                "is_real_yt": True,
                "speaker": "dad",
                "voice_lines": [
                    {
                        "text": "프로필 링크 키즈핏에서 구편 누르면 삼총사 한눈에 열려요!",
                        "lines": [[("프로필 링크 ", W_WHITE), ("[9편] 1초 클릭!", W_YELLOW)], [("초등 3종 혜택가 세트 확인!", W_MINT)]],
                    },
                ],
            },
        ],
    },
    {
        "ep": 10,
        "slug": "ep10_free_trial_top4",
        "badge": "🎁 신청만 해도 100% 0원! 안 받으면 손해 (EP.10)",
        "hook_top": ("엄마들 사이에서 소문난 100% 공짜!", W_YELLOW),
        "hook_bot": ("연령별 0원 무료체험 4대장 총정리", W_WHITE),
        "card_title": "📌 [쇼츠 10편] 연령별 100% 0원 무료체험 4대장 통합 신청",
        "card_sub": "웅진북클럽(0~1세) · 핀덴베베(1~3세) · 밀크T아이(4~6세) · 홈런(7~12세)",
        "cta_pill": "👆 프로필 링크 [kidsfit.co.kr] 👉 [10편] 누르고 0원 신청!",
        "cuts": [
            {
                "clip": "yt:ep10_a",
                "fallback": "cd689172",
                "is_real_yt": True,
                "speaker": "mom",
                "voice_lines": [
                    {
                        "text": "엄마들 사이에서 안 받으면 무조건 손해라는 영원 무료체험 네 가지!",
                        "lines": [[("안 받으면 무조건 손해인", W_WHITE)], [("100% 0원 무료체험 4대장!", W_YELLOW)]],
                    },
                    {
                        "text": "영세 신생아는 웅진북클럽 오감 그림책 무료체험!",
                        "lines": [[("👶 0~1세 신생아:", W_MINT)], [("웅진북클럽 오감 그림책 0원!", W_YELLOW)]],
                    },
                ],
            },
            {
                "clip": "7c9d5b11",
                "fallback": "7c9d5b11",
                "is_real_yt": False,
                "speaker": "dad",
                "voice_lines": [
                    {
                        "text": "말문 트이는 일에서 삼세는 한솔 핀덴베베 말놀이 체험팩!",
                        "lines": [[("🧒 1~3세 영아기:", W_MINT)], [("한솔 핀덴베베 그림책팩 0원!", W_YELLOW)]],
                    },
                ],
            },
            {
                "clip": "342478af",
                "fallback": "342478af",
                "is_real_yt": False,
                "speaker": "mom",
                "voice_lines": [
                    {
                        "text": "사세에서 육세 유아기는 천재교육 밀크티아이 칠일 무료체험!",
                        "lines": [[("👧 4~6세 유아기:", W_MINT)], [("밀크T아이 AI 학습기 7일 0원!", W_YELLOW)]],
                    },
                ],
            },
            {
                "clip": "yt:ep10_b",
                "fallback": "e1a8205c",
                "is_real_yt": True,
                "speaker": "dad",
                "voice_lines": [
                    {
                        "text": "칠세에서 십이세 초등학생은 아이스크림 홈런 십일 무료체험!",
                        "lines": [[("🧑 7~12세 초등학생:", W_MINT)], [("아이스크림 홈런 10일 0원!", W_YELLOW)]],
                    },
                    {
                        "text": "지금 프로필 링크 키즈핏에서 십편 누르고 네 가지 다 영원으로 챙기세요!",
                        "lines": [[("프로필 링크 ", W_WHITE), ("[10편] 1초 클릭!", W_YELLOW)], [("4종 전부 0원으로 바로 신청!", W_MINT)]],
                    },
                ],
            },
        ],
    },
]


def run_ffmpeg(args):
    cmd = [FFMPEG_EXE, "-y"] + args
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="ignore")
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {res.stderr[-800:]}")
    return res


def trim_and_quantize_wav_to_frames(wav_in: Path, wav_out: Path, pad_tail_frames: int = 2) -> int:
    with wave.open(str(wav_in), "rb") as w:
        raw = w.readframes(w.getnframes())
    samples = np.frombuffer(raw, dtype=np.int16)
    if len(samples) == 0:
        raise RuntimeError(f"Empty WAV: {wav_in}")

    win = 480
    n_wins = len(samples) // win
    trimmed = samples[: n_wins * win].reshape(n_wins, win).astype(np.float32)
    rms = np.sqrt(np.mean(trimmed ** 2, axis=1))
    peak = max(float(np.max(rms)), 1.0)
    thresh = max(peak * 0.022, 110.0)
    active = np.where(rms > thresh)[0]

    if len(active) > 0:
        s_idx = max(0, (int(active[0]) - 2) * win)
        e_idx = min(len(samples), (int(active[-1]) + 4) * win)
        core = samples[s_idx:e_idx]
    else:
        core = samples

    fade_len = min(480, len(core) // 8)
    if fade_len > 0:
        core = core.astype(np.float32)
        core[:fade_len] *= np.linspace(0.0, 1.0, fade_len, dtype=np.float32)
        core[-fade_len:] *= np.linspace(1.0, 0.0, fade_len, dtype=np.float32)
        core = np.clip(core, -32767, 32767).astype(np.int16)

    core_frames = max(12, int(math.ceil(len(core) / SAMPLES_PER_FRAME)))
    total_frames = core_frames + pad_tail_frames
    target_samples = total_frames * SAMPLES_PER_FRAME

    if len(core) < target_samples:
        padded = np.zeros(target_samples, dtype=np.int16)
        padded[: len(core)] = core
    else:
        padded = core[:target_samples]

    with wave.open(str(wav_out), "wb") as w_out:
        w_out.setnchannels(1)
        w_out.setsampwidth(2)
        w_out.setframerate(SAMPLE_RATE)
        w_out.writeframes(padded.tobytes())

    return total_frames


async def generate_phrase_wav(text: str, speaker: str, out_wav: Path, ep_work: Path) -> int:
    spec = VOICE_SPECS[speaker]
    tmp_mp3 = ep_work / (out_wav.stem + "_raw.mp3")
    tmp_wav = ep_work / (out_wav.stem + "_raw.wav")

    comm = edge_tts.Communicate(text=text, voice=spec["voice"], rate=spec["rate"], pitch=spec["pitch"])
    await comm.save(str(tmp_mp3))

    run_ffmpeg([
        "-i", str(tmp_mp3),
        "-ac", "1",
        "-ar", str(SAMPLE_RATE),
        "-c:a", "pcm_s16le",
        str(tmp_wav),
    ])

    return trim_and_quantize_wav_to_frames(tmp_wav, out_wav, pad_tail_frames=2)


def measure_segments_width(draw, segs, font):
    total_w = 0
    widths = []
    for txt, _ in segs:
        bbox = draw.textbbox((0, 0), txt, font=font)
        w = bbox[2] - bbox[0]
        widths.append(w)
        total_w += w
    return total_w, widths


def fit_font_for_lines(draw, lines_spec, font_path: Path, preferred_size: int, max_width: int = 940):
    sz = preferred_size
    while sz >= 42:
        f = ImageFont.truetype(str(font_path), sz)
        ok = True
        for segs in lines_spec:
            tw, _ = measure_segments_width(draw, segs, f)
            if tw > max_width:
                ok = False
                break
        if ok:
            return f, sz
        sz -= 2
    return ImageFont.truetype(str(font_path), 42), 42


def draw_stroked_line(canvas: Image.Image, y: int, segs, font, stroke_w: int = 16):
    W, H = canvas.size
    draw = ImageDraw.Draw(canvas)
    total_w, widths = measure_segments_width(draw, segs, font)
    start_x = (W - total_w) // 2

    sh_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh_draw = ImageDraw.Draw(sh_layer)
    cx = start_x
    for (txt, _), w in zip(segs, widths):
        sh_draw.text(
            (cx, y + 7),
            txt,
            font=font,
            fill=(0, 0, 0, 220),
            stroke_width=stroke_w + 4,
            stroke_fill=(0, 0, 0, 220),
        )
        cx += w
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(radius=7))
    canvas.alpha_composite(sh_layer)

    draw = ImageDraw.Draw(canvas)
    cx = start_x
    for (txt, _), w in zip(segs, widths):
        draw.text(
            (cx, y),
            txt,
            font=font,
            fill=(0, 0, 0, 255),
            stroke_width=stroke_w,
            stroke_fill=(0, 0, 0, 255),
        )
        cx += w

    cx = start_x
    for (txt, color), w in zip(segs, widths):
        draw.text((cx, y), txt, font=font, fill=color)
        cx += w


def render_remix_overlay_png(ep_spec: dict, lines_spec, is_real_yt: bool, out_png: Path):
    W, H = 1080, 1920
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    # 1. Top Broadcast Hook Banner (Always visible so the first 0.1s & every frame looks like a top shopping Reel)
    draw.rounded_rectangle([42, 96, 1038, 412], radius=34, fill=(10, 16, 32, 222), outline=(255, 215, 0, 235), width=4)
    # Top Pill Badge
    draw.rounded_rectangle([76, 118, 1004, 178], radius=22, fill=(29, 78, 216, 245))
    f_badge, _ = fit_font_for_lines(draw, [[(ep_spec["badge"], W_WHITE)]], FONT_ROUND, 36, 890)
    draw_stroked_line(canvas, 128, [(ep_spec["badge"], W_WHITE)], f_badge, stroke_w=6)

    # Hook Top & Bot inside Top Banner
    f_htop, _ = fit_font_for_lines(draw, [[ep_spec["hook_top"]]], FONT_BLACK, 64, 920)
    f_hbot, _ = fit_font_for_lines(draw, [[ep_spec["hook_bot"]]], FONT_BLACK, 68, 920)
    draw_stroked_line(canvas, 196, [ep_spec["hook_top"]], f_htop, stroke_w=12)
    draw_stroked_line(canvas, 286, [ep_spec["hook_bot"]], f_hbot, stroke_w=13)

    # 2. Live Footage Tag if using downloaded YouTube clip
    if is_real_yt:
        draw.rounded_rectangle([670, 434, 1036, 494], radius=20, fill=(220, 38, 38, 235), outline=(255, 255, 255, 220), width=2)
        f_live = ImageFont.truetype(str(FONT_ROUND), 30)
        draw.text((700, 447), "🎥 실제 제품 사용·리뷰 클립", font=f_live, fill=W_WHITE)

    # 3. Dynamic Pop Subtitles (Center-Lower Y=1195..1385)
    pref_sz = 82 if len(lines_spec) == 1 else 78
    font_cap, used_sz = fit_font_for_lines(draw, lines_spec, FONT_BLACK, preferred_size=pref_sz, max_width=950)
    line_step = int(used_sz * 1.24)
    base_y = 1265 if len(lines_spec) == 1 else 1195
    for idx, segs in enumerate(lines_spec):
        draw_stroked_line(canvas, base_y + idx * line_step, segs, font_cap, stroke_w=17)

    # 4. Bottom Commerce Spec & 1-Click CTA Card (Y=1455..1735)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle([42, 1455, 1038, 1735], radius=30, fill=(12, 20, 38, 232), outline=(94, 255, 208, 220), width=3)

    f_ctitle, _ = fit_font_for_lines(draw, [[(ep_spec["card_title"], W_YELLOW)]], FONT_ROUND, 36, 930)
    f_csub, _ = fit_font_for_lines(draw, [[(ep_spec["card_sub"], W_WHITE)]], FONT_ROUND, 33, 930)
    draw_stroked_line(canvas, 1478, [(ep_spec["card_title"], W_YELLOW)], f_ctitle, stroke_w=6)
    draw_stroked_line(canvas, 1534, [(ep_spec["card_sub"], W_WHITE)], f_csub, stroke_w=6)

    # Bottom Neon CTA Button Bar
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle([68, 1602, 1012, 1708], radius=24, fill=(5, 150, 105, 250), outline=(255, 232, 0, 255), width=3)
    f_cta, _ = fit_font_for_lines(draw, [[(ep_spec["cta_pill"], W_YELLOW)]], FONT_BLACK, 42, 900)
    draw_stroked_line(canvas, 1630, [(ep_spec["cta_pill"], W_YELLOW)], f_cta, stroke_w=8)

    canvas.save(out_png)


def make_trendy_upbeat_bgm(duration_sec: float, out_wav: Path):
    total_samples = int(duration_sec * SAMPLE_RATE)
    t = np.arange(total_samples, dtype=np.float32) / SAMPLE_RATE
    chord_freqs = [
        (261.63, 329.63, 392.00, 523.25),
        (349.23, 440.00, 523.25, 698.46),
        (392.00, 493.88, 587.33, 783.99),
        (293.66, 369.99, 440.00, 587.33),
    ]
    beat_sec = 0.32
    signal = np.zeros_like(t)
    n_beats = int(math.ceil(duration_sec / beat_sec))
    for b in range(n_beats):
        s = int(b * beat_sec * SAMPLE_RATE)
        e = min(total_samples, int((b + 1) * beat_sec * SAMPLE_RATE))
        if s >= e:
            break
        lt = np.arange(e - s, dtype=np.float32) / SAMPLE_RATE
        freqs = chord_freqs[(b // 4) % len(chord_freqs)]
        note = freqs[b % len(freqs)]
        env = np.exp(-lt * 7.2) * (1.0 - np.exp(-lt * 70.0))
        pluck = (0.65 * np.sin(2 * np.pi * note * lt) + 0.25 * np.sin(2 * np.pi * (note * 2) * lt)) * env
        # subtle kick pulse on even beats
        kick = 0.35 * np.sin(2 * np.pi * (95.0 * np.exp(-lt * 22.0) + 45.0) * lt) * np.exp(-lt * 14.0) if (b % 2 == 0) else 0.0
        signal[s:e] += (pluck + kick) * 0.036

    fade_out = min(int(0.9 * SAMPLE_RATE), total_samples // 4)
    if fade_out > 0:
        signal[-fade_out:] *= np.linspace(1.0, 0.0, fade_out, dtype=np.float32)

    pcm = np.clip(signal * 32767.0, -32767, 32767).astype(np.int16)
    with wave.open(str(out_wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm.tobytes())


async def master_remix_episode(ep_spec: dict) -> Path:
    ep_num = ep_spec["ep"]
    slug = ep_spec["slug"]
    print(f"\n=======================================================", flush=True)
    print(f"🎬 Remixing Episode {ep_num:02d} (Real YT + Commerce UI): {slug}", flush=True)
    print(f"=======================================================", flush=True)

    ep_work = WORK_DIR / f"ep{ep_num:02d}"
    ep_work.mkdir(parents=True, exist_ok=True)

    rendered_beat_mp4s = []
    phrase_wavs = []
    total_ep_frames = 0

    for cut_idx, cut in enumerate(ep_spec["cuts"], start=1):
        src_clip = find_clip(cut["clip"])
        if not src_clip or not src_clip.exists():
            src_clip = find_clip(cut["fallback"])
        is_real_yt = bool(cut.get("is_real_yt") and "yt_real_clips" in str(src_clip))
        speaker = cut["speaker"]
        vlines = cut["voice_lines"]

        beat_frames = []
        beat_pngs = []
        for b_idx, vl in enumerate(vlines):
            wav_p = ep_work / f"c{cut_idx}_b{b_idx}.wav"
            nf = await generate_phrase_wav(vl["text"], speaker, wav_p, ep_work)
            beat_frames.append(nf)
            phrase_wavs.append(wav_p)

            png_p = ep_work / f"c{cut_idx}_b{b_idx}.png"
            render_remix_overlay_png(ep_spec, vl["lines"], is_real_yt, png_p)
            beat_pngs.append(png_p)

        for b_idx, (nf, png_p) in enumerate(zip(beat_frames, beat_pngs)):
            dur_target = nf / FPS
            src_consume = min(3.4, dur_target * 1.25)
            if is_real_yt:
                ss = 0.6 + b_idx * 2.6
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
                f"eq=contrast=1.06:saturation=1.12:brightness=0.01[bg];"
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
    concat_txt.write_text(
        "\n".join(f"file '{p.as_posix()}'" for p in rendered_beat_mp4s),
        encoding="utf-8",
    )
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
    make_trendy_upbeat_bgm(total_sec, bgm_wav)

    final_mp4 = OUT_DIR / f"{slug}.mp4"
    ig_mp4 = OUT_DIR / f"{slug}_IG_Reels.mp4"
    yt_mp4 = OUT_DIR / f"{slug}_YT_Shorts.mp4"

    run_ffmpeg([
        "-i", str(merged_v),
        "-i", str(voice_track_wav),
        "-i", str(bgm_wav),
        "-filter_complex",
        "[1:a]volume=1.38[va];[2:a]volume=0.78[ba];[va][ba]amix=inputs=2:duration=first:dropout_transition=0[outa]",
        "-map", "0:v:0",
        "-map", "[outa]",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", str(SAMPLE_RATE),
        "-movflags", "+faststart",
        str(final_mp4),
    ])

    shutil.copy2(final_mp4, ig_mp4)
    shutil.copy2(final_mp4, yt_mp4)
    shutil.copy2(final_mp4, DIST_OUT_DIR / final_mp4.name)
    sz_mb = final_mp4.stat().st_size / (1024 * 1024)
    print(f"  ✅ Remixed {final_mp4.name} + IG_Reels + YT_Shorts ({total_sec:.2f}s | {sz_mb:.2f} MB)", flush=True)
    return final_mp4


async def main():
    for ep_spec in REMIX_EPISODES_6_TO_10:
        await master_remix_episode(ep_spec)
    print("\n🎉 All Episodes 6-10 remixed with Real YouTube Clips + Commerce Broadcast UI!", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
