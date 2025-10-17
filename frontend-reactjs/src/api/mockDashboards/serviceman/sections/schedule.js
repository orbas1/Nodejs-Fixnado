export const servicemanScheduleSection = {
  id: 'schedule',
  icon: 'pipeline',
  label: 'Job Pipeline',
  menuLabel: 'Pipeline',
  description: 'Visualise dispatch by day, risk, and completion state.',
  type: 'board',
  data: {
    columns: [
      {
        title: 'Today',
        items: [
          { title: 'Thermal imaging survey', owner: 'Harbour Apartments', value: 'Start 08:30', eta: 'Prep complete' },
          { title: 'Emergency boiler repair', owner: 'Riverside Complex', value: 'Start 11:00', eta: 'Travel buffer tight' }
        ]
      },
      {
        title: 'Tomorrow',
        items: [
          { title: 'Retail lighting retrofit', owner: 'Galleria Mall', value: 'Start 09:15', eta: 'Crew confirmed' },
          { title: 'EV charger diagnostic', owner: 'Fleet Depot', value: 'Start 14:00', eta: 'Awaiting part delivery' }
        ]
      },
      {
        title: 'Requires follow-up',
        items: [
          { title: 'Medical suite filter swap', owner: 'City Hospital', value: 'Reschedule request', eta: 'Confirm by 18 Mar' },
          { title: 'Roof access permit', owner: 'Operations', value: 'Paperwork', eta: 'Needs approval' }
        ]
      },
      {
        title: 'Recently completed',
        items: [
          { title: 'Emergency HVAC', owner: 'Municipal Centre', value: 'Completed', eta: 'QA pending' },
          { title: 'Downtown sanitisation', owner: 'Ops Pod Beta', value: 'Completed', eta: 'Survey scheduled' }
        ]
      }
    ]
  }
};

export default servicemanScheduleSection;
