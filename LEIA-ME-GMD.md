# Projeto Lovable — Download via LovaFlow v4.0

Project ID: ecf14f43-c191-48cb-861f-8fcbe0315698
Baixado em: 2026-06-28T07:04:29.357Z

## O que está incluído

- Frontend completo: `src/`, `public/`, configs
- Backend código: `supabase/functions/`, `supabase/migrations/` (DDL completo)
- Dados das tabelas: 8 tabelas, 8 linhas em `database/`
- Arquivos do Storage: NÃO (opção não usada)
- Schema e scripts de restore: SIM (em `restore/`)
- Lista de secrets necessários: nenhum detectado
- Credenciais usadas para o dump: anon key (auto — só dados públicos)

## Como rodar

1. `bun install` (ou `npm install`)
2. Configure os secrets listados em `secrets/_template.env.example`
3. `bun run dev`

## Como restaurar o banco em outro Supabase

1. Rode as migrations: `supabase db push` (cria as tabelas, RLS e funções)
2. Importe os dados: rode os scripts em `database/sql/*.sql` (na ordem que respeitar FKs)
   ou importe os CSVs via painel do Supabase: Database → Table Editor → Import CSV.
3. Faça upload dos arquivos de `storage/<bucket>/` nos buckets correspondentes.

## Observações

- Usuários do `auth.users` NÃO são exportáveis (limitação do Supabase). Eles precisam se cadastrar novamente.
- A `service_role` key informada ficou apenas no seu navegador.
