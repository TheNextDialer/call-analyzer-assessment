/**
 * Shared utilities for transcript processing.
 */

/**
 * Calculates the total duration of speech for a given speaker.
 * @param {Array} transcript - Array of utterance objects
 * @param {string} speaker - Speaker to calculate for
 * @returns {number} Total milliseconds of speech
 */
function getSpeakerDuration(transcript, speaker) {
  return transcript
    .filter(u => u.speaker === speaker)
    .reduce((total, u) => total + (u.endMs - u.startMs), 0);
}

/**
 * Returns the total call duration from first utterance start to last utterance end.
 * @param {Array} transcript 
 * @returns {number} Total call duration in milliseconds
 */
function getCallDuration(transcript) {
  if (transcript.length === 0) return 0;
  const start = transcript[0].startMs;
  const end = transcript[transcript.length - 1].endMs;
  return end - start;
}

/**
 * Groups consecutive utterances by the same speaker into "turns".
 * A turn is a block of continuous speech from one speaker.
 * @param {Array} transcript
 * @returns {Array} Array of turn objects { speaker, utterances, startMs, endMs, text }
 */
function groupIntoTurns(transcript) {
  const turns = [];
  let current = null;

  for (const u of transcript) {
    if (current && current.speaker === u.speaker) {
      current.utterances.push(u);
      current.endMs = u.endMs;
      current.text += ' ' + u.text;
    } else {
      if (current) turns.push(current);
      current = {
        speaker: u.speaker,
        utterances: [u],
        startMs: u.startMs,
        endMs: u.endMs,
        text: u.text,
      };
    }
  }
  if (current) turns.push(current);

  return turns;
}

/**
 * Extracts just the "remote" side of the conversation (everything that isn't the rep).
 * Includes prospect, system, silence, etc.
 * @param {Array} transcript
 * @returns {Array} Filtered transcript
 */
function getRemoteSide(transcript) {
  return transcript.filter(u => u.speaker !== 'rep');
}

/**
 * Checks if a text string contains question patterns.
 * @param {string} text
 * @returns {boolean}
 */
function containsQuestion(text) {
  // Check for question marks
  if (text.includes('?')) return true;

  // Check for question-starting words
  const questionStarts = /^(who|what|when|where|why|how|is|are|was|were|do|does|did|can|could|would|should|will|have|has|had)\b/i;
  return questionStarts.test(text.trim());
}

/**
 * Known buying signal phrases that indicate prospect interest.
 * Used by the coaching detector.
 */
const BUYING_SIGNALS = [
  'how much',
  'what does it cost',
  'pricing',
  'price',
  'how do we get started',
  'next steps',
  'implementation',
  'timeline',
  'when can we',
  'contract',
  'agreement',
  'sign up',
  'free trial',
  'demo',
  'can you show me',
  'send me',
  'send over',
  'interested',
  'sounds good',
  'that would work',
  'let\'s do it',
  'move forward',
];

/**
 * Checks if a text string contains a buying signal.
 * @param {string} text
 * @returns {{ found: boolean, signal: string|null }}
 */
function detectBuyingSignal(text) {
  const lower = text.toLowerCase();
  for (const signal of BUYING_SIGNALS) {
    if (lower.includes(signal)) {
      return { found: true, signal };
    }
  }
  return { found: false, signal: null };
}

module.exports = {
  getSpeakerDuration,
  getCallDuration,
  groupIntoTurns,
  getRemoteSide,
  containsQuestion,
  detectBuyingSignal,
  BUYING_SIGNALS,
};
