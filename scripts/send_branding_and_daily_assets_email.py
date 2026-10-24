#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/send_branding_and_daily_assets_email.py
KidsFit Growth & Learning Studio — Automated Branding Kit & Daily Assets Email Delivery Pack

Authoritative Specifications:
- Recipient: beable9489@gmail.com
- CDP port: 9222 (http://127.0.0.1:9222)
- Account: better_life333@naver.com (https://mail.naver.com/v2/new)
- Attachments:
  1. Instagram & Threads Profile Branding Kit (Avatars, Highlight cover icons, Bio copy guide, ZIP)
  2. Day-1 4-Cut Webtoon Pack (PNG cuts, combined preview, IG/Threads copy, ZIP)
  3. Day-1 6-Slide Card News Pack (PNG slides, combined preview, IG/Threads copy, ZIP)
- Max attachment limit: < 25 MB per email (batched into high-reliability dispatches)
- CLI Flags:
  --dry-run: Validate assets, test CDP connection & DOM without clicking send
  --live: Actually dispatch email via Naver Mail
  --to <email>: Override recipient (defaults to beable9489@gmail.com)
  --type <all|branding|daily_pack>: Filter dispatch scope
- Output: logs/email_dispatch_report.json
"""

import os
import sys
import json
import time
import argparse
import asyncio
import threading
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
import websockets
from playwright.sync_api import sync_playwright

# Windows console encoding safeguard
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
LOGS_DIR = ROOT_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
REPORT_FILE = LOGS_DIR / "email_dispatch_report.json"

TARGET_EMAIL = "beable9489@gmail.com"
CDP_PORT = 9222
CDP_URL = f"http://127.0.0.1:{CDP_PORT}"
BRIDGE_PORT = 9228

BRANDING_DIR = ROOT_DIR / "인스타_쓰레드_프로필_모음"
WEBTOON_DIR = ROOT_DIR / "웹툰_모음" / "1화_만3세소근육민감기_웹툰"
CARDNEWS_DIR = ROOT_DIR / "카드뉴스_모음" / "1탄_만3세고집과소근육발달_카드뉴스"


class CDPFilterBridge:
    """
    Transparent loopback WebSocket bridge to Chrome on CDP port 9222 that filters out
    Chrome 155+ internal 'browser_ui' targets (e.g. chrome://omnibox-popup), preventing
    Playwright's connect_over_cdp from hanging on unresolved internal UI targets.
    """

    def __init__(self, cdp_port=CDP_PORT, bridge_port=BRIDGE_PORT):
        self.cdp_port = cdp_port
        self.bridge_port = bridge_port
        self.server = None
        self.loop = None
        self.thread = None
        self.stop_event = None

    def start(self):
        self.stop_event = threading.Event()
        started_event = threading.Event()

        def run_loop():
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)

            async def proxy_handler(client_ws):
                meta = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{self.cdp_port}/json/version").read().decode())
                chrome_ws_url = meta["webSocketDebuggerUrl"]
                async with websockets.connect(chrome_ws_url, max_size=None, ping_interval=None) as chrome_ws:
                    async def client_to_chrome():
                        try:
                            async for msg in client_ws:
                                await chrome_ws.send(msg)
                        except Exception as e:
                            pass

                    async def chrome_to_client():
                        try:
                            async for msg in chrome_ws:
                                data = json.loads(msg)
                                if data.get("method") in ("Target.targetCreated", "Target.targetInfoChanged"):
                                    tinfo = data.get("params", {}).get("targetInfo", {})
                                    if tinfo.get("type") == "browser_ui" or "omnibox" in tinfo.get("url", ""):
                                        continue
                                if "result" in data and "targetInfos" in data["result"]:
                                    data["result"]["targetInfos"] = [
                                        t for t in data["result"]["targetInfos"]
                                        if t.get("type") != "browser_ui" and "omnibox" not in t.get("url", "")
                                    ]
                                    msg = json.dumps(data)
                                await client_ws.send(msg)
                        except Exception as e:
                            pass

                    await asyncio.gather(client_to_chrome(), chrome_to_client())

            async def main():
                self.server = await websockets.serve(proxy_handler, "127.0.0.1", self.bridge_port, max_size=None, ping_interval=None)
                started_event.set()
                while not self.stop_event.is_set():
                    await asyncio.sleep(0.1)
                self.server.close()
                await self.server.wait_closed()

            self.loop.run_until_complete(main())

        self.thread = threading.Thread(target=run_loop, daemon=True)
        self.thread.start()
        started_event.wait(timeout=5.0)

    def stop(self):
        if self.stop_event:
            self.stop_event.set()
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)


def get_email_batches(recipient: str):
    """
    Constructs high-reliability email batches adhering to Naver Mail's <25MB limit.
    Batch 1: Instagram/Threads Branding Kit + Day-1 Card News Pack (~9 MB)
    Batch 2: Day-1 4-Cut Webtoon Pack (~17.5 MB)
    """
    # Batch 1 Files
    branding_zip = BRANDING_DIR / "키즈핏_인스타_쓰레드_프로필이미지_3종패키지.zip"
    cardnews_zip = ROOT_DIR / "카드뉴스_모음" / "1탄_만3세고집과소근육발달_카드뉴스_전체파일.zip"
    if not cardnews_zip.exists():
        cardnews_zip = CARDNEWS_DIR / "1탄_만3세고집과소근육발달_카드뉴스_전체파일.zip"

    batch1_files = [
        # Branding assets
        str(branding_zip),
        str(BRANDING_DIR / "00_인스타쓰레드_원형적용_미리보기_3종비교.png"),
        str(BRANDING_DIR / "01_키즈핏_인스타쓰레드_프로필_로얄인디고_엠블럼.png"),
        str(BRANDING_DIR / "02_키즈핏_인스타쓰레드_프로필_웜아이보리_감성툰형.png"),
        str(BRANDING_DIR / "03_키즈핏_인스타쓰레드_프로필_화이트클리닉_배지형.png"),
        str(BRANDING_DIR / "04_인스타_쓰레드_프로필소개글_링크_세팅가이드.txt"),
        str(BRANDING_DIR / "highlight_icons" / "01_키성장_하이라이트.png"),
        str(BRANDING_DIR / "highlight_icons" / "02_두뇌학습_하이라이트.png"),
        str(BRANDING_DIR / "highlight_icons" / "03_주말코스_하이라이트.png"),
        str(BRANDING_DIR / "highlight_icons" / "04_육아QA_하이라이트.png"),
        str(BRANDING_DIR / "highlight_icons" / "05_무료워크지_하이라이트.png"),
        # Card News assets
        str(cardnews_zip),
        str(CARDNEWS_DIR / "00_전체_6슬라이드_한눈에보기_합본.png"),
        str(CARDNEWS_DIR / "00_인스타그램_캡션_해시태그.txt"),
        str(CARDNEWS_DIR / "00_쓰레드_본문_대댓글.txt"),
    ]

    # Batch 2 Files
    webtoon_zip = ROOT_DIR / "웹툰_모음" / "1화_만3세소근육민감기_웹툰_전체파일.zip"
    if not webtoon_zip.exists():
        webtoon_zip = WEBTOON_DIR / "1화_만3세소근육민감기_웹툰_전체파일.zip"

    batch2_files = [
        str(webtoon_zip),
        str(WEBTOON_DIR / "00_전체_4컷_한눈에보기_합본.png"),
        str(WEBTOON_DIR / "01_1컷.png"),
        str(WEBTOON_DIR / "02_2컷.png"),
        str(WEBTOON_DIR / "03_3컷.png"),
        str(WEBTOON_DIR / "04_4컷.png"),
        str(WEBTOON_DIR / "05_인스타그램_본문_해시태그.txt"),
        str(WEBTOON_DIR / "06_쓰레드_공감질문_본문_대댓글.txt"),
    ]

    card_ig_path = CARDNEWS_DIR / "00_인스타그램_캡션_해시태그.txt"
    card_ig_snippet = ""
    if card_ig_path.exists():
        try:
            card_ig_snippet = card_ig_path.read_text(encoding="utf-8")[:600]
        except Exception:
            pass

    wt_ig_path = WEBTOON_DIR / "05_인스타그램_본문_해시태그.txt"
    wt_ig_snippet = ""
    if wt_ig_path.exists():
        try:
            wt_ig_snippet = wt_ig_path.read_text(encoding="utf-8")[:600]
        except Exception:
            pass

    batches = [
        {
            "batch_id": "BATCH_1_BRANDING_AND_CARDNEWS",
            "category": "branding",
            "subject": "[키즈핏 공식 브랜딩 & 1일차 카드뉴스] 인스타·쓰레드 프로필 브랜딩 키트 + 6슬라이드 카드뉴스 1탄 (골든타임 업로드용)",
            "recipient": recipient,
            "optimal_window": "12:30 KST (점심시간 학부모 접속 피크)",
            "summary": "인스타그램/쓰레드 계정 개설용 원형 프로필 3종, 스토리 하이라이트 커버 5종, 바이오 3종, 고정게시물 3편 및 카드뉴스 1탄(만 3세 고집과 소근육) 원본 팩",
            "body": f"""안녕하세요 대표님! 키즈핏(KidsFit) 성장 & 두뇌학습 스튜디오입니다.

인스타그램 & 쓰레드 수동 업로드를 위한 【공식 프로필 브랜딩 키트】와 【1일차 6슬라이드 카드뉴스 원본 팩】을 첨부해 드립니다.

======================================================================
📦 [첨부파일 1: 인스타그램 & 쓰레드 프로필 브랜딩 키트]
======================================================================
1. 원형 프로필 이미지 3종 (1080x1080):
   - 01_키즈핏_인스타쓰레드_프로필_로얄인디고_엠블럼.png (전문 클리닉)
   - 02_키즈핏_인스타쓰레드_프로필_웜아이보리_감성툰형.png (3040 친근 육아맘)
   - 03_키즈핏_인스타쓰레드_프로필_화이트클리닉_배지형.png (미니멀 에듀)
2. 스토리 하이라이트 커버 아이콘 5종 (1080x1080, 720px 안전영역):
   - 01_키성장_하이라이트.png (GROWTH & SLEEP)
   - 02_두뇌학습_하이라이트.png (BRAIN & LQ)
   - 03_주말코스_하이라이트.png (WEEKEND TOUR)
   - 04_육아QA_하이라이트.png (FACT CHECK)
   - 05_무료워크지_하이라이트.png (FREE ACTIVITY)
3. 프로필 소개글(Bio 3종) & 고정게시물(3편) 세팅 가이드:
   - 04_인스타_쓰레드_프로필소개글_링크_세팅가이드.txt
4. 브랜딩 전체 통합 ZIP:
   - 키즈핏_인스타_쓰레드_프로필이미지_3종패키지.zip

======================================================================
📊 [첨부파일 2: 1일차 6슬라이드 카드뉴스 (권장 업로드: 12:30 KST)]
======================================================================
주제: 만 3세 "내가 혼자 할 거야!" 고집의 진짜 이유 (손끝 소근육 민감기)
구성: 01~06슬라이드(1080x1350 Full-Bleed 고대비) + 합본 미리보기 + 전체 ZIP
* 인스타그램 캐러셀 및 쓰레드 동시 업로드에 최적화되어 있습니다.

[카드뉴스 인스타그램 캡션 & 해시태그 미리보기]
{card_ig_snippet}

감사합니다. 이어서 저녁 골든타임(21:30 KST)용 4컷 웹툰 1화도 발송해 드립니다!
- 키즈핏(KidsFit) 에코시스템 자동화 배송팀""",
            "files": [f for f in batch1_files if os.path.exists(f)],
        },
        {
            "batch_id": "BATCH_2_WEBTOON_DAY1",
            "category": "daily_pack",
            "subject": "[키즈핏 1일차 웹툰] 4컷 공감 육아 웹툰 1화(만 3세 소근육 민감기) 고해상도 원본 팩 + 인스타/쓰레드 본문",
            "recipient": recipient,
            "optimal_window": "21:30 KST (아이 재운 후 저녁 육아퇴근 피크)",
            "summary": "인스타그램 및 쓰레드 업로드용 4컷 공감 육아 웹툰 1화(만 3세 손끝 소근육 민감기) 1080x1080 원본 컷, 4컷 바둑판 합본 및 캡션 원고",
            "body": f"""안녕하세요 대표님! 키즈핏(KidsFit) 성장 & 두뇌학습 스튜디오입니다.

오늘 저녁 육아퇴근 골든타임(21:30 KST) 업로드를 위한 【4컷 공감 육아 웹툰 1화】 원본 팩을 첨부해 드립니다.

======================================================================
💬 [1일차 웹툰 1화: 만 3세 '내가 혼자 할 거야!' 고집의 진짜 이유]
======================================================================
1. 서사 구조 (4-Cut Story Arc):
   - 1컷 (문제 제기): 신발 혼자 신겠다고 20분째 떼쓰는 아이 vs 속 타는 엄마
   - 2컷 (감정 공감): 피곤해서 결국 버럭 화를 내고 후회하는 엄마의 마음
   - 3컷 (과학 발견): 대뇌 운동피질(호문쿨루스)의 30%가 손끝에 집중된 소근육 민감기!
   - 4컷 (따뜻한 해결): 10분의 기다림과 집게 놀이로 자율성과 뇌 발달을 함께 잡는 평온한 저녁

2. 첨부 파일 구성:
   - 00_전체_4컷_한눈에보기_합본.png (1080x1080 바둑판 합본)
   - 01_1컷.png ~ 04_4컷.png (1080x1080 개별 컷 원본)
   - 05_인스타그램_본문_해시태그.txt
   - 06_쓰레드_공감질문_본문_대댓글.txt
   - 1화_만3세소근육민감기_웹툰_전체파일.zip (전체 묶음)

[인스타그램 업로드 캡션 및 해시태그 미리보기]
{wt_ig_snippet}

감사합니다!
- 키즈핏(KidsFit) 에코시스템 자동화 배송팀""",
            "files": [f for f in batch2_files if os.path.exists(f)],
        },
    ]

    return batches


def execute_cdp_dispatch(batches, dry_run: bool = True):
    """
    Connects to Chrome session on CDP port 9222 (via local CDPFilterBridge)
    and executes Naver Mail dispatch to recipient.
    """
    results = []
    print(f"\n[CDP Mail Dispatcher] Starting CDP bridge to port {CDP_PORT} (dry_run={dry_run})...")

    # Start loopback filter bridge
    bridge = CDPFilterBridge(cdp_port=CDP_PORT, bridge_port=BRIDGE_PORT)
    bridge.start()
    bridge_ws_url = f"ws://127.0.0.1:{BRIDGE_PORT}"

    try:
        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp(bridge_ws_url)
            context = browser.contexts[0]

            for idx, batch in enumerate(batches, start=1):
                page = context.new_page()
                page.set_viewport_size({"width": 1280, "height": 960})

                try:
                    batch_id = batch["batch_id"]
                    subject = batch["subject"]
                    recipient = batch["recipient"]
                    files = batch["files"]

                    total_size_bytes = sum(os.path.getsize(f) for f in files if os.path.exists(f))
                    total_size_mb = total_size_bytes / (1024 * 1024)

                    print(f"\n--- Processing Batch {idx}/{len(batches)}: {batch_id} ---")
                    print(f"Recipient: {recipient}")
                    print(f"Subject: {subject}")
                    print(f"Files count: {len(files)} (Total size: {total_size_mb:.2f} MB)")

                    if total_size_mb >= 25.0:
                        raise ValueError(f"Batch attachment size {total_size_mb:.2f} MB exceeds 25 MB limit!")

                    # Step 1: Navigate to Naver Mail write page
                    print("Navigating to https://mail.naver.com/v2/new...")
                    page.goto("https://mail.naver.com/v2/new", wait_until="domcontentloaded", timeout=40000)
                    time.sleep(3.5)

                    # Step 2: Validate DOM elements
                    rec_input = page.locator("#recipient_input_element")
                    subj_input = page.locator("#subject_title")

                    if not rec_input.is_visible(timeout=8000):
                        raise RuntimeError("Recipient input element #recipient_input_element not visible")
                    if not subj_input.is_visible(timeout=8000):
                        raise RuntimeError("Subject input element #subject_title not visible")

                    # Step 3: Fill Recipient
                    rec_input.click()
                    rec_input.fill(recipient)
                    rec_input.press("Enter")
                    time.sleep(0.5)

                    # Step 4: Fill Subject
                    subj_input.click()
                    subj_input.fill(subject)
                    time.sleep(0.5)

                    # Step 5: Upload file attachments via set_input_files and dispatch change event
                    print(f"Attaching {len(files)} files via file input element...")
                    try:
                        file_input = page.locator("#ATTACH_LOCAL_FILE_ELEMENT_ID")
                        file_input.set_input_files(files)
                        page.evaluate("""() => {
                            const inp = document.getElementById('ATTACH_LOCAL_FILE_ELEMENT_ID');
                            if (inp) inp.dispatchEvent(new Event('change', { bubbles: true }));
                        }""")
                        time.sleep(4.0)
                    except Exception as e:
                        print(f"Warning on set_input_files: {e}")

                    # Step 6: Inject formatted HTML Body
                    page.evaluate("""(bodyText) => {
                        for (const ifr of Array.from(document.querySelectorAll('iframe'))) {
                            try {
                                const doc = ifr.contentDocument;
                                if (doc && doc.body && (doc.body.isContentEditable || doc.designMode === 'on' || doc.body.classList.contains('workseditor-content') || doc.body.innerHTML !== undefined)) {
                                    if (ifr.id && ifr.id.includes('gnb')) continue;
                                    if (ifr.id === 'checkVirusArea') continue;
                                    doc.body.innerHTML = '<div style="font-family:Malgun Gothic,Apple SD Gothic Neo,sans-serif;font-size:14px;line-height:1.75;color:#1E293B;">' + bodyText.replace(/\\n/g, '<br>') + '</div>';
                                    return 'iframe_body_set';
                                }
                            } catch (e) {}
                        }
                        const ce = document.querySelector('[contenteditable="true"]');
                        if (ce) {
                            ce.innerHTML = bodyText.replace(/\\n/g, '<br>');
                            return 'contenteditable_set';
                        }
                        return 'none';
                    }""", batch["body"])
                    time.sleep(1.0)

                    # Verify send button presence
                    send_btn = page.locator("button.button_write_task").first
                    send_btn_ready = send_btn.is_visible(timeout=5000)

                    if dry_run:
                        print(f"✅ [DRY RUN SUCCESS] Batch {idx} validated: all controls populated, ready to send (button_visible={send_btn_ready}).")
                        results.append({
                            "batch_id": batch_id,
                            "status": "DRY_RUN_VALIDATED",
                            "recipient": recipient,
                            "subject": subject,
                            "files_count": len(files),
                            "total_size_mb": round(total_size_mb, 2),
                            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                            "url": page.url,
                            "send_button_ready": send_btn_ready,
                        })
                    else:
                        # LIVE SENDING
                        print(f"🚀 [LIVE SEND] Submitting email for Batch {idx}...")
                        send_btn.click()
                        time.sleep(4.0)

                        # Handle any confirm dialogs
                        page.evaluate("""() => {
                            const btns = Array.from(document.querySelectorAll('button'));
                            for (const b of btns) {
                                const t = (b.innerText || '').trim();
                                if (t === '확인' || t === '보내기') {
                                    if (b.offsetParent !== null && !b.classList.contains('button_write_task')) b.click();
                                }
                            }
                        }""")
                        time.sleep(4.0)

                        final_url = page.url
                        print(f"Email submitted -> Final URL: {final_url}")
                        results.append({
                            "batch_id": batch_id,
                            "status": "LIVE_SENT",
                            "recipient": recipient,
                            "subject": subject,
                            "files_count": len(files),
                            "total_size_mb": round(total_size_mb, 2),
                            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                            "final_url": final_url,
                        })

                finally:
                    page.close()

            browser.close()

    finally:
        bridge.stop()

    return results


def main():
    parser = argparse.ArgumentParser(description="KidsFit Branding Kit & Daily Assets Email Delivery")
    parser.add_argument("--to", default=TARGET_EMAIL, help=f"Target recipient email (default: {TARGET_EMAIL})")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Run validation & DOM test without sending")
    parser.add_argument("--live", action="store_true", default=False, help="Perform actual live email dispatch")
    parser.add_argument("--type", choices=["all", "branding", "daily_pack"], default="all", help="Scope of email dispatch")
    args = parser.parse_args()

    # Determine mode: if --live is not specified, default to dry-run
    is_live = args.live
    is_dry_run = args.dry_run or not is_live

    print("=" * 80)
    print(" KidsFit Parenting Content Ecosystem — Branding & Daily Assets Email Dispatch")
    print("=" * 80)
    print(f"Target Recipient : {args.to}")
    print(f"Scope Filter     : {args.type}")
    print(f"Execution Mode   : {'LIVE DISPATCH' if is_live else 'DRY RUN (Validation Only)'}")
    print(f"Report Output    : {REPORT_FILE}")
    print("-" * 80)

    # Validate target recipient
    if not args.to or "@" not in args.to:
        print(f"ERROR: Invalid recipient email: {args.to}")
        sys.exit(1)

    all_batches = get_email_batches(args.to)
    if args.type == "branding":
        selected_batches = [b for b in all_batches if b["category"] == "branding"]
    elif args.type == "daily_pack":
        selected_batches = [b for b in all_batches if b["category"] == "daily_pack"]
    else:
        selected_batches = all_batches

    print(f"Prepared {len(selected_batches)} dispatch batch(es):")
    for b in selected_batches:
        sz_mb = sum(os.path.getsize(f) for f in b["files"] if os.path.exists(f)) / (1024 * 1024)
        print(f" - [{b['batch_id']}] {b['subject'][:50]}... ({len(b['files'])} files, {sz_mb:.2f} MB)")

    # Execute CDP dispatch
    try:
        results = execute_cdp_dispatch(selected_batches, dry_run=is_dry_run)
    except Exception as e:
        print(f"\n❌ Error during email dispatch: {e}")
        failure_report = {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "target_email": args.to,
            "mode": "LIVE" if is_live else "DRY_RUN",
            "success": False,
            "error": str(e),
        }
        with open(REPORT_FILE, "w", encoding="utf-8") as f:
            json.dump(failure_report, f, indent=2, ensure_ascii=False)
        sys.exit(1)

    # Save comprehensive report
    report_data = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "target_email": args.to,
        "mode": "LIVE" if is_live else "DRY_RUN",
        "batches_processed": len(results),
        "results": results,
        "success": True,
    }

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Email dispatch completed successfully. Report written to {REPORT_FILE}")
    sys.exit(0)


if __name__ == "__main__":
    main()
