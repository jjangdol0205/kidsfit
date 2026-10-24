# -*- coding: utf-8 -*-
import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\키즈핏")
LOG_DIR = ROOT / "logs"
BRAND_DIR = ROOT / "samples" / "9_naver_brand_assets"


def safe_goto(page, url: str, sleep_sec: float = 3.0):
    try:
        page.goto("about:blank", wait_until="commit", timeout=8000)
        time.sleep(0.25)
    except Exception:
        pass
    page.goto(url, wait_until="commit", timeout=25000)
    time.sleep(sleep_sec)


def main():
    report = {}
    skin_png = str(BRAND_DIR / "kidsfit_blog_skin_966x260.png")

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()

        def handle_dialog(d):
            try:
                d.accept()
            except Exception:
                pass

        page.on("dialog", handle_dialog)

        # 1. Apply Blog PC Title Skin (Remocon.naver)
        print("🎨 [블로그 PC 타이틀 배너 & 스킨] 업로드 및 적용 중...", flush=True)
        safe_goto(page, "https://admin.blog.naver.com/Remocon.naver?blogId=expertise333&loadType=admin&Redirect=Remocon&SelectedMenu=title", sleep_sec=4.5)
        try:
            page.evaluate("""() => {
                const titleMenu = document.querySelector('a.item_title, a[class*="title"], a._registry');
                if (titleMenu) titleMenu.click();
                const reg = document.querySelector('a._registry');
                if (reg) reg.click();
            }""")
            time.sleep(0.8)
            title_file_inp = page.locator("input#titleInputFile").first
            if title_file_inp.count() > 0:
                title_file_inp.set_input_files(skin_png)
                time.sleep(2.5)
            page.evaluate("""() => {
                const hInp = document.querySelector('#title_height');
                if (hInp) hInp.value = '260';
                const sub = document.querySelector('a.btn_submit._showConfirmLayer, a.btn_submit');
                if (sub) sub.click();
            }""")
            time.sleep(1.5)
            page.evaluate("""() => {
                const okBtns = Array.from(document.querySelectorAll('a, button, input')).filter(el => (el.innerText || el.value || '').trim() === '적용' || (el.innerText || el.value || '').trim() === '확인');
                okBtns.forEach(b => { try { b.click(); } catch(e){} });
            }""")
            time.sleep(3.5)
            report["blog_pc_title_skin"] = "applied"
        except Exception as e:
            report["blog_pc_title_skin"] = f"error: {e}"

        # 2. Verify Cafe Articles (#21, #22, #23)
        safe_goto(page, "https://cafe.naver.com/moneyfitlab", sleep_sec=2.5)
        articles = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=20', { credentials: 'include' });
            const j = await r.json();
            return (j.message && j.message.result && j.message.result.articleList) ? j.message.result.articleList.map(a => ({ id: a.articleId, subject: a.subject, menuName: a.menuName })) : [];
        }""")
        for a in articles:
            aid = a["id"]
            safe_goto(page, f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{aid}", sleep_sec=2.8)
            info = page.evaluate("""() => {
                const paras = Array.from(document.querySelectorAll('.se-text-paragraph')).map(p => p.innerText).join('\\n').trim();
                const imgs = document.querySelectorAll('.se-image-resource, .ArticleContentBox img').length;
                return { textLen: paras.length, imgCount: imgs, preview: paras.slice(0, 120) };
            }""")
            a["verified_content_len"] = info["textLen"]
            a["verified_image_count"] = info["imgCount"]
            a["preview"] = info["preview"]
            a["url"] = f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{aid}"
            print(f"  ✅ 카페 게시글 #{aid} ({a['menuName']}): 본문 {info['textLen']}자, 이미지 {info['imgCount']}장", flush=True)
        report["verified_cafe_articles"] = articles

        # 3. Refresh visible tabs for user
        try:
            if len(context.pages) > 0:
                safe_goto(context.pages[0], "https://cafe.naver.com/moneyfitlab", sleep_sec=2.0)
            if len(context.pages) > 1:
                safe_goto(context.pages[1], "https://blog.naver.com/expertise333", sleep_sec=2.0)
        except Exception:
            pass

        page.close()

    out_path = LOG_DIR / "brand_skins_and_posts_fixed.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"🎉 최종 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
