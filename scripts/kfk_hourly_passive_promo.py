#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
D:\드림컴퍼니\5사업부\scripts\kfk_hourly_passive_promo.py
5사업부 키즈핏 코리아 패시브 (https://kidsfit.co.kr) — Zero-Ban 무인 패시브 텍스트 자동화 엔진 v2.0
=============================================================================================
1. [도어웨이(post-seq-*) 정규화 & Clean Sitemap / RSS / JSON Feed / LLMS 동기화]
   - sync_passive_seo_assets.js 실행으로 noindex 스텁 제외 73종 정규 임상 칼럼만 색인 노출 ([:35] 절단 버그 수정)
2. [SHA-256 콘텐츠 해시 델타 전용 IndexNow & 피드 변경 시에만 WebSub 핑]
   - 변경 없는 URL 매시간 중복 핑 전면 차단 (403/429 스팸 제재 원천 방지)
3. [일 1회 고유 임상 노트 발행 (telegra.ph) — 제휴 생링크 0건 & 날짜 오디널 순환]
   - 기존 (len(logs)+hour)%6 루프 버그 및 시간당 도배 제거, 하루 최대 1회 고유 임상 요약만 게시
4. [네이버 D.I.A.+ / 스마트블록 순수 임상 정보 칼럼 & 2-Step 소셜 스레드 아웃박스 생성]
   - 쿠팡 파트너스(AF7865143) · 링크프라이스(A100708867) 보존 및 금지어 0건 무결성 검증 상시 수행
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

KST = timezone(timedelta(hours=9))
ROOT_DIR = Path(__file__).resolve().parent.parent
HQ_ROOT = ROOT_DIR.parent
sys.path.insert(0, str(HQ_ROOT / "text_automation_hq"))

from anti_ban_guardrails import validate_division_guardrails
from indexnow_delta_gate import (
    ping_websub_if_feed_changed,
    publish_daily_unique_telegraph_summary,
    submit_delta_indexnow,
)
from live_web_deployer import deploy_division_live
from official_api_syndicator import dispatch_zero_ban_text_bundle

QNA_DIR = ROOT_DIR / "qna"
LOGS_DIR = ROOT_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

INDEXNOW_KEY = "bb7865143f912a88c04d31d3921a0988"
HOST = "kidsfit.co.kr"
TELEGRAPH_ACCT_PATH = LOGS_DIR / "kr_telegraph_account.json"
BACKLINKS_LOG_PATH = LOGS_DIR / "kr_external_backlinks.json"
PROMO_STATUS_PATH = LOGS_DIR / "kfk_hourly_promo_status.json"

# Unicode escapes keep literal prohibited tokens out of the 5사업부 codebase
PROHIBITED_WORDS = [
    "\ucd5c\uc800\uac00",
    "\ud560\uc778\uc728",
    "\ud2b9\uac00",
    "\ud3ed\ud0c4\uc138\uc77c",
]

DAILY_KR_CLINICAL_TOPICS = [
    {
        "slug": "kdca-2017-lms-10pm-sleep",
        "title": "질병관리청(KDCA) 2017 성장도표 LMS 백분위 계산법과 밤 10시 서파수면(N3) 성장호르몬 기전",
        "summary": "아이의 최종 성인 예상키는 부모 유전 표적키(Tanner MPH)만으로 고정되지 않으며, 밤 10시~새벽 2시 서파수면 첫 주기의 성장호르몬(GH) 분비와 야간 인슐린 관리에 따라 ±6.7~8.5cm 범위에서 후천적 차이가 발생합니다.",
        "qna_path": "/qna/kr-deep-07-10pm-deep-sleep-growth-hormone-melatonin-lux-protocol.html",
        "hook_text": "밤 10시 반 넘겨 잠드는 아이, 엄마 아빠 키보다 작아질 수 있습니다.\n\n하루 성장호르몬의 70%는 잠든 직후 깊은 첫 잠 90분에 집중 분비됩니다. 잠들기 2시간 전 달콤한 간식을 줄이고 밤 9시 40분 조명을 낮춰 보세요. #소아성장 #육아정보",
    },
    {
        "slug": "calcium-citrate-d3-k2-osteocalcin",
        "title": "소아 성장기 구연산 칼슘 vs 탄산칼슘 흡수율 비교와 비타민D3·K2(MK-7) 골기질 석회화 원리",
        "summary": "위산 분비가 성인보다 적은 유아·초등 시기에는 탄산칼슘보다 위산 의존도가 낮은 구연산 칼슘이 소장 흡수에 유리하며, 흡수된 칼슘이 혈관이 아닌 성장판 골기질로 부착되려면 오스테오칼신을 활성화하는 비타민K2와 D3의 동시 배합이 중요합니다.",
        "qna_path": "/qna/kr-deep-08-calcium-citrate-vs-carbonate-vitamin-d3-k2-osteocalcin.html",
        "hook_text": "칼슘 영양제를 매일 먹여도 아이 변만 딱딱하고 키가 그대로인 이유가 있습니다.\n\n위산이 적은 아이는 탄산칼슘보다 구연산 칼슘이 잘 흡수되며, 흡수된 칼슘을 성장판 뼈로 보내려면 비타민D3와 K2가 함께 들어 있어야 합니다. #어린이영양 #키성장",
    },
    {
        "slug": "working-memory-4chunks-bar-model",
        "title": "연산은 빠르지만 문장제 수학에서 멈칫하는 초등학생 — 전두엽 작업기억(4-Chunk) 바 모델링 코칭",
        "summary": "두 줄 이상의 서술형 수학 문제에서 조건을 놓치는 현상은 국어 어휘력 부족보다 전두엽 작업기억(Working Memory) 과부하 때문인 경우가 많습니다. 암산을 멈추고 조건 숫자 동그라미와 막대 도식(Bar Model)을 여백에 그리는 습관이 정답률을 높입니다.",
        "qna_path": "/qna/kr-deep-11-working-memory-4chunks-singapore-math-bar-model.html",
        "hook_text": "연산은 100점인데 두 줄 문장제 수학만 나오면 멈추는 아이, 독해력 탓이 아닙니다.\n\n초등 저학년 머릿속 기억 공간은 숫자 3~4개면 꽉 찹니다. 암산을 멈추고 여백에 조건 동그라미와 막대 그림만 그리게 해줘도 실수가 절반으로 줄어듭니다. #초등수학 #두뇌발달",
    },
    {
        "slug": "morning-glucose-spike-executive-function",
        "title": "초등 오전 2교시 집중력 저하와 아침 식단 반응성 저혈당(Glucose Spike) 교정 프로토콜",
        "summary": "아침 식사로 시리얼·식빵·주스 등 정제 당류를 섭취하면 등교 직후 혈당 급등 뒤 오전 10시 무렵 인슐린 과분비에 의한 반응성 저혈당이 나타나 전두엽 실행기능이 저하될 수 있습니다. 삶은 달걀·두부 중심 단백질 아침 식단이 대안입니다.",
        "qna_path": "/qna/kr-deep-10-morning-glucose-spike-adhd-misdiagnosis-executive-function.html",
        "hook_text": "오전 2교시만 되면 멍해지는 아이, 달콤한 시리얼 아침 식탁부터 바꿔 보세요.\n\n시리얼·식빵·주스 위주 아침밥은 등교 직후 혈당을 급히 올렸다가 10시 무렵 급격히 떨어뜨립니다. 삶은 달걀·두부 단백질을 곁들이면 오전 집중력이 확 달라집니다. #초등집중력 #아침식단",
    },
    {
        "slug": "forward-head-posture-hidden-height",
        "title": "스마트폰·평책상 거북목 각도(30도)에 따른 경추 18kg 압박 하중과 숨은 척추 키 회복 루틴",
        "summary": "고개를 30도 숙여 책을 읽으면 경추와 흉추 디스크에 약 18kg의 하중이 실려 1.5~2cm의 기능적 신장 손실이 생깁니다. 15도 독서대 세팅과 저녁 문틀 철봉 30초×3세트 척추 감압 루틴을 안내합니다.",
        "qna_path": "/qna/kr-deep-12-forward-head-posture-turtle-neck-hidden-height-2cm.html",
        "hook_text": "평평한 책상에서 고개만 30도 숙여도 아이 숨은 키 2cm가 눌려 있습니다.\n\n목과 등뼈에 실리는 18kg 하중을 줄이려면 독서대 각도를 15도로 세우고 저녁마다 문틀 철봉 매달리기 30초 3세트로 척추를 쭉 펴주세요. #거북목교정 #바른자세",
    },
    {
        "slug": "picky-eater-zinc-ferritin-appetite",
        "title": "입 짧고 우유만 찾는 아이 — 카제인 철분 흡수 길항 작용과 아연·페리틴 영양 밸런스 점검",
        "summary": "하루 500ml 이상의 흰 우유 섭취는 소장 내 철분·아연 흡수를 방해하여 야간 하지 불편감(가짜 성장통)과 미각 둔화를 유발할 수 있습니다. 생우유 적정량(350ml 이하) 조절과 아연·철분 시간차 보충 원칙을 설명합니다.",
        "qna_path": "/qna/kr-deep-09-picky-eater-zinc-iron-ferritin-appetite-ghrelin.html",
        "hook_text": "밥 안 먹고 흰 우유만 3팩 마시는 아이, 밤마다 다리 아파 깨지 않나요?\n\n하루 500ml 넘는 생우유는 철분·아연 흡수를 방해해 밤잠을 설치게 하고 입맛을 떨어뜨립니다. 흰 우유는 두 잔 이하로 줄이고 살코기·아연 반찬을 챙겨주세요. #아이편식 #유아영양",
    },
    {
        "slug": "pediatric-bmi-85-bone-age-defense",
        "title": "소아 체지방 증가(BMI 85백분위 이상)와 아로마타제 효소에 의한 골연령 가속 예방 가이드",
        "summary": "신장 대비 체중이 급격히 늘어나면 지방세포의 아로마타제 효소가 활성화되어 성장판 폐쇄 시점을 앞당길 수 있습니다. 무리한 절식 대신 액상과당 차단과 줄넘기·트램폴린 수직 자극으로 BMI 백분위를 안정화하는 방법을 다룹니다.",
        "qna_path": "/qna/kr-deep-14-pediatric-obesity-bmi-85percentile-leptin-bone-age-acceleration.html",
        "hook_text": "또래보다 체중이 먼저 훌쩍 늘었다면 '나중에 키로 간다'는 말을 조심해야 합니다.\n\n늘어난 체지방은 뼈 나이 시계를 앞당겨 성장판이 일찍 닫히게 만들 수 있습니다. 굶기지 말고 단 음료를 끊은 뒤 저녁 15분 줄넘기로 체중을 지켜주세요. #성조숙증예방 #골연령",
    },
    {
        "slug": "mph-vs-khamis-roche-height-model",
        "title": "부모 유전키(Tanner MPH)와 미국 소아과학회 카미스-로슈(Khamis-Roche) 비침습 성인 예측키 비교",
        "summary": "단순 부모 평균키 공식의 큰 오차 범위를 보완하기 위해 현재 아이의 월령·키·체중 가중치를 반영하는 Khamis-Roche 성인 예측키 모델의 원리와 분기별 성장 속도(cm/yr) 추적법을 정리합니다.",
        "qna_path": "/qna/kr-deep-18-mph-genetic-height-vs-khamis-roche-epigenetic-plus-7cm.html",
        "hook_text": "엄마 아빠 키만 더해서 나누는 옛날 공식으로는 형제의 다른 키를 알 수 없습니다.\n\n현재 개월 수와 키·몸무게 성숙도를 함께 반영하는 미국 소아과학회 예측 모델로 분기별 백분위 흐름을 기록하면 우리 아이 성장 골든타임을 놓치지 않습니다. #예상키계산기 #성장도표",
    },
]


def verify_passive_guardrails() -> dict:
    """쿠팡(AF7865143)·링크프라이스(A100708867) 보존 및 금지어 0건 검증"""
    mon_js = ROOT_DIR / "src" / "js" / "monetization.js"
    cat_json = ROOT_DIR / "src" / "data" / "curation-catalog.json"
    coupang_ok = False
    linkprice_ok = False
    prohibited_found = []

    for p in [mon_js, cat_json, ROOT_DIR / "index.html"]:
        if p.exists():
            txt = p.read_text(encoding="utf-8", errors="replace")
            if "AF7865143" in txt:
                coupang_ok = True
            if "A100708867" in txt:
                linkprice_ok = True
            for w in PROHIBITED_WORDS:
                if w in txt:
                    prohibited_found.append(f"{p.name}:prohibited_term")

    return {
        "coupang_AF7865143": coupang_ok,
        "linkprice_A100708867": linkprice_ok,
        "prohibited_words_count": len(prohibited_found),
        "prohibited_details": prohibited_found,
    }


def collect_canonical_url_map() -> dict[str, Path]:
    """수집 대상: noindex가 아닌 모든 정규 kidsfit.co.kr HTML 페이지"""
    url_map: dict[str, Path] = {}
    for rel, url in [
        ("index.html", "https://kidsfit.co.kr/"),
        ("about.html", "https://kidsfit.co.kr/about.html"),
        ("contact.html", "https://kidsfit.co.kr/contact.html"),
        ("privacy.html", "https://kidsfit.co.kr/privacy.html"),
        ("terms.html", "https://kidsfit.co.kr/terms.html"),
    ]:
        fp = ROOT_DIR / rel
        if fp.exists():
            url_map[url] = fp

    if QNA_DIR.exists():
        for p in sorted(QNA_DIR.glob("*.html")):
            raw = p.read_text(encoding="utf-8", errors="ignore")
            if "noindex" in raw.lower():
                continue
            url = f"https://kidsfit.co.kr/qna/{p.name}"
            url_map[url] = p
    return url_map


def build_naver_dia_markdown(topic: dict, canonical_url: str, date_str: str) -> str:
    return f"""# {topic['title']}

> 발행일: {date_str} | 작성: 키즈핏 그로스 스튜디오 소아성장·두뇌발달 연구팀 (`kidsfit.co.kr`)

## 1. 핵심 임상 요약
{topic['summary']}

## 2. 오늘 저녁 가정에서 바로 적용하는 3단계 점검표
1. **질병관리청(KDCA) 2017 성장도표 월령별 백분위 확인**: 연 1회가 아닌 분기(3개월) 단위로 신장·체중 백분위 곡선의 기울기가 유지되는지 기록합니다.
2. **수면·영양·자세 환경 교정**: 밤 10시 전 소등, 취침 2시간 전 당류 간식 제한, 책상 15도 독서대 및 저녁 스트레칭 루틴을 일관되게 유지합니다.
3. **연령별 맞춤 교구·영양 성분표 대조**: 과장된 문구 대신 원료 형태(구연산 칼슘, 비타민D3·K2, 킬레이트 아연 등)와 아이의 발달 단계 적합성을 먼저 따져봅니다.

## 3. 무료 백분위 계산기 및 심층 칼럼 원문 안내
- 본 주제의 상세 논문 기전 및 가정 실천 가이드 전문: {canonical_url}
- 생후 0개월~만 20세 무료 성장·두뇌 밸런스 진단기: https://kidsfit.co.kr/
- 연령별 에디터 큐레이션 가이드 (공식 판매처 보러가기 / 혜택가 확인): https://kidsfit.co.kr/qna/monthly-curation.html

---
※ 본 칼럼은 질병관리청 소아청소년 성장도표 및 학술 문헌에 기반한 건강·학습 정보이며 의학적 진단을 대신하지 않습니다. 공식 홈페이지 내 에디터 큐레이션 링크를 통한 구매 시 공정거래위원회 지침에 따라 일정액의 수수료를 제공받을 수 있습니다.
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="KFK Zero-Ban Passive Text Automation Engine v2.0")
    parser.add_argument("--dry-run", action="store_true", help="Validate & build outbox without live network calls")
    parser.add_argument("--force", action="store_true", help="Compat flag")
    args = parser.parse_args()

    now_kst = datetime.now(KST)
    date_str = now_kst.strftime("%Y-%m-%d")

    # 1. Verify affiliate & zero-prohibited-word guardrails
    guard = verify_passive_guardrails()
    if not guard["coupang_AF7865143"] or not guard["linkprice_A100708867"] or guard["prohibited_words_count"] > 0:
        raise RuntimeError(f"KFK Guardrail check failed: {guard}")

    # 2. Consolidate doorway stubs & sync clean sitemap.xml, rss.xml, feed.json, llms.txt + build dist + deploy live
    subprocess.run(
        ["node", str(ROOT_DIR / "scripts" / "sync_passive_seo_assets.js")],
        cwd=str(ROOT_DIR),
        check=True,
        timeout=30,
    )
    build_js = ROOT_DIR / "scripts" / "build.js"
    if build_js.exists():
        subprocess.run(
            ["node", str(build_js)],
            cwd=str(ROOT_DIR),
            check=False,
            timeout=90,
            capture_output=True,
        )
    deploy_res = deploy_division_live("KFK", dry_run=args.dry_run)

    # 3. Deterministic daily rotation by date ordinal (fixes legacy +2 mod 6 loop bug)
    day_idx = now_kst.date().toordinal() % len(DAILY_KR_CLINICAL_TOPICS)
    topic = DAILY_KR_CLINICAL_TOPICS[day_idx]
    canonical_url = f"https://{HOST}{topic['qna_path']}"

    # 4. HQ Guardrail verification on generated copy before any publication
    dia_md = build_naver_dia_markdown(topic, canonical_url, date_str)
    hq_guard = validate_division_guardrails("KFK", dia_md + "\n" + topic["hook_text"])
    if not hq_guard["passed"]:
        raise RuntimeError(f"HQ KFK Guardrail violation: {hq_guard}")

    # 5. Max 1 unique Telegraph clinical summary per day (zero raw Coupang/LinkPrice links)
    tg_nodes = [
        {"tag": "p", "children": [topic["summary"]]},
        {"tag": "h3", "children": ["질병관리청(KDCA) 2017 성장도표 기반 가정 실천 핵심"]},
        {
            "tag": "p",
            "children": [
                "개월 수별 정확한 키·몸무게 백분위와 비침습 성인 예측키, 5대 두뇌 밸런스(LQ) 리포트는 ",
                {"tag": "a", "attrs": {"href": "https://kidsfit.co.kr/"}, "children": ["키즈핏 그로스 스튜디오 무료 진단기"]},
                " 에서 회원가입 없이 확인하실 수 있습니다.",
            ],
        },
        {
            "tag": "p",
            "children": [
                "오늘의 심층 임상 칼럼 전문 읽기: ",
                {"tag": "a", "attrs": {"href": canonical_url}, "children": [topic["title"]]},
            ],
        },
    ]
    tg_res = publish_daily_unique_telegraph_summary(
        div_code="KFK",
        account_file=TELEGRAPH_ACCT_PATH,
        short_name="KidsFit_KR",
        author_name="키즈핏 소아성장·두뇌발달 연구소",
        author_url="https://kidsfit.co.kr/",
        title=f"[소아성장·두뇌 임상 노트 {date_str}] {topic['title']}",
        content_nodes=tg_nodes,
        canonical_url=canonical_url,
        dry_run=args.dry_run,
    )
    telegraph_url = tg_res.get("url") or canonical_url

    if tg_res.get("status") == "PUBLISHED" and tg_res.get("url"):
        logs = []
        if BACKLINKS_LOG_PATH.exists():
            try:
                logs = json.loads(BACKLINKS_LOG_PATH.read_text(encoding="utf-8"))
            except Exception:
                logs = []
        logs.append(
            {
                "date": date_str,
                "title": topic["title"],
                "url": tg_res["url"],
                "canonical_target": canonical_url,
                "topic_slug": topic["slug"],
                "created_at": now_kst.isoformat(),
            }
        )
        BACKLINKS_LOG_PATH.write_text(json.dumps(logs[-100:], indent=2, ensure_ascii=False), encoding="utf-8")

    # 6. SHA-256 Content-Hash Delta-Only IndexNow + Feed-Delta WebSub
    url_map = collect_canonical_url_map()
    indexnow_res = submit_delta_indexnow(
        div_code="KFK",
        host=HOST,
        key=INDEXNOW_KEY,
        url_to_filepath=url_map,
        dry_run=args.dry_run,
    )
    websub_res = (
        {"status": "DRY_RUN"}
        if args.dry_run
        else ping_websub_if_feed_changed(
            div_code="KFK",
            feed_url=f"https://{HOST}/rss.xml",
            local_feed_path=ROOT_DIR / "rss.xml",
        )
    )

    # 7. Official API Syndication + Naver D.I.A.+ Outbox Generation
    reply_text = (
        f"우리 아이 개월 수별 질병관리청 백분위 & 성인 예상키 1분 무료 진단:\n"
        f"{canonical_url}?utm_source=social_thread&utm_medium=organic"
    )
    naver_shopping_connect_pack = (
        f"# [네이버 자사 블로그(expertise333) + 브랜드커넥트 안전 포스팅 본문 · {date_str}]\n\n"
        f"{topic['hook_text']}\n\n"
        f"## 핵심 체크 포인트\n"
        f"{topic['summary']}\n\n"
        f"1. **개월 수별 질병관리청(KDCA) 백분위 & 성인 예상키 1분 무료 확인**:\n"
        f"   👉 https://kidsfit.co.kr/?utm_source=naver_blog_owned\n"
        f"2. **오늘 칼럼 전문 & 3단계 가정 루틴 표 보기**:\n"
        f"   👉 {canonical_url}?utm_source=naver_blog_owned\n"
        f"3. **네이버 공식 브랜드커넥트 에디터 큐레이션 라운지 (C-Rank 친화 자사 생태계 링크)**:\n"
        f"   👉 https://naver.me/5Jq9LnLT\n\n"
        f"※ 본 포스팅은 건강·학습 정보 안내와 함께 네이버 브랜드커넥트 활동의 일환으로 수수료를 제공받을 수 있습니다.\n"
    )
    synd_res = dispatch_zero_ban_text_bundle(
        div_code="KFK",
        canonical_domain=HOST,
        canonical_url=canonical_url,
        title=topic["title"],
        summary=topic["summary"],
        main_social_hook=topic["hook_text"],
        reply_social_link=reply_text,
        longform_markdown=dia_md,
        tags=["소아성장", "육아정보", "키즈핏", "초등학습"],
        platform_extras={
            "naver_blog_dia_plus_column.md": dia_md,
            "naver_shopping_connect_owned_blog_pack.md": naver_shopping_connect_pack,
        },
        div_env_path=ROOT_DIR / ".env",
        dry_run=args.dry_run,
    )

    # 8. Owned Naver Blog (`expertise333`) & Cafe (`moneyfitlab`) Safe 1x/Day Trigger (09:00 KST window)
    naver_owned_1x: dict = {"status": "SKIPPED_DRY_RUN"}
    try:
        sys.path.insert(0, str(ROOT_DIR / "scripts"))
        from run_safe_daily_1x_naver_owned import run_safe_daily_1x_naver

        if args.dry_run:
            naver_owned_1x = run_safe_daily_1x_naver(dry_run=True)
        elif now_kst.hour == 9:
            naver_owned_1x = run_safe_daily_1x_naver(dry_run=False)
        else:
            naver_owned_1x = run_safe_daily_1x_naver(status_only=True)
    except Exception as exc:
        naver_owned_1x = {"status": "SAFE_WRAPPER_WARN", "detail": str(exc)}

    status_obj = {
        "timestamp_kst": now_kst.strftime("%Y-%m-%d %H:%M:%S KST"),
        "engine_version": "2.1-zero-ban-b2c",
        "deploy_status": deploy_res.get("status"),
        "llms_updated": date_str,
        "canonical_url_count": len(url_map),
        "telegraph": tg_res,
        "telegraph_url": telegraph_url,
        "indexnow": indexnow_res,
        "websub": websub_res,
        "syndication_status": synd_res.get("status"),
        "outbox_dir": synd_res.get("outbox_dir"),
        "guardrails": guard,
        "naver_owned_daily_1x": naver_owned_1x,
        "naver_status": "Zero-Ban 패시브 SEO & 자사 블로그·카페 일 1회 안전 모드 (타인 공간 자동 댓글 영구 차단)",
    }
    PROMO_STATUS_PATH.write_text(json.dumps(status_obj, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"[KFK Zero-Ban v2] Deploy={deploy_res.get('status')} | CanonicalURLs={len(url_map)} | Telegraph={tg_res.get('status')}({telegraph_url}) | "
        f"IndexNow={indexnow_res.get('status')}({indexnow_res.get('submitted_count', indexnow_res.get('changed_count', 0))}/{len(url_map)}) | "
        f"WebSub={websub_res.get('status')} | Syndication={synd_res.get('status')} | "
        f"Guardrails: AF7865143={guard['coupang_AF7865143']}, A100708867={guard['linkprice_A100708867']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
