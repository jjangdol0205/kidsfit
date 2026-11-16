/**
 * scripts/sync_kfk_qna_masterbook_hub.js
 * Idempotently injects the Latpeed 9,900 KRW Masterbook PDF + 30-Day Checklist CTA button
 * into all 73 indexable /qna/*.html KFK_QNA_CONVERSION_HUB blocks and adds Brand Partnership
 * inquiry contact (mailto:beable9489@gmail.com) to QnA footers while preserving 100% of
 * existing Coupang (AF7865143), Naver Npay, LinkPrice YES24 (A100708867) cards & FTC disclosures.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const QNA_DIR = path.join(ROOT_DIR, 'qna');

const MASTERBOOK_BLOCK = [
  '  <!-- KFK_QNA_MASTERBOOK_SLOT_START -->',
  '  <div style="background:#FFFFFF;border:1.5px solid #93C5FD;border-radius:18px;padding:15px 16px;margin-bottom:16px;box-shadow:0 6px 18px rgba(30,64,175,0.07);">',
  '    <a href="https://kidsfit.co.kr/#kfk-latpeed-ebook-slot" data-kfk-paid-ebook="1" style="display:flex;align-items:center;justify-content:center;min-height:52px;padding:12px 16px;border-radius:14px;background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 55%,#1D4ED8 100%);color:#FDE047;font-size:14.5px;font-weight:900;line-height:1.4;text-decoration:none;text-align:center;border:1.5px solid #1E40AF;box-shadow:0 8px 20px rgba(29,78,216,0.22);word-break:keep-all;">📘 [창립 혜택가 9,900원] 우리아이 키성장·뼈나이 실전 마스터북 PDF + 30일 체크표 보러가기 →</a>',
  '  </div>',
  '  <!-- KFK_QNA_MASTERBOOK_SLOT_END -->'
].join('\n');

const HUB_PARTNERSHIP_BAR = [
  '  <!-- KFK_QNA_PARTNERSHIP_BAR_START -->',
  '  <div style="margin-top:12px;text-align:center;font-size:12.5px;font-weight:800;color:#334155;">',
  '    🤝 브랜드 협찬·광고 제휴 문의: <a href="mailto:beable9489@gmail.com" style="color:#1D4ED8;text-decoration:underline;font-weight:900;">beable9489@gmail.com</a>',
  '  </div>',
  '  <!-- KFK_QNA_PARTNERSHIP_BAR_END -->'
].join('\n');

const FOOTER_PARTNERSHIP_LINE = '    <div class="kfk-qna-footer-partnership" style="margin-bottom:0.45rem;font-weight:800;color:#334155;">🤝 브랜드 협찬·광고 제휴 문의: <a href="mailto:beable9489@gmail.com" style="color:#1D4ED8;text-decoration:underline;margin:0;">beable9489@gmail.com</a></div>';

function run() {
  const files = fs.readdirSync(QNA_DIR).filter((f) => f.endsWith('.html')).sort();
  let updatedHubCount = 0;
  let updatedFooterCount = 0;

  for (const file of files) {
    const filePath = path.join(QNA_DIR, file);
    let html = fs.readFileSync(filePath, 'utf8');
    const orig = html;

    if (html.includes('<!-- KFK_QNA_CONVERSION_HUB_START -->') && html.includes('<!-- KFK_QNA_CONVERSION_HUB_END -->')) {
      html = html.replace(
        /<!-- KFK_QNA_CONVERSION_HUB_START -->[\s\S]*?<!-- KFK_QNA_CONVERSION_HUB_END -->/,
        (hubBlock) => {
          let nextHub = hubBlock;

          // 1. Masterbook CTA button inside #kfk-qna-conversion-hub
          if (nextHub.includes('<!-- KFK_QNA_MASTERBOOK_SLOT_START -->')) {
            nextHub = nextHub.replace(
              /\s*<!-- KFK_QNA_MASTERBOOK_SLOT_START -->[\s\S]*?<!-- KFK_QNA_MASTERBOOK_SLOT_END -->/,
              '\n\n' + MASTERBOOK_BLOCK
            );
          } else {
            const curationTarget = '  <div style="background:#FFFFFF;border:1.5px solid #A7F3D0;border-radius:18px;padding:18px 16px;">';
            if (nextHub.includes(curationTarget)) {
              nextHub = nextHub.replace(curationTarget, MASTERBOOK_BLOCK + '\n\n' + curationTarget);
            } else {
              nextHub = nextHub.replace('</section>\n<!-- KFK_QNA_CONVERSION_HUB_END -->', MASTERBOOK_BLOCK + '\n</section>\n<!-- KFK_QNA_CONVERSION_HUB_END -->');
            }
          }

          // 2. If page has no <footer class="site-footer">, include clean partnership contact bar at bottom of hub
          const hasSiteFooter = /<footer[^>]*class="site-footer"/i.test(orig);
          if (!hasSiteFooter) {
            if (nextHub.includes('<!-- KFK_QNA_PARTNERSHIP_BAR_START -->')) {
              nextHub = nextHub.replace(
                /\s*<!-- KFK_QNA_PARTNERSHIP_BAR_START -->[\s\S]*?<!-- KFK_QNA_PARTNERSHIP_BAR_END -->/,
                '\n' + HUB_PARTNERSHIP_BAR
              );
            } else {
              nextHub = nextHub.replace(
                /<\/section>\s*<!-- KFK_QNA_CONVERSION_HUB_END -->/,
                HUB_PARTNERSHIP_BAR + '\n</section>\n<!-- KFK_QNA_CONVERSION_HUB_END -->'
              );
            }
          }

          return nextHub;
        }
      );
      updatedHubCount++;
    }

    // 3. Add Brand Partnership & Ad Inquiry to <footer class="site-footer"> if present
    if (/<footer[^>]*class="site-footer"/i.test(html)) {
      if (html.includes('kfk-qna-footer-partnership')) {
        html = html.replace(
          /[ \t]*<div class="kfk-qna-footer-partnership"[\s\S]*?<\/div>/,
          FOOTER_PARTNERSHIP_LINE
        );
      } else {
        html = html.replace(
          /([ \t]*<div>&copy; 2026 KIDS-FIT Growth &amp; Brain Development Studio \(kidsfit\.co\.kr\)\. All rights reserved\.<\/div>)/,
          FOOTER_PARTNERSHIP_LINE + '\n$1'
        );
      }
      updatedFooterCount++;
    }

    if (html !== orig) {
      fs.writeFileSync(filePath, html, 'utf8');
    }
  }

  console.log(`[sync_kfk_qna_masterbook_hub] Processed ${updatedHubCount} QnA conversion hubs and ${updatedFooterCount} QnA footers.`);
}

run();
