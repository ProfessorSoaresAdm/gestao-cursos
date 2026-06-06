# Plano de Testes

**Sistema:** Sistema de Gestão Escolar  
**Versão:** 1.0.0  
**Data:** Junho de 2026

---

## 1. Objetivos

Validar o funcionamento do sistema cobrindo: autenticação, controle de acesso por RLS, operações CRUD de cada módulo, regras de negócio e integridade de dados.

---

## 2. Ambiente de Teste

- **URL:** localhost:3000 (desenvolvimento) ou ambiente de staging
- **Banco:** Projeto Supabase separado com `supabase/seed.sql` aplicado
- **Navegador:** Google Chrome (versão atual)

### Usuários necessários

| E-mail | Senha | Role | Telas de acesso |
|---|---|---|---|
| admin@teste.com | Teste@123 | admin | todas |
| editor@teste.com | Teste@123 | editor | aulas, pagamentos, professores |
| viewer@teste.com | Teste@123 | viewer | aulas, pagamentos |
| suspenso@teste.com | Teste@123 | viewer | aulas | ativo = false |

---

## 3. Autenticação

### CT-AUTH-01: Login com credenciais válidas
Preencher email e senha válidos → clicar em Acessar Painel  
**Esperado:** Redirecionamento para dashboard. Sidebar com módulos visíveis.

### CT-AUTH-02: Login com senha incorreta
Preencher email válido e senha errada  
**Esperado:** Mensagem de erro. Sem redirecionamento.

### CT-AUTH-03: Acesso sem autenticação
Acessar `/aulas` diretamente no navegador  
**Esperado:** Redirecionamento para `/login`.

### CT-AUTH-04: Conta suspensa
Login com suspenso@teste.com  
**Esperado:** Redirecionamento para `/login?error=suspended` com mensagem de suspensão.

### CT-AUTH-05: Persistência de sessão
Fazer login, fechar e reabrir o navegador, acessar o sistema  
**Esperado:** Usuário continua autenticado sem novo login.

### CT-AUTH-06: Logout
Clicar em "Sair" na sidebar  
**Esperado:** Sessão encerrada. Redirecionamento para `/login`.

---

## 4. Controle de Acesso

### CT-ACL-01: Viewer não vê botões de ação
Login como viewer → acessar /aulas  
**Esperado:** Tabela visível. Botões "Nova Aula", "Editar" e ações de status **ausentes**.

### CT-ACL-02: Módulo Pessoal bloqueado para não-admin
Login como editor → tentar acessar `/pessoal`  
**Esperado:** Redirecionamento para a primeira tela permitida do editor.

### CT-ACL-03: Módulo Usuários bloqueado para não-admin
Login como editor → tentar acessar `/usuarios`  
**Esperado:** Redirecionamento. Item "Usuários" não aparece na sidebar.

### CT-ACL-04: Tela não permitida redireciona
Login como viewer (telas: aulas, pagamentos) → tentar acessar `/professores`  
**Esperado:** Redirecionamento para `/aulas`.

### CT-ACL-05: RLS bloqueia escrita direta via SDK *(teste de segurança)*
Login como viewer → abrir console do navegador → executar:
```javascript
supabase.from('aulas').insert([{titulo:'Teste',data_hora:new Date().toISOString(),duracao_minutos:60}])
```
**Esperado:** Erro 42501 (violação de RLS). Nenhum registro inserido.

---

## 5. Módulo Professores

### CT-PROF-01: Cadastrar professor
Login como editor → Novo Professor → preencher nome, e-mail, especialidade → Salvar  
**Esperado:** Professor na listagem. Toast de sucesso.

### CT-PROF-02: E-mail duplicado
Tentar cadastrar professor com e-mail já existente  
**Esperado:** Erro exibido. Registro não criado.

### CT-PROF-03: Inativar professor
Inativar professor ativo → confirmar  
**Esperado:** Some da listagem padrão (ativos). Aparece ao filtrar por "Inativos". Não aparece nos seletores de Aulas.

### CT-PROF-04: Histórico preservado após inativação
Inativar professor com aulas cadastradas → verificar /aulas  
**Esperado:** Aulas preservadas com nome do professor exibido.

### CT-PROF-05: Exportação CSV
Aplicar filtro → Exportar CSV → abrir no Excel  
**Esperado:** Registros filtrados. Encoding UTF-8 correto. Headers em português.

---

## 6. Módulo Aulas

### CT-AULA-01: Agendar aula
Nova Aula → título, professor, data futura → Salvar  
**Esperado:** Aula criada com status "Agendada". Toast de sucesso.

### CT-AULA-02: Marcar como Realizada
Clicar no ícone de realizada → confirmar  
**Esperado:** Badge "Realizada" (verde).

### CT-AULA-03: Campo gravação visível ao editar aula realizada
Editar aula com status "Realizada"  
**Esperado:** Campo "Link da Gravação" visível no formulário.

### CT-AULA-04: Cancelamento preserva registro
Cancelar aula → filtrar por "Cancelada"  
**Esperado:** Aula na listagem com status "Cancelada".

### CT-AULA-05: Filtro por professor
Selecionar professor no filtro  
**Esperado:** Apenas aulas do professor selecionado.

### CT-AULA-06: Fuso horário
Criar aula com horário 19:00  
**Esperado:** Exibido como 19:00 no fuso local. Banco armazena em UTC.

---

## 7. Módulo Pagamentos

### CT-PAG-01: Registrar pagamento
Criar pagamento com valor R$500,00 e vencimento amanhã  
**Esperado:** Status "Pendente".

### CT-PAG-02: Status Atrasado calculado
Verificar pagamento pendente com vencimento anterior à data atual  
**Esperado:** Badge "Atrasado" (vermelho). Contabilizado no card de resumo.

### CT-PAG-03: Marcar como Pago
Clicar em "Marcar como Pago" → informar data e método → confirmar  
**Esperado:** Status = Pago. data_pagamento e metodo registrados. Totais atualizados.

### CT-PAG-04: Salário ausente no CSV
Exportar CSV do módulo Pagamentos  
**Esperado:** Nenhuma coluna "salário" no arquivo.

---

## 8. Módulo Pessoal

### CT-PESS-01: Campo salário apenas no formulário
Abrir formulário de cadastro de colaborador  
**Esperado:** Campo salário presente. Ao voltar para listagem, coluna salário **ausente** na tabela.

### CT-PESS-02: CSV sem salário
Exportar CSV do módulo Pessoal  
**Esperado:** Nenhuma coluna "salário" no arquivo.

---

## 9. Exportação e Importação CSV

### CT-CSV-01: Importação de aulas
Preparar CSV com colunas: Nome do Professor, Titulo, DataHora, Duracao, Status, Link → importar  
**Esperado:** Aulas criadas. Professor vinculado pelo nome exato.

### CT-CSV-02: Professor inexistente na importação
Importar CSV com "Nome Inexistente" na coluna de professor  
**Esperado:** Erro indicando nome não encontrado. Nenhum registro criado.

### CT-CSV-03: Delimitador e encoding
Exportar qualquer módulo → abrir no Excel (pt-BR)  
**Esperado:** Colunas separadas corretamente (ponto-e-vírgula). Caracteres especiais exibidos corretamente.

---

## 10. Critérios de Aceite

| Critério | Condição |
|---|---|
| CT-AUTH: todos os casos | 100% aprovados |
| CT-ACL-05 (RLS via SDK) | Erro 42501 confirmado |
| CT-PESS-01 e CT-PESS-02 (salário) | 100% aprovados |
| Build sem erros | `npm run build` retorna zero erros TypeScript |
| Todos os CTs de CRUD | 100% aprovados |

---

*Plano de Testes v1.0.0 — Sistema de Gestão Escolar — Junho de 2026*
