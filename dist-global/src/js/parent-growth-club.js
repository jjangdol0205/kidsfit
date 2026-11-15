/**
 * src/js/parent-growth-club.js
 * KISFIT Parent Growth Club — Monthly Milestone Stamp & D-30 Reminder
 * Pure client-side belonging, habit streak, 4-milestone stamp card & RFC-5545 .ics reminder.
 */
(function () {
  'use strict';

  var CLUB_KEY = 'kfg_growth_club_v1';
  var MILESTONE_KEY = 'kfg_growth_milestones_v1';

  var DAILY_PARTNER_NOTES = [
    'Welcome back, Growth Partner — steady 9 PM deep sleep and daily D3 + Calcium build healthy inches quietly month by month.',
    'Good to see you, Growth Partner — children grow most during calm, screen-free nights; tonight\'s bedtime routine is a gift to their future height.',
    'Hello, Growth Partner — skip daily scale stress; steady 30-day and 90-day US CDC velocity is what truly counts.',
    'You\'re doing great, Growth Partner — 10 minutes of joyful backyard jumping plus protein at dinner gently wakes up growing bone plates.',
    'Welcome home, Growth Partner — tall posture and unhurried morning stretches help every millimeter of natural growth shine through.',
    'Steady wins, Growth Partner — pairing morning sunlight, balanced protein, and a 9 PM lights-out protects peak nighttime growth hormone.',
    'Cheering you on, Growth Partner — measuring barefoot once a month against a flat wall turns guesswork into calm, confident parenting.'
  ];

  function getLocalIsoDate(dateObj) {
    var d = dateObj || new Date();
    var yr = d.getFullYear();
    var mo = String(d.getMonth() + 1).padStart(2, '0');
    var da = String(d.getDate()).padStart(2, '0');
    return yr + '-' + mo + '-' + da;
  }

  function addDays(isoStr, days) {
    var parts = String(isoStr || '').split('-');
    var base = parts.length === 3
      ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0)
      : new Date();
    base.setDate(base.getDate() + Number(days || 0));
    return getLocalIsoDate(base);
  }

  function diffDays(fromIso, toIso) {
    var a = String(fromIso || '').split('-');
    var b = String(toIso || '').split('-');
    if (a.length !== 3 || b.length !== 3) return 0;
    var d1 = Date.UTC(Number(a[0]), Number(a[1]) - 1, Number(a[2]));
    var d2 = Date.UTC(Number(b[0]), Number(b[1]) - 1, Number(b[2]));
    return Math.round((d2 - d1) / 86400000);
  }

  function formatReadableDate(isoStr) {
    var p = String(isoStr || '').split('-');
    if (p.length !== 3) return isoStr || '';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var mIdx = Math.max(0, Math.min(11, Number(p[1]) - 1));
    return months[mIdx] + ' ' + Number(p[2]) + ', ' + p[0];
  }

  function pickDailyNote(isoStr) {
    var seed = 0;
    var s = String(isoStr || '');
    for (var i = 0; i < s.length; i++) {
      seed = ((seed * 31) + s.charCodeAt(i)) >>> 0;
    }
    return DAILY_PARTNER_NOTES[seed % DAILY_PARTNER_NOTES.length];
  }

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage ? window.localStorage.getItem(key) : null;
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (_e) {
      return fallback;
    }
  }

  function writeJson(key, val) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(val));
      }
    } catch (_e) {}
  }

  function captureChildSnapshot() {
    var ageStr = '';
    var heightStr = '';
    try {
      var ageEl = document.getElementById('kfg-qs-age') || document.getElementById('child-age-years');
      if (ageEl && ageEl.value) {
        ageStr = 'Age ' + String(ageEl.value).trim() + ' yrs';
      }
      var isMetric = false;
      var metWrap = document.getElementById('kfg-qs-metric-wrap');
      if (metWrap && metWrap.style && metWrap.style.display !== 'none') {
        isMetric = true;
      }
      var cmEl = document.getElementById('kfg-qs-cm');
      var ftEl = document.getElementById('kfg-qs-ft');
      var inEl = document.getElementById('kfg-qs-in');
      if (!isMetric && ftEl && inEl && ftEl.value !== '') {
        var ft = Number(ftEl.value) || 4;
        var inch = Number(inEl.value) || 0;
        var approxCm = Math.round(((ft * 12) + inch) * 2.54);
        heightStr = ft + ' ft ' + inch + ' in (' + approxCm + ' cm)';
      } else if (cmEl && cmEl.value) {
        var cm = Number(cmEl.value) || 133;
        var totIn = Math.round(cm / 2.54);
        heightStr = Math.floor(totIn / 12) + ' ft ' + (totIn % 12) + ' in (' + cm + ' cm)';
      }
      if (!ageStr) {
        var saved = readJson('kfg_saved_profiles', []);
        if (Array.isArray(saved) && saved[0] && saved[0].age) {
          ageStr = 'Age ' + saved[0].age + ' yrs';
        }
      }
    } catch (_e) {}
    if (ageStr && heightStr) return ageStr + ' · ' + heightStr;
    return ageStr || heightStr || 'US CDC Baseline Tracked';
  }

  function getInitialClubState() {
    return readJson(CLUB_KEY, {
      streakDays: 0,
      lastCheckInDate: '',
      totalCheckIns: 0,
      partnerSince: ''
    });
  }

  function getInitialMilestoneState() {
    return readJson(MILESTONE_KEY, {
      stamps: { s1: '', s2: '', s3: '', s4: '' },
      baselineDate: '',
      lastCheckInDate: '',
      nextRecheckDate: '',
      latestSnapshot: '',
      history: []
    });
  }

  function renderParentGrowthClub() {
    var root = document.getElementById('kfg-parent-growth-club');
    if (!root) return;

    var todayIso = getLocalIsoDate();
    var noteEl = document.getElementById('kfg-club-daily-greeting');
    if (noteEl) {
      noteEl.textContent = '💚 "' + pickDailyNote(todayIso) + '"';
    }

    var club = getInitialClubState();
    var ms = getInitialMilestoneState();
    var stamps = (ms && ms.stamps) ? ms.stamps : { s1: '', s2: '', s3: '', s4: '' };

    var displayDay = club.streakDays > 0 ? club.streakDays : 1;
    var badgeEl = document.getElementById('kfg-club-streak-badge');
    if (badgeEl) {
      badgeEl.textContent = '🏅 Growth Club Partner · Day ' + displayDay + ' Check-in';
    }

    var stampedCount = 0;
    var stampConfigs = [
      { key: 's1', cardId: 'kfg-ms-card-1', sealId: 'kfg-ms-seal-1', metaId: 'kfg-ms-meta-1', idleText: 'Tap check-in below to log Day 1' },
      { key: 's2', cardId: 'kfg-ms-card-2', sealId: 'kfg-ms-seal-2', metaId: 'kfg-ms-meta-2', idleText: 'Bedtime + daily D3 & Ca check' },
      { key: 's3', cardId: 'kfg-ms-card-3', sealId: 'kfg-ms-seal-3', metaId: 'kfg-ms-meta-3', idleText: 'Unlocks at 30-day height check' },
      { key: 's4', cardId: 'kfg-ms-card-4', sealId: 'kfg-ms-seal-4', metaId: 'kfg-ms-meta-4', idleText: 'Quarterly US CDC velocity' }
    ];

    for (var i = 0; i < stampConfigs.length; i++) {
      var cfg = stampConfigs[i];
      var stampedDate = stamps[cfg.key] || '';
      var card = document.getElementById(cfg.cardId);
      var seal = document.getElementById(cfg.sealId);
      var meta = document.getElementById(cfg.metaId);
      if (stampedDate) {
        stampedCount++;
        if (card) card.classList.add('is-stamped');
        if (seal) seal.textContent = '✓ Stamped';
        if (meta) meta.textContent = 'Logged ' + formatReadableDate(stampedDate);
      } else {
        if (card) card.classList.remove('is-stamped');
        if (seal) seal.textContent = 'Pending';
        if (meta) meta.textContent = cfg.idleText;
      }
    }

    var progEl = document.getElementById('kfg-club-progress-pill');
    if (progEl) {
      progEl.textContent = stampedCount + '/4 Milestones Stamped';
    }

    var btnStamp = document.getElementById('btn-kfg-stamp-checkin');
    var checkedToday = (club.lastCheckInDate === todayIso);
    if (btnStamp) {
      if (checkedToday) {
        btnStamp.classList.add('is-checked-today');
        btnStamp.textContent = '✅ Today\'s Growth & Habit Stamped (Day ' + displayDay + ')';
      } else {
        btnStamp.classList.remove('is-checked-today');
        btnStamp.textContent = '🌱 Stamp Today\'s Growth & Habit Check-in';
      }
    }

    var targetDate = ms.nextRecheckDate || addDays(todayIso, 30);
    var remainDays = Math.max(0, diffDays(todayIso, targetDate));
    if (!ms.nextRecheckDate) remainDays = 30;

    var recheckEl = document.getElementById('kfg-club-next-recheck');
    if (recheckEl) {
      recheckEl.textContent = '⏰ Next Growth Re-check: D-' + remainDays + ' (' + formatReadableDate(targetDate) + ')';
    }

    var histEl = document.getElementById('kfg-club-history-summary');
    if (histEl) {
      if (ms.lastCheckInDate) {
        var snapInfo = ms.latestSnapshot ? ' · ' + ms.latestSnapshot : '';
        histEl.textContent = 'Last Check-in: ' + formatReadableDate(ms.lastCheckInDate) + snapInfo;
      } else {
        histEl.textContent = 'Last Check-in: Ready to log your child\'s baseline today';
      }
    }
  }

  window.stampKfgGrowthClubToday = function () {
    var todayIso = getLocalIsoDate();
    var club = getInitialClubState();
    var ms = getInitialMilestoneState();
    if (!ms.stamps) ms.stamps = { s1: '', s2: '', s3: '', s4: '' };
    if (!Array.isArray(ms.history)) ms.history = [];

    if (club.lastCheckInDate !== todayIso) {
      if (club.lastCheckInDate && diffDays(club.lastCheckInDate, todayIso) === 1) {
        club.streakDays = (Number(club.streakDays) || 0) + 1;
      } else if (club.lastCheckInDate && diffDays(club.lastCheckInDate, todayIso) > 1) {
        club.streakDays = (Number(club.streakDays) || 0) + 1;
      } else {
        club.streakDays = Math.max(1, Number(club.streakDays) || 1);
      }
      club.totalCheckIns = (Number(club.totalCheckIns) || 0) + 1;
      club.lastCheckInDate = todayIso;
      if (!club.partnerSince) club.partnerSince = todayIso;
    } else if (!club.streakDays) {
      club.streakDays = 1;
    }

    if (!ms.baselineDate) {
      ms.baselineDate = todayIso;
    }
    if (!ms.stamps.s1) ms.stamps.s1 = todayIso;
    if (!ms.stamps.s2) ms.stamps.s2 = todayIso;

    var daysSinceBaseline = diffDays(ms.baselineDate, todayIso);
    if (daysSinceBaseline >= 25 || club.totalCheckIns >= 2) {
      if (!ms.stamps.s3) ms.stamps.s3 = todayIso;
    }
    if (daysSinceBaseline >= 80 || club.totalCheckIns >= 4) {
      if (!ms.stamps.s4) ms.stamps.s4 = todayIso;
    }

    var snapshot = captureChildSnapshot();
    ms.lastCheckInDate = todayIso;
    ms.nextRecheckDate = addDays(todayIso, 30);
    ms.latestSnapshot = snapshot;

    if (!ms.history.length || ms.history[0].date !== todayIso) {
      ms.history.unshift({
        date: todayIso,
        snapshot: snapshot
      });
      ms.history = ms.history.slice(0, 24);
    } else {
      ms.history[0].snapshot = snapshot;
    }

    writeJson(CLUB_KEY, club);
    writeJson(MILESTONE_KEY, ms);
    renderParentGrowthClub();

    try {
      if (typeof window.fetch === 'function') {
        window.fetch('https://abacus.jasoncameron.dev/hit/kfg_kisfitglobal/milestone_stamp_' + todayIso, {
          mode: 'cors',
          keepalive: true
        })
          .then(function (r) { return r && r.ok ? r.json() : null; })
          .then(function (data) {
            if (data && typeof data.value === 'number') {
              var liveEl = document.getElementById('kfg-club-live-counter');
              if (liveEl) {
                liveEl.style.display = 'inline';
                liveEl.textContent = ' · ' + Math.max(1, data.value).toLocaleString('en-US') + ' US parent check-ins today';
              }
            }
          })
          .catch(function () {});
      }
    } catch (_e) {}
  };

  window.downloadKfgD30CalendarIcs = function () {
    var todayIso = getLocalIsoDate();
    var ms = getInitialMilestoneState();
    var targetIso = (ms && ms.nextRecheckDate) ? ms.nextRecheckDate : addDays(todayIso, 30);
    var p = targetIso.split('-');
    var y = p[0];
    var m = p[1];
    var d = p[2];

    var dtStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    var dtStart = y + m + d + 'T090000';
    var dtEnd = y + m + d + 'T091500';
    var snapshotNote = (ms && ms.latestSnapshot) ? ('Last logged baseline: ' + ms.latestSnapshot + '\\n') : '';

    var icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//KISFIT Bio Labs//Parent Growth Club//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:kfg-d30-' + y + m + d + '@kisfitglobal.com',
      'DTSTAMP:' + dtStamp,
      'DTSTART:' + dtStart,
      'DTEND:' + dtEnd,
      'SUMMARY:KISFIT Monthly Child Height & Sleep Check-in — https://kisfitglobal.com',
      'DESCRIPTION:' + snapshotNote + '1) Measure barefoot morning height against a flat wall.\\n2) Review 9 PM deep-sleep & daily D3 + Calcium routine.\\n3) Stamp your Day-30 US CDC milestone at https://kisfitglobal.com',
      'URL:https://kisfitglobal.com',
      'LOCATION:https://kisfitglobal.com',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:KISFIT Monthly Child Height & Sleep Check-in Reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    var blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'kisfit-d30-growth-check-' + targetIso + '.ics';
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (_e) {}
    }, 250);

    var feedbackEl = document.getElementById('kfg-club-ics-feedback');
    if (feedbackEl) {
      feedbackEl.style.display = 'block';
      feedbackEl.textContent = '📅 Calendar event saved for ' + formatReadableDate(targetIso) + ' (9:00 AM local time). Open the .ics file to add to Apple, Google, or Outlook Calendar.';
    }
  };

  var SINGLE_REPORT_LS_URL = 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599?embed=1&locale=en';
  var SIX_MONTH_PASS_LS_URL = 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895?embed=1&locale=en';

  window.triggerKfgVelocityEdgeCheckout = function (plan) {
    var mode = (plan === 'pass') ? 'pass' : 'single';
    if (typeof window.launchLemonSqueezyCheckout === 'function') {
      window.launchLemonSqueezyCheckout(mode);
      return;
    }
    if (typeof window.openKidsFitGlobalCheckoutModal === 'function') {
      window.openKidsFitGlobalCheckoutModal(mode);
      return;
    }
    window.open(mode === 'pass' ? SIX_MONTH_PASS_LS_URL : SINGLE_REPORT_LS_URL, '_blank', 'noopener');
  };

  function syncResultsVelocityEdgeBridge() {
    var ctxEl = document.getElementById('kfg-results-edge-child-context');
    if (!ctxEl) return;
    var snap = captureChildSnapshot();
    if (snap) {
      ctxEl.textContent = 'Current Baseline: ' + snap + ' · US CDC LMS & Khamis-Roche Velocity Window Active';
    }
  }

  function initClubAndVelocityEdge() {
    renderParentGrowthClub();
    syncResultsVelocityEdgeBridge();
    var resDash = document.getElementById('results-dashboard');
    if (resDash && typeof MutationObserver === 'function') {
      var obs = new MutationObserver(function () {
        if (!resDash.classList.contains('hidden') && resDash.style.display !== 'none') {
          syncResultsVelocityEdgeBridge();
        }
      });
      obs.observe(resDash, { attributes: true, attributeFilter: ['class', 'style'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClubAndVelocityEdge);
  } else {
    initClubAndVelocityEdge();
  }
})();
