import { createWindow } from './helpers.js';
import { financeDashboardMetadata } from './finance/metadata.js';
import { financeOverviewSection } from './finance/sections/overview.js';
import { financeEscrowsSection } from './finance/sections/escrows.js';
import { financePayoutsSection } from './finance/sections/payouts.js';
import { financeDisputesSection } from './finance/sections/disputes.js';
import { financeReportsSection } from './finance/sections/reports.js';

export const financeDashboard = {
  persona: 'finance',
  name: 'Finance Control Center',
  headline: 'Track captured revenue, escrow status, payout readiness, and disputes in one control tower.',
  window: createWindow(),
  metadata: financeDashboardMetadata,
  navigation: [
    financeOverviewSection,
    financeEscrowsSection,
    financePayoutsSection,
    financeDisputesSection,
    financeReportsSection
  ]
};

export default financeDashboard;
