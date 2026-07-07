import { EQUIPMENT_SLOTS } from "../../data/equipment/index.js";
import { theftConfig } from "../../data/balance/index.js?v=balance-2";

const BASE_STATS = {
  hp: 105,
  attack: 6,
  speed: 1,
  block: 0,
  crit: 0.03,
  dodge: 0,
  steal: theftConfig.baseChance / 100,
  stealBonus: 0,
  loot: 0,
  money: 0
};

export function calculateStats(player) {
  const stats = {
    ...BASE_STATS,
    hp: BASE_STATS.hp + (player.level - 1) * 8,
    attack: BASE_STATS.attack + Math.max(0, player.level - 1)
  };

  const equipped = getEquippedItems(player.equipment);
  let stealBonus = 0;
  for (const item of equipped) {
    stealBonus += Number(item.furtoBonus || item.stats?.stealBonus || 0);
    for (const [key, value] of Object.entries(item.stats || {})) {
      if (key === "steal" || key === "stealBonus") continue;
      stats[key] = (stats[key] || 0) + value;
    }
  }

  stats.maxHp = Math.round(stats.hp);
  stats.attack = Math.round(stats.attack);
  stats.speed = Math.max(0.55, Number(stats.speed.toFixed(2)));
  stats.block = clamp(stats.block, 0, 0.58);
  stats.crit = clamp(stats.crit, 0, 0.65);
  stats.dodge = clamp(stats.dodge, 0, 0.45);
  stats.stealBonus = clamp(Number(stealBonus.toFixed(2)), 0, 10);
  stats.steal = calculateStealChancePercent(null, stats) / 100;
  stats.loot = clamp(stats.loot, 0, 0.8);
  stats.money = clamp(stats.money, 0, 1.5);
  stats.power = Math.round(
    stats.attack * 3 +
    stats.maxHp * 0.8 +
    stats.speed * 38 +
    stats.crit * 120 +
    stats.block * 110 +
    stats.stealBonus * 18
  );

  return stats;
}

export function calculateStealChancePercent(map, stats) {
  const risk = Number(map?.riscoFurtoMapa ?? map?.stealRisk ?? 0);
  const bonus = Number(stats?.stealBonus || 0);
  const baseSuccess = clamp(theftConfig.baseChance - risk + bonus, theftConfig.minChance, theftConfig.maxChance);
  const caughtChance = 100 - baseSuccess;
  const adjustedSuccess = 100 - caughtChance * Number(theftConfig.caughtChanceMultiplier || 1);
  return clamp(adjustedSuccess, theftConfig.minChance, theftConfig.maxChance);
}

export function calculateStealChance(map, stats) {
  return calculateStealChancePercent(map, stats) / 100;
}

export function getEquippedItems(equipment) {
  const items = [];
  for (const slot of EQUIPMENT_SLOTS) {
    if (equipment?.[slot]) items.push(equipment[slot]);
  }
  return items;
}

export function itemPower(item) {
  if (!item) return 0;
  const s = item.stats || {};
  return Math.round(
    (s.attack || 0) * 3 +
    (s.hp || 0) * 0.8 +
    (s.speed || 0) * 42 +
    (s.crit || 0) * 120 +
    (s.block || 0) * 105 +
    (item.furtoBonus || s.stealBonus || (s.steal || 0) * 100 || 0) * 18 +
    (s.loot || 0) * 70 +
    (s.money || 0) * 50
  );
}

export function statLabel(key) {
  return {
    hp: "Vida",
    attack: "Ataque",
    speed: "Vel. ataque",
    block: "Bloqueio",
    crit: "Critico",
    dodge: "Esquiva",
    steal: "Chance de furto",
    stealBonus: "Bonus de furto",
    loot: "Chance de loot",
    money: "Dinheiro extra"
  }[key] || key;
}

export function formatStat(key, value) {
  if (key === "stealBonus") return `+${formatPercentPoints(value)}`;
  if (["block", "crit", "dodge", "steal", "loot", "money"].includes(key)) {
    return `${Math.round(value * 100)}%`;
  }
  if (key === "speed") return `${value.toFixed(2)}x`;
  return `${Math.round(value)}`;
}

function formatPercentPoints(value) {
  return `${Number(value.toFixed?.(2) ?? value).toLocaleString("pt-BR")}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
