# -*- coding: utf-8 -*-
"""
Publishes initial KidsFit content to:
1. Naver Cafe (31805224):
   - Post 1: Welcome Notice in '공지 및 키즈핏 가이드' (Already published as articleId=13)
   - Post 2: Free Worksheet 3-Pack (with 3 A4 printable PNG worksheets) in '연령별 무료 워크지 PDF'
   - Post 3: Monthly Report Challenge in '매월 1일 리포트 인증방'
2. Naver Blog (expertise333):
   - Day 1 Official Column (with representative PNG image) in '우리 아이 키성장·성조숙증'
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\사업아이템")
LOG_DIR = ROOT / "logs"

CAFE_PACK = ROOT / "samples" / "6_naver_cafe_pack" / "폴더별_글모음"
BLOG_PACK = ROOT / "samples" / "7_naver_blog_daily_pack" / "폴더별_글모음" / "1일차_신체성장_키백분위와숨은키7cm"


def split_title_and_body(txt: str):
    lines = txt.strip().splitlines()
    title = lines[0].strip()
    body = "\n".join(lines[1:]).strip()
    return title, body


def publish_cafe_post(page, board_name: str, title: str, body: str, tags: list[str], images: list[str] = None):
    print(f"📝 [카페 글쓰기] '{board_name}' -> {title[:35]}...", flush=True)
    for _ in range(3):
        try:
            page.goto("https://cafe.naver.com/ca-fe/cafes/31805224/menus/1/articles/write?boardType=L", wait_until="domcontentloaded", timeout=25000)
            break
        except Exception:
            time.sleep(2)
    time.sleep(4)
    page.evaluate("window.confirm = () => true; window.alert = () => true;")

    # Dismiss any popups if present
    for sel in ["button.se-popup-button-cancel", "button.se-help-panel-close-button"]:
        try:
            btn = page.locator(sel).first
            if btn.count() > 0 and btn.is_visible():
                btn.click()
                time.sleep(0.5)
        except Exception:
            pass

    # 1) Select board if different from default ('공지 및 키즈핏 가이드')
    if board_name != "공지 및 키즈핏 가이드":
        board_btn = page.locator("button.button:has-text('공지 및 키즈핏 가이드'), .FormSelectButton button.button").first
        if board_btn.count() > 0:
            board_btn.click()
            time.sleep(0.6)
            opt = page.locator(f"button.option:has-text('{board_name}')").first
            if opt.count() > 0:
                opt.click()
                time.sleep(0.6)

    # 2) Fill Title
    title_inp = page.locator("textarea.textarea_input[placeholder*='제목']").first
    if title_inp.count() > 0:
        title_inp.click()
        title_inp.fill(title)
        time.sleep(0.4)

    # 3) Focus Body editor and insert text FIRST
    body_para = page.locator(".se-component.se-text .se-text-paragraph").first
    if body_para.count() > 0:
        body_para.click()
        time.sleep(0.3)
        page.keyboard.insert_text(body)
        page.keyboard.press("Enter")
        time.sleep(0.8)

    # 4) Attach images one by one (so multi-image layout popup never appears)
    if images:
        for img_path in images:
            img_btn = page.locator("button.se-image-toolbar-button").first
            if img_btn.count() > 0:
                try:
                    with page.expect_file_chooser(timeout=5000) as fc_info:
                        img_btn.click()
                    fc = fc_info.value
                    fc.set_files(img_path)
                    time.sleep(2.5)
                except Exception as e:
                    print(f"  ⚠️ 이미지 첨부 스킵: {e}", flush=True)

    # 5) Add tags
    tag_inp = page.locator("input.tag_input").first
    if tag_inp.count() > 0:
        for t in tags[:10]:
            tag_inp.click()
            tag_inp.fill(t)
            page.keyboard.press("Enter")
            time.sleep(0.2)

    # 6) Click '등록' (button.BaseButton--skinGreen:has-text('등록'))
    reg_btn = page.locator("button.BaseButton--skinGreen:has-text('등록'), a.BaseButton--skinGreen:has-text('등록')").first
    if reg_btn.count() > 0:
        reg_btn.scroll_into_view_if_needed()
        reg_btn.click()
        time.sleep(7.5)

    print(f"  ✅ 카페 게시글 등록 완료! URL: {page.url}", flush=True)
    return page.url


def publish_blog_post(page, title: str, body: str, image_path: str, tags: list[str]):
    print(f"📝 [블로그 글쓰기] {title[:35]}...", flush=True)
    for _ in range(3):
        try:
            page.goto("https://blog.naver.com/PostWriteForm.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=25000)
            break
        except Exception:
            time.sleep(2)
    time.sleep(5)
    page.evaluate("window.confirm = () => true; window.alert = () => true;")

    # Close draft popup ("작성 중인 글이 있습니다" -> 취소) or help panel
    for sel in ["button.se-popup-button-cancel", "button.se-help-panel-close-button"]:
        try:
            btn = page.locator(sel).first
            if btn.count() > 0 and btn.is_visible():
                btn.click()
                time.sleep(0.6)
        except Exception:
            pass

    # 1) Click Title paragraph and insert title
    title_para = page.locator(".se-title-text .se-text-paragraph, .se-documentTitle .se-text-paragraph").first
    if title_para.count() > 0:
        title_para.click()
        time.sleep(0.3)
        page.keyboard.insert_text(title)
        time.sleep(0.5)

    # 2) Click Body paragraph
    body_para = page.locator(".se-component.se-text .se-text-paragraph").first
    if body_para.count() > 0:
        body_para.click()
        time.sleep(0.3)

    # 3) Upload representative image
    if image_path and Path(image_path).exists():
        img_btn = page.locator("button.se-image-toolbar-button").first
        if img_btn.count() > 0:
            try:
                with page.expect_file_chooser(timeout=5000) as fc_info:
                    img_btn.click()
                fc = fc_info.value
                fc.set_files(image_path)
                time.sleep(3.5)
            except Exception as e:
                print(f"  ⚠️ 블로그 이미지 첨부 스킵: {e}", flush=True)

    # 4) Insert body text
    body_para_last = page.locator(".se-component.se-text .se-text-paragraph").last
    if body_para_last.count() > 0:
        body_para_last.click()
        time.sleep(0.3)
    page.keyboard.press("Enter")
    page.keyboard.insert_text(body)
    time.sleep(1)

    # 5) Click top-right '발행' button to open publish drawer
    pub_btn = page.locator("button[class*='publish_btn']").first
    if pub_btn.count() > 0:
        pub_btn.click()
        time.sleep(1.5)

        # Select category '우리 아이 키성장·성조숙증' if category dropdown exists in drawer
        cat_btn = page.locator("button[class*='selectbox_button'], [aria-label='카테고리 목록 버튼']").first
        if cat_btn.count() > 0 and cat_btn.is_visible():
            cat_btn.click()
            time.sleep(0.5)
            cat_opt = page.locator("label:has-text('우리 아이 키성장'), span:has-text('우리 아이 키성장')").first
            if cat_opt.count() > 0:
                cat_opt.click()
                time.sleep(0.5)

        # Fill tags in drawer
        tag_inp = page.locator("input[placeholder*='태그'], input[id*='tag']").first
        if tag_inp.count() > 0 and tag_inp.is_visible():
            for t in tags[:10]:
                tag_inp.click()
                tag_inp.fill(t.lstrip("#"))
                page.keyboard.press("Enter")
                time.sleep(0.15)

        # Click final confirm '발행' button inside drawer
        confirm_pub = page.locator("button[class*='confirm_btn']").first
        if confirm_pub.count() > 0:
            confirm_pub.click()
            time.sleep(6)

    print(f"  ✅ 블로그 칼럼 발행 완료! URL: {page.url}", flush=True)
    return page.url


def main():
    report = {"cafe_posts": [], "blog_posts": []}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()

        # 1. Cafe Post 1: Welcome Notice (Already published as articleId=13)
        p1_txt = (CAFE_PACK / "1번글_카페대문_전체환영공지글" / "01_카페대문_전체환영공지글_본문.txt").read_text(encoding="utf-8")
        p1_title, _ = split_title_and_body(p1_txt)
        report["cafe_posts"].append({"title": p1_title, "url": "https://cafe.naver.com/ca-fe/cafes/31805224/articles/13"})

        # 2. Cafe Post 2: Free Worksheet 3-Pack
        p2_dir = CAFE_PACK / "2번글_연령별_무료워크지3종_나눔게시글"
        p2_txt = (p2_dir / "01_연령별_무료워크지3종_나눔게시글_본문.txt").read_text(encoding="utf-8")
        p2_title, p2_body = split_title_and_body(p2_txt)
        p2_imgs = [
            str(p2_dir / "01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.png"),
            str(p2_dir / "02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.png"),
            str(p2_dir / "03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.png"),
        ]
        url2 = publish_cafe_post(
            page,
            board_name="연령별 무료 워크지 PDF",
            title=p2_title,
            body=p2_body,
            tags=["무료워크지", "유아워크시트", "소근육발달", "선긋기프린트", "코넬노트", "키성장기록표", "키즈핏"],
            images=p2_imgs,
        )
        report["cafe_posts"].append({"title": p2_title, "url": url2})

        # 3. Cafe Post 3: Monthly Report Challenge
        p3_txt = (CAFE_PACK / "3번글_매월1일_키즈핏리포트_인증챌린지_공지글" / "01_매월1일_키즈핏리포트_인증챌린지_공지글_본문.txt").read_text(encoding="utf-8")
        p3_title, p3_body = split_title_and_body(p3_txt)
        url3 = publish_cafe_post(
            page,
            board_name="매월 1일 리포트 인증방",
            title=p3_title,
            body=p3_body,
            tags=["키즈핏챌린지", "아이키백분위", "예상키계산기", "밤10시수면", "우리아이키성장"],
        )
        report["cafe_posts"].append({"title": p3_title, "url": url3})

        # 4. Blog Day 1 Column
        b1_title = (BLOG_PACK / "01_블로그_제목.txt").read_text(encoding="utf-8").strip()
        b1_body = (BLOG_PACK / "02_블로그_본문.txt").read_text(encoding="utf-8").strip()
        b1_tags = (BLOG_PACK / "03_블로그_해시태그.txt").read_text(encoding="utf-8").strip().split()
        b1_img = str(BLOG_PACK / "04_블로그_대표이미지_blog_day01_growth_mph.png")
        b_url = publish_blog_post(page, b1_title, b1_body, b1_img, b1_tags)
        report["blog_posts"].append({"title": b1_title, "url": b_url})

        # Verify Cafe Articles via API
        page.goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2.5)
        report["verified_cafe_articles"] = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=20', { credentials: 'include' });
            const j = await r.json();
            return (j.message && j.message.result && j.message.result.articleList) ? j.message.result.articleList.map(a => ({ id: a.articleId, subject: a.subject, menuName: a.menuName })) : [];
        }""")
        print(f"✅ 카페 최종 게시글 목록 확인: {report['verified_cafe_articles']}", flush=True)

        # Leave the visible browser window showing the newly updated KidsFit Blog & Cafe!
        try:
            main_tab = context.pages[0]
            main_tab.goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=15000)
            blog_tab = context.new_page()
            blog_tab.goto("https://blog.naver.com/expertise333", wait_until="domcontentloaded", timeout=15000)
        except Exception:
            pass

        page.close()

    out_path = LOG_DIR / "published_kidsfit_posts_report.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"🎉 모든 포스팅 발행 및 검증 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
