export const Permissions = Object.freeze({
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_FEATURE_READ: 'admin:feature-toggle:read',
  ADMIN_FEATURE_WRITE: 'admin:feature-toggle:write',
  ADMIN_PLATFORM_READ: 'admin:platform-settings:read',
  ADMIN_PLATFORM_WRITE: 'admin:platform-settings:write',
  ADMIN_AFFILIATE_READ: 'admin:affiliate:read',
  ADMIN_AFFILIATE_WRITE: 'admin:affiliate:write',
  AFFILIATE_DASHBOARD: 'affiliate:dashboard:view',
  AFFILIATE_REFERRALS: 'affiliate:referrals:view',
  ANALYTICS_OVERVIEW: 'analytics:overview:view',
  ANALYTICS_EXPORT: 'analytics:export:run',
  CAMPAIGN_MANAGE: 'campaign:manage',
  CAMPAIGN_REVIEW: 'campaign:review',
  COMPLIANCE_PORTAL: 'compliance:portal:access',
  COMPLIANCE_EXPORT: 'compliance:export:execute',
  COMPLIANCE_WAREHOUSE_VIEW: 'compliance:data-warehouse:view',
  COMPLIANCE_WAREHOUSE_EXPORT: 'compliance:data-warehouse:export',
  DISPUTE_MANAGE: 'finance:dispute:manage',
  DISPUTE_VIEW: 'finance:dispute:view',
  FEED_VIEW: 'feed:live:view',
  FEED_POST: 'feed:live:post',
  FEED_BID: 'feed:live:bid',
  FEED_MESSAGE: 'feed:live:message',
  FINANCE_OVERVIEW: 'finance:overview:view',
  FINANCE_PAYOUT_MANAGE: 'finance:payout:manage',
  FINANCE_PAYOUT_VIEW: 'finance:payout:view',
  FINANCE_WALLET_VIEW: 'finance:wallet:view',
  FINANCE_WALLET_MANAGE: 'finance:wallet:manage',
  INTEGRATION_CONSOLE: 'integration:console:manage',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  MATERIALS_VIEW: 'materials:showcase:view',
  MESSAGING_READ: 'messaging:threads:read',
  MESSAGING_RESPOND: 'messaging:threads:respond',
  MESSAGING_ESCALATE: 'messaging:threads:escalate',
  PANEL_PROVIDER: 'panel:provider:view',
  PANEL_ENTERPRISE: 'panel:enterprise:view',
  PANEL_STOREFRONT: 'panel:storefront:view',
  PAYMENTS_CAPTURE: 'payments:capture',
  PAYMENTS_REFUND: 'payments:refund',
  PAYMENTS_RELEASE: 'payments:release',
  PROVIDER_ONBOARD: 'provider:onboard:manage',
  REPORTING_DOWNLOAD: 'reporting:download',
  SCHEDULE_MANAGE: 'schedule:manage',
  SERVICES_MANAGE: 'services:manage',
  SERVICES_BOOK: 'services:book',
  SUPPORT_TICKETS: 'support:tickets:manage',
  USER_DIRECTORY: 'user:directory:view',
  ZONES_MATCH: 'zones:match',
  ZONES_PREVIEW: 'zones:preview'
});

export const CanonicalRoles = Object.freeze({
  GUEST: 'guest',
  USER: 'user',
  SERVICEMAN: 'serviceman',
  PROVIDER: 'provider',
  ENTERPRISE: 'enterprise',
  PROVIDER_ADMIN: 'provider_admin',
  OPERATIONS: 'operations',
  ADMIN: 'admin'
});

const ALIAS_ENTRIES = [
  ['guest', CanonicalRoles.GUEST],
  ['anonymous', CanonicalRoles.GUEST],
  ['user', CanonicalRoles.USER],
  ['customer', CanonicalRoles.USER],
  ['servicemen', CanonicalRoles.SERVICEMAN],
  ['serviceman', CanonicalRoles.SERVICEMAN],
  ['technician', CanonicalRoles.SERVICEMAN],
  ['crew', CanonicalRoles.SERVICEMAN],
  ['company', CanonicalRoles.PROVIDER],
  ['provider', CanonicalRoles.PROVIDER],
  ['sme', CanonicalRoles.PROVIDER],
  ['enterprise', CanonicalRoles.ENTERPRISE],
  ['corporate', CanonicalRoles.ENTERPRISE],
  ['provider_admin', CanonicalRoles.PROVIDER_ADMIN],
  ['provider-admin', CanonicalRoles.PROVIDER_ADMIN],
  ['operations_admin', CanonicalRoles.OPERATIONS],
  ['operations', CanonicalRoles.OPERATIONS],
  ['ops', CanonicalRoles.OPERATIONS],
  ['admin', CanonicalRoles.ADMIN],
  ['superadmin', CanonicalRoles.ADMIN],
  ['root', CanonicalRoles.ADMIN]
];

export const ROLE_ALIASES = new Map(ALIAS_ENTRIES);

export function normaliseRole(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
}

export function toCanonicalRole(value) {
  const normalised = normaliseRole(value);
  if (ROLE_ALIASES.has(normalised)) {
    return ROLE_ALIASES.get(normalised);
  }
  if (Object.values(CanonicalRoles).includes(normalised)) {
    return normalised;
  }
  return null;
}

export default {
  Permissions,
  CanonicalRoles,
  ROLE_ALIASES,
  normaliseRole,
  toCanonicalRole
};
