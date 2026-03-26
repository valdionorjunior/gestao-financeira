-- V7__create_investments.sql
-- Carteira de investimentos com aportes e histórico de preços

CREATE TYPE investment_type AS ENUM (
    'STOCKS',
    'BONDS',
    'REAL_ESTATE',
    'CRYPTO',
    'SAVINGS',
    'PENSION',
    'OTHER'
);

CREATE TYPE investment_contribution_type AS ENUM (
    'BUY',
    'SELL',
    'DIVIDEND',
    'INTEREST',
    'BONUS'
);

CREATE TABLE investments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID            NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    family_id        UUID            REFERENCES families(id)          ON DELETE SET NULL,
    account_id       UUID            REFERENCES accounts(id)          ON DELETE SET NULL,
    name             VARCHAR(150)    NOT NULL,
    type             investment_type NOT NULL,
    institution      VARCHAR(150),
    ticker           VARCHAR(20),
    quantity         DECIMAL(15, 6)  NOT NULL DEFAULT 0,
    average_price    DECIMAL(15, 6)  NOT NULL DEFAULT 0,
    current_price    DECIMAL(15, 6)  NOT NULL DEFAULT 0,
    invested_amount  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
    current_value    DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
    profitability    DECIMAL(10, 4)  NOT NULL DEFAULT 0.0000,   -- percentual acumulado
    currency         VARCHAR(3)      NOT NULL DEFAULT 'BRL',
    start_date       DATE            NOT NULL DEFAULT CURRENT_DATE,
    end_date         DATE,
    is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investments_user_id   ON investments (user_id);
CREATE INDEX idx_investments_family_id ON investments (family_id) WHERE family_id IS NOT NULL;
CREATE INDEX idx_investments_type      ON investments (type);

CREATE TRIGGER trg_investments_updated_at
    BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Aportes/resgates de investimentos
CREATE TABLE investment_contributions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID                             NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    type          investment_contribution_type     NOT NULL,
    quantity      DECIMAL(15, 6)                   NOT NULL DEFAULT 0,
    price         DECIMAL(15, 6)                   NOT NULL DEFAULT 0,
    amount        DECIMAL(15, 2)                   NOT NULL CHECK (amount > 0),
    date          DATE                             NOT NULL DEFAULT CURRENT_DATE,
    notes         VARCHAR(255),
    created_at    TIMESTAMPTZ                      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investment_contributions_investment_id ON investment_contributions (investment_id);
CREATE INDEX idx_investment_contributions_date          ON investment_contributions (date DESC);

COMMENT ON TABLE investments              IS 'Carteira de investimentos do usuário';
COMMENT ON COLUMN investments.quantity    IS 'Quantidade de cotas/ações';
COMMENT ON COLUMN investments.profitability IS 'Rentabilidade acumulada em percentual';
COMMENT ON TABLE investment_contributions IS 'Histórico de compras, vendas, dividendos e juros';
