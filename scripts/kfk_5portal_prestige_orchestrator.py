#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
D:\드림컴퍼니\5사업부\scripts\kfk_5portal_prestige_orchestrator.py
================================================================================
5사업부 키즈핏 코리아 (KidsFit Pediatric Growth Editorial Lab)
『네이버 블로그 · 네이버 카페 · 네이버 지식iN · 다음(Daum) · 네이트(Nate)』
한국 5대 포털 무스팸(Zero-Spam) · 고급 에디토리얼 홍보 통합 오케스트레이터

기능 요약:
  1. [네이버 블로그 (`blog.naver.com/expertise333`)]:
     - 3종 고해상도 인포그래픽(1080x1200) 교차 배치 + 질병관리청(KDCA 2017) 표준키 박스 +
       2문장 짧은 호흡 존댓말 매거진 칼럼 일 1회 무팝업(`headless=True`) 자동 발행 (주간 미발행 시 자동 캐치업).
  2. [네이버 카페 (`cafe.naver.com/moneyfitlab`)]:
     - 블로그와 완전히 분리된 학부모 라운지 소통형 코칭 원고 + 1:1 카드뉴스(1080x1080) 일 1회 무팝업 발행.
  3. [네이버 지식iN (`kin.naver.com`)]:
     - 실시간 키 성장 질문 탐색 + 질문자 아이 연령·성별·신장·뼈나이·부모키 맞춤 KDCA 표준키 계산 1:1 자문 원고 +
       외부 URL 0건(`Zero-URL`) 고급 연구소 서명형 일 1회 무팝업 안전 답변 (보안문자 감지 시 무우회 즉시 대기).
  4. [다음 (`Daum` — 통합검색 `Daumoa` + 브런치스토리·티스토리·다음카페 서재형 에세이)]:
     - `dg:plink`·`ScholarlyArticle`·`FAQPage` 적용 럭셔리 에디토리얼 저널 HTML 생성 + `IndexNow` 델타 색인 +
       브런치/티스토리 서재형 에세이 에디션 생성 및 세션 연동 자동 발행.
  5. [네이트 (`Nate` — 통합검색 `Cowbot` + 네이트 판 3040 육아톡톡·라이프 무링크 팩트체크 에세이)]:
     - `nate:title` 메타 적용 에디토리얼 색인 + 스팸 거부감 0% 무링크(`Zero-URL`) 공감 에세이 에디션 생성.
  6. [5대 포털 상호 유사문서 차단 매트릭스 (`5x5 Pairwise 4-gram Jaccard < 0.12`)]:
     - 동일 일자 5대 포털 원고 간 어절 중복률을 전수 검증해 포털 저품질·유사문서 필터를 원천 차단합니다.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sys
from typing import Any, Dict, List

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

KST = timezone(timedelta(hours=9))
ROOT_DIR = Path(__file__).resolve().parent.parent
HQ_ROOT = ROOT_DIR.parent
LOGS_DIR = ROOT_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
OUTBOX_ROOT = HQ_ROOT / "text_automation_hq" / "outbox"
STATUS_PATH = LOGS_DIR / "kfk_5portal_prestige_status.json"

if str(ROOT_DIR / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "scripts"))
if str(HQ_ROOT / "text_automation_hq") not in sys.path:
    sys.path.insert(0, str(HQ_ROOT / "text_automation_hq"))

from kfk_daum_nate_portal_publisher import (  # noqa: E402
    PRESTIGE_PORTAL_EDITORIAL_SERIES,
    compose_daum_brunch_tistory_edition,
    compose_nate_life_momtalk_edition,
    compute_4gram_jaccard,
    run_daum_nate_portal_pipeline,
)
from kfk_naver_editorial_designer import (  # noqa: E402
    EDITORIAL_IMG_DIR,
    build_blog_editorial_package,
    build_cafe_coaching_package,
)
from kfk_prestige_naver_kin_advisor import (  # noqa: E402
    compose_prestige_kin_advisory,
    run_safe_daily_1x_naver_kin,
    validate_prestige_anti_spam_tone,
)
from run_safe_daily_1x_naver_owned import run_safe_daily_1x_naver  # noqa: E402


def verify_5portal_anti_duplicate_and_prestige_matrix(date_str: str, seq_seed: int = 1) -> Dict[str, Any]:
    """
    동일 날짜에 발행되는 5대 포털(네이버 블로그 · 네이버 카페 · 네이버 지식iN · 다음 · 네이트) 원고의
    ① 스팸 어휘 0건 품격 가드레일과 ② 5x5 상호 4-gram Jaccard 유사도(< 0.12)를 전수 검증합니다.
    """
    dt = datetime.strptime(date_str, "%Y-%m-%d").date()
    portal_item = PRESTIGE_PORTAL_EDITORIAL_SERIES[dt.toordinal() % len(PRESTIGE_PORTAL_EDITORIAL_SERIES)]

    blog_pkg = build_blog_editorial_package(seq_seed, out_dir=EDITORIAL_IMG_DIR)
    cafe_pkg = build_cafe_coaching_package(seq_seed, out_dir=EDITORIAL_IMG_DIR)
    kin_pkg = compose_prestige_kin_advisory(
        "초4 남아 현재 키 135cm, 아빠 175cm 엄마 162cm인데 뼈나이 10.5세라고 합니다",
        "밤 10시 반쯤 잠드는데 집에서 수면과 영양 루틴을 어떻게 잡아야 할까요?",
    )
    daum_pkg = compose_daum_brunch_tistory_edition(portal_item, date_str)
    nate_pkg = compose_nate_life_momtalk_edition(portal_item, date_str)

    # Core narrative bodies (excluding shared KDCA official reference numbers / URLs so prose originality is measured cleanly)
    prose_map: Dict[str, str] = {
        "naver_blog": f"{blog_pkg['section1_intro']}\n{blog_pkg['section3_routine'].split('■')[0]}",
        "naver_cafe": cafe_pkg["body"].split("■")[0],
        "naver_kin": kin_pkg["answer_text"],
        "daum_editorial": "\n".join(portal_item["daum_paragraphs"]),
        "nate_editorial": "\n".join(portal_item["nate_paragraphs"]),
    }

    tone_checks = {
        "naver_blog": validate_prestige_anti_spam_tone(blog_pkg["full_body"], allow_urls=True, require_polite_ending=False),
        "naver_cafe": validate_prestige_anti_spam_tone(cafe_pkg["body"], allow_urls=True, require_polite_ending=False),
        "naver_kin": kin_pkg["guardrail"],
        "daum_editorial": daum_pkg["guardrail"],
        "nate_editorial": nate_pkg["guardrail"],
    }

    pairwise_jaccard: Dict[str, float] = {}
    max_jaccard = 0.0
    keys = list(prose_map.keys())
    for i in range(len(keys)):
        for j in range(i + 1, len(keys)):
            k1, k2 = keys[i], keys[j]
            sim = round(compute_4gram_jaccard(prose_map[k1], prose_map[k2]), 4)
            pairwise_jaccard[f"{k1}__vs__{k2}"] = sim
            if sim > max_jaccard:
                max_jaccard = sim

    violations: List[str] = []
    for ch, chk in tone_checks.items():
        if not chk["passed"]:
            for v in chk["violations"]:
                violations.append(f"[{ch}] {v}")
    for pair_key, sim in pairwise_jaccard.items():
        if sim >= 0.12:
            violations.append(f"Duplicate risk ({pair_key}): 4-gram Jaccard {sim:.4f} >= 0.12")

    return {
        "passed": len(violations) == 0,
        "max_pairwise_jaccard": max_jaccard,
        "pairwise_jaccard": pairwise_jaccard,
        "tone_checks": {k: v["passed"] for k, v in tone_checks.items()},
        "violations": violations,
    }


def run_5portal_prestige_orchestration(
    dry_run: bool = False,
    date_str: Optional[str] = None,
) -> Dict[str, Any]:
    now_kst = datetime.now(KST)
    day = date_str or now_kst.strftime("%Y-%m-%d")

    # 1. Pre-flight 5-Portal Anti-Duplicate & Prestige Anti-Spam Matrix Gate
    import publish_3x_daily_blog_and_cafe as naver_pub

    cursor = naver_pub.load_cursor()
    next_seq = int(cursor.get("lastBlogSeq", 31)) + 1
    matrix_gate = verify_5portal_anti_duplicate_and_prestige_matrix(day, seq_seed=next_seq)
    if not matrix_gate["passed"]:
        raise RuntimeError(f"KFK 5-Portal Prestige Matrix Gate blocked execution: {matrix_gate['violations']}")

    # 2. Daum & Nate Portal Search Editorial Journal + Brunch/Tistory & Nate MomTalk Editions
    daum_nate_res = run_daum_nate_portal_pipeline(date_str=day, dry_run=dry_run)

    # 3. Naver Owned Blog (`expertise333`) + Naver Owned Cafe (`moneyfitlab`) Safe 1x/Day Catch-Up
    naver_owned_res = run_safe_daily_1x_naver(dry_run=dry_run)

    # 4. Naver Knowledge-iN (`kin.naver.com`) Safe 1x/Day Zero-URL Bespoke Clinical Advisory
    naver_kin_res = run_safe_daily_1x_naver_kin(dry_run=dry_run)

    # 5. Write Executive Digest in dated KFK outbox
    out_dir = OUTBOX_ROOT / day / "KFK"
    out_dir.mkdir(parents=True, exist_ok=True)
    digest_path = out_dir / "kfk_5portal_executive_digest.md"
    digest_md = (
        f"# [5사업부 키즈핏 코리아 · 한국 5대 포털 무스팸 에디토리얼 가동 리포트 ({day})]\n\n"
        f"- **품격·유사문서 방어 게이트**: `ALL PASS` (최대 4-gram Jaccard `{matrix_gate['max_pairwise_jaccard']}` < `0.12`)\n"
        f"- **① 네이버 블로그 (`expertise333`) & ② 네이버 카페 (`moneyfitlab`)**: `{naver_owned_res.get('status')}`\n"
        f"- **③ 네이버 지식iN (`kin.naver.com` 1:1 무링크 임상 자문)**: `{naver_kin_res.get('status')}`\n"
        f"- **④ 다음 (`Daum` 통합검색 에디토리얼 & 브런치/티스토리 서재 에세이)**: `{daum_nate_res['daum_edition']['publish_status']}` (`{daum_nate_res['today_featured_url']}`)\n"
        f"- **⑤ 네이트 (`Nate` 통합검색 & 판 3040 육아톡톡 무링크 에세이)**: `{daum_nate_res['nate_edition']['publish_status']}` (`zero_url={daum_nate_res['nate_edition']['zero_url_verified']}`)\n"
    )
    digest_path.write_text(digest_md, encoding="utf-8")

    summary = {
        "timestamp_kst": now_kst.strftime("%Y-%m-%d %H:%M:%S KST"),
        "date": day,
        "dry_run": dry_run,
        "matrix_gate": matrix_gate,
        "naver_blog_and_cafe": naver_owned_res,
        "naver_kin": naver_kin_res,
        "daum_and_nate": daum_nate_res,
        "digest_file": str(digest_path),
    }
    STATUS_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="KFK 5-Portal Prestige Anti-Spam Automation Orchestrator")
    parser.add_argument("--dry-run", action="store_true", help="Validate all 5 portals without live browser/network mutations")
    parser.add_argument("--date", type=str, default=None, help="Target date YYYY-MM-DD")
    args = parser.parse_args()

    res = run_5portal_prestige_orchestration(dry_run=args.dry_run, date_str=args.date)
    print(
        f"[KFK 5-Portal Prestige] MatrixPass={res['matrix_gate']['passed']} "
        f"(MaxJaccard={res['matrix_gate']['max_pairwise_jaccard']}) | "
        f"NaverBlogCafe={res['naver_blog_and_cafe'].get('status')} | "
        f"NaverKin={res['naver_kin'].get('status')} | "
        f"Daum={res['daum_and_nate']['daum_edition']['publish_status']} | "
        f"Nate={res['daum_and_nate']['nate_edition']['publish_status']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
