/**
 * MoneyFit Portal - Master Automated Test Runner
 * Executes Tier 1 through Tier 4 Test Suites (80 Tests)
 * Zero external dependencies - pure Node.js native execution.
 */

const tier1 = require('./tier1-features.test');
const tier2 = require('./tier2-boundaries.test');
const tier3 = require('./tier3-interactions.test');
const tier4 = require('./tier4-workloads.test');

async function main() {
  console.log('===============================================================');
  console.log('   MONEYFIT PORTAL - 4-TIER AUTOMATED TEST SUITE EXECUTION     ');
  console.log('===============================================================');

  const startTime = Date.now();
  const suites = [tier1, tier2, tier3, tier4];
  const summary = [];

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const s of suites) {
    const res = await s.run();
    summary.push(res);
    totalTests += res.total;
    totalPassed += res.passed;
    totalFailed += res.failed;
  }

  const totalElapsed = Date.now() - startTime;

  console.log('\n===============================================================');
  console.log('                     TEST EXECUTION SUMMARY                    ');
  console.log('===============================================================');
  console.log('Tier Name                                      | Total | Pass | Fail | Time ');
  console.log('-----------------------------------------------+-------+------+------+------');
  for (const r of summary) {
    const namePadded = r.suiteName.padEnd(46, ' ').slice(0, 46);
    const tot = String(r.total).padStart(5, ' ');
    const pass = String(r.passed).padStart(4, ' ');
    const fail = String(r.failed).padStart(4, ' ');
    const time = `${r.elapsed}ms`.padStart(5, ' ');
    console.log(`${namePadded} | ${tot} | ${pass} | ${fail} | ${time}`);
  }
  console.log('-----------------------------------------------+-------+------+------+------');
  const totStr = String(totalTests).padStart(5, ' ');
  const passStr = String(totalPassed).padStart(4, ' ');
  const failStr = String(totalFailed).padStart(4, ' ');
  const timeStr = `${totalElapsed}ms`.padStart(5, ' ');
  console.log(`TOTAL                                          | ${totStr} | ${passStr} | ${failStr} | ${timeStr}`);
  console.log('===============================================================');

  if (totalFailed === 0) {
    console.log('🎉 ALL TEST SUITES PASSED WITH 0 FAILURES!');
    process.exit(0);
  } else {
    console.error(`❌ ${totalFailed} TEST(S) FAILED. CHECK LOGS ABOVE.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
