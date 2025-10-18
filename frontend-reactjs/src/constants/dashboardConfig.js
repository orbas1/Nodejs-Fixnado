import { userNavigation } from './dashboard/navigation/userNavigation.js';
import { providerNavigation } from './dashboard/navigation/providerNavigation.js';
import { servicemanNavigation } from './dashboard/navigation/servicemanNavigation.js';
import { adminNavigation } from './dashboard/navigation/adminNavigation.js';
import { financeNavigation } from './dashboard/navigation/financeNavigation.js';
import { enterpriseNavigation } from './dashboard/navigation/enterpriseNavigation.js';

export const DASHBOARD_ROLES = [
  {
    id: 'user',
    name: 'Home Hub',
    shortName: 'Home',
    persona: 'Home Teams',
    headline: 'Orders • Schedule • Support',
    registered: true,
    navigation: userNavigation
  },
  {
    id: 'admin',
    name: 'Admin Desk',
    shortName: 'Admin',
    persona: 'Ops Leads',
    headline: 'Compliance • SLAs • Alerts',
    registered: true,
    navigation: adminNavigation
  },
  {
    id: 'provider',
    name: 'Provider Hub',
    shortName: 'Provider',
    persona: 'Service Leads',
    headline: 'Revenue • Crews • Assets',
    registered: true,
    navigation: providerNavigation
  },
  {
    id: 'finance',
    name: 'Finance Hub',
    shortName: 'Finance',
    persona: 'Revenue Ops',
    headline: 'Intake • Escrow • Payouts',
    registered: true,
    navigation: financeNavigation
  },
  {
    id: 'serviceman',
    name: 'Crew Hub',
    shortName: 'Crew',
    persona: 'Field Teams',
    headline: 'Jobs • Routes • Score',
    registered: true,
    navigation: servicemanNavigation
  },
  {
    id: 'enterprise',
    name: 'Enterprise Hub',
    shortName: 'Enterprise',
    persona: 'Enterprise Ops',
    headline: 'Spend • Pacing • Risk',
    registered: true,
    navigation: enterpriseNavigation
  }
];
