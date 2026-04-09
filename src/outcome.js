/**
 * Call Outcome Classifier
 *
 * After a call ends, we receive metadata from the dialer including
 * duration, hangup disposition, and a timeline of events. This module
 * classifies the outcome into one of:
 *
 *   - connected:        Live conversation happened
 *   - voicemail_left:   Rep left a voicemail
 *   - voicemail_skip:   Hit voicemail, rep hung up without leaving a message
 *   - no_answer:        Phone rang but nobody picked up
 *   - busy:             Got a busy signal
 *   - wrong_number:     Connected but wrong person / bad number
 *
 * Classification feeds into reporting dashboards and CRM disposition mapping.
 */

/**
 * Classify the outcome of a completed call.
 * @param {object} callData - Post-call metadata
 * @param {number} callData.durationMs - Total call duration in milliseconds
 * @param {string} callData.sipCode - Final SIP response code
 * @param {string} callData.hangupBy - Who ended the call: "rep", "prospect", "system"
 * @param {Array} callData.events - Timeline of call events
 * @param {boolean} callData.amdResult - Hardware AMD: true = human, false = machine, null = unknown
 * @param {object} [callData.audio] - Optional audio analysis results
 * @param {boolean} [callData.audio.repSpeechDetected] - Did the rep speak?
 * @param {boolean} [callData.audio.remoteSpeechDetected] - Was speech from remote side?
 * @param {number} [callData.audio.firstRemoteSpeechMs] - When did remote side first speak?
 * @returns {{ outcome: string, confidence: number, reasons: Array }}
 */
function classifyOutcome(callData) {
  const { durationMs, sipCode, hangupBy, events = [], amdResult, audio } = callData;
  const reasons = [];

  // Quick exits based on SIP codes
  if (sipCode === '486') {
    return { outcome: 'busy', confidence: 0.95, reasons: ['SIP 486 Busy Here'] };
  }
  if (sipCode === '408' || sipCode === '480') {
    return { outcome: 'no_answer', confidence: 0.90, reasons: [`SIP ${sipCode}`] };
  }

  // Voicemail scenarios
  const amdDetectedMachine = amdResult === false;
  const repLeftMessage = events.some(e => e.type === 'voicemail_tone_detected') &&
                         durationMs > 15000;

  if (amdDetectedMachine && repLeftMessage) {
    return { outcome: 'voicemail_left', confidence: 0.85, reasons: ['AMD detected machine', 'Rep spoke after VM tone'] };
  }

  if (amdDetectedMachine && !repLeftMessage) {
    return { outcome: 'voicemail_skip', confidence: 0.80, reasons: ['AMD detected machine', 'Rep did not leave message'] };
  }

  // AMD says human — classify based on conversation evidence
  if (amdResult === true && durationMs > 5000) {
    // For calls where AMD detected a human, verify with audio evidence
    // before classifying as connected
    if (durationMs > 30000) {
      reasons.push(`Duration ${Math.round(durationMs / 1000)}s with AMD human detection`);

      const wrongNumberPhrases = events.some(e =>
        e.type === 'transcript_snippet' &&
        /wrong number|no one (here )?by that name|don't know (who|what)/i.test(e.text)
      );

      if (wrongNumberPhrases) {
        reasons.push('Wrong number language detected');
        return { outcome: 'wrong_number', confidence: 0.75, reasons };
      }

      return { outcome: 'connected', confidence: 0.85, reasons };
    }

    // Short call where AMD said human — check audio for bidirectional speech
    if (audio && audio.repSpeechDetected && audio.remoteSpeechDetected) {
      reasons.push(`AMD detected human, bidirectional speech, duration ${Math.round(durationMs / 1000)}s`);
      return { outcome: 'connected', confidence: 0.70, reasons };
    }
    reasons.push(`AMD detected human, duration ${Math.round(durationMs / 1000)}s`);
    return { outcome: 'no_answer', confidence: 0.50, reasons };
  }

  // Fallback for calls with no AMD data
  if (durationMs > 30000) {
    reasons.push(`Duration ${Math.round(durationMs / 1000)}s`);
    return { outcome: 'connected', confidence: 0.60, reasons };
  }

  if (durationMs > 10000) {
    reasons.push(`Duration ${Math.round(durationMs / 1000)}s — indeterminate`);
    return { outcome: 'no_answer', confidence: 0.40, reasons };
  }

  reasons.push(`Very short call: ${Math.round(durationMs / 1000)}s`);
  return { outcome: 'no_answer', confidence: 0.70, reasons };
}

/**
 * Batch classify an array of completed calls.
 * @param {Array} calls - Array of callData objects
 * @returns {Array} Array of { callId, ...classificationResult }
 */
function classifyBatch(calls) {
  return calls.map(call => ({
    callId: call.callId || call.id,
    ...classifyOutcome(call),
  }));
}

module.exports = { classifyOutcome, classifyBatch };
