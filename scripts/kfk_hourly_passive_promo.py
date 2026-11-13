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
        "hook_text": "아이가 밤 10시 반 이후에 잠들면 왜 유전 표적키(MPH)보다 예상키가 낮게 나올까요?\n\n하루 뇌하수체 성장호르몬(GH)의 약 65~70%는 취침 직후 첫 서파수면(N3) 90분 구간에 집중 분비됩니다. 특히 잠들기 2시간 전 과일·탄수화물 간식으로 혈당이 오르면 인슐린이 성장호르몬 분비 피크를 억제합니다.\n\n오늘 밤은 9시 40분 조도를 낮추고 공복 입면 루틴부터 점검해 보세요. #소아성장 #육아정보",
    },
    {
        "slug": "calcium-citrate-d3-k2-osteocalcin",
        "title": "소아 성장기 구연산 칼슘 vs 탄산칼슘 흡수율 비교와 비타민D3·K2(MK-7) 골기질 석회화 원리",
        "summary": "위산 분비가 성인보다 적은 유아·초등 시기에는 탄산칼슘보다 위산 의존도가 낮은 구연산 칼슘이 소장 흡수에 유리하며, 흡수된 칼슘이 혈관이 아닌 성장판 골기질로 부착되려면 오스테오칼신을 활성화하는 비타민K2와 D3의 동시 배합이 중요합니다.",
        "qna_path": "/qna/kr-deep-08-calcium-citrate-vs-carbonate-vitamin-d3-k2-osteocalcin.html",
        "hook_text": "칼슘 영양제를 꾸준히 챙겨주는데도 아이 변이 딱딱해지고 키 백분위가 제자리인 경우가 있습니다.\n\n어린이는 성인보다 위산 분비가 적어 '탄산칼슘' 형태는 흡수율이 떨어지기 쉽습니다. 위산과 무관하게 녹는 구연산 칼슘인지, 그리고 흡수된 칼슘을 뼈로 보내는 비타민D3·K2(오스테오칼신 활성)가 함께 들어 있는지 성분표를 먼저 확인해 보세요. #어린이영양 #키성장",
    },
    {
        "slug": "working-memory-4chunks-bar-model",
        "title": "연산은 빠르지만 문장제 수학에서 멈칫하는 초등학생 — 전두엽 작업기억(4-Chunk) 바 모델링 코칭",
        "summary": "두 줄 이상의 서술형 수학 문제에서 조건을 놓치는 현상은 국어 어휘력 부족보다 전두엽 작업기억(Working Memory) 과부하 때문인 경우가 많습니다. 암산을 멈추고 조건 숫자 동그라미와 막대 도식(Bar Model)을 여백에 그리는 습관이 정답률을 높입니다.",
        "qna_path": "/qna/kr-deep-11-working-memory-4chunks-singapore-math-bar-model.html",
        "hook_text": "연산 문제집은 100점인데 두 줄짜리 문장제 수학만 나오면 별표를 치는 아이, 국어 독해력 문제일까요?\n\n인지과학 기준 초등 저학년의 작업기억(Working Memory) 용량은 평균 3~4개 정보 단위입니다. 눈으로만 읽으며 암산하면 마지막 질문을 읽는 순간 앞의 숫자가 지워집니다.\n\n여백에 숫자 동그라미와 막대 그림만 그리게 해줘도 오답이 절반 이하로 줄어듭니다. #초등수학 #두뇌발달",
    },
    {
        "slug": "morning-glucose-spike-executive-function",
        "title": "초등 오전 2교시 집중력 저하와 아침 식단 반응성 저혈당(Glucose Spike) 교정 프로토콜",
        "summary": "아침 식사로 시리얼·식빵·주스 등 정제 당류를 섭취하면 등교 직후 혈당 급등 뒤 오전 10시 무렵 인슐린 과분비에 의한 반응성 저혈당이 나타나 전두엽 실행기능이 저하될 수 있습니다. 삶은 달걀·두부 중심 단백질 아침 식단이 대안입니다.",
        "qna_path": "/qna/kr-deep-10-morning-glucose-spike-adhd-misdiagnosis-executive-function.html",
        "hook_text": "선생님 상담에서 '오전 2교시만 되면 아이가 멍해지고 연필을 만지작거린다'는 이야기를 들으셨다면 아침 식탁부터 확인해 보세요.\n\n시리얼·식빵·주스 위주의 아침 식사는 등교 직후 혈당을 급격히 올렸다가 딱 오전 10시 무렵 '반응성 저혈당'을 불러 전두엽 에너지를 떨어뜨립니다.\n\n아침 메뉴를 삶은 달걀·두부 등 단백질 위주로 바꾸는 것만으로도 오전 수업 태도가 달라집니다. #초등집중력 #아침식단",
    },
    {
        "slug": "forward-head-posture-hidden-height",
        "title": "스마트폰·평책상 거북목 각도(30도)에 따른 경추 18kg 압박 하중과 숨은 척추 키 회복 루틴",
        "summary": "고개를 30도 숙여 책을 읽으면 경추와 흉추 디스크에 약 18kg의 하중이 실려 1.5~2cm의 기능적 신장 손실이 생깁니다. 15도 독서대 세팅과 저녁 문틀 철봉 30초×3세트 척추 감압 루틴을 안내합니다.",
        "qna_path": "/qna/kr-deep-12-forward-head-posture-turtle-neck-hidden-height-2cm.html",
        "hook_text": "평평한 책상에서 고개를 30도만 숙여도 아이 목뼈와 등뼈에는 약 18kg의 압박 하중이 걸립니다.\n\n이 자세가 굳어지면 성장판과 별개로 눌려 있는 '기능적 숨은 키' 손실만 1.5~2cm에 달합니다. 책상 독서대 각도를 15도로 세우고 저녁에 문틀 철봉 매달리기 30초×3세트만 실천해도 어깨선이 반듯하게 펴집니다. #거북목교정 #바른자세",
    },
    {
        "slug": "picky-eater-zinc-ferritin-appetite",
        "title": "입 짧고 우유만 찾는 아이 — 카제인 철분 흡수 길항 작용과 아연·페리틴 영양 밸런스 점검",
        "summary": "하루 500ml 이상의 흰 우유 섭취는 소장 내 철분·아연 흡수를 방해하여 야간 하지 불편감(가짜 성장통)과 미각 둔화를 유발할 수 있습니다. 생우유 적정량(350ml 이하) 조절과 아연·철분 시간차 보충 원칙을 설명합니다.",
        "qna_path": "/qna/kr-deep-09-picky-eater-zinc-iron-ferritin-appetite-ghrelin.html",
        "hook_text": "밥은 깨작거리는데 흰 우유만 하루 3팩씩 마시는 아이, 밤마다 다리가 저리다고 깨지 않나요?\n\n돌 이후 우유를 하루 500ml 넘게 마시면 우유 속 칼슘과 카제인이 철분·아연 흡수를 막아 밤잠을 설치게 하고 입맛을 더 떨어뜨립니다.\n\n흰 우유는 하루 1~2잔(350ml 이하)으로 줄이고 철분·아연 반찬 비중을 높여주세요. #아이편식 #유아영양",
    },
    {
        "slug": "pediatric-bmi-85-bone-age-defense",
        "title": "소아 체지방 증가(BMI 85백분위 이상)와 아로마타제 효소에 의한 골연령 가속 예방 가이드",
        "summary": "신장 대비 체중이 급격히 늘어나면 지방세포의 아로마타제 효소가 활성화되어 성장판 폐쇄 시점을 앞당길 수 있습니다. 무리한 절식 대신 액상과당 차단과 줄넘기·트램폴린 수직 자극으로 BMI 백분위를 안정화하는 방법을 다룹니다.",
        "qna_path": "/qna/kr-deep-14-pediatric-obesity-bmi-85percentile-leptin-bone-age-acceleration.html",
        "hook_text": "초등 시기 키보다 체중이 먼저 훌쩍 늘었다면 '나중에 다 키로 간다'고 안심하기보다 BMI 백분위를 먼저 확인해야 합니다.\n\n과도한 체지방은 아로마타제 효소를 자극해 뼈 나이(골연령) 시계를 빠르게 돌릴 수 있습니다. 굶기는 다이어트 대신 액상과당 음료를 끊고 저녁 15분 점핑 운동으로 체중을 유지하며 키를 키우는 전략이 핵심입니다. #성조숙증예방 #골연령",
    },
    {
        "slug": "mph-vs-khamis-roche-height-model",
        "title": "부모 유전키(Tanner MPH)와 미국 소아과학회 카미스-로슈(Khamis-Roche) 비침습 성인 예측키 비교",
        "summary": "단순 부모 평균키 공식의 큰 오차 범위를 보완하기 위해 현재 아이의 월령·키·체중 가중치를 반영하는 Khamis-Roche 성인 예측키 모델의 원리와 분기별 성장 속도(cm/yr) 추적법을 정리합니다.",
        "qna_path": "/qna/kr-deep-18-mph-genetic-height-vs-khamis-roche-epigenetic-plus-7cm.html",
        "hook_text": "엄마 아빠 키만 더해서 나누는 유전 예상키 공식은 같은 형제끼리도 결과가 똑같이 나오는 한계가 있습니다.\n\n반면 미국 소아과학회(Pediatrics)에 등재된 카미스-로슈(Khamis-Roche) 예측 모델은 아이의 현재 월령·신장·체중 성숙도를 함께 반영해 오차 폭을 절반 가까이 줄여줍니다.\n\n분기마다 백분위 흐름을 기록해 성장 속도를 체크해 보세요. #예상키계산기 #성장도표",
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
        f"질병관리청 2017 성장도표 기전 해설과 3단계 가정 실천표 전문은 아래 임상 노트에서 무료로 확인하실 수 있습니다.\n"
        f"{canonical_url}"
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
        platform_extras={"naver_blog_dia_plus_column.md": dia_md},
        div_env_path=ROOT_DIR / ".env",
        dry_run=args.dry_run,
    )

    status_obj = {
        "timestamp_kst": now_kst.strftime("%Y-%m-%d %H:%M:%S KST"),
        "engine_version": "2.0-zero-ban",
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
        "naver_status": "Zero-Ban 패시브 SEO & D.I.A.+ 원고 아웃박스 정상 (자동 댓글 매크로 영구 차단)",
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
