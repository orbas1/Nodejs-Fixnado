export const servicemanAvailabilitySection = {
  id: 'availability',
  icon: 'availability',
  label: 'Shift Availability',
  menuLabel: 'Shifts',
  description: 'Update personal availability, leave, and supporting pods.',
  type: 'availability',
  data: {
    summary: { openSlots: '3', standbyCrews: '1', followUps: '2' },
    days: ['Mon 17', 'Tue 18', 'Wed 19', 'Thu 20', 'Fri 21'],
    resources: [
      {
        name: 'Jordan Miles',
        role: 'Lead technician',
        status: 'Primary dispatch',
        allocations: [
          { day: 'Mon 17', status: 'Booked', window: '07:00-17:00' },
          { day: 'Tue 18', status: 'Booked', window: '08:00-18:00' },
          { day: 'Wed 19', status: 'Booked', window: '08:00-16:00' },
          { day: 'Thu 20', status: 'Standby', window: 'On-call' },
          { day: 'Fri 21', status: 'Travel', window: '07:00-09:00' }
        ]
      },
      {
        name: 'Shadow Crew',
        role: 'Apprentice support',
        status: 'Pairing with Jordan',
        allocations: [
          { day: 'Mon 17', status: 'Standby', window: 'All day' },
          { day: 'Tue 18', status: 'Booked', window: '09:00-17:00' },
          { day: 'Wed 19', status: 'Booked', window: '09:00-15:00' },
          { day: 'Thu 20', status: 'Booked', window: '09:00-17:00' },
          { day: 'Fri 21', status: 'OOO', window: 'Training' }
        ]
      },
      {
        name: 'Specialist Pool',
        role: 'HVAC escalation',
        status: 'Second line',
        allocations: [
          { day: 'Mon 17', status: 'Standby', window: 'All day' },
          { day: 'Tue 18', status: 'Standby', window: 'All day' },
          { day: 'Wed 19', status: 'Travel', window: '10:00-12:00' },
          { day: 'Thu 20', status: 'Booked', window: '12:00-20:00' },
          { day: 'Fri 21', status: 'Booked', window: '07:00-15:00' }
        ]
      }
    ]
  }
};

export default servicemanAvailabilitySection;
