/**
 * Legacy Scorer Reimplementation
 *
 * Our call quality scoring system uses a legacy algorithm built by a
 * contractor in 2022. The implementation works but it's in a minified
 * module we can't maintain. We need a clean, documented replacement.
 *
 * Your job: reverse-engineer the algorithm and implement it here.
 * The oracle is at oracle/legacy-scorer.js — you can call it but
 * the code is minified.
 *
 * Use the probe tool to experiment:
 *   node tools/probe.js '{"outcome":"connected","durationMs":180000,...}'
 *
 * @param {object} call
 * @param {string} call.outcome - "connected", "voicemail_left", "no_answer", etc.
 * @param {number} call.durationMs - Total call duration in milliseconds
 * @param {number} call.repPct - Rep talk ratio percentage (0-100)
 * @param {number} call.missedSignals - Count of missed buying signals
 * @param {number} call.monologues - Count of monologue moments
 * @param {number} call.prospectUtterances - Number of prospect utterances
 * @param {string} call.disposition - CRM disposition code
 * @returns {number} Score from 0-100
 */
function reimplScore(call) {
  // TODO: Implement the legacy scoring algorithm
  // Use the probe tool to discover the formula by experimenting with inputs
  return 0;
}

module.exports = { reimplScore };
