/**
 * KISFIT BIO LABS — Global English Affiliate Configuration (dist-global/src/js/monetization.js)
 * 100% English-Only (iHerb IPZ1547 & Amazon US kidfit-20). Zero Korean text or domestic links.
 */
(function (global) {
  'use strict';

  const DEFAULT_AFFILIATE_CONFIG = {
    chipsEnabled: true,
    coupang: 'AF7865143',
    linkprice: 'A100708867',
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
        name: 'Ergonomic Pediatric Spinal Alignment Desk Chair (Posture Chair)',
        tag: 'Spinal Disc Decompression',
        benefit: 'Prevents posterior pelvic tilt and thoracic kyphosis to optimize vertical load distribution across epiphyseal plates (Pelvic & Spinal Alignment).',
        category: 'biomechanics',
        amazonQuery: 'ergonomic+kids+desk+chair+posture',
        coupangPath: 'vp/products/ergonomic-posture-chair'
      },
      {
        id: 'HW_02',
        name: 'Eye-Level Adjustable Tilting Wooden Book Stand (Ergonomic Stand)',
        tag: 'Cervical Posture Correction',
        benefit: 'Maintains C1-C7 cervical alignment to relieve forward-head compression and recover +0.6 in of hidden stature (Cervical Alignment).',
        category: 'biomechanics',
        amazonQuery: 'adjustable+wooden+book+stand+reading+holder',
        coupangPath: 'vp/products/adjustable-wooden-bookstand'
      },
      {
        id: 'HW_03',
        name: 'Indoor Doorway Decompression Pull-Up & Dead-Hang Bar (Jumping & Traction Bar)',
        tag: 'Wolff Law Micro-Traction',
        benefit: 'Unloads intervertebral disc compression and stimulates epiphyseal chondrocyte mechanotransduction (Growth Plate Traction).',
        category: 'biomechanics',
        amazonQuery: 'kids+doorway+pull+up+bar',
        coupangPath: 'vp/products/jumping-mat-trampoline'
      },
      {
        id: 'HW_04',
        name: 'Montessori Front-Facing Executive Function Book Display (Bookshelf)',
        tag: 'Prefrontal Self-Directed Focus',
        benefit: 'Eye-level front display fosters autonomous book selection and sustained prefrontal working memory engagement (Autonomous Organization).',
        category: 'cognition',
        amazonQuery: 'montessori+front+facing+bookshelf',
        coupangPath: 'vp/products/montessori-front-bookshelf'
      }
    ];
  }

  function getGroceryReceiptItems() {
    return { items: [], total4Weeks: 0, dailyAverage: 0 };
  }
  function renderLayer1Cpa() { return ''; }
  function renderLayer2Receipt() { return ''; }
  function renderLayer3Hardware() { return ''; }
  function renderLayer4LockIn(profile = {}, config = {}) {
    const childGender = profile.gender === 'boy' ? 'Boy' : 'Girl';
    return `
      <div class="bio-share-container" style="margin: 2rem 0; text-align: center;">
        <button type="button" class="btn btn-secondary btn-share-prescription" id="btn-share-rx" onclick="if(navigator.clipboard){navigator.clipboard.writeText(window.location.href);alert('Clinical prescription link copied to clipboard.');}" style="font-size: 0.9rem; padding: 0.75rem 1.25rem;">
          Share ${childGender} Clinical Bio-Analysis Prescription Link
        </button>
      </div>
    `;
  }
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
