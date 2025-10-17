export const servicemanCalendarSection = {
  id: 'calendar',
  icon: 'calendar',
  label: 'Crew Calendar',
  menuLabel: 'Calendar',
  description: 'Shift-level view of confirmed work, travel, and readiness.',
  type: 'calendar',
  data: {
    month: 'March 2025',
    legend: [
      { label: 'Confirmed job', status: 'confirmed' },
      { label: 'Travel / logistics', status: 'travel' },
      { label: 'Standby', status: 'standby' },
      { label: 'Risk / escalation', status: 'risk' }
    ],
    weeks: [
      [
        { date: '24', isCurrentMonth: false, events: [] },
        { date: '25', isCurrentMonth: false, events: [] },
        { date: '26', isCurrentMonth: false, events: [] },
        { date: '27', isCurrentMonth: false, events: [] },
        { date: '28', isCurrentMonth: false, events: [] },
        { date: '1', isCurrentMonth: true, events: [{ title: 'Depot inventory', status: 'travel', time: '07:00' }] },
        { date: '2', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '3', isCurrentMonth: true, events: [{ title: 'Thermal imaging survey', status: 'confirmed', time: '08:30' }] },
        { date: '4', isCurrentMonth: true, events: [{ title: 'Retail lighting retrofit', status: 'confirmed', time: '09:15' }] },
        { date: '5', isCurrentMonth: true, events: [{ title: 'Escalation check-in', status: 'risk', time: '16:00' }] },
        { date: '6', isCurrentMonth: true, events: [{ title: 'Crew learning block', status: 'standby', time: '13:00' }] },
        { date: '7', isCurrentMonth: true, events: [] },
        { date: '8', isCurrentMonth: true, events: [{ title: 'Emergency HVAC', status: 'confirmed', time: '07:30' }] },
        { date: '9', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '10', isCurrentMonth: true, events: [{ title: 'Depot restock', status: 'travel', time: '08:00' }] },
        { date: '11', isCurrentMonth: true, events: [{ title: 'Commercial deep clean', status: 'confirmed', time: '10:00' }] },
        { date: '12', isCurrentMonth: true, events: [{ title: 'Hospital sterilisation', status: 'confirmed', time: '13:15' }] },
        { date: '13', isCurrentMonth: true, events: [{ title: 'Escrow audit support', status: 'standby', time: 'All day' }] },
        { date: '14', isCurrentMonth: true, events: [] },
        { date: '15', isCurrentMonth: true, events: [{ title: 'Permit pickup', status: 'travel', time: '11:30' }] },
        { date: '16', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '17', isCurrentMonth: true, events: [{ title: 'Escrow release audit', status: 'standby', time: '09:00' }] },
        { date: '18', isCurrentMonth: true, events: [{ title: 'High-rise elevator reset', status: 'confirmed', time: '08:30' }] },
        { date: '19', isCurrentMonth: true, isToday: true, events: [{ title: 'University access control', status: 'confirmed', time: '09:00' }] },
        { date: '20', isCurrentMonth: true, events: [{ title: 'Field coaching', status: 'standby', time: '14:00' }] },
        { date: '21', isCurrentMonth: true, events: [{ title: 'Fleet vehicle inspection', status: 'travel', time: '10:00' }] },
        { date: '22', isCurrentMonth: true, events: [{ title: 'Crew rest day', status: 'standby', time: 'All day' }] },
        { date: '23', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '24', isCurrentMonth: true, events: [{ title: 'Access control rollout', status: 'confirmed', time: '08:45' }] },
        { date: '25', isCurrentMonth: true, events: [{ title: 'Retail chain audit', status: 'confirmed', time: '12:30' }] },
        { date: '26', isCurrentMonth: true, events: [{ title: 'Hospital QA review', status: 'risk', time: '16:30' }] },
        { date: '27', isCurrentMonth: true, events: [{ title: 'Quarterly board prep', status: 'standby', time: 'All day' }] },
        { date: '28', isCurrentMonth: true, events: [{ title: 'Tooling calibration', status: 'travel', time: '08:00' }] },
        { date: '29', isCurrentMonth: true, events: [] },
        { date: '30', isCurrentMonth: true, events: [] }
      ]
    ]
  }
};

export default servicemanCalendarSection;
