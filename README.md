# PhoneBurner Call Analyzer

A Node.js service that analyzes sales call data. Used internally by PhoneBurner's coaching and analytics team.

## What It Does

- **Call Outcome Classification** — Classifies calls as connected, voicemail, no answer, busy, or wrong number
- **Talk Ratio Analysis** — Measures rep vs. prospect talk time
- **Coaching Detector** — Identifies monologues, missed buying signals, and interruptions
- **CRM Disposition Mapping** — Maps outcomes to standardized CRM codes
- **Call Quality Scoring** — Composite quality score (0-100)
- **Summary Generator** — One-line call summaries for activity feeds

## Quick Start

```bash
npm install
npm test
```

## Your Task

There are two parts to this challenge:

### Part 1: Fix the Bugs

The test suite has several failing tests across the existing modules. Find the bugs and fix them.

### Part 2: Legacy Scorer Migration

We have a legacy call quality scoring algorithm in `oracle/legacy-scorer.js`. It works, but it's a minified module we can't maintain. We need a clean reimplementation.

Your job: reverse-engineer the algorithm and implement it in `src/reimpl.js`.

Use the probe tool to experiment with the oracle:

```bash
node tools/probe.js '{"outcome":"connected","durationMs":180000,"repPct":45,"missedSignals":0,"monologues":0,"prospectUtterances":8,"disposition":"CONVERSATION"}'
```

Try varying one parameter at a time to discover what each component does.

**All tests must pass** — both the bug fixes and the reimplementation.

## Project Structure

```
src/
  analyzer.js      — Main orchestrator
  outcome.js       — Call outcome classification
  talk-ratio.js    — Talk/listen ratio
  coaching.js      — Coaching moment detection
  disposition.js   — CRM disposition mapping
  scoring.js       — Quality scoring (existing implementation)
  reimpl.js        — YOUR TASK: reimplementation of the legacy scorer
  summary.js       — One-line summaries
  utils.js         — Shared utilities
oracle/
  legacy-scorer.js — Legacy scoring algorithm (minified, callable)
tools/
  probe.js         — CLI tool to call the legacy oracle
test/
  run.js           — Test runner
  reimpl.test.js   — Compares your reimpl to the oracle (20 test cases)
  *.test.js        — Module tests
data/
  *.json           — Sample call transcripts
```

## Rules

- Fix only `src/` files — do not modify tests or the oracle
- All tests must pass
