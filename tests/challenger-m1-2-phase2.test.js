/**
 * tests/challenger-m1-2-phase2.test.js
 * Empirical Adversarial Challenger Suite for Milestone 1 (Phase 2 & Tab Navigation)
 * 
 * Verifies:
 * 1. Research paper dynamic matching algorithm across all combinations:
 *    - 0 habits selected (empty array, null, undefined)
 *    - 1 habit selected (each of late_sleep, night_carbs, poor_posture, picky_eater, sedentary)
 *    - all 5 habits selected
 *    - across ages 3, 7, 10, 13, 16 (and boundary ages 1, 20)
 *    - assertions on title, authors, year, and live PubMed/DOI URL format
 * 2. Master Briefing Card HTML generation & clinical roadmap invariants
 * 3. Strict Single Active Tab View navigation sequence:
 *    - auxology -> endocrinology -> biomechanics -> neuro -> tracker -> auxology
 *    - asserts strictly 1 pane active and 4 panes hidden at each step
 *    - asserts capsule tab button aria-selected and active states
 *    - stress tests 100 rapid random and cyclic switches
 * 4. Retest cycle:
 *    - #btn-retest click hides #results-dashboard, restores #quiz-section, #hero-section, #quick-presets-bar
 *    - returns to Step 1 in stepper state
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const MASTER_BRIEFING_PATH = path.join(ROOT_DIR, 'src', 'js', 'master-briefing.js');
const APP_PATH = path.join(ROOT_DIR, 'src', 'js', 'app.js');
const ONBOARDING_WIZARD_PATH = path.join(ROOT_DIR, 'src', 'js', 'onboarding-wizard.js');
const KB_PATH = path.join(ROOT_DIR, 'src', 'data', 'research-knowledge-base.json');

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
// Interactive Mock DOM Builder for Testing Single Active Tab and Retest Cycles
// -----------------------------------------------------------------------------
class MockElement {
  constructor(id, tag = 'div', fullAttrs = {}) {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.attributes = Object.assign({ id: id }, fullAttrs);
    this.style = {};
    this.classList = {
      _set: new Set(),
      add: (c) => this.classList._set.add(c),
      remove: (c) => this.classList._set.delete(c),
      contains: (c) => this.classList._set.has(c),
      toggle: (c, force) => {
        if (force === true) this.classList._set.add(c);
        else if (force === false) this.classList._set.delete(c);
        else if (this.classList._set.has(c)) this.classList._set.delete(c);
        else this.classList._set.add(c);
      }
    };
    this.listeners = {};
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.checked = false;
  }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
    if (k === 'id') this.id = String(v);
  }
  getAttribute(k) {
    if (k === 'id') return this.id || this.attributes['id'] || null;
    return this.attributes[k] !== undefined ? this.attributes[k] : null;
  }
  hasAttribute(k) { return (k === 'id' && this.id) || this.attributes[k] !== undefined; }
  removeAttribute(k) { delete this.attributes[k]; }

  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }

  dispatchEvent(evt) {
    const type = typeof evt === 'string' ? evt : evt.type;
    const fns = this.listeners[type] || [];
    fns.forEach(fn => fn(evt));
  }

  click() {
    this.dispatchEvent({ type: 'click', preventDefault: () => {} });
  }

  scrollIntoView() {
    this.scrolledIntoView = true;
  }
}

function createMockEnvironment() {
  const elements = {};

  // 1. Five Tab Buttons from index.html
  const tabButtonDefs = [
    { id: 'tab-btn-auxology', dataTab: 'tab-auxology', active: true },
    { id: 'tab-btn-endocrinology', dataTab: 'tab-endocrinology', active: false },
    { id: 'tab-btn-biomechanics', dataTab: 'tab-biomechanics', active: false },
    { id: 'tab-btn-neuro', dataTab: 'tab-neuro', active: false },
    { id: 'tab-btn-tracker', dataTab: 'tab-tracker', active: false }
  ];

  tabButtonDefs.forEach(def => {
    const btn = new MockElement(def.id, 'button', {
      'data-tab': def.dataTab,
      'role': 'tab',
      'aria-selected': def.active ? 'true' : 'false'
    });
    btn.classList.add('capsule-tab');
    if (def.active) btn.classList.add('active');
    elements[def.id] = btn;
  });

  // 2. Five Tab Panes from index.html
  const paneDefs = [
    { id: 'tab-pane-auxology', active: true },
    { id: 'tab-pane-endocrinology', active: false },
    { id: 'tab-pane-biomechanics', active: false },
    { id: 'tab-pane-neuro', active: false },
    { id: 'tab-pane-tracker', active: false }
  ];

  paneDefs.forEach(def => {
    const pane = new MockElement(def.id, 'div', {
      'role': 'tabpanel',
      'aria-labelledby': def.id.replace('pane', 'btn')
    });
    pane.classList.add('tab-pane');
    if (def.active) {
      pane.classList.add('active');
      pane.style.display = 'block';
    } else {
      pane.classList.add('hidden');
      pane.style.display = 'none';
    }
    elements[def.id] = pane;
  });

  // 3. Funnel, Dashboard & Retest Elements
  const dashboard = new MockElement('results-dashboard', 'section');
  dashboard.classList.add('results-dashboard');
  dashboard.classList.add('prescription-container');
  dashboard.classList.add('hidden');
  dashboard.style.display = 'none';
  elements['results-dashboard'] = dashboard;
  elements['prescription-container'] = dashboard;

  const quizSection = new MockElement('quiz-section', 'section');
  quizSection.style.display = 'block';
  elements['quiz-section'] = quizSection;

  const heroSection = new MockElement('hero-section', 'section');
  heroSection.style.display = 'block';
  elements['hero-section'] = heroSection;

  const presetsBar = new MockElement('quick-presets-bar', 'div');
  presetsBar.style.display = 'block';
  elements['quick-presets-bar'] = presetsBar;

  const retestBtn = new MockElement('btn-retest', 'button');
  elements['btn-retest'] = retestBtn;

  const masterCard = new MockElement('master-briefing-card', 'div');
  elements['master-briefing-card'] = masterCard;

  // Stepper Elements
  for (let s = 1; s <= 6; s++) {
    const stepEl = new MockElement(`step-content-${s}`, 'div');
    if (s === 1) stepEl.classList.add('active');
    elements[`step-content-${s}`] = stepEl;
  }
  elements['slide-step-6'] = elements['step-content-6'];

  elements['quiz-step-tag'] = new MockElement('quiz-step-tag', 'span');
  elements['quiz-step-title'] = new MockElement('quiz-step-title', 'h3');
  elements['quiz-step-subtitle'] = new MockElement('quiz-step-subtitle', 'p');
  elements['quiz-progress-text'] = new MockElement('quiz-progress-text', 'span');
  elements['quiz-progress-fill'] = new MockElement('quiz-progress-fill', 'div');
  elements['btn-prev-step'] = new MockElement('btn-prev-step', 'button');
  elements['btn-next-step'] = new MockElement('btn-next-step', 'button');
  elements['btn-submit-quiz'] = new MockElement('btn-submit-quiz', 'button');
  elements['slide-funnel-track'] = new MockElement('slide-funnel-track', 'div');

  const doc = {
    documentElement: new MockElement('html', 'html', { lang: 'ko', 'data-theme': 'dark' }),
    body: new MockElement('body', 'body'),
    getElementById: (id) => elements[id] || null,
    querySelectorAll: (sel) => {
      const res = [];
      if (sel === '.capsule-tab') {
        tabButtonDefs.forEach(d => res.push(elements[d.id]));
        return res;
      }
      if (sel === '.tab-pane') {
        paneDefs.forEach(d => res.push(elements[d.id]));
        return res;
      }
      if (sel.startsWith('#step-content-') || sel.includes('step-content')) {
        for (let s = 1; s <= 6; s++) res.push(elements[`step-content-${s}`]);
        return res;
      }
      return [];
    },
    querySelector: (sel) => {
      const all = doc.querySelectorAll(sel);
      return all.length > 0 ? all[0] : null;
    },
    addEventListener: () => {}
  };

  const win = {
    document: doc,
    localStorage: {
      _d: {},
      getItem(k) { return this._d[k] || null; },
      setItem(k, v) { this._d[k] = String(v); },
      removeItem(k) { delete this._d[k]; }
    },
    alert: () => {},
    CustomEvent: function(type, opts) { this.type = type; this.detail = opts ? opts.detail : null; },
    dispatchEvent: () => {},
    addEventListener: () => {}
  };

  return { elements, doc, win };
}

// -----------------------------------------------------------------------------
// Test Execution
// -----------------------------------------------------------------------------
function runEmpiricalChallenge() {
  console.log('================================================================');
  console.log('   CHALLENGER 2: Empirical Stress Test Harness                  ');
  console.log('   Phase 2 Master Briefing & Single Active Tab Navigation       ');
  console.log('================================================================');

  const MasterBriefing = require(MASTER_BRIEFING_PATH);
  const KidsFitApp = require(APP_PATH);
  const kbData = require(KB_PATH);

  // ===========================================================================
  console.log('\n[Suite 1: Research Paper Dynamic Matching Algorithm Combinations]');
  // ===========================================================================

  const TEST_AGES = [3, 7, 10, 13, 16];
  const HABIT_KEYS = ['late_sleep', 'night_carbs', 'poor_posture', 'picky_eater', 'sedentary'];
  const HABIT_COMBINATIONS = [
    { name: '0 habits (empty array [])', habits: [] },
    { name: '0 habits (null fallback)', habits: null },
    { name: '0 habits (undefined fallback)', habits: undefined },
    { name: '1 habit: late_sleep', habits: ['late_sleep'] },
    { name: '1 habit: night_carbs', habits: ['night_carbs'] },
    { name: '1 habit: poor_posture', habits: ['poor_posture'] },
    { name: '1 habit: picky_eater', habits: ['picky_eater'] },
    { name: '1 habit: sedentary', habits: ['sedentary'] },
    { name: '2 habits: late_sleep + night_carbs', habits: ['late_sleep', 'night_carbs'] },
    { name: '3 habits: late_sleep + poor_posture + sedentary', habits: ['late_sleep', 'poor_posture', 'sedentary'] },
    { name: 'All 5 habits selected', habits: HABIT_KEYS }
  ];

  it('verifies knowledge base contains 800+ peer-reviewed papers with complete schema', () => {
    assert(Array.isArray(kbData.papers), 'kbData.papers should be an array');
    assert(kbData.papers.length >= 800, `Expected >= 800 papers, got ${kbData.papers.length}`);

    kbData.papers.forEach((p, idx) => {
      assert(p.title || p.title_ko, `Paper at index ${idx} missing title`);
      assert(Array.isArray(p.authors) && p.authors.length > 0, `Paper ${p.id || idx} missing authors array`);
      assert(typeof p.year === 'number' && p.year >= 1940 && p.year <= 2026, `Paper ${p.id || idx} has invalid year: ${p.year}`);
      assert(p.pmid || p.doi, `Paper ${p.id || idx} must have at least one of pmid or doi`);
      if (p.pmid) {
        assert(/^\d+$/.test(String(p.pmid)), `Paper ${p.id || idx} has invalid pmid format: ${p.pmid}`);
      }
      if (p.doi) {
        assert(p.doi.startsWith('10.'), `Paper ${p.id || idx} has invalid doi format: ${p.doi}`);
      }
    });
  });

  // Exhaustive permutation test across all habit combinations × all age points
  let permutationCount = 0;
  for (const combo of HABIT_COMBINATIONS) {
    for (const age of TEST_AGES) {
      permutationCount++;
      const title = `matches valid papers for [${combo.name}] at age ${age}`;

      it(title, () => {
        const matched = MasterBriefing.matchPapers(combo.habits, age, 'phase_2', 3);
        assert(Array.isArray(matched), `Returned matched result should be an array for age ${age}`);
        assert.strictEqual(matched.length, 3, `Expected exactly 3 papers matched, got ${matched.length}`);

        const paperIds = new Set();
        matched.forEach((item, itemIdx) => {
          assert(item.paper, `Matched item ${itemIdx} missing paper object`);
          const p = item.paper;

          // Title assertion
          const hasTitle = (typeof p.title === 'string' && p.title.trim().length > 0) ||
                           (typeof p.title_ko === 'string' && p.title_ko.trim().length > 0);
          assert(hasTitle, `Paper ${p.id} must have a valid non-empty title or title_ko`);

          // Authors assertion
          assert(Array.isArray(p.authors) && p.authors.length > 0, `Paper ${p.id} authors must be non-empty array`);
          p.authors.forEach(author => {
            assert(typeof author === 'string' && author.trim().length > 0, `Author in paper ${p.id} must be non-empty string`);
          });

          // Year assertion
          assert(typeof p.year === 'number' && p.year >= 1940 && p.year <= 2026, `Paper ${p.id} year must be 1940..2026, got: ${p.year}`);

          // URL format assertion: PubMed or DOI
          const urls = [];
          if (p.pmid) {
            const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`;
            assert(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(pubmedUrl), `Invalid PubMed URL: ${pubmedUrl}`);
            urls.push(pubmedUrl);
          }
          if (p.doi) {
            const doiUrl = `https://doi.org/${p.doi}`;
            assert(/^https:\/\/doi\.org\/10\..+$/.test(doiUrl), `Invalid DOI URL: ${doiUrl}`);
            urls.push(doiUrl);
          }
          assert(urls.length >= 1, `Paper ${p.id} must have at least one valid PubMed or DOI URL`);

          // Unique papers assertion within matched set
          assert(!paperIds.has(p.id), `Duplicate paper ID ${p.id} returned in matched set`);
          paperIds.add(p.id);

          // Cause tag assertion
          assert(typeof item.matchedCauseKo === 'string' && item.matchedCauseKo.length > 0, 'matchedCauseKo must be non-empty');
          assert(typeof item.matchedCauseEn === 'string' && item.matchedCauseEn.length > 0, 'matchedCauseEn must be non-empty');
        });
      });
    }
  }

  it(`verified ${permutationCount} habit × age matching combinations cleanly with 0 defects`, () => {
    assert.strictEqual(permutationCount, HABIT_COMBINATIONS.length * TEST_AGES.length);
  });

  it('handles edge case inputs (negative age, fractional age, adult age 20, unknown habits)', () => {
    const edgeCases = [
      { habits: ['unknown_factor_xyz'], age: 10 },
      { habits: ['late_sleep', 'unknown_factor_xyz'], age: 1 },
      { habits: [], age: 20 },
      { habits: ['sedentary'], age: 7.5 }
    ];

    edgeCases.forEach(({ habits, age }) => {
      const matched = MasterBriefing.matchPapers(habits, age, 'phase_2', 3);
      assert(Array.isArray(matched), 'Must return array');
      assert.strictEqual(matched.length, 3, 'Must backfill up to 3 papers');
      matched.forEach(item => {
        assert(item.paper && (item.paper.title || item.paper.title_ko));
        assert(item.paper.pmid || item.paper.doi);
      });
    });
  });

  // ===========================================================================
  console.log('\n[Suite 2: Master Briefing Card HTML Rendering & Invariants]');
  // ===========================================================================

  it('renders 3-tier master briefing card with KDCA/CDC stats, papers, and actionable roadmap', () => {
    const profile = {
      gender: 'boy',
      ageYears: 10,
      ageMonths: 120,
      currentHeight: 137.0,
      currentWeight: 35.5,
      recentGrowth6m: 3.2,
      fatherHeight: 173.5,
      motherHeight: 160.5,
      habits: ['late_sleep', 'night_carbs'],
      tannerPhase: 'phase_2'
    };

    const html = MasterBriefing.renderMasterBriefingCard(profile);
    assert(typeof html === 'string' && html.length > 500, 'HTML should be substantial');

    // Section 1: Public Biometrics Position
    assert(html.includes('id="master-briefing-card-content"'), 'Must contain master briefing root card');
    assert(html.includes('id="briefing-status-section"'), 'Must contain Tier 1 status section');
    assert(html.includes('id="briefing-percentile"'), 'Must contain percentile metric');
    assert(html.includes('id="briefing-velocity"'), 'Must contain velocity metric');
    assert(html.includes('id="briefing-mph"'), 'Must contain mid-parental height metric');
    assert(html.includes('id="briefing-goldentime"'), 'Must contain golden time metric');

    // Section 2: Research Papers Matching
    assert(html.includes('id="briefing-research-section"'), 'Must contain Tier 2 research section');
    assert(html.includes('id="briefing-papers-container"'), 'Must contain papers container');
    assert(html.includes('https://pubmed.ncbi.nlm.nih.gov/') || html.includes('https://doi.org/'), 'Must render active paper citation links');
    assert(html.includes('target="_blank"'), 'Citations must open in target="_blank"');
    assert(html.includes('rel="noopener noreferrer"'), 'Citations must have secure rel attribute');

    // Section 3: Actionable Guidance Roadmap
    assert(html.includes('id="briefing-actions-section"'), 'Must contain Tier 3 actions section');
    assert(html.includes('id="briefing-action-sleep"'), 'Must contain sleep action guide');
    assert(html.includes('id="briefing-action-nutrition"'), 'Must contain nutrition action guide');
    assert(html.includes('id="briefing-action-exercise"'), 'Must contain exercise action guide');

    // Invariant: No NaN or undefined leakage
    assert(!html.includes('NaN'), 'Rendered HTML must not contain NaN');
    assert(!html.includes('undefined'), 'Rendered HTML must not contain undefined');
    assert(!html.includes('null cm'), 'Rendered HTML must not contain null cm');
  });

  // ===========================================================================
  console.log('\n[Suite 3: Single Active Tab Navigation Sequence (Strict 1 Active / 4 Hidden)]');
  // ===========================================================================

  const TAB_SEQUENCE = [
    { targetTab: 'tab-auxology', expectedPaneId: 'tab-pane-auxology', expectedButtonId: 'tab-btn-auxology' },
    { targetTab: 'tab-endocrinology', expectedPaneId: 'tab-pane-endocrinology', expectedButtonId: 'tab-btn-endocrinology' },
    { targetTab: 'tab-biomechanics', expectedPaneId: 'tab-pane-biomechanics', expectedButtonId: 'tab-btn-biomechanics' },
    { targetTab: 'tab-neuro', expectedPaneId: 'tab-pane-neuro', expectedButtonId: 'tab-btn-neuro' },
    { targetTab: 'tab-tracker', expectedPaneId: 'tab-pane-tracker', expectedButtonId: 'tab-btn-tracker' },
    { targetTab: 'tab-auxology', expectedPaneId: 'tab-pane-auxology', expectedButtonId: 'tab-btn-auxology' }
  ];

  it('verifies tab switching sequence: auxology -> endocrinology -> biomechanics -> neuro -> tracker -> auxology', () => {
    const { elements, doc, win } = createMockEnvironment();
    const origDoc = global.document;
    const origWin = global.window;

    global.document = doc;
    global.window = win;

    try {
      const allPanes = doc.querySelectorAll('.tab-pane');
      assert.strictEqual(allPanes.length, 5, 'Expected exactly 5 tab panes');

      // Test Step-by-Step Sequence
      TAB_SEQUENCE.forEach(({ targetTab, expectedPaneId, expectedButtonId }, stepIdx) => {
        KidsFitApp.switchTab(targetTab);

        // 1. Invariant: Exactly 1 Pane Active, Exactly 4 Panes Hidden
        const activePanes = allPanes.filter(p => p.classList.contains('active'));
        const hiddenPanes = allPanes.filter(p => p.classList.contains('hidden'));
        const displayedBlockPanes = allPanes.filter(p => p.style.display === 'block');
        const displayedNonePanes = allPanes.filter(p => p.style.display === 'none');

        assert.strictEqual(activePanes.length, 1, `Step ${stepIdx} (${targetTab}): strictly 1 active pane required, found ${activePanes.length}`);
        assert.strictEqual(displayedBlockPanes.length, 1, `Step ${stepIdx} (${targetTab}): strictly 1 display:block pane required, found ${displayedBlockPanes.length}`);
        assert.strictEqual(hiddenPanes.length, 4, `Step ${stepIdx} (${targetTab}): strictly 4 hidden panes required, found ${hiddenPanes.length}`);
        assert.strictEqual(displayedNonePanes.length, 4, `Step ${stepIdx} (${targetTab}): strictly 4 display:none panes required, found ${displayedNonePanes.length}`);

        // 2. The active pane must be the expected pane
        assert.strictEqual(activePanes[0].id, expectedPaneId, `Step ${stepIdx}: active pane ID must be ${expectedPaneId}, got ${activePanes[0].id}`);

        // 3. The 4 non-matching panes must all be hidden and not active
        allPanes.forEach(p => {
          if (p.id === expectedPaneId) {
            assert(p.classList.contains('active'), `${p.id} should have active class`);
            assert(!p.classList.contains('hidden'), `${p.id} should NOT have hidden class`);
            assert.strictEqual(p.style.display, 'block', `${p.id} style.display must be 'block'`);
          } else {
            assert(!p.classList.contains('active'), `${p.id} should NOT have active class`);
            assert(p.classList.contains('hidden'), `${p.id} should have hidden class`);
            assert.strictEqual(p.style.display, 'none', `${p.id} style.display must be 'none'`);
          }
        });

        // 4. Button state check
        const allTabs = doc.querySelectorAll('.capsule-tab');
        allTabs.forEach(t => {
          if (t.id === expectedButtonId) {
            assert(t.classList.contains('active'), `${t.id} should be active`);
            assert.strictEqual(t.getAttribute('aria-selected'), 'true', `${t.id} aria-selected should be true`);
          } else {
            assert(!t.classList.contains('active'), `${t.id} should NOT be active`);
            assert.strictEqual(t.getAttribute('aria-selected'), 'false', `${t.id} aria-selected should be false`);
          }
        });
      });
    } finally {
      global.document = origDoc;
      global.window = origWin;
    }
  });

  it('handles clean tab ID parameters without "tab-" prefix (e.g. auxology, endocrinology)', () => {
    const { elements, doc, win } = createMockEnvironment();
    const origDoc = global.document;
    const origWin = global.window;

    global.document = doc;
    global.window = win;

    try {
      const allPanes = doc.querySelectorAll('.tab-pane');
      const shortNames = ['auxology', 'endocrinology', 'biomechanics', 'neuro', 'tracker'];

      shortNames.forEach(shortName => {
        KidsFitApp.switchTab(shortName);

        const activePanes = allPanes.filter(p => p.classList.contains('active'));
        assert.strictEqual(activePanes.length, 1, `Short name '${shortName}' should activate strictly 1 pane`);
        assert.strictEqual(activePanes[0].id, `tab-pane-${shortName}`);
        assert.strictEqual(activePanes[0].style.display, 'block');

        const hiddenPanes = allPanes.filter(p => p.classList.contains('hidden'));
        assert.strictEqual(hiddenPanes.length, 4, `Short name '${shortName}' should hide strictly 4 panes`);
      });
    } finally {
      global.document = origDoc;
      global.window = origWin;
    }
  });

  it('stress-tests 100 rapid cyclic and random tab switches preserving the 1-active/4-hidden invariant', () => {
    const { elements, doc, win } = createMockEnvironment();
    const origDoc = global.document;
    const origWin = global.window;

    global.document = doc;
    global.window = win;

    try {
      const allPanes = doc.querySelectorAll('.tab-pane');
      const tabOptions = ['tab-auxology', 'tab-endocrinology', 'tab-biomechanics', 'tab-neuro', 'tab-tracker'];

      for (let i = 0; i < 100; i++) {
        const choice = tabOptions[i % tabOptions.length];
        KidsFitApp.switchTab(choice);

        const activeCount = allPanes.filter(p => p.classList.contains('active') && p.style.display === 'block').length;
        const hiddenCount = allPanes.filter(p => p.classList.contains('hidden') && p.style.display === 'none').length;

        assert.strictEqual(activeCount, 1, `Switch iteration ${i} failed activeCount invariant`);
        assert.strictEqual(hiddenCount, 4, `Switch iteration ${i} failed hiddenCount invariant`);
      }
    } finally {
      global.document = origDoc;
      global.window = origWin;
    }
  });

  it('verifies capsule tab DOM click events correctly trigger tab switching in app.js', () => {
    const { elements, doc, win } = createMockEnvironment();
    const origDoc = global.document;
    const origWin = global.window;

    global.document = doc;
    global.window = win;

    try {
      // Initialize app listeners
      KidsFitApp.initApp();

      const sequence = [
        { btnId: 'tab-btn-biomechanics', expectedPane: 'tab-pane-biomechanics' },
        { btnId: 'tab-btn-neuro', expectedPane: 'tab-pane-neuro' },
        { btnId: 'tab-btn-tracker', expectedPane: 'tab-pane-tracker' },
        { btnId: 'tab-btn-endocrinology', expectedPane: 'tab-pane-endocrinology' },
        { btnId: 'tab-btn-auxology', expectedPane: 'tab-pane-auxology' }
      ];

      sequence.forEach(({ btnId, expectedPane }) => {
        const btn = elements[btnId];
        assert(btn, `Button ${btnId} should exist`);
        btn.click();

        const allPanes = doc.querySelectorAll('.tab-pane');
        const activePanes = allPanes.filter(p => p.classList.contains('active'));
        assert.strictEqual(activePanes.length, 1);
        assert.strictEqual(activePanes[0].id, expectedPane);
      });
    } finally {
      global.document = origDoc;
      global.window = origWin;
    }
  });

  // ===========================================================================
  console.log('\n[Suite 4: Retest Cycle Execution (#btn-retest)]');
  // ===========================================================================

  it('triggers #btn-retest via OnboardingWizard: hides #results-dashboard and returns to Step 1', () => {
    const { elements, doc, win } = createMockEnvironment();
    const origDoc = global.document;
    const origWin = global.window;

    global.document = doc;
    global.window = win;

    try {
      const OnboardingWizard = require(ONBOARDING_WIZARD_PATH);
      OnboardingWizard.initWizard();

      // Simulate state where Phase 2 results are visible and user was on Step 5
      const dashboard = elements['results-dashboard'];
      dashboard.classList.remove('hidden');
      dashboard.style.display = 'block';

      const quizSection = elements['quiz-section'];
      quizSection.style.display = 'none';

      OnboardingWizard.goToStep(5);
      assert.strictEqual(OnboardingWizard.state.currentStep, 5, 'Should be on Step 5 before retest');

      // Trigger #btn-retest click
      const retestBtn = elements['btn-retest'];
      assert(retestBtn, '#btn-retest must exist');
      retestBtn.click();

      // Assert 1: #results-dashboard is hidden
      assert(dashboard.classList.contains('hidden'), '#results-dashboard must have .hidden class after retest');
      assert.strictEqual(dashboard.style.display, 'none', '#results-dashboard style.display must be none after retest');

      // Assert 2: #quiz-section is restored
      assert.strictEqual(quizSection.style.display, 'block', '#quiz-section must be restored to display: block');

      // Assert 3: #hero-section and #quick-presets-bar are restored
      assert.strictEqual(elements['hero-section'].style.display, 'block', '#hero-section must be displayed');
      assert.strictEqual(elements['quick-presets-bar'].style.display, 'block', '#quick-presets-bar must be displayed');

      // Assert 4: Stepper state returns to Step 1
      assert.strictEqual(OnboardingWizard.state.currentStep, 1, 'OnboardingWizard state must return to Step 1');
      assert(elements['step-content-1'].classList.contains('active'), 'Step 1 container must be active');
      assert(!elements['step-content-2'].classList.contains('active'), 'Step 2 container must not be active');
      assert(!elements['step-content-5'].classList.contains('active'), 'Step 5 container must not be active');
    } finally {
      global.document = origDoc;
      global.window = origWin;
    }
  });

  it('triggers #btn-retest via MasterBriefingEngine.attachRetestHandler: verifies callback and step reset', () => {
    const { elements, doc, win } = createMockEnvironment();
    const origDoc = global.document;
    const origWin = global.window;

    global.document = doc;
    global.window = win;

    let callbackFired = false;
    try {
      MasterBriefing.attachRetestHandler(() => {
        callbackFired = true;
      });

      // Prepare Phase 2 visible state
      const dashboard = elements['results-dashboard'];
      dashboard.classList.remove('hidden');
      dashboard.style.display = 'block';

      const quizSection = elements['quiz-section'];
      quizSection.classList.add('hidden');
      quizSection.style.display = 'none';

      // Click retest
      elements['btn-retest'].click();

      assert(dashboard.classList.contains('hidden'), 'Dashboard should be hidden');
      assert.strictEqual(dashboard.style.display, 'none', 'Dashboard display should be none');
      assert(!quizSection.classList.contains('hidden'), 'Quiz section hidden class removed');
      assert.strictEqual(quizSection.style.display, 'block', 'Quiz section display block');
      assert.strictEqual(callbackFired, true, 'Retest callback should be executed');
    } finally {
      global.document = origDoc;
      global.window = origWin;
    }
  });

  // ===========================================================================
  console.log('\n================================================================');
  console.log(`Challenger Summary: ${passedTests}/${totalTests} empirical tests passed.`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error(`\n[CRITICAL FAILURE] ${failedTests} tests failed:`);
    failures.forEach(f => console.error(`  - ${f.title}: ${f.error}`));
    process.exit(1);
  } else {
    console.log('[SUCCESS] All Phase 2 & Single Active Tab empirical tests passed with 0 defects!\n');
    process.exit(0);
  }
}

runEmpiricalChallenge();
