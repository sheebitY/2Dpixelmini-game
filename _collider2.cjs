const fs = require("fs");
const NL = "\r\n";
const gsFile = "C:/Users/23711/Desktop/game/src/scenes/gameplay-scene.ts";
let gs = fs.readFileSync(gsFile, "utf8");

// Add custom collider values to each monster type
// slime: size 72, sprite has some transparent space -> collider slightly smaller, centered
gs = gs.replace(
  /slime: \{[\s\S]*?anchorOffsetX: 0, anchorOffsetY: 0,\n  \},/,
  `slime: {
    hp: 25, atk: 6, def: 1, speed: 50, exp: 10,
    animKey: "idle", size: 72,
    animFps: { idle: 6 },
    attackDuration: 0.3, damageFrameRatio: 0.4,
    detectRange: 250, attackRange: 55, attackCooldown: 1.4,
    colliderWidth: 48, colliderHeight: 48, colliderOffsetX: 12, colliderOffsetY: 16,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },`
);

// goblin1: size 80
gs = gs.replace(
  /goblin1: \{[\s\S]*?anchorOffsetX: 0, anchorOffsetY: 0,\n  \},/,
  `goblin1: {
    hp: 35, atk: 8, def: 2, speed: 60, exp: 15,
    animKey: "idle", size: 80,
    anims: { idle: "idle", patrol: "walk", chase: "walk", attack: "attack" },
    animFps: { idle: 8, walk: 10, attack: 16 },
    hurtAnim: "hurt", deathAnim: "die",
    attackDuration: 0.5, damageFrameRatio: 0.4,
    detectRange: 280, attackRange: 55, attackCooldown: 1.2,
    colliderWidth: 44, colliderHeight: 56, colliderOffsetX: 18, colliderOffsetY: 16,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },`
);

// red_slime: size 72
gs = gs.replace(
  /red_slime: \{[\s\S]*?anchorOffsetX: 0, anchorOffsetY: 0,\n  \},/,
  `red_slime: {
    hp: 50, atk: 10, def: 3, speed: 55, exp: 22,
    animKey: "idle", size: 72,
    animFps: { idle: 8 },
    attackDuration: 0.3, damageFrameRatio: 0.4,
    detectRange: 300, attackRange: 60, attackCooldown: 1.2,
    colliderWidth: 48, colliderHeight: 48, colliderOffsetX: 12, colliderOffsetY: 16,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },`
);

// goblin2: size 96
gs = gs.replace(
  /goblin2: \{[\s\S]*?anchorOffsetX: 0, anchorOffsetY: 0,\n  \},/,
  `goblin2: {
    hp: 55, atk: 11, def: 3, speed: 55, exp: 25,
    animKey: "idle", size: 96,
    anims: { idle: "idle", patrol: "walk", chase: "walk", attack: "attack" },
    animFps: { idle: 8, walk: 10, attack: 20 },
    hurtAnim: "hurt", deathAnim: "die",
    attackDuration: 0.6, damageFrameRatio: 0.5,
    detectRange: 320, attackRange: 60, attackCooldown: 1.3,
    colliderWidth: 50, colliderHeight: 68, colliderOffsetX: 23, colliderOffsetY: 22,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },`
);

// eagle: size 96, flying bird -> wider, shorter collider
gs = gs.replace(
  /eagle: \{[\s\S]*?canFly: true,\n    anchorOffsetX: 0, anchorOffsetY: 0,\n  \},/,
  `eagle: {
    hp: 45, atk: 12, def: 2, speed: 85, exp: 28,
    animKey: "fly", size: 96,
    animFps: { fly: 12 },
    attackDuration: 0.4, damageFrameRatio: 0.4,
    detectRange: 400, attackRange: 70, attackCooldown: 1.0,
    canFly: true,
    colliderWidth: 56, colliderHeight: 40, colliderOffsetX: 20, colliderOffsetY: 28,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },`
);

// goblin3: size 80
gs = gs.replace(
  /goblin3: \{[\s\S]*?anchorOffsetX: 0, anchorOffsetY: 0,\n  \},/,
  `goblin3: {
    hp: 65, atk: 13, def: 4, speed: 75, exp: 35,
    animKey: "idle", size: 80,
    anims: { idle: "idle", patrol: "run", chase: "run", attack: "attack" },
    animFps: { idle: 8, run: 12, attack: 14 },
    hurtAnim: "hurt", deathAnim: "die",
    attackDuration: 0.4, damageFrameRatio: 0.4,
    detectRange: 350, attackRange: 55, attackCooldown: 1.1,
    colliderWidth: 44, colliderHeight: 56, colliderOffsetX: 18, colliderOffsetY: 16,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },`
);

// skeleton: size 96
gs = gs.replace(
  /skeleton: \{[\s\S]*?anchorOffsetX: 0, anchorOffsetY: 0,\n  \},/,
  `skeleton: {
    hp: 75, atk: 15, def: 5, speed: 50, exp: 40,
    animKey: "idle", size: 96,
    anims: { idle: "idle", patrol: "move", chase: "move", attack: "attack" },
    animFps: { idle: 10, move: 12, attack: 22 },
    deathAnim: "death",
    attackDuration: 0.8, damageFrameRatio: 0.5,
    detectRange: 350, attackRange: 75, attackCooldown: 1.4,
    colliderWidth: 48, colliderHeight: 72, colliderOffsetX: 24, colliderOffsetY: 18,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },`
);

// goblin4: size 96, has colliderSize: 80
gs = gs.replace(
  /goblin4: \{[\s\S]*?colliderSize: 80,\n    detectRange: 350, attackRange: 65, attackCooldown: 1.4,\n    anchorOffsetX: 0, anchorOffsetY: 0,\n  \},/,
  `goblin4: {
    hp: 90, atk: 18, def: 7, speed: 40, exp: 48,
    animKey: "idle", size: 96,
    anims: { idle: "idle", patrol: "walk", chase: "walk", attack: "attack" },
    animFps: { idle: 6, walk: 10, attack: 16 },
    attackDuration: 0.8, damageFrameRatio: 0.5,
    deathAnim: "die",
    colliderWidth: 56, colliderHeight: 68, colliderOffsetX: 20, colliderOffsetY: 20,
    detectRange: 350, attackRange: 65, attackCooldown: 1.4,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },`
);

// orc: size 256, has colliderSize: 100
gs = gs.replace(
  /orc: \{[\s\S]*?colliderSize: 100,\n    detectRange: 380, attackRange: 65, attackCooldown: 1.3,\n    anchorOffsetX: 0, anchorOffsetY: -20,\n  \},/,
  `orc: {
    hp: 110, atk: 20, def: 8, speed: 45, exp: 55,
    animKey: "idle", size: 256,
    anims: { idle: "idle", patrol: "move", chase: "move", attack: "attack" },
    animFps: { idle: 6, move: 10, attack: 6 },
    attackDuration: 0.8, damageFrameRatio: 0.5,
    colliderWidth: 80, colliderHeight: 90, colliderOffsetX: 88, colliderOffsetY: 130,
    detectRange: 380, attackRange: 65, attackCooldown: 1.3,
    anchorOffsetX: 0, anchorOffsetY: -20,
  },`
);

fs.writeFileSync(gsFile, gs, "utf8");
console.log("All monster colliders updated!");

