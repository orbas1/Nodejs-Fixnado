\set ON_ERROR_STOP on
\prompt 'Application database name: ' app_db_name
\prompt 'Application role name: ' app_role
\prompt -s 'Application role password (min 16 chars): ' app_password
\echo ''

DO $$
BEGIN
  IF length(trim(:'app_db_name')) = 0 THEN
    RAISE EXCEPTION 'Database name is required';
  END IF;
  IF length(trim(:'app_role')) = 0 THEN
    RAISE EXCEPTION 'Application role name is required';
  END IF;
  IF length(:'app_password') < 16 THEN
    RAISE EXCEPTION 'Application password must be at least 16 characters';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_role') THEN
    EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L NOINHERIT', :'app_role', :'app_password');
  ELSE
    EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L NOINHERIT', :'app_role', :'app_password');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'app_db_name') THEN
    EXECUTE format('CREATE DATABASE %I OWNER %I', :'app_db_name', :'app_role');
  END IF;
END;
$$;

DO $$
BEGIN
  EXECUTE format('REVOKE ALL PRIVILEGES ON DATABASE %I FROM PUBLIC', :'app_db_name');
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO %I', :'app_db_name', :'app_role');
END;
$$;

\connect :app_db_name

SET statement_timeout = '5min';

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Content management tables
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  hero_image_url TEXT,
  hero_image_alt TEXT,
  reading_time_minutes INTEGER,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_post_categories (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES blog_categories(id) ON DELETE RESTRICT,
  PRIMARY KEY (post_id, category_id)
);

CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS blog_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'embed', 'document')),
  alt_text TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_categories_display_order ON blog_categories (display_order, name);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts (status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_media_post_id ON blog_media (post_id);

CREATE TABLE IF NOT EXISTS blog_post_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  recorded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_post_id ON blog_post_revisions (post_id, created_at DESC);

DO $$
BEGIN
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
    :'app_role'
  );
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I',
    :'app_role'
  );
END;
$$;

\echo 'Postgres bootstrap complete. Role privileges and extensions are configured.'

CREATE TABLE IF NOT EXISTS "InventoryCategory" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_category_company_name
  ON "InventoryCategory" (company_id, lower(name));

CREATE TABLE IF NOT EXISTS "InventoryTag" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  color TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_tag_company_name
  ON "InventoryTag" (company_id, lower(name));

CREATE TABLE IF NOT EXISTS "InventoryLocationZone" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_zone_company_name
  ON "InventoryLocationZone" (company_id, lower(name));

CREATE TABLE IF NOT EXISTS "InventoryItem" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  marketplace_item_id UUID REFERENCES "MarketplaceItem"(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT,
  unit_type TEXT NOT NULL DEFAULT 'unit',
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  safety_stock INTEGER NOT NULL DEFAULT 0,
  location_zone_id UUID REFERENCES "InventoryLocationZone"(id) ON DELETE SET NULL,
  category_id UUID REFERENCES "InventoryCategory"(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL DEFAULT 'tool' CHECK (item_type IN ('tool', 'material')),
  fulfilment_type TEXT NOT NULL DEFAULT 'purchase' CHECK (fulfilment_type IN ('purchase', 'rental', 'hybrid')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'retired')),
  tagline TEXT,
  description TEXT,
  rental_rate NUMERIC(12,2),
  rental_rate_currency CHAR(3),
  deposit_amount NUMERIC(12,2),
  deposit_currency CHAR(3),
  purchase_price NUMERIC(12,2),
  purchase_price_currency CHAR(3),
  replacement_cost NUMERIC(12,2),
  insurance_required BOOLEAN NOT NULL DEFAULT false,
  condition_rating TEXT NOT NULL DEFAULT 'good' CHECK (condition_rating IN ('new', 'excellent', 'good', 'fair', 'needs_service')),
  primary_supplier_id UUID REFERENCES "Supplier"(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_item_company_sku
  ON "InventoryItem" (company_id, lower(sku));

CREATE INDEX IF NOT EXISTS inventory_item_company_status
  ON "InventoryItem" (company_id, status);

CREATE INDEX IF NOT EXISTS inventory_item_company_category
  ON "InventoryItem" (company_id, category_id);

CREATE TABLE IF NOT EXISTS "InventoryItemTag" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_item_tag_unique UNIQUE (item_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_item_tag_item
  ON "InventoryItemTag" (item_id);

CREATE TABLE IF NOT EXISTS "InventoryItemMedia" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_item_media_item
  ON "InventoryItemMedia" (item_id, sort_order);

CREATE TABLE IF NOT EXISTS "InventoryItemSupplier" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'GBP',
  minimum_order_quantity INTEGER NOT NULL DEFAULT 1,
  lead_time_days INTEGER,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_quoted_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_item_supplier_unique UNIQUE (item_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_item_supplier_item
  ON "InventoryItemSupplier" (item_id);

CREATE TABLE IF NOT EXISTS "InventoryLedgerEntry" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('adjustment', 'reservation', 'reservation_release', 'checkout', 'return', 'write_off', 'restock')),
  quantity INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  source TEXT NOT NULL DEFAULT 'system' CHECK (source IN ('system', 'provider', 'automation')),
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_ledger_item_time
  ON "InventoryLedgerEntry" (item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_ledger_reference
  ON "InventoryLedgerEntry" (reference_id, reference_type);

CREATE TABLE IF NOT EXISTS "InventoryAlert" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('low_stock', 'overdue_return', 'damage_reported', 'manual')),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_alert_item_status
  ON "InventoryAlert" (item_id, status);

ALTER TABLE "InventoryItemTag"
  ADD CONSTRAINT inventory_item_tag_item_fk FOREIGN KEY (item_id) REFERENCES "InventoryItem"(id) ON DELETE CASCADE,
  ADD CONSTRAINT inventory_item_tag_tag_fk FOREIGN KEY (tag_id) REFERENCES "InventoryTag"(id) ON DELETE CASCADE;

ALTER TABLE "InventoryItemMedia"
  ADD CONSTRAINT inventory_item_media_item_fk FOREIGN KEY (item_id) REFERENCES "InventoryItem"(id) ON DELETE CASCADE;

ALTER TABLE "InventoryItemSupplier"
  ADD CONSTRAINT inventory_item_supplier_item_fk FOREIGN KEY (item_id) REFERENCES "InventoryItem"(id) ON DELETE CASCADE,
  ADD CONSTRAINT inventory_item_supplier_supplier_fk FOREIGN KEY (supplier_id) REFERENCES "Supplier"(id) ON DELETE CASCADE;

ALTER TABLE "InventoryLedgerEntry"
  ADD CONSTRAINT inventory_ledger_item_fk FOREIGN KEY (item_id) REFERENCES "InventoryItem"(id) ON DELETE CASCADE;

ALTER TABLE "InventoryAlert"
  ADD CONSTRAINT inventory_alert_item_fk FOREIGN KEY (item_id) REFERENCES "InventoryItem"(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- Command metrics configuration tables
-- These tables back the admin control centre's configurable operating window
-- highlights, metric thresholds, and custom dashboard cards. They are created
-- here so production environments provisioned with this script have the
-- required persistence layer without relying on ORM sync calls.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS command_metric_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope VARCHAR(64) UNIQUE NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS command_metric_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(160) NOT NULL,
  tone VARCHAR(24) NOT NULL DEFAULT 'info',
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  media_url TEXT,
  media_alt VARCHAR(160),
  cta JSONB,
  created_by VARCHAR(120),
  updated_by VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_command_metric_cards_active_order
  ON command_metric_cards (is_active, display_order, created_at);
