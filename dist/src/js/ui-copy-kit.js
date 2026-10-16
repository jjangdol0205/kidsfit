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
    return { siteUrl: 'https://moneyfit-portal.vercel.app' };
  }

  /**
   * Filter presets by category
   */
  function filterCategory(cat) {
    currentCategory = cat;
    renderPresetNav();
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
      return item.p.calc === currentCategory || item.p.category.includes(currentCategory);
    });

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">해당 카테고리의 프리셋이 없습니다.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(({ p, originalIdx }) => {
      const isSelected = originalIdx === activePresetIndex;
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
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${badgeColor}">#${originalIdx + 1} ${p.category}</span>
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
    const currentSiteUrl = cfg.siteUrl || 'https://moneyfit-portal.vercel.app';
    const presetUrl = `${currentSiteUrl}/preset/${preset.id}`;

    // Target query for Naver real-time search
    const query = (bundle && bundle.query) || preset.title.split(' ').slice(0, 4).join(' ');
    const kinUrl = `https://kin.naver.com/search/list.naver?query=${encodeURIComponent(query)}&sort=date`;
    const cafeUrl = `https://search.naver.com/search.naver?where=article&query=${encodeURIComponent(query)}&st=date`;

    // Update live search buttons
    const kwLabel = document.getElementById('sniper-target-kw');
    const kinBtn = document.getElementById('btn-live-kin');
    const cafeBtn = document.getElementById('btn-live-cafe');

    if (kwLabel) kwLabel.textContent = `"${query}"`;
    if (kinBtn) kinBtn.href = kinUrl;
    if (cafeBtn) cafeBtn.href = cafeUrl;

    // Fetch copy content (prefer pre-compiled bundle, fallback to dynamic generation)
    let blogPost = bundle ? bundle.blogPost : '';
    let threadsPost = bundle ? bundle.threadsPost : '';
    let jisikinPost = bundle ? bundle.jisikinPost : '';

    if (!blogPost && window.selectSeoPreset) {
      // fallback
      window.selectSeoPreset(index);
      return;
    }

    // Dynamic replacement of base siteUrl if changed via wizard
    if (currentSiteUrl && !blogPost.includes(currentSiteUrl)) {
      blogPost = blogPost.replace(/https:\/\/[a-zA-Z0-9.-]+\/preset\//g, `${currentSiteUrl}/preset/`);
      threadsPost = threadsPost.replace(/https:\/\/[a-zA-Z0-9.-]+\/preset\//g, `${currentSiteUrl}/preset/`);
      jisikinPost = jisikinPost.replace(/https:\/\/[a-zA-Z0-9.-]+\/preset\//g, `${currentSiteUrl}/preset/`);
    }

    // Populate DOM
    const blogEl = document.getElementById('generated-blog-post');
    const threadsEl = document.getElementById('generated-threads-post');
    const jisikinEl = document.getElementById('generated-jisikin-post');
    const indexNowEl = document.getElementById('generated-indexnow-json');

    if (blogEl) blogEl.textContent = blogPost;
    if (threadsEl) threadsEl.textContent = threadsPost;
    if (jisikinEl) jisikinEl.textContent = jisikinPost;

    if (indexNowEl) {
      let host = 'moneyfit-portal.vercel.app';
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
    filterCategory,
    copyWithFeedback,
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
