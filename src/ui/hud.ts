import * as PIXI from "pixi.js";
import { entities } from "../ecs/entity-manager";
import { eventBus } from "../core/event-bus";

interface DamageNumber {
  text: PIXI.Text;
  vy: number;
  life: number;
}

export class HUD {
  /** PIXI container for HUD-level elements */
  container: PIXI.Container;

  private hpBar: HTMLElement;
  private hpText: HTMLElement;
  private expBar: HTMLElement;
  private expText: HTMLElement;
  private levelText: HTMLElement;
  private mapNameEl: HTMLElement;

  private worldContainer: PIXI.Container | null = null;
  private damageNumbers: DamageNumber[] = [];
  private level = 1;
  private exp = 0;
  private expToLevel = 50;

  constructor() {
    this.container = new PIXI.Container();
    this.container.zIndex = 1000;

    this.hpBar   = document.getElementById("hp-bar")!;
    this.hpText  = document.getElementById("hp-text")!;
    this.expBar  = document.getElementById("exp-bar")!;
    this.expText = document.getElementById("exp-text")!;
    this.levelText = document.getElementById("level-text")!;
    this.mapNameEl = document.getElementById("map-name")!;

    eventBus.on("damage_dealt", (data: any) => {
      this.spawnDamageNumber(data.amount, data.isCrit, data.x, data.y);
    });

    eventBus.on("enemy_killed", (data: any) => {
      this.addExp(data.exp);
    });
  }

  /** Set the world container where damage numbers should be rendered */
  setWorldContainer(container: PIXI.Container): void {
    this.worldContainer = container;
  }

  private spawnDamageNumber(amount: number, isCrit: boolean, x: number, y: number): void {
    const color = isCrit ? 0xffd700 : 0xff4444;
    const size  = isCrit ? 20 : 14;
    const prefix = isCrit ? "! " : "";
    const text = new PIXI.Text(`${prefix}-${amount}`, {
      fontSize: size,
      fill: color,
      fontWeight: "bold",
      fontFamily: "monospace",
      stroke: 0x000000,
      strokeThickness: 3,
    });
    text.anchor.set(0.5, 1);
    text.position.set(x, y);
    const parent = this.worldContainer ?? this.container;
    parent.addChild(text);
    this.damageNumbers.push({ text, vy: -60, life: 1.0 });
  }

  private addExp(amount: number): void {
    this.exp += amount;
    while (this.exp >= this.expToLevel) {
      this.exp -= this.expToLevel;
      this.level++;
      this.expToLevel = Math.floor(this.expToLevel * 1.5);
      const playerIds = entities.query("health").filter((id) => !entities.hasComponent(id, "ai"));
      if (playerIds.length > 0) {
        const hp = entities.getComponent(playerIds[0], "health")!;
        hp.current = hp.max;
      }
      eventBus.emit("player_leveled_up", { newLevel: this.level });
    }
  }

  setMapName(id: string): void {
    const label = id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    this.mapNameEl.textContent = label;
    this.mapNameEl.classList.add("show");
  }

  update(dt: number, _canvasWidth: number, _canvasHeight: number): void {
    const playerIds = entities.query("health").filter((id) => !entities.hasComponent(id, "ai"));
    if (playerIds.length > 0) {
      const hp = entities.getComponent(playerIds[0], "health")!;
      const ratio = Math.max(0, hp.current / hp.max);
      const percent = (ratio * 100).toFixed(1) + "%";

      this.hpBar.style.width = percent;
      this.hpBar.classList.remove("hp-medium", "hp-low");
      if (ratio <= 0.25)      this.hpBar.classList.add("hp-low");
      else if (ratio <= 0.50) this.hpBar.classList.add("hp-medium");

      this.hpText.textContent = `${Math.max(0, Math.ceil(hp.current))} / ${hp.max}`;
    }

    this.levelText.textContent = `Lv.${this.level}`;
    const expPercent = this.expToLevel > 0
      ? ((this.exp / this.expToLevel) * 100).toFixed(1) + "%"
      : "0%";
    this.expBar.style.width = expPercent;
    this.expText.textContent = `${this.exp} / ${this.expToLevel}`;

    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life -= dt;
      dn.text.y += dn.vy * dt;
      dn.text.alpha = Math.max(0, dn.life);
      if (dn.life <= 0) {
        dn.text.parent?.removeChild(dn.text);
        dn.text.destroy();
        this.damageNumbers.splice(i, 1);
      }
    }
  }
}

