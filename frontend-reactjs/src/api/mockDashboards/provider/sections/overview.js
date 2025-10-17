export const providerOverviewSection = {
  id: 'overview',
  icon: 'profile',
  label: 'Profile Overview',
  menuLabel: 'Home',
  description: 'Revenue, utilisation, and customer quality metrics.',
  type: 'overview',
  analytics: {
    metrics: [
      { label: 'First response', value: '12 mins', change: '-3 mins vs prior window', trend: 'down' },
      { label: 'Crew utilisation', value: '78%', change: '+5 pts vs prior window', trend: 'up' },
      { label: 'Revenue processed', value: '£312k', change: '+£24k vs forecast', trend: 'up' },
      { label: 'Satisfaction', value: '4.6★', change: '+0.1 vs prior window', trend: 'up' }
    ],
    charts: [
      {
        id: 'response-trend',
        title: 'Response Time Trend',
        description: 'Median minutes to acknowledge new jobs.',
        type: 'area',
        dataKey: 'response',
        data: [
          { name: 'Week 1', response: 15 },
          { name: 'Week 2', response: 14 },
          { name: 'Week 3', response: 13 },
          { name: 'Week 4', response: 12 }
        ]
      },
      {
        id: 'revenue-pipeline',
        title: 'Revenue vs Outstanding',
        description: 'Recognised revenue compared with open invoices.',
        type: 'bar',
        dataKey: 'recognised',
        secondaryKey: 'outstanding',
        data: [
          { name: 'Week 1', recognised: 68000, outstanding: 12000 },
          { name: 'Week 2', recognised: 72000, outstanding: 11000 },
          { name: 'Week 3', recognised: 78000, outstanding: 10000 },
          { name: 'Week 4', recognised: 74000, outstanding: 9000 }
        ]
      },
      {
        id: 'crew-health',
        title: 'Crew Health Index',
        description: 'Readiness, overtime, and relief per crew.',
        type: 'line',
        dataKey: 'index',
        data: [
          { name: 'Crew Alpha', index: 82 },
          { name: 'Crew Beta', index: 74 },
          { name: 'Crew Gamma', index: 80 },
          { name: 'Crew Delta', index: 76 }
        ]
      }
    ],
    upcoming: [
      { title: 'Premium mall HVAC upgrade', when: '20 Mar · 07:30', status: 'Crew Alpha assigned' },
      { title: 'Quarterly board review', when: '21 Mar · 16:00', status: 'Finance pack in progress' },
      { title: 'Fleet vehicle inspection', when: '22 Mar · 10:00', status: 'Logistics preparing' }
    ],
    insights: [
      'Ops pods with utilisation below 70% should share crew members mid-week.',
      'Outstanding invoices fall under finance SLA — follow up before Friday.',
      'Customer satisfaction is trending upward after new completion surveys.',
      'Automation rules are saving 6.4 hours per week across concierge tasks.'
    ]
  }
};

export default providerOverviewSection;
