import Phaser from "phaser";
import type { Direction } from "./constants";

export interface EggActor {
  id: number;
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  speed: number;
  chickenIndex: number;
  catchArrivalTime: number;
  caught: boolean;
  guide?: Phaser.GameObjects.Graphics;
}

export interface ChickenActor {
  sprite: Phaser.GameObjects.Image;
  baseX: number;
  baseY: number;
}

export interface GameOverData {
  score: number;
  level: number;
  reason: string;
}

export interface FarmerState {
  direction: Direction;
  targetX: number | null;
  running: boolean;
  animationTimer: number;
}
