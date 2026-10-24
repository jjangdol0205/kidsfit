# -*- coding: utf-8 -*-
"""
1. Deletes remaining legacy MoneyFit Cafe articles (9, 6) by overriding window.confirm = () => true
2. Updates Cafe Studio Basic Info (PC/Mobile name, topic, description, search keywords)
3. Updates Naver Blog Basic Info & Categories inside AdminMain.naver's #papermain frame
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\키즈핏")
LOG_DIR = ROOT / "logs"


def main():
    report = {}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        # Create a fresh tab so no stale CDP dialog handlers interfere
        page = context.new_page()

        # ---------------------------------------------------------------------
        # 1. Delete Remaining Legacy MoneyFit Articles in Cafe 31805224
        # ---------------------------------------------------------------------
        print("🗑️ [1/4] 네이버 카페(31805224) 남은 머니핏 게시글 삭제 중...", flush=True)
        page.goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2)
        cur_articles = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=50', { credentials: 'include' });
            const j = await r.json();
            return (j.message && j.message.result && j.message.result.articleList) ? j.message.result.articleList.map(a => a.articleId) : [];
        }""")
        print(f"  👉 현재 남아있는 게시글 ID: {cur_articles}", flush=True)

        for art_id in cur_articles:
            try:
                page.goto(f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{art_id}", wait_until="domcontentloaded", timeout=20000)
            except Exception as e:
                print(f"  ⚠️ goto exception on {art_id}: {e}", flush=True)
            time.sleep(3)
            # Override confirm/alert in all frames BEFORE clicking delete
            for f in page.frames:
                try:
                    f.evaluate("window.confirm = () => true; window.alert = () => true;")
                except Exception:
                    pass
            clicked = False
            for f in page.frames:
                try:
                    del_btn = f.locator("a:has-text('삭제'), button:has-text('삭제')").first
                    if del_btn.count() > 0 and del_btn.is_visible():
                        del_btn.click()
                        clicked = True
                        break
                except Exception:
                    pass
            time.sleep(3.5)
            print(f"  👉 게시글 {art_id} 삭제 완료 (clicked={clicked}, url={page.url})", flush=True)

        # Verify remaining articles via API
        page.goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2)
        rem_articles = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=50', { credentials: 'include' });
            const j = await r.json();
            return (j.message && j.message.result && j.message.result.articleList) ? j.message.result.articleList.map(a => ({ id: a.articleId, subject: a.subject })) : [];
        }""")
        report["remaining_cafe_articles"] = rem_articles
        print(f"✅ 카페 남은 게시글 수: {len(rem_articles)}개 ({rem_articles})", flush=True)

        # ---------------------------------------------------------------------
        # 2. Update Cafe Basic Info on Cafe Studio
        # ---------------------------------------------------------------------
        print("🚀 [2/4] 네이버 카페 스튜디오 기본정보(이름·설명·주제·검색어) 키즈핏 세팅 중...", flush=True)
        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=20000)
        time.sleep(4)
        page.evaluate("""() => {
            window.__alerts = [];
            window.confirm = (m) => { window.__alerts.push('confirm:' + m); return true; };
            window.alert = (m) => { window.__alerts.push('alert:' + m); return true; };
        }""")

        text_inputs = page.locator("input[class*='FormInputText_input']")
        cnt = text_inputs.count()
        print(f"  👉 FormInputText_input 개수: {cnt}", flush=True)
        if cnt >= 3:
            # PC 카페명 (최대 30자 제한 가능성 대비 깔끔한 공식 명칭)
            pc_input = text_inputs.nth(1)
            pc_input.click()
            pc_input.fill("")
            pc_input.fill("키즈핏 소아성장·두뇌발달 양육 연구소")
            time.sleep(0.5)

            # 모바일 카페명
            mob_input = text_inputs.nth(2)
            mob_input.click()
            mob_input.fill("")
            mob_input.fill("키즈핏 성장발달 연구소")
            time.sleep(0.5)

        # 카페 설명 textarea
        ta = page.locator("textarea[class*='FormTextarea_textarea'], textarea").first
        if ta.count() > 0:
            ta.click()
            ta.fill("")
            ta.fill("질병관리청 성장도표·영유아검진(K-DST) 기반 우리 아이 예상키·성조숙증·두뇌발달·연령별 교구·주말 나들이 정보 나눔 카페")
            time.sleep(0.5)

        # Delete existing search tags
        del_tag_Result = page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.trim() === '삭제');
            btns.forEach(b => b.click());
            return btns.length;
        }""")
        print(f"  👉 기존 검색어 태그 삭제 수: {del_tag_Result}", flush=True)
        time.sleep(1)

        # Add KidsFit tags
        if cnt >= 4:
            tag_input = text_inputs.nth(3)
            reg_btn = page.locator("button:has-text('등록')").first
            for kw in ["키즈핏", "아이키성장", "예상키계산기", "성조숙증", "영유아건강검진", "소근육발달", "몬테소리교구", "하브루타", "아이와가볼만한곳", "육아카페"]:
                tag_input.click()
                tag_input.fill(kw)
                time.sleep(0.2)
                if reg_btn.count() > 0:
                    reg_btn.click()
                    time.sleep(0.3)

        # Inspect topic selection elements before saving
        report["studio_selects_and_buttons"] = page.evaluate("""() => {
            return {
                selects: Array.from(document.querySelectorAll('select')).map(s => ({
                    className: s.className,
                    value: s.value,
                    options: Array.from(s.options).map(o => ({ val: o.value, text: o.text }))
                })),
                buttons: Array.from(document.querySelectorAll('button, a[role="button"]')).map(b => ({
                    text: b.innerText.trim(),
                    className: b.className
                })).filter(b => b.text.length > 0)
            };
        }""")

        # Click '저장하기'
        save_btn = page.locator("button:has-text('저장하기')").first
        if save_btn.count() > 0:
            save_btn.scroll_into_view_if_needed()
            save_btn.click()
            time.sleep(3)
            # Check if any modal confirm button popped up in Studio
            modal_confirm = page.locator("button:has-text('확인')").last
            if modal_confirm.count() > 0 and modal_confirm.is_visible():
                modal_confirm.click()
                time.sleep(2)

        report["studio_alerts"] = page.evaluate("window.__alerts || []")

        # Reload studio to verify persistence
        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3.5)
        report["cafe_studio_verified"] = page.evaluate("""() => {
            return {
                inputs: Array.from(document.querySelectorAll("input[class*='FormInputText_input']")).map(i => i.value),
                textarea: (document.querySelector("textarea") || {}).value || "",
                bodyText: document.body.innerText.slice(0, 1800)
            };
        }""")
        print(f"✅ 카페 기본정보 저장 검증: inputs={report['cafe_studio_verified']['inputs']}", flush=True)

        # ---------------------------------------------------------------------
        # 3. Update Naver Blog Basic Info inside AdminMain.naver's #papermain
        # ---------------------------------------------------------------------
        print("🚀 [3/4] 네이버 블로그(expertise333) 기본정보 세팅 중 (AdminMain 프레임 내부)...", flush=True)
        page.goto("https://admin.blog.naver.com/AdminMain.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)

        page.evaluate("""() => {
            window.__parentAlerts = [];
            window.confirm = (m) => { window.__parentAlerts.push('confirm:' + m); return true; };
            window.alert = (m) => { window.__parentAlerts.push('alert:' + m); return true; };
        }""")

        papermain = page.frame(name="papermain")
        if papermain:
            papermain.evaluate("""() => {
                window.__frameAlerts = [];
                window.confirm = (m) => { window.__frameAlerts.push('confirm:' + m); return true; };
                window.alert = (m) => { window.__frameAlerts.push('alert:' + m); return true; };
            }""")

            # Fill Blog Title, Nickname, Description, Subject
            papermain.locator("#papername").fill("키즈핏 소아성장·두뇌발달 양육 연구소")
            papermain.locator("#frmNickname").fill("키즈핏연구소장")
            papermain.locator("#frmIntroduce").fill(
                "질병관리청 성장도표·영유아 건강검진(K-DST) 공식 기준에 기반해\n"
                "우리 아이 숨은 키·성조숙증·월령별 두뇌발달·가베/몬테소리 교구·주말 나들이 가이드를 연구합니다.\n"
                "공식 웹앱: https://truthofmarket.com"
            )
            papermain.evaluate("""() => {
                const r = document.querySelector('#label-subject11');
                if (r) { r.checked = true; r.click(); }
            }""")
            time.sleep(0.5)

            # Click confirm button
            papermain.locator("input._btnConfirm").click()
            time.sleep(3)

            # Check if parent layeredAlert opened
            parent_layer_info = page.evaluate("""() => {
                const layers = Array.from(document.querySelectorAll('div, button, a, input')).filter(el => {
                    const st = window.getComputedStyle(el);
                    return st.display !== 'none' && st.visibility !== 'hidden' && (el.innerText.includes('확인') || el.value === '확인');
                }).map(el => ({ tag: el.tagName, id: el.id, className: el.className, text: el.innerText || el.value }));
                return {
                    parentAlerts: window.__parentAlerts,
                    layers: layers.slice(0, 20)
                };
            }""")
            frame_alerts = papermain.evaluate("window.__frameAlerts || []")
            report["blog_basic_submit_result"] = {
                "parent_layer_info": parent_layer_info,
                "frame_alerts": frame_alerts
            }
            print(f"  👉 블로그 기본정보 확인 클릭 결과: frame_alerts={frame_alerts}", flush=True)

        # ---------------------------------------------------------------------
        # 4. Update Naver Blog Categories inside AdminMain.naver's #papermain
        # ---------------------------------------------------------------------
        print("🚀 [4/4] 네이버 블로그(expertise333) 카테고리 키즈핏 개편 중...", flush=True)
        page.evaluate("document.getElementById('papermain').src = '/AdminCategoryView.naver?blogId=expertise333';")
        time.sleep(3.5)
        papermain = page.frame(name="papermain")
        if papermain:
            papermain.evaluate("""() => {
                window.__catAlerts = [];
                window.confirm = (m) => { window.__catAlerts.push('confirm:' + m); return true; };
                window.alert = (m) => { window.__catAlerts.push('alert:' + m); return true; };
            }""")

            # 1) Rename first category '게시판' -> '공지 및 키즈핏 가이드' & topic '육아·결혼'(seq15)
            cat_step1 = papermain.evaluate("""() => {
                const node0 = document.querySelector('#tree li.drag-node label');
                if (node0) node0.click();
                const inp = document.querySelector('#category_name');
                if (inp) {
                    inp.value = '공지 및 키즈핏 가이드';
                    inp.dispatchEvent(new Event('input', { bubbles: true }));
                    inp.dispatchEvent(new Event('change', { bubbles: true }));
                    inp.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
                    inp.blur();
                }
                const seq15 = document.querySelector('#seq15');
                if (seq15) { seq15.checked = true; seq15.click(); }
                return inp ? inp.value : null;
            }""")
            time.sleep(0.8)

            # 2) Add the 4 KidsFit categories using the top-level '카테고리 추가' button (#tree li.first-child button.tree-button)
            new_cats = [
                "우리 아이 키성장·성조숙증",
                "월령별 두뇌·소근육 발달",
                "연령별 교구·책육아 추천",
                "주말 미술관·박물관 나들이",
            ]
            for cname in new_cats:
                papermain.evaluate("""(name) => {
                    const rootLabel = document.querySelector('#tree li.first-child label');
                    if (rootLabel) rootLabel.click();
                    const addBtn = document.querySelector('#tree li.first-child button.tree-button');
                    if (addBtn) addBtn.click();
                    const inp = document.querySelector('#category_name');
                    if (inp) {
                        inp.value = name;
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                        inp.dispatchEvent(new Event('change', { bubbles: true }));
                        inp.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
                        inp.blur();
                    }
                    const seq15 = document.querySelector('#seq15');
                    if (seq15) { seq15.checked = true; seq15.click(); }
                }""", cname)
                time.sleep(0.8)

            # Inspect tree before saving
            tree_before_save = papermain.evaluate("""() => {
                return Array.from(document.querySelectorAll('#tree label')).map(l => l.innerText.trim());
            }""")
            print(f"  👉 저장 전 블로그 카테고리 트리: {tree_before_save}", flush=True)

            # Call continueWork() / category.save() / click #submit_button
            save_cat_res = papermain.evaluate("""() => {
                const btn = document.querySelector('#submit_button');
                if (btn) btn.click();
                if (typeof category !== 'undefined' && typeof category.save === 'function') {
                    // Wait slightly or call save if wordcheck didn't fire
                }
                return {
                    hasCategoryObj: typeof category !== 'undefined',
                    catAlerts: window.__catAlerts || []
                };
            }""")
            time.sleep(3)
            report["blog_category_save_res"] = {
                "tree_before_save": tree_before_save,
                "save_cat_res": save_cat_res,
                "cat_alerts_after": papermain.evaluate("window.__catAlerts || []")
            }

        # Verify Blog Basic Info and Categories by reloading AdminUserBasic & AdminCategoryView
        page.goto("https://admin.blog.naver.com/AdminUserBasic.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2)
        report["blog_basic_verified"] = page.evaluate("""() => {
            return {
                papername: (document.querySelector('#papername') || {}).value,
                nickname: (document.querySelector('#frmNickname') || {}).value,
                introduce: (document.querySelector('#frmIntroduce') || {}).value,
                checkedSubject: (document.querySelector("input[name='subject']:checked") || {}).value
            };
        }""")
        print(f"✅ 블로그 기본정보 저장 검증: {report['blog_basic_verified']}", flush=True)

        page.goto("https://admin.blog.naver.com/AdminCategoryView.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2)
        report["blog_cat_verified"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('#tree label')).map(l => l.innerText.trim());
        }""")
        print(f"✅ 블로그 카테고리 저장 검증: {report['blog_cat_verified']}", flush=True)

        page.close()

    out_path = LOG_DIR / "fix_blog_and_cafe_base_report.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ 리포트 저장 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
