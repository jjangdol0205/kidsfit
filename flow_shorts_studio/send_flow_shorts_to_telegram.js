#!/usr/bin/env node
/**
 * KISFIT Global × Google Flow (Veo) 1화~5화 전편 영상 + 유튜브 쇼츠 & 인스타 릴스 순수 복붙 멘트 텔레그램 일괄 발송기
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const tn = require('../scripts/telegram-notify.js');

function sendTelegramVideoFile(botToken, chatId, filePath, caption) {
  return new Promise((resolve, reject) => {
    const boundary = '----KisFitFlowShorts' + Date.now().toString(16);
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

function sendRawText(botToken, chatId, text, parseMode = null) {
  const payload = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true
  };
  if (parseMode) payload.parse_mode = parseMode;
  return tn.telegramApiRequest(botToken, 'sendMessage', payload);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const EPISODES = [
  {
    ep: 1,
    stem: 'US_KISFIT_01_GrowthPlate_SleepLock',
    title: '1화: 밤 10시 이후 수면 시 성장판 잠김 3D 인체·뇌과학 다큐 (Growth Plate Sleep Lock)',
    ytTitle: 'What Happens If Your Child Sleeps After 10 PM? 🦴🌙 #Shorts',
    ytDescription: `If your child goes to sleep after 10 PM tonight, their bone growth plates literally lock shut.

Pediatric endocrinology & sleep neuroscience data reveal:
1) The 10 PM – 2 AM Slow-Wave Surge: Up to 70% of a child's daily Human Growth Hormone (GH) is secreted during the first deep slow-wave sleep cycle between 10 PM and 2 AM.
2) Blue Light Cortisol Spike: Late-night tablet or bedroom light suppresses melatonin, spikes cortisol, and stops chondrocyte cartilage cells inside the knee growth plates from multiplying.
3) 2 Full Inches of Adult Stature: Missing that deep sleep window consistently can cost up to 2 inches (5 cm) of final adult height.

🔬 Check your child's exact US CDC Growth Percentile & Final Adult Height Projection in 30 seconds:
https://kisfitglobal.com/?preset=elem_high

#Shorts #YouTubeShorts #ChildGrowth #ParentingScience #Pediatrician #SleepScience #GrowingTaller #KidsHealth #GrowthHormone #KisFit`,
    igReelsCaption: `Save this before bedtime tonight 🌙🦴

If your child goes to sleep after 10 PM, their knee growth plates miss up to 70% of the night's Human Growth Hormone surge:

🧠 1. The 10 PM – 2 AM Deep Sleep Window:
Growth hormone isn't released evenly all night—it fires in a massive pulse during deep Stage-3 slow-wave sleep between 10 PM and 2 AM.

📱 2. Why Screens Lock the Growth Plates:
Blue light hitting the retina at night triggers cortisol and suppresses pituitary GH signaling, freezing cartilage cell division inside the epiphyseal plates.

📏 3. The 9:00 PM Lights-Out Protocol:
Dimming bedroom lights 45 minutes before bed restores natural melatonin and protects up to 2 full inches of genetic height potential.

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high to run your child's free 30-second US CDC Growth Percentile & Final Height Scan!

#Reels #ParentingTips #ChildGrowth #KidsSleep #PediatricHealth #MomReels #DadReels #GrowingTaller #HealthyKids #ParentingScience #BoyMom #GirlMom #KisFit`
  },
  {
    ep: 2,
    stem: 'US_KISFIT_02_BedtimeSugar_InsulinBlock',
    title: '2화: 취침 전 단 음료·당분이 인슐린을 폭발시켜 성장호르몬을 4시간 잠그는 3D 다큐 (Bedtime Sugar & Insulin Block)',
    ytTitle: 'Why 1 Sweet Drink Before Bed Stops Bone Growth for 4 Hours 🥛🚫 #Shorts',
    ytDescription: `One glass of chocolate milk, juice, or a sweet snack before bed can shut down your child's overnight bone growth for 4 straight hours.

Clinical pediatric endocrinology explains why:
1) The Insulin-GH Switch: The moment sugar enters the bloodstream at night, the pancreas floods the body with insulin.
2) Pituitary Brake: High blood insulin acts like an emergency brake on the brain's pituitary gland, blocking nocturnal Human Growth Hormone (GH) secretion during the critical first 4 hours of sleep.
3) The 2-Hour Rule: Stop all sugary drinks and high-glycemic carbs 2 hours before bedtime—swap for plain water or low-glycemic protein.

🔬 Run your child's free 30-second US CDC Growth Curve & Nutritional Trajectory Check at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #YouTubeShorts #KidsNutrition #ChildGrowth #ParentingTips #Pediatrician #HeightGrowth #HealthyKids #SugarFreeKids #KisFit`,
    igReelsCaption: `Think twice before handing your child sweet milk or juice right before bed 🥛⚠️

Pediatric endocrinology studies show that a single spike in blood sugar and insulin before sleep can block nocturnal Growth Hormone release for up to 4 hours:

🩸 1. The Insulin vs. Growth Hormone Lock:
Your child's pituitary gland cannot release peak Growth Hormone while blood insulin levels are elevated.

🛑 2. The 4-Hour Blackout:
Eating sweet snacks or flavored milk at 8:30 PM keeps insulin high right through the 10 PM – 2 AM deep sleep growth window.

✅ 3. What to Do Tonight:
Keep the last 2 hours before bedtime completely sugar-free—offer warm water or a small low-glycemic protein bite instead!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high to check your child's exact US CDC Growth Percentile in 30 seconds!

#Reels #KidsNutrition #ChildGrowth #ParentingHacks #HealthyKids #MomReels #PediatricNutrition #GrowingTaller #BedtimeRoutine #ParentingScience #KisFit`
  },
  {
    ep: 3,
    stem: 'US_KISFIT_03_MouthBreathing_Craniofacial',
    title: '3화: 잘 때 입 벌리고 자는 구강호흡이 아이 얼굴형과 뇌 산소·성장을 바꾸는 3D 다큐 (Mouth Breathing & Airway)',
    ytTitle: 'Never Ignore a Child Sleeping With Their Mouth Open 😮‍💨🧠 #Shorts',
    ytDescription: `If your child sleeps with their mouth open at night, it is quietly reshaping their jaw structure and shrinking their overnight growth.

Pediatric airway & craniofacial studies reveal:
1) Craniofacial Narrowing: When a child breathes through their mouth instead of their nose, the tongue drops from the palate, narrowing the upper jaw and airway.
2) Nocturnal Micro-Arousals: Mouth breathing drops blood oxygen saturation and fractures deep slow-wave sleep—shutting down night-time Growth Hormone pulses and causing daytime ADHD-like fatigue.
3) Nasal Airway Check: Clearing nasal congestion, bedroom humidity control, and resting tongue-on-palate posture restore deep restorative sleep.

🔬 Check your child's Airway, Sleep & US CDC Growth Percentile in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #YouTubeShorts #MouthBreathing #ChildGrowth #AirwayHealth #ParentingScience #PediatricDentistry #KidsSleep #GrowingTaller #KisFit`,
    igReelsCaption: `Check how your child is breathing on their pillow tonight 😮‍💨🌙

Sleeping with an open mouth isn't just a cute habit—pediatric sleep and craniofacial researchers warn it directly impacts both facial bone development and height growth:

🦷 1. The Tongue-Palate Rule:
Nasal breathing keeps the tongue resting against the roof of the mouth, naturally shaping a wide, healthy upper jaw and airway.

🧠 2. Broken Deep Sleep = Lost Growth Hormone:
Nocturnal mouth breathing lowers oxygen saturation and pulls the brain out of Stage-3 slow-wave sleep, cutting off overnight Growth Hormone secretion.

🌿 3. Tonight's Bedroom Fix:
Check for dust allergies, keep bedroom humidity at 45–55%, and train gentle nasal breathing before lights-out.

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Growth & Sleep Trajectory Scan!

#Reels #MouthBreathing #AirwayHealth #ChildGrowth #KidsSleep #ParentingTips #MomReels #PediatricHealth #FacialGrowth #ParentingScience #KisFit`
  },
  {
    ep: 4,
    stem: 'US_KISFIT_04_TechNeck_SpinalCompression',
    title: '4화: 스마트폰 60도 거북목이 성장기 목뼈에 60파운드 압력을 가해 숨은 키 2인치를 가두는 3D 다큐 (Tech Neck & Spine)',
    ytTitle: 'How "Tech Neck" Steals 2 Hidden Inches of Your Child\'s Height 📱🦴 #Shorts',
    ytDescription: `Your child might already have up to 2 hidden inches of height trapped inside a compressed spine.

Spinal biomechanics research reveals:
1) 60 Pounds of Cervical Load: Tilting the head forward 60 degrees to look at a smartphone or tablet places 60 lbs (27 kg) of crushing downward force on a growing cervical spine.
2) Disc Dehydration & Kyphosis: Chronic slouching flattens intervertebral discs and locks thoracic rounding before the growth plates fuse.
3) 10-Minute Daily Wall Decompression: Eye-level screen stands + daily wall posture alignment and doorway bar hangs decompress the spine and unlock true natural stature.

🔬 Run your child's free 30-second US CDC Height & Posture Trajectory Check at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #YouTubeShorts #PostureCorrection #TechNeck #ChildGrowth #SpineHealth #GrowingTaller #ParentingTips #PediatricPT #KisFit`,
    igReelsCaption: `Look at your child's neck angle the next time they hold a phone or tablet 📱🦴

Orthopedic biomechanics studies show that tilting the head forward 60 degrees puts 60 pounds of crushing pressure on a growing spine—hiding up to 2 inches of natural height:

⚠️ 1. The 60-Pound Spinal Load:
A child's head weighs ~10 lbs in neutral alignment, but tilting down at a screen multiplies that load up to 60 lbs on the neck and upper back.

📏 2. Flattened Discs & Hidden Stature:
Hours of slouching squeeze fluid out of spinal discs and round the shoulders during peak growth years.

🟢 3. The Daily Decompression Fix:
Raise tablets to eye level and practice 2 minutes of wall alignment + doorway bar hangs before bed to rehydrate the spine!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second US CDC Growth Percentile & Posture Protocol!

#Reels #PostureCorrection #TechNeck #ChildGrowth #SpineHealth #GrowingTaller #KidsHealth #MomReels #ParentingScience #HealthyHabits #KisFit`
  },
  {
    ep: 5,
    stem: 'US_KISFIT_05_Fingertip_PrefrontalBrain',
    title: '5화: 만 3세 아이가 손끝을 쓸 때 대뇌 운동피질 30%와 전두엽 시냅스가 폭발하는 3D 뇌과학 다큐 (Fingertip & Prefrontal IQ)',
    ytTitle: 'Why Toddlers Yell "I Do It Myself!" (3D Brain Science) 🧠🖐️ #Shorts',
    ytDescription: `When your 3-year-old yells "I do it myself!", their brain is literally wiring its future IQ through their fingertips.

Developmental neuroscience (Penfield's Cortical Homunculus & Harvard Center on the Developing Child) proves:
1) 30% of the Motor Cortex Is in the Hands: Nearly one-third of the human brain's motor cortex is wired directly to the nerves in the fingertips and thumb.
2) High-Frequency Prefrontal Wiring: Every time a young child struggles to fasten a button, stack blocks, or pour water, high-frequency bio-electrical signals shoot straight into the prefrontal executive function cortex.
3) The 2-Minute Patience Rule: Taking over for them shuts that synaptic window down—giving them 2 extra minutes of tactile autonomy builds stronger math and focus circuits for life.

🧠 Check your child's exact Age-in-Months Brain Development & Growth Score in 30 seconds at:
https://kisfitglobal.com/?preset=elem_high

#Shorts #YouTubeShorts #BrainDevelopment #ToddlerMom #ParentingScience #Neuroscience #MontessoriAtHome #ChildDevelopment #FineMotorSkills #KisFit`,
    igReelsCaption: `Next time your toddler yells "I DO IT MYSELF!"—pause and watch their fingertips 🧠🖐️

3D neuroscience mapping shows that nearly 30% of the human brain's motor cortex is connected directly to the nerves in the hands and thumb:

⚡ 1. The Fingertip-to-Prefrontal Highway:
When a young child struggles to button a shirt, stack wooden blocks, or use tongs, their fingertips fire rapid electrical impulses straight into the prefrontal cortex.

🧬 2. Golden Synaptic Myelination:
That "stubborn" urge to do everything solo is actually a biological drive to wire executive function, working memory, and future math circuits.

🌱 3. The 2-Minute Rule:
Instead of stepping in to do it faster, give them 2 extra minutes of hands-on practice—you are literally building their brain's hardware!

👉 Tap the link in our bio (@kisfitglobal) or visit https://kisfitglobal.com/?preset=elem_high for your child's free 30-second Age-in-Months Brain & Growth Milestone Scan!

#Reels #BrainDevelopment #ToddlerMom #MontessoriAtHome #ParentingScience #ChildDevelopment #FineMotorSkills #MomReels #Neuroscience #EarlyChildhood #KisFit`
  }
];

(async () => {
  const cfg = tn.getTelegramConfig();
  const outDir = path.join(__dirname, 'ai_shorts_output');
  const startEp = parseInt(process.argv[2] || '1', 10);

  await sendRawText(
    cfg.botToken,
    cfg.chatId,
    [
      `🚀 <b>[KISFIT Global × Google Flow 1080p 3D 다큐 쇼츠 1화~5화 전편 완성 패키지]</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `크롬에 다운로드하신 20개 Google Flow 1080p 클립을 매칭하여 <b>1화~5화 전편(각 회차별 1A Punchline 엔딩 + 1B Seamless Loop 엔딩)</b>과 <b>유튜브 쇼츠 / 인스타 릴스 1초 복붙용 영문 멘트</b>를 순서대로 발송합니다!`,
      `<i>(안내 줄 다음 메시지는 터치 한 번으로 바로 전체 복사해서 붙여넣으실 수 있도록 100% 순수 영문만 담았습니다.)</i>`
    ].join('\n'),
    'HTML'
  );
  await sleep(600);

  for (const item of EPISODES) {
    if (item.ep < startEp) continue;

    const f1 = path.join(outDir, `${item.stem}_1A_Punchline.mp4`);
    const f2 = path.join(outDir, `${item.stem}_1B_SeamlessLoop.mp4`);

    await sendRawText(
      cfg.botToken,
      cfg.chatId,
      `━━━━━━━━━━━━━━━━━━\n🎬 <b>[${item.title}]</b>\n━━━━━━━━━━━━━━━━━━`,
      'HTML'
    );
    await sleep(400);

    if (fs.existsSync(f1)) {
      const kb1 = Math.round(fs.statSync(f1).size / 1024);
      const r1 = await sendTelegramVideoFile(
        cfg.botToken,
        cfg.chatId,
        f1,
        `🎬 [${item.ep}화 최종 베스트 완성본 (${kb1} KB)]\n파일: ${path.basename(f1)}`
      );
      console.log(`SENT EP${item.ep}:`, r1.ok, `${kb1} KB`);
      await sleep(500);
    }

    // 1. YouTube Shorts Title
    await sendRawText(
      cfg.botToken,
      cfg.chatId,
      `📋 <b>[${item.ep}화 — 1/3] 유튜브 쇼츠 제목 (아래 메시지를 길게 눌러 복사하세요)</b> 👇`,
      'HTML'
    );
    await sleep(250);
    await sendRawText(cfg.botToken, cfg.chatId, item.ytTitle, null);
    await sleep(350);

    // 2. YouTube Shorts Description
    await sendRawText(
      cfg.botToken,
      cfg.chatId,
      `📋 <b>[${item.ep}화 — 2/3] 유튜브 쇼츠 설명 & 해시태그 (아래 메시지를 길게 눌러 복사하세요)</b> 👇`,
      'HTML'
    );
    await sleep(250);
    await sendRawText(cfg.botToken, cfg.chatId, item.ytDescription, null);
    await sleep(350);

    // 3. Instagram Reels Caption
    await sendRawText(
      cfg.botToken,
      cfg.chatId,
      `📋 <b>[${item.ep}화 — 3/3] 인스타그램 릴스 본문 & 해시태그 (아래 메시지를 길게 눌러 복사하세요)</b> 👇`,
      'HTML'
    );
    await sleep(250);
    await sendRawText(cfg.botToken, cfg.chatId, item.igReelsCaption, null);
    await sleep(600);
  }

  console.log('ALL_5_EPISODES_SENT_TO_TELEGRAM_OK');
})();
