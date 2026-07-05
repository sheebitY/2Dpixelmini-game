# Asset Pipeline Guide

This document explains exactly how to create, organize, and use2D pixel art assets (characters, animations, maps, environment objects) in a web-based game built with PixiJS + TypeScript.

---

## 1. The Core Problem
In a traditional2D RPG you need:
- **Character animations:** idle, run, attack, hurt, death (each is multiple frames).
- **Environment tiles:** grass, water, cliffs, trees, houses, fences.
- **Props and objects:** chests, signs, doors, torches, crates.
- **UI elements:** icons, portraits, buttons.

If you treat each frame as a separate file, you will end up with thousands of tiny PNGs, which is hard to manage and slow to load. The solution is **sprite sheets** and **tilesets**.

---

## 2. Sprite Sheets (Character & Enemy Animations)

### What is a sprite sheet?
A single PNG image that contains all animation frames of one entity, arranged in a grid.

Example (4 directions x4 frames each =16 frames):
`
Row0: idle_down_01, idle_down_02, idle_down_03, idle_down_04
Row1: idle_left_01, idle_left_02, idle_left_03, idle_left_04
Row2: idle_right_01, ...
Row3: idle_up_01, ...
`

### Recommended grid sizes
- **16x16 pixels per frame** - classic retro style (NES/SNES era).
- **32x32 pixels per frame** - more detail, easier to draw.
- **48x48 or64x64** - high-res pixel art.

Pick ONE size for the entire project and never mix.

### How to create sprite sheets
**Option A: Aseprite (recommended, paid)**
1. Draw each frame as a layer or frame in Aseprite.
2. Use "Export Sprite Sheet" -> Sheet Type: By Rows -> Output: PNG + JSON.
3. Aseprite generates:
   - player_idle.png (the sprite sheet image)
   - player_idle.json (frame positions, sizes, animation tags)
4. The JSON tells PixiJS exactly where each frame is in the sheet.

**Option B: LibreSprite (free, open source)**
- Same workflow as Aseprite, but free.

**Option C: Manual (free, any editor)**
1. Draw frames individually in any pixel art editor (Piskel, GraphicsGale, Photoshop).
2. Arrange them in a grid in a single image using a script or manually.
3. Write a JSON metadata file by hand (see Section5).

### File naming convention
`
assets/sprites/player/player_idle_16x16.png
assets/sprites/player/player_run_16x16.png
assets/sprites/player/player_attack_16x16.png
assets/sprites/enemies/slime_idle_16x16.png
assets/sprites/enemies/slime_attack_16x16.png
`

---

## 3. Tilesets (Maps & Environment)

### What is a tileset?
A single PNG containing all reusable tiles for building maps. Tiled map editor uses tilesets to paint maps.

Example tileset categories:
- Ground: grass, dirt, sand, stone floor, water
- Walls: brick, wood, cave wall
- Decoration: flowers, bushes, rocks, signs
- Buildings: roof pieces, door, window, chimney

### How to create tilesets
1. Draw tiles at the same pixel size as your game tiles (16x16 or32x32).
2. Arrange in a grid in one PNG (e.g.,16 tiles across x8 tiles down).
3. In Tiled, create a "New Tileset" and point to your PNG.
4. Define tile size in Tiled (must match your art).
5. Paint maps in Tiled using the tileset.

### Tileset organization
`
assets/tilesets/ground_16x16.png       # grass, dirt, sand, water
assets/tilesets/walls_16x16.png        # brick, wood, cave
assets/tilesets/outdoor_16x16.png      # trees, flowers, fences
assets/tilesets/indoor_16x16.png       # furniture, floors
assets/tilesets/dungeon_16x16.png      # stone, spikes, torches
`

### Autotiles / Smart Tiles
Tiled supports "Wang tiles" or "Auto-mapping" for automatic edge/corner tiles (e.g., grass-to-dirt transitions). This is optional but reduces manual work.

---

## 4. Animation Metadata (JSON)

You need to tell the game engine which frames belong to which animation. This is done via JSON metadata.

### Option A: Aseprite JSON (auto-generated)
`json
{
  ""frames"": {
    ""idle_down_01"": { ""frame"": { ""x"":0, ""y"":0, ""w"":16, ""h"":16 } },
    ""idle_down_02"": { ""frame"": { ""x"":16, ""y"":0, ""w"":16, ""h"":16 } },
    ""idle_down_03"": { ""frame"": { ""x"":32, ""y"":0, ""w"":16, ""h"":16 } },
    ""idle_down_04"": { ""frame"": { ""x"":48, ""y"":0, ""w"":16, ""h"":16 } }
  },
  ""meta"": {
    ""frameTags"": [
      { ""name"": ""idle_down"", ""from"":0, ""to"":3 }
    ]
  }
}
`

### Option B: Manual animation config (if not using Aseprite)
Create a separate file nimations.json:
`json
{
  ""player"": {
    ""idle_down"":  { ""sheet"": ""player_idle"", ""row"":0, ""frames"":4, ""fps"":6, ""loop"":true },
    ""idle_up"":    { ""sheet"": ""player_idle"", ""row"":1, ""frames"":4, ""fps"":6, ""loop"":true },
    ""run_down"":   { ""sheet"": ""player_run"",  ""row"":0, ""frames"":6, ""fps"":10, ""loop"":true },
    ""attack_down"":{ ""sheet"": ""player_attack"",""row"":0, ""frames"":4, ""fps"":12, ""loop"":false }
  },
  ""slime"": {
    ""idle"":  { ""sheet"": ""slime_idle"", ""row"":0, ""frames"":4, ""fps"":6, ""loop"":true },
    ""hurt"":  { ""sheet"": ""slime_hurt"", ""row"":0, ""frames"":2, ""fps"":8, ""loop"":false },
    ""death"": { ""sheet"": ""slime_death"",""row"":0, ""frames"":4, ""fps"":8, ""loop"":false }
  }
}
`

### How PixiJS uses this
`	ypescript
// Load sprite sheet
const sheet = PIXI.Assets.get('player_idle');

// Create animated sprite
const sprite = new PIXI.AnimatedSprite(sheet.animations['idle_down']);
sprite.animationSpeed =0.15;
sprite.loop = true;
sprite.play();
`

---

## 5. Reducing Art Workload

### 5.1 Modular Character System (Paper Doll)
Instead of drawing every character with every outfit, build characters from parts:
- ody_base.png (bare body,4 directions)
- hair_short.png
- hair_long.png
- rmor_leather.png
- rmor_plate.png
- weapon_sword.png
- weapon_staff.png

Each part is a sprite sheet with the same frame layout. At runtime, composite them on the same entity using multiple PixiJS sprites parented together.

**Benefit:**10 bodies x5 hairs x5 armors x5 weapons =1250 unique character looks from only25 sprite sheets.

### 5.2 Recoloring
Draw in grayscale, then apply color palette swaps at runtime (PixiJS ColorMatrixFilter or custom shader).
- One slime sprite sheet -> recolor to make green, red, blue, gold variants.

### 5.3 Procedural Animation
For simple objects (floating, bobbing, rotating), skip frame animation entirely:
`	ypescript
// Bobbing chest
sprite.y = baseY + Math.sin(time *2) *3;
`

### 5.4 Minimalist Design
- Use fewer frames (3-4 per animation instead of8-12).
- Use smaller sprites (16x16 instead of32x32).
- Limit color palette (16-32 colors per sprite).

---

## 6. AI-Assisted Art Creation

### What AI can do well
- Generate concept art and reference images.
- Create pixel art at consistent scale (with careful prompting).
- Upscale or clean up hand-drawn sketches.
- Generate variations of existing sprites (restyle, recolor).

### What AI cannot do well (yet)
- Consistent sprite sheet with exact frame alignment.
- Perfectly matched tilesets that tile seamlessly.
- Exact palette consistency across many assets.

### Recommended workflow
1. Use AI to generate concept art / style reference.
2. Draw final sprites by hand (or heavily edit AI output) in Aseprite/LibreSprite.
3. Use AI for batch variations (different colored slimes, different hair styles).

### Tools for AI pixel art
- PixelLab (dedicated pixel art AI)
- Aseprite with AI plugins
- General image generators + manual cleanup

---

## 7. Asset Loading & Caching Strategy

### Preload vs Lazy Load
| Asset Type | Strategy | Reason |
|---|---|---|
| Player sprites | Preload on boot | Always needed |
| Current map tileset | Preload on map enter | Needed immediately |
| Current map sprites | Preload on map enter | Enemies/NPCs on this map |
| Other maps | Lazy load | Only when player approaches |
| Audio BGM | Preload on map enter | Must play immediately |
| Audio SFX | Preload on boot | Small files, always needed |

### PixiJS asset manifest
`	ypescript
PIXI.Assets.addBundle('boot', {
  player_idle: 'assets/sprites/player/player_idle_16x16.png',
  player_run: 'assets/sprites/player/player_run_16x16.png',
  slime_idle: 'assets/sprites/enemies/slime_idle_16x16.png',
});

await PIXI.Assets.loadBundle('boot');
`

### Caching in browser
- Set HTTP headers for static assets: Cache-Control: public, max-age=31536000, immutable.
- Use content-hashed filenames in production build (player_idle.a3f8b2c1.png).
- PixiJS caches textures in GPU memory automatically.

---

## 8. Tools Cheat Sheet

| Task | Tool | Cost | Output |
|---|---|---|---|
| Pixel art + animation | Aseprite | ~ (Steam) | PNG + JSON sprite sheets |
| Pixel art (free) | LibreSprite | Free | PNG (manual JSON) |
| Pixel art (browser) | Piskel | Free | PNG, GIF |
| Map editing | Tiled | Free / Paid | JSON maps |
| Sprite sheet packing | TexturePacker | Paid | Packed atlas + JSON |
| Sprite packing (free) | Free Texture Packer | Free | Atlas + JSON |
| Audio editing | Audacity | Free | OGG, MP3 |
| AI concept art | Any image generator | Varies | Reference images |

---

## 9. Pipeline Checklist (per new asset)

### New Character/Enemy
- [ ] Draw sprite sheet (Aseprite recommended)
- [ ] Export PNG + JSON (or write manual animation config)
- [ ] Place in ssets/sprites/<category>/
- [ ] Add entry to data/monsters.json or entity config
- [ ] Add animation config to entity definition
- [ ] Test in-game: idle, walk, attack, hurt, death

### New Map
- [ ] Create/reuse tileset PNG
- [ ] Paint map in Tiled
- [ ] Add object markers (enemy_spawn, npc, chest, portal, trigger)
- [ ] Export JSON to ssets/maps/
- [ ] Register map in data/config/game-balance.json
- [ ] Test: walk around, transitions, spawns, collisions

### New Item/Equipment
- [ ] Draw icon (16x16 or32x32) for UI
- [ ] Place in ssets/ui/
- [ ] Add entry to data/items.json or data/equipment.json
- [ ] If equippable and visible: add sprite sheet for character wearing it
- [ ] Test: pick up, equip, stat changes

---

## 10. Performance Tips
- Combine small sprite sheets into atlases (TexturePacker) to reduce draw calls.
- Use PixiJS PIXI.BaseTexture sharing for sheets that share the same image.
- Limit particle effects to50-100 particles on screen.
- Use object pooling for frequently created/destroyed entities (damage numbers, projectiles).
- Profile with Chrome DevTools Performance tab; target60fps desktop,30fps mobile.