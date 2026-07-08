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
import { InventoryUI, type PlayerStatsInfo } from "../ui/inventory-ui";
import { Hotbar } from "../ui/hotbar";
import { ShopUI, type ShopItem } from "../ui/shop-ui";
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
  attackRange: 80, attackCooldown: 0.4, invincibleTime: 0.5,
  anchorOffsetX: 0, anchorOffsetY: 0,
  colliderOffsetX: 34, colliderOffsetY: 54,
  colliderWidth: 50, colliderHeight: 50,
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
  colliderOffsetX?: number;
  colliderOffsetY?: number;
  colliderWidth?: number;
  colliderHeight?: number;
  detectRange?: number;
  attackRange?: number;
  attackCooldown?: number;
  anchorOffsetX?: number;
  anchorOffsetY?: number;
  canFly?: boolean;
}
  

const ENEMY_DEFS: Record<string, EnemyDef> = {
  // === Tier 1 - Meadow Village (Lv 1-3) ===
  slime: {
    hp: 50, atk: 10, def: 5, speed: 50, exp: 10,
    animKey: "idle", size: 72,
    animFps: { idle: 6 },
    attackDuration: 0.3, damageFrameRatio: 0.4,
    detectRange: 250, attackRange: 55, attackCooldown: 1.4,
    colliderWidth: 48, colliderHeight: 48, colliderOffsetX: 12, colliderOffsetY: 16,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  goblin1: {
    hp: 80, atk: 20, def: 8, speed: 60, exp: 15,
    animKey: "idle", size: 120,
    anims: { idle: "idle", patrol: "walk", chase: "walk", attack: "attack" },
    animFps: { idle: 8, walk: 10, attack: 16 },
    hurtAnim: "hurt", deathAnim: "die",
    attackDuration: 0.5, damageFrameRatio: 0.4,
    detectRange: 280, attackRange: 55, attackCooldown: 1.2,
    colliderWidth: 50, colliderHeight: 50, colliderOffsetX: 35, colliderOffsetY: 50,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  // === Tier 2 - Forest Path (Lv 3-5) ===
  red_slime: {
    hp: 100, atk: 25, def: 10, speed: 55, exp: 22,
    animKey: "idle", size: 72,
    animFps: { idle: 8 },
    attackDuration: 0.3, damageFrameRatio: 0.4,
    detectRange: 300, attackRange: 60, attackCooldown: 1.2,
    colliderWidth: 48, colliderHeight: 48, colliderOffsetX: 12, colliderOffsetY: 16,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  goblin2: {
    hp: 120, atk: 22, def: 10, speed: 55, exp: 25,
    animKey: "idle", size: 140,
    anims: { idle: "idle", patrol: "walk", chase: "walk", attack: "attack" },
    animFps: { idle: 8, walk: 10, attack: 20 },
    hurtAnim: "hurt", deathAnim: "die",
    attackDuration: 0.6, damageFrameRatio: 0.5,
    detectRange: 320, attackRange: 60, attackCooldown: 1.3,
    colliderWidth: 60, colliderHeight: 88, colliderOffsetX: 23, colliderOffsetY: 22,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  eagle: {
    hp: 70, atk: 20, def: 2, speed: 100, exp: 28,
    animKey: "fly", size: 96,
    animFps: { fly: 12 },
    attackDuration: 0.4, damageFrameRatio: 0.4,
    detectRange: 400, attackRange: 70, attackCooldown: 1.0,
    canFly: true,
    colliderWidth: 56, colliderHeight: 40, colliderOffsetX: 20, colliderOffsetY: 28,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  // === Tier 3 - Lakeside Camp (Lv 5-7) ===
  goblin3: {
    hp: 80, atk: 25, def: 4, speed: 120, exp: 50,
    animKey: "idle", size: 120,
    anims: { idle: "idle", patrol: "run", chase: "run", attack: "attack" },
    animFps: { idle: 8, run: 12, attack: 14 },
    hurtAnim: "hurt", deathAnim: "die",
    attackDuration: 0.4, damageFrameRatio: 0.4,
    detectRange: 350, attackRange: 55, attackCooldown: 1.1,
    colliderWidth: 44, colliderHeight: 56, colliderOffsetX: 34, colliderOffsetY: 40,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  skeleton: {
    hp: 120, atk: 20, def: 4, speed: 50, exp: 50,
    animKey: "idle", size: 96,
    anims: { idle: "idle", patrol: "move", chase: "move", attack: "attack" },
    animFps: { idle: 10, move: 12, attack: 22 },
    deathAnim: "death",
    attackDuration: 0.8, damageFrameRatio: 0.5,
    detectRange: 350, attackRange: 75, attackCooldown: 1.4,
    colliderWidth: 48, colliderHeight: 72, colliderOffsetX: 24, colliderOffsetY: 18,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  // === Tier 4 - Desert Outpost (Lv 7-9) ===
  goblin4: {
    hp: 250, atk: 40, def: 15, speed: 40, exp: 70,
    animKey: "idle", size: 180,
    anims: { idle: "idle", patrol: "walk", chase: "walk", attack: "attack" },
    animFps: { idle: 6, walk: 10, attack: 20 },
    attackDuration: 1, damageFrameRatio: 0.5,
    deathAnim: "die",
    colliderWidth: 100, colliderHeight: 150, colliderOffsetX: 20, colliderOffsetY: 20,
    detectRange: 350, attackRange: 100, attackCooldown: 1.4,
    anchorOffsetX: 0, anchorOffsetY: 0,
  },
  orc: {
    hp: 170, atk: 30, def: 10, speed: 45, exp: 65,
    animKey: "idle", size: 256,
    anims: { idle: "idle", patrol: "move", chase: "move", attack: "attack" },
    animFps: { idle: 6, move: 10, attack: 6 },
    attackDuration: 0.8, damageFrameRatio: 0.5,
    colliderWidth: 60, colliderHeight: 70, colliderOffsetX: 108, colliderOffsetY: 90,
    detectRange: 380, attackRange: 65, attackCooldown: 1.3,
    anchorOffsetX: 0, anchorOffsetY: -20,
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
  colliderWidth?: number;
  colliderHeight?: number;
  colliderOffsetX?: number;
  colliderOffsetY?: number;
  interactionRange?: number;
}

const NPC_DEFS: Record<string, NPCDef> = {
  sweeper: {
    name: "Old Sweeper",
    dialog: [
      "啊，年轻的冒险者……这个村庄曾经和平安宁。",
      "但来自东边地牢的怪物已经出现了。" ,
      "如果你能将它们清除，村民们会非常感激。" ,
      "小心那些鹰——它们又快又凶！"
    ],
    animKey: "sweep",
    animFps: { sweep: 10 },
    size: 96,
    colliderWidth: 60, colliderHeight: 80,
    colliderOffsetX: 18,
    colliderOffsetY: 12,
    interactionRange: 128,
  },
  blacksmith: {
    name: "Blacksmith",
    dialog: [
      "欢迎来到我的铁匠铺！我为村庄打造最精良的装备。",  
      "我可以为你锻造铁器和钢制装备——只需带上材料即可。",
      "来看看我的商品吧！"
    ],
    animKey: "idle",
    animFps: { idle: 6 },
    size: 124,
    colliderWidth: 65, colliderHeight: 70,
    colliderOffsetX: 16,
    colliderOffsetY: 45,
    interactionRange: 128,
  },
  merchant: {
    name: "Merchant",
    dialog: [
      "欢迎，旅行者！我出售药水、食物和补给品。",  
      "所有商品均以金币计价。",  
      "来看看我的货物吧！"
    ],
    animKey: "idle",
    animFps: { idle: 6 },
    size: 80,
    colliderWidth: 45, colliderHeight: 70,
    colliderOffsetX: 13,
    colliderOffsetY: 10,
    interactionRange: 128,
  },
  feibi: {
    name: "圆头帽叠",
    dialog: ["菲比啾比！"],
    animKey: "idle",
    animFps: { idle: 8 },
    size: 48,
    colliderWidth: 32, colliderHeight: 42,
    colliderOffsetX: 8,
    colliderOffsetY: 5,
    interactionRange: 128,
  },
};

// Blacksmith shop inventory
const BLACKSMITH_SHOP: ShopItem[] = [
  { itemId: "iron_sword",      currency: "coin", currencyQty: 20 },
  { itemId: "iron_helmet",     currency: "coin", currencyQty: 15 },
  { itemId: "iron_chestplate", currency: "coin", currencyQty: 25 },
  { itemId: "iron_leggings",   currency: "coin", currencyQty: 20 },
  { itemId: "iron_boots",      currency: "coin", currencyQty: 10 },
  { itemId: "flame_blade",     currency: "coin", currencyQty: 50 },
  { itemId: "steel_helmet",    currency: "coin", currencyQty: 45 },
  { itemId: "steel_chestplate",currency: "coin", currencyQty: 50 },
  { itemId: "steel_leggings",  currency: "coin", currencyQty: 35 },
  { itemId: "steel_boots",     currency: "coin", currencyQty: 25 },
];

// Merchant shop inventory
const MERCHANT_SHOP: ShopItem[] = [
  { itemId: "apple",              currency: "coin", currencyQty: 3 },
  { itemId: "small_health_potion",currency: "coin", currencyQty: 8 },
  { itemId: "health_potion",      currency: "coin", currencyQty: 10 },
  { itemId: "chicken",            currency: "coin", currencyQty: 15 },
  { itemId: "coffee",             currency: "coin", currencyQty: 25 },
  { itemId: "atk_scroll",         currency: "coin", currencyQty: 15 },
  { itemId: "def_scroll",         currency: "coin", currencyQty: 15 },
];

interface NPCSpawnConfig {
  mapId: string;
  npcKey: string;
  type: string;
  baseX: number; // tile
  baseY: number; // tile
  dialogOverride?: string[];
}

const NPC_SPAWN_SET: NPCSpawnConfig[] = [
  // Meadow Village NPCs
  { mapId: "meadow_village", npcKey: "sweeper", type: "sweeper", baseX: 15, baseY: 10 },
  { mapId: "meadow_village", npcKey: "blacksmith", type: "blacksmith", baseX: 8, baseY: 6 },
  { mapId: "meadow_village", npcKey: "merchant", type: "merchant", baseX: 14, baseY: 6 },
  { mapId: "dungeon_lair", npcKey: "feibi", type: "feibi", baseX: 20, baseY: 14 },
  // Forest Path NPCs
  // { mapId: "forest_path", npcKey: "hermit", type: "hermit", baseX: 12, baseY: 6 },
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
  private shopUI: ShopUI;
  private playerTextures: Record<string, PlayerAnimSet> = {};
  private enemyTextures: Map<string, Record<string, PIXI.Texture[]>> = new Map();
  private npcTextures: Map<string, Record<string, PIXI.Texture[]>> = new Map();
  private tileTextures: Record<string, PIXI.Texture> = {};
  private spriteMap = new Map<number, PIXI.Sprite | PIXI.AnimatedSprite>();
  private healthBarMap = new Map<number, PIXI.Graphics>();
  private entityEnemyType = new Map<number, string>();
  private npcEntities: Map<number, string> = new Map();
  private enemyBaseSize = new Map<string, {w: number; h: number}>();
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
  private buffSpeed = 0;
  private buffSpeedUntil = 0;
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

    this.dialogBox = new DialogBox();

    // Inventory UI
    this.inventoryUI = new InventoryUI();
    this.inventoryUI.onUse((slotIndex) => this.useInventoryItem(slotIndex));

    this.inventoryUI.setStatsProvider(() => {
      const playerIds = entities.query("health", "stats").filter((id) => !entities.hasComponent(id, "ai"));
      if (playerIds.length === 0) {
        return { level: 1, exp: 0, expToLevel: 50, hp: 100, maxHp: 100, atk: 15, def: 5, speed: 240, bonusAtk: 0, bonusDef: 0, bonusHp: 0, bonusSpeed: 0 };
      }
      const pid = playerIds[0];
      const hp = entities.getComponent(pid, "health")!;
      const stats = entities.getComponent(pid, "stats")!;
      const bonus = equipment.getBonus();
      return {
        level: this.hud.level,
        exp: this.hud.exp,
        expToLevel: this.hud.expToLevel,
        hp: Math.ceil(hp.current),
        maxHp: hp.max,
        atk: stats.atk,
        def: stats.def,
        speed: stats.speed,
        bonusAtk: bonus.atk,
        bonusDef: bonus.def,
        bonusHp: bonus.hp,
        bonusSpeed: bonus.speed,
      };
    });

    // Hotbar
    this.hotbar = new Hotbar();
    this.hotbar.onUse((slotIndex) => this.useInventoryItem(slotIndex));

    // Shop UI
    this.shopUI = new ShopUI();

    // In-game settings button
    const settingsBtn = document.getElementById("settings-btn-ingame");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        const overlay = document.getElementById("settings-overlay")!;
        overlay.style.display = "flex";
        requestAnimationFrame(() => overlay.classList.add("visible"));
      });
    }

    // Respawn button - return to current map spawn point
    const respawnBtn = document.getElementById("settings-respawn");
    if (respawnBtn) {
      respawnBtn.addEventListener("click", () => {
        const overlay = document.getElementById("settings-overlay")!;
        overlay.classList.remove("visible");
        setTimeout(() => { overlay.style.display = "none"; }, 300);
        if (this.currentMap) {
          this.loadMap(this.currentMap.id);
        }
      });
    }

    eventBus.on("equipment_changed", () => this.applyEquipmentBonus());

    // Expose player state to save manager
    setPlayerStateGetter(() => this.getPlayerState());

    eventBus.on("player_died", () => {
      // Check for undead_totem in inventory �� auto-revive if found
      if (inventory.countItems("undead_totem") > 0) {
        inventory.removeFromSlot(
          inventory.getAllSlots().findIndex((s) => s !== null && s.itemId === "undead_totem"),
          1
        );
        const playerIds = entities.query("health", "stats").filter((id) => !entities.hasComponent(id, "ai"));
        if (playerIds.length > 0) {
          const hp = entities.getComponent(playerIds[0], "health")!;
          hp.current = hp.max;
          hp.invincibleUntil = this.now + 2.0;
        }
        return;
      }
      this.gameOver = true;
    });
    eventBus.on("player_leveled_up", () => this.applyEquipmentBonus());
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
      boostSpeed: (amount, duration) => {
        this.buffSpeed = amount;
        this.buffSpeedUntil = this.now + duration;
        const stats = entities.getComponent(pid, "stats")!;
        stats.speed += amount;
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
    const level = this.hud.level;
    const levelAtk = (level - 1) * CONFIG.LEVEL_UP_ATK_BONUS;
    const levelDef = (level - 1) * CONFIG.LEVEL_UP_DEF_BONUS;
    const levelHp  = (level - 1) * CONFIG.LEVEL_UP_HP_BONUS;
    stats.atk = this.baseAtk + levelAtk + bonus.atk + this.buffAtk;
    stats.def = this.baseDef + levelDef + bonus.def + this.buffDef;
    stats.speed = 240 + (bonus.speed ?? 0) + this.buffSpeed; // 240 is PLAYER_SPEED
    if (hp) {
      hp.max = PLAYER_DEF.hp + levelHp + bonus.hp;
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
      await this.loadMap(save.player.mapId); // spawn at default point
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

    // Always use PLAYER_DEF as base — ATK/DEF are computed dynamically from base + level + equipment + buff
    this.baseAtk = PLAYER_DEF.atk;
    this.baseDef = PLAYER_DEF.def;
    this.applyEquipmentBonus();

    // Restore HP
    const playerIds = entities.query("health").filter((id) => !entities.hasComponent(id, "ai"));
    if (playerIds.length > 0) {
      const hp = entities.getComponent(playerIds[0], "health")!;
      const eqBonus = equipment.getBonus();
      hp.max = PLAYER_DEF.hp + ((save.player.level - 1) * CONFIG.LEVEL_UP_HP_BONUS) + eqBonus.hp;
      hp.current = Math.min(save.player.hp, hp.max);
    }

    initAutoSave();
  }

  private isTileBlocked(col: number, row: number): boolean {
    const tile = this.tileMap[row]?.[col];
    if (tile === undefined) return true;
    // WALL=2, WATER=3, TREE=5 are blocked
    return tile === 2 || tile === 3 || tile === 5;
  }

  private findNearestWalkable(startX: number, startY: number): { x: number; y: number } | null {
    const maxR = this.tileMap.length;
    const maxC = (this.tileMap[0]?.length ?? 0);
    // Search in expanding squares
    for (let radius = 1; radius <= 10; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue; // only perimeter
          const nx = startX + dx;
          const ny = startY + dy;
          if (nx < 1 || nx >= maxC - 1 || ny < 1 || ny >= maxR - 1) continue;
          if (!this.isTileBlocked(nx, ny)) return { x: nx, y: ny };
        }
      }
    }
    return null;
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
    const [playerTex, slimeTex, redSlimeTex, eagleTex, skeletonTex, orcTex, goblin1Tex, goblin2Tex, goblin3Tex, goblin4Tex, sweeperTex, blacksmithTex, merchantTex, feibiTex, tiles] =
      await Promise.all([
        loadPlayerTextures(),
        loadEnemyTextures("slime"),
        loadEnemyTextures("red_slime"),
        loadEnemyTextures("eagle"),
        loadEnemyTextures("skeleton"),
        loadEnemyTextures("orc"),
                loadEnemyTextures("goblin1"),
                loadEnemyTextures("goblin2"),
                loadEnemyTextures("goblin3"),
                loadEnemyTextures("goblin4"),
        loadNPCTextures("sweeper"),
        loadNPCTextures("blacksmith"),
        loadNPCTextures("merchant"),
        loadNPCTextures("feibi"),
        loadTileset(),
      ]);

    this.playerTextures = playerTex;
    this.enemyTextures.set("slime", slimeTex);
    this.enemyTextures.set("red_slime", redSlimeTex);
    this.enemyTextures.set("eagle", eagleTex);
    this.enemyTextures.set("skeleton", skeletonTex);
    this.enemyTextures.set("orc", orcTex);
        this.enemyTextures.set("goblin1", goblin1Tex);
        this.enemyTextures.set("goblin2", goblin2Tex);
        this.enemyTextures.set("goblin3", goblin3Tex);
        this.enemyTextures.set("goblin4", goblin4Tex);
    for (const [key, texSet] of this.enemyTextures) {
      const def = ENEMY_DEFS[key];
      const animKey = def?.anims?.idle ?? def?.animKey ?? "idle";
      const frames = texSet[animKey];
      if (frames && frames.length > 0) {
        const fr = frames[0].frame;
        const ow = (fr ? fr.width : frames[0].orig?.width) ?? def?.size ?? 96;
        const oh = (fr ? fr.height : frames[0].orig?.height) ?? def?.size ?? 96;
        this.enemyBaseSize.set(key, { w: ow, h: oh });
      }
    }
    this.npcTextures.set("sweeper", sweeperTex);
    this.npcTextures.set("blacksmith", blacksmithTex);
    this.npcTextures.set("merchant", merchantTex);
    this.npcTextures.set("feibi", feibiTex);
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
    // Save player state before clearing entities
    const prevPlayerIds = entities.query("health", "stats").filter((id) => !entities.hasComponent(id, "ai"));
    let savedHp = 0;
    let savedMaxHp = 0;
    let savedExp = 0;
    let savedLevel = 1;
    let savedExpToLevel = 100;
    if (prevPlayerIds.length > 0) {
      const hp = entities.getComponent(prevPlayerIds[0], "health")!;
      const stats = entities.getComponent(prevPlayerIds[0], "stats")!;
      savedHp = hp.current;
      savedMaxHp = hp.max;
      savedExp = this.hud.exp;
      savedLevel = this.hud.level;
      savedExpToLevel = this.hud.expToLevel;

    }
    entities.clear();
    // Note: inventory is NOT cleared on map change

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
    // Note: buffs are NOT reset on map change

    this.drawMap();
    this.hud.setMapName(mapId);
    this.spawnPlayer(spawnOverride, entryDirection);

    // Restore player HP and apply equipment bonus after spawn
    const newPlayerIds = entities.query("health", "stats").filter((id) => !entities.hasComponent(id, "ai"));
    if (newPlayerIds.length > 0) {
      const hp = entities.getComponent(newPlayerIds[0], "health")!;
      const bonus = equipment.getBonus();
      hp.max = PLAYER_DEF.hp + ((savedLevel - 1) * CONFIG.LEVEL_UP_HP_BONUS) + bonus.hp;
      if (savedMaxHp > 0 && savedHp > 0) {
        hp.current = Math.min(savedHp, hp.max);
      } else {
        hp.current = Math.floor(hp.max / 2);
      }
      this.applyEquipmentBonus();
      this.hud.restoreLevel(savedLevel, savedExp, savedExpToLevel);
    }

    this.spawnEnemies();
    this.spawnNPCs();
  }

  update(dt: number): void {
    if (!this.loaded) return;

    // Inventory toggle (always processed, even in game-over)
    this.inventoryUI.update();
    this.hotbar.update();
    this.shopUI.update();

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
    if (this.inventoryUI.visible || this.shopUI.visible) {
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

    // Safety: if spawn tile is blocked, find nearest walkable tile
    if (this.isTileBlocked(playerSpawn.x, playerSpawn.y)) {
      const safe = this.findNearestWalkable(playerSpawn.x, playerSpawn.y);
      if (safe) playerSpawn = safe;
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
        canFly: def.canFly ?? false,
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
      const cw = def.colliderWidth ?? def.colliderSize ?? size;
      const ch = def.colliderHeight ?? def.colliderSize ?? size;
      const cox = def.colliderOffsetX ?? Math.floor((size - cw) / 2);
      const coy = def.colliderOffsetY ?? Math.floor((size - ch) / 2);
      entities.addComponent(id, "collider", {
        offsetX: cox, offsetY: coy,
        width: cw, height: ch,
        isStatic: false, layer: "enemy", useForMovement: true,
      });
      entities.addComponent(id, "lootDrop", { exp: def.exp, enemyType: s.type });

      const animKey = def.anims?.idle ?? def.animKey;
      const textures = this.enemyTextures.get(s.type)?.[animKey];
      if (!textures || textures.length === 0) {
        continue;
      }
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

      const cW = def.colliderWidth ?? def.colliderSize ?? size;
      const cH = def.colliderHeight ?? def.colliderSize ?? size;
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
  if (input.isKeyJustPressed("KeyF")) {
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
          this.dialogBox.open(def.name, def.dialog, () => {
            // After dialog ends, open shop for blacksmith/merchant
            if (npc.npcKey === "blacksmith") {
              this.shopUI.open("Blacksmith", BLACKSMITH_SHOP);
            } else if (npc.npcKey === "merchant") {
              this.shopUI.open("Merchant", MERCHANT_SHOP);
            }
          });
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
          const bs = this.enemyBaseSize.get(enemyType);
          const dNatW = bs?.w || transform.width;
          const dNatH = bs?.h || transform.height;
          sprite.scale.set(transform.width / dNatW, transform.height / dNatH);
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
        const bs2 = this.enemyBaseSize.get(enemyType);
        const eNatW = bs2?.w || transform.width;
        const eNatH = bs2?.h || transform.height;
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

      if (this.npcEntities.has(id)) {
        sprite.x = transform.x + transform.width / 2;
        sprite.y = transform.y + transform.height / 2;
        const nNatW = sprite.texture?.orig?.width || transform.width;
        const uniScaleN = transform.width / nNatW;
        sprite.scale.set(uniScaleN, uniScaleN);
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
        const as = sprite as PIXI.AnimatedSprite;
        const alreadyPlaying = as.textures === anim.textures && as.playing;
        if (!alreadyPlaying) {

          as.textures = anim.textures;
          as.animationSpeed = anim.fps / 60;
          as.loop = anim.loop;
          as.gotoAndPlay(0);
        }
      }

      const firstFrame = anim?.textures?.[0];
      const frameRect = firstFrame?.frame;
      const natW = (frameRect ? frameRect.width : firstFrame?.orig?.width) || firstFrame?.baseTexture?.width || transform.width;
      const natH = (frameRect ? frameRect.height : firstFrame?.orig?.height) || firstFrame?.baseTexture?.height || transform.height;
      const uniScale = transform.width / natW;
      sprite.scale.set(uniScale, uniScale);

      if (anim?.mirrorX) {
        sprite.scale.x = -uniScale;
      }

      sprite.x = transform.x + transform.width / 2;
      sprite.y = transform.y + transform.height - (natH * uniScale) / 2;

      // Hide sprite after death animation finishes
      if (health && health.current <= 0) {
        const as2 = sprite as PIXI.AnimatedSprite;
        if (!as2.playing) {
          sprite.visible = false;
        }
      } else {
        sprite.visible = true;
      }
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

  }
}













