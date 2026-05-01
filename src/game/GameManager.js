// ============================================================
// Cricket Mafia Bot — Game Manager (Button-Driven State Machine)
// ============================================================
import * as db from '../database/queries.js';
import { GAME_STATES, ROLES, OVERS_PER_INNINGS, BALLS_PER_OVER, XP_REWARDS, STRATEGIES } from '../config.js';
import { assignRoles, getRoleDescription, getRoleTeam, isMafiaRole } from './RoleAssigner.js';
import { simulateBall, getRandomDelivery, getRandomShot, isAllOut, isInningsComplete, isTargetAchieved, isRunRateImpossible } from './MatchEngine.js';
import { tallyVotes, areAllMafiaEliminated, doesCommentatorWin } from './VoteManager.js';
import { setPhaseTimer, clearPhaseTimer } from './PhaseManager.js';
import { MSG, playerMention } from '../utils/messages.js';
import { safeSend, calculateRunRate, delay } from '../utils/helpers.js';
import { Markup } from 'telegraf';

// In-memory state per game
const gameState = new Map();

function getState(gameId) {
  if (!gameState.has(gameId)) {
    gameState.set(gameId, {
      batsmanShot: null,
      bowlerDelivery: null,
      fixerSabotage: false,
      wicketkeeperReady: false,
      pendingActions: new Set(),
    });
  }
  return gameState.get(gameId);
}

function clearState(gameId) {
  gameState.delete(gameId);
}

// ── TOSS ────────────────────────────────────────────────
export async function startToss(ctx, gameId) {
  const game = db.getGameById(gameId);
  const players = db.getGamePlayers(gameId);
  const captain = players.find(p => p.role === ROLES.CAPTAIN);

  db.updateGameState(gameId, GAME_STATES.TOSS_CHOICE);

  const won = Math.random() > 0.5;
  const captainName = captain ? (captain.first_name || captain.username) : 'Captain';

  // Send toss with BUTTONS
  await safeSend(ctx, game.chat_id, MSG.TOSS_RESULT(captainName, won), {
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🏏 Bat First', `toss_bat_${gameId}`),
       Markup.button.callback('🎯 Bowl First', `toss_bowl_${gameId}`)],
    ]),
  });

  setPhaseTimer(gameId, GAME_STATES.TOSS_CHOICE, async () => {
    await handleTossChoice(ctx, gameId, 'bat');
  });
}

export async function handleTossChoice(ctx, gameId, choice) {
  clearPhaseTimer(gameId);
  const game = db.getGameById(gameId);

  await safeSend(ctx, game.chat_id, MSG.TOSS_CHOICE(choice));

  if (choice === 'bat') {
    db.updateGameTarget(gameId, 0);
  } else {
    const oppScore = 80 + Math.floor(Math.random() * 80);
    db.updateGameTarget(gameId, oppScore + 1);
    await safeSend(ctx, game.chat_id,
      `🏟️ *Opposition scored ${oppScore} runs!*\n🎯 Target: *${oppScore + 1}*\n\n_Your turn to chase!_`);
  }

  await delay(2000);
  await startStrategyPhase(ctx, gameId);
}

// ── STRATEGY PHASE ──────────────────────────────────────
export async function startStrategyPhase(ctx, gameId) {
  const game = db.getGameById(gameId);
  db.updateGameState(gameId, GAME_STATES.STRATEGY);
  db.resetActionsForBall(gameId);

  const state = getState(gameId);
  state.batsmanShot = null;
  state.bowlerDelivery = null;
  state.fixerSabotage = false;
  state.wicketkeeperReady = false;
  state.pendingActions = new Set();

  const overNum = game.overs_completed + 1;

  // Send strategy with BUTTONS
  await safeSend(ctx, game.chat_id,
    MSG.STRATEGY_PHASE(overNum, game.score, game.wickets, game.target_score), {
    ...Markup.inlineKeyboard([
      [Markup.button.callback('⚔️ Attack', `strat_${gameId}_attack`)],
      [Markup.button.callback('⚖️ Balanced', `strat_${gameId}_balanced`)],
      [Markup.button.callback('🛡️ Defensive', `strat_${gameId}_defensive`)],
    ]),
  });

  setPhaseTimer(gameId, GAME_STATES.STRATEGY, async () => {
    db.updateGameStrategy(gameId, STRATEGIES.BALANCED);
    await safeSend(ctx, game.chat_id, '⚖️ Strategy auto-set to *BALANCED*');
    await startSecretActions(ctx, gameId);
  });
}

export async function handleStrategy(ctx, gameId, strategy) {
  clearPhaseTimer(gameId);
  const game = db.getGameById(gameId);
  db.updateGameStrategy(gameId, strategy);
  await safeSend(ctx, game.chat_id, MSG.STRATEGY_SET(strategy));
  await delay(1000);
  await startSecretActions(ctx, gameId);
}

// ── SECRET ACTIONS PHASE ────────────────────────────────
export async function startSecretActions(ctx, gameId) {
  const game = db.getGameById(gameId);
  db.updateGameState(gameId, GAME_STATES.SECRET_ACTIONS);

  await safeSend(ctx, game.chat_id, MSG.SECRET_ACTIONS_PHASE);

  const players = db.getAlivePlayers(gameId);
  const state = getState(gameId);
  state.pendingActions = new Set();

  for (const player of players) {
    try {
      if (player.role === ROLES.BATSMAN) {
        state.pendingActions.add(player.telegram_id);
        await ctx.telegram.sendMessage(player.telegram_id, MSG.BATSMAN_ACTION, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🏏 Drive', `action_${gameId}_Drive`),
             Markup.button.callback('💪 Pull', `action_${gameId}_Pull`)],
            [Markup.button.callback('🛡️ Defense', `action_${gameId}_Defense`),
             Markup.button.callback('🚀 Lofted', `action_${gameId}_Lofted`)],
          ]),
        });
      } else if (player.role === ROLES.BOWLER) {
        state.pendingActions.add(player.telegram_id);
        await ctx.telegram.sendMessage(player.telegram_id, MSG.BOWLER_ACTION, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🎯 Yorker', `action_${gameId}_Yorker`),
             Markup.button.callback('💥 Bouncer', `action_${gameId}_Bouncer`)],
            [Markup.button.callback('🐌 Slow Ball', `action_${gameId}_Slow Ball`),
             Markup.button.callback('📏 Good Length', `action_${gameId}_Good Length`)],
          ]),
        });
      } else if (player.role === ROLES.FIXER) {
        state.pendingActions.add(player.telegram_id);
        await ctx.telegram.sendMessage(player.telegram_id, MSG.FIXER_ACTION, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔴 SABOTAGE!', `action_${gameId}_sabotage_yes`)],
            [Markup.button.callback('✅ Play Clean', `action_${gameId}_sabotage_no`)],
          ]),
        });
      } else if (player.role === ROLES.ANALYST) {
        const mafiaCount = players.filter(p => isMafiaRole(p.role)).length;
        const sabInfo = game.current_over_sabotaged ? '🔴 Yes — suspicious activity detected!' : '🟢 Unknown';
        const stats = `🔴 Mafia alive: *~${mafiaCount}*\n📊 Last over sabotaged: ${sabInfo}`;
        await ctx.telegram.sendMessage(player.telegram_id, MSG.ANALYST_ACTION(stats), { parse_mode: 'Markdown' });
      } else if (player.role === ROLES.WICKETKEEPER) {
        await ctx.telegram.sendMessage(player.telegram_id, MSG.WICKETKEEPER_ACTION, { parse_mode: 'Markdown' });
      } else if (player.role === ROLES.PHYSIO) {
        await ctx.telegram.sendMessage(player.telegram_id, MSG.PHYSIO_ACTION, { parse_mode: 'Markdown' });
      } else if (player.role === ROLES.AGENT) {
        await ctx.telegram.sendMessage(player.telegram_id, MSG.AGENT_ACTION, { parse_mode: 'Markdown' });
      } else if (player.role === ROLES.BOOKIE) {
        await ctx.telegram.sendMessage(player.telegram_id, MSG.BOOKIE_ACTION, { parse_mode: 'Markdown' });
      } else if (player.role === ROLES.COMMENTATOR) {
        await ctx.telegram.sendMessage(player.telegram_id,
          '🎙️ *COMMENTATOR* — Watch the chaos unfold!\n_The more drama, the closer you are to winning!_',
          { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error(`Failed to DM player ${player.telegram_id}:`, err.message);
      state.pendingActions.delete(player.telegram_id);
    }
  }

  setPhaseTimer(gameId, GAME_STATES.SECRET_ACTIONS, async () => {
    await resolveSecretActions(ctx, gameId);
  });
}

export function handleSecretAction(gameId, telegramId, action) {
  const state = getState(gameId);

  if (action.startsWith('sabotage_')) {
    state.fixerSabotage = action === 'sabotage_yes';
  } else if (['Drive', 'Pull', 'Defense', 'Lofted'].includes(action)) {
    state.batsmanShot = action;
  } else if (['Yorker', 'Bouncer', 'Slow Ball', 'Good Length'].includes(action)) {
    state.bowlerDelivery = action;
  }

  state.pendingActions.delete(telegramId);
  return state.pendingActions.size === 0;
}

export async function resolveSecretActions(ctx, gameId) {
  clearPhaseTimer(gameId);
  await simulateOver(ctx, gameId);
}

// ── BALL/OVER SIMULATION ────────────────────────────────
async function simulateOver(ctx, gameId) {
  const game = db.getGameById(gameId);
  db.updateGameState(gameId, GAME_STATES.BALL_SIMULATION);

  const state = getState(gameId);
  const shot = state.batsmanShot || getRandomShot();
  const delivery = state.bowlerDelivery || getRandomDelivery();
  const sabotaged = state.fixerSabotage;
  const strategy = game.current_strategy;

  let score = game.score;
  let wickets = game.wickets;
  let overs = game.overs_completed;
  let balls = game.balls_in_over;

  const ballsToPlay = BALLS_PER_OVER - balls;

  for (let i = 0; i < ballsToPlay; i++) {
    balls++;

    const ballShot = i === 0 ? shot : getRandomShot();
    const ballDelivery = i === 0 ? delivery : getRandomDelivery();
    const ballSabotaged = i === 0 ? sabotaged : false;

    const result = simulateBall(ballDelivery, ballShot, strategy, ballSabotaged);

    if (result.isWicket) {
      wickets++;
    } else {
      score += result.runs;
    }

    const ballMsg = MSG.BALL_RESULT(
      overs + 1, balls, ballDelivery, ballShot,
      result.result, result.runs, score, wickets
    );
    await safeSend(ctx, game.chat_id, `${ballMsg}\n${result.commentary}`);

    if (result.event) {
      await delay(800);
      await safeSend(ctx, game.chat_id, result.event);
    }

    if (ballSabotaged) {
      db.updateGameSabotage(gameId, true);
    }

    db.updateGameScore(gameId, score, wickets);
    db.updateGameOvers(gameId, overs, balls);

    if (isAllOut(wickets)) {
      await handleGameEnd(ctx, gameId, 'collapse');
      return;
    }
    if (game.target_score > 0 && isTargetAchieved(score, game.target_score)) {
      await handleGameEnd(ctx, gameId, 'target');
      return;
    }

    if (balls >= BALLS_PER_OVER) break;
    await delay(1500);
  }

  overs++;
  balls = 0;
  db.updateGameOvers(gameId, overs, 0);

  if (isInningsComplete(overs, balls, wickets)) {
    if (game.target_score > 0) {
      await handleGameEnd(ctx, gameId, 'rate');
    } else {
      db.updateGameTarget(gameId, score + 1);
      db.updateGameScore(gameId, 0, 0);
      db.updateGameOvers(gameId, 0, 0);
      await safeSend(ctx, game.chat_id,
        `📊 *First Innings Complete!*\n🏏 Score: *${score}*\n\n🎯 Target: *${score + 1}*\n\n_Starting 2nd innings..._`);
      await delay(3000);
      await startStrategyPhase(ctx, gameId);
      return;
    }
    return;
  }

  if (game.target_score > 0) {
    const oversLeft = OVERS_PER_INNINGS - overs;
    if (isRunRateImpossible(game.target_score, score, oversLeft, 0)) {
      await handleGameEnd(ctx, gameId, 'rate');
      return;
    }
  }

  const rr = calculateRunRate(score, overs, 0);
  await safeSend(ctx, game.chat_id, MSG.SCOREBOARD(score, wickets, overs, 0, game.target_score, rr));

  await delay(2000);
  await startDiscussionPhase(ctx, gameId, overs);
}

// ── DISCUSSION PHASE ────────────────────────────────────
async function startDiscussionPhase(ctx, gameId, overNum) {
  const game = db.getGameById(gameId);
  db.updateGameState(gameId, GAME_STATES.DISCUSSION);
  db.updateGameSabotage(gameId, false);

  await safeSend(ctx, game.chat_id, MSG.DISCUSSION_PHASE(overNum));

  setPhaseTimer(gameId, GAME_STATES.DISCUSSION, async () => {
    await startVotingPhase(ctx, gameId, overNum);
  });
}

// ── VOTING PHASE (with player buttons) ──────────────────
async function startVotingPhase(ctx, gameId, overNum) {
  const game = db.getGameById(gameId);
  db.updateGameState(gameId, GAME_STATES.VOTING);

  const alivePlayers = db.getAlivePlayers(gameId);

  // Build vote buttons — each alive player is a button!
  const playerButtons = [];
  for (let i = 0; i < alivePlayers.length; i += 2) {
    const row = [
      Markup.button.callback(
        `🗳️ ${alivePlayers[i].first_name || alivePlayers[i].username}`,
        `vote_${gameId}_${alivePlayers[i].telegram_id}`
      ),
    ];
    if (alivePlayers[i + 1]) {
      row.push(Markup.button.callback(
        `🗳️ ${alivePlayers[i + 1].first_name || alivePlayers[i + 1].username}`,
        `vote_${gameId}_${alivePlayers[i + 1].telegram_id}`
      ));
    }
    playerButtons.push(row);
  }
  // Add skip button
  playerButtons.push([Markup.button.callback('⏭️ Skip Vote', `vote_skip_${gameId}`)]);

  await safeSend(ctx, game.chat_id, MSG.VOTING_PHASE, {
    ...Markup.inlineKeyboard(playerButtons),
  });

  setPhaseTimer(gameId, GAME_STATES.VOTING, async () => {
    await resolveVoting(ctx, gameId, overNum);
  });
}

export async function resolveVoting(ctx, gameId, overNum) {
  clearPhaseTimer(gameId);
  const game = db.getGameById(gameId);

  const result = tallyVotes(gameId, overNum);

  if (result) {
    await safeSend(ctx, game.chat_id, MSG.ELIMINATION(
      result.player.first_name || result.player.username,
      result.role,
      result.team
    ));

    if (result.isMafia) {
      const voters = db.getVotesForOver(gameId, overNum);
      for (const vote of voters) {
        if (vote.target_id === result.player.user_id) {
          db.addXp(vote.voter_id, XP_REWARDS.CORRECT_VOTE);
        }
      }
    }

    if (areAllMafiaEliminated(gameId)) {
      await handleGameEnd(ctx, gameId, 'mafia_eliminated');
      return;
    }
  } else {
    await safeSend(ctx, game.chat_id, MSG.NO_ELIMINATION);
  }

  if (doesCommentatorWin(gameId)) {
    await handleGameEnd(ctx, gameId, 'commentator');
    return;
  }

  await delay(2000);
  await startStrategyPhase(ctx, gameId);
}

// ── GAME END ────────────────────────────────────────────
async function handleGameEnd(ctx, gameId, reason) {
  clearPhaseTimer(gameId);
  const game = db.getGameById(gameId);
  const players = db.getGamePlayers(gameId);

  db.endGame(gameId);
  clearState(gameId);

  let message = '';

  switch (reason) {
    case 'target':
      message = MSG.TEAM_CRICKET_WINS_TARGET(game.score, game.target_score);
      for (const p of players) {
        db.incrementGamesPlayed(p.telegram_id);
        if (!isMafiaRole(p.role) && p.role !== ROLES.COMMENTATOR) {
          db.incrementGamesWon(p.telegram_id);
          db.addXp(p.telegram_id, XP_REWARDS.GAME_WON);
        }
        db.addXp(p.telegram_id, XP_REWARDS.GAME_PLAYED);
      }
      break;

    case 'mafia_eliminated':
      message = MSG.TEAM_CRICKET_WINS_MAFIA;
      for (const p of players) {
        db.incrementGamesPlayed(p.telegram_id);
        if (!isMafiaRole(p.role) && p.role !== ROLES.COMMENTATOR) {
          db.incrementGamesWon(p.telegram_id);
          db.addXp(p.telegram_id, XP_REWARDS.GAME_WON);
        }
        db.addXp(p.telegram_id, XP_REWARDS.GAME_PLAYED);
      }
      break;

    case 'collapse':
      message = MSG.MAFIA_WINS_COLLAPSE(game.wickets);
      for (const p of players) {
        db.incrementGamesPlayed(p.telegram_id);
        if (isMafiaRole(p.role)) {
          db.incrementGamesWon(p.telegram_id);
          db.addXp(p.telegram_id, XP_REWARDS.GAME_WON);
        }
        db.addXp(p.telegram_id, XP_REWARDS.GAME_PLAYED);
      }
      break;

    case 'rate': {
      const oversLeft = OVERS_PER_INNINGS - game.overs_completed;
      const ballsLeft = oversLeft * 6;
      const needed = game.target_score - game.score;
      message = MSG.MAFIA_WINS_RATE(needed, ballsLeft);
      for (const p of players) {
        db.incrementGamesPlayed(p.telegram_id);
        if (isMafiaRole(p.role)) {
          db.incrementGamesWon(p.telegram_id);
          db.addXp(p.telegram_id, XP_REWARDS.GAME_WON);
        }
        db.addXp(p.telegram_id, XP_REWARDS.GAME_PLAYED);
      }
      break;
    }

    case 'commentator':
      message = MSG.COMMENTATOR_WINS;
      for (const p of players) {
        db.incrementGamesPlayed(p.telegram_id);
        if (p.role === ROLES.COMMENTATOR) {
          db.incrementGamesWon(p.telegram_id);
          db.addXp(p.telegram_id, XP_REWARDS.GAME_WON);
        }
        db.addXp(p.telegram_id, XP_REWARDS.GAME_PLAYED);
      }
      break;
  }

  // Role reveal
  const roleReveal = players.map(p => {
    const team = getRoleTeam(p.role);
    const emoji = team === 'mafia' ? '🔴' : team === 'neutral' ? '🟡' : '🟢';
    const status = p.is_eliminated ? '💀' : '✅';
    return `${status} ${emoji} *${p.first_name || p.username}* — ${p.role}`;
  }).join('\n');

  await safeSend(ctx, game.chat_id, message);
  await delay(1000);
  await safeSend(ctx, game.chat_id,
    `\n🎭 *ROLE REVEAL*\n━━━━━━━━━━━━━━━━━━━━━━\n${roleReveal}`, {
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🏏 Play Again!', 'new_game')],
      [Markup.button.callback('🏆 Leaderboard', 'menu_leaderboard')],
    ]),
  });
}

// ── ROLE ASSIGNMENT & GAME START ────────────────────────
export async function beginGame(ctx, gameId) {
  const game = db.getGameById(gameId);
  const players = db.getGamePlayers(gameId);

  const playersWithRoles = assignRoles(players);

  for (const p of playersWithRoles) {
    db.assignRole(p.id, p.role);
  }

  await safeSend(ctx, game.chat_id, MSG.ROLES_ASSIGNED);

  const mafiaPlayers = playersWithRoles.filter(p => isMafiaRole(p.role));

  for (const p of playersWithRoles) {
    const team = getRoleTeam(p.role);
    const desc = getRoleDescription(p.role);

    try {
      let msg = MSG.ROLE_DM(p.role, desc, team);

      if (isMafiaRole(p.role) && mafiaPlayers.length > 1) {
        const teammates = mafiaPlayers.filter(m => m.telegram_id !== p.telegram_id);
        msg += MSG.MAFIA_TEAMMATES(teammates);
      }

      await ctx.telegram.sendMessage(p.telegram_id, msg, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(`Could not DM ${p.first_name} (${p.telegram_id}):`, err.message);
      await safeSend(ctx, game.chat_id,
        `⚠️ Couldn't DM *${p.first_name}*!\n👉 They need to open a chat with the bot first.`);
    }
  }

  await delay(3000);
  await startToss(ctx, gameId);
}
