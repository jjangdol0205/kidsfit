/**
 * KISFIT BIO LABS — Global English Edition Master Briefing Shim (dist-global/src/js/master-briefing.js)
 * Lightweight 100% English adapter for https://kisfitglobal.com (replaces 285 KB Korean briefing bundle).
 */
(function (global) {
  'use strict';

  function renderMasterBriefingCard(profile) {
    if (global.KidsFitGlobalPaywall && typeof global.KidsFitGlobalPaywall.buildNativeEnglishClinicalReportHTML === 'function') {
      const unlocked = typeof global.KidsFitGlobalPaywall.isReportUnlocked === 'function'
        ? global.KidsFitGlobalPaywall.isReportUnlocked()
        : false;
      return global.KidsFitGlobalPaywall.buildNativeEnglishClinicalReportHTML(profile || {}, { masked: !unlocked });
    }
    return '<div id="master-briefing-card" class="bento-card"></div>';
  }

  function attachRetestHandler() {
    if (global.KidsFitGlobalPaywall && typeof global.KidsFitGlobalPaywall.transformGlobalReportAndApplyPaywall === 'function') {
      global.KidsFitGlobalPaywall.transformGlobalReportAndApplyPaywall();
    }
  }

  const MasterBriefingEngine = {
    render: renderMasterBriefingCard,
    renderMasterBriefingCard: renderMasterBriefingCard,
    attachRetestListener: attachRetestHandler,
    attachRetestHandler: attachRetestHandler
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MasterBriefingEngine;
  }
  global.MasterBriefingEngine = MasterBriefingEngine;
  global.KidsFitMasterBriefing = MasterBriefingEngine;
})(typeof window !== 'undefined' ? window : global);
