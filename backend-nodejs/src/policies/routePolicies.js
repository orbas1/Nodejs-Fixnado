import { Permissions } from '../services/accessControlService.js';

const ROUTE_POLICIES = {
  'customer.control.manage': {
    id: 'customer.control.manage',
    version: '1.0.0',
    resource: 'customer.control',
    action: 'customer.control:manage',
    description:
      'Allow customer personas to view and update their control centre profile, escalation contacts, and service locations.',
    requirements: [Permissions.CUSTOMER_CONTROL_MANAGE],
    tags: ['customer', 'workspace', 'profile'],
    severity: 'medium',
    metadata: (req) => ({
      persona: req.headers['x-fixnado-persona'] || null,
      surface: req.route?.path || null
  'account.settings.manage': {
    id: 'account.settings.manage',
    version: '1.0.0',
    resource: 'account.settings',
    action: 'account.settings:manage',
    description: 'Allow authenticated users to manage their Fixnado account workspace preferences.',
    requirements: [Permissions.ACCOUNT_SETTINGS_MANAGE],
    tags: ['account', 'preferences'],
    severity: 'medium',
    metadata: (req) => ({
      userId: req.user?.id ?? null,
      persona: req.headers['x-fixnado-persona'] || null
    })
  },
  'feed.live.read': {
    id: 'feed.live.read',
    version: '1.0.0',
    resource: 'feed.live',
    action: 'feed.live:read',
    description: 'Allow authenticated personas to read the live feed stream scoped to their tenant or crew.',
    requirements: [Permissions.FEED_VIEW],
    tags: ['feed', 'marketplace'],
    severity: 'medium',
    metadata: (req) => ({
      hasFilters: Boolean(req.query && Object.keys(req.query).length > 0),
      tenantHint: req.headers['x-fixnado-tenant'] || null
    })
  },
  'feed.live.create': {
    id: 'feed.live.create',
    version: '1.0.0',
    resource: 'feed.live',
    action: 'feed.live:create',
    description: 'Allow eligible providers and enterprise operators to publish live feed opportunities.',
    requirements: [Permissions.FEED_POST],
    tags: ['feed', 'marketplace', 'content'],
    severity: 'high',
    metadata: (req) => ({
      hasBudget: typeof req.body?.budgetAmount === 'number',
      attachments: Array.isArray(req.body?.images) ? req.body.images.length : 0,
      zoneId: req.body?.zoneId || null
    })
  },
  'feed.live.bid': {
    id: 'feed.live.bid',
    version: '1.0.0',
    resource: 'feed.live',
    action: 'feed.live:bid',
    description: 'Allow vetted crews to submit bids for marketplace jobs.',
    requirements: [Permissions.FEED_BID],
    tags: ['feed', 'marketplace', 'commerce'],
    severity: 'high',
    metadata: (req) => ({
      postId: req.params.postId,
      currency: req.body?.currency || null,
      hasMessage: Boolean(req.body?.message)
    })
  },
  'feed.live.message': {
    id: 'feed.live.message',
    version: '1.0.0',
    resource: 'feed.live',
    action: 'feed.live:message',
    description: 'Allow authorised crews and buyers to message within a live feed negotiation.',
    requirements: [Permissions.FEED_MESSAGE],
    tags: ['feed', 'marketplace', 'messaging'],
    severity: 'medium',
    metadata: (req) => ({
      postId: req.params.postId,
      bidId: req.params.bidId,
      hasAttachments: Array.isArray(req.body?.attachments) ? req.body.attachments.length : 0
    })
  },
  'affiliate.dashboard.view': {
    id: 'affiliate.dashboard.view',
    version: '1.0.0',
    resource: 'affiliate.dashboard',
    action: 'affiliate.dashboard:view',
    description: 'Allow partner managers to access affiliate performance dashboards.',
    requirements: [Permissions.AFFILIATE_DASHBOARD],
    tags: ['affiliate', 'analytics'],
    severity: 'medium',
    metadata: (req) => ({
      tenantHint: req.headers['x-fixnado-tenant'] || null
    })
  },
  'affiliate.referrals.view': {
    id: 'affiliate.referrals.view',
    version: '1.0.0',
    resource: 'affiliate.referrals',
    action: 'affiliate.referrals:view',
    description: 'Allow partner managers to view referral pipelines and incentives.',
    requirements: [Permissions.AFFILIATE_REFERRALS],
    tags: ['affiliate', 'crm'],
    severity: 'medium',
    metadata: (req) => ({
      tenantHint: req.headers['x-fixnado-tenant'] || null
    })
  },
  'inventory.manage': {
    id: 'inventory.manage',
    version: '1.0.0',
    resource: 'inventory',
    action: 'inventory:manage',
    description: 'Allow provider administrators to manage stock, rentals, and consumables.',
    requirements: [Permissions.INVENTORY_WRITE],
    tags: ['inventory', 'operations'],
    severity: 'high',
    metadata: (req) => ({
      persona: req.headers['x-fixnado-persona'] || null
    })
  },
  'admin.dashboard.view': {
    id: 'admin.dashboard.view',
    version: '1.0.0',
    resource: 'admin.dashboard',
    action: 'admin.dashboard:view',
    description: 'Allow platform administrators to view security, compliance, and KPI dashboards.',
    requirements: [Permissions.ADMIN_DASHBOARD],
    tags: ['admin', 'analytics'],
    severity: 'high'
  },
  'admin.features.read': {
    id: 'admin.features.read',
    version: '1.0.0',
    resource: 'admin.features',
    action: 'admin.features:read',
    description: 'Allow admin operators to read feature toggle states.',
    requirements: [Permissions.ADMIN_FEATURE_READ],
    tags: ['admin', 'features'],
    severity: 'medium'
  },
  'admin.features.write': {
    id: 'admin.features.write',
    version: '1.0.0',
    resource: 'admin.features',
    action: 'admin.features:write',
    description: 'Allow admin operators to mutate feature toggle states.',
    requirements: [Permissions.ADMIN_FEATURE_WRITE],
    tags: ['admin', 'features'],
    severity: 'critical'
  },
  'admin.platform.read': {
    id: 'admin.platform.read',
    version: '1.0.0',
    resource: 'admin.platform',
    action: 'admin.platform:read',
    description: 'Allow platform administrators to view system configuration snapshots.',
    requirements: [Permissions.ADMIN_PLATFORM_READ],
    tags: ['admin', 'platform'],
    severity: 'high'
  },
  'admin.platform.write': {
    id: 'admin.platform.write',
    version: '1.0.0',
    resource: 'admin.platform',
    action: 'admin.platform:write',
    description: 'Allow platform administrators to change platform configuration.',
    requirements: [Permissions.ADMIN_PLATFORM_WRITE],
    tags: ['admin', 'platform'],
    severity: 'critical'
  },
  'admin.affiliates.read': {
    id: 'admin.affiliates.read',
    version: '1.0.0',
    resource: 'admin.affiliates',
    action: 'admin.affiliates:read',
    description: 'Allow admin operators to view affiliate programme data.',
    requirements: [Permissions.ADMIN_AFFILIATE_READ],
    tags: ['admin', 'affiliate'],
    severity: 'medium'
  },
  'admin.affiliates.write': {
    id: 'admin.affiliates.write',
    version: '1.0.0',
    resource: 'admin.affiliates',
    action: 'admin.affiliates:write',
    description: 'Allow admin operators to mutate affiliate programme configuration.',
    requirements: [Permissions.ADMIN_AFFILIATE_WRITE],
    tags: ['admin', 'affiliate'],
    severity: 'high'
  },
  'admin.inbox.read': {
    id: 'admin.inbox.read',
    version: '1.0.0',
    resource: 'admin.inbox',
    action: 'admin.inbox:read',
    description: 'Allow platform administrators to view inbox routing, queue health, and automation state.',
    requirements: [Permissions.ADMIN_INBOX_READ],
    tags: ['admin', 'communications'],
    severity: 'high',
    metadata: (req) => ({ method: req.method, path: req.route?.path ?? null })
  },
  'admin.inbox.write': {
    id: 'admin.inbox.write',
    version: '1.0.0',
    resource: 'admin.inbox',
    action: 'admin.inbox:write',
    description: 'Allow platform administrators to manage inbox queues, templates, and automation guardrails.',
    requirements: [Permissions.ADMIN_INBOX_WRITE],
    tags: ['admin', 'communications'],
    severity: 'critical',
    metadata: (req) => ({ method: req.method, path: req.route?.path ?? null })
  },
  'finance.checkout.create': {
    id: 'finance.checkout.create',
    version: '1.0.0',
    resource: 'finance.checkout',
    action: 'finance.checkout:create',
    description: 'Allow trusted personas to initiate marketplace checkout and escrow funding.',
    requirements: [Permissions.PAYMENTS_CAPTURE],
    tags: ['finance', 'payments'],
    severity: 'critical',
    metadata: (req) => ({
      orderId: req.body?.orderId || null,
      serviceId: req.body?.serviceId || null,
      amount: req.body?.amount || null,
      currency: req.body?.currency || null,
      source: req.body?.source || req.headers['x-finance-source'] || 'unknown'
    })
  },
  'finance.overview.read': {
    id: 'finance.overview.read',
    version: '1.0.0',
    resource: 'finance.overview',
    action: 'finance.overview:read',
    description: 'Allow finance operators to review captured payments, disputes, and payouts.',
    requirements: [Permissions.FINANCE_OVERVIEW],
    tags: ['finance', 'reporting'],
    severity: 'high',
    metadata: (req) => ({
      regionId: req.query?.regionId || null,
      providerId: req.query?.providerId || null
    })
  },
  'finance.timeline.read': {
    id: 'finance.timeline.read',
    version: '1.0.0',
    resource: 'finance.timeline',
    action: 'finance.timeline:read',
    description: 'Allow finance and operations roles to inspect an order finance timeline.',
    requirements: [Permissions.FINANCE_OVERVIEW],
    tags: ['finance', 'operations'],
    severity: 'medium',
    metadata: (req) => ({
      orderId: req.params?.orderId || null
    })
  },
  'finance.reports.read': {
    id: 'finance.reports.read',
    version: '1.0.0',
    resource: 'finance.reports',
    action: 'finance.reports:read',
    description: 'Allow authorised finance roles to generate settlement and reconciliation reports.',
    requirements: [Permissions.FINANCE_OVERVIEW],
    tags: ['finance', 'reporting', 'export'],
    severity: 'high',
    metadata: (req) => ({
      format: req.query?.format || 'json',
      regionId: req.query?.regionId || null,
      providerId: req.query?.providerId || null
    })
  },
  'finance.alerts.read': {
    id: 'finance.alerts.read',
    version: '1.0.0',
    resource: 'finance.alerts',
    action: 'finance.alerts:read',
    description: 'Allow finance control tower roles to review regulatory alert queues.',
    requirements: [Permissions.FINANCE_OVERVIEW],
    tags: ['finance', 'risk', 'compliance'],
    severity: 'high',
    metadata: (req) => ({
      regionId: req.query?.regionId || null,
      providerId: req.query?.providerId || null
    })
  },
  'compliance.data-requests.create': {
    id: 'compliance.data-requests.create',
    version: '1.0.0',
    resource: 'compliance.data-requests',
    action: 'compliance.data-requests:create',
    description: 'Allow compliance operators to log GDPR data subject requests.',
    requirements: [Permissions.COMPLIANCE_PORTAL],
    tags: ['compliance', 'privacy'],
    severity: 'high',
    metadata: (req) => ({
      requestType: req.body?.requestType || null,
      region: req.body?.regionCode || null
    })
  },
  'compliance.data-requests.list': {
    id: 'compliance.data-requests.list',
    version: '1.0.0',
    resource: 'compliance.data-requests',
    action: 'compliance.data-requests:list',
    description: 'Allow compliance operators to review and triage GDPR requests.',
    requirements: [Permissions.COMPLIANCE_PORTAL],
    tags: ['compliance', 'privacy'],
    severity: 'medium',
    metadata: (req) => ({ status: req.query?.status || null })
  },
  'compliance.data-requests.export': {
    id: 'compliance.data-requests.export',
    version: '1.0.0',
    resource: 'compliance.data-requests',
    action: 'compliance.data-requests:export',
    description: 'Allow compliance officers to generate GDPR data export bundles.',
    requirements: [Permissions.COMPLIANCE_EXPORT],
    tags: ['compliance', 'privacy', 'export'],
    severity: 'critical',
    metadata: (req) => ({ requestId: req.params.requestId })
  },
  'compliance.data-requests.update': {
    id: 'compliance.data-requests.update',
    version: '1.0.0',
    resource: 'compliance.data-requests',
    action: 'compliance.data-requests:update',
    description: 'Allow compliance officers to update GDPR request status and audit notes.',
    requirements: [Permissions.COMPLIANCE_EXPORT],
    tags: ['compliance', 'privacy'],
    severity: 'high',
    metadata: (req) => ({ requestId: req.params.requestId, nextStatus: req.body?.status || null })
  },
  'compliance.data-warehouse.list': {
    id: 'compliance.data-warehouse.list',
    version: '1.0.0',
    resource: 'compliance.data-warehouse',
    action: 'compliance.data-warehouse:list',
    description: 'Allow compliance and data teams to review warehouse export runs.',
    requirements: [Permissions.COMPLIANCE_WAREHOUSE_VIEW],
    tags: ['compliance', 'privacy', 'data-platform'],
    severity: 'medium',
    metadata: (req) => ({ dataset: req.query?.dataset || null, region: req.query?.regionCode || null })
  },
  'compliance.data-warehouse.export': {
    id: 'compliance.data-warehouse.export',
    version: '1.0.0',
    resource: 'compliance.data-warehouse',
    action: 'compliance.data-warehouse:export',
    description: 'Allow privileged operators to trigger warehouse CDC exports with audit logging.',
    requirements: [Permissions.COMPLIANCE_WAREHOUSE_EXPORT],
    tags: ['compliance', 'privacy', 'data-platform'],
    severity: 'critical',
    metadata: (req) => ({ dataset: req.body?.dataset || req.query?.dataset || null, region: req.body?.regionCode || null })
  },
  'zones.match': {
    id: 'zones.match',
    version: '1.0.0',
    resource: 'zones.match',
    action: 'zones:match',
    description: 'Allow operations staff to match bookings to service zones.',
    requirements: [Permissions.ZONES_MATCH],
    tags: ['zones', 'operations'],
    severity: 'high',
    metadata: (req) => ({
      requestedZoneId: req.body?.zoneId || null,
      includeOutOfZone: Boolean(req.body?.allowOutOfZone)
    })
  },
  'zones.preview': {
    id: 'zones.preview',
    version: '1.0.0',
    resource: 'zones.preview',
    action: 'zones:preview',
    description: 'Allow operations staff to preview service coverage.',
    requirements: [Permissions.ZONES_PREVIEW],
    tags: ['zones', 'operations'],
    severity: 'medium',
    metadata: (req) => ({
      zoneId: req.query?.zoneId || null,
      postcode: req.query?.postcode || null
    })
  },
  'panel.provider.dashboard': {
    id: 'panel.provider.dashboard',
    version: '1.0.0',
    resource: 'panel.provider',
    action: 'panel.provider:view',
    description: 'Allow provider managers to view their operational dashboard.',
    requirements: [Permissions.PANEL_PROVIDER],
    tags: ['panel', 'provider'],
    severity: 'medium'
  },
  'panel.enterprise.dashboard': {
    id: 'panel.enterprise.dashboard',
    version: '1.0.0',
    resource: 'panel.enterprise',
    action: 'panel.enterprise:view',
    description: 'Allow enterprise stakeholders to view the enterprise oversight dashboard.',
    requirements: [Permissions.PANEL_ENTERPRISE],
    tags: ['panel', 'enterprise'],
    severity: 'high'
  },
  'panel.storefront.manage': {
    id: 'panel.storefront.manage',
    version: '1.0.0',
    resource: 'panel.storefront',
    action: 'panel.storefront:manage',
    description: 'Allow storefront administrators to update storefront configuration and catalogue.',
    requirements: [Permissions.PANEL_STOREFRONT],
    tags: ['panel', 'storefront'],
    severity: 'high'
  },
  'materials.showcase.view': {
    id: 'materials.showcase.view',
    version: '1.0.0',
    resource: 'materials.showcase',
    action: 'materials.showcase:view',
    description: 'Allow vetted users to access proprietary materials showcase data.',
    requirements: [Permissions.MATERIALS_VIEW],
    tags: ['materials', 'catalogue'],
    severity: 'medium'
  },
  'admin.blog.manage': {
    id: 'admin.blog.manage',
    version: '1.0.0',
    resource: 'admin.blog',
    action: 'admin.blog:manage',
    description: 'Allow marketing administrators to manage blog content.',
    requirements: [Permissions.ADMIN_FEATURE_WRITE],
    tags: ['admin', 'blog'],
    severity: 'medium'
  },
  'services.manage': {
    id: 'services.manage',
    version: '1.0.0',
    resource: 'services.manage',
    action: 'services:manage',
    description: 'Allow providers to manage service catalogues and packages.',
    requirements: [Permissions.SERVICES_MANAGE],
    tags: ['services', 'catalogue'],
    severity: 'high'
  },
  'services.book': {
    id: 'services.book',
    version: '1.0.0',
    resource: 'services.book',
    action: 'services:book',
    description: 'Allow customers to book services through the public checkout.',
    requirements: [Permissions.SERVICES_BOOK],
    tags: ['services', 'commerce'],
    severity: 'medium'
  }
};

export function getRoutePolicy(policyId) {
  if (!policyId) {
    return null;
  }

  const definition = ROUTE_POLICIES[policyId];
  if (!definition) {
    return null;
  }

  return { ...definition };
}

export function listRoutePolicies() {
  return Object.values(ROUTE_POLICIES).map((policy) => ({ ...policy }));
}

export default {
  getRoutePolicy,
  listRoutePolicies
};
