import { inventory } from "../items/inventory";
import { getItem, rarityColor, isImageIcon } from "../items/item-db";
import { input } from "../core/input-manager";
import { eventBus } from "../core/event-bus";

export interface ShopItem {
  itemId: string;
  price?: number; // in gold (future currency)
  currency?: string; // item id to use as currency instead of gold
  currencyQty?: number;
}

export class ShopUI {
  private overlay: HTMLElement;
  private panel: HTMLElement;
  private titleEl: HTMLElement;
  private grid: HTMLElement;
  private tooltip: HTMLElement;
  private tooltipName: HTMLElement;
  private tooltipDesc: HTMLElement;
  private tooltipPrice: HTMLElement;
  private hint: HTMLElement;

  private isOpen = false;
  private items: ShopItem[] = [];
  private shopName = "Shop";

  constructor() {
    this.overlay = document.getElementById("shop-overlay")!;
    this.panel = document.getElementById("shop-panel")!;
    this.titleEl = document.getElementById("shop-title")!;
    this.grid = document.getElementById("shop-grid")!;
    this.tooltip = document.getElementById("shop-tooltip")!;
    this.tooltipName = document.getElementById("shop-tooltip-name")!;
    this.tooltipDesc = document.getElementById("shop-tooltip-desc")!;
    this.tooltipPrice = document.getElementById("shop-tooltip-price")!;
    this.hint = document.getElementById("shop-hint")!;
  }

  get visible(): boolean { return this.isOpen; }

  open(shopName: string, items: ShopItem[]): void {
    this.shopName = shopName;
    this.items = items;
    this.isOpen = true;
    this.titleEl.textContent = shopName;
    this.overlay.style.display = "flex";
    requestAnimationFrame(() => this.overlay.classList.add("visible"));
    this.render();
  }

  close(): void {
    this.isOpen = false;
    this.overlay.classList.remove("visible");
    setTimeout(() => { this.overlay.style.display = "none"; }, 300);
    this.hideTooltip();
  }

  update(): void {
    if (this.isOpen && (input.isKeyJustPressed("Escape") || input.isKeyJustPressed("KeyF"))) {
      this.close();
      input.clearJustPressed();
    }
  }

  private render(): void {
    this.grid.innerHTML = "";

    for (let i = 0; i < this.items.length; i++) {
      const shopItem = this.items[i];
      const def = getItem(shopItem.itemId);
      if (!def) continue;

      const slot = document.createElement("div");
      slot.className = "shop-slot";

      // Icon
      const icon = document.createElement("span");
      icon.className = "shop-slot-icon";
      if (isImageIcon(def.icon)) {
        const img = document.createElement("img");
        img.className = "item-icon-img";
        img.src = def.icon;
        icon.appendChild(img);
      } else {
        icon.textContent = def.icon;
      }
      slot.appendChild(icon);

      // Name
      const name = document.createElement("div");
      name.className = "shop-slot-name";
      name.textContent = def.name;
      name.style.color = rarityColor(def.rarity);
      slot.appendChild(name);

      // Price
      const price = document.createElement("div");
      price.className = "shop-slot-price";
      price.textContent = this.formatPrice(shopItem);
      slot.appendChild(price);

      // Rarity bar
      const rarity = document.createElement("div");
      rarity.className = "shop-slot-rarity";
      rarity.style.backgroundColor = rarityColor(def.rarity);
      slot.appendChild(rarity);

      // Hover
      slot.addEventListener("mouseenter", () => this.showTooltip(shopItem, slot));
      slot.addEventListener("mouseleave", () => this.hideTooltip());

      // Click to buy
      slot.addEventListener("click", () => this.buyItem(i));

      this.grid.appendChild(slot);
    }
  }

  private formatPrice(shopItem: ShopItem): string {
    if (shopItem.currency) {
      const cDef = getItem(shopItem.currency);
      return `${shopItem.currencyQty ?? 1}x ${cDef?.name ?? shopItem.currency}`;
    }
    return `${shopItem.price}G`;
  }

  private buyItem(index: number): void {
    const shopItem = this.items[index];
    const def = getItem(shopItem.itemId);
    if (!def) return;

    // Check currency
    if (shopItem.currency) {
      const have = inventory.countItems(shopItem.currency);
      const cost = shopItem.currencyQty ?? 1;
      if (have < cost) {
        this.hint.textContent = "Not enough materials!";
        setTimeout(() => { this.hint.textContent = "Click to buy"; }, 1500);
        return;
      }
      // Remove currency items
      let remaining = cost;
      for (let i = 0; i < inventory.size && remaining > 0; i++) {
        const slot = inventory.getSlot(i);
        if (!slot || slot.itemId !== shopItem.currency) continue;
        const take = Math.min(remaining, slot.quantity);
        inventory.removeFromSlot(i, take);
        remaining -= take;
      }
    }
    // TODO: gold currency check when gold system is added

    // Add item to inventory
    const overflow = inventory.addItem(shopItem.itemId, 1);
    if (overflow > 0) {
      this.hint.textContent = "Inventory full!";
      // Refund currency
      if (shopItem.currency) {
        inventory.addItem(shopItem.currency, shopItem.currencyQty ?? 1);
      }
      setTimeout(() => { this.hint.textContent = "Click to buy"; }, 1500);
      return;
    }

    this.hint.textContent = `Purchased ${def.name}!`;
    setTimeout(() => { this.hint.textContent = "Click to buy"; }, 1500);
  }

  private showTooltip(shopItem: ShopItem, el: HTMLElement): void {
    const def = getItem(shopItem.itemId);
    if (!def) return;

    this.tooltipName.textContent = def.name;
    this.tooltipName.style.color = rarityColor(def.rarity);
    this.tooltipDesc.textContent = def.description;
    this.tooltipPrice.textContent = "Price: " + this.formatPrice(shopItem);

    // Position tooltip near the slot
    const rect = el.getBoundingClientRect();
    this.tooltip.style.left = (rect.right + 10) + "px";
    this.tooltip.style.top = rect.top + "px";
    this.tooltip.classList.add("show");
  }

  private hideTooltip(): void {
    this.tooltip.classList.remove("show");
  }
}