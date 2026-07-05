export function calculateDamage(
  atk: number,
  def: number,
  multiplier = 1.0
): { damage: number; isCrit: boolean } {
  const critChance = 0.1;
  const critMultiplier = 1.5;
  const isCrit = Math.random() < critChance;
  const raw = atk * multiplier * (isCrit ? critMultiplier : 1.0);
  const damage = Math.max(1, Math.floor(raw - def * 0.5));
  return { damage, isCrit };
}