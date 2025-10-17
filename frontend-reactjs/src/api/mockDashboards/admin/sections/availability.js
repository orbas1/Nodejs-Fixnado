export const adminAvailabilitySection = {
  id: 'availability',
  icon: 'crew',
  label: 'Serviceman Management',
  menuLabel: 'Crew',
  description: 'Crew availability, standby coverage, and certification gaps.',
  type: 'availability',
  data: {
    summary: { openSlots: '8', standbyCrews: '3', followUps: '2' },
    days: ['Mon 17', 'Tue 18', 'Wed 19', 'Thu 20', 'Fri 21'],
    resources: [
      {
        name: 'Zone Alpha lead',
        role: 'Senior technician',
        status: 'Full coverage',
        allocations: [
          { day: 'Mon 17', status: 'Booked', window: '06:00-16:00' },
          { day: 'Tue 18', status: 'Booked', window: '06:00-16:00' },
          { day: 'Wed 19', status: 'Travel', window: '09:00-11:00' },
          { day: 'Thu 20', status: 'Standby', window: 'All day' },
          { day: 'Fri 21', status: 'Booked', window: '06:00-16:00' }
        ]
      },
      {
        name: 'Zone Beta crew',
        role: 'Rapid response',
        status: 'Standby coverage',
        allocations: [
          { day: 'Mon 17', status: 'Standby', window: 'All day' },
          { day: 'Tue 18', status: 'Standby', window: 'All day' },
          { day: 'Wed 19', status: 'Booked', window: '07:00-15:00' },
          { day: 'Thu 20', status: 'Booked', window: '07:00-15:00' },
          { day: 'Fri 21', status: 'OOO', window: 'Training' }
        ]
      },
      {
        name: 'Zone Delta support',
        role: 'Compliance specialists',
        status: 'Focused on audits',
        allocations: [
          { day: 'Mon 17', status: 'Booked', window: '08:00-18:00' },
          { day: 'Tue 18', status: 'Travel', window: '10:00-12:00' },
          { day: 'Wed 19', status: 'Booked', window: '08:00-18:00' },
          { day: 'Thu 20', status: 'Booked', window: '08:00-18:00' },
          { day: 'Fri 21', status: 'Standby', window: 'All day' }
        ]
      }
    ]
  }
};

export default adminAvailabilitySection;
