export const DASHBOARD_ROLES = [
  {
    id: 'user',
    name: 'User Command Center',
    persona: 'Homeowners & Facilities Teams',
    headline: 'Coordinate service orders, equipment rentals, and support in one workspace.',
    registered: true,
    navigation: [
      { id: 'overview', label: 'Customer Overview' },
      { id: 'orders', label: 'Service Orders' },
      { id: 'rentals', label: 'Rental Assets' },
      { id: 'account', label: 'Account & Support' }
    ]
  },
  {
    id: 'admin',
    name: 'Admin Control Tower',
    persona: 'Operations & Compliance Leaders',
    headline: 'Command multi-tenant operations, compliance, and SLA performance in real time.',
    registered: true,
    navigation: [
      { id: 'overview', label: 'Executive Overview' },
      { id: 'operations', label: 'Operations Pipeline' },
      { id: 'compliance', label: 'Compliance & Risk' },
      { id: 'assets', label: 'Assets & Rentals' }
    ]
  },
  {
    id: 'provider',
    name: 'Provider Operations Studio',
    persona: 'Service Provider Leadership Teams',
    headline: 'Monitor revenue, crew utilisation, and asset readiness for every contract.',
    registered: true,
    navigation: [
      { id: 'overview', label: 'Provider Overview' },
      { id: 'workboard', label: 'Workboard' },
      { id: 'rentals', label: 'Rental Lifecycle' },
      { id: 'asset-alerts', label: 'Asset Alerts' }
    ]
  },
  {
    id: 'serviceman',
    name: 'Crew Performance Cockpit',
    persona: 'Technician & Crew Operations',
    headline: 'Stay ahead of assignments, travel buffers, and completion quality markers.',
    registered: true,
    navigation: [
      { id: 'overview', label: 'Crew Overview' },
      { id: 'schedule', label: 'Schedule Board' }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Performance Suite',
    persona: 'Multi-site Operators & Enterprise Clients',
    headline: 'Track spend, campaign pacing, and risk signals across every facility.',
    registered: true,
    navigation: [
      { id: 'overview', label: 'Enterprise Overview' },
      { id: 'compliance', label: 'Compliance Library' }
    ]
  }
];
