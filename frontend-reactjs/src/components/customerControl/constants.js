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

export const couponTemplate = {
  id: null,
  name: '',
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  currency: '',
  minOrderTotal: '',
  startsAt: '',
  expiresAt: '',
  maxRedemptions: '',
  maxRedemptionsPerCustomer: '',
  autoApply: false,
  status: 'draft',
  imageUrl: '',
  termsUrl: '',
  internalNotes: '',
  lifecycleStatus: 'draft',
  createdAt: null,
  updatedAt: null
};

export const contactTypeOptions = [
  { value: 'operations', label: 'Operations lead' },
  { value: 'finance', label: 'Finance / billing' },
  { value: 'support', label: 'Support & escalation' },
  { value: 'billing', label: 'Accounts payable' },
  { value: 'executive', label: 'Executive stakeholder' },
  { value: 'other', label: 'Other' }
];

export const discountTypeOptions = [
  { value: 'percentage', label: 'Percentage off' },
  { value: 'fixed', label: 'Fixed amount off' }
];

export const couponStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'archived', label: 'Archived' }
];
