/**
 * Talk Ratio Analysis
 *
 * Calculates how much the sales rep talked vs. listened during a call.
 * Top-performing reps maintain roughly a 40% talk / 60% listen ratio.
 *
 * The ratio is calculated over active speech time only (excluding silence
 * and hold periods). Silence percentage is reported separately against
 * the total call duration for context.
 */

const { getSpeakerDuration, getCallDuration } = require('./utils');

/**
 * Analyze the talk-to-listen ratio for a call.
 *
 * repPct and prospectPct are calculated as a proportion of speech-only
 * time. silencePct is reported as a proportion of total call wall-clock
 * duration so managers can see how much dead air there was.
 *
 * @param {Array} transcript - Array of utterance objects
 * @returns {{ repPct: number, prospectPct: number, silencePct: number, rating: string, flags: Array }}
 */
function analyzeTalkRatio(transcript) {
  if (transcript.length === 0) {
    return { repPct: 0, prospectPct: 0, silencePct: 0, rating: 'no_data', flags: [] };
  }

  const repDuration = getSpeakerDuration(transcript, 'rep');
  const prospectDuration = getSpeakerDuration(transcript, 'prospect');
  const systemDuration = getSpeakerDuration(transcript, 'system');
  const silenceDuration = getSpeakerDuration(transcript, 'silence');

  // Use total call duration for silence percentage
  const totalDuration = getCallDuration(transcript);

  // Use speech-only time for rep/prospect percentages (excluding silence and hold)
  const speechDuration = repDuration + prospectDuration;

  const repPct = speechDuration > 0 ? Math.round((repDuration / speechDuration) * 100) : 0;
  const prospectPct = speechDuration > 0 ? Math.round((prospectDuration / speechDuration) * 100) : 0;
  const silencePct = totalDuration > 0 ? Math.round(((silenceDuration + systemDuration) / totalDuration) * 100) : 0;

  // Rating based on rep talk percentage
  let rating;
  if (repPct > 70) rating = 'rep_dominated';
  else if (repPct > 55) rating = 'rep_heavy';
  else if (repPct >= 35) rating = 'balanced';
  else if (repPct >= 20) rating = 'prospect_heavy';
  else rating = 'prospect_dominated';

  const flags = [];

  if (repPct > 65) {
    flags.push({
      type: 'talk_ratio',
      severity: 'warning',
      message: `Rep talked ${repPct}% of the time.`,
    });
  }

  if (repPct > 80) {
    flags.push({
      type: 'talk_ratio',
      severity: 'critical',
      message: `Rep talked ${repPct}% of the call.`,
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
