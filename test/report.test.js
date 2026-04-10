const { generateReport } = require('../src/report-generator');
const fs = require('fs');
const path = require('path');

const allCalls = require('../data/calls.json');

describe('Report Generator', () => {
  it('should generate a report matching the expected output (all calls)', () => {
    const expected = fs.readFileSync(
      path.join(__dirname, '../expected/report.txt'),
      'utf-8'
    );
    const actual = generateReport(allCalls);

    if (actual !== expected) {
      const actualLines = actual.split('\n');
      const expectedLines = expected.split('\n');
      let diffs = 0;
      for (
        let i = 0;
        i < Math.max(actualLines.length, expectedLines.length);
        i++
      ) {
        if (actualLines[i] !== expectedLines[i] && diffs < 5) {
          console.log(`      Line ${i + 1}:`);
          console.log(`        expected: "${(expectedLines[i] || '').replace(/ /g, '·')}"`);
          console.log(`        got:      "${(actualLines[i] || '').replace(/ /g, '·')}"`);
          diffs++;
        }
      }
      if (diffs === 0) {
        console.log(
          `      Length mismatch: expected ${expectedLines.length} lines, got ${actualLines.length}`
        );
      }
      throw new Error(
        `Report does not match expected output (${diffs}+ line differences)`
      );
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
      const actualLines = actual.split('\n');
      const expectedLines = expected.split('\n');
      let diffs = 0;
      for (
        let i = 0;
        i < Math.max(actualLines.length, expectedLines.length);
        i++
      ) {
        if (actualLines[i] !== expectedLines[i] && diffs < 3) {
          console.log(`      Line ${i + 1}:`);
          console.log(`        expected: "${(expectedLines[i] || '').replace(/ /g, '·')}"`);
          console.log(`        got:      "${(actualLines[i] || '').replace(/ /g, '·')}"`);
          diffs++;
        }
      }
      throw new Error(
        `Single-call report does not match (${diffs}+ differences)`
      );
    }
  });
});
