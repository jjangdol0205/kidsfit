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
import wave
import asyncio
import argparse
import subprocess
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

KISFIT_PRESETS = {
    "1_sleep_growth": {
        "stem": "US_KISFIT_01_GrowthPlate_SleepLock",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "If your child goes to sleep after ten P M tonight, their growth plates literally lock shut.",
            "Between ten P M and two A M, a child's brain releases up to seventy percent of its daily human growth hormone during deep slow-wave sleep.",
            "When late-night blue light hits the retina, cortisol spikes and stops cartilage cells inside the knee growth plates from multiplying.",
            "Missing that deep sleep window for just one year can cost two full inches of adult height. Check your child's exact C D C growth percentile in thirty seconds at KisFitGlobal dot com.",
        ],
        "shots_loop": [
            "If your child goes to sleep after ten P M tonight, their growth plates literally lock shut.",
            "Between ten P M and two A M, a child's brain releases up to seventy percent of its daily human growth hormone during deep slow-wave sleep.",
            "When late-night blue light hits the retina, cortisol spikes and stops cartilage cells inside the knee growth plates from multiplying.",
            "Missing that deep sleep window for just one year can cost two full inches of adult height. So put the tablet away tonight, because that is what happens",
        ],
        "flow_cuts": [
            "Extreme macro 9:16 vertical cinematic shot: A 9-year-old American child's tired eye slowly blinks in a dark bedroom at 11 PM as bright blue tablet light flickers across the pupil and iris, 85mm macro lens, photorealistic, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Camera slowly orbits a translucent human head while glowing cyan pituitary gland growth hormone pulses suddenly dim and turn amber as blue light hits the optic nerve, no text on screen.",
            "Microscopic 3D scientific CGI, 9:16 vertical: Camera pushes forward inside a glowing knee epiphyseal growth plate as dividing chondrocyte cartilage cells freeze and red cortisol particles accumulate around the bone matrix, no text on screen.",
            "Handheld documentary shot inside a dark US pediatric endocrinology lab, 9:16 vertical: A doctor points at a glowing child knee growth plate X-ray scan on a high-contrast clinical monitor as scan slices animate, no text on screen.",
        ],
    },
    "2_sugar_bone": {
        "stem": "US_KISFIT_02_BedtimeSugar_InsulinBlock",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "One glass of sweet milk or juice before bed can shut down your child's overnight bone growth for four straight hours.",
            "The moment sugar enters the bloodstream at night, the pancreas floods the body with insulin.",
            "Inside the brain, high insulin acts like an emergency brake on the pituitary gland and blocks nocturnal growth hormone release.",
            "Swap sweet bedtime snacks for water or plain protein tonight, and check your child's exact C D C growth curve at KisFitGlobal dot com.",
        ],
        "shots_loop": [
            "One glass of sweet milk or juice before bed can shut down your child's overnight bone growth for four straight hours.",
            "The moment sugar enters the bloodstream at night, the pancreas floods the body with insulin.",
            "Inside the brain, high insulin acts like an emergency brake on the pituitary gland and blocks nocturnal growth hormone release.",
            "Even one sweet snack at 9 P M can erase that night's growth surge, because that is why",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical macro shot in a warm kitchen at night: Sugar crystals and chocolate syrup swirl inside a glass of milk in slow motion under moody spotlight, 85mm lens, no text on screen.",
            "Microscopic 3D medical CGI, 9:16 vertical: Camera flies through a glowing human bloodstream as bright yellow insulin molecules surge past red blood cells, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent human brain showing red insulin signals locking the glowing cyan pituitary gland and stopping hormone release, no text on screen.",
            "Microscopic 3D bone CGI, 9:16 vertical: Glowing calcium ions bouncing off a dormant epiphyseal bone growth plate in dark clinical lighting, no text on screen.",
        ],
    },
    "3_mouth_breathing": {
        "stem": "US_KISFIT_03_MouthBreathing_Craniofacial",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "If your child sleeps with their mouth open at night, it is quietly reshaping their face and shrinking their growth.",
            "When a child breathes through their mouth instead of their nose, the tongue drops from the roof of the mouth and the upper jaw narrows.",
            "Even worse, nocturnal mouth breathing drops blood oxygen saturation, waking the brain out of deep slow-wave growth hormone sleep.",
            "Check your child's airway, sleep, and C D C growth percentile in thirty seconds at KisFitGlobal dot com.",
        ],
        "shots_loop": [
            "If your child sleeps with their mouth open at night, it is quietly reshaping their face and shrinking their growth.",
            "When a child breathes through their mouth instead of their nose, the tongue drops from the roof of the mouth and the upper jaw narrows.",
            "Even worse, nocturnal mouth breathing drops blood oxygen saturation, waking the brain out of deep slow-wave growth hormone sleep.",
            "Watch how your child breathes on the pillow tonight, because that is what happens",
        ],
        "flow_cuts": [
            "3D medical documentary animation, 9:16 vertical: Translucent glowing blue 3D anatomical head resting on a pillow in a dark sleep lab as turbulent amber air particles flow in through the open mouth instead of the nose, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent side-profile of a human head showing turbulent red airflow entering through the open mouth while the tongue drops and the upper jaw bone structure narrows, no text on screen.",
            "Microscopic 3D scientific CGI, 9:16 vertical: Glowing red blood cells moving slowly through brain capillaries as oxygen light dims and neural sleep waves fracture in dark blue space, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Smooth cyan nasal airflow enters through the nose, illuminating the sinuses and triggering bright golden pulses in the brain's pituitary gland, no text on screen.",
        ],
    },
    "4_tech_neck": {
        "stem": "US_KISFIT_04_TechNeck_SpinalCompression",
        "voice": "en-US-BrianMultilingualNeural",
        "style": "science",
        "accent": (255, 214, 60, 255),
        "shots_punchline": [
            "Your child might already have two hidden inches of height trapped inside a compressed spine.",
            "Tilting the head forward sixty degrees to look at a phone puts sixty pounds of crushing pressure on a growing cervical spine.",
            "Over time, thoracic discs flatten and postural kyphosis locks the upper back before the growth plates fuse.",
            "Ten minutes of daily wall decompression restores natural spinal alignment. Run your child's free thirty-second growth check at KisFitGlobal dot com.",
        ],
        "shots_loop": [
            "Your child might already have two hidden inches of height trapped inside a compressed spine.",
            "Tilting the head forward sixty degrees to look at a phone puts sixty pounds of crushing pressure on a growing cervical spine.",
            "Over time, thoracic discs flatten and postural kyphosis locks the upper back before the growth plates fuse.",
            "Fixing that posture tonight is the fastest way to unlock their true stature, because right now",
        ],
        "flow_cuts": [
            "3D medical X-ray documentary animation, 9:16 vertical: A translucent anatomical human silhouette tilts the head down at a glowing smartphone while the cervical neck spine glows bright red under heavy compression, no text on screen.",
            "Microscopic 3D anatomical CGI, 9:16 vertical: Extreme close-up of spinal vertebrae squeezing a glowing blue intervertebral disc until it flattens and turns amber under pressure, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: A curved human spine smoothly straightens upward into perfect vertical alignment as glowing cyan decompression waves travel up the vertebrae, no text on screen.",
            "3D medical biomechanics animation, 9:16 vertical: Clean green laser alignment grid lines project across a glowing 3D human skeletal posture model standing in perfect vertical balance, no text on screen.",
        ],
    },
    "5_brain_synapse": {
        "stem": "US_KISFIT_05_Fingertip_PrefrontalBrain",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "When your three-year-old yells I do it myself, their brain is literally wiring its future I Q through their fingertips.",
            "Nearly thirty percent of the human brain's motor cortex is connected directly to the nerves in the hands and thumb.",
            "Every time a toddler struggles to button a shirt or pour water, high-frequency electrical signals shoot straight into the prefrontal cortex.",
            "Taking over for them shuts that synaptic window down. Check your child's exact developmental milestone score at KisFitGlobal dot com.",
        ],
        "shots_loop": [
            "When your three-year-old yells I do it myself, their brain is literally wiring its future I Q through their fingertips.",
            "Nearly thirty percent of the human brain's motor cortex is connected directly to the nerves in the hands and thumb.",
            "Every time a toddler struggles to button a shirt or pour water, high-frequency electrical signals shoot straight into the prefrontal cortex.",
            "So give them two extra minutes of patience today, because that is what happens",
        ],
        "flow_cuts": [
            "Extreme macro 9:16 vertical cinematic shot: Hands carefully fastening a wooden button and stacking natural wooden blocks in warm morning sunlight, shallow depth of field, 85mm macro lens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent human hand and arm showing glowing cyan bio-electrical nerve impulses shooting rapidly from the fingertips up the arm into the brain's motor cortex, no text on screen.",
            "Microscopic 3D neuroscience CGI, 9:16 vertical: Camera flies through the prefrontal cortex as new golden synaptic bridges spark, connect, and myelinate in rapid succession, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: A fully illuminated 3D human brain rotating slowly as both the motor cortex and frontal lobe glow in synchronized cyan and gold harmony, no text on screen.",
        ],
    },
    "6_zinc_taste": {
        "stem": "US_KISFIT_06_PickyEater_Zinc_IGF1",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "When a picky eater spits out meat and green vegetables, their tongue is literally tasting metal.",
            "Human taste buds regenerate every ten days using a zinc-dependent salivary enzyme called carbonic anhydrase.",
            "When zinc stores drop, high-protein foods taste bitter and metallic, while the liver stops producing I G F one bone growth hormone.",
            "Restoring daily zinc wakes up natural appetite in four weeks. Check your child's exact C D C growth and nutrition score at KisFitGlobal dot com.",
        ],
        "shots_loop": [
            "When a picky eater spits out meat and green vegetables, their tongue is literally tasting metal.",
            "Human taste buds regenerate every ten days using a zinc-dependent salivary enzyme called carbonic anhydrase.",
            "When zinc stores drop, high-protein foods taste bitter and metallic, while the liver stops producing I G F one bone growth hormone.",
            "So stop fighting at the dinner table tonight, because that is why",
        ],
        "flow_cuts": [
            "Extreme macro 9:16 vertical cinematic shot: A silver fork gently touches fresh grilled steak and green broccoli on a white ceramic plate as cold metallic blue light reflects off the fork, 85mm macro lens, no text on screen.",
            "Microscopic 3D medical CGI, 9:16 vertical: Camera flies across the surface of a human tongue as glowing taste bud receptors turn dull gray and metallic particles block the sensory pores, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent human torso showing the liver glowing dim amber as cyan I G F-1 growth hormone streams slow down before reaching the leg bones, no text on screen.",
            "Microscopic 3D scientific CGI, 9:16 vertical: Bright golden zinc ions bind to cellular receptors, igniting a wave of glowing cyan regeneration across healthy tissue, no text on screen.",
        ],
    },
    "7_vitamin_k2_calcium": {
        "stem": "US_KISFIT_07_VitaminK2_Osteocalcin_Bone",
        "voice": "en-US-BrianMultilingualNeural",
        "style": "science",
        "accent": (255, 214, 60, 255),
        "shots_punchline": [
            "Drinking gallons of calcium milk without one specific vitamin can leave growing bones starving.",
            "Vitamin D three absorbs calcium into the bloodstream, but it cannot tell that calcium where to go.",
            "Without vitamin K two, a bone protein called osteocalcin stays inactive, leaving calcium floating in the blood instead of locking into the growth plates.",
            "Pairing D three with K two routes calcium straight into growing bone matrix. Run a free thirty-second C D C bone growth check at KisFitGlobal dot com.",
        ],
        "shots_loop": [
            "Drinking gallons of calcium milk without one specific vitamin can leave growing bones starving.",
            "Vitamin D three absorbs calcium into the bloodstream, but it cannot tell that calcium where to go.",
            "Without vitamin K two, a bone protein called osteocalcin stays inactive, leaving calcium floating in the blood instead of locking into the growth plates.",
            "Always pair calcium and D three with vitamin K two, because without it",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical high-speed macro shot: Pure white milk pours into a crystal glass in slow motion against a dark studio background, dramatic rim lighting, 85mm lens, no text on screen.",
            "Microscopic 3D medical CGI, 9:16 vertical: Glowing white calcium spheres drift aimlessly inside a red human blood vessel without attaching to the surrounding bone wall, no text on screen.",
            "Microscopic 3D scientific CGI, 9:16 vertical: Bright emerald green vitamin K2 molecules activate golden osteocalcin protein claws that grab floating calcium spheres, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent human leg bone glowing bright cyan as mineralized trabecular bone matrix rapidly builds and strengthens upward, no text on screen.",
        ],
    },
    "8_morning_sun_melatonin": {
        "stem": "US_KISFIT_08_MorningSun_CircadianGH",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "Your child's ten P M growth hormone surge actually starts at eight A M in the morning.",
            "When natural morning sunlight hits the human retina, it triggers a fourteen-hour biological countdown timer inside the hypothalamus.",
            "That morning light converts amino acids into serotonin, which transforms into deep-sleep melatonin fourteen hours later after dark.",
            "Ten minutes of morning sun locks in early deep sleep tonight. Track your child's exact C D C growth curve in thirty seconds at KisFitGlobal dot com.",
        ],
        "shots_loop": [
            "Your child's ten P M growth hormone surge actually starts at eight A M in the morning.",
            "When natural morning sunlight hits the human retina, it triggers a fourteen-hour biological countdown timer inside the hypothalamus.",
            "That morning light converts amino acids into serotonin, which transforms into deep-sleep melatonin fourteen hours later after dark.",
            "Step outside into the sunlight for ten minutes tomorrow morning, because that is why",
        ],
        "flow_cuts": [
            "Extreme macro 9:16 vertical cinematic shot: Warm golden sunrise light beams shine into a human eye as the iris contracts smoothly, 85mm macro lens, photorealistic, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent human head showing a glowing golden light beam traveling along the optic nerve into the suprachiasmatic nucleus master clock in the brain, no text on screen.",
            "Microscopic 3D neuroscience CGI, 9:16 vertical: Bright golden serotonin molecules smoothly transform into glowing indigo-blue melatonin crystals inside the pineal gland as the background darkens, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent sleeping human brain in dark blue night mode releasing powerful rhythmic cyan waves of growth hormone across the body, no text on screen.",
        ],
    },
    "9_jump_piezoelectric": {
        "stem": "US_KISFIT_09_Jumping_Piezoelectric_Bone",
        "voice": "en-US-BrianMultilingualNeural",
        "style": "science",
        "accent": (0, 245, 212, 255),
        "shots_punchline": [
            "Human bones have a built-in electrical generator that only turns on when you jump.",
            "Every time vertical impact hits the heel and knee, microscopic collagen fibers inside the bone bend and generate tiny piezoelectric charges.",
            "Those micro-currents attract osteoblast bone-building cells straight to the epiphyseal growth plate, multiplying cartilage thickness.",
            "Fifteen minutes of daily jumping sparks measurable bone lengthening. Check your child's exact C D C height percentile at KisFitGlobal dot com.",
        ],
        "shots_loop": [
            "Human bones have a built-in electrical generator that only turns on when you jump.",
            "Every time vertical impact hits the heel and knee, microscopic collagen fibers inside the bone bend and generate tiny piezoelectric charges.",
            "Those micro-currents attract osteoblast bone-building cells straight to the epiphyseal growth plate, multiplying cartilage thickness.",
            "Just fifteen minutes of jumping rope wakes up dormant bone growth, because inside the body",
        ],
        "flow_cuts": [
            "Cinematic 9:16 vertical slow-motion close-up shot: Athletic sneakers jumping and landing rhythmically on an outdoor court at golden hour as dust particles float in the sunlight, 85mm lens, no text on screen.",
            "3D medical X-ray documentary animation, 9:16 vertical: Translucent human leg and knee joint landing from a jump as a bright cyan shockwave of bio-electricity pulses upward through the tibia and femur, no text on screen.",
            "Microscopic 3D scientific CGI, 9:16 vertical: Inside porous trabecular bone, electric blue piezoelectric sparks flash across collagen fibers and awaken glowing golden osteoblast cells, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Close-up of a glowing knee growth plate expanding vertically with bright cyan cartilage layers multiplying upward, no text on screen.",
        ],
    },
    "10_working_memory_math": {
        "stem": "US_KISFIT_10_WorkingMemory_MathOverload",
        "voice": "en-US-AndrewMultilingualNeural",
        "style": "science",
        "accent": (255, 214, 60, 255),
        "shots_punchline": [
            "Why do smart kids solve number equations fast, but freeze on math word problems?",
            "Inside the prefrontal cortex, human working memory can only hold three to four chunks of information at the exact same time.",
            "Reading four long sentences while trying to calculate in your head overloads the neural buffer and erases the first clue.",
            "Drawing a simple visual bar diagram offloads seventy percent of brain strain instantly. Test your child's five-axis brain L Q score at KisFitGlobal dot com.",
        ],
        "shots_loop": [
            "Why do smart kids solve number equations fast, but freeze on math word problems?",
            "Inside the prefrontal cortex, human working memory can only hold three to four chunks of information at the exact same time.",
            "Reading four long sentences while trying to calculate in your head overloads the neural buffer and erases the first clue.",
            "Sketching a quick bar model frees up the prefrontal cortex immediately, and that explains",
        ],
        "flow_cuts": [
            "3D medical documentary animation, 9:16 vertical: Translucent human head looking down at a complex page of text while the prefrontal cortex glows bright red from cognitive overload, no text on screen.",
            "Microscopic 3D neuroscience CGI, 9:16 vertical: Four glowing cyan memory spheres hover inside a neural circuit, and when a fifth sphere enters, the circuit sparks red and scatters, no text on screen.",
            "Cinematic 9:16 vertical macro shot: A clean fountain pen draws a simple geometric bar diagram on crisp white paper under warm desk lighting, shallow depth of field, no text on screen.",
            "3D medical documentary animation, 9:16 vertical: Translucent human brain transitioning from chaotic red sparks to smooth, synchronized cyan and gold neural waves across the prefrontal cortex, no text on screen.",
        ],
    },
}


def _count_clean_words(text: str) -> int:
    tokens = re.findall(r"[A-Za-z0-9']+", text)
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
        total_dur = min(raw_dur, last_word_end + 0.06)
    else:
        total_dur = raw_dur

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

    font_title = load_font(FONT_SEGOE_BOLD, 48)

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

            if top_clean_title:
                tb = odraw.textbbox((0, 0), top_clean_title, font=font_title)
                tw = tb[2] - tb[0]
                odraw.text(
                    ((WIDTH - tw) // 2, 140),
                    top_clean_title,
                    font=font_title,
                    fill=(255, 255, 255, 255),
                    stroke_width=6,
                    stroke_fill=(0, 0, 0, 230),
                )

            draw_active_word_captions(
                odraw,
                phrases,
                t,
                accent_color=accent_color,
                y_pos=1420,
            )

            comp = Image.alpha_composite(frame.convert("RGBA"), overlay).convert("RGB")
            proc.stdin.write(comp.tobytes())
            f_idx += 1

    proc.stdin.close()
    proc.wait()
    print(f"✅ [{ending_mode.upper()} 엔딩] 클린 풀스크린 쇼츠 완성: {output_mp4} (컷 전환: {[round(c, 2) for c in cut_times]}초)")


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
            shot_scripts=shots_loop,
            ending_mode="loop",
        )
