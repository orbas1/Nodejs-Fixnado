export const enterpriseOverviewSection = {
  id: 'overview',
  icon: 'profile',
  label: 'Profile Overview',
  menuLabel: 'Home',
  description: 'Enterprise-level spend, automation savings, and risk.',
  type: 'overview',
  analytics: {
    metrics: [
      { label: 'Facilities live', value: '112', change: '+6 vs Q4', trend: 'up' },
      { label: 'Automation savings', value: '£420k', change: '+£35k vs plan', trend: 'up' },
      { label: 'SLA hit rate', value: '96%', change: '+1.8 pts vs target', trend: 'up' },
      { label: 'Risk signals', value: '7', change: '+2 vs last week', trend: 'up' }
    ],
    charts: [
      {
        id: 'spend-by-region',
        title: 'Spend by Region',
        description: 'Month-to-date spend split by major metro cluster.',
        type: 'bar',
        dataKey: 'spend',
        data: [
          { name: 'North', spend: 82000 },
          { name: 'West', spend: 64000 },
          { name: 'South', spend: 54000 },
          { name: 'Central', spend: 91000 }
        ]
      },
      {
        id: 'automation-savings',
        title: 'Automation Savings Trend',
        description: 'Monthly labour hours saved by orchestration.',
        type: 'area',
        dataKey: 'hours',
        data: [
          { name: 'Nov', hours: 420 },
          { name: 'Dec', hours: 460 },
          { name: 'Jan', hours: 510 },
          { name: 'Feb', hours: 560 }
        ]
      },
      {
        id: 'risk-heatmap',
        title: 'Risk Heatmap',
        description: 'Open escalations segmented by severity.',
        type: 'line',
        dataKey: 'count',
        data: [
          { name: 'Critical', count: 3 },
          { name: 'High', count: 2 },
          { name: 'Medium', count: 5 },
          { name: 'Low', count: 8 }
        ]
      }
    ],
    upcoming: [
      { title: 'Portfolio strategy review', when: '19 Mar · 11:00', status: 'Executive steering' },
      { title: 'Automation roadmap sprint', when: '21 Mar · 09:00', status: 'Ops & product' },
      { title: 'Q2 vendor summit', when: '25 Mar · 15:30', status: 'Invites out' }
    ],
    insights: [
      'Deployment of robotics cleaning saved 122 labour hours this week.',
      'Legal recommends refreshing compliance docs in two healthcare facilities.',
      'Automation queue shows 4 low-complexity opportunities ready for rollout.',
      'Marketing wants to align campaigns with sustainability KPI improvements.'
    ]
  }
};

export default enterpriseOverviewSection;
