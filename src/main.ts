import * as PIXI from "pixi.js";
import { CONFIG } from "./config";
import { GameplayScene } from "./scenes/gameplay-scene";

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

  // Show loading text
  const loadingText = new PIXI.Text("Loading...", {
    fontSize: 24, fill: 0xffffff, fontFamily: "monospace",
  });
  loadingText.anchor.set(0.5, 0.5);
  loadingText.position.set(app.screen.width / 2, app.screen.height / 2);
  app.stage.addChild(loadingText);

  // Create scene and load assets from files
  const scene = new GameplayScene(app);
  await scene.loadAssets();

  // Remove loading text, start game
  app.stage.removeChild(loadingText);
  loadingText.destroy();
  app.stage.addChild(scene.container);

  // Resize
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