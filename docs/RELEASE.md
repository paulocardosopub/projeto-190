# Publicacao web do Projeto 190

Este projeto esta preparado para publicar a versao web pelo GitHub Pages.

## Checklist antes do deploy

1. Confirmar que o jogo abre localmente.
2. No GitHub, abrir **Settings > Pages** e deixar a origem como branch `gh-pages` na pasta raiz.
3. Confirmar que `src/config/publicOnlineConfig.js` aponta para o projeto Supabase correto.
4. Enviar um push para `main` ou rodar manualmente o workflow **Deploy web**.

## Arquivos publicados

O workflow `.github/workflows/pages.yml` publica na branch `gh-pages` os arquivos que o navegador precisa:

- `index.html`
- `styles.css`
- `assets/`
- `src/`
- `paginas.png`

Durante o deploy, o arquivo `src/config/publicOnlineConfig.js` e gerado com a configuracao publica do Supabase. Se existirem variaveis `SUPABASE_URL` e `SUPABASE_KEY` no GitHub, elas sobrescrevem a configuracao embutida. Assim, todo jogador que abrir o link publico entra no mesmo online do Supabase.

A pasta `server/` continua no repositorio, mas nao roda no GitHub Pages. Ela fica apenas como fallback local de desenvolvimento.
