/**
 * tests/test_prohibited_words.js
 * Division 5 (kidsfit.co.kr) Zero-Tolerance Prohibited Words Regression Test
 *
 * Ground Rules (GEMINI.md & HEADLESS_MAINTENANCE_SPEC.md):
 * - Strictly Prohibited across ALL files: '최저가', '할인율', '특가', '폭탄세일' (Target: 0 occurrences)
 * - Strictly Prohibited across web-served files: 'lemonsqueezy' (Target: 0 occurrences)
 * - Active Boutique Atelier Vocabulary: '성장 시계', '질병관리청', '마스터북'
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

const PROHIBITED_WORDS = ['최저가', '할인율', '특가', '폭탄세일'];
const WEB_FORBIDDEN_WORDS = ['lemonsqueezy'];
const ATELIER_VOCABULARY = ['성장 시계', '질병관리청', '마스터북'];

const SCAN_DIRS = ['src', 'scripts', 'qna', 'samples'];
const ROOT_FILES = ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html', 'coupang-kidsfit.html'];
const VALID_EXTS = ['.html', '.js', '.json', '.css'];

const EXCLUDE_DIRS = new Set([
  'tests',
  'node_modules',
  '.git',
  '.agents',
  '.flow-browser-profile',
  '.naver-browser-profile',
  'docs',
  '네이버카페_글모음',
  '네이버블로그_글모음'
]);

function getProductionFiles() {
  const fileList = [];

  ROOT_FILES.forEach((f) => {
    const full = path.join(ROOT_DIR, f);
    if (fs.existsSync(full)) fileList.push(full);
  });

  function traverse(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (!EXCLUDE_DIRS.has(ent.name)) {
          traverse(fullPath);
        }
      } else if (ent.isFile() && VALID_EXTS.some((ext) => ent.name.endsWith(ext))) {
        if (ent.name === 'data-bundle.js' || ent.name === 'research-knowledge-base.json') {
          continue;
        }
        fileList.push(fullPath);
      }
    }
  }

  SCAN_DIRS.forEach((sub) => traverse(path.join(ROOT_DIR, sub)));
  return fileList;
}

console.log('========================================================================');
console.log('   ZERO-TOLERANCE PROHIBITED WORDS EMPIRICAL AUDIT & SCANNER            ');
console.log('========================================================================\n');

const filesToScan = getProductionFiles();
console.log(`Auditing ${filesToScan.length} production files across 5사업부 for zero-tolerance compliance...\n`);

let totalScannedLines = 0;
const violations = [];
const vocabOccurrences = {
  '성장 시계': 0,
  '질병관리청': 0,
  '마스터북': 0
};

filesToScan.forEach((filePath) => {
  const relPath = path.relative(ROOT_DIR, filePath);
  const isLegacyCliScript = relPath.startsWith('scripts' + path.sep) && relPath !== path.join('scripts', 'build.js');
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
    if (!isLegacyCliScript) {
      for (const fw of WEB_FORBIDDEN_WORDS) {
        if (line.toLowerCase().includes(fw)) {
          violations.push({
            file: relPath,
            lineNum: lineIdx + 1,
            word: fw,
            lineContent: line.trim()
          });
        }
      }
    }
  });

  ATELIER_VOCABULARY.forEach((term) => {
    const matches = content.match(new RegExp(term, 'g'));
    if (matches) vocabOccurrences[term] += matches.length;
  });
});

console.log('------------------------------------------------------------------------');
console.log(`Total Production Files Scanned : ${filesToScan.length}`);
console.log(`Total Production Lines Audited : ${totalScannedLines.toLocaleString()}`);
console.log(`Zero-Tolerance Violations Found: ${violations.length}`);
console.log('------------------------------------------------------------------------');

console.log('\n[Boutique Pediatric Growth Atelier Core Vocabulary Statistics]');
ATELIER_VOCABULARY.forEach((term) => {
  console.log(`  ✓ "${term}": ${vocabOccurrences[term]} occurrences actively in use`);
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
  assert(vocabOccurrences['성장 시계'] > 0, 'Core Atelier term "성장 시계" must be actively adopted');
  assert(vocabOccurrences['질병관리청'] > 0, 'Official reference "질병관리청" must be actively adopted');
  process.exit(0);
}
