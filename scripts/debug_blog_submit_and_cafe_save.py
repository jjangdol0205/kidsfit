import json
import os
import time
import urllib.request
from playwright.sync_api import sync_playwright

ASSET_DIR = r"d:\사업아이템\samples\9_naver_brand_assets"
PROFILE_CLEAN = os.path.join(ASSET_DIR, "kidsfitprofile500.png")
COVER_CLEAN = os.path.join(ASSET_DIR, "kidsfitcover1080.png")
TITLE_CLEAN = os.path.join(ASSET_DIR, "kidsfittitle1080.png")
SKIN_CLEAN = os.path.join(ASSET_DIR, "kidsfitskin966.png")

NEW_BLOG_PROFILE_PATH = "/MjAyNjEwMjNfMjYx/MDAxNzkyNzAxNzU5NTkx.qw2lUs7E0NMtvfx8TCEzZ36TWU4qNgObj6Pgam6HGeog.3BjoUB6dOg377qhpzp29RPd_dGj3KRtoUrSqgEvo2lMg.PNG/kidsfitprofile500.png/kidsfitprofile500.png"
NEW_BLOG_PROFILE_SIZE = "23234"
NEW_BLOG_PROFILE_NAME = "kidsfitprofile500.png"
NEW_BLOG_MOBILE_ORIG = "/MjAyNjEwMjNfMjA3/MDAxNzkyNzAxNzY3MzEx.VpTKlE4eAo1swEWJV1-hxrg5Qmifk91UudJb3WI6K9kg.I83HZF2aeCYGda-AsE8-aOrP4CNXst5avvzhquTJ0DUg.PNG/originalImage_VERSION2.png"
NEW_BLOG_MOBILE_CROP = "/MjAyNjEwMjNfMTAy/MDAxNzkyNzAxNzY3NDYx.ZQ3aJB69w3zjSRq-PjyVPAze3n1OBKGxmWNGHBF3XREg.uJxa5QJNtNUlDtjWn8bfjfihgHO-UCQaxsfa6A-3gBEg.PNG/croppedImage_VERSION2.png"
NEW_BLOG_MOBILE_CROP_FULL = "https://mblogthumb-phinf.pstatic.net/MjAyNjEwMjNfMTAy/MDAxNzkyNzAxNzY3NDYx.ZQ3aJB69w3zjSRq-PjyVPAze3n1OBKGxmWNGHBF3XREg.uJxa5QJNtNUlDtjWn8bfjfihgHO-UCQaxsfa6A-3gBEg.PNG/croppedImage_VERSION2.png?type=s100@3x"

def main():
    report = {}

    # 1. Inspect _checkForm and _doSubmit in AdminUserBasicAll JS
    req = urllib.request.Request(
        "https://ssl.pstatic.net/t.static.blog/mylog/versioning/AdminUserBasicAll-2015855280_https.js",
        headers={"User-Agent": "Mozilla/5.0"}
    )
    js_code = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")
    idx = js_code.find("_checkForm:function")
    if idx != -1:
        report["blog_checkForm_and_doSubmit"] = js_code[idx:idx+4500]
    idx2 = js_code.find("_onDeleteMobileTitleImage")
    if idx2 != -1:
        report["blog_delete_and_set_methods"] = js_code[max(0, idx2-1500):idx2+2500]

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()
        dialogs = []
        def on_dialog(d):
            dialogs.append({"type": d.type, "message": d.message})
            try:
                d.accept()
            except Exception:
                pass
        page.on("dialog", on_dialog)

        # Capture POST requests/responses
        post_logs = []
        def on_resp(resp):
            if resp.request.method in ["POST", "PUT", "PATCH"] and ("naver.com" in resp.url):
                if "jackpotlog" in resp.url or "ntm" in resp.url or "ba.naver" in resp.url:
                    return
                try:
                    post_logs.append({
                        "url": resp.url,
                        "status": resp.status,
                        "req_post_data": (resp.request.post_data or "")[:1000],
                        "resp_body": resp.text()[:1500]
                    })
                except Exception as e:
                    post_logs.append({"url": resp.url, "status": resp.status, "err": str(e)})
        page.on("response", on_resp)

        # 2. Test Cafe Studio Save & inspect exact response of CafeBaseInfoUpdate
        try:
            page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.5)
            f_in = page.locator("input[type='file'][accept='image/*']").first
            if f_in.count() > 0:
                f_in.set_input_files(PROFILE_CLEAN)
                time.sleep(2.5)
                done_btn = page.locator("button:has-text('완료')").first
                if done_btn.count() > 0:
                    done_btn.click()
                    time.sleep(3.5)
                save_btn = page.locator("button:has-text('저장하기')").first
                if save_btn.count() > 0:
                    save_btn.click()
                    time.sleep(4.0)
        except Exception as e:
            report["cafe_studio_err"] = str(e)

        # 3. Upload Cafe Title on ManageLogoUserImageView.nhn using #pc_image_file
        try:
            page.goto("https://cafe.naver.com/ManageLogoUserImageView.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.5)
            new_logo_btn = page.locator("#newLogoBtn").first
            if new_logo_btn.count() > 0:
                pages_before = len(context.pages)
                new_logo_btn.click()
                time.sleep(3.0)
                if len(context.pages) > pages_before:
                    lpop = context.pages[-1]
                    lpop.on("dialog", on_dialog)
                    lpop.wait_for_load_state("domcontentloaded")
                    time.sleep(2.0)
                    pc_file = lpop.locator("#pc_image_file")
                    if pc_file.count() > 0:
                        pc_file.set_input_files(TITLE_CLEAN)
                        time.sleep(3.5)
                        sub_pop = lpop.locator("button.npe_btn_submit").first
                        if sub_pop.count() > 0:
                            sub_pop.click()
                            time.sleep(4.0)
                    if not lpop.is_closed():
                        try:
                            lpop.close()
                        except Exception:
                            pass
            time.sleep(2.0)
            report["cafe_logo_after_upload"] = page.evaluate("""() => ({
                logoHtml: document.getElementById('logo_img') ? document.getElementById('logo_img').innerHTML : null,
                submitCls: document.getElementById('submitBtn') ? document.getElementById('submitBtn').className : null
            })""")
            sub_btn = page.locator("#submitBtn").first
            if sub_btn.count() > 0:
                sub_btn.click()
                time.sleep(3.5)
        except Exception as e:
            report["cafe_logo_err"] = str(e)

        # 4. Inspect ManageSkin.nhn skin images and options
        try:
            page.goto("https://cafe.naver.com/ManageSkin.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.5)
            report["manage_skin_details"] = page.evaluate("""() => ({
                skins: Array.from(document.querySelectorAll('a.link_skin')).map(a => ({
                    cls: a.className,
                    text: (a.innerText || '').trim(),
                    img: a.querySelector('img') ? a.querySelector('img').src : '',
                    alt: a.querySelector('img') ? a.querySelector('img').alt : ''
                })),
                tabs: Array.from(document.querySelectorAll('ul.tab_menu a, .tab a, a[class*="Skin"]')).map(a => ({
                    text: (a.innerText || '').trim(), cls: a.className, href: a.getAttribute('href')
                }))
            })""")
        except Exception as e:
            report["manage_skin_err"] = str(e)

        report["post_logs"] = post_logs
        report["dialogs"] = dialogs
        page.close()

    with open(r"d:\사업아이템\logs\profile_and_cover_step6.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print("Saved logs/profile_and_cover_step6.json")

if __name__ == "__main__":
    main()
