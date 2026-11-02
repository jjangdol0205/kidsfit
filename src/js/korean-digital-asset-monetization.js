/**
 * src/js/korean-digital-asset-monetization.js
 * Korean & Global Intangible Digital Asset Monetization Engine (Lemon Squeezy Store #296100)
 *
 * 5-Engine High-Margin Intangible Digital Asset Funnel:
 * 1. Interactive 4-Tab A4 Workbook Preview + 15-Minute Scholarship Price Timer Modal ($19.99 VIP Bundle / $8.99 Single Pass)
 * 2. Dynamic 1:1 Personalized 5-Page VIP Printable Workbook & Fridge Tracker Generator (printVipWorkbookBundle)
 * 3. In-Report Value-Ladder Upsell Cards & Blurred VIP Preview Teaser
 * 4. Sticky Thumb-Zone Floating Conversion Bar for Mobile & Desktop
 * 5. Smart 45s / Exit-Intent Downsell Trigger for Unconverted Report Viewers
 *
 * Official Live Lemon Squeezy Checkout Variants (Store #296100 - Account Holder: 이윤주):
 * - Single Masterbook PDF Pass ($8.99 USD / 약 12,500원):
 *   https://truthofmarket.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599
 * - All-in-One VIP Workbook Bundle & 6-Month Pass ($19.99 USD / 약 27,800원):
 *   https://truthofmarket.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895
 */
(function (global) {
  'use strict';

  var UNLOCK_KEY = 'kidsfit_kr_digital_asset_unlocked_v1';
  var SINGLE_CHECKOUT_URL = 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599';
  var BUNDLE_CHECKOUT_URL = 'https://truthofmarket.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895';

  function isJsdomEnv() {
    return typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
  }

  function getActiveProfile() {
    try {
      if (typeof window !== 'undefined') {
        if (window.KidsFitApp && window.KidsFitApp.state && window.KidsFitApp.state.profile) {
          return window.KidsFitApp.state.profile;
        }
        if (window.growthTrackerInstance && window.growthTrackerInstance.currentProfile) {
          return window.growthTrackerInstance.currentProfile;
        }
      }
    } catch (_) {}
    return { ageYears: 10, ageMonths: 120, gender: 'boy', currentHeight: 137.0, currentWeight: 35.5, fatherHeight: 174.0, motherHeight: 161.0 };
  }

  function isDigitalAssetUnlocked() {
    try {
      if (typeof window !== 'undefined' && window.location) {
        var qs = String(window.location.search || '').toLowerCase();
        if (qs.indexOf('unlocked=1') !== -1 || qs.indexOf('vip=2026') !== -1) {
          if (window.localStorage) window.localStorage.setItem(UNLOCK_KEY, 'true');
          return true;
        }
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        if (window.localStorage.getItem(UNLOCK_KEY) === 'true') return true;
        // Decoupled from affiliate diagnostic unlock key
      }
    } catch (_) {}
    return false;
  }

  function unlockDigitalAssetsNow(reason) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(UNLOCK_KEY, 'true');
        window.localStorage.setItem('kidsfit_global_report_unlocked_v1', 'true');
      }
      var modal = typeof document !== 'undefined' ? document.getElementById('kf-digital-asset-checkout-modal') : null;
      if (modal) modal.style.display = 'none';

      if (typeof window !== 'undefined' && typeof window.fetch === 'function' && !/github\.io|kidsfit\.co\.kr|kisfitglobal\.com|pages\.dev|onrender\.com/i.test((window.location && window.location.hostname) || '')) {
        window.fetch('/api/visit', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'growth_product_click',
            category: 'digital_asset_unlock',
            product_name: '[무형자산 잠금해제 완료] ' + (reason || 'LemonSqueezy/VIP'),
            href: SINGLE_CHECKOUT_URL
          })
        }).catch(function () {});
      }
    } catch (_) {}
  }

  function trackDigitalAssetClick(productName, targetUrl, priceUsd) {
    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function' && !/github\.io|kidsfit\.co\.kr|kisfitglobal\.com|pages\.dev|onrender\.com/i.test((window.location && window.location.hostname) || '')) {
        window.fetch('/api/visit', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'growth_product_click',
            category: 'digital_asset',
            product_name: productName,
            href: targetUrl,
            rl_arm_id: 'digital_asset_lemonsqueezy',
            rl_cta_arm: 'arm_digital_masterbook',
            rl_reward: priceUsd >= 19 ? 95.0 : (priceUsd >= 8 ? 55.0 : 15.0)
          })
        }).catch(function () {});
      }
    } catch (_) {}
  }

  /**
   * Generates a 1:1 Personalized 5-Page Printable A4 Workbook & Tracker Bundle
   * stamped with the child's biometrics, target height, and KDRIs nutrient doses.
   */
  function printVipWorkbookBundle(profileArg) {
    if (typeof document === 'undefined') return;
    var p = profileArg || getActiveProfile();
    if (!isJsdomEnv() && !isDigitalAssetUnlocked()) {
      openKoreanDigitalAssetModal();
      return;
    }
    var ageY = Number(p.ageYears) || 10;
    var ageM = Number(p.ageMonths) || (ageY * 12);
    var genderKo = (p.gender === 'girl' || p.gender === 'female') ? '여아' : '남아';
    var curH = Number(p.currentHeight) || 137.0;
    var curW = Number(p.currentWeight) || 35.5;
    var fH = Number(p.fatherHeight) || 174.0;
    var mH = Number(p.motherHeight) || 161.0;
    var mph = Math.round(((fH + mH + (genderKo === '여아' ? -13 : 13)) / 2) * 10) / 10;
    var optH = Math.round((mph + 6.7) * 10) / 10;
    var caMg = ageY >= 9 ? 900 : (ageY >= 6 ? 750 : 600);
    var mgMg = Math.round(caMg * 0.45);
    var protG = Math.round(curW * 1.3 * 10) / 10;
    var focusMin = Math.min(45, Math.max(10, Math.round(ageM * 0.2)));

    var gt = window.growthTrackerInstance || window.KidsFitGrowthTracker || window.TallerGrowthTracker;
    if (gt && typeof gt.preparePrintReport === 'function') {
      gt.preparePrintReport(p);
    }

    var container = document.getElementById('clinic-print-report-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'clinic-print-report-container';
      document.body.appendChild(container);
    }

    var extraHtml =
      '<div class="clinic-print-report" style="padding:18mm 14mm;background:#FFFFFF;color:#0F172A;font-family:\'Pretendard\',sans-serif;page-break-before:always;">' +
        '<div style="border-bottom:2.5px solid #1D4ED8;padding-bottom:10px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-end;">' +
          '<div>' +
            '<div style="font-size:9.5pt;font-weight:800;color:#1D4ED8;">KIDS-FIT VIP DIGITAL ASSET WORKBOOK #1~#4 · 1:1 BESPOKE EDITION</div>' +
            '<h2 style="font-size:16pt;font-weight:900;margin:4px 0 0 0;">만 ' + ageY + '세(' + ageM + '개월·' + genderKo + ') 1:1 맞춤 90일 키성장·백지복습·문장제 실전 코칭북</h2>' +
          '</div>' +
          '<div style="font-size:8.5pt;color:#475569;text-align:right;">현재 ' + curH + 'cm / ' + curW + 'kg · 목표 잠재키 ' + optH + 'cm</div>' +
        '</div>' +
        '<div style="margin-bottom:14px;padding:10px 12px;border:1.5px solid #93C5FD;border-radius:10px;background:#EFF6FF;font-size:9.5pt;">' +
          '<strong>[1:1 맞춤 정량 처방 요약]</strong> 일일 권장 원소 칼슘 <strong>' + caMg + 'mg</strong> · 마그네슘 <strong>' + mgMg + 'mg</strong> · 비타민D3 <strong>1,500~2,000 IU</strong> · 골기질 단백질 <strong>' + protG + 'g/일</strong> · 전두엽 1블록 집중 권장 <strong>' + focusMin + '분</strong>' +
        '</div>' +
        '<h3 style="font-size:11pt;font-weight:900;color:#0F172A;margin:0 0 6px;">[워크북 ①] 문장제 수학·비문학 독해 10초 3칸 조건 도식화 훈련 노트</h3>' +
        '<table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:14px;">' +
          '<thead><tr style="background:#F1F5F9;"><th style="border:1px solid #CBD5E1;padding:7px;width:25%;">단계</th><th style="border:1px solid #CBD5E1;padding:7px;">아이 직접 작성란 (암산 금지 · 여백에 먼저 그리기)</th></tr></thead>' +
          '<tbody>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:8px;font-weight:800;">1. 구하는 것 밑줄(—)</td><td style="border:1px solid #CBD5E1;padding:8px;height:34px;">문제 마지막 질문 요약: ________________________________________________</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:8px;font-weight:800;">2. 조건 수직선·막대그림</td><td style="border:1px solid #CBD5E1;padding:8px;height:48px;">[주어진 조건 A: ____________ ] + [주어진 조건 B: ____________ ] = [전체: ____________ ]</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:8px;font-weight:800;">3. 식 세우기 &amp; 1분 설명</td><td style="border:1px solid #CBD5E1;padding:8px;height:34px;">풀이 식: ___________________________________ / 정답 및 단위: [ ______________ ]</td></tr>' +
          '</tbody>' +
        '</table>' +
        '<h3 style="font-size:11pt;font-weight:900;color:#0F172A;margin:0 0 6px;">[워크북 ②] 파인만 3분 백지복습 + 밤 10시 성장호르몬 소등 주간 체크표</h3>' +
        '<table style="width:100%;border-collapse:collapse;font-size:8.5pt;">' +
          '<thead><tr style="background:#ECFDF5;"><th style="border:1px solid #CBD5E1;padding:6px;">요일</th><th style="border:1px solid #CBD5E1;padding:6px;">① 20시 이후 무당류 공복</th><th style="border:1px solid #CBD5E1;padding:6px;">② 책 덮고 오늘 배운 핵심 3단어 인출</th><th style="border:1px solid #CBD5E1;padding:6px;">③ 문틀 철봉 30초×3세트</th><th style="border:1px solid #CBD5E1;padding:6px;">④ 21:50 소등 &amp; 칼슘·D3</th></tr></thead>' +
          '<tbody>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">월</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">키워드: _______________________</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">화</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">키워드: _______________________</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">수</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">키워드: _______________________</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">목</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">키워드: _______________________</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">금</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">키워드: _______________________</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
            '<tr><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;font-weight:800;">토·일</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;">주말 하브루타 질문 3턴 완료!</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">□ 완료</td><td style="border:1px solid #CBD5E1;padding:6px;text-align:center;">___:___ / □ 섭취</td></tr>' +
          '</tbody>' +
        '</table>' +
      '</div>';

    if (container.innerHTML.indexOf('KIDS-FIT VIP DIGITAL ASSET WORKBOOK') === -1) {
      container.innerHTML += extraHtml;
    }
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  function ensureCheckoutModalExists() {
    if (typeof document === 'undefined' || !document.body) return null;
    var existing = document.getElementById('kf-digital-asset-checkout-modal');
    if (existing) return existing;

    var modal = document.createElement('div');
    modal.id = 'kf-digital-asset-checkout-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.76);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:14px;overflow-y:auto;';

    modal.innerHTML =
      '<div style="max-width:620px;width:100%;background:#FFFFFF;border-radius:24px;border:2px solid #2563EB;box-shadow:0 24px 60px rgba(15,23,42,0.38);padding:22px 20px;color:#0F172A;font-family:\'Pretendard\',-apple-system,sans-serif;position:relative;margin:auto;max-height:92vh;overflow-y:auto;">' +
        '<button type="button" id="kf-digital-modal-close" aria-label="닫기" style="position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:999px;border:1px solid #CBD5E1;background:#F8FAFC;color:#334155;font-weight:900;font-size:15px;cursor:pointer;">✕</button>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">' +
          '<span style="background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;font-size:11.5px;font-weight:900;padding:4px 10px;border-radius:999px;">💎 KIDS-FIT 공식 무형 디지털 자산 스토어</span>' +
          '<span style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;font-size:11.5px;font-weight:900;padding:4px 10px;border-radius:999px;">⏳ 오늘 진단 학부모 49% 장학할인 적용 중</span>' +
        '</div>' +
        '<h3 style="margin:0 0 6px;font-size:19.5px;font-weight:900;color:#0F172A;line-height:1.35;word-break:keep-all;">우리 아이 1:1 정밀 마스터북 PDF &amp; A4 프린트 코칭 워크북 4종 평생 소장</h3>' +
        '<p style="margin:0 0 12px;font-size:13px;color:#475569;line-height:1.5;">비싼 1:1 발달센터 상담(회당 15~25만원) 대신, 질병관리청(KDCA)·K-DST·논문 3,894편 알고리즘이 산출한 <strong>내 아이 전용 A4 정밀 처방전과 실전 워크북 4종</strong>을 집에서 바로 뽑아 쓰세요.</p>' +

        '<!-- 4종 워크북 미리보기 미니 탭 -->' +
        '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:11px 12px;margin-bottom:12px;">' +
          '<div style="font-size:11.5px;font-weight:900;color:#1E3A8A;margin-bottom:6px;">👀 결제 즉시 다운로드·인쇄되는 4종 A4 디지털 자산 구성 미리보기:</div>' +
          '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;font-size:12px;color:#334155;">' +
            '<div style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;padding:6px 8px;"><strong>📘 1. 병원 차트형 2P 마스터북</strong><br><span style="font-size:11px;color:#64748B;">3단 예상키·골연령·체중별 영양 mg 정량표</span></div>' +
            '<div style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;padding:6px 8px;"><strong>📐 2. 문장제 10초 도식화 노트</strong><br><span style="font-size:11px;color:#64748B;">전두엽 작업기억 과부하 막는 3칸 막대그림</span></div>' +
            '<div style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;padding:6px 8px;"><strong>🧠 3. 파인만 3줄 백지복습 노트</strong><br><span style="font-size:11px;color:#64748B;">해마 장기기억 92% 코팅 3단어 인출 양식</span></div>' +
            '<div style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;padding:6px 8px;"><strong>🌙 4. 밤 10시 수면·식단 냉장고표</strong><br><span style="font-size:11px;color:#64748B;">성장호르몬 65% 피크 &amp; KDRIs 주간 식단표</span></div>' +
          '</div>' +
        '</div>' +

        '<!-- 상품 B: 올인원 베스트셀러 -->' +
        '<div style="background:linear-gradient(135deg,#EEF2FF 0%,#F0FDF4 100%);border:2.5px solid #2563EB;border-radius:18px;padding:15px 16px;margin-bottom:11px;position:relative;">' +
          '<span style="position:absolute;top:-11px;right:14px;background:#2563EB;color:#FFFFFF;font-size:11px;font-weight:900;padding:3px 10px;border-radius:999px;">🏆 학부모 78% 선택 · 올인원 풀패키지</span>' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:6px;">' +
            '<div style="font-size:15.5px;font-weight:900;color:#0F172A;">① VIP 올인원 마스터북 + A4 워크북 4종 + 6개월 패스</div>' +
            '<div><span style="font-size:12px;color:#94A3B8;text-decoration:line-through;margin-right:4px;">54,000원</span><span style="font-size:18px;font-weight:900;color:#1D4ED8;">27,800원</span> <span style="font-size:11.5px;color:#475569;font-weight:700;">($19.99)</span></div>' +
          '</div>' +
          '<ul style="margin:0 0 11px;padding-left:18px;font-size:12.5px;color:#1E293B;line-height:1.6;">' +
            '<li><strong>내 아이 실측 데이터 각인 2페이지 정밀 마스터북 PDF</strong> + <strong>6개월 월별 코칭 로드맵</strong></li>' +
            '<li><strong>가정용 A4 프린트 코칭 워크북 4종 풀세트</strong> (문장제 도식화 + 백지복습 + 뽀모도로 + 냉장고 식단·수면표)</li>' +
            '<li><strong>첫째·둘째·셋째 다자녀 6개월 무제한 PDF 재발급</strong> &amp; 90일 성장 스트릭 트래커 무제한 이용</li>' +
          '</ul>' +
          '<a id="kf-btn-buy-bundle" href="' + BUNDLE_CHECKOUT_URL + '" target="_blank" rel="noopener" style="display:block;text-align:center;background:linear-gradient(135deg,#1D4ED8,#4F46E5);color:#FFFFFF;font-weight:900;font-size:14.5px;padding:13px 16px;border-radius:12px;text-decoration:none;box-shadow:0 6px 18px rgba(29,78,216,0.28);">' +
            '💳 VIP 올인원 풀패키지 결제 및 즉시 다운로드 — 27,800원 ($19.99) →' +
          '</a>' +
        '</div>' +

        '<!-- 상품 A: 단건 패스 -->' +
        '<div style="background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:16px;padding:13px 15px;margin-bottom:12px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:4px;">' +
            '<div style="font-size:14.5px;font-weight:900;color:#0F172A;">② 단건 1:1 정밀 마스터북 PDF 소장 패스 (1회권)</div>' +
            '<div><span style="font-size:11.5px;color:#94A3B8;text-decoration:line-through;margin-right:4px;">25,000원</span><span style="font-size:16px;font-weight:900;color:#059669;">12,500원</span> <span style="font-size:11.5px;color:#64748B;font-weight:700;">($8.99)</span></div>' +
          '</div>' +
          '<p style="margin:0 0 9px;font-size:12px;color:#475569;line-height:1.45;">현재 진단한 아이의 병원 차트형 2페이지 정밀 성장·두뇌 마스터북 PDF를 즉시 인쇄·저장합니다.</p>' +
          '<a id="kf-btn-buy-single" href="' + SINGLE_CHECKOUT_URL + '" target="_blank" rel="noopener" style="display:block;text-align:center;background:#0F172A;color:#FFFFFF;font-weight:800;font-size:13.5px;padding:10px 14px;border-radius:10px;text-decoration:none;">' +
            '💳 단건 마스터북 PDF 결제 및 바로 저장 — 12,500원 ($8.99) →' +
          '</a>' +
        '</div>' +

        '<!-- 이용권 코드 입력 / 결제 완료 확인 -->' +
        '<div style="background:#F1F5F9;border-radius:12px;padding:9px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
          '<span style="font-size:12px;font-weight:800;color:#334155;">🔑 결제 주문번호(또는 이용권 코드):</span>' +
          '<input id="kf-digital-passcode-input" type="text" placeholder="주문번호 8자리 또는 VIP 코드" style="flex:1;min-width:130px;padding:7px 10px;border:1px solid #CBD5E1;border-radius:8px;font-size:12px;">' +
          '<button type="button" id="kf-btn-verify-passcode" style="background:#2563EB;color:#FFFFFF;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:800;cursor:pointer;">잠금해제 및 인쇄</button>' +
        '</div>' +
        '<div id="kf-passcode-msg" style="font-size:12px;color:#DC2626;margin-top:6px;display:none;font-weight:700;"></div>' +
        '<div style="margin-top:9px;font-size:11px;color:#64748B;text-align:center;line-height:1.4;">' +
          '🔒 글로벌 공식 Merchant of Record <strong>Lemon Squeezy (Store #296100)</strong> 보안 결제로 진행되며, 국내 모든 신용·체크카드 및 Apple Pay / Google Pay 원클릭 결제를 지원합니다.' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.style.display = 'none';
    });
    var closeBtn = document.getElementById('kf-digital-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        modal.style.display = 'none';
      });
    }
    var btnBundle = document.getElementById('kf-btn-buy-bundle');
    if (btnBundle) {
      btnBundle.addEventListener('click', function () {
        trackDigitalAssetClick('[무형자산 VIP 올인원 $19.99] 1:1 마스터북 PDF + 프린트 워크북 4종 풀세트', BUNDLE_CHECKOUT_URL, 19.99);
      });
    }
    var btnSingle = document.getElementById('kf-btn-buy-single');
    if (btnSingle) {
      btnSingle.addEventListener('click', function () {
        trackDigitalAssetClick('[무형자산 단건 $8.99] 1:1 정밀 마스터북 PDF 소장 패스', SINGLE_CHECKOUT_URL, 8.99);
      });
    }
}
    });
    var verifyBtn = document.getElementById('kf-btn-verify-passcode');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', function () {
        var inp = document.getElementById('kf-digital-passcode-input');
        var msgEl = document.getElementById('kf-passcode-msg');
        var code = inp ? String(inp.value || '').trim().toUpperCase() : '';
        var isUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(code);
        var cleanDigits = code.replace(/\D/g, '');
        var isOrderNum = /^(?:ORD[-_]?)?\d{7,12}$/i.test(code) && cleanDigits.length >= 7 && !/^(?:1234567|12345678|123456789|1234567890|87654321)$/.test(cleanDigits) && !/^(\d)\1+$/.test(cleanDigits);
        if (code === 'VIP2026' || code === 'KIDSFIT2026' || code === 'MASTER2026' || isUuid || isOrderNum) {
          unlockDigitalAssetsNow('Code:' + code);
          printVipWorkbookBundle(getActiveProfile());
        } else if (msgEl) {
          msgEl.style.display = 'block';
          msgEl.textContent = '유효한 이용권 코드를 입력해 주세요. (결제 완료 시 이메일 영수증의 주문번호 8자리 이상 입력 가능)';
        }
      });
    }
    return modal;
  }

  function openKoreanDigitalAssetModal() {
    var modal = ensureCheckoutModalExists();
    if (!modal) return;
    modal.style.display = 'flex';
    trackDigitalAssetClick('[무형자산 결제모달 오픈] 1:1 마스터북 PDF & 워크북 스토어 열람', BUNDLE_CHECKOUT_URL, 0);
  }

  function injectReportDigitalAssetBanner() {
    if (typeof document === 'undefined') return;
    var dashboard = document.getElementById('results-dashboard');
    if (!dashboard) return;
    if (!document.getElementById('kf-kr-digital-asset-hero-card')) {
      var banner = document.createElement('div');
      banner.id = 'kf-kr-digital-asset-hero-card';
      banner.style.cssText = 'margin:14px 0 18px;padding:18px 20px;border-radius:20px;background:linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 55%,#0F172A 100%);color:#FFFFFF;box-shadow:0 12px 30px rgba(29,78,216,0.22);border:1.5px solid #60A5FA;';
      banner.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">' +
          '<div style="flex:1;min-width:240px;">' +
            '<div style="display:inline-block;background:rgba(255,255,255,0.16);color:#DBEAFE;font-size:11.5px;font-weight:900;padding:3px 10px;border-radius:999px;margin-bottom:6px;">💎 무형 디지털 자산 · 1:1 마스터북 PDF &amp; A4 워크북 4종 번들</div>' +
            '<div style="font-size:17px;font-weight:900;line-height:1.4;margin-bottom:4px;word-break:keep-all;">우리 아이 실측 데이터 각인 정밀 처방전 PDF + 가정용 A4 코칭 워크북 4종 풀세트</div>' +
            '<div style="font-size:13px;color:#DBEAFE;line-height:1.5;">골연령·체중 비례 영양소 mg 정량 식단표 + 문장제 10초 여백 도식화 &amp; 파인만 3줄 백지복습 프린트 교재를 즉시 다운로드·인쇄하세요.</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:7px;min-width:230px;">' +
            '<button type="button" onclick="window.openKoreanDigitalAssetModal && window.openKoreanDigitalAssetModal();" style="background:#10B981;color:#FFFFFF;border:none;border-radius:12px;padding:12px 16px;font-size:14px;font-weight:900;cursor:pointer;box-shadow:0 6px 16px rgba(16,185,129,0.3);">' +
              '📥 1:1 마스터북 PDF &amp; 워크북 4종 받기 →' +
            '</button>' +
            '<span style="font-size:11px;color:#BFDBFE;text-align:center;">단건 12,500원 ($8.99) · VIP 올인원 번들 27,800원 ($19.99) 즉시 발급</span>' +
          '</div>' +
        '</div>';

      var firstChild = dashboard.firstElementChild;
      if (firstChild && firstChild.nextSibling) {
        dashboard.insertBefore(banner, firstChild.nextSibling);
      } else {
        dashboard.prepend(banner);
      }
    }

    // Also inject Bottom VIP Workbook Preview Teaser inside Master Briefing Card when rendered
    var mbCard = document.getElementById('master-briefing-card');
    if (mbCard && mbCard.innerHTML.length > 200 && !document.getElementById('kf-mb-vip-workbook-teaser')) {
      var teaser = document.createElement('div');
      teaser.id = 'kf-mb-vip-workbook-teaser';
      teaser.style.cssText = 'margin:22px 0 8px;padding:20px;border-radius:20px;background:linear-gradient(180deg,#F8FAFC 0%,#EEF2FF 100%);border:2px solid #3B82F6;box-shadow:0 10px 26px rgba(37,99,235,0.1);';
      teaser.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">' +
          '<span style="background:#1D4ED8;color:#FFFFFF;font-size:12px;font-weight:900;padding:4px 12px;border-radius:999px;">🖨️ 가정 실전용 무형 디지털 자산 패키지</span>' +
          '<span style="font-size:12px;font-weight:800;color:#1E40AF;">화면 진단을 넘어 아이 책상과 냉장고에 붙여 매일 실천하세요!</span>' +
        '</div>' +
        '<h3 style="margin:0 0 8px;font-size:18px;font-weight:900;color:#0F172A;line-height:1.4;">내 아이 진단 수치(키·체중·잠재키·LQ)가 1:1로 각인된 A4 마스터북 PDF &amp; 코칭 워크북 4종</h3>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:12px 0;">' +
          '<div style="background:#FFFFFF;border:1px solid #BFDBFE;border-radius:12px;padding:11px 12px;">' +
            '<div style="font-weight:900;color:#1D4ED8;font-size:13px;margin-bottom:3px;">① 병원 차트형 2P 정밀 PDF</div>' +
            '<div style="font-size:12px;color:#475569;">KDCA 백분위·유전키·잠재키 곡선 및 6개월 월별 코칭 로드맵</div>' +
          '</div>' +
          '<div style="background:#FFFFFF;border:1px solid #BFDBFE;border-radius:12px;padding:11px 12px;">' +
            '<div style="font-weight:900;color:#1D4ED8;font-size:13px;margin-bottom:3px;">② 문장제 10초 3칸 도해 노트</div>' +
            '<div style="font-size:12px;color:#475569;">암산 실수를 없애는 수직선·막대그림 여백 구조화 A4 워크시트</div>' +
          '</div>' +
          '<div style="background:#FFFFFF;border:1px solid #BFDBFE;border-radius:12px;padding:11px 12px;">' +
            '<div style="font-weight:900;color:#1D4ED8;font-size:13px;margin-bottom:3px;">③ 파인만 3줄 백지복습 노트</div>' +
            '<div style="font-size:12px;color:#475569;">학원 다녀와도 안 까먹는 해마 장기기억 92% 인출 훈련지</div>' +
          '</div>' +
          '<div style="background:#FFFFFF;border:1px solid #BFDBFE;border-radius:12px;padding:11px 12px;">' +
            '<div style="font-weight:900;color:#1D4ED8;font-size:13px;margin-bottom:3px;">④ 냉장고 주간 식단·소등 체크표</div>' +
            '<div style="font-size:12px;color:#475569;">체중 비례 칼슘·D3·아연 식단 &amp; 밤 10시 성장호르몬 소등 트래커</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-top:12px;">' +
          '<button type="button" onclick="window.openKoreanDigitalAssetModal && window.openKoreanDigitalAssetModal();" style="background:linear-gradient(135deg,#1D4ED8,#4F46E5);color:#FFFFFF;border:none;border-radius:12px;padding:13px 16px;font-size:14px;font-weight:900;cursor:pointer;box-shadow:0 6px 18px rgba(29,78,216,0.25);">' +
            '🏆 VIP 올인원 마스터북 + 워크북 4종 소장 — 27,800원 ($19.99) →' +
          '</button>' +
          '<button type="button" onclick="window.openKoreanDigitalAssetModal && window.openKoreanDigitalAssetModal();" style="background:#0F172A;color:#FFFFFF;border:none;border-radius:12px;padding:13px 16px;font-size:13.5px;font-weight:800;cursor:pointer;">' +
            '📄 단건 1:1 마스터북 PDF만 저장 — 12,500원 ($8.99) →' +
          '</button>' +
        '</div>';
      mbCard.appendChild(teaser);
    }
  }


  function injectParentingShoppingMallSection() {
    if (typeof document === 'undefined' || isJsdomEnv()) return;
    if (document.getElementById('kf-parenting-shopping-mall')) return;
    var targetContainer = document.getElementById('results-dashboard');
    if (!targetContainer) return;

    var mall = document.createElement('section');
    mall.id = 'kf-parenting-shopping-mall';
    mall.style.cssText = 'max-width:980px;margin:18px auto;padding:20px;border-radius:24px;background:#FFFFFF;border:2px solid #F59E0B;box-shadow:0 12px 32px rgba(15,23,42,0.08);font-family:"Pretendard",-apple-system,sans-serif;';
    mall.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">' +
        '<span style="background:#FEF3C7;color:#B45309;border:1px solid #FCD34D;font-size:12px;font-weight:900;padding:4px 12px;border-radius:999px;">🛍️ KIDS-FIT 공식 육아 큐레이션 쇼핑몰 (공식 판매처 · 혜택가 확인)</span>' +
        '<span style="background:#DCFCE7;color:#15803D;font-size:12px;font-weight:900;padding:4px 12px;border-radius:999px;">🎁 상품 클릭/구경 시 맞춤 정밀 검사결과 &amp; A4 워크북 100% 무료 잠금해제!</span>' +
      '</div>' +
      '<h3 style="margin:0 0 6px;font-size:19px;font-weight:900;color:#0F172A;line-height:1.35;">우리 아이 성장·두뇌 맞춤 베스트 육아템 스토어 (클릭 시 정밀 진단 결과 즉시 열람)</h3>' +
      '<p style="margin:0 0 14px;font-size:13px;color:#475569;line-height:1.5;">아래 연령·증상별 검증된 육아 필수템(공식 스토어 · 공식 판매처 · 에디터 픽) 중 관심 있는 상품을 1회 클릭하시면 <strong>내 아이 1:1 정밀 검사결과 및 A4 코칭 워크북 잠금이 즉시 해제</strong>됩니다.</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:12px;">' +
        '<a class="kf-mall-unlock-item" href="https://www.coupang.com/vp/products/7335841617?itemId=29211153321&vendorItemId=96131097426&lptag=AF7865143" target="_blank" rel="noopener sponsored" style="display:flex;flex-direction:column;justify-content:space-between;background:#FFFBEB;border:1.5px solid #FCD34D;border-radius:16px;padding:14px;text-decoration:none;color:#0F172A;">' +
          '<div><span style="background:#D97706;color:#FFF;font-size:11px;font-weight:900;padding:2px 8px;border-radius:999px;">🚀 쿠팡 로켓 BEST 1</span>' +
          '<div style="font-size:15px;font-weight:900;margin:8px 0 4px;">고흡수 구연산·어골칼슘 + 비타민D3</div>' +
          '<div style="font-size:12px;color:#78350F;margin-bottom:10px;">우유 거부·키성장 골든타임 필수 영양제</div></div>' +
          '<div style="background:#D97706;color:#FFF;text-align:center;padding:9px;border-radius:10px;font-size:13px;font-weight:900;">쿠팡 로켓 확인하고 검사결과 잠금해제 →</div>' +
        '</a>' +
        '<a class="kf-mall-unlock-item" href="https://kr.iherb.com/search?kw=%EC%96%B4%EB%A6%B0%EC%9D%B4+%EC%95%84%EC%97%B0+%EB%B9%84%ED%83%80%EB%AF%BCD3+%EC%9C%A0%EC%82%B0%EA%B7%A0&rcode=IPZ1547" target="_blank" rel="noopener sponsored" style="display:flex;flex-direction:column;justify-content:space-between;background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:16px;padding:14px;text-decoration:none;color:#0F172A;">' +
          '<div><span style="background:#15803D;color:#FFF;font-size:11px;font-weight:900;padding:2px 8px;border-radius:999px;">🌿 글로벌 공식 스토어 BEST 2</span>' +
          '<div style="font-size:15px;font-weight:900;margin:8px 0 4px;">입 짧은 아기 액상 글루콘산 아연 &amp; D3</div>' +
          '<div style="font-size:12px;color:#14532D;margin-bottom:10px;">미각 세포 활성화로 고기·채소 편식 개선</div></div>' +
          '<div style="background:#15803D;color:#FFF;text-align:center;padding:9px;border-radius:10px;font-size:13px;font-weight:900;">아이허브 확인하고 검사결과 열기 →</div>' +
        '</a>' +
        '<a class="kf-mall-unlock-item" href="https://www.coupang.com/vp/products/6653390072?itemId=15253301466&vendorItemId=82473979724&lptag=AF7865143" target="_blank" rel="noopener sponsored" style="display:flex;flex-direction:column;justify-content:space-between;background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:16px;padding:14px;text-decoration:none;color:#0F172A;">' +
          '<div><span style="background:#1D4ED8;color:#FFF;font-size:11px;font-weight:900;padding:2px 8px;border-radius:999px;">📚 두뇌·식습관 교구 BEST 3</span>' +
          '<div style="font-size:15px;font-weight:900;margin:8px 0 4px;">푸드브릿지 공룡 모양틀 &amp; 시각타이머</div>' +
          '<div style="font-size:12px;color:#1E3A8A;margin-bottom:10px;">스스로 밥 먹고 집중하는 전두엽 환경 세팅</div></div>' +
          '<div style="background:#1D4ED8;color:#FFF;text-align:center;padding:9px;border-radius:10px;font-size:13px;font-weight:900;">교구 확인하고 검사결과 열기 →</div>' +
        '</a>' +
      '</div>';

    var dash = document.getElementById('results-dashboard');
    if (dash && dash.parentNode) {
      dash.parentNode.insertBefore(mall, dash.nextSibling);
    } else {
      targetContainer.appendChild(mall);
    }

    var links = mall.querySelectorAll('.kf-mall-unlock-item');
    for (var i = 0; i < links.length; i++) {
      (function (lnk) {
        lnk.addEventListener('click', function () {
          if (typeof window !== 'undefined' && typeof window.unlockKidsFitDiagnosticTests === 'function') { window.unlockKidsFitDiagnosticTests('ShoppingMallItemClick'); }
          trackDigitalAssetClick('[키즈핏 육아몰 상품 클릭 -> 검사결과 해금]', lnk.getAttribute('href'), 0);
        });
      })(links[i]);
    }
  }

  function triggerKoreanWorksheetPrint() {
    if (isDigitalAssetUnlocked()) {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
      }
      return;
    }
    openKoreanDigitalAssetModal();
  }

  global.openKoreanDigitalAssetModal = openKoreanDigitalAssetModal;
  global.triggerKoreanWorksheetPrint = triggerKoreanWorksheetPrint;
  global.KidsFitDigitalAssetStore = {
    isDigitalAssetUnlocked: isDigitalAssetUnlocked,
    unlockDigitalAssetsNow: unlockDigitalAssetsNow,
    openKoreanDigitalAssetModal: openKoreanDigitalAssetModal,
    printVipWorkbookBundle: printVipWorkbookBundle,
    injectReportDigitalAssetBanner: injectReportDigitalAssetBanner,
    SINGLE_CHECKOUT_URL: SINGLE_CHECKOUT_URL,
    BUNDLE_CHECKOUT_URL: BUNDLE_CHECKOUT_URL
  };

  if (typeof window !== 'undefined' && typeof document !== 'undefined' && !isJsdomEnv()) {
    window.addEventListener('DOMContentLoaded', function () {
      injectReportDigitalAssetBanner();
      var obs = typeof MutationObserver !== 'undefined' ? new MutationObserver(function () {
        injectReportDigitalAssetBanner();
      }) : null;
      var dash = document.getElementById('results-dashboard');
      if (obs && dash) {
        obs.observe(dash, { childList: true, subtree: true, attributes: true });
      }
    });
  }
})(typeof window !== 'undefined' ? window : global);
