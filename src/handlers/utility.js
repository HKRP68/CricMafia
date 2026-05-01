// ============================================================
// Cricket Mafia Bot — Utility Handlers (Button-Driven)
// ============================================================
import * as db from '../database/queries.js';
import { MSG } from '../utils/messages.js';
import { safeReply } from '../utils/helpers.js';
import { Markup } from 'telegraf';

// ── Main Menu Buttons (DM) ─────────────────────────────
function mainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('👤 My Profile', 'menu_profile'),
     Markup.button.callback('🏆 Leaderboard', 'menu_leaderboard')],
    [Markup.button.callback('🎭 View Roles', 'menu_roles'),
     Markup.button.callback('📖 How to Play', 'menu_howtoplay')],
  ]);
}

// ── Group Quick Menu ────────────────────────────────────
function groupMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🏏 New Game', 'new_game')],
    [Markup.button.callback('👤 Profile', 'menu_profile'),
     Markup.button.callback('🏆 Leaderboard', 'menu_leaderboard')],
    [Markup.button.callback('🎭 Roles', 'menu_roles'),
     Markup.button.callback('📖 How to Play', 'menu_howtoplay')],
  ]);
}

export function registerUtilityHandlers(bot) {
  // ── /start (DM welcome with buttons) ─────────────────
  bot.command('start', async (ctx) => {
    db.upsertUser(ctx.from.id, ctx.from.username, ctx.from.first_name);

    if (ctx.chat.type === 'private') {
      return safeReply(ctx, MSG.WELCOME, { ...mainMenuKeyboard() });
    }
    return safeReply(ctx, MSG.WELCOME, { ...groupMenuKeyboard() });
  });

  // ── /help ─────────────────────────────────────────────
  bot.command('help', async (ctx) => {
    if (ctx.chat.type === 'private') {
      return safeReply(ctx, MSG.WELCOME, { ...mainMenuKeyboard() });
    }
    return safeReply(ctx, MSG.WELCOME, { ...groupMenuKeyboard() });
  });

  // ── Button: Profile ───────────────────────────────────
  bot.action('menu_profile', async (ctx) => {
    db.upsertUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
    const user = db.getUserByTelegramId(ctx.from.id);
    await ctx.answerCbQuery('👤 Your Profile');
    if (!user) return ctx.reply('⚠️ No profile found. Join a game first!');
    return ctx.reply(MSG.PROFILE(user), { parse_mode: 'Markdown' });
  });

  // ── Button: Leaderboard ───────────────────────────────
  bot.action('menu_leaderboard', async (ctx) => {
    const users = db.getLeaderboard(10);
    await ctx.answerCbQuery('🏆 Leaderboard');
    return ctx.reply(MSG.LEADERBOARD(users), { parse_mode: 'Markdown' });
  });

  // ── Button: Roles ─────────────────────────────────────
  bot.action('menu_roles', async (ctx) => {
    await ctx.answerCbQuery('🎭 Roles');
    return ctx.reply(MSG.ROLES_INFO, { parse_mode: 'Markdown' });
  });

  // ── Button: How to Play ───────────────────────────────
  bot.action('menu_howtoplay', async (ctx) => {
    await ctx.answerCbQuery('📖 Guide');
    return ctx.reply(MSG.HOW_TO_PLAY, { parse_mode: 'Markdown' });
  });

  // ── Slash fallbacks ───────────────────────────────────
  bot.command('profile', async (ctx) => {
    db.upsertUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
    const user = db.getUserByTelegramId(ctx.from.id);
    if (!user) return safeReply(ctx, '⚠️ No profile found. Join a game first!');
    return safeReply(ctx, MSG.PROFILE(user));
  });

  bot.command('leaderboard', async (ctx) => {
    const users = db.getLeaderboard(10);
    return safeReply(ctx, MSG.LEADERBOARD(users));
  });

  bot.command('stats', async (ctx) => {
    db.upsertUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
    const user = db.getUserByTelegramId(ctx.from.id);
    if (!user) return safeReply(ctx, '⚠️ No stats found.');
    return safeReply(ctx, MSG.PROFILE(user));
  });

  bot.command('roles', async (ctx) => {
    return safeReply(ctx, MSG.ROLES_INFO);
  });
}
