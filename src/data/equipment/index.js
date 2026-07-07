import {
  equipmentSlotsConfig,
  getItemConfigById,
  itemsConfig,
  rarityConfig,
  resolveEquipmentId
} from "../balance/index.js?v=icons-3";

export const EQUIPMENT = itemsConfig;

export const SLOT_LABELS = Object.fromEntries(
  Object.entries(equipmentSlotsConfig).map(([slot, config]) => [slot, config.label])
);

export const EQUIPMENT_SLOTS = Object.keys(equipmentSlotsConfig);

export const RARITY_LABELS = Object.fromEntries(
  Object.entries(rarityConfig).map(([rarity, config]) => [rarity, config.label])
);

export function getEquipmentById(id) {
  return getItemConfigById(id);
}

export function getEquipmentPool(slot, maxTier = 4) {
  return EQUIPMENT.filter((item) => item.slot === slot && item.tier <= maxTier);
}

export function normalizeEquipmentId(id) {
  return resolveEquipmentId(id);
}
