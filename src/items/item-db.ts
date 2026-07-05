// ©¤©¤ Item definitions ©¤©¤

export type ItemRarity = "common" | "uncommon" | "rare" | "epic";

export type ItemCategory = "consumable" | "material";

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  icon: string;           // emoji
  category: ItemCategory;
  rarity: ItemRarity;
  stackable: boolean;
  maxStack: number;
  /** Effect applied when the player uses this item. Return true if consumed. */
  onUse?: (ctx: UseContext) => boolean;
}

export interface UseContext {
  heal: (amount: number) => void;
  boostAtk: (amount: number, duration: number) => void;
  boostDef: (amount: number, duration: number) => void;
}

const RARITY_COLORS: Record<ItemRarity, string> = {
  common:   "#b0b0b0",
  uncommon: "#4caf50",
  rare:     "#2196f3",
  epic:     "#ab47bc",
};

export function rarityColor(r: ItemRarity): string {
  return RARITY_COLORS[r];
}

// ©¤©¤ Item registry ©¤©¤

const ITEMS: Record<string, ItemDef> = {
  health_potion: {
    id: "health_potion",
    name: "Health Potion",
    description: "Restores 30 HP.",
    icon: "??",
    category: "consumable",
    rarity: "common",
    stackable: true,
    maxStack: 20,
    onUse: (ctx) => { ctx.heal(30); return true; },
  },
  greater_health_potion: {
    id: "greater_health_potion",
    name: "Greater Health Potion",
    description: "Restores 70 HP.",
    icon: "??",
    category: "consumable",
    rarity: "uncommon",
    stackable: true,
    maxStack: 10,
    onUse: (ctx) => { ctx.heal(70); return true; },
  },
  atk_scroll: {
    id: "atk_scroll",
    name: "Attack Scroll",
    description: "Boosts ATK by 8 for 15 seconds.",
    icon: "??",
    category: "consumable",
    rarity: "rare",
    stackable: true,
    maxStack: 5,
    onUse: (ctx) => { ctx.boostAtk(8, 15); return true; },
  },
  def_scroll: {
    id: "def_scroll",
    name: "Defense Scroll",
    description: "Boosts DEF by 6 for 15 seconds.",
    icon: "???",
    category: "consumable",
    rarity: "rare",
    stackable: true,
    maxStack: 5,
    onUse: (ctx) => { ctx.boostDef(6, 15); return true; },
  },
  slime_gel: {
    id: "slime_gel",
    name: "Slime Gel",
    description: "A sticky blob dropped by slimes. Can be sold.",
    icon: "??",
    category: "material",
    rarity: "common",
    stackable: true,
    maxStack: 99,
  },
  bone_fragment: {
    id: "bone_fragment",
    name: "Bone Fragment",
    description: "Dropped by skeletons. Used in crafting.",
    icon: "??",
    category: "material",
    rarity: "common",
    stackable: true,
    maxStack: 99,
  },
  eagle_feather: {
    id: "eagle_feather",
    name: "Eagle Feather",
    description: "A light feather from a fierce eagle.",
    icon: "??",
    category: "material",
    rarity: "uncommon",
    stackable: true,
    maxStack: 50,
  },
  orc_tusk: {
    id: "orc_tusk",
    name: "Orc Tusk",
    description: "A trophy from a defeated orc.",
    icon: "??",
    category: "material",
    rarity: "uncommon",
    stackable: true,
    maxStack: 50,
  },
};

/** Enemy ¡ú possible loot table (itemId, drop chance 0-1) */
export const ENEMY_LOOT_TABLE: Record<string, { itemId: string; chance: number }[]> = {
  slime:       [{ itemId: "slime_gel", chance: 0.6 }, { itemId: "health_potion", chance: 0.2 }],
  red_slime:   [{ itemId: "slime_gel", chance: 0.7 }, { itemId: "health_potion", chance: 0.3 }],
  eagle:       [{ itemId: "eagle_feather", chance: 0.5 }, { itemId: "atk_scroll", chance: 0.1 }],
  skeleton:    [{ itemId: "bone_fragment", chance: 0.6 }, { itemId: "def_scroll", chance: 0.15 }],
  orc:         [{ itemId: "orc_tusk", chance: 0.5 }, { itemId: "greater_health_potion", chance: 0.25 }],
};

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id];
}

export function allItemIds(): string[] {
  return Object.keys(ITEMS);
}
