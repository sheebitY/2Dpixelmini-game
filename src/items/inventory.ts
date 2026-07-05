import { getItem, type ItemDef } from "./item-db";
import { eventBus } from "../core/event-bus";

export interface InventorySlot {
  itemId: string;
  quantity: number;
}

const MAX_SLOTS = 24;

class Inventory {
  private slots: (InventorySlot | null)[] = [];

  constructor() {
    // Start with empty slots
    for (let i = 0; i < MAX_SLOTS; i++) this.slots.push(null);
  }

  get size(): number {
    return MAX_SLOTS;
  }

  getSlot(index: number): InventorySlot | null {
    return this.slots[index] ?? null;
  }

  getAllSlots(): (InventorySlot | null)[] {
    return [...this.slots];
  }

  /** Add an item. Returns the number that could NOT be added (overflow). */
  addItem(itemId: string, quantity = 1): number {
    const def = getItem(itemId);
    if (!def) return quantity;

    let remaining = quantity;

    // First pass: stack onto existing slots
    if (def.stackable) {
      for (let i = 0; i < MAX_SLOTS && remaining > 0; i++) {
        const slot = this.slots[i];
        if (slot && slot.itemId === itemId) {
          const space = def.maxStack - slot.quantity;
          const add = Math.min(space, remaining);
          slot.quantity += add;
          remaining -= add;
        }
      }
    }

    // Second pass: fill empty slots
    while (remaining > 0) {
      const emptyIdx = this.slots.findIndex((s) => s === null);
      if (emptyIdx === -1) break; // inventory full

      const stackSize = def.stackable ? Math.min(remaining, def.maxStack) : 1;
      this.slots[emptyIdx] = { itemId, quantity: stackSize };
      remaining -= stackSize;
    }

    if (remaining < quantity) {
      eventBus.emit("inventory_changed");
    }
    return remaining; // items that couldn't fit
  }

  /** Remove quantity from a specific slot. Returns true if successful. */
  removeFromSlot(slotIndex: number, quantity = 1): boolean {
    const slot = this.slots[slotIndex];
    if (!slot) return false;
    if (slot.quantity < quantity) return false;
    slot.quantity -= quantity;
    if (slot.quantity <= 0) this.slots[slotIndex] = null;
    eventBus.emit("inventory_changed");
    return true;
  }

  /** Use an item from a slot. Returns true if the item was consumed. */
  useSlot(slotIndex: number, ctx: { heal: (n: number) => void; boostAtk: (n: number, d: number) => void; boostDef: (n: number, d: number) => void }): boolean {
    const slot = this.slots[slotIndex];
    if (!slot) return false;
    const def = getItem(slot.itemId);
    if (!def || !def.onUse) return false;

    const consumed = def.onUse(ctx);
    if (consumed) {
      this.removeFromSlot(slotIndex, 1);
    }
    return consumed;
  }

  /** Count how many of an item the player has. */
  countItems(itemId: string): number {
    let total = 0;
    for (const slot of this.slots) {
      if (slot && slot.itemId === itemId) total += slot.quantity;
    }
    return total;
  }

  clear(): void {
    for (let i = 0; i < MAX_SLOTS; i++) this.slots[i] = null;
    eventBus.emit("inventory_changed");
  }
}

export const inventory = new Inventory();
