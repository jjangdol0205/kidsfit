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

        # 1. Inspect Studio base-info inputs and tag delete buttons
        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3.5)
        report["studio_dom"] = page.evaluate("""() => {
            return {
                inputs: Array.from(document.querySelectorAll('input, textarea')).map((el, idx) => ({
                    idx,
                    tag: el.tagName,
                    type: el.type,
                    name: el.name,
                    id: el.id,
                    placeholder: el.placeholder,
                    readOnly: el.readOnly,
                    disabled: el.disabled,
                    value: el.value,
                    className: el.className
                })),
                tagAreaHtml: (() => {
                    const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === '카페 검색어');
                    return el && el.parentElement && el.parentElement.parentElement ? el.parentElement.parentElement.innerHTML.slice(0, 3000) : '';
                })()
            };
        }""")

        # 2. Check AdminUserBasic directorySeq
        page.goto("https://admin.blog.naver.com/AdminUserBasic.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2)
        report["blog_basic_check"] = page.evaluate("""() => {
            const checked = document.querySelector("input[name='directorySeq']:checked");
            return {
                papername: (document.querySelector('#papername') || {}).value,
                nickname: (document.querySelector('#frmNickname') || {}).value,
                introduce: (document.querySelector('#frmIntroduce') || {}).value,
                directorySeq: checked ? checked.value : null,
                directoryLabel: checked ? (document.querySelector(`label[for='${checked.id}']`) || {}).innerText : null
            };
        }""")

        # 3. Inspect AdminCategoryView.naver `category` object methods
        page.goto("https://admin.blog.naver.com/AdminCategoryView.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2)
        report["blog_category_obj"] = page.evaluate("""() => {
            if (typeof category === 'undefined') return null;
            const keys = [];
            for (let k in category) {
                keys.push({
                    key: k,
                    type: typeof category[k],
                    src: typeof category[k] === 'function' ? category[k].toString().slice(0, 600) : String(category[k]).slice(0, 200)
                });
            }
            return keys;
        }""")

        page.close()

    out_path = LOG_DIR / "studio_and_category_obj.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print("DONE:", out_path)

if __name__ == "__main__":
    main()
