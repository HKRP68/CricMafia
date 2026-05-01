// ============================================================
// Cricket Mafia Bot — Match Handlers (Button-Driven)
// ============================================================
import * as db from '../database/queries.js';
import { GAME_STATES, ROLES, STRATEGIES } from '../config.js';
import { handleStrategy } from '../game/GameManager.js';
import { MSG } from '../utils/messages.js';
import { safeReply, calculateRunRate } from '../utils/helpers.js';

export function registerMatchHandlers(bot) {
  // ── Button: Strategy choices ──────────────────────────
  bot.action(/^strat_(\d+)_(attack|balanced|defensive)$/, async (ctx) => {
    const gameId = parseInt(ctx.match[1]);
    const strategy = ctx.match[2];
    const game = db.getGameById(gameId);

    if (!game || game.state !== GAME_STATES.STRATEGY) {
      return ctx.answerCbQuery('⚠️ Strategy phase is over!');
    }

    const player = db.getPlayerInGame(gameId, ctx.from.id);
    if (!player || player.role !== ROLES.CAPTAIN) {
      return ctx.answerCbQuery('⚠️ Only the Captain can set strategy!');
    }

    const emoji = { attack: '⚔️', balanced: '⚖️', defensive: '🛡️' }[strategy];
    await ctx.answerCbQuery(`${emoji} ${strategy.toUpperCase()} selected!`);
    await ctx.editMessageText(`${emoji} Strategy set: *${strategy.toUpperCase()}*`, { parse_mode: 'Markdown' });
    await handleStrategy(ctx, gameId, strategy);
  });

  // ── Button: Score ─────────────────────────────────────
  bot.action(/^show_score_(\d+)$/, async (ctx) => {
    const gameId = parseInt(ctx.match[1]);
    const game = db.getGameById(gameId);
    if (!game) return ctx.answerCbQuery('⚠️ No game found!');
    const rr = calculateRunRate(game.score, game.overs_completed, game.balls_in_over);
    await ctx.answerCbQuery(`🏏 ${game.score}/${game.wickets} (${game.overs_completed}.${game.balls_in_over})`);
  });

  // ── Slash command fallbacks ───────────────────────────
  bot.command('strategy', async (ctx) => {
    if (ctx.chat.type === 'private') return;
    const game = db.getActiveGame(ctx.chat.id);
    if (!game || game.state !== GAME_STATES.STRATEGY) {
      return safeReply(ctx, '⚠️ Not in strategy phase!');
    }
    const player = db.getPlayerInGame(game.id, ctx.from.id);
    if (!player || player.role !== ROLES.CAPTAIN) {
      return safeReply(ctx, '⚠️ Only the Captain can set strategy!');
    }
    const args = ctx.message.text.split(' ');
    const strategy = args[1]?.toLowerCase();
    if (!Object.values(STRATEGIES).includes(strategy)) {
      return safeReply(ctx, '⚠️ Use: /strategy attack | balanced | defensive');
    }
    await handleStrategy(ctx, game.id, strategy);
  });

  bot.command('score', async (ctx) => {
    if (ctx.chat.type === 'private') return;
    const game = db.getActiveGame(ctx.chat.id);
    if (!game) return safeReply(ctx, MSG.NO_ACTIVE_GAME);
    const rr = calculateRunRate(game.score, game.overs_completed, game.balls_in_over);
    return safeReply(ctx, MSG.SCOREBOARD(game.score, game.wickets, game.overs_completed, game.balls_in_over, game.target_score, rr));
  });

  bot.command('overs', async (ctx) => {
    if (ctx.chat.type === 'private') return;
    const game = db.getActiveGame(ctx.chat.id);
    if (!game) return safeReply(ctx, MSG.NO_ACTIVE_GAME);
    const rr = calculateRunRate(game.score, game.overs_completed, game.balls_in_over);
    return safeReply(ctx, `📍 *Overs:* ${game.overs_completed}.${game.balls_in_over}\n🔄 *Run Rate:* ${rr}`);
  });
}
