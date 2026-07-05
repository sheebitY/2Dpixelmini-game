import mapIndex from "../../assets/maps/index.json";
import { createCollisionFromTileMap } from "./collision";

interface Vec2 { x: number; y: number }

export interface Portal {
  x: number;
  y: number;
  targetMap: string;
  targetX: number;
  targetY: number;
}

export interface EnemySpawn {
  type: string;
  x: number;
  y: number;
}

export interface MapMeta {
  id: string;
  cols: number;
  rows: number;
  player: Vec2;
  enemies: EnemySpawn[];
  portals?: Portal[];
  grid: number[][];
}

export interface MapState {
  id: string;
  meta: MapMeta;
  tileMap: number[][];
  collisionMap: number[][];
}

class MapManager {
  private ids: string[] = [];
  private current: MapState | null = null;

  constructor() {
    this.ids = (mapIndex as { id: string; file: string }[]).map((m) => m.id);
  }

  get mapIds(): string[] {
    return this.ids;
  }

  get state(): MapState | null {
    return this.current;
  }

  get currentId(): string | null {
    return this.current?.id ?? null;
  }

  async loadMap(mapId: string): Promise<MapState> {
    const entry = (mapIndex as { id: string; file: string }[]).find((m) => m.id === mapId);
    if (!entry) {
      throw new Error(`Map not found in index: ${mapId}`);
    }

    const res = await fetch(entry.file);
    if (!res.ok) {
      throw new Error(`Failed to load map file: ${entry.file}`);
    }

    const meta = (await res.json()) as MapMeta;
    const tileMap = meta.grid;
    const collisionMap = createCollisionFromTileMap(tileMap);

    this.current = { id: meta.id, meta, tileMap, collisionMap };
    return this.current;
  }

  nextMapId(currentId?: string | null): string {
    if (this.ids.length === 0) {
      return "";
    }

    const id = currentId ?? this.current?.id;
    if (!id) {
      return this.ids[0];
    }

    const idx = Math.max(0, this.ids.indexOf(id));
    return this.ids[(idx + 1) % this.ids.length];
  }
}

export const mapManager = new MapManager();
