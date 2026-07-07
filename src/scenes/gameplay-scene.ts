import * as PIXI from "pixi.js";
import { CONFIG } from "../config";
import { entities } from "../ecs/entity-manager";
import { eventBus } from "../core/event-bus";
import { input } from "../core/input-manager";
import { movementSystem } from "../ecs/systems/movement-system";
import { aiSystem } from "../ecs/systems/ai-system";
import { combatSystem } from "../ecs/systems/combat-system";
import { HUD } from "../ui/hud";
import { DialogBox } from "../ui/dialog-box";
import { InventoryUI } from "../ui/inventory-ui";
import { Hotbar } from "../ui/hotbar";
import { inventory } from "../items/inventory";
import { ENEMY_LOOT_TABLE } from "../items/item-db";
import { equipment } from "../items/equipment";
import { loadGame, setPlayerStateGetter, saveGame, initAutoSave, type SaveData } from "../core/save-manager";
import { mapManager, MapState, Portal } from "../world/map-manager";
import {
  loadPlayerTextures,
  loadEnemyTextures,
  loadTileset,
  loadNPCTextures,
  PlayerAnimSet,
} from "../core/sprite-loader";

// Player definitions
interface PlayerDef {
  hp: number;
  atk: number;
  def: number;
  speed: number;
  size: number;
  attackRange: number;
  attackCooldown: number;
  invincibleTime: number;
  anchorOffsetX: number;
  anchorOffsetY: number;
  colliderOffsetX: number;
  colliderOffsetY: number;
  colliderWidth: number;
  colliderHeight: number;
}

const PLAYER_DEF: PlayerDef = {
  hp: 100, atk: 15, def: 5, speed: 240,
  size: 128,
  attackRange: 120, attackCooldown: 0.4, invincibleTime: 0.5,
  anchorOffsetX: 0, anchorOffsetY: 0,
  colliderOffsetX: 34, colliderOffsetY: 54,
  colliderWidth: 55, colliderHeight: 55,
};

// Enemy type definitions
interface EnemyDef {
  hp: number;
  atk: number;
  def: number;
  speed: number;
  exp: number;
  animKey: string;
  size: number;
  anims?: Record<string, string>;
  animFps?: Record<string, number>;
  attackDuration: number;
  damageFrameRatio: number;
  hurtAnim?: string;
  deathAnim?: string;
  hurtDuration?: number;
  colliderSize?: number;
  detectRange?: number;
  attackRange?: number;
  attackCooldown?: number;
  anchorOffsetX?: number;
  anchorOffsetY?: number;
}

const ENEMY_DEFS: Record<string, EnemyDef> = {
  slime: {
    hp: 30, atk: 8, def: 2, speed: 50, exp: 15,
    animKey: "idle", size: 72,
    animFps: { idle: 6 },
    attackDuration: 0.3, damageFrameRatio: 0.4,
    detectRange: 300, attackRange: 60, attackCooldown: 1.2,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  red_slime: {
    hp: 60, atk: 12, def: 4, speed: 60, exp: 25,
    animKey: "idle", size: 72,
    animFps: { idle: 8 },
    attackDuration: 0.3, damageFrameRatio: 0.4,
    detectRange: 350, attackRange: 70, attackCooldown: 1.0,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  eagle: {
    hp: 50, atk: 14, def: 3, speed: 80, exp: 30,
    animKey: "fly", size: 96,
    animFps: { fly: 12 },
    attackDuration: 0.4, damageFrameRatio: 0.4,
    detectRange: 500, attackRange: 80, attackCooldown: 0.8,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  skeleton: {
    hp: 80, atk: 16, def: 6, speed: 55, exp: 40,
    animKey: "idle", size: 96,
    anims: { idle: "idle", patrol: "move", chase: "move", attack: "attack" },
    animFps: { idle: 10, move: 12, attack: 22 },
    deathAnim: "death",
    attackDuration: 1.0, damageFrameRatio: 0.5,
    detectRange: 400, attackRange: 90, attackCooldown: 1.5,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  orc: {
    hp: 100, atk: 18, def: 8, speed: 45, exp: 50,
    animKey: "idle", size: 256,
    anims: { idle: "idle", patrol: "move", chase: "move", attack: "attack" },
    animFps: { idle: 6, move: 10, attack: 6 },
    attackDuration: 0.8, damageFrameRatio: 0.5,
    colliderSize: 100,
    detectRange: 450, attackRange: 70, attackCooldown: 1.2,
    anchorOffsetX: 0, anchorOffsetY: -20,
  },
  goblin1: {
    hp: 40, atk: 10, def: 3, speed: 70, exp: 20,
    animKey: "idle", size: 80,
    anims: { idle: "idle", patrol: "walk", chase: "walk", attack: "attack" },
    animFps: { idle: 8, walk: 10, attack: 16 },
    hurtAnim: "hurt",
    attackDuration: 0.5, damageFrameRatio: 0.4,
    detectRange: 350, attackRange: 60, attackCooldown: 1.0,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  goblin2: {
    hp: 65, atk: 14, def: 5, speed: 55, exp: 35,
    animKey: "idle", size: 96,
    anims: { idle: "idle", patrol: "walk", chase: "walk", attack: "attack" },
    animFps: { idle: 8, walk: 10, attack: 20 },
    attackDuration: 0.7, damageFrameRatio: 0.5,
    detectRange: 400, attackRange: 70, attackCooldown: 1.3,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  goblin3: {
    hp: 50, atk: 12, def: 4, speed: 90, exp: 30,
    animKey: "idle", size: 80,
    anims: { idle: "idle", patrol: "run", chase: "run", attack: "attack" },
    animFps: { idle: 8, run: 12, attack: 14 },
    hurtAnim: "hurt",
    attackDuration: 0.4, damageFrameRatio: 0.4,
    detectRange: 450, attackRange: 65, attackCooldown: 0.9,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  goblin4: {
    hp: 90, atk: 16, def: 7, speed: 40, exp: 45,
    animKey: "idle", size: 96,
    anims: { idle: "idle", patrol: "walk", chase: "walk", attack: "attack" },
    animFps: { idle: 6, walk: 10, attack: 16 },
    attackDuration: 0.9, damageFrameRatio: 0.5,
    colliderSize: 80,
    detectRange: 400, attackRange: 75, attackCooldown: 1.4,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
};

// NPC definitions
interface NPCDef {
  name: string;
  dialog: string[];
  animKey: string;
  size: number;
  animFps?: Record<string, number>;
  colliderSize?: number;
  colliderOffsetX?: number;
  colliderOffsetY?: number;
  interactionRange?: number;
}

const NPC_DEFS: Record<string, NPCDef> = {
  sweeper: {
    name: "Old Sweeper",
    dialog: [
      "Ah, a young adventurer... This village was once peaceful.",
      "But monsters have appeared from the dungeon to the east.",
      "If you can clear them out, the villagers would be grateful.",
      "Be careful of the eagles - they are fast and fierce!",
    ],
    animKey: "sweep",
    animFps: { sweep: 10 },
    size: 96,
    colliderSize: 80,        // 姣旀樉绀哄昂瀵稿皬涓€鐐癸紝閬垮厤鍗′汉
    colliderOffsetX: 0,
    colliderOffsetY: 0,
    interactionRange: 128,
  },
  blacksmith: {
    name: "Blacksmith",
    dialog: [
      "Welcome! I forge the finest weapons in the village.",
      "Need something sharpened? I can help with that.",
      "Be careful out there - the dungeon is dangerous.",
    ],
    animKey: "idle",
    animFps: { idle: 6 },
    size: 96,
    colliderSize: 80,
    colliderOffsetX: 0,
    colliderOffsetY: 0,
    interactionRange: 128,
  },
  merchant: {
    name: "Merchant",
    dialog: [
      "Welcome! I have all sorts of goods for sale.",
      "Potions, scrolls, equipment... take your pick!",
      "Come back anytime you need supplies.",
    ],
    animKey: "idle",
    animFps: { idle: 6 },
    size: 96,
    colliderSize: 80,
    colliderOffsetX: 0,
    colliderOffsetY: 0,
    interactionRange: 128,
  },
};

interface NPCSpawnConfig {
  mapId: string;
  npcKey: string;
  type: string;
  baseX: number; // tile
  baseY: number; // tile
  dialogOverride?: string[];
}

const NPC_SPAWN_SET: NPCSpawnConfig[] = [
  // 鍙�?meadow_village �?sweeper锛屽苟缁欎竴涓槑纭潗鏍囷紙涓嶈鍐嶇�?mapCols/mapRows 浜嗭�?
  { mapId: "meadow_village", npcKey: "sweeper", type: "sweeper", baseX: 15, baseY: 10 },
  { mapId: "meadow_village", npcKey: "blacksmith", type: "blacksmith", baseX: 8, baseY: 6 },
  { mapId: "meadow_village", npcKey: "merchant", type: "merchant", baseX: 16, baseY: 6 },
  // 鍚庣画鍔燦PC灏辩户缁線杩欓噷杩藉姞�?  // { mapId: "forest_path", npcKey: "hermit", type: "hermit", baseX: 12, baseY: 6 },
];

export class GameplayScene {
  container: PIXI.Container;
  private app: PIXI.Application;
  private collisionMap: number[][] = [];
  private tileMap: number[][] = [];
  private tileContainer: PIXI.Container;
  private entityContainer: PIXI.Container;
  private hud: HUD;
  private dialogBox: DialogBox;
  private inventoryUI: InventoryUI;
  private hotbar: Hotbar;
  private playerTextures: Record<string, PlayerAnimSet> = {};
  private enemyTextures: Map<string, Record<string, PIXI.Texture[]>> = new Map();
  private npcTextures: Map<string, Record<string, PIXI.Texture[]>> = new Map();
  private tileTextures: Record<string, PIXI.Texture> = {};
  private spriteMap = new Map<number, PIXI.Sprite | PIXI.AnimatedSprite>();
  private healthBarMap = new Map<number, PIXI.Graphics>();
  private entityEnemyType = new Map<number, string>();
  private npcEntities: Map<number, string> = new Map();
  private now = 0;
  private gameOver = false;
  private gameOverText: PIXI.Text | null = null;
  private loaded = false;
  private dialogActive = false;
  private playerAttackUntil = 0;
  private playerHitUntil = 0;
  private portalCooldownUntil = 0;
  private currentMap: MapState | null = null;
  // Temporary stat buffs from consumables
  private buffAtk = 0;
  private buffAtkUntil = 0;
  private buffDef = 0;
  private buffDefUntil = 0;
  private baseAtk = PLAYER_DEF.atk;
  private baseDef = PLAYER_DEF.def;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.tileContainer = new PIXI.Container();
    this.entityContainer = new PIXI.Container();
    this.container.addChild(this.tileContainer);
    this.container.addChild(this.entityContainer);

    this.hud = new HUD();
    this.app.stage.addChild(this.hud.container);
    this.hud.setWorldContainer(this.entityContainer);

    this.dialogBox = new DialogBox(app.screen.width, app.screen.height);
    this.app.stage.addChild(this.dialogBox.container);

    // Inventory UI
    this.inventoryUI = new InventoryUI();
    this.inventoryUI.onUse((slotIndex) => this.useInventoryItem(slotIndex));

    // Hotbar
    this.hotbar = new Hotbar();
    this.hotbar.onUse((slotIndex) => this.useInventoryItem(slotIndex));

    // In-game settings button
    const settingsBtn = document.getElementById("settings-btn-ingame");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        const overlay = document.getElementById("settings-overlay")!;
        overlay.style.display = "flex";
        requestAnimationFrame(() => overlay.classList.add("visible"));
      });
    }

    eventBus.on("equipment_changed", () => this.applyEquipmentBonus());

    // Expose player state to save manager
    setPlayerStateGetter(() => this.getPlayerState());

    eventBus.on("player_died", () => {
      this.gameOver = true;
    });
    eventBus.on("player_attacked", () => {
      this.playerAttackUntil = this.now + PLAYER_DEF.attackCooldown;
    });

    // Listen for enemy kills 閿熸枻鎷?roll loot
    eventBus.on("enemy_killed", (data: { enemyId: number; enemyType: string; exp: number; x: number; y: number }) => {
      this.rollLoot(data.enemyType, data.x, data.y);
    });
  }

  // 閿熸枻鎷烽敓鏂ゆ�?Item usage (called by InventoryUI) 閿熸枻鎷烽敓鏂ゆ�?

  private useInventoryItem(slotIndex: number): void {
    const playerIds = entities.query("health", "stats").filter((id) => !entities.hasComponent(id, "ai"));
    if (playerIds.length === 0) return;
    const pid = playerIds[0];

    const consumed = inventory.useSlot(slotIndex, {
      heal: (amount) => {
        const hp = entities.getComponent(pid, "health")!;
        hp.current = Math.min(hp.max, hp.current + amount);
      },
      boostAtk: (amount, duration) => {
        this.buffAtk = amount;
        this.buffAtkUntil = this.now + duration;
        const stats = entities.getComponent(pid, "stats")!;
        stats.atk += amount;
      },
      boostDef: (amount, duration) => {
        this.buffDef = amount;
        this.buffDefUntil = this.now + duration;
        const stats = entities.getComponent(pid, "stats")!;
        stats.def += amount;
      },
    });
  }

  // 閿熸枻鎷烽敓鏂ゆ�?Loot rolling on enemy kill 閿熸枻鎷烽敓鏂ゆ�?

  private applyEquipmentBonus(): void {
    const playerIds = entities.query("stats").filter((id) => !entities.hasComponent(id, "ai"));
    if (playerIds.length === 0) return;
    const stats = entities.getComponent(playerIds[0], "stats")!;
    const hp = entities.getComponent(playerIds[0], "health")!;
    const bonus = equipment.getBonus();
    stats.atk = this.baseAtk + bonus.atk + this.buffAtk;
    stats.def = this.baseDef + bonus.def + this.buffDef;
    if (hp) {
      hp.max = PLAYER_DEF.hp + bonus.hp;
      hp.current = Math.min(hp.current, hp.max);
    }
  }

  /** Collect current player state for the save manager. */
  private getPlayerState(): SaveData["player"] | null {
    const playerIds = entities.query("health", "stats").filter((id) => !entities.hasComponent(id, "ai"));
    if (playerIds.length === 0) return null;
    const pid = playerIds[0];
    const hp = entities.getComponent(pid, "health")!;
    const stats = entities.getComponent(pid, "stats")!;
    const tf = entities.getComponent(pid, "transform")!;
    const ts = CONFIG.TILE_SIZE;

    return {
      level: this.hud.level,
      exp: this.hud.exp,
      expToLevel: this.hud.expToLevel,
      hp: hp.current,
      maxHp: hp.max,
      baseAtk: this.baseAtk,
      baseDef: this.baseDef,
      mapId: this.currentMap?.id ?? "meadow_village",
      x: Math.round(tf.x / ts),
      y: Math.round(tf.y / ts),
    };
  }

  /** Apply loaded save data after initial map load. */
  private async applySave(): Promise<void> {
    const save = loadGame();
    if (!save) {
      initAutoSave();
      saveGame();
      return;
    }

    // If saved map differs from current, load it
    if (save.player.mapId && save.player.mapId !== this.currentMap?.id) {
      await this.loadMap(save.player.mapId, { x: save.player.x, y: save.player.y });
    }

    // Restore inventory
    inventory.clear();
    for (let i = 0; i < save.inventory.length; i++) {
      const slot = save.inventory[i];
      if (slot) inventory.setSlot(i, slot.itemId, slot.quantity);
    }

    // Restore equipment
    equipment.clear();
    const eq = save.equipment;
    for (const key of Object.keys(eq) as (keyof typeof eq)[]) {
      const itemId = eq[key];
      if (itemId) equipment.equip(key, itemId);
    }

    // Restore HUD level/exp
    this.hud.restoreLevel(save.player.level, save.player.exp, save.player.expToLevel);

    // Restore player stats (fallback to PLAYER_DEF if save has 0)
    this.baseAtk = save.player.baseAtk || PLAYER_DEF.atk;
    this.baseDef = save.player.baseDef || PLAYER_DEF.def;
    this.applyEquipmentBonus();

    // Restore HP
    const playerIds = entities.query("health").filter((id) => !entities.hasComponent(id, "ai"));
    if (playerIds.length > 0) {
      const hp = entities.getComponent(playerIds[0], "health")!;
      hp.max = save.player.maxHp;
      hp.current = Math.min(save.player.hp, hp.max);
    }

    initAutoSave();
  }

  private rollLoot(enemyType: string, x: number, y: number): void {
    const table = ENEMY_LOOT_TABLE[enemyType];
    if (!table) return;

    for (const entry of table) {
      if (Math.random() < entry.chance) {
        const overflow = inventory.addItem(entry.itemId, 1);
        if (overflow === 0) {
          eventBus.emit("item_picked_up", { itemId: entry.itemId, quantity: 1, x, y });
        }
      }
    }
  }

  // 閿熸枻鎷烽敓鏂ゆ�?Buff tick 閿熸枻鎷烽敓鏂ゆ�?

  private tickBuffs(): void {
    const playerIds = entities.query("stats").filter((id) => !entities.hasComponent(id, "ai"));
    if (playerIds.length === 0) return;
    const pid = playerIds[0];
    const stats = entities.getComponent(pid, "stats")!;

    if (this.buffAtk > 0 && this.now >= this.buffAtkUntil) {
      stats.atk -= this.buffAtk;
      this.buffAtk = 0;
    }
    if (this.buffDef > 0 && this.now >= this.buffDefUntil) {
      stats.def -= this.buffDef;
      this.buffDef = 0;
    }
  }

  async loadAssets(): Promise<void> {
    const [playerTex, slimeTex, redSlimeTex, eagleTex, skeletonTex, orcTex, sweeperTex, blacksmithTex, merchantTex, tiles] =
      await Promise.all([
        loadPlayerTextures(),
        loadEnemyTextures("slime"),
        loadEnemyTextures("red_slime"),
        loadEnemyTextures("eagle"),
        loadEnemyTextures("skeleton"),
        loadEnemyTextures("orc"),
        loadNPCTextures("sweeper"),
        loadNPCTextures("blacksmith"),
        loadNPCTextures("merchant"),
        loadTileset(),
      ]);

    this.playerTextures = playerTex;
    this.enemyTextures.set("slime", slimeTex);
    this.enemyTextures.set("red_slime", redSlimeTex);
    this.enemyTextures.set("eagle", eagleTex);
    this.enemyTextures.set("skeleton", skeletonTex);
    this.enemyTextures.set("orc", orcTex);
    this.npcTextures.set("sweeper", sweeperTex);
    this.npcTextures.set("blacksmith", blacksmithTex);
    this.npcTextures.set("merchant", merchantTex);
    this.tileTextures = tiles;

    await this.loadMap(mapManager.currentId ?? mapManager.mapIds[0] ?? "meadow_village");
    this.loaded = true;

    // Apply save data if available
    await this.applySave();
  }

  private async loadMap(mapId: string, spawnOverride?: {x: number, y: number}, entryDirection?: string): Promise<void> {
    const mapState = await mapManager.loadMap(mapId);
    this.currentMap = mapState;
    this.tileMap = mapState.tileMap;
    this.collisionMap = mapState.collisionMap;

    this.tileContainer.removeChildren();
    this.entityContainer.removeChildren();
    this.spriteMap.clear();
    this.healthBarMap.forEach((bar) => bar.destroy());
    this.healthBarMap.clear();
    this.entityEnemyType.clear();
    this.npcEntities.clear();
    entities.clear();
    inventory.clear();

    if (this.gameOverText) {
      this.app.stage.removeChild(this.gameOverText);
      this.gameOverText.destroy();
      this.gameOverText = null;
    }

    this.gameOver = false;
    this.dialogActive = false;
    this.now = 0;
    this.playerAttackUntil = 0;
      this.playerHitUntil = 0;
    this.portalCooldownUntil = this.now + 0.5;
    this.buffAtk = 0;
    this.buffAtkUntil = 0;
    this.buffDef = 0;
    this.buffDefUntil = 0;

    this.drawMap();
    this.hud.setMapName(mapId);
    this.spawnPlayer(spawnOverride, entryDirection);
    this.spawnEnemies();
    this.spawnNPCs();
  }

  update(dt: number): void {
    if (!this.loaded) return;

    // Inventory toggle (always processed, even in game-over)
    this.inventoryUI.update();
    this.hotbar.update();

    if (this.gameOver) {
      if (!this.gameOverText) {
        const text = new PIXI.Text("Game Over\nPress R to restart", {
          fontSize: 36,
          fill: "#ff4444",
          align: "center",
        });
        text.anchor.set(0.5);
        text.x = this.app.screen.width / 2;
        text.y = this.app.screen.height / 2;
        this.app.stage.addChild(text);
        this.gameOverText = text;
      }
      if (input.isKeyJustPressed("KeyR")) {
        this.restart();
      }
      input.clearJustPressed();
      return;
    }

    this.now += dt;

    // Block gameplay input when inventory or dialog is open
    if (this.inventoryUI.visible) {
      input.clearJustPressed();
      return;
    }

    if (!this.dialogActive && input.isKeyJustPressed("KeyN")) {
      this.nextMap();
      input.clearJustPressed();
      return;
    }

    if (this.dialogActive) {
      if (input.isKeyJustPressed("KeyE") || input.isKeyJustPressed("Space")) {
        const closed = this.dialogBox.nextOrClose();
        if (closed) this.dialogActive = false;
      }
      input.clearJustPressed();
      return;
    }

    const dir = input.getDirection();
    movementSystem(dt, this.collisionMap);
    aiSystem(dt, this.now);
    combatSystem(this.now);
    this.tickBuffs();
    this.updateCamera();
    this.updateSprites(dt);
    this.hud.update(dt, this.app.screen.width, this.app.screen.height);
    this.handleInteractions();
    this.handlePortals();

    input.clearJustPressed();
  }

  private drawMap(): void {
    const ts = CONFIG.TILE_SIZE;
    for (let r = 0; r < this.tileMap.length; r++) {
      for (let c = 0; c < this.tileMap[r].length; c++) {
        const idx = this.tileMap[r][c];
        const name = this.tileName(idx);
        const texture = this.tileTextures[name] ?? PIXI.Texture.WHITE;
        const sprite = new PIXI.Sprite(texture);
        sprite.x = c * ts;
        sprite.y = r * ts;
        sprite.width = ts;
        sprite.height = ts;
        this.tileContainer.addChild(sprite);
      }
    }

    // Draw portal markers
    const portals = this.currentMap?.meta.portals;
    if (portals) {
      for (const p of portals) {
        const marker = new PIXI.Graphics();
        marker.beginFill(0x00ffff, 0.4);
        marker.drawRect(p.x * ts, p.y * ts, ts, ts);
        marker.endFill();
        // Arrow indicator
        marker.beginFill(0x00ffff, 0.8);
        marker.moveTo(p.x * ts + ts / 2, p.y * ts + 8);
        marker.lineTo(p.x * ts + ts - 8, p.y * ts + ts - 8);
        marker.lineTo(p.x * ts + 8, p.y * ts + ts - 8);
        marker.closePath();
        marker.endFill();
        this.tileContainer.addChild(marker);
      }
    }
  }

  private tileName(idx: number): string {
    const names = ["grass", "dirt", "wall", "water", "flowers", "tree"];
    return names[idx] ?? "grass";
  }

  private spawnPlayer(spawnOverride?: {x: number, y: number}, entryDirection?: string): void {
    const id = entities.createEntity();
    const size = PLAYER_DEF.size;
    const ts = CONFIG.TILE_SIZE;

    let playerSpawn = spawnOverride ?? this.currentMap?.meta.player ?? { x: Math.floor((this.tileMap[0]?.length ?? 1) / 2), y: Math.floor((this.tileMap.length ?? 1) / 2) };

    // Offset spawn inward when entering via portal to avoid edge walls
    if (entryDirection && spawnOverride) {
      const maxC = (this.tileMap[0]?.length ?? 1) - 1;
      const maxR = this.tileMap.length - 1;
      // Direction vector: move away from the edge the player entered from
      const dir = entryDirection === "down"  ? { x: 0, y: 1 }
                : entryDirection === "up"    ? { x: 0, y: -1 }
                : entryDirection === "right" ? { x: 1, y: 0 }
                :                              { x: -1, y: 0 };
      // Try offsets 1..3 to find a walkable tile
      for (let off = 1; off <= 3; off++) {
        const cx = Math.max(1, Math.min(maxC - 1, playerSpawn.x + dir.x * off));
        const cy = Math.max(1, Math.min(maxR - 1, playerSpawn.y + dir.y * off));
        const tile = this.tileMap[cy]?.[cx];
        if (tile !== undefined && tile !== 2 && tile !== 3 && tile !== 5) {
          playerSpawn = { x: cx, y: cy };
          break;
        }
      }
    }

    const x = playerSpawn.x * ts;
    const y = playerSpawn.y * ts;

    entities.addComponent(id, "transform", {
      x, y, width: size, height: size, facing: "down",
    });
    entities.addComponent(id, "velocity", { vx: 0, vy: 0 });
    entities.addComponent(id, "health", {
      current: PLAYER_DEF.hp,
      max: PLAYER_DEF.hp,
      invincibleUntil: 0,
      attackRange: PLAYER_DEF.attackRange,
      attackCooldown: PLAYER_DEF.attackCooldown,
      invincibleTime: PLAYER_DEF.invincibleTime,
      anchorOffsetX: PLAYER_DEF.anchorOffsetX,
      anchorOffsetY: PLAYER_DEF.anchorOffsetY,
    });
    entities.addComponent(id, "stats", {
      atk: PLAYER_DEF.atk,
      def: PLAYER_DEF.def,
      speed: PLAYER_DEF.speed,
      exp: 0,
    });
    entities.addComponent(id, "collider", {
      offsetX: PLAYER_DEF.colliderOffsetX, offsetY: PLAYER_DEF.colliderOffsetY,
width: PLAYER_DEF.colliderWidth, height: PLAYER_DEF.colliderHeight,
isStatic: false, layer: "player", useForMovement: true,
    });

    const anim = this.playerTextures["idle_down"];
    const sprite = new PIXI.AnimatedSprite(anim?.textures ?? []);
    sprite.anchor.set(0.5);
    sprite.x = x + size / 2;
    sprite.y = y + size / 2;
    sprite.width = size;
    sprite.height = size;
    sprite.loop = true;
    sprite.animationSpeed = 6 / 60;
    sprite.play();
    this.entityContainer.addChild(sprite);
    this.spriteMap.set(id, sprite);
  }

  private spawnEnemies(): void {
    const spawns = this.currentMap?.meta.enemies ?? [
      { type: "slime", x: 3, y: 3 },
      { type: "eagle", x: Math.max(1, (this.tileMap[0]?.length ?? 3) - 3), y: Math.max(1, (this.tileMap.length ?? 3) - 3) },
    ];

    for (const s of spawns) {
      const def = ENEMY_DEFS[s.type];
      if (!def) continue;

      const id = entities.createEntity();
      const ts = CONFIG.TILE_SIZE;
      const size = def.size;
      const x = s.x * ts;
      const y = s.y * ts;

      entities.addComponent(id, "transform", {
        x, y, width: size, height: size, facing: "down",
      });
      entities.addComponent(id, "velocity", { vx: 0, vy: 0 });
      entities.addComponent(id, "health", {
        current: def.hp,
        max: def.hp,
        invincibleUntil: 0,
      });
      entities.addComponent(id, "stats", {
        atk: def.atk,
        def: def.def,
        speed: def.speed,
        exp: def.exp,
      });
      entities.addComponent(id, "ai", {
        type: "chase",
        state: "idle",
        stateTimer: 1 + Math.random() * 2,
        patrolTarget: null,
        attackCooldown: 0,
        attackCooldownDuration: def.attackCooldown ?? CONFIG.ENEMY_ATTACK_COOLDOWN,
        anchorOffsetX: def.anchorOffsetX ?? 0,
        anchorOffsetY: def.anchorOffsetY ?? 0,
        detectRange: def.detectRange ?? CONFIG.ENEMY_DETECT_RANGE,
        attackRange: def.attackRange ?? CONFIG.ENEMY_ATTACK_RANGE,
        targetId: -1,
        attackDuration: def.attackDuration,
        damageFrameRatio: def.damageFrameRatio,
        attackDamageDealt: false,
        attackProgress: 0,
        hurtUntil: 0,
      });
      entities.addComponent(id, "collider", {
        offsetX: 0, offsetY: 0,
        width: def.colliderSize ?? size,
        height: def.colliderSize ?? size,
        isStatic: false, layer: "enemy", useForMovement: true,
      });
      entities.addComponent(id, "lootDrop", { exp: def.exp, enemyType: s.type });

      const animKey = def.anims?.idle ?? def.animKey;
      const textures = this.enemyTextures.get(s.type)?.[animKey];
      if (!textures || textures.length === 0) continue;
      const sprite = new PIXI.AnimatedSprite(textures);
      sprite.anchor.set(0.5);
      sprite.loop = true;
      sprite.animationSpeed = (def.animFps?.[animKey] ?? 6) / 60;
      sprite.play();
      this.entityContainer.addChild(sprite);
      this.spriteMap.set(id, sprite);
      this.entityEnemyType.set(id, s.type);
    }
  }

  private spawnNPCs(): void {
    const ts = CONFIG.TILE_SIZE;
    const mapId = this.currentMap?.id;

    const metaNPCs = this.currentMap?.meta.npcs ?? [];

    // 閫夋嫨鏉ユ簮锛氬湴鍥緈eta浼樺厛锛涘惁鍒欑敤浠ｇ爜閲岀�?NPC_SPAWN_SET �?mapId 杩囨�?
    const spawns = metaNPCs.length > 0
      ? metaNPCs.map((n) => ({ npcKey: n.type, type: n.type, x: n.x, y: n.y }))
      : NPC_SPAWN_SET.filter((s) => s.mapId === mapId).map((s) => ({
          npcKey: s.npcKey,
          type: s.type,
          x: s.baseX,
          y: s.baseY,
          dialogOverride: s.dialogOverride,
        }));

    for (const s of spawns) {
      const def = NPC_DEFS[s.type];
      if (!def) continue;

      const id = entities.createEntity();
      const size = def.size;
      const x = s.x * ts;
      const y = s.y * ts;

      entities.addComponent(id, "transform", {
        x, y, width: size, height: size, facing: "down",
      });
      // NPC 涓嶉渶瑕佺Щ鍔細涓嶅�?velocity锛岄伩鍏嶈 movementSystem 澶勭悊鍚庘€滆窡�?婕傜Щ�?      entities.addComponent(id, "health", { current: 9999, max: 9999, invincibleUntil: Infinity });
      entities.addComponent(id, "stats", { atk: 0, def: 0, speed: 0, exp: 0 });
      entities.addComponent(id, "npc", { npcKey: s.npcKey });

      const cW = def.colliderSize ?? size;
      const cH = def.colliderSize ?? size;
      entities.addComponent(id, "collider", {
        offsetX: def.colliderOffsetX ?? 0,
        offsetY: def.colliderOffsetY ?? 0,
        width: cW,
        height: cH,
        isStatic: true,
        layer: "item",           // 璁╃帺瀹跺彲浠ヨ鎸★紝浣嗕笉浼氬弬涓庢垬鏂楃郴缁?        useForMovement: false,
      });

      const animKey = def.animKey;
      const textures = this.npcTextures.get(s.type)?.[animKey] ?? [];
      const sprite = new PIXI.AnimatedSprite(textures);
      sprite.anchor.set(0.5);
      sprite.loop = true;
      sprite.animationSpeed = (def.animFps?.[animKey] ?? 10) / 60;
      sprite.play();
      sprite.x = x + size / 2;
      sprite.y = y + size / 2;
      sprite.width = size;
      sprite.height = size;
      this.entityContainer.addChild(sprite);
      this.spriteMap.set(id, sprite);
      this.npcEntities.set(id, s.type);
    }
  }

  private updateCamera(): void {
    const playerIds = entities.query("collider").filter((id) => {
      const c = entities.getComponent(id, "collider");
      return c && c.layer === "player" && c.useForMovement;
    });
    if (playerIds.length === 0) return;

    const transform = entities.getComponent(playerIds[0], "transform");
    if (!transform) return;

    const vw = this.app.screen.width;
    const vh = this.app.screen.height;

    if (CONFIG.CAMERA_FOLLOW_ENABLED) {
      const mapW = (this.tileMap[0]?.length ?? 1) * CONFIG.TILE_SIZE;
      const mapH = this.tileMap.length * CONFIG.TILE_SIZE;
      let x = -transform.x - transform.width / 2 + vw / 2;
      let y = -transform.y - transform.height / 2 + vh / 2;
      x = Math.min(0, Math.max(-(mapW - vw), x));
      y = Math.min(0, Math.max(-(mapH - vh), y));
      this.container.x = x;
      this.container.y = y;
    }
  }

  private handlePortals(): void {
    if (this.now < this.portalCooldownUntil) return;
    const portals = this.currentMap?.meta.portals;
    if (!portals || portals.length === 0) return;

    const playerIds = entities.query("collider").filter((id) => {
      const c = entities.getComponent(id, "collider");
      return c && c.layer === "player" && c.useForMovement;
    });
    if (playerIds.length === 0) return;

    const t = entities.getComponent(playerIds[0], "transform");
    if (!t) return;

    const ts = CONFIG.TILE_SIZE;
    const pcx = Math.floor((t.x + t.width / 2) / ts);
    const pcy = Math.floor((t.y + t.height / 2) / ts);

    for (const portal of portals) {
      if (pcx === portal.x && pcy === portal.y) {
        this.portalCooldownUntil = this.now + 0.5;
        this.loadMap(portal.targetMap, { x: portal.targetX, y: portal.targetY }, t.facing);
        return;
      }
    }
  }

private handleInteractions(): void {
  if (input.isKeyJustPressed("KeyE")) {
    const playerIds = entities.query("collider").filter((id) => {
      const c = entities.getComponent(id, "collider");
      return c && c.layer === "player" && c.useForMovement;
    });
    if (playerIds.length === 0) return;

    const pT = entities.getComponent(playerIds[0], "transform");
    if (!pT) return;

    const allNPC = entities.query("npc");
    for (const id of allNPC) {
      const npc = entities.getComponent(id, "npc");
      const t = entities.getComponent(id, "transform");
      if (!npc || !t) continue;

      const def = NPC_DEFS[npc.npcKey];
      const range = def?.interactionRange ?? 120;

      const dx = Math.abs((pT.x + pT.width / 2) - (t.x + t.width / 2));
      const dy = Math.abs((pT.y + pT.height / 2) - (t.y + t.height / 2));
      if (dx < range && dy < range) {
        if (def) {
          this.dialogActive = true;
          this.dialogBox.open(def.name, def.dialog);
          return;
        }
      }
    }
  }
}

  private updateSprites(dt: number): void {
    const allIds = entities.query("transform");

    for (const id of allIds) {
      const transform = entities.getComponent(id, "transform")!;
      const health = entities.getComponent(id, "health");
      const ai = entities.getComponent(id, "ai");
      const sprite = this.spriteMap.get(id);
      if (!sprite) continue;
      // Guard against destroyed sprites (e.g. from previous frame cleanup)
      if ((sprite as any).destroyed) {
        this.spriteMap.delete(id);
        const staleHpBar = this.healthBarMap.get(id);
        if (staleHpBar) { this.entityContainer.removeChild(staleHpBar); staleHpBar.destroy(); this.healthBarMap.delete(id); }
        continue;
      }

      // 鈹€鈹€ Enemy (AI entity) 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
      if (ai && this.entityEnemyType.has(id)) {
        const enemyType = this.entityEnemyType.get(id)!;
        const def = ENEMY_DEFS[enemyType];
        const texSet = this.enemyTextures.get(enemyType);

        // --- Death ---
        if (health && health.current <= 0) {
          const deathKey = def?.deathAnim;
          const deathTextures = deathKey ? texSet?.[deathKey] : undefined;

          if (deathTextures && (sprite as PIXI.AnimatedSprite).textures !== deathTextures) {
            (sprite as PIXI.AnimatedSprite).textures = deathTextures;
            (sprite as PIXI.AnimatedSprite).loop = false;
            (sprite as PIXI.AnimatedSprite).animationSpeed =
              (def?.animFps?.[deathKey!] ?? 10) / 60;
            (sprite as PIXI.AnimatedSprite).play();
          }

          const playing = (sprite as PIXI.AnimatedSprite).playing;
          if (!playing || !deathTextures) {
            sprite.alpha -= dt * 2;
          }
          sprite.x = transform.x + transform.width / 2;
          sprite.y = transform.y + transform.height / 2;
          if (sprite.alpha <= 0) {
            this.entityContainer.removeChild(sprite);
            sprite.destroy();
            this.spriteMap.delete(id);
            const hpBar = this.healthBarMap.get(id);
            if (hpBar) {
              this.entityContainer.removeChild(hpBar);
              hpBar.destroy();
              this.healthBarMap.delete(id);
            }
            entities.destroyEntity(id);
            this.entityEnemyType.delete(id);
          }
          continue;
        }

        // --- Hurt (recently damaged) ---
        const isHurt = ai.hurtUntil > 0 && this.now < ai.hurtUntil;
        let animKey: string;
        if (isHurt && def?.hurtAnim) {
          animKey = def.hurtAnim;
        } else {
          animKey = def?.anims?.[ai.state] ?? def?.animKey ?? "idle";
        }

        if (texSet) {
          const textures = texSet[animKey];
          if (textures && (sprite as PIXI.AnimatedSprite).textures !== textures) {
            (sprite as PIXI.AnimatedSprite).textures = textures;
            (sprite as PIXI.AnimatedSprite).loop = true;
            (sprite as PIXI.AnimatedSprite).animationSpeed =
              (def?.animFps?.[animKey] ?? 6) / 60;
            (sprite as PIXI.AnimatedSprite).play();
          }
        }

        sprite.x = transform.x + transform.width / 2;
        sprite.y = transform.y + transform.height / 2;
        const eNatW = sprite.texture?.orig?.width || transform.width;
        const eNatH = sprite.texture?.orig?.height || transform.height;
        sprite.scale.set(transform.width / eNatW, transform.height / eNatH);

        if (isHurt) {
          sprite.alpha = Math.sin(this.now * 25) > 0 ? 1 : 0.4;
        } else {
          sprite.alpha = 1;
        }

        let hpBar = this.healthBarMap.get(id);
        if (!hpBar) {
          hpBar = new PIXI.Graphics();
          this.entityContainer.addChild(hpBar);
          this.healthBarMap.set(id, hpBar);
        }
        hpBar.clear();
        const barW = transform.width * 0.8;
        const barH = 6;
        const barX = transform.x + transform.width * 0.1;
        const barY = transform.y - 10;
        const hpRatio = Math.max(0, health!.current / health!.max);
        hpBar.beginFill(0x000000, 0.6);
        hpBar.drawRoundedRect(barX - 1, barY - 1, barW + 2, barH + 2, 2);
        hpBar.endFill();
        const hpColor = hpRatio > 0.5 ? 0x44dd44 : hpRatio > 0.25 ? 0xddaa22 : 0xdd2222;
        hpBar.beginFill(hpColor);
        hpBar.drawRoundedRect(barX, barY, barW * hpRatio, barH, 2);
        hpBar.endFill();
        hpBar.alpha = sprite.alpha;
        continue;
      }

      // 鈹€鈹€ NPC 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
      if (this.npcEntities.has(id)) {
        sprite.x = transform.x + transform.width / 2;
        sprite.y = transform.y + transform.height / 2;
        const nNatW = sprite.texture?.orig?.width || transform.width;
        const nNatH = sprite.texture?.orig?.height || transform.height;
        sprite.scale.set(transform.width / nNatW, transform.height / nNatH);
        continue;
      }

      // 鈹€鈹€ Player 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
      const vel = entities.getComponent(id, "velocity");
      const isMoving = vel && (Math.abs(vel.vx) > 1 || Math.abs(vel.vy) > 1);

      let animKey: string;
      if (health && health.current <= 0) {
        animKey = "die";
      } else if (this.now < this.playerHitUntil) {
        animKey = "hit";
      } else if (this.now < this.playerAttackUntil) {
        animKey = `attack_${transform.facing}`;
      } else {
        animKey = `${isMoving ? "run" : "idle"}_${transform.facing}`;
      }

      const anim = this.playerTextures[animKey];
      if (anim) {
        if ((sprite as PIXI.AnimatedSprite).textures !== anim.textures) {
          (sprite as PIXI.AnimatedSprite).textures = anim.textures;
          (sprite as PIXI.AnimatedSprite).animationSpeed = anim.fps / 60;
          (sprite as PIXI.AnimatedSprite).loop = anim.loop;
        }
        if (!(sprite as PIXI.AnimatedSprite).playing) {
          (sprite as PIXI.AnimatedSprite).gotoAndPlay(0);
        }
      }

      const firstFrame = anim?.textures?.[0];
      const natW = firstFrame?.orig?.width || firstFrame?.baseTexture?.width || transform.width;
      const natH = firstFrame?.orig?.height || firstFrame?.baseTexture?.height || transform.height;
      const uniScale = transform.width / natW;
      sprite.scale.set(uniScale, uniScale);

      if (anim?.mirrorX) {
        sprite.scale.x = -uniScale;
      }

      sprite.x = transform.x + transform.width / 2;
      sprite.y = transform.y + transform.height - (natH * uniScale) / 2;
    }
  }

  private async restart(): Promise<void> {
    if (!this.currentMap) {
      return;
    }

    await this.loadMap(this.currentMap.id);
  }

  private async nextMap(): Promise<void> {
    const nextId = mapManager.nextMapId(this.currentMap?.id);
    if (!nextId) {
      return;
    }

    await this.loadMap(nextId);
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    this.dialogBox.resize(width, height);
  }
}













