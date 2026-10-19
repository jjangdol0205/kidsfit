/**
 * KidsFit Growth Studio - Monetization Engine (src/js/monetization.js)
 * Implements 4-tier monetization:
 * - Layer 1: High-ticket CPA cards (HT042 1:1 planner, Montessori/Gabe free trials)
 * - Layer 2: 5-Item Grocery Receipt UI (2 supplements + 2 toys + 1 book) with barcode & amortized daily cost
 * - Layer 3: Posture & Hardware upselling (chair, desk, trampoline, bookshelf)
 * - Layer 4: KakaoTalk prescription share & Naver cafe PDF worksheet banner
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

  // 2. Default Affiliate Config & Storage Reader
  const DEFAULT_AFFILIATE_CONFIG = {
    coupang: 'AF7865143',
    linkprice: 'A100708867',
    tenping: '010-****-2370',
    cafeUrl: 'https://cafe.naver.com/kidsfitgrowth',
    blogUrl: 'https://blog.naver.com/kidsfit_studio'
  };

  let inMemoryAffiliateConfig = null;

  function getAffiliateConfig() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem('kidsfit_affiliate_config');
        if (raw) {
          return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, JSON.parse(raw));
        }
      } catch (e) {
        // fallback
      }
    }
    if (inMemoryAffiliateConfig) {
      return Object.assign({}, DEFAULT_AFFILIATE_CONFIG, inMemoryAffiliateConfig);
    }
    return Object.assign({}, DEFAULT_AFFILIATE_CONFIG);
  }

  function saveAffiliateConfig(config) {
    inMemoryAffiliateConfig = Object.assign({}, config);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('kidsfit_affiliate_config', JSON.stringify(config));
      } catch (e) {
        console.error('Failed to save affiliate config to localStorage', e);
      }
    }
  }

  // 3. Layer 2: 5-Item Grocery Receipt Generator
  function getGroceryReceiptItems(profile = {}, budgetTier = 'tier_15_30') {
    const habits = profile.habits || [];
    const hasMilkTrouble = habits.includes('milk_trouble');

    let items = [];

    if (budgetTier === 'tier_5_10') {
      items = [
        {
          id: 'SUP_01_L',
          name: hasMilkTrouble ? '[성장 1] 키즈 구연산 칼슘+비타민D 액상 드롭' : '[성장 1] 키즈 액상 비타민D+아연 드롭',
          desc: hasMilkTrouble ? '우유 배앓이 제로 흡수 포뮬러' : '성장판 활성화 필수 미네랄',
          price: 16500,
          category: 'supplements',
          path: 'vp/products/kids-liquid-vit-d-zinc'
        },
        {
          id: 'SUP_02_L',
          name: '[성장 2] 산양유 츄어블 칼슘 60정',
          desc: '소화 편한 산양유 단백질 & 뼈 성장 영양',
          price: 19800,
          category: 'supplements',
          path: 'vp/products/goat-milk-chewable-calcium'
        },
        {
          id: 'TOY_01_L',
          name: '[발달 1] 몬테소리 일상 끈꿰기 원목 보드',
          desc: '손끝 삼지창 소근육 조작 & 눈-손 협응력',
          price: 14500,
          category: 'toys',
          path: 'vp/products/montessori-lacing-board'
        },
        {
          id: 'TOY_02_L',
          name: '[발달 2] 창의 자석 도형 미니팩 36P',
          desc: '자석 결합을 통한 기초 평면·입체 공간지각',
          price: 18000,
          category: 'toys',
          path: 'vp/products/magnetic-shape-mini-36p'
        },
        {
          id: 'BOK_01_L',
          name: '[전시 1] 원데이 나들이 필수 스티커 워크북',
          desc: '전시 방문 전후 핵심 포인트 복습 및 기억 강화',
          price: 9800,
          category: 'books',
          path: 'vp/products/oneday-outing-sticker-workbook'
        }
      ];
    } else if (budgetTier === 'tier_unlimited') {
      items = [
        {
          id: 'SUP_01_H',
          name: '[성장 1] 프리미엄 HT042 키성장 농축 앰플 30포',
          desc: '식약처 인정 어린이 키성장 기능성 개별인정 원료',
          price: 68000,
          category: 'supplements',
          path: 'vp/products/premium-ht042-growth-ampoule'
        },
        {
          id: 'SUP_02_H',
          name: '[성장 2] 초유 농축 단백 + 마그네슘 분말 세트',
          desc: '밤 10시 숙면 성장호르몬 분비 극대화 포뮬러',
          price: 45000,
          category: 'supplements',
          path: 'vp/products/colostrum-protein-magnesium'
        },
        {
          id: 'TOY_01_H',
          name: '[발달 1] 몬테소리 정품 풀세트 일상 감각 원목 12종',
          desc: '전두엽 시냅스 활성화를 위한 최고급 비치우드 정품',
          price: 58000,
          category: 'toys',
          path: 'vp/products/montessori-authentic-beechwood-12set'
        },
        {
          id: 'TOY_02_H',
          name: '[발달 2] 3D 전동 기어 마그네틱 메가세트 180P',
          desc: '동력 전달 기계 메커니즘과 공간 건축 융합',
          price: 49000,
          category: 'toys',
          path: 'vp/products/3d-motorized-gear-magnetic-180p'
        },
        {
          id: 'BOK_01_H',
          name: '[전시 1] 국립박물관 공식 입체 역사 팝업북 전집 3권',
          desc: '문화재 입체 재현으로 역사 인지 효과 300% 극대화',
          price: 28000,
          category: 'books',
          path: 'vp/products/national-museum-popup-3set'
        }
      ];
    } else {
      // Default: tier_15_30
      items = [
        {
          id: 'SUP_01_M',
          name: '[성장 1] 흡수율 3배 구연산 칼슘+비타민D3 시럽',
          desc: '유당불내증 배앓이 제로 / 골아세포 직접 공급',
          price: 28000,
          category: 'supplements',
          path: 'vp/products/citrate-calcium-vitd3-syrup'
        },
        {
          id: 'SUP_02_M',
          name: '[성장 2] 뉴질랜드 초유 단백+아연 키즈 스틱',
          desc: '밤 10시 성장호르몬 분비 수면 골든타임 루틴',
          price: 34000,
          category: 'supplements',
          path: 'vp/products/colostrum-protein-zinc-stick'
        },
        {
          id: 'TOY_01_M',
          name: '[발달 1] 몬테소리 일상 조작 원목 핀셋·원기둥',
          desc: '손끝 소근육 삼지창 협응 & 전두엽 시냅스 자극',
          price: 31500,
          category: 'toys',
          path: 'vp/products/montessori-pincer-cylinder-set'
        },
        {
          id: 'TOY_02_M',
          name: '[발달 2] 3차원 자석 입체 마그네틱 블록 100P',
          desc: '공간지각력 확장 & 초등 기하 도형 입문',
          price: 29800,
          category: 'toys',
          path: 'vp/products/magnetic-blocks-100p'
        },
        {
          id: 'BOK_01_M',
          name: '[전시 1] 이번 주말 맞춤 역사/과학 입체 팝업북',
          desc: '전시 다녀오기 전후 배경지식 200% 확장',
          price: 15200,
          category: 'books',
          path: 'vp/products/weekend-popup-book'
        }
      ];
    }

    const total4Weeks = items.reduce((sum, item) => sum + item.price, 0);
    const dailyAverage = Math.round(total4Weeks / 30);

    return {
      items,
      total4Weeks,
      dailyAverage
    };
  }

  // 4. Layer 3: Hardware Upsell Generator
  function getHardwareRecommendations(habits = [], budgetTier = 'tier_15_30') {
    if (catalogData && catalogData.hardwareItems) {
      return catalogData.hardwareItems;
    }
    return [
      {
        id: 'HW_01',
        name: '어린이 인체공학 척추 지지 성장 의자',
        category: 'posture',
        price: 189000,
        tag: '숨은 키 2cm 보존',
        benefit: '골반 수평 유지 및 요추 듀얼 서포트로 구부정한 자세 예방, 척추 추간판 압박 차단',
        coupangPath: 'vp/products/ergonomic-kids-growth-chair'
      },
      {
        id: 'HW_02',
        name: '친환경 자작나무 각도조절 와이드 독서대',
        category: 'posture',
        price: 68000,
        tag: '거북목 원천 차단',
        benefit: '시선 수평 유지로 경추 전만(C자 커브) 보존, 스마트폰·책 읽기 시 척추 기립선 보호',
        coupangPath: 'vp/products/birch-reading-desk-wide'
      },
      {
        id: 'HW_03',
        name: '층간소음 99% 차단 성장판 무소음 실내 트램폴린',
        category: 'exercise',
        price: 148000,
        tag: '성장판 수직 자극',
        benefit: '고탄성 번지코드 밴드로 관절 무리 없이 무릎 연골 성장판 자극 및 성장호르몬 분비 촉진',
        coupangPath: 'vp/products/anti-noise-kids-trampoline'
      },
      {
        id: 'HW_04',
        name: '몬테소리 자기주도 전면 3단 원목 교구장',
        category: 'environment',
        price: 225000,
        tag: '스스로 정리하는 자립심',
        benefit: '아이 시선 높이에 맞춘 전면 배치로 스스로 꺼내고 정리하는 질서감과 주도적 탐구 환경 세팅',
        coupangPath: 'vp/products/montessori-front-bookshelf'
      }
    ];
  }

  // 5. Render Layer 1: High-Ticket CPA Cards
  function renderLayer1Cpa(profile, affiliateConfig) {
    const tenpingId = affiliateConfig.tenping || '010-****-2370';
    const linkpriceId = affiliateConfig.linkprice || 'A100708867';

    return `
      <div class="monetization-layer-1" id="layer1-cpa-section" style="margin-bottom: 2rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
          
          <!-- CPA Card 1: Pediatric Growth Planner -->
          <div class="cpa-clinic-card" style="background: linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%); border: 1.5px solid #C7D2FE; border-radius: 24px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="background: var(--primary-indigo); color: #FFFFFF; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 9999px;">
                  1:1 성장 전문 문진
                </span>
                <span style="font-size: 0.8rem; color: #6366F1; font-weight: 600;">식약처 기능성 인정</span>
              </div>
              <h4 style="font-size: 1.1rem; font-weight: 800; color: #1E1B4B; margin: 0 0 0.5rem 0; line-height: 1.4;">
                어린이 키성장 기능성 원료(HT042) 1:1 전담 플래너 무료 상담
              </h4>
              <p style="font-size: 0.86rem; color: #4338CA; line-height: 1.55; margin: 0 0 1rem 0;">
                사춘기 골든타임 진입 아동 및 또래 하위 25% 학부모를 위한 소아성장 전문 플래너 무료 심층 문진 &amp; 3일분 특별 체험 혜택
              </p>
            </div>
            <a href="https://click.linkprice.com/click.php?m=kidsgrowth&a=${linkpriceId}&l=9999&u=https%3A%2F%2Fkidsfitgrowth.com%2Fconsultation" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width: 100%; text-align: center; text-decoration: none; padding: 0.75rem 1rem; font-size: 0.88rem; box-sizing: border-box;">
              👩‍⚕️ 우리 아이 성장 골든타임 1:1 전문 플래너 무료 상담 신청하기
            </a>
          </div>

          <!-- CPA Card 2: Montessori / Gabe Home Trial -->
          <div class="cpa-clinic-card" style="background: linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%); border: 1.5px solid #A7F3D0; border-radius: 24px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="background: var(--growth-mint-hover); color: #FFFFFF; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 9999px;">
                  발달 진단 방문수업
                </span>
                <span style="font-size: 0.8rem; color: #059669; font-weight: 600;">원목 교구 1종 증정</span>
              </div>
              <h4 style="font-size: 1.1rem; font-weight: 800; color: #064E3B; margin: 0 0 0.5rem 0; line-height: 1.4;">
                몬테소리·프뢰벨 가베 1:1 방문 발달 진단 &amp; 체험 수업
              </h4>
              <p style="font-size: 0.86rem; color: #047857; line-height: 1.55; margin: 0 0 1rem 0;">
                아이의 손끝 소근육 악력과 공간지각력을 전문 교사가 직접 진단하고 우리 집 환경에 맞는 교구 활용법을 코칭해드립니다.
              </p>
            </div>
            <a href="https://click.linkprice.com/click.php?m=montessori&a=${linkpriceId}&l=9999&u=https%3A%2F%2Fkidsfitgrowth.com%2Ftrial" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="width: 100%; text-align: center; text-decoration: none; padding: 0.75rem 1rem; font-size: 0.88rem; box-sizing: border-box; background: #FFFFFF; border-color: #059669; color: #059669;">
              🧩 월령별 맞춤 1:1 방문 체험수업 &amp; 무료 교구 신청하기
            </a>
          </div>

        </div>
      </div>
    `;
  }

  // 6. Render Layer 2: 5-Item Grocery Receipt UI
  function renderLayer2Receipt(receipt, affiliateConfig) {
    const coupangId = affiliateConfig.coupang || 'AF7865143';

    return `
      <div class="monetization-layer-2" style="margin-bottom: 2.5rem;">
        <div class="receipt-outer-wrapper" style="max-width: 580px; margin: 0 auto; background: #FAF9F6; border: 2px dashed #CBD5E1; border-radius: 20px; padding: 2rem 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.03); font-family: 'Pretendard', -apple-system, monospace;">
          
          <!-- Receipt Header -->
          <div style="text-align: center; border-bottom: 1px dashed #94A3B8; padding-bottom: 1.25rem; margin-bottom: 1.25rem;">
            <div style="font-size: 0.8rem; letter-spacing: 2px; color: #64748B; margin-bottom: 0.25rem;">KIDSFIT GROWTH STUDIO PRESCRIPTION</div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #1E293B; margin: 0 0 0.25rem 0;">[우리 아이 월간 맞춤 홈케어 처방 영수증]</h3>
            <p style="font-size: 0.82rem; color: #64748B; margin: 0;">질병관리청 성장도표 &amp; K-DST 분석 기반 4주 집중 루틴</p>
          </div>

          <!-- Items Table -->
          <div class="receipt-items-list" style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 700; color: #64748B; border-bottom: 1px solid #E2E8F0; padding-bottom: 0.4rem; margin-bottom: 0.75rem;">
              <span>처방 품목명 및 세부 효능</span>
              <span>수량 / 금액</span>
            </div>

            ${receipt.items.map((item) => {
              const coupangUrl = `https://link.coupang.com/a/${item.path.replace(/^vp\/products\//, '')}?subId=${coupangId}`;
              return `
                <div class="receipt-row" style="margin-bottom: 0.85rem; padding-bottom: 0.85rem; border-bottom: 1px dotted #E2E8F0;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <a href="${coupangUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.92rem; font-weight: 700; color: #1E293B; text-decoration: none;">
                      ${item.name}
                    </a>
                    <span style="font-size: 0.95rem; font-weight: 800; color: #1E293B; white-space: nowrap; margin-left: 0.5rem;">
                      ${item.price.toLocaleString()}원
                    </span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
                    <span style="font-size: 0.8rem; color: #64748B;">↳ ${item.desc}</span>
                    <a href="${coupangUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.75rem; color: var(--primary-indigo); text-decoration: underline; font-weight: 600;">
                      최저가 확인 →
                    </a>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Receipt Totals -->
          <div style="border-top: 2px solid #334155; padding-top: 1rem; margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 1.1rem; font-weight: 800; color: #0F172A; margin-bottom: 0.5rem;">
              <span>4주 총 투자 합계</span>
              <span style="font-size: 1.35rem; color: var(--primary-indigo);">${receipt.total4Weeks.toLocaleString()}원</span>
            </div>

            <div style="background: #EEF2FF; border-radius: 12px; padding: 0.85rem 1rem; text-align: center;">
              <div style="font-size: 0.95rem; font-weight: 800; color: #3730A3;">
                ★ 하루 평균 투자비: 약 ${receipt.dailyAverage.toLocaleString()}원
              </div>
              <div style="font-size: 0.82rem; color: #4338CA; margin-top: 0.2rem;">
                카페 커피 한 잔 값으로 우리 아이 키성장 골든타임 + 두뇌 발달 완벽 해결!
              </div>
            </div>
          </div>

          <!-- Barcode & Disclaimer -->
          <div style="text-align: center; border-top: 1px dashed #94A3B8; padding-top: 1.25rem;">
            <div style="font-family: monospace; font-size: 1.35rem; letter-spacing: 4px; color: #334155; margin-bottom: 0.35rem;">
              ||| | ||||| |||| || |||||| |||||||| ||||| | ||||
            </div>
            <div style="font-size: 0.75rem; color: #94A3B8;">
              KIDSFIT-RX-AFF-${coupangId}-${new Date().getFullYear()}
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // 7. Render Layer 3: Hardware Upselling Cards
  function renderLayer3Hardware(hardwareItems, affiliateConfig) {
    const coupangId = affiliateConfig.coupang || 'AF7865143';

    return `
      <div class="monetization-layer-3" style="margin-bottom: 2.5rem;">
        <div style="margin-bottom: 1rem;">
          <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0 0 0.35rem 0;">
            가정 내 바른 성장 &amp; 발달 환경 세팅 가이드 (하드웨어)
          </h4>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0;">
            숨은 키 2cm를 지키고 자기주도 탐구 습관을 완성하는 핵심 가구·기구 처방입니다.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
          ${hardwareItems.map((item) => {
            const coupangUrl = `https://link.coupang.com/a/${item.coupangPath.replace(/^vp\/products\//, '')}?subId=${coupangId}`;
            return `
              <div class="bento-card-sub" style="background: #FFFFFF; border: 1px solid var(--border-clinic); border-radius: 20px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <span style="background: var(--primary-indigo-sub); color: var(--primary-indigo); font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 9999px;">
                    ${item.tag}
                  </span>
                  <h5 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0.65rem 0 0.35rem 0; line-height: 1.4;">
                    ${item.name}
                  </h5>
                  <p style="font-size: 0.84rem; color: #475569; line-height: 1.55; margin: 0 0 0.85rem 0;">
                    ${item.benefit}
                  </p>
                </div>
                <div>
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.65rem;">
                    ${item.price.toLocaleString()}원
                  </div>
                  <a href="${coupangUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="display: block; width: 100%; text-align: center; text-decoration: none; font-size: 0.85rem; padding: 0.6rem 0.85rem; box-sizing: border-box;">
                    📋 상세 스펙 및 규격 확인하기
                  </a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 8. Render Layer 4: Viral Share & Naver Cafe Lock-in Banner
  function renderLayer4LockIn(profile, affiliateConfig) {
    const cafeUrl = affiliateConfig.cafeUrl || 'https://cafe.naver.com/kidsfitgrowth';
    const childGender = profile.gender === 'boy' ? '남아' : '여아';

    return `
      <div class="monetization-layer-4" style="margin-bottom: 2rem;">
        
        <!-- Kakao / Clipboard Share Card -->
        <div style="background: #FEE500; border-radius: 20px; padding: 1.35rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.75rem;">💌</span>
            <div>
              <h5 style="font-size: 0.98rem; font-weight: 800; color: #3C1E1E; margin: 0 0 0.2rem 0;">
                남편·아내에게 우리 아이 맞춤 처방전 1초 공유하기
              </h5>
              <p style="font-size: 0.82rem; color: #665000; margin: 0;">
                성장판 골든타임 신호와 주말 나들이 추천 코스를 카톡으로 즉시 전송합니다.
              </p>
            </div>
          </div>
          <button type="button" id="btn-share-prescription" class="btn" style="background: #3C1E1E; color: #FFFFFF; font-weight: 700; font-size: 0.88rem; padding: 0.65rem 1.25rem; border-radius: 9999px; border: none; cursor: pointer;">
            카톡 / 링크 복사
          </button>
        </div>

        <!-- Naver Cafe Lock-in Banner -->
        <div style="background: linear-gradient(135deg, #03C75A 0%, #029C46 100%); border-radius: 20px; padding: 1.5rem; color: #FFFFFF; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="background: rgba(255,255,255,0.25); display: inline-block; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.45rem;">
              공식 네이버 카페 회원 전용 혜택
            </div>
            <h4 style="font-size: 1.15rem; font-weight: 800; margin: 0 0 0.35rem 0; line-height: 1.4;">
              '월령별 소근육 가위질·선긋기 워크지 50종 PDF' 무료 다운로드
            </h4>
            <p style="font-size: 0.85rem; color: #E8F9EE; margin: 0; line-height: 1.5;">
              같은 개월 수 엄마들이 모인 커뮤니티에서 이번 달 교구·영양제 최저가 공동구매 알림도 받아보세요!
            </p>
          </div>
          <a href="${cafeUrl}" target="_blank" rel="noopener noreferrer" class="btn" style="background: #FFFFFF; color: #029C46; font-weight: 800; font-size: 0.9rem; padding: 0.75rem 1.25rem; border-radius: 9999px; text-decoration: none; white-space: nowrap;">
            🎁 무료 PDF 받고 카페 가입하기 →
          </a>
        </div>

      </div>
    `;
  }

  // 9. Master Monetization Section Renderer
  function renderAllMonetizationLayers(profile, affiliateConfig) {
    const config = affiliateConfig || getAffiliateConfig();
    const receipt = getGroceryReceiptItems(profile, profile.budgetTier);
    const hardware = getHardwareRecommendations(profile.habits, profile.budgetTier);

    return `
      <div class="monetization-appendix-container" style="margin-top: 2rem; border-top: 2px solid var(--border-clinic); padding-top: 2rem;">
        
        <div style="text-align: center; margin-bottom: 2rem;">
          <span class="tab-badge tab-badge-indigo" style="font-size: 0.85rem;">📋 클리닉 맞춤 처방 부록</span>
          <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 0.5rem 0 0.35rem 0;">
            우리 아이 맞춤형 월간 홈케어 처방 플랜 요약표
          </h3>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
            성장 영양소, 소근육 교구, 주말 전시 연계 도서를 한곳에 모은 통합 장보기 리포트
          </p>
        </div>

        <!-- Layer 1 -->
        ${renderLayer1Cpa(profile, config)}

        <!-- Layer 2 -->
        ${renderLayer2Receipt(receipt, config)}

        <!-- Layer 3 -->
        ${renderLayer3Hardware(hardware, config)}

        <!-- Layer 4 -->
        ${renderLayer4LockIn(profile, config)}

      </div>
    `;
  }

  // Export
  const Monetization = {
    DEFAULT_AFFILIATE_CONFIG,
    getAffiliateConfig,
    getGroceryReceiptItems,
    getHardwareRecommendations,
    renderLayer1Cpa,
    renderLayer2Receipt,
    renderLayer3Hardware,
    renderLayer4LockIn,
    renderAllMonetizationLayers
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Monetization;
  } else {
    global.KidsFitMonetization = Monetization;
  }

})(typeof window !== 'undefined' ? window : global);
