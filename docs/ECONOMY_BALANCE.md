# Economy Balance Report

## Arquivos alterados

- `src/data/balance/index.js`
- `src/systems/LootSystem/index.js`
- `scripts/economy-simulation.mjs`
- `package.json`

## Sistemas economicos encontrados

- Loot/furto/briga: `src/systems/LootSystem/index.js`, usado por `CombatSystem.rewardTarget`. Antes: dinheiro vinha de `map.money`, com bonus de briga e sem teto central.
- Assaltos: `src/systems/CombatSystem/index.js`. Cada mapa cria 5 a 10 NPCs, dura 60s, e cada alvo pode pagar dinheiro, XP e item.
- Venda de itens: `src/systems/InventorySystem/index.js`. Usa `item.sellPrice`, calculado em `src/data/balance/index.js`.
- Compra de itens do receptador: `src/systems/ShopSystem/index.js`. Compra remove dinheiro, refresh pago remove dinheiro.
- Craft/fusao: `src/systems/InventorySystem/index.js`. Remove dinheiro pelo custo de fusao.
- Casas, motos, terrenos, descanso e renda passiva: `src/systems/StaminaSystem/index.js`.
- Hospital/prisao: `src/systems/PenaltySystem/index.js`. Remove dinheiro da carteira e cofre pessoal.
- Drogas: `src/systems/DrugSystem/index.js`. Compra remove dinheiro, drogas nao podem ser revendidas no inventario normal.
- Negocios/lojas de jogador: `src/systems/BusinessSystem/index.js` e `src/systems/PlayerShopSystem/index.js`. Producao gera estoque; loja transfere dinheiro entre jogadores com taxa.
- Pets: `src/data/pets/index.js`. Compra remove dinheiro, preco escala com casa/moto.
- Tutorial: `src/main.js`, `ensureTutorialAssetFunds`. Injeta dinheiro apenas para nao travar compra guiada inicial.

## Problemas principais

- A curva antiga de dinheiro direto era exponencial: `35 * 1.43^(mapa - 1)`.
- Mapa 12, ainda intermediario, pagava `R$ 1.790-4.747` por alvo antes de briga.
- Mapa 24 pagava `R$ 130.857-308.594` por alvo, multiplicado por 5 a 10 alvos por assalto.
- Briga aplicava `1.25x` sem teto.
- Drops subiam de 8% ate 30%, e revenda era 30% para todas as raridades.
- Sem teto por tier/risco, qualquer bonus futuro de dinheiro poderia empilhar e furar a economia.

## Novas regras aplicadas

- Dinheiro direto agora usa faixas lineares por tier de mapa, nao exponenciais.
- Recompensa direta usa a formula:

```txt
reward = clamp(baseMapReward * riskMultiplier * moneyBonusMultiplier, minReward, capByTierAndRisk)
```

- Briga agora tem multiplicador menor: `1.15x`.
- Bonus de dinheiro futuro fica limitado a `1.25x` total.
- Teto de furto direto por tier: T1 `R$ 320`, T2 `R$ 850`, T3 `R$ 1.450`, T4 `R$ 2.400`.
- Teto de briga por tier: T1 `R$ 420`, T2 `R$ 1.100`, T3 `R$ 1.900`, T4 `R$ 3.100`.
- Chance de drop de equipamento caiu de `8%-30%` para `4.5%-13.5%`.
- Revenda deixou de ser 30% fixo e passou a cair por raridade:
  - Comum: 22%
  - Incomum: 16%
  - Raro: 9%
  - Epico: 4.5%
  - Lendario: 3%
  - Mestre: 2%

## Antes/depois

| Caso | Antes | Depois |
| --- | ---: | ---: |
| Mapa 12 furto direto | `R$ 1.790-4.747` | `R$ 300-780` |
| Mapa 12 furto medio simulado | `~R$ 3.269` | `R$ 526` |
| Mapa 24 furto direto | `R$ 130.857-308.594` | `R$ 1.250-2.300` |
| Mapa 24 furto medio simulado | `~R$ 219.726` | `R$ 1.785` |
| Drop de equipamento | `8%-30%` | `4.5%-13.5%` |
| Revenda de epico | `30%` | `4.5%` |

## Validacao

Comando:

```bash
npm run simulate:economy
```

Resultado final da simulacao, 100 tentativas por mapa/fonte:

| Tier | Furto direto maximo | Liquido medio de furto | Liquido medio com briga | Maior p99 de venda de item |
| --- | ---: | ---: | ---: | ---: |
| T1 | `R$ 300` | `R$ 145` | `R$ 166` | `R$ 384` |
| T2 | `R$ 776` | `R$ 490` | `R$ 628` | `R$ 4.455` |
| T3 | `R$ 1.344` | `R$ 1.609` | `R$ 1.836` | `R$ 16.313` |
| T4 | `R$ 2.291` | `R$ 4.067` | `R$ 3.886` | `R$ 67.500` |

Pontos de aceite principais:

- Mapa 12 nao paga mais `R$ 3000+` em furto direto comum.
- Mapa alto paga mais, mas sem crescimento exponencial.
- Dinheiro alto ficou ligado a raridade de item, nao a furto simples repetivel.
- Drops raros/epicos ainda importam, mas a revenda foi reduzida bastante.

## Riscos de playtest

- A economia ficou propositalmente mais apertada; precos altos de casas/motos/terrenos podem precisar de ajuste fino se a progressao ficar lenta demais.
- Drops raros ainda podem gerar picos quando vendidos, especialmente no T4, mas agora sao raros e pagam muito menos.
- Renda passiva de casas e o impacto indireto das motos ainda devem ser observados no medio prazo, porque sao retorno de investimento, nao recompensa imediata.
- Hospital/prisao ainda tem taxas simples; pode valer transformar em taxa percentual/capada numa futura rodada.

## Sugestoes futuras

- Criar telemetria local de ganho por minuto por fonte.
- Separar explicitamente tipos de alvo: civil comum, guarda, elite, boss.
- Adicionar cooldown/restricao para atividades que pagarem acima de `R$ 3000`.
- Criar eventos raros com recompensas altas, mas com risco/cooldown claros.
- Revisar precos de assets depois de playtestar a nova curva por 30 a 60 minutos.
