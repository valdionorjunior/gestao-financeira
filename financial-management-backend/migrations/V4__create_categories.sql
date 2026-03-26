-- V4__create_categories.sql
-- Categorias e subcategorias financeiras (sistema + personalizadas)

CREATE TYPE category_type AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID            REFERENCES users(id)    ON DELETE CASCADE,
    family_id   UUID            REFERENCES families(id) ON DELETE SET NULL,
    name        VARCHAR(100)    NOT NULL,
    type        category_type   NOT NULL,
    icon        VARCHAR(50),
    color       VARCHAR(7)      DEFAULT '#8392ab',
    is_system   BOOLEAN         NOT NULL DEFAULT FALSE,  -- categorias padrão do sistema
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id   ON categories (user_id)   WHERE user_id IS NOT NULL;
CREATE INDEX idx_categories_family_id ON categories (family_id) WHERE family_id IS NOT NULL;
CREATE INDEX idx_categories_type      ON categories (type);
CREATE INDEX idx_categories_is_system ON categories (is_system);

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE subcategories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(50),
    color       VARCHAR(7),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_subcategory_name_per_category UNIQUE (category_id, name)
);

CREATE INDEX idx_subcategories_category_id ON subcategories (category_id);

CREATE TRIGGER trg_subcategories_updated_at
    BEFORE UPDATE ON subcategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE categories    IS 'Categorias financeiras — sistema e personalizadas por usuário/família';
COMMENT ON TABLE subcategories IS 'Subcategorias vinculadas a uma categoria pai';
COMMENT ON COLUMN categories.is_system IS 'TRUE para categorias padrão criadas pelo sistema via seed';
