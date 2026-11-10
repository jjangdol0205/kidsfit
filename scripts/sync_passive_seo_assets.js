#!/usr/bin/env node
/**
 * 5사업부 (KidsFit Korea — https://kidsfit.co.kr)
 * Passive SEO Assets Synchronizer (sitemap.xml, rss.xml, llms.txt <-> qna/*.html)
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const qnaDir = path.join(rootDir, 'qna');
const qnaFiles = fs.readdirSync(qnaDir).filter((f) => f.endsWith('.html')).sort();

// 1. Update sitemap.xml lastmod to 2026-11-10 & ensure all 105 qna/*.html files exist
const sitemapPath = path.join(rootDir, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
sitemap = sitemap.replace(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, '<lastmod>2026-11-10</lastmod>');
for (const f of qnaFiles) {
  const url = `https://kidsfit.co.kr/qna/${f}`;
  if (!sitemap.includes(url)) {
    sitemap = sitemap.replace(
      '</urlset>',
      `  <url>\n    <loc>${url}</loc>\n    <lastmod>2026-11-10</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>`
    );
  }
}
fs.writeFileSync(sitemapPath, sitemap, 'utf8');

// 2. Update llms.txt to include all 105 qna/*.html clinical pages
const llmsPath = path.join(rootDir, 'llms.txt');
const llmsLines = [
  '# 키즈핏 그로스 스튜디오 (KidsFit Korea — https://kidsfit.co.kr)',
  '',
  '> 질병관리청(KDCA) 2017 소아청소년 성장도표 LMS 정밀 백분위 계산기 & K-DST 6대 발달 · 5대 두뇌 학습지수(LQ) 무료 진단 플랫폼.',
  '> 최종 업데이트: 2026-11-10 (KST) | 생후 0개월 신생아 ~ 만 20세 전 연령 무료 30초 진단 지원.',
  '',
  '## 1. 핵심 무료 진단 및 임상 가이드',
  '- 메인 소아성장·두뇌발달 진단 스튜디오: https://kidsfit.co.kr/',
  '- 소아성장·수면·영양·학습법 임상 Q&A 아카이브 (105종 전수 수록): https://kidsfit.co.kr/qna/',
  '- 에디터 큐레이션 연령별 맞춤 발달 교구 & 공식 판매처 보러가기 (혜택가 확인 지원): https://kidsfit.co.kr/?ep=1',
  '',
  '## 2. 주요 임상 Q&A 가이드 URL (105종 전체 동기화)'
];
for (const f of qnaFiles) {
  llmsLines.push(`- https://kidsfit.co.kr/qna/${f}`);
}
fs.writeFileSync(llmsPath, llmsLines.join('\n') + '\n', 'utf8');

// 3. Update rss.xml with all qna/*.html pages
function escapeXml(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const rssItems = [];
for (const f of qnaFiles) {
  if (f === 'index.html') continue;
  const html = fs.readFileSync(path.join(qnaDir, f), 'utf8');
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const descMatch =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  const title = titleMatch ? titleMatch[1].trim() : `키즈핏 소아성장 임상 Q&A (${f})`;
  const desc = descMatch
    ? descMatch[1].trim()
    : '질병관리청(KDCA 2017) 성장도표 및 K-DST 발달지표 기반 소아 성장·두뇌영양 임상 가이드';
  const link = `https://kidsfit.co.kr/qna/${f}`;
  rssItems.push(
    [
      '    <item>',
      `      <title>${escapeXml(title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid>${link}</guid>`,
      '      <pubDate>Tue, 10 Nov 2026 12:40:00 GMT</pubDate>',
      `      <description>${escapeXml(desc)}</description>`,
      '    </item>'
    ].join('\n')
  );
}

const rssPath = path.join(rootDir, 'rss.xml');
const rssXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0">',
  '  <channel>',
  '    <title>키즈핏 코리아 (KIDS-FIT) 소아 성장·두뇌발달 임상 연구소</title>',
  '    <link>https://kidsfit.co.kr/</link>',
  '    <description>질병관리청(KDCA 2017) 성장도표 &amp; K-DST 발달지표 기반 소아 성장·성조숙증·두뇌영양 정밀 진단 및 에디터 큐레이션</description>',
  '    <language>ko</language>',
  '    <lastBuildDate>Tue, 10 Nov 2026 12:40:00 GMT</lastBuildDate>',
  ...rssItems,
  '  </channel>',
  '</rss>',
  ''
].join('\n');
fs.writeFileSync(rssPath, rssXml, 'utf8');

console.log(`[PASS] Synced SEO assets: qna=${qnaFiles.length}, llms.txt=${qnaFiles.length} Q&A URLs, rss.xml=${rssItems.length} items, sitemap.xml lastmod=2026-11-10`);
