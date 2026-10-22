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
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        page.goto("https://cafe.naver.com/ManageBaseInformation.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        base_text = page.locator("body").inner_text()
        base_frames = [{"name": f.name, "url": f.url} for f in page.frames]

        page.goto("https://studio.cafe.naver.com/@31805224", wait_until="domcontentloaded", timeout=30000)
        time.sleep(4)
        studio_url = page.url
        studio_text = page.locator("body").inner_text()
        studio_links = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a, button')).map(el => ({
                tag: el.tagName,
                text: el.innerText.trim().replace(/\\s+/g, ' '),
                href: el.href || ''
            })).filter(x => x.text.length > 0);
        }""")

        out = {
            "base_text": base_text[:2000],
            "base_frames": base_frames,
            "studio_url": studio_url,
            "studio_text": studio_text[:2000],
            "studio_links": studio_links[:100],
        }
        (LOG_DIR / "cafe_studio_inspect.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
        print("✅ Cafe Studio 확인 완료", flush=True)


if __name__ == "__main__":
    main()
