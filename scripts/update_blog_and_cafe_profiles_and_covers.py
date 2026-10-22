import json
import os
import time
import urllib.request
from playwright.sync_api import sync_playwright

PROFILE_IMG = r"d:\사업아이템\samples\9_naver_brand_assets\kidsfit_profile_500.png"
CAFE_GATE_IMG = r"d:\사업아이템\samples\9_naver_brand_assets\kidsfit_cafe_gate_1080x520.png"
CAFE_TITLE_IMG = r"d:\사업아이템\samples\9_naver_brand_assets\kidsfit_cafe_title_1080x240.png"
BLOG_SKIN_IMG = r"d:\사업아이템\samples\9_naver_brand_assets\kidsfit_blog_skin_966x260.png"

def main():
    report = {}
    
    # 0. Fetch AdminUserBasicAll JS to see exact blog profile/mobile cover upload mechanism
    try:
        req = urllib.request.Request(
            "https://ssl.pstatic.net/t.static.blog/mylog/versioning/AdminUserBasicAll-2015855280_https.js",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        js_code = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")
        # Find functions related to profile and mobileTitle
        snippets = []
        for kw in ["_btnProfileImageUpload", "_btnMobileTitleImageUpload", "SimplePhotoUploadForm", "mobileTitleImage1", "img_path"]:
            idx = js_code.find(kw)
            if idx != -1:
                snippets.append({kw: js_code[max(0, idx-300):min(len(js_code), idx+800)]})
        report["admin_user_basic_js_snippets"] = snippets
    except Exception as e:
        report["admin_user_basic_js_error"] = str(e)

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

        # 1. Inspect m.blog.naver.com/expertise333 -> click '홈편집'
        try:
            page.goto("https://m.blog.naver.com/expertise333", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.5)
            edit_btn = page.locator("a:has-text('홈편집')").first
            if edit_btn.count() > 0:
                edit_btn.click(force=True)
                time.sleep(3.0)
            report["m_blog_home_edit"] = page.evaluate("""() => ({
                url: location.href,
                inputs: Array.from(document.querySelectorAll('input, textarea')).map(el => ({
                    tag: el.tagName, type: el.type, name: el.name, id: el.id, cls: el.className, val: (el.value || '').slice(0, 80)
                })),
                buttons: Array.from(document.querySelectorAll('button, a, label')).map(el => ({
                    tag: el.tagName, text: (el.innerText || '').trim().slice(0, 50), cls: el.className, id: el.id, forAttr: el.getAttribute('for')
                })).filter(b => b.text || b.cls.includes('edit') || b.cls.includes('cover') || b.cls.includes('profile') || b.cls.includes('img') || b.cls.includes('photo')),
                bodyText: (document.body.innerText || '').slice(0, 1000)
            })""")
        except Exception as e:
            report["m_blog_home_edit_error"] = str(e)

        # 2. Upload Cafe Icon via Cafe Studio base-info AND via base-info-management popup
        try:
            page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.5)
            file_in = page.locator("input[type='file'][accept='image/*']").first
            if file_in.count() > 0:
                file_in.set_input_files(PROFILE_IMG)
                time.sleep(3.0)
                report["cafe_studio_after_file_select"] = page.evaluate("""() => ({
                    buttons: Array.from(document.querySelectorAll('button, a')).map(el => ({
                        text: (el.innerText || '').trim().slice(0, 40), cls: el.className, aria: el.getAttribute('aria-label')
                    })).filter(b => b.text || b.aria),
                    imgs: Array.from(document.querySelectorAll('img')).map(im => ({src: im.src, cls: im.className}))
                })""")
                # Check if there is a modal confirm button like 확인 / 적용 / 등록 before 저장하기
                for btn_txt in ["적용", "확인", "등록", "완료"]:
                    b = page.locator(f"button:has-text('{btn_txt}')")
                    if b.count() > 0:
                        for i in range(b.count()):
                            if b.nth(i).is_visible():
                                b.nth(i).click(force=True)
                                time.sleep(1.5)
                save_btn = page.locator("button:has-text('저장하기')").first
                if save_btn.count() > 0:
                    save_btn.click(force=True)
                    time.sleep(3.0)
        except Exception as e:
            report["cafe_studio_upload_error"] = str(e)

        # Also test base-info-management popup with #au_register
        try:
            page.goto("https://cafe.naver.com/ca-fe/cafes/31805224/manage/base-info-management", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.5)
            edit_btn = page.locator("a.btn_edit").first
            if edit_btn.count() > 0:
                with context.expect_page(timeout=10000) as pop_info:
                    edit_btn.click(force=True)
                pop = pop_info.value
                pop.wait_for_load_state("domcontentloaded")
                time.sleep(2.0)
                pop.on("dialog", on_dialog)
                f_in = pop.locator("#file_name_1")
                if f_in.count() > 0:
                    f_in.set_input_files(PROFILE_IMG)
                    time.sleep(3.5)
                    # Click #au_register
                    reg_btn = pop.locator("#au_register")
                    if reg_btn.count() > 0:
                        reg_btn.click(force=True)
                        time.sleep(3.0)
                if not pop.is_closed():
                    try:
                        pop.close()
                    except Exception:
                        pass
            time.sleep(2.0)
            report["cafe_base_info_img_after_popup"] = page.evaluate("""() => ({
                imgs: Array.from(document.querySelectorAll('img')).map(im => ({src: im.src, id: im.id, cls: im.className})),
                hiddenInputs: Array.from(document.querySelectorAll('input[type="hidden"]')).map(el => ({name: el.name, id: el.id, val: el.value}))
            })""")
            save_legacy = page.locator("a.btn_type_ny2").first
            if save_legacy.count() > 0:
                save_legacy.click(force=True)
                time.sleep(3.0)
        except Exception as e:
            report["cafe_legacy_upload_error"] = str(e)

        # 3. Inspect m.cafe.naver.com/moneyfitlab -> click '설정'
        try:
            page.goto("https://m.cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.5)
            set_btn = page.locator("a:has-text('설정')").first
            if set_btn.count() > 0:
                set_btn.click(force=True)
                time.sleep(3.0)
            report["m_cafe_settings"] = page.evaluate("""() => ({
                url: location.href,
                inputs: Array.from(document.querySelectorAll('input, textarea')).map(el => ({
                    tag: el.tagName, type: el.type, name: el.name, id: el.id, cls: el.className, val: (el.value || '').slice(0, 80)
                })),
                linksAndBtns: Array.from(document.querySelectorAll('a, button, label')).map(el => ({
                    tag: el.tagName, text: (el.innerText || '').trim().slice(0, 60), href: el.getAttribute('href') || '', cls: el.className, id: el.id
                })).filter(x => x.text || x.cls),
                bodyText: (document.body.innerText || '').slice(0, 1200)
            })""")
        except Exception as e:
            report["m_cafe_settings_error"] = str(e)

        # 4. Inspect PC Cafe Legacy ManageMain (`https://cafe.naver.com/ManageMain.nhn?clubid=31805224`)
        try:
            page.goto("https://cafe.naver.com/ManageMain.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.0)
            report["pc_cafe_manage_main"] = page.evaluate("""() => ({
                url: location.href,
                links: Array.from(document.querySelectorAll('a')).map(a => ({
                    text: (a.innerText || '').trim().slice(0, 50), href: a.getAttribute('href') || '', cls: a.className
                })).filter(a => a.text)
            })""")
        except Exception as e:
            report["pc_cafe_manage_main_error"] = str(e)

        report["dialogs"] = dialogs
        page.close()

    with open(r"d:\사업아이템\logs\profile_and_cover_step1.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print("Saved logs/profile_and_cover_step1.json")

if __name__ == "__main__":
    main()
