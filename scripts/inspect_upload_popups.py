# -*- coding: utf-8 -*-
"""
Inspects the exact DOM of:
1. https://cafe.naver.com/ManageBaseInformation.nhn?clubid=31805224 (Cafe profile icon)
2. https://cafe.naver.com/ManageLogoUserImageView.nhn?clubid=31805224 (Cafe top title background)
3. https://cafe.naver.com/ManageGateEditor.nhn?clubid=31805224 (Cafe gate banner)
4. https://admin.blog.naver.com/Remocon.naver?blogId=expertise333&loadType=admin&Redirect=Remocon&SelectedMenu=title (Blog title skin)
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\사업아이템")
LOG_DIR = ROOT / "logs"


def dump_page_dom(page):
    res = {"url": page.url, "frames": []}
    for f in page.frames:
        try:
            info = f.evaluate("""() => ({
                url: location.href,
                inputs: Array.from(document.querySelectorAll('input, textarea, select')).map(i => ({
                    tag: i.tagName, type: i.type || '', id: i.id || '', name: i.name || '', className: i.className || '', value: (i.value || '').slice(0, 60)
                })),
                clickables: Array.from(document.querySelectorAll('button, a, label, span[role="button"]')).map(b => ({
                    tag: b.tagName, text: (b.innerText || b.title || '').trim().slice(0, 40), id: b.id || '', className: b.className || '', onclick: b.getAttribute('onclick') || '', href: b.href || ''
                })).filter(b => b.text.length > 0 || b.id.length > 0 || b.onclick.length > 0)
            })""")
            if info["inputs"] or info["clickables"]:
                res["frames"].append(info)
        except Exception:
            pass
    return res


def main():
    report = {}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()

        urls = {
            "cafe_base_info": "https://cafe.naver.com/ManageBaseInformation.nhn?clubid=31805224",
            "cafe_title_img": "https://cafe.naver.com/ManageLogoUserImageView.nhn?clubid=31805224",
            "cafe_gate_editor": "https://cafe.naver.com/ManageGateEditor.nhn?clubid=31805224",
            "cafe_skin": "https://cafe.naver.com/ManageSkin.nhn?clubid=31805224",
            "blog_remocon_title": "https://admin.blog.naver.com/Remocon.naver?blogId=expertise333&loadType=admin&Redirect=Remocon&SelectedMenu=title",
        }
        for key, u in urls.items():
            print(f"🔍 Inspecting {key}: {u}", flush=True)
            page.goto(u, wait_until="domcontentloaded", timeout=20000)
            time.sleep(3)
            report[key] = dump_page_dom(page)

        page.close()

    out_path = LOG_DIR / "upload_popups_dom.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
