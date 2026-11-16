const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const QNA_DIR = path.join(ROOT, 'qna');

// ---------------------------------------------------------------------------
// 1. Update D:\드림컴퍼니\5사업부\index.html
// ---------------------------------------------------------------------------
function updateIndexHtml() {
  const indexPath = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  // 1-A. Add Kakao/Mom-cafe share button in prescription-banner
  if (!html.includes('id="btn-share-kakao-report"')) {
    html = html.replace(
      /(<button type="button" class="prescription-retest-btn" id="btn-print-report-top"[^>]*>보고서 인쇄 \/ PDF 저장<\/button>)/,
      `$1\r\n          <button type="button" class="prescription-retest-btn" id="btn-share-kakao-report" onclick="if(typeof window.shareKidsFitReportSummary === 'function') window.shareKidsFitReportSummary();" style="background: #FEE500; color: #191919; font-weight: 900; border: 1.5px solid #F59E0B;">💬 카톡/단톡방 결과 공유</button>`
    );
  }

  // 1-B. Update applyKidsFitReportLockState & openKidsFitDiagnosisLounge
  const lockBlockRegex = /window\.applyKidsFitReportLockState = function\(\) \{[\s\S]*?window\.openKidsFitDiagnosisLounge = function\(forceOpen, triggerItemName\) \{[\s\S]*?window\.closeKidsFitLoungeLockedModal\(\);/;
  const newLockBlock = `window.shareKidsFitReportSummary = function() {
        try {
          var titleEl = document.getElementById('rx-header-title');
          var titleTxt = (titleEl && titleEl.innerText) ? titleEl.innerText.trim() : '우리 아이 키즈핏(KIDS-FIT) 성장·두뇌 AI 정밀진단 결과';
          var shareUrl = 'https://kidsfit.co.kr/?utm_source=kakao_share&utm_medium=social_viral';
          var shareText = '📊 [' + titleTxt + ']\\n질병관리청(KDCA) 성장도표 백분위 & 성인 예측키 1분 무료 진단 👉 ' + shareUrl;
          if (navigator.share) {
            navigator.share({ title: titleTxt, text: shareText, url: shareUrl }).catch(function(){});
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareText).then(function() {
              alert('✅ 진단 요약과 무료 진단 링크가 복사되었습니다! 카카오톡이나 맘카페·단톡방에 붙여넣기(Ctrl+V) 해보세요.');
            });
          }
        } catch (e) {}
      };

      window.applyKidsFitReportLockState = function() {
        try {
          var isUnlocked = window.isKidsFitDiagnosticUnlocked();
          var mb = document.getElementById('master-briefing-card');
          var lockedView = document.getElementById('kf-unlock-gate-locked-view');
          var unlockedView = document.getElementById('kf-unlock-gate-unlocked-view');
          var shopBanner = document.getElementById('kf-shop-unlocked-banner');
          var statusPill = document.getElementById('kf-bottom-lounge-status-pill');
          var headerIcon = document.getElementById('btn-header-lounge-icon');
          var deepChapters = document.querySelectorAll('#pillar-2-container, #pillar-3-container, #pillar-4-container, #pillar-5-container');
          if (isUnlocked) {
            if (lockedView) lockedView.style.display = 'none';
            if (unlockedView) unlockedView.style.display = 'flex';
            if (shopBanner) shopBanner.style.display = 'flex';
            if (statusPill) statusPill.textContent = '🔓 4대 진단 무료 오픈 완료';
            if (headerIcon) headerIcon.textContent = '🔓';
            if (mb) {
              mb.style.filter = 'none';
              mb.style.maxHeight = 'none';
              mb.style.overflow = 'visible';
            }
            for (var i = 0; i < deepChapters.length; i++) {
              deepChapters[i].style.filter = 'none';
              deepChapters[i].style.pointerEvents = 'auto';
              deepChapters[i].style.userSelect = 'auto';
            }
          } else {
            if (lockedView) lockedView.style.display = 'block';
            if (unlockedView) unlockedView.style.display = 'none';
            if (mb) {
              mb.style.filter = 'none';
              mb.style.maxHeight = 'none';
              mb.style.overflow = 'visible';
            }
            var p1 = document.getElementById('pillar-1-container');
            if (p1) {
              p1.style.filter = 'none';
            }
            for (var j = 0; j < deepChapters.length; j++) {
              deepChapters[j].style.filter = 'blur(5px)';
              deepChapters[j].style.pointerEvents = 'none';
              deepChapters[j].style.userSelect = 'none';
              deepChapters[j].style.transition = 'filter 0.35s ease';
            }
          }
        } catch (e) {}
      };

      window.closeKidsFitLoungeLockedModal = function() {
        try {
          var modal = document.getElementById('kf-lounge-locked-modal');
          if (modal) modal.style.display = 'none';
        } catch (e) {}
      };

      window.openKidsFitDiagnosisLounge = function(forceOpen, triggerItemName) {
        try {
          if (typeof window.loadKidsFitAcademicDataBundle === 'function') {
            window.loadKidsFitAcademicDataBundle();
          }
          window.closeKidsFitLoungeLockedModal();`;

  if (lockBlockRegex.test(html)) {
    html = html.replace(lockBlockRegex, newLockBlock);
  }

  // 1-C. Inject 1-click direct buy button on every .kf-product-card & scroll to spotlight on ?ep=
  if (!html.includes('kf-direct-buy-btn')) {
    html = html.replace(
      /var cards = document\.querySelectorAll\('#kf-shop-grid \.kf-product-card'\);\s*for \(var k = 0; k < cards\.length; k\+\+\) \{\s*var card = cards\[k\];\s*var pid = card\.getAttribute\('data-product-id'\);/,
      `var catalogMap = {};
            if (Array.isArray(window.KIDSFIT_PRODUCT_CATALOG)) {
              for (var c = 0; c < window.KIDSFIT_PRODUCT_CATALOG.length; c++) {
                var cp = window.KIDSFIT_PRODUCT_CATALOG[c];
                if (cp && cp.id) catalogMap[cp.id] = cp;
              }
            }
            var cards = document.querySelectorAll('#kf-shop-grid .kf-product-card');
            for (var k = 0; k < cards.length; k++) {
              var card = cards[k];
              var pid = card.getAttribute('data-product-id');
              var prodInfo = catalogMap[pid];
              if (prodInfo && prodInfo.url && !card.querySelector('.kf-direct-buy-btn')) {
                var directBtn = document.createElement('a');
                directBtn.className = 'kf-direct-buy-btn';
                directBtn.href = prodInfo.url;
                directBtn.target = '_blank';
                directBtn.rel = 'noopener noreferrer sponsored';
                directBtn.setAttribute('data-product-id', prodInfo.id);
                directBtn.setAttribute('data-product-name', prodInfo.name);
                directBtn.setAttribute('data-shop-category', prodInfo.category || 'growth');
                directBtn.setAttribute('data-shop-stage', prodInfo.stage || 'all');
                directBtn.setAttribute('data-shop-platform', prodInfo.platform || 'coupang');
                var pLabel = prodInfo.platform === 'iherb' ? '🌿 iHerb 혜택가 확인 바로가기 (+진단 잠금해제)' : (prodInfo.platform === 'cpa' ? '📚 예스24 혜택가 확인 바로가기 (+진단 잠금해제)' : '🚀 쿠팡 혜택가 확인 바로가기 (+진단 잠금해제)');
                directBtn.style.cssText = 'display:block;margin-top:0.45rem;background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);color:#FFE600;text-align:center;padding:0.58rem 0.7rem;border-radius:10px;font-size:0.78rem;font-weight:900;text-decoration:none;border:1px solid #334155;';
                directBtn.textContent = pLabel;
                directBtn.addEventListener('click', function(ev) {
                  ev.stopPropagation();
                });
                card.appendChild(directBtn);
              }`
    );
  }

  html = html.replace(
    /var hub = document\.getElementById\('kf-shorts-showcase-hub'\);/,
    `var hub = document.getElementById('kf-shorts-active-spotlight') || document.getElementById('kf-shop-grid') || document.getElementById('kf-shorts-showcase-hub');`
  );

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✅ Updated D:\\드림컴퍼니\\5사업부\\index.html');
}

// ---------------------------------------------------------------------------
// 2. Fix /qna/*.html noindex, missing script, and generate 24 KDCA calculators
// ---------------------------------------------------------------------------
const KDCA_TABLE = {
  boy: {
    5:  { mo: 60, midMo: 66, midP50: 112.8, girlP50: 108.4, p3: 101.6, p25: 106.7, p50: 109.6, p75: 112.6, p97: 118.0, grade: '유치원', gain: '6.2cm/년' },
    6:  { mo: 72, midMo: 78, midP50: 119.0, girlP50: 114.7, p3: 107.2, p25: 112.8, p50: 115.9, p75: 119.1, p97: 124.7, grade: '유치원 졸업반', gain: '6.0cm/년' },
    7:  { mo: 84, midMo: 90, midP50: 125.0, girlP50: 120.8, p3: 112.5, p25: 118.8, p50: 122.1, p75: 125.4, p97: 131.2, grade: '초등 1학년', gain: '5.8cm/년' },
    8:  { mo: 96, midMo: 102, midP50: 130.7, girlP50: 126.7, p3: 117.7, p25: 124.3, p50: 127.9, p75: 131.5, p97: 137.4, grade: '초등 2학년', gain: '5.6cm/년' },
    9:  { mo: 108, midMo: 114, midP50: 136.1, girlP50: 132.6, p3: 122.8, p25: 129.5, p50: 133.4, p75: 137.3, p97: 143.6, grade: '초등 3학년', gain: '5.5cm/년' },
    10: { mo: 120, midMo: 126, midP50: 141.7, girlP50: 139.1, p3: 128.4, p25: 134.8, p50: 138.8, p75: 143.0, p97: 150.2, grade: '초등 4학년', gain: '5.5cm/년' },
    11: { mo: 132, midMo: 138, midP50: 148.1, girlP50: 145.8, p3: 130.6, p25: 139.8, p50: 144.7, p75: 150.0, p97: 160.2, grade: '초등 5학년', gain: '6.4cm/년' },
    12: { mo: 144, midMo: 150, midP50: 155.0, girlP50: 151.7, p3: 135.1, p25: 145.6, p50: 151.4, p75: 157.3, p97: 167.9, grade: '초등 6학년', gain: '7.2cm/년 (급성장기)' },
    13: { mo: 156, midMo: 162, midP50: 161.8, girlP50: 155.9, p3: 140.5, p25: 152.3, p50: 158.6, p75: 164.6, p97: 174.9, grade: '중학 1학년', gain: '7.5cm/년 (급성장기)' },
    14: { mo: 168, midMo: 174, midP50: 167.1, girlP50: 158.3, p3: 145.1, p25: 159.1, p50: 165.0, p75: 170.6, p97: 180.2, grade: '중학 2학년', gain: '5.8cm/년' },
    15: { mo: 180, midMo: 186, midP50: 170.3, girlP50: 159.5, p3: 148.2, p25: 163.9, p50: 169.2, p75: 174.3, p97: 183.5, grade: '중학 3학년', gain: '3.6cm/년' },
    16: { mo: 192, midMo: 198, midP50: 172.0, girlP50: 160.0, p3: 150.0, p25: 166.7, p50: 171.4, p75: 176.2, p97: 185.1, grade: '고등 1학년', gain: '1.8cm/년' }
  },
  girl: {
    5:  { mo: 60, midMo: 66, midP50: 111.6, boyP50: 109.6, p3: 99.9, p25: 105.3, p50: 108.4, p75: 111.5, p97: 117.0, grade: '유치원', gain: '6.1cm/년' },
    6:  { mo: 72, midMo: 78, midP50: 117.8, boyP50: 115.9, p3: 106.6, p25: 111.8, p50: 114.7, p75: 117.8, p97: 123.3, grade: '유치원 졸업반', gain: '5.9cm/년' },
    7:  { mo: 84, midMo: 90, midP50: 123.8, boyP50: 122.1, p3: 112.2, p25: 117.8, p50: 120.8, p75: 124.0, p97: 130.2, grade: '초등 1학년', gain: '5.8cm/년' },
    8:  { mo: 96, midMo: 102, midP50: 129.7, boyP50: 127.9, p3: 117.5, p25: 123.5, p50: 126.7, p75: 130.2, p97: 137.1, grade: '초등 2학년', gain: '5.9cm/년' },
    9:  { mo: 108, midMo: 114, midP50: 135.9, boyP50: 133.4, p3: 122.8, p25: 129.2, p50: 132.6, p75: 136.5, p97: 144.1, grade: '초등 3학년', gain: '6.3cm/년' },
    10: { mo: 120, midMo: 126, midP50: 142.5, boyP50: 138.8, p3: 128.2, p25: 135.2, p50: 139.1, p75: 143.5, p97: 151.2, grade: '초등 4학년', gain: '6.7cm/년 (급성장기)' },
    11: { mo: 132, midMo: 138, midP50: 148.8, boyP50: 144.7, p3: 133.8, p25: 141.5, p50: 145.8, p75: 150.3, p97: 157.6, grade: '초등 5학년', gain: '6.5cm/년 (급성장기)' },
    12: { mo: 144, midMo: 150, midP50: 153.8, boyP50: 151.4, p3: 139.5, p25: 147.3, p50: 151.7, p75: 156.1, p97: 162.6, grade: '초등 6학년', gain: '4.8cm/년' },
    13: { mo: 156, midMo: 162, midP50: 157.1, boyP50: 158.6, p3: 144.7, p25: 151.9, p50: 155.9, p75: 160.0, p97: 166.0, grade: '중학 1학년', gain: '3.0cm/년' },
    14: { mo: 168, midMo: 174, midP50: 158.9, boyP50: 165.0, p3: 147.9, p25: 154.5, p50: 158.3, p75: 162.2, p97: 168.1, grade: '중학 2학년', gain: '1.6cm/년' },
    15: { mo: 180, midMo: 186, midP50: 159.8, boyP50: 169.2, p3: 149.3, p25: 155.7, p50: 159.5, p75: 163.3, p97: 169.2, grade: '중학 3학년', gain: '0.9cm/년' },
    16: { mo: 192, midMo: 198, midP50: 160.1, boyP50: 171.4, p3: 150.3, p25: 156.3, p50: 160.0, p75: 163.8, p97: 169.8, grade: '고등 1학년', gain: '0.5cm/년' }
  }
};

function generateKdcaCalculators() {
  for (const gender of ['boy', 'girl']) {
    const gLabel = gender === 'boy' ? '남아' : '여아';
    for (let age = 5; age <= 16; age++) {
      const row = KDCA_TABLE[gender][age];
      const slug = `kr-calc-${age}yo-${gender}-height.html`;
      const url = `https://kidsfit.co.kr/qna/${slug}`;
      const title = `만 ${age}세 ${gLabel}(${row.grade}) 평균키 ${row.p50}cm & 질병관리청(KDCA) 백분위 계산기 | 키즈핏`;
      const desc = `질병관리청(KDCA 2017) 공식 성장도표 기준 만 ${age}세 ${gLabel}(${row.grade}) 평균키(50백분위)는 ${row.p50}cm, 상위 25%(75백분위)는 ${row.p75}cm입니다. 우리 아이 정확한 백분위와 유전 성인 예측키를 1분 만에 무료로 진단하세요.`;

      const faqJson = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `만 ${age}세 ${gLabel}(${row.grade}) 평균키는 몇 cm인가요?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `질병관리청(KDCA) 소아청소년 성장도표 기준 만 ${age}세 ${gLabel}의 평균키(50백분위수)는 ${row.p50}cm이며, 상위 25%(75백분위)는 ${row.p75}cm, 하위 25%(25백분위)는 ${row.p25}cm입니다.`
            }
          },
          {
            "@type": "Question",
            "name": `만 ${age}세 ${gLabel}는 1년에 몇 cm 자라야 정상인가요?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `만 ${age}세 ${gLabel}의 표준 연간 성장속도는 약 ${row.gain}입니다. 연간 4.5cm 미만으로 자라거나 또래 대비 2차 성징이 빠르면 골연령 및 성장판 정밀 점검이 권장됩니다.`
            }
          }
        ]
      });

      const pageHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="키즈핏 코리아 (KIDS-FIT)">
  <script type="application/ld+json">${faqJson}</script>
  <style>
    body { margin: 0; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8FAFC; color: #0F172A; line-height: 1.65; }
    .wrap { max-width: 820px; margin: 0 auto; padding: 28px 18px 60px; }
    .card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; padding: 24px; box-shadow: 0 8px 26px rgba(15,23,42,0.05); margin-bottom: 20px; }
    .badge { display: inline-block; background: #EFF6FF; color: #1D4ED8; font-weight: 800; font-size: 0.78rem; padding: 4px 12px; border-radius: 999px; border: 1px solid #BFDBFE; margin-bottom: 10px; }
    h1 { font-size: 1.5rem; line-height: 1.35; margin: 0 0 12px; color: #0F172A; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.92rem; }
    th, td { border: 1px solid #CBD5E1; padding: 10px 12px; text-align: center; }
    th { background: #EFF6FF; color: #1E3A8A; font-weight: 800; }
    .highlight { background: #FEF9C3; font-weight: 900; color: #0F172A; }
    .cta-btn { display: block; text-align: center; background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%); color: #FFFFFF; text-decoration: none; font-weight: 900; font-size: 1.02rem; padding: 16px 20px; border-radius: 14px; margin-top: 16px; box-shadow: 0 8px 20px rgba(29,78,216,0.25); }
    .aff-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-top: 16px; }
    .aff-btn { display: block; text-decoration: none; background: #0F172A; color: #FFE600; padding: 13px 16px; border-radius: 12px; font-weight: 800; font-size: 0.88rem; text-align: center; }
  </style>
</head>
<body>
  <div class="wrap">
    <div style="margin-bottom: 14px; font-size: 0.85rem;">
      <a href="/" style="color: #1D4ED8; font-weight: 800; text-decoration: none;">← 키즈핏(KIDS-FIT) 홈으로</a> ·
      <a href="/qna/index.html" style="color: #475569; text-decoration: none;">임상 칼럼 &amp; 연령별 평균키 총람</a>
    </div>
    <article class="card">
      <span class="badge">📊 질병관리청(KDCA 2017) 공식 성장도표 기준</span>
      <h1>만 ${age}세 ${gLabel}(${row.grade}) 평균키 ${row.p50}cm &amp; 상위 백분위 기준표</h1>
      <p style="color: #334155; font-size: 0.95rem;">
        질병관리청(KDCA) 소아청소년 성장도표에 따른 <strong>만 ${age}세 ${gLabel}(${row.grade})</strong>의 표준 신장 백분위 분포와 연간 기대 성장속도(<strong>${row.gain}</strong>) 데이터입니다.
      </p>
      <table>
        <thead>
          <tr>
            <th>하위 3% (P3·저신장 주의)</th>
            <th>하위 25% (P25)</th>
            <th>평균키 50% (P50·표준)</th>
            <th>상위 25% (P75)</th>
            <th>상위 3% (P97)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${row.p3} cm</td>
            <td>${row.p25} cm</td>
            <td class="highlight">${row.p50} cm</td>
            <td>${row.p75} cm</td>
            <td>${row.p97} cm</td>
          </tr>
        </tbody>
      </table>
      <a class="cta-btn" href="/?age=${age}&gender=${gender}&mode=growth&autostart=1">
        📏 만 ${age}세 ${gLabel} 일수 보정 백분위 &amp; 성인 예측키 1분 무료 진단 시작하기 →
      </a>
      <div class="aff-grid">
        <a class="aff-btn" href="https://www.coupang.com/vp/products/7335841617?itemId=29211153321&vendorItemId=96131097426&lptag=AF7865143" target="_blank" rel="noopener noreferrer sponsored">
          🚀 [쿠팡 로켓] 급성장기 칼슘·마그네슘·비타민D·K2 공식 혜택가 확인 →
        </a>
        <a class="aff-btn" href="https://kr.iherb.com/pr/nordic-naturals-daily-omega-kids-natural-fruit-flavor-500-mg-30-soft-gels/4181?rcode=IPZ1547" target="_blank" rel="noopener noreferrer sponsored" style="background:#14532D;color:#FFFFFF;">
          🌿 [iHerb 직구] 두뇌·성장 필수 고순도 키즈 오메가3 &amp; D3 확인 →
        </a>
      </div>
      <!-- KFTC Affiliate Regulatory Disclosure Banner -->
      <div class="aff-disclosure" style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:10px 14px;margin-top:14px;font-size:0.78rem;color:#475569;line-height:1.45;">
        <strong style="color:#0F172A;display:block;margin-bottom:2px;">📢 공정거래위원회 심사지침 준수 안내</strong>
        본 페이지의 추천 상품 링크는 <strong>쿠팡 파트너스, YES24, iHerb</strong> 제휴 마케팅 활동의 일환으로 일정액의 수수료를 제공받을 수 있으며, 구매자에게 발생하는 추가 비용은 전혀 없습니다.
      </div>
    </article>

    <section class="card">
      <h2 style="font-size: 1.15rem; margin-top: 0;">🩺 만 ${age}세 ${gLabel} 학부모 필수 체크리스트 (자주 묻는 질문)</h2>
      <p><strong>Q1. 만 ${age}세 ${gLabel} 평균키(${row.p50}cm)보다 작으면 무조건 성장호르몬 주사를 맞아야 하나요?</strong><br>
      아닙니다. 생일 월령(일수) 보정 Z-Score와 부모 유전 표적키(MPH), 그리고 밤 10시~새벽 2시 서파수면(SWS) 및 칼슘·아연·비타민D3·K2 생체이용률을 먼저 교정하면 후천적 숨은 키(+4.5~7.2cm) 잠재력을 충분히 끌어올릴 수 있습니다.</p>
      <p><strong>Q2. 만 ${age}세 ${gLabel}의 정상 연간 성장속도는 얼마인가요?</strong><br>
      이 시기 표준 성장속도는 <strong>${row.gain}</strong>입니다. 만약 최근 1년간 키가 4.5cm 미만으로 자랐거나 체중만 급격히 늘어 골연령 가속(성조숙증)이 의심된다면 위 무료 정밀 진단을 통해 골연령 진행 위험도를 즉시 확인해 보세요.</p>
    </section>
  </div>
  <script src="/src/js/korean-digital-asset-monetization.js" defer></script>
</body>
</html>`;

      fs.writeFileSync(path.join(QNA_DIR, slug), pageHtml, 'utf8');
    }
  }
  console.log('✅ Generated 24 Korean KDCA Age×Gender Calculator pages in /qna/');
}

function fixAllQnaFilesAndSyncIndexSitemapRss() {
  generateKdcaCalculators();

  const files = fs.readdirSync(QNA_DIR).filter(f => f.endsWith('.html'));
  let fixedNoindex = 0;
  let injectedScript = 0;

  const calcLinks = [];
  const postSeqLinks = [];

  for (const file of files) {
    const fPath = path.join(QNA_DIR, file);
    let content = fs.readFileSync(fPath, 'utf8');
    let modified = false;

    if (content.includes('noindex')) {
      content = content.replace(/<meta\s+name="robots"\s+content="noindex,\s*follow"\s*\/?>/gi, '<meta name="robots" content="index, follow">');
      fixedNoindex++;
      modified = true;
    }

    if (!content.includes('korean-digital-asset-monetization.js')) {
      content = content.replace(/<\/body>/i, '  <script src="/src/js/korean-digital-asset-monetization.js" defer></script>\n</body>');
      injectedScript++;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fPath, content, 'utf8');
    }

    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    const cleanTitle = titleMatch ? titleMatch[1].replace(/\s*\|.*$/, '').trim() : file;

    if (file.startsWith('kr-calc-')) {
      calcLinks.push({ file, title: cleanTitle });
    } else if (file.startsWith('post-seq-') || file === 'monthly-curation.html') {
      postSeqLinks.push({ file, title: cleanTitle });
    }
  }

  // Update qna/index.html to include links to all kr-calc-* and post-seq-* pages
  const qnaIndexPath = path.join(QNA_DIR, 'index.html');
  let qnaIndexHtml = fs.readFileSync(qnaIndexPath, 'utf8');
  const directorySection = `
    <!-- AUTO_SYNCED_KDCA_CALCULATORS_AND_POST_SEQ -->
    <section style="max-width: 980px; margin: 2rem auto; padding: 1.5rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px;">
      <h2 style="font-size: 1.15rem; font-weight: 900; color: #0F172A; margin: 0 0 0.85rem;">📏 질병관리청(KDCA 2017) 만 5세~16세 남아·여아 연령별 평균키 &amp; 백분위 계산기 (24선)</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.55rem; font-size: 0.84rem; margin-bottom: 1.5rem;">
        ${calcLinks.map(c => `<a href="/qna/${c.file}" style="color:#1D4ED8;text-decoration:none;padding:0.45rem 0.65rem;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;font-weight:700;">• ${c.title}</a>`).join('\n        ')}
      </div>
      <h2 style="font-size: 1.15rem; font-weight: 900; color: #0F172A; margin: 0 0 0.85rem;">📚 소아 성장·수면·영양·두뇌발달 심층 임상 아카이브 (33선)</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.55rem; font-size: 0.83rem;">
        ${postSeqLinks.map(p => `<a href="/qna/${p.file}" style="color:#334155;text-decoration:none;padding:0.45rem 0.65rem;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;">• ${p.title}</a>`).join('\n        ')}
      </div>
    </section>
`;

  if (qnaIndexHtml.includes('<!-- AUTO_SYNCED_KDCA_CALCULATORS_AND_POST_SEQ -->')) {
    qnaIndexHtml = qnaIndexHtml.replace(/<!-- AUTO_SYNCED_KDCA_CALCULATORS_AND_POST_SEQ -->[\s\S]*?<\/section>/, directorySection.trim());
  } else {
    qnaIndexHtml = qnaIndexHtml.replace(/<\/body>/i, `${directorySection}\n</body>`);
  }
  fs.writeFileSync(qnaIndexPath, qnaIndexHtml, 'utf8');

  // Rebuild sitemap.xml and rss.xml with all clean static URLs
  const today = new Date().toISOString().slice(0, 10);
  const rootPages = [
    { loc: 'https://kidsfit.co.kr/', priority: '1.0', changefreq: 'daily' },
    { loc: 'https://kidsfit.co.kr/about.html', priority: '0.7', changefreq: 'monthly' },
    { loc: 'https://kidsfit.co.kr/contact.html', priority: '0.6', changefreq: 'monthly' },
    { loc: 'https://kidsfit.co.kr/privacy.html', priority: '0.5', changefreq: 'monthly' },
    { loc: 'https://kidsfit.co.kr/terms.html', priority: '0.5', changefreq: 'monthly' },
    { loc: 'https://kidsfit.co.kr/qna/index.html', priority: '0.9', changefreq: 'daily' }
  ];

  const qnaPagesSorted = files
    .filter(f => f !== 'index.html')
    .sort()
    .map(f => ({
      loc: `https://kidsfit.co.kr/qna/${f}`,
      priority: f.startsWith('kr-calc-') || f.startsWith('topic-') ? '0.85' : '0.8',
      changefreq: 'weekly',
      file: f
    }));

  const allUrls = [...rootPages, ...qnaPagesSorted];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXml, 'utf8');

  // Build rss.xml with latest 40 items
  const rssItems = qnaPagesSorted.slice(0, 45).map(u => {
    const fContent = fs.readFileSync(path.join(QNA_DIR, u.file), 'utf8');
    const tMatch = fContent.match(/<title>([^<]+)<\/title>/i);
    const dMatch = fContent.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const itemTitle = (tMatch ? tMatch[1] : u.file).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const itemDesc = (dMatch ? dMatch[1] : itemTitle).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `    <item>
      <title>${itemTitle}</title>
      <link>${u.loc}</link>
      <guid>${u.loc}</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>${itemDesc}</description>
    </item>`;
  }).join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>키즈핏 코리아 (KIDS-FIT) 소아 성장·두뇌발달 임상 연구소</title>
    <link>https://kidsfit.co.kr/</link>
    <description>질병관리청(KDCA 2017) 성장도표 &amp; K-DST 발달지표 기반 소아 성장·성조숙증·두뇌영양 정밀 진단 및 큐레이션</description>
    <language>ko</language>
${rssItems}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(ROOT, 'rss.xml'), rssXml, 'utf8');

  console.log(`✅ Fixed noindex on ${fixedNoindex} files, injected script on ${injectedScript} files, and synced ${allUrls.length} URLs into sitemap.xml & rss.xml`);
}

// ---------------------------------------------------------------------------
// 3. Upgrade D:\드림컴퍼니\5사업부\scripts\send_daily_6am_shorts_telegram.js
// ---------------------------------------------------------------------------
function updateDailyShortsTelegramScript() {
  const scriptPath = path.join(ROOT, 'scripts', 'send_daily_6am_shorts_telegram.js');
  let code = fs.readFileSync(scriptPath, 'utf8');

  // Fix infinite episode cycling instead of exiting at targetEp > 10
  code = code.replace(
    /const targetEp = \(argEp >= 1 && argEp <= 10\) \? argEp : state\.next_ep;\s*if \(targetEp > 10\) \{\s*console\.log\('All 10 episodes have already been sent in the daily queue!'\);\s*process\.exit\(0\);\s*\}/,
    `const rawNextEp = Number(state.next_ep) || 1;
  const cycledEp = ((rawNextEp - 1) % 10) + 1;
  const targetEp = (argEp >= 1 && argEp <= 10) ? argEp : cycledEp;`
  );

  // Upgrade state.next_ep wrap-around & add [5/6] Threads + [6/6] Naver Clip/Blog copy blocks
  if (!code.includes('[5/6] 스레드(Threads)')) {
    code = code.replace(
      /const msgReels =[\s\S]*?await sendHtmlMessage\(msgReels\);/,
      `const msgReels =
    \`🟣 <b>[4/6] 인스타그램 릴스 전체 본문 (@kids_fit1)</b> — 아래 박스 터치 시 바로 복사\\n\` +
    \`<pre>\${escapeHtml(item.reelsFull + '\\n\\n💬 댓글에 [키성장] 또는 [통잠]이라고 남겨주시면 1초 만에 DM으로 무료 진단 & 혜택가 확인 바로가기 링크를 보내드려요!')}</pre>\`;
  await sendHtmlMessage(msgReels);

  // 4-2. 스레드(Threads) 3줄 팩트폭격 복붙용
  const threadsCopy =
    \`🚨 \${item.label}\\n\` +
    \`질병관리청(KDCA) 성장도표 기준 우리 아이 키·두뇌 백분위 1분 무료 진단하고 오늘 영상 속 에디터 엄선 육아템 공식 혜택가까지 한 번에 확인하세요 👇\\n\` +
    \`👉 https://kidsfit.co.kr/?ep=\${item.ep}&utm_source=threads&utm_medium=social\`;
  const msgThreads =
    \`🧵 <b>[5/6] 스레드(Threads) 3줄 팩트폭격 본문</b> — 아래 박스 터치 시 바로 복사\\n\` +
    \`<pre>\${escapeHtml(threadsCopy)}</pre>\`;
  await sendHtmlMessage(msgThreads);

  // 4-3. 네이버 클립(Clip) & 네이버 블로그/맘카페 요약 복붙용
  const naverCopy =
    \`[키즈핏 소아성장 연구소 \${item.ep}편] \${item.ytTitle}\\n\\n\` +
    \`✅ 질병관리청(KDCA 2017) 백분위 & 유전 성인 예측키 1분 무료 진단\\n\` +
    \`✅ 영상 속 추천 육아템 실시간 공식 혜택가 확인 바로가기:\\n\` +
    \`https://kidsfit.co.kr/?ep=\${item.ep}&utm_source=naver_clip&utm_medium=organic\`;
  const msgNaver =
    \`🟢 <b>[6/6] 네이버 클립(Clip) &amp; 블로그·맘카페 요약</b> — 아래 박스 터치 시 바로 복사\\n\` +
    \`<pre>\${escapeHtml(naverCopy)}</pre>\`;
  await sendHtmlMessage(msgNaver);`
    );

    code = code.replace(
      /if \(!argEp\) \{\s*state\.next_ep = item\.ep \+ 1;\s*\}/,
      `if (!argEp) {
    state.next_ep = (item.ep % 10) + 1;
  }`
    );
  }

  fs.writeFileSync(scriptPath, code, 'utf8');
  console.log('✅ Updated D:\\드림컴퍼니\\5사업부\\scripts\\send_daily_6am_shorts_telegram.js');
}

updateIndexHtml();
fixAllQnaFilesAndSyncIndexSitemapRss();
updateDailyShortsTelegramScript();
