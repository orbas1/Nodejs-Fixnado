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
    })
  },
  'serviceman.control.manage': {
    id: 'serviceman.control.manage',
    version: '1.0.0',
    resource: 'serviceman.control',
    action: 'serviceman.control:manage',
    description:
      'Allow crew personas to manage dispute cases, evidence, and follow-up actions from the serviceman control centre.',
    requirements: [Permissions.SERVICEMAN_CONTROL_MANAGE],
    tags: ['serviceman', 'workspace', 'disputes'],
    severity: 'medium',
    metadata: (req) => ({
      persona: req.headers['x-fixnado-persona'] || null,
      surface: req.route?.path || null
    })
  },
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
  'serviceman.profile.manage': {
    id: 'serviceman.profile.manage',
    version: '1.0.0',
    resource: 'serviceman.profile',
    action: 'serviceman.profile:manage',
    description: 'Allow crew members to update their profile, emergency contacts, availability, and issued gear.',
    requirements: [Permissions.SERVICEMAN_PROFILE_MANAGE],
    tags: ['serviceman', 'profile', 'dashboard'],
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
  'fixnado.ads.read': {
    id: 'fixnado.ads.read',
    version: '1.0.0',
    resource: 'fixnado.ads',
    action: 'fixnado.ads:read',
    description: 'Allow Serviceman personas to access the Fixnado ads workspace and read campaign data.',
    requirements: [Permissions.CAMPAIGN_REVIEW],
    tags: ['ads', 'fixnado', 'serviceman'],
    severity: 'medium',
    metadata: (req) => ({
      campaignId: req.params?.campaignId ?? null,
      entity: req.params?.creativeId
        ? 'creative'
        : req.params?.signalId
          ? 'fraud-signal'
          : 'campaign',
      method: req.method
    })
  },
  'fixnado.ads.write': {
    id: 'fixnado.ads.write',
    version: '1.0.0',
    resource: 'fixnado.ads',
    action: 'fixnado.ads:write',
    description: 'Allow authorised personas to create and manage Fixnado ads campaigns, flights, creatives, and metrics.',
    requirements: [Permissions.CAMPAIGN_MANAGE],
    tags: ['ads', 'fixnado', 'serviceman'],
    severity: 'high',
    metadata: (req) => ({
      campaignId: req.params?.campaignId ?? null,
      entity: req.params?.creativeId
        ? 'creative'
        : req.params?.signalId
          ? 'fraud-signal'
          : 'campaign',
      method: req.method
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
  'servicemen.identity.manage': {
    id: 'servicemen.identity.manage',
    version: '1.0.0',
    resource: 'servicemen.identity',
    action: 'servicemen.identity:manage',
    description:
      'Allow authorised crew members and operations controllers to manage serviceman identity verification workflows and artefacts.',
    requirements: [Permissions.SERVICEMAN_IDENTITY_MANAGE],
    tags: ['servicemen', 'identity', 'compliance'],
    severity: 'high',
    metadata: (req) => ({
      servicemanId: req.params?.servicemanId || null,
      persona: req.headers['x-fixnado-persona'] || null,
      method: req.method
  'provider.calendar.read': {
    id: 'provider.calendar.read',
    version: '1.0.0',
    resource: 'provider.calendar',
    action: 'provider.calendar:view',
    description: 'Allow provider operators to inspect booking calendars, utilisation, and holds.',
    requirements: [Permissions.PROVIDER_CALENDAR_VIEW],
    tags: ['provider', 'calendar', 'operations'],
    severity: 'medium',
    metadata: (req) => ({
      companyId: req.query?.companyId || req.body?.companyId || null,
      persona: req.headers['x-fixnado-persona'] || null
    })
  },
  'provider.calendar.manage': {
    id: 'provider.calendar.manage',
    version: '1.0.0',
    resource: 'provider.calendar',
    action: 'provider.calendar:manage',
    description: 'Allow authorised provider admins to create bookings, manage holds, and update calendar settings.',
    requirements: [Permissions.PROVIDER_CALENDAR_MANAGE],
    tags: ['provider', 'calendar', 'operations'],
    severity: 'high',
    metadata: (req) => ({
      method: req.method,
      companyId: req.query?.companyId || req.body?.companyId || null,
      persona: req.headers['x-fixnado-persona'] || null
  'provider.escrows.read': {
    id: 'provider.escrows.read',
    version: '1.0.0',
    resource: 'provider.escrows',
    action: 'provider.escrows:read',
    description: 'Allow provider organisations to review escrow records tied to their service orders.',
    requirements: [Permissions.PROVIDER_ESCROW_READ],
    tags: ['provider', 'escrow', 'finance'],
    severity: 'high',
    metadata: (req) => ({
      persona: req.headers['x-fixnado-persona'] || null,
      providerId: req.user?.id ?? null,
      companyId: req.query?.companyId || req.body?.companyId || null,
      escrowId: req.params?.id || null
    })
  },
  'provider.escrows.write': {
    id: 'provider.escrows.write',
    version: '1.0.0',
    resource: 'provider.escrows',
    action: 'provider.escrows:write',
    description: 'Allow provider finance teams to update escrow metadata, milestones, and release policies.',
    requirements: [Permissions.PROVIDER_ESCROW_WRITE],
    tags: ['provider', 'escrow', 'finance'],
    severity: 'critical',
    metadata: (req) => ({
      persona: req.headers['x-fixnado-persona'] || null,
      providerId: req.user?.id ?? null,
      companyId: req.body?.companyId || req.query?.companyId || null,
      escrowId: req.params?.id || null
  'serviceman.escrows.view': {
    id: 'serviceman.escrows.view',
    version: '1.0.0',
    resource: 'serviceman.escrows',
    action: 'serviceman.escrows:view',
    description: 'Allow crew members to review escrow records linked to their active bookings.',
    requirements: [Permissions.SERVICEMAN_ESCROW_VIEW],
    tags: ['serviceman', 'escrow', 'finance'],
    severity: 'medium',
    metadata: (req) => ({
      status: req.query?.status || 'all',
      onHold: req.query?.onHold || 'all',
      policyId: req.query?.policyId || 'all'
    })
  },
  'serviceman.escrows.manage': {
    id: 'serviceman.escrows.manage',
    version: '1.0.0',
    resource: 'serviceman.escrows',
    action: 'serviceman.escrows:manage',
    description:
      'Allow authorised crew members to update escrow status, milestones, notes, and work logs for their assignments.',
    requirements: [Permissions.SERVICEMAN_ESCROW_MANAGE],
    tags: ['serviceman', 'escrow', 'finance'],
    severity: 'high',
    metadata: (req) => ({
      method: req.method,
      escrowId: req.params?.id || null,
      milestoneId: req.params?.milestoneId || null,
      workLogId: req.params?.workLogId || null,
      noteId: req.params?.noteId || null
    })
  },
  'service.orders.read': {
    id: 'service.orders.read',
    version: '1.0.0',
    resource: 'service.orders',
    action: 'service.orders:read',
    description: 'Allow authenticated customers to view and search their service orders.',
    requirements: [Permissions.SERVICE_ORDERS_VIEW],
    tags: ['orders', 'service', 'dashboard'],
    severity: 'medium',
    metadata: (req) => ({
      status: req.query?.status || 'all',
      priority: req.query?.priority || 'all',
      persona: req.headers['x-fixnado-persona'] || null
    })
  },
  'service.orders.manage': {
    id: 'service.orders.manage',
    version: '1.0.0',
    resource: 'service.orders',
    action: 'service.orders:manage',
    description: 'Allow eligible personas to create, update, and annotate service orders.',
    requirements: [Permissions.SERVICE_ORDERS_MANAGE],
    tags: ['orders', 'service', 'dashboard'],
    severity: 'high',
    metadata: (req) => ({
      method: req.method,
      orderId: req.params?.orderId || null,
      status: req.body?.status || null
    })
  },
  'serviceman.website.read': {
    id: 'serviceman.website.read',
    version: '1.0.0',
    resource: 'serviceman.website',
    action: 'serviceman.website:read',
    description: 'Allow authorised crew members to view and audit their microsite configuration.',
    requirements: [Permissions.SERVICEMAN_WEBSITE_READ],
    tags: ['serviceman', 'website', 'preferences'],
    severity: 'medium',
    metadata: (req) => ({
      actorId: req.user?.id ?? null,
      persona: req.headers['x-fixnado-persona'] || null
    })
  },
  'serviceman.website.write': {
    id: 'serviceman.website.write',
    version: '1.0.0',
    resource: 'serviceman.website',
    action: 'serviceman.website:write',
    description: 'Allow authorised crew leads to update microsite branding, content, and publishing preferences.',
    requirements: [Permissions.SERVICEMAN_WEBSITE_WRITE],
    tags: ['serviceman', 'website', 'preferences'],
    severity: 'high',
    metadata: (req) => ({
      actorId: req.user?.id ?? null,
      persona: req.headers['x-fixnado-persona'] || null
  'serviceman.bookings.view': {
    id: 'serviceman.bookings.view',
    version: '1.0.0',
    resource: 'serviceman.bookings',
    action: 'serviceman.bookings:view',
    description: 'Allow crew members to review assigned bookings, schedules, and notes.',
    requirements: [Permissions.SERVICEMAN_BOOKINGS_VIEW],
    tags: ['serviceman', 'bookings', 'workspace'],
    severity: 'medium',
    metadata: (req) => ({
      servicemanId: req.user?.id ?? null,
      persona: req.headers['x-fixnado-persona'] || null
    })
  },
  'serviceman.bookings.manage': {
    id: 'serviceman.bookings.manage',
    version: '1.0.0',
    resource: 'serviceman.bookings',
    action: 'serviceman.bookings:manage',
    description: 'Allow crew members to update booking status, schedules, notes, and workspace preferences.',
    requirements: [Permissions.SERVICEMAN_BOOKINGS_MANAGE],
    tags: ['serviceman', 'bookings', 'workspace'],
    severity: 'high',
    metadata: (req) => ({
      servicemanId: req.user?.id ?? null,
      persona: req.headers['x-fixnado-persona'] || null,
      method: req.method
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
  'admin.dashboard.configure': {
    id: 'admin.dashboard.configure',
    version: '1.0.0',
    resource: 'admin.dashboard',
    action: 'admin.dashboard:configure',
    description: 'Allow platform administrators to configure dashboard overview thresholds and insights.',
    requirements: [Permissions.ADMIN_DASHBOARD_WRITE],
    tags: ['admin', 'analytics'],
    severity: 'critical'
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
  'admin.bookings.read': {
    id: 'admin.bookings.read',
    version: '1.0.0',
    resource: 'admin.bookings',
    action: 'admin.bookings:read',
    description: 'Allow platform administrators to view booking management insights and settings.',
    requirements: [Permissions.ADMIN_BOOKINGS_READ],
    tags: ['admin', 'bookings'],
    severity: 'high'
  },
  'admin.bookings.write': {
    id: 'admin.bookings.write',
    version: '1.0.0',
    resource: 'admin.bookings',
    action: 'admin.bookings:write',
    description: 'Allow platform administrators to create and update bookings, templates, and guardrails.',
    requirements: [Permissions.ADMIN_BOOKINGS_WRITE],
    tags: ['admin', 'bookings'],
  'admin.providers.read': {
    id: 'admin.providers.read',
    version: '1.0.0',
    resource: 'admin.providers',
    action: 'admin.providers:read',
    description: 'Allow platform administrators to view SME/provider onboarding data and coverage.',
    requirements: [Permissions.ADMIN_PROVIDER_READ],
    tags: ['admin', 'providers', 'sme'],
    severity: 'high',
    metadata: (req) => ({
      scope: req.query?.scope || 'directory',
      companyId: req.params?.companyId || null
    })
  },
  'admin.providers.write': {
    id: 'admin.providers.write',
    version: '1.0.0',
    resource: 'admin.providers',
    action: 'admin.providers:write',
    description: 'Allow platform administrators to onboard, edit, and manage SME/provider records.',
    requirements: [Permissions.ADMIN_PROVIDER_WRITE],
    tags: ['admin', 'providers', 'sme'],
    severity: 'critical',
    metadata: (req) => ({
      companyId: req.params?.companyId || req.body?.companyId || null,
      action: req.method?.toLowerCase() || 'unknown'
    })
  },
  'admin.providers.archive': {
    id: 'admin.providers.archive',
    version: '1.0.0',
    resource: 'admin.providers',
    action: 'admin.providers:archive',
    description: 'Allow platform administrators to archive or retire SME/provider organisations.',
    requirements: [Permissions.ADMIN_PROVIDER_ARCHIVE],
    tags: ['admin', 'providers', 'sme'],
    severity: 'critical',
    metadata: (req) => ({
      companyId: req.params?.companyId || null,
      actor: req.user?.id || null
    })
  },
  'admin.customJobs.read': {
    id: 'admin.customJobs.read',
    version: '1.0.0',
    resource: 'admin.custom-jobs',
    action: 'admin.custom-jobs:read',
    description: 'Allow administrators to review custom job requests, bids, and negotiation history.',
    requirements: [Permissions.ADMIN_CUSTOM_JOBS_READ],
    tags: ['admin', 'custom-jobs'],
    severity: 'high',
    metadata: (req) => ({
      status: req.query?.status ?? 'all',
      zoneId: req.query?.zoneId ?? null,
      jobId: req.params?.id ?? null
    })
  },
  'admin.customJobs.write': {
    id: 'admin.customJobs.write',
    version: '1.0.0',
    resource: 'admin.custom-jobs',
    action: 'admin.custom-jobs:write',
    description: 'Allow administrators to create, edit, award, and message within custom jobs.',
    requirements: [Permissions.ADMIN_CUSTOM_JOBS_WRITE],
    tags: ['admin', 'custom-jobs'],
    severity: 'critical',
    metadata: (req) => ({
      jobId: req.params?.id ?? null,
      bidId: req.params?.bidId ?? null,
      method: req.method ?? 'UNKNOWN'
    })
  'admin.rbac.read': {
    id: 'admin.rbac.read',
    version: '1.0.0',
    resource: 'admin.rbac',
    action: 'admin.rbac:read',
    description: 'Allow administrators to inspect RBAC definitions and assignments.',
    requirements: [Permissions.ADMIN_RBAC_READ],
    tags: ['admin', 'security'],
    severity: 'high',
    metadata: (req) => ({
      scope: req?.params?.key ? 'role' : 'collection',
      roleKey: req?.params?.key ?? null
    })
  },
  'admin.rbac.write': {
    id: 'admin.rbac.write',
    version: '1.0.0',
    resource: 'admin.rbac',
    action: 'admin.rbac:write',
    description: 'Allow administrators to create, update, and revoke RBAC roles and assignments.',
    requirements: [Permissions.ADMIN_RBAC_WRITE],
    tags: ['admin', 'security'],
    severity: 'critical',
    metadata: (req) => ({
      roleKey: req?.params?.key ?? null,
      assignmentId: req?.params?.assignmentId ?? null,
      method: req?.method ?? null
    })
  'admin.profile.read': {
    id: 'admin.profile.read',
    version: '1.0.0',
    resource: 'admin.profile',
    action: 'admin.profile:read',
    description: 'Allow administrators to review their control tower profile and preferences.',
    requirements: [Permissions.ADMIN_PROFILE_READ],
    tags: ['admin', 'profile'],
    severity: 'medium',
    metadata: (req) => ({ persona: req.headers['x-fixnado-persona'] || null })
    description: 'Allow platform administrators to view and audit their control centre profile settings.',
    requirements: [Permissions.ADMIN_PROFILE_READ],
    tags: ['admin', 'profile'],
    severity: 'medium'
  },
  'admin.profile.write': {
    id: 'admin.profile.write',
    version: '1.0.0',
    resource: 'admin.profile',
    action: 'admin.profile:write',
    description: 'Allow administrators to update contact, security, and notification preferences.',
    requirements: [Permissions.ADMIN_PROFILE_WRITE],
    tags: ['admin', 'profile'],
    severity: 'high',
    metadata: (req) => ({ persona: req.headers['x-fixnado-persona'] || null })
    description: 'Allow platform administrators to edit profile, address, and delegate permissions.',
    requirements: [Permissions.ADMIN_PROFILE_WRITE],
    tags: ['admin', 'profile'],
    severity: 'high'
  },
  'admin.preferences.read': {
    id: 'admin.preferences.read',
    version: '1.0.0',
    resource: 'admin.preferences',
    action: 'admin.preferences:read',
    description: 'Allow platform administrators to inspect control centre preferences.',
    requirements: [Permissions.ADMIN_SETTINGS_READ],
    tags: ['admin', 'settings'],
    severity: 'high'
  },
  'admin.preferences.write': {
    id: 'admin.preferences.write',
    version: '1.0.0',
    resource: 'admin.preferences',
    action: 'admin.preferences:write',
    description: 'Allow platform administrators to update control centre preferences.',
    requirements: [Permissions.ADMIN_SETTINGS_WRITE],
    tags: ['admin', 'settings'],
  'admin.automation.read': {
    id: 'admin.automation.read',
    version: '1.0.0',
    resource: 'admin.automation',
    action: 'admin.automation:read',
    description: 'Allow authorised operators to review automation backlog initiatives.',
    requirements: [Permissions.ADMIN_AUTOMATION_READ],
    tags: ['admin', 'automation'],
    severity: 'medium',
    metadata: (req) => ({ includeArchived: req.query?.includeArchived === 'true' })
  },
  'admin.automation.write': {
    id: 'admin.automation.write',
    version: '1.0.0',
    resource: 'admin.automation',
    action: 'admin.automation:write',
    description: 'Allow platform administrators to create, update, and archive automation initiatives.',
    requirements: [Permissions.ADMIN_AUTOMATION_WRITE],
    tags: ['admin', 'automation'],
    severity: 'high',
    metadata: (req) => ({ method: req.method, initiativeId: req.params?.id || null })
  'admin.enterprise.read': {
    id: 'admin.enterprise.read',
    version: '1.0.0',
    resource: 'admin.enterprise',
    action: 'admin.enterprise:read',
    description: 'Allow platform administrators to view enterprise account settings and coverage.',
    requirements: [Permissions.ADMIN_ENTERPRISE_READ],
    tags: ['admin', 'enterprise'],
    severity: 'high',
    metadata: (req) => ({
      accountId: req.params?.accountId || null,
      includeArchived: req.query?.includeArchived === 'true'
    })
  },
  'admin.enterprise.write': {
    id: 'admin.enterprise.write',
    version: '1.0.0',
    resource: 'admin.enterprise',
    action: 'admin.enterprise:write',
    description: 'Allow platform administrators to create and update enterprise accounts, sites, and playbooks.',
    requirements: [Permissions.ADMIN_ENTERPRISE_WRITE],
    tags: ['admin', 'enterprise'],
    severity: 'critical',
    metadata: (req) => ({
      accountId: req.params?.accountId || null,
      siteId: req.params?.siteId || null,
      stakeholderId: req.params?.stakeholderId || null,
      playbookId: req.params?.playbookId || null
    })
  'admin.appearance.read': {
    id: 'admin.appearance.read',
    version: '1.0.0',
    resource: 'admin.appearance',
    action: 'admin.appearance:read',
    description: 'Allow admin operators to review appearance profiles, media, and marketing variants.',
    requirements: [Permissions.ADMIN_APPEARANCE_READ],
    tags: ['admin', 'appearance', 'branding'],
    severity: 'high',
    metadata: (req) => ({
      profileId: req.params?.id || null,
      slug: req.query?.slug || null
    })
  },
  'admin.appearance.write': {
    id: 'admin.appearance.write',
    version: '1.0.0',
    resource: 'admin.appearance',
    action: 'admin.appearance:write',
    description: 'Allow admin operators to create and update appearance profiles, assets, and marketing variants.',
    requirements: [Permissions.ADMIN_APPEARANCE_WRITE],
    tags: ['admin', 'appearance', 'branding'],
    severity: 'critical',
    metadata: (req) => ({
      profileId: req.params?.id || null,
      method: req.method,
      action: req.method === 'DELETE' ? 'archive' : 'mutate'
    })
  'admin.home-builder.manage': {
    id: 'admin.home-builder.manage',
    version: '1.0.0',
    resource: 'admin.home-builder',
    action: 'admin.home-builder:manage',
    description: 'Allow platform administrators to build and publish marketing home pages.',
    requirements: [Permissions.ADMIN_HOME_BUILDER],
    tags: ['admin', 'content', 'marketing'],
    severity: 'critical',
    metadata: (req) => ({
      method: req.method,
      pageId: req.params?.pageId ?? null,
      sectionId: req.params?.sectionId ?? null,
      componentId: req.params?.componentId ?? null
    })
  'admin.website.read': {
    id: 'admin.website.read',
    version: '1.0.0',
    resource: 'admin.website',
    action: 'admin.website:read',
    description: 'Allow administrators to view marketing site pages, navigation, and widgets.',
    requirements: [Permissions.ADMIN_WEBSITE_READ],
    tags: ['admin', 'website', 'cms'],
    severity: 'high',
    metadata: (req) => ({
      entity: req.params?.pageId ? 'page' : req.params?.menuId ? 'navigation' : 'collection'
    })
  },
  'admin.website.write': {
    id: 'admin.website.write',
    version: '1.0.0',
    resource: 'admin.website',
    action: 'admin.website:write',
    description: 'Allow administrators to create, update, and retire marketing site assets.',
    requirements: [Permissions.ADMIN_WEBSITE_WRITE],
    tags: ['admin', 'website', 'cms'],
    severity: 'critical',
    metadata: (req) => ({
      entity: req.params?.pageId
        ? 'page'
        : req.params?.menuId
          ? 'navigation'
          : req.params?.itemId
            ? 'navigation-item'
            : 'unknown',
      method: req.method
    })
  'admin.live-feed.audit.read': {
    id: 'admin.live-feed.audit.read',
    version: '1.0.0',
    resource: 'admin.live-feed',
    action: 'admin.live-feed:audit:read',
    description: 'Allow administrators to inspect live feed audit events, filters, and summaries.',
    requirements: [Permissions.ADMIN_LIVE_FEED_AUDIT_READ],
    tags: ['admin', 'live-feed', 'audit'],
    severity: 'high',
    metadata: (req) => ({ query: req.query ?? {} })
  },
  'admin.live-feed.audit.write': {
    id: 'admin.live-feed.audit.write',
    version: '1.0.0',
    resource: 'admin.live-feed',
    action: 'admin.live-feed:audit:write',
    description: 'Allow administrators to annotate, assign, and create live feed audit entries.',
    requirements: [Permissions.ADMIN_LIVE_FEED_AUDIT_WRITE],
    tags: ['admin', 'live-feed', 'audit'],
    severity: 'critical',
    metadata: (req) => ({
      auditId: req.params?.auditId || null,
      noteId: req.params?.noteId || null,
      method: req.method
    })
  'admin.audit.read': {
    id: 'admin.audit.read',
    version: '1.0.0',
    resource: 'admin.audit',
    action: 'admin.audit:read',
    description: 'Allow administrators to review audit timeline events and evidence.',
    requirements: [Permissions.ADMIN_AUDIT_READ],
    tags: ['admin', 'audit'],
    severity: 'high',
    metadata: (req) => ({
      timeframe: req.query?.timeframe || '7d',
      category: req.query?.category || 'all'
    })
  },
  'admin.audit.write': {
    id: 'admin.audit.write',
    version: '1.0.0',
    resource: 'admin.audit',
    action: 'admin.audit:write',
    description: 'Allow administrators to curate audit timeline events, attachments, and owners.',
    requirements: [Permissions.ADMIN_AUDIT_WRITE],
    tags: ['admin', 'audit'],
    severity: 'critical',
    metadata: (req) => ({
      method: req.method,
      eventId: req.params?.id || null
    })
  'admin.security.posture.read': {
    id: 'admin.security.posture.read',
    version: '1.0.0',
    resource: 'admin.security.posture',
    action: 'admin.security.posture:read',
    description: 'Allow administrators to view security posture and telemetry insights.',
    requirements: [Permissions.ADMIN_SECURITY_POSTURE_READ],
    tags: ['admin', 'security'],
    severity: 'high'
  },
  'admin.security.posture.write': {
    id: 'admin.security.posture.write',
    version: '1.0.0',
    resource: 'admin.security.posture',
    action: 'admin.security.posture:write',
    description: 'Allow administrators to manage security posture signals, automation, and connectors.',
    requirements: [Permissions.ADMIN_SECURITY_POSTURE_WRITE],
    tags: ['admin', 'security'],
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
  'admin.escrows.read': {
    id: 'admin.escrows.read',
    version: '1.0.0',
    resource: 'admin.escrows',
    action: 'admin.escrows:read',
    description: 'Allow administrators to review escrow records, milestones, and compliance notes.',
    requirements: [Permissions.ADMIN_ESCROW_READ],
    tags: ['admin', 'finance', 'escrow'],
    severity: 'high',
    metadata: (req) => ({
      scope: req.query?.status || 'all',
      policy: req.query?.policyId || 'all'
    })
  },
  'admin.escrows.write': {
    id: 'admin.escrows.write',
    version: '1.0.0',
    resource: 'admin.escrows',
    action: 'admin.escrows:write',
    description: 'Allow administrators to create manual escrows and update release policies, notes, and milestones.',
    requirements: [Permissions.ADMIN_ESCROW_WRITE],
    tags: ['admin', 'finance', 'escrow'],
    severity: 'critical',
    metadata: (req) => ({
      method: req.method,
      escrowId: req.params?.id ?? null
    })
  'admin.wallets.read': {
    id: 'admin.wallets.read',
    version: '1.0.0',
    resource: 'admin.wallets',
    action: 'admin.wallets:read',
    description: 'Allow administrators to review wallet configuration, balances, and ledger history.',
    requirements: [Permissions.FINANCE_WALLET_VIEW],
    tags: ['admin', 'finance', 'wallets'],
    severity: 'high',
    metadata: (req) => ({
      scope: req.params?.id ? 'account' : req.query?.scope || 'overview',
      accountId: req.params?.id || null,
      method: req.method
    })
  },
  'admin.wallets.manage': {
    id: 'admin.wallets.manage',
    version: '1.0.0',
    resource: 'admin.wallets',
    action: 'admin.wallets:manage',
    description: 'Allow administrators to configure wallet settings, create accounts, and post ledger adjustments.',
    requirements: [Permissions.FINANCE_WALLET_MANAGE],
    tags: ['admin', 'finance', 'wallets'],
    severity: 'critical',
    metadata: (req) => ({
      scope: req.params?.id ? 'account' : 'settings',
      accountId: req.params?.id || null,
      method: req.method
    })
  'admin.commandMetrics.read': {
    id: 'admin.commandMetrics.read',
    version: '1.0.0',
    resource: 'admin.command-metrics',
    action: 'admin.command-metrics:read',
    description: 'Allow admin operators to view command centre metric thresholds and summaries.',
    requirements: [Permissions.ADMIN_COMMAND_METRICS_READ],
    tags: ['admin', 'analytics'],
    severity: 'high'
  },
  'admin.commandMetrics.write': {
    id: 'admin.commandMetrics.write',
    version: '1.0.0',
    resource: 'admin.command-metrics',
    action: 'admin.command-metrics:write',
    description: 'Allow admin operators to configure command centre thresholds, cards, and call-to-actions.',
    requirements: [Permissions.ADMIN_COMMAND_METRICS_WRITE],
    tags: ['admin', 'analytics'],
    severity: 'critical'
  },
  'serviceman.metrics.read': {
    id: 'serviceman.metrics.read',
    version: '1.0.0',
    resource: 'serviceman.metrics',
    action: 'serviceman.metrics:read',
    description: 'Allow crew leads to review productivity, quality, and readiness guardrails.',
    requirements: [Permissions.SERVICEMAN_METRICS_READ],
    tags: ['serviceman', 'analytics'],
    severity: 'medium',
    metadata: () => ({ section: 'metrics', scope: 'serviceman-control-centre' })
  },
  'serviceman.metrics.write': {
    id: 'serviceman.metrics.write',
    version: '1.0.0',
    resource: 'serviceman.metrics',
    action: 'serviceman.metrics:write',
    description: 'Allow authorised crew leads to update crew KPI targets, checklists, and dashboard cards.',
    requirements: [Permissions.SERVICEMAN_METRICS_WRITE],
    tags: ['serviceman', 'analytics'],
    severity: 'high',
    metadata: (req) => ({ section: 'metrics', method: req.method, cardId: req.params?.id ?? null })
  },
  'admin.operations.queues.read': {
    id: 'admin.operations.queues.read',
    version: '1.0.0',
    resource: 'admin.operations.queues',
    action: 'admin.operations.queues:read',
    description: 'Allow operations staff to view and audit active operations queue boards and updates.',
    requirements: [Permissions.ADMIN_OPERATIONS_QUEUE_READ],
    tags: ['admin', 'operations'],
    severity: 'high',
    metadata: (req) => ({
      queueId: req.params?.id ?? null,
      hasUpdates: req.query?.includeUpdates !== 'false'
    })
  },
  'admin.operations.queues.write': {
    id: 'admin.operations.queues.write',
    version: '1.0.0',
    resource: 'admin.operations.queues',
    action: 'admin.operations.queues:write',
    description: 'Allow authorised staff to create, edit, and archive operations queues and updates.',
    requirements: [Permissions.ADMIN_OPERATIONS_QUEUE_WRITE],
    tags: ['admin', 'operations'],
    severity: 'critical',
    metadata: (req) => ({
      queueId: req.params?.id ?? null,
      updateId: req.params?.updateId ?? null
    })
  },
  'admin.users.read': {
    id: 'admin.users.read',
    version: '1.0.0',
    resource: 'admin.users',
    action: 'admin.users:read',
    description: 'Allow platform administrators to audit and search user accounts and roles.',
    requirements: [Permissions.ADMIN_USER_READ],
    tags: ['admin', 'users'],
    severity: 'high',
    metadata: (req) => ({
      roleFilter: req.query?.role ?? null,
      statusFilter: req.query?.status ?? null
    })
  },
  'admin.users.write': {
    id: 'admin.users.write',
    version: '1.0.0',
    resource: 'admin.users',
    action: 'admin.users:write',
    description: 'Allow platform administrators to update user roles, status, and security controls.',
    requirements: [Permissions.ADMIN_USER_WRITE],
    tags: ['admin', 'users'],
    severity: 'critical',
    metadata: (req) => ({ userId: req.params?.id ?? null })
  },
  'admin.users.invite': {
    id: 'admin.users.invite',
    version: '1.0.0',
    resource: 'admin.users',
    action: 'admin.users:invite',
    description: 'Allow platform administrators to create or invite new platform users.',
    requirements: [Permissions.ADMIN_USER_INVITE],
    tags: ['admin', 'users'],
    severity: 'critical'
  'admin.marketplace.manage': {
    id: 'admin.marketplace.manage',
    version: '1.0.0',
    resource: 'admin.marketplace',
    action: 'admin.marketplace:manage',
    description: 'Allow platform administrators to govern marketplace tools, materials, and listing approvals.',
    requirements: [Permissions.ADMIN_DASHBOARD, Permissions.INVENTORY_WRITE],
    tags: ['admin', 'marketplace', 'inventory'],
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
  'admin.rentals.read': {
    id: 'admin.rentals.read',
    version: '1.0.0',
    resource: 'admin.rentals',
    action: 'admin.rentals:read',
    description: 'Allow admin operators to review rental agreements, deposits, and checkpoints.',
    requirements: [Permissions.ADMIN_RENTAL_READ],
    tags: ['admin', 'rentals', 'inventory'],
    severity: 'high',
    metadata: (req) => ({
      status: req.query?.status || 'all',
      companyId: req.query?.companyId || null,
      search: req.query?.search || null
    })
  },
  'admin.rentals.write': {
    id: 'admin.rentals.write',
    version: '1.0.0',
    resource: 'admin.rentals',
    action: 'admin.rentals:write',
    description: 'Allow admin operators to manage rental lifecycle events and checkpoints.',
    requirements: [Permissions.ADMIN_RENTAL_WRITE],
    tags: ['admin', 'rentals', 'inventory'],
    severity: 'critical',
    metadata: (req) => ({
      rentalId: req.params?.rentalId || null,
      action: req.method,
      endpoint: req.originalUrl || req.baseUrl || null
    })
  },
  'admin.purchases.read': {
    id: 'admin.purchases.read',
    version: '1.0.0',
    resource: 'admin.purchases',
    action: 'admin.purchases:read',
    description: 'Allow operations and admin staff to view procurement workspaces and supplier directories.',
    requirements: [Permissions.ADMIN_PURCHASE_READ],
    tags: ['admin', 'procurement'],
    severity: 'high',
    metadata: (req) => ({
      status: req.query?.status || 'all',
      supplierId: req.query?.supplierId || null
    })
  },
  'admin.purchases.write': {
    id: 'admin.purchases.write',
    version: '1.0.0',
    resource: 'admin.purchases',
    action: 'admin.purchases:write',
    description: 'Allow operations and admin staff to create or update purchase orders, suppliers, and receiving records.',
    requirements: [Permissions.ADMIN_PURCHASE_WRITE],
    tags: ['admin', 'procurement'],
    severity: 'critical',
    metadata: (req) => ({
      method: req.method,
      entity: req.params?.orderId ? 'order' : req.params?.supplierId ? 'supplier' : 'purchase',
      reference: req.body?.reference || null
    })
  },
  'admin.purchases.budget': {
    id: 'admin.purchases.budget',
    version: '1.0.0',
    resource: 'admin.purchases.budget',
    action: 'admin.purchases.budget:write',
    description: 'Allow administrators to set procurement budgets and guardrails.',
    requirements: [Permissions.ADMIN_PURCHASE_BUDGET],
    tags: ['admin', 'procurement', 'finance'],
    severity: 'critical',
    metadata: (req) => ({
      category: req.body?.category || null,
      fiscalYear: req.body?.fiscalYear || null
    })
  },
  'admin.services.read': {
    id: 'admin.services.read',
    version: '1.0.0',
    resource: 'admin.services',
    action: 'admin.services:read',
    description: 'Allow admin operators to review service listings, categories, and catalogue health.',
    requirements: [Permissions.ADMIN_SERVICES_READ],
    tags: ['admin', 'services', 'catalogue'],
    severity: 'high',
    metadata: (req) => ({
      entity: req.params?.categoryId ? 'category' : req.params?.serviceId ? 'listing' : 'collection'
    })
  },
  'admin.services.write': {
    id: 'admin.services.write',
    version: '1.0.0',
    resource: 'admin.services',
    action: 'admin.services:write',
    description: 'Allow admin operators to create, update, and archive service listings and categories.',
    requirements: [Permissions.ADMIN_SERVICES_WRITE],
    tags: ['admin', 'services', 'catalogue'],
    severity: 'critical',
    metadata: (req) => ({
      entity: req.params?.categoryId ? 'category' : req.params?.serviceId ? 'listing' : 'collection'
    })
  },
  'admin.legal.read': {
    id: 'admin.legal.read',
    version: '1.0.0',
    resource: 'admin.legal',
    action: 'admin.legal:read',
    description: 'Allow administrators to view legal policy metadata and version history.',
    requirements: [Permissions.ADMIN_LEGAL_READ],
    tags: ['admin', 'legal'],
    severity: 'high',
    metadata: (req) => ({ slug: req.params?.slug || null })
  },
  'admin.legal.write': {
    id: 'admin.legal.write',
    version: '1.0.0',
    resource: 'admin.legal',
    action: 'admin.legal:write',
    description: 'Allow administrators to create, update, and publish legal policy versions.',
    requirements: [Permissions.ADMIN_LEGAL_WRITE],
    tags: ['admin', 'legal'],
    severity: 'critical',
    metadata: (req) => ({ slug: req.params?.slug || null, versionId: req.params?.versionId || null })
  'zones.read': {
    id: 'zones.read',
    version: '1.0.0',
    resource: 'zones',
    action: 'zones:read',
    description: 'Allow operations staff to inspect geo-zone definitions, compliance, and analytics.',
    requirements: [Permissions.ZONES_READ],
    tags: ['zones', 'operations'],
    severity: 'high',
    metadata: (req) => ({
      zoneId: req.params?.zoneId || null,
      companyId: req.query?.companyId || req.body?.companyId || null,
      includeAnalytics: req.query?.includeAnalytics === 'true'
    })
  },
  'zones.manage': {
    id: 'zones.manage',
    version: '1.0.0',
    resource: 'zones',
    action: 'zones:manage',
    description: 'Allow operations administrators to create, update, import, and delete service zones.',
    requirements: [Permissions.ZONES_MANAGE],
    tags: ['zones', 'operations'],
    severity: 'critical',
    metadata: (req) => ({
      zoneId: req.params?.zoneId || null,
      companyId: req.body?.companyId || req.query?.companyId || null,
      replace: Boolean(req.body?.replace),
      coverageCount: Array.isArray(req.body?.coverages) ? req.body.coverages.length : null
    })
  },
  'zones.coverage': {
    id: 'zones.coverage',
    version: '1.0.0',
    resource: 'zones.coverage',
    action: 'zones:coverage',
    description: 'Allow operations administrators to manage zone-to-service coverage assignments.',
    requirements: [Permissions.ZONES_COVERAGE],
    tags: ['zones', 'operations'],
    severity: 'critical',
    metadata: (req) => ({
      zoneId: req.params?.zoneId || null,
      coverageId: req.params?.coverageId || null,
      coverageCount: Array.isArray(req.body?.coverages) ? req.body.coverages.length : null
    })
  'admin.compliance.read': {
    id: 'admin.compliance.read',
    version: '1.0.0',
    resource: 'admin.compliance',
    action: 'admin.compliance:read',
    description: 'Allow compliance operators to view and monitor control libraries.',
    requirements: [Permissions.ADMIN_COMPLIANCE_READ],
    tags: ['admin', 'compliance'],
    severity: 'high'
  },
  'admin.compliance.write': {
    id: 'admin.compliance.write',
    version: '1.0.0',
    resource: 'admin.compliance',
    action: 'admin.compliance:write',
    description: 'Allow compliance operators to manage control libraries and automation guardrails.',
    requirements: [Permissions.ADMIN_COMPLIANCE_WRITE],
    tags: ['admin', 'compliance'],
    severity: 'critical'
  'admin.taxonomy.read': {
    id: 'admin.taxonomy.read',
    version: '1.0.0',
    resource: 'admin.taxonomy',
    action: 'admin.taxonomy:read',
    description: 'Allow platform administrators to review service taxonomy types and categories.',
    requirements: [Permissions.ADMIN_TAXONOMY_READ],
    tags: ['admin', 'taxonomy'],
    severity: 'medium',
    metadata: (req) => ({ includeArchived: req.query?.includeArchived === 'true' })
  },
  'admin.taxonomy.write': {
    id: 'admin.taxonomy.write',
    version: '1.0.0',
    resource: 'admin.taxonomy',
    action: 'admin.taxonomy:write',
    description: 'Allow platform administrators to create, update, and archive service taxonomy entries.',
    requirements: [Permissions.ADMIN_TAXONOMY_WRITE],
    tags: ['admin', 'taxonomy'],
    severity: 'high',
    metadata: (req) => ({ method: req.method, path: req.path })
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
  'finance.disputes.read': {
    id: 'finance.disputes.read',
    version: '1.0.0',
    resource: 'finance.disputes',
    action: 'finance.disputes:read',
    description: 'Allow finance operators to review the dispute health workspace.',
    requirements: [Permissions.DISPUTE_VIEW],
    tags: ['finance', 'disputes'],
    severity: 'high',
    metadata: (req) => ({
      section: 'dispute-health',
      capability: req.params?.bucketId ? 'history' : 'view',
      bucketId: req.params?.bucketId || null
    })
  },
  'finance.disputes.manage': {
    id: 'finance.disputes.manage',
    version: '1.0.0',
    resource: 'finance.disputes',
    action: 'finance.disputes:manage',
    description: 'Allow authorised operators to edit dispute cadences, playbooks, and metrics.',
    requirements: [Permissions.DISPUTE_MANAGE],
    tags: ['finance', 'disputes', 'admin'],
    severity: 'critical',
    metadata: (req) => ({
      section: 'dispute-health',
      method: req.method,
      bucketId: req.params?.bucketId || null,
      entryId: req.params?.entryId || null
  'wallet.accounts.read': {
    id: 'wallet.accounts.read',
    version: '1.0.0',
    resource: 'wallet.accounts',
    action: 'wallet.accounts:read',
    description: 'Allow customers and operators to view wallet balances and settings.',
    requirements: [Permissions.WALLET_VIEW],
    tags: ['wallet', 'finance'],
    severity: 'medium',
    metadata: (req) => ({
      userId: req.query?.userId || req.user?.id || null,
      companyId: req.query?.companyId || null
    })
  },
  'wallet.accounts.create': {
    id: 'wallet.accounts.create',
    version: '1.0.0',
    resource: 'wallet.accounts',
    action: 'wallet.accounts:create',
    description: 'Allow authorised roles to create wallet accounts for customers or organisations.',
    requirements: [Permissions.WALLET_MANAGE],
    tags: ['wallet', 'finance'],
    severity: 'high',
    metadata: (req) => ({
      userId: req.body?.userId || req.user?.id || null,
      companyId: req.body?.companyId || null
    })
  },
  'wallet.accounts.update': {
    id: 'wallet.accounts.update',
    version: '1.0.0',
    resource: 'wallet.accounts',
    action: 'wallet.accounts:update',
    description: 'Allow authorised actors to update wallet settings and thresholds.',
    requirements: [Permissions.WALLET_MANAGE],
    tags: ['wallet', 'finance'],
    severity: 'high',
    metadata: (req) => ({
      accountId: req.params?.accountId || null
    })
  },
  'wallet.transactions.read': {
    id: 'wallet.transactions.read',
    version: '1.0.0',
    resource: 'wallet.transactions',
    action: 'wallet.transactions:read',
    description: 'Allow wallet owners to review transaction history and holds.',
    requirements: [Permissions.WALLET_VIEW],
    tags: ['wallet', 'finance'],
    severity: 'medium',
    metadata: (req) => ({
      accountId: req.params?.accountId || null,
      type: req.query?.type || null
    })
  },
  'wallet.transactions.create': {
    id: 'wallet.transactions.create',
    version: '1.0.0',
    resource: 'wallet.transactions',
    action: 'wallet.transactions:create',
    description: 'Allow authorised actors to credit, debit, or hold wallet balances.',
    requirements: [Permissions.WALLET_TRANSACT],
    tags: ['wallet', 'finance'],
    severity: 'critical',
    metadata: (req) => ({
      accountId: req.params?.accountId || null,
      type: req.body?.type || null,
      amount: req.body?.amount || null
    })
  },
  'wallet.payment-methods.read': {
    id: 'wallet.payment-methods.read',
    version: '1.0.0',
    resource: 'wallet.payment-methods',
    action: 'wallet.payment-methods:read',
    description: 'Allow wallet owners to view payout destinations and funding instruments.',
    requirements: [Permissions.WALLET_VIEW],
    tags: ['wallet', 'finance'],
    severity: 'medium',
    metadata: (req) => ({
      accountId: req.params?.accountId || null
    })
  },
  'wallet.payment-methods.manage': {
    id: 'wallet.payment-methods.manage',
    version: '1.0.0',
    resource: 'wallet.payment-methods',
    action: 'wallet.payment-methods:manage',
    description: 'Allow authorised roles to register or update wallet payment methods.',
    requirements: [Permissions.WALLET_METHOD_MANAGE],
    tags: ['wallet', 'finance'],
    severity: 'high',
    metadata: (req) => ({
      accountId: req.params?.accountId || null,
      methodId: req.params?.methodId || null
    })
  },
  'wallet.summary.read': {
    id: 'wallet.summary.read',
    version: '1.0.0',
    resource: 'wallet.summary',
    action: 'wallet.summary:read',
    description: 'Allow wallet owners to retrieve dashboard-ready wallet summaries.',
    requirements: [Permissions.WALLET_VIEW],
    tags: ['wallet', 'finance', 'reporting'],
    severity: 'medium',
    metadata: (req) => ({
      userId: req.query?.userId || req.user?.id || null,
      companyId: req.query?.companyId || null
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
  'panel.provider.ads': {
    id: 'panel.provider.ads',
    version: '1.0.0',
    resource: 'panel.provider.ads',
    action: 'panel.provider:ads:manage',
    description: 'Allow provider administrators to create and manage Gigvora ads campaigns.',
    requirements: [Permissions.CAMPAIGN_MANAGE],
    tags: ['panel', 'provider', 'campaigns'],
    severity: 'high',
    metadata: (req) => ({
      campaignId: req.params?.campaignId || null,
      companyId: req.query?.companyId || req.body?.companyId || null
    })
  'panel.provider.tools.read': {
    id: 'panel.provider.tools.read',
    version: '1.0.0',
    resource: 'panel.provider.tools',
    action: 'panel.provider.tools:view',
    description: 'Allow provider managers to view tool sale management data.',
    requirements: [Permissions.PANEL_PROVIDER_TOOLS],
    tags: ['panel', 'provider', 'inventory'],
    severity: 'medium'
  },
  'panel.provider.tools.manage': {
    id: 'panel.provider.tools.manage',
    version: '1.0.0',
    resource: 'panel.provider.tools',
    action: 'panel.provider.tools:manage',
    description: 'Allow provider managers to create and update tool sale listings and coupons.',
    requirements: [Permissions.PANEL_PROVIDER_TOOLS],
    tags: ['panel', 'provider', 'inventory'],
    severity: 'high',
    metadata: (req) => ({
      method: req.method,
      path: req.path,
      toolSaleProfileId: req.params?.profileId || null,
      couponId: req.params?.couponId || null
    })
  'panel.provider.customJobs.view': {
    id: 'panel.provider.customJobs.view',
    version: '1.0.0',
    resource: 'panel.provider.custom-jobs',
    action: 'panel.provider.custom-jobs:view',
    description: 'Allow providers to view custom job opportunities, bidding history, and communications.',
    requirements: [Permissions.PANEL_PROVIDER],
    tags: ['panel', 'provider', 'custom-jobs'],
    severity: 'medium'
  },
  'panel.provider.customJobs.manage': {
    id: 'panel.provider.customJobs.manage',
    version: '1.0.0',
    resource: 'panel.provider.custom-jobs',
    action: 'panel.provider.custom-jobs:manage',
    description: 'Allow providers to create bespoke jobs, issue invitations, and manage targeted briefs.',
    requirements: [Permissions.PANEL_PROVIDER],
    tags: ['panel', 'provider', 'custom-jobs'],
    severity: 'high'
  },
  'panel.provider.customJobs.bid': {
    id: 'panel.provider.customJobs.bid',
    version: '1.0.0',
    resource: 'panel.provider.custom-jobs',
    action: 'panel.provider.custom-jobs:bid',
    description: 'Allow providers to create, edit, and withdraw bids on custom jobs.',
    requirements: [Permissions.PANEL_PROVIDER],
    tags: ['panel', 'provider', 'custom-jobs'],
    severity: 'high'
  },
  'panel.provider.customJobs.message': {
    id: 'panel.provider.customJobs.message',
    version: '1.0.0',
    resource: 'panel.provider.custom-jobs',
    action: 'panel.provider.custom-jobs:message',
    description: 'Allow providers to communicate within custom job bidding threads.',
    requirements: [Permissions.PANEL_PROVIDER],
    tags: ['panel', 'provider', 'communications'],
    severity: 'medium'
  },
  'panel.provider.customJobs.report': {
    id: 'panel.provider.customJobs.report',
    version: '1.0.0',
    resource: 'panel.provider.custom-jobs',
    action: 'panel.provider.custom-jobs:report',
    description: 'Allow providers to create and manage saved reports for custom job performance.',
    requirements: [Permissions.PANEL_PROVIDER],
    tags: ['panel', 'provider', 'custom-jobs', 'reports'],
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
  'customer.services.manage': {
    id: 'customer.services.manage',
    version: '1.0.0',
    resource: 'customer.services',
    action: 'customer:services:manage',
    description: 'Allow customers to manage their service orders, escrow releases, and disputes.',
    requirements: [Permissions.SERVICES_BOOK, Permissions.SCHEDULE_MANAGE],
    tags: ['services', 'customer', 'escrow'],
    severity: 'medium'
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
