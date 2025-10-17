export const providerCalendarSection = {
  id: 'calendar',
  icon: 'calendar',
  label: 'Operations Calendar',
  menuLabel: 'Calendar',
  description: 'Multi-crew calendar including shared assets and client milestones.',
  type: 'calendar',
  data: {
    month: 'March 2025',
    legend: [
      { label: 'Crew dispatch', status: 'confirmed' },
      { label: 'Asset prep', status: 'travel' },
      { label: 'Standby window', status: 'standby' },
      { label: 'Escalation', status: 'risk' }
    ],
    weeks: [
      [
        { date: '24', isCurrentMonth: false, events: [] },
        { date: '25', isCurrentMonth: false, events: [] },
        { date: '26', isCurrentMonth: false, events: [] },
        { date: '27', isCurrentMonth: false, events: [] },
        { date: '28', isCurrentMonth: false, events: [] },
        { date: '1', isCurrentMonth: true, events: [{ title: 'Crew onboarding', status: 'standby', time: 'All day' }] },
        { date: '2', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '3', isCurrentMonth: true, events: [{ title: 'Depot asset checks', status: 'travel', time: '07:00' }] },
        { date: '4', isCurrentMonth: true, events: [{ title: 'Retail lighting retrofit', status: 'confirmed', time: '09:00' }] },
        { date: '5', isCurrentMonth: true, events: [{ title: 'Hospital readiness review', status: 'standby', time: '15:00' }] },
        { date: '6', isCurrentMonth: true, events: [{ title: 'Client executive review', status: 'risk', time: '16:30' }] },
        { date: '7', isCurrentMonth: true, events: [] },
        { date: '8', isCurrentMonth: true, events: [{ title: 'Weekend crew standby', status: 'standby', time: 'All day' }] },
        { date: '9', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '10', isCurrentMonth: true, events: [{ title: 'Fleet sanitation', status: 'confirmed', time: '07:30' }] },
        { date: '11', isCurrentMonth: true, events: [{ title: 'Bid defence for airport', status: 'standby', time: '14:00' }] },
        { date: '12', isCurrentMonth: true, events: [{ title: 'Escalation watch', status: 'risk', time: 'Operations' }] },
        { date: '13', isCurrentMonth: true, events: [{ title: 'Automation tune-up', status: 'standby', time: 'All day' }] },
        { date: '14', isCurrentMonth: true, events: [] },
        { date: '15', isCurrentMonth: true, events: [{ title: 'Asset restock', status: 'travel', time: '11:00' }] },
        { date: '16', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '17', isCurrentMonth: true, events: [{ title: 'Board meeting dry-run', status: 'standby', time: '09:00' }] },
        { date: '18', isCurrentMonth: true, events: [{ title: 'Premium mall HVAC', status: 'confirmed', time: '07:30' }] },
        { date: '19', isCurrentMonth: true, events: [{ title: 'Escalation: invoice dispute', status: 'risk', time: '16:00' }] },
        { date: '20', isCurrentMonth: true, events: [{ title: 'Supplier onboarding', status: 'standby', time: '14:00' }] },
        { date: '21', isCurrentMonth: true, events: [{ title: 'Quarterly board review', status: 'confirmed', time: '16:00' }] },
        { date: '22', isCurrentMonth: true, events: [{ title: 'Fleet inspection', status: 'travel', time: '10:00' }] },
        { date: '23', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '24', isCurrentMonth: true, events: [{ title: 'Retail rollout phase 2', status: 'confirmed', time: '08:00' }] },
        { date: '25', isCurrentMonth: true, events: [{ title: 'Automation sprint review', status: 'standby', time: '15:00' }] },
        { date: '26', isCurrentMonth: true, events: [{ title: 'Escrow pack review', status: 'risk', time: 'Finance' }] },
        { date: '27', isCurrentMonth: true, events: [{ title: 'Crew rotation planning', status: 'standby', time: '13:00' }] },
        { date: '28', isCurrentMonth: true, events: [{ title: 'Asset dispatch: MEWP', status: 'travel', time: '06:30' }] },
        { date: '29', isCurrentMonth: true, events: [] },
        { date: '30', isCurrentMonth: true, events: [{ title: 'Weekend support sweep', status: 'standby', time: 'All day' }] }
      ]
    ]
  }
};

export default providerCalendarSection;
