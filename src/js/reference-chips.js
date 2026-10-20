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

  // Default Affiliate & Merchant Configuration
  const DEFAULT_AFFILIATE_CONFIG = {
    chipsEnabled: true,
    coupang: 'AF7865143',
    linkprice: 'A100708867',
    iherb: 'KIDSBIO',
    amazon: 'tallerbiolab-20'
  };

  // Canonical Query Mappings for Clinical Categories
  const CATEGORY_SEARCH_QUERIES = {
    // Nutrition / Micronutrients (Exact Pinpoint SKU Queries)
    ht042: {
      ko: '식약처 인정 키성장 황기추출물 HT042 어린이 영양제',
      en: 'Astragalus root extract kids immune growth',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=어린이+키성장+영양'
    },
    cartilage_calcium: {
      ko: '어린이 연골칼슘 어골칼슘 폴리감마글루탐산 비타민D3 츄어블',
      en: 'ChildLife Liquid Calcium with Magnesium Orange',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=소아+칼슘+영양학'
    },
    calcium: {
      ko: '어린이 연골칼슘 어골칼슘 구연산 칼슘 마그네슘 비타민D3',
      en: 'calcium citrate magnesium d3 kids',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=칼슘+영양학'
    },
    vitamind: {
      ko: '어린이 비타민 D3 1000IU K2 MK-7 드롭',
      en: 'vitamin d3 k2 mk7 drops kids',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=비타민D'
    },
    zinc: {
      ko: '어린이 글루콘산 피콜린산 아연 초유 글리시네이트 마그네슘',
      en: 'zinc picolinate magnesium glycinate kids',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=미네랄+영양'
    },
    protein: {
      ko: '초유 분리유청 단백질 WPI 어린이 아르기닌 스틱',
      en: 'whey protein isolate l-arginine colostrum',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=단백질+영양학'
    },
    nutrients: {
      ko: '식약처 인정 키성장 황기추출물 HT042 구연산칼슘 D3',
      en: 'pediatric growth micronutrients calcium d3',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=소아영양학'
    },

    // Biomechanics & Posture Equipment
    deadhang: {
      ko: '무타공 안전 잠금 가정용 문틀 턱걸이봉 철봉 데드행',
      en: 'pull up bar doorway dead hang spinal decompression',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=척추교정+자세'
    },
    stretching: {
      ko: '바른자세 경추 EPP 폼롤러 스트레칭 밴드',
      en: 'thoracic spine foam roller posture stretching band',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=체형교정'
    },
    jumping: {
      ko: '성장판 자극 어린이 무소음 실내 트램폴린 점핑매트',
      en: 'plyometric jumping rebounder trampoline kids',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=줄넘기+운동'
    },
    biomechanics: {
      ko: '어린이 높이조절 원목 2단 독서대 거북목 바른자세 교정 도구',
      en: 'pediatric biomechanics posture spinal decompression tools',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=소아정형외과'
    },

    // Neuro-Cognitive & Havruta
    havruta: {
      ko: '초등 하브루타 과학 질문 생각열기 독서 워크북',
      en: 'socratic inquiry science deduction book',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=%ED%95%98%EB%B8%8C%EB%A3%A8%ED%83%80+%EA%B3%BC%ED%95%99'
    },
    montessori: {
      ko: '몬테소리 원목 집게 구슬꿰기 유아 안전가위 소근육 감각 교구',
      en: 'montessori sensorial spatial wooden materials',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=몬테소리'
    },
    science: {
      ko: '초등학생 광학 현미경 프레파라트 어린이 과학 실험 키트',
      en: 'kids science experiment kit microscope optical',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=과학실험키트'
    },
    neuro: {
      ko: '유아 원목 가베 은물 자석블록 소근육 가위질 워크북 세트',
      en: 'pediatric cognitive neuroscience developmental tools',
      linkpriceTarget: 'https://www.yes24.com/Product/Search?domain=ALL&query=뇌과학+육아'
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
    const encodedQ = encodeURIComponent(query);

    switch (merchant.toLowerCase()) {
      case 'iherb': {
        const code = cfg.iherb || DEFAULT_AFFILIATE_CONFIG.iherb;
        const host = isGlobalMode ? 'https://www.iherb.com' : 'https://kr.iherb.com';
        return `${host}/search?kw=${encodedQ}&rcode=${encodeURIComponent(code)}`;
      }
      case 'coupang': {
        const lptag = cfg.coupang || DEFAULT_AFFILIATE_CONFIG.coupang;
        // Primary URL goes via /api/coupang proxy route, with client-side fallback
        return `https://www.coupang.com/np/search?q=${encodedQ}&channel=user&lptag=${encodeURIComponent(lptag)}`;
      }
      case 'linkprice': {
        const affId = cfg.linkprice || DEFAULT_AFFILIATE_CONFIG.linkprice;
        const target = cat.linkpriceTarget || `https://www.yes24.com/Product/Search?domain=ALL&query=${encodedQ}`;
        return `https://click.linkprice.com/click.php?m=yes24&a=${encodeURIComponent(affId)}&l=9999&l_cd1=3&l_cd2=0&tu=${encodeURIComponent(target)}`;
      }
      case 'amazon': {
        const tag = cfg.amazon || DEFAULT_AFFILIATE_CONFIG.amazon;
        return `https://www.amazon.com/s?k=${encodedQ}&tag=${encodeURIComponent(tag)}`;
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
          tag: config.iherb || 'KIDSBIO',
          icon: '🌿'
        },
        {
          merchant: 'Amazon',
          label: `[Biomechanical Tool Spec (Amazon ${config.amazon || 'tallerbiolab-20'}) ↗]`,
          url: buildMerchantUrl('amazon', categoryKey, true, config),
          tag: config.amazon || 'tallerbiolab-20',
          icon: '📦'
        }
      ];
    }

    // Korean KO Mode: Coupang + LinkPrice + iHerb
    return [
      {
        merchant: 'iHerb',
        label: '[성분 스펙 레퍼런스 (iHerb) ↗]',
        url: buildMerchantUrl('iHerb', categoryKey, false, config),
        tag: config.iherb || 'KIDSBIO',
        icon: '🌿'
      },
      {
        merchant: 'Coupang',
        label: '[도구·도서 아카이브 (Coupang) ↗]',
        url: buildMerchantUrl('coupang', categoryKey, false, config),
        tag: config.coupang || 'AF7865143',
        icon: '📦'
      },
      {
        merchant: 'LinkPrice',
        label: `[도서·교구 아카이브 (LinkPrice ${config.linkprice || 'A100708867'}) ↗]`,
        url: buildMerchantUrl('linkprice', categoryKey, false, config),
        tag: config.linkprice || 'A100708867',
        icon: '📚'
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
           style="font-size: 12px; color: var(--text-secondary, #94A3B8); border: 1px solid var(--theme-border, rgba(255, 255, 255, 0.12)); padding: 0.28rem 0.65rem; border-radius: 9999px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; background: var(--theme-surface-sub, rgba(15, 23, 42, 0.6)); transition: all 0.2s ease;">
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
      const pmidLink = p.pmid ? `<a href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/" target="_blank" rel="noopener noreferrer" style="font-size: 0.72rem; color: #38BDF8; font-weight: 700; text-decoration: none; background: rgba(56, 189, 248, 0.12); padding: 0.15rem 0.45rem; border-radius: 4px;">PMID:${p.pmid} ↗</a>` : '';
      const doiLink = p.doi ? `<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener noreferrer" style="font-size: 0.72rem; color: #10B981; font-weight: 700; text-decoration: none; background: rgba(16, 185, 129, 0.12); padding: 0.15rem 0.45rem; border-radius: 4px;">DOI ↗</a>` : '';
      const directUrl = p.url ? `<a href="${p.url}" target="_blank" rel="noopener noreferrer" style="font-size: 0.72rem; color: var(--text-secondary); text-decoration: none;">Original ↗</a>` : '';

      return `
        <div class="citation-card" style="background: var(--theme-surface-sub, rgba(30, 41, 59, 0.5)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 14px; padding: 0.85rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.35rem; margin-bottom: 0.4rem; flex-wrap: wrap;">
              <span style="font-size: 0.72rem; font-weight: 800; color: #38BDF8; background: rgba(56, 189, 248, 0.15); padding: 0.12rem 0.45rem; border-radius: 999px;">
                ${p.journal} (${p.year})
              </span>
              <div style="display: flex; gap: 0.3rem;">
                ${pmidLink}
                ${doiLink}
                ${directUrl}
              </div>
            </div>
            <div style="font-size: 0.84rem; font-weight: 700; color: var(--text-primary); line-height: 1.35; margin-bottom: 0.35rem;">
              ${isGlobal ? p.title : (p.title_ko || p.title)}
            </div>
            <p style="font-size: 0.76rem; color: var(--text-secondary); line-height: 1.45; margin: 0 0 0.4rem 0;">
              <strong>${isGlobal ? 'Finding:' : '핵심 분석:'}</strong> ${isGlobal ? (p.key_statistics || p.clinical_summary_ko || '') : (p.clinical_summary_ko || p.key_statistics || '')}
            </p>
          </div>
          <div style="font-size: 0.75rem; color: #A7F3D0; background: rgba(16, 185, 129, 0.1); padding: 0.4rem 0.55rem; border-radius: 8px; line-height: 1.4;">
            <strong>${isGlobal ? '💡 Clinical Protocol:' : '💡 임상 적용:'}</strong> ${isGlobal ? (p.parenting_prescription_ko || 'Evidence-based pediatric protocol.') : (p.parenting_prescription_ko || '')}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="academic-citations-container" style="background: var(--theme-surface-card, rgba(15, 23, 42, 0.74)); border: 1px solid var(--border-clinic, rgba(255, 255, 255, 0.08)); border-radius: 18px; padding: 1.25rem; margin-top: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span style="font-size: 1.15rem;">🔬</span>
            <h5 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); margin: 0;">
              ${isGlobal ? 'Peer-Reviewed Clinical Research Citations' : '동료심사(Peer-Reviewed) 학술 논문 임상 근거'}
            </h5>
          </div>
          <span style="background: rgba(56, 189, 248, 0.15); color: #38BDF8; font-size: 0.74rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 9999px;">
            ${isGlobal ? `PubMed & Crossref (${totalCount} Indexed Papers)` : `PubMed · Crossref 총 ${totalCount}편 실시간 학습 DB 연동`}
          </span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 0.75rem;">
          ${cardsHtml}
        </div>
      </div>
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
