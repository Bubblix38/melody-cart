# Relatório do Backup

**Projeto:** `ecf14f43-c191-48cb-861f-8fcbe0315698`  
**Data:** 28/06/2026, 04:04:29  
**Credenciais usadas:** anon key (auto — só dados públicos)

## Resumo do que foi baixado

| Item                | Status | Detalhe                         |
| ------------------- | ------ | ------------------------------- |
| Código-fonte        | ✅     | 92 arquivos                     |
| URL Supabase        | ✅     | auto-detectada                  |
| Anon key            | ✅     | auto-detectada do .env          |
| JWT admin           | ❌     | sem sessão ativa                |
| service_role        | ❌     | não fornecida                   |
| Dados das tabelas   | ✅     | 8 tabelas, 8 linhas             |
| Arquivos do Storage | ⏭️     | opção desativada                |
| Secrets (nomes)     | ❌     | 0 nomes em `secrets/_names.txt` |

## O que falhou ou foi pulado

### Tabelas com problema

- CompositeTypes — não exposta na API (PostgREST)
- Enums — não exposta na API (PostgREST)
- Functions — não exposta na API (PostgREST)
- Insert — não exposta na API (PostgREST)
- Row — não exposta na API (PostgREST)
- Update — não exposta na API (PostgREST)
- Views — não exposta na API (PostgREST)

Nenhuma falha — backup completo dentro do nível de permissão usado.

## Como conseguir um backup 100% completo

Para baixar **tudo** (inclusive tabelas com RLS restritivo e buckets privados):

1. Abra **Cloud → Backend → Project Settings → API Keys** no painel Lovable.
2. Copie a chave **`service_role`** (secret).
3. Cole em **Opções avançadas → service_role key** e rode o backup de novo.

> A `service_role` ignora RLS e Storage privado. Use só localmente — nunca exponha em código de front-end.

## Restauração

Este backup inclui scripts de restauração automática na pasta `restore/`.
Veja o arquivo `README-RESTORE.md` para instruções detalhadas de como usar os scripts.
