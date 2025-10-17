export const providerCrewAvailabilitySection = {
  id: 'crew-availability',
  icon: 'availability',
  label: 'Crew Availability',
  menuLabel: 'Crew',
  description: 'Understand live crew capacity, travel, leave, and overtime.',
  type: 'availability',
  data: {
    summary: { openSlots: '6', standbyCrews: '2', followUps: '2' },
    days: ['Mon 17', 'Tue 18', 'Wed 19', 'Thu 20', 'Fri 21'],
    resources: [
      {
        name: 'Crew Alpha',
        role: 'HVAC specialists',
        status: 'High utilisation',
        allocations: [
          { day: 'Mon 17', status: 'Booked', window: '06:30-16:00' },
          { day: 'Tue 18', status: 'Booked', window: '07:00-17:30' },
          { day: 'Wed 19', status: 'Travel', window: '07:00-09:00' },
          { day: 'Thu 20', status: 'Standby', window: 'All day' },
          { day: 'Fri 21', status: 'Booked', window: '06:30-15:00' }
        ]
      },
      {
        name: 'Crew Beta',
        role: 'Sanitation & high-risk',
        status: 'Cross-covering Alpha',
        allocations: [
          { day: 'Mon 17', status: 'Standby', window: 'All day' },
          { day: 'Tue 18', status: 'Booked', window: '08:00-18:00' },
          { day: 'Wed 19', status: 'Booked', window: '08:00-18:00' },
          { day: 'Thu 20', status: 'Booked', window: '08:00-18:00' },
          { day: 'Fri 21', status: 'OOO', window: 'Crew rest' }
        ]
      },
      {
        name: 'Crew Gamma',
        role: 'Retail rollout',
        status: 'On project',
        allocations: [
          { day: 'Mon 17', status: 'Booked', window: '09:00-19:00' },
          { day: 'Tue 18', status: 'Travel', window: '09:00-11:00' },
          { day: 'Wed 19', status: 'Booked', window: '09:00-19:00' },
          { day: 'Thu 20', status: 'Booked', window: '09:00-19:00' },
          { day: 'Fri 21', status: 'Booked', window: '09:00-19:00' }
        ]
      }
    ]
  }
};

export default providerCrewAvailabilitySection;
