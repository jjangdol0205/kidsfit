/* Dream Company Lightweight Conversion UX Add-ons (Strict CSP — Zero Inline Handlers)
 * Preserves existing layout, design, auth, and checkout 100%.
 * Includes:
 *  ① Bottom Floating Pill CTA Bar (1~5 div, appears after hero scroll, auto-hides over forms/checkout/footer/audio)
 *  ② Pre-Purchase Doubt-Clearing FAQ Accordion (4-5 Qs) + Verified Review Policy (3 lines) + Auto-Hidden Public Reviews (>=3 only)
 *  ③ Concrete 3-Card Deliverables Spec near 2p Sample / Checkout
 *  ④ Lightweight 1-Line Protection Ribbon inside Paid Vault
 *  #3 1-Second Intuitive 3-Stage Status Badges (Divisions 2, 3, 5 ONLY — excluded on Div 1)
 */
(function initDreamCompanyUxAddons() {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DC_UX_ADDONS_V1__) return;
  window.__DC_UX_ADDONS_V1__ = true;

  function detectDiv() {
    var host = String((window.location && window.location.hostname) || '').toLowerCase();
    var path = String((window.location && window.location.pathname) || '').toLowerCase();
    if (host.indexOf('kisfitglobal') !== -1 || host.indexOf('kfg-pages') !== -1) return 'KFG';
    if (host.indexOf('getbreakai') !== -1 || host.indexOf('gba-pages') !== -1) return 'GBA';
    if (host.indexOf('paradise-hero') !== -1 || host.indexOf('hero-pages') !== -1) return 'HERO';
    if (host.indexOf('kidsfit.co.kr') !== -1 || host.indexOf('kfk-pages') !== -1) return 'KFK';
    if (path.indexOf('/jp') === 0) return 'GBA';
    return 'TOM';
  }

  var DIV = detectDiv();
  var PATH = String((window.location && window.location.pathname) || '/').toLowerCase();
  // Keep dedicated legal / F&G / QnA pages uncluttered — run full add-ons on main landing pages, and floating pill on main pages
  var IS_MAIN =
    PATH === '/' ||
    PATH === '/index.html' ||
    PATH === '/jp' ||
    PATH === '/jp/' ||
    PATH === '/jp/index.html';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function injectStyles() {
    if (document.getElementById('dcUxAddonsStyle')) return;
    var st = document.createElement('style');
    st.id = 'dcUxAddonsStyle';
    st.textContent =
      '.dc-pill-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%) translateY(120px);z-index:8800;display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:999px;background:rgba(15,44,34,0.96);color:#FAF7F2;box-shadow:0 12px 32px rgba(15,44,34,0.28);border:1px solid rgba(250,247,242,0.22);transition:transform 0.28s ease,opacity 0.28s ease;opacity:0;pointer-events:none;max-width:calc(100vw - 24px);}' +
      '.dc-pill-bar.is-visible{transform:translateX(-50%) translateY(0);opacity:1;pointer-events:auto;}' +
      '.dc-pill-btn{display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;padding:9px 15px;border-radius:999px;font-weight:700;font-size:0.86rem;text-decoration:none;cursor:pointer;border:none;font-family:inherit;}' +
      '.dc-pill-primary{background:#FAF7F2;color:#0F2C22;}' +
      '.dc-pill-secondary{background:transparent;color:#ECFDF5;border:1px solid rgba(236,253,245,0.45);}' +
      '.dc-pill-bar.is-hero{bottom:74px;padding:10px 14px;}' +
      '.dc-pill-bar.is-hero .dc-pill-btn{font-size:1.08rem;padding:12px 18px;min-height:48px;}' +
      '.dc-addon-box{background:#FFFFFF;border:1px solid #E5E0D5;border-radius:14px;padding:20px;margin:20px 0;color:#111827;text-align:left;}' +
      '.dc-addon-kicker{font-size:0.75rem;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#0F2C22;margin-bottom:6px;}' +
      '.dc-addon-title{font-size:1.12rem;font-weight:800;color:#0F2C22;margin:0 0 12px;}' +
      '.dc-deliv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;}' +
      '.dc-deliv-card{background:#FAF7F2;border:1px solid #E5E0D5;border-radius:10px;padding:13px 14px;}' +
      '.dc-deliv-num{display:inline-block;font-size:0.74rem;font-weight:800;color:#0F2C22;background:#DCFCE7;padding:2px 8px;border-radius:999px;margin-bottom:6px;}' +
      '.dc-deliv-h{font-size:0.93rem;font-weight:800;color:#111827;margin:0 0 4px;}' +
      '.dc-deliv-p{font-size:0.84rem;color:#4B5563;margin:0;line-height:1.55;}' +
      '.dc-faq-item{border-top:1px solid #ECE7DC;padding:10px 0;}' +
      '.dc-faq-item:first-of-type{border-top:none;padding-top:2px;}' +
      '.dc-faq-item summary{cursor:pointer;font-weight:700;font-size:0.93rem;color:#0F2C22;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:10px;}' +
      '.dc-faq-item summary::-webkit-details-marker{display:none;}' +
      '.dc-faq-item summary::after{content:"+";font-weight:800;font-size:1.1rem;color:#0F2C22;flex-shrink:0;}' +
      '.dc-faq-item[open] summary::after{content:"-";}' +
      '.dc-faq-a{font-size:0.87rem;color:#374151;margin:8px 0 2px;line-height:1.65;}' +
      '.dc-policy-box{margin-top:14px;padding:12px 14px;border-radius:10px;background:#F8FAFC;border:1px solid #E2E8F0;font-size:0.82rem;color:#334155;line-height:1.6;}' +
      '.dc-review-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:12px;}' +
      '.dc-review-card{background:#FAF7F2;border:1px solid #E5E0D5;border-radius:10px;padding:12px;font-size:0.86rem;color:#1F2937;}' +
      '.dc-vault-ribbon{background:#FEF3C7;border:1px solid #F59E0B;color:#78350F;border-radius:8px;padding:8px 14px;font-size:0.82rem;font-weight:700;margin-bottom:14px;display:flex;align-items:center;justify-content:center;text-align:center;}' +
      '.dc-stage3-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 13px;border-radius:999px;font-size:0.84rem;font-weight:800;border:1.5px solid currentColor;margin:8px 0 4px;line-height:1.35;}' +
      '.dc-stage3-green{color:#065F46;background:#ECFDF5;}' +
      '.dc-stage3-amber{color:#92400E;background:#FFFBEB;}' +
      '.dc-stage3-terra{color:#9A3412;background:#FFF7ED;}' +
      '@media(max-width:560px){.dc-pill-btn{font-size:0.8rem;padding:8px 12px;}}';
    document.head.appendChild(st);
  }

  /* =========================================================================
   * Add-on ①: Bottom Floating Pill CTA Bar (1~5 ALL Divisions)
   * ========================================================================= */
  function mountFloatingPill() {
    if (!IS_MAIN) return;
    if (document.getElementById('dcFloatingPillBar')) return;
    var cfgMap = {
      TOM: {
        pLabel: 'SMH Fear & Greed Gauge',
        pHref: '/smh-fear-greed?utm_source=floating_pill&utm_medium=web',
        sLabel: 'Free 2p Sample PDF',
        sHref: '/assets/downloads/tom_sample_2p.pdf',
        sBlank: true
      },
      KFG: {
        pLabel: 'Free 60s US CDC Check',
        pHref: '#top',
        pScroll: true,
        sLabel: 'Free 2p Sample PDF',
        sHref: '/assets/downloads/kfg_sample_2p.pdf',
        sBlank: true
      },
      GBA: {
        pLabel: 'SMH恐怖と強欲指数',
        pHref: '/jp/smh-fear-greed?utm_source=floating_pill&utm_medium=web',
        sLabel: '無料2pサンプルPDF',
        sHref: '/jp/downloads/gba_jp_sample_2p.pdf',
        sBlank: true
      },
      HERO: {
        pLabel: '🎵 백운호 6곡 무료 듣기',
        pHref: '/stream',
        sLabel: '💐 카톡 무료 안부카드',
        sHref: '/vip.html',
        sBlank: false
      },
      KFK: {
        pLabel: '가입 없는 60초 무료 진단',
        pHref: '#top',
        pScroll: true,
        sLabel: '2p 무료 샘플 PDF',
        sHref: '/assets/downloads/kfk_sample_2p.pdf',
        sBlank: true
      }
    };
    var cfg = cfgMap[DIV] || cfgMap.TOM;
    var bar = document.createElement('div');
    bar.id = 'dcFloatingPillBar';
    bar.className = 'dc-pill-bar' + (DIV === 'HERO' ? ' is-hero' : '');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Quick Action Bar');
    bar.innerHTML =
      '<a class="dc-pill-btn dc-pill-primary" id="dcPillPrimaryBtn" href="' + esc(cfg.pHref) + '">' + esc(cfg.pLabel) + '</a>' +
      '<a class="dc-pill-btn dc-pill-secondary" id="dcPillSecondaryBtn" href="' + esc(cfg.sHref) + '"' + (cfg.sBlank ? ' target="_blank" rel="noopener"' : '') + '>' + esc(cfg.sLabel) + '</a>';
    document.body.appendChild(bar);

    var pBtn = document.getElementById('dcPillPrimaryBtn');
    if (pBtn && cfg.pScroll) {
      pBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.DreamCompanyCRM && typeof window.DreamCompanyCRM.trackFunnelEvent === 'function') {
          window.DreamCompanyCRM.trackFunnelEvent(DIV, 'floating_cta_click');
        }
      });
    } else if (pBtn) {
      pBtn.addEventListener('click', function () {
        if (window.DreamCompanyCRM && typeof window.DreamCompanyCRM.trackFunnelEvent === 'function') {
          window.DreamCompanyCRM.trackFunnelEvent(DIV, 'floating_cta_click');
        }
      });
    }

    function isAnyObstructedElementInView() {
      var ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT')) return true;
      var vh = window.innerHeight || 800;
      var sel = 'footer, form, .whop-checkout-button, [data-tom-paid-plan], #btn-one-tap-premium-suite, #btn-one-tap-pass, a[href*="latpeed.com"], a[href*="buy.polar.sh"], a[href*="whop.com/checkout"], audio, #sticky-radio-player.is-playing';
      var nodes = document.querySelectorAll(sel);
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (!el || el.offsetParent === null) continue;
        var r = el.getBoundingClientRect();
        if (r.height > 10 && r.bottom > vh - 120 && r.top < vh) {
          return true;
        }
      }
      return false;
    }

    function updateBarVisibility() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var show = y > 420 && !isAnyObstructedElementInView();
      bar.classList.toggle('is-visible', show);
    }

    window.addEventListener('scroll', updateBarVisibility, { passive: true });
    window.addEventListener('resize', updateBarVisibility, { passive: true });
    document.addEventListener('focusin', updateBarVisibility, true);
    document.addEventListener('focusout', updateBarVisibility, true);
    setTimeout(updateBarVisibility, 900);
  }

  /* =========================================================================
   * Add-on ② + ③: Concrete 3-Card Deliverables + Pre-Purchase FAQ + Review Policy
   * ========================================================================= */
  var COPY = {
    TOM: {
      delivKicker: 'WHAT YOU RECEIVE IMMEDIATELY',
      delivTitle: '3 Concrete Reference Deliverables Included',
      deliv: [
        { n: '01', h: '14-Page 2000-2025 Crisis Workbook PDF', p: 'Verified historical drawdowns & recovery months across Dot-Com, 2008, and 2022 for SMH x XLV + SGOV.' },
        { n: '02', h: 'Self-Serve Custom Dollar Worksheet', p: 'Printable allocation sheet scaled to your exact portfolio band and 24-month Treasury reserve.' },
        { n: '03', h: '401(k) / IRA Tax-Location Study Table', p: 'Plain-English educational reference comparing taxable vs. tax-deferred account placement (non-advisory).' }
      ],
      faqKicker: 'BEFORE YOU DECIDE',
      faqTitle: 'Quick Answers Before Unlocking',
      faqs: [
        { q: 'Can I inspect the actual data quality before paying?', a: 'Yes. Open our free 2-page 2000-2025 Sample PDF right now with zero email wall or card required.' },
        { q: 'Is this investment advice or buy/sell trade signals?', a: 'No. Truth of Market is strictly an independent educational research publisher presenting public historical ETF statistics.' },
        { q: 'How fast do I receive my PDF after checkout?', a: 'Instantly after Whop checkout, plus an automatic backup email with your verified 6-digit OTP restore access.' },
        { q: 'What is the refund & cancellation policy?', a: '7-day full refund if unopened/undownloaded; 100% refund for any file or billing issue; optional recurring passes cancel anytime in 1 click.' }
      ],
      policyTitle: 'Verified Reader Review Policy (Zero Fake or Incentivized Reviews)',
      policyLines: [
        '1. Only verified paying members who authenticated their purchase can leave 1 reflection.',
        '2. Zero beta giveaways, zero sponsored posts, and zero paid or edited testimonials.',
        '3. Verified reflections appear automatically once 3 or more genuine member notes accumulate.'
      ],
      vaultRibbon: 'Personal & Household Use Only · Unauthorized Redistribution or Public Sharing Prohibited'
    },
    KFG: {
      delivKicker: 'CONCRETE PARENT DELIVERABLES',
      delivTitle: '3 Printable Reference Artifacts You Hold in Hand',
      deliv: [
        { n: '01', h: '4-Page Personalized US CDC Reference PDF', p: 'Time-adjusted bone-age math, US ft/in & lbs growth curves, and estimated adult range.' },
        { n: '02', h: '30-Day Printable Refrigerator Checklist', p: 'Calm bedtime, dinner protein, and posture habits designed for busy evenings — zero supplement ads.' },
        { n: '03', h: 'Pediatrician Visit Prep Sheet & Sibling Archive', p: 'Structured checkup questions plus up to 4 sibling profiles & monthly velocity tracking (Pass/Suite).' }
      ],
      faqKicker: 'PARENT PEACE-OF-MIND FAQ',
      faqTitle: 'Questions Parents Ask Before Unlocking',
      faqs: [
        { q: 'Can I preview the report before buying?', a: 'Yes. Open our free 2-page US CDC Sample PDF immediately — zero email wall, zero supplement pitches.' },
        { q: 'Is this medical advice or a doctor replacement?', a: 'No. KISFIT Studio is a 100% automated, non-medical educational reference tool for adult parents (18+) built on public US CDC 2000 tables.' },
        { q: 'Does one Pass cover multiple children?', a: 'Yes. Both the 6-Month Pass ($19.99) and 12-Month Suite ($49) support up to 4 siblings under one family account.' },
        { q: 'What is your refund policy?', a: '7-day full refund if unopened/undownloaded; 100% refund for any file error or duplicate charge; zero recurring auto-billing on one-time passes.' }
      ],
      policyTitle: 'Verified Parent Review Policy (Zero Sponsored or Beta Reviews)',
      policyLines: [
        '1. Only verified Polar.sh buyers who authenticated their pass can leave 1 voluntary reflection.',
        '2. Zero beta testers, zero affiliate sponsorships, and zero fabricated reviews.',
        '3. Public parent reflections display automatically once 3+ genuine verified notes are recorded.'
      ],
      vaultRibbon: 'Family & Household Use Only · Unauthorized Redistribution or Sharing Prohibited'
    },
    GBA: {
      delivKicker: 'お手元に届く3つの実物資料',
      delivTitle: 'ご購入前に確認できる3つの具体的な成果物',
      deliv: [
        { n: '01', h: '12p 新NISA・過去25年統計ワークブックPDF', p: '2000〜2025年（ITバブル・リーマン・2022年）のSMH×XLV＋個人向け国債の客観的比較データ。' },
        { n: '02', h: '円建てセルフサービス自動計算シート', p: '成長投資枠1,200万円上限・つみたて枠600万円・特定口座の整理表をご自身の資産額で印刷保存。' },
        { n: '03', h: '楽天・SBI証券 指値注文ステップ図解', p: '50〜70代の方でも落ち着いて確認できる口座設定・指値確認手順の教育ガイド（売買推奨なし）。' }
      ],
      faqKicker: 'ご購入前のよくあるご質問',
      faqTitle: '迷いを解消するための4つの確認事項',
      faqs: [
        { q: '購入前に中身を確認できますか？', a: 'はい。メール登録不要で「無料2pサンプルPDF」を今すぐご覧いただけます。' },
        { q: '個別銘柄の売買指示や投資助言は含まれますか？', a: '一切含まれません。公開ETFの過去統計と金融庁の新NISA制度枠を整理した独立系教育出版資料です。' },
        { q: '¥1,480の買い切り版は自動更新されますか？', a: 'いいえ、1回限りの買い切りで自動更新はありません。月額・年間パスもいつでも1クリックで解約できます。' },
        { q: '返金ポリシーはどうなっていますか？', a: '未閲覧・未ダウンロード時は決済後7日以内全額返金、ファイル不具合や重複決済時は100%返金いたします。' }
      ],
      policyTitle: '認証会員ご感想の公開ポリシー（サクラ・広告レビュー0件）',
      policyLines: [
        '1. 実際に決済・認証を完了された会員様のみ1回に限り任意でご感想を投稿できます。',
        '2. 体験団募集・報酬付きレビュー・やらせ投稿は一切行っておりません。',
        '3. 実際の認証会員様のご感想が3件以上集まり次第、この欄に自動で公開されます。'
      ],
      vaultRibbon: 'ご本人・ご家族専用資料 ／ 無断転載・第三者への配布・共有禁止'
    },
    KFK: {
      delivKicker: '손에 바로 쥐는 실물 결과물 3종',
      delivTitle: '결제 전 확인하는 3가지 구체적 산출물',
      deliv: [
        { n: '01', h: '아이 이름·뼈나이 시차(Δt) 반영 4p 맞춤 PDF', p: '질병관리청(KDCA 2017) 공식 성장도표 기준으로 보정한 예상키·성장 병목 정리 보고서.' },
        { n: '02', h: '소아과 방문 질문지 + 30일 냉장고 실천 달력', p: '진료실에서 바로 물어볼 핵심 질문과 밤 9시 반 수면·단백질 습관 체크표를 인쇄용으로 제공.' },
        { n: '03', h: '골든타임 마스터북 PDF & 6~12개월 트래커', p: '17p/20p 실전 가이드와 매월 30초 성장속도(cm/년) 자동 판독(최대 4명 형제자매 지원).' }
      ],
      faqKicker: '결제 전 마지막 의심 해소 FAQ',
      faqTitle: '부모님이 가장 많이 물어보시는 4가지',
      faqs: [
        { q: '결제 전에 실제 PDF 품질을 미리 볼 수 있나요?', a: '네. 회원가입이나 이메일 입력 없이 바로 상단·결과 화면의 2p 무료 샘플 PDF를 열어 보실 수 있습니다.' },
        { q: '영양제 광고나 상업성 제휴 추천이 들어 있나요?', a: '단 1건도 없습니다. 키즈핏은 질병관리청 공공 데이터 기반 순수 유료 리포트 플랫폼으로 상업성 제휴를 전면 배제합니다.' },
        { q: '래피드 결제 후 맞춤 PDF는 어떻게 받나요?', a: '래피드 결제 직후 kidsfit.co.kr로 돌아와 결제 이메일과 6자리 인증코드(또는 주문코드)를 입력하면 즉시 발급됩니다.' },
        { q: '환불 기준이 궁금합니다.', a: '미열람·미다운로드 시 결제 후 7일 이내 전액 환불되며, 파일 오류·중복 결제 시 100% 신속 환불해 드립니다.' }
      ],
      policyTitle: '투명 후기 검증 정책 (체험단·광고 후기 0건)',
      policyLines: [
        '1. 실제 결제·인증 완료 고객만 1회 자발적으로 작성할 수 있습니다.',
        '2. 체험단 모집·할인 조건부 후기·대행 작성 후기는 0건입니다.',
        '3. 실제 인증 부모님 소감이 3건 이상 모이면 이 영역에 자동 공개됩니다.'
      ],
      vaultRibbon: '1인·가족 전용 자료 · 무단 배포 및 제3자 공유 금지'
    }
  };

  function buildDeliverablesAndFaqEl(c) {
    var wrap = document.createElement('section');
    wrap.id = 'dcPreCheckoutAddons';
    wrap.className = 'dc-addon-box';
    wrap.setAttribute('aria-label', 'Deliverables and FAQ');

    var delivHtml =
      '<div class="dc-addon-kicker">' + esc(c.delivKicker) + '</div>' +
      '<h3 class="dc-addon-title">' + esc(c.delivTitle) + '</h3>' +
      '<div class="dc-deliv-grid">' +
      c.deliv.map(function (d) {
        return (
          '<div class="dc-deliv-card">' +
          '<span class="dc-deliv-num">' + esc(d.n) + '</span>' +
          '<h4 class="dc-deliv-h">' + esc(d.h) + '</h4>' +
          '<p class="dc-deliv-p">' + esc(d.p) + '</p>' +
          '</div>'
        );
      }).join('') +
      '</div>';

    var faqHtml =
      '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #ECE7DC;">' +
      '<div class="dc-addon-kicker">' + esc(c.faqKicker) + '</div>' +
      '<h3 class="dc-addon-title">' + esc(c.faqTitle) + '</h3>' +
      c.faqs.map(function (f) {
        return (
          '<details class="dc-faq-item"><summary>' + esc(f.q) + '</summary>' +
          '<p class="dc-faq-a">' + esc(f.a) + '</p></details>'
        );
      }).join('') +
      '</div>';

    var policyHtml =
      '<div class="dc-policy-box">' +
      '<strong>' + esc(c.policyTitle) + '</strong><br>' +
      c.policyLines.map(esc).join('<br>') +
      '<div id="dcVerifiedReviewsMount" style="display:none;margin-top:10px;"></div>' +
      '</div>';

    wrap.innerHTML = delivHtml + faqHtml + policyHtml;

    var details = wrap.querySelectorAll('details');
    for (var i = 0; i < details.length; i++) {
      details[i].addEventListener('toggle', function () {
        if (this.open && window.DreamCompanyCRM && typeof window.DreamCompanyCRM.trackFunnelEvent === 'function') {
          window.DreamCompanyCRM.trackFunnelEvent(DIV, 'faq_open');
        }
      });
    }
    return wrap;
  }

  function hydrateVerifiedReviews() {
    var mount = document.getElementById('dcVerifiedReviewsMount');
    if (!mount) return;
    if (!window.DreamCompanyCRM || typeof window.DreamCompanyCRM.fetchVerifiedReviews !== 'function') return;
    window.DreamCompanyCRM.fetchVerifiedReviews(DIV).then(function (res) {
      if (!res || !res.visible || !Array.isArray(res.reviews) || res.reviews.length < 3) {
        mount.style.display = 'none';
        return;
      }
      mount.style.display = 'block';
      mount.innerHTML =
        '<div class="dc-review-grid">' +
        res.reviews.slice(0, 6).map(function (rv) {
          return (
            '<div class="dc-review-card">' +
            '<div style="font-weight:700;color:#0F2C22;margin-bottom:4px;">&#10003; ' + esc(rv.display_name || 'Verified') + '</div>' +
            '<div>&ldquo;' + esc(rv.comment || '') + '&rdquo;</div>' +
            '</div>'
          );
        }).join('') +
        '</div>';
    });
  }

  function mountDiv1235Addons() {
    if (DIV === 'HERO' || !IS_MAIN) return;
    var c = COPY[DIV];
    if (!c) return;

    // ② + ③ Inject Deliverables + FAQ + Review Policy above Paid CTA section
    function tryAttachPreCheckout() {
      if (document.getElementById('dcPreCheckoutAddons')) return true;
      var anchorSelectors = {
        TOM: ['#tomValueLadderCards', '.pw-tier-grid', '#pwScreen3 .pw-card', '#pwScreen3'],
        KFG: ['#kfg-paywall-section', '#kfg-tier-cards', '#kfg-result-screen .kfg-card', '#kfg-screen-3'],
        GBA: ['#gbaValueLadderCardsJp', '.pw-tier-grid', '#pwScreen3Jp .pw-card', '#pwScreen3Jp'],
        KFK: ['#kfk-paywall-section', '#kfk-tier-cards', '#kfk-screen-3', '#kfk-result-screen']
      };
      var list = anchorSelectors[DIV] || [];
      for (var i = 0; i < list.length; i++) {
        var target = document.querySelector(list[i]);
        if (target && target.parentNode) {
          var box = buildDeliverablesAndFaqEl(c);
          target.parentNode.insertBefore(box, target);
          hydrateVerifiedReviews();
          return true;
        }
      }
      return false;
    }

    // ④ Lightweight 1-line Protection Ribbon + Voluntary 1-Second Satisfaction Bar inside Paid Vault
    function tryAttachVaultRibbon() {
      var vaultSelectors = [
        '#tomPaidScreen4Vault',
        '#pwScreen4',
        '#kfg-paid-vault',
        '#kfg-screen-4',
        '#gbaPaidScreen4VaultJp',
        '#pwScreen4Jp',
        '#kfk-paid-vault',
        '#kfk-screen-4'
      ];
      for (var i = 0; i < vaultSelectors.length; i++) {
        var v = document.querySelector(vaultSelectors[i]);
        if (!v) continue;
        if (!v.querySelector('.dc-vault-ribbon')) {
          var rib = document.createElement('div');
          rib.className = 'dc-vault-ribbon';
          rib.textContent = c.vaultRibbon;
          v.insertBefore(rib, v.firstChild);
        }
        if (!v.querySelector('#dc-verified-feedback') && window.DreamCompanyCRM && typeof window.DreamCompanyCRM.mountSatisfactionBar === 'function') {
          var fbSlot = document.createElement('div');
          fbSlot.id = 'dcVaultFeedbackSlot';
          v.appendChild(fbSlot);
          window.DreamCompanyCRM.mountSatisfactionBar(fbSlot, { div: DIV, context: 'paid_vault' });
        }
      }
    }

    // #3 1-Second Intuitive 3-Stage Status Badges (Divisions 2, 3, 5 ONLY — explicitly excluded on TOM!)
    function tryAttachStage3Badge() {
      if (DIV === 'TOM') return;
      if (DIV === 'KFG') {
        var pctEl = document.getElementById('kfg-res-percentile') || document.querySelector('[data-kfg-percentile]');
        if (!pctEl || !pctEl.parentNode) return;
        var rawTxt = String(pctEl.textContent || '');
        var m = rawTxt.match(/(\d+(?:\.\d+)?)/);
        var pct = m ? parseFloat(m[1]) : 50;
        var cls = pct >= 40 ? 'dc-stage3-green' : pct >= 18 ? 'dc-stage3-amber' : 'dc-stage3-terra';
        var label =
          pct >= 40
            ? 'Steady Growth Track (US CDC Guide)'
            : pct >= 18
              ? 'Sleep & Routine Tune-Up Zone'
              : 'Pediatrician Visit Prep Recommended';
        var b = document.getElementById('dcKfgStage3Badge');
        if (!b) {
          b = document.createElement('div');
          b.id = 'dcKfgStage3Badge';
          pctEl.parentNode.appendChild(b);
        }
        b.className = 'dc-stage3-badge ' + cls;
        b.textContent = label;
      } else if (DIV === 'KFK') {
        var kPctEl = document.getElementById('kfk-res-percentile') || document.querySelector('.kfk-pct-val, [data-kfk-percentile]');
        if (!kPctEl || !kPctEl.parentNode) return;
        var kTxt = String(kPctEl.textContent || '');
        var km = kTxt.match(/(\d+(?:\.\d+)?)/);
        var kPct = km ? parseFloat(km[1]) : 50;
        var kCls = kPct >= 40 ? 'dc-stage3-green' : kPct >= 18 ? 'dc-stage3-amber' : 'dc-stage3-terra';
        var kLabel =
          kPct >= 40
            ? '안심 순항 구간'
            : kPct >= 18
              ? '밤 9시 반 수면·영양 보강 구간'
              : '소아과 방문 질문지 지참 권장 구간';
        var kb = document.getElementById('dcKfkStage3Badge');
        if (!kb) {
          kb = document.createElement('div');
          kb.id = 'dcKfkStage3Badge';
          kPctEl.parentNode.appendChild(kb);
        }
        kb.className = 'dc-stage3-badge ' + kCls;
        kb.textContent = kLabel;
      } else if (DIV === 'GBA') {
        var gRes = document.getElementById('pwScreen3Jp') || document.getElementById('gbaResultAllocationJp');
        if (!gRes) return;
        var scaleVal = 1800;
        try {
          var saved = JSON.parse(localStorage.getItem('gba_jp_stepup_answers_v1') || '{}');
          if (saved && saved.scale) scaleVal = Number(saved.scale) || 1800;
        } catch (_) {}
        var gCls = scaleVal <= 1200 ? 'dc-stage3-green' : scaleVal <= 1800 ? 'dc-stage3-amber' : 'dc-stage3-terra';
        var gLabel =
          scaleVal <= 1200
            ? '新NISA 1,800万円非課税枠 最適配分'
            : scaleVal <= 1800
              ? '米国配当10%源泉徴収 認知推奨'
              : '成長投資枠1,200万円超過分 特定口座分離必須';
        var gb = document.getElementById('dcGbaStage3Badge');
        if (!gb) {
          gb = document.createElement('div');
          gb.id = 'dcGbaStage3Badge';
          var hTarget = gRes.querySelector('h2, h3, .pw-res-headline') || gRes.firstElementChild;
          if (hTarget && hTarget.parentNode) {
            hTarget.parentNode.insertBefore(gb, hTarget.nextSibling);
          } else {
            gRes.insertBefore(gb, gRes.firstChild);
          }
        }
        gb.className = 'dc-stage3-badge ' + gCls;
        gb.textContent = gLabel;
      }
    }

    function runAll() {
      tryAttachPreCheckout();
      tryAttachVaultRibbon();
      tryAttachStage3Badge();
    }

    runAll();
    // Lightweight observer for SPA screen transitions (TOM React/JS, KFG/KFK/GBA step-up transitions)
    var timer = null;
    var obs = new MutationObserver(function () {
      if (timer) return;
      timer = setTimeout(function () {
        timer = null;
        runAll();
      }, 260);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    injectStyles();
    mountFloatingPill();
    mountDiv1235Addons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
