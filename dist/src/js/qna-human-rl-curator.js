/**
 * src/js/qna-human-rl-curator.js
 * 1-Tap Easy Visual Parent Shopping Curation & Real-Human Referral Beacon for All 73 Q&A & Calc Pages (kidsfit.co.kr)
 * - 100% Coupang Partners AFFSDP/AFFSRP (AF7865143), LinkPrice Yes24 (A100708867), iHerb (IPZ1547), Naver BrandConnect.
 * - Fires both `ref_click_YYYY-MM-DD` and `shop_click_YYYY-MM-DD` on `kfk_kidsfitkr` with zero misses.
 * - Zero prohibited words; strict rel="noopener noreferrer sponsored" & target="_blank" compliance; zero intermediate modals.
 */
(function () {
  'use strict';

  /* 1. Idempotent Real-Human Abacus Visitor & 1-Tap Shopping Click Beacon (kfk_kidsfitkr) */
  function initKidsfitQnaBeacon() {
    try {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
      var ua = navigator.userAgent || '';
      if (navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|gtmetrix|pingdom|uptimerobot|python|curl|node|axios|jsdom/i.test(ua)) return;
      var host = (typeof location !== 'undefined' && location.hostname) ? location.hostname : '';
      if (!host || host === 'localhost' || host === '127.0.0.1') return;
      var kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
      var ns = 'kfk_kidsfitkr';
      if (!window.__HQ_BEACON_SENT_kfk_kidsfitkr__) {
        window.__HQ_BEACON_SENT_kfk_kidsfitkr__ = true;
        fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/pv_' + kst, { mode: 'cors', keepalive: true }).catch(function () {});
        fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/pv_total', { mode: 'cors', keepalive: true }).catch(function () {});
        if (localStorage.getItem('hq_uv_' + ns + '_' + kst) !== '1') {
          localStorage.setItem('hq_uv_' + ns + '_' + kst, '1');
          fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/uv_' + kst, { mode: 'cors', keepalive: true }).catch(function () {});
        }
        if (localStorage.getItem('hq_uv_ever_' + ns) !== '1') {
          localStorage.setItem('hq_uv_ever_' + ns, '1');
          fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/uv_total', { mode: 'cors', keepalive: true }).catch(function () {});
        }
      }
      if (!window.__HQ_CLICK_TRACKER_KFK__) {
        window.__HQ_CLICK_TRACKER_KFK__ = true;
        document.addEventListener('click', function (e) {
          if (e && e.__kfkShopTracked) return;
          var el = e.target && e.target.closest ? e.target.closest('a, button, [role="button"]') : null;
          if (!el) return;
          var href = (el.getAttribute('href') || '').toLowerCase();
          if (href.indexOf('naver.me/g2ysidq1') !== -1) return;
          if (href.indexOf('#kfk-latpeed-ebook-slot') !== -1 || el.getAttribute('data-kfk-paid-ebook') === '1') return;
          var txt = (el.innerText || el.textContent || '').toLowerCase();
          if (
            el.getAttribute('data-shop-click') === '1' ||
            el.getAttribute('data-product-category') ||
            href.indexOf('coupang.com') !== -1 ||
            href.indexOf('iherb.com') !== -1 ||
            href.indexOf('yes24.com') !== -1 ||
            href.indexOf('click.linkprice.com') !== -1 ||
            href.indexOf('brandconnect.naver.com') !== -1 ||
            href.indexOf('naver.me') !== -1 ||
            href.indexOf('coupang-kidsfit.html') !== -1 ||
            /혜택가 확인|공식 판매처|에디터 큐레이션|안심 큐레이션 확인|쿠팡|적립관|셀렉트샵|보러가기/.test(txt)
          ) {
            if (e) e.__kfkShopTracked = true;
            var nowTs = Date.now();
            if (window.__LAST_KFK_SHOP_CLICK_TS__ && (nowTs - window.__LAST_KFK_SHOP_CLICK_TS__) < 300) return;
            window.__LAST_KFK_SHOP_CLICK_TS__ = nowTs;
            fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/ref_click_' + kst, { mode: 'cors', keepalive: true }).catch(function () {});
            fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/ref_click_total', { mode: 'cors', keepalive: true }).catch(function () {});
            fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/shop_click_' + kst, { mode: 'cors', keepalive: true }).catch(function () {});
            fetch('https://abacus.jasoncameron.dev/hit/' + ns + '/shop_click_total', { mode: 'cors', keepalive: true }).catch(function () {});
          }
        }, true);
      }
    } catch (_) {}
  }

  /* 2. Plain, Parent-Friendly 1-Tap Best Curation Catalog (0 Academic Jargon, Real Thumbnails) */
  var CATALOG_SPECS = {
    growth: {
      badge: '📏 키 성장 영양 · 바른 책상 자세 베스트 2선',
      rlArmId: 'growth_nutrition_repeat_cart',
      rlWeight: '1.75',
      itemAImg: '/src/images/products/prod_ch_nut_1.webp',
      itemATag: '🚀 쿠팡 로켓배송 · 기준가 33,530원대',
      itemAName: '어린이 칼슘·마그네슘·비타민D 츄어블 (4통)',
      itemAReason: '밤 10시 성장 골든타임 전후 뼈 형성에 꼭 필요한 칼슘·마그네슘·비타민D를 코코아맛으로 맛있게 챙겨요.',
      itemACta: '🚀 터치 1번으로 공식 판매처 혜택가 확인 →',
      itemAUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=qna_rl_camgd3&pageKey=7335841617&itemId=29211153321&vendorItemId=96131097426',
      itemBImg: '/src/images/products/prod_ch_hot_1.webp',
      itemBTag: '🚀 쿠팡 로켓배송 · 기준가 8,900원대',
      itemBName: '친환경 삼나무 2단 각도조절 원목 독서대',
      itemBReason: '문제집 볼 때 구부정하게 숙이는 목을 펴줘서 숨은 체형 키와 집중력을 함께 지켜주는 가성비 필수템이에요.',
      itemBCta: '🚀 터치 1번으로 공식 판매처 혜택가 확인 →',
      itemBUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=qna_rl_bookstand&pageKey=9063539057&itemId=26612491974&vendorItemId=93585543652'
    },
    picky_gut: {
      badge: '🥄 편식 · 배앓이 · 액상 칼슘 흡수 베스트 2선',
      rlArmId: 'picky_eater_gut_calcium',
      rlWeight: '1.70',
      itemAImg: '/src/images/products/prod_tod_nut_1.webp',
      itemATag: '🚀 쿠팡 로켓배송 · 기준가 14,760원대',
      itemAName: '종근당건강 락토핏 생유산균 키즈 + 아연·비타민D',
      itemAReason: '밥 잘 안 먹고 배앓이 잦은 아이의 장 건강과 정상 면역 기능(아연)을 하루 한 포로 간편하게 챙겨요.',
      itemACta: '🚀 터치 1번으로 공식 판매처 혜택가 확인 →',
      itemAUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=qna_rl_lactofit&pageKey=7060712643&itemId=16202759365&vendorItemId=83397339509',
      itemBImg: '/src/images/products/prod_inf_nut_2.webp',
      itemBTag: '🌿 iHerb 공식직구 · 오렌지맛 액상',
      itemBName: '차일드라이프 액상 칼슘·마그네슘·비타민D3',
      itemBReason: '우유를 싫어하거나 알약을 못 삼키는 아이도 요거트·주스에 섞어 거부감 없이 먹는 고흡수 액상 칼슘이에요.',
      itemBCta: '🌿 터치 1번으로 공식 판매처 혜택가 확인 →',
      itemBUrl: 'https://kr.iherb.com/pr/childlife-liquid-calcium-with-magnesium-natural-orange-flavor-16-fl-oz-473-ml/9434?rcode=IPZ1547'
    },
    posture: {
      badge: '🦴 거북목 예방 · 실내 성장판 점핑 베스트 2선',
      rlArmId: 'posture_biomechanics_hardware',
      rlWeight: '1.65',
      itemAImg: '/src/images/products/prod_ch_hot_1.webp',
      itemATag: '🚀 쿠팡 로켓배송 · 기준가 8,900원대',
      itemAName: '친환경 삼나무 각도조절 와이드 원목 독서대',
      itemAReason: '책상 위 시선을 15도 높여 스마트폰·독서 거북목을 막고 바르게 앉는 습관을 길러줘요.',
      itemACta: '🚀 터치 1번으로 공식 판매처 보러가기 →',
      itemAUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=qna_rl_posture_stand&pageKey=9063539057&itemId=26612491974&vendorItemId=93585543652',
      itemBImg: '/src/images/products/prod_tod_gear_1.webp',
      itemBTag: '🚀 쿠팡 로켓배송 · 층간소음 안심',
      itemBName: '무타공 안전 실내 문틀 철봉 & 스트레칭 바',
      itemBReason: '하교 후 저녁 30초 가볍게 매달려 하루 종일 눌린 척추를 쭉 펴주는 실내 성장 운동기구예요.',
      itemBCta: '🚀 터치 1번으로 공식 판매처 혜택가 확인 →',
      itemBUrl: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=qna_rl_pullupbar&pageKey=%EB%AC%B4%ED%83%80%EA%B3%B5+%EC%95%88%EC%A0%84+%EB%AC%B8%ED%8B%80+%EC%B2%A0%EB%B4%89'
    },
    toddler: {
      badge: '🧸 영유아 소근육 놀이 · 첫 한글 문해 베스트 2선',
      rlArmId: 'toddler_fine_motor_montessori',
      rlWeight: '1.60',
      itemAImg: '/src/images/products/prod_inf_dev_1.webp',
      itemATag: '🚀 쿠팡 로켓배송 · 기준가 21,300원대',
      itemAName: '고려베이비 동물 과일 원목 롤러코스터 구슬 교구',
      itemAReason: '영상 대신 손가락으로 알록달록 구슬을 옮기며 소근육과 눈-손 집중력을 쑥쑥 키워주는 원목 장난감이에요.',
      itemACta: '🚀 터치 1번으로 공식 판매처 혜택가 확인 →',
      itemAUrl: 'https://link.coupang.com/re/AFFSDP?lptag=AF7865143&subid=qna_rl_woodbead&pageKey=8485073446&itemId=16104062785&vendorItemId=83301332924',
      itemBImg: '/src/images/products/prod_tod_learn_1.webp',
      itemBTag: '📚 예스24 공식 · 유아 한글 베스트셀러',
      itemBName: '기적의 한글 학습 1~5권 단계별 세트 (길벗스쿨)',
      itemBReason: '무작정 통글자를 외우지 않고 소리 원리로 재미있게 깨쳐서 초등 받아쓰기까지 든든해지는 첫 한글책이에요.',
      itemBCta: '📚 터치 1번으로 공식 판매처 혜택가 확인 →',
      itemBUrl: 'https://click.linkprice.com/click.php?m=yes24&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=https%3A%2F%2Fwww.yes24.com%2FProduct%2FSearch%3Fdomain%3DALL%26query%3D%25EA%25B8%25B0%25EC%25A0%2581%25EC%259D%2598%2520%25ED%2595%259C%25EA%25B8%2580%2520%25ED%2595%2599%25EC%258A%25B5'
    },
    learning: {
      badge: '🧠 초등 문해력 · 25분 스스로 집중 루틴 베스트 2선',
      rlArmId: 'cognitive_learning_problem_solver',
      rlWeight: '1.65',
      itemAImg: '/src/images/products/prod_ch_learn_1.webp',
      itemATag: '📚 예스24 공식 · 기준가 9,900원',
      itemAName: '뿌리깊은 초등국어 독해력 단계별 워크북 (마더텅)',
      itemAReason: '긴 서술형 수학 문제와 국어 지문을 어려워하는 아이가 하루 10분씩 스스로 핵심어를 찾게 도와주는 교재예요.',
      itemACta: '📚 터치 1번으로 공식 판매처 보러가기 →',
      itemAUrl: 'https://click.linkprice.com/click.php?m=yes24&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=https%3A%2F%2Fwww.yes24.com%2FProduct%2FGoods%2F59198169',
      itemBImg: '/src/images/products/prod_ch_dev_1.webp',
      itemBTag: '🚀 쿠팡 로켓배송 · 무소음 집중 시계',
      itemBName: '무소음 시각 타이머 (공부 시계) & 집중 루틴템',
      itemBReason: '스마트폰 알람 대신 남은 시간이 색깔로 한눈에 보여서 잔소리 없이 25분 앉아 있는 습관을 만들어줘요.',
      itemBCta: '🚀 터치 1번으로 공식 판매처 혜택가 확인 →',
      itemBUrl: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=qna_rl_timetimer&pageKey=%EB%AC%B4%EC%86%8C%EC%9D%8C+%EC%8B%9C%EA%B0%81+%ED%83%80%EC%9D%B4%EB%A8%B8+%EA%B3%B5%EB%B6%80+%EC%8B%9C%EA%B3%84'
    }
  };

  function detectSpecKey(slot) {
    var attr = (slot && slot.getAttribute('data-category') ? slot.getAttribute('data-category') : '').toLowerCase();
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

  function buildVisualCardHtml(img, tag, name, reason, cta, url, specKey, rlArmId, rlWeight, btnBg) {
    return (
      '<div style="display:flex;flex-direction:column;justify-content:space-between;background:#F8FAFC;border:1.5px solid #DBEAFE;border-radius:16px;padding:16px;gap:12px;">' +
        '<div style="display:flex;gap:12px;align-items:flex-start;">' +
          '<img src="' + img + '" alt="' + name.replace(/"/g, '&quot;') + '" width="80" height="80" loading="lazy" style="width:80px;height:80px;object-fit:contain;border-radius:12px;background:#FFFFFF;border:1px solid #E2E8F0;padding:4px;flex-shrink:0;">' +
          '<div style="min-width:0;">' +
            '<div style="display:inline-block;background:#EFF6FF;color:#1D4ED8;font-size:12px;font-weight:800;padding:3px 9px;border-radius:999px;margin-bottom:5px;">' + tag + '</div>' +
            '<div style="font-size:16px;font-weight:900;color:#0F172A;line-height:1.35;margin-bottom:5px;">' + name + '</div>' +
            '<p style="margin:0;font-size:13.5px;color:#334155;line-height:1.48;">' + reason + '</p>' +
          '</div>' +
        '</div>' +
        '<a href="' + url + '" data-shop-click="1" data-product-category="' + specKey + '" data-rl-arm-id="' + rlArmId + '" data-rl-cta-arm="arm_rocket_review" data-rl-reward-weight="' + rlWeight + '" data-product-name="' + name.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;align-items:center;justify-content:center;min-height:54px;padding:13px 16px;border-radius:13px;background:' + btnBg + ';color:#FFFFFF;font-weight:900;font-size:15px;text-decoration:none;text-align:center;box-shadow:0 6px 16px rgba(29,78,216,0.18);">' +
          cta +
        '</a>' +
      '</div>'
    );
  }

  var rendered = false;
  function isSubstackEssayLayout() {
    try {
      if (typeof document !== "undefined" && document.body && document.body.classList && document.body.classList.contains("kfk-substack-essay")) {
        return true;
      }
      var p = (typeof location !== "undefined" && location.pathname) ? location.pathname : "";
      return /\/qna\/(essay-|topic-|editorial-)/i.test(p);
    } catch (_) {
      return false;
    }
  }

  function renderHumanCuration() {
    initKidsfitQnaBeacon();
    if (isSubstackEssayLayout()) {
      hydrateSubstackSubscribeBox();
      return;
    }
    if (rendered) return;
    var slot = document.getElementById('kf-human-curation-slot');
    if (!slot) return;
    rendered = true;

    var specKey = detectSpecKey(slot);
    var spec = CATALOG_SPECS[specKey] || CATALOG_SPECS.growth;
    var diagHref = buildDeepDiagHref(specKey);

    /* Inject compact 1-Tap Top Quick Strip right below <h1> if the article doesn't already have .aff-grid above the fold */
    if (typeof document !== 'undefined' && !document.querySelector('.aff-grid') && !document.getElementById('kf-qna-top-onetap-strip')) {
      var h1 = document.querySelector('h1');
      if (h1 && h1.parentNode) {
        var topStrip = document.createElement('div');
        topStrip.id = 'kf-qna-top-onetap-strip';
        topStrip.style.cssText = 'margin:14px 0 18px;padding:14px 16px;border-radius:16px;background:linear-gradient(135deg,#EFF6FF 0%,#F0FDF4 100%);border:1.5px solid #93C5FD;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;';
        topStrip.innerHTML =
          '<div style="display:flex;align-items:center;gap:10px;min-width:220px;flex:1;">' +
            '<img src="' + spec.itemAImg + '" alt="" width="48" height="48" style="width:48px;height:48px;object-fit:contain;border-radius:10px;background:#FFFFFF;border:1px solid #DBEAFE;padding:3px;flex-shrink:0;">' +
            '<div style="font-size:14px;font-weight:800;color:#0F172A;line-height:1.38;">' +
              '<span style="color:#1D4ED8;font-weight:900;">🛍️ 이 글 학부모님 최다 선택 육아템</span><br>' +
              '<span style="font-size:13px;color:#334155;font-weight:700;">' + spec.itemAName + '</span>' +
            '</div>' +
          '</div>' +
          '<a href="' + spec.itemAUrl + '" data-shop-click="1" data-product-category="' + specKey + '" target="_blank" rel="noopener noreferrer sponsored" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:10px 16px;border-radius:12px;background:#1D4ED8;color:#FFFFFF;font-size:14px;font-weight:900;text-decoration:none;white-space:nowrap;">' +
            '🚀 공식 판매처 혜택가 확인 →' +
          '</a>';
        if (h1.nextSibling) {
          h1.parentNode.insertBefore(topStrip, h1.nextSibling);
        } else {
          h1.parentNode.appendChild(topStrip);
        }
      }
    }

    slot.innerHTML =
      '<section style="margin:24px 0;padding:22px;border-radius:20px;background:#FFFFFF;border:2px solid #93C5FD;box-shadow:0 10px 28px rgba(29,78,216,0.08);">' +
        '<div style="display:inline-block;background:#EFF6FF;color:#1D4ED8;font-weight:800;font-size:13px;padding:5px 12px;border-radius:999px;margin-bottom:8px;">' +
          spec.badge +
        '</div>' +
        '<h3 style="font-size:19px;font-weight:900;color:#0F172A;margin:0 0 6px 0;line-height:1.38;">' +
          '🛍️ 우리 아이 고민에 딱 맞는 추천 육아템 (터치 1번 공식 판매처 이동)' +
        '</h3>' +
        '<p style="margin:0 0 14px 0;font-size:14px;color:#475569;line-height:1.45;">' +
          '복잡한 비교 없이 학부모님 만족도가 높은 2가지 핵심 품목만 추렸습니다. 버튼을 누르면 공식 판매처로 바로 연결됩니다.' +
        '</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-bottom:12px;">' +
          buildVisualCardHtml(spec.itemAImg, spec.itemATag, spec.itemAName, spec.itemAReason, spec.itemACta, spec.itemAUrl, specKey, spec.rlArmId, spec.rlWeight, 'linear-gradient(135deg,#2563EB,#1D4ED8)') +
          buildVisualCardHtml(spec.itemBImg, spec.itemBTag, spec.itemBName, spec.itemBReason, spec.itemBCta, spec.itemBUrl, specKey, spec.rlArmId, spec.rlWeight, 'linear-gradient(135deg,#059669,#047857)') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-bottom:8px;">' +
          '<a href="/coupang-kidsfit.html" data-shop-click="1" style="display:flex;align-items:center;justify-content:center;min-height:46px;padding:10px 14px;border-radius:12px;background:#EFF6FF;border:1.5px solid #93C5FD;color:#1E3A8A;font-weight:900;font-size:13.5px;text-decoration:none;text-align:center;">' +
            '🍼 신생아~초등 쿠팡 인플루언서 16종 전체 추천관 보기 →' +
          '</a>' +
          '<a href="https://brandconnect.naver.com/affiliates/1016189312116325?channelProductNo=12015952747&amp;ac=crtshp&amp;cid=1016094238062720" data-shop-click="1" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;align-items:center;justify-content:center;min-height:46px;padding:10px 14px;border-radius:12px;background:#F0FDF4;border:1.5px solid #86EFAC;color:#166534;font-weight:900;font-size:13.5px;text-decoration:none;text-align:center;">' +
            '🟢 네이버페이(Npay) 적립 · 어린이 칼마디+K2 공식 판매처 보러가기 →' +
          '</a>' +
        '</div>' +
        '<p style="margin:8px 0 0 0;font-size:11.5px;color:#64748B;line-height:1.45;">' +
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
            '<span style="color:#60A5FA;font-weight:900;">[키즈핏 100% 무료 진단]</span> 내 아이 예상키 측정 &amp; 연령별 추천 육아템 한눈에 보기' +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
            '<a href="' + spec.itemAUrl + '" data-shop-click="1" target="_blank" rel="noopener noreferrer sponsored" style="background:#10B981;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:9px 14px;font-size:13px;font-weight:900;white-space:nowrap;">' +
              '🚀 베스트 육아템 혜택가 확인 →' +
            '</a>' +
            '<a href="' + diagHref + '" style="background:#2563EB;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:9px 13px;font-size:13px;font-weight:900;white-space:nowrap;">' +
              '⚡ 1분 무료 진단 →' +
            '</a>' +
          '</div>' +
        '</div>';
      document.body.appendChild(sticky);
    }
  }

  var QNA_HUB_SEG_LABELS = {
    kr_early_elementary: '유아·초등 저학년 (기초 성장습관기)',
    kr_upper_golden_time: '초등 고학년 (사춘기 전 급성장 골든타임)',
    kr_teen_closing_care: '중·고등학생 (성장판 마무리·자세 집중기)'
  };

  window.selectKfkQnaHubSegment = function (segKey) {
    if (!QNA_HUB_SEG_LABELS[segKey] || typeof document === 'undefined') return;
    var hub = document.getElementById('kfk-qna-conversion-hub');
    if (hub) hub.setAttribute('data-active-segment', segKey);
    var btns = document.querySelectorAll('#kfk-qna-conversion-hub [data-kfk-qna-seg]');
    for (var i = 0; i < btns.length; i++) {
      var isAct = btns[i].getAttribute('data-kfk-qna-seg') === segKey;
      btns[i].setAttribute('aria-pressed', isAct ? 'true' : 'false');
      btns[i].style.background = isAct ? '#1D4ED8' : '#FFFFFF';
      btns[i].style.color = isAct ? '#FFFFFF' : '#1E293B';
      btns[i].style.borderColor = isAct ? '#1D4ED8' : '#CBD5E1';
    }
  };

  window.submitKfkQnaHubSignup = function (ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    if (typeof document === 'undefined') return false;
    var hub = document.getElementById('kfk-qna-conversion-hub');
    var emailEl = document.getElementById('kfk-qna-hub-email');
    var hpEl = document.getElementById('kfk-qna-hub-hp');
    var fbEl = document.getElementById('kfk-qna-hub-feedback');
    var btnEl = document.getElementById('btn-kfk-qna-hub-submit');
    var email = emailEl ? String(emailEl.value || '').trim().toLowerCase() : '';
    var websiteHp = hpEl ? String(hpEl.value || '').trim() : '';
    var segKey = (hub && hub.getAttribute('data-active-segment')) || 'kr_upper_golden_time';
    if (!QNA_HUB_SEG_LABELS[segKey]) segKey = 'kr_upper_golden_time';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (fbEl) {
        fbEl.style.display = 'block';
        fbEl.style.background = '#FEF2F2';
        fbEl.style.color = '#B91C1C';
        fbEl.textContent = '이메일 주소를 정확히 입력해 주세요 (예: mom@naver.com)';
      }
      if (emailEl) emailEl.focus();
      return false;
    }

    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = '3초 무료 정회원 등록 중...';
    }

    var onDone = function () {
      try {
        var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
        var host = (typeof location !== 'undefined' && location.hostname) ? location.hostname : '';
        var nowMs = Date.now();
        if (host && host !== 'localhost' && host !== '127.0.0.1' && !(typeof navigator !== 'undefined' && navigator.webdriver) && !/jsdom|bot|crawl|spider|headless|lighthouse|python|curl/i.test(ua)) {
          if (!window.__LAST_KFK_SIGNUP_BEACON_TS__ || (nowMs - window.__LAST_KFK_SIGNUP_BEACON_TS__) >= 1500) {
            window.__LAST_KFK_SIGNUP_BEACON_TS__ = nowMs;
            var kst = new Date(nowMs + 9 * 3600 * 1000).toISOString().slice(0, 10);
            fetch('https://abacus.jasoncameron.dev/hit/kfk_kidsfitkr/signup_' + kst, { mode: 'cors', keepalive: true }).catch(function () {});
            fetch('https://abacus.jasoncameron.dev/hit/kfk_kidsfitkr/signup_total', { mode: 'cors', keepalive: true }).catch(function () {});
          }
        }
      } catch (_) {}
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = '💌 3초 무료 정회원 등록하기 →';
      }
      if (fbEl) {
        fbEl.style.display = 'block';
        fbEl.style.background = '#ECFDF5';
        fbEl.style.color = '#065F46';
        fbEl.innerHTML = '✅ <strong>키즈핏 성장수첩 정회원 등록 완료!</strong> (' + email.replace(/[<>"&]/g, '') + ' · ' + QNA_HUB_SEG_LABELS[segKey] + ')<br>아이 성장단계에 맞춘 수면·영양·바른자세 에디터 가이드를 보내드립니다. <a href="/#kfk-bone-age-interpreter" style="color:#047857;font-weight:900;text-decoration:underline;">🦴 병원 뼈나이 1분 무료 해석기 바로가기 →</a>';
      }
    };

    if (window.DreamCompanyCRM && typeof window.DreamCompanyCRM.registerMember === 'function') {
      window.DreamCompanyCRM.registerMember({
        div: 'KFK',
        email: email,
        segment: segKey,
        lang: 'ko-KR',
        website_hp: websiteHp,
        message: 'KFK_QnA_Conversion_Hub'
      }).then(onDone).catch(onDone);
    } else {
      try {
        if (window.localStorage) {
          window.localStorage.setItem('dc_member_KFK', JSON.stringify({
            div: 'KFK',
            email: email,
            segment: segKey,
            joined_at: new Date().toISOString()
          }));
        }
      } catch (_) {}
      onDone();
    }
    return false;
  };

  function hydrateKfkQnaConversionHub() {
    try {
      if (typeof document === 'undefined') return;
      var hub = document.getElementById('kfk-qna-conversion-hub');
      if (!hub) return;
      var defaultSeg = hub.getAttribute('data-default-segment') || 'kr_upper_golden_time';
      window.selectKfkQnaHubSegment(defaultSeg);
      var saved = (window.DreamCompanyCRM && window.DreamCompanyCRM.getLocalMember && window.DreamCompanyCRM.getLocalMember('KFK')) || null;
      if (!saved && window.localStorage) {
        var raw = window.localStorage.getItem('dc_member_KFK');
        if (raw) saved = JSON.parse(raw);
      }
      if (saved && saved.email) {
        var emailEl = document.getElementById('kfk-qna-hub-email');
        var fbEl = document.getElementById('kfk-qna-hub-feedback');
        if (emailEl && !emailEl.value) emailEl.value = saved.email;
        if (saved.segment && QNA_HUB_SEG_LABELS[saved.segment]) {
          window.selectKfkQnaHubSegment(saved.segment);
        }
        if (fbEl) {
          fbEl.style.display = 'block';
          fbEl.style.background = '#ECFDF5';
          fbEl.style.color = '#065F46';
          fbEl.innerHTML = '💚 <strong>성장수첩 정회원 구독 중:</strong> ' + String(saved.email).replace(/[<>"&]/g, '') + ' · 맞춤 단계: ' + QNA_HUB_SEG_LABELS[saved.segment || defaultSeg];
        }
      }
    } catch (_) {}
  }


  window.copyKfkSubstackLink = function (btnEl) {
    try {
      var url = (typeof window !== "undefined" && window.location && window.location.href) ? window.location.href : "https://kidsfit.co.kr/qna/essay-quiet-night-growth-note.html";
      var done = function () {
        if (!btnEl) return;
        var orig = btnEl.getAttribute("data-orig-label") || btnEl.textContent;
        btnEl.setAttribute("data-orig-label", orig);
        btnEl.textContent = "링크 복사됨 ✓";
        setTimeout(function () { btnEl.textContent = orig; }, 2200);
      };
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(done);
      } else {
        done();
      }
    } catch (_) {}
  };

  window.shareKfkSubstackEssay = function (btnEl) {
    try {
      var url = (typeof window !== "undefined" && window.location && window.location.href) ? window.location.href : "https://kidsfit.co.kr/qna/essay-quiet-night-growth-note.html";
      var title = (typeof document !== "undefined" && document.title) ? document.title : "키즈핏 소아성장 연구소 노트";
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        navigator.share({ title: title, url: url }).catch(function () {});
      } else {
        window.copyKfkSubstackLink(btnEl);
      }
    } catch (_) {}
  };

  function hydrateSubstackSubscribeBox() {
    try {
      if (typeof document === "undefined") return;
      var saved = (window.DreamCompanyCRM && window.DreamCompanyCRM.getLocalMember && window.DreamCompanyCRM.getLocalMember("KFK")) || null;
      if (!saved && window.localStorage) {
        var raw = window.localStorage.getItem("dc_member_KFK");
        if (raw) saved = JSON.parse(raw);
      }
      if (saved && saved.email) {
        var emailEl = document.getElementById("kfk-substack-email");
        var fbEl = document.getElementById("kfk-substack-feedback");
        if (emailEl && !emailEl.value) emailEl.value = saved.email;
        if (fbEl) {
          fbEl.style.display = "block";
          fbEl.style.color = "#3f6212";
          fbEl.textContent = "현재 구독 중인 이메일입니다 (" + String(saved.email).replace(/[<>"&]/g, "") + "). 새 에세이가 발행되면 보내드립니다.";
        }
      }
    } catch (_) {}
  }

  window.submitKfkSubstackSubscribe = function (ev) {
    if (ev && typeof ev.preventDefault === "function") ev.preventDefault();
    if (typeof document === "undefined") return false;
    var form = (ev && ev.target && ev.target.tagName === "FORM") ? ev.target : document.getElementById("kfk-substack-subscribe-form");
    var emailEl = (form && form.querySelector('input[type="email"]')) || document.getElementById("kfk-substack-email");
    var hpEl = (form && form.querySelector('input[name="website_hp"]')) || document.getElementById("kfk-substack-hp");
    var btnEl = (form && form.querySelector('button[type="submit"]')) || document.getElementById("btn-kfk-substack-submit");
    var fbEl = document.getElementById("kfk-substack-feedback");
    var email = emailEl ? String(emailEl.value || "").trim().toLowerCase() : "";
    var websiteHp = hpEl ? String(hpEl.value || "").trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (fbEl) {
        fbEl.style.display = "block";
        fbEl.style.color = "#b91c1c";
        fbEl.textContent = "이메일 주소를 정확히 입력해 주세요 (예: parent@naver.com).";
      }
      if (emailEl) emailEl.focus();
      return false;
    }

    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = "구독 등록 중...";
    }

    var finishSub = function () {
      try {
        var ua = (typeof navigator !== "undefined" && navigator.userAgent) ? navigator.userAgent : "";
        var host = (typeof location !== "undefined" && location.hostname) ? location.hostname : "";
        var nowMs = Date.now();
        if (host && host !== "localhost" && host !== "127.0.0.1" && !(typeof navigator !== "undefined" && navigator.webdriver) && !/jsdom|bot|crawl|spider|headless|lighthouse|python|curl/i.test(ua)) {
          if (!window.__LAST_KFK_SIGNUP_BEACON_TS__ || (nowMs - window.__LAST_KFK_SIGNUP_BEACON_TS__) >= 1500) {
            window.__LAST_KFK_SIGNUP_BEACON_TS__ = nowMs;
            var kst = new Date(nowMs + 9 * 3600 * 1000).toISOString().slice(0, 10);
            fetch("https://abacus.jasoncameron.dev/hit/kfk_kidsfitkr/signup_" + kst, { mode: "cors", keepalive: true }).catch(function () {});
            fetch("https://abacus.jasoncameron.dev/hit/kfk_kidsfitkr/signup_total", { mode: "cors", keepalive: true }).catch(function () {});
          }
        }
      } catch (_) {}
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = "구독 완료 ✓";
      }
      if (fbEl) {
        fbEl.style.display = "block";
        fbEl.style.color = "#166534";
        fbEl.textContent = "구독이 등록되었습니다 (" + email.replace(/[<>"&]/g, "") + "). 다음 성장 에세이가 발행되면 이메일로 조용히 보내드리겠습니다.";
      }
    };

    var invokeCrm = function (crm) {
      if (crm && typeof crm.registerMember === "function") {
        crm.registerMember({
          div: "KFK",
          email: email,
          segment: "substack_essay_reader_kr",
          lang: "ko-KR",
          website_hp: websiteHp,
          message: "KFK_Substack_Essay_Subscribe"
        }).then(finishSub).catch(finishSub);
      } else {
        try {
          if (window.localStorage) {
            window.localStorage.setItem("dc_member_KFK", JSON.stringify({
              div: "KFK",
              email: email,
              segment: "substack_essay_reader_kr",
              joined_at: new Date().toISOString()
            }));
          }
        } catch (_) {}
        finishSub();
      }
    };

    if (window.DreamCompanyCRM && typeof window.DreamCompanyCRM.registerMember === "function") {
      invokeCrm(window.DreamCompanyCRM);
    } else {
      setTimeout(function () { invokeCrm(window.DreamCompanyCRM || null); }, 300);
    }
    return false;
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        renderHumanCuration();
        hydrateKfkQnaConversionHub();
      });
    } else {
      renderHumanCuration();
      hydrateKfkQnaConversionHub();
    }
  }
})();
