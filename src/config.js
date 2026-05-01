// ============================================================
// Cricket Mafia Bot — Configuration
// ============================================================

// ── Game Settings ──────────────────────────────────────────
export const MIN_PLAYERS = 6;
export const MAX_PLAYERS = 14;
export const OVERS_PER_INNINGS = 10;
export const BALLS_PER_OVER = 6;
export const TARGET_SCORE_BASE = 120; // Base target for chasing team

// ── Timer Durations (ms) ──────────────────────────────────
export const STRATEGY_PHASE_DURATION = 30_000;   // 30 seconds
export const SECRET_ACTION_DURATION = 30_000;     // 30 seconds
export const DISCUSSION_PHASE_DURATION = 60_000;  // 60 seconds
export const VOTING_PHASE_DURATION = 45_000;      // 45 seconds
export const TOSS_CHOICE_DURATION = 30_000;       // 30 seconds

// ── Game States ───────────────────────────────────────────
export const GAME_STATES = {
  LOBBY: 'lobby',
  TOSS: 'toss',
  TOSS_CHOICE: 'toss_choice',
  STRATEGY: 'strategy',
  SECRET_ACTIONS: 'secret_actions',
  BALL_SIMULATION: 'ball_simulation',
  DISCUSSION: 'discussion',
  VOTING: 'voting',
  GAME_OVER: 'game_over',
};

// ── Roles ─────────────────────────────────────────────────
export const ROLES = {
  // Team Cricket (Good)
  CAPTAIN: 'Captain',
  BATSMAN: 'Batsman',
  BOWLER: 'Bowler',
  WICKETKEEPER: 'Wicketkeeper',
  ANALYST: 'Analyst',
  PHYSIO: 'Physio',

  // Mafia (Bad)
  FIXER: 'Fixer',
  AGENT: 'Agent',
  BOOKIE: 'Bookie',

  // Neutral
  COMMENTATOR: 'Commentator',
};

export const TEAM_CRICKET_ROLES = [
  ROLES.CAPTAIN, ROLES.BATSMAN, ROLES.BOWLER,
  ROLES.WICKETKEEPER, ROLES.ANALYST, ROLES.PHYSIO,
];

export const MAFIA_ROLES = [
  ROLES.FIXER, ROLES.AGENT, ROLES.BOOKIE,
];

// ── Role Distribution by Player Count ─────────────────────
// Format: { team: count, mafia: count, neutral: count }
export const ROLE_DISTRIBUTION = {
  6:  { team: 4, mafia: 2, neutral: 0 },
  7:  { team: 5, mafia: 2, neutral: 0 },
  8:  { team: 5, mafia: 2, neutral: 1 },
  9:  { team: 6, mafia: 2, neutral: 1 },
  10: { team: 6, mafia: 3, neutral: 1 },
  11: { team: 7, mafia: 3, neutral: 1 },
  12: { team: 8, mafia: 3, neutral: 1 },
  13: { team: 9, mafia: 3, neutral: 1 },
  14: { team: 9, mafia: 4, neutral: 1 },
};

// ── Shots ─────────────────────────────────────────────────
export const SHOTS = {
  DRIVE: 'Drive',
  PULL: 'Pull',
  DEFENSE: 'Defense',
  LOFTED: 'Lofted',
};

// ── Deliveries ────────────────────────────────────────────
export const DELIVERIES = {
  YORKER: 'Yorker',
  BOUNCER: 'Bouncer',
  SLOW_BALL: 'Slow Ball',
  GOOD_LENGTH: 'Good Length',
};

// ── Strategies ────────────────────────────────────────────
export const STRATEGIES = {
  ATTACK: 'attack',
  BALANCED: 'balanced',
  DEFENSIVE: 'defensive',
};

// ── Match Engine Outcome Matrix ───────────────────────────
// [delivery][shot] = { runs: [possible outcomes], wicket_chance: 0-1 }
export const OUTCOME_MATRIX = {
  [DELIVERIES.YORKER]: {
    [SHOTS.DRIVE]:   { runs: [0, 1, 2, 4], wicketChance: 0.25 },
    [SHOTS.PULL]:    { runs: [0, 0, 1],     wicketChance: 0.35 },
    [SHOTS.DEFENSE]: { runs: [0, 0, 1],     wicketChance: 0.08 },
    [SHOTS.LOFTED]:  { runs: [0, 4, 6],     wicketChance: 0.40 },
  },
  [DELIVERIES.BOUNCER]: {
    [SHOTS.DRIVE]:   { runs: [0, 0, 1],     wicketChance: 0.30 },
    [SHOTS.PULL]:    { runs: [1, 4, 4, 6],  wicketChance: 0.15 },
    [SHOTS.DEFENSE]: { runs: [0, 0, 1],     wicketChance: 0.05 },
    [SHOTS.LOFTED]:  { runs: [0, 4, 6, 6],  wicketChance: 0.30 },
  },
  [DELIVERIES.SLOW_BALL]: {
    [SHOTS.DRIVE]:   { runs: [0, 1, 2, 4],  wicketChance: 0.15 },
    [SHOTS.PULL]:    { runs: [0, 1, 2],      wicketChance: 0.20 },
    [SHOTS.DEFENSE]: { runs: [0, 1],          wicketChance: 0.03 },
    [SHOTS.LOFTED]:  { runs: [0, 2, 4, 6],  wicketChance: 0.25 },
  },
  [DELIVERIES.GOOD_LENGTH]: {
    [SHOTS.DRIVE]:   { runs: [0, 1, 2, 4],  wicketChance: 0.12 },
    [SHOTS.PULL]:    { runs: [0, 1, 2],      wicketChance: 0.18 },
    [SHOTS.DEFENSE]: { runs: [0, 0, 1],      wicketChance: 0.05 },
    [SHOTS.LOFTED]:  { runs: [0, 2, 4, 6],  wicketChance: 0.22 },
  },
};

// ── Strategy Modifiers ────────────────────────────────────
export const STRATEGY_MODIFIERS = {
  [STRATEGIES.ATTACK]:    { runBonus: 1.3, wicketRisk: 1.4 },
  [STRATEGIES.BALANCED]:  { runBonus: 1.0, wicketRisk: 1.0 },
  [STRATEGIES.DEFENSIVE]: { runBonus: 0.7, wicketRisk: 0.6 },
};

// ── Sabotage Effects ──────────────────────────────────────
export const SABOTAGE_MODIFIER = {
  wicketRiskIncrease: 0.15,
  runPenalty: 0.7,
};

// ── XP Rewards ────────────────────────────────────────────
export const XP_REWARDS = {
  GAME_PLAYED: 10,
  GAME_WON: 25,
  CORRECT_VOTE: 15,
  SURVIVED: 5,
  WICKET_TAKEN: 5,
  BOUNDARY: 3,
  SIX: 5,
};
