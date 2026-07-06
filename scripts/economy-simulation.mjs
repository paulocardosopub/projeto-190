import {
  clampDirectCashReward,
  equipmentSlotsConfig,
  getEquipmentConfig,
  lootTables,
  mapsConfig
} from "../src/data/balance/index.js";

const ATTEMPTS = 100;
const TARGETS_PER_RAID_AVG = 7.5;
const RAW_RAIDS_PER_HOUR = 60;
const stats = { money: 0, loot: 0 };

const rows = mapsConfig.map((map) => {
  const rng = mulberry32(190000 + map.index * 97);
  const theftCash = simulate(map, rng, { wonFight: false, includeItems: false });
  const fightCash = simulate(map, rng, { wonFight: true, includeItems: false });
  const itemSell = simulate(map, rng, { wonFight: false, includeItems: true, onlyItems: true });
  const theftLiquid = simulate(map, rng, { wonFight: false, includeItems: true });
  const fightLiquid = simulate(map, rng, { wonFight: true, includeItems: true });

  return {
    map: map.index,
    tier: map.tier,
    name: map.name,
    cashRange: map.money,
    dropChance: map.chanceDropEquipamento ?? map.equipmentDropChance ?? 0,
    theftCash,
    fightCash,
    itemSell,
    theftLiquid,
    fightLiquid,
    theftRaidAvg: theftLiquid.avg * TARGETS_PER_RAID_AVG,
    fightRaidAvg: fightLiquid.avg * TARGETS_PER_RAID_AVG,
    theftRawHour: theftLiquid.avg * TARGETS_PER_RAID_AVG * RAW_RAIDS_PER_HOUR,
    fightRawHour: fightLiquid.avg * TARGETS_PER_RAID_AVG * RAW_RAIDS_PER_HOUR
  };
});

printTable(rows);
printTierSummary(rows);

function simulate(map, rng, options) {
  const values = Array.from({ length: ATTEMPTS }, () => {
    const cash = options.onlyItems
      ? 0
      : rollCash(map, rng, options.wonFight);
    const itemValue = options.includeItems ? rollItemSellValue(map, rng) : 0;
    return cash + itemValue;
  });
  return summarize(values);
}

function rollCash(map, rng, wonFight) {
  const [min, max] = map.money;
  const baseRoll = randomInt(min, max, rng);
  return clampDirectCashReward(baseRoll, map, stats, wonFight);
}

function rollItemSellValue(map, rng) {
  const dropChance = ((map.chanceDropEquipamento ?? map.equipmentDropChance ?? 0) / 100) + stats.loot;
  if (rng() >= Math.min(0.95, dropChance)) return 0;

  const slot = rollWeighted(Object.values(equipmentSlotsConfig).map((entry) => ({
    id: entry.id,
    chance: entry.dropWeight
  })), rng);
  const table = safeLootTable(map);
  const rarityTier = rollWeighted(table.map((entry) => ({
    id: `${entry.rarity}:${entry.tier}`,
    chance: entry.chance
  })), rng);
  const [rarity, tier] = rarityTier.split(":");
  const item = getEquipmentConfig(slot, rarity, Number(tier));
  return item?.sellPrice || 0;
}

function safeLootTable(map) {
  const mapNumber = Number(map.index || map.mapNumber || map.lootTableId || 1);
  return (lootTables[map.lootTableId || mapNumber] || lootTables[1]).filter((entry) => (
    entry.rarity !== "epico" || mapNumber >= 19
  ));
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    min: sorted[0] || 0,
    avg: sum / Math.max(1, sorted.length),
    p90: percentile(sorted, 90),
    p99: percentile(sorted, 99),
    max: sorted[sorted.length - 1] || 0
  };
}

function percentile(sorted, percent) {
  if (!sorted.length) return 0;
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil((percent / 100) * sorted.length) - 1));
  return sorted[index];
}

function printTable(data) {
  console.log("Economy simulation: 100 attempts per map/source, seed=190");
  console.log("Raw hour assumes 7.5 targets per 60-second raid and ignores stamina/offline limits.");
  console.log("");
  console.log([
    "Map",
    "Tier",
    "Cash range",
    "Drop%",
    "Theft cash avg/max/p99",
    "Fight cash avg/max/p99",
    "Item sell avg/p99",
    "Theft liquid avg/p99",
    "Fight liquid avg/p99",
    "Theft raid avg",
    "Raw theft hour"
  ].join(" | "));
  console.log([
    "---",
    "---",
    "---",
    "---",
    "---",
    "---",
    "---",
    "---",
    "---",
    "---",
    "---"
  ].join(" | "));

  data.forEach((row) => {
    console.log([
      row.map,
      `T${row.tier}`,
      `${money(row.cashRange[0])}-${money(row.cashRange[1])}`,
      `${row.dropChance}%`,
      compactStats(row.theftCash),
      compactStats(row.fightCash),
      `${money(row.itemSell.avg)}/${money(row.itemSell.p99)}`,
      `${money(row.theftLiquid.avg)}/${money(row.theftLiquid.p99)}`,
      `${money(row.fightLiquid.avg)}/${money(row.fightLiquid.p99)}`,
      money(row.theftRaidAvg),
      money(row.theftRawHour)
    ].join(" | "));
  });
}

function printTierSummary(data) {
  console.log("");
  console.log("Tier summary");
  console.log("Tier | Theft cash max | Theft liquid avg | Fight liquid avg | Max item sale p99");
  console.log("--- | --- | --- | --- | ---");
  for (const tier of [1, 2, 3, 4]) {
    const tierRows = data.filter((row) => row.tier === tier);
    console.log([
      `T${tier}`,
      money(Math.max(...tierRows.map((row) => row.theftCash.max))),
      money(avg(tierRows.map((row) => row.theftLiquid.avg))),
      money(avg(tierRows.map((row) => row.fightLiquid.avg))),
      money(Math.max(...tierRows.map((row) => row.itemSell.p99)))
    ].join(" | "));
  }
}

function compactStats(summary) {
  return `${money(summary.avg)}/${money(summary.max)}/${money(summary.p99)}`;
}

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function money(value) {
  return `R$ ${Math.round(value || 0).toLocaleString("pt-BR")}`;
}

function randomInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function rollWeighted(entries, rng) {
  const total = entries.reduce((sum, entry) => sum + entry.chance, 0);
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= entry.chance;
    if (roll <= 0) return entry.id;
  }
  return entries[entries.length - 1]?.id;
}

function mulberry32(seed) {
  return function nextRandom() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
