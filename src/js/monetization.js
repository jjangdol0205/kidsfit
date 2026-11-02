/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * Affiliate Configuration & Background Reference Routing (src/js/monetization.js)
 * 
 * Commercial Purge:
 * - 100% elimination of grocery receipts, barcodes, price lists, CPA consultation cards,
 *   and e-commerce shopping buttons.
 * - Resilient background affiliate parameter management (Coupang, LinkPrice, iHerb, Amazon)
 *   used exclusively by quiet academic reference chips.
 */

(function (global) {
  'use strict';

  // 1. Authoritative Clinical Affiliate Configuration (9-Platform Integrated)
  const DEFAULT_AFFILIATE_CONFIG = {
    chipsEnabled: true,
    coupang: 'AF7865143',
    linkprice: 'A100708867',
    iherb: 'IPZ1547',
    amazon: 'kidfit-20',
    tenping: '010-****-2370',
    tenpingUrl: 'https://iryan.kr/t8g8qxgcc2',
    adpickAffId: '',
    adpickApiUrl: 'https://adpick.co.kr/apis/offers.php?affid=&os=&adtype=&category=notgame&order=rand',
    naverBrandConnectHealth: 'https://naver.me/5Jq9LnLT',
    naverBrandConnectTour: 'https://naver.me/xJcOADhA',
    myrealtripKey: 'mAGXbDg5IJOskYOJT37C9R0K9X4JLQ2Cqc6I1GbQSTQBxylFekE4FwWXQeXRtvo0',
    myrealtripMylinkId: '6226316',
    klookAid: '140161',
    klookAdId: '1514603',
    cafeUrl: 'https://cafe.naver.com/kidsfitgrowth',
    blogUrl: 'https://blog.naver.com/kidsfit_studio'
  };

  let inMemoryAffiliateConfig = null;

  function getAffiliateConfig() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem('kidsfit_affiliate_config');
        if (raw) {
          return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, JSON.parse(raw));
        }
      } catch (e) {
        // fallback
      }
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
      } catch (e) {
        console.error('Failed to save affiliate config to localStorage', e);
      }
    }
  }

  // 2. Safe Non-Commercial Hardware / Posture Recommendations (Stripped of Prices & Commercial tags)
  function getHardwareRecommendations() {
    return [
      {
        id: 'HW_01',
        name: '어린이 인체공학 바른 자세 척추 교정 의자',
        tag: '척추 디스크 정렬',
        benefit: '골반 후방 경사와 흉추 과후만을 방지하여 성장판 수직 하중 분산을 최적화합니다.',
        category: 'biomechanics',
        coupangPath: 'vp/products/ergonomic-posture-chair'
      },
      {
        id: 'HW_02',
        name: '눈높이 조절 3단 틸팅 원목 독서대',
        tag: '경추 거북목 교정',
        benefit: '경추 1~7번 수직 정렬을 유지하여 일자목 압박을 완화하고 숨은 키 1.5cm를 복원합니다.',
        category: 'biomechanics',
        coupangPath: 'vp/products/adjustable-wooden-bookstand'
      },
      {
        id: 'HW_03',
        name: '성장판 미세자극 실내 무소음 점핑 트램폴린',
        tag: '볼프의 법칙 미세하중',
        benefit: '대퇴골 및 경골 골단판 연골세포에 수직 충격 마이크로 전류를 유도합니다.',
        category: 'biomechanics',
        coupangPath: 'vp/products/jumping-mat-trampoline'
      },
      {
        id: 'HW_04',
        name: '자기주도 몬테소리 전면 원목 교구장',
        tag: '전두엽 자기주도성',
        benefit: '아동 시선 높이 전면 배치로 스스로 선택하고 정리하는 질서감과 실행기능을 형성합니다.',
        category: 'cognition',
        coupangPath: 'vp/products/montessori-front-bookshelf'
      }
    ];
  }

  // 3. Purged Stubs for Complete Commercial Elimination
  // All receipts, prices, barcodes, and CPA banners are 100% purged from UI rendering.
  function getGroceryReceiptItems() {
    return {
      items: [],
      total4Weeks: 0,
      dailyAverage: 0
    };
  }

  function renderLayer1Cpa() {
    return ''; // 100% Commercial Purge: No CPA cards
  }

  function renderLayer2Receipt() {
    return ''; // 100% Commercial Purge: No grocery receipts or barcodes
  }

  function renderLayer3Hardware() {
    return ''; // Integrated into Core 3 Biomechanics Studio
  }

  function renderLayer4LockIn(profile = {}, config = {}) {
    // Retain clean sharing utility without commercial group buys
    const childGender = profile.gender === 'boy' ? '남아' : '여아';
    return `
      <div class="bio-share-container" style="margin: 2rem 0; text-align: center;">
        <button type="button" class="btn btn-secondary btn-share-prescription" id="btn-share-rx" onclick="if(navigator.clipboard){navigator.clipboard.writeText(window.location.href);alert('임상 처방전 링크가 클립보드에 복사되었습니다.');}" style="font-size: 0.9rem; padding: 0.75rem 1.25rem;">
          ${childGender} 바이오 분석 처방전 링크 공유하기
        </button>
      </div>
    `;
  }

  function renderAllMonetizationLayers() {
    return ''; // 100% Commercial Purge
  }

  // 4. Diagnostic Test Unlock & Partner Formatting Utilities (R2 & R4)
  const DIAGNOSTIC_TESTS = [
    'growth',
    'precocious_puberty',
    'brain_development',
    'temperament_learning'
  ];

  function formatPartnerUrl(rawUrl, platform = '') {
    if (!rawUrl) return '';
    const pLower = String(platform || '').toLowerCase();
    const config = getAffiliateConfig();
    const coupangTag = config.coupang || 'AF7865143';
    const iherbTag = config.iherb || 'IPZ1547';
    const cpaTag = config.linkprice || 'A100708867';

    if (pLower.includes('coupang') || rawUrl.includes('coupang.com')) {
      if (!rawUrl.includes('lptag=')) {
        const sep = rawUrl.includes('?') ? '&' : '?';
        return `${rawUrl}${sep}lptag=${coupangTag}`;
      }
      return rawUrl;
    }
    if (pLower.includes('iherb') || rawUrl.includes('iherb.com')) {
      if (!rawUrl.includes('rcode=')) {
        const sep = rawUrl.includes('?') ? '&' : '?';
        return `${rawUrl}${sep}rcode=${iherbTag}`;
      }
      return rawUrl;
    }
    if (pLower.includes('cpa') || pLower.includes('linkprice') || rawUrl.includes('linkprice.com')) {
      if (!rawUrl.includes(cpaTag)) {
        const sep = rawUrl.includes('?') ? '&' : '?';
        return `${rawUrl}${sep}a_id=${cpaTag}`;
      }
      return rawUrl;
    }
    return rawUrl;
  }

  let inMemoryUnlockState = null;

  function unlockDiagnosticTests(productName = '키즈핏 추천 육아템', network = '제휴 파트너사') {
    const payload = {
      unlocked: true,
      unlockedAt: new Date().toISOString(),
      triggerItem: productName,
      triggerNetwork: network,
      tickets: {
        growth: { name: '신체 성장 정밀 진단', unlocked: true },
        precocious_puberty: { name: '골연령·성조숙증 판정', unlocked: true },
        brain_development: { name: '두뇌 5대 역량 진단', unlocked: true },
        temperament_learning: { name: '기질·학습 스타일 진단', unlocked: true }
      }
    };

    inMemoryUnlockState = payload;

    if (typeof window !== 'undefined') {
      window.__kidsfitDiagnosticUnlocked = true;
      window.__kidsfitReportUnlocked = true;
      window.__kidsfitInMemoryStore = window.__kidsfitInMemoryStore || {};
      window.__kidsfitInMemoryStore['kidsfit_diagnostic_unlocked'] = 'true';
      window.__kidsfitInMemoryStore['kf_report_unlocked'] = '1';
      window.__kidsfitInMemoryStore['kidsfit_free_tickets'] = JSON.stringify(payload);
    }

    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem('kidsfit_diagnostic_unlocked', 'true');
        localStorage.setItem('kf_report_unlocked', '1');
        localStorage.setItem('kidsfit_free_tickets', JSON.stringify(payload));
      }
    } catch (_) {}

    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage) {
        sessionStorage.setItem('kf_report_unlocked', '1');
      }
    } catch (_) {}

    return payload;
  }

  function isDiagnosticUnlocked() {
    if (inMemoryUnlockState && inMemoryUnlockState.unlocked) return true;
    if (typeof window !== 'undefined') {
      if (window.__kidsfitDiagnosticUnlocked === true || window.__kidsfitReportUnlocked === true) return true;
      if (window.__kidsfitInMemoryStore && window.__kidsfitInMemoryStore['kidsfit_diagnostic_unlocked'] === 'true') return true;
    }
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        if (localStorage.getItem('kidsfit_diagnostic_unlocked') === 'true') return true;
        if (localStorage.getItem('kf_report_unlocked') === '1') return true;
        const raw = localStorage.getItem('kidsfit_free_tickets');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.unlocked === true) return true;
        }
      }
    } catch (_) {}
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage) {
        if (sessionStorage.getItem('kf_report_unlocked') === '1') return true;
      }
    } catch (_) {}
    return false;
  }

  function getDiagnosticTickets() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        const raw = localStorage.getItem('kidsfit_free_tickets');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.tickets) return parsed.tickets;
        }
      }
    } catch (_) {}
    if (inMemoryUnlockState && inMemoryUnlockState.tickets) {
      return inMemoryUnlockState.tickets;
    }
    const currentUnlocked = isDiagnosticUnlocked();
    return {
      growth: { name: '신체 성장 정밀 진단', unlocked: currentUnlocked },
      precocious_puberty: { name: '골연령·성조숙증 판정', unlocked: currentUnlocked },
      brain_development: { name: '두뇌 5대 역량 진단', unlocked: currentUnlocked },
      temperament_learning: { name: '기질·학습 스타일 진단', unlocked: currentUnlocked }
    };
  }

  // Export
  const Monetization = {
    DEFAULT_AFFILIATE_CONFIG,
    DIAGNOSTIC_TESTS,
    getAffiliateConfig,
    saveAffiliateConfig,
    formatPartnerUrl,
    unlockDiagnosticTests,
    isDiagnosticUnlocked,
    getDiagnosticTickets,
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
