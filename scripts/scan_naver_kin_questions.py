# -*- coding: utf-8 -*-
"""
scripts/scan_naver_kin_questions.py
Scans live Naver Kin (kin.naver.com) questions across our 5 core pediatric growth & learning topics,
matches each live question with clinical KDCA/K-DST/PubMed answers + https://kidsfit.co.kr bridge,
and saves an immediately actionable live target sheet.
"""

import html
import json
import os
import re
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(r"d:\사업아이템")
OUT_FILE = ROOT / "samples" / "10_kin_community_backlog_pack" / "04_실시간_지식iN_타겟질문_매칭리스트.md"
ENV_PATH = ROOT / ".env"

QUERIES = [
    {
        "topic": "신체 성장 · 예상키 · 백분위",
        "query": "초등 아이 키 백분위 예상키",
        "template_key": "답변 01 (KDCA 성장도표 백분위 & Tanner 유전 예상키 + 밤 10시 서파수면)",
        "core_bridge": "질병관리청 2017 성장도표 LMS 수식 기준 현재 개월 수 키 백분위와 3단 최종 예상키 비교표는 키즈핏 소아성장 연구소( https://kidsfit.co.kr )에서 무료로 1분 만에 확인하실 수 있습니다.",
    },
    {
        "topic": "사춘기 골든타임 · 성장판",
        "query": "초등 사춘기 신호 성장판 키",
        "template_key": "답변 02 (최대 성장속도기 PHV 18~24개월 골든타임 & 야간 인슐린 억제)",
        "core_bridge": "사춘기 초기 신호 단계별 성장판 골든타임 잔여 개월 수와 3개년 성장 타임라인은 키즈핏 그로스 스튜디오( https://kidsfit.co.kr )에서 바로 계산해 보실 수 있습니다.",
    },
    {
        "topic": "유아 소근육 · 몬테소리 vs 가베",
        "query": "36개월 소근육 교구 몬테소리 가베",
        "template_key": "답변 04 (대뇌 운동피질 30% 손끝 민감기 & 월령별 교구 적합도 판정)",
        "core_bridge": "보건복지부 K-DST 6대 발달영역 기준 월령별 몬테소리 vs 은물·가베 적합도 판정과 가정 내 0원 소근육 놀이는 키즈핏 발달 스튜디오( https://kidsfit.co.kr )에서 무료로 확인하실 수 있습니다.",
    },
    {
        "topic": "초등 문장제 수학 · 전두엽 작업기억",
        "query": "초등 문장제 수학 실수 독해력",
        "template_key": "답변 05 (전두엽 작업기억 과부하 해소 & 여백 10초 조건 도식화 루틴)",
        "core_bridge": "우리 아이 5각 두뇌 밸런스(문해·수리·작업기억·메타인지·탐구) 점수와 학습 병목 1:1 처방은 키즈핏 두뇌·학습 리포트( https://kidsfit.co.kr )에서 무료로 진단해 보실 수 있습니다.",
    },
    {
        "topic": "초등 집중력 · 메타인지 백지복습",
        "query": "초등 집중력 공부법 백지복습",
        "template_key": "답변 06 & 07 (가짜기억 차단 3분 파인만 3줄 인출 & 무소음 시각 타이머 스몰윈)",
        "core_bridge": "아이 학습 흡수 성향별 장기기억 보존율 시뮬레이션과 하루 4단계 두뇌 루틴 시간표는 키즈핏 학습 진단소( https://kidsfit.co.kr )에서 1분 진단으로 확인해 보실 수 있습니다.",
    },
]


def fetch_kin_questions(query: str, max_items: int = 3):
    encoded = urllib.parse.quote(query)
    url = f"https://search.naver.com/search.naver?where=kin&query={encoded}&kin_sort=date"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        },
    )
    items = []
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")
        # Extract kin.naver.com/qna/detail links and titles
        pattern = re.compile(
            r'<a[^>]+href="(https://kin\.naver\.com/qna/detail\.naver\?[^"]+)"[^>]*>(.*?)</a>',
            re.DOTALL,
        )
        seen = set()
        for m in pattern.finditer(raw):
            href = html.unescape(m.group(1))
            title_html = m.group(2)
            title = re.sub(r"<[^>]+>", "", title_html)
            title = html.unescape(title).strip()
            if not title or len(title) < 6 or "답변" in title[:4]:
                continue
            doc_id_m = re.search(r"docId=(\d+)", href)
            key = doc_id_m.group(1) if doc_id_m else href
            if key in seen:
                continue
            seen.add(key)
            items.append({"title": title, "url": href})
            if len(items) >= max_items:
                break
    except Exception as e:
        print("WARN_FETCH:", query, e)
    return items


def main():
    lines = [
        "# 실시간 네이버 지식iN 학부모 질문 스나이핑 매칭 리스트",
        f"- 스캔 시각: `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} KST`",
        "- 활용법: 아래 실시간 질문 링크를 클릭한 뒤, 매칭된 템플릿(`01_네이버_지식iN_실시간_스나이핑_명품답변_10선.md`)과 핵심 브릿지 문구를 붙여넣어 답변을 등록합니다.",
        "",
    ]

    total_found = 0
    for q_info in QUERIES:
        found = fetch_kin_questions(q_info["query"], max_items=3)
        lines.append(f"## [{q_info['topic']}] (검색어: `{q_info['query']}`)")
        lines.append(f"- **권장 답변 템플릿**: `{q_info['template_key']}`")
        lines.append(f"- **맞춤 브릿지 문구**: {q_info['core_bridge']}")
        if found:
            for idx, item in enumerate(found, 1):
                total_found += 1
                lines.append(f"  {idx}. [{item['title']}]({item['url']})")
        else:
            lines.append(
                f"  - [네이버 지식iN 최신 질문 바로가기](https://kin.naver.com/search/list.naver?query={urllib.parse.quote(q_info['query'])}&sort=date)"
            )
        lines.append("")

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"SCAN_COMPLETE: {total_found} live questions saved to {OUT_FILE}")


if __name__ == "__main__":
    main()
