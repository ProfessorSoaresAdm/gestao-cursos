# Guia de Manutenção

**Sistema:** Sistema de Gestão Escolar  
**Versão:** 1.0.0  
**Data:** Junho de 2026

---

## 1. Rotinas Recomendadas

### Verificações diárias

- Verificar se o último deploy na Vercel foi bem-sucedido (aba Deployments)
- Verificar em Supabase Dashboard → Logs se há erros recorrentes de API
- Conferir pagamentos com vencimento no dia via módulo Pagamentos

### Verificações mensais

- Revisar usuários: desativar contas de colaboradores desligados
- Conferir status dos backups: Supabase → Settings → Database → Backups
- Atualizar dependências do projeto (ver seção 4)

---

## 2. Gestão de Usuários

### Criar novo usuário

1. Acessar sistema como admin → módulo Usuários → Novo Usuário
2. Preencher nome, e-mail, senha, role e telas de acesso
3. Salvar — o usuário já pode fazer login

### Alterar role

1. Módulo Usuários → localizar o usuário → Editar
2. Alterar o campo Nível de Acesso → Salvar
3. A alteração tem efeito imediato no próximo acesso

### Suspender usuário

1. Módulo Usuários → Bloquear → Confirmar
2. O usuário é redirecionado para a tela de suspensão no próximo acesso

### Operações de emergência via SQL

```sql
-- Promover a admin
UPDATE profiles SET role = 'admin' WHERE email = 'email@dominio.com';

-- Reativar conta suspensa
UPDATE profiles SET ativo = true WHERE email = 'email@dominio.com';

-- Listar todos os admins ativos
SELECT email, role FROM profiles WHERE role = 'admin' AND ativo = true;
```

---

## 3. Gestão do Banco de Dados

### Aplicar uma migration

1. Criar `supabase/migrations/NNN_descricao.sql`
2. Testar em desenvolvimento
3. Executar em produção via SQL Editor
4. Regenerar tipos TypeScript
5. Commitar migration + código juntos

### Regenerar tipos TypeScript

```bash
npx supabase gen types typescript --project-id [id] > src/types/database.ts
```

### Consultas úteis

```sql
-- Pagamentos atrasados
SELECT descricao, valor, data_vencimento,
       (CURRENT_DATE - data_vencimento) AS dias_atraso
FROM pagamentos
WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE
ORDER BY data_vencimento ASC;

-- Professores sem aulas nos últimos 90 dias
SELECT p.nome, MAX(a.data_hora) AS ultima_aula
FROM professores p
LEFT JOIN aulas a ON a.professor_id = p.id
WHERE p.ativo = true
GROUP BY p.id, p.nome
HAVING MAX(a.data_hora) < NOW() - INTERVAL '90 days'
   OR MAX(a.data_hora) IS NULL
ORDER BY ultima_aula ASC NULLS FIRST;

-- Resumo financeiro por mês
SELECT
  DATE_TRUNC('month', data_vencimento) AS mes,
  SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END) AS total_pago,
  SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) AS total_pendente,
  COUNT(*) AS total_registros
FROM pagamentos
WHERE status != 'cancelado'
GROUP BY 1 ORDER BY 1 DESC;

-- Contagem de registros por tabela
SELECT 'professores' AS tabela, COUNT(*) FROM professores UNION ALL
SELECT 'aulas', COUNT(*) FROM aulas UNION ALL
SELECT 'pagamentos', COUNT(*) FROM pagamentos UNION ALL
SELECT 'pessoal', COUNT(*) FROM pessoal UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;
```

---

## 4. Atualização de Dependências

### Verificar desatualizadas

```bash
npm outdated
```

### Processo seguro de atualização

```bash
git checkout -b chore/update-deps
npm update
npm run build
npm run lint
npm run dev  # testar localmente
git add package.json package-lock.json
git commit -m "chore(deps): atualizar dependências"
```

> Atualizações MAJOR (ex: React 19 → 20) exigem análise do changelog antes de aplicar.

### Dependências críticas

| Pacote | Versão atual | Observação |
|---|---|---|
| @supabase/supabase-js | ^2.107.0 | Manter alinhado com versão Supabase em produção |
| react | ^19.0.1 | MAJOR requer testes extensivos |
| typescript | ~5.8.2 | Versão minor fixada (til) |
| vite | ^6.2.3 | Verificar migration guide em MAJOR |

---

## 5. Monitoramento

### Vercel
Dashboard → projeto → Analytics: taxa de deploy, Core Web Vitals, erros de build

### Supabase — API
Dashboard → Logs → API: erros 4xx/5xx, queries lentas (>2s)

### Supabase — Autenticação
Dashboard → Authentication → Logs: tentativas de login falhas recorrentes

---

## 6. Backup e Recuperação

### Backups automáticos
Supabase realiza backups diários: Dashboard → Settings → Database → Backups

### Backup manual via sistema
Módulo Backup (acesso admin) → exporta JSON com snapshot dos dados principais

### Backup via CSV
Exportar cada módulo individualmente para backup completo em planilhas

### Restauração
Acionar suporte Supabase via Dashboard ou usar os backups automáticos disponíveis

---

## 7. Resolução de Problemas

### Sistema não carrega após deploy
1. Vercel → Deployments: verificar se build passou
2. Verificar variáveis de ambiente configuradas
3. Console do navegador (F12): verificar erros de CORS ou conexão

### Usuário não consegue fazer login
1. Supabase → Authentication → Users: confirmar que usuário existe
2. Verificar `profiles.ativo = true`
3. Verificar `email_confirmed_at` preenchido

### Dados não aparecem após criação
1. Console do navegador: verificar erros
2. Verificar se RLS não está bloqueando (erro 42501)
3. Recarregar a página (F5)

### Performance lenta nas listagens
1. Supabase → Logs → API: identificar queries sem índice
2. Adicionar índice via migration
3. Considerar paginação server-side para tabelas com >500 registros

---

*Guia de Manutenção v1.0.0 — Sistema de Gestão Escolar — Junho de 2026*
