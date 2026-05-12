/**
 * Test runner — no dependencies needed.
 *
 * After the test suite runs, this asks the assessment server for a
 * verification code bound to your session, then prints it next to the results
 * so you can copy/paste the whole output into the submission form. The server
 * computes an HMAC over (your token, passed, failed); the secret lives on the
 * server, so the code can't be forged locally.
 *
 * Required env vars (the assessment app shows them on the setup screen):
 *   ASSESSMENT_API     e.g. https://hire.thenextdialerdev.com
 *   ASSESSMENT_TOKEN   your candidate session token
 *
 * If either is missing or the fetch fails, the runner prints a hint instead of
 * a code and the submission won't pass auto-grade — re-export the vars and run
 * `npm test` again.
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

(async () => {
  const api = (process.env.ASSESSMENT_API || '').replace(/\/+$/, '');
  const token = process.env.ASSESSMENT_TOKEN || '';

  let verifyLine;
  if (!api || !token) {
    verifyLine =
      '  Verification: (skipped — set ASSESSMENT_API and ASSESSMENT_TOKEN, then re-run `npm test`)';
  } else {
    try {
      const res = await fetch(`${api}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: token,
          prefix: 'ca',
          passed: results.passed,
          failed: results.failed,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        verifyLine = `  Verification: (server returned ${res.status}: ${text.slice(0, 120)})`;
      } else {
        const json = await res.json();
        if (json && typeof json.verification === 'string') {
          verifyLine = `  Verification: ${json.verification}`;
        } else {
          verifyLine = '  Verification: (unexpected response shape from /api/verify)';
        }
      }
    } catch (err) {
      verifyLine = `  Verification: (request failed — ${err.message})`;
    }
  }

  console.log('\n──────────────────────────────────');
  console.log(`  Results: ${results.passed} passed, ${results.failed} failed`);
  console.log(verifyLine);
  if (results.errors.length > 0) {
    console.log('\n  Failures:');
    results.errors.forEach((e, i) => {
      console.log(`    ${i + 1}. ${e.test}`);
      console.log(`       ${e.error}`);
    });
  }
  console.log('──────────────────────────────────\n');

  process.exit(results.failed > 0 ? 1 : 0);
})();
