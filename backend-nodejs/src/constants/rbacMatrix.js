import { CanonicalRoles, Permissions } from './permissions.js';

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
      Permissions.MESSAGING_READ,
      Permissions.MESSAGING_RESPOND,
      Permissions.SCHEDULE_MANAGE
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
      Permissions.MESSAGING_ESCALATE
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
      Permissions.PANEL_STOREFRONT,
      Permissions.AFFILIATE_DASHBOARD,
      Permissions.AFFILIATE_REFERRALS,
      Permissions.FINANCE_PAYOUT_VIEW,
      Permissions.REPORTING_DOWNLOAD
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
      Permissions.USER_DIRECTORY
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
      Permissions.DISPUTE_MANAGE,
      Permissions.CAMPAIGN_MANAGE,
      Permissions.CAMPAIGN_REVIEW,
      Permissions.PROVIDER_ONBOARD,
      Permissions.MESSAGING_ESCALATE
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
      Permissions.ZONES_MATCH,
      Permissions.ZONES_PREVIEW,
      Permissions.COMPLIANCE_EXPORT,
      Permissions.COMPLIANCE_WAREHOUSE_VIEW,
      Permissions.COMPLIANCE_WAREHOUSE_EXPORT,
      Permissions.PAYMENTS_CAPTURE,
      Permissions.PAYMENTS_REFUND,
      Permissions.PAYMENTS_RELEASE,
      Permissions.ADMIN_PROVIDER_ARCHIVE,
      Permissions.INTEGRATION_CONSOLE,
      Permissions.SUPPORT_TICKETS
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
      Permissions.ADMIN_FEATURE_READ,
      Permissions.ADMIN_FEATURE_WRITE,
      Permissions.ADMIN_PLATFORM_READ,
      Permissions.ADMIN_PLATFORM_WRITE,
      Permissions.ADMIN_AFFILIATE_READ,
      Permissions.ADMIN_AFFILIATE_WRITE,
      Permissions.ADMIN_PROVIDER_READ,
      Permissions.ADMIN_PROVIDER_WRITE,
      Permissions.ADMIN_PROVIDER_ARCHIVE,
      Permissions.FINANCE_OVERVIEW,
      Permissions.REPORTING_DOWNLOAD,
      Permissions.SUPPORT_TICKETS
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
