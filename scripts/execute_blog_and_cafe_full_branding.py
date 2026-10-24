import json
import time
import urllib.request
from playwright.sync_api import sync_playwright

PROFILE_IMG = r"d:\키즈핏\samples\9_naver_brand_assets\kidsfit_profile_500.png"
CAFE_GATE_IMG = r"d:\키즈핏\samples\9_naver_brand_assets\kidsfit_cafe_gate_1080x520.png"
CAFE_TITLE_IMG = r"d:\키즈핏\samples\9_naver_brand_assets\kidsfit_cafe_title_1080x240.png"
BLOG_SKIN_IMG = r"d:\키즈핏\samples\9_naver_brand_assets\kidsfit_blog_skin_966x260.png"

def main():
    report = {}

    # 0. Inspect AdminUserBasicAll-2015855280_https.js around _onSetProfileImage and MOBILE_TITLE_IMAGE
    try:
        req = urllib.request.Request(
            "https://ssl.pstatic.net/t.static.blog/mylog/versioning/AdminUserBasicAll-2015855280_https.js",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        js_code = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")
        snippets = {}
        for kw in ["_onSetProfileImage", "_onDeleteMobileTitleImage", "_onAddImage", "_setMobileTitleImage", "receiveMessage"]:
            idx = js_code.find(kw)
            if idx != -1:
                snippets[kw] = js_code[max(0, idx-200):min(len(js_code), idx+1200)]
        report["blog_js_details"] = snippets
    except Exception as e:
        report["blog_js_error"] = str(e)

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

        # 1. Click 'button:has-text("홈편집")' on m.blog.naver.com/expertise333
        try:
            page.goto("https://m.blog.naver.com/expertise333", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.0)
            btn = page.locator("button:has-text('홈편집')").first
            if btn.count() > 0:
                btn.click(force=True)
                time.sleep(3.5)
            report["m_blog_after_home_edit_click"] = page.evaluate("""() => ({
                url: location.href,
                inputs: Array.from(document.querySelectorAll('input, textarea')).map(el => ({
                    tag: el.tagName, type: el.type, name: el.name, id: el.id, cls: el.className, accept: el.getAttribute('accept')
                })),
                buttonsAndLinks: Array.from(document.querySelectorAll('button, a, label')).map(el => ({
                    tag: el.tagName, text: (el.innerText || '').trim().slice(0, 60), cls: el.className, id: el.id, aria: el.getAttribute('aria-label'), href: el.getAttribute('href')
                })).filter(x => x.text || x.aria || x.cls.includes('edit') || x.cls.includes('cover') || x.cls.includes('profile') || x.cls.includes('photo') || x.cls.includes('btn')),
                bodyText: (document.body.innerText || '').slice(0, 1000)
            })""")
        except Exception as e:
            report["m_blog_home_edit_error"] = str(e)

        # 2. Also inspect AddImageView.naver for Blog Profile upload
        try:
            page.goto("https://blog.naver.com/AddImageView.naver?blogId=expertise333&isProfileThumbUpload=true", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.5)
            report["blog_add_image_view"] = page.evaluate("""() => ({
                url: location.href,
                inputs: Array.from(document.querySelectorAll('input')).map(el => ({
                    type: el.type, name: el.name, id: el.id, cls: el.className
                })),
                buttonsAndLinks: Array.from(document.querySelectorAll('button, a, img, input[type="image"], input[type="submit"], input[type="button"]')).map(el => ({
                    tag: el.tagName, text: (el.innerText || el.value || el.alt || '').trim().slice(0, 50), id: el.id, cls: el.className, onclick: el.getAttribute('onclick')
                })),
                bodyHtml: document.body.innerHTML.slice(0, 2000)
            })""")
        except Exception as e:
            report["blog_add_image_view_error"] = str(e)

        # 3. Also inspect SimplePhotoUploadForm.naver for Blog Mobile Cover upload
        try:
            page.goto("https://blog.naver.com/upload/SimplePhotoUploadForm.naver?blogId=expertise333&imageUploadType=mobileTitle#origin=https://admin.blog.naver.com&token=12345", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.5)
            report["blog_simple_photo_upload"] = page.evaluate("""() => ({
                url: location.href,
                inputs: Array.from(document.querySelectorAll('input')).map(el => ({
                    type: el.type, name: el.name, id: el.id, cls: el.className
                })),
                buttonsAndLinks: Array.from(document.querySelectorAll('button, a, img, input[type="image"], input[type="submit"], input[type="button"]')).map(el => ({
                    tag: el.tagName, text: (el.innerText || el.value || el.alt || '').trim().slice(0, 50), id: el.id, cls: el.className, onclick: el.getAttribute('onclick')
                })),
                bodyHtml: document.body.innerHTML.slice(0, 2000)
            })""")
        except Exception as e:
            report["blog_simple_photo_upload_error"] = str(e)

        # 4. Click 'button.btn_setting' ('설정') on m.cafe.naver.com/moneyfitlab
        try:
            page.goto("https://m.cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.0)
            report["m_cafe_before_setting_imgs"] = page.evaluate("""() => ({
                imgs: Array.from(document.querySelectorAll('img')).map(im => ({src: im.src, cls: im.className, alt: im.alt})),
                bgDivs: Array.from(document.querySelectorAll('div, span, a, header')).filter(el => {
                    const bg = window.getComputedStyle(el).backgroundImage;
                    return bg && bg !== 'none' && bg.includes('http');
                }).map(el => ({tag: el.tagName, cls: el.className, bg: window.getComputedStyle(el).backgroundImage.slice(0, 200)}))
            })""")
            set_btn = page.locator("button.btn_setting, button:has-text('설정')").first
            if set_btn.count() > 0:
                set_btn.click(force=True)
                time.sleep(3.5)
            report["m_cafe_after_setting_click"] = page.evaluate("""() => ({
                url: location.href,
                inputs: Array.from(document.querySelectorAll('input, textarea')).map(el => ({
                    tag: el.tagName, type: el.type, name: el.name, id: el.id, cls: el.className
                })),
                buttonsAndLinks: Array.from(document.querySelectorAll('button, a, label')).map(el => ({
                    tag: el.tagName, text: (el.innerText || '').trim().slice(0, 60), cls: el.className, id: el.id, href: el.getAttribute('href')
                })).filter(x => x.text || x.cls),
                bodyText: (document.body.innerText || '').slice(0, 1500)
            })""")
        except Exception as e:
            report["m_cafe_setting_error"] = str(e)

        # 5. In Cafe Studio, click '기존 관리도구' to see where it goes!
        try:
            page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.0)
            report["cafe_studio_current_imgs"] = page.evaluate("""() => (
                Array.from(document.querySelectorAll('img')).map(im => ({src: im.src, cls: im.className}))
            )""")
            # Check if clicking 기존 관리도구 opens a popup or navigates
            legacy_btn = page.locator("button:has-text('기존 관리도구'), a:has-text('기존 관리도구')").first
            if legacy_btn.count() > 0:
                pages_before = len(context.pages)
                legacy_btn.click(force=True)
                time.sleep(3.5)
                pages_after = len(context.pages)
                target_p = context.pages[-1] if pages_after > pages_before else page
                report["cafe_legacy_admin_tool"] = target_p.evaluate("""() => ({
                    url: location.href,
                    links: Array.from(document.querySelectorAll('a, button')).map(el => ({
                        text: (el.innerText || '').trim().slice(0, 50), href: el.getAttribute('href') || '', cls: el.className
                    })).filter(x => x.text)
                })""")
                if pages_after > pages_before:
                    target_p.close()
        except Exception as e:
            report["cafe_legacy_admin_error"] = str(e)

        report["dialogs"] = dialogs
        page.close()

    with open(r"d:\키즈핏\logs\profile_and_cover_step2.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print("Saved logs/profile_and_cover_step2.json")

if __name__ == "__main__":
    main()
