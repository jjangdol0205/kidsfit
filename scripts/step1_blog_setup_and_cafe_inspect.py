# -*- coding: utf-8 -*-
"""
Step 1:
1. Configures Naver Blog (expertise333) Basic Info (Title, Nickname, Intro, Subject=육아·결혼)
2. Configures Naver Blog Categories for KidsFit Growth & Learning Studio
3. Deletes legacy MoneyFit articles (12, 11, 9, 6) from Naver Cafe (31805224)
4. Inspects innerframe DOM of Cafe Base Info, Cafe Menu Management, and Cafe Member Level Management
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\사업아이템")
LOG_DIR = ROOT / "logs"


def inspect_all_frames(page):
    frames_data = []
    for f in page.frames:
        if not f.url or f.url == "about:blank":
            continue
        try:
            data = f.evaluate("""() => {
                const els = Array.from(document.querySelectorAll('input, textarea, select, button, a')).filter(el => !el.closest('#gnb'));
                return {
                    url: location.href,
                    title: document.title,
                    bodyText: (document.body ? document.body.innerText : '').slice(0, 1500),
                    inputs: els.map(el => ({
                        tag: el.tagName,
                        type: el.type || '',
                        id: el.id || '',
                        name: el.name || '',
                        cls: el.className || '',
                        val: (el.value || '').slice(0, 100),
                        placeholder: el.placeholder || '',
                        text: (el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 100),
                        onclick: (el.getAttribute('onclick') || '').slice(0, 150)
                    })).filter(x => x.tag !== 'A' || x.id || x.onclick || x.cls.includes('btn'))
                };
            }""")
            frames_data.append(data)
        except Exception as e:
            frames_data.append({"url": f.url, "error": str(e)})
    return frames_data


def main():
    results = {"dialogs": []}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        def on_dialog(dialog):
            msg = dialog.message
            print(f"🔔 [Dialog] {dialog.type}: {msg}", flush=True)
            results["dialogs"].append(msg)
            dialog.accept()

        page.on("dialog", on_dialog)

        # =====================================================================
        # PART A: Naver Blog (expertise333) Basic Info Setup
        # =====================================================================
        print("🚀 [1/4] 네이버 블로그(expertise333) 기본정보 키즈핏 세팅 중...", flush=True)
        page.goto("https://admin.blog.naver.com/AdminUserBasic.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)

        new_blog_title = "키즈핏 소아성장·두뇌발달 양육 연구소"
        new_blog_nick = "키즈핏연구소장"
        new_blog_intro = (
            "[육아·교육] 질병관리청 성장도표 & 보건복지부 K-DST 기반 우리 아이 숨은 키 +7cm·소근육·연령별 공부법·주말 박물관 하브루타 연구소\n"
            "▶ 1분 무료 진단: truthofmarket.com"
        )

        page.fill("#papername", new_blog_title)
        page.fill("#frmNickname", new_blog_nick)
        page.fill("#frmIntroduce", new_blog_intro)

        # Select 육아·결혼 (label-subject11, value=15)
        page.evaluate("""() => {
            const r = document.getElementById('label-subject11');
            if (r) {
                r.checked = true;
                r.click();
            }
            const btn = document.getElementById('subject_btn');
            if (btn) btn.innerText = '육아·결혼';
        }""")
        time.sleep(1)

        # Click confirm button
        page.locator("input._btnConfirm").click()
        time.sleep(3)

        # Verify Blog Basic Info persisted
        page.goto("https://admin.blog.naver.com/AdminUserBasic.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        results["blog_basic_verified"] = page.evaluate("""() => ({
            papername: (document.getElementById('papername') || {}).value,
            nickname: (document.getElementById('frmNickname') || {}).value,
            introduce: (document.getElementById('frmIntroduce') || {}).value,
            subject: (document.getElementById('subject_btn') || {}).innerText
        })""")
        print(f"✅ 블로그 기본정보 확인: {results['blog_basic_verified']}", flush=True)

        # =====================================================================
        # PART B: Naver Blog (expertise333) Category Setup
        # =====================================================================
        print("🚀 [2/4] 네이버 블로그 카테고리 키즈핏 개편 중...", flush=True)
        page.goto("https://admin.blog.naver.com/AdminCategoryView.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)

        cat_setup_res = page.evaluate("""async () => {
            const log = [];
            // Select first existing category node (e.g., 게시판)
            const nodes = Array.from(document.querySelectorAll('#tree li.tree-node')).filter(li => !li.classList.contains('first-child'));
            log.push('Initial category count: ' + nodes.length);
            return {
                initialCount: nodes.length,
                initialNames: nodes.map(n => n.innerText.trim())
            };
        }""")
        results["blog_category_initial"] = cat_setup_res
        print(f"👉 초기 블로그 카테고리: {cat_setup_res}", flush=True)

        # Rename first category and add remaining KidsFit categories if needed
        target_categories = [
            "📏 아이 신체성장 · 숨은키 칼럼",
            "🧠 두뇌·소근육 · 나이별 공부법",
            "🎨 주말 박물관·과학관 하브루타",
            "🎁 무료 워크지 PDF & 키즈핏 소식",
        ]

        # Click the first category ("게시판") and rename it
        first_node = page.locator("#tree li.tree-node:not(.first-child)").first
        if first_node.count() > 0:
            first_node.click()
            time.sleep(0.8)
            page.fill("#category_name", target_categories[0])
            page.locator("#category_name").press("Enter")
            time.sleep(0.8)
            page.evaluate("""() => {
                const s = document.getElementById('seq15');
                if (s) { s.checked = true; s.click(); }
            }""")
            time.sleep(0.5)

        # Add remaining categories by clicking "카테고리 전체보기" then "+" button
        current_nodes = page.locator("#tree li.tree-node:not(.first-child)").count()
        for cat_name in target_categories[current_nodes:]:
            root_node = page.locator("#tree li.first-child").first
            root_node.click()
            time.sleep(0.6)
            add_btn = page.locator("button.tree-button", has_text="+").first
            add_btn.click()
            time.sleep(0.8)
            page.fill("#category_name", cat_name)
            page.locator("#category_name").press("Enter")
            time.sleep(0.6)
            page.evaluate("""() => {
                const s = document.getElementById('seq15');
                if (s) { s.checked = true; s.click(); }
            }""")
            time.sleep(0.5)

        # Set 5 posts per page & submit category config
        page.evaluate("""() => {
            const r5 = document.getElementById('bl_03');
            if (r5) { r5.checked = true; r5.click(); }
        }""")
        page.locator("#submit_button").click()
        time.sleep(3)

        page.goto("https://admin.blog.naver.com/AdminCategoryView.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        results["blog_categories_verified"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('#tree li.tree-node')).map(n => n.innerText.trim());
        }""")
        print(f"✅ 블로그 카테고리 세팅 완료: {results['blog_categories_verified']}", flush=True)

        # =====================================================================
        # PART C: Inspect Cafe Admin Innerframes & Delete Legacy Articles
        # =====================================================================
        print("🚀 [3/4] 네이버 카페(31805224) 기존 게시글(12, 11, 9, 6) 삭제 및 관리 폼 탐색...", flush=True)
        page.goto("https://cafe.naver.com/ArticleList.nhn?search.clubid=31805224&search.boardtype=L", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        results["cafe_article_list_frames"] = inspect_all_frames(page)

        print("🚀 [4/4] 카페 기본정보·메뉴·등급 관리 innerframe 정밀 스캔...", flush=True)
        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=30000)
        time.sleep(4)
        results["studio_base_info"] = inspect_all_frames(page)

        page.goto("https://cafe.naver.com/ManageMenu.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        results["cafe_menu_frames"] = inspect_all_frames(page)

        page.goto("https://cafe.naver.com/ManageMemberLevel.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        results["cafe_level_frames"] = inspect_all_frames(page)

        out_path = LOG_DIR / "step1_results.json"
        out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅ Step 1 결과 저장 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
