// ============================================================
// Cricket Mafia Bot — Phase Manager (Timer-based transitions)
// ============================================================
import {
  GAME_STATES,
  STRATEGY_PHASE_DURATION,
  SECRET_ACTION_DURATION,
  DISCUSSION_PHASE_DURATION,
  VOTING_PHASE_DURATION,
  TOSS_CHOICE_DURATION,
} from '../config.js';

const activeTimers = new Map();

export function setPhaseTimer(gameId, phase, callback) {
  clearPhaseTimer(gameId);
  const durations = {
    [GAME_STATES.TOSS_CHOICE]: TOSS_CHOICE_DURATION,
    [GAME_STATES.STRATEGY]: STRATEGY_PHASE_DURATION,
    [GAME_STATES.SECRET_ACTIONS]: SECRET_ACTION_DURATION,
    [GAME_STATES.DISCUSSION]: DISCUSSION_PHASE_DURATION,
    [GAME_STATES.VOTING]: VOTING_PHASE_DURATION,
  };
  const duration = durations[phase];
  if (!duration) return;
  const timer = setTimeout(() => {
    activeTimers.delete(gameId);
    callback();
  }, duration);
  activeTimers.set(gameId, { timer, phase });
}

export function clearPhaseTimer(gameId) {
  const existing = activeTimers.get(gameId);
  if (existing) {
    clearTimeout(existing.timer);
    activeTimers.delete(gameId);
  }
}

export function clearAllTimers() {
  for (const [, { timer }] of activeTimers) clearTimeout(timer);
  activeTimers.clear();
}
