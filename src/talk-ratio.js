/**
 * Talk Ratio Analysis
 * 
 * Calculates how much the sales rep talked vs. listened during a call.
 * Top-performing reps maintain roughly a 40% talk / 60% listen ratio.
 * 
 * Returns the ratio plus flags if the rep dominated the conversation.
 */

const { getSpeakerDuration, getCallDuration } = require('./utils');

/**
 * Analyze the talk-to-listen ratio for a call.
 * @param {Array} transcript - Array of utterance objects
 * @returns {{ repPct: number, prospectPct: number, silencePct: number, flags: Array }}
 */
function analyzeTalkRatio(transcript) {
  if (transcript.length === 0) {
    return { repPct: 0, prospectPct: 0, silencePct: 0, rating: 'no_data', flags: [] };
  }

  const repDuration = getSpeakerDuration(transcript, 'rep');
  const prospectDuration = getSpeakerDuration(transcript, 'prospect');
  const systemDuration = getSpeakerDuration(transcript, 'system');
  const silenceDuration = getSpeakerDuration(transcript, 'silence');

  // BUG IS HERE: We divide by total call duration (wall-clock time from 
  // first utterance to last utterance). This INCLUDES silence and hold time.
  // So if there's a 2-minute hold in a 5-minute call where the rep talked 
  // for 2.5 minutes, the math says 2.5/5 = 50% rep talk time.
  // But the ACTUAL conversation was only 3 minutes (5 - 2 min hold),
  // so the real ratio should be 2.5/3 = 83%.
  // 
  // The correct denominator should be (repDuration + prospectDuration) — 
  // i.e., total SPEECH time, excluding silence and system/hold.
  const totalDuration = getCallDuration(transcript);

  const repPct = totalDuration > 0 ? Math.round((repDuration / totalDuration) * 100) : 0;
  const prospectPct = totalDuration > 0 ? Math.round((prospectDuration / totalDuration) * 100) : 0;
  const silencePct = totalDuration > 0 ? Math.round(((silenceDuration + systemDuration) / totalDuration) * 100) : 0;

  // Rating based on rep talk percentage
  let rating;
  if (repPct > 70) rating = 'rep_dominated';
  else if (repPct > 55) rating = 'rep_heavy';
  else if (repPct >= 35) rating = 'balanced';
  else if (repPct >= 20) rating = 'prospect_heavy';
  else rating = 'prospect_dominated';

  // Generate coaching flags
  const flags = [];

  if (repPct > 65) {
    flags.push({
      type: 'talk_ratio',
      severity: 'warning',
      message: `Rep talked ${repPct}% of the time. Aim for 40% or less.`,
    });
  }

  if (repPct > 80) {
    flags.push({
      type: 'talk_ratio',
      severity: 'critical',
      message: `Rep talked ${repPct}% — this was essentially a monologue, not a conversation.`,
    });
  }

  return {
    repPct,
    prospectPct,
    silencePct,
    repDurationMs: repDuration,
    prospectDurationMs: prospectDuration,
    silenceDurationMs: silenceDuration + systemDuration,
    totalDurationMs: totalDuration,
    rating,
    flags,
  };
}

module.exports = { analyzeTalkRatio };
