// ============================================================
// Cricket Mafia Bot — Match Engine
// ============================================================
import {
  OUTCOME_MATRIX, STRATEGY_MODIFIERS, SABOTAGE_MODIFIER,
  DELIVERIES, SHOTS, STRATEGIES, BALLS_PER_OVER, OVERS_PER_INNINGS,
} from '../config.js';
import { pickRandom } from '../utils/helpers.js';
import { getCommentary, shouldTriggerEvent, getRandomEvent } from '../utils/commentary.js';

/**
 * Simulate a single ball delivery.
 *
 * @param {string} delivery - The bowler's delivery type
 * @param {string} shot - The batsman's shot choice
 * @param {string} strategy - Current team strategy
 * @param {boolean} sabotaged - Whether the fixer sabotaged this ball
 * @returns {Object} - { runs, isWicket, result, commentary, event }
 */
export function simulateBall(delivery, shot, strategy, sabotaged) {
  // Get base outcomes from matrix
  const outcomeData = OUTCOME_MATRIX[delivery]?.[shot];
  if (!outcomeData) {
    // Fallback: random outcome
    return {
      runs: Math.floor(Math.random() * 3),
      isWicket: false,
      result: 'SINGLE',
      commentary: '🏏 Shot played.',
      event: null,
    };
  }

  // Get strategy modifier
  const stratMod = STRATEGY_MODIFIERS[strategy] || STRATEGY_MODIFIERS[STRATEGIES.BALANCED];

  // Calculate wicket chance
  let wicketChance = outcomeData.wicketChance * stratMod.wicketRisk;

  // Apply sabotage
  if (sabotaged) {
    wicketChance += SABOTAGE_MODIFIER.wicketRiskIncrease;
  }

  // Roll for wicket
  const isWicket = Math.random() < wicketChance;

  let runs = 0;
  let result = '';

  if (isWicket) {
    runs = 0;
    result = 'WICKET';
  } else {
    // Pick random runs from outcome pool
    runs = pickRandom(outcomeData.runs);

    // Apply strategy modifier to runs
    if (strategy === STRATEGIES.ATTACK && runs > 0) {
      // Small chance of extra runs in attack mode
      if (Math.random() < 0.2) runs = Math.min(runs + 1, 6);
    }

    // Apply sabotage run penalty
    if (sabotaged && runs > 1) {
      runs = Math.max(0, Math.floor(runs * SABOTAGE_MODIFIER.runPenalty));
    }

    // Determine result label
    if (runs === 0) result = 'DOT';
    else if (runs === 6) result = 'SIX';
    else if (runs === 4) result = 'FOUR';
    else result = `${runs} RUN${runs > 1 ? 'S' : ''}`;
  }

  // Generate commentary
  const commentary = getCommentary(isWicket ? 'WICKET' : result, runs);

  // Random event
  const event = shouldTriggerEvent() ? getRandomEvent() : null;

  return { runs, isWicket, result, commentary, event };
}

/**
 * Get a random delivery if the bowler doesn't choose.
 */
export function getRandomDelivery() {
  return pickRandom(Object.values(DELIVERIES));
}

/**
 * Get a random shot if the batsman doesn't choose.
 */
export function getRandomShot() {
  return pickRandom(Object.values(SHOTS));
}

/**
 * Generate a random target score for the chasing innings.
 */
export function generateTarget(score) {
  // Target is the first innings score + 1
  return score + 1;
}

/**
 * Check if the team has collapsed (all out).
 */
export function isAllOut(wickets) {
  return wickets >= 10;
}

/**
 * Check if the innings is complete.
 */
export function isInningsComplete(overs, balls, wickets) {
  return (overs >= OVERS_PER_INNINGS) || (wickets >= 10);
}

/**
 * Check if the target has been achieved.
 */
export function isTargetAchieved(score, target) {
  return target > 0 && score >= target;
}

/**
 * Check if required run rate is impossible (>36 per over = impossible).
 */
export function isRunRateImpossible(target, score, oversLeft, ballsLeft) {
  const needed = target - score;
  const totalBallsLeft = oversLeft * 6 + ballsLeft;
  if (totalBallsLeft <= 0) return needed > 0;
  const rrr = (needed / totalBallsLeft) * 6;
  return rrr > 36; // More than 36 per over is physically impossible
}
