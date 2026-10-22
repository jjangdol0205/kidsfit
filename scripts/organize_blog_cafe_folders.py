#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
scripts/organize_blog_cafe_folders.py
Organizes every single Naver Blog post (7 posts) and Naver Cafe post (4 posts)
into its own dedicated individual folder.
"""

import shutil
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.generate_naver_blog_pack import BLOG_DAYS

BLOG_ROOT_KO = ROOT_DIR / "네이버블로그_글모음"
BLOG_SAMPLE_KO = ROOT_DIR / "samples" / "7_naver_blog_daily_pack" / "폴더별_글모음"

CAFE_ROOT_KO = ROOT_DIR / "네이버카페_글모음"
CAFE_SAMPLE_KO = ROOT_DIR / "samples" / "6_naver_cafe_pack" / "폴더별_글모음"


def organize_blog_folders():
    BLOG_FOLDER_NAMES = {
        1: "1일차_신체성장_키백분위와숨은키7cm",
        2: "2일차_두뇌학습_나이별교구와공부법순서",
        3: "3일차_신체성장_우유배앓이와칼슘시너지",
        4: "4일차_두뇌학습_문장제수학과작업기억",
        5: "5일차_신체성장_사춘기신호와급성장기골든타임",
        6: "6일차_두뇌학습_주말박물관하브루타질문법",
        7: "7일차_통합칼럼_밤10시수면과장기기억키성장",
    }

    src_pack_dir = ROOT_DIR / "samples" / "7_naver_blog_daily_pack"

    for base_target in [BLOG_ROOT_KO, BLOG_SAMPLE_KO]:
        base_target.mkdir(parents=True, exist_ok=True)
        for item in BLOG_DAYS:
            day_num = item["day"]
            folder_name = BLOG_FOLDER_NAMES[day_num]
            f_dir = base_target / folder_name
            f_dir.mkdir(parents=True, exist_ok=True)

            # 1. Combined Title + Body + Tags file
            full_txt = (
                f"■ 발행 일차: {item['day_label']}\n"
                f"■ 카테고리: {item['category']}\n\n"
                f"【1. 블로그 제목】\n{item['seo_title']}\n\n"
                f"--------------------------------------------------------------------------\n"
                f"【2. 블로그 본문】\n\n{item['body']}\n\n"
                f"--------------------------------------------------------------------------\n"
                f"【3. 추천 해시태그 10개】\n{item['tags']}\n"
            )
            (f_dir / "00_블로그_제목_본문_태그_통합본.txt").write_text(full_txt, encoding="utf-8")
            (f_dir / "01_블로그_제목.txt").write_text(item["seo_title"] + "\n", encoding="utf-8")
            (f_dir / "02_블로그_본문.txt").write_text(item["body"] + "\n", encoding="utf-8")
            (f_dir / "03_블로그_해시태그.txt").write_text(item["tags"] + "\n", encoding="utf-8")

            # Copy the day's custom infographic image into this folder
            src_img = src_pack_dir / item["img_file"]
            if src_img.exists():
                shutil.copy2(src_img, f_dir / f"04_블로그_대표이미지_{item['img_file']}")

    print("✅ 블로그 7개 글 개별 폴더 정리 완료 ->", BLOG_ROOT_KO)


def organize_cafe_folders():
    src_cafe_dir = ROOT_DIR / "samples" / "6_naver_cafe_pack"
    src_posts_dir = src_cafe_dir / "posts"

    cafe_items = [
        {
            "folder": "1번글_카페대문_전체환영공지글",
            "src_txt": "post_01_카페대문_전체환영공지글.txt",
            "out_txt": "01_카페대문_전체환영공지글_본문.txt",
            "include_pdfs": False,
        },
        {
            "folder": "2번글_연령별_무료워크지3종_나눔게시글",
            "src_txt": "post_02_연령별_무료워크지3종_나눔게시글.txt",
            "out_txt": "01_연령별_무료워크지3종_나눔게시글_본문.txt",
            "include_pdfs": True,
        },
        {
            "folder": "3번글_매월1일_키즈핏리포트_인증챌린지_공지글",
            "src_txt": "post_03_매월1일_키즈핏리포트_인증챌린지_공지글.txt",
            "out_txt": "01_매월1일_키즈핏리포트_인증챌린지_공지글_본문.txt",
            "include_pdfs": False,
        },
        {
            "folder": "4번글_5분완성_네이버카페_메뉴세팅_운영가이드",
            "src_txt": "post_04_5분완성_네이버카페_메뉴세팅_운영가이드.txt",
            "out_txt": "01_5분완성_네이버카페_메뉴세팅_운영가이드.txt",
            "include_pdfs": False,
        },
    ]

    pdf_files = [
        "01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.pdf",
        "01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.png",
        "02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.pdf",
        "02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.png",
        "03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.pdf",
        "03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.png",
    ]

    for base_target in [CAFE_ROOT_KO, CAFE_SAMPLE_KO]:
        base_target.mkdir(parents=True, exist_ok=True)
        for c_item in cafe_items:
            f_dir = base_target / c_item["folder"]
            f_dir.mkdir(parents=True, exist_ok=True)
            src_txt_path = src_posts_dir / c_item["src_txt"]
            if src_txt_path.exists():
                shutil.copy2(src_txt_path, f_dir / c_item["out_txt"])
            if c_item["include_pdfs"]:
                for pf in pdf_files:
                    src_pf = src_cafe_dir / pf
                    if src_pf.exists():
                        shutil.copy2(src_pf, f_dir / pf)

    print("✅ 네이버 카페 4개 글 개별 폴더 정리 완료 ->", CAFE_ROOT_KO)


if __name__ == "__main__":
    organize_blog_folders()
    organize_cafe_folders()
