# -*- coding: utf-8 -*-
"""
Inspects exact URLs, frames, and APIs for:
1. Naver Blog (expertise333) Admin & Posts
2. Naver Cafe (moneyfitlab / 31805224) Admin & Posts
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\키즈핏")
LOG_DIR = ROOT / "logs"


def main():
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        # 1. Inspect Cafe Home (https://cafe.naver.com/moneyfitlab) to find Manage link and existing articles
        print("🔍 [1] 카페(moneyfitlab) 홈 및 관리 링크 탐색...", flush=True)
        page.goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)

        cafe_anchors = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.innerText.trim(),
                href: a.href,
                cls: a.className
            })).filter(x => x.href.includes('Manage') || x.href.includes('manage') || x.href.includes('admin') || x.text.includes('관리') || x.text.includes('꾸미기') || x.href.includes('31805224'));
        }""")

        # Check all articles in cafe via Naver Cafe API
        cafe_articles = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=50', { credentials: 'include' });
            return await r.json();
        }""")

        # Check cafe menus via Naver Cafe API
        cafe_menus = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/SideMenuList?cafeId=31805224', { credentials: 'include' });
            return await r.json();
        }""")

        # 2. Inspect Blog (expertise333) Posts & Admin
        print("🔍 [2] 블로그(expertise333) 게시글 및 관리자 페이지 탐색...", flush=True)
        page.goto("https://blog.naver.com/PostList.naver?blogId=expertise333&categoryNo=0&from=postList", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)

        blog_post_list = page.evaluate("""async () => {
            try {
                const r = await fetch('https://blog.naver.com/PostTitleListAsync.naver?blogId=expertise333&viewdate=&currentPage=1&categoryNo=0&parentCategoryNo=0&countPerPage=30', { credentials: 'include' });
                const txt = await r.text();
                return txt;
            } catch (e) {
                return String(e);
            }
        }""")

        page.goto("https://admin.blog.naver.com/expertise333", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        blog_admin_frames = [{"name": f.name, "url": f.url} for f in page.frames]
        blog_admin_links = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.innerText.trim(),
                href: a.href
            }));
        }""")

        out = {
            "cafe_anchors": cafe_anchors,
            "cafe_articles": cafe_articles,
            "cafe_menus": cafe_menus,
            "blog_post_list_raw": blog_post_list[:2000],
            "blog_admin_url": page.url,
            "blog_admin_frames": blog_admin_frames,
            "blog_admin_links": blog_admin_links,
        }
        out_path = LOG_DIR / "naver_channel_details.json"
        out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅ 상세 정보 저장 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
