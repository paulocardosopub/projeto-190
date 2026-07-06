export const CITY_NPCS = [
  {
    id: "comerciante-itens",
    name: "Sr. Almeida",
    shopName: "Compra e Venda Almeida",
    role: "buyer",
    sheet: "enemies2",
    row: 5,
    x: 600,
    direction: "front",
    greeting: "Tenho interesse nos seus achados. Quer vender alguma coisa?"
  },
  {
    id: "npc-petshop",
    name: "Dr. Rubens",
    shopName: "Petshop",
    role: "petshop",
    sheet: "enemies3",
    row: 5,
    columnOffset: 0,
    heightScale: 0.96,
    x: 1840,
    direction: "front",
    greeting: "Cuido dos bichos da area. Quer conhecer o petshop?"
  },
  {
    id: "npc-mendigo-fumante",
    name: "Mendigo Fumante",
    shopName: "Contato do Fumante",
    role: "business_invite",
    sheet: "enemies2",
    row: 7,
    x: 960,
    direction: "front",
    greeting: "Ta afim de arrumar uma grana facil?",
    greetings: [
      "Ta afim de arrumar uma grana facil?",
      "Conheco um lugar onde o dinheiro gira.",
      "Vai la, mas nao arruma problema comigo."
    ]
  },
  {
    id: "npc-vendedor",
    name: "Vendedor",
    shopName: "Banca do Vendedor",
    role: "vendor",
    sheet: "enemies2",
    row: 2,
    x: 1320,
    direction: "front",
    greeting: "Tenho itens aleatorios e faco fusao de equipamentos."
  },
  {
    id: "seu-zeca",
    name: "Seu Zeca",
    shopName: "Seu Zeca, o Velho da Cidade",
    role: "oldman",
    sheet: "enemies2",
    row: 6,
    x: 780,
    direction: "front",
    greeting: "Tenho uns contatos, uns terrenos e compro seus achados. O que voce precisa?"
  }
];
