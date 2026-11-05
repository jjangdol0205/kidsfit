/**
 * KISFIT BIO LABS — Global English Affiliate Configuration (dist-global/src/js/monetization.js)
 * 100% English-Only (iHerb IPZ1547 & Amazon US kidfit-20). Zero Korean text or domestic links.
 */
(function (global) {
  'use strict';

  const DEFAULT_AFFILIATE_CONFIG = {
    chipsEnabled: true,
    iherb: 'IPZ1547',
    amazon: 'kidfit-20'
  };

  let inMemoryAffiliateConfig = null;

  function getAffiliateConfig() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem('kidsfit_affiliate_config');
        if (raw) return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, JSON.parse(raw));
      } catch (_) {}
    }
    if (inMemoryAffiliateConfig) {
      return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, inMemoryAffiliateConfig);
    }
    return Object.assign({}, DEFAULT_AFFILIATE_CONFIG);
  }

  function saveAffiliateConfig(config) {
    inMemoryAffiliateConfig = Object.assign({}, config);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('kidsfit_affiliate_config', JSON.stringify(config));
      } catch (_) {}
    }
  }

  function getHardwareRecommendations() {
    return [
      {
        id: 'HW_01',
        name: 'Ergonomic Pediatric Spinal Alignment Desk Chair',
        tag: 'Spinal Disc Decompression',
        benefit: 'Prevents posterior pelvic tilt and thoracic kyphosis to optimize vertical load distribution across epiphyseal plates.',
        category: 'biomechanics',
        amazonQuery: 'ergonomic+kids+desk+chair+posture'
      },
      {
        id: 'HW_02',
        name: 'Eye-Level Adjustable Tilting Wooden Book Stand',
        tag: 'Cervical Posture Correction',
        benefit: 'Maintains C1-C7 cervical alignment to relieve forward-head compression and recover +0.6 in of hidden stature.',
        category: 'biomechanics',
        amazonQuery: 'adjustable+wooden+book+stand+reading+holder'
      },
      {
        id: 'HW_03',
        name: 'Indoor Doorway Decompression Pull-Up & Dead-Hang Bar',
        tag: 'Wolff Law Micro-Traction',
        benefit: 'Unloads intervertebral disc compression and stimulates epiphyseal chondrocyte mechanotransduction.',
        category: 'biomechanics',
        amazonQuery: 'kids+doorway+pull+up+bar'
      },
      {
        id: 'HW_04',
        name: 'Montessori Front-Facing Executive Function Book Display',
        tag: 'Prefrontal Self-Directed Focus',
        benefit: 'Eye-level front display fosters autonomous book selection and sustained prefrontal working memory engagement.',
        category: 'cognition',
        amazonQuery: 'montessori+front+facing+bookshelf'
      }
    ];
  }

  function getGroceryReceiptItems() {
    return { items: [], total4Weeks: 0, dailyAverage: 0 };
  }
  function renderLayer1Cpa() { return ''; }
  function renderLayer2Receipt() { return ''; }
  function renderLayer3Hardware() { return ''; }
  function renderLayer4LockIn() { return ''; }
  function renderAllMonetizationLayers() { return ''; }

  const Monetization = {
    DEFAULT_AFFILIATE_CONFIG,
    getAffiliateConfig,
    saveAffiliateConfig,
    getGroceryReceiptItems,
    getHardwareRecommendations,
    renderLayer1Cpa,
    renderLayer2Receipt,
    renderLayer3Hardware,
    renderLayer4LockIn,
    renderAllMonetizationLayers
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Monetization;
  } else {
    global.KidsFitMonetization = Monetization;
  }
})(typeof window !== 'undefined' ? window : global);
