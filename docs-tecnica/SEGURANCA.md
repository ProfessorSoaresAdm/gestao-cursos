# Política de Segurança

**Sistema:** Sistema de Gestão Escolar  
**Versão:** 1.0.0  
**Data:** Junho de 2026

---

## 1. Modelo de Segurança em Camadas

```
Camada 1: HTTPS/TLS (transporte)
Camada 2: Supabase Auth (autenticação)
Camada 3: AuthGuard (proteção de rotas no frontend)
Camada 4: RLS — Row Level Security (autorização no banco)
Camada 5: Criptografia em repouso (AES-256)
```

Nenhuma camada é suficiente sozinha.

---

## 2. Autenticação

### 2.1 Mecanismo
Autenticação por e-mail e senha via Supabase Auth. Credenciais nunca transitam em texto claro.

### 2.2 Tokens
- **Access token:** JWT com validade de 1 hora. Renovado automaticamente.
- **Refresh token:** Armazenado em localStorage. Usado para renovação do access token.
- **Revogação:** `supabase.auth.signOut()` invalida a sessão no servidor imediatamente.

### 2.3 Suspensão de conta
Usuários com `profiles.ativo = false` são redirecionados pelo AuthGuard. A verificação ocorre a cada carregamento de rota protegida.

---

## 3. Autorização

### 3.1 Row Level Security (RLS)

Todas as cinco tabelas têm RLS habilitado. As políticas são definidas em SQL e não dependem do frontend.

| Tabela | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| profiles | Próprio perfil ou admin | Próprio perfil ou admin |
| professores | Qualquer autenticado | admin e editor |
| aulas | Qualquer autenticado | admin e editor |
| pagamentos | Qualquer autenticado | admin e editor |
| pessoal | Somente admin | Somente admin |

A função `get_my_role()` usa `SECURITY DEFINER` para prevenir search_path injection.

### 3.2 AuthGuard (frontend)

Verifica antes de renderizar qualquer página:
1. Usuário autenticado (access token válido)
2. Conta ativa (`ativo = true`)
3. Acesso à rota solicitada (`telas_acesso`)

O AuthGuard é segunda linha de defesa — o RLS é a primária.

---

## 4. Proteção de Dados Sensíveis

### 4.1 Campo salário

Classificado como dado confidencial:
- RLS restringe a tabela `pessoal` exclusivamente ao admin
- Não aparece em listagens, cards ou CSVs
- Visível apenas no formulário de criação/edição para admin

### 4.2 Chaves de API

| Chave | Localização | Exposição |
|---|---|---|
| VITE_SUPABASE_ANON_KEY | Frontend (bundle público) | Pública — operações limitadas pelo RLS |
| SUPABASE_SERVICE_ROLE_KEY | Apenas servidor | **Nunca exposta no frontend** |

### 4.3 Variáveis de ambiente

`.env.local` listado no `.gitignore`. Nunca deve ser commitado. `.env.example` contém apenas nomes, sem valores reais.

---

## 5. Criptografia

| Dado | Mecanismo | Responsável |
|---|---|---|
| Dados em trânsito | TLS 1.2+ (HTTPS) | Vercel + Supabase |
| Dados em repouso | AES-256 | Supabase (infraestrutura gerenciada) |
| Senhas de usuário | bcrypt (hash + salt) | Supabase Auth |

---

## 6. Gestão de Usuários

- Novos usuários recebem role `viewer` por padrão (trigger handle_new_user)
- Elevação de role é feita manualmente pelo admin
- Suspensão (ativo = false) bloqueia acesso imediatamente

---

## 7. Procedimentos em Caso de Incidente

### Credencial comprometida (anon_key)
1. Supabase Dashboard → Project Settings → API → Rotacionar a chave
2. Atualizar variável nas configurações da Vercel
3. Fazer novo deploy

### Usuário comprometido
```sql
UPDATE profiles SET ativo = false WHERE email = 'comprometido@dominio.com';
```

### Dados expostos indevidamente
1. Identificar o vetor de exposição
2. Corrigir a política RLS correspondente
3. Auditar logs em Supabase Dashboard → Logs
4. Notificar usuários afetados conforme LGPD

---

## 8. Conformidade com LGPD

| Dado | Tabela | Base legal | Retenção |
|---|---|---|---|
| Nome e e-mail | profiles | Execução de contrato | Enquanto conta ativa |
| Dados de professores | professores | Execução de contrato | Indefinido (histórico) |
| Dados financeiros | pagamentos | Obrigação legal | Conforme legislação fiscal |
| Dados de pessoal | pessoal | Relação trabalhista | Conforme CLT |

O campo `data_demissao` na tabela `pessoal` permite identificar registros para atendimento do direito ao esquecimento (Art. 18, LGPD).

---

*Política de Segurança v1.0.0 — Sistema de Gestão Escolar — Junho de 2026*
