// ============================================================
// Cricket Mafia Bot — Dramatic Commentary Generator
// ============================================================

const COMMENTARY = {
  SIX: [
    '💥 MASSIVE SIX! That ball has left the stadium!',
    '💥 INTO THE STANDS! What a magnificent shot!',
    '💥 SIX! The crowd goes absolutely WILD!',
    '💥 That\'s out of the ground! HUGE!',
    '💥 MAXIMUM! That\'s been dispatched to the parking lot!',
    '💥 SIX! The batsman barely broke a sweat!',
    '💥 It\'s in the second tier! COLOSSAL!',
  ],
  FOUR: [
    '🏏 FOUR! Beautifully timed through the covers!',
    '🏏 BOUNDARY! Racing to the fence!',
    '🏏 FOUR! That\'s exquisite batting!',
    '🏏 Cracking shot! Finds the gap perfectly!',
    '🏏 FOUR! The fielder had no chance!',
    '🏏 Elegantly played for FOUR!',
  ],
  WICKET: [
    '🔴 WICKET! The stumps are shattered!',
    '🔴 OUT! Big wicket that!',
    '🔴 GONE! The crowd erupts!',
    '🔴 WICKET! A crucial breakthrough!',
    '🔴 OUT! That looked suspicious... was it sabotage? 🤔',
    '🔴 DISMISSED! The batsman trudges back...',
    '🔴 WICKET! Something doesn\'t feel right about that... 👀',
  ],
  DOT: [
    '⚫ Dot ball. Well bowled!',
    '⚫ No run. Tight delivery!',
    '⚫ Dot. The batsman couldn\'t connect.',
    '⚫ Beaten! Good ball.',
    '⚫ Nothing from that delivery.',
  ],
  SINGLE: [
    '🔵 Single taken. Smart running!',
    '🔵 One run. Rotate the strike.',
    '🔵 Quick single! Good awareness.',
    '🔵 Nudged for a single.',
  ],
  DOUBLE: [
    '🔵 Two runs! Quick between the wickets!',
    '🔵 Double! Great running!',
    '🔵 Coming back for two! Excellent hustle!',
  ],
  TRIPLE: [
    '🔵 Three runs! Outstanding running!',
    '🔵 Triple! That\'s brilliant athleticism!',
  ],
};

const CROWD_REACTIONS = [
  '👥 Crowd ROARING with excitement!',
  '👥 The fans are on their feet!',
  '👥 Stadium is absolutely electric!',
  '👥 Crowd BOOOING loudly!',
  '👥 The Mexican wave goes around the ground!',
  '📺 Replays being shown on the big screen!',
  '🍿 The crowd is on the edge of their seats!',
  '🎺 Trumpets blaring in the stands!',
];

const CONTROVERSY_EVENTS = [
  '🕵️ Suspicious field placement detected...',
  '🤔 Was that a no-ball? The umpire says no...',
  '👀 The team huddle looks intense. Secrets being shared?',
  '📱 Reports of unusual betting patterns...',
  '🎭 Someone in the dressing room looks nervous...',
  '💰 The bookies are changing the odds rapidly!',
  '🤝 Was that signal from the stands? Hmm...',
  '📊 The analyst notices something strange in the data...',
];

const PRESSURE_MOMENTS = [
  '😰 The pressure is mounting!',
  '🔥 This is a crucial moment in the match!',
  '💪 Character-defining moment for the team!',
  '⚡ Electric atmosphere at the ground!',
  '🎯 Everything riding on this delivery!',
];

const RANDOM_EVENTS = [
  '🌧️ Light drizzle at the ground! Play continues...',
  '🦅 A bird flies across the pitch!',
  '🎵 The DJ plays a banger! Crowd goes wild!',
  '📸 Cameras catch a fan with a funny sign!',
  '🍕 The pizza delivery guy arrives at the stadium!',
  '🐈 A cat runs onto the field! Play stops briefly.',
  '💡 One of the floodlights flickers!',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getCommentary(result, runs) {
  if (result === 'WICKET') return pickRandom(COMMENTARY.WICKET);
  if (runs >= 6) return pickRandom(COMMENTARY.SIX);
  if (runs >= 4) return pickRandom(COMMENTARY.FOUR);
  if (runs === 3) return pickRandom(COMMENTARY.TRIPLE);
  if (runs === 2) return pickRandom(COMMENTARY.DOUBLE);
  if (runs === 1) return pickRandom(COMMENTARY.SINGLE);
  return pickRandom(COMMENTARY.DOT);
}

export function shouldTriggerEvent() {
  return Math.random() < 0.15; // 15% chance per ball
}

export function getRandomEvent() {
  const allEvents = [
    ...CROWD_REACTIONS,
    ...CONTROVERSY_EVENTS,
    ...PRESSURE_MOMENTS,
    ...RANDOM_EVENTS,
  ];
  return pickRandom(allEvents);
}

export function getControversyEvent() {
  return pickRandom(CONTROVERSY_EVENTS);
}

export function getPressureMoment() {
  return pickRandom(PRESSURE_MOMENTS);
}

export function getCrowdReaction() {
  return pickRandom(CROWD_REACTIONS);
}
