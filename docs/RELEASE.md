# Publicacao web do Projeto 190

Este projeto esta preparado para publicar a versao web pelo GitHub Pages.

## Checklist antes do deploy

1. Confirmar que o jogo abre localmente.
2. No GitHub, abrir **Settings > Pages** e deixar a origem como branch `gh-pages` na pasta raiz.
3. Em **Settings > Secrets and variables > Actions > Variables**, criar `SUPABASE_URL`.
4. Criar `SUPABASE_KEY` com a chave publica/publishable do Supabase.
5. Enviar um push para `main` ou rodar manualmente o workflow **Deploy web**.

## Arquivos publicados

O workflow `.github/workflows/pages.yml` publica na branch `gh-pages` os arquivos que o navegador precisa:

- `index.html`
- `styles.css`
- `assets/`
- `src/`
- `player.png`
- `paginas.png`

Durante o deploy, o arquivo `src/config/publicOnlineConfig.js` e gerado com as variaveis `SUPABASE_URL` e `SUPABASE_KEY`. Assim, todo jogador que abrir o link publico entra no mesmo online do Supabase.

A pasta `server/` continua no repositorio, mas nao roda no GitHub Pages. Ela fica apenas como fallback local de desenvolvimento.
