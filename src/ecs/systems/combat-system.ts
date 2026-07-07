import { entities } from "../entity-manager";
import { calculateDamage } from "../../combat/damage";
import { eventBus } from "../../core/event-bus";
import { input } from "../../core/input-manager";
import { CONFIG } from "../../config";

export function combatSystem(now: number): void {
  const playerIds = entities.query("transform", "health", "stats")
    .filter((id) => !entities.hasComponent(id, "ai"));
  const enemyIds = entities.query("transform", "health", "stats", "ai");

  for (const playerId of playerIds) {
    const pTransform = entities.getComponent(playerId, "transform")!;
    const pStats = entities.getComponent(playerId, "stats")!;
    const pHealth = entities.getComponent(playerId, "health")!;

    // === Player attack ===
    if (input.isKeyJustPressed("Space") || input.isKeyJustPressed("KeyZ")) {
      const cooldownUntil = (pHealth as any).attackCooldownUntil ?? 0;
      if (now >= cooldownUntil) {
        let ax = pTransform.x + pTransform.width / 2 + (pHealth.anchorOffsetX ?? 0);
        let ay = pTransform.y + pTransform.height / 2 + (pHealth.anchorOffsetY ?? 0);
        const range = pHealth.attackRange ?? 0;
        if (pTransform.facing === "right") ax += range;
        else if (pTransform.facing === "left") ax -= range;
        else if (pTransform.facing === "down") ay += range;
        else if (pTransform.facing === "up") ay -= range;

        for (const enemyId of enemyIds) {
          const eTransform = entities.getComponent(enemyId, "transform")!;
          const eHealth = entities.getComponent(enemyId, "health")!;
          const eStats = entities.getComponent(enemyId, "stats")!;

          if (now < eHealth.invincibleUntil) continue;
          if (eHealth.current <= 0) continue;  // already dead

          const ecx = eTransform.x + eTransform.width / 2;
          const ecy = eTransform.y + eTransform.height / 2;
          const dx = ax - ecx;
          const dy = ay - ecy;

          if (Math.sqrt(dx * dx + dy * dy) < range) {
            const { damage, isCrit } = calculateDamage(pStats.atk, eStats.def);
            eHealth.current -= damage;
            eHealth.invincibleUntil = now + 0.3;
            const eAI = entities.getComponent(enemyId, "ai");
            if (eAI) eAI.hurtUntil = now + 0.3;

            eventBus.emit("damage_dealt", {
              sourceId: playerId, targetId: enemyId,
              amount: damage, isCrit, x: ecx, y: eTransform.y,
            });

            if (eHealth.current <= 0) {
              eHealth.current = 0;
              const loot = entities.getComponent(enemyId, "lootDrop");
              eventBus.emit("enemy_killed", {
                enemyId,
                enemyType: loot?.enemyType ?? "unknown",
                exp: loot?.exp ?? 10,
                x: eTransform.x, y: eTransform.y,
              });
            }
          }
        }
        (pHealth as any).attackCooldownUntil = now + (pHealth.attackCooldown ?? 1);
        eventBus.emit("player_attacked");
      }
    }

    // === Enemy attack (animation-synced) ===
    for (const enemyId of enemyIds) {
      const eTransform = entities.getComponent(enemyId, "transform")!;
      const eHealth = entities.getComponent(enemyId, "health")!;
      const eStats = entities.getComponent(enemyId, "stats")!;
      const eAI = entities.getComponent(enemyId, "ai")!;

      if (eAI.state !== "attack" || eHealth.current <= 0) continue;

      // Only deal damage once per attack, at the damage frame
      if (eAI.attackDamageDealt) continue;

      if (eAI.attackProgress >= eAI.damageFrameRatio) {
        const dx = (pTransform.x + pTransform.width / 2 + (pHealth.anchorOffsetX ?? 0)) - (eTransform.x + eTransform.width / 2);
        const dy = (pTransform.y + pTransform.height / 2 + (pHealth.anchorOffsetY ?? 0)) - (eTransform.y + eTransform.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < eAI.attackRange + pTransform.width / 2) {
          if (now >= pHealth.invincibleUntil) {
            const { damage, isCrit } = calculateDamage(eStats.atk, pStats.def);
            pHealth.current -= damage;
            pHealth.invincibleUntil = now + (pHealth.invincibleTime ?? 0.5);
            eventBus.emit("player_hit");

            eventBus.emit("damage_dealt", {
              sourceId: enemyId, targetId: playerId,
              amount: damage, isCrit,
              x: pTransform.x + pTransform.width / 2 + (pHealth.anchorOffsetX ?? 0), y: pTransform.y,
            });

            if (pHealth.current <= 0) {
              pHealth.current = 0;
              eventBus.emit("player_died");
            }
          }
        }
        // Mark damage dealt regardless of hit (so it doesn't retry)
        eAI.attackDamageDealt = true;
      }
    }
  }
}




