import Phaser from "phaser";
import { ASSET_PATHS, GAME_HEIGHT, GAME_WIDTH, SCENES } from "../core/constants";
import { addPanel } from "../core/ui";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  preload(): void {
    this.cameras.main.setBackgroundColor("#1a1008");

    addPanel(this, GAME_WIDTH / 2 - 260, GAME_HEIGHT / 2 - 90, 520, 180, 0.82);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 48, "Loading Barnyard Egg Catcher", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "34px",
      color: "#fff3d1",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const barBack = this.add.graphics();
    barBack.fillStyle(0x130905, 0.8);
    barBack.fillRoundedRect(GAME_WIDTH / 2 - 190, GAME_HEIGHT / 2 + 18, 380, 26, 12);

    const bar = this.add.graphics();
    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      bar.clear();
      bar.fillStyle(0xffc15b, 1);
      bar.fillRoundedRect(GAME_WIDTH / 2 - 184, GAME_HEIGHT / 2 + 24, 368 * progress, 14, 7);
    });

    for (const [key, path] of Object.entries(ASSET_PATHS)) {
      this.load.image(key, path);
    }
  }

  create(): void {
    this.scene.start(SCENES.menu);
  }
}
