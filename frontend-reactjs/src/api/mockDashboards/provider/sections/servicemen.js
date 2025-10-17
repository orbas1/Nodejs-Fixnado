export const providerServicemenSection = {
  id: 'servicemen',
  icon: 'crew',
  label: 'Serviceman Directory',
  menuLabel: 'Roster',
  description: 'Manage roster, certifications, and contact details.',
  type: 'table',
  data: {
    headers: ['Name', 'Role', 'Availability', 'Certifications', 'Next training'],
    rows: [
      ['Jordan Miles', 'Lead technician', 'Booked · openings Thu', 'Confined space, HVAC Level 3', '02 Apr 2025'],
      ['Priya Desai', 'Crew lead', 'Standby Tue', 'IPAF, NICEIC', '18 Apr 2025'],
      ['Malik Ward', 'Apprentice', 'Shadowing', 'PPE, Ladder safety', 'Weekly toolbox'],
      ['Ana Rodrigues', 'Specialist', 'Booked', 'Cleanroom, Hazardous waste', '30 Mar 2025']
    ]
  }
};

export default providerServicemenSection;
