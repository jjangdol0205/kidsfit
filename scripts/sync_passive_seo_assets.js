#!/usr/bin/env node
/**
 * 5사업부 (KidsFit Korea — https://kidsfit.co.kr)
 * Zero-Ban Passive SEO Assets Synchronizer v2.0
 * - Consolidates regional doorway clones (qna/post-seq-*.html) into <meta name="robots" content="noindex, follow"> canonical stubs
 * - Rebuilds clean canonical sitemap.xml, rss.xml, feed.json, and llms.txt (excluding all noindex stubs; zero [:35] truncation)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const qnaDir = path.join(rootDir, 'qna');
const distDir = path.join(rootDir, 'dist');

const nowKst = new Date(Date.now() + 9 * 3600 * 1000);
const todayIso = nowKst.toISOString().slice(0, 10);
const rfcNow = new Date().toUTCString();

function escapeXml(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 1. Consolidate regional doorway clones (post-seq-*.html) into clean noindex, follow canonical stubs
const allQnaFiles = fs.existsSync(qnaDir)
  ? fs.readdirSync(qnaDir).filter((f) => f.endsWith('.html')).sort()
  : [];

let consolidatedCount = 0;
for (const f of allQnaFiles) {
  if (!/^post-seq-\d+\.html$/i.test(f)) continue;
  const fp = path.join(qnaDir, f);
  const raw = fs.readFileSync(fp, 'utf8');
  const canonMatch = raw.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const canonicalUrl = canonMatch ? canonMatch[1].trim() : 'https://kidsfit.co.kr/qna/index.html';
  const targetSlug = path.basename(canonicalUrl);
  const stubHtml = [
    '<!DOCTYPE html>',
    '<html lang="ko">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <meta name="robots" content="noindex, follow">',
    '  <meta name="googlebot" content="noindex, follow">',
    `  <link rel="canonical" href="${canonicalUrl}">`,
    '  <title>키즈핏 소아성장·두뇌발달 통합 임상 가이드 안내 | KIDS-FIT</title>',
    '  <style>body{margin:0;font-family:"Pretendard","Malgun Gothic",sans-serif;background:#F8FAFC;color:#0F172A;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1.5rem}.box{max-width:560px;background:#fff;border:1.5px solid #BFDBFE;border-radius:18px;padding:1.75rem;box-shadow:0 8px 24px rgba(15,23,42,.06)}.btn{display:inline-block;margin-top:1rem;background:#1D4ED8;color:#fff;text-decoration:none;font-weight:800;padding:.85rem 1.25rem;border-radius:12px}</style>',
    '</head>',
    '<body>',
    '  <main class="box">',
    '    <h1 style="font-size:1.22rem;margin:0 0 .65rem;">통합 임상 가이드로 안내해 드립니다</h1>',
    '    <p style="margin:0;color:#334155;line-height:1.65;">지역별 중복 문서 방지를 위해 해당 주제의 최신 통합 임상 칼럼 원문으로 일원화되었습니다. 아래 버튼을 눌러 전문과 무료 진단을 확인해 보세요.</p>',
    `    <a class="btn" href="/qna/${targetSlug}">통합 임상 칼럼 전문 보기 →</a>`,
    '  </main>',
    '</body>',
    '</html>',
    ''
  ].join('\n');

  if (!/noindex,\s*follow/i.test(raw) || raw.length > 2200) {
    fs.writeFileSync(fp, stubHtml, 'utf8');
    if (fs.existsSync(path.join(distDir, 'qna'))) {
      fs.writeFileSync(path.join(distDir, 'qna', f), stubHtml, 'utf8');
    }
    consolidatedCount++;
  }
}

// 2. Collect strictly indexable canonical Q&A pages (0 noindex pages)
const indexableQna = [];
for (const f of allQnaFiles) {
  const fp = path.join(qnaDir, f);
  const html = fs.readFileSync(fp, 'utf8');
  if (/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) {
    continue;
  }
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const descMatch =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  const title = titleMatch ? titleMatch[1].trim() : `키즈핏 소아성장 임상 가이드 (${f})`;
  const desc = descMatch
    ? descMatch[1].trim()
    : '질병관리청(KDCA 2017) 성장도표 및 K-DST 발달지표 기반 소아 성장·두뇌영양 임상 가이드';
  const url = f === 'index.html' ? 'https://kidsfit.co.kr/qna/index.html' : `https://kidsfit.co.kr/qna/${f}`;
  indexableQna.push({ file: f, url, title, desc });
}

// 3. Rebuild clean canonical sitemap.xml
const corePages = [
  { loc: 'https://kidsfit.co.kr/', prio: '1.0', freq: 'daily' },
  { loc: 'https://kidsfit.co.kr/about.html', prio: '0.7', freq: 'monthly' },
  { loc: 'https://kidsfit.co.kr/contact.html', prio: '0.6', freq: 'monthly' },
  { loc: 'https://kidsfit.co.kr/privacy.html', prio: '0.5', freq: 'yearly' },
  { loc: 'https://kidsfit.co.kr/terms.html', prio: '0.5', freq: 'yearly' }
];

const sitemapBlocks = [];
for (const p of corePages) {
  const relFile = p.loc === 'https://kidsfit.co.kr/' ? 'index.html' : p.loc.replace('https://kidsfit.co.kr/', '');
  if (fs.existsSync(path.join(rootDir, relFile))) {
    sitemapBlocks.push(
      `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${todayIso}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.prio}</priority>\n  </url>`
    );
  }
}
for (const item of indexableQna) {
  const prio = item.file === 'index.html' ? '0.92' : (item.file.startsWith('kr-deep-') || item.file.startsWith('kr-calc-') ? '0.88' : '0.84');
  sitemapBlocks.push(
    `  <url>\n    <loc>${item.url}</loc>\n    <lastmod>${todayIso}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${prio}</priority>\n  </url>`
  );
}

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapBlocks,
  '</urlset>',
  ''
].join('\n');

// 4. Rebuild full canonical llms.txt (no [:35] truncation!)
const llmsLines = [
  '# 키즈핏 그로스 스튜디오 (KidsFit Korea — https://kidsfit.co.kr)',
  '',
  '> 질병관리청(KDCA) 2017 소아청소년 성장도표 LMS 정밀 백분위 계산기 & K-DST 6대 발달 · 5대 두뇌 학습지수(LQ) 무료 진단 플랫폼.',
  `> 최종 업데이트: ${todayIso} (KST) | 생후 0개월 신생아 ~ 만 20세 전 연령 무료 30초 진단 지원.`,
  '',
  '## 1. 핵심 무료 진단 및 임상 가이드',
  '- 메인 소아성장·두뇌발달 진단 스튜디오: https://kidsfit.co.kr/',
  '- 소아성장·수면·영양·학습법 임상 Q&A 아카이브: https://kidsfit.co.kr/qna/index.html',
  '- 에디터 큐레이션 연령별 맞춤 발달 교구 & 공식 판매처 보러가기 (혜택가 확인 지원): https://kidsfit.co.kr/qna/monthly-curation.html',
  '',
  `## 2. 정규 임상 Q&A · 연령별 예상키 계산기 전체 목록 (${indexableQna.length}종 정규화 완료)`
];
for (const item of indexableQna) {
  if (item.file !== 'index.html') {
    llmsLines.push(`- [${item.title}](${item.url})`);
  }
}
const llmsTxt = llmsLines.join('\n') + '\n';

// 5. Rebuild rss.xml & feed.json (JSON Feed v1.1)
const rssItems = [];
const jsonFeedItems = [];
for (const item of indexableQna) {
  if (item.file === 'index.html') continue;
  rssItems.push(
    [
      '    <item>',
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${item.url}</link>`,
      `      <guid isPermaLink="true">${item.url}</guid>`,
      `      <pubDate>${rfcNow}</pubDate>`,
      `      <description>${escapeXml(item.desc)}</description>`,
      '    </item>'
    ].join('\n')
  );
  jsonFeedItems.push({
    id: item.url,
    url: item.url,
    title: item.title,
    summary: item.desc,
    date_published: `${todayIso}T09:00:00+09:00`,
    language: 'ko-KR'
  });
}

const rssXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
  '  <channel>',
  '    <title>키즈핏 코리아 (KIDS-FIT) 소아 성장·두뇌발달 임상 연구소</title>',
  '    <link>https://kidsfit.co.kr/</link>',
  '    <atom:link href="https://kidsfit.co.kr/rss.xml" rel="self" type="application/rss+xml" />',
  '    <atom:link href="https://pubsubhubbub.appspot.com/" rel="hub" />',
  '    <description>질병관리청(KDCA 2017) 성장도표 &amp; K-DST 발달지표 기반 소아 성장·성조숙증·두뇌영양 정밀 진단 및 에디터 큐레이션</description>',
  '    <language>ko</language>',
  `    <lastBuildDate>${rfcNow}</lastBuildDate>`,
  ...rssItems,
  '  </channel>',
  '</rss>',
  ''
].join('\n');

const feedJson = JSON.stringify(
  {
    version: 'https://jsonfeed.org/version/1.1',
    title: '키즈핏 코리아 (KIDS-FIT) 소아 성장·두뇌발달 임상 연구소',
    home_page_url: 'https://kidsfit.co.kr/',
    feed_url: 'https://kidsfit.co.kr/feed.json',
    language: 'ko-KR',
    items: jsonFeedItems
  },
  null,
  2
) + '\n';

for (const [fname, content] of [
  ['sitemap.xml', sitemapXml],
  ['llms.txt', llmsTxt],
  ['rss.xml', rssXml],
  ['feed.json', feedJson]
]) {
  fs.writeFileSync(path.join(rootDir, fname), content, 'utf8');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, fname), content, 'utf8');
  }
}

console.log(
  `[PASS] Zero-Ban KFK SEO Sync: indexable_qna=${indexableQna.length}, consolidated_doorways=${consolidatedCount}, sitemap_urls=${sitemapBlocks.length}, feed_items=${jsonFeedItems.length}`
);
