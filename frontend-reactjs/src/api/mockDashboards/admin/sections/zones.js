export const adminZonesSection = {
  id: 'zones',
  icon: 'map',
  label: 'Zone Design Studio',
  menuLabel: 'Zones',
  description: 'Draw, manage, and simulate multi-tenant service zones.',
  type: 'zones',
  data: {
    canvas: [
      ['A', 'A', 'B', 'B', 'C'],
      ['A', 'A', 'B', 'C', 'C'],
      ['D', 'D', 'B', 'C', 'E'],
      ['D', 'F', 'F', 'E', 'E']
    ],
    zones: [
      { code: 'A', region: 'North loop', color: '#bfdbfe', lead: 'Harper Quinn', workload: '82% utilisation' },
      { code: 'B', region: 'Central core', color: '#a7f3d0', lead: 'Noah Patel', workload: '76% utilisation' },
      { code: 'C', region: 'South district', color: '#fde68a', lead: 'Isla Mensah', workload: '68% utilisation' },
      { code: 'D', region: 'Industrial belt', color: '#fca5a5', lead: 'Milo Evans', workload: '89% utilisation' },
      { code: 'E', region: 'Coastal', color: '#c4b5fd', lead: 'Sofia Reyes', workload: '71% utilisation' },
      { code: 'F', region: 'Airport corridor', color: '#bbf7d0', lead: 'Leo Smith', workload: '64% utilisation' }
    ],
    drafts: [
      { title: 'Micro-zone overlay', description: 'Split Zone B into micro-areas to reduce travel.' },
      { title: 'Event mode', description: 'Temporary weekend zones for major sporting events.' }
    ],
    actions: [
      'Validate coverage heatmap before releasing new tenant cluster.',
      'Share updated zone plan with logistics and compliance teams.',
      'Publish overnight rotation for airport corridor (Zone F).'
    ]
  }
};

export default adminZonesSection;
