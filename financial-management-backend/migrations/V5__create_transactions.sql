-- V5__create_transactions.sql
-- Transações financeiras (despesas, receitas e transferências unificadas)

CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

CREATE TYPE payment_method AS ENUM (
    'CASH',
    'DEBIT_CARD',
    'CREDIT_CARD',
    'TRANSFER',
    'PIX',
    'BOLETO',
    'OTHER'
);

CREATE TYPE transaction_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELED',
    'RECONCILED'
);

CREATE TABLE transactions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID                    NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    account_id              UUID                    NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    family_id               UUID                    REFERENCES families(id)          ON DELETE SET NULL,
    category_id             UUID                    REFERENCES categories(id)        ON DELETE SET NULL,
    subcategory_id          UUID                    REFERENCES subcategories(id)     ON DELETE SET NULL,
    -- Para transferências: conta de destino
    destination_account_id  UUID                    REFERENCES accounts(id)          ON DELETE SET NULL,
    -- Agrupamento de pares de transferência (débito + crédito)
    transfer_pair_id        UUID,
    type                    transaction_type        NOT NULL,
    amount                  DECIMAL(15, 2)          NOT NULL CHECK (amount > 0),
    description             VARCHAR(255)            NOT NULL,
    notes                   TEXT,
    date                    DATE                    NOT NULL,
    payment_method          payment_method          NOT NULL DEFAULT 'OTHER',
    status                  transaction_status      NOT NULL DEFAULT 'CONFIRMED',
    is_recurring            BOOLEAN                 NOT NULL DEFAULT FALSE,
    recurring_group_id      UUID,
    tags                    TEXT[],
    receipt_url             VARCHAR(500),
    created_at              TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ
);

-- Índices de consulta frequente
CREATE INDEX idx_transactions_user_id    ON transactions (user_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_account_id ON transactions (account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_date       ON transactions (date DESC)   WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_type       ON transactions (type)        WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_status     ON transactions (status)      WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_category   ON transactions (category_id) WHERE category_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_transactions_family     ON transactions (family_id)   WHERE family_id IS NOT NULL AND deleted_at IS NULL;
-- Índice composto para relatórios mensais
CREATE INDEX idx_transactions_user_date  ON transactions (user_id, date DESC) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE transactions IS 'Transações financeiras unificadas: receitas, despesas e transferências';
COMMENT ON COLUMN transactions.amount            IS 'Valor sempre positivo; o tipo define a direção do fluxo';
COMMENT ON COLUMN transactions.transfer_pair_id  IS 'Agrupa os dois lados de uma transferência (débito e crédito)';
COMMENT ON COLUMN transactions.recurring_group_id IS 'Agrupa transações recorrentes de mesma origem';
