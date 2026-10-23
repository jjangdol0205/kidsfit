/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * Quiet 12px Academic Reference Chips Architecture (src/js/reference-chips.js)
 * 
 * Features:
 * - Discrete 12px neutral styling placed at bottom-right of clinical analysis cards.
 * - Zero commercial sales pitch, zero promotional flags, zero dead links ("#").
 * - Bilingual Routing:
 *   * Global Mode (EN): iHerb (`KIDSBIO`), Amazon (`tallerbiolab-20`)
 *   * Korean Mode (KO): Coupang (`AF7865143`), LinkPrice (`A100708867`), iHerb (`KIDSBIO`)
 * - Resilient fallback routing guaranteeing active search destination URLs.
 * - Live synchronization with Admin Studio master toggle (`chipsEnabled`).
 * - Clinical Research Paper Citation Chips with live clickable PMID and DOI links.
 */

(function (global) {
  'use strict';

  // Default Affiliate & Merchant Configuration (9-Platform Integrated)
  const DEFAULT_AFFILIATE_CONFIG = {
    chipsEnabled: true,
    coupang: 'AF7865143',
    linkprice: 'A100708867',
    iherb: 'IPZ1547',
    amazon: 'kidfit-20',
    tenping: '010-****-2370',
    tenpingUrl: 'https://iryan.kr/t8g8qxgcc2',
    adpickAffId: '',
    naverBrandConnectHealth: 'https://naver.me/5Jq9LnLT',
    naverBrandConnectTour: 'https://naver.me/xJcOADhA',
    myrealtripKey: 'mAGXbDg5IJOskYOJT37C9R0K9X4JLQ2Cqc6I1GbQSTQBxylFekE4FwWXQeXRtvo0',
    myrealtripMylinkId: '6226316',
    klookAid: '140161',
    klookAdId: '1514603'
  };

  // Canonical Query Mappings for Clinical Categories (Strictly Curated Flagship Products)
  const CATEGORY_SEARCH_QUERIES = {
    // Nutrition / Micronutrients (Exact Curated Flagship SKU Queries)
    ht042: {
      ko: '종근당건강 아이커 HT042 황기추출물 어린이 키성장 30포',
      en: 'Nature\'s Answer Astragalus Root Fluid Extract Kids',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EC%96%B4%EB%A6%B0%EC%9D%B4+%ED%82%A4%EC%84%B1%EC%9E%A5+%EC%98%81%EC%96%91'
    },
    cartilage_calcium: {
      ko: '차일드라이프 액상 칼슘 마그네슘 오렌지맛 474ml 어린이 어골칼슘',
      en: 'ChildLife Essentials Liquid Calcium with Magnesium Natural Orange 16 fl oz',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EC%86%8C%EC%95%84+%EC%B9%BC%EC%8A%98+%EC%98%81%EC%96%91%ED%95%99'
    },
    calcium: {
      ko: '차일드라이프 액상 칼슘 마그네슘 오렌지맛 474ml 구연산칼슘',
      en: 'ChildLife Essentials Liquid Calcium with Magnesium Natural Orange',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EC%B9%BC%EC%8A%98+%EC%98%81%EC%96%91%ED%95%99'
    },
    vitamind: {
      ko: '닥터써니디 드롭스 비타민D3 1000IU K2 어린이 액상',
      en: 'ChildLife Organic Vitamin D3 Drops 400 IU Natural Berry',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EB%B9%84%ED%83%80%EB%AF%BCD'
    },
    zinc: {
      ko: '일동후디스 하이키즈 초유 플러스 아연 노르딕내추럴스 마그네슘 구미',
      en: 'Nature\'s Way Sambucus Kids Gummies Zinc Elderberry',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EB%AF%B8%EB%84%A4%EB%9E%84+%EC%98%81%EC%96%91'
    },
    protein: {
      ko: '일동후디스 초유 플러스 어린이 아르기닌 단백질 스틱',
      en: 'ChildLife Probiotics with Colostrum Powder Natural Orange Pineapple',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EB%8B%A8%EB%B0%B1%EC%A7%88+%EC%98%81%EC%96%91%ED%95%99'
    },
    nutrients: {
      ko: '종근당건강 아이커 HT042 황기추출물 차일드라이프 액상 칼슘 마그네슘',
      en: 'ChildLife Liquid Calcium with Magnesium Vitamin D3 Kids',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EC%86%8C%EC%95%84%EC%98%81%EC%96%91%ED%95%99'
    },

    // Biomechanics & Posture Equipment (Exact Curated Flagship SKU Queries)
    deadhang: {
      ko: '코멧 스포츠 무타공 안전잠금 문틀 철봉 실내 턱걸이봉',
      en: 'Ally Peaks Pull Up Bar Doorway No Screw Safety Lock',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EC%B2%99%EC%B6%94%EA%B5%90%EC%A0%95+%EC%9E%90%EC%84%B8'
    },
    stretching: {
      ko: '멜킨스포츠 고밀도 EPP 폼롤러 90cm 체형교정 스트레칭',
      en: 'TriggerPoint GRID Foam Roller Thoracic Spine Mobility',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%ED%82%A4+%ED%81%AC%EB%8A%94+%EC%8A%A4%ED%8A%B8%EB%A0%88%EC%B9%AD'
    },
    jumping: {
      ko: '멜킨스포츠 어린이 무소음 실내 트램폴린 손잡이형 점핑매트',
      en: 'Little Tikes Easy Store 3ft Trampoline with Handlebar',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EC%A4%84%EB%84%98%EA%B8%B0+%EC%9A%B4%EB%8F%99'
    },
    biomechanics: {
      ko: '위즈독서대 높이조절 원목 2단 독서대 코멧 문틀 철봉',
      en: 'Wishacc Adjustable Bamboo Book Stand Ergonomic Posture',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EB%B0%94%EB%A5%B8+%EC%9E%90%EC%84%B8+%EA%B3%B5%EB%B6%80%EB%B2%95'
    },

    // Neuro-Cognitive & Havruta (Exact Curated Flagship SKU Queries)
    havruta: {
      ko: '길벗스쿨 기적의 독서 논술 초등 하브루타 질문독서 워크북',
      en: 'Evan-Moor Daily Higher-Order Thinking Workbook',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EA%B8%B0%EC%A0%81%EC%9D%98+%EB%8F%85%EC%84%9C+%EB%85%BC%EC%88%A0'
    },
    montessori: {
      ko: '러닝리소스 소근육 핀셋 집게 멜리사앤더그 원목 구슬꿰기',
      en: 'Learning Resources Helping Hands Fine Motor Tool Set',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EB%AA%AC%ED%85%8C%EC%86%8C%EB%A6%AC+%EC%86%8C%EA%B7%BC%EC%9C%A1'
    },
    science: {
      ko: '라벤스부르거 그래비트랙스 코어 스타터 세트 내셔널지오그래픽 현미경',
      en: 'Ravensburger GraviTrax Starter Set Marble Run STEM',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EA%B7%B8%EB%9E%98%EB%B9%84%ED%8A%B8%EB%9E%99%EC%8A%A4'
    },
    neuro: {
      ko: '맥포머스 매그나타일즈 자석블록 100피스 스마트게임즈 아이큐 퍼즐 프로',
      en: 'Magna-Tiles Clear Colors 100 Piece Magnetic Building Set',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%EA%B8%B8%EB%B2%97%EC%8A%A4%EC%BF%A8+%EA%B8%B0%EC%A0%81%EC%9D%98+%EC%9C%A0%EC%95%84+%EC%88%98%ED%95%99'
    }
  };

  /**
   * Retrieves active affiliate configuration from localStorage or in-memory fallback.
   */
  function getAffiliateConfig() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const rawTaller = localStorage.getItem('taller_affiliate_config');
        if (rawTaller) {
          return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, JSON.parse(rawTaller));
        }
        const rawKidsfit = localStorage.getItem('kidsfit_affiliate_config');
        if (rawKidsfit) {
          return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, JSON.parse(rawKidsfit));
        }
      } catch (e) {
        // Fallback on storage errors
      }
    }
    return Object.assign({}, DEFAULT_AFFILIATE_CONFIG);
  }

  /**
   * Generates resilient merchant URLs without dead links (#).
   */
  function buildMerchantUrl(merchant, categoryKey, isGlobalMode, config = {}) {
    const cfg = Object.assign({}, getAffiliateConfig(), config);
    const cat = CATEGORY_SEARCH_QUERIES[categoryKey] || CATEGORY_SEARCH_QUERIES.nutrients;
    const query = isGlobalMode ? cat.en : cat.ko;
    const encodedQ = encodeURIComponent(query).replace(/'/g, '%27');

    switch (merchant.toLowerCase()) {
      case 'iherb': {
        const code = cfg.iherb || DEFAULT_AFFILIATE_CONFIG.iherb;
        const host = isGlobalMode ? 'https://www.iherb.com' : 'https://kr.iherb.com';
        return `${host}/search?kw=${encodedQ}&rcode=${encodeURIComponent(code)}`;
      }
      case 'coupang': {
        const lptag = cfg.coupang || DEFAULT_AFFILIATE_CONFIG.coupang;
        return `https://link.coupang.com/re/AFFSRP?lptag=${encodeURIComponent(lptag)}&subid=kidsfit&pageKey=${encodedQ}`;
      }
      case 'linkprice': {
        const affId = cfg.linkprice || DEFAULT_AFFILIATE_CONFIG.linkprice;
        const rawTarget = cat.linkpriceTarget || `https://www.yes24.com/Product/Search?domain=ALL&query=${encodedQ}`;
        const target = rawTarget.replace(/([?&]query=)([^&]+)/, (_m, p1, p2) => p1 + encodeURIComponent(p2));
        return `https://click.linkprice.com/click.php?m=yes24&a=${encodeURIComponent(affId)}&l=9999&l_cd1=3&l_cd2=0&tu=${encodeURIComponent(target)}`;
      }
      case 'amazon': {
        const tag = cfg.amazon || DEFAULT_AFFILIATE_CONFIG.amazon;
        return `https://www.amazon.com/s?k=${encodedQ}&tag=${encodeURIComponent(tag)}`;
      }
      case 'klook': {
        const aid = cfg.klookAid || DEFAULT_AFFILIATE_CONFIG.klookAid || '140161';
        const adid = cfg.klookAdId || DEFAULT_AFFILIATE_CONFIG.klookAdId || '1514603';
        const kSite = `https://www.klook.com/ko/search/result/?query=${encodedQ}`;
        return `https://affiliate.klook.com/redirect?aid=${encodeURIComponent(aid)}&aff_adid=${encodeURIComponent(adid)}&k_site=${encodeURIComponent(kSite)}`;
      }
      case 'myrealtrip': {
        return 'https://myrealt.rip/xwYQee';
      }
      case 'tenping': {
        return cfg.tenpingUrl || DEFAULT_AFFILIATE_CONFIG.tenpingUrl || 'https://iryan.kr/t8g8qxgcc2';
      }
      case 'naver_brandconnect': {
        return cfg.naverBrandConnectHealth || DEFAULT_AFFILIATE_CONFIG.naverBrandConnectHealth || 'https://naver.me/5Jq9LnLT';
      }
      case 'naver_brandconnect_tour': {
        return cfg.naverBrandConnectTour || DEFAULT_AFFILIATE_CONFIG.naverBrandConnectTour || 'https://naver.me/xJcOADhA';
      }
      default:
        return `https://www.google.com/search?q=${encodedQ}`;
    }
  }

  /**
   * Generates discrete 12px reference chip items according to current language & mode.
   */
  function getReferenceChipsData(categoryKey = 'nutrients', isGlobalMode = false, customConfig = null) {
    const config = Object.assign({}, getAffiliateConfig(), customConfig || {});
    if (config.chipsEnabled === false) {
      return [];
    }

    if (isGlobalMode) {
      // Global EN Mode: iHerb + Amazon
      return [
        {
          merchant: 'iHerb',
          label: '[Ingredient Spec Reference (iHerb) ↗]',
          url: buildMerchantUrl('iHerb', categoryKey, true, config),
          tag: config.iherb || 'IPZ1547',
          icon: ''
        },
        {
          merchant: 'Amazon',
          label: `[Biomechanical Tool Spec (Amazon ${config.amazon || 'kidfit-20'}) ↗]`,
          url: buildMerchantUrl('amazon', categoryKey, true, config),
          tag: config.amazon || 'kidfit-20',
          icon: ''
        }
      ];
    }

    // Korean KO Mode: Coupang + LinkPrice + iHerb
    return [
      {
        merchant: 'iHerb',
        label: '[성분 스펙 레퍼런스 (iHerb) ↗]',
        url: buildMerchantUrl('iHerb', categoryKey, false, config),
        tag: config.iherb || 'IPZ1547',
        icon: ''
      },
      {
        merchant: 'Coupang',
        label: '[도구·도서 아카이브 (Coupang) ↗]',
        url: buildMerchantUrl('coupang', categoryKey, false, config),
        tag: config.coupang || 'AF7865143',
        icon: ''
      },
      {
        merchant: 'LinkPrice',
        label: `[도서·교구 아카이브 (LinkPrice ${config.linkprice || 'A100708867'}) ↗]`,
        url: buildMerchantUrl('linkprice', categoryKey, false, config),
        tag: config.linkprice || 'A100708867',
        icon: ''
      }
    ];
  }

  /**
   * Renders HTML string for discrete 12px reference chips.
   */
  function getReferenceChipsHtml(categoryKey = 'nutrients', isGlobalMode = false, customConfig = null) {
    const chips = getReferenceChipsData(categoryKey, isGlobalMode, customConfig);
    if (!chips || chips.length === 0) {
      return '';
    }

    const chipsHtml = chips.map((c) => {
      return `
        <a href="${c.url}" 
           target="_blank" 
           rel="noopener noreferrer" 
           class="reference-chip" 
           data-merchant="${c.merchant.toLowerCase()}"
           data-category="${categoryKey}"
           style="font-size: 12px; color: var(--text-secondary, #94A3B8); border: 1px solid var(--theme-border, rgba(255, 255, 255, 0.12)); padding: 0.28rem 0.65rem; border-radius: 9999px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; background: #F8FAFC; transition: all 0.2s ease;">
          <span style="font-size: 11px;">${c.icon}</span>
          <span style="letter-spacing: -0.01em;">${c.label}</span>
        </a>
      `.trim();
    }).join(' ');

    return `
      <div class="reference-chips-container" 
           data-category="${categoryKey}" 
           style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; width: 100%;">
        ${chipsHtml}
      </div>
    `.trim();
  }

  /**
   * Mounts or injects reference chips into DOM container.
   */
  function renderReferenceChips(containerIdOrElement, categoryKey = 'nutrients', isGlobalMode = false, customConfig = null) {
    const html = getReferenceChipsHtml(categoryKey, isGlobalMode, customConfig);
    if (typeof document === 'undefined') return html;

    let targetEl = null;
    if (typeof containerIdOrElement === 'string') {
      targetEl = document.getElementById(containerIdOrElement);
    } else if (containerIdOrElement && containerIdOrElement.nodeType === 1) {
      targetEl = containerIdOrElement;
    }

    if (targetEl) {
      targetEl.innerHTML = html;
      if (!html) {
        targetEl.style.display = 'none';
      } else {
        targetEl.style.display = 'block';
      }
    }
    return html;
  }

  /**
   * Continuous Research Paper Citations:
   * Generates clinical evidence section with clickable PMID and DOI links.
   */
  function renderCitations(pillars = ['growth_endocrinology'], limit = 3, isGlobal = false) {
    let kb = null;
    if (typeof window !== 'undefined' && window.KIDSFIT_RESEARCH_DATA) {
      kb = window.KIDSFIT_RESEARCH_DATA;
    } else if (typeof global !== 'undefined' && global.KIDSFIT_RESEARCH_DATA) {
      kb = global.KIDSFIT_RESEARCH_DATA;
    } else if (typeof require !== 'undefined') {
      try {
        kb = require('../data/research-knowledge-base.json');
      } catch (e) {}
    }

    if (!kb || !Array.isArray(kb.papers)) return '';

    const pillarSet = new Set(Array.isArray(pillars) ? pillars : [pillars]);
    const matched = kb.papers.filter((p) => pillarSet.has(p.pillar)).slice(0, limit);
    if (matched.length === 0) return '';

    const totalCount = (kb.metadata && kb.metadata.total_papers) || kb.papers.length;

    const cardsHtml = matched.map((p) => {
      const pmidLink = p.pmid ? `<a href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/" target="_blank" rel="noopener noreferrer" style="font-size: 0.75rem; color: #1D4ED8; font-weight: 800; text-decoration: none; background: #EFF6FF; padding: 0.15rem 0.5rem; border-radius: 4px;">PMID:${p.pmid} ↗</a>` : '';
      const doiLink = p.doi ? `<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener noreferrer" style="font-size: 0.75rem; color: #1D4ED8; font-weight: 800; text-decoration: none; background: #EFF6FF; padding: 0.15rem 0.5rem; border-radius: 4px;">DOI ↗</a>` : '';
      const shortFact = isGlobal
        ? (p.title || p.key_statistics || '')
        : (p.plain_fact_ko || p.title_ko || p.key_statistics || p.title || '');

      return `
        <div class="citation-card" style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 0.75rem 0.95rem; display: flex; justify-content: space-between; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
          <div style="font-size: 0.86rem; font-weight: 700; color: #0F172A; line-height: 1.45; flex: 1 1 240px;">
            <span style="color: #1D4ED8; font-weight: 800;">• [${p.journal} ${p.year}]</span> ${shortFact}
          </div>
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            ${pmidLink}
            ${doiLink}
          </div>
        </div>
      `;
    }).join('');

    return `
      <details class="academic-citations-container clinical-source-details" style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 16px; padding: 0.85rem 1.15rem; margin-top: 1.1rem;">
        <summary style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; outline: none;">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span style="font-size: 1.05rem;"></span>
            <h5 style="font-size: 0.9rem; font-weight: 800; color: #0F172A; margin: 0;">
              ${isGlobal ? 'Peer-Reviewed Clinical Research Citations (Click to expand ▼)' : '동료심사(Peer-Reviewed) 학술 논문 임상 근거 (출처 접음 · 클릭 시 펼침 ▼)'}
            </h5>
          </div>
          <span style="background: #EFF6FF; color: #1D4ED8; font-size: 0.74rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 9999px;">
            ${isGlobal ? `PubMed & Crossref (${totalCount} Indexed Papers)` : `PubMed · Crossref 총 ${totalCount}편 실시간 학습 DB 연동`}
          </span>
        </summary>
        <div style="display: flex; flex-direction: column; gap: 0.45rem; margin-top: 0.75rem; padding-top: 0.65rem; border-top: 1px dashed #BFDBFE;">
          ${cardsHtml}
        </div>
      </details>
    `;
  }

  // Public Interface Contract
  const ReferenceChips = {
    DEFAULT_AFFILIATE_CONFIG,
    CATEGORY_SEARCH_QUERIES,
    getAffiliateConfig,
    buildMerchantUrl,
    getReferenceChipsData,
    getReferenceChipsHtml,
    renderReferenceChips,
    renderCitations
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReferenceChips;
  }
  if (typeof window !== 'undefined') {
    window.TallerReferenceChips = ReferenceChips;
    window.KidsFitReferenceChips = ReferenceChips;
  }
  if (typeof global !== 'undefined' && typeof window === 'undefined') {
    global.TallerReferenceChips = ReferenceChips;
    global.KidsFitReferenceChips = ReferenceChips;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
