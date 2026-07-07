// ���� Item definitions ����

export type ItemRarity = "common" | "uncommon" | "rare" | "epic";

export type ItemCategory = "consumable" | "material" | "equipment";

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  icon: string;           // emoji or image path (e.g. "/assets/ui/xx.png")
  category: ItemCategory;
  rarity: ItemRarity;
  stackable: boolean;
  maxStack: number;
  /** Effect applied when the player uses this item. Return true if consumed. */
  onUse?: (ctx: UseContext) => boolean;
  equipSlot?: string;
  equipStats?: { atk?: number; def?: number; hp?: number };
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

// ���� Item registry ����

const ITEMS: Record<string, ItemDef> = {
  health_potion: {
    id: "health_potion",
    name: "Health Potion",
    description: "Restores 30 HP.",
    icon: "/assets/ui/icon_potion.png",
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
    icon: "/assets/ui/药剂�?png",
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
  bone_helmet: {
    id: "bone_helmet",
    name: "Bone Helmet",
    description: "A sturdy helmet crafted from bone fragments. DEF +3, HP +10.",
    icon: "??",
    category: "equipment",
    rarity: "uncommon",
    stackable: false,
    maxStack: 1,
    equipSlot: "helmet",
    equipStats: { def: 3, hp: 10 },
  },
  slime_chestplate: {
    id: "slime_chestplate",
    name: "Slime Chestplate",
    description: "A gooey chestplate made from slime gel. DEF +5, HP +15.",
    icon: "??",
    category: "equipment",
    rarity: "uncommon",
    stackable: false,
    maxStack: 1,
    equipSlot: "chestplate",
    equipStats: { def: 5, hp: 15 },
  },
  bone_leggings: {
    id: "bone_leggings",
    name: "Bone Leggings",
    description: "Leg armor reinforced with bones and orc tusks. DEF +4, HP +8.",
    icon: "??",
    category: "equipment",
    rarity: "uncommon",
    stackable: false,
    maxStack: 1,
    equipSlot: "leggings",
    equipStats: { def: 4, hp: 8 },
  },
  eagle_boots: {
    id: "eagle_boots",
    name: "Eagle Boots",
    description: "Lightweight boots crafted from eagle feathers. DEF +2, SPD +20.",
    icon: "??",
    category: "equipment",
    rarity: "uncommon",
    stackable: false,
    maxStack: 1,
    equipSlot: "boots",
    equipStats: { def: 2 },
  },
  tusk_sword: {
    id: "tusk_sword",
    name: "Tusk Sword",
    description: "A crude but powerful sword forged from orc tusks. ATK +6.",
    icon: "??",
    category: "equipment",
    rarity: "rare",
    stackable: false,
    maxStack: 1,
    equipSlot: "weapon",
    equipStats: { atk: 6 },
  },
};

/** Enemy �� possible loot table (itemId, drop chance 0-1) */
export const ENEMY_LOOT_TABLE: Record<string, { itemId: string; chance: number }[]> = {
  slime:       [{ itemId: "slime_gel", chance: 0.6 }, { itemId: "health_potion", chance: 0.2 }],
  red_slime:   [{ itemId: "slime_gel", chance: 0.7 }, { itemId: "health_potion", chance: 0.3 }],
  eagle:       [{ itemId: "eagle_feather", chance: 0.5 }, { itemId: "atk_scroll", chance: 0.1 }],
  skeleton:    [{ itemId: "bone_fragment", chance: 0.6 }, { itemId: "def_scroll", chance: 0.15 }],
  orc:         [{ itemId: "orc_tusk", chance: 0.5 }, { itemId: "greater_health_potion", chance: 0.25 }],
};

export function isImageIcon(icon: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(icon);
}

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id];
}

export function allItemIds(): string[] {
  return Object.keys(ITEMS);
}
