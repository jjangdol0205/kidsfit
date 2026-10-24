import json
import os
import shutil
import time
from playwright.sync_api import sync_playwright

ASSET_DIR = r"d:\키즈핏\samples\9_naver_brand_assets"
PROFILE_CLEAN = os.path.join(ASSET_DIR, "kidsfitprofile500.png")
COVER_CLEAN = os.path.join(ASSET_DIR, "kidsfitcover1080.png")
TITLE_CLEAN = os.path.join(ASSET_DIR, "kidsfittitle1080.png")
SKIN_CLEAN = os.path.join(ASSET_DIR, "kidsfitskin966.png")

shutil.copyfile(os.path.join(ASSET_DIR, "kidsfit_profile_500.png"), PROFILE_CLEAN)
shutil.copyfile(os.path.join(ASSET_DIR, "kidsfit_cafe_gate_1080x520.png"), COVER_CLEAN)
shutil.copyfile(os.path.join(ASSET_DIR, "kidsfit_cafe_title_1080x240.png"), TITLE_CLEAN)
shutil.copyfile(os.path.join(ASSET_DIR, "kidsfit_blog_skin_966x260.png"), SKIN_CLEAN)

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
        # PART 1: Naver Blog Profile Image & Mobile Cover Image
        # ---------------------------------------------------------
        try:
            page.goto("https://admin.blog.naver.com/AdminUserBasic.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.0)
            report["blog_before"] = page.evaluate("""() => ({
                img_path: document.cgiform ? document.cgiform.img_path.value : null,
                image: document.cgiform ? document.cgiform.image.value : null,
                img_size: document.cgiform ? document.cgiform.img_size.value : null,
                mobileTitleImage1: document.cgiform ? document.cgiform.mobileTitleImage1.value : null,
                mobileTitleImage2: document.cgiform ? document.cgiform.mobileTitleImage2.value : null,
                profileSrc: document.getElementById('profile_161') ? document.getElementById('profile_161').src : null,
                mobileSrc: document.getElementById('mobile_title_image') ? document.getElementById('mobile_title_image').src : null
            })""")

            # 1A. Click a._btnProfileImageUpload to open AddImageView popup
            pages_before = len(context.pages)
            page.evaluate("document.querySelector('a._btnProfileImageUpload').click()")
            time.sleep(3.0)
            if len(context.pages) > pages_before:
                pop = context.pages[-1]
                pop.on("dialog", on_dialog)
                pop.wait_for_load_state("domcontentloaded")
                time.sleep(1.5)
                report["profile_popup_url"] = pop.url
                report["profile_popup_scripts"] = pop.evaluate("""() => Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerText.slice(0, 1500))""")
                f_in = pop.locator("input[name='file1']")
                if f_in.count() > 0:
                    f_in.set_input_files(PROFILE_CLEAN)
                    time.sleep(1.5)
                    pop.evaluate("goSubmit()")
                    time.sleep(4.0)
                if not pop.is_closed():
                    report["profile_popup_after_submit"] = {
                        "url": pop.url,
                        "html": pop.evaluate("() => document.body ? document.body.innerHTML.slice(0, 1500) : ''")
                    }
                    try:
                        pop.close()
                    except Exception:
                        pass

            # 1B. Click a._btnMobileTitleImageUpload to open SimplePhotoUploadForm popup
            pages_before = len(context.pages)
            page.evaluate("document.querySelector('a._btnMobileTitleImageUpload').click()")
            time.sleep(3.0)
            if len(context.pages) > pages_before:
                pop2 = context.pages[-1]
                pop2.on("dialog", on_dialog)
                pop2.wait_for_load_state("domcontentloaded")
                time.sleep(1.5)
                report["mobile_cover_popup_url"] = pop2.url
                report["mobile_cover_popup_scripts"] = pop2.evaluate("""() => Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerText.slice(0, 1500))""")
                f_in2 = pop2.locator("input[name='image']")
                if f_in2.count() > 0:
                    f_in2.set_input_files(COVER_CLEAN)
                    time.sleep(1.5)
                    pop2.evaluate("goSubmit()")
                    time.sleep(4.5)
                if not pop2.is_closed():
                    report["mobile_cover_popup_after_submit"] = {
                        "url": pop2.url,
                        "html": pop2.evaluate("() => document.body ? document.body.innerHTML.slice(0, 2000) : ''"),
                        "buttons": pop2.evaluate("""() => Array.from(document.querySelectorAll('button, a, img, input')).map(el => ({
                            tag: el.tagName, id: el.id, cls: el.className, text: (el.innerText || el.value || el.alt || '').trim().slice(0, 50), onclick: el.getAttribute('onclick')
                        }))""")
                    }
                    # If there's a crop confirm button in pop2, click it!
                    for sel in ["#submitBtn", "#sbtn", "button:has-text('확인')", "a:has-text('확인')", "button:has-text('등록')", "img[alt='확인']", "img[alt='등록']"]:
                        loc = pop2.locator(sel)
                        if loc.count() > 0:
                            try:
                                loc.first.click(force=True)
                                time.sleep(3.0)
                                break
                            except Exception:
                                pass
                    if not pop2.is_closed():
                        try:
                            pop2.close()
                        except Exception:
                            pass

            time.sleep(2.0)
            report["blog_after_popups"] = page.evaluate("""() => ({
                img_path: document.cgiform ? document.cgiform.img_path.value : null,
                image: document.cgiform ? document.cgiform.image.value : null,
                img_size: document.cgiform ? document.cgiform.img_size.value : null,
                mobileTitleImage1: document.cgiform ? document.cgiform.mobileTitleImage1.value : null,
                mobileTitleImage2: document.cgiform ? document.cgiform.mobileTitleImage2.value : null,
                profileSrc: document.getElementById('profile_161') ? document.getElementById('profile_161').src : null,
                mobileSrc: document.getElementById('mobile_title_image') ? document.getElementById('mobile_title_image').src : null
            })""")

            # Click confirm button on AdminUserBasic.naver
            confirm_btn = page.locator("input._btnConfirm").first
            if confirm_btn.count() > 0:
                confirm_btn.click(force=True)
                time.sleep(3.5)
        except Exception as e:
            report["blog_part_error"] = str(e)

        # ---------------------------------------------------------
        # PART 2: Naver Cafe Studio Profile Icon Upload
        # ---------------------------------------------------------
        try:
            page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.5)
            file_in = page.locator("input[type='file'][accept='image/*']").first
            if file_in.count() > 0:
                file_in.set_input_files(PROFILE_CLEAN)
                time.sleep(2.5)
                # Click '완료' button in the crop dialog
                done_btn = page.locator("button:has-text('완료')").first
                if done_btn.count() > 0:
                    done_btn.click(force=True)
                    time.sleep(3.0)
                report["cafe_studio_imgs_after_done"] = page.evaluate("""() => (
                    Array.from(document.querySelectorAll('img')).map(im => ({src: im.src.slice(0, 150), cls: im.className}))
                )""")
                save_btn = page.locator("button:has-text('저장하기')").first
                if save_btn.count() > 0:
                    save_btn.click(force=True)
                    time.sleep(4.0)
                report["cafe_studio_imgs_after_save"] = page.evaluate("""() => (
                    Array.from(document.querySelectorAll('img')).map(im => ({src: im.src.slice(0, 150), cls: im.className}))
                )""")
        except Exception as e:
            report["cafe_studio_error"] = str(e)

        # ---------------------------------------------------------
        # PART 3: Naver Cafe Legacy Admin (`ManageHome.nhn?clubid=31805224`)
        # ---------------------------------------------------------
        try:
            page.goto("https://cafe.naver.com/ManageHome.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.5)
            report["cafe_manage_home"] = page.evaluate("""() => ({
                url: location.href,
                frames: Array.from(document.querySelectorAll('iframe, frame')).map(f => ({name: f.name, id: f.id, src: f.src})),
                links: Array.from(document.querySelectorAll('a, button')).map(a => ({
                    text: (a.innerText || '').trim().slice(0, 50), href: a.getAttribute('href') || '', cls: a.className, id: a.id
                })).filter(a => a.text)
            })""")
        except Exception as e:
            report["cafe_manage_home_error"] = str(e)

        report["dialogs"] = dialogs
        page.close()

    with open(r"d:\키즈핏\logs\profile_and_cover_step3.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print("Saved logs/profile_and_cover_step3.json")

if __name__ == "__main__":
    main()
