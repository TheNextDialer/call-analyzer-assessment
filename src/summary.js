/**
 * Call Summary Generator
 *
 * Produces a one-line human-readable summary of a call for the activity
 * feed and CRM notes. Summarizes who was called, what happened, and the
 * key metrics in a compact format.
 */

/**
 * Generate a one-line summary of an analyzed call.
 *
 * @param {object} params
 * @param {string} params.outcome - Call outcome classification
 * @param {string} params.disposition - CRM disposition code
 * @param {number} params.durationMs - Total call duration in milliseconds
 * @param {number} params.repPct - Rep talk ratio percentage
 * @param {number} params.prospectUtterances - Number of prospect utterances
 * @param {number} [params.missedSignals] - Number of missed buying signals
 * @param {number} [params.score] - Composite quality score
 * @returns {string} One-line summary
 */
function generateSummary({
  outcome,
  disposition,
  durationMs,
  repPct,
  prospectUtterances,
  missedSignals = 0,
  score = null,
}) {
  const durationSec = Math.round(durationMs / 1000);
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  const durationStr = minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;

  let statusEmoji;
  if (outcome === 'connected') {
    statusEmoji = disposition === 'CONVERSATION' ? '[CONV]' : '[BRIEF]';
  } else if (outcome.startsWith('voicemail')) {
    statusEmoji = '[VM]';
  } else if (outcome === 'busy') {
    statusEmoji = '[BUSY]';
  } else if (outcome === 'no_answer') {
    statusEmoji = '[NA]';
  } else if (outcome === 'wrong_number') {
    statusEmoji = '[WN]';
  } else {
    statusEmoji = `[${outcome.toUpperCase()}]`;
  }

  const parts = [statusEmoji, durationStr];

  if (outcome === 'connected') {
    parts.push(`ratio:${repPct}/${100 - repPct}`);
    parts.push(`prospect:${prospectUtterances}utt`);
    if (missedSignals > 0) {
      parts.push(`missed:${missedSignals}`);
    }
  }

  if (score !== null) {
    parts.push(`score:${score}`);
  }

  return parts.join(' | ');
}

module.exports = { generateSummary };
