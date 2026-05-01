// ============================================================
// Cricket Mafia Bot — Vote Manager
// ============================================================
import * as db from '../database/queries.js';
import { isMafiaRole, getRoleTeam } from './RoleAssigner.js';

/**
 * Tally votes and determine who gets eliminated.
 *
 * @param {number} gameId
 * @param {number} overNumber
 * @returns {Object|null} - { eliminatedPlayer, role, team } or null if no elimination
 */
export function tallyVotes(gameId, overNumber) {
  const votes = db.getVotesForOver(gameId, overNumber);

  if (votes.length === 0) return null;

  // Count votes per target (excluding skips)
  const voteCounts = {};
  let skipCount = 0;

  for (const vote of votes) {
    if (vote.is_skip) {
      skipCount++;
      continue;
    }
    const targetId = vote.target_id;
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  }

  // If majority skipped, no elimination
  const alivePlayers = db.getAlivePlayers(gameId);
  if (skipCount > alivePlayers.length / 2) return null;

  // Find the player with most votes
  let maxVotes = 0;
  let maxTargetId = null;
  let isTied = false;

  for (const [targetId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      maxTargetId = parseInt(targetId);
      isTied = false;
    } else if (count === maxVotes) {
      isTied = true;
    }
  }

  // If tied, no elimination
  if (isTied || maxVotes === 0) return null;

  // Find the target player
  const players = db.getGamePlayers(gameId);
  const targetPlayer = players.find(p => p.user_id === maxTargetId);

  if (!targetPlayer) return null;

  // Eliminate the player
  db.eliminatePlayer(targetPlayer.id);

  return {
    player: targetPlayer,
    role: targetPlayer.role,
    team: getRoleTeam(targetPlayer.role),
    isMafia: isMafiaRole(targetPlayer.role),
  };
}

/**
 * Check if all mafia members are eliminated.
 */
export function areAllMafiaEliminated(gameId) {
  const players = db.getGamePlayers(gameId);
  const aliveMafia = players.filter(p => isMafiaRole(p.role) && p.is_alive);
  return aliveMafia.length === 0;
}

/**
 * Count remaining mafia members.
 */
export function getMafiaCount(gameId) {
  const players = db.getGamePlayers(gameId);
  return players.filter(p => isMafiaRole(p.role) && p.is_alive).length;
}

/**
 * Count chaos level for the Commentator win condition.
 * Returns a chaos score based on wickets, eliminations, and close calls.
 */
export function getChaosLevel(gameId) {
  const game = db.getGameById(gameId);
  const players = db.getGamePlayers(gameId);
  const eliminated = players.filter(p => p.is_eliminated).length;

  let chaos = 0;
  chaos += game.wickets * 2;      // Each wicket = 2 chaos
  chaos += eliminated * 3;         // Each elimination = 3 chaos
  if (game.score > 100) chaos += 2; // High scoring = more exciting
  if (game.wickets >= 5) chaos += 5; // Lots of wickets

  return chaos;
}

/**
 * Check if the Commentator wins (chaos threshold = 15).
 */
export function doesCommentatorWin(gameId) {
  const players = db.getGamePlayers(gameId);
  const hasCommentator = players.some(p => p.role === 'Commentator' && p.is_alive);
  if (!hasCommentator) return false;
  return getChaosLevel(gameId) >= 15;
}
