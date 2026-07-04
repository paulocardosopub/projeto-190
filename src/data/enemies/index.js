export const NPC_TYPES = [
  {
    id: "dona-aurora",
    name: "Dona Aurora",
    sheet: "enemies",
    row: 0,
    temperament: "desconfiada",
    baseHp: 70,
    baseAttack: 5
  },
  {
    id: "seu-valdir",
    name: "Seu Valdir",
    sheet: "enemies",
    row: 1,
    temperament: "esquentado",
    baseHp: 95,
    baseAttack: 8
  },
  {
    id: "morador-rua",
    name: "Morador da Rua",
    sheet: "enemies",
    row: 2,
    temperament: "imprevisivel",
    baseHp: 82,
    baseAttack: 7
  },
  {
    id: "surfista",
    name: "Surfista",
    sheet: "enemies2",
    row: 0,
    temperament: "distraido",
    baseHp: 86,
    baseAttack: 7
  },
  {
    id: "turista",
    name: "Turista",
    sheet: "enemies2",
    row: 1,
    temperament: "curiosa",
    baseHp: 74,
    baseAttack: 6
  },
  {
    id: "vendedor-praia",
    name: "Vendedor de Praia",
    sheet: "enemies2",
    row: 2,
    temperament: "atento",
    baseHp: 102,
    baseAttack: 9
  },
  {
    id: "seguranca",
    name: "Seguranca",
    sheet: "enemies2",
    row: 3,
    temperament: "duro",
    baseHp: 132,
    baseAttack: 12
  },
  {
    id: "feirante",
    name: "Feirante",
    sheet: "enemies2",
    row: 4,
    temperament: "esperta",
    baseHp: 96,
    baseAttack: 8
  },
  {
    id: "executivo",
    name: "Executivo",
    sheet: "enemies2",
    row: 5,
    temperament: "apressado",
    baseHp: 90,
    baseAttack: 8
  },
  {
    id: "idoso",
    name: "Idoso",
    sheet: "enemies2",
    row: 6,
    temperament: "calmo",
    baseHp: 78,
    baseAttack: 6
  },
  {
    id: "morador-abandonado",
    name: "Morador Abandonado",
    sheet: "enemies2",
    row: 7,
    temperament: "imprevisivel",
    baseHp: 110,
    baseAttack: 10
  },
  {
    id: "turista-mochila",
    name: "Entregador",
    sheet: "enemies3",
    row: 0,
    columnOffset: 0,
    direction: "front",
    heightScale: 0.96,
    contexts: ["urbano", "comercio"],
    temperament: "atento",
    baseHp: 90,
    baseAttack: 8
  },
  {
    id: "turista-camera",
    name: "Cantora de Praia",
    sheet: "enemies3",
    row: 0,
    columnOffset: 4,
    direction: "front",
    contexts: ["praia", "empresa"],
    heightScale: 0.96,
    temperament: "distraida",
    baseHp: 78,
    baseAttack: 7
  },
  {
    id: "medico-rua",
    name: "Medico",
    sheet: "enemies3",
    row: 1,
    columnOffset: 0,
    direction: "front",
    heightScale: 0.96,
    contexts: ["empresa", "comercio"],
    temperament: "nervoso",
    baseHp: 92,
    baseAttack: 8
  },
  {
    id: "gari-urbano",
    name: "Gari",
    sheet: "enemies3",
    row: 1,
    columnOffset: 4,
    direction: "front",
    heightScale: 0.96,
    contexts: ["urbano", "comercio"],
    temperament: "cansado",
    baseHp: 96,
    baseAttack: 8
  },
  {
    id: "fotografo-turista",
    name: "Fotografo",
    sheet: "enemies3",
    row: 2,
    columnOffset: 0,
    direction: "front",
    heightScale: 0.96,
    contexts: ["praia", "comercio"],
    temperament: "curioso",
    baseHp: 82,
    baseAttack: 7
  },
  {
    id: "skatista",
    name: "Skatista",
    sheet: "enemies3",
    row: 2,
    columnOffset: 4,
    direction: "front",
    heightScale: 0.96,
    contexts: ["urbano", "praia"],
    temperament: "ligeiro",
    baseHp: 88,
    baseAttack: 8
  },
  {
    id: "empresaria",
    name: "Empresaria",
    sheet: "enemies3",
    row: 3,
    columnOffset: 0,
    direction: "front",
    heightScale: 0.96,
    contexts: ["empresa"],
    temperament: "apressada",
    baseHp: 88,
    baseAttack: 8
  },
  {
    id: "mendigo-rua",
    name: "Morador de Rua",
    sheet: "enemies3",
    row: 3,
    columnOffset: 4,
    direction: "front",
    heightScale: 0.96,
    contexts: ["urbano"],
    temperament: "imprevisivel",
    baseHp: 92,
    baseAttack: 8
  },
  {
    id: "policial-farda",
    name: "Policial",
    sheet: "enemies3",
    row: 4,
    columnOffset: 0,
    direction: "front",
    heightScale: 0.96,
    contexts: ["urbano", "empresa"],
    temperament: "duro",
    baseHp: 138,
    baseAttack: 13
  },
  {
    id: "vendedor-churrasco",
    name: "Vendedor de Churrasco",
    sheet: "enemies3",
    row: 4,
    columnOffset: 4,
    direction: "front",
    heightScale: 0.96,
    contexts: ["comercio", "praia"],
    temperament: "atento",
    baseHp: 102,
    baseAttack: 9
  },
  {
    id: "empresario-terno",
    name: "Empresario",
    sheet: "enemies3",
    row: 5,
    columnOffset: 0,
    direction: "front",
    heightScale: 0.96,
    contexts: ["empresa"],
    temperament: "apressado",
    baseHp: 94,
    baseAttack: 9
  },
  {
    id: "enfermeira",
    name: "Enfermeira",
    sheet: "enemies3",
    row: 5,
    columnOffset: 4,
    direction: "front",
    heightScale: 0.96,
    contexts: ["empresa", "comercio"],
    temperament: "focada",
    baseHp: 84,
    baseAttack: 7
  },
  {
    id: "suspeito-rua",
    name: "Suspeito",
    sheet: "enemies3",
    row: 6,
    columnOffset: 0,
    direction: "front",
    heightScale: 0.96,
    contexts: ["urbano", "empresa"],
    temperament: "nervoso",
    baseHp: 112,
    baseAttack: 10
  },
  {
    id: "padeiro",
    name: "Padeiro",
    sheet: "enemies3",
    row: 6,
    columnOffset: 4,
    direction: "front",
    heightScale: 0.96,
    contexts: ["comercio"],
    temperament: "simpatico",
    baseHp: 90,
    baseAttack: 7
  },
  {
    id: "pescador",
    name: "Pescador",
    sheet: "enemies3",
    row: 7,
    columnOffset: 0,
    direction: "front",
    heightScale: 0.96,
    contexts: ["praia"],
    temperament: "calmo",
    baseHp: 98,
    baseAttack: 8
  },
  {
    id: "idosa-feira",
    name: "Senhora da Feira",
    sheet: "enemies3",
    row: 7,
    columnOffset: 4,
    direction: "front",
    heightScale: 0.96,
    contexts: ["comercio", "urbano"],
    temperament: "esperta",
    baseHp: 82,
    baseAttack: 6
  },
  {
    id: "estudante",
    name: "Estudante",
    sheet: "enemies3",
    row: 8,
    columnOffset: 0,
    direction: "front",
    heightScale: 0.96,
    contexts: ["urbano"],
    temperament: "distraido",
    baseHp: 78,
    baseAttack: 6
  },
  {
    id: "seguranca-rua",
    name: "Seguranca",
    sheet: "enemies3",
    row: 8,
    columnOffset: 4,
    direction: "front",
    contexts: ["urbano", "empresa"],
    heightScale: 0.96,
    temperament: "duro",
    baseHp: 132,
    baseAttack: 12
  },
  {
    id: "comerciante-rua",
    name: "Comerciante",
    sheet: "enemies3",
    row: 9,
    columnOffset: 0,
    direction: "front",
    heightScale: 0.96,
    contexts: ["urbano", "comercio"],
    temperament: "esperto",
    baseHp: 96,
    baseAttack: 8
  },
  {
    id: "vendedor-som",
    name: "Vendedor de Som",
    sheet: "enemies3",
    row: 9,
    columnOffset: 4,
    direction: "front",
    heightScale: 0.96,
    contexts: ["empresa", "comercio"],
    temperament: "ligado",
    baseHp: 94,
    baseAttack: 9
  }
];

export function npcTypesForMap(map) {
  const context = npcContextForMap(map);
  const contextual = NPC_TYPES.filter((type) => type.contexts?.includes(context));
  const base = NPC_TYPES.filter((type) => !type.contexts);
  return contextual.length ? [...contextual, ...base] : NPC_TYPES;
}

export function npcContextForMap(map) {
  const name = `${map?.name || ""} ${map?.code || ""}`;
  if (/camping|orla|marina/i.test(name)) return "praia";
  if (/mercadinho|feira|calcadao|comercial|galeria|barzinho/i.test(name)) return "comercio";
  if (/vip|condominio|garagem|empresarial|cobertura|mansoes|clube|torre|cofre/i.test(name)) return "empresa";
  return "urbano";
}

export const NPC_ALERT_LINES = [
  "O que pensa que esta fazendo?",
  "Ai voce ta de esculacho, ne?",
  "Vaza daqui antes que eu perca a paciencia!",
  "Ta maluco? Eu vi tudo!",
  "Mao leve comigo nao, parceiro.",
  "Achou que eu nao ia perceber?",
  "Ih, perdeu a linha bonito.",
  "Sai fora, folgado!",
  "Ta tentando me roubar na cara dura?",
  "Que papo e esse ai, hein?",
  "Pode ir tirando a mao dai.",
  "Aqui nao, espertinho.",
  "Tu ta brincando com a pessoa errada.",
  "Olha o golpe ai!",
  "Eu conheco malandro de longe.",
  "Devolve isso agora!",
  "Ta querendo arrumar problema?",
  "Nem tenta disfarcar.",
  "Peguei no flagra!",
  "Acha que eu sou otario?",
  "Pode parando por ai.",
  "Viu errado se achou que ia sair de graca.",
  "Sai andando antes que complique.",
  "Ta se achando muito ligeiro, ne?",
  "Isso aqui nao e bagunca nao.",
  "Vacilou feio comigo.",
  "Eu vi essa mao boba ai.",
  "Vai roubar outro, comigo nao cola.",
  "Ta querendo levar um susto?",
  "Some daqui enquanto da tempo."
];
