// ============================================================
// Cricket Mafia Bot — Role Assigner
// ============================================================
import {
  ROLES, TEAM_CRICKET_ROLES, MAFIA_ROLES,
  ROLE_DISTRIBUTION,
} from '../config.js';
import { shuffle } from '../utils/helpers.js';

const ROLE_DESCRIPTIONS = {
  [ROLES.CAPTAIN]:     'You set the team strategy each over. Your decisions shape the match!',
  [ROLES.BATSMAN]:     'You choose the shot to play against each delivery.',
  [ROLES.BOWLER]:      'You choose the type of delivery to bowl.',
  [ROLES.WICKETKEEPER]:'You can attempt to save a wicket if one falls.',
  [ROLES.ANALYST]:     'You see hidden stats and sabotage hints. Use info wisely!',
  [ROLES.PHYSIO]:      'You can revive one eliminated player once per game.',
  [ROLES.FIXER]:       'You can sabotage each ball to increase wicket chance and reduce runs.',
  [ROLES.AGENT]:       'You appear as Team Cricket when investigated. Mislead the voters!',
  [ROLES.BOOKIE]:      'You can manipulate the outcome of one critical ball per game.',
  [ROLES.COMMENTATOR]: 'You win if the match has maximum chaos — lots of wickets AND controversy!',
};

/**
 * Assign roles to players based on player count.
 * @param {Array} players - Array of player objects
 * @returns {Array} - Players with roles assigned
 */
export function assignRoles(players) {
  const count = players.length;
  const dist = ROLE_DISTRIBUTION[count] || ROLE_DISTRIBUTION[Math.min(count, 14)];

  if (!dist) {
    throw new Error(`Cannot assign roles for ${count} players`);
  }

  // Build role pool
  const rolePool = [];

  // Always include Captain, Batsman, Bowler
  const teamRoles = [ROLES.CAPTAIN, ROLES.BATSMAN, ROLES.BOWLER];
  // Fill remaining team slots from extras
  const extraTeamRoles = [ROLES.WICKETKEEPER, ROLES.ANALYST, ROLES.PHYSIO, ROLES.BATSMAN, ROLES.BOWLER, ROLES.BATSMAN];
  for (let i = teamRoles.length; i < dist.team; i++) {
    teamRoles.push(extraTeamRoles[i - 3] || ROLES.BATSMAN);
  }
  rolePool.push(...teamRoles);

  // Mafia roles
  const mafiaRoles = [ROLES.FIXER]; // Always have a Fixer
  const extraMafiaRoles = [ROLES.AGENT, ROLES.BOOKIE];
  for (let i = 1; i < dist.mafia; i++) {
    mafiaRoles.push(extraMafiaRoles[i - 1] || ROLES.FIXER);
  }
  rolePool.push(...mafiaRoles);

  // Neutral
  if (dist.neutral > 0) {
    rolePool.push(ROLES.COMMENTATOR);
  }

  // Shuffle and assign
  const shuffledRoles = shuffle(rolePool);
  const shuffledPlayers = shuffle([...players]);

  return shuffledPlayers.map((player, i) => ({
    ...player,
    role: shuffledRoles[i],
  }));
}

/**
 * Get the description for a role.
 */
export function getRoleDescription(role) {
  return ROLE_DESCRIPTIONS[role] || 'Unknown role.';
}

/**
 * Get the team side for a role.
 */
export function getRoleTeam(role) {
  if (MAFIA_ROLES.includes(role)) return 'mafia';
  if (role === ROLES.COMMENTATOR) return 'neutral';
  return 'team_cricket';
}

/**
 * Check if a role is a mafia role.
 */
export function isMafiaRole(role) {
  return MAFIA_ROLES.includes(role);
}
