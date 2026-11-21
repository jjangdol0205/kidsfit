# -*- coding: utf-8 -*-
"""
================================================================================
🇰🇷 국내 키즈핏 (kidsfit.co.kr) 제11편~제20편 Google Flow (11월 07 - 07_14.zip) 마스터링 엔진
================================================================================
- ~/Downloads/11월 07 - 07_14.zip (40개 클립)을 samples/shorts_10eps/raw_clips에 압축 해제
- 기존 1~10편(master_10eps_google_flow_shorts.py)과 100% 동일한 한국어 엄마·아빠 성우,
  노란/흰색 왕자막, 경쾌한 BGM, 마지막 2초 `프로필 링크 kidsfit.co.kr · [N편]` 적용
- 제11편부터 제20편까지 순차 렌더링 후 텔레그램으로 발송
================================================================================
"""

import asyncio
import os
import shutil
import sys
import zipfile
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(r"D:\드림컴퍼니\5사업부")
sys.path.insert(0, str(ROOT / "scripts"))

from master_10eps_google_flow_shorts import (
    RAW_CLIPS_DIR,
    OUT_DIR,
    W_WHITE,
    W_YELLOW,
    W_MINT,
    master_single_episode,
)

DOWNLOADS_ZIP = Path.home() / "Downloads" / "11월 07 - 07_14.zip"
TIKTOK_DIR = ROOT / "tiktok_insta_videos"
TIKTOK_DIR.mkdir(parents=True, exist_ok=True)
RAW_CLIPS_DIR.mkdir(parents=True, exist_ok=True)

EPISODES_11_TO_20 = [
    # =========================================================================
    # 제11편 [2가지 꿀조합] 신생아~100일 터미타임 & 블루래빗 초점책·어스본 사운드북
    # =========================================================================
    {
        "ep": 11,
        "slug": "ep11_newborn_tummytime_focus2",
        "title": "제11편 [2가지 꿀조합] 신생아 터미타임 & 시청각 두뇌 자극 첫 교구 공식",
        "products": [
            "블루래빗 두뇌계발 초점사운드북 + 헝겊초점책 (24,800원)",
            "어스본 우리 아기 오감발달 동물 오케스트라 사운드북 4종 세트 (43,200원)",
        ],
        "hook_top": ("터미타임 싫어하는 아기?", W_YELLOW),
        "hook_bot": ("시청각 두뇌 첫 교구 2가지", W_WHITE),
        "cuts": [
            {
                "clip": "e91cf0a1",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "엎드려 놓기만 하면 우는 아기 터미타임 공식!",
                        "lines": [
                            [("터미타임 싫어하는 아기", W_WHITE)],
                            [("고개 번쩍 드는 공식!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "시각과 청각을 동시에 열어주면 십분도 거뜬해요!",
                        "lines": [
                            [("시각+청각", W_YELLOW), (" 동시에 열면", W_WHITE)],
                            [("목 가누기 2배 빨라져요!", W_MINT)],
                        ],
                    },
                ],
            },
            {
                "clip": "9c66784b",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "첫째 블루래빗 두뇌계발 흑백 컬러 헝겊 초점책!",
                        "lines": [
                            [("첫째 ", W_WHITE), ("블루래빗", W_YELLOW)],
                            [("두뇌계발 초점책!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "선명한 초점 패턴에 바스락 촉감까지 시선 집중!",
                        "lines": [
                            [("선명한 초점+", W_WHITE), ("바스락 촉감", W_YELLOW)],
                            [("아기 시선 완전 고정!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "dbd0e1ec",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "둘째 어스본 동물 오케스트라 사운드북 사종 세트!",
                        "lines": [
                            [("둘째 ", W_WHITE), ("어스본 코리아", W_YELLOW)],
                            [("오케스트라 사운드북!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "생생한 클래식 악기 소리에 귀가 번쩍 열려요!",
                        "lines": [
                            [("생생한 ", W_WHITE), ("클래식 사운드", W_MINT)],
                            [("청각 두뇌가 깨어나요!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "c0fae81e",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "조리원 퇴소 직후부터 백일까지 매일 쓰는 꿀조합!",
                        "lines": [
                            [("신생아~100일 ", W_WHITE), ("필수 꿀조합", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "키즈핏 십일편에서 공식 혜택가로 바로 확인하세요!",
                        "lines": [
                            [("공식 혜택가", W_YELLOW), ("는 지금 바로", W_WHITE)],
                            [("프로필 링크 11편!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제12편 [2가지 꿀조합] 피셔프라이스 아기체육관 + 포그내 스텝원 신생아 아기띠
    # =========================================================================
    {
        "ep": 12,
        "slug": "ep12_baby_gym_carrier_combo2",
        "title": "제12편 [2가지 꿀조합] 엄마 손목 살리고 등센서 끄는 아기체육관 & 신생아 아기띠",
        "products": [
            "피셔프라이스 레인포레스트 아기체육관 (54,900원)",
            "포그내 스텝원 신생아 슬링 아기띠 (62,000원)",
        ],
        "hook_top": ("내려놓으면 우는 등센서?", W_YELLOW),
        "hook_bot": ("엄마 손목 구원템 2가지", W_WHITE),
        "cuts": [
            {
                "clip": "6f73a8c7",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "안아달라고 울어서 하루 종일 손목 시큰하시죠?",
                        "lines": [
                            [("내려놓기만 하면 ", W_WHITE), ("으앙!", W_YELLOW)],
                            [("엄마 손목 살리는 2가지!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "육아 퇴근 앞당기는 국민 육아템 꿀조합 공개합니다!",
                        "lines": [
                            [("맘카페 만족도 1위", W_MINT)],
                            [("국민 육아템 꿀조합!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "ef8567f5",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "첫째 피셔프라이스 레인포레스트 아기체육관!",
                        "lines": [
                            [("첫째 ", W_WHITE), ("피셔프라이스", W_YELLOW)],
                            [("레인포레스트 아기체육관!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "발로 차면 불빛과 멜로디가 나와 혼자서도 삼십분 놀아요!",
                        "lines": [
                            [("발차기 대근육+", W_WHITE), ("멜로디 자극", W_YELLOW)],
                            [("엄마 커피 타임 완성!", W_MINT)],
                        ],
                    },
                ],
            },
            {
                "clip": "dffbab21",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "둘째 안자마자 스르륵 잠드는 포그내 스텝원 아기띠!",
                        "lines": [
                            [("둘째 ", W_WHITE), ("포그내 스텝원", W_YELLOW)],
                            [("초경량 신생아 아기띠!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "엄마 품처럼 착 감싸줘서 등센서 아기도 오분 만에 꿀잠!",
                        "lines": [
                            [("어깨·허리 부담은 ", W_WHITE), ("절반으로!", W_YELLOW)],
                            [("안자마자 5분 컷 꿀잠!", W_MINT)],
                        ],
                    },
                ],
            },
            {
                "clip": "e59d1f41",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "엄마 아빠 삶의 질을 수직 상승시켜 줄 두 가지!",
                        "lines": [
                            [("엄마 아빠 ", W_WHITE), ("손목 구원 꿀조합!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "키즈핏 십이편에서 공식 혜택가로 바로 만나보세요!",
                        "lines": [
                            [("공식 혜택가", W_YELLOW), ("는 지금 바로", W_WHITE)],
                            [("프로필 링크 12편!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제13편 [2가지 꿀조합] 어스본 동물농장 사운드북 + 레고 듀플로 동물기차
    # =========================================================================
    {
        "ep": 13,
        "slug": "ep13_soundbook_vs_duplo2",
        "title": "제13편 [2가지 꿀조합] 돌 아기 말문 트이는 동물농장 사운드북 & 소근육 레고 듀플로",
        "products": [
            "어스본 우리 아기 오감발달 동물 농장 사운드북 (18,900원)",
            "레고 듀플로 10955 동물 기차 첫 블록 세트 (24,900원)",
        ],
        "hook_top": ("돌 지난 아기 말문+소근육!", W_YELLOW),
        "hook_bot": ("동물 사운드북 & 듀플로 기차", W_WHITE),
        "cuts": [
            {
                "clip": "410a5650",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "돌 지나고 부쩍 호기심 폭발하는 우리 아기!",
                        "lines": [
                            [("돌 전후 ", W_WHITE), ("언어+소근육", W_YELLOW)],
                            [("동시에 깨우는 꿀조합!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "첫째 어스본 우리 아기 동물 농장 사운드북!",
                        "lines": [
                            [("첫째 ", W_WHITE), ("어스본 동물농장", W_YELLOW)],
                            [("오감발달 사운드북!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "4e7679db",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "둘째 손끝 소근육을 키우는 레고 듀플로 동물 기차!",
                        "lines": [
                            [("둘째 ", W_WHITE), ("레고 듀플로", W_YELLOW)],
                            [("동물 기차 첫 블록!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "큼직한 블록을 끼우고 기차를 끌면서 눈손 협응력 폭발!",
                        "lines": [
                            [("끼우고 연결하며 ", W_WHITE), ("소근육 자극", W_MINT)],
                            [("두뇌 시냅스가 자라요!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "56c9c871",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "책에서 본 기린 코끼리를 블록으로 직접 만져보니까!",
                        "lines": [
                            [("사운드북 소리와 ", W_WHITE), ("실물 블록", W_YELLOW)],
                            [("1:1 매칭 놀이!", W_MINT)],
                        ],
                    },
                    {
                        "text": "동물 이름과 의성어 말문이 두 배 빨리 트여요!",
                        "lines": [
                            [("엄마 아빠 따라 ", W_WHITE), ("말문 뻥!", W_YELLOW)],
                            [("어휘력이 쑥쑥 늘어요!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "3bb40dcd",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "돌 선물로도 백점 만점인 두뇌 발달 두 가지 세트!",
                        "lines": [
                            [("1~3세 ", W_WHITE), ("베스트 교구 꿀조합!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "키즈핏 십삼편에서 공식 혜택가로 바로 확인하세요!",
                        "lines": [
                            [("공식 혜택가", W_YELLOW), ("는 지금 바로", W_WHITE)],
                            [("프로필 링크 13편!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제14편 [2가지 1:1 비교] 세노비스 키즈 멀티비타민 구미 VS 스마트팬츠 멀티구미
    # =========================================================================
    {
        "ep": 14,
        "slug": "ep14_cenovis_vs_smartypants2",
        "title": "제14편 [2가지 1:1 비교] 약 거부 아이 구미 영양제, 세노비스 VS 스마트팬츠",
        "products": [
            "세노비스 키즈 멀티비타민 미네랄 구미젤리 2개입 (36,900원)",
            "스마트팬츠 키즈 컴플리트 데일리 멀티구미 비타민D3+오메가3 (31,500원)",
        ],
        "hook_top": ("약 거부 심한 아이 구미 대결!", W_YELLOW),
        "hook_bot": ("세노비스 VS 스마트팬츠", W_WHITE),
        "cuts": [
            {
                "clip": "efb27bad",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "가루약 시럽만 보면 도망가는 아이 영양제 고민 끝!",
                        "lines": [
                            [("약 거부 심한 ", W_WHITE), ("편식 아이", W_YELLOW)],
                            [("구미 영양제 1:1 대결!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "세노비스 멀티구미 대 스마트팬츠 오메가 구미 비교해 드려요!",
                        "lines": [
                            [("세노비스 구미", W_MINT)],
                            [("VS ", W_YELLOW), ("스마트팬츠 구미!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "50e68148",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "먼저 기본 종합비타민과 아연 미네랄을 꽉 채우려면!",
                        "lines": [
                            [("기초 면역+영양 밸런스", W_YELLOW), ("가", W_WHITE)],
                            [("1순위라면?", W_WHITE)],
                        ],
                    },
                    {
                        "text": "폭신한 식감의 세노비스 키즈 멀티비타민 구미젤리!",
                        "lines": [
                            [("세노비스 키즈", W_YELLOW)],
                            [("멀티비타민 미네랄 구미!", W_MINT)],
                        ],
                    },
                ],
            },
            {
                "clip": "cc93b778",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "반대로 비타민디와 두뇌 오메가쓰리 디에이치에이까지 한 번에 챙기려면!",
                        "lines": [
                            [("종합비타민+", W_WHITE), ("오메가3 DHA", W_YELLOW)],
                            [("올인원으로 챙기려면?", W_WHITE)],
                        ],
                    },
                    {
                        "text": "미국 판매 일위 스마트팬츠 키즈 컴플리트 멀티구미!",
                        "lines": [
                            [("미국 1위 ", W_WHITE), ("스마트팬츠", W_YELLOW)],
                            [("컴플리트 데일리 구미!", W_MINT)],
                        ],
                    },
                ],
            },
            {
                "clip": "f8b3fbc1",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "아이들이 먼저 달라고 조르는 맛있는 영양제 두 가지!",
                        "lines": [
                            [("아이 입맛 맞춤 ", W_WHITE), ("1:1 큐레이션!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "키즈핏 십사편에서 두 상품 공식 혜택가를 비교해 보세요!",
                        "lines": [
                            [("공식 혜택가 비교", W_YELLOW), ("는", W_WHITE)],
                            [("프로필 링크 14편!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제15편 [1가지 단독집중] 기적의 한글 학습 1~5권 세트 (길벗스쿨)
    # =========================================================================
    {
        "ep": 15,
        "slug": "ep15_hangul_5min_miracle1",
        "title": "제15편 [1가지 단독집중] 5~7세 한글 떼기 전쟁 끝! 하루 15분 기적의 한글 학습",
        "products": [
            "기적의 한글 학습 1~5권 전권 세트 길벗스쿨 (37,800원)",
        ],
        "hook_top": ("5~7세 한글 떼기 고민 끝!", W_YELLOW),
        "hook_bot": ("하루 15분 기적의 한글 학습", W_WHITE),
        "cuts": [
            {
                "clip": "c820db0a",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "입학은 다가오는데 통글자만 외워서 막막하셨나요?",
                        "lines": [
                            [("5~7세 ", W_WHITE), ("엄마표 한글 떼기", W_YELLOW)],
                            [("어떻게 시작할까?", W_WHITE)],
                        ],
                    },
                    {
                        "text": "누적 이백만 부 돌파! 길벗스쿨 기적의 한글 학습!",
                        "lines": [
                            [("누적 200만 부 1위!", W_MINT)],
                            [("기적의 한글 학습 5권!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "6dba3d0c",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "훈민정음 창제 원리 그대로 모음 자음 결합부터 탄탄하게!",
                        "lines": [
                            [("자음+모음 ", W_YELLOW), ("결합 원리로", W_WHITE)],
                            [("처음 보는 글자도 척척!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "하루 딱 십오분 놀이처럼 따라 쓰면 받침까지 끝나요!",
                        "lines": [
                            [("하루 15분 ", W_MINT), ("놀이형 구성", W_WHITE)],
                            [("받침 글자까지 완벽 마스터!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "d50c9fcc",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "아이가 스스로 간판과 동화책을 소리 내어 읽기 시작해요!",
                        "lines": [
                            [("스스로 ", W_WHITE), ("동화책 읽는 기적!", W_YELLOW)],
                            [("학습 자신감이 쑥쑥!", W_MINT)],
                        ],
                    },
                ],
            },
            {
                "clip": "d31c7e86",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "비싼 한글 학원 대신 집에서 끝내는 일에서 오권 풀세트!",
                        "lines": [
                            [("1~5권 전권 세트 ", W_WHITE), ("완벽 구성!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "키즈핏 십오편에서 공식 혜택가로 바로 시작하세요!",
                        "lines": [
                            [("공식 혜택가", W_YELLOW), ("는 지금 바로", W_WHITE)],
                            [("프로필 링크 15편!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제16편 [1가지 단독집중] 비타민마을 금쪽같은 내새끼 어린이 칼슘 마그네슘 비타민D
    # =========================================================================
    {
        "ep": 16,
        "slug": "ep16_night_shin_pain_calmadi1",
        "title": "제16편 [1가지 단독집중] 새벽 정강이 성장통 케어! 금쪽같은 칼슘·마그네슘·비타민D",
        "products": [
            "비타민마을 금쪽같은 내새끼 어린이 칼슘 마그네슘 비타민D 4개입 (32,900원)",
        ],
        "hook_top": ("밤마다 다리 아파 깨는 아이?", W_YELLOW),
        "hook_bot": ("성장기 칼마디 황금비율!", W_WHITE),
        "cuts": [
            {
                "clip": "7d040293",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "밤마다 종아리 정강이 아프다고 깨서 주물러 주셨나요?",
                        "lines": [
                            [("밤마다 깨는 ", W_WHITE), ("아이 성장통", W_YELLOW)],
                            [("그냥 두면 안 돼요!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "뼈가 자랄 때 근육까지 이완해 주는 마그네슘이 핵심입니다!",
                        "lines": [
                            [("뼈 성장 ", W_WHITE), ("칼슘+비타민D", W_YELLOW)],
                            [("근육 이완 ", W_WHITE), ("마그네슘 필수!", W_MINT)],
                        ],
                    },
                ],
            },
            {
                "clip": "d4993ba4",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "비타민마을 금쪽같은 어린이 칼슘 마그네슘 비타민디!",
                        "lines": [
                            [("금쪽같은 내새끼", W_YELLOW)],
                            [("어린이 칼슘·마그네슘·D!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "칼슘 마그네슘 이대일 황금 배합에 아연까지 한 알에 쏙!",
                        "lines": [
                            [("칼슘:마그네슘 ", W_WHITE), ("2:1 황금비율", W_YELLOW)],
                            [("정상 면역 아연까지!", W_MINT)],
                        ],
                    },
                ],
            },
            {
                "clip": "6ed59002",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "물 없이도 맛있게 씹어 먹는 코코아 우유맛 츄어블이라!",
                        "lines": [
                            [("맛있는 ", W_WHITE), ("츄어블 정제", W_YELLOW)],
                            [("아이들이 먼저 찾아요!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "a9f431bf",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "넉넉한 네 통 세트로 급성장기 뼈 건강 든든하게 챙겨주세요!",
                        "lines": [
                            [("대용량 4통 세트 ", W_WHITE), ("가성비 끝판왕!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "키즈핏 십육편에서 공식 혜택가로 바로 확인하세요!",
                        "lines": [
                            [("공식 혜택가", W_YELLOW), ("는 지금 바로", W_WHITE)],
                            [("프로필 링크 16편!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제17편 [1가지 단독집중] 노르딕 네츄럴스 데일리 키즈 고순도 오메가3 DHA
    # =========================================================================
    {
        "ep": 17,
        "slug": "ep17_nordic_omega3_focus1",
        "title": "제17편 [1가지 단독집중] 초등 두뇌 집중력 원픽! 비린내 0% 노르딕 키즈 오메가3 DHA",
        "products": [
            "노르딕 네츄럴스 데일리 키즈 고순도 오메가3 DHA (34,500원)",
        ],
        "hook_top": ("책상 앞 10분도 못 앉는다면?", W_YELLOW),
        "hook_bot": ("초등 두뇌 오메가3 DHA 원픽", W_WHITE),
        "cuts": [
            {
                "clip": "32530718",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "책상 앞에 앉으면 딴생각하고 금방 지치는 우리 아이!",
                        "lines": [
                            [("초등 입학 후 ", W_WHITE), ("집중력·기억력", W_YELLOW)],
                            [("두뇌 영양제 고민이라면?", W_WHITE)],
                        ],
                    },
                    {
                        "text": "두뇌 신경세포막을 구성하는 고순도 디에이치에이가 정답!",
                        "lines": [
                            [("두뇌 구성 핵심 ", W_WHITE), ("오메가3 DHA", W_MINT)],
                            [("매일 보충이 필수예요!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "8de0805b",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "미국 오메가쓰리 일위 노르딕 네츄럴스 데일리 키즈!",
                        "lines": [
                            [("글로벌 1위 ", W_WHITE), ("노르딕 네츄럴스", W_YELLOW)],
                            [("데일리 키즈 오메가3!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "흡수율 높은 알티지형 정제 어유로 중금속 걱정 제로!",
                        "lines": [
                            [("고순도 ", W_WHITE), ("rTG형 오메가3", W_MINT)],
                            [("중금속·산패 테스트 완료!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "5e17af76",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "상큼한 천연 과일 향 미니 캡슐이라 비린내가 전혀 없어요!",
                        "lines": [
                            [("생선 비린내 0% ", W_YELLOW), ("상큼한 맛!", W_WHITE)],
                            [("초등 아이도 꿀꺽 잘 먹어요!", W_MINT)],
                        ],
                    },
                ],
            },
            {
                "clip": "c654f4f2",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "수업 시간 눈빛부터 달라지는 우리 아이 두뇌 루틴!",
                        "lines": [
                            [("초등 집중력·눈 건강 ", W_WHITE), ("동시 케어!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "키즈핏 십칠편에서 공식 혜택가로 바로 만나보세요!",
                        "lines": [
                            [("공식 혜택가", W_YELLOW), ("는 지금 바로", W_WHITE)],
                            [("프로필 링크 17편!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제18편 [1가지 단독집중] 그래비트랙스 프로 스타터 버티컬 레일블록 153P
    # =========================================================================
    {
        "ep": 18,
        "slug": "ep18_gravitrax_spatial_brain1",
        "title": "제18편 [1가지 단독집중] 스마트폰 끊고 2시간 초집중! 그래비트랙스 프로 버티컬 153P",
        "products": [
            "그래비트랙스 프로 스타터 버티컬 레일블록 153P (89,000원)",
        ],
        "hook_top": ("유튜브 게임 단번에 끊는 법!", W_YELLOW),
        "hook_bot": ("초등 공간지각 그래비트랙스", W_WHITE),
        "cuts": [
            {
                "clip": "c48885df",
                "speaker": "dad",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "주말마다 스마트폰만 찾는 아이 단번에 책상으로 부르는 법!",
                        "lines": [
                            [("스마트폰·게임 ", W_WHITE), ("단번에 끊는", W_YELLOW)],
                            [("독일 과학 교구 끝판왕!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "그래비트랙스 프로 스타터 버티컬 백오십삼 피스!",
                        "lines": [
                            [("그래비트랙스 프로", W_YELLOW)],
                            [("버티컬 스타터 153P!", W_MINT)],
                        ],
                    },
                ],
            },
            {
                "clip": "9dcd0edc",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "중력과 가속도 자기장 원리로 구슬 트랙을 직접 설계하니까!",
                        "lines": [
                            [("중력·가속도·자기장 ", W_YELLOW), ("물리 법칙", W_WHITE)],
                            [("스스로 트랙 설계!", W_MINT)],
                        ],
                    },
                    {
                        "text": "입체 기하학 공간지각력과 문제 해결력이 폭발해요!",
                        "lines": [
                            [("3D 공간지각력+", W_WHITE), ("창의력 폭발!", W_YELLOW)],
                            [("수학·과학 두뇌가 깨어나요!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "daf6427c",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "아빠와 아이가 머리 맞대고 두 시간 내내 초집중해요!",
                        "lines": [
                            [("주말 내내 ", W_WHITE), ("2시간 초집중!", W_YELLOW)],
                            [("아빠랑 최고로 신나는 시간!", W_MINT)],
                        ],
                    },
                ],
            },
            {
                "clip": "6f330ef0",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "초등 생일선물 어린이날 선물 부동의 일위 교구!",
                        "lines": [
                            [("초등 창의 교구 ", W_WHITE), ("만족도 1위!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "키즈핏 십팔편에서 공식 혜택가로 바로 확인하세요!",
                        "lines": [
                            [("공식 혜택가", W_YELLOW), ("는 지금 바로", W_WHITE)],
                            [("프로필 링크 18편!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제19편 [2가지 꿀조합] 뿌리깊은 초등국어 독해력 + 삼나무 원목 독서대
    # =========================================================================
    {
        "ep": 19,
        "slug": "ep19_elementary_reading_bookstand2",
        "title": "제19편 [2가지 꿀조합] 초등 1·2학년 문해력 & 바른 자세! 초등국어 독해력 + 원목 독서대",
        "products": [
            "마더텅 뿌리깊은 초등국어 독해력 기본편 1단계 (11,700원)",
            "눈높이 각도조절 친환경 삼나무 원목 독서대 (23,900원)",
        ],
        "hook_top": ("문장제 수학 못 푸는 진짜 이유!", W_YELLOW),
        "hook_bot": ("초등 문해력 & 원목 독서대", W_WHITE),
        "cuts": [
            {
                "clip": "9426fbfa",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "연산은 잘하는데 긴 문장제 문제만 나오면 막히는 아이!",
                        "lines": [
                            [("문장제 수학 ", W_WHITE), ("막히는 진짜 이유?", W_YELLOW)],
                            [("핵심은 초등 문해력!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "바른 자세와 독해력을 동시에 잡는 두 가지 꿀조합!",
                        "lines": [
                            [("독해력+바른 자세", W_MINT)],
                            [("초등 공부방 필수 2종!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "c8d163eb",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "첫째 고개 숙이는 거북목을 막아주는 삼나무 원목 독서대!",
                        "lines": [
                            [("첫째 ", W_WHITE), ("삼나무 원목 독서대!", W_YELLOW)],
                            [("눈높이 45도 각도 조절!", W_MINT)],
                        ],
                    },
                    {
                        "text": "시선이 편안해져서 글자가 눈에 쏙쏙 들어와요!",
                        "lines": [
                            [("목뼈 부담 제로+", W_WHITE), ("시야 집중!", W_YELLOW)],
                            [("독서 시간이 2배 늘어나요!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "39939aa3",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "둘째 마더텅 뿌리깊은 초등국어 독해력 일단계!",
                        "lines": [
                            [("둘째 ", W_WHITE), ("마더텅 뿌리깊은", W_YELLOW)],
                            [("초등국어 독해력 1단계!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "하루 한 장 짧은 지문으로 핵심 어휘와 요약력을 키워줘요!",
                        "lines": [
                            [("하루 10분 ", W_MINT), ("어휘+핵심 찾기", W_WHITE)],
                            [("전 과목 성적이 올라요!", W_YELLOW)],
                        ],
                    },
                ],
            },
            {
                "clip": "3b8a16d1",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "초등 저학년 공부 습관을 평생 잡아주는 두 가지!",
                        "lines": [
                            [("초등 1·2학년 ", W_WHITE), ("공부 습관 완성!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "키즈핏 십구편에서 공식 혜택가로 바로 확인하세요!",
                        "lines": [
                            [("공식 혜택가", W_YELLOW), ("는 지금 바로", W_WHITE)],
                            [("프로필 링크 19편!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
    # =========================================================================
    # 제20편 [4가지 총정리] 맘카페 재구매율 1위! 신생아~초등 월령별 베스트셀러 4대장
    # =========================================================================
    {
        "ep": 20,
        "slug": "ep20_all_stage_bestseller_top4",
        "title": "제20편 [4가지 총정리] 맘카페 재구매율 1위! 신생아~초등 월령별 베스트셀러 4대장",
        "products": [
            "신생아: 스와들업 Stage 1 오가닉 속싸개 (28,500원)",
            "영아기: 차일드라이프 액상 칼슘 마그네슘 오렌지맛 (22,300원)",
            "유아기: 종근당건강 락토핏 생유산균 키즈 (19,800원)",
            "초등기: 시디즈 링고 학생용 성장 의자 발받침형 (169,000원)",
        ],
        "hook_top": ("실패 없는 월령별 원픽은?", W_YELLOW),
        "hook_bot": ("키즈핏 누적 판매 4대장!", W_WHITE),
        "cuts": [
            {
                "clip": "4f6a3cea",
                "speaker": "mom",
                "show_hook": True,
                "voice_lines": [
                    {
                        "text": "수만 건 데이터로 검증된 월령별 일위 베스트셀러 총정리!",
                        "lines": [
                            [("신생아부터 초등까지", W_WHITE)],
                            [("월령별 베스트셀러 4대장!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "신생아 통잠 일위는 단연 스와들업 오가닉 속싸개!",
                        "lines": [
                            [("① 신생아 1위 ", W_MINT), ("스와들업 속싸개", W_YELLOW)],
                            [("모로반사 잡아주는 통잠템!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "23ed8acb",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "돌 아기 첫 칼슘 일위는 차일드라이프 액상 칼슘 마그네슘!",
                        "lines": [
                            [("② 영아기 1위 ", W_MINT), ("차일드라이프", W_YELLOW)],
                            [("오렌지맛 액상 칼슘!", W_WHITE)],
                        ],
                    },
                    {
                        "text": "유아기 장 면역 일위는 하루 한 포 락토핏 생유산균 키즈!",
                        "lines": [
                            [("③ 유아기 1위 ", W_MINT), ("락토핏 키즈", W_YELLOW)],
                            [("어린이집 배앓이·면역 끝!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "cfc999a1",
                "speaker": "mom",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "초등 입학 바른 자세 일위는 시디즈 링고 학생용 성장 의자!",
                        "lines": [
                            [("④ 초등 1위 ", W_MINT), ("시디즈 링고 의자", W_YELLOW)],
                            [("키에 맞춰 자라는 국민 의자!", W_WHITE)],
                        ],
                    },
                ],
            },
            {
                "clip": "6af2aadf",
                "speaker": "dad",
                "show_hook": False,
                "voice_lines": [
                    {
                        "text": "우리 아이 개월 수에 딱 맞는 맞춤 진단과 베스트셀러 네 가지!",
                        "lines": [
                            [("우리 아이 맞춤 ", W_WHITE), ("무료 진단+큐레이션!", W_YELLOW)],
                        ],
                    },
                    {
                        "text": "키즈핏 이십편에서 공식 혜택가로 한 번에 확인하세요!",
                        "lines": [
                            [("4종 공식 혜택가", W_YELLOW), ("는 지금 바로", W_WHITE)],
                            [("프로필 링크 20편!", W_MINT)],
                        ],
                    },
                ],
            },
        ],
    },
]


def extract_zip_to_raw_clips():
    if not DOWNLOADS_ZIP.exists():
        raise FileNotFoundError(f"Missing zip: {DOWNLOADS_ZIP}")
    print(f"📦 Extracting {DOWNLOADS_ZIP.name} -> {RAW_CLIPS_DIR}", flush=True)
    with zipfile.ZipFile(DOWNLOADS_ZIP, "r") as zf:
        for member in zf.namelist():
            if member.lower().endswith(".mp4"):
                target = RAW_CLIPS_DIR / Path(member).name
                with zf.open(member) as src, open(target, "wb") as dst:
                    shutil.copyfileobj(src, dst)
    print(f"✅ Extracted 40 clips into {RAW_CLIPS_DIR}", flush=True)


async def main():
    extract_zip_to_raw_clips()
    start_ep = 11
    if len(sys.argv) > 1:
        try:
            start_ep = int(sys.argv[1])
        except Exception:
            pass

    for ep_spec in EPISODES_11_TO_20:
        if ep_spec["ep"] < start_ep:
            continue
        out_mp4 = await master_single_episode(ep_spec)
        shutil.copy2(out_mp4, TIKTOK_DIR / out_mp4.name)
        print(f"  📁 Synced to {TIKTOK_DIR / out_mp4.name}", flush=True)

    print("\n🎉 All Korean KidsFit Episodes 11~20 Mastered Successfully!", flush=True)
    print("\n📲 Sending Korean Episodes 11~20 sequentially to Telegram...", flush=True)
    import subprocess
    import time
    sender_js = ROOT / "scripts" / "send_daily_6am_shorts_telegram.js"
    for ep_spec in EPISODES_11_TO_20:
        if ep_spec["ep"] < start_ep:
            continue
        ep_n = ep_spec["ep"]
        print(f"  -> Sending Ep {ep_n} to Telegram...", flush=True)
        subprocess.run(["node", str(sender_js), str(ep_n), "--force"], check=True)
        time.sleep(2.5)
    print("\n🏆 All Korean Episodes 11~20 delivered to Telegram!", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
