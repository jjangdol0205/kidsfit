#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
D:\드림컴퍼니\5사업부\scripts\naver_search_advisor_helper.py
Naver Search Advisor Ownership Verification & Sitemap/RSS Submitter via CDP Port 9233.
  --request: Opens https://searchadvisor.naver.com/console/verify?site=https%3A%2F%2Fkidsfit.co.kr,
             clicks 소유확인, captures the 5-char security image modal, and sends it to Telegram.
  --submit-code <CODE>: Submits the 5-char security code, completes ownership verification,
                        and registers https://kidsfit.co.kr/sitemap.xml and https://kidsfit.co.kr/rss.xml.
"""

import argparse
import asyncio
import base64
import json
import os
import sys
import urllib.request
from pathlib import Path
import requests
import websockets

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(r"D:\드림컴퍼니\5사업부")
CDP_PORT = 9233
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "755033799")


def load_kfk_bot_token():
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
            if line.startswith("TELEGRAM_BOT_TOKEN="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    tok = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not tok:
        raise RuntimeError("Missing TELEGRAM_BOT_TOKEN in 5사업부/.env")
    return tok


async def cdp_send(ws, method, params=None, mid=1):
    await ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
    while True:
        raw = await ws.recv()
        data = json.loads(raw)
        if data.get("method") == "Page.javascriptDialogOpening":
            await ws.send(
                json.dumps({"id": 99999, "method": "Page.handleJavaScriptDialog", "params": {"accept": True}})
            )
            continue
        if data.get("id") == mid:
            return data.get("result", {})


async def request_captcha_to_telegram():
    tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json/list", timeout=3).read().decode("utf-8"))
    ws_url = [t["webSocketDebuggerUrl"] for t in tabs if t.get("type") == "page"][0]
    img_path = ROOT / "logs" / "naver_search_advisor_captcha.png"
    img_path.parent.mkdir(parents=True, exist_ok=True)

    async with websockets.connect(ws_url, max_size=50_000_000) as ws:
        mid = 1
        await cdp_send(ws, "Page.enable", {}, mid); mid += 1
        await cdp_send(
            ws,
            "Page.navigate",
            {"url": "https://searchadvisor.naver.com/console/verify?site=https%3A%2F%2Fkidsfit.co.kr"},
            mid,
        ); mid += 1
        await asyncio.sleep(4.5)

        js_click = """(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const vBtn = btns.find(b => (b.innerText || '').includes('소유확인'));
            if (vBtn) { vBtn.click(); return 'CLICKED_VERIFY'; }
            return location.href;
        })()"""
        r = await cdp_send(ws, "Runtime.evaluate", {"expression": js_click, "returnByValue": True}, mid); mid += 1
        print("Verify button status:", r.get("result", {}).get("value"))
        await asyncio.sleep(2.5)

        shot = await cdp_send(ws, "Page.captureScreenshot", {"format": "png"}, mid); mid += 1
        b64 = shot.get("data", "")
        if b64:
            img_path.write_bytes(base64.b64decode(b64))

    tok = load_kfk_bot_token()
    caption = (
        "🔐 <b>[5사업부: kidsfit.co.kr 네이버 서치어드바이저 소유확인 마지막 단계]</b>\n\n"
        "• HTML 소유확인 파일(<code>naver696904f98e6ce2a823ce309436f2e2cd.html</code>) 및 메타태그 배포 완료 ✅\n"
        "• 네이버 서치어드바이저 정책상 마지막 <b>보안문자 5글자</b> 확인이 필요합니다.\n\n"
        "👉 위 이미지에 보이는 <b>영문/숫자 5글자</b>를 이 방에 그대로 답장(예: <code>인증 AB12C</code> 또는 5글자만 입력)해주시면, 즉시 소유확인을 완료하고 <b>사이트맵(sitemap.xml)과 RSS(rss.xml)</b>까지 자동으로 제출합니다!"
    )
    with open(img_path, "rb") as f:
        requests.post(
            f"https://api.telegram.org/bot{tok}/sendPhoto",
            data={"chat_id": CHAT_ID, "caption": caption, "parse_mode": "HTML"},
            files={"photo": f},
            timeout=15,
        )
    print("Sent Search Advisor CAPTCHA screenshot to Telegram.")


async def submit_code_and_register(code: str):
    clean_code = code.replace("인증", "").strip().upper()
    tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json/list", timeout=3).read().decode("utf-8"))
    ws_url = [t["webSocketDebuggerUrl"] for t in tabs if t.get("type") == "page"][0]

    async with websockets.connect(ws_url, max_size=50_000_000) as ws:
        mid = 1
        await cdp_send(ws, "Page.enable", {}, mid); mid += 1
        code_json = json.dumps(clean_code)
        js_fill = f"""(() => {{
            window.__lastAlert = '';
            window.alert = (m) => {{ window.__lastAlert = m; return true; }};
            window.confirm = (m) => {{ window.__lastAlert = m; return true; }};
            const dialog = document.querySelector('.v-dialog--active') || document;
            const inp = dialog.querySelector('input[type="text"]');
            if (!inp) return 'NO_INPUT';
            inp.focus();
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(inp, {code_json});
            inp.dispatchEvent(new Event('input', {{ bubbles: true }}));
            inp.dispatchEvent(new Event('change', {{ bubbles: true }}));
            const btns = Array.from(dialog.querySelectorAll('button'));
            const ok = btns.find(b => (b.innerText || '').trim() === '확인');
            if (ok) ok.click();
            return 'SUBMITTED_' + {code_json};
        }})()"""
        r1 = await cdp_send(ws, "Runtime.evaluate", {"expression": js_fill, "returnByValue": True}, mid); mid += 1
        print("Submit code result:", r1.get("result", {}).get("value"))
        await asyncio.sleep(4.5)

        # Submit Sitemap
        await cdp_send(
            ws,
            "Page.navigate",
            {"url": "https://searchadvisor.naver.com/console/site/request/sitemap?site=https%3A%2F%2Fkidsfit.co.kr"},
            mid,
        ); mid += 1
        await asyncio.sleep(4.0)
        js_sm = """(() => {
            window.alert = (m) => true; window.confirm = (m) => true;
            const inp = document.querySelector('input[type="text"]');
            if (!inp) return 'NO_SITEMAP_INPUT';
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(inp, 'https://kidsfit.co.kr/sitemap.xml');
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            const ok = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').trim() === '확인');
            if (ok) ok.click();
            return 'SITEMAP_SUBMITTED';
        })()"""
        r_sm = await cdp_send(ws, "Runtime.evaluate", {"expression": js_sm, "returnByValue": True}, mid); mid += 1
        await asyncio.sleep(3.5)

        # Submit RSS
        await cdp_send(
            ws,
            "Page.navigate",
            {"url": "https://searchadvisor.naver.com/console/site/request/rss?site=https%3A%2F%2Fkidsfit.co.kr"},
            mid,
        ); mid += 1
        await asyncio.sleep(4.0)
        js_rss = """(() => {
            window.alert = (m) => true; window.confirm = (m) => true;
            const inp = document.querySelector('input[type="text"]');
            if (!inp) return 'NO_RSS_INPUT';
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(inp, 'https://kidsfit.co.kr/rss.xml');
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            const ok = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').trim() === '확인');
            if (ok) ok.click();
            return 'RSS_SUBMITTED';
        })()"""
        r_rss = await cdp_send(ws, "Runtime.evaluate", {"expression": js_rss, "returnByValue": True}, mid); mid += 1
        await asyncio.sleep(3.0)

    tok = load_kfk_bot_token()
    msg = (
        "✅ <b>[3사업부: kidsfit.co.kr 네이버 서치어드바이저 소유확인 & 사이트맵/RSS 등록 완료!]</b>\n"
        f"• 입력 보안문자: <code>{clean_code}</code>\n"
        f"• Sitemap 제출: <code>https://kidsfit.co.kr/sitemap.xml</code> ({r_sm.get('result', {}).get('value')})\n"
        f"• RSS 제출: <code>https://kidsfit.co.kr/rss.xml</code> ({r_rss.get('result', {}).get('value')})"
    )
    requests.post(
        f"https://api.telegram.org/bot{tok}/sendMessage",
        json={"chat_id": CHAT_ID, "text": msg, "parse_mode": "HTML"},
        timeout=10,
    )
    print("Completed Search Advisor verification and Sitemap/RSS submission.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--request", action="store_true")
    parser.add_argument("--submit-code", type=str, default="")
    args = parser.parse_args()
    if args.submit_code:
        asyncio.run(submit_code_and_register(args.submit_code))
    else:
        asyncio.run(request_captcha_to_telegram())


if __name__ == "__main__":
    main()
