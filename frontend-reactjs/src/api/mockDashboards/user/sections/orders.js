export const userOrdersSection = {
  id: 'orders',
  icon: 'pipeline',
  label: 'Work Orders',
  menuLabel: 'Orders',
  description: 'Escrow, delivery, and follow-up pipeline with risk visibility.',
  type: 'board',
  data: {
    columns: [
      {
        title: 'Requests',
        items: [
          { title: 'Retail lighting upgrade', owner: 'Downtown Core', value: '£1.9k', eta: 'Quote due in 4h' },
          { title: 'Office sanitisation', owner: 'Harbour Tower', value: '£1.1k', eta: 'Needs crew assignment' }
        ]
      },
      {
        title: 'Scheduled',
        items: [
          { title: 'Community centre clean', owner: 'Zone B', value: '£1.4k', eta: 'Crew check-in 18 Mar · 07:00' },
          { title: 'Smart thermostat rollout', owner: 'Residential West', value: '£2.9k', eta: 'Kick-off 25 Mar · 10:15' }
        ]
      },
      {
        title: 'At risk',
        items: [
          { title: 'Escrow release #4821', owner: 'Finance', value: '£1.3k', eta: 'Approval overdue' },
          { title: 'Pipe repair follow-up', owner: 'Ops escalation', value: '£820', eta: 'SLA breach in 6h' }
        ]
      },
      {
        title: 'Completed',
        items: [
          { title: 'Emergency plumbing', owner: 'Civic Centre', value: '£640', eta: 'Inspection passed' },
          { title: 'Solar panel clean', owner: 'City Schools', value: '£1.1k', eta: 'Feedback due 22 Mar' }
        ]
      }
    ]
  }
};

export default userOrdersSection;
