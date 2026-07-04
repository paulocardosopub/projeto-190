export const RARITY_ORDER = ["comum", "incomum", "raro", "epico", "lendario", "mestre"];

export const rarityConfig = {
  comum: {
    id: "comum",
    label: "Comum",
    color: "Cinza",
    colorHex: "#9b9b9b",
    visual: "Borda cinza, sem brilho, aparencia simples e desgastada.",
    drops: true
  },
  incomum: {
    id: "incomum",
    label: "Incomum",
    color: "Verde",
    colorHex: "#47b764",
    visual: "Borda verde, visual mais limpo e reforcado.",
    drops: true
  },
  raro: {
    id: "raro",
    label: "Raro",
    color: "Azul",
    colorHex: "#4d92d8",
    visual: "Borda azul, acabamento urbano mais profissional.",
    drops: true
  },
  epico: {
    id: "epico",
    label: "Epico",
    color: "Roxo",
    colorHex: "#b163d4",
    visual: "Borda roxa, aura leve e visual premium agressivo.",
    drops: true,
    minDropMap: 19
  },
  lendario: {
    id: "lendario",
    label: "Lendario",
    color: "Dourado",
    colorHex: "#f0c85b",
    visual: "Borda dourada, brilho forte e aparencia unica.",
    drops: false,
    craftOnly: true
  },
  mestre: {
    id: "mestre",
    label: "Mestre",
    color: "Brilho especial",
    colorHex: "#f8f5c4",
    visual: "Borda especial animada, aura pulsante e particulas.",
    drops: false,
    craftOnly: true
  }
};

export const equipmentSlotsConfig = {
  weapon: {
    id: "weapon",
    label: "Arma",
    shortLabel: "AR",
    dropWeight: 40,
    npcPriceMultiplier: 1,
    stat: "danoBonus"
  },
  body: {
    id: "body",
    label: "Armadura",
    shortLabel: "AM",
    dropWeight: 35,
    npcPriceMultiplier: 1.1,
    stat: "hpBonus"
  },
  hands: {
    id: "hands",
    label: "Luvas",
    shortLabel: "LU",
    dropWeight: 25,
    npcPriceMultiplier: 1.25,
    stat: "furtoBonus"
  }
};

export const priceConfig = {
  sellPercent: 0.3,
  baseByRarityTier: {
    comum: { 1: 250, 2: 450, 3: 800, 4: 1400 },
    incomum: { 1: 2400, 2: 4300, 3: 7800, 4: 14000 },
    raro: { 1: 25000, 2: 45000, 3: 81000, 4: 145000 },
    epico: { 1: 260000, 2: 470000, 3: 850000, 4: 1500000 },
    lendario: { 1: 3000000, 2: 5400000, 3: 9700000, 4: 17500000 },
    mestre: { 1: 35000000, 2: 63000000, 3: 113000000, 4: 200000000 }
  }
};

const itemRows = [
  {
    rarity: "comum",
    tier: 1,
    weapon: ["Canivete Enferrujado", 8],
    body: ["Camisa Grossa", 80],
    hands: ["Luva de Pano", 1]
  },
  {
    rarity: "comum",
    tier: 2,
    weapon: ["Faca de Cozinha Gasta", 14],
    body: ["Jaqueta Remendada", 140],
    hands: ["Luva de Feira", 1.3]
  },
  {
    rarity: "comum",
    tier: 3,
    weapon: ["Cano Curto", 24],
    body: ["Moletom Reforcado", 240],
    hands: ["Luva Emborrachada", 1.6]
  },
  {
    rarity: "comum",
    tier: 4,
    weapon: ["Taco Rachado", 40],
    body: ["Jaqueta de Motoboy", 400],
    hands: ["Luva de Motoboy", 2]
  },
  {
    rarity: "incomum",
    tier: 1,
    weapon: ["Faca de Beco", 70],
    body: ["Colete de Couro", 700],
    hands: ["Luva de Couro", 2.4]
  },
  {
    rarity: "incomum",
    tier: 2,
    weapon: ["Bastao Encapado", 120],
    body: ["Jaqueta Forrada", 1200],
    hands: ["Luva de Oficina", 2.8]
  },
  {
    rarity: "incomum",
    tier: 3,
    weapon: ["Pe-de-Cabra Leve", 200],
    body: ["Colete Urbano", 2000],
    hands: ["Luva Antiderrapante", 3.2]
  },
  {
    rarity: "incomum",
    tier: 4,
    weapon: ["Bastao de Metal", 340],
    body: ["Colete Tatico Simples", 3400],
    hands: ["Luva de Piloto", 3.6]
  },
  {
    rarity: "raro",
    tier: 1,
    weapon: ["Punhal de Aco Azul", 575],
    body: ["Colete Reforcado Azul", 5750],
    hands: ["Luva de Veludo Azul", 4]
  },
  {
    rarity: "raro",
    tier: 2,
    weapon: ["Bastao Azul Reforcado", 975],
    body: ["Jaqueta Balistica Leve", 9750],
    hands: ["Luva de Seda Tecnica", 4.5]
  },
  {
    rarity: "raro",
    tier: 3,
    weapon: ["Lamina da Orla", 1650],
    body: ["Colete de Seguranca", 16500],
    hands: ["Luva de Precisao", 5]
  },
  {
    rarity: "raro",
    tier: 4,
    weapon: ["Lamina de Aco Frio", 2800],
    body: ["Armadura Urbana Azul", 28000],
    hands: ["Luva de Mao-Leve", 5.5]
  },
  {
    rarity: "epico",
    tier: 1,
    weapon: ["Lamina Roxa do Corre", 4750],
    body: ["Colete Noturno", 47500],
    hands: ["Luva Fantasma", 6]
  },
  {
    rarity: "epico",
    tier: 2,
    weapon: ["Bastao Violeta", 8050],
    body: ["Jaqueta de Fibra Roxa", 80500],
    hands: ["Luva de Sombra", 6.6]
  },
  {
    rarity: "epico",
    tier: 3,
    weapon: ["Lamina do Apagao", 13650],
    body: ["Colete do Apagao", 136500],
    hands: ["Luva do Apagao", 7.2]
  },
  {
    rarity: "epico",
    tier: 4,
    weapon: ["Punhal Eclipse", 23200],
    body: ["Armadura Eclipse Urbana", 232000],
    hands: ["Luva Eclipse", 7.8]
  },
  {
    rarity: "lendario",
    tier: 1,
    weapon: ["Lamina do Chefao", 39500],
    body: ["Colete de Ouro Velho", 395000],
    hands: ["Luva Mao-Leve Dourada", 8.2]
  },
  {
    rarity: "lendario",
    tier: 2,
    weapon: ["Bastao Rei da Rua", 67000],
    body: ["Jaqueta do Rei da Rua", 670000],
    hands: ["Luva Rei da Rua", 8.6]
  },
  {
    rarity: "lendario",
    tier: 3,
    weapon: ["Punhal Coroa de Ouro", 114000],
    body: ["Colete Coroa de Ouro", 1140000],
    hands: ["Luva Coroa de Ouro", 9]
  },
  {
    rarity: "lendario",
    tier: 4,
    weapon: ["Lamina 190 Dourada", 195000],
    body: ["Armadura 190 Dourada", 1950000],
    hands: ["Luva 190 Dourada", 9.4]
  },
  {
    rarity: "mestre",
    tier: 1,
    weapon: ["Lamina do Mestre do Beco", 330000],
    body: ["Colete do Mestre", 3300000],
    hands: ["Luva Mestre do Furto", 9.6]
  },
  {
    rarity: "mestre",
    tier: 2,
    weapon: ["Bastao Reluzente do Mestre", 560000],
    body: ["Armadura Reluzente", 5600000],
    hands: ["Luva Reluzente", 9.75]
  },
  {
    rarity: "mestre",
    tier: 3,
    weapon: ["Punhal Aurora", 950000],
    body: ["Armadura Aurora", 9500000],
    hands: ["Luva Aurora", 9.9]
  },
  {
    rarity: "mestre",
    tier: 4,
    weapon: ["Lamina Suprema 190", 1600000],
    body: ["Armadura Suprema 190", 16000000],
    hands: ["Luva Suprema 190", 10]
  }
];

export const itemsConfig = itemRows.flatMap((row) => (
  Object.keys(equipmentSlotsConfig).map((slot) => createItemConfig(slot, row.rarity, row.tier, ...row[slot]))
));

export const itemsConfigById = Object.fromEntries(itemsConfig.map((item) => [item.id, item]));

export const equipmentAliasConfig = buildEquipmentAliases();

const mapRows = [
  [1, 1, "Beco do Camping", 80, 4, 6, 8],
  [2, 1, "Praca do Aperto", 120, 6, 8, 8.5],
  [3, 1, "Mercadinho da Esquina", 180, 9, 10, 9],
  [4, 1, "Ponto de Onibus", 270, 13, 12, 9.5],
  [5, 1, "Feira de Bairro", 400, 18, 14, 10],
  [6, 1, "Calcadao Popular", 600, 26, 16, 11],
  [7, 2, "Vila do Corre", 900, 38, 18, 12],
  [8, 2, "Terminal Urbano", 1350, 55, 20, 13],
  [9, 2, "Centro Comercial", 2000, 80, 22, 14],
  [10, 2, "Rua dos Barzinhos", 3000, 115, 24, 15],
  [11, 2, "Oficina Fechada", 4500, 165, 26, 16],
  [12, 2, "Feira Grande", 6700, 240, 28, 17],
  [13, 3, "Orla Movimentada", 10000, 350, 30, 18],
  [14, 3, "Galeria da Zona Sul", 15000, 510, 32, 19],
  [15, 3, "Evento VIP", 22500, 740, 34, 20],
  [16, 3, "Condominio Alto", 33500, 1070, 36, 21],
  [17, 3, "Garagem de Importados", 50000, 1550, 38, 22],
  [18, 3, "Avenida Empresarial", 75000, 2250, 40, 23],
  [19, 4, "Marina de Luxo", 110000, 3250, 43, 24],
  [20, 4, "Cobertura Blindada", 165000, 4700, 46, 25],
  [21, 4, "Mansoes do Lago", 245000, 6800, 49, 26],
  [22, 4, "Clube Fechado", 365000, 9800, 52, 27],
  [23, 4, "Torre dos Milionarios", 545000, 14200, 55, 28],
  [24, 4, "Cofre da Cidade", 800000, 20500, 58, 30]
];

export const mapsConfig = mapRows.map(([index, tier, name, enemyHp, enemyDamage, stealRisk, dropChance]) => {
  const codeIndex = ((index - 1) % 6) + 1;
  const background = backgroundForMap(index, tier);
  return {
    id: `mapa-${index}`,
    index,
    mapNumber: index,
    tier,
    act: tier,
    code: `${tier}-${codeIndex}`,
    name,
    backgroundSheet: background.sheet,
    backgroundRow: background.row,
    difficulty: difficultyForMap(tier, codeIndex),
    money: moneyForMap(index),
    xp: xpForMap(index, enemyHp),
    enemyLevel: index,
    hpInimigo: enemyHp,
    enemyHp,
    danoInimigo: enemyDamage,
    enemyDamage,
    riscoFurtoMapa: stealRisk,
    stealRisk,
    chanceDropEquipamento: dropChance,
    equipmentDropChance: dropChance,
    custoStamina: staminaCostForMap(index),
    staminaCost: staminaCostForMap(index),
    custoStaminaBoss: staminaCostForMap(index) * 4,
    bossStaminaCost: staminaCostForMap(index) * 4,
    lootTableId: index,
    description: mapDescription(tier)
  };
});

export const lootTables = {
  1: loot([["comum", 1, 100]]),
  2: loot([["comum", 1, 80], ["comum", 2, 20]]),
  3: loot([["comum", 1, 60], ["comum", 2, 35], ["incomum", 1, 5]]),
  4: loot([["comum", 2, 70], ["comum", 1, 15], ["incomum", 1, 15]]),
  5: loot([["comum", 2, 45], ["comum", 3, 30], ["incomum", 1, 20], ["incomum", 2, 5]]),
  6: loot([["comum", 3, 40], ["comum", 2, 25], ["comum", 4, 15], ["incomum", 1, 15], ["incomum", 2, 5]]),
  7: loot([["comum", 3, 35], ["comum", 4, 30], ["incomum", 1, 25], ["incomum", 2, 10]]),
  8: loot([["comum", 4, 35], ["incomum", 1, 30], ["incomum", 2, 25], ["raro", 1, 10]]),
  9: loot([["comum", 4, 25], ["incomum", 2, 35], ["incomum", 3, 25], ["raro", 1, 15]]),
  10: loot([["incomum", 2, 30], ["incomum", 3, 30], ["raro", 1, 25], ["raro", 2, 15]]),
  11: loot([["incomum", 3, 35], ["incomum", 4, 25], ["raro", 1, 25], ["raro", 2, 15]]),
  12: loot([["incomum", 4, 35], ["raro", 1, 30], ["raro", 2, 25], ["raro", 3, 10]]),
  13: loot([["incomum", 4, 30], ["raro", 1, 25], ["raro", 2, 30], ["raro", 3, 15]]),
  14: loot([["raro", 1, 30], ["raro", 2, 30], ["raro", 3, 25], ["incomum", 4, 15]]),
  15: loot([["raro", 2, 35], ["raro", 3, 30], ["raro", 4, 20], ["incomum", 4, 15]]),
  16: loot([["raro", 2, 25], ["raro", 3, 35], ["raro", 4, 30], ["incomum", 4, 10]]),
  17: loot([["raro", 3, 35], ["raro", 4, 40], ["raro", 2, 15], ["incomum", 4, 10]]),
  18: loot([["raro", 4, 50], ["raro", 3, 35], ["incomum", 4, 15]]),
  19: loot([["raro", 4, 45], ["raro", 3, 20], ["incomum", 4, 20], ["epico", 1, 15]]),
  20: loot([["raro", 4, 40], ["epico", 1, 25], ["epico", 2, 10], ["raro", 3, 25]]),
  21: loot([["raro", 4, 35], ["epico", 1, 30], ["epico", 2, 20], ["epico", 3, 5], ["raro", 3, 10]]),
  22: loot([["epico", 1, 30], ["epico", 2, 30], ["epico", 3, 15], ["raro", 4, 25]]),
  23: loot([["epico", 2, 35], ["epico", 3, 25], ["epico", 4, 10], ["raro", 4, 30]]),
  24: loot([["epico", 2, 25], ["epico", 3, 35], ["epico", 4, 20], ["raro", 4, 20]])
};

export const craftConfig = {
  requiredItems: 4,
  failureChance: 0.5,
  failureStartsAtDestinationRarity: "raro",
  failureResultRule: "Ao tentar criar Raro ou superior: 50% de chance de sucesso e 50% de chance de falha. Em caso de falha, voce recupera 1 dos itens gastos.",
  noFailure: false,
  costBaseByDestinationRarity: {
    comum: 100,
    incomum: 500,
    raro: 2500,
    epico: 12000,
    lendario: 60000,
    mestre: 250000
  },
  resultRule: "4 itens do mesmo slot, mesma raridade e mesmo tier criam o proximo tier ou a proxima raridade."
};

export const progressionConfig = [
  { fromMap: 1, toMap: 3, expectedEquipment: "Comum T1 a T2" },
  { fromMap: 4, toMap: 6, expectedEquipment: "Comum T2 a T4" },
  { fromMap: 7, toMap: 9, expectedEquipment: "Comum T4 / Incomum T1 a T2" },
  { fromMap: 10, toMap: 12, expectedEquipment: "Incomum T2 a T4 / Raro T1" },
  { fromMap: 13, toMap: 15, expectedEquipment: "Raro T1 a T3" },
  { fromMap: 16, toMap: 18, expectedEquipment: "Raro T3 a T4" },
  { fromMap: 19, toMap: 21, expectedEquipment: "Raro T4 / Epico T1 a T2" },
  { fromMap: 22, toMap: 24, expectedEquipment: "Epico T2 a T4" },
  { fromMap: 25, toMap: Infinity, expectedEquipment: "Lendario e Mestre via craft" }
];

export const enemyMultipliersConfig = {
  common: { hp: 1, damage: 1 },
  elite: { hp: 2, damage: 1.4 },
  miniBoss: { hp: 5, damage: 2 },
  mapBoss: { hp: 10, damage: 2.5, equipmentDropMultiplier: 2 }
};

export const theftConfig = {
  baseChance: 88,
  minChance: 20,
  maxChance: 95,
  caughtChanceMultiplier: 1,
  formula: "chanceSucessoFurto = clamp(88 - riscoFurtoMapa + bonusLuvas + bonusCarro, 20, 95)"
};

export const npcShopConfig = {
  npcName: "Receptador",
  refreshMs: 6 * 60 * 60 * 1000,
  sellPercent: priceConfig.sellPercent,
  manualRefreshCostByMapTier: {
    1: 1000,
    2: 10000,
    3: 75000,
    4: 500000
  },
  offersByMapTier: {
    1: 3,
    2: 4,
    3: 5,
    4: 6
  },
  rarityChanceByMapTier: {
    1: weighted({ comum: 85, incomum: 15, raro: 0, epico: 0 }),
    2: weighted({ comum: 35, incomum: 50, raro: 15, epico: 0 }),
    3: weighted({ comum: 0, incomum: 20, raro: 80, epico: 0 }),
    4: weighted({ comum: 0, incomum: 0, raro: 65, epico: 35 })
  },
  poolByMapTier: {
    1: [
      { rarity: "comum", tiers: [1, 2, 3, 4] },
      { rarity: "incomum", tiers: [1, 2] }
    ],
    2: [
      { rarity: "comum", tiers: [3, 4] },
      { rarity: "incomum", tiers: [1, 2, 3, 4] },
      { rarity: "raro", tiers: [1, 2] }
    ],
    3: [
      { rarity: "incomum", tiers: [4] },
      { rarity: "raro", tiers: [1, 2, 3, 4] }
    ],
    4: [
      { rarity: "raro", tiers: [3, 4] },
      { rarity: "epico", tiers: [1, 2, 3, 4] }
    ]
  },
  slotWeights: weighted({
    weapon: equipmentSlotsConfig.weapon.dropWeight,
    body: equipmentSlotsConfig.body.dropWeight,
    hands: equipmentSlotsConfig.hands.dropWeight
  })
};

export const staminaConfig = {
  staminaMaxBase: 120,
  staminaRegenBaseNoEsconderijo: 0.5,
  states: [
    { id: "descansado", label: "Descansado", minPercent: 60, maxPercent: 100, effect: "Sem penalidade" },
    { id: "atento", label: "Atento", minPercent: 30, maxPercent: 59, effect: "Sem penalidade" },
    { id: "cansado", label: "Cansado", minPercent: 10, maxPercent: 29, effect: "Aviso visual" },
    { id: "esgotado", label: "Esgotado", minPercent: 1, maxPercent: 9, effect: "Aviso forte" },
    { id: "sem-stamina", label: "Sem stamina", minPercent: 0, maxPercent: 0, effect: "Nao pode iniciar novo assalto" }
  ],
  emptyMessage: "Voce esta sem stamina. Volte para o esconderijo para descansar.",
  insufficientMessage: "Stamina insuficiente. Volte para o esconderijo e descanse perto da barraca."
};

const unlockRequirements = [
  { tier: 1, requiredMap: 1, requiredLevel: 1 },
  { tier: 2, requiredMap: 3, requiredLevel: 5 },
  { tier: 3, requiredMap: 6, requiredLevel: 10 },
  { tier: 4, requiredMap: 9, requiredLevel: 20 },
  { tier: 5, requiredMap: 12, requiredLevel: 35 },
  { tier: 6, requiredMap: 15, requiredLevel: 50 },
  { tier: 7, requiredMap: 18, requiredLevel: 75 },
  { tier: 8, requiredMap: 21, requiredLevel: 100 },
  { tier: 9, requiredMap: 24, requiredLevel: 150 }
];

export const housesConfig = [
  ["Barraca de Camping", 0, 5, 10, 0.5, 1],
  ["Barraco de Madeira", 7500, 20, 25, 0.8, 0.95],
  ["Casa Simples", 30000, 75, 45, 1.2, 0.9],
  ["Casa de Alvenaria", 150000, 250, 70, 1.7, 0.85],
  ["Sobrado Urbano", 750000, 850, 100, 2.3, 0.8],
  ["Casa Moderna com Garagem", 3500000, 2800, 135, 3, 0.75],
  ["Casa Premium com Piscina", 15000000, 8000, 175, 4, 0.7],
  ["Mansao de Luxo", 60000000, 22000, 220, 5.2, 0.65],
  ["Mansao de Vidro Blindada", 200000000, 55000, 280, 6.8, 0.6]
].map(([name, price, passiveIncomePerMinute, staminaMaxBonus, staminaRegenBonus, rechargeMultiplier], index) => ({
  id: `house-t${index + 1}`,
  tier: index + 1,
  name,
  price,
  passiveIncomePerMinute,
  staminaMaxBonus,
  staminaRegenBonus,
  rechargeMultiplier,
  ...unlockRequirements[index]
}));

export const carsConfig = [
  ["Carroca de Madeira", 0, 3, 0.3],
  ["Charrete Simples", 5000, 12, 0.6],
  ["Fusca Velho", 25000, 45, 1],
  ["Hatch Popular", 120000, 150, 1.5],
  ["Sedan Arrumado", 600000, 500, 2.1],
  ["Caminhonete Reforcada", 2500000, 1800, 2.8],
  ["SUV Blindada", 10000000, 5000, 3.5],
  ["Esportivo Importado", 45000000, 14000, 4.3],
  ["Lamborghini 190", 150000000, 35000, 5]
].map(([name, price, passiveIncomePerMinute, furtoBonus], index) => ({
  id: `car-t${index + 1}`,
  tier: index + 1,
  name,
  price,
  passiveIncomePerMinute,
  furtoBonus,
  ...unlockRequirements[index]
}));

export const passiveIncomeConfig = {
  vaultName: "Cofre do Esconderijo",
  offlineLimitFormula: "limiteHorasOffline = min(4 + casaTier * 0.75 + carroTier * 0.25 + bonusHorasTerreno, 18)",
  maxOfflineHours: 18
};

export const cityOldManNpcConfig = {
  id: "seu-zeca",
  name: "Seu Zeca, o Velho da Cidade",
  tabs: ["Comprar Esconderijo", "Comprar Casa", "Comprar Carro", "Vender Itens"],
  canSellHousesAndCarsBack: false
};

export const hideoutLandConfig = [
  ["Lote Abandonado", 0, 1, 1, "Pequeno", 1, 0],
  ["Quintal Cercado", 50000, 5, 10, "Pequeno/Medio", 1.05, 1],
  ["Terreno de Chacara", 500000, 10, 25, "Medio", 1.1, 2],
  ["Sitio Escondido", 4000000, 15, 50, "Medio/Grande", 1.17, 3],
  ["Fazenda Fechada", 30000000, 20, 90, "Grande", 1.25, 4],
  ["Complexo Blindado 190", 150000000, 24, 150, "Muito grande", 1.35, 6]
].map(([name, price, requiredMap, requiredLevel, visualSpace, passiveIncomeMultiplier, offlineHoursBonus], index) => ({
  id: `land-t${index + 1}`,
  tier: index + 1,
  name,
  price,
  requiredMap,
  requiredLevel,
  visualSpace,
  passiveIncomeMultiplier,
  passiveIncomeBonusPercent: Math.round((passiveIncomeMultiplier - 1) * 100),
  offlineHoursBonus
}));

export const hideoutConfig = {
  showsCurrentHouse: true,
  showsCurrentCar: true,
  showsPassiveVault: true,
  showsStaminaBar: true,
  usesActiveLandAsVisualTier: true,
  houseAction: "Descansar Agora",
  vaultAction: "Coletar"
};

export function getItemConfigById(id) {
  return itemsConfigById[resolveEquipmentId(id)];
}

export function resolveEquipmentId(id) {
  return equipmentAliasConfig[id] || id;
}

export function getEquipmentConfig(slot, rarity, tier) {
  return itemsConfig.find((item) => item.slot === slot && item.rarity === rarity && item.tier === tier) || null;
}

export function getMapConfigById(id) {
  return mapsConfig.find((map) => map.id === id);
}

export function getMapConfigByNumber(mapNumber) {
  return mapsConfig.find((map) => map.index === Number(mapNumber));
}

export function getMapTierForMapNumber(mapNumber) {
  return Math.max(1, Math.min(4, Math.ceil(Number(mapNumber || 1) / 6)));
}

export function getCraftResultConfig(item) {
  if (!item) return null;
  const rarity = item.rarity || item.raridade;
  const tier = Number(item.tier || 1);
  const slot = item.slot;
  if (!equipmentSlotsConfig[slot]) return null;

  if (tier < 4) return getEquipmentConfig(slot, rarity, tier + 1);
  const nextRarity = RARITY_ORDER[RARITY_ORDER.indexOf(rarity) + 1];
  if (!nextRarity) return null;
  return getEquipmentConfig(slot, nextRarity, 1);
}

export function getCraftCostForResult(resultItem) {
  if (!resultItem) return 0;
  const rarity = resultItem.rarity || resultItem.raridade;
  const tier = Number(resultItem.tier || 1);
  const baseCost = craftConfig.costBaseByDestinationRarity[rarity] || 0;
  return baseCost * tier;
}

export function getShopTierForHighestMap(highestMapUnlocked = 1) {
  return getMapTierForMapNumber(Math.max(1, Math.min(24, highestMapUnlocked)));
}

export function getHouseConfig(tier) {
  return housesConfig.find((house) => house.tier === Number(tier)) || null;
}

export function getCarConfig(tier) {
  return carsConfig.find((car) => car.tier === Number(tier)) || null;
}

export function getLandConfig(tier) {
  return hideoutLandConfig.find((land) => land.tier === Number(tier)) || null;
}

function createItemConfig(slot, rarity, tier, name, bonus) {
  const slotConfig = equipmentSlotsConfig[slot];
  const rarityInfo = rarityConfig[rarity];
  const basePrice = priceConfig.baseByRarityTier[rarity][tier];
  const buyPrice = Math.round(basePrice * slotConfig.npcPriceMultiplier);
  const sellPrice = Math.round(buyPrice * priceConfig.sellPercent);
  const id = `${slot}-${rarity}-t${tier}`;
  const stats = {};
  if (slot === "weapon") stats.attack = bonus;
  if (slot === "body") stats.hp = bonus;
  if (slot === "hands") {
    stats.steal = bonus / 100;
    stats.stealBonus = bonus;
  }

  return {
    id,
    nome: name,
    name,
    slot,
    slotLabel: slotConfig.label,
    raridade: rarity,
    rarity,
    rarityLabel: rarityInfo.label,
    tier,
    cor: rarityInfo.color,
    color: rarityInfo.color,
    colorHex: rarityInfo.colorHex,
    danoBonus: slot === "weapon" ? bonus : 0,
    hpBonus: slot === "body" ? bonus : 0,
    furtoBonus: slot === "hands" ? bonus : 0,
    stats,
    price: buyPrice,
    buyPrice,
    sellPrice,
    precoNPCVende: buyPrice,
    precoNPCCompra: sellPrice,
    iconPath: equipmentIconPath(slot, id),
    dropa: Boolean(rarityInfo.drops && (!rarityInfo.minDropMap || rarityInfo.minDropMap <= 24)),
    craftOnly: Boolean(rarityInfo.craftOnly)
  };
}

function equipmentIconPath(slot, id) {
  if (slot === "weapon") return `src/inventory/icons/weapon/generated/${id}.png?v=icons-3`;
  if (slot === "body") return `src/inventory/icons/armor/generated/${id}.png?v=armor-1`;
  if (slot === "hands") return `src/inventory/icons/gloves/generated/${id}.png?v=gloves-1`;
  return null;
}

function buildEquipmentAliases() {
  const aliases = {};
  const legacyRarityTier = [
    ["comum", 1],
    ["comum", 2],
    ["comum", 3],
    ["comum", 4],
    ["incomum", 1],
    ["incomum", 2],
    ["raro", 1],
    ["epico", 1],
    ["epico", 2],
    ["epico", 4]
  ];
  Object.keys(equipmentSlotsConfig).forEach((slot) => {
    legacyRarityTier.forEach(([rarity, tier], index) => {
      aliases[`${slot}-${index + 1}`] = `${slot}-${rarity}-t${tier}`;
    });
  });
  aliases["head-1"] = "hands-comum-t1";
  aliases["face-1"] = "hands-comum-t1";
  aliases["accessory-1"] = "weapon-comum-t1";
  return aliases;
}

function backgroundForMap(index, tier) {
  if (tier === 1) {
    const rows = [1, 2, 3, 4, 5, 0];
    return { sheet: "backgrounds", row: rows[index - 1] ?? 0 };
  }
  return { sheet: `backgrounds${tier}`, row: (index - 1) % 6 };
}

function difficultyForMap(tier, index) {
  if (tier === 1 && index <= 2) return "Baixa";
  if (tier === 1 || (tier === 2 && index <= 3)) return "Media";
  if (tier <= 3) return "Alta";
  return "Muito alta";
}

function mapDescription(tier) {
  return {
    1: "Inicio do jogo, bairro simples, itens comuns e primeiros incomuns.",
    2: "Dificuldade intermediaria, dano maior e primeiros raros.",
    3: "Zona mais rica e perigosa, foco em raros fortes.",
    4: "Endgame com inimigos fortes e drops epicos liberados."
  }[tier];
}

function moneyForMap(index) {
  const min = Math.round(35 * Math.pow(1.43, index - 1));
  const max = Math.round(min * 2.35 + index * 45);
  return [min, max];
}

function xpForMap(index, enemyHp) {
  return Math.round(18 + index * 14 + Math.sqrt(enemyHp) * 2.2);
}

function staminaCostForMap(index) {
  return {
    1: 4,
    2: 5,
    3: 6,
    4: 7,
    5: 8,
    6: 9,
    7: 10,
    8: 11,
    9: 12,
    10: 13,
    11: 14,
    12: 16,
    13: 17,
    14: 18,
    15: 20,
    16: 22,
    17: 24,
    18: 26,
    19: 28,
    20: 30,
    21: 33,
    22: 36,
    23: 40,
    24: 45
  }[index] || 4;
}

function loot(entries) {
  return entries.map(([rarity, tier, chance]) => ({ rarity, tier, chance }));
}

function weighted(weights) {
  return Object.entries(weights)
    .filter(([, chance]) => chance > 0)
    .map(([id, chance]) => ({ id, chance }));
}
