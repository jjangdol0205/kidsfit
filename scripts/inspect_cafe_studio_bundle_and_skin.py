import json
import os
import time
import urllib.request
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ASSET_DIR = r"d:\사업아이템\samples\9_naver_brand_assets"
BLOG_COVER_CLEAN = os.path.join(ASSET_DIR, "kidsfitblogcover1080.png")
NEW_BLOG_PROFILE_PATH = "/MjAyNjEwMjNfMjYx/MDAxNzkyNzAxNzU5NTkx.qw2lUs7E0NMtvfx8TCEzZ36TWU4qNgObj6Pgam6HGeog.3BjoUB6dOg377qhpzp29RPd_dGj3KRtoUrSqgEvo2lMg.PNG/kidsfitprofile500.png/kidsfitprofile500.png"
NEW_BLOG_PROFILE_SIZE = "23234"
NEW_BLOG_PROFILE_NAME = "kidsfitprofile500.png"

def create_clean_blog_mobile_cover():
    # Create a 1080x1080 clean, text-free premium clinic/Toss-style background for m.blog.naver.com
    # Naver mobile blog overlays white text + profile icon over the center/bottom of the cover,
    # so a rich royal-indigo to deep-violet gradient with soft decorative growth curves & stars makes white text 100% legible!
    W, H = 1080, 1080
    img = Image.new("RGB", (W, H), (30, 27, 75))
    draw = ImageDraw.Draw(img, "RGBA")
    for y in range(H):
        t = y / H
        r = int(35 * (1 - t) + 67 * t)
        g = int(32 * (1 - t) + 56 * t)
        b = int(85 * (1 - t) + 202 * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Subtle glowing circles & soft growth curve in upper right (no text!)
    draw.ellipse([680, -120, 1180, 380], fill=(99, 102, 241, 45))
    draw.ellipse([-150, 620, 380, 1150], fill=(16, 185, 129, 35))
    draw.ellipse([720, 580, 1120, 980], fill=(244, 114, 182, 30))

    # Smooth ascending growth curve line in upper area
    pts = [(120, 340), (320, 300), (540, 240), (760, 160), (940, 95)]
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=(52, 211, 153, 95), width=6)
    for px, py in pts:
        draw.ellipse([px-10, py-10, px+10, py+10], fill=(167, 243, 208, 160))

    img.save(BLOG_COVER_CLEAN, "PNG", optimize=True)

def main():
    create_clean_blog_mobile_cover()
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

        # 1. Upload clean blog mobile cover via SimplePhotoUploadForm.naver
        try:
            page.add_init_script("""
                window.__capturedCalls = [];
                window.close = function() {};
                window.opener = {
                    postMessage: function(msg, target) { window.__capturedCalls.push({msg: msg, target: target}); }
                };
            """)
            page.goto("https://blog.naver.com/upload/SimplePhotoUploadForm.naver?blogId=expertise333&imageUploadType=mobileTitle#origin=https://admin.blog.naver.com&token=12345", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.0)
            page.locator("input[name='image']").set_input_files(BLOG_COVER_CLEAN)
            time.sleep(1.5)
            page.evaluate("goSubmit()")
            time.sleep(4.5)
            cap = page.evaluate("() => window.__capturedCalls || []")
            report["clean_blog_cover_upload"] = cap
            if cap and len(cap) > 0:
                msg = cap[0]["msg"]
                orig_url = msg["originalImageUrl"]
                crop_url = msg["croppedImageUrl"]
                crop_full = msg["croppedImage"]

                # Save on AdminMain.naver -> papermain
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
                    }""", {
                        "profilePath": NEW_BLOG_PROFILE_PATH,
                        "profileName": NEW_BLOG_PROFILE_NAME,
                        "profileSize": NEW_BLOG_PROFILE_SIZE,
                        "mobileOrig": orig_url,
                        "mobileCrop": crop_url,
                    })
                    time.sleep(1.0)
                    f.locator("input._btnConfirm").first.click()
                    time.sleep(4.5)
        except Exception as e:
            report["clean_blog_cover_err"] = str(e)

        # Verify Mobile Blog screenshot with clean cover!
        try:
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto("https://m.blog.naver.com/expertise333", wait_until="networkidle", timeout=30000)
            time.sleep(3.0)
            page.screenshot(path=r"d:\사업아이템\logs\verify_m_blog_clean.png", full_page=False)
        except Exception as e:
            report["verify_m_blog_clean_err"] = str(e)

        # 2. Inspect Cafe Studio JS bundle for CafeBaseInfoUpdate & cafeMobileIcon
        try:
            page.set_viewport_size({"width": 1280, "height": 900})
            page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.0)
            script_srcs = page.evaluate("""() => Array.from(document.querySelectorAll('script[src]')).map(s => s.src)""")
            report["cafe_studio_scripts"] = script_srcs
            matches = []
            for s_url in script_srcs:
                try:
                    req = urllib.request.Request(s_url, headers={"User-Agent": "Mozilla/5.0"})
                    code = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")
                    for kw in ["CafeBaseInfoUpdate", "cafeMobileIcon", "profileImageUrl", "mobileGateImageUrl", "iconImage"]:
                        idx = code.find(kw)
                        if idx != -1:
                            matches.append({"script": s_url, "kw": kw, "snippet": code[max(0, idx-400):min(len(code), idx+1000)]})
                except Exception:
                    pass
            report["cafe_studio_js_matches"] = matches
        except Exception as e:
            report["cafe_studio_js_err"] = str(e)

        # 3. Also inspect https://cafe.naver.com/ca-fe/cafes/31805224/manage/base-info-management JS bundle!
        try:
            page.goto("https://cafe.naver.com/ca-fe/cafes/31805224/manage/base-info-management", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3.0)
            script_srcs2 = page.evaluate("""() => Array.from(document.querySelectorAll('script[src]')).map(s => s.src)""")
            matches2 = []
            for s_url in script_srcs2:
                try:
                    req = urllib.request.Request(s_url, headers={"User-Agent": "Mozilla/5.0"})
                    code = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")
                    for kw in ["CafeBaseInfoUpdate", "profileImage", "mobileGate", "upphoto", "btn_edit"]:
                        idx = code.find(kw)
                        if idx != -1:
                            matches2.append({"script": s_url, "kw": kw, "snippet": code[max(0, idx-400):min(len(code), idx+1000)]})
                except Exception:
                    pass
            report["cafe_legacy_manage_js_matches"] = matches2
        except Exception as e:
            report["cafe_legacy_manage_js_err"] = str(e)

        page.close()

    with open(r"d:\사업아이템\logs\profile_and_cover_step8.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print("Saved logs/profile_and_cover_step8.json")

if __name__ == "__main__":
    main()
