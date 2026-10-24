import json
import os
import time
import urllib.request
from playwright.sync_api import sync_playwright

CAFE_ICON_PATH = "/MjAyNjEwMjNfMTI1/MDAxNzkyNzAyMjkzMDYw.NS_uuWpGPownSZTemOLnm89yzXAuMWRE6orefY_qkikg.pKX6atv7fyo1Ld5OoV3zKIkmHKARaZ-rzlDu5dSJYvsg.PNG/kidsfitprofile500.png"
CAFE_ICON_FULL = "https://cafeptthumb-phinf.pstatic.net" + CAFE_ICON_PATH

def main():
    report = {}

    # 1. Fetch Cafe Studio base-info.BMJmFXMN.js and profileImageUrl.DTsHIItn.js
    for name, url in [
        ("base_info_js", "https://cafe-studio.pstatic.net/static/v1.3.5/base-info.BMJmFXMN.js"),
        ("profile_img_js", "https://cafe-studio.pstatic.net/static/v1.3.5/profileImageUrl.DTsHIItn.js"),
    ]:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            code = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")
            report[name] = code[:6000]
        except Exception as e:
            report[name + "_err"] = str(e)

    # Also check app.8e0ef0e0.js around ou=function and gateImage / mobileGate
    try:
        req = urllib.request.Request("https://ca-fe.pstatic.net/web-section/js/app.8e0ef0e0.js", headers={"User-Agent": "Mozilla/5.0"})
        code = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")
        idx = code.find("ou=function")
        if idx != -1:
            report["app_ou_function"] = code[idx:idx+1500]
        for kw in ["mobileGate", "gateImage", "ManageSkin", "styleId"]:
            kidx = code.find(kw)
            if kidx != -1:
                report["app_" + kw] = code[max(0, kidx-200):min(len(code), kidx+800)]
    except Exception as e:
        report["app_js_err"] = str(e)

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

        # 2. Call CafeBaseInfoUpdate with cafeProfileImageUrl from studio.cafe.naver.com
        try:
            page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.5)
            update_res = page.evaluate("""async (data) => {
                const payload = {
                    cafeId: 31805224,
                    cafeName: "키즈핏 소아성장 두뇌발달 양육 연구소",
                    mobileCafeName: "키즈핏 양육연구소",
                    cafeProfileImageUrl: data.iconPath,
                    profileImageUrl: data.iconPath,
                    openType: "O",
                    enableOpenApiApply: true,
                    introduction: "질병관리청 성장도표·영유아검진 기반 아이 예상키·두뇌발달·교구·나들이 양육 연구소",
                    useRealName: false,
                    publicMemberList: false,
                    themeDir1Id: 15,
                    themeDir2Id: 271,
                    cafeKeywords: ["키즈핏","아이키성장","예상키계산기","성조숙증","영유아검진","소근육발달","몬테소리교구","하브루타","주말나들이","육아카페"],
                    showRankingNotice: true,
                    cancelOpenCafeConvert: false,
                    openCafeConvertStatusCode: ""
                };
                const res = await fetch("https://apis.naver.com/cafe-web/cafe-mobile/CafeBaseInfoUpdate?cafeId=31805224", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    credentials: "include",
                    body: JSON.stringify(payload)
                });
                const txt = await res.text();
                const gateRes = await fetch("https://apis.naver.com/cafe-web/cafe2/CafeGateInfo.json?cafeId=31805224", {
                    credentials: "include"
                });
                const gateJson = await gateRes.json();
                return {status: res.status, body: txt, gateInfo: gateJson};
            }""", {"iconPath": CAFE_ICON_PATH, "iconFull": CAFE_ICON_FULL})
            report["cafe_direct_update_res"] = update_res
        except Exception as e:
            report["cafe_direct_update_err"] = str(e)

        # 3. Also test ManageLogoXmlApply.nhn on cafe.naver.com with CAFE_ICON_PATH / title path
        try:
            page.goto("https://cafe.naver.com/ManageLogoUserImageView.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.0)
            logo_apply_res = page.evaluate("""async (iconPath) => {
                const url = "/ManageLogoXmlApply.nhn?logo.clubid=31805224&logo.previewpath=" + encodeURIComponent(iconPath);
                const r = await fetch(url, {credentials: "include"});
                return {status: r.status, text: await r.text()};
            }""", CAFE_ICON_PATH)
            report["logo_xml_apply_res"] = logo_apply_res
        except Exception as e:
            report["logo_xml_apply_err"] = str(e)

        # 4. Also check ManageSkin.nhn JS to see what skin changes mobileGateImageUrl
        try:
            page.goto("https://cafe.naver.com/ManageSkin.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.0)
            skin_scripts = page.evaluate("""() => Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerText.slice(0, 1500))""")
            report["manage_skin_scripts"] = skin_scripts
        except Exception as e:
            report["manage_skin_scripts_err"] = str(e)

        page.close()

    with open(r"d:\키즈핏\logs\profile_and_cover_step9.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print("Saved logs/profile_and_cover_step9.json")

if __name__ == "__main__":
    main()
