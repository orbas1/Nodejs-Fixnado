import { userNavigation } from './dashboard/navigation/userNavigation.js';
import { providerNavigation } from './dashboard/navigation/providerNavigation.js';
import { servicemanNavigation } from './dashboard/navigation/servicemanNavigation.js';
import { adminNavigation } from './dashboard/navigation/adminNavigation.js';
import { financeNavigation } from './dashboard/navigation/financeNavigation.js';
import { enterpriseNavigation } from './dashboard/navigation/enterpriseNavigation.js';

export const DASHBOARD_ROLES = [
  {
    id: 'user',
    name: 'User Command Center',
    shortLabel: 'User',
    persona: 'Homeowners & Facilities Teams',
    headline: 'Coordinate service orders, equipment rentals, and support in one workspace.',
    registered: true,
    navigation: userNavigation
  },
  {
    id: 'admin',
    name: 'Admin Control Tower',
    shortLabel: 'Admin',
    persona: 'Operations & Compliance Leaders',
    headline: 'Command multi-tenant operations, compliance, and SLA performance in real time.',
    registered: true,
    navigation: adminNavigation
  },
  {
    id: 'provider',
    name: 'Provider Operations Studio',
    shortLabel: 'Provider',
    persona: 'Service Provider Leadership Teams',
    headline: 'Monitor revenue, crew utilisation, and asset readiness for every contract.',
    registered: true,
    navigation: providerNavigation
  },
  {
    id: 'finance',
    name: 'Finance Control Center',
    shortLabel: 'Finance',
    persona: 'Finance & Revenue Operations',
    headline: 'Track captured revenue, escrow status, payout readiness, and disputes in one control tower.',
    registered: true,
    navigation: financeNavigation
  },
  {
    id: 'serviceman',
    name: 'Crew Performance Cockpit',
    shortLabel: 'Crew',
    persona: 'Technician & Crew Operations',
    headline: 'Stay ahead of assignments, travel buffers, and completion quality markers.',
    registered: true,
    navigation: servicemanNavigation
  },
  {
    id: 'enterprise',
    name: 'Enterprise Performance Suite',
    shortLabel: 'Enterprise',
    persona: 'Multi-site Operators & Enterprise Clients',
    headline: 'Track spend, campaign pacing, and risk signals across every facility.',
    registered: true,
    navigation: enterpriseNavigation
  }
];
