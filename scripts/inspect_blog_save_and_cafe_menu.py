# -*- coding: utf-8 -*-
import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\키즈핏")
LOG_DIR = ROOT / "logs"


def main():
    out = {}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        # 1. Inspect Blog Basic Info inside https://admin.blog.naver.com/expertise333/config/bloginfo
        page.goto("https://admin.blog.naver.com/expertise333/config/bloginfo", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        for f in page.frames:
            if "AdminUserBasic" in f.url:
                out["blog_basic_frame_html"] = f.evaluate("""() => {
                    const form = document.querySelector('form');
                    return {
                        formAction: form ? form.action : '',
                        formName: form ? form.name : '',
                        confirmBtnOuter: (document.querySelector('._btnConfirm') || {}).outerHTML || '',
                        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerText.slice(0, 500))
                    };
                }""")

        # 2. Inspect Blog Category inside https://admin.blog.naver.com/expertise333/config/blog
        page.goto("https://admin.blog.naver.com/expertise333/config/blog", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        for f in page.frames:
            if "AdminCategoryView" in f.url:
                out["blog_cat_frame_html"] = f.evaluate("""() => {
                    return {
                        treeHtml: (document.getElementById('tree') || {}).outerHTML || '',
                        buttonsHtml: Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).map(el => el.outerHTML)
                    };
                }""")

        # 3. Inspect Cafe Menu Management directly at https://cafe.naver.com/ca-fe/admin/cafes/31805224/menu-management
        page.goto("https://cafe.naver.com/ca-fe/admin/cafes/31805224/menu-management", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        # Click on 자유게시판 in the right list
        page.evaluate("""() => {
            const items = Array.from(document.querySelectorAll('a, li, span')).filter(el => el.innerText.trim() === '자유게시판');
            if (items.length > 0) items[items.length - 1].click();
        }""")
        time.sleep(1)
        out["cafe_menu_detail"] = page.evaluate("""() => {
            return {
                html: document.body.innerHTML.slice(0, 8000),
                inputs: Array.from(document.querySelectorAll('input, select, textarea, button, a')).map(el => ({
                    tag: el.tagName,
                    type: el.type || '',
                    id: el.id || '',
                    name: el.name || '',
                    cls: el.className || '',
                    val: el.value || '',
                    text: el.innerText.trim()
                }))
            };
        }""")

        (LOG_DIR / "blog_and_cafe_menu_detail.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
        print("✅ 상세 HTML/JS 분석 완료", flush=True)


if __name__ == "__main__":
    main()
