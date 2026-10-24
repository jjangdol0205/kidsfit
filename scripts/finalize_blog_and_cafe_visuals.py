import json
import os
import time
from playwright.sync_api import sync_playwright

ASSET_DIR = r"d:\키즈핏\samples\9_naver_brand_assets"
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
        # 1. SAVE NEW BLOG PROFILE & MOBILE COVER ON AdminUserBasic.naver
        # ---------------------------------------------------------
        try:
            page.goto("https://admin.blog.naver.com/AdminUserBasic.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.0)
            page.evaluate("""(data) => {
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
            report["blog_form_before_submit"] = page.evaluate("""() => ({
                img_path: document.cgiform.img_path.value,
                image: document.cgiform.image.value,
                img_size: document.cgiform.img_size.value,
                mobileTitleImage1: document.cgiform.mobileTitleImage1.value,
                mobileTitleImage2: document.cgiform.mobileTitleImage2.value
            })""")
            confirm_btn = page.locator("input._btnConfirm").first
            if confirm_btn.count() > 0:
                confirm_btn.click()
                time.sleep(4.0)
            # Re-verify AdminUserBasic.naver after save
            page.goto("https://admin.blog.naver.com/AdminUserBasic.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.5)
            report["blog_form_after_reload"] = page.evaluate("""() => ({
                img_path: document.cgiform ? document.cgiform.img_path.value : null,
                image: document.cgiform ? document.cgiform.image.value : null,
                img_size: document.cgiform ? document.cgiform.img_size.value : null,
                mobileTitleImage1: document.cgiform ? document.cgiform.mobileTitleImage1.value : null,
                mobileTitleImage2: document.cgiform ? document.cgiform.mobileTitleImage2.value : null
            })""")
        except Exception as e:
            report["blog_save_error"] = str(e)

        # ---------------------------------------------------------
        # 2. UPLOAD CAFE TITLE IMAGE (`ManageLogoUserImageView.nhn?clubid=31805224`)
        # ---------------------------------------------------------
        try:
            page.goto("https://cafe.naver.com/ManageLogoUserImageView.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.5)
            report["cafe_logo_scripts"] = page.evaluate("""() => Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerText.slice(0, 1500))""")
            report["cafe_logo_inputs"] = page.evaluate("""() => Array.from(document.querySelectorAll('form input')).map(el => ({name: el.name, id: el.id, type: el.type, val: el.value}))""")
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
                    report["cafe_logo_popup"] = {
                        "url": lpop.url,
                        "inputs": lpop.evaluate("""() => Array.from(document.querySelectorAll('input')).map(el => ({type: el.type, name: el.name, id: el.id}))"""),
                        "buttons": lpop.evaluate("""() => Array.from(document.querySelectorAll('a, button, img, input')).map(el => ({tag: el.tagName, id: el.id, cls: el.className, text: (el.innerText || el.alt || el.value || '').trim().slice(0, 40), onclick: el.getAttribute('onclick')}))""")
                    }
                    f_in = lpop.locator("input[type='file']").first
                    if f_in.count() > 0:
                        f_in.set_input_files(TITLE_CLEAN)
                        time.sleep(3.0)
                        report["cafe_logo_popup_after_file"] = lpop.evaluate("""() => ({
                            url: location.href,
                            buttons: Array.from(document.querySelectorAll('a, button, img, input')).map(el => ({tag: el.tagName, id: el.id, cls: el.className, text: (el.innerText || el.alt || el.value || '').trim().slice(0, 40), onclick: el.getAttribute('onclick')}))
                        })""")
                        # Try clicking register / confirm button in popup
                        for sel in ["#au_register", "#submitBtn", "#sbtn", "a:has-text('확인')", "button:has-text('확인')", "img[alt*='등록']", "img[alt*='확인']"]:
                            b = lpop.locator(sel)
                            if b.count() > 0:
                                try:
                                    b.first.click()
                                    time.sleep(3.0)
                                    break
                                except Exception:
                                    pass
                    if not lpop.is_closed():
                        try:
                            lpop.close()
                        except Exception:
                            pass
            time.sleep(2.0)
            report["cafe_logo_inputs_after_popup"] = page.evaluate("""() => Array.from(document.querySelectorAll('form input')).map(el => ({name: el.name, id: el.id, type: el.type, val: el.value}))""")
            sub_btn = page.locator("#submitBtn").first
            if sub_btn.count() > 0:
                sub_btn.click()
                time.sleep(3.0)
        except Exception as e:
            report["cafe_logo_error"] = str(e)

        # ---------------------------------------------------------
        # 3. VERIFY MOBILE BLOG & MOBILE CAFE LIVE DOM + SCREENSHOTS
        # ---------------------------------------------------------
        try:
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto("https://m.blog.naver.com/expertise333", wait_until="networkidle", timeout=30000)
            time.sleep(3.0)
            report["verify_m_blog"] = page.evaluate("""() => ({
                url: location.href,
                imgs: Array.from(document.querySelectorAll('img')).map(im => ({src: im.src, alt: im.alt, cls: im.className})),
                bgs: Array.from(document.querySelectorAll('div, span, a, header')).filter(el => {
                    const bg = window.getComputedStyle(el).backgroundImage;
                    return bg && bg !== 'none' && bg.includes('http');
                }).map(el => ({cls: el.className, bg: window.getComputedStyle(el).backgroundImage}))
            })""")
            page.screenshot(path=r"d:\키즈핏\logs\verify_m_blog.png", full_page=False)

            page.goto("https://m.cafe.naver.com/moneyfitlab", wait_until="networkidle", timeout=30000)
            time.sleep(3.0)
            report["verify_m_cafe"] = page.evaluate("""() => ({
                url: location.href,
                imgs: Array.from(document.querySelectorAll('img')).map(im => ({src: im.src, alt: im.alt, cls: im.className})),
                bgs: Array.from(document.querySelectorAll('div, span, a, header')).filter(el => {
                    const bg = window.getComputedStyle(el).backgroundImage;
                    return bg && bg !== 'none' && bg.includes('http');
                }).map(el => ({cls: el.className, bg: window.getComputedStyle(el).backgroundImage}))
            })""")
            page.screenshot(path=r"d:\키즈핏\logs\verify_m_cafe.png", full_page=False)
        except Exception as e:
            report["verify_error"] = str(e)

        report["dialogs"] = dialogs
        page.close()

    with open(r"d:\키즈핏\logs\profile_and_cover_step5.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print("Saved logs/profile_and_cover_step5.json")

if __name__ == "__main__":
    main()
