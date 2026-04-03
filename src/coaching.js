/**
 * Coaching Moment Detector
 * 
 * Analyzes a sales call transcript to identify specific coachable moments:
 * 
 * 1. Monologue detection — rep talked too long without asking a question
 * 2. Buying signal detection — prospect showed interest that rep didn't follow up on
 * 3. Interruption detection — rep cut off the prospect mid-sentence
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

  // ── 1. Monologue Detection ──
  // Flag any rep turn longer than 45 seconds without asking a question
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
        suggestion: 'Break up long pitches with check-in questions like "Does that make sense?" or "What are your thoughts on that?"',
      });
    }
  }

  // ── 2. Buying Signal Detection ──
  // Look for prospect utterances that contain buying signals,
  // then check if the rep followed up on them
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.speaker !== 'prospect') continue;

    // BUG IS HERE: If the prospect's utterance contains a question,
    // we skip it entirely and move to the next turn.
    // The intent was probably to separate "prospect asking questions" 
    // from "prospect showing buying signals" — but many buying signals 
    // ARE questions: "What would next steps look like?", "How much does 
    // it cost?", "Can you send me a demo?"
    // This causes us to miss the most important buying signals.
    if (containsQuestion(turn.text)) {
      continue;  // Skip questions — check for buying signals in statements only
    }

    const { found, signal } = detectBuyingSignal(turn.text);
    if (!found) continue;

    // Check if the rep followed up within the next 2 turns
    const nextRepTurn = turns.slice(i + 1, i + 3).find(t => t.speaker === 'rep');
    
    if (nextRepTurn) {
      // Did the rep acknowledge or build on the buying signal?
      const repResponse = nextRepTurn.text.toLowerCase();
      const acknowledged = 
        repResponse.includes(signal) ||
        repResponse.includes('great') ||
        repResponse.includes('absolutely') ||
        repResponse.includes('glad') ||
        repResponse.includes('perfect') ||
        containsQuestion(nextRepTurn.text); // Rep asked a follow-up question

      if (!acknowledged) {
        moments.push({
          type: 'missed_buying_signal',
          severity: 'critical',
          timestamp: turn.startMs,
          signal: signal,
          prospectSaid: turn.text,
          message: `Prospect showed buying interest ("${signal}") but rep didn't follow up.`,
          suggestion: `When a prospect mentions "${signal}", pause your pitch and explore their interest. Ask "Tell me more about what you're looking for" or confirm next steps.`,
        });
      }
    }
  }

  // ── 3. Interruption Detection ──
  // Flag when the rep starts talking before the prospect finishes
  for (let i = 0; i < transcript.length - 1; i++) {
    const current = transcript[i];
    const next = transcript[i + 1];

    if (current.speaker === 'prospect' && next.speaker === 'rep') {
      const overlap = current.endMs - next.startMs;
      if (overlap > 500) { // More than 500ms overlap = likely interruption
        moments.push({
          type: 'interruption',
          severity: overlap > 2000 ? 'warning' : 'info',
          timestamp: next.startMs,
          overlapMs: overlap,
          message: `Rep interrupted prospect (${Math.round(overlap / 1000 * 10) / 10}s overlap).`,
          suggestion: 'Practice the "2-second rule" — wait 2 full seconds after the prospect stops before responding.',
        });
      }
    }
  }

  // ── Summary ──
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
