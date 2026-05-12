export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const WORLD = {
  maxMisses: 5,
  maxLevel: 13,
  // Five clean lanes make the basket/chicken alignment much easier for kids.
  chickenCount: 5,
  perchY: 118,
  perchXMin: 200,
  perchXMax: 1080,
  groundY: 646,
  basketOffsetY: 170,
  // Catching now aligns to the center lane position for perfect lane matching.
  basketForwardOffset: 0,
  basketCatchWidth: 180,
  basketCatchHeight: 118,
  basketAssistWidth: 228,
  farmerSpeed: 920,
  farmerBottomY: 655,
  farmerMinX: 140,
  farmerMaxX: 1140,
  laneSnapThreshold: 8
} as const;

export const ASSETS = {
  barn: "barn",
  chickenSit: "chickenSit",
  chickenTada: "chickenTada",
  chickenStand: "chickenStand",
  eggWhite: "eggWhite",
  eggBrown: "eggBrown",
  eggBrokenWhite: "eggBrokenWhite",
  farmerIdleRight: "farmerIdleRight",
  farmerIdleLeft: "farmerIdleLeft",
  farmerRight1: "farmerRight1",
  farmerRight2: "farmerRight2",
  farmerRight3: "farmerRight3",
  farmerLeft1: "farmerLeft1",
  farmerLeft2: "farmerLeft2",
  farmerLeft3: "farmerLeft3"
} as const;

export const ASSET_PATHS: Record<string, string> = {
  [ASSETS.barn]: "assets/barn_bg.jpg",
  [ASSETS.chickenSit]: "assets/chicken_sit.png",
  [ASSETS.chickenTada]: "assets/chicken_tada.png",
  [ASSETS.chickenStand]: "assets/chicken_stand.png",
  [ASSETS.eggWhite]: "assets/egg_white.png",
  [ASSETS.eggBrown]: "assets/egg_brown.png",
  [ASSETS.eggBrokenWhite]: "assets/egg_broken_white.png",
  [ASSETS.farmerIdleRight]: "assets/farmer_idle_right.png",
  [ASSETS.farmerIdleLeft]: "assets/farmer_idle_left.png",
  [ASSETS.farmerRight1]: "assets/farmer_right_1.png",
  [ASSETS.farmerRight2]: "assets/farmer_right_2.png",
  [ASSETS.farmerRight3]: "assets/farmer_right_3.png",
  [ASSETS.farmerLeft1]: "assets/farmer_left_1.png",
  [ASSETS.farmerLeft2]: "assets/farmer_left_2.png",
  [ASSETS.farmerLeft3]: "assets/farmer_left_3.png"
};

export const SCENES = {
  boot: "BootScene",
  menu: "MenuScene",
  game: "GameScene",
  gameOver: "GameOverScene"
} as const;

export type Direction = -1 | 1;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function levelFromScore(score: number): number {
  return Math.min(WORLD.maxLevel, Math.floor(score / 100) + 1);
}

export function fallSpeedForLevel(level: number): number {
  return 132 + (Math.min(level, WORLD.maxLevel) - 1) * 14;
}

export function spawnIntervalForLevel(level: number): number {
  return Math.max(760, 1600 - (Math.min(level, WORLD.maxLevel) - 1) * 62);
}

export function maxActiveEggsForLevel(level: number): number {
  const capped = Math.min(level, WORLD.maxLevel);
  if (capped >= 10) return 3;
  if (capped >= 5) return 2;
  return 1;
}
