import { NPC_TYPES } from "../../data/enemies/index.js";

export function createNpcWave(map) {
  const count = randomInt(5, 10);
  const spacing = Math.max(190, Math.floor(1780 / count));
  return Array.from({ length: count }, (_, index) => {
    const type = NPC_TYPES[randomInt(0, NPC_TYPES.length - 1)] || NPC_TYPES[0];
    return {
      id: `${map.id}-npc-${index}-${Date.now().toString(36)}`,
      typeId: type.id,
      name: type.name,
      sheet: type.sheet || "enemies",
      row: type.row,
      x: 380 + index * spacing + randomInt(20, 120),
      y: 235,
      direction: index % 2 === 0 ? "back" : "right",
      walkPhase: Math.random() * 10,
      done: false,
      alerted: false,
      baseHp: type.baseHp,
      baseAttack: type.baseAttack
    };
  });
}

export function createEnemyStats(npc, map) {
  const level = map.enemyLevel || map.index || 1;
  const hp = Number(map.enemyHp ?? map.hpInimigo ?? npc.baseHp + level * 32);
  const attack = Number(map.enemyDamage ?? map.danoInimigo ?? npc.baseAttack + level * 4.6);
  return {
    name: npc.name,
    level,
    hp: Math.round(hp),
    attack: Math.round(attack),
    speed: Math.max(0.72, 1.1 - level * 0.018),
    block: Math.min(0.32, level * 0.018)
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
