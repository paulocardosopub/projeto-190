import {
  getHouseConfig,
  getLandConfig,
  hideoutLandConfig,
  housesConfig,
  MOTORCYCLE_UNLOCK_LEVEL,
  motorcyclesConfig,
  getMotorcycleConfig,
  passiveIncomeConfig,
  staminaConfig
} from "../../data/balance/index.js?v=shop-sync-2";

export const HIDEOUT_REST_COOLDOWN_MS = 30 * 60 * 1000;

export function normalizeProgressionSystems(player) {
  player.staminaMax = calculateStaminaMax(player);
  player.staminaRegenPorMinuto = calculateStaminaRegenPerMinute(player);
  player.staminaAtual = Number.isFinite(player.staminaAtual)
    ? Math.min(player.staminaAtual, player.staminaMax)
    : player.staminaMax;
  player.nivelJogador = player.level || 1;
  player.ownedHouses ||= [];
  player.ownedMotorcycles = normalizeOwnedMotorcycles(player);
  player.ownedCars = [...player.ownedMotorcycles];
  player.terrenosComprados ||= [];
  player.casaAtual = player.ownedHouses.includes(player.casaAtual) ? player.casaAtual : null;
  player.motorcycleSystemUnlocked = motorcyclesUnlocked(player);
  player.equippedMotorcycleLevel = normalizeEquippedMotorcycle(player);
  player.motoAtual = player.equippedMotorcycleLevel;
  player.hasMotorcycleEquipped = Boolean(player.equippedMotorcycleLevel);
  player.carroAtual = player.equippedMotorcycleLevel;
  player.terrenoAtual = player.terrenosComprados.includes(player.terrenoAtual)
    ? player.terrenoAtual
    : player.terrenosComprados[0] || null;
  player.maiorTerrenoDesbloqueado = highestUnlockedLandTier(player);
  player.hideoutTier = player.terrenoAtual || 0;
  player.lastHideoutRestAt = Math.max(0, Number(player.lastHideoutRestAt || 0));
  player.passiveVault ||= { amount: 0, accumulatedSeconds: 0, lastUpdatedAt: Date.now() };
  player.passiveVault.amount ||= 0;
  player.passiveVault.accumulatedSeconds ||= 0;
  player.passiveVault.lastUpdatedAt ||= Date.now();
  player.hideoutItems ||= {};
  player.hideoutItems.house = Number(player.casaAtual || 0);
  player.hideoutItems.vehicle = Number(player.equippedMotorcycleLevel || 0);
}

export function calculateStaminaMax(player) {
  const house = getHouseConfig(player.casaAtual);
  return staminaConfig.staminaMaxBase + (house?.staminaMaxBonus || 0);
}

export function calculateStaminaRegenPerMinute(player) {
  const house = getHouseConfig(player.casaAtual);
  return staminaConfig.staminaRegenBaseNoEsconderijo + (house?.staminaRegenBonus || 0);
}

export function updateStaminaDerivedStats(player) {
  const previousMax = Number(player.staminaMax || staminaConfig.staminaMaxBase);
  player.staminaMax = calculateStaminaMax(player);
  player.staminaRegenPorMinuto = calculateStaminaRegenPerMinute(player);
  if (!Number.isFinite(player.staminaAtual)) player.staminaAtual = player.staminaMax;
  if (player.staminaAtual > player.staminaMax) player.staminaAtual = player.staminaMax;
  if (player.staminaMax > previousMax && player.staminaAtual === previousMax) {
    player.staminaAtual = Math.min(player.staminaMax, player.staminaAtual + (player.staminaMax - previousMax));
  }
}

export function updateStaminaInHideout(state, dtSeconds) {
  if (state.scene !== "hideout" || state.run?.mode !== "hideout") return 0;
  const player = state.player;
  updateStaminaDerivedStats(player);
  if (player.staminaAtual >= player.staminaMax) return 0;
  const recovered = player.staminaRegenPorMinuto * (dtSeconds / 60);
  player.staminaAtual = Math.min(player.staminaMax, player.staminaAtual + recovered);
  return recovered;
}

export function canStartRaid(player, map = null) {
  return Number(player.staminaAtual || 0) >= staminaCostForRaid(map);
}

export function consumeStaminaForMap(player, map) {
  updateStaminaDerivedStats(player);
  const cost = staminaCostForRaid(map);
  player.staminaAtual = Math.max(0, player.staminaAtual - cost);
  return cost;
}

export function staminaCostForRaid(map = null) {
  return Math.max(1, Number(map?.staminaCost ?? map?.custoStamina ?? 1));
}

export function staminaRaidBlockedMessage(player, map = null) {
  const current = Math.floor(Number(player?.staminaAtual || 0));
  const cost = staminaCostForRaid(map);
  if (current <= 0) return staminaConfig.emptyMessage;
  return `${staminaConfig.insufficientMessage} Precisa de ${cost} stamina e voce tem ${current}.`;
}

export function staminaState(player) {
  updateStaminaDerivedStats(player);
  const percent = player.staminaMax ? Math.round((player.staminaAtual / player.staminaMax) * 100) : 0;
  return staminaConfig.states.find((state) => percent >= state.minPercent && percent <= state.maxPercent) || staminaConfig.states[0];
}

export function staminaPercent(player) {
  updateStaminaDerivedStats(player);
  return player.staminaMax ? Math.max(0, Math.min(100, (player.staminaAtual / player.staminaMax) * 100)) : 0;
}

export function getStaminaRechargeCost(player) {
  updateStaminaDerivedStats(player);
  const house = getHouseConfig(player.casaAtual);
  if (!house || player.staminaAtual >= player.staminaMax) return 0;
  const missingPercent = (player.staminaMax - player.staminaAtual) / player.staminaMax;
  const raw = (1000 + 75 * Math.pow(player.level || 1, 1.5)) * missingPercent * house.rechargeMultiplier;
  return roundClean(raw);
}

export function hideoutRestCooldown(player, now = Date.now()) {
  const safeNow = Math.max(0, Number(now) || Date.now());
  const lastRest = Math.max(0, Number(player?.lastHideoutRestAt || 0));
  if (!Number.isFinite(lastRest) || lastRest <= 0) {
    return { ready: true, remainingMs: 0, readyAt: safeNow };
  }

  const readyAt = lastRest + HIDEOUT_REST_COOLDOWN_MS;
  const remainingMs = Math.max(0, Math.min(HIDEOUT_REST_COOLDOWN_MS, readyAt - safeNow));
  return { ready: remainingMs <= 0, remainingMs, readyAt };
}

export function restNow(player, now = Date.now()) {
  updateStaminaDerivedStats(player);
  const house = getHouseConfig(player.casaAtual);
  if (!house) return { ok: false, reason: "Compre uma casa para descansar agora." };
  if (player.staminaAtual >= player.staminaMax) return { ok: false, reason: "Stamina ja esta cheia." };
  const cooldown = hideoutRestCooldown(player, now);
  if (!cooldown.ready) return { ok: false, reason: `Aguarde ${cooldownDurationText(cooldown.remainingMs)} para descansar de novo.` };

  const cost = getStaminaRechargeCost(player);
  if (player.money < cost) return { ok: false, reason: "Moedas insuficientes para descansar agora." };

  player.money -= cost;
  player.staminaAtual = player.staminaMax;
  player.lastHideoutRestAt = now;
  return { ok: true, value: cost, message: `Stamina recuperada por R$ ${cost}.` };
}

function cooldownDurationText(ms) {
  const totalSeconds = Math.max(1, Math.ceil(Number(ms || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return seconds ? `${minutes}min ${seconds}s` : `${minutes}min`;
}

export function buyHouse(player, tier) {
  const house = getHouseConfig(tier);
  if (!house) return { ok: false, reason: "Casa nao encontrada." };
  if (!hasOwnedLand(player)) return { ok: false, reason: "Voce precisa de um terreno mocado antes." };
  if (!canUnlockAsset(player, house)) return { ok: false, reason: assetRequirementText(house, player) };
  if (player.ownedHouses.includes(house.tier)) return activateHouse(player, house.tier);
  if (player.money < house.price) return { ok: false, reason: "Moedas insuficientes para comprar essa casa." };

  player.money -= house.price;
  player.ownedHouses.push(house.tier);
  player.casaAtual = house.tier;
  player.hideoutItems ||= {};
  player.hideoutItems.house = house.tier;
  updateStaminaDerivedStats(player);
  return { ok: true, message: `${house.name} comprada e ativada.` };
}

export function buyCar(player, tier) {
  return buyMotorcycle(player, tier);
}

export function buyMotorcycle(player, tier) {
  normalizeProgressionSystems(player);
  const motorcycle = getMotorcycleConfig(tier);
  if (!motorcycle) return { ok: false, reason: "Moto nao encontrada." };
  if (!motorcyclesUnlocked(player)) return { ok: false, reason: `Motos liberam no nivel ${MOTORCYCLE_UNLOCK_LEVEL}.` };
  if (!hasOwnedLand(player)) return { ok: false, reason: "Voce precisa de um terreno mocado antes." };
  if (!canUnlockAsset(player, motorcycle)) return { ok: false, reason: assetRequirementText(motorcycle, player) };
  if (player.ownedMotorcycles.includes(motorcycle.tier)) return activateMotorcycle(player, motorcycle.tier);
  if (!motorcycleTutorialCleared(player)) return { ok: false, reason: "Veja o tutorial das motos antes de comprar." };
  if (player.money < motorcycle.price) return { ok: false, reason: "Moedas insuficientes para comprar essa moto." };

  player.money -= motorcycle.price;
  player.ownedMotorcycles.push(motorcycle.tier);
  player.ownedMotorcycles = normalizeOwnedMotorcycles(player);
  player.ownedCars = [...player.ownedMotorcycles];
  player.equippedMotorcycleLevel = motorcycle.tier;
  player.motoAtual = motorcycle.tier;
  player.hasMotorcycleEquipped = true;
  player.carroAtual = motorcycle.tier;
  player.hideoutItems ||= {};
  player.hideoutItems.vehicle = motorcycle.tier;
  return { ok: true, message: `${motorcycle.name} comprada e equipada.` };
}

export function buyLand(player, tier) {
  const land = getLandConfig(tier);
  if (!land) return { ok: false, reason: "Terreno nao encontrado." };
  if (!canUnlockAsset(player, land)) return { ok: false, reason: assetRequirementText(land, player) };
  if (player.terrenosComprados.includes(land.tier)) return activateLand(player, land.tier);
  if (player.money < land.price) return { ok: false, reason: "Moedas insuficientes para comprar esse terreno." };

  player.money -= land.price;
  player.terrenosComprados.push(land.tier);
  player.terrenoAtual = land.tier;
  player.hideoutTier = land.tier;
  player.maiorTerrenoDesbloqueado = highestUnlockedLandTier(player);
  return { ok: true, message: `${land.name} comprado e ativado.` };
}

export function activateHouse(player, tier) {
  if (!player.ownedHouses.includes(Number(tier))) return { ok: false, reason: "Voce ainda nao possui essa casa." };
  player.casaAtual = Number(tier);
  player.hideoutItems ||= {};
  player.hideoutItems.house = Number(tier);
  updateStaminaDerivedStats(player);
  return { ok: true, message: `${getHouseConfig(tier)?.name || "Casa"} ativada.` };
}

export function activateCar(player, tier) {
  return activateMotorcycle(player, tier);
}

export function activateMotorcycle(player, tier) {
  normalizeProgressionSystems(player);
  const safeTier = Number(tier);
  if (!player.ownedMotorcycles.includes(safeTier)) return { ok: false, reason: "Voce ainda nao possui essa moto." };
  if (!motorcyclesUnlocked(player)) return { ok: false, reason: `Motos liberam no nivel ${MOTORCYCLE_UNLOCK_LEVEL}.` };
  player.equippedMotorcycleLevel = safeTier;
  player.motoAtual = safeTier;
  player.hasMotorcycleEquipped = true;
  player.carroAtual = safeTier;
  player.hideoutItems ||= {};
  player.hideoutItems.vehicle = safeTier;
  return { ok: true, message: `${getMotorcycleConfig(tier)?.name || "Moto"} equipada.` };
}

export function activateLand(player, tier) {
  if (!player.terrenosComprados.includes(Number(tier))) return { ok: false, reason: "Voce ainda nao possui esse terreno." };
  player.terrenoAtual = Number(tier);
  player.hideoutTier = Number(tier);
  return { ok: true, message: `${getLandConfig(tier)?.name || "Terreno"} ativado.` };
}

export function canUnlockAsset(player, asset) {
  return (
    (player.highestMapUnlocked || 1) >= asset.requiredMap &&
    (player.level || 1) >= asset.requiredLevel &&
    hasRequiredLandTier(player, asset) &&
    hasRequiredHouseTier(player, asset)
  );
}

export function getPassiveIncomePerMinute(player) {
  const house = getHouseConfig(player.casaAtual);
  const motorcycle = getMotorcycleConfig(player.equippedMotorcycleLevel);
  const land = getLandConfig(player.terrenoAtual);
  return ((house?.passiveIncomePerMinute || 0) + (motorcycle?.passiveIncomePerMinute || 0)) * (land?.passiveIncomeMultiplier || 1);
}

export function updatePassiveIncome(state, dtSeconds) {
  const player = state.player;
  normalizeProgressionSystems(player);
  const rate = getPassiveIncomePerMinute(player);
  player.passiveVault.lastUpdatedAt = Date.now();
  if (rate <= 0 || dtSeconds <= 0) return 0;
  const earned = rate * (dtSeconds / 60);
  player.passiveVault.amount += earned;
  player.passiveVault.accumulatedSeconds += dtSeconds;
  return earned;
}

export function applyOfflinePassiveIncome(state) {
  const player = state.player;
  normalizeProgressionSystems(player);
  const now = Date.now();
  const elapsedSeconds = Math.max(0, (now - player.passiveVault.lastUpdatedAt) / 1000);
  const cappedSeconds = Math.min(elapsedSeconds, getOfflineLimitHours(player) * 3600);
  if (cappedSeconds > 0) {
    const rate = getPassiveIncomePerMinute(player);
    player.passiveVault.amount += rate * (cappedSeconds / 60);
    player.passiveVault.accumulatedSeconds += cappedSeconds;
  }
  player.passiveVault.lastUpdatedAt = now;
}

export function getOfflineLimitHours(player) {
  const houseTier = Number(player.casaAtual || 0);
  const motorcycleTier = Number(player.equippedMotorcycleLevel || 0);
  const land = getLandConfig(player.terrenoAtual);
  return Math.min(4 + houseTier * 0.75 + motorcycleTier * 0.25 + (land?.offlineHoursBonus || 0), passiveIncomeConfig.maxOfflineHours);
}

export function collectPassiveVault(player) {
  normalizeProgressionSystems(player);
  const amount = Math.floor(player.passiveVault.amount || 0);
  if (amount <= 0) return { ok: false, reason: "Cofre vazio." };
  player.money += amount;
  player.passiveVault.amount -= amount;
  player.passiveVault.accumulatedSeconds = 0;
  return { ok: true, value: amount, message: `Cofre coletado: R$ ${amount}.` };
}

export function houseOptions() {
  return housesConfig;
}

export function carOptions() {
  return motorcycleOptions();
}

export function motorcycleOptions() {
  return motorcyclesConfig;
}

export function landOptions() {
  return hideoutLandConfig;
}

export function assetRequirementText(asset, player = null) {
  if (player && !hasRequiredLandTier(player, asset)) {
    return `Bloqueado: compre um terreno T${asset.requiredLandTier} ou superior.`;
  }
  if (player && !hasRequiredHouseTier(player, asset)) {
    return `Bloqueado: compre uma casa T${asset.requiredHouseTier} ou superior.`;
  }
  return `Bloqueado: alcance o Mapa ${asset.requiredMap} e Nivel ${asset.requiredLevel}.`;
}

export function motorcyclesUnlocked(player) {
  return playerLevel(player) >= MOTORCYCLE_UNLOCK_LEVEL;
}

export function motorcycleTutorialCleared(player) {
  return Boolean(player?.motorcycleTutorialCompleted || player?.motorcycleTutorialSkipped);
}

export function motorcycleSpeedMultiplier(level) {
  return getMotorcycleConfig(level)?.speedMultiplier || 1;
}

export function motorcyclePoliceEscapeChance(level) {
  return getMotorcycleConfig(level)?.policeEscapeChance || 0;
}

export function equippedMotorcycleLevel(player) {
  normalizeProgressionSystems(player);
  return Number(player.equippedMotorcycleLevel || 0);
}

export function hasEquippedMotorcycle(player) {
  return equippedMotorcycleLevel(player) > 0;
}

export function raidMotorcycleMoveSpeedMultiplier(player) {
  return motorcycleSpeedMultiplier(equippedMotorcycleLevel(player));
}

export function raidMotorcyclePoliceEscapeChance(player) {
  return motorcyclePoliceEscapeChance(equippedMotorcycleLevel(player));
}

function roundClean(value) {
  if (value <= 1000) return Math.max(1, Math.round(value / 10) * 10);
  return Math.max(100, Math.round(value / 100) * 100);
}

function highestUnlockedLandTier(player) {
  return hideoutLandConfig
    .filter((land) => canUnlockAsset(player, land))
    .map((land) => land.tier)
    .at(-1) || 1;
}

function hasOwnedLand(player) {
  return Array.isArray(player.terrenosComprados) && player.terrenosComprados.length > 0;
}

function hasRequiredLandTier(player, asset) {
  const requiredTier = Number(asset?.requiredLandTier || 0);
  if (!requiredTier) return true;
  return (player.terrenosComprados || []).some((tier) => Number(tier) >= requiredTier);
}

function hasRequiredHouseTier(player, asset) {
  const requiredTier = Number(asset?.requiredHouseTier || 0);
  if (!requiredTier) return true;
  return (player.ownedHouses || []).some((tier) => Number(tier) >= requiredTier);
}

function normalizeOwnedMotorcycles(player) {
  const migrated = [];
  if (Array.isArray(player.ownedMotorcycles)) {
    migrated.push(...player.ownedMotorcycles);
  }
  if (Array.isArray(player.ownedCars)) {
    migrated.push(...player.ownedCars.map(motorcycleTierFromLegacyCarTier));
  }
  migrated.push(player.equippedMotorcycleLevel || player.motoAtual || 0);
  migrated.push(motorcycleTierFromLegacyCarTier(player.carroAtual));
  if (!motorcyclesUnlocked(player)) return [];
  return [...new Set(migrated.map(normalizeMotorcycleTier).filter(Boolean))]
    .sort((a, b) => a - b);
}

function normalizeEquippedMotorcycle(player) {
  if (!motorcyclesUnlocked(player)) return null;
  const raw = player.equippedMotorcycleLevel
    || player.motoAtual
    || motorcycleTierFromLegacyCarTier(player.carroAtual);
  const safeTier = normalizeMotorcycleTier(raw);
  if (!safeTier) return null;
  return player.ownedMotorcycles.includes(safeTier) ? safeTier : null;
}

function motorcycleTierFromLegacyCarTier(tier) {
  const legacyTier = Math.max(0, Number(tier) || 0);
  if (!legacyTier) return 0;
  return Math.max(1, Math.min(5, Math.ceil((legacyTier / 9) * 5)));
}

function normalizeMotorcycleTier(tier) {
  const rawTier = Math.floor(Number(tier) || 0);
  if (rawTier <= 0) return 0;
  return Math.max(1, Math.min(5, rawTier));
}

function playerLevel(player) {
  return Math.max(1, Number(player?.level || player?.nivelJogador || 1));
}
