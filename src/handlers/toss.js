// ============================================================
// Cricket Mafia Bot — Toss Handlers (Button-Driven)
// ============================================================
import * as db from '../database/queries.js';
import { GAME_STATES, ROLES } from '../config.js';
import { handleTossChoice } from '../game/GameManager.js';
import { safeReply } from '../utils/helpers.js';

export function registerTossHandlers(bot) {
  // ── Button: Bat ───────────────────────────────────────
  bot.action(/^toss_bat_(\d+)$/, async (ctx) => {
    const gameId = parseInt(ctx.match[1]);
    const game = db.getGameById(gameId);
    if (!game || game.state !== GAME_STATES.TOSS_CHOICE) {
      return ctx.answerCbQuery('⚠️ Toss phase is over!');
    }

    const player = db.getPlayerInGame(gameId, ctx.from.id);
    if (!player || player.role !== ROLES.CAPTAIN) {
      return ctx.answerCbQuery('⚠️ Only the Captain can choose!');
    }

    await ctx.answerCbQuery('🏏 Batting first!');
    await ctx.editMessageText('🏏 *Captain chose to BAT first!*', { parse_mode: 'Markdown' });
    await handleTossChoice(ctx, gameId, 'bat');
  });

  // ── Button: Bowl ──────────────────────────────────────
  bot.action(/^toss_bowl_(\d+)$/, async (ctx) => {
    const gameId = parseInt(ctx.match[1]);
    const game = db.getGameById(gameId);
    if (!game || game.state !== GAME_STATES.TOSS_CHOICE) {
      return ctx.answerCbQuery('⚠️ Toss phase is over!');
    }

    const player = db.getPlayerInGame(gameId, ctx.from.id);
    if (!player || player.role !== ROLES.CAPTAIN) {
      return ctx.answerCbQuery('⚠️ Only the Captain can choose!');
    }

    await ctx.answerCbQuery('🎯 Bowling first!');
    await ctx.editMessageText('🎯 *Captain chose to BOWL first!*', { parse_mode: 'Markdown' });
    await handleTossChoice(ctx, gameId, 'bowl');
  });

  // ── Slash command fallbacks ───────────────────────────
  bot.command('bat', async (ctx) => {
    if (ctx.chat.type === 'private') return;
    const game = db.getActiveGame(ctx.chat.id);
    if (!game || game.state !== GAME_STATES.TOSS_CHOICE) return;
    const player = db.getPlayerInGame(game.id, ctx.from.id);
    if (!player || player.role !== ROLES.CAPTAIN) {
      return safeReply(ctx, '⚠️ Only the Captain can choose!');
    }
    await handleTossChoice(ctx, game.id, 'bat');
  });

  bot.command('bowl', async (ctx) => {
    if (ctx.chat.type === 'private') return;
    const game = db.getActiveGame(ctx.chat.id);
    if (!game || game.state !== GAME_STATES.TOSS_CHOICE) return;
    const player = db.getPlayerInGame(game.id, ctx.from.id);
    if (!player || player.role !== ROLES.CAPTAIN) {
      return safeReply(ctx, '⚠️ Only the Captain can choose!');
    }
    await handleTossChoice(ctx, game.id, 'bowl');
  });
}
