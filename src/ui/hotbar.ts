import { inventory, type InventorySlot } from "../items/inventory";
import { getItem, rarityColor, isImageIcon, type ItemDef } from "../items/item-db";
import { eventBus } from "../core/event-bus";
import { input } from "../core/input-manager";

const HOTBAR_SIZE = 5;

export class Hotbar {
  private container: HTMLElement;
  private slots: HTMLElement[] = [];
  /** Maps hotbar slot index -> inventory slot index, or -1 if empty */
  private bindings: number[] = [];
  private tooltip: HTMLElement;
  private tooltipName: HTMLElement;
  private tooltipDesc: HTMLElement;
  private useCallback: ((slotIndex: number) => void) | null = null;

  constructor() {
    this.container = document.getElementById("hotbar")!;
    this.tooltip = document.getElementById("hotbar-tooltip")!;
    this.tooltipName = document.getElementById("hotbar-tooltip-name")!;
    this.tooltipDesc = document.getElementById("hotbar-tooltip-desc")!;

    for (let i = 0; i < HOTBAR_SIZE; i++) this.bindings.push(-1);

    this.buildSlots();
    this.bindDragEvents();
    this.bindKeyEvents();

    eventBus.on("inventory_changed", () => this.render());
  }

  onUse(cb: (slotIndex: number) => void): void {
    this.useCallback = cb;
  }

  /** Call every frame from the scene update loop. */
  update(): void {
    // Handled via keydown events in bindKeyEvents
  }

  // -- Slot construction --

  private buildSlots(): void {
    this.container.innerHTML = "";
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slot = document.createElement("div");
      slot.className = "hotbar-slot";
      slot.dataset.index = String(i);

      const keyLabel = document.createElement("span");
      keyLabel.className = "hotbar-key";
      keyLabel.textContent = String(i + 1);
      slot.appendChild(keyLabel);

      const icon = document.createElement("span");
      icon.className = "hotbar-icon";
      slot.appendChild(icon);

      const qty = document.createElement("span");
      qty.className = "hotbar-qty";
      slot.appendChild(qty);

      const rarity = document.createElement("div");
      rarity.className = "hotbar-rarity";
      slot.appendChild(rarity);

      // Hover tooltip
      slot.addEventListener("mouseenter", () => this.onSlotHover(i));
      slot.addEventListener("mouseleave", () => this.hideTooltip());

      this.slots.push(slot);
      this.container.appendChild(slot);
    }
  }

  // -- Drag-and-drop from inventory --

  private bindDragEvents(): void {
    // Make inventory slots draggable (delegate from document)
    document.addEventListener("dragstart", (e) => {
      const target = e.target as HTMLElement;
      const invSlot = target.closest(".inv-slot.has-item") as HTMLElement;
      if (!invSlot) return;
      const idx = parseInt(invSlot.dataset.index ?? "-1", 10);
      if (idx < 0) return;
      e.dataTransfer!.setData("text/plain", String(idx));
      e.dataTransfer!.effectAllowed = "copy";
      invSlot.classList.add("dragging");
      // Clean up after drag ends
      const onEnd = () => { invSlot.classList.remove("dragging"); invSlot.removeEventListener("dragend", onEnd); };
      invSlot.addEventListener("dragend", onEnd);
    });

    // Hotbar slots accept drops
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slot = this.slots[i];
      slot.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "copy";
        slot.classList.add("drag-over");
      });
      slot.addEventListener("dragleave", () => {
        slot.classList.remove("drag-over");
      });
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        slot.classList.remove("drag-over");
        const invIdx = parseInt(e.dataTransfer!.getData("text/plain"), 10);
        if (isNaN(invIdx)) return;
        const invSlot = inventory.getSlot(invIdx);
        if (!invSlot) return;
        const def = getItem(invSlot.itemId);
        if (!def || def.category !== "consumable") return; // Only consumables
        this.bindings[i] = invIdx;
        this.render();
      });
    }
  }

  // -- Key press to use --

  private bindKeyEvents(): void {
    window.addEventListener("keydown", (e) => {
      // Skip if modifier keys are held (allow browser shortcuts)
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const slotIdx = parseInt(e.key, 10) - 1;
      if (slotIdx < 0 || slotIdx >= HOTBAR_SIZE) return;
      e.preventDefault();
      this.useSlot(slotIdx);
    });
  }

  private useSlot(hotbarIdx: number): void {
    const invIdx = this.bindings[hotbarIdx];
    if (invIdx < 0) return;
    const slot = inventory.getSlot(invIdx);
    if (!slot) {
      // Item was consumed or removed, unbind
      this.bindings[hotbarIdx] = -1;
      this.render();
      return;
    }
    const def = getItem(slot.itemId);
    if (!def || !def.onUse) return;

    // Use via the scene callback
    if (this.useCallback) {
      this.useCallback(invIdx);
    }

    // If the item was fully consumed, unbind
    const afterSlot = inventory.getSlot(invIdx);
    if (!afterSlot) {
      this.bindings[hotbarIdx] = -1;
    }
    this.render();
  }

  // -- Rendering --

  render(): void {
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const el = this.slots[i];
      const icon = el.querySelector(".hotbar-icon") as HTMLElement;
      const qty = el.querySelector(".hotbar-qty") as HTMLElement;
      const rarity = el.querySelector(".hotbar-rarity") as HTMLElement;

      const invIdx = this.bindings[i];
      const invSlot = invIdx >= 0 ? inventory.getSlot(invIdx) : null;

      // Validate binding still points to the same item
      if (invSlot) {
        const def = getItem(invSlot.itemId);
        el.classList.add("has-item");
        setHotbarIcon(icon, def?.icon ?? "");
        qty.textContent = invSlot.quantity > 1 ? String(invSlot.quantity) : "";
        rarity.style.background = def ? rarityColor(def.rarity) : "transparent";
      } else {
        this.bindings[i] = -1;
        el.classList.remove("has-item");
        clearHotbarIcon(icon);
        qty.textContent = "";
        rarity.style.background = "transparent";
      }
    }
  }

  // -- Tooltip --

  private onSlotHover(i: number): void {
    const invIdx = this.bindings[i];
    if (invIdx < 0) return;
    const invSlot = inventory.getSlot(invIdx);
    if (!invSlot) return;
    const def = getItem(invSlot.itemId);
    if (!def) return;

    this.tooltipName.textContent = def.name;
    this.tooltipName.style.color = rarityColor(def.rarity);
    this.tooltipDesc.textContent = def.description + " [" + (i + 1) + "]";

    const rect = this.slots[i].getBoundingClientRect();
    this.tooltip.style.left = rect.left + "px";
    this.tooltip.style.top = (rect.top - 60) + "px";
    this.tooltip.classList.add("show");
  }

  private hideTooltip(): void {
    this.tooltip.classList.remove("show");
  }
}

function setHotbarIcon(el: HTMLElement, icon: string): void {
  if (isImageIcon(icon)) {
    el.textContent = "";
    let img = el.querySelector("img") as HTMLImageElement;
    if (!img) {
      img = document.createElement("img");
      img.className = "item-icon-img";
      el.appendChild(img);
    }
    img.src = icon;
  } else {
    const img = el.querySelector("img");
    if (img) img.remove();
    el.textContent = icon;
  }
}

function clearHotbarIcon(el: HTMLElement): void {
  el.textContent = "";
  const img = el.querySelector("img");
  if (img) img.remove();
}
