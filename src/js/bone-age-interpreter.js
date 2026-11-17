/**
 * src/js/bone-age-interpreter.js
 * Division 5 (kidsfit.co.kr) — Hospital Bone-Age X-Ray Result 1-Minute Interpreter & Remaining Height Simulator
 *
 * Architecture:
 * - 100% Client-Side Static Auxology Calculation (Bayley-Pinneau Mature Height Multiplier + Tanner Mid-Parental Height)
 * - Zero medical image upload, zero server transmission (strictly educational & home growth-environment guidance)
 * - Zero-Tolerance Vocabulary & FTC Affiliate Disclosure compliant (Coupang AF7865143, LinkPrice A100708867, Naver BrandConnect)
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'kfk_bone_age_interpreter_v1';

  // Strictly monotonic Bayley-Pinneau mature height achieved percentages (%) by skeletal Bone Age (4.0 to 18.5 yrs)
  var BP_TABLE_BOY = [
    { ba: 4.0, pct: 61.5 },
    { ba: 5.0, pct: 64.6 },
    { ba: 6.0, pct: 67.6 },
    { ba: 7.0, pct: 69.5 },
    { ba: 8.0, pct: 72.3 },
    { ba: 9.0, pct: 75.2 },
    { ba: 10.0, pct: 78.4 },
    { ba: 11.0, pct: 80.4 },
    { ba: 12.0, pct: 83.4 },
    { ba: 13.0, pct: 87.6 },
    { ba: 14.0, pct: 92.7 },
    { ba: 15.0, pct: 96.8 },
    { ba: 16.0, pct: 98.2 },
    { ba: 17.0, pct: 99.1 },
    { ba: 18.0, pct: 99.8 },
    { ba: 18.5, pct: 100.0 }
  ];

  var BP_TABLE_GIRL = [
    { ba: 4.0, pct: 66.8 },
    { ba: 5.0, pct: 70.1 },
    { ba: 6.0, pct: 73.3 },
    { ba: 7.0, pct: 76.3 },
    { ba: 8.0, pct: 79.5 },
    { ba: 9.0, pct: 82.7 },
    { ba: 10.0, pct: 86.2 },
    { ba: 11.0, pct: 90.6 },
    { ba: 12.0, pct: 92.2 },
    { ba: 13.0, pct: 95.8 },
    { ba: 14.0, pct: 98.0 },
    { ba: 15.0, pct: 99.0 },
    { ba: 16.0, pct: 99.6 },
    { ba: 17.0, pct: 99.9 },
    { ba: 17.5, pct: 100.0 }
  ];

  // Verified Affiliate Curation Catalog (Coupang AF7865143, LinkPrice A100708867, Naver BrandConnect)
  var NPAY_LINKS = {
    fgo: 'https://brandconnect.naver.com/affiliates/1010075643260928?channelProductNo=12080461872&ac=crtshp&cid=1016094238062720',
    calmadi: 'https://brandconnect.naver.com/affiliates/1016189312116325?channelProductNo=12015952747&ac=crtshp&cid=1016094238062720',
    stand: 'https://brandconnect.naver.com/affiliates/1016189312116324?channelProductNo=11520791948&ac=crtshp&cid=1016094238062720',
    chair: 'https://brandconnect.naver.com/affiliates/1016189312116323?channelProductNo=9673245604&ac=crtshp&cid=1016094238062720'
  };

  var CURATION_ITEMS = {
    sleep_pillow: {
      tag: '밤 10시 서파수면 · 골성숙 속도 케어',
      title: '아동·청소년 경추 지지 숙면 베개·수면안대 모음',
      desc: '밤 10시~새벽 2시 깊은 서파수면(SWS) 유도 · 야간 멜라토닌 및 성장호르몬 리듬 보호 에디터 큐레이션',
      img: 'src/images/products/prod_nb_gear_2.webp',
      fallback: 'src/images/products/prod_nb_gear_2.svg',
      npayUrl: '',
      npayLabel: '',
      primaryUrl: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kfk_boneage_sleep&pageKey=%EC%A3%BC%EB%8B%88%EC%96%B4+%EA%B2%BD%EC%B6%94+%EB%B2%A0%EA%B0%9C+%EC%88%99%EB%A9%B4',
      primaryLabel: '🚀 쿠팡 혜택가 확인'
    },
    posture_chair: {
      tag: '숨은 키 2~3cm 방어 · 착석 정렬',
      title: '시디즈 링고 성장형 발받침 학생 바른자세 의자',
      desc: '성장기 체형에 맞춘 등판·발받침 조절로 구부정한 착석 습관과 거북목을 예방하는 공식 판매처 보러가기',
      img: 'src/images/products/prod_ch_gear_1.webp',
      fallback: 'src/images/products/prod_ch_gear_1.svg',
      npayUrl: NPAY_LINKS.chair,
      npayLabel: '🟢 Npay 바른자세 의자',
      primaryUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=kfk_boneage_chair&pageKey=6509587298&itemId=14372048959&vendorItemId=81616407991',
      primaryLabel: '🚀 쿠팡 혜택가 확인'
    },
    wood_stand: {
      tag: '경추 하중 완화 · 책상 필수템',
      title: '삼나무 2단 높이·각도조절 원목 독서대',
      desc: '고개 숙임 각도를 줄여 성장기 목·어깨 긴장을 덜어주는 바른자세 에디터 큐레이션',
      img: 'src/images/products/prod_ch_hot_1.webp',
      fallback: 'src/images/products/prod_ch_gear_1.svg',
      npayUrl: NPAY_LINKS.stand,
      npayLabel: '🟢 Npay 2단 원목 독서대',
      primaryUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=kfk_boneage_stand&pageKey=9063539057&itemId=26612491974&vendorItemId=93585543652',
      primaryLabel: '🚀 쿠팡 혜택가 확인'
    },
    calmadi_d3: {
      tag: '열린 성장판 골밀도 영양 1위',
      title: '어린이 칼슘·마그네슘·비타민D3 4개월분 세트',
      desc: '남아 있는 성장판 연골 증식기에 뼈 형성과 체내 칼슘 흡수를 뒷받침하는 에디터 큐레이션',
      img: 'src/images/products/prod_ch_nut_1.webp',
      fallback: 'src/images/products/prod_ch_nut_1.svg',
      npayUrl: NPAY_LINKS.calmadi,
      npayLabel: '🟢 Npay 칼마디 적립',
      primaryUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=kfk_boneage_calmadi&pageKey=7335841617&itemId=29211153321&vendorItemId=96131097426',
      primaryLabel: '🚀 쿠팡 혜택가 확인'
    },
    indoor_trampoline: {
      tag: '층간소음 걱정 없는 성장판 점프 자극',
      title: '무소음 번지점프 실내 트램폴린 점핑운동기구',
      desc: '열려 있는 성장판에 매일 10분 가벼운 수직 점프 자극을 더해주는 공식 판매처 보러가기',
      img: 'src/images/products/prod_tod_gear_1.webp',
      fallback: 'src/images/products/prod_tod_gear_1.svg',
      npayUrl: '',
      npayLabel: '',
      primaryUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=kfk_boneage_tramp&pageKey=7390936623&itemId=19108463499&vendorItemId=86228725982',
      primaryLabel: '🚀 쿠팡 혜택가 확인'
    }
  };

  var PRESETS = {
    fast_boy: {
      sex: 'M',
      caYears: 10,
      caMonths: 0,
      heightCm: 139.0,
      baYears: 11,
      baMonths: 4,
      fatherCm: 174,
      motherCm: 161,
      stage: ''
    },
    ontrack_girl: {
      sex: 'F',
      caYears: 9,
      caMonths: 2,
      heightCm: 134.5,
      baYears: 9,
      baMonths: 3,
      fatherCm: 175,
      motherCm: 163,
      stage: 'stage_entry'
    },
    slow_boy: {
      sex: 'M',
      caYears: 11,
      caMonths: 0,
      heightCm: 138.5,
      baYears: 9,
      baMonths: 10,
      fatherCm: 176,
      motherCm: 162,
      stage: 'stage_open'
    }
  };

  function clamp(val, min, max) {
    if (isNaN(val)) return min;
    return Math.max(min, Math.min(max, val));
  }

  function interpolateMaturePct(sex, boneAgeYears) {
    var table = sex === 'F' ? BP_TABLE_GIRL : BP_TABLE_BOY;
    var minBa = table[0].ba;
    var maxBa = table[table.length - 1].ba;
    var ba = clamp(boneAgeYears, minBa, maxBa);

    for (var i = 0; i < table.length - 1; i++) {
      var left = table[i];
      var right = table[i + 1];
      if (ba >= left.ba && ba <= right.ba) {
        var span = right.ba - left.ba;
        var ratio = span > 0 ? (ba - left.ba) / span : 0;
        return left.pct + ratio * (right.pct - left.pct);
      }
    }
    return table[table.length - 1].pct;
  }

  function formatYearsMonths(totalYears) {
    var roundedMonths = Math.round(totalYears * 12);
    var yrs = Math.floor(roundedMonths / 12);
    var mos = Math.abs(roundedMonths % 12);
    return yrs + '세 ' + mos + '개월';
  }

  function formatDeltaMonths(deltaYears) {
    var totalMonths = Math.round(deltaYears * 12);
    if (totalMonths === 0) return '차이 없음 (0개월)';
    var sign = totalMonths > 0 ? '+' : '-';
    var absM = Math.abs(totalMonths);
    var y = Math.floor(absM / 12);
    var m = absM % 12;
    if (y > 0 && m > 0) return sign + y + '년 ' + m + '개월';
    if (y > 0) return sign + y + '년';
    return sign + m + '개월';
  }

  function getSexState() {
    var root = document.getElementById('kfk-bone-age-interpreter');
    if (!root) return 'M';
    var activeBtn = root.querySelector('[data-kfk-ba-sex].active');
    return activeBtn ? activeBtn.getAttribute('data-kfk-ba-sex') : 'M';
  }

  function setSexState(sex) {
    var root = document.getElementById('kfk-bone-age-interpreter');
    if (!root) return;
    var btns = root.querySelectorAll('[data-kfk-ba-sex]');
    for (var i = 0; i < btns.length; i++) {
      var isMatch = btns[i].getAttribute('data-kfk-ba-sex') === sex;
      btns[i].classList.toggle('active', isMatch);
      btns[i].setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    }
  }

  function highlightStageChip(stageId) {
    var root = document.getElementById('kfk-bone-age-interpreter');
    if (!root) return;
    var chips = root.querySelectorAll('[data-kfk-plate-stage]');
    for (var i = 0; i < chips.length; i++) {
      var match = stageId && chips[i].getAttribute('data-kfk-plate-stage') === stageId;
      chips[i].classList.toggle('active', !!match);
      chips[i].setAttribute('aria-pressed', match ? 'true' : 'false');
    }
  }

  function readInputsFromDom() {
    var sex = getSexState();
    var caY = parseInt((document.getElementById('kfk-ba-ca-years') || {}).value, 10);
    var caM = parseInt((document.getElementById('kfk-ba-ca-months') || {}).value, 10);
    var heightCm = parseFloat((document.getElementById('kfk-ba-height-cm') || {}).value);
    var baY = parseInt((document.getElementById('kfk-ba-years') || {}).value, 10);
    var baM = parseInt((document.getElementById('kfk-ba-months') || {}).value, 10);
    var fatherRaw = (document.getElementById('kfk-ba-father-cm') || {}).value;
    var motherRaw = (document.getElementById('kfk-ba-mother-cm') || {}).value;

    caY = clamp(isNaN(caY) ? 10 : caY, 4, 18);
    caM = clamp(isNaN(caM) ? 0 : caM, 0, 11);
    heightCm = clamp(isNaN(heightCm) ? 139.0 : heightCm, 85, 198);
    baY = clamp(isNaN(baY) ? 11 : baY, 4, 18);
    baM = clamp(isNaN(baM) ? 0 : baM, 0, 11);

    var fatherCm = fatherRaw ? parseFloat(fatherRaw) : NaN;
    var motherCm = motherRaw ? parseFloat(motherRaw) : NaN;

    return {
      sex: sex,
      caYears: caY,
      caMonths: caM,
      heightCm: heightCm,
      baYears: baY,
      baMonths: baM,
      fatherCm: !isNaN(fatherCm) && fatherCm >= 135 && fatherCm <= 210 ? fatherCm : null,
      motherCm: !isNaN(motherCm) && motherCm >= 130 && motherCm <= 200 ? motherCm : null
    };
  }

  function writeInputsToDom(state) {
    if (!state) return;
    setSexState(state.sex === 'F' ? 'F' : 'M');
    var elCaY = document.getElementById('kfk-ba-ca-years');
    var elCaM = document.getElementById('kfk-ba-ca-months');
    var elH = document.getElementById('kfk-ba-height-cm');
    var elBaY = document.getElementById('kfk-ba-years');
    var elBaM = document.getElementById('kfk-ba-months');
    var elFa = document.getElementById('kfk-ba-father-cm');
    var elMo = document.getElementById('kfk-ba-mother-cm');

    if (elCaY) elCaY.value = String(state.caYears);
    if (elCaM) elCaM.value = String(state.caMonths);
    if (elH) elH.value = Number(state.heightCm).toFixed(1);
    if (elBaY) elBaY.value = String(state.baYears);
    if (elBaM) elBaM.value = String(state.baMonths);
    if (elFa && state.fatherCm !== undefined && state.fatherCm !== null) elFa.value = String(state.fatherCm);
    if (elMo && state.motherCm !== undefined && state.motherCm !== null) elMo.value = String(state.motherCm);
  }

  function computeBoneAgeReport(input) {
    var ca = input.caYears + input.caMonths / 12;
    var ba = input.baYears + input.baMonths / 12;
    var deltaBa = ba - ca;

    var achievedPct = interpolateMaturePct(input.sex, ba);
    var onTrackPct = interpolateMaturePct(input.sex, ca);

    var rawPah = input.heightCm / (achievedPct / 100);
    var pahCm = clamp(rawPah, input.heightCm, 210.0);
    var remainingCm = Math.max(0, pahCm - input.heightCm);
    var remainingPct = Math.max(0, 100 - achievedPct);

    var rawPeerPah = input.heightCm / (onTrackPct / 100);
    var peerPahCm = clamp(rawPeerPah, input.heightCm, 210.0);
    var vsChronoDiffCm = pahCm - peerPahCm;

    var mphCm = null;
    if (input.fatherCm && input.motherCm) {
      mphCm = input.sex === 'F'
        ? (input.fatherCm + input.motherCm - 13) / 2
        : (input.fatherCm + input.motherCm + 13) / 2;
    }

    var paceType = 'normal';
    var badgeText = '🟢 연령 부합 안정권 · 표준 골성숙 리듬';
    var headlineSummary = '';
    var actionTips = [];
    var curatedKeys = [];

    if (deltaBa >= 0.75) {
      paceType = 'fast';
      badgeText = '⚠️ 빠른 뼈나이 (' + formatDeltaMonths(deltaBa) + ') · 성장판 마감 시계 관리 필요';
      headlineSummary =
        '현재 실제나이(' + formatYearsMonths(ca) + ')보다 뼈나이(' + formatYearsMonths(ba) + ')가 ' +
        formatDeltaMonths(deltaBa) + ' 앞서 있어, 동일 키·표준 뼈나이 대비 예상 성인키 여력이 약 ' +
        Math.abs(vsChronoDiffCm).toFixed(1) + 'cm 줄어든 구간입니다. 조급한 걱정 대신 오늘 밤부터 성장판 노화 속도를 늦추는 수면·체지방·바른자세 루틴을 집중 실천해 주세요.';
      actionTips = [
        '🌙 밤 10시 이전 완전 소등 숙면: 야간 스마트폰 빛은 멜라토닌을 억제해 골성숙 시계를 앞당길 수 있습니다.',
        '🥗 야식·액상과당 절제 및 단백질 균형: 급격한 체중 증가는 뼈나이 가속의 주요 환경 요인입니다.',
        '💺 숨은 키 2~3cm 착석 자세 방어: 남은 성장 기간 동안 거북목·구부정한 등으로 손해 보는 키를 막아주세요.'
      ];
      curatedKeys = ['sleep_pillow', 'posture_chair', 'wood_stand'];
    } else if (deltaBa <= -0.75) {
      paceType = 'slow';
      badgeText = '🌱 느린 뼈나이 (' + formatDeltaMonths(deltaBa) + ') · 대기만성형 잔여 잠재력 우수';
      headlineSummary =
        '현재 실제나이(' + formatYearsMonths(ca) + ')보다 뼈나이(' + formatYearsMonths(ba) + ')가 ' +
        formatDeltaMonths(deltaBa) + ' 여유 있게 열려 있어, 동일 키 또래보다 성장판이 열려 있는 시간이 약 ' +
        Math.abs(deltaBa * 12).toFixed(0) + '개월 더 남아 있습니다. 이 귀한 여유 구간에 칼슘·비타민D3와 점프 자극을 채우면 예상 성인키 상단을 노릴 수 있습니다.';
      actionTips = [
        '🥛 열린 성장판 원료 공급: 뼈가 자랄 시간이 충분한 만큼 칼슘·마그네슘·비타민D3 흡수율을 꾸준히 채워주세요.',
        '🏃 하루 10~15분 가벼운 수직 점프: 무소음 트램폴린·줄넘기 자극은 열린 성장판 연골 증식에 도움을 줍니다.',
        '📐 책상 위 시선 각도 유지: 후기 급성장기까지 바른 척추 정렬을 유지해야 자란 키가 온전히 체형으로 나타납니다.'
      ];
      curatedKeys = ['calmadi_d3', 'indoor_trampoline', 'wood_stand'];
    } else {
      paceType = 'normal';
      badgeText = '🟢 연령 부합 안정권 (' + formatDeltaMonths(deltaBa) + ') · 균형 잡힌 성장 페이스';
      headlineSummary =
        '실제나이(' + formatYearsMonths(ca) + ')와 병원 뼈나이(' + formatYearsMonths(ba) + ')가 안정적인 범위 안에서 조화롭게 자라고 있습니다. 앞으로 남아 있는 약 +' +
        remainingCm.toFixed(1) + 'cm의 성장 잠재력이 손실 없이 발현되도록 숙면·골밀도 영양·바른 착석 3대 환경을 꾸준히 유지해 주세요.';
      actionTips = [
        '🥛 골밀도 영양 루틴 고정: 급성장 구간 진입 전후로 칼슘·비타민D3와 양질의 단백질 섭취를 놓치지 마세요.',
        '🌙 서파수면 골든타임 사수: 밤 10시~새벽 2시 깊은 수면 구간에 하루 성장호르몬의 약 70%가 분비됩니다.',
        '💺 바른 독서·학습 자세 유지: 발바닥이 닿는 성장형 의자와 원목 독서대로 경추 하중을 줄여주세요.'
      ];
      curatedKeys = ['calmadi_d3', 'posture_chair', 'sleep_pillow'];
    }

    return {
      sex: input.sex,
      ca: ca,
      ba: ba,
      deltaBa: deltaBa,
      heightCm: input.heightCm,
      achievedPct: achievedPct,
      remainingPct: remainingPct,
      remainingCm: remainingCm,
      pahCm: pahCm,
      pahLowCm: Math.max(input.heightCm, pahCm - 2.0),
      pahHighCm: pahCm + 2.0,
      mphCm: mphCm,
      vsChronoDiffCm: vsChronoDiffCm,
      paceType: paceType,
      badgeText: badgeText,
      headlineSummary: headlineSummary,
      actionTips: actionTips,
      curatedKeys: curatedKeys
    };
  }

  function buildCurationCardsHtml(keys) {
    var html = '';
    for (var i = 0; i < keys.length; i++) {
      var item = CURATION_ITEMS[keys[i]];
      if (!item) continue;
      var hasNpay = Boolean(item.npayUrl);
      html +=
        '<div class="kfk-ba-curation-card">' +
          '<div class="kfk-ba-curation-top">' +
            '<img class="kfk-ba-curation-thumb" src="' + item.img + '" alt="' + item.title + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + item.fallback + '\';">' +
            '<div>' +
              '<span class="kfk-ba-curation-tag">' + item.tag + '</span>' +
              '<strong class="kfk-ba-curation-title">' + item.title + '</strong>' +
              '<span class="kfk-ba-curation-desc">' + item.desc + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="kfk-ba-curation-btns"' + (hasNpay ? '' : ' style="grid-template-columns:1fr;"') + '>' +
            (hasNpay
              ? '<a href="' + item.npayUrl + '" target="_blank" rel="noopener noreferrer sponsored" data-shop-click="1" class="kfk-1tap-btn kfk-1tap-npay">' + item.npayLabel + '</a>'
              : '') +
            '<a href="' + item.primaryUrl + '" target="_blank" rel="noopener noreferrer sponsored" data-shop-click="1" class="kfk-1tap-btn kfk-1tap-primary">' + item.primaryLabel + '</a>' +
          '</div>' +
        '</div>';
    }
    return html;
  }

  function renderReport(report) {
    var container = document.getElementById('kfk-bone-age-result');
    if (!container) return;

    var mphHtml = '';
    if (report.mphCm) {
      var diffMph = report.pahCm - report.mphCm;
      var diffSign = diffMph >= 0 ? '+' : '';
      mphHtml =
        '<div class="kfk-ba-mph-bar">' +
          '<span>🧬 부모 키 기준 유전 예상키(Tanner MPH): <strong>' + report.mphCm.toFixed(1) + 'cm</strong></span>' +
          '<span class="kfk-ba-mph-diff ' + (diffMph >= 0 ? 'is-plus' : 'is-minus') + '">' +
            '골연령 예상키가 유전 기준 대비 <strong>' + diffSign + diffMph.toFixed(1) + 'cm</strong>' +
          '</span>' +
        '</div>';
    }

    var tipsHtml = '';
    for (var i = 0; i < report.actionTips.length; i++) {
      tipsHtml += '<li>' + report.actionTips[i] + '</li>';
    }

    var achievedWidth = clamp(report.achievedPct, 8, 99.5).toFixed(1);
    var remainingWidth = Math.max(0.5, 100 - parseFloat(achievedWidth)).toFixed(1);

    var curationTitle =
      report.paceType === 'fast'
        ? '🎯 [빠른 뼈나이 맞춤] 야간 숙면 리듬 & 숨은 키 바른자세 에디터 큐레이션'
        : report.paceType === 'slow'
          ? '🎯 [열린 성장판 맞춤] 골밀도 영양 & 실내 점프 자극 에디터 큐레이션'
          : '🎯 [안정권 성장 유지] 골밀도 영양·바른자세·숙면 3대 에디터 큐레이션';

    container.innerHTML =
      '<div class="kfk-ba-report-box pace-' + report.paceType + '">' +
        '<div class="kfk-ba-report-head">' +
          '<span class="kfk-ba-pace-badge pace-' + report.paceType + '">' + report.badgeText + '</span>' +
          '<span class="kfk-ba-meta-pill">' +
            (report.sex === 'F' ? '여아' : '남아') + ' · 현재 ' + report.heightCm.toFixed(1) + 'cm · 뼈나이 ' + formatYearsMonths(report.ba) +
          '</span>' +
        '</div>' +

        '<div class="kfk-ba-kpi-grid">' +
          '<div class="kfk-ba-kpi-card is-highlight">' +
            '<span class="kfk-ba-kpi-label">앞으로 더 클 예상 잔여키</span>' +
            '<strong class="kfk-ba-kpi-value">+' + report.remainingCm.toFixed(1) + '<small>cm</small></strong>' +
            '<span class="kfk-ba-kpi-sub">성장판 잔여 잠재력 ' + report.remainingPct.toFixed(1) + '% 남음</span>' +
          '</div>' +
          '<div class="kfk-ba-kpi-card">' +
            '<span class="kfk-ba-kpi-label">골연령 보정 예상 성인키</span>' +
            '<strong class="kfk-ba-kpi-value">' + report.pahCm.toFixed(1) + '<small>cm</small></strong>' +
            '<span class="kfk-ba-kpi-sub">예상 범위 ' + report.pahLowCm.toFixed(1) + ' ~ ' + report.pahHighCm.toFixed(1) + 'cm</span>' +
          '</div>' +
          '<div class="kfk-ba-kpi-card">' +
            '<span class="kfk-ba-kpi-label">뼈나이 vs 실제나이 편차</span>' +
            '<strong class="kfk-ba-kpi-value is-delta">' + formatDeltaMonths(report.deltaBa) + '</strong>' +
            '<span class="kfk-ba-kpi-sub">실제 ' + formatYearsMonths(report.ca) + ' / 뼈나이 ' + formatYearsMonths(report.ba) + '</span>' +
          '</div>' +
        '</div>' +

        mphHtml +

        '<div class="kfk-ba-gauge-card">' +
          '<div class="kfk-ba-gauge-labels">' +
            '<span>현재 성인키 달성률 <strong>' + report.achievedPct.toFixed(1) + '%</strong> (' + report.heightCm.toFixed(1) + 'cm)</span>' +
            '<span class="kfk-ba-gauge-remain">🔥 남은 성장판 여력 <strong>' + report.remainingPct.toFixed(1) + '% (+' + report.remainingCm.toFixed(1) + 'cm)</strong></span>' +
          '</div>' +
          '<div class="kfk-ba-gauge-track" role="img" aria-label="성인키 달성률 ' + report.achievedPct.toFixed(1) + '퍼센트, 남은 성장판 여력 ' + report.remainingPct.toFixed(1) + '퍼센트">' +
            '<div class="kfk-ba-gauge-achieved" style="width:' + achievedWidth + '%;"></div>' +
            '<div class="kfk-ba-gauge-open" style="width:' + remainingWidth + '%;"></div>' +
          '</div>' +
          '<p class="kfk-ba-summary-text">' + report.headlineSummary + '</p>' +
        '</div>' +

        '<div class="kfk-ba-tips-box">' +
          '<strong class="kfk-ba-tips-title">🩺 오늘 저녁부터 가정에서 바로 실천할 3대 성장 환경 가이드</strong>' +
          '<ul class="kfk-ba-tips-list">' + tipsHtml + '</ul>' +
        '</div>' +

        '<div class="kfk-ba-curation-wrap">' +
          '<div class="kfk-ba-curation-header">' +
            '<strong>' + curationTitle + '</strong>' +
            '<span>아이 골연령 속도에 맞춘 필수 환경 도구</span>' +
          '</div>' +
          '<div class="kfk-ba-curation-grid">' +
            buildCurationCardsHtml(report.curatedKeys) +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function saveState(input) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    } catch (_) {}
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function calculateAndRender(shouldScrollResult) {
    var input = readInputsFromDom();
    saveState(input);
    var report = computeBoneAgeReport(input);
    renderReport(report);
    if (shouldScrollResult) {
      var resEl = document.getElementById('kfk-bone-age-result');
      if (resEl && resEl.scrollIntoView) {
        resEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    return report;
  }

  function selectGrowthPlateStage(stageId) {
    var input = readInputsFromDom();
    var ca = input.caYears + input.caMonths / 12;
    var targetBa = ca;

    if (stageId === 'stage_open') {
      targetBa = clamp(ca - 0.85, 4.2, 16.5);
    } else if (stageId === 'stage_entry') {
      targetBa = input.sex === 'F' ? clamp(Math.max(ca, 9.5), 8.5, 11.5) : clamp(Math.max(ca, 11.0), 9.5, 13.0);
    } else if (stageId === 'stage_phv') {
      targetBa = input.sex === 'F' ? 11.2 : 12.8;
    } else if (stageId === 'stage_decel') {
      targetBa = input.sex === 'F' ? 13.2 : 14.7;
    } else if (stageId === 'stage_near_fusion') {
      targetBa = input.sex === 'F' ? 14.8 : 16.2;
    }

    var totalMonths = Math.round(targetBa * 12);
    var elBaY = document.getElementById('kfk-ba-years');
    var elBaM = document.getElementById('kfk-ba-months');
    if (elBaY) elBaY.value = String(clamp(Math.floor(totalMonths / 12), 4, 18));
    if (elBaM) elBaM.value = String(clamp(totalMonths % 12, 0, 11));

    highlightStageChip(stageId);
    calculateAndRender(false);
  }

  function applyPreset(presetKey) {
    var preset = PRESETS[presetKey];
    if (!preset) return;
    writeInputsToDom(preset);
    highlightStageChip(preset.stage || '');
    calculateAndRender(false);
  }

  function jumpToBoneAgeInterpreter() {
    var sec = document.getElementById('kfk-bone-age-interpreter');
    if (sec && sec.scrollIntoView) {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function initBoneAgeInterpreter() {
    var sec = document.getElementById('kfk-bone-age-interpreter');
    if (!sec) return;

    var saved = loadState();
    if (saved && saved.caYears && saved.heightCm && saved.baYears) {
      writeInputsToDom(saved);
    } else {
      writeInputsToDom(PRESETS.fast_boy);
    }

    var inputs = sec.querySelectorAll('input, select');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener('change', function () {
        if (this.id === 'kfk-ba-years' || this.id === 'kfk-ba-months') {
          highlightStageChip('');
        }
        calculateAndRender(false);
      });
      inputs[i].addEventListener('input', function () {
        if (this.type === 'number') {
          calculateAndRender(false);
        }
      });
    }

    calculateAndRender(false);
  }

  window.KfkBoneAgeInterpreter = {
    init: initBoneAgeInterpreter,
    calculate: calculateAndRender,
    computeReport: computeBoneAgeReport,
    selectStage: selectGrowthPlateStage,
    applyPreset: applyPreset
  };

  window.calculateKfkBoneAge = function () {
    return calculateAndRender(true);
  };
  window.selectKfkBoneAgeSex = function (sex) {
    setSexState(sex === 'F' ? 'F' : 'M');
    calculateAndRender(false);
  };
  window.selectKfkGrowthPlateStage = selectGrowthPlateStage;
  window.applyKfkBoneAgePreset = applyPreset;
  window.jumpToKfkBoneAgeInterpreter = jumpToBoneAgeInterpreter;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBoneAgeInterpreter);
  } else {
    initBoneAgeInterpreter();
  }
})();
