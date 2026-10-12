/* ==========================================================================
   Code Quest: Java Adventure - Core Game Logic & Engine
   Interactive Java learning game
   ========================================================================== */

// ==========================================================================
// SECTION 1: GAME STATE
// ==========================================================================
const GameState = {
  currentScreen: 'home',
  playerName: 'Cadet',
  gameMode: 'practice', // 'practice' or 'competition'
  currentLevel: 0,
  activeLevel: null,
  layoutCount: 0,
  score: 0,
  totalStars: 0,
  completedLevels: new Set(),
  achievements: {},
  level6UsedRepeat: false,
  level6RepeatExecuted: false,
  isRunning: false,
  isPaused: false,
  isMuted: false,
  competitionTimer: null,
  competitionTimeLimit: 180, // seconds
  competitionTimeRemaining: 0,
  competitionStarted: false,
  competitionEnded: false,
  hintsUsed: {},
  levelScores: {},
  sessionId: 'CQ-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
  startTime: null,
  currentLevelStartTime: null,
  currentInstructions: [],
  speedrunLevelsCleared: 0,
  speedrunClearedLevels: new Set(),
  speedrunStartTs: 0
};

const PROGRESS_STORAGE_KEY = 'codequest_player_progress';

function savePlayerProgress() {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
      playerName: GameState.playerName,
      score: GameState.score,
      totalStars: GameState.totalStars,
      completedLevels: [...GameState.completedLevels],
      achievements: GameState.achievements,
      level6UsedRepeat: GameState.level6UsedRepeat,
      levelScores: GameState.levelScores
    }));
  } catch (err) {
    console.warn('Could not save cadet progress.', err);
  }
}

function loadPlayerProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return;
    GameState.playerName = saved.playerName || GameState.playerName;
    GameState.score = Math.max(0, Number(saved.score) || 0);
    GameState.totalStars = Math.max(0, Number(saved.totalStars) || 0);
    GameState.completedLevels = new Set((saved.completedLevels || []).filter(id => Number.isInteger(id) && id >= 1 && id <= LEVELS.length));
    GameState.achievements = saved.achievements && typeof saved.achievements === 'object' ? saved.achievements : {};
    GameState.level6UsedRepeat = !!saved.level6UsedRepeat;
    GameState.levelScores = saved.levelScores && typeof saved.levelScores === 'object' ? saved.levelScores : {};
  } catch (err) {
    console.warn('Could not load saved cadet progress.', err);
  }
}

function getCurrentLevel() {
  return GameState.activeLevel || LEVELS[GameState.currentLevel];
}

// ==========================================================================
// SECTION 2: LEVEL DEFINITIONS (12 Complete, Polished Levels)
// ==========================================================================
// Cell types: 0=floor, 1=wall, 2=star, 3=gap, 4=exit
const LEVELS = [
  // --- WORLD 1: FIRST STEPS ---
  {
    id: 1,
    world: 1,
    worldName: 'First Steps',
    name: 'Hello, Boti!',
    description: 'Guide Boti straight to the exit marker to initiate basic telemetry.',
    gridSize: { rows: 5, cols: 5 },
    grid: [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 2, 0, 4],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1]
    ],
    startPos: { row: 2, col: 1 },
    startDir: 'right',
    exitPos: { row: 2, col: 4 },
    stars: [{ row: 2, col: 2 }],
    availableActions: ['MOVE'],
    optimalInstructions: 3,
    maxInstructions: 6,
    hints: ['Click MOVE three times to step past the star directly onto the finish flag.'],
    prefilledInstructions: null,
    javaLesson: {
      concept: 'Sequential Execution',
      explanation: 'Java statements execute sequentially from top to bottom, one after another.',
      realLifeExample: 'Like following a cake recipe in exact numerical order.'
    }
  },
  {
    id: 2,
    world: 1,
    worldName: 'First Steps',
    name: 'Star Path',
    description: 'A longer corridor filled with energy stars. Collect them all!',
    gridSize: { rows: 5, cols: 6 },
    grid: [
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 0, 2, 0, 2, 4],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1]
    ],
    startPos: { row: 2, col: 1 },
    startDir: 'right',
    exitPos: { row: 2, col: 5 },
    stars: [{ row: 2, col: 2 }, { row: 2, col: 4 }],
    availableActions: ['MOVE'],
    optimalInstructions: 4,
    maxInstructions: 8,
    hints: ['Stack consecutive MOVE commands. Boti will automatically capture any star stepped on.'],
    prefilledInstructions: null,
    javaLesson: {
      concept: 'Multi-statement Sequences',
      explanation: 'In Java, programs are constructed by chaining multiple method calls semicolon by semicolon.',
      realLifeExample: 'Like walking 4 continuous paces forward down a university hall.'
    }
  },

  // --- WORLD 2: TURN & EXPLORE ---
  {
    id: 3,
    world: 2,
    worldName: 'Turn & Explore',
    name: 'The L-Turn',
    description: 'The path bends! Teach Boti how to rotate its chassis.',
    gridSize: { rows: 5, cols: 5 },
    grid: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 2, 1],
      [1, 1, 1, 0, 1],
      [1, 1, 1, 4, 1],
      [1, 1, 1, 1, 1]
    ],
    startPos: { row: 1, col: 1 },
    startDir: 'right',
    exitPos: { row: 3, col: 3 },
    stars: [{ row: 1, col: 3 }],
    availableActions: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT'],
    optimalInstructions: 5,
    maxInstructions: 10,
    hints: ['Walk forward twice to the star, execute a right turn, then advance to the exit.'],
    prefilledInstructions: null,
    javaLesson: {
      concept: 'Method Invocation',
      explanation: 'Calling turnRight() alters the internal orientation state of our robot object.',
      realLifeExample: 'Turning steering on a vehicle to change driving direction.'
    }
  },
  {
    id: 4,
    world: 2,
    worldName: 'Turn & Explore',
    name: 'The U-Bend',
    description: 'Navigate around an obstacle barrier shaped like a U.',
    gridSize: { rows: 6, cols: 5 },
    grid: [
      [1, 1, 1, 1, 1],
      [1, 0, 1, 4, 1],
      [1, 2, 1, 0, 1],
      [1, 0, 2, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1]
    ],
    startPos: { row: 1, col: 1 },
    startDir: 'down',
    exitPos: { row: 1, col: 3 },
    stars: [{ row: 2, col: 1 }, { row: 3, col: 2 }],
    availableActions: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT'],
    optimalInstructions: 8,
    maxInstructions: 14,
    hints: ['Move down past the star, turn left to cross the bottom channel, then turn left again and march up.'],
    prefilledInstructions: null,
    javaLesson: {
      concept: 'Object State Tracking',
      explanation: 'An object preserves state across operations. Boti retains current heading direction until instructed otherwise.',
      realLifeExample: 'A smartphone retaining its compass bearing as you rotate.'
    }
  },
  {
    id: 5,
    world: 2,
    worldName: 'Turn & Explore',
    name: 'Zigzag',
    description: 'Traverse an intricate winding passage collecting three power nodes.',
    gridSize: { rows: 6, cols: 7 },
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 2, 1, 1, 1],
      [1, 1, 1, 0, 1, 1, 1],
      [1, 1, 1, 2, 0, 0, 1],
      [1, 1, 1, 1, 1, 2, 4],
      [1, 1, 1, 1, 1, 1, 1]
    ],
    startPos: { row: 1, col: 1 },
    startDir: 'right',
    exitPos: { row: 4, col: 6 },
    stars: [{ row: 1, col: 3 }, { row: 3, col: 3 }, { row: 4, col: 5 }],
    availableActions: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT'],
    optimalInstructions: 11,
    maxInstructions: 18,
    hints: ['Alternate turning right and left as you descend along the zigzag steps.'],
    prefilledInstructions: null,
    javaLesson: {
      concept: 'Complex Program Flows',
      explanation: 'Real-world software blends multiple sequential routines to navigate complex scenarios.',
      realLifeExample: 'Navigating stairs and turns in a university campus building.'
    }
  },

  // --- WORLD 3: REPEAT TO WIN ---
  {
    id: 6,
    world: 3,
    worldName: 'Repeat to Win',
    name: 'The Long Corridor',
    description: 'An elongated hall. Avoid writing repetitive code using a for loop!',
    gridSize: { rows: 3, cols: 9 },
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 2, 0, 2, 0, 2, 0, 4],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    startPos: { row: 1, col: 1 },
    startDir: 'right',
    exitPos: { row: 1, col: 8 },
    stars: [{ row: 1, col: 2 }, { row: 1, col: 4 }, { row: 1, col: 6 }],
    availableActions: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'REPEAT'],
    optimalInstructions: 1, // 1 block containing move repeated 7 times
    maxInstructions: 10,
    hints: ['Click REPEAT, set the count to 7, and add a MOVE action inside!'],
    prefilledInstructions: null,
    javaLesson: {
      concept: 'For Loops (Iteration)',
      explanation: '`for (int i = 0; i < n; i++)` runs the block body n times without repeating lines of code (DRY principle).',
      realLifeExample: 'Setting a timer to do 10 pushups automatically.'
    }
  },
  {
    id: 7,
    world: 3,
    worldName: 'Repeat to Win',
    name: 'Square Dance',
    description: 'Patrol a 4-sided circuit collecting corner energy crystals.',
    gridSize: { rows: 7, cols: 7 },
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 2, 1, 1],
      [1, 0, 1, 1, 0, 1, 1],
      [1, 2, 1, 1, 0, 1, 1],
      [1, 0, 0, 2, 0, 1, 1],
      [1, 1, 1, 1, 4, 1, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ],
    startPos: { row: 1, col: 1 },
    startDir: 'right',
    exitPos: { row: 5, col: 4 },
    stars: [{ row: 1, col: 4 }, { row: 4, col: 3 }, { row: 3, col: 1 }],
    availableActions: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'REPEAT'],
    optimalInstructions: 2,
    maxInstructions: 12,
    hints: ['Notice each corner follows the pattern: Move forward 3 times, then Turn Right!'],
    prefilledInstructions: null,
    javaLesson: {
      concept: 'Compound Loop Bodies',
      explanation: 'Inside a loop block, you can place several distinct operations that execute together during each iteration.',
      realLifeExample: 'A workout routine repeating (Pushup, Rest) 5 sets.'
    }
  },
  {
    id: 8,
    world: 3,
    worldName: 'Repeat to Win',
    name: 'Spiral In',
    description: 'Spiral inward through shrinking boundaries toward the core exit.',
    gridSize: { rows: 7, cols: 7 },
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 2, 1],
      [1, 1, 1, 1, 1, 0, 1],
      [1, 2, 0, 4, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 2, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ],
    startPos: { row: 1, col: 1 },
    startDir: 'right',
    exitPos: { row: 3, col: 3 },
    stars: [{ row: 1, col: 5 }, { row: 5, col: 4 }, { row: 3, col: 1 }],
    availableActions: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'REPEAT'],
    optimalInstructions: 7,
    maxInstructions: 16,
    hints: ['Combine loops for long outer edges with individual turns to spiral into the center.'],
    prefilledInstructions: null,
    javaLesson: {
      concept: 'Iterative Algorithm Composition',
      explanation: 'Combining loops with sequential adjustments is how path-finding algorithms operate.',
      realLifeExample: 'Winding an electric cable spool progressively toward the hub.'
    }
  },

  // --- WORLD 4: THINK BEFORE MOVING ---
  {
    id: 9,
    world: 4,
    worldName: 'Think Before Moving',
    name: 'Which Way?',
    description: 'A split corridor where one path might be blocked. Inspect before moving!',
    gridSize: { rows: 6, cols: 6 },
    grid: [
      [1, 1, 1, 1, 1, 1],
      [1, 0, 0, 1, 1, 1],
      [1, 1, 0, 2, 0, 1],
      [1, 1, 1, 1, 2, 1],
      [1, 1, 1, 1, 4, 1],
      [1, 1, 1, 1, 1, 1]
    ],
    startPos: { row: 1, col: 1 },
    startDir: 'right',
    exitPos: { row: 4, col: 4 },
    stars: [{ row: 2, col: 3 }, { row: 3, col: 4 }],
    availableActions: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_PATH_CLEAR'],
    optimalInstructions: 6,
    maxInstructions: 12,
    hints: ['Check if the path ahead is clear. If clear, move; otherwise make a turn.'],
    prefilledInstructions: null,
    javaLesson: {
      concept: 'Conditional Branches (if-statements)',
      explanation: '`if (isPathClear())` evaluates a boolean expression to decide whether to run guarded code.',
      realLifeExample: 'Checking if a traffic light is green before pressing the accelerator.'
    }
  },
  {
    id: 10,
    world: 4,
    worldName: 'Think Before Moving',
    name: 'Maze Runner',
    description: 'Traverse an intricate branching maze by blending loops with conditionals.',
    gridSize: { rows: 7, cols: 7 },
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 2, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 2, 1],
      [1, 1, 1, 0, 1, 0, 1],
      [1, 2, 0, 0, 0, 4, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ],
    startPos: { row: 1, col: 1 },
    startDir: 'down',
    exitPos: { row: 5, col: 5 },
    stars: [{ row: 1, col: 3 }, { row: 3, col: 5 }, { row: 5, col: 1 }],
    availableActions: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'REPEAT', 'IF_PATH_CLEAR'],
    optimalInstructions: 8,
    maxInstructions: 20,
    hints: ['Break down the route: navigate down to row 3, turn right to column 3, then down and across.'],
    prefilledInstructions: null,
    javaLesson: {
      concept: 'Conditionals in Loops',
      explanation: 'Combining decision branches inside repetition structures lets programs handle dynamic problem spaces.',
      realLifeExample: 'A vacuum robot checking for wall collisions while traversing a room.'
    }
  },

  // --- WORLD 5: DEBUG THE PROGRAM ---
  {
    id: 11,
    world: 5,
    worldName: 'Debug the Program',
    name: 'Bug Hunt',
    description: 'A cadet left erroneous instructions! Identify and correct the bug in the queue.',
    gridSize: { rows: 5, cols: 5 },
    grid: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 2, 1],
      [1, 1, 1, 0, 1],
      [1, 1, 1, 4, 1],
      [1, 1, 1, 1, 1]
    ],
    startPos: { row: 1, col: 1 },
    startDir: 'right',
    exitPos: { row: 3, col: 3 },
    stars: [{ row: 1, col: 3 }],
    availableActions: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT'],
    optimalInstructions: 5,
    maxInstructions: 10,
    hints: ['Notice step 3! Boti turns left into a wall instead of turning right.'],
    // Pre-filled buggy program: has TURN_LEFT instead of TURN_RIGHT
    prefilledInstructions: [
      { action: 'MOVE' },
      { action: 'MOVE' },
      { action: 'TURN_LEFT' }, // The Bug!
      { action: 'MOVE' },
      { action: 'MOVE' }
    ],
    javaLesson: {
      concept: 'Software Debugging',
      explanation: 'Debugging is the systematic process of finding and resolving logical defects in existing code.',
      realLifeExample: 'Proofreading an essay or locating a typo in a mathematical calculation.'
    }
  },
  {
    id: 12,
    world: 5,
    worldName: 'Debug the Program',
    name: 'Final Debug',
    description: 'The master diagnostic challenge! Correct the flawed repeat count and path commands.',
    gridSize: { rows: 6, cols: 6 },
    grid: [
      [1, 1, 1, 1, 1, 1],
      [1, 0, 2, 0, 0, 1],
      [1, 1, 1, 1, 2, 1],
      [1, 1, 1, 1, 0, 1],
      [1, 4, 2, 0, 0, 1],
      [1, 1, 1, 1, 1, 1]
    ],
    startPos: { row: 1, col: 1 },
    startDir: 'right',
    exitPos: { row: 4, col: 1 },
    stars: [{ row: 1, col: 2 }, { row: 2, col: 4 }, { row: 4, col: 2 }],
    availableActions: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'REPEAT'],
    optimalInstructions: 8,
    maxInstructions: 18,
    hints: ['Check the repeat loop counter (it only moves 1 tile instead of 3), then verify turn directions.'],
    // Pre-filled buggy program: wrong repeat count and wrong turn
    prefilledInstructions: [
      { action: 'REPEAT', count: 1, subActions: [{ action: 'MOVE' }] }, // Bug 1: count is 1, should be 3
      { action: 'TURN_LEFT' }, // Bug 2: should be TURN_RIGHT
      { action: 'MOVE' },
      { action: 'MOVE' },
      { action: 'TURN_RIGHT' },
      { action: 'MOVE' },
      { action: 'MOVE' },
      { action: 'MOVE' }
    ],
    javaLesson: {
      concept: 'Off-by-One Errors & Logic Verification',
      explanation: 'Loop boundary errors (off-by-one) are among the most common bugs in computer science.',
      realLifeExample: 'Setting an alarm for 7:00 PM instead of 7:00 AM.'
    }
  }
];

// ==========================================================================
// SECTION 3: SOUND SYSTEM (Web Audio API Synthesizer)
// ==========================================================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type, duration, startTimeOffset = 0, gainLevel = 0.15) {
  if (GameState.isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTimeOffset);

    gain.gain.setValueAtTime(gainLevel, ctx.currentTime + startTimeOffset);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTimeOffset + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTimeOffset);
    osc.stop(ctx.currentTime + startTimeOffset + duration);
  } catch (e) {
    console.warn('Audio playback error', e);
  }
}

const SoundSystem = {
  playMoveSound() {
    playTone(320, 'sine', 0.08, 0, 0.12);
  },
  playTurnSound() {
    playTone(480, 'triangle', 0.09, 0, 0.14);
  },
  playStarSound() {
    playTone(587.33, 'sine', 0.12, 0, 0.2); // D5
    playTone(880, 'sine', 0.25, 0.08, 0.25); // A5
  },
  playLevelCompleteSound() {
    playTone(440, 'triangle', 0.12, 0, 0.25);     // A4
    playTone(554.37, 'triangle', 0.12, 0.1, 0.25); // C#5
    playTone(659.25, 'triangle', 0.15, 0.2, 0.25); // E5
    playTone(880, 'triangle', 0.45, 0.32, 0.3);   // A5
  },
  playErrorSound() {
    playTone(220, 'sawtooth', 0.15, 0, 0.2);
    playTone(180, 'sawtooth', 0.25, 0.12, 0.25);
  },
  playClickSound() {
    playTone(600, 'sine', 0.04, 0, 0.08);
  },
  playAchievementSound() {
    playTone(523.25, 'sine', 0.1, 0, 0.2);
    playTone(659.25, 'sine', 0.1, 0.1, 0.2);
    playTone(783.99, 'sine', 0.12, 0.2, 0.25);
    playTone(1046.50, 'sine', 0.35, 0.3, 0.3);
  }
};

// ==========================================================================
// SECTION 4 & 5: GRID RENDERING & ROBOT LOGIC
// ==========================================================================
const Robot = {
  row: 0,
  col: 0,
  dir: 'right', // 'right', 'down', 'left', 'up'
  starsCollected: 0,
  collectedStarsMap: new Set(),

  reset(level) {
    this.row = level.startPos.row;
    this.col = level.startPos.col;
    this.dir = level.startDir;
    this.starsCollected = 0;
    this.collectedStarsMap.clear();
    this.updateDomPosition();
    this.updateStatsDisplay();
  },

  getFacingDelta() {
    switch (this.dir) {
      case 'right': return { dr: 0, dc: 1 };
      case 'left': return { dr: 0, dc: -1 };
      case 'down': return { dr: 1, dc: 0 };
      case 'up': return { dr: -1, dc: 0 };
      default: return { dr: 0, dc: 0 };
    }
  },

  canMove(level) {
    const { dr, dc } = this.getFacingDelta();
    const nr = this.row + dr;
    const nc = this.col + dc;

    if (nr < 0 || nr >= level.gridSize.rows || nc < 0 || nc >= level.gridSize.cols) {
      return false;
    }
    const tileType = level.grid[nr][nc];
    // 1=wall, 3=gap (not passable by standard move)
    return tileType !== 1 && tileType !== 3;
  },

  move(level) {
    if (!this.canMove(level)) {
      SoundSystem.playErrorSound();
      showToast('Crash! Wall or boundary blocked Boti.', 'error');
      return false;
    }
    const { dr, dc } = this.getFacingDelta();
    this.row += dr;
    this.col += dc;
    SoundSystem.playMoveSound();

    this.checkStarCollection(level);
    this.updateDomPosition();
    return true;
  },

  turnLeft() {
    const directions = ['up', 'left', 'down', 'right'];
    const idx = directions.indexOf(this.dir);
    this.dir = directions[(idx + 1) % 4];
    SoundSystem.playTurnSound();
    this.updateDomPosition();
  },

  turnRight() {
    const directions = ['up', 'right', 'down', 'left'];
    const idx = directions.indexOf(this.dir);
    this.dir = directions[(idx + 1) % 4];
    SoundSystem.playTurnSound();
    this.updateDomPosition();
  },

  checkStarCollection(level) {
    const starKey = `${this.row},${this.col}`;
    const isLevelStar = level.stars.some(s => s.row === this.row && s.col === this.col);
    if (isLevelStar && !this.collectedStarsMap.has(starKey)) {
      this.collectedStarsMap.add(starKey);
      this.starsCollected++;
      SoundSystem.playStarSound();

      // Update tile UI
      const starEl = document.querySelector(`.grid-tile[data-row="${this.row}"][data-col="${this.col}"] .star-item`);
      if (starEl) {
        starEl.style.transition = 'all 0.3s ease';
        starEl.style.transform = 'scale(1.8)';
        starEl.style.opacity = '0';
      }
      this.updateStatsDisplay();
    }
  },

  isOnExit(level) {
    return this.row === level.exitPos.row && this.col === level.exitPos.col;
  },

  getRotationDeg() {
    switch (this.dir) {
      case 'right': return 90;
      case 'down': return 180;
      case 'left': return 270;
      case 'up': return 0;
      default: return 90;
    }
  },

  updateDomPosition() {
    const robotSprite = document.getElementById('boti-robot-sprite');
    if (!robotSprite) return;

    const gridEl = document.getElementById('game-grid');
    const tileSize = parseFloat(gridEl && gridEl.style.getPropertyValue('--grid-tile-size')) || 58;
    const gridStyles = gridEl ? window.getComputedStyle(gridEl) : null;
    const gapSize = parseFloat(gridStyles && gridStyles.columnGap) || 4;
    const boardPadding = parseFloat(gridStyles && gridStyles.paddingLeft) || 8;

    const leftPx = boardPadding + this.col * (tileSize + gapSize);
    const topPx = boardPadding + this.row * (tileSize + gapSize);

    robotSprite.style.left = `${leftPx}px`;
    robotSprite.style.top = `${topPx}px`;

    const avatar = robotSprite.querySelector('.boti-grid-avatar');
    if (avatar) {
      avatar.style.transform = `rotate(${this.getRotationDeg()}deg)`;
    }
  },

  updateStatsDisplay() {
    const curLevel = getCurrentLevel();
    const starsEl = document.getElementById('game-stars-count');
    if (starsEl && curLevel) {
      starsEl.textContent = `${this.starsCollected} / ${curLevel.stars.length}`;
    }
    const scoreEl = document.getElementById('game-score-count');
    if (scoreEl) {
      scoreEl.textContent = GameState.score;
    }
  }
};

function renderGrid(level) {
  const gridEl = document.getElementById('game-grid');
  gridEl.innerHTML = '';
  updateGridTileSizing(level);

  for (let r = 0; r < level.gridSize.rows; r++) {
    for (let c = 0; c < level.gridSize.cols; c++) {
      const tile = document.createElement('div');
      tile.className = 'grid-tile';
      tile.dataset.row = r;
      tile.dataset.col = c;

      const type = level.grid[r][c];
      const isExit = level.exitPos.row === r && level.exitPos.col === c;
      const isStar = level.stars.some(s => s.row === r && s.col === c);

      if (isExit) {
        tile.classList.add('tile-exit');
      } else if (isStar) {
        tile.classList.add('tile-star');
        const star = document.createElement('div');
        star.className = 'star-item';
        star.textContent = '★';
        tile.appendChild(star);
      } else if (type === 1) {
        tile.classList.add('tile-wall');
      } else if (type === 3) {
        tile.classList.add('tile-gap');
      } else {
        tile.classList.add('tile-floor');
      }

      gridEl.appendChild(tile);
    }
  }

  // Inject robot sprite
  const sprite = document.createElement('div');
  sprite.id = 'boti-robot-sprite';
  sprite.className = 'robot-sprite';
  sprite.innerHTML = `
    <div class="boti-grid-avatar">
      <div class="direction-pointer"></div>
      <div class="robot-face">
        <div class="robot-eye"></div>
        <div class="robot-eye"></div>
      </div>
    </div>
  `;
  gridEl.appendChild(sprite);

  Robot.reset(level);
}

function updateGridTileSizing(level = getCurrentLevel()) {
  const gridEl = document.getElementById('game-grid');
  if (!gridEl || !level) return;
  const rows = level.gridSize.rows;
  const cols = level.gridSize.cols;
  const container = gridEl.parentElement;
  const containerStyles = container ? window.getComputedStyle(container) : null;
  const gridStyles = window.getComputedStyle(gridEl);
  const containerWidth = container && container.clientWidth
    ? container.clientWidth - parseFloat(containerStyles.paddingLeft) - parseFloat(containerStyles.paddingRight)
    : window.innerWidth - 40;
  const boardPadding = (parseFloat(gridStyles.paddingLeft) || 8) * 2 + 2;
  const gridGap = parseFloat(gridStyles.columnGap) || 4;
  const availableWidth = containerWidth - boardPadding - (cols - 1) * gridGap;
  const containerHeight = window.innerWidth > 1200 && container && container.clientHeight
    ? container.clientHeight - parseFloat(containerStyles.paddingTop) - parseFloat(containerStyles.paddingBottom)
    : Infinity;
  const availableHeight = containerHeight - boardPadding - (rows - 1) * gridGap;
  const tileSize = Math.max(14, Math.min(58, Math.floor(Math.min(availableWidth / cols, availableHeight / rows))));
  gridEl.style.setProperty('--grid-tile-size', `${tileSize}px`);
  gridEl.style.gridTemplateColumns = `repeat(${cols}, var(--grid-tile-size))`;
  gridEl.style.gridTemplateRows = `repeat(${level.gridSize.rows}, var(--grid-tile-size))`;
}

// ==========================================================================
// SECTION 6: ACTION PALETTE & PROGRAM INSTRUCTION SYSTEM
// ==========================================================================
let activeModalType = 'REPEAT'; // 'REPEAT' or 'IF_PATH_CLEAR'
let modalCounterVal = 3;
let modalNestedActions = [];

function renderActionPalette(level) {
  const paletteEl = document.getElementById('action-palette');
  paletteEl.innerHTML = '';

  level.availableActions.forEach(action => {
    const card = document.createElement('button');
    card.className = 'action-card';
    card.dataset.action = action;

    let icon = '➔';
    let label = action;

    if (action === 'MOVE') { icon = '➔'; label = 'Move Forward'; }
    if (action === 'TURN_LEFT') { icon = '↶'; label = 'Turn Left'; }
    if (action === 'TURN_RIGHT') { icon = '↷'; label = 'Turn Right'; }
    if (action === 'REPEAT') { icon = '🔄'; label = 'Repeat Loop...'; }
    if (action === 'IF_PATH_CLEAR') { icon = '❓'; label = 'If Path Clear...'; }

    card.innerHTML = `<span>${icon}</span> <span>${label}</span>`;
    card.addEventListener('click', () => onActionPaletteClicked(action));
    paletteEl.appendChild(card);
  });
}

function onActionPaletteClicked(action) {
  if (GameState.isRunning) return;
  const curLevel = getCurrentLevel();
  if (GameState.currentInstructions.length >= curLevel.maxInstructions) {
    showToast(`Instruction cap reached (${curLevel.maxInstructions} max)!`, 'warning');
    return;
  }

  SoundSystem.playClickSound();

  if (action === 'REPEAT' || action === 'IF_PATH_CLEAR') {
    openNestedBuilderModal(action);
  } else {
    GameState.currentInstructions.push({ action });
    updateProgramUI();
    updateJavaCodePreview();
  }
}

function openNestedBuilderModal(type) {
  activeModalType = type;
  modalCounterVal = 3;
  modalNestedActions = [{ action: 'MOVE' }];

  const modal = document.getElementById('builder-modal');
  const title = document.getElementById('builder-modal-title');
  const countGroup = document.getElementById('builder-count-group');
  const condGroup = document.getElementById('builder-condition-group');

  if (type === 'REPEAT') {
    title.textContent = 'Configure Repeat Loop';
    countGroup.style.display = 'flex';
    condGroup.style.display = 'none';
    document.getElementById('counter-val').textContent = modalCounterVal;
  } else {
    title.textContent = 'Configure Conditional (If Clear)';
    countGroup.style.display = 'none';
    condGroup.style.display = 'flex';
  }

  renderModalNestedList();
  modal.classList.add('active');
}

function closeNestedBuilderModal() {
  document.getElementById('builder-modal').classList.remove('active');
}

function renderModalNestedList() {
  const container = document.getElementById('builder-nested-list');
  container.innerHTML = '';
  if (modalNestedActions.length === 0) {
    container.innerHTML = '<span style="color:var(--text-muted); font-size:0.8rem; font-style:italic;">No nested commands yet. Add some above!</span>';
    return;
  }

  modalNestedActions.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'instruction-item';
    row.innerHTML = `
      <div class="instruction-content">
        <span class="instruction-index">${idx + 1}.</span>
        <span class="instruction-name">${formatActionName(item.action)}</span>
      </div>
      <button class="instruction-delete" data-idx="${idx}">&times;</button>
    `;
    row.querySelector('.instruction-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      modalNestedActions.splice(idx, 1);
      renderModalNestedList();
    });
    container.appendChild(row);
  });
}

function formatActionName(action) {
  switch (action) {
    case 'MOVE': return 'move();';
    case 'TURN_LEFT': return 'turnLeft();';
    case 'TURN_RIGHT': return 'turnRight();';
    default: return action;
  }
}

function updateProgramUI() {
  const container = document.getElementById('instruction-list');
  const limitLabel = document.getElementById('instruction-count');
  const curLevel = getCurrentLevel();

  limitLabel.textContent = `${GameState.currentInstructions.length} / ${curLevel.maxInstructions}`;

  if (GameState.currentInstructions.length === 0) {
    container.innerHTML = `
      <div class="instruction-empty">
        <span>No instructions queued yet</span>
        <span>Select action cards above to program Boti</span>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  GameState.currentInstructions.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'instruction-item';
    el.dataset.index = idx;

    if (item.action === 'REPEAT') {
      el.innerHTML = `
        <div class="instruction-nested-container">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="instruction-content">
              <span class="instruction-index">${idx + 1}.</span>
              <span class="instruction-name" style="color:var(--accent-yellow);">REPEAT (${item.count}x)</span>
            </div>
            <button class="instruction-delete" data-idx="${idx}">&times;</button>
          </div>
          <div class="nested-item-list">
            ${(item.subActions || []).map(sa => `<div style="font-family:'Fira Code'; font-size:0.8rem; color:var(--text-secondary);">↳ ${formatActionName(sa.action)}</div>`).join('')}
          </div>
        </div>
      `;
    } else if (item.action === 'IF_PATH_CLEAR') {
      el.innerHTML = `
        <div class="instruction-nested-container">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="instruction-content">
              <span class="instruction-index">${idx + 1}.</span>
              <span class="instruction-name" style="color:var(--accent-green);">IF_PATH_CLEAR</span>
            </div>
            <button class="instruction-delete" data-idx="${idx}">&times;</button>
          </div>
          <div class="nested-item-list">
            ${(item.subActions || []).map(sa => `<div style="font-family:'Fira Code'; font-size:0.8rem; color:var(--text-secondary);">↳ ${formatActionName(sa.action)}</div>`).join('')}
          </div>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="instruction-content">
          <span class="instruction-index">${idx + 1}.</span>
          <span class="instruction-name">${formatActionName(item.action)}</span>
        </div>
        <button class="instruction-delete" data-idx="${idx}">&times;</button>
      `;
    }

    el.querySelector('.instruction-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (GameState.isRunning) return;
      deleteInstruction(idx);
    });

    container.appendChild(el);
  });
}

function deleteInstruction(index) {
  SoundSystem.playClickSound();
  GameState.currentInstructions.splice(index, 1);
  updateProgramUI();
  updateJavaCodePreview();
}

function undoLastInstruction() {
  if (GameState.isRunning || GameState.currentInstructions.length === 0) return;
  SoundSystem.playClickSound();
  GameState.currentInstructions.pop();
  updateProgramUI();
  updateJavaCodePreview();
}

function clearInstructions() {
  if (GameState.isRunning) return;
  SoundSystem.playClickSound();
  GameState.currentInstructions = [];
  updateProgramUI();
  updateJavaCodePreview();
}

// ==========================================================================
// SECTION 7: EXECUTION ENGINE
// ==========================================================================
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function highlightInstruction(index) {
  document.querySelectorAll('.instruction-item').forEach(el => el.classList.remove('active-step'));
  const target = document.querySelector(`.instruction-item[data-index="${index}"]`);
  if (target) {
    target.classList.add('active-step');
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function clearInstructionHighlight() {
  document.querySelectorAll('.instruction-item').forEach(el => el.classList.remove('active-step'));
}

async function executeInstruction(inst, level) {
  if (inst.action === 'MOVE') {
    return Robot.move(level);
  } else if (inst.action === 'TURN_LEFT') {
    Robot.turnLeft();
    return true;
  } else if (inst.action === 'TURN_RIGHT') {
    Robot.turnRight();
    return true;
  } else if (inst.action === 'REPEAT') {
    if (level.id === 6) GameState.level6RepeatExecuted = true;
    const times = inst.count || 2;
    for (let c = 0; c < times && GameState.isRunning; c++) {
      for (const sub of (inst.subActions || [])) {
        if (!GameState.isRunning) break;
        const ok = await executeInstruction(sub, level);
        await delay(350);
        if (!ok || Robot.isOnExit(level)) return ok;
      }
    }
    return true;
  } else if (inst.action === 'IF_PATH_CLEAR') {
    if (Robot.canMove(level)) {
      for (const sub of (inst.subActions || [])) {
        if (!GameState.isRunning) break;
        const ok = await executeInstruction(sub, level);
        await delay(350);
        if (!ok || Robot.isOnExit(level)) return ok;
      }
    }
    return true;
  }
  return true;
}

async function executeProgram() {
  if (GameState.isRunning) return;
  const level = getCurrentLevel();

  if (GameState.currentInstructions.length === 0) {
    showToast('Add some action cards before running!', 'warning');
    return;
  }

  // Reset to initial state before executing run
  Robot.reset(level);
  GameState.level6RepeatExecuted = false;
  await delay(200);

  GameState.isRunning = true;
  setControlsDisabled(true);

  let stepCounter = 0;
  const maxSafeSteps = 200;

  for (let i = 0; i < GameState.currentInstructions.length && GameState.isRunning; i++) {
    highlightInstruction(i);
    const inst = GameState.currentInstructions[i];
    const ok = await executeInstruction(inst, level);
    stepCounter++;

    if (stepCounter >= maxSafeSteps) {
      showToast('Maximum execution steps exceeded!', 'error');
      break;
    }

    await delay(380);

    if (Robot.isOnExit(level)) {
      clearInstructionHighlight();
      handleLevelComplete();
      GameState.isRunning = false;
      setControlsDisabled(false);
      return;
    }

    if (!ok) {
      // Robot hit an obstacle or wall
      break;
    }
  }

  clearInstructionHighlight();
  GameState.isRunning = false;
  setControlsDisabled(false);

  if (!Robot.isOnExit(level)) {
    SoundSystem.playErrorSound();
    showToast("Boti didn't reach the exit! Check your sequence and try again.", 'warning');
  }
}

function setControlsDisabled(disabled) {
  const ids = ['btn-run-code', 'btn-clear-code', 'btn-undo-code', 'btn-hint'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  });
  document.querySelectorAll('.action-palette .action-card').forEach(btn => {
    btn.disabled = disabled;
  });
}

// ==========================================================================
// SECTION 8 & 9: JAVA CODE PREVIEW & EXPLANATION PANEL
// ==========================================================================
function updateJavaCodePreview() {
  const codeEl = document.getElementById('java-code-output');
  if (!codeEl) return;

  if (GameState.currentInstructions.length === 0) {
    codeEl.innerHTML = '<span class="syn-cmt">// Click cards to construct your Java program</span>';
    return;
  }

  let lines = [];
  lines.push('<span class="syn-cmt">// Boti Navigation Routine</span>');
  lines.push('<span class="syn-kw">public void</span> <span class="syn-fn">runMission</span>() <span class="syn-brace">{</span>');

  function renderInstToJava(inst, indent) {
    const ind = '    '.repeat(indent);
    if (inst.action === 'MOVE') {
      return `${ind}<span class="syn-fn">boti</span>.<span class="syn-fn">move</span>();`;
    }
    if (inst.action === 'TURN_LEFT') {
      return `${ind}<span class="syn-fn">boti</span>.<span class="syn-fn">turnLeft</span>();`;
    }
    if (inst.action === 'TURN_RIGHT') {
      return `${ind}<span class="syn-fn">boti</span>.<span class="syn-fn">turnRight</span>();`;
    }
    if (inst.action === 'REPEAT') {
      let subLines = (inst.subActions || []).map(s => renderInstToJava(s, indent + 1)).join('\n');
      return `${ind}<span class="syn-kw">for</span> (<span class="syn-kw">int</span> i = <span class="syn-num">0</span>; i &lt; <span class="syn-num">${inst.count}</span>; i++) <span class="syn-brace">{</span>\n${subLines}\n${ind}<span class="syn-brace">}</span>`;
    }
    if (inst.action === 'IF_PATH_CLEAR') {
      let subLines = (inst.subActions || []).map(s => renderInstToJava(s, indent + 1)).join('\n');
      return `${ind}<span class="syn-kw">if</span> (<span class="syn-fn">boti</span>.<span class="syn-fn">isPathClear</span>()) <span class="syn-brace">{</span>\n${subLines}\n${ind}<span class="syn-brace">}</span>`;
    }
    return '';
  }

  GameState.currentInstructions.forEach(inst => {
    lines.push(renderInstToJava(inst, 1));
  });

  lines.push('<span class="syn-brace">}</span>');
  codeEl.innerHTML = lines.join('\n');
}

function updateExplanationPanel(level) {
  const conceptEl = document.getElementById('lesson-concept');
  const expEl = document.getElementById('lesson-explanation');
  const analogyEl = document.getElementById('lesson-analogy');

  if (level.javaLesson) {
    conceptEl.textContent = level.javaLesson.concept;
    expEl.textContent = level.javaLesson.explanation;
    analogyEl.textContent = `💡 Real-Life: ${level.javaLesson.realLifeExample}`;
  }
}

// ==========================================================================
// SECTION 10: SCORING SYSTEM & LEVEL COMPLETION
// ==========================================================================
function calculateLevelScore(level, starsCollected, instructionsUsed, timeTakenSec, usedHint) {
  let score = 0;
  let breakdown = {
    base: 100,
    stars: starsCollected * 25,
    efficiency: 0,
    hintBonus: usedHint ? 0 : 20,
    speedBonus: 0,
    total: 0
  };

  score += breakdown.base;
  score += breakdown.stars;

  // Efficiency ratio compared to optimal instructions
  const ratio = level.optimalInstructions / Math.max(1, instructionsUsed);
  breakdown.efficiency = Math.floor(Math.min(ratio, 1) * 50);
  score += breakdown.efficiency;

  score += breakdown.hintBonus;

  if (GameState.gameMode === 'competition') {
    breakdown.speedBonus = Math.max(0, 50 - Math.floor(timeTakenSec / 2));
    score += breakdown.speedBonus;
  }

  breakdown.total = score;
  return breakdown;
}

function handleLevelComplete() {
  const level = getCurrentLevel();
  SoundSystem.playLevelCompleteSound();
  launchConfetti();

  const timeTaken = GameState.currentLevelStartTime ? Math.round((Date.now() - GameState.currentLevelStartTime) / 1000) : 10;
  const usedHint = !!GameState.hintsUsed[level.id];
  const starsCollected = Robot.starsCollected;
  const breakdown = calculateLevelScore(level, starsCollected, GameState.currentInstructions.length, timeTaken, usedHint);

  const isFirstClear = !GameState.completedLevels.has(level.id);
  if (level.id === 6 && GameState.level6RepeatExecuted) {
    GameState.level6UsedRepeat = true;
  }
  if (isFirstClear) {
    GameState.completedLevels.add(level.id);
    GameState.score += breakdown.total;
    GameState.totalStars += starsCollected;
    GameState.levelScores[level.id] = breakdown.total;
    savePlayerProgress();
  }

  // Count distinct levels so replaying the same level cannot unlock Speedster.
  if (!GameState.speedrunClearedLevels.has(level.id)) {
    GameState.speedrunClearedLevels.add(level.id);
    GameState.speedrunLevelsCleared = GameState.speedrunClearedLevels.size;
  }
  checkAchievements();

  // Populate results screen
  document.getElementById('score-base').textContent = `+${breakdown.base}`;
  document.getElementById('score-stars').textContent = `+${breakdown.stars} (${starsCollected}★)`;
  document.getElementById('score-efficiency').textContent = `+${breakdown.efficiency}`;
  document.getElementById('score-hint').textContent = `+${breakdown.hintBonus}`;

  const speedRow = document.getElementById('row-speed-bonus');
  if (GameState.gameMode === 'competition') {
    speedRow.style.display = 'flex';
    document.getElementById('score-speed').textContent = `+${breakdown.speedBonus}`;
  } else {
    speedRow.style.display = 'none';
  }

  document.getElementById('score-total').textContent = `+${breakdown.total}`;
  document.getElementById('results-stars').textContent = '⭐'.repeat(Math.max(1, starsCollected)) || '⭐';

  setTimeout(() => {
    showScreen('results-screen');
  }, 700);
}

// ==========================================================================
// SECTION 11: ACHIEVEMENTS SYSTEM
// ==========================================================================
const ACHIEVEMENTS = [
  {
    id: 'first_mission',
    name: 'First Mission',
    desc: 'Complete your initial Java puzzle level',
    icon: '🚀',
    check: (st) => st.completedLevels.size >= 1
  },
  {
    id: 'star_collector',
    name: 'Star Collector',
    desc: 'Collect 10 energy stars across puzzles',
    icon: '⭐',
    check: (st) => st.totalStars >= 10
  },
  {
    id: 'loop_master',
    name: 'Loop Master',
    desc: 'Complete Level 6 using a repeat loop',
    icon: '🔄',
    check: (st) => st.completedLevels.has(6) && (st.level6UsedRepeat || false)
  },
  {
    id: 'debug_hero',
    name: 'Debugging Hero',
    desc: 'Successfully fix and solve a bugged program (Level 11)',
    icon: '🐛',
    check: (st) => st.completedLevels.has(11)
  },
  {
    id: 'java_explorer',
    name: 'Java Explorer',
    desc: 'Solve all 12 academy puzzle missions',
    icon: '☕',
    check: (st) => st.completedLevels.size >= 12
  },
  {
    id: 'champion',
    name: 'Code Quest Champion',
    desc: 'Accumulate 1,500+ total cadet points',
    icon: '🏆',
    check: (st) => st.score >= 1500
  },
  {
    id: 'speedster',
    name: 'Speedster',
    desc: 'Clear 3 levels in under 2 minutes of play',
    icon: '⚡',
    check: (st) => st.speedrunLevelsCleared >= 3 && (Date.now() - st.speedrunStartTs) <= 120000
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    desc: 'Conquer World 1 & 2 levels (1 to 5)',
    icon: '💎',
    check: (st) => [1, 2, 3, 4, 5].every(id => st.completedLevels.has(id))
  }
];

function checkAchievements() {
  let unlockedAny = false;
  ACHIEVEMENTS.forEach(ach => {
    if (!GameState.achievements[ach.id] && ach.check(GameState)) {
      GameState.achievements[ach.id] = new Date().toLocaleTimeString();
      unlockedAny = true;
      SoundSystem.playAchievementSound();
      showToast(`Achievement Unlocked: ${ach.name}! ${ach.icon}`, 'success');
    }
  });
  if (unlockedAny) savePlayerProgress();
}

function renderAchievementsScreen() {
  const container = document.getElementById('achievements-container');
  container.innerHTML = '';
  const unlockedCount = ACHIEVEMENTS.filter(ach => !!GameState.achievements[ach.id]).length;
  const unlockedCountEl = document.getElementById('rewards-unlocked-count');
  const progressFill = document.getElementById('rewards-progress-fill');
  const starsEl = document.getElementById('rewards-total-stars');
  const scoreEl = document.getElementById('rewards-total-score');
  if (unlockedCountEl) unlockedCountEl.textContent = `${unlockedCount} / ${ACHIEVEMENTS.length}`;
  if (progressFill) progressFill.style.width = `${(unlockedCount / ACHIEVEMENTS.length) * 100}%`;
  if (starsEl) starsEl.textContent = `⭐ ${GameState.totalStars} / 36`;
  if (scoreEl) scoreEl.textContent = `💎 ${GameState.score.toLocaleString()}`;

  ACHIEVEMENTS.forEach(ach => {
    const isUnlocked = !!GameState.achievements[ach.id];
    const card = document.createElement('div');
    card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      <div class="achievement-icon">${ach.icon}</div>
      <div class="achievement-info">
        <span class="achievement-title">${ach.name}</span>
        <span class="achievement-desc">${ach.desc}</span>
        ${isUnlocked ? `<span class="achievement-date">Unlocked: ${GameState.achievements[ach.id]}</span>` : '<span style="font-size:0.7rem; color:var(--text-muted);">Locked</span>'}
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================================================================
// SECTION 12: GAME MODES & COMPETITION TIMER
// ==========================================================================
function startCompetitionMode() {
  GameState.gameMode = 'competition';
  GameState.competitionStarted = true;
  GameState.competitionEnded = false;
  GameState.competitionTimeRemaining = GameState.competitionTimeLimit;
  GameState.speedrunStartTs = Date.now();
  GameState.speedrunLevelsCleared = 0;
  GameState.speedrunClearedLevels.clear();

  document.getElementById('game-timer-container').style.display = 'flex';
  updateTimerDisplay();

  if (GameState.competitionTimer) clearInterval(GameState.competitionTimer);
  GameState.competitionTimer = setInterval(() => {
    GameState.competitionTimeRemaining--;
    updateTimerDisplay();

    if (GameState.competitionTimeRemaining <= 0) {
      clearInterval(GameState.competitionTimer);
      handleCompetitionTimeExpired();
    }
  }, 1000);

  loadLevel(0);
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('game-timer-display');
  if (timerEl) {
    timerEl.textContent = formatTime(GameState.competitionTimeRemaining);
  }
}

function handleCompetitionTimeExpired() {
  GameState.competitionEnded = true;
  SoundSystem.playErrorSound();
  showToast('⏰ Time is up! Competition attempt ended.', 'warning');

  setTimeout(async () => {
    await submitScoreToDatabase();
    await renderLeaderboard('overall');
    showScreen('leaderboard-screen');
  }, 1500);
}

async function submitScoreToDatabase() {
  const durationSec = GameState.competitionTimeLimit - GameState.competitionTimeRemaining;
  const payload = {
    nickname: GameState.playerName,
    score: GameState.score,
    levels_completed: GameState.completedLevels.size,
    levelsCompleted: GameState.completedLevels.size,
    total_levels: 12,
    totalLevels: 12,
    stars: GameState.totalStars,
    stars_earned: GameState.totalStars,
    starsEarned: GameState.totalStars,
    total_stars: 36,
    totalStars: 36,
    time_seconds: durationSec,
    total_time: durationSec,
    totalTime: durationSec,
    instructions_used: GameState.currentInstructions.length,
    instructionsUsed: GameState.currentInstructions.length,
    game_mode: 'competition',
    mode: 'competition',
    session_id: GameState.sessionId
  };

  try {
    if (window.CodeQuestDB && typeof window.CodeQuestDB.submitScore === 'function') {
      const result = await window.CodeQuestDB.submitScore(payload);
      if (result && result.success) return result;
      console.warn('Score was not saved online; keeping a local copy.', result && result.error);
    } else {
      console.warn('Leaderboard service is unavailable; keeping a local copy.');
    }
    const localScores = JSON.parse(localStorage.getItem('cq_scores') || '[]');
    localScores.push(payload);
    localStorage.setItem('cq_scores', JSON.stringify(localScores));
    return { success: true, data: payload, local: true };
  } catch (err) {
    console.warn('Leaderboard submission notice', err);
    try {
      const localScores = JSON.parse(localStorage.getItem('cq_scores') || '[]');
      localScores.push(payload);
      localStorage.setItem('cq_scores', JSON.stringify(localScores));
      return { success: true, data: payload, local: true };
    } catch (storageErr) {
      return { success: false, error: storageErr.message };
    }
  }
}

// ==========================================================================
// SECTION 13: TUTORIAL SYSTEM
// ==========================================================================
const TUTORIAL_STEPS = [
  {
    title: 'Command Boti With Action Cards',
    desc: 'Click cards in the action palette (Move, Turn Left, Turn Right) to queue commands.',
    graphic: '<div style="font-size:3rem;">👆 ➔ 🤖</div>'
  },
  {
    title: 'Build Logical Sequences',
    desc: 'Each instruction queues sequentially into your program. You can delete or undo anytime.',
    graphic: '<div style="font-family:\'Fira Code\'; font-size:1.1rem; color:var(--accent-cyan);">1. move();<br>2. turnRight();<br>3. move();</div>'
  },
  {
    title: 'Execute & Watch Boti Move',
    desc: 'Hit the green Run button! Boti follows every instruction and gathers energy stars automatically.',
    graphic: '<div style="font-size:3rem;">▶ 🚀 ⭐</div>'
  },
  {
    title: 'Real Java Code Generation',
    desc: 'As you build your program, watch standard Java code generate live in the code viewer.',
    graphic: '<div style="font-family:\'Fira Code\'; font-size:1.1rem; color:var(--accent-purple);">public void runMission() {<br>&nbsp;&nbsp;boti.move();<br>}</div>'
  }
];

let currentTutorialStep = 0;

function showTutorialStep(idx) {
  currentTutorialStep = idx;
  const step = TUTORIAL_STEPS[idx];
  document.getElementById('tutorial-title').textContent = step.title;
  document.getElementById('tutorial-desc').textContent = step.desc;
  document.getElementById('tutorial-graphic').innerHTML = step.graphic;

  document.querySelectorAll('.tutorial-step-indicator .step-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === idx);
  });

  const nextBtn = document.getElementById('btn-tutorial-next');
  if (idx === TUTORIAL_STEPS.length - 1) {
    nextBtn.textContent = 'Finish & Play →';
  } else {
    nextBtn.textContent = 'Next Step →';
  }
}

// ==========================================================================
// SECTION 14: SCREEN NAVIGATION
// ==========================================================================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    GameState.currentScreen = screenId;
    window.scrollTo(0, 0);
  }
}

// ==========================================================================
// SECTION 15: LEADERBOARD DISPLAY
// ==========================================================================
async function renderLeaderboard(filter = 'overall') {
  const tbody = document.getElementById('leaderboard-rows');
  const requestId = (renderLeaderboard.requestId || 0) + 1;
  renderLeaderboard.requestId = requestId;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Loading rankings...</td></tr>';

  let scores = [];

  try {
    if (window.CodeQuestDB && typeof window.CodeQuestDB.getLeaderboard === 'function') {
      const res = await window.CodeQuestDB.getLeaderboard(filter, 10);
      if (res && res.success && Array.isArray(res.data)) {
        scores = res.data;
      } else if (Array.isArray(res)) {
        scores = res;
      }
    }
  } catch (err) {
    console.warn('DB fetch skipped, using local store', err);
  }

  if (!scores || scores.length === 0) {
    try {
      const localRunScores = JSON.parse(localStorage.getItem('cq_scores') || '[]');
      const localLeaderboardScores = JSON.parse(localStorage.getItem('codequest_leaderboard') || '[]');
      scores = [...localLeaderboardScores, ...localRunScores];
    } catch (err) {
      console.warn('Could not read local leaderboard scores.', err);
    }
  }

  // Filter sorting
  if (filter === 'fastest') {
    scores.sort((a, b) => ((a.total_time ?? a.time_seconds ?? 0) - (b.total_time ?? b.time_seconds ?? 0)) || (b.score - a.score));
  } else if (filter === 'stars') {
    scores.sort((a, b) => ((b.stars_earned ?? b.stars ?? 0) - (a.stars_earned ?? a.stars ?? 0)) || (b.score - a.score));
  } else if (filter === 'efficient') {
    scores.sort((a, b) => {
      const effA = (a.score || 0) / Math.max(1, a.levels_completed || a.levelsCompleted || 1);
      const effB = (b.score || 0) / Math.max(1, b.levels_completed || b.levelsCompleted || 1);
      return effB - effA;
    });
  } else {
    scores.sort((a, b) => (b.score - a.score) || ((a.total_time ?? a.time_seconds ?? 0) - (b.total_time ?? b.time_seconds ?? 0)));
  }

  if (requestId !== renderLeaderboard.requestId) return;

  tbody.innerHTML = '';
  if (scores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No scores yet. Complete a competition run to add the first result.</td></tr>';
    return;
  }
  scores.slice(0, 10).forEach((entry, idx) => {
    const rank = idx + 1;
    let rankClass = '';
    let rankBadge = `#${rank}`;
    if (rank === 1) { rankClass = 'rank-gold'; rankBadge = '🥇 #1'; }
    else if (rank === 2) { rankClass = 'rank-silver'; rankBadge = '🥈 #2'; }
    else if (rank === 3) { rankClass = 'rank-bronze'; rankBadge = '🥉 #3'; }

    const isCurrentPlayer = entry.nickname === GameState.playerName;
    const tr = document.createElement('tr');
    tr.className = `lb-row ${isCurrentPlayer ? 'lb-player-highlight' : ''}`;
    const starsCount = entry.stars_earned !== undefined ? entry.stars_earned : (entry.stars || 0);
    const duration = entry.total_time !== undefined ? entry.total_time : (entry.time_seconds || 0);
    const levelsCount = entry.levels_completed !== undefined ? entry.levels_completed : (entry.levelsCompleted || 0);

    tr.innerHTML = `
      <td class="${rankClass}">${rankBadge}</td>
      <td style="font-weight:600;">${sanitizeNickname(entry.nickname)}</td>
      <td style="color:var(--accent-cyan); font-weight:700;">${(entry.score || 0).toLocaleString()}</td>
      <td>${levelsCount}</td>
      <td style="color:var(--accent-yellow);">⭐ ${starsCount}</td>
      <td style="font-family:'Fira Code';">${formatTime(duration)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================================================
// LEVEL LOADING & LEVEL SELECT
// ==========================================================================
const ROUTE_PROFILES = {
  1: { rows: 5, cols: 7, steps: 3, minTurns: 0, maxTurns: 0, straightOnly: true },
  2: { rows: 5, cols: 8, steps: 4, minTurns: 0, maxTurns: 0, straightOnly: true },
  3: { rows: 7, cols: 7, steps: 4, minTurns: 1, maxTurns: 2 },
  4: { rows: 8, cols: 8, steps: 8, minTurns: 2, maxTurns: 3 },
  5: { rows: 8, cols: 8, steps: 8, minTurns: 3, maxTurns: 5 },
  6: { rows: 4, cols: 11, steps: 7, minTurns: 0, maxTurns: 0, straightOnly: true },
  7: { rows: 9, cols: 9, steps: 10, minTurns: 3, maxTurns: 5 },
  8: { rows: 10, cols: 10, steps: 14, minTurns: 4, maxTurns: 7 },
  9: { rows: 8, cols: 8, steps: 8, minTurns: 2, maxTurns: 4, branches: 3 },
  10: { rows: 10, cols: 10, steps: 12, minTurns: 4, maxTurns: 6, branches: 4 },
  11: { rows: 7, cols: 7, steps: 5, minTurns: 1, maxTurns: 2 },
  12: { rows: 9, cols: 9, steps: 8, minTurns: 2, maxTurns: 5, minStraight: 3 }
};

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function getStepDirection(from, to) {
  if (to.row < from.row) return 'up';
  if (to.row > from.row) return 'down';
  if (to.col < from.col) return 'left';
  return 'right';
}

function getPathDirections(path) {
  return path.slice(1).map((point, index) => getStepDirection(path[index], point));
}

function pathHasLongEnoughStraight(path, minLength = 0) {
  if (!minLength) return true;
  let longest = 1;
  let current = 1;
  const directions = getPathDirections(path);
  for (let index = 1; index < directions.length; index++) {
    current = directions[index] === directions[index - 1] ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest >= minLength;
}

function generatePuzzlePath(profile, rows, cols) {
  const starts = [];
  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) starts.push({ row, col });
  }

  for (const start of shuffle(starts)) {
    const path = [start];
    let explored = 0;

    function search(turns) {
      if (path.length === profile.steps + 1) {
        if (turns < profile.minTurns || turns > profile.maxTurns) return null;
        return pathHasLongEnoughStraight(path, profile.minStraight)
          ? path.map(point => ({ ...point }))
          : null;
      }
      if (++explored > 3000) return null;

      const current = path[path.length - 1];
      const previousDirection = path.length > 1
        ? getStepDirection(path[path.length - 2], current)
        : null;
      const candidates = shuffle([
        { row: current.row - 1, col: current.col },
        { row: current.row + 1, col: current.col },
        { row: current.row, col: current.col - 1 },
        { row: current.row, col: current.col + 1 }
      ]).filter(next => {
        if (next.row <= 0 || next.row >= rows - 1 || next.col <= 0 || next.col >= cols - 1) return false;
        if (path.some(point => point.row === next.row && point.col === next.col)) return false;
        if (path.slice(0, -1).some(point => Math.abs(point.row - next.row) + Math.abs(point.col - next.col) === 1)) return false;
        const nextDirection = getStepDirection(current, next);
        if (profile.straightOnly && previousDirection && nextDirection !== previousDirection) return false;
        const nextTurns = turns + (previousDirection && nextDirection !== previousDirection ? 1 : 0);
        return nextTurns <= profile.maxTurns;
      });

      for (const next of candidates) {
        const nextDirection = getStepDirection(current, next);
        const nextTurns = turns + (previousDirection && nextDirection !== previousDirection ? 1 : 0);
        path.push(next);
        const result = search(nextTurns);
        if (result) return result;
        path.pop();
      }
      return null;
    }

    const result = search(0);
    if (result) return result;
  }
  return null;
}

function buildPathInstructions(path, startDir, useLoops) {
  const directions = getPathDirections(path);
  const turnOrder = ['up', 'right', 'down', 'left'];
  const instructions = [];
  let facing = startDir;
  let cursor = 0;

  while (cursor < directions.length) {
    const nextDirection = directions[cursor];
    const facingIndex = turnOrder.indexOf(facing);
    const nextIndex = turnOrder.indexOf(nextDirection);
    if (nextIndex !== facingIndex) {
      instructions.push({ action: (nextIndex - facingIndex + 4) % 4 === 1 ? 'TURN_RIGHT' : 'TURN_LEFT' });
      facing = nextDirection;
    }

    let runLength = 1;
    while (directions[cursor + runLength] === nextDirection) runLength++;
    if (useLoops && runLength >= 2) {
      instructions.push({ action: 'REPEAT', count: runLength, subActions: [{ action: 'MOVE' }] });
    } else {
      for (let step = 0; step < runLength; step++) instructions.push({ action: 'MOVE' });
    }
    cursor += runLength;
  }
  return instructions;
}

function addRouteBranches(grid, path, branchCount) {
  for (let branch = 0; branch < branchCount; branch++) {
    const candidates = [];
    for (let row = 1; row < grid.length - 1; row++) {
      for (let col = 1; col < grid[row].length - 1; col++) {
        if (grid[row][col] !== 1) continue;
        const openNeighbors = [
          grid[row - 1][col], grid[row + 1][col], grid[row][col - 1], grid[row][col + 1]
        ].filter(tile => tile !== 1);
        if (openNeighbors.length === 1) candidates.push({ row, col });
      }
    }
    if (!candidates.length) break;
    const spur = candidates[Math.floor(Math.random() * candidates.length)];
    grid[spur.row][spur.col] = 0;
  }
}

function getRouteHint(levelId) {
  if (levelId <= 2) return 'Follow the straight corridor and collect every star before reaching the exit.';
  if (levelId <= 5) return 'Trace the winding route and use turn commands when the passage bends.';
  if (levelId === 6) return 'Use a REPEAT block for the long straight corridor.';
  if (levelId <= 8) return 'Use REPEAT blocks for long straight sections, then turn at each bend.';
  if (levelId === 9) return 'Inspect the branches and use IF PATH CLEAR to move safely through the maze.';
  if (levelId === 10) return 'Combine REPEAT and IF PATH CLEAR to handle the branching maze.';
  if (levelId === 11) return 'Find the incorrect turn in the preloaded program and change its direction.';
  return 'Fix the repeat count and incorrect turn in the preloaded program.';
}

function createLevelVariant(baseLevel, previousLevel = null) {
  const profile = ROUTE_PROFILES[baseLevel.id];
  let path = null;
  let rows = profile.rows;
  let cols = profile.cols;
  let routeKey = '';

  for (let boardExpansion = 0; boardExpansion < 4; boardExpansion++) {
    rows = profile.rows + boardExpansion * 2;
    cols = profile.cols + boardExpansion * 2;
    path = generatePuzzlePath(profile, rows, cols);
    if (!path) continue;
    routeKey = path.map(point => `${point.row},${point.col}`).join('|');
    if (!previousLevel || previousLevel.id !== baseLevel.id || routeKey !== previousLevel.routeKey) break;
    path = null;
  }

  // Profiles are sized to make a path possible. Retain the authored board as
  // a safety net if a constrained random search ever fails on a future edit.
  if (!path) {
    return {
      ...baseLevel,
      routeKey: `authored-${baseLevel.id}`
    };
  }

  const startPos = path[0];
  const exitPos = path[path.length - 1];
  const startDir = getStepDirection(path[0], path[1]);
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1));
  path.forEach(point => { grid[point.row][point.col] = 0; });

  if (profile.branches) addRouteBranches(grid, path, profile.branches);
  const stars = shuffle(path.slice(1, -1)).slice(0, baseLevel.stars.length);
  stars.forEach(point => { grid[point.row][point.col] = 2; });
  grid[exitPos.row][exitPos.col] = 4;

  const solution = buildPathInstructions(path, startDir, baseLevel.availableActions.includes('REPEAT'));
  let prefilledInstructions = null;
  if (baseLevel.id === 11 || baseLevel.id === 12) {
    prefilledInstructions = JSON.parse(JSON.stringify(solution));
    if (baseLevel.id === 12) {
      const repeat = prefilledInstructions.find(instruction => instruction.action === 'REPEAT');
      if (repeat) repeat.count = Math.max(1, repeat.count - 1);
    }
    const turn = prefilledInstructions.find(instruction =>
      instruction.action === 'TURN_LEFT' || instruction.action === 'TURN_RIGHT'
    );
    if (turn) turn.action = turn.action === 'TURN_LEFT' ? 'TURN_RIGHT' : 'TURN_LEFT';
  }

  return {
    ...baseLevel,
    gridSize: { rows, cols },
    grid,
    startPos,
    startDir,
    exitPos,
    stars,
    optimalInstructions: solution.length,
    prefilledInstructions,
    hints: [getRouteHint(baseLevel.id)],
    routeKey
  };
}
function loadLevel(index) {
  if (index < 0 || index >= LEVELS.length) return;
  const previousLevel = GameState.activeLevel;
  GameState.currentLevel = index;
  GameState.currentLevelStartTime = Date.now();
  GameState.currentInstructions = [];
  GameState.layoutCount++;
  const level = createLevelVariant(LEVELS[index], previousLevel && previousLevel.id === LEVELS[index].id ? previousLevel : null);
  GameState.activeLevel = level;

  // Setup top bar
  document.getElementById('game-world-badge').textContent = `World ${level.world}: ${level.worldName}`;
  document.getElementById('game-level-title').textContent = `Level ${level.id}: ${level.name}`;
  document.getElementById('game-variant-badge').textContent = `🎲 Route ${GameState.layoutCount}`;

  showScreen('game-screen');
  renderGrid(level);
  renderActionPalette(level);

  // Handle prefilled instructions for debugging levels
  if (level.prefilledInstructions && Array.isArray(level.prefilledInstructions)) {
    GameState.currentInstructions = JSON.parse(JSON.stringify(level.prefilledInstructions));
  }

  updateProgramUI();
  updateJavaCodePreview();
  updateExplanationPanel(level);
  Robot.updateStatsDisplay();
}

function renderLevelSelectScreen() {
  const container = document.getElementById('worlds-container');
  container.innerHTML = '';

  // Group levels by world
  const worldsMap = {};
  LEVELS.forEach(lvl => {
    if (!worldsMap[lvl.world]) {
      worldsMap[lvl.world] = {
        name: lvl.worldName,
        levels: []
      };
    }
    worldsMap[lvl.world].levels.push(lvl);
  });

  Object.keys(worldsMap).forEach(worldNum => {
    const worldData = worldsMap[worldNum];
    const section = document.createElement('div');
    section.className = 'world-container';

    section.innerHTML = `
      <div class="world-header">
        <span class="world-tag">World ${worldNum}</span>
        <h3 class="world-title">${worldData.name}</h3>
      </div>
      <div class="level-cards-grid" id="world-grid-${worldNum}"></div>
    `;

    container.appendChild(section);
    const grid = section.querySelector(`#world-grid-${worldNum}`);

    worldData.levels.forEach((lvl, idx) => {
      // In practice mode, unlocked if previous level completed or it's level 1
      const isUnlocked = lvl.id === 1 || GameState.completedLevels.has(lvl.id - 1) || GameState.completedLevels.has(lvl.id);
      const isCompleted = GameState.completedLevels.has(lvl.id);

      const card = document.createElement('div');
      card.className = `level-card ${isUnlocked ? '' : 'locked'}`;
      card.innerHTML = `
        <span class="level-card-number">Level ${lvl.id}</span>
        <div class="level-card-name">${lvl.name}</div>
        <p class="level-card-desc">${lvl.description}</p>
        <div class="level-card-stars">
          ${isCompleted ? '⭐⭐⭐' : (isUnlocked ? '☆☆☆' : '🔒')}
        </div>
        ${!isUnlocked ? '<span class="level-card-lock-badge">🔒</span>' : ''}
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          SoundSystem.playClickSound();
          loadLevel(lvl.id - 1);
        });
      }

      grid.appendChild(card);
    });
  });
}

// ==========================================================================
// SECTION 17: CONFETTI EFFECT
// ==========================================================================
function launchConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  const colors = ['#00d4ff', '#8b5cf6', '#ec4899', '#fbbf24', '#34d399'];

  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    piece.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    container.appendChild(piece);
  }

  setTimeout(() => {
    container.innerHTML = '';
  }, 4000);
}

// ==========================================================================
// SECTION 18: UTILITIES & TOASTS
// ==========================================================================
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function sanitizeNickname(name) {
  if (!name) return 'Cadet';
  return name.replace(/[^\w\s-]/gi, '').trim().substring(0, 15);
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ==========================================================================
// EVENT LISTENERS & SETUP
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadPlayerProgress();

  // Global Mute Button
  const muteBtn = document.getElementById('global-mute-btn');
  muteBtn.addEventListener('click', () => {
    GameState.isMuted = !GameState.isMuted;
    muteBtn.textContent = GameState.isMuted ? '🔇' : '🔊';
    muteBtn.title = GameState.isMuted ? 'Unmute Sound' : 'Mute Sound';
  });

  // Home Screen Buttons
  document.getElementById('btn-play-now').addEventListener('click', () => {
    SoundSystem.playClickSound();
    showScreen('nickname-screen');
  });

  document.getElementById('btn-open-leaderboard').addEventListener('click', () => {
    SoundSystem.playClickSound();
    showScreen('leaderboard-screen');
    renderLeaderboard('overall');
  });

  document.getElementById('btn-open-rewards').addEventListener('click', () => {
    SoundSystem.playClickSound();
    renderAchievementsScreen();
    showScreen('rewards-screen');
  });

  // Nickname Screen
  document.getElementById('btn-nickname-back').addEventListener('click', () => {
    SoundSystem.playClickSound();
    showScreen('home-screen');
  });

  document.getElementById('btn-nickname-submit').addEventListener('click', () => {
    SoundSystem.playClickSound();
    const input = document.getElementById('player-nickname');
    const rawName = input.value.trim();
    const val = rawName ? sanitizeNickname(rawName) : '';
    if (!rawName || !val) {
      input.focus();
      showToast('Please enter a name before starting your mission.', 'warning');
      return;
    }
    GameState.playerName = val;
    input.value = val;

    const hasSeenTutorial = localStorage.getItem('cq_tutorial_seen');
    if (!hasSeenTutorial) {
      showTutorialStep(0);
      showScreen('tutorial-screen');
    } else {
      showScreen('mode-screen');
    }
  });

  document.getElementById('player-nickname').addEventListener('keydown', event => {
    if (event.key === 'Enter') document.getElementById('btn-nickname-submit').click();
  });

  window.addEventListener('resize', () => {
    if (GameState.currentScreen !== 'game-screen') return;
    updateGridTileSizing();
    Robot.updateDomPosition();
  });

  // Tutorial Screen
  document.getElementById('btn-tutorial-skip').addEventListener('click', () => {
    SoundSystem.playClickSound();
    localStorage.setItem('cq_tutorial_seen', 'true');
    showScreen('mode-screen');
  });

  document.getElementById('btn-tutorial-next').addEventListener('click', () => {
    SoundSystem.playClickSound();
    if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
      showTutorialStep(currentTutorialStep + 1);
    } else {
      localStorage.setItem('cq_tutorial_seen', 'true');
      showScreen('mode-screen');
    }
  });

  // Mode Selection
  document.getElementById('btn-mode-back').addEventListener('click', () => {
    SoundSystem.playClickSound();
    showScreen('home-screen');
  });

  document.getElementById('card-mode-practice').addEventListener('click', () => {
    SoundSystem.playClickSound();
    GameState.gameMode = 'practice';
    document.getElementById('game-timer-container').style.display = 'none';
    renderLevelSelectScreen();
    showScreen('level-select-screen');
  });

  document.getElementById('card-mode-competition').addEventListener('click', () => {
    SoundSystem.playClickSound();
    showScreen('competition-rules-screen');
  });

  // Competition Rules
  document.getElementById('btn-rules-back').addEventListener('click', () => {
    SoundSystem.playClickSound();
    showScreen('mode-screen');
  });

  document.querySelectorAll('.timer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      SoundSystem.playClickSound();
      document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      GameState.competitionTimeLimit = parseInt(btn.dataset.time, 10);
    });
  });

  document.getElementById('btn-start-competition').addEventListener('click', () => {
    SoundSystem.playClickSound();
    startCompetitionMode();
  });

  // Level Select Back
  document.getElementById('btn-level-select-back').addEventListener('click', () => {
    SoundSystem.playClickSound();
    showScreen('mode-screen');
  });

  // Main Game Controls
  document.getElementById('btn-game-exit').addEventListener('click', () => {
    SoundSystem.playClickSound();
    if (GameState.gameMode === 'competition') {
      if (confirm('Exit competition attempt? Your current score will be recorded.')) {
        if (GameState.competitionTimer) clearInterval(GameState.competitionTimer);
        submitScoreToDatabase();
        showScreen('mode-screen');
      }
    } else {
      renderLevelSelectScreen();
      showScreen('level-select-screen');
    }
  });

  document.getElementById('btn-run-code').addEventListener('click', () => {
    executeProgram();
  });

  document.getElementById('btn-reset-level').addEventListener('click', () => {
    if (GameState.isRunning) return;
    SoundSystem.playClickSound();
    const curLevel = getCurrentLevel();
    Robot.reset(curLevel);
  });

  document.getElementById('btn-undo-code').addEventListener('click', undoLastInstruction);
  document.getElementById('btn-clear-code').addEventListener('click', clearInstructions);

  document.getElementById('btn-hint').addEventListener('click', () => {
    SoundSystem.playClickSound();
    const curLevel = getCurrentLevel();
    GameState.hintsUsed[curLevel.id] = true;
    showToast(`💡 Hint: ${curLevel.hints[0]}`, 'info');
  });

  // Nested Builder Modal Controls
  document.getElementById('btn-counter-minus').addEventListener('click', () => {
    SoundSystem.playClickSound();
    if (modalCounterVal > 2) {
      modalCounterVal--;
      document.getElementById('counter-val').textContent = modalCounterVal;
    }
  });

  document.getElementById('btn-counter-plus').addEventListener('click', () => {
    SoundSystem.playClickSound();
    if (modalCounterVal < 9) {
      modalCounterVal++;
      document.getElementById('counter-val').textContent = modalCounterVal;
    }
  });

  document.querySelectorAll('.btn-builder-subaction').forEach(btn => {
    btn.addEventListener('click', () => {
      SoundSystem.playClickSound();
      if (modalNestedActions.length < 5) {
        modalNestedActions.push({ action: btn.dataset.subaction });
        renderModalNestedList();
      } else {
        showToast('Maximum 5 nested instructions inside block', 'warning');
      }
    });
  });

  document.getElementById('btn-builder-close').addEventListener('click', closeNestedBuilderModal);
  document.getElementById('btn-builder-cancel').addEventListener('click', closeNestedBuilderModal);

  document.getElementById('btn-builder-confirm').addEventListener('click', () => {
    if (modalNestedActions.length === 0) {
      showToast('Please add at least one nested command inside the block!', 'warning');
      return;
    }
    SoundSystem.playClickSound();

    if (activeModalType === 'REPEAT') {
      GameState.currentInstructions.push({
        action: 'REPEAT',
        count: modalCounterVal,
        subActions: [...modalNestedActions]
      });
    } else {
      GameState.currentInstructions.push({
        action: 'IF_PATH_CLEAR',
        subActions: [...modalNestedActions]
      });
    }

    closeNestedBuilderModal();
    updateProgramUI();
    updateJavaCodePreview();
  });

  // Results Screen Controls
  document.getElementById('btn-results-select').addEventListener('click', () => {
    SoundSystem.playClickSound();
    renderLevelSelectScreen();
    showScreen('level-select-screen');
  });

  document.getElementById('btn-results-retry').addEventListener('click', () => {
    SoundSystem.playClickSound();
    loadLevel(GameState.currentLevel);
  });

  document.getElementById('btn-results-next').addEventListener('click', async () => {
    SoundSystem.playClickSound();
    if (GameState.currentLevel < LEVELS.length - 1) {
      loadLevel(GameState.currentLevel + 1);
    } else {
      showToast('Congratulations! You completed all academy missions!', 'success');
      if (GameState.gameMode === 'competition') {
        if (GameState.competitionTimer) clearInterval(GameState.competitionTimer);
        await submitScoreToDatabase();
        await renderLeaderboard('overall');
        showScreen('leaderboard-screen');
      } else {
        renderLevelSelectScreen();
        showScreen('level-select-screen');
      }
    }
  });

  // Leaderboard Filter Tabs
  document.querySelectorAll('.leaderboard-filters .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      SoundSystem.playClickSound();
      document.querySelectorAll('.leaderboard-filters .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderLeaderboard(tab.dataset.filter);
    });
  });

  document.getElementById('btn-leaderboard-back').addEventListener('click', () => {
    SoundSystem.playClickSound();
    showScreen('home-screen');
  });

  document.getElementById('btn-rewards-back').addEventListener('click', () => {
    SoundSystem.playClickSound();
    showScreen('home-screen');
  });

  document.getElementById('btn-rewards-reset').addEventListener('click', () => {
    if (!confirm('Reset your saved score, stars, completed levels, and achievements on this device?')) return;
    GameState.score = 0;
    GameState.totalStars = 0;
    GameState.completedLevels.clear();
    GameState.achievements = {};
    GameState.levelScores = {};
    GameState.level6UsedRepeat = false;
    savePlayerProgress();
    renderAchievementsScreen();
    showToast('Your local progress has been reset.', 'success');
  });
});
