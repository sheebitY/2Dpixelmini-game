# 2D Pixel Web RPG - Project Specification

## 1. Project Overview
- **Project type:** 2D pixel web RPG (HTML5 Canvas + TypeScript).
- **Core gameplay:** exploration, monster combat, leveling up, quests, equipment progression, boss challenges.
- **Target platform:** modern desktop/mobile browsers (PWA optional later).
- **Storage strategy:** local-first saves using IndexedDB; optional cloud sync/account system in a later phase.

## 2. Design Goals
- Build a data-driven game that is easy to expand with JSON/table content.
- Keep architecture modular: rendering, input, world, combat, quest, inventory, persistence.
- Maintain stable performance with sprite sheets and tile maps.
- Provide clear asset conventions so AI and humans can collaborate efficiently.
- Long-term maintainability: every new map, NPC, quest, boss should be pure data, not code changes.

## 3. MVP Scope
### 3.1 Must-have
- Player movement, collision, and basic attack.
- One overworld map + one dungeon map.
- 3 enemy types + 1 boss.
- Basic stats: HP, ATK, DEF, EXP, level.
- Equipment slots: weapon + armor + accessory (minimal).
- Simple quest system: accept -> objective -> turn-in -> reward.
- Local save/load with versioned save schema.

### 3.2 Nice-to-have (post-MVP)
- Skill cooldowns and skill tree.
- Shop/NPC dialog system with branching.
- Multiple biomes and world map.
- Loot rarity, affixes, item sets.
- Achievements and bestiary.
- Offline progress (idle-style) or resource resource generation.

---

## 4. Framework Decision: Why This Stack

### 4.1 Primary Language: TypeScript (not plain JavaScript)
- TypeScript provides type safety, autocompletion, and compile-time error checking.
- For a long-lived RPG project with many data structures (items, quests, monsters, save files), types prevent a huge category of bugs.
- AI-generated code is higher quality when constrained by TypeScript interfaces.
- Migration path: start with .ts files from day one, no retrofitting needed.

### 4.2 UI Framework: None (No Vue / React / Angular)
- **You do NOT need Vue, React, or any UI framework for this project.**
- Reason: those frameworks are designed for DOM-based applications (forms, lists, pages). A game renders on a <canvas> element and manages its own rendering loop, input, and scene graph. Vue/React would add complexity with zero benefit.
- The only HTML you need is a single <canvas> element and maybe a few DOM overlays for menus (which can be done with simple vanilla DOM manipulation or a tiny UI layer on top of canvas).

### 4.3 Rendering Layer: PixiJS (recommended over raw Canvas)
- **Why PixiJS:** mature 2D WebGL renderer, excellent sprite/tilemap support, huge community, hardware-accelerated, handles texture atlases, particle effects, filters. Fallback to Canvas2D automatically.
- **Alternative:** raw Canvas API (simpler but more manual work for sprites, animations, layers).
- **Decision:** Use PixiJS for all rendering. It does not dictate your game logic - it only draws things.

### 4.4 Full Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Language | TypeScript 5.x | Type-safe game code |
| Build tool | Vite | Fast dev server, HMR, production bundling |
| Rendering | PixiJS 7.x or 8.x | 2D sprite/tilemap rendering, WebGL |
| Map editor | Tiled (external tool) | Visual map design, exports JSON |
| Audio | Howler.js | Cross-browser audio playback |
| Persistence | IndexedDB (via idb wrapper) | Local save data |
| Testing | Vitest | Unit tests for game systems |
| Linting | ESLint + Prettier | Code quality and formatting |
| Package manager | npm or pnpm | Dependency management |

### 4.5 What You Will NOT Use (and why)
- **Vue / React / Angular:** DOM frameworks; game runs on canvas, not DOM tree.
- **Phaser:** a full game engine that imposes its own architecture. If you use Phaser, you follow its patterns. PixiJS is rendering-only, giving you full control over architecture.
- **Unity / Godot:** not web-native; you chose HTML delivery.
- **jQuery:** unnecessary; vanilla DOM APIs are sufficient for the few UI overlays you need.

---

## 5. Architecture Overview

### 5.1 Layer Diagram

`
+---------------------------------------------------------------+
|                        BROWSER                                |
|  +---------------------------------------------------------+  |
|  |                    UI Layer (DOM overlay)                |  |
|  |   Title Screen | Pause Menu | Settings | Dialog Box     |  |
|  +---------------------------------------------------------+  |
|                          | events                             |
|  +---------------------------------------------------------+  |
|  |                  Game World Layer (Canvas/PixiJS)        |  |
|  |  +----------+  +----------+  +--------+  +-----------+  |  |
|  |  | Renderer |  |  Camera  |  |  Map   |  | Entities  |  |  |
|  |  +----------+  +----------+  +--------+  +-----------+  |  |
|  +---------------------------------------------------------+  |
|                          | systems                            |
|  +---------------------------------------------------------+  |
|  |                   Game Systems Layer                     |  |
|  |  Movement | Collision | Combat | AI | Quest | Loot      |  |
|  |  Dialog   | Inventory | Equipment | Stats | Rewards     |  |
|  +---------------------------------------------------------+  |
|                          | events                             |
|  +---------------------------------------------------------+  |
|  |                   Core Services Layer                    |  |
|  |  EventBus | AssetLoader | SaveManager | AudioManager    |  |
|  |  InputManager | SceneManager | ConfigRegistry           |  |
|  +---------------------------------------------------------+  |
|                          | data                               |
|  +---------------------------------------------------------+  |
|  |                   Data Layer                            |  |
|  |  JSON files: monsters, items, quests, maps, dialogs     |  |
|  |  IndexedDB: save slots                                  |  |
|  +---------------------------------------------------------+  |
+---------------------------------------------------------------+
`

### 5.2 Core Principles
1. **Data-driven:** All content (maps, monsters, items, quests, dialogs, boss patterns) lives in JSON files. Adding a new dungeon = new JSON files, zero code changes.
2. **Event-bus decoupling:** Systems communicate via events (enemy_killed, item_picked_up, quest_completed), not direct references. This prevents spaghetti dependencies.
3. **Scene lifecycle:** Every screen (title, gameplay, cutscene, game-over) is a Scene with enter() -> update(dt) -> exit() lifecycle.
4. **Deterministic game loop:** Fixed timestep update (e.g., 60 logic updates/sec) with variable rendering frame rate. This ensures consistent physics and combat regardless of display refresh rate.
5. **No global state:** All state lives in explicit registries (EntityManager, QuestState, InventoryStore). No window.player or magic globals.

---

## 6. Module Specification

### 6.1 Core Layer (src/core/)

#### game-loop.ts
- Implements fixed-timestep game loop.
- Calls update(dt) at fixed intervals, calls 
ender() every animation frame.
- Provides pause/resume/step for debugging.

#### event-bus.ts
- Pub/sub event system with typed events.
- Interface:
  `
  on(event: string, callback: Function): unsubscribe
  emit(event: string, payload: any): void
  once(event: string, callback: Function): void
  `
- Well-known events: player_moved, enemy_killed, item_acquired, quest_accepted, quest_completed, damage_dealt, scene_change, save_requested, dialog_started, dialog_ended.

#### scene-manager.ts
- Manages scene stack (for overlays like pause menu on top of gameplay).
- Interface:
  `
  pushScene(scene: Scene): void
  popScene(): void
  switchScene(scene: Scene): void
  currentScene(): Scene
  `
- Scene interface:
  `
  enter(context: SceneContext): void
  update(dt: number): void
  render(renderer: Renderer): void
  exit(): void
  `

#### input-manager.ts
- Unified input abstraction for keyboard, mouse, gamepad, touch.
- Interface:
  `
  isKeyDown(key: string): boolean
  isKeyJustPressed(key: string): boolean
  getPointerPosition(): { x, y }
  onPointerDown(callback): unsubscribe
  `

#### sset-loader.ts
- Preloads and caches all sprites, tilesets, audio, JSON data.
- Supports loading screens with progress percentage.
- Interface:
  `
  loadManifest(manifest: AssetManifest): Promise<void>
  getTexture(id: string): Texture
  getAudio(id: string): Howl
  getData(id: string): any
  `

#### config-registry.ts
- Central place for game constants (gravity, base stats, scaling formulas).
- Loaded from config/game-balance.json so designers can tweak without code changes.

### 6.2 Entity System (src/ecs/)

#### entity.ts
- Lightweight entity (just an ID + component map).
- Components are plain data objects:
  `
  Transform { x, y, width, height, facing }
  Sprite { textureId, frame, animations }
  Collider { type, offsetX, offsetY, width, height, layer }
  Health { current, max, invincibleUntil }
  AI { behaviorId, state, targetId }
  LootTable { tableId }
  Interactable { type, dialogId, questId, actionScript }
  DamageDealer { amount, cooldown, hitbox }
  `

#### entity-manager.ts
- Creates, destroys, queries entities.
- Interface:
  `
  createEntity(): EntityId
  addComponent(entityId, componentType, data): void
  getComponent(entityId, componentType): Component
  queryByComponents(...componentTypes): EntityId[]
  destroyEntity(entityId): void
  `

#### systems/ (one file per system)
- movement-system.ts: reads Input/AI, applies velocity to Transform.
- collision-system.ts: spatial hash or grid-based broad phase, AABB narrow phase. Emits collision events.
- combat-system.ts: processes damage, knockback, invincibility frames, death. Emits damage_dealt, enemy_killed.
- i-system.ts: state machine per enemy (idle -> patrol -> chase -> attack -> hurt -> dead).
- nimation-system.ts: updates sprite frames based on state.
- interaction-system.ts: checks player overlap with Interactable entities, triggers dialog/quest/loot.
- loot-system.ts: rolls loot tables on enemy death, spawns pickup entities.
- quest-tracker-system.ts: listens to events and updates quest objective progress.

### 6.3 World Layer (src/world/)

#### map-loader.ts
- Loads Tiled JSON maps, parses tile layers + object layers.
- Spawns entities from object layer markers (enemy_spawn, npc, chest, portal, trigger, decoration).
- Interface:
  `
  loadMap(mapId: string): Promise<MapInstance>
  MapInstance { tileLayers, objectSpawns, collisionGrid, portals }
  `

#### 	ilemap-renderer.ts
- Renders tile layers via PixiJS tilemap support (e.g., @pixi/tilemap).
- Handles multiple layers (ground, detail, above-player for tree canopy).

#### collision-grid.ts
- Converts tile collision layer into a grid of walkable/blocked cells.
- Used by pathfinding (A*) and broad-phase collision.

#### camera.ts
- Follows player with smooth lerp.
- Clamps to map bounds.
- Supports screen shake, zoom.

#### portal-system.ts
- Detects player entering portal objects, triggers map transitions with fade.

### 6.4 Combat Layer (src/combat/)

#### damage.ts
- Damage formula: 
awDamage = attackerATK * skillMultiplier - defenderDEF
- Minimum damage: 1.
- Critical hit: if random < critRate then damage *= critMultiplier.

#### oss-phase.ts
- Bosses defined in JSON with phase transitions (HP thresholds).
- Each phase has: behavior pattern, attack scripts, invulnerability windows.
- Interface:
  `
  BossConfig {
    phases: [{
      hpThreshold: 0.5,
      behaviors: ['charge', 'aoe_slam'],
      dialog: 'boss_taunt_02'
    }]
  }
  `

### 6.5 RPG Layer (src/rpg/)

#### stats.ts
- Base stats + equipment modifiers + buff modifiers = final stats.
- Level-up formula defined in config JSON.

#### inventory.ts
- Array of { itemId, count }.
- Interface: dd, 
emove, has, getCount, getAll.

#### equipment.ts
- Slots: weapon, armor, accessory.
- Equipping recalculates final stats.
- Interface: equip(slot, itemId), unequip(slot), getEquipped(slot).

#### quest.ts
- Quest state machine: inactive -> active -> completed -> turned_in.
- Objective types (extensible): kill_enemy, collect_item, 
each_area, 	alk_to_npc, interact_object.
- Quest definitions loaded from quests.json.

#### dialog.ts
- Dialog trees loaded from dialogs.json.
- Supports: sequential lines, branching choices, conditions (has item, quest state, flag), scripted actions (give item, set flag, start quest).
- Dialog node structure:
  `
  {
    "id": "npc_blacksmith_greeting",
    "nodes": [
      { "speaker": "Blacksmith", "text": "Welcome, traveler!", "next": 1 },
      { "speaker": "Blacksmith", "text": "Need a weapon?", "choices": [
        { "text": "Show me what you have.", "action": { "type": "open_shop" } },
        { "text": "Not right now.", "action": { "type": "end_dialog" } }
      ]}
    ]
  }
  `

### 6.6 UI Layer (src/ui/)

#### hud.ts
- Renders in-game HUD on canvas: HP bar, XP bar, minimap, quest tracker, damage numbers.
- Does NOT use DOM; rendered directly in PixiJS for consistent look.

#### menus.ts
- Title screen, pause menu, inventory screen, equipment screen, quest log.
- Can use either canvas-rendered UI or simple DOM overlay (design choice per menu).
- For canvas UI: use a lightweight retained-mode UI library or build a simple one.

#### dialog-box.ts
- Renders NPC dialog with typewriter effect, speaker name, portrait, choices.

### 6.7 Persistence Layer (src/save/)

#### save-manager.ts
- Interface:
  `
  save(slotId: string, data: SaveData): Promise<void>
  load(slotId: string): Promise<SaveData | null>
  deleteSlot(slotId: string): Promise<void>
  listSlots(): Promise<SlotInfo[]>
  `
- Uses IndexedDB under the hood.
- Auto-save on: map transition, quest completion, boss kill, manual save.
- Debounced periodic auto-save (every 2 minutes during gameplay).

#### migrations.ts
- Sequential migration functions indexed by save version.
- When loading a save with saveVersion < CURRENT_VERSION, run migrations in order.
- Example: migrate_v1_to_v2(save) adds new fields with defaults.

---

## 7. Folder Structure (Complete)

`
root/
├── index.html                        # Entry point, contains <canvas>
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
├── .prettierrc
│
├── src/
│   ├── main.ts                       # Bootstrap: init canvas, load assets, start game loop
│   ├── config.ts                     # Global constants, canvas size, tile size
│   │
│   ├── core/
│   │   ├── game-loop.ts              # Fixed-timestep loop
│   │   ├── event-bus.ts              # Typed pub/sub event system
│   │   ├── scene-manager.ts          # Scene stack management
│   │   ├── input-manager.ts          # Keyboard/mouse/touch/gamepad unified input
│   │   ├── asset-loader.ts           # Manifest-based asset preloading
│   │   ├── config-registry.ts        # Runtime config from JSON
│   │   └── audio-manager.ts          # BGM + SFX management via Howler
│   │
│   ├── ecs/
│   │   ├── entity-manager.ts         # Entity creation, component storage, queries
│   │   ├── components.ts             # All component type definitions
│   │   └── systems/
│   │       ├── movement-system.ts
│   │       ├── collision-system.ts
│   │       ├── combat-system.ts
│   │       ├── ai-system.ts
│   │       ├── animation-system.ts
│   │       ├── interaction-system.ts
│   │       ├── loot-system.ts
│   │       └── quest-tracker-system.ts
│   │
│   ├── world/
│   │   ├── map-loader.ts             # Tiled JSON parser + entity spawner
│   │   ├── tilemap-renderer.ts       # Tile layer rendering
│   │   ├── collision-grid.ts         # Tile-based collision grid
│   │   ├── camera.ts                 # Camera follow, shake, zoom
│   │   └── portal-system.ts          # Map transition triggers
│   │
│   ├── combat/
│   │   ├── damage-calculator.ts      # Damage formulas
│   │   ├── boss-controller.ts        # Boss phase state machine
│   │   └── combat-constants.ts       # iFrames, knockback values
│   │
│   ├── rpg/
│   │   ├── stats-manager.ts          # Base + equipment + buff stat aggregation
│   │   ├── level-manager.ts          # XP curves, level-up logic
│   │   ├── inventory.ts              # Item storage
│   │   ├── equipment.ts              # Equipment slots
│   │   ├── quest-manager.ts          # Quest state machine
│   │   ├── dialog-manager.ts         # Dialog tree player
│   │   └── shop.ts                   # Buy/sell logic
│   │
│   ├── ui/
│   │   ├── hud.ts                    # In-game HUD (canvas rendered)
│   │   ├── title-screen.ts           # Title scene
│   │   ├── pause-menu.ts             # Pause overlay scene
│   │   ├── inventory-screen.ts       # Inventory UI
│   │   ├── equipment-screen.ts       # Equipment UI
│   │   ├── quest-log.ts              # Quest journal
│   │   ├── dialog-box.ts             # Dialog display
│   │   └── damage-numbers.ts         # Floating combat text
│   │
│   ├── save/
│   │   ├── save-manager.ts           # IndexedDB read/write
│   │   ├── save-schema.ts            # TypeScript interface for save data
│   │   ├── migrations.ts             # Version migration pipeline
│   │   └── autosave.ts               # Autosave scheduler
│   │
│   └── scenes/
│       ├── boot-scene.ts             # Preload assets
│       ├── title-scene.ts            # Title screen
│       ├── gameplay-scene.ts         # Main gameplay (map + systems)
│       ├── cutscene-scene.ts         # Scripted cutscenes
│       └── gameover-scene.ts         # Death / game over
│
├── data/                             # All game content (JSON)
│   ├── config/
│   │   ├── game-balance.json         # Damage formulas, XP curve, drop rates
│   │   └── input-bindings.json       # Key mappings
│   ├── monsters.json                 # Monster definitions
│   ├── equipment.json                # Equipment definitions
│   ├── items.json                    # Consumable / key items
│   ├── quests.json                   # Quest definitions
│   ├── dialogs.json                  # NPC dialog trees
│   ├── bosses.json                   # Boss phase configs
│   └── loot-tables.json             # Loot drop tables
│
├── assets/
│   ├── sprites/
│   │   ├── player/                   # Player sprite sheets
│   │   ├── enemies/                  # Enemy sprite sheets
│   │   ├── npcs/                     # NPC sprites
│   │   └── effects/                  # VFX sprites
│   ├── tilesets/                     # Tiled tileset images
│   ├── maps/                         # Tiled JSON map exports
│   ├── ui/                           # UI icons, portraits
│   └── audio/
│       ├── bgm/                      # Background music
│       └── sfx/                      # Sound effects
│
└── docs/
    ├── PROJECT.md                    # This file
    ├── DATA_SPEC.md                  # JSON schema definitions
    ├── ROADMAP.md                    # Development roadmap
    └── ARCHITECTURE.md               # Architecture deep-dive (future)
`

---

## 8. Event System Reference

All inter-system communication goes through the EventBus. Below is the canonical event catalog.

### 8.1 Player Events
| Event | Payload | Source | Consumers |
|---|---|---|---|
| player_moved | { x, y, mapId } | MovementSystem | Camera, QuestTracker |
| player_died | {} | CombatSystem | SceneManager (-> gameover) |
| player_leveled_up | { newLevel, statGains } | LevelManager | HUD, AudioManager |

### 8.2 Combat Events
| Event | Payload | Source | Consumers |
|---|---|---|---|
| damage_dealt | { sourceId, targetId, amount, isCrit } | CombatSystem | HUD (damage numbers), AudioManager |
| enemy_killed | { enemyId, enemyType, x, y } | CombatSystem | QuestTracker, LootSystem, LevelManager |
| oss_phase_change | { bossId, phaseIndex } | BossController | AudioManager, DialogManager |

### 8.3 World Events
| Event | Payload | Source | Consumers |
|---|---|---|---|
| map_loaded | { mapId } | MapLoader | Spawner, SaveManager |
| map_entered | { mapId, fromPortal } | PortalSystem | QuestTracker, SaveManager (autosave) |
| chest_opened | { chestId, loot } | InteractionSystem | Inventory, HUD, AudioManager |
| item_picked_up | { itemId, count } | LootSystem | Inventory, HUD |

### 8.4 RPG Events
| Event | Payload | Source | Consumers |
|---|---|---|---|
| quest_accepted | { questId } | QuestManager | HUD (quest tracker) |
| quest_objective_progress | { questId, objectiveIndex, current, required } | QuestTracker | HUD |
| quest_completed | { questId } | QuestManager | SaveManager (autosave), HUD, AudioManager |
| item_equipped | { slot, itemId } | EquipmentManager | StatsManager, HUD |
| dialog_started | { dialogId } | DialogManager | InputManager (disable movement) |
| dialog_ended | { dialogId } | DialogManager | InputManager (enable movement) |

---

## 9. Data-Driven Content Pipeline

### 9.1 Adding a New Map
1. Open Tiled, create new map (tile size: 16x16 or 32x32).
2. Paint tile layers: ground, detail, collision (mark blocked tiles).
3. Add object layer objects with markers:
   - enemy_spawn (type + monsterId property)
   - 
pc (type + dialogId property)
   - chest (type + lootTableId property)
   - portal (type + targetMapId + targetPortalId properties)
   - 	rigger (type + scriptId property for cutscenes)
   - decoration (trees, rocks - visual only, no logic)
4. Export as JSON to ssets/maps/.
5. Register map ID in data/config/game-balance.json.
6. Done. Zero code changes required.

### 9.2 Adding a New Monster
1. Create sprite sheet, place in ssets/sprites/enemies/.
2. Add entry to data/monsters.json with stats, behavior, drops.
3. Place enemy_spawn objects in Tiled maps.
4. Done. Zero code changes (unless new behavior pattern needed).

### 9.3 Adding a New Quest
1. Add quest definition to data/quests.json.
2. Reference quest ID in NPC dialog (ction: { type: 'offer_quest', questId: '...' }).
3. QuestTracker automatically monitors objectives via events.
4. Done.

### 9.4 Adding a New Boss
1. Create sprite sheet + add to ssets/sprites/enemies/.
2. Add entry to data/monsters.json for base stats.
3. Add phase config to data/bosses.json.
4. Place boss spawn in map with boss flag.
5. Add reward dialog/quest to data/quests.json and data/dialogs.json.

---

## 10. Save System Design
- Use a versioned JSON document with schema version field.
- Core fields:
  - saveVersion: number (increment on schema changes)
  - player: position, stats, equipment, inventory, buffs
  - world: current map id, unlocked flags, quest states
  - progression: level, exp, boss defeated flags, playtime
  - meta: created_at, updated_at
- Migration pipeline: when saveVersion < current, run sequential transforms.
- Write triggers: map transition, quest completion, boss kill, autosave interval.
- Multiple save slots (3 recommended for MVP).

---

## 11. Asset Guidelines
- **Full pipeline details:** see docs/ASSET_PIPELINE.md for sprite sheets, tilesets, animation metadata, AI art workflow, and tool recommendations.
- Consistent pixel scale: choose 16x16 or 32x32 for the entire project and stick with it.
- Sprite sheets: aligned frames, consistent frame size, named by entity + state (player_run_16x16.png).
- Tilesets: one tileset per biome/theme, exported as PNG.
- Naming convention: lowercase, underscores, include size info.
  - ssets/sprites/player/player_idle_16x16_4frame.png
  - ssets/tilesets/forest_16x16.png
  - ssets/maps/village_01.json
- Audio: OGG preferred (smaller), MP3 fallback. BGM loop points defined in config.

---

## 12. Testing Strategy

### 12.1 Unit Tests (Vitest)
- Damage calculator: given ATK/DEF/multiplier, verify output.
- Quest state machine: accept -> progress -> complete -> turn-in transitions.
- Inventory: add/remove/stack/split items.
- Equipment: equip/unequip stat recalculation.
- Save migrations: old save in -> new save out.
- Loot table: seeded random drops match expected distribution.

### 12.2 Integration Tests
- Load a test map JSON -> verify entities spawned correctly.
- Simulate combat sequence -> verify quest objective updates.
- Save -> load -> verify state round-trip.

### 12.3 Manual Playtest Checklist
- Each milestone must pass: movement, collision, combat, save/load, quest flow.

---

## 13. Development Workflow

### 13.1 Commands
- 
pm run dev - Start Vite dev server with HMR.
- 
pm run build - Production build to dist/.
- 
pm run test - Run Vitest.
- 
pm run lint - ESLint check.
- 
pm run format - Prettier format.

### 13.2 AI Collaboration Rules
- Generate code in small functional increments with runnable checkpoints.
- Each feature includes: TypeScript interfaces, JSON data, test cases.
- All new content types must follow DATA_SPEC.md schemas.
- Keep requirements explicit: inputs, outputs, edge cases, failure handling.
- Every PR/commit should leave the game in a runnable state.

---

## 14. Milestones (Updated)
1. **Project scaffold:** Vite + TypeScript + PixiJS + folder structure + dev server running.
2. **Technical prototype:** player movement + collision + 1 enemy + damage numbers.
3. **Map pipeline:** Tiled JSON loader + camera + map transitions + portals.
4. **RPG loop:** leveling + equipment + inventory + quest MVP.
5. **Dialog & NPCs:** dialog system + quest givers + shops.
6. **Boss fight:** boss phases + patterns + rewards.
7. **Save system:** IndexedDB + migrations + autosave + save slots.
8. **Content expansion:** 3+ maps, 8+ enemies, 2+ bosses, 10+ quests.
9. **Polish:** UI, audio, particles, screen shake, mobile touch controls.
10. **PWA & distribution:** offline play, shareable URL.
