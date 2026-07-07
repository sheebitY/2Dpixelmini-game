import { inventory } from "../items/inventory";
import { getItem, rarityColor, isImageIcon } from "../items/item-db";
import { equipment, EQUIP_SLOTS, type EquipSlot } from "../items/equipment";
import { crafting, RECIPES } from "../items/crafting";
import { eventBus } from "../core/event-bus";
import { input } from "../core/input-manager";

export class InventoryUI {
  private overlay: HTMLElement;
  private grid: HTMLElement;
  private equipPanel: HTMLElement;
  private craftPanel: HTMLElement;
  private tooltip: HTMLElement;
  private tooltipName: HTMLElement;
  private tooltipDesc: HTMLElement;
  private tooltipAction: HTMLElement;
  private pickupToast: HTMLElement;

  private isOpen = false;
  private hoveredSlot = -1;
  private useCallback: ((slotIndex: number) => void) | null = null;

  constructor() {
    this.overlay     = document.getElementById("inventory-overlay")!;
    this.grid        = document.getElementById("inventory-grid")!;
    this.equipPanel  = document.getElementById("equip-panel")!;
    this.craftPanel  = document.getElementById("craft-panel")!;
    this.tooltip     = document.getElementById("inv-tooltip")!;
    this.tooltipName = document.getElementById("inv-tooltip-name")!;
    this.tooltipDesc = document.getElementById("inv-tooltip-desc")!;
    this.tooltipAction = document.getElementById("inv-tooltip-action")!;
    this.pickupToast = document.getElementById("pickup-toast")!;

    this.buildEquipSlots();
    this.buildSlots();
    this.buildCraftPanel();

    eventBus.on("item_picked_up", (data: { itemId: string; quantity: number }) => {
      this.showPickupToast(data.itemId, data.quantity);
    });

    eventBus.on("inventory_changed", () => {
      if (this.isOpen) { this.renderSlots(); this.renderCraftPanel(); }
    });

    eventBus.on("equipment_changed", () => {
      if (this.isOpen) this.renderEquipSlots();
    });
  }

  onUse(cb: (slotIndex: number) => void): void {
    this.useCallback = cb;
  }

  get visible(): boolean { return this.isOpen; }

  update(): void {
    if (input.isKeyJustPressed("KeyB")) {
      if (this.isOpen) this.close();
      else this.open();
    }
  }

  open(): void {
    this.isOpen = true;
    this.overlay.classList.add("open");
    this.renderSlots();
    this.renderEquipSlots();
    this.renderCraftPanel();
  }

  close(): void {
    this.isOpen = false;
    this.overlay.classList.remove("open");
    this.hideTooltip();
  }

  // ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
  //  Equipment panel (left side)
  // ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

  private buildEquipSlots(): void {
    this.equipPanel.innerHTML = '<div class="equip-title">Equipment</div>';
    for (const slotDef of EQUIP_SLOTS) {
      const el = document.createElement("div");
      el.className = "equip-slot";
      el.dataset.slot = slotDef.key;

      const icon = document.createElement("span");
      icon.className = "equip-slot-icon";
      el.appendChild(icon);

      const label = document.createElement("span");
      label.className = "equip-slot-label";
      label.textContent = slotDef.label;
      el.appendChild(label);

      const rarity = document.createElement("div");
      rarity.className = "equip-slot-rarity";
      el.appendChild(rarity);

      // Click to unequip
      el.addEventListener("click", () => this.onEquipClick(slotDef.key));

      // Drag-drop: accept items from inventory
      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "copy";
        el.classList.add("drag-over");
      });
      el.addEventListener("dragleave", () => el.classList.remove("drag-over"));
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("drag-over");
        const invIdx = parseInt(e.dataTransfer!.getData("text/plain"), 10);
        if (isNaN(invIdx)) return;
        this.handleEquipDrop(slotDef.key, invIdx);
      });

      this.equipPanel.appendChild(el);
    }
  }

  private handleEquipDrop(slot: EquipSlot, invIdx: number): void {
    const invSlot = inventory.getSlot(invIdx);
    if (!invSlot) return;
    const def = getItem(invSlot.itemId);
    if (!def || def.category !== "equipment" || def.equipSlot !== slot) return;

    // Unequip current if any
    const prev = equipment.unequip(slot);
    if (prev) inventory.addItem(prev, 1);

    // Equip new (remove from inventory)
    inventory.removeFromSlot(invIdx, 1);
    equipment.equip(slot, invSlot.itemId);

    this.renderSlots();
    this.renderEquipSlots();
    this.renderCraftPanel();
  }

  private onEquipClick(slot: EquipSlot): void {
    const itemId = equipment.get(slot);
    if (!itemId) return;
    // Unequip back to inventory
    const overflow = inventory.addItem(itemId, 1);
    if (overflow > 0) return; // inventory full
    equipment.unequip(slot);
    this.renderSlots();
    this.renderEquipSlots();
    this.renderCraftPanel();
  }

  private renderEquipSlots(): void {
    const children = this.equipPanel.children;
    for (let i = 1; i < children.length; i++) { // skip title
      const el = children[i] as HTMLElement;
      const slotKey = el.dataset.slot as EquipSlot;
      const itemId = equipment.get(slotKey);
      const icon = el.querySelector(".equip-slot-icon") as HTMLElement;
      const rarity = el.querySelector(".equip-slot-rarity") as HTMLElement;

      if (itemId) {
        const def = getItem(itemId);
        el.classList.add("has-item");
        setIconContent(icon, def?.icon ?? "?");
        rarity.style.background = def ? rarityColor(def.rarity) : "transparent";
      } else {
        el.classList.remove("has-item");
        const slotDef = EQUIP_SLOTS.find(s => s.key === slotKey);
        setIconContent(icon, slotDef?.icon ?? "");
        rarity.style.background = "transparent";
      }
    }
  }

  // ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
  //  Inventory grid (center)
  // ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

  private buildSlots(): void {
    this.grid.innerHTML = "";
    for (let i = 0; i < inventory.size; i++) {
      const slot = document.createElement("div");
      slot.className = "inv-slot";
      slot.draggable = true;
      slot.dataset.index = String(i);

      const icon = document.createElement("span");
      icon.className = "inv-slot-icon";
      slot.appendChild(icon);

      const qty = document.createElement("span");
      qty.className = "inv-slot-qty";
      slot.appendChild(qty);

      const rarity = document.createElement("div");
      rarity.className = "inv-slot-rarity";
      slot.appendChild(rarity);

      slot.addEventListener("mouseenter", () => this.onSlotHover(i));
      slot.addEventListener("mouseleave", () => this.onSlotLeave());
      slot.addEventListener("click", () => this.onSlotClick(i));

      this.grid.appendChild(slot);
    }
  }

  renderSlots(): void {
    const children = this.grid.children;
    for (let i = 0; i < inventory.size; i++) {
      const el = children[i] as HTMLElement;
      const slot = inventory.getSlot(i);
      const icon = el.querySelector(".inv-slot-icon") as HTMLElement;
      const qty  = el.querySelector(".inv-slot-qty") as HTMLElement;
      const rarity = el.querySelector(".inv-slot-rarity") as HTMLElement;

      if (slot) {
        const def = getItem(slot.itemId);
        el.classList.add("has-item");
        setIconContent(icon, def?.icon ?? "?");
        qty.textContent  = slot.quantity > 1 ? String(slot.quantity) : "";
        rarity.style.background = def ? rarityColor(def.rarity) : "transparent";
      } else {
        el.classList.remove("has-item");
        clearIcon(icon);
        qty.textContent  = "";
        rarity.style.background = "transparent";
      }
    }
  }

  private onSlotHover(index: number): void {
    const slot = inventory.getSlot(index);
    if (!slot) return;
    this.hoveredSlot = index;
    const def = getItem(slot.itemId);
    if (!def) return;

    this.tooltipName.textContent = def.name;
    this.tooltipName.style.color = rarityColor(def.rarity);
    this.tooltipDesc.textContent = def.description;
    this.tooltipAction.textContent = def.onUse ? "[Click] Use" : def.category === "equipment" ? "[Drag] Equip" : "Material";

    const slotEl = this.grid.children[index] as HTMLElement;
    const rect = slotEl.getBoundingClientRect();
    this.tooltip.style.left = (rect.right + 8) + "px";
    this.tooltip.style.top  = rect.top + "px";
    this.tooltip.classList.add("show");
  }

  private onSlotLeave(): void {
    this.hoveredSlot = -1;
    this.hideTooltip();
  }

  private hideTooltip(): void {
    this.tooltip.classList.remove("show");
  }

  private onSlotClick(index: number): void {
    if (!this.isOpen) return;
    const slot = inventory.getSlot(index);
    if (!slot) return;
    const def = getItem(slot.itemId);
    if (!def?.onUse) return;

    if (this.useCallback) this.useCallback(index);
    this.renderSlots();
    if (this.hoveredSlot === index) this.onSlotHover(index);
  }

  // ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
  //  Crafting panel (right side)
  // ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

  private buildCraftPanel(): void {
    this.craftPanel.innerHTML = '<div class="craft-title">Crafting</div>';
    for (const recipe of RECIPES) {
      const el = document.createElement("div");
      el.className = "craft-recipe";
      el.dataset.recipeId = recipe.id;

      const name = document.createElement("div");
      name.className = "craft-recipe-name";
      const resultDef = getItem(recipe.result.itemId);
      name.textContent = (resultDef?.icon ?? "") + " " + recipe.name;
      el.appendChild(name);

      for (const ing of recipe.ingredients) {
        const ingEl = document.createElement("div");
        ingEl.className = "craft-recipe-ing";
        ingEl.dataset.itemId = ing.itemId;
        const ingDef = getItem(ing.itemId);
        ingEl.textContent = (ingDef?.icon ?? "?") + " " + (ingDef?.name ?? ing.itemId) + " x" + ing.quantity;
        el.appendChild(ingEl);
      }

      const arrow = document.createElement("div");
      arrow.className = "craft-arrow";
      arrow.textContent = "?? Craft";
      el.appendChild(arrow);

      el.addEventListener("click", () => this.onCraftClick(recipe.id));
      this.craftPanel.appendChild(el);
    }
  }

  private renderCraftPanel(): void {
    const children = this.craftPanel.children;
    for (let i = 1; i < children.length; i++) { // skip title
      const el = children[i] as HTMLElement;
      const recipeId = el.dataset.recipeId;
      const recipe = RECIPES.find(r => r.id === recipeId);
      if (!recipe) continue;

      const canCraft = crafting.canCraft(recipe);
      el.classList.toggle("cannot-craft", !canCraft);

      // Update ingredient colors
      const ingEls = el.querySelectorAll(".craft-recipe-ing");
      ingEls.forEach((ingEl) => {
        const itemId = (ingEl as HTMLElement).dataset.itemId;
        const ing = recipe.ingredients.find(x => x.itemId === itemId);
        if (!ing || !itemId) return;
        const have = inventory.countItems(itemId);
        ingEl.classList.toggle("has-enough", have >= ing.quantity);
        ingEl.classList.toggle("not-enough", have < ing.quantity);
      });
    }
  }

  private onCraftClick(recipeId: string): void {
    const success = crafting.craft(recipeId);
    if (!success) return;
    this.renderSlots();
    this.renderCraftPanel();
  }

  // ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
  //  Pickup toast
  // ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

  private showPickupToast(itemId: string, qty: number): void {
    const def = getItem(itemId);
    if (!def) return;

    const msg = document.createElement("div");
    msg.className = "pickup-msg";
    msg.innerHTML = iconHtml(def.icon) + ' <span style="color:' + rarityColor(def.rarity) + '">' + def.name + '</span> x' + qty;
    this.pickupToast.appendChild(msg);

    setTimeout(() => msg.classList.add("fade-out"), 2000);
    setTimeout(() => { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 2600);
  }
}

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
//  Icon helpers
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

function setIconContent(el: HTMLElement, icon: string): void {
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

function clearIcon(el: HTMLElement): void {
  el.textContent = "";
  const img = el.querySelector("img");
  if (img) img.remove();
}

function iconHtml(icon: string): string {
  if (isImageIcon(icon)) {
    return '<img src="' + icon + '" class="item-icon-img" style="width:20px;height:20px;vertical-align:middle;">';
  }
  return icon;
}
