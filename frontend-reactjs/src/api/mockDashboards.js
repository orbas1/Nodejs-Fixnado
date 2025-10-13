const createWindow = () => ({
  label: 'Last 30 days',
  start: '2025-02-01T00:00:00Z',
  end: '2025-03-02T23:59:59Z',
  timezone: 'Europe/London'
});

const mockDashboards = {
  user: {
    persona: 'user',
    name: 'User Command Center',
    headline: 'Coordinate service orders, rentals, and support in a single workspace.',
    window: createWindow(),
    metadata: {
      user: {
        id: 'USR-2488',
        name: 'Avery Stone',
        email: 'avery@fixnado.com'
      },
      totals: {
        bookings: 18,
        activeBookings: 6,
        spend: '£24.8k',
        rentals: 4,
        disputes: 1,
        conversations: 12
      }
    },
    navigation: [
      {
        id: 'overview',
        label: 'Customer Overview',
        description: 'Bookings, spend, and support signals.',
        type: 'overview',
        sidebar: {
          badge: 'Live',
          status: { label: 'SLA healthy', tone: 'success' },
          highlights: [
            { label: 'Active jobs', value: '6' },
            { label: 'Escrow ready', value: '3' }
          ]
        },
        analytics: {
          metrics: [
            { label: 'Active jobs', value: '18', change: '+3 vs prev window', trend: 'up' },
            { label: 'Spend processed', value: '£24.8k', change: '+£4.2k vs prev window', trend: 'up' },
            { label: 'Completion rate', value: '94%', change: '+2 pts vs target', trend: 'up' },
            { label: 'Open disputes', value: '1', change: '-2 vs prev window', trend: 'down' }
          ],
          charts: [
            {
              id: 'jobs-by-week',
              title: 'Jobs by Week',
              description: 'Volume of bookings captured each week.',
              type: 'line',
              dataKey: 'count',
              data: [
                { name: 'Week 1', count: 4 },
                { name: 'Week 2', count: 6 },
                { name: 'Week 3', count: 3 },
                { name: 'Week 4', count: 5 }
              ]
            },
            {
              id: 'spend-vs-escrow',
              title: 'Spend vs Escrow Balance',
              description: 'Escrow releases compared to invoices this window.',
              type: 'bar',
              dataKey: 'invoices',
              secondaryKey: 'escrow',
              data: [
                { name: 'Week 1', invoices: 5200, escrow: 3800 },
                { name: 'Week 2', invoices: 6400, escrow: 5400 },
                { name: 'Week 3', invoices: 4100, escrow: 3200 },
                { name: 'Week 4', invoices: 6100, escrow: 5800 }
              ]
            }
          ],
          upcoming: [
            { title: 'HVAC seasonal service', when: '18 Mar · 09:00', status: 'Scheduled' },
            { title: 'Escrow release review', when: '19 Mar · 14:30', status: 'Pending approval' },
            { title: 'Community centre deep clean', when: '21 Mar · 07:30', status: 'Dispatch at risk' }
          ],
          insights: [
            'Leverage bundled callouts to keep travel time under 25 minutes.',
            'Add follow-up survey on completed smart-home installations.',
            'Escrow release ageing past 7 days dropped to one item.',
            'Two jobs remain in dispute review — align with operations lead.'
          ]
        }
      },
      {
        id: 'orders',
        label: 'Service Orders',
        description: 'Escrow, delivery, and follow-up pipeline.',
        type: 'board',
        sidebar: {
          badge: 'Pipeline',
          status: { label: '2 items need attention', tone: 'warning' },
          highlights: [
            { label: 'Awaiting assignment', value: '2' },
            { label: 'Disputes', value: '1' }
          ]
        },
        data: {
          columns: [
            {
              title: 'Requests',
              items: [
                { title: 'Retail lighting upgrade', owner: 'Downtown Core', value: '£1.8k', eta: 'Quote due in 6h' },
                { title: 'Office sanitisation', owner: 'Harbour Tower', value: '£920', eta: 'Needs crew assignment' }
              ]
            },
            {
              title: 'Scheduled',
              items: [
                { title: 'Community centre clean', owner: 'Zone B', value: '£1.4k', eta: 'Crew check-in 18 Mar · 07:00' },
                { title: 'Smart thermostat rollout', owner: 'Residential West', value: '£2.6k', eta: 'Kick-off 19 Mar · 10:00' }
              ]
            },
            {
              title: 'At Risk',
              items: [
                { title: 'Escrow release #4821', owner: 'Finance', value: '£1.1k', eta: 'Approval overdue' },
                { title: 'Pipe repair follow-up', owner: 'Ops escalation', value: '£780', eta: 'SLA breach in 4h' }
              ]
            },
            {
              title: 'Completed',
              items: [
                { title: 'Emergency plumbing', owner: 'Civic Centre', value: '£640', eta: 'Inspection passed' },
                { title: 'Solar panel clean', owner: 'City Schools', value: '£1.1k', eta: 'Feedback due 22 Mar' }
              ]
            }
          ]
        }
      },
      {
        id: 'rentals',
        label: 'Rental Assets',
        description: 'Track equipment associated with your jobs.',
        type: 'table',
        sidebar: {
          badge: 'Assets',
          status: { label: 'All rentals accounted for', tone: 'success' },
          highlights: [
            { label: 'Active rentals', value: '4' },
            { label: 'Inspections pending', value: '1' }
          ]
        },
        data: {
          headers: ['Rental', 'Asset', 'Status', 'Return Due', 'Deposit'],
          rows: [
            ['Rental #9821', 'Thermal imaging camera', 'In field', '20 Mar 2025', '£250'],
            ['Rental #9774', 'Dehumidifier set', 'Inspection pending', 'Returned 15 Mar', '£150'],
            ['Rental #9730', 'Lift platform', 'On hold', 'Extension requested', '£600']
          ]
        }
      },
      {
        id: 'account',
        label: 'Account & Support',
        description: 'Next best actions to keep everything running smoothly.',
        type: 'list',
        sidebar: {
          badge: 'Support',
          status: { label: 'Inbox at capacity', tone: 'warning' },
          highlights: [
            { label: 'Unanswered threads', value: '4' },
            { label: 'Satisfaction', value: '4.7★' }
          ]
        },
        data: {
          items: [
            {
              title: 'Share project photos for City Schools contract',
              description: 'Upload deliverable evidence for invoice #INV-1142.',
              status: 'Action required'
            },
            {
              title: 'Confirm insurance documentation',
              description: 'Liability certificate renewal due within 10 days.',
              status: 'Due soon'
            },
            {
              title: 'Respond to concierge follow-up',
              description: 'Operations asked for status on dispute #DP-301.',
              status: 'In progress'
            }
          ]
        }
      },
      {
        id: 'settings',
        label: 'Account Settings',
        description: 'Identity, security, and notification preferences.',
        type: 'settings',
        sidebar: {
          badge: 'Profile',
          status: { label: 'Security check passed', tone: 'success' },
          highlights: [
            { label: 'MFA status', value: 'Enabled' },
            { label: 'Quiet hours', value: '22:00-07:00' }
          ]
        },
        data: {
          panels: [
            {
              id: 'profile',
              title: 'Profile & Identity',
              description: 'Manage contact details and workspace identity.',
              items: [
                { id: 'name', label: 'Display name', helper: 'Shown on jobs and chat threads.', type: 'value', value: 'Avery Stone' },
                { id: 'timezone', label: 'Preferred timezone', helper: 'Used for scheduling insights.', type: 'value', value: 'Europe/London' }
              ]
            },
            {
              id: 'notifications',
              title: 'Notifications',
              description: 'Choose when Fixnado should reach out.',
              status: 'Quiet hours respected',
              items: [
                {
                  id: 'sms-alerts',
                  label: 'SMS dispatch alerts',
                  helper: 'Sent when crews are en route or delayed.',
                  type: 'toggle',
                  enabled: true
                },
                {
                  id: 'quiet-hours',
                  label: 'Quiet hours',
                  helper: 'Suppress push notifications overnight.',
                  type: 'value',
                  value: '22:00 – 07:00',
                  meta: 'Local timezone'
                }
              ]
            }
          ]
        }
      }
    ]
  },
  serviceman: {
    persona: 'serviceman',
    name: 'Crew Performance Cockpit',
    headline: 'Stay ahead of assignments, travel buffers, and completion quality markers.',
    window: createWindow(),
    metadata: {
      crewMember: {
        id: 'SRV-2210',
        name: 'Jordan Miles',
        role: 'Lead field technician'
      },
      totals: {
        assignments: 28,
        onTimeRate: '92%',
        travelHours: '18h',
        nps: '68'
      }
    },
    navigation: [
      {
        id: 'overview',
        label: 'Crew Overview',
        description: 'Assignments, travel, and quality trends.',
        type: 'overview',
        sidebar: {
          badge: 'Crew',
          status: { label: 'Dispatch ready', tone: 'success' },
          highlights: [
            { label: 'In progress', value: '5' },
            { label: 'Avg travel', value: '26m' }
          ]
        },
        analytics: {
          metrics: [
            { label: 'Active assignments', value: '12', change: '+2 vs prev window', trend: 'up' },
            { label: 'On-time arrivals', value: '92%', change: '+4 pts vs target', trend: 'up' },
            { label: 'Completion quality', value: '4.8★', change: '+0.2 vs prev window', trend: 'up' },
            { label: 'Travel time', value: '26m', change: '-3m avg travel', trend: 'down' }
          ],
          charts: [
            {
              id: 'jobs-completed',
              title: 'Jobs Completed per Day',
              description: 'Dispatch throughput for the crew.',
              type: 'line',
              dataKey: 'jobs',
              data: [
                { name: 'Mon', jobs: 5 },
                { name: 'Tue', jobs: 6 },
                { name: 'Wed', jobs: 4 },
                { name: 'Thu', jobs: 5 },
                { name: 'Fri', jobs: 6 }
              ]
            },
            {
              id: 'travel-time',
              title: 'Travel vs On-Site Time',
              description: 'Minutes spent commuting compared to time on job.',
              type: 'area',
              dataKey: 'travel',
              secondaryKey: 'onSite',
              data: [
                { name: 'Week 1', travel: 140, onSite: 420 },
                { name: 'Week 2', travel: 130, onSite: 460 },
                { name: 'Week 3', travel: 120, onSite: 480 },
                { name: 'Week 4', travel: 118, onSite: 510 }
              ]
            }
          ],
          upcoming: [
            { title: 'High-rise elevator reset', when: '18 Mar · 08:30', status: 'Dispatch from depot' },
            { title: 'Hospital sterilisation', when: '18 Mar · 13:15', status: 'Crew brief 1h prior' },
            { title: 'University access control', when: '19 Mar · 09:00', status: 'Prep QA checklist' }
          ],
          insights: [
            'Combine two downtown tickets to reclaim 18 minutes of travel.',
            'Schedule calibration kit swap before Friday to avoid delays.',
            'Average CSAT improved 0.2 points after new completion checklist.'
          ]
        }
      },
      {
        id: 'schedule',
        label: 'Schedule Board',
        description: 'Visualise dispatch by day and risk.',
        type: 'board',
        sidebar: {
          badge: 'Dispatch',
          status: { label: 'Review travel buffers', tone: 'warning' },
          highlights: [
            { label: 'Same-day slots', value: '2 open' },
            { label: 'Overnight jobs', value: '1' }
          ]
        },
        data: {
          columns: [
            {
              title: 'Today',
              items: [
                { title: 'Thermal imaging survey', owner: 'Harbour Apartments', value: 'Start 08:30', eta: 'Prep complete' },
                { title: 'Emergency boiler repair', owner: 'Riverside Complex', value: 'Start 11:00', eta: 'Travel buffer tight' }
              ]
            },
            {
              title: 'Tomorrow',
              items: [
                { title: 'Retail lighting retrofit', owner: 'Galleria Mall', value: 'Start 09:15', eta: 'Crew confirmed' },
                { title: 'EV charger diagnostic', owner: 'Fleet Depot', value: 'Start 14:00', eta: 'Awaiting part delivery' }
              ]
            },
            {
              title: 'Requires follow-up',
              items: [
                { title: 'Medical suite filter swap', owner: 'City Hospital', value: 'Reschedule request', eta: 'Confirm by 18 Mar' },
                { title: 'Roof access permit', owner: 'Operations', value: 'Paperwork', eta: 'Needs approval' }
              ]
            },
            {
              title: 'Completed',
              items: [
                { title: 'Smart lock install', owner: 'Innovation Labs', value: 'Completed 97%', eta: 'QA images uploaded' },
                { title: 'Fire door inspection', owner: 'West End Theatre', value: 'Passed', eta: 'Report shared' }
              ]
            }
          ]
        }
      }
    ]
  },
  provider: {
    persona: 'provider',
    name: 'Provider Operations Studio',
    headline: 'Monitor revenue, crew utilisation, and asset readiness for every contract.',
    window: createWindow(),
    metadata: {
      company: {
        id: 'COMP-3390',
        name: 'Vertex Field Services',
        onboardingStatus: 'Active'
      },
      totals: {
        crewsActive: 7,
        utilisation: '78%',
        revenue: '£312k',
        overdueInvoices: 2
      }
    },
    navigation: [
      {
        id: 'overview',
        label: 'Provider Overview',
        description: 'Revenue, utilisation, and satisfaction snapshots.',
        type: 'overview',
        sidebar: {
          badge: 'Studio',
          status: { label: 'Forecast on track', tone: 'success' },
          highlights: [
            { label: 'Active crews', value: '7' },
            { label: 'Revenue pace', value: '£10.4k/day' }
          ]
        },
        analytics: {
          metrics: [
            { label: 'First response', value: '12 mins', change: '-3 mins vs target', trend: 'down' },
            { label: 'Crew utilisation', value: '78%', change: '+5 pts vs prev window', trend: 'up' },
            { label: 'Revenue processed', value: '£312k', change: '+£24k vs forecast', trend: 'up' },
            { label: 'Satisfaction', value: '4.6★', change: '+0.1 vs prev window', trend: 'up' }
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
            'Customer satisfaction is trending upward after new completion surveys.'
          ]
        }
      },
      {
        id: 'workboard',
        label: 'Workboard',
        description: 'Track bookings through assignment to delivery.',
        type: 'board',
        sidebar: {
          badge: 'Pipeline',
          status: { label: '3 bookings awaiting crews', tone: 'warning' },
          highlights: [
            { label: 'New leads', value: '5' },
            { label: 'At risk', value: '2' }
          ]
        },
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
        label: 'Rental Lifecycle',
        description: 'Equipment tied to service delivery.',
        type: 'table',
        sidebar: {
          badge: 'Assets',
          status: { label: '1 inspection overdue', tone: 'danger' },
          highlights: [
            { label: 'Assets deployed', value: '18' },
            { label: 'Out for inspection', value: '2' }
          ]
        },
        data: {
          headers: ['Agreement', 'Asset', 'Status', 'Crew', 'Return milestone'],
          rows: [
            ['AGR-5412', 'Air scrubber kit', 'In delivery', 'Crew Gamma', 'Return 25 Mar'],
            ['AGR-5406', 'MEWP platform', 'Inspection overdue', 'Crew Alpha', 'Inspection due 17 Mar'],
            ['AGR-5389', 'Water-fed poles', 'Ready for pickup', 'Crew Delta', 'Collection scheduled']
          ]
        }
      },
      {
        id: 'asset-alerts',
        label: 'Asset Alerts',
        description: 'Maintenance and compliance follow-ups.',
        type: 'list',
        sidebar: {
          badge: 'Health',
          status: { label: 'Resolve critical alert', tone: 'danger' },
          highlights: [
            { label: 'Critical', value: '1' },
            { label: 'Warnings', value: '3' }
          ]
        },
        data: {
          items: [
            {
              title: 'Generator 14 requires inspection',
              description: 'Vibration levels exceeded safe threshold twice this week.',
              status: 'Critical'
            },
            {
              title: 'Crew Gamma tool audit',
              description: 'Confirm serialized tools before quarter-end inventory.',
              status: 'Action required'
            },
            {
              title: 'Fleet van tyre rotation',
              description: 'Schedule with maintenance partner to avoid downtime.',
              status: 'Monitoring'
            }
          ]
        }
      }
    ]
  },
  enterprise: {
    persona: 'enterprise',
    name: 'Enterprise Performance Suite',
    headline: 'Track spend, campaign pacing, and risk signals across every facility.',
    window: createWindow(),
    metadata: {
      company: {
        id: 'ENT-9012',
        name: 'Atlas Facilities Group',
        sites: 42
      },
      totals: {
        facilitiesActive: 39,
        monthlySpend: '£1.48m',
        automationSavings: '£86k',
        riskIncidents: 3
      }
    },
    navigation: [
      {
        id: 'overview',
        label: 'Enterprise Overview',
        description: 'Spend, automation, and risk telemetry.',
        type: 'overview',
        sidebar: {
          badge: 'Portfolio',
          status: { label: 'Automation impact rising', tone: 'info' },
          highlights: [
            { label: 'Sites live', value: '39/42' },
            { label: 'Overspend alerts', value: '0' }
          ]
        },
        analytics: {
          metrics: [
            { label: 'Monthly spend', value: '£1.48m', change: '+£120k vs forecast', trend: 'up' },
            { label: 'Automation savings', value: '£86k', change: '+£12k vs prev window', trend: 'up' },
            { label: 'Campaign ROI', value: '3.4x', change: '+0.3 vs target', trend: 'up' },
            { label: 'Risk incidents', value: '3', change: '-2 vs prev window', trend: 'down' }
          ],
          charts: [
            {
              id: 'spend-by-region',
              title: 'Spend by Region',
              description: 'Aggregate service spend across core regions.',
              type: 'bar',
              dataKey: 'spend',
              data: [
                { name: 'North', spend: 420000 },
                { name: 'South', spend: 360000 },
                { name: 'East', spend: 310000 },
                { name: 'West', spend: 390000 }
              ]
            },
            {
              id: 'risk-trend',
              title: 'Risk Incidents Trend',
              description: 'Logged safety and compliance incidents per month.',
              type: 'line',
              dataKey: 'incidents',
              data: [
                { name: 'Nov', incidents: 6 },
                { name: 'Dec', incidents: 5 },
                { name: 'Jan', incidents: 4 },
                { name: 'Feb', incidents: 3 }
              ]
            }
          ],
          upcoming: [
            { title: 'Portfolio governance review', when: '19 Mar · 15:00', status: 'Slides in review' },
            { title: 'Facilities automation rollout', when: '25 Mar · 09:00', status: 'Pilot final checks' },
            { title: 'Quarter-end risk audit', when: '29 Mar · 11:00', status: 'Compliance team prepping' }
          ],
          insights: [
            'Southern region nearing ad spend cap — redistribute budget to West.',
            'Automation savings grew 16% after robotics cleaning rollout.',
            'Risk incidents trending down; keep proactive maintenance cadence.'
          ]
        }
      },
      {
        id: 'compliance',
        label: 'Compliance Library',
        description: 'Document coverage, expiries, and owners.',
        type: 'table',
        sidebar: {
          badge: 'Compliance',
          status: { label: '5 documents expiring soon', tone: 'warning' },
          highlights: [
            { label: 'Expiring <30d', value: '5' },
            { label: 'Outstanding reviews', value: '2' }
          ]
        },
        data: {
          headers: ['Facility', 'Document', 'Status', 'Expires', 'Owner'],
          rows: [
            ['Logistics Hub 4', 'Fire Safety Certificate', 'Expiring soon', '05 Apr 2025', 'Ops Compliance'],
            ['Corporate HQ', 'HVAC Maintenance Log', 'Up to date', '01 Jun 2025', 'Engineering'],
            ['Retail Cluster South', 'Contractor Insurance', 'Review required', '18 Mar 2025', 'Legal'],
            ['Data Centre North', 'Generator Test Report', 'Up to date', '11 Jan 2026', 'Site Manager'],
            ['Campus West', 'Lift Service Record', 'Expiring soon', '30 Mar 2025', 'Facilities']
          ]
        }
      }
    ]
  },
  admin: {
    persona: 'admin',
    name: 'Admin Control Tower',
    headline: 'Command multi-tenant operations, compliance, and SLA performance in real time.',
    window: createWindow(),
    metadata: {
      company: {
        id: 'HQ-001',
        name: 'Fixnado Operations'
      },
      totals: {
        tenantsActive: 128,
        bookings: 842,
        revenue: '£6.4m',
        slaBreaches: 7
      }
    },
    navigation: [
      {
        id: 'overview',
        label: 'Executive Overview',
        description: 'Jobs, revenue, and SLA health for all tenants.',
        type: 'overview',
        sidebar: {
          badge: 'Network',
          status: { label: 'Live telemetry', tone: 'success' },
          highlights: [
            { label: 'Active tenants', value: '128' },
            { label: 'SLA breaches', value: '7' }
          ]
        },
        analytics: {
          metrics: [
            { label: 'Bookings processed', value: '842', change: '+64 vs prev window', trend: 'up' },
            { label: 'Completion rate', value: '91%', change: '+3 pts vs target', trend: 'up' },
            { label: 'Revenue processed', value: '£6.4m', change: '+£420k vs forecast', trend: 'up' },
            { label: 'Escalations', value: '18', change: '-6 vs prev window', trend: 'down' }
          ],
          charts: [
            {
              id: 'bookings-trend',
              title: 'Bookings by Week',
              description: 'Volume of jobs created across all tenants.',
              type: 'line',
              dataKey: 'bookings',
              data: [
                { name: 'Week 1', bookings: 180 },
                { name: 'Week 2', bookings: 205 },
                { name: 'Week 3', bookings: 210 },
                { name: 'Week 4', bookings: 247 }
              ]
            },
            {
              id: 'revenue-forecast',
              title: 'Revenue vs Forecast',
              description: 'Recognised revenue compared to planned forecast.',
              type: 'bar',
              dataKey: 'actual',
              secondaryKey: 'forecast',
              data: [
                { name: 'Week 1', actual: 1500000, forecast: 1420000 },
                { name: 'Week 2', actual: 1560000, forecast: 1490000 },
                { name: 'Week 3', actual: 1640000, forecast: 1550000 },
                { name: 'Week 4', actual: 1700000, forecast: 1610000 }
              ]
            }
          ],
          upcoming: [
            { title: 'Ops risk review', when: '18 Mar · 10:00', status: 'Agenda confirmed' },
            { title: 'Finance reconciliation push', when: '20 Mar · 12:00', status: 'Ledger import pending' },
            { title: 'Regional NPS survey launch', when: '22 Mar · 09:00', status: 'Templates finalised' }
          ],
          insights: [
            'Northern region revenue pacing 6% above forecast after municipal contract.',
            'Seven SLA breaches concentrated across two providers — trigger coaching.',
            'Escalation rate trending downward following new support rota.'
          ]
        }
      },
      {
        id: 'operations',
        label: 'Operations Pipeline',
        description: 'Monitor multi-tenant job delivery state.',
        type: 'board',
        sidebar: {
          badge: 'Ops',
          status: { label: 'Intervention required', tone: 'danger' },
          highlights: [
            { label: 'Awaiting assignment', value: '14' },
            { label: 'Breaching soon', value: '5' }
          ]
        },
        data: {
          columns: [
            {
              title: 'Awaiting assignment',
              items: [
                { title: 'Enterprise HVAC rollout', owner: 'Provider 11', value: '£46k', eta: 'Needs crew within 6h' },
                { title: 'Retail pest control surge', owner: 'Provider 04', value: '£12k', eta: 'Backlog 2 days' }
              ]
            },
            {
              title: 'In progress',
              items: [
                { title: 'Campus facilities refresh', owner: 'Provider 02', value: '£38k', eta: 'Day 3 of 5' },
                { title: 'Logistics depot sanitisation', owner: 'Provider 08', value: '£24k', eta: 'Night shift underway' }
              ]
            },
            {
              title: 'Needs intervention',
              items: [
                { title: 'Luxury hotel refit', owner: 'Provider 05', value: '£31k', eta: 'SLA breach in 2h' },
                { title: 'Healthcare wing upgrade', owner: 'Provider 03', value: '£54k', eta: 'Crew shortfall' }
              ]
            },
            {
              title: 'Completed this window',
              items: [
                { title: 'Airport check-in hall', owner: 'Provider 01', value: '£62k', eta: 'QA approved' },
                { title: 'Stadium resurfacing', owner: 'Provider 06', value: '£85k', eta: 'Billing review' }
              ]
            }
          ]
        }
      },
      {
        id: 'compliance',
        label: 'Compliance & Risk',
        description: 'Document expiries, fraud signals, and audit focus.',
        type: 'table',
        sidebar: {
          badge: 'Risk',
          status: { label: 'New fraud signal detected', tone: 'danger' },
          highlights: [
            { label: 'Expiring docs', value: '9' },
            { label: 'Fraud alerts', value: '1' }
          ]
        },
        data: {
          headers: ['Entity', 'Type', 'Status', 'Owner', 'Next step'],
          rows: [
            ['Provider 05', 'Insurance certificate', 'Expiring soon', 'Compliance', 'Renewal call 18 Mar'],
            ['Campaign 2025-04', 'Ad spend anomaly', 'Investigate', 'Marketing Ops', 'Validate conversions'],
            ['Provider 09', 'Background checks', 'In review', 'People Ops', 'Interview follow-up'],
            ['Tenant 44', 'AML documentation', 'Complete', 'Finance', 'Archive in vault']
          ]
        }
      },
      {
        id: 'assets',
        label: 'Assets & Rentals',
        description: 'High-level utilisation and upcoming returns.',
        type: 'grid',
        sidebar: {
          badge: 'Fleet',
          status: { label: 'Utilisation balanced', tone: 'info' },
          highlights: [
            { label: 'Assets deployed', value: '184' },
            { label: 'Due back this week', value: '11' }
          ]
        },
        data: {
          cards: [
            {
              title: 'Top performing regions',
              accent: 'from-sky-100 via-white to-emerald-100',
              details: ['North: 34 active rentals', 'West: 29 active rentals']
            },
            {
              title: 'Inspection pipeline',
              accent: 'from-amber-100 via-white to-rose-100',
              details: ['5 inspections due in 72h', '2 escalated to fleet ops']
            },
            {
              title: 'Asset health',
              accent: 'from-indigo-100 via-white to-sky-100',
              details: ['Critical alerts: 2', 'Preventative tasks scheduled: 14']
            }
          ]
        }
      }
    ]
  }
};

export default mockDashboards;
