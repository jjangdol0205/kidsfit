#!/usr/bin/env node
/**
 * scripts/send_daily_6am_shorts_reels.js
 * KISFIT Bio Labs (https://kisfitglobal.com) — Daily 06:00 AM KST Google Flow 1080p 3D Documentary Shorts & Reels Auto-Sender
 *
 * Delivers 1 episode per day at 06:00 AM KST (Episode 1 -> 2 -> 3 -> 4 -> 5) in strict sequential order:
 *   1. [Video MP4] Google Flow 1080p Clean Fullscreen 3D Documentary Short (Single Best Version)
 *   2. [Order 1/3 · YouTube Shorts Title] Guide + 100% Pure Plain-Text English Title Bubble
 *   3. [Order 2/3 · YouTube Shorts Description & Pinned Comment] Guide + 100% Pure Plain-Text English Description Bubble
 *   4. [Order 3/3 · Instagram Reels Caption (@kisfitglobal)] Guide + 100% Pure Plain-Text English Reels Caption Bubble
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const {
  getTelegramConfig,
  telegramApiRequest
} = require('./telegram-notify');

const ROOT_DIR = path.resolve(__dirname, '..');
const VIDEOS_DIR = path.join(ROOT_DIR, 'flow_shorts_studio', 'ai_shorts_output');
const STATE_FILE = path.join(ROOT_DIR, 'logs', 'daily_6am_shorts_reels_state.json');

const SHORTS_REELS_CATALOG = [
  {
    ep: 1,
    filename: 'US_KISFIT_01_GrowthPlate_SleepLock_1A_Punchline.mp4',
    koTopic: '1화: 밤 10시 이후 수면 시 성장판 잠김 3D 인체·뇌과학 다큐 (Growth Plate Sleep Lock)',
    ytTitle: 'What Happens If Your Child Sleeps After 10 PM? 🦴🌙 #Shorts',
    ytDescription: `If your child goes to sleep after 10 PM tonight, their bone growth plates literally lock shut.

Pediatric endocrinology & sleep neuroscience data reveal:
1) The 10 PM – 2 AM Slow-Wave Surge: Up to 70% of a child's daily Human Growth Hormone (GH) is secreted during the first deep slow-wave sleep cycle between 10 PM and 2 AM.
2) Blue Light Cortisol Spike: Late-night tablet or bedroom light suppresses melatonin, spikes cortisol, and stops chondrocyte cartilage cells inside the knee growth plates from multiplying.
3) 2 Full Inches of Adult Stature: Missing that deep sleep window consistently can cost up to 2 inches (5 cm) of final adult height.

🔬 Check your child's exact US CDC Growth Percentile & Final Adult Height Projection in 30 seconds:
https://kisfitglobal.com/?preset=elem_high

#Shorts #ChildGrowth #ParentingScience #SleepScience #KisFit`,
    igReelsCaption: `What Happens If Your Child Sleeps After 10 PM? 🌙🦴

If your child goes to sleep after 10 PM, their knee growth plates miss up to 70% of the night's Human Growth Hormone surge:

🧠 1. The 10 PM – 2 AM Deep Sleep Window:
Growth hormone isn't released evenly all night—it fires in a massive pulse during deep Stage-3 slow-wave sleep between 10 PM and 2 AM.

📱 2. Why Screens Lock the Growth Plates:
Blue light hitting the retina at night triggers cortisol and suppresses pituitary GH signaling, freezing cartilage cell division inside the epiphyseal plates.

📏 3. The 9:00 PM Lights-Out Protocol:
Dimming bedroom lights 45 minutes before bed restores natural melatonin and protects up to 2 full inches of genetic height potential.

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high to run your child's free 30-second US CDC Growth Percentile & Final Height Scan!

#ChildGrowth #KidsSleep #ParentingScience #GrowingTaller #KisFit`
  },
  {
    ep: 2,
    filename: 'US_KISFIT_02_BedtimeSugar_InsulinBlock_1A_Punchline.mp4',
    koTopic: '2화: 취침 전 단 음료·당분이 인슐린을 폭발시켜 성장호르몬을 4시간 잠그는 3D 다큐 (Bedtime Sugar & Insulin Block)',
    ytTitle: 'Why 1 Sweet Drink Before Bed Stops Bone Growth for 4 Hours 🥛🚫 #Shorts',
    ytDescription: `One glass of chocolate milk, juice, or a sweet snack before bed can shut down your child's overnight bone growth for 4 straight hours.

Clinical pediatric endocrinology explains why:
1) The Insulin-GH Switch: The moment sugar enters the bloodstream at night, the pancreas floods the body with insulin.
2) Pituitary Brake: High blood insulin acts like an emergency brake on the brain's pituitary gland, blocking nocturnal Human Growth Hormone (GH) secretion during the critical first 4 hours of sleep.
3) The 2-Hour Rule: Stop all sugary drinks and high-glycemic carbs 2 hours before bedtime—swap for plain water or low-glycemic protein.

🔬 Run your child's free 30-second US CDC Growth Curve & Nutritional Trajectory Check at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #KidsNutrition #ChildGrowth #ParentingScience #KisFit`,
    igReelsCaption: `Why 1 Sweet Drink Before Bed Stops Bone Growth for 4 Hours 🥛⚠️

Pediatric endocrinology studies show that a single spike in blood sugar and insulin before sleep can block nocturnal Growth Hormone release for up to 4 hours:

🩸 1. The Insulin vs. Growth Hormone Lock:
Your child's pituitary gland cannot release peak Growth Hormone while blood insulin levels are elevated.

🛑 2. The 4-Hour Blackout:
Eating sweet snacks or flavored milk at 8:30 PM keeps insulin high right through the 10 PM – 2 AM deep sleep growth window.

✅ 3. What to Do Tonight:
Keep the last 2 hours before bedtime completely sugar-free—offer warm water or a small low-glycemic protein bite instead!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high to check your child's exact US CDC Growth Percentile in 30 seconds!

#KidsNutrition #ChildGrowth #ParentingScience #GrowingTaller #KisFit`
  },
  {
    ep: 3,
    filename: 'US_KISFIT_03_MouthBreathing_Craniofacial_1A_Punchline.mp4',
    koTopic: '3화: 잘 때 입 벌리고 자는 구강호흡이 아이 얼굴형과 뇌 산소·성장을 바꾸는 3D 다큐 (Mouth Breathing & Airway)',
    ytTitle: 'Never Ignore a Child Sleeping With Their Mouth Open 😮‍💨🧠 #Shorts',
    ytDescription: `If your child sleeps with their mouth open at night, it is quietly reshaping their jaw structure and shrinking their overnight growth.

Pediatric airway & craniofacial studies reveal:
1) Craniofacial Narrowing: When a child breathes through their mouth instead of their nose, the tongue drops from the palate, narrowing the upper jaw and airway.
2) Nocturnal Micro-Arousals: Mouth breathing drops blood oxygen saturation and fractures deep slow-wave sleep—shutting down night-time Growth Hormone pulses and causing daytime ADHD-like fatigue.
3) Nasal Airway Check: Clearing nasal congestion, bedroom humidity control, and resting tongue-on-palate posture restore deep restorative sleep.

🔬 Check your child's Airway, Sleep & US CDC Growth Percentile in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #MouthBreathing #ChildGrowth #AirwayHealth #KisFit`,
    igReelsCaption: `Never Ignore a Child Sleeping With Their Mouth Open 😮‍💨🌙

Sleeping with an open mouth isn't just a cute habit—pediatric sleep and craniofacial researchers warn it directly impacts both facial bone development and height growth:

🦷 1. The Tongue-Palate Rule:
Nasal breathing keeps the tongue resting against the roof of the mouth, naturally shaping a wide, healthy upper jaw and airway.

🧠 2. Broken Deep Sleep = Lost Growth Hormone:
Nocturnal mouth breathing lowers oxygen saturation and pulls the brain out of Stage-3 slow-wave sleep, cutting off overnight Growth Hormone secretion.

🌿 3. Tonight's Bedroom Fix:
Check for dust allergies, keep bedroom humidity at 45–55%, and train gentle nasal breathing before lights-out.

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Growth & Sleep Trajectory Scan!

#MouthBreathing #AirwayHealth #ChildGrowth #KidsSleep #KisFit`
  },
  {
    ep: 4,
    filename: 'US_KISFIT_04_TechNeck_SpinalCompression_1A_Punchline.mp4',
    koTopic: '4화: 스마트폰 60도 거북목이 성장기 목뼈에 60파운드 압력을 가해 숨은 키 2인치를 가두는 3D 다큐 (Tech Neck & Spine)',
    ytTitle: 'How "Tech Neck" Steals 2 Hidden Inches of Your Child\'s Height 📱🦴 #Shorts',
    ytDescription: `Your child might already have up to 2 hidden inches of height trapped inside a compressed spine.

Spinal biomechanics research reveals:
1) 60 Pounds of Cervical Load: Tilting the head forward 60 degrees to look at a smartphone or tablet places 60 lbs (27 kg) of crushing downward force on a growing cervical spine.
2) Disc Dehydration & Kyphosis: Chronic slouching flattens intervertebral discs and locks thoracic rounding before the growth plates fuse.
3) 10-Minute Daily Wall Decompression: Eye-level screen stands + daily wall posture alignment and doorway bar hangs decompress the spine and unlock true natural stature.

🔬 Run your child's free 30-second US CDC Height & Posture Trajectory Check at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #PostureCorrection #TechNeck #ChildGrowth #KisFit`,
    igReelsCaption: `How "Tech Neck" Steals 2 Hidden Inches of Your Child's Height 📱🦴

Orthopedic biomechanics studies show that tilting the head forward 60 degrees puts 60 pounds of crushing pressure on a growing spine—hiding up to 2 inches of natural height:

⚠️ 1. The 60-Pound Spinal Load:
A child's head weighs ~10 lbs in neutral alignment, but tilting down at a screen multiplies that load up to 60 lbs on the neck and upper back.

📏 2. Flattened Discs & Hidden Stature:
Hours of slouching squeeze fluid out of spinal discs and round the shoulders during peak growth years.

🟢 3. The Daily Decompression Fix:
Raise tablets to eye level and practice 2 minutes of wall alignment + doorway bar hangs before bed to rehydrate the spine!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Growth Percentile & Posture Protocol!

#PostureCorrection #TechNeck #ChildGrowth #SpineHealth #KisFit`
  },
  {
    ep: 5,
    filename: 'US_KISFIT_05_Fingertip_PrefrontalBrain_1A_Punchline.mp4',
    koTopic: '5화: 만 3세 아이가 손끝을 쓸 때 대뇌 운동피질 30%와 전두엽 시냅스가 폭발하는 3D 뇌과학 다큐 (Fingertip & Prefrontal IQ)',
    ytTitle: 'Why Toddlers Yell "I Do It Myself!" (3D Brain Science) 🧠🖐️ #Shorts',
    ytDescription: `When your 3-year-old yells "I do it myself!", their brain is literally wiring its future IQ through their fingertips.

Developmental neuroscience (Penfield's Cortical Homunculus & Harvard Center on the Developing Child) proves:
1) 30% of the Motor Cortex Is in the Hands: Nearly one-third of the human brain's motor cortex is wired directly to the nerves in the fingertips and thumb.
2) High-Frequency Prefrontal Wiring: Every time a young child struggles to fasten a button, stack blocks, or pour water, high-frequency bio-electrical signals shoot straight into the prefrontal executive function cortex.
3) The 2-Minute Patience Rule: Taking over for them shuts that synaptic window down—giving them 2 extra minutes of tactile autonomy builds stronger math and focus circuits for life.

🧠 Check your child's exact Age-in-Months Brain Development & Growth Score in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #BrainDevelopment #ParentingScience #Neuroscience #KisFit`,
    igReelsCaption: `Why Toddlers Yell "I Do It Myself!" (3D Brain Science) 🧠🖐️

3D neuroscience mapping shows that nearly 30% of the human brain's motor cortex is connected directly to the nerves in the hands and thumb:

⚡ 1. The Fingertip-to-Prefrontal Highway:
When a young child struggles to button a shirt, stack wooden blocks, or use tongs, their fingertips fire rapid electrical impulses straight into the prefrontal cortex.

🧬 2. Golden Synaptic Myelination:
That "stubborn" urge to do everything solo is actually a biological drive to wire executive function, working memory, and future math circuits.

🌱 3. The 2-Minute Rule:
Instead of stepping in to do it faster, give them 2 extra minutes of hands-on practice—you are literally building their brain's hardware!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second Age-in-Months Brain & Growth Milestone Scan!

#BrainDevelopment #ParentingScience #ChildDevelopment #FineMotorSkills #KisFit`
  },
  {
    ep: 6,
    filename: 'US_KISFIT_06_PickyEater_Zinc_IGF1_1A_Punchline.mp4',
    koTopic: '6화: 고기·채소 뱉어내는 편식 아이, 혀 미각세포 아연(Zinc) 결핍과 간 IGF-1 성장호르몬 고갈 3D 다큐 (Picky Eater & Zinc Deficiency)',
    ytTitle: 'Why Picky Eaters Spit Out Meat & Veggies (It\'s Not Behavior) 🥩🧬 #Shorts',
    ytDescription: `When a picky eater spits out meat and green vegetables, their tongue is literally tasting metal.

Pediatric clinical nutrition & endocrinology data reveal:
1) 10-Day Taste Bud Renewal: Human taste buds regenerate every 10 days using a zinc-dependent salivary enzyme called carbonic anhydrase VI (gustin).
2) Hypogeusia & Metallic Distortion: When a child's zinc stores drop, high-protein foods like beef, poultry, and broccoli taste bitter or metallic—triggering sensory food refusal.
3) Hepatic IGF-1 Growth Lock: Zinc is also required for the liver to synthesize IGF-1 (Insulin-like Growth Factor 1), the primary hormone that drives bone lengthening at the growth plates.

🔬 Check your child's exact US CDC Growth Percentile & Nutrition Score in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #PickyEater #KidsNutrition #ChildGrowth #KisFit`,
    igReelsCaption: `Why Picky Eaters Spit Out Meat & Veggies (It's Not Behavior) 🥩👅

Pediatric nutrition research shows that sudden refusal of meat and green vegetables is often a biological sign of low cellular Zinc:

🧬 1. The 10-Day Taste Bud Enzyme:
Human taste buds renew every 10 days using a zinc-dependent salivary enzyme called carbonic anhydrase. Without enough zinc, taste receptors dull and distort protein flavors into a bitter, metallic taste.

🦴 2. The Liver IGF-1 Growth Connection:
Zinc doesn't just control appetite—it activates the liver's production of IGF-1, the master hormone that tells your child's leg bones to grow longer.

✅ 3. The 4-Week Appetite Reset:
Restoring daily bioavailable zinc (via pumpkin seeds, eggs, beef, or pediatric supplementation) wakes up natural taste bud sensitivity within 4 weeks!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high to run your child's free 30-second US CDC Growth & Nutrition Scan!

#PickyEater #KidsNutrition #ChildGrowth #ParentingScience #KisFit`
  },
  {
    ep: 7,
    filename: 'US_KISFIT_07_VitaminK2_Osteocalcin_Bone_1A_Punchline.mp4',
    koTopic: '7화: 칼슘 우유만 마시면 뼈로 안 가는 이유: 비타민 K2 오스테오칼신 스위치 3D 다큐 (Vitamin K2 & Osteocalcin)',
    ytTitle: 'Why Drinking Calcium Milk Alone Won\'t Make Bones Grow Taller 🥛🦴 #Shorts',
    ytDescription: `Drinking gallons of calcium milk without one specific vitamin can leave growing bones starving.

Pediatric bone metabolism research explains the D3 + K2 synergy:
1) Vitamin D3 Is Only the Doorway: Vitamin D3 absorbs calcium from the gut into the bloodstream, but it cannot direct where that calcium goes next.
2) The Osteocalcin Switch (Vitamin K2 MK-7): To lock calcium into the epiphyseal growth plates, the body relies on a bone-building protein called osteocalcin—which stays completely inactive without Vitamin K2.
3) Directed Bone Mineralization: Pairing Vitamin D3 with K2 (MK-7) activates osteocalcin claws that route floating blood calcium straight into growing trabecular bone matrix.

🔬 Run your child's free 30-second US CDC Bone Growth & Stature Check at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #VitaminK2 #ChildGrowth #BoneHealth #KisFit`,
    igReelsCaption: `Why Drinking Calcium Milk Alone Won't Make Bones Grow Taller 🥛🦴

Pediatric bone biology reveals why calcium and Vitamin D3 alone aren't enough to maximize bone lengthening:

🩸 1. Vitamin D3 Only Gets Calcium Into the Blood:
Vitamin D3 helps the gut absorb calcium into the bloodstream—but without guidance, that calcium just floats aimlessly.

🔑 2. Vitamin K2 Activates the "Osteocalcin" Claws:
Vitamin K2 (MK-7) switches on a specialized bone protein called osteocalcin, which grabs floating calcium ions and locks them directly into the growing bone matrix.

🧀 3. The D3 + K2 Pairing Rule:
Always pair calcium-rich meals and Vitamin D3 with Vitamin K2 (found in grass-fed dairy, egg yolks, fermented foods, or a D3+K2 drop) so every milligram reaches the growth plates!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Bone Growth & Percentile Check!

#VitaminK2 #KidsNutrition #ChildGrowth #BoneHealth #KisFit`
  },
  {
    ep: 8,
    filename: 'US_KISFIT_08_MorningSun_CircadianGH_1A_Punchline.mp4',
    koTopic: '8화: 밤 10시 성장호르몬은 아침 8시 햇빛이 결정한다: 망막-송과선 14시간 생체시계 3D 다큐 (Morning Sunlight & 10 PM Growth Hormone)',
    ytTitle: 'Your Child\'s 10 PM Growth Hormone Surge Actually Starts at 8 AM ☀️🌙 #Shorts',
    ytDescription: `Your child's 10 PM nighttime growth hormone surge actually starts at 8 AM in the morning.

Circadian neuroscience & pediatric endocrinology explain the 14-hour timer:
1) Retinal Master Clock Reset: When natural morning sunlight hits the human retina between 7 AM and 9 AM, it triggers a 14-hour biological countdown timer inside the brain's suprachiasmatic nucleus (SCN).
2) The Serotonin-to-Melatonin Pipeline: Morning outdoor light converts tryptophan amino acids into daytime serotonin—which transforms into deep-sleep melatonin inside the pineal gland exactly 14 hours later after dark.
3) 10 Minutes Outdoors Before School: Just 10 minutes of natural morning sunlight (without sunglasses or window glass) locks in early Stage-3 slow-wave sleep and maximizes the 10 PM Growth Hormone pulse.

🔬 Track your child's exact US CDC Growth Curve & Sleep Score in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #CircadianRhythm #ChildGrowth #KidsSleep #KisFit`,
    igReelsCaption: `Your Child's 10 PM Growth Hormone Surge Actually Starts at 8 AM ☀️🧠

Neuroscience shows that your child's 10 PM Growth Hormone surge is controlled by a 14-hour biological timer that starts the moment morning sunlight hits their eyes:

👁️ 1. The 14-Hour Hypothalamus Timer:
Natural morning photons hitting the retina signal the brain's master clock (SCN) to start a 14-hour countdown to nighttime sleepiness.

🧪 2. Serotonin by Day -> Melatonin by Night:
Morning sunlight boosts daytime serotonin production, which the pineal gland converts directly into deep-sleep melatonin 14 hours later once the bedroom goes dark.

🌤️ 3. The 10-Minute Morning Protocol:
Have your child step outside into natural daylight for 10 minutes before school—it naturally shifts bedtime earlier and unlocks peak overnight Growth Hormone!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Growth Curve & Sleep Scan!

#KidsSleep #ChildGrowth #CircadianRhythm #ParentingScience #KisFit`
  },
  {
    ep: 9,
    filename: 'US_KISFIT_09_Jumping_Piezoelectric_Bone_1A_Punchline.mp4',
    koTopic: '9화: 점프할 때만 켜지는 뼈 속 자가발전기: 골격 압전효과(Piezoelectricity)와 조골세포 3D 다큐 (Jumping & Bone Piezoelectricity)',
    ytTitle: 'The Hidden "Electrical Generator" Inside Growing Bones ⚡🏀 #Shorts',
    ytDescription: `Human bones have a built-in electrical generator that only turns on when you jump.

Orthopedic mechanobiology (Wolff's Law & Bone Piezoelectricity) reveals:
1) Collagen Piezoelectric Sparks: Every time vertical impact hits the heel and knee during jumping rope or basketball, microscopic collagen fibers inside the bone bend and generate tiny bio-electrical charges.
2) Osteoblast Recruitment: Those micro-currents attract osteoblast bone-building cells straight to the epiphyseal growth plate, multiplying chondrocyte cartilage thickness.
3) 15 Minutes of Daily Vertical Loading: Just 15 minutes of daily jumping rope, hops, or basketball sparks measurable bone mineral density and longitudinal growth.

🔬 Check your child's exact US CDC Height Percentile & Exercise Protocol in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #ChildGrowth #GrowingTaller #BoneGrowth #KisFit`,
    igReelsCaption: `The Hidden "Electrical Generator" Inside Growing Bones ⚡🦴

Orthopedic biomechanics and bone mechanobiology explain why vertical jumping is the #1 physical stimulus for height growth:

⚡ 1. The Bone Piezoelectric Effect:
When a child jumps and lands on their feet, microscopic collagen fibers inside the tibia and femur flex—generating tiny negative bio-electrical charges.

🧱 2. Waking Up Osteoblast Cells:
Those micro-electric pulses act like a magnet for osteoblast bone-building cells, drawing calcium and cartilage proliferation straight to the knee growth plates.

🏀 3. The 15-Minute Daily Jump Rule:
Just 15 minutes of jumping rope, basketball, or vertical hops after school activates dormant growth plate signaling better than any passive stretch!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Height Percentile & Growth Workout Plan!

#GrowingTaller #ChildGrowth #KidsFitness #BoneHealth #KisFit`
  },
  {
    ep: 10,
    filename: 'US_KISFIT_10_WorkingMemory_MathOverload_1A_Punchline.mp4',
    koTopic: '10화: 연산은 빠른데 문장제 수학만 얼어붙는 이유: 전두엽 작업기억 4청크 한계와 바 모델링 3D 다큐 (Working Memory & Math Word Problems)',
    ytTitle: 'Why Smart Kids Freeze on Math Word Problems (3D Brain Scan) 🧠📐 #Shorts',
    ytDescription: `Why do smart kids solve number equations fast, but freeze on math word problems?

Cognitive neuroscience (Cowan's 4-Chunk Working Memory Limit) explains why:
1) The Prefrontal 4-Chunk Bottleneck: Inside the human prefrontal cortex, working memory can only hold 3 to 4 chunks of active information at the exact same time.
2) Neural Buffer Overload: Reading 4 long sentences of text while trying to hold numbers and calculate in your head overloads the prefrontal buffer—erasing the first clue before the child reaches the question mark.
3) The Visual Bar-Model Fix: Teaching your child to sketch a simple geometric bar diagram on paper offloads 70% of working memory strain onto the visual cortex immediately.

🧠 Test your child's 5-Axis Brain LQ & Cognitive Growth Score in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #MathTips #WorkingMemory #BrainDevelopment #KisFit`,
    igReelsCaption: `Why Smart Kids Freeze on Math Word Problems (3D Brain Scan) 🧠📝

Cognitive neuroscience proves it is NOT a lack of math talent—it's a prefrontal working memory bottleneck:

🔴 1. The 4-Chunk Brain Limit:
A child's prefrontal working memory can only hold 3 to 4 pieces of information at once. Reading a 4-sentence story while calculating in their head sparks cognitive overload and erases the first clue.

📏 2. Why "Doing It in Your Head" Backfires:
Forcing kids to solve multi-step word problems mentally drains 100% of their prefrontal RAM before they even choose an operation.

✏️ 3. The Visual Bar-Diagram Hack:
Have them draw a simple rectangular bar model after every single sentence—it offloads 70% of brain strain onto paper and unlocks instant math clarity!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high to test your child's free 5-Axis Brain LQ & Growth Score in 30 seconds!

#MathTips #BrainDevelopment #WorkingMemory #ParentingScience #KisFit`
  },
  {
    ep: 11,
    filename: 'US_KISFIT_11_Ferritin_RestlessSleep_GH_1A_Punchline.mp4',
    koTopic: '11화: 밤새 이불 차고 뒤척이는 아이: 뇌 저장철(페리틴) 결핍과 척수 도파민·성장호르몬 수면 3D 다큐 (Ferritin & Restless Sleep)',
    ytTitle: 'Why Kids Kick Off the Blankets & Toss All Night (3D Brain Scan) 🛏️🧠 #Shorts',
    ytDescription: `If your child kicks off the blankets and tosses all night, their brain may be silently starving for stored iron (ferritin).

Pediatric sleep medicine & neurology data reveal:
1) The Ferritin-Dopamine Connection: Inside the central nervous system, a protein called ferritin holds the iron required to regulate spinal dopamine pathways at night.
2) Nocturnal Micro-Twitches (<50 ng/mL): When serum ferritin drops below 50 ng/mL, involuntary micro-twitches fire in the legs and pull the brain out of Stage-3 slow-wave Growth Hormone sleep.
3) Iron + Vitamin C Synergy: Pairing iron-rich foods (beef, lentils, spinach) with Vitamin C locks in motionless deep sleep and restores overnight Growth Hormone pulses.

🔬 Check your child's exact US CDC Growth & Sleep Score in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #KidsSleep #RestlessSleep #ChildGrowth #KisFit`,
    igReelsCaption: `Why Kids Kick Off the Blankets & Toss All Night (3D Brain Scan) 🛏️🧠

Pediatric sleep researchers warn that tossing, turning, and kicking off blankets all night is often a biological sign of low stored iron (Ferritin):

🧬 1. The Spinal Dopamine Regulator:
Inside the nervous system, ferritin stores the iron needed to calm spinal dopamine pathways while your child sleeps.

⚡ 2. Hidden Leg Micro-Arousals:
When ferritin drops below optimal levels, tiny involuntary nerve twitches fire in the legs—waking the brain out of deep Stage-3 Growth Hormone sleep without your child even realizing it.

🍊 3. The Iron + Vitamin C Fix:
Pair iron-rich foods with Vitamin C at dinner to boost absorption up to 3x and lock in calm, motionless deep sleep!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Growth & Sleep Scan!

#KidsSleep #ChildGrowth #ParentingScience #IronDeficiency #KisFit`
  },
  {
    ep: 12,
    filename: 'US_KISFIT_12_Magnesium_NightLegCramps_1A_Punchline.mp4',
    koTopic: '12화: 밤마다 정강이 아파서 깨는 성장통의 진실: 마그네슘-칼슘 근육 잠김과 골막 장력 3D 다큐 (Magnesium & Growing Pains)',
    ytTitle: 'Why Kids Wake Up Crying From Night Leg Cramps ("Growing Pains") 🦵🌙 #Shorts',
    ytDescription: `When a child wakes up crying from aching shins at night, it is rarely just harmless "growing pains."

Pediatric orthopedic & cellular physiology studies explain:
1) Nocturnal Bone Lengthening Tension: Up to 90% of bone lengthening happens in the dark during sleep, stretching surrounding calf and shin muscles like tight guitar strings.
2) The Calcium-Magnesium Muscle Lock: Calcium causes muscle fibers to contract, while magnesium is the biological key that unlocks and relaxes them. Without enough cellular magnesium, stretched fibers lock into painful nocturnal micro-spasms.
3) Evening Magnesium Protocol: Magnesium-rich evening foods (banana, warm milk, pumpkin seeds, or pediatric magnesium glycinate) relax tight periosteal tissue before bed.

🔬 Run your child's free 30-second US CDC Bone Growth Check at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #GrowingPains #ChildGrowth #KidsNutrition #KisFit`,
    igReelsCaption: `Why Kids Wake Up Crying From Night Leg Cramps ("Growing Pains") 🦵🌙

When a child wakes up holding their shins at 2 AM, cellular physiology shows what is actually happening inside their legs:

🎸 1. Stretched Like Guitar Strings:
Because bones lengthen primarily during nighttime sleep, the surrounding periosteum and calf muscles are pulled under high mechanical tension.

🔒 2. The Calcium-Magnesium Gate:
Calcium contracts muscle fibers, while Magnesium relaxes them. When cellular magnesium is low, stretched leg muscles cannot flush out calcium ions—locking into painful night cramps.

🍌 3. Tonight's Bedtime Relief:
Warm leg baths + evening magnesium (bananas, oats, seeds, or gentle pediatric magnesium) release muscle tension so bones can lengthen pain-free!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Bone Growth & Percentile Scan!

#GrowingPains #ChildGrowth #KidsNutrition #ParentingTips #KisFit`
  },
  {
    ep: 13,
    filename: 'US_KISFIT_13_BreakfastProtein_Arginine_IGF1_1A_Punchline.mp4',
    koTopic: '13화: 아침 달콤한 시리얼의 함정과 간 IGF-1 성장인자를 깨우는 아르기닌·단백질 3D 다큐 (Morning Protein & Arginine IGF-1)',
    ytTitle: 'Why a Bowl of Cereal for Breakfast Stalls Morning Bone Growth 🥣🥚 #Shorts',
    ytDescription: `A bowl of sweet cereal for breakfast leaves your child's bone growth engine idling all morning.

Pediatric nutrition & endocrinology data reveal:
1) The 10 AM Glucose-Cortisol Crash: Refined morning carbs spike blood sugar for 40 minutes, then crash energy and trigger stress cortisol by 10 AM in the classroom.
2) The Amino Acid IGF-1 Switch: Growing bones require essential amino acids—specifically L-Arginine and Leucine—in the morning to instruct the liver to synthesize IGF-1 bone growth hormone.
3) The Eggs + Greek Yogurt Upgrade: Swapping sugary cereal for eggs and Greek yogurt doubles morning amino acid availability and sustains focus until lunch.

🔬 Check your child's exact US CDC Growth Curve & Nutrition Score at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #KidsBreakfast #ChildGrowth #ParentingScience #KisFit`,
    igReelsCaption: `Why a Bowl of Cereal for Breakfast Stalls Morning Bone Growth 🥣🥚

Endocrinology and pediatric nutrition studies show that what your child eats at 7:30 AM sets their hormonal trajectory for the entire day:

📉 1. The 40-Minute Sugar Crash:
Sweet refined cereal spikes insulin and blood glucose, followed by a mid-morning crash that elevates stress cortisol and drains classroom focus.

🧬 2. Bones Need Arginine & Leucine:
Your child's liver cannot manufacture optimal IGF-1 (Insulin-like Growth Factor 1) without a morning supply of complete protein amino acids.

🍳 3. The 2-Minute Breakfast Swap:
Pair whole eggs or Greek yogurt with berries—it fuels steady prefrontal brain focus and delivers the exact amino acid building blocks growing bones crave!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Growth Curve Scan!

#KidsBreakfast #KidsNutrition #ChildGrowth #GrowingTaller #KisFit`
  },
  {
    ep: 14,
    filename: 'US_KISFIT_14_LoudWhiteNoise_AuditoryCortex_1A_Punchline.mp4',
    koTopic: '14화: 머리맡 시끄러운 백색소음기가 밤새 아이 청각피질을 깨워 델타파 숙면을 막는 3D 뇌과학 다큐 (Loud White Noise & Auditory Brain)',
    ytTitle: "Stop Putting Loud White Noise Right Next to Your Child's Pillow 🔊🧠 #Shorts",
    ytDescription: `Leaving a loud white noise machine right next to your child's pillow all night keeps their brain half awake.

Pediatric audiology & sleep neuroscience studies (AAP Guidelines) warn:
1) Nonstop Cochlear Stimulation: Even while a child's eyes are closed, the inner ear cochlea converts continuous 70 dB static into bio-electrical nerve impulses.
2) Auditory Cortex Arousal: That nonstop acoustic stream forces the temporal auditory cortex to process noise all night, reducing restorative Stage-3 delta slow-wave sleep.
3) The 7-Foot / 50 dB Rule: Place sound machines at least 7 feet (2 meters) away from the bed, keep volume below 50 dB (soft shower level), and set a timer to fade out after sleep onset.

🔬 Check your child's Sleep Quality & US CDC Growth Score in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #WhiteNoise #KidsSleep #BrainDevelopment #KisFit`,
    igReelsCaption: `Stop Putting Loud White Noise Right Next to Your Child's Pillow 🔊🧠

American Academy of Pediatrics (AAP) and sleep neuroscience researchers warn that loud, all-night sound machines can quietly disrupt deep brain recovery:

👂 1. The Ears Never Close:
Even in sleep, hair cells inside the inner ear cochlea convert continuous static noise into electrical signals that travel straight to the brain.

⚡ 2. An Exhausted Auditory Cortex:
When a speaker sits inches from the pillow at 65–75 dB, the brain's auditory cortex stays active all night instead of sinking into silent Stage-3 delta sleep.

📏 3. The Safe Sleep Sound Rule:
Move the machine at least 7 feet away, keep volume under 50 dB, and let it fade off once your child is deeply asleep!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second Sleep & CDC Growth Scan!

#KidsSleep #WhiteNoise #BrainDevelopment #ParentingScience #KisFit`
  },
  {
    ep: 15,
    filename: 'US_KISFIT_15_FastCartoons_DopamineFocus_1A_Punchline.mp4',
    koTopic: '15화: 2초마다 화면이 바뀌는 빠른 만화가 아이 전두엽 도파민과 집중력을 앗아가는 3D 뇌과학 다큐 (Fast-Cut Cartoons & Dopamine Focus)',
    ytTitle: "What 2-Second Fast-Cut Cartoons Do to a Child's Brain 📺🧠 #Shorts",
    ytDescription: `Cartoons that cut to a new scene every 2 seconds are hijacking your child's prefrontal attention span.

Developmental cognitive neuroscience (University of Virginia & AAP) explains:
1) The Brain Stem Orienting Reflex: Every rapid camera cut and neon flash triggers an involuntary orienting reflex in the brain stem, flooding the striatum with cheap dopamine.
2) Receptor Downregulation: After 20 minutes of hyper-fast pacing, normal real-world books, puzzles, and classroom teachers feel painfully slow to a downregulated brain.
3) The Slow-Paced Reset: Switching to slow-paced stories (>6 seconds per shot) and hands-on spatial blocks restores calm prefrontal gamma focus waves.

🧠 Test your child's 5-Axis Brain LQ & Focus Score in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #ScreenTime #BrainDevelopment #AttentionSpan #KisFit`,
    igReelsCaption: `What 2-Second Fast-Cut Cartoons Do to a Child's Brain 📺🧠

Neuroscience shows it isn't just "screen time"—it is the speed of the scene cuts that rewires a child's attention span:

⚡ 1. Hijacking the Orienting Reflex:
Every time a cartoon cuts to a new angle every 2 seconds, it forces an involuntary alarm reflex in the brain stem and floods the midbrain with artificial dopamine spikes.

📉 2. Why Real Life Feels "Boring" After:
To protect itself from overstimulation, the brain dials down dopamine receptors—leaving the prefrontal cortex sluggish and irritable when asked to read a book or listen in class.

🧩 3. The Slow-Media Fix:
Choose calm, slow-paced shows with natural scene lengths and follow up with tactile hands-on play to rebuild deep executive focus!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high to test your child's free 5-Axis Brain LQ & Growth Score in 30 seconds!

#ScreenTime #BrainDevelopment #ParentingScience #ChildDevelopment #KisFit`
  },
  {
    ep: 16,
    filename: 'US_KISFIT_16_HeavyBackpack_SpineLoad_1A_Punchline.mp4',
    koTopic: '16화: 한쪽 어깨로만 메는 무거운 책가방이 척추 성장판 한쪽만 누르는 생체역학 3D 다큐 (Heavy Backpack & Spine Growth)',
    ytTitle: 'Never Let Your Child Wear a Heavy Backpack on One Shoulder 🎒🦴 #Shorts',
    ytDescription: `Slinging a heavy school backpack over one shoulder unevenly crushes growing spinal cartilage.

Pediatric orthopedic biomechanics (Hueter-Volkmann Law) reveals:
1) Lateral Lumbar Tilt: When a backpack exceeds 10% of a child's body weight on one shoulder, the lumbar spine tilts sideways to keep the head centered over the pelvis.
2) Asymmetric Growth Plate Compression: According to the orthopedic Hueter-Volkmann law, uneven mechanical pressure slows cartilage proliferation on the compressed side of growing vertebrae.
3) The 10% Dual-Strap Rule: Keep total backpack weight under 10% of body weight and snug both padded straps so the pack rests high against the mid-back.

🔬 Check your child's Posture & US CDC Height Projection in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #SpineHealth #PostureCorrection #ChildGrowth #KisFit`,
    igReelsCaption: `Never Let Your Child Wear a Heavy Backpack on One Shoulder 🎒🦴

Orthopedic biomechanics reveals how carrying a heavy school bag on one shoulder directly impacts spinal growth plates:

⚠️ 1. Asymmetric Disc Crushing:
Slinging weight onto one shoulder forces the lumbar spine into a functional S-curve, concentrating crushing force onto one side of the soft intervertebral discs.

📏 2. The Hueter-Volkmann Bone Law:
Growing vertebral growth plates respond to mechanical load—sustained uneven compression slows bone lengthening on the overloaded side while the spine is still maturing.

✅ 3. The 10-Second Morning Check:
Use both padded straps tightened high above the waist, and keep backpack weight under 10% of your child's body weight!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Height & Posture Scan!

#PostureCorrection #SpineHealth #ChildGrowth #ParentingTips #KisFit`
  },
  {
    ep: 17,
    filename: 'US_KISFIT_17_GutMicrobiome_NutrientAbsorption_1A_Punchline.mp4',
    koTopic: '17화: 비싼 영양제를 먹여도 장내 염증이 뼈 미네랄 30%를 튕겨내는 소장 융모 3D 다큐 (Gut Microbiome & Bone Mineral Absorption)',
    ytTitle: "Why Expensive Vitamins Fail If Your Child's Gut Is Inflamed 🦠🦴 #Shorts",
    ytDescription: `Even the best nutrition fails if an inflamed gut blocks 30% of bone minerals from entering the bloodstream.

Pediatric gastroenterology & bone nutrition science explain:
1) Microscopic Villi Absorption: Inside the small intestine, finger-like villi absorb calcium, iron, and zinc to fuel the bone growth plates.
2) Sugar & Microbiome Dysbiosis: Excess ultra-processed sugar starves beneficial gut bacteria, inflaming intestinal tight junctions and blocking up to 30% of mineral transport while lowering gut serotonin.
3) Prebiotic + Fermented Reset: Daily prebiotic fiber (berries, oats, greens) and live probiotics repair intestinal villi and reopen mineral absorption highways fast.

🔬 Check your child's US CDC Growth & Nutrition Absorption Score in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #GutHealth #KidsNutrition #ChildGrowth #KisFit`,
    igReelsCaption: `Why Expensive Vitamins Fail If Your Child's Gut Is Inflamed 🦠🦴

Pediatric nutrition science proves that height growth isn't about what your child swallows—it's about what their small intestine actually absorbs:

🛡️ 1. The Villi Mineral Gateway:
Calcium, iron, and zinc must pass through microscopic finger-like villi in the small intestine before they ever reach the knee growth plates.

🚫 2. How Ultra-Processed Snacks Block Growth:
Refined sugars and additives inflame the gut lining and starve beneficial flora, causing up to 30% of bone-building minerals to bounce right through unabsorbed.

🥣 3. Heal the Gut -> Unlock the Growth:
Pair daily probiotic yogurt or fermented foods with prebiotic fibers so every milligram of nutrition reaches growing bones and the vagus nerve!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Growth & Nutrition Scan!

#GutHealth #KidsNutrition #ChildGrowth #ParentingScience #KisFit`
  },
  {
    ep: 18,
    filename: 'US_KISFIT_18_Handwriting_HippocampusMemory_1A_Punchline.mp4',
    koTopic: '18화: 태블릿 타이핑보다 연필 손글씨가 해마 장기기억 회로를 3배 더 켜는 3D 뇌과학 다큐 (Handwriting vs Typing Brain Memory)',
    ytTitle: 'Why Writing With a Pencil Beats Tablet Typing by 300% (3D Brain EEG) ✏️🧠 #Shorts',
    ytDescription: `Typing notes on a tablet leaves 3 times fewer memory traces in a child's brain than writing by hand with a pencil.

High-density EEG neuroscience research (Van der Weel & Van der Meer, 2024) proves:
1) The Flat-Glass Monotony Trap: Tapping a glass screen or keyboard uses the exact same repetitive finger motion whether a child types the letter A or the letter Z.
2) Sensorimotor-Hippocampal Synchronization: Carving each letter by hand with a pencil forces the fine motor cortex, visual cortex, and deep hippocampus to synchronize in theta memory rhythm.
3) 15 Minutes of Daily Paper Sketching: Just 15 minutes of handwritten vocabulary and diagram sketching locks new concepts into long-term memory 3x faster.

🧠 Check your child's Cognitive Milestone & Brain LQ Score in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #BrainDevelopment #Handwriting #LearningTips #KisFit`,
    igReelsCaption: `Why Writing With a Pencil Beats Tablet Typing by 300% (3D Brain EEG) ✏️🧠

High-density 256-sensor brain EEG studies reveal a massive neurological difference between children who type on tablets and children who write by hand:

📱 1. Why Tablet Tapping Leaves the Brain Dim:
Pressing a flat glass key requires the exact same generic finger tap for every letter—barely activating deep memory networks.

⚡ 2. The Pencil-to-Hippocampus Superhighway:
Controlling pencil pressure, paper friction, and micro-strokes fires synchronized theta waves across the motor cortex, visual cortex, and hippocampus all at once!

📓 3. The 15-Minute Paper Rule:
Have your child write new vocabulary words and math diagrams with a real wooden pencil on paper—it triples long-term memory retention!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high to test your child's free 5-Axis Brain LQ & Growth Score in 30 seconds!

#BrainDevelopment #LearningTips #ParentingScience #StudyHacks #KisFit`
  },
  {
    ep: 19,
    filename: 'US_KISFIT_19_Hydration_CartilageMatrix_1A_Punchline.mp4',
    koTopic: '19화: 수분 부족 아이가 저녁에 키가 줄어드는 이유: 성장판 연골 80% 수분 매트릭스 3D 다큐 (Hydration & Growth Plate Cartilage)',
    ytTitle: 'Why Dehydrated Kids Are Measurably Shorter by Dinner Time 💧🦴 #Shorts',
    ytDescription: `Did you know a dehydrated child is measurably shorter at dinner time than when they woke up?

Orthopedic cartilage physiology explains why:
1) Growth Plates Are 80% Water: Human intervertebral spinal discs and epiphyseal knee growth plates are composed of nearly 80% water bound to proteoglycan collagen matrices.
2) Afternoon Hydrostatic Compression: When a child goes all afternoon at school without drinking water, hydrostatic turgor pressure inside the cartilage drops—compressing discs and slowing chondrocyte nutrient diffusion.
3) Steady Daytime Hydration: Sending a measured water bottle to school and sipping consistently keeps growth plate chondrocytes plump, pressurized, and dividing.

🔬 Track your child's exact US CDC Growth Curve in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #ChildGrowth #KidsHealth #GrowingTaller #KisFit`,
    igReelsCaption: `Why Dehydrated Kids Are Measurably Shorter by Dinner Time 💧🦴

Orthopedic biology reveals a hidden growth factor most parents overlook—cartilage hydration:

🧬 1. Growth Plates Are 80% Water:
Both your child's spinal discs and the soft epiphyseal growth plates in their knees rely on an 80% water-filled collagen matrix to maintain height and transport nutrients.

📉 2. The Dry-School-Day Compression:
When kids come home from school with a full, untouched water bottle, dehydrated cartilage loses hydrostatic pressure and compresses under gravity.

🚰 3. The Afternoon Hydration Habit:
Consistent water + natural electrolytes between 1 PM and 6 PM keeps chondrocyte cells plump and ready for tonight's Growth Hormone surge!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Growth Curve Scan!

#ChildGrowth #GrowingTaller #KidsHealth #ParentingScience #KisFit`
  },
  {
    ep: 20,
    filename: 'US_KISFIT_20_Barefoot_CerebellumBalance_1A_Punchline.mp4',
    koTopic: '20화: 두꺼운 신발에 가려진 발바닥 20만 개 신경센서: 맨발 촉각이 소뇌 공간지각력을 깨우는 3D 다큐 (Barefoot Sensors & Cerebellum IQ)',
    ytTitle: "How Thick Shoes Blindfold 200,000 Brain Sensors on Kids' Feet 🦶🧠 #Shorts",
    ytDescription: `Thick, rigid shoes can blindfold 200,000 brain-wiring nerve sensors on the bottom of your child's feet.

Pediatric neuromotor & cerebellar neuroscience studies reveal:
1) 200,000 Plantar Mechanoreceptors: The sole of a human foot packs more tactile nerve endings per square centimeter than almost any other part of the body.
2) The Foot-to-Cerebellum Highway: When bare feet grip natural grass, wood, or textured mats, proprioceptive impulses shoot straight up the spinal cord into the cerebellum—wiring balance, posture, and 3D spatial intelligence.
3) Daily Barefoot Play Window: Letting kids play barefoot on safe grass or indoor sensory mats every day strengthens foot arches and accelerates cerebellar motor-cognitive wiring.

🧠 Test your child's Motor & Cognitive Percentile in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #BarefootKids #BrainDevelopment #ChildDevelopment #KisFit`,
    igReelsCaption: `How Thick Shoes Blindfold 200,000 Brain Sensors on Kids' Feet 🦶🧠

Neuromotor science shows that the bottom of your child's foot is one of the richest sensory antennas connected to the developing brain:

⚡ 1. 200,000 Plantar Nerve Endings:
Each foot sole is packed with mechanoreceptors designed to read ground texture, micro-tilts, and pressure in real time.

🧠 2. Wiring the Cerebellum for Spatial IQ:
When children grip grass or textured mats barefoot, high-speed proprioceptive signals race straight into the cerebellum—the brain hub that coordinates both physical balance and 3D spatial math reasoning!

🌿 3. The Daily Barefoot Window:
Kick off stiff, thick-soled shoes at home and on safe lawn grass to wake up natural arch strength and cerebellar brain wiring!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second Motor, Brain & CDC Growth Scan!

#BrainDevelopment #ChildDevelopment #BarefootKids #ParentingScience #KisFit`
  }
];

function sendTelegramVideoFile(botToken, chatId, filePath, caption) {
  return new Promise((resolve, reject) => {
    const boundary = '----KisFitDailyShorts' + Date.now().toString(16);
    const filename = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption || ''}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="supports_streaming"\r\n\r\ntrue\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="video"; filename="${filename}"\r\nContent-Type: video/mp4\r\n\r\n`),
      fileData,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ];
    const body = Buffer.concat(parts);
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${botToken}/sendVideo`,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        },
        timeout: 180000
      },
      res => {
        let chunks = '';
        res.on('data', d => (chunks += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(chunks));
          } catch (e) {
            resolve({ ok: false, error: chunks });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (_) {}
  return { lastSentEpisode: 0, lastSentDateKst: null, history: [] };
}

function saveState(st) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(st, null, 2) + '\n', 'utf8');
  } catch (_) {}
}

async function sendShortsReelsEpisode(epNum, options = {}) {
  const cfg = getTelegramConfig();
  const botToken = options.botToken || cfg.botToken;
  const chatId = options.chatId || cfg.chatId;
  if (!botToken || !chatId) {
    throw new Error('Telegram botToken or chatId not configured');
  }

  const idx = ((epNum - 1) % SHORTS_REELS_CATALOG.length + SHORTS_REELS_CATALOG.length) % SHORTS_REELS_CATALOG.length;
  const ep = Object.assign({}, SHORTS_REELS_CATALOG[idx]);
  const videoPath = path.join(VIDEOS_DIR, ep.filename);

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Shorts video file not found: ${videoPath}`);
  }

  const kb = Math.round(fs.statSync(videoPath).size / 1024);
  const nextEpNum = (ep.ep % SHORTS_REELS_CATALOG.length) + 1;
  const nextEpObj = SHORTS_REELS_CATALOG[nextEpNum - 1];
  const videoCaption = [
    `🌅 [오전 6시 순차 발송 — 순번 #${ep.ep} / 총 ${SHORTS_REELS_CATALOG.length}편 (${kb} KB)]`,
    `📌 오늘 발송 (#${ep.ep}): ${ep.koTopic}`,
    `⏭ 내일 발송 예정 (#${nextEpNum}): ${nextEpObj ? nextEpObj.koTopic : ''}`,
    ``,
    `1️⃣ 먼저 위 영상을 휴대폰 갤러리에 저장하세요.`,
    `2️⃣ 바로 아래에 [1/3 유튜브 쇼츠 제목] → [2/3 유튜브 쇼츠 설명란] → [3/3 인스타 릴스 본문] 순으로 복사용 순수 영문 멘트가 차례대로 도착합니다!`
  ].join('\n');

  const vidRes = await sendTelegramVideoFile(botToken, chatId, videoPath, videoCaption);
  if (!vidRes || !vidRes.ok) {
    throw new Error(`Failed to send video via Telegram: ${JSON.stringify(vidRes)}`);
  }

  await telegramApiRequest(botToken, 'sendMessage', {
    chat_id: chatId,
    text: `📺 <b>[순서 1/3 · 유튜브 쇼츠(Shorts) 제목]</b> (<a href="https://youtube.com/@kisfitglobal?si=txHdnSdCnJMnitTV">@kisfitglobal 유튜브 바로 열기</a>)\n👇 바로 아래 영문 말풍선을 꾹 눌러 <b>[복사]</b>한 뒤, <b>유튜브 쇼츠 제목(Title)</b> 칸에 붙여넣으세요:`,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });

  await telegramApiRequest(botToken, 'sendMessage', {
    chat_id: chatId,
    text: ep.ytTitle,
    disable_web_page_preview: true
  });

  await telegramApiRequest(botToken, 'sendMessage', {
    chat_id: chatId,
    text: `📺 <b>[순서 2/3 · 유튜브 쇼츠(Shorts) 설명글 (해시태그 5개)]</b>\n👇 바로 아래 영문 말풍선을 꾹 눌러 <b>[복사]</b>한 뒤, <b>유튜브 설명란(Description)</b>에 붙여넣으세요:`,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });

  await telegramApiRequest(botToken, 'sendMessage', {
    chat_id: chatId,
    text: ep.ytDescription,
    disable_web_page_preview: true
  });

  await telegramApiRequest(botToken, 'sendMessage', {
    chat_id: chatId,
    text: `📸 <b>[순서 3/3 · 인스타그램 릴스(Reels) 전체 문구 (해시태그 5개 포함)]</b> (<a href="https://www.instagram.com/kisfitglobal?srtk=eTlhOTRxa2o3cGs=">@kisfitglobal 인스타 바로 열기</a>)\n👇 바로 아래 영문 말풍선을 꾹 눌러 <b>[복사]</b>한 뒤, <b>인스타그램 릴스 문구 입력란</b>에 통째로 붙여넣으세요:`,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });

  await telegramApiRequest(botToken, 'sendMessage', {
    chat_id: chatId,
    text: ep.igReelsCaption,
    disable_web_page_preview: true
  });

  return ep;
}

async function runCli() {
  const args = process.argv.slice(2);
  const epIdx = args.indexOf('--ep');
  const isAdvance = args.includes('--advance');
  const isForce = args.includes('--force');
  const st = loadState();
  const nowKst = new Date(Date.now() + 9 * 3600 * 1000);
  const kstDateStr = nowKst.toISOString().slice(0, 10);

  if (isAdvance && !isForce && st.lastSentDateKst === kstDateStr) {
    console.log(`ℹ️ [Daily 6AM Shorts/Reels] Already delivered Episode #${st.lastSentEpisode} today (${kstDateStr} KST). Skipping duplicate.`);
    return;
  }

  let targetEp = 1;
  if (epIdx !== -1 && args[epIdx + 1]) {
    targetEp = parseInt(args[epIdx + 1], 10) || 1;
  } else if (Array.isArray(st.queue) && st.queue.length > 0) {
    // 1순위: 아직 발송되지 않은(pending) 첫 번째 순번 영상을 선택
    const nextPending = st.queue.find(item => item.status !== 'sent');
    if (nextPending) {
      targetEp = nextPending.ep;
    } else {
      targetEp = ((st.lastSentEpisode || 0) % SHORTS_REELS_CATALOG.length) + 1;
    }
  } else {
    targetEp = ((st.lastSentEpisode || 0) % SHORTS_REELS_CATALOG.length) + 1;
  }

  const sentEp = await sendShortsReelsEpisode(targetEp);

  if (isAdvance) {
    st.lastSentEpisode = sentEp.ep;
    st.nextEpisodeToSend = (sentEp.ep % SHORTS_REELS_CATALOG.length) + 1;
    st.lastSentDateKst = kstDateStr;
    if (Array.isArray(st.queue)) {
      const qItem = st.queue.find(item => Number(item.ep) === Number(sentEp.ep));
      if (qItem) {
        qItem.status = 'sent';
        qItem.sentAt = new Date().toISOString();
        qItem.sentDateKst = kstDateStr;
      }
      const nextPendingAfter = st.queue.find(item => item.status !== 'sent');
      if (nextPendingAfter) {
        st.nextEpisodeToSend = nextPendingAfter.ep;
      }
    }
    st.history = Array.isArray(st.history) ? st.history : [];
    st.history.push({ ep: sentEp.ep, filename: sentEp.filename, sentAt: new Date().toISOString(), kstDate: kstDateStr });
    saveState(st);
  }

  console.log(`✅ [Daily 6AM Shorts/Reels] Sent Episode #${sentEp.ep} (${sentEp.filename}) in sequential Shorts -> Reels copy-paste order.`);
}

if (require.main === module) {
  runCli().catch(err => {
    console.error('❌ [Daily 6AM Shorts/Reels Error]:', err);
    process.exit(1);
  });
}

module.exports = {
  SHORTS_REELS_CATALOG,
  sendShortsReelsEpisode,
  loadState,
  saveState
};
