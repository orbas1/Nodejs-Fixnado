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
