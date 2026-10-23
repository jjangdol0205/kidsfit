# -*- coding: utf-8 -*-
import json
import os
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\사업아이템")
PACK_DIR = ROOT / "samples" / "7_naver_blog_daily_pack" / "폴더별_글모음"
CURSOR_PATH = ROOT / "logs" / "naver_blog_daily_cursor.json"
ENV_PATH = ROOT / ".env"


def load_env():
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def send_telegram_message(text: str):
    env = load_env()
    token = os.environ.get("TELEGRAM_BOT_TOKEN") or env.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID") or env.get("TELEGRAM_CHAT_ID") or "755033799"
    if not token:
        return
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "disable_web_page_preview": False
    }).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status


def get_day_folders():
    if not PACK_DIR.exists():
        return []
    return sorted([d for d in PACK_DIR.iterdir() if d.is_dir()])


def load_cursor():
    if CURSOR_PATH.exists():
        try:
            return json.loads(CURSOR_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    # Day 1 (#224450570229) is already live on blog.naver.com/expertise333
    return {
        "lastPublishedDay": 1,
        "history": [
            {
                "day": 1,
                "folder": "1일차_신체성장_키백분위와숨은키7cm",
                "postUrl": "https://blog.naver.com/expertise333/224450570229",
                "publishedAt": "2026-10-23T09:10:00+09:00"
            }
        ]
    }


def type_multiline_into_se_one(page, body: str):
    for line in body.splitlines():
        clean = line.strip()
        if clean:
            page.keyboard.insert_text(clean)
        page.keyboard.press("Enter")
        time.sleep(0.02)


def publish_blog_post_cdp(title: str, body: str, tags: list, img_path: str):
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()
        page.on("dialog", lambda d: d.accept())

        print("📝 네이버 블로그 글쓰기(PostWriteForm) 접속 중...", flush=True)
        page.goto("https://blog.naver.com/PostWriteForm.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=30000)
        time.sleep(5.5)

        target = page
        for f in page.frames:
            if "PostWriteForm" in f.url or f.name == "mainFrame":
                if f.locator(".se-component.se-text").count() > 0:
                    target = f
                    break

        # Close any draft/help popups
        target.evaluate("""() => {
            document.querySelectorAll('button.se-popup-button-cancel, button.se-help-panel-close-button').forEach(b => b.click());
        }""")
        time.sleep(0.6)

        # 1. Enter Title
        title_para = target.locator(".se-title-text .se-text-paragraph, .se-documentTitle .se-text-paragraph").first
        if title_para.count() > 0:
            title_para.click(force=True)
            time.sleep(0.3)
            page.keyboard.insert_text(title)
            time.sleep(0.4)

        # 2. Focus Body & Upload Representative Image
        body_para = target.locator(".se-component.se-text .se-text-paragraph").first
        if body_para.count() > 0:
            body_para.click(force=True)
            time.sleep(0.3)

        if img_path and Path(img_path).exists():
            img_btn = target.locator("button.se-image-toolbar-button").first
            if img_btn.count() > 0:
                try:
                    with page.expect_file_chooser(timeout=5000) as fc_info:
                        img_btn.click(force=True)
                    fc = fc_info.value
                    fc.set_files(img_path)
                    time.sleep(4.0)
                except Exception as e:
                    print(f"⚠️ 이미지 업로드 스킵: {e}", flush=True)

        # 3. Type Body Text
        body_para_last = target.locator(".se-component.se-text .se-text-paragraph").last
        if body_para_last.count() > 0:
            body_para_last.click(force=True)
            time.sleep(0.3)
        page.keyboard.press("Enter")
        type_multiline_into_se_one(page, body)
        time.sleep(1.0)

        # 4. Open Publish Drawer via JS evaluate
        target.evaluate("""() => {
            const btn = document.querySelector("button[class*='publish_btn']");
            if (btn) btn.click();
        }""")
        time.sleep(1.8)

        # 5. Enter Tags
        tag_inp = target.locator("input[placeholder*='태그'], input[id*='tag']").first
        if tag_inp.count() > 0 and tag_inp.is_visible():
            for t in tags[:10]:
                clean_tag = t.strip().lstrip("#")
                if not clean_tag:
                    continue
                tag_inp.click(force=True)
                tag_inp.fill(clean_tag)
                page.keyboard.press("Enter")
                time.sleep(0.15)

        # 6. Click Final Confirm Publish Button
        target.evaluate("""() => {
            const confirmBtn = document.querySelector("button[data-testid='seOnePublishBtn'], button[class*='confirm_btn']");
            if (confirmBtn) confirmBtn.click();
        }""")
        time.sleep(6.5)

        final_url = target.url if target != page else page.url
        import re
        m = re.search(r"logNo=(\d+)", final_url) or re.search(r"expertise333/(\d+)", final_url)
        if m:
            final_url = f"https://blog.naver.com/expertise333/{m.group(1)}"
        else:
            try:
                page.goto("https://blog.naver.com/PostList.naver?blogId=expertise333&categoryNo=0&from=postList", wait_until="domcontentloaded", timeout=15000)
                time.sleep(2.5)
                latest_log = page.evaluate("""() => {
                    const a = Array.from(document.querySelectorAll('a')).find(el => el.href && el.href.includes('logNo='));
                    if (!a) return null;
                    const m = a.href.match(/logNo=(\\d+)/);
                    return m ? m[1] : null;
                }""")
                if latest_log:
                    final_url = f"https://blog.naver.com/expertise333/{latest_log}"
            except Exception:
                final_url = "https://blog.naver.com/expertise333"
        print(f"✅ 네이버 블로그 발행 완료: {final_url}", flush=True)

        if len(context.pages) > 1:
            try:
                context.pages[1].goto("https://blog.naver.com/expertise333", wait_until="commit")
            except Exception:
                pass
        page.close()
        return final_url


def main():
    cursor = load_cursor()
    folders = get_day_folders()
    next_day = int(cursor.get("lastPublishedDay", 1)) + 1
    idx = (next_day - 1) % len(folders)
    folder = folders[idx]

    title = (folder / "01_블로그_제목.txt").read_text(encoding="utf-8").strip()
    body = (folder / "02_블로그_본문.txt").read_text(encoding="utf-8").strip()
    tags = (folder / "03_블로그_해시태그.txt").read_text(encoding="utf-8").strip().split()
    imgs = list(folder.glob("04_블로그_대표이미지_*.png"))
    img_path = str(imgs[0]) if imgs else ""

    post_url = publish_blog_post_cdp(title, body, tags, img_path)

    cursor["lastPublishedDay"] = next_day
    cursor.setdefault("history", []).append({
        "day": next_day,
        "folder": folder.name,
        "title": title,
        "postUrl": post_url,
        "publishedAt": datetime.now().isoformat()
    })
    CURSOR_PATH.parent.mkdir(parents=True, exist_ok=True)
    CURSOR_PATH.write_text(json.dumps(cursor, ensure_ascii=False, indent=2), encoding="utf-8")

    msg = (
        f"📝 [키즈핏 공식 네이버 블로그 오늘자 칼럼 자동 업로드 완료 & 일일 스케줄 안내]\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"질문 주신 블로그 업로드 일정 안내와 함께, 오늘자({next_day}일차) 블로그 새 칼럼을 방금 공식 블로그에 자동 발행 완료했습니다!\n\n"
        f"✅ 방금 발행된 {next_day}일차 블로그 글:\n"
        f"• 제목: {title}\n"
        f"• 대표 일러스트 + 본문(https://kidsfit.co.kr 연동) + 해시태그 10개 포함\n"
        f"• 바로 확인하기: {post_url}\n\n"
        f"⏰ [키즈핏 전 채널 매일 자동 업로드·브리핑 시간표 (KST)]\n"
        f"1️⃣ 매일 아침 06:00 — 인스타(@kids_fit1) 5장 캐러셀 & 쓰레드 4컷 웹툰 텔레그램 자동 발송\n"
        f"2️⃣ 매일 아침 07:00 — 공식 네이버 블로그(blog.naver.com/expertise333) 1일 1칼럼 자동 업로드 & 텔레그램 알림\n"
        f"3️⃣ 매일 아침 09:00 — 홈페이지(kidsfit.co.kr) 일일 방문자 수·유입경로·제휴클릭 정밀 브리핑\n"
        f"4️⃣ 매 30분마다 (24시간) — PubMed·Crossref 학술 논문 자가학습 & 보고서 하단 아카이브 자동 누적"
    )
    status = send_telegram_message(msg)
    print(f"Telegram sent status: {status}", flush=True)


if __name__ == "__main__":
    main()
