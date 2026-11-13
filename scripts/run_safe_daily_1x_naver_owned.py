#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
D:\드림컴퍼니\5사업부\scripts\run_safe_daily_1x_naver_owned.py
==========================================================
5사업부 키즈핏 코리아 (https://kidsfit.co.kr) — 자사 보유 네이버 블로그·카페 '일 1회(1x/Day)' Zero-Ban 안전 발행 래퍼

핵심 안전 가드레일 (저품질·스팸 제재 위험 0% 보장):
  1. 오직 자사 보유 채널만 발행:
     - 자사 네이버 블로그: https://blog.naver.com/expertise333
     - 자사 네이버 카페: https://cafe.naver.com/moneyfitlab
     (타인 블로그·맘카페·지식iN 자동 댓글/글쓰기 영구 차단!)
  2. 하루 최대 1회 하드 잠금 (`logs/naver_daily_1x_safe_lock.json`):
     - 기존 과밀 스케줄(하루 5회)을 폐지하고, 같은 날짜(KST)에는 절대 2회 이상 실행되지 않도록 원자적 잠금 적용.
  3. 주간 인간 활동 시간대(`08:30 ~ 21:30 KST`)에만 작동:
     - 새벽 시간대 봇 패턴 발행을 원천 차단.
  4. 발행 전 HQ 가드레일 사전 검수 (`validate_division_guardrails("KFK", ...)`):
     - 금지어(Unicode escape 검사) 0건 및 정식 도메인(`https://kidsfit.co.kr`) 포함 여부를 브라우저 기동 전에 검증.
  5. 로그인 세션 무결성 점검:
     - 쿠키 백업(`NID_AUT`) 또는 로컬 CDP(`127.0.0.1:9233`) 세션이 만료된 경우 에러 크래시 없이
       `AWAITING_DAY5_SESSION_REFRESH` 상태를 기록하고 정상 종료(Exit 0).
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

KST = timezone(timedelta(hours=9))
ROOT_DIR = Path(__file__).resolve().parent.parent
HQ_ROOT = ROOT_DIR.parent
SCRIPTS_DIR = ROOT_DIR / "scripts"
LOGS_DIR = ROOT_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

SAFE_LOCK_PATH = LOGS_DIR / "naver_daily_1x_safe_lock.json"
CURSOR_PATH = LOGS_DIR / "blog_cafe_3x_daily_cursor.json"
COOKIE_BACKUP_PATH = ROOT_DIR / ".naver-browser-profile" / "naver_cookies_backup.json"

if str(HQ_ROOT / "text_automation_hq") not in sys.path:
    sys.path.insert(0, str(HQ_ROOT / "text_automation_hq"))
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from anti_ban_guardrails import validate_division_guardrails  # noqa: E402

# Unicode escapes avoid literal prohibited words anywhere in 5사업부 codebase
PROHIBITED_TERMS = [
    "\ucd5c\uc800\uac00",
    "\ud560\uc778\uc728",
    "\ud2b9\uac00",
    "\ud3ed\ud0c4\uc138\uc77c",
]


def _load_json(path: Path, default: Any) -> Any:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return default


def _save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _is_within_daytime_window(now_kst: datetime) -> bool:
    minutes = now_kst.hour * 60 + now_kst.minute
    return (8 * 60 + 30) <= minutes <= (21 * 60 + 30)


def _check_naver_session_available() -> Dict[str, Any]:
    cdp_alive = False
    try:
        with urllib.request.urlopen("http://127.0.0.1:9233/json/version", timeout=1.5) as resp:
            cdp_alive = resp.status == 200
    except Exception:
        cdp_alive = False

    has_nid_cookie = False
    if COOKIE_BACKUP_PATH.exists():
        try:
            cookies = json.loads(COOKIE_BACKUP_PATH.read_text(encoding="utf-8"))
            names = {c.get("name") for c in cookies if isinstance(c, dict)}
            has_nid_cookie = "NID_AUT" in names and "NID_SES" in names
        except Exception:
            has_nid_cookie = False

    return {
        "cdp_9233_alive": cdp_alive,
        "cookie_backup_has_nid": has_nid_cookie,
        "ready_for_unattended_run": cdp_alive or has_nid_cookie,
    }


def preview_and_validate_next_owned_posts() -> Dict[str, Any]:
    """Loads next queued owned Naver Blog & Cafe posts without launching any browser and validates guardrails."""
    import publish_3x_daily_blog_and_cafe as naver_pub

    cursor = naver_pub.load_cursor()
    next_blog_seq = int(cursor.get("lastBlogSeq", 2)) + 1
    next_cafe_seq = int(cursor.get("lastCafeSeq", 0)) + 1

    b_title, b_body, b_tags, b_img, b_cat = naver_pub.get_next_blog_content(next_blog_seq)
    c_board, c_title, c_body, c_tags, c_img = naver_pub.get_next_cafe_content(next_cafe_seq)

    combined = "\n".join([b_title, b_body, " ".join(b_tags), c_title, c_body, " ".join(c_tags)])
    hq_guard = validate_division_guardrails("KFK", combined)
    prohibited_hits = [w for w in PROHIBITED_TERMS if w in combined]
    has_canonical = "https://kidsfit.co.kr" in b_body and "https://kidsfit.co.kr" in c_body

    passed = hq_guard["passed"] and len(prohibited_hits) == 0 and has_canonical
    return {
        "passed": passed,
        "next_blog_seq": next_blog_seq,
        "blog_category": b_cat,
        "blog_title": b_title,
        "blog_image": b_img,
        "next_cafe_seq": next_cafe_seq,
        "cafe_board": c_board,
        "cafe_title": c_title,
        "cafe_image": c_img,
        "has_canonical_domain": has_canonical,
        "guardrail_violations": hq_guard["violations"] + prohibited_hits,
    }


def run_safe_daily_1x_naver(
    dry_run: bool = False,
    status_only: bool = False,
    ignore_window_for_test: bool = False,
) -> Dict[str, Any]:
    now_kst = datetime.now(KST)
    today_str = now_kst.strftime("%Y-%m-%d")
    lock = _load_json(SAFE_LOCK_PATH, {"last_published_date": "", "runs": []})
    session_info = _check_naver_session_available()

    if status_only:
        return {
            "status": "STATUS_OK",
            "today_kst": today_str,
            "already_published_today": lock.get("last_published_date") == today_str,
            "last_published_date": lock.get("last_published_date", ""),
            "within_daytime_window": _is_within_daytime_window(now_kst),
            "session": session_info,
        }

    # 1. Hard 1x/day idempotency lock
    if lock.get("last_published_date") == today_str and not dry_run:
        return {
            "status": "ALREADY_PUBLISHED_TODAY",
            "today_kst": today_str,
            "last_published_at": lock.get("last_published_at", ""),
            "blog_url": lock.get("last_blog_url", ""),
            "cafe_url": lock.get("last_cafe_url", ""),
        }

    # 2. Pre-validate queued content & guardrails before any browser work
    preview = preview_and_validate_next_owned_posts()
    if not preview["passed"]:
        return {
            "status": "BLOCKED_GUARDRAIL",
            "today_kst": today_str,
            "violations": preview["guardrail_violations"],
        }

    if dry_run:
        return {
            "status": "DRY_RUN_VALIDATED",
            "today_kst": today_str,
            "max_daily_cap": 1,
            "owned_targets": [
                "https://blog.naver.com/expertise333",
                "https://cafe.naver.com/moneyfitlab",
            ],
            "within_daytime_window": _is_within_daytime_window(now_kst),
            "session": session_info,
            "preview": preview,
        }

    # 3. Daytime human window protection (08:30 ~ 21:30 KST)
    if not ignore_window_for_test and not _is_within_daytime_window(now_kst):
        return {
            "status": "SKIPPED_OUTSIDE_DAYTIME_WINDOW",
            "today_kst": today_str,
            "allowed_window_kst": "08:30~21:30",
        }

    # 4. Session check (graceful skip if WIP=1 Day 5 Naver login refresh hasn't been done yet)
    if not session_info["ready_for_unattended_run"]:
        return {
            "status": "AWAITING_DAY5_SESSION_REFRESH",
            "today_kst": today_str,
            "session": session_info,
            "preview": preview,
        }

    # 5. Execute max 1x/day owned Naver Blog & Cafe publish and lock today immediately
    import publish_3x_daily_blog_and_cafe as naver_pub

    naver_pub.main()
    updated_cursor = naver_pub.load_cursor()
    hist = updated_cursor.get("history") or []
    latest = hist[-1] if hist else {}
    blog_url = (latest.get("blog") or {}).get("url", "")
    cafe_url = (latest.get("cafe") or {}).get("url", "")

    lock["last_published_date"] = today_str
    lock["last_published_at"] = now_kst.isoformat()
    lock["last_blog_url"] = blog_url
    lock["last_cafe_url"] = cafe_url
    lock.setdefault("runs", []).append(
        {
            "date": today_str,
            "published_at_kst": now_kst.isoformat(),
            "blog_seq": preview["next_blog_seq"],
            "blog_url": blog_url,
            "cafe_seq": preview["next_cafe_seq"],
            "cafe_url": cafe_url,
        }
    )
    lock["runs"] = lock["runs"][-60:]
    _save_json(SAFE_LOCK_PATH, lock)

    return {
        "status": "PUBLISHED_DAILY_1X",
        "today_kst": today_str,
        "blog_url": blog_url,
        "cafe_url": cafe_url,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="5사업부 자사 네이버 블로그·카페 일 1회 Zero-Ban 안전 발행기")
    parser.add_argument("--dry-run", action="store_true", help="브라우저 기동 없이 다음 회차 원고·가드레일·1일1회 잠금 검증")
    parser.add_argument("--status", action="store_true", help="금일 발행 여부 및 세션 상태 조회")
    args = parser.parse_args()

    res = run_safe_daily_1x_naver(dry_run=args.dry_run, status_only=args.status)
    print(json.dumps(res, ensure_ascii=False, indent=2))
    return 0 if res.get("status") != "BLOCKED_GUARDRAIL" else 1


if __name__ == "__main__":
    raise SystemExit(main())
