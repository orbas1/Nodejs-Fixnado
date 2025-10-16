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

-- Tool rental management tables
CREATE TABLE IF NOT EXISTS tool_rental_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  inventory_item_id UUID,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  rental_rate NUMERIC(12, 2),
  rental_rate_currency CHAR(3),
  deposit_amount NUMERIC(12, 2),
  deposit_currency CHAR(3),
  min_hire_days INTEGER NOT NULL DEFAULT 1,
  max_hire_days INTEGER,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  availability_status TEXT NOT NULL DEFAULT 'available',
  seo_title TEXT,
  seo_description TEXT,
  keyword_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  hero_image_url TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  showcase_video_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_rental_assets_company_slug ON tool_rental_assets (company_id, slug);
CREATE INDEX IF NOT EXISTS idx_tool_rental_assets_company_status ON tool_rental_assets (company_id, availability_status);

CREATE TABLE IF NOT EXISTS tool_rental_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES tool_rental_assets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(12, 2) NOT NULL,
  currency CHAR(3) NOT NULL,
  deposit_amount NUMERIC(12, 2),
  deposit_currency CHAR(3),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_rental_pricing_asset ON tool_rental_pricing_tiers (asset_id, duration_days);

CREATE TABLE IF NOT EXISTS tool_rental_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  asset_id UUID REFERENCES tool_rental_assets(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  currency CHAR(3),
  max_redemptions INTEGER,
  per_customer_limit INTEGER,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'expired', 'disabled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_rental_coupons_company_code ON tool_rental_coupons (company_id, code);
CREATE INDEX IF NOT EXISTS idx_tool_rental_coupons_company_status ON tool_rental_coupons (company_id, status);
