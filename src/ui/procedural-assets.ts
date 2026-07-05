import * as PIXI from "pixi.js";

// Procedurally generate placeholder pixel art as PIXI.Texture
// This lets the demo run without any image files

function createPixelTexture(
  app: PIXI.Application,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): PIXI.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  return PIXI.Texture.from(canvas);
}

export function generatePlayerTextures(app: PIXI.Application): Record<string, PIXI.Texture[]> {
  const size = 32;
  const frames: Record<string, PIXI.Texture[]> = {};

  // Helper to draw a simple character
  function drawChar(ctx: CanvasRenderingContext2D, frame: number, facing: string) {
    // Body
    ctx.fillStyle = "#4a90d9";
    ctx.fillRect(8, 8, 16, 16);
    // Head
    ctx.fillStyle = "#ffd5a0";
    ctx.fillRect(10, 2, 12, 10);
    // Eyes
    ctx.fillStyle = "#222";
    if (facing === "down" || facing === "up") {
      ctx.fillRect(12, 5, 3, 3);
      ctx.fillRect(18, 5, 3, 3);
    } else if (facing === "left") {
      ctx.fillRect(10, 5, 3, 3);
    } else {
      ctx.fillRect(19, 5, 3, 3);
    }
    // Legs - animate
    ctx.fillStyle = "#3a3a5c";
    const legOffset = (frame % 2 === 0) ? 0 : 2;
    ctx.fillRect(9, 24, 6, 6 + legOffset);
    ctx.fillRect(17, 24, 6, 6 - legOffset + 2);
    // Weapon (sword)
    ctx.fillStyle = "#c0c0c0";
    if (facing === "right") {
      ctx.fillRect(24, 10, 4, 12);
      ctx.fillStyle = "#8b4513";
      ctx.fillRect(24, 20, 4, 4);
    } else if (facing === "left") {
      ctx.fillRect(4, 10, 4, 12);
      ctx.fillStyle = "#8b4513";
      ctx.fillRect(4, 20, 4, 4);
    }
  }

  // Idle frames (4 directions x 2 frames)
  for (const facing of ["down", "up", "left", "right"] as const) {
    frames[`idle_${facing}`] = [];
    for (let f = 0; f < 2; f++) {
      frames[`idle_${facing}`].push(
        createPixelTexture(app, size, size, (ctx) => drawChar(ctx, f, facing))
      );
    }
  }

  // Run frames (4 directions x 4 frames)
  for (const facing of ["down", "up", "left", "right"] as const) {
    frames[`run_${facing}`] = [];
    for (let f = 0; f < 4; f++) {
      frames[`run_${facing}`].push(
        createPixelTexture(app, size, size, (ctx) => drawChar(ctx, f, facing))
      );
    }
  }

  // Attack frames
  for (const facing of ["down", "up", "left", "right"] as const) {
    frames[`attack_${facing}`] = [];
    for (let f = 0; f < 3; f++) {
      frames[`attack_${facing}`].push(
        createPixelTexture(app, size, size, (ctx) => {
          drawChar(ctx, 0, facing);
          // Attack slash effect
          ctx.fillStyle = `rgba(255, 255, 200, ${0.8 - f * 0.3})`;
          if (facing === "right") ctx.fillRect(28, 4, 8 + f * 4, 24);
          else if (facing === "left") ctx.fillRect(-4 - f * 4, 4, 8 + f * 4, 24);
          else if (facing === "down") ctx.fillRect(4, 28, 24, 8 + f * 4);
          else ctx.fillRect(4, -4 - f * 4, 24, 8 + f * 4);
        })
      );
    }
  }

  return frames;
}

export function generateEnemyTextures(app: PIXI.Application): Record<string, PIXI.Texture[]> {
  const size = 32;
  const frames: Record<string, PIXI.Texture[]> = {};

  function drawSlime(ctx: CanvasRenderingContext2D, frame: number, color: string) {
    const squish = frame % 2 === 0 ? 0 : 2;
    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(16, 20 + squish, 12, 10 - squish, 0, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.ellipse(12, 16 + squish, 4, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#fff";
    ctx.fillRect(10, 16 + squish, 5, 5);
    ctx.fillRect(18, 16 + squish, 5, 5);
    ctx.fillStyle = "#222";
    ctx.fillRect(12, 18 + squish, 2, 2);
    ctx.fillRect(20, 18 + squish, 2, 2);
  }

  // Slime idle
  frames["slime_idle"] = [];
  for (let f = 0; f < 4; f++) {
    frames["slime_idle"].push(
      createPixelTexture(app, size, size, (ctx) => drawSlime(ctx, f, "#5cb85c"))
    );
  }

  // Slime hurt
  frames["slime_hurt"] = [];
  for (let f = 0; f < 2; f++) {
    frames["slime_hurt"].push(
      createPixelTexture(app, size, size, (ctx) => {
        drawSlime(ctx, 0, "#ff6b6b");
      })
    );
  }

  // Red slime (stronger)
  frames["red_slime_idle"] = [];
  for (let f = 0; f < 4; f++) {
    frames["red_slime_idle"].push(
      createPixelTexture(app, size, size, (ctx) => drawSlime(ctx, f, "#d9534f"))
    );
  }

  return frames;
}

export function generateTileTextures(app: PIXI.Application): Record<string, PIXI.Texture> {
  const size = 32;
  const tiles: Record<string, PIXI.Texture> = {};

  // Grass
  tiles["grass"] = createPixelTexture(app, size, size, (ctx) => {
    ctx.fillStyle = "#4a8c3f";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#5a9c4f";
    for (let i = 0; i < 8; i++) {
      const x = (i * 13 + 5) % size;
      const y = (i * 7 + 3) % size;
      ctx.fillRect(x, y, 2, 2);
    }
  });

  // Dirt path
  tiles["dirt"] = createPixelTexture(app, size, size, (ctx) => {
    ctx.fillStyle = "#8b7355";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#9b8365";
    for (let i = 0; i < 6; i++) {
      ctx.fillRect((i * 11 + 3) % size, (i * 7 + 5) % size, 3, 2);
    }
  });

  // Wall
  tiles["wall"] = createPixelTexture(app, size, size, (ctx) => {
    ctx.fillStyle = "#6b6b6b";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#888";
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, 0, 2, size);
    ctx.fillStyle = "#555";
    ctx.fillRect(0, size - 2, size, 2);
    ctx.fillRect(size - 2, 0, 2, size);
    // Brick lines
    ctx.fillStyle = "#5a5a5a";
    ctx.fillRect(0, 14, size, 2);
    ctx.fillRect(15, 0, 2, 14);
    ctx.fillRect(8, 16, 2, 16);
  });

  // Water
  tiles["water"] = createPixelTexture(app, size, size, (ctx) => {
    ctx.fillStyle = "#3a7bd5";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#5a9be5";
    for (let i = 0; i < 4; i++) {
      ctx.fillRect((i * 10 + 2) % size, (i * 8 + 10) % size, 8, 2);
    }
  });

  // Tree trunk
  tiles["tree"] = createPixelTexture(app, size, size, (ctx) => {
    // Trunk
    ctx.fillStyle = "#8b5e3c";
    ctx.fillRect(12, 16, 8, 16);
    // Canopy
    ctx.fillStyle = "#2d8c2d";
    ctx.beginPath();
    ctx.ellipse(16, 12, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a9c3a";
    ctx.beginPath();
    ctx.ellipse(12, 10, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Chest
  tiles["chest"] = createPixelTexture(app, size, size, (ctx) => {
    ctx.fillStyle = "#8b5e3c";
    ctx.fillRect(6, 14, 20, 14);
    ctx.fillStyle = "#a0724c";
    ctx.fillRect(6, 14, 20, 4);
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(14, 18, 4, 4);
    ctx.fillStyle = "#6b4226";
    ctx.fillRect(6, 12, 20, 3);
  });

  // Flowers
  tiles["flowers"] = createPixelTexture(app, size, size, (ctx) => {
    ctx.fillStyle = "#4a8c3f";
    ctx.fillRect(0, 0, size, size);
    const colors = ["#ff6b6b", "#ffd93d", "#c084fc", "#ff9cf5"];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect((i * 7 + 4) % 26 + 2, (i * 5 + 6) % 24 + 4, 4, 4);
      ctx.fillStyle = "#3a7c2f";
      ctx.fillRect((i * 7 + 5) % 26 + 3, (i * 5 + 10) % 24 + 4, 2, 4);
    }
  });

  return tiles;
}