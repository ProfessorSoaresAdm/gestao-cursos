# Especificação de Requisitos de Software (ERS)

**Sistema:** Sistema de Gestão Escolar  
**Versão:** 1.0.0  
**Data:** Junho de 2026  
**Classificação:** Uso Privado — Todos os Direitos Reservados

---

## 1. Introdução

### 1.1 Propósito

Este documento especifica os requisitos funcionais e não funcionais do Sistema de Gestão Escolar, uma aplicação web multi-usuário destinada à centralização das operações de uma instituição de ensino: agendamento de aulas, controle financeiro de pagamentos a professores, cadastro de professores e gestão de dados internos de pessoal.

### 1.2 Escopo

O sistema substitui planilhas desconectadas por uma plataforma centralizada, acessível por navegador, sem instalação local. Dados armazenados em banco de dados relacional na nuvem com acesso controlado por perfil de usuário.

### 1.3 Definições

| Termo | Definição |
|---|---|
| Admin | Perfil com permissões totais no sistema |
| Editor | Perfil com permissão de leitura e escrita nos módulos operacionais |
| Viewer | Perfil com permissão somente de leitura |
| Soft delete | Inativação lógica de registro sem exclusão física do banco |
| RLS | Row Level Security — controle de acesso a nível de linha no PostgreSQL |
| Status calculado | Status derivado de regra de negócio no frontend, não persistido no banco |

---

## 2. Descrição Geral do Sistema

### 2.1 Perspectiva do Produto

Aplicação web SPA (Single Page Application) com backend-as-a-service (Supabase/PostgreSQL). Deployada na Vercel. Não requer instalação local em nenhum dispositivo.

### 2.2 Funções Principais

- Gestão do ciclo de vida de aulas ao vivo (agendamento, realização, histórico)
- Controle de pagamentos a professores com rastreamento de vencimentos
- Cadastro centralizado de professores com dados de contato e especialidade
- Armazenamento seguro de dados internos de pessoal (acesso restrito)
- Controle granular de acesso por usuário (role + telas permitidas individualmente)

### 2.3 Usuários do Sistema

| Perfil | Descrição | Quantidade típica |
|---|---|---|
| Administrador | Gestor geral com acesso irrestrito | 1–2 |
| Editor | Operador do dia a dia | 2–5 |
| Viewer | Consultor com apenas leitura | Ilimitado |

### 2.4 Ambiente Operacional

- **Navegadores suportados:** Google Chrome 110+, Firefox 110+, Safari 16+, Edge 110+
- **Dispositivos:** Desktop (principal), tablet e mobile (suporte básico)
- **Conectividade:** Requer conexão com a internet para todas as operações
- **Resolução mínima recomendada:** 1280 × 800 px

---

## 3. Requisitos Funcionais

### RF-01 — Autenticação e Sessão

| ID | Requisito |
|---|---|
| RF-01.1 | O sistema deve autenticar usuários por e-mail e senha |
| RF-01.2 | A sessão deve persistir entre recarregamentos de página |
| RF-01.3 | O token de acesso deve ser renovado automaticamente antes da expiração |
| RF-01.4 | O sistema deve redirecionar usuários não autenticados para a tela de login |
| RF-01.5 | Usuários com conta suspensa devem ser redirecionados com mensagem de suspensão |
| RF-01.6 | O sistema deve exibir indicador de carregamento enquanto verifica a sessão |

### RF-02 — Controle de Acesso

| ID | Requisito |
|---|---|
| RF-02.1 | Cada usuário possui um perfil (role): admin, editor ou viewer |
| RF-02.2 | O perfil admin tem acesso irrestrito a todos os módulos e operações |
| RF-02.3 | O perfil editor pode criar, editar e alterar status em Aulas, Pagamentos e Professores |
| RF-02.4 | O perfil viewer pode apenas visualizar registros nos módulos permitidos |
| RF-02.5 | Além do role, cada usuário possui lista de telas permitidas configurável individualmente |
| RF-02.6 | Usuário sem telas permitidas configuradas e com role não-admin deve ver tela de acesso restrito |
| RF-02.7 | Os módulos Pessoal e Usuários são acessíveis apenas ao perfil admin |

### RF-03 — Módulo Professores

| ID | Requisito |
|---|---|
| RF-03.1 | Permitir cadastrar professores com nome, e-mail, telefone, especialidade, CPF e endereço |
| RF-03.2 | O e-mail do professor deve ser único no sistema |
| RF-03.3 | Permitir busca por nome e filtro por status (ativo/inativo) |
| RF-03.4 | Professores não devem ser excluídos fisicamente — apenas inativados (ativo = false) |
| RF-03.5 | Professores inativos não aparecem nos seletores de Aulas e Pagamentos, mas o histórico é preservado |
| RF-03.6 | Permitir exportação da lista em CSV e importação em massa via CSV |

### RF-04 — Módulo Aulas

| ID | Requisito |
|---|---|
| RF-04.1 | Permitir cadastrar aulas com título, professor, data/hora, duração, link de transmissão e status |
| RF-04.2 | A data/hora deve ser armazenada em UTC e exibida no fuso horário local do usuário |
| RF-04.3 | Oferecer filtros por: título (busca textual), professor, mês/ano e status |
| RF-04.4 | Status válidos: Agendada, Realizada, Cancelada |
| RF-04.5 | Ao marcar como Realizada, exibir campo de URL de gravação |
| RF-04.6 | Aulas canceladas preservam o registro com status Cancelada (soft delete) |
| RF-04.7 | Suportar importação em massa de aulas via CSV e exportação da lista filtrada |
| RF-04.8 | Se o professor vinculado for inativado, a aula permanece com professor_id preservado |

### RF-05 — Módulo Pagamentos

| ID | Requisito |
|---|---|
| RF-05.1 | Permitir registrar pagamentos com descrição, valor, vencimento, professor e aula vinculada |
| RF-05.2 | Status persistidos no banco: Pendente, Pago, Cancelado |
| RF-05.3 | Status Atrasado é calculado no frontend: status = Pendente AND data_vencimento < hoje |
| RF-05.4 | Ao marcar como Pago, registrar data de pagamento e método |
| RF-05.5 | Exibir cards de resumo com totais por status (Pago, Pendente, Atrasado) |
| RF-05.6 | Oferecer filtros por: status, professor, mês/ano e busca textual |
| RF-05.7 | Pagamentos cancelados preservam o registro (soft delete: status = Cancelado) |
| RF-05.8 | Valores monetários armazenados como NUMERIC(10,2) para precisão decimal |

### RF-06 — Módulo Pessoal

| ID | Requisito |
|---|---|
| RF-06.1 | Módulo acessível exclusivamente ao perfil admin |
| RF-06.2 | Permitir cadastrar colaboradores com nome, cargo, e-mail, telefone, CPF, salário, data de admissão e status |
| RF-06.3 | O campo salário nunca deve ser exibido em listagens, cards ou arquivos CSV exportados |
| RF-06.4 | O campo salário é visível apenas no formulário de criação/edição, exclusivamente para admin |
| RF-06.5 | Status de colaboradores: Ativo, Inativo, Férias, Afastado |

### RF-07 — Módulo Usuários

| ID | Requisito |
|---|---|
| RF-07.1 | Módulo acessível exclusivamente ao perfil admin |
| RF-07.2 | Listar todos os usuários com nome, e-mail, role e status |
| RF-07.3 | Permitir alterar o role de qualquer usuário |
| RF-07.4 | Permitir configurar individualmente as telas permitidas de cada usuário |
| RF-07.5 | Permitir suspender uma conta (ativo = false) sem excluí-la |
| RF-07.6 | A criação de novos usuários deve ser feita exclusivamente pelo módulo Usuários |

### RF-08 — Exportação CSV

| ID | Requisito |
|---|---|
| RF-08.1 | Todos os módulos com listagem devem oferecer exportação em CSV |
| RF-08.2 | O CSV deve usar ponto-e-vírgula como delimitador e codificação UTF-8 com BOM |
| RF-08.3 | Datas devem ser formatadas como DD/MM/AAAA |
| RF-08.4 | A exportação deve refletir os filtros ativos — não exporta todos os registros |
| RF-08.5 | O campo salário não deve constar em nenhum CSV exportado |

---

## 4. Requisitos Não Funcionais

### RNF-01 — Desempenho

| ID | Requisito |
|---|---|
| RNF-01.1 | Carregamento inicial inferior a 3 segundos em conexão 4G |
| RNF-01.2 | Operações de leitura (listagens) retornam em até 2 segundos |
| RNF-01.3 | Operações de escrita concluem em até 3 segundos |

### RNF-02 — Segurança

| ID | Requisito |
|---|---|
| RNF-02.1 | Toda comunicação criptografada via HTTPS/TLS |
| RNF-02.2 | Dados em repouso criptografados (AES-256, gerenciado pela infraestrutura Supabase) |
| RNF-02.3 | Políticas RLS aplicadas a nível de banco — segurança não depende exclusivamente do frontend |
| RNF-02.4 | Chave service_role nunca exposta no código frontend |

### RNF-03 — Disponibilidade

Disponibilidade alvo: 99,5% mensal. O sistema depende da disponibilidade da infraestrutura Vercel e Supabase.

### RNF-04 — Manutenibilidade

| ID | Requisito |
|---|---|
| RNF-04.1 | Todo código TypeScript deve compilar sem erros antes de qualquer deploy |
| RNF-04.2 | Estrutura de módulos segue o padrão Page / Form / Service por domínio |
| RNF-04.3 | Queries ao banco encapsuladas em arquivos service — nunca diretamente em componentes |

---

## 5. Regras de Negócio

### RN-01 — Soft Delete Obrigatório

Nenhum registro de dado operacional deve ser excluído fisicamente.

| Entidade | Mecanismo |
|---|---|
| Professor | ativo = false |
| Aula | status = 'cancelada' |
| Pagamento | status = 'cancelado' |
| Colaborador | status = 'inativo' |
| Usuário | ativo = false em profiles |

### RN-02 — Cascata de Inativação de Professor

Ao inativar um professor, aulas e pagamentos vinculados preservam o professor_id no histórico. O professor inativo não aparece em seletores de novos registros. Em exclusão física (proibida pelo sistema), as FKs recebem NULL automaticamente via ON DELETE SET NULL.

### RN-03 — Status Atrasado de Pagamentos

Não persistido no banco. Calculado pelo frontend:

```
status_exibido = "atrasado"
  SE status = "pendente"
  E data_vencimento < data_atual
```

A view `pagamentos_com_status` implementa esta mesma regra no banco para consultas SQL diretas.

### RN-04 — Fuso Horário das Aulas

Armazenado em UTC (TIMESTAMPTZ). Exibido no fuso local do navegador. O formulário captura hora local e converte para UTC antes de salvar.

### RN-05 — Sigilo do Campo Salário

Campo `pessoal.salario` classificado como confidencial. Não aparece em listagens, cards ou CSVs. Visível apenas no formulário de criação/edição para admin.

### RN-06 — Hierarquia de Permissões

Dois níveis complementares:
- **Role:** define operações permitidas (admin, editor, viewer)
- **Telas de acesso:** define módulos visíveis na navegação, configurável individualmente pelo admin

### RN-07 — Primeiro Usuário Admin

Não há registro público. O primeiro admin é promovido via SQL:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@dominio.com';
```

---

## 6. Restrições e Premissas

### 6.1 Restrições Técnicas

- Sistema opera exclusivamente como SPA (sem renderização no servidor)
- Sem suporte a modo offline — todas as operações requerem conectividade
- Node.js 18+ para desenvolvimento local

### 6.2 Dependências Externas

| Serviço | Finalidade | Criticidade |
|---|---|---|
| Supabase | Banco de dados, autenticação, storage | Crítica |
| Vercel | Hospedagem do frontend | Crítica |
| GitHub | Controle de versão | Alta |

---

*ERS v1.0.0 — Sistema de Gestão Escolar — Junho de 2026*
