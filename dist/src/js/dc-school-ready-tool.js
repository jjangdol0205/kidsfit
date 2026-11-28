(function () {
  'use strict';

  function buildCleanShareUrl(rawUrl, extraParams) {
    var base = String(rawUrl || (window.location.origin + window.location.pathname));
    var u = new URL(base);
    ['internal_check', 'owner_device', 'internal_test', 'smoke_test', 'nocache'].forEach(function (k) {
      u.searchParams.delete(k);
    });
    if (extraParams && typeof extraParams === 'object') {
      Object.keys(extraParams).forEach(function (k) {
        if (extraParams[k] !== undefined && extraParams[k] !== null && extraParams[k] !== '') {
          u.searchParams.set(k, String(extraParams[k]));
        }
      });
    }
    var vid = '';
    try {
      if (window.DreamCompanyCRM && typeof window.DreamCompanyCRM.getOrCreateVisitorProfile === 'function') {
        vid = window.DreamCompanyCRM.getOrCreateVisitorProfile().visitor_id || '';
      } else {
        vid = localStorage.getItem('dc_visitor_id') || '';
        if (!vid) {
          vid = 'v_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
          localStorage.setItem('dc_visitor_id', vid);
        }
      }
    } catch (_) {}
    if (vid) u.searchParams.set('ref', vid);
    if (!u.searchParams.get('utm_source')) u.searchParams.set('utm_source', 'referral');
    if (!u.searchParams.get('utm_medium')) u.searchParams.set('utm_medium', 'share');
    return u.toString();
  }
  window.__dcBuildCleanShareUrl = buildCleanShareUrl;

  function triggerOneTouchShare(div, title, text, shareUrl, toastEl, copiedMsg) {
    var cleanUrl = buildCleanShareUrl(shareUrl);
    if (window.DreamCompanyCRM && typeof window.DreamCompanyCRM.trackFunnelEvent === 'function') {
      window.DreamCompanyCRM.trackFunnelEvent(div, 'share_click', { event_meta: 'seasonal_share_card' });
    }
    function showToast(msg) {
      if (!toastEl) return;
      toastEl.textContent = msg;
      toastEl.style.display = 'block';
    }
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: cleanUrl }).then(function () {
        showToast(copiedMsg);
      }).catch(function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(cleanUrl).then(function () { showToast(copiedMsg); }).catch(function () { showToast(cleanUrl); });
        } else {
          showToast(cleanUrl);
        }
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanUrl).then(function () { showToast(copiedMsg); }).catch(function () { showToast(cleanUrl); });
    } else {
      showToast(cleanUrl);
    }
    return cleanUrl;
  }

  // 질병관리청(KDCA 2017) 만 6~7세(72~95개월) 평균키(cm) & 표준편차 근사
  var KDCA_REF = {
    M: { 60:[110.0,4.5], 66:[113.2,4.7], 72:[116.4,4.9], 78:[119.5,5.1], 84:[122.5,5.3], 90:[125.4,5.5], 96:[128.3,5.7] },
    F: { 60:[108.9,4.5], 66:[112.1,4.7], 72:[115.2,4.9], 78:[118.2,5.1], 84:[121.2,5.3], 90:[124.2,5.5], 96:[127.1,5.7] }
  };

  var CHECKUPS = [
    { n: '1차 (생후 14~35일)', lo: 0, hi: 1 },
    { n: '2차 (생후 4~6개월)', lo: 4, hi: 6 },
    { n: '3차 (생후 9~12개월)', lo: 9, hi: 12 },
    { n: '4차 (생후 18~24개월)', lo: 18, hi: 24 },
    { n: '5차 (생후 30~36개월)', lo: 30, hi: 36 },
    { n: '6차 (생후 42~48개월)', lo: 42, hi: 48 },
    { n: '7차 (생후 54~60개월)', lo: 54, hi: 60 },
    { n: '8차 (생후 66~71개월 · 초등 입학 전 마지막 검진)', lo: 66, hi: 71 }
  ];

  function interpRef(sex, months) {
    var tbl = KDCA_REF[sex === 'F' ? 'F' : 'M'];
    var keys = [60, 66, 72, 78, 84, 90, 96];
    if (months <= 60) return tbl[60];
    if (months >= 96) return tbl[96];
    for (var i = 0; i < keys.length - 1; i++) {
      var a = keys[i], b = keys[i + 1];
      if (months >= a && months <= b) {
        var r = (months - a) / (b - a);
        return [tbl[a][0] + (tbl[b][0] - tbl[a][0]) * r, tbl[a][1] + (tbl[b][1] - tbl[a][1]) * r];
      }
    }
    return tbl[78];
  }

  function normCdf(z) {
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var d = 0.3989423 * Math.exp(-z * z / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? (1 - p) : p;
  }

  function calc() {
    var sex = document.getElementById('kfkSex').value;
    var dobStr = document.getElementById('kfkDob').value || '2020-05-15';
    var cm = Math.max(90, Math.min(160, parseFloat(document.getElementById('kfkHeight').value) || 119.5));

    var dob = new Date(dobStr + 'T00:00:00');
    var today = new Date();
    var months = Math.max(1, (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth()));
    if (today.getDate() < dob.getDate()) months = Math.max(1, months - 1);

    var ref = interpRef(sex, months);
    var z = (cm - ref[0]) / ref[1];
    var pct = Math.max(1, Math.min(99, Math.round(normCdf(z) * 100)));

    var stageTxt = '8차 영유아검진 완료 구간 (만 6세 이후 초등 학생건강검진 연계)';
    for (var i = 0; i < CHECKUPS.length; i++) {
      var c = CHECKUPS[i];
      if (months >= c.lo && months <= c.hi) {
        stageTxt = '현재 수검 대상: ' + c.n;
        break;
      } else if (months < c.lo) {
        stageTxt = '다음 예정: ' + c.n + ' (' + (c.lo - months) + '개월 후)';
        break;
      }
    }

    var habitPts = 0;
    ['kfkH1', 'kfkH2', 'kfkH3', 'kfkH4'].forEach(function (id) {
      if (document.getElementById(id).checked) habitPts += 25;
    });

    document.getElementById('kfkOutAge').textContent = '만 ' + Math.floor(months / 12) + '세 ' + (months % 12) + '개월 (' + months + '개월)';
    document.getElementById('kfkOutPct').textContent = '상위 ' + (100 - pct) + '% (백분위 ' + pct + '%)';
    document.getElementById('kfkOutAvg').textContent = ref[0].toFixed(1) + ' cm (KDCA 50%)';
    document.getElementById('kfkOutCheckup').textContent = stageTxt;
    document.getElementById('kfkOutHabit').textContent = habitPts + ' / 100점';
  }

  document.addEventListener('DOMContentLoaded', function () {
    ['kfkSex', 'kfkDob', 'kfkHeight', 'kfkH1', 'kfkH2', 'kfkH3', 'kfkH4'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', calc);
        el.addEventListener('change', calc);
      }
    });
    var btn = document.getElementById('btnKfkSeasonalShare');
    if (btn) {
      btn.addEventListener('click', function () {
        var pctTxt = (document.getElementById('kfkOutPct') || {}).textContent || '';
        triggerOneTouchShare(
          'KFK',
          '2027 예비 초1 (2020년생) 평균키 & 영유아검진 차수 계산기 | 키즈핏',
          '우리 아이 입학 전 키 점검 결과(' + pctTxt + ') — 아빠·엄마 함께 확인해 보세요:',
          'https://kidsfit.co.kr/tools/school-ready-growth',
          document.getElementById('kfkSeasonalShareToast'),
          '예상키 점검 카드 링크가 복사되었습니다! 배우자·가족 카톡에 붙여넣어 보내세요.'
        );
      });
    }
    calc();
  });
})();
