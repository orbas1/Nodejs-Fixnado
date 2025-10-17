export const providerWorkboardSection = {
  id: 'workboard',
  icon: 'pipeline',
  label: 'Service Pipeline',
  menuLabel: 'Pipeline',
  description: 'Track bookings through assignment, delivery, and billing.',
  type: 'board',
  data: {
    columns: [
      {
        title: 'New leads',
        items: [
          { title: 'Airport concourse polish', owner: 'Sales', value: '£18k', eta: 'Proposal out' },
          { title: 'Industrial kitchen retrofit', owner: 'Sales', value: '£26k', eta: 'Bid review 19 Mar' }
        ]
      },
      {
        title: 'Crew scheduling',
        items: [
          { title: 'Hospital isolation ward', owner: 'Ops Pod Beta', value: '£32k', eta: 'Crew confirm 18 Mar' },
          { title: 'City hall facade clean', owner: 'Ops Pod Delta', value: '£14k', eta: 'Weather hold' }
        ]
      },
      {
        title: 'In delivery',
        items: [
          { title: 'Retail chain rollout', owner: 'Crew Gamma', value: '£56k', eta: 'SLA check 3h' },
          { title: 'University labs sanitisation', owner: 'Crew Alpha', value: '£22k', eta: 'Day 2 of 3' }
        ]
      },
      {
        title: 'Billing review',
        items: [
          { title: 'Logistics warehouse ramp', owner: 'Finance', value: '£19k', eta: 'Awaiting punch list' },
          { title: 'Boutique hotel refit', owner: 'Finance', value: '£12k', eta: 'Customer feedback pending' }
        ]
      }
    ]
  }
};

export default providerWorkboardSection;
