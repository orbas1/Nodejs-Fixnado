import ProviderAdsWorkspace from '../modules/providerAds/components/ProviderAdsWorkspace.jsx';

const campaigns = [
  {
    id: 'cmp-spring',
    name: 'Spring boiler boost',
    status: 'active',
    objective: 'Drive emergency boiler repair bookings',
    campaignType: 'ppc',
    pacingStrategy: 'even',
    bidStrategy: 'cpc',
    currency: 'GBP',
    totalBudget: 25000,
    dailySpendCap: 1200,
    spend: 12560,
    revenue: 43820,
    impressions: 248000,
    clicks: 21340,
    conversions: 940,
    ctr: 0.086,
    cvr: 0.044,
    roas: 3.49,
    pacing: 0.50,
    startAt: '2025-04-01T08:00:00.000Z',
    endAt: '2025-06-30T23:59:59.000Z',
    metadata: { goal: 'Own boiler emergencies heading into spring.' },
    flights: [
      {
        id: 'flt-launch',
        name: 'Launch burst',
        status: 'active',
        startAt: '2025-04-01T08:00:00.000Z',
        endAt: '2025-04-30T23:59:59.000Z',
        budget: 12000,
        dailySpendCap: 600
      },
      {
        id: 'flt-retarget',
        name: 'Retargeting cadence',
        status: 'scheduled',
        startAt: '2025-05-15T08:00:00.000Z',
        endAt: '2025-06-30T23:59:59.000Z',
        budget: 13000,
        dailySpendCap: 650
      }
    ],
    creatives: [
      {
        id: 'crt-hero',
        campaignId: 'cmp-spring',
        name: 'Boiler hero image',
        format: 'image',
        status: 'active',
        headline: 'Emergency boiler repair in 60 minutes',
        description: 'Certified Gas Safe engineers on-call across North London.',
        callToAction: 'Book repair',
        assetUrl: 'https://cdn.fixnado.dev/assets/boiler-hero.jpg',
        thumbnailUrl: 'https://cdn.fixnado.dev/assets/boiler-hero-thumb.jpg',
        flightId: 'flt-launch',
        flightName: 'Launch burst',
        metadata: { tone: 'trust-building' },
        updatedAt: '2025-05-08T10:45:00.000Z'
      },
      {
        id: 'crt-video',
        campaignId: 'cmp-spring',
        name: 'Technician walkthrough',
        format: 'video',
        status: 'review',
        headline: 'See how we repair boilers',
        description: 'Behind the scenes with our lead engineer team.',
        callToAction: 'Watch now',
        assetUrl: 'https://cdn.fixnado.dev/assets/boiler-walkthrough.mp4',
        thumbnailUrl: 'https://cdn.fixnado.dev/assets/boiler-walkthrough-thumb.jpg',
        flightId: null,
        flightName: 'Campaign level',
        metadata: { durationSeconds: 45 },
        updatedAt: '2025-05-07T14:22:00.000Z'
      }
    ],
    audienceSegments: [
      {
        id: 'seg-high-intent',
        campaignId: 'cmp-spring',
        name: 'High-intent homeowners',
        segmentType: 'crm',
        status: 'active',
        sizeEstimate: 12480,
        engagementRate: 0.182,
        syncedAt: '2025-05-08T17:35:00.000Z',
        metadata: { source: 'CRM sync', notes: 'Boiler warranty expiring in < 6 months' }
      },
      {
        id: 'seg-renters',
        campaignId: 'cmp-spring',
        name: 'Renters searching emergency help',
        segmentType: 'marketplace',
        status: 'paused',
        sizeEstimate: 8450,
        engagementRate: 0.094,
        syncedAt: '2025-05-04T09:22:00.000Z',
        metadata: { source: 'Gigvora intent signals' }
      }
    ],
    placements: [
      {
        id: 'plc-marketplace',
        campaignId: 'cmp-spring',
        flightId: 'flt-launch',
        flightName: 'Launch burst',
        channel: 'marketplace',
        format: 'native',
        status: 'active',
        bidAmount: 38.5,
        bidCurrency: 'GBP',
        cpm: 21.75,
        inventorySource: 'Gigvora marketplace hero',
        metadata: { position: 'homepage hero', inventoryTier: 'premium' },
        updatedAt: '2025-05-09T12:03:00.000Z'
      },
      {
        id: 'plc-social',
        campaignId: 'cmp-spring',
        flightId: 'flt-retarget',
        flightName: 'Retargeting cadence',
        channel: 'social',
        format: 'story',
        status: 'planned',
        bidAmount: 12.5,
        bidCurrency: 'GBP',
        cpm: 8.2,
        inventorySource: 'Gigvora social alliance',
        metadata: { objective: 'reach retarget' },
        updatedAt: '2025-05-06T08:15:00.000Z'
      }
    ],
    invoices: [
      {
        id: 'inv-2025-001',
        campaignId: 'cmp-spring',
        campaignName: 'Spring boiler boost',
        invoiceNumber: 'INV-2025-001',
        status: 'issued',
        currency: 'GBP',
        amountDue: 4200,
        amountPaid: 1200,
        dueDate: '2025-05-20',
        issuedAt: '2025-05-01T09:00:00.000Z',
        periodStart: '2025-04-01',
        periodEnd: '2025-04-30',
        metadata: { period: 'Apr 2025' }
      }
    ],
    fraudSignals: [
      {
        id: 'sig-click-flood',
        campaignId: 'cmp-spring',
        flightId: 'flt-launch',
        title: 'Click flood detected • Spring boiler boost',
        signalType: 'click_anomaly',
        severity: 'medium',
        detectedAt: '2025-05-07T21:15:00.000Z',
        metadata: { variance: '+185% vs forecast', region: 'Camden' }
      }
    ],
    targetingRules: [
      {
        id: 'rule-postcode',
        ruleType: 'postcode',
        operator: 'include',
        payload: { postcodes: ['NW1', 'NW3', 'N7', 'N8'] }
      },
      {
        id: 'rule-radius',
        ruleType: 'radius',
        operator: 'include',
        payload: { centre: { lat: 51.556, lng: -0.279 }, radiusKm: 18 }
      }
    ]
  },
  {
    id: 'cmp-summer',
    name: 'Summer service plan',
    status: 'scheduled',
    objective: 'Sell annual boiler service plans',
    campaignType: 'awareness',
    pacingStrategy: 'lifetime',
    bidStrategy: 'cpm',
    currency: 'GBP',
    totalBudget: 18000,
    dailySpendCap: 520,
    spend: 6400,
    revenue: 15800,
    impressions: 312000,
    clicks: 11250,
    conversions: 380,
    ctr: 0.036,
    cvr: 0.034,
    roas: 2.47,
    pacing: 0.36,
    startAt: '2025-05-20T08:00:00.000Z',
    endAt: '2025-08-31T23:59:59.000Z',
    metadata: { goal: 'Grow subscription base before autumn surge.' },
    flights: [
      {
        id: 'flt-awareness',
        name: 'Awareness wave',
        status: 'scheduled',
        startAt: '2025-05-20T08:00:00.000Z',
        endAt: '2025-07-15T23:59:59.000Z',
        budget: 9000,
        dailySpendCap: 320
      },
      {
        id: 'flt-offer',
        name: 'Offer reminder',
        status: 'planned',
        startAt: '2025-07-16T08:00:00.000Z',
        endAt: '2025-08-31T23:59:59.000Z',
        budget: 9000,
        dailySpendCap: 320
      }
    ],
    creatives: [
      {
        id: 'crt-family',
        campaignId: 'cmp-summer',
        name: 'Family at home',
        format: 'carousel',
        status: 'draft',
        headline: 'Keep hot water guaranteed all year',
        description: 'Service plans from £12.99/month with 24/7 response.',
        callToAction: 'Explore plans',
        assetUrl: 'https://cdn.fixnado.dev/assets/service-plan-carousel.json',
        thumbnailUrl: 'https://cdn.fixnado.dev/assets/service-plan-thumb.jpg',
        flightId: 'flt-awareness',
        flightName: 'Awareness wave',
        metadata: { frames: 4 },
        updatedAt: '2025-05-05T11:12:00.000Z'
      }
    ],
    audienceSegments: [
      {
        id: 'seg-service-history',
        campaignId: 'cmp-summer',
        name: 'Past service customers',
        segmentType: 'crm',
        status: 'draft',
        sizeEstimate: 6250,
        engagementRate: 0.162,
        syncedAt: '2025-05-06T16:05:00.000Z',
        metadata: { recencyWindowDays: 540 }
      }
    ],
    placements: [
      {
        id: 'plc-email',
        campaignId: 'cmp-summer',
        flightId: 'flt-awareness',
        flightName: 'Awareness wave',
        channel: 'email',
        format: 'newsletter takeover',
        status: 'planned',
        bidAmount: 6.75,
        bidCurrency: 'GBP',
        cpm: 6.75,
        inventorySource: 'Gigvora homeowner digest',
        metadata: { sendWindows: ['Tue', 'Thu'] },
        updatedAt: '2025-05-09T08:42:00.000Z'
      }
    ],
    invoices: [
      {
        id: 'inv-2025-002',
        campaignId: 'cmp-summer',
        campaignName: 'Summer service plan',
        invoiceNumber: 'INV-2025-002',
        status: 'draft',
        currency: 'GBP',
        amountDue: 0,
        amountPaid: 0,
        dueDate: '2025-06-30',
        issuedAt: null,
        periodStart: '2025-05-01',
        periodEnd: '2025-05-31',
        metadata: { period: 'May 2025 forecast' }
      }
    ],
    fraudSignals: [
      {
        id: 'sig-latency',
        campaignId: 'cmp-summer',
        flightId: 'flt-awareness',
        title: 'Creative moderation pending • Summer service plan',
        signalType: 'creative_review',
        severity: 'low',
        detectedAt: '2025-05-08T07:45:00.000Z',
        metadata: { reviewerEtaHours: 6 }
      }
    ],
    targetingRules: [
      {
        id: 'rule-property-type',
        ruleType: 'property_type',
        operator: 'include',
        payload: { types: ['owner_occupied', 'landlord'] }
      }
    ]
  }
];

const sampleWorkspace = {
  generatedAt: '2025-05-09T09:15:00.000Z',
  company: {
    id: 'demo-company',
    name: 'North London Plumbing Cooperative'
  },
  overview: {
    spendMonthToDate: 18960,
    revenueMonthToDate: 59620,
    impressions: 560000,
    clicks: 32590,
    conversions: 1320,
    ctr: 0.058,
    cvr: 0.040,
    roas: 3.14,
    lastMetricAt: '2025-05-09T08:45:00.000Z'
  },
  campaigns,
  creatives: campaigns.flatMap((campaign) =>
    campaign.creatives.map((creative) => ({
      ...creative,
      campaignName: campaign.name
    }))
  ),
  audienceSegments: campaigns.flatMap((campaign) =>
    campaign.audienceSegments.map((segment) => ({
      ...segment,
      campaignName: campaign.name
    }))
  ),
  placements: campaigns.flatMap((campaign) =>
    campaign.placements.map((placement) => ({
      ...placement,
      campaignName: campaign.name
    }))
  ),
  invoices: campaigns
    .flatMap((campaign) => campaign.invoices)
    .map((invoice) => ({ ...invoice }))
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')),
  fraudSignals: campaigns
    .flatMap((campaign) => campaign.fraudSignals)
    .map((signal) => ({ ...signal }))
    .sort((a, b) => (b.detectedAt || '').localeCompare(a.detectedAt || ''))
};

export default function ProviderAdsDevPreview() {
  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-7xl space-y-8 px-6">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Dev playground</p>
          <h1 className="text-2xl font-semibold text-primary">Provider ads workspace</h1>
          <p className="text-sm text-slate-600">
            Interactive mock of the Gigvora provider ads control centre using representative sample data.
          </p>
        </header>
        <ProviderAdsWorkspace companyId="demo-company" initialData={sampleWorkspace} />
      </div>
    </div>
  );
}

