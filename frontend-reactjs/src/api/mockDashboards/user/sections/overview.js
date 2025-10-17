export const userOverviewSection = {
  id: 'overview',
  icon: 'profile',
  label: 'Profile Overview',
  menuLabel: 'Home',
  description: 'Bookings, spend, and risk signals across Stone Facilities.',
  type: 'overview',
  analytics: {
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
  }
};

export default userOverviewSection;
