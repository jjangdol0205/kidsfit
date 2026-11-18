/**
 * src/js/qna-human-rl-curator.js
 * 키즈핏 소아성장 아틀리에 (kidsfit.co.kr) — 에세이·칼럼 리더 유틸리티 및 무비밀번호 이메일 구독 연동
 *
 * - 제휴 상품 배너·쇼핑 슬롯 0건 (순수 북리딩 아틀리에 모드)
 * - 방문자 통계(Abacus pv/uv) 및 원고 끝 이메일 구독(DreamCompanyCRM.registerMember) 지원
 */
(function (global) {
  'use strict';

  function initKidsfitQnaBeacon() {
    try {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
      var ua = navigator.userAgent || '';
      if (navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|gtmetrix|pingdom|uptimerobot|python|curl|node|axios|jsdom/i.test(ua)) return;
      var host = (typeof location !== 'undefined' && location.hostname) ? location.hostname : '';
      if (!host || host === 'localhost' || host === '127.0.0.1') return;
      var kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
      var ns = 'kfk_kidsfitkr';
      if (!window.__HQ_BEACON_SENT_kfk_kidsfitkr__) {
        window.__HQ_BEACON_SENT_kfk_kidsfitkr__ = true;
        fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/pv_' + kst, { mode: 'cors', keepalive: true }).catch(function () {});
        fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/pv_total', { mode: 'cors', keepalive: true }).catch(function () {});
        if (localStorage.getItem('hq_uv_' + ns + '_' + kst) !== '1') {
          localStorage.setItem('hq_uv_' + ns + '_' + kst, '1');
          fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/uv_' + kst, { mode: 'cors', keepalive: true }).catch(function () {});
        }
        if (localStorage.getItem('hq_uv_ever_' + ns) !== '1') {
          localStorage.setItem('hq_uv_ever_' + ns, '1');
          fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/uv_total', { mode: 'cors', keepalive: true }).catch(function () {});
        }
      }
    } catch (_) {}
  }

  function submitEmailHelper(emailInputId, hpInputId, btnId, feedbackId, segmentName) {
    var emailEl = document.getElementById(emailInputId);
    var hpEl = hpInputId ? document.getElementById(hpInputId) : null;
    var btnEl = btnId ? document.getElementById(btnId) : null;
    var fbEl = feedbackId ? document.getElementById(feedbackId) : null;

    var email = emailEl ? String(emailEl.value || '').trim().toLowerCase() : '';
    var hp = hpEl ? String(hpEl.value || '').trim() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (fbEl) {
        fbEl.style.display = 'block';
        fbEl.style.color = '#9B3B32';
        fbEl.textContent = '이메일 주소를 정확히 입력해 주세요.';
      }
      if (emailEl) emailEl.focus();
      return false;
    }

    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = '등록 중...';
    }

    var onDone = function () {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = '구독 완료';
      }
      if (fbEl) {
        fbEl.style.display = 'block';
        fbEl.style.color = '#2F5241';
        fbEl.textContent = email + ' 주소로 다음 성장 연구소 노트를 조용히 보내드리겠습니다.';
      }
    };

    if (global.DreamCompanyCRM && typeof global.DreamCompanyCRM.registerMember === 'function') {
      global.DreamCompanyCRM.registerMember({
        div: 'KFK',
        email: email,
        segment: segmentName || 'substack_essay_reader_kr',
        notes: (global.location && global.location.pathname) ? global.location.pathname : 'qna',
        lang: 'ko',
        website_hp: hp
      }).then(onDone).catch(onDone);
    } else {
      onDone();
    }
    return false;
  }

  global.submitKfkSubstackSubscribe = function (ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    return submitEmailHelper('kfk-substack-email', 'kfk-substack-hp', 'btn-kfk-substack-submit', 'kfk-substack-feedback', 'substack_essay_reader_kr');
  };

  global.submitKfkQnaHubSignup = function (ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    return submitEmailHelper('kfk-qna-hub-email', 'kfk-qna-hub-hp', 'btn-kfk-qna-hub-submit', 'kfk-qna-hub-feedback', 'kfk_qna_atelier_reader');
  };

  global.copyKfkSubstackLink = function (btnEl) {
    var url = (global.location && global.location.href) ? global.location.href : 'https://kidsfit.co.kr/';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          if (btnEl) {
            var orig = btnEl.textContent;
            btnEl.textContent = '복사됨';
            setTimeout(function () { btnEl.textContent = orig; }, 1600);
          }
        });
      }
    } catch (_) {}
  };

  global.shareKfkSubstackEssay = function (btnEl) {
    var url = (global.location && global.location.href) ? global.location.href : 'https://kidsfit.co.kr/';
    var title = (typeof document !== 'undefined' && document.title) ? document.title : '키즈핏 소아성장 아틀리에 노트';
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: title, url: url }).catch(function () {});
    } else {
      global.copyKfkSubstackLink(btnEl);
    }
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initKidsfitQnaBeacon);
    } else {
      initKidsfitQnaBeacon();
    }
  }
})(typeof window !== 'undefined' ? window : this);
