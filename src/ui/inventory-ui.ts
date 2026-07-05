import { inventory } from "../items/inventory";
import { getItem, rarityColor } from "../items/item-db";
import { eventBus } from "../core/event-bus";
import { input } from "../core/input-manager";

export class InventoryUI {
  private overlay: HTMLElement;
  private grid: HTMLElement;
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
    this.tooltip     = document.getElementById("inv-tooltip")!;
    this.tooltipName = document.getElementById("inv-tooltip-name")!;
    this.tooltipDesc = document.getElementById("inv-tooltip-desc")!;
    this.tooltipAction = document.getElementById("inv-tooltip-action")!;
    this.pickupToast = document.getElementById("pickup-toast")!;

    this.buildSlots();

    // Listen for pickups
    eventBus.on("item_picked_up", (data: { itemId: string; quantity: number }) => {
      this.showPickupToast(data.itemId, data.quantity);
    });

    // Re-render when inventory changes
    eventBus.on("inventory_changed", () => {
      if (this.isOpen) this.renderSlots();
    });
  }

  /** Register a callback so the scene can handle item usage (healing, buffs etc.) */
  onUse(cb: (slotIndex: number) => void): void {
    this.useCallback = cb;
  }

  get visible(): boolean {
    return this.isOpen;
  }

  /** Call every frame from the scene update loop. */
  update(): void {
    // Toggle with B
    if (input.isKeyJustPressed("KeyB")) {
      if (this.isOpen) this.close();
      else this.open();
    }
  }

  open(): void {
    this.isOpen = true;
    this.overlay.classList.add("open");
    this.renderSlots();
  }

  close(): void {
    this.isOpen = false;
    this.overlay.classList.remove("open");
    this.hideTooltip();
  }

  // ���� Slot grid ����

  private buildSlots(): void {
    this.grid.innerHTML = "";
    for (let i = 0; i < inventory.size; i++) {
      const slot = document.createElement("div");
      slot.className = "inv-slot";
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

      // Hover events
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
        icon.textContent = def?.icon ?? "?";
        qty.textContent  = slot.quantity > 1 ? String(slot.quantity) : "";
        rarity.style.background = def ? rarityColor(def.rarity) : "transparent";
      } else {
        el.classList.remove("has-item");
        icon.textContent = "";
        qty.textContent  = "";
        rarity.style.background = "transparent";
      }
    }
  }

  // ���� Tooltip ����

  private onSlotHover(index: number): void {
    const slot = inventory.getSlot(index);
    if (!slot) return;
    this.hoveredSlot = index;
    const def = getItem(slot.itemId);
    if (!def) return;

    this.tooltipName.textContent = def.name;
    this.tooltipName.style.color = rarityColor(def.rarity);
    this.tooltipDesc.textContent = def.description;
    this.tooltipAction.textContent = def.onUse ? "[Click] Use" : "Material";

    // Position tooltip near the slot
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

  // ���� Click to use ����

  private onSlotClick(index: number): void {
    if (!this.isOpen) return;
    const slot = inventory.getSlot(index);
    if (!slot) return;
    const def = getItem(slot.itemId);
    if (!def?.onUse) return;

    // Tell the scene to apply the effect
    if (this.useCallback) {
      this.useCallback(index);
    }

    // Re-render in case item was consumed
    this.renderSlots();
    // Refresh tooltip
    if (this.hoveredSlot === index) this.onSlotHover(index);
  }

  // ���� Pickup toast ����

  private showPickupToast(itemId: string, qty: number): void {
    const def = getItem(itemId);
    if (!def) return;

    const msg = document.createElement("div");
    msg.className = "pickup-msg";
    msg.innerHTML = `${def.icon} <span style="color:${rarityColor(def.rarity)}">${def.name}</span> x${qty}`;
    this.pickupToast.appendChild(msg);

    // Fade out after 2 seconds
    setTimeout(() => msg.classList.add("fade-out"), 2000);
    setTimeout(() => {
      if (msg.parentNode) msg.parentNode.removeChild(msg);
    }, 2600);
  }
}
