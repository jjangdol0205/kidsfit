/**
 * tests/run-all.js
 * Test runner for KidsFit Growth Studio
 * Scans tests/ directory, executes test suites, and outputs summary.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TESTS_DIR = __dirname;
const ROOT_DIR = path.resolve(TESTS_DIR, '..');

function runAllTests() {
  console.log('====================================================');
  console.log('   KidsFit Growth Studio - Test Suite Runner');
  console.log('====================================================');

  const files = fs.readdirSync(TESTS_DIR).filter((f) => f.endsWith('.test.js'));

  let totalSuites = 0;
  let passedSuites = 0;
  let failedSuites = 0;

  if (files.length === 0) {
    console.log('[INFO] No .test.js files found in tests/. Running baseline environment smoke tests...');

    const checks = [
      {
        name: 'package.json syntax & required fields',
        fn: () => {
          const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
          if (pkg.name !== 'kidsfit-growth-studio') throw new Error('Invalid package name');
          if (!pkg.scripts || !pkg.scripts.build || !pkg.scripts.test || !pkg.scripts.verify) {
            throw new Error('Missing required npm scripts (build, test, verify)');
          }
        }
      },
      {
        name: 'Preserved deployment assets (CNAME, .env, .git, .gitignore, deploy.yml)',
        fn: () => {
          ['CNAME', '.env', '.gitignore', '.github/workflows/deploy.yml'].forEach((p) => {
            if (!fs.existsSync(path.join(ROOT_DIR, p))) {
              throw new Error(`Required preserved asset missing: ${p}`);
            }
          });
          const cname = fs.readFileSync(path.join(ROOT_DIR, 'CNAME'), 'utf8').trim();
          if (!['kidsfit.co.kr', 'truthofmarket.com'].includes(cname)) throw new Error(`Unexpected CNAME: ${cname}`);
        }
      },
      {
        name: '.gitignore ignores .agents/ and .gemini/',
        fn: () => {
          const gitignore = fs.readFileSync(path.join(ROOT_DIR, '.gitignore'), 'utf8');
          if (!gitignore.includes('.agents/')) throw new Error('.agents/ missing from .gitignore');
          if (!gitignore.includes('.gemini/')) throw new Error('.gemini/ missing from .gitignore');
        }
      },
      {
        name: 'No legacy artifacts present',
        fn: () => {
          ['moneyfit-portal', '사업아이템', '오늘의_실전마케팅_스나이퍼_키트.md', '전자책_집필용_AI자율회사_구축_마스터북.md'].forEach((legacy) => {
            if (fs.existsSync(path.join(ROOT_DIR, legacy))) {
              throw new Error(`Legacy artifact still present: ${legacy}`);
            }
          });
        }
      }
    ];

    let passedChecks = 0;
    checks.forEach((chk) => {
      try {
        chk.fn();
        console.log(`  PASS: ${chk.name}`);
        passedChecks++;
      } catch (err) {
        console.error(`  FAIL: ${chk.name} - ${err.message}`);
      }
    });

    console.log('----------------------------------------------------');
    console.log(`Baseline Checks: ${passedChecks}/${checks.length} passed.`);
    if (passedChecks === checks.length) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }

  // If test files exist:
  for (const file of files) {
    totalSuites++;
    const testPath = path.join(TESTS_DIR, file);
    console.log(`\n>> Running suite [${totalSuites}]: ${file}`);
    const result = spawnSync('node', [testPath], {
      stdio: 'inherit',
      cwd: ROOT_DIR,
      env: process.env
    });

    if (result.status === 0) {
      passedSuites++;
      console.log(`[PASS] ${file}`);
    } else {
      failedSuites++;
      console.error(`[FAIL] ${file} (Exit code: ${result.status})`);
    }
  }

  console.log('====================================================');
  console.log(`Total Suites: ${totalSuites} | Passed: ${passedSuites} | Failed: ${failedSuites}`);
  console.log('====================================================');

  if (failedSuites > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests();
