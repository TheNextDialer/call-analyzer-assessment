const { detectCoachingMoments } = require('../src/coaching');
const fs = require('fs');
const path = require('path');

const loadSample = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', name), 'utf8'));

describe('Coaching Detector', () => {

  it('should detect buying signals in the transfer call', () => {
    // BUG #1255: This test FAILS because the prospect says 
    // "What would the next steps look like to get a demo set up?"
    // which contains the buying signal "next steps" — but it's phrased 
    // as a question, so the coaching detector skips it entirely.
    const transcript = loadSample('sample-transfer.json');
    const result = detectCoachingMoments(transcript);
    
    const signals = result.moments.filter(m => m.type === 'missed_buying_signal');
    // The prospect asks about "next steps" AND "how much does it cost" — 
    // both are buying signals phrased as questions. The rep responds to 
    // the cost question with CRM info instead of addressing pricing.
    // At minimum, the "next steps" buying signal should be detected.
    assert(signals.length >= 1,
      `Expected at least 1 missed buying signal, found ${signals.length}. ` +
      `The prospect asked "What would the next steps look like?" which contains ` +
      `the buying signal "next steps" but it was missed because it's a question.`);
  });

  it('should detect monologues in a rep-heavy call', () => {
    const transcript = [
      { speaker: 'rep', text: 'So let me walk you through everything about our platform. We have features for calling, features for tracking, features for reporting, features for coaching, features for integrations, and much much more. Our platform was built from the ground up to handle enterprise scale. We process millions of calls per month across thousands of customers.', startMs: 0, endMs: 55000 },
      { speaker: 'prospect', text: 'Okay', startMs: 55500, endMs: 56000 },
    ];
    const result = detectCoachingMoments(transcript);
    const monologues = result.moments.filter(m => m.type === 'monologue');
    assert(monologues.length >= 1, `Expected at least 1 monologue flag, got ${monologues.length}`);
  });

  it('should detect interruptions', () => {
    const transcript = [
      { speaker: 'rep', text: 'Tell me about your current process.', startMs: 0, endMs: 3000 },
      { speaker: 'prospect', text: 'Well we currently use a manual dialer and it takes forever to get through our list because—', startMs: 3200, endMs: 9000 },
      { speaker: 'rep', text: 'Yeah so our product totally fixes that!', startMs: 7500, endMs: 10000 },
    ];
    const result = detectCoachingMoments(transcript);
    const interruptions = result.moments.filter(m => m.type === 'interruption');
    assert(interruptions.length >= 1, `Expected interruption detected, got ${interruptions.length}`);
  });

  it('should NOT flag buying signals that the rep acknowledged', () => {
    const transcript = [
      { speaker: 'rep', text: 'So that is how our dialer works.', startMs: 0, endMs: 5000 },
      { speaker: 'prospect', text: 'That sounds good, I am definitely interested.', startMs: 5200, endMs: 8000 },
      { speaker: 'rep', text: 'Great to hear! Let me walk you through the next steps to get you set up.', startMs: 8200, endMs: 13000 },
    ];
    const result = detectCoachingMoments(transcript);
    const missed = result.moments.filter(m => m.type === 'missed_buying_signal');
    assertEqual(missed.length, 0, `Should not flag acknowledged buying signal, but found ${missed.length}`);
  });

  it('should include summary with correct counts', () => {
    const transcript = loadSample('sample-live.json');
    const result = detectCoachingMoments(transcript);
    assert(result.summary !== undefined, 'Missing summary');
    assert(result.summary.totalMoments !== undefined, 'Missing totalMoments');
    assertEqual(result.summary.totalMoments, result.moments.length,
      'Summary count does not match moments array length');
  });

  it('should detect buying signals phrased as questions', () => {
    // This directly tests the bug: "how much does it cost?" is a buying 
    // signal (contains "cost") but is also a question.
    const transcript = [
      { speaker: 'rep', text: 'Our platform handles everything from dialing to reporting.', startMs: 0, endMs: 5000 },
      { speaker: 'prospect', text: 'How much does it cost for a team of 20?', startMs: 5200, endMs: 8000 },
      { speaker: 'rep', text: 'We also have a great mobile app that your reps will love.', startMs: 8200, endMs: 13000 },
    ];
    const result = detectCoachingMoments(transcript);
    const missed = result.moments.filter(m => m.type === 'missed_buying_signal');
    assert(missed.length >= 1,
      `Prospect asked about cost (a buying signal) but it was not detected. ` +
      `Buying signals phrased as questions should still be caught.`);
  });
});
