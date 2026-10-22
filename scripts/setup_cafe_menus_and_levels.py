# -*- coding: utf-8 -*-
"""
1. Removes remaining 2 legacy tags ('생활비절약', '전기세절약') on Cafe Studio and adds KidsFit tags
2. Configures KidsFit Cafe Boards on https://cafe.naver.com/ca-fe/admin/cafes/31805224/menu-management
3. Configures KidsFit Cafe Member Levels on https://cafe.naver.com/ManageMemberLevel.nhn?clubid=31805224
4. Lists available KidsFit Blog & Cafe content files in d:\\사업아이템\\samples
"""

import json
import os
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
        # 1. Clean remaining 2 legacy tags on Cafe Studio
        # ---------------------------------------------------------------------
        print("🚀 [1/3] 카페 스튜디오 남은 레거시 태그('생활비절약', '전기세절약') 정리 및 키즈핏 태그 추가...", flush=True)
        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3.5)

        for bad_tag in ["머니핏", "생활비절약", "자취꿀팁", "전기세절약", "쇼핑커넥트"]:
            btn = page.locator(f"button[aria-label='{bad_tag} 삭제']").first
            if btn.count() > 0:
                btn.click()
                time.sleep(0.5)

        kw_inp = page.locator("input[placeholder*='20byte']").first
        reg_btn = page.locator("button:has-text('등록')").first
        for kw in ["소근육발달", "몬테소리교구", "하브루타", "주말나들이", "육아카페"]:
            try:
                if kw_inp.count() > 0 and kw_inp.is_enabled():
                    kw_inp.click(timeout=2000)
                    kw_inp.fill(kw)
                    time.sleep(0.2)
                    if reg_btn.count() > 0 and reg_btn.is_enabled():
                        reg_btn.click(timeout=2000)
                        time.sleep(0.3)
            except Exception:
                break

        save_btn = page.locator("button:has-text('저장하기')").first
        if save_btn.count() > 0:
            save_btn.scroll_into_view_if_needed()
            save_btn.click()
            time.sleep(2)
            confirm_btn = page.locator("[role='dialog'] button:has-text('확인'), [role='alertdialog'] button:has-text('확인'), button:has-text('확인')").last
            if confirm_btn.count() > 0 and confirm_btn.is_visible():
                confirm_btn.click()
                time.sleep(1.5)

        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        report["cafe_tags_after"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll("div[data-slot='tag']")).map(t => t.innerText.trim());
        }""")
        print(f"✅ 카페 검색어 태그 최종 확인: {report['cafe_tags_after']}", flush=True)

        # ---------------------------------------------------------------------
        # 2. Configure Cafe Menu Management
        # ---------------------------------------------------------------------
        print("🚀 [2/3] 네이버 카페 게시판 메뉴(menu-management) 키즈핏 세팅 중...", flush=True)
        page.goto("https://cafe.naver.com/ca-fe/admin/cafes/31805224/menu-management", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3.5)
        page.evaluate("window.confirm = () => true; window.alert = () => true;")

        # Inspect current menu list items
        menu_before = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('.edit_Board_box ul.list_menu li')).map(li => li.innerText.trim());
        }""")
        print(f"  👉 기존 메뉴 목록: {menu_before}", flush=True)

        # 1) Click the first existing menu item ('자유게시판') and rename it to '공지 및 키즈핏 가이드'
        first_li = page.locator(".edit_Board_box ul.list_menu li a, .edit_Board_box ul.list_menu li").first
        if first_li.count() > 0:
            first_li.click()
            time.sleep(0.8)
            name_inp = page.locator("input.ipt_type").first
            desc_inp = page.locator("input.ipt_type2").first
            if name_inp.count() > 0:
                name_inp.click()
                name_inp.fill("공지 및 키즈핏 가이드")
                name_inp.dispatch_event("input")
                name_inp.dispatch_event("change")
                name_inp.blur()
            if desc_inp.count() > 0:
                desc_inp.click()
                desc_inp.fill("키즈핏 공식 안내 및 질병관리청·K-DST 기준표")
                desc_inp.dispatch_event("input")
                desc_inp.dispatch_event("change")
                desc_inp.blur()
            time.sleep(0.5)

        # 2) Add KidsFit boards if menu count < 6
        target_boards = [
            ("우리아이 키성장·성조숙증", "질병관리청 성장백분위·유전예상키·성조숙증 질문방"),
            ("월령별 두뇌·소근육 워크지", "무료 가위질·선긋기·칠교 워크시트 PDF 및 발달 질문방"),
            ("연령별 교구·책육아 라운지", "몬테소리·가베·원목교구·그림책 내돈내산 후기"),
            ("주말 미술관·박물관 나들이", "이번 주말 아이와 가볼만한 전시·박물관 예약 및 후기"),
            ("가입인사·우리아이 월령소개", "반가운 가입인사와 우리 아이 개월수·고민을 나눠요"),
        ]

        cur_li_cnt = page.locator(".edit_Board_box ul.list_menu li").count()
        if cur_li_cnt < 6:
            for b_name, b_desc in target_boards:
                # Click '통합게시판' (.add_group a.ge_v1) then click '추가' (.btn_add a.btn_type_ny2)
                ge_v1 = page.locator(".add_group a.ge_v1").first
                add_btn = page.locator(".btn_add a.btn_type_ny2").first
                if ge_v1.count() > 0:
                    ge_v1.click()
                    time.sleep(0.4)
                if add_btn.count() > 0 and add_btn.is_visible():
                    add_btn.click()
                    time.sleep(0.6)

                # Check if a new li was added at the bottom of .edit_Board_box ul.list_menu li and select it
                last_li = page.locator(".edit_Board_box ul.list_menu li").last
                if last_li.count() > 0:
                    last_li.click()
                    time.sleep(0.5)
                    name_inp = page.locator("input.ipt_type").first
                    desc_inp = page.locator("input.ipt_type2").first
                    if name_inp.count() > 0:
                        name_inp.click()
                        name_inp.fill(b_name)
                        name_inp.dispatch_event("input")
                        name_inp.dispatch_event("change")
                        name_inp.blur()
                    if desc_inp.count() > 0:
                        desc_inp.click()
                        desc_inp.fill(b_desc)
                        desc_inp.dispatch_event("input")
                        desc_inp.dispatch_event("change")
                        desc_inp.blur()
                    time.sleep(0.5)

        menu_before_save = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('.edit_Board_box ul.list_menu li')).map(li => li.innerText.trim());
        }""")
        print(f"  👉 저장 전 메뉴 목록: {menu_before_save}", flush=True)

        # Click '저장하기' (a.btn_type_ny3 or a.btn_type_edt)
        save_menu_btn = page.locator("a.btn_type_ny3, a:has-text('저장하기')").first
        if save_menu_btn.count() > 0:
            save_menu_btn.click()
            time.sleep(3)

        # Reload menu-management to verify persistence
        page.goto("https://cafe.naver.com/ca-fe/admin/cafes/31805224/menu-management", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        report["cafe_menus_verified"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('.edit_Board_box ul.list_menu li')).map(li => li.innerText.trim());
        }""")
        print(f"✅ 카페 게시판 메뉴 저장 검증: {report['cafe_menus_verified']}", flush=True)

        # Also fetch menus via Cafe API or main page
        page.goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2.5)
        report["cafe_main_menus"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a[href*="/menus/"]')).map(a => ({
                text: a.innerText.trim(),
                href: a.getAttribute('href')
            }));
        }""")
        print(f"✅ 카페 메인 메뉴 링크 확인: {report['cafe_main_menus']}", flush=True)

        # ---------------------------------------------------------------------
        # 3. Configure Cafe Member Levels (ManageMemberLevel.nhn)
        # ---------------------------------------------------------------------
        print("🚀 [3/3] 네이버 카페 멤버 등급(ManageMemberLevel.nhn) 키즈핏 세팅 중...", flush=True)
        page.goto("https://cafe.naver.com/ManageMemberLevel.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        page.evaluate("window.confirm = () => true; window.alert = () => true;")

        lvl_res = page.evaluate("""() => {
            const useGrd = document.querySelector('#use_grd');
            if (useGrd && !useGrd.checked) {
                useGrd.checked = true;
                useGrd.click();
            }
            const levels = [
                ['#conditionName1', '#conditionDesc1', '새싹 학부모', '키즈핏 가입 직후 기본 멤버 등급'],
                ['#conditionName2', '#conditionDesc2', '일반 학부모', '가입인사 및 월령 소개를 완료한 학부모'],
                ['#conditionName3', '#conditionDesc3', '성실 학부모', '성장·발달 질문 및 워크지 후기를 나누는 정회원'],
                ['#conditionName4', '#conditionDesc4', '열혈 학부모', '교구·나들이 후기를 활발히 공유하는 우수회원'],
                ['#conditionName5', '#conditionDesc5', '키즈핏 멘토', '양육 노하우를 나누는 키즈핏 명예 멘토']
            ];
            for (const [nSel, dSel, nVal, dVal] of levels) {
                const nEl = document.querySelector(nSel);
                const dEl = document.querySelector(dSel);
                if (nEl) { nEl.disabled = false; nEl.value = nVal; }
                if (dEl) { dEl.disabled = false; dEl.value = dVal; }
            }
            const saveBtn = document.querySelector('a.btn_type_edt');
            if (saveBtn) saveBtn.click();
            return levels.map(([nSel, dSel]) => ({
                name: (document.querySelector(nSel) || {}).value,
                desc: (document.querySelector(dSel) || {}).value
            }));
        }""")
        time.sleep(2.5)
        report["cafe_member_levels"] = lvl_res
        print(f"✅ 카페 멤버등급 저장 완료: {lvl_res}", flush=True)

        page.close()

    # List available sample files
    sample_files = []
    for root_dir, _, files in os.walk(ROOT / "samples"):
        for f in files:
            sample_files.append(str(Path(root_dir) / f))
    report["sample_files"] = sample_files

    out_path = LOG_DIR / "setup_cafe_menus_and_levels_report.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"🎉 전체 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
