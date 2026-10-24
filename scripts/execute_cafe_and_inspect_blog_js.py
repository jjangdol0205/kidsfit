# -*- coding: utf-8 -*-
"""
1. Inspects the inline scripts of AdminUserBasic.naver and AdminCategoryView.naver
2. Deletes legacy MoneyFit articles (12, 11, 9, 6) from Naver Cafe (31805224)
3. Updates Naver Cafe Basic Info on Cafe Studio (https://studio.cafe.naver.com/@31805224/operation/base-info)
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
    report = {"dialogs": []}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        def on_dialog(d):
            print(f"🔔 [Dialog] ({d.type}): {d.message}", flush=True)
            report["dialogs"].append({"type": d.type, "message": d.message})
            d.accept()

        page.on("dialog", on_dialog)

        # ---------------------------------------------------------------------
        # 1. Inspect Blog AdminUserBasic.naver & AdminCategoryView.naver scripts
        # ---------------------------------------------------------------------
        print("🔍 [1/3] 블로그 기본정보/카테고리 JS 제출 로직 확인 중...", flush=True)
        page.goto("https://admin.blog.naver.com/AdminUserBasic.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2)
        report["blog_basic_scripts"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('script')).map(s => s.src ? ('SRC:' + s.src) : s.innerText).filter(t => t.length > 0);
        }""")

        page.goto("https://admin.blog.naver.com/AdminCategoryView.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2)
        report["blog_cat_scripts"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('script')).map(s => s.src ? ('SRC:' + s.src) : s.innerText).filter(t => t.length > 0);
        }""")

        # ---------------------------------------------------------------------
        # 2. Delete Remaining Legacy MoneyFit Articles in Cafe 31805224
        # ---------------------------------------------------------------------
        print("🗑️ [2/3] 네이버 카페(31805224) 기존 머니핏 게시글 삭제 중...", flush=True)
        page.goto("https://cafe.naver.com/moneyfitlab", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2)
        cur_articles = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=50', { credentials: 'include' });
            const j = await r.json();
            return (j.message && j.message.result && j.message.result.articleList) ? j.message.result.articleList.map(a => a.articleId) : [];
        }""")
        print(f"  👉 현재 남아있는 게시글 ID: {cur_articles}", flush=True)
        deleted_articles = []
        for art_id in cur_articles:
            try:
                page.goto(f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{art_id}", wait_until="domcontentloaded", timeout=20000)
            except Exception as e:
                print(f"  ⚠️ goto exception on {art_id}: {e}", flush=True)
            time.sleep(3)
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
            # Wait for confirm dialog + post-deletion redirect to settle
            time.sleep(4)
            deleted_articles.append({"articleId": art_id, "clicked": clicked, "url_after": page.url})
            print(f"  👉 게시글 {art_id} 삭제 처리: clicked={clicked}", flush=True)

        # Verify remaining articles via API
        rem_articles = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=50', { credentials: 'include' });
            const j = await r.json();
            return (j.message && j.message.result && j.message.result.articleList) ? j.message.result.articleList.map(a => ({ id: a.articleId, subject: a.subject })) : [];
        }""")
        report["deleted_articles"] = deleted_articles
        report["remaining_cafe_articles"] = rem_articles
        print(f"✅ 삭제 후 카페 남은 게시글 수: {len(rem_articles)}개 ({rem_articles})", flush=True)

        # ---------------------------------------------------------------------
        # 3. Update Cafe Basic Info on Cafe Studio
        # ---------------------------------------------------------------------
        print("🚀 [3/3] 네이버 카페 스튜디오 기본정보(이름·설명·주제·검색어) 키즈핏 세팅 중...", flush=True)
        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=20000)
        time.sleep(4)

        # Let's inspect all text inputs and textareas on studio base-info
        # Input 0: cafe url (readonly)
        # Input 1: PC 카페명
        # Input 2: 모바일 카페명
        # Input 3: 카페 검색어 입력창
        text_inputs = page.locator("input[type='text']")
        inp_count = text_inputs.count()
        print(f"  👉 Studio text inputs count: {inp_count}", flush=True)

        if inp_count >= 3:
            # PC 카페명 (max 30~40 chars)
            pc_name_input = text_inputs.nth(1)
            pc_name_input.click()
            pc_name_input.fill("키즈핏 소아성장 두뇌발달 양육 연구소")
            time.sleep(0.5)

            # 모바일 카페명 (max 20 chars)
            mob_name_input = text_inputs.nth(2)
            mob_name_input.click()
            mob_name_input.fill("키즈핏 성장발달 연구소")
            time.sleep(0.5)

        # Cafe description textarea
        desc_ta = page.locator("textarea").first
        if desc_ta.count() > 0:
            desc_ta.click()
            desc_ta.fill(
                "질병관리청 성장도표 및 보건복지부 K-DST 기반 우리 아이 숨은 키 +7cm, 소근육 발달, 나이별 맞춤 교구·공부법, 주말 박물관 하브루타 연구소 및 무료 워크지 PDF 나눔 카페입니다. (무료 진단: truthofmarket.com)"
            )
            time.sleep(0.5)

        # Remove existing MoneyFit search tags ('머니핏', '생활비절약', '자취꿀팁', '전기세절약', '쇼핑커넥트')
        # The tag delete buttons are inside the tag chips near '카페 검색어'
        removed_tags = page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button')).filter(b => {
                const cls = b.className || '';
                return cls.includes('text-secondary-foreground-default') && cls.includes('shrink-0') && b.querySelector('svg');
            });
            btns.forEach(b => b.click());
            return btns.length;
        }""")
        print(f"  👉 기존 카페 검색어 태그 삭제 버튼 클릭 수: {removed_tags}", flush=True)
        time.sleep(1)

        # Add new KidsFit search tags
        kidsfit_tags = [
            "아이키성장",
            "소근육발달",
            "유아교구추천",
            "초등문해력",
            "백지복습",
            "무료워크지",
            "주말아이와가볼만한곳",
            "유전키계산",
            "어린이칼슘",
            "키즈핏",
        ]
        if inp_count >= 4:
            tag_input = text_inputs.nth(3)
            reg_btn = page.locator("button:has-text('등록')").first
            for tag in kidsfit_tags:
                try:
                    tag_input.click()
                    tag_input.fill(tag)
                    time.sleep(0.2)
                    reg_btn.click()
                    time.sleep(0.3)
                except Exception as e:
                    print(f"  ⚠️ 태그 추가 중 오류 ({tag}): {e}", flush=True)

        # Click '저장하기' button
        save_btn = page.locator("button:has-text('저장하기')").first
        if save_btn.count() > 0:
            save_btn.click()
            print("  👉 카페 기본정보 [저장하기] 클릭 완료!", flush=True)
            time.sleep(3)

        # Check if any confirm modal button ('확인' or '저장') appeared in Studio
        modal_btns = page.evaluate("""() => {
            const clicked = [];
            const btns = Array.from(document.querySelectorAll('button')).filter(b => {
                const t = b.innerText.trim();
                return (t === '확인' || t === '변경' || t === '저장') && b.offsetParent !== null;
            });
            btns.forEach(b => { clicked.push(b.innerText.trim()); b.click(); });
            return clicked;
        }""")
        if modal_btns:
            print(f"  👉 Studio 모달 확인 버튼 클릭됨: {modal_btns}", flush=True)
            time.sleep(2)

        # Reload studio base-info to verify changes
        page.goto("https://studio.cafe.naver.com/@31805224/operation/base-info", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        report["cafe_studio_after"] = page.evaluate("""() => {
            const inps = Array.from(document.querySelectorAll('input[type="text"]')).map(i => i.value);
            const ta = (document.querySelector('textarea') || {}).value || '';
            const bodyText = document.body.innerText;
            return { inputs: inps, textarea: ta, bodySnippet: bodyText.slice(0, 1500) };
        }""")
        print(f"✅ 카페 기본정보 저장 후 상태: {report['cafe_studio_after']['inputs']}", flush=True)

        out_path = LOG_DIR / "cafe_and_blog_js_report.json"
        out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅ 리포트 저장 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
