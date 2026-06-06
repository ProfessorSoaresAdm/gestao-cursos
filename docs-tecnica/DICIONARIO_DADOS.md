# Dicionário de Dados

**Sistema:** Sistema de Gestão Escolar  
**Versão:** 1.0.0  
**Data:** Junho de 2026  
**Banco de dados:** PostgreSQL (Supabase) — Schema: public

---

## Convenções

| Símbolo | Significado |
|---|---|
| PK | Chave primária |
| FK | Chave estrangeira |
| UK | Chave única |
| NN | Not Null (obrigatório) |
| DF | Valor default |

---

## Tabela: profiles

Perfis de acesso dos usuários do sistema. Criada automaticamente via trigger `on_auth_user_created` ao registrar em `auth.users`. Relação 1:1 com a autenticação.

| Coluna | Tipo | Restrições | Default | Descrição |
|---|---|---|---|---|
| id | UUID | PK, FK auth.users ON DELETE CASCADE, NN | — | Mesmo UUID do usuário no Auth |
| nome | TEXT | NN | — | Nome de exibição |
| email | TEXT | NN, UK | — | E-mail de login |
| role | TEXT | NN, CHECK (admin, editor, viewer) | 'viewer' | Perfil de acesso |
| telas_acesso | TEXT[] | — | '{}' | Array de módulos permitidos ex: ['aulas','pagamentos'] |
| ativo | BOOLEAN | NN | true | false = conta suspensa |
| criado_em | TIMESTAMPTZ | NN | NOW() | Data de criação |
| atualizado_em | TIMESTAMPTZ | NN | NOW() | Atualizado pelo trigger |

**Políticas RLS:** SELECT e UPDATE — próprio perfil ou admin

---

## Tabela: professores

Cadastro central de professores. Referenciada por `aulas` e `pagamentos`.

| Coluna | Tipo | Restrições | Default | Descrição |
|---|---|---|---|---|
| id | UUID | PK, NN | gen_random_uuid() | Identificador único |
| nome | TEXT | NN | — | Nome completo |
| email | TEXT | UK | NULL | E-mail de contato |
| telefone | TEXT | — | NULL | Telefone de contato |
| especialidade | TEXT | — | NULL | Área de atuação |
| documento | TEXT | — | NULL | CPF ou equivalente |
| cep | TEXT | — | NULL | CEP do endereço |
| logradouro | TEXT | — | NULL | Rua/Avenida |
| numero | TEXT | — | NULL | Número |
| complemento | TEXT | — | NULL | Complemento |
| bairro | TEXT | — | NULL | Bairro |
| cidade | TEXT | — | NULL | Cidade |
| estado | TEXT | — | NULL | UF (2 caracteres) |
| endereco | TEXT | — | NULL | Campo legado de endereço em texto livre |
| observacoes | TEXT | — | NULL | Anotações internas |
| ativo | BOOLEAN | NN | true | false = professor inativo |
| criado_em | TIMESTAMPTZ | NN | NOW() | Data de cadastro |
| atualizado_em | TIMESTAMPTZ | NN | NOW() | Atualizado pelo trigger |

**Índices:** idx_professores_ativo  
**RLS:** SELECT — autenticados; INSERT/UPDATE/DELETE — admin e editor

---

## Tabela: aulas

Registro de aulas ao vivo. FK professor_id com ON DELETE SET NULL.

| Coluna | Tipo | Restrições | Default | Descrição |
|---|---|---|---|---|
| id | UUID | PK, NN | gen_random_uuid() | Identificador único |
| professor_id | UUID | FK professores ON DELETE SET NULL | NULL | Professor responsável |
| titulo | TEXT | NN | — | Título da aula |
| descricao | TEXT | — | NULL | Descrição detalhada |
| data_hora | TIMESTAMPTZ | NN | — | Data e hora em UTC |
| duracao_minutos | INTEGER | NN | 60 | Duração em minutos |
| link_transmissao | TEXT | — | NULL | URL da transmissão ao vivo |
| status | TEXT | NN, CHECK (agendada, realizada, cancelada) | 'agendada' | Estado da aula |
| gravacao_url | TEXT | — | NULL | URL da gravação pós-aula |
| observacoes | TEXT | — | NULL | Anotações |
| criado_em | TIMESTAMPTZ | NN | NOW() | Data de criação |
| atualizado_em | TIMESTAMPTZ | NN | NOW() | Atualizado pelo trigger |

**Status:**

| Valor | Significado |
|---|---|
| agendada | Programada para data futura |
| realizada | Concluída. gravacao_url pode ser preenchido |
| cancelada | Não realizada. Registro preservado |

**Índices:** idx_aulas_professor, idx_aulas_data, idx_aulas_status  
**RLS:** SELECT — autenticados; INSERT/UPDATE/DELETE — admin e editor

---

## Tabela: pagamentos

Controle financeiro. FKs professor_id e aula_id com ON DELETE SET NULL.

| Coluna | Tipo | Restrições | Default | Descrição |
|---|---|---|---|---|
| id | UUID | PK, NN | gen_random_uuid() | Identificador único |
| professor_id | UUID | FK professores ON DELETE SET NULL | NULL | Professor beneficiário |
| aula_id | UUID | FK aulas ON DELETE SET NULL | NULL | Aula vinculada |
| descricao | TEXT | NN | — | Descrição do pagamento |
| valor | NUMERIC(10,2) | NN | — | Valor em reais |
| data_vencimento | DATE | NN | — | Data de vencimento |
| data_pagamento | DATE | — | NULL | Data de quitação |
| status | TEXT | NN, CHECK (pendente, pago, cancelado) | 'pendente' | Status persistido |
| metodo | TEXT | CHECK (pix, transferencia, dinheiro, outro) | NULL | Método de pagamento |
| comprovante_url | TEXT | — | NULL | URL do comprovante (v1.1) |
| observacoes | TEXT | — | NULL | Anotações |
| criado_em | TIMESTAMPTZ | NN | NOW() | Data de criação |
| atualizado_em | TIMESTAMPTZ | NN | NOW() | Atualizado pelo trigger |

**Status no banco:**

| Valor | Significado |
|---|---|
| pendente | Aguardando pagamento |
| pago | Quitado. data_pagamento e metodo preenchidos |
| cancelado | Cancelado. Registro preservado |

**Status calculado (não persistido):** status = 'pendente' AND data_vencimento < CURRENT_DATE → exibido como "atrasado"

**Índices:** idx_pagamentos_status, idx_pagamentos_venc, idx_pagamentos_prof  
**RLS:** SELECT — autenticados; INSERT/UPDATE/DELETE — admin e editor

---

## Tabela: pessoal

Dados internos confidenciais dos colaboradores. Acesso exclusivo: admin.

| Coluna | Tipo | Restrições | Default | Descrição |
|---|---|---|---|---|
| id | UUID | PK, NN | gen_random_uuid() | Identificador único |
| nome | TEXT | NN | — | Nome completo |
| cargo | TEXT | — | NULL | Função na instituição |
| email | TEXT | — | NULL | E-mail de contato |
| telefone | TEXT | — | NULL | Telefone |
| documento | TEXT | — | NULL | CPF ou equivalente |
| salario | NUMERIC(10,2) | — | NULL | **CONFIDENCIAL** — nunca exibir em listagens ou CSV |
| data_admissao | DATE | — | NULL | Data de início |
| data_demissao | DATE | — | NULL | Data de desligamento |
| status | TEXT | NN, CHECK (ativo, inativo, ferias, afastado) | 'ativo' | Status atual |
| observacoes | TEXT | — | NULL | Notas internas |
| criado_em | TIMESTAMPTZ | NN | NOW() | Data de criação |
| atualizado_em | TIMESTAMPTZ | NN | NOW() | Atualizado pelo trigger |

**Índices:** idx_pessoal_status  
**RLS:** ALL — somente admin

---

## View: pagamentos_com_status

Calcula o status "atrasado" em tempo real no banco.

```sql
CREATE OR REPLACE VIEW pagamentos_com_status AS
SELECT p.*,
  CASE
    WHEN p.status = 'pendente' AND p.data_vencimento < CURRENT_DATE
    THEN 'atrasado'
    ELSE p.status
  END AS status_calculado
FROM pagamentos p;
```

---

## Funções e Triggers

### set_atualizado_em()

Trigger executada em BEFORE UPDATE em todas as tabelas. Atualiza `atualizado_em` com NOW().

### get_my_role()

Retorna o role do usuário autenticado. `SECURITY DEFINER` previne bypass de search_path. Usada nas políticas RLS de todas as tabelas.

### handle_new_user()

Trigger em AFTER INSERT em `auth.users`. Cria automaticamente registro em `profiles` com role = 'viewer'. Garante consistência entre Auth e profiles.

---

*Dicionário de Dados v1.0.0 — Sistema de Gestão Escolar — Junho de 2026*
