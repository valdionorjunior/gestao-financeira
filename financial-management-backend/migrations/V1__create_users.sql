-- V1__create_users.sql
-- Tabela principal de usuários com RBAC e suporte a OAuth2

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('ADMIN', 'TITULAR', 'MEMBRO_FAMILIAR');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255)    NOT NULL,
    password_hash   VARCHAR(255),
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    cpf             VARCHAR(500),           -- criptografado AES-256
    phone           VARCHAR(30),
    avatar_url      VARCHAR(500),
    role            user_role       NOT NULL DEFAULT 'TITULAR',
    status          user_status     NOT NULL DEFAULT 'PENDING_VERIFICATION',
    google_id       VARCHAR(255),
    email_verified          BOOLEAN     NOT NULL DEFAULT FALSE,
    email_verified_at       TIMESTAMPTZ,
    password_reset_token    VARCHAR(500),
    password_reset_expires  TIMESTAMPTZ,
    last_login_at           TIMESTAMPTZ,
    lgpd_consent            BOOLEAN     NOT NULL DEFAULT FALSE,
    lgpd_consent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- Índices
CREATE UNIQUE INDEX uq_users_email
    ON users (email)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_users_google_id
    ON users (google_id)
    WHERE google_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_role   ON users (role);

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Refresh tokens — gerenciado aqui para manter coesão com users
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL,
    is_revoked  BOOLEAN     NOT NULL DEFAULT FALSE,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

COMMENT ON TABLE users IS 'Usuários do sistema com autenticação JWT e OAuth2';
COMMENT ON COLUMN users.cpf IS 'CPF criptografado com AES-256';
COMMENT ON TABLE refresh_tokens IS 'Tokens de refresh com suporte a rotation e revogação';
