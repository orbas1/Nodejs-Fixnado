export const adminAssetsSection = {
  id: 'assets',
  icon: 'assets',
  label: 'Asset & Rental Control',
  description: 'Fleet health, inspection cadence, and utilisation by zone.',
  type: 'table',
  data: {
    headers: ['Asset group', 'In field', 'Inspection due', 'Zone coverage', 'Next action'],
    rows: [
      ['MEWP platforms', '24', '3 overdue', 'Zones A, B, D', 'Schedule mobile inspection'],
      ['Sanitation pods', '18', '1 due', 'Zones C, F', 'Restock supplies'],
      ['Thermal cameras', '32', '0 due', 'All zones', 'Rotate to Zone E standby'],
      ['Fleet vehicles', '46', '5 due', 'Network wide', 'Book MOT batch']
    ]
  }
};

export default adminAssetsSection;
