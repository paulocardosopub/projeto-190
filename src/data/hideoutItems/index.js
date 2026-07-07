export const HIDEOUT_ITEM_TYPES = [
  {
    id: "house",
    name: "Casa",
    sheet: "hideoutHouses",
    baseCost: 400,
    height: 145
  },
  {
    id: "vehicle",
    name: "Moto",
    sheet: "hideoutVehicles",
    baseCost: 260,
    height: 68,
    maxTier: 5
  }
];

export const HIDEOUT_ITEM_TIERS = Array.from({ length: 9 }, (_, index) => index + 1);

export const HIDEOUT_ITEM_HEIGHTS = {
  house: {
    1: 105,
    2: 120,
    3: 120,
    4: 120,
    5: 140,
    6: 140,
    7: 150,
    8: 165,
    9: 180
  },
  vehicle: {
    1: 68,
    2: 68,
    3: 68,
    4: 68,
    5: 68
  }
};

export const HIDEOUT_ITEM_DEFAULT_PLACEMENTS = {
  "esconderijo-1": {
    house: { x: 349, y: 253 },
    vehicle: { x: 555, y: 267 }
  },
  "esconderijo-2": {
    house: { x: 973, y: 262 },
    vehicle: { x: 1298, y: 278 }
  },
  "esconderijo-3": {
    house: { x: 943, y: 251 },
    vehicle: { x: 1277, y: 258 }
  },
  "esconderijo-4": {
    house: { x: 946, y: 243 },
    vehicle: { x: 355, y: 229 }
  },
  "esconderijo-5": {
    house: { x: 900, y: 253 },
    vehicle: { x: 591, y: 253 }
  },
  "esconderijo-6": {
    house: { x: 928, y: 243 },
    vehicle: { x: 1301, y: 269 }
  }
};

const HIDEOUT_ITEM_FALLBACK_PLACEMENTS = {
  house: { x: 610, y: 260 },
  vehicle: { x: 330, y: 268 }
};

export function hideoutItemType(id) {
  return HIDEOUT_ITEM_TYPES.find((item) => item.id === id) || HIDEOUT_ITEM_TYPES[0];
}

export function hideoutItemCost(typeId, tier) {
  const type = hideoutItemType(typeId);
  const safeTier = Math.max(1, Math.min(hideoutItemMaxTier(type.id), tier));
  return Math.round(type.baseCost * safeTier ** 2.05);
}

export function hideoutItemHeight(typeId, tier) {
  const type = hideoutItemType(typeId);
  const safeTier = Math.max(1, Math.min(hideoutItemMaxTier(type.id), tier));
  return HIDEOUT_ITEM_HEIGHTS[type.id]?.[safeTier] || type.height;
}

export function hideoutItemMaxTier(typeId) {
  return hideoutItemType(typeId).maxTier || 9;
}

export function hideoutItemPlacementDefault(typeId, hideoutTier = 1) {
  const type = hideoutItemType(typeId);
  const safeTier = Math.max(1, Math.min(6, Number(hideoutTier) || 1));
  const mapKey = `esconderijo-${safeTier}`;
  return {
    ...(HIDEOUT_ITEM_FALLBACK_PLACEMENTS[type.id] || HIDEOUT_ITEM_FALLBACK_PLACEMENTS.house),
    ...(HIDEOUT_ITEM_DEFAULT_PLACEMENTS[mapKey]?.[type.id] || {}),
    heights: {}
  };
}
