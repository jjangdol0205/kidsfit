# -*- coding: utf-8 -*-
import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\키즈핏")
BLOG_PACK = ROOT / "samples" / "7_naver_blog_daily_pack" / "폴더별_글모음" / "1일차_신체성장_키백분위와숨은키7cm"


def type_multiline_into_se_one(page, body: str):
    for line in body.splitlines():
        clean = line.strip()
        if clean:
            page.keyboard.insert_text(clean)
        page.keyboard.press("Enter")
        time.sleep(0.02)


def main():
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()
        page.on("dialog", lambda d: d.accept())

        b1_title = (BLOG_PACK / "01_블로그_제목.txt").read_text(encoding="utf-8").strip()
        b1_body = (BLOG_PACK / "02_블로그_본문.txt").read_text(encoding="utf-8").strip()
        b1_tags = (BLOG_PACK / "03_블로그_해시태그.txt").read_text(encoding="utf-8").strip().split()
        b1_img = str(BLOG_PACK / "04_블로그_대표이미지_blog_day01_growth_mph.png")

        # Open PostUpdateForm for 224450570229 directly to edit in place!
        print("📝 기존 블로그 글(224450570229) 수정 화면(PostUpdateForm) 접속 중...", flush=True)
        page.goto("https://blog.naver.com/PostUpdateForm.naver?blogId=expertise333&logNo=224450570229", wait_until="domcontentloaded", timeout=25000)
        time.sleep(5.5)

        # Find target frame (either page itself or mainFrame)
        target = page
        for f in page.frames:
            if "PostUpdateForm" in f.url or "Redirect=Update" in f.url or f.name == "mainFrame":
                if f.locator(".se-component.se-text").count() > 0:
                    target = f
                    break

        # Dismiss any popups
        target.evaluate("""() => {
            document.querySelectorAll('button.se-popup-button-cancel, button.se-help-panel-close-button').forEach(b => b.click());
        }""")
        time.sleep(0.5)

        # Click inside the body editor (.se-component.se-text .se-text-paragraph), Select All in body or remove old text components and type fresh body
        body_paras = target.locator(".se-component.se-text .se-text-paragraph")
        print(f"  👉 본문 단락 수: {body_paras.count()}", flush=True)
        if body_paras.count() > 0:
            # Click first body paragraph, select all in body component or delete old text components via DOM/keyboard
            body_paras.first.click(force=True)
            time.sleep(0.3)
            # Select from first body paragraph to last body paragraph using Shift+Click!
            body_paras.last.click(modifiers=["Shift"], force=True)
            time.sleep(0.3)
            page.keyboard.press("Backspace")
            time.sleep(0.5)
            type_multiline_into_se_one(page, b1_body)
            time.sleep(1.0)

        # Click top-right publish button via JS evaluate so hidden buttons never block
        clicked_pub = target.evaluate("""() => {
            const btn = document.querySelector("button[class*='publish_btn']");
            if (btn) { btn.click(); return true; }
            return false;
        }""")
        print(f"  👉 발행 서랍 열기 클릭: {clicked_pub}", flush=True)
        time.sleep(1.8)

        # Click final confirm publish button via JS evaluate
        clicked_confirm = target.evaluate("""() => {
            const confirmBtn = document.querySelector("button[data-testid='seOnePublishBtn'], button[class*='confirm_btn']");
            if (confirmBtn) { confirmBtn.click(); return confirmBtn.className; }
            return null;
        }""")
        print(f"  👉 최종 발행 확인 클릭: {clicked_confirm}", flush=True)
        time.sleep(6.0)

        # Verify PostView 224450570229
        page.goto("https://blog.naver.com/PostView.naver?blogId=expertise333&logNo=224450570229", wait_until="domcontentloaded", timeout=25000)
        time.sleep(3.0)
        post_info = page.evaluate("""() => {
            const el = document.querySelector('.se-main-container');
            const txt = el ? el.innerText.trim() : document.body.innerText;
            return {
                len: txt.length,
                hasTruth: txt.includes('truthofmarket.com'),
                hasKidsfit: txt.includes('kidsfit.co.kr')
            };
        }""")
        print(f"✅ 수정 후 블로그 글 #224450570229 검증: {post_info}", flush=True)

        if len(context.pages) > 1:
            context.pages[1].goto("https://blog.naver.com/expertise333", wait_until="commit")
        page.close()


if __name__ == "__main__":
    main()
