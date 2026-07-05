import { CONFIG } from "../config";

// Tile indices aligned with animations.json tileset.tiles (values unused by renderer)
export const TILE = {
  GRASS: 0,
  DIRT: 1,
  WALL: 2,
  WATER: 3,
  FLOWERS: 4,
  TREE: 5,
} as const;

// 0 = walkable, 1 = blocked
// This is a simple demo map with walls around the border and some obstacles
export function createDemoMap(): number[][] {
  const rows = CONFIG.MAP_ROWS;
  const cols = CONFIG.MAP_COLS;
  const map: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      // Border walls
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        row.push(1);
      }
      // Some obstacles in the middle
      else if ((r === 5 && c >= 8 && c <= 12) || (r === 10 && c >= 15 && c <= 19) || (c === 7 && r >= 3 && r <= 7) || (c === 18 && r >= 11 && r <= 15)) {
        row.push(1);
      } else {
        row.push(0);
      }
    }
    map.push(row);
  }
  return map;
}

export function isBlocked(map: number[][], col: number, row: number): boolean {
  if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return true;
  return map[row][col] === 1;
}

export function canMoveTo(map: number[][], x: number, y: number, w: number, h: number): boolean {
  const ts = CONFIG.TILE_SIZE;
  const left = Math.floor(x / ts);
  const right = Math.floor((x + w - 1) / ts);
  const top = Math.floor(y / ts);
  const bottom = Math.floor((y + h - 1) / ts);

  for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) {
      if (isBlocked(map, c, r)) return false;
    }
  }
  return true;
}

// Tile-map helpers for rendering tile images instead of collision-only map
export function createDemoTileMap(): number[][] {
  const rows = CONFIG.MAP_ROWS;
  const cols = CONFIG.MAP_COLS;
  const map: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        row.push(TILE.WALL);
      } else if (
        (r === 5 && c >= 8 && c <= 12) ||
        (r === 10 && c >= 15 && c <= 19) ||
        (c === 7 && r >= 3 && r <= 7) ||
        (c === 18 && r >= 11 && r <= 15)
      ) {
        row.push(TILE.WALL);
      } else {
        row.push((r * 31 + c * 17) % 10 < 2 ? TILE.FLOWERS : TILE.GRASS);
      }
    }
    map.push(row);
  }
  return map;
}

export function createCollisionFromTileMap(tileMap: number[][]): number[][] {
  return tileMap.map((row) => row.map((t) => (t === TILE.WALL || t === TILE.TREE || t === TILE.WATER ? 1 : 0)));
}
