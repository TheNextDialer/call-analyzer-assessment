const { scoreCall } = require('../src/scoring');

describe('Call Quality Scoring', () => {

  it('should give high score for ideal call', () => {
    const result = scoreCall({
      repPct: 45,
      missedSignals: 0,
      monologues: 0,
      durationMs: 180000,
      disposition: 'CONVERSATION',
      prospectUtterances: 10,
    });
    assertInRange(result.total, 85, 100);
  });

  it('should penalize calls far over the target duration', () => {
    // A 10-minute call against a 3-minute target should not score perfectly
    const long = scoreCall({
      repPct: 50,
      missedSignals: 0,
      monologues: 0,
      durationMs: 600000,
      disposition: 'CONVERSATION',
      prospectUtterances: 10,
    });
    const ideal = scoreCall({
      repPct: 50,
      missedSignals: 0,
      monologues: 0,
      durationMs: 180000,
      disposition: 'CONVERSATION',
      prospectUtterances: 10,
    });
    assert(long.total < ideal.total);
  });

  it('should clamp coaching score to zero when many issues', () => {
    // 10 missed signals = -150 + 100 = -50 if unclamped
    const result = scoreCall({
      repPct: 50,
      missedSignals: 10,
      monologues: 0,
      durationMs: 180000,
      disposition: 'CONVERSATION',
      prospectUtterances: 10,
    });
    assert(result.breakdown.coachingScore >= 0);
    assert(result.total >= 0);
  });

  it('should include all breakdown components', () => {
    const result = scoreCall({
      repPct: 50,
      missedSignals: 1,
      monologues: 1,
      durationMs: 180000,
      disposition: 'CONVERSATION',
      prospectUtterances: 5,
    });
    assert(result.breakdown.talkRatioScore !== undefined);
    assert(result.breakdown.coachingScore !== undefined);
    assert(result.breakdown.durationScore !== undefined);
    assert(result.breakdown.dispositionScore !== undefined);
    assert(result.breakdown.engagementScore !== undefined);
  });

  it('should give zero disposition score for non-conversation outcomes', () => {
    const result = scoreCall({
      repPct: 50,
      missedSignals: 0,
      monologues: 0,
      durationMs: 180000,
      disposition: 'NO_ANSWER',
      prospectUtterances: 0,
    });
    assertEqual(result.breakdown.dispositionScore, 0);
  });
});
