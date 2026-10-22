# -*- coding: utf-8 -*-
"""
Inspects:
1. Actual body text of Cafe articles #13, #16, #17
2. Cafe Admin URLs/DOM for Cafe Profile Icon, Cafe Title Background, and Cafe Gate (대문)
3. Blog Admin URLs/DOM for Blog Profile Image and Blog Skin/Background Image
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
    report = {"articles": {}, "cafe_admin": {}, "blog_admin": {}}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()

        # 1. Inspect Cafe articles 13, 16, 17
        for aid in [13, 16, 17]:
            page.goto(f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{aid}", wait_until="domcontentloaded", timeout=20000)
            time.sleep(2.5)
            info = page.evaluate("""() => {
                const titleEl = document.querySelector('.title_text');
                const contentEl = document.querySelector('.se-main-container, .ArticleContentBox .content');
                return {
                    title: titleEl ? titleEl.innerText.trim() : '',
                    contentLen: contentEl ? contentEl.innerText.trim().length : 0,
                    contentPreview: contentEl ? contentEl.innerText.trim().slice(0, 200) : ''
                };
            }""")
            report["articles"][str(aid)] = info
            print(f"📄 Article #{aid}: len={info['contentLen']} | title={info['title'][:30]} | preview={info['contentPreview'][:80]}", flush=True)

        # 2. Inspect Cafe Admin Studio & Decoration links
        page.goto("https://cafe.naver.com/ca-fe/admin/cafes/31805224/studio/general", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        report["cafe_admin"]["studio_general"] = page.evaluate("""() => {
            return {
                inputs: Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, id: i.id, name: i.name, className: i.className, accept: i.accept })),
                buttons: Array.from(document.querySelectorAll('button, a, label')).map(b => ({ tag: b.tagName, text: b.innerText.trim(), className: b.className, href: b.href || '', htmlFor: b.htmlFor || '' })).filter(b => b.text.length > 0 && b.text.length < 40)
            };
        }""")

        # Check Cafe Admin top/sub navigation links on ManageHome or menu-management
        page.goto("https://cafe.naver.com/ManageHome.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        report["cafe_admin"]["manage_links"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText.trim(), href: a.href })).filter(a => a.text.length > 0);
        }""")

        # 3. Inspect Blog Admin (기본정보관리 & 꾸미기 설정)
        page.goto("https://admin.blog.naver.com/AdminMain.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        report["blog_admin"]["top_links"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText.trim(), href: a.href })).filter(a => a.text.length > 0);
        }""")

        for f in page.frames:
            if "BlogInfo" in f.url or "config" in f.url or f != page.main_frame:
                try:
                    report["blog_admin"][f.url] = f.evaluate("""() => ({
                        inputs: Array.from(document.querySelectorAll('input, textarea')).map(i => ({ tag: i.tagName, type: i.type, id: i.id, name: i.name, className: i.className, value: (i.value || '').slice(0, 60) })),
                        buttons: Array.from(document.querySelectorAll('button, a, label, img')).map(b => ({ tag: b.tagName, text: (b.innerText || b.alt || '').trim(), id: b.id, className: b.className, href: b.href || '' })).filter(b => b.text.length > 0 || b.id.length > 0)
                    })""")
                except Exception:
                    pass

        page.close()

    out_path = LOG_DIR / "cafe_blog_skins_inspection.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ 검수 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
