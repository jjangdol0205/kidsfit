/**
 * src/js/parent-habit-notebook.js
 * 키즈핏 학부모 성장 응원 수첩 (#kfk-parent-habit-notebook)
 * 로그인 없이 1클릭으로 기록하는 오늘의 키 성장 3대 습관 스탬프 & 연속 실천 응원 루프
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'kfk_habit_notebook_v1';
  var HABIT_KEYS = ['sleep', 'nutrition', 'jump'];

  var WARM_DAILY_NOTES = [
    '오늘도 아이 키 성장을 위해 애쓰시는 부모님, 오늘 저녁 작은 습관 하나가 내년 봄 쑥 자란 키로 보답합니다 💚',
    '바쁜 하루 속에서도 아이 식탁과 잠자리를 챙기시는 부모님, 이미 우리 아이 최고의 성장 동반자이십니다 🌱',
    '어제보다 10분 일찍 조명을 낮춰 준 오늘 밤이 아이 성장판에는 가장 따뜻한 선물입니다 🌙',
    '또래와 조급하게 비교하지 않아도 괜찮아요. 매일 쌓이는 작은 루틴이 아이만의 건강한 성장 곡선을 만듭니다 ✨',
    '저녁 식사 후 아이와 눈 맞추며 가볍게 제자리 점프 5분! 웃음소리와 함께 성장호르몬도 활짝 깨어납니다 🏃',
    '편식하는 날이 있어도 괜찮습니다. 조급함 대신 다정한 격려 한마디가 아이의 소화 흡수력과 숙면을 돕습니다 🥛',
    '오늘 찍은 작은 실천 도장 하나가 1년 뒤 우리 아이의 당당한 어깨와 숨은 키를 든든하게 지켜줍니다 🏅'
  ];

  var liveCounts = { sleep: 0, nutrition: 0, jump: 0 };

  function getKstDateString() {
    return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  }

  function diffDaysIso(fromIso, toIso) {
    var a = String(fromIso || '').split('-');
    var b = String(toIso || '').split('-');
    if (a.length !== 3 || b.length !== 3) return 0;
    var t1 = Date.UTC(Number(a[0]), Number(a[1]) - 1, Number(a[2]));
    var t2 = Date.UTC(Number(b[0]), Number(b[1]) - 1, Number(b[2]));
    return Math.round((t2 - t1) / 86400000);
  }

  function pickDailyWarmNote(dateStr) {
    var seed = 0;
    var s = String(dateStr || '');
    for (var i = 0; i < s.length; i++) {
      seed = ((seed * 33) + s.charCodeAt(i)) >>> 0;
    }
    return WARM_DAILY_NOTES[seed % WARM_DAILY_NOTES.length];
  }

  function loadNotebookState() {
    try {
      var raw = window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (!parsed.days || typeof parsed.days !== 'object') parsed.days = {};
          return parsed;
        }
      }
    } catch (_e) {}
    return {
      streakDays: 0,
      lastActiveDate: '',
      days: {}
    };
  }

  function saveNotebookState(state) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (_e) {}
  }

  function getTodayRecord(state, todayStr) {
    if (!state.days[todayStr]) {
      state.days[todayStr] = {
        sleep: false,
        nutrition: false,
        jump: false,
        hitSent: {}
      };
    }
    if (!state.days[todayStr].hitSent) {
      state.days[todayStr].hitSent = {};
    }
    return state.days[todayStr];
  }

  function computeDisplayParticipationCount(todayRec) {
    var remoteMax = Math.max(
      Number(liveCounts.sleep) || 0,
      Number(liveCounts.nutrition) || 0,
      Number(liveCounts.jump) || 0
    );
    var remoteSum = (Number(liveCounts.sleep) || 0) + (Number(liveCounts.nutrition) || 0) + (Number(liveCounts.jump) || 0);
    var localActive = (todayRec && (todayRec.sleep || todayRec.nutrition || todayRec.jump)) ? 1 : 0;
    var estimatedParents = remoteMax > 0 ? Math.max(remoteMax, Math.ceil(remoteSum / 2)) : 0;
    return Math.max(estimatedParents, localActive);
  }

  function renderLiveCountText(todayRec) {
    var countEl = document.getElementById('kfk-notebook-live-count');
    if (!countEl) return;
    var n = computeDisplayParticipationCount(todayRec);
    if (n > 0) {
      countEl.textContent = '오늘 ' + n.toLocaleString('ko-KR') + '명의 학부모님이 함께 실천 중';
    } else {
      countEl.textContent = '오늘 첫 번째 성장 습관 스탬프를 찍어보세요 🌱';
    }
  }

  function renderHabitNotebook() {
    var root = document.getElementById('kfk-parent-habit-notebook');
    if (!root) return;

    var todayStr = getKstDateString();
    var noteEl = document.getElementById('kfk-notebook-daily-note');
    if (noteEl) {
      noteEl.textContent = '💌 에디터 응원 한마디: "' + pickDailyWarmNote(todayStr) + '"';
    }

    var state = loadNotebookState();
    var todayRec = getTodayRecord(state, todayStr);

    var completedCount = 0;
    for (var i = 0; i < HABIT_KEYS.length; i++) {
      var hKey = HABIT_KEYS[i];
      var stamped = Boolean(todayRec[hKey]);
      if (stamped) completedCount++;

      var btn = document.getElementById('btn-kfk-stamp-' + hKey);
      var checkBadge = document.getElementById('kfk-stamp-check-' + hKey);
      if (btn) {
        btn.classList.toggle('is-stamped', stamped);
        btn.setAttribute('aria-pressed', stamped ? 'true' : 'false');
      }
      if (checkBadge) {
        checkBadge.textContent = stamped ? '✓ 완료' : '스탬프';
      }
    }

    var streakDisplay = Math.max(1, Number(state.streakDays) || 1);
    var badgeEl = document.getElementById('kfk-notebook-streak-badge');
    if (badgeEl) {
      badgeEl.textContent = '🏅 연속 실천 ' + streakDisplay + '일째 · 키즈핏 성장 응원 가족';
    }

    var progTextEl = document.getElementById('kfk-notebook-progress-text');
    if (progTextEl) {
      progTextEl.textContent = '오늘의 3대 습관 달성 ' + completedCount + '/3';
    }

    var progFillEl = document.getElementById('kfk-notebook-progress-fill');
    if (progFillEl) {
      progFillEl.style.width = Math.round((completedCount / 3) * 100) + '%';
    }

    var celebEl = document.getElementById('kfk-notebook-celebration-banner');
    if (celebEl) {
      celebEl.style.display = (completedCount === 3) ? 'block' : 'none';
    }

    renderLiveCountText(todayRec);
  }

  function fetchInitialLiveCounts() {
    if (typeof window.fetch !== 'function') return;
    var todayStr = getKstDateString();
    HABIT_KEYS.forEach(function (habit) {
      window.fetch('https://abacus.jasoncameron.dev/get/kfk_kidsfit/stamp_' + habit + '_' + todayStr, {
        mode: 'cors'
      })
        .then(function (r) { return r && r.ok ? r.json() : null; })
        .then(function (data) {
          if (data && typeof data.value === 'number' && data.value >= 0) {
            liveCounts[habit] = Math.max(liveCounts[habit] || 0, data.value);
            var st = loadNotebookState();
            renderLiveCountText(getTodayRecord(st, todayStr));
          }
        })
        .catch(function () {});
    });
  }

  window.toggleKfkHabitStamp = function (habit) {
    if (HABIT_KEYS.indexOf(habit) === -1) return;
    var todayStr = getKstDateString();
    var state = loadNotebookState();
    var todayRec = getTodayRecord(state, todayStr);

    var nextVal = !todayRec[habit];
    todayRec[habit] = nextVal;

    var anyStampedToday = Boolean(todayRec.sleep || todayRec.nutrition || todayRec.jump);
    if (anyStampedToday && state.lastActiveDate !== todayStr) {
      if (state.lastActiveDate && diffDaysIso(state.lastActiveDate, todayStr) === 1) {
        state.streakDays = (Number(state.streakDays) || 0) + 1;
      } else if (!state.streakDays) {
        state.streakDays = 1;
      } else if (diffDaysIso(state.lastActiveDate, todayStr) > 1) {
        state.streakDays = 1;
      }
      state.lastActiveDate = todayStr;
    }

    var shouldSendHit = nextVal && !todayRec.hitSent[habit];
    if (shouldSendHit) {
      todayRec.hitSent[habit] = true;
      liveCounts[habit] = Math.max(1, (Number(liveCounts[habit]) || 0) + 1);
    }

    var allDates = Object.keys(state.days).sort();
    if (allDates.length > 45) {
      for (var i = 0; i < allDates.length - 45; i++) {
        delete state.days[allDates[i]];
      }
    }

    saveNotebookState(state);
    renderHabitNotebook();

    if (shouldSendHit && typeof window.fetch === 'function') {
      window.fetch('https://abacus.jasoncameron.dev/hit/kfk_kidsfit/stamp_' + habit + '_' + todayStr, {
        mode: 'cors',
        keepalive: true
      })
        .then(function (r) { return r && r.ok ? r.json() : null; })
        .then(function (data) {
          if (data && typeof data.value === 'number' && data.value >= 1) {
            liveCounts[habit] = data.value;
            var latestState = loadNotebookState();
            renderLiveCountText(getTodayRecord(latestState, todayStr));
          }
        })
        .catch(function () {});
    }
  };

  window.jumpToKfkPeerEditorialCuration = function (concernKey) {
    var valid = (concernKey === 'sleep' || concernKey === 'nutrition' || concernKey === 'posture' || concernKey === 'exercise')
      ? concernKey
      : 'nutrition';
    try {
      if (document.body) {
        document.body.classList.remove('studio-mode-active', 'diagnosis-lounge-active');
      }
      var heroSec = document.getElementById('hero-section');
      if (heroSec) {
        heroSec.classList.remove('hidden');
        heroSec.style.display = '';
      }
      if (typeof window.selectKfkConcernTab === 'function') {
        window.selectKfkConcernTab(valid);
      }
      var hub = document.getElementById('kfk-concern-rx-hub');
      if (hub && typeof hub.scrollIntoView === 'function') {
        setTimeout(function () {
          hub.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 40);
      }
    } catch (_e) {}
  };

  var KFK_SEGMENTS = {
    kr_early_elementary: '유아·초등 저학년 (기초 성장습관기)',
    kr_upper_golden_time: '초등 고학년 (사춘기 전 급성장 골든타임)',
    kr_teen_closing_care: '중·고등학생 (성장판 마무리·자세 집중기)'
  };
  var activeKfkSegment = 'kr_upper_golden_time';

  function escKfkHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  window.selectKfkClubSegment = function (segKey) {
    if (!KFK_SEGMENTS[segKey]) return;
    activeKfkSegment = segKey;
    try {
      if (window.localStorage) {
        window.localStorage.setItem('kfk_club_segment_v1', segKey);
      }
    } catch (_e) {}
    var btns = document.querySelectorAll('[data-kfk-club-seg]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var isAct = b.getAttribute('data-kfk-club-seg') === segKey;
      b.classList.toggle('is-active', isAct);
      b.setAttribute('aria-pressed', isAct ? 'true' : 'false');
    }
  };

  window.submitKfkPasswordlessClub = function (ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    var emailEl = document.getElementById('kfk-pwless-email');
    var nickEl = document.getElementById('kfk-pwless-nickname');
    var hpEl = document.getElementById('kfk-pwless-hp');
    var fbEl = document.getElementById('kfk-pwless-feedback');
    var btnEl = document.getElementById('btn-kfk-pwless-submit');

    var email = emailEl ? String(emailEl.value || '').trim().toLowerCase() : '';
    var nickname = nickEl ? String(nickEl.value || '').trim() : '';
    var websiteHp = hpEl ? String(hpEl.value || '').trim() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (fbEl) {
        fbEl.style.display = 'block';
        fbEl.className = 'kfk-pwless-feedback is-error';
        fbEl.textContent = '이메일 주소를 정확히 입력해 주세요 (예: mom@naver.com)';
      }
      if (emailEl) emailEl.focus();
      return false;
    }

    var segLabel = KFK_SEGMENTS[activeKfkSegment] || KFK_SEGMENTS.kr_upper_golden_time;
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = '3초 정회원 등록 중...';
    }

    var onDone = function () {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = '💌 3초 무료 정회원 등록하기 →';
      }
      if (fbEl) {
        fbEl.style.display = 'block';
        fbEl.className = 'kfk-pwless-feedback is-success';
        fbEl.innerHTML =
          '✅ <strong>키즈핏 성장 골든타임 정회원 등록 완료!</strong> (' + escKfkHtml(email) + ' · ' + escKfkHtml(segLabel) + ')<br>' +
          '아이 성장 단계에 맞춘 숙면(서파수면)·영양·바른자세 에디터 편지를 보내드립니다. ' +
          '<a href="#kfk-bone-age-interpreter" style="color:#047857;font-weight:900;text-decoration:underline;">🦴 병원 뼈나이 1분 무료 해석기 바로가기 →</a>';
      }
    };

    if (window.DreamCompanyCRM && typeof window.DreamCompanyCRM.registerMember === 'function') {
      window.DreamCompanyCRM.registerMember({
        div: 'KFK',
        email: email,
        nickname: nickname,
        segment: activeKfkSegment,
        lang: 'ko-KR',
        website_hp: websiteHp
      }).then(onDone).catch(onDone);
    } else {
      try {
        if (window.localStorage) {
          window.localStorage.setItem('dc_member_KFK', JSON.stringify({
            div: 'KFK',
            email: email,
            nickname: nickname,
            segment: activeKfkSegment,
            joined_at: new Date().toISOString()
          }));
        }
      } catch (_e) {}
      onDone();
    }
    return false;
  };

  function hydrateKfkPasswordlessClub() {
    try {
      var savedSeg = window.localStorage ? window.localStorage.getItem('kfk_club_segment_v1') : '';
      if (savedSeg && KFK_SEGMENTS[savedSeg]) {
        window.selectKfkClubSegment(savedSeg);
      } else {
        window.selectKfkClubSegment('kr_upper_golden_time');
      }

      var savedMember = (window.DreamCompanyCRM && window.DreamCompanyCRM.getLocalMember('KFK')) || null;
      if (!savedMember && window.localStorage) {
        var raw = window.localStorage.getItem('dc_member_KFK');
        if (raw) savedMember = JSON.parse(raw);
      }
      if (savedMember && savedMember.email) {
        var emailEl = document.getElementById('kfk-pwless-email');
        var nickEl = document.getElementById('kfk-pwless-nickname');
        var fbEl = document.getElementById('kfk-pwless-feedback');
        if (emailEl && !emailEl.value) emailEl.value = savedMember.email;
        if (nickEl && savedMember.nickname && !nickEl.value) nickEl.value = savedMember.nickname;
        if (savedMember.segment && KFK_SEGMENTS[savedMember.segment]) {
          window.selectKfkClubSegment(savedMember.segment);
        }
        if (fbEl) {
          fbEl.style.display = 'block';
          fbEl.className = 'kfk-pwless-feedback is-success';
          fbEl.innerHTML = '💚 <strong>정회원 구독 중:</strong> ' + escKfkHtml(savedMember.email) + ' · 맞춤 단계: ' + escKfkHtml(KFK_SEGMENTS[savedMember.segment] || KFK_SEGMENTS.kr_upper_golden_time);
        }
      }
    } catch (_e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderHabitNotebook();
      fetchInitialLiveCounts();
      hydrateKfkPasswordlessClub();
    });
  } else {
    renderHabitNotebook();
    fetchInitialLiveCounts();
    hydrateKfkPasswordlessClub();
  }
})();
