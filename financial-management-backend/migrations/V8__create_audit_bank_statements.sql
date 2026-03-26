-- V8__create_audit_bank_statements.sql
-- Auditoria completa de operações e conciliação bancária

-- ─── Audit Logs ──────────────────────────────────────────────
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID            REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(50)     NOT NULL,   -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, etc.
    entity      VARCHAR(100)    NOT NULL,   -- User, Transaction, Account, Budget, Goal, etc.
    entity_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    timestamp   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id   ON audit_logs (user_id)  WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_entity    ON audit_logs (entity);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs (entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX idx_audit_logs_action    ON audit_logs (action);

COMMENT ON TABLE audit_logs IS 'Registro imutável de todas as operações para conformidade e auditoria';

-- ─── Bank Statements ─────────────────────────────────────────
CREATE TYPE bank_statement_file_type AS ENUM ('OFX', 'CSV', 'QIF');

CREATE TYPE bank_statement_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);

CREATE TABLE bank_statements (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id              UUID                        NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    user_id                 UUID                        NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    file_name               VARCHAR(255)                NOT NULL,
    file_type               bank_statement_file_type    NOT NULL,
    file_url                VARCHAR(500)                NOT NULL,
    status                  bank_statement_status       NOT NULL DEFAULT 'PENDING',
    total_transactions      INTEGER                     NOT NULL DEFAULT 0,
    matched_transactions    INTEGER                     NOT NULL DEFAULT 0,
    period_start            DATE,
    period_end              DATE,
    error_message           TEXT,
    created_at              TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_statements_account_id ON bank_statements (account_id);
CREATE INDEX idx_bank_statements_user_id    ON bank_statements (user_id);
CREATE INDEX idx_bank_statements_status     ON bank_statements (status);

CREATE TRIGGER trg_bank_statements_updated_at
    BEFORE UPDATE ON bank_statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Bank Statement Items ─────────────────────────────────────
CREATE TYPE statement_item_type   AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE statement_item_status AS ENUM ('PENDING', 'MATCHED', 'UNMATCHED', 'IGNORED');

CREATE TABLE bank_statement_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    statement_id    UUID                    NOT NULL REFERENCES bank_statements(id)  ON DELETE CASCADE,
    transaction_id  UUID                    REFERENCES transactions(id)              ON DELETE SET NULL,
    amount          DECIMAL(15, 2)          NOT NULL,
    date            DATE                    NOT NULL,
    description     VARCHAR(500)            NOT NULL,
    type            statement_item_type     NOT NULL,
    status          statement_item_status   NOT NULL DEFAULT 'PENDING',
    raw_data        JSONB,
    created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_statement_items_statement_id   ON bank_statement_items (statement_id);
CREATE INDEX idx_statement_items_transaction_id ON bank_statement_items (transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX idx_statement_items_status         ON bank_statement_items (status);

COMMENT ON TABLE bank_statements      IS 'Extratos bancários importados via OFX/CSV para conciliação';
COMMENT ON TABLE bank_statement_items IS 'Itens individuais de um extrato com status de conciliação';
