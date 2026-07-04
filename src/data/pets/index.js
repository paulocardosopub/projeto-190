import { getCarConfig, getHouseConfig } from "../balance/index.js?v=phase1-1";

export const PET_UNLOCK_LEVEL = 5;
export const STARTER_PET_ID = "pinscher";

const FARM_HOURS_BY_TIER = {
  1: 0.7,
  2: 1.1,
  3: 1.7,
  4: 2.5,
  5: 3.5,
  6: 5,
  7: 7,
  8: 9,
  9: 12
};

const petFrameRows = [
  [[53, 7, 65, 72], [230, 7, 66, 71], [403, 7, 66, 71], [575, 7, 69, 72], [750, 9, 73, 69], [910, 11, 98, 64]],
  [[30, 119, 118, 116], [200, 119, 138, 116], [380, 119, 137, 116], [547, 141, 125, 96], [700, 129, 155, 92], [883, 137, 136, 96]],
  [[14, 264, 110, 120], [178, 264, 122, 121], [350, 264, 122, 121], [524, 263, 125, 122], [692, 267, 145, 109], [855, 269, 155, 110]],
  [[12, 416, 127, 115], [178, 416, 139, 115], [350, 416, 139, 115], [524, 415, 144, 117], [694, 416, 154, 115], [863, 416, 160, 120]],
  [[16, 563, 132, 107], [182, 563, 138, 107], [351, 563, 139, 107], [524, 563, 138, 107], [679, 563, 159, 104], [858, 561, 163, 107]],
  [[10, 699, 130, 118], [181, 699, 133, 118], [351, 699, 133, 118], [518, 699, 136, 118], [683, 694, 159, 107], [855, 704, 163, 106]],
  [[11, 836, 132, 116], [179, 837, 140, 115], [349, 837, 140, 115], [522, 836, 138, 116], [675, 840, 162, 107], [850, 842, 165, 107]],
  [[11, 966, 126, 142], [172, 968, 143, 139], [343, 969, 141, 139], [518, 972, 148, 136], [686, 967, 164, 121], [849, 988, 172, 107]],
  [[11, 1118, 136, 125], [177, 1118, 143, 125], [349, 1118, 145, 125], [524, 1121, 151, 122], [689, 1123, 174, 109], [869, 1125, 175, 108]],
  [[14, 1258, 136, 106], [182, 1258, 145, 106], [353, 1258, 140, 105], [529, 1256, 141, 108], [690, 1262, 157, 98], [855, 1265, 157, 101]]
];

export const PET_FRAME_BOUNDS = petFrameRows.map((row) => (
  row.map(([x, y, width, height]) => ({ x, y, width, height }))
));

export const PETS = [
  pet("pinscher", "Pinscher", 0, 5, 0, 1, 0.08, 1.65, "Mordida rapida", 0.43),
  pet("chihuahua", "Chihuahua", 1, 15, 8000, 1, 0.095, 1.6, "Mordida rapida pequena", 0.58),
  pet("boston-terrier", "Boston Terrier", 2, 20, 20000, 2, 0.11, 1.55, "Mordida equilibrada", 0.56),
  pet("bull-terrier", "Bull Terrier", 3, 25, 50000, 3, 0.13, 1.5, "Investida curta", 0.57),
  pet("american-bully", "American Bully Preto", 4, 30, 120000, 4, 0.15, 1.45, "Mordida forte", 0.57),
  pet("boxer", "Boxer", 5, 35, 280000, 5, 0.17, 1.4, "Avanco agressivo", 0.6),
  pet("cane-corso", "Cane Corso Cinza", 6, 40, 600000, 6, 0.19, 1.35, "Mordida pesada", 0.6),
  pet("doberman", "Doberman", 7, 45, 1200000, 7, 0.215, 1.3, "Dash rapido com mordida", 0.68),
  pet("bulldog-ingles", "Bulldog Ingles Cinza", 8, 50, 2400000, 8, 0.24, 1.25, "Mordida pesada e curta", 0.63),
  pet("rottweiler", "Rottweiler", 9, 55, 4800000, 9, 0.26, 1.2, "Mordida brutal", 0.6)
];

export function normalizePets(player, options = {}) {
  if (!player) return [];
  const messages = [];
  const owned = new Set(Array.isArray(player.petsOwned) ? player.petsOwned.filter((id) => getPetById(id)) : []);
  const level = playerLevel(player);
  const shouldUnlock = level >= PET_UNLOCK_LEVEL;

  player.petSystemUnlocked = Boolean(player.petSystemUnlocked || shouldUnlock);
  if (shouldUnlock && !owned.has(STARTER_PET_ID)) {
    owned.add(STARTER_PET_ID);
    if (!options.silent) messages.push("Pinscher liberado de graca no petshop.");
  }
  if (shouldUnlock && player.petSystemUnlocked && !options.silent && !player.petUnlockNoticeShown) {
    messages.push("Pets liberados no nivel 5.");
    player.petUnlockNoticeShown = true;
  }

  player.petsOwned = [...owned];
  if (!shouldUnlock || !owned.has(player.equippedPetId)) {
    player.equippedPetId = shouldUnlock && owned.has(STARTER_PET_ID) ? STARTER_PET_ID : null;
  }
  player.lastPetFollowDirection = player.lastPetFollowDirection === "left" ? "left" : "right";
  return messages;
}

export function buyPet(player, petId) {
  normalizePets(player, { silent: true });
  const pet = getPetById(petId);
  if (!pet) return { ok: false, reason: "Pet nao encontrado." };
  if (!petsUnlocked(player)) return { ok: false, reason: "Pets liberados no nivel 5." };
  if (playerLevel(player) < pet.requiredLevel) return { ok: false, reason: `${pet.name} libera no nivel ${pet.requiredLevel}.` };
  if (player.petsOwned.includes(pet.id)) return { ok: false, reason: `${pet.name} ja esta com voce.` };

  const price = petPrice(pet);
  if (price > 0 && Number(player.money || 0) < price) return { ok: false, reason: `Dinheiro insuficiente para ${pet.name}.` };
  player.money = Math.max(0, Number(player.money || 0) - price);
  player.petsOwned.push(pet.id);
  return { ok: true, message: `${pet.name} agora acompanha voce.` };
}

export function equipPet(player, petId) {
  normalizePets(player, { silent: true });
  const pet = getPetById(petId);
  if (!pet) return { ok: false, reason: "Pet nao encontrado." };
  if (!petsUnlocked(player)) return { ok: false, reason: "Pets liberados no nivel 5." };
  if (!player.petsOwned.includes(pet.id)) return { ok: false, reason: `${pet.name} ainda nao foi comprado.` };
  player.equippedPetId = pet.id;
  return { ok: true, message: `${pet.name} equipado.` };
}

export function unequipPet(player) {
  normalizePets(player, { silent: true });
  if (!player.equippedPetId) return { ok: false, reason: "Nenhum pet equipado." };
  const pet = getPetById(player.equippedPetId);
  player.equippedPetId = null;
  return { ok: true, message: `${pet?.name || "Pet"} desequipado.` };
}

export function getPetById(id) {
  return PETS.find((petConfig) => petConfig.id === id) || null;
}

export function getEquippedPet(player) {
  if (!petsUnlocked(player)) return null;
  const pet = getPetById(player?.equippedPetId);
  if (!pet || !player?.petsOwned?.includes(pet.id)) return null;
  return pet;
}

export function petsUnlocked(player) {
  return Boolean(player?.petSystemUnlocked && playerLevel(player) >= PET_UNLOCK_LEVEL);
}

export function petPrice(pet) {
  if (!pet || pet.priceFallback <= 0) return 0;
  const car = getCarConfig(pet.economyTier);
  const house = getHouseConfig(pet.economyTier);
  if (!car || !house || (!car.price && !house.price)) return pet.priceFallback;

  const base = Number(car.price || 0) * 0.32 + Number(house.price || 0) * 0.08;
  const incomePerHour = (Number(car.passiveIncomePerMinute || 0) + Number(house.passiveIncomePerMinute || 0)) * 60;
  const min = incomePerHour * Number(FARM_HOURS_BY_TIER[pet.economyTier] || 1);
  const maxOptions = [
    Number(car.price || 0) * 0.65,
    Number(house.price || 0) * 0.22
  ].filter((value) => value > 0);
  if (!maxOptions.length) return pet.priceFallback;

  const max = Math.min(...maxOptions);
  const clamped = Math.max(1, Math.min(max, Math.max(base, min)));
  return niceRound(clamped);
}

export function petStatus(player, pet) {
  if (!petsUnlocked(player)) return "locked-system";
  if (playerLevel(player) < pet.requiredLevel) return "locked-level";
  if (player.equippedPetId === pet.id) return "equipped";
  if (player.petsOwned?.includes(pet.id)) return "owned";
  return petPrice(pet) <= 0 ? "claimable" : "available";
}

export function petDamageForAttack(stats, enemy, pet) {
  const playerHitDamage = Math.max(1, Number(stats.attack || 1) - Math.round(Number(enemy?.block || 0) * Number(stats.attack || 1)));
  const playerEffectiveDps = playerHitDamage * Number(stats.speed || 1);
  const percent = Math.min(0.3, Math.max(0, Number(pet?.dpsPercent || 0)));
  return Math.max(1, Math.round(playerEffectiveDps * percent * Number(pet?.cooldown || 1)));
}

function pet(id, name, row, requiredLevel, priceFallback, economyTier, dpsPercent, cooldown, attackLabel, heightRatio) {
  return {
    id,
    name,
    row,
    requiredLevel,
    priceFallback,
    economyTier,
    dpsPercent,
    cooldown,
    attackLabel,
    heightRatio
  };
}

function playerLevel(player) {
  return Math.max(1, Number(player?.level || player?.nivelJogador || 1));
}

function niceRound(value) {
  const amount = Math.max(0, Math.round(value || 0));
  if (amount < 10000) return Math.ceil(amount / 500) * 500;
  if (amount < 100000) return Math.ceil(amount / 5000) * 5000;
  if (amount < 1000000) return Math.ceil(amount / 25000) * 25000;
  return Math.ceil(amount / 100000) * 100000;
}
