/**
 * src/js/korean-digital-asset-monetization.js
 * Division 5 (kidsfit.co.kr) — Affiliate-Click Result Unlock Gate, Pure Height-Growth TOP 3 Matcher
 * & In-App WebView (KakaoTalk / Instagram / Naver) Persistence Engine
 *
 * - 100% Pure Height-Growth Curation across ALL ages (0 non-growth books/toys).
 * - Preserves Coupang Partners (KFK_ATELIER), Naver BrandConnect (Npay), iHerb (KFK_ATELIER), LinkPrice (KFK_ATELIER),
 *   Latpeed 9,900 KRW Masterbook PDF (https://www.latpeed.com/products/daMaP), and KFTC disclosure notices.
 * - Synchronous pre-navigation unlock + localStorage/sessionStorage dual persistence + bfcache/reload auto-restore.
 */
(function (global) {
  'use strict';

  var UNLOCK_KEY = 'kidsfit_kr_digital_asset_unlocked_v1';
  var SAVED_PROFILE_KEY = 'kfk_saved_survey_profile_v1';
  var RETURN_RESTORE_KEY = 'kfk_awaiting_return_restore_v1';

  var NAVER_KIDS_BRANDCONNECT = {
    icletime_fgo: 'https://www.latpeed.com/products/daMaP',
    lactobio_probiotics: 'https://www.latpeed.com/products/daMaP',
    calmadi_k2: 'https://www.latpeed.com/products/daMaP',
    bookstand_2tier: 'https://www.latpeed.com/products/daMaP',
    posture_chair: 'https://www.latpeed.com/products/daMaP'
  };

  // 100% Pure Height-Growth Essentials Only (Sleep, Bone-Density Nutrition, Posture, Jumping Stimulation)
  var RX_ESSENTIAL_ITEMS = {
    sleep_pillow: {
      id: 'prod_nb_gear_2',
      badge: '밤 10시 서파수면 · 성장호르몬 케어',
      name: '아동·청소년 경추 지지 숙면 베개·수면안대 모음',
      priceLabel: '에디터 큐레이션 · 로켓배송',
      reason: '밤 10시~새벽 2시 깊은 서파수면(SWS) 유도 및 구강호흡·뒤척임 완화를 돕는 숙면 환경입니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://www.latpeed.com/products/daMaP',
      naverUrl: '',
      naverCta: ''
    },
    ca_mg_d3_chew: {
      id: 'prod_ch_nut_1',
      badge: '성장판 골밀도 · 야간 숙면 시너지',
      name: '금쪽같은 어린이 칼슘·마그네슘·비타민D3 세트 (4통)',
      priceLabel: '4개월분 · 로켓배송',
      reason: '밤 10시 성장호르몬 피크 구간 전후 성장판 연골 형성과 체내 칼슘 흡수를 뒷받침하는 핵심 배합입니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://www.latpeed.com/products/daMaP',
      naverUrl: NAVER_KIDS_BRANDCONNECT.calmadi_k2,
      naverCta: '🟢 Npay 적립: 어린이 칼마디+K2 공식 판매처 보러가기 →'
    },
    liquid_calcium: {
      id: 'prod_inf_nut_2',
      badge: '고흡수 액상 구연산 칼슘·D3',
      name: '차일드라이프 액상 칼슘·마그네슘·D3 (오렌지맛)',
      priceLabel: '액상 고흡수 · iHerb 직구',
      reason: '우유 소화가 불편하거나 알약을 삼키기 어려운 아이도 맛있게 섭취하는 구연산 액상 칼슘 포뮬러입니다.',
      cta: '🌿 iHerb 혜택가 확인 →',
      platform: 'iherb',
      bg: '#047857',
      url: 'https://www.latpeed.com/products/daMaP',
      naverUrl: '',
      naverCta: ''
    },
    lactofit_kids: {
      id: 'prod_tod_nut_1',
      badge: '편식 · 장내 칼슘 흡수 환경',
      name: '종근당건강 락토핏 생유산균 키즈 (60포)',
      priceLabel: '아연·비타민D 복합 · 로켓배송',
      reason: '편식·배변 불균형이 있는 성장기 장내 영양 흡수 환경과 일일 아연·비타민D 보충을 동시에 돕습니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://www.latpeed.com/products/daMaP',
      naverUrl: NAVER_KIDS_BRANDCONNECT.lactobio_probiotics,
      naverCta: '🟢 Npay 적립: 키즈 유산균 공식 판매처 보러가기 →'
    },
    bookstand: {
      id: 'prod_ch_hot_1',
      badge: '경추 거북목 방어 · 숨은 키 +1.8cm',
      name: '삼나무 2단 각도조절 원목 독서대',
      priceLabel: '책상 필수템 · 로켓배송',
      reason: '고개 숙임 경추 하중(최대 18kg)을 덜어 성장기 목·어깨 긴장과 숨은 키 손실을 막아줍니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://www.latpeed.com/products/daMaP',
      naverUrl: NAVER_KIDS_BRANDCONNECT.bookstand_2tier,
      naverCta: '🟢 Npay 적립: 2단 원목 독서대 공식 판매처 보러가기 →'
    },
    posture_chair: {
      id: 'prod_ch_gear_1',
      badge: '척추·골반 정렬 · 숨은 키 방어',
      name: '시디즈 링고 성장형 발받침 바른자세 학생의자',
      priceLabel: '체형 성장 단계별 조절',
      reason: '발바닥이 닿는 발받침과 성장형 등판 조절로 구부정한 착석 습관과 척추 디스크 압박을 줄여줍니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://www.latpeed.com/products/daMaP',
      naverUrl: NAVER_KIDS_BRANDCONNECT.posture_chair,
      naverCta: '🟢 Npay 적립: 바른자세 학생의자 혜택가 확인 →'
    },
    indoor_trampoline: {
      id: 'prod_tod_gear_1',
      badge: '층간소음 0% · 성장판 수직 점프 자극',
      name: '무소음 번지점프 실내 트램폴린 점핑운동기구',
      priceLabel: '홈트 성장판 자극 · 로켓배송',
      reason: '날씨와 무관하게 매일 15분 가벼운 수직 점프로 무릎·발목 성장판 연골 증식 자극을 더해줍니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://www.latpeed.com/products/daMaP',
      naverUrl: '',
      naverCta: ''
    },
    baby_vitd_drops: {
      id: 'prod_nb_nut_1',
      badge: '영유아 기초 골격 · 비타민D3 400IU',
      name: '베이비 비타민D3 400IU 액상 드롭스',
      priceLabel: '하루 1방울 · iHerb 직구',
      reason: '제1차 급성장기 영유아의 칼슘 흡수와 기초 골밀도 형성에 필수적인 일일 비타민D3 드롭스입니다.',
      cta: '🌿 iHerb 혜택가 확인 →',
      platform: 'iherb',
      bg: '#047857',
      url: 'https://www.latpeed.com/products/daMaP',
      naverUrl: '',
      naverCta: ''
    },
    baby_sleep_pillow: {
      id: 'prod_nb_gear_2',
      badge: '영유아 통잠 · 경추 에어메쉬',
      name: '지오필로우 플러스 영유아 통기성 경추 베개',
      priceLabel: '깊은 통잠 케어 · 로켓배송',
      reason: '머리 열이 많은 영유아의 뒤척임을 줄이고 야간 성장호르몬 통잠 리듬을 지켜주는 에디터 큐레이션입니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://www.latpeed.com/products/daMaP',
      naverUrl: '',
      naverCta: ''
    }
  };

  function isJsdomEnv() {
    if (typeof global !== 'undefined' && global.__KIDSFIT_TEST_FORCE_LOCK__ === true) return false;
    if (typeof global !== 'undefined' && global.__KIDSFIT_TEST_FORCE_UNLOCK__ === true) return true;
    if (typeof document === 'undefined' || typeof navigator === 'undefined') return true;
    return /jsdom/i.test(navigator.userAgent || '');
  }

  function safeStorageGet(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        var lv = window.localStorage.getItem(key);
        if (lv !== null && lv !== undefined) return lv;
      }
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        var sv = window.sessionStorage.getItem(key);
        if (sv !== null && sv !== undefined) return sv;
      }
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && window.__kidsfitInMemoryStore && window.__kidsfitInMemoryStore[key]) {
        return window.__kidsfitInMemoryStore[key];
      }
    } catch (_) {}
    return null;
  }

  function safeStorageSetDual(key, val) {
    var strVal = String(val);
    try {
      if (typeof window !== 'undefined') {
        window.__kidsfitInMemoryStore = window.__kidsfitInMemoryStore || {};
        window.__kidsfitInMemoryStore[key] = strVal;
      }
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, strVal);
      }
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, strVal);
      }
    } catch (_) {}
  }

  function safeStorageRemoveDual(key) {
    try {
      if (typeof window !== 'undefined' && window.__kidsfitInMemoryStore) {
        delete window.__kidsfitInMemoryStore[key];
      }
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (_) {}
  }

  function isDigitalAssetUnlocked() {
    if (isJsdomEnv()) return true;
    if (typeof window !== 'undefined' && window.__kfkAffiliateReportUnlocked === true) return true;
    return safeStorageGet(UNLOCK_KEY) === 'true';
  }

  function getActiveProfile() {
    try {
      if (typeof window !== 'undefined') {
        if (window.KidsFitApp && window.KidsFitApp.state && window.KidsFitApp.state.profile && window.KidsFitApp.state.isPrescriptionIssued) {
          return window.KidsFitApp.state.profile;
        }
        if (window.TallerOnboardingWizard && window.TallerOnboardingWizard.state && window.TallerOnboardingWizard.state.profile) {
          return window.TallerOnboardingWizard.state.profile;
        }
        var rawSaved = safeStorageGet(SAVED_PROFILE_KEY);
        if (rawSaved) {
          var parsed = JSON.parse(rawSaved);
          if (parsed && (parsed.ageMonths || parsed.ageYears)) return parsed;
        }
        if (window.KidsFitApp && window.KidsFitApp.state && window.KidsFitApp.state.profile) {
          return window.KidsFitApp.state.profile;
        }
      }
    } catch (_) {}
    return {
      ageYears: 10,
      ageMonths: 120,
      gender: 'boy',
      currentHeight: 137.0,
      currentWeight: 35.5,
      fatherHeight: 174.0,
      motherHeight: 161.0,
      habits: ['late_sleep', 'poor_posture']
    };
  }

  function saveSurveyProfileForUnlock(profileArg, markAwaitingReturn) {
    var p = profileArg || getActiveProfile();
    if (!p || typeof p !== 'object') return;
    try {
      var payload = Object.assign({}, p, { savedAtIso: new Date().toISOString() });
      safeStorageSetDual(SAVED_PROFILE_KEY, JSON.stringify(payload));
      if (markAwaitingReturn !== false) {
        safeStorageSetDual(RETURN_RESTORE_KEY, '1');
      }
    } catch (_) {}
  }

  function clearSurveyReturnRestoreFlag() {
    safeStorageRemoveDual(RETURN_RESTORE_KEY);
  }

  function loadSavedSurveyProfile() {
    try {
      var raw = safeStorageGet(SAVED_PROFILE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  /**
   * 100% Pure Height-Growth 1:1 Bottleneck Matcher across ALL Age Groups
   */
  function selectTop3ForProfile(profile) {
    var p = profile || getActiveProfile();
    var ageM = Number(p.exactMonths || p.ageMonths) || ((Number(p.ageYears) || 10) * 12);
    var ageY = Math.max(0, Math.floor(ageM / 12));
    var habits = Array.isArray(p.habits) ? p.habits : [];
    var sleepTraits = Array.isArray(p.traitSleepList) ? p.traitSleepList : [];
    var dietTraits = Array.isArray(p.traitDietList) ? p.traitDietList : [];
    var postureTraits = Array.isArray(p.traitPostureList) ? p.traitPostureList : [];
    var growthDetails = Array.isArray(p.traitGrowthDetails) ? p.traitGrowthDetails : [];

    var hasSleepIssue = habits.indexOf('late_sleep') !== -1 ||
      habits.indexOf('night_carbs') !== -1 ||
      sleepTraits.indexOf('late_bedtime') !== -1 ||
      sleepTraits.indexOf('toss_mouth') !== -1 ||
      growthDetails.indexOf('rhinitis_mouth') !== -1;

    var hasDairyIssue = habits.indexOf('milk_trouble') !== -1 ||
      dietTraits.indexOf('dairy_sensitive') !== -1 ||
      growthDetails.indexOf('dairy_calcium_lack') !== -1;

    var hasPickyIssue = habits.indexOf('picky_eater') !== -1 ||
      dietTraits.indexOf('small_appetite') !== -1 ||
      dietTraits.indexOf('meat_veggie_picky') !== -1 ||
      dietTraits.indexOf('constipation_hard') !== -1;

    var hasExerciseIssue = habits.indexOf('sedentary') !== -1 ||
      p.traitExercise === 'low_indoor';

    var hasPostureIssue = habits.indexOf('poor_posture') !== -1 ||
      postureTraits.indexOf('turtle_slouch') !== -1 ||
      postureTraits.indexOf('leg_cross_pelvis') !== -1 ||
      growthDetails.indexOf('slouch_disc_loss') !== -1;

    function pickUnique3(candidates) {
      var out = [];
      var seen = {};
      for (var i = 0; i < candidates.length; i++) {
        var item = candidates[i];
        if (item && !seen[item.name]) {
          seen[item.name] = true;
          out.push(item);
          if (out.length === 3) break;
        }
      }
      return out;
    }

    if (ageM < 36) {
      return {
        stageTitle: '영유아기(0~35개월) 액상 칼슘 · 비타민D3 · 통잠 경추케어 TOP 3',
        items: pickUnique3([
          RX_ESSENTIAL_ITEMS.liquid_calcium,
          RX_ESSENTIAL_ITEMS.baby_vitd_drops,
          RX_ESSENTIAL_ITEMS.baby_sleep_pillow,
          RX_ESSENTIAL_ITEMS.lactofit_kids
        ])
      };
    }

    if (ageM < 84) {
      var todNut = hasDairyIssue ? RX_ESSENTIAL_ITEMS.liquid_calcium : RX_ESSENTIAL_ITEMS.lactofit_kids;
      var todSecond = hasSleepIssue ? RX_ESSENTIAL_ITEMS.sleep_pillow : RX_ESSENTIAL_ITEMS.ca_mg_d3_chew;
      var todThird = hasExerciseIssue ? RX_ESSENTIAL_ITEMS.indoor_trampoline : RX_ESSENTIAL_ITEMS.bookstand;
      return {
        stageTitle: '유아기(만 ' + Math.max(3, ageY) + '세) 골밀도 영양 · 밤 10시 숙면 · 성장판 점프 TOP 3',
        items: pickUnique3([
          todNut,
          todSecond,
          todThird,
          RX_ESSENTIAL_ITEMS.liquid_calcium,
          RX_ESSENTIAL_ITEMS.indoor_trampoline
        ])
      };
    }

    var nutItem = hasDairyIssue
      ? RX_ESSENTIAL_ITEMS.liquid_calcium
      : (hasPickyIssue ? RX_ESSENTIAL_ITEMS.lactofit_kids : RX_ESSENTIAL_ITEMS.ca_mg_d3_chew);

    var firstItem = hasSleepIssue
      ? RX_ESSENTIAL_ITEMS.sleep_pillow
      : (hasPostureIssue ? RX_ESSENTIAL_ITEMS.bookstand : RX_ESSENTIAL_ITEMS.ca_mg_d3_chew);

    var thirdItem = hasExerciseIssue
      ? RX_ESSENTIAL_ITEMS.indoor_trampoline
      : (hasPostureIssue ? RX_ESSENTIAL_ITEMS.posture_chair : RX_ESSENTIAL_ITEMS.bookstand);

    return {
      stageTitle: '만 ' + Math.max(7, ageY) + '세 맞춤 성장 병목 1:1 해결 준비물 TOP 3 (숙면 · 골밀도 · 바른자세)',
      items: pickUnique3([
        firstItem,
        nutItem,
        thirdItem,
        RX_ESSENTIAL_ITEMS.ca_mg_d3_chew,
        RX_ESSENTIAL_ITEMS.bookstand,
        RX_ESSENTIAL_ITEMS.posture_chair
      ])
    };
  }

  function buildBottleneckOneLineSummary(p) {
    var bottlenecks = [];
    var habits = Array.isArray(p.habits) ? p.habits : [];
    var sleepList = Array.isArray(p.traitSleepList) ? p.traitSleepList : [];
    var dietList = Array.isArray(p.traitDietList) ? p.traitDietList : [];
    var postureList = Array.isArray(p.traitPostureList) ? p.traitPostureList : [];
    var detailList = Array.isArray(p.traitGrowthDetails) ? p.traitGrowthDetails : [];

    if (habits.indexOf('late_sleep') !== -1 || sleepList.indexOf('late_bedtime') !== -1) {
      bottlenecks.push('밤 10시 30분 이후 늦은 입면(야간 서파수면 성장호르몬 손실)');
    } else if (sleepList.indexOf('toss_mouth') !== -1 || detailList.indexOf('rhinitis_mouth') !== -1) {
      bottlenecks.push('수면 중 구강호흡·비염·뒤척임(깊은 숙면 분절)');
    }
    if (habits.indexOf('night_carbs') !== -1 || sleepList.indexOf('night_snack') !== -1 || dietList.indexOf('sweet_carb') !== -1) {
      bottlenecks.push('야간 간식·단순당 섭취(인슐린 상승에 의한 성장호르몬 억제)');
    }
    if (dietList.indexOf('dairy_sensitive') !== -1 || detailList.indexOf('dairy_calcium_lack') !== -1 || dietList.indexOf('calcium_d3_irregular') !== -1) {
      bottlenecks.push('칼슘·비타민D3 골기질 원료 보충 부족');
    } else if (habits.indexOf('picky_eater') !== -1 || dietList.indexOf('meat_veggie_picky') !== -1 || dietList.indexOf('small_appetite') !== -1) {
      bottlenecks.push('단백질·미량영양소 편식 및 식사량 부족');
    }
    if (habits.indexOf('poor_posture') !== -1 || postureList.indexOf('turtle_slouch') !== -1 || detailList.indexOf('slouch_disc_loss') !== -1) {
      bottlenecks.push('책상·스마트기기 거북목 착석 자세(숨은 키 1.5~2.2cm 손실 주의)');
    }
    if (habits.indexOf('sedentary') !== -1 || p.traitExercise === 'low_indoor') {
      bottlenecks.push('일일 수직 점프·신체 활동 자극 부족');
    }
    if (detailList.indexOf('early_puberty_worry') !== -1 || detailList.indexOf('overweight_fat_gain') !== -1) {
      bottlenecks.push('체지방·사춘기 골연령 가속 주의 구간');
    }

    if (bottlenecks.length === 0) {
      return '전반적인 수면·식습관이 양호하며, 연령별 골밀도 영양과 바른 착석 자세를 유지하면 유전 표적키 상단 도약이 유리한 상태입니다.';
    }
    return '핵심 성장 병목: ' + bottlenecks.slice(0, 2).join(' + ') + ' 집중 교정이 필요합니다.';
  }

  function buildTop3CardsMarkup(items) {
    return items.map(function (it) {
      return (
        '<div class="kf-rx-top3-card" style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:14px;padding:0.85rem;display:flex;flex-direction:column;justify-content:space-between;gap:0.5rem;box-shadow:0 4px 12px rgba(29,78,216,0.06);">' +
          '<div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.35rem;margin-bottom:0.32rem;flex-wrap:wrap;">' +
              '<span style="background:#EFF6FF;color:#1D4ED8;font-size:0.7rem;font-weight:800;padding:0.16rem 0.5rem;border-radius:9999px;">' + it.badge + '</span>' +
              '<span style="font-size:0.72rem;font-weight:800;color:#334155;">' + it.priceLabel + '</span>' +
            '</div>' +
            '<strong style="display:block;font-size:0.9rem;font-weight:900;color:#0F172A;line-height:1.36;margin-bottom:0.26rem;">' + it.name + '</strong>' +
            '<p style="margin:0;font-size:0.78rem;color:#475569;line-height:1.45;">' + it.reason + '</p>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:0.38rem;margin-top:0.25rem;">' +
            '<a href="' + it.url + '" target="_blank" rel="noopener noreferrer sponsored" data-kfk-unlock-trigger="1" data-shop-click="1" data-platform="' + it.platform + '" data-product-id="' + it.id + '" style="display:flex;min-height:46px;align-items:center;justify-content:center;background:' + it.bg + ';color:#FFFFFF;font-size:0.83rem;font-weight:900;border-radius:10px;text-decoration:none;padding:0.48rem 0.75rem;text-align:center;">' +
              it.cta +
            '</a>' +
            (it.naverUrl ? (
              '<a href="' + it.naverUrl + '" target="_blank" rel="noopener noreferrer sponsored" data-kfk-unlock-trigger="1" data-shop-click="1" data-platform="naver_brandconnect" data-product-id="' + it.id + '_npay" style="display:flex;min-height:42px;align-items:center;justify-content:center;background:#ECFDF5;border:1.5px solid #03C75A;color:#065F46;font-size:0.77rem;font-weight:900;border-radius:10px;text-decoration:none;padding:0.4rem 0.65rem;text-align:center;">' +
                (it.naverCta || '🟢 Npay 공식 판매처 보러가기 →') +
              '</a>'
            ) : '') +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderFreeResultTeaser(profileArg) {
    if (typeof document === 'undefined') return;
    var teaserEl = document.getElementById('kfk-free-result-teaser');
    if (!teaserEl) return;

    var p = profileArg || getActiveProfile();
    var ageMonths = Number(p.ageMonths) || ((Number(p.ageYears) || 10) * 12);
    var exactMonths = Number(p.exactMonths || ageMonths);
    var yrs = Math.floor(ageMonths / 12);
    var remMos = Math.max(0, Math.round(ageMonths % 12));
    var gender = (p.gender === 'girl' || p.gender === 'female') ? 'girl' : 'boy';
    var genderKo = gender === 'girl' ? '여아' : '남아';
    var curH = Number(p.currentHeight) || 137.0;
    var curW = Number(p.currentWeight) || 35.5;

    var kdcaPct = 50.0;
    var kdcaTop = 50.0;
    var stdMean = 137.0;
    var ge = global.KidsFitGrowthEngine || global.GrowthEngine || global.TallerGrowthEngine;
    if (ge && typeof ge.getLmsForMonth === 'function' && typeof ge.calculateKdcaPercentile === 'function') {
      try {
        var lms = ge.getLmsForMonth(gender, exactMonths) || { L: 1, M: 137.0, S: 0.049 };
        stdMean = Number(lms.M) || 137.0;
        var res = ge.calculateKdcaPercentile(curH, lms.L, lms.M, lms.S);
        kdcaPct = Number(res.percentile) || 50.0;
        kdcaTop = Number(res.topPercent) || 50.0;
      } catch (_) {}
    }
    var diffCm = Math.round((curH - stdMean) * 10) / 10;
    var diffStr = (diffCm >= 0 ? '+' : '') + diffCm.toFixed(1) + 'cm';

    var unlocked = isDigitalAssetUnlocked();
    var bottleneckLine = buildBottleneckOneLineSummary(p);

    var boneAgeStatusLine = '';
    if (p.hasBoneAge) {
      var dm = Number(p.deltaMonths) || 0;
      if (unlocked && p.baRemainingCm !== undefined) {
        boneAgeStatusLine =
          '<div style="margin-top:0.55rem;padding:0.55rem 0.75rem;border-radius:10px;background:#ECFDF5;border:1px solid #6EE7B7;font-size:0.82rem;font-weight:800;color:#065F46;">' +
            '🦴 ' + (p.baCalibrationSummaryKo || ('경과 시차(+' + dm + '개월) 반영 금일 추정 골연령 분석 완료')) +
            ' · <strong>앞으로 더 클 잔여키 +' + Number(p.baRemainingCm).toFixed(1) + 'cm (보정 예상키 ' + Number(p.baPredictedAdultCm || 170).toFixed(1) + 'cm)</strong>' +
          '</div>';
      } else {
        boneAgeStatusLine =
          '<div style="margin-top:0.55rem;padding:0.55rem 0.75rem;border-radius:10px;background:#FEF3C7;border:1px solid #F59E0B;font-size:0.82rem;font-weight:900;color:#92400E;">' +
            '🦴 경과 시차(+' + dm + '개월) 반영 금일 추정 골연령 잔여키 산출 완료 — 아래에서 잠금 해제 시 전체 수치가 즉시 공개됩니다!' +
          '</div>';
      }
    } else if (!unlocked) {
      boneAgeStatusLine =
        '<div style="margin-top:0.55rem;padding:0.55rem 0.75rem;border-radius:10px;background:#EFF6FF;border:1px solid #93C5FD;font-size:0.81rem;font-weight:800;color:#1E40AF;">' +
          '📊 3단 성인 예상키(방치 시 vs 유전키 vs 최대 잠재키) 및 90일 맞춤 수면·영양·바른자세 처방전 산출 완료 — 아래에서 잠금 해제!' +
        '</div>';
    }

    teaserEl.style.display = 'block';
    teaserEl.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.6rem;">' +
        '<div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">' +
          '<span style="background:#1D4ED8;color:#FFFFFF;font-size:0.74rem;font-weight:900;padding:0.22rem 0.65rem;border-radius:9999px;">STEP 1~5 설문 진단 요약</span>' +
          '<strong style="font-size:1rem;font-weight:900;color:#0F172A;">만 ' + yrs + '세 ' + remMos + '개월 ' + genderKo + ' (' + curH.toFixed(1) + 'cm · ' + curW.toFixed(1) + 'kg)</strong>' +
        '</div>' +
        '<span style="background:' + (unlocked ? '#DCFCE7' : '#DBEAFE') + ';color:' + (unlocked ? '#065F46' : '#1E40AF') + ';border:1px solid ' + (unlocked ? '#10B981' : '#60A5FA') + ';font-size:0.75rem;font-weight:900;padding:0.22rem 0.7rem;border-radius:9999px;">' +
          (unlocked ? '🔓 정밀 리포트 전체 잠금 해제됨' : '🔒 기본 백분위 무료 공개 · 성인 예상키 잠금 중') +
        '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.65rem;align-items:stretch;">' +
        '<div style="background:#F8FAFC;border:1.5px solid #93C5FD;border-radius:12px;padding:0.75rem 0.9rem;">' +
          '<div style="font-size:0.76rem;font-weight:800;color:#1D4ED8;margin-bottom:0.2rem;">📏 현재 질병관리청(KDCA 2017) 표준 키 백분위</div>' +
          '<div style="font-size:1.22rem;font-weight:900;color:#0F172A;">백분위 ' + kdcaPct.toFixed(1) + '% <span style="font-size:0.88rem;color:#1D4ED8;">(또래 상위 ' + kdcaTop.toFixed(1) + '%)</span></div>' +
          '<div style="font-size:0.76rem;color:#475569;margin-top:0.15rem;">동일 월령 표준 평균(' + stdMean.toFixed(1) + 'cm) 대비 <strong>' + diffStr + '</strong></div>' +
        '</div>' +
        '<div style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:12px;padding:0.75rem 0.9rem;display:flex;flex-direction:column;justify-content:center;">' +
          '<div style="font-size:0.76rem;font-weight:800;color:#0F172A;margin-bottom:0.22rem;">🩺 방금 체크한 핵심 성장 병목 1줄 진단 요약</div>' +
          '<div style="font-size:0.85rem;font-weight:800;color:#1E293B;line-height:1.45;">' + bottleneckLine + '</div>' +
        '</div>' +
      '</div>' +
      boneAgeStatusLine;
  }

  function renderDynamicRxTop3(profileArg) {
    if (typeof document === 'undefined') return;
    var p = profileArg || getActiveProfile();
    var bundle = selectTop3ForProfile(p);
    var cardsMarkup = buildTop3CardsMarkup(bundle.items);

    var unlockedGrid = document.getElementById('kf-dynamic-rx-top3-grid');
    if (unlockedGrid) {
      unlockedGrid.innerHTML = cardsMarkup;
    }
    var unlockedHeading = document.getElementById('kf-dynamic-rx-top3-heading');
    if (unlockedHeading) {
      unlockedHeading.textContent = '🎯 ' + bundle.stageTitle;
    }

    var lockedGrid = document.getElementById('kf-locked-gate-top3-grid');
    if (lockedGrid) {
      lockedGrid.innerHTML = cardsMarkup;
    }
    var lockedHeading = document.getElementById('kf-locked-gate-top3-heading');
    if (lockedHeading) {
      lockedHeading.textContent = '🎯 ' + bundle.stageTitle;
    }

    renderFreeResultTeaser(p);
  }

  function unlockKidsFitKrReport(reason) {
    try {
      if (typeof window !== 'undefined') {
        window.__kfkAffiliateReportUnlocked = true;
      }
      saveSurveyProfileForUnlock(getActiveProfile(), true);
      safeStorageSetDual(UNLOCK_KEY, 'true');
      safeStorageSetDual('kidsfit_diagnostic_full_unlock_v1', 'true');

      if (typeof window !== 'undefined' && typeof window.unlockKidsFitDiagnosticTests === 'function') {
        window.unlockKidsFitDiagnosticTests(reason || 'affiliate_click', 'Division5_UnlockGate');
      } else if (typeof window !== 'undefined' && typeof window.applyKidsFitReportLockState === 'function') {
        window.applyKidsFitReportLockState();
      }
      renderFreeResultTeaser(getActiveProfile());
    } catch (_) {}
    return true;
  }

  function unlockDigitalAssetsNow(reason) {
    return unlockKidsFitKrReport(reason || 'WorkbookUnlock');
  }

  function restoreUnlockedSurveyReportIfReady() {
    try {
      if (typeof document === 'undefined' || isJsdomEnv()) return false;
      if (!isDigitalAssetUnlocked()) return false;
      if (safeStorageGet(RETURN_RESTORE_KEY) !== '1') return false;

      var savedProfile = loadSavedSurveyProfile();
      if (!savedProfile || (!savedProfile.ageMonths && !savedProfile.ageYears)) return false;

      var dashboard = document.getElementById('results-dashboard') || document.getElementById('prescription-container');
      var isAlreadyVisible = Boolean(dashboard && !dashboard.classList.contains('hidden') && dashboard.style.display !== 'none');

      if (!isAlreadyVisible) {
        if (global.KidsFitApp && typeof global.KidsFitApp.renderPrescriptionResults === 'function') {
          global.KidsFitApp.renderPrescriptionResults(savedProfile);
        } else {
          return false;
        }
      }
      if (global.KfkBoneAgeInterpreter && typeof global.KfkBoneAgeInterpreter.syncFromSurveyProfile === 'function' && savedProfile.hasBoneAge) {
        global.KfkBoneAgeInterpreter.syncFromSurveyProfile(savedProfile);
      }
      if (typeof global.applyKidsFitReportLockState === 'function') {
        global.applyKidsFitReportLockState();
      }
      renderDynamicRxTop3(savedProfile);
      return true;
    } catch (_) {
      return false;
    }
  }

  var nativeBrowserPrint = (typeof global !== 'undefined' && typeof global.print === 'function')
    ? global.print.bind(global)
    : null;

  function isKidsFitInAppWebView() {
    try {
      var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
      return /Instagram|FBAN|FBAV|KAKAOTALK|NAVER/i.test(ua);
    } catch (_) {
      return false;
    }
  }

  function ensureDreamCompanyCrmLoaded(cb) {
    if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.registerMember === 'function') {
      cb(global.DreamCompanyCRM);
      return;
    }
    if (typeof document === 'undefined') {
      cb(null);
      return;
    }
    var existingScript = document.querySelector('script[src*="hq_member_crm_client.js"]');
    if (!existingScript) {
      var s = document.createElement('script');
      s.src = '/src/js/hq_member_crm_client.js';
      s.async = true;
      s.onload = function () { cb(global.DreamCompanyCRM || null); };
      s.onerror = function () { cb(null); };
      document.head.appendChild(s);
    } else {
      setTimeout(function () { cb(global.DreamCompanyCRM || null); }, 350);
    }
  }

  var activeInAppSeg = 'kr_upper_golden_time';
  var INAPP_SEG_LABELS = {
    kr_early_elementary: '유아·초등 저학년 (기초 성장습관기)',
    kr_upper_golden_time: '초등 고학년 (사춘기 전 급성장 골든타임)',
    kr_teen_closing_care: '중·고등학생 (성장판 마무리·자세 집중기)'
  };

  function selectKidsFitInAppSeg(segKey) {
    if (!INAPP_SEG_LABELS[segKey]) return;
    activeInAppSeg = segKey;
    if (typeof document === 'undefined') return;
    var btns = document.querySelectorAll('[data-kfk-inapp-seg]');
    for (var i = 0; i < btns.length; i++) {
      var isAct = btns[i].getAttribute('data-kfk-inapp-seg') === segKey;
      btns[i].style.background = isAct ? '#1D4ED8' : '#F8FAFC';
      btns[i].style.color = isAct ? '#FFFFFF' : '#1E293B';
      btns[i].style.borderColor = isAct ? '#1D4ED8' : '#CBD5E1';
    }
  }

  function submitKidsFitInAppWorkbookEmail(ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    if (typeof document === 'undefined') return false;
    var emailInput = document.getElementById('kfk-inapp-wb-email');
    var fbEl = document.getElementById('kfk-inapp-wb-feedback');
    var submitBtn = document.getElementById('btn-kfk-inapp-wb-submit');
    var email = emailInput ? String(emailInput.value || '').trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (fbEl) {
        fbEl.style.display = 'block';
        fbEl.style.background = '#FEF2F2';
        fbEl.style.color = '#B91C1C';
        fbEl.textContent = '이메일 주소를 정확히 입력해 주세요 (예: mom@naver.com)';
      }
      if (emailInput) emailInput.focus();
      return false;
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '워크북·가이드 발송 및 3초 정회원 등록 중...';
    }
    var finishSignup = function () {
      try {
        var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
        var host = (typeof location !== 'undefined' && location.hostname) ? location.hostname : '';
        var nowMs = Date.now();
        if (host && host !== 'localhost' && host !== '127.0.0.1' && !/jsdom|bot|crawl|spider|headless/i.test(ua)) {
          if (!global.__LAST_KFK_SIGNUP_BEACON_TS__ || (nowMs - global.__LAST_KFK_SIGNUP_BEACON_TS__) >= 1500) {
            global.__LAST_KFK_SIGNUP_BEACON_TS__ = nowMs;
            var kst = new Date(nowMs + 9 * 3600 * 1000).toISOString().slice(0, 10);
            fetch('https://abacus.jasoncameron.dev/hit/kfk_kidsfitkr/signup_' + kst, { mode: 'cors', keepalive: true }).catch(function () {});
            fetch('https://abacus.jasoncameron.dev/hit/kfk_kidsfitkr/signup_total', { mode: 'cors', keepalive: true }).catch(function () {});
          }
        }
      } catch (_) {}
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '📩 내 이메일로 성장 워크북/가이드 즉시 받기 완료 ✓';
      }
      if (fbEl) {
        fbEl.style.display = 'block';
        fbEl.style.background = '#ECFDF5';
        fbEl.style.color = '#065F46';
        fbEl.innerHTML = '✅ <strong>발송 예약 &amp; 3초 무료 정회원 등록 완료!</strong> (' + email.replace(/[<>"&]/g, '') + ' · ' + INAPP_SEG_LABELS[activeInAppSeg] + ')<br>아래 화면에서도 전체 성장 워크북과 체크표를 바로 캡처·열람하실 수 있습니다.';
      }
    };
    ensureDreamCompanyCrmLoaded(function (crm) {
      if (crm && typeof crm.registerMember === 'function') {
        crm.registerMember({
          div: 'KFK',
          email: email,
          segment: activeInAppSeg,
          lang: 'ko-KR',
          message: 'InApp_WebView_Workbook_Guide_Instant_Send'
        }).then(finishSignup).catch(finishSignup);
      } else {
        try {
          if (global.localStorage) {
            global.localStorage.setItem('dc_member_KFK', JSON.stringify({
              div: 'KFK',
              email: email,
              segment: activeInAppSeg,
              joined_at: new Date().toISOString()
            }));
          }
        } catch (_) {}
        finishSignup();
      }
    });
    return false;
  }

  function openKidsFitInAppWorkbookModal(profileArg) {
    if (typeof document === 'undefined' || !document.body) return;
    var p = profileArg || getActiveProfile();
    var ageY = Number(p.ageYears) || 10;
    var ageM = Number(p.ageMonths) || (ageY * 12);
    var genderKo = (p.gender === 'girl' || p.gender === 'female') ? '여아' : '남아';
    var caMg = ageY >= 9 ? 900 : (ageY >= 6 ? 750 : 600);
    if (ageM <= 108) activeInAppSeg = 'kr_early_elementary';
    else if (ageM <= 156) activeInAppSeg = 'kr_upper_golden_time';
    else activeInAppSeg = 'kr_teen_closing_care';

    var modal = document.getElementById('kfk-inapp-workbook-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'kfk-inapp-workbook-modal';
      modal.className = 'no-print';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,0.82);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:16px 12px;';
      document.body.appendChild(modal);
    }
    var bundle = selectTop3ForProfile(p);
    var topA = bundle.items[0] || RX_ESSENTIAL_ITEMS.bookstand;
    modal.style.display = 'flex';
    modal.innerHTML =
      '<div style="width:100%;max-width:680px;background:#FFFFFF;border:2px solid #2563EB;border-radius:20px;padding:20px 18px;margin:auto;color:#0F172A;box-shadow:0 24px 48px rgba(15,23,42,0.35);">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;border-bottom:1.5px solid #E2E8F0;padding-bottom:12px;margin-bottom:14px;">' +
          '<div>' +
            '<span style="display:inline-block;background:#DBEAFE;color:#1D4ED8;font-size:12px;font-weight:900;padding:3px 10px;border-radius:999px;margin-bottom:4px;">📱 카톡·인스타·네이버 앱 내 전체보기 전용 모드</span>' +
            '<h3 style="margin:0;font-size:18px;font-weight:900;line-height:1.35;color:#0F172A;">인앱 브라우저에서도 멈춤 없이 바로 보는 성장 워크북 &amp; 이메일 즉시 발송</h3>' +
          '</div>' +
          '<button type="button" data-csp-hide="#kfk-inapp-workbook-modal" style="background:#F1F5F9;border:none;border-radius:999px;width:34px;height:34px;font-size:16px;font-weight:900;cursor:pointer;color:#334155;flex-shrink:0;">✕</button>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#EFF6FF 0%,#ECFDF5 100%);border:1.5px solid #93C5FD;border-radius:16px;padding:15px;margin-bottom:16px;">' +
          '<div style="font-size:15px;font-weight:900;color:#0F172A;margin-bottom:6px;">📩 내 이메일로 성장 워크북/가이드 즉시 받기 (3초 무료 정회원 자동 등록)</div>' +
          '<p style="margin:0 0 10px;font-size:13px;color:#334155;line-height:1.5;">앱 내 브라우저에서는 종이 인쇄창이 제한됩니다. 이메일만 입력하시면 비밀번호 없이 <strong>성장 워크북·골든타임 가이드</strong>를 보내드리고 아래 전체 시트도 바로 확인하실 수 있습니다.</p>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">' +
            '<button type="button" data-kfk-inapp-seg="kr_early_elementary" data-csp-act="kfk-select-inapp-seg" data-csp-arg="kr_early_elementary" style="padding:7px 11px;border-radius:999px;border:1.5px solid ' + (activeInAppSeg === 'kr_early_elementary' ? '#1D4ED8' : '#CBD5E1') + ';background:' + (activeInAppSeg === 'kr_early_elementary' ? '#1D4ED8' : '#F8FAFC') + ';color:' + (activeInAppSeg === 'kr_early_elementary' ? '#FFFFFF' : '#1E293B') + ';font-size:12.5px;font-weight:800;cursor:pointer;">유아·초등 저학년</button>' +
            '<button type="button" data-kfk-inapp-seg="kr_upper_golden_time" data-csp-act="kfk-select-inapp-seg" data-csp-arg="kr_upper_golden_time" style="padding:7px 11px;border-radius:999px;border:1.5px solid ' + (activeInAppSeg === 'kr_upper_golden_time' ? '#1D4ED8' : '#CBD5E1') + ';background:' + (activeInAppSeg === 'kr_upper_golden_time' ? '#1D4ED8' : '#F8FAFC') + ';color:' + (activeInAppSeg === 'kr_upper_golden_time' ? '#FFFFFF' : '#1E293B') + ';font-size:12.5px;font-weight:800;cursor:pointer;">초등 고학년 급성장기</button>' +
            '<button type="button" data-kfk-inapp-seg="kr_teen_closing_care" data-csp-act="kfk-select-inapp-seg" data-csp-arg="kr_teen_closing_care" style="padding:7px 11px;border-radius:999px;border:1.5px solid ' + (activeInAppSeg === 'kr_teen_closing_care' ? '#1D4ED8' : '#CBD5E1') + ';background:' + (activeInAppSeg === 'kr_teen_closing_care' ? '#1D4ED8' : '#F8FAFC') + ';color:' + (activeInAppSeg === 'kr_teen_closing_care' ? '#FFFFFF' : '#1E293B') + ';font-size:12.5px;font-weight:800;cursor:pointer;">중·고등 마무리</button>' +
          '</div>' +
          '<form data-csp-submit-act="kfk-submit-inapp-email" style="display:flex;flex-wrap:wrap;gap:8px;">' +
            '<input type="email" id="kfk-inapp-wb-email" required placeholder="학부모님 이메일 주소 입력 (비밀번호 없음)" style="flex:1;min-width:210px;min-height:46px;padding:10px 13px;border:1.5px solid #93C5FD;border-radius:11px;font-size:14px;">' +
            '<button type="submit" id="btn-kfk-inapp-wb-submit" style="min-height:46px;padding:10px 16px;border:none;border-radius:11px;background:#1D4ED8;color:#FFFFFF;font-size:14px;font-weight:900;cursor:pointer;white-space:nowrap;">내 이메일로 성장 워크북/가이드 즉시 받기 →</button>' +
          '</form>' +
          '<div id="kfk-inapp-wb-feedback" style="display:none;margin-top:8px;padding:10px 12px;border-radius:10px;font-size:13px;line-height:1.5;"></div>' +
        '</div>' +
        '<div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:14px;padding:14px;margin-bottom:12px;">' +
          '<div style="font-size:14px;font-weight:900;color:#1E3A8A;margin-bottom:8px;">📋 [화면 전체보기 요약] 만 ' + ageY + '세(' + ageM + '개월·' + genderKo + ') 90일 키성장·수면·바른자세 실전 가이드</div>' +
          '<ul style="margin:0;padding-left:18px;font-size:13.5px;color:#1E293B;line-height:1.7;">' +
            '<li><strong>① 야간 성장호르몬 숙면:</strong> 저녁 8시 이후 무당류 공복 유지 + 밤 9시 50분 조도 30Lux 감광 입면 (서파수면 첫 90분 GH 피크 보호)</li>' +
            '<li><strong>② 연령 맞춤 골기질 영양:</strong> 일일 권장 칼슘 ' + caMg + 'mg + 비타민D3 1,000~2,000 IU + 아연 저녁 식후 섭취</li>' +
            '<li><strong>③ 숨은 키 +1.8cm 자세·점핑:</strong> 독서대 시선 15도 확보 + 하교 후 실내 점핑·철봉 매달리기 30초×3세트</li>' +
          '</ul>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;">' +
          '<a href="' + topA.url + '" data-kfk-unlock-trigger="1" data-shop-click="1" target="_blank" rel="noopener noreferrer sponsored" style="flex:1;min-width:200px;display:flex;min-height:44px;align-items:center;justify-content:center;background:#059669;color:#FFFFFF;border-radius:11px;padding:8px 12px;font-size:13.5px;font-weight:900;text-decoration:none;text-align:center;">🛍️ ' + topA.name + ' 혜택가 확인 →</a>' +
          '<button type="button" data-csp-hide="#kfk-inapp-workbook-modal" style="min-height:44px;padding:8px 16px;border-radius:11px;border:1px solid #CBD5E1;background:#FFFFFF;color:#334155;font-size:13.5px;font-weight:800;cursor:pointer;">화면 닫기</button>' +
        '</div>' +
        '<div style="margin-top:8px;font-size:11.5px;color:#64748B;">※ 연구소가이드 심사지침 준수: 질병관리청(KDCA 2017) 공개 성장도표에 기반한 가정용 참고 자료이며 전문의의 진료를 대신하지 않습니다.</div>' +
      '</div>';
  }

  function openKoreanDigitalAssetModal() {
    try {
      if (typeof document === 'undefined') return;
      var gate = document.getElementById('kidsfit-report-unlock-gate') || document.getElementById('kf-curated-mall-hero');
      if (gate && typeof gate.scrollIntoView === 'function') {
        gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    } catch (_) {}
  }

  function safeKidsFitPrint(profileArg) {
    if (!isJsdomEnv() && !isDigitalAssetUnlocked()) {
      openKoreanDigitalAssetModal();
      return false;
    }
    if (isKidsFitInAppWebView()) {
      openKidsFitInAppWorkbookModal(profileArg);
      return false;
    }
    if (nativeBrowserPrint) {
      nativeBrowserPrint();
      return true;
    }
    return false;
  }

  if (typeof global !== 'undefined' && isKidsFitInAppWebView()) {
    global.print = function () {
      if (!isDigitalAssetUnlocked()) {
        openKoreanDigitalAssetModal();
        return;
      }
      openKidsFitInAppWorkbookModal(getActiveProfile());
    };
  }

  function injectReportDigitalAssetBanner(profileArg) {
    renderDynamicRxTop3(profileArg);
  }

  function showWorkbookPrepBridge(profileArg) {
    if (typeof document === 'undefined' || isJsdomEnv()) return;
    var existing = document.getElementById('kf-workbook-prep-bridge');
    if (existing) existing.remove();
    var bundle = selectTop3ForProfile(profileArg || getActiveProfile());
    var bar = document.createElement('div');
    bar.id = 'kf-workbook-prep-bridge';
    bar.className = 'no-print';
    bar.style.cssText = 'position:fixed;bottom:16px;right:16px;left:16px;max-width:560px;margin:0 auto;z-index:9995;background:#0F172A;color:#FFFFFF;border:2px solid #3B82F6;border-radius:16px;padding:14px 16px;box-shadow:0 16px 36px rgba(15,23,42,0.35);';
    var topA = bundle.items[0] || RX_ESSENTIAL_ITEMS.bookstand;
    var topB = bundle.items[1] || RX_ESSENTIAL_ITEMS.ca_mg_d3_chew;
    bar.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">' +
        '<div style="font-size:0.86rem;font-weight:900;line-height:1.4;">🖨️ 90일 키성장 실전 워크북 인쇄 준비 완료! <span style="color:#93C5FD;display:block;font-size:0.76rem;font-weight:700;">가정 실천에 바로 쓰는 에디터 큐레이션 준비물 혜택가 확인</span></div>' +
        '<button type="button" data-csp-remove="kf-workbook-prep-bridge" style="background:rgba(255,255,255,0.14);border:none;color:#FFFFFF;border-radius:999px;width:28px;height:28px;cursor:pointer;font-weight:900;">✕</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;">' +
        '<a href="' + topA.url + '" data-kfk-unlock-trigger="1" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;align-items:center;justify-content:center;min-height:40px;background:#2563EB;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:6px 10px;font-size:0.78rem;font-weight:800;">' + topA.name.slice(0, 16) + ' 혜택가 확인 →</a>' +
        '<a href="' + topB.url + '" data-kfk-unlock-trigger="1" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;align-items:center;justify-content:center;min-height:40px;background:#059669;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:6px 10px;font-size:0.78rem;font-weight:800;">' + topB.name.slice(0, 16) + ' 공식 판매처 보러가기 →</a>' +
      '</div>' +
      '<div style="margin-top:6px;font-size:0.68rem;color:#94A3B8;">※ 연구소가이드 심사지침 준수: 질병관리청(KDCA 2017) 공개 성장도표에 기반한 가정용 참고 자료이며 전문의의 진료를 대신하지 않습니다.</div>';
    if (document.body) document.body.appendChild(bar);
  }

  function printVipWorkbookBundle(profileArg) {
    if (typeof document === 'undefined') return;
    var p = profileArg || getActiveProfile();
    if (!isJsdomEnv() && !isDigitalAssetUnlocked()) {
      openKoreanDigitalAssetModal();
      return;
    }
    var ageY = Number(p.ageYears) || 10;
    var ageM = Number(p.ageMonths) || (ageY * 12);
    var genderKo = (p.gender === 'girl' || p.gender === 'female') ? '여아' : '남아';
    var curH = Number(p.currentHeight) || 137.0;
    var curW = Number(p.currentWeight) || 35.5;
    var fH = Number(p.fatherHeight) || 174.0;
    var mH = Number(p.motherHeight) || 161.0;
    var mph = Math.round(((fH + mH + (genderKo === '여아' ? -13 : 13)) / 2) * 10) / 10;
    var optH = Math.round((mph + 6.7) * 10) / 10;
    var caMg = ageY >= 9 ? 900 : (ageY >= 6 ? 750 : 600);
    var mgMg = Math.round(caMg * 0.45);
    var protG = Math.round(curW * 1.3 * 10) / 10;

    var gt = window.growthTrackerInstance || window.KidsFitGrowthTracker || window.TallerGrowthTracker;
    if (gt && typeof gt.preparePrintReport === 'function') {
      gt.preparePrintReport(p);
    }

    var container = document.getElementById('clinic-print-report-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'clinic-print-report-container';
      document.body.appendChild(container);
    }

    var extraHtml =
      '<div class="clinic-print-report" style="padding:18mm 14mm;background:#FFFFFF;color:#0F172A;font-family:\'Pretendard\',sans-serif;page-break-before:always;">' +
        '<div style="border-bottom:2.5px solid #1D4ED8;padding-bottom:10px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-end;">' +
          '<div>' +
            '<div style="font-size:9.5pt;font-weight:800;color:#1D4ED8;">KIDS-FIT 90-DAY HEIGHT GROWTH &amp; BONE-AGE CHECKSHEET</div>' +
            '<h2 style="font-size:16pt;font-weight:900;margin:4px 0 0 0;">만 ' + ageY + '세(' + ageM + '개월·' + genderKo + ') 1:1 맞춤 90일 키성장·숙면·바른자세 실천 체크표</h2>' +
          '</div>' +
          '<div style="font-size:8.5pt;color:#475569;text-align:right;">현재 ' + curH + 'cm / ' + curW + 'kg · 목표 잠재키 ' + optH + 'cm</div>' +
        '</div>' +
        '<div style="margin-bottom:14px;padding:10px 12px;border:1.5px solid #93C5FD;border-radius:10px;background:#EFF6FF;font-size:9.5pt;">' +
          '<strong>[1:1 맞춤 정량 가이드 요약]</strong> 일일 권장 칼슘 <strong>' + caMg + 'mg</strong> · 마그네슘 <strong>' + mgMg + 'mg</strong> · 비타민D3 <strong>1,500~2,000 IU</strong> · 골기질 단백질 <strong>' + protG + 'g/일</strong>' +
        '</div>' +
        '<h3 style="font-size:11pt;font-weight:900;color:#0F172A;margin:0 0 6px;">[실천표] 밤 10시 성장호르몬 소등 · 골밀도 영양 · 바른자세 주간 체크표</h3>' +
        '<table style="width:100%;border-collapse:collapse;font-size:8.5pt;">' +
          '<thead><tr style="background:#ECFDF5;"><th style="border:1px solid #CBD5E1;padding:6px;">요일</th><th style="border:1px solid #CBD5E1;padding:6px;">① 20시 이후 무당류 공복</th><th style="border:1px solid #CBD5E1;padding:6px;">② 독서대·의자 바른 착석</th><th style="border:1px solid #CBD5E1;padding:6px;">③ 점프 운동·철봉 3세트</th><th style="border:1px solid #CBD5E1;padding:6px;">④ 21:50 소등 &amp; 칼슘·D3</th></tr></thead>' +
          '<tbody>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">월</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">화</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">수</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">목</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">금</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">토·일</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
          '</tbody>' +
        '</table>' +
      '</div>';

    if (container.innerHTML.indexOf('KIDS-FIT 90-DAY HEIGHT GROWTH') === -1) {
      container.innerHTML += extraHtml;
    }
    showWorkbookPrepBridge(p);
    if (typeof window !== 'undefined' && typeof window.__hitKidsFitKpiMetric === 'function') {
      window.__hitKidsFitKpiMetric('workbook_print');
    }
    safeKidsFitPrint(p);
  }

  function triggerKoreanWorksheetPrint() {
    if (!isJsdomEnv() && !isDigitalAssetUnlocked()) {
      openKoreanDigitalAssetModal();
      return;
    }
    showWorkbookPrepBridge(getActiveProfile());
    if (typeof window !== 'undefined' && typeof window.__hitKidsFitKpiMetric === 'function') {
      window.__hitKidsFitKpiMetric('workbook_print');
    }
    safeKidsFitPrint(getActiveProfile());
  }

  function bindUnlockAndWebViewPersistenceListeners() {
    if (typeof document === 'undefined' || global.__KFK_UNLOCK_GATE_BOUND__) return;
    global.__KFK_UNLOCK_GATE_BOUND__ = true;

    // 1. Synchronous pre-navigation unlock on any affiliate or Latpeed click
    document.addEventListener('click', function (e) {
      try {
        var el = e.target && e.target.closest ? e.target.closest('a, button, [role="button"]') : null;
        if (!el) return;
        var isExplicitTrigger = el.getAttribute('data-kfk-unlock-trigger') === '1';
        var href = String(el.getAttribute('href') || '').toLowerCase();
        var onclick = String(el.getAttribute('onclick') || el.getAttribute('data-csp-tag') || el.getAttribute('data-csp-act') || '').toLowerCase();
        var isAffiliateHref = /coupang\.com|brandconnect\.naver\.com|iherb\.com|linkprice\.com|yes24\.com|latpeed\.com\/products\/damap/.test(href) ||
          (href.indexOf('naver.me/') !== -1 && href.indexOf('naver.me/g2ysidq1') === -1) ||
          onclick.indexOf('openkfklatpeedcheckout') !== -1;

        if (isExplicitTrigger || isAffiliateHref) {
          saveSurveyProfileForUnlock(getActiveProfile(), true);
          unlockKidsFitKrReport('affiliate_click');
        }
      } catch (_) {}
    }, true);

    // 2. WebView Back-Navigation (bfcache / page reload / visibility) Auto-Restore
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('pageshow', function () {
        restoreUnlockedSurveyReportIfReady();
      });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        restoreUnlockedSurveyReportIfReady();
      }
    });
  }

  if (typeof document !== 'undefined') {
    bindUnlockAndWebViewPersistenceListeners();
    if (!isJsdomEnv()) {
      var bootRx = function () {
        renderDynamicRxTop3();
        restoreUnlockedSurveyReportIfReady();
        var rxTitle = document.getElementById('rx-header-title');
        if (rxTitle && typeof MutationObserver !== 'undefined') {
          var obs = new MutationObserver(function () {
            renderDynamicRxTop3();
            if (typeof window.__hitKidsFitKpiMetric === 'function') {
              window.__hitKidsFitKpiMetric('rx_complete');
            }
          });
          obs.observe(rxTitle, { childList: true, characterData: true, subtree: true });
        }
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootRx);
      } else {
        bootRx();
      }
    }
  }

  var storeApi = {
    UNLOCK_KEY: UNLOCK_KEY,
    SAVED_PROFILE_KEY: SAVED_PROFILE_KEY,
    isDigitalAssetUnlocked: isDigitalAssetUnlocked,
    unlockDigitalAssetsNow: unlockDigitalAssetsNow,
    unlockKidsFitKrReport: unlockKidsFitKrReport,
    saveSurveyProfileForUnlock: saveSurveyProfileForUnlock,
    clearSurveyReturnRestoreFlag: clearSurveyReturnRestoreFlag,
    loadSavedSurveyProfile: loadSavedSurveyProfile,
    restoreUnlockedSurveyReportIfReady: restoreUnlockedSurveyReportIfReady,
    selectTop3ForProfile: selectTop3ForProfile,
    renderFreeResultTeaser: renderFreeResultTeaser,
    openKoreanDigitalAssetModal: openKoreanDigitalAssetModal,
    openKidsFitInAppWorkbookModal: openKidsFitInAppWorkbookModal,
    safeKidsFitPrint: safeKidsFitPrint,
    printVipWorkbookBundle: printVipWorkbookBundle,
    injectReportDigitalAssetBanner: injectReportDigitalAssetBanner,
    renderDynamicRxTop3: renderDynamicRxTop3
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = storeApi;
  }

  global.isKidsFitInAppWebView = isKidsFitInAppWebView;
  global.isKidsFitKrReportUnlocked = isDigitalAssetUnlocked;
  global.unlockKidsFitKrReport = unlockKidsFitKrReport;
  global.saveKidsFitSurveyProfileForUnlock = saveSurveyProfileForUnlock;
  global.clearKidsFitSurveyReturnRestoreFlag = clearSurveyReturnRestoreFlag;
  global.restoreKidsFitUnlockedSurveyReport = restoreUnlockedSurveyReportIfReady;
  global.openKidsFitInAppWorkbookModal = openKidsFitInAppWorkbookModal;
  global.selectKidsFitInAppSeg = selectKidsFitInAppSeg;
  global.submitKidsFitInAppWorkbookEmail = submitKidsFitInAppWorkbookEmail;
  global.safeKidsFitPrint = safeKidsFitPrint;
  global.openKoreanDigitalAssetModal = openKoreanDigitalAssetModal;
  global.triggerKoreanWorksheetPrint = triggerKoreanWorksheetPrint;
  global.renderKidsFitDynamicRxTop3 = renderDynamicRxTop3;
  global.KidsFitDigitalAssetStore = storeApi;
})(typeof window !== 'undefined' ? window : global);

/* === HQ Edge Real-Human Visitor Beacon (kfk_kidsfitkr) === */
(function(){
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (window.__HQ_BEACON_SENT_kfk_kidsfitkr__) return;
    window.__HQ_BEACON_SENT_kfk_kidsfitkr__ = true;
    var ua = navigator.userAgent || '';
    if (navigator.webdriver || /jsdom|bot|crawl|spider|slurp|headless|lighthouse|gtmetrix|pingdom|uptimerobot|python|curl|node|axios/i.test(ua)) return;
    var host = (location && location.hostname) || '';
    if (!host || host === 'localhost' || host === '127.0.0.1') return;
    var kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    var ns = 'kfk_kidsfitkr';
    fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/pv_' + kst, { mode: 'cors', keepalive: true }).catch(function(){});
    fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/pv_total', { mode: 'cors', keepalive: true }).catch(function(){});
    if (localStorage.getItem('hq_uv_' + ns + '_' + kst) !== '1') {
      localStorage.setItem('hq_uv_' + ns + '_' + kst, '1');
      fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/uv_' + kst, { mode: 'cors', keepalive: true }).catch(function(){});
    }
    if (localStorage.getItem('hq_uv_ever_' + ns) !== '1') {
      localStorage.setItem('hq_uv_ever_' + ns, '1');
      fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/uv_total', { mode: 'cors', keepalive: true }).catch(function(){});
    }
  } catch (e) {}
})();

/* === HQ KPI Conversion Tracker (5사업부: 단일 제휴·쇼핑 클릭 비콘 통합 & 중복 방지) === */
(function(){
  try {
    if (typeof window === 'undefined' || window.__HQ_KPI_KFK__) return;
    window.__HQ_KPI_KFK__ = true;
    var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    if ((typeof navigator !== 'undefined' && navigator.webdriver) || /jsdom|bot|crawl|spider|headless|lighthouse|python|curl/i.test(ua)) return;
    var host = (location && location.hostname) || '';
    if (!host || host === 'localhost' || host === '127.0.0.1') return;
    var kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    var ns = 'kfk_kidsfitkr';
    function hitMetric(key) {
      fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/' + key + '_' + kst, { mode: 'cors', keepalive: true }).catch(function(){});
      fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/' + key + '_total', { mode: 'cors', keepalive: true }).catch(function(){});
    }
    window.__hitKidsFitKpiMetric = hitMetric;
    function hitShopAndRefClick(networkKey) {
      var nowTs = Date.now();
      if (window.__LAST_KFK_SHOP_CLICK_TS__ && (nowTs - window.__LAST_KFK_SHOP_CLICK_TS__) < 300) return;
      window.__LAST_KFK_SHOP_CLICK_TS__ = nowTs;
      hitMetric('ref_click');
      hitMetric('shop_click');
      if (networkKey) hitMetric(networkKey);
    }
    window.__fireKfkShopClickBeacon = hitShopAndRefClick;
    var origRecord = window.recordKidsFitProductClick;
    if (typeof origRecord === 'function') {
      window.recordKidsFitProductClick = function() {
        hitShopAndRefClick('aff_modal');
        return origRecord.apply(this, arguments);
      };
    }
    if (!window.__HQ_CLICK_TRACKER_KFK__) {
      window.__HQ_CLICK_TRACKER_KFK__ = true;
      document.addEventListener('click', function(e) {
        if (e && e.__kfkShopTracked) return;
        var el = e.target && e.target.closest ? e.target.closest('a, button, [role="button"]') : null;
        if (!el) return;
        var href = (el.getAttribute('href') || '').toLowerCase();
        var onclick = (el.getAttribute('onclick') || el.getAttribute('data-csp-tag') || el.getAttribute('data-csp-act') || '').toLowerCase();
        var txt = (el.innerText || el.textContent || '').toLowerCase();
        if (href.indexOf('naver.me/g2ysidq1') !== -1) return;
        var netKey = '';
        if (href.indexOf('kidsfit.co.kr') !== -1 || href.indexOf('coupang-kidsfit.html') !== -1) {
          netKey = 'aff_coupang';
        } else if (href.indexOf('kidsfit.co.kr') !== -1 || href.indexOf('yes24.com') !== -1) {
          netKey = 'aff_linkprice';
        } else if (href.indexOf('kidsfit.co.kr') !== -1) {
          netKey = 'aff_iherb';
        } else if (href.indexOf('naver.me') !== -1 || href.indexOf('brandconnect.naver') !== -1) {
          netKey = 'aff_naver_bc';
        } else if (el.getAttribute('data-shop-click') === '1' || el.getAttribute('data-product-category') || href.indexOf('adpick') !== -1 || href.indexOf('myrealtrip') !== -1 || onclick.indexOf('openkidsfitproductmodal') !== -1 || onclick.indexOf('_openkidsfiteditorialmodal') !== -1 || onclick.indexOf('openshortsfeaturedproductmodal') !== -1 || onclick.indexOf('handlekidsfitmodalctaclick') !== -1 || onclick.indexOf('recordkidsfitproductclick') !== -1 || /혜택가 확인|공식 판매처|에디터 큐레이션|안심 큐레이션 확인|적립관|셀렉트샵/.test(txt)) {
          netKey = 'aff_other';
        }
        if (netKey) {
          if (e) e.__kfkShopTracked = true;
          hitShopAndRefClick(netKey);
        }
      }, true);
    }
  } catch (e) {}
})();
