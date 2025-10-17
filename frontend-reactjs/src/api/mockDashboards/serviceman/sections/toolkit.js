export const servicemanToolkitSection = {
  id: 'toolkit',
  icon: 'assets',
  label: 'Asset Kit',
  menuLabel: 'Kit',
  description: 'Track issued equipment, calibration, and readiness.',
  type: 'table',
  data: {
    headers: ['Asset', 'Status', 'Calibration', 'Next action'],
    rows: [
      ['Thermal imaging camera', 'In field', 'Valid · due 28 Apr', 'Return to depot 22 Mar'],
      ['Respirator set', 'Ready', 'Valid · due 12 Jun', 'Fit test with apprentices'],
      ['PPE kit – medical', 'In delivery', 'Valid · due 03 Jul', 'Restock after hospital job'],
      ['MEWP harness', 'Inspection due', 'Expired 10 Mar', 'Book inspection slot']
    ]
  }
};

export default servicemanToolkitSection;
