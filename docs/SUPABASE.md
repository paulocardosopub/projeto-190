# Supabase Online

O online da cidade inicial usa Supabase Realtime.

O projeto atual e `projeto-190`, na regiao **South America (Sao Paulo)**.

## Configurar

O arquivo `src/config/publicOnlineConfig.js` ja tem a **Project URL** e a chave publica/publishable do projeto atual.

Quem abrir o link publicado entra em modo Supabase automaticamente.

Para trocar de projeto depois:

1. Crie um projeto no Supabase.
2. Abra **Connect** no projeto.
3. Copie a **Project URL**.
4. Copie a chave publica/publishable (`sb_publishable_...`) ou a `anon` key legacy.
5. Atualize `src/config/publicOnlineConfig.js`.

Tambem da para sobrescrever no deploy criando as variaveis `SUPABASE_URL` e `SUPABASE_KEY` em **GitHub > Settings > Secrets and variables > Actions > Variables**.

Para testar localmente sem GitHub Pages, edite `src/config/publicOnlineConfig.js` ou use **Mochila > Configs > Servidor online**.

## O que roda no Supabase

- Contas de jogador.
- Sessao ativa por conta, com bloqueio automatico quando a mesma conta entra em outro dispositivo.
- Save completo do progresso de cada conta.
- Presenca dos jogadores na cidade inicial.
- Entrada e saida da cidade.
- Movimento em tempo real por Broadcast.
- Snapshot de jogadores online por Presence.
- Chat/atividade simples da cidade pelo mesmo canal.

## Banco de dados

O SQL base esta em `docs/supabase-schema.sql`. Ele cria as tabelas `app_accounts`,
`app_sessions` e `app_saves`, alem das funcoes RPC usadas pelo jogo:

- `app_create_account`
- `app_login`
- `app_get_profile`
- `app_update_profile`
- `app_load_game`
- `app_save_game`

## Observacao

O servidor Node em `server/index.mjs` continua no projeto apenas como fallback local de desenvolvimento. Para producao, use o modo Supabase.
