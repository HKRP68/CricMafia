// ============================================================
// Cricket Mafia Bot — Shared Utilities
// ============================================================

/**
 * Delay execution for a given number of milliseconds.
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Shuffle an array in-place using Fisher-Yates algorithm.
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick a random element from an array.
 */
export function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Calculate run rate: runs per over.
 */
export function calculateRunRate(score, overs, balls) {
  const totalBalls = overs * 6 + balls;
  if (totalBalls === 0) return '0.00';
  return ((score / totalBalls) * 6).toFixed(2);
}

/**
 * Calculate required run rate.
 */
export function calculateRequiredRate(target, score, oversLeft, ballsLeft) {
  const totalBallsLeft = oversLeft * 6 + ballsLeft;
  if (totalBallsLeft === 0) return Infinity;
  const needed = target - score;
  return ((needed / totalBallsLeft) * 6).toFixed(2);
}

/**
 * Format over number for display (e.g., "3.2" for over 3, ball 2).
 */
export function formatOver(overs, balls) {
  return `${overs}.${balls}`;
}

/**
 * Escape Telegram MarkdownV2 special characters.
 */
export function escapeMarkdown(text) {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Safe send message — catches errors silently.
 */
export async function safeSend(ctx, chatId, text, options = {}) {
  try {
    return await ctx.telegram.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      ...options,
    });
  } catch (err) {
    console.error(`Failed to send message to ${chatId}:`, err.message);
    return null;
  }
}

/**
 * Safe reply — catches errors silently.
 */
export async function safeReply(ctx, text, options = {}) {
  try {
    return await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...options,
    });
  } catch (err) {
    console.error('Failed to reply:', err.message);
    return null;
  }
}
