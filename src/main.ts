import * as PIXI from "pixi.js";
import { CONFIG } from "./config";
import { GameplayScene } from "./scenes/gameplay-scene";
import { TitleScreen } from "./ui/title-screen";

async function main() {
  const app = new PIXI.Application({
    width: CONFIG.CANVAS_WIDTH,
    height: CONFIG.CANVAS_HEIGHT,
    backgroundColor: 0x1a1a2e,
    antialias: false,
    resolution: 1,
  });

  const container = document.getElementById("game-container")!;
  container.appendChild(app.view as HTMLCanvasElement);

  // Pixel art mode
  PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

  // Create scene (assets load separately below)
  const scene = new GameplayScene(app);

  // Show title screen immediately
  const titleScreen = new TitleScreen();
  titleScreen.show();

  // Start preloading assets in the background with fake progress
  let fakeProgress = 0;
  const progressInterval = setInterval(() => {
    if (fakeProgress < 0.85) {
      fakeProgress += 0.015 + Math.random() * 0.025;
      titleScreen.setLoadProgress(Math.min(fakeProgress, 0.85));
    }
  }, 100);

  scene.loadAssets().then(() => {
    clearInterval(progressInterval);
    titleScreen.setLoadDone();
  });

  // When user clicks start (and assets are ready), begin the game
  titleScreen.setOnStart(() => {
    startGame(app, scene);
  });
}

function startGame(app: PIXI.Application, scene: GameplayScene) {
  // Hide title elements
  const titleEl = document.getElementById("title-screen");
  const loadEl = document.getElementById("title-loading-overlay");
  if (titleEl) titleEl.style.display = "none";
  if (loadEl) loadEl.style.display = "none";

  // Add scene to stage
  app.stage.addChild(scene.container);

  // Resize handler
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    app.renderer.resize(w, h);
    scene.resize(w, h);
  }
  window.addEventListener("resize", onResize);
  onResize();

  // Game loop
  app.ticker.maxFPS = 60;
  app.ticker.add(() => {
    const dt = Math.min(app.ticker.deltaMS / 1000, 0.05);
    scene.update(dt);
  });
}

main().catch(console.error);