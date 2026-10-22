# -*- coding: utf-8 -*-
"""
Inspects the exact DOM forms & frames for:
1. Blog (expertise333) posts, bloginfo form, and category config form
2. Cafe (31805224) ManageHome links, ManageBaseInformation form, Menu management, and Member Level management
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\사업아이템")
LOG_DIR = ROOT / "logs"


def inspect_frame_inputs(frame):
    return frame.evaluate("""() => {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select, button, a.btn, a[onclick]')).map(el => ({
            tag: el.tagName,
            type: el.type || '',
            id: el.id || '',
            name: el.name || '',
            cls: el.className || '',
            val: (el.value || '').slice(0, 100),
            text: (el.innerText || '').trim().slice(0, 100),
            onclick: el.getAttribute('onclick') || '',
            href: el.getAttribute('href') || ''
        }));
        return {
            url: location.href,
            title: document.title,
            inputs: inputs.slice(0, 150)
        };
    }""")


def main():
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        report = {}

        # 1. Check Blog Posts via mobile blog view (much cleaner JSON/DOM!)
        print("🔍 [1/5] 모바일 블로그(m.blog.naver.com/expertise333)에서 전체 글 목록 확인...", flush=True)
        page.goto("https://m.blog.naver.com/expertise333?tab=1", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        blog_posts = page.evaluate("""async () => {
            try {
                const r = await fetch('https://m.blog.naver.com/api/blogs/expertise333/post-list?categoryNo=0&itemCount=50&page=1', {
                    headers: { 'Referer': 'https://m.blog.naver.com/expertise333?tab=1' },
                    credentials: 'include'
                });
                return await r.json();
            } catch (e) {
                return { error: String(e) };
            }
        }""")
        report["blog_posts_api"] = blog_posts

        # 2. Check Blog Basic Info Admin
        print("🔍 [2/5] 블로그 기본 정보 설정 화면 확인...", flush=True)
        page.goto("https://admin.blog.naver.com/expertise333/config/bloginfo", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        report["blog_info_frames"] = []
        for f in page.frames:
            if f.url and f.url != "about:blank":
                try:
                    report["blog_info_frames"].append(inspect_frame_inputs(f))
                except Exception as e:
                    report["blog_info_frames"].append({"url": f.url, "error": str(e)})

        # 3. Check Blog Category Config Admin
        print("🔍 [3/5] 블로그 카테고리(메뉴) 설정 화면 확인...", flush=True)
        page.goto("https://admin.blog.naver.com/expertise333/config/blog", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        report["blog_category_frames"] = []
        for f in page.frames:
            if f.url and f.url != "about:blank":
                try:
                    report["blog_category_frames"].append(inspect_frame_inputs(f))
                except Exception as e:
                    report["blog_category_frames"].append({"url": f.url, "error": str(e)})

        # 4. Check Cafe ManageHome links
        print("🔍 [4/5] 카페 관리 홈(ManageHome.nhn?clubid=31805224) 전체 메뉴 링크 확인...", flush=True)
        page.goto("https://cafe.naver.com/ManageHome.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        report["cafe_manage_links"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.innerText.trim(),
                href: a.href
            })).filter(x => x.text.length > 0 && x.href.includes('cafe.naver.com'));
        }""")

        # 5. Check Cafe ManageBaseInformation form
        print("🔍 [5/5] 카페 기본정보 관리(ManageBaseInformation.nhn?clubid=31805224) 폼 확인...", flush=True)
        page.goto("https://cafe.naver.com/ManageBaseInformation.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        report["cafe_base_info_form"] = inspect_frame_inputs(page.main_frame)

        out_path = LOG_DIR / "admin_forms_inspection.json"
        out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅ 폼 구조 분석 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
