#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
D:\드림컴퍼니\5사업부\scripts\setup_daum_nate_login_once.py
========================================================================
[선택형 1회 로그인 도우미 — 자동 스케줄러에서는 절대 실행되지 않음]
사장님이 티스토리/다음카페(카카오 계정) 또는 네이트 계정을 1회만 로그인해 두시면,
이후 `kfk_daum_nate_portal_publisher.py`가 무팝업(`headless=True`)으로 안전하게 세션을 재사용합니다.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
DAUM_PROFILE_DIR = ROOT_DIR / ".daum-kakao-headless-profile"
NATE_PROFILE_DIR = ROOT_DIR / ".nate-headless-profile"


def run_interactive_login_saver(target: str) -> None:
    from playwright.sync_api import sync_playwright

    is_daum = target.lower() == "daum"
    prof_dir = DAUM_PROFILE_DIR if is_daum else NATE_PROFILE_DIR
    cookie_path = prof_dir / ("daum_kakao_cookies.json" if is_daum else "nate_cookies.json")
    start_url = "https://www.tistory.com/auth/login" if is_daum else "https://xo.nate.com/Login.sk"

    prof_dir.mkdir(parents=True, exist_ok=True)
    print(f"[1회 세션 연결] {'다음/티스토리(카카오)' if is_daum else '네이트'} 로그인 창을 엽니다...")
    print("로그인이 완료되면 브라우저 창을 그대로 닫거나 콘솔에서 Enter를 눌러 주세요.")

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(prof_dir),
            headless=False,
            viewport={"width": 1280, "height": 860},
            locale="ko-KR",
            timezone_id="Asia/Seoul",
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto(start_url)
        try:
            input("\n>>> 브라우저에서 로그인 완료 후 여기서 [Enter] 키를 눌러 세션을 저장하세요: ")
        except EOFError:
            pass
        cookies = ctx.cookies()
        cookie_path.write_text(json.dumps(cookies, ensure_ascii=False, indent=2), encoding="utf-8")
        ctx.close()
    print(f"✅ 세션 쿠키 저장 완료 ({len(cookies)}개): {cookie_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="One-time interactive login saver for Daum/Tistory or Nate")
    parser.add_argument("--portal", choices=["daum", "nate"], default="daum")
    args = parser.parse_args()
    run_interactive_login_saver(args.portal)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
