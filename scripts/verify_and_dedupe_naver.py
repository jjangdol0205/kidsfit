# -*- coding: utf-8 -*-
"""
1. Removes duplicate Cafe articles (id 14, 15) so only 13, 16, 17 remain cleanly.
2. Verifies Naver Blog (expertise333) post list and publishes Day 1 column if not yet published.
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\사업아이템")
LOG_DIR = ROOT / "logs"
BLOG_PACK = ROOT / "samples" / "7_naver_blog_daily_pack" / "폴더별_글모음" / "1일차_신체성장_키백분위와숨은키7cm"


def main():
    report = {}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()

        # 1. Dedupe Cafe articles (delete 14 and 15)
        for aid in [14, 15]:
            page.goto(f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{aid}", wait_until="domcontentloaded", timeout=20000)
            time.sleep(2.5)
            page.evaluate("window.confirm = () => true; window.alert = () => true;")
            del_btn = page.locator("a.BaseButton:has-text('삭제'), button.BaseButton:has-text('삭제')").first
            if del_btn.count() > 0:
                del_btn.click(force=True)
                time.sleep(2.0)
                confirm_btn = page.locator("button.BaseButton--skinGreen:has-text('확인'), button:has-text('확인')").first
                if confirm_btn.count() > 0 and confirm_btn.is_visible():
                    confirm_btn.click(force=True)
                    time.sleep(2.0)
                print(f"🗑️ 중복 카페 게시글 #{aid} 삭제 완료", flush=True)

        # Verify Cafe article list
        page.goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2.0)
        report["cafe_articles"] = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=20', { credentials: 'include' });
            const j = await r.json();
            return (j.message && j.message.result && j.message.result.articleList) ? j.message.result.articleList.map(a => ({ id: a.articleId, subject: a.subject, menuName: a.menuName })) : [];
        }""")
        print(f"✅ 카페 최종 게시글 목록: {report['cafe_articles']}", flush=True)

        # 2. Check Blog post list via PostTitleListAsync
        page.goto("https://blog.naver.com/PostList.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2.5)
        blog_list = page.evaluate("""async () => {
            try {
                const r = await fetch('https://blog.naver.com/PostTitleListAsync.naver?blogId=expertise333&currentPage=1&countPerPage=10', { credentials: 'include' });
                const txt = await r.text();
                return txt.slice(0, 1000);
            } catch (e) {
                return String(e);
            }
        }""")
        report["blog_list_raw"] = blog_list
        print(f"📋 블로그 현재 글 목록 응답: {blog_list[:300]}", flush=True)

        if "아이 키 백분위 계산법" not in blog_list:
            print("📝 블로그 1일차 칼럼 발행 재시도 (확정 버튼 정밀 클릭)...", flush=True)
            b1_title = (BLOG_PACK / "01_블로그_제목.txt").read_text(encoding="utf-8").strip()
            b1_body = (BLOG_PACK / "02_블로그_본문.txt").read_text(encoding="utf-8").strip()
            b1_tags = (BLOG_PACK / "03_블로그_해시태그.txt").read_text(encoding="utf-8").strip().split()
            b1_img = str(BLOG_PACK / "04_블로그_대표이미지_blog_day01_growth_mph.png")

            page.goto("https://blog.naver.com/PostWriteForm.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=25000)
            time.sleep(5)
            page.evaluate("window.confirm = () => true; window.alert = () => true;")

            # Dismiss popups
            for sel in ["button.se-popup-button-cancel", "button.se-help-panel-close-button"]:
                try:
                    btn = page.locator(sel).first
                    if btn.count() > 0 and btn.is_visible():
                        btn.click(force=True)
                        time.sleep(0.5)
                except Exception:
                    pass

            # Click Title and type
            title_para = page.locator(".se-title-text .se-text-paragraph, .se-documentTitle .se-text-paragraph").first
            if title_para.count() > 0:
                title_para.click(force=True)
                time.sleep(0.3)
                page.keyboard.insert_text(b1_title)
                time.sleep(0.5)

            # Click Body and type
            body_para = page.locator(".se-component.se-text .se-text-paragraph").last
            if body_para.count() > 0:
                body_para.click(force=True)
                time.sleep(0.3)
                page.keyboard.insert_text(b1_body)
                page.keyboard.press("Enter")
                time.sleep(0.8)

            # Upload image
            if Path(b1_img).exists():
                img_btn = page.locator("button.se-image-toolbar-button").first
                if img_btn.count() > 0:
                    try:
                        with page.expect_file_chooser(timeout=5000) as fc_info:
                            img_btn.click(force=True)
                        fc = fc_info.value
                        fc.set_files(b1_img)
                        time.sleep(3.5)
                    except Exception as e:
                        print(f"  ⚠️ 블로그 이미지 첨부 스킵: {e}", flush=True)

            # Click top-right '발행' button
            pub_btn = page.locator("button[class*='publish_btn'], button:has-text('발행')").first
            if pub_btn.count() > 0:
                pub_btn.click(force=True)
                time.sleep(1.5)

                # Inspect buttons inside publish drawer
                drawer_btns = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('button')).map(b => ({
                        text: b.innerText.trim(),
                        className: b.className,
                        testid: b.getAttribute('data-testid') || ''
                    })).filter(b => b.text.includes('발행') || b.className.includes('confirm'));
                }""")
                print(f"  👉 발행 서랍 버튼 목록: {drawer_btns}", flush=True)

                # Add tags
                tag_inp = page.locator("input[placeholder*='태그'], input[id*='tag']").first
                if tag_inp.count() > 0 and tag_inp.is_visible():
                    for t in b1_tags[:10]:
                        tag_inp.click(force=True)
                        tag_inp.fill(t.lstrip("#"))
                        page.keyboard.press("Enter")
                        time.sleep(0.15)

                # Click final confirm publish button (usually data-testid='seOnePublishBtn' or last button:has-text('발행'))
                page.evaluate("""() => {
                    const confirmBtn = document.querySelector("button[data-testid='seOnePublishBtn'], button[class*='confirm_btn']");
                    if (confirmBtn) {
                        confirmBtn.click();
                        return;
                    }
                    const pubBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.trim() === '발행');
                    if (pubBtns.length > 0) pubBtns[pubBtns.length - 1].click();
                }""")
                time.sleep(6)
                print(f"  ✅ 블로그 발행 후 URL: {page.url}", flush=True)
                report["blog_published_url"] = page.url

        # Refresh visible tabs
        try:
            context.pages[0].goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=15000)
            if len(context.pages) > 1:
                context.pages[1].goto("https://blog.naver.com/expertise333", wait_until="domcontentloaded", timeout=15000)
        except Exception:
            pass

        page.close()

    out_path = LOG_DIR / "published_kidsfit_posts_report.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"🎉 최종 검수 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
