export const adminOverviewSection = {
  id: 'overview',
  icon: 'profile',
  label: 'Profile Overview',
  description: 'Network-wide bookings, SLA health, and platform status.',
  type: 'overview',
  analytics: {
    metrics: [
      { label: 'Active tenants', value: '128', change: '+6 vs last month', trend: 'up' },
      { label: 'SLA compliance', value: '95%', change: '+1.2 pts vs target', trend: 'up' },
      { label: 'Escalations', value: '9', change: '-3 vs last week', trend: 'down' },
      { label: 'Asset uptime', value: '98.4%', change: '+0.4 pts vs target', trend: 'up' }
    ],
    charts: [
      {
        id: 'tenant-growth',
        title: 'Tenant growth by month',
        description: 'New and retained tenants across the network.',
        type: 'line',
        dataKey: 'tenants',
        data: [
          { name: 'Dec', tenants: 112 },
          { name: 'Jan', tenants: 118 },
          { name: 'Feb', tenants: 122 },
          { name: 'Mar', tenants: 128 }
        ]
      },
      {
        id: 'sla-health',
        title: 'SLA performance',
        description: 'Share of tenants hitting response SLAs.',
        type: 'area',
        dataKey: 'sla',
        data: [
          { name: 'Week 1', sla: 91 },
          { name: 'Week 2', sla: 93 },
          { name: 'Week 3', sla: 94 },
          { name: 'Week 4', sla: 95 }
        ]
      },
      {
        id: 'asset-uptime',
        title: 'Asset uptime by zone',
        description: 'Availability percentage across active zones.',
        type: 'bar',
        dataKey: 'uptime',
        data: [
          { name: 'Zone A', uptime: 98.1 },
          { name: 'Zone B', uptime: 97.4 },
          { name: 'Zone C', uptime: 99.0 },
          { name: 'Zone D', uptime: 98.6 }
        ]
      }
    ],
    upcoming: [
      { title: 'Tenant onboarding sprint', when: '18 Mar · 09:30', status: 'Ops + Product' },
      { title: 'Platform status review', when: '19 Mar · 15:00', status: 'Engineering update' },
      { title: 'Executive incident drill', when: '21 Mar · 08:45', status: 'Security operations' }
    ],
    insights: [
      'Platform automation saved 64 analyst hours last week.',
      'Zones C & D nearing vehicle capacity thresholds — consider rebalancing.',
      'Two tenants approaching SLA escalation window — concierge notified.',
      'Risk queue reduced by 28% after new verification workflow.'
    ]
  }
};

export default adminOverviewSection;
