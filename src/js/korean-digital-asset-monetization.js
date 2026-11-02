/**
 * src/js/korean-digital-asset-monetization.js
 * Korean Free A4 Printable Workbook & Affiliate Select-Shop Unlock Helper (kidsfit.co.kr)
 * - 100% Free of Lemon Squeezy or paid checkout modals.
 * - Linked directly with KidsFit Select-Shop (Coupang Partners / iHerb / LinkPrice) unlock state.
 */
(function (global) {
  'use strict';

  var UNLOCK_KEY = 'kidsfit_kr_digital_asset_unlocked_v1';

  function isJsdomEnv() {
    return typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
  }

  function getActiveProfile() {
    try {
      if (typeof window !== 'undefined') {
        if (window.KidsFitApp && window.KidsFitApp.state && window.KidsFitApp.state.profile) {
          return window.KidsFitApp.state.profile;
        }
        if (window.growthTrackerInstance && window.growthTrackerInstance.currentProfile) {
          return window.growthTrackerInstance.currentProfile;
        }
      }
    } catch (_) {}
    return { ageYears: 10, ageMonths: 120, gender: 'boy', currentHeight: 137.0, currentWeight: 35.5, fatherHeight: 174.0, motherHeight: 161.0 };
  }

  function isDigitalAssetUnlocked() {
    try {
      if (typeof window !== 'undefined' && typeof window.isKidsFitDiagnosticUnlocked === 'function') {
        if (window.isKidsFitDiagnosticUnlocked()) return true;
      }
      if (typeof window !== 'undefined' && window.location) {
        var qs = String(window.location.search || '').toLowerCase();
        if (qs.indexOf('unlocked=1') !== -1 || qs.indexOf('vip=2026') !== -1) {
          if (window.localStorage) window.localStorage.setItem(UNLOCK_KEY, 'true');
          return true;
        }
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        if (window.localStorage.getItem(UNLOCK_KEY) === 'true') return true;
        if (window.localStorage.getItem('kidsfit_diagnostic_full_unlock_v1') === 'true') return true;
      }
    } catch (_) {}
    return false;
  }

  function unlockDigitalAssetsNow(reason) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(UNLOCK_KEY, 'true');
        window.localStorage.setItem('kidsfit_diagnostic_full_unlock_v1', 'true');
      }
      if (typeof window !== 'undefined' && typeof window.unlockKidsFitDiagnosticTests === 'function') {
        window.unlockKidsFitDiagnosticTests(reason || 'WorkbookUnlock');
      }
    } catch (_) {}
  }

  function openKoreanDigitalAssetModal() {
    try {
      if (typeof document === 'undefined') return;
      var loungeModal = document.getElementById('kf-lounge-locked-modal');
      if (loungeModal) {
        loungeModal.style.display = 'flex';
        return;
      }
      var gate = document.getElementById('kidsfit-report-unlock-gate') || document.getElementById('kf-parenting-shopping-mall');
      if (gate && typeof gate.scrollIntoView === 'function') {
        gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
      }
    } catch (_) {}
  }

  function injectReportDigitalAssetBanner() {
    // No-op on kidsfit.co.kr: Korean edition uses only the affiliate select-shop unlock gate.
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
    var focusMin = Math.min(45, Math.max(10, Math.round(ageM * 0.2)));

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
            '<div style="font-size:9.5pt;font-weight:800;color:#1D4ED8;">KIDS-FIT VIP DIGITAL ASSET WORKBOOK #1~#4 · 1:1 BESPOKE EDITION</div>' +
            '<h2 style="font-size:16pt;font-weight:900;margin:4px 0 0 0;">만 ' + ageY + '세(' + ageM + '개월·' + genderKo + ') 1:1 맞춤 90일 키성장·백지복습·문장제 실전 코칭북</h2>' +
          '</div>' +
          '<div style="font-size:8.5pt;color:#475569;text-align:right;">현재 ' + curH + 'cm / ' + curW + 'kg · 목표 잠재키 ' + optH + 'cm</div>' +
        '</div>' +
        '<div style="margin-bottom:14px;padding:10px 12px;border:1.5px solid #93C5FD;border-radius:10px;background:#EFF6FF;font-size:9.5pt;">' +
          '<strong>[1:1 맞춤 정량 처방 요약]</strong> 일일 권장 원소 칼슘 <strong>' + caMg + 'mg</strong> · 마그네슘 <strong>' + mgMg + 'mg</strong> · 비타민D3 <strong>1,500~2,000 IU</strong> · 골기질 단백질 <strong>' + protG + 'g/일</strong> · 전두엽 1블록 집중 권장 <strong>' + focusMin + '분</strong>' +
        '</div>' +
        '<h3 style="font-size:11pt;font-weight:900;color:#0F172A;margin:0 0 6px;">[워크북 ①] 문장제 수학·비문학 독해 10초 3칸 조건 도식화 훈련 노트</h3>' +
        '<table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:14px;">' +
          '<thead><tr style="background:#F1F5F9;"><th style="border:1px solid #CBD5E1;padding:7px;width:25%;">단계</th><th style="border:1px solid #CBD5E1;padding:7px;">아이 직접 작성란 (암산 금지 · 여백에 먼저 그리기)</th></tr></thead>' +
          '<tbody>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:8px;font-weight:800;">1. 구하는 것 밑줄(—)</td><td style="border:1px solid #CBD5E1;padding:8px;height:34px;">문제 마지막 질문 요약: ________________________________________________</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:8px;font-weight:800;">2. 조건 수직선·막대그림</td><td style="border:1px solid #CBD5E1;padding:8px;height:48px;">[주어진 조건 A: ____________ ] + [주어진 조건 B: ____________ ] = [전체: ____________ ]</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:8px;font-weight:800;">3. 식 세우기 &amp; 1분 설명</td><td style="border:1px solid #CBD5E1;padding:8px;height:34px;">풀이 식: ___________________________________ / 정답 및 단위: [ ______________ ]</td></tr>' +
          '</tbody>' +
        '</table>' +
        '<h3 style="font-size:11pt;font-weight:900;color:#0F172A;margin:0 0 6px;">[워크북 ②] 파인만 3분 백지복습 + 밤 10시 성장호르몬 소등 주간 체크표</h3>' +
        '<table style="width:100%;border-collapse:collapse;font-size:8.5pt;">' +
          '<thead><tr style="background:#ECFDF5;"><th style="border:1px solid #CBD5E1;padding:6px;">요일</th><th style="border:1px solid #CBD5E1;padding:6px;">① 20시 이후 무당류 공복</th><th style="border:1px solid #CBD5E1;padding:6px;">② 책 덮고 오늘 배운 핵심 3단어 인출</th><th style="border:1px solid #CBD5E1;padding:6px;">③ 문틀 철봉 30초×3세트</th><th style="border:1px solid #CBD5E1;padding:6px;">④ 21:50 소등 &amp; 칼슘·D3</th></tr></thead>' +
          '<tbody>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">월</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">키워드: _______________________</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">화</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">키워드: _______________________</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">수</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">키워드: _______________________</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">목</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">키워드: _______________________</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">금</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">키워드: _______________________</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">토·일</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">주말 하브루타 질문 3턴 완료!</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
          '</tbody>' +
        '</table>' +
      '</div>';

    if (container.innerHTML.indexOf('KIDS-FIT VIP DIGITAL ASSET WORKBOOK') === -1) {
      container.innerHTML += extraHtml;
    }
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  function triggerKoreanWorksheetPrint() {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  global.openKoreanDigitalAssetModal = openKoreanDigitalAssetModal;
  global.triggerKoreanWorksheetPrint = triggerKoreanWorksheetPrint;
  global.KidsFitDigitalAssetStore = {
    isDigitalAssetUnlocked: isDigitalAssetUnlocked,
    unlockDigitalAssetsNow: unlockDigitalAssetsNow,
    openKoreanDigitalAssetModal: openKoreanDigitalAssetModal,
    printVipWorkbookBundle: printVipWorkbookBundle,
    injectReportDigitalAssetBanner: injectReportDigitalAssetBanner
  };
})(typeof window !== 'undefined' ? window : global);
