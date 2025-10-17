export const enterpriseFinanceSection = {
  id: 'finance',
  icon: 'finance',
  label: 'Financial Controls',
  menuLabel: 'Finance',
  description: 'Budget adherence, spend governance, and automation ROI.',
  type: 'table',
  data: {
    headers: ['Program', 'Budget', 'Actuals', 'Variance', 'Owner'],
    rows: [
      ['Smart Security', '£480k', '£452k', '-£28k', 'Security Office'],
      ['Energy Optimisation', '£620k', '£605k', '-£15k', 'Sustainability'],
      ['Automation Lab', '£310k', '£298k', '-£12k', 'Automation PMO'],
      ['Vendor Enablement', '£210k', '£224k', '+£14k', 'Operations']
    ]
  }
};

export default enterpriseFinanceSection;
