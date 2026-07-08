import { entities } from "../entity-manager";
import { input } from "../../core/input-manager";
import { canMoveTo } from "../../world/collision";
import { CONFIG } from "../../config";
import { eventBus } from "../../core/event-bus";

export function movementSystem(dt: number, collisionMap: number[][]): void {
  // Process all moving entities (player + enemies), but skip static NPCs.
  const ids = entities
    .query("transform", "velocity", "health")
    .filter((id) => !entities.hasComponent(id, "npc"));

  for (const id of ids) {
    const transform = entities.getComponent(id, "transform")!;
    const velocity = entities.getComponent(id, "velocity")!;
    const isPlayer = !entities.hasComponent(id, "ai");

    // Player velocity comes from input; enemy velocity is set by aiSystem.
    if (isPlayer) {
      const dir = input.getDirection();
      const stats = entities.getComponent(id, "stats");
      const speed = stats?.speed ?? CONFIG.PLAYER_SPEED;
      velocity.vx = dir.dx * speed;
      velocity.vy = dir.dy * speed;

      if (dir.dx < 0) transform.facing = "left";
      else if (dir.dx > 0) transform.facing = "right";
      if (dir.dy < 0) transform.facing = "up";
      else if (dir.dy > 0) transform.facing = "down";
    }

    const collider = entities.getComponent(id, "collider");
    const cw = collider?.useForMovement ? collider.width : transform.width;
    const ch = collider?.useForMovement ? collider.height : transform.height;
    const cxOff = collider?.useForMovement ? collider.offsetX : 0;
    const cyOff = collider?.useForMovement ? collider.offsetY : 0;
    const newX = transform.x + velocity.vx * dt;
    const newY = transform.y + velocity.vy * dt;

    const blockedByEntity = (rx: number, ry: number, rw: number, rh: number) => {
      const all = entities.query("transform", "collider");
      for (const oid of all) {
        if (oid === id) continue;
        const oc = entities.getComponent(oid, "collider")!;
        if (!oc.isStatic) continue;
        const ot = entities.getComponent(oid, "transform")!;
        const ox = ot.x + (oc.offsetX ?? 0);
        const oy = ot.y + (oc.offsetY ?? 0);
        if (rx < ox + oc.width && rx + rw > ox && ry < oy + oc.height && ry + rh > oy) return true;
      }
      return false;
    };

    const ai = entities.getComponent(id, "ai");
    const canFly = ai?.canFly ?? false;
    if ((canMoveTo(collisionMap, newX + cxOff, transform.y + cyOff, cw, ch) || canFly) && !blockedByEntity(newX + cxOff, transform.y + cyOff, cw, ch)) {
      transform.x = newX;
    } else {
      velocity.vx = 0;
    }

    if ((canMoveTo(collisionMap, transform.x + cxOff, newY + cyOff, cw, ch) || canFly) && !blockedByEntity(transform.x + cxOff, newY + cyOff, cw, ch)) {
      transform.y = newY;
    } else {
      velocity.vy = 0;
    }

    if (isPlayer) {
      eventBus.emit("player_moved", { x: transform.x, y: transform.y });
    }
  }
}
