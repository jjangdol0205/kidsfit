# -*- coding: utf-8 -*-
import json
import sys
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\사업아이템")
LOG_DIR = ROOT / "logs"


def cleanup_stale_cdp_tabs():
    raw = urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=5).read().decode("utf-8")
    tabs = json.loads(raw)
    pages = [t for t in tabs if t.get("type") == "page"]
    print(f"🧹 현재 열린 탭 수: {len(pages)}개", flush=True)
    # Keep the first www.naver.com tab, close all others (especially stuck alert/popup tabs)
    kept = False
    for t in pages:
        if not kept and "www.naver.com" in t.get("url", ""):
            kept = True
            continue
        try:
            urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{t['id']}", timeout=3)
        except Exception:
            pass
    time.sleep(1.0)


def safe_goto(page, url: str, sleep_sec: float = 3.0):
    try:
        page.goto("about:blank", wait_until="commit", timeout=8000)
        time.sleep(0.2)
    except Exception:
        pass
    page.goto(url, wait_until="commit", timeout=25000)
    time.sleep(sleep_sec)


def main():
    cleanup_stale_cdp_tabs()
    report = {}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()
        page.on("dialog", lambda d: d.accept())

        # 1. Inspect mobile blog (m.blog.naver.com/expertise333)
        safe_goto(page, "https://m.blog.naver.com/expertise333", sleep_sec=3.5)
        report["m_blog"] = page.evaluate("""() => {
            return {
                title: document.title,
                bodyText: document.body.innerText.slice(0, 1500),
                imgs: Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt, cls: i.className })),
                bgDivs: Array.from(document.querySelectorAll('[style*="background-image"]')).map(d => ({ cls: d.className, style: d.getAttribute('style') })),
                links: Array.from(document.querySelectorAll('a, button')).map(a => ({ text: a.innerText.trim(), href: a.href || '', cls: a.className })).filter(x => x.text)
            };
        }""")
        print("📱 Mobile Blog Title:", report["m_blog"]["title"], flush=True)
        print("📱 Mobile Blog Body:", report["m_blog"]["bodyText"][:400], flush=True)

        # 2. Inspect mobile cafe (m.cafe.naver.com/moneyfitlab)
        safe_goto(page, "https://m.cafe.naver.com/moneyfitlab", sleep_sec=3.5)
        report["m_cafe"] = page.evaluate("""() => {
            return {
                title: document.title,
                bodyText: document.body.innerText.slice(0, 1500),
                imgs: Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt, cls: i.className })),
                bgDivs: Array.from(document.querySelectorAll('[style*="background-image"]')).map(d => ({ cls: d.className, style: d.getAttribute('style') }))
            };
        }""")
        print("📱 Mobile Cafe Title:", report["m_cafe"]["title"], flush=True)
        print("📱 Mobile Cafe Body:", report["m_cafe"]["bodyText"][:400], flush=True)

        # 3. Inspect AdminUserBasic.naver directly and inspect SimplePhotoUploadForm popup
        safe_goto(page, "https://admin.blog.naver.com/AdminUserBasic.naver?blogId=expertise333", sleep_sec=3.0)
        report["blog_admin_basic"] = page.evaluate("""() => {
            const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
                tag: el.tagName, type: el.type || '', id: el.id, name: el.name, value: el.value, cls: el.className
            }));
            const imgs = Array.from(document.querySelectorAll('img')).map(i => ({ id: i.id, src: i.src, alt: i.alt }));
            return { inputs, imgs };
        }""")

        # Open blog profile upload popup and inspect its exact DOM
        try:
            with context.expect_page(timeout=5000) as pop_info:
                page.locator("a._btnProfileImageUpload").first.click()
            pop = pop_info.value
            time.sleep(2.5)
            report["blog_prof_popup"] = {
                "url": pop.url,
                "html": pop.evaluate("() => document.body.innerHTML"),
                "elements": pop.evaluate("() => Array.from(document.querySelectorAll('input, button, a, form, img')).map(e => ({tag:e.tagName, type:e.type||'', id:e.id, name:e.name||'', cls:e.className, text:(e.innerText||e.value||'').trim(), onclick:e.getAttribute('onclick')||''}))")
            }
            pop.close()
        except Exception as e:
            report["blog_prof_popup"] = {"error": str(e)}

        # Open blog mobile cover upload popup and inspect its exact DOM
        try:
            with context.expect_page(timeout=5000) as pop_info:
                page.locator("a._btnMobileTitleImageUpload").first.click()
            pop = pop_info.value
            time.sleep(2.5)
            report["blog_mob_popup"] = {
                "url": pop.url,
                "html": pop.evaluate("() => document.body.innerHTML"),
                "elements": pop.evaluate("() => Array.from(document.querySelectorAll('input, button, a, form, img')).map(e => ({tag:e.tagName, type:e.type||'', id:e.id, name:e.name||'', cls:e.className, text:(e.innerText||e.value||'').trim(), onclick:e.getAttribute('onclick')||''}))")
            }
            pop.close()
        except Exception as e:
            report["blog_mob_popup"] = {"error": str(e)}

        # 4. Inspect Cafe Studio (https://studio.cafe.naver.com/@31805224/operation/base-info) & Cafe base-info-management profile popup
        safe_goto(page, "https://cafe.naver.com/ca-fe/admin/cafes/31805224/base-info-management", sleep_sec=3.0)
        try:
            with context.expect_page(timeout=5000) as pop_info:
                page.locator("a.btn_edit").first.click()
            pop = pop_info.value
            time.sleep(2.5)
            report["cafe_prof_popup"] = {
                "url": pop.url,
                "html": pop.evaluate("() => document.body.innerHTML"),
                "elements": pop.evaluate("() => Array.from(document.querySelectorAll('input, button, a, form, img')).map(e => ({tag:e.tagName, type:e.type||'', id:e.id, name:e.name||'', cls:e.className, text:(e.innerText||e.value||'').trim(), onclick:e.getAttribute('onclick')||''}))")
            }
            pop.close()
        except Exception as e:
            report["cafe_prof_popup"] = {"error": str(e)}

        # 5. Also inspect Cafe Studio menu items (especially 꾸미기 / 대문 / 커버)
        safe_goto(page, "https://studio.cafe.naver.com/@31805224/operation/base-info", sleep_sec=3.5)
        report["cafe_studio"] = page.evaluate("""() => {
            const links = Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText.trim(), href: a.href }));
            const btns = Array.from(document.querySelectorAll('button')).map(b => ({ text: b.innerText.trim(), cls: b.className, aria: b.getAttribute('aria-label') || '' }));
            const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')).map(i => ({ id: i.id, name: i.name, accept: i.accept, cls: i.className }));
            const imgs = Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt, cls: i.className }));
            return { links, btns, fileInputs, imgs, bodyText: document.body.innerText };
        }""")

        page.close()

    out_path = LOG_DIR / "mobile_blog_and_cafe_inspection.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"🎉 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
