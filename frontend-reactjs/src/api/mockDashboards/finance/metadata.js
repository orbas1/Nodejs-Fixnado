export const financeDashboardMetadata = {
  finance: {
    controller: 'Priya Khanna',
    region: 'UK & Ireland',
    autopayoutWindow: 'Daily 16:00 UTC'
  },
  totals: {
    capturedRevenue: '£1.42m',
    escrowBalance: '£210k',
    payoutsDue: '£148k',
    disputesOpen: 6,
    refundsPending: '£12k'
  },
  features: {
    exports: {
      available: true,
      cadence: 'Hourly refresh',
      formats: ['CSV', 'XLSX', 'S3 webhook']
    }
  }
};

export default financeDashboardMetadata;
