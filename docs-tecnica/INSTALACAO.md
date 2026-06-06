# Manual de Instalação e Configuração

**Sistema:** Sistema de Gestão Escolar  
**Versão:** 1.0.0  
**Data:** Junho de 2026

---

## Pré-requisitos

| Requisito | Versão mínima | Verificação |
|---|---|---|
| Node.js | 18.0.0 | `node --version` |
| npm | 9.0.0 | `npm --version` |
| Git | 2.30+ | `git --version` |
| Conta Supabase | — | supabase.com |
| Conta Vercel (produção) | — | vercel.com |

---

## 1. Instalação para Desenvolvimento Local

### 1.1 Clonar o repositório

```bash
git clone https://github.com/[usuario]/[repositorio].git
cd [repositorio]
```

### 1.2 Instalar dependências

```bash
npm install
```

### 1.3 Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

Credenciais em: Supabase Dashboard → Project Settings → API

> O arquivo `.env.local` está no `.gitignore` e **nunca deve ser commitado**.

### 1.4 Configurar o banco de dados

1. Supabase Dashboard → SQL Editor
2. Colar e executar o conteúdo completo de `supabase/schema.sql`
3. Verificar criação das tabelas: profiles, professores, aulas, pagamentos, pessoal

Para dados de teste (apenas em desenvolvimento):

```bash
# Executar supabase/seed.sql no SQL Editor
```

### 1.5 Criar o primeiro usuário administrador

1. Supabase Dashboard → Authentication → Users → Invite User
2. Informar o e-mail do administrador
3. Após o primeiro login, promover a admin:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@dominio.com';
```

### 1.6 Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesso: http://localhost:3000

---

## 2. Deploy em Produção (Vercel)

### 2.1 Criar projeto na Vercel

1. Acessar vercel.com → Add New → Project
2. Importar o repositório GitHub
3. A Vercel detectará automaticamente o preset Vite

### 2.2 Configurar variáveis de ambiente na Vercel

Antes de clicar em Deploy, adicionar em Environment Variables:

| Nome | Valor |
|---|---|
| VITE_SUPABASE_URL | URL do projeto Supabase de produção |
| VITE_SUPABASE_ANON_KEY | Chave anon/public de produção |

### 2.3 Configurar URLs no Supabase

Authentication → URL Configuration:

- **Site URL:** `https://[seu-dominio].vercel.app`
- **Redirect URLs:** `https://[seu-dominio].vercel.app/**`

### 2.4 Executar o deploy

Clicar em **Deploy**. A Vercel executa `npm install` e `npm run build` automaticamente.

Deploys subsequentes: todo `git push` para `main` dispara novo deploy automaticamente.

---

## 3. Manutenção do Banco

### 3.1 Aplicar migrations

Criar arquivo em `supabase/migrations/NNN_descricao.sql`, testar em desenvolvimento e executar no SQL Editor de produção.

### 3.2 Regenerar tipos TypeScript

```bash
npx supabase gen types typescript --project-id [id] > src/types/database.ts
```

Commitar o arquivo gerado junto com a migration correspondente.

---

## 4. Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| VITE_SUPABASE_URL | Sim | URL do projeto Supabase |
| VITE_SUPABASE_ANON_KEY | Sim | Chave pública anônima |

Variáveis com prefixo `VITE_` são públicas no bundle. Nunca usar para dados sensíveis.

---

## 5. Scripts

| Script | Comando | Descrição |
|---|---|---|
| Desenvolvimento | `npm run dev` | Servidor com hot reload em localhost:3000 |
| Build | `npm run build` | Bundle otimizado em /dist |
| Preview | `npm run preview` | Serve /dist para validação |
| Typecheck | `npm run lint` | Verificação TypeScript |
| Limpar | `npm run clean` | Remove /dist |

---

## 6. Solução de Problemas

**"supabase client: missing URL"**  
Verificar se `.env.local` existe e contém `VITE_SUPABASE_URL`.

**Login retorna erro com credenciais corretas**  
Verificar em Supabase → Authentication → URL Configuration se a URL está nas Redirect URLs.

**Tipos desatualizados após mudança de schema**  
Regenerar `src/types/database.ts` conforme item 3.2.

**Build falha com erro TypeScript**  
Executar `npm run lint` para identificar os erros antes do deploy.

---

*Manual de Instalação v1.0.0 — Sistema de Gestão Escolar — Junho de 2026*
