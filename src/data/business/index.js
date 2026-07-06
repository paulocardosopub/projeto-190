export const BUSINESS_MAP_ID = "fazenda-laboratorio";
export const BUSINESS_NPC_ID = "npc-empresario-negocios";
export const BUSINESS_UNLOCK_LEVEL = 10;
export const AUTO_RAID_UNLOCK_LEVEL = 3;

export const BUSINESS_PRODUCT_ORDER = ["weed", "ecstasy", "cocaineInput", "cocaine"];
export const SELLABLE_BUSINESS_PRODUCTS = ["weed", "ecstasy", "cocaine"];
export const FARM_PRODUCT_TYPES = ["weed", "cocaineInput"];
export const LAB_PRODUCT_TYPES = ["ecstasy", "cocaine"];

export const BUSINESS_CONFIG = {
  productionContinuesOffline: true,
  shopPersistsWhenOwnerOffline: true,
  saleTaxPercent: 5,
  saleTaxRate: 0.05,
  maxActiveShops: 8,
  products: {
    weed: {
      id: "weed",
      label: "Maconha",
      source: "farm",
      inventoryDrugId: "weed",
      suggestedPrice: 450,
      minPrice: 300,
      maxPrice: 800,
      basePerHour: 10,
      minFarmLevel: 1,
      internal: false
    },
    ecstasy: {
      id: "ecstasy",
      label: "Bala / Ecstasy",
      source: "lab",
      inventoryDrugId: "ecstasy",
      suggestedPrice: 400,
      minPrice: 280,
      maxPrice: 750,
      basePerHour: 8,
      minLabLevel: 1,
      internal: false
    },
    cocaineInput: {
      id: "cocaineInput",
      label: "Folha de coca",
      source: "farm",
      suggestedPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      basePerHour: 14,
      minFarmLevel: 2,
      internal: true
    },
    cocaine: {
      id: "cocaine",
      label: "Cocaina",
      source: "lab",
      inventoryDrugId: "cocaine",
      suggestedPrice: 900,
      minPrice: 650,
      maxPrice: 1600,
      basePerHour: 12,
      minFarmLevel: 2,
      minLabLevel: 2,
      consumes: {
        productType: "cocaineInput",
        quantityPerUnit: 1
      },
      internal: false
    }
  },
  farmLevels: {
    1: { cost: 100000, multiplier: 1, capacity: 50 },
    2: { cost: 150000, multiplier: 1.6, capacity: 100 },
    3: { cost: 250000, multiplier: 2.4, capacity: 180 },
    4: { cost: 1000000, multiplier: 3.5, capacity: 300 },
    5: { cost: 2000000, multiplier: 5, capacity: 500 }
  },
  labLevels: {
    1: { cost: 250000, multiplier: 1, capacity: 40 },
    2: { cost: 400000, multiplier: 1.6, capacity: 90 },
    3: { cost: 1000000, multiplier: 2.4, capacity: 160 },
    4: { cost: 2500000, multiplier: 3.5, capacity: 280 },
    5: { cost: 5000000, multiplier: 5, capacity: 450 }
  },
  shopSlots: [
    { id: "loja-1", x: 360 },
    { id: "loja-2", x: 520 },
    { id: "loja-3", x: 680 },
    { id: "loja-4", x: 840 },
    { id: "loja-5", x: 1220 },
    { id: "loja-6", x: 1380 },
    { id: "loja-7", x: 1540 },
    { id: "loja-8", x: 1700 }
  ],
  messages: {
    noMoneyProperty: "Sem grana pra esse investimento.",
    noMoneyUpgrade: "Volta quando tiver mais dinheiro.",
    stockFull: "Teu estoque ta cheio.",
    missingStructure: "Tu ainda nao tem estrutura pra isso.",
    missingCocaineInput: "Falta material da fazenda.",
    invalidPrice: "Esse preco ta fora do limite permitido.",
    missingStock: "Tu nao tem essa quantidade no estoque.",
    shopCreated: "Lojinha aberta.",
    shopClosed: "Lojinha fechada.",
    itemSold: "Venda realizada.",
    purchaseDone: "Compra concluida.",
    ownShop: "Tu nao pode comprar da tua propria loja.",
    noShopSlot: "Nao tem espaco para abrir outra lojinha agora."
  }
};

export function businessProductConfig(productType) {
  return BUSINESS_CONFIG.products[productType] || null;
}

export function businessLevelConfig(source, level) {
  const levels = source === "lab" ? BUSINESS_CONFIG.labLevels : BUSINESS_CONFIG.farmLevels;
  return levels[Number(level)] || null;
}

export function businessSourceProducts(source) {
  return BUSINESS_PRODUCT_ORDER.filter((productType) => businessProductConfig(productType)?.source === source);
}
