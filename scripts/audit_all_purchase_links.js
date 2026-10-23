const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load engines
const PinpointCurator = require('../src/js/pinpoint-curator.js');
const MasterBriefing = require('../src/js/master-briefing.js');
const ReferenceChips = require('../src/js/reference-chips.js');
const DevelopmentEngine = require('../src/js/development-engine.js');
const WeekendCurator = require('../src/js/weekend-curator.js');
const Monetization = require('../src/js/monetization.js');

global.TallerPinpointCurator = PinpointCurator;
global.KidsFitPinpointCurator = PinpointCurator;
global.TallerReferenceChips = ReferenceChips;
global.KidsFitReferenceChips = ReferenceChips;

function collectAllRenderedLinks() {
  const htmlChunks = [];
  const sampleProfiles = [
    { gender: 'boy', ageMonths: 36, currentHeight: 95, currentWeight: 14, fatherHeight: 175, motherHeight: 162, region: '서울 강남·서초·송파', interest: 'art', preferredReportMode: 'growth' },
    { gender: 'girl', ageMonths: 60, currentHeight: 108, currentWeight: 18, fatherHeight: 174, motherHeight: 161, region: '경기 남부(분당·수원·용인·동탄)', interest: 'nature', preferredReportMode: 'learning' },
    { gender: 'boy', ageMonths: 108, currentHeight: 133, currentWeight: 31, fatherHeight: 176, motherHeight: 163, region: '부산·경남', interest: 'history', preferredReportMode: 'growth' },
    { gender: 'girl', ageMonths: 144, currentHeight: 150, currentWeight: 42, fatherHeight: 173, motherHeight: 160, region: '대전·충청', interest: 'science', preferredReportMode: 'learning' },
  ];

  for (const prof of sampleProfiles) {
    htmlChunks.push(MasterBriefing.renderMasterBriefingCard(prof));
    htmlChunks.push(PinpointCurator.renderPinpointAndLifecycleSection(prof));
    if (DevelopmentEngine && DevelopmentEngine.renderDevelopmentReport) {
      htmlChunks.push(DevelopmentEngine.renderDevelopmentReport(prof));
    }
    if (WeekendCurator && WeekendCurator.renderWeekendCuration) {
      htmlChunks.push(WeekendCurator.renderWeekendCuration(prof));
    }
    if (Monetization && Monetization.renderMonetizationLayers) {
      htmlChunks.push(Monetization.renderMonetizationLayers(prof));
    }
  }

  const combined = htmlChunks.join('\n');
  const hrefRegex = /<a\b[^>]*?\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links = new Map();
  let m;
  while ((m = hrefRegex.exec(combined)) !== null) {
    const url = m[1].trim();
    const label = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (url.startsWith('#') || url.startsWith('javascript:')) continue;
    if (!links.has(url)) {
      links.set(url, label);
    }
  }
  return links;
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 7000,
      },
      (res) => {
        res.resume();
        resolve({
          status: res.statusCode,
          location: res.headers.location || '',
        });
      }
    );
    req.on('error', (e) => resolve({ status: 'ERR', location: e.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', location: '' });
    });
  });
}

async function main() {
  const links = collectAllRenderedLinks();
  console.log(`Total unique external/purchase links rendered across reports: ${links.size}`);

  const entries = [...links.entries()];
  const summaryByDomain = {};
  for (const [url, label] of entries) {
    let host = 'relative';
    try {
      host = new URL(url, 'https://kidsfit.co.kr').hostname;
    } catch (_) {}
    if (!summaryByDomain[host]) summaryByDomain[host] = [];
    summaryByDomain[host].push({ url, label });
  }

  for (const [host, items] of Object.entries(summaryByDomain)) {
    console.log(`\n=== Host: ${host} (${items.length} unique URLs) ===`);
    for (const item of items.slice(0, 4)) {
      const res = await checkUrl(item.url);
      console.log(`  [${res.status}] (${item.label.slice(0, 35)}) -> ${item.url.slice(0, 110)}`);
      if (res.location) {
        console.log(`       ↳ Location: ${res.location.slice(0, 120)}`);
      }
    }
  }
}

main();
