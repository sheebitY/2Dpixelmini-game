import { entities } from "../entity-manager";
import { input } from "../../core/input-manager";
import { canMoveTo } from "../../world/collision";
import { CONFIG } from "../../config";
import { eventBus } from "../../core/event-bus";

export function movementSystem(dt: number, collisionMap: number[][]): void {
  const playerIds = entities.query("transform", "velocity", "health");

  for (const id of playerIds) {
    const transform = entities.getComponent(id, "transform")!;
    const velocity = entities.getComponent(id, "velocity")!;
    const health = entities.getComponent(id, "health")!;
    const ai = entities.getComponent(id, "ai");

    // Player movement
    if (!ai) {
      const dir = input.getDirection();
      velocity.vx = dir.dx * CONFIG.PLAYER_SPEED;
      velocity.vy = dir.dy * CONFIG.PLAYER_SPEED;

      // Update facing
      if (dir.dx < 0) transform.facing = "left";
      else if (dir.dx > 0) transform.facing = "right";
      if (dir.dy < 0) transform.facing = "up";
      else if (dir.dy > 0) transform.facing = "down";
    }

    // Apply velocity with collision
    const collider = entities.getComponent(id, "collider");
    const cw = collider?.useForMovement ? collider.width : transform.width;
    const ch = collider?.useForMovement ? collider.height : transform.height;
    const cxOff = collider?.useForMovement ? collider.offsetX : 0;
    const cyOff = collider?.useForMovement ? collider.offsetY : 0;
    const newX = transform.x + velocity.vx * dt;
    const newY = transform.y + velocity.vy * dt;

    // Try X movement
    if (canMoveTo(collisionMap, newX + cxOff, transform.y + cyOff, cw, ch)) {
      transform.x = newX;
    } else {
      velocity.vx = 0;
    }

    // Try Y movement
    if (canMoveTo(collisionMap, transform.x + cxOff, newY + cyOff, cw, ch)) {
      transform.y = newY;
    } else {
      velocity.vy = 0;
    }

    eventBus.emit("player_moved", { x: transform.x, y: transform.y });
  }
}