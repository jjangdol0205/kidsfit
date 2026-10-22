import json
import os
import time
import urllib.request
from playwright.sync_api import sync_playwright

ASSET_DIR = r"d:\사업아이템\samples\9_naver_brand_assets"
PROFILE_CLEAN = os.path.join(ASSET_DIR, "kidsfitprofile500.png")
COVER_CLEAN = os.path.join(ASSET_DIR, "kidsfitcover1080.png")
TITLE_CLEAN = os.path.join(ASSET_DIR, "kidsfittitle1080.png")

NEW_BLOG_PROFILE_PATH = "/MjAyNjEwMjNfMjYx/MDAxNzkyNzAxNzU5NTkx.qw2lUs7E0NMtvfx8TCEzZ36TWU4qNgObj6Pgam6HGeog.3BjoUB6dOg377qhpzp29RPd_dGj3KRtoUrSqgEvo2lMg.PNG/kidsfitprofile500.png/kidsfitprofile500.png"
NEW_BLOG_PROFILE_SIZE = "23234"
NEW_BLOG_PROFILE_NAME = "kidsfitprofile500.png"
NEW_BLOG_MOBILE_ORIG = "/MjAyNjEwMjNfMjA3/MDAxNzkyNzAxNzY3MzEx.VpTKlE4eAo1swEWJV1-hxrg5Qmifk91UudJb3WI6K9kg.I83HZF2aeCYGda-AsE8-aOrP4CNXst5avvzhquTJ0DUg.PNG/originalImage_VERSION2.png"
NEW_BLOG_MOBILE_CROP = "/MjAyNjEwMjNfMTAy/MDAxNzkyNzAxNzY3NDYx.ZQ3aJB69w3zjSRq-PjyVPAze3n1OBKGxmWNGHBF3XREg.uJxa5QJNtNUlDtjWn8bfjfihgHO-UCQaxsfa6A-3gBEg.PNG/croppedImage_VERSION2.png"
NEW_BLOG_MOBILE_CROP_FULL = "https://mblogthumb-phinf.pstatic.net/MjAyNjEwMjNfMTAy/MDAxNzkyNzAxNzY3NDYx.ZQ3aJB69w3zjSRq-PjyVPAze3n1OBKGxmWNGHBF3XREg.uJxa5QJNtNUlDtjWn8bfjfihgHO-UCQaxsfa6A-3gBEg.PNG/croppedImage_VERSION2.png?type=s100@3x"

def main():
    report = {}

    # Fetch ManageLogoUserImageView JS to see how Submit works
    try:
        req = urllib.request.Request(
            "https://cafe.naver.com/static/js/mycafe/manage/look/logo/ManageLogoUserImageView-0ff271daa4411f26-30309.js",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        report["cafe_logo_js"] = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")[:4000]
    except Exception as e:
        report["cafe_logo_js_err"] = str(e)

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

        # ---------------------------------------------------------
        # 1. BLOG: Load AdminMain.naver?blogId=expertise333&Redirect=Basicinfo
        # ---------------------------------------------------------
        try:
            page.goto("https://admin.blog.naver.com/AdminMain.naver?blogId=expertise333&Redirect=Basicinfo", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.5)
            f = page.frame(name="papermain")
            if f:
                f.evaluate("""(data) => {
                    if (document.cgiform) {
                        document.cgiform.img_path.value = data.profilePath;
                        document.cgiform.image.value = data.profileName;
                        document.cgiform.img_size.value = data.profileSize;
                        document.cgiform.mobileTitleImage1.value = data.mobileOrig;
                        document.cgiform.mobileTitleImage2.value = data.mobileCrop;
                    }
                    const pImg = document.getElementById('profile_161');
                    if (pImg) pImg.src = 'https://blogpfthumb-phinf.pstatic.net' + data.profilePath + '?type=s2';
                    const mImg = document.getElementById('mobile_title_image');
                    if (mImg) mImg.src = data.mobileCropFull;
                }""", {
                    "profilePath": NEW_BLOG_PROFILE_PATH,
                    "profileName": NEW_BLOG_PROFILE_NAME,
                    "profileSize": NEW_BLOG_PROFILE_SIZE,
                    "mobileOrig": NEW_BLOG_MOBILE_ORIG,
                    "mobileCrop": NEW_BLOG_MOBILE_CROP,
                    "mobileCropFull": NEW_BLOG_MOBILE_CROP_FULL,
                })
                time.sleep(1.0)
                f.locator("input._btnConfirm").first.click()
                time.sleep(4.5)
                report["blog_papermain_after_submit"] = f.evaluate("""() => ({
                    url: location.href,
                    img_path: document.cgiform ? document.cgiform.img_path.value : null,
                    mobileTitleImage1: document.cgiform ? document.cgiform.mobileTitleImage1.value : null,
                    mobileTitleImage2: document.cgiform ? document.cgiform.mobileTitleImage2.value : null
                })""")
        except Exception as e:
            report["blog_admin_main_err"] = str(e)

        # Verify Mobile Blog right away!
        try:
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto("https://m.blog.naver.com/expertise333", wait_until="networkidle", timeout=30000)
            time.sleep(3.0)
            report["verify_m_blog"] = page.evaluate("""() => ({
                imgs: Array.from(document.querySelectorAll('img')).map(im => ({src: im.src, alt: im.alt, cls: im.className})),
                bgs: Array.from(document.querySelectorAll('div, span, a, header')).filter(el => {
                    const bg = window.getComputedStyle(el).backgroundImage;
                    return bg && bg !== 'none' && bg.includes('http');
                }).map(el => ({cls: el.className, bg: window.getComputedStyle(el).backgroundImage}))
            })""")
            page.screenshot(path=r"d:\사업아이템\logs\verify_m_blog_fixed.png", full_page=False)
        except Exception as e:
            report["verify_m_blog_err"] = str(e)

        # ---------------------------------------------------------
        # 2. CAFE: Intercept fetch/XHR on studio.cafe.naver.com AND base-info-management
        # ---------------------------------------------------------
        try:
            page.set_viewport_size({"width": 1280, "height": 900})
            page.add_init_script("""
                window.__netLogs = [];
                const origFetch = window.fetch;
                window.fetch = async function(...args) {
                    const res = await origFetch.apply(this, args);
                    try {
                        const clone = res.clone();
                        const txt = await clone.text();
                        window.__netLogs.push({type: 'fetch', url: String(args[0]), req: args[1] ? args[1].body : null, status: res.status, resp: txt.slice(0, 1500)});
                    } catch(e) {}
                    return res;
                };
                const origOpen = XMLHttpRequest.prototype.open;
                const origSend = XMLHttpRequest.prototype.send;
                XMLHttpRequest.prototype.open = function(method, url) {
                    this.__url = url;
                    this.__method = method;
                    return origOpen.apply(this, arguments);
                };
                XMLHttpRequest.prototype.send = function(body) {
                    this.addEventListener('load', function() {
                        try {
                            window.__netLogs.push({type: 'xhr', method: this.__method, url: this.__url, req: String(body || '').slice(0, 1000), status: this.status, resp: String(this.responseText || '').slice(0, 1500)});
                        } catch(e) {}
                    });
                    return origSend.apply(this, arguments);
                };
            """)
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
            report["cafe_studio_net_logs"] = page.evaluate("() => window.__netLogs || []")
        except Exception as e:
            report["cafe_studio_net_err"] = str(e)

        # Also upload Title image (`TITLE_CLEAN`) to Cafe CDN and apply on ManageLogoUserImageView.nhn!
        try:
            # We can upload TITLE_CLEAN via upapi in Cafe Studio or call attachArea.newPhotoFile on ManageLogoUserImageView!
            import base64
            with open(TITLE_CLEAN, "rb") as bf:
                b64_title = "data:image/png;base64," + base64.b64encode(bf.read()).decode("ascii")
            upload_res = page.evaluate("""async (b64) => {
                const r = await fetch("https://upapi.cafe.naver.com/v1/cafes/31805224/images/cafeMobileIcon/base64", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    credentials: "include",
                    body: JSON.stringify({base64Image: b64})
                });
                return await r.json();
            }""", b64_title)
            report["title_cdn_upload"] = upload_res
            title_path = upload_res["result"]["success"][0]["path"]

            page.goto("https://cafe.naver.com/ManageLogoUserImageView.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.5)
            page.evaluate("""(p) => {
                if (typeof attachArea !== 'undefined' && attachArea.newPhotoFile) {
                    attachArea.newPhotoFile(p, p, 'kidsfittitle1080.png', 30000, 1080, 240, '', false);
                }
            }""", title_path)
            time.sleep(1.5)
            sub_btn = page.locator("#submitBtn").first
            if sub_btn.count() > 0:
                sub_btn.click()
                time.sleep(3.5)
            report["cafe_logo_applied_path"] = title_path
        except Exception as e:
            report["cafe_logo_direct_err"] = str(e)

        report["dialogs"] = dialogs
        page.close()

    with open(r"d:\사업아이템\logs\profile_and_cover_step7.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print("Saved logs/profile_and_cover_step7.json")

if __name__ == "__main__":
    main()
