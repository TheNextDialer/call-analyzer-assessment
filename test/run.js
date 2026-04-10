/**
 * Test runner — no dependencies needed.
 */

const results = { passed: 0, failed: 0, errors: [] };

function describe(name, fn) {
  console.log(`\n  ${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    results.passed++;
    console.log(`    ✓ ${name}`);
  } catch (err) {
    results.failed++;
    results.errors.push({ test: name, error: err.message });
    console.log(`    ✗ ${name}`);
    console.log(`      → ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

global.describe = describe;
global.it = it;
global.assert = assert;
global.assertEqual = assertEqual;

console.log('\n══════════════════════════════════');
console.log('  Call Report Challenge');
console.log('══════════════════════════════════');

require('./report.test');

// Generate verification code
const crypto = require('crypto');
const verifyInput = `ca-${results.passed}-${results.failed}-phoneburner`;
const verifyCode = crypto.createHash('sha256').update(verifyInput).digest('hex').slice(0, 8);

console.log('\n──────────────────────────────────');
console.log(`  Results: ${results.passed} passed, ${results.failed} failed`);
console.log(`  Verification: ${verifyCode}`);
if (results.errors.length > 0) {
  console.log('\n  Failures:');
  results.errors.forEach((e, i) => {
    console.log(`    ${i + 1}. ${e.test}`);
    console.log(`       ${e.error}`);
  });
}
console.log('──────────────────────────────────\n');

process.exit(results.failed > 0 ? 1 : 0);
