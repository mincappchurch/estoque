# Checklist de variáveis na Vercel (produção)

Projeto Supabase: tmsetefviisonvcrgbxs

## Onde configurar

- Vercel Dashboard
- Project Settings
- Environment Variables
- Environment: Production

## Variáveis obrigatórias

1) NODE_ENV
- Value: production

2) SUPABASE_URL
- Value: https://tmsetefviisonvcrgbxs.supabase.co

3) SUPABASE_SERVICE_ROLE_KEY
- Value: cole a Service Role Key do Supabase (Settings > API > service_role)
- Observação: nunca expor essa chave no app cliente

4) EXPO_PUBLIC_API_BASE_URL
- Value: URL pública da API na Vercel
- Exemplo: https://church-inventory-app.vercel.app

## Variável opcional

5) PORT
- Value: 3000
- Observação: geralmente não é necessário definir na Vercel

## Verificação rápida pós-configuração

1) Abra no navegador:
- https://SEU_DOMINIO_VERCEL/api/health
- Esperado: JSON com ok: true

2) Teste de autenticação por código (no app):
- Use os códigos criados no seed SQL (ex.: ADMIN2026)
- Verifique se entra no app e carrega dashboard/estoque

3) Teste de persistência:
- Crie/edite categoria, produto e movimentação
- Confirme os dados no Supabase

## Importante

- O projeto está configurado para usar Supabase como backend principal.
- DATABASE_URL só é necessária para tooling local de Drizzle (migração/geração), não para runtime padrão na Vercel.
