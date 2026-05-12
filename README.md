# Barnyard Egg Catcher — TypeScript + Phaser Edition

A kid-friendly HTML5 game for ages 5+. Chickens sit on a wooden bar inside a barn and lay eggs. The farmer runs left and right with a basket to catch the falling eggs before they break.

## What changed in this rewrite

- Rewritten from plain JavaScript to **TypeScript**.
- Uses **Phaser 3** as the game and animation framework.
- Uses **Vite** for a modern development/build workflow.
- Keeps the generated barn, farmer, chicken, egg, and broken-egg assets in `public/assets`.
- Includes Phaser tweens, sprite frame swapping, floating score text, start/pause/game-over screens, and browser-generated music/SFX.
- Improved farmer movement with smoother frame timing, bounce, lean, and small dust puffs while running.
- Uses **6 wider-spaced chicken lanes** instead of 10, plus subtle golden landing markers, so the basket is easier to align with falling eggs.
- Prefers a local **Pixabay Old MacDonald-style MP3** if you add it, with browser-generated music as fallback.

## Game rules

- Catch each falling egg to gain **10 points**.
- If **5 eggs break**, the player loses.
- Difficulty increases every **100 points**.
- Difficulty stops increasing at **Level 13** so the game stays playable.
- Egg timing uses a reachability algorithm so the farmer should be able to catch eggs with good movement.
- The game starts with one active falling egg, then slowly allows two and three active eggs at higher levels.
- A small catch-assist zone around the basket helps younger players when they are close but not perfectly aligned.

## Controls

- Keyboard: `Left Arrow` / `Right Arrow`, or `A` / `D`.
- Pause: `P` or `Space`.
- Touch/mouse: tap or drag the golden landing marker or lane where the basket should go.

## Requirements

Install Node.js LTS from the official Node.js website. NPM is included with Node.js.

Recommended:

- Node.js 18 or newer
- NPM 9 or newer
- A modern browser such as Edge, Chrome, Firefox, or Safari

## How to run during development

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

## How to build a production version

```bash
npm run build
```

The compiled game will be created in the `dist` folder.

To preview the production build:

```bash
npm run preview
```

## Windows PowerShell note

If Windows blocks the downloaded ZIP file, unblock it before extracting or before running scripts:

```powershell
Unblock-File .\barnyard_egg_catcher_typescript_phaser_playability_update.zip
```

If you already extracted the folder, you can unblock files recursively:

```powershell
Get-ChildItem -Recurse | Unblock-File
```

## Project structure

```text
barnyard_egg_catcher_ts/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  public/
    assets/
      audio/
        README.md
        old-macdonald-pixabay.mp3   # optional: add after downloading from Pixabay
      barn_bg.jpg
      chicken_sit.png
      egg_white.png
      farmer_right_1.png
      ...
  src/
    main.ts
    style.css
    core/
      AudioEngine.ts
      constants.ts
      types.ts
      ui.ts
    scenes/
      BootScene.ts
      MenuScene.ts
      GameScene.ts
      GameOverScene.ts
  dist/                         # created after npm run build
```

## Pixabay music setup

The game looks for this optional local MP3 file:

```text
public/assets/audio/old-macdonald-pixabay.mp3
```

Recommended Pixabay track:

- **Background childrens music for video. Old MacDonald Had a Farm 34 sec**
- Creator: **White_Records**
- URL: https://pixabay.com/music/happy-childrens-tunes-background-childrens-music-for-video-old-macdonald-had-a-farm-34-sec-188184/

Download it from Pixabay, rename it to `old-macdonald-pixabay.mp3`, and place it in `public/assets/audio/`. If the file is missing, the game automatically falls back to browser-generated music and sound effects.

## Asset notes

The included image assets were generated during this ChatGPT conversation and processed for use as game sprites. Keep the asset filenames unchanged unless you also update the paths in `src/core/constants.ts`.


## Latest Alignment Update
- Added a front-facing idle farmer sprite when the farmer is not moving.
- Changed farmer movement to snap between chicken lanes for easier play.
- Reduced the game to 5 clearly spaced chicken lanes so eggs align with the basket.


## Farmer Idle Fix
- Added `farmer_idle_right.png` and `farmer_idle_left.png`.
- The old front-facing idle image is no longer used in gameplay.
- When the farmer stops, he stands still holding the basket and faces the last movement direction.


## Mobile / Tablet Update
- Phaser now refreshes its scale on resize and orientation change.
- CSS uses `100dvh`/`100svh`, disables scrolling, and prevents browser touch gestures during play.
- Touch/tablet/phone devices show two large circular movement buttons: ◀ and ▶.
- The player can still tap a chicken lane directly to move the farmer there.
- Desktop controls remain: Arrow keys or A/D.

## Optional Startup Art
The package also includes `public/assets/startup_screen.png`, the latest barnyard title artwork without the embedded Start Game button. It can be used later as a full-screen menu background if desired.


## One-Step Mobile Controls Update
- The circular mobile/tablet buttons now move the farmer exactly one chicken lane per tap/click.
- Button touches no longer also trigger the background lane-tap handler, so they do not jump to the far-left or far-right lane.
- A small debounce prevents one physical tap from being counted twice on some touch devices.


## Tablet / Phone Landscape Update
- Moved the score HUD and Sound/Pause buttons higher and made them smaller so they no longer cover the chickens.
- Added a portrait-mode warning overlay for touch devices asking players to rotate sideways.
- Added an optional landscape-lock request after the first user tap/click. Browsers that do not support orientation lock will still show the rotate overlay.
- The game still uses Phaser Scale.FIT, so it resizes cleanly across phones, tablets, laptops, and desktops.
