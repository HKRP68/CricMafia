// ============================================================
// Cricket Mafia Bot — Message Templates (Button-Friendly UX)
// ============================================================

export function playerName(user) {
  if (user.username) return `@${user.username}`;
  return user.first_name || 'Unknown Player';
}

export function playerMention(user) {
  const name = user.first_name || user.username || 'Player';
  const telegramId = user.telegram_id || user.tg_id;
  return `[${name}](tg://user?id=${telegramId})`;
}

export const MSG = {
  // ── Welcome (DM /start) ───────────────────────────────
  WELCOME: `
🏏 *CRICKET MAFIA* 🎭
━━━━━━━━━━━━━━━━━━━━━━

Welcome to the ultimate social deduction
cricket game on Telegram!

🔹 Add me to a *group chat*
🔹 Tap "🏏 New Game" to create a match
🔹 Friends tap "✅ Join" to enter
🔹 Minimum 6 players needed

_Who will be the hero... and who is the traitor?_

👇 *Use the buttons below to get started!*
`,

  // ── Lobby ─────────────────────────────────────────────
  GAME_CREATED: `
🏏 *CRICKET MAFIA* 🎭
━━━━━━━━━━━━━━━━━━━━━━

🆕 A new match lobby is open!

👇 *Tap the buttons below to interact:*

✅ *Join* — Enter the match
👥 *Players* — See who joined
🚀 *Begin* — Start the game (6+ needed)
❌ *Leave* — Exit before it starts

_Waiting for players..._
`,

  GAME_ALREADY_EXISTS: '⚠️ A game is already running! Wait for it to end or tap 🏏 New Game to force restart.',

  PLAYER_JOINED: (name, count, min) => {
    const needed = Math.max(0, min - count);
    const bar = '🟢'.repeat(Math.min(count, 14)) + '⚫'.repeat(Math.max(0, min - count));
    return `✅ *${name}* joined! *(${count} players)*\n${bar}\n${needed > 0 ? `⏳ _Need ${needed} more to start..._` : '🟢 _Ready to begin!_'}`;
  },
  PLAYER_LEFT: (name, count) => `👋 *${name}* left the lobby. *(${count} players)*`,
  ALREADY_JOINED: '⚠️ You\'re already in this game!',
  NOT_IN_GAME: '⚠️ You\'re not in this game.',
  NO_ACTIVE_GAME: '⚠️ No active game! Tap 🏏 *New Game* to create one.',
  NOT_ENOUGH_PLAYERS: (count) => `⚠️ Need at least *6 players* to start!\n\n👥 Currently: *${count}*\n⏳ _Need ${6 - count} more..._`,
  GAME_FULL: '⚠️ Game is full! (max 14 players)',
  GAME_NOT_IN_LOBBY: '⚠️ Game has already started!',

  PLAYERS_LIST: (players) => {
    const list = players.map((p, i) => `${i + 1}. ${playerMention(p)}`).join('\n');
    return `🏟️ *Players (${players.length}/14):*\n━━━━━━━━━━━━━━━━━━━━━━\n${list}\n\n${players.length >= 6 ? '🟢 _Ready to begin!_' : `⏳ _Need ${6 - players.length} more..._`}`;
  },

  // ── Role Assignment ───────────────────────────────────
  ROLES_ASSIGNED: `
🎭 *ROLES HAVE BEEN ASSIGNED!*
━━━━━━━━━━━━━━━━━━━━━━

📩 Check your *private messages* for your secret role!

⚠️ *Didn't get a DM?*
👉 Open a private chat with the bot first, then rejoin.

_The match begins now..._
`,

  ROLE_DM: (role, description, team) => `
🎭 *YOUR SECRET ROLE*
━━━━━━━━━━━━━━━━━━━━━━

${team === 'mafia' ? '🔴' : team === 'neutral' ? '🟡' : '🟢'} Role: *${role}*
👥 Team: *${team === 'mafia' ? 'MAFIA 🔴' : team === 'neutral' ? 'NEUTRAL 🟡' : 'TEAM CRICKET 🟢'}*

📋 *Ability:* ${description}

${team === 'mafia'
    ? '🔴 _Your goal: Sabotage the match! Make the team lose!_'
    : team === 'neutral'
      ? '🟡 _Your goal: Create maximum chaos to win!_'
      : '🟢 _Your goal: Win the match & expose the saboteurs!_'}
`,

  MAFIA_TEAMMATES: (teammates) => {
    const list = teammates.map(t => `  🔴 ${t.first_name} — *${t.role}*`).join('\n');
    return `\n👥 *Your Mafia Teammates:*\n${list}\n\n_Coordinate secretly to take down the team!_`;
  },

  // ── Toss ──────────────────────────────────────────────
  TOSS_RESULT: (captainName, won) => `
🪙 *TOSS TIME!*
━━━━━━━━━━━━━━━━━━━━━━

${won ? `🎉 Captain *${captainName}* wins the toss!` : `🎉 Captain *${captainName}*'s team wins!`}

👇 *Captain, tap your choice:*
`,

  TOSS_CHOICE: (choice) => `
🏟️ *Captain chose to ${choice.toUpperCase()} first!*
━━━━━━━━━━━━━━━━━━━━━━

${choice === 'bat'
    ? '🏏 _Time to put runs on the board!_'
    : '🎯 _Time to chase down the target!_'}

⏳ _Preparing first over..._
`,

  // ── Strategy Phase ────────────────────────────────────
  STRATEGY_PHASE: (over, score, wickets, target) => `
📊 *STRATEGY PHASE — Over ${over}*
━━━━━━━━━━━━━━━━━━━━━━
🏏 Score: *${score}/${wickets}*${target > 0 ? ` | 🎯 Target: *${target}*` : ''}

👑 *Captain, pick a strategy:*
`,

  STRATEGY_SET: (strategy) => {
    const info = {
      attack:    { emoji: '⚔️', desc: 'High risk, high reward! Go big or go home!' },
      balanced:  { emoji: '⚖️', desc: 'Steady approach. Play smart.' },
      defensive: { emoji: '🛡️', desc: 'Safety first. Protect the wickets.' },
    }[strategy];
    return `${info.emoji} Strategy: *${strategy.toUpperCase()}*\n_${info.desc}_`;
  },

  // ── Secret Actions ────────────────────────────────────
  SECRET_ACTIONS_PHASE: `
🤫 *SECRET ACTIONS*
━━━━━━━━━━━━━━━━━━━━━━

📩 Check your *DMs* — secret action buttons sent!

_Players are choosing their moves..._
⏰ *30 seconds* to decide!
`,

  BATSMAN_ACTION: `
🏏 *BATSMAN — Choose Your Shot!*
━━━━━━━━━━━━━━━━━━━━━━

Pick the right shot to score big:

🏏 *Drive* — Classic through the covers
💪 *Pull* — Aggressive cross-bat hit
🛡️ *Defense* — Safe, low risk
🚀 *Lofted* — Go aerial — big risk, big reward!

👇 *Tap your shot:*
`,

  BOWLER_ACTION: `
🎯 *BOWLER — Pick Your Delivery!*
━━━━━━━━━━━━━━━━━━━━━━

Outfox the batsman with the right ball:

🎯 *Yorker* — Aimed at the toes
💥 *Bouncer* — Short & sharp
🐌 *Slow Ball* — Change of pace
📏 *Good Length* — Reliable & probing

👇 *Tap your delivery:*
`,

  FIXER_ACTION: `
🔴 *FIXER — Sabotage Decision*
━━━━━━━━━━━━━━━━━━━━━━

⚡ Sabotage increases wicket chance
   and reduces run scoring.

⚠️ But suspicious results may expose you
   during discussion!

👇 *Will you sabotage?*
`,

  WICKETKEEPER_ACTION: `
🧤 *WICKETKEEPER — Stay Alert!*
━━━━━━━━━━━━━━━━━━━━━━

If a wicket chance comes, your reflexes
may save the day!

_Standing ready behind the stumps..._
`,

  ANALYST_ACTION: (stats) => `
📊 *ANALYST — Secret Intel*
━━━━━━━━━━━━━━━━━━━━━━

${stats}

💡 _Share this info wisely during discussion!_
_Don't reveal you're the Analyst!_
`,

  PHYSIO_ACTION: `
💊 *PHYSIO — Revive Power*
━━━━━━━━━━━━━━━━━━━━━━

You can bring back ONE eliminated player.
Use this power wisely — you only get one chance!

_Your ability is active..._
`,

  AGENT_ACTION: `
🕵️ *AGENT — Stay Hidden*
━━━━━━━━━━━━━━━━━━━━━━

You appear as *Team Cricket* if investigated.
Mislead the voters and protect the Mafia!

_Blend in, act innocent..._
`,

  BOOKIE_ACTION: `
💰 *BOOKIE — Watch Closely*
━━━━━━━━━━━━━━━━━━━━━━

You can manipulate ONE critical ball later.
Save your power for the perfect moment!

_The odds are in your favor..._
`,

  // ── Ball Simulation ───────────────────────────────────
  BALL_RESULT: (over, ball, delivery, shot, result, runs, score, wickets) => {
    const resultEmoji = {
      'SIX': '💥',
      'FOUR': '🏏',
      'WICKET': '🔴',
      'DOT': '⚫',
    }[result] || '🔵';

    return `
${resultEmoji} *Over ${over}.${ball}*
━━━━━━━━━━━━━━━━━━━━━━
${delivery} vs ${shot}

*${result}${runs > 0 && result !== 'WICKET' ? ` (+${runs} runs)` : ''}*

📊 Score: *${score}/${wickets}*
`;
  },

  // ── Scoreboard ────────────────────────────────────────
  SCOREBOARD: (score, wickets, overs, balls, target, rr) => {
    const totalBallsLeft = Math.max(0, (10 - overs) * 6 - balls);
    return `
📊 *SCOREBOARD*
━━━━━━━━━━━━━━━━━━━━━━
🏏 Score: *${score}/${wickets}*
📍 Overs: *${overs}.${balls}*
🔄 Run Rate: *${rr}*
${target > 0 ? `🎯 Target: *${target}*\n📈 Need: *${Math.max(0, target - score)}* from *${totalBallsLeft}* balls` : ''}
`;
  },

  // ── Discussion Phase ──────────────────────────────────
  DISCUSSION_PHASE: (over) => `
💬 *DISCUSSION — After Over ${over}*
━━━━━━━━━━━━━━━━━━━━━━

🕵️ Was there *sabotage* this over?
🤔 Who looks suspicious?

💡 _Analysts may have clues!_

⏰ *60 seconds* to discuss...
_Then voting begins!_
`,

  // ── Voting Phase ──────────────────────────────────────
  VOTING_PHASE: `
🗳️ *VOTING PHASE*
━━━━━━━━━━━━━━━━━━━━━━

🔍 Time to vote out a suspect!

👇 *Tap a player's name to vote:*
_Or tap ⏭️ Skip to abstain_

⏰ *45 seconds* to vote...
`,

  VOTE_CAST: (voter, target) => `🗳️ *${voter}* ➜ voted against *${target}*`,
  VOTE_SKIP: (voter) => `⏭️ *${voter}* skipped voting`,
  ALREADY_VOTED: '⚠️ You already voted this round!',

  VOTE_TALLY: (votes) => {
    if (!votes.length) return '';
    const lines = votes.map(v => `  🗳️ ${v.voter} ➜ ${v.target}`);
    return `\n📊 *Votes so far:*\n${lines.join('\n')}`;
  },

  ELIMINATION: (name, role, team) => {
    const teamEmoji = team === 'mafia' ? '🔴' : team === 'neutral' ? '🟡' : '🟢';
    return `
⚡ *PLAYER ELIMINATED!*
━━━━━━━━━━━━━━━━━━━━━━

💀 *${name}* is out!

${teamEmoji} Role: *${role}*
👥 Team: *${team === 'mafia' ? 'MAFIA 🔴' : team === 'neutral' ? 'NEUTRAL 🟡' : 'TEAM CRICKET 🟢'}*

${team === 'mafia'
    ? '🎉 _A saboteur exposed! Great detective work!_'
    : '😱 _An innocent eliminated! The mafia is winning..._'}
`;
  },

  NO_ELIMINATION: `
🕊️ *No elimination this round.*
━━━━━━━━━━━━━━━━━━━━━━
Vote was tied or everyone skipped.
_The suspects live another over..._
`,

  // ── Win Conditions ────────────────────────────────────
  TEAM_CRICKET_WINS_TARGET: (score, target) => `
🏆🏆🏆 *TEAM CRICKET WINS!* 🏆🏆🏆
━━━━━━━━━━━━━━━━━━━━━━

🏏 Score: *${score}* / Target: *${target}*

✨ The team chased down the target!
🎉 Cricket triumphs over corruption!

_Well played, champions!_
`,

  TEAM_CRICKET_WINS_MAFIA: `
🏆🏆🏆 *TEAM CRICKET WINS!* 🏆🏆🏆
━━━━━━━━━━━━━━━━━━━━━━

🕵️ All Mafia members eliminated!
🎉 The team played clean cricket!

_Justice prevails on the field!_
`,

  MAFIA_WINS_COLLAPSE: (wickets) => `
🔴🔴🔴 *MAFIA WINS!* 🔴🔴🔴
━━━━━━━━━━━━━━━━━━━━━━

💀 Team collapsed: *${wickets} wickets* down!

😈 The fixers rigged the match!
🌑 Cricket's darkest day...

_The mafia lives to fix another day..._
`,

  MAFIA_WINS_RATE: (required, ballsLeft) => `
🔴🔴🔴 *MAFIA WINS!* 🔴🔴🔴
━━━━━━━━━━━━━━━━━━━━━━

📉 Mission impossible!
Need *${required}* from *${ballsLeft}* balls.

😈 The fixers slowed it all down!

_Match fixed successfully..._
`,

  COMMENTATOR_WINS: `
🟡🟡🟡 *COMMENTATOR WINS!* 🟡🟡🟡
━━━━━━━━━━━━━━━━━━━━━━

📺 Maximum chaos achieved!
🎙️ The commentator thrives on drama!

_"What an INCREDIBLE match, folks!"_ 🎤
`,

  // ── Profile ───────────────────────────────────────────
  PROFILE: (user) => `
👤 *PLAYER PROFILE*
━━━━━━━━━━━━━━━━━━━━━━
📛 *${user.first_name || user.username}*
⭐ XP: *${user.xp}*
💰 Coins: *${user.coins}*
🎮 Games Played: *${user.games_played}*
🏆 Wins: *${user.games_won}*
📈 Win Rate: *${user.games_played > 0 ? Math.round((user.games_won / user.games_played) * 100) : 0}%*
`,

  LEADERBOARD: (users) => {
    const medals = ['🥇', '🥈', '🥉'];
    const list = users.map((u, i) => {
      const medal = medals[i] || `  ${i + 1}.`;
      return `${medal} *${u.first_name || u.username}* — ${u.xp} XP (${u.games_won}W)`;
    }).join('\n');
    return `
🏆 *LEADERBOARD — Top Players*
━━━━━━━━━━━━━━━━━━━━━━
${list || '_No players yet! Be the first to play!_'}
`;
  },

  // ── Roles Info ────────────────────────────────────────
  ROLES_INFO: `
🎭 *ROLES IN CRICKET MAFIA*
━━━━━━━━━━━━━━━━━━━━━━

🟢 *TEAM CRICKET (Good)*
  👑 *Captain* — Sets team strategy
  🏏 *Batsman* — Chooses the shot
  🎯 *Bowler* — Controls the delivery
  🧤 *Wicketkeeper* — Can save a wicket
  📊 *Analyst* — Sees hidden clues
  💊 *Physio* — Revives one player

🔴 *MAFIA (Bad)*
  🔧 *Fixer* — Sabotages outcomes
  🕵️ *Agent* — Appears innocent
  💰 *Bookie* — Manipulates results

🟡 *NEUTRAL*
  🎙️ *Commentator* — Wins via chaos

_Roles are assigned randomly!_
`,

  // ── How to Play ───────────────────────────────────────
  HOW_TO_PLAY: `
📖 *HOW TO PLAY CRICKET MAFIA*
━━━━━━━━━━━━━━━━━━━━━━

*1️⃣ Create a game* in a group chat
*2️⃣ Players join* by tapping the Join button
*3️⃣ Secret roles* are assigned via DM
*4️⃣ Each over:*
   📊 Captain sets strategy
   🤫 Players make secret moves
   🏏 Ball is simulated
   💬 Discuss who's suspicious
   🗳️ Vote to eliminate a suspect!

*🟢 Team Cricket wins by:*
   • Chasing the target score
   • Eliminating all Mafia

*🔴 Mafia wins by:*
   • Causing a batting collapse
   • Making the target impossible

_The key is deception and deduction!_
`,
};
