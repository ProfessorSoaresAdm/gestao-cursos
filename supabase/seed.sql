-- ============================================================
-- Sistema de Gestão Escolar — SEED MOCK DATA
-- Popular o banco com dados fictícios para testes.
-- ============================================================

-- Remover todos os registros anteriores de tabelas não sistêmicas para ter seed idempotente (desativado para evitar perda em prod)
-- TRUNCATE TABLE pagamentos, aulas, professores, pessoal RESTART IDENTITY CASCADE;

-- 1. PROFESSORES FICTÍCIOS
INSERT INTO professores (id, nome, email, telefone, especialidade, documento, endereco, observacoes, ativo)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Carlos Silva', 'carlos@escola.com', '(11) 98765-4321', 'Matemática', '123.456.789-00', 'Rua das Flores, 123', 'Professor de período matutino', true),
  ('22222222-2222-2222-2222-222222222222', 'Mariana Souza', 'mariana@escola.com', '(11) 91234-5678', 'História', '987.654.321-11', 'Av. Central, 456', 'Excelente didática, disponibilidade flexível', true),
  ('33333333-3333-3333-3333-333333333333', 'Roberto Oliveira', 'roberto@escola.com', '(11) 99988-7766', 'Física', '456.123.789-22', 'Praça da Matriz, 78', 'Prefere aulas à tarde', true)
ON CONFLICT (id) DO NOTHING;

-- 2. AULAS MOCKADAS
-- Mesclando status agendada, realizada, cancelada
INSERT INTO aulas (id, professor_id, titulo, descricao, data_hora, duracao_minutos, link_transmissao, status, gravacao_url)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Álgebra Linear - Turma A', 'Revisão de matrizes e determinantes', NOW() - INTERVAL '2 days', 90, 'https://meet.google.com/abc', 'realizada', 'https://drive.google.com/file/xyz'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Idade Média - Turma B', 'Feudalismo e cruzadas', NOW() - INTERVAL '1 day', 60, 'https://meet.google.com/def', 'realizada', 'https://drive.google.com/file/wxy'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Cinemática Escalar', 'Velocidade e aceleração', NOW() + INTERVAL '1 day', 60, 'https://meet.google.com/ghi', 'agendada', NULL),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Geometria Analítica', 'Estudo de retas e circunferências', NOW() + INTERVAL '2 days', 90, 'https://meet.google.com/jkl', 'agendada', NULL),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'Revolução Francesa', 'Causas e consequências', NOW() - INTERVAL '5 days', 60, NULL, 'cancelada', NULL)
ON CONFLICT (id) DO NOTHING;

-- 3. PAGAMENTOS MOCKADOS
-- 4 pagamentos (pendente, pago, atrasado)
INSERT INTO pagamentos (id, professor_id, aula_id, descricao, valor, data_vencimento, data_pagamento, status, metodo)
VALUES
  ('1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pagamento Aula Álgebra', 150.00, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day', 'pago', 'pix'),
  ('2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Pagamento Aula Idade Média', 120.00, CURRENT_DATE + INTERVAL '5 days', NULL, 'pendente', NULL),
  ('3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', '11111111-1111-1111-1111-111111111111', NULL, 'Adiantamento Mensal', 500.00, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '9 days', 'pago', 'transferencia'),
  ('4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', '33333333-3333-3333-3333-333333333333', NULL, 'Pagamento Bonificação Mensal', 200.00, CURRENT_DATE - INTERVAL '3 days', NULL, 'pendente', NULL) -- Atrasado computado no frontend
ON CONFLICT (id) DO NOTHING;

-- 4. PESSOAL MOCKADO
INSERT INTO pessoal (id, nome, cargo, email, telefone, documento, salario, data_admissao, status)
VALUES
  ('5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e', 'Fernanda Lima', 'Secretária Acadêmica', 'fernanda.lima@escola.com', '(11) 97777-6666', '333.444.555-66', 3500.00, '2023-01-15', 'ativo'),
  ('6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f', 'Paulo Cardoso', 'Zelador', 'paulo.cardoso@escola.com', '(11) 95555-4444', '111.222.333-44', 2200.00, '2022-05-10', 'ativo')
ON CONFLICT (id) DO NOTHING;
