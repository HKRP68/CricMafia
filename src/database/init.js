// ============================================================
// Cricket Mafia Bot — Database Initialization
// ============================================================
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

let db;

export function initDatabase(dbPath = './data/cricket-mafia.db') {
  mkdirSync(dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    -- Persistent user profiles
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      username TEXT,
      first_name TEXT,
      xp INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 0,
      games_played INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Game sessions
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      state TEXT DEFAULT 'lobby',
      score INTEGER DEFAULT 0,
      wickets INTEGER DEFAULT 0,
      overs_completed INTEGER DEFAULT 0,
      balls_in_over INTEGER DEFAULT 0,
      target_score INTEGER DEFAULT 0,
      current_strategy TEXT DEFAULT 'balanced',
      current_over_sabotaged INTEGER DEFAULT 0,
      innings INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME
    );

    -- Players in a game
    CREATE TABLE IF NOT EXISTS game_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      telegram_id INTEGER NOT NULL,
      role TEXT,
      is_alive INTEGER DEFAULT 1,
      is_eliminated INTEGER DEFAULT 0,
      has_acted_this_ball INTEGER DEFAULT 0,
      physio_used INTEGER DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Action log
    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      over_number INTEGER,
      ball_number INTEGER,
      player_id INTEGER,
      action_type TEXT,
      action_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id)
    );

    -- Votes
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      over_number INTEGER,
      voter_id INTEGER NOT NULL,
      target_id INTEGER,
      is_skip INTEGER DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_games_chat ON games(chat_id);
    CREATE INDEX IF NOT EXISTS idx_game_players_game ON game_players(game_id);
    CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
  `);

  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}
