# -*- coding: utf-8 -*-
"""
Naver Browser Daemon (scripts/naver_browser_daemon.py)
Opens a persistent Chrome window on remote debugging port 9222 for Naver Login & Blog/Cafe Setup.
"""

import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(r"d:\사업아이템")
PROFILE_DIR = ROOT / ".flow-browser-profile"
LOG_DIR = ROOT / "logs"
STATUS_FILE = LOG_DIR / "naver_daemon_status.json"

PROFILE_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)


def write_status(state: str, detail: str, url: str = ""):
    payload = {
        "state": state,
        "detail": detail,
        "url": url,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    STATUS_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[NaverDaemon] {state}: {detail} ({url})", flush=True)


def main():
    write_status("starting", "네이버 로그인 및 블로그·카페 세팅용 Chrome 브라우저를 실행합니다...")
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            channel="chrome",
            headless=False,
            args=[
                "--remote-debugging-port=9222",
                "--disable-blink-features=AutomationControlled",
                "--start-maximized",
                "--no-first-run",
                "--no-default-browser-check",
            ],
            ignore_default_args=["--enable-automation"],
            no_viewport=True,
        )

        page = context.pages[0] if context.pages else context.new_page()
        # Check if already logged in to Naver
        cookies = context.cookies("https://www.naver.com")
        cookie_names = {c["name"] for c in cookies}
        if "NID_AUT" in cookie_names and "NID_SES" in cookie_names:
            target_url = "https://www.naver.com"
        else:
            target_url = "https://nid.naver.com/nidlogin.login?mode=form&url=https%3A%2F%2Fwww.naver.com"

        page.goto(target_url, wait_until="domcontentloaded", timeout=30000)
        try:
            page.bring_to_front()
        except Exception:
            pass

        write_status("running", "Chrome 창이 열렸습니다. 네이버 로그인을 대기 중입니다.", page.url)

        while True:
            try:
                pages = context.pages
                if not pages:
                    write_status("closed", "브라우저 창이 닫혔습니다.")
                    break
            except Exception as e:
                write_status("error", f"브라우저 상태 확인 오류: {e}")
                break
            time.sleep(2)


if __name__ == "__main__":
    main()
