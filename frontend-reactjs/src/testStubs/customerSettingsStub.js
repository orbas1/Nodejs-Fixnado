export const customerSettingsStub = {
  profile: {
    firstName: 'Jordan',
    lastName: 'Miles',
    email: 'jordan@example.com',
    preferredName: 'Jordan',
    jobTitle: 'Facilities Lead',
    phoneNumber: '+44 7700 900123',
    timezone: 'Europe/London',
    language: 'en-GB',
    avatarUrl: null
  },
  notifications: {
    dispatch: { email: true, sms: false },
    support: { email: true, sms: false },
    weeklySummary: { email: true },
    concierge: { email: true, sms: false },
    quietHours: { enabled: false, start: null, end: null, timezone: 'Europe/London' },
    escalationContacts: []
  },
  billing: {
    preferredCurrency: 'GBP',
    defaultPaymentMethod: 'Visa 4242',
    paymentNotes: null,
    invoiceRecipients: []
  },
  security: {
    twoFactor: {
      app: false,
      email: false,
      enabled: false,
      methods: [],
      lastUpdated: null
    }
  },
  metadata: {
    updatedAt: null
  }
};

export default customerSettingsStub;
