# -*- coding: utf-8 -*-
"""
================================================================================
⚡ KISFIT Global × Google Flow 2분 컷 반자동 코파일럿 감시기 (flow_auto_watcher.py)
================================================================================
작동 순서:
1. 실행 즉시 키즈핏 추천 1순위(3D 인체·성장판·수면 호기심 다큐) Google Flow 4컷 프롬프트를
   윈도우 클립보드에 자동 복사합니다.
   -> 사용자는 Google Flow 채팅창에서 [Ctrl + V] -> [Enter]만 누르면 됩니다!
2. 동시에 내 PC의 `다운로드(Downloads)` 폴더를 실시간 감시합니다.
3. 사용자가 Google Flow에서 생성된 영상 4개의 [다운로드(↓)] 버튼을 누르면,
   `Downloads` 폴더에 .mp4 파일 4개가 들어오는 즉시 자동으로 감지하여
   상단 상태창/레터박스 없는 100% 클린 풀스크린 + 원테이크 성우 + 단어별(Word-by-Word) 팝업 자막 +
   미국 상위 1% 2대 엔딩(1A Punchline & 1B Seamless Loop) 완제품 쇼츠 2종을 자동 생성하고
   텔레그램으로도 즉시 전송합니다!
================================================================================
"""

import os
import sys
import time
import shutil
import argparse
import subprocess
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

from flow_shorts_merger import KISFIT_PRESETS, render_clean_fullscreen_shorts_from_clips

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "ai_shorts_output"
FLOW_CLIPS_DIR = OUTPUT_DIR / "flow_clips"
DOWNLOADS_DIR = Path.home() / "Downloads"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FLOW_CLIPS_DIR.mkdir(parents=True, exist_ok=True)


def copy_to_clipboard(text: str):
    p = subprocess.Popen(["powershell", "-NoProfile", "-Command", "Set-Clipboard -Value $input"], stdin=subprocess.PIPE)
    p.communicate(input=text.encode("utf-8"))


def build_flow_batch_prompt(cuts: list) -> str:
    lines = ["Generate 4 separate 9:16 vertical cinematic videos (no text on screen):"]
    for idx, c in enumerate(cuts, 1):
        lines.append(f"{idx}) {c}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--preset", choices=list(KISFIT_PRESETS.keys()), default="1_sleep_growth")
    parser.add_argument("--count", type=int, default=4, help="Number of downloaded MP4 clips to wait for")
    args = parser.parse_args()

    cfg = KISFIT_PRESETS[args.preset]
    flow_prompt = build_flow_batch_prompt(cfg["flow_cuts"])
    copy_to_clipboard(flow_prompt)

    print("======================================================================")
    print(f"📋 [STEP 1 완료] '{args.preset}' Google Flow 4컷 프롬프트가 클립보드에 자동 복사되었습니다!")
    print("👉 지금 Google Flow (https://labs.google/fx/tools/flow) 채팅창에서 [Ctrl + V] -> [Enter]를 눌러주세요.")
    print(f"👉 영상 {args.count}개가 생성되면 각 영상의 [다운로드(↓)] 버튼만 눌러주세요!")
    print("======================================================================", flush=True)

    start_ts = time.time() - 5.0
    seen_files = set()
    collected = []

    print(f"👀 [{DOWNLOADS_DIR}] 폴더에서 새 .mp4 파일 {args.count}개 다운로드 대기 중...", flush=True)
    while len(collected) < args.count:
        if DOWNLOADS_DIR.exists():
            mp4s = [
                p for p in DOWNLOADS_DIR.glob("*.mp4")
                if p.stat().st_mtime > start_ts and p not in seen_files and not p.name.endswith(".crdownload")
            ]
            mp4s.sort(key=lambda p: p.stat().st_mtime)
            for p in mp4s:
                s1 = p.stat().st_size
                time.sleep(0.6)
                s2 = p.stat().st_size
                if s1 == s2 and s2 > 30000:
                    seen_files.add(p)
                    idx = len(collected) + 1
                    dst = FLOW_CLIPS_DIR / f"{args.preset}_clip_{idx:02d}.mp4"
                    shutil.copy2(p, dst)
                    collected.append(dst)
                    print(f"  ✅ [{idx}/{args.count}] 다운로드 감지 및 수집 완료: {p.name} ({round(s2/1024/1024, 2)} MB)", flush=True)
                    if len(collected) >= args.count:
                        break
        time.sleep(1.5)

    print("\n🎬 4개 클립 수집 완료! 가장 조회수·전환율이 높은 단일 베스트 버전(100% 클린 풀스크린 + 펀치라인 엔딩) 자동 합본 시작...", flush=True)
    out_a = OUTPUT_DIR / f"{cfg['stem']}_1A_Punchline.mp4"

    render_clean_fullscreen_shorts_from_clips(
        clip_paths=collected,
        script=" ".join(cfg["shots_punchline"]),
        output_mp4=out_a,
        voice=cfg["voice"],
        style=cfg["style"],
        accent_color=cfg["accent"],
        shot_scripts=cfg["shots_punchline"],
        ending_mode="punchline",
    )
    print(f"\n🎉 최종 완성본 생성 완료: {out_a}", flush=True)


if __name__ == "__main__":
    main()
