import Phaser from "phaser";
import { AudioEngine } from "../core/AudioEngine";
import { ASSETS, GAME_HEIGHT, GAME_WIDTH, SCENES } from "../core/constants";
import type { GameOverData } from "../core/types";
import { addButton, addPanel, coverImage } from "../core/ui";

export class GameOverScene extends Phaser.Scene {
  private dataPayload: GameOverData = { score: 0, level: 1, reason: "Game over." };

  constructor() {
    super(SCENES.gameOver);
  }

  init(data: GameOverData): void {
    this.dataPayload = data;
  }

  create(): void {
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, ASSETS.barn).setOrigin(0.5);
    coverImage(bg, GAME_WIDTH, GAME_HEIGHT);

    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.52);
    dim.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    addPanel(this, GAME_WIDTH / 2 - 330, GAME_HEIGHT / 2 - 220, 660, 430, 0.9);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 144, "Game Over", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "72px",
      color: "#ffe7a8",
      fontStyle: "bold",
      stroke: "#5a2600",
      strokeThickness: 9
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 62, this.dataPayload.reason, {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "28px",
      color: "#fff4d4",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 4, `Final Score: ${this.dataPayload.score}\nLevel Reached: ${this.dataPayload.level}`, {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "34px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      lineSpacing: 12
    }).setOrigin(0.5);

    addButton(this, GAME_WIDTH / 2 - 154, GAME_HEIGHT / 2 + 154, 260, 62, "Play Again", () => {
      AudioEngine.instance.resume();
      this.scene.start(SCENES.game);
    }, 30);

    addButton(this, GAME_WIDTH / 2 + 172, GAME_HEIGHT / 2 + 154, 260, 62, "Main Menu", () => {
      this.scene.start(SCENES.menu);
    }, 30);

    this.add.image(GAME_WIDTH / 2 + 420, GAME_HEIGHT / 2 + 162, ASSETS.eggBrokenWhite).setScale(0.19).setRotation(-0.06);
    this.input.keyboard?.once("keydown-ENTER", () => this.scene.start(SCENES.game));
  }
}
