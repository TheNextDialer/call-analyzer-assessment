# PhoneBurner Call Analyzer

A Node.js service that analyzes sales call data to help reps improve their performance. Used internally by PhoneBurner's coaching and analytics team.

## What It Does

This service processes call data and produces three analyses:

1. **Call Outcome Classification** — After a call ends, determines whether it was a connected conversation, voicemail (left or skipped), no answer, busy, or wrong number. Uses SIP codes, call duration, hardware AMD results, and audio analysis. Accurate classification is critical — bad data means bad reporting for sales managers.

2. **Talk Ratio Analysis** — Measures how much the sales rep talked vs. listened using the call transcript. Top-performing reps typically maintain a 40/60 talk-to-listen ratio. Flags calls where the rep dominated the conversation.

3. **Coaching Detector** — Identifies specific coachable moments in call transcripts: when the rep monologued too long without asking a question, when the prospect gave a buying signal that the rep didn't follow up on, and when the rep interrupted the prospect.

## The Problem

QA has flagged several issues with open bug reports:

- **Bug #1247**: "Short calls are being classified as 'no_answer' even when the prospect clearly picked up and spoke. Had a 15-second call where the prospect said 'not interested, take me off your list' and it shows up as no_answer in reporting."

- **Bug #1251**: "Talk ratio numbers seem wrong on calls with any silence or dead air. One call had a 2-minute hold in the middle and the report said the rep only talked 26% of the time, which doesn't match what actually happened in the conversation."

- **Bug #1255**: "The coaching detector is missing obvious buying signals. A prospect literally asked 'what would the next steps look like?' and it wasn't flagged as a buying signal."

The test suite has tests that are currently failing. Your job is to find the bugs, fix them, and make all tests pass.

## Quick Start

```bash
npm install
npm test        # Run the test suite — you'll see failures
npm run analyze # Run against a sample transcript
```

## Project Structure

```
src/
  analyzer.js      — Main entry point, orchestrates all three analyses
  outcome.js       — Call outcome classification (SIP codes, duration, audio)
  talk-ratio.js    — Talk/listen ratio calculator
  coaching.js      — Coaching moment detector
  utils.js         — Shared transcript parsing utilities
test/
  run.js             — Test runner
  outcome.test.js    — Outcome classifier tests
  talk-ratio.test.js — Talk ratio tests  
  coaching.test.js   — Coaching detector tests
  analyzer.test.js   — Integration tests
data/
  sample-live.json      — Sample transcript: live person call
  sample-voicemail.json — Sample transcript: voicemail
  sample-transfer.json  — Sample transcript: receptionist → live transfer
  sample-hold.json      — Sample transcript: call with hold / dead air
```

## Transcript Format

Each transcript is a JSON array of utterances:

```json
[
  {
    "speaker": "rep",
    "text": "Hi, is this John?",
    "startMs": 1200,
    "endMs": 2800
  },
  {
    "speaker": "prospect",
    "text": "Yeah, who's calling?",
    "startMs": 3000,
    "endMs": 4200
  }
]
```

Speaker values: `"rep"`, `"prospect"`, `"system"` (IVR/auto-attendant), `"silence"`
