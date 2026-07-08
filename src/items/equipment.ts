import { getItem, type ItemDef } from "./item-db";
import { eventBus } from "../core/event-bus";

export type EquipSlot = "weapon" | "helmet" | "chestplate" | "leggings" | "boots";

export const EQUIP_SLOTS: { key: EquipSlot; label: string; icon: string }[] = [
  { key: "weapon",     label: "Weapon",   icon: "??" },
  { key: "helmet",     label: "Helmet",   icon: "??" },
  { key: "chestplate", label: "Chest",    icon: "???" },
  { key: "leggings",   label: "Legs",     icon: "??" },
  { key: "boots",      label: "Boots",    icon: "??" },
];

export interface EquippedItems {
  weapon: string | null;
  helmet: string | null;
  chestplate: string | null;
  leggings: string | null;
  boots: string | null;
}

export interface EquipBonus {
  atk: number;
  def: number;
  hp: number;
  speed: number;
}

class EquipmentManager {
  private equipped: EquippedItems = {
    weapon: null, helmet: null, chestplate: null, leggings: null, boots: null,
  };

  get(slot: EquipSlot): string | null {
    return this.equipped[slot];
  }

  getAll(): Readonly<EquippedItems> {
    return this.equipped;
  }

  /** Equip an item. Returns the previously equipped itemId, or null. */
  equip(slot: EquipSlot, itemId: string): string | null {
    const prev = this.equipped[slot];
    this.equipped[slot] = itemId;
    eventBus.emit("equipment_changed");
    return prev;
  }

  /** Unequip. Returns the removed itemId, or null. */
  unequip(slot: EquipSlot): string | null {
    const prev = this.equipped[slot];
    if (!prev) return null;
    this.equipped[slot] = null;
    eventBus.emit("equipment_changed");
    return prev;
  }

  /** Calculate total stat bonus from all equipped items. */
  getBonus(): EquipBonus {
    let atk = 0, def = 0, hp = 0, speed = 0;
    for (const key of Object.keys(this.equipped) as EquipSlot[]) {
      const itemId = this.equipped[key];
      if (!itemId) continue;
      const def_ = getItem(itemId);
      if (!def_?.equipStats) continue;
      atk += def_.equipStats.atk ?? 0;
      def += def_.equipStats.def ?? 0;
      hp  += def_.equipStats.hp  ?? 0;
      speed += def_.equipStats.speed ?? 0;
    }
    return { atk, def, hp, speed };
  }

  clear(): void {
    this.equipped = { weapon: null, helmet: null, chestplate: null, leggings: null, boots: null };
    eventBus.emit("equipment_changed");
  }
}

export const equipment = new EquipmentManager();
