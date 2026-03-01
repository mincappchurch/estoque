# Supabase setup (fase 1)

Este diretório contém o script SQL para criar a base online do app de estoque no Supabase.

## Arquivo principal

- `init_supabase.sql`

## Como executar

1. Abra o projeto `tmsetefviisonvcrgbxs` no painel do Supabase.
2. Vá em **SQL Editor**.
3. Crie uma nova query.
4. Cole todo o conteúdo de `init_supabase.sql`.
5. Execute.

## O que é criado

- Enums: `user_role`, `movement_type`, `service_time`.
- Tabelas: `users`, `access_codes`, `categories`, `teams`, `units`, `products`, `movements`, `audit_logs`.
- Índices para consultas de estoque e relatórios.
- Funções:
  - `fn_record_movement(...)` para entrada/retirada transacional.
  - `fn_use_access_code(...)` para validação de código de acesso.
- Views:
  - `vw_stock_status`
  - `vw_dashboard_stats`
  - `vw_movements_by_service_time`
  - `vw_movements_by_team_period`
- Seeds iniciais:
  - Códigos de acesso (`ADMIN2026`, `VOLUNTARIO2026`, `LIDER2026`) com hash.
  - Categorias, unidades e equipes básicas.

## Validação rápida

Depois de executar o script, rode estas consultas no SQL Editor:

```sql
select * from public.vw_dashboard_stats;
select * from public.categories order by name;
select * from public.units order by name;
select * from public.teams order by name;
select * from public.fn_use_access_code('ADMIN2026');
```

## Importante

- Nesta fase, o script **não aplica RLS** (conforme decisão atual).
- O próximo passo é adaptar `server/db.ts` e `server/routers.ts` para usar esse schema no Postgres/Supabase.
