const { generateReport } = require('../src/report-generator');
const fs = require('fs');
const path = require('path');

const allCalls = require('../data/calls.json');

function diffReports(actual, expected, maxShow) {
  const actualLines = actual.split('\n');
  const expectedLines = expected.split('\n');
  const totalLines = Math.max(actualLines.length, expectedLines.length);
  const diffs = [];
  for (let i = 0; i < totalLines; i++) {
    if (actualLines[i] !== expectedLines[i]) {
      diffs.push({ line: i + 1, expected: expectedLines[i] || '', got: actualLines[i] || '' });
    }
  }
  const shown = diffs.slice(0, maxShow);
  shown.forEach(d => {
    console.log(`      Line ${d.line}:`);
    console.log(`        expected: "${d.expected.replace(/ /g, '·')}"`);
    console.log(`        got:      "${d.got.replace(/ /g, '·')}"`);
  });
  if (diffs.length > maxShow) {
    console.log(`      ... and ${diffs.length - maxShow} more differences`);
  }
  if (actualLines.length !== expectedLines.length) {
    console.log(`      (expected ${expectedLines.length} lines, got ${actualLines.length})`);
  }
  return diffs.length;
}

describe('Report Generator', () => {
  it('should generate a report matching the expected output (all calls)', () => {
    const expected = fs.readFileSync(
      path.join(__dirname, '../expected/report.txt'),
      'utf-8'
    );
    const actual = generateReport(allCalls);
    if (actual !== expected) {
      const count = diffReports(actual, expected, 10);
      throw new Error(`Report does not match (${count} line differences)`);
    }
  });

  it('should generate a correct report for a single call', () => {
    const expected = fs.readFileSync(
      path.join(__dirname, '../expected/single-call-report.txt'),
      'utf-8'
    );
    // Use just call #2 (the second call in the data)
    const actual = generateReport([allCalls[1]]);
    if (actual !== expected) {
      const count = diffReports(actual, expected, 8);
      throw new Error(`Single-call report does not match (${count} differences)`);
    }
  });
});
