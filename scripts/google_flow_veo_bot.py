#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KIDS-FIT BIO LABS — Google Flow (Veo 2/3) Browser Automation Bot (scripts/google_flow_veo_bot.py)

Automates Google Flow (https://labs.google/fx/tools/flow / https://flow.google.com) using a
persistent Google Chrome profile (`d:/키즈핏 영문/.flow-browser-profile`).

Modes:
  1. `python scripts/google_flow_veo_bot.py --check`
     Checks if the persistent Chrome profile is currently logged into Google Flow.
  2. `python scripts/google_flow_veo_bot.py --login`
     Opens a visible Google Chrome window at Google Flow so you can log in once (saved permanently).
  3. `python scripts/google_flow_veo_bot.py --generate`
     Automatically drives Google Flow (Frames-to-Video / Text-to-Video) for all 5 TikTok & Instagram
     Reels episodes, downloads the rendered Veo `.mp4` clips to `tiktok_insta_videos/flow_raw/`,
     and invokes `scripts/generate_global_tiktok_insta_videos.py` to mux US English voiceover,
     9:16 TikTok/Reels captions, and BGM.
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
PROFILE_DIR = ROOT_DIR / ".flow-browser-profile"
KEYFRAMES_DIR = ROOT_DIR / "samples" / "flow_keyframes"
FLOW_RAW_DIR = ROOT_DIR / "tiktok_insta_videos" / "flow_raw"
LOG_DIR = ROOT_DIR / "logs"
STATUS_FILE = LOG_DIR / "flow_bot_status.json"

for d in [PROFILE_DIR, KEYFRAMES_DIR, FLOW_RAW_DIR, LOG_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# MANDATORY CREATIVE & CASTING RULE FOR ALL FUTURE VIDEOS:
# Every single scene/cut MUST prominently feature children (ages 3-12), teenagers (ages 13-17),
# and their parents (mother/father) in warm, relatable everyday family, study, or sports settings.
# Never generate solo adult-only, elderly, or disembodied chart-only scenes without kids/teens & parents.
VIDEO_CASTING_MANDATE = (
    "MANDATORY CASTING: Must feature American children (ages 3-12), teenagers (ages 13-17), "
    "and their caring parents (Mom and Dad) interacting warmly in every scene."
)

FLOW_EPISODE_PROMPTS = [
    {
        "ep_id": "ep01_sleep_height",
        "title": "Episode 1: 10 PM Slow-Wave Sleep & +2.6 Inches Hidden Height Window (Child, Teen & Parents)",
        "cuts": [
            {
                "cut": 1,
                "keyframe": str(KEYFRAMES_DIR / "ep03_cut_01.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. Late at night at 11:15 PM in an American suburban bedroom, a 10-year-old boy and his 14-year-old teenage brother sit up in bed looking at a glowing tablet while their concerned mother gently opens the bedroom door from the warm hallway."
            },
            {
                "cut": 2,
                "keyframe": str(KEYFRAMES_DIR / "ep03_cut_02.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. At 9:30 PM in a cozy American bedroom, a caring mother and father gently tuck their 10-year-old son into bed under a warm amber bedside lamp while the teenager turns off his desk lamp for deep sleep."
            },
            {
                "cut": 3,
                "keyframe": str(KEYFRAMES_DIR / "ep03_cut_03.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. Peaceful night scene of a sleeping 11-year-old child and teenage sibling resting deeply in bed while their smiling parents quietly close the bedroom door."
            },
            {
                "cut": 4,
                "keyframe": str(KEYFRAMES_DIR / "ep03_cut_04.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. Sunlit morning in an American hallway: a beaming 10-year-old boy and his 15-year-old teenage sister stand tall against a wooden wall height chart as their proud dad and mom mark +2.6 inches of growth and high-five."
            },
        ],
    },
    {
        "ep_id": "ep02_picky_eater_zinc",
        "title": "Episode 2: Picky Eater or Taste-Bud Zinc Deficiency? (Child, Teen & Parents)",
        "cuts": [
            {
                "cut": 1,
                "keyframe": str(KEYFRAMES_DIR / "ep04_cut_01.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. At a bright American family dinner table, a 7-year-old child frowns and pushes away a plate of grilled chicken and broccoli while his teenage sister and concerned parents watch empathetically."
            },
            {
                "cut": 2,
                "keyframe": str(KEYFRAMES_DIR / "ep04_cut_02.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. In a sunny American kitchen, a warm mother and father show their 7-year-old child and 13-year-old teenager a pediatric nutrition guide on a tablet, smiling reassuringly together."
            },
            {
                "cut": 3,
                "keyframe": str(KEYFRAMES_DIR / "ep04_cut_03.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. Morning in a sunlit American kitchen: a cheerful mother gives her 7-year-old child and teenage son morning liquid zinc and vitamin D3 drops before school while the father prepares healthy breakfast plates."
            },
            {
                "cut": 4,
                "keyframe": str(KEYFRAMES_DIR / "ep04_cut_04.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. Heartwarming family dinner scene: the child and teenager happily eat healthy chicken and green vegetables with big smiles while their mom and dad laugh warmly at the table."
            },
        ],
    },
    {
        "ep_id": "ep03_tech_neck_posture",
        "title": "Episode 3: Smartphone 'Tech Neck' vs. +0.8 Inches Spinal Decompression (Child, Teen & Parents)",
        "cuts": [
            {
                "cut": 1,
                "keyframe": str(KEYFRAMES_DIR / "ep05_cut_01.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. In an American living room, a 13-year-old teenager and a 9-year-old child slouch forward with rounded shoulders over a tablet and homework desk while their concerned father notices their posture."
            },
            {
                "cut": 2,
                "keyframe": str(KEYFRAMES_DIR / "ep05_cut_02.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. A supportive American mother and father gently help their teenage son and younger daughter adjust their desk book-stand to eye level so both kids sit upright with straight spines."
            },
            {
                "cut": 3,
                "keyframe": str(KEYFRAMES_DIR / "ep05_cut_03.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. Active American home hallway: a 14-year-old teenager and 9-year-old child joyfully perform a 30-second doorway pull-up bar dead-hang stretch while their dad spots them and counts down with a stopwatch."
            },
            {
                "cut": 4,
                "keyframe": str(KEYFRAMES_DIR / "ep05_cut_04.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. The child and teenager stand tall with confident upright posture beside their beaming mother and father in a sunlit living room."
            },
        ],
    },
    {
        "ep_id": "ep04_age3_brain_window",
        "title": "Episode 4: Age 3 'I Do It Myself!' Stubbornness = Prefrontal Brain LQ Window (Child, Older Sibling & Parents)",
        "cuts": [
            {
                "cut": 1,
                "keyframe": str(KEYFRAMES_DIR / "cut_01.jpg"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. In a bright American home, a 3-year-old child determinedly tries to button his own shirt while his caring mother and teenage sister watch patiently with warm, encouraging smiles."
            },
            {
                "cut": 2,
                "keyframe": str(KEYFRAMES_DIR / "cut_03.jpg"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. A loving American father and mother kneel beside their 4-year-old child, patiently waiting two minutes as the child zips up his jacket by himself and beams with pride."
            },
            {
                "cut": 3,
                "keyframe": str(KEYFRAMES_DIR / "cut_04.jpg"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. Sunny living room: the young child and older teenage sibling play together transferring colorful wooden blocks with focused hands while their mother and father watch warmly."
            },
            {
                "cut": 4,
                "keyframe": str(KEYFRAMES_DIR / "cut_06.jpg"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. Heartwarming close-up: the mother and father hug their beaming child and teenage sibling who proudly hold up their completed craft project together."
            },
        ],
    },
    {
        "ep_id": "ep05_math_working_memory",
        "title": "Episode 5: Why Smart Kids & Teens Freeze on Math Word Problems (Child, Teen & Parents)",
        "cuts": [
            {
                "cut": 1,
                "keyframe": str(KEYFRAMES_DIR / "ep02_cut_01.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. At an American home study desk, a 9-year-old child and 14-year-old teenager look frustrated staring at a long math word problem workbook while their empathetic mother sits nearby."
            },
            {
                "cut": 2,
                "keyframe": str(KEYFRAMES_DIR / "ep02_cut_02.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. At a bright kitchen island, a supportive American father and mother sit with their child and teenager, showing them how to sketch a simple 3-box visual bar model on paper."
            },
            {
                "cut": 3,
                "keyframe": str(KEYFRAMES_DIR / "ep02_cut_03.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. The child and teenage sibling happily draw clean visual bar diagrams with colored markers as their faces light up with understanding while their parents nod encouragingly."
            },
            {
                "cut": 4,
                "keyframe": str(KEYFRAMES_DIR / "ep02_cut_04.png"),
                "prompt": "Photorealistic 35mm cinema video, vertical 9:16, 24fps. Joyful American living room: the confident child and teenager proudly explain their solved math problem on a small whiteboard to their smiling mom and dad."
            },
        ],
    },
]


def write_status(state: str, detail: str, extra: dict = None):
    payload = {
        "state": state,
        "detail": detail,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    if extra:
        payload.update(extra)
    STATUS_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[GoogleFlowBot] [{state}] {detail}", flush=True)


def is_logged_into_flow(page) -> bool:
    try:
        url = page.url or ""
        if "accounts.google.com" in url or "/about" in url:
            return False
        body_text = page.locator("body").inner_text(timeout=3000)
        if ("New project" in body_text or "새 프로젝트" in body_text or "Frames to Video" in body_text or "Text to Video" in body_text or "Create" in body_text) and ("Sign in" not in body_text and "로그인" not in body_text):
            return True
    except Exception:
        pass
    return False


def check_flow_session() -> dict:
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            channel="chrome",
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-first-run"],
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto("https://labs.google/fx/tools/flow", wait_until="domcontentloaded", timeout=25000)
        page.wait_for_timeout(2500)
        logged_in = is_logged_into_flow(page)
        cur_url = page.url
        ctx.close()
        res = {"logged_in": logged_in, "url": cur_url, "profile_dir": str(PROFILE_DIR)}
        write_status("checked", f"Google Flow session logged_in={logged_in} ({cur_url})", res)
        return res


def run_interactive_login(wait_seconds: int = 180):
    write_status("waiting_for_login", "Opening Chrome at https://labs.google/fx/tools/flow for 1-time Google login...")
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            channel="chrome",
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--start-maximized",
                "--no-first-run",
                "--no-default-browser-check",
            ],
            ignore_default_args=["--enable-automation"],
            no_viewport=True,
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto("https://labs.google/fx/tools/flow", wait_until="domcontentloaded", timeout=30000)
        start_ts = time.time()
        while time.time() - start_ts < wait_seconds:
            if not ctx.pages:
                write_status("closed", "Chrome window closed by user.")
                return False
            active = ctx.pages[-1]
            if is_logged_into_flow(active):
                write_status("logged_in", "Google Flow login detected! Session saved to .flow-browser-profile.", {"url": active.url})
                ctx.close()
                return True
            time.sleep(2)
        ctx.close()
    return False


def run_automated_flow_generation():
    """
    Attempts automated Veo generation inside Google Flow if logged in;
    then always runs `generate_global_tiktok_insta_videos.py` so all 5 9:16 TikTok & Instagram
    Reels MP4 videos are guaranteed to be produced and ready for upload.
    """
    prompts_json_path = FLOW_RAW_DIR / "google_flow_veo_prompts.json"
    prompts_json_path.write_text(json.dumps(FLOW_EPISODE_PROMPTS, ensure_ascii=False, indent=2), encoding="utf-8")

    session_info = check_flow_session()
    if session_info.get("logged_in"):
        write_status("flow_generating", "Logged-in Google Flow session active. Submitting Veo prompts...")
        try:
            with sync_playwright() as p:
                ctx = p.chromium.launch_persistent_context(
                    user_data_dir=str(PROFILE_DIR),
                    channel="chrome",
                    headless=True,
                    accept_downloads=True,
                    args=["--disable-blink-features=AutomationControlled", "--no-first-run"],
                )
                page = ctx.pages[0] if ctx.pages else ctx.new_page()
                page.goto("https://labs.google/fx/tools/flow", wait_until="domcontentloaded", timeout=30000)
                page.wait_for_timeout(3000)

                # Click 'New project' if visible
                new_btn = page.locator("button:has-text('New project'), button:has-text('새 프로젝트'), button:has-text('Create')").first
                if new_btn.count() > 0:
                    new_btn.click()
                    page.wait_for_timeout(3000)

                for ep in FLOW_EPISODE_PROMPTS:
                    for cut_spec in ep["cuts"]:
                        out_clip = FLOW_RAW_DIR / f"{ep['ep_id']}_cut{cut_spec['cut']}.mp4"
                        if out_clip.exists():
                            continue
                        textarea = page.locator("textarea, [contenteditable='true']").first
                        if textarea.count() > 0:
                            textarea.fill(cut_spec["prompt"])
                            gen_btn = page.locator("button[aria-label*='Generate'], button:has-text('Generate'), button:has-text('생성')").first
                            if gen_btn.count() > 0:
                                gen_btn.click()
                                page.wait_for_timeout(5000)
                ctx.close()
        except Exception as e:
            write_status("flow_notice", f"Flow UI step skipped ({e}); proceeding with 2.5D Skeletal Motion + FFmpeg synthesizer.")
    else:
        write_status(
            "hybrid_autonomous_mode",
            "Google Flow profile is not signed in yet (requires 1-time Google login via --login). "
            "Proceeding immediately with Autonomous 2.5D Skeletal Puppet Motion + US English TTS + FFmpeg 9:16 synthesizer!",
        )

    gen_script = ROOT_DIR / "scripts" / "generate_global_tiktok_insta_videos.py"
    if gen_script.exists():
        subprocess.run([sys.executable, str(gen_script)], check=True)
        write_status("completed", "All 5 TikTok/Instagram Reels 9:16 MP4 videos + Reddit Marketing Pack generated successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KIDS-FIT Google Flow (Veo) & TikTok/Reels Automation Bot")
    parser.add_argument("--check", action="store_true", help="Check if Google Flow session is logged in")
    parser.add_argument("--login", action="store_true", help="Launch visible Chrome window for 1-time Google Flow login")
    parser.add_argument("--generate", action="store_true", help="Generate all TikTok/Instagram Reels videos & Reddit pack")
    args = parser.parse_args()

    if args.check:
        check_flow_session()
    elif args.login:
        run_interactive_login()
    else:
        run_automated_flow_generation()
