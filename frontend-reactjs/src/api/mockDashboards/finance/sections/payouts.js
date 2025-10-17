export const financePayoutsSection = {
  id: 'payouts',
  icon: 'assets',
  label: 'Payout Approvals',
  menuLabel: 'Payouts',
  description: 'Review and release provider payouts with audit-ready notes.',
  type: 'board',
  data: {
    columns: [
      {
        title: 'Needs approval',
        items: [
          { title: 'Atlas Logistics · £18,400', owner: 'Finance ops', value: 'Docs matched', eta: 'Approve by 15 Mar' },
          { title: 'Rapid Repairs · £12,950', owner: 'Finance ops', value: 'Awaiting QA', eta: 'Site sign-off 14 Mar' }
        ]
      },
      {
        title: 'Scheduled',
        items: [
          { title: 'Greenway Maintenance · £24,600', owner: 'Treasury', value: 'ACH queued', eta: 'Release 15 Mar' },
          { title: 'Harbour Resorts · £19,880', owner: 'Treasury', value: 'FX settlement', eta: 'Release 16 Mar' }
        ]
      },
      {
        title: 'On hold',
        items: [
          { title: 'Metro Build Guild · £42,110', owner: 'Risk', value: 'Invoice variance 3.2%', eta: 'Awaiting vendor response' },
          { title: 'City Works Co-op · £15,400', owner: 'Risk', value: 'AML refresh required', eta: 'Docs due 17 Mar' }
        ]
      }
    ]
  }
};

export default financePayoutsSection;
