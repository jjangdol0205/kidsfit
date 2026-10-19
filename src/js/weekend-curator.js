/**
 * KidsFit Growth Studio - Weekend Outing Curator (src/js/weekend-curator.js)
 * Implements 8 Regions × 5 Themes = 40 complete outing catalog with viewing points,
 * booking tips, route, and pre/post book & activity package linkage.
 */

(function (global) {
  'use strict';

  // 1. Data Loader
  let catalogData = null;
  if (typeof require !== 'undefined') {
    try {
      catalogData = require('../data/curation-catalog.json');
    } catch (e) {
      // fallback
    }
  }
  if (!catalogData && typeof window !== 'undefined' && window.KIDSFIT_CATALOG_DATA) {
    catalogData = window.KIDSFIT_CATALOG_DATA;
  }

  // Theme Key/Code Normalizer
  const THEME_MAP = {
    'art_making': 'art_making',
    'art': 'art_making',
    'history_tradition': 'history_tradition',
    'history': 'history_tradition',
    'dino_nature': 'dino_nature',
    'dino': 'dino_nature',
    'space_science': 'space_science',
    'science': 'space_science',
    'music_musical': 'music_musical',
    'music': 'music_musical'
  };

  // 2. Query Course by Region and Theme
  function getWeekendOuting(region, theme) {
    const normTheme = THEME_MAP[theme] || 'art_making';
    const normRegion = region || '서울 강남·서초·송파';

    if (catalogData && catalogData.courses) {
      const found = catalogData.courses.find(
        (c) => c.region === normRegion && (c.themeKey === normTheme || c.theme === theme || c.themeKey === theme)
      );
      if (found) return found;
    }

    // Default fallback
    return {
      id: 'C01',
      region: normRegion,
      themeKey: normTheme,
      destination: '국립어린이박물관 & 지역 대표 문화공원',
      summary: '아이의 오감 자극과 역사·과학 호기심을 동시에 키우는 맞춤형 원데이 나들이',
      viewPoints: [
        '지역 랜드마크 체험 전시를 통한 시지각 및 공간 감각 확장',
        '상설 체험존에서 즐기는 소근육 참여 활동 및 대근육 야외 산책'
      ],
      bookingTips: '방문 전 공식 홈페이지 사전 예약 여부 확인 권장 (주말 오전 회차 추천)',
      route: '메인 상설전시실 → 특별체험관 → 야외생태공원 산책',
      linkedPackage: {
        title: '원데이 나들이 필수 입체 팝업북 & 탐구 키트',
        reason: '방문 전후 3회독 시 전시 관람 효과와 배경지식 200% 확장',
        price: 16800,
        coupangPath: 'vp/products/weekend-outing-package'
      }
    };
  }

  // 3. Render Outing Report Card
  function renderOutingCard(outing, affiliateConfig = {}) {
    const coupangId = affiliateConfig.coupang || 'AF7865143';
    const pkg = outing.linkedPackage || {
      title: '연계 입체 팝업북 & 워크북',
      reason: '전시 전후 배경지식 확장',
      price: 16800,
      coupangPath: 'vp/products/default-package'
    };
    const coupangUrl = `https://link.coupang.com/a/${pkg.coupangPath.replace(/^vp\/products\//, '')}?subId=${coupangId}`;

    return `
      <div class="outing-course-card" style="background: #FFFFFF; border: 1px solid var(--border-clinic); border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
              <span class="tab-badge tab-badge-coral" style="font-size: 0.8rem; font-weight: 700;">${outing.id} 코스</span>
              <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">${outing.region}</span>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1.35;">
              ${outing.destination}
            </h3>
          </div>
          <span style="background: var(--coral-alert-sub); color: var(--coral-alert); padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.82rem; font-weight: 700;">
            이번 주말 추천
          </span>
        </div>

        <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; margin: 0 0 1.25rem 0; font-weight: 500;">
          ${outing.summary}
        </p>

        <!-- Viewpoints & Tips Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          <!-- Viewpoints -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1rem 1.15rem;">
            <div style="font-weight: 700; color: #1E293B; font-size: 0.9rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>👀</span> 발달 관람 포인트
            </div>
            <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.85rem; color: #475569; line-height: 1.55;">
              ${outing.viewPoints.map((vp) => `<li>${vp}</li>`).join('')}
            </ul>
          </div>

          <!-- Booking Tips & Route -->
          <div style="background: #FFF7ED; border: 1px solid #FFEDD5; border-radius: 16px; padding: 1rem 1.15rem;">
            <div style="font-weight: 700; color: #9A3412; font-size: 0.9rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>🎫</span> 사전 예약 &amp; 추천 동선
            </div>
            <p style="margin: 0 0 0.5rem 0; font-size: 0.84rem; color: #7C2D12; line-height: 1.5;">
              <strong>예약 꿀팁:</strong> ${outing.bookingTips}
            </p>
            <p style="margin: 0; font-size: 0.84rem; color: #7C2D12; line-height: 1.5;">
              <strong>추천 동선:</strong> ${outing.route}
            </p>
          </div>
        </div>

        <!-- Pre/Post Outing Book & Toy Package -->
        <div style="background: var(--primary-indigo-sub); border: 1.5px dashed var(--primary-indigo); border-radius: 18px; padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
            <div style="font-weight: 800; color: var(--primary-indigo); font-size: 0.98rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>📚</span> 전시 전후 활용 연계 도서·교구 패키지
            </div>
            <span style="font-size: 1.05rem; font-weight: 800; color: var(--primary-indigo);">
              ${pkg.price.toLocaleString()}원
            </span>
          </div>

          <p style="font-size: 0.86rem; color: #3730A3; line-height: 1.55; margin: 0 0 0.85rem 0;">
            <strong>${pkg.title}:</strong> ${pkg.reason}
          </p>

          <a href="${coupangUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; width: 100%; text-decoration: none; font-size: 0.9rem; padding: 0.7rem 1rem; box-sizing: border-box;">
            📖 전시 전후 활용 연계 도서 세트 보기 (로켓배송)
          </a>
        </div>
      </div>
    `;
  }

  // 4. Render Full Tab 3 Report
  function renderTab3Report(profile, affiliateConfig = {}) {
    const outing = getWeekendOuting(profile.region, profile.interest);
    return `
      <div>
        ${renderOutingCard(outing, affiliateConfig)}
      </div>
    `;
  }

  // Export
  const WeekendCurator = {
    THEME_MAP,
    getWeekendOuting,
    renderOutingCard,
    renderTab3Report
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeekendCurator;
  } else {
    global.KidsFitWeekendCurator = WeekendCurator;
  }

})(typeof window !== 'undefined' ? window : global);
