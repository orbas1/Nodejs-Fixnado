import * as permissionConstants from './permissions.js';

const { CanonicalRoles, Permissions } = permissionConstants;

export const RBAC_MATRIX = {
  [CanonicalRoles.GUEST]: {
    label: 'Visitor',
    description:
      'Unauthenticated visitor exploring marketing surfaces. Can browse public marketing pages and request service quotes but cannot access live data or dashboards.',
    inherits: [],
    permissions: [],
    navigation: {
      landing: '/',
      allowedMenus: ['marketing.home', 'marketing.explore', 'marketing.pricing', 'marketing.contact'],
      deniedMenus: ['dashboard', 'storefront', 'messaging']
    },
    dataVisibility: {
      finance: 'none',
      messaging: 'none',
      inventory: 'none',
      analytics: 'none'
    }
  },
  [CanonicalRoles.USER]: {
    label: 'Customer',
    description:
      'Registered customer booking services, managing requests, and tracking crew updates.',
    inherits: [CanonicalRoles.GUEST],
    permissions: [
      Permissions.FEED_VIEW,
      Permissions.FEED_MESSAGE,
      Permissions.FEED_POST,
      Permissions.SERVICES_BOOK,
      Permissions.SERVICE_ORDERS_VIEW,
      Permissions.SERVICE_ORDERS_MANAGE,
      Permissions.MESSAGING_READ,
      Permissions.MESSAGING_RESPOND,
      Permissions.SCHEDULE_MANAGE,
      Permissions.WALLET_VIEW,
      Permissions.WALLET_MANAGE,
      Permissions.WALLET_TRANSACT,
      Permissions.WALLET_METHOD_MANAGE,
      Permissions.CUSTOMER_CONTROL_MANAGE,
      Permissions.ACCOUNT_SETTINGS_MANAGE,
    ],
    navigation: {
      landing: '/app/dashboard',
      allowedMenus: ['dashboard.overview', 'dashboard.feed', 'dashboard.bookings', 'support'],
      deniedMenus: ['dashboard.inventory', 'dashboard.finance']
    },
    dataVisibility: {
      finance: 'self',
      messaging: 'self',
      inventory: 'none',
      analytics: 'self_summary'
    }
  },
  [CanonicalRoles.SERVICEMAN]: {
    label: 'Crew Member',
    description:
      'Internal or partner serviceman fulfilling jobs, updating schedules, and collaborating on live assignments.',
    inherits: [CanonicalRoles.USER],
    permissions: [
      Permissions.FEED_BID,
      Permissions.MATERIALS_VIEW,
      Permissions.INVENTORY_READ,
      Permissions.SERVICES_MANAGE,
      Permissions.MESSAGING_ESCALATE,
      Permissions.SERVICEMAN_CUSTOM_JOBS_READ,
      Permissions.SERVICEMAN_CUSTOM_JOBS_WRITE,
      Permissions.SERVICEMAN_CUSTOM_JOBS_REPORTS,
      Permissions.SERVICEMAN_IDENTITY_MANAGE,
      Permissions.SERVICEMAN_METRICS_READ,
      Permissions.SERVICEMAN_METRICS_WRITE,
      Permissions.SERVICEMAN_WEBSITE_READ,
      Permissions.SERVICEMAN_WEBSITE_WRITE,
      Permissions.SERVICEMAN_PROFILE_MANAGE,
      Permissions.SERVICEMAN_BOOKINGS_VIEW,
      Permissions.SERVICEMAN_BOOKINGS_MANAGE,
      Permissions.MESSAGING_ESCALATE,
      Permissions.SERVICEMAN_ESCROW_VIEW,
      Permissions.SERVICEMAN_ESCROW_MANAGE,
      Permissions.SERVICEMAN_CONTROL_MANAGE,
    ],
    navigation: {
      landing: '/app/workqueue',
      allowedMenus: ['dashboard.overview', 'dashboard.feed', 'dashboard.schedule', 'dashboard.inventory'],
      deniedMenus: ['dashboard.finance.reports']
    },
    dataVisibility: {
      finance: 'assignment_only',
      messaging: 'team',
      inventory: 'read',
      analytics: 'crew_metrics'
    }
  },
  [CanonicalRoles.PROVIDER]: {
    label: 'Provider Manager',
    description:
      'Organisation owner or manager overseeing storefronts, crews, and live bookings.',
    inherits: [CanonicalRoles.SERVICEMAN],
    permissions: [
      Permissions.INVENTORY_WRITE,
      Permissions.PANEL_PROVIDER,
      Permissions.PANEL_PROVIDER_MANAGE,
      Permissions.PANEL_PROVIDER_UPGRADE,
      Permissions.PANEL_PROVIDER_TOOLS,
      Permissions.PANEL_ENTERPRISE,
      Permissions.PANEL_STOREFRONT,
      Permissions.PROVIDER_CREW_MANAGE,
      Permissions.AFFILIATE_DASHBOARD,
      Permissions.AFFILIATE_REFERRALS,
      Permissions.PROVIDER_ESCROW_READ,
      Permissions.FINANCE_PAYOUT_VIEW,
      Permissions.FINANCE_WALLET_VIEW,
      Permissions.REPORTING_DOWNLOAD,
      Permissions.PROVIDER_CREW_VIEW,
      Permissions.PROVIDER_CREW_SCHEDULE,
      Permissions.PROVIDER_CALENDAR_VIEW,
      Permissions.PROVIDER_CALENDAR_MANAGE,
    ],
    navigation: {
      landing: '/app/provider/dashboard',
      allowedMenus: [
        'dashboard.overview',
        'dashboard.feed',
        'dashboard.inventory',
        'dashboard.storefront',
        'dashboard.reports'
      ],
      deniedMenus: ['admin.platform', 'admin.integrations']
    },
    dataVisibility: {
      finance: 'organisation_summary',
      messaging: 'organisation',
      inventory: 'write',
      analytics: 'organisation'
    }
  },
  [CanonicalRoles.ENTERPRISE]: {
    label: 'Enterprise Client',
    description:
      'Enterprise operations lead managing multi-region projects, compliance, and supplier coordination.',
    inherits: [CanonicalRoles.PROVIDER],
    permissions: [
      Permissions.PANEL_ENTERPRISE,
      Permissions.ANALYTICS_OVERVIEW,
      Permissions.ANALYTICS_EXPORT,
      Permissions.COMPLIANCE_PORTAL,
      Permissions.COMPLIANCE_WAREHOUSE_VIEW,
      Permissions.DISPUTE_VIEW,
      Permissions.FINANCE_OVERVIEW,
      Permissions.USER_DIRECTORY,
    ],
    navigation: {
      landing: '/app/enterprise/overview',
      allowedMenus: [
        'dashboard.overview',
        'dashboard.analytics',
        'dashboard.compliance',
        'dashboard.finance',
        'dashboard.storefront'
      ],
      deniedMenus: ['admin.platform']
    },
    dataVisibility: {
      finance: 'multi_region_summary',
      messaging: 'organisation',
      inventory: 'write',
      analytics: 'enterprise'
    }
  },
  [CanonicalRoles.PROVIDER_ADMIN]: {
    label: 'Provider Administrator',
    description:
      'Specialist administrator managing provider workforce, finance, and integrations.',
    inherits: [CanonicalRoles.PROVIDER],
    permissions: [
      Permissions.FINANCE_PAYOUT_MANAGE,
      Permissions.FINANCE_WALLET_VIEW,
      Permissions.DISPUTE_MANAGE,
      Permissions.PROVIDER_ESCROW_READ,
      Permissions.PROVIDER_ESCROW_WRITE,
      Permissions.CAMPAIGN_MANAGE,
      Permissions.CAMPAIGN_REVIEW,
      Permissions.PROVIDER_ONBOARD,
      Permissions.MESSAGING_ESCALATE,
      Permissions.PROVIDER_CREW_MANAGE,
      Permissions.PROVIDER_CREW_SCHEDULE,
    ],
    navigation: {
      landing: '/app/provider/admin',
      allowedMenus: [
        'dashboard.overview',
        'dashboard.finance',
        'dashboard.campaigns',
        'dashboard.integrations',
        'dashboard.team'
      ],
      deniedMenus: ['admin.platform']
    },
    dataVisibility: {
      finance: 'organisation_full',
      messaging: 'organisation',
      inventory: 'write',
      analytics: 'organisation'
    }
  },
  [CanonicalRoles.OPERATIONS]: {
    label: 'Operations Control',
    description:
      'Central operations staff handling escalations, provider approvals, and compliance audits.',
    inherits: [CanonicalRoles.PROVIDER_ADMIN],
    permissions: [
      Permissions.ZONES_READ,
      Permissions.ZONES_MANAGE,
      Permissions.ZONES_COVERAGE,
      Permissions.ZONES_MATCH,
      Permissions.ZONES_PREVIEW,
      Permissions.COMPLIANCE_EXPORT,
      Permissions.COMPLIANCE_WAREHOUSE_VIEW,
      Permissions.COMPLIANCE_WAREHOUSE_EXPORT,
      Permissions.PAYMENTS_CAPTURE,
      Permissions.PAYMENTS_REFUND,
      Permissions.PAYMENTS_RELEASE,
      Permissions.ADMIN_ESCROW_READ,
      Permissions.FINANCE_WALLET_VIEW,
      Permissions.FINANCE_WALLET_MANAGE,
      Permissions.ADMIN_PROVIDER_ARCHIVE,
      Permissions.ADMIN_OPERATIONS_QUEUE_READ,
      Permissions.ADMIN_OPERATIONS_QUEUE_WRITE,
      Permissions.ADMIN_RENTAL_READ,
      Permissions.ADMIN_RENTAL_WRITE,
      Permissions.ADMIN_SERVICES_READ,
      Permissions.INTEGRATION_CONSOLE,
      Permissions.SUPPORT_TICKETS,
      Permissions.ADMIN_RBAC_READ,
      Permissions.ADMIN_COMMAND_METRICS_READ,
      Permissions.ADMIN_AUTOMATION_READ,
      Permissions.ADMIN_PURCHASE_READ,
      Permissions.ADMIN_PURCHASE_WRITE,
      Permissions.ADMIN_WEBSITE_READ,
      Permissions.ADMIN_AUDIT_READ,
      Permissions.ADMIN_SECURITY_POSTURE_READ,
    ],
    navigation: {
      landing: '/app/operations/overview',
      allowedMenus: [
        'dashboard.overview',
        'dashboard.compliance',
        'dashboard.operations',
        'dashboard.finance',
        'dashboard.integrations'
      ],
      deniedMenus: []
    },
    dataVisibility: {
      finance: 'all_regions',
      messaging: 'enterprise',
      inventory: 'write',
      analytics: 'global'
    }
  },
  [CanonicalRoles.ADMIN]: {
    label: 'Platform Administrator',
    description:
      'Platform owner with full control over security, feature toggles, integrations, and audit trails.',
    inherits: [CanonicalRoles.OPERATIONS],
    permissions: [
      Permissions.ADMIN_DASHBOARD,
      Permissions.ADMIN_DASHBOARD_WRITE,
      Permissions.ADMIN_FEATURE_READ,
      Permissions.ADMIN_FEATURE_WRITE,
      Permissions.ADMIN_PLATFORM_READ,
      Permissions.ADMIN_PLATFORM_WRITE,
      Permissions.ADMIN_CUSTOM_JOBS_READ,
      Permissions.ADMIN_CUSTOM_JOBS_WRITE,
      Permissions.ADMIN_PROFILE_READ,
      Permissions.ADMIN_PROFILE_WRITE,
      Permissions.ADMIN_SETTINGS_READ,
      Permissions.ADMIN_SETTINGS_WRITE,
      Permissions.ADMIN_AUTOMATION_READ,
      Permissions.ADMIN_AUTOMATION_WRITE,
      Permissions.ADMIN_APPEARANCE_READ,
      Permissions.ADMIN_APPEARANCE_WRITE,
      Permissions.ADMIN_LIVE_FEED_AUDIT_READ,
      Permissions.ADMIN_LIVE_FEED_AUDIT_WRITE,
      Permissions.ADMIN_AFFILIATE_READ,
      Permissions.ADMIN_AFFILIATE_WRITE,
      Permissions.ADMIN_ESCROW_READ,
      Permissions.ADMIN_ESCROW_WRITE,
      Permissions.ADMIN_BOOKINGS_READ,
      Permissions.ADMIN_BOOKINGS_WRITE,
      Permissions.ADMIN_PROVIDER_READ,
      Permissions.ADMIN_PROVIDER_WRITE,
      Permissions.ADMIN_PROVIDER_ARCHIVE,
      Permissions.ADMIN_RBAC_READ,
      Permissions.ADMIN_RBAC_WRITE,
      Permissions.ADMIN_COMMAND_METRICS_READ,
      Permissions.ADMIN_COMMAND_METRICS_WRITE,
      Permissions.ADMIN_USER_READ,
      Permissions.ADMIN_USER_WRITE,
      Permissions.ADMIN_USER_INVITE,
      Permissions.ADMIN_ENTERPRISE_READ,
      Permissions.ADMIN_ENTERPRISE_WRITE,
      Permissions.ADMIN_INBOX_READ,
      Permissions.ADMIN_INBOX_WRITE,
      Permissions.ADMIN_RENTAL_READ,
      Permissions.ADMIN_RENTAL_WRITE,
      Permissions.ADMIN_SERVICES_READ,
      Permissions.ADMIN_SERVICES_WRITE,
      Permissions.ADMIN_HOME_BUILDER,
      Permissions.ADMIN_LEGAL_READ,
      Permissions.ADMIN_LEGAL_WRITE,
      Permissions.ADMIN_WEBSITE_READ,
      Permissions.ADMIN_WEBSITE_WRITE,
      Permissions.ADMIN_AUDIT_READ,
      Permissions.ADMIN_AUDIT_WRITE,
      Permissions.ADMIN_COMPLIANCE_READ,
      Permissions.ADMIN_COMPLIANCE_WRITE,
      Permissions.ADMIN_TAXONOMY_READ,
      Permissions.ADMIN_TAXONOMY_WRITE,
      Permissions.ADMIN_SECURITY_POSTURE_READ,
      Permissions.ADMIN_SECURITY_POSTURE_WRITE,
      Permissions.FINANCE_OVERVIEW,
      Permissions.FINANCE_WALLET_MANAGE,
      Permissions.REPORTING_DOWNLOAD,
      Permissions.SUPPORT_TICKETS,
      Permissions.ADMIN_PURCHASE_READ,
      Permissions.ADMIN_PURCHASE_WRITE,
      Permissions.ADMIN_PURCHASE_BUDGET,
    ],
    navigation: {
      landing: '/app/admin/dashboard',
      allowedMenus: [
        'admin.dashboard',
        'admin.platform',
        'admin.security',
        'admin.integrations',
        'dashboard.analytics'
      ],
      deniedMenus: []
    },
    dataVisibility: {
      finance: 'full',
      messaging: 'global',
      inventory: 'write',
      analytics: 'global'
    }
  }
};

export const PUBLIC_PERMISSIONS = new Set([Permissions.SERVICES_BOOK]);

export function getRoleDefinition(role) {
  return RBAC_MATRIX[role] ?? null;
}

export function enumerateRoles() {
  return Object.keys(RBAC_MATRIX);
}

export default {
  RBAC_MATRIX,
  PUBLIC_PERMISSIONS,
  getRoleDefinition,
  enumerateRoles
};
