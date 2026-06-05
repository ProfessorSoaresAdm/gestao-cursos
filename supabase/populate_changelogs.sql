-- Inserção dos changelogs baseados nos commits recentes
-- Execute no SQL Editor do Supabase

INSERT INTO changelogs (versao, tipo, titulo, descricao, autor) VALUES
('1.1.0', 'feature', 'Features Instagram - Cadastro Professores', 'Adicionado suporte para vínculo de Instagram e upload de fotos no perfil do professor.', 'sistema'),
('1.1.0', 'melhoria', 'Ajustes no novo padrão visual', 'Implementados refinamentos estéticos no sistema.', 'sistema'),
('1.1.0', 'melhoria', 'Ajustes na paleta de cores', 'Cores padronizadas de acordo com o novo design.', 'sistema'),
('1.1.0', 'feature', 'Módulo de relatórios', 'Adicionada área completa de relatórios com exportação e gráficos interativos.', 'sistema'),
('1.1.0', 'fix', 'Correcao do ErrorBoundary', 'Corrigido problema com telas em branco causadas por falhas na renderização de rotas.', 'sistema'),
('1.1.0', 'melhoria', 'Lazy load e rotas de acesso', 'Melhoria de performance utilizando lazy loading nas páginas principais do sistema.', 'sistema'),
('1.1.0', 'melhoria', 'Padronização dos formulários', 'Unificação dos estilos e comportamento das telas de formulário.', 'sistema'),
('1.1.0', 'seguranca', 'Auditoria e melhoria da segurança', 'Auditoria do projeto, refatoração estrutural de segurança e revisão de RLS.', 'sistema');