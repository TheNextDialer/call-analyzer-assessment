const { generateSummary } = require('../src/summary');

describe('Summary Generator', () => {

  it('should generate a summary for a connected call', () => {
    const result = generateSummary({
      outcome: 'connected',
      disposition: 'CONVERSATION',
      durationMs: 180000,
      repPct: 45,
      prospectUtterances: 8,
      missedSignals: 0,
      score: 92,
    });
    assert(result.includes('[CONV]'));
    assert(result.includes('3m'));
    assert(result.includes('score:92'));
  });

  it('should generate a summary for voicemail', () => {
    const result = generateSummary({
      outcome: 'voicemail_left',
      disposition: 'VM_DETAILED',
      durationMs: 35000,
      repPct: 100,
      prospectUtterances: 0,
    });
    assert(result.includes('[VM]'));
    assert(result.includes('35s'));
  });

  it('should include missed signals count when present', () => {
    const result = generateSummary({
      outcome: 'connected',
      disposition: 'CONVERSATION',
      durationMs: 120000,
      repPct: 60,
      prospectUtterances: 5,
      missedSignals: 2,
    });
    assert(result.includes('missed:2'));
  });
});
