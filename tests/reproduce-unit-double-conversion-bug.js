/**
 * tests/reproduce-unit-double-conversion-bug.js
 * Empirical reproduction of unit switch double-conversion bug
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Setup mock DOM
const elements = {};
function makeEl(id, val = '') {
  elements[id] = {
    id,
    value: val,
    min: '', max: '', placeholder: '',
    style: {},
    classList: { toggle() {}, contains: () => false, add() {}, remove() {} },
    dataset: {},
    addEventListener() {},
    dispatchEvent() {}
  };
  return elements[id];
}

makeEl('child-height', '60.0');
makeEl('child-height-ft', '5');
makeEl('child-height-in', '0.0');
makeEl('child-weight', '100.0');
makeEl('child-weight-lbs', '100.0');
makeEl('child-recent-gain', '1.0');
makeEl('father-height', '70.0');
makeEl('father-height-ft', '5');
makeEl('father-height-in', '10.0');
makeEl('mother-height', '65.0');
makeEl('mother-height-ft', '5');
makeEl('mother-height-in', '5.0');
makeEl('gender-boy');
makeEl('gender-girl');
makeEl('mph-badge-value');
makeEl('btn-unit-toggle');
makeEl('btn-step2-unit-imperial');
makeEl('btn-step2-unit-metric');
makeEl('btn-step3-unit-imperial');
makeEl('btn-step3-unit-metric');

const doc = {
  readyState: 'complete',
  documentElement: {
    lang: 'en',
    attributes: { 'data-unit-system': 'imperial' },
    getAttribute(k) { return this.attributes[k] || null; },
    setAttribute(k, v) { this.attributes[k] = String(v); }
  },
  getElementById: (id) => elements[id] || null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {}
};

const win = {
  document: doc,
  localStorage: {
    _data: { taller_unit: 'imperial' },
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  location: { hostname: 'kisfitglobal.com', search: '' },
  addEventListener() {},
  CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init ? init.detail : {}; } }
};

global.document = doc;
global.window = win;
global.CustomEvent = win.CustomEvent;

const i18n = require('../src/js/i18n');
win.TallerI18n = i18n;
global.TallerI18n = i18n;
i18n.setUnitSystem('imperial');

const wizard = require('../src/js/onboarding-wizard');
wizard.initDualUnitSelector();

console.log('--- Initial Values in Imperial Mode ---');
console.log('child-height (in):', elements['child-height'].value);
console.log('child-weight (lbs):', elements['child-weight'].value);

console.log('\n--- Switching to Metric Mode via wizard.setUnitSystem("metric") ---');
wizard.setUnitSystem('metric');

console.log('Resulting child-height:', elements['child-height'].value);
console.log('Expected child-height: 152.4 cm (60.0 * 2.54)');
console.log('Resulting child-weight:', elements['child-weight'].value);
console.log('Expected child-weight: 45.4 kg (100.0 / 2.20462)');

if (elements['child-height'].value === '387.1') {
  console.log('\n❌ EMPIRICAL BUG CONFIRMED: Double conversion occurred! 60.0 in -> 152.4 cm in i18n.js -> 387.1 cm in onboarding-wizard.js');
  process.exit(0);
} else {
  console.log('\nNo double conversion detected.');
  process.exit(1);
}
