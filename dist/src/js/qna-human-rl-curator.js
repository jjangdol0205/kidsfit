/**
 * src/js/qna-human-rl-curator.js
 * High-Conversion Topic-Matched Affiliate Spec Comparison & Free Diagnostic Bridge for All 73 Q&A & Calc Pages (kidsfit.co.kr)
 * - 100% Coupang Partners AFFSDP/AFFSRP (AF7865143), LinkPrice Yes24 (A100708867), iHerb (IPZ1547), Naver BrandConnect.
 * - Zero prohibited words; strict rel="noopener noreferrer sponsored" & target="_blank" compliance.
 */
(function () {
  'use strict';

  var CATALOG_SPECS = {
    growth: {
      badge: '📏 신체 성장 · 야간 골단판 영양 · 숨은 키 스펙 비교',
      rlArmId: 'growth_nutrition_repeat_cart',
      rlWeight: '1.75',
      itemAName: '어린이 칼슘·마그네슘·비타민D3 복합 배합',
      itemABad: '단일 탄산칼슘 섭취 (비타민D3·마그네슘 부재 시 골기질 흡수 저하)',
      itemAGood: '칼슘 + 비타민D3 + 마그네슘 3중 시너지 배합 (밤 10시 숙면·성장판 석회화 보조)',
      itemACta: '🚀 [쿠팡 로켓배송] 어린이 칼슘·마그네슘·D3 혜택가 확인 →',
      itemAUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=qna_rl_camgd3&pageKey=7335841617&itemId=29211153321&vendorItemId=96131097426',
      itemBName: '삼나무 2단 각도조절 원목 독서대 (8,900원대)',
      itemBBad: '평평한 책상 독서 (경추 하중 18kg · 숨은 체형 키 1.8cm 손실)',
      itemBGood: '15~30도 눈높이 각도조절 원목 독서대 (경추 수직 정렬 · 숨은 키 +1.8cm 복원)',
      itemBCta: '🚀 [쿠팡 로켓배송] 각도조절 원목 독서대 혜택가 확인 →',
      itemBUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=qna_rl_bookstand&pageKey=9063539057&itemId=26612491974&vendorItemId=93585543652'
    },
    picky_gut: {
      badge: '🥄 편식 · 장내 흡수 · 액상 미네랄 학술 스펙 비교',
      rlArmId: 'picky_eater_gut_calcium',
      rlWeight: '1.70',
      itemAName: '종근당건강 락토핏 생유산균 키즈 + 아연·비타민D',
      itemABad: '당류 과다 일반 간식형 유산균 (식욕 저하 · 당 스파이크 유발)',
      itemAGood: '어린이 맞춤형 생유산균 + 정상 면역 아연·비타민D 복합 설계 (장내 흡수 환경 개선)',
      itemACta: '🚀 [쿠팡 로켓배송] 락토핏 생유산균 키즈 혜택가 확인 →',
      itemAUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=qna_rl_lactofit&pageKey=7060712643&itemId=16202759365&vendorItemId=83397339509',
      itemBName: '차일드라이프 액상 구연산 칼슘·마그네슘 (오렌지맛)',
      itemBBad: '알약·정제 삼킴 거부로 섭취 중단 (우유 기피 아동 칼슘 결핍)',
      itemBGood: '위산과 무관하게 흡수되는 액상 구연산 칼슘·마그네슘·D3 (요거트·주스 혼합 가능)',
      itemBCta: '🌿 [iHerb 공식직구] 액상 칼슘·마그네슘 혜택가 확인 →',
      itemBUrl: 'https://kr.iherb.com/pr/childlife-liquid-calcium-with-magnesium-natural-orange-flavor-16-fl-oz-473-ml/9434?rcode=IPZ1547'
    },
    posture: {
      badge: '🦴 척추 디스크 감압 · 성장판 미세하중 생체역학 비교',
      rlArmId: 'posture_biomechanics_hardware',
      rlWeight: '1.65',
      itemAName: '삼나무 각도조절 원목 독서대 (경추 거북목 예방)',
      itemABad: '스마트폰·문제집 내려다보기 (거북목 변형 · 집중 피로 가중)',
      itemAGood: '시선 15도 거치로 목·어깨 긴장 완화 및 바른 착석 습관 형성',
      itemACta: '🚀 [쿠팡 로켓배송] 원목 독서대 공식 판매처 보러가기 →',
      itemAUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=qna_rl_posture_stand&pageKey=9063539057&itemId=26612491974&vendorItemId=93585543652',
      itemBName: '무타공 실내 문틀 철봉 & 무소음 점핑 트램폴린',
      itemBBad: '하교 후 실내 좌식 생활만 지속 (성장판 수직 압전 자극 부족)',
      itemBGood: '볼프의 법칙 미세 점핑 자극 + 저녁 30초 철봉 매달리기 척추 이완',
      itemBCta: '🚀 [쿠팡 로켓배송] 무타공 실내 문틀 철봉 혜택가 확인 →',
      itemBUrl: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=qna_rl_pullupbar&pageKey=%EB%AC%B4%ED%83%80%EA%B3%B5+%EC%95%88%EC%A0%84+%EB%AC%B8%ED%8B%80+%EC%B2%A0%EB%B4%89'
    },
    toddler: {
      badge: '🧸 영유아 소근육 · 감각통합 · 시냅스 발달 교구 비교',
      rlArmId: 'toddler_fine_motor_montessori',
      rlWeight: '1.60',
      itemAName: '원목 구슬 롤러코스터 소근육 협응 교구',
      itemABad: '수동적 영상·불빛 장난감 (전두엽 능동 조작 자극 결여)',
      itemAGood: '엄지·검지 정밀 집기와 3차원 궤적 추적으로 소근육·시지각 동시 자극',
      itemACta: '🚀 [쿠팡 로켓배송] 원목 롤러코스터 교구 혜택가 확인 →',
      itemAUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=qna_rl_woodbead&pageKey=8485073446&itemId=16104062785&vendorItemId=83301332924',
      itemBName: '기적의 한글 학습 1~5권 자모음 결합 세트',
      itemBBad: '무작정 통글자 외우기 (받침·초등 알림장 받아쓰기 병목)',
      itemBGood: '소리값·자모음 결합 원리 기반 체계적 유아 문해력 첫걸음',
      itemBCta: '📚 [예스24 공식] 기적의 한글 학습 혜택가 확인 →',
      itemBUrl: 'https://click.linkprice.com/click.php?m=yes24&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=https%3A%2F%2Fwww.yes24.com%2FProduct%2FGoods%2F96662201'
    },
    learning: {
      badge: '🧠 두뇌 5각 밸런스 · 초등 문해력 · 백지복습 스펙 비교',
      rlArmId: 'cognitive_learning_problem_solver',
      rlWeight: '1.65',
      itemAName: '뿌리깊은 초등국어 독해력 단계별 워크북 (9,900원)',
      itemABad: '단순 기계적 연산 반복 학습지 (서술형 문장제 나오면 포기)',
      itemAGood: '핵심어 동그라미 · 문단 요약 훈련으로 국어·수학 서술형 동시 정복',
      itemACta: '📚 [예스24 공식] 뿌리깊은 초등국어 독해력 보러가기 →',
      itemAUrl: 'https://click.linkprice.com/click.php?m=yes24&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=https%3A%2F%2Fwww.yes24.com%2FProduct%2FGoods%2F59198169',
      itemBName: '무소음 시각 타이머 (Time Timer) & 각도조절 독서대',
      itemBBad: '스마트폰 알람 사용 (알림 유혹으로 작업기억 단절)',
      itemBGood: '남은 시간이 빨간 원으로 보이는 무소음 시각 타이머로 25분 몰입 루틴 완성',
      itemBCta: '🚀 [쿠팡 로켓배송] 무소음 시각 타이머 혜택가 확인 →',
      itemBUrl: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=qna_rl_timetimer&pageKey=%EB%AC%B4%EC%86%8C%EC%9D%8C+%EC%8B%9C%EA%B0%81+%ED%83%80%EC%9D%B4%EB%A8%B8+%EA%B3%B5%EB%B6%80+%EC%8B%9C%EA%B3%84'
    }
  };

  function detectSpecKey(slot) {
    var attr = (slot.getAttribute('data-category') || '').toLowerCase();
    var title = ((typeof document !== 'undefined' && document.title) || '').toLowerCase();
    if (/독해|문장제|수학|집중|백지복습|전두엽|학습|오답/.test(title) || attr === 'learning') return 'learning';
    if (/소근육|몬테소리|가베|영유아|애착|블록|한글/.test(title)) return 'toddler';
    if (/거북목|자세|척추|철봉|트램폴린|점핑/.test(title)) return 'posture';
    if (/편식|유산균|우유|변비|배앓이|액상/.test(title)) return 'picky_gut';
    return CATALOG_SPECS[attr] ? attr : 'growth';
  }

  function buildDeepDiagHref(specKey) {
    var path = (typeof location !== 'undefined' && location.pathname) ? location.pathname : '';
    var calcMatch = path.match(/kr-calc-(\d+)yo-(boy|girl)-height/i);
    if (calcMatch) {
      return '/?age=' + calcMatch[1] + '&gender=' + calcMatch[2].toLowerCase() + '&diag=growth';
    }
    if (specKey === 'learning') return '/?diag=brain';
    return '/?diag=growth';
  }

  var rendered = false;
  function renderHumanCuration() {
    if (rendered) return;
    var slot = document.getElementById('kf-human-curation-slot');
    if (!slot) return;
    rendered = true;

    var specKey = detectSpecKey(slot);
    var spec = CATALOG_SPECS[specKey] || CATALOG_SPECS.growth;
    var diagHref = buildDeepDiagHref(specKey);

    slot.innerHTML =
      '<section style="margin:24px 0;padding:22px;border-radius:20px;background:#FFFFFF;border:1.5px solid #BFDBFE;box-shadow:0 8px 24px rgba(29,78,216,0.07);">' +
        '<div style="display:inline-block;background:#EFF6FF;color:#1D4ED8;font-weight:800;font-size:12.5px;padding:4px 11px;border-radius:999px;margin-bottom:8px;">' +
          spec.badge +
        '</div>' +
        '<h3 style="font-size:18px;font-weight:900;color:#0F172A;margin:0 0 12px 0;line-height:1.4;">' +
          '💡 가정 실천 시 학부모님이 가장 많이 비교하는 에디터 큐레이션 스펙' +
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
          '<a href="' + spec.itemAUrl + '" data-product-category="' + specKey + '" data-rl-arm-id="' + spec.rlArmId + '" data-rl-cta-arm="arm_rocket_review" data-rl-reward-weight="' + spec.rlWeight + '" data-product-name="' + spec.itemAName + '" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;align-items:center;justify-content:center;min-height:46px;padding:12px 14px;border-radius:12px;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#FFFFFF;font-weight:800;font-size:13.5px;text-decoration:none;text-align:center;">' +
            spec.itemACta +
          '</a>' +
          '<a href="' + spec.itemBUrl + '" data-product-category="' + specKey + '" data-rl-arm-id="' + spec.rlArmId + '" data-rl-cta-arm="arm_rocket_review" data-rl-reward-weight="' + spec.rlWeight + '" data-product-name="' + spec.itemBName + '" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;align-items:center;justify-content:center;min-height:46px;padding:12px 14px;border-radius:12px;background:linear-gradient(135deg,#059669,#10B981);color:#FFFFFF;font-weight:800;font-size:13.5px;text-decoration:none;text-align:center;">' +
            spec.itemBCta +
          '</a>' +
        '</div>' +
        '<div style="margin-bottom:8px;">' +
          '<a href="https://naver.me/5Jq9LnLT" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;align-items:center;justify-content:center;min-height:42px;padding:9px 14px;border-radius:10px;background:#F0FDF4;border:1.5px solid #86EFAC;color:#166534;font-weight:800;font-size:13px;text-decoration:none;text-align:center;">' +
            '🟢 네이버 공식 건강 브랜드 큐레이션 · Npay 적립관 공식 판매처 보러가기 →' +
          '</a>' +
        '</div>' +
        '<p style="margin:6px 0 0 0;font-size:11.5px;color:#64748B;line-height:1.45;">' +
          'ℹ️ 공정거래위원회 심사지침 준수 안내: 이 포스팅은 쿠팡 파트너스(AF7865143), 링크프라이스(A100708867), 네이버 브랜드커넥트 및 iHerb(IPZ1547) 제휴 활동의 일환으로 이에 따른 일정액의 수수료를 제공받으나 구매자 가격은 동일합니다.' +
        '</p>' +
      '</section>';

    if (typeof document !== 'undefined' && document.body && !document.getElementById('kf-qna-sticky-bottom-bar')) {
      var sticky = document.createElement('div');
      sticky.id = 'kf-qna-sticky-bottom-bar';
      sticky.className = 'no-print';
      sticky.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9990;background:rgba(15,23,42,0.96);backdrop-filter:blur(8px);border-top:2px solid #3B82F6;padding:10px 14px;box-shadow:0 -8px 24px rgba(15,23,42,0.22);';
      sticky.innerHTML =
        '<div style="max-width:960px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">' +
          '<div style="color:#FFFFFF;font-size:13px;font-weight:800;line-height:1.35;">' +
            '<span style="color:#60A5FA;font-weight:900;">[키즈핏 100% 무료 진단]</span> 성장판 닫히기 전 내 아이 예상키 · A4 90일 코칭 워크북 즉시 발급' +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
            '<a href="/qna/free-worksheets.html" style="background:#10B981;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:9px 14px;font-size:13px;font-weight:900;white-space:nowrap;">' +
              '🖨️ 무료 A4 워크북 →' +
            '</a>' +
            '<a href="' + diagHref + '" style="background:#2563EB;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:9px 13px;font-size:13px;font-weight:900;white-space:nowrap;">' +
              '⚡ 1분 맞춤 진단 →' +
            '</a>' +
          '</div>' +
        '</div>';
      document.body.appendChild(sticky);
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderHumanCuration);
    } else {
      renderHumanCuration();
    }
  }
})();
