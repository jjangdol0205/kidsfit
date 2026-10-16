/**
 * Test Helper & Universal Module Loader for MoneyFit Portal
 * Pure native Node.js (zero external dependencies)
 */

const fs = require('fs');
const path = require('path');
const url = require('url');
const vm = require('vm');
const assert = require('assert');

let cachedCalculators = null;
let cachedMonetization = null;
let cachedPresets = null;

async function universalLoad(relativePath) {
  const fullPath = path.resolve(__dirname, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Target module not found: ${fullPath}`);
  }

  // 1. Try CommonJS require
  try {
    delete require.cache[require.resolve(fullPath)];
    const mod = require(fullPath);
    if (mod && Object.keys(mod).length > 0) {
      return mod;
    }
  } catch (err) {
    // If require fails, fall through to import or VM
  }

  // 2. Try dynamic import
  try {
    const fileUrl = url.pathToFileURL(fullPath).href;
    const esmMod = await import(fileUrl);
    if (esmMod) {
      return esmMod.default ? { ...esmMod, ...esmMod.default } : esmMod;
    }
  } catch (err) {
    // If dynamic import fails, fall through to VM
  }

  // 3. VM Sandbox fallback for vanilla script browser format
  const code = fs.readFileSync(fullPath, 'utf8');
  const sandbox = {
    module: { exports: {} },
    exports: {},
    window: {},
    global: {},
    console,
    Math,
    Number,
    String,
    Array,
    Object,
    Date,
    RegExp,
    JSON,
    encodeURIComponent,
    decodeURIComponent
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  if (sandbox.module && sandbox.module.exports && Object.keys(sandbox.module.exports).length > 0) {
    return sandbox.module.exports;
  }
  if (sandbox.exports && Object.keys(sandbox.exports).length > 0) {
    return sandbox.exports;
  }
  return sandbox;
}

async function getCalculators() {
  if (cachedCalculators) return cachedCalculators;
  cachedCalculators = await universalLoad('../src/data/calculators.js');
  return cachedCalculators;
}

async function getMonetization() {
  if (cachedMonetization) return cachedMonetization;
  cachedMonetization = await universalLoad('../src/data/monetization.js');
  return cachedMonetization;
}

async function getPresets() {
  if (cachedPresets) return cachedPresets;
  cachedPresets = await universalLoad('../src/data/presets.js');
  return cachedPresets;
}

function assertApprox(actual, expected, tolerance = 1, message = '') {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    const msg = message ? `${message}: ` : '';
    throw new assert.AssertionError({
      message: `${msg}Expected ${actual} to be approximately ${expected} (diff ${diff} > tolerance ${tolerance})`,
      actual,
      expected
    });
  }
}

function assertInRange(val, min, max, message = '') {
  if (val < min || val > max) {
    const msg = message ? `${message}: ` : '';
    throw new assert.AssertionError({
      message: `${msg}Expected ${val} to be within range [${min}, ${max}]`,
      actual: val,
      expected: `[${min}, ${max}]`
    });
  }
}

function assertStrictLTE(a, b, message = '') {
  if (a > b) {
    const msg = message ? `${message}: ` : '';
    throw new assert.AssertionError({
      message: `${msg}Strict constraint violated: ${a} > ${b}`,
      actual: a,
      expected: `<= ${b}`
    });
  }
}

function createTestSuite(suiteName) {
  const tests = [];
  return {
    test(name, fn) {
      tests.push({ name, fn });
    },
    async run() {
      console.log(`\n=== Running Test Suite: ${suiteName} ===`);
      let passed = 0;
      let failed = 0;
      const startTime = Date.now();
      const failures = [];

      for (const { name, fn } of tests) {
        try {
          await fn();
          passed++;
          console.log(`  ✓ PASS: ${name}`);
        } catch (err) {
          failed++;
          console.error(`  ✗ FAIL: ${name}`);
          console.error(`    -> ${err.message}`);
          failures.push({ name, error: err });
        }
      }

      const elapsed = Date.now() - startTime;
      console.log(`--- Results for ${suiteName}: ${passed} passed, ${failed} failed (${elapsed}ms) ---`);
      if (failed > 0) {
        console.error(`\nFailed tests in ${suiteName}:`);
        failures.forEach(f => {
          console.error(`  - ${f.name}: ${f.error.message}`);
          if (f.error.stack) console.error(`    ${f.error.stack.split('\n').slice(1, 3).join('\n')}`);
        });
      }
      return { suiteName, total: tests.length, passed, failed, elapsed, failures };
    }
  };
}

module.exports = {
  getCalculators,
  getMonetization,
  getPresets,
  universalLoad,
  assertApprox,
  assertInRange,
  assertStrictLTE,
  createTestSuite
};
