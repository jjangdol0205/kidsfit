/**
 * src/js/bone-age-interpreter.js
 * Division 2 (kisfitglobal.com) — Clinical Bone-Age X-Ray Report Interpreter & Remaining Inches Simulator
 *
 * Architecture:
 * - 100% Client-Side Static Auxology Calculation (Bayley-Pinneau Mature Height Multiplier + Mid-Parental Height)
 * - Supports both US Imperial (ft / in) and Metric (cm) seamlessly
 * - Zero X-ray image upload, zero server transmission, 100% Zero-Hangul English codebase
 * - Connects naturally to Lemon Squeezy Store #296100 ($8.99 Single Report & $19.99 6-Month Growth Pass)
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'kfg_bone_age_interpreter_v1';

  var SINGLE_REPORT_UUID = 'c1cd7f12-3479-49e8-ab71-59c98135d599';
  var SIX_MONTH_PASS_UUID = 'c562946d-ef68-4c2f-a802-df9da0179895';

  // Monotonic Bayley-Pinneau mature height achieved percentages (%) by skeletal Bone Age (4.0 to 18.5 yrs)
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

  var PRESETS = {
    advanced_boy: {
      sex: 'M',
      unit: 'imperial',
      caYears: 10,
      caMonths: 0,
      heightCm: 139.7,
      heightFt: 4,
      heightIn: 7.0,
      baYears: 11,
      baMonths: 4,
      fatherCm: 177.8,
      motherCm: 162.6,
      stage: ''
    },
    ontrack_girl: {
      sex: 'F',
      unit: 'imperial',
      caYears: 9,
      caMonths: 2,
      heightCm: 134.6,
      heightFt: 4,
      heightIn: 5.0,
      baYears: 9,
      baMonths: 3,
      fatherCm: 177.8,
      motherCm: 165.1,
      stage: 'stage_entry'
    },
    late_boy: {
      sex: 'M',
      unit: 'imperial',
      caYears: 11,
      caMonths: 0,
      heightCm: 138.4,
      heightFt: 4,
      heightIn: 6.5,
      baYears: 9,
      baMonths: 10,
      fatherCm: 180.3,
      motherCm: 163.8,
      stage: 'stage_open'
    }
  };

  function clamp(val, min, max) {
    if (isNaN(val)) return min;
    return Math.max(min, Math.min(max, val));
  }

  function cmToTotalInches(cm) {
    return cm / 2.54;
  }

  function ftInToCm(ft, inches) {
    return ((Number(ft) || 0) * 12 + (Number(inches) || 0)) * 2.54;
  }

  function formatFeetInches(cm, decimals) {
    var totalIn = cmToTotalInches(cm);
    var ft = Math.floor(totalIn / 12);
    var remIn = totalIn - ft * 12;
    var dec = typeof decimals === 'number' ? decimals : 1;
    var roundedIn = Number(remIn.toFixed(dec));
    if (roundedIn >= 12) {
      ft += 1;
      roundedIn = 0;
    }
    var inStr = dec === 0 ? String(Math.round(roundedIn)) : roundedIn.toFixed(dec).replace(/\.0$/, '');
    return ft + "'" + inStr + '"';
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
    return yrs + 'y ' + mos + 'm';
  }

  function formatDeltaMonths(deltaYears) {
    var totalMonths = Math.round(deltaYears * 12);
    if (totalMonths === 0) return 'On Track (0 mo)';
    var sign = totalMonths > 0 ? '+' : '-';
    var absM = Math.abs(totalMonths);
    var y = Math.floor(absM / 12);
    var m = absM % 12;
    if (y > 0 && m > 0) return sign + y + 'y ' + m + 'm';
    if (y > 0) return sign + y + 'y';
    return sign + m + 'm';
  }

  function getSexState() {
    var root = document.getElementById('kfg-bone-age-interpreter');
    if (!root) return 'M';
    var active = root.querySelector('[data-kfg-ba-sex].active');
    return active ? active.getAttribute('data-kfg-ba-sex') : 'M';
  }

  function setSexState(sex) {
    var root = document.getElementById('kfg-bone-age-interpreter');
    if (!root) return;
    var btns = root.querySelectorAll('[data-kfg-ba-sex]');
    for (var i = 0; i < btns.length; i++) {
      var match = btns[i].getAttribute('data-kfg-ba-sex') === sex;
      btns[i].classList.toggle('active', match);
      btns[i].setAttribute('aria-pressed', match ? 'true' : 'false');
    }
  }

  function getUnitState() {
    var root = document.getElementById('kfg-bone-age-interpreter');
    if (!root) return 'imperial';
    var active = root.querySelector('[data-kfg-ba-unit].active');
    return active ? active.getAttribute('data-kfg-ba-unit') : 'imperial';
  }

  function setUnitState(unit) {
    var root = document.getElementById('kfg-bone-age-interpreter');
    if (!root) return;
    var mode = unit === 'metric' ? 'metric' : 'imperial';
    var btns = root.querySelectorAll('[data-kfg-ba-unit]');
    for (var i = 0; i < btns.length; i++) {
      var match = btns[i].getAttribute('data-kfg-ba-unit') === mode;
      btns[i].classList.toggle('active', match);
      btns[i].setAttribute('aria-pressed', match ? 'true' : 'false');
    }
    var impWrap = document.getElementById('kfg-ba-imperial-wrap');
    var metWrap = document.getElementById('kfg-ba-metric-wrap');
    if (impWrap) impWrap.style.display = mode === 'imperial' ? 'grid' : 'none';
    if (metWrap) metWrap.style.display = mode === 'metric' ? 'block' : 'none';
  }

  function highlightStageChip(stageId) {
    var root = document.getElementById('kfg-bone-age-interpreter');
    if (!root) return;
    var chips = root.querySelectorAll('[data-kfg-plate-stage]');
    for (var i = 0; i < chips.length; i++) {
      var match = stageId && chips[i].getAttribute('data-kfg-plate-stage') === stageId;
      chips[i].classList.toggle('active', !!match);
      chips[i].setAttribute('aria-pressed', match ? 'true' : 'false');
    }
  }

  function readInputsFromDom() {
    var sex = getSexState();
    var unit = getUnitState();
    var caY = parseInt((document.getElementById('kfg-ba-ca-years') || {}).value, 10);
    var caM = parseInt((document.getElementById('kfg-ba-ca-months') || {}).value, 10);
    var baY = parseInt((document.getElementById('kfg-ba-years') || {}).value, 10);
    var baM = parseInt((document.getElementById('kfg-ba-months') || {}).value, 10);

    var heightCm = 139.7;
    var heightFt = 4;
    var heightIn = 7.0;

    if (unit === 'metric') {
      var rawCm = parseFloat((document.getElementById('kfg-ba-height-cm') || {}).value);
      heightCm = clamp(isNaN(rawCm) ? 139.7 : rawCm, 85, 198);
      var totIn = cmToTotalInches(heightCm);
      heightFt = Math.floor(totIn / 12);
      heightIn = Number((totIn - heightFt * 12).toFixed(1));
    } else {
      heightFt = clamp(parseInt((document.getElementById('kfg-ba-height-ft') || {}).value, 10) || 4, 2, 6);
      var rawIn = parseFloat((document.getElementById('kfg-ba-height-in') || {}).value);
      heightIn = clamp(isNaN(rawIn) ? 7.0 : rawIn, 0, 11.5);
      heightCm = clamp(ftInToCm(heightFt, heightIn), 85, 198);
    }

    var fatherSelect = parseFloat((document.getElementById('kfg-ba-father-cm') || {}).value);
    var motherSelect = parseFloat((document.getElementById('kfg-ba-mother-cm') || {}).value);

    return {
      sex: sex,
      unit: unit,
      caYears: clamp(isNaN(caY) ? 10 : caY, 4, 18),
      caMonths: clamp(isNaN(caM) ? 0 : caM, 0, 11),
      heightCm: heightCm,
      heightFt: heightFt,
      heightIn: heightIn,
      baYears: clamp(isNaN(baY) ? 11 : baY, 4, 18),
      baMonths: clamp(isNaN(baM) ? 0 : baM, 0, 11),
      fatherCm: !isNaN(fatherSelect) && fatherSelect >= 140 ? fatherSelect : null,
      motherCm: !isNaN(motherSelect) && motherSelect >= 135 ? motherSelect : null
    };
  }

  function writeInputsToDom(state) {
    if (!state) return;
    setSexState(state.sex === 'F' ? 'F' : 'M');
    setUnitState(state.unit === 'metric' ? 'metric' : 'imperial');

    var elCaY = document.getElementById('kfg-ba-ca-years');
    var elCaM = document.getElementById('kfg-ba-ca-months');
    var elCm = document.getElementById('kfg-ba-height-cm');
    var elFt = document.getElementById('kfg-ba-height-ft');
    var elIn = document.getElementById('kfg-ba-height-in');
    var elBaY = document.getElementById('kfg-ba-years');
    var elBaM = document.getElementById('kfg-ba-months');
    var elFa = document.getElementById('kfg-ba-father-cm');
    var elMo = document.getElementById('kfg-ba-mother-cm');

    if (elCaY) elCaY.value = String(state.caYears);
    if (elCaM) elCaM.value = String(state.caMonths);
    if (elCm) elCm.value = Number(state.heightCm).toFixed(1);
    if (elFt && state.heightFt !== undefined) elFt.value = String(state.heightFt);
    if (elIn && state.heightIn !== undefined) elIn.value = String(state.heightIn);
    if (elBaY) elBaY.value = String(state.baYears);
    if (elBaM) elBaM.value = String(state.baMonths);
    if (elFa && state.fatherCm) elFa.value = String(state.fatherCm);
    if (elMo && state.motherCm) elMo.value = String(state.motherCm);
  }

  function computeBoneAgeReport(input) {
    var ca = input.caYears + input.caMonths / 12;
    var ba = input.baYears + input.baMonths / 12;
    var deltaBa = ba - ca;

    var achievedPct = interpolateMaturePct(input.sex, ba);
    var onTrackPct = interpolateMaturePct(input.sex, ca);

    var rawPahCm = input.heightCm / (achievedPct / 100);
    var pahCm = clamp(rawPahCm, input.heightCm, 210.0);
    var remainingCm = Math.max(0, pahCm - input.heightCm);
    var remainingIn = cmToTotalInches(remainingCm);
    var remainingPct = Math.max(0, 100 - achievedPct);

    var peerPahCm = clamp(input.heightCm / (onTrackPct / 100), input.heightCm, 210.0);
    var vsChronoDiffCm = pahCm - peerPahCm;
    var vsChronoDiffIn = cmToTotalInches(Math.abs(vsChronoDiffCm));

    var mphCm = null;
    if (input.fatherCm && input.motherCm) {
      mphCm = input.sex === 'F'
        ? (input.fatherCm + input.motherCm - 13) / 2
        : (input.fatherCm + input.motherCm + 13) / 2;
    }

    var paceType = 'normal';
    var badgeText = '🟢 On-Track Skeletal Pace · Balanced Plate Rhythm';
    var headlineSummary = '';
    var protocolSteps = [];

    if (deltaBa >= 0.75) {
      paceType = 'fast';
      badgeText = '⚠️ Advanced Bone Pace (' + formatDeltaMonths(deltaBa) + ') · Protect Open-Plate Runway';
      headlineSummary =
        'Because skeletal bone age (' + formatYearsMonths(ba) + ') is running ' + formatDeltaMonths(deltaBa) +
        ' ahead of chronological age (' + formatYearsMonths(ca) + '), about ' + vsChronoDiffIn.toFixed(1) +
        ' in (' + Math.abs(vsChronoDiffCm).toFixed(1) + ' cm) of potential adult stature runway is compressed compared with an on-track plate clock. Protecting 9:30 PM Slow-Wave Sleep, healthy body-fat balance, and spinal decompression habits tonight is critical.';
      protocolSteps = [
        '🌙 9:30 PM Lights-Out Melatonin Guard: Late blue-light exposure suppresses melatonin and can accelerate epiphyseal maturation.',
        '🥗 Evening Glycemic & Ultra-Processed Cutoff: Excess insulin and rapid weight gain speed up estrogen-mediated growth-plate closure.',
        '💺 Decompression & Ergonomic Desk Alignment: Reclaim 0.8–1.2 in (2–3 cm) of postural height while plates remain active.'
      ];
    } else if (deltaBa <= -0.75) {
      paceType = 'slow';
      badgeText = '🌱 Late-Bloomer Advantage (' + formatDeltaMonths(deltaBa) + ') · Extra Open-Plate Runway';
      headlineSummary =
        'Skeletal bone age (' + formatYearsMonths(ba) + ') is ' + formatDeltaMonths(deltaBa) +
        ' younger than chronological age (' + formatYearsMonths(ca) + '), giving your child roughly ' +
        Math.abs(deltaBa * 12).toFixed(0) + ' extra months of open-plate growth time compared with same-age peers. Supplying steady Calcium + D3 + K2 + Protein and daily vertical jump loading helps convert this runway into real adult inches.';
      protocolSteps = [
        '🥛 Growth-Plate Mineral & Protein Density: Pair daily Calcium, Vitamin D3 + K2, Zinc, and 1.1g/kg complete protein while plates stay wide open.',
        '🏃 10-Min Daily Vertical Jump Micro-Loading: Gentle jump-rope or basketball plyometrics stimulate chondrocyte proliferation.',
        '📅 30-Day Velocity Slope Check: Track monthly height velocity so your child smoothly enters Peak Height Velocity on schedule.'
      ];
    } else {
      paceType = 'normal';
      badgeText = '🟢 On-Track Skeletal Pace (' + formatDeltaMonths(deltaBa) + ') · Balanced Growth Window';
      headlineSummary =
        'Chronological age (' + formatYearsMonths(ca) + ') and wrist bone age (' + formatYearsMonths(ba) +
        ') are closely aligned. With approximately +' + remainingIn.toFixed(1) + ' in (+' + remainingCm.toFixed(1) +
        ' cm) of open-plate stature potential remaining, consistent Stage-3 deep sleep, bone-matrix nutrition, and monthly CDC velocity checks keep your child on the upper trajectory.';
      protocolSteps = [
        '🌙 Protect Stage-3 Slow-Wave Sleep (N3): Up to 70% of daily pulsatile pituitary HGH is secreted during early-night deep sleep.',
        '🥛 Pre-Spurt Nutrient Sufficiency: Maintain age-matched Protein, Calcium, Vitamin D3, and Magnesium every day.',
        '📏 Quarterly Bone & Stature Velocity Tracking: Catch subtle percentile shifts 6–9 months before growth slows down.'
      ];
    }

    return {
      sex: input.sex,
      unit: input.unit,
      ca: ca,
      ba: ba,
      deltaBa: deltaBa,
      heightCm: input.heightCm,
      achievedPct: achievedPct,
      remainingPct: remainingPct,
      remainingCm: remainingCm,
      remainingIn: remainingIn,
      pahCm: pahCm,
      pahLowCm: Math.max(input.heightCm, pahCm - 2.0),
      pahHighCm: pahCm + 2.0,
      mphCm: mphCm,
      paceType: paceType,
      badgeText: badgeText,
      headlineSummary: headlineSummary,
      protocolSteps: protocolSteps
    };
  }

  function renderReport(report) {
    var container = document.getElementById('kfg-bone-age-result');
    if (!container) return;

    var mphHtml = '';
    if (report.mphCm) {
      var diffCm = report.pahCm - report.mphCm;
      var diffIn = cmToTotalInches(diffCm);
      var sign = diffCm >= 0 ? '+' : '';
      mphHtml =
        '<div class="kfg-ba-mph-bar">' +
          '<span>🧬 Genetic Mid-Parental Target: <strong>' + formatFeetInches(report.mphCm, 1) + ' (' + report.mphCm.toFixed(1) + ' cm)</strong></span>' +
          '<span class="kfg-ba-mph-diff ' + (diffCm >= 0 ? 'is-plus' : 'is-minus') + '">' +
            'Bone-Age Projection vs. Genetic Target: <strong>' + sign + diffIn.toFixed(1) + ' in (' + sign + diffCm.toFixed(1) + ' cm)</strong>' +
          '</span>' +
        '</div>';
    }

    var stepsHtml = '';
    for (var i = 0; i < report.protocolSteps.length; i++) {
      stepsHtml += '<li>' + report.protocolSteps[i] + '</li>';
    }

    var achievedWidth = clamp(report.achievedPct, 8, 99.5).toFixed(1);
    var remainingWidth = Math.max(0.5, 100 - parseFloat(achievedWidth)).toFixed(1);

    container.innerHTML =
      '<div class="kfg-ba-report-box pace-' + report.paceType + '">' +
        '<div class="kfg-ba-report-head">' +
          '<span class="kfg-ba-pace-badge pace-' + report.paceType + '">' + report.badgeText + '</span>' +
          '<span class="kfg-ba-meta-pill">' +
            (report.sex === 'F' ? 'Girl' : 'Boy') + ' · Current ' + formatFeetInches(report.heightCm, 1) +
            ' (' + report.heightCm.toFixed(1) + ' cm) · Bone Age ' + formatYearsMonths(report.ba) +
          '</span>' +
        '</div>' +

        '<div class="kfg-ba-kpi-grid">' +
          '<div class="kfg-ba-kpi-card is-highlight">' +
            '<span class="kfg-ba-kpi-label">Estimated Growth Remaining</span>' +
            '<strong class="kfg-ba-kpi-value">+' + report.remainingIn.toFixed(1) + '<small>in</small></strong>' +
            '<span class="kfg-ba-kpi-sub">+' + report.remainingCm.toFixed(1) + ' cm · ' + report.remainingPct.toFixed(1) + '% Plate Runway Left</span>' +
          '</div>' +
          '<div class="kfg-ba-kpi-card">' +
            '<span class="kfg-ba-kpi-label">Bone-Age Projected Adult Height</span>' +
            '<strong class="kfg-ba-kpi-value">' + formatFeetInches(report.pahCm, 1) + '</strong>' +
            '<span class="kfg-ba-kpi-sub">' + report.pahCm.toFixed(1) + ' cm (Range ' + formatFeetInches(report.pahLowCm, 0) + '–' + formatFeetInches(report.pahHighCm, 0) + ')</span>' +
          '</div>' +
          '<div class="kfg-ba-kpi-card">' +
            '<span class="kfg-ba-kpi-label">Bone Age vs. Actual Age Gap</span>' +
            '<strong class="kfg-ba-kpi-value is-delta">' + formatDeltaMonths(report.deltaBa) + '</strong>' +
            '<span class="kfg-ba-kpi-sub">Actual ' + formatYearsMonths(report.ca) + ' / Bone ' + formatYearsMonths(report.ba) + '</span>' +
          '</div>' +
        '</div>' +

        mphHtml +

        '<div class="kfg-ba-gauge-card">' +
          '<div class="kfg-ba-gauge-labels">' +
            '<span>Adult Height Achieved: <strong>' + report.achievedPct.toFixed(1) + '%</strong> (' + formatFeetInches(report.heightCm, 1) + ')</span>' +
            '<span class="kfg-ba-gauge-remain">🔥 Open-Plate Potential Left: <strong>' + report.remainingPct.toFixed(1) + '% (+' + report.remainingIn.toFixed(1) + ' in / +' + report.remainingCm.toFixed(1) + ' cm)</strong></span>' +
          '</div>' +
          '<div class="kfg-ba-gauge-track" role="img" aria-label="Adult height achieved ' + report.achievedPct.toFixed(1) + ' percent, open plate potential left ' + report.remainingPct.toFixed(1) + ' percent">' +
            '<div class="kfg-ba-gauge-achieved" style="width:' + achievedWidth + '%;"></div>' +
            '<div class="kfg-ba-gauge-open" style="width:' + remainingWidth + '%;"></div>' +
          '</div>' +
          '<p class="kfg-ba-summary-text">' + report.headlineSummary + '</p>' +
        '</div>' +

        '<div class="kfg-ba-tips-box">' +
          '<strong class="kfg-ba-tips-title">🩺 Tonight&apos;s 3-Step Bone-Age Home Protocol</strong>' +
          '<ul class="kfg-ba-tips-list">' + stepsHtml + '</ul>' +
        '</div>' +

        '<div class="kfg-ba-cta-bridge">' +
          '<div class="kfg-ba-cta-copy">' +
            '<strong>Want a Full Pediatrician-Ready 2-Page PDF &amp; 90-Day Sleep/Nutrition Plan for This Bone Age?</strong>' +
            '<span>Combine your child&apos;s wrist bone-age runway with US CDC 2000 LMS curves &amp; Khamis-Roche velocity tracking.</span>' +
          '</div>' +
          '<div class="kfg-ba-cta-btns">' +
            '<button type="button" class="kfg-ba-btn-single" data-ls-product-uuid="' + SINGLE_REPORT_UUID + '" onclick="if(window.triggerKfgVelocityEdgeCheckout)window.triggerKfgVelocityEdgeCheckout(\'single\');">' +
              '<span>📄 Unlock Single Clinical Growth Report — $8.99 →</span>' +
              '<small>One-time 2-Page Doctor PDF + 90-Day Action Plan</small>' +
            '</button>' +
            '<button type="button" class="kfg-ba-btn-pass" data-ls-product-uuid="' + SIX_MONTH_PASS_UUID + '" onclick="if(window.triggerKfgVelocityEdgeCheckout)window.triggerKfgVelocityEdgeCheckout(\'pass\');">' +
              '<span>⭐ Get 6-Month Growth &amp; Bone-Age Pass — $19.99 →</span>' +
              '<small>Unlimited 30-Day Velocity Re-Scans + Sibling Profiles</small>' +
            '</button>' +
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
      var resEl = document.getElementById('kfg-bone-age-result');
      if (resEl && resEl.scrollIntoView) {
        resEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    return report;
  }

  function switchUnit(newUnit) {
    var current = readInputsFromDom();
    current.unit = newUnit === 'metric' ? 'metric' : 'imperial';
    var totIn = cmToTotalInches(current.heightCm);
    current.heightFt = Math.floor(totIn / 12);
    current.heightIn = Number((totIn - current.heightFt * 12).toFixed(1));
    writeInputsToDom(current);
    calculateAndRender(false);
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
    var elBaY = document.getElementById('kfg-ba-years');
    var elBaM = document.getElementById('kfg-ba-months');
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

  function initBoneAgeInterpreter() {
    var sec = document.getElementById('kfg-bone-age-interpreter');
    if (!sec) return;

    var saved = loadState();
    if (saved && saved.caYears && saved.heightCm && saved.baYears) {
      writeInputsToDom(saved);
    } else {
      writeInputsToDom(PRESETS.advanced_boy);
    }

    var controls = sec.querySelectorAll('input, select');
    for (var i = 0; i < controls.length; i++) {
      controls[i].addEventListener('change', function () {
        if (this.id === 'kfg-ba-years' || this.id === 'kfg-ba-months') {
          highlightStageChip('');
        }
        calculateAndRender(false);
      });
      controls[i].addEventListener('input', function () {
        if (this.type === 'number') {
          calculateAndRender(false);
        }
      });
    }

    calculateAndRender(false);
  }

  window.KfgBoneAgeInterpreter = {
    init: initBoneAgeInterpreter,
    calculate: calculateAndRender,
    computeReport: computeBoneAgeReport,
    selectStage: selectGrowthPlateStage,
    applyPreset: applyPreset
  };

  window.calculateKfgBoneAge = function () {
    return calculateAndRender(true);
  };
  window.selectKfgBoneAgeSex = function (sex) {
    setSexState(sex === 'F' ? 'F' : 'M');
    calculateAndRender(false);
  };
  window.selectKfgBoneAgeUnit = switchUnit;
  window.selectKfgGrowthPlateStage = selectGrowthPlateStage;
  window.applyKfgBoneAgePreset = applyPreset;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBoneAgeInterpreter);
  } else {
    initBoneAgeInterpreter();
  }
})();
