import { entities } from "../entity-manager";
import { CONFIG } from "../../config";

export function aiSystem(dt: number, now: number): void {
  const playerIds = entities.query("transform", "health", "stats").filter((id) => !entities.hasComponent(id, "ai"));
  if (playerIds.length === 0) return;
  const player = entities.getComponent(playerIds[0], "transform")!;

  const enemyIds = entities.query("transform", "velocity", "health", "ai", "stats");

  for (const id of enemyIds) {
    const transform = entities.getComponent(id, "transform")!;
    const velocity = entities.getComponent(id, "velocity")!;
    const health = entities.getComponent(id, "health")!;
    const ai = entities.getComponent(id, "ai")!;
    const stats = entities.getComponent(id, "stats")!;

    if (health.current <= 0) {
      ai.state = "dead";
      velocity.vx = 0;
      velocity.vy = 0;
      continue;
    }

    ai.stateTimer -= dt;

    const dx = (player.x + player.width / 2) - (transform.x + transform.width / 2 + ai.anchorOffsetX);
    const dy = (player.y + player.height / 2) - (transform.y + transform.height / 2 + ai.anchorOffsetY);
    const dist = Math.sqrt(dx * dx + dy * dy);

    switch (ai.state) {
      case "idle":
        velocity.vx = 0;
        velocity.vy = 0;
        if (dist < ai.detectRange) {
          ai.state = "chase";
          ai.stateTimer = 0;
        } else if (ai.stateTimer <= 0) {
          ai.state = "patrol";
          ai.stateTimer = 2 + Math.random() * 3;
          ai.patrolTarget = {
            x: transform.x + (Math.random() - 0.5) * 100,
            y: transform.y + (Math.random() - 0.5) * 100,
          };
        }
        break;

      case "patrol":
        if (dist < ai.detectRange) {
          ai.state = "chase";
          ai.stateTimer = 0;
          break;
        }
        if (ai.patrolTarget) {
          const pdx = ai.patrolTarget.x - (transform.x + transform.width / 2);
          const pdy = ai.patrolTarget.y - (transform.y + transform.height / 2);
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist < 5 || ai.stateTimer <= 0) {
            ai.state = "idle";
            ai.stateTimer = 1 + Math.random() * 2;
            velocity.vx = 0;
            velocity.vy = 0;
          } else {
            velocity.vx = (pdx / pdist) * stats.speed * 0.5;
            velocity.vy = (pdy / pdist) * stats.speed * 0.5;
          }
        }
        break;

      case "chase":
        if (dist > ai.detectRange * 1.5) {
          ai.state = "idle";
          ai.stateTimer = 1;
          velocity.vx = 0;
          velocity.vy = 0;
          break;
        }
        if (dist < ai.attackRange && ai.attackCooldown <= now) {
          // Enter attack state - lock for full animation duration
          ai.state = "attack";
          ai.stateTimer = ai.attackDuration;
          ai.attackDamageDealt = false;
          ai.attackProgress = 0;
          velocity.vx = 0;
          velocity.vy = 0;
        } else {
          velocity.vx = (dx / dist) * stats.speed;
          velocity.vy = (dy / dist) * stats.speed;
        }
        if (Math.abs(dx) > Math.abs(dy)) {
          transform.facing = dx > 0 ? "right" : "left";
        } else {
          transform.facing = dy > 0 ? "down" : "up";
        }
        break;

      case "attack":
        // Lock in place during attack
        velocity.vx = 0;
        velocity.vy = 0;
        // Track animation progress (0 -> 1)
        ai.attackProgress = Math.min(1, ai.attackProgress + dt / ai.attackDuration);
        // Transition out only when animation is fully complete
        if (ai.stateTimer <= 0) {
          ai.state = dist < ai.detectRange ? "chase" : "idle";
          ai.stateTimer = 0;
          ai.attackCooldown = now + ai.attackCooldownDuration;
        }
        break;
    }
  }
}