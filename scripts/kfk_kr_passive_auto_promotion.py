#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
D:\드림컴퍼니\5사업부\scripts\kfk_kr_passive_auto_promotion.py
5사업부 키즈핏 성장 연구소 (https://kidsfit.co.kr)
100% 무인 패시브 SEO · GEO(llms.txt) · 외부 DA88 백링크 · IndexNow 자동 홍보 엔진
  - GEMINI.md 제3조 3항 완벽 준수: 금지어 0% 검증 및 순수 유료 2등급(래피드 9,900원 / 19,900원 · 제휴 상품 0건) 안내
"""

import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

KST = timezone(timedelta(hours=9))
ROOT_DIR = Path(__file__).resolve().parent.parent
QNA_DIR = ROOT_DIR / "qna"
LOGS_DIR = ROOT_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

INDEXNOW_KEY = "bb7865143f912a88c04d31d3921a0988"
HOST = "kidsfit.co.kr"
TELEGRAPH_ACCT_PATH = LOGS_DIR / "kr_telegraph_account.json"
BACKLINKS_LOG_PATH = LOGS_DIR / "kr_external_backlinks.json"
PROHIBITED_WORDS = ["최저가", "할인율", "특가", "폭탄세일"]


def publish_kr_telegraph_article() -> str:
    now_kst = datetime.now(KST)
    date_str = now_kst.strftime("%Y-%m-%d")

    acct = {}
    if TELEGRAPH_ACCT_PATH.exists():
        try:
            acct = json.loads(TELEGRAPH_ACCT_PATH.read_text(encoding="utf-8"))
        except Exception:
            acct = {}

    if not acct.get("access_token"):
        req_url = (
            "https://api.telegra.ph/createAccount?"
            + urllib.parse.urlencode(
                {
                    "short_name": "KidsFit_KR",
                    "author_name": "키즈핏 그로스 스튜디오 소아성장·두뇌발달 연구소",
                    "author_url": "https://kidsfit.co.kr/",
                }
            )
        )
        with urllib.request.urlopen(req_url, timeout=15) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            if res_data.get("ok"):
                acct = res_data["result"]
                TELEGRAPH_ACCT_PATH.write_text(json.dumps(acct, indent=2, ensure_ascii=False), encoding="utf-8")

    token = acct.get("access_token")
    if not token:
        return "Failed to acquire Telegraph token"

    title = f"[키즈핏 성장 연구소 노트 {date_str}] 질병관리청(KDCA) 2017 성장도표 정밀 백분위 & 첫 90분 서파수면·뼈나이(Δt) 가이드"
    nodes = [
        {
            "tag": "p",
            "children": [
                "우리 아이의 최종 성인 예상키는 부모 유전 표적키(MPH)만으로 고정되지 않으며, 성장판이 닫히기 전 수면·영양·바른 자세 환경에 따라 ±5~8cm 이상 달라질 수 있습니다."
            ],
        },
        {"tag": "h3", "children": ["1. 태어난 날짜까지 헤아린 질병관리청(KDCA) 성장도표 & 병원 뼈나이(Δt) 보정"]},
        {
            "tag": "ul",
            "children": [
                {
                    "tag": "li",
                    "children": [
                        "생년월일 일수 기준 백분위와 예전 병원 손목 뼈나이 검사일 이후 흐른 시간까지 헤아린 5단계 성장 시계 진단은 ",
                        {"tag": "a", "attrs": {"href": "https://kidsfit.co.kr/"}, "children": ["키즈핏 성장 연구소 (kidsfit.co.kr)"]},
                        " 에서 상업성 광고 없이 확인하실 수 있습니다.",
                    ],
                },
                {
                    "tag": "li",
                    "children": [
                        "첫 90분 서파수면(N3) 성장호르몬 리듬 및 칼슘·비타민D3·비타민K2·아연 성장 에세이 아카이브는 ",
                        {"tag": "a", "attrs": {"href": "https://kidsfit.co.kr/qna/"}, "children": ["키즈핏 성장 연구소 노트 아카이브"]},
                        " 를 참고하세요.",
                    ],
                },
            ],
        },
        {"tag": "h3", "children": ["2. 가정용 단건 정밀 리포트(9,900원) & 6개월 성장속도(cm/yr) 자동 판독 패스(19,900원)"]},
        {
            "tag": "p",
            "children": [
                "매월 30일 주기로 아침 기상 직후 키 변화를 입력해 질병관리청 기준 연간 성장속도 정상 여부를 확인하는 정기 트래커 안내는 ",
                {"tag": "a", "attrs": {"href": "https://kidsfit.co.kr/"}, "children": ["https://kidsfit.co.kr/"]},
                " 에서 살펴보실 수 있습니다.",
            ],
        },
    ]

    raw_json = json.dumps(nodes, ensure_ascii=False)
    for w in PROHIBITED_WORDS:
        if w in raw_json or w in title:
            raise ValueError(f"Prohibited word detected: {w}")

    payload = urllib.parse.urlencode(
        {
            "access_token": token,
            "title": title,
            "author_name": "키즈핏 그로스 스튜디오",
            "author_url": "https://kidsfit.co.kr/",
            "content": raw_json,
            "return_content": "false",
        }
    ).encode("utf-8")

    req = urllib.request.Request("https://api.telegra.ph/createPage", data=payload, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        out = json.loads(resp.read().decode("utf-8"))

    page_url = out.get("result", {}).get("url", "")
    if page_url:
        logs = []
        if BACKLINKS_LOG_PATH.exists():
            try:
                logs = json.loads(BACKLINKS_LOG_PATH.read_text(encoding="utf-8"))
            except Exception:
                logs = []
        logs.append({"date": date_str, "title": title, "url": page_url, "created_at": now_kst.isoformat()})
        BACKLINKS_LOG_PATH.write_text(json.dumps(logs[-50:], indent=2, ensure_ascii=False), encoding="utf-8")
    return page_url


def ping_indexnow_and_websub() -> dict:
    urls = [
        "https://kidsfit.co.kr/",
        "https://kidsfit.co.kr/qna/",
        "https://kidsfit.co.kr/sitemap.xml",
        "https://kidsfit.co.kr/rss.xml",
        "https://kidsfit.co.kr/llms.txt",
    ]
    if QNA_DIR.exists():
        for p in sorted(QNA_DIR.glob("*.html"))[:50]:
            if p.name != "index.html":
                urls.append(f"https://kidsfit.co.kr/qna/{p.name}")

    body = json.dumps(
        {
            "host": HOST,
            "key": INDEXNOW_KEY,
            "keyLocation": f"https://{HOST}/{INDEXNOW_KEY}.txt",
            "urlList": urls,
        }
    ).encode("utf-8")

    results = {"url_count": len(urls)}
    for name, endpoint in [
        ("indexnow_global", "https://api.indexnow.org/indexnow"),
        ("bing_direct", "https://www.bing.com/indexnow"),
        ("yandex", "https://yandex.com/indexnow"),
    ]:
        try:
            req = urllib.request.Request(
                endpoint,
                data=body,
                headers={"Content-Type": "application/json; charset=utf-8"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=12) as r:
                results[name] = r.status
        except urllib.error.HTTPError as e:
            results[name] = e.code
        except Exception as e:
            results[name] = str(e)

    try:
        w_data = urllib.parse.urlencode({"hub.mode": "publish", "hub.url": "https://kidsfit.co.kr/rss.xml"}).encode("utf-8")
        req = urllib.request.Request("https://pubsubhubbub.appspot.com/", data=w_data, method="POST")
        with urllib.request.urlopen(req, timeout=10) as r:
            results["google_websub"] = r.status
    except Exception as e:
        results["google_websub"] = str(e)

    return results


def main():
    telegraph_url = publish_kr_telegraph_article()
    ping_res = ping_indexnow_and_websub()
    print(f"[KFK Passive Auto-Promo] Telegraph KR: {telegraph_url} | IndexNow: {ping_res}")


if __name__ == "__main__":
    main()
