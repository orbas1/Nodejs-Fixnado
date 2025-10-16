export const defaultProfile = {
  preferredName: '',
  companyName: '',
  jobTitle: '',
  primaryEmail: '',
  primaryPhone: '',
  preferredContactMethod: '',
  billingEmail: '',
  timezone: '',
  locale: '',
  defaultCurrency: '',
  avatarUrl: '',
  coverImageUrl: '',
  supportNotes: '',
  escalationWindowMinutes: 120,
  marketingOptIn: false,
  notificationsEmailOptIn: true,
  notificationsSmsOptIn: false
};

export const contactTemplate = {
  id: null,
  name: '',
  role: '',
  email: '',
  phone: '',
  contactType: 'operations',
  isPrimary: false,
  notes: '',
  avatarUrl: ''
};

export const locationTemplate = {
  id: null,
  label: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  zoneLabel: '',
  zoneCode: '',
  serviceCatalogues: '',
  onsiteContactName: '',
  onsiteContactPhone: '',
  onsiteContactEmail: '',
  accessWindowStart: '',
  accessWindowEnd: '',
  parkingInformation: '',
  loadingDockDetails: '',
  securityNotes: '',
  floorLevel: '',
  mapImageUrl: '',
  accessNotes: '',
  isPrimary: false
};

export const contactTypeOptions = [
  { value: 'operations', label: 'Operations lead' },
  { value: 'finance', label: 'Finance / billing' },
  { value: 'support', label: 'Support & escalation' },
  { value: 'billing', label: 'Accounts payable' },
  { value: 'executive', label: 'Executive stakeholder' },
  { value: 'other', label: 'Other' }
];
