import { getEquipmentById, EQUIPMENT_SLOTS } from "../../data/equipment/index.js?v=icons-3";
import {
  RARITY_ORDER,
  craftConfig,
  getCraftCostForResult,
  getCraftResultConfig
} from "../../data/balance/index.js?v=icons-3";
import { itemPower } from "../EquipmentSystem/index.js";

let uidCounter = 1;
export const ITEM_STACK_LIMIT = 4;

const INVENTORY_SLOT_ORDER = {
  weapon: 0,
  body: 1,
  hands: 2
};

export function createItem(baseId) {
  const base = getEquipmentById(baseId);
  if (!base) throw new Error(`Item nao encontrado: ${baseId}`);
  return {
    ...structuredClone(base),
    uid: `${base.id}-${Date.now().toString(36)}-${uidCounter++}`,
    favorite: false,
    quantity: 1
  };
}

export function normalizeInventoryItem(item) {
  if (!item) return null;
  const base = getEquipmentById(item.id);
  if (!base) return item;
  return {
    ...structuredClone(base),
    uid: item.uid || `${base.id}-${Date.now().toString(36)}-${uidCounter++}`,
    favorite: Boolean(item.favorite),
    quantity: itemQuantity(item)
  };
}

export function itemQuantity(item) {
  if (!item) return 0;
  const value = Math.floor(Number(item.quantity ?? item.count ?? 1));
  return Number.isFinite(value) && value > 0 ? value : 1;
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
  if (!state || !Array.isArray(state.inventory) || !item) return false;
  const incoming = normalizeStackItem(item);
  let remaining = itemQuantity(incoming);
  const capacity = stackCapacityFor(state.inventory, incoming);
  if (capacity < remaining) return false;

  for (const cell of state.inventory) {
    if (!canStackItems(cell, incoming)) continue;
    const current = itemQuantity(cell);
    const amount = Math.min(ITEM_STACK_LIMIT - current, remaining);
    if (amount <= 0) continue;
    cell.quantity = current + amount;
    remaining -= amount;
    if (remaining <= 0) return true;
  }

  while (remaining > 0) {
    const index = state.inventory.findIndex((cell) => !cell);
    if (index === -1) return false;
    const amount = Math.min(ITEM_STACK_LIMIT, remaining);
    state.inventory[index] = normalizeStackItem(incoming, amount, { freshUid: amount !== itemQuantity(incoming) });
    remaining -= amount;
  }
  return true;
}

export function moveItem(inventory, from, to) {
  if (from === to || !inventory[from]) return;
  if (inventory[to] && canStackItems(inventory[to], inventory[from])) {
    const targetQuantity = itemQuantity(inventory[to]);
    const sourceQuantity = itemQuantity(inventory[from]);
    const amount = Math.min(ITEM_STACK_LIMIT - targetQuantity, sourceQuantity);
    if (amount > 0) {
      inventory[to].quantity = targetQuantity + amount;
      removeItemUnits(inventory, from, amount);
      return;
    }
  }
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

  const previous = player.equipment[item.slot] || null;
  const equipped = singleItemFromStack(item);
  const originalStack = normalizeStackItem(item);
  removeItemUnits(player.inventory, index, 1);
  player.equipment[item.slot] = equipped;

  if (previous && !addItem(player, previous)) {
    player.equipment[item.slot] = previous;
    player.inventory[index] = originalStack;
    return { ok: false, reason: "Mochila cheia para guardar o item equipado." };
  }

  return { ok: true, message: `${item.name} equipado.` };
}

export function unequipToInventory(player, slot) {
  const item = player.equipment[slot];
  if (!item) return { ok: false, reason: "Slot vazio." };
  if (!addItem(player, item)) return { ok: false, reason: "Inventario cheio." };

  player.equipment[slot] = null;

  return { ok: true, message: `${item.name} voltou para o inventario.` };
}

export function sellInventoryItem(player, index) {
  const item = player.inventory[index];
  if (!item) return { ok: false, reason: "Selecione um item para vender." };
  if (item.slot === "drug") return { ok: false, reason: "Esse item nao pode ser vendido." };
  if (item.favorite) return { ok: false, reason: "Item favorito nao pode ser vendido." };
  const value = itemSellValue(item);
  const quantity = itemQuantity(item);
  player.money += value;
  player.inventory[index] = null;
  return { ok: true, value, count: quantity, message: `${quantity} ${item.name} vendido(s) por R$ ${value}.` };
}

export function itemSellValue(item) {
  if (item?.slot === "drug") return 0;
  const unitValue = item ? Math.max(1, Math.round(item.sellPrice ?? item.precoNPCCompra ?? (item.price || 0) * 0.3)) : 0;
  return unitValue * itemQuantity(item);
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
  let count = 0;
  sellableIndexes.forEach((index) => {
    value += itemSellValue(player.inventory[index]);
    count += itemQuantity(player.inventory[index]);
    player.inventory[index] = null;
  });

  return {
    ok: true,
    count,
    value,
    message: `${count} item(ns) vendidos por R$ ${value}.`
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
  const matchingUnits = getCraftUnitRefs(player, item);
  const cost = getCraftCostForResult(result);
  const failureChance = getCraftFailureChance(result);
  return {
    item,
    result,
    count: matchingUnits.length,
    needed: craftConfig.requiredItems,
    cost,
    failureChance,
    failureResult: failureChance ? item : null,
    canCraft: Boolean(result && matchingUnits.length >= craftConfig.requiredItems && player.money >= cost)
  };
}

export function craftInventoryItem(player, index) {
  const item = player.inventory[index];
  if (!item) return { ok: false, reason: "Selecione um item para fundir." };
  if (item.slot === "drug") return { ok: false, reason: "Esse item nao pode ser fundido." };

  const resultConfig = getCraftResultConfig(item);
  if (!resultConfig) return { ok: false, reason: "Este item ja esta no maximo." };

  const matchingUnits = getCraftUnitRefs(player, item);
  if (matchingUnits.length < craftConfig.requiredItems) {
    return { ok: false, reason: `Faltam itens iguais: ${matchingUnits.length}/${craftConfig.requiredItems}.` };
  }

  const cost = getCraftCostForResult(resultConfig);
  if (player.money < cost) return { ok: false, reason: `Moedas insuficientes para fundir. Custo: R$ ${cost}.` };

  const consumeUnits = [
    ...matchingUnits.filter((unit) => unit.index === index),
    ...matchingUnits.filter((unit) => unit.index !== index)
  ].slice(0, craftConfig.requiredItems);

  player.money -= cost;
  const failureChance = getCraftFailureChance(resultConfig);
  const failed = failureChance > 0 && Math.random() < failureChance;
  const outputConfig = failed ? item : resultConfig;
  const preferredIndex = consumeUnits[0]?.index ?? index;
  consumeCraftUnits(player.inventory, consumeUnits);
  placeCraftResult(player, preferredIndex, createItem(outputConfig.id));

  return {
    ok: true,
    item: player.inventory[preferredIndex] || outputConfig,
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
          let sample = player.inventory.find((item) => isCraftMatch(item, { slot, rarity, tier }));
          if (!sample) continue;

          while (sample) {
            const resultConfig = getCraftResultConfig(sample);
            if (!resultConfig) break;
            const matchingUnits = getCraftUnitRefs(player, sample);
            if (matchingUnits.length < craftConfig.requiredItems) break;
            const cost = getCraftCostForResult(resultConfig);
            if (player.money < cost) {
              stoppedByMoney = true;
              break;
            }

            const consumeUnits = matchingUnits.slice(0, craftConfig.requiredItems);
            player.money -= cost;
            spent += cost;
            attempts += 1;
            changed = true;
            const failureChance = getCraftFailureChance(resultConfig);
            const didFail = failureChance > 0 && Math.random() < failureChance;
            const outputConfig = didFail ? sample : resultConfig;
            if (didFail) failed += 1;
            else upgraded += 1;
            const preferredIndex = consumeUnits[0]?.index ?? player.inventory.findIndex((cell) => !cell);
            consumeCraftUnits(player.inventory, consumeUnits);
            placeCraftResult(player, preferredIndex, createItem(outputConfig.id));
            sample = player.inventory.find((item) => isCraftMatch(item, { slot, rarity, tier }));
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
  return getCraftUnitRefs(player, item).length;
}

export function equipBestAvailable(player) {
  const inventorySize = player.inventory.length;
  const allItems = [
    ...EQUIPMENT_SLOTS.map((slot) => player.equipment[slot]).filter(Boolean).map((item) => normalizeStackItem(item, 1)),
    ...expandStackUnits(player.inventory)
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
  player.inventory = compactInventoryStacks([
    ...leftovers,
    ...Array.from({ length: Math.max(0, inventorySize - leftovers.length) }, () => null)
  ].slice(0, inventorySize));

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

export function compactInventoryStacks(inventory) {
  const size = inventory?.length || 0;
  const compact = createEmptyInventory(size);
  (inventory || []).filter(Boolean).forEach((item) => {
    addItem({ inventory: compact }, normalizeStackItem(item));
  });
  return compact;
}

export function sortInventoryByTier(player) {
  const inventorySize = player.inventory.length;
  const compact = player.inventory.filter(Boolean).sort(compareInventoryItems);
  player.inventory = [
    ...compact,
    ...Array.from({ length: Math.max(0, inventorySize - compact.length) }, () => null)
  ].slice(0, inventorySize);
}

export function removeItemUnits(inventory, index, amount = 1) {
  const item = inventory?.[index];
  if (!item) return null;
  const quantity = itemQuantity(item);
  const removed = Math.max(1, Math.min(quantity, Math.floor(Number(amount) || 1)));
  if (quantity <= removed) {
    inventory[index] = null;
  } else {
    item.quantity = quantity - removed;
  }
  return normalizeStackItem(item, removed);
}

function getCraftUnitRefs(player, item) {
  return player.inventory.flatMap((candidate, index) => {
    if (!isCraftMatch(candidate, item) || candidate.favorite) return [];
    return Array.from({ length: itemQuantity(candidate) }, () => ({ index }));
  });
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

function consumeCraftUnits(inventory, units) {
  const byIndex = new Map();
  units.forEach((unit) => {
    byIndex.set(unit.index, (byIndex.get(unit.index) || 0) + 1);
  });
  byIndex.forEach((amount, index) => {
    removeItemUnits(inventory, index, amount);
  });
}

function placeCraftResult(player, preferredIndex, item) {
  if (Number.isInteger(preferredIndex) && preferredIndex >= 0 && preferredIndex < player.inventory.length && !player.inventory[preferredIndex]) {
    player.inventory[preferredIndex] = item;
    return true;
  }
  return addItem(player, item);
}

function bestItem(items, slot, used) {
  const candidates = items
    .filter((item) => item?.slot === slot && !used.has(item.uid))
    .sort((a, b) => itemPower(b) - itemPower(a) || (b.tier || 0) - (a.tier || 0));
  const best = candidates[0] || null;
  if (best) used.add(best.uid);
  return best;
}

function expandStackUnits(inventory) {
  return (inventory || []).flatMap((item) => {
    if (!item) return [];
    return Array.from({ length: itemQuantity(item) }, () => singleItemFromStack(item));
  });
}

function compareInventoryItems(a, b) {
  const groupDiff = inventorySortGroup(a) - inventorySortGroup(b);
  if (groupDiff) return groupDiff;
  const slotDiff = inventorySlotOrder(a) - inventorySlotOrder(b);
  if (slotDiff) return slotDiff;
  const tierDiff = Number(b.tier || 0) - Number(a.tier || 0);
  if (tierDiff) return tierDiff;
  const rarityDiff = RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
  if (rarityDiff) return rarityDiff;
  const powerDiff = itemPower(b) - itemPower(a);
  if (powerDiff) return powerDiff;
  return String(a.name || "").localeCompare(String(b.name || ""));
}

function stackCapacityFor(inventory, item) {
  return inventory.reduce((sum, cell) => {
    if (!cell) return sum + ITEM_STACK_LIMIT;
    if (!canStackItems(cell, item)) return sum;
    return sum + Math.max(0, ITEM_STACK_LIMIT - itemQuantity(cell));
  }, 0);
}

function canStackItems(target, incoming) {
  if (!target || !incoming) return false;
  if (Boolean(target.favorite) !== Boolean(incoming.favorite)) return false;
  if (stackKey(target) !== stackKey(incoming)) return false;
  return itemQuantity(target) < ITEM_STACK_LIMIT;
}

function stackKey(item) {
  if (!item) return "";
  if (item.slot === "drug") return `drug:${item.drugId || item.id}`;
  return `${item.slot || ""}:${item.id || ""}:${item.rarity || ""}:${Number(item.tier || 0)}`;
}

function normalizeStackItem(item, quantity = itemQuantity(item), options = {}) {
  const next = structuredClone(item);
  next.quantity = Math.max(1, Math.floor(Number(quantity) || 1));
  if (!next.uid || options.freshUid) next.uid = `${next.id || next.drugId || "item"}-${Date.now().toString(36)}-${uidCounter++}`;
  return next;
}

function singleItemFromStack(item) {
  const next = normalizeStackItem(item, 1);
  if (itemQuantity(item) > 1) next.uid = `${next.id || next.drugId || "item"}-${Date.now().toString(36)}-${uidCounter++}`;
  return next;
}

function inventorySortGroup(item) {
  return isUseOrUtilityItem(item) ? 0 : 1;
}

function inventorySlotOrder(item) {
  return INVENTORY_SLOT_ORDER[item?.slot] ?? 99;
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
