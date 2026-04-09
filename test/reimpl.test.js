const { reimplScore } = require('../src/reimpl');
const legacyScore = require('../oracle/legacy-scorer');

const cases = [
  // 1: Perfect call — all bonuses
  { outcome: 'connected', durationMs: 180000, repPct: 45, missedSignals: 0, monologues: 0, prospectUtterances: 8, disposition: 'CONVERSATION' },
  // 2: Short connected call (under duration threshold)
  { outcome: 'connected', durationMs: 30000, repPct: 50, missedSignals: 0, monologues: 0, prospectUtterances: 3, disposition: 'BRIEF_CONTACT' },
  // 3: Voicemail — minimal metrics
  { outcome: 'voicemail_left', durationMs: 35000, repPct: 95, missedSignals: 0, monologues: 0, prospectUtterances: 0, disposition: 'VM_DETAILED' },
  // 4: No answer
  { outcome: 'no_answer', durationMs: 25000, repPct: 0, missedSignals: 0, monologues: 0, prospectUtterances: 0, disposition: 'NO_ANSWER' },
  // 5: Many missed signals
  { outcome: 'connected', durationMs: 200000, repPct: 40, missedSignals: 4, monologues: 0, prospectUtterances: 10, disposition: 'CONVERSATION' },
  // 6: Talk ratio at exact lower boundary (35%)
  { outcome: 'connected', durationMs: 90000, repPct: 35, missedSignals: 0, monologues: 0, prospectUtterances: 6, disposition: 'CONVERSATION' },
  // 7: Talk ratio at exact upper boundary (55%)
  { outcome: 'connected', durationMs: 90000, repPct: 55, missedSignals: 0, monologues: 0, prospectUtterances: 6, disposition: 'CONVERSATION' },
  // 8: Talk ratio just outside upper boundary (56%)
  { outcome: 'connected', durationMs: 90000, repPct: 56, missedSignals: 0, monologues: 0, prospectUtterances: 6, disposition: 'CONVERSATION' },
  // 9: Talk ratio just below lower boundary (34%)
  { outcome: 'connected', durationMs: 90000, repPct: 34, missedSignals: 0, monologues: 0, prospectUtterances: 6, disposition: 'CONVERSATION' },
  // 10: Exactly at duration threshold (60000ms — should NOT get bonus)
  { outcome: 'connected', durationMs: 60000, repPct: 45, missedSignals: 0, monologues: 0, prospectUtterances: 3, disposition: 'BRIEF_CONTACT' },
  // 11: Just above duration threshold (60001ms — SHOULD get bonus)
  { outcome: 'connected', durationMs: 60001, repPct: 45, missedSignals: 0, monologues: 0, prospectUtterances: 3, disposition: 'BRIEF_CONTACT' },
  // 12: Multiple monologues (flat -15, not per-monologue)
  { outcome: 'connected', durationMs: 180000, repPct: 45, missedSignals: 0, monologues: 3, prospectUtterances: 8, disposition: 'CONVERSATION' },
  // 13: Exactly 5 prospect utterances (should NOT get +5)
  { outcome: 'connected', durationMs: 180000, repPct: 45, missedSignals: 0, monologues: 0, prospectUtterances: 5, disposition: 'CONVERSATION' },
  // 14: 6 prospect utterances (SHOULD get +5)
  { outcome: 'connected', durationMs: 180000, repPct: 45, missedSignals: 0, monologues: 0, prospectUtterances: 6, disposition: 'CONVERSATION' },
  // 15: 3 missed signals (penalty = 30, the cap)
  { outcome: 'connected', durationMs: 180000, repPct: 45, missedSignals: 3, monologues: 0, prospectUtterances: 8, disposition: 'CONVERSATION' },
  // 16: 5 missed signals (penalty still capped at 30)
  { outcome: 'connected', durationMs: 180000, repPct: 45, missedSignals: 5, monologues: 0, prospectUtterances: 8, disposition: 'CONVERSATION' },
  // 17: Everything bad — should clamp to 0
  { outcome: 'no_answer', durationMs: 5000, repPct: 95, missedSignals: 10, monologues: 5, prospectUtterances: 0, disposition: 'NO_ANSWER' },
  // 18: Connected but not CONVERSATION disposition
  { outcome: 'connected', durationMs: 90000, repPct: 45, missedSignals: 0, monologues: 0, prospectUtterances: 8, disposition: 'BRIEF_CONTACT' },
  // 19: Busy signal
  { outcome: 'busy', durationMs: 3000, repPct: 0, missedSignals: 0, monologues: 0, prospectUtterances: 0, disposition: 'BUSY' },
  // 20: One missed signal (gets penalty, not zero-bonus)
  { outcome: 'connected', durationMs: 180000, repPct: 45, missedSignals: 1, monologues: 0, prospectUtterances: 8, disposition: 'CONVERSATION' },
];

describe('Legacy Scorer Reimplementation', () => {
  cases.forEach((tc, i) => {
    it(`case ${i + 1}: ${tc.outcome} call (repPct=${tc.repPct}, missed=${tc.missedSignals}, utt=${tc.prospectUtterances})`, () => {
      const expected = legacyScore(tc);
      const actual = reimplScore(tc);
      assertEqual(actual, expected, `Expected ${expected}, got ${actual}`);
    });
  });
});
