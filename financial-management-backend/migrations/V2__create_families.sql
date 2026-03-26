-- V2__create_families.sql
-- Gestão familiar com papéis por membro

CREATE TYPE family_member_role   AS ENUM ('TITULAR', 'MEMBRO_FAMILIAR');
CREATE TYPE family_member_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

CREATE TABLE families (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150)    NOT NULL,
    owner_id    UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_families_owner_id ON families (owner_id);

CREATE TRIGGER trg_families_updated_at
    BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE family_members (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id   UUID                    NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id     UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        family_member_role      NOT NULL DEFAULT 'MEMBRO_FAMILIAR',
    status      family_member_status    NOT NULL DEFAULT 'PENDING',
    invited_at  TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    joined_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_family_member UNIQUE (family_id, user_id)
);

CREATE INDEX idx_family_members_family_id ON family_members (family_id);
CREATE INDEX idx_family_members_user_id   ON family_members (user_id);

CREATE TRIGGER trg_family_members_updated_at
    BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE families       IS 'Núcleos familiares para compartilhamento de dados financeiros';
COMMENT ON TABLE family_members IS 'Membros de uma família com papéis e status de convite';
