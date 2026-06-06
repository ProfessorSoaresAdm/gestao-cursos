# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)  
Versionamento: [Semantic Versioning](https://semver.org/lang/pt-BR/)

---

## [1.0.0] — 2026-06-03

### Adicionado

**Módulo Aulas**
- Agendamento de aulas com título, professor, data/hora, duração e link de transmissão
- Status: Agendada, Realizada, Cancelada
- Filtros por título, professor, mês/ano e status
- Ação rápida de status na listagem
- Campo de URL de gravação (exibido ao marcar como Realizada)
- Importação em massa via CSV e exportação da lista filtrada

**Módulo Pagamentos**
- Registro com descrição, valor, professor, aula vinculada e vencimento
- Status persistido: Pendente, Pago, Cancelado
- Status calculado no frontend: Atrasado
- Ação de marcar como Pago com data e método
- Cards de resumo por status (Pago, Pendente, Atrasado)
- Filtros por status, professor, período e busca textual
- Exportação da lista filtrada em CSV

**Módulo Professores**
- Cadastro completo com dados de contato, especialidade, CPF e endereço
- Busca por nome e filtro por status ativo/inativo
- Inativação lógica com preservação de histórico
- Lookup de CEP para preenchimento automático de endereço
- Exportação e importação em massa via CSV

**Módulo Pessoal**
- Cadastro de colaboradores com dados de contato, cargo, salário e status
- Acesso restrito ao perfil administrador
- Campo salário confidencial — nunca exibido em listagens ou CSVs
- Status: Ativo, Inativo, Férias, Afastado

**Módulo Usuários**
- Listagem de todos os usuários
- Gerenciamento de roles (admin, editor, viewer)
- Configuração granular de telas de acesso por usuário
- Suspensão de contas

**Módulo Dashboard**
- Visão geral com métricas dos módulos principais
- Gráficos de aulas e pagamentos por período

**Autenticação e Segurança**
- Login por e-mail e senha via Supabase Auth
- Sessão persistente com renovação automática de token
- AuthContext centralizado com carregamento do perfil
- AuthGuard com verificação de autenticação, suspensão e telas de acesso
- RLS habilitado em todas as tabelas
- Função get_my_role() com SECURITY DEFINER

**Banco de Dados**
- Schema com tabelas: profiles, professores, aulas, pagamentos, pessoal
- Triggers automáticos de atualizado_em em todas as tabelas
- Trigger de criação automática de profile ao registrar usuário
- View pagamentos_com_status com status atrasado calculado
- Índices de performance nas colunas de alta consulta
- Soft delete em todas as entidades operacionais

**Interface**
- Layout com sidebar fixa e header
- Tema escuro com componentes shadcn/ui
- Exportação CSV com UTF-8 BOM e delimitador ponto-e-vírgula
- Feedback por toasts em todas as operações assíncronas
- Diálogos de confirmação para ações destrutivas
- Responsividade básica para mobile

---

## Versionamento

| Tipo | Significado |
|---|---|
| MAJOR (X.0.0) | Mudanças incompatíveis (breaking changes) |
| MINOR (0.X.0) | Novas funcionalidades compatíveis |
| PATCH (0.0.X) | Correções de bugs compatíveis |

---

*Changelog mantido conforme Keep a Changelog — Sistema de Gestão Escolar*
