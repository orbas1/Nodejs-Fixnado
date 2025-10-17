export const enterpriseCalendarSection = {
  id: 'calendar',
  icon: 'calendar',
  label: 'Portfolio Calendar',
  menuLabel: 'Calendar',
  description: 'Cross-facility calendar spanning campaigns, maintenance, and governance.',
  type: 'calendar',
  data: {
    month: 'March 2025',
    legend: [
      { label: 'Maintenance program', status: 'confirmed' },
      { label: 'Campaign milestone', status: 'standby' },
      { label: 'Governance / audit', status: 'travel' },
      { label: 'Risk / escalation', status: 'risk' }
    ],
    weeks: [
      [
        { date: '24', isCurrentMonth: false, events: [] },
        { date: '25', isCurrentMonth: false, events: [] },
        { date: '26', isCurrentMonth: false, events: [] },
        { date: '27', isCurrentMonth: false, events: [] },
        { date: '28', isCurrentMonth: false, events: [] },
        { date: '1', isCurrentMonth: true, events: [{ title: 'Automation go-live prep', status: 'standby', time: 'All day' }] },
        { date: '2', isCurrentMonth: true, events: [] }
      ],
      [
        {
          date: '3',
          isCurrentMonth: true,
          events: [{ title: 'Facilities automation audit', status: 'travel', time: '08:30' }]
        },
        { date: '4', isCurrentMonth: true, events: [{ title: 'Energy retrofit kickoff', status: 'confirmed', time: '10:00' }] },
        { date: '5', isCurrentMonth: true, events: [{ title: 'Campaign creative review', status: 'standby', time: '15:00' }] },
        { date: '6', isCurrentMonth: true, events: [{ title: 'Escalation: vendor delay', status: 'risk', time: '16:00' }] },
        { date: '7', isCurrentMonth: true, events: [] },
        { date: '8', isCurrentMonth: true, events: [{ title: 'Weekend automation deploy', status: 'confirmed', time: 'All day' }] },
        { date: '9', isCurrentMonth: true, events: [] }
      ],
      [
        {
          date: '10',
          isCurrentMonth: true,
          events: [{ title: 'Compliance refresh • Healthcare', status: 'travel', time: 'All day' }]
        },
        { date: '11', isCurrentMonth: true, events: [{ title: 'Marketing campaign drop', status: 'standby', time: '09:00' }] },
        { date: '12', isCurrentMonth: true, events: [{ title: 'Escalation: contractor SLA', status: 'risk', time: '12:00' }] },
        { date: '13', isCurrentMonth: true, events: [{ title: 'Automation backlog review', status: 'standby', time: '15:00' }] },
        { date: '14', isCurrentMonth: true, events: [] },
        { date: '15', isCurrentMonth: true, events: [{ title: 'Sustainability audit', status: 'travel', time: '09:00' }] },
        { date: '16', isCurrentMonth: true, events: [] }
      ],
      [
        {
          date: '17',
          isCurrentMonth: true,
          events: [{ title: 'Executive strategy review', status: 'standby', time: '11:00' }]
        },
        { date: '18', isCurrentMonth: true, events: [{ title: 'Automation sprint review', status: 'confirmed', time: '09:00' }] },
        { date: '19', isCurrentMonth: true, events: [{ title: 'Risk board review', status: 'risk', time: '15:00' }] },
        { date: '20', isCurrentMonth: true, events: [{ title: 'Vendor assessment day', status: 'travel', time: 'All day' }] },
        { date: '21', isCurrentMonth: true, events: [{ title: 'Portfolio strategy review', status: 'confirmed', time: '11:00' }] },
        { date: '22', isCurrentMonth: true, events: [{ title: 'Automation lab pilot', status: 'standby', time: 'All day' }] },
        { date: '23', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '24', isCurrentMonth: true, events: [{ title: 'Regional council audit', status: 'travel', time: '09:00' }] },
        { date: '25', isCurrentMonth: true, events: [{ title: 'Q2 vendor summit', status: 'confirmed', time: '15:30' }] },
        { date: '26', isCurrentMonth: true, events: [{ title: 'Automation release window', status: 'standby', time: 'All day' }] },
        { date: '27', isCurrentMonth: true, events: [{ title: 'Campaign analytics drop', status: 'confirmed', time: '08:00' }] },
        { date: '28', isCurrentMonth: true, events: [{ title: 'Risk mitigation plan', status: 'risk', time: '14:00' }] },
        { date: '29', isCurrentMonth: true, events: [{ title: 'Governance stand-up', status: 'travel', time: '10:00' }] },
        { date: '30', isCurrentMonth: true, events: [] }
      ]
    ]
  }
};

export default enterpriseCalendarSection;
