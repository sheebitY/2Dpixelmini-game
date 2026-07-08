import * as PIXI from "pixi.js";
import animConfig from "../../assets/animations.json";

interface AnimDef {
  file?: string;
  files?: string[];
  folder?: string;
  prefix?: string;
  frameCount?: number;
  startFrame?: number;
  frameWidth?: number;
  frameHeight?: number;
  frames?: number;
  framesPerDirection?: number;
  directions?: string[];
  nonDirectional?: boolean;
  directionMap?: Record<string, { folder: string; prefix: string; frameCount: number; mirrorX?: boolean; startFrame?: number }>;
  fps: number;
  loop: boolean;
}

interface TilesetDef {
  file?: string;
  files?: string[];
  folder?: string;
  tileSize?: number;
  tiles?: Record<string, number>;
}

export interface PlayerAnimSet {
  textures: PIXI.Texture[];
  fps: number;
  loop: boolean;
  mirrorX: boolean;
}

const textureCache = new Map<string, PIXI.Texture>();

async function loadOneTexture(path: string): Promise<PIXI.Texture> {
  if (textureCache.has(path)) return textureCache.get(path)!;
  try {
    const base = await PIXI.Assets.load({ alias: path, src: path }) as PIXI.BaseTexture;
    const texture = new PIXI.Texture(base);
    textureCache.set(path, texture);
    return texture;
  } catch (err) {
    console.error(`Failed to load: ${path}`, err);
    const fallback = PIXI.Texture.WHITE;
    textureCache.set(path, fallback);
    return fallback;
  }
}

async function loadSheet(path: string, fw: number, fh: number): Promise<PIXI.Texture[]> {
  const tex = await loadOneTexture(path);
  const bw = tex.baseTexture.width;
  const bh = tex.baseTexture.height;
  const frames: PIXI.Texture[] = [];
  const cols = Math.floor(bw / fw);
  const rows = Math.floor(bh / fh);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      frames.push(new PIXI.Texture(tex.baseTexture, new PIXI.Rectangle(c * fw, r * fh, fw, fh)));
    }
  }
  return frames;
}

async function loadIndividualFrames(
  folder: string, prefix: string, count: number, startFrame: number = 1
): Promise<PIXI.Texture[]> {
  const frames: PIXI.Texture[] = [];
  for (let i = 0; i < count; i++) {
    const n = startFrame + i;
    const raw = folder + prefix + n + ".png";
    const pad2 = folder + prefix + String(n).padStart(2, "0") + ".png";
    const pad4 = folder + prefix + String(n).padStart(4, "0") + ".png";
    const candidates = [pad4, pad2, raw];
    let loaded = false;
    for (const tryPath of candidates) {
      try {
        const base = await PIXI.Assets.load({ alias: tryPath, src: tryPath });
        frames.push(new PIXI.Texture(base as PIXI.BaseTexture));
        loaded = true;
        break;
      } catch (_) { /* try next */ }
    }
    if (!loaded) {
      console.warn("Frame missing:", candidates[0]);
      frames.push(PIXI.Texture.WHITE);
    }
  }
  return frames;
}

async function resolveFrames(def: AnimDef): Promise<PIXI.Texture[]> {
  const fw = def.frameWidth ?? 0;
  const fh = def.frameHeight ?? 0;

  if (def.file) {
    let frames = await loadSheet(def.file, fw, fh);
    const sf = def.startFrame ?? 0;
    const fc = def.frameCount ?? frames.length;
    return frames.slice(sf, sf + fc);
  }
  if (def.files && def.files.length > 0) {
    const frames: PIXI.Texture[] = [];
    for (const f of def.files) frames.push(await loadOneTexture(f));
    return frames;
  }
  if (def.folder && def.prefix && def.frameCount) {
    return loadIndividualFrames(def.folder, def.prefix, def.frameCount, def.startFrame ?? 1);
  }
  console.warn("AnimDef has no valid source:", def);
  return [PIXI.Texture.WHITE];
}

export async function loadPlayerTextures(): Promise<Record<string, PlayerAnimSet>> {
  const result: Record<string, PlayerAnimSet> = {};
  const cfg = (animConfig as any).player as Record<string, AnimDef>;

  for (const [action, def] of Object.entries(cfg)) {
    const dirs = def.directions ?? ["down", "up", "left", "right"];
    const fps = def.fps;
    const loop = def.loop;

    if (def.nonDirectional) {
      // Non-directional animations (e.g. die, hit) use all frames as a single entry
      result[action] = {
        textures: await resolveFrames(def),
        fps,
        loop,
        mirrorX: false,
      };
    } else if (def.directionMap) {
      for (const dir of dirs) {
        const dm = def.directionMap[dir];
        if (dm) {
          result[`${action}_${dir}`] = {
            textures: await resolveFrames(dm as AnimDef),
            fps,
            loop,
            mirrorX: dm.mirrorX ?? false,
          };
        } else {
          result[`${action}_${dir}`] = { textures: [PIXI.Texture.WHITE], fps, loop, mirrorX: false };
        }
      }
    } else {
      const allFrames = await resolveFrames(def);
      const fpd = def.framesPerDirection ?? def.frames ?? Math.floor(allFrames.length / dirs.length);
      for (let di = 0; di < dirs.length; di++) {
        result[`${action}_${dirs[di]}`] = {
          textures: allFrames.slice(di * fpd, (di + 1) * fpd),
          fps,
          loop,
          mirrorX: false,
        };
      }
    }
  }
  return result;
}

export async function loadEnemyTextures(enemyType: string): Promise<Record<string, PIXI.Texture[]>> {
  const result: Record<string, PIXI.Texture[]> = {};
  const cfg = (animConfig as any)[enemyType];
  if (!cfg) return result;

  for (const [action, def] of Object.entries(cfg) as [string, AnimDef][]) {
    result[action] = await resolveFrames(def);
  }
  return result;
}

export async function loadNPCTextures(npcType: string): Promise<Record<string, PIXI.Texture[]>> {
  const result: Record<string, PIXI.Texture[]> = {};
  const cfg = (animConfig as any)[npcType];
  if (!cfg) return result;
  for (const [action, def] of Object.entries(cfg) as [string, AnimDef][]) {
    result[action] = await resolveFrames(def);
  }
  return result;
}

export async function loadTileset(): Promise<Record<string, PIXI.Texture>> {
  const cfg = (animConfig as any).tileset as TilesetDef;
  const result: Record<string, PIXI.Texture> = {};

  if (cfg.folder) {
    for (const name of Object.keys(cfg.tiles ?? {})) {
      result[name] = await loadOneTexture(`${cfg.folder}${name}.png`);
    }
    return result;
  }

  if (cfg.files) {
    const names = Object.keys(cfg.tiles ?? {});
    for (let i = 0; i < cfg.files.length; i++) {
      result[names[i] ?? `tile_${i}`] = await loadOneTexture(cfg.files[i]);
    }
    return result;
  }

  if (cfg.file) {
    const fw = cfg.tileSize ?? 32;
    const fh = fw;
    const allTiles = await loadSheet(cfg.file, fw, fh);
    for (const [name, index] of Object.entries(cfg.tiles ?? {})) {
      if ((index as number) < allTiles.length) result[name] = allTiles[index as number];
    }
    return result;
  }

  return result;
}



