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
      idleNpc("prisao-policial-1", "Policial", 4, 0, 420, "front"),
      idleNpc("prisao-policial-2", "Policial", 4, 0, 920, "left"),
      idleNpc("prisao-policial-3", "Policial", 4, 0, 1450, "right")
    ]
  },
  {
    id: "hospital",
    code: "HP",
    name: "Hospital",
    backgroundSheet: "backgroundIdle1",
    backgroundRow: 1,
    description: "Tratamento e recuperacao do jogador.",
    npcs: [
      idleNpc("hospital-medico-1", "Medico", 1, 0, 760, "front"),
      idleNpc("hospital-enfermeira-1", "Enfermeira", 5, 4, 1040, "front"),
      idleNpc("hospital-paciente-1", "Paciente", 7, 4, 1280, "left", 0.94)
    ]
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

function idleNpc(id, name, row, columnOffset, x, direction = "front", heightScale = 0.96) {
  return {
    id,
    name,
    sheet: "enemies3",
    row,
    columnOffset,
    x,
    direction,
    heightScale
  };
}
