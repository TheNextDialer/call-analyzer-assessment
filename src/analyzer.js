/**
 * Call Analyzer — Main orchestrator
 * 
 * Takes a raw transcript and runs all three analysis passes:
 * AMD classification, talk ratio, and coaching detection.
 */

const { classifyOutcome } = require('./outcome');
const { analyzeTalkRatio } = require('./talk-ratio');
const { detectCoachingMoments } = require('./coaching');

/**
 * Run full analysis on a call.
 * 
 * Takes two inputs:
 * - transcript: array of utterance objects (for talk ratio + coaching)
 * - callData: post-call metadata (for outcome classification)
 * 
 * @param {Array} transcript - Array of utterance objects
 * @param {object} [callData] - Optional post-call metadata for outcome classification
 * @returns {object} Complete analysis results
 */
function analyzeCall(transcript, callData) {
  if (!Array.isArray(transcript) || transcript.length === 0) {
    throw new Error('Transcript must be a non-empty array');
  }

  // Validate transcript structure
  for (const u of transcript) {
    if (!u.speaker || !u.text || u.startMs === undefined || u.endMs === undefined) {
      throw new Error(`Invalid utterance: ${JSON.stringify(u)}`);
    }
  }

  const talkRatio = analyzeTalkRatio(transcript);
  const coaching = detectCoachingMoments(transcript);
  const outcome = callData ? classifyOutcome(callData) : null;

  return {
    outcome,
    talkRatio,
    coaching,
    meta: {
      utteranceCount: transcript.length,
      speakers: [...new Set(transcript.map(u => u.speaker))],
      durationMs: transcript[transcript.length - 1].endMs - transcript[0].startMs,
    },
  };
}

module.exports = { analyzeCall };
