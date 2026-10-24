# -*- coding: utf-8 -*-
"""
Fast inspection of:
1. Blog Basic Info inside https://admin.blog.naver.com/expertise333/config/bloginfo (papermain frame)
2. Blog Categories inside https://admin.blog.naver.com/expertise333/config/blog (papermain frame)
3. Cafe Base Info on https://studio.cafe.naver.com/@31805224/operation/base-info
4. Cafe Menu Manage inside https://cafe.naver.com/ManageMenu.nhn?clubid=31805224 (innerframe)
5. Cafe Member Level inside https://cafe.naver.com/ManageMemberLevel.nhn?clubid=31805224 (innerframe)
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\키즈핏")
LOG_DIR = ROOT / "logs"


def dump_frame(f):
    return f.evaluate("""() => {
        const els = Array.from(document.querySelectorAll('input, textarea, select, button, a')).filter(el => !el.closest('#gnb'));
        return {
            url: location.href,
            title: document.title,
            text: (document.body ? document.body.innerText : '').slice(0, 2000),
            els: els.map(el => ({
                tag: el.tagName,
                type: el.type || '',
                id: el.id || '',
                name: el.name || '',
                cls: el.className || '',
                val: (el.value || '').slice(0, 80),
                text: (el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 80),
                onclick: (el.getAttribute('onclick') || '').slice(0, 120)
            })).filter(x => x.id || x.name || x.onclick || x.tag !== 'A' || x.cls.includes('btn') || x.cls.includes('_'))
        };
    }""")


def main():
    out = {}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        # 1. Cafe Studio Base Info
        print("🔍 [1/4] Cafe Studio 기본 정보 화면 스캔...", flush=True)
        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        out["cafe_studio_base_info"] = dump_frame(page.main_frame)

        # 2. Cafe Menu Manage innerframe
        print("🔍 [2/4] Cafe 메뉴 관리 innerframe 스캔...", flush=True)
        page.goto("https://cafe.naver.com/ManageMenu.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        out["cafe_menu_frames"] = [dump_frame(f) for f in page.frames if f.url and f.url != "about:blank" and f != page.main_frame]
        if not out["cafe_menu_frames"]:
            out["cafe_menu_main"] = dump_frame(page.main_frame)

        # 3. Cafe Member Level innerframe
        print("🔍 [3/4] Cafe 멤버 등급 관리 innerframe 스캔...", flush=True)
        page.goto("https://cafe.naver.com/ManageMemberLevel.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        out["cafe_level_frames"] = [dump_frame(f) for f in page.frames if f.url and f.url != "about:blank" and f != page.main_frame]
        if not out["cafe_level_frames"]:
            out["cafe_level_main"] = dump_frame(page.main_frame)

        # 4. Cafe Welcome Notice on Studio
        print("🔍 [4/4] Cafe 멤버 환영 관리 스캔...", flush=True)
        page.goto("https://studio.cafe.naver.com/@31805224/join/welcome/article", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        out["cafe_studio_welcome"] = dump_frame(page.main_frame)

        out_path = LOG_DIR / "innerframes_dump.json"
        out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅ 스캔 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
