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
  {
    id: "craft_bone_helmet",
    name: "Bone Helmet",
    result: { itemId: "bone_helmet", quantity: 1 },
    ingredients: [
      { itemId: "bone_fragment", quantity: 5 },
      { itemId: "slime_gel", quantity: 3 },
    ],
  },
  {
    id: "craft_slime_chestplate",
    name: "Slime Chestplate",
    result: { itemId: "slime_chestplate", quantity: 1 },
    ingredients: [
      { itemId: "slime_gel", quantity: 8 },
      { itemId: "bone_fragment", quantity: 2 },
    ],
  },
  {
    id: "craft_bone_leggings",
    name: "Bone Leggings",
    result: { itemId: "bone_leggings", quantity: 1 },
    ingredients: [
      { itemId: "bone_fragment", quantity: 6 },
      { itemId: "orc_tusk", quantity: 1 },
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
      { itemId: "orc_tusk", quantity: 3 },
      { itemId: "bone_fragment", quantity: 4 },
    ],
  },
  {
    id: "craft_iron_sword",
    name: "Iron Sword",
    result: { itemId: "iron_sword", quantity: 1 },
    ingredients: [
      { itemId: "bone_fragment", quantity: 8 },
      { itemId: "slime_gel", quantity: 4 },
    ],
  },
  {
    id: "craft_flame_blade",
    name: "Flame Blade",
    result: { itemId: "flame_blade", quantity: 1 },
    ingredients: [
      { itemId: "orc_tusk", quantity: 5 },
      { itemId: "eagle_feather", quantity: 3 },
      { itemId: "bone_fragment", quantity: 6 },
    ],
  },
  {
    id: "craft_dragon_slayer",
    name: "Dragon Slayer",
    result: { itemId: "dragon_slayer", quantity: 1 },
    ingredients: [
      { itemId: "orc_tusk", quantity: 8 },
      { itemId: "eagle_feather", quantity: 6 },
      { itemId: "bone_fragment", quantity: 10 },
    ],
  },
  // --- Iron tier ---
  {
    id: "craft_iron_helmet",
    name: "Iron Helmet",
    result: { itemId: "iron_helmet", quantity: 1 },
    ingredients: [
      { itemId: "bone_fragment", quantity: 6 },
      { itemId: "slime_gel", quantity: 3 },
    ],
  },
  {
    id: "craft_iron_chestplate",
    name: "Iron Chestplate",
    result: { itemId: "iron_chestplate", quantity: 1 },
    ingredients: [
      { itemId: "bone_fragment", quantity: 10 },
      { itemId: "slime_gel", quantity: 5 },
    ],
  },
  {
    id: "craft_iron_leggings",
    name: "Iron Leggings",
    result: { itemId: "iron_leggings", quantity: 1 },
    ingredients: [
      { itemId: "bone_fragment", quantity: 8 },
      { itemId: "slime_gel", quantity: 4 },
    ],
  },
  {
    id: "craft_iron_boots",
    name: "Iron Boots",
    result: { itemId: "iron_boots", quantity: 1 },
    ingredients: [
      { itemId: "bone_fragment", quantity: 5 },
      { itemId: "slime_gel", quantity: 3 },
    ],
  },
  // --- Steel tier ---
  {
    id: "craft_steel_helmet",
    name: "Steel Helmet",
    result: { itemId: "steel_helmet", quantity: 1 },
    ingredients: [
      { itemId: "orc_tusk", quantity: 3 },
      { itemId: "bone_fragment", quantity: 8 },
      { itemId: "eagle_feather", quantity: 2 },
    ],
  },
  {
    id: "craft_steel_chestplate",
    name: "Steel Chestplate",
    result: { itemId: "steel_chestplate", quantity: 1 },
    ingredients: [
      { itemId: "orc_tusk", quantity: 5 },
      { itemId: "bone_fragment", quantity: 12 },
      { itemId: "eagle_feather", quantity: 3 },
    ],
  },
  {
    id: "craft_steel_leggings",
    name: "Steel Leggings",
    result: { itemId: "steel_leggings", quantity: 1 },
    ingredients: [
      { itemId: "orc_tusk", quantity: 4 },
      { itemId: "bone_fragment", quantity: 10 },
      { itemId: "eagle_feather", quantity: 2 },
    ],
  },
  {
    id: "craft_steel_boots",
    name: "Steel Boots",
    result: { itemId: "steel_boots", quantity: 1 },
    ingredients: [
      { itemId: "orc_tusk", quantity: 3 },
      { itemId: "bone_fragment", quantity: 7 },
      { itemId: "eagle_feather", quantity: 2 },
    ],
  },
  // --- Dragon tier ---
  {
    id: "craft_dragon_helmet",
    name: "Dragon Helmet",
    result: { itemId: "dragon_helmet", quantity: 1 },
    ingredients: [
      { itemId: "orc_tusk", quantity: 6 },
      { itemId: "eagle_feather", quantity: 5 },
      { itemId: "bone_fragment", quantity: 12 },
    ],
  },
  {
    id: "craft_dragon_chestplate",
    name: "Dragon Chestplate",
    result: { itemId: "dragon_chestplate", quantity: 1 },
    ingredients: [
      { itemId: "orc_tusk", quantity: 10 },
      { itemId: "eagle_feather", quantity: 8 },
      { itemId: "bone_fragment", quantity: 15 },
    ],
  },
  {
    id: "craft_dragon_leggings",
    name: "Dragon Leggings",
    result: { itemId: "dragon_leggings", quantity: 1 },
    ingredients: [
      { itemId: "orc_tusk", quantity: 8 },
      { itemId: "eagle_feather", quantity: 6 },
      { itemId: "bone_fragment", quantity: 13 },
    ],
  },
  {
    id: "craft_dragon_boots",
    name: "Dragon Boots",
    result: { itemId: "dragon_boots", quantity: 1 },
    ingredients: [
      { itemId: "orc_tusk", quantity: 5 },
      { itemId: "eagle_feather", quantity: 4 },
      { itemId: "bone_fragment", quantity: 10 },
    ],
  },
  {
    id: "craft_health_potion",
    name: "Health Potion",
    result: { itemId: "health_potion", quantity: 2 },
    ingredients: [
      { itemId: "slime_gel", quantity: 3 },
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
