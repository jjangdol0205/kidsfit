import os
import sys
import glob
import json
import math
import struct
import wave
import shutil
import asyncio
import subprocess
from datetime import datetime, timedelta, timezone
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
OUT_DIR = BASE_DIR / "mastered"
WORK_DIR = BASE_DIR / "_work"
DIST_OUT_DIR = ROOT / "dist" / "samples" / "shorts_10eps"
FONT_PATH = ROOT / "src" / "fonts" / "NanumSquareRoundEB.ttf"

OUT_DIR.mkdir(parents=True, exist_ok=True)
WORK_DIR.mkdir(parents=True, exist_ok=True)
DIST_OUT_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30
SAMPLE_RATE = 48000
SAMPLES_PER_FRAME = SAMPLE_RATE // FPS  # 1600 samples per 1/30s frame

W_WHITE = (255, 255, 255, 255)
W_YELLOW = (255, 232, 0, 255)
W_MINT = (110, 255, 210, 255)

# 자연스러운 아나운서 호흡 (과속 금지 원칙 준수)
VOICE_SPECS = {
    "mom": {"voice": "ko-KR-SunHiNeural", "rate": "+8%", "pitch": "+2Hz"},
    "dad": {"voice": "ko-KR-InJoonNeural", "rate": "+7%", "pitch": "+1Hz"},
}

# @kidsfit01 유튜브 쇼츠 & 네이버 클립(Clip) 통합 발행 표준 규격 (09:30 KST 등원 직후 골든타임)
KIDSFIT_KR_YOUTUBE_UPLOAD_DEFAULTS = {
    "channel_handle": "@kidsfit01",
    "publishAt_kst": "09:30",
    "publishAt_alt_kst": "21:30",
    "categoryId": "27",  # Education
    "selfDeclaredMadeForKids": False,
    "defaultLanguage": "ko",
    "defaultAudioLanguage": "ko",
    "deprecated_duplicate_video_ids": ["AR7DkkXCRo0"],
    "fake_ai_product_photo_ban": True,  # 스와들업·핀덴베베·차일드라이프 등 어설픈 가짜 AI 육아용품 실사 영구 금지
    "format_mix": {
        "kr_3d_growth_neuro_cgi": 0.80,
        "clean_1to1_chart_card": 0.20,
    },
    "core_tags": [
        "키성장",
        "성조숙증",
        "우리아이예상키",
        "구강호흡",
        "성장판자극",
        "육아꿀팁",
        "키즈핏",
    ],
    "standard_yt_cta": "📏 부모 키 유전 한계를 넘는 우리 아이 최종 예상키 & 성조숙증 신호등 1분 무료 진단 👉 프로필 상단 [kidsfit.co.kr] 클릭!",
    "naver_clip_creator_shop_url": "https://cshop.naver.com/paradiseshop",
}


def find_clip_by_suffix(hex_suffix: str) -> Path:
    matches = list(RAW_CLIPS_DIR.glob(f"*{hex_suffix}*.mp4"))
    if not matches:
        raise FileNotFoundError(f"Clip with suffix '{hex_suffix}' not found in {RAW_CLIPS_DIR}")
    return matches[0]


EPISODES = [
    # =========================================================================
    # 제1편 [2가지 꿀조합] 스와들업 속싸개 + 3D 에어메쉬 두상 베개
    # =========================================================================
    {
        "ep": 1,
        "slug": "ep01_newborn_sleep_combo2",
        "title": "제1편 [2가지 꿀조합] 신생아 새벽 통잠 & 예쁜 두상 공식",
        "products": [
            "모로반사 숙면 방지 오가닉 순면 스와들업 속싸개 (28,500원)",
            "신생아 척추 보호 3D 통기성 에어메쉬 두상 베개 (34,000원)",
        ],
        "hook_top": ("새벽마다 깨는 아기?", W_YELLOW),
        "hook_bot": ("신생아 통잠 꿀조합 2가지", W_WHITE),
        "cuts": [
            {
                "clip": "73472e01",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "새벽마다 놀라 깨는 신생아 통잠 공식!",
                        "lines": [
                            [("새벽마다 깨는 아기", W_WHITE)],
                            [("통잠 공식 2가지!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "첫째 모로반사 스와들업 속싸개!",
                        "lines": [
                            [("첫째 ", W_WHITE), ("모로반사", W_YELLOW)],
                            [("스와들업 속싸개!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "만세 자세로 감싸줘서 안 놀라요!",
                        "lines": [
                            [("만세 자세", W_YELLOW), ("로 감싸줘서", W_WHITE)],
                            [("깜짝 안 놀라요!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "005c5b6a",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "둘째 쓰리디 에어메쉬 두상 베개!",
                        "lines": [
                            [("둘째 ", W_WHITE), ("3D 에어메쉬", W_YELLOW)],
                            [("두상 베개!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "태열은 싹 빼주고 두상은 동그랗게!",
                        "lines": [
                            [("태열은 ", W_WHITE), ("싹 빼주고", W_YELLOW)],
                            [("두상은 동그랗게!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "f2e7c324",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "이 두 개만 같이 세팅해주면",
                        "lines": [
                            [("이 ", W_WHITE), ("두 개만", W_YELLOW)],
                            [("같이 세팅해주면", W_WHITE)],
                        ],
                    },
                    {
                        "text": "눕히자마자 새벽 내내 꿀잠 자요!",
                        "lines": [
                            [("눕히자마자 ", W_WHITE), ("새벽 내내", W_YELLOW)],
                            [("꿀잠 자요!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "53baf197",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "엄마 아빠 아침 커피 타임이 생깁니다!",
                        "lines": [
                            [("엄마 아빠 ", W_WHITE), ("꿀휴식!", W_YELLOW)],
                            [("키즈핏에서 보세요!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제2편 [1가지 단독집중] 닥터에디션 베이비 비타민D3 400IU 드롭스 & 유산균
    # =========================================================================
    {
        "ep": 2,
        "slug": "ep02_baby_vitamind_drop1",
        "title": "제2편 [1가지 단독집중] 신생아 비타민D + 배앓이 유산균 하루 1방울!",
        "products": [
            "닥터에디션 베이비 비타민D3 400IU 드롭스 & 유산균 (26,400원)",
        ],
        "hook_top": ("신생아 영양제 고민 끝!", W_YELLOW),
        "hook_bot": ("하루 딱 1방울 비타민D", W_WHITE),
        "cuts": [
            {
                "clip": "6aaf5afd",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "조리원 퇴소 후 딱 하나만 고른다면!",
                        "lines": [
                            [("조리원 퇴소 후", W_WHITE)],
                            [("딱 하나만", W_YELLOW), (" 고른다면!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "베이비 비타민D 유산균 드롭스예요!",
                        "lines": [
                            [("베이비 ", W_WHITE), ("비타민D", W_YELLOW)],
                            [("유산균 드롭스!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "7d3e2b7c",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "가루 날림 없이 하루 딱 한 방울!",
                        "lines": [
                            [("가루 날림 없이", W_WHITE)],
                            [("하루 딱 ", W_WHITE), ("한 방울!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "사백 아이유 권장량이 그대로 들어가요!",
                        "lines": [
                            [("400IU 권장량", W_YELLOW), ("이", W_WHITE)],
                            [("한 방울에 쏙!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "cdc40517",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "배앓이 잡는 생유산균까지 함께 들어있어",
                        "lines": [
                            [("배앓이 잡는", W_YELLOW)],
                            [("생유산균까지 한번에!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "아기 배가 하루 종일 편안해요!",
                        "lines": [
                            [("아기 배가 하루 종일", W_WHITE)],
                            [("편안해요!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "6a7ff6b8",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "신생아 첫 영양제 키즈핏에서 확인하세요!",
                        "lines": [
                            [("신생아 첫 영양제", W_YELLOW)],
                            [("키즈핏에서 보세요!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제3편 [2가지 1:1 비교] 구연산 칼슘 시럽 vs 차일드라이프 액상 칼슘 오렌지맛
    # =========================================================================
    {
        "ep": 3,
        "slug": "ep03_liquid_calcium_vs2",
        "title": "제3편 [2가지 1:1 비교] 아기 액상 칼슘, 가성비 대용량 vs 오렌지맛 직구템!",
        "products": [
            "어린이 구연산 칼슘 + 비타민D3 + 아연 액상 시럽 (24,800원)",
            "차일드라이프 액상 칼슘 마그네슘 & 비타민D3 천연 오렌지맛 (22,300원)",
        ],
        "hook_top": ("아기 액상칼슘 승자는?", W_YELLOW),
        "hook_bot": ("구연산 시럽 VS 차일드라이프", W_WHITE),
        "cuts": [
            {
                "clip": "5bb5df06",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "돌 지난 아기 액상 칼슘 둘 중 뭐 살까?",
                        "lines": [
                            [("돌 아기 ", W_WHITE), ("액상 칼슘", W_YELLOW)],
                            [("둘 중 뭐 살까?", W_WHITE)],
                        ],
                    },
                    {
                        "text": "일대일로 딱 비교해 드릴게요!",
                        "lines": [
                            [("1:1로 딱", W_YELLOW)],
                            [("비교해 드릴게요!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "97bfb586",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "속 편한 흡수율과 아연까지 원한다면!",
                        "lines": [
                            [("속 편한 ", W_WHITE), ("흡수율+아연", W_YELLOW)],
                            [("까지 원한다면!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "구연산 칼슘 비타민디 시럽이 정답!",
                        "lines": [
                            [("구연산 칼슘 D3", W_YELLOW)],
                            [("시럽이 정답!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "0916afbb",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "약 거부 심한 아기 기호성이 일순위라면!",
                        "lines": [
                            [("약 거부 아기", W_WHITE)],
                            [("기호성이 1순위", W_YELLOW), ("라면!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "상큼한 오렌지맛 차일드라이프가 최고예요!",
                        "lines": [
                            [("상큼한 ", W_WHITE), ("오렌지맛", W_YELLOW)],
                            [("차일드라이프 최고!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "55e0a613",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "두 제품 모두 키즈핏에서 바로 비교해보세요!",
                        "lines": [
                            [("두 제품 모두", W_WHITE)],
                            [("키즈핏에서 비교!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제4편 [2가지 꿀조합] 걸음마 학습기·안전헬멧 + 몬테소리 원목 도형·비즈 롤러코스터
    # =========================================================================
    {
        "ep": 4,
        "slug": "ep04_toddler_walker_montessori2",
        "title": "제4편 [2가지 꿀조합] 돌 전후 1~3세 대근육 걸음마 + 소근육 두뇌 끝판왕 세트",
        "products": [
            "성장기 바른 보행 걸음마 학습기 & 충격 흡수 유아 안전 헬멧 (38,000원)",
            "몬테소리 소근육 발달 원목 도형 맞추기 & 입체 비즈 롤러코스터 (23,500원)",
        ],
        "hook_top": ("돌 아기 발달 끝판왕!", W_YELLOW),
        "hook_bot": ("대근육 걸음마 + 소근육 교구", W_WHITE),
        "cuts": [
            {
                "clip": "48a01735",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "돌 전후 아기 대근육 소근육 꿀조합 두 가지!",
                        "lines": [
                            [("돌 아기 ", W_WHITE), ("대근육+소근육", W_YELLOW)],
                            [("꿀조합 2가지!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "첫째 충격 흡수 안전헬멧과 걸음마 학습기!",
                        "lines": [
                            [("첫째 ", W_WHITE), ("안전헬멧과", W_YELLOW)],
                            [("걸음마 학습기!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "c016f3fc",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "쿵 넘어져도 머리 다칠 걱정 없이",
                        "lines": [
                            [("넘어져도 ", W_WHITE), ("머리 보호!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "바른 보행 자세로 걸음마가 빨라져요!",
                        "lines": [
                            [("바른 보행 자세", W_YELLOW), ("로", W_WHITE)],
                            [("걸음마가 빨라져요!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "17740539",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "둘째 몬테소리 원목 도형 비즈 롤러코스터!",
                        "lines": [
                            [("둘째 ", W_WHITE), ("몬테소리 원목", W_YELLOW)],
                            [("비즈 롤러코스터!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "모양 맞추며 공간감각이 쑥쑥 자라요!",
                        "lines": [
                            [("모양 맞추며", W_WHITE)],
                            [("공간감각 쑥쑥!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "9c8d7f56",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "손끝 소근육 자극까지 키즈핏에서 만나보세요!",
                        "lines": [
                            [("손끝 ", W_WHITE), ("소근육 자극!", W_YELLOW)],
                            [("키즈핏에서 보세요!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제5편 [1가지 단독집중] 어린이 성장판 자극 무소음 번지코드 트램폴린
    # =========================================================================
    {
        "ep": 5,
        "slug": "ep05_silent_bungee_trampoline1",
        "title": "제5편 [1가지 단독집중] 층간소음 0%! 집에서 키 크는 무소음 번지 트램폴린",
        "products": [
            "어린이 성장판 수직 자극 무소음 번지코드 트램폴린 (65,000원)",
        ],
        "hook_top": ("층간소음 0% 키성장!", W_YELLOW),
        "hook_bot": ("무소음 번지코드 트램폴린", W_WHITE),
        "cuts": [
            {
                "clip": "5466dbbd",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "비 오는 날 집에서 키 크는 최고의 운동!",
                        "lines": [
                            [("집에서 ", W_WHITE), ("키 크는", W_YELLOW)],
                            [("최고의 실내운동!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "무소음 번지코드 트램폴린이에요!",
                        "lines": [
                            [("무소음 번지코드", W_YELLOW)],
                            [("트램폴린이에요!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "c8e9522c",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "삐걱대는 철제 스프링 대신 고탄성 번지코드라",
                        "lines": [
                            [("철제 스프링 대신", W_WHITE)],
                            [("고탄성 번지코드!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "밤에 뛰어도 층간소음 걱정이 없어요!",
                        "lines": [
                            [("밤에 뛰어도", W_WHITE)],
                            [("층간소음 걱정 끝!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "a5b2d9e6",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "안전 손잡이 잡고 신나게 점프하면",
                        "lines": [
                            [("안전 손잡이", W_YELLOW), (" 잡고", W_WHITE)],
                            [("신나게 점프하면", W_WHITE)],
                        ],
                    },
                    {
                        "text": "무릎 충격 없이 성장판만 쏙쏙 자극해요!",
                        "lines": [
                            [("무릎 충격 없이", W_WHITE)],
                            [("성장판 수직 자극!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "2aae87ef",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "아이 체력은 빼주고 엄마는 편해집니다!",
                        "lines": [
                            [("엄마는 ", W_WHITE), ("자유시간!", W_YELLOW)],
                            [("키즈핏에서 보세요!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제6편 [2가지 1:1 비교] 키즈 면역 생유산균 100억+초유 vs 스마트팬츠 멀티구미
    # =========================================================================
    {
        "ep": 6,
        "slug": "ep06_probiotics_vs_multigummy2",
        "title": "제6편 [2가지 1:1 비교] 4~6세 어린이집 면역 유산균 분말 vs 맛있는 멀티구미!",
        "products": [
            "키즈 면역 생유산균 100억 CFU + 아연/초유 단백 성장단 (29,900원)",
            "스마트팬츠 키즈 컴플리트 데일리 멀티구미 비타민D3 + 오메가3 DHA (31,500원)",
        ],
        "hook_top": ("어린이집 면역 영양제!", W_YELLOW),
        "hook_bot": ("초유 유산균 VS 멀티구미", W_WHITE),
        "cuts": [
            {
                "clip": "98e700ff",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "사세에서 육세 어린이집 면역 영양제 대결!",
                        "lines": [
                            [("4~6세 ", W_WHITE), ("면역 영양제", W_YELLOW)],
                            [("1:1 빅매치!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "분말 유산균 스틱 대 멀티구미!",
                        "lines": [
                            [("초유 유산균 스틱", W_WHITE)],
                            [("VS ", W_YELLOW), ("멀티구미!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "06b45076",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "장 면역과 환절기 정상 면역이 급하다면!",
                        "lines": [
                            [("장 면역+환절기 케어", W_YELLOW), ("가", W_WHITE)],
                            [("가장 급하다면!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "백억 생유산균 아연 초유 스틱을 추천해요!",
                        "lines": [
                            [("100억 생유산균", W_YELLOW)],
                            [("아연·초유 스틱!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "957cda85",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "종합비타민에 오메가쓰리까지 맛있게 먹이려면!",
                        "lines": [
                            [("종합비타민+", W_WHITE), ("오메가3", W_YELLOW)],
                            [("맛있게 먹이려면!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "스마트팬츠 과일맛 멀티구미가 딱이에요!",
                        "lines": [
                            [("스마트팬츠", W_YELLOW)],
                            [("멀티구미가 정답!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "170486bf",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "아침마다 스스로 챙겨 먹고 씩씩하게 등원해요!",
                        "lines": [
                            [("아침마다 ", W_WHITE), ("꿀꺽 등원!", W_YELLOW)],
                            [("키즈핏에서 보세요!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제7편 [1가지 단독집중] 두뇌 공간지각력 발달 3D 입체 자석 마그네틱 블록 120P
    # =========================================================================
    {
        "ep": 7,
        "slug": "ep07_magnetic_blocks_120p1",
        "title": "제7편 [1가지 단독집중] 스마트폰 단번에 끊게 만든 3D 입체 자석블록 120P",
        "products": [
            "두뇌 공간지각력 발달 3D 입체 자석 마그네틱 블록 120P (42,000원)",
        ],
        "hook_top": ("스마트폰 단번에 끊는!", W_YELLOW),
        "hook_bot": ("3D 입체 자석블록 120P", W_WHITE),
        "cuts": [
            {
                "clip": "2a9b5b67",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "아이 스마트폰 단번에 끊게 만든 마법 교구!",
                        "lines": [
                            [("스마트폰 ", W_WHITE), ("단번에 끊는", W_YELLOW)],
                            [("마법의 두뇌 교구!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "쓰리디 입체 자석블록 백이십 피스예요!",
                        "lines": [
                            [("3D 입체 자석블록", W_YELLOW)],
                            [("120피스 세트!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "24a75853",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "강력한 자석이라 손끝에서 착착 붙고",
                        "lines": [
                            [("강력한 자석", W_YELLOW), ("이라", W_WHITE)],
                            [("손끝에서 착착!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "평면 도형이 순식간에 입체로 변해요!",
                        "lines": [
                            [("평면 도형이 단숨에", W_WHITE)],
                            [("3D 입체로 변신!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "24b96a3c",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "백이십 피스 대용량이라 무너지지 않고",
                        "lines": [
                            [("120피스 대용량", W_YELLOW), ("이라", W_WHITE)],
                            [("대형 성도 거뜬!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "아빠랑 두 시간 넘게 초집중해서 놀아요!",
                        "lines": [
                            [("아빠랑 ", W_WHITE), ("2시간 내내", W_YELLOW)],
                            [("초집중 창의 놀이!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "bce02296",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "공간지각력 키워주는 자석블록 키즈핏에 있어요!",
                        "lines": [
                            [("공간지각력 폭발!", W_YELLOW)],
                            [("키즈핏에서 보세요!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제8편 [1가지 단독집중] 초등 인체공학 척추 지지 성장 의자 & 거북목 교정 독서대
    # =========================================================================
    {
        "ep": 8,
        "slug": "ep08_ergonomic_chair_bookstand1",
        "title": "제8편 [1가지 단독집중] 초등 입학 전 거북목·척추 싹 잡는 성장 의자 + 독서대",
        "products": [
            "초등학생 인체공학 척추 지지 성장 의자 & 거북목 교정 독서대 (89,000원)",
        ],
        "hook_top": ("초등 거북목·척추 교정!", W_YELLOW),
        "hook_bot": ("인체공학 성장의자+독서대", W_WHITE),
        "cuts": [
            {
                "clip": "bea9ee2c",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "책만 보면 고개 숙이는 우리 아이 거북목!",
                        "lines": [
                            [("책만 보면 구부정한", W_WHITE)],
                            [("우리 아이 ", W_WHITE), ("거북목!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "인체공학 성장 의자와 독서대로 잡아주세요!",
                        "lines": [
                            [("인체공학 성장의자", W_YELLOW)],
                            [("독서대로 해결!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "8f281d4a",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "듀얼 등받이가 허리를 빈틈없이 받쳐주고",
                        "lines": [
                            [("듀얼 등받이", W_YELLOW), ("가 허리를", W_WHITE)],
                            [("빈틈없이 지지!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "발받침까지 있어 다리가 흔들리지 않아요!",
                        "lines": [
                            [("발받침까지 잡아줘서", W_WHITE)],
                            [("바른 자세 고정!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "1dc16806",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "여기에 눈높이 각도조절 원목 독서대를 더하면",
                        "lines": [
                            [("눈높이 ", W_WHITE), ("각도조절", W_YELLOW)],
                            [("원목 독서대까지!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "고개 숙일 일 없이 시야가 딱 편해져요!",
                        "lines": [
                            [("고개 숙일 일 없이", W_WHITE)],
                            [("목·어깨가 편안!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "1f1bf671",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "오래 앉아도 안 지치는 공부방 키즈핏에서 보세요!",
                        "lines": [
                            [("집중력 2배 상승!", W_YELLOW)],
                            [("키즈핏에서 보세요!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제9편 [3가지 시너지] 칼마디K2 + 노르딕 오메가3 DHA + 그래비트랙스 프로
    # =========================================================================
    {
        "ep": 9,
        "slug": "ep09_elementary_growth_brain3",
        "title": "제9편 [3가지 시너지] 초등 급성장기 키 성장 + 두뇌 집중력 3종 풀세트",
        "products": [
            "청소년 급성장기 고함량 칼슘마그네슘 D3 K2 츄어블정 (34,500원)",
            "노르딕 네츄럴스 데일리 키즈 고순도 오메가3 DHA (37,800원)",
            "초등 과학탐구 전두엽 문제해결력 그래비트랙스 프로 스타터팩 (58,000원)",
        ],
        "hook_top": ("초등 급성장기 필수!", W_YELLOW),
        "hook_bot": ("키성장+두뇌 3종 시너지", W_WHITE),
        "cuts": [
            {
                "clip": "3b05cda1",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "초등 급성장기 키와 두뇌를 동시에 잡는 법!",
                        "lines": [
                            [("초등 급성장기", W_YELLOW)],
                            [("키+두뇌 3종 공식!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "칼마디 케이투와 노르딕 오메가쓰리예요!",
                        "lines": [
                            [("칼마디 K2", W_YELLOW), (" 더하기", W_WHITE)],
                            [("노르딕 오메가3!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "f3c66b8e",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "뼈로 가는 칼슘과 두뇌 디에이치에이를",
                        "lines": [
                            [("뼈로 가는 ", W_WHITE), ("고함량 칼슘", W_YELLOW)],
                            [("두뇌 활성 ", W_WHITE), ("DHA!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "미니 캡슐과 츄어블로 매일 챙겨주고!",
                        "lines": [
                            [("미니 캡슐·츄어블로", W_WHITE)],
                            [("매일 간편 섭취!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "867ae4b1",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "세 번째 그래비트랙스 프로 과학 트랙으로",
                        "lines": [
                            [("셋째 ", W_WHITE), ("그래비트랙스", W_YELLOW)],
                            [("과학 구슬 트랙!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "중력과 가속도를 설계하며 전두엽을 깨워요!",
                        "lines": [
                            [("중력 트랙 설계하며", W_WHITE)],
                            [("전두엽 두뇌 폭발!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "c7d34827",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "초등 성장 삼총사 키즈핏에서 한눈에 보세요!",
                        "lines": [
                            [("초등 성장 3총사!", W_YELLOW)],
                            [("키즈핏에서 보세요!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제10편 [4가지 총정리] 신청만 해도 100% 공짜! 연령별 0원 무료체험 4대장
    # =========================================================================
    {
        "ep": 10,
        "slug": "ep10_free_trial_top4",
        "title": "제10편 [4가지 총정리] 신청만 해도 100% 공짜! 연령별 0원 무료체험 4대장",
        "products": [
            "웅진북클럽 베이비 첫 그림책 & 오감 발달 무료체험 (0원)",
            "한솔교육 핀덴베베 말놀이 그림책 체험팩 & 발달상담 키트 (0원)",
            "밀크T 아이 4~6세 유아 전과목 AI 놀이학습기 7일 무료체험 (0원)",
            "아이스크림 홈런 초등 문해력·독해력 10일 무료체험 (0원)",
        ],
        "hook_top": ("신청만 해도 100% 0원!", W_YELLOW),
        "hook_bot": ("연령별 무료체험 4대장", W_WHITE),
        "cuts": [
            {
                "clip": "cd689172",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "안 받으면 손해인 연령별 영원 무료체험 네 가지!",
                        "lines": [
                            [("안 받으면 손해인", W_WHITE)],
                            [("0원 무료체험 4가지!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "영세 신생아는 웅진북클럽 오감 그림책!",
                        "lines": [
                            [("0~1세 신생아는", W_WHITE)],
                            [("웅진북클럽 베이비!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "7c9d5b11",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "말문이 트이는 일에서 삼세 영아기는!",
                        "lines": [
                            [("말문 트이는 ", W_WHITE), ("1~3세는", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "한솔 핀덴베베 말놀이 그림책 체험팩!",
                        "lines": [
                            [("한솔 ", W_WHITE), ("핀덴베베", W_YELLOW)],
                            [("말놀이 그림책팩!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "342478af",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "한글 수 개념 시작하는 사에서 육세 유아기는!",
                        "lines": [
                            [("한글·수 시작 ", W_WHITE), ("4~6세는", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "밀크티 아이 에이아이 학습기 칠일 무료체험!",
                        "lines": [
                            [("밀크T 아이 학습기", W_YELLOW)],
                            [("7일 무료체험!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "e1a8205c",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "초등학생은 아이스크림 홈런 십일 무료체험!",
                        "lines": [
                            [("7~12세 초등학생은", W_WHITE)],
                            [("아이스크림 홈런!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "네 가지 모두 키즈핏에서 영원으로 신청하세요!",
                        "lines": [
                            [("4종 모두 ", W_WHITE), ("100% 0원!", W_YELLOW)],
                            [("키즈핏에서 신청!", W_MINT)],
                        ],
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

    win = 480  # 10ms window at 48kHz
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

    # 자막 100% 끝까지 완독 보장 (seg_dur >= tts_dur + 0.22s -> 최소 7프레임 = 0.233s 여유 확보)
    return trim_and_quantize_wav_to_frames(tmp_wav, out_wav, pad_tail_frames=7)


def measure_segments_width(draw, segs, font):
    total_w = 0
    widths = []
    for txt, _ in segs:
        bbox = draw.textbbox((0, 0), txt, font=font)
        w = bbox[2] - bbox[0]
        widths.append(w)
        total_w += w
    return total_w, widths


def fit_font_for_lines(draw, lines_spec, preferred_size: int, max_width: int = 940):
    sz = preferred_size
    while sz >= 52:
        f = ImageFont.truetype(str(FONT_PATH), sz)
        ok = True
        for segs in lines_spec:
            tw, _ = measure_segments_width(draw, segs, f)
            if tw > max_width:
                ok = False
                break
        if ok:
            return f, sz
        sz -= 2
    return ImageFont.truetype(str(FONT_PATH), 52), 52


def draw_stroked_line(canvas: Image.Image, y: int, segs, font, stroke_w: int = 18):
    W, H = canvas.size
    draw = ImageDraw.Draw(canvas)
    total_w, widths = measure_segments_width(draw, segs, font)
    start_x = (W - total_w) // 2

    sh_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh_draw = ImageDraw.Draw(sh_layer)
    cx = start_x
    for (txt, _), w in zip(segs, widths):
        sh_draw.text(
            (cx, y + 8),
            txt,
            font=font,
            fill=(0, 0, 0, 215),
            stroke_width=stroke_w + 4,
            stroke_fill=(0, 0, 0, 215),
        )
        cx += w
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(radius=8))
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


def render_overlay_png(
    lines_spec,
    is_final_beat: bool,
    ep_num: int,
    out_png: Path,
    hook_banner=None,
    include_cta: bool = True,
):
    W, H = 1080, 1920
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    # 한국형 상단 훅 배너 (y=200~300 세이프존, 양산형 박스 없이 두꺼운 외곽선 텍스트만 배치)
    if hook_banner and hook_banner[0]:
        f_hook_top = ImageFont.truetype(str(FONT_PATH), 52)
        ht_txt, ht_col = hook_banner[0]
        draw_stroked_line(canvas, 215, [(ht_txt, ht_col)], f_hook_top, stroke_w=14)
        if len(hook_banner) > 1 and hook_banner[1]:
            f_hook_bot = ImageFont.truetype(str(FONT_PATH), 46)
            hb_txt, hb_col = hook_banner[1]
            draw_stroked_line(canvas, 280, [(hb_txt, hb_col)], f_hook_bot, stroke_w=12)

    # 한국형 중앙 자막 세이프존 (y=1020~1100, 84~92pt 굵은 한글 폰트 + 검정 테두리 + 노랑/민트 강조)
    draw = ImageDraw.Draw(canvas)
    pref_sz = 92 if len(lines_spec) == 1 else 86
    font_cap, used_sz = fit_font_for_lines(draw, lines_spec, preferred_size=pref_sz, max_width=940)
    line_step = int(used_sz * 1.22)
    base_y = 1060 if len(lines_spec) == 1 else 1020

    for idx, segs in enumerate(lines_spec):
        draw_stroked_line(canvas, base_y + idx * line_step, segs, font_cap, stroke_w=18)

    if is_final_beat and include_cta:
        draw = ImageDraw.Draw(canvas)
        pill_text = "@kidsfit01 프로필 상단 [kidsfit.co.kr] · 1분 무료 성장진단"
        f_pill = ImageFont.truetype(str(FONT_PATH), 34)
        bbox = draw.textbbox((0, 0), pill_text, font=f_pill)
        tw = bbox[2] - bbox[0]
        px1 = (W - tw) // 2 - 36
        px2 = (W + tw) // 2 + 36
        py1, py2 = 1520, 1605
        draw.rounded_rectangle([px1, py1, px2, py2], radius=42, fill=(12, 18, 30, 225), outline=(255, 232, 0, 235), width=3)
        draw.text(((W - tw) // 2, py1 + 23), pill_text, font=f_pill, fill=W_YELLOW)

    canvas.save(out_png)


def make_cheerful_bgm(duration_sec: float, out_wav: Path):
    total_samples = int(duration_sec * SAMPLE_RATE)
    t = np.arange(total_samples, dtype=np.float32) / SAMPLE_RATE
    chord_freqs = [
        (261.63, 329.63, 392.00, 523.25),
        (349.23, 440.00, 523.25, 698.46),
        (392.00, 493.88, 587.33, 783.99),
        (261.63, 329.63, 392.00, 523.25),
    ]
    beat_sec = 0.36
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
        env = np.exp(-lt * 6.5) * (1.0 - np.exp(-lt * 65.0))
        pluck = (0.65 * np.sin(2 * np.pi * note * lt) + 0.25 * np.sin(2 * np.pi * (note * 2) * lt)) * env
        signal[s:e] += pluck * 0.032

    fade_out = min(int(1.0 * SAMPLE_RATE), total_samples // 4)
    if fade_out > 0:
        signal[-fade_out:] *= np.linspace(1.0, 0.0, fade_out, dtype=np.float32)

    pcm = np.clip(signal * 32767.0, -32767, 32767).astype(np.int16)
    with wave.open(str(out_wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm.tobytes())


async def master_single_episode(ep_spec: dict) -> Path:
    ep_num = ep_spec["ep"]
    slug = ep_spec["slug"]
    print(f"\n=======================================================", flush=True)
    print(f"🎬 Mastering Episode {ep_num:02d}: {ep_spec['title']}", flush=True)
    print(f"=======================================================", flush=True)

    ep_work = WORK_DIR / f"ep{ep_num:02d}"
    ep_work.mkdir(parents=True, exist_ok=True)

    rendered_beat_mp4s = []
    phrase_wavs = []
    total_ep_frames = 0

    for cut_idx, cut in enumerate(ep_spec["cuts"], start=1):
        src_clip = find_clip_by_suffix(cut["clip"])
        speaker = cut["speaker"]
        vlines = cut["voice_lines"]
        n_beats = len(vlines)

        # Generate TTS WAV and quantize to exact 30fps frames for each beat in this cut
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

        # Split raw 8s clip into dynamic Medium Shot (Beat 0) + Punch-in Zoom Close-up (Beat 1..N)
        # Cropping bottom-right margin cleanly and playing at 1.25x~1.35x speed!
        for b_idx, (nf, png_p) in enumerate(zip(beat_frames, beat_pngs)):
            dur_target = nf / FPS
            src_consume = min(3.6, dur_target * 1.28)
            if b_idx == 0:
                ss = 0.25
                vf_crop = "scale=1220:2168,crop=1080:1920:70:110"
            elif b_idx == 1:
                ss = 2.85
                vf_crop = "scale=1360:2418,crop=1080:1920:140:210"
            else:
                ss = 4.90
                vf_crop = "scale=1280:2275,crop=1080:1920:100:150"

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

    # 1. Concatenate all frame-exact video beats
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

    # 2. Concatenate all frame-quantized voice WAVs with 100% sample accuracy
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

    # 3. Mux video + voice + cheerful acoustic BGM
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

    # 네이버 클립(Clip) 동시 업로드용 100% 클린 MP4 + 유튜브/인스타 전용 버전 동시 출력
    naver_clip_mp4 = OUT_DIR / f"{slug}_NaverClip_Clean.mp4"
    shutil.copy2(final_mp4, naver_clip_mp4)
    shutil.copy2(final_mp4, OUT_DIR / f"{slug}_IG_Reels.mp4")
    shutil.copy2(final_mp4, OUT_DIR / f"{slug}_YT_Shorts.mp4")
    shutil.copy2(final_mp4, DIST_OUT_DIR / final_mp4.name)

    kst = timezone(timedelta(hours=9))
    now_kst = datetime.now(timezone.utc).astimezone(kst)
    pub_kst = now_kst.replace(hour=9, minute=30, second=0, microsecond=0)
    if pub_kst <= now_kst:
        pub_kst += timedelta(days=1)
    meta_out = OUT_DIR / f"{slug}.upload_meta.json"
    meta_out.write_text(
        json.dumps(
            {
                **KIDSFIT_KR_YOUTUBE_UPLOAD_DEFAULTS,
                "scheduled_publishAt": pub_kst.isoformat(),
                "episode": ep_num,
                "slug": slug,
                "naver_clip_clean_mp4": str(naver_clip_mp4),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    sz_mb = final_mp4.stat().st_size / (1024 * 1024)
    print(f"  ✅ Completed {final_mp4.name} + NaverClip_Clean + IG_Reels + YT_Shorts ({total_sec:.2f}s | {total_ep_frames} frames | {sz_mb:.2f} MB)", flush=True)
    return final_mp4


async def main():
    selected_eps = [int(x) for x in sys.argv[1:]] if len(sys.argv) > 1 else [e["ep"] for e in EPISODES]
    out_files = []
    for ep_spec in EPISODES:
        if ep_spec["ep"] in selected_eps:
            f = await master_single_episode(ep_spec)
            out_files.append(f)
    print(f"\n🎉 All {len(out_files)} episodes mastered in {OUT_DIR}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
