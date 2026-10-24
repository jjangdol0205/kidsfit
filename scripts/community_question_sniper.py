# -*- coding: utf-8 -*-
"""
scripts/community_question_sniper.py
Real-Time Target Community Question Sniper & Mobile Stealth Screenshot Generator:
1. Scans live parenting & education questions across Naver Cafes (맘스홀릭, 도치맘, 초등맘, 지역 맘카페 등) and Open Web Communities.
2. Pairs each live question URL with a topic-matched 'Real-Mom Colloquial Reply (강퇴 0% 진짜 엄마 말투 댓글)'.
3. Captures 3 authentic mobile-viewport (390x844) screenshots of KidsFit Growth Studio's result charts (`samples/10_stealth_seeding_captures/`) for Trojan-Horse stealth question posts on 82Cook, Nate Pann, Karrot, and Mom Cafes.
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\키즈핏")
CAPTURE_DIR = ROOT / "samples" / "10_stealth_seeding_captures"
SNIPER_LOG_PATH = ROOT / "logs" / "community_question_sniper_latest.json"

sys.path.insert(0, str(ROOT / "scripts"))
from publish_3x_daily_blog_and_cafe import send_telegram_message
from execute_safe_backlog_activity import ensure_clean_cdp_browser

SNIPER_TARGETS = [
    {
        "category": "📏 키성장 · 영유아검진 백분위 (맘스홀릭·레몬테라스·지후맘 타겟)",
        "query": "영유아검진 키 백분위 걱정",
        "mom_reply": (
            "저희 애도 작년 검진 때 키 백분위가 낮게 나와서 병원 가봐야 하나 엄청 스트레스 받았었어요ㅠㅠ "
            "일단 밤 10시 전에 무조건 불 끄고, 자기 전 2시간은 우유·과일 끊고(인슐린 때문에 성장호르몬 막힌대요!) "
            "종아리랑 무릎 마사지 5분씩 해주니까 반년 사이에 확 따라잡더라구요! "
            "그냥 엄마 아빠 키로만 어림잡지 마시고 네이버에 키즈핏 쳐서 질병관리청 기준 백분위랑 수면 습관 고쳤을 때 "
            "숨은 키 몇 cm 더 크는지 무료 계산기 한 번 돌려보세요 로그인도 안 해도 돼서 마음 잡기 훨씬 좋았어요!"
        ),
    },
    {
        "category": "🧠 초등 문장제 수학 · 공부법 (도치맘·초등맘·강목·82쿡 타겟)",
        "query": "초등 문장제 수학 서술형 고민",
        "mom_reply": (
            "헉 저희 애랑 똑같네요ㅠㅠ 연산 학습지는 다 맞는데 줄글로 세 줄만 넘어가면 읽기도 전에 별표 치고 엄마 불러서 속 터졌었거든요.. "
            "근데 찾아보니까 그게 국어 어휘 문제가 아니라 머릿속 칠판(작업기억)이 좁아서 암산하다가 앞 숫자를 까먹는 거래요! "
            "문제 읽을 때 숫자엔 동그라미, 구하는 거엔 밑줄 긋게 하고 여백에 막대그림 그리게 하니까 거짓말처럼 나아졌어요. "
            "초록창에 키즈핏 검색하면 아이 5각 두뇌 밸런스랑 문장제 공부법 무료로 처방해주는 리포트 있는데 돈 안 드니까 한 번 뽑아보세요 진짜 도움 많이 됐어요 ㅎㅎ"
        ),
    },
    {
        "category": "🧩 만 2~4세 소근육 · 가베/몬테소리 교구 (도치맘·맘스홀릭·육아앱 타겟)",
        "query": "만3세 소근육 가베 몬테소리 고민",
        "mom_reply": (
            "이 시기 교구 진짜 고민되시죠ㅠㅠ 전 비싼 교구 들였다가 시기 안 맞아서 당근행 한 게 한두 개가 아니에요.. "
            "만 3세 전후면 처음부터 비싼 가베 사기보다 집에서 나무 빨래집게로 폼폼이 옮기기나 물티슈 캡에 병뚜껑 넣기 같은 손끝 악력 놀이부터 해보세요! "
            "그리고 교구 사시기 전에 네이버에 키즈핏 쳐서 아이 개월 수 넣으면 지금 시기에 몬테소리가 맞는지 가베가 맞는지랑 "
            "0원 거실 놀이 무료로 딱 판정해주더라구요 ㅎㅎ 그거 먼저 보고 사셔도 안 늦어요!"
        ),
    },
    {
        "category": "🗺️ 주말 아이와 나들이 · 박물관 코스 (분따·송파맘·동탄맘·당근 동네생활 타겟)",
        "query": "주말 아이와 박물관 과학관 추천",
        "mom_reply": (
            "주말마다 어디 데려갈지 진짜 숙제죠 ㅋㅋ 전 예전엔 그냥 유명한 박물관 데려갔더니 애가 기념품샵만 기억해서 허탈했었는데, "
            "요즘은 가기 전에 아이 관심사(공룡이나 역사)에 맞춰서 열린 질문 2~3개만 던져주면서 다녀오니까 훨씬 오래 기억하더라구요! "
            "아 맞다 네이버에 키즈핏 들어가서 사는 지역이랑 아이 관심사 고르면 이번 주말에 가기 좋은 박물관 동선이랑 "
            "출발 전 질문 팁까지 무료로 쫙 뽑아줘서 전 주말마다 그거 보고 가요 ㅎㅎ"
        ),
    },
]


def capture_mobile_stealth_screenshots(browser):
    """Generates 3 authentic smartphone (390x844) screenshots of KidsFit results for stealth question seeding."""
    CAPTURE_DIR.mkdir(parents=True, exist_ok=True)
    mob_ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    )
    page = mob_ctx.new_page()
    saved_files = []
    try:
        index_uri = (ROOT / "dist" / "index.html").as_uri()
        page.goto(f"{index_uri}?preset=elem_low", wait_until="domcontentloaded", timeout=20000)
        time.sleep(2.0)

        # Capture 1: Physical Growth 3-Stage Height & Percentile Chart
        p1 = CAPTURE_DIR / "stealth_capture_01_height_prediction.png"
        sec1 = page.locator("#report-pillar-1, #tab-growth, .report-section").first
        if sec1.count() > 0:
            sec1.scroll_into_view_if_needed()
            time.sleep(0.5)
        page.screenshot(path=str(p1), full_page=False)
        saved_files.append(str(p1))

        # Capture 2: Brain & Learning 5-Axis LQ Chart
        p2 = CAPTURE_DIR / "stealth_capture_02_brain_learning_lq.png"
        sec2 = page.locator("#report-pillar-2, #tab-learning, #lq-radar-box").first
        if sec2.count() > 0:
            sec2.scroll_into_view_if_needed()
            time.sleep(0.5)
        page.screenshot(path=str(p2), full_page=False)
        saved_files.append(str(p2))

        # Capture 3: Weekend Museum & History Course Prescription
        p3 = CAPTURE_DIR / "stealth_capture_03_weekend_museum_course.png"
        sec3 = page.locator("#tab-outing, #outing-course-box, .outing-card").first
        if sec3.count() > 0:
            sec3.scroll_into_view_if_needed()
            time.sleep(0.5)
        page.screenshot(path=str(p3), full_page=False)
        saved_files.append(str(p3))
    except Exception as e:
        print(f"⚠️ 모바일 스텔스 캡처 경고: {e}")
    finally:
        mob_ctx.close()
    return saved_files


def scan_live_cafe_and_community_questions(context):
    """Scans real-time parenting questions on Naver Cafes so the user or operator has instant target URLs."""
    page = context.new_page()
    found = []
    try:
        for item in SNIPER_TARGETS:
            q_enc = urllib.parse.quote(item["query"])
            url = f"https://search.naver.com/search.naver?ssc=tab.cafe.all&query={q_enc}&sm=tab_opt&nso=so%3Add%2Cp%3A1w"
            page.goto(url, wait_until="domcontentloaded", timeout=20000)
            time.sleep(2.2)

            posts = page.evaluate("""() => {
                const anchors = Array.from(document.querySelectorAll('a.title_link, a.api_txt_lines, a[href*="cafe.naver.com/"]'));
                const seen = new Set();
                const out = [];
                for (const a of anchors) {
                    const href = a.href || '';
                    const txt = (a.innerText || '').trim();
                    if (href.includes('cafe.naver.com/') && !href.includes('moneyfitlab') && txt.length >= 10 && !seen.has(href)) {
                        seen.add(href);
                        out.push({ title: txt.slice(0, 52), url: href });
                    }
                }
                return out.slice(0, 2);
            }""")
            found.append({
                "category": item["category"],
                "query": item["query"],
                "live_posts": posts,
                "ready_mom_reply": item["mom_reply"],
            })
    except Exception as e:
        print(f"⚠️ 카페 실시간 질문 스캔 경고: {e}")
    finally:
        page.close()
    return found


def main():
    with sync_playwright() as p:
        browser, context, _ = ensure_clean_cdp_browser(p)
        captures = capture_mobile_stealth_screenshots(browser)
        sniper_results = scan_live_cafe_and_community_questions(context)

    payload = {
        "executedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S KST"),
        "stealthCaptures": captures,
        "sniperResults": sniper_results,
    }
    SNIPER_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    SNIPER_LOG_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ [Community Question Sniper] Found {sum(len(x['live_posts']) for x in sniper_results)} live Mom-Cafe questions & generated {len(captures)} stealth mobile captures.")


if __name__ == "__main__":
    main()
