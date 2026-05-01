// ============================================================
// Cricket Mafia Bot — Lobby Handlers (Button-Driven)
// ============================================================
import * as db from '../database/queries.js';
import { MIN_PLAYERS, MAX_PLAYERS, GAME_STATES } from '../config.js';
import { beginGame } from '../game/GameManager.js';
import { MSG } from '../utils/messages.js';
import { safeReply, safeSend } from '../utils/helpers.js';
import { Markup } from 'telegraf';

// ── Lobby Buttons ──────────────────────────────────────
function lobbyKeyboard(gameId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Join Game', `lobby_join_${gameId}`)],
    [Markup.button.callback('👥 Players', `lobby_players_${gameId}`),
     Markup.button.callback('❌ Leave', `lobby_leave_${gameId}`)],
    [Markup.button.callback('🚀 Begin Match!', `lobby_begin_${gameId}`)],
  ]);
}

export function registerLobbyHandlers(bot) {
  // ── /startgame (also works via button) ────────────────
  bot.command('startgame', async (ctx) => {
    if (ctx.chat.type === 'private') {
      return safeReply(ctx, '⚠️ Add me to a *group chat* first, then use this command there!');
    }
    await createNewGame(ctx);
  });

  // ── Button: New Game ──────────────────────────────────
  bot.action('new_game', async (ctx) => {
    await ctx.answerCbQuery();
    if (ctx.chat.type === 'private') {
      return ctx.reply('⚠️ Add me to a *group chat* and tap 🏏 New Game there!', { parse_mode: 'Markdown' });
    }
    await createNewGame(ctx);
  });

  // ── Button: Join ──────────────────────────────────────
  bot.action(/^lobby_join_(\d+)$/, async (ctx) => {
    const gameId = parseInt(ctx.match[1]);
    const game = db.getGameById(gameId);
    if (!game || game.state !== GAME_STATES.LOBBY) {
      return ctx.answerCbQuery('⚠️ This lobby is no longer active!');
    }

    if (db.isPlayerInGame(gameId, ctx.from.id)) {
      return ctx.answerCbQuery('✅ You\'re already in!');
    }

    const count = db.getPlayerCount(gameId);
    if (count >= MAX_PLAYERS) {
      return ctx.answerCbQuery('⚠️ Game is full!');
    }

    db.upsertUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
    const user = db.getUserByTelegramId(ctx.from.id);
    db.addPlayerToGame(gameId, user.id, ctx.from.id);

    const newCount = count + 1;
    await ctx.answerCbQuery(`✅ Joined! (${newCount} players)`);
    await safeSend(ctx, game.chat_id,
      MSG.PLAYER_JOINED(ctx.from.first_name, newCount, MIN_PLAYERS),
      { ...lobbyKeyboard(gameId) }
    );
  });

  // ── Button: Leave ─────────────────────────────────────
  bot.action(/^lobby_leave_(\d+)$/, async (ctx) => {
    const gameId = parseInt(ctx.match[1]);
    const game = db.getGameById(gameId);
    if (!game || game.state !== GAME_STATES.LOBBY) {
      return ctx.answerCbQuery('⚠️ This lobby is no longer active!');
    }

    if (!db.isPlayerInGame(gameId, ctx.from.id)) {
      return ctx.answerCbQuery('⚠️ You\'re not in this game!');
    }

    db.removePlayerFromGame(gameId, ctx.from.id);
    const count = db.getPlayerCount(gameId);
    await ctx.answerCbQuery('👋 Left the game.');
    await safeSend(ctx, game.chat_id, MSG.PLAYER_LEFT(ctx.from.first_name, count));
  });

  // ── Button: Players ───────────────────────────────────
  bot.action(/^lobby_players_(\d+)$/, async (ctx) => {
    const gameId = parseInt(ctx.match[1]);
    const game = db.getGameById(gameId);
    if (!game) return ctx.answerCbQuery('⚠️ No game found!');

    const players = db.getGamePlayers(gameId);
    await ctx.answerCbQuery(`👥 ${players.length} players`);
    await safeSend(ctx, game.chat_id, MSG.PLAYERS_LIST(players));
  });

  // ── Button: Begin ─────────────────────────────────────
  bot.action(/^lobby_begin_(\d+)$/, async (ctx) => {
    const gameId = parseInt(ctx.match[1]);
    const game = db.getGameById(gameId);
    if (!game || game.state !== GAME_STATES.LOBBY) {
      return ctx.answerCbQuery('⚠️ This lobby is no longer active!');
    }

    const count = db.getPlayerCount(gameId);
    if (count < MIN_PLAYERS) {
      await ctx.answerCbQuery(`⚠️ Need ${MIN_PLAYERS - count} more players!`);
      return safeSend(ctx, game.chat_id, MSG.NOT_ENOUGH_PLAYERS(count), { ...lobbyKeyboard(gameId) });
    }

    await ctx.answerCbQuery('🚀 Starting the match!');
    await beginGame(ctx, gameId);
  });

  // ── Slash command fallbacks (still work) ──────────────
  bot.command('join', async (ctx) => {
    if (ctx.chat.type === 'private') return;
    const game = db.getActiveGame(ctx.chat.id);
    if (!game) return safeReply(ctx, MSG.NO_ACTIVE_GAME);
    if (game.state !== GAME_STATES.LOBBY) return safeReply(ctx, MSG.GAME_NOT_IN_LOBBY);

    if (db.isPlayerInGame(game.id, ctx.from.id)) return safeReply(ctx, MSG.ALREADY_JOINED);
    const count = db.getPlayerCount(game.id);
    if (count >= MAX_PLAYERS) return safeReply(ctx, MSG.GAME_FULL);

    db.upsertUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
    const user = db.getUserByTelegramId(ctx.from.id);
    db.addPlayerToGame(game.id, user.id, ctx.from.id);
    return safeReply(ctx, MSG.PLAYER_JOINED(ctx.from.first_name, count + 1, MIN_PLAYERS), { ...lobbyKeyboard(game.id) });
  });

  bot.command('leave', async (ctx) => {
    if (ctx.chat.type === 'private') return;
    const game = db.getActiveGame(ctx.chat.id);
    if (!game) return safeReply(ctx, MSG.NO_ACTIVE_GAME);
    if (game.state !== GAME_STATES.LOBBY) return safeReply(ctx, '⚠️ Can\'t leave after the game started!');
    if (!db.isPlayerInGame(game.id, ctx.from.id)) return safeReply(ctx, MSG.NOT_IN_GAME);

    db.removePlayerFromGame(game.id, ctx.from.id);
    const count = db.getPlayerCount(game.id);
    return safeReply(ctx, MSG.PLAYER_LEFT(ctx.from.first_name, count));
  });

  bot.command('players', async (ctx) => {
    if (ctx.chat.type === 'private') return;
    const game = db.getActiveGame(ctx.chat.id);
    if (!game) return safeReply(ctx, MSG.NO_ACTIVE_GAME);
    const players = db.getGamePlayers(game.id);
    return safeReply(ctx, MSG.PLAYERS_LIST(players));
  });

  bot.command('begin', async (ctx) => {
    if (ctx.chat.type === 'private') return;
    const game = db.getActiveGame(ctx.chat.id);
    if (!game) return safeReply(ctx, MSG.NO_ACTIVE_GAME);
    if (game.state !== GAME_STATES.LOBBY) return safeReply(ctx, MSG.GAME_NOT_IN_LOBBY);
    const count = db.getPlayerCount(game.id);
    if (count < MIN_PLAYERS) return safeReply(ctx, MSG.NOT_ENOUGH_PLAYERS(count));
    await beginGame(ctx, game.id);
  });
}

// ── Helper: Create a new game ───────────────────────────
async function createNewGame(ctx) {
  const existing = db.getActiveGame(ctx.chat.id);
  if (existing && existing.state !== GAME_STATES.GAME_OVER) {
    // Force end the old one
    db.endGame(existing.id);
  }

  const gameId = db.createGame(ctx.chat.id);
  db.upsertUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
  const user = db.getUserByTelegramId(ctx.from.id);
  db.addPlayerToGame(gameId, user.id, ctx.from.id);

  await safeReply(ctx, MSG.GAME_CREATED, { ...lobbyKeyboard(gameId) });
  await safeReply(ctx, MSG.PLAYER_JOINED(ctx.from.first_name, 1, MIN_PLAYERS));
}
