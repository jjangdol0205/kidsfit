#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/send_branding_and_daily_assets_telegram.py
KidsFit Growth & Learning Studio — Telegram Direct Assets Delivery Engine

Dispatches all branding, webtoon, and card news assets directly to the user's Telegram
account via TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
1. Instagram/Threads Profile Branding Kit:
   - 3 Profile Avatars (1080x1080)
   - 5 Story Highlight Cover PNGs (1080x1080, 720px safe circular zone)
   - Master Branding Kit ZIP
   - Copy-pasteable 3 Profile Bio variations & 3 Pinned post drafts
2. Day-1 4-Cut Webtoon Pack (万3세 소근육 민감기):
   - 4 Individual Cut PNGs (1080x1080)
   - Combined 4-Cut Preview PNG (1080x1080)
   - Master Webtoon ZIP
   - Copy-pasteable Instagram Caption & Threads post copy
3. Day-1 6-Slide Card News Pack (万3세 고집과 소근육 발달):
   - 6 Individual Slide PNGs (1080x1350 Full-Bleed)
   - Combined 6-Slide Preview PNG (1080x1080)
   - Master Card News ZIP
   - Copy-pasteable Instagram Caption & Threads post copy

CLI Options:
  --dry-run: Validate assets, verify credentials, generate dispatch manifest without sending
  --live: Execute real Telegram Bot API dispatches
  --scope: all | branding | webtoon | cardnews (default: all)

Output: logs/telegram_dispatch_report.json
"""

import os
import sys
import json
import time
import uuid
import argparse
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# Safe Windows console stdout/stderr reconfigure
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
LOGS_DIR = ROOT_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
REPORT_FILE = LOGS_DIR / "telegram_dispatch_report.json"
ENV_FILE = ROOT_DIR / ".env"

BRANDING_DIR = ROOT_DIR / "인스타_쓰레드_프로필_모음"
WEBTOON_DIR = ROOT_DIR / "웹툰_모음" / "1화_만3세소근육민감기_웹툰"
CARDNEWS_DIR = ROOT_DIR / "카드뉴스_모음" / "1탄_만3세고집과소근육발달_카드뉴스"


def load_env_credentials():
    """Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from .env file"""
    if not ENV_FILE.exists():
        raise FileNotFoundError(f".env file missing at {ENV_FILE}")

    env_dict = {}
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env_dict[k.strip()] = v.strip()

    token = env_dict.get("TELEGRAM_BOT_TOKEN")
    chat_id = env_dict.get("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        raise ValueError("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env")

    return token, chat_id


def post_multipart(url: str, fields: dict, files: dict, timeout: int = 45):
    """Encodes and sends multipart/form-data via standard urllib."""
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    body = bytearray()

    for k, v in fields.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode("utf-8"))
        body.extend(str(v).encode("utf-8"))
        body.extend(b"\r\n")

    for field_name, (filename, file_bytes, content_type) in files.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode("utf-8"))
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        body.extend(file_bytes)
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(url, data=bytes(body))
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


class TelegramDispatcher:
    def __init__(self, token: str, chat_id: str, dry_run: bool = True):
        self.token = token
        self.chat_id = chat_id
        self.dry_run = dry_run
        self.base_url = f"https://api.telegram.org/bot{self.token}"

    def verify_bot(self):
        """Verifies bot credentials with Telegram getMe"""
        url = f"{self.base_url}/getMe"
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if not data.get("ok"):
                raise RuntimeError(f"Telegram getMe failed: {data}")
            return data["result"]

    def send_message(self, text: str):
        if self.dry_run:
            print(f"[DRY RUN sendMessage] Length: {len(text)} chars | Preview: {text[:60]}...")
            return {"ok": True, "dry_run": True, "type": "message"}

        url = f"{self.base_url}/sendMessage"
        payload = json.dumps({
            "chat_id": self.chat_id,
            "text": text,
            "disable_web_page_preview": True,
        }).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            time.sleep(0.4)
            return data

    def send_photo(self, photo_path: str, caption: str = ""):
        p = Path(photo_path)
        if not p.exists():
            raise FileNotFoundError(f"Photo not found: {photo_path}")

        if self.dry_run:
            print(f"[DRY RUN sendPhoto] {p.name} ({p.stat().st_size} bytes) | Caption: {caption[:40]}...")
            return {"ok": True, "dry_run": True, "type": "photo", "file": p.name}

        url = f"{self.base_url}/sendPhoto"
        with open(p, "rb") as f:
            file_bytes = f.read()

        fields = {"chat_id": self.chat_id}
        if caption:
            fields["caption"] = caption[:1024]  # Telegram caption limit

        files = {"photo": (p.name, file_bytes, "image/png")}
        data = post_multipart(url, fields, files)
        time.sleep(0.5)
        return data

    def send_document(self, doc_path: str, caption: str = ""):
        p = Path(doc_path)
        if not p.exists():
            raise FileNotFoundError(f"Document not found: {doc_path}")

        if self.dry_run:
            print(f"[DRY RUN sendDocument] {p.name} ({p.stat().st_size / (1024*1024):.2f} MB)")
            return {"ok": True, "dry_run": True, "type": "document", "file": p.name}

        url = f"{self.base_url}/sendDocument"
        with open(p, "rb") as f:
            file_bytes = f.read()

        fields = {"chat_id": self.chat_id}
        if caption:
            fields["caption"] = caption[:1024]

        content_type = "application/zip" if p.suffix.lower() == ".zip" else "text/plain"
        files = {"document": (p.name, file_bytes, content_type)}
        data = post_multipart(url, fields, files, timeout=90)
        time.sleep(0.5)
        return data


def dispatch_branding_kit(dispatcher: TelegramDispatcher):
    """Delivers Instagram & Threads Profile Branding Kit to Telegram"""
    print("\n📦 === [1/3] Dispathing Instagram & Threads Profile Branding Kit ===")
    events = []

    # 1. Header message
    h_msg = (
        "🌱 [키즈핏(KidsFit) 공식 인스타그램 & 쓰레드 프로필 브랜딩 키트]\n\n"
        "대표님, 요청하신 인스타·쓰레드 수동 업로드용 프로필 브랜딩 세트입니다.\n"
        "• 원형 최적화 프로필 이미지 3종\n"
        "• 1080x1080 스토리 하이라이트 커버 5종\n"
        "• 프로필 소개글(Bio 3종) & 고정게시물 3편 원고\n"
        "• 전체 묶음 ZIP 파일"
    )
    events.append(dispatcher.send_message(h_msg))

    # 2. 3 Avatars
    avatars = [
        (BRANDING_DIR / "01_키즈핏_인스타쓰레드_프로필_로얄인디고_엠블럼.png", "1. 로얄 인디고 엠블럼형 (소아청소년 전문 클리닉 신뢰감)"),
        (BRANDING_DIR / "02_키즈핏_인스타쓰레드_프로필_웜아이보리_감성툰형.png", "2. 웜 아이보리 감성툰형 (3040 육아맘 친근한 공감)"),
        (BRANDING_DIR / "03_키즈핏_인스타쓰레드_프로필_화이트클리닉_배지형.png", "3. 화이트 클리닉 배지형 (미니멀 프리미엄 에듀)"),
    ]
    for p_path, cap in avatars:
        events.append(dispatcher.send_photo(str(p_path), caption=cap))

    # 3. 5 Story Highlights
    hl_dir = BRANDING_DIR / "highlight_icons"
    highlights = [
        (hl_dir / "01_키성장_하이라이트.png", "스토리 하이라이트 1: 키성장 (GROWTH & SLEEP)"),
        (hl_dir / "02_두뇌학습_하이라이트.png", "스토리 하이라이트 2: 두뇌학습 (BRAIN & LQ)"),
        (hl_dir / "03_주말코스_하이라이트.png", "스토리 하이라이트 3: 주말코스 (WEEKEND TOUR)"),
        (hl_dir / "04_육아QA_하이라이트.png", "스토리 하이라이트 4: 육아 Q&A (FACT CHECK)"),
        (hl_dir / "05_무료워크지_하이라이트.png", "스토리 하이라이트 5: 무료워크지 (FREE ACTIVITY)"),
    ]
    for h_path, cap in highlights:
        events.append(dispatcher.send_photo(str(h_path), caption=cap))

    # 4. ZIP Package
    zip_path = BRANDING_DIR / "키즈핏_인스타_쓰레드_프로필이미지_3종패키지.zip"
    events.append(dispatcher.send_document(str(zip_path), caption="📦 키즈핏 인스타·쓰레드 프로필 브랜딩 전체 ZIP"))

    # 5. Copy-Pasteable Bio Copy
    bio_text = (
        "📋 [인스타·쓰레드 프로필 소개글(Bio) 3종 복사용]\n\n"
        "■ 타입 A (임상 연구소형):\n"
        "키즈핏(KidsFit) | 소아성장·두뇌발달 연구소 🌱\n"
        "🔬 질병관리청 성장도표 & 보건복지부 K-DST 기준\n"
        "📏 숨은 키 +7cm 골든타임 수면·임상영양·자세 처방\n"
        "🧠 5대 두뇌학습역량(LQ) & 펜필드 뇌과학 공부법\n"
        "📚 소아내분비·인지신경학 논문 800편+ 기반 양육\n"
        "👇 1:1 맞춤 무료 정밀 진단 리포트\n"
        "https://kidsfit.co.kr\n\n"
        "■ 타입 B (워킹맘 공감형):\n"
        "키즈핏(KidsFit) | 3040 부모를 위한 성장·학습 나침반 🌿\n"
        "\"엄마, 내가 혼자 할래!\" 고집이 아닌 손끝 뇌 발달 신호\n"
        "☕ 퇴근 후 10분, 싸우지 않고 아이 잠재력 키우는 법\n"
        "📏 또래 대비 키 백분위 & 성장판 골든타임 체크\n"
        "🧩 연령별 실패 없는 교구·책육아 & 주말 박물관 코스\n"
        "🎁 월령별 0원 홈케어 워크지 PDF 무료 나눔 👇\n"
        "https://kidsfit.co.kr\n\n"
        "■ 타입 C (듀얼 솔루션형):\n"
        "키즈핏(KidsFit) | 키 성장 × 두뇌 학습 듀얼 솔루션 ⚖️\n"
        "아이의 몸과 뇌는 함께 자랍니다.\n"
        "📏 Growth: 성장호르몬 골든타임 & 척추 감압 바른 자세\n"
        "🧠 Learning: 문해력·작업기억·메타인지 5대 학습지수(LQ)\n"
        "🚫 불필요한 영양제·교구 중복 지출 방지 가이드\n"
        "📊 질병관리청 기준 우리아이 1분 종합 진단서 발급 👇\n"
        "https://kidsfit.co.kr"
    )
    events.append(dispatcher.send_message(bio_text))

    # 6. Pinned Post Drafts
    guide_path = BRANDING_DIR / "04_인스타_쓰레드_프로필소개글_링크_세팅가이드.txt"
    events.append(dispatcher.send_document(str(guide_path), caption="📄 프로필소개글 & 고정게시물 3편 전문 세팅 가이드"))

    return events


def dispatch_cardnews_pack(dispatcher: TelegramDispatcher):
    """Delivers Day-1 6-Slide Card News Pack to Telegram"""
    print("\n📊 === [2/3] Dispatching Day-1 6-Slide Card News Pack ===")
    events = []

    # 1. Header message
    h_msg = (
        "📊 [키즈핏(KidsFit) 1일차 6슬라이드 카드뉴스 1탄]\n\n"
        "• 주제: 만 3세 \"내가 혼자 할 거야!\" 고집의 진짜 이유 (손끝 소근육 민감기)\n"
        "• 권장 업로드 골든타임: 12:30 KST (점심시간 학부모 접속 피크)\n"
        "• 규격: 1080x1350 Full-Bleed 고대비 형광펜 하이라이트 (인스타 캐러셀 전용)\n"
        "• 구성: 슬라이드 1~6장 + 합본 미리보기 + ZIP + 본문 캡션"
    )
    events.append(dispatcher.send_message(h_msg))

    # 2. Preview Grid
    prev_path = CARDNEWS_DIR / "00_전체_6슬라이드_한눈에보기_합본.png"
    events.append(dispatcher.send_photo(str(prev_path), caption="🖼️ 카드뉴스 1탄: 전체 6슬라이드 바둑판 미리보기"))

    # 3. Slides 1..6
    for i in range(1, 7):
        slide_p = CARDNEWS_DIR / f"0{i}_카드뉴스_{i}장.png"
        events.append(dispatcher.send_photo(str(slide_p), caption=f"카드뉴스 1탄 - 슬라이드 {i}/6"))

    # 4. Master ZIP
    card_zip = ROOT_DIR / "카드뉴스_모음" / "1탄_만3세고집과소근육발달_카드뉴스_전체파일.zip"
    if not card_zip.exists():
        card_zip = CARDNEWS_DIR / "1탄_만3세고집과소근육발달_카드뉴스_전체파일.zip"
    events.append(dispatcher.send_document(str(card_zip), caption="📦 카드뉴스 1탄 전체 원본 파일 ZIP"))

    # 5. Caption Copy
    caption_path = CARDNEWS_DIR / "00_인스타그램_캡션_해시태그.txt"
    if caption_path.exists():
        c_text = "📋 [카드뉴스 1탄 인스타그램 캡션 복사용]\n\n" + caption_path.read_text(encoding="utf-8")
        events.append(dispatcher.send_message(c_text))

    threads_path = CARDNEWS_DIR / "00_쓰레드_본문_대댓글.txt"
    if threads_path.exists():
        t_text = "🧵 [카드뉴스 1탄 쓰레드 본문 & 첫댓글 복사용]\n\n" + threads_path.read_text(encoding="utf-8")
        events.append(dispatcher.send_message(t_text))

    return events


def dispatch_webtoon_pack(dispatcher: TelegramDispatcher):
    """Delivers Day-1 4-Cut Webtoon Pack to Telegram"""
    print("\n💬 === [3/3] Dispatching Day-1 4-Cut Webtoon Pack ===")
    events = []

    # 1. Header message
    h_msg = (
        "💬 [키즈핏(KidsFit) 1일차 4컷 공감 육아 웹툰 1화]\n\n"
        "• 제목: 만 3세 '내가 혼자 할 거야!' 고집의 진짜 이유 (손끝 소근육 민감기)\n"
        "• 권장 업로드 골든타임: 21:30 KST (아이 재운 후 저녁 육아퇴근 피크)\n"
        "• 규격: 1080x1080 고해상도 인스타툰\n"
        "• 구성: 4컷 개별 원본 + 바둑판 합본 + 전체 ZIP + 캡션"
    )
    events.append(dispatcher.send_message(h_msg))

    # 2. Preview Grid
    prev_path = WEBTOON_DIR / "00_전체_4컷_한눈에보기_합본.png"
    events.append(dispatcher.send_photo(str(prev_path), caption="🖼️ 웹툰 1화: 전체 4컷 바둑판 합본 미리보기"))

    # 3. Individual Cuts 1..4
    cuts = [
        (WEBTOON_DIR / "01_1컷.png", "웹툰 1화 1컷 (문제 제기): 신발 혼자 신겠다고 20분째 떼쓰는 아이"),
        (WEBTOON_DIR / "02_2컷.png", "웹툰 1화 2컷 (감정 공감): 피곤해서 결국 버럭 화내고 후회하는 엄마"),
        (WEBTOON_DIR / "03_3컷.png", "웹툰 1화 3컷 (과학 발견): 대뇌 운동피질의 30%가 손끝에 집중된 소근육 민감기!"),
        (WEBTOON_DIR / "04_4컷.png", "웹툰 1화 4컷 (따뜻한 해결): 10분의 기다림과 집게 놀이로 자율성 발달"),
    ]
    for c_path, cap in cuts:
        events.append(dispatcher.send_photo(str(c_path), caption=cap))

    # 4. Master ZIP
    wt_zip = ROOT_DIR / "웹툰_모음" / "1화_만3세소근육민감기_웹툰_전체파일.zip"
    if not wt_zip.exists():
        wt_zip = WEBTOON_DIR / "1화_만3세소근육민감기_웹툰_전체파일.zip"
    events.append(dispatcher.send_document(str(wt_zip), caption="📦 웹툰 1화 전체 원본 파일 ZIP"))

    # 5. Caption Copy
    wt_ig_path = WEBTOON_DIR / "05_인스타그램_본문_해시태그.txt"
    if wt_ig_path.exists():
        c_text = "📋 [웹툰 1화 인스타그램 캡션 복사용]\n\n" + wt_ig_path.read_text(encoding="utf-8")
        events.append(dispatcher.send_message(c_text))

    wt_th_path = WEBTOON_DIR / "06_쓰레드_공감질문_본문_대댓글.txt"
    if wt_th_path.exists():
        t_text = "🧵 [웹툰 1화 쓰레드 본문 & 대댓글 복사용]\n\n" + wt_th_path.read_text(encoding="utf-8")
        events.append(dispatcher.send_message(t_text))

    return events


def main():
    parser = argparse.ArgumentParser(description="KidsFit Branding & Daily Assets Telegram Delivery")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Run validation without sending to Telegram")
    parser.add_argument("--live", action="store_true", default=False, help="Execute live dispatches to Telegram")
    parser.add_argument("--scope", choices=["all", "branding", "cardnews", "webtoon"], default="all", help="Scope of dispatch")
    args = parser.parse_args()

    is_live = args.live
    is_dry_run = args.dry_run or not is_live

    print("=" * 80)
    print(" KidsFit Parenting Content Ecosystem — Telegram Direct Delivery Engine")
    print("=" * 80)
    print(f"Mode         : {'LIVE DISPATCH' if is_live else 'DRY RUN (Validation Only)'}")
    print(f"Scope        : {args.scope}")
    print(f"Report Output: {REPORT_FILE}")
    print("-" * 80)

    token, chat_id = load_env_credentials()
    dispatcher = TelegramDispatcher(token, chat_id, dry_run=is_dry_run)

    # Verify bot connectivity
    bot_info = dispatcher.verify_bot()
    print(f"Connected to Telegram Bot: @{bot_info.get('username')} (ID: {bot_info.get('id')})")
    print(f"Target Chat ID: {chat_id}")

    all_events = []
    try:
        if args.scope in ("all", "branding"):
            all_events.extend(dispatch_branding_kit(dispatcher))

        if args.scope in ("all", "cardnews"):
            all_events.extend(dispatch_cardnews_pack(dispatcher))

        if args.scope in ("all", "webtoon"):
            all_events.extend(dispatch_webtoon_pack(dispatcher))

    except Exception as e:
        print(f"\n❌ Error during Telegram dispatch: {e}")
        err_report = {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "mode": "LIVE" if is_live else "DRY_RUN",
            "chat_id": chat_id,
            "success": False,
            "error": str(e),
        }
        with open(REPORT_FILE, "w", encoding="utf-8") as f:
            json.dump(err_report, f, indent=2, ensure_ascii=False)
        sys.exit(1)

    # Final summary message
    summary_msg = (
        f"✅ [키즈핏 에셋 배송 완료]\n"
        f"• 프로필 브랜딩 키트 (아바타 3종, 하이라이트 5종, 바이오, ZIP)\n"
        f"• 카드뉴스 1탄 (1080x1350 6슬라이드 + 캡션 + ZIP)\n"
        f"• 웹툰 1화 (1080x1080 4컷 + 캡션 + ZIP)\n\n"
        f"모든 에셋이 전송되었습니다. 각 골든타임(카드뉴스 12:30, 웹툰 21:30)에 복사하여 업로드하세요 🌱"
    )
    if is_live:
        dispatcher.send_message(summary_msg)

    report_data = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "mode": "LIVE" if is_live else "DRY_RUN",
        "chat_id": chat_id,
        "bot_username": bot_info.get("username"),
        "total_dispatches": len(all_events),
        "scope": args.scope,
        "success": True,
        "events": all_events,
    }

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Telegram delivery completed successfully ({len(all_events)} items).")
    print(f"Report written to {REPORT_FILE}")
    sys.exit(0)


if __name__ == "__main__":
    main()
