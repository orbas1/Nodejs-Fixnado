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
