export const financeDisputesSection = {
  id: 'disputes',
  icon: 'compliance',
  label: 'Dispute Resolution',
  menuLabel: 'Disputes',
  description: 'Prioritise disputes and monitor recovery actions.',
  type: 'board',
  data: {
    columns: [
      {
        title: 'New',
        items: [
          { title: 'DSP-1041 · Card chargeback', owner: 'Billing', value: '£1,120 exposure', eta: 'Evidence due 14 Mar' },
          { title: 'DSP-1043 · Duplicate invoice', owner: 'Finance ops', value: '£840 exposure', eta: 'Vendor reply pending' }
        ]
      },
      {
        title: 'Investigating',
        items: [
          { title: 'DSP-1032 · Scope dispute', owner: 'Project management', value: '£4,600 exposure', eta: 'Mediation 15 Mar' },
          { title: 'DSP-1027 · Quality hold', owner: 'Quality assurance', value: '£2,150 exposure', eta: 'Site visit 16 Mar' }
        ]
      },
      {
        title: 'Awaiting client',
        items: [
          { title: 'DSP-1018 · Travel surcharge', owner: 'Finance ops', value: '£620 exposure', eta: 'Client docs due 18 Mar' }
        ]
      },
      {
        title: 'Resolved',
        items: [
          { title: 'DSP-1009 · Safety equipment credit', owner: 'Finance ops', value: '£0 exposure', eta: 'Closed 12 Mar' }
        ]
      }
    ]
  }
};

export default financeDisputesSection;
