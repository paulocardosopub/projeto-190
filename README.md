# Projeto 190

Idle Crime RPG 2D em pixel art, com tela compacta no estilo taskbar e base separada para cidade online.

## Abrir agora

Com o servidor local ligado, use:

```text
http://127.0.0.1:4190/
```

Preview visual com painel de escala/camera:

```text
http://127.0.0.1:4190/?preview=1
```

Nesse modo o menu `Configs` mostra a calibracao visual. Da para escolher mapa/personagem, ajustar tamanho, chao por mapa, offset vertical do player/NPCs e distancia da camera. O botao `Salvar` grava apenas a calibracao visual; o menu nao aparece no jogo normal.

Editor de janelas:

```text
http://127.0.0.1:4190/?preview=1&editor=1
```

Nesse modo, arraste cada janela pelo titulo, redimensione pelo canto e use `Salvar layout`. O layout salvo passa a ser usado quando as janelas abrirem no jogo normal. Os botoes `Menor` e `Maior` ajustam a escala interna de textos e quadrados. O menu inferior tambem pode ser arrastado e redimensionado.

## Online Supabase

A camada online fica em `src/systems/OnlineSystem` e usa Supabase Realtime para a cidade inicial.

No jogo publicado, a configuracao deve vir embutida pelo arquivo `src/config/publicOnlineConfig.js`.
O deploy do GitHub Pages gera esse arquivo usando as variaveis do repositorio `SUPABASE_URL` e `SUPABASE_KEY`.

Com essas variaveis preenchidas, os jogadores entram pelo mesmo link publico e ja se veem na cidade.

No modo local, tambem da para configurar manualmente pelo jogo em `Mochila > Configs > Servidor online`.

Mais detalhes estao em `docs/SUPABASE.md`.

## Online local

O servidor de desenvolvimento em `server/index.mjs` continua disponivel como fallback local.

Para usar localmente, escolha o modo `Local` nas configuracoes online e rode `npm run server`.

## Arquitetura

- `src/data`: mapas, players, NPCs e equipamentos.
- `src/systems`: combate, loot, inventario, save, player e online.
- `src/ui`: renderizacao do canvas e janelas.
- `server`: presenca online, chat e atividade de lojas.

O combate e o progresso funcionam offline. Cidade, lojas, chat, faccao e interacoes entre players entram pela camada online.

## Publicacao web

O projeto publica a versao web pelo GitHub Pages via `.github/workflows/pages.yml`.

Antes do deploy, configure no GitHub:

- `SUPABASE_URL`: Project URL do Supabase.
- `SUPABASE_KEY`: chave publica/publishable ou anon key.

Em **Settings > Pages**, deixe a origem como branch `gh-pages` na pasta raiz. O workflow atualiza essa branch automaticamente a cada push na `main`.

O site final fica no formato `https://usuario.github.io/repositorio/`.

Mais detalhes estao em `docs/RELEASE.md`.
