/**
 * src/js/global-paywall-edition.js
 * Division 5 (kidsfit.co.kr) — Korean Domestic Edition Isolation Stub
 * Foreign checkout engines are strictly disabled in Division 5 (kidsfit.co.kr);
 * domestic monetization operates via Coupang Partners (AF7865143), Naver BrandConnect (Npay),
 * LinkPrice (A100708867), and Latpeed (#kfk-latpeed-ebook-slot).
 */
(function (global) {
  'use strict';

  function isGlobalPaidEdition() {
    return false;
  }

  function isReportUnlocked() {
    return true;
  }

  const api = {
    isGlobalPaidEdition: isGlobalPaidEdition,
    isReportUnlocked: isReportUnlocked
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (global) {
    global.KidsFitGlobalEditionStub = api;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
