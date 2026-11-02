# -*- coding: utf-8 -*-
"""
================================================================================
🚀 KISFIT Global 1화~5화 전편 Google Flow (1080p 20개 클립) 일괄 마스터링 엔진
================================================================================
사용자가 크롬 Downloads 폴더에 다운로드한 20개의 Google Flow 1080p 클립을
의미 기반 파일명 매칭으로 각 회차의 Cut 1 -> Cut 2 -> Cut 3 -> Cut 4 순서에
100% 정확히 배치하고, 1화~5화 전편(Punchline 엔딩 + Seamless Loop 엔딩 총 10편)을
일괄 렌더링 및 tiktok_insta_videos/ 동기화까지 수행합니다.
================================================================================
"""

import os
import sys
import shutil
import zipfile
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from flow_shorts_merger import (
    KISFIT_PRESETS,
    FLOW_CLIPS_DIR,
    OUTPUT_DIR,
    render_clean_fullscreen_shorts_from_clips,
)

DOWNLOADS_DIR = Path.home() / "Downloads"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
TIKTOK_DIR = PROJECT_ROOT / "tiktok_insta_videos"
TIKTOK_DIR.mkdir(parents=True, exist_ok=True)

# 각 프리셋별 Cut 1 ~ Cut 4에 매칭되는 Downloads 내 파일명 키워드
EPISODE_CLIP_MAPPING = {
    "1_sleep_growth": [
        "Child_blinking_in_dark_room",
        "Camera_orbits_translucent_human",
        "Camera_pushes_through_growth_plate",
        "Doctor_pointing_at_X-ray_scan",
    ],
    "2_sugar_bone": [
        "Chocolate_and_sugar_in_milk",
        "Insulin_molecules_surging_throug",
        "Insulin_signals_stopping_pituita",
        "Calcium_ions_bouncing_on_bone",
    ],
    "3_mouth_breathing": [
        "Amber_air_flowing_into_mouth",
        "Airflow_entering_head_side-profile",
        "Red_blood_cells_moving_through",
        "Nasal_airflow_illuminating_brain",
    ],
    "4_tech_neck": [
        "Child_looking_at_glowing_smartphone",
        "Spinal_vertebrae_squeezing_disc",
        "Spine_straightens_upward_with_de",
        "Child_standing_with_laser_lines",
    ],
    "5_brain_synapse": [
        "Child_fastening_wooden_button",
        "Nerve_impulses_shooting_to_brain",
        "Synaptic_bridges_forming_in_brain",
        "Human_brain_rotating_slowly",
    ],
}

# 매일 오전 6시 텔레그램 자동 발송용 대표 파일명 매핑
DAILY_6AM_FILENAMES = {
    "1_sleep_growth": "01_US_Shorts_Late_Bedtime_Height_Loss_30s.mp4",
    "2_sugar_bone": "02_US_Shorts_Bedtime_Sugar_Growth_Hormone_Stop_30s.mp4",
    "3_mouth_breathing": "03_US_Shorts_Mouth_Breathing_Face_And_Growth_30s.mp4",
    "4_tech_neck": "04_US_Shorts_Tech_Neck_Posture_Hidden_Height_30s.mp4",
    "5_brain_synapse": "05_US_Shorts_Age3_Fine_Motor_Brain_Window_30s.mp4",
}


def find_downloaded_clip(prefix: str) -> Path:
    candidates = [
        p for p in DOWNLOADS_DIR.glob("*.mp4")
        if prefix.lower() in p.name.lower()
    ]
    if not candidates:
        raise FileNotFoundError(f"Downloads 폴더에서 '{prefix}' 클립을 찾을 수 없습니다.")
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0]


def main():
    print("======================================================================")
    print("🚀 KISFIT Global 1화~5화 Google Flow 1080p 20컷 자동 매핑 및 마스터링 시작")
    print("======================================================================", flush=True)

    rendered_files = []

    for preset_key, prefixes in EPISODE_CLIP_MAPPING.items():
        cfg = KISFIT_PRESETS[preset_key]
        print(f"\n🎬 [{preset_key}] 4컷 Google Flow 1080p 클립 매핑 중...", flush=True)
        clip_paths = []
        for idx, pref in enumerate(prefixes, 1):
            src_p = find_downloaded_clip(pref)
            dst_p = FLOW_CLIPS_DIR / f"{preset_key}_clip_{idx:02d}.mp4"
            shutil.copy2(src_p, dst_p)
            clip_paths.append(str(dst_p))
            print(f"  ✓ Cut {idx}: {src_p.name} -> {dst_p.name} ({round(src_p.stat().st_size/1024)} KB)", flush=True)

        out_a = OUTPUT_DIR / f"{cfg['stem']}_1A_Punchline.mp4"

        if out_a.exists() and out_a.stat().st_size > 8000000:
            print(f"  ⏩ [{preset_key}] 이미 완료된 고화질 렌더링 파일 존재 ({round(out_a.stat().st_size/1024)} KB) — 스킵!", flush=True)
        else:
            render_clean_fullscreen_shorts_from_clips(
                clip_paths=clip_paths,
                script=" ".join(cfg["shots_punchline"]),
                output_mp4=out_a,
                voice=cfg["voice"],
                style=cfg["style"],
                accent_color=cfg["accent"],
                shot_scripts=cfg["shots_punchline"],
                ending_mode="punchline",
            )

        # 매일 6시 자동 발송 폴더(tiktok_insta_videos/)에도 최신 Google Flow 완성본으로 동기화
        daily_name = DAILY_6AM_FILENAMES.get(preset_key)
        if daily_name:
            daily_dst = TIKTOK_DIR / daily_name
            shutil.copy2(out_a, daily_dst)
            shutil.copy2(out_a, OUTPUT_DIR / daily_name)
            print(f"  ✓ [Daily 6AM Sync] {daily_dst.name} 업데이트 완료!", flush=True)

        rendered_files.append((preset_key, out_a))

    # ZIP 번들 패키지 업데이트
    zip_path = TIKTOK_DIR / "KISFIT_Global_TikTok_Instagram_Reels_5Videos_Pack.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for preset_key, daily_name in DAILY_6AM_FILENAMES.items():
            fp = TIKTOK_DIR / daily_name
            if fp.exists():
                zf.write(fp, arcname=daily_name)
        for _, out_a in rendered_files:
            if out_a.exists():
                zf.write(out_a, arcname=out_a.name)
    print(f"\n📦 [ZIP 패키지 업데이트 완료] {zip_path} ({round(zip_path.stat().st_size/1024)} KB)", flush=True)
    print("\n🎉 1화~5화 전편(단일 베스트 버전 총 5편) 렌더링 및 동기화 완료!", flush=True)


if __name__ == "__main__":
    main()
