# -*- coding: utf-8 -*-
"""
================================================================================
🎬 KISFIT Global × Google Flow (Veo) 3D 인체·성장판·뇌과학 쇼츠 마스터링 엔진 (V2)
================================================================================
- 상단 인위적인 상태창(HUD) 및 한국식 레터박스 100% 제거, 1080x1920 풀스크린 모션 비디오
- 단순 N등분이 아닌 '대사 문장 시작 타이밍(WordBoundary 호흡 구간)'에 0.01초 단위로 칼같이 맞춘 컷 전환
- 미국 상위 1% 쇼츠(Zack D. Films / Vox 스타일)의 2대 엔딩 공식 동시 지원:
  1) punchline: 묵직한 한 줄 결론(Takeaway + KisFitGlobal.com) + 시네마틱 서브베이스 드롭(Outro Boom) + 여운 페이드아웃
  2) loop: 끝문장이 0초의 첫 문장으로 자연스럽게 이어지는 무한 루프(Seamless Loop) 편집
================================================================================
"""

import os
import sys
import re
import json
import wave
import shutil
import asyncio
import argparse
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance
import edge_tts
import edge_tts.communicate as _edge_comm
import imageio_ffmpeg

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
try:
    _edge_comm._SSL_CTX.load_default_certs()
except Exception:
    pass

from us_viral_studio import (
    WIDTH,
    HEIGHT,
    FPS,
    load_font,
    FONT_SEGOE_BOLD,
    synthesize_natural_voice_with_words,
    group_words_into_phrases,
    build_studio_soundtrack,
    draw_active_word_captions,
    export_srt,
)
from us_real_motion_studio import load_video_clip_frames, iter_video_clip_frames

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "ai_shorts_output"
FLOW_CLIPS_DIR = OUTPUT_DIR / "flow_clips"
TEMP_DIR = OUTPUT_DIR / "temp_flow"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FLOW_CLIPS_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# @kidsfit01 한국 소아성장 × 커머스 유튜브·네이버클립 업로드 표준 설정 (09:30 KST 등원 직후 골든타임)
KIDSFIT_KR_YOUTUBE_UPLOAD_DEFAULTS = {
    "channel_handle": "@kidsfit01",
    "publishAt_kst": "09:30",
    "publishAt_alt_kst": "21:30",
    "categoryId": "27",  # Education
    "selfDeclaredMadeForKids": False,
    "defaultLanguage": "ko",
    "defaultAudioLanguage": "ko",
    "deprecated_duplicate_video_ids": ["AR7DkkXCRo0"],
    "fake_ai_product_photo_ban": True,  # 스와들업·핀덴베베·차일드라이프 등 어설픈 가짜 AI 육아용품 실사 영구 금지
    "format_mix": {
        "kr_3d_growth_neuro_cgi": 0.80,
        "clean_1to1_chart_card": 0.20,
    },
    "core_tags": [
        "키성장",
        "성조숙증",
        "우리아이예상키",
        "구강호흡",
        "성장판자극",
        "육아꿀팁",
        "키즈핏",
    ],
    "standard_yt_cta": "📏 부모 키 유전 한계를 넘는 우리 아이 최종 예상키 & 성조숙증 신호등 1분 무료 진단 👉 프로필 상단 [kidsfit.co.kr] 클릭!",
    "naver_clip_creator_shop_url": "https://cshop.naver.com/paradiseshop",
}


def compute_next_kidsfit_kr_publish_at_iso(now_utc: datetime = None) -> str:
    """다음 09:30 KST 한국 육아맘 등원 직후 골든타임 발행 시각을 ISO-8601로 반환합니다."""
    kst = timezone(timedelta(hours=9))
    base = (now_utc or datetime.now(timezone.utc)).astimezone(kst)
    candidate = base.replace(hour=9, minute=30, second=0, microsecond=0)
    if candidate <= base:
        candidate += timedelta(days=1)
    return candidate.isoformat()

KISFIT_PRESETS = {
    "1_sleep_growth": {
        "stem": "US_KISFIT_01_GrowthPlate_SleepLock",
        "hook_title": "SLEEPING AFTER 10 PM LOCKS GROWTH PLATES",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "If your child goes to sleep after ten P M tonight, their growth plates literally lock shut.",
            "Between ten P M and two A M, a child's brain releases up to seventy percent of its daily human growth hormone during deep sleep.",
            "When late-night blue light hits the eyes, stress hormones spike and stop soft bone-building cells inside the knee growth plates from multiplying.",
            "Dim bedroom lights by nine P M tonight. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "If your child goes to sleep after ten P M tonight, their growth plates literally lock shut.",
            "Between ten P M and two A M, a child's brain releases up to seventy percent of its daily human growth hormone during deep sleep.",
            "When late-night blue light hits the eyes, stress hormones spike and stop soft bone-building cells inside the knee growth plates from multiplying.",
            "Missing that deep sleep window for just one year can cost two full inches of adult height. So put the tablet away tonight, because that is what happens",
        ],
        "flow_cuts": [
            "Extreme macro 9:16 vertical cinematic shot: A 9-year-old American child's tired eye slowly blinks in a dark bedroom at 11 PM as bright blue tablet light flickers across the pupil, relatable bedtime symptom close-up, 85mm macro lens, photorealistic, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Camera zooms into translucent glass-like head anatomy while glowing cyan growth hormone pulses dim and turn amber as blue light hits the optic nerve, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass knee joint CGI with cyan and gold bioluminescence as soft bone-building cells inside the growth plate pause under red stress signals, clean smooth medical surfaces, no text on screen.",
            "Clean clinical 9:16 vertical shot: Warm amber nightlight bedroom transition into a sleek dark-mode 60-second US CDC child growth scan card preview, no text on screen.",
        ],
    },
    "2_sugar_bone": {
        "stem": "US_KISFIT_02_BedtimeSugar_InsulinBlock",
        "hook_title": "1 BEDTIME DRINK STOPS GROWTH FOR 4 HOURS",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "One glass of sweet milk or juice before bed can shut down your child's overnight bone growth for four straight hours.",
            "The moment sugar enters the bloodstream at night, the body floods the blood with insulin.",
            "Inside the brain, high insulin acts like an emergency brake and blocks nighttime growth hormone release.",
            "Swap sweet bedtime snacks for plain water two hours before sleep. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "One glass of sweet milk or juice before bed can shut down your child's overnight bone growth for four straight hours.",
            "The moment sugar enters the bloodstream at night, the body floods the blood with insulin.",
            "Inside the brain, high insulin acts like an emergency brake and blocks nighttime growth hormone release.",
            "Even one sweet snack at nine P M can erase that night's growth surge, because that is why",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot in a warm kitchen at night: A child reaches for a glass of chocolate milk before bedtime, relatable evening habit, 85mm lens, photorealistic, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass bloodstream CGI with glowing gold insulin waves surging rapidly through clean luminous vessels, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass brain anatomy showing amber insulin signals pausing the glowing cyan growth hormone center, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass knee growth plate lighting back up in cyan and gold when blood sugar stays calm at night, no text on screen.",
        ],
    },
    "3_mouth_breathing": {
        "stem": "US_KISFIT_03_MouthBreathing_Craniofacial",
        "hook_title": "OPEN-MOUTH SLEEP RESHAPES FACE & HEIGHT",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "If your child sleeps with their mouth open at night, it is quietly reshaping their face and shrinking their growth.",
            "When a child breathes through their mouth instead of their nose, the tongue drops from the roof of the mouth and the upper jaw narrows.",
            "Even worse, mouth breathing drops nighttime oxygen levels, waking the brain out of deep growth hormone sleep.",
            "Check bedroom humidity and clear nasal airways tonight. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "If your child sleeps with their mouth open at night, it is quietly reshaping their face and shrinking their growth.",
            "When a child breathes through their mouth instead of their nose, the tongue drops from the roof of the mouth and the upper jaw narrows.",
            "Even worse, mouth breathing drops nighttime oxygen levels, waking the brain out of deep growth hormone sleep.",
            "Watch how your child breathes on the pillow tonight, because that is what happens",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: An 8-year-old child sleeping on a soft pillow at night with their mouth slightly open and dry lips, relatable parent observation, warm moonlight, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Smooth zoom-in into translucent glass side-profile head anatomy showing amber mouth airflow as the tongue drops and upper jaw narrows, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass brain and airway CGI showing dim oxygen waves interrupting cyan deep-sleep growth hormone pulses, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Smooth cyan nasal breathing illuminating the sinuses and firing bright gold growth hormone waves in deep sleep, no text on screen.",
        ],
    },
    "4_tech_neck": {
        "stem": "US_KISFIT_04_TechNeck_SpinalCompression",
        "hook_title": "TECH NECK TRAPS +2 INCHES OF HEIGHT",
        "voice": "en-US-BrianMultilingualNeural",
        "style": "science",
        "accent": (255, 214, 60, 255),
        "shots_punchline": [
            "Your child might already have two hidden inches of height trapped inside a compressed spine.",
            "Tilting the head forward sixty degrees to look at a phone puts sixty pounds of heavy pressure on a growing neck.",
            "Over time, soft spinal cushions flatten and rounded upper-back posture locks in before the growth plates close.",
            "Try two minutes of flat wall posture tonight. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Your child might already have two hidden inches of height trapped inside a compressed spine.",
            "Tilting the head forward sixty degrees to look at a phone puts sixty pounds of heavy pressure on a growing neck.",
            "Over time, soft spinal cushions flatten and rounded upper-back posture locks in before the growth plates close.",
            "Fixing that posture tonight is the fastest way to unlock their true stature, because right now",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: A 10-year-old child slouching on a couch with head tilted 60 degrees down at a glowing phone, relatable posture habit, 85mm lens, photorealistic, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Camera zooms into translucent glass neck and spine anatomy glowing amber under 60 pounds of downward tilt load, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass spine smoothly straightening upward as cyan and gold decompression waves restore full disc height, no text on screen.",
            "3D medical biomechanics animation, 9:16 vertical: Clean cyan alignment grid across a glowing upright 3D skeletal posture silhouette, no text on screen.",
        ],
    },
    "5_brain_synapse": {
        "stem": "US_KISFIT_05_Fingertip_PrefrontalBrain",
        "hook_title": "TINY HANDS WIRE FUTURE IQ CIRCUITS",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "When your three-year-old yells I do it myself, their brain is literally wiring its future I Q through their fingertips.",
            "Nearly thirty percent of the brain's movement control center is wired directly to the nerves in the hands and thumb.",
            "Every time a child struggles to button a shirt or pour water, fast electrical signals shoot straight into the front focus center of the brain.",
            "Give them two extra minutes of hands-on patience tonight. Predict your child's adult height and growth window in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "When your three-year-old yells I do it myself, their brain is literally wiring its future I Q through their fingertips.",
            "Nearly thirty percent of the brain's movement control center is wired directly to the nerves in the hands and thumb.",
            "Every time a child struggles to button a shirt or pour water, fast electrical signals shoot straight into the front focus center of the brain.",
            "So give them two extra minutes of patience today, because that is what happens",
        ],
        "flow_cuts": [
            "Extreme macro 9:16 vertical cinematic shot: Small child hands carefully fastening a wooden coat button in warm sunlight, shallow depth of field, 85mm macro lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass hand and arm CGI showing cyan bio-electrical signals racing from the fingertips into the brain, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass frontal brain lighting up with clean golden neural bridges connecting in smooth harmony, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Illuminated translucent 3D brain glowing in synchronized cyan and gold balance, no text on screen.",
        ],
    },
    "6_zinc_taste": {
        "stem": "US_KISFIT_06_PickyEater_Zinc_IGF1",
        "hook_title": "WHY PICKY EATERS TASTE METAL IN MEAT",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "When a picky eater spits out meat and green vegetables, their tongue may actually be tasting metal.",
            "A child's taste buds renew every ten days using a natural zinc-powered taste renewal enzyme.",
            "When zinc runs low, protein foods taste bitter and metallic, while the liver slows down I G F one bone growth signals.",
            "Pair zinc-rich eggs or seeds with dinner tonight. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "When a picky eater spits out meat and green vegetables, their tongue may actually be tasting metal.",
            "A child's taste buds renew every ten days using a natural zinc-powered taste renewal enzyme.",
            "When zinc runs low, protein foods taste bitter and metallic, while the liver slows down I G F one bone growth signals.",
            "So stop fighting at the dinner table tonight, because that is why",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: A 7-year-old child pushing away a plate of steak and broccoli at the dinner table with a scrunched expression, relatable mealtime behavior, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Smooth clean translucent 3D tongue surface light map dimming from bright cyan to cool silver-blue as zinc signals drop, zero porous holes, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass torso showing liver I G F-1 growth streams slowing down on their way to the knee growth plates, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Golden zinc light waves reactivating bright cyan bone-growth signaling along the leg bones, no text on screen.",
        ],
    },
    "7_vitamin_k2_calcium": {
        "stem": "US_KISFIT_07_VitaminK2_Osteocalcin_Bone",
        "hook_title": "MILK WITHOUT K2 LEAVES BONES STARVING",
        "voice": "en-US-BrianMultilingualNeural",
        "style": "science",
        "accent": (255, 214, 60, 255),
        "shots_punchline": [
            "Drinking gallons of calcium milk without one key vitamin can still leave growing bones starving.",
            "Vitamin D three pulls calcium into the blood, but it cannot tell that calcium where to go.",
            "Without vitamin K two, your body's calcium-locking bone protein stays asleep, leaving calcium floating instead of building the growth plates.",
            "Pair D three with K two at dinner tonight. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Drinking gallons of calcium milk without one key vitamin can still leave growing bones starving.",
            "Vitamin D three pulls calcium into the blood, but it cannot tell that calcium where to go.",
            "Without vitamin K two, your body's calcium-locking bone protein stays asleep, leaving calcium floating instead of building the growth plates.",
            "Always pair calcium and D three with vitamin K two, because without it",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: A child drinking a tall glass of white milk at the kitchen counter, relatable daily parenting scene, 85mm lens, photorealistic, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass vessel CGI with glowing white calcium spheres drifting past bone tissue without locking in, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Bright gold vitamin K2 light waves switching on cyan bone-builder guides that lock calcium into the growth plate, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass leg bone glowing bright cyan and gold as strong new bone matrix builds upward, no text on screen.",
        ],
    },
    "8_morning_sun_melatonin": {
        "stem": "US_KISFIT_08_MorningSun_CircadianGH",
        "hook_title": "10 PM GROWTH SURGE STARTS AT 8 AM",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "Your child's ten P M growth hormone surge actually starts at eight A M in the morning.",
            "When natural morning sunlight reaches the eyes, it starts a fourteen-hour sleep countdown inside the brain's master clock.",
            "That morning daylight builds daytime calm signals that turn into deep-sleep melatonin fourteen hours later after dark.",
            "Get ten minutes of outdoor morning sun before school. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Your child's ten P M growth hormone surge actually starts at eight A M in the morning.",
            "When natural morning sunlight reaches the eyes, it starts a fourteen-hour sleep countdown inside the brain's master clock.",
            "That morning daylight builds daytime calm signals that turn into deep-sleep melatonin fourteen hours later after dark.",
            "Step outside into the sunlight for ten minutes tomorrow morning, because that is why",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: A child stepping outside into warm golden 8 AM morning sunlight before school, blinking gently, 85mm lens, photorealistic, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass head anatomy showing a golden light beam setting a glowing cyan 14-hour master clock in the brain, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Golden daylight waves smoothly transforming into calm indigo-cyan nighttime sleep waves inside translucent brain CGI, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent sleeping child silhouette releasing rhythmic cyan and gold growth hormone waves at 10 PM, no text on screen.",
        ],
    },
    "9_jump_piezoelectric": {
        "stem": "US_KISFIT_09_Jumping_Piezoelectric_Bone",
        "hook_title": "JUMPING SPARKS BONE GROWTH SIGNALS",
        "voice": "en-US-BrianMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "Growing bones have a built-in signal booster that only switches on when your child jumps.",
            "Every time gentle vertical bounce hits the heel and knee, bone fibers flex and create tiny bio-electric sparks.",
            "Those micro-signals call bone-building cells straight to the knee growth plate, thickening soft growth tissue.",
            "Add ten minutes of skipping rope before dinner. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Growing bones have a built-in signal booster that only switches on when your child jumps.",
            "Every time gentle vertical bounce hits the heel and knee, bone fibers flex and create tiny bio-electric sparks.",
            "Those micro-signals call bone-building cells straight to the knee growth plate, thickening soft growth tissue.",
            "Just fifteen minutes of jumping rope wakes up dormant bone growth, because inside the body",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical slow-motion close-up shot: A child's sneakers jumping rope rhythmically on a sunlit driveway at golden hour, relatable active play, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass leg and knee joint landing smoothly as a cyan bio-electric wave travels up the shinbone, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Clean glowing cyan and gold sparks awakening bone-building cells along a smooth translucent growth plate, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent knee growth plate expanding upward with luminous cyan and gold bone growth layers, no text on screen.",
        ],
    },
    "10_working_memory_math": {
        "stem": "US_KISFIT_10_WorkingMemory_MathOverload",
        "hook_title": "WHY SMART KIDS FREEZE ON WORD PROBLEMS",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (255, 214, 60, 255),
        "shots_punchline": [
            "Why do smart kids solve number equations fast, but freeze on math word problems?",
            "Inside the front focus center of the brain, working memory can only hold three to four clues at the exact same time.",
            "Reading four long sentences while calculating in your head overloads that memory buffer and erases the first clue.",
            "Sketching a quick bar diagram frees up seventy percent of brain strain. Predict your child's growth and brain L Q score in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Why do smart kids solve number equations fast, but freeze on math word problems?",
            "Inside the front focus center of the brain, working memory can only hold three to four clues at the exact same time.",
            "Reading four long sentences while calculating in your head overloads that memory buffer and erases the first clue.",
            "Sketching a quick bar model frees up focus immediately, and that explains",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: A 9-year-old child sitting at a homework desk staring blankly at a long math worksheet while tapping a pencil, relatable study frustration, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass head CGI showing four glowing cyan memory spheres inside a clean frontal focus circuit, no text on screen.",
            "Cinematic 9:16 vertical macro shot: A child's hand drawing a simple bar diagram on crisp white paper under warm desk light, shallow depth of field, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass brain glowing with calm synchronized cyan and gold focus waves, no text on screen.",
        ],
    },
    "11_khamis_roche_parent_height": {
        "stem": "US_KISFIT_11_GeneticHeightMyth_KhamisRoche",
        "hook_title": "SHORT PARENTS? +4 INCHES HIDDEN WINDOW",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "Even if both parents are short, a child can still grow up to four inches taller than their family average.",
            "Genetics shape about seventy-five percent of adult height, while the remaining twenty-five percent comes from daily habits inside the growth plates.",
            "When deep sleep, protein, and posture line up before puberty ends, soft bone-building cells multiply far beyond genetic expectations.",
            "Predict your child's exact adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Even if both parents are short, a child can still grow up to four inches taller than their family average.",
            "Genetics shape about seventy-five percent of adult height, while the remaining twenty-five percent comes from daily habits inside the growth plates.",
            "When deep sleep, protein, and posture line up before puberty ends, soft bone-building cells multiply far beyond genetic expectations.",
            "Unlocking that hidden twenty-five percent window changes their adult stature forever, because in human biology",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: A parent marking a child's rising height with a pencil against a clean wooden doorframe height chart in warm morning light, relatable family moment, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass skeletal growth silhouettes where the center child silhouette rises smoothly in bright cyan and gold past shorter parent markers, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Smooth translucent knee growth plate CGI glowing bright cyan and gold as bone-building layers stack upward, no text on screen.",
            "Clean clinical 9:16 vertical shot: Sleek dark-mode pediatric height percentile projection curve rising smoothly on a clinical display, no text on screen.",
        ],
    },
    "12_growing_pains_night_calcium": {
        "stem": "US_KISFIT_12_NightGrowingPains_Periosteum",
        "hook_title": "WHY SHINS ACHE AT 2 AM (NOT STRETCHING)",
        "voice": "en-US-BrianMultilingualNeural",
        "style": "science",
        "accent": (255, 214, 60, 255),
        "shots_punchline": [
            "When your child wakes up crying with aching shins at two A M, their bones are not actually stretching in the dark.",
            "All day long, running and jumping build tiny tension ripples along the thin nerve wrap around the shinbone.",
            "At night, when growth hormone rushes blood flow into the legs, fluid swells against those tired nerves unless magnesium and vitamin D three are balanced.",
            "Try a warm calf stretch tonight. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "When your child wakes up crying with aching shins at two A M, their bones are not actually stretching in the dark.",
            "All day long, running and jumping build tiny tension ripples along the thin nerve wrap around the shinbone.",
            "At night, when growth hormone rushes blood flow into the legs, fluid swells against those tired nerves unless magnesium and vitamin D three are balanced.",
            "That midnight leg ache is actually a signal of rapid bone remodeling, and that explains why",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: An 8-year-old child sitting up in bed at night gently rubbing an aching shin while a parent comforts them, warm nightlight, relatable growing pains moment, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass lower leg anatomy showing warm amber tension waves along the outer shinbone nerve sheath, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Glowing cyan growth hormone waves and golden magnesium particles soothing the shinbone nerves into calm blue balance, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent knee and tibia glowing in healthy cyan and gold bone-building balance, no text on screen.",
        ],
    },
    "13_early_puberty_bone_age_trap": {
        "stem": "US_KISFIT_13_EarlyPuberty_BoneAgeTrap",
        "hook_title": "TALLEST IN 3RD GRADE? EARLY FUSION TRAP",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "Being the tallest kid in third grade can sometimes be a hidden warning sign that they will stop growing early.",
            "When early puberty hormones kick in too soon, internal bone age races two years ahead of actual calendar age.",
            "Those fast hormones make a child shoot up at age nine, but they also seal the growth plates shut years too early.",
            "Protecting steady bone timing is key. Predict your child's adult height and bone-age window in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Being the tallest kid in third grade can sometimes be a hidden warning sign that they will stop growing early.",
            "When early puberty hormones kick in too soon, internal bone age races two years ahead of actual calendar age.",
            "Those fast hormones make a child shoot up at age nine, but they also seal the growth plates shut years too early.",
            "That is why pediatricians care more about bone age than current height, because in reality",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: Kids standing back-to-back comparing height in a bright hallway while a parent looks thoughtfully at the tallest 9-year-old, relatable moment, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Two translucent glass skeletal timelines side by side—one spikes amber and seals early while the steady cyan skeleton grows taller, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent wrist and knee growth gap hardening early under amber signals vs staying open in glowing cyan, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Clean pediatric hand and wrist bone-age X-ray hologram glowing with open cyan growth zones, no text on screen.",
        ],
    },
    "14_swimming_hanging_spine_disc": {
        "stem": "US_KISFIT_14_SpinalDisc_MorningHeight",
        "hook_title": "WHY KIDS GO TO BED 0.5 INCH SHORTER",
        "voice": "en-US-BrianMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "Your child actually goes to bed half an inch shorter every single night than when they woke up.",
            "All day long, gravity and heavy school backpacks squeeze water out of the twenty-three soft cushions along the spine.",
            "Going straight to bed with a tight back slows down full overnight spinal rehydration.",
            "Try thirty seconds of gentle bar hanging before bed. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Your child actually goes to bed half an inch shorter every single night than when they woke up.",
            "All day long, gravity and heavy school backpacks squeeze water out of the twenty-three soft cushions along the spine.",
            "Going straight to bed with a tight back slows down full overnight spinal rehydration.",
            "Hanging from a pull-up bar for thirty seconds before bed unlocks that compressed height, because every single day",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: A 10-year-old child taking off a heavy school backpack after walking home, rolling tired shoulders, relatable after-school habit, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass spine CGI compressing slightly under downward amber backpack load, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent upper body in gentle overhead bar stretch as glowing cyan decompression space opens along the spine, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Clean cyan hydration waves plumping smooth translucent spinal cushions back to full height, no text on screen.",
        ],
    },
    "15_ultra_processed_phosphate_bone": {
        "stem": "US_KISFIT_15_SodaPhosphate_CalciumLeach",
        "hook_title": "DARK SODA PULLS CALCIUM OUT OF BONES",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (255, 214, 60, 255),
        "shots_punchline": [
            "One can of dark soda does not just add sugar—it actively pulls stored calcium out of your child's bones.",
            "Fizzy dark sodas are packed with acid additives that flood the blood with excess phosphate.",
            "To rebalance blood minerals, the body is forced to borrow stored calcium straight out of growing leg bones.",
            "Swap dark soda for sparkling water tonight. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "One can of dark soda does not just add sugar—it actively pulls stored calcium out of your child's bones.",
            "Fizzy dark sodas are packed with acid additives that flood the blood with excess phosphate.",
            "To rebalance blood minerals, the body is forced to borrow stored calcium straight out of growing leg bones.",
            "Every can of soda forces the body to borrow calcium from its own skeleton, and that is why",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical macro shot: Dark fizzy cola pouring over ice in a glass on a dinner table, 85mm lens, photorealistic, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass bloodstream CGI with amber acid waves triggering mineral-balance alerts, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Smooth translucent leg bone CGI losing glowing white calcium particles into surrounding vessels, zero porous holes, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Healthy translucent leg bone glowing dense cyan and gold with strong mineral balance, no text on screen.",
        ],
    },
    "16_mouth_tape_nasal_nitric_oxide": {
        "stem": "US_KISFIT_16_NasalNitricOxide_DeepSleepGH",
        "hook_title": "NOSE BREATHING BOOSTS SLEEP OXYGEN +18%",
        "voice": "en-US-BrianMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "Inside your child's nose is a natural oxygen booster that raises blood oxygen by eighteen percent—but only when their mouth stays closed.",
            "When air flows gently through the nose, the sinuses release a natural airway-opening gas called nitric oxide.",
            "That gas widens lung airways, delivering rich oxygen to the brain and locking in deep growth hormone sleep.",
            "Rinse stuffy noses with saline before bed tonight. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Inside your child's nose is a natural oxygen booster that raises blood oxygen by eighteen percent—but only when their mouth stays closed.",
            "When air flows gently through the nose, the sinuses release a natural airway-opening gas called nitric oxide.",
            "That gas widens lung airways, delivering rich oxygen to the brain and locking in deep growth hormone sleep.",
            "Breathing through the mouth completely bypasses that natural oxygen booster, because deep inside",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: A peaceful child sleeping soundly on a pillow with lips gently closed in calm moonlight, relatable bedtime scene, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass head profile showing smooth cyan nasal airflow lighting up golden sinus waves, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass lungs expanding smoothly as cyan and gold oxygen waves brighten the chest, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent sleeping brain pulsing steady gold growth hormone waves in deep sleep, no text on screen.",
        ],
    },
    "17_short_form_dopamine_prefrontal": {
        "stem": "US_KISFIT_17_DopamineSwipe_PopcornBrain",
        "hook_title": "30 MINS OF SWIPING DRAINS BRAIN FOCUS",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (255, 214, 60, 255),
        "shots_punchline": [
            "Thirty minutes of fast screen swiping floods a child's brain with so much quick dopamine that paper books feel exhausting.",
            "Every three-second video cut fires a sudden reward spike without asking the brain to think.",
            "To protect itself, the brain turns down its focus sensors, leaving the front attention center low on energy.",
            "Do a sixty-minute screen-free wind-down tonight. Predict your child's growth and focus window in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Thirty minutes of fast screen swiping floods a child's brain with so much quick dopamine that paper books feel exhausting.",
            "Every three-second video cut fires a sudden reward spike without asking the brain to think.",
            "To protect itself, the brain turns down its focus sensors, leaving the front attention center low on energy.",
            "That is why kids complain of boredom the second you take the screen away, because inside the brain",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: A child's thumb rapidly swiping bright vertical videos on a phone in a dim room while eyes glaze over, relatable habit, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass brain CGI showing bright amber reward flashes while the front focus zone dims, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Smooth neural bridge CGI cooling down from overheated amber to calm dark blue, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent 3D brain glowing smoothly in balanced cyan and gold focus harmony, no text on screen.",
        ],
    },
    "18_handwriting_vs_typing_memory": {
        "stem": "US_KISFIT_18_Handwriting_HippocampusTheta",
        "hook_title": "PENCIL WRITING LIGHTS 3X BRAIN CIRCUITS",
        "voice": "en-US-BrianMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "When a child writes a word by hand with a pencil instead of tapping glass, three times more brain circuits light up at once.",
            "Typing a letter is a simple finger tap that barely wakes up spatial memory.",
            "Shaping letters by hand syncs movement and vision, locking new words straight into the brain's deep memory center.",
            "Try ten minutes of pencil note-mapping today. Predict your child's growth and brain L Q score in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "When a child writes a word by hand with a pencil instead of tapping glass, three times more brain circuits light up at once.",
            "Typing a letter is a simple finger tap that barely wakes up spatial memory.",
            "Shaping letters by hand syncs movement and vision, locking new words straight into the brain's deep memory center.",
            "Swapping tablet worksheets for a real pencil and paper rewires how fast they learn, because",
        ],
        "flow_cuts": [
            "Extreme macro 9:16 vertical cinematic shot: A child's hand writing neat notes with a wooden pencil on cream notebook paper in warm desk light, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass arm and nervous system sending golden signals from the hand into the brain, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass brain memory center glowing with synchronized cyan and gold waves, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Top-down translucent 3D brain lighting up across three connected cyan and gold zones, no text on screen.",
        ],
    },
    "19_protein_breakfast_igf1_pulse": {
        "stem": "US_KISFIT_19_ProteinBreakfast_IGF1_Focus",
        "hook_title": "SUGARY CEREAL CRASHES FOCUS BY 10 AM",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "Feeding a growing child sugary cereal at eight A M spikes blood sugar fast and crashes classroom focus by ten A M.",
            "Sweet morning carbs trigger an insulin roller coaster that leaves the brain tired before second period.",
            "Swapping cereal for eggs and yogurt supplies steady protein building blocks that fuel both I G F one bone growth and calm focus.",
            "Add eggs to breakfast tomorrow morning. Predict your child's adult height in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Feeding a growing child sugary cereal at eight A M spikes blood sugar fast and crashes classroom focus by ten A M.",
            "Sweet morning carbs trigger an insulin roller coaster that leaves the brain tired before second period.",
            "Swapping cereal for eggs and yogurt supplies steady protein building blocks that fuel both I G F one bone growth and calm focus.",
            "What your child eats at seven thirty A M determines both their classroom focus and bone growth, because",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: Warm scrambled eggs and Greek yogurt next to a bowl of sugary cereal on a sunlit breakfast table, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass vessel CGI comparing jagged amber sugar spikes vs steady cyan protein waves, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass body lighting up both liver I G F-1 bone signals and frontal brain focus in cyan and gold, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent knee growth plate and brain glowing in steady morning energy balance, no text on screen.",
        ],
    },
    "20_feynman_blank_page_recall": {
        "stem": "US_KISFIT_20_BlankPageRecall_MyelinBrain",
        "hook_title": "RE-READING NOTES STORES ALMOST 0 MEMORY",
        "voice": "en-US-BrianMultilingualNeural",
        "style": "science",
        "accent": (255, 214, 60, 255),
        "shots_punchline": [
            "Re-reading the same textbook page five times tricks a child's brain into feeling ready while storing almost zero real memory.",
            "Staring at highlighted lines only uses passive recognition, which fades within forty-eight hours.",
            "Closing the book and writing three key points on blank paper wraps brain wires in fast insulation—boosting signal speed ten times.",
            "Try five minutes of blank-page recall tonight. Predict your child's growth and brain L Q score in sixty seconds—tap KisFitGlobal dot com in our bio.",
        ],
        "shots_loop": [
            "Re-reading the same textbook page five times tricks a child's brain into feeling ready while storing almost zero real memory.",
            "Staring at highlighted lines only uses passive recognition, which fades within forty-eight hours.",
            "Closing the book and writing three key points on blank paper wraps brain wires in fast insulation—boosting signal speed ten times.",
            "Closing the textbook is the exact moment real brain wiring begins, because when you re-read",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical close-up shot: A student closing a heavily highlighted textbook and pulling over a crisp blank sheet of paper at a study desk, relatable habit, 85mm lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass neural wire firing a weak amber signal before recall training, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Brain helper cells wrapping a neural pathway in golden insulation as cyan pulses race ten times faster, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent 3D brain glowing with fast golden memory highways, no text on screen.",
        ],
    },
    "kr_1_sleep_growth_cgi": {
        "stem": "KR_KIDSFIT_01_GrowthPlate_SleepCGI",
        "hook_title": "밤 10시 넘겨 자면 무릎 성장판이 닫히는 이유",
        "voice": "ko-KR-SunHiNeural",
        "style": "science",
        "accent": (255, 232, 0, 255),
        "shots_punchline": [
            "우리 아이가 밤 열 시를 넘겨 잠들면 무릎 성장판 스위치가 그대로 잠겨 버립니다.",
            "하루 성장호르몬의 칠십 퍼센트는 밤 열 시부터 새벽 두 시 깊은 숙면 구간에만 집중 분비됩니다.",
            "자기 전 스마트폰 불빛이 눈에 들어오면 스트레스 호르몬이 치솟아 연골 세포 분열을 멈추게 합니다.",
            "오늘 밤 아홉 시 반 조명을 낮춰 주세요. 우리 아이 최종 예상키와 성조숙증 신호등 일분 무료 진단은 프로필 상단 키즈핏에서 바로 확인하세요.",
        ],
        "shots_loop": [
            "우리 아이가 밤 열 시를 넘겨 잠들면 무릎 성장판 스위치가 그대로 잠겨 버립니다.",
            "하루 성장호르몬의 칠십 퍼센트는 밤 열 시부터 새벽 두 시 깊은 숙면 구간에만 집중 분비됩니다.",
            "자기 전 스마트폰 불빛이 눈에 들어오면 스트레스 호르몬이 치솟아 연골 세포 분열을 멈추게 합니다.",
            "일 년만 늦게 자도 숨은 키 오 센티미터를 놓칠 수 있으니 오늘 밤부터 꼭 기억하세요.",
        ],
        "flow_cuts": [
            "3D medical documentary animation, 9:16 vertical: Translucent glass child knee growth plate glowing cyan in deep sleep, clean clinical visual, zero fake product props, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass brain releasing bright gold and cyan growth hormone waves at 10 PM, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Clean 1:1 split comparison chart silhouette showing early deep sleep tall stature vs late sleep paused growth plate in cyan and amber, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Healthy glowing knee growth plate expanding upward with golden bone matrix layers, no text on screen.",
        ],
    },
    "kr_2_mouth_breathing_cgi": {
        "stem": "KR_KIDSFIT_02_MouthBreathing_AirwayCGI",
        "hook_title": "입 벌리고 자는 아이 얼굴형·키 성장 경고등",
        "voice": "ko-KR-InJoonNeural",
        "style": "science",
        "accent": (110, 255, 210, 255),
        "shots_punchline": [
            "밤마다 입을 벌리고 자는 습관이 우리 아이 얼굴형과 숨은 키를 동시에 깎아먹고 있습니다.",
            "코 대신 입으로 숨을 쉬면 혀가 아래로 떨어지면서 위턱이 좁아지고 깊은 숙면 산소가 부족해집니다.",
            "결국 뇌가 새벽마다 얕게 깨어나면서 밤사이 나와야 할 성장호르몬 분비까지 끊기게 됩니다.",
            "오늘 밤 침실 습도와 코 호흡부터 점검하세요. 우리 아이 최종 예상키 일분 무료 진단은 프로필 상단 키즈핏을 눌러 확인하세요.",
        ],
        "shots_loop": [
            "밤마다 입을 벌리고 자는 습관이 우리 아이 얼굴형과 숨은 키를 동시에 깎아먹고 있습니다.",
            "코 대신 입으로 숨을 쉬면 혀가 아래로 떨어지면서 위턱이 좁아지고 깊은 숙면 산소가 부족해집니다.",
            "결국 뇌가 새벽마다 얕게 깨어나면서 밤사이 나와야 할 성장호르몬 분비까지 끊기게 됩니다.",
            "오늘 밤 베개 위 아이 입모양을 꼭 확인해 보세요.",
        ],
        "flow_cuts": [
            "3D medical documentary animation, 9:16 vertical: Translucent glass side-profile head showing amber mouth airflow vs smooth cyan nasal airflow, zero fake product props, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent glass airway and jaw alignment CGI in cyan and gold medical lighting, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Clean 1:1 comparison visual of nasal deep-sleep brain oxygen waves vs fragmented mouth-breathing waves, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Smooth cyan nasal breathing triggering bright golden pituitary growth pulses, no text on screen.",
        ],
    },
}


def _count_clean_words(text: str) -> int:
    tokens = re.findall(r"[A-Za-z0-9가-힣']+", text)
    return len(tokens)


def compute_sentence_synced_cut_times(words: list, shot_scripts: list, total_dur: float) -> list:
    n_shots = len(shot_scripts)
    if n_shots <= 1 or not words:
        return []

    word_counts = [_count_clean_words(s) for s in shot_scripts]
    total_expected = sum(word_counts)
    actual_total = len(words)

    cut_times = []
    cum_expected = 0
    for i in range(n_shots - 1):
        cum_expected += word_counts[i]
        w_idx = int(round(cum_expected * actual_total / max(1, total_expected)))
        w_idx = max(1, min(actual_total - 1, w_idx))
        prev_end = words[w_idx - 1]["end"]
        next_start = words[w_idx]["start"]
        cut_t = (prev_end + next_start) * 0.5
        cut_times.append(cut_t)

    return cut_times


def add_outro_cinematic_boom(wav_path: Path, boom_time: float, ending_mode: str = "punchline"):
    with wave.open(str(wav_path), "rb") as wf:
        sr = wf.getframerate()
        n_ch = wf.getnchannels()
        raw = wf.readframes(wf.getnframes())

    audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if n_ch == 2:
        audio = audio.reshape(-1, 2)
    else:
        audio = np.column_stack([audio, audio])

    n_samples = audio.shape[0]
    start_idx = int(max(0.0, boom_time - 0.05) * sr)

    if ending_mode == "punchline" and start_idx < n_samples:
        boom_len = min(int(1.25 * sr), n_samples - start_idx)
        if boom_len > 0:
            t_arr = np.linspace(0.0, boom_len / sr, boom_len, dtype=np.float32)
            freq = 62.0 * np.exp(-1.5 * t_arr) + 26.0
            phase = 2.0 * np.pi * np.cumsum(freq) / sr
            env = np.exp(-2.6 * t_arr) * np.minimum(1.0, t_arr / 0.02)
            sub_boom = (0.42 * np.sin(phase) + 0.15 * np.sin(2.0 * phase)) * env
            audio[start_idx:start_idx + boom_len, 0] += sub_boom
            audio[start_idx:start_idx + boom_len, 1] += sub_boom

        fade_len = min(int(0.35 * sr), n_samples)
        fade_curve = np.linspace(1.0, 0.0, fade_len, dtype=np.float32)[:, None]
        audio[-fade_len:] *= fade_curve

    elif ending_mode == "loop":
        riser_len = min(int(0.22 * sr), n_samples)
        if riser_len > 0:
            t_arr = np.linspace(0.0, 1.0, riser_len, dtype=np.float32)
            freq = 90.0 + 220.0 * (t_arr ** 2)
            phase = 2.0 * np.pi * np.cumsum(freq) / sr
            riser = 0.18 * np.sin(phase) * (t_arr ** 1.5)
            audio[-riser_len:, 0] += riser
            audio[-riser_len:, 1] += riser

    audio = np.clip(audio, -0.98, 0.98)
    out_int16 = (audio * 32767.0).astype(np.int16)

    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(out_int16.tobytes())


def render_clean_fullscreen_shorts_from_clips(
    clip_paths: list,
    script: str,
    output_mp4: Path,
    voice: str = "en-US-AndrewMultilingualNeural",
    style: str = "science",
    accent_color: tuple = (0, 245, 212, 255),
    top_clean_title: str = "",
    shot_scripts: list = None,
    ending_mode: str = "punchline",
):
    if shot_scripts and len(shot_scripts) == len(clip_paths):
        full_script = " ".join(s.strip() for s in shot_scripts)
    else:
        full_script = script

    tag = output_mp4.stem
    mp3_path = TEMP_DIR / f"{tag}_voice.mp3"
    wav_path = TEMP_DIR / f"{tag}_voice.wav"

    words, raw_dur = asyncio.run(
        synthesize_natural_voice_with_words(
            full_script=full_script,
            voice=voice,
            out_mp3=mp3_path,
            out_wav=wav_path,
            rate="+5%",
        )
    )
    phrases = group_words_into_phrases(words, max_words_per_group=3, max_chars=18)

    last_word_end = words[-1]["end"] if words else raw_dur
    if ending_mode == "punchline":
        total_dur = max(raw_dur, last_word_end + 1.05)
    elif ending_mode == "loop":
        # 자막/음성 100% 완독 보장 (오디오 절단 금지: seg_dur >= tts_dur + 0.22s)
        total_dur = max(raw_dur, last_word_end + 0.24)
    else:
        total_dur = max(raw_dur, last_word_end + 0.24)

    total_frames = int(round(total_dur * FPS))
    n_clips = len(clip_paths)

    if shot_scripts and len(shot_scripts) == n_clips:
        cut_times = compute_sentence_synced_cut_times(words, shot_scripts, total_dur)
    else:
        cut_times = [(i * total_dur / n_clips) for i in range(1, n_clips)]

    boundaries = [0.0] + cut_times + [total_dur]
    clip_frame_counts = []
    accum_f = 0
    for i in range(n_clips):
        if i == n_clips - 1:
            cnt = max(1, total_frames - accum_f)
        else:
            target_end_f = int(round(boundaries[i + 1] * FPS))
            cnt = max(1, target_end_f - accum_f)
        clip_frame_counts.append(cnt)
        accum_f += cnt

    # 메모리 폭증(MemoryError) 방지를 위해 첫 프레임만 미리 1장 추출하고, 본 렌더링은 클립별 스트리밍으로 처리
    first_frame_cached = next(
        iter_video_clip_frames(
            Path(clip_paths[0]),
            num_frames=1,
            start_sec=0.0,
            target_w=WIDTH,
            target_h=HEIGHT,
            fit_mode="cover",
            speed=1.0,
        )
    ).convert("RGBA")

    final_audio = TEMP_DIR / f"{tag}_master.wav"
    build_studio_soundtrack(wav_path, cut_times, total_dur, style=style, final_wav=final_audio)
    add_outro_cinematic_boom(final_audio, boom_time=last_word_end, ending_mode=ending_mode)

    cmd = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo", "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}", "-pix_fmt", "rgb24", "-r", str(FPS),
        "-i", "-", "-i", str(final_audio),
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
        "-shortest", "-movflags", "+faststart", str(output_mp4),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

    kr_font_path = str((BASE_DIR.parent / "src" / "fonts" / "NanumSquareRoundEB.ttf").resolve())
    is_korean_voice = voice.lower().startswith("ko-")
    font_title = load_font(kr_font_path if (is_korean_voice and os.path.exists(kr_font_path)) else FONT_SEGOE_BOLD, 50)
    kr_cap_font_normal = load_font(kr_font_path, 86) if (is_korean_voice and os.path.exists(kr_font_path)) else None
    kr_cap_font_active = load_font(kr_font_path, 92) if (is_korean_voice and os.path.exists(kr_font_path)) else None

    f_idx = 0
    for clip_i, (cp, cnt) in enumerate(zip(clip_paths, clip_frame_counts)):
        for local_i, frame in enumerate(
            iter_video_clip_frames(
                Path(cp),
                num_frames=cnt,
                start_sec=0.0,
                target_w=WIDTH,
                target_h=HEIGHT,
                fit_mode="cover",
                speed=1.0,
            )
        ):
            t = f_idx / float(FPS)

            # 루프 엔딩일 때: 마지막 4프레임(0.13초)을 첫 번째 클립 시작 프레임과 블렌딩하여 시각적 점프 제거
            if ending_mode == "loop" and f_idx >= total_frames - 4:
                b_idx = f_idx - (total_frames - 5)
                alpha = max(0.0, min(1.0, b_idx / 5.0))
                frame = Image.blend(frame.convert("RGBA"), first_frame_cached, alpha * 0.55).convert("RGB")

            if ending_mode == "punchline" and (total_dur - t) < 0.55:
                rem_ratio = max(0.0, (total_dur - t) / 0.55)
                brightness = 0.15 + 0.85 * (rem_ratio ** 1.4)
                frame = ImageEnhance.Brightness(frame).enhance(brightness)

            overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
            odraw = ImageDraw.Draw(overlay)

            # 한국형 레이아웃 상단 훅 배너 (y=200~300 세이프존)
            if top_clean_title and t <= min(2.8, boundaries[1] if len(boundaries) > 1 else 2.6):
                tb = odraw.textbbox((0, 0), top_clean_title, font=font_title)
                tw = tb[2] - tb[0]
                odraw.text(
                    ((WIDTH - tw) // 2, 240),
                    top_clean_title,
                    font=font_title,
                    fill=(255, 232, 0, 255) if is_korean_voice else (255, 255, 255, 255),
                    stroke_width=7,
                    stroke_fill=(0, 0, 0, 235),
                )

            if is_korean_voice and kr_cap_font_normal and kr_cap_font_active:
                # 한국형 중앙 자막 세이프존 (y=1020~1100, 84~92pt 굵은 한글 폰트 + 검정 테두리 + 노랑/민트 강조)
                active_g = next((g for g in phrases if g["start"] - 0.06 <= t <= g["end"] + 0.08), None)
                if active_g:
                    g_words = active_g["words"]
                    full_line = " ".join(w["word"] for w in g_words)
                    if len(full_line) > 12 and len(g_words) >= 2:
                        mid = max(1, len(g_words) // 2)
                        rows = [g_words[:mid], g_words[mid:]]
                    else:
                        rows = [g_words]
                    base_kr_y = 1060 if len(rows) == 1 else 1020
                    for r_i, r_words in enumerate(rows):
                        cur_y = base_kr_y + r_i * 100
                        metrics = []
                        for wi in r_words:
                            speaking = (wi["start"] - 0.04 <= t <= wi["end"] + 0.04)
                            f_u = kr_cap_font_active if speaking else kr_cap_font_normal
                            txt_w = wi["word"]
                            bb = odraw.textbbox((0, 0), txt_w, font=f_u)
                            metrics.append((txt_w, speaking, f_u, bb[2] - bb[0]))
                        row_w = sum(m[3] for m in metrics) + 22 * max(0, len(metrics) - 1)
                        cx = (WIDTH - row_w) // 2
                        for txt_w, speaking, f_u, ww in metrics:
                            col = accent_color if speaking else (255, 255, 255, 255)
                            odraw.text((cx, cur_y), txt_w, font=f_u, fill=col, stroke_width=10, stroke_fill=(0, 0, 0, 245))
                            cx += ww + 22
            else:
                draw_active_word_captions(
                    odraw,
                    phrases,
                    t,
                    accent_color=accent_color,
                    y_pos=1070,
                )

            comp = Image.alpha_composite(frame.convert("RGBA"), overlay).convert("RGB")
            proc.stdin.write(comp.tobytes())
            f_idx += 1

    proc.stdin.close()
    proc.wait()

    # 정식 .srt 자막 추출 + 네이버 클립(Clip) 동시 업로드용 클린 MP4 생성 + 업로드 메타데이터(09:30 KST / categoryId=27 / MadeForKids=False) 저장
    srt_path = export_srt(phrases, output_mp4.with_suffix(".srt"))
    naver_clip_mp4 = output_mp4.with_name(f"{output_mp4.stem}_NaverClip_Clean.mp4")
    shutil.copy2(output_mp4, naver_clip_mp4)
    meta_path = output_mp4.with_suffix(".upload_meta.json")
    meta_payload = {
        **KIDSFIT_KR_YOUTUBE_UPLOAD_DEFAULTS,
        "scheduled_publishAt": compute_next_kidsfit_kr_publish_at_iso(),
        "video_file": str(output_mp4),
        "naver_clip_clean_file": str(naver_clip_mp4),
        "srt_file": str(srt_path),
    }
    meta_path.write_text(json.dumps(meta_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ [{ending_mode.upper()} 엔딩] 클린 풀스크린 쇼츠 + 네이버클립 동시 완성: {output_mp4} / {naver_clip_mp4.name} (SRT: {srt_path.name})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KISFIT Global × Google Flow (Veo) 클립 자동 합본 엔진")
    parser.add_argument("--preset", choices=list(KISFIT_PRESETS.keys()), default="1_sleep_growth")
    parser.add_argument("--ending", choices=["punchline", "loop", "both"], default="punchline")
    parser.add_argument("--clips", nargs="*", default=[], help="직접 지정할 4개 비디오 파일 경로")
    parser.add_argument("--out", type=str, default="")
    args = parser.parse_args()

    cfg = KISFIT_PRESETS[args.preset]
    clips = [str(Path(p)) for p in args.clips if Path(p).exists()]

    if not clips:
        preset_clips = [FLOW_CLIPS_DIR / f"{args.preset}_clip_{i:02d}.mp4" for i in range(1, 5)]
        if all(p.exists() for p in preset_clips):
            clips = [str(p) for p in preset_clips]

    if not clips:
        default_clips = [FLOW_CLIPS_DIR / f"shot{i}_flow.mp4" for i in range(1, 5)]
        if all(p.exists() for p in default_clips):
            clips = [str(p) for p in default_clips]
        else:
            clips = [str(p) for p in sorted(FLOW_CLIPS_DIR.glob("*.mp4"))[:4]]

    if not clips:
        dl_dir = Path.home() / "Downloads"
        if dl_dir.exists():
            import time
            now = time.time()
            recent_mp4s = [p for p in dl_dir.glob("*.mp4") if (now - p.stat().st_mtime) < 7200]
            recent_mp4s.sort(key=lambda p: p.stat().st_mtime)
            if len(recent_mp4s) >= 4:
                print(f"✨ 다운로드 폴더에서 최근 Flow 영상 4개를 자동으로 찾았습니다!")
                clips = [str(p) for p in recent_mp4s[-4:]]

    if not clips:
        print(f"💡 [{FLOW_CLIPS_DIR}] 또는 [다운로드] 폴더에 Google Flow에서 다운받은 mp4 클립 4개를 넣어주세요!")
        sys.exit(1)

    shots_punchline = cfg["shots_punchline"]
    shots_loop = cfg["shots_loop"]

    if args.ending in ("punchline", "both"):
        out_a = Path(args.out) if (args.out and args.ending == "punchline") else (OUTPUT_DIR / f"{cfg['stem']}_1A_Punchline.mp4")
        render_clean_fullscreen_shorts_from_clips(
            clip_paths=clips,
            script=" ".join(shots_punchline),
            output_mp4=out_a,
            voice=cfg["voice"],
            style=cfg["style"],
            accent_color=cfg["accent"],
            top_clean_title=cfg.get("hook_title", ""),
            shot_scripts=shots_punchline,
            ending_mode="punchline",
        )

    if args.ending in ("loop", "both"):
        out_b = Path(args.out) if (args.out and args.ending == "loop") else (OUTPUT_DIR / f"{cfg['stem']}_1B_SeamlessLoop.mp4")
        render_clean_fullscreen_shorts_from_clips(
            clip_paths=clips,
            script=" ".join(shots_loop),
            output_mp4=out_b,
            voice=cfg["voice"],
            style=cfg["style"],
            accent_color=cfg["accent"],
            top_clean_title=cfg.get("hook_title", ""),
            shot_scripts=shots_loop,
            ending_mode="loop",
        )
