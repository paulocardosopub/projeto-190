import { mapsConfig } from "../balance/index.js?v=shop-sync-2";

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
    id: "fazenda-laboratorio",
    code: "FL",
    name: "Fazenda e Laboratorio",
    backgroundSheet: "hideouts",
    backgroundRow: 0,
    spawnX: 260,
    description: "Area de negocios dos jogadores.",
    npcs: [
      {
        ...idleNpc("npc-empresario-negocios", "Empresario", 9, 0, 1040, "front"),
        role: "business",
        shopName: "Negocios",
        greeting: "Aqui tu planta, fabrica e vende.",
        greetings: [
          "Aqui tu planta, fabrica e vende.",
          "Quer comecar pequeno ou ja quer investir pesado?",
          "Fazenda da o primeiro passo. Laboratorio leva pra outro nivel.",
          "Cocaina so libera quando tu tiver estrutura dos dois lados."
        ]
      }
    ]
  },
  {
    id: "prisao",
    code: "PR",
    name: "Prisao",
    backgroundSheet: "backgroundIdle1",
    backgroundRow: 0,
    description: "Area de retencao temporaria.",
    npcs: [
      cityPoliceNpc("prisao-policial-1", 420, "front"),
      cityPoliceNpc("prisao-policial-2", 920, "left"),
      cityPoliceNpc("prisao-policial-3", 1450, "right")
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
    spawnX: 260,
    description: "Area reservada para o futuro sistema de pets.",
    npcs: [
      {
        ...idleNpc("petshop-responsavel", "Dr. Rubens", 5, 0, 620, "front"),
        role: "petshop",
        shopName: "Petshop",
        greeting: "Escolhe teu parceiro. Aqui eu cuido dos pets da area."
      }
    ]
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

function cityPoliceNpc(id, x, direction = "front") {
  return {
    ...idleNpc(id, "Policial", 3, 0, x, direction, 1),
    sheet: "enemies2"
  };
}
