/**
 * tests/challenger-m1-2-rechallenge.test.js
 * Empirical Re-Challenge Stress Suite for Milestone 1 Iteration 2
 * 
 * Verifies:
 * 1. Zero test-environment sniffing (isRealBrowser, location.protocol shims) in src/ and dist/
 * 2. Master Briefing Engine in isolated browser sandbox (window defined, require undefined):
 *    - Produces > 14,000 bytes of genuine clinical HTML
 *    - Renders all 3 distinct clinical sections (Status/KDCA/CDC, Research/PMID/DOI, Actionable Roadmap)
 *    - Evaluates across all 5 clinical presets (preset-1 through preset-5) in both src/ and dist/
 *    - Asserts 0 NaN, 0 undefined, 0 null leakage, and 0 commercial residue
 * 3. Single Active Tab View Navigation:
 *    - Strict CSS rules: .hidden (display: none !important), .tab-pane (display: none !important), .tab-pane.hidden (display: none !important)
 *    - DOM state: strictly 1 pane active (display: block, .active, no .hidden) and 4 panes hidden (display: none, .hidden, no .active)
 *    - Tab capsule button aria-selected and active synchronization
 *    - 500-cycle high-speed cyclic & pseudo-random switching stress test
 * 4. Retest cycle (#btn-retest) resets to Step 1 and hides results-dashboard
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

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
    failures.push({ title, error: err.message, stack: err.stack });
  }
}

// -----------------------------------------------------------------------------
// Helper: Create Browser Sandbox
// -----------------------------------------------------------------------------
function createBrowserSandbox() {
  const elements = {};

  const makeMockElement = (id, tag = 'div', attrs = {}) => {
    const el = {
      id,
      tagName: tag.toUpperCase(),
      attributes: Object.assign({ id }, attrs),
      style: {},
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        contains(c) { return this._set.has(c); },
        toggle(c, force) {
          if (force === true) this._set.add(c);
          else if (force === false) this._set.delete(c);
          else if (this._set.has(c)) this._set.delete(c);
          else this._set.add(c);
        }
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
      dispatchEvent(evt) {
        const type = typeof evt === 'string' ? evt : evt.type;
        const fns = this.listeners[type] || [];
        fns.forEach(fn => fn(evt));
      },
      click() { this.dispatchEvent({ type: 'click', preventDefault: () => {} }); },
      scrollIntoView() { this.scrolled = true; }
    };
    return el;
  };

  const doc = {
    _els: elements,
    documentElement: makeMockElement('html', 'html', { lang: 'ko' }),
    body: makeMockElement('body', 'body'),
    getElementById(id) {
      if (!this._els[id]) {
        this._els[id] = makeMockElement(id);
      }
      return this._els[id];
    },
    querySelectorAll(sel) {
      if (sel === '.capsule-tab') {
        const tabDefs = [
          { id: 'tab-btn-auxology', dataTab: 'tab-auxology' },
          { id: 'tab-btn-endocrinology', dataTab: 'tab-endocrinology' },
          { id: 'tab-btn-biomechanics', dataTab: 'tab-biomechanics' },
          { id: 'tab-btn-neuro', dataTab: 'tab-neuro' },
          { id: 'tab-btn-tracker', dataTab: 'tab-tracker' }
        ];
        return tabDefs.map(def => {
          const el = this.getElementById(def.id);
          el.setAttribute('data-tab', def.dataTab);
          return el;
        });
      }
      if (sel === '.tab-pane') {
        return ['tab-pane-auxology', 'tab-pane-endocrinology', 'tab-pane-biomechanics', 'tab-pane-neuro', 'tab-pane-tracker']
          .map(id => this.getElementById(id));
      }
      if (sel.includes('.preset-card')) {
        return ['preset-1', 'preset-2', 'preset-3', 'preset-4', 'preset-5'].map(id => {
          const el = this.getElementById(id);
          el.setAttribute('data-preset-id', id);
          return el;
        });
      }
      return [];
    },
    querySelector(sel) {
      const all = this.querySelectorAll(sel);
      return all.length > 0 ? all[0] : null;
    },
    createElement(tag) { return makeMockElement('created-' + Math.random().toString(36).substring(7), tag); },
    addEventListener() {}
  };

  const sandbox = {
    console,
    Math,
    Date,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Set,
    Map,
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 1; },
    clearTimeout: () => {},
    document: doc,
    window: {},
    location: { search: '' },
    localStorage: {
      _d: {},
      getItem(k) { return this._d[k] || null; },
      setItem(k, v) { this._d[k] = String(v); },
      removeItem(k) { delete this._d[k]; },
      clear() { this._d = {}; }
    },
    alert: () => {},
    CustomEvent: function(type, opts) { this.type = type; this.detail = opts ? opts.detail : null; },
    dispatchEvent: () => {},
    addEventListener: () => {}
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  // NOTE: require is strictly undefined in sandbox!

  vm.createContext(sandbox);
  return { sandbox, doc, elements };
}

function runRechallenge() {
  console.log('================================================================');
  console.log('   CHALLENGER 2 RE-CHALLENGE: Master Briefing & Single Tab View ');
  console.log('   Milestone 1 Iteration 2 Rigorous Empirical Verification       ');
  console.log('================================================================\n');

  // ===========================================================================
  console.log('[Section 1: Zero Environment Sniffing & Codebase Integrity]');
  // ===========================================================================

  it('confirms 0 instances of "isRealBrowser" in src/ and dist/', () => {
    const scanDir = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        const full = path.join(dir, f.name);
        if (f.isDirectory() && f.name !== 'node_modules' && f.name !== '.git') {
          scanDir(full);
        } else if (f.isFile() && f.name.endsWith('.js')) {
          const content = fs.readFileSync(full, 'utf8');
          assert(!content.includes('isRealBrowser'), `Found isRealBrowser sniffing in ${full}`);
        }
      }
    };
    scanDir(path.join(ROOT_DIR, 'src'));
    scanDir(path.join(ROOT_DIR, 'dist', 'src'));
  });

  it('confirms onboarding-wizard.js has maxStep strictly set to 6 without condition', () => {
    const srcCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'onboarding-wizard.js'), 'utf8');
    assert(srcCode.includes('maxStep: 6,'), 'src/js/onboarding-wizard.js must set maxStep: 6');
    assert(!srcCode.includes('effectiveMaxStep'), 'src/js/onboarding-wizard.js must not contain effectiveMaxStep');
  });

  // ===========================================================================
  console.log('\n[Section 2: Browser Sandbox Master Briefing (>14,000 bytes with 3 Clinical Sections)]');
  // ===========================================================================

  const PRESET_IDS = ['preset-1', 'preset-2', 'preset-3', 'preset-4', 'preset-5'];

  // Test with src/ bundle
  it('runs master-briefing and app in browser sandbox (src/) and generates >14,000 bytes HTML across all 5 presets', () => {
    const { sandbox, doc } = createBrowserSandbox();

    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'data', 'data-bundle.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'master-briefing.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'app.js'), 'utf8'), sandbox);

    // Verify window exports
    assert(sandbox.window.MasterBriefingEngine, 'window.MasterBriefingEngine must exist');
    assert(sandbox.window.KidsFitMasterBriefing, 'window.KidsFitMasterBriefing alias must exist');
    assert(sandbox.window.TallerMasterBriefing, 'window.TallerMasterBriefing alias must exist');
    assert.strictEqual(typeof sandbox.window.MasterBriefingEngine.render, 'function');
    assert.strictEqual(typeof sandbox.window.MasterBriefingEngine.attachRetestListener, 'function');

    PRESET_IDS.forEach(pid => {
      sandbox.KidsFitApp.applyPreset(pid);
      sandbox.KidsFitApp.renderPrescriptionResults();

      const card = doc.getElementById('master-briefing-card');
      const html = card.innerHTML;

      // 1. Byte length check > 14,000 bytes
      assert(html.length > 14000, `Expected HTML > 14000 bytes for ${pid}, got ${html.length}`);

      // 2. Section 1: Public Biometrics Position & KDCA/CDC
      assert(html.includes('id="briefing-status-section"'), `${pid} missing #briefing-status-section`);
      assert(html.includes('id="briefing-percentile"'), `${pid} missing #briefing-percentile`);
      assert(html.includes('id="briefing-velocity"'), `${pid} missing #briefing-velocity`);
      assert(html.includes('id="briefing-mph"'), `${pid} missing #briefing-mph`);
      assert(html.includes('id="briefing-goldentime"'), `${pid} missing #briefing-goldentime`);
      assert(html.includes('KDCA') || html.includes('질병관리청'), `${pid} missing KDCA standard reference`);

      // 3. Section 2: Research Papers Matching
      assert(html.includes('id="briefing-research-section"'), `${pid} missing #briefing-research-section`);
      assert(html.includes('id="briefing-papers-container"'), `${pid} missing #briefing-papers-container`);
      assert(html.includes('https://pubmed.ncbi.nlm.nih.gov/') || html.includes('https://doi.org/'), `${pid} missing PubMed or DOI link`);
      assert(html.includes('target="_blank"'), `${pid} citation link must have target="_blank"`);
      assert(html.includes('rel="noopener noreferrer"'), `${pid} citation link must have rel="noopener noreferrer"`);

      // 4. Section 3: Actionable Guidance Roadmap
      assert(html.includes('id="briefing-actions-section"'), `${pid} missing #briefing-actions-section`);
      assert(html.includes('id="briefing-action-sleep"'), `${pid} missing #briefing-action-sleep`);
      assert(html.includes('id="briefing-action-nutrition"'), `${pid} missing #briefing-action-nutrition`);
      assert(html.includes('id="briefing-action-exercise"'), `${pid} missing #briefing-action-exercise`);

      // 5. Invariants: Cleanliness
      assert(!html.includes('NaN'), `${pid} rendered HTML must not leak NaN`);
      assert(!html.includes('undefined'), `${pid} rendered HTML must not leak undefined`);
      assert(!html.includes('null cm'), `${pid} rendered HTML must not leak null cm`);
      assert(!html.includes('영수증') && !html.includes('바코드'), `${pid} rendered HTML must have zero commercial receipt/barcode residue`);
    });
  });

  // Test with dist/ bundle
  it('runs production dist master-briefing and app in browser sandbox generating >14,000 bytes HTML across all 5 presets', () => {
    const { sandbox, doc } = createBrowserSandbox();

    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'dist', 'src', 'data', 'data-bundle.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'dist', 'src', 'js', 'master-briefing.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'dist', 'src', 'js', 'app.js'), 'utf8'), sandbox);

    PRESET_IDS.forEach(pid => {
      sandbox.KidsFitApp.applyPreset(pid);
      sandbox.KidsFitApp.renderPrescriptionResults();

      const card = doc.getElementById('master-briefing-card');
      const html = card.innerHTML;

      assert(html.length > 14000, `Dist bundle expected HTML > 14000 bytes for ${pid}, got ${html.length}`);
      assert(html.includes('briefing-status-section'), `Dist ${pid} missing status section`);
      assert(html.includes('briefing-research-section'), `Dist ${pid} missing research section`);
      assert(html.includes('briefing-actions-section'), `Dist ${pid} missing actions section`);
    });
  });

  // ===========================================================================
  console.log('\n[Section 3: Single Active Tab View (1 Displayed, 4 Hidden with display: none !important)]');
  // ===========================================================================

  it('verifies CSS rules in src/css/style.css and dist/src/css/style.css enforce display: none !important', () => {
    const srcCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'css', 'style.css'), 'utf8');
    const distCss = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'src', 'css', 'style.css'), 'utf8');

    [srcCss, distCss].forEach((css, idx) => {
      const scope = idx === 0 ? 'src' : 'dist';
      // .hidden { display: none !important; }
      assert(/\.hidden\s*\{[^}]*display:\s*none\s*!important/m.test(css), `${scope} CSS missing .hidden display: none !important`);
      // .tab-pane { display: none !important; }
      assert(/\.tab-pane\s*\{[^}]*display:\s*none\s*!important/m.test(css), `${scope} CSS missing .tab-pane display: none !important`);
      // .tab-pane.active { display: block !important; }
      assert(/\.tab-pane\.active\s*\{[^}]*display:\s*block\s*!important/m.test(css), `${scope} CSS missing .tab-pane.active display: block !important`);
      // .tab-pane.hidden { display: none !important; }
      assert(/\.tab-pane\.hidden\s*\{[^}]*display:\s*none\s*!important/m.test(css), `${scope} CSS missing .tab-pane.hidden display: none !important`);
    });
  });

  it('verifies index.html markup initializes with strictly 1 active pane and 4 hidden panes', () => {
    const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

    // Panes in index.html
    const paneMatches = html.match(/id="tab-pane-[^"]+"\s+[^>]*class="([^"]+)"/g) ||
                        html.match(/class="([^"]+)"\s+id="tab-pane-[^"]+"/g);
    assert(paneMatches, 'Could not find tab panes in index.html');

    // Check specific pane classes in index.html
    assert(html.includes('id="tab-pane-auxology" role="tabpanel" aria-labelledby="tab-btn-auxology"') ||
           html.includes('class="tab-pane active" id="tab-pane-auxology"'), 'Auxology pane must be active');
    assert(html.includes('class="tab-pane hidden" id="tab-pane-endocrinology"'), 'Endocrinology must be hidden initially');
    assert(html.includes('class="tab-pane hidden" id="tab-pane-biomechanics"'), 'Biomechanics must be hidden initially');
    assert(html.includes('class="tab-pane hidden" id="tab-pane-neuro"'), 'Neuro must be hidden initially');
    assert(html.includes('class="tab-pane hidden" id="tab-pane-tracker"'), 'Tracker must be hidden initially');
  });

  it('tests full tab navigation cycle verifying 1 active / 4 hidden invariant at every transition', () => {
    const { sandbox, doc, elements } = createBrowserSandbox();

    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'data', 'data-bundle.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'master-briefing.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'app.js'), 'utf8'), sandbox);

    const TAB_TARGETS = [
      { id: 'tab-auxology', expectedPane: 'tab-pane-auxology', expectedBtn: 'tab-btn-auxology' },
      { id: 'tab-endocrinology', expectedPane: 'tab-pane-endocrinology', expectedBtn: 'tab-btn-endocrinology' },
      { id: 'tab-biomechanics', expectedPane: 'tab-pane-biomechanics', expectedBtn: 'tab-btn-biomechanics' },
      { id: 'tab-neuro', expectedPane: 'tab-pane-neuro', expectedBtn: 'tab-btn-neuro' },
      { id: 'tab-tracker', expectedPane: 'tab-pane-tracker', expectedBtn: 'tab-btn-tracker' },
      { id: 'tab-auxology', expectedPane: 'tab-pane-auxology', expectedBtn: 'tab-btn-auxology' }
    ];

    const allPanes = doc.querySelectorAll('.tab-pane');
    const allButtons = doc.querySelectorAll('.capsule-tab');
    assert.strictEqual(allPanes.length, 5);
    assert.strictEqual(allButtons.length, 5);

    TAB_TARGETS.forEach(({ id, expectedPane, expectedBtn }, stepIdx) => {
      sandbox.KidsFitApp.switchTab(id);

      // Verify Panes: Strictly 1 active, 4 hidden
      const activePanes = allPanes.filter(p => p.classList.contains('active'));
      const hiddenPanes = allPanes.filter(p => p.classList.contains('hidden'));
      const blockPanes = allPanes.filter(p => p.style.display === 'block');
      const nonePanes = allPanes.filter(p => p.style.display === 'none');

      assert.strictEqual(activePanes.length, 1, `Step ${stepIdx} (${id}): strictly 1 active pane`);
      assert.strictEqual(blockPanes.length, 1, `Step ${stepIdx} (${id}): strictly 1 display:block pane`);
      assert.strictEqual(hiddenPanes.length, 4, `Step ${stepIdx} (${id}): strictly 4 hidden panes`);
      assert.strictEqual(nonePanes.length, 4, `Step ${stepIdx} (${id}): strictly 4 display:none panes`);

      assert.strictEqual(activePanes[0].id, expectedPane);

      // Verify Buttons: Strictly 1 active with aria-selected="true"
      const activeButtons = allButtons.filter(b => b.classList.contains('active'));
      const selectedButtons = allButtons.filter(b => b.getAttribute('aria-selected') === 'true');
      assert.strictEqual(activeButtons.length, 1, `Step ${stepIdx}: strictly 1 active button`);
      assert.strictEqual(selectedButtons.length, 1, `Step ${stepIdx}: strictly 1 aria-selected button`);
      assert.strictEqual(activeButtons[0].id, expectedBtn);
    });
  });

  it('stress-tests 500 rapid cyclic and pseudo-random tab switches preserving invariant 100% of the time', () => {
    const { sandbox, doc } = createBrowserSandbox();

    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'data', 'data-bundle.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'master-briefing.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'app.js'), 'utf8'), sandbox);

    const tabs = ['tab-auxology', 'tab-endocrinology', 'tab-biomechanics', 'tab-neuro', 'tab-tracker'];
    const allPanes = doc.querySelectorAll('.tab-pane');

    for (let i = 0; i < 500; i++) {
      const target = tabs[(i * 7 + 3) % tabs.length]; // Deterministic pseudo-random sequence
      sandbox.KidsFitApp.switchTab(target);

      const activePanes = allPanes.filter(p => p.classList.contains('active') && p.style.display === 'block' && !p.classList.contains('hidden'));
      const hiddenPanes = allPanes.filter(p => p.classList.contains('hidden') && p.style.display === 'none' && !p.classList.contains('active'));

      assert.strictEqual(activePanes.length, 1, `Iteration ${i}: expected 1 active pane, found ${activePanes.length}`);
      assert.strictEqual(hiddenPanes.length, 4, `Iteration ${i}: expected 4 hidden panes, found ${hiddenPanes.length}`);
    }
  });

  // ===========================================================================
  console.log('\n[Section 4: Retest Cycle Reset]');
  // ===========================================================================

  it('verifies #btn-retest hides #results-dashboard and restores Phase 1 Onboarding Funnel at Step 1', () => {
    const { sandbox, doc, elements } = createBrowserSandbox();

    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'data', 'data-bundle.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'onboarding-wizard.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'master-briefing.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'src', 'js', 'app.js'), 'utf8'), sandbox);

    sandbox.TallerOnboardingWizard.initWizard();

    // Move to step 4
    sandbox.TallerOnboardingWizard.goToStep(4);
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 4);

    // Simulate results dashboard visible
    const dashboard = doc.getElementById('results-dashboard');
    dashboard.classList.remove('hidden');
    dashboard.style.display = 'block';

    const quizSection = doc.getElementById('quiz-section');
    quizSection.style.display = 'none';

    // Click retest button
    const retestBtn = doc.getElementById('btn-retest');
    retestBtn.click();

    // Assert results-dashboard hidden
    assert(dashboard.classList.contains('hidden'), 'Dashboard must have .hidden');
    assert.strictEqual(dashboard.style.display, 'none', 'Dashboard display must be none');

    // Assert quizSection restored
    assert.strictEqual(quizSection.style.display, 'block', 'Quiz section display must be block');

    // Assert wizard reset to Step 1
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.currentStep, 1, 'Wizard must return to Step 1');
    assert.strictEqual(sandbox.TallerOnboardingWizard.state.maxStep, 6, 'maxStep must remain 6');
  });

  console.log('\n================================================================');
  console.log(`Re-Challenge Summary: ${passedTests}/${totalTests} empirical tests passed.`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error(`\n[CRITICAL FAILURE] ${failedTests} tests failed:`);
    failures.forEach(f => console.error(`  - ${f.title}: ${f.error}`));
    process.exit(1);
  } else {
    console.log('[SUCCESS] All Master Briefing & Single Active Tab empirical tests passed with 0 defects!\n');
    process.exit(0);
  }
}

runRechallenge();
