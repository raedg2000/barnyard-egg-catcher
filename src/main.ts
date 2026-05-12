import Phaser from "phaser";
import "./style.css";
import { GAME_HEIGHT, GAME_WIDTH } from "./core/constants";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#1a1008",
  pixelArt: false,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    expandParent: true
  },
  render: {
    antialias: true,
    antialiasGL: true
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);

const isTouchLikeDevice = (): boolean => {
  const hasTouch = navigator.maxTouchPoints > 0;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return hasTouch || coarsePointer;
};

const orientationWarning = document.getElementById("orientation-warning");
const landscapeButton = document.getElementById("try-landscape-button");

const refreshGameSize = (): void => {
  window.setTimeout(() => game.scale.refresh(), 80);
};

const updateOrientationWarning = (): void => {
  const isPortrait = window.innerHeight > window.innerWidth;
  const shouldShow = isTouchLikeDevice() && isPortrait;
  orientationWarning?.classList.toggle("show", shouldShow);
  document.body.classList.toggle("orientation-warning-active", shouldShow);
  refreshGameSize();
};

const tryLockLandscape = async (): Promise<void> => {
  if (!isTouchLikeDevice()) return;

  // Many browsers only allow orientation locking after a user gesture,
  // and iPad/iPhone Safari may ignore the request. The rotate overlay is
  // the reliable fallback when the API is unavailable.
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" } as FullscreenOptions);
    }
  } catch {
    // Fullscreen is optional; continue to the orientation attempt.
  }

  try {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
    await orientation.lock?.("landscape");
  } catch {
    // Orientation lock is not supported on every mobile browser.
  }

  updateOrientationWarning();
};

// Keep the canvas fitted when tablets/phones rotate or browser UI changes height.
window.addEventListener("orientationchange", () => {
  window.setTimeout(updateOrientationWarning, 250);
});
window.addEventListener("resize", updateOrientationWarning);
window.addEventListener("load", updateOrientationWarning);

landscapeButton?.addEventListener("click", () => void tryLockLandscape());
document.addEventListener("pointerdown", () => void tryLockLandscape(), { once: true });
updateOrientationWarning();
