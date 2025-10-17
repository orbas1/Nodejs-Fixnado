import { userNavigation } from './dashboard/navigation/userNavigation.js';
import { providerNavigation } from './dashboard/navigation/providerNavigation.js';
import { servicemanNavigation } from './dashboard/navigation/servicemanNavigation.js';

export const DASHBOARD_ROLES = [
  {
    id: 'user',
    name: 'User Command Center',
    persona: 'Homeowners & Facilities Teams',
    headline: 'Coordinate service orders, equipment rentals, and support in one workspace.',
    registered: true,
    navigation: userNavigation
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
      { id: 'workspace-hub', label: 'Workspace Hub', menuLabel: 'Hub', icon: 'analytics', href: '/dashboards', type: 'route' },
      { id: 'settings', label: 'Platform Settings', icon: 'settings' }
    ]
  },
  {
    id: 'provider',
    name: 'Provider Operations Studio',
    persona: 'Service Provider Leadership Teams',
    headline: 'Monitor revenue, crew utilisation, and asset readiness for every contract.',
    registered: true,
    navigation: providerNavigation
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
      { id: 'workspace-hub', label: 'Workspace Hub', menuLabel: 'Hub', icon: 'analytics', href: '/dashboards', type: 'route' },
      { id: 'reports', label: 'Exports & Reports', icon: 'automation' }
    ]
  },
  {
    id: 'serviceman',
    name: 'Crew Performance Cockpit',
    persona: 'Technician & Crew Operations',
    headline: 'Stay ahead of assignments, travel buffers, and completion quality markers.',
    registered: true,
    navigation: servicemanNavigation
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
      { id: 'vendors', label: 'Vendor Network', icon: 'crew' },
      { id: 'workspace-hub', label: 'Workspace Hub', menuLabel: 'Hub', icon: 'analytics', href: '/dashboards', type: 'route' }
    ]
  }
];
