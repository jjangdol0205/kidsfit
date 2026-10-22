# -*- coding: utf-8 -*-
"""
Waits for the user to log in to Naver in the Chrome instance on port 9222.
Exits with code 0 immediately once NID_AUT and NID_SES cookies are detected.
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\사업아이템")
LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOGIN_INFO_FILE = LOG_DIR / "naver_login_detected.json"


def wait_for_cdp(p, timeout_sec=30):
    start = time.time()
    while time.time() - start < timeout_sec:
        try:
            browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
            return browser
        except Exception:
            time.sleep(1)
    raise RuntimeError("Could not connect to Chrome on port 9222")


def main():
    print("⏳ Chrome(Port 9222) 연결 및 네이버 로그인 감지 대기 시작...", flush=True)
    with sync_playwright() as p:
        browser = wait_for_cdp(p)
        context = browser.contexts[0]

        start_wait = time.time()
        max_wait = 1800  # 30 minutes max
        while time.time() - start_wait < max_wait:
            try:
                cookies = context.cookies(["https://www.naver.com", "https://nid.naver.com", "https://blog.naver.com", "https://cafe.naver.com"])
                cookie_map = {c["name"]: c["value"] for c in cookies}
                if "NID_AUT" in cookie_map and "NID_SES" in cookie_map:
                    print("✅ 네이버 로그인 쿠키(NID_AUT, NID_SES) 감지 완료!", flush=True)
                    payload = {
                        "logged_in": True,
                        "detected_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                        "cookies_present": list(cookie_map.keys()),
                    }
                    LOGIN_INFO_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
                    return 0
            except Exception as e:
                print(f"⚠️ 쿠키 확인 중 일시적 오류: {e}", flush=True)

            time.sleep(2)

    print("❌ 로그인 대기 시간 초과", flush=True)
    return 1


if __name__ == "__main__":
    sys.exit(main())
