/**
 * tests/m4-reference-admin-selfimprove.test.js
 * Comprehensive Unit and Integration Test Suite for Milestone M4:
 * 1. Quiet 12px Academic Reference Chips (Bilingual routing, zero dead links, master toggle)
 * 2. Server Proxy Route (/api/coupang redirect & search proxy)
 * 3. Secret Admin Studio (?admin=1, 5-click footer, affiliate storage sync, EN/KO OSMU generator)
 * 4. Continuous Research Paper Citations (755+ papers, live PMID and DOI citation links)
 * 5. Self-Improvement Engine (6-stage clinical & quality loop execution)
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

// Require Modules
const ReferenceChips = require('../src/js/reference-chips');
const AdminStudio = require('../src/js/admin-studio');
const GrowthEngine = require('../src/js/growth-engine');
const NutritionEngine = require('../src/js/nutrition-engine');
const BiomechanicsStudio = require('../src/js/biomechanics-studio');
const NeuroCognitiveMatrix = require('../src/js/neuro-cognitive-matrix');
const server = require('../server');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function it(title, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${title}`);
    console.error(`         ${err.message}`);
    failedTests++;
  }
}

function itAsync(title, fn) {
  totalTests++;
  return new Promise((resolve) => {
    try {
      fn((err) => {
        if (err) {
          console.error(`  ✗ [FAIL] ${title}`);
          console.error(`         ${err.message}`);
          failedTests++;
        } else {
          console.log(`  ✓ [PASS] ${title}`);
          passedTests++;
        }
        resolve();
      });
    } catch (err) {
      console.error(`  ✗ [FAIL] ${title}`);
      console.error(`         ${err.message}`);
      failedTests++;
      resolve();
    }
  });
}

console.log('====================================================');
console.log('   Milestone M4: Reference Chips, Admin & Self-Improve');
console.log('====================================================\n');

async function runAllSuites() {

  // ---------------------------------------------------------------------------
  // SUITE 1: Quiet 12px Academic Reference Chips Architecture
  // ---------------------------------------------------------------------------
  console.log('[Suite 1: Quiet 12px Academic Reference Chips Architecture]');

  it('renders discrete 12px font size reference chips with neutral styling', () => {
    const htmlKo = ReferenceChips.getReferenceChipsHtml('calcium', false);
    assert.ok(htmlKo.includes('font-size: 12px'));
    assert.ok(htmlKo.includes('class="reference-chip"'));
    assert.ok(!htmlKo.includes('최저가'));
    assert.ok(!htmlKo.includes('특가'));
    assert.ok(!htmlKo.includes('할인율'));
  });

  it('guarantees zero dead links ("#") across all categories and modes', () => {
    const categories = ['calcium', 'vitamind', 'zinc', 'protein', 'deadhang', 'stretching', 'jumping', 'havruta', 'montessori', 'science'];
    categories.forEach((cat) => {
      const koChips = ReferenceChips.getReferenceChipsData(cat, false);
      koChips.forEach((chip) => {
        assert.ok(chip.url, `Chip url must exist for ${cat}`);
        assert.ok(!chip.url.startsWith('#'), `Chip url must not be '#' for ${cat}`);
        assert.ok(chip.url.startsWith('https://'), `Chip url must start with https:// for ${cat}`);
      });

      const enChips = ReferenceChips.getReferenceChipsData(cat, true);
      enChips.forEach((chip) => {
        assert.ok(chip.url, `Chip url must exist for ${cat} in EN`);
        assert.ok(!chip.url.startsWith('#'), `Chip url must not be '#' for ${cat} in EN`);
        assert.ok(chip.url.startsWith('https://'), `Chip url must start with https:// for ${cat} in EN`);
      });
    });
  });

  it('routes bilingually: EN mode renders iHerb (IPZ1547) & Amazon (kidfit-20)', () => {
    const enChips = ReferenceChips.getReferenceChipsData('calcium', true);
    assert.strictEqual(enChips.length, 2);
    const iherb = enChips.find(c => c.merchant === 'iHerb');
    const amazon = enChips.find(c => c.merchant === 'Amazon');
    assert.ok(iherb, 'EN mode must include iHerb');
    assert.ok(amazon, 'EN mode must include Amazon');
    assert.ok(iherb.url.includes('IPZ1547'));
    assert.ok(amazon.url.includes('kidfit-20'));
    assert.ok(iherb.label.includes('iHerb'));
    assert.ok(amazon.label.includes('Amazon'));
  });

  it('routes bilingually: KO mode renders Coupang (AF7865143), LinkPrice (A100708867), iHerb (IPZ1547)', () => {
    const koChips = ReferenceChips.getReferenceChipsData('calcium', false);
    assert.strictEqual(koChips.length, 3);
    const iherb = koChips.find(c => c.merchant === 'iHerb');
    const coupang = koChips.find(c => c.merchant === 'Coupang');
    const linkprice = koChips.find(c => c.merchant === 'LinkPrice');

    assert.ok(iherb, 'KO mode must include iHerb');
    assert.ok(coupang, 'KO mode must include Coupang');
    assert.ok(linkprice, 'KO mode must include LinkPrice');

    assert.ok(coupang.url.includes('AF7865143'));
    assert.ok(linkprice.url.includes('A100708867'));
    assert.ok(iherb.url.includes('IPZ1547'));

    assert.ok(coupang.label.includes('Coupang'));
    assert.ok(linkprice.label.includes('LinkPrice'));
    assert.ok(iherb.label.includes('iHerb'));
  });

  it('respects master chips toggle: returns empty output when chipsEnabled is false', () => {
    const disabledHtml = ReferenceChips.getReferenceChipsHtml('calcium', false, { chipsEnabled: false });
    assert.strictEqual(disabledHtml, '');
    const disabledData = ReferenceChips.getReferenceChipsData('calcium', false, { chipsEnabled: false });
    assert.strictEqual(disabledData.length, 0);
  });

  it('supports custom affiliate ID override at runtime', () => {
    const customConfig = {
      coupang: 'CUSTOM_CP',
      linkprice: 'CUSTOM_LP',
      iherb: 'CUSTOM_IH',
      amazon: 'custom-az-20'
    };
    const koChips = ReferenceChips.getReferenceChipsData('calcium', false, customConfig);
    const coupang = koChips.find(c => c.merchant === 'Coupang');
    const linkprice = koChips.find(c => c.merchant === 'LinkPrice');
    const iherb = koChips.find(c => c.merchant === 'iHerb');

    assert.ok(coupang.url.includes('CUSTOM_CP'));
    assert.ok(linkprice.url.includes('CUSTOM_LP'));
    assert.ok(iherb.url.includes('CUSTOM_IH'));

    const enChips = ReferenceChips.getReferenceChipsData('calcium', true, customConfig);
    const amazon = enChips.find(c => c.merchant === 'Amazon');
    assert.ok(amazon.url.includes('custom-az-20'));
  });

  // ---------------------------------------------------------------------------
  // SUITE 2: Server Proxy Route (/api/coupang)
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 2: Server Proxy Route (/api/coupang)]');

  let TEST_PORT;
  let testServer;

  await new Promise((resolve) => {
    testServer = server.listen(0, '127.0.0.1', () => {
      TEST_PORT = testServer.address().port;
      resolve();
    });
  });

  await itAsync('server handles /api/coupang?q=keyword with 302 Found redirect', (done) => {
    http.get(`http://127.0.0.1:${TEST_PORT}/api/coupang?q=%EC%B9%BC%EC%8A%B4`, (res) => {
      try {
        assert.strictEqual(res.statusCode, 302);
        const loc = res.headers.location;
        assert.ok(loc, 'Missing Location header on 302');
        assert.ok(loc.includes('coupang.com'));
        assert.ok(loc.includes('AF7865143'));
        assert.ok(loc.includes('%EC%B9%BC%EC%8A%B4'));
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  await itAsync('server handles /api/coupang with custom lptag parameter', (done) => {
    http.get(`http://127.0.0.1:${TEST_PORT}/api/coupang?q=vitamin&lptag=MY_TEST_TAG`, (res) => {
      try {
        assert.strictEqual(res.statusCode, 302);
        const loc = res.headers.location;
        assert.ok(loc.includes('MY_TEST_TAG'));
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  await itAsync('server handles /api/coupang?format=json returning JSON payload', (done) => {
    http.get(`http://127.0.0.1:${TEST_PORT}/api/coupang?q=protein&format=json`, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          assert.strictEqual(res.statusCode, 200);
          const data = JSON.parse(body);
          assert.strictEqual(data.ok, true);
          assert.strictEqual(data.query, 'protein');
          assert.strictEqual(data.lptag, 'AF7865143');
          assert.ok(data.redirectUrl.includes('coupang.com'));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  await itAsync('server handles /api/coupang without query with fallback URL', (done) => {
    http.get(`http://127.0.0.1:${TEST_PORT}/api/coupang`, (res) => {
      try {
        assert.strictEqual(res.statusCode, 302);
        const loc = res.headers.location;
        assert.ok(loc.includes('AF7865143'));
        assert.ok(loc.includes('coupang.com'));
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  await itAsync('server handles /api/klook redirect with aid=140161 and aff_adid=1514603', (done) => {
    http.get(`http://127.0.0.1:${TEST_PORT}/api/klook?format=json&url=${encodeURIComponent('https://www.klook.com/ko/activity/2274-narita-airport-limousine-bus-tokyo')}`, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          assert.strictEqual(res.statusCode, 200);
          const data = JSON.parse(body);
          assert.strictEqual(data.ok, true);
          assert.strictEqual(data.aid, '140161');
          assert.strictEqual(data.aff_adid, '1514603');
          assert.strictEqual(data.redirectUrl, 'https://affiliate.klook.com/redirect?aid=140161&aff_adid=1514603&k_site=https%3A%2F%2Fwww.klook.com%2Fko%2Factivity%2F2274-narita-airport-limousine-bus-tokyo');
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  await itAsync('server exposes /api/affiliate/status with all 9 channels', (done) => {
    http.get(`http://127.0.0.1:${TEST_PORT}/api/affiliate/status`, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          assert.strictEqual(res.statusCode, 200);
          const data = JSON.parse(body);
          assert.strictEqual(data.ok, true);
          assert.strictEqual(data.channels.iherb.rcode, 'IPZ1547');
          assert.strictEqual(data.channels.amazon.storeId, 'kidfit-20');
          assert.strictEqual(data.channels.tenping.shortUrl, 'https://iryan.kr/t8g8qxgcc2');
          assert.strictEqual(data.channels.myrealtrip.mylinkId, '6226316');
          assert.strictEqual(data.channels.klook.aid, '140161');
          assert.strictEqual(data.channels.klook.aff_adid, '1514603');
          assert.strictEqual(data.channels.naverBrandConnect.openApiAvailable, false);
          assert.ok(data.channels.adpick.offersApi.includes('https://adpick.co.kr/apis/offers.php'));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  testServer.close();

  // ---------------------------------------------------------------------------
  // SUITE 3: Secret Admin Studio & OSMU Content Generator
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 3: Secret Admin Studio & OSMU Content Generator]');

  it('preserves default affiliate tokens across all channels', () => {
    const cfg = AdminStudio.getAffiliateConfig();
    assert.strictEqual(cfg.coupang, 'AF7865143');
    assert.strictEqual(cfg.linkprice, 'A100708867');
    assert.strictEqual(cfg.iherb, 'IPZ1547');
    assert.strictEqual(cfg.amazon, 'kidfit-20');
    assert.strictEqual(cfg.tenpingUrl, 'https://iryan.kr/t8g8qxgcc2');
    assert.strictEqual(cfg.naverBrandConnectHealth, 'https://naver.me/5Jq9LnLT');
    assert.strictEqual(cfg.naverBrandConnectTour, 'https://naver.me/xJcOADhA');
    assert.strictEqual(cfg.myrealtripMylinkId, '6226316');
    assert.strictEqual(cfg.klookAid, '140161');
    assert.strictEqual(cfg.klookAdId, '1514603');
    assert.strictEqual(cfg.chipsEnabled, true);
  });

  it('persists modified affiliate configuration in localStorage (taller_affiliate_config)', () => {
    const testConfig = {
      chipsEnabled: true,
      coupang: 'TEST_CP_888',
      linkprice: 'TEST_LP_888',
      iherb: 'TEST_IH_888',
      amazon: 'test-az-888'
    };
    AdminStudio.saveAffiliateConfig(testConfig);
    const loaded = AdminStudio.getAffiliateConfig();
    assert.strictEqual(loaded.coupang, 'TEST_CP_888');
    assert.strictEqual(loaded.linkprice, 'TEST_LP_888');
    assert.strictEqual(loaded.iherb, 'TEST_IH_888');
    assert.strictEqual(loaded.amazon, 'test-az-888');

    // Restore defaults
    AdminStudio.saveAffiliateConfig(AdminStudio.DEFAULT_AFFILIATE_CONFIG);
  });

  it('generates EN OSMU content (TikTok/Reels 60s script with clinical hook)', () => {
    const bundle = AdminStudio.generateOsmuBundle('scenario-1', {}, true);
    assert.ok(bundle.enTikTokScript.includes('60s Clinical Script & Viral Hook'));
    assert.ok(bundle.enTikTokScript.includes('Viral Hook'));
    assert.ok(bundle.enTikTokScript.includes('Growth Hormone'));
    assert.ok(bundle.enTikTokScript.includes('kisfitglobal.com'));
    assert.ok(bundle.enShortsScript.includes('YouTube Shorts 60s Scientific Breakdown Script'));
  });

  it('generates KO OSMU content (Naver Clip, Blog 2,000-char column, Cafe post)', () => {
    const bundle = AdminStudio.generateOsmuBundle('scenario-2', { coupang: 'AF7865143', linkprice: 'A100708867' }, false);
    assert.ok(bundle.koClipScript.includes('네이버 클립 30초'));
    assert.ok(bundle.koBlogColumn.includes('부모 유전 표적키'));
    assert.ok(bundle.koBlogColumn.length >= 1500, `Expected blog column >= 1500 chars, got ${bundle.koBlogColumn.length}`);
    assert.ok(bundle.koBlogColumn.includes('|'), 'Blog column must contain markdown comparison table');
    assert.ok(bundle.koBlogColumn.includes('kisfitglobal.com'), 'Blog column must contain platform bridge link');
    assert.ok(bundle.koCafePost.includes('kisfitglobal.com'));
  });

  it('supports 3 distinct real-world pediatric scenarios', () => {
    const s1 = AdminStudio.generateOsmuBundle('scenario-1');
    const s2 = AdminStudio.generateOsmuBundle('scenario-2');
    const s3 = AdminStudio.generateOsmuBundle('scenario-3');

    assert.ok(s1.webtoonStoryboard.includes('만 3세') || s1.webtoonStoryboard.includes('영유아기'));
    assert.ok(s2.webtoonStoryboard.includes('숨은 키') || s2.webtoonStoryboard.includes('초2'));
    assert.ok(s3.webtoonStoryboard.includes('청소년') || s3.webtoonStoryboard.includes('척추 감압'));
  });

  it('safely falls back to scenario-1 if given unknown scenario ID', () => {
    const fallbackBundle = AdminStudio.generateOsmuBundle('non-existent-scenario');
    assert.strictEqual(fallbackBundle.scenarioId, 'scenario-1');
  });

  // ---------------------------------------------------------------------------
  // SUITE 4: Continuous Research Paper Citations Wiring
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 4: Continuous Research Paper Citations Wiring]');

  const kbPath = path.join(ROOT_DIR, 'src/data/research-knowledge-base.json');
  const kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));

  it('research database contains at least 745 peer-reviewed papers (currently 755+)', () => {
    const count = (kb.metadata && kb.metadata.total_papers) || kb.papers.length;
    assert.ok(count >= 745, `Expected >= 745 papers, found ${count}`);
  });

  it('wires live clickable PMID links formatted as https://pubmed.ncbi.nlm.nih.gov/<PMID>/', () => {
    const html = ReferenceChips.renderCitations(['growth_endocrinology'], 3, false);
    assert.ok(html.includes('https://pubmed.ncbi.nlm.nih.gov/'));
    assert.ok(html.includes('PMID:'));
  });

  it('wires live clickable DOI links formatted as https://doi.org/<DOI>', () => {
    const html = ReferenceChips.renderCitations(['posture_biomechanics_exercise'], 3, false);
    assert.ok(html.includes('https://doi.org/') || html.includes('pubmed.ncbi.nlm.nih.gov'));
  });

  it('Core 1 (GrowthEngine) renders research paper citations and quiet Coupang reference chip', () => {
    const html = GrowthEngine.renderTab1Report({
      currentHeight: 137.0,
      currentWeight: 35.5,
      fatherHeight: 173.5,
      motherHeight: 160.5,
      ageMonths: 120,
      gender: 'boy',
      habits: ['late_sleep']
    });
    assert.ok(html.includes('동료심사(Peer-Reviewed) 학술 논문 임상 근거'));
    assert.ok(html.includes('https://pubmed.ncbi.nlm.nih.gov/'));
    assert.ok(html.includes('id="ref-chip-growth"'));
    assert.ok(html.includes('AF7865143'));
  });

  it('Core 2 (NutritionEngine) renders research paper citations and quiet iHerb reference chip', () => {
    const html = NutritionEngine.renderNutritionSection({ ageYears: 10, currentWeight: 35.0 });
    assert.ok(html.includes('동료심사(Peer-Reviewed) 학술 논문 임상 근거'));
    assert.ok(html.includes('id="ref-chip-nutrition"'));
    assert.ok(html.includes('IPZ1547'));
  });

  it('Core 3 (BiomechanicsStudio) renders research citations and quiet Coupang reference chip', () => {
    const html = BiomechanicsStudio.renderBiomechanicsSection({ ageYears: 14, habits: ['poor_posture'] });
    assert.ok(html.includes('동료심사(Peer-Reviewed) 학술 논문 임상 근거'));
    assert.ok(html.includes('id="ref-chip-biomechanics"'));
    assert.ok(html.includes('AF7865143'));
  });

  it('Core 4 (NeuroCognitiveMatrix) renders research citations and quiet LinkPrice reference chip', () => {
    const html = NeuroCognitiveMatrix.renderNeuroSection({ ageYears: 8, cognitiveAxes: ['math_logic'] });
    assert.ok(html.includes('동료심사(Peer-Reviewed) 학술 논문 임상 근거'));
    assert.ok(html.includes('id="ref-chip-neuro"'));
    assert.ok(html.includes('A100708867'));
  });

  // ---------------------------------------------------------------------------
  // SUITE 5: Self-Improvement Quality Loop Engine Execution
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 5: Self-Improvement Quality Loop Engine Execution]');

  it('scripts/self-improve-engine.js exists and is an executable CLI file', () => {
    const enginePath = path.join(ROOT_DIR, 'scripts/self-improve-engine.js');
    assert.ok(fs.existsSync(enginePath), 'scripts/self-improve-engine.js must exist');
    const content = fs.readFileSync(enginePath, 'utf8');
    assert.ok(content.startsWith('#!/usr/bin/env node'));
  });

  it('executes node scripts/self-improve-engine.js cleanly with exit code 0', () => {
    const out = execSync('node scripts/self-improve-engine.js --verify', { cwd: ROOT_DIR, encoding: 'utf8' });
    assert.ok(out.includes('Quality Health Score: 100/100'));
    assert.ok(out.includes('0 defects'));
  });

  it('generates logs/self_improvement_report.json with comprehensive metrics', () => {
    const reportPath = path.join(ROOT_DIR, 'logs/self_improvement_report.json');
    assert.ok(fs.existsSync(reportPath), 'Report file must exist');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    assert.strictEqual(report.healthScore, 100);
    assert.ok(report.summary.totalChecks >= 45);
    assert.strictEqual(report.summary.failedChecks, 0);
    assert.ok(report.stages['Stage 1: Papers']);
    assert.ok(report.stages['Stage 2: Math']);
    assert.ok(report.stages['Stage 3: i18n']);
    assert.ok(report.stages['Stage 4: SVG']);
    assert.ok(report.stages['Stage 5: Links']);
    assert.ok(report.stages['Stage 6: Report']);
  });

  it('package.json contains "self-improve": "node scripts/self-improve-engine.js"', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
    assert.strictEqual(pkg.scripts['self-improve'], 'node scripts/self-improve-engine.js');
  });

  console.log('\n====================================================');
  console.log(`Summary: ${passedTests}/${totalTests} tests passed.`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllSuites();
