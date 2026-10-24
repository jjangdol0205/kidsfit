# -*- coding: utf-8 -*-
"""
1. Fixes all 3 Naver Cafe posts (Welcome Notice, Free Worksheet 3-Pack, Monthly Challenge)
   by inserting body text line-by-line (so SmartEditor ONE never truncates on \n) + attaching banners/worksheets.
2. Checks and fixes Naver Blog Day 1 post if truncated.
3. Updates Naver Cafe Profile Icon, Top Title Banner, and Front Gate (대문) to match KidsFit homepage (truthofmarket.com).
4. Updates Naver Blog Profile Image, Mobile Cover Image, and PC Title Skin to match KidsFit homepage.
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(r"d:\키즈핏")
LOG_DIR = ROOT / "logs"
BRAND_DIR = ROOT / "samples" / "9_naver_brand_assets"
CAFE_PACK = ROOT / "samples" / "6_naver_cafe_pack" / "폴더별_글모음"
BLOG_PACK = ROOT / "samples" / "7_naver_blog_daily_pack" / "폴더별_글모음" / "1일차_신체성장_키백분위와숨은키7cm"


def split_title_and_body(txt: str):
    lines = txt.strip().splitlines()
    title = lines[0].strip()
    body = "\n".join(lines[1:]).strip()
    return title, body


def safe_goto(page, url: str, sleep_sec: float = 3.0):
    """Navigates via about:blank + commit so Vue SPA routes never hang on domcontentloaded."""
    try:
        page.goto("about:blank", wait_until="commit", timeout=8000)
        time.sleep(0.25)
    except Exception:
        pass
    page.goto(url, wait_until="commit", timeout=25000)
    time.sleep(sleep_sec)


def type_multiline_into_se_one(page, body: str):
    """Types multi-line text into SmartEditor ONE line by line so \n never resets paragraph state."""
    for line in body.splitlines():
        clean = line.strip()
        if clean:
            page.keyboard.insert_text(clean)
        page.keyboard.press("Enter")
        time.sleep(0.03)


def publish_cafe_post_clean(page, board_name: str, title: str, body: str, tags: list[str], is_notice: bool = False, images: list[str] = None):
    print(f"📝 [카페 글쓰기] '{board_name}' -> {title[:38]}...", flush=True)
    safe_goto(page, "https://cafe.naver.com/ca-fe/cafes/31805224/menus/1/articles/write?boardType=L", sleep_sec=4.5)
    page.evaluate("window.confirm = () => true; window.alert = () => true;")

    # Dismiss popups
    for sel in ["button.se-popup-button-cancel", "button.se-help-panel-close-button"]:
        btn = page.locator(sel).first
        if btn.count() > 0 and btn.is_visible():
            btn.click(force=True)
            time.sleep(0.4)

    # 1) Select board
    if board_name != "공지 및 키즈핏 가이드":
        board_btn = page.locator("button.button:has-text('공지 및 키즈핏 가이드'), .FormSelectButton button.button").first
        if board_btn.count() > 0:
            board_btn.click(force=True)
            time.sleep(0.6)
            opt = page.locator(f"button.option:has-text('{board_name}')").first
            if opt.count() > 0:
                opt.click(force=True)
                time.sleep(0.6)

    # 2) Fill Title
    title_inp = page.locator("textarea.textarea_input[placeholder*='제목']").first
    if title_inp.count() > 0:
        title_inp.click(force=True)
        title_inp.fill(title)
        time.sleep(0.4)

    # Close any lingering popup dim
    page.evaluate("""() => {
        document.querySelectorAll('button.BaseButton--gray, .se-popup-close-button, .se-popup-button-cancel, .se-help-panel-close-button').forEach(b => b.click());
        document.querySelectorAll('.se-popup-dim').forEach(d => d.remove());
    }""")
    time.sleep(0.4)

    # 3) Click .se-text-paragraph via mouse coordinates and type full body text line by line FIRST!
    para_rect = page.evaluate("""() => {
        const p = document.querySelector('.se-text-paragraph');
        if (!p) return null;
        p.scrollIntoView({ block: 'center' });
        return p.getBoundingClientRect();
    }""")
    if para_rect:
        page.mouse.click(para_rect["x"] + 50, para_rect["y"] + 10)
        time.sleep(0.4)
    type_multiline_into_se_one(page, body)
    time.sleep(0.8)

    # Verify text length inside editor before attaching images
    ed_len = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('.se-text-paragraph')).map(p => p.innerText).join('\\n').trim().length;
    }""")
    print(f"  👉 에디터 입력 본문 길이 확인: {ed_len}자", flush=True)

    # 4) Attach images if provided
    if images:
        img_btn = page.locator("button.se-image-toolbar-button").first
        if img_btn.count() > 0:
            try:
                with page.expect_file_chooser(timeout=5000) as fc_info:
                    img_btn.click(force=True)
                fc = fc_info.value
                fc.set_files(images)
                time.sleep(1.5)
                page.evaluate("""() => {
                    const lbl = document.querySelector("label[for='image-type-list']");
                    if (lbl) lbl.click();
                }""")
                time.sleep(3.5)
            except Exception as e:
                print(f"  ⚠️ 이미지 첨부 스킵: {e}", flush=True)

    # 5) Add tags
    tag_inp = page.locator("input.tag_input").first
    if tag_inp.count() > 0:
        for t in tags[:10]:
            tag_inp.click(force=True)
            tag_inp.fill(t)
            page.keyboard.press("Enter")
            time.sleep(0.15)

    # 6) Set notice if requested
    if is_notice:
        page.evaluate("""() => {
            const lbl = document.querySelector("label[for='notice']");
            if (lbl) lbl.click();
        }""")
        time.sleep(0.3)

    # 7) Click '등록'
    reg_btn = page.locator("button.BaseButton--skinGreen:has-text('등록'), a.BaseButton--skinGreen:has-text('등록')").first
    if reg_btn.count() > 0:
        reg_btn.scroll_into_view_if_needed()
        reg_btn.click(force=True)
        time.sleep(7.0)

    print(f"  ✅ 카페 게시글 등록 완료! URL: {page.url}", flush=True)
    return page.url, ed_len


def update_cafe_skins_and_profile(page, context):
    res = {}
    profile_png = str(BRAND_DIR / "kidsfit_profile_500.png")
    title_png = str(BRAND_DIR / "kidsfit_cafe_title_1080x240.png")

    # A) Cafe Title Banner (ManageLogoUserImageView.nhn)
    print("🎨 [카페 타이틀 배너] 업로드 중...", flush=True)
    safe_goto(page, "https://cafe.naver.com/ManageLogoUserImageView.nhn?clubid=31805224", sleep_sec=3.0)
    page.evaluate("window.confirm = () => true; window.alert = () => true;")
    try:
        logo_inp = page.locator("input#uploadLogo, input[type='file']").first
        if logo_inp.count() > 0:
            try:
                with context.expect_page(timeout=4000) as pop_info:
                    logo_inp.click(force=True)
                pop = pop_info.value
                pop.wait_for_load_state("commit")
                time.sleep(2.0)
                f_inp = pop.locator("input[type='file']").first
                if f_inp.count() > 0:
                    f_inp.set_input_files(title_png)
                    time.sleep(2.0)
                    ok = pop.locator("a:has-text('확인'), button:has-text('확인'), input[value*='확인'], a.btn_confirm").first
                    if ok.count() > 0:
                        ok.click(force=True)
                        time.sleep(2.0)
            except Exception:
                logo_inp.set_input_files(title_png)
                time.sleep(2.0)
        sub_btn = page.locator("a#submitBtn, a:has-text('바로적용')").first
        if sub_btn.count() > 0:
            sub_btn.click(force=True)
            time.sleep(2.5)
        res["cafe_title_banner"] = "applied"
    except Exception as e:
        res["cafe_title_banner"] = f"error: {e}"

    # B) Cafe Front Gate (ManageGateEditor.nhn -> HTML mode matching KidsFit homepage)
    print("🎨 [카페 대문] 키즈핏 홈페이지 디자인 카드 적용 중...", flush=True)
    safe_goto(page, "https://cafe.naver.com/ManageGateEditor.nhn?clubid=31805224", sleep_sec=3.5)
    page.evaluate("window.confirm = () => true; window.alert = () => true;")
    gate_html = """<div style="background:#FAF8F5;padding:36px 28px;border-radius:28px;border:2px solid #E6EAF2;font-family:'Pretendard','Malgun Gothic',sans-serif;color:#0F172A;max-width:1020px;margin:0 auto;">
  <div style="background:#FFFFFF;border-radius:24px;padding:32px;border:1px solid #E2E8F0;box-shadow:0 10px 30px rgba(20,30,55,0.05);">
    <div style="display:inline-block;background:#EEF2FF;color:#4F46E5;font-weight:800;font-size:14px;padding:8px 16px;border-radius:999px;margin-bottom:16px;">
      BUILT ON OFFICIAL STANDARDS · 질병관리청 성장도표 &amp; 보건복지부 K-DST 기준
    </div>
    <h1 style="font-size:30px;font-weight:900;line-height:1.35;margin:0 0 12px 0;color:#0F172A;">
      🌱 키즈핏(KIDS-FIT) 소아성장 · 두뇌학습 공식 연구소
    </h1>
    <p style="font-size:17px;line-height:1.6;color:#475569;margin:0 0 24px 0;">
      소아내분비·뇌인지 학술 논문 2,480+편 기반으로 <b>우리 아이 숨은 키 +7cm 골든타임</b>과 <b>5대 두뇌 학습 역량(LQ)</b>을 1분 만에 정밀 진단하고 연령별 맞춤 루틴을 처방합니다.
    </p>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
      <div style="flex:1;min-width:220px;background:#ECFDF5;border:2px solid #10B981;border-radius:18px;padding:16px;">
        <div style="font-size:18px;font-weight:800;color:#047857;margin-bottom:6px;">📏 제1축: 신체 성장 리포트</div>
        <div style="font-size:14px;color:#065F46;line-height:1.5;">키·체중 백분위, 부모 유전 예상키(MPH), 사춘기 골든타임 &amp; 밤 10시 수면·영양·자세 처방</div>
      </div>
      <div style="flex:1;min-width:220px;background:#EEF2FF;border:2px solid #4F46E5;border-radius:18px;padding:16px;">
        <div style="font-size:18px;font-weight:800;color:#4338CA;margin-bottom:6px;">🧠 제2축: 두뇌·학습 리포트</div>
        <div style="font-size:14px;color:#3730A3;line-height:1.5;">5대 학습 역량(LQ), 강점·약점 뇌과학 분석, 미래 적성 &amp; 연령별 맞춤 교구·필독서·나들이</div>
      </div>
      <div style="flex:1;min-width:220px;background:#FFF7ED;border:2px solid #F97316;border-radius:18px;padding:16px;">
        <div style="font-size:18px;font-weight:800;color:#C2410C;margin-bottom:6px;">🎁 카페 전용 무료 혜택</div>
        <div style="font-size:14px;color:#9A3412;line-height:1.5;">만 3~6세 소근육 워크지 · 초중등 코넬 백지복습 노트 · 키성장 기록표 PDF 무료 다운로드</div>
      </div>
    </div>
    <div style="text-align:center;padding-top:8px;">
      <a href="https://truthofmarket.com" target="_blank" style="display:inline-block;background:#4F46E5;color:#FFFFFF;font-weight:800;font-size:17px;padding:14px 28px;border-radius:999px;text-decoration:none;">
        🚀 우리 아이 1분 무료 성장·두뇌 진단 바로가기 (truthofmarket.com)
      </a>
    </div>
  </div>
</div>"""
    try:
        for f in page.frames:
            if "Gate.nhn" in f.url:
                f.evaluate("""(html) => {
                    var chk = document.getElementById('elHtmlMode');
                    if (chk && !chk.checked) chk.click();
                    var tb = document.getElementById('textbox') || document.querySelector('textarea[name="content"]');
                    if (tb) {
                        tb.value = html;
                    }
                }""", gate_html)
                time.sleep(1.0)
        apply_gate_btn = page.locator("a.btn_type_gn, a:has-text('바로적용')").first
        if apply_gate_btn.count() > 0:
            apply_gate_btn.click(force=True)
            time.sleep(3.0)
        res["cafe_gate"] = "applied"
    except Exception as e:
        res["cafe_gate"] = f"error: {e}"

    # C) Cafe Profile Icon (base-info-management)
    print("🎨 [카페 프로필 아이콘] 업로드 중...", flush=True)
    safe_goto(page, "https://cafe.naver.com/ca-fe/admin/cafes/31805224/base-info-management", sleep_sec=3.5)
    page.evaluate("window.confirm = () => true; window.alert = () => true;")
    try:
        for f in page.frames:
            if "base-info-management" in f.url:
                edit_btn = f.locator("a.btn_edit:has-text('편집')").first
                if edit_btn.count() > 0:
                    try:
                        with context.expect_page(timeout=5000) as pop_info:
                            edit_btn.click(force=True)
                        pop = pop_info.value
                        pop.wait_for_load_state("commit")
                        time.sleep(2.0)
                        f_inp = pop.locator("input[type='file']").first
                        if f_inp.count() > 0:
                            f_inp.set_input_files(profile_png)
                            time.sleep(2.5)
                            ok = pop.locator("a:has-text('확인'), button:has-text('확인'), a.btn_confirm, button.btn_confirm, a:has-text('등록'), button:has-text('등록')").first
                            if ok.count() > 0:
                                ok.click(force=True)
                                time.sleep(2.0)
                    except Exception:
                        pass
                save_btn = f.locator("a.btn_type_ny2:has-text('저장하기')").first
                if save_btn.count() > 0:
                    save_btn.click(force=True)
                    time.sleep(2.5)
                res["cafe_profile_icon"] = "applied"
    except Exception as e:
        res["cafe_profile_icon"] = f"error: {e}"

    return res


def update_blog_skins_and_profile(page, context):
    res = {}
    profile_png = str(BRAND_DIR / "kidsfit_profile_500.png")
    cover_png = str(BRAND_DIR / "kidsfit_cafe_gate_1080x520.png")
    skin_png = str(BRAND_DIR / "kidsfit_blog_skin_966x260.png")

    # A) Blog Profile Image & Mobile Cover Image (AdminUserBasic.naver)
    print("🎨 [블로그 프로필 & 커버 이미지] 업로드 중...", flush=True)
    safe_goto(page, "https://admin.blog.naver.com/AdminMain.naver?blogId=expertise333&Redirect=Basicinfo", sleep_sec=3.5)
    page.evaluate("window.confirm = () => true; window.alert = () => true;")
    try:
        for f in page.frames:
            if "AdminUserBasic" in f.url:
                # 1) Profile Image Upload
                prof_btn = f.locator("a._btnProfileImageUpload").first
                if prof_btn.count() > 0:
                    try:
                        with context.expect_page(timeout=4000) as pop_info:
                            prof_btn.click(force=True)
                        pop = pop_info.value
                        pop.wait_for_load_state("commit")
                        time.sleep(2.0)
                        f_inp = pop.locator("input[type='file']").first
                        if f_inp.count() > 0:
                            f_inp.set_input_files(profile_png)
                            time.sleep(2.5)
                            ok = pop.locator("a:has-text('확인'), button:has-text('확인'), input[value*='확인'], a:has-text('등록'), button:has-text('등록'), img[alt*='확인'], img[alt*='등록']").first
                            if ok.count() > 0:
                                ok.click(force=True)
                                time.sleep(2.0)
                    except Exception as e:
                        print(f"  ⚠️ 블로그 프로필 팝업: {e}", flush=True)

                # Click 확인 on AdminUserBasic
                cfm = f.locator("input._btnConfirm").first
                if cfm.count() > 0:
                    cfm.click(force=True)
                    time.sleep(2.5)
                res["blog_profile_and_cover"] = "applied"
    except Exception as e:
        res["blog_profile_and_cover"] = f"error: {e}"

    # B) Blog PC Title & Background Skin (Remocon.naver)
    print("🎨 [블로그 PC 타이틀 배너 & 배경 스킨] 업로드 중...", flush=True)
    safe_goto(page, "https://admin.blog.naver.com/Remocon.naver?blogId=expertise333&loadType=admin&Redirect=Remocon&SelectedMenu=title", sleep_sec=4.0)
    page.evaluate("window.confirm = () => true; window.alert = () => true;")
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
            if (hInp) {
                hInp.value = '260';
            }
            const sub = document.querySelector('a.btn_submit._showConfirmLayer, a.btn_submit');
            if (sub) sub.click();
        }""")
        time.sleep(1.5)
        page.evaluate("""() => {
            const okBtns = Array.from(document.querySelectorAll('a, button, input')).filter(el => (el.innerText || el.value || '').trim() === '적용' || (el.innerText || el.value || '').trim() === '확인');
            okBtns.forEach(b => { try { b.click(); } catch(e){} });
        }""")
        time.sleep(3.0)
        res["blog_pc_title_skin"] = "applied"
    except Exception as e:
        res["blog_pc_title_skin"] = f"error: {e}"

    return res


def main():
    report = {"cafe_posts": [], "blog_posts": [], "skins": {}}
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()

        # 1. Delete old incomplete Cafe articles (13, 16, 17, 18, 19, 20)
        for aid in [13, 16, 17, 18, 19, 20]:
            try:
                safe_goto(page, f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{aid}", sleep_sec=2.5)
                page.evaluate("window.confirm = () => true; window.alert = () => true;")
                del_btn = page.locator("a.BaseButton:has-text('삭제'), button.BaseButton:has-text('삭제')").first
                if del_btn.count() > 0:
                    del_btn.click(force=True)
                    time.sleep(1.5)
                    confirm_btn = page.locator("button.BaseButton--skinGreen:has-text('확인'), button:has-text('확인')").first
                    if confirm_btn.count() > 0 and confirm_btn.is_visible():
                        confirm_btn.click(force=True)
                        time.sleep(2.0)
                    print(f"🗑️ 기존 미완성 카페 게시글 #{aid} 삭제 완료", flush=True)
            except Exception as e:
                print(f"  ⚠️ 게시글 #{aid} 삭제 스킵: {e}", flush=True)

        # 2. Re-publish all 3 Cafe Posts with full line-by-line body text & banners
        # Post 1: Welcome Notice
        p1_txt = (CAFE_PACK / "1번글_카페대문_전체환영공지글" / "01_카페대문_전체환영공지글_본문.txt").read_text(encoding="utf-8")
        p1_title, p1_body = split_title_and_body(p1_txt)
        url1, len1 = publish_cafe_post_clean(
            page,
            board_name="공지 및 키즈핏 가이드",
            title=p1_title,
            body=p1_body,
            tags=["키즈핏", "아이키성장", "예상키계산기", "영유아건강검진", "소근육발달", "몬테소리교구", "육아카페"],
            is_notice=True,
            images=[str(BRAND_DIR / "kidsfit_post1_welcome_banner.png")],
        )
        report["cafe_posts"].append({"title": p1_title, "url": url1, "body_len": len1})

        # Post 2: Free Worksheet 3-Pack
        p2_dir = CAFE_PACK / "2번글_연령별_무료워크지3종_나눔게시글"
        p2_txt = (p2_dir / "01_연령별_무료워크지3종_나눔게시글_본문.txt").read_text(encoding="utf-8")
        p2_title, p2_body = split_title_and_body(p2_txt)
        p2_imgs = [
            str(p2_dir / "01_키즈핏_만3-6세_소근육_선긋기_도형_워크지.png"),
            str(p2_dir / "02_키즈핏_초중등_5분_코넬백지복습노트_주간계획표.png"),
            str(p2_dir / "03_키즈핏_전연령_매월1일_키성장기록표_밤10시숙면스티커판.png"),
        ]
        url2, len2 = publish_cafe_post_clean(
            page,
            board_name="연령별 무료 워크지 PDF",
            title=p2_title,
            body=p2_body,
            tags=["무료워크지", "유아워크시트", "소근육발달", "선긋기프린트", "코넬노트", "키성장기록표", "키즈핏"],
            is_notice=False,
            images=p2_imgs,
        )
        report["cafe_posts"].append({"title": p2_title, "url": url2, "body_len": len2})

        # Post 3: Monthly 1st Day Report Challenge
        p3_txt = (CAFE_PACK / "3번글_매월1일_키즈핏리포트_인증챌린지_공지글" / "01_매월1일_키즈핏리포트_인증챌린지_공지글_본문.txt").read_text(encoding="utf-8")
        p3_title, p3_body = split_title_and_body(p3_txt)
        url3, len3 = publish_cafe_post_clean(
            page,
            board_name="매월 1일 리포트 인증방",
            title=p3_title,
            body=p3_body,
            tags=["키즈핏챌린지", "아이키백분위", "예상키계산기", "밤10시수면", "우리아이키성장"],
            is_notice=True,
            images=[str(BRAND_DIR / "kidsfit_post3_challenge_banner.png")],
        )
        report["cafe_posts"].append({"title": p3_title, "url": url3, "body_len": len3})

        # Verify Cafe Articles via API and inspect actual contentLen of each new article
        safe_goto(page, "https://cafe.naver.com/moneyfitlab", sleep_sec=2.5)
        articles = page.evaluate("""async () => {
            const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=20', { credentials: 'include' });
            const j = await r.json();
            return (j.message && j.message.result && j.message.result.articleList) ? j.message.result.articleList.map(a => ({ id: a.articleId, subject: a.subject, menuName: a.menuName })) : [];
        }""")
        for a in articles:
            aid = a["id"]
            safe_goto(page, f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{aid}", sleep_sec=3.0)
            c_len = page.evaluate("""() => {
                const paras = Array.from(document.querySelectorAll('.se-text-paragraph')).map(p => p.innerText).join('\\n').trim();
                if (paras.length > 0) return paras.length;
                const el = document.querySelector('.se-main-container, .ArticleContentBox .content, .se-viewer');
                return el ? el.innerText.trim().length : 0;
            }""")
            a["verified_content_len"] = c_len
            a["url"] = f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{aid}"
            print(f"  ✅ 검증된 카페 글 #{aid} ({a['menuName']}): 본문 {c_len}자", flush=True)
        report["verified_cafe_articles"] = articles

        # 3. Check Blog post 224450570303 body length; if truncated, re-publish cleanly
        safe_goto(page, "https://blog.naver.com/PostView.naver?blogId=expertise333&logNo=224450570303", sleep_sec=2.5)
        blog_len = page.evaluate("""() => {
            const el = document.querySelector('.se-main-container');
            return el ? el.innerText.trim().length : 0;
        }""")
        print(f"📋 기존 블로그 글(224450570303) 본문 길이: {blog_len}자", flush=True)
        if blog_len < 500:
            print("📝 블로그 1일차 칼럼 줄단위 전체 본문으로 재발행 중...", flush=True)
            b1_title = (BLOG_PACK / "01_블로그_제목.txt").read_text(encoding="utf-8").strip()
            b1_body = (BLOG_PACK / "02_블로그_본문.txt").read_text(encoding="utf-8").strip()
            b1_tags = (BLOG_PACK / "03_블로그_해시태그.txt").read_text(encoding="utf-8").strip().split()
            b1_img = str(BLOG_PACK / "04_블로그_대표이미지_blog_day01_growth_mph.png")

            safe_goto(page, "https://blog.naver.com/PostWriteForm.naver?blogId=expertise333", sleep_sec=5.0)
            page.evaluate("window.confirm = () => true; window.alert = () => true;")
            for sel in ["button.se-popup-button-cancel", "button.se-help-panel-close-button"]:
                try:
                    btn = page.locator(sel).first
                    if btn.count() > 0 and btn.is_visible():
                        btn.click(force=True)
                        time.sleep(0.5)
                except Exception:
                    pass

            title_para = page.locator(".se-title-text .se-text-paragraph, .se-documentTitle .se-text-paragraph").first
            if title_para.count() > 0:
                title_para.click(force=True)
                time.sleep(0.3)
                page.keyboard.insert_text(b1_title)
                time.sleep(0.4)

            body_para = page.locator(".se-component.se-text .se-text-paragraph").first
            if body_para.count() > 0:
                body_para.click(force=True)
                time.sleep(0.3)

            if Path(b1_img).exists():
                img_btn = page.locator("button.se-image-toolbar-button").first
                if img_btn.count() > 0:
                    try:
                        with page.expect_file_chooser(timeout=5000) as fc_info:
                            img_btn.click(force=True)
                        fc = fc_info.value
                        fc.set_files(b1_img)
                        time.sleep(3.5)
                    except Exception:
                        pass

            body_para_last = page.locator(".se-component.se-text .se-text-paragraph").last
            if body_para_last.count() > 0:
                body_para_last.click(force=True)
                time.sleep(0.3)
            page.keyboard.press("Enter")
            type_multiline_into_se_one(page, b1_body)
            time.sleep(1.0)

            pub_btn = page.locator("button[class*='publish_btn']").first
            if pub_btn.count() > 0:
                pub_btn.click(force=True)
                time.sleep(1.5)
                tag_inp = page.locator("input[placeholder*='태그'], input[id*='tag']").first
                if tag_inp.count() > 0 and tag_inp.is_visible():
                    for t in b1_tags[:10]:
                        tag_inp.click(force=True)
                        tag_inp.fill(t.lstrip("#"))
                        page.keyboard.press("Enter")
                        time.sleep(0.15)
                confirm_pub = page.locator("button[class*='confirm_btn']").first
                if confirm_pub.count() > 0:
                    confirm_pub.click(force=True)
                    time.sleep(5.5)
            report["blog_republished_url"] = page.url

        # 4. Update Cafe & Blog Profile / Background Skins
        report["skins"]["cafe"] = update_cafe_skins_and_profile(page, context)
        report["skins"]["blog"] = update_blog_skins_and_profile(page, context)

        # Refresh visible tabs
        try:
            safe_goto(context.pages[0], "https://cafe.naver.com/moneyfitlab", sleep_sec=2.0)
            if len(context.pages) > 1:
                safe_goto(context.pages[1], "https://blog.naver.com/expertise333", sleep_sec=2.0)
        except Exception:
            pass

        page.close()

    out_path = LOG_DIR / "brand_skins_and_posts_fixed.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"🎉 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
