// ============================================================
// Cricket Mafia Bot — Secret Action Handlers (DM callbacks)
// ============================================================
import * as db from '../database/queries.js';
import { GAME_STATES } from '../config.js';
import { handleSecretAction, resolveSecretActions } from '../game/GameManager.js';

export function registerActionHandlers(bot) {
  // Handle inline keyboard callbacks for secret actions
  bot.action(/^action_(\d+)_(.+)$/, async (ctx) => {
    const gameId = parseInt(ctx.match[1]);
    const action = ctx.match[2];
    const telegramId = ctx.from.id;

    const game = db.getGameById(gameId);
    if (!game || game.state !== GAME_STATES.SECRET_ACTIONS) {
      return ctx.answerCbQuery('⚠️ Action phase has ended!');
    }

    // Record the action
    const allDone = handleSecretAction(gameId, telegramId, action);

    // Acknowledge
    let ackMsg = '✅ Action recorded!';
    if (action === 'sabotage_yes') ackMsg = '🔴 Sabotage activated!';
    if (action === 'sabotage_no') ackMsg = '✅ Playing clean this ball.';

    await ctx.answerCbQuery(ackMsg);
    await ctx.editMessageText(`✅ *Action recorded:* ${action}`, { parse_mode: 'Markdown' });

    // If all actions received, resolve immediately
    if (allDone) {
      await resolveSecretActions(ctx, gameId);
    }
  });
}
