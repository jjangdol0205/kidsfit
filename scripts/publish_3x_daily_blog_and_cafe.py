#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
D:\드림컴퍼니\5사업부\scripts\publish_3x_daily_blog_and_cafe.py
================================================================================
5사업부 (KidsFit Korea · https://kidsfit.co.kr)
자사 네이버 블로그(blog.naver.com/expertise333) & 네이버 카페(cafe.naver.com/moneyfitlab)
『키 성장 100% 전문 매거진 (3종 인포그래픽 본문 교차 배치) & 소통형 카페 코칭 통합 발행 엔진』

개편 핵심 원칙 (총 회장님 최종 승인 · 비서실장 B형 초고해상도 명세):
1. 주제 100% '키 성장 5대 핵심축' 단일화 (비성장 잡학 주제 0건 · C-Rank 보호):
   - 블로그 카테고리: '우리 아이 키성장·성조숙증' 고정
   - 카페 게시판: '우리아이 키성장·성조숙증' (menu_id=3) 고정
   - 블로그 에디토리얼 칼럼과 카페 소통형 코칭 원고를 100% 분리하여 유사문서 원천 차단
2. SmartEditor ONE 전문 에디토리얼 레이아웃 & 챌린지클래스 11/09 홈판+검색형 표준 (첫 문단 외부링크 노출 완전 제거):
   - 정중한 존댓말 일관성 + 모바일 3~4줄 압축 가독성 단락 + 한글/영문(PHV·KDCA)/구어체 연관검색어 변주 결합
   - 질병관리청(KDCA) 2017 공식 표준키 데이터 박스(만 10세 남아 138.8cm / 여아 139.1cm 등) 본문 포함
   - [섹션1 도입·공감] ➔ [Image 1 대표 배너] ➔ [섹션2 소아성장 메커니즘·KDCA 데이터] ➔ [Image 2 임상 차트]
     ➔ [섹션3 연령별 실전 루틴·D-30 시즌팁] ➔ [Image 3 연령별 실천 체크표]
     ➔ [하단 맺음말 & 무료진단(kidsfit.co.kr) · 마스터북 PDF(#kfk-latpeed-ebook-slot) · 큐레이션 · 공정위 고지]
3. 완전 무팝업(headless=True) 실행 및 기본 무소음(--silent 기본값, Standing Directive #14 준수):
   - 구버전 다회 스케줄 알림 문구 영구 폐지
   - 명시적 --notify 옵션 전달 시에만 텔레그램 알림 발송
================================================================================
"""

from __future__ import annotations

import argparse
from datetime import datetime
import json
import os
from pathlib import Path
import re
import sys
import time
from typing import Any, Dict, List, Optional, Tuple
import urllib.request

from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(r"D:\드림컴퍼니\5사업부")
SCRIPTS_DIR = ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from kfk_naver_editorial_designer import (  # noqa: E402
    BLOG_TARGET_CATEGORY,
    CAFE_TARGET_BOARD,
    CAFE_TARGET_MENU_ID,
    EDITORIAL_IMG_DIR,
    build_blog_editorial_package,
    build_cafe_coaching_package,
    validate_kfk_editorial_pair,
)

CURSOR_PATH = ROOT / "logs" / "blog_cafe_3x_daily_cursor.json"
CAFE_BRANDING_REPORT_PATH = ROOT / "logs" / "cafe_branding_audit_latest.json"
ENV_PATH = ROOT / ".env"
PROFILE_DIR = ROOT / ".naver-browser-profile"

CAFE_MENU_MAP = {
    "공지 및 키즈핏 가이드": 1,
    "연령별 무료 워크지 PDF": 2,
    "우리아이 키성장·성조숙증": 3,
    "두뇌·소근육·학습 질문방": 4,
    "주말 전시·박물관 나들이": 5,
    "매월 1일 리포트 인증방": 6,
    "반가운 가입인사": 7,
}

CAFE_MENU_ID_TO_NAME = {v: k for k, v in CAFE_MENU_MAP.items()}


def infer_blog_category(title: str = "", body: str = "") -> str:
    """100% 키 성장 전문 매거진 체제에 따라 모든 칼럼을 '우리 아이 키성장·성조숙증'으로 고정 라우팅합니다."""
    return BLOG_TARGET_CATEGORY


def infer_cafe_board(board_name: str = "", title: str = "", body: str = "") -> Tuple[int, str]:
    """100% 키 성장 전문 카페 코칭 체제에 따라 '우리아이 키성장·성조숙증'(menu_id=3)으로 고정 라우팅합니다."""
    return CAFE_TARGET_MENU_ID, CAFE_TARGET_BOARD


def load_env() -> Dict[str, str]:
    env: Dict[str, str] = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def send_telegram_message(text: str) -> Optional[int]:
    env = load_env()
    token = os.environ.get("TELEGRAM_BOT_TOKEN") or env.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID") or env.get("TELEGRAM_CHAT_ID") or "755033799"
    if not token:
        return None
    payload = json.dumps(
        {
            "chat_id": chat_id,
            "text": text,
            "disable_web_page_preview": True,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status


def sanitize_se_one_body(text: str) -> str:
    """
    Cleans text for Naver SmartEditor ONE: removes keycap emojis, ASCII divider clutter, and raw markdown bold.
    """
    cleaned = str(text or "")
    replacements = {
        "1️⃣": "■ 1.",
        "2️⃣": "■ 2.",
        "3️⃣": "■ 3.",
        "4️⃣": "■ 4.",
        "5️⃣": "■ 5.",
        "\ufe0f\u20e3": ".",
        "\u20e3": ".",
    }
    for k, v in replacements.items():
        cleaned = cleaned.replace(k, v)

    out_lines: List[str] = []
    for line in cleaned.splitlines():
        s = line.strip()
        if s and all(ch in "─━═—-_*=" for ch in s) and len(s) >= 3:
            continue
        out_lines.append(line.replace("**", ""))

    return "\n".join(out_lines).strip()


def get_next_blog_editorial_package(blog_seq: int) -> Dict[str, Any]:
    """Returns full 3-section + 3-image blog editorial package."""
    return build_blog_editorial_package(blog_seq, out_dir=EDITORIAL_IMG_DIR)


def get_next_blog_content(blog_seq: int) -> Tuple[str, str, List[str], str, str]:
    """
    Backward-compatible tuple accessor: (title, full_body, tags, cover_img_path, category_name).
    Note: External links appear ONLY at the very bottom bridge.
    """
    pkg = get_next_blog_editorial_package(blog_seq)
    return (
        pkg["title"],
        sanitize_se_one_body(pkg["full_body"]),
        pkg["tags"],
        pkg["images"][0],
        pkg["category"],
    )


def get_next_cafe_content(cafe_seq: int) -> Tuple[str, str, str, List[str], str]:
    """Returns (board, title, body, tags, img_path) for the given cafe sequence number."""
    pkg = build_cafe_coaching_package(cafe_seq, out_dir=EDITORIAL_IMG_DIR)
    return (
        pkg["board"],
        pkg["title"],
        sanitize_se_one_body(pkg["body"]),
        pkg["tags"],
        pkg["image"],
    )


def type_multiline_into_se_one(page, body: str, trailing_blank_line: bool = True) -> None:
    sanitized = sanitize_se_one_body(body)
    lines = sanitized.splitlines()
    for idx, line in enumerate(lines):
        clean = line.strip()
        if clean:
            page.keyboard.insert_text(clean)
            if clean.startswith("https://") or clean.startswith("http://"):
                page.keyboard.press("Space")
                time.sleep(0.20)
                page.keyboard.press("Enter")
                time.sleep(0.85)
                continue
        if idx < len(lines) - 1 or trailing_blank_line:
            page.keyboard.press("Enter")
            time.sleep(0.03)


def ensure_naver_session_cookies(context) -> None:
    backup_file = PROFILE_DIR / "naver_cookies_backup.json"
    try:
        current_names = {ck["name"] for ck in context.cookies("https://www.naver.com")}
        if "NID_AUT" not in current_names and backup_file.exists():
            saved = json.loads(backup_file.read_text(encoding="utf-8"))
            exp_365 = int(time.time()) + 365 * 86400
            for ck in saved:
                if ck.get("expires", -1) <= 0:
                    ck["expires"] = exp_365
            context.add_cookies(saved)
            print("  🔒 [세션 복원] 저장된 네이버 영구 로그인 쿠키(NID_AUT/NID_SES)를 복원했습니다.", flush=True)
        elif "NID_AUT" in current_names:
            all_ck = [ck for ck in context.cookies() if "naver.com" in ck.get("domain", "")]
            exp_365 = int(time.time()) + 365 * 86400
            for ck in all_ck:
                if ck.get("expires", -1) <= 0:
                    ck["expires"] = exp_365
            context.add_cookies(all_ck)
            backup_file.parent.mkdir(parents=True, exist_ok=True)
            backup_file.write_text(json.dumps(all_ck, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"  ⚠️ 쿠키 동기화 경고: {e}", flush=True)


def _focus_trailing_text_paragraph(page, target) -> None:
    """
    Ensures the SmartEditor ONE cursor is positioned inside a text paragraph AFTER the last component
    (e.g., immediately below a newly uploaded infographic image).
    """
    info = target.evaluate(
        """() => {
            const comps = Array.from(
                document.querySelectorAll('.se-components-wrap > .se-component, .se-main-container > .se-component')
            ).filter(el => !el.classList.contains('se-documentTitle'));
            const last = comps[comps.length - 1];
            if (!last) return { state: 'empty' };
            if (last.classList.contains('se-text')) {
                const paras = last.querySelectorAll('.se-text-paragraph');
                const p = paras[paras.length - 1];
                if (p) p.scrollIntoView({ block: 'center' });
                return { state: 'last_is_text' };
            }
            const bottom = document.querySelector('.se-canvas-bottom');
            if (bottom) {
                bottom.scrollIntoView({ block: 'center' });
                const r = bottom.getBoundingClientRect();
                return { state: 'click_canvas_bottom', x: r.left + Math.min(120, Math.max(20, r.width / 3)), y: r.top + 16 };
            }
            last.scrollIntoView({ block: 'center' });
            const r = last.getBoundingClientRect();
            return { state: 'click_after_image', x: r.right - 6, y: r.bottom - 6 };
        }"""
    )

    state = (info or {}).get("state", "")
    if state == "click_canvas_bottom":
        try:
            bottom_loc = target.locator(".se-canvas-bottom").first
            if bottom_loc.count() > 0:
                bottom_loc.click(position={"x": 80, "y": 15}, force=True)
                time.sleep(0.45)
        except Exception:
            pass

    # Verify again if last component is now se-text; if still image, press ArrowDown + Enter on last image
    still_not_text = target.evaluate(
        """() => {
            const comps = Array.from(
                document.querySelectorAll('.se-components-wrap > .se-component, .se-main-container > .se-component')
            ).filter(el => !el.classList.contains('se-documentTitle'));
            const last = comps[comps.length - 1];
            return Boolean(last && !last.classList.contains('se-text'));
        }"""
    )
    if still_not_text:
        try:
            last_comp = target.locator(".se-component.se-image").last
            if last_comp.count() > 0:
                last_comp.click(force=True)
                time.sleep(0.25)
                page.keyboard.press("ArrowRight")
                time.sleep(0.15)
                page.keyboard.press("Enter")
                time.sleep(0.45)
        except Exception:
            pass

    body_para_last = target.locator(".se-component.se-text .se-text-paragraph").last
    if body_para_last.count() > 0:
        body_para_last.scroll_into_view_if_needed()
        body_para_last.click(force=True)
        time.sleep(0.30)


def _upload_single_image_into_se_one(page, target, img_path: str, expected_img_count: int) -> bool:
    if not img_path or not Path(img_path).exists():
        return False
    img_btn = target.locator("button.se-image-toolbar-button").first
    if img_btn.count() == 0:
        return False
    try:
        with page.expect_file_chooser(timeout=8000) as fc_info:
            img_btn.click(force=True)
        fc = fc_info.value
        fc.set_files(img_path)

        # Wait until the image component mounts and upload finishes
        for _ in range(24):
            time.sleep(0.5)
            cnt = target.locator(".se-component.se-image").count()
            uploading = target.locator(".se-is-loading, .se-loading, .se-image-uploading").count()
            if cnt >= expected_img_count and uploading == 0:
                break
        time.sleep(1.0)
        return True
    except Exception as e:
        print(f"⚠️ 블로그 인포그래픽 첨부 경고 ({Path(img_path).name}): {e}", flush=True)
        return False


def publish_blog_post(
    context,
    title: str,
    body: str,
    tags: List[str],
    img_path: str = "",
    category_name: str = BLOG_TARGET_CATEGORY,
    sections: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """
    Publishes a professional Pediatric Growth Magazine column on Naver Blog (SmartEditor ONE).
    When `sections` is provided, interleaves Text 1 -> Image 1 -> Text 2 -> Image 2 -> Text 3 -> Image 3 -> Bottom Bridge.
    """
    ensure_naver_session_cookies(context)
    category_name = BLOG_TARGET_CATEGORY
    page = context.new_page()
    page.on("dialog", lambda d: d.accept())
    try:
        print(f"📝 [블로그 매거진 발행 중] ({category_name}) {title[:48]}...", flush=True)
        page.goto(
            "https://blog.naver.com/PostWriteForm.naver?blogId=expertise333",
            wait_until="domcontentloaded",
            timeout=35000,
        )
        time.sleep(5.5)

        target = page
        for f in page.frames:
            if "PostWriteForm" in f.url or f.name == "mainFrame":
                if f.locator(".se-component.se-text, .se-documentTitle").count() > 0:
                    target = f
                    break

        target.evaluate(
            """() => {
                document.querySelectorAll('button.se-popup-button-cancel, button.se-help-panel-close-button').forEach(b => b.click());
            }"""
        )
        time.sleep(0.6)

        title_para = target.locator(".se-title-text .se-text-paragraph, .se-documentTitle .se-text-paragraph").first
        if title_para.count() > 0:
            title_para.click(force=True)
            time.sleep(0.3)
            page.keyboard.insert_text(title)
            time.sleep(0.4)

        body_para = target.locator(".se-component.se-text .se-text-paragraph").first
        if body_para.count() > 0:
            body_para.click(force=True)
            time.sleep(0.3)

        if sections:
            uploaded_cnt = 0
            for block in sections:
                b_type = block.get("type")
                if b_type == "text":
                    _focus_trailing_text_paragraph(page, target)
                    type_multiline_into_se_one(page, block.get("content", ""), trailing_blank_line=True)
                    time.sleep(0.45)
                elif b_type == "image":
                    _focus_trailing_text_paragraph(page, target)
                    uploaded_cnt += 1
                    ok = _upload_single_image_into_se_one(
                        page, target, block.get("path", ""), expected_img_count=uploaded_cnt
                    )
                    if not ok:
                        uploaded_cnt -= 1
                    time.sleep(0.5)
        else:
            # Fallback if called with plain body + single img_path
            type_multiline_into_se_one(page, body, trailing_blank_line=True)
            if img_path and Path(img_path).exists():
                _upload_single_image_into_se_one(page, target, img_path, expected_img_count=1)

        time.sleep(1.2)

        # Open Publish Drawer
        target.evaluate(
            """() => {
                const btn = document.querySelector("button[class*='publish_btn']");
                if (btn) btn.click();
            }"""
        )
        time.sleep(1.8)

        # Select '우리 아이 키성장·성조숙증' category
        try:
            target.evaluate(
                """() => {
                    const catBtn = document.querySelector("button[aria-label*='카테고리'], div[class*='option_category'] button, button[class*='selectbox_button']");
                    if (catBtn) catBtn.click();
                }"""
            )
            time.sleep(0.6)
            target.evaluate(
                """(desiredCat) => {
                    const items = Array.from(document.querySelectorAll("label, span, button, li, a"));
                    const match = items.find(el => (el.innerText || '').trim() === desiredCat);
                    if (match) match.click();
                }""",
                category_name,
            )
            time.sleep(0.5)
        except Exception as e:
            print(f"⚠️ 블로그 카테고리 선택 경고: {e}", flush=True)

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

        target.evaluate(
            """() => {
                const confirmBtn = document.querySelector("button[data-testid='seOnePublishBtn'], button[class*='confirm_btn']");
                if (confirmBtn) confirmBtn.click();
            }"""
        )
        time.sleep(7.0)

        final_url = target.url if target != page else page.url
        m = re.search(r"logNo=(\d+)", final_url) or re.search(r"expertise333/(\d+)", final_url)
        if m:
            final_url = f"https://blog.naver.com/expertise333/{m.group(1)}"
        else:
            page.goto(
                "https://blog.naver.com/PostList.naver?blogId=expertise333&categoryNo=0&from=postList",
                wait_until="domcontentloaded",
                timeout=15000,
            )
            time.sleep(2.5)
            latest_log = page.evaluate(
                """() => {
                    const a = Array.from(document.querySelectorAll('a')).find(el => el.href && el.href.includes('logNo='));
                    if (!a) return null;
                    const m = a.href.match(/logNo=(\\d+)/);
                    return m ? m[1] : null;
                }"""
            )
            final_url = (
                f"https://blog.naver.com/expertise333/{latest_log}"
                if latest_log
                else "https://blog.naver.com/expertise333"
            )

        print(f"  ✅ 블로그 매거진 발행 완료 ({category_name}): {final_url}", flush=True)
        return final_url
    finally:
        page.close()


def publish_cafe_post(context, board_name: str, title: str, body: str, tags: List[str], img_path: str) -> str:
    ensure_naver_session_cookies(context)
    menu_id, exact_board_name = infer_cafe_board(board_name, title, body)
    page = context.new_page()
    page.on("dialog", lambda d: d.accept())
    try:
        print(f"☕ [카페 소통글 발행 중] ({exact_board_name} · menu={menu_id}) {title[:46]}...", flush=True)
        write_url = f"https://cafe.naver.com/ca-fe/cafes/31805224/menus/{menu_id}/articles/write?boardType=L"
        page.goto(write_url, wait_until="commit", timeout=30000)
        time.sleep(4.8)

        for f in page.frames:
            try:
                f.evaluate("window.confirm = () => true; window.alert = () => true; window.onbeforeunload = null;")
            except Exception:
                pass

        for sel in ["button.se-popup-button-cancel", "button.se-help-panel-close-button"]:
            btn = page.locator(sel).first
            if btn.count() > 0 and btn.is_visible():
                btn.click(force=True)
                time.sleep(0.4)

        title_inp = page.locator("textarea.textarea_input[placeholder*='제목']").first
        if title_inp.count() > 0:
            title_inp.click(force=True)
            title_inp.fill(title)
            time.sleep(0.4)

        page.evaluate(
            """() => {
                document.querySelectorAll('button.BaseButton--gray, .se-popup-close-button, .se-popup-button-cancel, .se-help-panel-close-button').forEach(b => b.click());
                document.querySelectorAll('.se-popup-dim').forEach(d => d.remove());
            }"""
        )
        time.sleep(0.4)

        para_rect = page.evaluate(
            """() => {
                const p = document.querySelector('.se-text-paragraph');
                if (!p) return null;
                p.scrollIntoView({ block: 'center' });
                return p.getBoundingClientRect();
            }"""
        )
        if para_rect:
            page.mouse.click(para_rect["x"] + 50, para_rect["y"] + 10)
            time.sleep(0.4)

        # Upload coaching mission card first as visual header, then type warm parent coaching body below
        if img_path and Path(img_path).exists():
            img_btn = page.locator("button.se-image-toolbar-button").first
            if img_btn.count() > 0:
                try:
                    with page.expect_file_chooser(timeout=6000) as fc_info:
                        img_btn.click(force=True)
                    fc = fc_info.value
                    fc.set_files([img_path])
                    time.sleep(4.0)
                except Exception as e:
                    print(f"⚠️ 카페 이미지 첨부 스킵: {e}", flush=True)

        _focus_trailing_text_paragraph(page, page)
        type_multiline_into_se_one(page, body, trailing_blank_line=False)
        time.sleep(0.8)

        tag_inp = page.locator("input.tag_input").first
        if tag_inp.count() > 0:
            for t in tags[:10]:
                clean_t = t.strip().lstrip("#")
                if not clean_t:
                    continue
                tag_inp.click(force=True)
                tag_inp.fill(clean_t)
                page.keyboard.press("Enter")
                time.sleep(0.15)

        for f in page.frames:
            try:
                f.evaluate("window.confirm = () => true; window.alert = () => true; window.onbeforeunload = null;")
            except Exception:
                pass

        reg_btn = page.locator(
            "button.BaseButton--skinGreen:has-text('등록'), a.BaseButton--skinGreen:has-text('등록')"
        ).first
        if reg_btn.count() > 0:
            reg_btn.scroll_into_view_if_needed()
            reg_btn.click(force=True)
            time.sleep(8.0)

        final_url = page.url
        m_art = re.search(r"articleid(?:=|%3D)(\d+)", final_url, re.IGNORECASE) or re.search(
            r"/articles/(\d+)", final_url
        )
        if m_art:
            final_url = f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{m_art.group(1)}"
        elif "write" in final_url:
            try:
                page.goto("https://cafe.naver.com/moneyfitlab", wait_until="commit", timeout=15000)
            except Exception:
                pass
            time.sleep(2.5)
            try:
                latest_id = page.evaluate(
                    """async () => {
                        const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=5', { credentials: 'include' });
                        const j = await r.json();
                        const list = (j.message && j.message.result && j.message.result.articleList) || [];
                        return list.length > 0 ? list[0].articleId : null;
                    }"""
                )
                if latest_id:
                    final_url = f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{latest_id}"
            except Exception:
                final_url = "https://cafe.naver.com/moneyfitlab"
        print(f"  ✅ 카페 발행 완료 ({exact_board_name}): {final_url}", flush=True)
        return final_url
    finally:
        page.close()


def inspect_and_align_cafe_branding(context) -> Dict[str, Any]:
    """
    Safely inspects Naver Cafe (clubid=31805224) basic info in headless mode without triggering CAPTCHAs.
    Updates cafe description/intro to '키즈핏 우리아이 키성장·성장습관 연구소' if legacy '머니핏' copy is present,
    and checks whether the 90-day cafe name cooldown applies.
    """
    ensure_naver_session_cookies(context)
    page = context.new_page()
    page.on("dialog", lambda d: d.accept())
    result: Dict[str, Any] = {
        "checked_at": datetime.now().isoformat(),
        "club_id": 31805224,
        "target_name": "키즈핏 우리아이 키성장·성장습관 연구소",
        "before_name": "",
        "before_desc": "",
        "name_updated": False,
        "desc_updated": False,
        "note": "",
    }
    try:
        page.goto(
            "https://cafe.naver.com/ManageBaseInformation.nhn?clubid=31805224",
            wait_until="domcontentloaded",
            timeout=25000,
        )
        time.sleep(3.5)

        target = page
        for f in page.frames:
            if "ManageCafeInfo" in f.url or f.name == "cafe_main":
                target = f
                break

        info = target.evaluate(
            """() => {
                const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea')).map(el => ({
                    name: el.name || el.id || '',
                    value: el.value || '',
                    disabled: Boolean(el.disabled || el.readOnly),
                    maxLength: el.maxLength || 0
                }));
                const bodyText = (document.body && document.body.innerText) ? document.body.innerText.slice(0, 2500) : '';
                const hasCaptcha = Boolean(document.querySelector('img[src*="captcha"], #captcha, [class*="captcha"]'));
                return { url: location.href, inputs, bodyText, hasCaptcha };
            }"""
        )

        result["manage_url"] = info.get("url", "")
        if info.get("hasCaptcha"):
            result["note"] = "CAPTCHA 감지됨 — 무리한 우회 없이 즉시 중단(안전 보호 수칙 준수)"
            return result

        new_name = "키즈핏 우리아이 키성장·성장습관 연구소"
        new_desc = (
            "키즈핏 우리아이 키성장·성장습관 연구소 공식 카페입니다. "
            "질병관리청(KDCA) 성장 백분위·뼈나이 해석부터 밤 9시반 통잠·칼슘/D3/아연 영양·숨은 키 바른자세·점프 운동까지 "
            "또래보다 더 건강하게 자라는 성장 골든타임 실천 루틴을 함께 나눕니다."
        )

        updated = target.evaluate(
            """({ newName, newDesc }) => {
                const out = { beforeName: '', beforeDesc: '', nameEditable: false, descUpdated: false, nameAttempted: false };
                const nameEl = document.querySelector('input[name*="cafeName"], input[id*="cafeName"], input[name="clubname"]');
                if (nameEl) {
                    out.beforeName = nameEl.value || '';
                    if (!nameEl.disabled && !nameEl.readOnly) {
                        out.nameEditable = true;
                        if (out.beforeName.includes('머니핏')) {
                            nameEl.value = newName;
                            nameEl.dispatchEvent(new Event('input', { bubbles: true }));
                            nameEl.dispatchEvent(new Event('change', { bubbles: true }));
                            out.nameAttempted = true;
                        }
                    }
                }
                const descEl = document.querySelector('textarea[name*="clubdesc"], textarea[id*="clubdesc"], textarea[name*="CafeDesc"], textarea');
                if (descEl && !descEl.disabled && !descEl.readOnly) {
                    out.beforeDesc = descEl.value || '';
                    if (out.beforeDesc.includes('머니핏') || out.beforeDesc.includes('생활비') || !out.beforeDesc.includes('키즈핏')) {
                        descEl.value = newDesc;
                        descEl.dispatchEvent(new Event('input', { bubbles: true }));
                        descEl.dispatchEvent(new Event('change', { bubbles: true }));
                        out.descUpdated = true;
                    }
                }
                if (out.nameAttempted || out.descUpdated) {
                    const submitBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => {
                        const t = (el.innerText || el.value || '').trim();
                        return t === '저장' || t === '확인' || t === '수정하기' || t === '적용';
                    });
                    if (submitBtn) submitBtn.click();
                }
                return out;
            }""",
            {"newName": new_name, "newDesc": new_desc},
        )
        time.sleep(2.5)

        result["before_name"] = updated.get("beforeName", "")
        result["before_desc"] = updated.get("beforeDesc", "")
        result["name_editable"] = updated.get("nameEditable", False)
        result["name_updated"] = updated.get("nameAttempted", False)
        result["desc_updated"] = updated.get("descUpdated", False)
        result["page_excerpt"] = (info.get("bodyText") or "")[:500]
        if not updated.get("nameEditable") and "머니핏" in (result["before_name"] or result["page_excerpt"]):
            result["note"] = "네이버 카페명 90일 변경 제한 기간 적용 중 — 카페 소개글·게시판·발행 카드 브랜딩을 '키즈핏 우리아이 키성장·성장습관 연구소'로 정돈 완료"
        else:
            result["note"] = "카페 기본정보 및 소개글 키즈핏 성장 연구소 브랜딩 점검·반영 완료"
    except Exception as e:
        result["note"] = f"카페 관리 페이지 조회 예외(무해 스킵): {e}"
    finally:
        CAFE_BRANDING_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        CAFE_BRANDING_REPORT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        page.close()
    return result


def load_cursor() -> Dict[str, Any]:
    if CURSOR_PATH.exists():
        try:
            return json.loads(CURSOR_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "lastBlogSeq": 30,
        "lastCafeSeq": 28,
        "history": [],
    }


def main(notify: bool = False, check_cafe_branding: bool = False) -> Dict[str, Any]:
    cursor = load_cursor()
    next_blog_seq = int(cursor.get("lastBlogSeq", 30)) + 1
    next_cafe_seq = int(cursor.get("lastCafeSeq", 28)) + 1

    blog_pkg = get_next_blog_editorial_package(next_blog_seq)
    cafe_pkg = build_cafe_coaching_package(next_cafe_seq, out_dir=EDITORIAL_IMG_DIR)

    violations = validate_kfk_editorial_pair(blog_pkg, cafe_pkg)
    if violations:
        raise RuntimeError(f"KFK Naver editorial guardrail violations: {violations}")

    hq_shorts_dir = str(ROOT.parent / "shorts_automation_hq")
    if hq_shorts_dir not in sys.path:
        sys.path.insert(0, hq_shorts_dir)
    from naver_permanent_session_keeper import (
        persist_refreshed_cookies_from_context,
        sync_cookie_vaults_from_best_source,
    )

    owned_headless_profile = ROOT / ".naver-headless-owned-profile"
    owned_headless_profile.mkdir(parents=True, exist_ok=True)
    seeded_cookies, _ = sync_cookie_vaults_from_best_source()

    branding_info: Optional[Dict[str, Any]] = None

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(owned_headless_profile),
            channel="chrome",
            headless=True,
            viewport={"width": 1440, "height": 960},
            locale="ko-KR",
            timezone_id="Asia/Seoul",
            args=[
                "--no-first-run",
                "--no-default-browser-check",
                "--disable-blink-features=AutomationControlled",
            ],
        )
        try:
            if seeded_cookies:
                try:
                    context.add_cookies(seeded_cookies)
                except Exception:
                    pass
            if check_cafe_branding:
                branding_info = inspect_and_align_cafe_branding(context)
            blog_url = publish_blog_post(
                context,
                title=blog_pkg["title"],
                body=blog_pkg["full_body"],
                tags=blog_pkg["tags"],
                img_path=blog_pkg["images"][0],
                category_name=blog_pkg["category"],
                sections=blog_pkg["sections"],
            )
            cafe_url = publish_cafe_post(
                context,
                board_name=cafe_pkg["board"],
                title=cafe_pkg["title"],
                body=cafe_pkg["body"],
                tags=cafe_pkg["tags"],
                img_path=cafe_pkg["image"],
            )
            persist_refreshed_cookies_from_context(context)
        finally:
            context.close()

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    cursor["lastBlogSeq"] = next_blog_seq
    cursor["lastCafeSeq"] = next_cafe_seq
    cursor.setdefault("history", []).append(
        {
            "publishedAt": now_str,
            "blog": {
                "seq": next_blog_seq,
                "topic_id": blog_pkg["topic_id"],
                "category": blog_pkg["category"],
                "title": blog_pkg["title"],
                "images": blog_pkg["images"],
                "url": blog_url,
            },
            "cafe": {
                "seq": next_cafe_seq,
                "topic_id": cafe_pkg["topic_id"],
                "board": cafe_pkg["board"],
                "title": cafe_pkg["title"],
                "image": cafe_pkg["image"],
                "url": cafe_url,
            },
        }
    )
    CURSOR_PATH.parent.mkdir(parents=True, exist_ok=True)
    CURSOR_PATH.write_text(json.dumps(cursor, ensure_ascii=False, indent=2), encoding="utf-8")

    # Standing Directive #14: Default is silent (--silent); send Telegram ONLY when explicitly requested via --notify
    if notify:
        msg = (
            f"✅ [키즈핏 소아성장 연구소 · 일 1회 에디토리얼 발행 완료]\n"
            f"• 블로그 (#{next_blog_seq} · {blog_pkg['category']}): {blog_pkg['title']}\n"
            f"  {blog_url}\n"
            f"• 카페 (#{next_cafe_seq} · {cafe_pkg['board']}): {cafe_pkg['title']}\n"
            f"  {cafe_url}"
        )
        send_telegram_message(msg)

    return {
        "ok": True,
        "blog_seq": next_blog_seq,
        "blog_title": blog_pkg["title"],
        "blog_url": blog_url,
        "blog_images": blog_pkg["images"],
        "cafe_seq": next_cafe_seq,
        "cafe_title": cafe_pkg["title"],
        "cafe_url": cafe_url,
        "cafe_image": cafe_pkg["image"],
        "cafe_branding": branding_info,
    }


def cli_main() -> int:
    parser = argparse.ArgumentParser(description="5사업부 키즈핏 네이버 블로그(3종 인포그래픽 매거진) & 카페 통합 발행기")
    parser.add_argument("--silent", action="store_true", default=True, help="일상 텔레그램 알림 무소음 실행 (기본값)")
    parser.add_argument("--notify", action="store_true", help="명시적 완료 알림 발송 시에만 지정")
    parser.add_argument("--check-cafe-branding", action="store_true", help="카페 기본정보 소개글 브랜딩 점검·정돈 동시 수행")
    args = parser.parse_args()

    res = main(notify=bool(args.notify), check_cafe_branding=bool(args.check_cafe_branding))
    print(json.dumps(res, ensure_ascii=False, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(cli_main())
