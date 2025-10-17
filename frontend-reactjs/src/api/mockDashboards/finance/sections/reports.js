export const financeReportsSection = {
  id: 'reports',
  icon: 'automation',
  label: 'Exports & Reports',
  description: 'Deliver finance exports to downstream systems.',
  type: 'list',
  data: {
    items: [
      {
        title: 'Daily payouts ledger',
        description: 'Full ACH and wire detail with reconciliation codes.',
        status: 'Auto-delivers 06:00 UTC'
      },
      {
        title: 'Escrow exposure snapshot',
        description: 'Aggregated escrow and release forecast by region.',
        status: 'Manual download'
      },
      {
        title: 'Dispute recovery summary',
        description: 'Resolved disputes, recovered amounts, and outstanding risk.',
        status: 'Auto-delivers Fridays'
      }
    ]
  }
};

export default financeReportsSection;
