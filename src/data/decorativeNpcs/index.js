const ENEMIES3_DIRECTIONS = ["right", "front", "back", "left"];

const STYLE_DEFINITIONS = [
  { id: "turista-mochila", name: "Turista", category: "turista" },
  { id: "turista-camera", name: "Turista", category: "turista" },
  { id: "praia-homem", name: "Pessoa da Praia", category: "praia" },
  { id: "praia-mulher", name: "Pessoa da Praia", category: "praia" },
  { id: "vendedor-praia", name: "Vendedor de Praia", category: "comercio" },
  { id: "comerciante-rua", name: "Comerciante", category: "comercio" },
  { id: "feirante-banca", name: "Feirante", category: "feira" },
  { id: "trabalhador-urbano", name: "Trabalhador", category: "trabalho" },
  { id: "policial-farda", name: "Policial", category: "policia" },
  { id: "seguranca-rua", name: "Seguranca", category: "policia" },
  { id: "mendigo-rua", name: "Morador de Rua", category: "rua" },
  { id: "morador-rua", name: "Morador", category: "rua" },
  { id: "empresario-terno", name: "Empresario", category: "empresa" },
  { id: "idoso-cidade", name: "Idoso", category: "cidade" },
  { id: "cidade-comum-a", name: "Pedestre", category: "cidade" },
  { id: "cidade-neutro", name: "Pedestre", category: "cidade" },
  { id: "suspeito-rua", name: "Suspeito", category: "rua" },
  { id: "criminoso-rua", name: "Detento", category: "crime" },
  { id: "hospital-neutro", name: "Paciente", category: "hospital" },
  { id: "funcionario-urbano", name: "Funcionario", category: "trabalho" }
];

export const DECORATIVE_NPC_STYLES = STYLE_DEFINITIONS.map((style, frame) => ({
  ...style,
  frame,
  sheet: "enemies3",
  row: Math.floor(frame / 4),
  direction: ENEMIES3_DIRECTIONS[frame % ENEMIES3_DIRECTIONS.length]
}));

const STYLE_BY_ID = new Map(DECORATIVE_NPC_STYLES.map((style) => [style.id, style]));

export const CITY_DECORATIVE_NPCS = [
  decorativeNpc("cidade-neutro", 420, { direction: "front" }),
  decorativeNpc("cidade-comum-a", 690, { direction: "front" }),
  decorativeNpc("trabalhador-urbano", 870, { direction: "left" }),
  decorativeNpc("mendigo-rua", 1050, { direction: "front" }),
  decorativeNpc("comerciante-rua", 1230, { direction: "right" }),
  decorativeNpc("funcionario-urbano", 1410, { direction: "front" }),
  decorativeNpc("policial-farda", 1590, { direction: "left" }),
  decorativeNpc("idoso-cidade", 1770, { direction: "front" })
];

const RAID_DECORATIVE_SETS = {
  praia: [
    ["turista-mochila", 330, "front"],
    ["praia-homem", 620, "right"],
    ["vendedor-praia", 900, "front"],
    ["praia-mulher", 1210, "left"],
    ["turista-camera", 1510, "front"]
  ],
  comercio: [
    ["comerciante-rua", 340, "front"],
    ["feirante-banca", 650, "left"],
    ["vendedor-praia", 950, "right"],
    ["idoso-cidade", 1260, "front"],
    ["cidade-comum-a", 1560, "front"]
  ],
  empresa: [
    ["empresario-terno", 360, "front"],
    ["seguranca-rua", 660, "left"],
    ["funcionario-urbano", 960, "front"],
    ["turista-camera", 1260, "right"],
    ["cidade-neutro", 1560, "front"]
  ],
  urbano: [
    ["trabalhador-urbano", 350, "front"],
    ["cidade-comum-a", 650, "right"],
    ["mendigo-rua", 950, "front"],
    ["morador-rua", 1240, "left"],
    ["suspeito-rua", 1540, "front"]
  ]
};

export function decorativeNpcsForIdleMap(mapId) {
  const sets = {
    prisao: [
      decorativeNpc("policial-farda", 350, { direction: "front" }),
      decorativeNpc("seguranca-rua", 620, { direction: "left" }),
      decorativeNpc("criminoso-rua", 980, { direction: "front" }),
      decorativeNpc("suspeito-rua", 1270, { direction: "right" }),
      decorativeNpc("morador-rua", 1560, { direction: "front" })
    ],
    hospital: [
      decorativeNpc("hospital-neutro", 470, { direction: "front" }),
      decorativeNpc("idoso-cidade", 760, { direction: "right" }),
      decorativeNpc("funcionario-urbano", 1080, { direction: "front" }),
      decorativeNpc("cidade-comum-a", 1390, { direction: "left" })
    ],
    petshop: []
  };
  return cloneDecorativeNpcs(sets[mapId] || []);
}

export function decorativeNpcsForRaidMap(map) {
  const set = RAID_DECORATIVE_SETS[decorativeSetForMap(map)] || RAID_DECORATIVE_SETS.urbano;
  return set.map(([styleId, x, direction]) => decorativeNpc(styleId, x, { direction, context: map?.id || "raid" }));
}

export function decorativeNpc(styleId, x, options = {}) {
  const style = STYLE_BY_ID.get(styleId) || DECORATIVE_NPC_STYLES[0];
  return {
    id: options.id || `decor-${options.context || "map"}-${style.id}-${Math.round(x)}`,
    styleId: style.id,
    name: style.name,
    category: style.category,
    decorative: true,
    passive: true,
    sheet: style.sheet,
    row: style.row,
    direction: options.direction || style.direction,
    x,
    heightScale: options.heightScale || 0.92
  };
}

function decorativeSetForMap(map) {
  const name = `${map?.name || ""} ${map?.code || ""}`;
  if (/camping|orla|marina/i.test(name)) return "praia";
  if (/mercadinho|feira|calcadao|comercial|galeria|barzinho/i.test(name)) return "comercio";
  if (/vip|condominio|garagem|empresarial|cobertura|mansoes|clube|torre|cofre/i.test(name)) return "empresa";
  return "urbano";
}

function cloneDecorativeNpcs(npcs) {
  return npcs.map((npc) => ({ ...npc }));
}
