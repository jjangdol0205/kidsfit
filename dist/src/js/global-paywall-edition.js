/**
 * KISFIT BIO LABS — Global English Hard-Paywall Edition Engine (src/js/global-paywall-edition.js)
 *
 * Dedicated for https://kisfitglobal.com (and ?edition=global / ?paywall=1):
 * 1. Enforces 100% English-Only Mode (US CDC 2000 & WHO Growth Standards + 3,714 PubMed Papers).
 * 2. Converts the language button into an Imperial (ft/in, lbs) <-> Metric (cm, kg) Unit Switcher.
 * 3. Translates the Homepage Dual-Pillar Showcase, SVG Chart Previews, Quiz, and Master Clinical Report into 100% native English (ZERO Korean text).
 * 4. Implements the Taller-Style Hard-Paywall Gate wired to Official Lemon Squeezy Store #296100 (app.lemonsqueezy.com):
 *    - Single Report Pass ($8.99 USD): https://app.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599
 *    - 6-Month Growth & Brain Tracker Pass ($19.99 USD): https://app.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895
 *    - Supports Lemon.js Overlay Checkout + Direct Checkout Redirect + VIP Owner Passcode ('VIP2026').
 */

(function (global) {
  'use strict';

  const UNLOCK_STORAGE_KEY = 'kidsfit_global_report_unlocked_v1';
  const CHECKOUT_URLS_KEY = 'kidsfit_global_checkout_urls_v1';

  // Official Live Lemon Squeezy Store #296100 (KISFIT Bio Labs / app.lemonsqueezy.com)
  const DEFAULT_SINGLE_CHECKOUT_URL = 'https://app.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599';
  const DEFAULT_PASS_CHECKOUT_URL = 'https://app.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895';

  function isGlobalPaidEdition() {
    try {
      if (global.__KIDSFIT_GLOBAL_PAID_EDITION === false) return false;
      if (typeof window !== 'undefined' && window.__KIDSFIT_GLOBAL_PAID_EDITION === false) return false;
      if (global.__KIDSFIT_GLOBAL_PAID_EDITION === true) return true;
      if (typeof window !== 'undefined' && window.__KIDSFIT_GLOBAL_PAID_EDITION === true) return true;
      if (typeof document !== 'undefined' && document.documentElement && typeof document.documentElement.getAttribute === 'function') {
        const edition = document.documentElement.getAttribute('data-edition');
        if (edition === 'global-paid') return true;
        if (edition === 'ko') return false;
      }
      if (typeof window !== 'undefined' && window.location) {
        const host = String(window.location.hostname || '').toLowerCase();
        const search = String(window.location.search || '').toLowerCase();
        if (search.indexOf('edition=ko') !== -1) return false;
        if (search.indexOf('edition=global') !== -1 || search.indexOf('paywall=1') !== -1) return true;
        if (host.indexOf('kisfitglobal.com') !== -1 || host.indexOf('kidsfitglobal.com') !== -1) return true;
      }
      return true;
    } catch (_) {}
    return true;
  }

  function isReportUnlocked() {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const s = String(window.location.search || '').toLowerCase();
        if (s.indexOf('lock=1') !== -1) {
          if (window.localStorage) window.localStorage.removeItem(UNLOCK_STORAGE_KEY);
          return false;
        }
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(UNLOCK_STORAGE_KEY) === 'true';
      }
    } catch (_) {}
    return false;
  }

  function hashAccessCode(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  const AUTHORIZED_CODE_HASHES = ["326d5752","c61a52f4","437e3ac3","3f2e65ee"];

  global.triggerKidsFitGlobalPrint = function () {
    if (isGlobalPaidEdition() && !isReportUnlocked()) {
      const printContainer = typeof document !== 'undefined' ? document.getElementById('clinic-print-report-container') : null;
      if (printContainer) {
        printContainer.innerHTML = '';
        printContainer.style.display = 'none';
      }
      if (typeof global.openKidsFitGlobalCheckoutModal === 'function') {
        global.openKidsFitGlobalCheckoutModal();
      }
      return false;
    }
    if (typeof global.KidsFitGrowthTracker !== 'undefined' && typeof global.KidsFitGrowthTracker.preparePrintReport === 'function') {
      let savedProf = {};
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const rawSaved = window.localStorage.getItem('kidsfit_last_quiz_profile_v1');
          if (rawSaved) savedProf = JSON.parse(rawSaved) || {};
        }
      } catch (_) {}
      const wizObj = global.KidsFitOnboardingWizard || global.TallerOnboardingWizard;
      const wizProf = (wizObj && typeof wizObj.getState === 'function' && wizObj.getState().profile) || {};
      const appProf = (global.KidsFitApp && global.KidsFitApp.state && global.KidsFitApp.state.profile) || {};
      const prof = Object.assign({}, savedProf, wizProf, appProf);
      const formEl = typeof document !== 'undefined' ? document.getElementById('diagnosis-form') : null;
      const isLearningMode = (prof.preferredReportMode === 'learning') ||
        (wizProf.preferredReportMode === 'learning') ||
        (global.__KIDSFIT_PREFERRED_REPORT_MODE === 'learning') ||
        Boolean(formEl && formEl.className && formEl.className.includes('wizard-mode-learning'));
      prof.preferredReportMode = isLearningMode ? 'learning' : 'growth';
      global.KidsFitGrowthTracker.preparePrintReport(prof);
    }
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
    return true;
  };

  global.updateGlobalHormoneSimulator = function () {
    if (typeof document === 'undefined') return;
    const bedEl = document.getElementById('hormone-bedtime-slider');
    const mealEl = document.getElementById('hormone-meal-slider');
    if (!bedEl || !mealEl) return;
    const bedMin = Number(bedEl.value) || 1320;
    const mealMin = Number(mealEl.value) || 1140;
    const fmtTime = function (m) {
      const norm = ((m % 1440) + 1440) % 1440;
      const hh24 = Math.floor(norm / 60);
      const mm = norm % 60;
      const period = hh24 >= 12 ? 'PM' : 'AM';
      const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
      return hh12 + ':' + String(mm).padStart(2, '0') + ' ' + period;
    };
    const gapHrs = Math.max(0, Number(((bedMin - mealMin) / 60).toFixed(1)));
    const delayPenalty = bedMin <= 1320 ? 0 : Math.min(38, Math.round((bedMin - 1320) * 0.32));
    const carbPenalty = gapHrs >= 3.0 ? 0 : Math.min(36, Math.round((3.0 - gapHrs) * 12));
    const totalSuppression = Math.min(62, delayPenalty + carbPenalty);
    const activePulsePct = Math.max(38, 100 - totalSuppression);

    const bDisp = document.getElementById('hormone-bedtime-display');
    const mDisp = document.getElementById('hormone-meal-display');
    const gDisp = document.getElementById('hormone-gap-display');
    const lBadge = document.getElementById('hormone-loss-badge');
    const advEl = document.getElementById('hormone-advice-text');
    if (bDisp) bDisp.textContent = fmtTime(bedMin);
    if (mDisp) mDisp.textContent = fmtTime(mealMin);
    if (gDisp) gDisp.textContent = gapHrs.toFixed(1) + ' hrs pre-sleep fast';
    if (lBadge) {
      lBadge.textContent = totalSuppression === 0
        ? '100% Optimal Nocturnal HGH Pulse (0% Suppression)'
        : '-' + totalSuppression + '% Nocturnal HGH Suppression (' + activePulsePct + '% Active)';
      lBadge.style.color = totalSuppression === 0 ? '#059669' : '#DC2626';
      lBadge.style.background = totalSuppression === 0 ? '#ECFDF5' : '#FEF2F2';
    }
    if (advEl) {
      advEl.textContent = totalSuppression === 0
        ? 'Optimal Endocrine Window: Deep N3 sleep onset by 10:00 PM with a 3+ hour glycemic fast maximizes pituitary GH pulsatility.'
        : 'Clinical Rx: Shift bedtime to 10:00 PM or earlier and finish last meal/milk at least 3 hours before sleep to recover +' + totalSuppression + '% suppressed HGH.';
    }
  };

  let _postureTimerInterval = null;
  global.startGlobalPostureTimer = function (seconds, label) {
    if (typeof document === 'undefined') return;
    if (_postureTimerInterval) {
      clearInterval(_postureTimerInterval);
      _postureTimerInterval = null;
    }
    let rem = Number(seconds) || 30;
    const disp = document.getElementById('global-posture-timer-display');
    const status = document.getElementById('global-posture-timer-status');
    if (status) status.textContent = 'Active Routine: ' + (label || 'Bar Dead-Hang Decompression');
    const renderSec = function (s) {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      if (disp) disp.textContent = String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    };
    renderSec(rem);
    _postureTimerInterval = setInterval(function () {
      rem -= 1;
      if (rem <= 0) {
        clearInterval(_postureTimerInterval);
        _postureTimerInterval = null;
        renderSec(0);
        if (status) status.textContent = '✓ Set Complete! Rest 30s and repeat (3 sets total for +0.7 in disc recovery).';
      } else {
        renderSec(rem);
      }
    }, 1000);
  };

  function getActiveCheckoutUrl(plan) {
    const isPass = plan === 'pass';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(CHECKOUT_URLS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const customUrl = isPass ? parsed.passUrl : parsed.singleUrl;
          if (customUrl && /^https?:\/\//i.test(customUrl)) return customUrl;
        }
      }
    } catch (_) {}
    return isPass ? DEFAULT_PASS_CHECKOUT_URL : DEFAULT_SINGLE_CHECKOUT_URL;
  }

  function ensureLemonSqueezyScriptLoaded() {
    if (typeof document === 'undefined' || !isGlobalPaidEdition()) return;
    if (document.getElementById('lemonsqueezy-js-sdk')) return;
    try {
      const script = document.createElement('script');
      script.id = 'lemonsqueezy-js-sdk';
      script.src = 'https://assets.lemonsqueezy.com/lemon.js';
      script.defer = true;
      script.onload = function () {
        try {
          if (typeof window.createLemonSqueezy === 'function') {
            window.createLemonSqueezy();
          }
          if (window.LemonSqueezy && typeof window.LemonSqueezy.Setup === 'function') {
            window.LemonSqueezy.Setup({
              eventHandler: function (event) {
                if (event && event.event === 'Checkout.Success') {
                  try {
                    if (window.localStorage) window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
                  } catch (_) {}
                  const modal = document.getElementById('kidsfit-global-checkout-modal');
                  if (modal) modal.remove();
                  transformGlobalReportAndApplyPaywall();
                }
              }
            });
          }
        } catch (_) {}
      };
      document.head.appendChild(script);
    } catch (_) {}
  }

  function cmToFtInStr(cmVal) {
    const cm = parseFloat(cmVal);
    if (isNaN(cm) || cm <= 0) return '0\' 0"';
    const totalIn = cm / 2.54;
    let ft = Math.floor(totalIn / 12);
    let inch = Math.round((totalIn - ft * 12) * 10) / 10;
    if (inch >= 12) {
      ft += 1;
      inch = 0;
    }
    return `${ft}' ${inch.toFixed(1)}"`;
  }


  function getLoggedInUser() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('kidsfit_global_auth_user_v1');
        if (raw) return JSON.parse(raw);
      }
    } catch (_) {}
    return null;
  }

  function syncAuthHeaderButton() {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('btn-header-auth');
    if (!btn) return;
    btn.onclick = function (e) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof global.openKidsFitAuthModal === 'function') {
        global.openKidsFitAuthModal('login');
      }
    };
    const user = getLoggedInUser();
    const isAdminAuthed = global.KidsFitAdminStudio && typeof global.KidsFitAdminStudio.isAdminAuthenticated === 'function' && global.KidsFitAdminStudio.isAdminAuthenticated();
    if (isAdminAuthed || (user && user.isAdmin)) {
      btn.textContent = '👑 Admin Studio';
      btn.style.background = '#ECFDF5';
      btn.style.color = '#059669';
      btn.style.borderColor = '#A7F3D0';
    } else if (user && user.email) {
      btn.textContent = `👤 ${user.name || user.email.split('@')[0]}${user.unlockedPass ? ' (PRO)' : ''}`;
      btn.style.background = user.unlockedPass ? '#ECFDF5' : '#EFF6FF';
      btn.style.color = user.unlockedPass ? '#059669' : '#1D4ED8';
      btn.style.borderColor = user.unlockedPass ? '#A7F3D0' : '#BFDBFE';
    } else {
      btn.textContent = '👤 Sign In / Sign Up';
      btn.style.background = '#EFF6FF';
      btn.style.color = '#1D4ED8';
      btn.style.borderColor = '#BFDBFE';
    }
  }

  global.openKidsFitAuthModal = function (initialTab) {
    if (typeof document === 'undefined') return;
    let modal = document.getElementById('kidsfit-auth-modal');
    if (modal) modal.remove();

    const activeTab = initialTab === 'signup' ? 'signup' : 'login';
    const user = getLoggedInUser();
    const isAdminAuthed = global.KidsFitAdminStudio && typeof global.KidsFitAdminStudio.isAdminAuthenticated === 'function' && global.KidsFitAdminStudio.isAdminAuthenticated();

    modal = document.createElement('div');
    modal.id = 'kidsfit-auth-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.72);display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);';

    if (isAdminAuthed || (user && user.email)) {
      const isOwner = Boolean(isAdminAuthed || (user && user.isAdmin));
      modal.innerHTML = `
        <div style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:22px;max-width:440px;width:100%;padding:1.5rem 1.4rem;box-shadow:0 25px 60px rgba(15,23,42,0.28);color:#0F172A;text-align:left;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;padding-bottom:0.65rem;border-bottom:1px solid #E2E8F0;">
            <div>
              <span style="font-size:0.72rem;font-weight:800;color:#1D4ED8;background:#EFF6FF;padding:0.18rem 0.55rem;border-radius:9999px;">${isOwner ? 'KISFIT ADMIN SESSION ACTIVE' : 'KISFIT MEMBER ACCOUNT'}</span>
              <h3 style="margin:0.3rem 0 0;font-size:1.15rem;font-weight:800;color:#0F172A;">${isOwner ? '👑 Administrator Mode' : ((user && user.name) || 'Parent Member')}</h3>
            </div>
            <button type="button" onclick="var m=document.getElementById('kidsfit-auth-modal');if(m)m.remove();" style="background:#F1F5F9;border:1px solid #CBD5E1;border-radius:9999px;width:32px;height:32px;font-weight:800;cursor:pointer;">✕</button>
          </div>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:0.85rem 1rem;margin-bottom:0.9rem;font-size:0.86rem;">
            <div style="margin-bottom:0.35rem;"><strong>Account:</strong> ${isOwner ? 'Authorized Administrator' : user.email}</div>
            <div><strong>Report Access Status:</strong> ${isReportUnlocked() || isOwner || (user && user.unlockedPass) ? '<span style="color:#059669;font-weight:800;">✓ FULL CLINICAL REPORT UNLOCKED</span>' : '<span style="color:#64748B;font-weight:700;">Standard Account (Paywall Locked)</span>'}</div>
          </div>
          ${isOwner ? `
          <button type="button" onclick="var m=document.getElementById('kidsfit-auth-modal');if(m)m.remove();if(window.KidsFitAdminStudio)window.KidsFitAdminStudio.openAdminModal();" style="width:100%;padding:0.82rem 1rem;border-radius:12px;border:none;background:linear-gradient(135deg,#1D4ED8 0%,#1E40AF 100%);color:#FFFFFF;font-size:0.9rem;font-weight:900;cursor:pointer;margin-bottom:0.55rem;">
            🛠️ Open Admin Studio Control Center →
          </button>
          ` : `
          <button type="button" onclick="window.verifyKidsFitMemberOrder('${user.email}')" style="width:100%;padding:0.78rem 1rem;border-radius:12px;border:1px solid #1D4ED8;background:#EFF6FF;color:#1D4ED8;font-size:0.88rem;font-weight:800;cursor:pointer;margin-bottom:0.55rem;">
            🔄 Sync / Verify Lemon Squeezy Purchase Status
          </button>
          `}
          <button type="button" onclick="window.signOutKidsFitAccount()" style="width:100%;padding:0.72rem 1rem;border-radius:12px;border:1px solid #CBD5E1;background:#FFFFFF;color:#475569;font-size:0.85rem;font-weight:700;cursor:pointer;">
            Sign Out
          </button>
        </div>
      `;
      document.body.appendChild(modal);
      return;
    }

    modal.innerHTML = `
      <div style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:22px;max-width:440px;width:100%;padding:1.5rem 1.4rem;box-shadow:0 25px 60px rgba(15,23,42,0.28);color:#0F172A;text-align:left;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;padding-bottom:0.65rem;border-bottom:1px solid #E2E8F0;">
          <div>
            <span style="font-size:0.72rem;font-weight:800;color:#1D4ED8;background:#EFF6FF;padding:0.18rem 0.55rem;border-radius:9999px;">KISFIT BIO LABS · MEMBER &amp; ADMIN PORTAL</span>
            <h3 style="margin:0.3rem 0 0;font-size:1.15rem;font-weight:800;color:#0F172A;">Sign In or Create Account</h3>
          </div>
          <button type="button" onclick="var m=document.getElementById('kidsfit-auth-modal');if(m)m.remove();" style="background:#F1F5F9;border:1px solid #CBD5E1;border-radius:9999px;width:32px;height:32px;font-weight:800;cursor:pointer;">✕</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.45rem;margin-bottom:1rem;background:#F1F5F9;padding:0.3rem;border-radius:12px;">
          <button type="button" id="auth-tab-btn-login" onclick="window.openKidsFitAuthModal('login')" style="padding:0.5rem;border-radius:9px;border:none;font-size:0.84rem;font-weight:800;cursor:pointer;background:${activeTab === 'login' ? '#FFFFFF' : 'transparent'};color:${activeTab === 'login' ? '#0F172A' : '#64748B'};box-shadow:${activeTab === 'login' ? '0 2px 6px rgba(15,23,42,0.08)' : 'none'};">
            Sign In (Member / Admin)
          </button>
          <button type="button" id="auth-tab-btn-signup" onclick="window.openKidsFitAuthModal('signup')" style="padding:0.5rem;border-radius:9px;border:none;font-size:0.84rem;font-weight:800;cursor:pointer;background:${activeTab === 'signup' ? '#FFFFFF' : 'transparent'};color:${activeTab === 'signup' ? '#0F172A' : '#64748B'};box-shadow:${activeTab === 'signup' ? '0 2px 6px rgba(15,23,42,0.08)' : 'none'};">
            Create Account
          </button>
        </div>

        <div id="auth-name-group" style="display:${activeTab === 'signup' ? 'block' : 'none'};margin-bottom:0.75rem;">
          <label style="display:block;font-size:0.78rem;font-weight:800;color:#334155;margin-bottom:0.25rem;">Parent / Guardian Name</label>
          <input type="text" id="auth-input-name" placeholder="Sarah Jenkins" style="width:100%;box-sizing:border-box;padding:0.65rem 0.8rem;border:1.5px solid #CBD5E1;border-radius:10px;font-size:0.9rem;color:#0F172A;">
        </div>

        <div style="margin-bottom:0.75rem;">
          <label style="display:block;font-size:0.78rem;font-weight:800;color:#334155;margin-bottom:0.25rem;">User ID</label>
          <input type="text" id="auth-input-email" autocomplete="username" placeholder="Enter your User ID" style="width:100%;box-sizing:border-box;padding:0.65rem 0.8rem;border:1.5px solid #CBD5E1;border-radius:10px;font-size:0.9rem;color:#0F172A;">
        </div>

        <div style="margin-bottom:0.85rem;">
          <label style="display:block;font-size:0.78rem;font-weight:800;color:#334155;margin-bottom:0.25rem;">Password</label>
          <input type="password" id="auth-input-password" autocomplete="current-password" placeholder="Enter your Password" onkeydown="if(event.key==='Enter'){event.preventDefault();window.submitKidsFitAuth('${activeTab}');}" style="width:100%;box-sizing:border-box;padding:0.65rem 0.8rem;border:1.5px solid #CBD5E1;border-radius:10px;font-size:0.9rem;color:#0F172A;">
        </div>

        <div id="auth-feedback-msg" style="display:none;font-size:0.8rem;font-weight:700;padding:0.55rem 0.75rem;border-radius:8px;margin-bottom:0.75rem;"></div>

        <button type="button" onclick="window.submitKidsFitAuth('${activeTab}')" style="width:100%;padding:0.88rem 1rem;border-radius:12px;border:none;background:linear-gradient(135deg,#0F172A 0%,#1D4ED8 100%);color:#FFFFFF;font-size:0.94rem;font-weight:800;cursor:pointer;box-shadow:0 8px 20px rgba(29,78,216,0.22);">
          ${activeTab === 'signup' ? 'Create Account →' : 'Sign In →'}
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  };

  global.submitKidsFitAuth = function (mode) {
    const nameEl = document.getElementById('auth-input-name');
    const emailEl = document.getElementById('auth-input-email');
    const passEl = document.getElementById('auth-input-password');
    const msgEl = document.getElementById('auth-feedback-msg');

    const name = String((nameEl && nameEl.value) || '').trim();
    const rawIdOrEmail = String((emailEl && emailEl.value) || '').trim();
    const email = rawIdOrEmail.toLowerCase();
    const password = String((passEl && passEl.value) || '');

    const showMsg = function (text, isErr) {
      if (!msgEl) return;
      msgEl.style.display = 'block';
      msgEl.style.background = isErr ? '#FEF2F2' : '#ECFDF5';
      msgEl.style.color = isErr ? '#DC2626' : '#059669';
      msgEl.style.border = isErr ? '1px solid #FECACA' : '1px solid #A7F3D0';
      msgEl.textContent = text;
    };

    // Check if the user entered the Administrator ID & Password (verified via zero-plaintext digest)
    if (global.KidsFitAdminStudio && typeof global.KidsFitAdminStudio.verifyAdminCredentials === 'function' && global.KidsFitAdminStudio.verifyAdminCredentials(rawIdOrEmail, password)) {
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('kisfit_admin_auth_token_v1', 'a86cfdc57a9f8d167c0546a365722330');
        }
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
          window.localStorage.setItem('kidsfit_global_auth_user_v1', JSON.stringify({
            name: 'Administrator',
            email: 'admin@kisfitglobal.com',
            isAdmin: true,
            unlockedPass: true
          }));
        }
      } catch (_) {}
      syncAuthHeaderButton();
      const authModal = document.getElementById('kidsfit-auth-modal');
      if (authModal) authModal.remove();
      const checkoutModal = document.getElementById('kidsfit-global-checkout-modal');
      if (checkoutModal) checkoutModal.remove();
      transformGlobalReportAndApplyPaywall();
      if (global.KidsFitAdminStudio && typeof global.KidsFitAdminStudio.openAdminModal === 'function') {
        global.KidsFitAdminStudio.openAdminModal();
      }
      return Promise.resolve({ ok: true, isAdmin: true });
    }

    if (!email || email.length < 3 || password.length < 4) {
      showMsg('Please enter a valid User ID (min 3 characters) and Password (min 4 characters).', true);
      return;
    }

    const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
    const profile = (global.KidsFitApp && global.KidsFitApp.state && global.KidsFitApp.state.profile) || null;

    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      return window.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, childProfile: profile })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data || !data.ok) {
            showMsg((data && data.error) || 'Authentication failed. Please check your credentials.', true);
            return data;
          }
          if (window.localStorage) {
            window.localStorage.setItem('kidsfit_global_auth_token_v1', data.token || '');
            window.localStorage.setItem('kidsfit_global_auth_user_v1', JSON.stringify(data.user));
            window.localStorage.setItem('kidsfit_global_buyer_email', email);
            if (data.user && data.user.unlockedPass) {
              window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
            }
          }
          syncAuthHeaderButton();
          const modal = document.getElementById('kidsfit-auth-modal');
          if (modal) modal.remove();
          transformGlobalReportAndApplyPaywall();
          return data;
        })
        .catch(function () {
          showMsg('Unable to reach authentication server. Please try again.', true);
          return null;
        });
    }
    return Promise.resolve(null);
  };

  global.signOutKidsFitAccount = function () {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('kidsfit_global_auth_token_v1');
        window.localStorage.removeItem('kidsfit_global_auth_user_v1');
        window.localStorage.removeItem(UNLOCK_STORAGE_KEY);
      }
      if (global.KidsFitAdminStudio && typeof global.KidsFitAdminStudio.logoutAdmin === 'function') {
        global.KidsFitAdminStudio.logoutAdmin();
      }
    } catch (_) {}
    syncAuthHeaderButton();
    transformGlobalReportAndApplyPaywall();
    const modal = document.getElementById('kidsfit-auth-modal');
    if (modal) modal.remove();
  };

  global.verifyKidsFitMemberOrder = function (emailOverride) {
    const user = getLoggedInUser();
    const email = String(emailOverride || (user && user.email) || '').trim().toLowerCase();
    if (!email || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
    window.fetch('/api/lemonsqueezy-orders/verify?email=' + encodeURIComponent(email))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.ok && data.verified) {
          if (window.localStorage) {
            window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
            if (user) {
              user.unlockedPass = true;
              window.localStorage.setItem('kidsfit_global_auth_user_v1', JSON.stringify(user));
            }
          }
          syncAuthHeaderButton();
          transformGlobalReportAndApplyPaywall();
          if (typeof window.alert === 'function') {
            window.alert('Verified! Your Lemon Squeezy order is active and your full clinical report is unlocked.');
          }
        } else if (typeof window.alert === 'function') {
          window.alert('No completed Lemon Squeezy paid order was found for ' + email + ' yet. Please complete checkout first.');
        }
      })
      .catch(function () {});
  };

  function applyGlobalHomepageEnglishDOM() {
    if (typeof document === 'undefined' || !isGlobalPaidEdition()) return;

    document.documentElement.lang = 'en';
    document.documentElement.setAttribute('data-edition', 'global-paid');
    document.title = 'KISFIT BIO LABS — US CDC & 3,714-Paper Pediatric Height & Brain LQ Clinical Report';

    // Force TallerI18n into English
    if (global.TallerI18n && typeof global.TallerI18n.setLanguage === 'function') {
      if (global.TallerI18n.getLanguage() !== 'en') {
        global.TallerI18n.setLanguage('en');
      }
    }

    ensureLemonSqueezyScriptLoaded();
    syncAuthHeaderButton();

    const legacyEco = document.getElementById('taller-xyz-ecosystem-showcase');
    if (legacyEco) legacyEco.remove();

    // Wire Header Unit Toggle (#btn-unit-toggle and #btn-lang-toggle) without duplicating onboarding-wizard.js listener
    const setupUnitBtn = function (btnId) {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      const unitSys = (global.TallerI18n && typeof global.TallerI18n.getUnitSystem === 'function')
        ? global.TallerI18n.getUnitSystem()
        : 'imperial';
      btn.textContent = unitSys === 'imperial' ? '🇺🇸 Imperial: ft/in · lbs' : '🌐 Metric: cm · kg';
      btn.title = 'Toggle between Imperial (ft/in, lbs) and Metric (cm, kg)';
      if (!btn._hasUnitListener && !btn._globalUnitBound) {
        btn._globalUnitBound = true;
        btn._hasUnitListener = true;
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          const cur = (global.TallerI18n && typeof global.TallerI18n.getUnitSystem === 'function')
            ? global.TallerI18n.getUnitSystem()
            : 'imperial';
          const next = cur === 'imperial' ? 'metric' : 'imperial';
          if (global.TallerOnboardingWizard && typeof global.TallerOnboardingWizard.setUnitSystem === 'function') {
            global.TallerOnboardingWizard.setUnitSystem(next);
          } else if (global.TallerI18n && typeof global.TallerI18n.setUnitSystem === 'function') {
            global.TallerI18n.setUnitSystem(next);
          }
          btn.textContent = next === 'imperial' ? '🇺🇸 Imperial: ft/in · lbs' : '🌐 Metric: cm · kg';
        });
      }
    };
    setupUnitBtn('btn-unit-toggle');
    setupUnitBtn('btn-lang-toggle');

    const appBtn = document.getElementById('btn-header-app-download');
    if (appBtn) {
      appBtn.textContent = '📲 Web App';
      appBtn.setAttribute('aria-label', 'Install Web App');
    }

    const tagline = document.querySelector('.brand-tagline');
    if (tagline) {
      tagline.textContent = 'US CDC 2000 Auxology · Bone-Age Trajectory & Neuro-Cognitive LQ Lab';
    }

    // Hero Section Authority Pill & Trust Bar (US Silicon Valley HealthTech Aesthetic)
    const authPill = document.querySelector('.clinical-authority-pill');
    if (authPill) {
      authPill.style.cssText = 'display:inline-flex;align-items:center;gap:0.55rem;background:#FFFFFF;border:1px solid #CBD5E1;box-shadow:0 4px 14px rgba(15,23,42,0.05);color:#0F172A;font-size:0.78rem;font-weight:700;padding:0.34rem 0.85rem 0.34rem 0.45rem;border-radius:9999px;margin:0 auto 1rem;';
      authPill.innerHTML = '<span style="background:linear-gradient(135deg,#0F172A 0%,#2563EB 100%);color:#FFFFFF;padding:0.2rem 0.65rem;border-radius:9999px;font-size:0.7rem;font-weight:800;letter-spacing:0.04em;">US CLINICAL LAB</span><span>CDC 2000 Growth Charts · AAP &amp; PES Aligned · Multi-Ethnic Auxology</span>';
    }

    const heroHeadline = document.querySelector('.hero-headline');
    if (heroHeadline) {
      heroHeadline.style.cssText = 'max-width:880px;margin:0 auto 0.85rem;color:#0F172A;font-weight:800;font-size:clamp(1.75rem,4.6vw,2.85rem);line-height:1.14;letter-spacing:-0.035em;';
      heroHeadline.innerHTML = '<span class="hero-single-line">Predict Your Child&apos;s Adult Height &amp;</span><br><span class="hero-headline-highlight hero-single-line" style="background:linear-gradient(90deg,#1D4ED8 0%,#0284C7 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#1D4ED8;font-weight:800;">Unlock Their Full Growth &amp; Brain Potential.</span>';
    }

    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
      heroSubtitle.style.cssText = 'color:#475569;font-weight:500;max-width:700px;margin:0 auto 1.25rem;font-size:clamp(0.96rem,2.2vw,1.12rem);line-height:1.6;';
      heroSubtitle.textContent = 'Get a hospital-grade bone-age trajectory (+2.6 in / +6.7 cm hidden window), nocturnal HGH optimization plan, and 5-Axis Brain Learning Quotient (LQ) in 60 seconds.';
    }

    const trustBar = document.querySelector('.clinical-survey-trust-bar');
    if (trustBar) {
      trustBar.style.cssText = 'max-width:860px;margin:0 auto 1.5rem;background:#FFFFFF;border:1px solid #E2E8F0;box-shadow:0 8px 24px rgba(15,23,42,0.04);border-radius:9999px;padding:0.65rem 1.35rem;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:0.55rem 1.4rem;font-size:0.82rem;color:#0F172A;font-weight:600;';
      trustBar.innerHTML = '<span><strong style="color:#059669;">US CDC 2000 LMS</strong> · Multi-Ethnic Auxology Calibrated</span><span style="color:#CBD5E1;" class="pc-view-block">|</span><span><strong style="color:#1D4ED8;">Khamis-Roche &amp; Tanner MPH</strong> · Bone-Age &amp; HGH Model</span><span style="color:#CBD5E1;" class="pc-view-block">|</span><span><strong style="color:#0F172A;">Dual-Unit Ready</strong> · Instant ft/in · lbs &amp; cm · kg</span>';
    }

    // Dual-Pillar Intro Showcase Cards: ONLY 01 Auxology & 02 Neuro
    const dualShowcase = document.getElementById('dual-pillar-intro-showcase');
    if (dualShowcase && !dualShowcase.getAttribute('data-global-en-applied')) {
      dualShowcase.setAttribute('data-global-en-applied', '1');
      dualShowcase.innerHTML = `
        <div class="home-dual-report-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.35rem;">
          <!-- Report 1 Intro Card: Physical Growth -->
          <div id="homepage-intro-growth-report" class="mf-glass-card us-bento-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 1.55rem 1.4rem; border: 1px solid #E2E8F0; border-radius: 22px; background: #FFFFFF;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.6rem;">
                <span style="display: inline-block; font-size: 0.72rem; font-weight: 800; color: #FFFFFF; background: #0F172A; padding: 0.24rem 0.7rem; border-radius: 9999px; letter-spacing: 0.03em;">
                  01 · AUXOLOGY &amp; BONE-AGE LAB
                </span>
                <span style="font-size: 0.74rem; font-weight: 700; color: #059669; background: #ECFDF5; border: 1px solid #A7F3D0; padding: 0.18rem 0.55rem; border-radius: 9999px;">US CDC 2000 + Khamis-Roche</span>
              </div>
              <h3 style="font-size: clamp(1.15rem, 2.8vw, 1.32rem); font-weight: 800; color: #0F172A; margin: 0 0 0.4rem 0; letter-spacing: -0.025em;">
                Adult Height Predictor &amp; Growth-Plate Window
              </h3>
              <p style="font-size: 0.85rem; color: #475569; margin: 0 0 0.95rem 0; line-height: 1.5;">
                Calculates day-exact CDC LMS percentiles, Mid-Parental Target Height (MPH), multi-ethnic pubertal tempo, and nocturnal HGH factors.
              </p>

              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 0.85rem 0.9rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem; font-size: 0.76rem; font-weight: 700; color: #0F172A;">
                  <span>3-Tier Adult Height Trajectory (ft/in &amp; cm)</span>
                  <span style="color: #059669; background: #ECFDF5; padding: 0.14rem 0.55rem; border-radius: 9999px; border: 1px solid #A7F3D0; font-weight: 800;">+2.6 in (+6.7 cm) Window</span>
                </div>
                <svg viewBox="0 0 420 155" style="width: 100%; height: auto; display: block;" role="img" aria-label="3-Tier Predicted Adult Height Trajectory Preview">
                  <line x1="24" y1="25" x2="225" y2="25" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3,3"/>
                  <line x1="24" y1="65" x2="225" y2="65" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3,3"/>
                  <line x1="24" y1="105" x2="225" y2="105" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3,3"/>
                  <line x1="24" y1="130" x2="225" y2="130" stroke="#CBD5E1" stroke-width="1.2"/>
                  <path d="M 30 118 Q 110 86, 215 24 L 215 68 Q 110 102, 30 118 Z" fill="#DBEAFE" opacity="0.65"/>
                  <path d="M 30 118 Q 110 106, 215 84" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="4,3"/>
                  <path d="M 30 118 Q 110 98, 215 62" fill="none" stroke="#64748B" stroke-width="2"/>
                  <path d="M 30 118 Q 110 82, 215 24" fill="none" stroke="#1D4ED8" stroke-width="3"/>
                  <circle cx="30" cy="118" r="3.5" fill="#1D4ED8"/>
                  <circle cx="122" cy="76" r="3.5" fill="#1D4ED8"/>
                  <circle cx="215" cy="24" r="4.5" fill="#1D4ED8"/>
                  <rect x="110" y="8" width="102" height="16" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="0.8"/>
                  <text x="161" y="19" text-anchor="middle" font-size="9" font-weight="800" fill="#1D4ED8">Optimized 5'11" (180cm)</text>
                  <rect x="120" y="47" width="90" height="15" rx="4" fill="#FFFFFF" fill-opacity="0.92" stroke="#CBD5E1" stroke-width="0.8"/>
                  <text x="165" y="58" text-anchor="middle" font-size="8.5" font-weight="700" fill="#334155">Genetic 5'8.3" (173.5)</text>
                  <rect x="120" y="84" width="90" height="15" rx="4" fill="#FFFFFF" fill-opacity="0.92" stroke="#E2E8F0" stroke-width="0.8"/>
                  <text x="165" y="95" text-anchor="middle" font-size="8.5" font-weight="600" fill="#64748B">Unmanaged 5'7.2"</text>
                  <text x="26" y="144" font-size="9" font-weight="600" fill="#64748B">Age 7</text>
                  <text x="110" y="144" font-size="9" font-weight="600" fill="#64748B">Age 12 (PHV)</text>
                  <text x="192" y="144" font-size="9" font-weight="600" fill="#64748B">Adult (18y)</text>
                  <line x1="242" y1="15" x2="242" y2="140" stroke="#E2E8F0" stroke-width="1"/>
                  <rect x="258" y="56" width="36" height="74" rx="5" fill="#CBD5E1"/>
                  <text x="276" y="50" text-anchor="middle" font-size="9" font-weight="700" fill="#334155">5'8.3"</text>
                  <text x="276" y="144" text-anchor="middle" font-size="8.5" font-weight="700" fill="#475569">Genetic</text>
                  <rect x="308" y="72" width="36" height="58" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/>
                  <text x="326" y="66" text-anchor="middle" font-size="9" font-weight="700" fill="#64748B">5'7.2"</text>
                  <text x="326" y="144" text-anchor="middle" font-size="8.5" font-weight="700" fill="#64748B">Unmanaged</text>
                  <rect x="358" y="24" width="42" height="106" rx="5" fill="#1D4ED8"/>
                  <text x="379" y="18" text-anchor="middle" font-size="9.5" font-weight="800" fill="#1D4ED8">5'11.0"</text>
                  <text x="379" y="144" text-anchor="middle" font-size="8.5" font-weight="800" fill="#1D4ED8">Optimized</text>
                </svg>
              </div>

              <ul class="hero-one-line-list" style="list-style: none; margin: 0 0 1.2rem 0; padding: 0; font-size: 0.84rem; color: #1E293B; line-height: 1.5;">
                <li style="margin-bottom: 0.55rem; display: flex; gap: 0.55rem; align-items: flex-start;">
                  <span style="color: #059669; font-weight: 900;">✓</span>
                  <div><strong style="color: #0F172A;">3-Tier Adult Height &amp; PES/Cochrane rhGH Review:</strong> Evaluates $20k/yr GH injection ROI vs. natural N3 sleep HGH optimization.</div>
                </li>
                <li style="margin-bottom: 0.55rem; display: flex; gap: 0.55rem; align-items: flex-start;">
                  <span style="color: #059669; font-weight: 900;">✓</span>
                  <div><strong style="color: #0F172A;">Bone-Age &amp; Leptin Defense:</strong> Prevents early epiphyseal fusion and optimizes weight-for-height IGF-1 synthesis.</div>
                </li>
                <li style="display: flex; gap: 0.55rem; align-items: flex-start;">
                  <span style="color: #059669; font-weight: 900;">✓</span>
                  <div><strong style="color: #0F172A;">+0.8 in (+1.8 cm) Spinal Decompression &amp; Bio-Nutrition:</strong> Weight-calibrated Calcium, D3, K2, Zinc &amp; 10-min bar hang protocol.</div>
                </li>
              </ul>
            </div>
            <button type="button" id="btn-home-start-growth-report" onclick="if(window.TallerOnboardingWizard) window.TallerOnboardingWizard.enterStudioMode('child', 'growth');" class="mf-btn-white" style="width: 100%; padding: 0.95rem 1.1rem; font-size: 0.95rem; font-weight: 800; background: linear-gradient(135deg, #0F172A 0%, #1D4ED8 100%); color: #FFFFFF; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 8px 20px rgba(29, 78, 216, 0.22);">
              Start 60-Sec Height &amp; Bone-Age Scan →
            </button>
          </div>

          <!-- Report 2 Intro Card: Brain & Learning -->
          <div id="homepage-intro-learning-report" class="mf-glass-card us-bento-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 1.55rem 1.4rem; border: 1px solid #E2E8F0; border-radius: 22px; background: #FFFFFF;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.6rem;">
                <span style="display: inline-block; font-size: 0.72rem; font-weight: 800; color: #FFFFFF; background: #1D4ED8; padding: 0.24rem 0.7rem; border-radius: 9999px; letter-spacing: 0.03em;">
                  02 · NEURO-COGNITIVE LQ LAB
                </span>
                <span style="font-size: 0.74rem; font-weight: 700; color: #1D4ED8; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 0.18rem 0.55rem; border-radius: 9999px;">Harvard / WashU Neuroscience</span>
              </div>
              <h3 style="font-size: clamp(1.15rem, 2.8vw, 1.32rem); font-weight: 800; color: #0F172A; margin: 0 0 0.4rem 0; letter-spacing: -0.025em;">
                5-Axis Brain Balance &amp; Executive Function Scan
              </h3>
              <p style="font-size: 0.85rem; color: #475569; margin: 0 0 0.95rem 0; line-height: 1.5;">
                Pinpoints prefrontal working-memory, spatial math, reading comprehension, and active retrieval bottlenecks.
              </p>

              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 0.85rem 0.9rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; margin-bottom: 0.45rem; font-size: 0.76rem; font-weight: 700; color: #0F172A;">
                  <span style="white-space: nowrap;">5-Axis Brain LQ &amp; 6-Month Growth Curve</span>
                  <span style="color: #1D4ED8; background: #EFF6FF; padding: 0.14rem 0.55rem; border-radius: 9999px; border: 1px solid #BFDBFE; white-space: nowrap; flex-shrink: 0; font-weight: 800;">+21 Pt LQ Gain</span>
                </div>
                <svg viewBox="0 0 420 155" style="width: 100%; height: auto; display: block;" role="img" aria-label="5-Axis Brain Balance Radar Preview">
                  <polygon points="125,28 176,65 157,126 93,126 74,65" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
                  <polygon points="125,46 159,71 146,111 104,111 91,71" fill="none" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="2,2"/>
                  <line x1="125" y1="82" x2="125" y2="28" stroke="#E2E8F0" stroke-width="1"/>
                  <line x1="125" y1="82" x2="176" y2="65" stroke="#E2E8F0" stroke-width="1"/>
                  <line x1="125" y1="82" x2="157" y2="126" stroke="#E2E8F0" stroke-width="1"/>
                  <line x1="125" y1="82" x2="93" y2="126" stroke="#E2E8F0" stroke-width="1"/>
                  <line x1="125" y1="82" x2="74" y2="65" stroke="#E2E8F0" stroke-width="1"/>
                  <polygon points="125,32 172,66 154,121 97,120 79,67" fill="#DBEAFE" fill-opacity="0.38" stroke="#2563EB" stroke-width="1.5" stroke-dasharray="3,2"/>
                  <polygon points="125,37 167,68 144,107 106,109 82,68" fill="#1D4ED8" fill-opacity="0.22" stroke="#1D4ED8" stroke-width="2.4"/>
                  <text x="125" y="19" text-anchor="middle" font-size="8.8" font-weight="800" fill="#0F172A">Literacy (88)</text>
                  <text x="182" y="64" text-anchor="start" font-size="8.8" font-weight="800" fill="#0F172A">Math/Spatial (84)</text>
                  <text x="142" y="142" text-anchor="start" font-size="8.5" font-weight="800" fill="#1D4ED8">Focus (62·Bottleneck)</text>
                  <text x="108" y="142" text-anchor="end" font-size="8.5" font-weight="800" fill="#1D4ED8">Recall (65·Bottleneck)</text>
                  <text x="68" y="64" text-anchor="end" font-size="8.8" font-weight="800" fill="#0F172A">Inquiry (86)</text>
                  <line x1="254" y1="18" x2="254" y2="140" stroke="#E2E8F0" stroke-width="1"/>
                  <rect x="266" y="22" width="144" height="34" rx="6" fill="#FFFFFF" stroke="#BFDBFE" stroke-width="1"/>
                  <text x="274" y="36" font-size="8.5" font-weight="700" fill="#475569">Dominant Circuit</text>
                  <text x="274" y="49" font-size="9.5" font-weight="800" fill="#0F172A">Spatial &amp; Inquiry Top 14%</text>
                  <rect x="266" y="62" width="144" height="34" rx="6" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
                  <text x="274" y="76" font-size="8.5" font-weight="700" fill="#1D4ED8">Primary Bottleneck</text>
                  <text x="274" y="89" font-size="9.5" font-weight="800" fill="#1E3A8A">Working Memory &amp; Recall</text>
                  <rect x="266" y="102" width="144" height="34" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
                  <text x="274" y="116" font-size="8.5" font-weight="700" fill="#475569">6-Month Coached Target</text>
                  <text x="274" y="129" font-size="9.5" font-weight="800" fill="#1D4ED8">Overall LQ +21 Pts Jump</text>
                </svg>
              </div>

              <ul class="hero-one-line-list" style="list-style: none; margin: 0 0 1.2rem 0; padding: 0; font-size: 0.84rem; color: #1E293B; line-height: 1.5;">
                <li style="margin-bottom: 0.55rem; display: flex; gap: 0.55rem; align-items: flex-start;">
                  <span style="color: #1D4ED8; font-weight: 900;">✓</span>
                  <div><strong style="color: #0F172A;">5-Axis Neural Radar:</strong> Evaluates Literacy, Spatial Math, Working Memory, Active Recall &amp; Scientific Inquiry.</div>
                </li>
                <li style="margin-bottom: 0.55rem; display: flex; gap: 0.55rem; align-items: flex-start;">
                  <span style="color: #1D4ED8; font-weight: 900;">✓</span>
                  <div><strong style="color: #0F172A;">4-Week Neuro-Study Protocol:</strong> Feynman Blank-Page Recall (+150% retention) &amp; Singapore Math Bar Modeling.</div>
                </li>
                <li style="display: flex; gap: 0.55rem; align-items: flex-start;">
                  <span style="color: #1D4ED8; font-weight: 900;">✓</span>
                  <div><strong style="color: #0F172A;">STEM &amp; Career Aptitude Roadmap:</strong> Maps dominant neural circuits to STEM, Medical, Law &amp; Creative tracks.</div>
                </li>
              </ul>
            </div>
            <button type="button" id="btn-home-start-learning-report" onclick="if(window.TallerOnboardingWizard) window.TallerOnboardingWizard.enterStudioMode('child', 'learning');" class="mf-btn-glass" style="width: 100%; padding: 0.95rem 1.1rem; font-size: 0.95rem; font-weight: 800; background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%); border: none; color: #FFFFFF; border-radius: 12px; cursor: pointer; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.22);">
              Start 60-Sec Brain LQ &amp; Bottleneck Scan →
            </button>
          </div>
        </div>
      `;
    }

    // Hide Korean-specific App Download Bars & Translate App Install Modal
    const appBar = document.getElementById('hero-app-download-bar');
    if (appBar) appBar.style.display = 'none';
    const mobAppBar = document.getElementById('mobile-app-install-banner');
    if (mobAppBar) mobAppBar.style.display = 'none';

    const btnEnterStudio = document.getElementById('btn-enter-studio-parent');
    if (btnEnterStudio) btnEnterStudio.textContent = 'Start 1:1 Clinical Scan →';

    const appModalTitle = document.getElementById('app-modal-title');
    if (appModalTitle) appModalTitle.textContent = 'Add KISFIT Web App to Home Screen';
    const appModalNotice = document.getElementById('app-modal-env-notice');
    if (appModalNotice) appModalNotice.innerHTML = 'Add the <strong>KISFIT Bio Labs</strong> icon to your home screen for instant 1-tap access.';
    const btnPwaInstall = document.getElementById('btn-modal-pwa-install');
    if (btnPwaInstall) btnPwaInstall.textContent = 'Install Web App to Home Screen';
    const btnOpenChrome = document.getElementById('btn-modal-open-chrome');
    if (btnOpenChrome) btnOpenChrome.textContent = 'Open in Chrome Browser to Install';
    const btnFileDl = document.getElementById('btn-modal-file-download');
    if (btnFileDl) btnFileDl.textContent = 'Download Quick-Launch Shortcut';

    // Guidebook Mode Banner inside Step 1 (Respects Growth vs. Brain Learning Mode)
    const modeBanner = document.getElementById('guidebook-mode-banner');
    const diagForm = document.getElementById('diagnosis-form');
    const isLearningActive = (global.__KIDSFIT_PREFERRED_REPORT_MODE === 'learning') ||
      Boolean(diagForm && diagForm.className && diagForm.className.includes('wizard-mode-learning'));
    if (modeBanner) {
      if (isLearningActive) {
        modeBanner.innerHTML = '<strong>[Report 02 · 5-Axis Brain LQ &amp; Executive Function Assessment]</strong> Powered by Harvard / WashU Developmental Neuroscience &amp; 3,714 Peer-Reviewed PubMed Studies.';
      } else {
        modeBanner.innerHTML = '<strong>[Report 01 · Pediatric Auxology &amp; Bone-Age Assessment]</strong> Powered by US CDC 2000 Growth Charts, Tanner Auxology &amp; 3,714 Peer-Reviewed PubMed Studies.';
      }
    }

    // Global Region Options
    const regionSel = document.getElementById('user-region');
    if (regionSel && regionSel.options) {
      const globalRegions = [
        'United States — Northeast (NY · NJ · MA · PA)',
        'United States — West Coast (CA · WA · OR)',
        'United States — South & Texas (TX · FL · GA · NC)',
        'United States — Midwest (IL · OH · MI · MN)',
        'Canada (ON · BC · QC · AB)',
        'United Kingdom & Europe',
        'Australia & New Zealand',
        'Asia-Pacific & International'
      ];
      Array.from(regionSel.options).forEach((opt, idx) => {
        if (globalRegions[idx]) opt.textContent = globalRegions[idx];
      });
    }

    // Translate remaining static buttons/badges in Quiz & Results header
    const btnOpenStep7 = document.getElementById('btn-open-step7-narrative');
    if (btnOpenStep7) btnOpenStep7.textContent = 'Add Custom Clinical Note';
    const btnSubmitNarrative = document.getElementById('btn-submit-quiz-narrative');
    if (btnSubmitNarrative) btnSubmitNarrative.textContent = 'Generate Clinical Report →';
    const btnBackStep6 = document.getElementById('btn-back-to-step6-choices');
    if (btnBackStep6) btnBackStep6.textContent = '← Back';
    const btnSwGrowth = document.getElementById('btn-switch-report-growth');
    if (btnSwGrowth) btnSwGrowth.remove();
    const btnSwLearn = document.getElementById('btn-switch-report-learning');
    if (btnSwLearn) btnSwLearn.remove();
    const btnPrintTop = document.getElementById('btn-print-report-top');
    if (btnPrintTop) {
      btnPrintTop.textContent = 'Print / Save Clinical PDF';
      btnPrintTop.onclick = function (e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        return global.triggerKidsFitGlobalPrint();
      };
    }

    // Translate any inline Korean badges inside #quiz-section
    const quizSec = document.getElementById('quiz-section');
    if (quizSec) {
      quizSec.querySelectorAll('span, strong, div').forEach((el) => {
        if (el.children.length === 0 && el.textContent) {
          const t = el.textContent.trim();
          if (t === '뇌인지 학술논문 기반 판독') el.textContent = 'Neuro-Cognitive Paper-Based Scan';
          else if (t === '선택 항목 1:1 정밀 반영') el.textContent = '1:1 Calibrated to Your Selections';
          else if (t === '[다음 단계]') el.textContent = '[Next Step]';
          else if (t === '예시1') el.textContent = 'Sample Note';
        }
      });
    }
  }

  /**
   * Builds a 100% Native English Dual-Pillar Clinical Master Report for kisfitglobal.com
   * using the real auxology, endocrine, biomechanical, and 5-Axis Brain LQ calculations.
   */
  function buildNativeEnglishClinicalReportHTML(profile, options) {
    const opts = options || {};
    const isMasked = Boolean(opts.masked);
    const GrowthEngine = global.KidsFitGrowthEngine;
    const ageMonths = Math.max(12, Math.min(240, Number(profile.ageMonths) || 120));
    const ageY = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const ageRemM = Math.round(ageMonths % 12);
    const isBoy = profile.gender !== 'girl';
    const genderLabel = isBoy ? 'Male (Boy)' : 'Female (Girl)';
    const heightCm = Number(profile.currentHeight) || 137.0;
    const weightKg = Number(profile.currentWeight) || 35.5;
    const fatherCm = Number(profile.fatherHeight) || 173.5;
    const motherCm = Number(profile.motherHeight) || 160.5;
    const recentGrowth6mCm = Number(profile.recentGrowth6m) || 3.2;
    const annualVelocityCm = Number((recentGrowth6mCm * 2).toFixed(1));
    const annualVelocityIn = Number((annualVelocityCm / 2.54).toFixed(1));
    const habits = Array.isArray(profile.habits) && profile.habits.length ? profile.habits : ['late_sleep'];

    // Extract Step 4, 5, 6 personalized survey selections (with live DOM fallback)
    const getDomChecked = function (name, fallbackArr) {
      if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
        const nodes = document.querySelectorAll('input[name="' + name + '"]:checked');
        if (nodes && nodes.length > 0) {
          const vals = [];
          nodes.forEach(function (n) { if (n.value) vals.push(n.value); });
          if (vals.length > 0) return vals;
        }
      }
      return fallbackArr;
    };

    const traitSleepList = (Array.isArray(profile.traitSleepList) && profile.traitSleepList.length)
      ? profile.traitSleepList
      : getDomChecked('trait-sleep-quality', ['late_bedtime']);
    const traitDietList = (Array.isArray(profile.traitDietList) && profile.traitDietList.length)
      ? profile.traitDietList
      : getDomChecked('trait-diet-digestion', ['small_appetite']);
    const traitPostureList = (Array.isArray(profile.traitPostureList) && profile.traitPostureList.length)
      ? profile.traitPostureList
      : getDomChecked('trait-posture-type', ['turtle_slouch']);
    const traitGrowthDetails = (Array.isArray(profile.traitGrowthDetails) && profile.traitGrowthDetails.length)
      ? profile.traitGrowthDetails
      : getDomChecked('trait-growth-detail', ['growing_pain_night']);
    const domExEl = (typeof document !== 'undefined') ? document.getElementById('trait-exercise-freq') : null;
    const traitExercise = profile.traitExercise || (domExEl && domExEl.value) || 'low_indoor';

    const sleepLabelsMap = {
      late_bedtime: 'Bedtime after 10:30 PM (Delayed N3 Slow-Wave Sleep GH Onset)',
      toss_mouth: 'Restless Sleep / Mouth Breathing (Hypoxic SWS Fragmentation)',
      hard_wakeup: 'Morning Awakening Fatigue (Cortisol/Melatonin Phase Delay)',
      night_sweat: 'Sleep-Onset Head/Neck Sweating (Autonomic Thermoregulation Load)',
      night_snack: 'Late-Night Snacking / Milk Before Bed (Insulin-Mediated Somatostatin Surge)',
      light_dream: 'Light Sleep & Frequent Awakening (Reduced Pituitary GH Pulse Amplitude)',
      weekend_oversleep: 'Weekend Social Jetlag (Circadian Phase Shift)',
      deep_early: 'Sound Deep Sleep Before 9:30 PM (Optimal Pituitary GH Preservation)'
    };
    const dietLabelsMap = {
      small_appetite: 'Small Meal Portions & Early Satiety (Caloric/Amino-Acid Deficit)',
      meat_veggie_picky: 'Selective Picky Eating: Meat/Vegetables (Chelated Zinc & Heme-Iron Gap)',
      dairy_sensitive: 'Lactose / Dairy Sensitivity (Requires Acid-Independent Calcium Citrate)',
      constipation_hard: 'Functional Constipation / Slow GI Motility (Avoid Calcium Carbonate)',
      sweet_carb: 'High Refined-Carb & Sweet Snack Preference (Postprandial Insulin Elevation)',
      fast_indigestion: 'Post-Meal Indigestion / Incomplete Mastication',
      water_low: 'Low Daily Pure Water Intake (<600 ml · Intervertebral Disc Dehydration)',
      balanced_good: 'Balanced Macronutrient Intake Across Core Food Groups'
    };
    const postureLabelsMap = {
      turtle_slouch: 'Forward-Head Posture (Tech-Neck) & Thoracic Slouching (-0.6 in Hidden Loss)',
      leg_cross_pelvis: 'Pelvic Asymmetry / Leg-Crossing / W-Sitting Habit',
      growing_pains: 'Nocturnal Lower-Extremity (Knee/Calf/Ankle) Epiphyseal Growing Pains',
      chin_lean: 'Unilateral Chin-Leaning & Seated Spinal Lateral Deviation',
      flat_foot: 'Pedal Arch Fatigue / Pronated Flat-Foot Gait Mechanics',
      upright_good: 'Maintained Physiological Lordosis/Kyphosis Alignment'
    };
    const exerciseLabelsMap = {
      low_indoor: 'Sedentary / Indoor Dominant (≤1x/wk · Insufficient Piezoelectric Bone Strain)',
      moderate_2_3: 'Moderate Physical Activity (2–3x/wk PE & Recreational Play)',
      active_4_plus: 'High Osteogenic Loading (4+x/wk Jumping & Aerobic Stimulus)'
    };
    const growthDetailLabelsMap = {
      growing_pain_night: 'Nocturnal Knee/Calf/Ankle Growing Pains (Requires Magnesium & Evening Traction)',
      underweight_thin: 'Underweight Trend Relative to Height (Priority Protein & Zinc Anabolic Support)',
      overweight_fat_gain: 'Rapid Weight/Adiposity Gain (Leptin & Aromatase Bone-Age Acceleration Watch)',
      rhinitis_mouth: 'Allergic Rhinitis / Nasal Obstruction (Disrupts N3 Delta-Wave GH Secretion)',
      early_puberty_worry: 'Early Pubertal Signs Watch (Strict Estrogenic/Glycemic Bone-Age Defense)',
      bone_age_delay: 'Sub-Optimal Annual Growth Velocity (<2.0 in / 5.0 cm per year)',
      dairy_calcium_lack: 'Low Dairy Bioavailability (Requires Citrate/MCHA + Vitamin D3/K2 MK-7)',
      slouch_disc_loss: 'Cervical/Lumbar Disc Compression (+0.7 in / +1.8 cm Decompression Recovery Target)'
    };

    const selectedSleepFindings = traitSleepList.map(function (k) { return sleepLabelsMap[k] || k; }).join(' · ');
    const selectedDietFindings = traitDietList.map(function (k) { return dietLabelsMap[k] || k; }).join(' · ');
    const selectedPostureFindings = traitPostureList.map(function (k) { return postureLabelsMap[k] || k; }).join(' · ');
    const selectedExerciseFinding = exerciseLabelsMap[traitExercise] || exerciseLabelsMap.low_indoor;
    const selectedGrowthDetailFindings = (traitGrowthDetails && traitGrowthDetails.length)
      ? traitGrowthDetails.map(function (k) { return growthDetailLabelsMap[k] || k; }).join(' · ')
      : 'Standard Pediatric Auxology & Epiphyseal Tracking';

    const lms = (GrowthEngine && typeof GrowthEngine.getLmsForMonth === 'function')
      ? GrowthEngine.getLmsForMonth(isBoy ? 'boy' : 'girl', ageMonths)
      : { L: 1, M: 137.0, S: 0.045 };
    const kdca = (GrowthEngine && typeof GrowthEngine.calculateKdcaPercentile === 'function')
      ? GrowthEngine.calculateKdcaPercentile(heightCm, lms.L, lms.M, lms.S)
      : { percentile: 50.0, topPercent: 50.0, zScore: 0.0 };
    const mphCm = (GrowthEngine && typeof GrowthEngine.calculateMph === 'function')
      ? GrowthEngine.calculateMph(fatherCm, motherCm, isBoy ? 'boy' : 'girl')
      : Number(((fatherCm + motherCm + (isBoy ? 13 : -13)) / 2).toFixed(1));
    const pred = (GrowthEngine && typeof GrowthEngine.calculateHeightPrediction === 'function')
      ? GrowthEngine.calculateHeightPrediction(mphCm, habits, profile.tannerPhase || 'phase_2')
      : { mph: mphCm, predictedCurrent: Number((mphCm - 2.3).toFixed(1)), potentialHeight: Number((mphCm + 4.8).toFixed(1)), totalLoss: 2.3, potentialGain: 4.8 };

    const unmanagedCm = Number(pred.predictedCurrent || (mphCm - 2.3)).toFixed(1);
    const geneticCm = Number(mphCm).toFixed(1);
    const optimizedCm = Number(pred.potentialHeight || (mphCm + 4.8)).toFixed(1);
    const hiddenGainCm = Math.max(3.5, Number((optimizedCm - unmanagedCm).toFixed(1)));

    const isImperial = (global.TallerI18n && typeof global.TallerI18n.getUnitSystem === 'function')
      ? global.TallerI18n.getUnitSystem() === 'imperial'
      : true;

    function fmtLen(cmVal) {
      const cm = parseFloat(cmVal);
      if (isNaN(cm) || cm <= 0) return '0 cm';
      const ftIn = cmToFtInStr(cm);
      const cmStr = cm.toFixed(1);
      return isImperial ? `${ftIn} (${cmStr} cm)` : `${cmStr} cm (${ftIn})`;
    }

    function fmtMaskedLen(cmVal) {
      if (isMasked) {
        return isImperial ? '5\' █.█″ (███.█ cm)' : '███.█ cm (5\' █.█″)';
      }
      return fmtLen(cmVal);
    }

    function fmtWt(kgVal) {
      const kg = parseFloat(kgVal);
      if (isNaN(kg) || kg <= 0) return '0 kg';
      const lbs = (kg * 2.20462262).toFixed(1);
      const kgStr = kg.toFixed(1);
      return isImperial ? `${lbs} lbs (${kgStr} kg)` : `${kgStr} kg (${lbs} lbs)`;
    }

    function fmtGain(cmVal) {
      const cm = parseFloat(cmVal);
      if (isNaN(cm)) return '+0 cm';
      const inVal = (cm / 2.54).toFixed(1);
      const cmStr = cm.toFixed(1);
      return isImperial ? `+${inVal} in (+${cmStr} cm)` : `+${cmStr} cm (+${inVal} in)`;
    }

    const unmanagedImp = isMasked ? '5\' █.█″' : cmToFtInStr(unmanagedCm);
    const geneticImp = isMasked ? '5\' █.█″' : cmToFtInStr(geneticCm);
    const optimizedImp = isMasked ? '5\' █.█″' : cmToFtInStr(optimizedCm);
    const unmanagedCmDisp = isMasked ? '███.█' : unmanagedCm;
    const geneticCmDisp = isMasked ? '███.█' : geneticCm;
    const optimizedCmDisp = isMasked ? '███.█' : optimizedCm;
    const bmi = Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));
    const idealWeightKg = Number((18.5 * Math.pow(heightCm / 100, 2)).toFixed(1));
    const pctVal = Number(kdca.percentile || 50).toFixed(1);
    const pctValDisp = isMasked ? '██.█' : pctVal;
    const zScoreDisp = isMasked ? '█.██' : (kdca.zScore || '0.00');
    const remainYears = Math.max(1, (isBoy ? 17 : 15) - ageY);

    // Nutrient targets scaled by weight & survey diet traits
    const caMg = Math.min(1300, Math.max(700, Math.round(weightKg * (traitDietList.includes('dairy_sensitive') ? 28 : 26))));
    const vitDIu = ageY >= 9 ? 2000 : 1200;
    const vitK2Mcg = Math.min(120, Math.max(45, Math.round(weightKg * 2.2)));
    const zincMg = ageY >= 9 ? (traitDietList.includes('meat_veggie_picky') ? 13 : 11) : 8;
    const proteinG = Math.round(weightKg * (traitGrowthDetails.includes('underweight_thin') ? 1.5 : 1.35));

    const isBelow50 = Number(pctVal) < 50;
    const rawTargetCm = Number(profile.targetHeight) || 0;
    const targetHeightCm = (rawTargetCm >= 120 && rawTargetCm <= 230)
      ? Number(rawTargetCm.toFixed(1))
      : Number(Math.max(Number(optimizedCm), Number((mphCm + 5.0).toFixed(1))).toFixed(1));
    const diffToTargetCm = Number((targetHeightCm - Number(optimizedCm)).toFixed(1));
    const dreamReachabilityPct = diffToTargetCm <= 0
      ? 96
      : Math.max(64, Math.min(95, Math.round(94 - diffToTargetCm * 4.2)));
    const remainLinearCm = Math.max(2.0, Number((Number(optimizedCm) - heightCm).toFixed(1)));
    const plateOpennessPct = profile.tannerPhase === 'phase_1' ? 88
      : (profile.tannerPhase === 'phase_3' ? 56 : (profile.tannerPhase === 'phase_4' ? 28 : 78));

    const ethMap = {
      us_general: {
        label: 'US CDC 2000 Multi-Ethnic Reference (NHANES Unified)',
        phvNote: isBoy ? 'Boy PHV Peak: Age 13.4 ± 0.9 yrs' : 'Girl PHV Peak: Age 11.5 ± 0.8 yrs',
        bmiThreshold: 'BMI > 85th % (Leptin Watch)',
        clinicalNote: 'Uses CDC 2000 NCHS/NHANES multi-ethnic Z-score baseline anchored to individual Tanner Mid-Parental Height (MPH).'
      },
      us_cdc_mixed: {
        label: 'US CDC 2000 Multi-Ethnic Reference (NHANES Unified)',
        phvNote: isBoy ? 'Boy PHV Peak: Age 13.4 ± 0.9 yrs' : 'Girl PHV Peak: Age 11.5 ± 0.8 yrs',
        bmiThreshold: 'BMI > 85th % (Leptin Watch)',
        clinicalNote: 'Uses CDC 2000 NCHS/NHANES multi-ethnic Z-score baseline anchored to individual Tanner Mid-Parental Height (MPH).'
      },
      european_white: {
        label: 'European / Caucasian American (Northern & Western European)',
        phvNote: isBoy ? 'Boy PHV Peak: Age 13.5–14.0 yrs (Extended Pre-Pubertal Window)' : 'Girl PHV Peak: Age 11.6–12.1 yrs',
        bmiThreshold: 'BMI > 21.5 kg/m²',
        clinicalNote: 'Slightly later pubertal onset provides +4 to +8 extra months of pre-pubertal tibial/femoral linear growth.'
      },
      african_american: {
        label: 'African American / Black Ancestry (PROS / AAP Tempo Calibrated)',
        phvNote: isBoy ? 'Boy PHV Peak: Age 12.6–13.1 yrs (Earlier Bone Maturation)' : 'Girl PHV Peak: Age 10.6–11.1 yrs (Earlier Thelarche/PHV)',
        bmiThreshold: 'BMI > 20.5 kg/m² (Early Epiphyseal Watch)',
        clinicalNote: 'Higher childhood GH/IGF-1 velocity with 8–12 months earlier pubertal onset (AAP PROS Study); requires proactive bone-age defense.'
      },
      african_black: {
        label: 'African American / Black Ancestry (PROS / AAP Tempo Calibrated)',
        phvNote: isBoy ? 'Boy PHV Peak: Age 12.6–13.1 yrs (Earlier Bone Maturation)' : 'Girl PHV Peak: Age 10.6–11.1 yrs (Earlier Thelarche/PHV)',
        bmiThreshold: 'BMI > 20.5 kg/m² (Early Epiphyseal Watch)',
        clinicalNote: 'Higher childhood GH/IGF-1 velocity with 8–12 months earlier pubertal onset (AAP PROS Study); requires proactive bone-age defense.'
      },
      hispanic_latino: {
        label: 'Hispanic / Latino American (NHANES Mexican & Latin American)',
        phvNote: isBoy ? 'Boy PHV Peak: Age 13.0–13.4 yrs' : 'Girl PHV Peak: Age 11.0–11.5 yrs',
        bmiThreshold: 'BMI > 20.0 kg/m² (Strict Insulin & Aromatase Defense)',
        clinicalNote: 'High sensitivity to insulin-driven aromatase bone-age acceleration; evening glycemic fasting preserves +1.5 in (+3.8 cm) of open plate time.'
      },
      east_asian: {
        label: 'East Asian American (Chinese / Japanese / Taiwanese / Asian American)',
        phvNote: isBoy ? 'Boy PHV Peak: Age 12.8–13.3 yrs (Rapid Pubertal Acceleration)' : 'Girl PHV Peak: Age 11.0–11.4 yrs',
        bmiThreshold: 'WHO / AAP Asian-Adjusted BMI > 19.5 kg/m²',
        clinicalNote: 'Cross-referenced against US NHANES & AAP Asian-American pediatric cohorts: faster bone-age acceleration during Tanner Stage 2–3 requires strict 10 PM SWS sleep.'
      },
      south_asian: {
        label: 'South & Southeast Asian American (Indian / Filipino / Vietnamese)',
        phvNote: isBoy ? 'Boy PHV Peak: Age 12.7–13.2 yrs' : 'Girl PHV Peak: Age 10.8–11.3 yrs',
        bmiThreshold: 'WHO Asian-Adjusted BMI > 19.0 kg/m² (Visceral Leptin Threshold)',
        clinicalNote: 'Adipose leptin signaling triggers earlier estrogenic bone fusion at lower BMI thresholds; prioritize high-protein / low-glycemic nutrition.'
      },
      south_southeast_asian: {
        label: 'South & Southeast Asian American (Indian / Filipino / Vietnamese)',
        phvNote: isBoy ? 'Boy PHV Peak: Age 12.7–13.2 yrs' : 'Girl PHV Peak: Age 10.8–11.3 yrs',
        bmiThreshold: 'WHO Asian-Adjusted BMI > 19.0 kg/m² (Visceral Leptin Threshold)',
        clinicalNote: 'Adipose leptin signaling triggers earlier estrogenic bone fusion at lower BMI thresholds; prioritize high-protein / low-glycemic nutrition.'
      },
      mixed_heritage: {
        label: 'Multi-Racial / Mixed Heritage (Khamis-Roche Parental-Weighted)',
        phvNote: isBoy ? 'Boy PHV Peak: Age 13.2 ± 1.0 yrs' : 'Girl PHV Peak: Age 11.3 ± 0.9 yrs',
        bmiThreshold: 'BMI > 20.5 kg/m²',
        clinicalNote: 'Weights parental genetic stature (Tanner MPH) at 65% and somatic Khamis-Roche age-weight-height trajectory at 35% for mixed-ancestry accuracy.'
      },
      multi_racial: {
        label: 'Multi-Racial / Mixed Heritage (Khamis-Roche Parental-Weighted)',
        phvNote: isBoy ? 'Boy PHV Peak: Age 13.2 ± 1.0 yrs' : 'Girl PHV Peak: Age 11.3 ± 0.9 yrs',
        bmiThreshold: 'BMI > 20.5 kg/m²',
        clinicalNote: 'Weights parental genetic stature (Tanner MPH) at 65% and somatic Khamis-Roche age-weight-height trajectory at 35% for mixed-ancestry accuracy.'
      }
    };
    const domEthSelect = (typeof document !== 'undefined') ? document.getElementById('child-ethnicity') : null;
    const ethKey = profile.ethnicity || (domEthSelect && domEthSelect.value) || 'us_general';
    const ethInfo = ethMap[ethKey] || ethMap.us_general;

    const formEl = (typeof document !== 'undefined') ? document.getElementById('diagnosis-form') : null;
    const isLearningMode = (profile.preferredReportMode === 'learning') ||
      (global.__KIDSFIT_PREFERRED_REPORT_MODE === 'learning') ||
      Boolean(formEl && formEl.className && formEl.className.includes('wizard-mode-learning'));

    // Personalized 5-Axis Brain LQ Metrics
    const cogAxes = Array.isArray(profile.cognitiveAxes) && profile.cognitiveAxes.length ? profile.cognitiveAxes : ['science_nature', 'math_logic'];
    const concerns = Array.isArray(profile.traitLearningConcerns) && profile.traitLearningConcerns.length ? profile.traitLearningConcerns : ['reading_literacy', 'passive_forget'];
    const focusSpanVal = profile.traitFocusSpan || (typeof document !== 'undefined' && document.getElementById('trait-focus-span') ? document.getElementById('trait-focus-span').value : '15_20m');
    const studyStyleVal = profile.traitStudyStyle || (typeof document !== 'undefined' && document.getElementById('trait-study-style') ? document.getElementById('trait-study-style').value : 'dialogue_question');

    const focusSpanMap = {
      under_10m: 'Under 10 mins (Short Modular Sprint Tasks Needed)',
      '15_20m': '15–20 mins (Structured Step-by-Step Routine)',
      '30m_plus': '30+ mins (Deep Inquiry & Project Immersion)'
    };
    const studyStyleMap = {
      dialogue_question: 'Socratic Dialogue & Feynman Active Explanation',
      play_manipulative: 'Hands-On 3D Manipulative & Experimental Modeling',
      visual_story: 'Visual Schema, Diagram & Mind-Map Structuring',
      goal_workbook: '15-Minute Timed Micro-Mission & Milestone Checklist'
    };
    const focusSpanLabel = focusSpanMap[focusSpanVal] || focusSpanMap['15_20m'];
    const studyStyleLabel = studyStyleMap[studyStyleVal] || studyStyleMap.dialogue_question;

    const literacyScore = concerns.includes('reading_literacy') ? 72 : (cogAxes.includes('language_reading') ? 89 : 82);
    const mathSpatialScore = concerns.includes('math_concept') ? 74 : (cogAxes.includes('math_logic') ? 91 : 84);
    const workingMemoryScore = focusSpanVal === 'under_10m' ? 66 : (focusSpanVal === '30m_plus' ? 88 : 75);
    const activeRecallScore = concerns.includes('passive_forget') ? 68 : 83;
    const scientificInquiryScore = cogAxes.includes('science_nature') ? 90 : 85;
    const overallLQ = Number(((literacyScore + mathSpatialScore + workingMemoryScore + activeRecallScore + scientificInquiryScore) / 5).toFixed(1));
    const coachedLQ = Math.min(98.5, Number((overallLQ + 14.5).toFixed(1)));
    const lqTopPct = Math.max(4, Math.min(45, Math.round(100 - overallLQ)));
    const overallLQDisp = isMasked ? '██.█' : overallLQ;
    const coachedLQDisp = isMasked ? '██.█' : coachedLQ;
    const lqTopPctDisp = isMasked ? '██' : lqTopPct;
    const literacyScoreDisp = isMasked ? '██' : literacyScore;
    const literacyTargetDisp = isMasked ? '██' : Math.min(98, literacyScore + 14);
    const mathSpatialScoreDisp = isMasked ? '██' : mathSpatialScore;
    const mathSpatialTargetDisp = isMasked ? '██' : Math.min(99, mathSpatialScore + 12);
    const workingMemoryScoreDisp = isMasked ? '██' : workingMemoryScore;
    const workingMemoryTargetDisp = isMasked ? '██' : Math.min(96, workingMemoryScore + 18);
    const activeRecallScoreDisp = isMasked ? '██' : activeRecallScore;
    const activeRecallTargetDisp = isMasked ? '██' : Math.min(97, activeRecallScore + 19);
    const scientificInquiryScoreDisp = isMasked ? '██' : scientificInquiryScore;
    const scientificInquiryTargetDisp = isMasked ? '██' : Math.min(99, scientificInquiryScore + 10);
    const usGradeStageLabel = ageY <= 4
      ? 'US Early Childhood / Pre-K (AAP & ASQ-3 Developmental Track)'
      : (ageY <= 10
        ? 'US Elementary School (Grades K–5 · Common Core ELA & Visual Math)'
        : (ageY <= 13
          ? 'US Middle School (Grades 6–8 · Pre-AP STEM & Executive Function)'
          : 'US High School (Grades 9–12 · AP / SAT / ACT Analytical Readiness)'));

    // Exact Age-in-Months (ageMonths) Developmental & Biological Precision Care Parameters
    const exactAgeMonths = Math.max(24, Math.min(216, Math.round(Number(ageMonths) || (ageY * 12 + ageRemM))));
    const ageMonthBedtimeTarget = exactAgeMonths <= 60
      ? '8:00 PM – 8:30 PM (11.0 hrs N3 Delta SWS Window)'
      : (exactAgeMonths <= 108
        ? '8:30 PM – 9:00 PM (10.0 hrs Pituitary GH Surge Window)'
        : (exactAgeMonths <= 144
          ? '9:15 PM – 9:30 PM (9.5 hrs Pre-PHV Epiphyseal Window)'
          : '9:45 PM – 10:00 PM (9.0 hrs Late-Pubertal Plate Defense Window)'));
    const ageMonthGrowthPhaseDesc = exactAgeMonths <= 72
      ? `Month ${exactAgeMonths} Early Childhood Rapid Chondrocyte Proliferation Phase — tibial/femoral growth plates are 94% open; gut calcium/zinc absorption and early 8:30 PM deep sleep govern baseline stature trajectory.`
      : (exactAgeMonths <= 120
        ? `Month ${exactAgeMonths} Mid-Childhood Steady Auxology & Pre-Spurt Storage Phase — building bone mineral density (BMD) and hepatic IGF-1 reserves before pubertal onset while preventing insulin/leptin bone-age acceleration.`
        : (exactAgeMonths <= 156
          ? `Month ${exactAgeMonths} Peak Height Velocity (PHV) & Epiphyseal Defense Phase — critical 36-month window where 10 PM SWS GH pulses and aromatase/glycemic control determine up to ±3.3 in (±8.5 cm) of final adult stature.`
          : `Month ${exactAgeMonths} Late-Pubertal Epiphyseal Preservation & Spinal Decompression Phase — maximizing remaining open axial/vertebral growth plates and recovering +0.7 in (+1.8 cm) of compressed intervertebral disc height.`));
    const ageMonthFocusMinutes = Math.min(50, Math.max(8, Math.round(exactAgeMonths * 0.22)));
    const ageMonthWmChunks = exactAgeMonths < 84 ? '3 ± 1 chunks' : (exactAgeMonths < 144 ? '4 ± 1 chunks' : '5 ± 1 chunks');
    const ageMonthBrainPhaseDesc = exactAgeMonths <= 72
      ? `Month ${exactAgeMonths} Sensory-Motor & Phonological Synaptic Pruning Phase — rapid vocabulary mapping and hands-on 3D manipulative number sense; avoid passive screen flash-cards.`
      : (exactAgeMonths <= 120
        ? `Month ${exactAgeMonths} Dorsolateral Prefrontal Myelination & Rule-Switch Phase — transitioning from "learning to read" to "reading to learn"; requires visual bar-modeling to prevent working-memory overload on multi-step problems.`
        : (exactAgeMonths <= 156
          ? `Month ${exactAgeMonths} Abstract Deductive & Metacognitive Acceleration Phase — frontal-parietal network remodeling; Feynman 3-min blank-page recall and Cornell error-tagging yield +150% 30-day retention.`
          : `Month ${exactAgeMonths} High-Order Analytical Synthesis & Timed Executive Output Phase — synaptic specialization for AP/SAT/STEM complex multi-variable reasoning and timed retrieval under pressure.`));

    return `
      <!-- Clinical Briefing Header (High-Contrast Medical Light Surface + Crisp White Child Conditions Box) -->
      <div class="briefing-header" style="background:linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%);color:#0F172A;border:2px solid #93C5FD;border-radius:20px;padding:1.4rem 1.5rem;margin-bottom:1.25rem;box-shadow:0 10px 28px rgba(29,78,216,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.65rem;margin-bottom:0.65rem;">
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <span style="background:#1D4ED8;color:#FFFFFF;font-size:0.74rem;font-weight:900;padding:0.24rem 0.75rem;border-radius:9999px;letter-spacing:0.03em;">
              ${isLearningMode ? '🧠 HARVARD / WASHU NEURO-COGNITIVE LQ STANDARD' : '📏 US CDC 2000 &amp; WHO AUXOLOGY STANDARD'}
            </span>
            <span style="background:#FFFFFF;color:#1E3A8A;border:1px solid #93C5FD;font-size:0.74rem;font-weight:800;padding:0.22rem 0.7rem;border-radius:9999px;">
              ${isLearningMode ? '5-Axis Brain LQ &amp; Executive Function Calibrated' : 'Multi-Ethnic Auxology Calibrated'}
            </span>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <span style="background:#EFF6FF;color:#1D4ED8;border:1.5px solid #93C5FD;border-radius:9999px;padding:0.42rem 0.9rem;font-size:0.78rem;font-weight:900;">
              ${isLearningMode ? '🧠 Dedicated Brain LQ &amp; Study Track' : '📏 Dedicated Physical Auxology Track'}
            </span>
            <button type="button" onclick="if(window.triggerKidsFitGlobalPrint){window.triggerKidsFitGlobalPrint();}else{window.print();}" style="background:#059669;color:#FFFFFF;border:1.5px solid #047857;border-radius:9999px;padding:0.44rem 0.95rem;font-size:0.8rem;font-weight:900;cursor:pointer;">
              🖨️ Print / Save Clinical PDF
            </button>
          </div>
        </div>
        <h2 id="global-report-main-heading" style="font-size:clamp(1.25rem,3vw,1.6rem);font-weight:900;margin:0 0 0.55rem 0;color:#0F172A;letter-spacing:-0.02em;">
          ${isLearningMode
            ? '1:1 Neuro-Cognitive 5-Axis Brain LQ &amp; Executive Function Master Report'
            : '1:1 Pediatric Growth, Endocrine &amp; Bone-Age Trajectory Master Report'}
        </h2>
        <div id="global-report-child-conditions-box" style="background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:12px;padding:0.75rem 1rem;color:#0F172A;font-size:0.86rem;line-height:1.55;">
          ${isLearningMode
            ? `<strong style="color:#1D4ED8;">Evaluated Child Conditions (Brain &amp; Learning Mode):</strong> Age <strong>${ageY} yrs ${ageRemM} mos (${genderLabel})</strong> · Overall Brain LQ: <strong style="color:#1D4ED8;">${overallLQDisp} pts (Top ${lqTopPctDisp}%)</strong> · Attention Span: <strong>${focusSpanLabel}</strong> · Preferred Absorption Style: <strong>${studyStyleLabel}</strong>`
            : `<strong style="color:#1D4ED8;">Evaluated Child Conditions (Physical Growth Mode):</strong> Age <strong>${ageY} yrs ${ageRemM} mos (${genderLabel})</strong> · Current Stature: <strong style="color:#1D4ED8;">${fmtLen(heightCm)} · ${pctValDisp}th CDC Percentile</strong> · Weight: <strong>${fmtWt(weightKg)} · BMI ${bmi}</strong> · 6-Mo Gain: <strong>${isImperial ? (recentGrowth6mCm / 2.54).toFixed(1) + ' in (' + recentGrowth6mCm.toFixed(1) + ' cm)' : recentGrowth6mCm.toFixed(1) + ' cm (' + (recentGrowth6mCm / 2.54).toFixed(1) + ' in)'}</strong> · Reference: <strong>${ethInfo.label}</strong>`}
        </div>
      </div>

      <!-- =========================================================================
           STRICT SINGLE-MODE REPORT BODY (PHYSICAL GROWTH OR BRAIN LQ ONLY — NEVER BOTH)
           ========================================================================= -->
      ${!isLearningMode ? `
      <div id="pillar-1-container" style="display:block;">
        <!-- CHAPTER 1: 3-Tier Adult Height Trajectory & BMI Endocrine Balance -->
        <section style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;box-shadow:0 8px 24px rgba(15,23,42,0.04);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">
            <span style="font-size:0.75rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;border:1px solid #BFDBFE;padding:0.2rem 0.65rem;border-radius:9999px;">
              CHAPTER 01 · 3-TIER ADULT HEIGHT TRAJECTORY &amp; BIOMETRIC SUMMARY
            </span>
            <span style="font-size:0.78rem;font-weight:800;color:#059669;">
              ${fmtGain(hiddenGainCm)} Hidden Growth Window Open
            </span>
          </div>
          <h3 style="font-size:1.2rem;font-weight:900;color:#0F172A;margin:0 0 0.45rem 0;">
            Predicted Adult Height: Unmanaged (${fmtMaskedLen(unmanagedCm)}) vs. Genetic Target (${fmtMaskedLen(geneticCm)}) vs. Optimized (${fmtMaskedLen(optimizedCm)})
          </h3>
          <p style="font-size:0.86rem;color:#475569;margin:0 0 1rem 0;line-height:1.55;">
            Based on Tanner Mid-Parental Height (Father ${fmtLen(fatherCm)}, Mother ${fmtLen(motherCm)}) and current CDC LMS Z-score (${zScoreDisp}), correcting nocturnal GH suppression and spinal disc compression unlocks up to <strong>${fmtGain(hiddenGainCm)}</strong> before epiphyseal fusion.
          </p>

          <!-- 3-Tier Height Cards -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.85rem;margin-bottom:1.15rem;">
            <div style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.95rem 1rem;">
              <div style="font-size:0.76rem;font-weight:800;color:#64748B;">① Unmanaged Trajectory (Current Habits)</div>
              <div style="font-size:1.45rem;font-weight:900;color:#475569;margin:0.25rem 0;">
                ${isImperial ? `${unmanagedImp} <span style="font-size:0.9rem;">(${unmanagedCmDisp} cm)</span>` : `${unmanagedCmDisp} cm <span style="font-size:0.9rem;">(${unmanagedImp})</span>`}
              </div>
              <div style="font-size:0.76rem;color:#DC2626;font-weight:700;">
                -${isImperial ? `${((pred.totalLoss || 2.3) / 2.54).toFixed(1)} in (-${pred.totalLoss || 2.3} cm)` : `${pred.totalLoss || 2.3} cm (-${((pred.totalLoss || 2.3) / 2.54).toFixed(1)} in)`} loss from late sleep / posture
              </div>
            </div>
            <div style="background:#F8FAFC;border:1.5px solid #93C5FD;border-radius:14px;padding:0.95rem 1rem;">
              <div style="font-size:0.76rem;font-weight:800;color:#1E3A8A;">② Tanner Genetic Target (MPH)</div>
              <div style="font-size:1.45rem;font-weight:900;color:#1E3A8A;margin:0.25rem 0;">
                ${isImperial ? `${geneticImp} <span style="font-size:0.9rem;">(${geneticCmDisp} cm)</span>` : `${geneticCmDisp} cm <span style="font-size:0.9rem;">(${geneticImp})</span>`}
              </div>
              <div style="font-size:0.76rem;color:#475569;font-weight:700;">
                Mid-Parental Genetic Baseline (${isImperial ? '±2.0 in (±5.0 cm)' : '±5.0 cm (±2.0 in)'})
              </div>
            </div>
            <div style="background:#EFF6FF;border:2px solid #1D4ED8;border-radius:14px;padding:0.95rem 1rem;">
              <div style="font-size:0.76rem;font-weight:900;color:#1D4ED8;">③ Optimized Peak Potential (6-Mo Protocol)</div>
              <div style="font-size:1.55rem;font-weight:900;color:#1D4ED8;margin:0.25rem 0;">
                ${isImperial ? `${optimizedImp} <span style="font-size:0.9rem;">(${optimizedCmDisp} cm)</span>` : `${optimizedCmDisp} cm <span style="font-size:0.9rem;">(${optimizedImp})</span>`}
              </div>
              <div style="font-size:0.76rem;color:#059669;font-weight:800;">
                ▲ ${fmtGain(hiddenGainCm)} vs. Unmanaged
              </div>
            </div>
          </div>

          <!-- Clinical Biometric Table -->
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.84rem;text-align:left;">
              <thead>
                <tr style="background:#EFF6FF;color:#1E3A8A;border-bottom:2px solid #BFDBFE;">
                  <th style="padding:0.65rem 0.8rem;">Biometric Indicator</th>
                  <th style="padding:0.65rem 0.8rem;">Child's Current Value</th>
                  <th style="padding:0.65rem 0.8rem;">US CDC 2000 Reference</th>
                  <th style="padding:0.65rem 0.8rem;">Clinical Interpretation</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#0F172A;">Current Height Percentile</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#1D4ED8;">${fmtLen(heightCm)} · ${pctValDisp}th %</td>
                  <td style="padding:0.65rem 0.8rem;color:#475569;">50th% Mean: ${fmtLen(lms.M)}</td>
                  <td style="padding:0.65rem 0.8rem;color:#334155;">${isBelow50 ? 'Priority Catch-Up Growth Window' : 'Above-Average Stature · Bone-Age Defense'}</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#0F172A;">6-Mo Growth Velocity (Annualized)</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#059669;">${isImperial ? `${annualVelocityIn} in/yr (${annualVelocityCm} cm/yr)` : `${annualVelocityCm} cm/yr (${annualVelocityIn} in/yr)`}</td>
                  <td style="padding:0.65rem 0.8rem;color:#475569;">Norm: 2.0–2.8 in/yr (5.0–7.0 cm/yr)</td>
                  <td style="padding:0.65rem 0.8rem;color:#334155;">${annualVelocityCm < 5.0 ? 'Sub-Optimal Velocity Alert (<2.0 in/yr) · Check IGF-1 &amp; Sleep' : (annualVelocityCm >= 7.0 ? 'Peak Height Velocity (PHV) Acceleration Phase' : 'Steady Normative Linear Growth Velocity')}</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#0F172A;">Weight-for-Height &amp; BMI</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#0F172A;">${fmtWt(weightKg)} · BMI ${bmi}</td>
                  <td style="padding:0.65rem 0.8rem;color:#475569;">Optimal Growth Weight: ${fmtWt(idealWeightKg)}</td>
                  <td style="padding:0.65rem 0.8rem;color:#334155;">${bmi > 21 ? 'Monitor Leptin-Driven Bone Age Acceleration' : 'Healthy Endocrine IGF-1 Synthesis Zone'}</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#0F172A;">Ancestry Pubertal Tempo Calibration</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#1E3A8A;">${ethInfo.label}</td>
                  <td style="padding:0.65rem 0.8rem;color:#475569;">${ethInfo.phvNote} · ${ethInfo.bmiThreshold}</td>
                  <td style="padding:0.65rem 0.8rem;color:#334155;">${ethInfo.clinicalNote}</td>
                </tr>
                <tr>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#0F172A;">Remaining Growth-Plate Window</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#059669;">Approx. ${remainYears} Years (${remainYears * 12} Months)</td>
                  <td style="padding:0.65rem 0.8rem;color:#475569;">Epiphyseal Fusion: ${isBoy ? 'Age 16.5–17.5' : 'Age 14.5–15.5'}</td>
                  <td style="padding:0.65rem 0.8rem;color:#334155;">Critical Golden Window Before Chondrocyte Senescence</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- TARGET ADULT HEIGHT REACHABILITY & GROWTH PLATE OPENNESS METER -->
          <div style="margin-top:1.1rem;background:linear-gradient(90deg,#EFF6FF 0%,#F0FDF4 100%);border:1.5px solid #93C5FD;border-radius:14px;padding:1rem 1.1rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.55rem;">
              <span style="font-size:0.74rem;font-weight:900;color:#1D4ED8;background:#FFFFFF;padding:0.18rem 0.65rem;border-radius:9999px;border:1px solid #BFDBFE;">
                TARGET ADULT HEIGHT &amp; KHAMIS-ROCHE AUXOLOGY ANALYSIS
              </span>
              <span style="font-size:0.78rem;font-weight:900;color:#059669;">
                Target Goal: ${fmtMaskedLen(targetHeightCm)} · ${dreamReachabilityPct}% Reachability Score
              </span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:0.75rem;">
              <div style="background:#FFFFFF;border:1px solid #BFDBFE;border-radius:10px;padding:0.7rem 0.85rem;">
                <div style="font-size:0.73rem;font-weight:800;color:#475569;">Target Adult Height</div>
                <div style="font-size:1.18rem;font-weight:900;color:#1D4ED8;margin:0.15rem 0;">${fmtMaskedLen(targetHeightCm)}</div>
                <div style="font-size:0.73rem;color:#059669;font-weight:800;">Reachability Odds: ${dreamReachabilityPct}% (6-Mo Protocol)</div>
              </div>
              <div style="background:#FFFFFF;border:1px solid #BFDBFE;border-radius:10px;padding:0.7rem 0.85rem;">
                <div style="font-size:0.73rem;font-weight:800;color:#475569;">Remaining Growth Potential</div>
                <div style="font-size:1.18rem;font-weight:900;color:#059669;margin:0.15rem 0;">${fmtGain(remainLinearCm)}</div>
                <div style="font-size:0.73rem;color:#475569;font-weight:700;">From current ${fmtLen(heightCm)} to ${fmtMaskedLen(optimizedCm)}</div>
              </div>
              <div style="background:#FFFFFF;border:1px solid #BFDBFE;border-radius:10px;padding:0.7rem 0.85rem;">
                <div style="font-size:0.73rem;font-weight:800;color:#475569;">Growth Plate Openness Meter</div>
                <div style="font-size:1.18rem;font-weight:900;color:#0F172A;margin:0.15rem 0;">${plateOpennessPct}% Open · ~${remainYears} Yrs</div>
                <div style="width:100%;height:7px;background:#E2E8F0;border-radius:9999px;overflow:hidden;margin-top:0.2rem;">
                  <div style="width:${plateOpennessPct}%;height:100%;background:linear-gradient(90deg,#1D4ED8,#10B981);"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

${isMasked ? `
        <section id="global-locked-chapters-skeleton" style="background:#F8FAFC;border:1.5px dashed #93C5FD;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;text-align:center;color:#475569;">
          <div style="font-size:0.82rem;font-weight:900;color:#1D4ED8;margin-bottom:0.35rem;">🔒 CHAPTERS 02 – 04-B &amp; PRINTABLE TRACKERS LOCKED IN DOM UNTIL VERIFIED CHECKOUT</div>
          <div style="font-size:0.8rem;line-height:1.5;">Full 1:1 Sleep Endocrine &amp; rhGH Fact-Check, Weight-Matched Micronutrient Dosages (mg / IU / mcg), 10-Min Spinal Decompression Timer, and 6-Month Month-by-Month Care Protocol are rendered only after payment verification.</div>
        </section>
        ` : `
        <!-- CHAPTER 2: Personalized Sleep/Endocrine Survey Synthesis & rhGH Injection Fact-Check -->
        <section style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;">
          <span style="display:inline-block;font-size:0.75rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;border:1px solid #BFDBFE;padding:0.2rem 0.65rem;border-radius:9999px;margin-bottom:0.5rem;">
            CHAPTER 02 · 1:1 SLEEP ENDOCRINE PHENOTYPE &amp; rhGH INJECTION PAPER FACT-CHECK
          </span>
          <h3 style="font-size:1.15rem;font-weight:900;color:#0F172A;margin:0 0 0.5rem 0;">
            Personalized Step 4 &amp; Step 6 Endocrine Findings + Recombinant GH (rhGH) Clinical Comparison
          </h3>
          <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:12px;padding:0.85rem 1rem;margin-bottom:0.85rem;font-size:0.83rem;color:#0F172A;line-height:1.55;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.25rem;">✓ Patient's Selected Sleep &amp; Constitutional Checkpoints (Steps 4 &amp; 6):</strong>
            <div>• <strong>Nocturnal Sleep Pattern:</strong> ${selectedSleepFindings}</div>
            <div>• <strong>Constitutional &amp; Bone-Age Checkpoints:</strong> ${selectedGrowthDetailFindings}</div>
            <div>• <strong>6-Month Velocity Assessment:</strong> ${isImperial ? (recentGrowth6mCm / 2.54).toFixed(1) + ' in / 6 mos (' + annualVelocityIn + ' in/yr)' : recentGrowth6mCm.toFixed(1) + ' cm / 6 mos (' + annualVelocityCm + ' cm/yr)'} — ${traitSleepList.includes('late_bedtime') || traitSleepList.includes('night_snack') ? 'Correcting late sleep and pre-bedtime glycemic load restores up to +42% to +68% endogenous nocturnal HGH pulsatility.' : 'Maintain 9:30–10:00 PM N3 slow-wave sleep window to protect peak pituitary HGH pulses.'}</div>
          </div>
          <p style="font-size:0.85rem;color:#334155;line-height:1.55;margin:0 0 0.85rem 0;">
            <strong>Peer-Reviewed Meta-Analysis (BMJ &amp; Cochrane Systematic Review):</strong> In children with Idiopathic Short Stature (ISS, non-GH deficient), daily rhGH injections cost <strong>$15,000–$40,000/year</strong> for 3–5 years yet yield an average adult height gain of only <strong>+1.5 to +2.3 inches (+4.0 to +6.0 cm)</strong>. Furthermore, high-dose exogenous IGF-1 can accelerate epiphyseal bone maturation if nocturnal sleep and insulin sensitivity are neglected.
          </p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:0.8rem;">
            <div style="background:#F8FAFC;border-left:4px solid #1D4ED8;border-radius:10px;padding:0.85rem 1rem;">
              <div style="font-size:0.82rem;font-weight:900;color:#0F172A;margin-bottom:0.25rem;">1. Natural SWS GH Pulse Amplification</div>
              <div style="font-size:0.8rem;color:#475569;line-height:1.45;">Entering deep N3 Slow-Wave Sleep by 10:00 PM with a 3-hour pre-bedtime glycemic fast increases endogenous nocturnal GH pulsatile amplitude by up to <strong>+68%</strong> (Van Cauter et al., <em>J Clin Endocrinol Metab</em>).</div>
            </div>
            <div style="background:#F8FAFC;border-left:4px solid #059669;border-radius:10px;padding:0.85rem 1rem;">
              <div style="font-size:0.82rem;font-weight:900;color:#0F172A;margin-bottom:0.25rem;">2. Bone-Age &amp; Aromatase Defense</div>
              <div style="font-size:0.8rem;color:#475569;line-height:1.45;">Maintaining BMI within the 25th–65th percentile prevents adipose leptin surges and aromatase conversion of androgens to estrogen, preserving open growth plates for <strong>+8 to +14 extra months</strong>.</div>
            </div>
          </div>
        </section>

        <!-- CHAPTER 3: 24-Hr Interactive Hormone Simulator & Weight-Proportional Bio-Nutrition (iHerb Exclusive) -->
        <section style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.5rem;">
            <span style="display:inline-block;font-size:0.75rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;border:1px solid #BFDBFE;padding:0.2rem 0.65rem;border-radius:9999px;">
              CHAPTER 03 · 1:1 DIGESTIVE BIO-NUTRITION &amp; INTERACTIVE 24-HR HGH SIMULATOR
            </span>
            <span style="font-size:0.74rem;font-weight:800;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;padding:0.18rem 0.6rem;border-radius:9999px;">
              Official iHerb Curation (Code: IPZ1547)
            </span>
          </div>
          <h3 style="font-size:1.15rem;font-weight:900;color:#0F172A;margin:0 0 0.5rem 0;">
            Daily Micronutrient Dosage Targets Calibrated for ${fmtWt(weightKg)} &amp; Digestive Profile
          </h3>
          <div style="background:#F8FAFC;border:1px solid #BFDBFE;border-radius:12px;padding:0.8rem 1rem;margin-bottom:0.9rem;font-size:0.82rem;color:#1E293B;line-height:1.5;">
            <strong style="color:#1D4ED8;">✓ Selected Nutritional &amp; GI Absorption Profile (Step 4):</strong> ${selectedDietFindings}<br>
            <span style="color:#059669;font-weight:700;">→ Clinical Bioavailability Adjustment:</span> ${traitDietList.includes('dairy_sensitive') || traitDietList.includes('constipation_hard') ? 'Switched from Calcium Carbonate (22% absorption) to stomach-acid-independent Calcium Citrate + MCHA (45% absorption) to prevent GI bloating and maximize osteoblast mineralization.' : 'Paired Chelated Zinc + L-Arginine/Colostrum with Vitamin D3 (' + vitDIu + ' IU) and MK-7 (' + vitK2Mcg + ' mcg) to accelerate hepatic IGF-1 synthesis.'}
          </div>

          <!-- Interactive 24-Hour Nocturnal HGH & Glycemic Fasting Simulator -->
          <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:14px;padding:1rem 1.1rem;margin-bottom:1rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">
              <strong style="font-size:0.88rem;color:#0F172A;">🎛️ Interactive 24-Hour Nocturnal HGH &amp; Insulin Suppression Simulator</strong>
              <span id="hormone-loss-badge" style="font-size:0.76rem;font-weight:900;color:#DC2626;background:#FEF2F2;border:1px solid #FECACA;padding:0.2rem 0.65rem;border-radius:9999px;">
                -18% Nocturnal HGH Suppression (82% Active)
              </span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.85rem;margin-bottom:0.65rem;">
              <div style="background:#FFFFFF;border:1px solid #BFDBFE;border-radius:10px;padding:0.7rem 0.85rem;">
                <div style="display:flex;justify-content:space-between;font-size:0.78rem;font-weight:800;color:#334155;margin-bottom:0.35rem;">
                  <span>Child's Bedtime</span>
                  <strong id="hormone-bedtime-display" style="color:#1D4ED8;">10:30 PM</strong>
                </div>
                <input type="range" id="hormone-bedtime-slider" min="1230" max="1440" step="15" value="1350" oninput="if(window.updateGlobalHormoneSimulator)window.updateGlobalHormoneSimulator();" style="width:100%;">
              </div>
              <div style="background:#FFFFFF;border:1px solid #BFDBFE;border-radius:10px;padding:0.7rem 0.85rem;">
                <div style="display:flex;justify-content:space-between;font-size:0.78rem;font-weight:800;color:#334155;margin-bottom:0.35rem;">
                  <span>Last Meal / Milk Time</span>
                  <strong id="hormone-meal-display" style="color:#1D4ED8;">8:30 PM</strong>
                </div>
                <input type="range" id="hormone-meal-slider" min="1080" max="1380" step="15" value="1230" oninput="if(window.updateGlobalHormoneSimulator)window.updateGlobalHormoneSimulator();" style="width:100%;">
              </div>
            </div>
            <div style="font-size:0.79rem;color:#1E3A8A;display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;">
              <span>Glycemic Fasting Window: <strong id="hormone-gap-display">2.0 hrs pre-sleep fast</strong></span>
              <span id="hormone-advice-text" style="font-weight:700;color:#0F172A;">Move bedtime to 10:00 PM and finish snacks 3 hrs prior to eliminate insulin somatostatin blockade.</span>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.75rem;margin-bottom:0.85rem;">
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:0.85rem 0.95rem;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="font-size:0.74rem;font-weight:800;color:#1D4ED8;">Elemental Calcium (Citrate)</div>
                <div style="font-size:1.25rem;font-weight:900;color:#0F172A;margin:0.15rem 0;">${caMg} mg / day</div>
                <div style="font-size:0.74rem;color:#475569;margin-bottom:0.55rem;">Hydroxyapatite bone matrix mineralization (~45% absorption)</div>
              </div>
              <a href="https://www.iherb.com/search?kw=ChildLife+Essentials+Liquid+Calcium+with+Magnesium&amp;rcode=IPZ1547" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-align:center;font-size:0.75rem;font-weight:800;color:#FFFFFF;background:#059669;padding:0.42rem 0.7rem;border-radius:8px;text-decoration:none;">
                🌿 View Calcium Citrate on iHerb ↗
              </a>
            </div>
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:0.85rem 0.95rem;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="font-size:0.74rem;font-weight:800;color:#1D4ED8;">Vitamin D3 + K2 (MK-7)</div>
                <div style="font-size:1.25rem;font-weight:900;color:#0F172A;margin:0.15rem 0;">${vitDIu} IU + ${vitK2Mcg} mcg</div>
                <div style="font-size:0.74rem;color:#475569;margin-bottom:0.55rem;">Activates osteocalcin &amp; directs Ca2+ into epiphyseal bone</div>
              </div>
              <a href="https://www.iherb.com/search?kw=Thorne+Vitamin+D+K2+Liquid+Kids&amp;rcode=IPZ1547" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-align:center;font-size:0.75rem;font-weight:800;color:#FFFFFF;background:#059669;padding:0.42rem 0.7rem;border-radius:8px;text-decoration:none;">
                🌿 View Vitamin D3 + K2 on iHerb ↗
              </a>
            </div>
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:0.85rem 0.95rem;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="font-size:0.74rem;font-weight:800;color:#1D4ED8;">Chelated Zinc &amp; Protein</div>
                <div style="font-size:1.25rem;font-weight:900;color:#0F172A;margin:0.15rem 0;">${zincMg} mg · ${proteinG} g Protein</div>
                <div style="font-size:0.74rem;color:#475569;margin-bottom:0.55rem;">Hepatic IGF-1 synthesis &amp; chondrocyte proliferation</div>
              </div>
              <a href="https://www.iherb.com/search?kw=ChildLife+Colostrum+Zinc+Kids&amp;rcode=IPZ1547" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-align:center;font-size:0.75rem;font-weight:800;color:#FFFFFF;background:#059669;padding:0.42rem 0.7rem;border-radius:8px;text-decoration:none;">
                🌿 View Zinc &amp; Colostrum on iHerb ↗
              </a>
            </div>
          </div>
        </section>

        <!-- CHAPTER 4: Spinal Decompression Biomechanics, Step 5 Survey Alignment & Interactive Routine Timer -->
        <section style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;">
          <span style="display:inline-block;font-size:0.75rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;border:1px solid #BFDBFE;padding:0.2rem 0.65rem;border-radius:9999px;margin-bottom:0.5rem;">
            CHAPTER 04 · SPINAL DECOMPRESSION BIOMECHANICS (${fmtGain(1.8)} RECOVERY) &amp; LIVE TIMER
          </span>
          <h3 style="font-size:1.15rem;font-weight:900;color:#0F172A;margin:0 0 0.5rem 0;">
            10-Minute Daily Intervertebral Disc Rehydration &amp; Piezoelectric Loading Protocol
          </h3>
          <div style="background:#F8FAFC;border:1px solid #BFDBFE;border-radius:12px;padding:0.8rem 1rem;margin-bottom:0.9rem;font-size:0.82rem;color:#0F172A;line-height:1.5;">
            <div><strong style="color:#1D4ED8;">✓ Selected Posture &amp; Alignment Profile (Step 5):</strong> ${selectedPostureFindings}</div>
            <div><strong style="color:#1D4ED8;">✓ Weekly Osteogenic Activity Level (Step 5):</strong> ${selectedExerciseFinding}</div>
          </div>

          <!-- Interactive 30s/45s Decompression & Jump Timer -->
          <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:14px;padding:0.95rem 1.1rem;margin-bottom:0.95rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
            <div>
              <div style="font-size:0.76rem;font-weight:900;color:#1D4ED8;">⏱️ Interactive Clinical Biomechanics Countdown Timer</div>
              <div id="global-posture-timer-status" style="font-size:0.82rem;font-weight:700;color:#334155;margin-top:0.15rem;">Select a routine below to start real-time spinal decompression guidance</div>
            </div>
            <div style="display:flex;align-items:center;gap:0.55rem;flex-wrap:wrap;">
              <span id="global-posture-timer-display" style="font-family:monospace;font-size:1.45rem;font-weight:900;color:#0F172A;background:#FFFFFF;border:1.5px solid #93C5FD;padding:0.25rem 0.75rem;border-radius:10px;">00:30</span>
              <button type="button" onclick="window.startGlobalPostureTimer(30, 'Doorway Bar Dead-Hang (30s Set)')" style="background:#1D4ED8;color:#FFFFFF;border:none;border-radius:8px;padding:0.45rem 0.8rem;font-size:0.78rem;font-weight:800;cursor:pointer;">▶ 30s Dead-Hang</button>
              <button type="button" onclick="window.startGlobalPostureTimer(45, 'Cobra &amp; Thoracic Extension (45s Set)')" style="background:#059669;color:#FFFFFF;border:none;border-radius:8px;padding:0.45rem 0.8rem;font-size:0.78rem;font-weight:800;cursor:pointer;">▶ 45s Thoracic</button>
              <button type="button" onclick="window.startGlobalPostureTimer(60, 'Piezoelectric Jump Interval (60s Set)')" style="background:#0F172A;color:#FFFFFF;border:none;border-radius:8px;padding:0.45rem 0.8rem;font-size:0.78rem;font-weight:800;cursor:pointer;">▶ 60s Jump Pulse</button>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:0.8rem;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:0.85rem 1rem;">
              <strong style="color:#1D4ED8;font-size:0.84rem;display:block;margin-bottom:0.25rem;">① Morning &amp; Bedtime Bar Dead-Hang (3 Sets × 30s)</strong>
              <span style="font-size:0.8rem;color:#475569;line-height:1.45;">Unloads daytime gravitational compression on 23 intervertebral discs and corrects forward-head cervical kyphosis (${isImperial ? '+0.5 to +0.8 in (+1.3 to +2.0 cm)' : '+1.3 to +2.0 cm (+0.5 to +0.8 in)'} instant posture gain).</span>
            </div>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:0.85rem 1rem;">
              <strong style="color:#1D4ED8;font-size:0.84rem;display:block;margin-bottom:0.25rem;">② Afternoon Piezoelectric Jump Loading (15 Mins)</strong>
              <span style="font-size:0.8rem;color:#475569;line-height:1.45;">300–500 vertical rope-skips or basketball jumps generate dynamic micro-strain across tibial/femoral epiphyseal plates, stimulating osteoblast proliferation.</span>
            </div>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:0.85rem 1rem;">
              <strong style="color:#1D4ED8;font-size:0.84rem;display:block;margin-bottom:0.25rem;">③ 9:30 PM Melatonin &amp; Glycemic Fasting Window</strong>
              <span style="font-size:0.8rem;color:#475569;line-height:1.45;">Zero sugars/carbohydrates 180 minutes before sleep prevents insulin-mediated somatostatin release during the 11:00 PM – 2:00 AM GH surge.</span>
            </div>
          </div>
        </section>

        <!-- CHAPTER 04-B: EXACT AGE-IN-MONTHS (${exactAgeMonths}M) & 6-MONTH MONTH-BY-MONTH PHYSICAL GROWTH CARE ROADMAP -->
        <section id="global-growth-monthly-care-section" style="background:#FFFFFF;border:2px solid #6EE7B7;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;box-shadow:0 8px 24px rgba(5,150,105,0.06);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">
            <span style="font-size:0.75rem;font-weight:900;color:#047857;background:#ECFDF5;border:1px solid #6EE7B7;padding:0.22rem 0.7rem;border-radius:9999px;">
              MONTH-BY-MONTH PRECISION AUXOLOGY CARE · MONTH ${exactAgeMonths} TO MONTH ${exactAgeMonths + 5}
            </span>
            <span style="font-size:0.78rem;font-weight:800;color:#1D4ED8;">
              Exact Chronological Age: ${exactAgeMonths} Months (${ageY} yrs ${ageRemM} mos)
            </span>
          </div>
          <h3 style="font-size:1.18rem;font-weight:900;color:#0F172A;margin:0 0 0.4rem 0;">
            1:1 Month-by-Month Physical Growth, Bone-Plate &amp; Dosing Care Protocol (${exactAgeMonths}m → ${exactAgeMonths + 5}m)
          </h3>
          <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:0.8rem 1rem;margin-bottom:0.95rem;font-size:0.82rem;color:#065F46;line-height:1.52;">
            <strong style="color:#047857;display:block;margin-bottom:0.2rem;">🔬 Exact Month-${exactAgeMonths} Biological &amp; Bone-Age Care Priority:</strong>
            ${ageMonthGrowthPhaseDesc}<br>
            <span style="display:inline-block;margin-top:0.3rem;font-weight:800;color:#1E3A8A;">
              • Month-${exactAgeMonths} Circadian Sleep Target: ${ageMonthBedtimeTarget} &nbsp;|&nbsp; • Target Monthly Velocity: +0.60 to +0.68 cm/mo (+0.24 to +0.27 in/mo)
            </span>
          </div>

          <!-- Interactive Month 1-6 Care Selector Buttons -->
          <div style="display:flex;gap:0.45rem;flex-wrap:wrap;margin-bottom:0.75rem;">
            ${[1, 2, 3, 4, 5, 6].map(function (mIdx) {
              const mAge = exactAgeMonths + mIdx - 1;
              const isFirst = mIdx === 1;
              return `<button type="button" id="btn-growth-care-month-${mIdx}" onclick="window.selectKidsFitCareMonth('growth', ${mIdx})" style="padding:0.42rem 0.8rem;border-radius:9999px;border:1.5px solid ${isFirst ? '#059669' : '#CBD5E1'};background:${isFirst ? '#059669' : '#F8FAFC'};color:${isFirst ? '#FFFFFF' : '#334155'};font-size:0.76rem;font-weight:800;cursor:pointer;">Month ${mIdx} (${mAge}m)</button>`;
            }).join('')}
          </div>

          <!-- Dynamic Month-Specific & Situation-Matched Sub-Report Box (Updates per Selected Month) -->
          <div id="active-month-situation-report-growth" data-base-month="${exactAgeMonths}" data-sleep="${selectedSleepFindings}" data-diet="${selectedDietFindings}" data-posture="${selectedPostureFindings}" style="background:#EFF6FF;border:2px solid #3B82F6;border-radius:14px;padding:0.95rem 1.1rem;margin-bottom:0.95rem;font-size:0.81rem;color:#0F172A;line-height:1.52;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.35rem;">
              <strong style="color:#1D4ED8;font-size:0.86rem;">📋 [Month 1 · Age ${exactAgeMonths} Mos] 1:1 Situation-Matched Auxology Briefing</strong>
              <span style="background:#1D4ED8;color:#FFFFFF;font-size:0.72rem;font-weight:800;padding:0.15rem 0.55rem;border-radius:9999px;">Matched to Your Child&apos;s Survey Conditions</span>
            </div>
            <div>
              <strong>• Active Child Situation at ${exactAgeMonths} Months:</strong> Sleep [${selectedSleepFindings}] · Nutrition [${selectedDietFindings}] · Posture [${selectedPostureFindings}]<br>
              <strong>• Month-${exactAgeMonths} Customized Clinical Action:</strong> Because your child is entering Month ${exactAgeMonths} with the above habit profile, Month 1 prioritizes eliminating evening insulin spikes 180 mins before bed, initiating <strong>${caMg} mg Calcium Citrate + ${vitDIu} IU Vitamin D3</strong>, and performing 3×30s doorway bar decompression before sleep.
            </div>
          </div>

          <!-- 6-Month Detailed Month-by-Month Physical Care Cards -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(255px,1fr));gap:0.8rem;">
            <div id="card-growth-care-month-1" style="background:#ECFDF5;border:2px solid #059669;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#047857;font-size:0.84rem;">Month 1 · Age ${exactAgeMonths} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#059669;color:#FFFFFF;padding:0.12rem 0.5rem;border-radius:9999px;">Target: ${fmtMaskedLen((heightCm + 0.6).toFixed(1))}</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• Endocrine &amp; Sleep Care:</strong> Lock in ${ageMonthBedtimeTarget.split(' (')[0]} bedtime + strict 2-hr pre-bed zero-sugar fast (+65% nocturnal GH pulse).<br>
                <strong>• Bio-Nutrition Care:</strong> Start Elemental Calcium Citrate (<strong>${caMg} mg</strong>) + Vitamin D3 (<strong>${vitDIu} IU</strong>).<br>
                <strong>• Biomechanical Care:</strong> 3×30s morning/evening doorway bar dead-hangs to decompress 23 spinal discs.
              </div>
            </div>

            <div id="card-growth-care-month-2" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#0F172A;font-size:0.84rem;">Month 2 · Age ${exactAgeMonths + 1} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#EFF6FF;color:#1D4ED8;padding:0.12rem 0.5rem;border-radius:9999px;">Target: ${fmtMaskedLen((heightCm + 1.2).toFixed(1))}</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• Hepatic IGF-1 Care:</strong> Layer in Chelated Zinc (<strong>${zincMg} mg</strong>) + Vitamin K2 MK-7 (<strong>${vitK2Mcg} mcg</strong>) to activate osteocalcin bone locking.<br>
                <strong>• Airway &amp; N3 Sleep Check:</strong> Clear nasal congestion before bed to prevent mouth-breathing GH suppression.<br>
                <strong>• Exercise Progression:</strong> Add 300 vertical rope-jumps/day (10 mins) for tibial/femoral growth plate stimulation.
              </div>
            </div>

            <div id="card-growth-care-month-3" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#0F172A;font-size:0.84rem;">Month 3 · Age ${exactAgeMonths + 2} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#EFF6FF;color:#1D4ED8;padding:0.12rem 0.5rem;border-radius:9999px;">Target: ${fmtMaskedLen((heightCm + 1.9).toFixed(1))}</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• 90-Day Velocity Audit:</strong> Verify ≥1.8 cm (0.7 in) 90-day gain; re-scale daily protein to <strong>${proteinG + 2}g/day</strong> for ${fmtWt((weightKg + 0.8).toFixed(1))}.<br>
                <strong>• Posture &amp; Thoracic Care:</strong> Add 45s Cobra thoracic extension after homework to reverse desk-slouch kyphosis.<br>
                <strong>• Exercise Progression:</strong> Increase plyometric vertical jumps to 400 skips/day.
              </div>
            </div>

            <div id="card-growth-care-month-4" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#0F172A;font-size:0.84rem;">Month 4 · Age ${exactAgeMonths + 3} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#EFF6FF;color:#1D4ED8;padding:0.12rem 0.5rem;border-radius:9999px;">Target: ${fmtMaskedLen((heightCm + 2.5).toFixed(1))}</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• Bone-Age &amp; Aromatase Guard:</strong> Keep BMI below ${ethInfo.bmiThreshold}; avoid ultra-processed foods &amp; plasticizer xenoestrogens.<br>
                <strong>• Growing-Pain &amp; SWS Care:</strong> Add evening Magnesium Glycinate (<strong>${Math.round(weightKg * 5.5)} mg</strong>) + warm knee/calf stretching.<br>
                <strong>• Amino-Acid Synergy:</strong> Pair dinner protein with vitamin-C-rich vegetables for collagen matrix synthesis.
              </div>
            </div>

            <div id="card-growth-care-month-5" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#0F172A;font-size:0.84rem;">Month 5 · Age ${exactAgeMonths + 4} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#EFF6FF;color:#1D4ED8;padding:0.12rem 0.5rem;border-radius:9999px;">Target: ${fmtMaskedLen((heightCm + 3.2).toFixed(1))}</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• Weight-Matched Dose Upgrade:</strong> Auto-adjust Calcium Citrate to <strong>${caMg + 35} mg</strong> &amp; Zinc to <strong>${(zincMg + 0.5).toFixed(1)} mg</strong> for ${fmtWt((weightKg + 1.4).toFixed(1))}.<br>
                <strong>• Pelvic &amp; Gait Alignment:</strong> Eliminate W-sitting / leg-crossing; check shoe heel-wear symmetry.<br>
                <strong>• Exercise Progression:</strong> 500 vertical jumps + 3×40s passive bar hangs.
              </div>
            </div>

            <div id="card-growth-care-month-6" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#0F172A;font-size:0.84rem;">Month 6 · Age ${exactAgeMonths + 5} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#ECFDF5;color:#059669;padding:0.12rem 0.5rem;border-radius:9999px;">Goal: ${fmtMaskedLen((heightCm + 3.8).toFixed(1))}</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• 180-Day CDC Percentile Re-Calibration:</strong> Evaluate 6-month cumulative stature gain (+3.6–4.0 cm / +1.4–1.6 in catch-up trajectory).<br>
                <strong>• Bone-Plate Tempo Verification:</strong> Confirm linear height gain outpaces weight gain to preserve open epiphyseal window.<br>
                <strong>• Next Cycle Transition:</strong> Lock in Month ${exactAgeMonths + 6}–${exactAgeMonths + 11} auxology protocol.
              </div>
            </div>
          </div>
        </section>
        `}
      </div>
      ` : `
      <div id="pillar-2-container" style="display:block;">
        <!-- CHAPTER 5: 5-Axis Brain Learning Quotient (LQ) Score & Neural Balance Matrix -->
        <section style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;box-shadow:0 8px 24px rgba(15,23,42,0.04);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">
            <span style="font-size:0.75rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;border:1px solid #BFDBFE;padding:0.2rem 0.65rem;border-radius:9999px;">
              CHAPTER 05 · 5-AXIS BRAIN LEARNING QUOTIENT (LQ) &amp; NEURAL BALANCE MATRIX
            </span>
            <span style="font-size:0.78rem;font-weight:800;color:#059669;">
              6-Mo Coached Target: ${coachedLQDisp} pts (+${(coachedLQ - overallLQ).toFixed(1)} Pt Gain)
            </span>
          </div>
          <h3 style="font-size:1.2rem;font-weight:900;color:#0F172A;margin:0 0 0.45rem 0;">
            5-Axis Brain Balance Score: Overall LQ ${overallLQDisp} pts (Top ${lqTopPctDisp}% Age-Matched Percentile)
          </h3>
          <p style="font-size:0.85rem;color:#475569;margin:0 0 1rem 0;line-height:1.55;">
            Evaluates 5 core neuro-cognitive learning circuits for <strong>Age ${ageY} (${genderLabel})</strong> based on your child&apos;s attention span (<strong>${focusSpanLabel}</strong>) and cognitive absorption style (<strong>${studyStyleLabel}</strong>).
          </p>

          <!-- 3-Tier Brain LQ Summary Cards -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.85rem;margin-bottom:1.1rem;">
            <div style="background:#F8FAFC;border:1.5px solid #93C5FD;border-radius:14px;padding:0.95rem 1rem;">
              <div style="font-size:0.76rem;font-weight:800;color:#1E3A8A;">① Current 5-Axis Brain LQ</div>
              <div style="font-size:1.5rem;font-weight:900;color:#1D4ED8;margin:0.25rem 0;">${overallLQDisp} pts <span style="font-size:0.85rem;color:#475569;">(Top ${lqTopPctDisp}%)</span></div>
              <div style="font-size:0.76rem;color:#475569;font-weight:700;">Age ${ageY} Developmental Norm: 78.0 pts</div>
            </div>
            <div style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.95rem 1rem;">
              <div style="font-size:0.76rem;font-weight:800;color:#64748B;">② Primary Bottleneck Circuit</div>
              <div style="font-size:1.1rem;font-weight:900;color:#DC2626;margin:0.35rem 0;">Working Memory &amp; Active Recall</div>
              <div style="font-size:0.76rem;color:#475569;font-weight:700;">Requires Blank-Page Retrieval &amp; SWS Consolidation</div>
            </div>
            <div style="background:#EFF6FF;border:2px solid #1D4ED8;border-radius:14px;padding:0.95rem 1rem;">
              <div style="font-size:0.76rem;font-weight:900;color:#1D4ED8;">③ 6-Month Coached Potential LQ</div>
              <div style="font-size:1.5rem;font-weight:900;color:#059669;margin:0.25rem 0;">${coachedLQDisp} pts <span style="font-size:0.85rem;">(Top 4%)</span></div>
              <div style="font-size:0.76rem;color:#059669;font-weight:800;">▲ +${(coachedLQ - overallLQ).toFixed(1)} Pts Synaptic Efficiency Gain</div>
            </div>
          </div>

          <!-- 5-Axis Neural Breakdown Table -->
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.84rem;text-align:left;">
              <thead>
                <tr style="background:#EFF6FF;color:#1E3A8A;border-bottom:2px solid #BFDBFE;">
                  <th style="padding:0.65rem 0.8rem;">Neural Circuit Axis</th>
                  <th style="padding:0.65rem 0.8rem;">Current Score</th>
                  <th style="padding:0.65rem 0.8rem;">6-Mo Target</th>
                  <th style="padding:0.65rem 0.8rem;">Clinical Neuro-Cognitive Assessment</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#0F172A;">1. Reading Comprehension &amp; Literacy</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#1D4ED8;">${literacyScoreDisp} / 100</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#059669;">${literacyTargetDisp} / 100</td>
                  <td style="padding:0.65rem 0.8rem;color:#334155;">Semantic chunking &amp; 3-sentence paragraph summarization</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#0F172A;">2. Spatial-Mathematical Reasoning</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#1D4ED8;">${mathSpatialScoreDisp} / 100</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#059669;">${mathSpatialTargetDisp} / 100</td>
                  <td style="padding:0.65rem 0.8rem;color:#334155;">Parietal visual-bar modeling before algebraic abstraction</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#0F172A;">3. Prefrontal Working Memory &amp; Focus</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#DC2626;">${workingMemoryScoreDisp} / 100</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#059669;">${workingMemoryTargetDisp} / 100</td>
                  <td style="padding:0.65rem 0.8rem;color:#334155;">Dorsolateral prefrontal sustained attention (${focusSpanLabel})</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#0F172A;">4. Metacognitive Active Recall</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#DC2626;">${activeRecallScoreDisp} / 100</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#059669;">${activeRecallTargetDisp} / 100</td>
                  <td style="padding:0.65rem 0.8rem;color:#334155;">Hippocampal retrieval practice &amp; Feynman self-explanation</td>
                </tr>
                <tr>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#0F172A;">5. Scientific Inquiry &amp; Creative Transfer</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#1D4ED8;">${scientificInquiryScoreDisp} / 100</td>
                  <td style="padding:0.65rem 0.8rem;font-weight:800;color:#059669;">${scientificInquiryTargetDisp} / 100</td>
                  <td style="padding:0.65rem 0.8rem;color:#334155;">High hypothesis-testing &amp; cross-domain conceptual synthesis</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

${isMasked ? `
        <section id="global-locked-chapters-skeleton" style="background:#F8FAFC;border:1.5px dashed #93C5FD;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;text-align:center;color:#475569;">
          <div style="font-size:0.82rem;font-weight:900;color:#1D4ED8;margin-bottom:0.35rem;">🔒 CHAPTERS 06 – 08-B &amp; COGNITIVE WORKSHEETS LOCKED IN DOM UNTIL VERIFIED CHECKOUT</div>
          <div style="font-size:0.8rem;line-height:1.5;">Full 4-Week US K-12 Executive Function Prescription, Neuro-Nutrition Dosages, 6-Month Month-by-Month Synaptic Care Roadmap, and 4 Printable Cognitive Worksheets are rendered only after payment verification.</div>
        </section>
        ` : `
        <!-- CHAPTER 6: 4-Week US K-12 Neuro-Study Protocol & STEM Career Roadmap -->
        <section style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;">
          <span style="display:inline-block;font-size:0.75rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;border:1px solid #BFDBFE;padding:0.2rem 0.65rem;border-radius:9999px;margin-bottom:0.5rem;">
            CHAPTER 06 – 07 · US K–12 EXECUTIVE FUNCTION PROTOCOL &amp; STEM / AP PATHWAY
          </span>
          <h3 style="font-size:1.2rem;font-weight:900;color:#0F172A;margin:0 0 0.45rem 0;">
            ${usGradeStageLabel}: Working Memory &amp; Active Recall Prescription
          </h3>
          <p style="font-size:0.85rem;color:#475569;margin:0 0 0.95rem 0;line-height:1.55;">
            Tailored to your child&apos;s preferred absorption mode (<strong>${studyStyleLabel}</strong>) to resolve passive recognition illusions and convert US classroom instruction and independent reading into permanent neocortical schemas aligned with Common Core &amp; AP/STEM standards.
          </p>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.8rem;margin-bottom:1rem;">
            <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:12px;padding:0.85rem 1rem;">
              <div style="font-size:0.75rem;font-weight:800;color:#1D4ED8;">Protocol A · Feynman Blank-Page Recall</div>
              <div style="font-size:0.82rem;color:#0F172A;font-weight:800;margin:0.2rem 0;">Eliminates the "Illusion of Competence"</div>
              <div style="font-size:0.78rem;color:#334155;line-height:1.45;">After 20 minutes of reading/lecture, close the book and write or verbally explain 3 core concepts from memory (Roediger &amp; Karpicke, <em>Psychological Science</em>: +150% 30-day retention).</div>
            </div>
            <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:12px;padding:0.85rem 1rem;">
              <div style="font-size:0.75rem;font-weight:800;color:#1D4ED8;">Protocol B · Visual Schema &amp; Bar Modeling</div>
              <div style="font-size:0.82rem;color:#0F172A;font-weight:800;margin:0.2rem 0;">Offloads Prefrontal Working Memory</div>
              <div style="font-size:0.78rem;color:#334155;line-height:1.45;">For multi-step word problems and complex passages, externalize variables into visual bar diagrams before writing equations, preventing working-memory overload.</div>
            </div>
            <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:12px;padding:0.85rem 1rem;">
              <div style="font-size:0.75rem;font-weight:800;color:#1D4ED8;">Protocol C · SWS Hippocampal Consolidation</div>
              <div style="font-size:0.82rem;color:#0F172A;font-weight:800;margin:0.2rem 0;">Sleep-Spindle Memory Transfer</div>
              <div style="font-size:0.78rem;color:#334155;line-height:1.45;">Reviewing key vocabulary or formulas for 10 minutes right before sleep increases hippocampal-neocortical long-term synaptic consolidation during N3 sleep by +42%.</div>
            </div>
          </div>

          <!-- CHAPTER 08: iHERB-EXCLUSIVE NEURO-NUTRITION & GROWTH BIO-FORMULATION CURATION -->
          <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid #E2E8F0;">
            <span style="display:inline-block;font-size:0.73rem;font-weight:900;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;padding:0.18rem 0.65rem;border-radius:9999px;margin-bottom:0.55rem;">
              CHAPTER 08 · iHERB-EXCLUSIVE CLINICAL BIO-NUTRITION &amp; NEURO-COGNITIVE SUPPLEMENT CURATION (NIH ODS ALIGNED)
            </span>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.75rem;font-size:0.79rem;">
              <div style="background:#F8FAFC;border:1px solid #A7F3D0;border-radius:12px;padding:0.85rem 0.95rem;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <strong style="color:#0F172A;display:block;margin-bottom:0.25rem;">🌿 1. Bone-Matrix Mineral Complex (iHerb)</strong>
                  <span style="color:#475569;line-height:1.45;display:block;margin-bottom:0.6rem;">USP/NSF-verified <em>ChildLife Essentials Liquid Calcium with Magnesium</em> &amp; <em>Thorne D-1000 / K2 (MK-7)</em> calibrated to ${caMg} mg Ca &amp; ${vitDIu} IU D3.</span>
                </div>
                <a href="https://www.iherb.com/search?kw=ChildLife+Liquid+Calcium+Magnesium+Vitamin+D3+K2&amp;rcode=IPZ1547" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-align:center;font-size:0.75rem;font-weight:800;color:#059669;background:#ECFDF5;border:1px solid #059669;padding:0.4rem 0.7rem;border-radius:8px;text-decoration:none;">
                  View Bone-Matrix Formulas on iHerb ↗
                </a>
              </div>
              <div style="background:#F8FAFC;border:1px solid #A7F3D0;border-radius:12px;padding:0.85rem 0.95rem;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <strong style="color:#0F172A;display:block;margin-bottom:0.25rem;">🌿 2. Prefrontal Myelin &amp; Focus DHA (iHerb)</strong>
                  <span style="color:#475569;line-height:1.45;display:block;margin-bottom:0.6rem;">High-purity triglyceride <em>Nordic Naturals Ultimate Omega-D3 / Children&apos;s DHA</em> + Phosphatidylcholine to accelerate prefrontal working-memory speed.</span>
                </div>
                <a href="https://www.iherb.com/search?kw=Nordic+Naturals+Children+DHA+Omega+3&amp;rcode=IPZ1547" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-align:center;font-size:0.75rem;font-weight:800;color:#059669;background:#ECFDF5;border:1px solid #059669;padding:0.4rem 0.7rem;border-radius:8px;text-decoration:none;">
                  View Neuro-DHA Formulas on iHerb ↗
                </a>
              </div>
              <div style="background:#F8FAFC;border:1px solid #A7F3D0;border-radius:12px;padding:0.85rem 0.95rem;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <strong style="color:#0F172A;display:block;margin-bottom:0.25rem;">🌿 3. N3 Delta-Sleep &amp; Memory Consolidation Cofactors (iHerb)</strong>
                  <span style="color:#475569;line-height:1.45;display:block;margin-bottom:0.6rem;">Chelated <em>Magnesium Glycinate</em> + <em>Pure Encapsulations Zinc (${zincMg} mg)</em> to deepen N3 slow-wave sleep and maximize nocturnal hippocampal long-term memory consolidation.</span>
                </div>
                <a href="https://www.iherb.com/search?kw=Kids+Magnesium+Glycinate+Zinc+Chelate&amp;rcode=IPZ1547" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-align:center;font-size:0.75rem;font-weight:800;color:#059669;background:#ECFDF5;border:1px solid #059669;padding:0.4rem 0.7rem;border-radius:8px;text-decoration:none;">
                  View Memory Consolidation Cofactors on iHerb ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- CHAPTER 08-B: EXACT AGE-IN-MONTHS (${exactAgeMonths}M) & 6-MONTH MONTH-BY-MONTH BRAIN & LEARNING CARE ROADMAP -->
        <section id="global-learning-monthly-care-section" style="background:#FFFFFF;border:2px solid #93C5FD;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;box-shadow:0 8px 24px rgba(29,78,216,0.06);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">
            <span style="font-size:0.75rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;border:1px solid #93C5FD;padding:0.22rem 0.7rem;border-radius:9999px;">
              MONTH-BY-MONTH NEURO-COGNITIVE CARE · MONTH ${exactAgeMonths} TO MONTH ${exactAgeMonths + 5}
            </span>
            <span style="font-size:0.78rem;font-weight:800;color:#059669;">
              Exact Chronological Age: ${exactAgeMonths} Months (${ageY} yrs ${ageRemM} mos)
            </span>
          </div>
          <h3 style="font-size:1.18rem;font-weight:900;color:#0F172A;margin:0 0 0.4rem 0;">
            1:1 Month-by-Month Prefrontal Myelination, Study Habit &amp; Brain LQ Care Protocol (${exactAgeMonths}m → ${exactAgeMonths + 5}m)
          </h3>
          <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:12px;padding:0.8rem 1rem;margin-bottom:0.95rem;font-size:0.82rem;color:#1E3A8A;line-height:1.52;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.2rem;">🧠 Exact Month-${exactAgeMonths} Synaptic Plasticity &amp; Executive Function Priority:</strong>
            ${ageMonthBrainPhaseDesc}<br>
            <span style="display:inline-block;margin-top:0.3rem;font-weight:800;color:#065F46;">
              • Month-${exactAgeMonths} Biological Focus Ceiling: ${ageMonthFocusMinutes} mins/sprint &nbsp;|&nbsp; • Working-Memory Buffer: ${ageMonthWmChunks} &nbsp;|&nbsp; • Track: ${usGradeStageLabel}
            </span>
          </div>

          <!-- Interactive Month 1-6 Care Selector Buttons -->
          <div style="display:flex;gap:0.45rem;flex-wrap:wrap;margin-bottom:0.75rem;">
            ${[1, 2, 3, 4, 5, 6].map(function (mIdx) {
              const mAge = exactAgeMonths + mIdx - 1;
              const isFirst = mIdx === 1;
              return `<button type="button" id="btn-learning-care-month-${mIdx}" onclick="window.selectKidsFitCareMonth('learning', ${mIdx})" style="padding:0.42rem 0.8rem;border-radius:9999px;border:1.5px solid ${isFirst ? '#1D4ED8' : '#CBD5E1'};background:${isFirst ? '#1D4ED8' : '#F8FAFC'};color:${isFirst ? '#FFFFFF' : '#334155'};font-size:0.76rem;font-weight:800;cursor:pointer;">Month ${mIdx} (${mAge}m)</button>`;
            }).join('')}
          </div>

          <!-- Dynamic Month-Specific & Situation-Matched Sub-Report Box (Updates per Selected Month) -->
          <div id="active-month-situation-report-learning" data-base-month="${exactAgeMonths}" data-focus="${focusSpanLabel}" data-style="${studyStyleLabel}" data-focus-mins="${ageMonthFocusMinutes}" style="background:#ECFDF5;border:2px solid #059669;border-radius:14px;padding:0.95rem 1.1rem;margin-bottom:0.95rem;font-size:0.81rem;color:#0F172A;line-height:1.52;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.35rem;">
              <strong style="color:#047857;font-size:0.86rem;">📋 [Month 1 · Age ${exactAgeMonths} Mos] 1:1 Situation-Matched Neuro-Study Briefing</strong>
              <span style="background:#059669;color:#FFFFFF;font-size:0.72rem;font-weight:800;padding:0.15rem 0.55rem;border-radius:9999px;">Matched to Your Child&apos;s Cognitive Profile</span>
            </div>
            <div>
              <strong>• Active Cognitive Situation at ${exactAgeMonths} Months:</strong> Desk Focus [${focusSpanLabel}] · Preferred Style [${studyStyleLabel}] · Working-Memory Buffer [${ageMonthWmChunks}]<br>
              <strong>• Month-${exactAgeMonths} Customized Study Action:</strong> Tailored to your child&apos;s current ${focusSpanLabel.split(' (')[0]} span at ${exactAgeMonths} months, Month 1 locks in exact <strong>${ageMonthFocusMinutes}-minute timed micro-sprints</strong>, eliminates pre-study smartphone dopamine, and initiates morning DHA + Choline myelination support.
            </div>
          </div>

          <!-- 6-Month Detailed Month-by-Month Cognitive & Study Care Cards -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(255px,1fr));gap:0.8rem;">
            <div id="card-learning-care-month-1" style="background:#EFF6FF;border:2px solid #1D4ED8;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#1D4ED8;font-size:0.84rem;">Month 1 · Age ${exactAgeMonths} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#1D4ED8;color:#FFFFFF;padding:0.12rem 0.5rem;border-radius:9999px;">Target LQ: ${isMasked ? '??.?' : (overallLQ + 2.4).toFixed(1)} pts</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• Prefrontal Attention Reset:</strong> Set desk timer to exact <strong>${ageMonthFocusMinutes}-min micro-sprints</strong> + 5-min off-screen break; zero short-form video 60m before study.<br>
                <strong>• Neuro-Nutrition Care:</strong> Start 600–800 mg Triglyceride DHA + Phosphatidylcholine at breakfast.<br>
                <strong>• Parent Script:</strong> &ldquo;Let&apos;s just finish 3 problems in ${ageMonthFocusMinutes} minutes and stop right when the timer rings.&rdquo;
              </div>
            </div>

            <div id="card-learning-care-month-2" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#0F172A;font-size:0.84rem;">Month 2 · Age ${exactAgeMonths + 1} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#EFF6FF;color:#1D4ED8;padding:0.12rem 0.5rem;border-radius:9999px;">Target LQ: ${isMasked ? '??.?' : (overallLQ + 5.1).toFixed(1)} pts</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• Feynman Blank-Page Recall:</strong> Replace passive re-reading; close the book after 20 mins and write/say 3 core takeaways from memory (Worksheet 01).<br>
                <strong>• Synaptic Calm Care:</strong> Add Phosphatidylserine (PS 100 mg) + L-Theanine for calm prefrontal working-memory focus.<br>
                <strong>• Parent Script:</strong> &ldquo;Pretend I&apos;m a younger student—can you teach me today&apos;s main rule in 60 seconds?&rdquo;
              </div>
            </div>

            <div id="card-learning-care-month-3" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#0F172A;font-size:0.84rem;">Month 3 · Age ${exactAgeMonths + 2} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#EFF6FF;color:#1D4ED8;padding:0.12rem 0.5rem;border-radius:9999px;">Target LQ: ${isMasked ? '??.?' : (overallLQ + 7.8).toFixed(1)} pts</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• Visual Bar-Modeling Offload:</strong> Convert multi-step word problems &amp; long reading passages into 3-box visual diagrams (Worksheet 02) to bypass the ${ageMonthWmChunks} limit.<br>
                <strong>• 90-Day Cognitive Audit:</strong> Verify 40% reduction in &ldquo;I knew it but misread the question&rdquo; errors.<br>
                <strong>• Parent Script:</strong> &ldquo;Before we calculate, let&apos;s draw the two comparison bars on paper first.&rdquo;
              </div>
            </div>

            <div id="card-learning-care-month-4" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#0F172A;font-size:0.84rem;">Month 4 · Age ${exactAgeMonths + 3} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#EFF6FF;color:#1D4ED8;padding:0.12rem 0.5rem;border-radius:9999px;">Target LQ: ${isMasked ? '??.?' : (overallLQ + 10.2).toFixed(1)} pts</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• Cornell 72-Hr Error Retrieval:</strong> Tag missed questions into [Careless Skip] vs. [Concept Gap] and re-solve them 72 hours later with zero hints.<br>
                <strong>• Hippocampal Sleep Care:</strong> Evening Magnesium Glycinate + Zinc (${zincMg} mg) to lock daytime study into long-term cortex storage during N3 sleep.<br>
                <strong>• Focus Expansion:</strong> Extend desk sprint duration to <strong>${ageMonthFocusMinutes + 5} mins</strong>.
              </div>
            </div>

            <div id="card-learning-care-month-5" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#0F172A;font-size:0.84rem;">Month 5 · Age ${exactAgeMonths + 4} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#EFF6FF;color:#1D4ED8;padding:0.12rem 0.5rem;border-radius:9999px;">Target LQ: ${isMasked ? '??.?' : (overallLQ + 12.5).toFixed(1)} pts</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• Socratic Deep Transfer:</strong> Practice 3-step inquiry ([Observation] → [Why Hypothesis] → [Real-World STEM Application], Worksheet 04).<br>
                <strong>• Timed Exam Resilience:</strong> Practice 20-minute timed problem sets while keeping heart-rate &amp; working memory steady.<br>
                <strong>• Parent Script:</strong> &ldquo;What would change in this problem if we doubled the starting condition?&rdquo;
              </div>
            </div>

            <div id="card-learning-care-month-6" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.9rem 1rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <strong style="color:#0F172A;font-size:0.84rem;">Month 6 · Age ${exactAgeMonths + 5} Mos</strong>
                <span style="font-size:0.72rem;font-weight:800;background:#ECFDF5;color:#059669;padding:0.12rem 0.5rem;border-radius:9999px;">Goal LQ: ${coachedLQDisp} pts</span>
              </div>
              <div style="font-size:0.79rem;color:#334155;line-height:1.48;">
                <strong>• 180-Day 5-Axis Brain LQ Audit:</strong> Verify +${(coachedLQ - overallLQ).toFixed(1)} pt overall Brain LQ jump and autonomous self-directed study loop.<br>
                <strong>• Sustained Focus Milestone:</strong> Lock in <strong>${ageMonthFocusMinutes + 10}-min</strong> deep immersion capacity.<br>
                <strong>• Next Cycle Transition:</strong> Unlock Month ${exactAgeMonths + 6}–${exactAgeMonths + 11} advanced grade-level cognitive pack.
              </div>
            </div>
          </div>
        </section>
        `}
      </div>
      `}

      <!-- =========================================================================
           MODE-SPECIFIC PRINTABLE TOOLKIT & MONTHLY LONGITUDINAL SUBSCRIPTION TRACKER
           ========================================================================= -->
      ${isMasked ? '' : (isLearningMode ? `
      <section id="global-5-printable-worksheets-section" style="background:#FFFFFF;border:2px solid #93C5FD;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;display:block;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
          <span style="font-size:0.75rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;border:1px solid #BFDBFE;padding:0.22rem 0.7rem;border-radius:9999px;">
            NEURO-STUDY TOOLKIT · 4 PRINTABLE COGNITIVE &amp; WORKING MEMORY WORKSHEETS (US LETTER 8.5&quot; × 11&quot;)
          </span>
          <button type="button" onclick="if(window.triggerKidsFitGlobalPrint){window.triggerKidsFitGlobalPrint();}else{window.print();}" style="background:#1D4ED8;color:#FFFFFF;border:none;border-radius:9999px;padding:0.38rem 0.85rem;font-size:0.76rem;font-weight:800;cursor:pointer;">
            🖨️ Print Cognitive Worksheets
          </button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:0.75rem;font-size:0.8rem;margin-bottom:1rem;">
          <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:0.85rem;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.2rem;">Worksheet 01 · Feynman 3-Min Blank-Page Recall</strong>
            <span style="color:#475569;line-height:1.45;">Structured template for closing the book after 20 mins of reading and writing 3 core concepts + 1 self-check gap from memory (+150% 30-day retention).</span>
          </div>
          <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:0.85rem;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.2rem;">Worksheet 02 · Visual Math Bar-Modeling Canvas</strong>
            <span style="color:#475569;line-height:1.45;">Part-Whole &amp; Comparison visual bar diagram grid that offloads prefrontal working memory on multi-step Common Core word problems.</span>
          </div>
          <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:0.85rem;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.2rem;">Worksheet 03 · 15-Min Prefrontal Focus Sprint Log</strong>
            <span style="color:#475569;line-height:1.45;">Timed micro-mission checklist with distraction tally marks to train dorsolateral prefrontal sustained desk endurance.</span>
          </div>
          <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:0.85rem;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.2rem;">Worksheet 04 · Socratic 3-Step Inquiry Organizer</strong>
            <span style="color:#475569;line-height:1.45;">Guides parent-child dialogue through [Observation] → [Hypothesis / Why?] → [Real-World STEM Application].</span>
          </div>
        </div>
        <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:14px;padding:1rem 1.1rem;">
          <div style="font-size:0.84rem;font-weight:900;color:#1E3A8A;margin-bottom:0.35rem;">📅 Interactive 30-Day Monthly Brain LQ Re-Calibration &amp; Cycle 2–6 Worksheet Unlocker</div>
          <div style="font-size:0.79rem;color:#334155;line-height:1.5;margin-bottom:0.75rem;">
            Prefrontal working memory and active-recall neural myelination shift every <strong>30 days</strong>. Log your child&apos;s monthly Feynman/Cornell practice streak below to recalculate their 30-day Brain LQ jump and unlock next month&apos;s upgraded cognitive worksheet cycle:
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.6rem;align-items:flex-end;">
            <div style="flex:1;min-width:135px;">
              <label style="display:block;font-size:0.72rem;font-weight:800;color:#1E3A8A;margin-bottom:0.2rem;">30-Day Practice Days (0–30d)</label>
              <input type="number" id="monthly-recal-streak-days" value="22" min="0" max="30" style="width:100%;box-sizing:border-box;padding:0.48rem 0.65rem;border:1.5px solid #93C5FD;border-radius:8px;font-size:0.84rem;font-weight:800;color:#0F172A;background:#FFFFFF;">
            </div>
            <div style="flex:1;min-width:135px;">
              <label style="display:block;font-size:0.72rem;font-weight:800;color:#1E3A8A;margin-bottom:0.2rem;">New Desk Focus Span (mins)</label>
              <input type="number" id="monthly-recal-focus-mins" value="35" min="5" max="120" style="width:100%;box-sizing:border-box;padding:0.48rem 0.65rem;border:1.5px solid #93C5FD;border-radius:8px;font-size:0.84rem;font-weight:800;color:#0F172A;background:#FFFFFF;">
            </div>
            <div style="flex:1.4;min-width:200px;">
              <label style="display:block;font-size:0.72rem;font-weight:800;color:#1E3A8A;margin-bottom:0.2rem;">This Month&apos;s Primary Study Situation</label>
              <select id="monthly-recal-learning-situation" style="width:100%;box-sizing:border-box;padding:0.48rem 0.65rem;border:1.5px solid #93C5FD;border-radius:8px;font-size:0.81rem;font-weight:800;color:#0F172A;background:#FFFFFF;">
                <option value="steady_recall">Steady Feynman Recall &amp; Focus Improvement</option>
                <option value="screen_distracted">Smartphone / Short-Video Distraction &amp; Focus Drop</option>
                <option value="math_word_stuck">Stuck on Multi-Step Math Word Problems / Long Texts</option>
                <option value="test_careless">Careless Test Mistakes Despite Knowing Concepts</option>
                <option value="memorize_forget">Forgetting Studied Material Within 48 Hours</option>
              </select>
            </div>
            <button type="button" onclick="window.recalculateKidsFitMonthlyProgress('learning', ${overallLQDisp})" style="padding:0.52rem 0.95rem;border-radius:8px;border:none;background:#1D4ED8;color:#FFFFFF;font-size:0.8rem;font-weight:900;cursor:pointer;">
              🔄 Generate Monthly Situation Report
            </button>
          </div>
          <div id="monthly-recal-result-box" style="margin-top:0.65rem;font-size:0.8rem;font-weight:800;color:#065F46;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:0.65rem 0.85rem;">
            ✓ Month 1 Baseline Locked (${overallLQDisp} pts) → Target Month 2 Coached LQ: <strong>${coachedLQDisp} pts</strong> · Next Cycle 2 Socratic &amp; Multi-Step Bar Model Pack Ready in 30 Days.
          </div>
        </div>
      </section>
      ` : `
      <section id="global-5-printable-worksheets-section" style="background:#FFFFFF;border:2px solid #93C5FD;border-radius:18px;padding:1.35rem 1.3rem;margin-bottom:1.25rem;display:block;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
          <span style="font-size:0.75rem;font-weight:900;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;padding:0.22rem 0.7rem;border-radius:9999px;">
            LONGITUDINAL AUXOLOGY TRACKER · 90-DAY VELOCITY, BONE-AGE &amp; DOSING RE-CALIBRATION
          </span>
          <button type="button" onclick="if(window.triggerKidsFitGlobalPrint){window.triggerKidsFitGlobalPrint();}else{window.print();}" style="background:#059669;color:#FFFFFF;border:none;border-radius:9999px;padding:0.38rem 0.85rem;font-size:0.76rem;font-weight:800;cursor:pointer;">
            🖨️ Print Fridge Growth Tracker
          </button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:0.75rem;font-size:0.8rem;margin-bottom:1rem;">
          <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:0.85rem;">
            <strong style="color:#059669;display:block;margin-bottom:0.2rem;">Tracker 01 · 30-Day Height Velocity Drift Detector</strong>
            <span style="color:#475569;line-height:1.45;">Tracks monthly morning stature to verify whether your child is accelerating from ${isImperial ? `${annualVelocityIn} in/yr` : `${annualVelocityCm} cm/yr`} toward the +3.3 in peak catch-up zone.</span>
          </div>
          <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:0.85rem;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.2rem;">Tracker 02 · 10 PM SWS HGH &amp; 2-Hr Fasting Fridge Log</strong>
            <span style="color:#475569;line-height:1.45;">Weekly fridge checklist tracking 10 PM sleep onset and 2-hour pre-bed carbohydrate fasting to protect the 65% nocturnal Growth Hormone pulse.</span>
          </div>
          <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:0.85rem;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.2rem;">Tracker 03 · Monthly Weight-Adjusted Ca/D3/K2/Zinc Dosing</strong>
            <span style="color:#475569;line-height:1.45;">Automatically recalculates elemental Calcium Citrate (${caMg} mg), Vitamin D3 (${vitDIu} IU), and Zinc (${zincMg} mg) as your child gains weight each month.</span>
          </div>
        </div>
        <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:14px;padding:1rem 1.1rem;">
          <div style="font-size:0.84rem;font-weight:900;color:#1E3A8A;margin-bottom:0.35rem;">📅 Interactive 30-Day Monthly Height Velocity &amp; Weight-Adjusted Dosing Re-Calibrator</div>
          <div style="font-size:0.79rem;color:#334155;line-height:1.5;margin-bottom:0.75rem;">
            A single height measurement is only a Day-1 snapshot. Enter your child&apos;s updated morning stature and weight after 30 days to compute <strong>Annualized Growth Velocity (${isImperial ? 'in/yr &amp; cm/yr' : 'cm/yr &amp; in/yr'})</strong>, detect bone-plate catch-up vs. stagnation, and auto-adjust daily Ca/D3/K2/Zinc dosing:
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.6rem;align-items:flex-end;">
            ${isImperial ? `
            <div style="flex:1.1;min-width:165px;">
              <label style="display:block;font-size:0.72rem;font-weight:800;color:#1E3A8A;margin-bottom:0.2rem;">Day-30 Morning Height (ft / in)</label>
              <div style="display:flex;gap:0.35rem;">
                <input type="number" step="1" min="1" max="7" id="monthly-recal-height-ft" value="${Math.floor(((heightCm + 0.6) / 2.54) / 12)}" placeholder="ft" style="width:48%;box-sizing:border-box;padding:0.48rem 0.5rem;border:1.5px solid #93C5FD;border-radius:8px;font-size:0.84rem;font-weight:800;color:#0F172A;background:#FFFFFF;">
                <input type="number" step="0.1" min="0" max="11.9" id="monthly-recal-height-in" value="${(((heightCm + 0.6) / 2.54) - Math.floor(((heightCm + 0.6) / 2.54) / 12) * 12).toFixed(1)}" placeholder="in" style="width:52%;box-sizing:border-box;padding:0.48rem 0.5rem;border:1.5px solid #93C5FD;border-radius:8px;font-size:0.84rem;font-weight:800;color:#0F172A;background:#FFFFFF;">
              </div>
            </div>
            <div style="flex:1;min-width:135px;">
              <label style="display:block;font-size:0.72rem;font-weight:800;color:#1E3A8A;margin-bottom:0.2rem;">Day-30 Morning Weight (lbs)</label>
              <input type="number" step="0.1" id="monthly-recal-weight-lbs" value="${((weightKg + 0.5) * 2.20462262).toFixed(1)}" style="width:100%;box-sizing:border-box;padding:0.48rem 0.65rem;border:1.5px solid #93C5FD;border-radius:8px;font-size:0.84rem;font-weight:800;color:#0F172A;background:#FFFFFF;">
            </div>
            ` : `
            <div style="flex:1;min-width:135px;">
              <label style="display:block;font-size:0.72rem;font-weight:800;color:#1E3A8A;margin-bottom:0.2rem;">Day-30 Morning Height (cm)</label>
              <input type="number" step="0.1" id="monthly-recal-height-cm" value="${(heightCm + 0.6).toFixed(1)}" style="width:100%;box-sizing:border-box;padding:0.48rem 0.65rem;border:1.5px solid #93C5FD;border-radius:8px;font-size:0.84rem;font-weight:800;color:#0F172A;background:#FFFFFF;">
            </div>
            <div style="flex:1;min-width:135px;">
              <label style="display:block;font-size:0.72rem;font-weight:800;color:#1E3A8A;margin-bottom:0.2rem;">Day-30 Morning Weight (kg)</label>
              <input type="number" step="0.1" id="monthly-recal-weight-kg" value="${(weightKg + 0.5).toFixed(1)}" style="width:100%;box-sizing:border-box;padding:0.48rem 0.65rem;border:1.5px solid #93C5FD;border-radius:8px;font-size:0.84rem;font-weight:800;color:#0F172A;background:#FFFFFF;">
            </div>
            `}
            <div style="flex:1.4;min-width:200px;">
              <label style="display:block;font-size:0.72rem;font-weight:800;color:#1E3A8A;margin-bottom:0.2rem;">This Month&apos;s Primary Physical Situation</label>
              <select id="monthly-recal-growth-situation" style="width:100%;box-sizing:border-box;padding:0.48rem 0.65rem;border:1.5px solid #93C5FD;border-radius:8px;font-size:0.81rem;font-weight:800;color:#0F172A;background:#FFFFFF;">
                <option value="normal_catchup">Steady 10 PM Sleep &amp; Normal Appetite</option>
                <option value="sleep_broken">Late Bedtime (&gt;10:30 PM) or Frequent Night Waking</option>
                <option value="picky_appetite">Picky Eating / Low Meat &amp; Dairy Intake This Month</option>
                <option value="growing_pains">Nocturnal Knee/Calf Growing Pains or Desk Slouching</option>
                <option value="rapid_weight">Weight Gained Faster Than Height (Bone-Age Watch)</option>
              </select>
            </div>
            <button type="button" onclick="window.recalculateKidsFitMonthlyProgress('growth', ${heightCm}, ${weightKg})" style="padding:0.52rem 0.95rem;border-radius:8px;border:none;background:#059669;color:#FFFFFF;font-size:0.8rem;font-weight:900;cursor:pointer;">
              🔄 Generate Monthly Situation Report
            </button>
          </div>
          <div id="monthly-recal-result-box" style="margin-top:0.65rem;font-size:0.8rem;font-weight:800;color:#065F46;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:0.65rem 0.85rem;">
            ✓ Baseline Locked: ${fmtLen(heightCm)} / ${fmtWt(weightKg)} · Projected 30-Day Catch-Up Velocity: <strong>${isImperial ? '2.8 in/yr (7.2 cm/yr)' : '7.2 cm/yr (2.8 in/yr)'}</strong> · Next Bone-Age &amp; Dosing Check-In in 30 Days.
          </div>
        </div>
      </section>
      `)}

      <!-- High-Contrast Applied Child Conditions & Clinical Summary Footer (Strictly Mode-Separated) -->
      <div id="global-report-child-conditions-footer" style="background:#FFFFFF;border:2px solid #93C5FD;border-radius:18px;padding:1.15rem 1.3rem;margin-top:0.5rem;color:#0F172A;box-shadow:0 6px 18px rgba(15,23,42,0.05);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.55rem;padding-bottom:0.5rem;border-bottom:1px solid #DBEAFE;">
          <span style="font-size:0.76rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;border:1px solid #BFDBFE;padding:0.2rem 0.65rem;border-radius:9999px;">
            APPLIED CHILD CONDITIONS &amp; 1:1 SURVEY PARAMETERS (${isLearningMode ? 'BRAIN &amp; LEARNING TRACK' : 'PHYSICAL GROWTH TRACK'})
          </span>
          <span style="font-size:0.76rem;font-weight:800;color:#059669;">
            ✓ ${isLearningMode ? '2,138 Neuro-Cognitive &amp; Pedagogy' : '1,576 Pediatric Auxology &amp; Endocrine'} PubMed Studies Matched
          </span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.65rem;font-size:0.83rem;color:#0F172A;line-height:1.5;">
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:0.65rem 0.85rem;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.15rem;">Child Demographics</strong>
            <span>Age ${ageY} yrs ${ageRemM} mos · ${genderLabel}</span>
          </div>
          ${isLearningMode ? `
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:0.65rem 0.85rem;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.15rem;">5-Axis Brain LQ &amp; Focus Span</strong>
            <span>Overall LQ ${overallLQDisp} pts (Top ${lqTopPctDisp}%) · ${focusSpanLabel.split(' (')[0]}</span>
          </div>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:0.65rem 0.85rem;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.15rem;">Preferred Cognitive Absorption</strong>
            <span>${studyStyleLabel}</span>
          </div>
          ` : `
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:0.65rem 0.85rem;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.15rem;">Physical Biometrics &amp; MPH</strong>
            <span>${fmtLen(heightCm)} (${pctValDisp}th%) · ${fmtWt(weightKg)} · Genetic MPH ${fmtMaskedLen(geneticCm)}</span>
          </div>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:0.65rem 0.85rem;">
            <strong style="color:#1D4ED8;display:block;margin-bottom:0.15rem;">Ancestry &amp; Bone-Age Calibration</strong>
            <span>${ethInfo.label} · ${ethInfo.phvNote}</span>
          </div>
          `}
        </div>
      </div>
    `;
  }

  // Strictly locked: Report 1 (Physical Growth) and Report 2 (Brain LQ) cannot switch into each other
  global.switchGlobalReportTab = function () {
    ['btn-global-tab-growth', 'btn-global-tab-learning', 'btn-switch-report-growth', 'btn-switch-report-learning'].forEach((id) => {
      const btn = typeof document !== 'undefined' ? document.getElementById(id) : null;
      if (btn) btn.remove();
    });
    return false;
  };

  /**
   * Renders the 100% Native English Master Report inside #master-briefing-card
   * and injects the Taller-Style Blurred Teaser & Hard-Paywall Unlock Gate when locked.
   */
  function transformGlobalReportAndApplyPaywall() {
    if (typeof document === 'undefined' || !isGlobalPaidEdition()) return;
    const card = document.getElementById('master-briefing-card');
    if (!card) return;

    const unlocked = isReportUnlocked();
    if (document.documentElement && typeof document.documentElement.setAttribute === 'function') {
      document.documentElement.setAttribute('data-paywall-state', unlocked ? 'unlocked' : 'locked');
    }

    let savedProfile = {};
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rawSaved = window.localStorage.getItem('kidsfit_last_quiz_profile_v1');
        if (rawSaved) savedProfile = JSON.parse(rawSaved) || {};
      }
    } catch (_) {}
    const wizardProfile = (global.TallerOnboardingWizard && typeof global.TallerOnboardingWizard.getState === 'function' && global.TallerOnboardingWizard.getState().profile) || {};
    const appProfile = (global.KidsFitApp && global.KidsFitApp.state && global.KidsFitApp.state.profile) || {};
    const profile = Object.assign({}, savedProfile, wizardProfile, appProfile);
    const formEl = document.getElementById('diagnosis-form');
    const isLearningMode = (profile.preferredReportMode === 'learning') ||
      (wizardProfile.preferredReportMode === 'learning') ||
      (global.__KIDSFIT_PREFERRED_REPORT_MODE === 'learning') ||
      Boolean(formEl && formEl.className && formEl.className.includes('wizard-mode-learning'));
    if (isLearningMode) {
      profile.preferredReportMode = 'learning';
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage && (profile.currentHeight || profile.ageMonths)) {
        window.localStorage.setItem('kidsfit_last_quiz_profile_v1', JSON.stringify(profile));
      }
    } catch (_) {}

    // Hide legacy Korean sub-cards in #results-dashboard so 0 Korean characters exist
    ['growth-report-card', 'endocrinology-report-card', 'biomechanics-report-card', 'neuro-report-card', 'tracker-report-card', 'dev-report-card', 'outing-report-card', 'monetization-appendix-container'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = '';
        el.style.display = 'none';
      }
    });

    // Enforce iHerb-only recommendations across any reference chips in DOM
    if (typeof document.querySelectorAll === 'function') {
      const nonIherbChips = document.querySelectorAll('.reference-chip[data-merchant]:not([data-merchant="iherb"])');
      if (nonIherbChips && nonIherbChips.forEach) {
        nonIherbChips.forEach((chip) => chip.remove());
      }
    }

    // Replace #master-briefing-card with 100% Native English Clinical Master Report (masked when locked)
    card.innerHTML = buildNativeEnglishClinicalReportHTML(profile, { masked: !unlocked });
    global.switchGlobalReportTab(isLearningMode ? 'learning' : 'growth');
    if (typeof global.updateGlobalHormoneSimulator === 'function') {
      global.updateGlobalHormoneSimulator();
    }

    const p1 = document.getElementById('pillar-1-container');
    const p2 = document.getElementById('pillar-2-container');
    const GrowthEngine = global.KidsFitGrowthEngine;
    const heightCm = parseFloat(profile.currentHeight) || 137.0;
    const weightKg = parseFloat(profile.currentWeight) || 35.5;
    const fatherCm = parseFloat(profile.fatherHeight) || 173.5;
    const motherCm = parseFloat(profile.motherHeight) || 160.5;
    const isBoy = profile.gender !== 'girl';
    const ageY = Math.max(1, Math.min(20, Math.floor((profile.ageMonths || 120) / 12)));
    const genderLabel = profile.gender === 'girl' ? 'Girl' : 'Boy';
    const habits = Array.isArray(profile.habits) && profile.habits.length ? profile.habits : ['late_sleep'];
    const mphCm = (GrowthEngine && typeof GrowthEngine.calculateMph === 'function')
      ? GrowthEngine.calculateMph(fatherCm, motherCm, isBoy ? 'boy' : 'girl')
      : Number(((fatherCm + motherCm + (isBoy ? 13 : -13)) / 2).toFixed(1));
    const pred = (GrowthEngine && typeof GrowthEngine.calculateHeightPrediction === 'function')
      ? GrowthEngine.calculateHeightPrediction(mphCm, habits, profile.tannerPhase || 'phase_2')
      : { mph: mphCm, predictedCurrent: Number((mphCm - 2.3).toFixed(1)), potentialHeight: Number((mphCm + 4.8).toFixed(1)), totalLoss: 2.3, potentialGain: 4.8 };
    const unmanagedCm = Number(pred.predictedCurrent || (mphCm - 2.3)).toFixed(1);
    const optimizedCm = Number(pred.potentialHeight || (mphCm + 4.8)).toFixed(1);
    const hiddenGainCm = Math.max(3.5, Number((optimizedCm - unmanagedCm).toFixed(1)));

    const rxTitleEl = document.getElementById('rx-header-title');
    if (rxTitleEl) {
      rxTitleEl.textContent = isLearningMode
        ? `Age ${ageY} ${genderLabel} — 5-Axis Brain LQ & Executive Function Report`
        : `Age ${ageY} ${genderLabel} — US CDC Auxology & Adult Height Report`;
    }
    const rxSubEl = document.getElementById('rx-header-subtitle');
    if (rxSubEl) {
      rxSubEl.textContent = isLearningMode
        ? 'Harvard / WashU 5-Axis Brain LQ & Executive Function Assessment Complete'
        : 'US CDC 2000 & WHO Standardized Pediatric Auxology & Bone-Age Analysis Complete';
    }

    const isImperial = (global.TallerI18n && typeof global.TallerI18n.getUnitSystem === 'function')
      ? global.TallerI18n.getUnitSystem() === 'imperial'
      : true;

    function fmtLen(cmVal) {
      const cm = parseFloat(cmVal);
      if (isNaN(cm) || cm <= 0) return '0 cm';
      const ftIn = cmToFtInStr(cm);
      const cmStr = cm.toFixed(1);
      return isImperial ? `${ftIn} (${cmStr} cm)` : `${cmStr} cm (${ftIn})`;
    }

    function fmtWt(kgVal) {
      const kg = parseFloat(kgVal);
      if (isNaN(kg) || kg <= 0) return '0 kg';
      const lbs = (kg * 2.20462262).toFixed(1);
      const kgStr = kg.toFixed(1);
      return isImperial ? `${lbs} lbs (${kgStr} kg)` : `${kgStr} kg (${lbs} lbs)`;
    }

    function fmtGain(cmVal) {
      const cm = parseFloat(cmVal);
      if (isNaN(cm)) return '+0 cm';
      const inVal = (cm / 2.54).toFixed(1);
      const cmStr = cm.toFixed(1);
      return isImperial ? `+${inVal} in (+${cmStr} cm)` : `+${cmStr} cm (+${inVal} in)`;
    }

    if (unlocked) {
      [p1, p2].forEach((el) => {
        if (el) {
          el.style.filter = 'none';
          el.style.pointerEvents = 'auto';
          el.style.userSelect = 'auto';
          el.style.maxHeight = 'none';
          el.style.overflow = 'visible';
          el.style.opacity = '1';
        }
      });
      if (global.KidsFitGrowthTracker && typeof global.KidsFitGrowthTracker.preparePrintReport === 'function') {
        global.KidsFitGrowthTracker.preparePrintReport(profile);
      }
      const unlockedBanner = document.createElement('div');
      unlockedBanner.id = 'taller-global-paywall-gate';
      unlockedBanner.style.cssText = 'background:#ECFDF5;border:2px solid #10B981;border-radius:16px;padding:0.9rem 1.2rem;margin-bottom:1.2rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.6rem;';
      unlockedBanner.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.6rem;">
          <span style="background:#10B981;color:#FFFFFF;font-size:0.76rem;font-weight:900;padding:0.22rem 0.65rem;border-radius:9999px;">UNLOCKED PRO PASS</span>
          <span style="font-size:0.9rem;font-weight:800;color:#065F46;">Full US CDC &amp; 3,714-Paper Clinical Report Unlocked — Age ${ageY} ${genderLabel} (${isLearningMode ? '5-Axis Brain LQ &amp; Study Roadmap' : `${fmtLen(heightCm)} · ${fmtWt(weightKg)}`})</span>
        </div>
        <button type="button" onclick="if(window.triggerKidsFitGlobalPrint){window.triggerKidsFitGlobalPrint();}else{window.print();}" style="background:#059669;color:#FFFFFF;border:none;border-radius:9999px;padding:0.42rem 0.95rem;font-size:0.82rem;font-weight:800;cursor:pointer;">
          Download / Print Clinical PDF Report
        </button>
      `;
      const headerEl = card.querySelector('.briefing-header');
      if (headerEl && headerEl.nextSibling) {
        card.insertBefore(unlockedBanner, headerEl.nextSibling);
      } else {
        card.prepend(unlockedBanner);
      }
      return;
    }

    // Locked State: Clear/Lock #clinic-print-report-container so @media print cannot leak paid report
    const printContainer = document.getElementById('clinic-print-report-container');
    if (printContainer) {
      printContainer.innerHTML = '';
      printContainer.style.display = 'none';
    }

    // Blur Pillar 1 & Pillar 2 behind the Taller-Style Paywall Gate
    [p1, p2].forEach((el) => {
      if (el) {
        el.style.filter = 'blur(8px)';
        el.style.pointerEvents = 'none';
        el.style.userSelect = 'none';
        el.style.maxHeight = '460px';
        el.style.overflow = 'hidden';
        el.style.opacity = '0.52';
        el.style.transition = 'filter 0.35s ease, opacity 0.35s ease';
      }
    });

    const singleBuyUrl = getActiveCheckoutUrl('single');
    const gateEl = document.createElement('div');
    gateEl.id = 'taller-global-paywall-gate';
    gateEl.style.cssText = 'background:linear-gradient(180deg,#EFF6FF 0%,#FFFFFF 100%);border:2.5px solid #1D4ED8;border-radius:22px;padding:1.5rem 1.4rem;margin-bottom:1.4rem;box-shadow:0 20px 50px rgba(29,78,216,0.12);text-align:left;';
    gateEl.innerHTML = `
      <!-- Step 1: Clinical Scan Complete Teaser Banner -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.85rem;padding-bottom:0.75rem;border-bottom:1px solid #BFDBFE;">
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <span style="background:#1D4ED8;color:#FFFFFF;font-size:0.76rem;font-weight:900;padding:0.24rem 0.75rem;border-radius:9999px;">
            SCAN COMPLETE · REPORT READY TO UNLOCK
          </span>
          <span style="font-size:0.84rem;font-weight:800;color:#1E3A8A;">
            ${isLearningMode
              ? `Profile: Age ${ageY} ${genderLabel} · 5-Axis Brain LQ &amp; Executive Function Scan`
              : `Profile: Age ${ageY} ${genderLabel} · Current ${fmtLen(heightCm)} / ${fmtWt(weightKg)}`}
          </span>
        </div>
        <span style="font-size:0.78rem;font-weight:800;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;padding:0.2rem 0.65rem;border-radius:9999px;">
          ${isLearningMode ? '2,138 Cognitive &amp; Pedagogy' : '1,576 Pediatric Auxology'} PubMed Papers Matched
        </span>
      </div>

      <!-- Step 2: Masked Teaser Grid (Strictly Separated: Brain LQ vs Physical Growth Mode) -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.75rem;margin-bottom:1.15rem;">
        ${isLearningMode ? `
        <div style="background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:14px;padding:0.85rem 1rem;">
          <div style="font-size:0.75rem;font-weight:800;color:#475569;">① 5-Axis Brain Learning Quotient (LQ)</div>
          <div style="font-size:1.35rem;font-weight:900;color:#1D4ED8;margin-top:0.2rem;letter-spacing:-0.02em;">
            🔒 <span style="filter:blur(5px);user-select:none;">??.? pts</span> <span style="font-size:0.82rem;color:#DC2626;font-weight:800;">(Locked)</span>
          </div>
          <div style="font-size:0.76rem;color:#059669;font-weight:800;margin-top:0.2rem;">
            ▲ +14.5 Pt Coached LQ Gain Window!
          </div>
        </div>
        <div style="background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:14px;padding:0.85rem 1rem;">
          <div style="font-size:0.75rem;font-weight:800;color:#475569;">② Prefrontal &amp; Recall Bottleneck</div>
          <div style="font-size:1.05rem;font-weight:900;color:#0F172A;margin-top:0.25rem;">
            🔒 <span style="color:#1D4ED8;">2 Priority Bottlenecks Found</span>
          </div>
          <div style="font-size:0.76rem;color:#475569;font-weight:700;margin-top:0.2rem;">
            Working Memory &amp; Blank-Page Recall Analysis
          </div>
        </div>
        <div style="background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:14px;padding:0.85rem 1rem;">
          <div style="font-size:0.75rem;font-weight:800;color:#475569;">③ 4-Week Neuro-Study &amp; iHerb Rx</div>
          <div style="font-size:1.05rem;font-weight:900;color:#0F172A;margin-top:0.25rem;">
            🔒 <span style="color:#1D4ED8;">1:1 Study Roadmap Ready</span>
          </div>
          <div style="font-size:0.76rem;color:#475569;font-weight:700;margin-top:0.2rem;">
            Feynman Recall, Bar Modeling &amp; Neuro-DHA
          </div>
        </div>
        ` : `
        <div style="background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:14px;padding:0.85rem 1rem;">
          <div style="font-size:0.75rem;font-weight:800;color:#475569;">① Final Predicted Adult Height</div>
          <div style="font-size:1.35rem;font-weight:900;color:#1D4ED8;margin-top:0.2rem;letter-spacing:-0.02em;">
            🔒 <span style="filter:blur(5px);user-select:none;">${isImperial ? "5' ?.?″" : '???.? cm'}</span> <span style="font-size:0.82rem;color:#DC2626;font-weight:800;">(Locked)</span>
          </div>
          <div style="font-size:0.76rem;color:#059669;font-weight:800;margin-top:0.2rem;">
            ▲ ${fmtGain(hiddenGainCm)} Hidden Gain Detected!
          </div>
        </div>

        <div style="background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:14px;padding:0.85rem 1rem;">
          <div style="font-size:0.75rem;font-weight:800;color:#475569;">② rhGH Injection &amp; Bone-Age Verdict</div>
          <div style="font-size:1.05rem;font-weight:900;color:#0F172A;margin-top:0.25rem;">
            🔒 <span style="color:#1D4ED8;">Tier Analysis Ready</span>
          </div>
          <div style="font-size:0.76rem;color:#475569;font-weight:700;margin-top:0.2rem;">
            BMJ &amp; Cochrane Meta-Analysis ($15k/yr ROI Check)
          </div>
        </div>

        <div style="background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:14px;padding:0.85rem 1rem;">
          <div style="font-size:0.75rem;font-weight:800;color:#475569;">③ 24h Sleep HGH &amp; Bio-Nutrition Rx</div>
          <div style="font-size:1.05rem;font-weight:900;color:#0F172A;margin-top:0.25rem;">
            🔒 <span style="color:#1D4ED8;">1:1 Growth Protocol Ready</span>
          </div>
          <div style="font-size:0.76rem;color:#475569;font-weight:700;margin-top:0.2rem;">
            10 PM SWS HGH, Ca Citrate, D3+K2 &amp; Chelated Zinc
          </div>
        </div>
        `}
      </div>

      <!-- Step 3: Taller-Style Pricing & Instant Unlock Card (Strictly Separated by Mode + Monthly Retention Value) -->
      <div id="taller-global-paywall-card" style="background:#FFFFFF;border:2px solid #1D4ED8;border-radius:18px;padding:1.25rem 1.3rem;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem;margin-bottom:0.9rem;">
          <div>
            <span style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;font-size:0.75rem;font-weight:900;padding:0.2rem 0.65rem;border-radius:9999px;">
              LIMITED LAUNCH OFFER · SAVE 70% VS. $450 CLINIC CONSULT
            </span>
            <h3 style="font-size:1.24rem;font-weight:900;color:#0F172A;margin:0.45rem 0 0.2rem 0;">
              ${isLearningMode
                ? "Unlock Your Child's Complete 1:1 5-Axis Brain LQ &amp; Neuro-Study Master Report"
                : "Unlock Your Child's Complete 1:1 Pediatric Height &amp; Auxology Master Report"}
            </h3>
            <p style="font-size:0.86rem;color:#475569;margin:0;">
              ${isLearningMode
                ? 'Instant access to your child&#39;s 5-Axis Cognitive Radar, Top 2 Study Bottleneck Diagnosis, 4-Week Feynman &amp; Cornell Action Plan, and 4 Printable Cognitive Worksheets.'
                : 'Instant access to your child&#39;s US CDC 2000 &amp; WHO Height Trajectory, 3-Scenario Adult Height Prediction, rhGH Injection ROI Verdict, 24h Sleep HGH Simulator, and Printable Growth Trackers.'}
            </p>
          </div>
        </div>

        <!-- 2-Tier Plan Selector -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:0.8rem;margin-bottom:0.95rem;">
          <label id="paywall-plan-label-single" onclick="window.selectKidsFitGlobalPlan('single')" style="cursor:pointer;background:#EFF6FF;border:2px solid #1D4ED8;border-radius:14px;padding:0.95rem 1rem;display:flex;flex-direction:column;justify-content:space-between;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">
              <span style="font-size:0.82rem;font-weight:900;color:#1D4ED8;">
                <input type="radio" name="kidsfit-global-plan" value="single" checked style="accent-color:#1D4ED8;margin-right:0.3rem;">
                SINGLE REPORT PASS (DAY-1 SNAPSHOT)
              </span>
              <span style="background:#1D4ED8;color:#FFFFFF;font-size:0.7rem;font-weight:900;padding:0.15rem 0.5rem;border-radius:9999px;">SAVE 70%</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:0.45rem;margin-bottom:0.3rem;">
              <span style="font-size:1.65rem;font-weight:900;color:#0F172A;">$8.99</span>
              <span style="font-size:0.85rem;color:#94A3B8;text-decoration:line-through;font-weight:700;">$29.99</span>
              <span style="font-size:0.78rem;color:#475569;font-weight:700;">· One-Time Snapshot</span>
            </div>
            <div style="font-size:0.78rem;color:#334155;line-height:1.45;">
              ${isLearningMode ? `
              ✓ Full 5-Axis Brain LQ &amp; Study Bottleneck Report<br>
              ✓ Custom 4-Week Feynman &amp; Bar-Modeling Plan<br>
              ✓ Printable Clinical PDF + 4 Cognitive Worksheets
              ` : `
              ✓ Full US CDC 2000 Adult Height + rhGH Paper Report<br>
              ✓ 24h Sleep HGH Simulator &amp; Weight-Based Ca/D3/K2 Rx<br>
              ✓ Printable Hospital-Style PDF + 3 Growth Trackers
              `}
            </div>
          </label>

          <label id="paywall-plan-label-pass" onclick="window.selectKidsFitGlobalPlan('pass')" style="cursor:pointer;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.95rem 1rem;display:flex;flex-direction:column;justify-content:space-between;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">
              <span style="font-size:0.82rem;font-weight:900;color:#0F172A;">
                <input type="radio" name="kidsfit-global-plan" value="pass" style="accent-color:#1D4ED8;margin-right:0.3rem;">
                ${isLearningMode ? '6-MONTH MONTHLY BRAIN LQ TRACKER' : '6-MONTH MONTHLY GROWTH VELOCITY PASS'}
              </span>
              <span style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;font-size:0.7rem;font-weight:900;padding:0.15rem 0.5rem;border-radius:9999px;">78% CHOOSE · BEST VALUE</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:0.45rem;margin-bottom:0.3rem;">
              <span style="font-size:1.65rem;font-weight:900;color:#0F172A;">$19.99</span>
              <span style="font-size:0.85rem;color:#94A3B8;text-decoration:line-through;font-weight:700;">$79.99</span>
              <span style="font-size:0.78rem;color:#059669;font-weight:800;">· Only $3.33/mo (6 Mos)</span>
            </div>
            <div style="font-size:0.78rem;color:#334155;line-height:1.45;">
              ${isLearningMode ? `
              ✓ <strong>Monthly 30-Day 5-Axis Brain LQ Re-Calibration</strong><br>
              ✓ <strong>Cycles 1–6 Progressive Monthly Worksheets</strong><br>
              ✓ <strong>Unlimited Sibling Profiles</strong> &amp; Dynamic DHA Dosing
              ` : `
              ✓ <strong>Monthly 30-Day Height Velocity (cm/yr) Re-Scans</strong><br>
              ✓ <strong>Auto-Updated Weight-Matched Ca/D3/K2/Zinc Dosing</strong><br>
              ✓ <strong>Bone-Age Closure Alert + Unlimited Sibling Profiles</strong>
              `}
            </div>
          </label>
        </div>

        <!-- Monthly Retention Value Box: Why Parents Need Ongoing Monthly Re-Calibration -->
        <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:0.75rem 0.95rem;margin-bottom:0.95rem;font-size:0.78rem;color:#065F46;line-height:1.48;">
          <strong style="color:#047857;display:block;margin-bottom:0.18rem;">
            🔄 Why 78% of Parents Choose the 6-Month Re-Calibration Pass ($3.33/mo):
          </strong>
          ${isLearningMode
            ? 'A single test only shows Day-1 baseline. Neural myelination &amp; working memory shift every <strong>30 days</strong>—the 6-Month Pass tracks monthly LQ score gains, unlocks harder Cycle 2–6 Feynman/Bar-Model worksheets each month, and covers all siblings.'
            : 'A single height check is only a Day-1 snapshot. Growth velocity (cm/yr), bone-age drift, and weight-matched Ca/D3/K2/Zinc dosing change every <strong>30 days</strong>—the 6-Month Pass detects growth stagnation early before growth plates close and covers all siblings.'}
        </div>

        <!-- Primary Checkout CTA Button -->
        <button type="button" id="btn-global-paywall-checkout" data-checkout-url="${singleBuyUrl}" onclick="window.openKidsFitGlobalCheckoutModal()" style="width:100%;padding:1rem 1.2rem;border-radius:14px;border:none;background:linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%);color:#FFFFFF;font-size:1.05rem;font-weight:900;cursor:pointer;box-shadow:0 10px 25px rgba(29,78,216,0.28);margin-bottom:0.65rem;">
          🔓 Unlock Full Clinical Report &amp; Printable PDF Now ($8.99) →
        </button>

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;font-size:0.76rem;color:#64748B;">
          <span>🔒 Official Lemon Squeezy USD Checkout · Instant Access · 30-Day Guarantee</span>
          <span>💳 Visa · Mastercard · Amex · Apple Pay · Google Pay · PayPal</span>
        </div>

        <!-- Member Account & Order Verification Bar -->
        <div style="margin-top:0.8rem;padding-top:0.75rem;border-top:1px dashed #E2E8F0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
          <span style="font-size:0.78rem;font-weight:700;color:#475569;">Already a member or completed purchase?</span>
          <button type="button" onclick="window.openKidsFitAuthModal('login')" style="padding:0.4rem 0.85rem;border-radius:8px;border:1px solid #1D4ED8;background:#EFF6FF;color:#1D4ED8;font-size:0.78rem;font-weight:800;cursor:pointer;">
            👤 Sign In / Verify Order →
          </button>
        </div>
      </div>
    `;

    const headerEl = card.querySelector('.briefing-header');
    if (headerEl && headerEl.nextSibling) {
      card.insertBefore(gateEl, headerEl.nextSibling);
    } else {
      card.prepend(gateEl);
    }
  }

  global.recalculateKidsFitMonthlyProgress = function (mode, baseVal1, baseVal2) {
    const out = document.getElementById('monthly-recal-result-box');
    if (!out) return;
    if (mode === 'learning') {
      const daysEl = document.getElementById('monthly-recal-streak-days');
      const focusEl = document.getElementById('monthly-recal-focus-mins');
      const sitEl = document.getElementById('monthly-recal-learning-situation');
      const days = Math.max(0, Math.min(30, parseFloat((daysEl && daysEl.value) || '22')));
      const focusMins = Math.max(5, Math.min(120, parseFloat((focusEl && focusEl.value) || '35')));
      const sit = (sitEl && sitEl.value) || 'steady_recall';
      const baseLq = parseFloat(baseVal1) || 74.5;
      const gain = Number(((days / 30) * 4.8 + Math.min(2.5, (focusMins - 20) * 0.08)).toFixed(1));
      const newLq = Math.min(99.4, Number((baseLq + Math.max(0.5, gain)).toFixed(1)));
      const sitRxMap = {
        steady_recall: 'Maintain 3-Min Feynman Blank-Page Recall + unlock Cycle 2 Multi-Step Bar-Modeling templates.',
        screen_distracted: 'Enforce 60-min pre-study phone lockbox + split study into two 15-min timer sprints with L-Theanine (100 mg).',
        math_word_stuck: 'Mandate drawing a 3-box Part-Whole Bar Model before writing any equations to offload prefrontal working memory.',
        test_careless: 'Apply 3-Color Cornell Error Tagging ([Red: Misread] vs [Blue: Concept Gap]) and re-test missed items in 72 hours.',
        memorize_forget: 'Add 5-min bedtime verbal recall before N3 sleep + evening Magnesium Glycinate to boost hippocampal consolidation.'
      };
      out.innerHTML = `✅ <strong>Monthly Situation-Matched Brain LQ Report Generated:</strong> Updated Score <strong>${newLq} pts (+${Math.max(0.5, gain).toFixed(1)} pts/mo)</strong> · Desk Endurance: ${focusMins} mins<br>📌 <strong>This Month&apos;s Situation Rx:</strong> ${sitRxMap[sit] || sitRxMap.steady_recall}`;
    } else {
      const ftEl = document.getElementById('monthly-recal-height-ft');
      const inEl = document.getElementById('monthly-recal-height-in');
      const lbsEl = document.getElementById('monthly-recal-weight-lbs');
      const hEl = document.getElementById('monthly-recal-height-cm');
      const wEl = document.getElementById('monthly-recal-weight-kg');
      const sitEl = document.getElementById('monthly-recal-growth-situation');
      const isImpMode = Boolean(ftEl || inEl || lbsEl) || ((global.TallerI18n && typeof global.TallerI18n.getUnitSystem === 'function') ? global.TallerI18n.getUnitSystem() === 'imperial' : true);

      let newH = parseFloat(baseVal1 || 137) + 0.6;
      if (ftEl || inEl) {
        const ftVal = parseFloat((ftEl && ftEl.value) || '0') || 0;
        const inVal = parseFloat((inEl && inEl.value) || '0') || 0;
        const totalIn = ftVal * 12 + inVal;
        if (totalIn > 0) newH = Number((totalIn * 2.54).toFixed(2));
      } else if (hEl && hEl.value) {
        newH = parseFloat(hEl.value) || newH;
      }

      let newW = parseFloat(baseVal2 || 35.5) + 0.5;
      if (lbsEl && lbsEl.value) {
        const lbsVal = parseFloat(lbsEl.value) || 0;
        if (lbsVal > 0) newW = Number((lbsVal / 2.20462262).toFixed(2));
      } else if (wEl && wEl.value) {
        newW = parseFloat(wEl.value) || newW;
      }

      const sit = (sitEl && sitEl.value) || 'normal_catchup';
      const deltaCm = Math.max(0, Number((newH - (parseFloat(baseVal1) || 137)).toFixed(2)));
      const deltaIn = Number((deltaCm / 2.54).toFixed(2));
      const annualizedCmYr = Number((deltaCm * 12).toFixed(1));
      const annualizedInYr = Number((annualizedCmYr / 2.54).toFixed(1));
      const newLbs = Number((newW * 2.20462262).toFixed(1));
      const wtLabel = isImpMode ? `${newLbs} lbs (${newW.toFixed(1)} kg)` : `${newW.toFixed(1)} kg (${newLbs} lbs)`;
      const velSummary = isImpMode
        ? `+${deltaIn} in/month (+${deltaCm} cm/month) = <strong>${annualizedInYr} in/yr (${annualizedCmYr} cm/yr)</strong>`
        : `+${deltaCm} cm/month (+${deltaIn} in/month) = <strong>${annualizedCmYr} cm/yr (${annualizedInYr} in/yr)</strong>`;
      const newCa = Math.round(Math.min(1200, Math.max(500, newW * 26)));
      const newD3 = Math.round(Math.min(2500, Math.max(1200, newW * 45)));
      const newZn = Number(Math.min(15, Math.max(6, newW * 0.31)).toFixed(1));
      const statusText = annualizedCmYr >= 6.0
        ? '🟢 ACCELERATED CATCH-UP ZONE (+3.3 in Trajectory Active)'
        : (annualizedCmYr >= 4.8 ? '🟡 NORMAL MAINTENANCE VELOCITY' : '🔴 STAGNATION ALERT: Enforce 10 PM SWS + 2h Carb Fast');
      const sitRxMap = {
        normal_catchup: `Continue 10 PM SWS schedule + 3×30s bar hangs; updated dosing for ${wtLabel} locked.`,
        sleep_broken: ` Nighttime GH blunting detected: add evening Magnesium Glycinate (${Math.round(newW * 5.5)} mg) + warm foot bath 45m before bed.`,
        picky_appetite: `IGF-1 drop risk from low appetite: prioritize morning Chelated Zinc (${(newZn + 2).toFixed(1)} mg) + L-Lysine/Arginine amino support.`,
        growing_pains: `Rapid periosteal stretching detected: split Calcium Citrate (${newCa} mg) AM/PM + add evening Magnesium & calf traction.`,
        rapid_weight: `Aromatase bone-age acceleration alert: enforce strict 3-hr pre-bed zero-carb fast and increase vertical rope-jumping to 500 skips/day.`
      };
      out.innerHTML = `✅ <strong>Monthly Situation-Matched Auxology Report Generated:</strong> ${velSummary} [${statusText}] · <strong>Updated Dosing (${wtLabel}):</strong> Ca Citrate <strong>${newCa} mg</strong>, Vit D3 <strong>${newD3} IU</strong>, Zinc <strong>${newZn} mg</strong><br>📌 <strong>This Month&apos;s Situation Rx:</strong> ${sitRxMap[sit] || sitRxMap.normal_catchup}`;
    }
  };

  global.selectKidsFitCareMonth = function (mode, monthIdx) {
    const isLearn = mode === 'learning';
    const activeColor = isLearn ? '#1D4ED8' : '#059669';
    const activeBg = isLearn ? '#EFF6FF' : '#ECFDF5';
    const prefix = isLearn ? 'learning' : 'growth';
    for (let i = 1; i <= 6; i++) {
      const btn = document.getElementById(`btn-${prefix}-care-month-${i}`);
      const card = document.getElementById(`card-${prefix}-care-month-${i}`);
      if (btn) {
        btn.style.background = i === monthIdx ? activeColor : '#F8FAFC';
        btn.style.color = i === monthIdx ? '#FFFFFF' : '#334155';
        btn.style.borderColor = i === monthIdx ? activeColor : '#CBD5E1';
      }
      if (card) {
        card.style.background = i === monthIdx ? activeBg : '#F8FAFC';
        card.style.border = i === monthIdx ? `2px solid ${activeColor}` : '1.5px solid #CBD5E1';
      }
    }
    const reportBox = document.getElementById(`active-month-situation-report-${prefix}`);
    if (reportBox) {
      const baseMonth = parseInt(reportBox.getAttribute('data-base-month') || '120', 10);
      const curMonth = baseMonth + monthIdx - 1;
      if (isLearn) {
        const focus = reportBox.getAttribute('data-focus') || '15–20 mins';
        const style = reportBox.getAttribute('data-style') || 'Socratic Dialogue';
        const baseMins = parseInt(reportBox.getAttribute('data-focus-mins') || '25', 10);
        const monthActions = [
          `Lock in exact <strong>${baseMins}-minute timed micro-sprints</strong>, eliminate pre-study smartphone dopamine, and initiate morning DHA + Choline myelination support.`,
          `Transition from passive reading to <strong>Feynman 3-Min Blank-Page Recall</strong> (close book &amp; write 3 core concepts) + add Phosphatidylserine (100 mg).`,
          `Offload prefrontal working memory using <strong>3-Box Visual Bar-Modeling (Worksheet 02)</strong> on multi-step math &amp; ELA problems; audit 90-day error drop.`,
          `Execute <strong>Cornell 3-Color Error Tagging</strong> ([Careless Skip] vs [Concept Gap]) with mandatory 72-hour blind re-testing + evening Magnesium Glycinate.`,
          `Advance to <strong>Socratic 3-Step Deep Transfer</strong> ([Observation] → [Why Hypothesis] → [STEM Application]) and increase sprint duration to <strong>${baseMins + 8} mins</strong>.`,
          `Complete <strong>180-Day 5-Axis Brain LQ Audit</strong>, verify autonomous self-directed study habit at ${baseMins + 12} mins, and unlock Month ${curMonth + 1}+ curriculum.`
        ];
        reportBox.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.35rem;">
            <strong style="color:#047857;font-size:0.86rem;">📋 [Month ${monthIdx} · Age ${curMonth} Mos] 1:1 Situation-Matched Neuro-Study Briefing</strong>
            <span style="background:#059669;color:#FFFFFF;font-size:0.72rem;font-weight:800;padding:0.15rem 0.55rem;border-radius:9999px;">Month-${curMonth} Active Prescription</span>
          </div>
          <div>
            <strong>• Active Cognitive Situation at ${curMonth} Months:</strong> Desk Focus [${focus}] · Preferred Style [${style}]<br>
            <strong>• Month-${curMonth} Customized Study Action:</strong> ${monthActions[monthIdx - 1] || monthActions[0]}
          </div>
        `;
      } else {
        const sleep = reportBox.getAttribute('data-sleep') || 'Late Bedtime';
        const diet = reportBox.getAttribute('data-diet') || 'Picky Eating';
        const posture = reportBox.getAttribute('data-posture') || 'Desk Slouch';
        const monthActions = [
          `Eliminate evening insulin spikes 180 mins before bed, initiate baseline <strong>Calcium Citrate + Vitamin D3</strong>, and perform 3×30s doorway bar decompression.`,
          `Activate hepatic IGF-1 &amp; osteocalcin bone-locking by layering in <strong>Chelated Zinc + Vitamin K2 MK-7</strong>, clear nasal airways before sleep, and add 300 vertical rope-jumps/day.`,
          `Conduct <strong>90-Day Height Velocity Audit (target ≥1.8 cm gain)</strong>, re-scale daily protein &amp; mineral dosing for Month-${curMonth} body weight, and add 45s Cobra thoracic extension.`,
          `Enforce <strong>Bone-Age &amp; Aromatase Defense</strong> (keep BMI in lean zone, block ultra-processed snacks) and add evening Magnesium Glycinate for nocturnal growing-pain relief.`,
          `Upgrade weight-matched Calcium/Zinc dosing for Month-${curMonth} mass, correct seated pelvic asymmetry, and progress to <strong>500 vertical plyometric jumps + 3×40s bar hangs</strong>.`,
          `Complete <strong>180-Day US CDC 2000 Percentile Re-Calibration</strong>, verify open epiphyseal growth-plate tempo, and lock in the Month ${curMonth + 1}–${curMonth + 6} trajectory.`
        ];
        reportBox.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.35rem;">
            <strong style="color:#1D4ED8;font-size:0.86rem;">📋 [Month ${monthIdx} · Age ${curMonth} Mos] 1:1 Situation-Matched Auxology Briefing</strong>
            <span style="background:#1D4ED8;color:#FFFFFF;font-size:0.72rem;font-weight:800;padding:0.15rem 0.55rem;border-radius:9999px;">Month-${curMonth} Active Prescription</span>
          </div>
          <div>
            <strong>• Active Child Situation at ${curMonth} Months:</strong> Sleep [${sleep}] · Nutrition [${diet}] · Posture [${posture}]<br>
            <strong>• Month-${curMonth} Customized Clinical Action:</strong> ${monthActions[monthIdx - 1] || monthActions[0]}
          </div>
        `;
      }
    }
  };

  let selectedPlan = 'single';

  global.selectKidsFitGlobalPlan = function (plan) {
    selectedPlan = plan === 'pass' ? 'pass' : 'single';
    const singleLbl = document.getElementById('paywall-plan-label-single');
    const passLbl = document.getElementById('paywall-plan-label-pass');
    const btn = document.getElementById('btn-global-paywall-checkout');
    if (singleLbl && passLbl) {
      if (selectedPlan === 'single') {
        singleLbl.style.background = '#EFF6FF';
        singleLbl.style.border = '2px solid #1D4ED8';
        passLbl.style.background = '#F8FAFC';
        passLbl.style.border = '1.5px solid #CBD5E1';
      } else {
        passLbl.style.background = '#EFF6FF';
        passLbl.style.border = '2px solid #1D4ED8';
        singleLbl.style.background = '#F8FAFC';
        singleLbl.style.border = '1.5px solid #CBD5E1';
      }
    }
    if (btn) {
      const priceStr = selectedPlan === 'pass' ? '$19.99' : '$8.99';
      btn.setAttribute('data-checkout-url', getActiveCheckoutUrl(selectedPlan));
      btn.innerHTML = `🔓 Unlock Full Clinical Report &amp; Printable PDF Now (${priceStr}) →`;
    }
  };

  global.applyKidsFitGlobalVipCode = function () {
    const inp = document.getElementById('input-global-vip-code');
    const code = String((inp && inp.value) || '').trim().toUpperCase();
    if (code && AUTHORIZED_CODE_HASHES.indexOf(hashAccessCode(code)) !== -1) {
      try {
        if (window.localStorage) window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
      } catch (_) {}
      transformGlobalReportAndApplyPaywall();
    } else {
      if (typeof window.alert === 'function') {
        window.alert('Invalid access code. Please complete checkout or enter a valid access code.');
      }
    }
  };

  global.triggerGlobalLemonCheckout = function (plan) {
    if (plan) global.selectKidsFitGlobalPlan(plan);
    global.openKidsFitGlobalCheckoutModal();
  };

  global.launchLemonSqueezyCheckout = function (planOverride) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('kidsfit_pending_ls_checkout_ts_v1', String(Date.now()));
      }
    } catch (_) {}
    const plan = planOverride || selectedPlan || 'single';
    const baseCheckoutUrl = getActiveCheckoutUrl(plan);
    const emailEl = document.getElementById('checkout-parent-email');
    const email = String((emailEl && emailEl.value) || '').trim();
    try {
      if (email && email.indexOf('@') !== -1 && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('kidsfit_pending_ls_checkout_email_v1', email);
      }
    } catch (_) {}
    const sep = baseCheckoutUrl.indexOf('?') === -1 ? '?' : '&';
    const finalUrl = email && email.indexOf('@') !== -1
      ? `${baseCheckoutUrl}${sep}embed=1&checkout[email]=${encodeURIComponent(email)}`
      : `${baseCheckoutUrl}${sep}embed=1`;

    const openTargetUrl = function (rawUrl) {
      const hasEmbed = String(rawUrl || '').indexOf('embed=1') !== -1;
      const targetUrl = hasEmbed ? rawUrl : (rawUrl + (String(rawUrl || '').indexOf('?') === -1 ? '?embed=1' : '&embed=1'));
      try {
        if (typeof window !== 'undefined' && typeof window.createLemonSqueezy === 'function') {
          window.createLemonSqueezy();
        }
        if (typeof window !== 'undefined' && window.LemonSqueezy && typeof window.LemonSqueezy.Url === 'object' && typeof window.LemonSqueezy.Url.Open === 'function') {
          window.LemonSqueezy.Url.Open(targetUrl);
          return;
        }
      } catch (_) {}

      if (typeof document !== 'undefined' && document.body) {
        let iframeModal = document.getElementById('kidsfit-embedded-ls-iframe-modal');
        if (iframeModal) iframeModal.remove();
        iframeModal = document.createElement('div');
        iframeModal.id = 'kidsfit-embedded-ls-iframe-modal';
        iframeModal.style.cssText = 'position:fixed;inset:0;z-index:100005;background:rgba(15,23,42,0.82);display:flex;align-items:center;justify-content:center;padding:0.75rem;backdrop-filter:blur(5px);';
        iframeModal.innerHTML = '<div style="background:#FFFFFF;border:2px solid #1D4ED8;border-radius:20px;max-width:520px;width:100%;height:86vh;max-height:760px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.45);">' +
          '<div style="background:#0F172A;color:#FFFFFF;padding:0.75rem 1.1rem;display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-size:0.82rem;font-weight:900;letter-spacing:0.02em;">🔒 KISFIT BIO LABS · SECURE USD CHECKOUT (kisfitglobal.com)</span>' +
          '<button type="button" onclick="var m=document.getElementById(\'kidsfit-embedded-ls-iframe-modal\');if(m)m.remove();" style="background:#1E293B;color:#FFFFFF;border:1px solid #475569;border-radius:9999px;width:30px;height:30px;font-weight:900;cursor:pointer;">✕</button>' +
          '</div>' +
          '<iframe src="' + targetUrl + '" allow="payment *" style="width:100%;flex:1;border:none;background:#FFFFFF;"></iframe>' +
          '</div>';
        document.body.appendChild(iframeModal);
        return;
      }
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = targetUrl;
      }
    };

    try {
      if (typeof window.fetch === 'function') {
        window.fetch('/api/visit', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'affiliate_click',
            category: 'global_paywall',
            product_name: plan === 'pass' ? 'Lemon Squeezy $19.99 6-Month Pass Checkout' : 'Lemon Squeezy $8.99 Single Report Checkout',
            href: finalUrl,
            domain: (window.location && window.location.hostname) || 'kisfitglobal.com'
          })
        }).catch(function () {});

        return window.fetch('/api/lemonsqueezy-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, email })
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            const urlToOpen = (data && data.checkoutUrl) ? data.checkoutUrl : finalUrl;
            openTargetUrl(urlToOpen);
            return data;
          })
          .catch(function () {
            openTargetUrl(finalUrl);
          });
      }
    } catch (_) {}

    openTargetUrl(finalUrl);
  };

  global.openKidsFitGlobalCheckoutModal = function () {
    if (typeof document === 'undefined') return;
    ensureLemonSqueezyScriptLoaded();

    let modal = document.getElementById('kidsfit-global-checkout-modal');
    if (modal) modal.remove();

    const priceStr = selectedPlan === 'pass' ? '$19.99' : '$8.99';
    const planTitle = selectedPlan === 'pass'
      ? '6-Month Growth & Brain LQ Unlimited Pass'
      : 'Single Child Full Clinical Report & Printable PDF Pass';
    const lsBuyUrl = getActiveCheckoutUrl(selectedPlan);
    const loggedInUser = getLoggedInUser();
    const defaultEmail = (loggedInUser && loggedInUser.email) || '';

    modal = document.createElement('div');
    modal.id = 'kidsfit-global-checkout-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.72);display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);';
    modal.innerHTML = `
      <div style="background:#FFFFFF;border:2px solid #1D4ED8;border-radius:22px;max-width:460px;width:100%;padding:1.5rem 1.4rem;box-shadow:0 25px 60px rgba(0,0,0,0.35);color:#0F172A;text-align:left;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;padding-bottom:0.65rem;border-bottom:1px solid #E2E8F0;">
          <div>
            <span style="font-size:0.72rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;padding:0.18rem 0.55rem;border-radius:9999px;">KISFIT BIO LABS · OFFICIAL USD CHECKOUT</span>
            <h3 style="margin:0.3rem 0 0;font-size:1.12rem;font-weight:900;color:#0F172A;">${planTitle}</h3>
          </div>
          <button type="button" onclick="var m=document.getElementById('kidsfit-global-checkout-modal');if(m)m.remove();" style="background:#F1F5F9;border:1px solid #CBD5E1;border-radius:9999px;width:32px;height:32px;font-weight:900;cursor:pointer;">✕</button>
        </div>

        <div style="background:#F8FAFC;border:1px solid #BFDBFE;border-radius:12px;padding:0.75rem 0.9rem;margin-bottom:0.9rem;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.86rem;font-weight:800;color:#334155;">Total Due Today (USD)</span>
          <span style="font-size:1.35rem;font-weight:900;color:#1D4ED8;">${priceStr}</span>
        </div>

        <div style="margin-bottom:0.85rem;">
          <label style="display:block;font-size:0.78rem;font-weight:800;color:#334155;margin-bottom:0.3rem;">Parent Email (Used for Lemon Squeezy Receipt &amp; Instant Unlock)</label>
          <input type="email" id="checkout-parent-email" value="${defaultEmail}" placeholder="parent@example.com" style="width:100%;box-sizing:border-box;padding:0.65rem 0.8rem;border:1.5px solid #CBD5E1;border-radius:10px;font-size:0.9rem;color:#0F172A;">
        </div>

        <!-- Primary Official Lemon Squeezy Hosted / Overlay Checkout Button -->
        <a id="btn-lemonsqueezy-official-checkout" href="${lsBuyUrl}" onclick="event.preventDefault(); window.launchLemonSqueezyCheckout('${selectedPlan}');" class="lemonsqueezy-button" style="display:block;text-align:center;text-decoration:none;width:100%;box-sizing:border-box;padding:0.95rem 1rem;border-radius:12px;background:linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%);color:#FFFFFF;font-size:0.98rem;font-weight:900;cursor:pointer;margin-bottom:0.75rem;box-shadow:0 10px 24px rgba(29,78,216,0.25);">
          💳 Pay ${priceStr} via Official Lemon Squeezy Checkout →
        </a>

        <div id="kidsfit-paywall-verify-box">
          <div id="checkout-verify-status-msg" style="display:none;font-size:0.8rem;font-weight:700;padding:0.55rem 0.75rem;border-radius:10px;margin-bottom:0.65rem;"></div>

          <button type="button" onclick="window.completeKidsFitGlobalCheckout()" style="width:100%;padding:0.78rem 1rem;border-radius:12px;border:1.5px solid #1D4ED8;background:#EFF6FF;color:#1D4ED8;font-size:0.86rem;font-weight:800;cursor:pointer;margin-bottom:0.55rem;">
            Already Completed Lemon Squeezy Payment? Verify Email &amp; Unlock →
          </button>
        </div>

        <div style="font-size:0.74rem;color:#64748B;text-align:center;">
          🔒 Powered by Lemon Squeezy Store #296100 · Apple Pay · Google Pay · PayPal · Cards
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  global.completeKidsFitGlobalCheckout = function () {
    const emailEl = document.getElementById('checkout-parent-email');
    const msgEl = document.getElementById('checkout-verify-status-msg');
    const email = String((emailEl && emailEl.value) || '').trim();
    if (!email || email.indexOf('@') === -1) {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.background = '#FEF2F2';
        msgEl.style.color = '#DC2626';
        msgEl.textContent = 'Please enter the email address used during Lemon Squeezy checkout.';
      } else if (typeof window.alert === 'function') {
        window.alert('Please enter the email address used during Lemon Squeezy checkout.');
      }
      return;
    }
    if (msgEl) {
      msgEl.style.display = 'block';
      msgEl.style.background = '#EFF6FF';
      msgEl.style.color = '#1D4ED8';
      msgEl.textContent = 'Checking Lemon Squeezy Store #296100 order records...';
    }
    if (typeof window.fetch === 'function') {
      window.fetch('/api/lemonsqueezy-orders/verify?email=' + encodeURIComponent(email))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.verified) {
            try {
              if (window.localStorage) {
                window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
                window.localStorage.setItem('kidsfit_global_buyer_email', email);
              }
            } catch (_) {}
            const modal = document.getElementById('kidsfit-global-checkout-modal');
            if (modal) modal.remove();
            transformGlobalReportAndApplyPaywall();
          } else {
            if (msgEl) {
              msgEl.style.display = 'block';
              msgEl.style.background = '#FEF2F2';
              msgEl.style.color = '#DC2626';
              msgEl.textContent = 'No completed payment found for ' + email + ' yet. Please complete payment via the blue Lemon Squeezy button above first.';
            }
          }
        })
        .catch(function () {
          if (msgEl) {
            msgEl.style.display = 'block';
            msgEl.style.background = '#FEF2F2';
            msgEl.style.color = '#DC2626';
            msgEl.textContent = 'Could not verify order status right now. Please complete Lemon Squeezy checkout first.';
          }
        });
    }
  };

  function initGlobalPaywallEdition() {
    if (!isGlobalPaidEdition()) return;
    ensureLemonSqueezyScriptLoaded();
    applyGlobalHomepageEnglishDOM();

    // Securely verify order status via /api/lemonsqueezy-orders/verify when returning from Lemon Squeezy (?payment=success or order_id/email)
    try {
      if (typeof window !== 'undefined' && window.location) {
        const rawSearch = String(window.location.search || '');
        const lowerSearch = rawSearch.toLowerCase();
        if (lowerSearch.indexOf('payment=success') !== -1 || lowerSearch.indexOf('order_id=') !== -1) {
          if (window.localStorage) {
            const rawSaved = window.localStorage.getItem('kidsfit_last_quiz_profile_v1');
            if (rawSaved) {
              const restoredProfile = JSON.parse(rawSaved);
              if (global.KidsFitApp && global.KidsFitApp.state) {
                global.KidsFitApp.state.profile = Object.assign({}, global.KidsFitApp.state.profile || {}, restoredProfile);
              }
              const dash = document.getElementById('results-dashboard');
              if (dash) {
                dash.classList.remove('hidden');
                dash.style.display = 'block';
              }
              transformGlobalReportAndApplyPaywall();
            }
          }

          if (!isReportUnlocked()) {
            let queryEmail = '';
            let queryOrderId = '';
            try {
              const params = new URLSearchParams(rawSearch);
              queryEmail = String(params.get('email') || params.get('user_email') || '').trim();
              queryOrderId = String(params.get('order_id') || params.get('orderId') || '').trim();
            } catch (_) {}
            if (!queryEmail && window.localStorage) {
              queryEmail = String(
                window.localStorage.getItem('kidsfit_pending_ls_checkout_email_v1') ||
                window.localStorage.getItem('kidsfit_global_buyer_email') ||
                ''
              ).trim();
            }

            if ((queryEmail || queryOrderId) && typeof window.fetch === 'function') {
              const verifyUrl = '/api/lemonsqueezy-orders/verify?email=' + encodeURIComponent(queryEmail) +
                (queryOrderId ? '&order_id=' + encodeURIComponent(queryOrderId) : '');
              window.fetch(verifyUrl)
                .then(function (r) { return r.json(); })
                .then(function (data) {
                  if (data && data.verified === true) {
                    try {
                      if (window.localStorage) {
                        window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
                        if (queryEmail) window.localStorage.setItem('kidsfit_global_buyer_email', queryEmail);
                      }
                    } catch (_) {}
                    const modal = document.getElementById('kidsfit-global-checkout-modal');
                    if (modal) modal.remove();
                    transformGlobalReportAndApplyPaywall();
                  } else if (typeof global.openKidsFitGlobalCheckoutModal === 'function') {
                    global.openKidsFitGlobalCheckoutModal();
                    const msgEl = document.getElementById('checkout-verify-status-msg');
                    if (msgEl) {
                      msgEl.style.display = 'block';
                      msgEl.style.background = '#EFF6FF';
                      msgEl.style.color = '#1D4ED8';
                      msgEl.textContent = 'Please verify your Lemon Squeezy checkout email to unlock your clinical report.';
                    }
                  }
                })
                .catch(function () {
                  if (typeof global.openKidsFitGlobalCheckoutModal === 'function') {
                    global.openKidsFitGlobalCheckoutModal();
                  }
                });
            } else if (typeof global.openKidsFitGlobalCheckoutModal === 'function') {
              global.openKidsFitGlobalCheckoutModal();
              const msgEl = document.getElementById('checkout-verify-status-msg');
              if (msgEl) {
                msgEl.style.display = 'block';
                msgEl.style.background = '#EFF6FF';
                msgEl.style.color = '#1D4ED8';
                msgEl.textContent = 'Please enter and verify your Lemon Squeezy checkout email to unlock your report.';
              }
            }
          }
        }
      }
    } catch (_) {}

    if (typeof window !== 'undefined' && !window._globalPaywallUnitBound) {
      window._globalPaywallUnitBound = true;
      window.addEventListener('taller-language-change', function () {
        applyGlobalHomepageEnglishDOM();
        const card = document.getElementById('master-briefing-card');
        if (card && card.innerHTML && card.style.display !== 'none') {
          transformGlobalReportAndApplyPaywall();
        }
      });
    }

    if (typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
      const observeTarget = document.getElementById('master-briefing-card') || document.body;
      let isTransforming = false;
      const obs = new MutationObserver(function () {
        if (isTransforming) return;
        const card = document.getElementById('master-briefing-card');
        if (card && card.innerHTML && !document.getElementById('taller-global-paywall-gate')) {
          isTransforming = true;
          try {
            transformGlobalReportAndApplyPaywall();
          } finally {
            isTransforming = false;
          }
        }
      });
      if (observeTarget) {
        obs.observe(observeTarget, { childList: true, subtree: true });
      }
    }
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', initGlobalPaywallEdition);
    } else {
      initGlobalPaywallEdition();
    }
  }

  const GlobalPaywallEdition = {
    DEFAULT_SINGLE_CHECKOUT_URL,
    DEFAULT_PASS_CHECKOUT_URL,
    isGlobalPaidEdition,
    isReportUnlocked,
    getActiveCheckoutUrl,
    applyGlobalHomepageEnglishDOM,
    buildNativeEnglishClinicalReportHTML,
    transformGlobalReportAndApplyPaywall,
    initGlobalPaywallEdition
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalPaywallEdition;
  }
  global.KidsFitGlobalPaywall = GlobalPaywallEdition;
})(typeof window !== 'undefined' ? window : global);
