const { analyzeCall } = require('../src/analyzer');
const fs = require('fs');
const path = require('path');

const loadSample = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', name), 'utf8'));

describe('Full Analyzer (Integration)', () => {

  it('should return all analyses for a live call', () => {
    const transcript = loadSample('sample-live.json');
    const callData = {
      durationMs: 44800,
      sipCode: '200',
      hangupBy: 'rep',
      events: [],
      amdResult: true,
      audio: { repSpeechDetected: true, remoteSpeechDetected: true },
    };
    const result = analyzeCall(transcript, callData);
    assert(result.outcome !== undefined);
    assert(result.talkRatio !== undefined);
    assert(result.coaching !== undefined);
    assert(result.disposition !== undefined);
    assert(result.score !== undefined);
    assert(result.summary !== undefined);
    assert(result.meta !== undefined);
  });

  it('should include correct meta information', () => {
    const transcript = loadSample('sample-live.json');
    const result = analyzeCall(transcript);
    assert(result.meta.speakers.includes('rep'));
    assert(result.meta.speakers.includes('prospect'));
    assert(result.meta.durationMs > 0);
  });

  it('should preserve speaker attribution when merging overlapping utterances', () => {
    const transcript = loadSample('sample-overlap.json');
    const result = analyzeCall(transcript);

    // The overlap sample has 10 utterances with several cross-speaker overlaps.
    // After correctly merging same-speaker overlaps only, there should be
    // at least 6 distinct entries. Cross-speaker merging collapses the
    // transcript down much further.
    assert(result.meta.utteranceCount >= 6,
      `Expected >= 6 utterances after merge, got ${result.meta.utteranceCount}`);
  });

  it('should throw on empty transcript', () => {
    let threw = false;
    try { analyzeCall([]); } catch (e) { threw = true; }
    assert(threw);
  });

  it('should throw on malformed utterances', () => {
    let threw = false;
    try { analyzeCall([{ speaker: 'rep', text: 'hi' }]); } catch (e) { threw = true; }
    assert(threw);
  });
});
