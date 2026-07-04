export const HOSPITAL_FEE_TIERS = [
  {
    max: 100,
    fee: 0,
    messages: [
      "Foi pro SUS. Saiu vivo e devendo nada.",
      "Remendo público, dignidade privada.",
      "Te salvaram no grito e no esparadrapo.",
      "SUS salvou. A sorte também.",
      "Costurado de graça. Bonito não ficou.",
      "Saiu vivo, torto e sem pagar.",
      "Atendimento grátis. Milagre incluso.",
      "Te juntaram no improviso.",
      "Foi na fé, voltou respirando.",
      "Nada cobrado. Nem eles acreditaram."
    ]
  },
  {
    max: 250,
    fee: 50,
    messages: [
      "Clínica suspeita. Remendo barato.",
      "Te costuraram atrás da farmácia.",
      "O médico perguntou se você mordia.",
      "Atendimento duvidoso, preço camarada.",
      "Remendo torto, mas funcionou.",
      "Foi quase um veterinário.",
      "Curativo barato, trauma caro.",
      "Te levantaram no modo econômico.",
      "Soro vencido e fé.",
      "Promoção: sobreviveu por cinquenta."
    ]
  },
  {
    max: 2500,
    fee: 100,
    messages: [
      "Postinho: soro, bronca e rua.",
      "Tomou injeção e sermão.",
      "Recebeu curativo e julgamento.",
      "Postinho cheio, atendimento seco.",
      "Te deram alta no susto.",
      "Soro na veia, vergonha na cara.",
      "Remédio genérico, dor original.",
      "Saiu andando por insistência.",
      "Te liberaram antes do café.",
      "Cem conto pra voltar mancando."
    ]
  },
  {
    max: 10000,
    fee: 250,
    messages: [
      "Emergência cara. Até o curativo cobrou.",
      "Viram seu saldo e sorriram.",
      "A maca veio com taxa extra.",
      "Te salvaram, mas passaram a conta.",
      "Atendimento rápido, facada lenta.",
      "Cobrou consulta, gaze e susto.",
      "Sua dor virou orçamento.",
      "Entrou quebrado, saiu mais pobre.",
      "A emergência te assaltou legalizado.",
      "Duzentos e cinquenta pelo privilégio de respirar."
    ]
  },
  {
    max: 50000,
    fee: 500,
    messages: [
      "Hospital chique. A conta doeu mais.",
      "Lençol limpo, boleto sujo.",
      "Te trataram bem e cobraram melhor.",
      "Quarto gelado, cobrança quente.",
      "A enfermeira sorriu. O caixa também.",
      "Atendimento VIP, prejuízo premium.",
      "Te deram alta e um trauma financeiro.",
      "O soro parecia importado.",
      "Você pagou até o silêncio do corredor.",
      "Meio salário pra sair respirando."
    ]
  },
  {
    max: Infinity,
    fee: 1000,
    messages: [
      "Hospital de luxo. Nem heliponto tinha.",
      "Mil conto e nem veio champanhe.",
      "Te salvaram como rico e cobraram como trouxa.",
      "Suíte médica, assalto elegante.",
      "A conta veio de terno.",
      "VIP até na desgraça.",
      "Pagou caro pra voltar ao crime.",
      "Hospital cinco estrelas, dor infinita.",
      "Te trataram no luxo e depenaram no caixa.",
      "Por esse preço, era pra sair blindado."
    ]
  }
];

export function calculateProgressiveFee(totalBalance) {
  return feeTierForBalance(totalBalance).fee;
}

export function applyHospitalFee(player, random = Math.random) {
  const result = applyProgressiveFee(player);
  const tier = feeTierForBalance(result.totalBefore);
  return {
    ...result,
    title: "Você foi apagado!",
    message: randomTierMessage(tier, random)
  };
}

export function applyPrisonFee(player) {
  return applyProgressiveFee(player);
}

export function playerSpendableBalance(player) {
  return walletMoney(player) + vaultMoney(player);
}

export function feeTierForBalance(totalBalance) {
  const total = sanitizeMoney(totalBalance);
  return HOSPITAL_FEE_TIERS.find((tier) => total <= tier.max) || HOSPITAL_FEE_TIERS[HOSPITAL_FEE_TIERS.length - 1];
}

function applyProgressiveFee(player) {
  const walletBefore = walletMoney(player);
  const vaultBefore = vaultMoney(player);
  const totalBefore = walletBefore + vaultBefore;
  const fee = calculateProgressiveFee(totalBefore);
  const charged = Math.min(fee, totalBefore);
  const walletPaid = Math.min(walletBefore, charged);
  const vaultPaid = Math.min(vaultBefore, charged - walletPaid);

  player.money = Math.max(0, walletBefore - walletPaid);
  player.personalVault ||= { money: 0, items: [] };
  player.personalVault.money = Math.max(0, vaultBefore - vaultPaid);

  return {
    totalBefore,
    fee,
    charged,
    walletPaid,
    vaultPaid,
    walletAfter: player.money,
    vaultAfter: player.personalVault.money
  };
}

function randomTierMessage(tier, random) {
  const messages = tier.messages || [];
  const index = Math.max(0, Math.min(messages.length - 1, Math.floor(random() * messages.length)));
  return messages[index] || "Atendimento feito. Conta cobrada.";
}

function walletMoney(player) {
  return sanitizeMoney(player?.money);
}

function vaultMoney(player) {
  return sanitizeMoney(player?.personalVault?.money);
}

function sanitizeMoney(value) {
  const number = Math.floor(Number(value || 0));
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}
