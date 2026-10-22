# -*- coding: utf-8 -*-
"""
1. Configures and saves the 7 KidsFit boards on https://cafe.naver.com/ca-fe/admin/cafes/31805224/menu-management
2. Inspects the Cafe Write editor and Blog Write editor DOM selectors
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\사업아이템")
LOG_DIR = ROOT / "logs"


def main():
    report = {}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()

        # ---------------------------------------------------------------------
        # 1. Configure and Save Cafe Menus
        # ---------------------------------------------------------------------
        print("🚀 [1/3] 네이버 카페 게시판 메뉴(menu-management) 7대 키즈핏 게시판 구성 및 저장 중...", flush=True)
        page.goto("https://cafe.naver.com/ca-fe/admin/cafes/31805224/menu-management", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3.5)
        page.evaluate("window.confirm = () => true; window.alert = () => true;")

        # 1) Click existing '자유게시판' (or first board in the right list) and rename to '📢 공지 및 키즈핏 가이드'
        existing_board = page.locator("a.ge_v1:has-text('자유게시판'), a.ge_v1:has-text('공지')").last
        if existing_board.count() > 0:
            existing_board.click()
            time.sleep(0.6)
            inp_name = page.locator("input.ipt_type").first
            inp_desc = page.locator("input.ipt_type2").first
            if inp_name.count() > 0:
                inp_name.click()
                inp_name.fill("공지 및 키즈핏 가이드")
                inp_name.dispatch_event("input")
                inp_name.dispatch_event("change")
                inp_name.blur()
            if inp_desc.count() > 0:
                inp_desc.click()
                inp_desc.fill("키즈핏 공식 안내 및 질병관리청·K-DST 기준표")
                inp_desc.dispatch_event("input")
                inp_desc.dispatch_event("change")
                inp_desc.blur()
            time.sleep(0.5)

        # Check how many boards currently exist in the right panel
        cur_ge_count = page.locator("a.ge_v1").count()
        print(f"  👉 현재 a.ge_v1 총 개수(좌측 템플릿 1개 포함): {cur_ge_count}", flush=True)

        new_boards = [
            ("연령별 무료 워크지 PDF", "무료 가위질·선긋기·코넬복습·키성장기록표 PDF 자료실"),
            ("우리아이 키성장·성조숙증", "질병관리청 성장백분위·유전예상키·성조숙증 질문방"),
            ("두뇌·소근육·학습 질문방", "월령별 오감놀이·가베·문장제수학·백지복습 질문방"),
            ("주말 전시·박물관 나들이", "아이와 가볼만한 미술관·박물관 예약 및 하브루타 후기"),
            ("매월 1일 리포트 인증방", "매월 1일 키즈핏 성장·학습 리포트 캡처 인증 챌린지"),
            ("반가운 가입인사", "아이 나이(개월수)와 요즘 고민을 한 줄로 남겨주세요"),
        ]

        if cur_ge_count < 7:
            for b_name, b_desc in new_boards:
                # Click '통합게시판' template on the left (first a.ge_v1)
                tmpl = page.locator("a.ge_v1:has-text('통합게시판')").first
                add_btn = page.locator("a:text-is('추가')").first
                if tmpl.count() > 0 and add_btn.count() > 0:
                    tmpl.click()
                    time.sleep(0.3)
                    add_btn.click()
                    time.sleep(0.6)

                    # Now the newly added item is selected (or click the last a.ge_v1)
                    last_board = page.locator("a.ge_v1").last
                    last_board.click()
                    time.sleep(0.4)

                    inp_name = page.locator("input.ipt_type").first
                    inp_desc = page.locator("input.ipt_type2").first
                    if inp_name.count() > 0:
                        inp_name.click()
                        inp_name.fill(b_name)
                        inp_name.dispatch_event("input")
                        inp_name.dispatch_event("change")
                        inp_name.blur()
                    if inp_desc.count() > 0:
                        inp_desc.click()
                        inp_desc.fill(b_desc)
                        inp_desc.dispatch_event("input")
                        inp_desc.dispatch_event("change")
                        inp_desc.blur()
                    time.sleep(0.4)

        # Click '저장하기' (a.btn_type_edt)
        save_btn = page.locator("a.btn_type_edt, a:has-text('저장하기')").first
        if save_btn.count() > 0:
            save_btn.scroll_into_view_if_needed()
            save_btn.click()
            print("  👉 [저장하기] 클릭 완료!", flush=True)
            time.sleep(3.5)

        # Verify by reloading menu-management
        page.goto("https://cafe.naver.com/ca-fe/admin/cafes/31805224/menu-management", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        report["cafe_menus_after"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a.ge_v1')).map(a => a.innerText.trim());
        }""")
        print(f"✅ 카페 메뉴 저장 후 a.ge_v1 목록: {report['cafe_menus_after']}", flush=True)

        # Also check Cafe menus via API
        menus_api = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/SideMenuList?clubid=31805224', { credentials: 'include' });
            const j = await r.json();
            return j;
        }""")
        report["cafe_side_menu_api"] = menus_api

        # ---------------------------------------------------------------------
        # 2. Inspect Cafe Article Write Page
        # ---------------------------------------------------------------------
        print("🔍 [2/3] 네이버 카페 글쓰기 에디터 구조 확인 중...", flush=True)
        page.goto("https://cafe.naver.com/ca-fe/cafes/31805224/menus/1/articles/write?boardType=L", wait_until="domcontentloaded", timeout=25000)
        time.sleep(4)
        report["cafe_write_dom"] = page.evaluate("""() => {
            return {
                url: location.href,
                inputs: Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"]')).map(el => ({
                    tag: el.tagName,
                    placeholder: el.placeholder || '',
                    className: el.className,
                    id: el.id,
                    text: (el.innerText || el.value || '').slice(0, 50)
                })),
                buttons: Array.from(document.querySelectorAll('button, a[role="button"]')).map(b => ({
                    text: b.innerText.trim(),
                    className: b.className
                })).filter(b => b.text.length > 0)
            };
        }""")

        # ---------------------------------------------------------------------
        # 3. Inspect Blog Write Page
        # ---------------------------------------------------------------------
        print("🔍 [3/3] 네이버 블로그 글쓰기 에디터(SmartEditor ONE) 구조 확인 중...", flush=True)
        page.goto("https://blog.naver.com/PostWriteForm.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=25000)
        time.sleep(4.5)
        report["blog_write_frames"] = []
        for f in page.frames:
            try:
                f_info = f.evaluate("""() => ({
                    url: location.href,
                    editables: Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"], .se-title-text, .se-component-content, .se-text-paragraph')).map(el => ({
                        tag: el.tagName,
                        className: el.className,
                        placeholder: el.placeholder || '',
                        text: (el.innerText || el.value || '').slice(0, 60)
                    })),
                    buttons: Array.from(document.querySelectorAll('button')).map(b => ({
                        text: b.innerText.trim(),
                        className: b.className
                    })).filter(b => b.text.length > 0).slice(0, 30)
                })""")
                report["blog_write_frames"].append(f_info)
            except Exception:
                pass

        page.close()

    out_path = LOG_DIR / "menus_and_editors_report.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"🎉 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
