export const financeOverviewSection = {
  id: 'overview',
  icon: 'finance',
  label: 'Revenue Overview',
  description: 'Monitor captured revenue, escrow exposure, and payout readiness.',
  type: 'overview',
  analytics: {
    metrics: [
      { label: 'Gross captured', value: '£1.42m', change: '+8.4% vs Feb', trend: 'up' },
      { label: 'Net captured', value: '£1.28m', change: '+£64k vs forecast', trend: 'up' },
      { label: 'Escrow balance', value: '£210k', change: '-£32k vs last week', trend: 'down' },
      { label: 'Open disputes', value: '6', change: '-2 vs last month', trend: 'down' }
    ],
    charts: [
      {
        id: 'captured-trend',
        title: 'Captured revenue',
        description: 'Daily captured volume in the current month.',
        type: 'area',
        dataKey: 'captured',
        data: [
          { name: 'Week 1', captured: 240000 },
          { name: 'Week 2', captured: 312000 },
          { name: 'Week 3', captured: 365000 },
          { name: 'Week 4', captured: 403000 }
        ]
      },
      {
        id: 'escrow-aging',
        title: 'Escrow ageing buckets',
        description: 'Value held in escrow per settlement window.',
        type: 'bar',
        dataKey: 'value',
        data: [
          { name: '0-7d', value: 126000 },
          { name: '8-14d', value: 54000 },
          { name: '15-21d', value: 21000 },
          { name: '22d+', value: 9000 }
        ]
      },
      {
        id: 'payout-cadence',
        title: 'Payout cadence',
        description: 'Average time to release funds by provider cohort.',
        type: 'line',
        dataKey: 'days',
        data: [
          { name: 'Top tier', days: 1.4 },
          { name: 'Standard', days: 1.9 },
          { name: 'New', days: 2.6 },
          { name: 'Watchlist', days: 3.2 }
        ]
      }
    ],
    upcoming: [
      { title: 'Q1 close checkpoint', when: '18 Mar · 10:00', status: 'Finance + Ops' },
      { title: 'HMRC VAT submission', when: '21 Mar · 15:00', status: 'Compliance' },
      { title: 'Treasury liquidity sync', when: '25 Mar · 09:30', status: 'Treasury' }
    ],
    insights: [
      'Automation cleared 182 payouts overnight with zero manual touchpoints.',
      'Three providers exceeded credit thresholds; treasury hold applied until docs received.',
      'Chargeback guardrails prevented £7.8k potential loss across card rails this week.'
    ]
  }
};

export default financeOverviewSection;
