import {
  carsConfig,
  getCarConfig,
  getHouseConfig,
  getLandConfig,
  hideoutLandConfig,
  housesConfig,
  passiveIncomeConfig,
  staminaConfig
} from "../../data/balance/index.js?v=asset-lock-1";

export function normalizeProgressionSystems(player) {
  player.staminaMax = calculateStaminaMax(player);
  player.staminaRegenPorMinuto = calculateStaminaRegenPerMinute(player);
  player.staminaAtual = Number.isFinite(player.staminaAtual)
    ? Math.min(player.staminaAtual, player.staminaMax)
    : player.staminaMax;
  player.nivelJogador = player.level || 1;
  player.ownedHouses ||= [];
  player.ownedCars ||= [];
  player.terrenosComprados ||= [];
  player.casaAtual = player.ownedHouses.includes(player.casaAtual) ? player.casaAtual : null;
  player.carroAtual = player.ownedCars.includes(player.carroAtual) ? player.carroAtual : null;
  player.terrenoAtual = player.terrenosComprados.includes(player.terrenoAtual)
    ? player.terrenoAtual
    : player.terrenosComprados[0] || null;
  player.maiorTerrenoDesbloqueado = highestUnlockedLandTier(player);
  player.hideoutTier = player.terrenoAtual || 0;
  player.passiveVault ||= { amount: 0, accumulatedSeconds: 0, lastUpdatedAt: Date.now() };
  player.passiveVault.amount ||= 0;
  player.passiveVault.accumulatedSeconds ||= 0;
  player.passiveVault.lastUpdatedAt ||= Date.now();
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

export function restNow(player) {
  updateStaminaDerivedStats(player);
  const house = getHouseConfig(player.casaAtual);
  if (!house) return { ok: false, reason: "Compre uma casa para descansar agora." };
  if (player.staminaAtual >= player.staminaMax) return { ok: false, reason: "Stamina ja esta cheia." };

  const cost = getStaminaRechargeCost(player);
  if (player.money < cost) return { ok: false, reason: "Moedas insuficientes para descansar agora." };

  player.money -= cost;
  player.staminaAtual = player.staminaMax;
  return { ok: true, value: cost, message: `Stamina recuperada por R$ ${cost}.` };
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
  player.hideoutItems.house = Math.max(Number(player.hideoutItems.house || 0), house.tier);
  updateStaminaDerivedStats(player);
  return { ok: true, message: `${house.name} comprada e ativada.` };
}

export function buyCar(player, tier) {
  const car = getCarConfig(tier);
  if (!car) return { ok: false, reason: "Carro nao encontrado." };
  if (!hasOwnedLand(player)) return { ok: false, reason: "Voce precisa de um terreno mocado antes." };
  if (!canUnlockAsset(player, car)) return { ok: false, reason: assetRequirementText(car, player) };
  if (player.ownedCars.includes(car.tier)) return activateCar(player, car.tier);
  if (player.money < car.price) return { ok: false, reason: "Moedas insuficientes para comprar esse carro." };

  player.money -= car.price;
  player.ownedCars.push(car.tier);
  player.carroAtual = car.tier;
  player.hideoutItems ||= {};
  player.hideoutItems.vehicle = Math.max(Number(player.hideoutItems.vehicle || 0), car.tier);
  return { ok: true, message: `${car.name} comprado e ativado.` };
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
  player.hideoutItems.house = Math.max(Number(player.hideoutItems.house || 0), Number(tier));
  updateStaminaDerivedStats(player);
  return { ok: true, message: `${getHouseConfig(tier)?.name || "Casa"} ativada.` };
}

export function activateCar(player, tier) {
  if (!player.ownedCars.includes(Number(tier))) return { ok: false, reason: "Voce ainda nao possui esse carro." };
  player.carroAtual = Number(tier);
  player.hideoutItems ||= {};
  player.hideoutItems.vehicle = Math.max(Number(player.hideoutItems.vehicle || 0), Number(tier));
  return { ok: true, message: `${getCarConfig(tier)?.name || "Carro"} ativado.` };
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
    hasRequiredLandTier(player, asset)
  );
}

export function getPassiveIncomePerMinute(player) {
  const house = getHouseConfig(player.casaAtual);
  const car = getCarConfig(player.carroAtual);
  const land = getLandConfig(player.terrenoAtual);
  return ((house?.passiveIncomePerMinute || 0) + (car?.passiveIncomePerMinute || 0)) * (land?.passiveIncomeMultiplier || 1);
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
  const carTier = Number(player.carroAtual || 0);
  const land = getLandConfig(player.terrenoAtual);
  return Math.min(4 + houseTier * 0.75 + carTier * 0.25 + (land?.offlineHoursBonus || 0), passiveIncomeConfig.maxOfflineHours);
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
  return carsConfig;
}

export function landOptions() {
  return hideoutLandConfig;
}

export function assetRequirementText(asset, player = null) {
  if (player && !hasRequiredLandTier(player, asset)) {
    return `Bloqueado: compre um terreno T${asset.requiredLandTier} ou superior.`;
  }
  return `Bloqueado: alcance o Mapa ${asset.requiredMap} e Nivel ${asset.requiredLevel}.`;
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
