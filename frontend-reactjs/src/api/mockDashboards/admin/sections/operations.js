export const adminOperationsSection = {
  id: 'operations',
  icon: 'pipeline',
  label: 'Operations Pipeline',
  description: 'Monitor multi-tenant workflows, escalations, and readiness.',
  type: 'board',
  data: {
    columns: [
      {
        title: 'Needs attention',
        items: [
          { title: 'Tenant escalation #4821', owner: 'Zone B', value: 'SLA breach risk', eta: 'Respond within 2h' },
          { title: 'Legal review: contract addendum', owner: 'Enterprise ops', value: 'Sign-off pending', eta: 'Due 20 Mar' }
        ]
      },
      {
        title: 'In progress',
        items: [
          { title: 'Zone optimisation sprint', owner: 'Network planning', value: '18 zones', eta: 'Wrap 28 Mar' },
          { title: 'Tenant onboarding batch', owner: 'Growth ops', value: '5 tenants', eta: 'Go-live 22 Mar' }
        ]
      },
      {
        title: 'At risk',
        items: [
          { title: 'Service credit negotiation', owner: 'Finance', value: '£4.2k exposure', eta: 'Meeting 18 Mar' },
          { title: 'Asset shortage: lifts', owner: 'Logistics', value: '3 units', eta: 'Expedite shipment' }
        ]
      },
      {
        title: 'Recently resolved',
        items: [
          { title: 'Incident drill follow-up', owner: 'Security ops', value: 'Completed', eta: 'Reporting' },
          { title: 'Tenant billing migration', owner: 'Finance ops', value: 'Completed', eta: 'Post-mortem scheduled' }
        ]
      }
    ]
  }
};

export default adminOperationsSection;
