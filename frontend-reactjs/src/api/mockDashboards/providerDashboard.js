import { createWindow } from './helpers.js';

export const providerDashboard = {
  persona: 'provider',
  name: 'Provider Operations Studio',
  headline: 'Monitor revenue, crew utilisation, availability, assets, and automation in one studio.',
  window: createWindow(),
    metadata: {
      provider: {
        id: 'PRV-1108',
        name: 'Metro Ops Collective',
        tradingName: 'Metro Ops Collective',
        slug: 'metro-ops',
        supportEmail: 'support@metro-ops.co.uk',
        supportPhone: '+44 20 7123 4567',
        region: 'Greater London'
      },
      totals: {
        crews: 7,
        utilisation: '78%',
        revenueMonthToDate: '£312k',
        outstandingBalance: '£28k',
        satisfaction: '4.6★'
      },
      features: {
        ads: {
          available: true,
          level: 'manage',
          label: 'Provider Ads Manager',
          features: ['campaigns', 'billing', 'guardrails', 'targeting']
        }
      }
    },
  navigation: [
    {
      id: 'overview',
      icon: 'profile',
      label: 'Profile Overview',
      description: 'Revenue, utilisation, and customer quality metrics.',
      type: 'overview',
      analytics: {
        metrics: [
          { label: 'First response', value: '12 mins', change: '-3 mins vs prior window', trend: 'down' },
          { label: 'Crew utilisation', value: '78%', change: '+5 pts vs prior window', trend: 'up' },
          { label: 'Revenue processed', value: '£312k', change: '+£24k vs forecast', trend: 'up' },
          { label: 'Satisfaction', value: '4.6★', change: '+0.1 vs prior window', trend: 'up' }
        ],
        charts: [
          {
            id: 'response-trend',
            title: 'Response Time Trend',
            description: 'Median minutes to acknowledge new jobs.',
            type: 'area',
            dataKey: 'response',
            data: [
              { name: 'Week 1', response: 15 },
              { name: 'Week 2', response: 14 },
              { name: 'Week 3', response: 13 },
              { name: 'Week 4', response: 12 }
            ]
          },
          {
            id: 'revenue-pipeline',
            title: 'Revenue vs Outstanding',
            description: 'Recognised revenue compared with open invoices.',
            type: 'bar',
            dataKey: 'recognised',
            secondaryKey: 'outstanding',
            data: [
              { name: 'Week 1', recognised: 68000, outstanding: 12000 },
              { name: 'Week 2', recognised: 72000, outstanding: 11000 },
              { name: 'Week 3', recognised: 78000, outstanding: 10000 },
              { name: 'Week 4', recognised: 74000, outstanding: 9000 }
            ]
          },
          {
            id: 'crew-health',
            title: 'Crew Health Index',
            description: 'Readiness, overtime, and relief per crew.',
            type: 'line',
            dataKey: 'index',
            data: [
              { name: 'Crew Alpha', index: 82 },
              { name: 'Crew Beta', index: 74 },
              { name: 'Crew Gamma', index: 80 },
              { name: 'Crew Delta', index: 76 }
            ]
          }
        ],
        upcoming: [
          { title: 'Premium mall HVAC upgrade', when: '20 Mar · 07:30', status: 'Crew Alpha assigned' },
          { title: 'Quarterly board review', when: '21 Mar · 16:00', status: 'Finance pack in progress' },
          { title: 'Fleet vehicle inspection', when: '22 Mar · 10:00', status: 'Logistics preparing' }
        ],
        insights: [
          'Ops pods with utilisation below 70% should share crew members mid-week.',
          'Outstanding invoices fall under finance SLA — follow up before Friday.',
          'Customer satisfaction is trending upward after new completion surveys.',
          'Automation rules are saving 6.4 hours per week across concierge tasks.'
        ]
      }
    },
    {
      id: 'calendar',
      icon: 'calendar',
      label: 'Operations Calendar',
      description: 'Multi-crew calendar including shared assets and client milestones.',
      type: 'calendar',
      data: {
        month: 'March 2025',
        legend: [
          { label: 'Crew dispatch', status: 'confirmed' },
          { label: 'Asset prep', status: 'travel' },
          { label: 'Standby window', status: 'standby' },
          { label: 'Escalation', status: 'risk' }
        ],
        weeks: [
          [
            { date: '24', isCurrentMonth: false, events: [] },
            { date: '25', isCurrentMonth: false, events: [] },
            { date: '26', isCurrentMonth: false, events: [] },
            { date: '27', isCurrentMonth: false, events: [] },
            { date: '28', isCurrentMonth: false, events: [] },
            { date: '1', isCurrentMonth: true, events: [{ title: 'Crew onboarding', status: 'standby', time: 'All day' }] },
            { date: '2', isCurrentMonth: true, events: [] }
          ],
          [
            { date: '3', isCurrentMonth: true, events: [{ title: 'Depot asset checks', status: 'travel', time: '07:00' }] },
            { date: '4', isCurrentMonth: true, events: [{ title: 'Retail lighting retrofit', status: 'confirmed', time: '09:00' }] },
            { date: '5', isCurrentMonth: true, events: [{ title: 'Hospital readiness review', status: 'standby', time: '15:00' }] },
            { date: '6', isCurrentMonth: true, events: [{ title: 'Client executive review', status: 'risk', time: '16:30' }] },
            { date: '7', isCurrentMonth: true, events: [] },
            { date: '8', isCurrentMonth: true, events: [{ title: 'Weekend crew standby', status: 'standby', time: 'All day' }] },
            { date: '9', isCurrentMonth: true, events: [] }
          ],
          [
            { date: '10', isCurrentMonth: true, events: [{ title: 'Fleet sanitation', status: 'confirmed', time: '07:30' }] },
            { date: '11', isCurrentMonth: true, events: [{ title: 'Bid defence for airport', status: 'standby', time: '14:00' }] },
            { date: '12', isCurrentMonth: true, events: [{ title: 'Escalation watch', status: 'risk', time: 'Operations' }] },
            { date: '13', isCurrentMonth: true, events: [{ title: 'Automation tune-up', status: 'standby', time: 'All day' }] },
            { date: '14', isCurrentMonth: true, events: [] },
            { date: '15', isCurrentMonth: true, events: [{ title: 'Asset restock', status: 'travel', time: '11:00' }] },
            { date: '16', isCurrentMonth: true, events: [] }
          ],
          [
            { date: '17', isCurrentMonth: true, events: [{ title: 'Board meeting dry-run', status: 'standby', time: '09:00' }] },
            { date: '18', isCurrentMonth: true, events: [{ title: 'Premium mall HVAC', status: 'confirmed', time: '07:30' }] },
            { date: '19', isCurrentMonth: true, events: [{ title: 'Escalation: invoice dispute', status: 'risk', time: '16:00' }] },
            { date: '20', isCurrentMonth: true, events: [{ title: 'Supplier onboarding', status: 'standby', time: '14:00' }] },
            { date: '21', isCurrentMonth: true, events: [{ title: 'Quarterly board review', status: 'confirmed', time: '16:00' }] },
            { date: '22', isCurrentMonth: true, events: [{ title: 'Fleet inspection', status: 'travel', time: '10:00' }] },
            { date: '23', isCurrentMonth: true, events: [] }
          ],
          [
            { date: '24', isCurrentMonth: true, events: [{ title: 'Retail rollout phase 2', status: 'confirmed', time: '08:00' }] },
            { date: '25', isCurrentMonth: true, events: [{ title: 'Automation sprint review', status: 'standby', time: '15:00' }] },
            { date: '26', isCurrentMonth: true, events: [{ title: 'Escrow pack review', status: 'risk', time: 'Finance' }] },
            { date: '27', isCurrentMonth: true, events: [{ title: 'Crew rotation planning', status: 'standby', time: '13:00' }] },
            { date: '28', isCurrentMonth: true, events: [{ title: 'Asset dispatch: MEWP', status: 'travel', time: '06:30' }] },
            { date: '29', isCurrentMonth: true, events: [] },
            { date: '30', isCurrentMonth: true, events: [{ title: 'Weekend support sweep', status: 'standby', time: 'All day' }] }
          ]
        ]
      }
    },
    {
      id: 'crew-availability',
      icon: 'availability',
      label: 'Crew Availability',
      description: 'Understand live crew capacity, travel, leave, and overtime.',
      type: 'availability',
      data: {
        summary: { openSlots: '6', standbyCrews: '2', followUps: '2' },
        days: ['Mon 17', 'Tue 18', 'Wed 19', 'Thu 20', 'Fri 21'],
        resources: [
          {
            name: 'Crew Alpha',
            role: 'HVAC specialists',
            status: 'High utilisation',
            allocations: [
              { day: 'Mon 17', status: 'Booked', window: '06:30-16:00' },
              { day: 'Tue 18', status: 'Booked', window: '07:00-17:30' },
              { day: 'Wed 19', status: 'Travel', window: '07:00-09:00' },
              { day: 'Thu 20', status: 'Standby', window: 'All day' },
              { day: 'Fri 21', status: 'Booked', window: '06:30-15:00' }
            ]
          },
          {
            name: 'Crew Beta',
            role: 'Sanitation & high-risk',
            status: 'Cross-covering Alpha',
            allocations: [
              { day: 'Mon 17', status: 'Standby', window: 'All day' },
              { day: 'Tue 18', status: 'Booked', window: '08:00-18:00' },
              { day: 'Wed 19', status: 'Booked', window: '08:00-18:00' },
              { day: 'Thu 20', status: 'Booked', window: '08:00-18:00' },
              { day: 'Fri 21', status: 'OOO', window: 'Crew rest' }
            ]
          },
          {
            name: 'Crew Gamma',
            role: 'Retail rollout',
            status: 'On project',
            allocations: [
              { day: 'Mon 17', status: 'Booked', window: '09:00-19:00' },
              { day: 'Tue 18', status: 'Travel', window: '09:00-11:00' },
              { day: 'Wed 19', status: 'Booked', window: '09:00-19:00' },
              { day: 'Thu 20', status: 'Booked', window: '09:00-19:00' },
              { day: 'Fri 21', status: 'Booked', window: '09:00-19:00' }
            ]
          }
        ]
      }
    },
    {
      id: 'workboard',
      icon: 'pipeline',
      label: 'Service Pipeline',
      description: 'Track bookings through assignment, delivery, and billing.',
      type: 'board',
      data: {
        columns: [
          {
            title: 'New leads',
            items: [
              { title: 'Airport concourse polish', owner: 'Sales', value: '£18k', eta: 'Proposal out' },
              { title: 'Industrial kitchen retrofit', owner: 'Sales', value: '£26k', eta: 'Bid review 19 Mar' }
            ]
          },
          {
            title: 'Crew scheduling',
            items: [
              { title: 'Hospital isolation ward', owner: 'Ops Pod Beta', value: '£32k', eta: 'Crew confirm 18 Mar' },
              { title: 'City hall facade clean', owner: 'Ops Pod Delta', value: '£14k', eta: 'Weather hold' }
            ]
          },
          {
            title: 'In delivery',
            items: [
              { title: 'Retail chain rollout', owner: 'Crew Gamma', value: '£56k', eta: 'SLA check 3h' },
              { title: 'University labs sanitisation', owner: 'Crew Alpha', value: '£22k', eta: 'Day 2 of 3' }
            ]
          },
          {
            title: 'Billing review',
            items: [
              { title: 'Logistics warehouse ramp', owner: 'Finance', value: '£19k', eta: 'Awaiting punch list' },
              { title: 'Boutique hotel refit', owner: 'Finance', value: '£12k', eta: 'Customer feedback pending' }
            ]
          }
        ]
      }
    },
    {
      id: 'rentals',
      icon: 'assets',
      label: 'Asset Lifecycle',
      description: 'Equipment tied to service delivery and inspection cadence.',
      type: 'table',
      data: {
        headers: ['Agreement', 'Asset', 'Status', 'Crew', 'Return milestone'],
        rows: [
          ['AGR-5412', 'Air scrubber kit', 'In delivery', 'Crew Gamma', 'Return 25 Mar'],
          ['AGR-5406', 'MEWP platform', 'Inspection overdue', 'Crew Alpha', 'Inspection due 17 Mar'],
          ['AGR-5389', 'Water-fed poles', 'Ready for pickup', 'Crew Delta', 'Collection scheduled'],
          ['AGR-5371', 'Fogging units', 'Awaiting sanitisation', 'Crew Beta', 'Prep 20 Mar']
        ]
      }
    },
    {
      id: 'inventory',
      icon: 'assets',
      label: 'Tools & Materials',
      description: 'Inventory availability, utilisation, and alert posture.',
      type: 'inventory',
      data: {
        summary: [
          { id: 'available', label: 'Available units', value: 84, helper: '12 SKUs tracked', tone: 'info' },
          { id: 'reserved', label: 'Reserved', value: 18, helper: '102 on hand', tone: 'accent' },
          { id: 'alerts', label: 'Alerts', value: 2, helper: 'Action required', tone: 'warning' }
        ],
        groups: [
          {
            id: 'materials',
            label: 'Materials',
            items: [
              {
                id: 'mat-1',
                name: 'Bio-cleanse concentrate',
                sku: 'MAT-BC-01',
                category: 'Sanitation',
                status: 'healthy',
                available: 36,
                onHand: 48,
                reserved: 12,
                safetyStock: 8,
                unitType: 'litres',
                condition: 'excellent',
                location: 'Docklands depot',
                nextMaintenanceDue: '2025-04-12',
                notes: 'Lot #221-B stable. Auto-reorder enabled.',
                activeAlerts: 0,
                activeRentals: 0
              },
              {
                id: 'mat-2',
                name: 'HVAC filter packs',
                sku: 'MAT-HVAC-07',
                category: 'HVAC',
                status: 'low_stock',
                available: 8,
                onHand: 24,
                reserved: 16,
                safetyStock: 6,
                unitType: 'packs',
                condition: 'good',
                location: 'North hub',
                nextMaintenanceDue: '2025-03-28',
                notes: 'Vendor replenishment ETA 3 days.',
                activeAlerts: 1,
                alertSeverity: 'warning',
                activeRentals: 0
              }
            ]
          },
          {
            id: 'tools',
            label: 'Tools',
            items: [
              {
                id: 'tool-1',
                name: 'Thermal imaging kit',
                sku: 'TL-THERM-04',
                category: 'Diagnostics',
                status: 'healthy',
                available: 6,
                onHand: 10,
                reserved: 4,
                safetyStock: 3,
                unitType: 'kits',
                condition: 'excellent',
                location: 'Fleet workshop',
                nextMaintenanceDue: '2025-05-02',
                rentalRate: 180,
                rentalRateCurrency: 'GBP',
                depositAmount: 450,
                depositCurrency: 'GBP',
                notes: 'Calibration synced weekly.',
                activeAlerts: 0,
                activeRentals: 2
              },
              {
                id: 'tool-2',
                name: 'Tower lighting rig',
                sku: 'TL-LIGHT-12',
                category: 'Access',
                status: 'stockout',
                available: 0,
                onHand: 4,
                reserved: 4,
                safetyStock: 2,
                unitType: 'units',
                condition: 'needs_service',
                location: 'Logistics yard',
                nextMaintenanceDue: '2025-03-22',
                rentalRate: 260,
                rentalRateCurrency: 'GBP',
                depositAmount: 600,
                depositCurrency: 'GBP',
                notes: 'Inspection overdue • awaiting parts.',
                activeAlerts: 2,
                alertSeverity: 'critical',
                activeRentals: 3
              }
            ]
          }
        ]
      }
    },
    {
      id: 'servicemen',
      icon: 'crew',
      label: 'Serviceman Directory',
      description: 'Manage roster, certifications, and contact details.',
      type: 'table',
      data: {
        headers: ['Name', 'Role', 'Availability', 'Certifications', 'Next training'],
        rows: [
          ['Jordan Miles', 'Lead technician', 'Booked · openings Thu', 'Confined space, HVAC Level 3', '02 Apr 2025'],
          ['Priya Desai', 'Crew lead', 'Standby Tue', 'IPAF, NICEIC', '18 Apr 2025'],
          ['Malik Ward', 'Apprentice', 'Shadowing', 'PPE, Ladder safety', 'Weekly toolbox'],
          ['Ana Rodrigues', 'Specialist', 'Booked', 'Cleanroom, Hazardous waste', '30 Mar 2025']
        ]
      }
    },
      {
        id: 'fixnado-ads',
        icon: 'analytics',
        label: 'Fixnado Ads',
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
          {
            title: 'Flight A • Retail Surge Q2',
            status: 'Active',
            start: '2025-03-01',
            end: '2025-03-21',
            budget: '£24k'
          },
          {
            title: 'Flight B • Retail Surge Q2',
            status: 'Scheduled',
            start: '2025-03-22',
            end: '2025-04-05',
            budget: '£18k'
          },
          {
            title: 'Healthcare Response Launch',
            status: 'Active',
            start: '2025-03-05',
            end: '2025-04-04',
            budget: '£22k'
          },
          {
            title: 'Highrise Concierge Creative QA',
            status: 'Paused',
            start: '2025-03-12',
            end: '2025-03-19',
            budget: '£9k'
          }
        ],
        pricingModels: [
          {
            id: 'ppc',
            label: 'Pay-per-click (PPC)',
            spend: '£48.2k',
            unitCost: '£0.86',
            unitLabel: 'Cost per click',
            performance: '3.1% CTR',
            status: 'Scaling'
          },
          {
            id: 'pp-conversion',
            label: 'Pay-per-conversion',
            spend: '£48.2k',
            unitCost: '£137',
            unitLabel: 'Cost per conversion',
            performance: '62 jobs attributed',
            status: 'Scaling'
          },
          {
            id: 'ppi',
            label: 'Pay-per-impression (PPI)',
            spend: '£48.2k',
            unitCost: '£26',
            unitLabel: 'CPM',
            performance: '1.8M impressions',
            status: 'Steady'
          }
        ],
        channelMix: [
          {
            id: 'marketplace_search',
            label: 'Marketplace & Search',
            spend: '£26.4k',
            share: '55%',
            performance: '6.4% CVR',
            status: 'Scaling',
            campaigns: 2
          },
          {
            id: 'conversion',
            label: 'Conversion & Remarketing',
            spend: '£14.6k',
            share: '30%',
            performance: '5.9% CVR',
            status: 'Steady',
            campaigns: 1
          },
          {
            id: 'awareness_display',
            label: 'Awareness & Display',
            spend: '£7.2k',
            share: '15%',
            performance: '1.8% CVR',
            status: 'Test',
            campaigns: 1
          }
        ],
        targeting: [
          {
            id: 'region-0',
            label: 'Greater London',
            metric: '28 jobs',
            share: '45%',
            status: 'Primary',
            helper: 'Regional reach from Fixnado Ads'
          },
          {
            id: 'region-1',
            label: 'Midlands corridor',
            metric: '14 jobs',
            share: '23%',
            status: 'Scaling',
            helper: 'Regional reach from Fixnado Ads'
          },
          {
            id: 'property-0',
            label: 'Commercial offices',
            metric: '18 jobs',
            share: '29%',
            status: 'High intent',
            helper: 'Property segment performance'
          },
          {
            id: 'automation',
            label: 'Auto-matched routing',
            metric: '42% of ads jobs',
            share: '42%',
            status: 'Steady',
            helper: 'Automation coverage for ad-sourced jobs'
          }
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
    },
    {
      id: 'finance',
      icon: 'finance',
      label: 'Revenue & Billing',
      description: 'Cashflow pacing, invoice status, and margin insights.',
      type: 'grid',
      data: {
        cards: [
          {
            title: 'Cash position',
            details: ['£212k cash on hand', '£58k payable in 10 days', '£312k receivables'],
            accent: 'from-emerald-100 via-white to-white'
          },
          {
            title: 'Invoice health',
            details: ['18 invoices this month', '2 invoices >10 days', 'Average payment 6.2 days'],
            accent: 'from-sky-100 via-white to-white'
          },
          {
            title: 'Margin focus',
            details: ['Gross margin 41%', 'Labour share 46%', 'Material cost +6% vs plan'],
            accent: 'from-amber-100 via-white to-white'
          }
        ]
      }
    },
    {
      id: 'settings',
      icon: 'automation',
      label: 'Automation Settings',
      description: 'Workflows and AI assistance powering the studio.',
      type: 'settings',
      data: {
        panels: [
          {
            id: 'automations',
            title: 'Automation playbooks',
            description: 'Control AI routing, bidding, and concierge assistance.',
            items: [
              { id: 'auto-routing', label: 'AI crew routing', type: 'toggle', enabled: true, helper: 'Optimises travel buffers' },
              { id: 'auto-bid', label: 'Automated bid composer', type: 'toggle', enabled: false, helper: 'Requires finance approval' }
            ]
          },
          {
            id: 'alerts',
            title: 'Alerting thresholds',
            description: 'Tune risk tolerances for escalations and SLA breaches.',
            items: [
              { id: 'sla-alert', label: 'SLA breach threshold', type: 'value', value: '< 4 hours', meta: 'Escalate to operations' },
              { id: 'invoice-alert', label: 'Invoice ageing threshold', type: 'value', value: '> 10 days', meta: 'Finance & ops' }
            ]
          }
        ]
      }
    }
  ]
};

export default providerDashboard;
