import {
  BUSINESS_CONFIG,
  BUSINESS_PRODUCT_ORDER,
  FARM_PRODUCT_TYPES,
  LAB_PRODUCT_TYPES,
  businessLevelConfig,
  businessProductConfig,
  businessSourceProducts
} from "../../data/business/index.js";

const STOCK_KEYS = BUSINESS_PRODUCT_ORDER;
const PRODUCTION_KEYS = {
  farm: "activeFarmProduction",
  lab: "activeLabProduction"
};

export function normalizeBusinessState(player, now = Date.now()) {
  if (!player) return null;

  player.hasFarm = Boolean(player.hasFarm);
  player.farmLevel = player.hasFarm ? clampLevel(player.farmLevel || 1, "farm") : 0;
  player.hasLab = Boolean(player.hasLab);
  player.labLevel = player.hasLab ? clampLevel(player.labLevel || 1, "lab") : 0;
  player.businessStock = normalizeBusinessStock(player.businessStock);
  player.activeFarmProduction = normalizeProduction(player.activeFarmProduction, "farm", player, now);
  player.activeLabProduction = normalizeProduction(player.activeLabProduction, "lab", player, now);
  player.activeShopId ??= null;

  return player;
}

export function buyFarm(player, now = Date.now()) {
  normalizeBusinessState(player, now);
  if (player.hasFarm) return { ok: false, reason: "Fazenda ja comprada." };
  const cost = BUSINESS_CONFIG.farmLevels[1].cost;
  if (!spendMoney(player, cost)) return { ok: false, reason: BUSINESS_CONFIG.messages.noMoneyProperty };
  player.hasFarm = true;
  player.farmLevel = 1;
  return { ok: true, message: `Fazenda comprada por ${formatMoney(cost)}.` };
}

export function buyLab(player, now = Date.now()) {
  normalizeBusinessState(player, now);
  if (player.hasLab) return { ok: false, reason: "Laboratorio ja comprado." };
  const cost = BUSINESS_CONFIG.labLevels[1].cost;
  if (!spendMoney(player, cost)) return { ok: false, reason: BUSINESS_CONFIG.messages.noMoneyProperty };
  player.hasLab = true;
  player.labLevel = 1;
  return { ok: true, message: `Laboratorio comprado por ${formatMoney(cost)}.` };
}

export function upgradeFarm(player, now = Date.now()) {
  normalizeBusinessState(player, now);
  calculateProduction(player, now);
  if (!player.hasFarm) return { ok: false, reason: BUSINESS_CONFIG.messages.missingStructure };
  const nextLevel = Number(player.farmLevel || 0) + 1;
  const config = BUSINESS_CONFIG.farmLevels[nextLevel];
  if (!config) return { ok: false, reason: "Fazenda ja esta no nivel maximo." };
  if (!spendMoney(player, config.cost)) return { ok: false, reason: BUSINESS_CONFIG.messages.noMoneyUpgrade };
  player.farmLevel = nextLevel;
  return { ok: true, message: `Fazenda evoluiu para nivel ${nextLevel}.` };
}

export function upgradeLab(player, now = Date.now()) {
  normalizeBusinessState(player, now);
  calculateProduction(player, now);
  if (!player.hasLab) return { ok: false, reason: BUSINESS_CONFIG.messages.missingStructure };
  const nextLevel = Number(player.labLevel || 0) + 1;
  const config = BUSINESS_CONFIG.labLevels[nextLevel];
  if (!config) return { ok: false, reason: "Laboratorio ja esta no nivel maximo." };
  if (!spendMoney(player, config.cost)) return { ok: false, reason: BUSINESS_CONFIG.messages.noMoneyUpgrade };
  player.labLevel = nextLevel;
  return { ok: true, message: `Laboratorio evoluiu para nivel ${nextLevel}.` };
}

export function startFarmProduction(player, productType, now = Date.now()) {
  normalizeBusinessState(player, now);
  calculateProduction(player, now);
  if (!FARM_PRODUCT_TYPES.includes(productType)) return { ok: false, reason: "Produto invalido para fazenda." };
  const validation = validateProductionStart(player, "farm", productType);
  if (!validation.ok) return validation;
  player.activeFarmProduction = createProductionState(productType, now);
  return { ok: true, message: `${businessProductConfig(productType).label}: producao iniciada na fazenda.` };
}

export function startLabProduction(player, productType, now = Date.now()) {
  normalizeBusinessState(player, now);
  calculateProduction(player, now);
  if (!LAB_PRODUCT_TYPES.includes(productType)) return { ok: false, reason: "Produto invalido para laboratorio." };
  const validation = validateProductionStart(player, "lab", productType);
  if (!validation.ok) return validation;
  player.activeLabProduction = createProductionState(productType, now);
  return { ok: true, message: `${businessProductConfig(productType).label}: producao iniciada no laboratorio.` };
}

export function collectFarmProduction(player, now = Date.now()) {
  normalizeBusinessState(player, now);
  const result = calculateProduction(player, now);
  const total = Object.values(result.farm.produced).reduce((sum, value) => sum + value, 0);
  if (!player.activeFarmProduction?.productType) return { ok: false, reason: "A fazenda nao tem producao ativa." };
  return {
    ok: true,
    message: total > 0 ? `Fazenda coletou ${total} unidade(s).` : "Fazenda sem unidades prontas ainda."
  };
}

export function collectLabProduction(player, now = Date.now()) {
  normalizeBusinessState(player, now);
  const result = calculateProduction(player, now);
  const total = Object.values(result.lab.produced).reduce((sum, value) => sum + value, 0);
  if (!player.activeLabProduction?.productType) return { ok: false, reason: "O laboratorio nao tem producao ativa." };
  return {
    ok: true,
    message: total > 0 ? `Laboratorio coletou ${total} unidade(s).` : "Laboratorio sem unidades prontas ainda."
  };
}

export function calculateProduction(player, now = Date.now()) {
  normalizeBusinessState(player, now);
  return {
    farm: processSourceProduction(player, "farm", now),
    lab: processSourceProduction(player, "lab", now)
  };
}

export function businessStockForSource(player, source) {
  normalizeBusinessState(player);
  return businessSourceProducts(source).reduce((sum, productType) => sum + stockAmount(player, productType), 0);
}

export function businessCapacity(player, source) {
  normalizeBusinessState(player);
  const level = source === "lab" ? player.labLevel : player.farmLevel;
  return businessLevelConfig(source, level)?.capacity || 0;
}

export function businessMultiplier(player, source) {
  normalizeBusinessState(player);
  const level = source === "lab" ? player.labLevel : player.farmLevel;
  return businessLevelConfig(source, level)?.multiplier || 0;
}

export function productionRatePerHour(player, source, productType) {
  const product = businessProductConfig(productType);
  if (!product || product.source !== source) return 0;
  return Math.floor(Number(product.basePerHour || 0) * businessMultiplier(player, source));
}

export function canProduceBusinessProduct(player, source, productType) {
  normalizeBusinessState(player);
  const product = businessProductConfig(productType);
  if (!product || product.source !== source) return false;
  if (source === "farm" && !player.hasFarm) return false;
  if (source === "lab" && !player.hasLab) return false;
  if (Number(player.farmLevel || 0) < Number(product.minFarmLevel || 0)) return false;
  if (Number(player.labLevel || 0) < Number(product.minLabLevel || 0)) return false;
  return true;
}

export function stockAmount(player, productType) {
  return Math.max(0, Math.floor(Number(player?.businessStock?.[productType] || 0)));
}

export function adjustBusinessStock(player, productType, amount) {
  normalizeBusinessState(player);
  if (!STOCK_KEYS.includes(productType)) return false;
  const next = stockAmount(player, productType) + Math.floor(Number(amount || 0));
  if (next < 0) return false;
  player.businessStock[productType] = next;
  return true;
}

export function activeProductionLabel(player, source) {
  normalizeBusinessState(player);
  const active = player[PRODUCTION_KEYS[source]];
  const product = businessProductConfig(active?.productType);
  if (!product) return "Parada";
  const rate = productionRatePerHour(player, source, product.id);
  return `${product.label} (${rate}/h)`;
}

function validateProductionStart(player, source, productType) {
  const product = businessProductConfig(productType);
  if (!product) return { ok: false, reason: "Produto nao encontrado." };
  if (!canProduceBusinessProduct(player, source, productType)) {
    return { ok: false, reason: BUSINESS_CONFIG.messages.missingStructure };
  }
  if (businessStockForSource(player, source) >= businessCapacity(player, source)) {
    return { ok: false, reason: BUSINESS_CONFIG.messages.stockFull };
  }
  if (product.consumes && stockAmount(player, product.consumes.productType) < product.consumes.quantityPerUnit) {
    return { ok: false, reason: BUSINESS_CONFIG.messages.missingCocaineInput };
  }
  return { ok: true };
}

function processSourceProduction(player, source, now) {
  const active = player[PRODUCTION_KEYS[source]];
  const product = businessProductConfig(active?.productType);
  const produced = Object.fromEntries(STOCK_KEYS.map((key) => [key, 0]));
  if (!product || product.source !== source || !canProduceRaw(player, source, product)) {
    player[PRODUCTION_KEYS[source]] = null;
    return { produced, blocked: null };
  }

  const elapsedMs = Math.max(0, Number(now || Date.now()) - Number(active.lastUpdatedAt || now));
  active.lastUpdatedAt = Number(now || Date.now());
  if (!BUSINESS_CONFIG.productionContinuesOffline && elapsedMs > 65000) return { produced, blocked: "offline" };

  const capacity = capacityRaw(player, source);
  const currentStock = sourceStockRaw(player, source);
  const remainingCapacity = Math.max(0, capacity - currentStock);
  if (remainingCapacity <= 0) {
    active.accumulatedProgress = 0;
    return { produced, blocked: "stock" };
  }

  const rate = Math.floor(Number(product.basePerHour || 0) * multiplierRaw(player, source));
  const progress = Number(active.accumulatedProgress || 0) + elapsedMs / 3600000 * rate;
  let units = Math.floor(progress);
  if (units <= 0) {
    active.accumulatedProgress = Math.max(0, progress);
    return { produced, blocked: null };
  }

  let blocked = null;
  if (product.consumes) {
    const inputType = product.consumes.productType;
    const inputPerUnit = Math.max(1, Math.floor(Number(product.consumes.quantityPerUnit || 1)));
    const maxByInput = Math.floor(stockAmountRaw(player, inputType) / inputPerUnit);
    if (maxByInput <= 0) {
      active.accumulatedProgress = 0;
      return { produced, blocked: "input" };
    }
    units = Math.min(units, maxByInput);
  }

  const added = Math.max(0, Math.min(units, remainingCapacity));
  if (added <= 0) {
    active.accumulatedProgress = 0;
    return { produced, blocked: "stock" };
  }

  if (product.consumes) {
    const inputType = product.consumes.productType;
    const inputPerUnit = Math.max(1, Math.floor(Number(product.consumes.quantityPerUnit || 1)));
    player.businessStock[inputType] = Math.max(0, stockAmountRaw(player, inputType) - added * inputPerUnit);
  }
  player.businessStock[product.id] = stockAmountRaw(player, product.id) + added;
  produced[product.id] = added;
  if (added >= remainingCapacity) blocked = "stock";
  active.accumulatedProgress = blocked ? 0 : Math.max(0, progress - added);
  return { produced, blocked };
}

function normalizeBusinessStock(stock) {
  const next = {};
  STOCK_KEYS.forEach((key) => {
    const value = Math.floor(Number(stock?.[key] || 0));
    next[key] = Number.isFinite(value) && value > 0 ? value : 0;
  });
  return next;
}

function canProduceRaw(player, source, product) {
  if (!product || product.source !== source) return false;
  if (source === "farm" && !player.hasFarm) return false;
  if (source === "lab" && !player.hasLab) return false;
  if (Number(player.farmLevel || 0) < Number(product.minFarmLevel || 0)) return false;
  if (Number(player.labLevel || 0) < Number(product.minLabLevel || 0)) return false;
  return true;
}

function sourceStockRaw(player, source) {
  return businessSourceProducts(source).reduce((sum, productType) => sum + stockAmountRaw(player, productType), 0);
}

function capacityRaw(player, source) {
  const level = source === "lab" ? player.labLevel : player.farmLevel;
  return businessLevelConfig(source, level)?.capacity || 0;
}

function multiplierRaw(player, source) {
  const level = source === "lab" ? player.labLevel : player.farmLevel;
  return businessLevelConfig(source, level)?.multiplier || 0;
}

function stockAmountRaw(player, productType) {
  const value = Math.floor(Number(player?.businessStock?.[productType] || 0));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function normalizeProduction(production, source, player, now) {
  const productType = production?.productType || null;
  const product = businessProductConfig(productType);
  if (!product || product.source !== source) return null;
  if (source === "farm" && !player.hasFarm) return null;
  if (source === "lab" && !player.hasLab) return null;
  return {
    productType: product.id,
    startedAt: safeTimestamp(production.startedAt, now),
    lastUpdatedAt: safeTimestamp(production.lastUpdatedAt || production.startedAt, now),
    accumulatedProgress: Math.max(0, Number(production.accumulatedProgress || 0))
  };
}

function createProductionState(productType, now) {
  return {
    productType,
    startedAt: now,
    lastUpdatedAt: now,
    accumulatedProgress: 0
  };
}

function clampLevel(level, source) {
  const levels = source === "lab" ? BUSINESS_CONFIG.labLevels : BUSINESS_CONFIG.farmLevels;
  const max = Math.max(...Object.keys(levels).map(Number));
  const value = Math.floor(Number(level || 0));
  return Math.max(1, Math.min(max, Number.isFinite(value) ? value : 1));
}

function safeTimestamp(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function spendMoney(player, amount) {
  const value = Math.max(0, Math.floor(Number(amount || 0)));
  const current = Math.max(0, Math.floor(Number(player.money || 0)));
  if (current < value) return false;
  player.money = current - value;
  return true;
}

function formatMoney(value) {
  return `R$ ${Math.floor(Number(value || 0)).toLocaleString("pt-BR")}`;
}
