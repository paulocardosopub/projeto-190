import {
  equipmentSlotsConfig,
  getEquipmentConfig,
  lootTables,
  rarityConfig
} from "../../data/balance/index.js?v=vault-1";
import { createItem, addItem } from "../InventorySystem/index.js?v=vault-1";

const LOOT_SLOT_WEIGHTS = Object.values(equipmentSlotsConfig).map((slot) => ({
  id: slot.id,
  chance: slot.dropWeight
}));

export function rollLoot(map, stats, wonFight = false) {
  const moneyMin = map.money[0];
  const moneyMax = map.money[1];
  const moneyRoll = randomInt(moneyMin, moneyMax);
  const money = Math.round(moneyRoll * (1 + (stats.money || 0)) * (wonFight ? 1.25 : 1));
  const xp = Math.round(map.xp * (wonFight ? 1.35 : 1));
  const itemChance = Math.min(0.95, (map.chanceDropEquipamento ?? map.equipmentDropChance ?? 0) / 100 + (stats.loot || 0));
  const equipmentId = Math.random() < itemChance ? rollEquipmentId(map) : null;
  const item = equipmentId ? createItem(equipmentId) : null;

  return { money, xp, item };
}

export function applyLoot(state, reward) {
  state.player.money += reward.money || 0;
  let itemAdded = false;
  if (reward.item) {
    itemAdded = addItem(state.player, reward.item);
  }
  return itemAdded;
}

function rollEquipmentId(map) {
  const slot = rollWeighted(LOOT_SLOT_WEIGHTS);
  const table = safeLootTable(map);
  const rarityTier = rollWeighted(table.map((entry) => ({
    id: `${entry.rarity}:${entry.tier}`,
    chance: entry.chance
  })));
  const [rarity, tier] = rarityTier.split(":");
  return getEquipmentConfig(slot, rarity, Number(tier))?.id || null;
}

function safeLootTable(map) {
  const mapNumber = Number(map.index || map.mapNumber || map.lootTableId || 1);
  return (lootTables[map.lootTableId || mapNumber] || lootTables[1]).filter((entry) => {
    const rarity = rarityConfig[entry.rarity];
    if (!rarity?.drops) return false;
    if (entry.rarity === "epico" && mapNumber < 19) return false;
    return true;
  });
}

function rollWeighted(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.chance, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.chance;
    if (roll <= 0) return entry.id;
  }
  return entries[entries.length - 1]?.id;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
