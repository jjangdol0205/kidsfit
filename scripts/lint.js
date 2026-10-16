/**
 * MoneyFit Zero-Dependency Syntax & Schema Validator (Linter)
 *
 * Validates JavaScript syntax across all source, script, and test files
 * using Node.js built-in AST compiler (`node --check`).
 * Validates configuration integrity for `monetization.config.json`.
 *
 * Exit code: 0 on success, 1 on any syntax or configuration error.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const targetDirs = ['src', 'scripts', 'tests'];

console.log('===============================================================');
console.log('       MONEYFIT ZERO-DEPENDENCY SYNTAX & INTEGRITY LINT        ');
console.log('===============================================================');

function findJsFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findJsFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

let hasError = false;
let jsFilesChecked = 0;

// 1. Validate JS syntax with node --check
console.log('\n[1/2] Checking JavaScript syntax across src/, scripts/, and tests/ ...');
for (const dirName of targetDirs) {
  const dirPath = path.join(rootDir, dirName);
  const files = findJsFiles(dirPath);
  for (const file of files) {
    jsFilesChecked++;
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
      console.log(`  ✓ [SYNTAX OK] ${relPath}`);
    } catch (err) {
      hasError = true;
      console.error(`  ✗ [SYNTAX ERROR] ${relPath}`);
      if (err.stderr) {
        console.error(err.stderr.toString().trim());
      } else {
        console.error(err.message);
      }
    }
  }
}

// 2. Validate monetization.config.json
console.log('\n[2/2] Validating JSON schema and structural integrity ...');
const jsonConfigPath = path.join(rootDir, 'monetization.config.json');
try {
  if (!fs.existsSync(jsonConfigPath)) {
    throw new Error('monetization.config.json file does not exist');
  }
  const raw = fs.readFileSync(jsonConfigPath, 'utf8');
  const parsed = JSON.parse(raw);
  const requiredKeys = ['siteUrl', 'coupangAfId', 'linkPriceId', 'cpaMemberId', 'campaigns', 'merchants'];
  for (const key of requiredKeys) {
    if (parsed[key] === undefined) {
      throw new Error(`Missing required top-level configuration key: "${key}"`);
    }
  }
  if (typeof parsed.campaigns !== 'object' || Object.keys(parsed.campaigns).length === 0) {
    throw new Error('campaigns dictionary must be a non-empty object');
  }
  if (typeof parsed.merchants !== 'object' || Object.keys(parsed.merchants).length === 0) {
    throw new Error('merchants dictionary must be a non-empty object');
  }
  console.log(`  ✓ [CONFIG OK] monetization.config.json (${Object.keys(parsed.campaigns).length} campaigns, ${Object.keys(parsed.merchants).length} merchants)`);
} catch (err) {
  hasError = true;
  console.error(`  ✗ [CONFIG ERROR] monetization.config.json: ${err.message}`);
}

console.log('\n===============================================================');
if (hasError) {
  console.error(`❌ LINT FAILED: Syntax or schema errors were detected.`);
  console.log('===============================================================');
  process.exit(1);
} else {
  console.log(`🎉 LINT PASSED: ${jsFilesChecked} JS files and monetization.config.json verified with 0 errors.`);
  console.log('===============================================================');
  process.exit(0);
}
