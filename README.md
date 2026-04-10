# Call Report Generator Challenge

Build a report generator that produces output matching `expected/report.txt` exactly.

## Quick Start

```bash
npm test
```

You'll see 2 failing tests. Your job: implement `src/report-generator.js` so its output matches the expected reports character-for-character.

## Your Task

The `generateReport(calls)` function receives an array of call records and must return a formatted text report. Look at `expected/report.txt` to see the exact format.

The test compares your output against the expected file and shows you the lines that differ. Use this feedback to refine your implementation iteratively.

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
