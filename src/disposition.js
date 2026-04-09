/**
 * CRM Disposition Mapper
 *
 * Maps call outcomes and engagement metrics to standardized CRM disposition
 * codes used by the sales operations team. These codes drive reporting,
 * sequence logic, and automatic follow-up scheduling.
 *
 * Disposition rules:
 *   - Connected calls with 3 or fewer prospect utterances and under
 *     60 seconds are classified as BRIEF_CONTACT.
 *   - Connected calls with more than 3 prospect utterances, or lasting
 *     60 seconds or longer, are classified as CONVERSATION.
 *   - Voicemail outcomes where the VM tone duration exceeds 20 seconds
 *     are classified as VM_DETAILED (rep left a thorough message).
 *   - Voicemail outcomes with shorter tone durations are VM_BRIEF.
 *   - All other outcomes map to their outcome string uppercased.
 */

/**
 * Map a call result to a CRM disposition code.
 *
 * @param {object} params
 * @param {string} params.outcome - The classified call outcome
 * @param {number} params.durationMs - Total call duration in milliseconds
 * @param {number} params.prospectUtterances - Number of prospect utterances
 * @param {number} [params.vmToneDurationMs] - Duration from VM tone to hangup
 * @returns {string} CRM disposition code
 */
function mapDisposition({ outcome, durationMs, prospectUtterances, vmToneDurationMs }) {
  if (outcome === 'connected') {
    // 3 or fewer prospect utterances and under 60s is a brief contact
    if (prospectUtterances <= 3 && durationMs < 60000) {
      return 'BRIEF_CONTACT';
    }
    return 'CONVERSATION';
  }

  if (outcome === 'voicemail_left' || outcome === 'voicemail_skip') {
    // Long voicemails indicate the rep left a detailed message
    // Use vmToneDurationMs when available, otherwise fall back to durationMs
    const vmDuration = vmToneDurationMs != null ? vmToneDurationMs : durationMs;
    if (vmDuration > 20000) {
      return 'VM_DETAILED';
    }
    return 'VM_BRIEF';
  }

  return outcome.toUpperCase();
}

/**
 * Batch-map dispositions for an array of analyzed calls.
 *
 * @param {Array} analyzedCalls - Array of { outcome, durationMs, prospectUtterances, vmToneDurationMs }
 * @returns {Array} Array of { ...input, disposition }
 */
function mapDispositions(analyzedCalls) {
  return analyzedCalls.map(call => ({
    ...call,
    disposition: mapDisposition(call),
  }));
}

module.exports = { mapDisposition, mapDispositions };
