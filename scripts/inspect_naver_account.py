# -*- coding: utf-8 -*-
"""
Inspects the logged-in Naver account's Blog and Cafe channels via CDP port 9222.
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\사업아이템")
LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def main():
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        # 1. Discover My Blog ID via redirect from https://blog.naver.com/MyBlog.naver
        print("🔍 [1/3] 내 블로그 정보 확인 중...", flush=True)
        page.goto("https://blog.naver.com/MyBlog.naver", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        blog_url = page.url
        print(f"👉 MyBlog redirect URL: {blog_url}", flush=True)

        # Extract blogId from URL or mainFrame
        blog_id = ""
        if "blog.naver.com/" in blog_url:
            parts = blog_url.split("blog.naver.com/")[-1].split("?")[0].split("/")
            if parts and parts[0] not in ("MyBlog.naver", "PostList.naver"):
                blog_id = parts[0]

        # Check frames if needed
        for f in page.frames:
            if "blogId=" in f.url:
                for param in f.url.split("?")[-1].split("&"):
                    if param.startswith("blogId="):
                        blog_id = param.split("=")[1]
                        break

        print(f"✅ 감지된 블로그 ID: {blog_id}", flush=True)

        # Get Blog PostList info
        blog_title = page.title()
        print(f"✅ 현재 블로그 타이틀: {blog_title}", flush=True)

        # 2. Check Managed/Joined Cafes
        print("🔍 [2/3] 내 카페 목록 및 운영 카페 확인 중...", flush=True)
        page.goto("https://section.cafe.naver.com/ca-fe/home", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)

        # Try fetching cafe list from Naver Cafe web API using browser session cookies
        cafe_api_res = page.evaluate("""async () => {
            const urls = [
                'https://apis.naver.com/cafe-home-web/cafe-home/v1/my-cafes?page=1&perPage=50&sortBy=LAST_VISIT',
                'https://apis.naver.com/cafe-home-web/cafe-home/v1/cafes/joined?page=1&perPage=50',
                'https://apis.naver.com/cafe-web/cafe2/CafeMemberInfo.json?cafeId=31805224'
            ];
            const out = {};
            for (const u of urls) {
                try {
                    const r = await fetch(u, { credentials: 'include' });
                    out[u] = await r.json();
                } catch (e) {
                    out[u] = { error: String(e) };
                }
            }
            return out;
        }""")

        # Also extract any cafe links visible on section.cafe.naver.com
        cafe_links = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a[href*="cafe.naver.com"]')).map(a => ({
                text: a.innerText.trim(),
                href: a.href
            })).filter(x => x.text.length > 0);
        }""")

        # 3. Check moneyfitlab (31805224) specifically
        print("🔍 [3/3] 기존 카페(moneyfitlab / 31805224) 관리자 접근 가능 여부 확인 중...", flush=True)
        page.goto("https://cafe.naver.com/ManageGate.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        manage_url = page.url
        manage_title = page.title()
        manage_text = page.locator("body").inner_text(timeout=5000)[:500]

        summary = {
            "blog_id": blog_id,
            "blog_url": blog_url,
            "blog_title": blog_title,
            "cafe_api_res": cafe_api_res,
            "cafe_links": cafe_links[:30],
            "manage_31805224": {
                "url": manage_url,
                "title": manage_title,
                "body_preview": manage_text,
            },
        }
        out_path = LOG_DIR / "naver_account_inspection.json"
        out_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅ 계정 진단 저장 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
