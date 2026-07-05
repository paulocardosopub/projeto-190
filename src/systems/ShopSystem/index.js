import {
  getItemConfigById,
  getShopTierForHighestMap,
  itemsConfig,
  npcShopConfig
} from "../../data/balance/index.js";
import { addItem, createItem } from "../InventorySystem/index.js?v=stack-1";

export function ensureReceptadorStock(state, force = false) {
  const shop = state.player.receptadorShop ||= {};
  const highestMapUnlocked = state.player.highestMapUnlocked || 1;
  const shopTier = getShopTierForHighestMap(highestMapUnlocked);
  const windowKey = currentShopWindowKey();

  if (
    force ||
    shop.windowKey !== windowKey ||
    shop.shopTier !== shopTier ||
    !Array.isArray(shop.stock)
  ) {
    shop.windowKey = windowKey;
    shop.shopTier = shopTier;
    shop.manualRefreshCounter ||= 0;
    shop.stock = generateStock(highestMapUnlocked, `${windowKey}:${shopTier}:${shop.manualRefreshCounter}`);
  }

  return shop;
}

export function buyReceptadorOffer(state, offerIndex) {
  const shop = ensureReceptadorStock(state);
  const offer = shop.stock[offerIndex];
  if (!offer || offer.sold) return { ok: false, reason: "Oferta indisponivel." };

  const base = getItemConfigById(offer.baseId);
  if (!base) return { ok: false, reason: "Item da oferta nao existe." };
  if (state.player.money < base.precoNPCVende) return { ok: false, reason: "Moedas insuficientes." };

  const item = createItem(base.id);
  if (!addItem(state.player, item)) return { ok: false, reason: "Inventario cheio." };

  state.player.money -= base.precoNPCVende;
  offer.sold = true;
  return {
    ok: true,
    item,
    value: base.precoNPCVende,
    message: `${base.name} comprado por R$ ${base.precoNPCVende}.`
  };
}

export function refreshReceptadorStock(state, paid = false) {
  const shopTier = getShopTierForHighestMap(state.player.highestMapUnlocked || 1);
  const cost = npcShopConfig.manualRefreshCostByMapTier[shopTier] || 0;
  if (paid) {
    if (state.player.money < cost) return { ok: false, reason: "Moedas insuficientes para renovar a loja." };
    state.player.money -= cost;
  }
  const shop = state.player.receptadorShop ||= {};
  shop.manualRefreshCounter = (shop.manualRefreshCounter || 0) + 1;
  ensureReceptadorStock(state, true);
  return {
    ok: true,
    value: paid ? cost : 0,
    message: paid ? `Estoque renovado por R$ ${cost}.` : "Estoque renovado."
  };
}

export function getReceptadorRefreshCost(state) {
  const shopTier = getShopTierForHighestMap(state.player.highestMapUnlocked || 1);
  return npcShopConfig.manualRefreshCostByMapTier[shopTier] || 0;
}

export function getReceptadorRefreshSecondsLeft() {
  const elapsed = Date.now() % npcShopConfig.refreshMs;
  return Math.ceil((npcShopConfig.refreshMs - elapsed) / 1000);
}

function generateStock(highestMapUnlocked, seedText) {
  const shopTier = getShopTierForHighestMap(highestMapUnlocked);
  const rng = mulberry32(hashString(seedText));
  const count = npcShopConfig.offersByMapTier[shopTier] || 3;
  const stock = [];
  const usedBaseIds = new Set();

  for (let index = 0; index < count; index += 1) {
    let base = null;
    for (let attempt = 0; attempt < 16 && !base; attempt += 1) {
      const slot = rollWeighted(npcShopConfig.slotWeights, rng);
      const rarity = rollWeighted(npcShopConfig.rarityChanceByMapTier[shopTier], rng);
      const allowed = npcShopConfig.poolByMapTier[shopTier].find((entry) => entry.rarity === rarity);
      const tier = allowed?.tiers[Math.floor(rng() * allowed.tiers.length)];
      const candidates = itemsConfig.filter((item) => (
        item.slot === slot &&
        item.rarity === rarity &&
        item.tier === tier &&
        item.rarity !== "lendario" &&
        item.rarity !== "mestre" &&
        !(item.rarity === "epico" && highestMapUnlocked < 19) &&
        !usedBaseIds.has(item.id)
      ));
      base = candidates[Math.floor(rng() * candidates.length)] || null;
    }

    if (base) {
      usedBaseIds.add(base.id);
      stock.push({
        id: `${seedText}:${index}:${base.id}`,
        baseId: base.id,
        sold: false
      });
    }
  }

  return stock;
}

function currentShopWindowKey() {
  return Math.floor(Date.now() / npcShopConfig.refreshMs);
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

function hashString(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function nextRandom() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
