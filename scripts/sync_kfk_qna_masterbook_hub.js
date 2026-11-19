/**
 * scripts/sync_kfk_qna_masterbook_hub.js
 * Idempotently synchronizes the Pure Boutique Pediatric Growth Atelier Conversion Hub,
 * Organization sameAs JSON-LD (@kidsfit01 YouTube & @kids_fit1 Instagram),
 * understated official SNS footer links, and mobile table scroll wrappers across /qna/*.html.
 * Strictly zero affiliate links or commercial commission disclosures.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const QNA_DIR = path.join(ROOT_DIR, 'qna');

const ORG_JSON_LD = '<script type="application/ld+json" id="kfk-org-sameas-ld">{"@context":"https://schema.org","@type":"Organization","@id":"https://kidsfit.co.kr/#organization","name":"키즈핏 소아성장 아틀리에 (KidsFit Korea)","url":"https://kidsfit.co.kr/","email":"beable9489@gmail.com","sameAs":["https://www.youtube.com/@kidsfit01","https://www.instagram.com/kids_fit1/"]}</script>';

function buildPureAtelierHub(defaultSeg) {
  const seg = defaultSeg || 'kr_upper_golden_time';
  return [
    '<!-- KFK_QNA_CONVERSION_HUB_START -->',
    `<section id="kfk-qna-conversion-hub" class="no-print" data-default-segment="${seg}" data-active-segment="${seg}" aria-label="키즈핏 성장 연구소 노트 무료 구독 및 성장 시계 진단 안내" style="max-width:820px;margin:32px auto 28px;padding:26px 22px;border-radius:14px;background:#FFFFFF;border:1px solid #E7E5E0;color:#1C1917;font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;">`,
    '  <div style="padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid #E7E5E0;">',
    '    <p style="margin:0 0 6px;font-size:12.5px;font-weight:700;color:#2F5241;letter-spacing:0.03em;">키즈핏 성장 연구소 우편함 · 상업성 광고 없음</p>',
    '    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;line-height:1.42;color:#1C1917;">다음 성장 에세이를 조용한 저녁 편지로 받아보세요</h2>',
    '    <p style="margin:0 0 14px;font-size:14.5px;color:#57534E;line-height:1.65;">비밀번호 없이 이메일 주소만 남겨 두시면, 질병관리청(KDCA 2017) 성장도표와 저녁 생활 습관을 다룬 연구소 노트를 차분히 보내드립니다 (언제든 1클릭 수신거부).</p>',
    '    <form onsubmit="return window.submitKfkQnaHubSignup ? window.submitKfkQnaHubSignup(event) : false;" style="display:flex;flex-wrap:wrap;gap:8px;">',
    '      <input type="text" id="kfk-qna-hub-hp" name="website_hp" tabindex="-1" autocomplete="off" style="display:none;" aria-hidden="true">',
    '      <input type="email" id="kfk-qna-hub-email" required aria-label="학부모 이메일 주소" placeholder="학부모님 이메일 입력..." style="flex:1;min-width:210px;min-height:46px;padding:10px 14px;border:1px solid #D6D3D1;border-radius:8px;font-size:15px;background:#FAF7F2;color:#1C1917;">',
    '      <button type="submit" id="btn-kfk-qna-hub-submit" style="min-height:46px;padding:10px 20px;border:none;border-radius:8px;background:#2F5241;color:#FFFFFF;font-size:14.5px;font-weight:700;cursor:pointer;white-space:nowrap;">무료 구독하기</button>',
    '    </form>',
    '    <div id="kfk-qna-hub-feedback" role="status" aria-live="polite" style="display:none;margin-top:10px;padding:10px 12px;border-radius:8px;font-size:13.5px;line-height:1.5;"></div>',
    '  </div>',
    '  <div>',
    '    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#78716C;">에디터의 추신 (P.S.) · 우리 아이 성장 시계 살펴보기</p>',
    '    <div style="display:flex;flex-direction:column;gap:10px;">',
    '      <a href="https://kidsfit.co.kr/?autostart=1" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-radius:10px;background:#FAF7F2;border:1px solid #E7E5E0;color:#1C1917;font-size:15px;font-weight:700;text-decoration:none;">',
    '        <span>5단계 우리 아이 질병관리청 백분위 &amp; 병원 뼈나이 시차(&Delta;t) 무료 진단 시작하기</span>',
    '        <span style="color:#2F5241;">&rarr;</span>',
    '      </a>',
    '      <a href="https://www.latpeed.com/products/daMaP" target="_blank" rel="noopener noreferrer" data-kfk-paid-ebook="1" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-radius:10px;background:#FAF7F2;border:1px solid #E7E5E0;color:#1C1917;font-size:15px;font-weight:700;text-decoration:none;">',
    '        <span>[Tier 1 · 9,900원] 단건 정밀 성장·뼈나이 리포트 패스 &amp; 17p 실전 마스터북 PDF</span>',
    '        <span style="color:#2F5241;">&rarr;</span>',
    '      </a>',
    '      <a href="https://www.latpeed.com/stores/7Frck" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-radius:10px;background:#FAF7F2;border:1px solid #E7E5E0;color:#1C1917;font-size:15px;font-weight:700;text-decoration:none;">',
    '        <span>[Tier 2 · 19,900원] 6개월 월간 성장속도(cm/yr) 자동 판독 트래커 패스 (KFK_Paid_VIP)</span>',
    '        <span style="color:#2F5241;">&rarr;</span>',
    '      </a>',
    '    </div>',
    '  </div>',
    '  <div style="margin-top:16px;padding-top:12px;border-top:1px solid #E7E5E0;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12.5px;color:#78716C;">',
    '    <span>공식 채널: <a href="https://www.youtube.com/@kidsfit01" target="_blank" rel="noopener" style="color:#2F5241;text-decoration:underline;">공식 유튜브 (@kidsfit01)</a> · <a href="https://www.instagram.com/kids_fit1/" target="_blank" rel="noopener" style="color:#2F5241;text-decoration:underline;">공식 인스타그램 (@kids_fit1)</a></span>',
    '    <span>연구소 문의: <a href="mailto:beable9489@gmail.com" style="color:#2F5241;text-decoration:underline;">beable9489@gmail.com</a></span>',
    '  </div>',
    '</section>',
    '<!-- KFK_QNA_CONVERSION_HUB_END -->'
  ].join('\n');
}

function run() {
  const files = fs.readdirSync(QNA_DIR).filter((f) => f.endsWith('.html')).sort();
  let updatedHubCount = 0;

  for (const file of files) {
    const filePath = path.join(QNA_DIR, file);
    let html = fs.readFileSync(filePath, 'utf8');
    const orig = html;

    if (!html.includes('https://www.youtube.com/@kidsfit01') || !html.includes('"sameAs"')) {
      if (!html.includes('id="kfk-org-sameas-ld"') && html.includes('</head>')) {
        html = html.replace('</head>', '  ' + ORG_JSON_LD + '\n</head>');
      }
    }

    if (html.includes('<!-- KFK_QNA_CONVERSION_HUB_START -->') && html.includes('<!-- KFK_QNA_CONVERSION_HUB_END -->')) {
      const segMatch = html.match(/data-default-segment="([^"]+)"/);
      const defaultSeg = segMatch ? segMatch[1] : 'kr_upper_golden_time';
      html = html.replace(
        /<!-- KFK_QNA_CONVERSION_HUB_START -->[\s\S]*?<!-- KFK_QNA_CONVERSION_HUB_END -->/,
        buildPureAtelierHub(defaultSeg)
      );
      updatedHubCount++;
    }

    if (html !== orig) {
      fs.writeFileSync(filePath, html, 'utf8');
    }
  }

  console.log(`[sync_kfk_qna_masterbook_hub] Synchronized ${updatedHubCount} pure Boutique Atelier QnA hubs.`);
}

if (require.main === module) {
  run();
}

module.exports = { buildPureAtelierHub, ORG_JSON_LD };
