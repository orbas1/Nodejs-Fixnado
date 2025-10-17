export const mockOverview = {
  profile: {
    id: 'mock-profile',
    userId: 'mock-user',
    displayName: 'Jordan Miles',
    callSign: 'Metro Crew',
    status: 'active',
    avatarUrl: null,
    bio: 'Lead technician overseeing metro north dispatch and compliance.',
    timezone: 'Europe/London',
    primaryRegion: 'Metro North',
    coverageRadiusKm: 75,
    travelBufferMinutes: 32,
    autoAcceptAssignments: true,
    allowAfterHours: false,
    notifyOpsTeam: true,
    defaultVehicle: 'Fleet Van 21'
  },
  availability: [
    {
      id: 'mock-shift-1',
      profileId: 'mock-profile',
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '16:30',
      status: 'available',
      locationLabel: 'Metro North Depot',
      notes: 'Primary dispatch window'
    },
    {
      id: 'mock-shift-2',
      profileId: 'mock-profile',
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '17:30',
      status: 'available',
      locationLabel: 'Metro North Depot',
      notes: 'QA support on closing jobs'
    },
    {
      id: 'mock-shift-standby',
      profileId: 'mock-profile',
      dayOfWeek: 4,
      startTime: '12:00',
      endTime: '18:00',
      status: 'standby',
      locationLabel: 'Remote standby',
      notes: 'Covering hospital escalation rota'
    }
  ],
  certifications: [
    {
      id: 'mock-cert-1',
      profileId: 'mock-profile',
      title: 'IOSH Safety Passport',
      issuer: 'IOSH UK',
      credentialId: 'IOSH-2211',
      issuedOn: '2024-01-12',
      expiresOn: '2026-01-11',
      attachmentUrl: null
    },
    {
      id: 'mock-cert-2',
      profileId: 'mock-profile',
      title: 'Gas Safe Certification',
      issuer: 'Gas Safe Register',
      credentialId: 'GSR-5531',
      issuedOn: '2023-10-01',
      expiresOn: '2025-10-01',
      attachmentUrl: null
    }
  ],
  equipment: [
    {
      id: 'mock-equipment-1',
      profileId: 'mock-profile',
      name: 'Thermal imaging camera',
      serialNumber: 'TIC-8891',
      status: 'maintenance',
      maintenanceDueOn: '2025-07-01',
      assignedAt: '2024-02-15',
      imageUrl: null,
      notes: 'Calibration scheduled for 20 Jun'
    },
    {
      id: 'mock-equipment-2',
      profileId: 'mock-profile',
      name: 'Electrical safety kit',
      serialNumber: 'ESK-4472',
      status: 'ready',
      maintenanceDueOn: null,
      assignedAt: '2023-11-01',
      imageUrl: null,
      notes: 'Checked weekly with depot lead'
    }
  ],
  permissions: {
    canEditProfile: true,
    canManageAvailability: true,
    canManageCertifications: true,
    canManageEquipment: true
  },
  quickLinks: [
    {
      id: 'open-calendar',
      label: 'Open crew calendar',
      description: 'Adjust shift availability and view pairing windows.',
      href: '/dashboards/serviceman/calendar',
      target: '_blank'
    },
    {
      id: 'open-pipeline',
      label: 'View job pipeline',
      description: 'Jump into the kanban workspace for assignment follow-up.',
      href: '/dashboards/serviceman/schedule',
      target: '_blank'
    },
    {
      id: 'open-travel',
      label: 'Travel telemetry',
      description: 'Monitor live routing buffers from the telemetry cockpit.',
      href: '/dashboards/serviceman/travel',
      target: '_blank'
    }
  ]
};

export default mockOverview;
