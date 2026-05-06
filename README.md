# 🏏 Cricket Mafia — Telegram Bot 🎭

A **social deduction cricket game** for Telegram groups! Combines Mafia-style hidden roles with cricket strategy simulation. Players work together to win a cricket match while hidden saboteurs try to make the team lose.

## ✨ Features

- 🎭 **10 unique roles** — Captain, Batsman, Bowler, Fixer, Agent, Bookie & more
- 🏏 **Cricket simulation** — Real shot vs delivery mechanics
- 🗳️ **Button-driven UX** — No typing needed, just tap buttons!
- 📊 **Live scoreboard** — Track runs, wickets & run rate
- 💬 **Discussion + voting** — Find the saboteurs!
- 🏆 **XP & leaderboard** — Track stats across games
- 📺 **Dramatic commentary** — Random events, crowd reactions, controversies!

## 🚀 Quick Deploy (Free-Friendly Options)

### Step 1: Create a Telegram Bot
1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name (e.g., `Cricket Mafia`)
4. Choose a username (e.g., `cricket_mafia_game_bot`)
5. **Copy the token** — you'll need it!

### Step 2: Push to GitHub
1. Create a new GitHub repo
2. Upload all files from this `cricket-mafia-bot` folder
3. Or use git:
```bash
cd cricket-mafia-bot
git init
git add .
git commit -m "Cricket Mafia Bot"
git remote add origin https://github.com/YOUR_USERNAME/cricket-mafia-bot.git
git push -u origin main
```

### Step 3: Choose a Hosting Option

Render Background Worker is often paid now, so here are better free-friendly choices for long-running bots:

#### Option A (Recommended): Koyeb Free Web Service
1. Go to [koyeb.com](https://www.koyeb.com/)
2. Create a **Web Service** from your GitHub repo
3. Configure:
   - **Build Command:** `npm install`
   - **Run Command:** `node src/index.js`
4. Add environment variable:
   - `BOT_TOKEN=your_bot_token`
5. Deploy

#### Option B: Railway / Northflank Free Trial Credits
1. Create a new service from this repo
2. Set start command to `node src/index.js`
3. Add `BOT_TOKEN`
4. Deploy

#### Option C: Always-Free VPS (Most Reliable)
Use an always-free VM (for example Oracle Cloud free tier), then run:

```bash
npm install
node src/index.js
```

For production reliability on a VM, run with `pm2` so the bot auto-restarts.

> ℹ️ This bot uses **long-polling**, so it should run as a continuously running process.

### Step 4: Start Playing!
1. Add the bot to a Telegram group
2. Each player must first DM the bot (send `/start`)
3. In the group, send `/startgame` or tap the "🏏 New Game" button

## 🎮 How to Play

### In the Group Chat:
1. Someone creates a game → others tap **✅ Join**
2. When 6+ players join → tap **🚀 Begin Match!**
3. Roles are secretly assigned via DM
4. Each over:
   - 📊 Captain picks strategy (buttons)
   - 🤫 Players get secret action buttons in DM
   - 🏏 Ball is simulated with commentary
   - 💬 60 seconds to discuss suspicions
   - 🗳️ Vote buttons appear — tap to eliminate!

### Win Conditions:
| Team | How to Win |
|------|-----------|
| 🟢 Team Cricket | Chase the target OR eliminate all Mafia |
| 🔴 Mafia | Cause batting collapse OR make target impossible |
| 🟡 Commentator | Enough chaos happens in the match |

## 🎭 Roles

### 🟢 Team Cricket (Good Side)
| Role | Ability |
|------|---------|
| 👑 Captain | Sets team strategy each over |
| 🏏 Batsman | Chooses shot via DM buttons |
| 🎯 Bowler | Chooses delivery via DM buttons |
| 🧤 Wicketkeeper | Can save a wicket |
| 📊 Analyst | Sees hidden stats & sabotage hints |
| 💊 Physio | Can revive one eliminated player |

### 🔴 Mafia (Bad Side)
| Role | Ability |
|------|---------|
| 🔧 Fixer | Sabotages match outcomes via button |
| 🕵️ Agent | Appears innocent when investigated |
| 💰 Bookie | Can manipulate critical outcomes |

### 🟡 Neutral
| Role | Ability |
|------|---------|
| 🎙️ Commentator | Wins if maximum chaos happens |

## 📱 Bot Commands
All commands also work as **inline buttons** — no typing needed!

| Command | Description |
|---------|-------------|
| `/start` | Welcome menu with buttons |
| `/startgame` | Create new game |
| `/join` | Join current game |
| `/begin` | Start match (6+ players) |
| `/score` | View scoreboard |
| `/profile` | Your stats |
| `/leaderboard` | Top players |
| `/roles` | View all roles |
| `/help` | How to play |

## 🛠️ Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/cricket-mafia-bot.git
cd cricket-mafia-bot

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your BOT_TOKEN

# Run the bot
npm start

# Or with auto-restart on changes
npm run dev
```

## 📁 Project Structure
```
cricket-mafia-bot/
├── package.json
├── render.yaml          ← Render deployment config
├── .env.example
├── src/
│   ├── index.js         ← Entry point
│   ├── config.js        ← Game constants & settings
│   ├── database/
│   │   ├── init.js      ← SQLite schema
│   │   └── queries.js   ← All DB operations
│   ├── game/
│   │   ├── GameManager.js   ← Core state machine
│   │   ├── RoleAssigner.js  ← Role distribution
│   │   ├── MatchEngine.js   ← Cricket simulation
│   │   ├── VoteManager.js   ← Vote tallying
│   │   └── PhaseManager.js  ← Timer management
│   ├── handlers/
│   │   ├── lobby.js     ← Join/Leave/Begin buttons
│   │   ├── toss.js      ← Bat/Bowl buttons
│   │   ├── match.js     ← Strategy buttons
│   │   ├── actions.js   ← DM action callbacks
│   │   ├── voting.js    ← Vote player buttons
│   │   └── utility.js   ← Menu buttons
│   └── utils/
│       ├── messages.js  ← All bot messages
│       ├── commentary.js← Dramatic commentary
│       └── helpers.js   ← Shared utilities
└── data/
    └── cricket-mafia.db ← SQLite (auto-created)
```

## ⚙️ Configuration
Edit `src/config.js` to customize:
- Timer durations (strategy, discussion, voting phases)
- Min/max players
- Match engine outcome probabilities
- XP rewards

## 📄 License
MIT
