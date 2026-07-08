import { inventory } from "./inventory";
import { getItem } from "./item-db";
import { eventBus } from "../core/event-bus";

export interface CraftingRecipe {
  id: string;
  name: string;
  result: { itemId: string; quantity: number };
  ingredients: { itemId: string; quantity: number }[];
}

export const RECIPES: CraftingRecipe[] = [
  // --- Starter tier ---
  {
    id: "craft_metal_helmet",
    name: "Metal Helmet",
    result: { itemId: "metal_helmet", quantity: 1 },
    ingredients: [
      { itemId: "metal_scrap", quantity: 3 },
      { itemId: "slime_gel", quantity: 3 },
    ],
  },
  {
    id: "craft_metal_chestplate",
    name: "Metal Chestplate",
    result: { itemId: "metal_chestplate", quantity: 1 },
    ingredients: [
      { itemId: "metal_scrap", quantity: 6 },
      { itemId: "bone_fragment", quantity: 3 },
      { itemId: "slime_gel", quantity: 2 },
    ],
  },
  {
    id: "craft_metal_leggings",
    name: "Metal Leggings",
    result: { itemId: "metal_leggings", quantity: 1 },
    ingredients: [
      { itemId: "metal_scrap", quantity: 5 },
      { itemId: "bone_fragment", quantity: 2 },
      { itemId: "slime_gel", quantity: 2 },
    ],
  },
  {
    id: "craft_eagle_boots",
    name: "Eagle Boots",
    result: { itemId: "eagle_boots", quantity: 1 },
    ingredients: [
      { itemId: "eagle_feather", quantity: 4 },
      { itemId: "slime_gel", quantity: 2 },
    ],
  },
  {
    id: "craft_tusk_sword",
    name: "Tusk Sword",
    result: { itemId: "tusk_sword", quantity: 1 },
    ingredients: [
      { itemId: "orc_tusk", quantity: 1 },
      { itemId: "bone_fragment", quantity: 4 },
      { itemId: "eagle_feather", quantity: 2 },
      { itemId: "metal_scrap", quantity: 2 },
    ],
  },
  // --- Dragon tier (uses gem + rare materials) ---
  {
    id: "craft_dragon_slayer",
    name: "Dragon Slayer",
    result: { itemId: "dragon_slayer", quantity: 1 },
    ingredients: [
      { itemId: "diamond", quantity: 1 },
      { itemId: "gem", quantity: 3 },
      { itemId: "orc_tusk", quantity: 4 },
      { itemId: "metal_scrap", quantity: 6 },
    ],
  },
  {
    id: "craft_dragon_helmet",
    name: "Dragon Helmet",
    result: { itemId: "dragon_helmet", quantity: 1 },
    ingredients: [
      { itemId: "gem", quantity: 2 },
      { itemId: "orc_tusk", quantity: 3 },
      { itemId: "metal_scrap", quantity: 3 },
      { itemId: "eagle_feather", quantity: 2 },
    ],
  },
  {
    id: "craft_dragon_chestplate",
    name: "Dragon Chestplate",
    result: { itemId: "dragon_chestplate", quantity: 1 },
    ingredients: [
      { itemId: "gem", quantity: 3 },
      { itemId: "diamond", quantity: 1 },
      { itemId: "orc_tusk", quantity: 6 },
      { itemId: "metal_scrap", quantity: 8 },
    ],
  },
  {
    id: "craft_dragon_leggings",
    name: "Dragon Leggings",
    result: { itemId: "dragon_leggings", quantity: 1 },
    ingredients: [
      { itemId: "gem", quantity: 2 },
      { itemId: "orc_tusk", quantity: 6 },
      { itemId: "metal_scrap", quantity: 5 },
    ],
  },
  {
    id: "craft_dragon_boots",
    name: "Dragon Boots",
    result: { itemId: "dragon_boots", quantity: 1 },
    ingredients: [
      { itemId: "gem", quantity: 2 },
      { itemId: "eagle_feather", quantity: 4 },
      { itemId: "metal_scrap", quantity: 4 },
    ],
  },
  // --- Consumables ---
  {
    id: "craft_health_potion",
    name: "Health Potion",
    result: { itemId: "health_potion", quantity: 2 },
    ingredients: [
      { itemId: "slime_gel", quantity: 3 },
    ],
  },
  {
    id: "craft_coffee",
    name: "Coffee",
    result: { itemId: "coffee", quantity: 1 },
    ingredients: [
      { itemId: "wood", quantity: 3 },
      { itemId: "slime_gel", quantity: 2 },
    ],
  },
];

class CraftingManager {
  /** Check if player has all ingredients for a recipe. */
  canCraft(recipe: CraftingRecipe): boolean {
    for (const ing of recipe.ingredients) {
      if (inventory.countItems(ing.itemId) < ing.quantity) return false;
    }
    return true;
  }

  /** Attempt to craft. Returns true if successful. */
  craft(recipeId: string): boolean {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;
    if (!this.canCraft(recipe)) return false;

    // Check if result fits in inventory
    const overflow = inventory.addItem(recipe.result.itemId, recipe.result.quantity);
    if (overflow > 0) return false; // inventory full

    // Consume ingredients
    for (const ing of recipe.ingredients) {
      this.consumeItems(ing.itemId, ing.quantity);
    }

    eventBus.emit("item_crafted", { recipeId, itemId: recipe.result.itemId });
    return true;
  }

  private consumeItems(itemId: string, quantity: number): void {
    let remaining = quantity;
    for (let i = 0; i < inventory.size && remaining > 0; i++) {
      const slot = inventory.getSlot(i);
      if (!slot || slot.itemId !== itemId) continue;
      const take = Math.min(remaining, slot.quantity);
      inventory.removeFromSlot(i, take);
      remaining -= take;
    }
  }
}

export const crafting = new CraftingManager();
