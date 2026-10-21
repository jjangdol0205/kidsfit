/**
 * tests/challenger-m12-2-browser-volume.test.js
 * 
 * Challenger 2: Browser Runtime & Volume Parity Empirical Test Suite
 * 
 * Empirically verifies:
 * 1. Volume Parity: Measures character & byte lengths of #pillar-1-container vs #pillar-2-container
 *    across Presets 1~5, guaranteeing Pillar 2 represents 40%~60% of total volume.
 * 2. Browser VM Sandbox Execution: Executes master-briefing.js in a simulated browser VM sandbox
 *    where `typeof require === 'undefined'` to guarantee offline client-side rendering functions
 *    without throwing ReferenceErrors.
 * 3. Free Note Narrative Clustering: Tests all 13 clinical clusters individually and combined,
 *    empirically confirming Growth clusters appear in Pillar 1 and Learning clusters appear in Pillar 2.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

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

// Helper: Extract inner HTML or container HTML of pillar 1 and pillar 2
function extractPillarContainers(html) {
  const p1Match = html.match(/<div id="pillar-1-container"[\s\S]*?<\/div><!-- \/#pillar-1-container -->/);
  const p2Match = html.match(/<div id="pillar-2-container"[\s\S]*?<\/div><!-- \/#pillar-2-container -->/);

  assert(p1Match, 'HTML must contain #pillar-1-container with closing comment tag');
  assert(p2Match, 'HTML must contain #pillar-2-container with closing comment tag');

  const p1Html = p1Match[0];
  const p2Html = p2Match[0];

  const p1Chars = p1Html.length;
  const p1Bytes = Buffer.byteLength(p1Html, 'utf8');

  const p2Chars = p2Html.length;
  const p2Bytes = Buffer.byteLength(p2Html, 'utf8');

  const totalChars = p1Chars + p2Chars;
  const totalBytes = p1Bytes + p2Bytes;

  const p2CharRatio = p2Chars / totalChars;
  const p2ByteRatio = p2Bytes / totalBytes;

  return {
    p1Html,
    p2Html,
    p1Chars,
    p1Bytes,
    p2Chars,
    p2Bytes,
    totalChars,
    totalBytes,
    p2CharRatio,
    p2ByteRatio,
    p2PercentChars: (p2CharRatio * 100).toFixed(1),
    p2PercentBytes: (p2ByteRatio * 100).toFixed(1)
  };
}

// Setup browser VM sandbox
function createBrowserSandbox() {
  const makeMockElement = (id, tag = 'div', attrs = {}) => {
    return {
      id,
      tagName: tag.toUpperCase(),
      attributes: Object.assign({ id }, attrs),
      style: {},
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        contains(c) { return this._set.has(c); },
        toggle(c) { if (this._set.has(c)) this._set.delete(c); else this._set.add(c); }
      },
      listeners: {},
      innerHTML: '',
      textContent: '',
      value: '',
      checked: false,
      setAttribute(k, v) { this.attributes[k] = String(v); if (k === 'id') this.id = String(v); },
      getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
      hasAttribute(k) { return this.attributes[k] !== undefined; },
      removeAttribute(k) { delete this.attributes[k]; },
      addEventListener(evt, fn) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(fn);
      },
      removeEventListener(evt, fn) {
        if (!this.listeners[evt]) return;
        this.listeners[evt] = this.listeners[evt].filter(f => f !== fn);
      },
      dispatchEvent(evt) {
        const type = typeof evt === 'string' ? evt : evt.type;
        const fns = this.listeners[type] || [];
        fns.forEach(fn => fn(evt));
      },
      click() { this.dispatchEvent({ type: 'click', preventDefault: () => {} }); }
    };
  };

  const doc = {
    documentElement: makeMockElement('html', 'html', { lang: 'ko' }),
    body: makeMockElement('body', 'body'),
    getElementById: (id) => makeMockElement(id),
    querySelector: () => null,
    querySelectorAll: () => []
  };

  const sandbox = {
    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    Set: Set,
    Map: Map,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Buffer: undefined,
    process: undefined,
    require: undefined, // Strictly undefined to simulate real browser runtime
    window: {},
    document: doc
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.global = sandbox;
  sandbox.addEventListener = () => {};
  sandbox.removeEventListener = () => {};
  vm.createContext(sandbox);
  return sandbox;
}

function loadBrowserRuntimeScripts(sandbox, isDist = false) {
  const baseDir = isDist ? path.join(ROOT_DIR, 'dist') : ROOT_DIR;

  // Complete browser script stack matching index.html dependencies
  const scripts = [
    path.join(baseDir, 'src', 'data', 'data-bundle.js'),
    path.join(baseDir, 'src', 'js', 'growth-engine.js'),
    path.join(baseDir, 'src', 'js', 'endocrinology-engine.js'),
    path.join(baseDir, 'src', 'js', 'nutrition-engine.js'),
    path.join(baseDir, 'src', 'js', 'biomechanics-studio.js'),
    path.join(baseDir, 'src', 'js', 'neuro-cognitive-matrix.js'),
    path.join(baseDir, 'src', 'js', 'growth-tracker.js'),
    path.join(baseDir, 'src', 'js', 'development-engine.js'),
    path.join(baseDir, 'src', 'js', 'weekend-curator.js'),
    path.join(baseDir, 'src', 'js', 'monetization.js'),
    path.join(baseDir, 'src', 'js', 'pinpoint-curator.js'),
    path.join(baseDir, 'src', 'js', 'admin-osmu.js'),
    path.join(baseDir, 'src', 'js', 'admin-db-dashboard.js'),
    path.join(baseDir, 'src', 'js', 'admin-studio.js'),
    path.join(baseDir, 'src', 'js', 'master-briefing.js')
  ];

  for (const scriptPath of scripts) {
    assert(fs.existsSync(scriptPath), `Script must exist: ${scriptPath}`);
    const code = fs.readFileSync(scriptPath, 'utf8');
    vm.runInContext(code, sandbox, { filename: scriptPath });
  }
}

// 13 Clinical Clusters definitions for test harness
const CLUSTER_TEST_CASES = [
  { id: 1, name: '성장통', text: '아이가 밤마다 다리가 아프고 무릎 성장통 때문에 울면서 깨요 주물러줘야 자요', pillar: 'growth', expectedBadge: '야간 성장통' },
  { id: 2, name: '부모 유전키', text: '엄마 아빠 부모 키가 작아서 우리 아이 유전적 한계로 키가 작을까봐 걱정돼요', pillar: 'growth', expectedBadge: '부모 유전키' },
  { id: 3, name: '운동 거부', text: '아이가 운동이나 줄넘기를 너무 싫어하고 안 움직이고 집에만 누워있으려 해요', pillar: 'growth', expectedBadge: '운동 싫어하는 아이' },
  { id: 4, name: '우유 거부/편식', text: '우유만 먹으면 배앓이하고 입이 짧아 고기랑 채소를 안 먹는 마른 아이예요', pillar: 'growth', expectedBadge: '우유 거부·입 짧은 아이' },
  { id: 5, name: '비염/구강호흡/수면', text: '비염과 코막힘 때문에 밤에 입 벌리고 구강호흡하며 11시 넘어서 늦게 자요', pillar: 'growth', expectedBadge: '비염·구강호흡' },
  { id: 6, name: '사춘기/골연령', text: '초등학생인데 벌써 머리냄새 나고 사춘기 2차 성징 성조숙증 뼈나이 성장판 걱정돼요', pillar: 'growth', expectedBadge: '사춘기·골연령' },
  { id: 7, name: '스마트폰/집중력', text: '아이가 스마트폰이랑 유튜브 게임에 과몰입하고 집중력이 산만해서 책을 안 봐요', pillar: 'learning', expectedBadge: '스마트폰·유튜브 과몰입' },
  { id: 8, name: '자신감/정서', text: '친구들 앞에서 발표할 때 소심하고 위축되며 작은 실수에도 울고 자존감이 낮아요', pillar: 'learning', expectedBadge: '정서 안정 & 자존감' },
  { id: 9, name: '거북목/자세', text: '책상에서 스마트폰 볼 때 거북목에 어깨가 구부정하고 자세가 비뚤어져 있어요', pillar: 'growth', expectedBadge: '거북목·구부정한 자세' },
  { id: 10, name: '장 건강/소화', text: '배탈 설사 자주 하고 변비가 심하며 감기 자주 걸려 면역력이 약한 것 같아요', pillar: 'growth', expectedBadge: '장 면역·소화 흡수율' },
  { id: 11, name: '문해력/어휘', text: '긴 줄글 독서를 거부하고 국어 문장제 문제 이해를 못 해서 문해력과 어휘력이 부족해요', pillar: 'learning', expectedBadge: '책 읽기 거부 & 문해력' },
  { id: 12, name: '수학/공간추론', text: '단순 계산은 빠른데 도형이나 응용 문장제 수학 문제만 나오면 막혀서 힘들어해요', pillar: 'learning', expectedBadge: '도형·응용·사고력 수학' },
  { id: 13, name: '학원 망각/메타인지', text: '학원 수업 듣고 오면 며칠 뒤 다 까먹고 스스로 복습하는 자기주도 메타인지가 없어요', pillar: 'learning', expectedBadge: '자기주도 메타인지 백지복습' }
];

console.log('========================================================================');
console.log('  Challenger 2: Browser Runtime & Volume Parity Empirical Test Suite');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: Volume Parity Verification Across Presets 1~5 (Node Environment)
// -----------------------------------------------------------------------------
console.log('[Suite 1: Volume Parity in Node (Pillar 2 = 40% ~ 60% of Total Volume)]');

const app = require(path.join(ROOT_DIR, 'src', 'js', 'app.js'));
const MasterBriefing = require(path.join(ROOT_DIR, 'src', 'js', 'master-briefing.js'));

const presets = app.PRESETS;
assert(presets, 'app.PRESETS must be defined');

const presetKeys = ['preset-1', 'preset-2', 'preset-3', 'preset-4', 'preset-5'];

presetKeys.forEach((key) => {
  const preset = presets[key];
  assert(preset, `Preset ${key} must exist`);

  it(`evaluates volume parity for ${key} (${preset.label}) in Node`, () => {
    const html = MasterBriefing.renderMasterBriefingCard(preset, { coupang: 'AF7865143' });
    assert(html && html.length > 10000, `Generated HTML must be substantial (>10k chars), got ${html.length}`);

    const metrics = extractPillarContainers(html);

    console.log(`      Pillar 1: ${metrics.p1Chars.toLocaleString()} chars (${metrics.p1Bytes.toLocaleString()} bytes)`);
    console.log(`      Pillar 2: ${metrics.p2Chars.toLocaleString()} chars (${metrics.p2Bytes.toLocaleString()} bytes)`);
    console.log(`      Pillar 2 Ratio: ${metrics.p2PercentChars}% chars (${metrics.p2PercentBytes}% bytes)`);

    assert(
      metrics.p2CharRatio >= 0.40 && metrics.p2CharRatio <= 0.60,
      `Pillar 2 character ratio ${metrics.p2PercentChars}% must be between 40.0% and 60.0%`
    );

    assert(
      metrics.p2ByteRatio >= 0.40 && metrics.p2ByteRatio <= 0.60,
      `Pillar 2 byte ratio ${metrics.p2PercentBytes}% must be between 40.0% and 60.0%`
    );
  });
});

// -----------------------------------------------------------------------------
// Suite 2: Browser VM Sandbox Execution without Node require
// -----------------------------------------------------------------------------
console.log('\n[Suite 2: Browser VM Sandbox Execution (require === undefined)]');

const browserSandbox = createBrowserSandbox();

it('confirms simulated browser VM sandbox has require undefined and window self-referential', () => {
  assert.strictEqual(typeof browserSandbox.require, 'undefined');
  assert.strictEqual(typeof browserSandbox.process, 'undefined');
  assert.strictEqual(browserSandbox.window, browserSandbox);
});

it('loads all runtime scripts into browser sandbox cleanly', () => {
  loadBrowserRuntimeScripts(browserSandbox, false);
  assert(browserSandbox.window.MasterBriefingEngine, 'window.MasterBriefingEngine must be attached in browser');
  assert(browserSandbox.window.KidsFitMasterBriefing, 'window.KidsFitMasterBriefing must be attached in browser');
});

presetKeys.forEach((key) => {
  const preset = presets[key];
  it(`executes MasterBriefingEngine.renderMasterBriefingCard in browser sandbox for ${key} without reference errors`, () => {
    const renderFn = browserSandbox.window.MasterBriefingEngine.renderMasterBriefingCard;
    assert.strictEqual(typeof renderFn, 'function', 'renderMasterBriefingCard must be a function on sandbox');

    let html;
    assert.doesNotThrow(() => {
      html = renderFn(preset, { coupang: 'AF7865143' });
    }, `Browser execution must not throw ReferenceError for ${key}`);

    assert(html.includes('id="pillar-1-container"'), 'Rendered HTML must contain #pillar-1-container');
    assert(html.includes('id="pillar-2-container"'), 'Rendered HTML must contain #pillar-2-container');
    assert(html.includes('id="lq-radar-svg"'), 'Rendered HTML must contain #lq-radar-svg');
    assert(html.includes('id="pillar2-learning-tools-box"'), 'Rendered HTML must contain #pillar2-learning-tools-box');

    const metrics = extractPillarContainers(html);
    console.log(`      [Browser ${key}] P1: ${metrics.p1Chars.toLocaleString()} chars | P2: ${metrics.p2Chars.toLocaleString()} chars | P2 Ratio: ${metrics.p2PercentChars}%`);
    assert(
      metrics.p2CharRatio >= 0.40 && metrics.p2CharRatio <= 0.60,
      `Browser sandbox Pillar 2 volume ${metrics.p2PercentChars}% must be between 40% and 60%`
    );
  });
});

// Also test production dist/ in browser sandbox
if (fs.existsSync(path.join(ROOT_DIR, 'dist', 'src', 'js', 'master-briefing.js'))) {
  const distSandbox = createBrowserSandbox();
  it('executes production dist/ bundle in browser sandbox cleanly and enforces volume parity', () => {
    loadBrowserRuntimeScripts(distSandbox, true);
    const renderFn = distSandbox.window.MasterBriefingEngine.renderMasterBriefingCard;
    const html = renderFn(presets['preset-3']);
    assert(html.includes('id="pillar-1-container"'));
    assert(html.includes('id="pillar-2-container"'));
    const metrics = extractPillarContainers(html);
    assert(
      metrics.p2CharRatio >= 0.40 && metrics.p2CharRatio <= 0.60,
      `Dist browser sandbox Pillar 2 volume ${metrics.p2PercentChars}% must be between 40% and 60%`
    );
  });
}

// -----------------------------------------------------------------------------
// Suite 3: Free Note Narrative Clustering (13 Clusters Separated)
// -----------------------------------------------------------------------------
console.log('\n[Suite 3: Free Note Narrative Clustering Across All 13 Clusters]');

const baseProfile = {
  gender: 'boy',
  ageYears: 10,
  ageMonths: 120,
  currentHeight: 137.0,
  currentWeight: 35.5,
  fatherHeight: 175.0,
  motherHeight: 162.0,
  habits: ['late_sleep']
};

CLUSTER_TEST_CASES.forEach((c) => {
  it(`tests Cluster ${c.id} (${c.name}): confirms routing strictly to ${c.pillar.toUpperCase()}`, () => {
    const profile = Object.assign({}, baseProfile, { parentFreeNote: c.text });
    const html = MasterBriefing.renderMasterBriefingCard(profile, { coupang: 'AF7865143' });

    const p1Match = html.match(/<div id="pillar-1-container"[\s\S]*?<\/div><!-- \/#pillar-1-container -->/);
    const p2Match = html.match(/<div id="pillar-2-container"[\s\S]*?<\/div><!-- \/#pillar-2-container -->/);

    assert(p1Match && p2Match);
    const p1Html = p1Match[0];
    const p2Html = p2Match[0];

    if (c.pillar === 'growth') {
      // Must appear in Pillar 1 (#bespoke-parent-note-section)
      assert(
        p1Html.includes(c.expectedBadge),
        `Cluster ${c.id} (${c.name}) badge "${c.expectedBadge}" must appear in Pillar 1`
      );
      // Must NOT appear in Pillar 2 (#bespoke-learning-note-section)
      assert(
        !p2Html.includes(c.expectedBadge),
        `Cluster ${c.id} (${c.name}) badge "${c.expectedBadge}" must NOT bleed into Pillar 2`
      );
    } else if (c.pillar === 'learning') {
      // Must appear in Pillar 2 (#bespoke-learning-note-section)
      assert(
        p2Html.includes(c.expectedBadge),
        `Cluster ${c.id} (${c.name}) badge "${c.expectedBadge}" must appear in Pillar 2`
      );
      // Must NOT appear in Pillar 1 (#bespoke-parent-note-section)
      assert(
        !p1Html.includes(c.expectedBadge),
        `Cluster ${c.id} (${c.name}) badge "${c.expectedBadge}" must NOT bleed into Pillar 1`
      );
    }
  });
});

it('tests combined note with ALL 13 clusters simultaneously: verifies clean segregation', () => {
  const combinedText = CLUSTER_TEST_CASES.map(c => c.text).join(' ');
  const profile = Object.assign({}, baseProfile, { parentFreeNote: combinedText });
  const html = MasterBriefing.renderMasterBriefingCard(profile, { coupang: 'AF7865143' });

  const p1Match = html.match(/<div id="pillar-1-container"[\s\S]*?<\/div><!-- \/#pillar-1-container -->/);
  const p2Match = html.match(/<div id="pillar-2-container"[\s\S]*?<\/div><!-- \/#pillar-2-container -->/);

  assert(p1Match && p2Match);
  const p1Html = p1Match[0];
  const p2Html = p2Match[0];

  // All 8 growth clusters must be in Pillar 1 and NOT in Pillar 2
  const growthClusters = CLUSTER_TEST_CASES.filter(c => c.pillar === 'growth');
  assert.strictEqual(growthClusters.length, 8, 'There must be exactly 8 growth clusters');
  for (const gc of growthClusters) {
    assert(p1Html.includes(gc.expectedBadge), `Growth cluster ${gc.id} (${gc.name}) must be in Pillar 1`);
    assert(!p2Html.includes(gc.expectedBadge), `Growth cluster ${gc.id} (${gc.name}) must NOT be in Pillar 2`);
  }

  // All 5 learning clusters must be in Pillar 2 and NOT in Pillar 1
  const learningClusters = CLUSTER_TEST_CASES.filter(c => c.pillar === 'learning');
  assert.strictEqual(learningClusters.length, 5, 'There must be exactly 5 learning clusters');
  for (const lc of learningClusters) {
    assert(p2Html.includes(lc.expectedBadge), `Learning cluster ${lc.id} (${lc.name}) must be in Pillar 2`);
    assert(!p1Html.includes(lc.expectedBadge), `Learning cluster ${lc.id} (${lc.name}) must NOT be in Pillar 1`);
  }
});

console.log('\n========================================================================');
console.log(`Summary: ${passedTests}/${totalTests} tests passed. (Failed: ${failedTests})`);
console.log('========================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
