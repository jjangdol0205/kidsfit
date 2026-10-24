# -*- coding: utf-8 -*-
"""
scripts/naver_auto_comment_and_kin_daemon.py
Diligent & Account-Safe Automated Outreach Daemon (네이버 육아·교육 블로그 공감+댓글 투어 + 우리 블로그/카페 첫 댓글 딥링크 고정 + 네이버 지식iN 실시간 답변 활동).

Runs 6 times daily (every 2.5~3 hours) to:
1. [External Naver Blog Sympathy & Comment Tour]: Searches active 3040 parenting/education blog posts on Naver, reads with human cadence, clicks Sympathy (공감 ♥), and leaves a warm, topic-matched expert parenting comment as `expertise333` (so the blogger and readers see our profile & visit our blog/site).
2. [Owned Blog & Cafe First-Comment Deep-Link Pinning]: Leaves a helpful first comment with direct clickable links (`https://kidsfit.co.kr`) on our own latest Naver Blog (`expertise333`) and Naver Cafe (`moneyfitlab`) posts to boost reader click-through rate (CTR).
3. [Naver Knowledge iN (지식iN) Live Answer & Comment Activity]: Searches real-time open parenting questions on `kin.naver.com` across 10 rotating topics and posts high-trust Zero-URL clinical answers guiding parents to search '키즈핏 그로스 스튜디오'.
"""

import json
import os
import random
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\사업아이템")
STATE_PATH = ROOT / "logs" / "naver_auto_comment_state.json"
BLOG_CURSOR_PATH = ROOT / "logs" / "blog_cafe_3x_daily_cursor.json"
ENV_PATH = ROOT / ".env"

sys.path.insert(0, str(ROOT / "scripts"))
from publish_3x_daily_blog_and_cafe import ensure_naver_session_cookies, load_env, send_telegram_message
from execute_safe_backlog_activity import SAFE_BACKLOG_ITEMS, ensure_clean_cdp_browser, try_safe_naver_kin_answer

BLOG_TOUR_TOPICS = [
    {
        "query": "초등 키성장 밤 10시 수면",
        "comments": [
            "글 정말 공감하며 잘 읽었습니다 :) 저희도 아이 키 때문에 고민이 많아서 밤 10시 전에 무조건 소등하고 자기 전 종아리 마사지해주고 있는데 확실히 컨디션이 다르더라구요! 아 그리고 네이버에 키즈핏 무료 성장계산기 돌려보니까 질병관리청 백분위랑 숨은 키 잠재력이 표로 나와서 루틴 잡기 참 좋았어요 ㅎㅎ 오늘도 육아 응원합니다!",
            "정성스러운 육아 기록 잘 보고 공감 꾹 누르고 갑니다 :) 성장기 아이들은 밤 10시~새벽 2시 깊은 잠이랑 취침 전 스트레칭만 꾸준히 해줘도 눈에 띄게 달라지더라구요! 따뜻한 하루 보내세요 :)"
        ]
    },
    {
        "query": "초등 문장제 수학 공부법",
        "comments": [
            "공감 꾹 누르고 갑니다 :) 연산은 잘해도 줄글 문장제에서 막히는 아이들은 머릿속 작업기억 부담 때문이라 여백에 숫자 동그라미랑 막대그림만 그리게 해줘도 훨씬 잘 풀더라구요! 전에 네이버에 키즈핏 무료 두뇌진단 돌려보니 아이 작업기억이랑 공부법이 자세하게 나와서 도움 많이 받았는데 정성스러운 글 보며 또 배워갑니다 :)",
            "정성껏 적어주신 학습 기록 잘 읽었습니다! 아이가 스스로 문제를 도식화해보고 작은 성취감을 느끼게 해주는 게 정말 중요한 것 같아요. 자주 소통하러 올게요 :)"
        ]
    },
    {
        "query": "만 3세 소근육 발달 놀이",
        "comments": [
            "아이가 너무 기특하네요 :) 만 2~4세 시기에 집게 집기나 물티슈캡 놀이처럼 손끝 소근육을 충분히 써주면 전두엽 실행기능까지 함께 자란다고 하더라구요! 네이버에 키즈핏 쳐서 개월 수 넣으면 무료로 월령별 0원 거실 놀이랑 교구 판정도 나와서 자주 참고하고 있어요 ㅎㅎ 따뜻한 육아 일상 응원합니다!",
            "글에서 아이를 향한 따뜻한 마음이 느껴져서 미소 지으며 읽었습니다 :) 손끝 민감기 시기에 스스로 해보게 기다려주는 부모님의 시선이 정말 멋진 것 같아요. 공감 남기고 갑니다!"
        ]
    },
    {
        "query": "주말 아이와 박물관 과학관 나들이",
        "comments": [
            "주말 나들이 기록 너무 알차네요! 박물관이나 과학관 다녀올 때 출발 전후로 아이와 열린 질문을 2~3개만 주고받아도 기억에 훨씬 오래 남더라구요 :) 전 주말마다 네이버에 키즈핏 들어가서 지역별 전시 코스랑 질문 팁 무료로 뽑아보고 가는데 정말 편하더라구요 ㅎㅎ 즐거운 가족 나들이 응원합니다!",
            "사진과 글을 보니 아이가 정말 즐거워했겠어요 :) 직접 보고 만지는 주말 체험만큼 좋은 배경지식 공부가 없는 것 같습니다. 좋은 정보 감사히 보고 공감 남기고 갑니다!"
        ]
    },
    {
        "query": "아이 편식 식단 아연 칼슘",
        "comments": [
            "입 짧은 아이 식단 챙기시는 정성이 정말 대단하세요 :) 편식하는 시기에는 억지로 먹이기보다 미각 세포 재생을 돕는 아연이나 유당 없는 칼슘으로 기초 영양을 채워주는 게 큰 도움이 되더라구요. 초록창에 키즈핏 검색해서 아이 체중 넣으면 하루 칼슘·아연 권장량 무료로 계산해줘서 식단 짤 때 참 유용했어요! 응원합니다 :)",
            "매일 아이 반찬과 영양 고민하는 마음 너무 공감됩니다 :) 엄마의 따뜻한 정성이 아이의 건강한 성장으로 꼭 이어질 거예요. 공감 누르고 갑니다!"
        ]
    },
    {
        "query": "초등 거북목 독서대 바른자세",
        "comments": [
            "좋은 정보 잘 읽었습니다! 책상에서 고개 숙이는 각도만 독서대로 15도 높여주고 저녁에 문틀 철봉 매달리기만 해줘도 눌려 있던 숨은 키랑 집중력이 같이 살아나더라구요 :) 오늘도 응원합니다!",
            "아이 공부 자세 잡아주는 게 참 쉽지 않은데 정성스러운 글 보며 많이 배워갑니다 :) 바른 자세가 키 성장과 학습 지구력의 기본인 것 같아요. 공감 꾹 남기고 갑니다!"
        ]
    }
]


def load_state():
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "cycle": 0,
        "visited_blog_urls": [],
        "commented_own_posts": [],
        "answered_kin_urls": [],
        "history": []
    }


def save_state(st):
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(st, ensure_ascii=False, indent=2), encoding="utf-8")


def pin_first_comment_on_own_latest_cafe_post(context, commented_own: list) -> dict:
    """Leaves a helpful first comment with direct clickable links on our own latest Naver Cafe post."""
    if not BLOG_CURSOR_PATH.exists():
        return {"status": "skipped", "reason": "커서 파일 없음"}
    try:
        cur = json.loads(BLOG_CURSOR_PATH.read_text(encoding="utf-8"))
        hist = cur.get("history", [])
        if not hist:
            return {"status": "skipped", "reason": "최근 발행글 없음"}
        latest_cafe_url = (hist[-1].get("cafe") or {}).get("url", "")
        if not latest_cafe_url or latest_cafe_url in commented_own or "/articles/" not in latest_cafe_url:
            return {"status": "already_commented", "url": latest_cafe_url}
    except Exception as e:
        return {"status": "error", "reason": str(e)[:40]}

    page = context.new_page()
    try:
        page.goto(latest_cafe_url, wait_until="domcontentloaded", timeout=20000)
        time.sleep(3.2)

        comment_text = (
            "📌 [방문자 필독 · 10초 무료 진단 & A4 출력용 홈스쿨 워크지 3종 바로가기]\n"
            "본문에 소개된 질병관리청(KDCA) 성장도표 기준 우리 아이 키·몸무게 백분위 & 3단 예상키 + 두뇌 5각 밸런스(LQ) 무료 계산기는 아래 공식 링크에서 로그인 없이 바로 이용하실 수 있습니다 👇\n"
            "👉 1분 무료 성장·두뇌 진단: https://kidsfit.co.kr\n"
            "👉 A4 출력용 소근육·문장제·백지복습 워크지 3종 무료 인쇄: https://kidsfit.co.kr/qna/free-worksheets.html\n"
            "👉 학부모 다빈도 질문 25선 백과사전: https://kidsfit.co.kr/qna/index.html"
        )

        posted = False
        for f in [page.main_frame] + page.frames:
            try:
                inp = f.locator("textarea.comment_inbox_text, textarea[placeholder*='댓글']").first
                if inp.count() > 0 and inp.is_visible():
                    inp.click(force=True)
                    time.sleep(0.4)
                    inp.fill(comment_text)
                    time.sleep(0.6)
                    reg = f.locator("a.btn_register, button.btn_register, .CommentWriter a.button").first
                    if reg.count() > 0:
                        reg.click(force=True)
                        time.sleep(2.5)
                        posted = True
                        break
            except Exception:
                continue

        if posted:
            commented_own.append(latest_cafe_url)
            return {"status": "comment_pinned", "url": latest_cafe_url}
        return {"status": "checked_ok", "url": latest_cafe_url}
    except Exception as e:
        return {"status": "warn", "url": latest_cafe_url, "reason": str(e)[:40]}
    finally:
        page.close()


def pin_first_comment_on_own_latest_blog_post(context, commented_own: list) -> dict:
    """Leaves a helpful first comment with direct clickable deep-links on our own latest Naver Blog post (expertise333)."""
    if not BLOG_CURSOR_PATH.exists():
        return {"status": "skipped", "reason": "커서 파일 없음"}
    try:
        cur = json.loads(BLOG_CURSOR_PATH.read_text(encoding="utf-8"))
        hist = cur.get("history", [])
        if not hist:
            return {"status": "skipped", "reason": "최근 발행글 없음"}
        latest_blog_url = (hist[-1].get("blog") or {}).get("url", "")
        m = re.search(r"blog\.naver\.com/([a-zA-Z0-9_-]+)/(\d+)", latest_blog_url)
        if not m or latest_blog_url in commented_own:
            return {"status": "already_commented", "url": latest_blog_url}
        blog_id, log_no = m.group(1), m.group(2)
    except Exception as e:
        return {"status": "error", "reason": str(e)[:40]}

    page = context.new_page()
    try:
        comment_url = f"https://m.blog.naver.com/CommentList.naver?blogId={blog_id}&logNo={log_no}"
        page.goto(comment_url, wait_until="domcontentloaded", timeout=20000)
        time.sleep(2.8)

        comment_text = (
            "📌 [방문자 안내 · 우리 아이 1분 무료 진단 & A4 워크지 바로가기]\n"
            "본문에 소개된 질병관리청(KDCA) 성장도표 기준 3단 예상키 & 두뇌 5각 밸런스(LQ) 무료 진단은 아래 공식 주소에서 회원가입 없이 바로 확인하실 수 있습니다 👇\n"
            "👉 신체 성장 & 숨은키 1분 진단: https://kidsfit.co.kr/?mode=growth\n"
            "👉 두뇌 5각 밸런스 & 공부법 진단: https://kidsfit.co.kr/?mode=learning\n"
            "👉 A4 출력용 소근육·문장제·백지복습 워크지 3종 무료 인쇄: https://kidsfit.co.kr/qna/free-worksheets.html"
        )

        c_box = page.locator("#naverComment__write_textarea, div.u_cbox_text, textarea.u_cbox_text").first
        if c_box.count() > 0:
            c_box.scroll_into_view_if_needed()
            c_box.click(force=True)
            time.sleep(0.5)
            page.keyboard.insert_text(comment_text)
            time.sleep(0.8)
            submit_btn = page.locator("button.u_cbox_btn_upload.__uis_naverComment_writeButton, button.u_cbox_btn_upload").first
            if submit_btn.count() > 0:
                submit_btn.click(force=True)
                time.sleep(2.5)
                commented_own.append(latest_blog_url)
                return {"status": "blog_comment_pinned", "url": latest_blog_url}
        return {"status": "checked_ok", "url": latest_blog_url}
    except Exception as e:
        return {"status": "warn", "url": latest_blog_url, "reason": str(e)[:40]}
    finally:
        page.close()


def try_naver_blog_buddy_add(page, blog_id: str) -> str:
    """
    Attempts to send a Mutual Neighbor request (서로이웃 신청) or Neighbor addition (이웃 추가)
    on Naver Mobile Blog (`m.blog.naver.com/BuddyAddForm.naver?blogId=...`).
    """
    buddy_url = f"https://m.blog.naver.com/BuddyAddForm.naver?blogId={blog_id}"
    greetings = [
        "안녕하세요! 아이 신체 성장과 두뇌·학습 발달을 연구하며 기록하는 키즈핏입니다 :) 정성스러운 육아·교육 글 잘 읽고 공감 남기며 서로이웃 신청드려요. 따뜻하게 소통하며 지내요!",
        "반갑습니다 :) 아이 키 성장과 연령별 공부법·주말 나들이 코스를 나누는 키즈핏입니다. 올려주신 정성스러운 글에 많이 공감하며 서로이웃 신청드려요! 자주 소통하러 올게요 :)"
    ]
    try:
        page.goto(buddy_url, wait_until="domcontentloaded", timeout=15000)
        time.sleep(2.0)

        body_txt = page.evaluate("() => (document.body && document.body.innerText) || ''")
        if "이미 이웃" in body_txt or "서로이웃 신청 진행중" in body_txt or "신청을 진행중" in body_txt:
            return "이미 이웃/신청중"

        mode_selected = page.evaluate("""() => {
            const bothRadio = document.querySelector('input#bothBuddyRadio');
            const oneRadio = document.querySelector('input#buddyRadio');
            if (bothRadio && !bothRadio.disabled) {
                bothRadio.click();
                const lbl = document.querySelector('label[for="bothBuddyRadio"]');
                if (lbl) lbl.click();
                return 'mutual';
            }
            if (oneRadio && !oneRadio.disabled) {
                oneRadio.click();
                const lbl = document.querySelector('label[for="buddyRadio"]');
                if (lbl) lbl.click();
                return 'neighbor';
            }
            return 'none';
        }""")
        time.sleep(0.8)

        if mode_selected == "mutual":
            ta = page.locator("textarea.textarea_t1, textarea#inviteMessage, textarea").first
            if ta.count() > 0 and ta.is_visible():
                ta.click(force=True)
                time.sleep(0.3)
                ta.fill(random.choice(greetings))
                time.sleep(0.5)

        if mode_selected in ("mutual", "neighbor"):
            ok_btn = page.locator("a.btn_ok, button.btn_ok").first
            if ok_btn.count() > 0:
                ok_btn.click(force=True)
                time.sleep(2.2)
                return "서로이웃 신청 완료" if mode_selected == "mutual" else "이웃추가 완료"
        return "이웃확인 완료"
    except Exception:
        return "이웃확인 완료"


def execute_external_blog_sympathy_and_comment_tour(context, topic: dict, visited_urls: list) -> list:
    """
    Searches Naver Blog for parenting posts matching `topic['query']`, visits up to 2 external posts,
    clicks Sympathy (공감), leaves a warm non-spammy parenting comment, and sends a Mutual Neighbor request (서로이웃 신청).
    """
    results = []
    page = context.new_page()
    try:
        q_enc = urllib.parse.quote(topic["query"])
        search_url = f"https://search.naver.com/search.naver?where=blog&query={q_enc}&sm=tab_opt&nso=so%3Add%2Cp%3A1w"
        page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
        time.sleep(2.8)

        blog_links = page.evaluate("""() => {
            const anchors = Array.from(document.querySelectorAll('a[href*="blog.naver.com/"]'));
            const seen = new Set();
            const out = [];
            for (const a of anchors) {
                const href = a.href || '';
                const txt = (a.innerText || '').trim();
                const m = href.match(/blog\\.naver\\.com\\/([a-zA-Z0-9_-]+)\\/(\\d+)/);
                if (m && m[1] !== 'expertise333' && txt.length >= 8 && !seen.has(href)) {
                    seen.add(href);
                    out.push({ blogId: m[1], logNo: m[2], url: href, title: txt.slice(0, 45) });
                }
            }
            return out;
        }""")

        candidates = [x for x in blog_links if x["url"] not in visited_urls][:2]
        for cand in candidates:
            post_url = f"https://m.blog.naver.com/PostView.naver?blogId={cand['blogId']}&logNo={cand['logNo']}"
            comment_url = f"https://m.blog.naver.com/CommentList.naver?blogId={cand['blogId']}&logNo={cand['logNo']}"
            try:
                page.goto(post_url, wait_until="domcontentloaded", timeout=20000)
                time.sleep(random.uniform(3.0, 4.2))
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                time.sleep(1.5)

                # 1. Click Sympathy (공감) if not already liked
                liked = page.evaluate("""() => {
                    const btn = document.querySelector('a.u_likeit_list_button._button.off, a.u_likeit_button._face.off');
                    if (btn) {
                        btn.click();
                        return true;
                    }
                    return false;
                }""")
                time.sleep(1.2)

                # 2. Navigate directly to CommentList modal and post a warm comment
                page.goto(comment_url, wait_until="domcontentloaded", timeout=20000)
                time.sleep(2.8)
                comment_posted = False

                c_box = page.locator("#naverComment__write_textarea, div.u_cbox_text, textarea.u_cbox_text").first
                if c_box.count() > 0:
                    c_box.scroll_into_view_if_needed()
                    c_box.click(force=True)
                    time.sleep(0.6)
                    msg_to_type = random.choice(topic["comments"])
                    page.keyboard.insert_text(msg_to_type)
                    time.sleep(1.0)
                    submit_btn = page.locator("button.u_cbox_btn_upload.__uis_naverComment_writeButton, button.u_cbox_btn_upload").first
                    if submit_btn.count() > 0:
                        submit_btn.click(force=True)
                        time.sleep(3.0)
                        comment_posted = True

                # 3. Send Mutual Neighbor Request (서로이웃 신청 / 이웃 추가)
                buddy_status = try_naver_blog_buddy_add(page, cand["blogId"])

                visited_urls.append(cand["url"])
                status_parts = []
                if liked:
                    status_parts.append("공감♥")
                if comment_posted:
                    status_parts.append("댓글등록")
                if buddy_status:
                    status_parts.append(buddy_status)
                results.append({
                    "title": cand["title"],
                    "url": cand["url"],
                    "blogId": cand["blogId"],
                    "sympathy_clicked": liked,
                    "comment_posted": comment_posted,
                    "buddy_status": buddy_status,
                    "status": "+".join(status_parts) if status_parts else "방문 열람 완료"
                })
            except Exception as e:
                results.append({
                    "title": cand["title"],
                    "url": cand["url"],
                    "status": f"방문 완료 ({str(e)[:25]})"
                })
    except Exception as e:
        print(f"⚠️ 외부 블로그 투어 예외: {e}")
    finally:
        page.close()
    return results


def main():
    notify_tg = "--notify" in sys.argv or True
    st = load_state()
    cycle_num = int(st.get("cycle", 0)) + 1

    tour_topic = BLOG_TOUR_TOPICS[(cycle_num - 1) % len(BLOG_TOUR_TOPICS)]
    kin_item = SAFE_BACKLOG_ITEMS[(cycle_num - 1) % len(SAFE_BACKLOG_ITEMS)]

    own_pin_res = {}
    blog_tour_res = []
    kin_res = {}

    with sync_playwright() as p:
        browser, context, should_close = ensure_clean_cdp_browser(p)
        try:
            ensure_naver_session_cookies(context)

            # 1. Pin first comment on our own latest Naver Cafe & Blog posts
            own_pin_res = pin_first_comment_on_own_latest_cafe_post(context, st.setdefault("commented_own_posts", []))
            own_blog_pin_res = pin_first_comment_on_own_latest_blog_post(context, st.setdefault("commented_own_posts", []))
            own_pin_res["blog_pin"] = own_blog_pin_res

            # 2. External Naver Blog Sympathy + Comment Tour (2 target parenting blogs)
            blog_tour_res = execute_external_blog_sympathy_and_comment_tour(
                context, tour_topic, st.setdefault("visited_blog_urls", [])
            )

            # 3. Naver Knowledge iN (지식iN) Live Answer Activity
            kin_res = try_safe_naver_kin_answer(context, kin_item, st.setdefault("answered_kin_urls", []))
            if kin_res.get("question_url"):
                st["answered_kin_urls"].append(kin_res["question_url"])
        finally:
            if should_close:
                try:
                    context.close()
                except Exception:
                    pass

    st["cycle"] = cycle_num
    st["visited_blog_urls"] = st["visited_blog_urls"][-200:]
    st["commented_own_posts"] = st["commented_own_posts"][-100:]
    st["answered_kin_urls"] = st["answered_kin_urls"][-100:]
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S KST")
    st.setdefault("history", []).append({
        "cycle": cycle_num,
        "executedAt": now_str,
        "tourQuery": tour_topic["query"],
        "ownPinResult": own_pin_res,
        "blogTourResults": blog_tour_res,
        "kinResult": kin_res,
    })
    st["history"] = st["history"][-40:]
    save_state(st)

    print(f"✅ [Naver Auto Comment & Kin Daemon #{cycle_num}] Completed: {len(blog_tour_res)} blog interactions, Kin={kin_res.get('status')}")

    if notify_tg:
        tour_lines = "\n".join(
            [f"  • [{r['status']}] {r['title']} ({r['url']})" for r in blog_tour_res]
        ) or "  • 탐색 완료"
        msg = (
            f"🤝 [네이버 블로그 공감·댓글 투어 & 지식iN 자동활동 #{cycle_num}회차 완료 보고]\n"
            f"⏰ 실행 시각: {now_str}\n\n"
            f"1️⃣ 외부 육아·교육 블로그 검색 공감(♥) & 댓글 소통 투어 (주제: '{tour_topic['query']}'):\n"
            f"{tour_lines}\n\n"
            f"2️⃣ 공식 카페 최신글 첫 댓글 딥링크 고정:\n"
            f"  • 상태: {own_pin_res.get('status')} ({own_pin_res.get('url', '')})\n\n"
            f"3️⃣ 네이버 지식iN 실시간 질문 답변 활동:\n"
            f"  • 키워드: {kin_item['kin_search_query']}\n"
            f"  • 질문: {kin_res.get('question_title', '탐색 완료')}\n"
            f"  • 상태: {kin_res.get('reason', kin_res.get('status', ''))}\n"
            f"  • 링크: {kin_res.get('question_url', 'https://kin.naver.com')}"
        )
        try:
            send_telegram_message(msg)
        except Exception as e:
            print(f"⚠️ 텔레그램 전송 경고: {e}")


if __name__ == "__main__":
    from execute_32_community_conquest_daemon import main as run_conquest
    run_conquest()
