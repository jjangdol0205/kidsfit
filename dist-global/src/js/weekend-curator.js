/**
 * KidsFit Growth Studio - Weekend Outing Curator (src/js/weekend-curator.js)
 * Implements 8 Regions × 5 Themes = 40 complete outing catalog with viewing points,
 * booking tips, route, and pre/post book & activity package linkage.
 */

(function (global) {
  'use strict';

  function isGlobalEnRuntime(explicitFlag) {
    if (explicitFlag === true) return true;
    if (explicitFlag === false) return false;
    if (typeof window !== 'undefined' && window.__KIDSFIT_GLOBAL_PAID_EDITION === true) return true;
    if (typeof global !== 'undefined' && global.__KIDSFIT_GLOBAL_PAID_EDITION === true) return true;
    if (typeof document !== 'undefined' && document.documentElement) {
      const lang = String(document.documentElement.lang || '').toLowerCase();
      const edition = typeof document.documentElement.getAttribute === 'function'
        ? document.documentElement.getAttribute('data-edition')
        : '';
      if (lang.startsWith('en') || edition === 'global-paid') return true;
    }
    if (typeof window !== 'undefined' && window.location && /kisfitglobal\.com|kidsfitglobal\.com/i.test(String(window.location.hostname || ''))) {
      return true;
    }
    return false;
  }

  // 1. Data Loader
  let catalogData = null;
  if (typeof require !== 'undefined') {
    try {
      catalogData = require('../data/curation-catalog.json');
    } catch (e) {
      // fallback
    }
  }
  if (!catalogData && typeof window !== 'undefined' && window.KIDSFIT_CATALOG_DATA) {
    catalogData = window.KIDSFIT_CATALOG_DATA;
  }

  // Theme Key/Code Normalizer
  const THEME_MAP = {
    'art_making': 'art_making',
    'art': 'art_making',
    'history_tradition': 'history_tradition',
    'history': 'history_tradition',
    'dino_nature': 'dino_nature',
    'dino': 'dino_nature',
    'space_science': 'space_science',
    'science': 'space_science',
    'music_musical': 'music_musical',
    'music': 'music_musical'
  };

  const EN_COURSES_BY_THEME = {
    art_making: {
      id: 'C01',
      themeKey: 'art_making',
      destination: 'Children\'s Interactive Art Studio & Sculpture Garden',
      summary: 'Hands-on weekend creative enrichment stimulating visual-spatial perception, tactile fine-motor skills, and open-ended design thinking.',
      viewPoints: [
        'Compare scale, symmetry, and light reflection across 3D outdoor sculptures',
        'Engage bilateral fine-motor control in the interactive maker & clay studio'
      ],
      bookingTips: 'Reserve morning timed-entry tickets online 3–5 days in advance for quieter studio access.',
      route: 'Main Interactive Gallery → Hands-On Maker Studio → Outdoor Sculpture Walk',
      linkedPackage: {
        title: '3D Pop-Up Architecture & Visual Arts Activity Book',
        reason: 'Pre- and post-visit inquiry triples visual recall and creative vocabulary retention.',
        price: 18.99,
        amazonQuery: 'Interactive Art Activity Book Kids Architecture Pop Up'
      }
    },
    history_tradition: {
      id: 'C02',
      themeKey: 'history_tradition',
      destination: 'Living History Museum & Ancient Civilizations Hall',
      summary: 'Immersive historical exploration building causal storytelling, perspective-taking, and early social-scientific reasoning.',
      viewPoints: [
        'Examine how everyday tools, clocks, and shelters evolved before electricity',
        'Practice historical empathy by comparing ancient inventions with modern home items'
      ],
      bookingTips: 'Join the family docent discovery tour and pick up the junior explorer map at the desk.',
      route: 'Early Inventions Gallery → Hands-On Artifact Lab → Heritage Courtyard Walk',
      linkedPackage: {
        title: 'Illustrated World History & Inventions Explorer Atlas',
        reason: 'Connects museum artifacts to a visual timeline for deeper causal comprehension.',
        price: 19.99,
        amazonQuery: 'DK Smithsonian History Year by Year Kids Illustrated Book'
      }
    },
    dino_nature: {
      id: 'C03',
      themeKey: 'dino_nature',
      destination: 'Museum of Natural History, Paleontology & Botanical Trail',
      summary: 'High-curiosity ecological and fossil inquiry connecting skeletal biomechanics, tooth morphology, and outdoor gross-motor walking.',
      viewPoints: [
        'Compare herbivore vs. carnivore jaw structure, stride length, and posture balance',
        'Observe live plant ecosystems outdoors for natural daylight Vitamin D & gait activity'
      ],
      bookingTips: 'Arrive at opening hour for the fossil hall, followed by a 30-minute botanical garden walk.',
      route: 'Paleontology Fossil Hall → Biodiversity Discovery Room → Botanical Nature Loop',
      linkedPackage: {
        title: 'Smithsonian Dinosaur & Natural World Encyclopedia Kit',
        reason: 'Reinforces classification logic and scientific vocabulary before and after the visit.',
        price: 21.99,
        amazonQuery: 'DK Smithsonian Dinosaurs Prehistoric Life Visual Encyclopedia Kids'
      }
    },
    space_science: {
      id: 'C04',
      themeKey: 'space_science',
      destination: 'Science & Aerospace Discovery Center + Planetarium',
      summary: 'Hypothesis-driven physics and astronomy exploration activating dorsolateral prefrontal deduction and causal STEM curiosity.',
      viewPoints: [
        'Predict motion outcomes before pressing interactive pulley, air-pressure, and gear exhibits',
        'Explore orbital gravity and propulsion mechanics inside the dome planetarium'
      ],
      bookingTips: 'Book planetarium showtimes upon arrival and bring a small notebook for 1-sentence predictions.',
      route: 'Physics & Motion Lab → Aerospace & Robotics Hall → Planetarium Dome Show',
      linkedPackage: {
        title: 'Hands-On STEM Physics & Space Exploration Experiment Guide',
        reason: 'Turns passive exhibit button-pressing into genuine hypothesis-and-test scientific thinking.',
        price: 19.99,
        amazonQuery: 'National Geographic Little Kids First Big Book of Space STEM'
      }
    },
    music_musical: {
      id: 'C05',
      themeKey: 'music_musical',
      destination: 'Youth Family Concert Hall & Acoustic Sound Lab',
      summary: 'Auditory-motor rhythm synchronization and emotional expression experience supporting temporal-frontal neural integration.',
      viewPoints: [
        'Observe how string length and drum membrane tension alter pitch and resonance',
        'Connect musical tempo changes to character emotions and whole-body rhythm'
      ],
      bookingTips: 'Check weekend morning "Instrument Petting Zoo" or family matinee Cushion Concert schedules.',
      route: 'Acoustic Sound Exhibit → Family Matinee Performance → Outdoor Rhythm Walk',
      linkedPackage: {
        title: 'Interactive Orchestra Sound Book & Rhythm Activity Set',
        reason: 'Strengthens auditory discrimination and working-memory pattern recognition at home.',
        price: 22.99,
        amazonQuery: 'Story Orchestra Musical Sound Book Kids Classical'
      }
    }
  };

  const EN_SOCRATIC_BY_THEME = {
    art_making: {
      agency: 'National Art Education & Museum Socratic Inquiry Standard',
      carQuestion: '“What colors or shapes do you think might be hiding in the gallery today? Let’s pick three favorite colors to hunt for!”',
      venueQuestion: '“If you could gently touch that sculpture, would it feel rough or smooth? If it made a sound, what would it sound like?”',
      dinnerActivity: 'Sketch one memorable shape from today on scrap paper, tape it to the fridge gallery, and name your child “Chief Family Curator.”'
    },
    history_tradition: {
      agency: 'Smithsonian Early Learners & Historical Inquiry Framework',
      carQuestion: '“Long before smartphones or lightbulbs existed, how do you think kids played and told time at home?”',
      venueQuestion: '“Why do you think the maker carved such tiny patterns on this tool? If you lived back then, how would you improve it?”',
      dinnerActivity: 'Build a miniature landmark from cardboard boxes or blocks after dinner and role-play a 10-minute “Time-Travel Inventor” story.'
    },
    dino_nature: {
      agency: 'Natural History & Ecological Observation Inquiry Guide',
      carQuestion: '“Why do different dinosaurs and forest animals have such different tooth shapes and footprints?”',
      venueQuestion: '“Looking at those leg bones and tail balance, do you think this creature sprinted fast or walked slowly? Let’s test its posture!”',
      dinnerActivity: 'Dim the living-room lights and shine a flashlight on animal figures to cast giant wall shadows and compare proportions.'
    },
    space_science: {
      agency: 'Next Generation Science Standards (NGSS) Inquiry Protocol',
      carQuestion: '“Rockets and airplanes are super heavy—how do you think they lift off the ground without falling?”',
      venueQuestion: '“Pause before pressing the button! What is your hypothesis—which way will it spin or float, and why?”',
      dinnerActivity: 'Float three household items (plastic lid, metal spoon, folded paper boat) in a bowl of water and test buoyancy predictions.'
    },
    music_musical: {
      agency: 'Early Childhood Auditory-Cognitive Enrichment Standard',
      carQuestion: '“How does happy music sound different from sleepy or mysterious music? Let’s hum two tempos together!”',
      venueQuestion: '“Which instrument sounded the deepest, and why do you think larger instruments make lower vibrations?”',
      dinnerActivity: 'Use a wooden spoon, pot lid, and dry-rice shaker for a 3-minute call-and-response rhythm echo game at home.'
    }
  };

  // 2. Query Course by Region and Theme
  function getWeekendOuting(region, theme, isGlobalMode = null) {
    const useGlobal = isGlobalEnRuntime(isGlobalMode);
    const normTheme = THEME_MAP[theme] || 'art_making';

    if (useGlobal) {
      const cleanRegion = (!region || /[가-힣]/.test(String(region)))
        ? 'United States (CDC/AAP National)'
        : String(region);
      const baseCourse = EN_COURSES_BY_THEME[normTheme] || EN_COURSES_BY_THEME.art_making;
      return Object.assign({}, baseCourse, { region: cleanRegion });
    }

    const normRegion = region || '서울 강남·서초·송파';

    if (catalogData && catalogData.courses) {
      const found = catalogData.courses.find(
        (c) => c.region === normRegion && (c.themeKey === normTheme || c.theme === theme || c.themeKey === theme)
      );
      if (found) return found;
    }

    // Default fallback
    return {
      id: 'C01',
      region: normRegion,
      themeKey: normTheme,
      destination: '국립어린이박물관 & 지역 대표 문화공원',
      summary: '아이의 오감 자극과 역사·과학 호기심을 동시에 키우는 맞춤형 원데이 나들이',
      viewPoints: [
        '지역 랜드마크 체험 전시를 통한 시지각 및 공간 감각 확장',
        '상설 체험존에서 즐기는 소근육 참여 활동 및 대근육 야외 산책'
      ],
      bookingTips: '방문 전 공식 홈페이지 사전 예약 여부 확인 권장 (주말 오전 회차 추천)',
      route: '메인 상설전시실 → 특별체험관 → 야외생태공원 산책',
      linkedPackage: {
        title: '원데이 나들이 필수 입체 팝업북 & 탐구 키트',
        reason: '방문 전후 3회독 시 전시 관람 효과와 배경지식 200% 확장',
        price: 16800,
        coupangPath: 'vp/products/weekend-outing-package'
      }
    };
  }

  const HAVRUTA_BY_THEME = {
    art_making: {
      agency: '문화체육관광부 · 국립현대미술관 어린이미술관 감상 교육 기준',
      carQuestion: '“오늘 우리가 보러 가는 작품에는 어떤 색깔과 모양이 숨어 있을까? OO이가 제일 좋아하는 색깔을 세 개만 찾아볼까?”',
      venueQuestion: '“이 그림(조형물)을 만지면 까슬까슬할까, 보들보들할까? 만약 이 작품에서 소리가 난다면 무슨 소리가 날 것 같아?”',
      dinnerActivity: '집에 있는 이면지와 크레파스로 오늘 가장 기억에 남는 모양 하나를 그린 뒤, 오려서 냉장고 갤러리에 붙이고 아이에게 ‘오늘의 큐레이터’ 별명을 붙여주세요.'
    },
    history_tradition: {
      agency: '국립중앙박물관 어린이박물관 · 국가유산청 문화유산 스토리텔링 기준',
      carQuestion: '“옛날 왕과 왕비, 그리고 옛날 어린이들은 스마트폰도 없었는데 집에서 무얼 하며 놀았을까?”',
      venueQuestion: '“이 유물(그릇/왕관)을 만든 옛날 사람은 어떤 마음으로 이렇게 작은 무늬까지 정성껏 새겼을까? OO이가 왕이라면 어디에 쓰고 싶어?”',
      dinnerActivity: '저녁 식사 후 거실 블록이나 빈 상자로 오늘 본 성곽·왕관을 함께 만들어 보고 “내가 만약 옛날 왕이라면 어떤 법을 만들까?” 역할극을 10분간 해보세요.'
    },
    dino_nature: {
      agency: '국립생태원 · 자연사박물관 생태 탐구 관찰 가이드 기준',
      carQuestion: '“공룡이나 숲속 동물들은 왜 저마다 이빨 모양과 발자국 모양이 다를까?”',
      venueQuestion: '“이 친구는 풀을 먹었을까, 고기를 먹었을까? 다리와 꼬리를 보면 얼마나 빨리 달릴 수 있었을지 우리가 몸으로 흉내 내 볼까?”',
      dinnerActivity: '집에 있는 동물 피규어나 장난감에 손전등을 비춰 벽에 커다란 그림자 공룡을 만들고 크기 비교 놀이를 해보세요.'
    },
    space_science: {
      agency: '과학기술정보통신부 · 국립과천과학관 기초과학 탐구 학습 기준',
      carQuestion: '“비행기와 로켓은 저렇게 무거운데 어떻게 하늘 높이 떨어지지 않고 날아갈 수 있을까?”',
      venueQuestion: '“이 버튼을 누르기 전에 어떻게 움직일지 먼저 맞혀볼까? (가설 설정) 와! 왜 그렇게 움직였는지 우리 같이 비밀을 찾아보자!”',
      dinnerActivity: '욕실 세면대나 대야에 물건 3개(플라스틱 뚜껑, 숟가락, 종이배)를 띄워보며 부력과 원리를 이야기해 보세요.'
    },
    music_musical: {
      agency: '예술의전당 어린이 예술교육 · 유아 음악 감수성 발달 기준',
      carQuestion: '“기분이 신날 때 나는 소리와 슬플 때 나는 소리는 어떻게 다를까? 우리 입으로 악기 소리를 내볼까?”',
      venueQuestion: '“방금 나온 주인공은 왜 저런 노래를 불렀을까? OO이가 주인공이라면 어떤 춤을 추고 싶었어?”',
      dinnerActivity: '집에 있는 냄비, 나무 주걱, 페트병 쌀 마라카스로 오늘 들은 리듬을 3분간 합주하며 온몸으로 표현해 보세요.'
    }
  };

  // 3. Render Outing Report Card
  function renderOutingCard(outing, affiliateConfig = {}, isGlobalMode = null) {
    const useGlobal = isGlobalEnRuntime(isGlobalMode);
    if (useGlobal) {
      const safeOuting = (!outing || /[가-힣]/.test(String(outing.destination || '')))
        ? getWeekendOuting(outing && outing.region, outing && outing.themeKey, true)
        : outing;
      const amazonTag = affiliateConfig.amazon || 'kidfit-20';
      const pkg = safeOuting.linkedPackage || {
        title: 'Interactive STEM & Museum Discovery Book Set',
        reason: 'Expands pre- and post-visit background knowledge and Socratic inquiry.',
        amazonQuery: 'Smithsonian Visual Encyclopedia Kids STEM Book'
      };
      const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(pkg.amazonQuery || pkg.title)}&tag=${encodeURIComponent(amazonTag)}`;
      const socratic = EN_SOCRATIC_BY_THEME[safeOuting.themeKey] || EN_SOCRATIC_BY_THEME.art_making;

      return `
        <div class="outing-course-card" style="background: #FFFFFF; border: 1px solid var(--border-clinic); border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                <span class="tab-badge tab-badge-coral" style="font-size: 0.8rem; font-weight: 700;">Track ${safeOuting.id}</span>
                <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">${safeOuting.region}</span>
              </div>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1.35;">
                ${safeOuting.destination}
              </h3>
            </div>
            <span style="background: var(--coral-alert-sub); color: var(--coral-alert); padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.82rem; font-weight: 700;">
              Weekend Enrichment Pick
            </span>
          </div>

          <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; margin: 0 0 1.25rem 0; font-weight: 500;">
            ${safeOuting.summary}
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1rem 1.15rem;">
              <div style="font-weight: 700; color: #1E293B; font-size: 0.9rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                <span></span> Developmental Observation Points
              </div>
              <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.85rem; color: #475569; line-height: 1.55;">
                ${safeOuting.viewPoints.map((vp) => `<li>${vp}</li>`).join('')}
              </ul>
            </div>

            <div style="background: #FFF7ED; border: 1px solid #FFEDD5; border-radius: 16px; padding: 1rem 1.15rem;">
              <div style="font-weight: 700; color: #9A3412; font-size: 0.9rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                <span></span> Planning Tips &amp; Suggested Route
              </div>
              <p style="margin: 0 0 0.5rem 0; font-size: 0.84rem; color: #7C2D12; line-height: 1.5;">
                <strong>Visit Tip:</strong> ${safeOuting.bookingTips}
              </p>
              <p style="margin: 0; font-size: 0.84rem; color: #7C2D12; line-height: 1.5;">
                <strong>Recommended Flow:</strong> ${safeOuting.route}
              </p>
            </div>
          </div>

          <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 18px; padding: 1.25rem; margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem;">
              <div style="font-weight: 800; color: #065F46; font-size: 0.96rem;">
                [Evidence-Based Guide] 3-Stage Parent-Child Socratic Dialogue Protocol
              </div>
              <span style="font-size: 0.75rem; color: #047857; font-weight: 700; background: #DCFCE7; padding: 0.2rem 0.55rem; border-radius: 9999px;">${socratic.agency}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
              <div style="background: #FFFFFF; border-radius: 12px; padding: 0.85rem; border: 1px solid #BBF7D0;">
                <div style="font-weight: 800; font-size: 0.82rem; color: #047857; margin-bottom: 0.3rem;">① On the Way There (Curiosity Priming)</div>
                <p style="margin: 0; font-size: 0.83rem; color: #334155; line-height: 1.5;">${socratic.carQuestion}</p>
              </div>
              <div style="background: #FFFFFF; border-radius: 12px; padding: 0.85rem; border: 1px solid #BBF7D0;">
                <div style="font-weight: 800; font-size: 0.82rem; color: #047857; margin-bottom: 0.3rem;">② At the Exhibit (Hypothesis &amp; Observation)</div>
                <p style="margin: 0; font-size: 0.83rem; color: #334155; line-height: 1.5;">${socratic.venueQuestion}</p>
              </div>
              <div style="background: #FFFFFF; border-radius: 12px; padding: 0.85rem; border: 1px solid #BBF7D0;">
                <div style="font-weight: 800; font-size: 0.82rem; color: #047857; margin-bottom: 0.3rem;">③ Zero-Cost Evening Living-Room Follow-Up</div>
                <p style="margin: 0; font-size: 0.83rem; color: #334155; line-height: 1.5;">${socratic.dinnerActivity}</p>
              </div>
            </div>
          </div>

          <div style="background: var(--primary-indigo-sub); border: 1.5px dashed var(--primary-indigo); border-radius: 18px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
              <div>
                <span style="font-size: 0.74rem; color: #4338CA; font-weight: 700; display: block; margin-bottom: 0.15rem;">[Optional Reading Reference — Borrow at Your Local Library or Explore Online]</span>
                <div style="font-weight: 800; color: var(--primary-indigo); font-size: 0.98rem; display: flex; align-items: center; gap: 0.4rem;">
                  <span></span> Pre/Post-Visit Companion STEM &amp; Inquiry Book Kit
                </div>
              </div>
            </div>

            <p style="font-size: 0.86rem; color: #3730A3; line-height: 1.55; margin: 0 0 0.85rem 0;">
              <strong>${pkg.title}:</strong> ${pkg.reason}
            </p>

            <a href="${amazonUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; width: 100%; text-decoration: none; font-size: 0.9rem; padding: 0.7rem 1rem; box-sizing: border-box;">
              Explore Companion Book &amp; STEM Kit (Amazon) ↗
            </a>
          </div>
        </div>
      `;
    }

    const coupangId = affiliateConfig.coupang || 'AF7865143';
    const pkg = outing.linkedPackage || {
      title: '연계 입체 팝업북 & 워크북',
      reason: '전시 전후 배경지식 확장',
      price: 16800,
      coupangPath: 'vp/products/default-package'
    };
    const coupangUrl = `https://link.coupang.com/re/AFFSRP?lptag=${encodeURIComponent(coupangId)}&subid=kidsfit&pageKey=${encodeURIComponent(pkg.title)}`;
    const havruta = HAVRUTA_BY_THEME[outing.themeKey] || HAVRUTA_BY_THEME.art_making;

    return `
      <div class="outing-course-card" style="background: #FFFFFF; border: 1px solid var(--border-clinic); border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
              <span class="tab-badge tab-badge-coral" style="font-size: 0.8rem; font-weight: 700;">${outing.id} 코스</span>
              <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">${outing.region}</span>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1.35;">
              ${outing.destination}
            </h3>
          </div>
          <span style="background: var(--coral-alert-sub); color: var(--coral-alert); padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.82rem; font-weight: 700;">
            이번 주말 추천
          </span>
        </div>

        <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; margin: 0 0 1.25rem 0; font-weight: 500;">
          ${outing.summary}
        </p>

        <!-- Viewpoints & Tips Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          <!-- Viewpoints -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1rem 1.15rem;">
            <div style="font-weight: 700; color: #1E293B; font-size: 0.9rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              <span></span> 발달 관람 포인트
            </div>
            <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.85rem; color: #475569; line-height: 1.55;">
              ${outing.viewPoints.map((vp) => `<li>${vp}</li>`).join('')}
            </ul>
          </div>

          <!-- Booking Tips & Route -->
          <div style="background: #FFF7ED; border: 1px solid #FFEDD5; border-radius: 16px; padding: 1rem 1.15rem;">
            <div style="font-weight: 700; color: #9A3412; font-size: 0.9rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              <span></span> 사전 예약 &amp; 추천 동선
            </div>
            <p style="margin: 0 0 0.5rem 0; font-size: 0.84rem; color: #7C2D12; line-height: 1.5;">
              <strong>예약 꿀팁:</strong> ${outing.bookingTips}
            </p>
            <p style="margin: 0; font-size: 0.84rem; color: #7C2D12; line-height: 1.5;">
              <strong>추천 동선:</strong> ${outing.route}
            </p>
          </div>
        </div>

        <!-- Authoritative 3-Stage Havruta Conversation Guide -->
        <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 18px; padding: 1.25rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem;">
            <div style="font-weight: 800; color: #065F46; font-size: 0.96rem;">
              [공신력 가이드] 전시 효과를 3배 키우는 부모-아이 3단계 하브루타 대화법
            </div>
            <span style="font-size: 0.75rem; color: #047857; font-weight: 700; background: #DCFCE7; padding: 0.2rem 0.55rem; border-radius: 9999px;">${havruta.agency}</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
            <div style="background: #FFFFFF; border-radius: 12px; padding: 0.85rem; border: 1px solid #BBF7D0;">
              <div style="font-weight: 800; font-size: 0.82rem; color: #047857; margin-bottom: 0.3rem;">① 출발 전 차 안에서 (호기심 예열)</div>
              <p style="margin: 0; font-size: 0.83rem; color: #334155; line-height: 1.5;">${havruta.carQuestion}</p>
            </div>
            <div style="background: #FFFFFF; border-radius: 12px; padding: 0.85rem; border: 1px solid #BBF7D0;">
              <div style="font-weight: 800; font-size: 0.82rem; color: #047857; margin-bottom: 0.3rem;">② 전시장에서 눈맞춤 질문 (관찰 확장)</div>
              <p style="margin: 0; font-size: 0.83rem; color: #334155; line-height: 1.5;">${havruta.venueQuestion}</p>
            </div>
            <div style="background: #FFFFFF; border-radius: 12px; padding: 0.85rem; border: 1px solid #BBF7D0;">
              <div style="font-weight: 800; font-size: 0.82rem; color: #047857; margin-bottom: 0.3rem;">③ 다녀온 저녁 거실 0원 독후 활동</div>
              <p style="margin: 0; font-size: 0.83rem; color: #334155; line-height: 1.5;">${havruta.dinnerActivity}</p>
            </div>
          </div>
        </div>

        <!-- Pre/Post Outing Book & Toy Package (Framed as Optional Reference) -->
        <div style="background: var(--primary-indigo-sub); border: 1.5px dashed var(--primary-indigo); border-radius: 18px; padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
            <div>
              <span style="font-size: 0.74rem; color: #4338CA; font-weight: 700; display: block; margin-bottom: 0.15rem;">[선택형 보조 도서 가이드 — 도서관 대출 또는 가정 소장 시 참고]</span>
              <div style="font-weight: 800; color: var(--primary-indigo); font-size: 0.98rem; display: flex; align-items: center; gap: 0.4rem;">
                <span></span> 전시 전후 활용 연계 도서·교구 패키지
              </div>
            </div>
          </div>

          <p style="font-size: 0.86rem; color: #3730A3; line-height: 1.55; margin: 0 0 0.85rem 0;">
            <strong>${pkg.title}:</strong> ${pkg.reason}
          </p>

          <a href="${coupangUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; width: 100%; text-decoration: none; font-size: 0.9rem; padding: 0.7rem 1rem; box-sizing: border-box;">
            전시 전후 활용 연계 도서 세트 보기
          </a>
        </div>
      </div>
    `;
  }

  // 4. Render Full Tab 3 Report
  function renderTab3Report(profile, affiliateConfig = {}, isGlobalMode = null) {
    const useGlobal = isGlobalEnRuntime(isGlobalMode);
    const outing = getWeekendOuting(profile.region, profile.interest, useGlobal);
    return `
      <div>
        ${renderOutingCard(outing, affiliateConfig, useGlobal)}
        ${renderMuseumAcademicEvidence(useGlobal)}
      </div>
    `;
  }

  function renderMuseumAcademicEvidence(isGlobalMode = null) {
    const useGlobal = isGlobalEnRuntime(isGlobalMode);
    let kb = null;
    if (typeof window !== 'undefined' && window.KIDSFIT_RESEARCH_DATA) {
      kb = window.KIDSFIT_RESEARCH_DATA;
    } else if (typeof global !== 'undefined' && global.KIDSFIT_RESEARCH_DATA) {
      kb = global.KIDSFIT_RESEARCH_DATA;
    } else if (typeof require === 'function') {
      try {
        const fs = require('fs');
        const path = require('path');
        const p = path.resolve(__dirname, '../data/research-knowledge-base.json');
        if (fs.existsSync(p)) kb = JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {}
    }
    if (!kb || !Array.isArray(kb.papers)) return '';
    const papers = kb.papers
      .filter((p) => p.pillar === 'parent_child_interaction_museum')
      .slice(0, 3);
    if (!papers.length) return '';

    if (useGlobal) {
      return `
        <div style="background: #F8FAFC; border: 1.5px solid #93C5FD; border-radius: 24px; padding: 1.5rem; margin-top: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.9rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.35rem;"></span>
              <h4 style="font-size: 1.05rem; font-weight: 800; color: #78350F; margin: 0;">
                Peer-Reviewed Museum Socratic Dialogue &amp; Autonomy-Supportive Parenting Studies
              </h4>
            </div>
            <span style="background: #FEF3C7; color: #92400E; font-size: 0.76rem; font-weight: 800; padding: 0.25rem 0.7rem; border-radius: 9999px;">
              Developmental Psychology · Child Development Indexed
            </span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.9rem;">
            ${papers.map((p) => {
              const safeDesign = p.study_design && !/[가-힣]/.test(p.study_design) ? p.study_design : 'Observational Parent-Child Inquiry Study';
              return `
                <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem;">
                    <span style="font-size: 0.74rem; font-weight: 800; color: #1D4ED8; background: #FFFBEB; padding: 0.15rem 0.5rem; border-radius: 999px;">
                      ${p.journal} (${p.year})
                    </span>
                    ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener noreferrer" style="font-size: 0.74rem; color: #1D4ED8; font-weight: 700; text-decoration: none;">View Study ↗</a>` : ''}
                  </div>
                  <div style="font-size: 0.9rem; font-weight: 800; color: #0F172A; line-height: 1.4; margin-bottom: 0.45rem;">
                    ${p.title}
                  </div>
                  <p style="font-size: 0.8rem; color: #334155; line-height: 1.5; margin: 0 0 0.45rem 0;">
                    <strong>Study Design:</strong> ${safeDesign}
                  </p>
                  <div style="font-size: 0.79rem; color: #065F46; background: #F0FDF4; padding: 0.55rem 0.7rem; border-radius: 10px; line-height: 1.45;">
                    <strong>Parenting Takeaway:</strong> Open-ended "Why/How" inquiry during hands-on exhibits significantly boosts causal recall and autonomous problem-solving.
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div style="background: #F8FAFC; border: 1.5px solid #93C5FD; border-radius: 24px; padding: 1.5rem; margin-top: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.9rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.35rem;"></span>
            <h4 style="font-size: 1.05rem; font-weight: 800; color: #78350F; margin: 0;">
              박물관 하브루타 대화법 &amp; 자율성 지지 양육 발달심리학 논문 근거
            </h4>
          </div>
          <span style="background: #FEF3C7; color: #92400E; font-size: 0.76rem; font-weight: 800; padding: 0.25rem 0.7rem; border-radius: 9999px;">
            Developmental Psychology · Child Development 학술 DB
          </span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.9rem;">
          ${papers.map((p) => `
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem;">
                <span style="font-size: 0.74rem; font-weight: 800; color: #1D4ED8; background: #FFFBEB; padding: 0.15rem 0.5rem; border-radius: 999px;">
                  ${p.journal} (${p.year})
                </span>
                ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener noreferrer" style="font-size: 0.74rem; color: #1D4ED8; font-weight: 700; text-decoration: none;">원문 보기 ↗</a>` : ''}
              </div>
              <div style="font-size: 0.9rem; font-weight: 800; color: #0F172A; line-height: 1.4; margin-bottom: 0.45rem;">
                ${p.title_ko || p.title}
              </div>
              <p style="font-size: 0.8rem; color: #334155; line-height: 1.5; margin: 0 0 0.45rem 0;">
                <strong>핵심 수치:</strong> ${p.key_statistics || p.clinical_summary_ko || ''}
              </p>
              <div style="font-size: 0.79rem; color: #065F46; background: #F0FDF4; padding: 0.55rem 0.7rem; border-radius: 10px; line-height: 1.45;">
                <strong>양육 적용:</strong> ${p.parenting_prescription_ko || ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Export
  const WeekendCurator = {
    THEME_MAP,
    HAVRUTA_BY_THEME,
    getWeekendOuting,
    renderOutingCard,
    renderTab3Report
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeekendCurator;
  } else {
    global.KidsFitWeekendCurator = WeekendCurator;
  }

})(typeof window !== 'undefined' ? window : global);
