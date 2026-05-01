// ============================================================
// Cricket Mafia Bot — Database Queries
// ============================================================
import { getDb } from './init.js';

// ── User Operations ───────────────────────────────────────
export function upsertUser(telegramId, username, firstName) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO users (telegram_id, username, first_name)
    VALUES (?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name
  `).run(telegramId, username, firstName);
}

export function getUserByTelegramId(telegramId) {
  return getDb().prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);
}

export function addXp(telegramId, amount) {
  return getDb().prepare('UPDATE users SET xp = xp + ? WHERE telegram_id = ?').run(amount, telegramId);
}

export function addCoins(telegramId, amount) {
  return getDb().prepare('UPDATE users SET coins = coins + ? WHERE telegram_id = ?').run(amount, telegramId);
}

export function incrementGamesPlayed(telegramId) {
  return getDb().prepare('UPDATE users SET games_played = games_played + 1 WHERE telegram_id = ?').run(telegramId);
}

export function incrementGamesWon(telegramId) {
  return getDb().prepare('UPDATE users SET games_won = games_won + 1 WHERE telegram_id = ?').run(telegramId);
}

export function getLeaderboard(limit = 10) {
  return getDb().prepare('SELECT * FROM users ORDER BY xp DESC LIMIT ?').all(limit);
}

// ── Game Operations ───────────────────────────────────────
export function createGame(chatId) {
  const db = getDb();
  // End any existing game in this chat
  db.prepare(`UPDATE games SET state = 'game_over', ended_at = CURRENT_TIMESTAMP WHERE chat_id = ? AND state != 'game_over'`).run(chatId);

  const result = db.prepare('INSERT INTO games (chat_id) VALUES (?)').run(chatId);
  return result.lastInsertRowid;
}

export function getActiveGame(chatId) {
  return getDb().prepare(`SELECT * FROM games WHERE chat_id = ? AND state != 'game_over' ORDER BY id DESC LIMIT 1`).get(chatId);
}

export function getGameById(gameId) {
  return getDb().prepare('SELECT * FROM games WHERE id = ?').get(gameId);
}

export function updateGameState(gameId, state) {
  return getDb().prepare('UPDATE games SET state = ? WHERE id = ?').run(state, gameId);
}

export function updateGameScore(gameId, score, wickets) {
  return getDb().prepare('UPDATE games SET score = ?, wickets = ? WHERE id = ?').run(score, wickets, gameId);
}

export function updateGameOvers(gameId, oversCompleted, ballsInOver) {
  return getDb().prepare('UPDATE games SET overs_completed = ?, balls_in_over = ? WHERE id = ?').run(oversCompleted, ballsInOver, gameId);
}

export function updateGameStrategy(gameId, strategy) {
  return getDb().prepare('UPDATE games SET current_strategy = ? WHERE id = ?').run(strategy, gameId);
}

export function updateGameSabotage(gameId, sabotaged) {
  return getDb().prepare('UPDATE games SET current_over_sabotaged = ? WHERE id = ?').run(sabotaged ? 1 : 0, gameId);
}

export function updateGameTarget(gameId, target) {
  return getDb().prepare('UPDATE games SET target_score = ? WHERE id = ?').run(target, gameId);
}

export function endGame(gameId) {
  return getDb().prepare(`UPDATE games SET state = 'game_over', ended_at = CURRENT_TIMESTAMP WHERE id = ?`).run(gameId);
}

// ── Game Player Operations ────────────────────────────────
export function addPlayerToGame(gameId, userId, telegramId) {
  return getDb().prepare('INSERT INTO game_players (game_id, user_id, telegram_id) VALUES (?, ?, ?)').run(gameId, userId, telegramId);
}

export function getGamePlayers(gameId) {
  return getDb().prepare(`
    SELECT gp.*, u.username, u.first_name, u.telegram_id as tg_id
    FROM game_players gp
    JOIN users u ON gp.user_id = u.id
    WHERE gp.game_id = ?
  `).all(gameId);
}

export function getAlivePlayers(gameId) {
  return getDb().prepare(`
    SELECT gp.*, u.username, u.first_name, u.telegram_id as tg_id
    FROM game_players gp
    JOIN users u ON gp.user_id = u.id
    WHERE gp.game_id = ? AND gp.is_alive = 1 AND gp.is_eliminated = 0
  `).all(gameId);
}

export function getPlayerInGame(gameId, telegramId) {
  return getDb().prepare(`
    SELECT gp.*, u.username, u.first_name
    FROM game_players gp
    JOIN users u ON gp.user_id = u.id
    WHERE gp.game_id = ? AND gp.telegram_id = ?
  `).get(gameId, telegramId);
}

export function assignRole(gamePlayerId, role) {
  return getDb().prepare('UPDATE game_players SET role = ? WHERE id = ?').run(role, gamePlayerId);
}

export function eliminatePlayer(gamePlayerId) {
  return getDb().prepare('UPDATE game_players SET is_eliminated = 1, is_alive = 0 WHERE id = ?').run(gamePlayerId);
}

export function resetActionsForBall(gameId) {
  return getDb().prepare('UPDATE game_players SET has_acted_this_ball = 0 WHERE game_id = ?').run(gameId);
}

export function markPlayerActed(gamePlayerId) {
  return getDb().prepare('UPDATE game_players SET has_acted_this_ball = 1 WHERE id = ?').run(gamePlayerId);
}

export function getPlayersByRole(gameId, role) {
  return getDb().prepare(`
    SELECT gp.*, u.username, u.first_name
    FROM game_players gp
    JOIN users u ON gp.user_id = u.id
    WHERE gp.game_id = ? AND gp.role = ? AND gp.is_alive = 1
  `).all(gameId, role);
}

export function isPlayerInGame(gameId, telegramId) {
  return getDb().prepare('SELECT COUNT(*) as count FROM game_players WHERE game_id = ? AND telegram_id = ?').get(gameId, telegramId).count > 0;
}

export function getPlayerCount(gameId) {
  return getDb().prepare('SELECT COUNT(*) as count FROM game_players WHERE game_id = ?').get(gameId).count;
}

export function removePlayerFromGame(gameId, telegramId) {
  return getDb().prepare('DELETE FROM game_players WHERE game_id = ? AND telegram_id = ?').run(gameId, telegramId);
}

// ── Action Operations ─────────────────────────────────────
export function logAction(gameId, overNumber, ballNumber, playerId, actionType, actionValue) {
  return getDb().prepare(`
    INSERT INTO actions (game_id, over_number, ball_number, player_id, action_type, action_value)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(gameId, overNumber, ballNumber, playerId, actionType, actionValue);
}

export function getActionsForBall(gameId, overNumber, ballNumber) {
  return getDb().prepare(`
    SELECT * FROM actions WHERE game_id = ? AND over_number = ? AND ball_number = ?
  `).all(gameId, overNumber, ballNumber);
}

// ── Vote Operations ───────────────────────────────────────
export function castVote(gameId, overNumber, voterId, targetId, isSkip = false) {
  // Remove existing vote from this voter for this over
  getDb().prepare('DELETE FROM votes WHERE game_id = ? AND over_number = ? AND voter_id = ?').run(gameId, overNumber, voterId);
  return getDb().prepare(`
    INSERT INTO votes (game_id, over_number, voter_id, target_id, is_skip)
    VALUES (?, ?, ?, ?, ?)
  `).run(gameId, overNumber, voterId, targetId, isSkip ? 1 : 0);
}

export function getVotesForOver(gameId, overNumber) {
  return getDb().prepare(`
    SELECT v.*, u.username, u.first_name,
           tu.username as target_username, tu.first_name as target_first_name
    FROM votes v
    JOIN users u ON v.voter_id = u.id
    LEFT JOIN users tu ON v.target_id = tu.id
    WHERE v.game_id = ? AND v.over_number = ?
  `).all(gameId, overNumber);
}

export function getVoteCount(gameId, overNumber) {
  return getDb().prepare('SELECT COUNT(*) as count FROM votes WHERE game_id = ? AND over_number = ?').get(gameId, overNumber).count;
}
