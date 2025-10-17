export const userWalletSection = {
  id: 'wallet',
  icon: 'finance',
  label: 'Wallet & Payments',
  menuLabel: 'Wallet',
  description: 'Balances, autopayout, and recent transactions.',
  type: 'wallet',
  data: {
    account: {
      id: 'WAL-204',
      alias: 'Stone Facilities Wallet',
      currency: 'GBP',
      autopayoutEnabled: true,
      autopayoutThreshold: 2500,
      autopayoutMethodId: 'PM-001',
      spendingLimit: 10000
    },
    summary: {
      available: 6420,
      pending: 1840,
      held: 1200,
      currency: 'GBP',
      recentTransactions: [
        {
          id: 'TX-901',
          type: 'payout',
          amount: -2400,
          currency: 'GBP',
          occurredAt: '2025-03-12T11:45:00Z',
          description: 'Weekly autopayout'
        },
        {
          id: 'TX-902',
          type: 'payment',
          amount: -850,
          currency: 'GBP',
          occurredAt: '2025-03-14T09:15:00Z',
          description: 'Invoice INV-4821'
        },
        {
          id: 'TX-903',
          type: 'refund',
          amount: 120,
          currency: 'GBP',
          occurredAt: '2025-03-15T15:40:00Z',
          description: 'Dispute resolution credit'
        }
      ]
    },
    methods: [
      {
        id: 'PM-001',
        type: 'bank_account',
        label: 'Barclays Business · 4821',
        last4: '4821',
        brand: 'barclays',
        status: 'verified',
        createdAt: '2024-11-04T09:00:00Z'
      }
    ],
    autopayout: {
      enabled: true,
      threshold: 2500,
      cadence: 'weekly',
      method: { id: 'PM-001', label: 'Barclays Business · 4821' }
    },
    transactions: {
      total: 3
    },
    policy: {
      canManage: true,
      canTransact: true,
      canEditMethods: true
    }
  }
};

export default userWalletSection;
