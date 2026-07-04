import { mapsConfig } from "../balance/index.js?v=stamina-lock-1";

export const CITY = {
  id: "cidade",
  name: "Cidade Inicial",
  backgroundSheet: "backgrounds",
  backgroundRow: 0,
  description: "Area segura. Use este ponto para organizar inventario e escolher assaltos."
};

export const MAPS = mapsConfig;

export const HIDEOUTS = Array.from({ length: 6 }, (_, row) => ({
  id: `esconderijo-${row + 1}`,
  tier: row + 1,
  name: `Esconderijo Nivel ${row + 1}`,
  backgroundSheet: "hideouts",
  backgroundRow: row,
  description: "Base do jogador. Upgrades permanentes ficam aqui."
}));

export const MAP_TIERS = [...new Set(MAPS.map((map) => map.tier))];
