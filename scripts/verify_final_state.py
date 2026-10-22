# -*- coding: utf-8 -*-
import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\사업아이템")
LOG_DIR = ROOT / "logs"

def main():
    report = {}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()

        # 1. Check Cafe articles via API
        page.goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2.5)
        report["cafe_articles"] = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=20', { credentials: 'include' });
            const j = await r.json();
            return (j.message && j.message.result && j.message.result.articleList) ? j.message.result.articleList.map(a => ({ id: a.articleId, subject: a.subject, menuName: a.menuName })) : [];
        }""")

        # 2. Check Blog posts on blog.naver.com/expertise333
        page.goto("https://blog.naver.com/PostList.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        report["blog_info"] = page.evaluate("""() => {
            return {
                title: document.title,
                bodySnippet: document.body.innerText.slice(0, 1200)
            };
        }""")

        # 3. Set visible tabs to Cafe and Blog
        pages = [pg for pg in context.pages if pg != page]
        if len(pages) >= 1:
            try:
                pages[0].goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=15000)
            except Exception:
                pass
        if len(pages) >= 2:
            try:
                pages[1].goto("https://blog.naver.com/expertise333", wait_until="domcontentloaded", timeout=15000)
            except Exception:
                pass
        else:
            b_tab = context.new_page()
            try:
                b_tab.goto("https://blog.naver.com/expertise333", wait_until="domcontentloaded", timeout=15000)
            except Exception:
                pass

        page.close()

    out_path = LOG_DIR / "final_verification_report.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
