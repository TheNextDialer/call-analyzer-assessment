const { analyzeTalkRatio } = require('../src/talk-ratio');
const fs = require('fs');
const path = require('path');

const loadSample = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', name), 'utf8'));

describe('Talk Ratio Analysis', () => {

  it('should calculate reasonable ratios for a normal call', () => {
    const transcript = loadSample('sample-live.json');
    const result = analyzeTalkRatio(transcript);
    assertInRange(result.repPct, 30, 80);
    assertInRange(result.prospectPct, 15, 60);
  });

  it('should not let hold time inflate the rep talk percentage', () => {
    const transcript = loadSample('sample-hold.json');
    const result = analyzeTalkRatio(transcript);
    assertInRange(result.repPct, 45, 75);
  });

  it('should report silence as a percentage of total call duration', () => {
    // 10s of rep speech, 5s of prospect speech, 15s of silence = 30s total
    // Silence should be 50% of total call duration
    const transcript = [
      { speaker: 'rep', text: 'Hello there, let me explain.', startMs: 0, endMs: 10000 },
      { speaker: 'silence', text: '', startMs: 10000, endMs: 25000 },
      { speaker: 'prospect', text: 'Go ahead.', startMs: 25000, endMs: 30000 },
    ];
    const result = analyzeTalkRatio(transcript);
    assertInRange(result.silencePct, 45, 55);
  });

  it('should flag rep-dominated calls', () => {
    const transcript = [
      { speaker: 'rep', text: 'Let me tell you about our product...', startMs: 0, endMs: 60000 },
      { speaker: 'prospect', text: 'Okay', startMs: 60500, endMs: 61500 },
      { speaker: 'rep', text: 'And another thing about our amazing features...', startMs: 62000, endMs: 120000 },
      { speaker: 'prospect', text: 'Sure', startMs: 120500, endMs: 121500 },
    ];
    const result = analyzeTalkRatio(transcript);
    assert(result.flags.length > 0);
    assert(result.rating === 'rep_dominated' || result.rating === 'rep_heavy');
  });

  it('should handle empty transcript', () => {
    const result = analyzeTalkRatio([]);
    assertEqual(result.repPct, 0);
    assertEqual(result.prospectPct, 0);
    assertEqual(result.rating, 'no_data');
  });
});
