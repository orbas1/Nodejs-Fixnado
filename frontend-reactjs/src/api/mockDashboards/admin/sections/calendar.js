export const adminCalendarSection = {
  id: 'calendar',
  icon: 'calendar',
  label: 'Network Calendar',
  description: 'Central schedule for maintenance windows, releases, and audits.',
  type: 'calendar',
  data: {
    month: 'March 2025',
    legend: [
      { label: 'Maintenance window', status: 'confirmed' },
      { label: 'Platform release', status: 'standby' },
      { label: 'Audit / governance', status: 'travel' },
      { label: 'Escalation drill', status: 'risk' }
    ],
    weeks: [
      [
        { date: '24', isCurrentMonth: false, events: [] },
        { date: '25', isCurrentMonth: false, events: [] },
        { date: '26', isCurrentMonth: false, events: [] },
        { date: '27', isCurrentMonth: false, events: [] },
        { date: '28', isCurrentMonth: false, events: [] },
        { date: '1', isCurrentMonth: true, events: [{ title: 'Platform release hardening', status: 'standby', time: 'All day' }] },
        { date: '2', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '3', isCurrentMonth: true, events: [{ title: 'Zone B maintenance', status: 'confirmed', time: '02:00-04:00' }] },
        { date: '4', isCurrentMonth: true, events: [{ title: 'Data residency audit', status: 'travel', time: '09:00' }] },
        { date: '5', isCurrentMonth: true, events: [{ title: 'Release planning sync', status: 'standby', time: '16:00' }] },
        { date: '6', isCurrentMonth: true, events: [{ title: 'Escalation tabletop', status: 'risk', time: '14:30' }] },
        { date: '7', isCurrentMonth: true, events: [] },
        { date: '8', isCurrentMonth: true, events: [{ title: 'Tenant feature preview', status: 'standby', time: 'All day' }] },
        { date: '9', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '10', isCurrentMonth: true, events: [{ title: 'Zone D maintenance', status: 'confirmed', time: '01:00-03:00' }] },
        { date: '11', isCurrentMonth: true, events: [{ title: 'Vendor compliance checks', status: 'travel', time: '10:30' }] },
        { date: '12', isCurrentMonth: true, events: [{ title: 'Incident drill', status: 'risk', time: '15:00' }] },
        { date: '13', isCurrentMonth: true, events: [{ title: 'Platform release', status: 'confirmed', time: '02:30-04:30' }] },
        { date: '14', isCurrentMonth: true, events: [] },
        { date: '15', isCurrentMonth: true, events: [{ title: 'Zone planning workshop', status: 'standby', time: 'All day' }] },
        { date: '16', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '17', isCurrentMonth: true, events: [{ title: 'Tenant onboarding sprint', status: 'standby', time: '09:30' }] },
        { date: '18', isCurrentMonth: true, events: [{ title: 'Platform release', status: 'confirmed', time: '02:00-04:00' }] },
        { date: '19', isCurrentMonth: true, events: [{ title: 'Security audit', status: 'travel', time: '10:00' }] },
        { date: '20', isCurrentMonth: true, events: [{ title: 'Ops council', status: 'standby', time: '13:00' }] },
        { date: '21', isCurrentMonth: true, events: [{ title: 'Executive incident drill', status: 'risk', time: '08:45' }] },
        { date: '22', isCurrentMonth: true, events: [{ title: 'Zone C maintenance', status: 'confirmed', time: '01:30-03:30' }] },
        { date: '23', isCurrentMonth: true, events: [] }
      ],
      [
        { date: '24', isCurrentMonth: true, events: [{ title: 'Platform release candidate', status: 'standby', time: 'All day' }] },
        { date: '25', isCurrentMonth: true, events: [{ title: 'Tenant advisory council', status: 'confirmed', time: '11:00' }] },
        { date: '26', isCurrentMonth: true, events: [{ title: 'Data privacy audit', status: 'travel', time: '09:00' }] },
        { date: '27', isCurrentMonth: true, events: [{ title: 'Escalation readiness review', status: 'risk', time: '15:30' }] },
        { date: '28', isCurrentMonth: true, events: [{ title: 'Zone D calibration', status: 'confirmed', time: '02:00-04:00' }] },
        { date: '29', isCurrentMonth: true, events: [{ title: 'Platform release', status: 'confirmed', time: '02:30-04:30' }] },
        { date: '30', isCurrentMonth: true, events: [{ title: 'Weekend audit prep', status: 'standby', time: 'All day' }] }
      ]
    ]
  }
};

export default adminCalendarSection;
