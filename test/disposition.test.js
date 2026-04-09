const { mapDisposition, mapDispositions } = require('../src/disposition');

describe('Disposition Mapper', () => {

  it('should map short connected call with few utterances to BRIEF_CONTACT', () => {
    const result = mapDisposition({
      outcome: 'connected',
      durationMs: 20000,
      prospectUtterances: 2,
      vmToneDurationMs: 0,
    });
    assertEqual(result, 'BRIEF_CONTACT');
  });

  it('should map connected call with 3 utterances under 60s to BRIEF_CONTACT', () => {
    // Spec says "3 or fewer" utterances should be BRIEF_CONTACT
    const result = mapDisposition({
      outcome: 'connected',
      durationMs: 45000,
      prospectUtterances: 3,
      vmToneDurationMs: 0,
    });
    assertEqual(result, 'BRIEF_CONTACT');
  });

  it('should map connected call with many utterances to CONVERSATION', () => {
    const result = mapDisposition({
      outcome: 'connected',
      durationMs: 120000,
      prospectUtterances: 8,
      vmToneDurationMs: 0,
    });
    assertEqual(result, 'CONVERSATION');
  });

  it('should use vmToneDurationMs for voicemail length classification', () => {
    // Rep left a 25-second voicemail (VM tone to hangup = 25s)
    // Total call duration was 35s (includes ring time)
    const result = mapDisposition({
      outcome: 'voicemail_left',
      durationMs: 35000,
      prospectUtterances: 0,
      vmToneDurationMs: 25000,
    });
    assertEqual(result, 'VM_DETAILED');
  });

  it('should classify short voicemail as VM_BRIEF', () => {
    const result = mapDisposition({
      outcome: 'voicemail_left',
      durationMs: 30000,
      prospectUtterances: 0,
      vmToneDurationMs: 12000,
    });
    assertEqual(result, 'VM_BRIEF');
  });

  it('should uppercase other outcomes', () => {
    assertEqual(mapDisposition({ outcome: 'busy', durationMs: 3000, prospectUtterances: 0 }), 'BUSY');
    assertEqual(mapDisposition({ outcome: 'no_answer', durationMs: 25000, prospectUtterances: 0 }), 'NO_ANSWER');
  });

  it('should batch map dispositions', () => {
    const calls = [
      { outcome: 'connected', durationMs: 120000, prospectUtterances: 8 },
      { outcome: 'busy', durationMs: 3000, prospectUtterances: 0 },
    ];
    const results = mapDispositions(calls);
    assertEqual(results[0].disposition, 'CONVERSATION');
    assertEqual(results[1].disposition, 'BUSY');
  });
});
