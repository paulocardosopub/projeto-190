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

export const IDLE_MAPS = [
  {
    id: "prisao",
    code: "PR",
    name: "Prisao",
    backgroundSheet: "backgroundIdle1",
    backgroundRow: 0,
    description: "Area de retencao temporaria.",
    npcs: [
      { id: "prisao-policial-1", name: "Policial", sheet: "enemies2", row: 3, x: 420, direction: "front" },
      { id: "prisao-policial-2", name: "Policial", sheet: "enemies2", row: 3, x: 900, direction: "left" },
      { id: "prisao-policial-3", name: "Policial", sheet: "enemies2", row: 3, x: 1450, direction: "right" }
    ]
  },
  {
    id: "hospital",
    code: "HP",
    name: "Hospital",
    backgroundSheet: "backgroundIdle1",
    backgroundRow: 1,
    description: "Tratamento e recuperacao do jogador."
  },
  {
    id: "petshop",
    code: "PT",
    name: "Petshop",
    backgroundSheet: "backgroundIdle1",
    backgroundRow: 2,
    description: "Area reservada para o futuro sistema de pets."
  }
];

export const MAP_TIERS = [...new Set(MAPS.map((map) => map.tier))];
