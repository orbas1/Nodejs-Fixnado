export const providerRentalsSection = {
  id: 'rentals',
  icon: 'assets',
  label: 'Asset Lifecycle',
  menuLabel: 'Assets',
  description: 'Equipment tied to service delivery and inspection cadence.',
  type: 'table',
  data: {
    headers: ['Agreement', 'Asset', 'Status', 'Crew', 'Return milestone'],
    rows: [
      ['AGR-5412', 'Air scrubber kit', 'In delivery', 'Crew Gamma', 'Return 25 Mar'],
      ['AGR-5406', 'MEWP platform', 'Inspection overdue', 'Crew Alpha', 'Inspection due 17 Mar'],
      ['AGR-5389', 'Water-fed poles', 'Ready for pickup', 'Crew Delta', 'Collection scheduled'],
      ['AGR-5371', 'Fogging units', 'Awaiting sanitisation', 'Crew Beta', 'Prep 20 Mar']
    ]
  }
};

export default providerRentalsSection;
