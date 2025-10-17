export const servicemanDashboardMetadata = {
  crewMember: {
    id: 'SRV-2210',
    name: 'Jordan Miles',
    role: 'Lead field technician',
    region: 'Metro North'
  },
  crewLead: {
    id: 'SRV-2210',
    name: 'Jordan Miles',
    role: 'Lead technician',
    assignments: 28,
    completed: 21,
    active: 7
  },
  crew: [
    { id: 'SRV-2210', name: 'Jordan Miles', role: 'Lead technician', assignments: 28, completed: 21, active: 7 },
    { id: 'SRV-1984', name: 'Eden Clarke', role: 'Field technician', assignments: 19, completed: 14, active: 5 },
    { id: 'SRV-1776', name: 'Kai Edwards', role: 'Field technician', assignments: 17, completed: 12, active: 5 },
    { id: 'SRV-1630', name: 'Morgan Shaw', role: 'Field technician', assignments: 15, completed: 10, active: 5 }
  ],
  region: 'Metro North',
  velocity: {
    travelMinutes: 26,
    previousTravelMinutes: 29,
    weekly: [
      { label: 'Week 1', accepted: 7, autoMatches: 3 },
      { label: 'Week 2', accepted: 6, autoMatches: 2 },
      { label: 'Week 3', accepted: 8, autoMatches: 4 },
      { label: 'Week 4', accepted: 7, autoMatches: 3 }
    ]
  },
  totals: {
    completed: 21,
    inProgress: 5,
    scheduled: 7,
    revenue: 18450,
    autoMatched: 9,
    adsSourced: 4
  },
  features: {
    ads: {
      available: true,
      level: 'view',
      label: 'Crew Ads Insights',
      features: ['campaigns', 'guardrails']
    }
  }
};

export default servicemanDashboardMetadata;
