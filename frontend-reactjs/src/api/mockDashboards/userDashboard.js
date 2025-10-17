import { createWindow } from './helpers.js';

const overviewAnalytics = {
  metrics: [
    { label: 'Active jobs', value: '12', change: '+3 this week', trend: 'up' },
    { label: 'Spend processed', value: '£18.4k', change: '+£2.1k vs plan', trend: 'up' },
    { label: 'SLA risk', value: '2', change: '-1 this week', trend: 'down' }
  ],
  charts: [
    {
      id: 'jobs-by-week',
      title: 'Jobs captured per week',
      description: 'Completed and scheduled bookings across all properties.',
      type: 'line',
      dataKey: 'count',
      data: [
        { name: 'Week 1', count: 9 },
        { name: 'Week 2', count: 11 },
        { name: 'Week 3', count: 10 },
        { name: 'Week 4', count: 13 }
      ]
    },
    {
      id: 'spend-vs-escrow',
      title: 'Spend vs escrow balance',
      description: 'Issued invoices compared to escrow releases.',
      type: 'bar',
      dataKey: 'invoices',
      secondaryKey: 'escrow',
      data: [
        { name: 'Week 1', invoices: 4200, escrow: 3100 },
        { name: 'Week 2', invoices: 5100, escrow: 4400 },
        { name: 'Week 3', invoices: 4800, escrow: 4700 },
        { name: 'Week 4', invoices: 5300, escrow: 5200 }
      ]
    }
  ],
  upcoming: [
    { title: 'HVAC quarterly service', when: '18 Mar · 09:00', status: 'Confirmed' },
    { title: 'Escrow release review', when: '20 Mar · 14:00', status: 'Finance' },
    { title: 'Tenant onboarding walkthrough', when: '22 Mar · 11:30', status: 'Concierge follow-up' }
  ],
  insights: [
    'Bundle minor repairs with HVAC visits to trim travel time.',
    'Escrow balances over 5 days auto-escalate to finance.',
    'Confirm concierge surveys for Friday completions before 18:00.'
  ]
};

const calendarData = {
  month: 'March 2025',
  legend: [
    { label: 'Confirmed visit', status: 'confirmed' },
    { label: 'Standby crew', status: 'standby' },
    { label: 'Escalation', status: 'risk' }
  ],
  weeks: [
    [
      { date: '24', isCurrentMonth: false, events: [] },
      { date: '25', isCurrentMonth: false, events: [] },
      { date: '26', isCurrentMonth: false, events: [] },
      { date: '27', isCurrentMonth: false, events: [] },
      { date: '28', isCurrentMonth: false, events: [] },
      { date: '1', isCurrentMonth: true, events: [{ title: 'Depot audit', status: 'standby', time: '08:00' }] },
      { date: '2', isCurrentMonth: true, events: [] }
    ],
    [
      { date: '3', isCurrentMonth: true, events: [{ title: 'Lighting retrofit', status: 'confirmed', time: '09:30' }] },
      { date: '4', isCurrentMonth: true, events: [{ title: 'Pool chemical balance', status: 'confirmed', time: '13:00' }] },
      { date: '5', isCurrentMonth: true, events: [{ title: 'Insurance audit prep', status: 'standby', time: 'All day' }] },
      { date: '6', isCurrentMonth: true, events: [{ title: 'Escalation: boiler repair', status: 'risk', time: 'SLA 4h' }] },
      { date: '7', isCurrentMonth: true, events: [] },
      { date: '8', isCurrentMonth: true, events: [{ title: 'Condo HVAC tune-up', status: 'confirmed', time: '08:45' }] },
      { date: '9', isCurrentMonth: true, events: [] }
    ],
    [
      { date: '10', isCurrentMonth: true, events: [{ title: 'Fleet sanitation', status: 'confirmed', time: '07:30' }] },
      { date: '11', isCurrentMonth: true, events: [{ title: 'Fire safety drill', status: 'standby', time: '15:00' }] },
      { date: '12', isCurrentMonth: true, events: [{ title: 'Escrow review 4821', status: 'risk', time: 'Finance' }] },
      { date: '13', isCurrentMonth: true, events: [{ title: 'Access control upgrade', status: 'confirmed', time: '11:00' }] },
      { date: '14', isCurrentMonth: true, events: [] },
      { date: '15', isCurrentMonth: true, events: [{ title: 'Depot inventory catch-up', status: 'standby', time: '13:30' }] },
      { date: '16', isCurrentMonth: true, events: [] }
    ],
    [
      { date: '17', isCurrentMonth: true, isToday: true, capacity: '2 slots', events: [{ title: 'Escrow audit', status: 'confirmed', time: '09:00' }] },
      { date: '18', isCurrentMonth: true, capacity: '1 slot', events: [{ title: 'HVAC seasonal service', status: 'confirmed', time: '09:00' }] },
      { date: '19', isCurrentMonth: true, capacity: '1 slot', events: [{ title: 'Escrow board review', status: 'risk', time: '14:30' }] },
      { date: '20', isCurrentMonth: true, capacity: '3 slots', events: [{ title: 'Access permit renewal', status: 'standby', time: 'All day' }] },
      { date: '21', isCurrentMonth: true, events: [{ title: 'Community deep clean', status: 'confirmed', time: '07:30' }] },
      { date: '22', isCurrentMonth: true, events: [{ title: 'Crew rest day', status: 'standby', time: 'All day' }] },
      { date: '23', isCurrentMonth: true, events: [] }
    ],
    [
      { date: '24', isCurrentMonth: true, events: [{ title: 'Smart thermostat rollout', status: 'confirmed', time: '10:15' }] },
      { date: '25', isCurrentMonth: true, events: [{ title: 'Tenant onboarding', status: 'standby', time: '16:00' }] },
      { date: '26', isCurrentMonth: true, events: [{ title: 'Post-work inspection', status: 'confirmed', time: '08:30' }] },
      { date: '27', isCurrentMonth: true, events: [] },
      { date: '28', isCurrentMonth: true, events: [{ title: 'Dispute follow-up 1142', status: 'risk', time: '15:00' }] },
      { date: '29', isCurrentMonth: true, events: [] },
      { date: '30', isCurrentMonth: true, events: [{ title: 'Concierge sweep', status: 'standby', time: 'All day' }] }
    ]
  ]
};

const rentalDefaults = {
  defaults: {
    timezone: 'Europe/London',
    currency: 'GBP',
    renterId: 'USR-2488'
  },
  rentals: [
    {
      id: 'RENT-1201',
      rentalNumber: 'RN-1201',
      status: 'in_use',
      depositStatus: 'held',
      quantity: 2,
      renterId: 'USR-2488',
      pickupAt: '2025-03-12T08:30:00Z',
      returnDueAt: '2025-03-19T17:00:00Z',
      depositAmount: 800,
      depositCurrency: 'GBP',
      dailyRate: 160,
      rateCurrency: 'GBP',
      item: { id: 'INV-810', name: 'Dehumidifier kit', sku: 'DH-02', rentalRate: 160, rentalRateCurrency: 'GBP', depositAmount: 400, depositCurrency: 'GBP' },
      timeline: [
        { id: 'pickup', type: 'pickup', description: 'Picked up at logistics hub', recordedBy: 'Logistics', occurredAt: '2025-03-12T08:45:00Z' },
        { id: 'inspection', type: 'inspection', description: 'Pre-flight inspection logged', recordedBy: 'Ops', occurredAt: '2025-03-12T09:05:00Z' }
      ]
    },
    {
      id: 'RENT-1207',
      rentalNumber: 'RN-1207',
      status: 'inspection_pending',
      depositStatus: 'pending',
      quantity: 1,
      renterId: 'USR-2488',
      pickupAt: '2025-03-05T10:00:00Z',
      returnDueAt: '2025-03-16T12:00:00Z',
      depositAmount: 300,
      depositCurrency: 'GBP',
      dailyRate: 95,
      rateCurrency: 'GBP',
      item: { id: 'INV-214', name: 'Thermal camera', sku: 'TC-05', rentalRate: 95, rentalRateCurrency: 'GBP', depositAmount: 300, depositCurrency: 'GBP' },
      timeline: [
        { id: 'pickup', type: 'pickup', description: 'Collected by Avery Stone', recordedBy: 'Ops', occurredAt: '2025-03-05T10:10:00Z' },
        { id: 'return_due', type: 'return_due', description: 'Return booked', recordedBy: 'Automation', occurredAt: '2025-03-16T12:00:00Z' }
      ]
    }
  ],
  inventoryCatalogue: [
    { id: 'INV-810', name: 'Dehumidifier kit', sku: 'DH-02', rentalRate: 160, rentalRateCurrency: 'GBP', depositAmount: 400, depositCurrency: 'GBP' },
    { id: 'INV-214', name: 'Thermal camera', sku: 'TC-05', rentalRate: 95, rentalRateCurrency: 'GBP', depositAmount: 300, depositCurrency: 'GBP' },
    { id: 'INV-552', name: 'Floor scrubber', sku: 'FS-11', rentalRate: 120, rentalRateCurrency: 'GBP', depositAmount: 250, depositCurrency: 'GBP' }
  ],
  escrow: {
    currency: 'GBP',
    totals: {
      pending: 300,
      held: 800,
      released: 1250,
      forfeited: 0,
      partially_released: 120
    }
  }
};

const supportList = {
  items: [
    {
      title: 'Escalations',
      description: '2 urgent disputes need finance sign-off within 12 hours.',
      status: 'Priority',
      href: '/communications?tag=dispute',
      cta: 'Open inbox'
    },
    {
      title: 'Site check-ins',
      description: 'Concierge follow-ups due for 3 completed jobs today.',
      status: 'Due today',
      href: '/communications?tag=concierge'
    },
    {
      title: 'Knowledge base',
      description: 'Latest onboarding articles shared with tenant teams.',
      status: 'Updated 1h ago',
      href: 'https://support.fixnado.com/knowledge'
    }
  ]
};

const walletSnapshot = {
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
      { id: 'TX-901', type: 'payout', amount: -2400, currency: 'GBP', occurredAt: '2025-03-12T11:45:00Z', description: 'Weekly autopayout' },
      { id: 'TX-902', type: 'payment', amount: -850, currency: 'GBP', occurredAt: '2025-03-14T09:15:00Z', description: 'Invoice INV-4821' },
      { id: 'TX-903', type: 'refund', amount: 120, currency: 'GBP', occurredAt: '2025-03-15T15:40:00Z', description: 'Dispute resolution credit' }
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
};

const settingsPanels = {
  panels: [
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Control when Fixnado emails and texts are sent.',
      items: [
        {
          type: 'toggle',
          label: 'Crew arrival alerts',
          helper: 'Send SMS to the facilities lead when a crew starts travel.',
          value: true
        },
        {
          type: 'toggle',
          label: 'Finance digest',
          helper: 'Weekly summary of escrow releases and open disputes.',
          value: true
        },
        {
          type: 'toggle',
          label: 'Tenant survey nudges',
          helper: 'Reminder to share concierge survey links post-visit.',
          value: false
        }
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Connected systems that power this workspace.',
      items: [
        {
          type: 'link',
          label: 'Slack channel: #facilities-alerts',
          helper: 'Crew updates piped to facilities leadership.',
          href: 'https://slack.com'
        },
        {
          type: 'link',
          label: 'Sage Intacct',
          helper: 'Finance exports sync nightly at 02:00.',
          href: '/settings/integrations/sage'
        }
      ]
    }
  ]
};

export const userDashboard = {
  persona: 'user',
  name: 'User Command Center',
  headline: 'Coordinate service orders, rentals, and support without leaving the workspace.',
  window: createWindow(),
  metadata: {
    user: {
      id: 'USR-2488',
      name: 'Avery Stone',
      email: 'avery@fixnado.com',
      company: 'Stone Facilities Co-op'
    },
    totals: {
      bookings: 28,
      activeBookings: 12,
      spend: '£48.6k',
      rentals: 6,
      disputes: 1,
      conversations: 18
    }
  },
  navigation: [
    {
      id: 'overview',
      icon: 'profile',
      label: 'Profile Overview',
      description: 'Bookings, spend, and risk signals across Stone Facilities.',
      type: 'overview',
      analytics: overviewAnalytics
    },
    {
      id: 'calendar',
      icon: 'calendar',
      label: 'Service Calendar',
      description: 'Crew visits, inspections, and concierge follow-ups for the month.',
      type: 'calendar',
      data: calendarData
    },
    {
      id: 'orders',
      icon: 'pipeline',
      label: 'Work Orders',
      description: 'Escrow, delivery, and follow-up pipeline with risk visibility.',
      type: 'board',
      data: {
        columns: [
          {
            title: 'Requests',
            items: [
              { title: 'Retail lighting upgrade', owner: 'Downtown Core', value: '£1.9k', eta: 'Quote due in 4h' },
              { title: 'Office sanitisation', owner: 'Harbour Tower', value: '£1.1k', eta: 'Needs crew assignment' }
            ]
          },
          {
            title: 'Scheduled',
            items: [
              { title: 'Community centre clean', owner: 'Zone B', value: '£1.4k', eta: 'Crew check-in 18 Mar · 07:00' },
              { title: 'Smart thermostat rollout', owner: 'Residential West', value: '£2.9k', eta: 'Kick-off 25 Mar · 10:15' }
            ]
          },
          {
            title: 'At risk',
            items: [
              { title: 'Escrow release #4821', owner: 'Finance', value: '£1.3k', eta: 'Approval overdue' },
              { title: 'Pipe repair follow-up', owner: 'Ops escalation', value: '£820', eta: 'SLA breach in 6h' }
            ]
          },
          {
            title: 'Completed',
            items: [
              { title: 'Emergency plumbing', owner: 'Civic Centre', value: '£640', eta: 'Inspection passed' },
              { title: 'Solar panel clean', owner: 'City Schools', value: '£1.1k', eta: 'Feedback due 22 Mar' }
            ]
          }
        ]
      }
    },
    {
      id: 'rentals',
      icon: 'assets',
      label: 'Rental Desk',
      description: 'Active rentals, deposits, and available inventory.',
      type: 'rentals',
      data: rentalDefaults
    },
    {
      id: 'support',
      icon: 'support',
      label: 'Support Desk',
      description: 'Escalations and concierge follow-ups ready for action.',
      type: 'list',
      data: supportList
    },
    {
      id: 'wallet',
      icon: 'finance',
      label: 'Wallet & Payments',
      description: 'Balances, autopayout, and recent transactions.',
      type: 'wallet',
      data: walletSnapshot
    },
    {
      id: 'settings',
      icon: 'settings',
      label: 'Account Settings',
      description: 'Notifications, integrations, and workspace automation.',
      type: 'settings',
      data: settingsPanels
    }
  ]
};

export default userDashboard;
