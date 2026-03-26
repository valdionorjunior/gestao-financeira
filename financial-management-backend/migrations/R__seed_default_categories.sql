-- R__seed_default_categories.sql
-- Repeatable migration: categorias e subcategorias padrão do sistema
-- Executada sempre que o checksum mudar — idempotente via ON CONFLICT DO NOTHING

-- ─── DESPESAS ────────────────────────────────────────────────

INSERT INTO categories (id, name, type, icon, color, is_system, is_active)
VALUES
    ('00000001-0000-0000-0000-000000000001', 'Alimentação',          'EXPENSE', 'utensils',         '#ea0606', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000002', 'Moradia',              'EXPENSE', 'home',             '#344767', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000003', 'Transporte',           'EXPENSE', 'car',              '#17c1e8', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000004', 'Saúde',                'EXPENSE', 'heart-pulse',      '#cb0c9f', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000005', 'Educação',             'EXPENSE', 'graduation-cap',   '#8392ab', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000006', 'Lazer',                'EXPENSE', 'gamepad',          '#fbcf33', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000007', 'Vestuário',            'EXPENSE', 'shirt',            '#f53939', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000008', 'Tecnologia',           'EXPENSE', 'laptop',           '#3a416f', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000009', 'Serviços e Assinaturas','EXPENSE','wifi',             '#627594', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000010', 'Impostos e Taxas',     'EXPENSE', 'landmark',         '#8392ab', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000011', 'Seguros',              'EXPENSE', 'shield-check',     '#344767', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000012', 'Presentes e Doações',  'EXPENSE', 'gift',             '#cb0c9f', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000013', 'Investimentos',        'EXPENSE', 'trending-up',      '#82d616', TRUE, TRUE),
    ('00000001-0000-0000-0000-000000000014', 'Outros Gastos',        'EXPENSE', 'more-horizontal',  '#ced4da', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── RECEITAS ────────────────────────────────────────────────

INSERT INTO categories (id, name, type, icon, color, is_system, is_active)
VALUES
    ('00000002-0000-0000-0000-000000000001', 'Salário',              'INCOME', 'briefcase',        '#82d616', TRUE, TRUE),
    ('00000002-0000-0000-0000-000000000002', 'Freelance',            'INCOME', 'code',             '#17c1e8', TRUE, TRUE),
    ('00000002-0000-0000-0000-000000000003', 'Investimentos',        'INCOME', 'trending-up',      '#fbcf33', TRUE, TRUE),
    ('00000002-0000-0000-0000-000000000004', 'Aluguel Recebido',     'INCOME', 'home',             '#344767', TRUE, TRUE),
    ('00000002-0000-0000-0000-000000000005', 'Bonus e Comissões',    'INCOME', 'award',            '#cb0c9f', TRUE, TRUE),
    ('00000002-0000-0000-0000-000000000006', 'Pensão e Benefícios',  'INCOME', 'heart',            '#ea0606', TRUE, TRUE),
    ('00000002-0000-0000-0000-000000000007', 'Vendas',               'INCOME', 'shopping-bag',     '#8392ab', TRUE, TRUE),
    ('00000002-0000-0000-0000-000000000008', 'Outras Receitas',      'INCOME', 'plus-circle',      '#ced4da', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── TRANSFERÊNCIAS ──────────────────────────────────────────

INSERT INTO categories (id, name, type, icon, color, is_system, is_active)
VALUES
    ('00000003-0000-0000-0000-000000000001', 'Transferência',        'TRANSFER', 'arrow-right-left', '#17c1e8', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── SUBCATEGORIAS — ALIMENTAÇÃO ─────────────────────────────

INSERT INTO subcategories (id, category_id, name, is_active)
VALUES
    ('00000001-0001-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001', 'Supermercado',       TRUE),
    ('00000001-0001-0000-0000-000000000002', '00000001-0000-0000-0000-000000000001', 'Restaurante',        TRUE),
    ('00000001-0001-0000-0000-000000000003', '00000001-0000-0000-0000-000000000001', 'Lanche e Fast Food', TRUE),
    ('00000001-0001-0000-0000-000000000004', '00000001-0000-0000-0000-000000000001', 'Padaria',            TRUE),
    ('00000001-0001-0000-0000-000000000005', '00000001-0000-0000-0000-000000000001', 'Delivery',           TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── SUBCATEGORIAS — MORADIA ──────────────────────────────────

INSERT INTO subcategories (id, category_id, name, is_active)
VALUES
    ('00000001-0002-0000-0000-000000000001', '00000001-0000-0000-0000-000000000002', 'Aluguel',          TRUE),
    ('00000001-0002-0000-0000-000000000002', '00000001-0000-0000-0000-000000000002', 'Condomínio',       TRUE),
    ('00000001-0002-0000-0000-000000000003', '00000001-0000-0000-0000-000000000002', 'Energia Elétrica', TRUE),
    ('00000001-0002-0000-0000-000000000004', '00000001-0000-0000-0000-000000000002', 'Água e Esgoto',    TRUE),
    ('00000001-0002-0000-0000-000000000005', '00000001-0000-0000-0000-000000000002', 'Gás',              TRUE),
    ('00000001-0002-0000-0000-000000000006', '00000001-0000-0000-0000-000000000002', 'Internet',         TRUE),
    ('00000001-0002-0000-0000-000000000007', '00000001-0000-0000-0000-000000000002', 'Manutenção e Reparos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── SUBCATEGORIAS — TRANSPORTE ──────────────────────────────

INSERT INTO subcategories (id, category_id, name, is_active)
VALUES
    ('00000001-0003-0000-0000-000000000001', '00000001-0000-0000-0000-000000000003', 'Combustível',       TRUE),
    ('00000001-0003-0000-0000-000000000002', '00000001-0000-0000-0000-000000000003', 'Transporte Público',TRUE),
    ('00000001-0003-0000-0000-000000000003', '00000001-0000-0000-0000-000000000003', 'Uber/Táxi',         TRUE),
    ('00000001-0003-0000-0000-000000000004', '00000001-0000-0000-0000-000000000003', 'Estacionamento',    TRUE),
    ('00000001-0003-0000-0000-000000000005', '00000001-0000-0000-0000-000000000003', 'Manutenção Veículo',TRUE),
    ('00000001-0003-0000-0000-000000000006', '00000001-0000-0000-0000-000000000003', 'IPVA e Licenciamento', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── SUBCATEGORIAS — SAÚDE ───────────────────────────────────

INSERT INTO subcategories (id, category_id, name, is_active)
VALUES
    ('00000001-0004-0000-0000-000000000001', '00000001-0000-0000-0000-000000000004', 'Plano de Saúde',   TRUE),
    ('00000001-0004-0000-0000-000000000002', '00000001-0000-0000-0000-000000000004', 'Consultas',        TRUE),
    ('00000001-0004-0000-0000-000000000003', '00000001-0000-0000-0000-000000000004', 'Medicamentos',     TRUE),
    ('00000001-0004-0000-0000-000000000004', '00000001-0000-0000-0000-000000000004', 'Exames',           TRUE),
    ('00000001-0004-0000-0000-000000000005', '00000001-0000-0000-0000-000000000004', 'Academia',         TRUE),
    ('00000001-0004-0000-0000-000000000006', '00000001-0000-0000-0000-000000000004', 'Dentista',         TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── SUBCATEGORIAS — EDUCAÇÃO ─────────────────────────────────

INSERT INTO subcategories (id, category_id, name, is_active)
VALUES
    ('00000001-0005-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Mensalidade Escolar', TRUE),
    ('00000001-0005-0000-0000-000000000002', '00000001-0000-0000-0000-000000000005', 'Cursos Online',       TRUE),
    ('00000001-0005-0000-0000-000000000003', '00000001-0000-0000-0000-000000000005', 'Livros e Material',   TRUE),
    ('00000001-0005-0000-0000-000000000004', '00000001-0000-0000-0000-000000000005', 'Idiomas',             TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── SUBCATEGORIAS — SERVIÇOS E ASSINATURAS ──────────────────

INSERT INTO subcategories (id, category_id, name, is_active)
VALUES
    ('00000001-0009-0000-0000-000000000001', '00000001-0000-0000-0000-000000000009', 'Streaming (Netflix/Spotify)', TRUE),
    ('00000001-0009-0000-0000-000000000002', '00000001-0000-0000-0000-000000000009', 'Telefone/Celular',             TRUE),
    ('00000001-0009-0000-0000-000000000003', '00000001-0000-0000-0000-000000000009', 'Software e Aplicativos',       TRUE),
    ('00000001-0009-0000-0000-000000000004', '00000001-0000-0000-0000-000000000009', 'Serviços de Nuvem',            TRUE)
ON CONFLICT (id) DO NOTHING;
