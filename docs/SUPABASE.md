# Supabase Online

O online da cidade inicial usa Supabase Realtime.

## Configurar

1. Crie um projeto no Supabase.
2. Abra **Connect** no projeto.
3. Copie a **Project URL**.
4. Copie a chave publica/publishable (`sb_publishable_...`) ou a `anon` key legacy.
5. No jogo, entre em **Mochila > Configs > Servidor online**.
6. Deixe o modo **Supabase** ativo.
7. Cole a URL e a chave publica.
8. Salve e reabra/conecte a cidade online.

## O que roda no Supabase

- Presenca dos jogadores na cidade inicial.
- Entrada e saida da cidade.
- Movimento em tempo real por Broadcast.
- Snapshot de jogadores online por Presence.
- Chat/atividade simples da cidade pelo mesmo canal.

## Observacao

O servidor Node em `server/index.mjs` continua no projeto apenas como fallback local de desenvolvimento. Para producao, use o modo Supabase.
