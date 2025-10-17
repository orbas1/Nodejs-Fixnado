const servicemanProfileSettingsStub = Object.freeze({
  profile: {
    firstName: 'Jordan',
    lastName: 'Miles',
    preferredName: 'Jordy',
    title: 'Lead Field Technician',
    badgeId: 'SRV-2210',
    region: 'Metro North',
    summary: 'Lead technician focused on rapid response jobs.',
    bio: 'Jordan leads a pod of three technicians specialising in vertical transportation and emergency HVAC resets.',
    avatarUrl: 'https://images.fixnado.com/crew/jordan-miles.jpg',
    email: 'jordan.miles@metro-ops.co.uk',
    timezone: 'Europe/London',
    language: 'en-GB'
  },
  contact: {
    phoneNumber: '+44 7700 900234',
    email: 'jordan.miles@metro-ops.co.uk',
    emergencyContacts: [
      {
        id: 'contact-primary',
        name: 'Eden Clarke',
        relationship: 'Crew partner',
        phoneNumber: '+44 7700 900678',
        email: 'eden.clarke@metro-ops.co.uk'
      },
      {
        id: 'contact-ops',
        name: 'Morgan Shaw',
        relationship: 'Operations manager',
        phoneNumber: '+44 20 4520 2234',
        email: 'morgan.shaw@metro-ops.co.uk'
      }
    ]
  },
  workPreferences: {
    preferredShiftStart: '07:30',
    preferredShiftEnd: '17:30',
    maxJobsPerDay: 6,
    travelRadiusKm: 40,
    crewLeadEligible: true,
    mentorEligible: true,
    remoteSupport: true
  },
  skills: {
    specialties: ['Vertical transport', 'Emergency HVAC', 'Hospital compliance'],
    certifications: [
      {
        id: 'cert-ipaf',
        name: 'IPAF Mobile Elevating Work Platform',
        issuer: 'IPAF',
        issuedOn: '2024-02-12',
        expiresOn: '2026-02-11',
        credentialUrl: 'https://certificates.ipaf.org/verify/ipaf-12345'
      },
      {
        id: 'cert-hospital',
        name: 'NHS Estates Infection Control',
        issuer: 'NHS Estates',
        issuedOn: '2023-09-03',
        expiresOn: '2025-09-02',
        credentialUrl: 'https://nhs-estates.ac.uk/certificates/88442'
      }
    ]
  },
  availability: {
    template: {
      monday: { available: true, start: '07:00', end: '17:00' },
      tuesday: { available: true, start: '07:00', end: '17:00' },
      wednesday: { available: true, start: '08:00', end: '18:00' },
      thursday: { available: true, start: '08:00', end: '18:00' },
      friday: { available: true, start: '07:30', end: '16:30' },
      saturday: { available: false, start: null, end: null },
      sunday: { available: false, start: null, end: null }
    }
  },
  equipment: [
    {
      id: 'equip-thermal-camera',
      name: 'Thermal Imaging Camera',
      status: 'In field',
      serialNumber: 'TIC-22-7711',
      assignedOn: '2024-01-05',
      notes: 'Calibrate monthly before hospital runs.'
    },
    {
      id: 'equip-respirator',
      name: 'Respirator Set',
      status: 'Ready',
      serialNumber: 'PPE-Resp-5588',
      assignedOn: '2024-03-01',
      notes: 'Fit test logged Feb 2025.'
    }
  ],
  documents: [
    {
      id: 'doc-passport',
      name: 'Passport ID',
      type: 'Identity',
      url: 'https://files.fixnado.com/crew/jordan/passport.pdf',
      expiresOn: '2029-08-30',
      notes: 'Required for hospital secure access.'
    },
    {
      id: 'doc-clearance',
      name: 'Enhanced DBS Check',
      type: 'Security',
      url: 'https://files.fixnado.com/crew/jordan/dbs.pdf',
      expiresOn: '2026-12-14',
      notes: 'Renew 8 weeks before expiry.'
    }
  ],
  metadata: {
    lastUpdatedAt: '2025-03-18T09:42:00Z',
    lastUpdatedBy: 'SRV-2210'
  }
});

export default servicemanProfileSettingsStub;
