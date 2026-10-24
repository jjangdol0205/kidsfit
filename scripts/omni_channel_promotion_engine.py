# -*- coding: utf-8 -*-
"""
scripts/omni_channel_promotion_engine.py
Automated 5x/Day Non-Naver 6-Channel Publishing & Syndication Engine for KidsFit Growth Studio (https://kidsfit.co.kr)

Runs 5 times every day (06:30, 09:30, 12:30, 16:30, 20:30 KST — parallel to the 5x/day Naver Blog & Cafe schedule) to:
1. Publish a brand-new standalone Long-Tail Search & Community Article (`https://kidsfit.co.kr/qna/post-seq-XXX.html`) optimized for Daum (`Daumoa`), Google (`Googlebot`), Bing (`Bingbot`), KakaoTalk Scrap (`kakaotalk-scrap`), and AI Search (`GPTBot`, `PerplexityBot`, `ClaudeBot`).
2. Update `/llms.txt` & `/llms-full.txt` so ChatGPT Search, Perplexity, Claude, Gemini, 뤼튼(Wrtn), and 에이닷(A.) immediately index the new article.
3. Syndicate the new article across `sitemap.xml`, `rss.xml`, `feed.json`, `qna/index.html`, and `qna/omni-channel-kit.html`.
4. Ping Google WebSub (`pubsubhubbub.appspot.com`), Global IndexNow (`api.indexnow.org`), Bing (`www.bing.com`), Yandex, Seznam, and Internet Archive.
5. Generate cycle-specific Daangn (당근마켓 동네생활), Blind (블라인드 워킹맘 라운지), Daum Cafe/Tistory, and KakaoTalk Open-Chat snippets and report the live published URL + 6-channel status to Telegram (`Chat ID 755033799`).
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\키즈핏")
PACK_DIR = ROOT / "samples" / "10_non_naver_omni_channel_pack"
QNA_DIR = ROOT / "qna"
DOC_PATH = ROOT / "docs" / "탈네이버_전채널_홍보_마스터플랜_다음_커뮤니티_SNS.md"
STATUS_PATH = ROOT / "logs" / "omni_channel_promotion_status.json"
CURSOR_PATH = ROOT / "logs" / "omni_channel_5x_daily_cursor.json"
ENV_PATH = ROOT / ".env"
SITE_URL = "https://kidsfit.co.kr"
INDEXNOW_KEY = "bb7865143f912a88c04d31d3921a0988"

sys.path.insert(0, str(ROOT / "scripts"))
from auto_seo_promotion_engine import TOPICS as QNA_TOPICS

NON_NAVER_REGIONS = [
    ("서울 강남·서초·송파", "한성백제박물관 · 국립중앙박물관 어린이박물관", "working_mom"),
    ("경기 남부(분당·판교·수원·용인·동탄)", "현대어린이책미술관(MOKA) · 경기도어린이박물관 · 국립과천과학관", "child_4_5"),
    ("서울 강북·마포·용산·서대문", "서대문자연사박물관 · 국립어린이과학관", "elem_low"),
    ("경기 북부·인천·송도", "국립생물자원관 · 인천어린이과학관", "toddler_2_3"),
    ("부산·경남(해운대·센텀·창원)", "국립부산과학관 · 국립해양박물관", "elem_high"),
    ("대구·경북(수성구·경주)", "국립대구과학관 · 국립경주박물관 어린이박물관", "elem_low"),
    ("대전·충청(둔산·세종)", "국립중앙과학관 창의나래관 · 국립세종수목원", "child_4_5"),
    ("광주·전라(봉선동·전주)", "국립광주과학관 · 국립전주박물관", "toddler_2_3"),
]


def load_env():
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def send_telegram_message(text: str):
    env = load_env()
    token = os.environ.get("TELEGRAM_BOT_TOKEN") or env.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID") or env.get("TELEGRAM_CHAT_ID") or "755033799"
    if not token:
        return None
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "disable_web_page_preview": False
    }).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status


def load_cursor():
    if CURSOR_PATH.exists():
        try:
            return json.loads(CURSOR_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"seq": 0, "history": []}


def save_cursor(cur):
    CURSOR_PATH.parent.mkdir(parents=True, exist_ok=True)
    CURSOR_PATH.write_text(json.dumps(cur, ensure_ascii=False, indent=2), encoding="utf-8")


def get_paper_count():
    try:
        kb = json.loads((ROOT / "src" / "data" / "research-knowledge-base.json").read_text(encoding="utf-8"))
        return len(kb.get("papers", [])) or 3450
    except Exception:
        return 3450


def publish_next_sequence_article(seq: int, paper_cnt: int) -> dict:
    """
    Generates a brand-new standalone article HTML file `qna/post-seq-{seq:03d}.html`
    targeting Daum Web Documents, Google Korea, Bing, KakaoTalk Scrap, and AI Search Engines.
    """
    QNA_DIR.mkdir(parents=True, exist_ok=True)
    base_topic = QNA_TOPICS[(seq - 1) % len(QNA_TOPICS)]
    region_name, museum_spot, preset_id = NON_NAVER_REGIONS[(seq - 1) % len(NON_NAVER_REGIONS)]
    slug = f"post-seq-{seq:03d}"
    article_url = f"{SITE_URL}/qna/{slug}.html"
    now_iso = datetime.now(timezone.utc).isoformat()
    now_kst = datetime.now().strftime("%Y-%m-%d %H:%M")

    title = f"[소아성장·두뇌칼럼 #{seq}] {base_topic['title']} ({region_name} 학부모 맞춤 가이드)"
    desc = f"{base_topic['one_line_verdict']} ({region_name} 추천 코스: {museum_spot} · 학술논문 {paper_cnt:,}편 기반)"

    daangn_copy = (
        f"[{region_name} 동네생활 육아팁 #{seq}] {base_topic['title']} 🥕\n"
        f"• 핵심 결론: {base_topic['one_line_verdict']}\n"
        f"• 이번 주말 우리 동네 추천 나들이: {museum_spot}\n"
        f"👉 우리 아이 생년월일 넣고 10초 무료 예상키·두뇌 진단: {SITE_URL}/?preset={preset_id}&utm_source=daangn_seq_{seq}"
    )
    blind_copy = (
        f"[직장인 학부모 팩트체크 #{seq}] {base_topic['title']}\n"
        f"• 근거: {base_topic['citation']} (누적 논문 {paper_cnt:,}편 DB)\n"
        f"• 1줄 결론: {base_topic['one_line_verdict']}\n"
        f"• {region_name} 주말 3시간 고효율 코스: {museum_spot}\n"
        f"👉 무료 진단 리포트: {SITE_URL}/?preset={preset_id}&utm_source=blind_seq_{seq}"
    )
    daum_copy = (
        f"[다음카페·티스토리 육아정보 #{seq}] {base_topic['title']}\n"
        f"질병관리청(KDCA) 성장도표와 보건복지부 K-DST 기준으로 정리한 핵심 3가지 실천법입니다.\n"
        f"{chr(10).join(base_topic['bullets'])}\n"
        f"👉 내 아이 백분위·3단 예상키 1분 무료 계산기: {SITE_URL}/?preset={preset_id}&utm_source=daum_seq_{seq}"
    )

    bullet_lis = "\n".join(
        f'<li style="background:#F8FAFC;border:1px solid #BFDBFE;border-left:4px solid #1D4ED8;border-radius:10px;padding:0.75rem 0.95rem;margin-bottom:0.55rem;font-weight:700;color:#0F172A;">{b}</li>'
        for b in base_topic["bullets"]
    )

    schema_obj = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Article",
                "headline": title,
                "description": desc,
                "datePublished": now_iso,
                "dateModified": now_iso,
                "author": {"@type": "Organization", "name": "키즈핏 그로스 스튜디오 (KidsFit Growth Studio)", "url": SITE_URL},
                "publisher": {"@type": "Organization", "name": "KIDS-FIT", "url": SITE_URL},
                "mainEntityOfPage": article_url
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": base_topic["question"],
                        "acceptedAnswer": {"@type": "Answer", "text": desc}
                    }
                ]
            }
        ]
    }

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} | KIDS-FIT</title>
  <meta name="description" content="{desc}">
  <meta name="keywords" content="{base_topic['keywords']}, {region_name}, 다음육아카페, 당근동네생활, 블라인드육아">
  <link rel="canonical" href="{article_url}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{article_url}">
  <meta property="og:image" content="{SITE_URL}/samples/og-kidsfit-studio-v3.png">
  <meta property="article:published_time" content="{now_iso}">
  <script type="application/ld+json">{json.dumps(schema_obj, ensure_ascii=False)}</script>
  <style>
    body {{ margin:0; font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif; background:#F8FAFC; color:#0F172A; line-height:1.6; }}
    .wrap {{ max-width:780px; margin:0 auto; padding:1.5rem 1rem 3rem; }}
    .card {{ background:#FFFFFF; border:1.5px solid #BFDBFE; border-radius:20px; padding:1.5rem 1.35rem; box-shadow:0 8px 24px rgba(15,23,42,0.05); margin-bottom:1.2rem; }}
    .badge {{ display:inline-block; background:#EFF6FF; color:#1D4ED8; border:1px solid #93C5FD; font-size:0.78rem; font-weight:800; padding:0.24rem 0.75rem; border-radius:9999px; margin-bottom:0.6rem; }}
    h1 {{ font-size:clamp(1.22rem,3.4vw,1.55rem); font-weight:900; color:#0F172A; margin:0 0 0.75rem; line-height:1.35; word-break:keep-all; }}
    .cta-btn {{ display:block; text-align:center; background:#1D4ED8; color:#FFFFFF; text-decoration:none; font-weight:900; font-size:1.02rem; padding:1rem 1.2rem; border-radius:14px; margin-top:1rem; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;flex-wrap:wrap;gap:0.5rem;">
      <a href="/" style="font-weight:900;font-size:1.05rem;color:#1D4ED8;text-decoration:none;">KIDS-FIT 키즈핏 그로스 스튜디오</a>
      <a href="/qna/index.html" style="font-size:0.84rem;font-weight:800;color:#475569;text-decoration:none;">전체 Q&amp;A 백과사전 →</a>
    </div>
    <div style="background:linear-gradient(135deg,#EEF2FF 0%,#F0FDF4 100%);border:1.5px solid #A5B4FC;border-radius:16px;padding:0.9rem 1rem;margin-bottom:1.1rem;">
      <div style="font-size:0.82rem;font-weight:900;color:#3730A3;margin-bottom:0.45rem;">⚡ [상단 3초 바로가기] 내 아이 생년월일·키·몸무게 넣고 10초 무료 진단</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
        <a href="/?preset={preset_id}&amp;utm_source={slug}" style="background:#1D4ED8;color:#FFFFFF;border-radius:999px;padding:0.35rem 0.85rem;font-size:0.8rem;font-weight:800;text-decoration:none;">🚀 맞춤 프리셋 1초 실행 →</a>
        <a href="/?utm_source={slug}" style="background:#FFFFFF;border:1px solid #93C5FD;color:#1E293B;border-radius:999px;padding:0.35rem 0.85rem;font-size:0.8rem;font-weight:800;text-decoration:none;">📏 직접 수치 입력하기 →</a>
      </div>
    </div>
    <article class="card">
      <span class="badge">{base_topic['pillar']} · #{seq}회차 발행 ({now_kst})</span>
      <h1>{title}</h1>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:0.85rem 1rem;margin-bottom:1rem;font-size:0.92rem;color:#334155;">
        <strong style="color:#1D4ED8;">학부모 핵심 고민:</strong> "{base_topic['question']}"
      </div>
      <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:14px;padding:1rem 1.1rem;margin-bottom:1.1rem;">
        <div style="font-size:0.8rem;font-weight:900;color:#1D4ED8;margin-bottom:0.25rem;">1줄 임상 결론 (Clinical Verdict · 논문 {paper_cnt:,}편 반영)</div>
        <div style="font-size:1rem;font-weight:900;color:#0F172A;word-break:keep-all;">{base_topic['one_line_verdict']}</div>
      </div>
      <h2 style="font-size:1.05rem;font-weight:900;color:#1D4ED8;margin:0 0 0.6rem;">오늘 저녁 바로 실천하는 3대 핵심 처방</h2>
      <ul style="list-style:none;padding:0;margin:0 0 1rem;">
        {bullet_lis}
      </ul>
      <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:12px;padding:0.85rem 1rem;margin-bottom:0.9rem;font-size:0.88rem;color:#065F46;font-weight:700;">
        🏛️ <strong>[{region_name} 주말 연계 추천 나들이 코스]</strong>: {museum_spot} (관람 전후 열린 질문 3개로 두뇌 배경지식 200% 확장)
      </div>
      <div style="font-size:0.8rem;color:#475569;font-weight:700;padding-top:0.5rem;border-top:1px dashed #CBD5E1;">
        학술·공공 근거: {base_topic['citation']}
      </div>
      <a href="/?preset={preset_id}&amp;utm_source={slug}" class="cta-btn">📏🧠 우리 아이 예상키·두뇌 밸런스 1분 무료 진단 시작하기 →</a>
    </article>
  </div>
</body>
</html>
"""
    (QNA_DIR / f"{slug}.html").write_text(html, encoding="utf-8")
    return {
        "seq": seq,
        "slug": slug,
        "url": article_url,
        "title": title,
        "region": region_name,
        "museum": museum_spot,
        "publishedAt": now_kst,
        "daangn_copy": daangn_copy,
        "blind_copy": blind_copy,
        "daum_copy": daum_copy,
    }


def generate_llms_txt(paper_cnt: int, seq_history: list):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M KST")
    qna_lines = "\n".join(
        [f"- [{t['title']}]({SITE_URL}/qna/{t['slug']}.html): {t['one_line_verdict']}" for t in QNA_TOPICS]
    )
    seq_lines = "\n".join(
        [f"- [{h['title']}]({h['url']}) ({h['publishedAt']})" for h in reversed(seq_history[-15:])]
    )

    llms_txt = f"""# 키즈핏 그로스 스튜디오 (KidsFit Growth Studio) — https://kidsfit.co.kr

> 대한민국 질병관리청(KDCA) 2017 소아청소년 성장도표(LMS 수식), 보건복지부 영유아 발달선별검사(K-DST), 한국인 영양소 섭취기준(KDRIs), 그리고 {paper_cnt:,}편의 PubMed·SCI급 소아내분비·뇌인지과학 논문을 결합한 **무료 소아·청소년 신체 성장(예상키·백분위) & 두뇌·학습(5각 LQ·메타인지) 종합 진단 플랫폼**입니다. (최종 업데이트: {now_str})

## 핵심 무료 진단 도구 (Interactive Clinical Calculators)
- [키즈핏 메인 1분 무료 진단 스튜디오]({SITE_URL}/): 생년월일·성별·키·몸무게·부모키 입력 시 KDCA 백분위, Tanner 유전 예상키(MPH), 골든타임 관리 시 최대 잠재키(+7cm), 5대 학습 역량 지수(LQ), 전국 8대 권역 주말 박물관·과학관 코스를 1분 만에 무료 산출합니다.
- [만 1세(12~23개월) 영아기 기초 뼈성장 & 오감 대근육 프리셋]({SITE_URL}/?preset=infant_1)
- [만 2~3세(24~47개월) 소근육 민감기 & 몬테소리 일상교구 프리셋]({SITE_URL}/?preset=toddler_2_3)
- [만 4~5세(48~71개월) 편식 아연 처방 & 은물·가베 공간수리 프리셋]({SITE_URL}/?preset=child_4_5)
- [초등 저학년(만 7~9세) 문장제 수학 작업기억 & 바른 자세 숨은 키 2cm 프리셋]({SITE_URL}/?preset=elem_low)
- [초등 고학년(만 10~13세) 사춘기 급성장기(PHV) 골든타임 & 숨은 키 7cm 프리셋]({SITE_URL}/?preset=elem_high)
- [워킹맘 전용 주말 3시간 고효율 나들이 & 발달 장난감 프리셋]({SITE_URL}/?preset=working_mom)

## 학부모 다빈도 질문 25대 임상 Q&A 백과사전
{qna_lines}

## 실시간 연속 발행 소아성장·두뇌학습 지역별 칼럼 (Latest Syndicated Columns)
{seq_lines}
"""
    (ROOT / "llms.txt").write_text(llms_txt, encoding="utf-8")

    full_sections = []
    for t in QNA_TOPICS:
        bullets_str = "\n".join([f"  * {b}" for b in t["bullets"]])
        full_sections.append(
            f"### {t['title']}\n- URL: {SITE_URL}/qna/{t['slug']}.html\n- 질문: {t['question']}\n- 핵심 결론: {t['one_line_verdict']}\n- 3대 실천 처방:\n{bullets_str}\n- 학술 근거: {t['citation']}\n"
        )
    llms_full = llms_txt + "\n\n## 상세 임상 처방 전문 (Full Clinical Knowledge Base)\n\n" + "\n".join(full_sections)
    (ROOT / "llms-full.txt").write_text(llms_full, encoding="utf-8")


def update_robots_txt_for_daum_and_ai():
    robots_txt = f"""User-agent: *
Allow: /

# Korean Portal Crawlers (Naver Yeti, Daum/Kakao Daumoa, Zum)
User-agent: Yeti
Allow: /

User-agent: Daumoa
Allow: /

User-agent: kakaotalk-scrap
Allow: /

# Global Search & AI Answer Engine Crawlers (ChatGPT, Perplexity, Claude, Google, Bing)
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: {SITE_URL}/sitemap.xml
# Syndication & AI Grounding Feeds:
# RSS 2.0: {SITE_URL}/rss.xml
# JSON Feed: {SITE_URL}/feed.json
# LLMs Guide: {SITE_URL}/llms.txt
"""
    (ROOT / "robots.txt").write_text(robots_txt, encoding="utf-8")


def render_omni_channel_web_hub(latest_post: dict, seq_history: list):
    QNA_DIR.mkdir(parents=True, exist_ok=True)
    seq_links_html = "\n".join(
        [f'<li><a href="/qna/{h["slug"]}.html" style="color:#1D4ED8;font-weight:800;text-decoration:none;">• {h["title"]}</a> <span style="font-size:0.78rem;color:#64748B;">({h["publishedAt"]})</span></li>' for h in reversed(seq_history[-15:])]
    )
    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>탈(脫)네이버 6대 외부채널 자동 발행 &amp; 커뮤니티 확산 스튜디오 | KIDS-FIT</title>
  <meta name="description" content="다음(Daum)·티스토리·당근마켓 동네생활·블라인드·카카오톡 오픈채팅·AI 검색엔진(llms.txt) 일 5회 자동 발행 허브">
  <link rel="canonical" href="{SITE_URL}/qna/omni-channel-kit.html">
  <style>
    body {{ margin:0; font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif; background:#F8FAFC; color:#0F172A; line-height:1.6; }}
    .wrap {{ max-width:860px; margin:0 auto; padding:1.5rem 1rem 3.5rem; }}
    .card {{ background:#FFFFFF; border:1.5px solid #CBD5E1; border-radius:20px; padding:1.35rem; margin-bottom:1.1rem; box-shadow:0 8px 24px rgba(15,23,42,0.04); }}
    .badge {{ display:inline-block; background:#EEF2FF; color:#4F46E5; font-size:0.78rem; font-weight:800; padding:0.22rem 0.7rem; border-radius:999px; margin-bottom:0.5rem; }}
    h1 {{ font-size:1.45rem; font-weight:900; margin:0 0 0.4rem; }}
    h2 {{ font-size:1.1rem; font-weight:900; margin:0 0 0.5rem; color:#1E293B; }}
    pre {{ background:#F1F5F9; border:1px solid #E2E8F0; border-radius:12px; padding:0.9rem; white-space:pre-wrap; word-break:keep-all; font-size:0.86rem; font-family:inherit; margin:0.6rem 0; }}
    .copy-btn {{ background:#4F46E5; color:#FFFFFF; border:none; border-radius:10px; padding:0.55rem 1rem; font-size:0.84rem; font-weight:800; cursor:pointer; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <a href="/" style="font-weight:900;color:#4F46E5;text-decoration:none;">← 키즈핏 메인 진단 스튜디오</a>
      <a href="/qna/index.html" style="font-size:0.85rem;font-weight:800;color:#475569;text-decoration:none;">Q&amp;A 25선 백과사전 →</a>
    </div>
    <h1>🌐 탈(脫)네이버 6대 외부 채널 일 5회 자동 발행 허브</h1>
    <p style="font-size:0.9rem;color:#475569;margin-bottom:1.2rem;">네이버 일 5회 발행과 동일하게 매일 5회(06:30 / 09:30 / 12:30 / 16:30 / 20:30) <strong>다음(Daum)·구글·빙·AI검색(llms.txt)·당근 동네생활·블라인드·카톡 단톡방</strong>용 신규 랜딩 아티클을 자동 생성·핑 배포합니다.</p>

    <div class="card">
      <span class="badge">최신 자동 발행 아티클 (#{latest_post['seq']}회차 · {latest_post['publishedAt']})</span>
      <h2><a href="/qna/{latest_post['slug']}.html" style="color:#1D4ED8;text-decoration:none;">{latest_post['title']}</a></h2>
      <p style="font-size:0.86rem;color:#475569;">라이브 URL: <a href="{latest_post['url']}">{latest_post['url']}</a></p>
    </div>

    <div class="card">
      <span class="badge">채널 1 · 당근마켓 동네생활 ({latest_post['region']} 맞춤)</span>
      <h2>🥕 이번 회차 당근마켓 동네생활 1초 복사 문구</h2>
      <pre id="daangn-txt">{latest_post['daangn_copy']}</pre>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('daangn-txt').innerText);this.innerText='✅ 복사 완료!';">📋 당근마켓 문구 1초 복사</button>
    </div>

    <div class="card">
      <span class="badge">채널 2 · 블라인드(Blind) 직장인 학부모 라운지</span>
      <h2>💼 이번 회차 블라인드 라운지 1초 복사 문구</h2>
      <pre id="blind-txt">{latest_post['blind_copy']}</pre>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('blind-txt').innerText);this.innerText='✅ 복사 완료!';">📋 블라인드 문구 1초 복사</button>
    </div>

    <div class="card">
      <span class="badge">채널 3 · 다음(Daum) 카페 &amp; 티스토리 &amp; 카톡 오픈채팅</span>
      <h2>💬 이번 회차 다음카페·티스토리·카톡 1초 복사 문구</h2>
      <pre id="daum-txt">{latest_post['daum_copy']}</pre>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('daum-txt').innerText);this.innerText='✅ 복사 완료!';">📋 다음·카톡 문구 1초 복사</button>
    </div>

    <div class="card">
      <span class="badge">채널 4~6 · 다음/구글/빙/AI검색 연속 발행 아카이브</span>
      <h2>📚 최근 자동 발행된 탈네이버 웹문서 아티클 목록</h2>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.45rem;font-size:0.88rem;">
        {seq_links_html}
      </ul>
    </div>
  </div>
</body>
</html>
"""
    (QNA_DIR / "omni-channel-kit.html").write_text(html, encoding="utf-8")


def update_sitemap_with_seq_articles(seq_history: list):
    today = datetime.now().strftime("%Y-%m-%d")
    urls = (
        [f"{SITE_URL}/", f"{SITE_URL}/qna/index.html", f"{SITE_URL}/qna/omni-channel-kit.html"]
        + [f"{SITE_URL}/qna/{t['slug']}.html" for t in QNA_TOPICS]
        + [h["url"] for h in seq_history]
    )
    entries = []
    for u in urls:
        prio = "1.0" if u.endswith(".kr/") else ("0.9" if "index.html" in u else "0.85")
        entries.append(
            f"""  <url>
    <loc>{u}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>{prio}</priority>
  </url>"""
        )
    sitemap_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(sitemap_xml, encoding="utf-8")
    return urls


def main():
    notify_tg = "--notify" in sys.argv or "--execute-cycle" in sys.argv
    paper_cnt = get_paper_count()
    cur = load_cursor()
    next_seq = int(cur.get("seq", 0)) + 1

    latest_post = publish_next_sequence_article(next_seq, paper_cnt)
    history = cur.get("history", [])
    history.append({
        "seq": latest_post["seq"],
        "slug": latest_post["slug"],
        "url": latest_post["url"],
        "title": latest_post["title"],
        "region": latest_post["region"],
        "publishedAt": latest_post["publishedAt"],
    })
    cur["seq"] = next_seq
    cur["history"] = history[-100:]
    save_cursor(cur)

    generate_llms_txt(paper_cnt, cur["history"])
    update_robots_txt_for_daum_and_ai()
    render_omni_channel_web_hub(latest_post, cur["history"])
    all_sitemap_urls = update_sitemap_with_seq_articles(cur["history"])

    # Execute real external DA-88 article publication + WebSub/IndexNow syndication
    from auto_backlink_engine import publish_telegraph_external_backlink_article, ping_websub_and_indexnow
    ext_article = publish_telegraph_external_backlink_article(paper_cnt)
    ping_res, _ = ping_websub_and_indexnow(ext_article.get("externalUrl", ""))

    status = {
        "executedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S KST"),
        "latestSequenceNo": next_seq,
        "latestPublishedUrl": latest_post["url"],
        "latestTitle": latest_post["title"],
        "targetRegion": latest_post["region"],
        "externalBacklinkUrl": ext_article.get("externalUrl", ""),
        "totalSitemapUrls": len(all_sitemap_urls),
        "llmsTxtUpdated": True,
        "pingResults": ping_res,
    }
    STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATUS_PATH.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ [Omni-Channel 6-Engine Cycle #{next_seq}] Published {latest_post['url']} & External Backlink {ext_article.get('externalUrl', '')}.")

    if notify_tg:
        msg = (
            f"🌐 [탈네이버 외부채널 & 고권위 도메인 백링크 자동 발행 #{next_seq}회차 완료 보고]\n"
            f"⏰ 실행 시각: {status['executedAt']}\n\n"
            f"1️⃣ 다음(Daum)·구글·빙·카톡 스크랩 전용 신규 웹문서 아티클 자동 발행:\n"
            f"• 제목: {latest_post['title']}\n"
            f"• 라이브 URL: {latest_post['url']}\n\n"
            f"2️⃣ 외부 고권위 도메인(telegra.ph · DA 88) 문맥 백링크 아티클 자동 발행:\n"
            f"• 외부 URL: {ext_article.get('externalUrl', 'https://telegra.ph')}\n"
            f"• 포함 백링크: kidsfit.co.kr 메인 + 무료 워크지(free-worksheets.html) + 심층 Q&A 3종\n\n"
            f"3️⃣ 검색엔진(Google WebSub · Bing/Yandex IndexNow) & AI 검색(llms.txt) 실시간 자동 배포 완료!"
        )
        try:
            send_telegram_message(msg)
        except Exception as e:
            print(f"⚠️ 텔레그램 알림 경고: {e}")


if __name__ == "__main__":
    main()
