# -*- coding: utf-8 -*-
"""
================================================================================
🚀 KISFIT Global 6화~10화 Google Flow (1080p MP4 비디오 클립) 일괄 마스터링 엔진 (단일 베스트 버전)
================================================================================
사용자가 크롬 Downloads 폴더에 다시 다운로드한 Google Flow 1080p .mp4 비디오 클립들을
의미 기반 파일명 매칭으로 각 회차의 Cut 1 -> Cut 2 -> Cut 3 -> Cut 4 순서에
100% 정확히 배치하고, 단일 베스트 버전(1A_Punchline.mp4)으로 전체 재렌더링합니다.
================================================================================
"""

import os
import sys
import shutil
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

EPISODE_6_TO_10_MAPPING = {
    "6_zinc_taste": [
        ["Fork_touching_steak_and_broccoli"],
        ["Metallic_particles_blocking_tast", "Particles_block_human_tongue"],
        ["Hormone_streams_reaching_leg_bones"],
        ["Zinc_ions_bind_to_receptors", "Zinc_ions_binding_to_cellular"],
    ],
    "7_vitamin_k2_calcium": [
        ["Milk_pouring_into_crystal_glass", "Milk_pouring_into_glass"],
        ["Calcium_spheres_drifting_in_bloo", "Calcium_spheres_drifting_in_vessel"],
        ["Molecules_grabbing_calcium_spheres", "7_vitamin_k2_calcium_clip_03"],
        ["Human_leg_bone_strengthening"],
    ],
    "8_morning_sun_melatonin": [
        ["Human_iris_contracting_in_light", "Human_eye_iris_contracts"],
        ["Light_traveling_along_optic_nerve"],
        ["Serotonin_molecules_transform_in"],
        ["Brain_releasing_growth_hormone_w"],
    ],
    "9_jump_piezoelectric": [
        ["Athletic_sneakers_jumping_on_court", "Sneakers_jumping_on_outdoor_court"],
        ["Human_leg_landing_from_jump", "Human_leg_absorbing_jump_shockwave"],
        ["Osteoblast_cells_awakening_insid", "Sparks_flash_across_bone_cells"],
        ["Knee_growth_plate_expanding_vert"],
    ],
    "10_working_memory_math": [
        ["Human_head_experiencing_cognitiv", "Brain_experiences_cognitive_over"],
        ["Spheres_sparking_red_neural_circuit", "Spheres_entering_neural_circuit"],
        ["Fountain_pen_draws_diagram", "Fountain_pen_drawing_bar_diagram"],
        ["Brain_transitioning_to_neural_waves", "Human_brain_neural_waves_transition"],
    ],
}

DAILY_6AM_FILENAMES_6_TO_10 = {
    "6_zinc_taste": "06_US_Shorts_Picky_Eater_Zinc_IGF1_Growth_30s.mp4",
    "7_vitamin_k2_calcium": "07_US_Shorts_Vitamin_K2_Osteocalcin_Bone_Matrix_30s.mp4",
    "8_morning_sun_melatonin": "08_US_Shorts_Morning_Sun_10PM_Growth_Hormone_30s.mp4",
    "9_jump_piezoelectric": "09_US_Shorts_Jumping_Piezoelectric_Bone_Growth_30s.mp4",
    "10_working_memory_math": "10_US_Shorts_Working_Memory_Math_Word_Problem_30s.mp4",
}


def find_downloaded_asset(prefixes: list) -> Path:
    # 1순위: Downloads 폴더의 .mp4 비디오 파일
    for pref in prefixes:
        mp4_cands = [
            p for p in DOWNLOADS_DIR.iterdir()
            if p.is_file()
            and p.suffix.lower() == ".mp4"
            and pref.lower() in p.name.lower()
        ]
        if mp4_cands:
            mp4_cands.sort(key=lambda p: p.stat().st_mtime, reverse=True)
            return mp4_cands[0]

    # 2순위: FLOW_CLIPS_DIR에 이미 백업된 .mp4 파일
    for pref in prefixes:
        backup_mp4 = [
            p for p in FLOW_CLIPS_DIR.iterdir()
            if p.is_file()
            and p.suffix.lower() == ".mp4"
            and pref.lower() in p.name.lower()
        ]
        if backup_mp4:
            backup_mp4.sort(key=lambda p: p.stat().st_mtime, reverse=True)
            return backup_mp4[0]

    # 3순위: FLOW_CLIPS_DIR 백업 에셋
    for pref in prefixes:
        backup_any = [
            p for p in FLOW_CLIPS_DIR.iterdir()
            if p.is_file() and pref.lower() in p.name.lower()
        ]
        if backup_any:
            backup_any.sort(key=lambda p: p.stat().st_mtime, reverse=True)
            return backup_any[0]

    raise FileNotFoundError(f"Downloads 또는 백업 폴더에서 '{prefixes}' 클립을 찾을 수 없습니다.")


def main():
    print("======================================================================")
    print("🚀 KISFIT Global 6화~10화 Google Flow 1080p MP4 비디오 재마스터링 시작")
    print("======================================================================", flush=True)

    rendered_files = []

    for preset_key, cut_prefix_lists in EPISODE_6_TO_10_MAPPING.items():
        cfg = KISFIT_PRESETS[preset_key]
        print(f"\n🎬 [{preset_key}] 4컷 Google Flow 1080p 비디오 클립 매핑 중...", flush=True)
        clip_paths = []
        for idx, prefixes in enumerate(cut_prefix_lists, 1):
            src_p = find_downloaded_asset(prefixes)
            ext = src_p.suffix.lower()
            dst_p = FLOW_CLIPS_DIR / f"{preset_key}_clip_{idx:02d}{ext}"
            if src_p.resolve() != dst_p.resolve():
                shutil.copy2(src_p, dst_p)
            clip_paths.append(str(dst_p))
            print(f"  ✓ Cut {idx}: {src_p.name} -> {dst_p.name} ({round(src_p.stat().st_size/1024)} KB)", flush=True)

        out_a = OUTPUT_DIR / f"{cfg['stem']}_1A_Punchline.mp4"

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

        daily_name = DAILY_6AM_FILENAMES_6_TO_10[preset_key]
        shutil.copy2(out_a, TIKTOK_DIR / daily_name)
        shutil.copy2(out_a, TIKTOK_DIR / out_a.name)
        rendered_files.append(out_a)

    print("\n======================================================================")
    print(f"🎉 6화~10화 총 {len(rendered_files)}편 1080p MP4 비디오 버전 마스터링 완료!")
    for rf in rendered_files:
        print(f"  - {rf.name} ({round(rf.stat().st_size/1024)} KB)")
    print("======================================================================", flush=True)


if __name__ == "__main__":
    main()
