import {
  BUSINESS_CONFIG,
  BUSINESS_MAP_ID,
  BUSINESS_UNLOCK_LEVEL,
  SELLABLE_BUSINESS_PRODUCTS,
  businessProductConfig
} from "../../data/business/index.js";
import { createDrugInventoryItem, isDrugInventoryItem } from "../DrugSystem/index.js?v=stack-1";
import { addItem, itemQuantity, removeItemUnits } from "../InventorySystem/index.js?v=stack-1";
import { adjustBusinessStock, normalizeBusinessState, stockAmount } from "../BusinessSystem/index.js";

const REGISTRY_VERSION = 1;

export function normalizePlayerShopState(state, now = Date.now()) {
  if (!state) return null;
  state.playerShops ||= {};
  const registry = state.playerShops;
  registry.version = REGISTRY_VERSION;
  registry.nextId = Math.max(1, Math.floor(Number(registry.nextId || 1)));
  registry.shops = Array.isArray(registry.shops) ? registry.shops.map((shop) => normalizeShop(shop, now)).filter(Boolean) : [];
  registry.saleLogs = Array.isArray(registry.saleLogs) ? registry.saleLogs.slice(-30) : [];
  registry.pendingPayouts ||= {};

  if (state.player) {
    normalizeBusinessState(state.player, now);
    claimShopPayouts(state, state.player.playerId);
    const active = getPlayerActiveShop(state, state.player.playerId);
    state.player.activeShopId = active?.shopId || null;
  }

  return registry;
}

export function syncOnlinePlayerShops(state, shops = [], now = Date.now()) {
  const registry = normalizePlayerShopState(state, now);
  if (!registry) return [];

  const localOwnerId = String(state?.player?.playerId || "local-player");
  const localShops = (registry.shops || []).filter((shop) => shop.ownerPlayerId === localOwnerId);
  const retainedRemoteById = new Map(
    (registry.shops || [])
      .filter((shop) => shop.ownerPlayerId !== localOwnerId && shop.active)
      .map((shop) => [shop.shopId, shop])
  );
  const localShopIds = new Set(localShops.map((shop) => shop.shopId));
  const usedSlots = new Set(
    localShops
      .filter((shop) => shop.active)
      .map((shop) => shop.npcSlotId)
      .filter(Boolean)
  );
  const slotIds = BUSINESS_CONFIG.shopSlots.map((slot) => slot.id);
  const remoteShops = [];
  const remoteShopIds = new Set();
  const incomingShops = (Array.isArray(shops) ? shops : [])
    .map((shop) => normalizeShop({
      ...shop,
      active: true,
      remoteOnline: shop.remoteOnline !== false,
      remoteLastSeen: now
    }, now))
    .filter((shop) => shop?.active);
  const nextFreeSlot = (preferredSlot) => {
    if (slotIds.includes(preferredSlot) && !usedSlots.has(preferredSlot)) return preferredSlot;
    return slotIds.find((slotId) => !usedSlots.has(slotId));
  };

  incomingShops.forEach((normalized) => {
    if (normalized.ownerPlayerId !== localOwnerId) return;
    const local = localShops.find((shop) => shop.shopId === normalized.shopId);
    if (!local) return;
    Object.assign(local, mergeRemoteShopSnapshot(local, normalized, now), {
      npcSlotId: local.npcSlotId || normalized.npcSlotId,
      remoteOnline: false,
      remoteLastSeen: now
    });
  });

  incomingShops.forEach((normalized) => {
    if (!normalized.ownerPlayerId || normalized.ownerPlayerId === localOwnerId) return;
    if (localShopIds.has(normalized.shopId) || remoteShopIds.has(normalized.shopId)) return;

    const previous = retainedRemoteById.get(normalized.shopId);
    const merged = previous ? mergeRemoteShopSnapshot(previous, normalized, now) : normalized;
    if (!merged.active) return;

    const preferredSlot = nextFreeSlot(merged.npcSlotId || normalized.npcSlotId);
    if (!preferredSlot) return;

    merged.npcSlotId = preferredSlot;
    merged.remoteOnline = normalized.remoteOnline;
    merged.remoteLastSeen = now;
    usedSlots.add(preferredSlot);
    remoteShopIds.add(merged.shopId);
    retainedRemoteById.delete(merged.shopId);
    remoteShops.push(merged);
  });

  retainedRemoteById.forEach((shop) => {
    if (!shop.active || remoteShopIds.has(shop.shopId)) return;
    const preferredSlot = nextFreeSlot(shop.npcSlotId);
    if (!preferredSlot) return;
    shop.npcSlotId = preferredSlot;
    shop.remoteOnline = false;
    usedSlots.add(preferredSlot);
    remoteShopIds.add(shop.shopId);
    remoteShops.push(shop);
  });

  registry.shops = [...localShops, ...remoteShops];
  return remoteShops;
}

function mergeRemoteShopSnapshot(previous, incoming, now) {
  const previousListings = new Map((previous.listings || []).map((listing) => [listing.drugType, listing]));
  const listings = (incoming.listings || []).map((listing) => {
    const prior = previousListings.get(listing.drugType);
    if (!prior) return listing;
    const quantity = Math.min(Math.max(0, prior.quantity), Math.max(0, listing.quantity));
    const originalQuantity = Math.max(quantity, prior.originalQuantity || 0, listing.originalQuantity || 0);
    const reservedStock = Math.min(quantity, Math.max(0, Math.min(prior.reservedStock ?? quantity, listing.reservedStock ?? quantity)));
    const reservedInventory = Math.min(
      quantity - reservedStock,
      Math.max(0, Math.min(prior.reservedInventory ?? quantity, listing.reservedInventory ?? quantity))
    );
    return {
      ...listing,
      quantity,
      originalQuantity,
      soldQuantity: Math.max(prior.soldQuantity || 0, listing.soldQuantity || 0, originalQuantity - quantity),
      reservedStock,
      reservedInventory
    };
  }).filter((listing) => listing.quantity > 0);

  return {
    ...incoming,
    listings,
    active: Boolean(incoming.active) && listings.length > 0,
    grossSales: Math.max(safeMoney(previous.grossSales), safeMoney(incoming.grossSales)),
    sellerRevenue: Math.max(safeMoney(previous.sellerRevenue), safeMoney(incoming.sellerRevenue)),
    salesCount: Math.max(
      Math.max(0, Math.floor(Number(previous.salesCount || 0))),
      Math.max(0, Math.floor(Number(incoming.salesCount || 0)))
    ),
    updatedAt: Math.max(safeTimestamp(previous.updatedAt, now), safeTimestamp(incoming.updatedAt, now))
  };
}

export function createShop(state, playerId, shopName, listings, now = Date.now()) {
  const registry = normalizePlayerShopState(state, now);
  const player = state.player;
  normalizeBusinessState(player, now);
  const ownerPlayerId = String(playerId || player.playerId || "local-player");

  if (playerLevel(player) < BUSINESS_UNLOCK_LEVEL) {
    return { ok: false, reason: playerShopLockedMessage() };
  }

  if (getPlayerActiveShop(state, ownerPlayerId)) {
    return { ok: false, reason: "Fecha a lojinha atual primeiro." };
  }

  const nameResult = sanitizeShopName(shopName);
  if (!nameResult.ok) return nameResult;

  const slot = firstFreeShopSlot(registry);
  if (!slot) return { ok: false, reason: BUSINESS_CONFIG.messages.noShopSlot };

  const listingResult = normalizeRequestedListings(player, listings);
  if (!listingResult.ok) return listingResult;

  const inventoryReservations = [];
  for (const listing of listingResult.listings) {
    if (listing.reservedInventory <= 0) continue;
    const removed = removeDrugUnitsFromInventory(player, listing.drugType, listing.reservedInventory);
    if (!removed.ok) {
      inventoryReservations.forEach((reserved) => restoreDrugUnitsToInventory(player, reserved.drugType, reserved.quantity));
      return removed;
    }
    inventoryReservations.push({ drugType: listing.drugType, quantity: listing.reservedInventory });
  }

  const stockReservations = [];
  for (const listing of listingResult.listings) {
    if (listing.reservedStock <= 0) continue;
    if (!adjustBusinessStock(player, listing.drugType, -listing.reservedStock)) {
      stockReservations.forEach((reserved) => adjustBusinessStock(player, reserved.drugType, reserved.quantity));
      inventoryReservations.forEach((reserved) => restoreDrugUnitsToInventory(player, reserved.drugType, reserved.quantity));
      return { ok: false, reason: BUSINESS_CONFIG.messages.missingStock };
    }
    stockReservations.push({ drugType: listing.drugType, quantity: listing.reservedStock });
  }

  const shopId = `shop-${ownerPlayerId}-${now.toString(36)}-${registry.nextId++}`;
  const shop = {
    shopId,
    ownerPlayerId,
    ownerName: player.displayName || player.username || "Jogador",
    shopName: nameResult.value,
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    active: true,
    npcSlotId: slot.id,
    listings: listingResult.listings,
    grossSales: 0,
    sellerRevenue: 0,
    salesCount: 0
  };

  registry.shops.push(shop);
  player.activeShopId = shop.shopId;
  pushSaleLog(registry, {
    type: "shop-created",
    shopId,
    ownerPlayerId,
    at: now
  });

  syncShopNpcsForBusinessMap(state);
  return { ok: true, shop, message: BUSINESS_CONFIG.messages.shopCreated };
}

export function closeShop(state, playerId, now = Date.now()) {
  const registry = normalizePlayerShopState(state, now);
  const player = state.player;
  normalizeBusinessState(player, now);
  const ownerPlayerId = String(playerId || player.playerId || "local-player");
  const shop = getPlayerActiveShop(state, ownerPlayerId);
  if (!shop) return { ok: false, reason: "Nenhuma lojinha ativa." };

  closeShopRecord(registry, shop, "owner", now);
  if (shop.ownerPlayerId === ownerPlayerId) {
    shop.listings.forEach((listing) => {
      returnReservedListingUnits(player, listing);
    });
    player.activeShopId = null;
  }

  pushSaleLog(registry, {
    type: "shop-closed",
    shopId: shop.shopId,
    ownerPlayerId,
    at: now
  });

  syncShopNpcsForBusinessMap(state);
  return { ok: true, shop, message: BUSINESS_CONFIG.messages.shopClosed };
}

export function buyFromShop(state, buyerId, shopId, drugType, quantity, now = Date.now()) {
  const registry = normalizePlayerShopState(state, now);
  const buyer = state.player;
  normalizeBusinessState(buyer, now);
  const cleanBuyerId = String(buyerId || buyer.playerId || "local-player");
  if (playerLevel(buyer) < BUSINESS_UNLOCK_LEVEL) {
    return { ok: false, reason: playerShopLockedMessage() };
  }
  const shop = registry.shops.find((candidate) => candidate.shopId === shopId);
  if (!shop || !shop.active) return { ok: false, reason: "Loja indisponivel." };
  if (shop.ownerPlayerId === cleanBuyerId) return { ok: false, reason: BUSINESS_CONFIG.messages.ownShop };

  const listing = shop.listings.find((candidate) => candidate.drugType === drugType);
  const amount = Math.floor(Number(quantity || 0));
  if (!listing || amount <= 0 || listing.quantity < amount) return { ok: false, reason: "Estoque indisponivel." };

  const total = safeMoney(listing.pricePerUnit) * amount;
  if (total <= 0 || safeMoney(buyer.money) < total) return { ok: false, reason: "Dinheiro insuficiente." };

  const itemResult = addDrugUnitsToInventoryPreview(buyer, drugType, amount);
  if (!itemResult.ok) return itemResult;

  buyer.money = safeMoney(buyer.money) - total;
  buyer.inventory = itemResult.inventory;
  listing.quantity -= amount;
  consumeListingReservation(listing, amount);
  listing.soldQuantity += amount;
  shop.grossSales += total;
  const sellerGets = Math.floor(total * (1 - BUSINESS_CONFIG.saleTaxRate));
  shop.sellerRevenue += sellerGets;
  shop.salesCount += amount;
  shop.updatedAt = now;
  registry.pendingPayouts[shop.ownerPlayerId] = safeMoney(registry.pendingPayouts[shop.ownerPlayerId]) + sellerGets;

  pushSaleLog(registry, {
    type: "shop-sale",
    shopId: shop.shopId,
    ownerPlayerId: shop.ownerPlayerId,
    buyerPlayerId: cleanBuyerId,
    drugType,
    quantity: amount,
    total,
    sellerGets,
    at: now
  });

  if (shop.listings.every((entry) => entry.quantity <= 0)) {
    closeShopRecord(registry, shop, "sold-out", now);
  }

  claimShopPayouts(state, buyer.playerId);
  syncShopNpcsForBusinessMap(state);
  return {
    ok: true,
    shop,
    total,
    sellerGets,
    message: BUSINESS_CONFIG.messages.purchaseDone
  };
}

export function getActiveShops(state) {
  const registry = normalizePlayerShopState(state);
  return registry.shops.filter((shop) => shop.active);
}

export function getShopById(state, shopId) {
  const registry = normalizePlayerShopState(state);
  return registry.shops.find((shop) => shop.shopId === shopId) || null;
}

export function getPlayerActiveShop(state, playerId) {
  if (!state?.playerShops) return null;
  const ownerPlayerId = String(playerId || state.player?.playerId || "local-player");
  return (state.playerShops.shops || []).find((shop) => shop.active && shop.ownerPlayerId === ownerPlayerId) || null;
}

export function claimShopPayouts(state, playerId) {
  const registry = state?.playerShops;
  if (!registry?.pendingPayouts || !state?.player) return 0;
  const key = String(playerId || state.player.playerId || "local-player");
  const amount = safeMoney(registry.pendingPayouts[key]);
  if (amount <= 0) return 0;
  state.player.money = safeMoney(state.player.money) + amount;
  delete registry.pendingPayouts[key];
  return amount;
}

export function syncShopNpcsForBusinessMap(state) {
  if (state?.scene !== "idle" || state.currentMapId !== BUSINESS_MAP_ID || !state.run) return [];
  const baseNpcs = (state.run.npcs || []).filter((npc) => npc.role !== "player_shop");
  const shopNpcs = getActiveShops(state).map(shopNpcForShop).filter(Boolean);
  state.run.npcs = [...baseNpcs, ...shopNpcs];
  return shopNpcs;
}

export function shopNpcForShop(shop) {
  if (!shop?.active) return null;
  const slot = BUSINESS_CONFIG.shopSlots.find((candidate) => candidate.id === shop.npcSlotId);
  if (!slot) return null;
  return {
    id: `player-shop-${shop.shopId}`,
    name: shop.shopName,
    shopName: shop.shopName,
    role: "player_shop",
    shopId: shop.shopId,
    ownerPlayerId: shop.ownerPlayerId,
    ownerName: shop.ownerName,
    sheet: "enemies3",
    row: 2,
    columnOffset: 0,
    heightScale: 0.96,
    x: slot.x,
    direction: "front",
    greeting: shop.shopName
  };
}

export function sanitizeShopName(name) {
  const value = String(name || "")
    .replace(/[^\p{L}\p{N} _.-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
  const length = [...value].length;
  if (!value || length < 3) return { ok: false, reason: "Nome da loja precisa ter pelo menos 3 caracteres." };
  if (length > 24) return { ok: false, reason: "Nome da loja pode ter no maximo 24 caracteres." };
  return { ok: true, value };
}

function normalizeRequestedListings(player, listings) {
  const byType = new Map();
  (Array.isArray(listings) ? listings : []).forEach((entry) => {
    const drugType = String(entry?.drugType || "");
    if (!SELLABLE_BUSINESS_PRODUCTS.includes(drugType)) return;
    const product = businessProductConfig(drugType);
    const quantity = Math.floor(Number(entry.quantity || 0));
    const pricePerUnit = Math.floor(Number(entry.pricePerUnit || 0));
    if (quantity <= 0) return;
    const current = byType.get(drugType) || {
      drugType,
      quantity: 0,
      pricePerUnit,
      suggestedPrice: product.suggestedPrice,
      soldQuantity: 0,
      originalQuantity: 0,
      reservedStock: 0,
      reservedInventory: 0
    };
    current.quantity += quantity;
    current.originalQuantity += quantity;
    current.pricePerUnit = pricePerUnit;
    byType.set(drugType, current);
  });

  const normalized = [...byType.values()];
  if (!normalized.length) return { ok: false, reason: BUSINESS_CONFIG.messages.missingStock };

  for (const listing of normalized) {
    const product = businessProductConfig(listing.drugType);
    if (!product || product.internal) return { ok: false, reason: "Produto nao pode ser vendido." };
    if (listing.pricePerUnit < product.minPrice || listing.pricePerUnit > product.maxPrice) {
      return { ok: false, reason: BUSINESS_CONFIG.messages.invalidPrice };
    }
    const stockAvailable = stockAmount(player, listing.drugType);
    const inventoryAvailable = inventoryDrugAmount(player, listing.drugType);
    if (listing.quantity > stockAvailable + inventoryAvailable) {
      return { ok: false, reason: BUSINESS_CONFIG.messages.missingStock };
    }
    listing.reservedStock = Math.min(listing.quantity, stockAvailable);
    listing.reservedInventory = listing.quantity - listing.reservedStock;
  }

  return { ok: true, listings: normalized };
}

function firstFreeShopSlot(registry) {
  const used = new Set((registry.shops || []).filter((shop) => shop.active).map((shop) => shop.npcSlotId));
  return BUSINESS_CONFIG.shopSlots
    .slice(0, BUSINESS_CONFIG.maxActiveShops)
    .find((slot) => !used.has(slot.id)) || null;
}

function closeShopRecord(registry, shop, reason, now) {
  shop.active = false;
  shop.closedAt = now;
  shop.closeReason = reason;
  shop.updatedAt = now;
}

function normalizeShop(shop, now) {
  if (!shop?.shopId) return null;
  const listings = Array.isArray(shop.listings) ? shop.listings.map(normalizeListing).filter(Boolean) : [];
  return {
    shopId: String(shop.shopId),
    ownerPlayerId: String(shop.ownerPlayerId || ""),
    ownerName: String(shop.ownerName || "Jogador"),
    shopName: sanitizeShopName(shop.shopName).value || "Lojinha",
    createdAt: safeTimestamp(shop.createdAt, now),
    updatedAt: safeTimestamp(shop.updatedAt || shop.createdAt, now),
    closedAt: shop.closedAt ? safeTimestamp(shop.closedAt, now) : null,
    active: Boolean(shop.active) && listings.some((listing) => listing.quantity > 0),
    npcSlotId: String(shop.npcSlotId || ""),
    listings,
    grossSales: safeMoney(shop.grossSales),
    sellerRevenue: safeMoney(shop.sellerRevenue),
    salesCount: Math.max(0, Math.floor(Number(shop.salesCount || 0))),
    closeReason: shop.closeReason || null,
    remoteOnline: Boolean(shop.remoteOnline),
    remoteLastSeen: shop.remoteLastSeen ? safeTimestamp(shop.remoteLastSeen, now) : null
  };
}

function normalizeListing(listing) {
  const drugType = String(listing?.drugType || "");
  const product = businessProductConfig(drugType);
  if (!product || product.internal) return null;
  const quantity = Math.max(0, Math.floor(Number(listing.quantity || 0)));
  const originalQuantity = Math.max(quantity, Math.floor(Number(listing.originalQuantity || listing.quantity || 0)));
  const pricePerUnit = Math.max(0, Math.floor(Number(listing.pricePerUnit || product.suggestedPrice || 0)));
  const reservedStock = Math.max(0, Math.floor(Number(listing.reservedStock ?? quantity)));
  const reservedInventory = Math.max(0, Math.floor(Number(listing.reservedInventory || 0)));
  const reservedTotal = reservedStock + reservedInventory;
  const normalizedReservedStock = reservedTotal > quantity ? Math.min(quantity, reservedStock) : reservedStock;
  const normalizedReservedInventory = Math.max(0, Math.min(quantity - normalizedReservedStock, reservedInventory));
  return {
    drugType,
    quantity,
    pricePerUnit,
    suggestedPrice: product.suggestedPrice,
    originalQuantity,
    soldQuantity: Math.max(0, Math.floor(Number(listing.soldQuantity || originalQuantity - quantity || 0))),
    reservedStock: normalizedReservedStock,
    reservedInventory: normalizedReservedInventory
  };
}

function addDrugUnitsToInventoryPreview(player, drugType, quantity) {
  const product = businessProductConfig(drugType);
  if (!product?.inventoryDrugId) return { ok: false, reason: "Produto nao pode ir para mochila." };
  const preview = structuredClone(player);
  preview.inventory = structuredClone(player.inventory || []);
  const item = createDrugInventoryItem(product.inventoryDrugId);
  if (!item) return { ok: false, reason: "Item nao encontrado." };
  item.quantity = quantity;
  if (!addItem(preview, item)) return { ok: false, reason: "Mochila cheia." };
  return { ok: true, inventory: preview.inventory };
}

function inventoryDrugAmount(player, drugType) {
  const drugId = businessProductConfig(drugType)?.inventoryDrugId;
  if (!drugId) return 0;
  return (player.inventory || [])
    .filter((item) => isDrugInventoryItem(item) && drugItemId(item) === drugId)
    .reduce((sum, item) => sum + itemQuantity(item), 0);
}

function removeDrugUnitsFromInventory(player, drugType, quantity) {
  const drugId = businessProductConfig(drugType)?.inventoryDrugId;
  let remaining = Math.max(0, Math.floor(Number(quantity || 0)));
  let removed = 0;
  if (!drugId || remaining <= 0) return { ok: remaining <= 0, reason: BUSINESS_CONFIG.messages.missingStock };

  for (let index = 0; index < (player.inventory || []).length && remaining > 0; index += 1) {
    const item = player.inventory[index];
    if (!isDrugInventoryItem(item) || drugItemId(item) !== drugId) continue;
    const amount = Math.min(remaining, itemQuantity(item));
    removeItemUnits(player.inventory, index, amount);
    remaining -= amount;
    removed += amount;
  }

  if (remaining > 0) {
    if (removed > 0) restoreDrugUnitsToInventory(player, drugType, removed);
    return { ok: false, reason: BUSINESS_CONFIG.messages.missingStock };
  }
  return { ok: true };
}

function restoreDrugUnitsToInventory(player, drugType, quantity) {
  const product = businessProductConfig(drugType);
  const amount = Math.max(0, Math.floor(Number(quantity || 0)));
  if (!product?.inventoryDrugId || amount <= 0) return true;
  const item = createDrugInventoryItem(product.inventoryDrugId);
  if (!item) return false;
  item.quantity = amount;
  return addItem(player, item);
}

function returnReservedListingUnits(player, listing) {
  const stockAmountToReturn = Math.max(0, Math.floor(Number(listing.reservedStock || 0)));
  const inventoryAmountToReturn = Math.max(0, Math.floor(Number(listing.reservedInventory || 0)));
  if (stockAmountToReturn > 0) adjustBusinessStock(player, listing.drugType, stockAmountToReturn);
  if (inventoryAmountToReturn <= 0) return;
  if (!restoreDrugUnitsToInventory(player, listing.drugType, inventoryAmountToReturn)) {
    adjustBusinessStock(player, listing.drugType, inventoryAmountToReturn);
  }
}

function consumeListingReservation(listing, quantity) {
  let remaining = Math.max(0, Math.floor(Number(quantity || 0)));
  const stock = Math.min(Math.max(0, Math.floor(Number(listing.reservedStock || 0))), remaining);
  listing.reservedStock = Math.max(0, Math.floor(Number(listing.reservedStock || 0)) - stock);
  remaining -= stock;
  const inventory = Math.min(Math.max(0, Math.floor(Number(listing.reservedInventory || 0))), remaining);
  listing.reservedInventory = Math.max(0, Math.floor(Number(listing.reservedInventory || 0)) - inventory);
}

function drugItemId(item) {
  return item?.drugId || String(item?.id || "").replace(/^drug-/, "");
}

function pushSaleLog(registry, entry) {
  registry.saleLogs ||= [];
  registry.saleLogs.push(entry);
  registry.saleLogs = registry.saleLogs.slice(-30);
}

function safeTimestamp(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function safeMoney(value) {
  const number = Math.floor(Number(value || 0));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function playerLevel(player) {
  return Math.max(1, Math.floor(Number(player?.level || player?.nivelJogador || 1)));
}

function playerShopLockedMessage() {
  return `Negocios e drogas de jogadores liberam no nivel ${BUSINESS_UNLOCK_LEVEL}.`;
}
