export const DASHBOARD_ROLES = [
  {
    id: 'user',
    name: 'User Command Center',
    persona: 'Homeowners & Facilities Teams',
    headline: 'Coordinate service orders, equipment rentals, and support in one workspace.',
    registered: true,
    navigation: [
      { id: 'overview', label: 'Control Centre Overview', icon: 'profile' },
      { id: 'customer-control', label: 'Customer Control Centre', icon: 'control' },
      { id: 'calendar', label: 'Service Calendar', icon: 'calendar' },
      { id: 'orders', label: 'Service Orders', icon: 'pipeline' },
      { id: 'orders', label: 'Work Orders', icon: 'pipeline' },
      { id: 'services-management', label: 'Services Management', icon: 'automation' },
      { id: 'history', label: 'Order History', icon: 'documents' },
      { id: 'availability', label: 'Availability Planner', icon: 'availability' },
      { id: 'rentals', label: 'Hire & Rental Management', icon: 'assets' },
      { id: 'rentals', label: 'Asset Management', icon: 'assets' },
      { id: 'support', label: 'Support & Communications', icon: 'support', href: '/communications' },
      { id: 'wallet', label: 'Wallet & Payments', icon: 'finance' },
      { id: 'support', label: 'Support & Communications', icon: 'support' },
      { id: 'settings', label: 'Account Settings', icon: 'settings' }
    ]
  },
  {
    id: 'admin',
    name: 'Admin Control Tower',
    persona: 'Operations & Compliance Leaders',
    headline: 'Command multi-tenant operations, compliance, and SLA performance in real time.',
    registered: true,
    navigation: [
      { id: 'admin-profile', label: 'Admin profile centre', icon: 'profile' },
      { id: 'overview', label: 'Profile & preferences', icon: 'profile' },
      { id: 'calendar', label: 'Network Calendar', icon: 'calendar' },
      { id: 'operations', label: 'Operations Pipeline', icon: 'pipeline' },
      { id: 'inbox', label: 'Unified Inbox', icon: 'support' },
      { id: 'availability', label: 'Serviceman Management', icon: 'crew' },
      { id: 'assets', label: 'Asset & Rental Control', icon: 'assets' },
      {
        id: 'admin-rentals-link',
        label: 'Rental management',
        description: 'Open the dedicated rental operations workspace.',
        icon: 'assets',
        type: 'route',
        href: '/admin/rentals'
      },
      { id: 'purchases', label: 'Purchase Management', icon: 'documents', href: '/admin/purchases' },
      {
        id: 'zones',
        label: 'Zone Design Studio',
        icon: 'map',
        description: 'Launch the full zone governance workspace.',
        href: '/admin/zones'
      },
      { id: 'assets', label: 'Hire & Rental Control', icon: 'assets' },
      { id: 'zones', label: 'Zone Design Studio', icon: 'map' },
      { id: 'user-management', label: 'User management', icon: 'users' },
      { id: 'home-builder', label: 'Home Page Builder', icon: 'builder', href: '/admin/home-builder' },
      { id: 'live-feed-auditing', label: 'Live Feed Auditing', icon: 'analytics' },
      { id: 'settings', label: 'Platform Settings', icon: 'settings' }
    ]
  },
  {
    id: 'provider',
    name: 'Provider Operations Studio',
    persona: 'Service Provider Leadership Teams',
    headline: 'Monitor revenue, crew utilisation, and asset readiness for every contract.',
    registered: true,
    navigation: [
      { id: 'overview', label: 'Profile Overview', icon: 'profile' },
      {
        id: 'profile-settings',
        label: 'Provider profile',
        icon: 'settings',
        description: 'Edit identity, branding, support hours, and coverage.',
        href: '/dashboards/provider/profile'
      },
      { id: 'calendar', label: 'Operations Calendar', icon: 'calendar' },
      { id: 'crew-availability', label: 'Crew Availability', icon: 'availability' },
      {
        id: 'crew-control-centre',
        label: 'Crew Control Centre',
        description: 'Manage deployments, rota coverage, and delegations.',
        icon: 'crew',
        type: 'route',
        href: '/dashboards/provider/crew-control'
      },
      { id: 'workboard', label: 'Service Pipeline', icon: 'pipeline' },
      {
        id: 'custom-jobs',
        label: 'Custom Jobs',
        icon: 'documents',
        type: 'route',
        href: '/provider/custom-jobs'
      },
      { id: 'rentals', label: 'Hire & Rental Management', icon: 'assets' },
      { id: 'servicemen', label: 'Serviceman Directory', icon: 'crew' },
      {
        id: 'inventory-management',
        label: 'Inventory Management',
        icon: 'assets',
        type: 'route',
        href: '/provider/inventory'
      },
      {
        id: 'services-control',
        label: 'Services Control Centre',
        description: 'Manage service creation, availability, media, and SEO from one workspace.',
        icon: 'automation',
        type: 'route',
        href: '/provider/services'
      },
      { id: 'escrow-management', label: 'Escrow Management', icon: 'finance' },
      {
        id: 'serviceman-payments',
        label: 'Crew Payments & Commissions',
        icon: 'finance'
      },
      {
        id: 'onboarding-management',
        label: 'Onboarding Management',
        icon: 'documents',
        type: 'route',
        href: '/dashboards/provider/onboarding'
      },
      {
        id: 'storefront-control',
        label: 'Storefront Control Centre',
        description: 'Manage storefront branding, catalogue, and incentives.',
        icon: 'storefront',
        type: 'route',
        href: '/dashboards/provider/storefront'
      },
      { id: 'finance', label: 'Revenue & Billing', icon: 'finance' },
      { id: 'byok-management', label: 'Key Management', icon: 'byok' },
      { id: 'documents', label: 'Document Management', icon: 'documents' },
      { id: 'settings', label: 'Automation Settings', icon: 'automation' }
    ]
  },
  {
    id: 'finance',
    name: 'Finance Control Center',
    persona: 'Finance & Revenue Operations',
    headline: 'Track captured revenue, escrow status, payout readiness, and disputes in one control tower.',
    registered: true,
    navigation: [
      { id: 'overview', label: 'Revenue Overview', icon: 'finance' },
      { id: 'escrows', label: 'Escrow Pipeline', icon: 'pipeline' },
      { id: 'payouts', label: 'Payout Approvals', icon: 'assets' },
      { id: 'disputes', label: 'Dispute Resolution', icon: 'compliance' },
      { id: 'reports', label: 'Exports & Reports', icon: 'automation' }
    ]
  },
  {
    id: 'serviceman',
    name: 'Crew Performance Cockpit',
    persona: 'Technician & Crew Operations',
    headline: 'Stay ahead of assignments, travel buffers, and completion quality markers.',
    registered: true,
    navigation: [
      { id: 'overview', label: 'Profile Overview', icon: 'profile' },
      { id: 'metrics', label: 'Metrics', icon: 'analytics' },
      { id: 'escrows', label: 'Escrow Management', icon: 'finance' },
      { id: 'calendar', label: 'Crew Calendar', icon: 'calendar' },
      { id: 'availability', label: 'Shift Availability', icon: 'availability' },
      { id: 'schedule', label: 'Job Pipeline', icon: 'pipeline' },
      { id: 'custom-jobs', label: 'Custom Jobs & Bids', icon: 'pipeline' },
      { id: 'wallet', label: 'Wallet & Earnings', icon: 'finance' },
      { id: 'inbox', label: 'Crew Inbox', icon: 'support' },
      { id: 'toolkit', label: 'Asset Kit', icon: 'assets' },
      { id: 'training', label: 'Training & Compliance', icon: 'compliance' },
      { id: 'id-verification', label: 'ID Verification', icon: 'compliance' },
      { id: 'financial-management', label: 'Financial management', icon: 'finance' },
      { id: 'website-preferences', label: 'Website Preferences', icon: 'builder' },
      { id: 'profile-settings', label: 'Profile Settings', icon: 'settings' },
      { id: 'serviceman-disputes', label: 'Dispute Management', icon: 'compliance' },
      { id: 'fixnado-ads', label: 'Fixnado Ads', icon: 'analytics' },
      { id: 'training', label: 'Training & Compliance', icon: 'compliance' },
      {
        id: 'byok-management',
        label: 'BYOK management',
        icon: 'compliance',
        href: '/dashboards/serviceman/byok'
      }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Performance Suite',
    persona: 'Multi-site Operators & Enterprise Clients',
    headline: 'Track spend, campaign pacing, and risk signals across every facility.',
    registered: true,
    navigation: [
      { id: 'overview', label: 'Profile Overview', icon: 'profile' },
      { id: 'calendar', label: 'Portfolio Calendar', icon: 'calendar' },
      { id: 'portfolio', label: 'Program Portfolio', icon: 'enterprise' },
      { id: 'campaigns', label: 'Campaign Delivery', icon: 'pipeline' },
      { id: 'finance', label: 'Financial Controls', icon: 'finance' },
      { id: 'compliance', label: 'Compliance & Risk', icon: 'compliance' },
      { id: 'vendors', label: 'Vendor Network', icon: 'crew' }
    ]
  }
];
