const { classifyOutcome, classifyBatch } = require('../src/outcome');

describe('Call Outcome Classifier', () => {

  it('should classify a long conversation as connected', () => {
    const result = classifyOutcome({
      durationMs: 180000,
      sipCode: '200',
      hangupBy: 'rep',
      events: [],
      amdResult: true,
      audio: { repSpeechDetected: true, remoteSpeechDetected: true, firstRemoteSpeechMs: 2500 },
    });
    assertEqual(result.outcome, 'connected');
  });

  it('should classify busy signal correctly', () => {
    const result = classifyOutcome({
      durationMs: 3000,
      sipCode: '486',
      hangupBy: 'system',
      events: [],
      amdResult: null,
    });
    assertEqual(result.outcome, 'busy');
    assert(result.confidence >= 0.9);
  });

  it('should classify timeout as no_answer', () => {
    const result = classifyOutcome({
      durationMs: 25000,
      sipCode: '408',
      hangupBy: 'system',
      events: [],
      amdResult: null,
    });
    assertEqual(result.outcome, 'no_answer');
  });

  it('should classify voicemail where rep left a message', () => {
    const result = classifyOutcome({
      durationMs: 35000,
      sipCode: '200',
      hangupBy: 'rep',
      events: [{ type: 'voicemail_tone_detected', timestampMs: 8000 }],
      amdResult: false,
      audio: { repSpeechDetected: true, remoteSpeechDetected: false },
    });
    assertEqual(result.outcome, 'voicemail_left');
  });

  it('should classify voicemail skip', () => {
    const result = classifyOutcome({
      durationMs: 8000,
      sipCode: '200',
      hangupBy: 'rep',
      events: [],
      amdResult: false,
      audio: { repSpeechDetected: false, remoteSpeechDetected: false },
    });
    assertEqual(result.outcome, 'voicemail_skip');
  });

  it('should classify a short call with bidirectional speech as connected', () => {
    const result = classifyOutcome({
      durationMs: 15000,
      sipCode: '200',
      hangupBy: 'prospect',
      events: [
        { type: 'transcript_snippet', text: 'Not interested, take me off your list', timestampMs: 5000 },
      ],
      amdResult: true,
      audio: {
        repSpeechDetected: true,
        remoteSpeechDetected: true,
        firstRemoteSpeechMs: 2000,
      },
    });
    assertEqual(result.outcome, 'connected');
  });

  it('should not classify as connected when AMD says human but no speech detected', () => {
    const result = classifyOutcome({
      durationMs: 18000,
      sipCode: '200',
      hangupBy: 'system',
      events: [],
      amdResult: true,
      audio: {
        repSpeechDetected: true,
        remoteSpeechDetected: false,
        firstRemoteSpeechMs: null,
      },
    });
    assertEqual(result.outcome, 'no_answer');
  });

  it('should detect wrong number from transcript snippets', () => {
    const result = classifyOutcome({
      durationMs: 45000,
      sipCode: '200',
      hangupBy: 'prospect',
      events: [
        { type: 'transcript_snippet', text: 'No one by that name works here', timestampMs: 8000 },
      ],
      amdResult: true,
      audio: { repSpeechDetected: true, remoteSpeechDetected: true },
    });
    assertEqual(result.outcome, 'wrong_number');
  });

  it('should handle batch classification', () => {
    const calls = [
      { callId: 'c1', durationMs: 120000, sipCode: '200', hangupBy: 'rep', events: [], amdResult: true, audio: { repSpeechDetected: true, remoteSpeechDetected: true } },
      { callId: 'c2', durationMs: 3000, sipCode: '486', hangupBy: 'system', events: [], amdResult: null },
    ];
    const results = classifyBatch(calls);
    assertEqual(results.length, 2);
    assertEqual(results[0].callId, 'c1');
    assertEqual(results[0].outcome, 'connected');
    assertEqual(results[1].outcome, 'busy');
  });
});
