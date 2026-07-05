# Asset Guide

## Quick Start
1. Generate pixel art images (see specs below)
2. Drop them into `assets/` folders
3. Run `npm run dev`

---

## Two Ways to Provide Sprites

### Mode 1: Sprite Sheet (one image, all frames)
All frames in a single PNG, arranged in a grid.
Current default in animations.json.

```
assets/sprites/player/idle.png    <- 8 frames in one row (256x32)
assets/sprites/player/run.png     <- 16 frames in one row (512x32)
```

### Mode 2: Individual Frames (one image per frame) <-- Recommended for AI
Each frame is a separate PNG file. No need to stitch them together.

File naming:
```
assets/sprites/player/idle/down_01.png
assets/sprites/player/idle/down_02.png
assets/sprites/player/idle/up_01.png
assets/sprites/player/idle/up_02.png
...
```

To use this mode, change animations.json:
```json
"idle": {
  "folder": "assets/sprites/player/idle/",
  "prefix": "down_",
  "frameCount": 2,
  "frameWidth": 32, "frameHeight": 32,
  "directions": ["down", "up", "left", "right"],
  "framesPerDirection": 2,
  "fps": 6, "loop": true
}
```

---

## Frame Specifications

### Player Character
| Action | Frames | Per Direction | Total |
|--------|--------|---------------|-------|
| idle   | 2      | 4 directions  | 8     |
| run    | 4      | 4 directions  | 16    |
| attack | 3      | 4 directions  | 12    |

Directions order: down, up, left, right
Each frame: 32x32 pixels, transparent background

### Enemies
| Enemy     | idle | hurt |
|-----------|------|------|
| slime     | 4    | 2    |
| red_slime | 4    | 2    |

Each frame: 32x32 pixels, transparent background

### Tileset
| Index | Tile   |
|-------|--------|
| 0     | grass  |
| 1     | dirt   |
| 2     | wall   |
| 3     | water  |
| 4     | flowers|
| 5     | tree   |

Each tile: 32x32 pixels

---

## AI Prompt Tips
- "pixel art, 32x32, transparent background, [subject], retro 16-bit RPG"
- "consistent color palette across all assets"
- "aligned character feet in all frames"
- "no anti-aliasing, no gradients, clean pixel edges"
- Export as PNG with transparency

## Regenerate Placeholders
python scripts/generate_placeholders.py