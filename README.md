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

## Online local

A camada online fica separada em `src/systems/OnlineSystem` e o servidor de desenvolvimento em `server/index.mjs`.

Para testar cidade online:

```powershell
npm install
npm run server
```

Depois abra o jogo e use Cidade > Conectar.

## Arquitetura

- `src/data`: mapas, players, NPCs e equipamentos.
- `src/systems`: combate, loot, inventario, save, player e online.
- `src/ui`: renderizacao do canvas e janelas.
- `server`: presenca online, chat e atividade de lojas.

O combate e o progresso funcionam offline. Cidade, lojas, chat, faccao e interacoes entre players entram pela camada online.

## Publicacao web

O projeto esta preparado para publicar a versao web pelo GitHub Pages.

Para publicar, envie o repositorio para o GitHub e publique os arquivos estaticos na branch `gh-pages`. O site final ficara no formato `https://usuario.github.io/repositorio/`.

Mais detalhes estao em `docs/RELEASE.md`.
