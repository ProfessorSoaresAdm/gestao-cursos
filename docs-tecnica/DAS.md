# Documento de Arquitetura de Software (DAS)

**Sistema:** Sistema de Gestão Escolar  
**Versão:** 1.0.0  
**Data:** Junho de 2026

---

## 1. Visão Geral da Arquitetura

O sistema segue o padrão **SPA com BaaS**: uma aplicação frontend React que se comunica diretamente com o Supabase via SDK. Não há servidor de aplicação intermediário — toda lógica de negócio executável no cliente é processada no browser; a segurança de dados é garantida pelas políticas RLS do PostgreSQL.

```
BROWSER
  React SPA (Vite + TypeScript)
    Pages → Hooks → Services
                         |
            @supabase/supabase-js (HTTPS)
                         |
    SUPABASE
      Auth (JWT) | PostgREST | Storage
                         |
      PostgreSQL + RLS Policies
      profiles | professores | aulas | pagamentos | pessoal
```

---

## 2. Decisões Arquiteturais

### ADR-001 — SPA sem servidor de aplicação

**Decisão:** SPA puro com Vite + React.

**Justificativa:** O sistema é uma ferramenta interna com usuários autenticados. Não há requisito de SEO ou renderização no servidor. O SPA reduz a infraestrutura ao mínimo (hospedagem estática + BaaS), diminui custo operacional e simplifica o deploy.

---

### ADR-002 — Supabase como único backend

**Decisão:** Supabase (PostgreSQL gerenciado + Auth + PostgREST).

**Justificativa:** PostgreSQL oferece maturidade e expressividade SQL para modelagem relacional com FKs, triggers e views. O RLS do PostgreSQL garante segurança a nível de linha sem depender do frontend. PostgREST expõe o banco como API REST sem código adicional.

---

### ADR-003 — Soft delete obrigatório em todas as entidades

**Decisão:** Inativação lógica em vez de exclusão física.

**Justificativa:** A instituição precisa de histórico auditável. Pagamentos cancelados e aulas canceladas devem permanecer rastreáveis. FKs com ON DELETE SET NULL garantem que a remoção de um professor não corrompa o histórico.

---

### ADR-004 — Estado do servidor com TanStack Query

**Decisão:** TanStack Query v5 para leitura e mutações.

**Justificativa:** Gerencia automaticamente cache, deduplicação de requests, estados loading/error e revalidação após mutações. Elimina o padrão manual de useState(loading) + useEffect(fetch).

---

### ADR-005 — Validação com Zod + React Hook Form

**Decisão:** Zod para schema de validação + React Hook Form com zodResolver.

**Justificativa:** Validação declarativa com tipagem TypeScript end-to-end. Erros campo a campo em tempo real (onBlur), sem submissão desnecessária ao servidor.

---

## 3. Estrutura do Frontend

### 3.1 Organização de diretórios

```
src/
├── auth/
│   ├── AuthContext.tsx      — Provider de autenticação e perfil
│   ├── AuthGuard.tsx        — Proteção de rotas autenticadas
│   └── LoginPage.tsx        — Tela de login
├── components/
│   ├── layout/
│   │   ├── Layout.tsx       — Shell principal
│   │   ├── Sidebar.tsx      — Navegação lateral
│   │   └── Header.tsx       — Cabeçalho
│   ├── shared/
│   │   ├── ExportButton.tsx — Exportação CSV
│   │   ├── ImportModal.tsx  — Importação via CSV
│   │   ├── StatusBadge.tsx  — Badge colorido de status
│   │   └── ConfirmDialog.tsx— Diálogo de confirmação
│   └── ui/                  — Componentes primitivos (shadcn/ui)
├── hooks/                   — Hooks de estado por módulo
├── integrations/supabase/
│   └── client.ts            — Instância singleton do cliente Supabase
├── lib/
│   ├── export.ts            — Utilitário de exportação CSV
│   └── utils.ts             — Helper cn() para classes CSS
├── modules/
│   ├── aulas/               — Page, Form, Service
│   ├── pagamentos/          — Page, Form, Service
│   ├── professores/         — Page, Form, Service
│   ├── pessoal/             — Page, Form, Service
│   ├── usuarios/            — Page, Service
│   ├── backup/              — Page, Service
│   └── dashboard/           — Page
├── types/
│   └── database.ts          — Tipos gerados automaticamente (Supabase CLI)
├── App.tsx                  — Roteamento principal
├── main.tsx                 — Entry point
└── index.css                — Estilos globais e variáveis CSS
```

### 3.2 Padrão de módulo

Cada módulo segue obrigatoriamente:

```
[Modulo]Page.tsx   ← Página (listagem, filtros, tabela)
[Modulo]Form.tsx   ← Modal de criação e edição
[modulo]Service.ts ← Todas as queries ao banco
```

Fluxo de dependências unidirecional:

```
Page → Hook → Service → Supabase Client
```

Componentes não importam diretamente de `*Service.ts` — sempre via hook.

---

## 4. Camada de Dados

### 4.1 Cliente Supabase — Singleton

Existe exatamente **uma instância** do cliente em `src/integrations/supabase/client.ts`. Criar instâncias via `createClient()` em outros arquivos é um erro.

### 4.2 Tipos TypeScript

`src/types/database.ts` é gerado pelo Supabase CLI. Não editar manualmente. Regenerar após qualquer mudança de schema:

```bash
npx supabase gen types typescript --project-id ID > src/types/database.ts
```

### 4.3 Padrão de tratamento de erros

```typescript
// Correto — erro propagado com contexto
const { data, error } = await supabase.from('aulas').select('*')
if (error) throw new Error(`Erro ao buscar aulas: ${error.message}`)
return data

// Incorreto — erro silenciado
const { data } = await supabase.from('aulas').select('*')
return data ?? []
```

### 4.4 Joins utilizados

Os services utilizam joins via PostgREST para evitar N+1 queries:

```typescript
// aulaService.getAll() — join com professores em uma query
supabase.from('aulas').select('*, professores(nome)')

// pagamentoService.getAll() — join com professores e aulas
supabase.from('pagamentos').select('*, professores(nome), aulas(titulo)')
```

---

## 5. Autenticação e Autorização

### 5.1 Fluxo de autenticação

```
1. Usuário submete email/senha em LoginPage
2. supabase.auth.signInWithPassword() valida credenciais
3. Supabase retorna access_token (JWT, 1h) e refresh_token
4. SDK armazena tokens em localStorage automaticamente
5. onAuthStateChange dispara com sessão ativa
6. AuthContext executa fetchProfile() — carrega role e telas_acesso
7. AuthGuard libera acesso às rotas protegidas
```

### 5.2 Dois níveis de autorização

**Nível 1 — RLS (banco de dados):** Políticas verificam `get_my_role()` diretamente no PostgreSQL. Mesmo que o frontend tente operação não autorizada, o banco recusa com erro 42501.

**Nível 2 — AuthGuard (frontend):** Verifica autenticação, suspensão e telas_acesso antes de renderizar qualquer rota. Redireciona conforme necessário.

### 5.3 Função get_my_role()

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER
AS $$ SELECT role FROM profiles WHERE id = auth.uid(); $$;
```

`SECURITY DEFINER` garante execução com privilégios do owner, prevenindo bypass via search_path.

---

## 6. Fluxo de Dados — Operação de Escrita

```
Usuário submete formulário
  → Zod valida os dados
    → hook.create(payload)
      → service.create(data)
        → supabase.from('tabela').insert([data])
          → PostgREST verifica RLS
            → INSERT executado no PostgreSQL
          → onSuccess: queryClient.invalidateQueries(['tabela'])
            → hook re-executa getAll()
              → Interface atualizada automaticamente
  → toast.success('Registro criado!')
→ Modal fecha
```

---

## 7. Infraestrutura e Deploy

### 7.1 Ambientes

| Ambiente | URL | Branch | Deploy |
|---|---|---|---|
| Produção | professor-soares.vercel.app | main | Automático no push |
| Desenvolvimento | localhost:3000 | qualquer | npm run dev |

### 7.2 Build

```bash
npm run build    # Gera bundle otimizado em /dist
npm run preview  # Serve /dist localmente para validação
```

O Vite gera bundle com tree-shaking, minificação e code-splitting por rota (lazy loading).

---

## 8. Padrões de Código

### 8.1 Nomenclatura

| Elemento | Padrão | Exemplo |
|---|---|---|
| Componente React | PascalCase | ProfessoresPage.tsx |
| Hook | camelCase com prefixo `use` | useProfessores.ts |
| Service | camelCase com sufixo `Service` | professorService.ts |
| Variável / função | camelCase | fetchProfessores |
| Tipo / Interface | PascalCase | Professor, AulaStatus |
| Constante global | UPPER_SNAKE_CASE | MAX_ROWS_PER_PAGE |

### 8.2 Feedback ao usuário (obrigatório em toda operação assíncrona)

1. Desabilitar o botão durante execução (`disabled={isSubmitting}`)
2. Exibir spinner no botão (`<Loader2 className="animate-spin" />`)
3. Toast de sucesso ao concluir
4. Toast de erro com mensagem amigável (sem stack trace)

---

*DAS v1.0.0 — Sistema de Gestão Escolar — Junho de 2026*
