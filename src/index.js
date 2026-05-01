// ============================================================
// Cricket Mafia Bot — Entry Point (Render-Ready)
// ============================================================
import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { initDatabase } from './database/init.js';
import { clearAllTimers } from './game/PhaseManager.js';

// Handlers
import { registerLobbyHandlers } from './handlers/lobby.js';
import { registerTossHandlers } from './handlers/toss.js';
import { registerMatchHandlers } from './handlers/match.js';
import { registerActionHandlers } from './handlers/actions.js';
import { registerVotingHandlers } from './handlers/voting.js';
import { registerUtilityHandlers } from './handlers/utility.js';

// ── Validate Token ──────────────────────────────────────
const token = process.env.BOT_TOKEN;
if (!token || token === 'your_bot_token_here') {
  console.error('❌ BOT_TOKEN not set!');
  console.error('   Get a token from @BotFather on Telegram.');
  console.error('   Set it as BOT_TOKEN in your .env file or Render environment.');
  process.exit(1);
}

// ── Initialize ──────────────────────────────────────────
console.log('🏏 Cricket Mafia Bot — Starting...');
initDatabase();
console.log('✅ Database initialized');

const bot = new Telegraf(token);

// ── Set Bot Commands Menu (visible in Telegram) ─────────
bot.telegram.setMyCommands([
  { command: 'start', description: '🏏 Start the bot & see main menu' },
  { command: 'startgame', description: '🆕 Create a new game in this group' },
  { command: 'join', description: '✅ Join the current game' },
  { command: 'begin', description: '🚀 Begin the match (6+ players)' },
  { command: 'score', description: '📊 View current scoreboard' },
  { command: 'players', description: '👥 List joined players' },
  { command: 'profile', description: '👤 View your stats' },
  { command: 'leaderboard', description: '🏆 Top players' },
  { command: 'roles', description: '🎭 View all roles info' },
  { command: 'help', description: '❓ How to play' },
]).then(() => console.log('✅ Bot commands menu set'))
  .catch(err => console.warn('⚠️ Could not set commands:', err.message));

// ── Register All Handlers ───────────────────────────────
registerUtilityHandlers(bot);   // /start, /help first
registerLobbyHandlers(bot);
registerTossHandlers(bot);
registerMatchHandlers(bot);
registerActionHandlers(bot);
registerVotingHandlers(bot);

// ── Error Handling ──────────────────────────────────────
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

// ── Graceful Shutdown ───────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  clearAllTimers();
  bot.stop(signal);
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

// ── Launch (Long Polling — works on Render worker) ──────
bot.launch()
  .then(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Cricket Mafia Bot is LIVE!');
    console.log('🏏 Add to a group → /startgame');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  })
  .catch((err) => {
    console.error('❌ Failed to launch bot:', err.message);
    process.exit(1);
  });
