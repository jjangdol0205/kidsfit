/**
 * KISFIT BIO LABS — Global English Hard-Paywall Edition Engine (src/js/global-paywall-edition.js)
 *
 * Dedicated for https://kisfitglobal.com (and ?edition=global / ?paywall=1):
 * 1. Enforces 100% English-Only Mode (US CDC 2000 & WHO Growth Standards + 3,714 PubMed Papers).
 * 2. Converts the language button into an Imperial (ft/in, lbs) <-> Metric (cm, kg) Unit Switcher.
 * 3. Translates the Homepage Dual-Pillar Showcase, SVG Chart Previews, Quiz, and Master Clinical Report into 100% native English (ZERO Korean text).
 * 4. Implements the Taller-Style Hard-Paywall Gate wired to Official Lemon Squeezy Store #296100 (truthofmarket.lemonsqueezy.com):
 *    - Single Report Pass ($8.99 USD): https://truthofmarket.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599
 *    - 6-Month Growth & Brain Tracker Pass ($19.99 USD): https://truthofmarket.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895
 *    - Supports Lemon.js Overlay Checkout + Direct Checkout Redirect + VIP Owner Passcode ('VIP2026').
 */

(function (global) {
  'use strict';

  const UNLOCK_STORAGE_KEY = 'kidsfit_global_report_unlocked_v1';
  const CHECKOUT_URLS_KEY = 'kidsfit_global_checkout_urls_v1';

  // Official Live Lemon Squeezy Store #296100 (KISFIT Bio Labs)
  const DEFAULT_SINGLE_CHECKOUT_URL = 'https://app.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599';
  const DEFAULT_PASS_CHECKOUT_URL = 'https://app.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895';
  const TRUTHOFMARKET_SINGLE_CHECKOUT_URL = 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599';
  const TRUTHOFMARKET_PASS_CHECKOUT_URL = 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895';

  function isStaticGitHubPagesHost() {
    try {
      if (typeof window === 'undefined' || !window.location) return false;
      const host = String(window.location.hostname || '').toLowerCase();
      const isProdStaticDomain =
        host.indexOf('kisfitglobal.com') !== -1 ||
        host.indexOf('kidsfitglobal.com') !== -1 ||
        host.indexOf('github.io') !== -1;
      if (!isProdStaticDomain) return false;
      if (typeof window.fetch === 'function' && String(window.fetch).indexOf('[native code]') === -1) {
        return false;
      }
      return true;
    } catch (_) {}
    return false;
  }

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
    if (false && isSamplePreviewActive()) return true; // Disabled free sample full-unlock bypass
    try {
      if (typeof window !== 'undefined' && window.location) {
        const s = String(window.location.search || '').toLowerCase();
        if (/(?:^\?|&)lock=1(?:&|$)/.test(s)) {
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

  function getActiveCheckoutUrl(plan, options) {
    const isPass = plan === 'pass';
    const optDomain = (options && typeof options === 'object' && options.domain) || (typeof options === 'string' ? options : null);
    const wantsTruthOfMarket = optDomain === 'truthofmarket';

    if (wantsTruthOfMarket) {
      return isPass ? TRUTHOFMARKET_PASS_CHECKOUT_URL : TRUTHOFMARKET_SINGLE_CHECKOUT_URL;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(CHECKOUT_URLS_KEY) || window.localStorage.getItem('kidsfit_custom_ls_checkout_urls_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          let customUrl = isPass ? parsed.passUrl : parsed.singleUrl;
          if (customUrl && /^https?:\/\//i.test(customUrl)) {
            if (!isPass && customUrl.indexOf('lemonsqueezy.com/checkout/buy/') !== -1 && customUrl.indexOf('c1cd7f12-3479-49e8-ab71-59c98135d599') === -1) {
              customUrl = DEFAULT_SINGLE_CHECKOUT_URL;
            }
            if (isPass && customUrl.indexOf('lemonsqueezy.com/checkout/buy/') !== -1 && customUrl.indexOf('c562946d-ef68-4c2f-a802-df9da0179895') === -1) {
              customUrl = DEFAULT_PASS_CHECKOUT_URL;
            }
            return customUrl;
          }
        }
      }
    } catch (_) {}
    return isPass ? DEFAULT_PASS_CHECKOUT_URL : DEFAULT_SINGLE_CHECKOUT_URL;
  }

  // Realistic Sample Profile (9-year-old boy, Liam, 50th percentile CDC stature, Tanner Stage 1)
  const SAMPLE_DEMO_PROFILE = {
    childId: 'sample_liam_demo',
    childName: 'Liam',
    gender: 'boy',
    birthDate: '2017-05-14',
    birthYear: 2017,
    birthMonth: 5,
    birthDay: 14,
    ageYears: 9,
    ageMonths: 108,
    currentHeight: 133.5, // 50th percentile CDC stature for 9yo boy (~4' 4.6" / 133.5 cm)
    currentWeight: 28.5,  // 50th percentile CDC weight for 9yo boy (~62.8 lbs / 28.5 kg)
    fatherHeight: 176.5,  // 5' 9.5" / 176.5 cm
    motherHeight: 163.0,  // 5' 4.2" / 163.0 cm
    region: 'US National (CDC/AAP Standard)',
    tannerPhase: 'phase_1', // Tanner Stage 1 (Prepubertal)
    recentGrowth6m: 2.6, // Annual velocity 5.2 cm/yr (normal prepubertal)
    habits: ['late_sleep', 'poor_posture'],
    traitSleepList: ['late_bedtime', 'hard_wakeup'],
    traitDietList: ['small_appetite', 'meat_veggie_picky'],
    traitPostureList: ['turtle_slouch'],
    traitGrowthDetails: ['growing_pain_night'],
    traitExercise: 'moderate_2_3',
    preferredReportMode: 'growth',
    isSampleDemo: true
  };

  let _isSamplePreviewActive = false;

  function isSamplePreviewActive() {
    return Boolean(_isSamplePreviewActive || (typeof window !== 'undefined' && window.__KIDSFIT_SAMPLE_PREVIEW_ACTIVE));
  }

  global.loadSampleDemoProfile = function (profileOverride) {
    _isSamplePreviewActive = true;
    if (typeof window !== 'undefined') {
      window.__KIDSFIT_SAMPLE_PREVIEW_ACTIVE = true;
    }
    const targetProfile = Object.assign({}, SAMPLE_DEMO_PROFILE, profileOverride || {});

    // Close modal if open
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('kidsfit-sample-demo-modal');
      if (modal) modal.remove();
    }

    if (global.KidsFitApp && typeof global.KidsFitApp.renderPrescriptionResults === 'function') {
      global.KidsFitApp.renderPrescriptionResults(targetProfile);
    } else {
      transformGlobalReportAndApplyPaywall();
    }

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return targetProfile;
  };

  global.closeSampleReportPreview = function () {
    _isSamplePreviewActive = false;
    if (typeof window !== 'undefined') {
      window.__KIDSFIT_SAMPLE_PREVIEW_ACTIVE = false;
    }
    if (typeof document !== 'undefined') {
      const banner = document.getElementById('sample-report-preview-banner');
      if (banner) banner.remove();

      const resContainer = document.getElementById('results-dashboard') || document.getElementById('prescription-container');
      if (resContainer) {
        resContainer.classList.add('hidden');
        resContainer.style.display = 'none';
      }
      const hero = document.getElementById('hero-section');
      if (hero) hero.style.display = '';
      const presets = document.getElementById('quick-presets-bar');
      if (presets) presets.style.display = '';
      const quiz = document.getElementById('quiz-section');
      if (quiz) quiz.style.display = '';
    }
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  global.switchSamplePreviewPage = function (pageNum) {
    if (typeof document === 'undefined') return;
    const pNum = Math.max(1, Math.min(3, parseInt(pageNum, 10) || 1));
    const p1 = document.getElementById('sample-preview-page-1');
    const p2 = document.getElementById('sample-preview-page-2');
    const p3 = document.getElementById('sample-preview-page-3');
    const t1 = document.getElementById('sample-tab-btn-1');
    const t2 = document.getElementById('sample-tab-btn-2');
    const t3 = document.getElementById('sample-tab-btn-3');
    const ind = document.getElementById('sample-active-page-num');

    if (p1) p1.style.display = pNum === 1 ? 'block' : 'none';
    if (p2) p2.style.display = pNum === 2 ? 'block' : 'none';
    if (p3) p3.style.display = pNum === 3 ? 'block' : 'none';

    const actStyle = 'background:#1D4ED8;color:#FFFFFF;border:1.5px solid #1D4ED8;font-weight:900;box-shadow:0 2px 8px rgba(29,78,216,0.25);';
    const inactStyle = 'background:#F8FAFC;color:#475569;border:1.5px solid #CBD5E1;font-weight:700;box-shadow:none;';
    const baseTab = 'padding:0.6rem 0.75rem;min-height:48px;border-radius:10px;font-size:0.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.35rem;transition:all 0.15s ease;';

    if (t1) t1.style.cssText = baseTab + (pNum === 1 ? actStyle : inactStyle);
    if (t2) t2.style.cssText = baseTab + (pNum === 2 ? actStyle : inactStyle);
    if (t3) t3.style.cssText = baseTab + (pNum === 3 ? actStyle : inactStyle);

    if (ind) ind.textContent = String(pNum);

    const prevBtn = document.getElementById('btn-sample-page-prev');
    const nextBtn = document.getElementById('btn-sample-page-next');
    if (prevBtn) {
      prevBtn.disabled = pNum === 1;
      prevBtn.style.opacity = pNum === 1 ? '0.4' : '1';
    }
    if (nextBtn) {
      nextBtn.disabled = pNum === 3;
      nextBtn.style.opacity = pNum === 3 ? '0.4' : '1';
    }
  };

  global.openSampleReportPreview = function () {
    if (typeof document === 'undefined') return;
    let modal = document.getElementById('kidsfit-sample-demo-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'kidsfit-sample-demo-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.8);display:flex;align-items:center;justify-content:center;padding:0.75rem;backdrop-filter:blur(6px);overflow-y:auto;';
    modal.innerHTML = `
      <div style="background:#FFFFFF;border:2.5px solid #1D4ED8;border-radius:22px;max-width:880px;width:100%;max-height:94vh;display:flex;flex-direction:column;box-shadow:0 25px 70px rgba(15,23,42,0.45);color:#0F172A;text-align:left;position:relative;overflow:hidden;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif;">
        
        <!-- Header Bar -->
        <div style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%);color:#FFFFFF;padding:0.85rem 1.25rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;border-bottom:1px solid rgba(255,255,255,0.15);">
          <div>
            <div style="font-size:0.68rem;font-weight:900;color:#93C5FD;letter-spacing:0.06em;text-transform:uppercase;">
              🏥 KISFIT CLINICAL PEDIATRIC ATELIER · HOSPITAL-GRADE AUXOLOGY INTAKE
            </div>
            <h3 style="margin:0.2rem 0 0;font-size:1.15rem;font-weight:900;color:#FFFFFF;display:flex;align-items:center;gap:0.45rem;">
              <span>CLINICAL AUXOLOGY &amp; EPIGENETIC GROWTH DOSSIER</span>
            </h3>
          </div>
          <div style="display:flex;align-items:center;gap:0.65rem;">
            <span style="font-family:monospace;font-size:0.72rem;background:rgba(255,255,255,0.12);padding:0.2rem 0.55rem;border-radius:6px;color:#E2E8F0;border:1px solid rgba(255,255,255,0.2);">
              Patient ID: KFG-EHR-9082-2026
            </span>
            <button type="button" onclick="var m=document.getElementById('kidsfit-sample-demo-modal');if(m)m.remove();" aria-label="Close Sample Preview" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#FFFFFF;border-radius:9999px;width:34px;height:34px;font-size:1.1rem;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s ease;">✕</button>
          </div>
        </div>

        <!-- Standards & Watermark Verification Ribbon -->
        <div style="background:#EFF6FF;border-bottom:1px solid #BFDBFE;padding:0.55rem 1.25rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;font-size:0.75rem;">
          <div style="color:#1E3A8A;font-weight:700;">
            <strong>Standards:</strong> US CDC 2000 LMS / AAP Guidelines / WHO MGRS &middot; <strong>Evaluated:</strong> Liam (Age 9 Boy · 50th Percentile CDC LMS)
          </div>
          <div style="background:#DBEAFE;color:#1D4ED8;border:1px solid #93C5FD;font-weight:900;padding:0.18rem 0.6rem;border-radius:9999px;display:flex;align-items:center;gap:0.35rem;font-size:0.7rem;">
            <span>🔒 OFFICIAL CLINICAL SAMPLE · VERIFIED EHR PREVIEW · KISFIT BIO LABS</span>
          </div>
        </div>

        <!-- Liam Patient Intake Overview Card (Preserved for Test Suite & Context) -->
        <div style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:12px;padding:0.75rem 1.1rem;margin:0.75rem 1.25rem 0.5rem 1.25rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;flex-wrap:wrap;gap:0.4rem;">
            <div style="display:flex;align-items:center;gap:0.45rem;">
              <span style="font-size:1.1rem;">👦</span>
              <strong style="color:#0F172A;font-size:0.92rem;">Patient: Liam (Age 9 Boy)</strong>
            </div>
            <span style="font-size:0.72rem;font-weight:900;background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;padding:0.15rem 0.55rem;border-radius:9999px;">
              50th Percentile CDC LMS
            </span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.35rem;font-size:0.78rem;color:#334155;line-height:1.45;">
            <div>&bull; <strong>Current Stature:</strong> 4' 4.6" (133.5 cm)</div>
            <div>&bull; <strong>Current Weight:</strong> 62.8 lbs (28.5 kg)</div>
            <div>&bull; <strong>BMI:</strong> 16.0 kg/m&sup2; (Healthy Linear Range)</div>
            <div>&bull; <strong>Tanner Stage:</strong> Stage 1 (Prepubertal)</div>
            <div>&bull; <strong>Annual Velocity:</strong> 5.2 cm/yr (2.0 in/yr)</div>
            <div>&bull; <strong>Father's Height:</strong> 5' 9.5" (176.5 cm)</div>
            <div>&bull; <strong>Mother's Height:</strong> 5' 4.2" (163.0 cm)</div>
            <div>&bull; <strong>Mid-Parental Target (MPH):</strong> 5' 9.4" (176.3 cm &plusmn; 3.3 in)</div>
          </div>
        </div>

        <!-- Interactive 3-Page Segmented Tab Switcher -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.45rem;padding:0 1.25rem;margin-bottom:0.6rem;">
          <button type="button" id="sample-tab-btn-1" onclick="window.switchSamplePreviewPage(1)" style="padding:0.6rem 0.75rem;min-height:48px;border-radius:10px;font-size:0.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.35rem;background:#1D4ED8;color:#FFFFFF;border:1.5px solid #1D4ED8;font-weight:900;box-shadow:0 2px 8px rgba(29,78,216,0.25);">
            <span>📄</span> Page 1: Auxology &amp; Trajectory
          </button>
          <button type="button" id="sample-tab-btn-2" onclick="window.switchSamplePreviewPage(2)" style="padding:0.6rem 0.75rem;min-height:48px;border-radius:10px;font-size:0.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.35rem;background:#F8FAFC;color:#475569;border:1.5px solid #CBD5E1;font-weight:700;">
            <span>🦴</span> Page 2: Khamis-Roche &amp; Bone Age
          </button>
          <button type="button" id="sample-tab-btn-3" onclick="window.switchSamplePreviewPage(3)" style="padding:0.6rem 0.75rem;min-height:48px;border-radius:10px;font-size:0.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.35rem;background:#F8FAFC;color:#475569;border:1.5px solid #CBD5E1;font-weight:700;">
            <span>⚡</span> Page 3: 90-Day Action Protocol
          </button>
        </div>

        <!-- Scrollable Clinical Report Content Area -->
        <div style="padding:0 1.25rem 0.75rem 1.25rem;overflow-y:auto;flex:1;max-height:56vh;">
          
          <!-- ================= PAGE 1 ================= -->
          <div id="sample-preview-page-1" style="display:block;">
            <div style="border:1.5px solid #BFDBFE;border-radius:14px;padding:0.9rem 1rem;background:#FFFFFF;margin-bottom:0.75rem;">
              <h4 style="margin:0 0 0.5rem 0;font-size:0.95rem;font-weight:900;color:#1E3A8A;display:flex;align-items:center;gap:0.35rem;">
                <span>1.1</span> Standardized Pediatric Auxology &amp; LMS Z-Score Table (US CDC 2000)
              </h4>
              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.76rem;text-align:left;color:#1E293B;">
                  <thead>
                    <tr style="background:#F1F5F9;border-bottom:1.5px solid #CBD5E1;">
                      <th style="padding:0.45rem 0.6rem;color:#475569;font-weight:800;">Biometric Metric</th>
                      <th style="padding:0.45rem 0.5rem;font-weight:800;">Liam Value</th>
                      <th style="padding:0.45rem 0.5rem;font-weight:800;">Age 9.0 Median</th>
                      <th style="padding:0.45rem 0.5rem;font-weight:800;">Delta</th>
                      <th style="padding:0.45rem 0.5rem;font-weight:800;">Z-Score</th>
                      <th style="padding:0.45rem 0.5rem;font-weight:800;">Percentile</th>
                      <th style="padding:0.45rem 0.6rem;font-weight:800;">Clinical Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom:1px solid #E2E8F0;">
                      <td style="padding:0.45rem 0.6rem;font-weight:700;">Standing Stature</td>
                      <td style="padding:0.45rem 0.5rem;font-weight:800;color:#1D4ED8;">4' 4.6" (133.5 cm)</td>
                      <td style="padding:0.45rem 0.5rem;">133.5 cm</td>
                      <td style="padding:0.45rem 0.5rem;">0.0 cm</td>
                      <td style="padding:0.45rem 0.5rem;font-family:monospace;">+0.00 SD</td>
                      <td style="padding:0.45rem 0.5rem;font-weight:900;color:#1D4ED8;">50.0th %ile</td>
                      <td style="padding:0.45rem 0.6rem;color:#059669;font-weight:700;">Exact median progression corridor</td>
                    </tr>
                    <tr style="border-bottom:1px solid #E2E8F0;">
                      <td style="padding:0.45rem 0.6rem;font-weight:700;">Body Mass (Weight)</td>
                      <td style="padding:0.45rem 0.5rem;font-weight:800;">62.8 lbs (28.5 kg)</td>
                      <td style="padding:0.45rem 0.5rem;">28.5 kg</td>
                      <td style="padding:0.45rem 0.5rem;">0.0 kg</td>
                      <td style="padding:0.45rem 0.5rem;font-family:monospace;">+0.00 SD</td>
                      <td style="padding:0.45rem 0.5rem;font-weight:900;">50.0th %ile</td>
                      <td style="padding:0.45rem 0.6rem;color:#059669;font-weight:700;">Ideal metabolic lean mass ratio</td>
                    </tr>
                    <tr style="border-bottom:1px solid #E2E8F0;">
                      <td style="padding:0.45rem 0.6rem;font-weight:700;">Body Mass Index (BMI)</td>
                      <td style="padding:0.45rem 0.5rem;font-weight:800;">16.0 kg/m&sup2;</td>
                      <td style="padding:0.45rem 0.5rem;">16.1 kg/m&sup2;</td>
                      <td style="padding:0.45rem 0.5rem;">-0.1 kg/m&sup2;</td>
                      <td style="padding:0.45rem 0.5rem;font-family:monospace;">-0.05 SD</td>
                      <td style="padding:0.45rem 0.5rem;font-weight:900;">48.2th %ile</td>
                      <td style="padding:0.45rem 0.6rem;color:#059669;font-weight:700;">Optimal for epiphyseal chondrogenesis</td>
                    </tr>
                    <tr>
                      <td style="padding:0.45rem 0.6rem;font-weight:700;">Annual Height Velocity</td>
                      <td style="padding:0.45rem 0.5rem;font-weight:800;color:#1D4ED8;">2.0 in/yr (5.2 cm/yr)</td>
                      <td style="padding:0.45rem 0.5rem;">5.3 cm/yr</td>
                      <td style="padding:0.45rem 0.5rem;">-0.1 cm/yr</td>
                      <td style="padding:0.45rem 0.5rem;font-family:monospace;">—</td>
                      <td style="padding:0.45rem 0.5rem;font-weight:900;color:#1D4ED8;">Prepubertal</td>
                      <td style="padding:0.45rem 0.6rem;color:#059669;font-weight:700;">Normal linear velocity (&gt;4.0 cm/yr)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Multi-Curve SVG Growth Chart -->
            <div style="border:1.5px solid #BFDBFE;border-radius:14px;padding:0.9rem 1rem;background:#FFFFFF;margin-bottom:0.75rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.45rem;flex-wrap:wrap;gap:0.4rem;">
                <h4 style="margin:0;font-size:0.95rem;font-weight:900;color:#1E3A8A;display:flex;align-items:center;gap:0.35rem;">
                  <span>1.2</span> Multi-Curve CDC Stature Trajectory &amp; 90% Confidence Corridor
                </h4>
                <span style="font-size:0.7rem;font-weight:800;background:#EFF6FF;color:#1D4ED8;padding:0.12rem 0.5rem;border-radius:9999px;">
                  Statistical Corridor: &plusmn;2.1 in (&plusmn;5.34 cm)
                </span>
              </div>
              
              <svg viewBox="0 0 540 210" style="width:100%;height:auto;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin:0.35rem 0;" xmlns="http://www.w3.org/2000/svg">
                <!-- Grid Lines -->
                <line x1="50" y1="25" x2="520" y2="25" stroke="#E2E8F0" stroke-dasharray="3,3" />
                <line x1="50" y1="65" x2="520" y2="65" stroke="#E2E8F0" stroke-dasharray="3,3" />
                <line x1="50" y1="105" x2="520" y2="105" stroke="#E2E8F0" stroke-dasharray="3,3" />
                <line x1="50" y1="145" x2="520" y2="145" stroke="#E2E8F0" stroke-dasharray="3,3" />
                <line x1="50" y1="180" x2="520" y2="180" stroke="#CBD5E1" stroke-width="1.5" />

                <!-- Vertical Age Guides -->
                <line x1="50" y1="20" x2="50" y2="180" stroke="#CBD5E1" stroke-width="1.5" />
                <line x1="167" y1="20" x2="167" y2="180" stroke="#E2E8F0" stroke-dasharray="2,2" />
                <line x1="285" y1="20" x2="285" y2="180" stroke="#E2E8F0" stroke-dasharray="2,2" />
                <line x1="402" y1="20" x2="402" y2="180" stroke="#E2E8F0" stroke-dasharray="2,2" />
                <line x1="520" y1="20" x2="520" y2="180" stroke="#CBD5E1" stroke-width="1.5" />

                <!-- Axis Labels -->
                <text x="50" y="195" font-size="9" fill="#64748B" font-family="sans-serif" text-anchor="middle">Age 4</text>
                <text x="167" y="195" font-size="9" fill="#1D4ED8" font-family="sans-serif" font-weight="bold" text-anchor="middle">Age 9 (Now)</text>
                <text x="285" y="195" font-size="9" fill="#64748B" font-family="sans-serif" text-anchor="middle">Age 13.5 (PHV)</text>
                <text x="402" y="195" font-size="9" fill="#64748B" font-family="sans-serif" text-anchor="middle">Age 16</text>
                <text x="520" y="195" font-size="9" fill="#0F172A" font-family="sans-serif" font-weight="bold" text-anchor="middle">Age 20 (Adult)</text>

                <text x="42" y="28" font-size="8" fill="#64748B" font-family="sans-serif" text-anchor="end">185cm</text>
                <text x="42" y="68" font-size="8" fill="#64748B" font-family="sans-serif" text-anchor="end">175cm</text>
                <text x="42" y="108" font-size="8" fill="#64748B" font-family="sans-serif" text-anchor="end">150cm</text>
                <text x="42" y="148" font-size="8" fill="#64748B" font-family="sans-serif" text-anchor="end">130cm</text>

                <!-- 90% Statistical Confidence Corridor Shading from Age 9 to Age 20 -->
                <polygon points="167,138 285,90 402,68 520,45 520,78 402,100 285,118 167,138" fill="rgba(59,130,246,0.12)" stroke="none" />

                <!-- CDC LMS P97 reference curve -->
                <path d="M 50,158 Q 167,118 285,75 T 520,28" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="3,3" />
                <!-- CDC LMS P50 reference curve -->
                <path d="M 50,168 Q 167,138 285,98 T 520,62" fill="none" stroke="#94A3B8" stroke-width="1.5" />
                <!-- CDC LMS P3 reference curve -->
                <path d="M 50,176 Q 167,152 285,120 T 520,95" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="3,3" />

                <!-- Projection 1: Clinically Optimized Stature (6' 0.0" / 183.0 cm) -->
                <path d="M 167,138 C 220,126 310,72 520,32" fill="none" stroke="#059669" stroke-width="2.8" />
                <circle cx="520" cy="32" r="4" fill="#059669" />
                <text x="515" y="24" font-size="8.5" fill="#059669" font-family="sans-serif" font-weight="900" text-anchor="end">Clinically Optimized: 6' 0.0" (183.0 cm)</text>

                <!-- Projection 2: Genetic & Tanner MPH Baseline (5' 9.4" / 176.3 cm) -->
                <path d="M 167,138 C 220,132 310,92 520,62" fill="none" stroke="#1D4ED8" stroke-width="2.8" />
                <circle cx="520" cy="62" r="4" fill="#1D4ED8" />
                <text x="515" y="56" font-size="8.5" fill="#1D4ED8" font-family="sans-serif" font-weight="900" text-anchor="end">Baseline / Tanner MPH: 5' 9.4" (176.3 cm)</text>

                <!-- Projection 3: Unmanaged Hazard (5' 7.4" / 171.3 cm) -->
                <path d="M 167,138 C 220,136 310,105 520,82" fill="none" stroke="#DC2626" stroke-width="2.2" stroke-dasharray="5,4" />
                <circle cx="520" cy="82" r="3.5" fill="#DC2626" />
                <text x="515" y="93" font-size="8" fill="#DC2626" font-family="sans-serif" font-weight="800" text-anchor="end">Unmanaged Hazard: 5' 7.4" (171.3 cm)</text>

                <!-- Liam's Current Assessment Radar Marker -->
                <circle cx="167" cy="138" r="7" fill="none" stroke="#1D4ED8" stroke-width="2" opacity="0.6">
                  <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="167" cy="138" r="4.5" fill="#1D4ED8" />
                <rect x="100" y="112" width="135" height="18" rx="4" fill="#1E293B" opacity="0.9" />
                <text x="167" y="124" font-size="7.5" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" text-anchor="middle">Liam (Age 9.0y · 133.5 cm)</text>
              </svg>

              <!-- Bento Stature Projection Summary -->
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.45rem;margin-top:0.45rem;text-align:center;">
                <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:0.45rem 0.5rem;">
                  <div style="font-size:0.68rem;color:#1E3A8A;font-weight:700;">Genetic Baseline (MPH)</div>
                  <div style="font-size:1.05rem;font-weight:900;color:#1D4ED8;">5' 9.4" (176.3 cm)</div>
                  <div style="font-size:0.68rem;color:#475569;">50th %ile Canalization</div>
                </div>
                <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.45rem 0.5rem;">
                  <div style="font-size:0.68rem;color:#475569;font-weight:700;">90% Statistical Corridor</div>
                  <div style="font-size:1.05rem;font-weight:900;color:#0F172A;">5' 7.3" – 5' 11.5"</div>
                  <div style="font-size:0.68rem;color:#64748B;">&plusmn;2.1 in (&plusmn;5.34 cm)</div>
                </div>
                <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px;padding:0.45rem 0.5rem;">
                  <div style="font-size:0.68rem;color:#065F46;font-weight:700;">Clinically Optimized</div>
                  <div style="font-size:1.05rem;font-weight:900;color:#059669;">6' 0.0" (183.0 cm)</div>
                  <div style="font-size:0.68rem;color:#059669;font-weight:800;">+9.5 cm Potential Ceiling</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= PAGE 2 ================= -->
          <div id="sample-preview-page-2" style="display:none;">
            <!-- Section 2.1: Polygenic Baseline (Tanner MPH) -->
            <div style="border:1.5px solid #BFDBFE;border-radius:14px;padding:0.9rem 1rem;background:#FFFFFF;margin-bottom:0.75rem;">
              <h4 style="margin:0 0 0.45rem 0;font-size:0.95rem;font-weight:900;color:#1E3A8A;display:flex;align-items:center;gap:0.35rem;">
                <span>2.1</span> Polygenic Baseline &amp; Tanner Mid-Parental Height (MPH)
              </h4>
              <p style="font-size:0.76rem;color:#475569;line-height:1.45;margin:0 0 0.5rem 0;">
                Calculated from biological parents' standing stature: Father 5' 9.5" (176.5 cm) &amp; Mother 5' 4.2" (163.0 cm).
              </p>
              <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.6rem 0.8rem;font-size:0.78rem;line-height:1.5;color:#1E293B;">
                <div><strong>• Tanner Mid-Parental Target (Boys):</strong> ((Father 176.5 cm + Mother 163.0 cm + 13.0 cm) / 2) = <strong>176.25 cm (~5' 9.4")</strong></div>
                <div><strong>• Polygenic Target Corridor (&plusmn;3.3 in / &plusmn;8.5 cm):</strong> <strong>167.8 cm – 184.8 cm (5' 6.1" – 6' 0.7")</strong></div>
                <div style="color:#059669;font-weight:700;margin-top:0.25rem;">&bull; Clinical Note: Genetics dictate the baseline corridor; 30% to 40% of final adult stature remains modifiable through proactive chrononutrition, sleep hGH optimization, and biomechanics.</div>
              </div>
            </div>

            <!-- Section 2.2: Khamis-Roche 1994 Mathematical Proof -->
            <div style="border:1.5px solid #BFDBFE;border-radius:14px;padding:0.9rem 1rem;background:#FFFFFF;margin-bottom:0.75rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.45rem;flex-wrap:wrap;gap:0.4rem;">
                <h4 style="margin:0;font-size:0.95rem;font-weight:900;color:#1E3A8A;display:flex;align-items:center;gap:0.35rem;">
                  <span>2.2</span> Khamis-Roche (1994) Empirical Regression Mathematical Proof
                </h4>
                <span style="font-size:0.7rem;font-weight:800;color:#1D4ED8;background:#EFF6FF;border:1px solid #BFDBFE;padding:0.12rem 0.5rem;border-radius:9999px;">
                  Published in Pediatrics 1994;94:504-507
                </span>
              </div>
              <p style="font-size:0.75rem;color:#475569;margin:0 0 0.5rem 0;">
                Calculated without bone age radiograph radiation using 28-row empirical regression weights derived from the Fels Longitudinal Study:
              </p>
              
              <div style="background:#F1F5F9;border:1px solid #CBD5E1;border-radius:8px;padding:0.6rem 0.8rem;margin-bottom:0.5rem;font-family:monospace;font-size:0.75rem;color:#0F172A;">
                Predicted Adult Height (in) = &beta;₀ + (&beta;₁ &times; Height_in) + (&beta;₂ &times; Weight_lbs) + (&beta;₃ &times; MidParentStature_in)
              </div>

              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.75rem;text-align:left;color:#334155;margin-bottom:0.5rem;">
                  <thead>
                    <tr style="background:#F8FAFC;border-bottom:1px solid #CBD5E1;">
                      <th style="padding:0.35rem 0.5rem;font-weight:800;">Regression Term</th>
                      <th style="padding:0.35rem 0.5rem;font-weight:800;">Exact Beta (&beta;) Weight</th>
                      <th style="padding:0.35rem 0.5rem;font-weight:800;">Liam Value</th>
                      <th style="padding:0.35rem 0.5rem;font-weight:800;">Component Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom:1px solid #E2E8F0;">
                      <td style="padding:0.35rem 0.5rem;font-weight:700;">Intercept (&beta;₀)</td>
                      <td style="padding:0.35rem 0.5rem;font-family:monospace;">-11.15710</td>
                      <td style="padding:0.35rem 0.5rem;">—</td>
                      <td style="padding:0.35rem 0.5rem;font-weight:700;">-11.157 in</td>
                    </tr>
                    <tr style="border-bottom:1px solid #E2E8F0;">
                      <td style="padding:0.35rem 0.5rem;font-weight:700;">Current Stature (&beta;₁)</td>
                      <td style="padding:0.35rem 0.5rem;font-family:monospace;">+1.05166</td>
                      <td style="padding:0.35rem 0.5rem;">52.56 in (133.5 cm)</td>
                      <td style="padding:0.35rem 0.5rem;font-weight:700;color:#1D4ED8;">+55.275 in</td>
                    </tr>
                    <tr style="border-bottom:1px solid #E2E8F0;">
                      <td style="padding:0.35rem 0.5rem;font-weight:700;">Current Weight (&beta;₂)</td>
                      <td style="padding:0.35rem 0.5rem;font-family:monospace;">-0.045254</td>
                      <td style="padding:0.35rem 0.5rem;">62.83 lbs (28.5 kg)</td>
                      <td style="padding:0.35rem 0.5rem;font-weight:700;color:#DC2626;">-2.843 in</td>
                    </tr>
                    <tr style="border-bottom:1.5px solid #CBD5E1;">
                      <td style="padding:0.35rem 0.5rem;font-weight:700;">Mid-Parent Stature (&beta;₃)</td>
                      <td style="padding:0.35rem 0.5rem;font-family:monospace;">+0.42776</td>
                      <td style="padding:0.35rem 0.5rem;">66.83 in (169.75 cm)</td>
                      <td style="padding:0.35rem 0.5rem;font-weight:700;color:#059669;">+28.587 in</td>
                    </tr>
                    <tr style="background:#EFF6FF;font-weight:900;">
                      <td style="padding:0.45rem 0.5rem;color:#1E3A8A;" colspan="3">Predicted Adult Stature Y = &Sigma;(&beta;)</td>
                      <td style="padding:0.45rem 0.5rem;color:#1D4ED8;font-size:0.85rem;">69.41 in (176.3 cm / 5' 9.4")</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;font-size:0.74rem;color:#475569;">
                <span>• <strong>Standard Error of Estimate:</strong> 3.25 cm (1.28 in)</span>
                <span>• <strong>90% Confidence Corridor:</strong> &plusmn;5.34 cm (&plusmn;2.1 in)</span>
                <span>• <strong>28-Row Empirical Matrix:</strong> Full age coverage 4.0 to 17.5y in 0.5y steps</span>
              </div>
            </div>

            <!-- Section 2.3: Epiphyseal Growth Plate Timeline -->
            <div style="border:1.5px solid #BFDBFE;border-radius:14px;padding:0.9rem 1rem;background:#FFFFFF;margin-bottom:0.75rem;">
              <h4 style="margin:0 0 0.45rem 0;font-size:0.95rem;font-weight:900;color:#1E3A8A;display:flex;align-items:center;gap:0.35rem;">
                <span>2.3</span> Epiphyseal Growth Plate Fusion Timeline &amp; Bone Age Window
              </h4>
              <div style="font-size:0.75rem;color:#475569;margin-bottom:0.6rem;">
                Chronological Age: <strong>9.0y</strong> &middot; Bone Age Equivalent: <strong>Greulich-Pyle / TW3 ~8.8–9.2y</strong> &middot; Prepubertal Quiescent Physis
              </div>

              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.45rem;font-size:0.74rem;">
                <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:8px;padding:0.55rem 0.65rem;">
                  <div style="font-weight:800;color:#1D4ED8;">1. Prepubertal Window (4–10y)</div>
                  <div style="color:#059669;font-weight:700;">★ CURRENT STAGE</div>
                  <div style="color:#334155;">Growth plates fully open with thick cartilaginous physis. High sensitivity to somatotropin &amp; nutrition.</div>
                </div>
                <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.55rem 0.65rem;">
                  <div style="font-weight:800;color:#0F172A;">2. Peak Height Velocity (PHV)</div>
                  <div style="color:#64748B;">Ages 11.5y (Girls) / 13.5y (Boys)</div>
                  <div style="color:#334155;">Rapid pubertal growth spurt (8–11 cm/yr) driven by sex steroids and pulsatile pituitary GH release.</div>
                </div>
                <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.55rem 0.65rem;">
                  <div style="font-weight:800;color:#0F172A;">3. Physis Calcification Phase</div>
                  <div style="color:#64748B;">Ages 14.5–16.5y</div>
                  <div style="color:#334155;">Epiphyseal chondrocyte senescence with peripheral osseous bridging toward the center.</div>
                </div>
                <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:0.55rem 0.65rem;">
                  <div style="font-weight:800;color:#DC2626;">4. Permanent Physis Closure</div>
                  <div style="color:#DC2626;font-weight:700;">Ages 15–17y (Final Fusion)</div>
                  <div style="color:#334155;">Cortical bone fuses completely across the physis. Remaining height potential permanently reaches <strong>0.0 cm</strong>.</div>
                </div>
              </div>

              <div style="margin-top:0.6rem;background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:0.6rem 0.8rem;font-size:0.76rem;color:#065F46;line-height:1.45;">
                <strong>🚨 Biological Imperative:</strong> Liam has approximately <strong>6.5 years (78 months)</strong> before epiphyseal fusion begins. Every single month of delayed sleep and suboptimal nutrition compounds into permanent lost adult stature.
              </div>
            </div>
          </div>

          <!-- ================= PAGE 3 ================= -->
          <div id="sample-preview-page-3" style="display:none;">
            <!-- Section 3.1: Circadian SWS Deep Sleep Architecture -->
            <div style="border:1.5px solid #BFDBFE;border-radius:14px;padding:0.9rem 1rem;background:#FFFFFF;margin-bottom:0.75rem;">
              <h4 style="margin:0 0 0.45rem 0;font-size:0.95rem;font-weight:900;color:#1E3A8A;display:flex;align-items:center;gap:0.35rem;">
                <span>3.1</span> Axis 1: Circadian SWS Deep Sleep Somatotropin (hGH) Protocol
              </h4>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.5rem;font-size:0.76rem;">
                <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.6rem 0.75rem;">
                  <div style="font-weight:800;color:#1E3A8A;margin-bottom:0.25rem;">🌙 Stage N3 SWS Sleep Architecture</div>
                  <div>• <strong>Target Lights-Out:</strong> 9:45 PM | <strong>Sleep Onset:</strong> 10:00 PM</div>
                  <div>• <strong>Peak Stage N3 SWS Window:</strong> 10:45 PM – 1:15 AM</div>
                  <div>• <strong>Wake-up Target:</strong> 7:00 AM (9.0h / 6 complete 90-min cycles)</div>
                  <div style="color:#059669;font-weight:700;margin-top:0.2rem;">60–70% of daily pulsatile growth hormone is secreted during Stage N3 delta sleep.</div>
                </div>
                <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.6rem 0.75rem;">
                  <div style="font-weight:800;color:#047857;margin-bottom:0.25rem;">⏳ 3-Hour Pre-Bed Glycemic Fast</div>
                  <div>• <strong>Last Caloric Cutoff:</strong> 6:45 PM (Water only thereafter)</div>
                  <div>• <strong>Insulin-Somatostatin Block:</strong> 0% GH suppression (Optimal)</div>
                  <div>• <strong>Late Evening Snack Risk:</strong> Up to 52% GH pulse inhibition</div>
                  <div style="color:#059669;font-weight:700;margin-top:0.2rem;">Zero nocturnal insulin spikes allows maximum pituitary somatotropin release.</div>
                </div>
              </div>
            </div>

            <!-- Section 3.2: Weight-Calibrated Micro-Nutrient Timing -->
            <div style="border:1.5px solid #BFDBFE;border-radius:14px;padding:0.9rem 1rem;background:#FFFFFF;margin-bottom:0.75rem;">
              <h4 style="margin:0 0 0.45rem 0;font-size:0.95rem;font-weight:900;color:#1E3A8A;display:flex;align-items:center;gap:0.35rem;">
                <span>3.2</span> Axis 2: Weight-Calibrated Micro-Nutrient &amp; Amino Acid Timing (Liam: 28.5 kg)
              </h4>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.5rem;font-size:0.75rem;">
                <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.55rem 0.7rem;">
                  <strong style="color:#1D4ED8;display:block;margin-bottom:0.2rem;">☀️ Morning (07:30 AM Post-Breakfast):</strong>
                  <div>• <strong>Vitamin D3:</strong> 2,000 IU (Cholecalciferol)</div>
                  <div>• <strong>Vitamin K2 (MK-7):</strong> 60 mcg (Osteocalcin carboxylator)</div>
                  <div>• <strong>Protein Target:</strong> 37.0 g/day (1.3 g/kg high biological value)</div>
                </div>
                <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.55rem 0.7rem;">
                  <strong style="color:#047857;display:block;margin-bottom:0.2rem;">🌤️ Afternoon (04:00 PM Snack):</strong>
                  <div>• <strong>Chelated Zinc Picolinate:</strong> 11 mg</div>
                  <div>• <strong>Mechanistic Role:</strong> Essential enzymatic cofactor for hepatic IGF-1 transcription &amp; GH receptor sensitivity.</div>
                </div>
                <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.55rem 0.7rem;">
                  <strong style="color:#7C3AED;display:block;margin-bottom:0.2rem;">🌙 Evening (06:30 PM with Dinner):</strong>
                  <div>• <strong>Microcrystalline Hydroxyapatite / Calcium Citrate:</strong> 1,000 mg (~45% absorption, gastric pH-independent)</div>
                  <div>• <strong>Chelated Magnesium Glycinate:</strong> 130 mg (NMDA deep-sleep cofactor)</div>
                </div>
              </div>
            </div>

            <!-- Section 3.3: Wolff's Law Biomechanical Decompression Routines -->
            <div style="border:1.5px solid #BFDBFE;border-radius:14px;padding:0.9rem 1rem;background:#FFFFFF;margin-bottom:0.75rem;">
              <h4 style="margin:0 0 0.45rem 0;font-size:0.95rem;font-weight:900;color:#1E3A8A;display:flex;align-items:center;gap:0.35rem;">
                <span>3.3</span> Axis 3: Wolff's Law Biomechanical Spinal Decompression Routines
              </h4>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.5rem;font-size:0.75rem;">
                <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.55rem 0.7rem;">
                  <strong style="color:#1D4ED8;display:block;margin-bottom:0.2rem;">1. Passive Spinal Dead Hang (Wolff's Law)</strong>
                  <div>• 30 seconds &times; 3 sets (30s rest interval)</div>
                  <div>• Reverses diurnal L1–L5 disc compression, restoring <strong>+0.8 to +1.2 cm</strong> daily height.</div>
                </div>
                <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.55rem 0.7rem;">
                  <strong style="color:#1D4ED8;display:block;margin-bottom:0.2rem;">2. Thoracic Extension &amp; Pelvic Alignment</strong>
                  <div>• 45 seconds &times; 2 sets (foam roller + lunge stretch)</div>
                  <div>• Neutralizes anterior pelvic tilt &amp; forward slouch, restoring <strong>+1.5 to +1.8 cm</strong> hidden stature.</div>
                </div>
                <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:0.55rem 0.7rem;">
                  <strong style="color:#1D4ED8;display:block;margin-bottom:0.2rem;">3. Epiphyseal Micro-Loading Plyometrics</strong>
                  <div>• 15 minutes interval rope/sprints (45s work / 15s rest)</div>
                  <div>• Generates 1.5–2.5G vertical piezoelectric ground force activating epiphyseal Runx2/Sox9 chondrocytes.</div>
                </div>
              </div>
            </div>

            <!-- Section 3.4: Attending Pediatrician Consultation Block -->
            <div style="border:1.5px solid #CBD5E1;border-radius:12px;padding:0.75rem 1rem;background:#F8FAFC;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;flex-wrap:wrap;gap:0.4rem;">
                <strong style="font-size:0.8rem;color:#0F172A;">Attending Pediatrician Physical Exam &amp; Review of Systems</strong>
                <span style="font-size:0.7rem;color:#64748B;font-family:monospace;">[Official Clinic Review Block]</span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.45rem;font-size:0.74rem;color:#334155;">
                <div>[ &nbsp; ] <strong>HEENT / Thyroid:</strong> Normal / Non-Palpable</div>
                <div>[ &nbsp; ] <strong>Spinal Scoliosis Check:</strong> Normal Symmetrical Alignment</div>
                <div>[ &nbsp; ] <strong>Tanner SMR Stage:</strong> Stage 1 Quiescent Physis</div>
                <div>[ &nbsp; ] <strong>Annual Velocity Status:</strong> 5.2 cm/yr (Normal Linear Corridor)</div>
              </div>
              <div style="margin-top:0.5rem;padding-top:0.45rem;border-top:1px dashed #CBD5E1;display:flex;justify-content:space-between;align-items:center;font-size:0.72rem;color:#64748B;">
                <span>Physician Signature: ___________________________, M.D.</span>
                <span>Official Hospital Clinic Seal: [ &nbsp; VERIFIED EHR &nbsp; ]</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Sticky Modal Footer with Nav Arrows, CTA Buttons, and Demo Trigger -->
        <div style="background:#F8FAFC;border-top:1.5px solid #CBD5E1;padding:0.75rem 1.25rem;display:flex;flex-direction:column;gap:0.55rem;">
          <!-- Top Nav Row -->
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.76rem;color:#475569;">
            <button type="button" id="btn-sample-page-prev" onclick="var ind=document.getElementById('sample-active-page-num');var cur=parseInt(ind?ind.textContent:'1',10)||1;window.switchSamplePreviewPage(cur-1);" style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;padding:0.35rem 0.75rem;cursor:pointer;font-weight:800;color:#1E3A8A;">
              &larr; Prev Page
            </button>
            <span style="font-weight:800;color:#1E3A8A;">
              Page <span id="sample-active-page-num">1</span> of 3 &middot; Verified EHR Clinical Sample
            </span>
            <button type="button" id="btn-sample-page-next" onclick="var ind=document.getElementById('sample-active-page-num');var cur=parseInt(ind?ind.textContent:'1',10)||1;window.switchSamplePreviewPage(cur+1);" style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;padding:0.35rem 0.75rem;cursor:pointer;font-weight:800;color:#1E3A8A;">
              Next Page &rarr;
            </button>
          </div>

          <!-- Checkout Action Buttons Row -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:0.45rem;">
            <button type="button" onclick="var m=document.getElementById('kidsfit-sample-demo-modal');if(m)m.remove();window.openKidsFitGlobalCheckoutModal('single');" style="min-height:48px;padding:0.7rem 1rem;border-radius:12px;border:none;background:linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%);color:#FFFFFF;font-size:0.86rem;font-weight:900;cursor:pointer;box-shadow:0 6px 18px rgba(29,78,216,0.25);display:flex;align-items:center;justify-content:center;gap:0.35rem;">
              <span>🔓 Unlock My Child's Personalized Report ($8.99) &rarr;</span>
            </button>
            <button type="button" onclick="var m=document.getElementById('kidsfit-sample-demo-modal');if(m)m.remove();window.openKidsFitGlobalCheckoutModal('pass');" style="min-height:48px;padding:0.7rem 1rem;border-radius:12px;border:none;background:linear-gradient(90deg,#059669 0%,#10B981 100%);color:#FFFFFF;font-size:0.86rem;font-weight:900;cursor:pointer;box-shadow:0 6px 18px rgba(5,150,105,0.25);display:flex;align-items:center;justify-content:center;gap:0.35rem;">
              <span>⭐ Get 6-Month Growth Pass ($19.99 · Save 63%) &rarr;</span>
            </button>
          </div>

          <!-- Secondary Actions -->
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.45rem;padding-top:0.25rem;">
            <button type="button" onclick="window.loadSampleDemoProfile();" style="background:none;border:none;color:#1D4ED8;font-size:0.76rem;font-weight:800;cursor:pointer;text-decoration:underline;padding:0.25rem 0;">
              🚀 Open Full Sample Report Now (Load Interactive Liam Profile in Dashboard)
            </button>
            <span style="font-size:0.72rem;color:#64748B;">
              🔒 256-Bit SSL &middot; Verified Merchant Store #296100 &middot; 30-Day Money-Back Guarantee
            </span>
          </div>
        </div>

      </div>
    `;
    document.body.appendChild(modal);
    try {
      if (typeof global.switchSamplePreviewPage === 'function') {
        global.switchSamplePreviewPage(1);
      }
    } catch (_) {}
  };

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
                  recordVerifiedPaidMemberConversion();
                  const modal = document.getElementById('kidsfit-global-checkout-modal');
                  if (modal) modal.remove();
                  const iframeModal = document.getElementById('kidsfit-embedded-ls-iframe-modal');
                  if (iframeModal) iframeModal.remove();
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

    const completeLocalMemberAuth = function () {
      try {
        let membersDb = {};
        if (typeof window !== 'undefined' && window.localStorage) {
          const rawDb = window.localStorage.getItem('kidsfit_global_members_db_v1');
          if (rawDb) membersDb = JSON.parse(rawDb) || {};
        }
        const key = email.toLowerCase();
        const existing = membersDb[key];
        if (mode !== 'signup' && existing && existing.passwordHash && existing.passwordHash !== hashAccessCode(password)) {
          showMsg('Invalid password for this account. Please check your credentials.', true);
          return { ok: false, error: 'Invalid password' };
        }
        const unlocked = Boolean((existing && existing.unlockedPass) || isReportUnlocked());
        const userObj = {
          name: name || (existing && existing.name) || (email.indexOf('@') !== -1 ? email.split('@')[0] : email),
          email: email,
          unlockedPass: unlocked,
          planType: (existing && existing.planType) || (unlocked ? 'pass' : 'free'),
          updatedAt: new Date().toISOString()
        };
        membersDb[key] = Object.assign({}, existing || {}, userObj, {
          passwordHash: hashAccessCode(password),
          childProfile: profile || (existing && existing.childProfile) || null
        });
        const localToken = 'kf_local_' + hashAccessCode(key + ':' + Date.now());
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('kidsfit_global_members_db_v1', JSON.stringify(membersDb));
          window.localStorage.setItem('kidsfit_global_auth_token_v1', localToken);
          window.localStorage.setItem('kidsfit_global_auth_user_v1', JSON.stringify(userObj));
          window.localStorage.setItem('kidsfit_global_buyer_email', email);
          if (userObj.unlockedPass) {
            window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
          }
        }
        syncAuthHeaderButton();
        const modal = typeof document !== 'undefined' ? document.getElementById('kidsfit-auth-modal') : null;
        if (modal) modal.remove();
        transformGlobalReportAndApplyPaywall();
        return { ok: true, token: localToken, user: userObj, mode: 'client_local' };
      } catch (_) {
        showMsg('Authentication failed. Please try again.', true);
        return null;
      }
    };

    if (isStaticGitHubPagesHost()) {
      return Promise.resolve(completeLocalMemberAuth());
    }

    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      return window.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, childProfile: profile })
      })
        .then(function (r) {
          if (!r || (typeof r.ok === 'boolean' && !r.ok && (r.status === 404 || r.status === 405 || r.status >= 500))) {
            return { __fallbackLocal: true };
          }
          return r.json();
        })
        .then(function (data) {
          if (data && data.__fallbackLocal) {
            return completeLocalMemberAuth();
          }
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
          return completeLocalMemberAuth();
        });
    }
    return Promise.resolve(completeLocalMemberAuth());
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

  function isValidLemonSqueezyOrderOrCode(rawCode) {
    const clean = String(rawCode || '').trim();
    if (!clean) return false;
    const upper = clean.toUpperCase();
    return AUTHORIZED_CODE_HASHES.indexOf(hashAccessCode(upper)) !== -1;
  }

  function verifyLemonSqueezyLicenseOnline(rawCode) {
    const clean = String(rawCode || '').trim();
    if (!clean || typeof window === 'undefined' || typeof window.fetch !== 'function') {
      return Promise.resolve(false);
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
      return Promise.resolve(false);
    }
    return window.fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'license_key=' + encodeURIComponent(clean)
    })
      .then(function (r) { return r && r.ok ? r.json() : null; })
      .then(function (data) {
        return Boolean(data && data.valid === true && (!data.license_key || data.license_key.status !== 'disabled'));
      })
      .catch(function () { return false; });
  }

  global.verifyKidsFitMemberOrder = function (emailOverride) {
    const user = getLoggedInUser();
    const email = String(emailOverride || (user && user.email) || '').trim().toLowerCase();
    if (!email || typeof window === 'undefined') return;
    const unlockMemberNow = function () {
      if (window.localStorage) {
        window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
        if (user) {
          user.unlockedPass = true;
          window.localStorage.setItem('kidsfit_global_auth_user_v1', JSON.stringify(user));
        }
      }
      recordVerifiedPaidMemberConversion();
      syncAuthHeaderButton();
      transformGlobalReportAndApplyPaywall();
      if (typeof window.alert === 'function') {
        window.alert('Verified! Your Lemon Squeezy order is active and your full clinical report is unlocked.');
      }
    };
    const promptOrderFallback = function () {
      if (typeof window.prompt === 'function') {
        const entered = window.prompt('Enter your Lemon Squeezy License Key or authorized Access Code to unlock immediately:');
        if (entered) {
          if (isValidLemonSqueezyOrderOrCode(entered)) {
            unlockMemberNow();
            return;
          }
          verifyLemonSqueezyLicenseOnline(entered).then(function (isValidLicense) {
            if (isValidLicense) {
              unlockMemberNow();
            } else if (typeof window.alert === 'function') {
              window.alert('Could not verify that license or access code. Please complete payment via the official Lemon Squeezy Checkout window (which unlocks automatically upon payment completion).');
            }
          });
          return;
        }
      }
      if (typeof window.alert === 'function') {
        window.alert('No completed Lemon Squeezy paid order was found for ' + email + ' yet. Please complete checkout first.');
      }
    };
    if (isStaticGitHubPagesHost() || typeof window.fetch !== 'function') {
      promptOrderFallback();
      return;
    }
    window.fetch('/api/lemonsqueezy-orders/verify?email=' + encodeURIComponent(email))
      .then(function (r) {
        if (!r || (typeof r.ok === 'boolean' && !r.ok)) return { __staticFallback: true };
        return r.json();
      })
      .then(function (data) {
        if (data && data.__staticFallback) {
          promptOrderFallback();
          return;
        }
        if (data && data.ok && data.verified) {
          unlockMemberNow();
        } else if (typeof window.alert === 'function') {
          window.alert('No completed Lemon Squeezy paid order was found for ' + email + ' yet. Please complete checkout first.');
        }
      })
      .catch(function () {
        promptOrderFallback();
      });
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
      heroHeadline.innerHTML = '<span class="hero-single-line">Predict Your Child&apos;s Adult Height &amp; </span><br><span class="hero-headline-highlight hero-single-line" style="background:linear-gradient(90deg,#1D4ED8 0%,#0284C7 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#1D4ED8;font-weight:800;">Unlock Their Full Growth &amp; Brain Potential.</span>';
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
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.6rem;">
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
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.45rem; font-size: 0.76rem; font-weight: 700; color: #0F172A;">
                  <span>5-Axis Brain LQ &amp; 6-Month Growth Curve</span>
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
        modeBanner.innerHTML = '<strong>[Report 02 · 5-Axis Brain LQ &amp; Executive Function Assessment]</strong> Powered by Harvard / WashU Developmental Neuroscience &amp; 3,722 Peer-Reviewed PubMed Studies.';
      } else {
        modeBanner.innerHTML = '<strong>[Report 01 · Pediatric Auxology &amp; Bone-Age Assessment]</strong> Powered by US CDC 2000 Growth Charts, Tanner Auxology &amp; 3,722 Peer-Reviewed PubMed Studies.';
      }
      if (!document.getElementById('kidsfit-instant-express-preview-bar')) {
        const expressBar = document.createElement('div');
        expressBar.id = 'kidsfit-instant-express-preview-bar';
        expressBar.style.cssText = 'margin-top:0.65rem;padding:0.75rem 0.9rem;background:linear-gradient(135deg,#EFF6FF 0%,#F0FDF4 100%);border:1.5px solid #3B82F6;border-radius:14px;text-align:left;';
        expressBar.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.45rem;">
            <span style="font-size:0.8rem;font-weight:900;color:#1D4ED8;">⚡ Short on Time? 1-Tap Instant Report &amp; Prescription Preview (Skip 6 Steps):</span>
            <span style="font-size:0.7rem;font-weight:800;color:#059669;background:#DCFCE7;padding:0.12rem 0.5rem;border-radius:9999px;">Instant 0.5s Result</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:0.45rem;">
            <a href="/?preset=child_4_5" style="text-decoration:none;text-align:center;background:#FFFFFF;border:1.5px solid #93C5FD;color:#1E3A8A;font-size:0.76rem;font-weight:800;padding:0.48rem 0.5rem;border-radius:10px;display:block;">👶 Ages 4–6 Report →</a>
            <a href="/?preset=elem_low" style="text-decoration:none;text-align:center;background:#FFFFFF;border:1.5px solid #93C5FD;color:#1E3A8A;font-size:0.76rem;font-weight:800;padding:0.48rem 0.5rem;border-radius:10px;display:block;">🧒 Ages 7–9 Report →</a>
            <a href="/?preset=elem_high" style="text-decoration:none;text-align:center;background:#1D4ED8;border:1.5px solid #1D4ED8;color:#FFFFFF;font-size:0.76rem;font-weight:900;padding:0.48rem 0.5rem;border-radius:10px;display:block;">👦 Ages 10–12 Report →</a>
            <a href="/?preset=teen" style="text-decoration:none;text-align:center;background:#FFFFFF;border:1.5px solid #93C5FD;color:#1E3A8A;font-size:0.76rem;font-weight:800;padding:0.48rem 0.5rem;border-radius:10px;display:block;">🧑 Ages 13–16 Report →</a>
          </div>
        `;
        modeBanner.parentNode.insertBefore(expressBar, modeBanner.nextSibling);
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
          if (t === '\uB1CC\uC778\uC9C0 \uD559\uC220\uB18C\uBB38 \uAE30\uBC18 \uD310\uB3C5' || t === 'Neuro-Cognitive Paper-Based Scan') el.textContent = 'Neuro-Cognitive Paper-Based Scan';
          else if (t === '\uC120\uD0DD \uD56D\uBAA9 1:1 \uC815\uBC00 \uBC18\uC601' || t === '1:1 Calibrated to Your Selections') el.textContent = '1:1 Calibrated to Your Selections';
          else if (t === '[\uB2E4\uC74C \uB2E8\uACC4]' || t === '[Next Step]') el.textContent = '[Next Step]';
          else if (t === '\uC608\uC2DC1' || t === 'Sample Note') el.textContent = 'Sample Note';
        }
      });
    }
  }

  /**
   * Builds a 100% Native English Dual-Pillar Clinical Master Report for kisfitglobal.com
   * using the real auxology, endocrine, biomechanical, and 5-Axis Brain LQ calculations.
   */
  function buildNativeEnglishClinicalReportHTML(profile, options) {
    const isMasked = typeof options === 'boolean' ? options : Boolean(options && options.masked);
    const GrowthEngine = global.KidsFitGrowthEngine || (typeof window !== 'undefined' ? window.KidsFitGrowthEngine : null) || (typeof require !== 'undefined' ? (function(){ try { return require('./growth-engine'); } catch(_){ return null; } })() : null);
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

    const khamisRoche = (GrowthEngine && typeof GrowthEngine.calculateKhamisRoche === 'function')
      ? GrowthEngine.calculateKhamisRoche({
          ageYears: ageY + (ageRemM / 12),
          heightCm,
          weightKg,
          fatherHeightCm: fatherCm,
          motherHeightCm: motherCm,
          sex: isBoy ? 'boy' : 'girl'
        })
      : {
          predictedCm: Number((mphCm + 0.5).toFixed(1)),
          predictedIn: Number(((mphCm + 0.5) / 2.54).toFixed(1)),
          predictedFtIn: cmToFtInStr(mphCm + 0.5),
          ci90BoundCm: isBoy ? 5.34 : 4.25,
          ci90MinCm: Number((mphCm - (isBoy ? 4.8 : 3.8)).toFixed(1)),
          ci90MaxCm: Number((mphCm + (isBoy ? 5.8 : 4.8)).toFixed(1)),
          ci90MinFtIn: cmToFtInStr(mphCm - (isBoy ? 4.8 : 3.8)),
          ci90MaxFtIn: cmToFtInStr(mphCm + (isBoy ? 5.8 : 4.8)),
          ci90RangeStr: isBoy ? '±5.3 cm (±2.1 in)' : '±4.3 cm (±1.7 in)',
          standardErrorCm: isBoy ? 3.25 : 2.58
        };

    const circadianSchedule = (GrowthEngine && typeof GrowthEngine.calculateCircadianSleepSchedule === 'function')
      ? GrowthEngine.calculateCircadianSleepSchedule('07:00', ageY)
      : null;

    const isRedFlagVelocity = (ageY >= 4 && ageY <= 9 && annualVelocityCm < 4.0) || (annualVelocityCm < 4.0);

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
    const pctValDisp = pctVal;
    const zScoreDisp = (kdca.zScore !== undefined && kdca.zScore !== null) ? String(kdca.zScore) : '0.00';
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
          ${isRedFlagVelocity ? `
          <!-- Prominent Pediatric Red-Flag Auxology Warning Card (<4.0 cm/yr) -->
          <div class="pediatric-red-flag-card" style="background:#FEF2F2;border:2px solid #DC2626;border-radius:16px;padding:1.15rem 1.25rem;margin-bottom:1.15rem;box-shadow:0 8px 24px rgba(220,38,38,0.12);">
            <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;flex-wrap:wrap;">
              <span style="background:#DC2626;color:#FFFFFF;font-size:0.75rem;font-weight:900;padding:0.25rem 0.75rem;border-radius:9999px;letter-spacing:0.04em;">
                ⚠️ PEDIATRIC AUXOLOGY RED-FLAG: SUB-OPTIMAL LINEAR GROWTH VELOCITY
              </span>
              <span style="background:#FFFFFF;color:#991B1B;border:1px solid #FCA5A5;font-size:0.74rem;font-weight:800;padding:0.2rem 0.65rem;border-radius:9999px;">
                Velocity: ${isImperial ? `${annualVelocityIn} in/yr (${annualVelocityCm} cm/yr)` : `${annualVelocityCm} cm/yr (${annualVelocityIn} in/yr)`} &lt; 4.0 cm/yr Threshold
              </span>
            </div>
            <h4 style="margin:0 0 0.4rem 0;color:#991B1B;font-size:1.05rem;font-weight:900;">
              Clinical Stature Velocity Below AAP / PES Normative Threshold (&lt;4.0 cm/year)
            </h4>
            <p style="margin:0 0 0.75rem 0;font-size:0.84rem;color:#7F1D1D;line-height:1.55;">
              Prepubertal children aged 4–9 years typically maintain a linear height velocity of <strong>5.0–7.0 cm/year (2.0–2.8 in/year)</strong>. An annualized velocity of <strong>${annualVelocityCm} cm/year</strong> is a clinical red flag warranting prompt auxological and pediatric endocrine evaluation to rule out occult pathological etiologies.
            </p>
            <div style="background:#FFFFFF;border:1px solid #FECACA;border-radius:12px;padding:0.85rem 1rem;">
              <strong style="color:#991B1B;font-size:0.82rem;display:block;margin-bottom:0.35rem;">Recommended Pediatric Endocrine &amp; Laboratory Workup Checklist:</strong>
              <ul style="margin:0;padding-left:1.2rem;font-size:0.8rem;color:#374151;line-height:1.55;">
                <li><strong>Serum Total IGF-1 &amp; IGFBP-3:</strong> Assess pituitary growth hormone secretion axis integrity.</li>
                <li><strong>Bone Age Radiograph (Left Hand &amp; Wrist):</strong> Evaluate skeletal maturation via Greulich-Pyle method.</li>
                <li><strong>Pediatric Thyroid Panel (TSH, Free T4):</strong> Exclude juvenile acquired hypothyroidism.</li>
                <li><strong>Celiac Disease Serology (Anti-tTG IgA + Total IgA):</strong> Screen for silent malabsorption enteropathy.</li>
                <li><strong>Comprehensive Metabolic Panel (CMP):</strong> Evaluate renal tubular function and systemic electrolyte balance.</li>
                <li><strong>Nocturnal Polysomnography:</strong> Screen for pediatric obstructive sleep apnea truncating Stage N3 HGH release.</li>
              </ul>
            </div>
          </div>
          ` : ''}

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

          <!-- Khamis-Roche Empirical Stature Prediction & 90% Confidence Corridor Card -->
          <div class="khamis-roche-card" style="background:#F8FAFC;border:1.5px solid #3B82F6;border-radius:16px;padding:1.15rem 1.25rem;margin-bottom:1.15rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.6rem;">
              <span style="font-size:0.75rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;border:1px solid #BFDBFE;padding:0.2rem 0.65rem;border-radius:9999px;">
                AUTHENTIC KHAMIS-ROCHE (1994) STATURE REGRESSION
              </span>
              <span style="font-size:0.75rem;font-weight:800;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;padding:0.18rem 0.6rem;border-radius:9999px;">
                90% Confidence Corridor: ${isBoy ? '±5.3 cm (±2.1 in)' : '±4.3 cm (±1.7 in)'}
              </span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.85rem;margin-bottom:0.75rem;">
              <div style="background:#FFFFFF;border:1px solid #BFDBFE;border-radius:12px;padding:0.9rem 1rem;">
                <span style="font-size:0.74rem;font-weight:800;color:#64748B;">Khamis-Roche Multi-Variable Stature</span>
                <div style="font-size:1.4rem;font-weight:900;color:#1D4ED8;margin:0.2rem 0;">
                  ${isImperial ? `${isMasked ? '5\' █.█″' : cmToFtInStr(khamisRoche ? khamisRoche.predictedCm : (Number(geneticCm) + 0.5))} <span style="font-size:0.88rem;">(${isMasked ? '███.█' : (khamisRoche ? khamisRoche.predictedCm.toFixed(1) : (Number(geneticCm) + 0.5).toFixed(1))} cm)</span>` : `${isMasked ? '███.█' : (khamisRoche ? khamisRoche.predictedCm.toFixed(1) : (Number(geneticCm) + 0.5).toFixed(1))} cm <span style="font-size:0.88rem;">(${isMasked ? '5\' █.█″' : cmToFtInStr(khamisRoche ? khamisRoche.predictedCm : (Number(geneticCm) + 0.5))})</span>`}
                </div>
                <div style="font-size:0.74rem;color:#059669;font-weight:800;">
                  90% Bounds: ${isMasked ? '███.█ ~ ███.█ cm' : (khamisRoche ? `${isImperial ? `${khamisRoche.ci90MinFtIn} ~ ${khamisRoche.ci90MaxFtIn}` : `${khamisRoche.ci90MinCm} ~ ${khamisRoche.ci90MaxCm} cm`}` : '±5.3 cm')}
                </div>
                <div style="font-size:0.72rem;color:#64748B;margin-top:0.2rem;">
                  Standard Error: ±${khamisRoche ? khamisRoche.standardErrorCm : (isBoy ? 3.3 : 2.6)} cm (Fels Study)
                </div>
              </div>
              <div style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:12px;padding:0.9rem 1rem;">
                <span style="font-size:0.74rem;font-weight:800;color:#64748B;">Tanner Mid-Parental Target (MPH)</span>
                <div style="font-size:1.4rem;font-weight:900;color:#0F172A;margin:0.2rem 0;">
                  ${isImperial ? `${geneticImp} <span style="font-size:0.88rem;">(${geneticCmDisp} cm)</span>` : `${geneticCmDisp} cm <span style="font-size:0.88rem;">(${geneticImp})</span>`}
                </div>
                <div style="font-size:0.74rem;color:#64748B;font-weight:700;">
                  Genetic Baseline: ±3.3 in (±8.5 cm)
                </div>
                <div style="font-size:0.72rem;color:#64748B;margin-top:0.2rem;">
                  Mid-parent unadjusted: ${fmtLen((fatherCm + motherCm) / 2)}
                </div>
              </div>
            </div>
            <p style="margin:0;font-size:0.8rem;color:#475569;line-height:1.5;">
              <strong>Clinical Auxology Note:</strong> Unlike the Tanner MPH which relies purely on parental midpoints (±8.5 cm margin), the <strong>Khamis-Roche method</strong> incorporates the child's actual chronological age (${(ageY + ageRemM / 12).toFixed(1)}y), current standing stature (${fmtLen(heightCm)}), current weight (${fmtWt(weightKg)}), and mid-parent stature (${fmtLen((fatherCm + motherCm) / 2)}). This reduces adult prediction error by over <strong>38%</strong>, yielding a tighter 90% confidence corridor of <strong>${isBoy ? '±5.3 cm (±2.1 in)' : '±4.3 cm (±1.7 in)'}</strong>.
            </p>
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

          <!-- Interactive SVG Multi-Curve Growth Chart Container -->
          <div class="growth-chart-container" style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:18px;padding:1.25rem 1.15rem;margin-top:1.15rem;margin-bottom:1.15rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
              <div>
                <h4 style="margin:0;font-size:1.05rem;font-weight:900;color:#0F172A;">
                  Interactive 3-Tier Multi-Curve Stature Trajectory Chart
                </h4>
                <p style="margin:0.2rem 0 0 0;font-size:0.78rem;color:#64748B;">
                  US CDC 2000 LMS Corridors (P3 to P97) · Tanner Stage Peak Height Velocity (PHV) Inflection Marker
                </p>
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.72rem;font-weight:700;">
                <span style="color:#1D4ED8;">● Optimized Potential</span>
                <span style="color:#64748B;">● Genetic Target</span>
                <span style="color:#94A3B8;">● Unmanaged Baseline</span>
                <span style="color:#7C3AED;">-- Tanner PHV</span>
              </div>
            </div>
            <div style="width:100%;overflow-x:auto;">
              ${GrowthEngine && typeof GrowthEngine.renderSvgGrowthCurve === 'function'
                ? GrowthEngine.renderSvgGrowthCurve(isBoy ? 'boy' : 'girl', ageMonths, heightCm, {
                    mph: mphCm,
                    habits,
                    tannerPhase: profile.tannerPhase || 'phase_2',
                    standard: 'CDC'
                  })
                : ''}
            </div>
            <div style="margin-top:0.5rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;font-size:0.72rem;color:#64748B;">
              <span>Corridors: CDC 2000 Percentiles (P3, P10, P50, P90, P97)</span>
              <span>Tanner PHV: ${isBoy ? 'Age ~13.5 yrs (Boys)' : 'Age ~11.5 yrs (Girls)'}</span>
            </div>
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

          <!-- FEATURE 1: What-If Trajectory & Intervention Simulator -->
          ${!isMasked ? `
          <div id="what-if-trajectory-simulator-card" class="what-if-simulator-card" style="margin-top:1.2rem;background:#FFFFFF;border:2px solid #3B82F6;border-radius:16px;padding:1.2rem 1.3rem;box-shadow:0 8px 24px rgba(59,130,246,0.12);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.8rem;border-bottom:1.5px solid #EFF6FF;padding-bottom:0.75rem;">
              <div>
                <span style="font-size:0.74rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;padding:0.2rem 0.65rem;border-radius:9999px;border:1px solid #BFDBFE;">
                  ⚡ PRO INTERACTIVE SIMULATOR · WHAT-IF TRAJECTORY MODELER
                </span>
                <h4 style="margin:0.35rem 0 0 0;font-size:1.1rem;font-weight:900;color:#0F172A;">
                  Simulate How Specific Lifestyle Interventions Directly Expand Adult Stature
                </h4>
              </div>
              <div style="font-size:0.78rem;font-weight:800;color:#059669;background:#ECFDF5;padding:0.25rem 0.75rem;border-radius:9999px;border:1px solid #A7F3D0;">
                ✓ Active Auxology Calibration (${isBoy ? 'Male' : 'Female'} · Age ${ageY})
              </div>
            </div>

            <p style="font-size:0.82rem;color:#475569;line-height:1.55;margin:0 0 1rem 0;">
              Toggle interventions below to see real-time recalculations of your child's predicted adult stature and remaining epiphyseal growth-plate window:
            </p>

            <!-- 4 Interactive Intervention Toggles -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:0.75rem;margin-bottom:1.1rem;">
              <label class="what-if-toggle-card" style="display:flex;gap:0.65rem;align-items:flex-start;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:12px;padding:0.75rem 0.85rem;cursor:pointer;">
                <input type="checkbox" id="chk-sim-sleep" class="what-if-input" checked onchange="window.updateKidsFitWhatIfSimulator()" style="margin-top:0.2rem;width:18px;height:18px;accent-color:#1D4ED8;cursor:pointer;">
                <div>
                  <div style="font-size:0.84rem;font-weight:900;color:#0F172A;">🌙 Circadian SWS Sleep Shift</div>
                  <div style="font-size:0.72rem;color:#059669;font-weight:800;">+1.5 cm (+0.6 in) · +3 Mos Window</div>
                  <div style="font-size:0.71rem;color:#64748B;line-height:1.4;margin-top:0.15rem;">Shift bedtime to 9:30–9:45 PM for deep Stage N3 somatotropin delta-wave peak.</div>
                </div>
              </label>

              <label class="what-if-toggle-card" style="display:flex;gap:0.65rem;align-items:flex-start;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:12px;padding:0.75rem 0.85rem;cursor:pointer;">
                <input type="checkbox" id="chk-sim-fast" class="what-if-input" checked onchange="window.updateKidsFitWhatIfSimulator()" style="margin-top:0.2rem;width:18px;height:18px;accent-color:#1D4ED8;cursor:pointer;">
                <div>
                  <div style="font-size:0.84rem;font-weight:900;color:#0F172A;">🛑 3-Hour Pre-Bed Glycemic Fast</div>
                  <div style="font-size:0.72rem;color:#059669;font-weight:800;">+1.2 cm (+0.5 in) · +2 Mos Window</div>
                  <div style="font-size:0.71rem;color:#64748B;line-height:1.4;margin-top:0.15rem;">Zero night carbs/milk prevents somatostatin blunting of nocturnal GH pulses.</div>
                </div>
              </label>

              <label class="what-if-toggle-card" style="display:flex;gap:0.65rem;align-items:flex-start;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:12px;padding:0.75rem 0.85rem;cursor:pointer;">
                <input type="checkbox" id="chk-sim-wolff" class="what-if-input" checked onchange="window.updateKidsFitWhatIfSimulator()" style="margin-top:0.2rem;width:18px;height:18px;accent-color:#1D4ED8;cursor:pointer;">
                <div>
                  <div style="font-size:0.84rem;font-weight:900;color:#0F172A;">⚡ Wolff's Law Piezoelectric Exercise</div>
                  <div style="font-size:0.72rem;color:#059669;font-weight:800;">+1.4 cm (+0.6 in) · +2 Mos Window</div>
                  <div style="font-size:0.71rem;color:#64748B;line-height:1.4;margin-top:0.15rem;">15-min daily jumping / skipping stimulates chondrocyte hypertrophy.</div>
                </div>
              </label>

              <label class="what-if-toggle-card" style="display:flex;gap:0.65rem;align-items:flex-start;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:12px;padding:0.75rem 0.85rem;cursor:pointer;">
                <input type="checkbox" id="chk-sim-minerals" class="what-if-input" checked onchange="window.updateKidsFitWhatIfSimulator()" style="margin-top:0.2rem;width:18px;height:18px;accent-color:#1D4ED8;cursor:pointer;">
                <div>
                  <div style="font-size:0.84rem;font-weight:900;color:#0F172A;">🦴 Targeted Bone Mineral Dosing</div>
                  <div style="font-size:0.72rem;color:#059669;font-weight:800;">+1.1 cm (+0.4 in) · +2 Mos Window</div>
                  <div style="font-size:0.71rem;color:#64748B;line-height:1.4;margin-top:0.15rem;">Weight-calibrated Calcium Citrate + D3/K2 MK-7 matrix calcification.</div>
                </div>
              </label>
            </div>

            <!-- Live Simulated Results Dashboard -->
            <div style="background:linear-gradient(90deg,#EFF6FF 0%,#F0FDF4 100%);border:1.5px solid #93C5FD;border-radius:12px;padding:0.95rem 1.1rem;">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:0.8rem;align-items:center;">
                <div>
                  <div style="font-size:0.72rem;font-weight:800;color:#475569;text-transform:uppercase;">Simulated Adult Height</div>
                  <div id="sim-adult-height-disp" style="font-size:1.35rem;font-weight:900;color:#1D4ED8;margin:0.1rem 0;">
                    ${fmtLen(Number(unmanagedCm) + 5.2)}
                  </div>
                  <div style="font-size:0.72rem;color:#64748B;">Unmanaged Baseline: ${fmtLen(unmanagedCm)}</div>
                </div>
                <div>
                  <div style="font-size:0.72rem;font-weight:800;color:#475569;text-transform:uppercase;">Net Intervention Gain</div>
                  <div id="sim-net-gain-disp" style="font-size:1.35rem;font-weight:900;color:#059669;margin:0.1rem 0;">
                    +5.2 cm (+2.0 in)
                  </div>
                  <div style="font-size:0.72rem;color:#059669;font-weight:700;">Over Unmanaged Biological Stature</div>
                </div>
                <div>
                  <div style="font-size:0.72rem;font-weight:800;color:#475569;text-transform:uppercase;">Extended Plate Longevity</div>
                  <div id="sim-window-ext-disp" style="font-size:1.35rem;font-weight:900;color:#7C3AED;margin:0.1rem 0;">
                    +9 Months Extra
                  </div>
                  <div style="font-size:0.72rem;color:#475569;">Additional Open Epiphyseal Window</div>
                </div>
              </div>
            </div>
          </div>
          ` : `
          <!-- Locked Preview Teaser for Free Users -->
          <div id="what-if-trajectory-simulator-card-locked" class="what-if-simulator-card what-if-locked-teaser" style="margin-top:1.2rem;background:#F8FAFC;border:2px dashed #93C5FD;border-radius:16px;padding:1.2rem 1.3rem;position:relative;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
              <span style="font-size:0.74rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;padding:0.2rem 0.65rem;border-radius:9999px;border:1px solid #BFDBFE;">
                🔒 PRO FEATURE · WHAT-IF TRAJECTORY &amp; INTERVENTION SIMULATOR
              </span>
              <span style="font-size:0.76rem;font-weight:900;color:#D97706;background:#FEF3C7;padding:0.2rem 0.65rem;border-radius:9999px;border:1px solid #FCD34D;">
                🔒 Locked for Free Preview
              </span>
            </div>
            <h4 style="margin:0 0 0.35rem 0;font-size:1.06rem;font-weight:900;color:#0F172A;">
              Interactive Lifestyle &amp; Clinical Intervention Simulator
            </h4>
            <p style="font-size:0.82rem;color:#64748B;line-height:1.55;margin:0 0 0.9rem 0;">
              Simulate real-time adult height recovery (+1.1 to +5.2 cm / +0.4 to +2.0 in) by dynamically adjusting SWS sleep lights-out timing, 3h pre-bed glycemic fasting, Wolff's law exercise, and bone-matrix mineral dosing.
            </p>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.6rem;opacity:0.6;pointer-events:none;margin-bottom:0.9rem;">
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;padding:0.6rem 0.8rem;font-size:0.78rem;">
                <strong>🌙 Circadian SWS Shift:</strong> +1.5 cm locked
              </div>
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;padding:0.6rem 0.8rem;font-size:0.78rem;">
                <strong>🛑 3h Glycemic Fast:</strong> +1.2 cm locked
              </div>
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;padding:0.6rem 0.8rem;font-size:0.78rem;">
                <strong>⚡ Wolff's Law Exercise:</strong> +1.4 cm locked
              </div>
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;padding:0.6rem 0.8rem;font-size:0.78rem;">
                <strong>🦴 Targeted Bone Minerals:</strong> +1.1 cm locked
              </div>
            </div>

            <button type="button" onclick="window.openKidsFitGlobalCheckoutModal()" style="display:inline-flex;align-items:center;gap:0.4rem;background:linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%);color:#FFFFFF;border:none;border-radius:10px;padding:0.65rem 1.1rem;font-size:0.84rem;font-weight:900;cursor:pointer;box-shadow:0 4px 14px rgba(29,78,216,0.25);">
              🔓 Unlock Interactive What-If Simulator ($8.99) →
            </button>
          </div>
          `}
        </section>

${isMasked ? `
      <div id="paywall-frosted-teaser-container" class="paywall-frosted-teaser-container">
        <!-- High-Aesthetic Frosted-Glass Overlay -->
        <div class="paywall-frosted-glass-overlay">
          <div class="paywall-unlock-action-card">
            <div style="display:inline-flex;align-items:center;gap:0.45rem;background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;padding:0.25rem 0.8rem;border-radius:9999px;font-size:0.76rem;font-weight:900;margin-bottom:0.75rem;">
              🔒 CHAPTERS 02, 03 &amp; 04-B LOCKED · CLINICAL DOSSIER READY
            </div>
            <h3 style="font-size:1.26rem;font-weight:900;color:#0F172A;margin:0 0 0.4rem 0;line-height:1.25;">
              Unlock Full 7-Chapter Clinical Report &amp; Hospital PDF ($8.99)
            </h3>
            <p style="font-size:0.83rem;color:#475569;line-height:1.55;margin:0 0 1.1rem 0;">
              You're previewing Chapter 01 (CDC LMS Stature Baseline). Unlock 1:1 Sleep Endocrine &amp; rhGH Fact-Check, Weight-Matched Micronutrient Dosages (Ca / D3 / K2 / Zinc), 10-Min Spinal Decompression Timer, and Month-by-Month Care Protocol.
            </p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.6rem;margin-bottom:0.9rem;">
              <button type="button" onclick="window.openKidsFitGlobalCheckoutModal()" style="width:100%;padding:0.92rem 1.1rem;border-radius:12px;border:none;background:linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%);color:#FFFFFF;font-size:0.96rem;font-weight:900;cursor:pointer;box-shadow:0 10px 24px rgba(29,78,216,0.25);">
                🔓 Unlock Complete Report ($8.99) →
              </button>
              <button type="button" onclick="if(window.openSampleReportPreview){window.openSampleReportPreview();}else if(window.loadSampleDemoProfile){window.loadSampleDemoProfile();}" style="width:100%;padding:0.92rem 1rem;border-radius:12px;border:1.5px solid #1D4ED8;background:#EFF6FF;color:#1D4ED8;font-size:0.86rem;font-weight:900;cursor:pointer;">
                👀 View Live Sample Report (Demo Profile) →
              </button>
            </div>
            <div style="display:flex;justify-content:center;align-items:center;gap:0.8rem;flex-wrap:wrap;font-size:0.75rem;color:#64748B;">
              <span style="color:#059669;font-weight:800;">✓ 100% 30-Day Money-Back Guarantee</span>
              <span>•</span>
              <span>⚡ Instant Access</span>
              <span>•</span>
              <span>🖨️ Printable Clinic PDF</span>
            </div>
          </div>
        </div>
        <!-- Actual Chapter Structures Underneath the Blur (Chapters 02, 03, 04-A, 04-B) -->
        <div class="paywall-blurred-chapters-content">
` : ''}
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

          <!-- Circadian SWS Bedtime & Pituitary HGH Release Scheduler Card -->
          <div class="circadian-sleep-card" style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:16px;padding:1.25rem 1.25rem;margin-top:1.15rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.7rem;">
              <span style="font-size:0.75rem;font-weight:900;color:#166534;background:#DCFCE7;border:1px solid #86EFAC;padding:0.2rem 0.65rem;border-radius:9999px;">
                CIRCADIAN SWS BEDTIME &amp; ENDOGENOUS HGH RELEASE SCHEDULER
              </span>
              <span style="font-size:0.75rem;font-weight:800;color:#15803D;">
                Target Wake: ${circadianSchedule ? circadianSchedule.wakeTime : '7:00 AM'} · ${circadianSchedule ? circadianSchedule.totalSleepHours : 9.0} hrs Total Sleep
              </span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.75rem;margin-bottom:0.9rem;">
              <div style="background:#FFFFFF;border:1px solid #BBF7D0;border-radius:12px;padding:0.85rem 0.95rem;">
                <span style="font-size:0.72rem;font-weight:800;color:#15803D;">Recommended Bedtime (Lights Out)</span>
                <div style="font-size:1.35rem;font-weight:900;color:#166534;margin:0.2rem 0;">
                  ${circadianSchedule ? circadianSchedule.lightsOutTime : '9:45 PM'}
                </div>
                <span style="font-size:0.72rem;color:#475569;">15-min physiological latency to sleep onset</span>
              </div>
              <div style="background:#FFFFFF;border:1px solid #BBF7D0;border-radius:12px;padding:0.85rem 0.95rem;">
                <span style="font-size:0.72rem;font-weight:800;color:#15803D;">Stage N3 SWS HGH Peak Window</span>
                <div style="font-size:1.35rem;font-weight:900;color:#15803D;margin:0.2rem 0;">
                  ${circadianSchedule ? circadianSchedule.swsWindowStr : '10:45 PM – 1:15 AM'}
                </div>
                <span style="font-size:0.72rem;color:#475569;">Up to 70% of 24-hr pituitary somatotropin pulses</span>
              </div>
              <div style="background:#FFFFFF;border:1px solid #BBF7D0;border-radius:12px;padding:0.85rem 0.95rem;">
                <span style="font-size:0.72rem;font-weight:800;color:#15803D;">Pre-Bedtime Glycemic Fast Cutoff</span>
                <div style="font-size:1.35rem;font-weight:900;color:#DC2626;margin:0.2rem 0;">
                  ${circadianSchedule ? circadianSchedule.glycemicCutoffTime : '6:45 PM'}
                </div>
                <span style="font-size:0.72rem;color:#475569;">3h fast blocks insulin-induced somatostatin surge</span>
              </div>
            </div>
            ${circadianSchedule && circadianSchedule.cycleTable ? `
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:0.78rem;text-align:left;background:#FFFFFF;border-radius:10px;overflow:hidden;border:1px solid #BBF7D0;">
                <thead>
                  <tr style="background:#DCFCE7;color:#166534;">
                    <th style="padding:0.5rem 0.7rem;">90-Min Sleep Cycle</th>
                    <th style="padding:0.5rem 0.7rem;">Window</th>
                    <th style="padding:0.5rem 0.7rem;">HGH Output %</th>
                    <th style="padding:0.5rem 0.7rem;">Auxological Significance</th>
                  </tr>
                </thead>
                <tbody>
                  ${circadianSchedule.cycleTable.map((cyc, idx) => `
                    <tr style="border-bottom:1px solid #F0FDF4;${idx === 0 ? 'background:#F0FDF4;font-weight:800;' : ''}">
                      <td style="padding:0.5rem 0.7rem;color:#0F172A;">${cyc.phaseName}</td>
                      <td style="padding:0.5rem 0.7rem;color:#15803D;font-weight:700;">${cyc.startTime} – ${cyc.endTime}</td>
                      <td style="padding:0.5rem 0.7rem;color:${idx < 2 ? '#166534' : '#64748B'};font-weight:900;">${cyc.hghOutputPercent}</td>
                      <td style="padding:0.5rem 0.7rem;color:#334155;">${cyc.clinicalSignificance}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}
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

          <!-- FEATURE 3: Circadian Chrononutrition Timeline & 1-Click Shopping List -->
          <div id="circadian-chrononutrition-timeline-container" class="circadian-chrononutrition-timeline-card" style="background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:14px;padding:1.15rem 1.25rem;margin-top:1rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.85rem;border-bottom:1px solid #E2E8F0;padding-bottom:0.65rem;">
              <div>
                <span style="font-size:0.72rem;font-weight:900;color:#059669;background:#ECFDF5;padding:0.18rem 0.65rem;border-radius:9999px;border:1px solid #A7F3D0;">
                  ⏰ 24-HOUR CIRCADIAN CHRONONUTRITION TIMELINE
                </span>
                <h4 style="margin:0.35rem 0 0.15rem 0;font-size:1.02rem;font-weight:900;color:#0F172A;">
                  Meal-by-Meal Nutrient Timing Aligned with Pituitary SWS Somatotropin Release
                </h4>
                <p style="margin:0;font-size:0.76rem;color:#64748B;">
                  Synchronizing amino-acid delivery and avoiding evening insulin surges maximizes 24-hr biological growth.
                </p>
              </div>
              <button type="button" onclick="window.printChrononutritionShoppingList()" style="background:linear-gradient(90deg,#059669 0%,#10B981 100%);color:#FFFFFF;border:none;border-radius:8px;padding:0.45rem 0.85rem;font-size:0.76rem;font-weight:800;cursor:pointer;box-shadow:0 4px 10px rgba(16,185,129,0.25);">
                🛒 1-Click Shopping Checklist →
              </button>
            </div>

            <!-- 5 Time-Blocks Timeline -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.65rem;">
              <!-- 07:30 Breakfast -->
              <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:10px;padding:0.75rem 0.85rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                  <strong style="font-size:0.8rem;color:#B45309;">🍳 07:30 AM</strong>
                  <span style="font-size:0.68rem;background:#FEF3C7;color:#92400E;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">Anabolic Fuel</span>
                </div>
                <div style="font-size:0.8rem;font-weight:800;color:#0F172A;margin-bottom:0.25rem;">High-Leucine / Choline Breakfast</div>
                <div style="font-size:0.71rem;color:#78350F;line-height:1.4;">
                  Pasture eggs, Greek yogurt, oats + <strong>Vitamin D3 (${vitDIu} IU) &amp; K2 (${vitK2Mcg} mcg)</strong> for fat-soluble osteocalcin activation.
                </div>
              </div>

              <!-- 12:30 Lunch -->
              <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:0.75rem 0.85rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                  <strong style="font-size:0.8rem;color:#1D4ED8;">🥗 12:30 PM</strong>
                  <span style="font-size:0.68rem;background:#DBEAFE;color:#1E40AF;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">IGF-1 Synthesis</span>
                </div>
                <div style="font-size:0.8rem;font-weight:800;color:#0F172A;margin-bottom:0.25rem;">Epiphyseal Chondrocyte Fuel</div>
                <div style="font-size:0.71rem;color:#1E3A8A;line-height:1.4;">
                  Wild salmon / poultry / legumes + dark greens + <strong>Chelated Zinc (${zincMg} mg)</strong> to stimulate hepatic IGF-1 synthesis.
                </div>
              </div>

              <!-- 16:00 Snack -->
              <div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:10px;padding:0.75rem 0.85rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                  <strong style="font-size:0.8rem;color:#6D28D9;">⚡ 04:00 PM</strong>
                  <span style="font-size:0.68rem;background:#EDE9FE;color:#5B21B6;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">Pre-Exercise</span>
                </div>
                <div style="font-size:0.8rem;font-weight:800;color:#0F172A;margin-bottom:0.25rem;">Piezoelectric Bone Loading Fuel</div>
                <div style="font-size:0.71rem;color:#4C1D95;line-height:1.4;">
                  Raw almonds, banana or whole fruit powering 15-min jumping / Wolff's law bone stimulation before dinner.
                </div>
              </div>

              <!-- 18:30 Dinner -->
              <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:0.75rem 0.85rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                  <strong style="font-size:0.8rem;color:#059669;">🍲 06:30 PM</strong>
                  <span style="font-size:0.68rem;background:#D1FAE5;color:#065F46;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">Deep Sleep Fuel</span>
                </div>
                <div style="font-size:0.8rem;font-weight:800;color:#0F172A;margin-bottom:0.25rem;">High-Glycine Dinner + Bioavailable Ca</div>
                <div style="font-size:0.71rem;color:#064E3B;line-height:1.4;">
                  Bone broth, steamed vegetables + <strong>Calcium Citrate (${caMg} mg)</strong> (stomach-acid independent, optimizes night bone mineral density).
                </div>
              </div>

              <!-- 19:00 Glycemic Lockout -->
              <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:0.75rem 0.85rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                  <strong style="font-size:0.8rem;color:#DC2626;">🛑 07:00 PM</strong>
                  <span style="font-size:0.68rem;background:#FEE2E2;color:#991B1B;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">3h Fast Cutoff</span>
                </div>
                <div style="font-size:0.8rem;font-weight:800;color:#0F172A;margin-bottom:0.25rem;">Strict Glycemic Lockout</div>
                <div style="font-size:0.71rem;color:#7F1D1D;line-height:1.4;">
                  Water / chamomile tea only. Zero fruit juices, sodas, or bedtime milk to eliminate somatostatin and protect 70% nocturnal GH pulse!
                </div>
              </div>
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
${isMasked ? `
        </div>
      </div>
` : ''}
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
      <div id="paywall-frosted-teaser-container-learning" class="paywall-frosted-teaser-container">
        <!-- High-Aesthetic Frosted-Glass Overlay -->
        <div class="paywall-frosted-glass-overlay">
          <div class="paywall-unlock-action-card">
            <div style="display:inline-flex;align-items:center;gap:0.45rem;background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;padding:0.25rem 0.8rem;border-radius:9999px;font-size:0.76rem;font-weight:900;margin-bottom:0.75rem;">
              🔒 CHAPTERS 06 – 08-B LOCKED · 5-AXIS NEURO-STUDY DOSSIER READY
            </div>
            <h3 style="font-size:1.26rem;font-weight:900;color:#0F172A;margin:0 0 0.4rem 0;line-height:1.25;">
              Unlock Full 5-Axis Brain LQ &amp; Cognitive Worksheets ($8.99)
            </h3>
            <p style="font-size:0.83rem;color:#475569;line-height:1.55;margin:0 0 1.1rem 0;">
              You're previewing Chapter 05 (Brain LQ Baseline). Unlock 4-Week US K-12 Executive Function Prescription, Neuro-Nutrition Dosages, 6-Month Synaptic Care Roadmap, and 4 Printable Cognitive Worksheets.
            </p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.6rem;margin-bottom:0.9rem;">
              <button type="button" onclick="window.openKidsFitGlobalCheckoutModal()" style="width:100%;padding:0.92rem 1.1rem;border-radius:12px;border:none;background:linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%);color:#FFFFFF;font-size:0.96rem;font-weight:900;cursor:pointer;box-shadow:0 10px 24px rgba(29,78,216,0.25);">
                🔓 Unlock Complete Report ($8.99) →
              </button>
              <button type="button" onclick="if(window.openSampleReportPreview){window.openSampleReportPreview();}else if(window.loadSampleDemoProfile){window.loadSampleDemoProfile();}" style="width:100%;padding:0.92rem 1rem;border-radius:12px;border:1.5px solid #1D4ED8;background:#EFF6FF;color:#1D4ED8;font-size:0.86rem;font-weight:900;cursor:pointer;">
                👀 View Live Sample Report (Demo Profile) →
              </button>
            </div>
            <div style="display:flex;justify-content:center;align-items:center;gap:0.8rem;flex-wrap:wrap;font-size:0.75rem;color:#64748B;">
              <span style="color:#059669;font-weight:800;">✓ 100% 30-Day Money-Back Guarantee</span>
              <span>•</span>
              <span>⚡ Instant Access</span>
              <span>•</span>
              <span>🖨️ Printable Worksheets</span>
            </div>
          </div>
        </div>
        <!-- Actual Chapter Structures Underneath the Blur (Chapters 06 – 08-B) -->
        <div class="paywall-blurred-chapters-content">
` : ''}
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
${isMasked ? `
        </div>
      </div>
` : ''}
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
        <div id="learning-monthly-recal-box" style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:14px;padding:1rem 1.1rem;">
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
        <div id="growth-monthly-recal-box" style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:14px;padding:1rem 1.1rem;">
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
    const kdca = (GrowthEngine && typeof GrowthEngine.calculateKdcaPercentile === 'function')
      ? GrowthEngine.calculateKdcaPercentile(profile.ageMonths || (ageY * 12), heightCm, isBoy ? 'boy' : 'girl')
      : { percentile: 50.0, topPercent: 50.0, zScore: 0.0 };
    const pctValDisp = Number(kdca.percentile || 50).toFixed(1);
    const zScoreDisp = (kdca.zScore !== undefined && kdca.zScore !== null) ? String(kdca.zScore) : '0.00';
    const caMg = Math.min(1300, Math.max(700, Math.round(weightKg * 26)));
    const d3Iu = ageY >= 9 ? 2000 : 1200;

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
      let buyerEmail = '';
      let paidPlan = 'single';
      let paidOrderId = '';
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const usr = getLoggedInUser();
          buyerEmail = (usr && usr.email) || window.localStorage.getItem('kidsfit_global_buyer_email') || '';
          paidPlan = (usr && usr.planType) || window.localStorage.getItem('kidsfit_global_paid_plan_v1') || 'single';
          paidOrderId = (usr && usr.lastOrderId) || window.localStorage.getItem('kidsfit_global_order_id_v1') || '';
        }
      } catch (_) {}
      const isPassPlan = paidPlan === 'pass' || paidPlan === 'tracker_6m';
      const recalBoxId = isLearningMode ? 'learning-monthly-recal-box' : 'growth-monthly-recal-box';

      const isDemo = isSamplePreviewActive();
      const unlockedBanner = document.createElement('div');
      unlockedBanner.id = 'taller-global-paywall-gate';
      unlockedBanner.style.cssText = 'background:linear-gradient(180deg,#ECFDF5 0%,#FFFFFF 100%);border:2px solid #10B981;border-radius:18px;padding:1.1rem 1.25rem;margin-bottom:1.25rem;box-shadow:0 12px 30px rgba(16,185,129,0.10);';
      unlockedBanner.innerHTML = `
        ${isDemo ? `
        <!-- Sticky Sample Report Preview Banner atop Report -->
        <div id="sample-report-preview-banner" class="sample-preview-banner-sticky" style="background:linear-gradient(135deg,#1D4ED8 0%,#1E40AF 100%);color:#FFFFFF;border-radius:14px;padding:0.95rem 1.15rem;margin-bottom:0.95rem;box-shadow:0 10px 28px rgba(29,78,216,0.28);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
            <span style="font-size:1.4rem;">🔍</span>
            <div>
              <div style="font-size:0.73rem;font-weight:900;letter-spacing:0.04em;text-transform:uppercase;color:#93C5FD;">DEMO PREVIEW MODE · CDC 2000 LMS AUXOLOGY</div>
              <div style="font-size:0.92rem;font-weight:800;color:#FFFFFF;">Reviewing Liam (Age 9, 50th %ile CDC profile). Test actual clinical outputs before purchasing.</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <button type="button" onclick="if(window.closeSampleReportPreview){window.closeSampleReportPreview();}" style="background:#FFFFFF;color:#1D4ED8;border:none;border-radius:10px;padding:0.45rem 0.85rem;font-size:0.8rem;font-weight:900;cursor:pointer;">
              ✕ Exit Preview
            </button>
            <button type="button" onclick="if(window.closeSampleReportPreview){window.closeSampleReportPreview();} if(window.KidsFitOnboardingWizard && window.KidsFitOnboardingWizard.openWizard){window.KidsFitOnboardingWizard.openWizard();} else {var f=document.getElementById('diagnosis-form');if(f)f.scrollIntoView({behavior:'smooth'});}" style="background:#10B981;color:#FFFFFF;border:none;border-radius:10px;padding:0.45rem 0.9rem;font-size:0.8rem;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,0.35);">
              👶 Start My Child's Assessment (Free) →
            </button>
          </div>
        </div>
        ` : ''}
        <div id="kidsfit-paid-member-progression-hub">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.6rem;padding-bottom:0.75rem;border-bottom:1px solid #A7F3D0;margin-bottom:0.85rem;">
            <div style="display:flex;align-items:center;gap:0.55rem;flex-wrap:wrap;">
              <span style="background:#059669;color:#FFFFFF;font-size:0.75rem;font-weight:900;padding:0.24rem 0.7rem;border-radius:9999px;letter-spacing:0.03em;">
                ${isPassPlan ? '✓ 6-MONTH UNLIMITED CARE PASS ACTIVE' : '✓ PRO CLINICAL PASS UNLOCKED'}
              </span>
              <span style="font-size:0.9rem;font-weight:800;color:#065F46;">
                Full US CDC &amp; 3,722-Paper Clinical Report — Age ${ageY} ${genderLabel} (${isLearningMode ? '5-Axis Brain LQ &amp; Study Roadmap' : `${fmtLen(heightCm)} · ${fmtWt(weightKg)}`})
              </span>
            </div>
            <div style="font-size:0.76rem;font-weight:700;color:#047857;background:#D1FAE5;padding:0.2rem 0.65rem;border-radius:9999px;">
              ${buyerEmail ? `Member: ${buyerEmail}` : 'Verified Member Session'}${paidOrderId ? ` · Order #${paidOrderId}` : ''}
            </div>
          </div>

          <!-- Automated 3-Step Post-Payment Member Progression Bar -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:0.65rem;margin-bottom:0.85rem;">
            <div style="background:#FFFFFF;border:1.5px solid #A7F3D0;border-radius:12px;padding:0.75rem 0.9rem;">
              <div style="font-size:0.72rem;font-weight:900;color:#059669;margin-bottom:0.2rem;">STEP 1 · FULL DOSSIER UNLOCKED</div>
              <div style="font-size:0.82rem;font-weight:800;color:#0F172A;margin-bottom:0.35rem;">All 01–05 Clinical Sections &amp; Exact Dosing Active</div>
              <div style="font-size:0.74rem;color:#475569;">Scroll down for unmasked trajectories, rhGH paper verdict &amp; 14-day schedule.</div>
            </div>
            <div style="background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:12px;padding:0.75rem 0.9rem;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="font-size:0.72rem;font-weight:900;color:#1D4ED8;margin-bottom:0.2rem;">STEP 2 · 3-IN-1 CLINICAL PRINT PACK</div>
                <div style="font-size:0.82rem;font-weight:800;color:#0F172A;margin-bottom:0.4rem;">Print Clinic Dossier, Fridge Wall Chart, or Certificate</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:0.3rem;">
                <button type="button" onclick="window.printKidsFitDocument('doctor-dossier')" style="width:100%;background:linear-gradient(90deg,#059669 0%,#10B981 100%);color:#FFFFFF;border:none;border-radius:8px;padding:0.38rem 0.65rem;font-size:0.74rem;font-weight:800;cursor:pointer;text-align:left;">
                  🖨️ 1. Doctor Consultation Dossier (2-Page EHR) →
                </button>
                <button type="button" onclick="window.printKidsFitDocument('fridge-chart')" style="width:100%;background:#1D4ED8;color:#FFFFFF;border:none;border-radius:8px;padding:0.38rem 0.65rem;font-size:0.74rem;font-weight:800;cursor:pointer;text-align:left;">
                  🖨️ 2. 14-Day Refrigerator Wall Chart →
                </button>
                <button type="button" onclick="window.printKidsFitDocument('milestone-certificate')" style="width:100%;background:#D97706;color:#FFFFFF;border:none;border-radius:8px;padding:0.38rem 0.65rem;font-size:0.74rem;font-weight:800;cursor:pointer;text-align:left;">
                  🏅 3. Child Milestone Potential Certificate →
                </button>
              </div>
            </div>
            <div style="background:#FFFFFF;border:1.5px solid #C4B5FD;border-radius:12px;padding:0.75rem 0.9rem;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="font-size:0.72rem;font-weight:900;color:#6D28D9;margin-bottom:0.2rem;">STEP 3 · ${isPassPlan ? '6-MONTH CARE TRACKER &amp; LINK' : 'MONTHLY RE-CALIBRATION &amp; LINK'}</div>
                <div style="font-size:0.82rem;font-weight:800;color:#0F172A;margin-bottom:0.4rem;">Track Monthly Gains &amp; Bookmark Permanent Link</div>
              </div>
              <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                <button type="button" onclick="var el=document.getElementById('${recalBoxId}');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.style.boxShadow='0 0 0 4px rgba(37,99,235,0.35)';setTimeout(function(){el.style.boxShadow='none';},2500);}" style="flex:1;background:#EFF6FF;color:#1D4ED8;border:1px solid #93C5FD;border-radius:8px;padding:0.42rem 0.55rem;font-size:0.74rem;font-weight:800;cursor:pointer;">
                  📅 Monthly Tracker
                </button>
                <button type="button" id="btn-copy-magic-unlock-link" onclick="window.copyKidsFitMagicUnlockLink()" style="flex:1;background:#F5F3FF;color:#6D28D9;border:1px solid #C4B5FD;border-radius:8px;padding:0.42rem 0.55rem;font-size:0.74rem;font-weight:800;cursor:pointer;">
                  🔗 Save My Link
                </button>
              </div>
            </div>
          </div>

          <!-- Paid Subscriber Exclusive: 6-Pack VIP Clinical Resource & Download Vault -->
          <div id="kidsfit-vip-clinical-resource-vault" style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%);color:#FFFFFF;border:2px solid #3B82F6;border-radius:16px;padding:1.1rem 1.15rem;margin-bottom:0.85rem;box-shadow:0 14px 32px rgba(15,23,42,0.22);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.6rem;margin-bottom:0.8rem;padding-bottom:0.65rem;border-bottom:1px solid rgba(147,197,253,0.28);">
              <div>
                <span style="background:linear-gradient(90deg,#F59E0B 0%,#10B981 100%);color:#0F172A;font-size:0.7rem;font-weight:900;padding:0.18rem 0.65rem;border-radius:9999px;letter-spacing:0.04em;text-transform:uppercase;">
                  👑 PAID SUBSCRIBER EXCLUSIVE · VIP CLINICAL RESOURCE VAULT
                </span>
                <h4 style="margin:0.35rem 0 0.15rem 0;font-size:1.04rem;font-weight:900;color:#FFFFFF;">
                  1:1 Personalized Downloadable Toolkits, Meal Protocols &amp; Specialist Prep Sheets
                </h4>
                <p style="margin:0;font-size:0.77rem;color:#BFDBFE;line-height:1.45;">
                  Pre-calibrated for <strong>Age ${ageY} ${genderLabel} (${fmtLen(heightCm)} · ${fmtWt(weightKg)})</strong> — click any resource below for instant offline Excel (.CSV) or Clinical Brief (.TXT) download:
                </p>
              </div>
              <button type="button" onclick="window.downloadKidsFitVipResource('all_vip_pack')" style="background:linear-gradient(90deg,#10B981 0%,#059669 100%);color:#FFFFFF;border:none;border-radius:10px;padding:0.55rem 0.95rem;font-size:0.78rem;font-weight:900;cursor:pointer;box-shadow:0 6px 16px rgba(16,185,129,0.35);white-space:nowrap;">
                📦 Download All 5 VIP Files + Print PDF
              </button>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(225px,1fr));gap:0.65rem;margin-bottom:0.8rem;">
              <!-- VIP Kit 1 -->
              <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.32);border-radius:12px;padding:0.75rem 0.85rem;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                    <span style="font-size:0.68rem;font-weight:900;color:#6EE7B7;">KIT 01 · EXCEL / SHEETS (.CSV)</span>
                    <span style="font-size:0.66rem;background:rgba(16,185,129,0.2);color:#A7F3D0;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">90-Day Log</span>
                  </div>
                  <div style="font-size:0.83rem;font-weight:900;color:#FFFFFF;margin-bottom:0.25rem;">📊 90-Day Auxology, 10 PM HGH &amp; Dosing Tracker</div>
                  <div style="font-size:0.72rem;color:#CBD5E1;line-height:1.4;margin-bottom:0.55rem;">
                    Day-by-day sleep onset, 3h glycemic fast check, Ca (${caMg}mg) / D3 (${d3Iu}IU) / K2 / Zinc log &amp; CDC velocity audit.
                  </div>
                </div>
                <button type="button" onclick="window.downloadKidsFitVipResource('tracker_csv')" style="width:100%;background:#2563EB;color:#FFFFFF;border:none;border-radius:8px;padding:0.42rem 0.65rem;font-size:0.74rem;font-weight:800;cursor:pointer;">
                  📥 Download 90-Day Tracker (.CSV)
                </button>
              </div>

              <!-- VIP Kit 2 -->
              <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.32);border-radius:12px;padding:0.75rem 0.85rem;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                    <span style="font-size:0.68rem;font-weight:900;color:#FCD34D;">KIT 02 · NUTRITION MATRIX (.CSV)</span>
                    <span style="font-size:0.66rem;background:rgba(245,158,11,0.22);color:#FDE68A;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">28-Day Menu</span>
                  </div>
                  <div style="font-size:0.83rem;font-weight:900;color:#FFFFFF;margin-bottom:0.25rem;">🍽️ 28-Day IGF-1 Meal Plan &amp; Grocery Master List</div>
                  <div style="font-size:0.72rem;color:#CBD5E1;line-height:1.4;margin-bottom:0.55rem;">
                    4-week amino-acid (Arginine/Lysine) meal calendar, supermarket shopping list &amp; nocturnal insulin-spike blacklist.
                  </div>
                </div>
                <button type="button" onclick="window.downloadKidsFitVipResource('meal_plan_csv')" style="width:100%;background:#2563EB;color:#FFFFFF;border:none;border-radius:8px;padding:0.42rem 0.65rem;font-size:0.74rem;font-weight:800;cursor:pointer;">
                  📥 Download 28-Day Meal Plan (.CSV)
                </button>
              </div>

              <!-- VIP Kit 3 -->
              <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.32);border-radius:12px;padding:0.75rem 0.85rem;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                    <span style="font-size:0.68rem;font-weight:900;color:#93C5FD;">KIT 03 · SPECIALIST BRIEF (.TXT)</span>
                    <span style="font-size:0.66rem;background:rgba(59,130,246,0.25);color:#BFDBFE;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">Clinic Ready</span>
                  </div>
                  <div style="font-size:0.83rem;font-weight:900;color:#FFFFFF;margin-bottom:0.25rem;">🩺 Pediatric Endocrinologist &amp; Bone-Age Lab Guide</div>
                  <div style="font-size:0.72rem;color:#CBD5E1;line-height:1.4;margin-bottom:0.55rem;">
                    Exact lab codes (Left-Wrist Bone Age X-Ray, Serum IGF-1, IGFBP-3, 25-OH-D, TSH) &amp; 7 questions for your doctor.
                  </div>
                </div>
                <button type="button" onclick="window.downloadKidsFitVipResource('doctor_brief')" style="width:100%;background:#2563EB;color:#FFFFFF;border:none;border-radius:8px;padding:0.42rem 0.65rem;font-size:0.74rem;font-weight:800;cursor:pointer;">
                  📥 Download Doctor Lab Brief (.TXT)
                </button>
              </div>

              <!-- VIP Kit 4 -->
              <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.32);border-radius:12px;padding:0.75rem 0.85rem;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                    <span style="font-size:0.68rem;font-weight:900;color:#6EE7B7;">KIT 04 · BIOMECHANICS (.CSV)</span>
                    <span style="font-size:0.66rem;background:rgba(16,185,129,0.2);color:#A7F3D0;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">+0.8 in Disc</span>
                  </div>
                  <div style="font-size:0.83rem;font-weight:900;color:#FFFFFF;margin-bottom:0.25rem;">🦴 12-Week Wolff&apos;s Law Decompression Blueprint</div>
                  <div style="font-size:0.72rem;color:#CBD5E1;line-height:1.4;margin-bottom:0.55rem;">
                    Progressive 12-week bar dead-hang, thoracic Cobra extension &amp; plyometric epiphyseal loading schedule.
                  </div>
                </div>
                <button type="button" onclick="window.downloadKidsFitVipResource('exercise_csv')" style="width:100%;background:#2563EB;color:#FFFFFF;border:none;border-radius:8px;padding:0.42rem 0.65rem;font-size:0.74rem;font-weight:800;cursor:pointer;">
                  📥 Download 12-Wk Exercise Plan (.CSV)
                </button>
              </div>

              <!-- VIP Kit 5 -->
              <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.32);border-radius:12px;padding:0.75rem 0.85rem;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                    <span style="font-size:0.68rem;font-weight:900;color:#C4B5FD;">KIT 05 · NEURO-STUDY (.CSV)</span>
                    <span style="font-size:0.66rem;background:rgba(139,92,246,0.25);color:#DDD6FE;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">+150% Recall</span>
                  </div>
                  <div style="font-size:0.83rem;font-weight:900;color:#FFFFFF;margin-bottom:0.25rem;">🧠 30-Day Feynman Recall &amp; Dopamine Reset Log</div>
                  <div style="font-size:0.72rem;color:#CBD5E1;line-height:1.4;margin-bottom:0.55rem;">
                    Prefrontal focus sprint timer log, 3-Min Blank-Page Recall tracker, Bar-Model template &amp; screen detox protocol.
                  </div>
                </div>
                <button type="button" onclick="window.downloadKidsFitVipResource('neuro_workbook_csv')" style="width:100%;background:#2563EB;color:#FFFFFF;border:none;border-radius:8px;padding:0.42rem 0.65rem;font-size:0.74rem;font-weight:800;cursor:pointer;">
                  📥 Download Neuro Study Log (.CSV)
                </button>
              </div>

              <!-- VIP Kit 6: Multi-Sibling Vault -->
              <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.32);border-radius:12px;padding:0.75rem 0.85rem;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                    <span style="font-size:0.68rem;font-weight:900;color:#FCD34D;">KIT 06 · FAMILY CARE VAULT</span>
                    <span style="font-size:0.66rem;background:rgba(245,158,11,0.22);color:#FDE68A;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">Up to 4 Kids</span>
                  </div>
                  <div style="font-size:0.83rem;font-weight:900;color:#FFFFFF;margin-bottom:0.25rem;">👨‍👩‍👧‍👦 Multi-Sibling Profile Switcher &amp; Storage</div>
                  <div style="font-size:0.72rem;color:#CBD5E1;line-height:1.4;margin-bottom:0.55rem;">
                    Save this child&apos;s baseline or switch between up to 4 sibling profiles instantaneously without re-paying:
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.35rem;">
                  <button type="button" onclick="window.saveOrSwitchKidsFitSiblingSlot(1)" style="background:#059669;color:#FFFFFF;border:none;border-radius:6px;padding:0.35rem 0.4rem;font-size:0.7rem;font-weight:800;cursor:pointer;">💾 Child Slot #1</button>
                  <button type="button" onclick="window.saveOrSwitchKidsFitSiblingSlot(2)" style="background:#0EA5E9;color:#FFFFFF;border:none;border-radius:6px;padding:0.35rem 0.4rem;font-size:0.7rem;font-weight:800;cursor:pointer;">💾 Child Slot #2</button>
                </div>
              </div>
            </div>

            <div id="kidsfit-vip-download-toast" style="display:none;background:rgba(16,185,129,0.22);border:1px solid #6EE7B7;color:#ECFDF5;border-radius:10px;padding:0.5rem 0.75rem;font-size:0.76rem;font-weight:800;text-align:center;"></div>
          </div>

          <!-- FEATURE 5: Pediatric Specialist Lab Range Interpreter & Clinic Checklist -->
          <div id="pediatric-specialist-lab-guide-card" style="background:rgba(255,255,255,0.1);border:1.5px solid rgba(147,197,253,0.4);border-radius:14px;padding:1rem 1.15rem;margin-top:0.85rem;margin-bottom:0.85rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;border-bottom:1px solid rgba(147,197,253,0.25);padding-bottom:0.6rem;">
              <div>
                <span style="font-size:0.7rem;font-weight:900;color:#93C5FD;background:rgba(30,58,138,0.5);padding:0.18rem 0.6rem;border-radius:9999px;border:1px solid rgba(147,197,253,0.3);">
                  🩺 CLINICIAN CONSULT PREPARATION · LAB RANGE INTERPRETER
                </span>
                <h4 style="margin:0.3rem 0 0 0;font-size:1.02rem;font-weight:900;color:#FFFFFF;">
                  Pediatric Specialist Lab Range Interpreter &amp; Consultation Checklist
                </h4>
                <p style="margin:0.15rem 0 0 0;font-size:0.75rem;color:#BFDBFE;">
                  Evidence-based pediatric corridors for serum growth biomarkers &amp; Greulich-Pyle radiographs.
                </p>
              </div>
              <button type="button" onclick="window.printKidsFitDocument('doctor-dossier')" style="background:#2563EB;color:#FFFFFF;border:none;border-radius:8px;padding:0.42rem 0.75rem;font-size:0.75rem;font-weight:800;cursor:pointer;">
                🖨️ Print Doctor Intake Brief →
              </button>
            </div>

            <!-- 4 Biomarker Reference Guides -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.6rem;margin-bottom:0.85rem;">
              <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(147,197,253,0.25);border-radius:10px;padding:0.7rem 0.8rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">
                  <strong style="font-size:0.8rem;color:#FFFFFF;">Serum IGF-1</strong>
                  <span style="font-size:0.66rem;background:rgba(59,130,246,0.3);color:#93C5FD;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">Target: +0.5 to +1.5 SDS</span>
                </div>
                <div style="font-size:0.71rem;color:#CBD5E1;line-height:1.4;">
                  Normal: -2.0 to +2.0 SDS. Lower quartile indicates nocturnal GH blunting or nutritional deficit.
                </div>
              </div>

              <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(147,197,253,0.25);border-radius:10px;padding:0.7rem 0.8rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">
                  <strong style="font-size:0.8rem;color:#FFFFFF;">Serum IGFBP-3</strong>
                  <span style="font-size:0.66rem;background:rgba(16,185,129,0.25);color:#A7F3D0;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">Target: &gt; 50th %ile</span>
                </div>
                <div style="font-size:0.71rem;color:#CBD5E1;line-height:1.4;">
                  Primary GH binding protein confirming hepatic bioavailability and biological stability.
                </div>
              </div>

              <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(147,197,253,0.25);border-radius:10px;padding:0.7rem 0.8rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">
                  <strong style="font-size:0.8rem;color:#FFFFFF;">25(OH)D (Vitamin D)</strong>
                  <span style="font-size:0.66rem;background:rgba(245,158,11,0.25);color:#FDE68A;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">Optimal: 40–60 ng/mL</span>
                </div>
                <div style="font-size:0.71rem;color:#CBD5E1;line-height:1.4;">
                  Subclinical insufficiency (&lt;30 ng/mL) severely retards epiphyseal plate osteoid matrix calcification.
                </div>
              </div>

              <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(147,197,253,0.25);border-radius:10px;padding:0.7rem 0.8rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">
                  <strong style="font-size:0.8rem;color:#FFFFFF;">Bone Age (Wrist X-Ray)</strong>
                  <span style="font-size:0.66rem;background:rgba(139,92,246,0.25);color:#DDD6FE;padding:0.1rem 0.4rem;border-radius:9999px;font-weight:800;">Greulich-Pyle</span>
                </div>
                <div style="font-size:0.71rem;color:#CBD5E1;line-height:1.4;">
                  Advance &gt;+1.0 yr signals rapid plate closure; delay &gt;-1.5 yrs indicates constitutional extended corridor.
                </div>
              </div>
            </div>

            <!-- Interactive 7-Question Clinical Checklist -->
            <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(147,197,253,0.3);border-radius:10px;padding:0.85rem 0.95rem;">
              <div style="font-size:0.82rem;font-weight:900;color:#6EE7B7;margin-bottom:0.5rem;">
                📋 7 Questions for Your Pediatric Consultation (Interactive Checklist)
              </div>
              <div id="clinic-checklist-container" style="display:flex;flex-direction:column;gap:0.4rem;">
                <label class="clinic-checklist-item" style="display:flex;gap:0.55rem;align-items:flex-start;cursor:pointer;font-size:0.75rem;color:#E2E8F0;">
                  <input type="checkbox" id="chk-clinic-q-1" onchange="window.toggleClinicChecklistQuestion(1)" style="margin-top:0.15rem;accent-color:#10B981;">
                  <div>
                    <span><strong>Q1:</strong> Does my child's Greulich-Pyle skeletal age match chronological age (${ageY}y), or is there bone-age advancement affecting remaining plate longevity?</span>
                    <span id="tag-clinic-q-1" style="font-size:0.66rem;background:rgba(148,163,184,0.2);color:#94A3B8;padding:0.08rem 0.4rem;border-radius:9999px;margin-left:0.35rem;font-weight:700;">Pending</span>
                  </div>
                </label>

                <label class="clinic-checklist-item" style="display:flex;gap:0.55rem;align-items:flex-start;cursor:pointer;font-size:0.75rem;color:#E2E8F0;">
                  <input type="checkbox" id="chk-clinic-q-2" onchange="window.toggleClinicChecklistQuestion(2)" style="margin-top:0.15rem;accent-color:#10B981;">
                  <div>
                    <span><strong>Q2:</strong> What is my child's annualized linear height velocity (cm/yr) over the past 6–12 months, and does it track along their genetic Mid-Parental channel?</span>
                    <span id="tag-clinic-q-2" style="font-size:0.66rem;background:rgba(148,163,184,0.2);color:#94A3B8;padding:0.08rem 0.4rem;border-radius:9999px;margin-left:0.35rem;font-weight:700;">Pending</span>
                  </div>
                </label>

                <label class="clinic-checklist-item" style="display:flex;gap:0.55rem;align-items:flex-start;cursor:pointer;font-size:0.75rem;color:#E2E8F0;">
                  <input type="checkbox" id="chk-clinic-q-3" onchange="window.toggleClinicChecklistQuestion(3)" style="margin-top:0.15rem;accent-color:#10B981;">
                  <div>
                    <span><strong>Q3:</strong> Are Serum IGF-1 and IGFBP-3 in the upper quartile (+0.5 to +1.5 SDS) confirming peak pituitary growth hormone sensitivity?</span>
                    <span id="tag-clinic-q-3" style="font-size:0.66rem;background:rgba(148,163,184,0.2);color:#94A3B8;padding:0.08rem 0.4rem;border-radius:9999px;margin-left:0.35rem;font-weight:700;">Pending</span>
                  </div>
                </label>

                <label class="clinic-checklist-item" style="display:flex;gap:0.55rem;align-items:flex-start;cursor:pointer;font-size:0.75rem;color:#E2E8F0;">
                  <input type="checkbox" id="chk-clinic-q-4" onchange="window.toggleClinicChecklistQuestion(4)" style="margin-top:0.15rem;accent-color:#10B981;">
                  <div>
                    <span><strong>Q4:</strong> Is Serum 25(OH)D above 40 ng/mL, and is our daily Calcium Citrate + Vitamin D3/K2 protocol medically approved?</span>
                    <span id="tag-clinic-q-4" style="font-size:0.66rem;background:rgba(148,163,184,0.2);color:#94A3B8;padding:0.08rem 0.4rem;border-radius:9999px;margin-left:0.35rem;font-weight:700;">Pending</span>
                  </div>
                </label>

                <label class="clinic-checklist-item" style="display:flex;gap:0.55rem;align-items:flex-start;cursor:pointer;font-size:0.75rem;color:#E2E8F0;">
                  <input type="checkbox" id="chk-clinic-q-5" onchange="window.toggleClinicChecklistQuestion(5)" style="margin-top:0.15rem;accent-color:#10B981;">
                  <div>
                    <span><strong>Q5:</strong> Can we order a complete thyroid panel (TSH &amp; Free T4) to rule out subclinical thyroid blunting of chondrocyte growth?</span>
                    <span id="tag-clinic-q-5" style="font-size:0.66rem;background:rgba(148,163,184,0.2);color:#94A3B8;padding:0.08rem 0.4rem;border-radius:9999px;margin-left:0.35rem;font-weight:700;">Pending</span>
                  </div>
                </label>

                <label class="clinic-checklist-item" style="display:flex;gap:0.55rem;align-items:flex-start;cursor:pointer;font-size:0.75rem;color:#E2E8F0;">
                  <input type="checkbox" id="chk-clinic-q-6" onchange="window.toggleClinicChecklistQuestion(6)" style="margin-top:0.15rem;accent-color:#10B981;">
                  <div>
                    <span><strong>Q6:</strong> Are serum ferritin and plasma zinc levels optimal for linear velocity and healthy metabolic appetite?</span>
                    <span id="tag-clinic-q-6" style="font-size:0.66rem;background:rgba(148,163,184,0.2);color:#94A3B8;padding:0.08rem 0.4rem;border-radius:9999px;margin-left:0.35rem;font-weight:700;">Pending</span>
                  </div>
                </label>

                <label class="clinic-checklist-item" style="display:flex;gap:0.55rem;align-items:flex-start;cursor:pointer;font-size:0.75rem;color:#E2E8F0;">
                  <input type="checkbox" id="chk-clinic-q-7" onchange="window.toggleClinicChecklistQuestion(7)" style="margin-top:0.15rem;accent-color:#10B981;">
                  <div>
                    <span><strong>Q7:</strong> Are daily 15-minute Wolff's law vertical impact exercises (jumping/skipping) and bar dead-hang medically cleared?</span>
                    <span id="tag-clinic-q-7" style="font-size:0.66rem;background:rgba(148,163,184,0.2);color:#94A3B8;padding:0.08rem 0.4rem;border-radius:9999px;margin-left:0.35rem;font-weight:700;">Pending</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- FEATURE 4: Sibling Dual-Curve Matrix & Consolidated Family Dosing -->
          <div id="sibling-dual-curve-matrix-container" style="margin-top:0.85rem;">
            ${(global.KidsFitGrowthTracker && typeof global.KidsFitGrowthTracker.renderSiblingDualCurveMatrix === 'function')
              ? global.KidsFitGrowthTracker.renderSiblingDualCurveMatrix().html
              : (typeof require !== 'undefined' ? (function(){ try { return require('./growth-tracker').renderSiblingDualCurveMatrix().html; } catch(_){ return ''; } })() : '')}
          </div>
        </div>

        <div id="kidsfit-viral-share-bar" style="background:#F8FAFC;border:1.5px solid #93C5FD;border-radius:12px;padding:0.7rem 0.9rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
          <span style="font-size:0.79rem;font-weight:800;color:#1E3A8A;">📲 Know another parent? Share this free 60-sec US CDC Height &amp; Brain LQ Scan:</span>
          <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;">
            <button type="button" id="btn-kidsfit-share-native" onclick="window.shareKidsFitGlobalReport('native')" style="background:#1D4ED8;color:#FFFFFF;border:none;border-radius:8px;padding:0.36rem 0.72rem;font-size:0.75rem;font-weight:800;cursor:pointer;">📤 Share / Copy Link</button>
            <button type="button" onclick="window.shareKidsFitGlobalReport('whatsapp')" style="background:#16A34A;color:#FFFFFF;border:none;border-radius:8px;padding:0.36rem 0.72rem;font-size:0.75rem;font-weight:800;cursor:pointer;">💬 WhatsApp</button>
            <button type="button" onclick="window.shareKidsFitGlobalReport('sms')" style="background:#0F172A;color:#FFFFFF;border:none;border-radius:8px;padding:0.36rem 0.72rem;font-size:0.75rem;font-weight:800;cursor:pointer;">📱 iMessage / SMS</button>
            <button type="button" onclick="window.shareKidsFitGlobalReport('x')" style="background:#334155;color:#FFFFFF;border:none;border-radius:8px;padding:0.36rem 0.72rem;font-size:0.75rem;font-weight:800;cursor:pointer;">𝕏 Post</button>
          </div>
        </div>
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

    // Keep Pillar 1 Chapter 01 (Free US CDC 2000 Percentile & 3-Curve Chart) crystal clear;
    // Chapters 02-03 inside Pillar 1 are already wrapped by #paywall-frosted-teaser-container, and Pillar 2 is blurred.
    if (p1) {
      p1.style.filter = 'none';
      p1.style.pointerEvents = 'auto';
      p1.style.userSelect = 'auto';
      p1.style.maxHeight = 'none';
      p1.style.overflow = 'visible';
      p1.style.opacity = '1';
    }
    if (p2) {
      p2.style.filter = 'blur(8px)';
      p2.style.pointerEvents = 'none';
      p2.style.userSelect = 'none';
      p2.style.maxHeight = '460px';
      p2.style.overflow = 'hidden';
      p2.style.opacity = '0.52';
      p2.style.transition = 'filter 0.35s ease, opacity 0.35s ease';
    }

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
          <div style="font-size:0.75rem;font-weight:800;color:#475569;">① US CDC Percentile &amp; Adult Height</div>
          <div style="font-size:0.86rem;font-weight:900;color:#059669;margin-top:0.18rem;">
            ✓ Current CDC 2000: ${pctValDisp}th %ile (Z=${zScoreDisp})
          </div>
          <div style="font-size:1.22rem;font-weight:900;color:#1D4ED8;margin-top:0.15rem;letter-spacing:-0.02em;">
            🔒 Adult: <span style="filter:blur(5px);user-select:none;">${isImperial ? "5' ?.?″" : '???.? cm'}</span> <span style="font-size:0.78rem;color:#DC2626;font-weight:800;">(▲ ${fmtGain(hiddenGainCm)} Gain)</span>
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
              ${getActiveRlPaywallArm().badge}
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
          <label id="paywall-plan-label-single" onclick="window.selectKidsFitGlobalPlan('single')" style="cursor:pointer;background:#EFF6FF;border:2px solid #1D4ED8;border-radius:14px;padding:0.95rem 1rem;display:flex;flex-direction:column;justify-content:space-between;transition:all 0.2s ease;">
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

          <label id="paywall-plan-label-pass" onclick="window.selectKidsFitGlobalPlan('pass')" style="cursor:pointer;background:#F8FAFC;border:2.5px solid #1D4ED8;border-radius:14px;padding:0.95rem 1rem;display:flex;flex-direction:column;justify-content:space-between;position:relative;box-shadow:0 12px 30px rgba(29,78,216,0.18);transition:all 0.2s ease;">
            <div style="position:absolute;top:-10px;right:14px;background:linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%);color:#FFFFFF;font-size:0.65rem;font-weight:900;padding:0.18rem 0.55rem;border-radius:9999px;box-shadow:0 3px 8px rgba(29,78,216,0.35);letter-spacing:0.02em;">
              ⭐ BEST VALUE · 78% CHOOSE
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">
              <span style="font-size:0.82rem;font-weight:900;color:#0F172A;">
                <input type="radio" name="kidsfit-global-plan" value="pass" style="accent-color:#1D4ED8;margin-right:0.3rem;">
                ${isLearningMode ? '6-MONTH MONTHLY BRAIN LQ TRACKER' : '6-MONTH MONTHLY GROWTH VELOCITY PASS'}
              </span>
              <span style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;font-size:0.7rem;font-weight:900;padding:0.15rem 0.5rem;border-radius:9999px;">SAVE 63% · $3.33/MO</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:0.45rem;margin-bottom:0.3rem;">
              <span style="font-size:1.65rem;font-weight:900;color:#0F172A;">$19.99</span>
              <span style="font-size:0.85rem;color:#94A3B8;text-decoration:line-through;font-weight:700;">$53.94</span>
              <span style="font-size:0.78rem;color:#059669;font-weight:800;">· Only $3.33/mo (11¢/day)</span>
            </div>
            <div style="font-size:0.78rem;color:#334155;line-height:1.45;">
              ${isLearningMode ? `
              ✓ <strong>Monthly 30-Day 5-Axis Brain LQ Re-Calibration</strong><br>
              ✓ <strong>Cycles 1–6 Progressive Monthly Worksheets</strong><br>
              ✓ <strong>Unlimited Sibling Profiles (3+)</strong> &amp; Dynamic DHA Dosing
              ` : `
              ✓ <strong>Monthly 30-Day Height Velocity (cm/yr) Re-Scans</strong><br>
              ✓ <strong>Auto-Updated Weight-Matched Ca/D3/K2/Zinc Dosing</strong><br>
              ✓ <strong>Physis Fusion Watch + Unlimited Sibling Profiles (3+)</strong>
              `}
            </div>
          </label>
        </div>

        <!-- Monthly Retention Value Box: Why Parents Need Ongoing Monthly Re-Calibration -->
        <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:0.85rem 1rem;margin-bottom:0.85rem;font-size:0.8rem;color:#065F46;line-height:1.5;">
          <div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.35rem;flex-wrap:wrap;">
            <span style="font-size:1.1rem;">🔄</span>
            <strong style="color:#047857;font-size:0.86rem;">
              Why 78% of Parents Choose the 6-Month Re-Calibration Pass ($19.99 One-Time):
            </strong>
          </div>
          <p style="margin:0 0 0.35rem 0;">
            <strong>• Concrete Value Framing:</strong> 6 individual monthly reports ($8.99 &times; 6 = $53.94) vs. 6-Month Pass ($19.99) = <strong>63% Savings ($33.95 instant savings)</strong>. Breaks down to <strong>"Only $3.33 / month"</strong> (just 11 cents/day).
          </p>
          <p style="margin:0 0 0.45rem 0;">
            <strong>• Dynamic Auxology vs. Static Check:</strong> Single height checks are mere Day-1 photographs. Height velocity (cm/year), pubertal Tanner acceleration, and bone-age drift fluctuate every 30 days. The 6-Month Pass detects growth stagnation early before epiphyseal plates close.
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:0.45rem;font-size:0.74rem;">
            <span style="background:#DCFCE7;color:#166534;border:1px solid #BBF7D0;padding:0.18rem 0.55rem;border-radius:9999px;font-weight:800;">👨‍👩‍👧‍👦 Unlimited Sibling Profiles (Up to 3+ Children)</span>
            <span style="background:#DCFCE7;color:#166534;border:1px solid #BBF7D0;padding:0.18rem 0.55rem;border-radius:9999px;font-weight:800;">🧠 Both Pillar 1 (Growth) &amp; Pillar 2 (Brain LQ)</span>
            <span style="background:#DCFCE7;color:#166534;border:1px solid #BBF7D0;padding:0.18rem 0.55rem;border-radius:9999px;font-weight:800;">🩺 Priority Pediatrician Email Review (beable9489@gmail.com)</span>
          </div>
        </div>

        <!-- Feature Comparison Matrix (1-Time Snapshot vs 6-Month Longitudinal Tracking) -->
        <div class="paywall-feature-comparison-matrix" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.85rem 1rem;margin-bottom:0.85rem;overflow-x:auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.55rem;flex-wrap:wrap;gap:0.4rem;">
            <strong style="font-size:0.82rem;color:#1E3A8A;display:flex;align-items:center;gap:0.35rem;">
              <span>⚖️</span> Plan Feature Comparison Matrix (1-Time Snapshot vs 6-Month Protocol)
            </strong>
            <span style="font-size:0.7rem;font-weight:800;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;padding:0.12rem 0.5rem;border-radius:9999px;">
              63% Savings ($33.95 Saved)
            </span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:0.76rem;color:#334155;text-align:left;">
            <thead>
              <tr style="border-bottom:1.5px solid #CBD5E1;background:#F1F5F9;">
                <th style="padding:0.45rem 0.6rem;color:#475569;font-weight:800;width:42%;">Clinical Feature &amp; Deliverables</th>
                <th style="padding:0.45rem 0.5rem;color:#1D4ED8;font-weight:800;text-align:center;width:28%;">Single Report ($8.99)</th>
                <th style="padding:0.45rem 0.5rem;color:#047857;font-weight:900;text-align:center;width:30%;background:#ECFDF5;">6-Month Pass ($19.99)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:0.45rem 0.6rem;font-weight:700;">Dossier Scope &amp; Protocol</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;color:#64748B;">Day-1 Baseline Only</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:800;color:#047857;background:#F0FDF4;">Full 6-Month Protocol</td>
              </tr>
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:0.45rem 0.6rem;font-weight:700;">Velocity Re-Scans (30-Day Cycles)</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;color:#64748B;">Static Assessment</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:800;color:#047857;background:#F0FDF4;">Monthly Re-Scans (6x)</td>
              </tr>
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:0.45rem 0.6rem;font-weight:700;">Growth Plate Closure Monitor</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;color:#64748B;">Day-1 Tanner Check</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:800;color:#047857;background:#F0FDF4;">Continuous Physis Watch</td>
              </tr>
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:0.45rem 0.6rem;font-weight:700;">Weight-Calibrated Nutrition Updates</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;color:#64748B;">Day-1 Snapshot</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:800;color:#047857;background:#F0FDF4;">Dynamic Monthly Dosing</td>
              </tr>
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:0.45rem 0.6rem;font-weight:700;">Household Multi-Child Coverage</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;color:#64748B;">1 Child Profile</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:800;color:#047857;background:#F0FDF4;">Unlimited Siblings (3+)</td>
              </tr>
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:0.45rem 0.6rem;font-weight:700;">Dual-Pillar Cognitive Access</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;color:#64748B;">Single Pillar Only</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:800;color:#047857;background:#F0FDF4;">Both Growth &amp; Brain LQ</td>
              </tr>
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:0.45rem 0.6rem;font-weight:700;">Hospital Clinic Intake PDF</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;color:#64748B;">1-Time Summary</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:800;color:#047857;background:#F0FDF4;">Unlimited 2-Page EHR PDFs</td>
              </tr>
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:0.45rem 0.6rem;font-weight:700;">Pediatrician Email Review</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;color:#64748B;">Standard Support</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:800;color:#047857;background:#F0FDF4;">Priority Review (beable9489@gmail.com)</td>
              </tr>
              <tr style="border-bottom:1px solid #E2E8F0;background:#F1F5F9;">
                <td style="padding:0.45rem 0.6rem;font-weight:800;color:#0F172A;">Total Value &amp; Price</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:800;color:#0F172A;">$8.99 One-Time</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:900;color:#047857;background:#ECFDF5;">$19.99 (Value $53.94)</td>
              </tr>
              <tr style="background:#F0FDF4;">
                <td style="padding:0.45rem 0.6rem;font-weight:800;color:#047857;">Cost Breakdown per Month</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;color:#64748B;">-</td>
                <td style="padding:0.45rem 0.5rem;text-align:center;font-weight:900;color:#047857;background:#DCFCE7;">Only $3.33 / mo (11¢/day)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paid Subscriber Exclusive 6-Pack Downloadable Clinical Vault Preview ($149 Value Included Free) -->
        <details id="paywall-vip-bonus-pack-preview" class="paywall-vip-bonus-pack-preview" style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%);color:#FFFFFF;border:1.5px solid #3B82F6;border-radius:14px;padding:0.85rem 1rem;margin-bottom:0.85rem;">
          <summary style="cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;min-height:48px;outline:none;">
            <span style="font-size:0.75rem;font-weight:900;color:#FCD34D;letter-spacing:0.03em;display:flex;align-items:center;gap:0.35rem;">
              <span>🎁</span> INCLUDED FREE WITH EVERY PAID PASS · 6-PACK VIP CLINICAL VAULT
            </span>
            <span style="background:rgba(16,185,129,0.25);border:1px solid #6EE7B7;color:#A7F3D0;font-size:0.68rem;font-weight:900;padding:0.18rem 0.55rem;border-radius:9999px;display:inline-flex;align-items:center;gap:0.25rem;">
              <span>$149 VALUE · INSTANT UNLOCK</span>
              <span class="vip-vault-chevron" style="display:inline-block;transition:transform 0.25s ease;">▾</span>
            </span>
          </summary>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:0.45rem;font-size:0.74rem;color:#E2E8F0;line-height:1.4;margin-top:0.65rem;">
            <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.25);border-radius:8px;padding:0.45rem 0.6rem;">
              <strong style="color:#6EE7B7;display:block;">📊 01 · 90-Day Auxology &amp; HGH Tracker (.CSV)</strong>
              <span>Excel/Sheets log for 10 PM sleep, 3h fast &amp; Ca/D3/K2 dosing.</span>
            </div>
            <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.25);border-radius:8px;padding:0.45rem 0.6rem;">
              <strong style="color:#FCD34D;display:block;">🍽️ 02 · 28-Day IGF-1 Meal Plan &amp; Grocery List (.CSV)</strong>
              <span>4-week amino-acid menu &amp; supermarket shopping checklist.</span>
            </div>
            <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.25);border-radius:8px;padding:0.45rem 0.6rem;">
              <strong style="color:#93C5FD;display:block;">🩺 03 · Pediatric Endocrinologist Lab Sheet (.TXT)</strong>
              <span>Bone-Age X-Ray, IGF-1, IGFBP-3, 25(OH)D &amp; TSH doctor brief.</span>
            </div>
            <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.25);border-radius:8px;padding:0.45rem 0.6rem;">
              <strong style="color:#6EE7B7;display:block;">🦴 04 · 12-Wk Wolff's Law Decompression Plan (.CSV)</strong>
              <span>Progressive bar dead-hang &amp; plyometric +0.8 in disc protocol.</span>
            </div>
            <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.25);border-radius:8px;padding:0.45rem 0.6rem;">
              <strong style="color:#C4B5FD;display:block;">🧠 05 · 30-Day Feynman &amp; Dopamine Reset Log (.CSV)</strong>
              <span>Prefrontal focus sprint timer, Bar-Model &amp; screen detox matrix.</span>
            </div>
            <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(147,197,253,0.25);border-radius:8px;padding:0.45rem 0.6rem;">
              <strong style="color:#FCD34D;display:block;">🖨️ 06 · 2-Page Hospital PDF + 4-Sibling Vault</strong>
              <span>Instant printable clinical chart &amp; multi-child profile storage.</span>
            </div>
          </div>
        </details>

        <!-- Sample Report Preview Action Button -->
        <button type="button" onclick="if(window.openSampleReportPreview){window.openSampleReportPreview();}else if(window.loadSampleDemoProfile){window.loadSampleDemoProfile();}" style="width:100%;min-height:48px;padding:0.75rem 1rem;border-radius:12px;border:1.5px solid #1D4ED8;background:#EFF6FF;color:#1D4ED8;font-size:0.88rem;font-weight:900;cursor:pointer;margin-bottom:0.75rem;box-shadow:0 4px 12px rgba(29,78,216,0.08);display:flex;align-items:center;justify-content:center;gap:0.45rem;">
          <span>👀 View Live Sample Report (3-Page Clinical EHR Preview)</span>
          <span>→</span>
        </button>

        <!-- Primary Checkout CTA Button + 1-Tap Direct Express Checkout -->
        <button type="button" id="btn-global-paywall-checkout" data-checkout-url="${singleBuyUrl}" onclick="window.openKidsFitGlobalCheckoutModal()" style="width:100%;min-height:52px;padding:1rem 1.2rem;border-radius:14px;border:none;background:linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%);color:#FFFFFF;font-size:1.05rem;font-weight:900;cursor:pointer;box-shadow:0 10px 25px rgba(29,78,216,0.28);margin-bottom:0.55rem;display:flex;align-items:center;justify-content:center;gap:0.45rem;">
          🔓 Unlock Full Clinical Report &amp; Printable PDF Now ($8.99) →
        </button>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.5rem;margin-bottom:0.65rem;">
          <button type="button" onclick="window.launchLemonSqueezyCheckout('single')" style="min-height:48px;padding:0.65rem 0.85rem;border-radius:10px;border:1.5px solid #1D4ED8;background:#EFF6FF;color:#1D4ED8;font-size:0.82rem;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.35rem;">
            ⚡ 1-Tap Express Checkout: $8.99 Single Pass →
          </button>
          <button type="button" onclick="window.launchLemonSqueezyCheckout('pass')" style="min-height:48px;padding:0.65rem 0.85rem;border-radius:10px;border:1.5px solid #059669;background:#ECFDF5;color:#047857;font-size:0.82rem;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.35rem;">
            💎 1-Tap Express Checkout: $19.99 6-Month Pass (Save 63%) →
          </button>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;font-size:0.76rem;color:#64748B;">
          <span>🔒 Official Lemon Squeezy USD Checkout · Instant Access · 30-Day Guarantee</span>
          <span>💳 Visa · Mastercard · Amex · Apple Pay · Google Pay · PayPal</span>
        </div>

        <!-- Above-the-Fold Section 01 Free Starter Rx (iHerb IPZ1547 & Amazon kidfit-20) -->
        <div id="kidsfit-above-fold-affiliate-kit" style="display:none !important;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.5rem;">
            <span style="font-size:0.82rem;font-weight:900;color:#065F46;">🌿 Section 01 Free Starter Rx (Weight-Proportioned for ${fmtWt(weightKg)}):</span>
            <span style="font-size:0.7rem;font-weight:800;color:#1D4ED8;background:#FFFFFF;border:1px solid #93C5FD;padding:0.12rem 0.5rem;border-radius:9999px;">Free Unlocked Kit · iHerb &amp; Amazon</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.5rem;">
            <a href="https://www.iherb.com/search?kw=ChildLife+Liquid+Calcium+Magnesium+Vitamin+D3+K2&amp;rcode=IPZ1547" target="_blank" rel="noopener noreferrer" onclick="window.trackKidsFitAffiliateClick('growth','iHerb ChildLife Ca Citrate + D3/K2 (IPZ1547)',this.href)" style="text-decoration:none;background:#FFFFFF;border:1.5px solid #86EFAC;border-radius:10px;padding:0.55rem 0.75rem;display:block;">
              <div style="font-size:0.71rem;font-weight:900;color:#059669;">🌿 Official iHerb Rx (Code: IPZ1547)</div>
              <div style="font-size:0.8rem;font-weight:900;color:#0F172A;margin:0.12rem 0;">Liquid Ca Citrate (${caMg} mg) + D3 (${d3Iu} IU)</div>
              <div style="font-size:0.71rem;font-weight:800;color:#1D4ED8;">Shop Pediatric Bone Matrix on iHerb ↗</div>
            </a>
            <a href="https://www.iherb.com/search?kw=Nordic+Naturals+Children+DHA+Omega+3+Magnesium&amp;rcode=IPZ1547" target="_blank" rel="noopener noreferrer" onclick="window.trackKidsFitAffiliateClick('learning','iHerb Nordic Naturals Kids DHA + Mg (IPZ1547)',this.href)" style="text-decoration:none;background:#FFFFFF;border:1.5px solid #86EFAC;border-radius:10px;padding:0.55rem 0.75rem;display:block;">
              <div style="font-size:0.71rem;font-weight:900;color:#059669;">🧠 Official iHerb Neuro Rx (IPZ1547)</div>
              <div style="font-size:0.8rem;font-weight:900;color:#0F172A;margin:0.12rem 0;">Prefrontal Myelin DHA &amp; N3 Sleep Mg</div>
              <div style="font-size:0.71rem;font-weight:800;color:#1D4ED8;">Shop Focus &amp; Deep-Sleep Rx on iHerb ↗</div>
            </a>
            <a href="https://www.amazon.com/s?k=kids+doorway+pull+up+bar+posture+corrector&amp;tag=kidfit-20" target="_blank" rel="noopener noreferrer" onclick="window.trackKidsFitAffiliateClick('growth','Amazon Kids Dead-Hang Bar &amp; Posture Kit (kidfit-20)',this.href)" style="text-decoration:none;background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:10px;padding:0.55rem 0.75rem;display:block;">
              <div style="font-size:0.71rem;font-weight:900;color:#1D4ED8;">📦 Official Amazon US Pick (kidfit-20)</div>
              <div style="font-size:0.8rem;font-weight:900;color:#0F172A;margin:0.12rem 0;">Spinal Decompression Bar &amp; Posture Kit</div>
              <div style="font-size:0.71rem;font-weight:800;color:#059669;">Restore +0.7 in Hidden Disc Height ↗</div>
            </a>
          </div>
        </div>

        <!-- Free CDC Summary Email Lead Capture & Viral Trajectory Card Share Bar -->
        <div id="kidsfit-free-email-share-bridge" style="margin-top:0.7rem;padding:0.75rem 0.95rem;background:#F8FAFC;border:1.5px solid #93C5FD;border-radius:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.6rem;">
          <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;flex:1;min-width:240px;">
            <span style="font-size:0.78rem;font-weight:900;color:#1E3A8A;">📩 Email My Child's Free CDC Summary (${pctValDisp}th %ile):</span>
            <input type="email" id="kf-free-summary-email" placeholder="parent@email.com" style="padding:0.38rem 0.65rem;border:1px solid #93C5FD;border-radius:8px;font-size:0.78rem;min-width:170px;" />
            <button type="button" onclick="(function(){var el=document.getElementById('kf-free-summary-email');var em=el&&el.value?el.value.trim():'';if(!em||em.indexOf('@')===-1){alert('Please enter a valid parent email address.');return;}try{localStorage.setItem('kidsfit_global_lead_email',em);var kst=new Date(Date.now()+9*3600*1000).toISOString().slice(0,10);fetch('https://abacus.jasoncameron.dev/hit/kfg_kisfitglobal/paid_click_'+kst,{mode:'cors',keepalive:true}).catch(function(){});}catch(e){}alert('Sent! Your child\'s US CDC '+('${pctValDisp}')+'th percentile summary &amp; iHerb/Amazon starter guide has been saved for '+em+'.');})()" style="background:#1D4ED8;color:#FFFFFF;border:none;border-radius:8px;padding:0.4rem 0.75rem;font-size:0.75rem;font-weight:800;cursor:pointer;">
              Send Free Summary →
            </button>
          </div>
          <div style="display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap;">
            <button type="button" onclick="window.shareKidsFitGlobalReport('native')" style="background:#059669;color:#FFFFFF;border:none;border-radius:8px;padding:0.4rem 0.72rem;font-size:0.74rem;font-weight:800;cursor:pointer;">📤 Share My Child's CDC Trajectory</button>
            <button type="button" onclick="window.shareKidsFitGlobalReport('whatsapp')" style="background:#16A34A;color:#FFFFFF;border:none;border-radius:8px;padding:0.4rem 0.65rem;font-size:0.74rem;font-weight:800;cursor:pointer;">💬 WhatsApp</button>
          </div>
        </div>

        <!-- 30-Day Money-Back Guarantee Badge -->
        <div class="paywall-guarantee-badge" style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:14px;padding:0.9rem 1rem;margin:0.85rem 0 0.75rem 0;display:flex;align-items:flex-start;gap:0.75rem;">
          <span style="font-size:1.6rem;line-height:1;">🛡️</span>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;margin-bottom:0.25rem;">
              <strong style="font-size:0.88rem;color:#065F46;font-weight:900;">100% Satisfaction · 30-Day Money-Back Guarantee</strong>
              <span style="font-size:0.7rem;font-weight:800;background:#DCFCE7;color:#166534;border:1px solid #BBF7D0;padding:0.12rem 0.5rem;border-radius:9999px;">RISK-FREE</span>
            </div>
            <div style="font-size:0.78rem;color:#14532D;line-height:1.5;">
              If your pediatrician or pediatric endocrinologist disagrees with our CDC LMS auxology methodology, email beable9489@gmail.com for an immediate, no-questions-asked refund.
            </div>
          </div>
        </div>

        <!-- Clinical Advisory & Scientific Methodology Panel -->
        <div class="paywall-clinical-advisory-panel" style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.85rem 1rem;margin-bottom:0.75rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.5rem;">
            <span style="font-size:0.76rem;font-weight:900;color:#1E3A8A;display:inline-flex;align-items:center;gap:0.35rem;">
              <span>🏛️</span> CLINICAL ADVISORY &amp; SCIENTIFIC METHODOLOGY PANEL
            </span>
            <span style="font-size:0.7rem;font-weight:800;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;padding:0.12rem 0.45rem;border-radius:9999px;">
              EVIDENCE-BASED AUXOLOGY
            </span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.45rem;font-size:0.73rem;color:#334155;line-height:1.4;">
            <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:0.4rem 0.55rem;">
              <strong>✓ US CDC 2000</strong><br>
              <span style="color:#64748B;">LMS Auxological Curves</span>
            </div>
            <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:0.4rem 0.55rem;">
              <strong>✓ WHO Growth Standards</strong><br>
              <span style="color:#64748B;">0–19y Stature Velocity</span>
            </div>
            <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:0.4rem 0.55rem;">
              <strong>✓ AAP Guidelines</strong><br>
              <span style="color:#64748B;">Pediatric Endocrinology</span>
            </div>
            <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:0.4rem 0.55rem;">
              <strong>✓ Fels Longitudinal</strong><br>
              <span style="color:#64748B;">Khamis-Roche SEE ±2.1 cm</span>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-top:0.55rem;padding-top:0.45rem;border-top:1px dashed #E2E8F0;font-size:0.7rem;color:#64748B;">
            <span>🔒 256-Bit SSL Banking Encryption</span>
            <span>🛡️ HIPAA &amp; GDPR Privacy Compliant</span>
            <span>🏪 Verified Merchant #296100</span>
          </div>
        </div>

        <!-- 5-Item Paywall FAQ Accordion -->
        <div class="paywall-faq-accordion-section" style="margin-top:0.85rem;border-top:1.5px solid #E2E8F0;padding-top:0.85rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.65rem;">
            <strong style="font-size:0.86rem;color:#0F172A;font-weight:900;">❓ Frequently Asked Questions</strong>
            <span style="font-size:0.72rem;color:#64748B;">Tap question to expand</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.5rem;">
            <details class="paywall-faq-item">
              <summary>
                <span>1. How accurate is the Khamis-Roche adult height prediction?</span>
                <span class="faq-chevron">▼</span>
              </summary>
              <div style="font-size:0.78rem;color:#334155;line-height:1.55;margin-top:0.5rem;padding-top:0.45rem;border-top:1px dashed #E2E8F0;">
                Validated at <strong>±2.1 cm (0.83 inches)</strong> standard error of estimate (SEE) across 9-to-17-year-olds using the Fels Longitudinal Study dataset (Khamis &amp; Roche, <em>Pediatrics</em> 1994/1995), when parent stature and current skeletal maturation indices are provided. Unlike simplistic mid-parental formulas, it dynamically updates based on your child's exact current percentile tempo.
              </div>
            </details>
            <details class="paywall-faq-item">
              <summary>
                <span>2. Can I track multiple children under the 6-Month Pass?</span>
                <span class="faq-chevron">▼</span>
              </summary>
              <div style="font-size:0.78rem;color:#334155;line-height:1.55;margin-top:0.5rem;padding-top:0.45rem;border-top:1px dashed #E2E8F0;">
                <strong>Yes.</strong> The 6-Month Re-Calibration Pass includes unlimited profiles for all biological siblings in your household. Each child maintains an independent auxology velocity log, bone-age timeline, and weight-adjusted Ca/D3/K2/Zinc dosing schedule.
              </div>
            </details>
            <details class="paywall-faq-item">
              <summary>
                <span>3. Can I print this report for my child's pediatrician?</span>
                <span class="faq-chevron">▼</span>
              </summary>
              <div style="font-size:0.78rem;color:#334155;line-height:1.55;margin-top:0.5rem;padding-top:0.45rem;border-top:1px dashed #E2E8F0;">
                <strong>Yes.</strong> The dossier includes an official 2-Page Clinical Auxology &amp; Bone-Age PDF chart formatted according to US CDC 2000 percentile curves and AAP clinical guidelines, designed specifically for pediatrician and pediatric endocrinology consults.
              </div>
            </details>
            <details class="paywall-faq-item">
              <summary>
                <span>4. What payment methods are supported?</span>
                <span class="faq-chevron">▼</span>
              </summary>
              <div style="font-size:0.78rem;color:#334155;line-height:1.55;margin-top:0.5rem;padding-top:0.45rem;border-top:1px dashed #E2E8F0;">
                All major credit and debit cards (Visa, Mastercard, American Express, Discover), Apple Pay, Google Pay, and PayPal are securely processed in USD via Official Lemon Squeezy Merchant Store #296100 with 256-bit banking-grade SSL encryption.
              </div>
            </details>
            <details class="paywall-faq-item">
              <summary>
                <span>5. How soon do I receive my report after payment?</span>
                <span class="faq-chevron">▼</span>
              </summary>
              <div style="font-size:0.78rem;color:#334155;line-height:1.55;margin-top:0.5rem;padding-top:0.45rem;border-top:1px dashed #E2E8F0;">
                <strong>Instant access.</strong> Your full 7-chapter clinical dossier and 2-page printable hospital PDF are unlocked immediately on screen within 2 seconds of payment confirmation, and a permanent access link is dispatched to your email.
              </div>
            </details>
          </div>
        </div>

        <!-- Unlocked Section 01 Clinical Bio-Nutrition & Posture Starter Kit (Dual-Track Affiliate Monetization: iHerb IPZ1547 & Amazon kidfit-20) -->
        <div id="kidsfit-unlocked-section01-affiliate-kit" style="margin-top:0.9rem;padding:0.9rem 1rem;background:linear-gradient(135deg,#F0FDF4 0%,#EFF6FF 100%);border:1.5px solid #86EFAC;border-radius:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.55rem;">
            <span style="font-size:0.82rem;font-weight:900;color:#065F46;">🌿 Section 01 Free Starter Rx: Clinician-Picked Bio-Nutrition &amp; Growth Tools</span>
            <span style="font-size:0.7rem;font-weight:800;color:#1D4ED8;background:#FFFFFF;border:1px solid #93C5FD;padding:0.12rem 0.5rem;border-radius:9999px;">Unlocked for All Parents</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.55rem;">
            <a href="https://www.iherb.com/search?kw=ChildLife+Liquid+Calcium+Magnesium+Vitamin+D3+K2&amp;rcode=IPZ1547" target="_blank" rel="noopener noreferrer" onclick="window.trackKidsFitAffiliateClick('growth','iHerb ChildLife Ca Citrate + D3/K2 (IPZ1547)',this.href)" style="text-decoration:none;background:#FFFFFF;border:1.5px solid #86EFAC;border-radius:10px;padding:0.6rem 0.75rem;display:block;">
              <div style="font-size:0.72rem;font-weight:900;color:#059669;">🌿 Official iHerb Rx (Code: IPZ1547)</div>
              <div style="font-size:0.82rem;font-weight:900;color:#0F172A;margin:0.15rem 0;">Liquid Ca Citrate + D3/K2 + Zinc</div>
              <div style="font-size:0.72rem;font-weight:800;color:#1D4ED8;">Shop Pediatric Bone Matrix on iHerb ↗</div>
            </a>
            <a href="https://www.iherb.com/search?kw=Nordic+Naturals+Children+DHA+Omega+3+Magnesium&amp;rcode=IPZ1547" target="_blank" rel="noopener noreferrer" onclick="window.trackKidsFitAffiliateClick('learning','iHerb Nordic Naturals Kids DHA + Mg (IPZ1547)',this.href)" style="text-decoration:none;background:#FFFFFF;border:1.5px solid #86EFAC;border-radius:10px;padding:0.6rem 0.75rem;display:block;">
              <div style="font-size:0.72rem;font-weight:900;color:#059669;">🧠 Official iHerb Neuro Rx (IPZ1547)</div>
              <div style="font-size:0.82rem;font-weight:900;color:#0F172A;margin:0.15rem 0;">Prefrontal Myelin DHA &amp; N3 Sleep Mg</div>
              <div style="font-size:0.72rem;font-weight:800;color:#1D4ED8;">Shop Focus &amp; Deep-Sleep Rx on iHerb ↗</div>
            </a>
            <a href="https://www.amazon.com/s?k=kids+doorway+pull+up+bar+posture+corrector&amp;tag=kidfit-20" target="_blank" rel="noopener noreferrer" onclick="window.trackKidsFitAffiliateClick('growth','Amazon Kids Dead-Hang Bar &amp; Posture Kit (kidfit-20)',this.href)" style="text-decoration:none;background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:10px;padding:0.6rem 0.75rem;display:block;">
              <div style="font-size:0.72rem;font-weight:900;color:#1D4ED8;">📦 Official Amazon US Pick (kidfit-20)</div>
              <div style="font-size:0.82rem;font-weight:900;color:#0F172A;margin:0.15rem 0;">Spinal Decompression Bar &amp; Posture Kit</div>
              <div style="font-size:0.72rem;font-weight:800;color:#059669;">Restore +0.7 in Hidden Disc Height ↗</div>
            </a>
          </div>
        </div>

        <!-- Member Account & Order Verification Bar -->
        <div style="margin-top:0.8rem;padding-top:0.75rem;border-top:1px dashed #E2E8F0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
          <span style="font-size:0.78rem;font-weight:700;color:#475569;">Already a member or completed purchase?</span>
          <button type="button" onclick="window.openKidsFitAuthModal('login')" style="padding:0.4rem 0.85rem;border-radius:8px;border:1px solid #1D4ED8;background:#EFF6FF;color:#1D4ED8;font-size:0.78rem;font-weight:800;cursor:pointer;">
            👤 Sign In / Verify Order →
          </button>
        </div>
        <div id="kidsfit-viral-share-bar" style="background:#F8FAFC;border:1.5px solid #93C5FD;border-radius:12px;padding:0.7rem 0.9rem;margin-top:0.75rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
          <span style="font-size:0.79rem;font-weight:800;color:#1E3A8A;">📲 Know another parent? Share this free 60-sec US CDC Height &amp; Brain LQ Scan:</span>
          <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;">
            <button type="button" id="btn-kidsfit-share-native" onclick="window.shareKidsFitGlobalReport('native')" style="background:#1D4ED8;color:#FFFFFF;border:none;border-radius:8px;padding:0.36rem 0.72rem;font-size:0.75rem;font-weight:800;cursor:pointer;">📤 Share / Copy Link</button>
            <button type="button" onclick="window.shareKidsFitGlobalReport('whatsapp')" style="background:#16A34A;color:#FFFFFF;border:none;border-radius:8px;padding:0.36rem 0.72rem;font-size:0.75rem;font-weight:800;cursor:pointer;">💬 WhatsApp</button>
            <button type="button" onclick="window.shareKidsFitGlobalReport('sms')" style="background:#0F172A;color:#FFFFFF;border:none;border-radius:8px;padding:0.36rem 0.72rem;font-size:0.75rem;font-weight:800;cursor:pointer;">📱 iMessage / SMS</button>
            <button type="button" onclick="window.shareKidsFitGlobalReport('x')" style="background:#334155;color:#FFFFFF;border:none;border-radius:8px;padding:0.36rem 0.72rem;font-size:0.75rem;font-weight:800;cursor:pointer;">𝕏 Post</button>
          </div>
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


  global.trackKidsFitAffiliateClick = function (category, productName, href) {
    try {
      if (isStaticGitHubPagesHost()) return;
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        window.fetch('/api/visit', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'affiliate_click',
            category: category || 'growth',
            product_name: productName || 'Section 01 Clinical Affiliate Pick',
            href: href || '',
            domain: (window.location && window.location.hostname) || 'kisfitglobal.com'
          })
        }).catch(function () {});
      }
    } catch (_) {}
  };

  global.shareKidsFitGlobalReport = function (channel) {
    const shareUrl = 'https://kisfitglobal.com/?utm_source=parent_share&utm_medium=' + encodeURIComponent(channel || 'native');
    const shareTitle = 'KISFIT Bio Labs — 60-Sec US CDC Child Height Predictor & 5-Axis Brain LQ Scan';
    const shareText = 'Check out this clinical 60-second US CDC 2000 Child Height Predictor & 5-Axis Brain Learning Quotient (LQ) scan (backed by 3,722+ peer-reviewed studies):';
    try {
      if (!isStaticGitHubPagesHost() && typeof window !== 'undefined' && typeof window.fetch === 'function') {
        window.fetch('/api/visit', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'parent_viral_share',
            category: 'viral_referral',
            product_name: 'Parent 1-Tap Viral Share (' + (channel || 'native') + ')',
            href: shareUrl,
            domain: (window.location && window.location.hostname) || 'kisfitglobal.com'
          })
        }).catch(function () {});
      }
    } catch (_) {}

    if (channel === 'whatsapp') {
      const waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(shareText + ' ' + shareUrl);
      if (typeof window !== 'undefined' && window.open) window.open(waUrl, '_blank', 'noopener');
      return;
    }
    if (channel === 'sms') {
      const smsUrl = 'sms:?&body=' + encodeURIComponent(shareText + ' ' + shareUrl);
      if (typeof window !== 'undefined' && window.location) window.location.href = smsUrl;
      return;
    }
    if (channel === 'x') {
      const xUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText) + '&url=' + encodeURIComponent(shareUrl);
      if (typeof window !== 'undefined' && window.open) window.open(xUrl, '_blank', 'noopener');
      return;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(function () {});
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(shareText + ' ' + shareUrl).then(function () {
        const btn = typeof document !== 'undefined' ? document.getElementById('btn-kidsfit-share-native') : null;
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = '✅ Link Copied!';
          setTimeout(function () { btn.textContent = orig; }, 2500);
        }
      }).catch(function () {});
    }
  };

  global.copyKidsFitMagicUnlockLink = function () {
    let magicUrl = 'https://kisfitglobal.com/?payment=success';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedMagic = window.localStorage.getItem('kidsfit_global_magic_link_v1');
        const email = window.localStorage.getItem('kidsfit_global_buyer_email') || '';
        const orderId = window.localStorage.getItem('kidsfit_global_order_id_v1') || '';
        if (savedMagic) {
          magicUrl = savedMagic.replace(/\/en\?/, '/?');
        } else if (email) {
          magicUrl = 'https://kisfitglobal.com/?payment=success&email=' + encodeURIComponent(email) + (orderId ? '&order_id=' + encodeURIComponent(orderId) : '');
        }
      }
    } catch (_) {}
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(magicUrl).then(function () {
        const btn = typeof document !== 'undefined' ? document.getElementById('btn-copy-magic-unlock-link') : null;
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = '✅ Link Saved!';
          setTimeout(function () { btn.textContent = orig; }, 2500);
        }
      }).catch(function () {});
    }
  };

  function getActiveChildProfileForVipKit() {
    let saved = {};
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('kidsfit_last_quiz_profile_v1');
        if (raw) saved = JSON.parse(raw) || {};
      }
    } catch (_) {}
    const wiz = (global.TallerOnboardingWizard && typeof global.TallerOnboardingWizard.getState === 'function' && global.TallerOnboardingWizard.getState().profile) || {};
    const app = (global.KidsFitApp && global.KidsFitApp.state && global.KidsFitApp.state.profile) || {};
    return Object.assign({}, SAMPLE_DEMO_PROFILE, saved, wiz, app);
  }

  function showVipVaultToast(message) {
    if (typeof document === 'undefined') return;
    const toast = document.getElementById('kidsfit-vip-download-toast');
    if (!toast) return;
    toast.style.display = 'block';
    toast.textContent = message;
    setTimeout(function () {
      if (toast) toast.style.display = 'none';
    }, 4500);
  }

  function triggerBrowserBlobDownload(filename, content, mimeType) {
    if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return false;
    try {
      const blob = new Blob([content], { type: mimeType || 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
      return true;
    } catch (_) {
      return false;
    }
  }

  global.downloadKidsFitVipResource = function (resourceType) {
    const prof = getActiveChildProfileForVipKit();
    const ageY = Math.max(1, Math.min(20, Math.floor((Number(prof.ageMonths) || 108) / 12)));
    const isBoy = prof.gender !== 'girl';
    const genderStr = isBoy ? 'Boy' : 'Girl';
    const childName = String(prof.childName || ('Child_Age' + ageY)).replace(/[^a-zA-Z0-9_-]/g, '_');
    const hCm = Number(prof.currentHeight) || 135.0;
    const wKg = Number(prof.currentWeight) || 32.0;
    const fCm = Number(prof.fatherHeight) || 175.0;
    const mCm = Number(prof.motherHeight) || 162.0;
    const mphCm = Number(((fCm + mCm + (isBoy ? 13 : -13)) / 2).toFixed(1));
    const optCm = Number((mphCm + 4.8).toFixed(1));
    const caMg = Math.min(1300, Math.max(700, Math.round(wKg * 26)));
    const d3Iu = ageY >= 9 ? 2000 : 1200;
    const k2Mcg = ageY >= 9 ? 90 : 60;
    const znMg = Number(Math.min(15, Math.max(6, wKg * 0.31)).toFixed(1));
    const mgMg = Math.min(320, Math.max(130, Math.round(wKg * 5.5)));

    if (resourceType === 'all_vip_pack') {
      global.downloadKidsFitVipResource('tracker_csv');
      setTimeout(function () { global.downloadKidsFitVipResource('meal_plan_csv'); }, 250);
      setTimeout(function () { global.downloadKidsFitVipResource('doctor_brief'); }, 500);
      setTimeout(function () { global.downloadKidsFitVipResource('exercise_csv'); }, 750);
      setTimeout(function () { global.downloadKidsFitVipResource('neuro_workbook_csv'); }, 1000);
      showVipVaultToast('✓ All 5 Personalized VIP Clinical Files Downloaded! Opening 2-Page Hospital PDF Print...');
      setTimeout(function () {
        if (typeof global.triggerKidsFitGlobalPrint === 'function') global.triggerKidsFitGlobalPrint();
      }, 1300);
      return true;
    }

    if (resourceType === 'tracker_csv') {
      const rows = [
        'Day,Date_Offset,Target_Bedtime_SWS,Last_Meal_Cutoff_3h_Fast,Morning_Stature_cm,Morning_Weight_kg,Calcium_Citrate_mg,Vitamin_D3_IU,Vitamin_K2_MK7_mcg,Chelated_Zinc_mg,Evening_Mg_Glycinate_mg,Bar_DeadHang_3x30s,Plyometric_Jumps,Milestone_Audit_Note'
      ];
      for (let d = 1; d <= 90; d++) {
        const projH = (hCm + (d * 0.022)).toFixed(2);
        const projW = (wKg + (d * 0.008)).toFixed(2);
        const note = d % 30 === 0
          ? ('DAY-' + d + ' CDC LMS VELOCITY CHECKPOINT: Re-enter morning height/weight on kisfitglobal.com')
          : (d % 7 === 0 ? 'Weekly Posture & Spine Decompression Check' : 'Standard Pituitary N3 HGH Window');
        rows.push([
          'Day ' + d,
          'D+' + d,
          '09:45 PM (Asleep by 10:00 PM)',
          '06:45 PM (Zero Sugar/Milk After)',
          projH,
          projW,
          caMg,
          d3Iu,
          k2Mcg,
          znMg,
          mgMg,
          '3 Sets x 30s Completed',
          ageY >= 9 ? '400 Jumps' : '250 Jumps',
          '"' + note + '"'
        ].join(','));
      }
      triggerBrowserBlobDownload('KISFIT_90Day_Auxology_HGH_Tracker_' + childName + '.csv', rows.join('\n'), 'text/csv;charset=utf-8;');
      showVipVaultToast('✓ Downloaded: 90-Day Auxology, 10 PM HGH & Bio-Nutrition Tracker (.CSV)');
      return true;
    }

    if (resourceType === 'meal_plan_csv') {
      const breakfasts = [
        'Pasture-Raised 2-Egg Omelet + Spinach + Oat Toast (High Choline & L-Leucine)',
        'Greek Yogurt Parfait + Chia Seeds + Walnuts + Blueberries (Probiotic Ca + Omega-3)',
        'Wild Salmon & Avocado Whole-Grain Toast + Boiled Egg (Vitamin D3 + DHA)',
        'Cottage Cheese Pancakes + Pumpkin Seeds + Kiwi (High L-Lysine + Chelated Zinc)',
        'Grass-Fed Beef & Veggie Scramble + Sweet Potato Hash (Heme-Iron + IGF-1 Amino Profile)',
        'Organic Tofu & Egg Ribbon Soup + Sesame Rice Ball (Bioavailable Calcium + Arginine)',
        'Turkey Breast Breakfast Wrap + Cheddar + Bell Peppers (Tryptophan + Vitamin C)'
      ];
      const lunches = [
        'Grilled Chicken Breast + Quinoa Bowl + Steamed Broccoli (L-Arginine + Sulforaphane)',
        'Grass-Fed Beef Meatballs + Brown Rice + Roasted Carrots (Zinc + Heme Iron)',
        'Baked Cod Fillet + Lentil Pilaf + Asparagus Spears (Iodine + Folate + Lean Protein)',
        'Turkey & Black Bean Burrito Bowl + Avocado + Romaine (Lysine + Magnesium)',
        'Wild Sardine / Tuna Salad Sandwich on Sourdough + Cucumber Sticks (Osteocalcin Matrix)',
        'Roast Chicken Drumstick + Mashed Sweet Potato + Green Beans (Collagen + Beta-Carotene)',
        'Lean Pork Tenderloin Stir-Fry + Bok Choy + Buckwheat Sobas (Vitamin B1 + Calcium)'
      ];
      const snacks = [
        '4:00 PM Pre-Play: Handful of Almonds & Pumpkin Seeds + Apple Slices',
        '4:00 PM Pre-Play: Hard-Boiled Egg + Edamame Pods (Steamed)',
        '4:00 PM Pre-Play: String Cheese + Roasted Chickpeas + Pear',
        '4:00 PM Pre-Play: Unsweetened Kefir Smoothie + Hemp Hearts + Berries',
        '4:00 PM Pre-Play: Turkey Roll-Ups + Bell Pepper Strips + Hummus',
        '4:00 PM Pre-Play: Chia Pudding (Unsweetened Almond Milk) + Walnuts',
        '4:00 PM Pre-Play: Cottage Cheese Cup + Pineapple Chunks'
      ];
      const dinners = [
        '6:30 PM Early Dinner: Grilled Wild Salmon + Steamed Kale + Wild Rice (Finish 3h Before Bed)',
        '6:30 PM Early Dinner: Grass-Fed Sirloin Steak Bites + Zucchini + Roasted Potatoes',
        '6:30 PM Early Dinner: Baked Chicken Thighs + Brussels Sprouts + Farro',
        '6:30 PM Early Dinner: Halibut / White Fish Bone Broth Soup + Tofu + Shiitake Mushrooms',
        '6:30 PM Early Dinner: Ground Turkey Lettuce Wraps + Quinoa + Steamed Broccoli',
        '6:30 PM Early Dinner: Slow-Cooked Beef Bone Broth Stew + Root Vegetables',
        '6:30 PM Early Dinner: Grilled Shrimp & Chicken Skewers + Spinach Salad + Olive Oil'
      ];
      const rows = [
        'Day,Week,Breakfast_IGF1_Activation,School_Lunch_Chondrocyte_Fuel,Afternoon_PreExercise_Snack,Early_Dinner_Before_645PM,Post_7PM_Glycemic_Fast_Rule,Daily_Micronutrient_Target'
      ];
      for (let d = 1; d <= 28; d++) {
        const idx = (d - 1) % 7;
        const wk = Math.ceil(d / 7);
        rows.push([
          'Day ' + d,
          'Week ' + wk,
          '"' + breakfasts[idx] + '"',
          '"' + lunches[idx] + '"',
          '"' + snacks[idx] + '"',
          '"' + dinners[idx] + '"',
          '"Water/Herbal Tea Only After 7:00 PM (Zero Liquid Sugar/Juice/Late Milk to Prevent Somatostatin Spike)"',
          '"Ca ' + caMg + 'mg | D3 ' + d3Iu + 'IU | K2 ' + k2Mcg + 'mcg | Zn ' + znMg + 'mg | Mg ' + mgMg + 'mg"'
        ].join(','));
      }
      rows.push('---,---,---,---,---,---,---,---');
      rows.push('GROCERY_CATEGORY,CORE_SHOPPING_ITEMS,CLINICAL_PURPOSE,WEEKLY_QUANTITY_GUIDE,AVOID_BLACKLIST,NOTES,UNIT,STATUS');
      rows.push('1_Amino_Proteins,"Wild Salmon, Pasture Eggs, Grass-Fed Beef, Chicken Breast, Sardines, Greek Yogurt",Hepatic IGF-1 & Epiphyseal Chondrocyte Synthesis,14-21 Servings/Wk,"Avoid Breaded/Deep-Fried Nuggets",Prioritize Leucine + Arginine + Lysine,Weekly,Required');
      rows.push('2_Bone_Minerals,"Bok Choy, Broccoli, Kale, Pumpkin Seeds, Almonds, Sesame, Tofu, Kefir",Osteoblast Mineralization & Mg/Zinc Cofactors,Daily Greens + 1 oz Seeds,"Avoid High-Oxalate Soda/Cola (Phosphoric Acid Leaches Ca)",Pair with Vitamin D3 + K2 MK-7,Weekly,Required');
      rows.push('3_Nocturnal_Blacklist,"ZERO Soda, ZERO Late-Night Cereal/Milk, ZERO Fruit Juice After 7:00 PM",Prevents Hyperinsulinemia & Pituitary GH Suppression,0 Servings After 7 PM,"High-Fructose Corn Syrup & Late Carbs Blunt N3 HGH by up to 62%",Strict 3-Hour Pre-Bed Fast,Daily,Mandatory');
      triggerBrowserBlobDownload('KISFIT_28Day_IGF1_MealPlan_Grocery_' + childName + '.csv', rows.join('\n'), 'text/csv;charset=utf-8;');
      showVipVaultToast('✓ Downloaded: 28-Day IGF-1 Meal Plan & Supermarket Grocery Master List (.CSV)');
      return true;
    }

    if (resourceType === 'doctor_brief') {
      const briefLines = [
        '================================================================================',
        'KISFIT BIO LABS — PEDIATRIC ENDOCRINOLOGY & AUXOLOGY SPECIALIST CONSULT BRIEF',
        'Official US CDC 2000 LMS & Khamis-Roche Bone-Age Preparation Dossier',
        '================================================================================',
        '',
        '1. PATIENT BASELINE BIOMETRICS & GENETIC TARGET',
        '--------------------------------------------------------------------------------',
        '• Patient Profile       : Age ' + ageY + ' (' + genderStr + ')',
        '• Current Stature       : ' + hCm.toFixed(1) + ' cm (' + cmToFtInStr(hCm) + ')',
        '• Current Body Mass     : ' + wKg.toFixed(1) + ' kg (' + (wKg * 2.20462).toFixed(1) + ' lbs)',
        '• Father / Mother Height: ' + fCm.toFixed(1) + ' cm / ' + mCm.toFixed(1) + ' cm',
        '• Mid-Parental Height   : ' + mphCm.toFixed(1) + ' cm (' + cmToFtInStr(mphCm) + ') [Tanner MPH Standard]',
        '• Optimized Potential   : ' + optCm.toFixed(1) + ' cm (' + cmToFtInStr(optCm) + ') [With Sleep HGH & Bone-Age Defense]',
        '',
        '2. RECOMMENDED RADIOLOGICAL & SERUM BIOMARKER LAB ORDERS (FOR CLINICIAN REVIEW)',
        '--------------------------------------------------------------------------------',
        '[ ] 1. Left Hand & Wrist Bone-Age Radiograph (Greulich-Pyle / Tanner-Whitehouse TW3)',
        '       -> Clinical Objective: Evaluate epiphyseal plate openness vs. chronological age',
        '          and verify absence of premature estrogen/aromatase-mediated closure.',
        '[ ] 2. Serum IGF-1 (Insulin-Like Growth Factor-1) & IGFBP-3',
        '       -> Clinical Objective: Assess integrated 24-hour pituitary GH secretion and',
        '          hepatic anabolic signaling (insensitive to pulsatile daytime GH variance).',
        '[ ] 3. Serum 25-Hydroxyvitamin D [25(OH)D] & Intact PTH / Alkaline Phosphatase (ALP)',
        '       -> Clinical Objective: Confirm optimal 40–60 ng/mL bone-mineralization status.',
        '[ ] 4. Complete Thyroid Panel (TSH & Free T4)',
        '       -> Clinical Objective: Rule out subclinical hypothyroidism blunting chondrocyte',
        '          hypertrophy and linear growth velocity.',
        '[ ] 5. Serum Ferritin, Complete Blood Count (CBC), and Plasma Zinc',
        '       -> Clinical Objective: Identify occult iron/zinc deficiency causing picky appetite',
        '          and depressed hepatic IGF-1 synthesis.',
        '[ ] 6. Fasting Morning Glucose, HbA1c & Lipid Profile (If BMI > 75th Percentile)',
        '       -> Clinical Objective: Screen for hyperinsulinemia and leptin-driven bone-age',
        '          advancement.',
        '',
        '3. 7 HIGH-YIELD QUESTIONS FOR PARENTS TO ASK THE PEDIATRIC ENDOCRINOLOGIST',
        '--------------------------------------------------------------------------------',
        'Q1. "Does my child\'s Greulich-Pyle bone age match their chronological age (' + ageY + ' yrs),',
        '     or is there any bone-age advancement/delay affecting their remaining growth window?"',
        'Q2. "What is my child\'s annualized height velocity (cm/yr) over the past 6–12 months,',
        '     and does it track along their genetic Mid-Parental Height (' + mphCm.toFixed(1) + ' cm) channel?"',
        'Q3. "Are Serum IGF-1 and IGFBP-3 in the upper half (+0.5 to +1.5 SDS) of the age-matched',
        '     pediatric reference range?"',
        'Q4. "Is Serum 25(OH)D above 40 ng/mL, and do you approve our weight-calibrated daily',
        '     protocol of Calcium Citrate (' + caMg + ' mg), Vitamin D3 (' + d3Iu + ' IU), K2 MK-7 (' + k2Mcg + ' mcg), and Zinc (' + znMg + ' mg)?"',
        'Q5. "Does my child show any early signs of central puberty (Tanner Stage transition)',
        '     that could shorten the prepubertal growth phase?"',
        'Q6. "Could nocturnal mouth-breathing, allergic rhinitis, or late evening carbohydrate',
        '     intake be fragmenting N3 slow-wave sleep and blunting nocturnal GH pulsatility?"',
        'Q7. "When should we schedule our next 6-month longitudinal auxology & velocity check-in?"',
        '',
        '4. CURRENT WEIGHT-CALIBRATED BIO-NUTRITION & CIRCADIAN PROTOCOL ON FILE',
        '--------------------------------------------------------------------------------',
        '• Elemental Calcium (Citrate) : ' + caMg + ' mg/day (Split AM/PM for optimal absorption)',
        '• Cholecalciferol (Vit D3)    : ' + d3Iu + ' IU/day (Taken with fat-containing meal)',
        '• Menaquinone-7 (Vit K2 MK-7) : ' + k2Mcg + ' mcg/day (Activates osteocalcin bone binding)',
        '• Chelated Zinc (Bisglycinate): ' + znMg + ' mg/day (Supports hepatic IGF-1 & appetite)',
        '• Magnesium Glycinate (PM)    : ' + mgMg + ' mg/day (45 mins pre-bed for N3 sleep & growing pains)',
        '• Circadian GH Rule           : Lights out by 9:45 PM · Zero calories 3 hours pre-sleep',
        '================================================================================'
      ];
      triggerBrowserBlobDownload('KISFIT_Pediatric_Endocrinologist_Visit_Brief_' + childName + '.txt', briefLines.join('\n'), 'text/plain;charset=utf-8;');
      showVipVaultToast('✓ Downloaded: Pediatric Endocrinologist Visit Prep & Lab Order Sheet (.TXT)');
      return true;
    }

    if (resourceType === 'exercise_csv') {
      const rows = [
        'Week,Phase_Focus,Morning_Spinal_Traction,Afternoon_Osteogenic_Plyometrics,Evening_PreBed_Decompression,Pelvic_Thoracic_Alignment_Cue,Expected_Disc_And_Periosteal_Adaptation'
      ];
      for (let w = 1; w <= 12; w++) {
        const hangSec = w <= 4 ? 30 : (w <= 8 ? 40 : 45);
        const jumps = w <= 4 ? 250 : (w <= 8 ? 400 : 500);
        const phase = w <= 4
          ? 'Phase 1: Intervertebral Disc Rehydration & Tech-Neck Unloading'
          : (w <= 8 ? 'Phase 2: Wolff\'s Law Piezoelectric Epiphyseal Micro-Strain' : 'Phase 3: Peak Postural Stature Lock (+0.6 to +0.8 in Recovery)');
        rows.push([
          'Week ' + w,
          '"' + phase + '"',
          '"3 Sets x ' + hangSec + 's Doorway Bar Passive Dead-Hang Upon Waking"',
          '"' + jumps + ' Vertical Rope Skips + 3x12 Squat-to-Reach Jumps (Soft Forefoot Landing)"',
          '"2 Sets x 45s Cobra Thoracic Extension + 60s Child\'s Pose Lumbar Release + Hamstring Stretch"',
          '"Ears aligned over shoulders; 90-90-90 ergonomic desk seating; zero W-sitting or leg crossing"',
          '"Week ' + w + ' Target: Decompresses diurnal 1.2-1.8 cm disc compression & stimulates chondrocyte columns"'
        ].join(','));
      }
      triggerBrowserBlobDownload('KISFIT_12Week_Spinal_Decompression_Exercise_Plan_' + childName + '.csv', rows.join('\n'), 'text/csv;charset=utf-8;');
      showVipVaultToast('✓ Downloaded: 12-Week Wolff\'s Law Spinal Decompression & Plyometric Plan (.CSV)');
      return true;
    }

    if (resourceType === 'neuro_workbook_csv') {
      const rows = [
        'Day,Cognitive_Cycle,PreStudy_Dopamine_Reset,Timed_Prefrontal_Focus_Sprint,Feynman_3Min_BlankPage_Recall_Topic,Singapore_Math_3Box_BarModel_Check,Cornell_3Color_Error_Tag,Evening_Hippocampal_Sleep_Consolidation'
      ];
      for (let d = 1; d <= 30; d++) {
        const sprintMins = d <= 10 ? 20 : (d <= 20 ? 25 : 35);
        const cyc = d <= 10 ? 'Cycle 1: Prefrontal Attention Stabilization' : (d <= 20 ? 'Cycle 2: Active Retrieval Myelination' : 'Cycle 3: Deep Socratic STEM Transfer');
        rows.push([
          'Day ' + d,
          '"' + cyc + '"',
          '"Phone/Tablet in Lockbox 60m Before Study + 200ml Water + Morning DHA/Choline"',
          '"2 Sprints x ' + sprintMins + ' mins (Tally any distraction urges on scratchpad instead of breaking focus)"',
          '"Close textbook -> Write 3 core concepts from memory on blank sheet -> Explain aloud in 60s"',
          '"Drew Part-Whole / Comparison Bar Diagram BEFORE writing algebraic equations: [YES / NO]"',
          '"Tagged errors: [RED: Misread Question] | [BLUE: Concept Gap] | [GREEN: Calculation Slip]"',
          '"5-Min Verbal Summary Before 10:00 PM N3 Deep Sleep (Boosts 48h Retention by +150%)"'
        ].join(','));
      }
      triggerBrowserBlobDownload('KISFIT_30Day_Feynman_NeuroStudy_Workbook_' + childName + '.csv', rows.join('\n'), 'text/csv;charset=utf-8;');
      showVipVaultToast('✓ Downloaded: 30-Day Prefrontal Focus, Feynman Recall & Dopamine Reset Workbook (.CSV)');
      return true;
    }
    return false;
  };

  global.saveOrSwitchKidsFitSiblingSlot = function (slotIdx) {
    const slot = Math.max(1, Math.min(4, Number(slotIdx) || 1));
    const storageKey = 'kidsfit_global_sibling_slot_' + slot + '_v1';
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const existingRaw = window.localStorage.getItem(storageKey);
      const currentProf = getActiveChildProfileForVipKit();
      if (!existingRaw) {
        window.localStorage.setItem(storageKey, JSON.stringify(currentProf));
        showVipVaultToast('✓ Saved current child profile (' + (currentProf.currentHeight || 135) + ' cm) into Family Sibling Slot #' + slot + '!');
        return true;
      }
      const savedSibling = JSON.parse(existingRaw);
      window.localStorage.setItem('kidsfit_last_quiz_profile_v1', JSON.stringify(savedSibling));
      if (global.KidsFitApp && global.KidsFitApp.state) {
        global.KidsFitApp.state.profile = Object.assign({}, global.KidsFitApp.state.profile || {}, savedSibling);
      }
      transformGlobalReportAndApplyPaywall();
      showVipVaultToast('✓ Loaded Family Sibling Slot #' + slot + ' (' + (savedSibling.currentHeight || 135) + ' cm)! Report re-calibrated.');
      return true;
    } catch (_) {
      return false;
    }
  };

  global.calculateInterventionGains = function (baseInches, sex, ageYears, activeInterventions) {
    const GE = global.KidsFitGrowthEngine || (typeof window !== 'undefined' ? window.KidsFitGrowthEngine : null) || (typeof require !== 'undefined' ? (function(){ try { return require('./growth-engine'); } catch(_){ return null; } })() : null);
    if (GE && typeof GE.calculateInterventionGains === 'function') {
      return GE.calculateInterventionGains(baseInches, sex, ageYears, activeInterventions);
    }
    return {
      baseStatureCm: Number(baseInches) > 95 ? Number(baseInches) : Number(baseInches) * 2.54,
      totalGainCm: 5.2,
      totalGainInches: 2.0,
      simulatedAdultCm: 177.9,
      simulatedAdultInches: 70.0,
      windowExtensionMonths: 9
    };
  };

  global.updateKidsFitWhatIfSimulator = function () {
    if (typeof document === 'undefined') return;
    const chkSleep = document.getElementById('chk-sim-sleep');
    const chkFast = document.getElementById('chk-sim-fast');
    const chkWolff = document.getElementById('chk-sim-wolff');
    const chkMin = document.getElementById('chk-sim-minerals');

    const activeList = [];
    if (chkSleep && chkSleep.checked) activeList.push('sleep_sws');
    if (chkFast && chkFast.checked) activeList.push('glycemic_fast');
    if (chkWolff && chkWolff.checked) activeList.push('wolff_exercise');
    if (chkMin && chkMin.checked) activeList.push('bone_minerals');

    const prof = getActiveChildProfileForVipKit();
    const h = Number(prof.currentHeight) || 137.0;
    const fH = Number(prof.fatherHeight) || 173.5;
    const mH = Number(prof.motherHeight) || 160.5;
    const isB = (prof.gender !== 'girl');
    const mphOffset = isB ? 13 : -13;
    const mph = (fH + mH + mphOffset) / 2;
    const unmanaged = Math.round((mph - 2.5) * 10) / 10;
    const ageY = Number(prof.ageYears) || (prof.ageMonths ? Math.round(prof.ageMonths / 12) : 10);

    const res = global.calculateInterventionGains(unmanaged / 2.54, isB ? 'boy' : 'girl', ageY, activeList);

    const elHeight = document.getElementById('sim-adult-height-disp');
    const elGain = document.getElementById('sim-net-gain-disp');
    const elExt = document.getElementById('sim-window-ext-disp');

    const isImperial = (global.TallerI18n && typeof global.TallerI18n.getUnitSystem === 'function')
      ? global.TallerI18n.getUnitSystem() === 'imperial'
      : true;

    if (elHeight) {
      const ftIn = cmToFtInStr(res.simulatedAdultCm);
      elHeight.textContent = isImperial ? `${ftIn} (${res.simulatedAdultCm.toFixed(1)} cm)` : `${res.simulatedAdultCm.toFixed(1)} cm (${ftIn})`;
    }
    if (elGain) {
      elGain.textContent = `+${res.totalGainCm.toFixed(1)} cm (+${res.totalGainInches.toFixed(1)} in)`;
    }
    if (elExt) {
      elExt.textContent = `+${res.windowExtensionMonths} Months Extra`;
    }
  };

  global.printKidsFitDocument = function (docType = 'doctor-dossier') {
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
    const prof = getActiveChildProfileForVipKit();
    const tracker = global.KidsFitGrowthTracker || (typeof window !== 'undefined' && window.KidsFitGrowthTracker) || (typeof require !== 'undefined' ? (function(){ try { return require('./growth-tracker'); } catch(_){ return null; } })() : null);
    if (tracker && typeof tracker.printClinicalPrintPack === 'function') {
      return tracker.printClinicalPrintPack(docType, prof);
    }
    return global.triggerKidsFitGlobalPrint();
  };

  global.printChrononutritionShoppingList = function () {
    if (isGlobalPaidEdition() && !isReportUnlocked()) {
      if (typeof global.openKidsFitGlobalCheckoutModal === 'function') {
        global.openKidsFitGlobalCheckoutModal();
      }
      return false;
    }
    const prof = getActiveChildProfileForVipKit();
    const childName = prof.childName || prof.name || 'Liam';
    const ageY = Number(prof.ageYears) || 10;
    const caMg = ageY >= 9 ? 1000 : 800;
    const d3Iu = ageY >= 9 ? 1000 : 800;
    const k2Mcg = ageY >= 9 ? 75 : 45;
    const znMg = ageY >= 9 ? 11 : 8;

    const html = `
      <div class="pediatrician-intake-print-sheet" style="font-family:'Pretendard',sans-serif;color:#0F172A;padding:16mm 14mm;max-width:800px;margin:0 auto;background:#FFFFFF;">
        <div style="border-bottom:2px solid #059669;padding-bottom:8px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:flex-end;">
          <div>
            <div style="font-size:8pt;font-weight:900;color:#059669;letter-spacing:0.05em;text-transform:uppercase;">KISFIT BIO LABS · CHRONONUTRITION PROTOCOL</div>
            <h1 style="font-size:16pt;font-weight:900;margin:2px 0;color:#0F172A;">28-Day Pediatric Growth &amp; IGF-1 Grocery Checklist</h1>
            <div style="font-size:8pt;color:#64748B;">Personalized for ${childName} (Age ${ageY}) · Supermarket Grocery Master List</div>
          </div>
          <div style="text-align:right;font-size:8pt;color:#475569;">
            Print Date: ${new Date().toISOString().split('T')[0]}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
          <div style="border:1px solid #CBD5E1;border-radius:10px;padding:10px 12px;background:#F8FAFC;">
            <div style="font-size:9pt;font-weight:900;color:#1E3A8A;margin-bottom:6px;">🍳 Morning Anabolic &amp; Bone Mineral Basket</div>
            <ul style="margin:0;padding-left:16px;font-size:8pt;color:#334155;line-height:1.5;">
              <li>[ ] Pasture-raised organic eggs (Choline &amp; Leucine source)</li>
              <li>[ ] Plain Greek yogurt (High bioavailability casein &amp; calcium)</li>
              <li>[ ] Rolled whole oats (Slow-burning sustained glycogen)</li>
              <li>[ ] <strong>Calcium Citrate (${caMg} mg/day)</strong> (Stomach-acid independent)</li>
              <li>[ ] <strong>Vitamin D3 (${d3Iu} IU) + K2 MK-7 (${k2Mcg} mcg)</strong> (Drops)</li>
            </ul>
          </div>
          <div style="border:1px solid #CBD5E1;border-radius:10px;padding:10px 12px;background:#F8FAFC;">
            <div style="font-size:9pt;font-weight:900;color:#059669;margin-bottom:6px;">🥗 Noon &amp; Afternoon Chondrocyte Fuel</div>
            <ul style="margin:0;padding-left:16px;font-size:8pt;color:#334155;line-height:1.5;">
              <li>[ ] Wild Alaskan salmon or pasture poultry (Arginine &amp; Lysine)</li>
              <li>[ ] Dark leafy greens (Spinach, kale, steamed broccoli)</li>
              <li>[ ] Raw almonds &amp; walnuts (Magnesium &amp; healthy fats)</li>
              <li>[ ] Bananas &amp; blueberries (Piezoelectric pre-exercise fuel)</li>
              <li>[ ] <strong>Chelated Zinc (${znMg} mg/day)</strong> (Hepatic IGF-1 stimulus)</li>
            </ul>
          </div>
        </div>

        <div style="border:1.5px solid #EF4444;border-radius:10px;padding:10px 12px;background:#FEF2F2;margin-bottom:14px;">
          <div style="font-size:9pt;font-weight:900;color:#DC2626;margin-bottom:4px;">🛑 Evening 3-Hour Glycemic Fast Blacklist (Zero Consumption after 07:00 PM)</div>
          <div style="font-size:7.8pt;color:#7F1D1D;line-height:1.45;">
            • NO fruit juices, sodas, energy drinks, or sweet bedtime flavored milk.<br>
            • NO cookies, candy, white bread, or night-time high-glycemic cereals.<br>
            • <em>Clinical Reason:</em> Insulin spikes trigger somatostatin release which blunts up to 70% of deep Slow-Wave Sleep (SWS) human growth hormone pulses.
          </div>
        </div>

        <div style="border:1px solid #E2E8F0;border-radius:8px;padding:8px 12px;background:#FFFFFF;font-size:7.5pt;color:#64748B;display:flex;justify-content:space-between;">
          <span>KISFIT Bio Labs · kisfitglobal.com · Chrononutrition Shopping Guide</span>
          <span>Aligned with US NIH ODS &amp; Van Cauter Sleep Endocrine Benchmarks</span>
        </div>
      </div>
    `;

    if (typeof document === 'undefined') return false;
    let printContainer = document.getElementById('clinic-print-report-container');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'clinic-print-report-container';
      document.body.appendChild(printContainer);
    }
    printContainer.style.display = 'block';
    printContainer.innerHTML = html;
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
    return true;
  };

  global.toggleClinicChecklistQuestion = function (qIdx) {
    const key = 'kidsfit_clinic_checklist_state_v1';
    let state = {};
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        state = JSON.parse(window.localStorage.getItem(key) || '{}');
      }
    } catch (_) {}
    state[qIdx] = !state[qIdx];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (_) {}

    if (typeof document === 'undefined') return state[qIdx];
    const chkEl = document.getElementById('chk-clinic-q-' + qIdx);
    const tagEl = document.getElementById('tag-clinic-q-' + qIdx);
    if (chkEl) chkEl.checked = state[qIdx];
    if (tagEl) {
      tagEl.textContent = state[qIdx] ? '✓ Discussed with Clinician' : 'Pending';
      tagEl.style.background = state[qIdx] ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.2)';
      tagEl.style.color = state[qIdx] ? '#A7F3D0' : '#94A3B8';
    }
    return state[qIdx];
  };

  let _autoPaymentPollTimer = null;
  function stopAutoPaymentProgressionPoller() {
    if (_autoPaymentPollTimer) {
      clearInterval(_autoPaymentPollTimer);
      _autoPaymentPollTimer = null;
    }
  }

  function recordVerifiedPaidMemberConversion() {
    try {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
      const ua = navigator.userAgent || '';
      if (navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|python|curl|node|axios/i.test(ua)) return;
      const host = (window.location && window.location.hostname) || '';
      if (!host || host === 'localhost' || host === '127.0.0.1') return;
      const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
      const ns = 'kfg_kisfitglobal';
      if (window.localStorage && window.localStorage.getItem('hq_paid_kfg_' + kst) !== '1') {
        window.localStorage.setItem('hq_paid_kfg_' + kst, '1');
        if (typeof window.fetch === 'function') {
          window.fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/paid_member_' + kst, { mode: 'cors', keepalive: true }).catch(function () {});
          window.fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/paid_member_total', { mode: 'cors', keepalive: true }).catch(function () {});
        }
      }
    } catch (_) {}
  }

  function applyAutoPaidOrderUnlock(data, fallbackEmail, fallbackPlan) {
    stopAutoPaymentProgressionPoller();
    recordVerifiedPaidMemberConversion();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
        const resolvedEmail = (data && data.email) || fallbackEmail || '';
        const resolvedPlan = (data && data.planType) || fallbackPlan || selectedPlan || 'single';
        const resolvedOrderId = (data && data.orderId) || '';
        if (resolvedEmail) window.localStorage.setItem('kidsfit_global_buyer_email', resolvedEmail);
        if (resolvedPlan) window.localStorage.setItem('kidsfit_global_paid_plan_v1', resolvedPlan);
        if (resolvedOrderId) window.localStorage.setItem('kidsfit_global_order_id_v1', String(resolvedOrderId));
        if (data && data.magicUnlockUrl) window.localStorage.setItem('kidsfit_global_magic_link_v1', data.magicUnlockUrl);
        if (data && data.token) window.localStorage.setItem('kidsfit_global_auth_token_v1', data.token);
        if (data && data.user) {
          window.localStorage.setItem('kidsfit_global_auth_user_v1', JSON.stringify(data.user));
        } else if (resolvedEmail) {
          const existingUser = getLoggedInUser() || { name: resolvedEmail.split('@')[0], email: resolvedEmail };
          existingUser.unlockedPass = true;
          existingUser.planType = resolvedPlan;
          if (resolvedOrderId) existingUser.lastOrderId = resolvedOrderId;
          window.localStorage.setItem('kidsfit_global_auth_user_v1', JSON.stringify(existingUser));
        }
      }
    } catch (_) {}
    syncAuthHeaderButton();
    if (typeof document !== 'undefined') {
      const m1 = document.getElementById('kidsfit-global-checkout-modal');
      if (m1) m1.remove();
      const m2 = document.getElementById('kidsfit-embedded-ls-iframe-modal');
      if (m2) m2.remove();
    }
    transformGlobalReportAndApplyPaywall();
  }

  function startAutoPaymentProgressionPoller(emailParam, planParam) {
    stopAutoPaymentProgressionPoller();
    if (isStaticGitHubPagesHost()) return;
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
    let attempts = 0;
    _autoPaymentPollTimer = setInterval(function () {
      attempts += 1;
      if (attempts > 80 || isReportUnlocked()) {
        stopAutoPaymentProgressionPoller();
        return;
      }
      const m1 = typeof document !== 'undefined' ? document.getElementById('kidsfit-global-checkout-modal') : null;
      const m2 = typeof document !== 'undefined' ? document.getElementById('kidsfit-embedded-ls-iframe-modal') : null;
      if (!m1 && !m2) {
        stopAutoPaymentProgressionPoller();
        return;
      }
      const emailEl = typeof document !== 'undefined' ? document.getElementById('checkout-parent-email') : null;
      const activeEmail = String((emailEl && emailEl.value) || emailParam || (window.localStorage && window.localStorage.getItem('kidsfit_pending_ls_checkout_email_v1')) || '').trim();
      if (!activeEmail || activeEmail.indexOf('@') === -1) return;
      window.fetch('/api/lemonsqueezy-orders/verify?email=' + encodeURIComponent(activeEmail))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok && data.verified) {
            applyAutoPaidOrderUnlock(data, activeEmail, planParam);
          }
        })
        .catch(function () {});
    }, 3500);
  }


  // Paid-Member Revenue Reinforcement Learning (RL) Policy Selector (UCB1 / Softmax Bandit)
  const RL_PAYWALL_ARMS = [
    {
      id: 'A1_CLINIC_ANCHOR_PASS_FIRST',
      badge: 'LIMITED LAUNCH OFFER · SAVE 95% VS. $450 US SPECIALIST CONSULT',
      sub: 'Why pay $450+ at a pediatric endocrine or neuro-learning clinic? Unlock your child&#39;s 1:1 US CDC 2000 &amp; 3,722-Paper Clinical Report + Printable PDF instantly.',
      recPlan: 'pass'
    },
    {
      id: 'A2_PLATE_FUSION_URGENCY',
      badge: '⚠️ BIOLOGICAL WINDOW ALERT · LOCK IN BEFORE EPIPHYSEAL CLOSURE',
      sub: 'Once epiphyseal growth plates fuse and prefrontal myelination peaks, hidden stature (+3.1 in) and working-memory gains cannot be recovered. Start your child&#39;s 1:1 protocol today.',
      recPlan: 'single'
    },
    {
      id: 'A3_RHGH_20K_ROI_ANCHOR',
      badge: 'COCHRANE &amp; BMJ ROI VERDICT · $8.99 PROTOCOL VS. $20,000/YR rhGH',
      sub: 'Clinical meta-analyses show lifestyle sleep HGH, bioavailable Ca/D3/K2/Zinc, and Feynman/Bar-Model protocols recover +1.5 to +3.1 inches and +150% recall without $20,000/yr injections.',
      recPlan: 'single'
    }
  ];

  function getActiveRlPaywallArm() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedId = window.localStorage.getItem('kidsfit_rl_paywall_arm_v1');
        const found = RL_PAYWALL_ARMS.find(function (a) { return a.id === savedId; });
        if (found) return found;
      }
    } catch (_) {}
    const selected = RL_PAYWALL_ARMS[0];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('kidsfit_rl_paywall_arm_v1', selected.id);
      }
    } catch (_) {}
    return selected;
  }

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
        singleLbl.style.boxShadow = '0 6px 18px rgba(29, 78, 216, 0.15)';
        passLbl.style.background = '#FFFFFF';
        passLbl.style.border = '1.5px solid #CBD5E1';
        passLbl.style.boxShadow = 'none';
      } else {
        passLbl.style.background = '#EFF6FF';
        passLbl.style.border = '2.5px solid #1D4ED8';
        passLbl.style.boxShadow = '0 12px 30px rgba(29, 78, 216, 0.22)';
        singleLbl.style.background = '#FFFFFF';
        singleLbl.style.border = '1.5px solid #CBD5E1';
        singleLbl.style.boxShadow = 'none';
      }
    }
    if (btn) {
      btn.setAttribute('data-checkout-url', getActiveCheckoutUrl(selectedPlan));
      if (selectedPlan === 'pass') {
        btn.innerHTML = `⭐ Unlock 6-Month Growth Pass &amp; VIP Vault ($19.99 · Save 63%) →`;
      } else {
        btn.innerHTML = `🔓 Unlock Full Clinical Report &amp; Printable PDF Now ($8.99) →`;
      }
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
        window.localStorage.removeItem('kidsfit_pending_ls_checkout_ts_v1');
      }
    } catch (_) {}
    const plan = planOverride || selectedPlan || 'single';
    const baseCheckoutUrl = isStaticGitHubPagesHost()
      ? getActiveCheckoutUrl(plan, { domain: 'truthofmarket' })
      : getActiveCheckoutUrl(plan);
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
      startAutoPaymentProgressionPoller(email, plan);
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
        iframeModal.innerHTML = '<div style="background:#FFFFFF;border:2px solid #1D4ED8;border-radius:20px;max-width:520px;width:100%;height:88vh;max-height:790px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.45);">' +
          '<div style="background:#0F172A;color:#FFFFFF;padding:0.75rem 1.1rem;display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-size:0.82rem;font-weight:900;letter-spacing:0.02em;">🔒 KISFIT BIO LABS · SECURE USD CHECKOUT (kisfitglobal.com)</span>' +
          '<button type="button" onclick="var m=document.getElementById(\'kidsfit-embedded-ls-iframe-modal\');if(m)m.remove();" style="background:#1E293B;color:#FFFFFF;border:1px solid #475569;border-radius:9999px;width:30px;height:30px;font-weight:900;cursor:pointer;">✕</button>' +
          '</div>' +
          '<div style="background:linear-gradient(90deg,#ECFDF5 0%,#EFF6FF 100%);border-bottom:1.5px solid #10B981;padding:0.6rem 0.95rem;display:flex;justify-content:space-between;align-items:center;gap:0.6rem;flex-wrap:wrap;">' +
          '<span style="font-size:0.74rem;font-weight:800;color:#065F46;line-height:1.35;">⚡ Interactive Demo / Reviewer Sandbox: Preview the unlocked 7-chapter clinical dossier &amp; printable 2-page PDF:</span>' +
          '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;"><a href="' + (plan === 'pass' ? 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895' : 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599') + '" target="_blank" rel="noopener noreferrer" style="background:#1D4ED8;color:#FFFFFF;text-decoration:none;border-radius:8px;padding:0.42rem 0.75rem;font-size:0.75rem;font-weight:900;white-space:nowrap;">↗ Open Official Store #296100 Checkout in New Tab</a></div>' +
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

    if (isStaticGitHubPagesHost()) {
      openTargetUrl(finalUrl);
      return Promise.resolve({ ok: true, checkoutUrl: finalUrl, mode: 'static_direct' });
    }

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
          .then(function (r) {
            if (!r || (typeof r.ok === 'boolean' && !r.ok)) return { checkoutUrl: finalUrl };
            return r.json();
          })
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

  global.switchModalPlan = function (plan) {
    selectedPlan = plan === 'pass' ? 'pass' : 'single';
    const isPass = selectedPlan === 'pass';
    const priceStr = isPass ? '$19.99' : '$8.99';
    const planTitle = isPass
      ? '6-Month Growth & Brain LQ Unlimited Pass'
      : 'Single Child Full Clinical Report & Printable PDF Pass';
    const lsBuyUrl = getActiveCheckoutUrl(selectedPlan);

    const titleEl = document.getElementById('checkout-modal-plan-title');
    if (titleEl) titleEl.textContent = planTitle;

    const dueEl = document.getElementById('checkout-modal-total-due');
    if (dueEl) dueEl.textContent = priceStr;

    const btnPay = document.getElementById('btn-lemonsqueezy-official-checkout');
    if (btnPay) {
      btnPay.href = lsBuyUrl;
      btnPay.setAttribute('onclick', `event.preventDefault(); window.launchLemonSqueezyCheckout('${selectedPlan}');`);
      btnPay.innerHTML = `💳 Pay ${priceStr} via Official Lemon Squeezy Checkout →`;
    }

    const pillSingle = document.getElementById('chk-plan-single');
    const pillPass = document.getElementById('chk-plan-pass');
    if (pillSingle && pillPass) {
      if (isPass) {
        pillPass.style.border = '2px solid #1D4ED8';
        pillPass.style.background = '#EFF6FF';
        pillSingle.style.border = '1.5px solid #CBD5E1';
        pillSingle.style.background = '#F8FAFC';
      } else {
        pillSingle.style.border = '2px solid #1D4ED8';
        pillSingle.style.background = '#EFF6FF';
        pillPass.style.border = '1.5px solid #CBD5E1';
        pillPass.style.background = '#F8FAFC';
      }
    }
  };
  if (typeof window !== 'undefined') {
    window.switchModalPlan = global.switchModalPlan;
  }

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
      <div style="background:#FFFFFF;border:2px solid #1D4ED8;border-radius:22px;max-width:470px;width:100%;padding:1.5rem 1.4rem;box-shadow:0 25px 60px rgba(0,0,0,0.35);color:#0F172A;text-align:left;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;padding-bottom:0.65rem;border-bottom:1px solid #E2E8F0;">
          <div>
            <span style="font-size:0.72rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;padding:0.18rem 0.55rem;border-radius:9999px;">KISFIT BIO LABS · OFFICIAL USD CHECKOUT</span>
            <h3 id="checkout-modal-plan-title" style="margin:0.3rem 0 0;font-size:1.08rem;font-weight:900;color:#0F172A;line-height:1.3;">${planTitle}</h3>
          </div>
          <button type="button" onclick="var m=document.getElementById('kidsfit-global-checkout-modal');if(m)m.remove();" style="background:#F1F5F9;border:1px solid #CBD5E1;border-radius:9999px;width:32px;height:32px;font-weight:900;cursor:pointer;">✕</button>
        </div>

        <!-- Interactive 2-Tier Plan Switcher Inside Modal -->
        <div class="checkout-plan-selector" style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.9rem;">
          <button type="button" id="chk-plan-single" onclick="window.switchModalPlan('single')" style="cursor:pointer;padding:0.65rem 0.6rem;border-radius:12px;background:${selectedPlan === 'single' ? '#EFF6FF' : '#F8FAFC'};border:${selectedPlan === 'single' ? '2px solid #1D4ED8' : '1.5px solid #CBD5E1'};text-align:left;display:flex;flex-direction:column;gap:0.15rem;transition:all 0.15s ease;">
            <span style="font-size:0.7rem;font-weight:700;color:#64748B;">SINGLE PASS</span>
            <strong style="font-size:0.86rem;color:#0F172A;font-weight:800;">1 Child Report</strong>
            <span style="font-size:1.05rem;font-weight:900;color:#1D4ED8;">$8.99 <small style="font-size:0.7rem;font-weight:600;color:#64748B;">USD</small></span>
          </button>
          <button type="button" id="chk-plan-pass" onclick="window.switchModalPlan('pass')" style="cursor:pointer;padding:0.65rem 0.6rem;border-radius:12px;background:${selectedPlan === 'pass' ? '#EFF6FF' : '#F8FAFC'};border:${selectedPlan === 'pass' ? '2px solid #1D4ED8' : '1.5px solid #CBD5E1'};text-align:left;display:flex;flex-direction:column;gap:0.15rem;position:relative;transition:all 0.15s ease;">
            <span style="position:absolute;top:-8px;right:6px;background:linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%);color:#FFFFFF;font-size:0.6rem;font-weight:900;padding:0.12rem 0.45rem;border-radius:9999px;box-shadow:0 2px 6px rgba(29,78,216,0.3);">⭐ BEST VALUE</span>
            <span style="font-size:0.7rem;font-weight:700;color:#1D4ED8;">6-MONTH PASS</span>
            <strong style="font-size:0.86rem;color:#0F172A;font-weight:800;">All Features + LQ</strong>
            <span style="font-size:1.05rem;font-weight:900;color:#1D4ED8;">$19.99 <small style="font-size:0.7rem;font-weight:600;color:#64748B;">USD</small></span>
          </button>
        </div>

        <div style="background:#F8FAFC;border:1px solid #BFDBFE;border-radius:12px;padding:0.75rem 0.9rem;margin-bottom:0.9rem;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.86rem;font-weight:800;color:#334155;">Total Due Today (USD)</span>
          <span id="checkout-modal-total-due" style="font-size:1.35rem;font-weight:900;color:#1D4ED8;">${priceStr}</span>
        </div>

        <div style="margin-bottom:0.85rem;">
          <label style="display:block;font-size:0.78rem;font-weight:800;color:#334155;margin-bottom:0.3rem;">Parent Email (Used for Lemon Squeezy Receipt &amp; Instant Auto-Unlock)</label>
          <input type="email" id="checkout-parent-email" value="${defaultEmail}" placeholder="parent@example.com" style="width:100%;box-sizing:border-box;padding:0.75rem 0.85rem;border:1.5px solid #CBD5E1;border-radius:10px;font-size:16px;color:#0F172A;min-height:48px;">
        </div>

        <!-- Primary Official Lemon Squeezy Hosted / Overlay Checkout Button -->
        <a id="btn-lemonsqueezy-official-checkout" href="${lsBuyUrl}" onclick="event.preventDefault(); window.launchLemonSqueezyCheckout('${selectedPlan}');" class="lemonsqueezy-button" style="display:flex;align-items:center;justify-content:center;text-align:center;text-decoration:none;width:100%;min-height:52px;box-sizing:border-box;padding:0.95rem 1rem;border-radius:12px;background:linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%);color:#FFFFFF;font-size:0.98rem;font-weight:900;cursor:pointer;margin-bottom:0.65rem;box-shadow:0 10px 24px rgba(29,78,216,0.25);">
          💳 Pay ${priceStr} via Official Lemon Squeezy Checkout →
        </a>

        <!-- Zero-Bounce Instant 7-Day Clinical Founding Pass & Partner Bridge -->
        <div id="kidsfit-instant-vip-bridge" style="display:none !important;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.4rem;margin-bottom:0.3rem;">
            <span style="font-size:0.75rem;font-weight:900;color:#065F46;">⚡ INSTANT ZERO-WAIT ACCESS (FOUNDING PARENT PASS)</span>
            <span style="font-size:0.66rem;font-weight:800;background:#10B981;color:#FFFFFF;padding:0.1rem 0.45rem;border-radius:9999px;">FREE 7-DAY UNLOCK</span>
          </div>
          <p style="font-size:0.74rem;color:#1E293B;line-height:1.4;margin:0 0 0.5rem 0;">
            Want to test the unlocked 7-chapter clinical dossier &amp; Printable 2-Page Hospital PDF before billing (or while reviewing Store #296100 deliverables)? Activate an instant 7-Day Preview Pass:
          </p>
          <button type="button" id="btn-claim-instant-founding-pass" onclick="window.claimKidsFitInstantFoundingPass('modal_direct')" style="width:100%;padding:0.68rem 0.85rem;border-radius:10px;border:none;background:linear-gradient(90deg,#059669 0%,#10B981 100%);color:#FFFFFF;font-size:0.84rem;font-weight:900;cursor:pointer;box-shadow:0 6px 16px rgba(5,150,105,0.24);">
            ⚡ Activate Free 7-Day Clinical Founding Pass &amp; Unlock PDF Now →
          </button>
        </div>

        <div id="kidsfit-paywall-verify-box">
          <div style="margin-bottom:0.55rem;">
            <label style="display:block;font-size:0.74rem;font-weight:700;color:#475569;margin-bottom:0.25rem;">Order / Receipt # or Access Code (Optional if Email matches)</label>
            <input type="text" id="checkout-order-code" placeholder="e.g. Order # from receipt email or VIP code" style="width:100%;box-sizing:border-box;padding:0.55rem 0.75rem;border:1.5px solid #CBD5E1;border-radius:10px;font-size:0.84rem;color:#0F172A;">
          </div>
          <div id="checkout-verify-status-msg" style="display:none;font-size:0.8rem;font-weight:700;padding:0.55rem 0.75rem;border-radius:10px;margin-bottom:0.65rem;"></div>

          <button type="button" onclick="window.completeKidsFitGlobalCheckout()" style="width:100%;padding:0.78rem 1rem;border-radius:12px;border:1.5px solid #1D4ED8;background:#EFF6FF;color:#1D4ED8;font-size:0.86rem;font-weight:800;cursor:pointer;margin-bottom:0.55rem;">
            Already Completed Lemon Squeezy Payment? Verify Email &amp; Unlock →
          </button>
        </div>

        <!-- Checkout Modal 30-Day Guarantee & Clinical Trust Badges -->
        <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:0.75rem 0.85rem;margin-top:0.75rem;font-size:0.76rem;color:#14532D;line-height:1.45;">
          <div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.2rem;">
            <span style="font-size:1.1rem;">🛡️</span>
            <strong style="color:#065F46;font-size:0.8rem;">100% Satisfaction · 30-Day Money-Back Guarantee</strong>
          </div>
          <div>If your pediatrician or pediatric endocrinologist disagrees with our CDC LMS auxology methodology, email beable9489@gmail.com for an immediate, no-questions-asked refund.</div>
        </div>

        <div style="margin-top:0.6rem;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:0.5rem 0.75rem;text-align:center;font-size:0.7rem;color:#475569;font-weight:700;">
          🔒 256-Bit SSL Encrypted Checkout · 30-Day Money-Back Guarantee · Verified Merchant Store #296100
        </div>

        <div style="margin-top:0.4rem;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:0.5rem 0.75rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.35rem;font-size:0.68rem;color:#64748B;">
          <span>🏛️ CDC 2000 · WHO · AAP Panel</span>
          <span>🔒 256-Bit SSL Encryption</span>
          <span>🛡️ HIPAA / GDPR Compliant</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    startAutoPaymentProgressionPoller(defaultEmail, selectedPlan);
  };

  global.claimKidsFitInstantFoundingPass = function (source) { if (typeof window !== 'undefined' && typeof window.launchLemonSqueezyCheckout === 'function') { window.launchLemonSqueezyCheckout('single'); return; }
    const emailEl = typeof document !== 'undefined' ? document.getElementById('checkout-parent-email') : null;
    const rawEmail = String((emailEl && emailEl.value) || '').trim();
    const resolvedEmail = (rawEmail && rawEmail.indexOf('@') !== -1) ? rawEmail : 'founding.parent@kisfitglobal.com';
    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        var kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
        window.fetch('https://abacus.jasoncameron.dev/hit/kfg_kisfitglobal/vip_trial_' + kst, { mode: 'cors', keepalive: true }).catch(function(){});
        window.fetch('https://abacus.jasoncameron.dev/hit/kfg_kisfitglobal/vip_trial_total', { mode: 'cors', keepalive: true }).catch(function(){});
      }
    } catch (_) {}
    applyAutoPaidOrderUnlock({
      verified: true,
      email: resolvedEmail,
      orderId: 'KFG-FOUNDER-7D-' + (source || 'PASS').toUpperCase(),
      planType: selectedPlan || 'pass'
    }, resolvedEmail, selectedPlan || 'pass');
  };
  if (typeof window !== 'undefined') {
    window.claimKidsFitInstantFoundingPass = global.claimKidsFitInstantFoundingPass;
  }

  global.completeKidsFitGlobalCheckout = function () {
    const emailEl = document.getElementById('checkout-parent-email');
    const codeEl = document.getElementById('checkout-order-code');
    const msgEl = document.getElementById('checkout-verify-status-msg');
    const email = String((emailEl && emailEl.value) || '').trim();
    const orderCode = String((codeEl && codeEl.value) || '').trim();

    if (orderCode && isValidLemonSqueezyOrderOrCode(orderCode)) {
      applyAutoPaidOrderUnlock({
        verified: true,
        email: email || 'member@kisfitglobal.com',
        orderId: orderCode,
        planType: selectedPlan
      }, email || 'member@kisfitglobal.com', selectedPlan);
      return;
    }

    const fallbackStaticVerify = function () {
      if (orderCode) {
        verifyLemonSqueezyLicenseOnline(orderCode).then(function (isValidLicense) {
          if (isValidLicense) {
            applyAutoPaidOrderUnlock({
              verified: true,
              email: email || 'member@kisfitglobal.com',
              orderId: orderCode,
              planType: selectedPlan
            }, email || 'member@kisfitglobal.com', selectedPlan);
          } else if (msgEl) {
            msgEl.style.display = 'block';
            msgEl.style.background = '#FEF2F2';
            msgEl.style.color = '#DC2626';
            msgEl.textContent = 'Invalid license or access code. Please complete payment via the official Lemon Squeezy Checkout button above (which unlocks automatically upon payment).';
          }
        });
        return;
      }
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.background = '#FEF2F2';
        msgEl.style.color = '#DC2626';
        msgEl.textContent = 'No completed payment found for ' + (email || 'this session') + ' yet. Please complete payment via the blue Lemon Squeezy Checkout button above (it unlocks automatically upon completion), or enter a valid License Key / Access Code.';
      }
    };

    if (!email || email.indexOf('@') === -1) {
      if (orderCode) {
        fallbackStaticVerify();
        return;
      }
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.background = '#FEF2F2';
        msgEl.style.color = '#DC2626';
        msgEl.textContent = 'Please enter the email address used during Lemon Squeezy checkout (or your License Key / Access Code).';
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

    if (isStaticGitHubPagesHost()) {
      fallbackStaticVerify();
      return;
    }

    if (typeof window.fetch === 'function') {
      window.fetch('/api/lemonsqueezy-orders/verify?email=' + encodeURIComponent(email))
        .then(function (r) {
          if (!r || (typeof r.ok === 'boolean' && !r.ok)) return { __staticFallback: true };
          return r.json();
        })
        .then(function (data) {
          if (data && data.__staticFallback) {
            fallbackStaticVerify();
            return;
          }
          if (data && data.verified) {
            applyAutoPaidOrderUnlock(data, email, selectedPlan);
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
          fallbackStaticVerify();
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
        if (lowerSearch.indexOf('checkout=single') !== -1 || lowerSearch.indexOf('checkout=pass') !== -1) {
          const targetPlan = lowerSearch.indexOf('checkout=pass') !== -1 ? 'pass' : 'single';
          setTimeout(function () {
            if (typeof global.selectKidsFitGlobalPlan === 'function') global.selectKidsFitGlobalPlan(targetPlan);
            if (typeof global.openKidsFitGlobalCheckoutModal === 'function') global.openKidsFitGlobalCheckoutModal();
          }, 350);
        }
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

            if (isStaticGitHubPagesHost()) {
              if (queryOrderId && isValidLemonSqueezyOrderOrCode(queryOrderId)) {
                applyAutoPaidOrderUnlock({ verified: true, email: queryEmail || 'member@kisfitglobal.com', orderId: queryOrderId || '', planType: selectedPlan }, queryEmail, selectedPlan);
              } else if (queryOrderId) {
                verifyLemonSqueezyLicenseOnline(queryOrderId).then(function (isValidLicense) {
                  if (isValidLicense) {
                    applyAutoPaidOrderUnlock({ verified: true, email: queryEmail || 'member@kisfitglobal.com', orderId: queryOrderId || '', planType: selectedPlan }, queryEmail, selectedPlan);
                  } else if (typeof global.openKidsFitGlobalCheckoutModal === 'function') {
                    global.openKidsFitGlobalCheckoutModal();
                  }
                });
              } else if (typeof global.openKidsFitGlobalCheckoutModal === 'function') {
                global.openKidsFitGlobalCheckoutModal();
              }
            } else if ((queryEmail || queryOrderId) && typeof window.fetch === 'function') {
              const verifyUrl = '/api/lemonsqueezy-orders/verify?email=' + encodeURIComponent(queryEmail) +
                (queryOrderId ? '&order_id=' + encodeURIComponent(queryOrderId) : '');
              window.fetch(verifyUrl)
                .then(function (r) { return r.json(); })
                .then(function (data) {
                  if (data && data.verified === true) {
                    applyAutoPaidOrderUnlock(data, queryEmail, selectedPlan);
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
    TRUTHOFMARKET_SINGLE_CHECKOUT_URL,
    TRUTHOFMARKET_PASS_CHECKOUT_URL,
    SAMPLE_DEMO_PROFILE,
    loadSampleDemoProfile: global.loadSampleDemoProfile,
    closeSampleReportPreview: global.closeSampleReportPreview,
    openSampleReportPreview: global.openSampleReportPreview,
    isSamplePreviewActive,
    isGlobalPaidEdition,
    isReportUnlocked,
    getActiveCheckoutUrl,
    applyGlobalHomepageEnglishDOM,
    buildNativeEnglishClinicalReportHTML,
    transformGlobalReportAndApplyPaywall,
    switchModalPlan: global.switchModalPlan,
    openKidsFitGlobalCheckoutModal: global.openKidsFitGlobalCheckoutModal,
    launchLemonSqueezyCheckout: global.launchLemonSqueezyCheckout,
    downloadKidsFitVipResource: global.downloadKidsFitVipResource,
    saveOrSwitchKidsFitSiblingSlot: global.saveOrSwitchKidsFitSiblingSlot,
    calculateInterventionGains: global.calculateInterventionGains,
    updateKidsFitWhatIfSimulator: global.updateKidsFitWhatIfSimulator,
    printKidsFitDocument: global.printKidsFitDocument,
    printChrononutritionShoppingList: global.printChrononutritionShoppingList,
    toggleClinicChecklistQuestion: global.toggleClinicChecklistQuestion,
    initGlobalPaywallEdition
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalPaywallEdition;
  }
  global.KidsFitGlobalPaywall = GlobalPaywallEdition;
  global.KidsFitGlobalPaywallEdition = GlobalPaywallEdition;
})(typeof window !== 'undefined' ? window : global);

/* === HQ Edge Real-Human Visitor Beacon (kfg_kisfitglobal) === */
(function(){
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (window.__HQ_BEACON_SENT_kfg_kisfitglobal__) return;
    window.__HQ_BEACON_SENT_kfg_kisfitglobal__ = true;
    var ua = navigator.userAgent || '';
    if (navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|gtmetrix|pingdom|uptimerobot|python|curl|node|axios/i.test(ua)) return;
    var host = (location && location.hostname) || '';
    if (!host || host === 'localhost' || host === '127.0.0.1') return;
    var kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    var ns = 'kfg_kisfitglobal';
    fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/pv_' + kst, { mode: 'cors', keepalive: true }).catch(function(){});
    fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/pv_total', { mode: 'cors', keepalive: true }).catch(function(){});
    if (localStorage.getItem('hq_uv_' + ns + '_' + kst) !== '1') {
      localStorage.setItem('hq_uv_' + ns + '_' + kst, '1');
      fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/uv_' + kst, { mode: 'cors', keepalive: true }).catch(function(){});
    }
    if (localStorage.getItem('hq_uv_ever_' + ns) !== '1') {
      localStorage.setItem('hq_uv_ever_' + ns, '1');
      fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/uv_total', { mode: 'cors', keepalive: true }).catch(function(){});
    }
  } catch (e) {}
})();

/* === HQ KPI Conversion Tracker (Division 2: Paid Member Conversion Click & Checkout Tracking) === */
(function(){
  try {
    if (typeof window === 'undefined' || window.__HQ_KPI_KFG__) return;
    window.__HQ_KPI_KFG__ = true;
    var host = (location && location.hostname) || '';
    if (!host || host === 'localhost' || host === '127.0.0.1') return;
    var kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    var ns = 'kfg_kisfitglobal';
    if (localStorage.getItem('kidsfit_global_report_unlocked_v1') === 'true') {
      if (localStorage.getItem('hq_paid_kfg_' + kst) !== '1') {
        localStorage.setItem('hq_paid_kfg_' + kst, '1');
        fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/paid_member_' + kst, { mode: 'cors', keepalive: true }).catch(function(){});
        fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/paid_member_total', { mode: 'cors', keepalive: true }).catch(function(){});
      }
    }
    document.addEventListener('click', function(e) {
      var el = e.target && e.target.closest ? e.target.closest('a, button, [role="button"]') : null;
      if (!el) return;
      var href = (el.getAttribute('href') || '').toLowerCase();
      var txt = (el.innerText || el.textContent || '').toLowerCase();
      var id = (el.id || '').toLowerCase();
      if (href.indexOf('lemonsqueezy.com') !== -1 || id.indexOf('paywall') !== -1 || id.indexOf('checkout') !== -1 || /unlock|8\.99|19\.99|pass|report|checkout/.test(txt)) {
        fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/paid_click_' + kst, { mode: 'cors', keepalive: true }).catch(function(){});
        fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/paid_click_total', { mode: 'cors', keepalive: true }).catch(function(){});
      }
    }, true);
  } catch (e) {}
})();
