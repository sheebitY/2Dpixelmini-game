// Component type definitions - all components are plain data objects

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  facing: "down" | "up" | "left" | "right";
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Sprite {
  textureId: string;
  frameIndex: number;
  frameTimer: number;
  animSpeed: number;
  animName: string;
  visible: boolean;
  offsetX: number;
  offsetY: number;
  tint: number;
}

export interface Collider {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  isStatic: boolean;
  layer: "player" | "enemy" | "player_attack" | "enemy_attack" | "item" | "wall";
  useForMovement?: boolean;
}

export interface Health {
  current: number;
  max: number;
  invincibleUntil: number;
  attackRange?: number;
  attackCooldown?: number;
  invincibleTime?: number;
}

export interface Stats {
  atk: number;
  def: number;
  speed: number;
  exp: number;
}

export interface AI {
  type: "patrol" | "chase";
  state: "idle" | "patrol" | "chase" | "attack" | "hurt" | "dead";
  stateTimer: number;
  patrolTarget: { x: number; y: number } | null;
  attackCooldown: number;
  attackCooldownDuration: number;
  anchorOffsetX: number;
  anchorOffsetY: number;
  detectRange: number;
  attackRange: number;
  targetId: number;
  // Attack animation sync
  attackDuration: number;       // total attack animation time (seconds)
  damageFrameRatio: number;     // 0-1, when damage triggers (e.g. 0.5 = halfway)
  attackDamageDealt: boolean;   // true once damage dealt this attack
  attackProgress: number;       // 0-1, current progress through attack animation
  hurtUntil: number;            // timestamp until which hurt animation plays
}

export interface DamageFlash {
  timer: number;
  duration: number;
}

export interface LootDrop {
  exp: number;
  enemyType: string;
}

export interface NPC {
  npcKey: string;
}

export interface Interactable {
  type: "chest" | "npc" | "portal";
  data: Record<string, any>;
  triggered: boolean;
}

export interface Lifetime {
  remaining: number;
}

// Component map type
export type ComponentMap = {
  transform: Transform;
  velocity: Velocity;
  sprite: Sprite;
  collider: Collider;
  health: Health;
  stats: Stats;
  ai: AI;
  damageFlash: DamageFlash;
  lootDrop: LootDrop;
  npc: NPC;
  interactable: Interactable;
  lifetime: Lifetime;
};

export type ComponentType = keyof ComponentMap;

