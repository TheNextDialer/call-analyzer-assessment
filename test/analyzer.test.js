const { analyzeCall } = require('../src/analyzer');
const fs = require('fs');
const path = require('path');

const loadSample = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', name), 'utf8'));

describe('Full Analyzer (Integration)', () => {

  it('should return all three analyses for a live call', () => {
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
    assert(result.outcome !== undefined, 'Missing outcome result');
    assert(result.talkRatio !== undefined, 'Missing talkRatio result');
    assert(result.coaching !== undefined, 'Missing coaching result');
    assert(result.meta !== undefined, 'Missing meta');
  });

  it('should include correct meta information', () => {
    const transcript = loadSample('sample-live.json');
    const result = analyzeCall(transcript);
    assertEqual(result.meta.utteranceCount, transcript.length);
    assert(result.meta.speakers.includes('rep'), 'Missing rep in speakers');
    assert(result.meta.speakers.includes('prospect'), 'Missing prospect in speakers');
    assert(result.meta.durationMs > 0, 'Duration should be positive');
  });

  it('should throw on empty transcript', () => {
    let threw = false;
    try { analyzeCall([]); } catch (e) { threw = true; }
    assert(threw, 'Should throw on empty transcript');
  });

  it('should throw on malformed utterances', () => {
    let threw = false;
    try { analyzeCall([{ speaker: 'rep', text: 'hi' }]); } catch (e) { threw = true; }
    assert(threw, 'Should throw on missing startMs/endMs');
  });
});
