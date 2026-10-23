# -*- coding: utf-8 -*-
"""
scripts/republish_cafe_1_clean.py
Finalizes the Cafe #1 clean republish (articles/28) and sends the fixed card image + URL to Telegram.
"""

import json
import os
import sys
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\사업아이템")
sys.path.insert(0, str(ROOT))

from scripts.publish_3x_daily_blog_and_cafe import (
    CURSOR_PATH,
    load_env,
    send_telegram_message,
)


def send_telegram_photo(photo_path: str, caption: str):
    env = load_env()
    token = os.environ.get("TELEGRAM_BOT_TOKEN") or env.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID") or env.get("TELEGRAM_CHAT_ID") or "755033799"
    if not token or not os.path.exists(photo_path):
        return None

    boundary = "----KidsFitBoundary7MA4YWxkTrZu0gW"
    with open(photo_path, "rb") as f:
        file_bytes = f.read()

    parts = []
    parts.append(
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="chat_id"\r\n\r\n'
        f"{chat_id}\r\n".encode("utf-8")
    )
    parts.append(
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="caption"\r\n\r\n'
        f"{caption}\r\n".encode("utf-8")
    )
    parts.append(
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="photo"; filename="{os.path.basename(photo_path)}"\r\n'
        f"Content-Type: image/png\r\n\r\n".encode("utf-8")
        + file_bytes
        + b"\r\n"
    )
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    body = b"".join(parts)

    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendPhoto",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.status


def main():
    new_cafe_url = "https://cafe.naver.com/ca-fe/cafes/31805224/articles/28"
    c_img = str(ROOT / "samples" / "9_naver_brand_assets" / "daily_auto_cards" / "cafe_auto_seq_001.png")

    try:
        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
            context = browser.contexts[0]
            if len(context.pages) > 0:
                context.pages[0].goto(new_cafe_url, wait_until="commit")
    except Exception as e:
        print(f"브라우저 탭 갱신 스킵: {e}", flush=True)

    if CURSOR_PATH.exists():
        try:
            cursor = json.loads(CURSOR_PATH.read_text(encoding="utf-8"))
            if cursor.get("history"):
                cursor["history"][-1]["cafe"]["url"] = new_cafe_url
            CURSOR_PATH.write_text(json.dumps(cursor, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as e:
            print(f"⚠️ 커서 업데이트 예외: {e}", flush=True)

    caption = (
        f"✅ [네이버 카페 1회차 게시글 대표 사진 글자 잘림 수정 & 재발행 완료]\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"말씀해주신 카페 1회차 게시글 사진에서 제목·핵심 포인트 뒷부분이 잘리고 체크 표시가 네모(▯)로 깨지던 문제를 즉시 수정했습니다!\n\n"
        f"🔧 [수정 내역]\n"
        f"1️⃣ 픽셀 폭 자동 줄바꿈(Auto-Wrap) 적용 — 제목 글자가 한 글자도 잘리지 않도록 2줄 배치\n"
        f"2️⃣ 하단 핵심 포인트 3가지의 말줄임표('…') 강제 절삭 제거 — 문장 끝까지 100% 온전하게 표시\n"
        f"3️⃣ 깨지던 특수문자(✓)를 또렷한 원형 숫자 배지(1·2·3)로 교체\n"
        f"4️⃣ 기존 잘린 게시글(#27) 삭제 후 깔끔한 새 이미지로 재등록 완료!\n\n"
        f"☕ 수정 재발행된 카페 게시글 바로가기:\n"
        f"{new_cafe_url}\n\n"
        f"👉 앞으로 매일 06시·12시·17시에 자동 업로드되는 모든 블로그·카페 요약 카드 이미지도 글자 잘림 없이 생성됩니다!"
    )
    photo_status = send_telegram_photo(c_img, caption)
    print(f"Telegram photo notification status: {photo_status}", flush=True)
    if not photo_status:
        msg_status = send_telegram_message(caption)
        print(f"Telegram text notification status: {msg_status}", flush=True)


if __name__ == "__main__":
    main()
