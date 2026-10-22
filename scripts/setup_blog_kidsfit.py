# -*- coding: utf-8 -*-
"""
Sets up Naver Blog (expertise333) for KidsFit Growth & Learning Studio:
1. Blog Basic Info (Title, Nickname, Intro, Subject=육아·결혼) via admin.blog.naver.com/expertise333/config/bloginfo
2. Blog Categories (4 KidsFit categories) via admin.blog.naver.com/expertise333/config/blog
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\사업아이템")
LOG_DIR = ROOT / "logs"


def main():
    dialogs = []
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        def handle_dialog(d):
            print(f"🔔 [Dialog] ({d.type}): {d.message}", flush=True)
            dialogs.append({"type": d.type, "message": d.message})
            d.accept()

        page.on("dialog", handle_dialog)

        # 1. Navigate to Blog Basic Info wrapper page
        print("🚀 [1/2] 블로그 기본 정보 설정 (admin.blog.naver.com/expertise333/config/bloginfo)...", flush=True)
        page.goto("https://admin.blog.naver.com/expertise333/config/bloginfo", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)

        basic_frame = None
        for f in page.frames:
            if "AdminUserBasic" in f.url:
                basic_frame = f
                break

        if not basic_frame:
            raise RuntimeError("AdminUserBasic frame not found")

        new_title = "키즈핏 소아성장·두뇌발달 양육 연구소"
        new_nick = "키즈핏연구소장"
        new_intro = (
            "[육아·교육] 질병관리청 성장도표 & 보건복지부 K-DST 기반 우리 아이 숨은 키 +7cm·소근육·연령별 공부법·주말 박물관 하브루타 연구소\n"
            "▶ 1분 무료 진단: truthofmarket.com\n"
            "▶ 공식 카페: cafe.naver.com/moneyfitlab"
        )

        # Fill using Playwright locator on frame and trigger events
        basic_frame.locator("#papername").fill(new_title)
        basic_frame.locator("#frmNickname").fill(new_nick)
        basic_frame.locator("#frmIntroduce").fill(new_intro)

        # Select 육아·결혼 (label-subject11 -> value 15)
        basic_frame.evaluate("""() => {
            const r = document.getElementById('label-subject11');
            if (r) {
                r.checked = true;
                r.dispatchEvent(new Event('change', { bubbles: true }));
                r.click();
            }
            const btn = document.getElementById('subject_btn');
            if (btn) btn.innerText = '육아·결혼';
        }""")
        time.sleep(1)

        # Check if profile image can be uploaded or cleared of old MoneyFit image
        og_img = ROOT / "samples" / "7_naver_blog_daily_pack" / "blog_day01_growth_mph.png"
        # Click confirm button in basic_frame
        basic_frame.locator("input._btnConfirm").click()
        time.sleep(3)

        # Check if parent page has a confirmation layer (like changeConfirmSubmitBtn or confirmSubmitBtn)
        layer_clicked = page.evaluate("""() => {
            const clicked = [];
            for (const id of ['changeConfirmSubmitBtn', 'confirmSubmitBtn', 'closeAlertLayer', 'closeAlertLayerCallBack']) {
                const el = document.getElementById(id);
                if (el && el.offsetParent !== null) {
                    el.click();
                    clicked.push(id);
                }
            }
            return clicked;
        }""")
        if layer_clicked:
            print(f"👉 상위 레이어 확인 버튼 클릭됨: {layer_clicked}", flush=True)
            time.sleep(2)

        # Also check inside basic_frame if there is any visible popup/layer or what submit function is bound to _btnConfirm
        basic_debug = basic_frame.evaluate("""() => {
            return {
                papername: (document.getElementById('papername') || {}).value,
                nickname: (document.getElementById('frmNickname') || {}).value,
                introduce: (document.getElementById('frmIntroduce') || {}).value
            };
        }""")
        print(f"👉 제출 직후 폼 값: {basic_debug}", flush=True)

        # 2. Navigate to Blog Category Management wrapper page
        print("🚀 [2/2] 블로그 카테고리 설정 (admin.blog.naver.com/expertise333/config/blog)...", flush=True)
        page.goto("https://admin.blog.naver.com/expertise333/config/blog", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)

        cat_frame = None
        for f in page.frames:
            if "AdminCategoryView" in f.url:
                cat_frame = f
                break

        if not cat_frame:
            raise RuntimeError("AdminCategoryView frame not found")

        cat_result = cat_frame.evaluate("""async () => {
            const sleep = ms => new Promise(r => setTimeout(r, ms));
            const targetCats = [
                "키즈핏 신체성장·숨은키 칼럼",
                "두뇌·소근육·연령별 공부법",
                "주말 박물관·과학관 하브루타",
                "무료 워크지 PDF & 공지"
            ];

            // 1. Select existing first category ('게시판')
            let items = Array.from(document.querySelectorAll('#tree li.tree-node:not(.first-child)'));
            if (items.length > 0) {
                const div = items[0].querySelector('div.drag-label') || items[0];
                div.click();
                await sleep(300);
                const inp = document.getElementById('category_name');
                if (inp) {
                    inp.focus();
                    inp.value = targetCats[0];
                    inp.dispatchEvent(new Event('input', { bubbles: true }));
                    inp.dispatchEvent(new Event('change', { bubbles: true }));
                    inp.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));
                    inp.blur();
                }
                const seq15 = document.getElementById('seq15');
                if (seq15) { seq15.checked = true; seq15.click(); }
                await sleep(300);
            }

            // 2. Add remaining categories using the '+' button on root node
            items = Array.from(document.querySelectorAll('#tree li.tree-node:not(.first-child)'));
            for (let i = items.length; i < targetCats.length; i++) {
                const rootDiv = document.querySelector('#tree li.first-child > div');
                if (rootDiv) rootDiv.click();
                await sleep(200);
                const addBtn = document.querySelector('#tree li.first-child button.tree-button');
                if (addBtn) addBtn.click();
                await sleep(400);

                const inp = document.getElementById('category_name');
                if (inp) {
                    inp.focus();
                    inp.value = targetCats[i];
                    inp.dispatchEvent(new Event('input', { bubbles: true }));
                    inp.dispatchEvent(new Event('change', { bubbles: true }));
                    inp.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));
                    inp.blur();
                }
                const seq15 = document.getElementById('seq15');
                if (seq15) { seq15.checked = true; seq15.click(); }
                await sleep(300);
            }

            // Set 5 posts per page
            const bl03 = document.getElementById('bl_03');
            if (bl03) { bl03.checked = true; bl03.click(); }

            // Click submit button
            const sub = document.getElementById('submit_button');
            if (sub) sub.click();

            await sleep(500);
            return Array.from(document.querySelectorAll('#tree li.tree-node')).map(li => li.innerText.trim());
        }""")
        print(f"👉 카테고리 편집 결과: {cat_result}", flush=True)
        time.sleep(3)

        # Verify by reloading blog home
        page.goto("https://admin.blog.naver.com/expertise333/config/bloginfo", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        verified_info = {}
        for f in page.frames:
            if "AdminUserBasic" in f.url:
                verified_info = f.evaluate("""() => ({
                    papername: (document.getElementById('papername') || {}).value,
                    nickname: (document.getElementById('frmNickname') || {}).value,
                    introduce: (document.getElementById('frmIntroduce') || {}).value,
                    subject: (document.getElementById('subject_btn') || {}).innerText
                })""")
        print(f"✅ 최종 검증된 블로그 기본정보: {verified_info}", flush=True)

        page.goto("https://admin.blog.naver.com/expertise333/config/blog", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        verified_cats = []
        for f in page.frames:
            if "AdminCategoryView" in f.url:
                verified_cats = f.evaluate("""() => Array.from(document.querySelectorAll('#tree li.tree-node')).map(li => li.innerText.trim())""")
        print(f"✅ 최종 검증된 블로그 카테고리: {verified_cats}", flush=True)


if __name__ == "__main__":
    main()
