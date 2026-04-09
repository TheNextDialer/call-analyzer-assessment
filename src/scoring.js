/**
 * Call Quality Scoring
 *
 * Computes a composite quality score (0-100) from weighted components.
 * Used by the leaderboard and manager dashboards to rank call quality.
 *
 * Components and weights:
 *   - talkRatioScore  (30%): 100 if rep ratio is 40-60%, scaled down outside that
 *   - coachingScore   (25%): starts at 100, -15 per missed signal, -10 per monologue
 *   - durationScore   (20%): tent function centered on target duration (default 180s)
 *   - dispositionScore(15%): 100 if CONVERSATION, 50 if BRIEF_CONTACT, 0 otherwise
 *   - engagementScore (10%): based on prospect utterance count, capped at 100
 */

/**
 * Score a single call using the composite model.
 *
 * @param {object} params
 * @param {number} params.repPct - Rep talk ratio percentage
 * @param {number} params.missedSignals - Count of missed buying signals
 * @param {number} params.monologues - Count of monologue moments
 * @param {number} params.durationMs - Total call duration in milliseconds
 * @param {string} params.disposition - CRM disposition code
 * @param {number} params.prospectUtterances - Number of prospect utterances
 * @param {number} [params.targetDurationMs] - Target call duration (default 180000ms)
 * @returns {{ total: number, breakdown: object }}
 */
function scoreCall({
  repPct,
  missedSignals,
  monologues,
  durationMs,
  disposition,
  prospectUtterances,
  targetDurationMs = 180000,
}) {
  // Talk ratio: ideal is 40-60% rep, 100 pts inside that range
  let talkRatioScore;
  if (repPct >= 40 && repPct <= 60) {
    talkRatioScore = 100;
  } else if (repPct < 40) {
    talkRatioScore = Math.max(0, 100 - (40 - repPct) * 2.5);
  } else {
    talkRatioScore = Math.max(0, 100 - (repPct - 60) * 2.5);
  }

  // Coaching: start at 100, deduct for issues, clamp to zero
  let coachingScore = Math.max(0, 100 - (missedSignals * 15) - (monologues * 10));

  // Duration: tent function centered on target duration.
  // Penalize both under and over the target.
  const ratio = durationMs / targetDurationMs;
  const durationScore = ratio <= 1.0
    ? ratio * 100
    : Math.max(0, 100 - (ratio - 1.0) * 50);

  // Disposition: CONVERSATION is ideal
  let dispositionScore = 0;
  if (disposition === 'CONVERSATION') dispositionScore = 100;
  else if (disposition === 'BRIEF_CONTACT') dispositionScore = 50;

  // Engagement: more prospect utterances = better engagement, cap at 10
  const engagementScore = Math.min(prospectUtterances / 10, 1.0) * 100;

  // Weighted composite
  const total = Math.round(
    talkRatioScore * 0.30 +
    coachingScore * 0.25 +
    durationScore * 0.20 +
    dispositionScore * 0.15 +
    engagementScore * 0.10
  );

  return {
    total,
    breakdown: {
      talkRatioScore: Math.round(talkRatioScore),
      coachingScore: Math.round(coachingScore),
      durationScore: Math.round(durationScore),
      dispositionScore: Math.round(dispositionScore),
      engagementScore: Math.round(engagementScore),
    },
  };
}

module.exports = { scoreCall };
