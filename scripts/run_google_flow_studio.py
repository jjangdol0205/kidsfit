# -*- coding: utf-8 -*-
"""
Antigravity x Google Flow Direct Browser Launcher (scripts/run_google_flow_studio.py)
Opens Google Flow (https://flow.google.com / https://labs.google/fx/tools/flow) directly
alongside the 6-cut KidsFit raw illustrations and Veo 2 Frames-to-Video motion prompts.
"""

import os
import webbrowser
from pathlib import Path

ROOT = Path(r"d:\키즈핏")
RAW_DIR = ROOT / "samples" / "2_webtoon_sample" / "raw"
HELPER_HTML = ROOT / "samples" / "4_webtoon_video_sample" / "google_flow_launcher.html"

FLOW_PROMPTS = [
    {
        "cut": 1,
        "file": str(RAW_DIR / "cut_01.jpg"),
        "prompt": "Warm Korean pastel watercolor animation, 24fps. The 3-year-old toddler stubbornly shakes his head and pushes away the mother's hand while trying to button his striped shirt. Water ripples gently on the wooden floor. Soft warm evening lighting, subtle slow push-in camera."
    },
    {
        "cut": 2,
        "file": str(RAW_DIR / "cut_02.jpg"),
        "prompt": "Emotional pastel watercolor animation, 24fps. Late at night under a warm glowing bedside lamp, the Korean mother gently strokes her sleeping toddler's blanket with a tear glistening in her eye, while the child's chest rises and falls peacefully."
    },
    {
        "cut": 3,
        "file": str(RAW_DIR / "cut_03.jpg"),
        "prompt": "Warm educational animation, 24fps. Golden neural synapses pulse and flow brightly from the child's fingertips to the brain cortex on the tablet screen, while the mother nods with a relieved 'Aha!' smile."
    },
    {
        "cut": 4,
        "file": str(RAW_DIR / "cut_04.jpg"),
        "prompt": "Bright sunny morning living room animation, 24fps. The 3-year-old toddler happily picks up colorful pom-poms using wooden tongs with focused little hands, while the mother watches and nods warmly. Soft golden sunbeams."
    },
    {
        "cut": 5,
        "file": str(RAW_DIR / "cut_05.jpg"),
        "prompt": "Joyful weekend family animation at a sunlit park and children's art museum, 24fps. The toddler bounces happily and points at a colorful flower sculpture while the mother and father squat down to eye-level and smile."
    },
    {
        "cut": 6,
        "file": str(RAW_DIR / "cut_06.jpg"),
        "prompt": "Heartwarming close-up pastel animation, 24fps. The mother hugs the beaming 3-year-old toddler, who proudly waves a red paper heart cut with safety scissors. Soft floating hearts and golden sparkles."
    }
]


def build_flow_launcher_html():
    cards_html = ""
    for item in FLOW_PROMPTS:
        rel_img = f"../2_webtoon_sample/raw/cut_0{item['cut']}.jpg"
        cards_html += f"""
        <div class="card">
          <img src="{rel_img}" alt="Cut {item['cut']}">
          <div class="card-body">
            <div class="cut-title">CUT 0{item['cut']} · 원화 경로: <code>{item['file']}</code></div>
            <div class="prompt-box" id="p-{item['cut']}">{item['prompt']}</div>
            <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('p-{item['cut']}').innerText).then(()=>alert('컷 {item['cut']} Google Flow 모션 프롬프트가 복사되었습니다!'))">📋 컷 {item['cut']} Flow 모션 프롬프트 복사</button>
          </div>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>안티그래비티 × Google Flow (Veo) 원클릭 런처 & 움직이는 영상 스튜디오</title>
  <style>
    body {{ font-family: 'Pretendard', 'Malgun Gothic', sans-serif; background: #FAF8F5; color: #1E293B; margin: 0; padding: 2rem 1rem; }}
    .wrap {{ max-width: 1020px; margin: 0 auto; background: #FFFFFF; border-radius: 28px; padding: 2rem; box-shadow: 0 12px 32px rgba(20,30,55,0.06); }}
    .hero {{ background: linear-gradient(135deg, #4F46E5 0%, #059669 100%); color: #FFF; padding: 1.75rem; border-radius: 22px; margin-bottom: 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }}
    .flow-btn {{ background: #FFFFFF; color: #4F46E5; font-weight: 800; padding: 0.9rem 1.6rem; border-radius: 999px; text-decoration: none; font-size: 1rem; box-shadow: 0 6px 16px rgba(0,0,0,0.15); }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.25rem; }}
    .card {{ border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; background: #F8FAFC; }}
    .card img {{ width: 100%; height: 240px; object-fit: cover; display: block; }}
    .card-body {{ padding: 1rem; }}
    .cut-title {{ font-weight: 800; font-size: 0.85rem; color: #4F46E5; margin-bottom: 0.5rem; word-break: break-all; }}
    .prompt-box {{ background: #FFF; border: 1px solid #CBD5E1; border-radius: 12px; padding: 0.75rem; font-size: 0.83rem; color: #334155; line-height: 1.5; margin-bottom: 0.75rem; }}
    .copy-btn {{ width: 100%; background: #4F46E5; color: #FFF; border: none; padding: 0.65rem; border-radius: 10px; font-weight: 700; cursor: pointer; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <div>
        <h1 style="margin:0 0 0.4rem 0; font-size:1.5rem;">🎬 안티그래비티 × Google Flow (Veo) 움직이는 영상 스튜디오</h1>
        <p style="margin:0; opacity:0.92; font-size:0.92rem;">아래 버튼으로 Google Flow(flow.google.com)를 열고, 6컷 원화와 프롬프트를 넣어 2~3초 모션 클립을 생성하거나 바로 완성된 2.5D 모션 영상을 재생하세요.</p>
      </div>
      <a class="flow-btn" href="https://flow.google.com/" target="_blank" rel="noopener">🚀 Google Flow (flow.google.com) 바로 열기</a>
    </div>
    <div style="margin-bottom: 1.5rem; text-align: center;">
      <a class="flow-btn" style="background:#059669; color:#FFF; display:inline-block; margin-right:0.5rem;" href="webtoon_parenting_video.mp4">▶ 완성된 움직이는 웹툰 영상 샘플 재생 (15초)</a>
      <a class="flow-btn" style="background:#4F46E5; color:#FFF; display:inline-block;" href="../5_cardnews_video_sample/cardnews_parenting_video.mp4">▶ 완성된 움직이는 카드뉴스 영상 샘플 재생 (15초)</a>
    </div>
    <div class="grid">
      {cards_html}
    </div>
  </div>
</body>
</html>"""
    HELPER_HTML.write_text(html, encoding="utf-8")
    return HELPER_HTML


if __name__ == "__main__":
    out = build_flow_launcher_html()
    print(f"Google Flow Launcher HTML generated: {out}")
    try:
        webbrowser.open("https://flow.google.com/")
        webbrowser.open(out.as_uri())
    except Exception as e:
        print(f"Browser open skipped: {e}")
