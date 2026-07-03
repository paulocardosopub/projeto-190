# Publicacao web do Projeto 190

Este projeto esta preparado para publicar a versao web pelo GitHub Pages.

## Checklist antes do upload

1. Confirmar que o jogo abre localmente.
2. Enviar o projeto para um repositorio publico no GitHub.
3. Publicar os arquivos estaticos na branch `gh-pages`.
4. Ativar o GitHub Pages usando a branch `gh-pages` como origem.

## Arquivos publicados

A publicacao web envia apenas os arquivos que o navegador precisa:

- `index.html`
- `styles.css`
- `assets/`
- `src/`
- `player.png`
- `paginas.png`

A pasta `server/` continua no repositorio, mas nao roda no GitHub Pages. A versao web publica funciona com o progresso offline; recursos online precisam de um servidor separado.
