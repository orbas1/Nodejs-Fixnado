export const userCalendarSection = {
  id: 'calendar',
  icon: 'calendar',
  label: 'Service Calendar',
  menuLabel: 'Calendar',
  description: 'Crew visits, inspections, and concierge follow-ups for the month.',
  type: 'calendar',
  data: {
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
        {
          date: '17',
          isCurrentMonth: true,
          isToday: true,
          capacity: '2 slots',
          events: [{ title: 'Escrow audit', status: 'confirmed', time: '09:00' }]
        },
        {
          date: '18',
          isCurrentMonth: true,
          capacity: '1 slot',
          events: [{ title: 'HVAC seasonal service', status: 'confirmed', time: '09:00' }]
        },
        {
          date: '19',
          isCurrentMonth: true,
          capacity: '1 slot',
          events: [{ title: 'Escrow board review', status: 'risk', time: '14:30' }]
        },
        {
          date: '20',
          isCurrentMonth: true,
          capacity: '3 slots',
          events: [{ title: 'Access permit renewal', status: 'standby', time: 'All day' }]
        },
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
  }
};

export default userCalendarSection;
