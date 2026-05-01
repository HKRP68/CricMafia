// ============================================================
// Cricket Mafia Bot — Voting Handlers (Button-Driven)
// ============================================================
import * as db from '../database/queries.js';
import { GAME_STATES } from '../config.js';
import { resolveVoting } from '../game/GameManager.js';
import { safeReply, safeSend } from '../utils/helpers.js';
import { MSG } from '../utils/messages.js';

export function registerVotingHandlers(bot) {
  // ── Button: Vote for a player ─────────────────────────
  bot.action(/^vote_(\d+)_(\d+)$/, async (ctx) => {
    const gameId = parseInt(ctx.match[1]);
    const targetTelegramId = parseInt(ctx.match[2]);
    const game = db.getGameById(gameId);

    if (!game || game.state !== GAME_STATES.VOTING) {
      return ctx.answerCbQuery('⚠️ Voting phase is over!');
    }

    const voter = db.getPlayerInGame(gameId, ctx.from.id);
    if (!voter || !voter.is_alive) {
      return ctx.answerCbQuery('⚠️ You can\'t vote!');
    }

    if (targetTelegramId === ctx.from.id) {
      return ctx.answerCbQuery('⚠️ You can\'t vote for yourself!');
    }

    const target = db.getPlayerInGame(gameId, targetTelegramId);
    if (!target || !target.is_alive) {
      return ctx.answerCbQuery('⚠️ Invalid target!');
    }

    db.castVote(gameId, game.overs_completed, voter.user_id, target.user_id);

    const voterName = ctx.from.first_name || ctx.from.username;
    const targetName = target.first_name || target.username;
    await ctx.answerCbQuery(`🗳️ Voted against ${targetName}`);
    await safeSend(ctx, game.chat_id, MSG.VOTE_CAST(voterName, targetName));

    // Check if all alive players have voted
    const alivePlayers = db.getAlivePlayers(gameId);
    const voteCount = db.getVoteCount(gameId, game.overs_completed);
    if (voteCount >= alivePlayers.length) {
      await resolveVoting(ctx, gameId, game.overs_completed);
    }
  });

  // ── Button: Skip vote ────────────────────────────────
  bot.action(/^vote_skip_(\d+)$/, async (ctx) => {
    const gameId = parseInt(ctx.match[1]);
    const game = db.getGameById(gameId);

    if (!game || game.state !== GAME_STATES.VOTING) {
      return ctx.answerCbQuery('⚠️ Voting phase is over!');
    }

    const voter = db.getPlayerInGame(gameId, ctx.from.id);
    if (!voter || !voter.is_alive) {
      return ctx.answerCbQuery('⚠️ You can\'t vote!');
    }

    db.castVote(gameId, game.overs_completed, voter.user_id, null, true);
    const voterName = ctx.from.first_name || ctx.from.username;
    await ctx.answerCbQuery('⏭️ Vote skipped');
    await safeSend(ctx, game.chat_id, MSG.VOTE_SKIP(voterName));

    // Check if all alive players have voted
    const alivePlayers = db.getAlivePlayers(gameId);
    const voteCount = db.getVoteCount(gameId, game.overs_completed);
    if (voteCount >= alivePlayers.length) {
      await resolveVoting(ctx, gameId, game.overs_completed);
    }
  });

  // ── Slash command fallbacks ───────────────────────────
  bot.command('vote', async (ctx) => {
    if (ctx.chat.type === 'private') return;
    const game = db.getActiveGame(ctx.chat.id);
    if (!game || game.state !== GAME_STATES.VOTING) {
      return safeReply(ctx, '⚠️ Not in voting phase! Use the buttons when voting starts.');
    }
    return safeReply(ctx, '👆 Use the *vote buttons* above to cast your vote!');
  });

  bot.command('skip', async (ctx) => {
    if (ctx.chat.type === 'private') return;
    const game = db.getActiveGame(ctx.chat.id);
    if (!game || game.state !== GAME_STATES.VOTING) {
      return safeReply(ctx, '⚠️ Not in voting phase!');
    }
    const voter = db.getPlayerInGame(game.id, ctx.from.id);
    if (!voter || !voter.is_alive) {
      return safeReply(ctx, '⚠️ You can\'t vote.');
    }
    db.castVote(game.id, game.overs_completed, voter.user_id, null, true);
    await safeReply(ctx, MSG.VOTE_SKIP(ctx.from.first_name || ctx.from.username));

    const alivePlayers = db.getAlivePlayers(game.id);
    const voteCount = db.getVoteCount(game.id, game.overs_completed);
    if (voteCount >= alivePlayers.length) {
      await resolveVoting(ctx, game.id, game.overs_completed);
    }
  });
}
