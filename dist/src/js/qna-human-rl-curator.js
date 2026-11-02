/**
 * src/js/qna-human-rl-curator.js
 * High-Conversion Affiliate Spec Comparison & Free Diagnostic Bridge for Q&A & Worksheet Pages (kidsfit.co.kr)
 */
(function () {
  'use strict';

  var CATALOG_SPECS = {
    growth: {
      badge: '📏 신체 성장 · 영양 · 야간 성장통 학술 스펙 비교',
      rlArmId: 'growth_nutrition_repeat_cart',
      rlWeight: '1.65',
      itemAName: '구연산·어골칼슘 + 비타민D3 + 킬레이트 마그네슘',
      itemABad: '일반 탄산칼슘 (위산 필요 · 배앓이/변비 우려)',
      itemAGood: '위산 무관 고흡수 구연산·어골칼슘 + D3·마그네슘 배합 (야간 성장통·숙면 시너지)',
      itemAUrl: 'https://www.coupang.com/vp/products/7335841617?itemId=29211153321&vendorItemId=96131097426&lptag=AF7865143',
      itemBName: '실내 문틀 철봉 (데드행 척추 감압) & 각도조절 원목 독서대',
      itemBBad: '평평한 책상 독서 (경추 하중 18kg · 숨은 키 1.8cm 손실)',
      itemBGood: '15~30도 눈높이 독서대 + 저녁 30초 철봉 매달리기 (숨은 체형 키 +1.8cm 복원)',
      itemBUrl: 'https://www.coupang.com/vp/products/6509587298?itemId=14372048959&vendorItemId=81616407991&lptag=AF7865143'
    },
    learning: {
      badge: '🧠 두뇌 5각 밸런스 · 문장제 수학 · 전두엽 집중력 스펙 비교',
      rlArmId: 'cognitive_learning_problem_solver',
      rlWeight: '1.45',
      itemAName: '무소음 시각 타이머 (Time Timer) & 코넬 백지복습 노트',
      itemABad: '스마트폰 알람 (도파민 유혹) & 눈으로만 다시 읽기 (가짜기억)',
      itemAGood: '남은 시간이 빨간 원으로 보이는 무소음 시각 타이머 + 3줄 파인만 인출 노트',
      itemAUrl: 'https://www.coupang.com/vp/products/8919085482?itemId=26061762855&vendorItemId=93043042639&lptag=AF7865143',
      itemBName: '초등 문장제 도해(막대그림) 수학 & 문해력 워크북',
      itemBBad: '단순 기계적 연산 반복 학습지 (세 줄 문장제 나오면 별표)',
      itemBGood: '조건 동그라미·여백 수직선/막대그림 도식화 훈련 워크북',
      itemBUrl: 'https://www.coupang.com/vp/products/6653390072?itemId=15253301466&vendorItemId=82473979724&lptag=AF7865143'
    }
  };

  var rendered = false;
  function renderHumanCuration() {
    if (rendered) return;
    var slot = document.getElementById('kf-human-curation-slot');
    if (!slot) return;
    rendered = true;

    var cat = slot.getAttribute('data-category') || 'growth';
    var spec = CATALOG_SPECS[cat] || CATALOG_SPECS.growth;

    slot.innerHTML =
      '<section style="margin:24px 0;padding:22px;border-radius:20px;background:#FFFFFF;border:1.5px solid #E0E7FF;box-shadow:0 8px 24px rgba(79,70,229,0.06);">' +
        '<div style="display:inline-block;background:#EEF2FF;color:#4F46E5;font-weight:800;font-size:12.5px;padding:4px 11px;border-radius:999px;margin-bottom:8px;">' +
          spec.badge +
        '</div>' +
        '<h3 style="font-size:18px;font-weight:900;color:#0F172A;margin:0 0 12px 0;line-height:1.4;">' +
          '💡 가정 실천 시 학부모님이 가장 많이 비교하는 권장 교구·영양 스펙' +
        '</h3>' +
        '<div style="overflow-x:auto;margin-bottom:14px;">' +
          '<table style="width:100%;border-collapse:collapse;font-size:13.5px;text-align:left;">' +
            '<thead>' +
              '<tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0;">' +
                '<th style="padding:9px 11px;color:#475569;width:28%;">핵심 품목</th>' +
                '<th style="padding:9px 11px;color:#EF4444;width:34%;">일반 선택 시 주의점</th>' +
                '<th style="padding:9px 11px;color:#059669;width:38%;">학술 논문 권장 스펙</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              '<tr style="border-bottom:1px solid #E2E8F0;">' +
                '<td style="padding:10px 11px;font-weight:800;color:#1E293B;">' + spec.itemAName + '</td>' +
                '<td style="padding:10px 11px;color:#64748B;">' + spec.itemABad + '</td>' +
                '<td style="padding:10px 11px;color:#0F172A;font-weight:700;background:#ECFDF5;">' + spec.itemAGood + '</td>' +
              '</tr>' +
              '<tr>' +
                '<td style="padding:10px 11px;font-weight:800;color:#1E293B;">' + spec.itemBName + '</td>' +
                '<td style="padding:10px 11px;color:#64748B;">' + spec.itemBBad + '</td>' +
                '<td style="padding:10px 11px;color:#0F172A;font-weight:700;background:#ECFDF5;">' + spec.itemBGood + '</td>' +
              '</tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-bottom:8px;">' +
          '<a href="' + spec.itemAUrl + '" data-product-category="' + cat + '" data-rl-arm-id="' + spec.rlArmId + '" data-rl-cta-arm="arm_rocket_review" data-rl-reward-weight="' + spec.rlWeight + '" data-product-name="' + spec.itemAName + '" target="_blank" rel="noopener sponsored" style="display:flex;align-items:center;justify-content:center;padding:12px 14px;border-radius:12px;background:linear-gradient(135deg,#2563EB,#4F46E5);color:#FFFFFF;font-weight:800;font-size:13.5px;text-decoration:none;">' +
            '🚀 [쿠팡 로켓배송] ' + spec.itemAName.slice(0, 18) + ' 실구매 후기·성분표 확인 →' +
          '</a>' +
          '<a href="' + spec.itemBUrl + '" data-product-category="' + cat + '" data-rl-arm-id="' + spec.rlArmId + '" data-rl-cta-arm="arm_rocket_review" data-rl-reward-weight="' + spec.rlWeight + '" data-product-name="' + spec.itemBName + '" target="_blank" rel="noopener sponsored" style="display:flex;align-items:center;justify-content:center;padding:12px 14px;border-radius:12px;background:linear-gradient(135deg,#059669,#10B981);color:#FFFFFF;font-weight:800;font-size:13.5px;text-decoration:none;">' +
            '🚀 [쿠팡 로켓배송] ' + spec.itemBName.slice(0, 18) + ' 스펙·최저가 확인 →' +
          '</a>' +
        '</div>' +
        '<p style="margin:6px 0 0 0;font-size:11.5px;color:#94A3B8;">' +
          '※ 키즈핏 연구소의 추천 링크는 쿠팡 파트너스 활동(AF7865143)의 일환으로 이에 따른 일정액의 수수료를 제공받으나 구매자 가격은 동일합니다.' +
        '</p>' +
      '</section>';

    if (typeof document !== 'undefined' && document.body && !document.getElementById('kf-qna-sticky-bottom-bar')) {
      var sticky = document.createElement('div');
      sticky.id = 'kf-qna-sticky-bottom-bar';
      sticky.className = 'no-print';
      sticky.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9990;background:rgba(15,23,42,0.95);backdrop-filter:blur(8px);border-top:2px solid #3B82F6;padding:10px 14px;box-shadow:0 -8px 24px rgba(15,23,42,0.22);';
      sticky.innerHTML =
        '<div style="max-width:960px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">' +
          '<div style="color:#FFFFFF;font-size:13px;font-weight:800;line-height:1.35;">' +
            '<span style="color:#60A5FA;font-weight:900;">[키즈핏 무료 진단 &amp; 셀렉트샵]</span> 내 아이 1:1 정밀 성장·두뇌 리포트 &amp; A4 코칭 워크북' +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
            '<a href="/qna/free-worksheets.html" style="background:#10B981;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:9px 14px;font-size:13px;font-weight:900;white-space:nowrap;">' +
              '🖨️ 무료 A4 워크북 인쇄 →' +
            '</a>' +
            '<a href="/?mode=' + cat + '" style="background:#2563EB;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:9px 13px;font-size:13px;font-weight:900;white-space:nowrap;">' +
              '⚡ 1분 무료 진단 →' +
            '</a>' +
          '</div>' +
        '</div>';
      document.body.appendChild(sticky);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHumanCuration);
  } else {
    renderHumanCuration();
  }
})();
