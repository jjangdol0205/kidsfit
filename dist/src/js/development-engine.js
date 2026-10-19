/**
 * KidsFit Growth Studio - Development Engine (src/js/development-engine.js)
 * Implements K-DST 6-axis SVG balance radar, age-based education method evaluation
 * (Montessori vs Froebel/Gabe vs Waldorf vs Creative Science), and TOP 4 hot items curation.
 */

(function (global) {
  'use strict';

  // 1. Data Loader
  let rubricsData = null;
  if (typeof require !== 'undefined') {
    try {
      rubricsData = require('../data/kdst-rubrics.json');
    } catch (e) {
      // fallback
    }
  }
  if (!rubricsData && typeof window !== 'undefined' && window.KIDSFIT_KDST_DATA) {
    rubricsData = window.KIDSFIT_KDST_DATA;
  }

  // 2. K-DST 6-Axis Radar & SVG Points Calculator
  function evaluateKdstBalance(ageMonths, selectedConcerns = []) {
    const scores = {
      fineMotor: 90,
      cognitive: 90,
      language: 90,
      social: 90,
      daily: 90,
      grossMotor: 90
    };

    if (selectedConcerns.includes('fine_motor')) {
      scores.fineMotor = 62;
      scores.cognitive = 78;
    }
    if (selectedConcerns.includes('gross_motor')) {
      scores.grossMotor = 60;
      scores.daily = 79;
    }
    if (selectedConcerns.includes('language_reading')) {
      scores.language = 63;
      scores.cognitive = 80;
    }
    if (selectedConcerns.includes('math_space')) {
      scores.cognitive = 64;
      scores.fineMotor = 77;
    }
    if (selectedConcerns.includes('emotion_art')) {
      scores.social = 65;
      scores.fineMotor = 75;
    }

    // SVG Geometry: cx=150, cy=150, R=100
    // 6 axes: FineMotor (-90°), Cognitive (-30°), Language (+30°), Social (+90°), Daily (+150°), GrossMotor (+210°)
    const angles = [-Math.PI / 2, -Math.PI / 6, Math.PI / 6, Math.PI / 2, (5 * Math.PI) / 6, (7 * Math.PI) / 6];
    const scoreKeys = ['fineMotor', 'cognitive', 'language', 'social', 'daily', 'grossMotor'];
    const points = angles.map((theta, idx) => {
      const sc = scores[scoreKeys[idx]];
      const r = (sc / 100) * 100;
      const x = Math.round((150 + r * Math.cos(theta)) * 10) / 10;
      const y = Math.round((150 + r * Math.sin(theta)) * 10) / 10;
      return `${x},${y}`;
    }).join(' ');

    return { radarScores: scores, polygonPoints: points };
  }

  // 3. Educational Philosophy Evaluator
  function evaluatePedagogy(months, concerns = []) {
    let recommended = 'MONTESSORI';
    let badge = '만 2~3세 소근육 최적';
    let rationale = '';
    let preventOverspendingTip = '';

    if (months < 24) {
      recommended = 'WALDORF';
      badge = '만 1~2세 오감·정서';
      rationale = '언어 폭발 이전 신체 감각과 정서적 애착이 형성되는 시기로 부드러운 자연 촉감 교구로 오감을 열어주세요.';
      preventOverspendingTip = '플라스틱 전자 사운드 장난감에 과노출되면 감각 피로와 산만함이 생깁니다. 이 시기에는 부드러운 자연 촉감 교구로 오감을 열어주세요.';
    } else if (months >= 24 && months < 48) {
      recommended = 'MONTESSORI';
      badge = '만 2~3세 소근육 최적';
      rationale = '손끝 삼지창 협응력이 형성되는 민감기로 몬테소리 일상 감각 교구가 두뇌 전두엽을 직접 자극합니다. 만 2~3세에 가베를 들이면 엄마표 스트레스만 받고 방치됩니다.';
      preventOverspendingTip = '만 2~3세에 추상적 입체 도형인 가베를 들이면 아이가 조작하지 못해 엄마표 스트레스만 받고 방치됩니다. 몬테소리 소근육부터 시작하세요.';
    } else if (months >= 48 && months < 72) {
      recommended = 'GABE';
      badge = '만 4~5세 공간·수리';
      rationale = '2차원 평면에서 3차원 입체로 공간 인지능력이 확장되는 시기로 기하 도형의 분할 합성을 통해 초등 수학 기초를 다집니다.';
      preventOverspendingTip = '소근육이 다져지지 않은 상태의 조기 도입은 비효율적입니다. 만 4세 이후 손끝 힘이 완성되었을 때 들여야 분해·조립 창의력이 폭발합니다.';
    } else {
      recommended = 'CREATIVE_SCIENCE';
      badge = '만 6세 이상 탐구·과학';
      rationale = '인과관계와 기계적 원리에 호기심이 급증하는 시기로 기어와 코딩 블록을 통해 가설 설정과 문제해결력을 기릅니다.';
      preventOverspendingTip = '수동적 키트 조립보다는 왜 돌아갈까?를 스스로 질문하는 프로젝트형 교구로 접근해야 초등 과학 탐구 토론 수업에 직결됩니다.';
    }

    // Weight by developmental concerns
    if (concerns.includes('fine_motor') && months < 60) {
      recommended = 'MONTESSORI';
      badge = '소근육 집중 몬테소리 처방';
    } else if (concerns.includes('math_space') && months >= 40) {
      recommended = 'GABE';
      badge = '공간지각 집중 가베 처방';
    }

    return {
      recommended,
      badge,
      rationale,
      preventOverspendingTip
    };
  }

  // Alias for contract compliance
  function evaluatePedagogicalMethod(ageMonths, concerns = [], currentPhilosophy = '') {
    return evaluatePedagogy(ageMonths, concerns);
  }

  // 4. TOP 4 Hot Toys Curation
  function getCuratedToys(ageMonths, concerns = []) {
    let pool = [];
    if (rubricsData && rubricsData.curatedToys) {
      pool = rubricsData.curatedToys;
    } else {
      pool = [
        {
          id: 'TOY_01',
          name: '몬테소리 꼭지원기둥 원목 실린더 4종 세트',
          targetAge: '24~48mo',
          ageMonthsMin: 20,
          ageMonthsMax: 54,
          concerns: ['fine_motor', 'math_space'],
          benefit: '손끝 삼지창 협응력 자극 및 3차원 크기 시각 변별력 완성',
          price: 31500,
          coupangPath: 'vp/products/montessori-cylinder-4set',
          cpaTitle: '몬테소리 1:1 방문 무료체험 수업 신청'
        },
        {
          id: 'TOY_02',
          name: '일상 조작 원목 핀셋 & 단추 끼우기 집중력 세트',
          targetAge: '24~48mo',
          ageMonthsMin: 18,
          ageMonthsMax: 48,
          concerns: ['fine_motor', 'daily'],
          benefit: '손끝 악력 강화 및 소근육 근육 기억 형성',
          price: 24800,
          coupangPath: 'vp/products/montessori-pincer-button',
          cpaTitle: '유아 소근육 홈케어 무료 코칭 신청'
        },
        {
          id: 'TOY_03',
          name: '프뢰벨 은물 가베 입체 기하 10종 스타터 세트',
          targetAge: '48~72mo',
          ageMonthsMin: 42,
          ageMonthsMax: 78,
          concerns: ['math_space', 'cognitive'],
          benefit: '3차원 공간지각 및 기하도형 합성 기초 체득',
          price: 38900,
          coupangPath: 'vp/products/froebel-gabe-starter',
          cpaTitle: '프뢰벨 가베 창의수학 1:1 방문 무료 체험 수업'
        },
        {
          id: 'TOY_04',
          name: '3D 자석 마그네틱 빌딩 블록 100P 메가팩',
          targetAge: '36~72mo',
          ageMonthsMin: 30,
          ageMonthsMax: 84,
          concerns: ['math_space', 'fine_motor'],
          benefit: '자력을 이용한 다차원 결합으로 건축 창의력 확장',
          price: 29800,
          coupangPath: 'vp/products/magnetic-blocks-100p',
          cpaTitle: '창의 블록 에듀케이션 무료 가이드북 증정'
        },
        {
          id: 'TOY_05',
          name: '무독성 친환경 안전 가위 & 입체 선긋기 워크북 세트',
          targetAge: '24~60mo',
          ageMonthsMin: 24,
          ageMonthsMax: 60,
          concerns: ['fine_motor'],
          benefit: '올바른 가위 파지법과 손끝 소근육 지구력 완성',
          price: 14500,
          coupangPath: 'vp/products/safety-scissors-workbook',
          cpaTitle: '가위질·선긋기 워크지 50종 PDF 무료 다운로드'
        },
        {
          id: 'TOY_06',
          name: '스마트 기어 회전 톱니바퀴 조립 세트 (STEM)',
          targetAge: '60mo+',
          ageMonthsMin: 54,
          ageMonthsMax: 144,
          concerns: ['cognitive', 'math_space'],
          benefit: '물리적 동력 전달 메커니즘 체득 및 공학적 사고력',
          price: 33000,
          coupangPath: 'vp/products/smart-gears-stem-kit',
          cpaTitle: '어린이 코딩·로봇 무료 체험 클래스 신청'
        }
      ];
    }

    // Filter & Score items
    const scored = pool.map((item) => {
      let score = 0;
      // Age match
      if (ageMonths >= item.ageMonthsMin && ageMonths <= item.ageMonthsMax) {
        score += 5;
      } else {
        score -= Math.abs(ageMonths - (item.ageMonthsMin + item.ageMonthsMax) / 2) * 0.1;
      }
      // Concern match
      concerns.forEach((c) => {
        if (item.concerns.includes(c)) score += 3;
      });
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    // Return exactly 4 items
    return scored.slice(0, 4).map((s) => s.item);
  }

  // 5. Render SVG 6-Axis Radar Chart
  function renderSvgRadarChart(scores, polygonPoints) {
    const size = 300;
    const cx = 150;
    const cy = 150;
    const r = 100;

    // Concentric grid rings (20%, 40%, 60%, 80%, 100%)
    const rings = [20, 40, 60, 80, 100];
    const angles = [-Math.PI / 2, -Math.PI / 6, Math.PI / 6, Math.PI / 2, (5 * Math.PI) / 6, (7 * Math.PI) / 6];
    const ringPolygons = rings.map((pct) => {
      const ringR = (pct / 100) * r;
      return angles.map((theta) => `${(cx + ringR * Math.cos(theta)).toFixed(1)},${(cy + ringR * Math.sin(theta)).toFixed(1)}`).join(' ');
    });

    // Axis labels positions
    const labelOffsets = [
      { text: '소근육 (Fine)', x: 150, y: 32, anchor: 'middle' },
      { text: '인지 (Cognitive)', x: 252, y: 92, anchor: 'start' },
      { text: '언어 (Language)', x: 252, y: 218, anchor: 'start' },
      { text: '사회성 (Social)', x: 150, y: 278, anchor: 'middle' },
      { text: '자조 (Self-care)', x: 48, y: 218, anchor: 'end' },
      { text: '대근육 (Gross)', x: 48, y: 92, anchor: 'end' }
    ];

    return `
      <svg viewBox="0 0 ${size} ${size}" class="kdst-radar-svg" style="width: 100%; max-width: 340px; height: auto; margin: 0 auto; display: block;" aria-label="보건복지부 K-DST 6대 발달영역 레이더">
        <!-- Background Rings -->
        ${ringPolygons.map((pts, i) => `
          <polygon points="${pts}" fill="${i === 4 ? '#F8FAFC' : 'none'}" stroke="#E2E8F0" stroke-width="1" />
        `).join('')}

        <!-- 6 Axes lines -->
        ${angles.map((theta) => `
          <line x1="${cx}" y1="${cy}" x2="${(cx + r * Math.cos(theta)).toFixed(1)}" y2="${(cy + r * Math.sin(theta)).toFixed(1)}" stroke="#CBD5E1" stroke-width="1.2" />
        `).join('')}

        <!-- Data Polygon -->
        <polygon points="${polygonPoints}" fill="#10B981" fill-opacity="0.32" stroke="#059669" stroke-width="2.5" />

        <!-- Data Vertices -->
        ${polygonPoints.split(' ').map((pt) => {
          const [px, py] = pt.split(',');
          return `<circle cx="${px}" cy="${py}" r="4.5" fill="#059669" stroke="#FFFFFF" stroke-width="2" />`;
        }).join('')}

        <!-- Axis Labels -->
        ${labelOffsets.map((l, idx) => `
          <text x="${l.x}" y="${l.y}" font-size="11" font-weight="700" fill="#334155" text-anchor="${l.anchor}">${l.text}</text>
        `).join('')}
      </svg>
    `;
  }

  // 6. Render Pedagogical Decision Box
  function renderPedagogyBox(verdict) {
    const isMontessori = verdict.recommended === 'MONTESSORI';
    const isGabe = verdict.recommended === 'GABE';
    const isWaldorf = verdict.recommended === 'WALDORF';
    const isScience = verdict.recommended === 'CREATIVE_SCIENCE';

    return `
      <div class="pedagogy-decision-card" style="background: #FFFFFF; border: 1.5px solid var(--growth-mint); border-radius: 24px; padding: 1.5rem; margin-top: 1.5rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.4rem;">🎯</span>
            <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">월령별 교육법 판정 (워킹맘 지갑 지킴이 가이드)</h4>
          </div>
          <span class="tab-badge tab-badge-mint" style="font-size: 0.82rem; font-weight: 700;">${verdict.badge}</span>
        </div>

        <div style="background: #F0FDF4; border-radius: 16px; padding: 1rem 1.25rem; margin-bottom: 1rem; border-left: 4px solid var(--growth-mint);">
          <div style="font-weight: 800; color: #065F46; font-size: 1rem; margin-bottom: 0.35rem;">
            추천 교육법: ${isMontessori ? '몬테소리 (손끝 소근육·일상 자율 교구)' : isGabe ? '프뢰벨 은물 / 가베 (3D 공간지각·기하 도형)' : isWaldorf ? '발도르프 (오감 자연·정서 예술놀이)' : '창의과학 / 융합 STEAM (기어·코딩 탐구형)'}
          </div>
          <p style="font-size: 0.9rem; color: #166534; line-height: 1.6; margin: 0;">
            ${verdict.rationale}
          </p>
        </div>

        <div style="background: #FFFBEB; border-radius: 16px; padding: 0.9rem 1.15rem; border-left: 4px solid #F59E0B;">
          <div style="font-weight: 700; color: #92400E; font-size: 0.88rem; margin-bottom: 0.25rem;">
            💡 중복 지출 방지 핵심 조언:
          </div>
          <p style="font-size: 0.85rem; color: #78350F; line-height: 1.55; margin: 0;">
            ${verdict.preventOverspendingTip}
          </p>
        </div>
      </div>
    `;
  }

  // 7. Render Curated TOP 4 Hot Items
  function renderToyCards(toys, affiliateConfig = {}) {
    const coupangId = affiliateConfig.coupang || 'AF7865143';

    return `
      <div class="curated-toys-section" style="margin-top: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.75rem;">
          <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0;">요즘 엄마들이 검증한 발달 핫템 교구 TOP 4</h4>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">소아발달 적기 처방 기준</span>
        </div>

        <div class="toys-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
          ${toys.map((t, idx) => {
            const coupangUrl = `https://link.coupang.com/a/${t.id.toLowerCase()}?subId=${coupangId}`;
            return `
              <div class="toy-card bento-card-sub" style="background: #FFFFFF; border: 1px solid var(--border-clinic); border-radius: 20px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="background: var(--primary-indigo-sub); color: var(--primary-indigo); font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 9999px;">TOP ${idx + 1}</span>
                    <span style="font-size: 0.78rem; color: var(--text-secondary);">${t.targetAge}</span>
                  </div>
                  <h5 style="font-size: 0.98rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem 0; line-height: 1.4;">${t.name}</h5>
                  <p style="font-size: 0.85rem; color: #475569; line-height: 1.55; margin: 0 0 0.85rem 0;">
                    <strong>발달 처방 근거:</strong> ${t.benefit}
                  </p>
                </div>

                <div>
                  <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.75rem;">
                    ${t.price.toLocaleString()}원
                  </div>
                  <a href="${coupangUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="width: 100%; text-align: center; text-decoration: none; font-size: 0.84rem; padding: 0.55rem 0.75rem; margin-bottom: 0.45rem; display: block; box-sizing: border-box;">
                    📋 이 성장단계 맞춤 교구·상세 스펙 확인하기 (로켓배송)
                  </a>
                  <a href="#layer1-cpa-section" class="btn-text-cpa" style="display: block; text-align: center; font-size: 0.78rem; color: var(--primary-indigo); text-decoration: none; font-weight: 600;">
                    👩‍⚕️ 1:1 방문 체험수업 신청 혜택 보기 →
                  </a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 8. Full Report Renderer for Tab 2
  function renderTab2Report(profile, affiliateConfig = {}) {
    const radar = evaluateKdstBalance(profile.ageMonths, profile.developmentConcerns);
    const pedagogy = evaluatePedagogy(profile.ageMonths, profile.developmentConcerns);
    const toys = getCuratedToys(profile.ageMonths, profile.developmentConcerns);

    return `
      <!-- K-DST Radar Section -->
      <div style="background: #FFFFFF; border: 1px solid var(--border-clinic); border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <div style="text-align: center; margin-bottom: 1rem;">
          <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0 0 0.35rem 0;">보건복지부 K-DST 6대 영역 발달 균형도</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">선택하신 발달 고민 태그가 반영된 다각적 밸런스 분석입니다.</p>
        </div>
        ${renderSvgRadarChart(radar.radarScores, radar.polygonPoints)}
      </div>

      <!-- Pedagogical Verdict -->
      ${renderPedagogyBox(pedagogy)}

      <!-- TOP 4 Hot Toys -->
      ${renderToyCards(toys, affiliateConfig)}
    `;
  }

  // Export
  const DevelopmentEngine = {
    evaluateKdstBalance,
    evaluatePedagogy,
    evaluatePedagogicalMethod,
    getCuratedToys,
    renderSvgRadarChart,
    renderPedagogyBox,
    renderToyCards,
    renderTab2Report
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DevelopmentEngine;
  } else {
    global.KidsFitDevelopmentEngine = DevelopmentEngine;
  }

})(typeof window !== 'undefined' ? window : global);
