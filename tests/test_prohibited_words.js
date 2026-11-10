/**
 * tests/test_prohibited_words.js
 * Division 5 (kidsfit.co.kr) Zero-Tolerance Prohibited Words Regression Test
 *
 * Ground Rules (GEMINI.md & HEADLESS_MAINTENANCE_SPEC.md):
 * ❌ Strictly Prohibited: '최저가', '할인율', '특가', '폭탄세일' (Target: 0 occurrences)
 * ✅ Standard Alternatives: '혜택가 확인', '에디터 큐레이션', '공식 판매처 보러가기'
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

const PROHIBITED_WORDS = ['최저가', '할인율', '특가', '폭탄세일'];
const APPROVED_ALTERNATIVES = ['혜택가 확인', '에디터 큐레이션', '공식 판매처 보러가기'];

// Scanned directories & extensions for production code, templates, and data
const SCAN_DIRS = ['src', 'scripts', 'qna', 'samples'];
const ROOT_FILES = ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html'];
const VALID_EXTS = ['.html', '.js', '.json', '.css'];

// Excluded dirs: tests (contain assertions checking forbidden words), docs defining rules, git, node_modules
const EXCLUDE_DIRS = new Set(['tests', 'node_modules', '.git', '.agents', '.flow-browser-profile', '.naver-browser-profile', 'docs', '네이버카페_글모음', '네이버블로그_글모음']);

function getProductionFiles() {
  let fileList = [];

  // 1. Root standalone HTML/JS files
  ROOT_FILES.forEach(f => {
    const full = path.join(ROOT_DIR, f);
    if (fs.existsSync(full)) fileList.push(full);
  });

  // 2. Scan designated production directories
  function traverse(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (!EXCLUDE_DIRS.has(ent.name)) {
          traverse(fullPath);
        }
      } else if (ent.isFile()) {
        if (VALID_EXTS.some(ext => ent.name.endsWith(ext))) {
          // Skip large binary/data bundle files to prevent token waste
          if (ent.name === 'data-bundle.js' || ent.name === 'research-knowledge-base.json') {
            continue;
          }
          fileList.push(fullPath);
        }
      }
    }
  }

  SCAN_DIRS.forEach(sub => traverse(path.join(ROOT_DIR, sub)));
  return fileList;
}

console.log('========================================================================');
console.log('   ZERO-TOLERANCE PROHIBITED WORDS EMPIRICAL AUDIT & SCANNER             ');
console.log('========================================================================\n');

const filesToScan = getProductionFiles();
console.log(`Auditing ${filesToScan.length} production files across 5사업부 for zero-tolerance compliance...\n`);

let totalScannedLines = 0;
const violations = [];

filesToScan.forEach(filePath => {
  const relPath = path.relative(ROOT_DIR, filePath);
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn(`[WARN] Could not read ${relPath}: ${err.message}`);
    return;
  }

  const lines = content.split(/\r?\n/);
  totalScannedLines += lines.length;

  lines.forEach((line, lineIdx) => {
    for (const word of PROHIBITED_WORDS) {
      if (line.includes(word)) {
        violations.push({
          file: relPath,
          lineNum: lineIdx + 1,
          word,
          lineContent: line.trim()
        });
      }
    }
  });
});

// Verification of Approved Alternative Vocabulary Usage
let altOccurrences = {
  '혜택가 확인': 0,
  '에디터 큐레이션': 0,
  '공식 판매처 보러가기': 0
};

filesToScan.forEach(filePath => {
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    return;
  }
  APPROVED_ALTERNATIVES.forEach(alt => {
    const matches = content.match(new RegExp(alt, 'g'));
    if (matches) {
      altOccurrences[alt] += matches.length;
    }
  });
});

console.log('------------------------------------------------------------------------');
console.log(`Total Production Files Scanned : ${filesToScan.length}`);
console.log(`Total Production Lines Audited : ${totalScannedLines.toLocaleString()}`);
console.log(`Zero-Tolerance Violations Found: ${violations.length}`);
console.log('------------------------------------------------------------------------');

console.log('\n[Approved Alternative Vocabulary Active Adoption Statistics]');
APPROVED_ALTERNATIVES.forEach(alt => {
  console.log(`  ✓ "${alt}": ${altOccurrences[alt]} occurrences actively in use`);
});

if (violations.length > 0) {
  console.error('\n❌ ZERO-TOLERANCE COMPLIANCE FAILURE! Prohibited words detected:');
  violations.forEach((v, idx) => {
    console.error(`  [${idx + 1}] ${v.file}:${v.lineNum} contains forbidden word "${v.word}": ${v.lineContent.slice(0, 100)}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 100% ZERO-TOLERANCE COMPLIANCE CERTIFIED: Strictly 0 prohibited words detected!');
  assert.strictEqual(violations.length, 0);
  assert(altOccurrences['혜택가 확인'] > 0, 'Approved term "혜택가 확인" must be actively adopted');
  process.exit(0);
}
