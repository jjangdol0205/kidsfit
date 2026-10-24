/**
 * KIDS-FIT BIO LABS — Global English Hard-Paywall Edition Engine (src/js/global-paywall-edition.js)
 *
 * Dedicated for https://truthofmarket.com (and ?edition=global / ?paywall=1):
 * 1. Enforces 100% English-Only Mode (US CDC 2000 & WHO Growth Standards + 3,639 PubMed Papers).
 * 2. Converts the language button into an Imperial (ft/in, lbs) <-> Metric (cm, kg) Unit Switcher.
 * 3. Translates the Homepage Dual-Pillar Showcase, SVG Chart Previews, and Master Clinical Report into native English.
 * 4. Implements the Taller-Style Hard-Paywall Gate:
 *    - Shows Above-the-Fold Clinical Scan Teaser (+Hidden Inches/cm Potential & Bottleneck Alert)
 *    - Blurs the full Pillar 1 & Pillar 2 clinical report behind a high-converting $8.99 / $19.99 Unlock Gate
 *    - Provides interactive Global Checkout Modal (Card / Apple Pay / Google Pay / PayPal + VIP Owner Code 'VIP2026')
 */

(function (global) {
  'use strict';

  const UNLOCK_STORAGE_KEY = 'kidsfit_global_report_unlocked_v1';
  const CHECKOUT_URLS_KEY = 'kidsfit_global_checkout_urls_v1';

  function isGlobalPaidEdition() {
    try {
      if (global.__KIDSFIT_GLOBAL_PAID_EDITION === true) return true;
      if (typeof document !== 'undefined' && document.documentElement) {
        if (document.documentElement.getAttribute('data-edition') === 'global-paid') return true;
      }
      if (typeof window !== 'undefined' && window.location) {
        const host = String(window.location.hostname || '').toLowerCase();
        const search = String(window.location.search || '').toLowerCase();
        if (search.indexOf('edition=ko') !== -1) return false;
        if (search.indexOf('edition=global') !== -1 || search.indexOf('paywall=1') !== -1) return true;
        // Activate on truthofmarket.com in real browser sessions (when index.html DOM is present)
        if (host.indexOf('truthofmarket.com') !== -1 && typeof document !== 'undefined' && document.getElementById('hero-section')) {
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  function isReportUnlocked() {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const s = String(window.location.search || '').toLowerCase();
        if (s.indexOf('unlock=1') !== -1 || s.indexOf('unlocked=1') !== -1 || s.indexOf('payment=success') !== -1) {
          if (window.localStorage) window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
          return true;
        }
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

  function cmToFtInStr(cmVal) {
    const cm = parseFloat(cmVal);
    if (isNaN(cm) || cm <= 0) return '0\' 0"';
    const totalIn = cm / 2.54;
    const ft = Math.floor(totalIn / 12);
    const inch = Math.round((totalIn % 12) * 10) / 10;
    return `${ft}' ${inch.toFixed(1)}"`;
  }

  function applyGlobalHomepageEnglishDOM() {
    if (typeof document === 'undefined' || !isGlobalPaidEdition()) return;

    document.documentElement.lang = 'en';
    document.documentElement.setAttribute('data-edition', 'global-paid');
    document.title = 'KIDS-FIT BIO LABS — US CDC & 3,639-Paper Pediatric Height & Brain LQ Clinical Report';

    // Force TallerI18n into English
    if (global.TallerI18n && typeof global.TallerI18n.setLanguage === 'function') {
      if (global.TallerI18n.getLanguage() !== 'en') {
        global.TallerI18n.setLanguage('en');
      }
    }

    // Replace Korean language toggle with Imperial / Metric Unit Switcher
    const langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) {
      const unitSys = (global.TallerI18n && typeof global.TallerI18n.getUnitSystem === 'function')
        ? global.TallerI18n.getUnitSystem()
        : 'imperial';
      langBtn.textContent = unitSys === 'imperial' ? '🇺🇸 Units: ft/in · lbs' : '🌐 Units: cm · kg';
      langBtn.title = 'Toggle between Imperial (ft/in, lbs) and Metric (cm, kg)';
      if (!langBtn._globalUnitBound) {
        langBtn._globalUnitBound = true;
        // Clone to remove language toggle listener so it strictly toggles unit system in English
        const cleanBtn = langBtn.cloneNode(true);
        cleanBtn._globalUnitBound = true;
        langBtn.parentNode.replaceChild(cleanBtn, langBtn);
        cleanBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (global.TallerI18n && typeof global.TallerI18n.setUnitSystem === 'function') {
            const cur = global.TallerI18n.getUnitSystem();
            const next = cur === 'imperial' ? 'metric' : 'imperial';
            global.TallerI18n.setUnitSystem(next);
            cleanBtn.textContent = next === 'imperial' ? '🇺🇸 Units: ft/in · lbs' : '🌐 Units: cm · kg';
          }
        });
      }
    }

    const appBtn = document.getElementById('btn-header-app-download');
    if (appBtn) appBtn.textContent = '📲 Web App';

    const tagline = document.querySelector('.brand-tagline');
    if (tagline) {
      tagline.textContent = 'US CDC 2000 Auxology · Bone-Age Trajectory & Neuro-Cognitive LQ Lab';
    }

    // Hero Section Authority Pill & Trust Bar
    const authPill = document.querySelector('.clinical-authority-pill');
    if (authPill) {
      authPill.innerHTML = '<span>CLINICAL STANDARD</span><span style="color:#93C5FD;">|</span><span>US CDC 2000 Growth Charts · WHO Standards · 3,639 Peer-Reviewed PubMed Studies</span>';
    }

    const heroHeadline = document.querySelector('.hero-headline');
    if (heroHeadline) {
      heroHeadline.innerHTML = '<span class="hero-single-line">"Waiting to see if they grow" costs inches —</span><br><span class="hero-headline-highlight hero-single-line" style="color:#1D4ED8;font-weight:800;">Epiphyseal Growth Plates &amp; Prefrontal Windows Close Every Year</span>';
    }

    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
      heroSubtitle.textContent = 'Unlock your child\'s hidden adult height potential (+2.6 in / +6.7 cm), rhGH clinical paper analysis, and 5-Axis Brain Learning Quotient (LQ) in a 1-minute clinical scan.';
    }

    const trustBar = document.querySelector('.clinical-survey-trust-bar');
    if (trustBar) {
      trustBar.innerHTML = '<span><strong style="color:#1D4ED8;">1-Min Clinical Assessment</strong> · Instant Bone-Age &amp; LQ Scan Without a $450 Specialist Visit</span><span style="color:#CBD5E1;" class="pc-view-block">|</span><span><strong style="color:#1D4ED8;">Peer-Reviewed Basis</strong> · US CDC LMS Percentiles · Tanner MPH · 3,639 PubMed Papers</span>';
    }

    // Dual-Pillar Intro Showcase Cards
    const dualShowcase = document.getElementById('dual-pillar-intro-showcase');
    if (dualShowcase && !dualShowcase.getAttribute('data-global-en-applied')) {
      dualShowcase.setAttribute('data-global-en-applied', '1');
      dualShowcase.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.15rem;">
          <span style="display: inline-block; font-size: 0.75rem; font-weight: 800; color: #1D4ED8; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 0.22rem 0.7rem; border-radius: 9999px; margin-bottom: 0.4rem;">
            CLINICAL REPORT PREVIEW &amp; PARENT BENEFITS
          </span>
          <h2 style="font-size: clamp(1.14rem, 3vw, 1.42rem); font-weight: 800; color: #0F172A; margin: 0 0 0.3rem; letter-spacing: -0.02em;">
            What You Discover Immediately After Our 1-Minute Clinical Scan
          </h2>
          <p style="font-size: 0.88rem; color: #475569; margin: 0;">
            Replace guesswork with peer-reviewed auxology trajectories, endocrine paper fact-checks, and actionable daily protocols.
          </p>
        </div>

        <div class="home-dual-report-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 1.25rem;">
          <!-- Report 1 Intro Card: Physical Growth -->
          <div id="homepage-intro-growth-report" class="mf-glass-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 1.4rem 1.25rem; border: 1.5px solid #BFDBFE; border-radius: 18px; background: #FFFFFF; box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="display: inline-block; font-size: 0.74rem; font-weight: 800; color: #1D4ED8; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 0.22rem 0.65rem; border-radius: 9999px;">
                  DIAGNOSIS 01 · Pediatric Auxology &amp; Bone-Age Scan
                </span>
                <span style="font-size: 0.74rem; font-weight: 700; color: #475569;">US CDC 2000 Standard</span>
              </div>
              <h3 style="font-size: clamp(1.08rem, 2.8vw, 1.22rem); font-weight: 800; color: #0F172A; margin: 0 0 0.35rem 0; letter-spacing: -0.02em;">
                Final Adult Height Prediction &amp; Growth-Plate Golden Window
              </h3>
              <p style="font-size: 0.83rem; color: #475569; margin: 0 0 0.85rem 0; line-height: 1.45;">
                Cross-analyzes day-exact CDC LMS percentiles, Tanner Mid-Parental Height (MPH), and nocturnal GH / leptin / posture factors.
              </p>

              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 0.8rem 0.85rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem; font-size: 0.76rem; font-weight: 700; color: #1E293B;">
                  <span>3-Tier Predicted Adult Height Trajectory</span>
                  <span style="color: #1D4ED8; background: #EFF6FF; padding: 0.12rem 0.5rem; border-radius: 9999px; border: 1px solid #BFDBFE;">+2.6 in (+6.7 cm) Potential</span>
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

              <div style="font-size: 0.78rem; font-weight: 800; color: #1D4ED8; margin-bottom: 0.45rem;">
                3 Core Auxology &amp; Endocrine Insights Included
              </div>
              <ul class="hero-one-line-list" style="list-style: none; margin: 0 0 1.1rem 0; padding: 0; font-size: 0.84rem; color: #1E293B; line-height: 1.5;">
                <li style="margin-bottom: 0.5rem; padding-left: 0.65rem; border-left: 2.5px solid #1D4ED8;">
                  <strong style="color: #0F172A; display: block;">① 3-Tier Adult Height Prediction &amp; &lt;50th% rhGH Injection Paper Report</strong>
                  <span style="color: #475569; font-size: 0.8rem;">BMJ &amp; Cochrane meta-analysis on Growth Hormone injection ROI vs. natural SWS GH peak</span>
                </li>
                <li style="margin-bottom: 0.5rem; padding-left: 0.65rem; border-left: 2.5px solid #1D4ED8;">
                  <strong style="color: #0F172A; display: block;">② Precocious Puberty Defense &amp; Weight-for-Height Optimization</strong>
                  <span style="color: #475569; font-size: 0.8rem;">Bone-age acceleration defense for taller kids &amp; leptin/IGF-1 weight protocols</span>
                </li>
                <li style="padding-left: 0.65rem; border-left: 2.5px solid #1D4ED8;">
                  <strong style="color: #0F172A; display: block;">③ +0.8 in (+1.8 cm) Spinal Decompression &amp; Daily Bio-Nutrition</strong>
                  <span style="color: #475569; font-size: 0.8rem;">Exact mg/IU targets for Calcium, Vitamin D3, K2, Zinc &amp; 10-min decompression routine</span>
                </li>
              </ul>
            </div>
            <button type="button" id="btn-home-start-growth-report" onclick="if(window.TallerOnboardingWizard) window.TallerOnboardingWizard.enterStudioMode('child', 'growth');" class="mf-btn-white" style="width: 100%; padding: 0.9rem 1rem; font-size: 0.94rem; font-weight: 800; background: #1D4ED8; color: #FFFFFF; border: 1px solid #1E40AF; border-radius: 10px; cursor: pointer;">
              Start 1-Min Height &amp; Growth-Plate Scan →
            </button>
          </div>

          <!-- Report 2 Intro Card: Brain & Learning -->
          <div id="homepage-intro-learning-report" class="mf-glass-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 1.4rem 1.25rem; border: 1.5px solid #BFDBFE; border-radius: 18px; background: #FFFFFF; box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="display: inline-block; font-size: 0.74rem; font-weight: 800; color: #1D4ED8; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 0.22rem 0.65rem; border-radius: 9999px;">
                  DIAGNOSIS 02 · Neuro-Cognitive &amp; Learning Quotient (LQ)
                </span>
                <span style="font-size: 0.74rem; font-weight: 700; color: #475569;">Neuroscience Standard</span>
              </div>
              <h3 style="font-size: clamp(1.08rem, 2.8vw, 1.22rem); font-weight: 800; color: #0F172A; margin: 0 0 0.35rem 0; letter-spacing: -0.02em;">
                5-Axis Brain Balance Radar &amp; Prefrontal Bottleneck Scan
              </h3>
              <p style="font-size: 0.83rem; color: #475569; margin: 0 0 0.85rem 0; line-height: 1.45;">
                Pinpoints the exact neuro-cognitive root cause behind reading, applied math, memory retention, or focus bottlenecks.
              </p>

              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 0.8rem 0.85rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; margin-bottom: 0.45rem; font-size: 0.76rem; font-weight: 700; color: #1E293B;">
                  <span style="white-space: nowrap;">5-Axis Brain LQ &amp; 6-Month Expansion Curve</span>
                  <span style="color: #1D4ED8; background: #EFF6FF; padding: 0.12rem 0.5rem; border-radius: 9999px; border: 1px solid #BFDBFE; white-space: nowrap; flex-shrink: 0;">Bottleneck Detection</span>
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

              <div style="font-size: 0.78rem; font-weight: 800; color: #1D4ED8; margin-bottom: 0.45rem;">
                3 Core Neuro-Cognitive &amp; Study Insights Included
              </div>
              <ul class="hero-one-line-list" style="list-style: none; margin: 0 0 1.1rem 0; padding: 0; font-size: 0.84rem; color: #1E293B; line-height: 1.5;">
                <li style="margin-bottom: 0.5rem; padding-left: 0.65rem; border-left: 2.5px solid #1D4ED8;">
                  <strong style="color: #0F172A; display: block;">① 5-Axis Brain Balance &amp; Specific Study Bottleneck Diagnosis</strong>
                  <span style="color: #475569; font-size: 0.8rem;">Evaluates Literacy, Spatial Math, Working Memory, Active Recall &amp; Scientific Inquiry</span>
                </li>
                <li style="margin-bottom: 0.5rem; padding-left: 0.65rem; border-left: 2.5px solid #1D4ED8;">
                  <strong style="color: #0F172A; display: block;">② 4-Week Domain-Specific Fix &amp; Absorption Style Matching</strong>
                  <span style="color: #475569; font-size: 0.8rem;">Feynman Blank-Page Recall, Singapore Bar Modeling &amp; Dopamine Focus Timer routines</span>
                </li>
                <li style="padding-left: 0.65rem; border-left: 2.5px solid #1D4ED8;">
                  <strong style="color: #0F172A; display: block;">③ 6-Month LQ Trajectory &amp; Future Career Aptitude Roadmap</strong>
                  <span style="color: #475569; font-size: 0.8rem;">Maps dominant neural circuits to high-growth STEM, Medical, Law &amp; Creative careers</span>
                </li>
              </ul>
            </div>
            <button type="button" id="btn-home-start-learning-report" onclick="if(window.TallerOnboardingWizard) window.TallerOnboardingWizard.enterStudioMode('child', 'learning');" class="mf-btn-glass" style="width: 100%; padding: 0.9rem 1rem; font-size: 0.94rem; font-weight: 800; background: #1D4ED8; border: 1px solid #1E40AF; color: #FFFFFF; border-radius: 10px; cursor: pointer;">
              Start 1-Min Brain LQ &amp; Study Bottleneck Scan →
            </button>
          </div>
        </div>
      `;
    }

    // App Download Bar
    const appBar = document.getElementById('hero-app-download-bar');
    if (appBar) {
      appBar.style.display = 'none';
    }

    // Guidebook Mode Banner inside Step 1
    const modeBanner = document.getElementById('guidebook-mode-banner');
    if (modeBanner) {
      modeBanner.innerHTML = '<strong>[1:1 Clinical Precision Assessment]</strong> Powered by US CDC 2000 Growth Charts, Tanner Auxology &amp; 3,639 Peer-Reviewed PubMed Studies.';
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
  }

  /**
   * Translates Korean clinical report strings inside #master-briefing-card into native English
   * and injects the Taller-Style Blurred Teaser & Hard-Paywall Unlock Gate when locked.
   */
  function transformGlobalReportAndApplyPaywall() {
    if (typeof document === 'undefined' || !isGlobalPaidEdition()) return;
    const card = document.getElementById('master-briefing-card');
    if (!card || !card.innerHTML || card.innerHTML.trim().length < 500) return;

    // 1. Translate key Korean phrases in the rendered report HTML to crisp English
    let html = card.innerHTML;
    const replacements = [
      ['질병관리청(KDCA) 소아청소년 성장도표 기반 1:1 신체 성장 정밀 보고서', 'US CDC 2000 & WHO Growth Standards 1:1 Pediatric Auxology Report'],
      ['질병관리청 소아성장도표 기준 적용', 'US CDC 2000 Clinical Standard'],
      ['보건복지부 K-DST 발달기준 적용', 'Neuro-Cognitive Clinical Standard'],
      ['【보고서 1: 아이 신체 성장 마스터 분석 보고서】', '【REPORT 01: PEDIATRIC PHYSICAL GROWTH & ENDOCRINE MASTER REPORT】'],
      ['질병관리청(KDCA 2017) 표준 성장도표 · 부모 유전키(MPH) · 24시간 호르몬 궤적 · 척추 감압 생체역학', 'US CDC 2000 LMS Percentiles · Tanner Genetic MPH · 24-Hr GH Curve · Spinal Decompression Biomechanics'],
      ['독립 보고서 1 (CHAPTER 1 ~ 4)', 'REPORT 01 (CHAPTERS 1 – 4)'],
      ['맞춤 성장 종합 리포트 &amp; 하루 실천 시간표', 'Executive Growth Trajectory & Daily Action Protocol'],
      ['아침·저녁 6개월 밀착 관리 시 우리 아이 성인 예측키 3중 성장 궤적', '3-Tier Predicted Adult Height Trajectory (Genetic vs. Unmanaged vs. Optimized)'],
      ['질병관리청(KDCA) · Tanner 골연령 공식 적용', 'US CDC 2000 · Tanner Bone-Age Formula'],
      ['더 자랄 수 있어요!', 'Hidden Growth Potential!'],
      ['한눈에 보는 3중 성인 예측키 성장 궤적 곡선', '3-Tier Adult Height Growth Trajectory Curve'],
      ['● 맞춤 관리', '● Optimized Care'],
      ['● 부모 유전키', '● Genetic MPH'],
      ['● 방치 시', '● Unmanaged'],
      ['① 방해습관 방치 시', '① Unmanaged Trajectory'],
      ['② 부모 유전 표적키', '② Genetic Target (MPH)'],
      ['③ 맞춤 관리 최대잠재키', '③ Optimized Peak Height'],
      ['몸무게 &amp; 체질량(BMI) 정밀 진단 리포트 (키 대비 적정 체중 밸런스)', 'Weight-for-Height & Body Mass Index (BMI) Endocrine Balance Report'],
      ['키 성장 최적 표준 체중', 'Optimal Growth Weight'],
      ['저체중·마른체형', 'Underweight / Lean'],
      ['키 성장 최적 표준 구간', 'Optimal Endocrine Growth Zone'],
      ['과체중 주의', 'Overweight / Leptin Risk'],
      ['1. 우리 아이 핵심 성장 진단서 요약표 (키 &amp; 몸무게 통합)', '1. Clinical Biometric Diagnosis Summary (Height & Weight)'],
      ['현재 키 백분위 (또래 비교)', 'Current Height Percentile (US CDC)'],
      ['현재 몸무게 백분위 (적정체중)', 'Current Weight Percentile (Optimal Target)'],
      ['연간 키 성장속도', 'Annual Height Velocity'],
      ['부모 유전 표적키', 'Genetic Target Height (Tanner MPH)'],
      ['골든타임 성장판 잔여 기간', 'Remaining Open Growth-Plate Window'],
      ['설문 기반 1:1 맞춤 신체 성장 핵심 처방', '1:1 Survey-Calibrated Endocrine & Biomechanical Prescription'],
      ['2. 오늘부터 실천할 하루 3대 핵심 처방', '2. Daily 3-Step Endocrine & Postural Protocol'],
      ['신장 특성 맞춤 집중 분석 · 또래 대비 작은 키 (하위 50% 미만)', 'STATURE SPECIALIZATION · Below-Average Height (< 50th Percentile) Catch-Up & rhGH Paper Analysis'],
      ['[하위 50% 미만 전용 심층 리포트] 성장호르몬(rhGH) 주사 효과 · 비용 · 한계 학술 논문 팩트체크', '[< 50th Percentile Exclusive] Growth Hormone (rhGH) Injection Efficacy, Cost ($15k–$40k/yr) & BMJ/Cochrane Paper Fact-Check'],
      ['신장 특성 맞춤 집중 분석 · 또래 대비 큰 키 &amp; 성조숙증·골연령 방어', 'STATURE SPECIALIZATION · Tall Stature & Precocious Puberty / Bone-Age Acceleration Defense'],
      ['체중 특성 맞춤 집중 분석 · 키 대비 과체중 경향 &amp; 체지방 감량 처방', 'WEIGHT SPECIALIZATION · Overweight-for-Height Fat Reduction Without Stunting Linear Growth'],
      ['체중 특성 맞춤 집중 분석 · 키 대비 저체중·소식형 &amp; 몸무게 증가 처방', 'WEIGHT SPECIALIZATION · Underweight-for-Height IGF-1 Bone-Matrix Bulk-Up & Zinc Appetite Protocol'],
      ['표준 밸런스 특성 맞춤 분석 · 설문 응답 생활습관 병목 집중 처방', 'BALANCED PHENOTYPE · Survey Lifestyle Bottleneck Pinpoint Optimization'],
      ['특정 학습 분야 문제점 1:1 집중 해부 &amp; 4주 개선 마스터플랜', 'SPECIFIC LEARNING BOTTLENECK 1:1 NEUROSCIENCE BREAKDOWN & 4-WEEK MASTERPLAN'],
      ['보고서 출력 (인쇄 / PDF 저장)', 'Print / Save A4 Clinical PDF']
    ];
    for (let i = 0; i < replacements.length; i++) {
      html = html.split(replacements[i][0]).join(replacements[i][1]);
    }
    card.innerHTML = html;

    // 2. Apply Taller-Style Hard Paywall Gate if not unlocked
    const existingGate = document.getElementById('taller-global-paywall-gate');
    if (existingGate) existingGate.remove();

    const p1 = document.getElementById('pillar-1-container');
    const p2 = document.getElementById('pillar-2-container');
    const profile = (global.KidsFitApp && global.KidsFitApp.state && global.KidsFitApp.state.profile) || {};
    const heightCm = parseFloat(profile.currentHeight) || 137.0;
    const weightKg = parseFloat(profile.currentWeight) || 35.5;
    const ageY = Math.max(1, Math.min(20, Math.floor((profile.ageMonths || 120) / 12)));
    const genderLabel = profile.gender === 'girl' ? 'Girl' : 'Boy';
    const heightImp = cmToFtInStr(heightCm);
    const weightLbs = (weightKg * 2.20462262).toFixed(1);

    if (isReportUnlocked()) {
      // Unlocked state: ensure Pillar 1 / Pillar 2 are completely unblurred and show Unlocked Verified Badge
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
      const unlockedBanner = document.createElement('div');
      unlockedBanner.id = 'taller-global-paywall-gate';
      unlockedBanner.style.cssText = 'background:#ECFDF5;border:2px solid #10B981;border-radius:16px;padding:0.9rem 1.2rem;margin-bottom:1.2rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.6rem;';
      unlockedBanner.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.6rem;">
          <span style="background:#10B981;color:#FFFFFF;font-size:0.76rem;font-weight:900;padding:0.22rem 0.65rem;border-radius:9999px;">UNLOCKED PRO PASS</span>
          <span style="font-size:0.9rem;font-weight:800;color:#065F46;">Full US CDC &amp; 3,639-Paper Clinical Report Unlocked — Age ${ageY} ${genderLabel} (${heightImp} / ${heightCm} cm · ${weightLbs} lbs)</span>
        </div>
        <button type="button" onclick="window.print();" style="background:#059669;color:#FFFFFF;border:none;border-radius:9999px;padding:0.42rem 0.95rem;font-size:0.82rem;font-weight:800;cursor:pointer;">
          Download / Print A4 PDF Report
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

    // Locked State: Blur Pillar 1 & Pillar 2 behind the Taller-Style Paywall Gate
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
            Profile: Age ${ageY} ${genderLabel} · Current ${heightImp} (${heightCm} cm) / ${weightLbs} lbs (${weightKg} kg)
          </span>
        </div>
        <span style="font-size:0.78rem;font-weight:800;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;padding:0.2rem 0.65rem;border-radius:9999px;">
          3,639 PubMed Papers Matched
        </span>
      </div>

      <!-- Step 2: Masked Predicted Height & Bottleneck Alert Teaser Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.75rem;margin-bottom:1.15rem;">
        <div style="background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:14px;padding:0.85rem 1rem;">
          <div style="font-size:0.75rem;font-weight:800;color:#475569;">① Final Predicted Adult Height</div>
          <div style="font-size:1.35rem;font-weight:900;color:#1D4ED8;margin-top:0.2rem;letter-spacing:-0.02em;">
            🔒 <span style="filter:blur(5px);user-select:none;">5' 10.8"</span> <span style="font-size:0.82rem;color:#DC2626;font-weight:800;">(Locked)</span>
          </div>
          <div style="font-size:0.76rem;color:#059669;font-weight:800;margin-top:0.2rem;">
            ▲ +2.6 in (+6.7 cm) Hidden Gain Detected!
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
          <div style="font-size:0.75rem;font-weight:800;color:#475569;">③ 5-Axis Brain LQ &amp; Study Bottleneck</div>
          <div style="font-size:1.05rem;font-weight:900;color:#0F172A;margin-top:0.25rem;">
            🔒 <span style="color:#1D4ED8;">2 Priority Bottlenecks Found</span>
          </div>
          <div style="font-size:0.76rem;color:#475569;font-weight:700;margin-top:0.2rem;">
            Includes Custom 4-Week Neuro-Study Fix Plan
          </div>
        </div>
      </div>

      <!-- Step 3: Taller-Style Pricing & Instant Unlock Card -->
      <div id="taller-global-paywall-card" style="background:#FFFFFF;border:2px solid #1D4ED8;border-radius:18px;padding:1.25rem 1.3rem;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem;margin-bottom:0.9rem;">
          <div>
            <span style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;font-size:0.75rem;font-weight:900;padding:0.2rem 0.65rem;border-radius:9999px;">
              LIMITED LAUNCH OFFER · SAVE 70% VS. $450 CLINIC CONSULT
            </span>
            <h3 style="font-size:1.24rem;font-weight:900;color:#0F172A;margin:0.45rem 0 0.2rem 0;">
              Unlock Your Child's Complete 1:1 Growth &amp; Brain LQ Master Report
            </h3>
            <p style="font-size:0.86rem;color:#475569;margin:0;">
              Instant access to both full reports (Physical Auxology + Neuro-Cognitive LQ), downloadable Hospital-Style A4 PDF, and 5 Printable Cognitive Worksheets.
            </p>
          </div>
        </div>

        <!-- 2-Tier Plan Selector -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:0.8rem;margin-bottom:1rem;">
          <label id="paywall-plan-label-single" onclick="window.selectKidsFitGlobalPlan('single')" style="cursor:pointer;background:#EFF6FF;border:2px solid #1D4ED8;border-radius:14px;padding:0.95rem 1rem;display:flex;flex-direction:column;justify-content:space-between;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">
              <span style="font-size:0.82rem;font-weight:900;color:#1D4ED8;">
                <input type="radio" name="kidsfit-global-plan" value="single" checked style="accent-color:#1D4ED8;margin-right:0.3rem;">
                SINGLE REPORT PASS (MOST POPULAR)
              </span>
              <span style="background:#1D4ED8;color:#FFFFFF;font-size:0.7rem;font-weight:900;padding:0.15rem 0.5rem;border-radius:9999px;">SAVE 70%</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:0.45rem;margin-bottom:0.3rem;">
              <span style="font-size:1.65rem;font-weight:900;color:#0F172A;">$8.99</span>
              <span style="font-size:0.85rem;color:#94A3B8;text-decoration:line-through;font-weight:700;">$29.99</span>
              <span style="font-size:0.78rem;color:#475569;font-weight:700;">· One-Time Payment</span>
            </div>
            <div style="font-size:0.78rem;color:#334155;line-height:1.45;">
              ✓ Full Physical Height + rhGH Paper Report<br>
              ✓ Full 5-Axis Brain LQ &amp; 4-Week Study Plan<br>
              ✓ Printable A4 Clinical PDF + 5 Worksheets
            </div>
          </label>

          <label id="paywall-plan-label-pass" onclick="window.selectKidsFitGlobalPlan('pass')" style="cursor:pointer;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;padding:0.95rem 1rem;display:flex;flex-direction:column;justify-content:space-between;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">
              <span style="font-size:0.82rem;font-weight:900;color:#0F172A;">
                <input type="radio" name="kidsfit-global-plan" value="pass" style="accent-color:#1D4ED8;margin-right:0.3rem;">
                6-MONTH GROWTH &amp; BRAIN TRACKER
              </span>
              <span style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;font-size:0.7rem;font-weight:900;padding:0.15rem 0.5rem;border-radius:9999px;">BEST VALUE</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:0.45rem;margin-bottom:0.3rem;">
              <span style="font-size:1.65rem;font-weight:900;color:#0F172A;">$19.99</span>
              <span style="font-size:0.85rem;color:#94A3B8;text-decoration:line-through;font-weight:700;">$79.99</span>
              <span style="font-size:0.78rem;color:#475569;font-weight:700;">· 6 Months Unlimited</span>
            </div>
            <div style="font-size:0.78rem;color:#334155;line-height:1.45;">
              ✓ Everything in Single Report Pass<br>
              ✓ Unlimited Sibling Profiles &amp; Monthly Re-Scans<br>
              ✓ 90-Day Height Velocity &amp; Bone-Age Tracker
            </div>
          </label>
        </div>

        <!-- Primary Checkout CTA Button -->
        <button type="button" id="btn-global-paywall-checkout" onclick="window.openKidsFitGlobalCheckoutModal()" style="width:100%;padding:1rem 1.2rem;border-radius:14px;border:none;background:linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%);color:#FFFFFF;font-size:1.05rem;font-weight:900;cursor:pointer;box-shadow:0 10px 25px rgba(29,78,216,0.28);margin-bottom:0.65rem;">
          🔓 Unlock Full Clinical Report &amp; Printable PDF Now ($8.99) →
        </button>

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;font-size:0.76rem;color:#64748B;">
          <span>🔒 256-Bit SSL Encrypted · Instant Access · 30-Day Money-Back Guarantee</span>
          <span>💳 Visa · Mastercard · Amex · Apple Pay · Google Pay · PayPal</span>
        </div>

        <!-- Promo / VIP Access Code Bar -->
        <div style="margin-top:0.8rem;padding-top:0.75rem;border-top:1px dashed #E2E8F0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
          <span style="font-size:0.78rem;font-weight:700;color:#475569;">Have a Clinic Partner or VIP Passcode?</span>
          <div style="display:flex;gap:0.4rem;align-items:center;">
            <input type="text" id="input-global-vip-code" placeholder="Enter code (e.g. VIP2026)" style="padding:0.38rem 0.65rem;border:1px solid #CBD5E1;border-radius:8px;font-size:0.8rem;color:#0F172A;background:#F8FAFC;width:170px;">
            <button type="button" onclick="window.applyKidsFitGlobalVipCode()" style="padding:0.4rem 0.8rem;border-radius:8px;border:1px solid #1D4ED8;background:#EFF6FF;color:#1D4ED8;font-size:0.78rem;font-weight:800;cursor:pointer;">
              Apply Code
            </button>
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
      btn.innerHTML = `🔓 Unlock Full Clinical Report &amp; Printable PDF Now (${priceStr}) →`;
    }
  };

  global.applyKidsFitGlobalVipCode = function () {
    const inp = document.getElementById('input-global-vip-code');
    const code = String((inp && inp.value) || '').trim().toUpperCase();
    if (code === 'VIP2026' || code === 'ADMIN' || code === 'KIDSFIT' || code === 'FREE100') {
      try {
        if (window.localStorage) window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
      } catch (_) {}
      transformGlobalReportAndApplyPaywall();
    } else {
      if (typeof window.alert === 'function') {
        window.alert('Invalid access code. Please complete checkout or enter a valid Clinic Partner code.');
      }
    }
  };

  global.openKidsFitGlobalCheckoutModal = function () {
    if (typeof document === 'undefined') return;
    // Check if external LemonSqueezy / Stripe URL is configured
    try {
      const saved = window.localStorage && window.localStorage.getItem(CHECKOUT_URLS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const targetUrl = selectedPlan === 'pass' ? parsed.passUrl : parsed.singleUrl;
        if (targetUrl && /^https?:\/\//i.test(targetUrl)) {
          window.location.href = targetUrl;
          return;
        }
      }
    } catch (_) {}

    let modal = document.getElementById('kidsfit-global-checkout-modal');
    if (modal) modal.remove();

    const priceStr = selectedPlan === 'pass' ? '$19.99' : '$8.99';
    const planTitle = selectedPlan === 'pass'
      ? '6-Month Growth & Brain LQ Unlimited Pass'
      : 'Single Child Full Clinical Report & A4 PDF Pass';

    modal = document.createElement('div');
    modal.id = 'kidsfit-global-checkout-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.72);display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);';
    modal.innerHTML = `
      <div style="background:#FFFFFF;border:2px solid #1D4ED8;border-radius:22px;max-width:460px;width:100%;padding:1.5rem 1.4rem;box-shadow:0 25px 60px rgba(0,0,0,0.35);color:#0F172A;text-align:left;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;padding-bottom:0.65rem;border-bottom:1px solid #E2E8F0;">
          <div>
            <span style="font-size:0.72rem;font-weight:900;color:#1D4ED8;background:#EFF6FF;padding:0.18rem 0.55rem;border-radius:9999px;">KIDS-FIT BIO LABS · SECURE CHECKOUT</span>
            <h3 style="margin:0.3rem 0 0;font-size:1.12rem;font-weight:900;color:#0F172A;">${planTitle}</h3>
          </div>
          <button type="button" onclick="var m=document.getElementById('kidsfit-global-checkout-modal');if(m)m.remove();" style="background:#F1F5F9;border:1px solid #CBD5E1;border-radius:9999px;width:32px;height:32px;font-weight:900;cursor:pointer;">✕</button>
        </div>

        <div style="background:#F8FAFC;border:1px solid #BFDBFE;border-radius:12px;padding:0.75rem 0.9rem;margin-bottom:0.9rem;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.86rem;font-weight:800;color:#334155;">Total Due Today (USD)</span>
          <span style="font-size:1.35rem;font-weight:900;color:#1D4ED8;">${priceStr}</span>
        </div>

        <div style="margin-bottom:0.75rem;">
          <label style="display:block;font-size:0.78rem;font-weight:800;color:#334155;margin-bottom:0.3rem;">Parent Email (For PDF Report Delivery &amp; Receipt)</label>
          <input type="email" id="checkout-parent-email" placeholder="parent@example.com" style="width:100%;box-sizing:border-box;padding:0.65rem 0.8rem;border:1.5px solid #CBD5E1;border-radius:10px;font-size:0.9rem;color:#0F172A;">
        </div>

        <div style="margin-bottom:0.85rem;">
          <label style="display:block;font-size:0.78rem;font-weight:800;color:#334155;margin-bottom:0.3rem;">Card Details (Or Express Pay)</label>
          <input type="text" id="checkout-card-number" placeholder="Card Number (4242 •••• •••• ••••)" style="width:100%;box-sizing:border-box;padding:0.65rem 0.8rem;border:1.5px solid #CBD5E1;border-radius:10px;font-size:0.9rem;color:#0F172A;margin-bottom:0.45rem;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.45rem;">
            <input type="text" placeholder="MM / YY" style="width:100%;box-sizing:border-box;padding:0.6rem 0.8rem;border:1.5px solid #CBD5E1;border-radius:10px;font-size:0.88rem;color:#0F172A;">
            <input type="text" placeholder="CVC" style="width:100%;box-sizing:border-box;padding:0.6rem 0.8rem;border:1.5px solid #CBD5E1;border-radius:10px;font-size:0.88rem;color:#0F172A;">
          </div>
        </div>

        <button type="button" onclick="window.completeKidsFitGlobalCheckout('${priceStr}')" style="width:100%;padding:0.9rem 1rem;border-radius:12px;border:none;background:#1D4ED8;color:#FFFFFF;font-size:0.98rem;font-weight:900;cursor:pointer;margin-bottom:0.55rem;">
          Pay ${priceStr} &amp; Unlock Instant Report →
        </button>

        <div style="font-size:0.74rem;color:#64748B;text-align:center;">
          🔒 Secured by 256-bit TLS encryption · Instant unlock upon authorization
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  global.completeKidsFitGlobalCheckout = function () {
    const emailEl = document.getElementById('checkout-parent-email');
    const email = String((emailEl && emailEl.value) || '').trim();
    if (!email || email.indexOf('@') === -1) {
      if (typeof window.alert === 'function') {
        window.alert('Please enter a valid email address to receive your printable PDF report and receipt.');
      }
      return;
    }
    try {
      if (window.localStorage) {
        window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
        window.localStorage.setItem('kidsfit_global_buyer_email', email);
      }
      if (typeof window.fetch === 'function') {
        window.fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'affiliate_click', href: 'global_paywall_unlock_' + selectedPlan })
        }).catch(function () {});
      }
    } catch (_) {}
    const modal = document.getElementById('kidsfit-global-checkout-modal');
    if (modal) modal.remove();
    transformGlobalReportAndApplyPaywall();
  };

  function initGlobalPaywallEdition() {
    if (!isGlobalPaidEdition()) return;
    applyGlobalHomepageEnglishDOM();

    // Observe #master-briefing-card so whenever the report renders or updates, English + Paywall Gate are applied automatically
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
    isGlobalPaidEdition,
    isReportUnlocked,
    applyGlobalHomepageEnglishDOM,
    transformGlobalReportAndApplyPaywall,
    initGlobalPaywallEdition
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalPaywallEdition;
  }
  global.KidsFitGlobalPaywall = GlobalPaywallEdition;
})(typeof window !== 'undefined' ? window : global);
