/**
 * Coaching Moment Detector
 *
 * Analyzes a sales call transcript to identify specific coachable moments:
 *
 * 1. Monologue detection - rep talked too long without asking a question
 * 2. Buying signal detection - prospect showed interest that rep didn't follow up on
 * 3. Interruption detection - rep cut off the prospect mid-sentence
 */

const { groupIntoTurns, containsQuestion, detectBuyingSignal } = require('./utils');

/**
 * Detect coaching moments in a transcript.
 * @param {Array} transcript - Array of utterance objects
 * @returns {{ moments: Array, summary: object }}
 */
function detectCoachingMoments(transcript) {
  const moments = [];
  const turns = groupIntoTurns(transcript);

  // Monologue detection: flag any rep turn > 45s without a question
  for (const turn of turns) {
    if (turn.speaker !== 'rep') continue;
    const durationSec = (turn.endMs - turn.startMs) / 1000;
    if (durationSec > 45 && !containsQuestion(turn.text)) {
      moments.push({
        type: 'monologue',
        severity: durationSec > 90 ? 'critical' : 'warning',
        timestamp: turn.startMs,
        durationSec: Math.round(durationSec),
        message: `Rep spoke for ${Math.round(durationSec)}s without asking a question.`,
        suggestion: 'Break up long pitches with check-in questions.',
      });
    }
  }

  // Buying signal detection: find prospect utterances with buying signals
  // and check if the rep acknowledged them
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.speaker !== 'prospect') continue;

    // Skip questions — only check statements for buying signals
    if (containsQuestion(turn.text)) {
      continue;
    }

    const { found, signal } = detectBuyingSignal(turn.text);
    if (!found) continue;

    const nextRepTurn = turns.slice(i + 1, i + 3).find(t => t.speaker === 'rep');

    if (nextRepTurn) {
      const repResponse = nextRepTurn.text.toLowerCase();
      const acknowledged =
        repResponse.includes(signal) ||
        repResponse.includes('great') ||
        repResponse.includes('absolutely') ||
        repResponse.includes('glad') ||
        repResponse.includes('perfect') ||
        containsQuestion(nextRepTurn.text);

      if (!acknowledged) {
        moments.push({
          type: 'missed_buying_signal',
          severity: 'critical',
          timestamp: turn.startMs,
          signal: signal,
          prospectSaid: turn.text,
          message: `Prospect showed buying interest ("${signal}") but rep didn't follow up.`,
          suggestion: `When a prospect mentions "${signal}", explore their interest.`,
        });
      }
    }
  }

  // Interruption detection: rep starts before prospect finishes
  for (let i = 0; i < transcript.length - 1; i++) {
    const current = transcript[i];
    const next = transcript[i + 1];

    if (current.speaker === 'prospect' && next.speaker === 'rep') {
      const overlap = current.endMs - next.startMs;
      if (overlap > 500) {
        moments.push({
          type: 'interruption',
          severity: overlap > 2000 ? 'warning' : 'info',
          timestamp: next.startMs,
          overlapMs: overlap,
          message: `Rep interrupted prospect (${Math.round(overlap / 1000 * 10) / 10}s overlap).`,
          suggestion: 'Wait 2 seconds after the prospect stops before responding.',
        });
      }
    }
  }

  const summary = {
    totalMoments: moments.length,
    critical: moments.filter(m => m.severity === 'critical').length,
    warnings: moments.filter(m => m.severity === 'warning').length,
    info: moments.filter(m => m.severity === 'info').length,
    types: {
      monologues: moments.filter(m => m.type === 'monologue').length,
      missedSignals: moments.filter(m => m.type === 'missed_buying_signal').length,
      interruptions: moments.filter(m => m.type === 'interruption').length,
    },
  };

  return { moments, summary };
}

module.exports = { detectCoachingMoments };
