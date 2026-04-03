const { analyzeTalkRatio } = require('../src/talk-ratio');
const fs = require('fs');
const path = require('path');

const loadSample = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', name), 'utf8'));

describe('Talk Ratio Analysis', () => {

  it('should calculate reasonable ratios for a normal call', () => {
    const transcript = loadSample('sample-live.json');
    const result = analyzeTalkRatio(transcript);
    // In the live sample, rep and prospect both talk. Ratios should be in a reasonable range.
    assertInRange(result.repPct, 30, 80, `Rep percentage out of range: ${result.repPct}%`);
    assertInRange(result.prospectPct, 15, 60, `Prospect percentage out of range: ${result.prospectPct}%`);
  });

  it('should not let hold time inflate the rep talk percentage', () => {
    // BUG #1251: This test FAILS because the calculator uses total call 
    // duration (including the 2-minute hold) as the denominator.
    // The rep talked for ~37s out of ~50s of actual conversation,
    // but the total call was 191s because of the 120s hold.
    // So it reports rep at ~19% instead of the real ~60%.
    const transcript = loadSample('sample-hold.json');
    const result = analyzeTalkRatio(transcript);
    
    // The call has ~120s of silence/hold. Without the hold, the actual 
    // conversation is about 72s. Rep talked about 43s of that.
    // So the real talk ratio should be roughly 60%, not the ~22% 
    // that comes from dividing by the full 191s call duration.
    assertInRange(result.repPct, 45, 75,
      `Rep percentage is ${result.repPct}% — hold time is distorting the ratio. ` +
      `The denominator should be speech time, not total call time.`);
  });

  it('should flag rep-dominated calls', () => {
    // Create a transcript where rep talks way more
    const transcript = [
      { speaker: 'rep', text: 'Let me tell you about our product...', startMs: 0, endMs: 60000 },
      { speaker: 'prospect', text: 'Okay', startMs: 60500, endMs: 61500 },
      { speaker: 'rep', text: 'And another thing about our amazing features...', startMs: 62000, endMs: 120000 },
      { speaker: 'prospect', text: 'Sure', startMs: 120500, endMs: 121500 },
    ];
    const result = analyzeTalkRatio(transcript);
    assert(result.flags.length > 0, 'Should flag rep-dominated call');
    assert(result.rating === 'rep_dominated' || result.rating === 'rep_heavy',
      `Expected rep_dominated or rep_heavy, got ${result.rating}`);
  });

  it('should handle empty transcript', () => {
    const result = analyzeTalkRatio([]);
    assertEqual(result.repPct, 0);
    assertEqual(result.prospectPct, 0);
    assertEqual(result.rating, 'no_data');
  });

  it('should report silence percentage separately', () => {
    const transcript = loadSample('sample-hold.json');
    const result = analyzeTalkRatio(transcript);
    assert(result.silencePct > 0, `Expected silence percentage > 0 for call with hold, got ${result.silencePct}%`);
  });
});
