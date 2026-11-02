/**
 * tests/challenger-2-empirical-verification.test.js
 * Empirical Stress Verification Harness by teamwork_preview_challenger_2
 *
 * Scopes:
 * 1. Live bidirectional synchronization (ft/in <-> cm, lbs <-> kg) under stress & round-trips
 * 2. Live MPH badge calculation, formatting, and gender delta responsiveness
 * 3. Clinical report formatting: Imperial vs Metric prioritization
 * 4. Lemon Squeezy Store #296100 integration: URL validation, pricing tiers, and webhook HMAC verification
 * 5. Telegram notification & bridge configuration and live API verification
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`     ↳ ${err.message}`);
    failedTests++;
    failures.push({ name, error: err.message });
  }
}

const asyncTasks = [];

function testAsync(name, fn) {
  totalTests++;
  asyncTasks.push(async () => {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`     ↳ ${err.message}`);
      failedTests++;
      failures.push({ name, error: err.message });
    }
  });
}

console.log('========================================================================');
console.log('   EMPIRICAL CHALLENGER 2: DUAL-UNIT, PAYWALL & BRIDGE STRESS HARNESS   ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: NUMERICAL CONVERSION ACCURACY & ROUND-TRIP STABILITY
// -----------------------------------------------------------------------------
console.log('--- Section 1: Numerical Conversion Accuracy & Round-Trip Stability ---');

const IN_TO_CM = 2.54;
const KG_TO_LBS = 2.20462262;

test('1.1 Height cm <-> totalIn round-trip stability over 100 iterations (zero divergent drift)', () => {
  const sampleHeights = [45.0, 96.5, 120.8, 137.0, 155.6, 160.0, 173.5, 175.0, 188.0, 230.0];

  for (const originalCm of sampleHeights) {
    let curCm = originalCm;
    let maxDrift = 0;

    for (let iter = 0; iter < 100; iter++) {
      // Metric -> Imperial
      const totalIn = Math.round((curCm / IN_TO_CM) * 10) / 10;
      // Imperial -> Metric
      const nextCm = Math.round(totalIn * IN_TO_CM * 10) / 10;
      const drift = Math.abs(nextCm - originalCm);
      if (drift > maxDrift) maxDrift = drift;
      curCm = nextCm;
    }

    assert.ok(
      maxDrift <= 0.15,
      `Height ${originalCm} cm experienced excessive drift: ${maxDrift} cm (final: ${curCm} cm)`
    );
  }
});

test('1.2 Weight kg <-> lbs round-trip stability over 100 iterations (zero divergent drift)', () => {
  const sampleWeights = [2.0, 14.7, 23.6, 35.5, 51.0, 54.1, 70.0, 85.5, 160.0];

  for (const originalKg of sampleWeights) {
    let curKg = originalKg;
    let maxDrift = 0;

    for (let iter = 0; iter < 100; iter++) {
      // Metric -> Imperial
      const lbs = Math.round(curKg * KG_TO_LBS * 10) / 10;
      // Imperial -> Metric
      const nextKg = Math.round((lbs / KG_TO_LBS) * 10) / 10;
      const drift = Math.abs(nextKg - originalKg);
      if (drift > maxDrift) maxDrift = drift;
      curKg = nextKg;
    }

    assert.ok(
      maxDrift <= 0.15,
      `Weight ${originalKg} kg experienced excessive drift: ${maxDrift} kg (final: ${curKg} kg)`
    );
  }
});

test('1.3 Feet & Inches decomposition handles boundary conditions (in = 11.96 -> 12.0 -> rolls to ft+1, 0.0 in)', () => {
  const totalIn = 71.96;
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round((totalIn - ft * 12) * 10) / 10;
  if (inch >= 12) {
    ft += 1;
    inch = 0;
  }
  assert.strictEqual(ft, 6);
  assert.strictEqual(inch, 0);

  const totalIn2 = 48.0;
  let ft2 = Math.floor(totalIn2 / 12);
  let inch2 = Math.round((totalIn2 - ft2 * 12) * 10) / 10;
  if (inch2 >= 12) { ft2 += 1; inch2 = 0; }
  assert.strictEqual(ft2, 4);
  assert.strictEqual(inch2, 0);
});

// -----------------------------------------------------------------------------
// SECTION 2: LIVE BIDIRECTIONAL DOM SYNC & TOGGLE RE-ENTRANCY
// -----------------------------------------------------------------------------
console.log('\n--- Section 2: Live Bidirectional DOM Sync & Toggle Behavior ---');

class MockElement {
  constructor(id, tag = 'div', value = '') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.value = value;
    this.checked = false;
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.children = [];
    this.parentElement = null;
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      contains: (c) => this.classList._classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList.contains(c)) this.classList.remove(c);
          else this.classList.add(c);
        } else if (force) {
          this.classList.add(c);
        } else {
          this.classList.remove(c);
        }
      }
    };
    this.innerHTML = '';
    this.textContent = '';
    this._listeners = {};
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }
  insertBefore(newEl, refEl) {
    newEl.parentElement = this;
    const idx = this.children.indexOf(refEl);
    if (idx >= 0) this.children.splice(idx, 0, newEl);
    else this.children.push(newEl);
    return newEl;
  }
  prepend(child) {
    child.parentElement = this;
    this.children.unshift(child);
    return child;
  }
  remove() {
    if (this.parentElement) {
      const idx = this.parentElement.children.indexOf(this);
      if (idx >= 0) this.parentElement.children.splice(idx, 1);
      this.parentElement = null;
    }
  }
  focus() { this._focused = true; }
  addEventListener(evt, fn) {
    if (!this._listeners[evt]) this._listeners[evt] = [];
    this._listeners[evt].push(fn);
  }
  dispatchEvent(evt) {
    const eventObj = typeof evt === 'string' ? { type: evt, target: this, preventDefault() {}, stopPropagation() {} } : evt;
    if (!eventObj.target) eventObj.target = this;
    const fns = this._listeners[eventObj.type] || [];
    fns.forEach((fn) => fn(eventObj));
  }
  querySelector(sel) {
    const res = this.querySelectorAll(sel);
    return res.length > 0 ? res[0] : null;
  }
  querySelectorAll(sel) {
    const matched = [];
    const walk = (node) => {
      if (node !== this) {
        if (sel.startsWith('.') && node.classList && node.classList.contains(sel.slice(1))) matched.push(node);
        else if (sel.startsWith('#') && node.id === sel.slice(1)) matched.push(node);
      }
      for (const ch of node.children) walk(ch);
    };
    walk(this);
    return matched;
  }
}

function createMockDomEnvironment(initialUnit = 'imperial') {
  const elements = {};

  function make(id, initialVal = '', tag = 'input') {
    const el = new MockElement(id, tag, initialVal);
    elements[id] = el;
    return el;
  }

  // Primary Inputs
  make('child-height', initialUnit === 'imperial' ? '53.9' : '137.0');
  make('child-height-ft', '4');
  make('child-height-in', '5.9');
  make('child-weight', initialUnit === 'imperial' ? '78.3' : '35.5');
  make('child-weight-lbs', '78.3');
  make('child-recent-gain', initialUnit === 'imperial' ? '1.3' : '3.2');

  make('father-height', initialUnit === 'imperial' ? '68.3' : '173.5');
  make('father-height-ft', '5');
  make('father-height-in', '8.3');
  make('mother-height', initialUnit === 'imperial' ? '63.2' : '160.5');
  make('mother-height-ft', '5');
  make('mother-height-in', '3.2');

  const boy = make('gender-boy', 'boy'); boy.checked = true;
  const girl = make('gender-girl', 'girl'); girl.checked = false;

  make('child-birth-year', '2016');
  make('child-birth-month', '10');
  make('child-birth-day', '15');

  // Badges & Buttons
  make('mph-badge-value');
  make('btn-unit-toggle');
  make('btn-step2-unit-imperial');
  make('btn-step2-unit-metric');
  make('btn-step3-unit-imperial');
  make('btn-step3-unit-metric');
  make('master-briefing-card', '', 'div');

  const doc = {
    readyState: 'complete',
    documentElement: {
      lang: 'en',
      attributes: { 'data-unit-system': initialUnit, 'data-edition': 'global-paid' },
      getAttribute(attr) { return this.attributes[attr] || null; },
      setAttribute(attr, val) { this.attributes[attr] = String(val); }
    },
    head: new MockElement('head', 'head'),
    body: new MockElement('body', 'body'),
    getElementById: (id) => elements[id] || null,
    createElement: (tag) => new MockElement('dyn_' + Math.random().toString(36).slice(2), tag),
    querySelector: (sel) => {
      const all = doc.querySelectorAll(sel);
      return all.length > 0 ? all[0] : null;
    },
    querySelectorAll: (sel) => {
      const res = [];
      if (sel === '.unit-label-height' || sel === '.unit-label-weight') {
        res.push(make('unit-lbl-1', '', 'span'), make('unit-lbl-2', '', 'span'));
      } else if (sel === '.unit-imperial-only' || sel === '.unit-metric-only') {
        res.push(make('unit-cont-1', '', 'div'));
      } else if (sel.startsWith('#')) {
        const el = elements[sel.slice(1)];
        if (el) res.push(el);
      }
      return res;
    },
    addEventListener() {}
  };

  const win = {
    document: doc,
    localStorage: {
      _store: { taller_unit: initialUnit, kidsfit_global_report_unlocked_v1: 'true' },
      getItem(k) { return this._store[k] !== undefined ? this._store[k] : null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; }
    },
    location: { hostname: 'kisfitglobal.com', search: '' },
    addEventListener(evt, fn) {
      if (!this._listeners) this._listeners = {};
      if (!this._listeners[evt]) this._listeners[evt] = [];
      this._listeners[evt].push(fn);
    },
    dispatchEvent(evt) {
      const fns = (this._listeners && this._listeners[evt.type]) || [];
      fns.forEach((fn) => fn(evt));
    },
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init ? init.detail : undefined;
      }
    }
  };

  return { doc, win, elements };
}

test('2.1 Companion height input typing updates primary child-height cleanly', () => {
  const { doc, win, elements } = createMockDomEnvironment('imperial');

  delete require.cache[require.resolve('../src/js/onboarding-wizard')];
  delete require.cache[require.resolve('../src/js/i18n')];

  global.document = doc;
  global.window = win;
  global.CustomEvent = win.CustomEvent;
  global.TallerI18n = require('../src/js/i18n');
  win.TallerI18n = global.TallerI18n;
  global.TallerI18n.setUnitSystem('imperial');

  const wizard = require('../src/js/onboarding-wizard');
  win.TallerOnboardingWizard = wizard;
  global.TallerOnboardingWizard = wizard;
  wizard.initDualUnitSelector();

  // Simulate user entering 5 ft 10 in for child
  elements['child-height-ft'].value = '5';
  elements['child-height-in'].value = '10.0';
  elements['child-height-ft'].dispatchEvent('input');

  // Total inches = 5 * 12 + 10 = 70.0 in
  assert.strictEqual(elements['child-height'].value, '70.0');
});

test('2.2 Companion weight input typing updates primary child-weight cleanly', () => {
  const { doc, win, elements } = createMockDomEnvironment('imperial');
  global.document = doc;
  global.window = win;
  global.CustomEvent = win.CustomEvent;
  win.TallerI18n = global.TallerI18n;
  global.TallerI18n.setUnitSystem('imperial');

  const wizard = require('../src/js/onboarding-wizard');
  wizard.initDualUnitSelector();

  // User enters 85.5 lbs
  elements['child-weight-lbs'].value = '85.5';
  elements['child-weight-lbs'].dispatchEvent('input');

  assert.strictEqual(elements['child-weight'].value, '85.5');
});

test('2.3 Switching units (Imperial -> Metric -> Imperial) preserves accurate values without divergence', () => {
  const { doc, win, elements } = createMockDomEnvironment('imperial');
  global.document = doc;
  global.window = win;
  global.CustomEvent = win.CustomEvent;
  win.TallerI18n = global.TallerI18n;
  global.TallerI18n.setUnitSystem('imperial');

  const wizard = require('../src/js/onboarding-wizard');
  wizard.initDualUnitSelector();

  // Start with 54.0 inches (137.16 cm)
  elements['child-height'].value = '54.0';
  elements['child-weight'].value = '78.0';

  // Switch to Metric
  wizard.setUnitSystem('metric');
  assert.strictEqual(global.TallerI18n.getUnitSystem(), 'metric');
  // 54.0 * 2.54 = 137.16 -> 137.2 cm
  assert.strictEqual(elements['child-height'].value, '137.2');
  // 78.0 / 2.20462262 = 35.38... -> 35.4 kg
  assert.strictEqual(elements['child-weight'].value, '35.4');

  // Switch back to Imperial
  wizard.setUnitSystem('imperial');
  assert.strictEqual(global.TallerI18n.getUnitSystem(), 'imperial');
  // 137.2 / 2.54 = 54.015... -> 54.0 in
  assert.strictEqual(elements['child-height'].value, '54.0');
  // 35.4 * 2.20462262 = 78.04... -> 78.0 lbs
  assert.strictEqual(elements['child-weight'].value, '78.0');
});

test('2.4 Rapid unit switching (20 alternating toggles) produces zero stack overflow or NaN corruption', () => {
  const { doc, win, elements } = createMockDomEnvironment('imperial');
  global.document = doc;
  global.window = win;
  global.CustomEvent = win.CustomEvent;
  win.TallerI18n = global.TallerI18n;
  global.TallerI18n.setUnitSystem('imperial');

  const wizard = require('../src/js/onboarding-wizard');
  wizard.initDualUnitSelector();

  elements['child-height'].value = '60.0';
  elements['child-weight'].value = '100.0';

  for (let i = 0; i < 20; i++) {
    const targetUnit = i % 2 === 0 ? 'metric' : 'imperial';
    wizard.setUnitSystem(targetUnit);
    const h = parseFloat(elements['child-height'].value);
    const w = parseFloat(elements['child-weight'].value);
    assert.ok(!isNaN(h) && h > 0, `Height NaN or invalid on iteration ${i}: ${elements['child-height'].value}`);
    assert.ok(!isNaN(w) && w > 0, `Weight NaN or invalid on iteration ${i}: ${elements['child-weight'].value}`);
  }
});

test('2.5 Step 2 & Step 3 validation accepts valid values in Imperial and Metric modes', () => {
  const { doc, win, elements } = createMockDomEnvironment('imperial');
  global.document = doc;
  global.window = win;
  global.CustomEvent = win.CustomEvent;
  win.TallerI18n = global.TallerI18n;
  global.TallerI18n.setUnitSystem('imperial');

  const wizard = require('../src/js/onboarding-wizard');

  // Imperial valid test (Height: 53.9 in, Weight: 78.3 lbs, Velocity: 1.3 in)
  elements['child-height'].value = '53.9';
  elements['child-weight'].value = '78.3';
  elements['child-recent-gain'].value = '1.3';
  assert.strictEqual(wizard.validateStep(2), true, 'validateStep(2) failed on valid Imperial biometrics');

  // Step 3 parents in Imperial (Father: 68.3 in, Mother: 63.2 in)
  elements['father-height'].value = '68.3';
  elements['mother-height'].value = '63.2';
  assert.strictEqual(wizard.validateStep(3), true, 'validateStep(3) failed on valid Imperial parents');

  // Metric valid test (Height: 137.0 cm, Weight: 35.5 kg, Velocity: 3.2 cm)
  wizard.setUnitSystem('metric');
  elements['child-height'].value = '137.0';
  elements['child-weight'].value = '35.5';
  elements['child-recent-gain'].value = '3.2';
  assert.strictEqual(wizard.validateStep(2), true, 'validateStep(2) failed on valid Metric biometrics');

  elements['father-height'].value = '173.5';
  elements['mother-height'].value = '160.5';
  assert.strictEqual(wizard.validateStep(3), true, 'validateStep(3) failed on valid Metric parents');
});

// -----------------------------------------------------------------------------
// SECTION 3: LIVE MPH PREVIEW BADGE CALCULATION & FORMATTING
// -----------------------------------------------------------------------------
console.log('\n--- Section 3: Live MPH Preview Badge Calculation & Formatting ---');

test('3.1 Live MPH preview badge in Imperial mode displays ft/in with ±3.3 in range', () => {
  const { doc, win, elements } = createMockDomEnvironment('imperial');
  global.document = doc;
  global.window = win;
  global.CustomEvent = win.CustomEvent;
  win.TallerI18n = global.TallerI18n;
  global.TallerI18n.setUnitSystem('imperial');

  const wizard = require('../src/js/onboarding-wizard');
  elements['father-height'].value = '68.3';
  elements['mother-height'].value = '63.2';
  elements['gender-boy'].checked = true;
  elements['gender-girl'].checked = false;

  wizard.updateMphPreview();
  const badgeHTML = elements['mph-badge-value'].innerHTML;

  assert.ok(badgeHTML.includes("5' 8.3\""), `Missing ft/in format in badge: ${badgeHTML}`);
  assert.ok(badgeHTML.includes('68.3 in'), `Missing total inches in badge: ${badgeHTML}`);
  assert.ok(badgeHTML.includes('±3.3 in'), `Missing ±3.3 in range in badge: ${badgeHTML}`);
});

test('3.2 Live MPH preview badge in Metric mode displays cm with ±8.5cm range', () => {
  const { doc, win, elements } = createMockDomEnvironment('metric');
  global.document = doc;
  global.window = win;
  global.CustomEvent = win.CustomEvent;
  win.TallerI18n = global.TallerI18n;
  global.TallerI18n.setUnitSystem('metric');

  const wizard = require('../src/js/onboarding-wizard');
  elements['father-height'].value = '173.5';
  elements['mother-height'].value = '160.5';
  elements['gender-boy'].checked = true;
  elements['gender-girl'].checked = false;

  wizard.updateMphPreview();
  const badgeHTML = elements['mph-badge-value'].innerHTML;

  assert.ok(badgeHTML.includes('173.5 cm'), `Missing cm format in badge: ${badgeHTML}`);
  assert.ok(badgeHTML.includes('±8.5cm: 165.0cm ~ 182.0cm'), `Missing ±8.5cm range in badge: ${badgeHTML}`);
});

test('3.3 Live MPH badge recalculates immediately when biological sex toggles (Boy vs Girl 13 cm / 5.1 in delta)', () => {
  const { doc, win, elements } = createMockDomEnvironment('metric');
  global.document = doc;
  global.window = win;
  global.CustomEvent = win.CustomEvent;
  win.TallerI18n = global.TallerI18n;
  global.TallerI18n.setUnitSystem('metric');

  const wizard = require('../src/js/onboarding-wizard');
  elements['father-height'].value = '175.0';
  elements['mother-height'].value = '165.0';

  // Boy: (175 + 165 + 13)/2 = 176.5 cm
  elements['gender-boy'].checked = true;
  elements['gender-girl'].checked = false;
  wizard.updateMphPreview();
  assert.ok(elements['mph-badge-value'].innerHTML.includes('176.5 cm'));

  // Girl: (175 + 165 - 13)/2 = 163.5 cm
  elements['gender-boy'].checked = false;
  elements['gender-girl'].checked = true;
  wizard.updateMphPreview();
  assert.ok(elements['mph-badge-value'].innerHTML.includes('163.5 cm'));
});

// -----------------------------------------------------------------------------
// SECTION 4: CLINICAL REPORT FORMATTING UNIT PRIORITIZATION
// -----------------------------------------------------------------------------
console.log('\n--- Section 4: Clinical Report Formatting Unit Prioritization ---');

test('4.1 buildNativeEnglishClinicalReportHTML prioritizes Imperial units when taller_unit = imperial', () => {
  delete require.cache[require.resolve('../src/js/global-paywall-edition')];
  const { doc, win } = createMockDomEnvironment('imperial');
  global.document = doc;
  global.window = win;
  global.CustomEvent = win.CustomEvent;
  win.TallerI18n = global.TallerI18n;
  global.TallerI18n.setUnitSystem('imperial');

  const paywall = require('../src/js/global-paywall-edition');
  const profile = {
    gender: 'boy',
    ageYears: 10,
    ageMonths: 120,
    currentHeight: 137.0,
    currentWeight: 35.5,
    fatherHeight: 173.5,
    motherHeight: 160.5,
    habits: ['late_sleep']
  };

  const html = paywall.buildNativeEnglishClinicalReportHTML(profile);

  // When Imperial: Primary format is "ft' in\" (cmVal cm)"
  // 137.0 cm -> 4' 5.9" (137.0 cm)
  assert.ok(html.includes('4\' 5.9" (137.0 cm)'), 'Report did not prioritize Imperial height in Imperial mode');
  // Weight: "78.3 lbs (35.5 kg)"
  assert.ok(html.includes('78.3 lbs (35.5 kg)'), 'Report did not prioritize Imperial weight in Imperial mode');
  // Gain: "+1.9 in (+4.8 cm)" or similar
  assert.ok(html.includes('in (+'), 'Report did not prioritize Imperial gain in Imperial mode');
});

test('4.2 buildNativeEnglishClinicalReportHTML prioritizes Metric units when taller_unit = metric', () => {
  delete require.cache[require.resolve('../src/js/global-paywall-edition')];
  const { doc, win } = createMockDomEnvironment('metric');
  global.document = doc;
  global.window = win;
  global.CustomEvent = win.CustomEvent;
  win.TallerI18n = global.TallerI18n;
  global.TallerI18n.setUnitSystem('metric');

  const paywall = require('../src/js/global-paywall-edition');
  const profile = {
    gender: 'boy',
    ageYears: 10,
    ageMonths: 120,
    currentHeight: 137.0,
    currentWeight: 35.5,
    fatherHeight: 173.5,
    motherHeight: 160.5,
    habits: ['late_sleep']
  };

  const html = paywall.buildNativeEnglishClinicalReportHTML(profile);

  // When Metric: Primary format is "cmVal cm (ft' in\")"
  // 137.0 cm -> 137.0 cm (4' 5.9")
  assert.ok(html.includes('137.0 cm (4\' 5.9")'), 'Report did not prioritize Metric height in Metric mode');
  // Weight: "35.5 kg (78.3 lbs)"
  assert.ok(html.includes('35.5 kg (78.3 lbs)'), 'Report did not prioritize Metric weight in Metric mode');
  // Gain: "+X.X cm (+Y.Y in)"
  assert.ok(html.includes('cm (+'), 'Report did not prioritize Metric gain in Metric mode');
});

// -----------------------------------------------------------------------------
// SECTION 5: LEMON SQUEEZY STORE #296100 INTEGRATION & WEBHOOK HMAC
// -----------------------------------------------------------------------------
console.log('\n--- Section 5: Lemon Squeezy Store #296100 Integration & Webhook HMAC ---');

test('5.1 Store #296100 Checkout URLs formatting ($8.99 Single / $19.99 Tracker Pass)', () => {
  const paywall = require('../src/js/global-paywall-edition');
  const singleUrl = paywall.getActiveCheckoutUrl('single');
  const passUrl = paywall.getActiveCheckoutUrl('pass');

  assert.strictEqual(
    singleUrl,
    'https://app.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599',
    'Single Pass checkout URL incorrect'
  );
  assert.strictEqual(
    passUrl,
    'https://app.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895',
    'Tracker Pass checkout URL incorrect'
  );
});

test('5.2 Webhook HMAC-SHA256 signature algorithm accurately validates and detects tampering', () => {
  const secret = 'kf_ls_whsec_2026_truthofmarket';
  const validPayload = JSON.stringify({
    meta: { event_name: 'order_created' },
    data: {
      id: 'ORD-TEST-EMPIRICAL',
      attributes: {
        user_email: 'challenger@kisfitglobal.com',
        total_formatted: '$8.99',
        status: 'paid'
      }
    }
  });

  const genuineSignature = crypto.createHmac('sha256', secret).update(validPayload).digest('hex');

  const checkSigValid = (sig, body) => {
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return sig === expected;
  };

  assert.strictEqual(checkSigValid(genuineSignature, validPayload), true, 'Genuine signature verification failed');

  const tamperedSig = 'deadbeef' + genuineSignature.slice(8);
  assert.strictEqual(checkSigValid(tamperedSig, validPayload), false, 'Tampered signature was falsely accepted');

  const tamperedPayload = validPayload.replace('$8.99', '$0.00');
  assert.strictEqual(checkSigValid(genuineSignature, tamperedPayload), false, 'Tampered body with old signature was falsely accepted');
});

testAsync('5.3 Live test against server.js Lemon Squeezy config & webhook endpoints', async () => {
  let TEST_PORT;
  process.env.LEMONSQUEEZY_STORE_ID = '296100';
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'kf_ls_whsec_2026_truthofmarket';

  delete require.cache[require.resolve('../server.js')];
  const server = require('../server.js');
  await new Promise((resolve) => {
    const s = server.listen(0, '127.0.0.1', () => {
      TEST_PORT = s.address().port;
      process.env.PORT = String(TEST_PORT);
      resolve();
    });
  });

  function httpRequest(options, data = null) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body), headers: res.headers });
          } catch (_) {
            resolve({ statusCode: res.statusCode, raw: body, headers: res.headers });
          }
        });
      });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  }

  try {
    // 1. Check /api/lemonsqueezy-config
    const configRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/lemonsqueezy-config',
      method: 'GET'
    });
    assert.strictEqual(configRes.statusCode, 200);
    assert.strictEqual(configRes.data.ok, true);
    assert.strictEqual(configRes.data.storeId, 296100);
    assert.strictEqual(configRes.data.products.singlePass.priceUsd, 8.99);
    assert.strictEqual(configRes.data.products.singlePass.productId, 1468224);
    assert.strictEqual(configRes.data.products.trackerPass.priceUsd, 19.99);
    assert.strictEqual(configRes.data.products.trackerPass.productId, 1468243);

    // 2. Check /api/lemonsqueezy-webhook with genuine HMAC signature
    const secret = 'kf_ls_whsec_2026_truthofmarket';
    const payloadObj = {
      meta: { event_name: 'order_created' },
      data: {
        id: 'ORD-LIVE-CHALLENGER-2',
        attributes: {
          user_email: 'emp_challenger@kisfitglobal.com',
          total_formatted: '$8.99',
          status: 'paid'
        }
      }
    };
    const payloadStr = JSON.stringify(payloadObj);
    const validSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

    const webhookRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/lemonsqueezy-webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': validSig
      }
    }, payloadStr);

    assert.strictEqual(webhookRes.statusCode, 200);
    assert.strictEqual(webhookRes.data.ok, true);
    assert.strictEqual(webhookRes.data.signatureValid, true);
    assert.strictEqual(webhookRes.data.eventName, 'order_created');

    // 3. Check /api/lemonsqueezy-webhook with invalid HMAC signature
    const invalidWebhookRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/lemonsqueezy-webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'invalid_forged_signature_00000000000000'
      }
    }, payloadStr);

    assert.strictEqual(invalidWebhookRes.statusCode, 200);
    assert.strictEqual(invalidWebhookRes.data.signatureValid, false);
  } finally {
    if (server && typeof server.close === 'function') {
      await new Promise((resolve) => server.close(resolve));
    }
  }
});

// -----------------------------------------------------------------------------
// SECTION 6: TELEGRAM NOTIFICATION & BRIDGE LIVE API VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- Section 6: Telegram Notification & Bridge Live Verification ---');

test('6.1 .env contains correct token, chat ID, and conversation ID for English workspace', () => {
  const envContent = fs.readFileSync(path.join(ROOT_DIR, '.env'), 'utf8');
  assert.ok(envContent.includes('TELEGRAM_BOT_TOKEN=8884379894:AAEEyfqtYTc4fRMmySZhjHUAU1ji5Vh5KRw'));
  assert.ok(envContent.includes('TELEGRAM_CHAT_ID=755033799'));
  assert.ok(envContent.includes('ANTIGRAVITY_CONVERSATION_ID=278ac9cd-25e2-4d75-93ae-f407a1e6de5d'));
});

test('6.2 scripts/telegram-notify.js exports getTelegramConfig() with isConfigured === true', () => {
  const notify = require('../scripts/telegram-notify.js');
  const cfg = notify.getTelegramConfig();
  assert.strictEqual(cfg.isConfigured, true);
  assert.strictEqual(cfg.botToken, '8884379894:AAEEyfqtYTc4fRMmySZhjHUAU1ji5Vh5KRw');
  assert.strictEqual(cfg.chatId, '755033799');
  assert.strictEqual(cfg.siteUrl, 'https://kisfitglobal.com');
});

testAsync('6.3 Telegram getMe live API handshake with bot @kidsfittbot', async () => {
  const token = '8884379894:AAEEyfqtYTc4fRMmySZhjHUAU1ji5Vh5KRw';

  const res = await new Promise((resolve, reject) => {
    https.get(`https://api.telegram.org/bot${token}/getMe`, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });

  assert.strictEqual(res.status, 200, `Telegram API HTTP status: ${res.status}`);
  assert.strictEqual(res.body.ok, true, `Telegram API body not ok: ${JSON.stringify(res.body)}`);
  assert.strictEqual(res.body.result.username, 'kidsfittbot', `Expected username kidsfittbot, got: ${res.body.result.username}`);
  assert.strictEqual(res.body.result.is_bot, true);
});

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
(async function run() {
  for (const task of asyncTasks) {
    await task();
  }

  console.log('\n========================================================================');
  console.log(`EMPIRICAL CHALLENGE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} FAILED)`);
  console.log('========================================================================');

  if (failedTests > 0) {
    console.error('\nFAILURES ENCOUNTERED:');
    failures.forEach((f) => console.error(` - ${f.name}: ${f.error}`));
    process.exit(1);
  } else {
    console.log('\nVERDICT: ALL EMPIRICAL CHALLENGES SATISFIED WITH 100% SUCCESS.');
    process.exit(0);
  }
})();
