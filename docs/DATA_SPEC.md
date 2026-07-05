# Data Specification

This document defines the recommended JSON schemas for core game content.

## 1. Monster Schema (monsters.json)
`json
{
  "id": "slime_01",
  "name": "Slime",
  "sprite": "assets/sprites/slime_16x16.png",
  "stats": {
    "hp": 30,
    "atk": 5,
    "def": 2,
    "speed": 1.2
  },
  "behavior": "patrol_and_charge",
  "drops": [
    { "itemId": "slime_gel", "chance": 0.5 },
    { "itemId": "wood_sword", "chance": 0.05 }
  ],
  "exp": 8
}
`

## 2. Equipment Schema (equipment.json)
`json
{
  "id": "wood_sword",
  "name": "Wood Sword",
  "slot": "weapon",
  "rarity": "common",
  "stats": {
    "atk": 3
  },
  "icon": "assets/ui/icon_wood_sword.png"
}
`

## 3. Quest Schema (quests.json)
`json
{
  "id": "quest_clear_dungeon_01",
  "title": "Clear the Dungeon",
  "description": "Defeat the boss in the Shadow Dungeon.",
  "objectives": [
    { "type": "kill_enemy", "target": "boss_shadow", "count": 1 }
  ],
  "rewards": {
    "exp": 100,
    "gold": 50,
    "items": ["rare_chest_01"]
  },
  "prerequisites": []
}
`

## 4. Map Schema (Tiled JSON export simplified view)
- Map stores layers: ground, obstacles, decorations, enemy spawn markers, NPC markers.
- Each object layer should include:
  - 	ype (enemy_spawn, npc, chest, trigger)
  - properties (id, respawn, dialogId, lootTableId)

## 5. Save Schema (save.json)
`json
{
  "saveVersion": 1,
  "meta": {
    "createdAt": "2026-07-05T00:00:00Z",
    "updatedAt": "2026-07-05T00:20:00Z",
    "playtimeSeconds": 1200
  },
  "player": {
    "level": 5,
    "exp": 123,
    "stats": { "hp": 120, "atk": 14, "def": 8, "speed": 2.0 },
    "position": { "mapId": "level01_dungeon", "x": 128, "y": 64 },
    "equipment": { "weapon": "wood_sword", "armor": null, "accessory": null },
    "inventory": [
      { "itemId": "potion_hp", "count": 3 }
    ]
  },
  "world": {
    "unlockedMaps": ["village", "level01_dungeon"],
    "questStates": {
      "quest_clear_dungeon_01": "active"
    },
    "flags": {
      "boss_shadow_defeated": false
    }
  }
}
`

## 6. ID and Naming Rules
- Use snake_case for IDs.
- Keep filenames human-readable, include size/frame info for sprites.
- Avoid spaces in paths; prefer underscores.

## 7. Validation Strategy
- Validate JSON on build and on load (fail-fast with clear errors).
- Provide schema files later if you adopt TypeScript or strict validation library (e.g., zod).