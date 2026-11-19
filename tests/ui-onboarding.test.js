/**
 * tests/ui-onboarding.test.js
 * Division 5 (kidsfit.co.kr) — Boutique Pediatric Growth Atelier UI & Step-Up Funnel Tests
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'src', 'css', 'style.css'), 'utf8');
const atelier = require(path.join(ROOT, 'src', 'js', 'kfk-atelier-app.js'));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ [FAIL] ${name}: ${e.message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('   Boutique Pediatric Growth Atelier UI & Step-Up   ');
console.log('====================================================\n');

test('uses Warm Cream Linen (#FAF7F2), Soft Paper (#FFFFFF), and Forest Sage (#2F5241) palette', () => {
  assert(css.includes('#FAF7F2') && css.includes('#FFFFFF') && css.includes('#2F5241'));
  assert(css.includes('Nanum Myeongjo') && css.includes('Pretendard'));
});

test('presents Screen 0 empathetic Founding Letter & single start CTA with 0 commercial ads', () => {
  assert(html.includes('id="kfk-peer-growth-editorial"'));
  assert(html.includes('왜 이 성장 시계 연구소를 만들었나요'));
  assert(html.includes('id="btn-start-atelier-stepup"'));
  assert(!/coupang\.com|AF7865143|A100708867|IPZ1547/i.test(html));
});

test('includes 5 distinct step-up survey panels (#step-content-1 to #step-content-5) and no Step 6', () => {
  for (let i = 1; i <= 5; i++) {
    assert(html.includes(`id="step-content-${i}"`), `Missing #step-content-${i}`);
  }
  assert(!html.includes('id="step-content-6"'), 'Legacy Step 6 must not exist');
});

test('includes optional Bone-Age branch & Exam-Date Time-Lag (Δt) calibration in Step 4 (#kfk-bone-age-interpreter)', () => {
  assert(html.includes('id="kfk-bone-age-interpreter"'));
  assert(html.includes('아직 병원 뼈나이 검사 전입니다'));
  assert(html.includes('병원에서 들은 뼈나이(골연령) 결과가 있습니다'));
  const cal = atelier.computeBoneAgeDeltaCalibration({
    sex: 'girl',
    baYears: 9,
    baMonths: 4,
    lagMonths: 6,
    tempoAccel: false,
    nowDate: new Date(2026, 10, 18)
  });
  assert.strictEqual(cal.deltaMonths, 6);
});

test('includes Screen 2 passwordless email gate (#kfk-parent-habit-notebook / #kfk-passwordless-club-box)', () => {
  assert(html.includes('id="kfk-parent-habit-notebook"'));
  assert(html.includes('id="kfk-passwordless-club-box"'));
  assert(html.includes('기본 백분위 요약 무료로 열어보기'));
});

test('includes Screen 3 differential vault, Latpeed 2-Tier passes (9,900 / 19,900 KRW), and monthly velocity check-in', () => {
  assert(html.includes('id="kfk-latpeed-ebook-slot"'));
  assert(html.includes('id="kfk-vip-monthly-checkin"'));
  assert(html.includes('https://www.latpeed.com/products/daMaP'));
  assert(html.includes('https://www.latpeed.com/stores/7Frck'));
});

console.log('\n====================================================');
console.log(`Summary: ${passed}/${passed + failed} tests passed.`);
console.log('====================================================');
if (failed > 0) process.exit(1);
