const { detectCoachingMoments } = require('../src/coaching');
const fs = require('fs');
const path = require('path');

const loadSample = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', name), 'utf8'));

describe('Coaching Detector', () => {

  it('should detect buying signals in the transfer call', () => {
    const transcript = loadSample('sample-transfer.json');
    const result = detectCoachingMoments(transcript);
    const signals = result.moments.filter(m => m.type === 'missed_buying_signal');
    assert(signals.length >= 1);
  });

  it('should detect monologues in a rep-heavy call', () => {
    const transcript = [
      { speaker: 'rep', text: 'So let me walk you through everything about our platform. We have features for calling, features for tracking, features for reporting, features for coaching, features for integrations, and much much more.', startMs: 0, endMs: 55000 },
      { speaker: 'prospect', text: 'Okay', startMs: 55500, endMs: 56000 },
    ];
    const result = detectCoachingMoments(transcript);
    const monologues = result.moments.filter(m => m.type === 'monologue');
    assert(monologues.length >= 1);
  });

  it('should detect interruptions', () => {
    const transcript = [
      { speaker: 'rep', text: 'Tell me about your current process.', startMs: 0, endMs: 3000 },
      { speaker: 'prospect', text: 'Well we currently use a manual dialer and it takes forever because-', startMs: 3200, endMs: 9000 },
      { speaker: 'rep', text: 'Yeah so our product totally fixes that!', startMs: 7500, endMs: 10000 },
    ];
    const result = detectCoachingMoments(transcript);
    const interruptions = result.moments.filter(m => m.type === 'interruption');
    assert(interruptions.length >= 1);
  });

  it('should NOT flag buying signals that the rep acknowledged', () => {
    const transcript = [
      { speaker: 'rep', text: 'So that is how our dialer works.', startMs: 0, endMs: 5000 },
      { speaker: 'prospect', text: 'That sounds good, I am definitely interested.', startMs: 5200, endMs: 8000 },
      { speaker: 'rep', text: 'Great to hear! Let me walk you through the next steps.', startMs: 8200, endMs: 13000 },
    ];
    const result = detectCoachingMoments(transcript);
    const missed = result.moments.filter(m => m.type === 'missed_buying_signal');
    assertEqual(missed.length, 0);
  });

  it('should include summary with correct counts', () => {
    const transcript = loadSample('sample-live.json');
    const result = detectCoachingMoments(transcript);
    assert(result.summary !== undefined);
    assertEqual(result.summary.totalMoments, result.moments.length);
  });

  it('should detect buying signals phrased as questions', () => {
    const transcript = [
      { speaker: 'rep', text: 'Our platform handles everything from dialing to reporting.', startMs: 0, endMs: 5000 },
      { speaker: 'prospect', text: 'How much does it cost for a team of 20?', startMs: 5200, endMs: 8000 },
      { speaker: 'rep', text: 'We also have a great mobile app that your reps will love.', startMs: 8200, endMs: 13000 },
    ];
    const result = detectCoachingMoments(transcript);
    const missed = result.moments.filter(m => m.type === 'missed_buying_signal');
    assert(missed.length >= 1);
  });
});
