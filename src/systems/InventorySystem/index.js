import { getEquipmentById, EQUIPMENT_SLOTS } from "../../data/equipment/index.js?v=icons-3";
import {
  RARITY_ORDER,
  craftConfig,
  getCraftCostForResult,
  getCraftResultConfig
} from "../../data/balance/index.js?v=icons-3";
import { itemPower } from "../EquipmentSystem/index.js";

let uidCounter = 1;

export function createItem(baseId) {
  const base = getEquipmentById(baseId);
  if (!base) throw new Error(`Item nao encontrado: ${baseId}`);
  return {
    ...structuredClone(base),
    uid: `${base.id}-${Date.now().toString(36)}-${uidCounter++}`,
    favorite: false
  };
}

export function normalizeInventoryItem(item) {
  if (!item) return null;
  const base = getEquipmentById(item.id);
  if (!base) return item;
  return {
    ...structuredClone(base),
    uid: item.uid || `${base.id}-${Date.now().toString(36)}-${uidCounter++}`,
    favorite: Boolean(item.favorite)
  };
}

export function createEmptyInventory(size = 36) {
  return Array.from({ length: size }, () => null);
}

export function createStarterEquipment() {
  return {
    weapon: createItem("weapon-comum-t1"),
    body: createItem("body-comum-t1"),
    hands: createItem("hands-comum-t1")
  };
}

export function createStarterInventory() {
  const inventory = createEmptyInventory();
  ["weapon-comum-t2", "body-comum-t2", "hands-comum-t2"].forEach((id) => {
    addItem({ inventory }, createItem(id));
  });
  return inventory;
}

export function addItem(state, item) {
  const index = state.inventory.findIndex((cell) => !cell);
  if (index === -1) return false;
  state.inventory[index] = item;
  return true;
}

export function moveItem(inventory, from, to) {
  if (from === to || !inventory[from]) return;
  const next = inventory[to];
  inventory[to] = inventory[from];
  inventory[from] = next || null;
}

export function equipFromInventory(player, index) {
  const item = player.inventory[index];
  if (!item) return { ok: false, reason: "Selecione um item primeiro." };

  if (!EQUIPMENT_SLOTS.includes(item.slot)) {
    return { ok: false, reason: "Esse item nao pode ser equipado." };
  }

  const previous = player.equipment[item.slot];
  player.equipment[item.slot] = item;
  player.inventory[index] = previous || null;
  return { ok: true, message: `${item.name} equipado.` };
}

export function unequipToInventory(player, slot) {
  const item = player.equipment[slot];
  if (!item) return { ok: false, reason: "Slot vazio." };
  const index = player.inventory.findIndex((cell) => !cell);
  if (index === -1) return { ok: false, reason: "Inventario cheio." };

  player.inventory[index] = item;
  player.equipment[slot] = null;

  return { ok: true, message: `${item.name} voltou para o inventario.` };
}

export function sellInventoryItem(player, index) {
  const item = player.inventory[index];
  if (!item) return { ok: false, reason: "Selecione um item para vender." };
  if (item.slot === "drug") return { ok: false, reason: "Esse item nao pode ser vendido." };
  if (item.favorite) return { ok: false, reason: "Item favorito nao pode ser vendido." };
  const value = itemSellValue(item);
  player.money += value;
  player.inventory[index] = null;
  return { ok: true, value, message: `${item.name} vendido por R$ ${value}.` };
}

export function itemSellValue(item) {
  if (item?.slot === "drug") return 0;
  return item ? Math.max(1, Math.round(item.sellPrice ?? item.precoNPCCompra ?? (item.price || 0) * 0.3)) : 0;
}

export function sellInventoryItems(player, indexes, options = {}) {
  const skipFavorites = options.skipFavorites !== false;
  const uniqueIndexes = [...new Set(indexes)].filter((index) => player.inventory[index]);
  const sellableIndexes = uniqueIndexes.filter((index) => (
    player.inventory[index]?.slot !== "drug" &&
    (!skipFavorites || !player.inventory[index].favorite)
  ));
  if (!sellableIndexes.length) return { ok: false, reason: "Nenhum item vendavel selecionado." };

  let value = 0;
  sellableIndexes.forEach((index) => {
    value += itemSellValue(player.inventory[index]);
    player.inventory[index] = null;
  });

  return {
    ok: true,
    count: sellableIndexes.length,
    value,
    message: `${sellableIndexes.length} item(ns) vendidos por R$ ${value}.`
  };
}

export function sellAllInventory(player) {
  return sellNonFavoriteInventoryItems(player);
}

export function sellInventoryItemsByRarity(player, rarity) {
  const indexes = player.inventory
    .map((item, index) => item?.rarity === rarity ? index : null)
    .filter(Number.isInteger);
  return sellInventoryItems(player, indexes);
}

export function sellNonFavoriteInventoryItems(player) {
  const indexes = player.inventory
    .map((item, index) => item && !item.favorite ? index : null)
    .filter(Number.isInteger);
  return sellInventoryItems(player, indexes);
}

export function getCraftPreview(player, index) {
  const item = player.inventory[index];
  if (!item) return null;
  if (item.slot === "drug") return null;
  const result = getCraftResultConfig(item);
  const matchingIndexes = getCraftIndexes(player, item);
  const cost = getCraftCostForResult(result);
  const failureChance = getCraftFailureChance(result);
  return {
    item,
    result,
    count: matchingIndexes.length,
    needed: craftConfig.requiredItems,
    cost,
    failureChance,
    failureResult: failureChance ? item : null,
    canCraft: Boolean(result && matchingIndexes.length >= craftConfig.requiredItems && player.money >= cost)
  };
}

export function craftInventoryItem(player, index) {
  const item = player.inventory[index];
  if (!item) return { ok: false, reason: "Selecione um item para fundir." };
  if (item.slot === "drug") return { ok: false, reason: "Esse item nao pode ser fundido." };

  const resultConfig = getCraftResultConfig(item);
  if (!resultConfig) return { ok: false, reason: "Este item ja esta no maximo." };

  const matchingIndexes = getCraftIndexes(player, item);
  if (matchingIndexes.length < craftConfig.requiredItems) {
    return { ok: false, reason: `Faltam itens iguais: ${matchingIndexes.length}/${craftConfig.requiredItems}.` };
  }

  const cost = getCraftCostForResult(resultConfig);
  if (player.money < cost) return { ok: false, reason: `Moedas insuficientes para fundir. Custo: R$ ${cost}.` };

  const consumeIndexes = [
    index,
    ...matchingIndexes.filter((matchIndex) => matchIndex !== index)
  ].slice(0, craftConfig.requiredItems);

  player.money -= cost;
  const failureChance = getCraftFailureChance(resultConfig);
  const failed = failureChance > 0 && Math.random() < failureChance;
  const outputConfig = failed ? item : resultConfig;
  player.inventory[consumeIndexes[0]] = createItem(outputConfig.id);
  consumeIndexes.slice(1).forEach((consumeIndex) => {
    player.inventory[consumeIndex] = null;
  });

  return {
    ok: true,
    item: player.inventory[consumeIndexes[0]],
    spent: cost,
    failed,
    failureChance,
    message: failed
      ? `A fusao falhou: 4 itens viraram 1 ${item.name} por R$ ${cost}.`
      : `Fundiu 4 itens e criou ${resultConfig.name} por R$ ${cost}.`
  };
}

export function craftAllInventory(player) {
  let attempts = 0;
  let upgraded = 0;
  let failed = 0;
  let spent = 0;
  let changed = true;
  let stoppedByMoney = false;

  while (changed) {
    changed = false;
    for (const slot of EQUIPMENT_SLOTS) {
      for (const rarity of RARITY_ORDER) {
        for (let tier = 1; tier <= 4; tier += 1) {
          const sample = player.inventory.find((item) => isCraftMatch(item, { slot, rarity, tier }));
          if (!sample) continue;
          const resultConfig = getCraftResultConfig(sample);
          if (!resultConfig) continue;

          let matchingIndexes = getCraftIndexes(player, sample);
          while (matchingIndexes.length >= craftConfig.requiredItems) {
            const cost = getCraftCostForResult(resultConfig);
            if (player.money < cost) {
              stoppedByMoney = true;
              break;
            }

            const consumeIndexes = matchingIndexes.slice(0, craftConfig.requiredItems);
            player.money -= cost;
            spent += cost;
            attempts += 1;
            changed = true;
            const failureChance = getCraftFailureChance(resultConfig);
            const didFail = failureChance > 0 && Math.random() < failureChance;
            const outputConfig = didFail ? sample : resultConfig;
            if (didFail) failed += 1;
            else upgraded += 1;
            player.inventory[consumeIndexes[0]] = createItem(outputConfig.id);
            consumeIndexes.slice(1).forEach((consumeIndex) => {
              player.inventory[consumeIndex] = null;
            });
            matchingIndexes = getCraftIndexes(player, sample);
          }

          if (stoppedByMoney) break;
        }
        if (stoppedByMoney) break;
      }
      if (stoppedByMoney) break;
    }
  }

  if (!attempts) {
    return {
      ok: false,
      reason: stoppedByMoney ? "Moedas insuficientes para fundir." : "Nenhum grupo 4/4 disponivel."
    };
  }

  return {
    ok: true,
    count: attempts,
    upgraded,
    failed,
    spent,
    message: failed
      ? `${attempts} tentativa(s) por R$ ${spent}: ${upgraded} melhoria(s), ${failed} falha(s).`
      : `${attempts} fusao(oes) realizadas por R$ ${spent}.`
  };
}

export function craftProgressForItem(player, item) {
  if (!item) return 0;
  return getCraftIndexes(player, item).length;
}

export function equipBestAvailable(player) {
  const inventorySize = player.inventory.length;
  const allItems = [
    ...EQUIPMENT_SLOTS.map((slot) => player.equipment[slot]).filter(Boolean),
    ...player.inventory.filter(Boolean)
  ];
  const used = new Set();
  const nextEquipment = {};
  let equippedCount = 0;

  EQUIPMENT_SLOTS.forEach((slot) => {
    const best = bestItem(allItems, slot, used);
    nextEquipment[slot] = best || null;
    if (best && player.equipment[slot]?.uid !== best.uid) equippedCount += 1;
  });

  const leftovers = allItems.filter((item) => item && !used.has(item.uid));
  player.equipment = nextEquipment;
  player.inventory = [
    ...leftovers,
    ...Array.from({ length: Math.max(0, inventorySize - leftovers.length) }, () => null)
  ].slice(0, inventorySize);

  return equippedCount
    ? { ok: true, message: `${equippedCount} equipamento(s) otimizados.` }
    : { ok: false, reason: "Voce ja esta usando os melhores itens." };
}

export function organizeInventory(player) {
  const compact = player.inventory.filter(Boolean);
  player.inventory = [
    ...compact,
    ...Array.from({ length: player.inventory.length - compact.length }, () => null)
  ];
}

export function sortInventoryByTier(player) {
  const inventorySize = player.inventory.length;
  const compact = player.inventory.filter(Boolean).sort(compareInventoryItems);
  player.inventory = [
    ...compact,
    ...Array.from({ length: Math.max(0, inventorySize - compact.length) }, () => null)
  ].slice(0, inventorySize);
}

function getCraftIndexes(player, item) {
  return player.inventory
    .map((candidate, index) => isCraftMatch(candidate, item) && !candidate.favorite ? index : null)
    .filter(Number.isInteger);
}

function getCraftFailureChance(resultConfig) {
  if (!resultConfig) return 0;
  const startsAt = RARITY_ORDER.indexOf(craftConfig.failureStartsAtDestinationRarity || "raro");
  const resultRarity = RARITY_ORDER.indexOf(resultConfig.rarity);
  if (startsAt < 0 || resultRarity < startsAt) return 0;
  return Number(craftConfig.failureChance || 0);
}

function isCraftMatch(candidate, item) {
  return Boolean(
    candidate &&
    item &&
    candidate.slot === item.slot &&
    candidate.rarity === item.rarity &&
    Number(candidate.tier) === Number(item.tier)
  );
}

function bestItem(items, slot, used) {
  const candidates = items
    .filter((item) => item?.slot === slot && !used.has(item.uid))
    .sort((a, b) => itemPower(b) - itemPower(a) || (b.tier || 0) - (a.tier || 0));
  const best = candidates[0] || null;
  if (best) used.add(best.uid);
  return best;
}

function compareInventoryItems(a, b) {
  const groupDiff = inventorySortGroup(a) - inventorySortGroup(b);
  if (groupDiff) return groupDiff;
  const rarityDiff = RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
  if (rarityDiff) return rarityDiff;
  const tierDiff = Number(b.tier || 0) - Number(a.tier || 0);
  if (tierDiff) return tierDiff;
  const powerDiff = itemPower(b) - itemPower(a);
  if (powerDiff) return powerDiff;
  return String(a.name || "").localeCompare(String(b.name || ""));
}

function inventorySortGroup(item) {
  return isUseOrUtilityItem(item) ? 0 : 1;
}

function isUseOrUtilityItem(item) {
  const slot = String(item?.slot || "").toLowerCase();
  const label = String(item?.slotLabel || item?.category || item?.type || "").toLowerCase();
  return (
    slot === "drug" ||
    slot === "utility" ||
    slot === "util" ||
    slot === "consumable" ||
    label.includes("util") ||
    label.includes("uso")
  );
}
