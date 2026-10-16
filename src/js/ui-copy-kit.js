/**
 * MoneyFit Web UI - [노출·홍보 키트] Copy Engine (Tab 2)
 * Handles 36 Golden Keyword presets selection, 0-latency pre-compiled copy rendering,
 * 1-click clipboard copy with visual toast feedback, and real-time Naver Jisik-iN / Cafe
 * Bottom-of-Funnel search queries with sort=date / st=date.
 */

(function () {
  'use strict';

  let currentCategory = 'all';
  let activePresetIndex = 0;

  const HIGH_INTENT_SLUGS = [
    'electric-studio-ac',
    'diet-male-fatloss',
    'pet-maltese-5kg',
    'room-oneroom-100',
    'auto-avante-3000',
    'telecom-penalty-15'
  ];

  /**
   * Safe access to pre-compiled viral posts & SSOT presets
   */
  function getViralData() {
    return (window.MoneyFitViralContent && window.MoneyFitViralContent.VIRAL_POSTS) || {};
  }

  function getPresets() {
    return (window.MoneyFitPresets && window.MoneyFitPresets.PRESETS) || (window.PRESETS) || [];
  }

  function getConfig() {
    const mm = window.MoneyFitMonetization;
    if (mm && mm.getConfig) return mm.getConfig();
    return { siteUrl: 'https://truthofmarket.com' };
  }

  /**
   * Filter presets by category
   */
  function filterCategory(cat) {
    currentCategory = cat;
    renderPresetNav();
  }

  /**
   * Update 6-channel live search links dynamically from query string
   */
  function updateLiveQuery(rawQuery) {
    const query = (rawQuery || '').trim();
    if (!query) return;

    const encodedQ = encodeURIComponent(query);
    const kinUrl = `https://kin.naver.com/search/list.naver?query=${encodedQ}&sort=date`;
    const cafeUrl = `https://search.naver.com/search.naver?where=article&query=${encodedQ}&st=date`;
    const dcUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:dcinside.com ${query}`)}&tbs=qdr:m`;
    const blindUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:teamblind.com ${query}`)}&tbs=qdr:m`;
    const threadsUrl = `https://www.threads.net/search?q=${encodedQ}&serp_type=default`;
    const daumUrl = `https://search.daum.net/search?w=cafe&q=${encodedQ}&sort=recency`;

    const kwLabel = document.getElementById('sniper-target-kw');
    const customInput = document.getElementById('sniper-custom-query');
    const kinBtn = document.getElementById('btn-live-kin');
    const cafeBtn = document.getElementById('btn-live-cafe');
    const dcBtn = document.getElementById('btn-live-dc');
    const blindBtn = document.getElementById('btn-live-blind');
    const threadsBtn = document.getElementById('btn-live-threads');
    const daumBtn = document.getElementById('btn-live-daum');

    if (kwLabel) kwLabel.textContent = `"${query}"`;
    if (customInput && customInput.value !== query) customInput.value = query;
    if (kinBtn) kinBtn.href = kinUrl;
    if (cafeBtn) cafeBtn.href = cafeUrl;
    if (dcBtn) dcBtn.href = dcUrl;
    if (blindBtn) blindBtn.href = blindUrl;
    if (threadsBtn) threadsBtn.href = threadsUrl;
    if (daumBtn) daumBtn.href = daumUrl;
  }

  /**
   * Render left-side preset selector list
   */
  function renderPresetNav() {
    const listEl = document.getElementById('seo-preset-list');
    if (!listEl) return;

    const presets = getPresets();
    const viralData = getViralData();

    const filtered = presets.map((p, originalIdx) => ({ p, originalIdx })).filter(item => {
      if (currentCategory === 'all') return true;
      if (currentCategory === 'pinpoint') return HIGH_INTENT_SLUGS.includes(item.p.id);
      return item.p.calc === currentCategory || item.p.category.includes(currentCategory);
    });

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">해당 카테고리의 프리셋이 없습니다.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(({ p, originalIdx }) => {
      const isSelected = originalIdx === activePresetIndex;
      const isPinpoint = HIGH_INTENT_SLUGS.includes(p.id);
      const v = viralData[p.id] || {};
      const badgeColor = {
        electric: 'bg-amber-100 text-amber-800 border-amber-300',
        diet: 'bg-rose-100 text-rose-800 border-rose-300',
        pet: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        room: 'bg-purple-100 text-purple-800 border-purple-300',
        auto: 'bg-blue-100 text-blue-800 border-blue-300',
        telecom: 'bg-cyan-100 text-cyan-800 border-cyan-300'
      }[p.calc] || 'bg-slate-100 text-slate-800 border-slate-300';

      const activeClass = isSelected
        ? 'border-blue-600 bg-blue-50/90 shadow-sm ring-1 ring-blue-500'
        : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50';

      return `
        <button onclick="MoneyFitCopyKit.selectPreset(${originalIdx})"
                id="preset-nav-btn-${originalIdx}"
                class="w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-2 ${activeClass}">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1 flex-wrap">
              <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${badgeColor}">#${originalIdx + 1} ${p.category}</span>
              ${isPinpoint ? '<span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-600 text-white">🔥 핀셋TOP</span>' : ''}
              <span class="text-[10px] text-slate-400 font-mono truncate">${p.id}</span>
            </div>
            <div class="text-xs font-bold text-slate-800 leading-snug line-clamp-2">${p.title}</div>
            <div class="text-[11px] text-slate-500 mt-1 line-clamp-1">${v.headline || p.metaDescription}</div>
          </div>
          <span class="text-xs font-bold ${isSelected ? 'text-blue-600' : 'text-slate-400'} pt-0.5">선택 →</span>
        </button>
      `;
    }).join('');
  }

  /**
   * Select preset and update all UI copy blocks with 0 latency
   */
  function selectPreset(index) {
    const presets = getPresets();
    const preset = presets[index];
    if (!preset) return;

    activePresetIndex = index;

    // Update active highlight in nav
    document.querySelectorAll('[id^="preset-nav-btn-"]').forEach(btn => {
      btn.className = "w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-2 border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50";
    });
    const selectedBtn = document.getElementById(`preset-nav-btn-${index}`);
    if (selectedBtn) {
      selectedBtn.className = "w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-2 border-blue-600 bg-blue-50/90 shadow-sm ring-1 ring-blue-500";
    }

    const viralData = getViralData();
    const bundle = viralData[preset.id];
    const cfg = getConfig();
    const currentSiteUrl = cfg.siteUrl || 'https://truthofmarket.com';
    const presetUrl = `${currentSiteUrl}/preset/${preset.id}/`;

    const previewLinkEl = document.getElementById('sniper-preset-preview-link');
    if (previewLinkEl) {
      previewLinkEl.href = `/preset/${preset.id}/`;
    }

    // Target query for Naver / Community real-time search
    const query = (bundle && bundle.query) || preset.title.split(' ').slice(0, 4).join(' ');
    updateLiveQuery(query);

    // Render subquery quick chips
    const subChipsEl = document.getElementById('sniper-subqueries-chips');
    if (subChipsEl) {
      const subQueries = (bundle && Array.isArray(bundle.subQueries) && bundle.subQueries.length > 0)
        ? bundle.subQueries
        : [query, `${preset.category} 추천 후기`, `${query} 디시`];
      subChipsEl.innerHTML = subQueries.map(sq => {
        const safeSq = sq.replace(/'/g, "\\'");
        return `<button type="button" onclick="MoneyFitCopyKit.updateLiveQuery('${safeSq}')" class="text-[11px] bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white px-2.5 py-1 rounded-full border border-slate-700 transition font-bold">🔎 ${sq}</button>`;
      }).join('');
    }

    // Build 3-channel live affiliate links (Coupang Partners + LinkPrice + Tenping/CPA)
    const mm = window.MoneyFitMonetization || {};
    const cpaDetails = mm.getCpaCardDetails
      ? mm.getCpaCardDetails(preset.calc, {}, cfg)
      : null;
    const coupangUrl = (cpaDetails && cpaDetails.coupangSubUrl)
      || (bundle && bundle.coupangUrl)
      || (mm.buildCoupangUrl ? mm.buildCoupangUrl(query, preset.calc, cfg.coupangAfId) : `https://www.coupang.com/np/categories/178255?lptag=AF7865143`);
    const linkPriceUrl = (cpaDetails && cpaDetails.linkPriceSubUrl)
      || (bundle && bundle.linkPriceUrl)
      || (mm.buildLinkPriceDeepLink ? mm.buildLinkPriceDeepLink('himart', 'https://www.e-himart.co.kr/', cfg.linkPriceId) : '#');
    const cpaActionUrl = (cpaDetails && cpaDetails.liveActionUrl)
      || (bundle && bundle.cpaActionUrl)
      || linkPriceUrl;

    // Render 3-channel affiliate link bar in #view-seo
    const affGridEl = document.getElementById('seo-affiliate-links-grid');
    if (affGridEl) {
      const safeCoupang = coupangUrl.replace(/'/g, "\\'");
      const safeLp = linkPriceUrl.replace(/'/g, "\\'");
      const safeCpa = cpaActionUrl.replace(/'/g, "\\'");
      affGridEl.innerHTML = `
        <div class="bg-white border border-rose-200 rounded-xl p-2.5 flex flex-col justify-between gap-1.5">
          <div>
            <span class="inline-block text-[10px] font-extrabold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 mb-1">🚀 쿠팡 파트너스 (${cfg.coupangAfId || 'AF7865143'})</span>
            <div class="text-[11px] font-bold text-slate-800 truncate">${(cpaDetails && cpaDetails.coupangSubLabel) || '쿠팡 로켓배송 최저가'}</div>
          </div>
          <div class="flex items-center gap-1.5 pt-1">
            <button type="button" onclick="MoneyFitCopyKit.copyDirectUrl('${safeCoupang}', this, '쿠팡 파트너스 링크')" class="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-2 rounded-lg text-[11px] transition">링크 복사</button>
            <a href="${coupangUrl}" target="_blank" rel="noopener noreferrer sponsored" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1 px-2 rounded-lg text-[11px] transition">열기 ↗</a>
          </div>
        </div>
        <div class="bg-white border border-indigo-200 rounded-xl p-2.5 flex flex-col justify-between gap-1.5">
          <div>
            <span class="inline-block text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 mb-1">🏷️ 링크프라이스 (${cfg.linkPriceId || 'A100708867'})</span>
            <div class="text-[11px] font-bold text-slate-800 truncate">${(cpaDetails && cpaDetails.linkPriceSubLabel) || '공식몰 특가 기획전'}</div>
          </div>
          <div class="flex items-center gap-1.5 pt-1">
            <button type="button" onclick="MoneyFitCopyKit.copyDirectUrl('${safeLp}', this, '링크프라이스 딥링크')" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2 rounded-lg text-[11px] transition">링크 복사</button>
            <a href="${linkPriceUrl}" target="_blank" rel="noopener noreferrer sponsored" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1 px-2 rounded-lg text-[11px] transition">열기 ↗</a>
          </div>
        </div>
        <div class="bg-white border border-amber-300 rounded-xl p-2.5 flex flex-col justify-between gap-1.5">
          <div>
            <span class="inline-block text-[10px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 mb-1">${cpaDetails && cpaDetails.isCustomTenpingUrl ? '🔥 텐핑(iryan.kr) 연동됨' : '⚡ 맞춤 혜택/기획전 직링크'}</span>
            <div class="text-[11px] font-bold text-slate-800 truncate">${(cpaDetails && cpaDetails.liveTitle) || '맞춤 혜택 바로가기'}</div>
          </div>
          <div class="flex items-center gap-1.5 pt-1">
            <button type="button" onclick="MoneyFitCopyKit.copyDirectUrl('${safeCpa}', this, '맞춤 혜택/텐핑 링크')" class="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 px-2 rounded-lg text-[11px] transition">링크 복사</button>
            <a href="${cpaActionUrl}" target="_blank" rel="noopener noreferrer sponsored" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1 px-2 rounded-lg text-[11px] transition">열기 ↗</a>
          </div>
        </div>
      `;
    }

    // Fetch copy content (prefer pre-compiled bundle, fallback to dynamic generation)
    let blogPost = bundle ? bundle.blogPost : '';
    let threadsPost = bundle ? bundle.threadsPost : '';
    let jisikinPost = bundle ? bundle.jisikinPost : '';
    let cafeCommentPost = bundle ? (bundle.cafeCommentPost || '') : '';

    if (!blogPost && window.selectSeoPreset) {
      window.selectSeoPreset(index);
      return;
    }

    // Dynamic replacement of base siteUrl and affiliate IDs if changed via wizard
    if (currentSiteUrl && !blogPost.includes(currentSiteUrl)) {
      blogPost = blogPost.replace(/https:\/\/[a-zA-Z0-9.-]+\/preset\//g, `${currentSiteUrl}/preset/`);
      threadsPost = threadsPost.replace(/https:\/\/[a-zA-Z0-9.-]+\/preset\//g, `${currentSiteUrl}/preset/`);
      jisikinPost = jisikinPost.replace(/https:\/\/[a-zA-Z0-9.-]+\/preset\//g, `${currentSiteUrl}/preset/`);
      cafeCommentPost = cafeCommentPost.replace(/https:\/\/[a-zA-Z0-9.-]+\/preset\//g, `${currentSiteUrl}/preset/`);
    }
    if (cfg.coupangAfId && cfg.coupangAfId !== 'AF7865143') {
      blogPost = blogPost.replace(/lptag=AF7865143/g, `lptag=${encodeURIComponent(cfg.coupangAfId)}`);
    }
    if (cfg.linkPriceId && cfg.linkPriceId !== 'A100708867') {
      blogPost = blogPost.replace(/a=A100708867/g, `a=${encodeURIComponent(cfg.linkPriceId)}`)
                         .replace(/a_id=A100708867/g, `a_id=${encodeURIComponent(cfg.linkPriceId)}`);
    }

    // Populate DOM
    const blogEl = document.getElementById('generated-blog-post');
    const threadsEl = document.getElementById('generated-threads-post');
    const jisikinEl = document.getElementById('generated-jisikin-post');
    const cafeCommentEl = document.getElementById('generated-cafe-comment-post');
    const indexNowEl = document.getElementById('generated-indexnow-json');

    if (blogEl) blogEl.textContent = blogPost;
    if (threadsEl) threadsEl.textContent = threadsPost;
    if (jisikinEl) jisikinEl.textContent = jisikinPost;
    if (cafeCommentEl) cafeCommentEl.textContent = cafeCommentPost;

    if (indexNowEl) {
      let host = 'truthofmarket.com';
      try {
        host = new URL(currentSiteUrl).host;
      } catch (e) {
        // fallback
      }
      const indexNowPayload = {
        host,
        key: "moneyfit8f92a1b4c3d2e1f0",
        keyLocation: `${currentSiteUrl}/moneyfit8f92a1b4c3d2e1f0.txt`,
        urlList: [
          `${currentSiteUrl}/`,
          presetUrl
        ]
      };
      indexNowEl.textContent = JSON.stringify(indexNowPayload, null, 2);
    }
  }

  /**
   * 1-Click Direct URL Copy with visual feedback
   */
  function copyDirectUrl(urlText, btnElement, copyLabel = '제휴 링크') {
    if (!urlText) return;
    const originalHtml = btnElement ? btnElement.innerHTML : null;
    const originalClass = btnElement ? btnElement.className : null;

    function applySuccess() {
      if (btnElement) {
        btnElement.innerHTML = '✓ 복사됨';
        btnElement.classList.add('bg-emerald-700', 'text-white');
        setTimeout(() => {
          if (btnElement) {
            btnElement.innerHTML = originalHtml;
            btnElement.className = originalClass;
          }
        }, 1800);
      }
      showToast(`[${copyLabel}] 클립보드에 복사되었습니다!`);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlText).then(applySuccess).catch(() => fallbackCopyText(urlText, applySuccess));
    } else {
      fallbackCopyText(urlText, applySuccess);
    }
  }

  function refreshActive() {
    selectPreset(activePresetIndex || 0);
  }

  /**
   * 1-Click Copy with visual feedback & Toast notification
   */
  function copyWithFeedback(elementId, btnElement, copyLabel = '원고') {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.textContent || '';

    const originalHtml = btnElement ? btnElement.innerHTML : null;
    const originalClass = btnElement ? btnElement.className : null;

    function applySuccessFeedback() {
      if (btnElement) {
        btnElement.innerHTML = '✓ 복사 완료!';
        btnElement.classList.add('bg-emerald-700', 'text-white', 'ring-2', 'ring-emerald-400');
        setTimeout(() => {
          if (btnElement) {
            btnElement.innerHTML = originalHtml;
            btnElement.className = originalClass;
          }
        }, 2000);
      }
      showToast(`[${copyLabel}] 클립보드에 복사되었습니다! 바로 붙여넣으세요.`);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        applySuccessFeedback();
      }).catch(() => {
        fallbackCopyText(text, applySuccessFeedback);
      });
    } else {
      fallbackCopyText(text, applySuccessFeedback);
    }
  }

  function fallbackCopyText(text, onSuccess) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (onSuccess) onSuccess();
    } catch (e) {
      showToast('클립보드 복사에 실패했습니다. 직접 복사해주세요.');
    }
    document.body.removeChild(ta);
  }

  /**
   * Floating Toast Notification
   */
  function showToast(message) {
    let toast = document.getElementById('copy-toast');
    let toastMsg = document.getElementById('copy-toast-msg');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'copy-toast';
      toast.className = 'fixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 transition-all duration-300 pointer-events-none bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-sm font-bold';
      toast.innerHTML = `<span class="text-emerald-400">✓</span><span id="copy-toast-msg">${message}</span>`;
      document.body.appendChild(toast);
      toastMsg = document.getElementById('copy-toast-msg');
    }

    if (toastMsg) toastMsg.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
  }

  /**
   * Initialize UI Copy Kit Module
   */
  function init() {
    renderPresetNav();
    selectPreset(0);
  }

  // Public Interface
  const MoneyFitCopyKit = {
    init,
    renderPresetNav,
    selectPreset,
    refreshActive,
    filterCategory,
    updateLiveQuery,
    copyWithFeedback,
    copyDirectUrl,
    showToast
  };

  // CommonJS export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoneyFitCopyKit;
  }

  // Browser global export
  if (typeof window !== 'undefined') {
    window.MoneyFitCopyKit = MoneyFitCopyKit;
  }
})();
