import json
import os
import time
from playwright.sync_api import sync_playwright

ASSET_DIR = r"d:\사업아이템\samples\9_naver_brand_assets"
PROFILE_CLEAN = os.path.join(ASSET_DIR, "kidsfitprofile500.png")
COVER_CLEAN = os.path.join(ASSET_DIR, "kidsfitcover1080.png")
TITLE_CLEAN = os.path.join(ASSET_DIR, "kidsfittitle1080.png")
SKIN_CLEAN = os.path.join(ASSET_DIR, "kidsfitskin966.png")

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

        # 1. Inspect & submit AddImageView.naver (Blog Profile Image)
        try:
            page.goto("https://blog.naver.com/AddImageView.naver?blogId=expertise333&isProfileThumbUpload=true", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.0)
            report["add_image_view_scripts"] = page.evaluate("""() => Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerText)""")
            # Override window.close and opener so the page doesn't close or throw error when calling opener.setValueImg!
            page.add_init_script("""
                window.__capturedCalls = [];
                window.close = function() { window.__capturedCalls.push({fn: 'window.close'}); };
                window.opener = {
                    setValueImg: function() { window.__capturedCalls.push({fn: 'setValueImg', args: Array.from(arguments)}); },
                    setMobileTitleImagePath: function() { window.__capturedCalls.push({fn: 'setMobileTitleImagePath', args: Array.from(arguments)}); },
                    postMessage: function(msg, target) { window.__capturedCalls.push({fn: 'postMessage', msg: msg, target: target}); }
                };
            """)
            page.locator("input[name='file1']").set_input_files(PROFILE_CLEAN)
            time.sleep(1.5)
            page.evaluate("goSubmit()")
            time.sleep(4.0)
            report["add_image_view_after"] = page.evaluate("""() => ({
                url: location.href,
                capturedCalls: window.__capturedCalls || [],
                scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerText),
                html: document.body ? document.body.innerHTML.slice(0, 2000) : ''
            })""")
        except Exception as e:
            report["add_image_view_error"] = str(e)

        # 2. Inspect & submit SimplePhotoUploadForm.naver (Blog Mobile Cover Image)
        try:
            page.goto("https://blog.naver.com/upload/SimplePhotoUploadForm.naver?blogId=expertise333&imageUploadType=mobileTitle#origin=https://admin.blog.naver.com&token=12345", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.0)
            report["simple_photo_scripts"] = page.evaluate("""() => Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerText)""")
            page.locator("input[name='image']").set_input_files(COVER_CLEAN)
            time.sleep(1.5)
            page.evaluate("goSubmit()")
            time.sleep(4.5)
            report["simple_photo_after_step1"] = page.evaluate("""() => ({
                url: location.href,
                capturedCalls: window.__capturedCalls || [],
                scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerText),
                html: document.body ? document.body.innerHTML.slice(0, 2500) : '',
                buttons: Array.from(document.querySelectorAll('button, a, img, input')).map(el => ({
                    tag: el.tagName, id: el.id, cls: el.className, text: (el.innerText || el.value || el.alt || '').trim().slice(0, 50), onclick: el.getAttribute('onclick')
                }))
            })""")
        except Exception as e:
            report["simple_photo_error"] = str(e)

        # 3. Inspect Cafe Studio Icon Upload with network response capture
        try:
            net_responses = []
            def on_resp(resp):
                if "cafe" in resp.url or "upphoto" in resp.url or "pstatic" in resp.url:
                    if resp.request.method in ["POST", "PUT", "PATCH"]:
                        try:
                            net_responses.append({"url": resp.url, "status": resp.status, "body": resp.text()[:500]})
                        except Exception:
                            net_responses.append({"url": resp.url, "status": resp.status})
            page.on("response", on_resp)
            page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.5)
            f_in = page.locator("input[type='file'][accept='image/*']").first
            if f_in.count() > 0:
                f_in.set_input_files(PROFILE_CLEAN)
                time.sleep(2.5)
                report["cafe_studio_modal_html"] = page.evaluate("""() => {
                    const dialogs = document.querySelectorAll('[role="dialog"], .modal, [data-state="open"]');
                    return Array.from(dialogs).map(d => d.innerHTML.slice(0, 1500));
                }""")
                done_btn = page.locator("button:has-text('완료')").first
                if done_btn.count() > 0:
                    box = done_btn.bounding_box()
                    report["done_btn_box"] = box
                    done_btn.click()
                    time.sleep(3.0)
                save_btn = page.locator("button:has-text('저장하기')").first
                if save_btn.count() > 0:
                    save_btn.click()
                    time.sleep(3.5)
            report["cafe_studio_net_responses"] = net_responses
        except Exception as e:
            report["cafe_studio_error"] = str(e)

        # 4. Inspect Legacy Cafe Decoration pages (Skin, Logo/Title, Gate, BaseInformation)
        for name, url in [
            ("ManageBaseInformation", "https://cafe.naver.com/ManageBaseInformation.nhn?clubid=31805224"),
            ("ManageSkin", "https://cafe.naver.com/ManageSkin.nhn?clubid=31805224"),
            ("ManageLogoUserImageView", "https://cafe.naver.com/ManageLogoUserImageView.nhn?clubid=31805224"),
            ("ManageGateEditor", "https://cafe.naver.com/ManageGateEditor.nhn?clubid=31805224"),
        ]:
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                time.sleep(2.5)
                report[name] = page.evaluate("""() => ({
                    url: location.href,
                    inputs: Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
                        tag: el.tagName, type: el.type, name: el.name, id: el.id, cls: el.className, val: (el.value || '').slice(0, 80)
                    })),
                    buttonsAndLinks: Array.from(document.querySelectorAll('a, button, input[type="button"], input[type="submit"], img')).map(el => ({
                        tag: el.tagName, text: (el.innerText || el.value || el.alt || '').trim().slice(0, 50), id: el.id, cls: el.className, href: el.getAttribute('href') || '', onclick: el.getAttribute('onclick') || ''
                    })).filter(x => x.text || x.onclick || x.cls.includes('btn') || x.cls.includes('upload') || x.cls.includes('edit')),
                    bodyText: (document.body.innerText || '').slice(0, 1000)
                })""")
            except Exception as e:
                report[name + "_error"] = str(e)

        report["dialogs"] = dialogs
        page.close()

    with open(r"d:\사업아이템\logs\profile_and_cover_step4.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print("Saved logs/profile_and_cover_step4.json")

if __name__ == "__main__":
    main()
