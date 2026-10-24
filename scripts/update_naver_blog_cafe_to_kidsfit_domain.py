# -*- coding: utf-8 -*-
"""
Completes the live update of Naver Cafe (31805224 / moneyfitlab) and Naver Blog (expertise333)
to https://kidsfit.co.kr via Chrome CDP (http://127.0.0.1:9222).
(Cafe Front Gate was already updated to https://kidsfit.co.kr in step 1.)
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\키즈핏")
LOG_DIR = ROOT / "logs"
BRAND_DIR = ROOT / "samples" / "9_naver_brand_assets"
CAFE_PACK = ROOT / "samples" / "6_naver_cafe_pack" / "폴더별_글모음"
BLOG_PACK = ROOT / "samples" / "7_naver_blog_daily_pack" / "폴더별_글모음" / "1일차_신체성장_키백분위와숨은키7cm"


def split_title_and_body(txt: str):
    lines = txt.strip().splitlines()
    title = lines[0].strip()
    body = "\n".join(lines[1:]).strip()
    return title, body


def silence_all_dialogs(page):
    for f in page.frames:
        try:
            f.evaluate("window.confirm = () => true; window.alert = () => true; window.onbeforeunload = null;")
        except Exception:
            pass


def safe_goto(page, url: str, sleep_sec: float = 3.0):
    silence_all_dialogs(page)
    try:
        page.goto("about:blank", wait_until="commit", timeout=8000)
        time.sleep(0.25)
    except Exception:
        pass
    page.goto(url, wait_until="commit", timeout=25000)
    time.sleep(sleep_sec)
    silence_all_dialogs(page)


def type_multiline_into_se_one(page, body: str):
    for line in body.splitlines():
        clean = line.strip()
        if clean:
            page.keyboard.insert_text(clean)
        page.keyboard.press("Enter")
        time.sleep(0.025)


def publish_cafe_post_clean(page, board_name: str, title: str, body: str, tags: list[str], is_notice: bool = False, images: list[str] = None):
    print(f"📝 [카페 글쓰기] '{board_name}' -> {title[:38]}...", flush=True)
    safe_goto(page, "https://cafe.naver.com/ca-fe/cafes/31805224/menus/1/articles/write?boardType=L", sleep_sec=4.5)

    for sel in ["button.se-popup-button-cancel", "button.se-help-panel-close-button"]:
        btn = page.locator(sel).first
        if btn.count() > 0 and btn.is_visible():
            btn.click(force=True)
            time.sleep(0.4)

    if board_name != "공지 및 키즈핏 가이드":
        board_btn = page.locator("button.button:has-text('공지 및 키즈핏 가이드'), .FormSelectButton button.button").first
        if board_btn.count() > 0:
            board_btn.click(force=True)
            time.sleep(0.6)
            opt = page.locator(f"button.option:has-text('{board_name}')").first
            if opt.count() > 0:
                opt.click(force=True)
                time.sleep(0.6)

    title_inp = page.locator("textarea.textarea_input[placeholder*='제목']").first
    if title_inp.count() > 0:
        title_inp.click(force=True)
        title_inp.fill(title)
        time.sleep(0.4)

    page.evaluate("""() => {
        document.querySelectorAll('button.BaseButton--gray, .se-popup-close-button, .se-popup-button-cancel, .se-help-panel-close-button').forEach(b => b.click());
        document.querySelectorAll('.se-popup-dim').forEach(d => d.remove());
    }""")
    time.sleep(0.4)

    para_rect = page.evaluate("""() => {
        const p = document.querySelector('.se-text-paragraph');
        if (!p) return null;
        p.scrollIntoView({ block: 'center' });
        return p.getBoundingClientRect();
    }""")
    if para_rect:
        page.mouse.click(para_rect["x"] + 50, para_rect["y"] + 10)
        time.sleep(0.4)
    type_multiline_into_se_one(page, body)
    time.sleep(0.8)

    ed_len = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('.se-text-paragraph')).map(p => p.innerText).join('\\n').trim().length;
    }""")
    print(f"  👉 에디터 입력 본문 길이 확인: {ed_len}자", flush=True)

    if images:
        img_btn = page.locator("button.se-image-toolbar-button").first
        if img_btn.count() > 0:
            try:
                with page.expect_file_chooser(timeout=5000) as fc_info:
                    img_btn.click(force=True)
                fc = fc_info.value
                fc.set_files(images)
                time.sleep(1.5)
                page.evaluate("""() => {
                    const lbl = document.querySelector("label[for='image-type-list']");
                    if (lbl) lbl.click();
                }""")
                time.sleep(3.5)
            except Exception as e:
                print(f"  ⚠️ 이미지 첨부 스킵: {e}", flush=True)

    tag_inp = page.locator("input.tag_input").first
    if tag_inp.count() > 0:
        for t in tags[:10]:
            tag_inp.click(force=True)
            tag_inp.fill(t)
            page.keyboard.press("Enter")
            time.sleep(0.15)

    if is_notice:
        page.evaluate("""() => {
            const lbl = document.querySelector("label[for='notice']");
            if (lbl) lbl.click();
        }""")
        time.sleep(0.3)

    silence_all_dialogs(page)
    reg_btn = page.locator("button.BaseButton--skinGreen:has-text('등록'), a.BaseButton--skinGreen:has-text('등록')").first
    if reg_btn.count() > 0:
        reg_btn.scroll_into_view_if_needed()
        reg_btn.click(force=True)
        time.sleep(6.5)

    print(f"  ✅ 카페 게시글 등록 완료! URL: {page.url}", flush=True)
    return page.url, ed_len


def main():
    report = {
        "cafe_gate": "updated_to_kidsfit.co.kr",
        "cafe_posts": [],
        "blog_intro": None,
        "blog_post": None,
    }

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()

        # =====================================================================
        # STEP 1: Delete Old Cafe Articles & Publish 3 Updated Posts (kidsfit.co.kr)
        # =====================================================================
        print("🗑️ [1/3] 기존 카페 게시글(truthofmarket.com 포함본) 삭제 후 kidsfit.co.kr 본문으로 재발행 중...", flush=True)
        safe_goto(page, "https://cafe.naver.com/moneyfitlab", sleep_sec=2.5)
        old_cafe_ids = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=30', { credentials: 'include' });
            const j = await r.json();
            return (j.message && j.message.result && j.message.result.articleList) ? j.message.result.articleList.map(a => a.articleId) : [];
        }""")
        print(f"  👉 삭제할 기존 카페 게시글 ID: {old_cafe_ids}", flush=True)
        for aid in old_cafe_ids:
            try:
                safe_goto(page, f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{aid}", sleep_sec=2.5)
                silence_all_dialogs(page)
                del_btn = page.locator("a.BaseButton:has-text('삭제'), button.BaseButton:has-text('삭제')").first
                if del_btn.count() > 0:
                    del_btn.click(force=True)
                    time.sleep(1.5)
                    confirm_btn = page.locator("button.BaseButton--skinGreen:has-text('확인'), button:has-text('확인')").first
                    if confirm_btn.count() > 0 and confirm_btn.is_visible():
                        confirm_btn.click(force=True)
                        time.sleep(2.0)
                    print(f"  🗑️ 기존 카페 게시글 #{aid} 삭제 완료", flush=True)
            except Exception as e:
                print(f"  ⚠️ 게시글 #{aid} 삭제 스킵: {e}", flush=True)

        # Publish Post 1: Welcome Notice (with kidsfit.co.kr)
        p1_txt = (CAFE_PACK / "1번글_카페대문_전체환영공지글" / "01_카페대문_전체환영공지글_본문.txt").read_text(encoding="utf-8")
        p1_title, p1_body = split_title_and_body(p1_txt)
        url1, len1 = publish_cafe_post_clean(
            page,
            board_name="공지 및 키즈핏 가이드",
            title=p1_title,
            body=p1_body,
            tags=["키즈핏", "아이키성장", "예상키계산기", "영유아건강검진", "소근육발달", "몬테소리교구", "육아카페"],
            is_notice=True,
            images=[str(BRAND_DIR / "kidsfit_post1_welcome_banner.png")],
        )
        report["cafe_posts"].append({"title": p1_title, "url": url1, "body_len": len1})

        # Publish Post 2: Free Worksheet 3-Pack (with kidsfit.co.kr)
        p2_dir = CAFE_PACK / "2번글_연령별_무료워크지3종_나눔게시글"
        p2_txt = (p2_dir / "01_연령별_무료워크지3종_나눔게시글_본문.txt").read_text(encoding="utf-8")
        p2_title, p2_body = split_title_and_body(p2_txt)
        p2_imgs = [
            str(p2_dir / "01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.png"),
            str(p2_dir / "02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.png"),
            str(p2_dir / "03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.png"),
        ]
        url2, len2 = publish_cafe_post_clean(
            page,
            board_name="연령별 무료 워크지 PDF",
            title=p2_title,
            body=p2_body,
            tags=["무료워크지", "유아워크시트", "소근육발달", "선긋기프린트", "코넬노트", "키성장기록표", "키즈핏"],
            is_notice=False,
            images=p2_imgs,
        )
        report["cafe_posts"].append({"title": p2_title, "url": url2, "body_len": len2})

        # Publish Post 3: Monthly 1st Day Report Challenge (with kidsfit.co.kr)
        p3_txt = (CAFE_PACK / "3번글_매월1일_키즈핏리포트_인증챌린지_공지글" / "01_매월1일_키즈핏리포트_인증챌린지_공지글_본문.txt").read_text(encoding="utf-8")
        p3_title, p3_body = split_title_and_body(p3_txt)
        url3, len3 = publish_cafe_post_clean(
            page,
            board_name="매월 1일 리포트 인증방",
            title=p3_title,
            body=p3_body,
            tags=["키즈핏챌린지", "아이키백분위", "예상키계산기", "밤10시수면", "우리아이키성장"],
            is_notice=True,
            images=[str(BRAND_DIR / "kidsfit_post3_challenge_banner.png")],
        )
        report["cafe_posts"].append({"title": p3_title, "url": url3, "body_len": len3})

        # =====================================================================
        # STEP 2: Update Naver Blog Bio (#frmIntroduce) -> https://kidsfit.co.kr
        # =====================================================================
        print("🚀 [2/3] 네이버 블로그(expertise333) 소개글 https://kidsfit.co.kr 업데이트 중...", flush=True)
        safe_goto(page, "https://admin.blog.naver.com/AdminMain.naver?blogId=expertise333&Redirect=Basicinfo", sleep_sec=3.5)
        silence_all_dialogs(page)
        try:
            for f in page.frames:
                if "AdminUserBasic" in f.url or f.name == "papermain":
                    f.evaluate("window.confirm = () => true; window.alert = () => true;")
                    intro_loc = f.locator("#frmIntroduce")
                    if intro_loc.count() > 0:
                        intro_loc.fill(
                            "질병관리청 성장도표·영유아 건강검진(K-DST) 공식 기준에 기반해\n"
                            "우리 아이 숨은 키·성조숙증·월령별 두뇌발달·가베/몬테소리 교구·주말 나들이 가이드를 연구합니다.\n"
                            "공식 홈페이지: https://kidsfit.co.kr"
                        )
                        time.sleep(0.5)
                    silence_all_dialogs(page)
                    cfm = f.locator("input._btnConfirm").first
                    if cfm.count() > 0:
                        cfm.click(force=True)
                        time.sleep(2.5)
                    report["blog_intro"] = "updated_to_kidsfit.co.kr"
                    print("  ✅ 블로그 프로필 소개글 https://kidsfit.co.kr 반영 완료!", flush=True)
        except Exception as e:
            report["blog_intro"] = f"error: {e}"

        # =====================================================================
        # STEP 3: Delete Old Blog Post & Publish Updated Day 1 Blog Post (kidsfit.co.kr)
        # =====================================================================
        print("📝 [3/3] 네이버 블로그(expertise333) 1일차 칼럼 kidsfit.co.kr 본문으로 발행 중...", flush=True)
        safe_goto(page, "https://blog.naver.com/PostView.naver?blogId=expertise333&logNo=224450570303", sleep_sec=3.0)
        silence_all_dialogs(page)
        try:
            del_triggered = page.evaluate("""() => {
                window.confirm = () => true;
                window.alert = () => true;
                const delBtn = Array.from(document.querySelectorAll('a, button')).find(el => (el.innerText || '').trim() === '삭제' || (el.className || '').includes('_deletePost'));
                if (delBtn) { delBtn.click(); return true; }
                return false;
            }""")
            if del_triggered:
                time.sleep(2.5)
                print("  🗑️ 기존 블로그 글(224450570303) 삭제 완료", flush=True)
        except Exception as e:
            print(f"  ⚠️ 기존 블로그 글 삭제 스킵: {e}", flush=True)

        b1_title = (BLOG_PACK / "01_블로그_제목.txt").read_text(encoding="utf-8").strip()
        b1_body = (BLOG_PACK / "02_블로그_본문.txt").read_text(encoding="utf-8").strip()
        b1_tags = (BLOG_PACK / "03_블로그_해시태그.txt").read_text(encoding="utf-8").strip().split()
        b1_img = str(BLOG_PACK / "04_블로그_대표이미지_blog_day01_growth_mph.png")

        safe_goto(page, "https://blog.naver.com/PostWriteForm.naver?blogId=expertise333", sleep_sec=5.0)
        silence_all_dialogs(page)
        for sel in ["button.se-popup-button-cancel", "button.se-help-panel-close-button"]:
            try:
                btn = page.locator(sel).first
                if btn.count() > 0 and btn.is_visible():
                    btn.click(force=True)
                    time.sleep(0.5)
            except Exception:
                pass

        title_para = page.locator(".se-title-text .se-text-paragraph, .se-documentTitle .se-text-paragraph").first
        if title_para.count() > 0:
            title_para.click(force=True)
            time.sleep(0.3)
            page.keyboard.insert_text(b1_title)
            time.sleep(0.4)

        body_para = page.locator(".se-component.se-text .se-text-paragraph").first
        if body_para.count() > 0:
            body_para.click(force=True)
            time.sleep(0.3)

        if Path(b1_img).exists():
            img_btn = page.locator("button.se-image-toolbar-button").first
            if img_btn.count() > 0:
                try:
                    with page.expect_file_chooser(timeout=5000) as fc_info:
                        img_btn.click(force=True)
                    fc = fc_info.value
                    fc.set_files(b1_img)
                    time.sleep(3.5)
                except Exception:
                    pass

        body_para_last = page.locator(".se-component.se-text .se-text-paragraph").last
        if body_para_last.count() > 0:
            body_para_last.click(force=True)
            time.sleep(0.3)
        page.keyboard.press("Enter")
        type_multiline_into_se_one(page, b1_body)
        time.sleep(1.0)

        silence_all_dialogs(page)
        pub_btn = page.locator("button[class*='publish_btn']").first
        if pub_btn.count() > 0:
            pub_btn.click(force=True)
            time.sleep(1.5)
            tag_inp = page.locator("input[placeholder*='태그'], input[id*='tag']").first
            if tag_inp.count() > 0 and tag_inp.is_visible():
                for t in b1_tags[:10]:
                    tag_inp.click(force=True)
                    tag_inp.fill(t.lstrip("#"))
                    page.keyboard.press("Enter")
                    time.sleep(0.15)
            confirm_pub = page.locator("button[class*='confirm_btn']").first
            if confirm_pub.count() > 0:
                confirm_pub.click(force=True)
                time.sleep(5.5)
        report["blog_post"] = {"title": b1_title, "url": page.url}
        print(f"  ✅ 블로그 최신 글 발행 완료: {page.url}", flush=True)

        # Refresh visible tabs so the user sees the updated Cafe and Blog
        try:
            safe_goto(context.pages[0], "https://cafe.naver.com/moneyfitlab", sleep_sec=2.0)
            if len(context.pages) > 1:
                safe_goto(context.pages[1], "https://blog.naver.com/expertise333", sleep_sec=2.0)
        except Exception:
            pass

        page.close()

    out_path = LOG_DIR / "naver_domain_migration_report.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"🎉 네이버 블로그·카페 kidsfit.co.kr 업데이트 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
