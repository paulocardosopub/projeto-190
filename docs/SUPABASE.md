# Supabase Online

O online da cidade inicial usa Supabase Realtime.

## Configurar

1. Crie um projeto no Supabase.
2. Abra **Connect** no projeto.
3. Copie a **Project URL**.
4. Copie a chave publica/publishable (`sb_publishable_...`) ou a `anon` key legacy.
5. No GitHub, abra **Settings > Secrets and variables > Actions > Variables**.
6. Crie `SUPABASE_URL` com a Project URL.
7. Crie `SUPABASE_KEY` com a chave publica.
8. Rode o workflow **Deploy web** ou envie um push para `main`.

O deploy gera `src/config/publicOnlineConfig.js` com esses valores. Quem abrir o link publicado entra em modo Supabase automaticamente.

Para testar localmente sem GitHub Pages, edite `src/config/publicOnlineConfig.js` ou use **Mochila > Configs > Servidor online**.

## O que roda no Supabase

- Presenca dos jogadores na cidade inicial.
- Entrada e saida da cidade.
- Movimento em tempo real por Broadcast.
- Snapshot de jogadores online por Presence.
- Chat/atividade simples da cidade pelo mesmo canal.

## Observacao

O servidor Node em `server/index.mjs` continua no projeto apenas como fallback local de desenvolvimento. Para producao, use o modo Supabase.
