export const providerAdsSection = {
  id: 'fixnado-ads',
  icon: 'analytics',
  label: 'Fixnado Ads',
  menuLabel: 'Ads',
  description: 'Campaign pacing, spend, guardrails, and billing.',
  type: 'ads',
  access: {
    level: 'manage',
    label: 'Provider Ads Manager',
    features: ['campaigns', 'billing', 'guardrails', 'targeting']
  },
  data: {
    summaryCards: [
      { title: 'Managed spend', value: '£48.2k', change: '+£6.4k vs prior', trend: 'up', helper: '3 active campaigns' },
      { title: 'Attributed revenue', value: '£102k', change: '+£14k vs prior', trend: 'up', helper: 'ROAS 212%' },
      { title: 'Conversions', value: '352', change: '+42 vs prior', trend: 'up', helper: 'CPA £137' },
      { title: 'Fixnado Ads share', value: '38%', change: '+4pts vs prior', trend: 'up', helper: '62 jobs attributed' }
    ],
    funnel: [
      { title: 'Impressions', value: '1.8M', helper: 'CTR 3.1%' },
      { title: 'Clicks', value: '56.4k', helper: 'CVR 6.2%' },
      { title: 'Conversions', value: '352', helper: 'Spend £48.2k' },
      { title: 'Jobs won', value: '62', helper: '18% of conversions' }
    ],
    campaigns: [
      {
        id: 'camp-retail-q2',
        name: 'Retail Surge Q2',
        status: 'Active',
        objective: 'Awareness to bookings',
        spend: '£21.4k',
        spendChange: '+£3.2k',
        conversions: '184',
        conversionsChange: '+27',
        cpa: '£116',
        roas: '218%',
        roasChange: '+12%',
        pacing: '68% of target',
        lastMetricDate: '2025-03-16',
        flights: 2,
        window: '2025-03-01 → 2025-03-31'
      },
      {
        id: 'camp-health',
        name: 'Healthcare Response',
        status: 'Scheduled',
        objective: 'Lead generation',
        spend: '£12.7k',
        spendChange: '+£1.9k',
        conversions: '96',
        conversionsChange: '+11',
        cpa: '£132',
        roas: '184%',
        roasChange: '+6%',
        pacing: '54% of target',
        lastMetricDate: '2025-03-15',
        flights: 1,
        window: '2025-03-05 → 2025-04-04'
      },
      {
        id: 'camp-highrise',
        name: 'Highrise Concierge',
        status: 'Paused',
        objective: 'Sustainability upsell',
        spend: '£8.1k',
        spendChange: '-£0.4k',
        conversions: '72',
        conversionsChange: '+4',
        cpa: '£113',
        roas: '196%',
        roasChange: '-3%',
        pacing: 'Paused for creative refresh',
        lastMetricDate: '2025-03-12',
        flights: 1,
        window: '2025-02-20 → 2025-03-22'
      }
    ],
    invoices: [
      { invoiceNumber: 'INV-9021', campaign: 'Retail Surge Q2', amountDue: '£7,800', status: 'Issued', dueDate: '2025-03-28' },
      { invoiceNumber: 'INV-9017', campaign: 'Healthcare Response', amountDue: '£6,200', status: 'Paid', dueDate: '2025-03-12' },
      { invoiceNumber: 'INV-9009', campaign: 'Highrise Concierge', amountDue: '£5,400', status: 'Overdue', dueDate: '2025-03-10' }
    ],
    alerts: [
      {
        title: 'Overspend signal • Retail Surge Q2',
        severity: 'Warning',
        description: 'Flight A tracking 12% above pacing. Review bid caps for weekend slots.',
        detectedAt: '2025-03-15',
        flight: 'Flight A'
      },
      {
        title: 'No-spend • Healthcare Response',
        severity: 'Info',
        description: 'Morning window under-delivered impressions. Check placement availability.',
        detectedAt: '2025-03-16',
        flight: 'Launch window'
      },
      {
        title: 'Invoice INV-9009 overdue',
        severity: 'Warning',
        description: '£1,200 outstanding. Payment required to resume paused creatives.',
        detectedAt: '2025-03-14',
        flight: 'Billing'
      }
    ],
    recommendations: [
      {
        title: 'Extend weekend bids',
        description: 'Weekend conversion rate +18% vs weekday. Increase caps Friday-Sunday.',
        action: 'Optimise pacing'
      },
      {
        title: 'Refresh paused creative',
        description: 'Highrise Concierge creative fatigue detected. Rotate new asset pack.',
        action: 'Launch creative update'
      },
      {
        title: 'Resolve outstanding invoice',
        description: 'Clear overdue balance to unlock concierge remarketing flight.',
        action: 'Open billing hub'
      }
    ],
    timeline: [
      { title: 'Flight A • Retail Surge Q2', status: 'Active', start: '2025-03-01', end: '2025-03-21', budget: '£24k' },
      { title: 'Flight B • Retail Surge Q2', status: 'Scheduled', start: '2025-03-22', end: '2025-04-05', budget: '£18k' },
      { title: 'Healthcare Response Launch', status: 'Active', start: '2025-03-05', end: '2025-04-04', budget: '£22k' },
      { title: 'Highrise Concierge Creative QA', status: 'Paused', start: '2025-03-12', end: '2025-03-19', budget: '£9k' }
    ],
    pricingModels: [
      { id: 'ppc', label: 'Pay-per-click (PPC)', spend: '£48.2k', unitCost: '£0.86', unitLabel: 'Cost per click', performance: '3.1% CTR', status: 'Scaling' },
      { id: 'pp-conversion', label: 'Pay-per-conversion', spend: '£48.2k', unitCost: '£137', unitLabel: 'Cost per conversion', performance: '62 jobs attributed', status: 'Scaling' },
      { id: 'ppi', label: 'Pay-per-impression (PPI)', spend: '£48.2k', unitCost: '£26', unitLabel: 'CPM', performance: '1.8M impressions', status: 'Steady' }
    ],
    channelMix: [
      { id: 'marketplace_search', label: 'Marketplace & Search', spend: '£26.4k', share: '55%', performance: '6.4% CVR', status: 'Scaling', campaigns: 2 },
      { id: 'conversion', label: 'Conversion & Remarketing', spend: '£14.6k', share: '30%', performance: '5.9% CVR', status: 'Steady', campaigns: 1 },
      { id: 'awareness_display', label: 'Awareness & Display', spend: '£7.2k', share: '15%', performance: '1.8% CVR', status: 'Test', campaigns: 1 }
    ],
    targeting: [
      { id: 'region-0', label: 'Greater London', metric: '28 jobs', share: '45%', status: 'Primary', helper: 'Regional reach from Fixnado Ads' },
      { id: 'region-1', label: 'Midlands corridor', metric: '14 jobs', share: '23%', status: 'Scaling', helper: 'Regional reach from Fixnado Ads' },
      { id: 'property-0', label: 'Commercial offices', metric: '18 jobs', share: '29%', status: 'High intent', helper: 'Property segment performance' },
      { id: 'automation', label: 'Auto-matched routing', metric: '42% of ads jobs', share: '42%', status: 'Steady', helper: 'Automation coverage for ad-sourced jobs' }
    ],
    creativeInsights: [
      {
        id: 'signal-overspend',
        label: 'Overspend signal',
        severity: 'Warning',
        message: 'Retail Surge Q2 pacing +12% vs target in weekend flights.',
        detectedAt: '2025-03-15'
      },
      {
        id: 'ctr-health',
        label: 'Click-through rate',
        severity: 'Healthy',
        message: 'CTR 3.1% across Fixnado marketplace placements.',
        detectedAt: '2025-03-16'
      },
      {
        id: 'cvr-health',
        label: 'Conversion rate',
        severity: 'Warning',
        message: 'CVR 6.2% with 62 bookings attributed this window.',
        detectedAt: '2025-03-16'
      }
    ]
  }
};

export default providerAdsSection;
