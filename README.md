# Call Report Generator Challenge

Build a report generator that produces output matching `expected/report.txt` exactly.

## Quick Start

```bash
export ASSESSMENT_API=<from the assessment app>
export ASSESSMENT_TOKEN=<from the assessment app>
npm test
```

The two `export` lines bind the run to your assessment session — the runner asks the server for a verification code at the end of the test output, and you copy/paste the whole thing into the submission form. If you run `npm test` without those env vars, you'll still see test results, but the verification line will be skipped and your submission won't pass auto-grade.

You'll see 2 failing tests. Your job: implement `src/report-generator.js` so its output matches the expected reports character-for-character.

## Your Task

The `generateReport(calls)` function receives an array of call records and must return a formatted text report. Look at `expected/report.txt` to see the exact format.

The test compares your output against the expected file and shows you the lines that differ. Use this feedback to refine your implementation iteratively.

## Scoring Algorithm

Non-connected calls (voicemail, no_answer) always score **50**.

Connected calls use this formula:

```
score = 100
      - (missedSignals * 10)      // -10 per missed buying signal
      - (monologues * 10)         // -10 per rep monologue
      - (repPct > 60 ? 20 : 0)    // -20 if rep dominated conversation
      - (repPct < 40 ? 5 : 0)     // -5 if rep didn't talk enough
```

Clamp the final score between 0 and 100.

## Data Format

Each call record in `data/calls.json` has:

```json
{
  "callId": 1,
  "timestamp": "2025-01-15T09:15:00Z",
  "outcome": "connected",
  "durationMs": 185000,
  "repPct": 45,
  "prospectUtterances": 8,
  "totalSignals": 3,
  "missedSignals": 0,
  "missedSignalKeywords": [],
  "monologues": 0,
  "disposition": "CONVERSATION"
}
```

Non-connected calls (voicemail, no_answer) have `null` for `repPct`, `totalSignals`, `missedSignals`, and `missedSignalKeywords`.

## Rules

- Edit only `src/report-generator.js`
- Do not modify tests or expected output files
- All tests must pass
