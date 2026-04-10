/**
 * Call Report Generator
 *
 * Generates a formatted analysis report from an array of call records.
 * The output must match the format in expected/report.txt exactly.
 *
 * Run `npm test` to compare your output against the expected report.
 *
 * Each call record has:
 *   callId, timestamp, outcome, durationMs, repPct (null for non-connected),
 *   prospectUtterances, totalSignals (null for non-connected),
 *   missedSignals (null for non-connected), missedSignalKeywords (array or null),
 *   monologues, disposition
 *
 * @param {Array} calls - Array of call record objects
 * @returns {string} Formatted report text
 */
function generateReport(calls) {
  // TODO: Implement report generation
  // Look at expected/report.txt to understand the exact format
  return '';
}

module.exports = { generateReport };
