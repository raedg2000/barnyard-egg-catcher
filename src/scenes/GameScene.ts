import Phaser from "phaser";
import { AudioEngine } from "../core/AudioEngine";
import {
  ASSETS,
  GAME_HEIGHT,
  GAME_WIDTH,
  SCENES,
  WORLD,
  clamp,
  fallSpeedForLevel,
  levelFromScore,
  maxActiveEggsForLevel,
  spawnIntervalForLevel,
  type Direction
} from "../core/constants";
import type { ChickenActor, EggActor, FarmerState } from "../core/types";
import { addButton, addPanel, coverImage } from "../core/ui";

export class GameScene extends Phaser.Scene {
  private chickens: ChickenActor[] = [];
  private eggs: EggActor[] = [];
  private laneXs: number[] = [];
  private score = 0;
  private level = 1;
  private misses = 0;
  private pausedGame = false;

  private farmer!: Phaser.GameObjects.Image;
  private farmerShadow!: Phaser.GameObjects.Graphics;
  private farmerState: FarmerState = { direction: 1, targetX: null, running: false, animationTimer: 0 };
  private currentLaneIndex = 0;
  private targetLaneIndex = 0;
  private dustCooldown = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private missesText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private soundButton?: Phaser.GameObjects.Container;

  private leftKey?: Phaser.Input.Keyboard.Key;
  private rightKey?: Phaser.Input.Keyboard.Key;
  private aKey?: Phaser.Input.Keyboard.Key;
  private dKey?: Phaser.Input.Keyboard.Key;

  private lastSpawnTime = 0;
  private lastPredictedCatchX = GAME_WIDTH / 2;
  private lastPredictedArrival = 0;
  private nextEggId = 1;

  constructor() {
    super(SCENES.game);
  }

  create(): void {
    this.resetState();
    this.buildWorld();
    this.buildHud();
    this.bindInput();
    AudioEngine.instance.startMusic();
  }

  update(time: number, deltaMs: number): void {
    if (this.pausedGame) return;
    const dt = deltaMs / 1000;
    this.handleLaneInput();
    this.updateFarmer(dt);
    this.updateSpawning(time);
    this.updateEggs(deltaMs, time);
  }

  private resetState(): void {
    this.chickens = [];
    this.eggs = [];
    this.laneXs = [];
    this.score = 0;
    this.level = 1;
    this.misses = 0;
    this.pausedGame = false;
    this.lastSpawnTime = 0;
    this.lastPredictedCatchX = GAME_WIDTH / 2;
    this.lastPredictedArrival = 0;
    this.nextEggId = 1;
    this.dustCooldown = 0;
    this.currentLaneIndex = Math.floor(WORLD.chickenCount / 2);
    this.targetLaneIndex = this.currentLaneIndex;
    this.farmerState = { direction: 1, targetX: null, running: false, animationTimer: 0 };
  }

  private buildWorld(): void {
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, ASSETS.barn).setOrigin(0.5).setDepth(0);
    coverImage(bg, GAME_WIDTH, GAME_HEIGHT);

    const warmOverlay = this.add.graphics().setDepth(1);
    warmOverlay.fillStyle(0x4d2507, 0.08);
    warmOverlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.drawPerch();
    this.createChickens();
    this.drawCatchLaneMarkers();

    this.farmerShadow = this.add.graphics().setDepth(14);
    const startX = this.laneXs[this.currentLaneIndex] ?? GAME_WIDTH / 2;
    this.farmer = this.add.image(startX, WORLD.farmerBottomY, this.idleTextureForDirection(this.farmerState.direction))
      .setOrigin(0.5, 1)
      .setScale(0.34)
      .setDepth(15);
    this.redrawFarmerShadow();
  }

  private drawPerch(): void {
    const shadow = this.add.graphics().setDepth(4);
    shadow.fillStyle(0x1d0c04, 0.34);
    shadow.fillRoundedRect(58, WORLD.perchY + 17, 1164, 16, 8);

    const perch = this.add.graphics().setDepth(5);
    perch.fillStyle(0x7a3d16, 1);
    perch.lineStyle(5, 0x3e1b08, 1);
    perch.fillRoundedRect(52, WORLD.perchY, 1176, 28, 12);
    perch.strokeRoundedRect(52, WORLD.perchY, 1176, 28, 12);

    for (let x = 88; x <= 1160; x += 86) {
      perch.lineStyle(2, 0x9b5b24, 0.72);
      perch.lineBetween(x, WORLD.perchY + 4, x + 34, WORLD.perchY + 24);
    }
  }

  private createChickens(): void {
    for (let i = 0; i < WORLD.chickenCount; i += 1) {
      const t = i / Math.max(1, WORLD.chickenCount - 1);
      const x = Phaser.Math.Linear(WORLD.perchXMin, WORLD.perchXMax, t);
      const y = WORLD.perchY + 11;
      const chicken = this.add.image(x, y, ASSETS.chickenSit)
        .setOrigin(0.5, 1)
        .setScale(0.205)
        .setDepth(7);
      this.chickens.push({ sprite: chicken, baseX: x, baseY: y });
      this.laneXs.push(x);

      this.tweens.add({
        targets: chicken,
        y: y - Phaser.Math.Between(2, 5),
        rotation: Phaser.Math.FloatBetween(-0.025, 0.025),
        duration: Phaser.Math.Between(680, 1120),
        ease: "Sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 700)
      });
    }
  }

  private drawCatchLaneMarkers(): void {
    const lanes = this.add.graphics().setDepth(3);
    for (const x of this.laneXs) {
      lanes.lineStyle(3, 0xffe48f, 0.18);
      lanes.lineBetween(x, WORLD.perchY + 46, x, this.basketY());
      lanes.fillStyle(0xffdf8b, 0.14);
      lanes.fillRoundedRect(x - 70, this.basketY() - 14, 140, 28, 14);
      lanes.lineStyle(3, 0xfff1b0, 0.28);
      lanes.strokeRoundedRect(x - 70, this.basketY() - 14, 140, 28, 14);
    }
  }

  private buildHud(): void {
    addPanel(this, 24, 18, 520, 64, 0.82).setDepth(50);
    this.scoreText = this.add.text(48, 33, "Score: 0", this.hudStyle()).setDepth(51);
    this.levelText = this.add.text(224, 33, "Level: 1", this.hudStyle()).setDepth(51);
    this.missesText = this.add.text(364, 33, "Broken: 0/5", this.hudStyle()).setDepth(51);

    this.helpText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, "Use ← → or A/D. The farmer snaps to each chicken lane for easy catching.", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "20px",
      color: "#fff4d4",
      fontStyle: "bold",
      stroke: "#42200a",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(51).setAlpha(0.96);

    this.toastText = this.add.text(GAME_WIDTH / 2, 130, "", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "54px",
      color: "#fff1a8",
      fontStyle: "bold",
      stroke: "#5c2600",
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(60).setAlpha(0);

    addButton(this, GAME_WIDTH - 86, 50, 142, 48, "Pause", () => this.togglePause(), 21).setDepth(54);
    this.soundButton = addButton(this, GAME_WIDTH - 252, 50, 154, 48, "Sound: On", () => this.toggleSound(), 19).setDepth(54);
  }

  private hudStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "24px",
      color: "#fff3d4",
      fontStyle: "bold"
    };
  }

  private bindInput(): void {
    const keys = this.input.keyboard?.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D
    }) as Record<string, Phaser.Input.Keyboard.Key> | undefined;

    this.leftKey = keys?.left;
    this.rightKey = keys?.right;
    this.aKey = keys?.a;
    this.dKey = keys?.d;

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      AudioEngine.instance.resume();
      this.setBasketTarget(pointer.x);
    });

    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) this.setBasketTarget(pointer.x);
    });

    this.input.keyboard?.on("keydown-P", () => this.togglePause());
    this.input.keyboard?.on("keydown-SPACE", () => this.togglePause());
  }

  private handleLaneInput(): void {
    if ((this.leftKey && Phaser.Input.Keyboard.JustDown(this.leftKey)) || (this.aKey && Phaser.Input.Keyboard.JustDown(this.aKey))) {
      this.moveToLane(this.targetLaneIndex - 1);
    }
    if ((this.rightKey && Phaser.Input.Keyboard.JustDown(this.rightKey)) || (this.dKey && Phaser.Input.Keyboard.JustDown(this.dKey))) {
      this.moveToLane(this.targetLaneIndex + 1);
    }
  }

  private moveToLane(index: number): void {
    if (this.laneXs.length === 0) return;
    this.targetLaneIndex = clamp(index, 0, this.laneXs.length - 1);
    const nextX = this.laneXs[this.targetLaneIndex];
    const diff = nextX - this.farmer.x;
    if (Math.abs(diff) > 1) {
      this.farmerState.direction = diff >= 0 ? 1 : -1;
      this.farmerState.targetX = nextX;
    }
  }

  private setBasketTarget(screenX: number): void {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.laneXs.length; i += 1) {
      const distance = Math.abs(screenX - this.laneXs[i]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    this.moveToLane(bestIndex);
  }

  private updateFarmer(dt: number): void {
    const targetX = this.laneXs[this.targetLaneIndex] ?? this.farmer.x;
    const diff = targetX - this.farmer.x;
    const moving = Math.abs(diff) > WORLD.laneSnapThreshold;

    if (moving) {
      const dir: Direction = diff >= 0 ? 1 : -1;
      this.farmerState.direction = dir;
      this.farmerState.targetX = targetX;
      const step = Math.min(Math.abs(diff), WORLD.farmerSpeed * dt) * dir;
      this.farmer.x = clamp(this.farmer.x + step, WORLD.farmerMinX, WORLD.farmerMaxX);
      this.farmerState.animationTimer += dt;
      this.farmerState.running = true;
      const runPulse = Math.sin(this.farmerState.animationTimer * 24);
      const bob = Math.abs(runPulse) * 6;
      this.farmer.y = WORLD.farmerBottomY - bob;
      this.farmer.rotation = this.farmerState.direction * 0.028;
      this.farmer.setScale(0.34 + Math.abs(runPulse) * 0.008, 0.34 - Math.abs(runPulse) * 0.004);
      this.dustCooldown -= dt;
      if (this.dustCooldown <= 0) {
        this.createDustPuff(this.farmerState.direction);
        this.dustCooldown = 0.105;
      }
    } else {
      this.farmer.x = targetX;
      this.currentLaneIndex = this.targetLaneIndex;
      this.farmerState.targetX = targetX;
      this.farmerState.running = false;
      this.farmer.y = WORLD.farmerBottomY + Math.sin(this.time.now / 360) * 2;
      this.farmer.rotation = Phaser.Math.Linear(this.farmer.rotation, 0, 0.2);
      this.farmer.setScale(0.34);
    }

    this.farmer.setTexture(this.farmerTextureForState());
    this.redrawFarmerShadow();
  }

  private farmerTextureForState(): string {
    if (!this.farmerState.running) return this.idleTextureForDirection(this.farmerState.direction);
    const dir = this.farmerState.direction;
    const frames = dir === 1
      ? [ASSETS.farmerRight1, ASSETS.farmerRight2, ASSETS.farmerRight3]
      : [ASSETS.farmerLeft1, ASSETS.farmerLeft2, ASSETS.farmerLeft3];
    return frames[Math.floor(this.farmerState.animationTimer * 12) % frames.length];
  }

  private idleTextureForDirection(direction: Direction): string {
    return direction === 1 ? ASSETS.farmerIdleRight : ASSETS.farmerIdleLeft;
  }

  private createDustPuff(direction: Direction): void {
    const puff = this.add.graphics().setDepth(13);
    puff.fillStyle(0xd2a063, 0.28);
    puff.fillEllipse(0, 0, Phaser.Math.Between(18, 30), Phaser.Math.Between(7, 13));
    puff.setPosition(this.farmer.x - direction * 74, WORLD.farmerBottomY - 24);
    this.tweens.add({
      targets: puff,
      x: puff.x - direction * Phaser.Math.Between(20, 36),
      y: puff.y - Phaser.Math.Between(2, 8),
      alpha: 0,
      duration: 360,
      ease: "Sine.out",
      onComplete: () => puff.destroy()
    });
  }

  private redrawFarmerShadow(): void {
    if (!this.farmerShadow) return;
    this.farmerShadow.clear();
    this.farmerShadow.fillStyle(0x120904, 0.22);
    this.farmerShadow.fillEllipse(this.farmer.x, WORLD.farmerBottomY - 18, 150, 34);
  }

  private updateSpawning(time: number): void {
    const interval = spawnIntervalForLevel(this.level);
    if (time - this.lastSpawnTime < interval) return;
    if (this.eggs.length >= maxActiveEggsForLevel(this.level)) return;
    if (this.eggs.length > 0 && time < this.lastPredictedArrival - 260) return;

    this.spawnEgg(time);
    this.lastSpawnTime = time;
  }

  private spawnEgg(time: number): void {
    const speed = fallSpeedForLevel(this.level) + Phaser.Math.FloatBetween(-6, 10);
    const catchY = this.basketY();
    const startY = WORLD.perchY + 34;
    const secondsToCatch = Math.max(0.75, (catchY - startY) / speed);
    const arrival = time + secondsToCatch * 1000;
    const previousArrival = Math.max(this.lastPredictedArrival, time);
    const secondsAvailable = Math.max(0.72, (arrival - previousArrival) / 1000);
    const originX = this.lastPredictedArrival > time ? this.lastPredictedCatchX : this.basketX();
    const reachableDistance = WORLD.farmerSpeed * 0.80 * secondsAvailable + WORLD.basketCatchWidth;

    const candidates = this.chickens
      .map((chicken, index) => ({ index, x: chicken.baseX, distance: Math.abs(chicken.baseX - originX) }))
      .filter(candidate => candidate.distance <= reachableDistance);

    const pool = candidates.length > 0
      ? candidates
      : this.chickens
        .map((chicken, index) => ({ index, x: chicken.baseX, distance: Math.abs(chicken.baseX - originX) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);

    const selected = pool[Phaser.Math.Between(0, pool.length - 1)];
    const chicken = this.chickens[selected.index];
    this.animateChicken(chicken.sprite);

    const eggKey = Math.random() < 0.76 ? ASSETS.eggWhite : ASSETS.eggBrown;
    const guide = this.createEggLandingGuide(chicken.baseX);
    const egg = this.add.image(chicken.baseX, startY, eggKey)
      .setOrigin(0.5)
      .setScale(0.105)
      .setDepth(10)
      .setRotation(Phaser.Math.FloatBetween(-0.12, 0.12));

    this.eggs.push({
      id: this.nextEggId++,
      sprite: egg,
      x: chicken.baseX,
      y: startY,
      speed,
      chickenIndex: selected.index,
      catchArrivalTime: arrival,
      caught: false,
      guide
    });

    this.lastPredictedCatchX = chicken.baseX;
    this.lastPredictedArrival = arrival;
  }

  private createEggLandingGuide(x: number): Phaser.GameObjects.Graphics {
    const guide = this.add.graphics().setDepth(8).setAlpha(0.86);
    guide.fillStyle(0xffdf73, 0.20);
    guide.fillRoundedRect(x - 68, this.basketY() - 16, 136, 32, 16);
    guide.lineStyle(3, 0xfff2a8, 0.5);
    guide.strokeRoundedRect(x - 68, this.basketY() - 16, 136, 32, 16);
    guide.lineStyle(2, 0xfff2a8, 0.28);
    guide.lineBetween(x, WORLD.perchY + 46, x, this.basketY() - 18);
    this.tweens.add({
      targets: guide,
      alpha: 0.42,
      duration: 360,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut"
    });
    return guide;
  }

  private animateChicken(chicken: Phaser.GameObjects.Image): void {
    AudioEngine.instance.playCluck();
    const originalScale = chicken.scaleX;
    this.tweens.add({
      targets: chicken,
      scaleX: originalScale * 1.12,
      scaleY: originalScale * 1.12,
      y: chicken.y - 8,
      duration: 120,
      yoyo: true,
      ease: "Back.out"
    });
  }

  private updateEggs(deltaMs: number, time: number): void {
    const dt = deltaMs / 1000;
    for (let i = this.eggs.length - 1; i >= 0; i -= 1) {
      const egg = this.eggs[i];
      egg.y += egg.speed * dt;
      egg.sprite.setY(egg.y);
      egg.sprite.setRotation(egg.sprite.rotation + dt * 2.2);

      if (this.isEggCaught(egg)) {
        this.catchEgg(egg, i);
        continue;
      }

      if (egg.y >= WORLD.groundY) {
        this.missEgg(egg, i, time);
      }
    }
  }

  private isEggCaught(egg: EggActor): boolean {
    if (egg.caught) return false;
    const basketX = this.basketX();
    const basketY = this.basketY();
    const dx = Math.abs(egg.x - basketX);
    const dy = Math.abs(egg.y - basketY);

    const directCatch = dx <= WORLD.basketCatchWidth / 2 && dy <= WORLD.basketCatchHeight / 2;
    const assistedCatch = dx <= WORLD.basketAssistWidth / 2 && dy <= WORLD.basketCatchHeight * 0.34;
    return directCatch || assistedCatch;
  }

  private catchEgg(egg: EggActor, index: number): void {
    egg.caught = true;
    this.eggs.splice(index, 1);
    egg.guide?.destroy();
    AudioEngine.instance.playCatch();

    this.tweens.add({
      targets: egg.sprite,
      x: this.basketX(),
      y: this.basketY() + 12,
      scaleX: 0.025,
      scaleY: 0.025,
      alpha: 0,
      duration: 130,
      ease: "Sine.in",
      onComplete: () => egg.sprite.destroy()
    });

    this.addFloatingText("+10", this.basketX(), this.basketY() - 44, 0xfff1a8);
    this.setScore(this.score + 10);
  }

  private missEgg(egg: EggActor, index: number, time: number): void {
    this.eggs.splice(index, 1);
    egg.sprite.destroy();
    egg.guide?.destroy();
    AudioEngine.instance.playCrack();

    const broken = this.add.image(egg.x, WORLD.groundY + 16, ASSETS.eggBrokenWhite)
      .setOrigin(0.5, 0.65)
      .setScale(0.17)
      .setDepth(9)
      .setAlpha(0.97)
      .setRotation(Phaser.Math.FloatBetween(-0.06, 0.06));

    this.tweens.add({
      targets: broken,
      alpha: 0,
      y: WORLD.groundY + 26,
      duration: 1650,
      delay: 700,
      ease: "Sine.in",
      onComplete: () => broken.destroy()
    });

    this.misses += 1;
    this.updateHud();
    this.addFloatingText("Oops!", egg.x, WORLD.groundY - 58, 0xff8a62);

    if (this.misses >= WORLD.maxMisses) {
      this.endGame(time);
    }
  }

  private setScore(value: number): void {
    const oldLevel = this.level;
    this.score = value;
    this.level = levelFromScore(this.score);
    this.updateHud();

    if (this.level > oldLevel) {
      AudioEngine.instance.playLevelUp();
      this.showToast(this.level >= WORLD.maxLevel ? "Level 13! Max Speed" : `Level ${this.level}!`);
    }
  }

  private updateHud(): void {
    this.scoreText.setText(`Score: ${this.score}`);
    this.levelText.setText(`Level: ${this.level}`);
    this.missesText.setText(`Broken: ${this.misses}/${WORLD.maxMisses}`);
  }

  private showToast(message: string): void {
    this.toastText.setText(message).setAlpha(0).setScale(0.72);
    this.tweens.add({
      targets: this.toastText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      yoyo: true,
      hold: 650,
      duration: 230,
      ease: "Back.out"
    });
  }

  private addFloatingText(text: string, x: number, y: number, color: number): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "30px",
      color: `#${color.toString(16).padStart(6, "0")}`,
      fontStyle: "bold",
      stroke: "#3a1802",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(40);

    this.tweens.add({
      targets: label,
      y: y - 38,
      alpha: 0,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 780,
      ease: "Sine.out",
      onComplete: () => label.destroy()
    });
  }

  private basketX(): number {
    return this.farmer.x;
  }

  private basketY(): number {
    return WORLD.farmerBottomY - WORLD.basketOffsetY;
  }

  private toggleSound(): void {
    const on = AudioEngine.instance.toggle();
    const label = this.soundButton?.list.find((item: Phaser.GameObjects.GameObject) => item instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text | undefined;
    label?.setText(`Sound: ${on ? "On" : "Off"}`);
  }

  private togglePause(): void {
    if (this.misses >= WORLD.maxMisses) return;
    this.pausedGame = !this.pausedGame;
    if (this.pausedGame) this.showPauseOverlay();
    else this.hidePauseOverlay();
  }

  private showPauseOverlay(): void {
    if (this.pauseOverlay) return;
    const overlay = this.add.container(0, 0).setDepth(100);
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.54);
    dim.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    const panel = addPanel(this, GAME_WIDTH / 2 - 250, GAME_HEIGHT / 2 - 170, 500, 340, 0.94);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 92, "Paused", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "58px",
      color: "#ffe7a8",
      fontStyle: "bold",
      stroke: "#5a2600",
      strokeThickness: 8
    }).setOrigin(0.5);
    const resume = addButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 6, 260, 62, "Resume", () => this.togglePause(), 30);
    const restart = addButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 88, 260, 62, "Restart", () => this.scene.restart(), 30);
    overlay.add([dim, panel, title, resume, restart]);
    this.pauseOverlay = overlay;
  }

  private hidePauseOverlay(): void {
    this.pauseOverlay?.destroy();
    this.pauseOverlay = undefined;
  }

  private endGame(time: number): void {
    this.pausedGame = true;
    AudioEngine.instance.playGameOver();
    this.time.delayedCall(750, () => {
      this.scene.start(SCENES.gameOver, {
        score: this.score,
        level: this.level,
        reason: time > 0 ? "Five eggs broke." : "Game over."
      });
    });
  }
}
