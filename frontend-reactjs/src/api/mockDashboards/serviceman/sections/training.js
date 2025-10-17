export const servicemanTrainingSection = {
  id: 'training',
  icon: 'compliance',
  label: 'Training & Compliance',
  menuLabel: 'Training',
  description: 'Mandatory certifications, toolbox talks, and crew learning.',
  type: 'list',
  data: {
    items: [
      {
        title: 'Confined space certification',
        description: 'Renewal module assigned · Expires 02 Apr 2025.',
        status: 'Due soon'
      },
      {
        title: 'Hospital infection control refresher',
        description: 'Video briefing + quiz assigned to Jordan and apprentice.',
        status: 'In progress'
      },
      {
        title: 'Toolbox talk – travel safety',
        description: 'Record attendance with crew before 22 Mar.',
        status: 'Action required'
      }
    ]
  }
};

export default servicemanTrainingSection;
