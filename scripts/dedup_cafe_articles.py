# -*- coding: utf-8 -*-
import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

def main():
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()

        # Delete duplicate Cafe articles 14 and 15 (keeping 13, 16, 17)
        for art_id in [14, 15]:
            try:
                page.goto(f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{art_id}", wait_until="domcontentloaded", timeout=15000)
                time.sleep(2.5)
                for f in page.frames:
                    try:
                        f.evaluate("window.confirm = () => true; window.alert = () => true;")
                    except Exception:
                        pass
                for f in page.frames:
                    try:
                        btn = f.locator("a:has-text('삭제'), button:has-text('삭제')").first
                        if btn.count() > 0 and btn.is_visible():
                            btn.click()
                            break
                    except Exception:
                        pass
                time.sleep(3.5)
            except Exception as e:
                print("err:", e)

        page.goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=15000)
        time.sleep(2)
        rem = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=20', { credentials: 'include' });
            const j = await r.json();
            return (j.message && j.message.result && j.message.result.articleList) ? j.message.result.articleList.map(a => ({ id: a.articleId, subject: a.subject, menuName: a.menuName })) : [];
        }""")
        print("CAFE_ARTICLES:", rem)

        # Refresh first visible tab on Cafe
        try:
            context.pages[0].goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=15000)
        except Exception:
            pass
        page.close()

if __name__ == "__main__":
    main()
