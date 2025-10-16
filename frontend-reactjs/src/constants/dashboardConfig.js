export const DASHBOARD_ROLES = [
  {
    id: 'user',
    name: 'User Command Center',
    persona: 'Homeowners & Facilities Teams',
    headline: 'Coordinate service orders, equipment rentals, and support in one workspace.',
    registered: true,
    navigation: [
      { id: 'overview', label: 'Profile Overview', icon: 'profile' },
      { id: 'calendar', label: 'Service Calendar', icon: 'calendar' },
      { id: 'orders', label: 'Work Orders', icon: 'pipeline' },
      { id: 'availability', label: 'Availability Planner', icon: 'availability' },
      { id: 'rentals', label: 'Asset Management', icon: 'assets' },
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
      { id: 'overview', label: 'Profile Overview', icon: 'profile' },
      { id: 'calendar', label: 'Network Calendar', icon: 'calendar' },
      { id: 'operations', label: 'Operations Pipeline', icon: 'pipeline' },
      { id: 'availability', label: 'Serviceman Management', icon: 'crew' },
      { id: 'assets', label: 'Asset & Rental Control', icon: 'assets' },
      { id: 'purchases', label: 'Purchase Management', icon: 'documents', href: '/admin/purchases' },
      { id: 'zones', label: 'Zone Design Studio', icon: 'map' },
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
      { id: 'calendar', label: 'Operations Calendar', icon: 'calendar' },
      { id: 'crew-availability', label: 'Crew Availability', icon: 'availability' },
      { id: 'workboard', label: 'Service Pipeline', icon: 'pipeline' },
      { id: 'rentals', label: 'Asset Lifecycle', icon: 'assets' },
      { id: 'servicemen', label: 'Serviceman Directory', icon: 'crew' },
      { id: 'finance', label: 'Revenue & Billing', icon: 'finance' },
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
      { id: 'calendar', label: 'Crew Calendar', icon: 'calendar' },
      { id: 'availability', label: 'Shift Availability', icon: 'availability' },
      { id: 'schedule', label: 'Job Pipeline', icon: 'pipeline' },
      { id: 'toolkit', label: 'Asset Kit', icon: 'assets' },
      { id: 'training', label: 'Training & Compliance', icon: 'compliance' }
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
