# -*- coding: utf-8 -*-
"""
Google Flow Login & Automation Daemon (scripts/flow_login_daemon.py)
Opens a visible Google Chrome window at Google Sign-In -> Google Flow (https://labs.google/fx/tools/flow)
with a persistent profile (`d:/키즈핏/.flow-browser-profile`) and remote debugging port 9222.
Monitors login state and logs status to `d:/키즈핏/logs/flow_daemon_status.json`.
"""

import json
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(r"d:\키즈핏")
PROFILE_DIR = ROOT / ".flow-browser-profile"
LOG_DIR = ROOT / "logs"
STATUS_FILE = LOG_DIR / "flow_daemon_status.json"

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
    print(f"[FlowDaemon] {state}: {detail} ({url})", flush=True)


def main():
    write_status("starting", "구글 Flow 로그인용 Chrome 브라우저를 실행 중입니다...")
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
        target_url = "https://labs.google/fx/tools/flow"
        page.goto(target_url, wait_until="domcontentloaded", timeout=30000)
        write_status("waiting_for_login", "Chrome 창이 열렸습니다. 구글Flow(flow.google.com)에서 Google 계정 로그인을 진행해 주세요.", page.url)

        logged_in_detected = False
        while True:
            try:
                pages = context.pages
                if not pages:
                    write_status("closed", "브라우저 창이 닫혔습니다.")
                    break
                active_page = pages[-1]
                cur_url = active_page.url
                title = ""
                try:
                    title = active_page.title()
                except Exception:
                    pass

                # Check if user is inside Google Flow project workspace or logged in
                has_create_btn = False
                try:
                    body_text = active_page.locator("body").inner_text(timeout=2000)
                    if ("New project" in body_text or "새 프로젝트" in body_text or "Frames to Video" in body_text or "Create" in body_text) and "Sign in" not in body_text and "로그인" not in body_text:
                        has_create_btn = True
                except Exception:
                    pass

                if has_create_btn and not logged_in_detected:
                    logged_in_detected = True
                    write_status("logged_in", "구글 Flow 로그인이 감지되었습니다! 자동화 작업을 시작할 준비가 완료되었습니다.", cur_url)
                elif not logged_in_detected:
                    write_status("waiting_for_login", f"사용자 로그인 대기 중 (현재 탭: {title})", cur_url)
            except Exception as e:
                write_status("monitoring", f"상태 점검 중: {e}")

            time.sleep(3)


if __name__ == "__main__":
    main()
