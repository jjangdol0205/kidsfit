/**
 * src/js/korean-digital-asset-monetization.js
 * Korean Free A4 Printable Workbook & Dynamic Age×Habit Prescription Curation Engine (kidsfit.co.kr)
 * - 100% Free of foreign paywalls or paid checkout modals.
 * - Dynamically matches diagnosed child age & habit bottlenecks to high-conversion 8,900원~3만원대 daily essentials
 *   across Coupang Partners AFFSDP/AFFSRP (AF7865143), LinkPrice Yes24 (A100708867), iHerb (IPZ1547), and Naver BrandConnect.
 */
(function (global) {
  'use strict';

  var UNLOCK_KEY = 'kidsfit_kr_digital_asset_unlocked_v1';

  var RX_ESSENTIAL_ITEMS = {
    bookstand: {
      id: 'prod_ch_hot_1',
      badge: '경추 거북목 · 숨은 키 +1.8cm',
      name: '삼나무 2단 각도조절 원목 독서대',
      priceLabel: '8,900원대 · 로켓배송',
      reason: '고개 숙임 하중(18kg)을 덜어 경추 정렬과 착석 몰입 시간을 동시에 개선합니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=rx_top3_bookstand&pageKey=9063539057&itemId=26612491974&vendorItemId=93585543652'
    },
    reading_workbook: {
      id: 'prod_ch_learn_1',
      badge: '문장제 수학 · 비문학 문해력',
      name: '뿌리깊은 초등국어 독해력 기본편 (마더텅)',
      priceLabel: '9,900원 · 예스24 공식',
      reason: '세 줄 이상 긴 서술형 문제에서 막히는 초등 문해력 병목을 하루 10분 루틴으로 잡아줍니다.',
      cta: '📚 공식 판매처 보러가기 →',
      platform: 'linkprice',
      bg: '#059669',
      url: 'https://click.linkprice.com/click.php?m=yes24&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=https%3A%2F%2Fwww.yes24.com%2FProduct%2FGoods%2F59198169'
    },
    lactofit_kids: {
      id: 'prod_tod_nut_1',
      badge: '편식 · 장내 칼슘 흡수 환경',
      name: '종근당건강 락토핏 생유산균 키즈 (60포)',
      priceLabel: '14,760원대 · 로켓배송',
      reason: '편식·배앓이가 잦은 유아·초등기 장내 미생물 균형과 아연·비타민D 일일 보충을 돕습니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=rx_top3_lactofit&pageKey=7060712643&itemId=16202759365&vendorItemId=83397339509'
    },
    ca_mg_d3_chew: {
      id: 'prod_ch_nut_1',
      badge: '성장판 골기질 · 야간 숙면 시너지',
      name: '금쪽같은 어린이 칼슘 마그네슘 비타민D (4통)',
      priceLabel: '33,530원대 · 로켓배송',
      reason: '밤 10시 성장호르몬 피크 구간 전후 골단판 연골 석회화에 필요한 칼슘·마그네슘·D3 배합입니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=rx_top3_camgd3&pageKey=7335841617&itemId=29211153321&vendorItemId=96131097426'
    },
    liquid_calcium: {
      id: 'prod_inf_nut_2',
      badge: '영유아 액상 고흡수 구연산칼슘',
      name: '차일드라이프 액상 칼슘·마그네슘·D3 (오렌지맛)',
      priceLabel: '22,300원대 · iHerb 직구',
      reason: '알약을 삼키기 어려운 영유아·우유 거부 아동도 거부감 없이 섭취하는 구연산 액상 포뮬러입니다.',
      cta: '🌿 iHerb 혜택가 확인 →',
      platform: 'iherb',
      bg: '#047857',
      url: 'https://kr.iherb.com/pr/childlife-liquid-calcium-with-magnesium-natural-orange-flavor-16-fl-oz-473-ml/9434?rcode=IPZ1547'
    },
    baby_focus_book: {
      id: 'prod_nb_dev_1',
      badge: '영아 시각·청각 시냅스 자극',
      name: '블루래빗 두뇌계발 초점사운드북 + 헝겊초점책',
      priceLabel: '25,200원대 · 로켓배송',
      reason: '생후 초기 시신경 초점 형성과 청각 리듬 반응성을 깨우는 검증된 국민 첫 발달 교구입니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=rx_top3_focusbook&pageKey=6728684571&itemId=15671650287&vendorItemId=82887200026'
    },
    wood_rollercoaster: {
      id: 'prod_inf_dev_1',
      badge: '소근육 협응 · 눈-손 정밀 조절',
      name: '고려베이비 원목 구슬 롤러코스터 소근육 교구',
      priceLabel: '21,300원대 · 로켓배송',
      reason: '엄지·검지 집기 조작으로 전두엽 운동피질과 공간 추적 집중력을 자극하는 원목 교구입니다.',
      cta: '🚀 쿠팡 혜택가 확인 →',
      platform: 'coupang',
      bg: '#1D4ED8',
      url: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=rx_top3_woodbead&pageKey=8485073446&itemId=16104062785&vendorItemId=83301332924'
    },
    miracle_hangul: {
      id: 'prod_tod_learn_1',
      badge: '유아 음운 인식 · 한글 문해 기초',
      name: '기적의 한글 학습 1~5권 단계별 세트 (길벗스쿨)',
      priceLabel: '55,000원 · 예스24 공식',
      reason: '통글자 암기가 아닌 자모음 결합 원리로 유아기 읽기 독립을 완성하는 베스트셀러입니다.',
      cta: '📚 공식 판매처 보러가기 →',
      platform: 'linkprice',
      bg: '#059669',
      url: 'https://click.linkprice.com/click.php?m=yes24&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=https%3A%2F%2Fwww.yes24.com%2FProduct%2FGoods%2F96662201'
    }
  };

  function isJsdomEnv() {
    return typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
  }

  function getActiveProfile() {
    try {
      if (typeof window !== 'undefined') {
        if (window.TallerOnboardingWizard && typeof window.TallerOnboardingWizard.getProfile === 'function') {
          var wp = window.TallerOnboardingWizard.getProfile();
          if (wp && (wp.ageYears || wp.ageMonths)) return wp;
        }
        if (window.KidsFitApp && window.KidsFitApp.state && window.KidsFitApp.state.profile) {
          return window.KidsFitApp.state.profile;
        }
        if (window.growthTrackerInstance && window.growthTrackerInstance.currentProfile) {
          return window.growthTrackerInstance.currentProfile;
        }
      }
    } catch (_) {}
    return { ageYears: 10, ageMonths: 120, gender: 'boy', currentHeight: 137.0, currentWeight: 35.5, fatherHeight: 174.0, motherHeight: 161.0, habits: ['late_sleep', 'poor_posture'] };
  }

  function selectTop3ForProfile(profile) {
    var p = profile || getActiveProfile();
    var ageM = Number(p.ageMonths) || ((Number(p.ageYears) || 10) * 12);
    var habits = Array.isArray(p.habits) ? p.habits : [];
    var concerns = Array.isArray(p.traitLearningConcerns) ? p.traitLearningConcerns : [];

    if (ageM < 36) {
      return {
        stageTitle: '영아기(0~35개월) 오감 시냅스 · 액상 칼슘 흡수 필수템 TOP 3',
        items: [RX_ESSENTIAL_ITEMS.liquid_calcium, RX_ESSENTIAL_ITEMS.baby_focus_book, RX_ESSENTIAL_ITEMS.wood_rollercoaster]
      };
    }
    if (ageM < 84) {
      var todSecond = concerns.indexOf('fine_motor') !== -1 ? RX_ESSENTIAL_ITEMS.wood_rollercoaster : RX_ESSENTIAL_ITEMS.miracle_hangul;
      var todThird = habits.indexOf('milk_trouble') !== -1 ? RX_ESSENTIAL_ITEMS.liquid_calcium : RX_ESSENTIAL_ITEMS.bookstand;
      return {
        stageTitle: '유아기(3~6세) 편식 장건강 · 소근육 · 한글 문해 필수템 TOP 3',
        items: [RX_ESSENTIAL_ITEMS.lactofit_kids, todSecond, todThird]
      };
    }
    var elemFirst = RX_ESSENTIAL_ITEMS.bookstand;
    var elemSecond = habits.indexOf('milk_trouble') !== -1 ? RX_ESSENTIAL_ITEMS.liquid_calcium :
      (habits.indexOf('picky_eater') !== -1 ? RX_ESSENTIAL_ITEMS.lactofit_kids : RX_ESSENTIAL_ITEMS.ca_mg_d3_chew);
    var elemThird = RX_ESSENTIAL_ITEMS.reading_workbook;
    return {
      stageTitle: '초등·청소년기(만 ' + Math.max(7, Math.round(ageM / 12)) + '세) 숨은 키 복원 · 골든타임 영양 · 문해력 TOP 3',
      items: [elemFirst, elemSecond, elemThird]
    };
  }

  function renderDynamicRxTop3(profileArg) {
    if (typeof document === 'undefined') return;
    var grid = document.getElementById('kf-dynamic-rx-top3-grid');
    if (!grid) return;
    var bundle = selectTop3ForProfile(profileArg || getActiveProfile());
    var headingEl = document.getElementById('kf-dynamic-rx-top3-heading');
    if (headingEl) {
      headingEl.textContent = '🎯 ' + bundle.stageTitle;
    }
    grid.innerHTML = bundle.items.map(function (it) {
      return (
        '<div class="kf-rx-top3-card" style="background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:12px;padding:0.8rem;display:flex;flex-direction:column;justify-content:space-between;gap:0.45rem;">' +
          '<div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.35rem;margin-bottom:0.3rem;">' +
              '<span style="background:#EFF6FF;color:#1D4ED8;font-size:0.69rem;font-weight:800;padding:0.15rem 0.48rem;border-radius:9999px;">' + it.badge + '</span>' +
              '<span style="font-size:0.72rem;font-weight:800;color:#0F172A;">' + it.priceLabel + '</span>' +
            '</div>' +
            '<strong style="display:block;font-size:0.86rem;font-weight:900;color:#0F172A;line-height:1.35;margin-bottom:0.25rem;">' + it.name + '</strong>' +
            '<p style="margin:0;font-size:0.76rem;color:#475569;line-height:1.42;">' + it.reason + '</p>' +
          '</div>' +
          '<a href="' + it.url + '" target="_blank" rel="noopener noreferrer sponsored" data-platform="' + it.platform + '" data-product-id="' + it.id + '" style="display:flex;min-height:42px;align-items:center;justify-content:center;background:' + it.bg + ';color:#FFFFFF;font-size:0.8rem;font-weight:900;border-radius:9px;text-decoration:none;padding:0.45rem 0.7rem;margin-top:0.25rem;">' +
            it.cta +
          '</a>' +
        '</div>'
      );
    }).join('');
  }

  function isDigitalAssetUnlocked() {
    return true;
  }

  function unlockDigitalAssetsNow(reason) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(UNLOCK_KEY, 'true');
        window.localStorage.setItem('kidsfit_diagnostic_full_unlock_v1', 'true');
      }
      if (typeof window !== 'undefined' && typeof window.unlockKidsFitDiagnosticTests === 'function') {
        window.unlockKidsFitDiagnosticTests(reason || 'WorkbookUnlock');
      }
    } catch (_) {}
  }

  function openKoreanDigitalAssetModal() {
    try {
      if (typeof document === 'undefined') return;
      var gate = document.getElementById('kidsfit-report-unlock-gate') || document.getElementById('kf-curated-mall-hero');
      if (gate && typeof gate.scrollIntoView === 'function') {
        gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
      }
    } catch (_) {}
  }

  function injectReportDigitalAssetBanner(profileArg) {
    renderDynamicRxTop3(profileArg);
  }

  function showWorkbookPrepBridge(profileArg) {
    if (typeof document === 'undefined' || isJsdomEnv()) return;
    var existing = document.getElementById('kf-workbook-prep-bridge');
    if (existing) existing.remove();
    var bundle = selectTop3ForProfile(profileArg || getActiveProfile());
    var bar = document.createElement('div');
    bar.id = 'kf-workbook-prep-bridge';
    bar.className = 'no-print';
    bar.style.cssText = 'position:fixed;bottom:16px;right:16px;left:16px;max-width:560px;margin:0 auto;z-index:9995;background:#0F172A;color:#FFFFFF;border:2px solid #3B82F6;border-radius:16px;padding:14px 16px;box-shadow:0 16px 36px rgba(15,23,42,0.35);';
    var topA = bundle.items[0] || RX_ESSENTIAL_ITEMS.bookstand;
    var topB = bundle.items[2] || RX_ESSENTIAL_ITEMS.reading_workbook;
    bar.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">' +
        '<div style="font-size:0.86rem;font-weight:900;line-height:1.4;">🖨️ 90일 실전 워크북 인쇄 준비 완료! <span style="color:#93C5FD;display:block;font-size:0.76rem;font-weight:700;">가정 실천에 바로 쓰는 에디터 큐레이션 교구·교재 혜택가 확인</span></div>' +
        '<button type="button" onclick="var el=document.getElementById(\'kf-workbook-prep-bridge\');if(el)el.remove();" style="background:rgba(255,255,255,0.14);border:none;color:#FFFFFF;border-radius:999px;width:28px;height:28px;cursor:pointer;font-weight:900;">✕</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;">' +
        '<a href="' + topA.url + '" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;align-items:center;justify-content:center;min-height:40px;background:#2563EB;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:6px 10px;font-size:0.78rem;font-weight:800;">' + topA.name.slice(0, 16) + ' 혜택가 확인 →</a>' +
        '<a href="' + topB.url + '" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;align-items:center;justify-content:center;min-height:40px;background:#059669;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:6px 10px;font-size:0.78rem;font-weight:800;">' + topB.name.slice(0, 16) + ' 공식 판매처 →</a>' +
      '</div>' +
      '<div style="margin-top:6px;font-size:0.68rem;color:#94A3B8;">※ 공정거래위원회 심사지침 준수: 쿠팡 파트너스·예스24 제휴 활동의 일환으로 일정액의 수수료를 제공받습니다.</div>';
    if (document.body) document.body.appendChild(bar);
  }

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
    showWorkbookPrepBridge(p);
    if (typeof window !== 'undefined' && typeof window.__hitKidsFitKpiMetric === 'function') {
      window.__hitKidsFitKpiMetric('workbook_print');
    }
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  function triggerKoreanWorksheetPrint() {
    showWorkbookPrepBridge(getActiveProfile());
    if (typeof window !== 'undefined' && typeof window.__hitKidsFitKpiMetric === 'function') {
      window.__hitKidsFitKpiMetric('workbook_print');
    }
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  if (typeof document !== 'undefined' && !isJsdomEnv()) {
    var bootRx = function () {
      renderDynamicRxTop3();
      var rxTitle = document.getElementById('rx-header-title');
      if (rxTitle && typeof MutationObserver !== 'undefined') {
        var obs = new MutationObserver(function () {
          renderDynamicRxTop3();
          if (typeof window.__hitKidsFitKpiMetric === 'function') {
            window.__hitKidsFitKpiMetric('rx_complete');
          }
        });
        obs.observe(rxTitle, { childList: true, characterData: true, subtree: true });
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootRx);
    } else {
      bootRx();
    }
  }

  global.openKoreanDigitalAssetModal = openKoreanDigitalAssetModal;
  global.triggerKoreanWorksheetPrint = triggerKoreanWorksheetPrint;
  global.renderKidsFitDynamicRxTop3 = renderDynamicRxTop3;
  global.KidsFitDigitalAssetStore = {
    isDigitalAssetUnlocked: isDigitalAssetUnlocked,
    unlockDigitalAssetsNow: unlockDigitalAssetsNow,
    openKoreanDigitalAssetModal: openKoreanDigitalAssetModal,
    printVipWorkbookBundle: printVipWorkbookBundle,
    injectReportDigitalAssetBanner: injectReportDigitalAssetBanner,
    renderDynamicRxTop3: renderDynamicRxTop3
  };
})(typeof window !== 'undefined' ? window : global);

/* === HQ Edge Real-Human Visitor Beacon (kfk_kidsfitkr) === */
(function(){
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (window.__HQ_BEACON_SENT_kfk_kidsfitkr__) return;
    window.__HQ_BEACON_SENT_kfk_kidsfitkr__ = true;
    var ua = navigator.userAgent || '';
    if (navigator.webdriver || /jsdom|bot|crawl|spider|slurp|headless|lighthouse|gtmetrix|pingdom|uptimerobot|python|curl|node|axios/i.test(ua)) return;
    var host = (location && location.hostname) || '';
    if (!host || host === 'localhost' || host === '127.0.0.1') return;
    var kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    var ns = 'kfk_kidsfitkr';
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

/* === HQ KPI Conversion Tracker (5사업부: 플랫폼별 제휴 클릭 & 진단 완료 정밀 계측) === */
(function(){
  try {
    if (typeof window === 'undefined' || window.__HQ_KPI_KFK__) return;
    window.__HQ_KPI_KFK__ = true;
    var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    if ((typeof navigator !== 'undefined' && navigator.webdriver) || /jsdom|bot|crawl|spider|headless|lighthouse|python|curl/i.test(ua)) return;
    var host = (location && location.hostname) || '';
    if (!host || host === 'localhost' || host === '127.0.0.1') return;
    var kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    var ns = 'kfk_kidsfitkr';
    function hitMetric(key) {
      fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/' + key + '_' + kst, { mode: 'cors', keepalive: true }).catch(function(){});
      fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/' + key + '_total', { mode: 'cors', keepalive: true }).catch(function(){});
    }
    window.__hitKidsFitKpiMetric = hitMetric;
    function hitRefClick(networkKey) {
      hitMetric('ref_click');
      if (networkKey) hitMetric(networkKey);
    }
    var origRecord = window.recordKidsFitProductClick;
    if (typeof origRecord === 'function') {
      window.recordKidsFitProductClick = function() {
        hitRefClick('aff_modal');
        return origRecord.apply(this, arguments);
      };
    }
    document.addEventListener('click', function(e) {
      var el = e.target && e.target.closest ? e.target.closest('a, button, [role="button"]') : null;
      if (!el) return;
      var href = (el.getAttribute('href') || '').toLowerCase();
      var onclick = (el.getAttribute('onclick') || '').toLowerCase();
      var txt = (el.innerText || el.textContent || '').toLowerCase();
      if (href.indexOf('coupang.com') !== -1) {
        hitRefClick('aff_coupang');
      } else if (href.indexOf('linkprice.com') !== -1 || href.indexOf('yes24.com') !== -1) {
        hitRefClick('aff_linkprice');
      } else if (href.indexOf('iherb.com') !== -1) {
        hitRefClick('aff_iherb');
      } else if (href.indexOf('naver.me') !== -1 || href.indexOf('brandconnect.naver') !== -1) {
        hitRefClick('aff_naver_bc');
      } else if (href.indexOf('adpick') !== -1 || href.indexOf('myrealtrip') !== -1 || onclick.indexOf('openkidsfitproductmodal') !== -1 || onclick.indexOf('_openkidsfiteditorialmodal') !== -1 || onclick.indexOf('openshortsfeaturedproductmodal') !== -1 || onclick.indexOf('handlekidsfitmodalctaclick') !== -1 || onclick.indexOf('recordkidsfitproductclick') !== -1 || /혜택가 확인|공식 판매처|에디터 큐레이션/.test(txt)) {
        hitRefClick('aff_other');
      }
    }, true);
  } catch (e) {}
})();
