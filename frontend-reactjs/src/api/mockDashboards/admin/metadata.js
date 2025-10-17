export const adminDashboardMetadata = {
  organisation: {
    tenants: 128,
    activeZones: 18,
    platformStatus: 'Green'
  },
  totals: {
    bookings: 486,
    escalations: 9,
    servicedRegions: 42,
    assetsInField: 176
  },
  features: {
    ads: {
      available: true,
      level: 'view',
      label: 'Control Tower Read-only',
      features: ['campaigns', 'billing']
    }
  }
};

export default adminDashboardMetadata;
