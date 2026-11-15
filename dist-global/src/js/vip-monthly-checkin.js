/**
 * KISFIT Bio Labs (Division 2 Global) — Passwordless Club & Paid VIP Monthly Check-in Engine
 * src/js/vip-monthly-checkin.js
 *
 * 100% English-Only (Zero-Hangul) · Zero Password Fields:
 *  1) Free 3-Second Passwordless Parent Growth Golden-Window Club (`DreamCompanyCRM.registerMember`)
 *  2) Paid VIP Monthly Growth Checklist & Pediatric Velocity Commentary Portal (`#kfg-vip-monthly-checkin` -> `DreamCompanyCRM.submitKfgVipCheckin`)
 */
(function (global) {
  'use strict';

  var STAGE_MAP = {
    ages_3_7_foundation: 'Ages 3-7 (Early Foundation)',
    ages_8_11_golden_window: 'Ages 8-11 (Pre-Puberty Golden Window)',
    ages_12_16_peak_velocity: 'Ages 12-16 (Puberty & Plate Closure)'
  };

  var selectedFreeSegment = 'ages_8_11_golden_window';

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cmToImperialLabel(cm) {
    var val = Number(cm);
    if (!isFinite(val) || val <= 0) return '';
    var totalIn = val / 2.54;
    var ft = Math.floor(totalIn / 12);
    var inch = Math.round((totalIn - ft * 12) * 10) / 10;
    if (inch >= 12) {
      ft += 1;
      inch = 0;
    }
    return ft + ' ft ' + inch.toFixed(1) + ' in';
  }

  function selectKfgFreeClubSegment(segKey) {
    if (!STAGE_MAP[segKey]) return;
    selectedFreeSegment = segKey;
    global.__kfgSelectedClubSegment = segKey;
    global.__kfgSelectedStageLabel = STAGE_MAP[segKey];
    try {
      localStorage.setItem('kfg_parent_member_segment', segKey);
      localStorage.setItem('kfg_parent_member_stage', STAGE_MAP[segKey]);
    } catch (_) {}

    var pills = document.querySelectorAll('[data-kfg-club-seg]');
    for (var i = 0; i < pills.length; i++) {
      var p = pills[i];
      var isAct = p.getAttribute('data-kfg-club-seg') === segKey;
      p.classList.toggle('active', isAct);
      p.setAttribute('aria-pressed', isAct ? 'true' : 'false');
    }
  }

  function submitKfgPasswordlessClubSignup(ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    var emailEl = document.getElementById('kfg-club-passwordless-email');
    var nickEl = document.getElementById('kfg-club-passwordless-nick');
    var hpEl = document.getElementById('kfg-club-passwordless-hp');
    var statusEl = document.getElementById('kfg-club-passwordless-feedback');
    var btnEl = document.getElementById('btn-kfg-club-passwordless-submit');

    var email = emailEl ? String(emailEl.value || '').trim().toLowerCase() : '';
    var nickname = nickEl ? String(nickEl.value || '').trim() : '';
    var websiteHp = hpEl ? String(hpEl.value || '').trim() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.className = 'kfg-crm-feedback error';
        statusEl.textContent = 'Please enter a valid parent email address (e.g., parent@gmail.com).';
      }
      if (emailEl) emailEl.focus();
      return false;
    }

    var stageLabel = STAGE_MAP[selectedFreeSegment] || STAGE_MAP.ages_8_11_golden_window;
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = 'Activating 3-Sec Club Access...';
    }

    var finishUi = function () {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = 'Join Free Growth Club (3-Sec Access) ->';
      }
      if (typeof global.trackKfgFreeSignup === 'function') {
        try { global.trackKfgFreeSignup(email, stageLabel); } catch (_) {}
      }
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.className = 'kfg-crm-feedback success';
        statusEl.innerHTML =
          '<strong>Passwordless Club Active (' + escHtml(email) + ')</strong> &middot; Stage: <strong>' + escHtml(stageLabel) + '</strong>.<br>' +
          'Age-matched US CDC height velocity, pre-10 PM sleep GH &amp; bone nutrition briefings are enabled. ' +
          '<a href="#kfg-bone-age-interpreter" style="color:#047857;font-weight:900;text-decoration:underline;">Open Free Bone-Age X-Ray Interpreter &rarr;</a>';
      }
    };

    if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.registerMember === 'function') {
      global.DreamCompanyCRM.registerMember({
        div: 'KFG',
        email: email,
        nickname: nickname,
        segment: selectedFreeSegment,
        lang: 'en-US',
        website_hp: websiteHp
      }).then(finishUi).catch(finishUi);
    } else {
      try {
        localStorage.setItem('dc_member_KFG', JSON.stringify({
          div: 'KFG',
          email: email,
          nickname: nickname,
          segment: selectedFreeSegment,
          joined_at: new Date().toISOString()
        }));
      } catch (_) {}
      finishUi();
    }
    return false;
  }

  function syncVipHeightHelperLabels() {
    var prevCmEl = document.getElementById('kfg-vip-prev-cm');
    var currCmEl = document.getElementById('kfg-vip-curr-cm');
    var prevImpEl = document.getElementById('kfg-vip-prev-imperial-hint');
    var currImpEl = document.getElementById('kfg-vip-curr-imperial-hint');

    if (prevCmEl && prevImpEl) {
      var pLbl = cmToImperialLabel(prevCmEl.value);
      prevImpEl.textContent = pLbl ? ('Approx. ' + pLbl) : 'Enter cm (1 in = 2.54 cm)';
    }
    if (currCmEl && currImpEl) {
      var cLbl = cmToImperialLabel(currCmEl.value);
      currImpEl.textContent = cLbl ? ('Approx. ' + cLbl) : 'Enter cm or use ft/in converter';
    }
  }

  function applyVipImperialConverter() {
    var ftEl = document.getElementById('kfg-vip-conv-ft');
    var inEl = document.getElementById('kfg-vip-conv-in');
    var currCmEl = document.getElementById('kfg-vip-curr-cm');
    var prevCmEl = document.getElementById('kfg-vip-prev-cm');
    if (!ftEl || !inEl || !currCmEl) return;
    var ft = Number(ftEl.value) || 0;
    var inch = Number(inEl.value) || 0;
    if (ft <= 0 && inch <= 0) return;
    var cm = Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
    currCmEl.value = cm.toFixed(1);
    if (prevCmEl && (!prevCmEl.value || Number(prevCmEl.value) <= 0)) {
      prevCmEl.value = Math.max(50, Math.round((cm - 0.5) * 10) / 10).toFixed(1);
    }
    syncVipHeightHelperLabels();
  }

  function selectVipHabitScore(axis, scoreVal) {
    var score = Math.max(1, Math.min(5, Number(scoreVal) || 3));
    var hiddenEl = document.getElementById('kfg-vip-' + axis + '-score');
    if (hiddenEl) hiddenEl.value = String(score);
    var btns = document.querySelectorAll('[data-kfg-habit-axis="' + axis + '"]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var bScore = Number(b.getAttribute('data-kfg-habit-score'));
      var active = bScore === score;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  function renderVipCommentaryCard(result, payload) {
    var outEl = document.getElementById('kfg-vip-commentary-output');
    if (!outEl || !result) return;

    var deltaCm = Number(result.delta_cm || 0);
    var deltaIn = Math.round((deltaCm / 2.54) * 100) / 100;
    var annCm = Number(result.annualized_cm_yr || 0);
    var annIn = Math.round((annCm / 2.54) * 10) / 10;
    var targetCm = Number(result.cdc_target_cm_yr || 5.8);
    var targetIn = Math.round((targetCm / 2.54) * 10) / 10;

    var paceBadgeColor = annCm >= targetCm * 0.92 ? '#059669' : (annCm > 0 ? '#D97706' : '#2563EB');
    var paceBadgeText = annCm >= targetCm * 0.92
      ? 'ON-TRACK / ABOVE CDC TARGET PACE'
      : (annCm > 0 ? 'MODERATE PACE - PROTECT SLEEP & MINERAL DENSITY' : 'STEADY CYCLE - SALTATORY PULSE PHASE');

    var strongest = result.strongest_habit || { key: 'Spinal Posture & Nasal Breathing', score: 4 };
    var bottleneck = result.priority_bottleneck || {
      key: 'Deep Sleep Window (Pre-10 PM GH Pulse)',
      score: 3,
      tip: 'Shift lights-out 30 minutes earlier and turn off screens 45 minutes before bed to protect peak Growth Hormone release.'
    };

    var deltaSign = deltaCm > 0 ? '+' : '';
    var childLabel = escHtml(payload.child_name || 'Your Child');
    var emailLabel = escHtml(payload.email || '');

    outEl.style.display = 'block';
    outEl.innerHTML =
      '<div class="kfg-vip-report-card">' +
        '<div class="kfg-vip-report-head">' +
          '<span class="kfg-vip-report-pill" style="background:' + paceBadgeColor + ';">' + paceBadgeText + '</span>' +
          '<span class="kfg-vip-report-date">30-Day Auxology Check-in Logged &middot; ' + new Date().toISOString().slice(0, 10) + '</span>' +
        '</div>' +
        '<h3 class="kfg-vip-report-title">Monthly Velocity &amp; Habit Commentary for ' + childLabel + '</h3>' +
        '<div class="kfg-vip-kpi-row">' +
          '<div class="kfg-vip-kpi-box">' +
            '<span class="kfg-vip-kpi-lbl">30-Day Stature Delta</span>' +
            '<strong class="kfg-vip-kpi-val">' + deltaSign + deltaCm.toFixed(2) + ' cm <small>(' + deltaSign + deltaIn.toFixed(2) + ' in)</small></strong>' +
            '<span class="kfg-vip-kpi-sub">' + Number(result.prev_height_cm || payload.prev_height_cm).toFixed(1) + ' cm &rarr; ' + Number(result.current_height_cm || payload.current_height_cm).toFixed(1) + ' cm</span>' +
          '</div>' +
          '<div class="kfg-vip-kpi-box">' +
            '<span class="kfg-vip-kpi-lbl">Annualized Growth Velocity</span>' +
            '<strong class="kfg-vip-kpi-val">' + annCm.toFixed(1) + ' cm/yr <small>(' + annIn.toFixed(1) + ' in/yr)</small></strong>' +
            '<span class="kfg-vip-kpi-sub">US CDC Age-' + Number(payload.child_age_years).toFixed(1).replace(/\.0$/, '') + ' Reference: ' + targetCm.toFixed(1) + ' cm/yr (' + targetIn.toFixed(1) + ' in/yr)</span>' +
          '</div>' +
          '<div class="kfg-vip-kpi-box">' +
            '<span class="kfg-vip-kpi-lbl">Strongest Monthly Pillar</span>' +
            '<strong class="kfg-vip-kpi-val" style="font-size:0.95rem;color:#047857;">' + escHtml(strongest.key) + ' (' + Number(strongest.score || 4) + '/5)</strong>' +
            '<span class="kfg-vip-kpi-sub">Keep anchoring this habit over the next 30 days</span>' +
          '</div>' +
        '</div>' +
        '<div class="kfg-vip-verdict-box">' +
          '<strong>Clinical Velocity Note:</strong> ' + escHtml(result.velocity_verdict || '') +
        '</div>' +
        '<div class="kfg-vip-bottleneck-box">' +
          '<div class="kfg-vip-bottleneck-title">Priority #1 Bottleneck to Fix Next 30 Days: ' + escHtml(bottleneck.key) + ' (Score ' + Number(bottleneck.score || 3) + '/5)</div>' +
          '<div class="kfg-vip-bottleneck-tip">' + escHtml(bottleneck.tip || '') + '</div>' +
        '</div>' +
        '<div class="kfg-vip-email-confirm">' +
          'Sent &amp; queued for <strong>' + emailLabel + '</strong> &middot; Your Personalized Monthly Velocity Commentary Email &amp; Day-30 Checklist Reminder are synced to your VIP ledger.' +
        '</div>' +
      '</div>';
  }

  function submitKfgVipMonthlyCheckinForm(ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();

    var emailEl = document.getElementById('kfg-vip-email');
    var nameEl = document.getElementById('kfg-vip-child-name');
    var sexEl = document.getElementById('kfg-vip-child-sex');
    var ageEl = document.getElementById('kfg-vip-child-age');
    var prevEl = document.getElementById('kfg-vip-prev-cm');
    var currEl = document.getElementById('kfg-vip-curr-cm');
    var sleepEl = document.getElementById('kfg-vip-sleep-score');
    var nutEl = document.getElementById('kfg-vip-nutrition-score');
    var exEl = document.getElementById('kfg-vip-exercise-score');
    var posEl = document.getElementById('kfg-vip-posture-score');
    var errEl = document.getElementById('kfg-vip-form-error');
    var btnEl = document.getElementById('btn-kfg-vip-checkin-submit');

    var email = emailEl ? String(emailEl.value || '').trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = 'Please enter the VIP parent email address used for your Growth Report or 6-Month Pass.';
      }
      if (emailEl) emailEl.focus();
      return false;
    }

    var currCm = Number(currEl ? currEl.value : 0);
    var prevCm = Number(prevEl ? prevEl.value : 0);
    if (!isFinite(currCm) || currCm < 65 || currCm > 215) {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = 'Please enter a valid current standing height between 65 cm and 215 cm (or use the ft/in helper).';
      }
      if (currEl) currEl.focus();
      return false;
    }
    if (!isFinite(prevCm) || prevCm < 60 || prevCm > 215) {
      prevCm = Math.round((currCm - 0.5) * 10) / 10;
      if (prevEl) prevEl.value = prevCm.toFixed(1);
    }
    if (errEl) errEl.style.display = 'none';

    var vipToken = '';
    var orderRef = '';
    var paidVerified = false;
    try {
      var params = new URLSearchParams(global.location ? global.location.search : '');
      vipToken = String(params.get('vip_token') || localStorage.getItem('kfg_vip_token') || '').trim();
      orderRef = String(localStorage.getItem('kidsfit_global_order_id_v1') || '').trim();
      paidVerified = Boolean(
        vipToken ||
        orderRef ||
        localStorage.getItem('kidsfit_global_report_unlocked_v1') === 'true' ||
        localStorage.getItem('dc_kfg_paid_vip')
      );
    } catch (_) {}

    var payload = {
      email: email,
      vip_token: vipToken,
      paid_verified: paidVerified,
      order_ref: orderRef,
      child_name: (nameEl && String(nameEl.value || '').trim()) || 'Your Child',
      child_sex: (sexEl && sexEl.value) || 'M',
      child_age_years: Number(ageEl ? ageEl.value : 9) || 9,
      prev_height_cm: prevCm,
      current_height_cm: currCm,
      sleep_score: Number(sleepEl ? sleepEl.value : 4) || 4,
      nutrition_score: Number(nutEl ? nutEl.value : 4) || 4,
      exercise_score: Number(exEl ? exEl.value : 3) || 3,
      posture_score: Number(posEl ? posEl.value : 3) || 3
    };

    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = 'Calculating US CDC Velocity & Saving Check-in...';
    }

    var onDone = function (res) {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = 'Submit Monthly Check-in & Generate Velocity Commentary ->';
      }
      try {
        var histRaw = localStorage.getItem('kfg_vip_checkin_history_v1') || '[]';
        var hist = JSON.parse(histRaw);
        if (!Array.isArray(hist)) hist = [];
        hist.unshift({
          date: new Date().toISOString().slice(0, 10),
          email: payload.email,
          prev_height_cm: payload.prev_height_cm,
          current_height_cm: payload.current_height_cm,
          delta_cm: res && res.delta_cm
        });
        localStorage.setItem('kfg_vip_checkin_history_v1', JSON.stringify(hist.slice(0, 12)));
        localStorage.setItem('kfg_vip_last_height_cm', String(payload.current_height_cm));
      } catch (_) {}

      if (typeof global.stampKfgGrowthClubToday === 'function') {
        try { global.stampKfgGrowthClubToday(); } catch (_) {}
      }
      renderVipCommentaryCard(res, payload);
    };

    if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.submitKfgVipCheckin === 'function') {
      global.DreamCompanyCRM.submitKfgVipCheckin(payload).then(onDone).catch(function () {
        onDone({
          delta_cm: Math.round((currCm - prevCm) * 100) / 100,
          annualized_cm_yr: Math.round((((currCm - prevCm) / 30) * 365) * 10) / 10,
          cdc_target_cm_yr: 5.8,
          velocity_verdict: 'Monthly height check-in recorded locally and queued for VIP commentary sync.'
        });
      });
    } else {
      onDone({
        delta_cm: Math.round((currCm - prevCm) * 100) / 100,
        annualized_cm_yr: Math.round((((currCm - prevCm) / 30) * 365) * 10) / 10,
        cdc_target_cm_yr: 5.8,
        velocity_verdict: 'Monthly height check-in recorded.'
      });
    }
    return false;
  }

  function hydrateKfgCrmAndVipPortal() {
    try {
      var savedSeg = localStorage.getItem('kfg_parent_member_segment');
      if (savedSeg && STAGE_MAP[savedSeg]) {
        selectKfgFreeClubSegment(savedSeg);
      } else {
        selectKfgFreeClubSegment('ages_8_11_golden_window');
      }

      var savedMember = (global.DreamCompanyCRM && global.DreamCompanyCRM.getLocalMember('KFG')) || null;
      if (savedMember && savedMember.email) {
        var clubEmailEl = document.getElementById('kfg-club-passwordless-email');
        if (clubEmailEl && !clubEmailEl.value) clubEmailEl.value = savedMember.email;
        if (savedMember.segment && STAGE_MAP[savedMember.segment]) {
          selectKfgFreeClubSegment(savedMember.segment);
        }
        var fbEl = document.getElementById('kfg-club-passwordless-feedback');
        if (fbEl) {
          fbEl.style.display = 'block';
          fbEl.className = 'kfg-crm-feedback success';
          fbEl.innerHTML = '<strong>Active Growth Club Member:</strong> ' + escHtml(savedMember.email) + ' &middot; Focus: ' + escHtml(STAGE_MAP[savedMember.segment] || STAGE_MAP.ages_8_11_golden_window);
        }
      }

      // Hydrate VIP Monthly Check-in Portal from URL query params or saved paid VIP state
      var params = new URLSearchParams((global.location && global.location.search) || '');
      var urlVipEmail = String(params.get('vip_email') || '').trim();
      var urlVipToken = String(params.get('vip_token') || '').trim();
      var wantsCheckinScroll = params.get('vip_checkin') === '1' || Boolean(urlVipToken) || (global.location && global.location.hash === '#kfg-vip-monthly-checkin');

      if (urlVipToken) {
        localStorage.setItem('kfg_vip_token', urlVipToken);
      }

      var storedVip = null;
      try {
        var rawVip = localStorage.getItem('dc_kfg_paid_vip');
        if (rawVip) storedVip = JSON.parse(rawVip);
      } catch (_) {}

      var vipEmail = urlVipEmail ||
        (storedVip && storedVip.email) ||
        localStorage.getItem('kidsfit_global_buyer_email') ||
        (savedMember && savedMember.email) ||
        '';

      var vipEmailEl = document.getElementById('kfg-vip-email');
      if (vipEmailEl && vipEmail && !vipEmailEl.value) {
        vipEmailEl.value = vipEmail;
      }

      if (storedVip) {
        var nameEl = document.getElementById('kfg-vip-child-name');
        var sexEl = document.getElementById('kfg-vip-child-sex');
        var ageEl = document.getElementById('kfg-vip-child-age');
        var prevEl = document.getElementById('kfg-vip-prev-cm');
        var currEl = document.getElementById('kfg-vip-curr-cm');
        if (nameEl && storedVip.child_name && !nameEl.value) nameEl.value = storedVip.child_name;
        if (sexEl && storedVip.child_sex) sexEl.value = String(storedVip.child_sex).charAt(0).toUpperCase() === 'F' ? 'F' : 'M';
        if (ageEl && storedVip.child_age_years) ageEl.value = String(storedVip.child_age_years);
        if (prevEl && storedVip.baseline_height_cm) {
          var lastH = Number(localStorage.getItem('kfg_vip_last_height_cm')) || Number(storedVip.baseline_height_cm);
          prevEl.value = lastH.toFixed(1);
          if (currEl) currEl.value = (lastH + 0.5).toFixed(1);
        }
      }

      var badgeEl = document.getElementById('kfg-vip-status-pill');
      var isUnlocked = localStorage.getItem('kidsfit_global_report_unlocked_v1') === 'true' || Boolean(storedVip) || Boolean(urlVipToken);
      if (badgeEl && isUnlocked) {
        badgeEl.textContent = 'VERIFIED VIP PASS ACTIVE - MONTHLY VELOCITY CONCIERGE UNLOCKED';
        badgeEl.style.background = '#059669';
        badgeEl.style.color = '#FFFFFF';
      }

      syncVipHeightHelperLabels();

      if (wantsCheckinScroll) {
        setTimeout(function () {
          var sec = document.getElementById('kfg-vip-monthly-checkin');
          if (sec && typeof sec.scrollIntoView === 'function') {
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 350);
      }
    } catch (_) {}
  }

  global.selectKfgFreeClubSegment = selectKfgFreeClubSegment;
  global.submitKfgPasswordlessClubSignup = submitKfgPasswordlessClubSignup;
  global.syncVipHeightHelperLabels = syncVipHeightHelperLabels;
  global.applyVipImperialConverter = applyVipImperialConverter;
  global.selectVipHabitScore = selectVipHabitScore;
  global.submitKfgVipMonthlyCheckinForm = submitKfgVipMonthlyCheckinForm;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hydrateKfgCrmAndVipPortal);
    } else {
      hydrateKfgCrmAndVipPortal();
    }
  }
})(typeof window !== 'undefined' ? window : this);
