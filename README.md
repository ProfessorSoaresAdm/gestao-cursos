# Sistema de Gestão Escolar

> Sistema web multi-usuário para gestão de aulas, pagamentos, professores e pessoal.  
> Substitui planilhas desconectadas por uma plataforma centralizada, compartilhável e com controle de acesso.

---

## Sobre o projeto

Este sistema foi desenvolvido para centralizar 4 áreas operacionais que antes eram gerenciadas em planilhas separadas:

| Módulo | O que faz |
|---|---|
| **Aulas** | Agendamento, acompanhamento e histórico de aulas ao vivo |
| **Pagamentos** | Controle de recebimentos, status de vencimentos e exportação |
| **Professores** | Cadastro completo com contatos e especialidades |
| **Pessoal** | Dados internos da equipe (acesso restrito ao administrador) |

Qualquer usuário autorizado acessa o sistema pelo navegador, sem instalar nada.  
Dados em tempo real, exportação CSV compatível com Excel e Google Sheets.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| UI | TailwindCSS + shadcn/ui |
| Backend / Banco | Supabase (PostgreSQL gerenciado) |
| Autenticação | Supabase Auth (email/senha) |
| Exportação CSV | Papa Parse (client-side) |
| Deploy Frontend | Vercel |

---

## Pré-requisitos

- Node.js 18+
- npm 9+ ou pnpm 8+
- Conta no [Supabase](https://supabase.com) (free tier é suficiente)
- Conta no [Vercel](https://vercel.com) para deploy (opcional em dev)

---

## Configuração local

### 1. Clone o repositório

```bash
git clone https://github.com/[seu-usuario]/[nome-do-repo].git
cd [nome-do-repo]
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com as credenciais do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://[seu-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-anon-key]
```

> As credenciais estão em: Supabase Dashboard → Project Settings → API

### 4. Aplique o schema no banco

No Supabase Dashboard, vá em **SQL Editor** e execute o arquivo:

```
supabase/schema.sql
```

Depois disso, crie o primeiro usuário em **Authentication → Users** no painel do Supabase.
Não crie usuários com `INSERT` direto em `auth.users`, porque isso pode deixar o Auth inconsistente.

Para popular dados de teste (apenas em desenvolvimento):

```
supabase/seed.sql
```

### 5. Rode o projeto

```bash
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

## Scripts disponíveis

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção (saída em /dist)
npm run preview    # Preview do build de produção
npm run typecheck  # Verificação TypeScript sem compilar
```

---

## Perfis de acesso

| Role | O que pode fazer |
|---|---|
| `admin` | Acesso total. Gerencia usuários. Acessa módulo Pessoal. |
| `editor` | Cria e edita registros em Aulas, Pagamentos e Professores. |
| `viewer` | Somente leitura em todos os módulos permitidos. |

Depois de criar o primeiro usuário no Auth, promova-o a `admin` manualmente via Supabase:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'seu@email.com';
```

---

## Estrutura do projeto

```
src/
├── auth/           # Login, AuthGuard, hook de autenticação
├── components/
│   ├── layout/     # Sidebar, Header, Layout principal
│   ├── shared/     # DataTable, ExportButton, StatusBadge, ConfirmDialog
│   └── ui/         # Componentes shadcn/ui
├── hooks/          # Hooks de dados por módulo
├── lib/            # Supabase client, helpers de exportação CSV
├── modules/        # Páginas e formulários dos 4 módulos
└── types/          # Tipos TypeScript gerados do schema Supabase
```

Documentação completa da estrutura: ver `ARCHITECTURE.md`

---

## Deploy

Consulte `DEPLOY.md` para o passo a passo completo de deploy no Vercel.

**URL de produção:** [preencher após o primeiro deploy]

---

## Documentação do projeto

| Arquivo | Conteúdo |
|---|---|
| `PLAYBOOK_MESTRE.md` | Plano completo de desenvolvimento, schema, prompts por fase |
| `PLAN.md` | Fases, status atual e próximos passos |
| `ARCHITECTURE.md` | Diagrama e decisões arquiteturais |
| `DB_SCHEMA.md` | Schema completo do banco (espelho legível do SQL) |
| `AGENTS.md` | Instruções mandatórias para agentes de IA |
| `PROJECT_STATE.md` | Estado atual da implementação (atualizado a cada sessão) |
| `TASKS.md` | Tarefas abertas e concluídas |
| `DECISIONS.md` | Log de decisões arquiteturais (ADRs) |
| `UX_RULES.md` | Regras de interface e padrões visuais |
| `DEPLOY.md` | Guia de deploy e variáveis de ambiente |
| `TESTING.md` | Estratégia de testes |
| `CONTRIBUTING.md` | Como contribuir (humanos e agentes de IA) |
| `COMMIT_GUIDE.md` | Padrão de commits (Conventional Commits) |

---

## Contribuindo

Leia `CONTRIBUTING.md` antes de abrir um PR ou iniciar uma sessão com agente de IA.  
Todo agente de IA **deve** ler `AGENTS.md` e `PROJECT_STATE.md` antes de qualquer ação.

---

## Licença

Uso privado — [nome da empresa]. Todos os direitos reservados.
