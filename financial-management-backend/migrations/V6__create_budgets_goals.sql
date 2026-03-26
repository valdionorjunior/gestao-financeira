-- V6__create_budgets_goals.sql
-- Orçamentos por período/categoria e metas financeiras com contribuições

CREATE TYPE budget_period AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

CREATE TABLE budgets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID            NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    family_id           UUID            REFERENCES families(id)             ON DELETE SET NULL,
    category_id         UUID            REFERENCES categories(id)           ON DELETE SET NULL,
    name                VARCHAR(150)    NOT NULL,
    amount              DECIMAL(15, 2)  NOT NULL CHECK (amount > 0),
    period              budget_period   NOT NULL DEFAULT 'MONTHLY',
    start_date          DATE            NOT NULL,
    end_date            DATE            NOT NULL,
    alert_threshold     DECIMAL(5, 2)   NOT NULL DEFAULT 80.00
                            CHECK (alert_threshold BETWEEN 0 AND 100),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_budget_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_budgets_user_id     ON budgets (user_id);
CREATE INDEX idx_budgets_category_id ON budgets (category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_budgets_period      ON budgets (start_date, end_date);

CREATE TRIGGER trg_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────

CREATE TYPE goal_status AS ENUM ('ACTIVE', 'ACHIEVED', 'CANCELED', 'PAUSED');

CREATE TABLE goals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    family_id       UUID            REFERENCES families(id)          ON DELETE SET NULL,
    account_id      UUID            REFERENCES accounts(id)          ON DELETE SET NULL,
    name            VARCHAR(150)    NOT NULL,
    description     TEXT,
    target_amount   DECIMAL(15, 2)  NOT NULL CHECK (target_amount > 0),
    current_amount  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
    target_date     DATE            NOT NULL,
    icon            VARCHAR(50),
    color           VARCHAR(7)      DEFAULT '#82d616',
    status          goal_status     NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals (user_id);
CREATE INDEX idx_goals_status  ON goals (status);

CREATE TRIGGER trg_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Contribuições para metas
CREATE TABLE goal_contributions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id         UUID            NOT NULL REFERENCES goals(id)        ON DELETE CASCADE,
    transaction_id  UUID            REFERENCES transactions(id)          ON DELETE SET NULL,
    amount          DECIMAL(15, 2)  NOT NULL CHECK (amount > 0),
    date            DATE            NOT NULL DEFAULT CURRENT_DATE,
    notes           VARCHAR(255),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goal_contributions_goal_id ON goal_contributions (goal_id);

COMMENT ON TABLE budgets           IS 'Orçamentos por período e categoria com alertas de limiar';
COMMENT ON COLUMN budgets.alert_threshold IS 'Percentual (0-100) do limite para disparar alerta';
COMMENT ON TABLE goals             IS 'Metas financeiras com tracking de progresso';
COMMENT ON TABLE goal_contributions IS 'Aportes realizados para uma meta financeira';
