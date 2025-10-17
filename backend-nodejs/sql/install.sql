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
-- ---------------------------------------------------------------------------
-- Provider onboarding control centre tables
-- These tables power the SME onboarding workspace within the provider
-- control centre. They capture tasks, regulatory requirements, and timeline
-- notes so the experience delivers full CRUD coverage when launched in
-- production environments.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "ProviderOnboardingTask" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'blocked', 'completed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  stage TEXT NOT NULL CHECK (stage IN ('intake', 'documents', 'compliance', 'go-live', 'live')),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
-- Serviceman financial management tables
-- These tables back the Serviceman control centre financial workspace so that
-- crew leads can manage earnings, expenses, allowances, and payout settings in
-- production environments.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS serviceman_financial_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serviceman_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  currency VARCHAR(8) NOT NULL DEFAULT 'GBP',
  base_hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
  overtime_rate NUMERIC(12, 2),
  callout_fee NUMERIC(12, 2),
  mileage_rate NUMERIC(8, 2),
  payout_method VARCHAR(32) NOT NULL DEFAULT 'wallet',
  payout_schedule VARCHAR(32) NOT NULL DEFAULT 'weekly',
  tax_rate NUMERIC(5, 2),
  tax_identifier VARCHAR(64),
  payout_instructions TEXT,
  bank_account JSONB NOT NULL DEFAULT '{}'::jsonb,
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
CREATE INDEX IF NOT EXISTS idx_serviceman_financial_profiles_serviceman
  ON serviceman_financial_profiles (serviceman_id);

CREATE TABLE IF NOT EXISTS serviceman_financial_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serviceman_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  reference VARCHAR(64),
  title VARCHAR(160) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'GBP',
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'in_progress', 'payable', 'paid', 'withheld')
  ),
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_provider_onboarding_task_company
  ON "ProviderOnboardingTask" (company_id, status, stage);

CREATE TABLE IF NOT EXISTS "ProviderOnboardingRequirement" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('document', 'insurance', 'payment', 'training', 'integration', 'other')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'waived')),
  stage TEXT NOT NULL CHECK (stage IN ('intake', 'documents', 'compliance', 'go-live', 'live')),
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  document_id UUID REFERENCES "ComplianceDocument"(id) ON DELETE SET NULL,
  external_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
CREATE INDEX IF NOT EXISTS idx_serviceman_financial_earnings_serviceman
  ON serviceman_financial_earnings (serviceman_id, status, due_at);

CREATE TABLE IF NOT EXISTS serviceman_expense_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serviceman_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(32) NOT NULL DEFAULT 'other' CHECK (
    category IN ('travel', 'equipment', 'meal', 'accommodation', 'training', 'other')
  ),
  title VARCHAR(160) NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'GBP',
  status VARCHAR(24) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'submitted', 'approved', 'reimbursed', 'rejected')
  ),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  receipts JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
-- Provider calendar configuration
-- These tables back the provider control centre booking calendar, storing
-- per-company defaults and custom events that complement live bookings.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS provider_calendar_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Europe/London',
  week_starts_on VARCHAR(16) NOT NULL DEFAULT 'monday' CHECK (week_starts_on IN ('monday', 'sunday')),
  default_view VARCHAR(16) NOT NULL DEFAULT 'month' CHECK (default_view IN ('month', 'week', 'day')),
  workday_start VARCHAR(8) NOT NULL DEFAULT '08:00',
  workday_end VARCHAR(8) NOT NULL DEFAULT '18:00',
  allow_overlapping BOOLEAN NOT NULL DEFAULT TRUE,
  auto_accept_assignments BOOLEAN NOT NULL DEFAULT FALSE,
  notification_recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT provider_calendar_settings_unique_company UNIQUE (company_id)
);

CREATE TABLE IF NOT EXISTS provider_calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  status VARCHAR(24) NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'confirmed', 'cancelled', 'tentative', 'standby', 'travel')),
  event_type VARCHAR(24) NOT NULL DEFAULT 'internal'
    CHECK (event_type IN ('internal', 'hold', 'travel', 'maintenance', 'booking')),
  visibility VARCHAR(24) NOT NULL DEFAULT 'internal'
    CHECK (visibility IN ('internal', 'crew', 'public')),
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_rental_coupons_company_code ON tool_rental_coupons (company_id, code);
CREATE INDEX IF NOT EXISTS idx_tool_rental_coupons_company_status ON tool_rental_coupons (company_id, status);
CREATE INDEX IF NOT EXISTS idx_provider_onboarding_requirement_company
  ON "ProviderOnboardingRequirement" (company_id, status, type);

CREATE TABLE IF NOT EXISTS "ProviderOnboardingNote" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('update', 'risk', 'decision', 'note')),
  stage TEXT NOT NULL CHECK (stage IN ('intake', 'documents', 'compliance', 'go-live', 'live')),
  visibility TEXT NOT NULL CHECK (visibility IN ('internal', 'shared')),
  summary VARCHAR(180) NOT NULL,
  body TEXT,
  follow_up_at TIMESTAMPTZ,
CREATE INDEX IF NOT EXISTS idx_serviceman_expense_claims_serviceman
  ON serviceman_expense_claims (serviceman_id, status, submitted_at);

CREATE TABLE IF NOT EXISTS serviceman_allowances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serviceman_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'GBP',
  cadence VARCHAR(32) NOT NULL DEFAULT 'per_job' CHECK (
    cadence IN ('per_job', 'per_day', 'per_week', 'per_month')
  ),
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_provider_onboarding_note_company
  ON "ProviderOnboardingNote" (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_serviceman_allowances_active
  ON serviceman_allowances (serviceman_id, is_active, effective_from);
CREATE INDEX IF NOT EXISTS idx_provider_calendar_events_company_time
  ON provider_calendar_events (company_id, start_at);

CREATE INDEX IF NOT EXISTS idx_provider_calendar_events_booking
  ON provider_calendar_events (booking_id);
