/**
 * Dream Company HQ — Universal Passwordless 3-Second Club Membership Client
 * Shared across Divisions 1-5 static GitHub Pages frontends.
 *
 * Features:
 *  - Passwordless instant club membership state in localStorage (`dc_member_<DIV>`)
 *  - Cross-origin CORS-safe `text/plain;charset=utf-8` POST to Google Apps Script Web App
 *  - Offline / Pre-Activation Queue (`dc_crm_sync_queue_v1`) that auto-flushes once live endpoint is active
 */
(function (global) {
  'use strict';

  var ENDPOINT_CACHE = null;
  var QUEUE_KEY = 'dc_crm_sync_queue_v1';

  function resolveEndpointUrl() {
    if (ENDPOINT_CACHE) return Promise.resolve(ENDPOINT_CACHE);
    if (global.HQ_MAILING_ENDPOINT && String(global.HQ_MAILING_ENDPOINT).indexOf('https://script.google.com/macros/s/') === 0) {
      ENDPOINT_CACHE = String(global.HQ_MAILING_ENDPOINT).trim();
      return Promise.resolve(ENDPOINT_CACHE);
    }
    var jsonPath = global.HQ_MAILING_CONFIG_PATH || '/hq-mailing-endpoint.json';
    return fetch(jsonPath + '?v=' + Math.floor(Date.now() / 300000), { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (cfg) {
        if (cfg && cfg.webapp_exec_url && String(cfg.webapp_exec_url).indexOf('https://script.google.com/macros/s/') === 0) {
          ENDPOINT_CACHE = String(cfg.webapp_exec_url).trim();
          return ENDPOINT_CACHE;
        }
        return '';
      })
      .catch(function () { return ''; });
  }

  function readQueue() {
    try {
      var raw = localStorage.getItem(QUEUE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeQueue(items) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-25)));
    } catch (_) {}
  }

  function saveLocalMember(div, record) {
    try {
      localStorage.setItem('dc_member_' + String(div).toUpperCase(), JSON.stringify(record));
    } catch (_) {}
  }

  function getLocalMember(div) {
    try {
      var raw = localStorage.getItem('dc_member_' + String(div).toUpperCase());
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function fireDivisionSignupBeacon(div) {
    try {
      if (String(div || '').trim().toUpperCase() !== 'KFK') return;
      if (typeof global === 'undefined' || typeof global.fetch !== 'function') return;
      var nav = typeof navigator !== 'undefined' ? navigator : null;
      var ua = (nav && nav.userAgent) ? nav.userAgent : '';
      if ((nav && nav.webdriver) || /jsdom|bot|crawl|spider|slurp|headless|lighthouse|gtmetrix|pingdom|uptimerobot|python|curl|node|axios/i.test(ua)) return;
      var loc = global.location;
      var host = (loc && loc.hostname) ? loc.hostname : '';
      if (!host || host === 'localhost' || host === '127.0.0.1') return;
      var nowMs = Date.now();
      if (global.__LAST_KFK_SIGNUP_BEACON_TS__ && (nowMs - global.__LAST_KFK_SIGNUP_BEACON_TS__) < 1500) return;
      global.__LAST_KFK_SIGNUP_BEACON_TS__ = nowMs;
      var kst = new Date(nowMs + 9 * 3600 * 1000).toISOString().slice(0, 10);
      global.fetch('https://abacus.jasoncameron.dev/hit/kfk_kidsfitkr/signup_' + kst, { mode: 'cors', keepalive: true }).catch(function () {});
      global.fetch('https://abacus.jasoncameron.dev/hit/kfk_kidsfitkr/signup_total', { mode: 'cors', keepalive: true }).catch(function () {});
    } catch (_) {}
  }

  function postToAppsScript(execUrl, payload) {
    return fetch(execUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    }).then(function (res) {
      return res.text().then(function (txt) {
        try { return JSON.parse(txt); } catch (_) { return { ok: res.ok }; }
      });
    });
  }

  function registerMember(opts) {
    var div = String((opts && opts.div) || '').trim().toUpperCase();
    var email = String((opts && opts.email) || '').trim().toLowerCase();
    var nickname = String((opts && opts.nickname) || '').trim();
    var segment = String((opts && opts.segment) || 'general').trim();
    var message = String((opts && (opts.message || opts.notes)) || '').trim();
    var lang = String((opts && opts.lang) || '').trim();
    var websiteHp = String((opts && opts.website_hp) || '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return Promise.resolve({ ok: false, error: 'INVALID_EMAIL' });
    }

    var payload = {
      action: 'register_member',
      div: div,
      email: email,
      nickname: nickname,
      segment: segment,
      message: message,
      notes: message,
      lang: lang,
      website_hp: websiteHp,
      source_url: (global.location && global.location.href) ? global.location.href : '',
      client_ts: new Date().toISOString()
    };

    saveLocalMember(div, {
      div: div,
      email: email,
      nickname: nickname,
      segment: segment,
      joined_at: payload.client_ts
    });

    return resolveEndpointUrl().then(function (execUrl) {
      if (!execUrl) {
        var q = readQueue();
        q.push(payload);
        writeQueue(q);
        fireDivisionSignupBeacon(div);
        return { ok: true, queued_for_sync: true, div: div, email: email, segment: segment };
      }
      return postToAppsScript(execUrl, payload).then(function (res) {
        fireDivisionSignupBeacon(div);
        return res;
      }).catch(function () {
        var q2 = readQueue();
        q2.push(payload);
        writeQueue(q2);
        fireDivisionSignupBeacon(div);
        return { ok: true, queued_for_sync: true, div: div, email: email, segment: segment };
      });
    });
  }

  function flushPendingQueue() {
    var q = readQueue();
    if (!q.length) return;
    resolveEndpointUrl().then(function (execUrl) {
      if (!execUrl) return;
      var remaining = [];
      var chain = Promise.resolve();
      q.forEach(function (item) {
        chain = chain.then(function () {
          return postToAppsScript(execUrl, item).catch(function () {
            remaining.push(item);
          });
        });
      });
      chain.then(function () { writeQueue(remaining); });
    });
  }

  if (global.addEventListener) {
    global.addEventListener('DOMContentLoaded', function () {
      setTimeout(flushPendingQueue, 1800);
    });
  }

  function enrollKfgPaidVip(opts) {
    var email = String((opts && opts.email) || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return Promise.resolve({ ok: false, error: 'INVALID_EMAIL' });
    }
    var payload = {
      action: 'enroll_kfg_paid_vip',
      email: email,
      parent_name: String((opts && opts.parent_name) || 'Parent').trim(),
      child_name: String((opts && opts.child_name) || 'Your Child').trim(),
      child_sex: String((opts && opts.child_sex) || 'M').trim().toUpperCase(),
      child_age_years: Number((opts && opts.child_age_years) || 9),
      baseline_height_cm: Number((opts && opts.baseline_height_cm) || 134),
      plan_tier: String((opts && opts.plan_tier) || '6-Month Growth Pass ($19.99)').trim(),
      months_remaining: Number((opts && opts.months_remaining) || 6),
      order_ref: String((opts && opts.order_ref) || 'WEB-VIP').trim()
    };
    try {
      localStorage.setItem('dc_kfg_paid_vip', JSON.stringify(payload));
    } catch (_) {}

    return resolveEndpointUrl().then(function (execUrl) {
      if (!execUrl) {
        var q = readQueue();
        q.push(payload);
        writeQueue(q);
        return { ok: true, queued_for_sync: true, baseline_height_cm: payload.baseline_height_cm };
      }
      return postToAppsScript(execUrl, payload).catch(function () {
        var q2 = readQueue();
        q2.push(payload);
        writeQueue(q2);
        return { ok: true, queued_for_sync: true, baseline_height_cm: payload.baseline_height_cm };
      });
    });
  }

  function computeLocalKfgCommentary(payload) {
    var prevH = Number(payload.prev_height_cm) || (Number(payload.current_height_cm) - 0.5);
    var curH = Number(payload.current_height_cm) || 134.5;
    var age = Number(payload.child_age_years) || 9;
    var isF = String(payload.child_sex || 'M').toUpperCase().charAt(0) === 'F';
    var targetVel = age < 6 ? 6.6 : (age < 9 ? 5.7 : (age < 11.5 ? (isF ? 7.4 : 5.5) : (age < 14 ? (isF ? 5.6 : 8.2) : 3.6)));
    var delta = Math.round((curH - prevH) * 100) / 100;
    var annVel = Math.round(((delta / 30) * 365) * 10) / 10;
    var habits = [
      { key: 'Deep Sleep Window (Pre-10 PM GH Pulse)', score: Number(payload.sleep_score) || 3, tip: 'Shift lights-out 30 minutes earlier and turn off screens 45 minutes before bed to protect peak Growth Hormone release.' },
      { key: 'Protein + Calcium / Vit D3 / Zinc Intake', score: Number(payload.nutrition_score) || 3, tip: 'Pair dinner lean protein with bioavailable Calcium, Vitamin D3, and Zinc for healthy bone-plate mineralization.' },
      { key: 'Daily 20-Min Vertical Impact & Stretch', score: Number(payload.exercise_score) || 3, tip: 'Add 15–20 minutes of jump-rope, hops, or evening spinal decompression stretches daily.' },
      { key: 'Spinal Posture & Nasal Breathing', score: Number(payload.posture_score) || 3, tip: 'Correct forward-head desk posture and check nighttime nasal breathing to protect 1.0–1.8 cm of standing stature.' }
    ].sort(function (a, b) { return a.score - b.score; });
    var verdict = delta <= 0
      ? ('Height held steady at ' + curH.toFixed(1) + ' cm this 30-day cycle; linear growth occurs in saltatory pulses—protect morning measurement consistency and pre-10 PM sleep.')
      : ('30-day gain of +' + delta.toFixed(2) + ' cm (~' + annVel.toFixed(1) + ' cm/yr annualized pace vs. US CDC age-' + age + ' reference of ' + targetVel.toFixed(1) + ' cm/yr).');
    return {
      ok: true,
      prev_height_cm: prevH,
      current_height_cm: curH,
      delta_cm: delta,
      annualized_cm_yr: annVel,
      cdc_target_cm_yr: targetVel,
      velocity_verdict: verdict,
      strongest_habit: habits[habits.length - 1],
      priority_bottleneck: habits[0]
    };
  }

  function submitKfgVipCheckin(opts) {
    var payload = {
      action: 'submit_kfg_vip_checkin',
      email: String((opts && opts.email) || '').trim().toLowerCase(),
      vip_token: String((opts && opts.vip_token) || '').trim(),
      paid_verified: Boolean(opts && opts.paid_verified),
      order_ref: String((opts && opts.order_ref) || '').trim(),
      child_name: String((opts && opts.child_name) || 'Your Child').trim(),
      child_sex: String((opts && opts.child_sex) || 'M').trim().toUpperCase(),
      child_age_years: Number((opts && opts.child_age_years) || 9),
      prev_height_cm: Number((opts && opts.prev_height_cm) || 0),
      current_height_cm: Number((opts && opts.current_height_cm) || 0),
      sleep_score: Number((opts && opts.sleep_score) || 3),
      nutrition_score: Number((opts && opts.nutrition_score) || 3),
      exercise_score: Number((opts && opts.exercise_score) || 3),
      posture_score: Number((opts && opts.posture_score) || 3)
    };
    var localFallback = computeLocalKfgCommentary(payload);
    return resolveEndpointUrl().then(function (execUrl) {
      if (!execUrl) {
        var q = readQueue();
        q.push(payload);
        writeQueue(q);
        return localFallback;
      }
      return postToAppsScript(execUrl, payload).then(function (res) {
        if (res && typeof res === 'object') {
          var merged = {};
          var k;
          for (k in localFallback) { if (Object.prototype.hasOwnProperty.call(localFallback, k)) merged[k] = localFallback[k]; }
          for (k in res) { if (Object.prototype.hasOwnProperty.call(res, k) && res[k] !== undefined && res[k] !== null) merged[k] = res[k]; }
          return merged;
        }
        return localFallback;
      }).catch(function () {
        var q2 = readQueue();
        q2.push(payload);
        writeQueue(q2);
        return localFallback;
      });
    });
  }

  function enrollKfkPaidVip(opts) {
    var email = String((opts && opts.email) || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return Promise.resolve({ ok: false, error: 'INVALID_EMAIL' });
    }
    var payload = {
      action: 'enroll_kfk_paid_vip',
      div: 'KFK',
      email: email,
      child_sex: String((opts && opts.child_sex) || 'M').trim().toUpperCase(),
      child_age_years: Number((opts && opts.child_age_years) || 10),
      baseline_height_cm: Number((opts && opts.baseline_height_cm) || 138.8),
      plan_tier: String((opts && opts.plan_tier) || 'KFK_Paid_VIP_19900').trim(),
      months_remaining: Number((opts && opts.months_remaining) || 6),
      order_ref: String((opts && opts.order_ref) || 'LATPEED-KFK').trim(),
      client_ts: new Date().toISOString()
    };
    try {
      localStorage.setItem('dc_kfk_paid_vip', JSON.stringify(payload));
    } catch (_) {}
    return resolveEndpointUrl().then(function (execUrl) {
      if (!execUrl) {
        var q = readQueue();
        q.push(payload);
        writeQueue(q);
        return { ok: true, queued_for_sync: true, baseline_height_cm: payload.baseline_height_cm };
      }
      return postToAppsScript(execUrl, payload).catch(function () {
        var q2 = readQueue();
        q2.push(payload);
        writeQueue(q2);
        return { ok: true, queued_for_sync: true, baseline_height_cm: payload.baseline_height_cm };
      });
    });
  }

  function computeLocalKfkCommentary(payload) {
    var prevH = Number(payload.prev_height_cm) || (Number(payload.current_height_cm) - 0.45);
    var curH = Number(payload.current_height_cm) || 139.0;
    var age = Number(payload.child_age_years) || 10;
    var isF = String(payload.child_sex || 'M').toUpperCase().charAt(0) === 'F';
    var targetVel = age < 5 ? 7.0 : (age < 9 ? 5.8 : (age < 11.5 ? (isF ? 7.3 : 5.5) : (age < 14 ? (isF ? 5.4 : 8.0) : 3.2)));
    var delta = Math.round((curH - prevH) * 100) / 100;
    var annVel = Math.round(((delta / 30) * 365) * 10) / 10;
    var habits = [
      { key: '밤 10시 전 소등 및 초기 서파수면 깊이', score: Number(payload.sleep_score) || 3, tip: '취침 40분 전 거실 조도를 낮추고 잠들기 2시간 전 음식 섭취를 마무리하여 초기 90분 서파수면 성장호르몬 분비를 지켜 주세요.' },
      { key: '저녁 단백질 · 칼슘 · 비타민D3 균형 식탁', score: Number(payload.nutrition_score) || 3, tip: '저녁 식탁에 살코기·생선·두부 등 양질의 단백질과 흡수율 높은 칼슘·비타민D3 급원을 규칙적으로 곁들여 주세요.' },
      { key: '책상 시야각 정렬 및 저녁 척추 이완', score: Number(payload.posture_score) || 3, tip: '공부할 때 책 각도를 높여 경추 숙임을 줄이고 잠들기 전 가벼운 기지개·신전 스트레칭으로 눌린 척추 마디를 펴 주세요.' },
      { key: '수직 점프 및 야외 신체 활동 리듬', score: Number(payload.exercise_score) || 3, tip: '주 4회 이상 하루 15분 내외의 줄넘기나 가벼운 제자리 점프로 하지 성장판 연골에 건강한 자극을 더해 주세요.' }
    ].sort(function (a, b) { return a.score - b.score; });

    var verdict = '';
    if (delta <= 0) {
      verdict = '이번 30일 구간은 ' + curH.toFixed(1) + ' cm로 잠시 숨을 고르는 계단식 휴지기입니다. 기상 직후 동일한 벽면에서 측정 시각을 일정하게 맞추고 밤 10시 수면 리듬을 먼저 점검해 주세요.';
    } else if (annVel < 4.0 && age < 14) {
      verdict = '최근 30일 +' + delta.toFixed(2) + ' cm (연간 환산 약 ' + annVel.toFixed(1) + ' cm/yr · 질병관리청 만 ' + age + '세 기준 ' + targetVel.toFixed(1) + ' cm/yr). 3개월 연속 연간 4.0 cm/yr 미만이 지속될 경우 소아청소년과 성장 진료를 권장합니다.';
    } else {
      verdict = '최근 30일 +' + delta.toFixed(2) + ' cm (연간 환산 약 ' + annVel.toFixed(1) + ' cm/yr · 질병관리청 만 ' + age + '세 표준 ' + targetVel.toFixed(1) + ' cm/yr 대비 안정적인 성장 흐름입니다).';
    }
    return {
      ok: true,
      prev_height_cm: prevH,
      current_height_cm: curH,
      delta_cm: delta,
      annualized_cm_yr: annVel,
      kdca_target_cm_yr: targetVel,
      velocity_verdict: verdict,
      strongest_habit: habits[habits.length - 1],
      priority_bottleneck: habits[0]
    };
  }

  function submitKfkVipCheckin(opts) {
    var payload = {
      action: 'submit_kfk_vip_checkin',
      div: 'KFK',
      email: String((opts && opts.email) || '').trim().toLowerCase(),
      order_ref: String((opts && opts.order_ref) || '').trim(),
      child_sex: String((opts && opts.child_sex) || 'M').trim().toUpperCase(),
      child_age_years: Number((opts && opts.child_age_years) || 10),
      prev_height_cm: Number((opts && opts.prev_height_cm) || 0),
      current_height_cm: Number((opts && opts.current_height_cm) || 0),
      sleep_score: Number((opts && opts.sleep_score) || 3),
      nutrition_score: Number((opts && opts.nutrition_score) || 3),
      posture_score: Number((opts && opts.posture_score) || 3),
      exercise_score: Number((opts && opts.exercise_score) || 3),
      client_ts: new Date().toISOString()
    };
    var localFallback = computeLocalKfkCommentary(payload);
    return resolveEndpointUrl().then(function (execUrl) {
      if (!execUrl) {
        var q = readQueue();
        q.push(payload);
        writeQueue(q);
        return localFallback;
      }
      return postToAppsScript(execUrl, payload).then(function (res) {
        if (res && typeof res === 'object') {
          var merged = {};
          var k;
          for (k in localFallback) { if (Object.prototype.hasOwnProperty.call(localFallback, k)) merged[k] = localFallback[k]; }
          for (k in res) { if (Object.prototype.hasOwnProperty.call(res, k) && res[k] !== undefined && res[k] !== null) merged[k] = res[k]; }
          return merged;
        }
        return localFallback;
      }).catch(function () {
        var q2 = readQueue();
        q2.push(payload);
        writeQueue(q2);
        return localFallback;
      });
    });
  }

  global.DreamCompanyCRM = {
    registerMember: registerMember,
    fireSignupBeacon: fireDivisionSignupBeacon,
    enrollKfgPaidVip: enrollKfgPaidVip,
    submitKfgVipCheckin: submitKfgVipCheckin,
    enrollKfkPaidVip: enrollKfkPaidVip,
    submitKfkVipCheckin: submitKfkVipCheckin,
    computeLocalKfkCommentary: computeLocalKfkCommentary,
    getLocalMember: getLocalMember,
    flushPendingQueue: flushPendingQueue
  };
})(typeof window !== 'undefined' ? window : this);
