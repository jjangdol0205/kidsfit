/**
 * src/js/kfk-atelier-app.js
 * 키즈핏 소아성장 아틀리에 (KidsFit Pediatric Growth Atelier — kidsfit.co.kr)
 *
 * Single-Breath 4-Screen Step-Up Auxology Engine:
 *  - Screen 0: Founding Letter & Service Essence (#kfk-peer-growth-editorial)
 *  - Screen 1: 5-Step Focused Step-Up Survey (#quiz-section, Steps 1/5 .. 5/5)
 *              including Optional Hospital Bone-Age & Exam-Date Time-Lag (Δt) Calibration (#kfk-bone-age-interpreter)
 *  - Screen 2: Passwordless Email Registration (#kfk-parent-habit-notebook / #kfk-passwordless-club-box)
 *  - Screen 3: Free KDCA 2017 Percentile Basic Summary + Differential Vault + Latpeed 2-Tier Pure Paid Passes
 *              (#kfk-latpeed-ebook-slot: 9,900 KRW Single Report / 19,900 KRW 6-Month Velocity Tracker)
 *              + Returning Paid Pass Restore & Monthly Velocity Check-in (#kfk-vip-monthly-checkin)
 *
 * Strictly 0 affiliate links, 0 commercial discount buzzwords, 0 emojis.
 */
(function (global) {
  'use strict';

  var PROFILE_KEY = 'kfk_saved_survey_profile_v1';
  var EMAIL_UNLOCK_KEY = 'kfk_email_summary_unlocked_v1';
  var PAID_PASS_KEY = 'kfk_paid_pass_v1';
  var VELOCITY_LOGS_KEY = 'kfk_vip_velocity_logs_v1';

  // Official KDCA 2017 Pediatric Growth Standards (12~240 months, Height & Weight LMS + Percentiles)
  var KDCA_2017 = {
    boy: [
      { m: 12, L: 1.0, M: 75.7, S: 0.0337, p3: 71.0, p25: 74.0, p50: 75.7, p75: 77.4, p97: 80.5, wM: 9.8, wS: 0.102 },
      { m: 18, L: 1.0, M: 82.3, S: 0.0352, p3: 76.9, p25: 80.4, p50: 82.3, p75: 84.3, p97: 87.8, wM: 11.1, wS: 0.104 },
      { m: 24, L: 1.0, M: 87.1, S: 0.0371, p3: 81.0, p25: 84.9, p50: 87.1, p75: 89.3, p97: 93.2, wM: 12.3, wS: 0.107 },
      { m: 36, L: 1.0, M: 96.5, S: 0.0401, p3: 89.7, p25: 94.0, p50: 96.5, p75: 99.0, p97: 104.4, wM: 14.7, wS: 0.115 },
      { m: 48, L: 1.0, M: 103.1, S: 0.0416, p3: 95.6, p25: 100.4, p50: 103.1, p75: 105.9, p97: 111.2, wM: 16.7, wS: 0.124 },
      { m: 60, L: 1.0, M: 109.6, S: 0.0429, p3: 101.6, p25: 106.7, p50: 109.6, p75: 112.6, p97: 118.0, wM: 19.0, wS: 0.136 },
      { m: 72, L: 1.0, M: 115.9, S: 0.0404, p3: 107.2, p25: 112.8, p50: 115.9, p75: 119.1, p97: 124.7, wM: 21.5, wS: 0.149 },
      { m: 84, L: 1.0, M: 122.1, S: 0.0407, p3: 112.5, p25: 118.8, p50: 122.1, p75: 125.4, p97: 131.2, wM: 24.4, wS: 0.163 },
      { m: 96, L: 1.0, M: 127.9, S: 0.0410, p3: 117.7, p25: 124.3, p50: 127.9, p75: 131.5, p97: 137.4, wM: 27.6, wS: 0.175 },
      { m: 108, L: 1.0, M: 133.4, S: 0.0415, p3: 122.8, p25: 129.5, p50: 133.4, p75: 137.3, p97: 143.6, wM: 31.3, wS: 0.184 },
      { m: 120, L: 1.0, M: 138.8, S: 0.0437, p3: 128.4, p25: 134.8, p50: 138.8, p75: 143.0, p97: 150.2, wM: 35.5, wS: 0.190 },
      { m: 126, L: 1.0, M: 141.7, S: 0.0490, p3: 129.5, p25: 137.3, p50: 141.7, p75: 146.5, p97: 155.2, wM: 37.8, wS: 0.192 },
      { m: 132, L: 1.0, M: 144.7, S: 0.0544, p3: 130.6, p25: 139.8, p50: 144.7, p75: 150.0, p97: 160.2, wM: 40.2, wS: 0.193 },
      { m: 144, L: 1.0, M: 151.4, S: 0.0576, p3: 135.1, p25: 145.6, p50: 151.4, p75: 157.3, p97: 167.9, wM: 45.4, wS: 0.191 },
      { m: 156, L: 1.0, M: 158.6, S: 0.0562, p3: 140.5, p25: 152.3, p50: 158.6, p75: 164.6, p97: 174.9, wM: 51.0, wS: 0.185 },
      { m: 168, L: 1.0, M: 165.0, S: 0.0510, p3: 145.1, p25: 159.1, p50: 165.0, p75: 170.6, p97: 180.2, wM: 56.5, wS: 0.176 },
      { m: 180, L: 1.0, M: 169.2, S: 0.0465, p3: 148.2, p25: 163.9, p50: 169.2, p75: 174.3, p97: 183.5, wM: 61.0, wS: 0.168 },
      { m: 192, L: 1.0, M: 171.4, S: 0.0435, p3: 150.0, p25: 166.7, p50: 171.4, p75: 176.2, p97: 185.1, wM: 63.8, wS: 0.162 },
      { m: 204, L: 1.0, M: 172.6, S: 0.0420, p3: 150.9, p25: 168.0, p50: 172.6, p75: 177.3, p97: 185.8, wM: 65.3, wS: 0.158 },
      { m: 216, L: 1.0, M: 173.6, S: 0.0410, p3: 151.4, p25: 169.0, p50: 173.6, p75: 178.3, p97: 186.2, wM: 66.2, wS: 0.155 },
      { m: 240, L: 1.0, M: 174.1, S: 0.0406, p3: 160.0, p25: 169.5, p50: 174.1, p75: 178.8, p97: 186.5, wM: 67.2, wS: 0.152 }
    ],
    girl: [
      { m: 12, L: 1.0, M: 74.0, S: 0.0349, p3: 69.2, p25: 72.3, p50: 74.0, p75: 75.7, p97: 78.9, wM: 9.2, wS: 0.105 },
      { m: 18, L: 1.0, M: 80.7, S: 0.0366, p3: 75.2, p25: 78.8, p50: 80.7, p75: 82.7, p97: 86.3, wM: 10.5, wS: 0.108 },
      { m: 24, L: 1.0, M: 85.7, S: 0.0384, p3: 79.3, p25: 83.4, p50: 85.7, p75: 88.0, p97: 92.1, wM: 11.7, wS: 0.111 },
      { m: 36, L: 1.0, M: 95.4, S: 0.0409, p3: 88.1, p25: 92.8, p50: 95.4, p75: 98.0, p97: 103.0, wM: 14.1, wS: 0.119 },
      { m: 48, L: 1.0, M: 102.2, S: 0.0422, p3: 94.4, p25: 99.4, p50: 102.2, p75: 105.0, p97: 110.1, wM: 16.1, wS: 0.129 },
      { m: 60, L: 1.0, M: 108.4, S: 0.0435, p3: 99.9, p25: 105.3, p50: 108.4, p75: 111.5, p97: 117.0, wM: 18.3, wS: 0.141 },
      { m: 72, L: 1.0, M: 114.7, S: 0.0445, p3: 106.6, p25: 111.8, p50: 114.7, p75: 117.8, p97: 123.3, wM: 20.8, wS: 0.153 },
      { m: 84, L: 1.0, M: 120.8, S: 0.0460, p3: 112.2, p25: 117.8, p50: 120.8, p75: 124.0, p97: 130.2, wM: 23.6, wS: 0.165 },
      { m: 96, L: 1.0, M: 126.7, S: 0.0478, p3: 117.5, p25: 123.5, p50: 126.7, p75: 130.2, p97: 137.1, wM: 26.8, wS: 0.175 },
      { m: 108, L: 1.0, M: 132.6, S: 0.0501, p3: 122.8, p25: 129.2, p50: 132.6, p75: 136.5, p97: 144.1, wM: 30.5, wS: 0.183 },
      { m: 120, L: 1.0, M: 139.1, S: 0.0526, p3: 128.2, p25: 135.2, p50: 139.1, p75: 143.5, p97: 151.2, wM: 34.8, wS: 0.187 },
      { m: 126, L: 1.0, M: 142.5, S: 0.0529, p3: 131.0, p25: 138.4, p50: 142.5, p75: 146.9, p97: 154.4, wM: 37.2, wS: 0.187 },
      { m: 132, L: 1.0, M: 145.8, S: 0.0532, p3: 133.8, p25: 141.5, p50: 145.8, p75: 150.3, p97: 157.6, wM: 39.7, wS: 0.186 },
      { m: 144, L: 1.0, M: 151.7, S: 0.0494, p3: 139.5, p25: 147.3, p50: 151.7, p75: 156.1, p97: 162.6, wM: 44.5, wS: 0.180 },
      { m: 156, L: 1.0, M: 155.9, S: 0.0438, p3: 144.7, p25: 151.9, p50: 155.9, p75: 160.0, p97: 166.0, wM: 48.6, wS: 0.171 },
      { m: 168, L: 1.0, M: 158.3, S: 0.0416, p3: 147.9, p25: 154.5, p50: 158.3, p75: 162.2, p97: 168.1, wM: 51.5, wS: 0.162 },
      { m: 180, L: 1.0, M: 159.5, S: 0.0408, p3: 149.3, p25: 155.7, p50: 159.5, p75: 163.3, p97: 169.2, wM: 53.2, wS: 0.155 },
      { m: 192, L: 1.0, M: 160.0, S: 0.0403, p3: 150.3, p25: 156.3, p50: 160.0, p75: 163.8, p97: 169.8, wM: 54.1, wS: 0.150 },
      { m: 204, L: 1.0, M: 160.2, S: 0.0400, p3: 151.0, p25: 156.6, p50: 160.2, p75: 164.0, p97: 170.1, wM: 54.5, wS: 0.147 },
      { m: 216, L: 1.0, M: 160.3, S: 0.0398, p3: 151.2, p25: 156.8, p50: 160.3, p75: 164.1, p97: 170.2, wM: 54.7, wS: 0.145 },
      { m: 240, L: 1.0, M: 160.5, S: 0.0395, p3: 151.4, p25: 157.0, p50: 160.5, p75: 164.3, p97: 170.4, wM: 55.0, wS: 0.143 }
    ]
  };

  // Bayley-Pinneau Mature Height Achieved (%) by Bone Age
  var BP_BOY = [
    { ba: 3.0, pct: 57.2 }, { ba: 4.0, pct: 61.5 }, { ba: 5.0, pct: 64.6 }, { ba: 6.0, pct: 67.6 },
    { ba: 7.0, pct: 69.5 }, { ba: 8.0, pct: 72.3 }, { ba: 9.0, pct: 75.2 }, { ba: 10.0, pct: 78.4 },
    { ba: 11.0, pct: 80.4 }, { ba: 12.0, pct: 83.4 }, { ba: 13.0, pct: 87.6 }, { ba: 14.0, pct: 92.7 },
    { ba: 15.0, pct: 96.8 }, { ba: 16.0, pct: 98.2 }, { ba: 17.0, pct: 99.1 }, { ba: 18.0, pct: 99.8 },
    { ba: 18.5, pct: 100.0 }
  ];

  var BP_GIRL = [
    { ba: 3.0, pct: 62.4 }, { ba: 4.0, pct: 66.8 }, { ba: 5.0, pct: 70.1 }, { ba: 6.0, pct: 73.3 },
    { ba: 7.0, pct: 76.3 }, { ba: 8.0, pct: 79.5 }, { ba: 9.0, pct: 82.7 }, { ba: 10.0, pct: 86.2 },
    { ba: 11.0, pct: 90.6 }, { ba: 12.0, pct: 92.2 }, { ba: 13.0, pct: 95.8 }, { ba: 14.0, pct: 98.0 },
    { ba: 15.0, pct: 99.0 }, { ba: 16.0, pct: 99.6 }, { ba: 17.0, pct: 99.9 }, { ba: 17.5, pct: 100.0 }
  ];

  var state = {
    currentScreen: 0,
    currentStep: 1,
    lastAnalysis: null
  };

  function clamp(val, min, max) {
    if (isNaN(val)) return min;
    return Math.max(min, Math.min(max, val));
  }

  function safeSetStorage(key, val) {
    var str = typeof val === 'string' ? val : JSON.stringify(val);
    try { if (global.localStorage) global.localStorage.setItem(key, str); } catch (_) {}
    try { if (global.sessionStorage) global.sessionStorage.setItem(key, str); } catch (_) {}
  }

  function safeGetStorage(key) {
    try {
      if (global.localStorage) {
        var v = global.localStorage.getItem(key);
        if (v !== null && v !== undefined) return v;
      }
    } catch (_) {}
    try {
      if (global.sessionStorage) {
        var s = global.sessionStorage.getItem(key);
        if (s !== null && s !== undefined) return s;
      }
    } catch (_) {}
    return null;
  }

  function erf(x) {
    var sign = x < 0 ? -1 : 1;
    var ax = Math.abs(x);
    var t = 1.0 / (1.0 + 0.3275911 * ax);
    var y = 1.0 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-ax * ax);
    return sign * y;
  }

  function normalCDF(z) {
    return 0.5 * (1.0 + erf(z / Math.SQRT2));
  }

  function getKdcaRow(sex, exactMonths) {
    var key = (sex === 'girl' || sex === 'F') ? 'girl' : 'boy';
    var tbl = (global.KIDSFIT_GROWTH_DATA && Array.isArray(global.KIDSFIT_GROWTH_DATA[key]))
      ? global.KIDSFIT_GROWTH_DATA[key]
      : KDCA_2017[key];
    var m = clamp(Number(exactMonths) || 120, 12, 240);
    if (m <= tbl[0].m) return tbl[0];
    if (m >= tbl[tbl.length - 1].m) return tbl[tbl.length - 1];
    for (var i = 0; i < tbl.length - 1; i++) {
      var r1 = tbl[i];
      var r2 = tbl[i + 1];
      if (m >= r1.m && m <= r2.m) {
        var a = (m - r1.m) / (r2.m - r1.m);
        return {
          m: m,
          L: (1 - a) * (r1.L || 1) + a * (r2.L || 1),
          M: (1 - a) * r1.M + a * r2.M,
          S: (1 - a) * r1.S + a * r2.S,
          p3: (1 - a) * r1.p3 + a * r2.p3,
          p25: (1 - a) * (r1.p25 || (r1.p3 + r1.p50) / 2) + a * (r2.p25 || (r2.p3 + r2.p50) / 2),
          p50: (1 - a) * r1.p50 + a * r2.p50,
          p75: (1 - a) * (r1.p75 || (r1.p50 + r1.p97) / 2) + a * (r2.p75 || (r2.p50 + r2.p97) / 2),
          p97: (1 - a) * r1.p97 + a * r2.p97,
          wM: (1 - a) * (r1.wM || 30) + a * (r2.wM || 30),
          wS: (1 - a) * (r1.wS || 0.16) + a * (r2.wS || 0.16)
        };
      }
    }
    return tbl[0];
  }

  function calculateKdcaPercentile(heightCm, exactMonths, sex) {
    var row = getKdcaRow(sex, exactMonths);
    var h = Number(heightCm) || row.M;
    var z = (L_safe(row.L) === 0)
      ? Math.log(h / row.M) / row.S
      : (Math.pow(h / row.M, row.L) - 1) / (row.L * row.S);
    var pct = clamp(normalCDF(z) * 100, 0.1, 99.9);
    return {
      zScore: Math.round(z * 100) / 100,
      percentile: Math.round(pct * 10) / 10,
      medianCm: Math.round(row.M * 10) / 10,
      diffFromMedianCm: Math.round((h - row.M) * 10) / 10,
      p3: Math.round(row.p3 * 10) / 10,
      p25: Math.round(row.p25 * 10) / 10,
      p50: Math.round(row.p50 * 10) / 10,
      p75: Math.round(row.p75 * 10) / 10,
      p97: Math.round(row.p97 * 10) / 10
    };
  }

  function L_safe(L) {
    return (L === undefined || L === null) ? 1.0 : Number(L);
  }

  function daysInCalendarMonth(year, month1To12) {
    return new Date(year, month1To12, 0).getDate();
  }

  function parseCalendarYmd(input, fallbackDate) {
    if (typeof input === 'string') {
      var m = input.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (m) {
        return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
      }
    }
    var dt = (input instanceof Date && !isNaN(input.getTime())) ? input : (fallbackDate || new Date());
    if (
      input instanceof Date &&
      dt.getUTCHours() === 0 &&
      dt.getUTCMinutes() === 0 &&
      dt.getUTCSeconds() === 0 &&
      dt.getUTCMilliseconds() === 0 &&
      dt.getTimezoneOffset() > 0 &&
      dt.getHours() !== 0
    ) {
      return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
    }
    return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
  }

  function computeExactAgeFromDob(birthYear, birthMonth, birthDay, nowOverride) {
    var refInput = nowOverride;
    var y1, m1, d1;
    if (typeof birthYear === 'string' && /^\d{4}-\d{1,2}-\d{1,2}/.test(birthYear.trim())) {
      var parsedDob = parseCalendarYmd(birthYear);
      y1 = parsedDob.y;
      m1 = clamp(parsedDob.m, 1, 12);
      d1 = clamp(parsedDob.d, 1, daysInCalendarMonth(y1, m1));
      if (refInput === undefined && birthMonth !== undefined) {
        refInput = birthMonth;
      }
    } else {
      var refTmp = parseCalendarYmd(refInput);
      y1 = parseInt(birthYear, 10) || (refTmp.y - 10);
      m1 = clamp(parseInt(birthMonth, 10) || 5, 1, 12);
      d1 = clamp(parseInt(birthDay, 10) || 15, 1, daysInCalendarMonth(y1, m1));
    }

    var nowYmd = parseCalendarYmd(refInput);
    var y2 = nowYmd.y;
    var m2 = nowYmd.m;
    var d2 = nowYmd.d;

    var d1InCurrMonth = Math.min(d1, daysInCalendarMonth(y2, m2));
    var calendarMonths = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1InCurrMonth ? 1 : 0);
    var remDays = 0;
    if (d2 >= d1InCurrMonth) {
      remDays = d2 - d1InCurrMonth;
    } else {
      var prevY = m2 === 1 ? (y2 - 1) : y2;
      var prevM = m2 === 1 ? 12 : (m2 - 1);
      var prevMaxD = daysInCalendarMonth(prevY, prevM);
      remDays = Math.max(0, prevMaxD - Math.min(d1, prevMaxD) + d2);
    }

    var fracMonth = Math.min(0.9, Math.round((remDays / 30.4375) * 10) / 10);
    var clampedWhole = clamp(calendarMonths, 12, 228);
    var clampedExact = clamp(Math.round((calendarMonths + fracMonth) * 10) / 10, 12, 228);

    return {
      birthYear: y1,
      birthMonth: m1,
      birthDay: d1,
      ageMonths: clampedWhole,
      calendarMonths: clampedWhole,
      exactMonths: clampedExact,
      ageYears: Math.floor(clampedWhole / 12),
      remMonths: clampedWhole % 12
    };
  }

  function interpolateBpMaturePct(sex, boneAgeYears) {
    var tbl = (sex === 'girl' || sex === 'F') ? BP_GIRL : BP_BOY;
    var ba = clamp(Number(boneAgeYears) || 10, tbl[0].ba, tbl[tbl.length - 1].ba);
    if (ba <= tbl[0].ba) return tbl[0].pct;
    if (ba >= tbl[tbl.length - 1].ba) return tbl[tbl.length - 1].pct;
    for (var i = 0; i < tbl.length - 1; i++) {
      if (ba >= tbl[i].ba && ba <= tbl[i + 1].ba) {
        var r = (ba - tbl[i].ba) / (tbl[i + 1].ba - tbl[i].ba);
        return tbl[i].pct + r * (tbl[i + 1].pct - tbl[i].pct);
      }
    }
    return 80.0;
  }

  /**
   * Hospital Bone-Age Exam-Date Time-Lag (Δt) Calibration Engine
   * BA_projected_today = BA_exam + (deltaMonths / 12) * tempoFactor
   */
  function computeBoneAgeDeltaCalibration(params) {
    var p = params || {};
    var now = (p.nowDate instanceof Date && !isNaN(p.nowDate.getTime())) ? p.nowDate : new Date();
    var todayY = now.getFullYear();
    var todayM = now.getMonth() + 1;

    var baY = clamp(parseInt(p.baYears, 10) || 10, 3, 18);
    var baM = clamp(parseInt(p.baMonths, 10) || 0, 0, 11);
    var baExam = baY + baM / 12;

    var examY = parseInt(p.examYear, 10);
    var examM = parseInt(p.examMonth, 10);
    if (isNaN(examY) || isNaN(examM) || examM < 1 || examM > 12) {
      var lag = Math.max(0, parseInt(p.lagMonths, 10) || 0);
      var tot = todayY * 12 + (todayM - 1) - lag;
      examY = Math.floor(tot / 12);
      examM = (tot % 12) + 1;
    }

    var deltaMonths = Math.max(0, (todayY - examY) * 12 + (todayM - examM));
    var hasAccel = Boolean(p.tempoAccel);
    var tempoFactor = hasAccel ? 1.08 : 1.0;
    var maxCap = (p.sex === 'girl' || p.sex === 'F') ? 17.5 : 18.5;
    var baProjected = clamp(baExam + (deltaMonths / 12) * tempoFactor, 3.0, maxCap);

    var projTotalM = Math.round(baProjected * 12);
    var projY = Math.floor(projTotalM / 12);
    var projM = Math.abs(projTotalM % 12);
    var mmStr = examM < 10 ? '0' + examM : String(examM);
    var lagLabel = deltaMonths === 0 ? '이번 달 검사' : (deltaMonths + '개월 전 검사');
    var tempoText = tempoFactor > 1.0 ? ', 최근 빠른 성장 속도 반영' : '';

    var summaryText =
      examY + '년 ' + mmStr + '월(' + lagLabel + ') 들으신 뼈나이 ' + baY + '세 ' + baM + '개월에서 ' +
      '오늘까지 흐른 시간(+' + deltaMonths + '개월' + tempoText + ')을 더해 오늘 기준 약 ' +
      projY + '세 ' + projM + '개월로 살펴봅니다.';

    var advisoryText = deltaMonths >= 12
      ? '촬영일로부터 1년(' + deltaMonths + '개월) 이상 경과하여 사춘기 골성숙 속도가 달라졌을 가능성이 있으므로 다음 정기 검진 시 성장판 재확인을 함께 권해 드립니다.'
      : '';

    return {
      examYear: examY,
      examMonth: examM,
      deltaMonths: deltaMonths,
      tempoFactor: tempoFactor,
      baExamYears: baY,
      baExamMonths: baM,
      baExam: Math.round(baExam * 100) / 100,
      baProjectedToday: Math.round(baProjected * 100) / 100,
      baProjectedYears: projY,
      baProjectedMonths: projM,
      summaryText: summaryText,
      advisoryText: advisoryText
    };
  }

  /**
   * Full Auxology & 3-Trajectory Adult Stature Engine
   */
  function analyzeGrowthClock(profile, nowOverride) {
    var p = profile || {};
    var sex = (p.sex === 'girl' || p.sex === 'F') ? 'girl' : 'boy';
    var ageInfo = computeExactAgeFromDob(p.birthYear, p.birthMonth, p.birthDay, nowOverride);
    var heightCm = clamp(Number(p.heightCm) || 138.8, 65, 205);
    var weightKg = clamp(Number(p.weightKg) || 34.5, 7, 130);
    var fatherCm = clamp(Number(p.fatherCm) || 174.0, 145, 205);
    var motherCm = clamp(Number(p.motherCm) || 161.0, 140, 190);

    var kdca = calculateKdcaPercentile(heightCm, ageInfo.exactMonths, sex);
    var adultRow = getKdcaRow(sex, 228);
    var mphCm = sex === 'boy'
      ? Math.round(((fatherCm + motherCm + 13) / 2) * 10) / 10
      : Math.round(((fatherCm + motherCm - 13) / 2) * 10) / 10;

    // Curve-projected adult height at 19yo using current KDCA Z-score
    var zClamped = clamp(kdca.zScore, -2.6, 2.6);
    var curveAdultCm = adultRow.M * Math.pow(1 + adultRow.L * adultRow.S * zClamped, 1 / adultRow.L);

    var hasBoneAge = p.boneAgeMode === 'measured';
    var tempoAccel = p.pubertySign === 'early_accel';
    var baResult = null;
    var effectiveSkeletalYears = ageInfo.exactMonths / 12;

    if (hasBoneAge) {
      baResult = computeBoneAgeDeltaCalibration({
        sex: sex,
        baYears: p.baYears,
        baMonths: p.baMonths,
        examYear: p.examYear,
        examMonth: p.examMonth,
        lagMonths: p.lagMonths,
        tempoAccel: tempoAccel,
        nowDate: nowOverride
      });
      effectiveSkeletalYears = baResult.baProjectedToday;
    } else if (tempoAccel) {
      effectiveSkeletalYears = clamp((ageInfo.exactMonths / 12) + 0.55, 3.0, sex === 'girl' ? 17.5 : 18.5);
    }

    var maturePct = interpolateBpMaturePct(sex, effectiveSkeletalYears);
    var bpAdultCm = clamp(heightCm / (maturePct / 100), sex === 'girl' ? 145 : 156, sex === 'girl' ? 182 : 196);

    // Base clinical blend (Bone-Age weighted when measured, else KDCA curve + MPH weighted)
    var baselineAdult = hasBoneAge
      ? (bpAdultCm * 0.62 + mphCm * 0.23 + curveAdultCm * 0.15)
      : (curveAdultCm * 0.58 + mphCm * 0.42);

    // Habit & bottleneck modifiers scaled by remaining open growth fraction
    var openWindowScale = clamp((100 - maturePct) / 26, 0.22, 1.15);
    var penaltyCm = 0;
    var recoveryGainCm = 0;
    var bottlenecks = [];

    if (p.bedtime === 'after_2330') {
      penaltyCm += 1.4 * openWindowScale;
      recoveryGainCm += 1.7 * openWindowScale;
      bottlenecks.push({
        domain: '밤 서파수면 시각',
        title: '취침 시각 지연에 따른 초기 서파수면 성장호르몬 손실',
        detail: '밤 11시 30분 이후 잠들 경우 입면 직후 90분간 나타나는 하루 최대 성장호르몬 파동이 얕아집니다. 오늘 저녁부터 소등 시각을 30분씩 앞당기고 잠들기 40분 전에는 거실 간접등만 남겨 두시는 것이 가장 우선입니다.'
      });
    } else if (p.bedtime === 'around_2300') {
      penaltyCm += 0.7 * openWindowScale;
      recoveryGainCm += 1.1 * openWindowScale;
      bottlenecks.push({
        domain: '밤 수면 리듬',
        title: '밤 10시 이전 깊은 입면을 위한 저녁 조도 정돈',
        detail: '잠자리에 눕는 시각을 20~30분만 앞당겨도 성장판 연골세포가 분열하는 야간 회복 시간이 한층 넉넉해집니다.'
      });
    }

    if (p.breathing === 'mouth_rhinitis') {
      penaltyCm += 0.9 * openWindowScale;
      recoveryGainCm += 1.2 * openWindowScale;
      bottlenecks.push({
        domain: '수면 중 비강 호흡',
        title: '비염·구강호흡으로 인한 깊은 잠 분절 완화',
        detail: '입을 벌리고 자면 산소 포화도가 흔들려 깊은 서파수면 단계가 자주 끊깁니다. 침실 습도를 50% 내외로 유지하고 저녁 미지근한 코 세정이나 침구 먼지 관리로 코 호흡을 편안하게 열어 주세요.'
      });
    }

    if (p.nutrition === 'picky_low_ca' || p.lateSnack === true) {
      penaltyCm += 0.9 * openWindowScale;
      recoveryGainCm += 1.3 * openWindowScale;
      bottlenecks.push({
        domain: '저녁 식탁과 골밀도 영양',
        title: p.lateSnack
          ? '취침 전 야식·당류 차단 및 저녁 단백질·칼슘 식탁 정비'
          : '편식·유당 불편을 고려한 고흡수 단백질·칼슘·비타민D3 보충',
        detail: '잠들기 2시간 전 섭취한 당분과 야식은 인슐린을 높여 야간 성장호르몬 분비를 억제합니다. 저녁 본식에서 살코기·생선·두부·달걀과 칼슘·비타민D 급원을 충분히 채우고, 밤 9시 이후에는 미지근한 물만 마시도록 지도해 주세요.'
      });
    }

    if (p.posture === 'slouch_forward') {
      penaltyCm += 0.8;
      recoveryGainCm += 1.5;
      bottlenecks.push({
        domain: '경추·척추 착석 정렬',
        title: '책상 시야각 교정과 저녁 척추 감압을 통한 숨은 체형 키 복원',
        detail: '고개를 깊이 숙이고 구부정하게 앉는 습관은 척추 추간판 압박을 키워 이미 자란 키 중 1.2~1.8 cm를 숨겨 버립니다. 책의 각도를 눈높이 가까이 세우고 발바닥이 바닥이나 받침에 닿게 한 뒤, 잠들기 전 1분간 기지개·신전 스트레칭으로 등을 펴 주세요.'
      });
    }

    if (p.activity === 'low_indoor') {
      penaltyCm += 0.6 * openWindowScale;
      recoveryGainCm += 1.0 * openWindowScale;
      bottlenecks.push({
        domain: '수직 점프 자극',
        title: '주 4회 15분 수직 점프 루틴으로 하지 성장판 자극 깨우기',
        detail: '무릎과 발목 성장판 연골은 중력 방향의 가벼운 탄성 자극이 반복될 때 골화 효율이 높아집니다. 하교 후 줄넘기나 제자리 가벼운 점프를 하루 15분씩 규칙적으로 이어가 보세요.'
      });
    }

    if (bottlenecks.length === 0) {
      recoveryGainCm += 1.4 * openWindowScale;
      bottlenecks.push({
        domain: '안정적 성장 리듬 유지',
        title: '현재의 건강한 밤잠·식탁·자세 균형을 계절마다 흔들림 없이 유지하기',
        detail: '수면과 식사, 착석 습관이 매우 안정적으로 잡혀 있습니다. 방학이나 시험 기간에도 취침 시각이 무너지지 않도록 월 1회 일정한 아침 시각에 키 변화만 차분히 기록해 주세요.'
      });
    }

    var currentTrendAdultCm = Math.round((baselineAdult - penaltyCm) * 10) / 10;
    var optimizedAdultCm = Math.round((currentTrendAdultCm + Math.max(1.8, penaltyCm + recoveryGainCm)) * 10) / 10;
    currentTrendAdultCm = Math.max(heightCm + 0.5, currentTrendAdultCm);
    optimizedAdultCm = Math.max(currentTrendAdultCm + 1.5, optimizedAdultCm);
    var remainingPotentialCm = Math.round(Math.max(0.8, optimizedAdultCm - heightCm) * 10) / 10;

    var rankFromSmall = Math.max(1, Math.min(99, Math.round(kdca.percentile)));
    var topPercent = Math.max(1, Math.min(99, Math.round(100 - kdca.percentile)));

    var freePositionNote = '';
    if (kdca.percentile < 25) {
      freePositionNote = '현재 질병관리청 동월령 표준 중앙값(' + kdca.medianCm.toFixed(1) + ' cm)보다 ' + Math.abs(kdca.diffFromMedianCm).toFixed(1) + ' cm 낮은 구간에 놓여 있어, 남은 성장판 시간 동안 밤 서파수면과 저녁 식탁·착석 자세에서 새어 나가는 손실 요인을 먼저 줄여 주는 것이 중요합니다.';
    } else if (kdca.percentile <= 75) {
      freePositionNote = '현재 질병관리청 동월령 표준 중앙값(' + kdca.medianCm.toFixed(1) + ' cm) 부근의 안정적인 흐름 위에 놓여 있습니다. 향후 사춘기 골성숙 속도와 생활 병목을 어떻게 관리하느냐에 따라 최종 성인 도달 궤적이 뚜렷하게 달라지는 시기입니다.';
    } else {
      freePositionNote = '현재 또래 대비 상위권 신장 흐름을 보이고 있습니다. 다만 또래보다 키가 빨리 자라는 시기일수록 골연령(뼈나이) 시계가 함께 앞서 나가지 않도록 야간 혈당과 수면 깊이를 차분히 점검해야 최종 성인키 이점을 끝까지 지킬 수 있습니다.';
    }

    return {
      sex: sex,
      sexLabel: sex === 'girl' ? '여아' : '남아',
      ageYears: ageInfo.ageYears,
      remMonths: ageInfo.remMonths,
      exactMonths: ageInfo.exactMonths,
      heightCm: heightCm,
      weightKg: weightKg,
      fatherCm: fatherCm,
      motherCm: motherCm,
      mphCm: mphCm,
      kdca: kdca,
      rankFromSmall: rankFromSmall,
      topPercent: topPercent,
      freePositionNote: freePositionNote,
      hasBoneAge: hasBoneAge,
      boneAgeCalibration: baResult,
      maturePct: Math.round(maturePct * 10) / 10,
      geneticMphCm: mphCm,
      currentTrendAdultCm: currentTrendAdultCm,
      optimizedAdultCm: optimizedAdultCm,
      ModifiableGapCm: Math.round((optimizedAdultCm - currentTrendAdultCm) * 10) / 10,
      remainingPotentialCm: remainingPotentialCm,
      bottlenecks: bottlenecks,
      primaryBottleneckTitle: bottlenecks[0].title
    };
  }

  /* ------------------------------------------------------------------------
     Browser UI Controllers (Screen 0 -> Screen 1 -> Screen 2 -> Screen 3)
     ------------------------------------------------------------------------ */

  function populateDateSelects() {
    if (typeof document === 'undefined') return;
    var now = new Date();
    var curY = now.getFullYear();

    var byEl = document.getElementById('dob-year');
    var bmEl = document.getElementById('dob-month');
    var bdEl = document.getElementById('dob-day');
    if (byEl && byEl.options.length === 0) {
      for (var y = curY - 1; y >= curY - 18; y--) {
        var opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = y + '년';
        if (y === curY - 10) opt.selected = true;
        byEl.appendChild(opt);
      }
    }
    if (bmEl && bmEl.options.length === 0) {
      for (var m = 1; m <= 12; m++) {
        var mOpt = document.createElement('option');
        mOpt.value = String(m);
        mOpt.textContent = m + '월';
        if (m === 5) mOpt.selected = true;
        bmEl.appendChild(mOpt);
      }
    }
    if (bdEl && bdEl.options.length === 0) {
      for (var d = 1; d <= 31; d++) {
        var dOpt = document.createElement('option');
        dOpt.value = String(d);
        dOpt.textContent = d + '일';
        if (d === 15) dOpt.selected = true;
        bdEl.appendChild(dOpt);
      }
    }

    var baYearEl = document.getElementById('ba-exam-years');
    var baMonthEl = document.getElementById('ba-exam-months');
    if (baYearEl && baYearEl.options.length === 0) {
      for (var bay = 3; bay <= 18; bay++) {
        var bo = document.createElement('option');
        bo.value = String(bay);
        bo.textContent = '만 ' + bay + '세';
        if (bay === 10) bo.selected = true;
        baYearEl.appendChild(bo);
      }
    }
    if (baMonthEl && baMonthEl.options.length === 0) {
      for (var bam = 0; bam <= 11; bam++) {
        var bmo = document.createElement('option');
        bmo.value = String(bam);
        bmo.textContent = bam + '개월';
        if (bam === 6) bmo.selected = true;
        baMonthEl.appendChild(bmo);
      }
    }

    var exYearEl = document.getElementById('ba-exam-date-year');
    var exMonthEl = document.getElementById('ba-exam-date-month');
    if (exYearEl && exYearEl.options.length === 0) {
      for (var ey = curY; ey >= curY - 4; ey--) {
        var eyo = document.createElement('option');
        eyo.value = String(ey);
        eyo.textContent = ey + '년';
        if (ey === curY) eyo.selected = true;
        exYearEl.appendChild(eyo);
      }
    }
    if (exMonthEl && exMonthEl.options.length === 0) {
      var curM = now.getMonth() + 1;
      for (var em = 1; em <= 12; em++) {
        var emo = document.createElement('option');
        emo.value = String(em);
        emo.textContent = em + '월';
        if (em === curM) emo.selected = true;
        exMonthEl.appendChild(emo);
      }
    }
  }

  function readFormProfile() {
    if (typeof document === 'undefined') return {};
    var sexRadio = document.querySelector('input[name="child-sex"]:checked');
    var sex = sexRadio ? sexRadio.value : 'boy';
    var birthYear = Number((document.getElementById('dob-year') || {}).value) || (new Date().getFullYear() - 10);
    var birthMonth = Number((document.getElementById('dob-month') || {}).value) || 5;
    var birthDay = Number((document.getElementById('dob-day') || {}).value) || 15;
    var heightCm = Number((document.getElementById('child-height') || {}).value) || 0;
    var weightKg = Number((document.getElementById('child-weight') || {}).value) || 0;
    var fatherCm = Number((document.getElementById('father-height') || {}).value) || 174;
    var motherCm = Number((document.getElementById('mother-height') || {}).value) || 161;

    var bedtimeEl = document.querySelector('input[name="habit-bedtime"]:checked');
    var breathEl = document.querySelector('input[name="habit-breathing"]:checked');
    var nutEl = document.querySelector('input[name="habit-nutrition"]:checked');
    var snackEl = document.getElementById('habit-late-snack');

    var baModeEl = document.querySelector('input[name="ba-mode"]:checked');
    var baYears = Number((document.getElementById('ba-exam-years') || {}).value) || 10;
    var baMonths = Number((document.getElementById('ba-exam-months') || {}).value) || 0;
    var examYear = Number((document.getElementById('ba-exam-date-year') || {}).value) || new Date().getFullYear();
    var examMonth = Number((document.getElementById('ba-exam-date-month') || {}).value) || (new Date().getMonth() + 1);

    var postEl = document.querySelector('input[name="habit-posture"]:checked');
    var actEl = document.querySelector('input[name="habit-activity"]:checked');
    var pubEl = document.querySelector('input[name="habit-puberty"]:checked');
    var sixMoGain = Number((document.getElementById('recent-6mo-gain') || {}).value) || 2.8;

    return {
      sex: sex,
      birthYear: birthYear,
      birthMonth: birthMonth,
      birthDay: birthDay,
      heightCm: heightCm,
      weightKg: weightKg,
      fatherCm: fatherCm,
      motherCm: motherCm,
      bedtime: bedtimeEl ? bedtimeEl.value : 'before_2200',
      breathing: breathEl ? breathEl.value : 'nasal_calm',
      nutrition: nutEl ? nutEl.value : 'balanced',
      lateSnack: Boolean(snackEl && snackEl.checked),
      boneAgeMode: baModeEl ? baModeEl.value : 'none',
      baYears: baYears,
      baMonths: baMonths,
      examYear: examYear,
      examMonth: examMonth,
      posture: postEl ? postEl.value : 'upright',
      activity: actEl ? actEl.value : 'active_jump',
      pubertySign: pubEl ? pubEl.value : 'normal_tempo',
      recent6MoGainCm: sixMoGain
    };
  }

  function updateStep1AgeReadout() {
    if (typeof document === 'undefined') return;
    var p = readFormProfile();
    var age = computeExactAgeFromDob(p.birthYear, p.birthMonth, p.birthDay);
    var row = getKdcaRow(p.sex, age.exactMonths);
    var el = document.getElementById('dob-live-readout');
    if (el) {
      var medianDisplay = (Math.round(row.M * 10) / 10).toFixed(1);
      el.innerHTML =
        '오늘 기준 <strong>만 ' + age.ageYears + '세 ' + age.remMonths + '개월</strong> · ' +
        '같은 개월 수 ' + (p.sex === 'girl' ? '여자아이' : '남자아이') + ' 질병관리청 중간 키는 <strong>' + medianDisplay + ' cm</strong>입니다.';
    }
  }

  function updateStep2MphReadout() {
    if (typeof document === 'undefined') return;
    var p = readFormProfile();
    var mph = p.sex === 'girl'
      ? ((p.fatherCm + p.motherCm - 13) / 2)
      : ((p.fatherCm + p.motherCm + 13) / 2);
    var el = document.getElementById('mph-live-readout');
    if (el) {
      el.innerHTML =
        '부모님 키로 살펴본 물려받은 중심값: <strong>' + mph.toFixed(1) + ' cm</strong> ' +
        '(유전 기대 범위 ' + (mph - 8.5).toFixed(1) + ' ~ ' + (mph + 8.5).toFixed(1) + ' cm)';
    }
  }

  function updateStep4BoneAgeReadout() {
    if (typeof document === 'undefined') return;
    var p = readFormProfile();
    var drawer = document.getElementById('ba-detail-drawer');
    if (drawer) {
      drawer.classList.toggle('is-open', p.boneAgeMode === 'measured');
    }
    if (p.boneAgeMode !== 'measured') return;

    var cal = computeBoneAgeDeltaCalibration({
      sex: p.sex,
      baYears: p.baYears,
      baMonths: p.baMonths,
      examYear: p.examYear,
      examMonth: p.examMonth,
      tempoAccel: p.pubertySign === 'early_accel'
    });
    var noteEl = document.getElementById('ba-delta-live-note');
    if (noteEl) {
      noteEl.innerHTML =
        '<strong>검사일 이후 흐른 시간 자동 반영 결과</strong><br>' +
        cal.summaryText +
        (cal.advisoryText ? '<br><span style="color:#6E665E;font-size:13.5px;">' + cal.advisoryText + '</span>' : '');
    }
  }

  function syncChoiceCardHighlights() {
    if (typeof document === 'undefined') return;
    var cards = document.querySelectorAll('.choice-card');
    for (var i = 0; i < cards.length; i++) {
      var input = cards[i].querySelector('input[type="radio"], input[type="checkbox"]');
      if (input) {
        cards[i].classList.toggle('is-selected', Boolean(input.checked));
      }
    }
  }

  function escHtml(str) {
    return String(str === undefined || str === null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showScreen(screenIdx) {
    if (typeof document === 'undefined') return;
    var resolvedIdx = screenIdx === 2 ? 3 : screenIdx;
    state.currentScreen = resolvedIdx;
    var mainEl = document.getElementById('atelier-main-shell');
    if (mainEl) {
      mainEl.classList.toggle('is-opening-view', resolvedIdx === 0);
      mainEl.classList.toggle('is-wide-view', resolvedIdx === 3);
    }
    var screenMap = [
      { idx: 0, id: 'kfk-peer-growth-editorial' },
      { idx: 1, id: 'quiz-section' },
      { idx: 3, id: 'kfk-results-atelier-screen' }
    ];
    for (var i = 0; i < screenMap.length; i++) {
      var sec = document.getElementById(screenMap[i].id);
      if (sec) sec.classList.toggle('is-active', screenMap[i].idx === resolvedIdx);
    }
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) { window.scrollTo(0, 0); }
  }

  function showSurveyStep(stepNum) {
    if (typeof document === 'undefined') return;
    var target = clamp(parseInt(stepNum, 10) || 1, 1, 5);
    state.currentStep = target;
    for (var s = 1; s <= 5; s++) {
      var panel = document.getElementById('step-content-' + s);
      if (panel) panel.classList.toggle('is-active', s === target);
    }
    var stepNames = [
      '',
      '첫 번째 질문 (1 / 5)',
      '두 번째 질문 (2 / 5)',
      '세 번째 질문 (3 / 5)',
      '네 번째 질문 (4 / 5)',
      '마지막 질문 (5 / 5)'
    ];
    var counterEl = document.getElementById('survey-step-counter');
    if (counterEl) counterEl.textContent = stepNames[target] || (target + ' / 5');
    var fillEl = document.getElementById('survey-progress-fill');
    if (fillEl) fillEl.style.width = (target * 20) + '%';
    var errEl = document.getElementById('survey-validation-msg');
    if (errEl) errEl.style.display = 'none';

    if (target === 1) updateStep1AgeReadout();
    if (target === 2) updateStep2MphReadout();
    if (target === 4) updateStep4BoneAgeReadout();
    syncChoiceCardHighlights();
  }

  function showStepValidationError(msg) {
    var errEl = document.getElementById('survey-validation-msg');
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.style.display = 'block';
  }

  function advanceFromStep(currentStep) {
    var p = readFormProfile();
    if (currentStep === 1) {
      if (!p.heightCm || p.heightCm < 65 || p.heightCm > 205) {
        showStepValidationError('아이의 현재 키(cm)를 65 ~ 205 cm 사이로 정확히 입력해 주세요.');
        var hInput = document.getElementById('child-height');
        if (hInput) hInput.focus();
        return;
      }
      if (!p.weightKg || p.weightKg < 7 || p.weightKg > 130) {
        showStepValidationError('아이의 현재 체중(kg)을 7 ~ 130 kg 사이로 입력해 주세요.');
        var wInput = document.getElementById('child-weight');
        if (wInput) wInput.focus();
        return;
      }
      // Pre-set default height/bone-age if Step 4 hasn't been touched yet
      var age = computeExactAgeFromDob(p.birthYear, p.birthMonth, p.birthDay);
      var baYEl = document.getElementById('ba-exam-years');
      if (baYEl && !baYEl.getAttribute('data-user-touched')) {
        baYEl.value = String(clamp(age.ageYears, 3, 18));
      }
      showSurveyStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!p.fatherCm || p.fatherCm < 145 || p.fatherCm > 205 || !p.motherCm || p.motherCm < 140 || p.motherCm > 190) {
        showStepValidationError('아버지와 어머니의 키(cm)를 확인해 주세요. 잘 모르실 경우 아래 평균치 자동 입력을 누르시면 됩니다.');
        return;
      }
      showSurveyStep(3);
      return;
    }

    if (currentStep === 3) {
      showSurveyStep(4);
      return;
    }

    if (currentStep === 4) {
      showSurveyStep(5);
      return;
    }

    if (currentStep === 5) {
      completeSurveyAndMoveToEmailGate();
    }
  }

  function goBackInSurvey() {
    if (state.currentStep > 1) {
      showSurveyStep(state.currentStep - 1);
    } else {
      showScreen(0);
    }
  }

  function completeSurveyAndMoveToEmailGate() {
    var profile = readFormProfile();
    var prevRaw = safeGetStorage(PROFILE_KEY);
    if (prevRaw) {
      try {
        var prevParsed = JSON.parse(prevRaw);
        if (prevParsed && prevParsed.parentEmail && !profile.parentEmail) {
          profile.parentEmail = prevParsed.parentEmail;
        }
        if (prevParsed && prevParsed.nickname && !profile.nickname) {
          profile.nickname = prevParsed.nickname;
        }
      } catch (_) {}
    }
    safeSetStorage(PROFILE_KEY, profile);
    var analysis = analyzeGrowthClock(profile);
    analysis.profile = profile;
    state.lastAnalysis = analysis;

    try {
      var savedMember = (global.DreamCompanyCRM && global.DreamCompanyCRM.getLocalMember)
        ? global.DreamCompanyCRM.getLocalMember('KFK')
        : null;
      var emailInput = document.getElementById('kfk-stepup-email-input');
      var chosenEmail = (savedMember && savedMember.email) || profile.parentEmail || '';
      if (chosenEmail && emailInput && !emailInput.value) {
        emailInput.value = chosenEmail;
      }
      var nickInput = document.getElementById('kfk-stepup-nickname-input');
      if (profile.nickname && nickInput && !nickInput.value) {
        nickInput.value = profile.nickname;
      }
    } catch (_) {}

    // Immediately reveal Free Baseline KDCA 2017 Height Percentile & Growth-Clock Summary (Zero Email Wall)
    renderScreen3Results(analysis);
    showScreen(3);
  }

  function reopenEmailSaveForm() {
    if (typeof document === 'undefined') return;
    safeSetStorage(EMAIL_UNLOCK_KEY, 'false');
    var formWrap = document.getElementById('kfk-stepup-email-form-wrap');
    var savedBanner = document.getElementById('kfk-email-saved-banner');
    if (formWrap) formWrap.style.display = 'block';
    if (savedBanner) savedBanner.style.display = 'none';
    var emailEl = document.getElementById('kfk-stepup-email-input');
    if (emailEl && emailEl.focus) emailEl.focus();
  }

  function submitEmailForBasicSummary(ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    var emailEl = document.getElementById('kfk-stepup-email-input');
    var nickEl = document.getElementById('kfk-stepup-nickname-input');
    var hpEl = document.getElementById('kfk-stepup-hp-input');
    var errEl = document.getElementById('kfk-stepup-email-error');
    var btnEl = document.getElementById('btn-kfk-stepup-email-submit');

    var email = emailEl ? String(emailEl.value || '').trim().toLowerCase() : '';
    var nickname = nickEl ? String(nickEl.value || '').trim() : '';
    var hp = hpEl ? String(hpEl.value || '').trim() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (errEl) {
        errEl.textContent = '맞춤 성장 요약을 저장하고 월간 리포트 안내를 받으실 이메일 주소를 정확히 입력해 주세요.';
        errEl.style.display = 'block';
      }
      if (emailEl) emailEl.focus();
      return false;
    }
    if (errEl) errEl.style.display = 'none';
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = '맞춤 성장 요약 저장 중...';
    }

    var profile = readFormProfile();
    var savedRaw = safeGetStorage(PROFILE_KEY);
    if ((!profile.heightCm || profile.heightCm < 65) && savedRaw) {
      try { profile = JSON.parse(savedRaw); } catch (_) {}
    }
    if (nickname) profile.nickname = nickname;
    profile.parentEmail = email;
    safeSetStorage(PROFILE_KEY, profile);

    var analysis = state.lastAnalysis || analyzeGrowthClock(profile);
    analysis.profile = profile;
    state.lastAnalysis = analysis;

    safeSetStorage(EMAIL_UNLOCK_KEY, 'true');

    var restoreEmailEl = document.getElementById('kfk-restore-email');
    if (restoreEmailEl && !restoreEmailEl.value) restoreEmailEl.value = email;
    var vipEmailEl = document.getElementById('kfk-vip-checkin-email');
    if (vipEmailEl && !vipEmailEl.value) vipEmailEl.value = email;

    var notesSummary = '만' + analysis.ageYears + '세' + analysis.remMonths + '개월_' + analysis.sexLabel + '_' + analysis.heightCm + 'cm_P' + analysis.kdca.percentile;

    var finishTransition = function () {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = '맞춤 성장 요약 저장 · 월간 성장 리포트 안내받기 →';
      }
      renderScreen3Results(analysis);
      if (state.currentScreen !== 3) {
        showScreen(3);
      }
    };

    if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.registerMember === 'function') {
      try {
        global.DreamCompanyCRM.registerMember({
          div: 'KFK',
          email: email,
          nickname: nickname,
          segment: 'kfk_atelier_stepup_kr',
          notes: notesSummary,
          lang: 'ko',
          website_hp: hp
        }).catch(function () {});
      } catch (_) {}
    }
    finishTransition();
    return false;
  }

  function getVerifiedPaidPass() {
    var raw = safeGetStorage(PAID_PASS_KEY);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.email && (parsed.tier === 'tier1' || parsed.tier === 'tier2' || parsed.tier === 'tier3')) {
        return parsed;
      }
    } catch (_) {}
    return null;
  }

  function renderScreen3Results(analysis) {
    if (typeof document === 'undefined' || !analysis) return;
    var paidPass = getVerifiedPaidPass();
    var statusBadge = document.getElementById('screen3-access-status');
    if (statusBadge) {
      if (paidPass && paidPass.tier === 'tier3') {
        statusBadge.textContent = '3등급(프리미엄) · 12개월 형제자매 마스터 패스 열람 중';
      } else if (paidPass && (paidPass.tier === 'tier2' || paidPass.tier === 'tier3')) {
        statusBadge.textContent = '2등급 · 6개월 성장속도 관리 패스 열람 중';
      } else if (paidPass && paidPass.tier === 'tier1') {
        statusBadge.textContent = '1등급 · 단건 정밀 리포트 패스 열람 중';
      } else {
        statusBadge.textContent = '무료 기본 요약 즉시 공개';
      try { if (!global.__kfkQuizCompleteTracked && global.DreamCompanyCRM && typeof global.DreamCompanyCRM.trackFunnelEvent === 'function') { global.__kfkQuizCompleteTracked = true; global.DreamCompanyCRM.trackFunnelEvent('KFK', 'quiz_complete'); } } catch (_) {}
      }
    }

    var savedProf = analysis.profile || null;
    if (!savedProf) {
      var profStr = safeGetStorage(PROFILE_KEY);
      if (profStr) {
        try { savedProf = JSON.parse(profStr); } catch (_) {}
      }
    }
    var nickPrefix = (savedProf && savedProf.nickname) ? (String(savedProf.nickname).trim() + ' · ') : '';

    // 1. Immediate Free Baseline KDCA 2017 Percentile & Growth-Clock Summary Block
    var titleEl = document.getElementById('result-child-headline');
    if (titleEl) {
      titleEl.textContent =
        nickPrefix + '만 ' + analysis.ageYears + '세 ' + analysis.remMonths + '개월 ' + analysis.sexLabel +
        ' (' + analysis.heightCm.toFixed(1) + ' cm · ' + analysis.weightKg.toFixed(1) + ' kg) 기본 성장 시계 요약';
    }

    var pctValEl = document.getElementById('result-free-percentile');
    if (pctValEl) {
      pctValEl.textContent = analysis.kdca.percentile.toFixed(1) + ' 백분위';
    }
    var pctNoteEl = document.getElementById('result-free-percentile-note');
    if (pctNoteEl) {
      pctNoteEl.textContent = '또래 100명 중 작은 쪽에서 약 ' + analysis.rankFromSmall + '번째 (상위 ' + analysis.topPercent + '%)';
    }

    var medValEl = document.getElementById('result-free-median');
    if (medValEl) {
      var sign = analysis.kdca.diffFromMedianCm >= 0 ? '+' : '';
      medValEl.textContent = analysis.kdca.medianCm.toFixed(1) + ' cm (' + sign + analysis.kdca.diffFromMedianCm.toFixed(1) + ' cm)';
    }
    var mphValEl = document.getElementById('result-free-mph');
    if (mphValEl) {
      mphValEl.textContent = analysis.mphCm.toFixed(1) + ' cm';
    }

    var barFill = document.getElementById('result-percentile-fill');
    var barPin = document.getElementById('result-percentile-pin');
    var clampedPin = clamp(analysis.kdca.percentile, 3, 97);
    if (barFill) barFill.style.width = clampedPin + '%';
    if (barPin) barPin.style.left = clampedPin + '%';

    var obsEl = document.getElementById('result-free-observation');
    if (obsEl) {
      obsEl.textContent = analysis.freePositionNote;
    }

    var clockNoteEl = document.getElementById('result-free-growth-clock-note');
    if (clockNoteEl) {
      if (analysis.hasBoneAge && analysis.boneAgeCalibration) {
        clockNoteEl.innerHTML =
          '<strong>성장 시계 기준선 (병원 뼈나이 경과 시간 보정):</strong> ' +
          escHtml(analysis.boneAgeCalibration.summaryText) +
          '<br><span style="font-size:14px;color:#3B3530;">우선 돌볼 저녁 생활 영역: <strong>' + escHtml(analysis.primaryBottleneckTitle) + '</strong></span>';
      } else {
        clockNoteEl.innerHTML =
          '<strong>성장 시계 기준선 (태어난 날 기준 질병관리청 2017 곡선):</strong> 생후 ' +
          analysis.exactMonths.toFixed(1) + '개월 표준 성숙도(성인 신장 대비 약 ' + analysis.maturePct.toFixed(1) + '% 진행 구간)를 바탕으로 살펴보았습니다.' +
          '<br><span style="font-size:14px;color:#3B3530;">우선 돌볼 저녁 생활 영역: <strong>' + escHtml(analysis.primaryBottleneckTitle) + '</strong></span>';
      }
    }

    // Natural Passwordless Email Save Card State
    var formWrapEl = document.getElementById('kfk-stepup-email-form-wrap');
    var savedBannerEl = document.getElementById('kfk-email-saved-banner');
    var savedEmailAddr = (savedProf && savedProf.parentEmail) ? String(savedProf.parentEmail).trim() : '';
    var isEmailSaved = safeGetStorage(EMAIL_UNLOCK_KEY) === 'true' && Boolean(savedEmailAddr);
    if (formWrapEl && savedBannerEl) {
      formWrapEl.style.display = isEmailSaved ? 'none' : 'block';
      savedBannerEl.style.display = isEmailSaved ? 'block' : 'none';
      if (isEmailSaved) {
        savedBannerEl.innerHTML =
          '<strong>' + escHtml(savedEmailAddr) + ' 주소로 맞춤 성장 요약 저장 및 월간 성장 리포트 안내 등록이 완료되었습니다.</strong> ' +
          '<button type="button" class="atelier-text-btn" style="margin-left:8px;" data-csp-act="kfk-reopen-email">이메일 변경</button>';
      }
    }

    // 2. Differential Vault vs Full Unlocked Report
    var lockedVault = document.getElementById('kfk-locked-vault-preview');
    var unlockedReport = document.getElementById('kfk-full-unlocked-report');

    var baPreviewLine = document.getElementById('vault-ba-context-line');
    if (baPreviewLine) {
      baPreviewLine.textContent = analysis.hasBoneAge && analysis.boneAgeCalibration
        ? ('검사일 이후 흐른 시간(+' + analysis.boneAgeCalibration.deltaMonths + '개월)을 반영한 오늘 기준 예상 골연령과 성인 키 계산이 완료되었습니다.')
        : '질병관리청 성장 기준과 부모님 신장, 생활 습관을 반영한 최종 성인 예상 키 계산이 완료되었습니다.';
    }

    if (paidPass) {
      if (lockedVault) lockedVault.style.display = 'none';
      if (unlockedReport) {
        unlockedReport.style.display = 'block';
        populateFullUnlockedReportDom(analysis, paidPass);
        if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.mountSatisfactionBar === 'function') {
          var satFull = document.getElementById('kfk-full-report-sat-mount');
          if (satFull) global.DreamCompanyCRM.mountSatisfactionBar(satFull, { div: 'KFK', context: 'full_report', email: paidPass.email });
        }
      }
      if ((paidPass.tier === 'tier2' || paidPass.tier === 'tier3')) {
        switchCheckinTab('tracker');
      }
    } else {
      if (lockedVault) lockedVault.style.display = 'block';
      if (unlockedReport) unlockedReport.style.display = 'none';
    }

    // Pre-fill monthly velocity check-in child defaults from survey
    var vipSexEl = document.getElementById('kfk-vip-sex');
    var vipAgeEl = document.getElementById('kfk-vip-age');
    var vipPrevHEl = document.getElementById('kfk-vip-prev-height');
    if (vipSexEl) vipSexEl.value = analysis.sex === 'girl' ? 'F' : 'M';
    if (vipAgeEl) vipAgeEl.value = String(clamp(analysis.ageYears, 2, 18));
    if (vipPrevHEl && !vipPrevHEl.value) vipPrevHEl.value = String(analysis.heightCm.toFixed(1));
  }

  function populateFullUnlockedReportDom(analysis, paidPass) {
    var baBox = document.getElementById('full-report-ba-summary');
    if (baBox) {
      if (analysis.hasBoneAge && analysis.boneAgeCalibration) {
        baBox.innerHTML =
          '<strong>검사일 이후 흐른 시간 보정 결과</strong><br>' +
          analysis.boneAgeCalibration.summaryText +
          ' (현재 성인 신장 대비 성장 진행률 약 ' + analysis.maturePct.toFixed(1) + '%)' +
          (analysis.boneAgeCalibration.advisoryText ? '<br><span style="color:#6E665E;font-size:13.5px;">' + analysis.boneAgeCalibration.advisoryText + '</span>' : '');
      } else {
        baBox.innerHTML =
          '<strong>태어난 일수 기준 정밀 월령 및 부모 신장 모델 적용</strong><br>' +
          '생후 ' + analysis.exactMonths.toFixed(1) + '개월 표준 성숙도(약 ' + analysis.maturePct.toFixed(1) + '% 진행)와 부모님 키 중심값(' + analysis.mphCm.toFixed(1) + ' cm)을 함께 반영해 산출했습니다.';
      }
    }

    var tGen = document.getElementById('full-traj-genetic');
    var tCur = document.getElementById('full-traj-current');
    var tOpt = document.getElementById('full-traj-optimal');
    var tRem = document.getElementById('full-traj-remaining-note');
    if (tGen) tGen.textContent = analysis.geneticMphCm.toFixed(1) + ' cm';
    if (tCur) tCur.textContent = analysis.currentTrendAdultCm.toFixed(1) + ' cm';
    if (tOpt) tOpt.textContent = analysis.optimizedAdultCm.toFixed(1) + ' cm';
    if (tRem) {
      tRem.textContent =
        '현재 키(' + analysis.heightCm.toFixed(1) + ' cm)로부터 저녁 습관을 정돈할 때 기대할 수 있는 남은 성장폭은 약 +' +
        analysis.remainingPotentialCm.toFixed(1) + ' cm (현재 습관 유지 시보다 +' + analysis.ModifiableGapCm.toFixed(1) + ' cm 회복 구간)입니다.';
    }

    var rxList = document.getElementById('full-report-prescription-list');
    if (rxList) {
      rxList.innerHTML = analysis.bottlenecks.map(function (b, idx) {
        return (
          '<div class="prescription-item">' +
            '<h4>0' + (idx + 1) + ' · [' + b.domain + '] ' + b.title + '</h4>' +
            '<p>' + b.detail + '</p>' +
          '</div>'
        );
      }).join('');
    }

    var ebookBtn = document.getElementById('full-report-masterbook-link');
    if (ebookBtn) {
      var cfg = global.KFK_EBOOK_CONFIG || {};
      ebookBtn.href = paidPass && paidPass.tier === 'tier3'
        ? (cfg.TIER3_39000_URL || 'https://www.latpeed.com/products/88DyN')
        : (paidPass && (paidPass.tier === 'tier2' || paidPass.tier === 'tier3')
          ? (cfg.TIER2_19900_URL || cfg.LATPEED_TIER2_URL || 'https://www.latpeed.com/products/_5Nq4')
          : (cfg.TIER1_9900_URL || cfg.LATPEED_LIVE_URL || 'https://www.latpeed.com/products/daMaP'));
    }
    var passLabel = document.getElementById('full-report-pass-badge');
    if (passLabel && paidPass) {
      passLabel.textContent = paidPass.tier === 'tier3'
        ? ('열람 등급: 3등급(프리미엄) 12개월 연간 형제자매 성장 마스터 패스 (' + paidPass.email + ')')
        : ((paidPass.tier === 'tier2' || paidPass.tier === 'tier3')
          ? ('열람 등급: 2등급 6개월 성장속도 집중 관리 패스 (' + paidPass.email + ')')
          : ('열람 등급: 1등급 단건 정밀 리포트 패스 (' + paidPass.email + ')'));
    }
  }

  function sendPaidClickBeacon(tier) {
    try {
      if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.recordCommunityEvent === 'function') {
        global.DreamCompanyCRM.recordCommunityEvent('KFK', 'latpeed_checkout_click', tier || 'tier1');
      }
    } catch (_) {}
  }

  function openKfkLatpeedCheckout(tierKey) {
    var tier = (tierKey === 'tier3') ? 'tier3' : ((tierKey === 'tier2') ? 'tier2' : 'tier1');
    try {
      if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.trackFunnelEvent === 'function') {
        global.DreamCompanyCRM.trackFunnelEvent('KFK', 'checkout_click');
      }
    } catch (_) {}
    try {
      var profile = readFormProfile();
      if (profile && profile.heightCm >= 65) {
        safeSetStorage(PROFILE_KEY, profile);
      }
      safeSetStorage('kfk_pending_checkout_tier', tier);
    } catch (_) {}

    sendPaidClickBeacon(tier);

    var cfg = global.KFK_EBOOK_CONFIG || {};
    var targetUrl = tier === 'tier3'
      ? String(cfg.TIER3_39000_URL || 'https://www.latpeed.com/products/88DyN').trim()
      : (tier === 'tier2'
        ? String(cfg.TIER2_19900_URL || cfg.LATPEED_TIER2_URL || 'https://www.latpeed.com/products/_5Nq4').trim()
        : String(cfg.TIER1_9900_URL || cfg.LATPEED_LIVE_URL || 'https://www.latpeed.com/products/daMaP').trim());

    if (targetUrl) {
      var win = null;
      try { win = global.open(targetUrl, '_blank', 'noopener,noreferrer'); } catch (_) {}
      if (!win && global.location) {
        global.location.href = targetUrl;
      }
    }
  }

  function switchCheckinTab(tabName) {
    if (typeof document === 'undefined') return;
    var paidPass = getVerifiedPaidPass();
    var isTier2 = Boolean(paidPass && (paidPass.tier === 'tier2' || paidPass.tier === 'tier3'));
    var isTracker = tabName === 'tracker';
    var btnRestore = document.getElementById('tab-btn-restore');
    var btnTracker = document.getElementById('tab-btn-tracker');
    var paneRestore = document.getElementById('pane-paid-restore');
    var paneTracker = document.getElementById('pane-vip-tracker');
    if (isTracker && !isTier2) {
      var msgEl = document.getElementById('kfk-restore-feedback');
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#9B3B32';
        msgEl.textContent = '30일 월간 성장 기록장 및 졸업장 앨범은 2등급(19,900원) 구매 인증 완료 후 이용하실 수 있습니다.';
      }
      isTracker = false;
    }
    if (btnRestore) btnRestore.classList.toggle('is-active', !isTracker);
    if (btnTracker) btnTracker.classList.toggle('is-active', isTracker);
    if (paneRestore) paneRestore.style.display = isTracker ? 'none' : 'block';
    if (paneTracker) paneTracker.style.display = isTracker ? 'block' : 'none';
  }

  function verifyAndUnlockKfkPaidPass(ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    var emailEl = document.getElementById('kfk-restore-email');
    var tierEl = document.getElementById('kfk-restore-tier');
    var refEl = document.getElementById('kfk-restore-order-ref');
    var msgEl = document.getElementById('kfk-restore-feedback');

    var email = emailEl ? String(emailEl.value || '').trim().toLowerCase() : '';
    var requestedTier = tierEl ? String(tierEl.value || 'tier1') : 'tier1';
    var orderRef = refEl ? String(refEl.value || '').trim().toUpperCase() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#9B3B32';
        msgEl.textContent = '래피드 결제 시 사용하신 이메일 주소를 정확히 입력해 주세요.';
      }
      return false;
    }
    if (!orderRef || orderRef.length < 4) {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#9B3B32';
        msgEl.textContent = '결제 완료 메일로 발급된 인증코드(또는 래피드 주문번호)를 함께 입력해 주세요.';
      }
      return false;
    }

    if (msgEl) {
      msgEl.style.display = 'block';
      msgEl.style.color = '#3A3430';
      msgEl.textContent = '서버에서 래피드 구매 내역을 확인하고 있습니다...';
    }

    var isSixDigitOtp = /^\d{6}$/.test(orderRef);
    var reqOpts = isSixDigitOtp
      ? { div: 'KFK', email: email, otp: orderRef, tier: requestedTier }
      : { div: 'KFK', email: email, access_code: orderRef, tier: requestedTier };
    var vp = (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.verifyEntitlement === 'function')
      ? global.DreamCompanyCRM.verifyEntitlement(reqOpts)
      : Promise.resolve({ authorized: false });

    vp.then(function (vres) {
      if (!vres || !vres.authorized) {
        if (msgEl) {
          msgEl.style.display = 'block';
          msgEl.style.color = '#9B3B32';
          msgEl.textContent = (vres && vres.reason === 'tier2_upgrade_required')
            ? '입력하신 내역은 1등급(9,900원) 패스입니다. 1등급을 선택해 열어 주세요.'
            : '일치하는 래피드 결제 내역을 찾지 못했습니다. 결제 직후라면 1분 뒤 다시 시도하거나 help@kidsfit.co.kr 로 문의해 주세요.';
        }
        return;
      }

      var verifiedTier = vres.tier === 'tier3' ? 'tier3' : (vres.tier === 'tier2' ? 'tier2' : 'tier1');
      var passRecord = {
        email: email,
        tier: verifiedTier,
        orderRef: vres.access_code || orderRef,
        verifiedAt: new Date().toISOString()
      };
      safeSetStorage(PAID_PASS_KEY, passRecord);

      var savedRaw = safeGetStorage(PROFILE_KEY);
      var profile = readFormProfile();
      if ((!profile.heightCm || profile.heightCm < 65) && savedRaw) {
        try { profile = JSON.parse(savedRaw); } catch (_) {}
      }
      if (!profile.heightCm || profile.heightCm < 65) {
        profile.heightCm = 138.8;
        profile.weightKg = 35.0;
      }
      var analysis = state.lastAnalysis || analyzeGrowthClock(profile);
      state.lastAnalysis = analysis;

      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#2F5241';
        msgEl.textContent = '래피드 구매 인증이 완료되어 전체 정밀 리포트가 열렸습니다.';
      }
      closeCheckinModal();
      renderScreen3Results(analysis);
      showScreen(3);
      var reportBox = document.getElementById('kfk-full-unlocked-report');
      if (reportBox && reportBox.scrollIntoView) {
        reportBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return false;
  }

  function submitKfkMonthlyVelocityCheckin(ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    var paidCheck = getVerifiedPaidPass();
    if (!paidCheck || (paidCheck.tier !== 'tier2' && paidCheck.tier !== 'tier3')) {
      var outGuard = document.getElementById('kfk-vip-velocity-output');
      if (outGuard) { outGuard.style.display = 'block'; outGuard.innerHTML = '<span style="color:#9B3B32;">2등급(19,900원) 구매 인증 완료 후 월간 성장속도 판독기를 이용하실 수 있습니다.</span>'; }
      return false;
    }
    var email = String((document.getElementById('kfk-vip-checkin-email') || {}).value || '').trim().toLowerCase();
    var sex = String((document.getElementById('kfk-vip-sex') || {}).value || 'M');
    var ageY = Number((document.getElementById('kfk-vip-age') || {}).value) || 10;
    var prevH = Number((document.getElementById('kfk-vip-prev-height') || {}).value) || 0;
    var curH = Number((document.getElementById('kfk-vip-cur-height') || {}).value) || 0;
    var sleepScore = Number((document.getElementById('kfk-vip-sleep-score') || {}).value) || 4;
    var nutScore = Number((document.getElementById('kfk-vip-nut-score') || {}).value) || 4;
    var postScore = Number((document.getElementById('kfk-vip-post-score') || {}).value) || 3;
    var jumpScore = Number((document.getElementById('kfk-vip-jump-score') || {}).value) || 3;
    var outEl = document.getElementById('kfk-vip-velocity-output');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (outEl) {
        outEl.style.display = 'block';
        outEl.innerHTML = '<span style="color:#9B3B32;">트래킹 리포트를 기록할 학부모 이메일 주소를 입력해 주세요.</span>';
      }
      return false;
    }
    if (prevH < 65 || curH < 65 || curH < prevH - 1.5 || curH > prevH + 4.5) {
      if (outEl) {
        outEl.style.display = 'block';
        outEl.innerHTML = '<span style="color:#9B3B32;">30일 전 키와 오늘 아침 측정 키(cm)를 정확히 입력해 주세요.</span>';
      }
      return false;
    }

    var reqPayload = {
      email: email,
      child_sex: sex,
      child_age_years: ageY,
      prev_height_cm: prevH,
      current_height_cm: curH,
      sleep_score: sleepScore,
      nutrition_score: nutScore,
      posture_score: postScore,
      exercise_score: jumpScore
    };

    var renderVelocityResult = function (res) {
      if (!outEl || !res) return;
      var logsForChart = [];
      try {
        var rawLogs = safeGetStorage(VELOCITY_LOGS_KEY);
        var logs = rawLogs ? JSON.parse(rawLogs) : [];
        if (!Array.isArray(logs)) logs = [];
        logs.push({
          date: new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10),
          prevH: prevH,
          curH: curH,
          deltaCm: res.delta_cm,
          annVel: res.annualized_cm_yr
        });
        logsForChart = logs.slice(-6);
        safeSetStorage(VELOCITY_LOGS_KEY, logs.slice(-12));
      } catch (_) {}

      var pts = logsForChart.length ? logsForChart.slice() : [{ date: '출발', curH: prevH }, { date: '오늘', curH: curH }];
      if (pts.length === 1) pts.unshift({ date: '30일 전', curH: prevH });
      var minH = pts[0].curH - 0.5;
      var maxH = pts[pts.length - 1].curH + 1.5;
      if (maxH - minH < 2) maxH = minH + 2.5;
      var svgCoords = [];
      for (var gi = 0; gi < pts.length; gi++) {
        var gx = Math.round(36 + (gi / Math.max(1, pts.length - 1)) * 420);
        var gy = Math.round(108 - ((pts[gi].curH - minH) / (maxH - minH)) * 78);
        svgCoords.push(gx + ',' + gy);
      }
      var startCmGrad = pts[0].curH;
      var endCmGrad = pts[pts.length - 1].curH;

      outEl.style.display = 'block';
      outEl.innerHTML =
        '<strong>이번 달 30일 성장속도(cm/yr) &amp; 6개월 누적 궤적 판독 결과</strong><br>' +
        '<div style="margin:8px 0;font-size:15.5px;">' +
          '30일 신장 변화: <strong>' + (res.delta_cm >= 0 ? '+' : '') + Number(res.delta_cm).toFixed(2) + ' cm</strong> · ' +
          '연간 환산 성장속도: <strong>' + Number(res.annualized_cm_yr).toFixed(1) + ' cm/yr</strong> ' +
          '(질병관리청 만 ' + ageY + '세 표준 ' + Number(res.kdca_target_cm_yr || 5.6).toFixed(1) + ' cm/yr)' +
        '</div>' +
        '<div style="margin:12px 0;padding:12px;background:#FAF7F2;border:1px solid #DFD7CC;border-radius:8px;">' +
          '<div style="font-size:13px;font-weight:700;color:#2F5241;margin-bottom:4px;">6개월 누적 신장 성장 그래프 (Day 30 · 60 · 90 · 120 · 150 · 180)</div>' +
          '<svg viewBox="0 0 490 124" style="width:100%;height:auto;max-height:130px;display:block;" role="img" aria-label="6개월 누적 신장 성장 그래프">' +
            '<line x1="36" y1="108" x2="456" y2="108" stroke="#CBD5E1" stroke-width="1.5"/>' +
            '<polyline fill="none" stroke="#2F5241" stroke-width="3" points="' + svgCoords.join(' ') + '"/>' +
          '</svg>' +
          '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-top:8px;">' +
            '<span style="font-size:13px;color:#5C544D;">출발 ' + startCmGrad.toFixed(1) + ' cm &rarr; 현재 ' + endCmGrad.toFixed(1) + ' cm</span>' +
            '<button type="button" data-csp-act="kfk-download-album-pdf" style="padding:7px 14px;border-radius:6px;border:none;background:#2F5241;color:#FFFFFF;font-size:13px;font-weight:700;cursor:pointer;">Day 165 6개월 성장 졸업장 앨범 PDF 받기 &rarr;</button>' +
          '</div>' +
        '</div>' +
        '<p style="margin:6px 0 8px;">' + (res.velocity_verdict || '') + '</p>' +
        (res.priority_bottleneck
          ? ('<p style="margin:0;color:#3A3430;"><strong>다음 30일 최우선 보완 습관 (' + res.priority_bottleneck.key + '):</strong> ' + res.priority_bottleneck.tip + '</p>')
          : '') +
        '<div id="kfk-vip-checkin-sat-mount"></div>';

      if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.mountSatisfactionBar === 'function') {
        var satV = document.getElementById('kfk-vip-checkin-sat-mount');
        if (satV) global.DreamCompanyCRM.mountSatisfactionBar(satV, { div: 'KFK', context: 'vip_monthly_checkin', email: email });
      }
    };

    if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.submitKfkVipCheckin === 'function') {
      global.DreamCompanyCRM.submitKfkVipCheckin(reqPayload).then(renderVelocityResult).catch(function () {
        if (global.DreamCompanyCRM.computeLocalKfkCommentary) {
          renderVelocityResult(global.DreamCompanyCRM.computeLocalKfkCommentary(reqPayload));
        }
      });
    } else {
      var delta = Math.round((curH - prevH) * 100) / 100;
      var ann = Math.round(((delta / 30) * 365) * 10) / 10;
      renderVelocityResult({
        delta_cm: delta,
        annualized_cm_yr: ann,
        kdca_target_cm_yr: 5.6,
        velocity_verdict: '최근 30일 +' + delta.toFixed(2) + ' cm (연간 환산 ' + ann.toFixed(1) + ' cm/yr) 기록이 저장되었습니다.',
        priority_bottleneck: { key: '밤 10시 서파수면 및 저녁 식탁', tip: '동일한 아침 기상 직후 벽면 측정 원칙과 밤 10시 이전 소등 리듬을 꾸준히 이어가 주세요.' }
      });
    }
    return false;
  }

  function downloadRealGraduationAlbumPdf() {
    var paidCheck = getVerifiedPaidPass();
    if (!paidCheck || paidCheck.tier !== 'tier2') {
      alert('6개월 성장 졸업장 앨범 PDF는 2등급(19,900원) 인증 회원 전용입니다.');
      return false;
    }
    var savedProf = null;
    try { savedProf = JSON.parse(safeGetStorage(PROFILE_KEY) || 'null'); } catch (_) {}
    var realChildName = (savedProf && savedProf.nickname && String(savedProf.nickname).trim()) ? String(savedProf.nickname).trim() : '우리 아이';
    var realLogs = [];
    try {
      var rawL = safeGetStorage(VELOCITY_LOGS_KEY);
      realLogs = rawL ? JSON.parse(rawL) : [];
      if (!Array.isArray(realLogs)) realLogs = [];
    } catch (_) {}
    var startCm = realLogs.length ? Number(realLogs[0].prevH || realLogs[0].curH) : Number((savedProf && savedProf.heightCm) || 135.0);
    var latestCm = realLogs.length ? Number(realLogs[realLogs.length - 1].curH) : startCm;
    if (global.KfkPersonalizedPdf && typeof global.KfkPersonalizedPdf.downloadGraduationAlbumPdf === 'function') {
      return global.KfkPersonalizedPdf.downloadGraduationAlbumPdf(realChildName, startCm, latestCm, realLogs);
    }
    return false;
  }

  function openHeaderCheckinStudio(ev, tabOpt) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    if (tabOpt === 'tracker') {
      switchCheckinTab('tracker');
    } else if (tabOpt === 'restore') {
      switchCheckinTab('restore');
    }
    var modal = document.getElementById('kfk-checkin-modal');
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeCheckinModal() {
    if (typeof document === 'undefined') return;
    var modal = document.getElementById('kfk-checkin-modal');
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function selectQuickLagChip(monthsAgo, btnEl) {
    if (typeof document === 'undefined') return;
    var now = new Date();
    var lag = Math.max(0, parseInt(monthsAgo, 10) || 0);
    var tot = now.getFullYear() * 12 + now.getMonth() - lag;
    var ey = Math.floor(tot / 12);
    var em = (tot % 12) + 1;
    var yEl = document.getElementById('ba-exam-date-year');
    var mEl = document.getElementById('ba-exam-date-month');
    if (yEl) yEl.value = String(ey);
    if (mEl) mEl.value = String(em);

    var chips = document.querySelectorAll('[data-lag-chip]');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('is-selected', chips[i] === btnEl);
    }
    updateStep4BoneAgeReadout();
  }

  function selectVerbalStageChip(stageKey, btnEl) {
    if (typeof document === 'undefined') return;
    var p = readFormProfile();
    var age = computeExactAgeFromDob(p.birthYear, p.birthMonth, p.birthDay);
    var isGirl = p.sex === 'girl';
    var mappedYears = age.ageYears;
    if (stageKey === 'stage_open') mappedYears = Math.max(4, age.ageYears - 1);
    else if (stageKey === 'stage_pre') mappedYears = isGirl ? 9 : 11;
    else if (stageKey === 'stage_phv') mappedYears = isGirl ? 11 : 13;
    else if (stageKey === 'stage_late') mappedYears = isGirl ? 13 : 15;
    else if (stageKey === 'stage_closing') mappedYears = isGirl ? 15 : 16;

    var yEl = document.getElementById('ba-exam-years');
    var mEl = document.getElementById('ba-exam-months');
    if (yEl) {
      yEl.value = String(clamp(mappedYears, 3, 18));
      yEl.setAttribute('data-user-touched', '1');
    }
    if (mEl) mEl.value = '0';

    var chips = document.querySelectorAll('[data-stage-chip]');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('is-selected', chips[i] === btnEl);
    }
    updateStep4BoneAgeReadout();
  }

  function fillKoreanAverageParents() {
    var fEl = document.getElementById('father-height');
    var mEl = document.getElementById('mother-height');
    if (fEl) fEl.value = '174.0';
    if (mEl) mEl.value = '161.0';
    updateStep2MphReadout();
  }

  function fillStandard6MoGain() {
    var p = readFormProfile();
    var age = computeExactAgeFromDob(p.birthYear, p.birthMonth, p.birthDay);
    var stdHalfYr = age.ageYears < 5 ? 3.5 : (age.ageYears < 10 ? 2.9 : (age.ageYears < 14 ? 3.4 : 1.5));
    var gEl = document.getElementById('recent-6mo-gain');
    if (gEl) gEl.value = String(stdHalfYr.toFixed(1));
  }

  function bindEvents() {
    if (typeof document === 'undefined') return;
    populateDateSelects();

    document.addEventListener('change', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.matches('input[type="radio"], input[type="checkbox"]')) {
        syncChoiceCardHighlights();
      }
      if (t.id === 'dob-year' || t.id === 'dob-month' || t.id === 'dob-day' || t.name === 'child-sex') {
        updateStep1AgeReadout();
        updateStep2MphReadout();
      }
      if (t.id === 'father-height' || t.id === 'mother-height') {
        updateStep2MphReadout();
      }
      if (t.name === 'ba-mode' || t.id === 'ba-exam-years' || t.id === 'ba-exam-months' || t.id === 'ba-exam-date-year' || t.id === 'ba-exam-date-month' || t.name === 'habit-puberty') {
        if (t.id === 'ba-exam-years') t.setAttribute('data-user-touched', '1');
        updateStep4BoneAgeReadout();
      }
    });

    document.addEventListener('input', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === 'father-height' || t.id === 'mother-height') {
        updateStep2MphReadout();
      }
    });

    // Restore saved profile into form inputs if returning from Latpeed checkout
    var savedRaw = safeGetStorage(PROFILE_KEY);
    if (savedRaw) {
      try {
        var sp = JSON.parse(savedRaw);
        if (sp && sp.heightCm) {
          var hEl = document.getElementById('child-height');
          var wEl = document.getElementById('child-weight');
          var fEl = document.getElementById('father-height');
          var mEl = document.getElementById('mother-height');
          if (hEl && !hEl.value) hEl.value = String(sp.heightCm);
          if (wEl && !wEl.value && sp.weightKg) wEl.value = String(sp.weightKg);
          if (fEl && sp.fatherCm) fEl.value = String(sp.fatherCm);
          if (mEl && sp.motherCm) mEl.value = String(sp.motherCm);
        }
      } catch (_) {}
    }

    updateStep1AgeReadout();
    updateStep2MphReadout();
    syncChoiceCardHighlights();

    // Handle deep-link URL hashes or query params cleanly
    var hash = (global.location && global.location.hash) ? global.location.hash : '';
    var search = (global.location && global.location.search) ? global.location.search : '';
    var wantsAutoStart = false;
    try {
      if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.decodeMagicRestoreParam === 'function' && search) {
        var mObj = global.DreamCompanyCRM.decodeMagicRestoreParam(search);
        if (mObj && typeof mObj === 'object' && mObj.email && mObj.access_code && typeof global.DreamCompanyCRM.verifyEntitlement === 'function') {
          var profM = Object.assign(readFormProfile(), mObj);
          if (!profM.heightCm || profM.heightCm < 65) profM.heightCm = Number(mObj.h0 || mObj.baseline_height_cm || 138.8);
          safeSetStorage(PROFILE_KEY, profM);
          global.DreamCompanyCRM.verifyEntitlement({
            div: 'KFK',
            email: mObj.email,
            access_code: mObj.access_code,
            magic_restore: true
          }).then(function (vres) {
            if (vres && vres.authorized) {
              safeSetStorage(PAID_PASS_KEY, {
                email: mObj.email,
                tier: vres.tier === 'tier2' ? 'tier2' : 'tier1',
                orderRef: mObj.access_code,
                verifiedAt: new Date().toISOString()
              });
              state.lastAnalysis = analyzeGrowthClock(profM);
              renderScreen3Results(state.lastAnalysis);
              showScreen(3);
              if (global.DreamCompanyCRM.mountSatisfactionBar) {
                var smTop = document.getElementById('kfk-full-report-sat-mount');
                if (smTop) global.DreamCompanyCRM.mountSatisfactionBar(smTop, { div: 'KFK', context: 'full_report', email: mObj.email });
              }
            } else {
              openHeaderCheckinStudio();
            }
          });
          return;
        }
      }
      if (search) {
        var qs = new URLSearchParams(search);
        var urlPrevH = Number(qs.get('prev_h') || 0);
        var urlVipEm = String(qs.get('vip_email') || '').trim();
        if (urlPrevH >= 65 && urlPrevH <= 210) {
          var prevInp = document.getElementById('kfk-vip-prev-height');
          var curInp = document.getElementById('kfk-vip-cur-height');
          if (prevInp) prevInp.value = urlPrevH.toFixed(1);
          if (curInp) curInp.value = (urlPrevH + 0.5).toFixed(1);
        }
        if (urlVipEm) {
          var emInp = document.getElementById('kfk-vip-checkin-email');
          if (emInp) emInp.value = urlVipEm;
        }
        if (qs.get('vip_checkin') === '1') {
          openHeaderCheckinStudio(null, 'tracker');
        }
        var qGender = String(qs.get('gender') || qs.get('sex') || '').toLowerCase();
        if (qGender === 'boy' || qGender === 'girl') {
          var targetRadio = document.querySelector('input[name="child-sex"][value="' + qGender + '"]');
          if (targetRadio) {
            targetRadio.checked = true;
            syncChoiceCardHighlights();
          }
        }
        var presetMap = { infant_1: 1, toddler_2_3: 3, child_4_5: 5, elem_low: 8, elem_high: 11 };
        var qPreset = String(qs.get('preset') || '').toLowerCase();
        var qAge = parseInt(qs.get('age'), 10);
        if (isNaN(qAge) && presetMap[qPreset]) {
          qAge = presetMap[qPreset];
        }
        if (!isNaN(qAge) && qAge >= 1 && qAge <= 18) {
          var nowDt = new Date();
          var bySelect = document.getElementById('dob-year');
          var bmSelect = document.getElementById('dob-month');
          var bdSelect = document.getElementById('dob-day');
          if (bySelect) bySelect.value = String(nowDt.getFullYear() - qAge);
          if (bmSelect) bmSelect.value = String(nowDt.getMonth() + 1);
          if (bdSelect) bdSelect.value = String(nowDt.getDate());
          updateStep1AgeReadout();
          updateStep2MphReadout();
        }
        if (qs.get('autostart') === '1' || Boolean(presetMap[qPreset])) {
          wantsAutoStart = true;
        }
      }
    } catch (_) {}

    if (wantsAutoStart || hash === '#quiz-section' || hash === '#kfk-bone-age-interpreter' || /^#preset-/i.test(hash)) {
      showScreen(1);
      showSurveyStep(hash === '#kfk-bone-age-interpreter' ? 4 : 1);
    } else if (hash === '#kfk-latpeed-ebook-slot') {
      try {
        var baseProf = savedRaw ? JSON.parse(savedRaw) : readFormProfile();
        if (!baseProf.heightCm || baseProf.heightCm < 65) {
          baseProf.heightCm = 138.8;
          baseProf.weightKg = 35.0;
        }
        state.lastAnalysis = analyzeGrowthClock(baseProf);
        renderScreen3Results(state.lastAnalysis);
        showScreen(3);
        setTimeout(function () {
          var slotEl = document.getElementById('kfk-latpeed-ebook-slot');
          if (slotEl && slotEl.scrollIntoView) slotEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      } catch (_) {
        openHeaderCheckinStudio();
      }
    } else if (hash === '#kfk-vip-monthly-checkin') {
      openHeaderCheckinStudio();
    } else if (safeGetStorage('kfk_pending_checkout_tier') && savedRaw) {
      // Parent returning from Latpeed checkout tab -> show Screen 3 so they can verify or review
      try {
        var parsedP = JSON.parse(savedRaw);
        state.lastAnalysis = analyzeGrowthClock(parsedP);
        renderScreen3Results(state.lastAnalysis);
        showScreen(3);
      } catch (_) {}
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindEvents);
    } else {
      bindEvents();
    }
  }

  function downloadCustomChildReportPdf() {
    var savedRaw = safeGetStorage(PROFILE_KEY);
    var savedProfile = null;
    if (savedRaw) {
      try { savedProfile = JSON.parse(savedRaw); } catch (_) {}
    }
    var formProfile = readFormProfile();
    var profile = (formProfile && formProfile.heightCm >= 65) ? formProfile : (savedProfile || formProfile);
    if (savedProfile && savedProfile.nickname && !profile.nickname) {
      profile.nickname = savedProfile.nickname;
    }
    var nickInput = (typeof document !== 'undefined') ? document.getElementById('kfk-stepup-nickname-input') : null;
    if (nickInput && String(nickInput.value || '').trim()) {
      profile.nickname = String(nickInput.value || '').trim();
    }
    var analysis = state.lastAnalysis || analyzeGrowthClock(profile);
    var paidPass = getVerifiedPaidPass();
    if (global.KfkPersonalizedPdf && typeof global.KfkPersonalizedPdf.downloadPersonalizedChildPdf === 'function') {
      return global.KfkPersonalizedPdf.downloadPersonalizedChildPdf(analysis, profile, paidPass);
    }
    if (typeof global.print === 'function') global.print();
    return false;
  }

  function requestKfkOtp() {
    var emailEl = document.getElementById('kfk-restore-email');
    var msgEl = document.getElementById('kfk-restore-feedback');
    var email = emailEl ? String(emailEl.value || '').trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#9B3B32';
        msgEl.textContent = '먼저 래피드 결제 시 사용하신 이메일 주소를 입력해 주세요.';
      }
      return false;
    }
    if (msgEl) {
      msgEl.style.display = 'block';
      msgEl.style.color = '#3A3430';
      msgEl.textContent = '결제 이메일로 6자리 일회용 인증번호를 발송하고 있습니다...';
    }
    if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.requestAuthOtp === 'function') {
      global.DreamCompanyCRM.requestAuthOtp({ div: 'KFK', email: email }).then(function () {
        if (msgEl) {
          msgEl.style.display = 'block';
          msgEl.style.color = '#2F5241';
          msgEl.textContent = '결제 이력이 확인되면 6자리 인증번호가 메일로 발송됩니다 (10분 유효). 위 칸에 입력해 주세요.';
        }
      });
    }
    return false;
  }

  function downloadProtectedMasterbookPdf(ev) {
    var paidPass = getVerifiedPaidPass();
    if (!paidPass) {
      if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
      openHeaderCheckinStudio();
      return false;
    }
    if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.openProtectedPdfDownload === 'function') {
      if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
      var docKey = (paidPass.tier === 'tier2' || paidPass.tier === 'tier3') ? 'kfk_tier2_fullpackage' : 'kfk_tier1_masterbook';
      global.DreamCompanyCRM.openProtectedPdfDownload('KFK', docKey, function () {
        openHeaderCheckinStudio();
      });
      return false;
    }
    return true;
  }

  var api = {
    calculateKdcaPercentile: calculateKdcaPercentile,
    computeExactAgeFromDob: computeExactAgeFromDob,
    computeBoneAgeDeltaCalibration: computeBoneAgeDeltaCalibration,
    analyzeGrowthClock: analyzeGrowthClock,
    showScreen: showScreen,
    showSurveyStep: showSurveyStep,
    advanceFromStep: advanceFromStep,
    goBackInSurvey: goBackInSurvey,
    reopenEmailSaveForm: reopenEmailSaveForm,
    submitEmailForBasicSummary: submitEmailForBasicSummary,
    openKfkLatpeedCheckout: openKfkLatpeedCheckout,
    switchCheckinTab: switchCheckinTab,
    verifyAndUnlockKfkPaidPass: verifyAndUnlockKfkPaidPass,
    requestKfkOtp: requestKfkOtp,
    downloadProtectedMasterbookPdf: downloadProtectedMasterbookPdf,
    downloadRealGraduationAlbumPdf: downloadRealGraduationAlbumPdf,
    submitKfkMonthlyVelocityCheckin: submitKfkMonthlyVelocityCheckin,
    openHeaderCheckinStudio: openHeaderCheckinStudio,
    closeCheckinModal: closeCheckinModal,
    selectQuickLagChip: selectQuickLagChip,
    selectVerbalStageChip: selectVerbalStageChip,
    fillKoreanAverageParents: fillKoreanAverageParents,
    fillStandard6MoGain: fillStandard6MoGain,
    downloadCustomChildReportPdf: downloadCustomChildReportPdf
  };

  global.KfkAtelierApp = api;
  global.openKfkLatpeedCheckout = openKfkLatpeedCheckout;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
