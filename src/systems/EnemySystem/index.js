import { npcTypesForMap } from "../../data/enemies/index.js?v=npc-crops-1";

export function createNpcWave(map) {
  const count = randomInt(5, 10);
  const spacing = Math.max(190, Math.floor(1780 / count));
  const npcTypes = npcTypesForMap(map);
  const firstBaseIndex = npcTypes.findIndex((type) => !type.contexts);
  const prioritizedCount = firstBaseIndex > 0 ? firstBaseIndex : npcTypes.length;
  const baseStart = firstBaseIndex > 0 ? firstBaseIndex : npcTypes.length;
  const startIndex = (((Number(map?.index) || 1) - 1) * 3) % prioritizedCount;
  return Array.from({ length: count }, (_, index) => {
    const shouldUseBase = baseStart < npcTypes.length && index % 4 === 3;
    const type = shouldUseBase
      ? npcTypes[baseStart + randomInt(0, npcTypes.length - baseStart - 1)]
      : npcTypes[(startIndex + index) % prioritizedCount] || npcTypes[0];
    return {
      id: `${map.id}-npc-${index}-${Date.now().toString(36)}`,
      typeId: type.id,
      name: type.name,
      sheet: type.sheet || "enemies",
      row: type.row,
      columnOffset: Number(type.columnOffset || 0),
      x: 380 + index * spacing + randomInt(20, 120),
      y: 235,
      direction: type.direction || (index % 2 === 0 ? "back" : "right"),
      fixedFrame: Boolean(type.fixedFrame),
      heightScale: Number(type.heightScale || 1),
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
