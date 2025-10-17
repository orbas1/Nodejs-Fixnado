export const financeNavigation = [
  {
    id: 'overview',
    label: 'Revenue Overview',
    menuLabel: 'Home',
    icon: 'finance'
  },
  {
    id: 'escrows',
    label: 'Escrow Pipeline',
    menuLabel: 'Escrows',
    icon: 'pipeline'
  },
  {
    id: 'payouts',
    label: 'Payout Approvals',
    menuLabel: 'Payouts',
    icon: 'assets'
  },
  {
    id: 'disputes',
    label: 'Dispute Resolution',
    menuLabel: 'Disputes',
    icon: 'compliance'
  },
  {
    id: 'reports',
    label: 'Reports & Exports',
    menuLabel: 'Reports',
    icon: 'automation'
  },
  {
    id: 'workspace-hub',
    label: 'Workspace Hub',
    menuLabel: 'Hub',
    icon: 'analytics',
    href: '/dashboards',
    type: 'route'
  }
];

export default financeNavigation;
