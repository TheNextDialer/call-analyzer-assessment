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
 * This classification feeds into reporting dashboards and rep performance metrics.
 * Getting it wrong means bad data for sales managers.
 */

/**
 * Classify the outcome of a completed call.
 * @param {object} callData - Post-call metadata
 * @param {number} callData.durationMs - Total call duration in milliseconds
 * @param {string} callData.sipCode - Final SIP response code ("200", "486", "487", "408", etc.)
 * @param {string} callData.hangupBy - Who ended the call: "rep", "prospect", "system"
 * @param {Array} callData.events - Timeline of call events
 * @param {boolean} callData.amdResult - Hardware AMD result: true = human, false = machine, null = unknown
 * @param {object} [callData.audio] - Optional audio analysis
 * @param {boolean} [callData.audio.repSpeechDetected] - Did the rep speak?
 * @param {boolean} [callData.audio.remoteSpeechDetected] - Was speech detected from remote side?
 * @param {number} [callData.audio.firstRemoteSpeechMs] - When did remote side first speak?
 * @returns {{ outcome: string, confidence: number, reasons: Array }}
 */
function classifyOutcome(callData) {
  const { durationMs, sipCode, hangupBy, events = [], amdResult, audio } = callData;
  const reasons = [];

  // ── Quick exits based on SIP codes ──
  if (sipCode === '486') {
    return { outcome: 'busy', confidence: 0.95, reasons: ['SIP 486 Busy Here'] };
  }
  if (sipCode === '408' || sipCode === '480') {
    return { outcome: 'no_answer', confidence: 0.90, reasons: [`SIP ${sipCode} — no response from remote`] };
  }

  // ── Check for voicemail scenarios ──
  const amdDetectedMachine = amdResult === false;
  const repLeftMessage = events.some(e => e.type === 'voicemail_tone_detected') &&
                         durationMs > 15000;
  
  if (amdDetectedMachine && repLeftMessage) {
    return { outcome: 'voicemail_left', confidence: 0.85, reasons: ['AMD detected machine', 'Rep spoke after VM tone', `Duration: ${Math.round(durationMs / 1000)}s`] };
  }
  
  if (amdDetectedMachine && !repLeftMessage) {
    return { outcome: 'voicemail_skip', confidence: 0.80, reasons: ['AMD detected machine', 'Rep hung up quickly'] };
  }

  // ── Connected call classification ──
  // BUG IS HERE: We only use duration to determine if a real conversation 
  // happened. If durationMs > 30000 (30 seconds), we assume it was a 
  // real conversation. But some real conversations are SHORT — a prospect 
  // picks up, says "not interested", and hangs up in 12 seconds.
  // That's still a connected call, not a "no_answer".
  //
  // We HAVE audio data available (audio.remoteSpeechDetected) that would 
  // tell us whether the remote side actually spoke — but we're not using it.
  // A 12-second call with bidirectional speech = connected.
  // A 25-second call with no remote speech = probably rang out and auto-disconnected.
  
  if (durationMs > 30000) {
    reasons.push(`Call lasted ${Math.round(durationMs / 1000)}s — likely a real conversation`);
    
    // Check for wrong number indicators
    const wrongNumberPhrases = events.some(e => 
      e.type === 'transcript_snippet' && 
      /wrong number|no one (here )?by that name|don't know (who|what)/i.test(e.text)
    );
    
    if (wrongNumberPhrases) {
      reasons.push('Wrong number language detected in transcript');
      return { outcome: 'wrong_number', confidence: 0.75, reasons };
    }

    return { outcome: 'connected', confidence: 0.85, reasons };
  }

  // Short calls — assume no real conversation happened
  if (durationMs > 10000) {
    reasons.push(`Call was ${Math.round(durationMs / 1000)}s — too short for a real conversation`);
    return { outcome: 'no_answer', confidence: 0.50, reasons };
  }

  // Very short calls
  reasons.push(`Call was only ${Math.round(durationMs / 1000)}s`);
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
