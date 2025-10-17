export const servicemanOverviewSection = {
  id: 'overview',
  icon: 'profile',
  label: 'Profile Overview',
  menuLabel: 'Home',
  description: 'Assignments, travel, and quality trends for Jordan’s crew.',
  type: 'overview',
  analytics: {
    metrics: [
      { label: 'Active assignments', value: '12', change: '+2 vs prior window', trend: 'up' },
      { label: 'On-time arrivals', value: '92%', change: '+4 pts vs target', trend: 'up' },
      { label: 'Completion quality', value: '4.8★', change: '+0.2 vs prior window', trend: 'up' },
      { label: 'Travel time', value: '26m', change: '-3m avg travel', trend: 'down' }
    ],
    charts: [
      {
        id: 'jobs-completed',
        title: 'Jobs Completed per Day',
        description: 'Dispatch throughput for the crew.',
        type: 'line',
        dataKey: 'jobs',
        data: [
          { name: 'Mon', jobs: 5 },
          { name: 'Tue', jobs: 6 },
          { name: 'Wed', jobs: 4 },
          { name: 'Thu', jobs: 5 },
          { name: 'Fri', jobs: 6 }
        ]
      },
      {
        id: 'travel-time',
        title: 'Travel vs On-Site Time',
        description: 'Minutes spent commuting compared to time on job.',
        type: 'area',
        dataKey: 'travel',
        secondaryKey: 'onSite',
        data: [
          { name: 'Week 1', travel: 140, onSite: 420 },
          { name: 'Week 2', travel: 130, onSite: 460 },
          { name: 'Week 3', travel: 120, onSite: 480 },
          { name: 'Week 4', travel: 118, onSite: 510 }
        ]
      },
      {
        id: 'qa-scores',
        title: 'QA Inspection Scores',
        description: 'Latest field quality audits by property type.',
        type: 'bar',
        dataKey: 'score',
        data: [
          { name: 'Healthcare', score: 4.9 },
          { name: 'Hospitality', score: 4.6 },
          { name: 'Retail', score: 4.5 },
          { name: 'Public sector', score: 4.7 }
        ]
      }
    ],
    upcoming: [
      { title: 'High-rise elevator reset', when: '18 Mar · 08:30', status: 'Dispatch from depot' },
      { title: 'Hospital sterilisation', when: '18 Mar · 13:15', status: 'Crew brief 1h prior' },
      { title: 'University access control', when: '19 Mar · 09:00', status: 'Prep QA checklist' },
      { title: 'Weekly debrief', when: '19 Mar · 17:30', status: 'Ops manager sync' }
    ],
    insights: [
      'Combine two downtown tickets to reclaim 18 minutes of travel.',
      'Schedule calibration kit swap before Friday to avoid delays.',
      'Average CSAT improved 0.2 points after new completion checklist.',
      'Confirm spare PPE stock before next hospital rotation.'
    ]
  }
};

export default servicemanOverviewSection;
