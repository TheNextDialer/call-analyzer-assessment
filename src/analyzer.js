/**
 * Call Analyzer - Main orchestrator
 *
 * Takes a raw transcript and runs all analysis passes:
 * outcome classification, talk ratio, coaching detection,
 * disposition mapping, quality scoring, and summary generation.
 */

const { classifyOutcome } = require('./outcome');
const { analyzeTalkRatio } = require('./talk-ratio');
const { detectCoachingMoments } = require('./coaching');
const { mapDisposition } = require('./disposition');
const { scoreCall } = require('./scoring');
const { generateSummary } = require('./summary');
const { mergeOverlappingUtterances, countSpeakerUtterances } = require('./utils');

/**
 * Run full analysis on a call.
 *
 * @param {Array} transcript - Array of utterance objects
 * @param {object} [callData] - Optional post-call metadata for outcome classification
 * @returns {object} Complete analysis results
 */
function analyzeCall(transcript, callData) {
  if (!Array.isArray(transcript) || transcript.length === 0) {
    throw new Error('Transcript must be a non-empty array');
  }

  for (const u of transcript) {
    if (!u.speaker || u.text === undefined || u.startMs === undefined || u.endMs === undefined) {
      throw new Error(`Invalid utterance: ${JSON.stringify(u)}`);
    }
  }

  // Clean up overlapping utterances before analysis
  const cleaned = mergeOverlappingUtterances(transcript);

  const talkRatio = analyzeTalkRatio(cleaned);
  const coaching = detectCoachingMoments(cleaned);
  const outcome = callData ? classifyOutcome(callData) : null;

  const prospectUtterances = countSpeakerUtterances(cleaned, 'prospect');
  const durationMs = cleaned[cleaned.length - 1].endMs - cleaned[0].startMs;

  // Disposition mapping (only if outcome was classified)
  let disposition = null;
  if (outcome) {
    disposition = mapDisposition({
      outcome: outcome.outcome,
      durationMs,
      prospectUtterances,
      vmToneDurationMs: callData.vmToneDurationMs || 0,
    });
  }

  // Quality scoring (only if we have full data)
  let score = null;
  if (outcome && disposition) {
    score = scoreCall({
      repPct: talkRatio.repPct,
      missedSignals: coaching.summary.types.missedSignals,
      monologues: coaching.summary.types.monologues,
      durationMs,
      disposition,
      prospectUtterances,
    });
  }

  // Summary line
  let summary = null;
  if (outcome) {
    summary = generateSummary({
      outcome: outcome.outcome,
      disposition: disposition || outcome.outcome.toUpperCase(),
      durationMs,
      repPct: talkRatio.repPct,
      prospectUtterances,
      missedSignals: coaching.summary.types.missedSignals,
      score: score ? score.total : null,
    });
  }

  return {
    outcome,
    talkRatio,
    coaching,
    disposition,
    score,
    summary,
    meta: {
      utteranceCount: cleaned.length,
      speakers: [...new Set(cleaned.map(u => u.speaker))],
      durationMs,
    },
  };
}

module.exports = { analyzeCall };
