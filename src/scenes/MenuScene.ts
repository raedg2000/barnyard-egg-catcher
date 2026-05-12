import Phaser from "phaser";
import { AudioEngine } from "../core/AudioEngine";
import { ASSETS, GAME_HEIGHT, GAME_WIDTH, SCENES } from "../core/constants";
import { addButton, addPanel, coverImage } from "../core/ui";

export class MenuScene extends Phaser.Scene {
  private soundText?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, ASSETS.barn).setOrigin(0.5);
    coverImage(bg, GAME_WIDTH, GAME_HEIGHT);

    const veil = this.add.graphics();
    veil.fillStyle(0x000000, 0.36);
    veil.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    addPanel(this, 92, 74, 540, 532, 0.86);

    this.add.text(126, 104, "Barnyard", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "70px",
      color: "#ffe7a8",
      fontStyle: "bold",
      stroke: "#5a2600",
      strokeThickness: 8
    });
    this.add.text(132, 174, "Egg Catcher", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "58px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#5a2600",
      strokeThickness: 7
    });

    this.add.text(136, 252, "Catch the eggs before they break!", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "28px",
      color: "#fff1cc",
      fontStyle: "bold"
    });

    this.add.text(136, 296, "Move the farmer left and right.\nEvery egg is 10 points.\nFive broken eggs ends the game.\nDifficulty increases every 100 points\nand stops increasing at Level 13.", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "23px",
      color: "#ffe9b2",
      lineSpacing: 7
    });

    addButton(this, 284, 502, 330, 72, "Start Game", () => {
      AudioEngine.instance.startMusic();
      this.scene.start(SCENES.game);
    }, 34);

    addButton(this, 1128, 52, 190, 52, "Sound: On", () => this.toggleSound(), 22);
    this.soundText = this.add.text(1128, 52, "", { fontSize: "1px" });

    const farmer = this.add.image(905, 653, ASSETS.farmerRight1).setOrigin(0.5, 1).setScale(0.36);
    const chicken = this.add.image(742, 596, ASSETS.chickenTada).setOrigin(0.5, 1).setScale(0.38);
    const egg = this.add.image(1012, 346, ASSETS.eggWhite).setScale(0.12).setRotation(0.12);

    this.tweens.add({ targets: farmer, y: 641, duration: 520, ease: "Sine.inOut", yoyo: true, repeat: -1 });
    this.tweens.add({ targets: chicken, rotation: 0.08, duration: 420, ease: "Sine.inOut", yoyo: true, repeat: -1 });
    this.tweens.add({ targets: egg, y: 520, alpha: 0.25, duration: 1450, ease: "Sine.in", yoyo: false, repeat: -1, repeatDelay: 250 });

    this.input.keyboard?.once("keydown-ENTER", () => {
      AudioEngine.instance.startMusic();
      this.scene.start(SCENES.game);
    });
  }

  private toggleSound(): void {
    const on = AudioEngine.instance.toggle();
    // Update all button labels that contain Sound. The button helper keeps its text as a child.
    for (const child of this.children.list) {
      if (child instanceof Phaser.GameObjects.Container) {
        const text = child.list.find((item: Phaser.GameObjects.GameObject) => item instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text | undefined;
        if (text?.text.startsWith("Sound:")) text.setText(`Sound: ${on ? "On" : "Off"}`);
      }
    }
    this.soundText?.setText(on ? "on" : "off");
  }
}
