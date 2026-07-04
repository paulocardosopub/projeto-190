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
    name: "Turista",
    sheet: "enemies3",
    row: 0,
    direction: "right",
    fixedFrame: true,
    contexts: ["praia", "empresa"],
    temperament: "distraido",
    baseHp: 72,
    baseAttack: 6
  },
  {
    id: "turista-camera",
    name: "Turista com Camera",
    sheet: "enemies3",
    row: 0,
    direction: "front",
    fixedFrame: true,
    contexts: ["praia", "empresa"],
    temperament: "curioso",
    baseHp: 76,
    baseAttack: 6
  },
  {
    id: "praia-homem",
    name: "Banhista",
    sheet: "enemies3",
    row: 0,
    direction: "back",
    fixedFrame: true,
    contexts: ["praia"],
    temperament: "relaxado",
    baseHp: 82,
    baseAttack: 7
  },
  {
    id: "praia-mulher",
    name: "Banhista",
    sheet: "enemies3",
    row: 0,
    direction: "left",
    fixedFrame: true,
    contexts: ["praia"],
    temperament: "atenta",
    baseHp: 80,
    baseAttack: 7
  },
  {
    id: "vendedor-praia-novo",
    name: "Vendedor de Praia",
    sheet: "enemies3",
    row: 1,
    direction: "right",
    fixedFrame: true,
    contexts: ["praia", "comercio"],
    temperament: "atento",
    baseHp: 100,
    baseAttack: 9
  },
  {
    id: "comerciante-rua",
    name: "Comerciante",
    sheet: "enemies3",
    row: 1,
    direction: "front",
    fixedFrame: true,
    contexts: ["comercio"],
    temperament: "esperto",
    baseHp: 96,
    baseAttack: 8
  },
  {
    id: "feirante-banca",
    name: "Feirante",
    sheet: "enemies3",
    row: 1,
    direction: "back",
    fixedFrame: true,
    contexts: ["comercio"],
    temperament: "desconfiado",
    baseHp: 98,
    baseAttack: 8
  },
  {
    id: "trabalhador-urbano",
    name: "Trabalhador",
    sheet: "enemies3",
    row: 1,
    direction: "left",
    fixedFrame: true,
    contexts: ["urbano", "comercio"],
    temperament: "cansado",
    baseHp: 92,
    baseAttack: 8
  },
  {
    id: "policial-farda",
    name: "Policial",
    sheet: "enemies3",
    row: 2,
    direction: "right",
    fixedFrame: true,
    contexts: ["urbano", "empresa"],
    temperament: "duro",
    baseHp: 138,
    baseAttack: 13
  },
  {
    id: "seguranca-rua",
    name: "Seguranca",
    sheet: "enemies3",
    row: 2,
    direction: "front",
    fixedFrame: true,
    contexts: ["empresa"],
    temperament: "duro",
    baseHp: 132,
    baseAttack: 12
  },
  {
    id: "mendigo-rua",
    name: "Morador de Rua",
    sheet: "enemies3",
    row: 2,
    direction: "back",
    fixedFrame: true,
    contexts: ["urbano"],
    temperament: "imprevisivel",
    baseHp: 88,
    baseAttack: 8
  },
  {
    id: "morador-rua-novo",
    name: "Morador",
    sheet: "enemies3",
    row: 2,
    direction: "left",
    fixedFrame: true,
    contexts: ["urbano"],
    temperament: "atento",
    baseHp: 90,
    baseAttack: 8
  },
  {
    id: "empresario-terno",
    name: "Empresario",
    sheet: "enemies3",
    row: 3,
    direction: "right",
    fixedFrame: true,
    contexts: ["empresa"],
    temperament: "apressado",
    baseHp: 94,
    baseAttack: 9
  },
  {
    id: "idoso-cidade",
    name: "Idoso",
    sheet: "enemies3",
    row: 3,
    direction: "front",
    fixedFrame: true,
    contexts: ["comercio", "urbano"],
    temperament: "calmo",
    baseHp: 78,
    baseAttack: 6
  },
  {
    id: "cidade-comum-a",
    name: "Pedestre",
    sheet: "enemies3",
    row: 3,
    direction: "back",
    fixedFrame: true,
    contexts: ["urbano", "comercio"],
    temperament: "comum",
    baseHp: 86,
    baseAttack: 7
  },
  {
    id: "cidade-neutro",
    name: "Pedestre",
    sheet: "enemies3",
    row: 3,
    direction: "left",
    fixedFrame: true,
    contexts: ["urbano", "empresa"],
    temperament: "neutro",
    baseHp: 84,
    baseAttack: 7
  },
  {
    id: "suspeito-rua",
    name: "Suspeito",
    sheet: "enemies3",
    row: 4,
    direction: "right",
    fixedFrame: true,
    contexts: ["urbano"],
    temperament: "nervoso",
    baseHp: 106,
    baseAttack: 10
  },
  {
    id: "criminoso-rua",
    name: "Criminoso",
    sheet: "enemies3",
    row: 4,
    direction: "front",
    fixedFrame: true,
    contexts: ["urbano", "empresa"],
    temperament: "agressivo",
    baseHp: 118,
    baseAttack: 11
  },
  {
    id: "hospital-neutro",
    name: "Paciente",
    sheet: "enemies3",
    row: 4,
    direction: "back",
    fixedFrame: true,
    contexts: ["urbano", "comercio"],
    temperament: "fraco",
    baseHp: 74,
    baseAttack: 6
  },
  {
    id: "funcionario-urbano",
    name: "Funcionario",
    sheet: "enemies3",
    row: 4,
    direction: "left",
    fixedFrame: true,
    contexts: ["empresa", "comercio"],
    temperament: "ocupado",
    baseHp: 90,
    baseAttack: 8
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
