import { inventory, type InventorySlot } from "../items/inventory";
import { equipment, type EquippedItems } from "../items/equipment";
import { eventBus } from "./event-bus";

const SAVE_KEY = "pixel-rpg-save";
const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  timestamp: number;
  inventory: (InventorySlot | null)[];
  equipment: EquippedItems;
  player: {
    level: number;
    exp: number;
    expToLevel: number;
    hp: number;
    maxHp: number;
    baseAtk: number;
    baseDef: number;
    mapId: string;
    x: number;
    y: number;
  };
}

// External hooks �� set by gameplay-scene so save-manager can read game state
type GetPlayerState = () => SaveData["player"] | null;
let getPlayerState: GetPlayerState | null = null;

export function setPlayerStateGetter(fn: GetPlayerState): void {
  getPlayerState = fn;
}

// �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T
//  Core save / load
// �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T

const DEFAULT_PLAYER: SaveData["player"] = {
  level: 1, exp: 0, expToLevel: 50,
  hp: 100, maxHp: 100, baseAtk: 15, baseDef: 5,
  mapId: "meadow_village", x: 12, y: 9,
};

function collectSaveData(): SaveData {
  const playerState = getPlayerState?.() ?? DEFAULT_PLAYER;

  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    inventory: inventory.getAllSlots(),
    equipment: equipment.getAll(),
    player: playerState,
  };
}

export function saveGame(): boolean {
  const data = collectSaveData();
  try {
    localStorage.setItem(SAVE_KEY, encodeSave(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const decoded = decodeSave(raw);
    const data = JSON.parse(decoded) as SaveData;
    if (data.version !== SAVE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

// �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T
//  Apply loaded data to game systems
// �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T

export function applySaveToInventory(data: SaveData): void {
  inventory.clear();
  for (let i = 0; i < data.inventory.length; i++) {
    const slot = data.inventory[i];
    if (slot) {
      // Directly set slot data (bypass normal addItem to preserve exact positions)
      inventory.setSlot(i, slot.itemId, slot.quantity);
    }
  }
}

export function applySaveToEquipment(data: SaveData): void {
  equipment.clear();
  const eq = data.equipment;
  for (const key of Object.keys(eq) as (keyof EquippedItems)[]) {
    const itemId = eq[key];
    if (itemId) {
      equipment.equip(key, itemId);
    }
  }
}

// �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T
//  Auto-save (debounced)
// �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutoSave(): void {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    saveGame();
    autoSaveTimer = null;
  }, 500); // debounce 500ms
}

export function initAutoSave(): void {
  eventBus.on("inventory_changed", scheduleAutoSave);
  eventBus.on("equipment_changed", scheduleAutoSave);
  eventBus.on("item_crafted", scheduleAutoSave);
  eventBus.on("player_leveled_up", scheduleAutoSave);
  // Map transition save is handled explicitly in gameplay-scene
}

// �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T
//  Export / Import (for settings UI)
// �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T

export function exportSaveToFile(): boolean {
  const data = collectSaveData();
  const encoded = encodeSave(data);
  const blob = new Blob([encoded], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pixel-rpg-save.json";
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export function importSaveFromFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = reader.result as string;
        const decoded = decodeSave(raw);
        const data = JSON.parse(decoded) as SaveData;
        if (data.version !== SAVE_VERSION) { resolve(false); return; }
        localStorage.setItem(SAVE_KEY, encodeSave(data));
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}

// �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T
//  Simple encoding (Base64 + char shift)
// �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T

export function encodeSave(data: SaveData): string {
  const json = JSON.stringify(data);
  const shifted = json.split("").map(c => String.fromCharCode(c.charCodeAt(0) + 3)).join("");
  return btoa(shifted);
}

function decodeSave(encoded: string): string {
  const shifted = atob(encoded);
  return shifted.split("").map(c => String.fromCharCode(c.charCodeAt(0) - 3)).join("");
}