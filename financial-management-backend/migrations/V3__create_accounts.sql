-- V3__create_accounts.sql
-- Contas bancárias com suporte a múltiplos tipos e campos sensíveis criptografados

CREATE TYPE account_type AS ENUM (
    'CHECKING',
    'SAVINGS',
    'CREDIT_CARD',
    'INVESTMENT',
    'CASH',
    'OTHER'
);

CREATE TABLE accounts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    family_id           UUID            REFERENCES families(id) ON DELETE SET NULL,
    name                VARCHAR(150)    NOT NULL,
    type                account_type    NOT NULL DEFAULT 'CHECKING',
    bank_name           VARCHAR(150),
    bank_code           VARCHAR(10),
    agency              VARCHAR(500),           -- criptografado AES-256
    account_number      VARCHAR(500),           -- criptografado AES-256
    balance             DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
    credit_limit        DECIMAL(15, 2),         -- apenas para cartão de crédito
    currency            VARCHAR(3)      NOT NULL DEFAULT 'BRL',
    color               VARCHAR(7)               DEFAULT '#17c1e8',
    icon                VARCHAR(50),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    include_in_total    BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_accounts_user_id   ON accounts (user_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_family_id ON accounts (family_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_type      ON accounts (type);

CREATE TRIGGER trg_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE accounts IS 'Contas bancárias, cartões e carteiras do usuário';
COMMENT ON COLUMN accounts.agency         IS 'Agência bancária criptografada com AES-256';
COMMENT ON COLUMN accounts.account_number IS 'Número da conta criptografado com AES-256';
COMMENT ON COLUMN accounts.balance        IS 'Saldo atual calculado pela soma das transações';
COMMENT ON COLUMN accounts.credit_limit   IS 'Limite de crédito (apenas para tipo CREDIT_CARD)';
