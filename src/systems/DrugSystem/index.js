export const HIDEOUT_STAMINA_RECOVERY_CONFIG = {
  restDistance: 78,
  awayPerMinute: 1,
  nearHousePerMinute: 2
};

export const DRUG_BALANCE = {
  referenceMax: 100,
  maxInventoryPerDrug: 5,
  abuseWindowMs: 120000,
  abuseUseLimit: 3,
  abuseBlockMs: 60000,
  messages: {
    dead: "Você não consegue usar isso apagado.",
    noMoney: "Tá sem grana, patrão.",
    cooldown: "Calma aí, ainda tá batendo.",
    lowHealth: "Melhor não, tu já tá quase caindo.",
    abuse: "teu corpo pediu arrego",
    bought: "Comprado e guardado na mochila.",
    used: "Usado.",
    full: "Mochila cheia.",
    limit: "Você já está carregando 5 unidades desse item."
  }
};

const DRUG_ITEM_PREFIX = "drug-";
let drugUidCounter = 1;

export const DRUG_ITEMS = [
  {
    id: "ecstasy",
    name: "Bala / Ecstasy",
    price: 35,
    staminaPercent: 20,
    hpPercent: -8,
    cooldownMs: 30000,
    minHpPercent: 10,
    risk: "Baixo/médio"
  },
  {
    id: "cocaine",
    name: "Cocaína",
    price: 75,
    staminaPercent: 45,
    hpPercent: -22,
    cooldownMs: 45000,
    minHpPercent: 25,
    risk: "Alto"
  },
  {
    id: "weed",
    name: "Maconha",
    price: 45,
    staminaPercent: -5,
    hpPercent: 25,
    cooldownMs: 30000,
    minHpPercent: 0,
    risk: "Baixo"
  }
];

export function normalizeDrugState(player, now = Date.now()) {
  player.drugState ||= {};
  player.drugState.cooldowns ||= {};
  player.drugState.useHistory = Array.isArray(player.drugState.useHistory)
    ? player.drugState.useHistory.filter((time) => now - Number(time || 0) <= DRUG_BALANCE.abuseWindowMs)
    : [];
  player.drugState.blockUntil = Number(player.drugState.blockUntil || 0);
  return player.drugState;
}

export function drugById(drugId) {
  return DRUG_ITEMS.find((drug) => drug.id === drugId) || null;
}

export function buyDrugItem(player, drugId) {
  const drug = drugById(drugId);
  if (!drug) return { ok: false, reason: "Produto não encontrado." };
  if (Number(player.money || 0) < drug.price) return { ok: false, reason: DRUG_BALANCE.messages.noMoney };
  if (drugInventoryCount(player, drugId) >= DRUG_BALANCE.maxInventoryPerDrug) {
    return { ok: false, reason: DRUG_BALANCE.messages.limit };
  }

  const inventory = Array.isArray(player.inventory) ? player.inventory : [];
  const index = inventory.findIndex((cell) => !cell);
  if (index === -1) return { ok: false, reason: DRUG_BALANCE.messages.full };

  player.money = Math.max(0, Math.floor(Number(player.money || 0)) - drug.price);
  inventory[index] = createDrugInventoryItem(drug);
  player.inventory = inventory;
  return {
    ok: true,
    drug,
    index,
    item: inventory[index],
    message: `${drug.name}: ${DRUG_BALANCE.messages.bought}`
  };
}

export function useDrugInventoryItem(player, index, stats, now = Date.now()) {
  const item = player.inventory?.[index];
  if (!isDrugInventoryItem(item)) return { ok: false, reason: "Selecione uma droga na mochila." };
  const result = applyDrugEffect(player, item.drugId, stats, now);
  if (!result.ok) return result;
  player.inventory[index] = null;
  result.item = item;
  result.inventoryIndex = index;
  return result;
}

export function buyAndUseDrug(player, drugId, stats, now = Date.now()) {
  const drug = drugById(drugId);
  if (!drug) return { ok: false, reason: "Produto não encontrado." };
  if (Number(player.money || 0) < drug.price) return { ok: false, reason: DRUG_BALANCE.messages.noMoney };
  player.money = Math.max(0, Math.floor(Number(player.money || 0)) - drug.price);
  const result = applyDrugEffect(player, drugId, stats, now);
  if (!result.ok) player.money = Math.floor(Number(player.money || 0)) + drug.price;
  return result;
}

export function applyDrugEffect(player, drugId, stats, now = Date.now()) {
  const drug = drugById(drugId);
  if (!drug) return { ok: false, reason: "Produto não encontrado." };
  const drugState = normalizeDrugState(player, now);
  const maxHp = maxHealth(stats, player);
  const maxStamina = maxStaminaFor(player);
  const currentHp = Math.max(0, Math.round(Number(player.hp || 0)));

  if (currentHp <= 0) return { ok: false, reason: DRUG_BALANCE.messages.dead };
  if (drugState.blockUntil > now) {
    return {
      ok: false,
      reason: DRUG_BALANCE.messages.abuse,
      blockLeftMs: drugState.blockUntil - now
    };
  }
  if (Number(drugState.cooldowns[drug.id] || 0) > now) {
    return {
      ok: false,
      reason: DRUG_BALANCE.messages.cooldown,
      cooldownLeftMs: Number(drugState.cooldowns[drug.id] || 0) - now
    };
  }
  if (Number(player.money || 0) < drug.price) return { ok: false, reason: DRUG_BALANCE.messages.noMoney };

  const minHp = scaledAmount(drug.minHpPercent || 0, maxHp);
  if (drug.minHpPercent > 0 && currentHp <= minHp) {
    return { ok: false, reason: DRUG_BALANCE.messages.lowHealth };
  }

  const staminaDelta = scaledAmount(drug.staminaPercent || 0, maxStamina);
  const hpDelta = scaledAmount(drug.hpPercent || 0, maxHp);
  const beforeHp = currentHp;
  const beforeStamina = Number(player.staminaAtual || 0);

  player.staminaAtual = clamp(beforeStamina + staminaDelta, 0, maxStamina);
  player.hp = Math.max(0, Math.min(maxHp, Math.round(beforeHp + hpDelta)));

  drugState.cooldowns[drug.id] = now + drug.cooldownMs;
  drugState.useHistory.push(now);
  drugState.useHistory = drugState.useHistory.filter((time) => now - Number(time || 0) <= DRUG_BALANCE.abuseWindowMs);
  const abuseTriggered = drugState.useHistory.length >= DRUG_BALANCE.abuseUseLimit;
  if (abuseTriggered) drugState.blockUntil = now + DRUG_BALANCE.abuseBlockMs;

  const died = player.hp <= 0;
  const effects = {
    hpDelta,
    staminaDelta,
    hpBefore: beforeHp,
    hpAfter: player.hp,
    staminaBefore: beforeStamina,
    staminaAfter: player.staminaAtual
  };

  return {
    ok: true,
    drug,
    effects,
    died,
    abuseTriggered,
    message: drugUseMessage(drug, effects, abuseTriggered)
  };
}

export function drugEffectText(drug, player, stats) {
  const maxHp = maxHealth(stats, player);
  const maxStamina = maxStaminaFor(player);
  const parts = [];
  const stamina = scaledAmount(drug.staminaPercent || 0, maxStamina);
  const hp = scaledAmount(drug.hpPercent || 0, maxHp);
  if (stamina) parts.push(`${signed(stamina)} stamina`);
  if (hp) parts.push(`${signed(hp)} vida`);
  return parts.join(" / ");
}

export function drugCooldownLabel(player, drugId, now = Date.now()) {
  const state = normalizeDrugState(player, now);
  if (state.blockUntil > now) return `Corpo travado: ${secondsLeft(state.blockUntil - now)}s`;
  const until = Number(state.cooldowns?.[drugId] || 0);
  if (until > now) return `Cooldown: ${secondsLeft(until - now)}s`;
  return "";
}

export function createDrugInventoryItem(drugOrId) {
  const drug = typeof drugOrId === "string" ? drugById(drugOrId) : drugOrId;
  if (!drug) return null;
  return {
    id: `${DRUG_ITEM_PREFIX}${drug.id}`,
    drugId: drug.id,
    name: drug.name,
    slot: "drug",
    slotLabel: "Droga",
    rarity: drug.id === "cocaine" ? "raro" : "incomum",
    rarityLabel: drug.id === "cocaine" ? "Raro" : "Incomum",
    tier: 1,
    price: drug.price,
    buyPrice: drug.price,
    sellPrice: 0,
    precoNPCVende: drug.price,
    precoNPCCompra: 0,
    stats: {},
    effectText: drugInventoryEffectText(drug),
    uid: `${DRUG_ITEM_PREFIX}${drug.id}-${Date.now().toString(36)}-${drugUidCounter++}`,
    favorite: false,
    contraband: true
  };
}

export function normalizeDrugInventoryItem(item) {
  if (!isDrugInventoryItem(item)) return item || null;
  const drug = drugById(item.drugId || String(item.id || "").replace(DRUG_ITEM_PREFIX, ""));
  if (!drug) return null;
  return {
    ...createDrugInventoryItem(drug),
    uid: item.uid || `${DRUG_ITEM_PREFIX}${drug.id}-${Date.now().toString(36)}-${drugUidCounter++}`,
    favorite: Boolean(item.favorite)
  };
}

export function isDrugInventoryItem(item) {
  return Boolean(item && (item.slot === "drug" || String(item.id || "").startsWith(DRUG_ITEM_PREFIX)));
}

export function drugInventoryCount(player, drugId) {
  return collectDrugContainers(player)
    .flatMap((items) => items || [])
    .filter((item) => isDrugInventoryItem(item) && (item.drugId || String(item.id).replace(DRUG_ITEM_PREFIX, "")) === drugId)
    .length;
}

export function confiscateDrugItems(player) {
  let count = 0;
  for (const items of collectDrugContainers(player)) {
    if (!Array.isArray(items)) continue;
    items.forEach((item, index) => {
      if (!isDrugInventoryItem(item)) return;
      count += 1;
      items[index] = null;
    });
  }
  return count;
}

export function drugInventoryEffectText(drugOrItem) {
  const drug = drugById(drugOrItem?.drugId || drugOrItem?.id) || drugOrItem;
  if (!drug) return "";
  const parts = [];
  if (drug.staminaPercent) parts.push(`${signed(drug.staminaPercent)}% stamina`);
  if (drug.hpPercent) parts.push(`${signed(drug.hpPercent)}% vida`);
  return parts.join(" / ");
}

function drugUseMessage(drug, effects, abuseTriggered) {
  const parts = [`${drug.name}: ${DRUG_BALANCE.messages.used}`];
  if (effects.staminaDelta) parts.push(`${signed(effects.staminaDelta)} stamina`);
  if (effects.hpDelta) parts.push(`${signed(effects.hpDelta)} vida`);
  if (abuseTriggered) parts.push(DRUG_BALANCE.messages.abuse);
  return parts.join(" | ");
}

function collectDrugContainers(player) {
  return [
    player?.inventory,
    player?.personalVault?.items
  ].filter(Boolean);
}

function maxHealth(stats, player) {
  const value = Math.round(Number(stats?.maxHp || stats?.hp || player?.hpMax || 100));
  return Number.isFinite(value) && value > 0 ? value : 100;
}

function maxStaminaFor(player) {
  const value = Math.round(Number(player?.staminaMax || 100));
  return Number.isFinite(value) && value > 0 ? value : 100;
}

function scaledAmount(percent, max) {
  const value = Math.round((Number(percent || 0) / DRUG_BALANCE.referenceMax) * max);
  if (percent > 0) return Math.max(1, value);
  if (percent < 0) return Math.min(-1, value);
  return 0;
}

function clamp(value, min, max) {
  const number = Number(value || 0);
  return Math.max(min, Math.min(max, Number.isFinite(number) ? number : min));
}

function signed(value) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function secondsLeft(ms) {
  return Math.max(1, Math.ceil(Number(ms || 0) / 1000));
}
