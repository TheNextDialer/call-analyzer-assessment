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
 * Merges overlapping or adjacent utterances to clean up transcript data.
 * When two utterances overlap in time, they get combined into a single
 * utterance with the union of their time ranges and concatenated text.
 *
 * @param {Array} transcript - Array of utterance objects
 * @returns {Array} Cleaned transcript with overlaps merged
 */
function mergeOverlappingUtterances(transcript) {
  if (transcript.length === 0) return [];

  const sorted = [...transcript].sort((a, b) => a.startMs - b.startMs);
  const merged = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    // Merge only same-speaker overlapping or adjacent utterances.
    // Cross-speaker overlaps should be preserved to maintain speaker attribution.
    if (sorted[i].speaker === prev.speaker && sorted[i].startMs <= prev.endMs) {
      prev.endMs = Math.max(prev.endMs, sorted[i].endMs);
      prev.text = prev.text ? prev.text + ' ' + sorted[i].text : sorted[i].text;
    } else {
      merged.push({ ...sorted[i] });
    }
  }

  return merged;
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
  if (text.includes('?')) return true;
  const questionStarts = /^(who|what|when|where|why|how|is|are|was|were|do|does|did|can|could|would|should|will|have|has|had)\b/i;
  return questionStarts.test(text.trim());
}

/**
 * Known buying signal phrases that indicate prospect interest.
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

/**
 * Counts the number of utterances from a given speaker.
 * @param {Array} transcript
 * @param {string} speaker
 * @returns {number}
 */
function countSpeakerUtterances(transcript, speaker) {
  return transcript.filter(u => u.speaker === speaker).length;
}

module.exports = {
  getSpeakerDuration,
  getCallDuration,
  mergeOverlappingUtterances,
  groupIntoTurns,
  getRemoteSide,
  containsQuestion,
  detectBuyingSignal,
  countSpeakerUtterances,
  BUYING_SIGNALS,
};
