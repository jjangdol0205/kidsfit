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

        # 1. Inspect Studio base-info tag chips & topic buttons
        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3.5)
        report["studio_tags_html"] = page.evaluate("""() => {
            const inp = document.querySelectorAll('input[data-slot="input"]')[3];
            if (!inp) return 'no inp 3';
            let p = inp.parentElement;
            for (let i = 0; i < 4; i++) {
                if (p && p.parentElement) p = p.parentElement;
            }
            return p ? p.innerHTML : '';
        }""")

        # 2. Inspect AdminCategoryView full functions
        page.goto("https://admin.blog.naver.com/AdminCategoryView.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2)
        report["cat_funcs"] = page.evaluate("""() => {
            return {
                createNode_new: category.createNode_new.toString(),
                getJson: category.getJson.toString(),
                save: category.save.toString(),
                oNodeConfigureKeys: typeof oNodeConfigure !== 'undefined' ? Object.keys(oNodeConfigure).map(k => ({ k, src: typeof oNodeConfigure[k] === 'function' ? oNodeConfigure[k].toString() : String(oNodeConfigure[k]) })) : [],
                treeNodesData: tree.getNodeData()
            };
        }""")

        page.close()

    out_path = LOG_DIR / "cat_full_and_tags.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print("DONE:", out_path)

if __name__ == "__main__":
    main()
