window.KFK_EBOOK_CONFIG = {
      PROVIDER: 'latpeed',
      STORE_LIVE_READY: true,
      LATPEED_LIVE_URL: 'https://www.latpeed.com/products/daMaP',
      TIER1_9900_URL: 'https://www.latpeed.com/products/daMaP',
      LATPEED_TIER2_URL: 'https://www.latpeed.com/products/_5Nq4',
      TIER2_19900_URL: 'https://www.latpeed.com/products/_5Nq4',
      LATPEED_TIER3_URL: 'https://www.latpeed.com/products/88DyN',
      TIER3_39000_URL: 'https://www.latpeed.com/products/88DyN',
      LATPEED_STORE_URL: 'https://www.latpeed.com/stores/7Frck',
      PRICE_KRW: 9900,
      TIER1_PRICE_KRW: 9900,
      TIER2_PRICE_KRW: 19900,
      PRODUCT_ID: 'daMaP',
      PRODUCT_TITLE: '단건 정밀 성장·뼈나이 리포트 패스 (17페이지 실전 마스터북 PDF 포함)',
      TIER2_PRODUCT_TITLE: '6개월 성장속도 집중 관리 풀패키지 패스'
    };
    window.HQ_MAILING_CONFIG_PATH = '/hq-mailing-endpoint.json';

    (function () {
      try {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
        var ua = navigator.userAgent || '';
        if (navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|gtmetrix|pingdom|uptimerobot|python|curl|node|axios|jsdom/i.test(ua)) return;
        var host = (location && location.hostname) || '';
        if (!host || host === 'localhost' || host === '127.0.0.1') return;
        var kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
        var ns = 'kfk_kidsfitkr';
        if (!window.__HQ_BEACON_SENT_kfk_kidsfitkr__) {
          window.__HQ_BEACON_SENT_kfk_kidsfitkr__ = true;
          if (localStorage.getItem('hq_uv_' + ns + '_' + kst) !== '1') {
            localStorage.setItem('hq_uv_' + ns + '_' + kst, '1');
          }
          if (localStorage.getItem('hq_uv_ever_' + ns) !== '1') {
            localStorage.setItem('hq_uv_ever_' + ns, '1');
          }
        }
      } catch (_) {}
    })();
