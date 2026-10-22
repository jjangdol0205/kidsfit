# -*- coding: utf-8 -*-
"""
1. Updates Cafe Studio base-info with exact byte/length constraints & tag chip selectors
2. Updates Blog Categories on AdminMain.naver -> AdminCategoryView.naver using `tree` and `category` JS APIs
3. Updates Blog Subject (`육아·결혼`) on AdminUserBasic.naver
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
        # 1. Cafe Studio Base-Info (https://studio.cafe.naver.com/@31805224/operation/base-info)
        # ---------------------------------------------------------------------
        print("🚀 [1/3] 네이버 카페 스튜디오 기본정보(PC/모바일 카페명·주제·설명·검색어) 저장 중...", flush=True)
        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3.5)
        page.evaluate("""() => {
            window.__studioAlerts = [];
            window.confirm = (m) => { window.__studioAlerts.push('confirm:' + m); return true; };
            window.alert = (m) => { window.__studioAlerts.push('alert:' + m); return true; };
        }""")

        # 1) PC 카페명 (최대 60byte)
        pc_inp = page.locator("input[placeholder*='60byte']").first
        if pc_inp.count() > 0:
            pc_inp.click()
            pc_inp.fill("")
            pc_inp.fill("키즈핏 소아성장 두뇌발달 양육 연구소")
            time.sleep(0.3)

        # 2) 모바일 카페명 (최대 10자)
        mob_inp = page.locator("input[placeholder*='10자']").first
        if mob_inp.count() > 0:
            mob_inp.click()
            mob_inp.fill("")
            mob_inp.fill("키즈핏 양육연구소")
            time.sleep(0.3)

        # 3) 카페 주제 변경 (대분류 -> 소분류)
        cat1_btn = page.locator("button[aria-label='대분류 선택']").first
        if cat1_btn.count() > 0:
            cat1_btn.click()
            time.sleep(0.8)
            options1 = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('[role="option"]')).map(o => o.innerText.trim());
            }""")
            print(f"  👉 카페 대분류 옵션 목록: {options1}", flush=True)
            report["cafe_topic_options1"] = options1
            # Pick '생활/건강' or '가족/육아' or '교육/외국어' or '친목/모임'
            picked1 = None
            for cand in ["가족/육아", "생활/건강", "교육/외국어", "교육", "친목/모임"]:
                opt = page.locator(f"[role='option']:has-text('{cand}')").first
                if opt.count() > 0:
                    opt.click()
                    picked1 = cand
                    break
            if not picked1 and len(options1) > 0:
                # Try matching any option containing 육아, 가족, 교육, 건강, 생활
                for o_text in options1:
                    if any(k in o_text for k in ["육아", "가족", "교육", "건강", "생활"]):
                        page.locator(f"[role='option']:has-text('{o_text}')").first.click()
                        picked1 = o_text
                        break
            time.sleep(0.8)

            cat2_btn = page.locator("button[aria-label='소분류 선택']").first
            if cat2_btn.count() > 0:
                cat2_btn.click()
                time.sleep(0.8)
                options2 = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('[role="option"]')).map(o => o.innerText.trim());
                }""")
                print(f"  👉 카페 소분류 옵션 목록: {options2}", flush=True)
                report["cafe_topic_options2"] = options2
                picked2 = None
                for o_text in options2:
                    if any(k in o_text for k in ["육아", "자녀", "아이", "어린이", "유아", "교육", "엄마", "부모", "가족", "건강"]):
                        page.locator(f"[role='option']:has-text('{o_text}')").first.click()
                        picked2 = o_text
                        break
                if not picked2 and len(options2) > 0:
                    page.locator("[role='option']").first.click()
                time.sleep(0.8)

        # 4) 카페 설명 (최대 100byte: 한글 약 45자 이내)
        ta = page.locator("textarea[placeholder*='100byte']").first
        if ta.count() > 0:
            ta.click()
            ta.fill("")
            ta.fill("질병관리청 성장도표·영유아검진 기반 아이 예상키·두뇌발달·교구·나들이 양육 연구소")
            time.sleep(0.3)

        # 5) 기존 카페 검색어 태그 삭제 (div[data-slot='tag'] button)
        del_tags = page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll("div[data-slot='tag'] button"));
            btns.forEach(b => b.click());
            return btns.length;
        }""")
        print(f"  👉 기존 카페 검색어 태그 삭제: {del_tags}개", flush=True)
        time.sleep(0.8)

        # 6) 새 카페 검색어 등록 (최대 5개, 각 20byte 이내)
        kw_inp = page.locator("input[placeholder*='20byte']").first
        reg_btn = page.locator("button:has-text('등록')").first
        for kw in ["키즈핏", "아이키성장", "예상키계산기", "성조숙증", "영유아검진"]:
            try:
                if kw_inp.count() > 0 and kw_inp.is_enabled():
                    kw_inp.click(timeout=3000)
                    kw_inp.fill(kw)
                    time.sleep(0.15)
                    if reg_btn.count() > 0 and reg_btn.is_enabled():
                        reg_btn.click(timeout=3000)
                        time.sleep(0.25)
            except Exception as e:
                print(f"  ⚠️ 태그 {kw} 등록 스킵: {e}", flush=True)
                break

        # 7) Click '저장하기' and check for any modal / dialog
        save_btn = page.locator("button:has-text('저장하기')").first
        if save_btn.count() > 0:
            save_btn.scroll_into_view_if_needed()
            save_btn.click()
            time.sleep(2.5)
            # Check if a Radix AlertDialog / Dialog popped up (e.g. "카페명을 변경하시겠습니까?" or "확인")
            dialogs_html = page.evaluate("""() => {
                const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"]'));
                return dialogs.map(d => d.innerText);
            }""")
            print(f"  👉 저장하기 클릭 후 모달창: {dialogs_html}", flush=True)
            report["studio_dialogs_on_save"] = dialogs_html
            # Click all visible '확인' or '변경' or '저장' buttons inside dialog
            for _ in range(3):
                confirm_btn = page.locator("[role='dialog'] button:has-text('확인'), [role='alertdialog'] button:has-text('확인'), button:has-text('확인')").last
                if confirm_btn.count() > 0 and confirm_btn.is_visible():
                    confirm_btn.click()
                    time.sleep(2)

        # Verify Cafe Studio Base-Info after reload
        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3.5)
        report["cafe_studio_verified"] = page.evaluate("""() => {
            return {
                inputs: Array.from(document.querySelectorAll('input[data-slot="input"]')).map(i => i.value),
                textarea: (document.querySelector('textarea') || {}).value,
                topic1: (document.querySelector("button[aria-label='대분류 선택']") || {}).innerText,
                topic2: (document.querySelector("button[aria-label='소분류 선택']") || {}).innerText,
                tags: Array.from(document.querySelectorAll("div[data-slot='tag']")).map(t => t.innerText.trim())
            };
        }""")
        print(f"✅ 카페 기본정보 검증: {report['cafe_studio_verified']}", flush=True)

        # ---------------------------------------------------------------------
        # 2. Naver Blog Categories (AdminMain.naver -> AdminCategoryView.naver)
        # ---------------------------------------------------------------------
        print("🚀 [2/3] 네이버 블로그(expertise333) 카테고리 키즈핏 개편 저장 중...", flush=True)
        page.goto("https://admin.blog.naver.com/AdminMain.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        page.evaluate("""() => {
            window.confirm = () => true;
            window.alert = () => true;
            document.getElementById('papermain').src = '/AdminCategoryView.naver?blogId=expertise333';
        }""")
        time.sleep(3.5)

        papermain = page.frame(name="papermain")
        if papermain:
            cat_exec = papermain.evaluate("""() => {
                window.confirm = () => true;
                window.alert = () => true;

                // 1) Update first existing category (node 1: '게시판' -> '공지 및 키즈핏 가이드')
                const nodes = tree.getChildNodes();
                if (nodes.length > 1) {
                    const node1 = nodes[1];
                    tree.selectNode(node1);
                    const raw1 = tree.getNodeRawData(node1);
                    raw1.text = '공지 및 키즈핏 가이드';
                    raw1.categoryName = '공지 및 키즈핏 가이드';
                    raw1.directorySeq = 15; // 육아·결혼
                    raw1.openYn = true;
                    category.setModifiedNode(node1);
                    const lbl1 = node1.querySelector('label');
                    if (lbl1) lbl1.innerText = '공지 및 키즈핏 가이드';
                }

                // 2) Add 4 new top-level categories if only 1 category exists
                const targetCats = [
                    '우리 아이 키성장·성조숙증',
                    '월령별 두뇌·소근육 발달',
                    '연령별 교구·책육아 추천',
                    '주말 미술관·박물관 나들이'
                ];
                const currentCount = tree.getChildNodes().length - 1;
                if (currentCount < 5) {
                    for (const cname of targetCats) {
                        // Select root node ('카테고리 전체보기') so createNode_new creates a depth-0 category
                        tree.selectNode(tree.getChildNodes()[0]);
                        category.createNode_new();
                        const newNode = tree.getSelectedNode();
                        const raw = tree.getNodeRawData(newNode);
                        raw.text = cname;
                        raw.categoryName = cname;
                        raw.directorySeq = 15; // 육아·결혼
                        raw.openYn = true;
                        raw.type = 'B';
                        if (typeof oEt !== 'undefined' && oEt.editText) {
                            try { oEt.editText('save', newNode); } catch(e) {}
                        }
                        raw.text = cname;
                        raw.categoryName = cname;
                        raw.directorySeq = 15;
                        const lbl = newNode.querySelector('label');
                        if (lbl) lbl.innerText = cname;
                    }
                }

                const jsonBeforeSave = category.getJson();
                category.save();
                return {
                    nodeCount: tree.getChildNodes().length,
                    jsonBeforeSave: jsonBeforeSave
                };
            }""")
            print(f"  👉 블로그 카테고리 생성 및 category.save() 호출 완료: nodeCount={cat_exec['nodeCount']}", flush=True)
            time.sleep(3)
            # Check if parent layeredAlert popped up a confirmation button and click it
            page.evaluate("""() => {
                const btns = Array.from(document.querySelectorAll('a.button_check, button, input[type="button"]')).filter(el => {
                    const st = window.getComputedStyle(el);
                    return st.display !== 'none' && st.visibility !== 'hidden' && (el.innerText.trim() === '확인' || el.value === '확인');
                });
                btns.forEach(b => b.click());
            }""")
            time.sleep(2)

        # Verify Blog Categories by reloading AdminCategoryView.naver
        page.goto("https://admin.blog.naver.com/AdminCategoryView.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2.5)
        report["blog_categories_verified"] = page.evaluate("""() => {
            return tree.getNodeData().map(n => ({ text: n.text, categoryName: n.categoryName, directorySeq: n.directorySeq }));
        }""")
        print(f"✅ 블로그 카테고리 저장 검증: {report['blog_categories_verified']}", flush=True)

        # ---------------------------------------------------------------------
        # 3. Inspect & Save Blog Subject ('육아·결혼') on AdminUserBasic.naver
        # ---------------------------------------------------------------------
        print("🚀 [3/3] 네이버 블로그 주제(육아·결혼) 라디오버튼 구조 확인 및 저장 중...", flush=True)
        page.goto("https://admin.blog.naver.com/AdminMain.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        papermain = page.frame(name="papermain")
        if papermain:
            subj_res = papermain.evaluate("""() => {
                const radios = Array.from(document.querySelectorAll('input[type="radio"]')).map(r => ({
                    id: r.id, name: r.name, value: r.value, checked: r.checked,
                    label: (document.querySelector(`label[for="${r.id}"]`) || {}).innerText
                }));
                const r11 = document.querySelector('#label-subject11');
                if (r11) {
                    r11.checked = true;
                    r11.click();
                    r11.dispatchEvent(new Event('change', { bubbles: true }));
                }
                const btn = document.querySelector('input._btnConfirm');
                if (btn) btn.click();
                return radios;
            }""")
            time.sleep(2.5)
            report["blog_basic_radios"] = subj_res
            print(f"✅ 블로그 주제 라디오 확인: {subj_res[:5]}...", flush=True)

        page.close()

    out_path = LOG_DIR / "apply_studio_and_blog_categories_report.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"🎉 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
