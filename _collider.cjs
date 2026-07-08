const fs = require("fs");
const NL = "\r\n";

// === 1. Add collider properties to EnemyDef interface ===
const gsFile = "C:/Users/23711/Desktop/game/src/scenes/gameplay-scene.ts";
let gs = fs.readFileSync(gsFile, "utf8");

const oldInterface = [
  "  colliderSize?: number;",
  "  detectRange?: number;",
].join(NL);

const newInterface = [
  "  colliderSize?: number;",
  "  colliderOffsetX?: number;",
  "  colliderOffsetY?: number;",
  "  colliderWidth?: number;",
  "  colliderHeight?: number;",
  "  detectRange?: number;",
].join(NL);

if (!gs.includes(oldInterface)) { console.error("interface pattern not found"); process.exit(1); }
gs = gs.replace(oldInterface, newInterface);
console.log("EnemyDef interface updated");

// === 2. Update collider creation in spawnEnemies ===
const oldCollider = [
  "      entities.addComponent(id, \"collider\", {",
  "        offsetX: 0, offsetY: 0,",
  "        width: def.colliderSize ?? size,",
  "        height: def.colliderSize ?? size,",
  "        isStatic: false, layer: \"enemy\", useForMovement: true,",
  "      });",
].join(NL);

const newCollider = [
  "      const cw = def.colliderWidth ?? def.colliderSize ?? size;",
  "      const ch = def.colliderHeight ?? def.colliderSize ?? size;",
  "      const cox = def.colliderOffsetX ?? Math.floor((size - cw) / 2);",
  "      const coy = def.colliderOffsetY ?? Math.floor((size - ch) / 2);",
  "      entities.addComponent(id, \"collider\", {",
  "        offsetX: cox, offsetY: coy,",
  "        width: cw, height: ch,",
  "        isStatic: false, layer: \"enemy\", useForMovement: true,",
  "      });",
].join(NL);

if (!gs.includes(oldCollider)) { console.error("collider pattern not found"); process.exit(1); }
gs = gs.replace(oldCollider, newCollider);
console.log("spawnEnemies collider updated");

fs.writeFileSync(gsFile, gs, "utf8");
console.log("Phase 1 done!");

