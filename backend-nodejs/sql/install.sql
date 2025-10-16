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

-- ---------------------------------------------------------------------------
-- Provider crew deployment, availability, and delegation tables
-- These power the provider control centre crew management workspace.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "ProviderCrewMember" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'standby', 'leave', 'inactive')),
  employment_type TEXT NOT NULL DEFAULT 'employee' CHECK (employment_type IN ('employee', 'contractor', 'partner')),
  timezone TEXT,
  default_shift_start TIME,
  default_shift_end TIME,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProviderCrewAvailability" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES "ProviderCrewMember"(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','on_call','unavailable','standby')),
  location TEXT,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProviderCrewDeployment" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES "ProviderCrewMember"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignment_type TEXT NOT NULL DEFAULT 'booking' CHECK (assignment_type IN ('booking','project','standby','maintenance','training','support')),
  reference_id TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled','on_hold')),
  notes TEXT,
  created_by UUID,
  updated_by UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProviderCrewDelegation" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  crew_member_id UUID REFERENCES "ProviderCrewMember"(id) ON DELETE SET NULL,
  delegate_name TEXT NOT NULL,
  delegate_email TEXT,
  delegate_phone TEXT,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','scheduled','expired','revoked')),
  scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  updated_by UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS provider_crew_member_company_status_idx
  ON "ProviderCrewMember" (company_id, status, employment_type);
CREATE INDEX IF NOT EXISTS provider_crew_availability_day_idx
  ON "ProviderCrewAvailability" (company_id, crew_member_id, day_of_week);
CREATE INDEX IF NOT EXISTS provider_crew_deployment_schedule_idx
  ON "ProviderCrewDeployment" (company_id, crew_member_id, start_at);
CREATE INDEX IF NOT EXISTS provider_crew_delegation_status_idx
  ON "ProviderCrewDelegation" (company_id, status);
