export const DASHBOARD_ROLES = [
  {
    id: 'user',
    name: 'User Command Center',
    persona: 'Homeowner & Facilities Client',
    headline: 'Coordinate every job, order and subscription from a single canvas.',
    registered: true,
    navigation: [
      {
        id: 'overview',
        label: 'Executive Overview',
        description: 'At-a-glance look at requests, spend, engagements and satisfaction.',
        type: 'overview',
        analytics: {
          metrics: [
            { label: 'Active Jobs', value: '12', change: '+3 vs last week', trend: 'up' },
            { label: 'Avg. Response Time', value: '1h 24m', change: '-18m', trend: 'up' },
            { label: 'Satisfaction Score', value: '4.8 / 5', change: '+0.3 QoQ', trend: 'up' },
            { label: 'Monthly Spend', value: '$6,420', change: '-12%', trend: 'down' }
          ],
          charts: [
            {
              id: 'service-volume',
              title: 'Service Volume by Week',
              description: 'Blend of scheduled and on-demand jobs fulfilled through Fixnado.',
              type: 'area',
              dataKey: 'completed',
              data: [
                { name: 'Week 1', completed: 8, urgent: 2 },
                { name: 'Week 2', completed: 11, urgent: 3 },
                { name: 'Week 3', completed: 15, urgent: 1 },
                { name: 'Week 4', completed: 18, urgent: 4 }
              ]
            },
            {
              id: 'spend-distribution',
              title: 'Spend Distribution',
              description: 'Where your budget was allocated this month.',
              type: 'bar',
              dataKey: 'value',
              secondaryKey: 'lastMonth',
              data: [
                { name: 'Services', value: 4200, lastMonth: 3900 },
                { name: 'Tool Rentals', value: 1100, lastMonth: 900 },
                { name: 'Materials', value: 720, lastMonth: 650 },
                { name: 'Packages', value: 400, lastMonth: 520 }
              ]
            }
          ],
          upcoming: [
            { title: 'HVAC tune-up', when: 'Tomorrow • 09:00 AM', status: 'Confirmed' },
            { title: 'Landscape refresh', when: 'Friday • 02:30 PM', status: 'Awaiting bid' },
            { title: 'Generator maintenance', when: 'Monday • 11:00 AM', status: 'Scheduled' }
          ],
          insights: [
            'Auto-matching filled 67% of urgent requests this month.',
            'Three preferred service teams have availability next week.',
            'Tool rental utilisation is up 23%—consider long-term leasing.'
          ]
        }
      },
      {
        id: 'custom-jobs',
        label: 'Custom Job Management',
        description: 'Monitor bespoke projects, change orders and collaboration.',
        type: 'board',
        data: {
          columns: [
            {
              title: 'Intake',
              items: [
                { title: 'Exterior lighting redesign', owner: 'Kara Bright', value: '$4,800', eta: 'Bid closes in 2d' }
              ]
            },
            {
              title: 'In Negotiation',
              items: [
                { title: 'Smart home retrofit', owner: 'Pulse Automation', value: '$9,200', eta: 'Revision requested' },
                { title: 'Roof membrane replacement', owner: 'Skyshield Pros', value: '$14,600', eta: 'Awaiting permits' }
              ]
            },
            {
              title: 'In Delivery',
              items: [
                { title: 'Lobby modernization', owner: 'UrbanCraft', value: '$32,400', eta: 'Phase 2 install 64% complete' }
              ]
            },
            {
              title: 'Wrap-up',
              items: [
                { title: 'Solar maintenance', owner: 'SunFleet', value: '$2,100', eta: 'Close-out review pending' }
              ]
            }
          ]
        }
      },
      {
        id: 'service-orders',
        label: 'Service Orders',
        description: 'Track live visits, technicians in-field and SLAs.',
        type: 'table',
        data: {
          headers: ['Order #', 'Service', 'Assigned Team', 'Window', 'Status', 'SLA'],
          rows: [
            ['FN-1042', 'Emergency plumbing', 'HydroSure', 'Today 16:00-18:00', 'On-site', 'Met'],
            ['FN-1036', 'Electrical compliance audit', 'CurrentWorks', 'Tomorrow 10:00-12:00', 'Dispatched', 'At risk'],
            ['FN-1031', 'Deep cleaning', 'PureWave', 'Fri 08:00-12:00', 'Confirmed', 'Met'],
            ['FN-1024', 'Pest remediation', 'ShieldGuard', 'Mon 12:00-15:00', 'Awaiting prep', 'Warning']
          ]
        }
      },
      {
        id: 'marketplace-orders',
        label: 'Marketplace Orders',
        description: 'Purchases and rentals from the Fixnado marketplace.',
        type: 'grid',
        data: {
          cards: [
            { title: 'Tool Rentals', details: ['8 active rentals', 'Avg utilisation 86%', '3 pickups this week'], accent: 'from-emerald-500 to-teal-500' },
            { title: 'Tool Purchases', details: ['Last order: Impact drills', 'Spend $1,240', 'Warranty coverage active'], accent: 'from-sky-500 to-indigo-500' },
            { title: 'Material Orders', details: ['14 SKUs in transit', 'ETA 2.3 days avg', 'Vendor fill rate 98%'], accent: 'from-rose-500 to-orange-500' },
            { title: 'Service Packages', details: ['HVAC Gold plan renews in 12 days', '3 preventative visits remaining'], accent: 'from-violet-500 to-purple-500' }
          ]
        }
      },
      {
        id: 'user-settings',
        label: 'Automation & Settings',
        description: 'Preferences, notifications and delegations.',
        type: 'list',
        data: {
          items: [
            { title: 'Escalation Rules', description: 'Route unacknowledged emergencies to Operations lead within 15 minutes.', status: 'Active' },
            { title: 'Budget Guardrails', description: 'Auto-notify finance when spend crosses $8,000/mo.', status: 'Active' },
            { title: 'Delegate Access', description: '3 collaborators with request privileges.', status: 'Review by Apr 30' }
          ]
        }
      }
    ]
  },
  {
    id: 'serviceman',
    name: 'Servicemen Mission Control',
    persona: 'Technician & Crew Operations',
    headline: 'Own your pipeline, bids and performance in real time.',
    registered: true,
    navigation: [
      {
        id: 'overview',
        label: 'Operational Pulse',
        description: 'Productivity, win rates and utilisation metrics.',
        type: 'overview',
        analytics: {
          metrics: [
            { label: 'Jobs Assigned', value: '22', change: '+5 this week', trend: 'up' },
            { label: 'Bid Win Rate', value: '64%', change: '+8 pts', trend: 'up' },
            { label: 'Utilisation', value: '91%', change: '+3%', trend: 'up' },
            { label: 'Quality Score', value: '4.9', change: '+0.1', trend: 'up' }
          ],
          charts: [
            {
              id: 'bid-trends',
              title: 'Bid Pipeline',
              description: 'Opportunities progressing through proposal stages.',
              type: 'line',
              dataKey: 'value',
              data: [
                { name: 'Mon', value: 4 },
                { name: 'Tue', value: 6 },
                { name: 'Wed', value: 5 },
                { name: 'Thu', value: 8 },
                { name: 'Fri', value: 7 }
              ]
            },
            {
              id: 'time-allocation',
              title: 'Time Allocation',
              description: 'Billable vs non-billable hours logged.',
              type: 'bar',
              dataKey: 'billable',
              secondaryKey: 'nonbillable',
              data: [
                { name: 'Week 1', billable: 36, nonbillable: 8 },
                { name: 'Week 2', billable: 40, nonbillable: 6 },
                { name: 'Week 3', billable: 38, nonbillable: 5 },
                { name: 'Week 4', billable: 42, nonbillable: 4 }
              ]
            }
          ],
          upcoming: [
            { title: 'Commercial HVAC retrofit', when: 'Today • 13:00', status: 'Pre-job briefing in 30m' },
            { title: 'Auto-matched urgent call', when: 'Tonight • 21:15', status: 'Confirm crew availability' },
            { title: 'Safety toolbox talk', when: 'Thu • 07:45', status: 'Attendance required' }
          ],
          insights: [
            'Auto-matching suggested 4 additional night-shift jobs this week.',
            'Top-rated service package: "Rapid Response HVAC" 98% satisfaction.',
            'Average lead time from bid acceptance to mobilisation is 11 hours.'
          ]
        }
      },
      {
        id: 'custom-orders',
        label: 'Custom Order Desk',
        description: 'Respond to bespoke client needs and manage deliverables.',
        type: 'board',
        data: {
          columns: [
            {
              title: 'New Leads',
              items: [
                { title: 'Hospital sterilisation upgrade', owner: 'MedServe', value: '$18,500', eta: 'Site walk scheduled' }
              ]
            },
            {
              title: 'Estimating',
              items: [
                { title: 'University lab retrofit', owner: 'CampusCore', value: '$24,800', eta: 'Design review tomorrow' },
                { title: 'Automotive paint booth install', owner: 'DriveLine', value: '$31,200', eta: 'Waiting on electrical schematics' }
              ]
            },
            {
              title: 'Executing',
              items: [
                { title: 'Retail chain rollout', owner: 'StyleCo', value: '$44,500', eta: 'Phase 1 punch list 72% complete' }
              ]
            },
            {
              title: 'Closeout',
              items: [
                { title: 'Municipal pump overhaul', owner: 'CityWorks', value: '$26,100', eta: 'QA inspection tomorrow' }
              ]
            }
          ]
        }
      },
      {
        id: 'services-offered',
        label: 'Services Catalogue',
        description: 'Tune pricing, availability and coverage areas.',
        type: 'grid',
        data: {
          cards: [
            { title: 'Standard Services', details: ['12 offerings live', 'Avg rating 4.86', 'Lead time 6h'], accent: 'from-blue-500 to-cyan-500' },
            { title: 'Service Packages', details: ['HVAC Rapid Response', 'Electrical Safety Prime', 'Facility Care Plus'], accent: 'from-amber-500 to-yellow-500' },
            { title: 'Fixnado Ads', details: ['2 active campaigns', 'CTR 6.2%', 'Top market: Downtown'], accent: 'from-emerald-500 to-green-500' },
            { title: 'Analytics', details: ['Crew of 14 active', 'Equipment uptime 97%', 'Next certification audit in 12d'], accent: 'from-slate-500 to-slate-700' }
          ]
        }
      },
      {
        id: 'auto-matching',
        label: 'Auto-Matching Controls',
        description: 'Manage bidding automation, guardrails and staffing.',
        type: 'list',
        data: {
          items: [
            { title: 'Night Shift Coverage', description: 'Auto-accept HVAC emergencies between 20:00-06:00 up to $8k.', status: 'Enabled' },
            { title: 'Bid Throttle', description: 'Limit simultaneous open bids to 12 per crew lead.', status: 'Enabled' },
            { title: 'Skill Matrix Sync', description: 'Sync certifications with HR every Sunday.', status: 'Scheduled' }
          ]
        }
      }
    ]
  },
  {
    id: 'provider',
    name: 'Provider / SME Control Tower',
    persona: 'Marketplace Vendors & Agencies',
    headline: 'Merchandise, services, rentals and teams—all orchestrated.',
    registered: true,
    navigation: [
      {
        id: 'overview',
        label: 'Revenue Cockpit',
        description: 'Sales, rental utilisation and service health.',
        type: 'overview',
        analytics: {
          metrics: [
            { label: 'Marketplace Revenue', value: '$128k', change: '+14% MoM', trend: 'up' },
            { label: 'Rental Utilisation', value: '78%', change: '+6%', trend: 'up' },
            { label: 'Services Delivered', value: '312', change: '+21', trend: 'up' },
            { label: 'Ad Spend ROI', value: '4.2x', change: '+0.6x', trend: 'up' }
          ],
          charts: [
            {
              id: 'sales-funnel',
              title: 'Sales Funnel Velocity',
              description: 'Movement of opportunities through funnel stages.',
              type: 'line',
              dataKey: 'velocity',
              data: [
                { name: 'Prospect', velocity: 120 },
                { name: 'Qualified', velocity: 86 },
                { name: 'Proposal', velocity: 54 },
                { name: 'Won', velocity: 38 }
              ]
            },
            {
              id: 'inventory',
              title: 'Inventory Turns',
              description: 'Blend of sales and rental rotations by category.',
              type: 'bar',
              dataKey: 'sales',
              secondaryKey: 'rentals',
              data: [
                { name: 'Power Tools', sales: 32, rentals: 18 },
                { name: 'Heavy Equipment', sales: 12, rentals: 26 },
                { name: 'Consumables', sales: 58, rentals: 4 },
                { name: 'Safety Gear', sales: 24, rentals: 9 }
              ]
            }
          ],
          upcoming: [
            { title: 'Restock: Smart sensors', when: 'ETA Wednesday', status: 'Inbound 420 units' },
            { title: 'Rental return audit', when: 'Friday 17:00', status: 'Check damage reports' },
            { title: 'Ads optimisation review', when: 'Monday 10:00', status: 'Marketing sync' }
          ],
          insights: [
            'Sales to rental cross-sell rate climbed to 37% this month.',
            'Top performing package: "Facility Shield" +22% conversions.',
            'Consider expanding technician pool in Uptown—demand up 18%.'
          ]
        }
      },
      {
        id: 'inventory',
        label: 'Marketplace Inventory',
        description: 'Control catalogue, pricing, kitting and readiness.',
        type: 'grid',
        data: {
          cards: [
            { title: 'Live Listings', details: ['224 SKUs published', 'Accuracy score 99%', '14 flagged for refresh'], accent: 'from-indigo-500 to-blue-600' },
            { title: 'Kitting Board', details: ['8 bundles trending', 'Attach rate 42%', 'Avg margin 36%'], accent: 'from-rose-500 to-pink-500' },
            { title: 'Logistics', details: ['3 fulfilment hubs', 'Avg SLA 1.4 days', 'Backorders 2.1%'], accent: 'from-emerald-500 to-lime-500' },
            { title: 'Quality', details: ['Return rate 1.2%', 'Warranty claims 3 open', 'Next QC sweep in 5d'], accent: 'from-slate-500 to-slate-700' }
          ]
        }
      },
      {
        id: 'orders',
        label: 'Orders & Rentals',
        description: 'Monitor service, sales and rental fulfilment.',
        type: 'table',
        data: {
          headers: ['Channel', 'Open', 'In Progress', 'Completed', 'At Risk'],
          rows: [
            ['Service Orders', '18', '9', '301', '2'],
            ['Service Packages', '6', '5', '142', '1'],
            ['Sales Orders', '21', '12', '498', '3'],
            ['Rental Orders', '9', '7', '286', '4']
          ]
        }
      },
      {
        id: 'hr',
        label: 'Service Team HR',
        description: 'Track technicians, certifications and scheduling.',
        type: 'board',
        data: {
          columns: [
            {
              title: 'Recruiting',
              items: [
                { title: 'Electrical Lead', owner: 'Pipeline', value: '3 interviews this week', eta: 'Offer pending' }
              ]
            },
            {
              title: 'Onboarding',
              items: [
                { title: 'New HVAC apprentice cohort', owner: '4 hires', value: 'Orientation day 2', eta: 'Cert tests Friday' }
              ]
            },
            {
              title: 'Active Crews',
              items: [
                { title: 'Maintenance Team A', owner: '8 techs', value: 'Capacity 92%', eta: 'Next break Tue' },
                { title: 'Special Projects', owner: '5 techs', value: 'Capacity 78%', eta: 'Needs thermal camera' }
              ]
            },
            {
              title: 'Compliance',
              items: [
                { title: 'Safety renewals', owner: '12 certs', value: 'Due within 30 days', eta: 'Escalated' }
              ]
            }
          ]
        }
      },
      {
        id: 'ads-analytics',
        label: 'Ads & Analytics',
        description: 'Optimise Fixnado Ads and review deep insights.',
        type: 'list',
        data: {
          items: [
            { title: 'Marketplace Spotlight', description: 'Run-of-network ad driving 12.3k impressions daily.', status: 'Active' },
            { title: 'Conversion Lab', description: 'A/B testing landing experiences, experiment #7 in progress.', status: 'Running' },
            { title: 'Insights Feed', description: 'AI flagged 4 SKUs with high growth probability.', status: 'Review now' }
          ]
        }
      }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Intelligence Fabric',
    persona: 'Multi-site Operators & Enterprise Clients',
    headline: 'Precision analytics, automation and AI co-pilots at scale.',
    registered: true,
    navigation: [
      {
        id: 'overview',
        label: 'Executive Command Deck',
        description: 'Portfolio level KPIs, predictive maintenance and workforce health.',
        type: 'overview',
        analytics: {
          metrics: [
            { label: 'Sites Managed', value: '184', change: '+12 this quarter', trend: 'up' },
            { label: 'Operational Availability', value: '98.4%', change: '+0.8%', trend: 'up' },
            { label: 'Cost Avoidance', value: '$212k', change: '+18%', trend: 'up' },
            { label: 'AI Resolution Rate', value: '37%', change: '+5 pts', trend: 'up' }
          ],
          charts: [
            {
              id: 'maintenance-forecast',
              title: 'Maintenance Forecast',
              description: 'Projected preventive vs reactive workload next 6 weeks.',
              type: 'area',
              dataKey: 'preventive',
              secondaryKey: 'reactive',
              data: [
                { name: 'Week 1', preventive: 42, reactive: 16 },
                { name: 'Week 2', preventive: 48, reactive: 18 },
                { name: 'Week 3', preventive: 51, reactive: 15 },
                { name: 'Week 4', preventive: 56, reactive: 14 },
                { name: 'Week 5', preventive: 60, reactive: 13 },
                { name: 'Week 6', preventive: 62, reactive: 12 }
              ]
            },
            {
              id: 'portfolio-spend',
              title: 'Portfolio Spend Efficiency',
              description: 'Benchmark vs plan across service categories.',
              type: 'bar',
              dataKey: 'actual',
              secondaryKey: 'plan',
              data: [
                { name: 'Critical', actual: 68, plan: 72 },
                { name: 'Preventive', actual: 54, plan: 60 },
                { name: 'Enhancements', actual: 36, plan: 28 },
                { name: 'Energy', actual: 22, plan: 24 }
              ]
            }
          ],
          upcoming: [
            { title: 'AI Responder rollout', when: 'Pilot launch • Thursday', status: 'BYOK model configured' },
            { title: 'Executive QBR', when: 'Next Tuesday', status: 'Deck auto-generated by Insights AI' },
            { title: 'Condition monitoring sync', when: 'Friday 09:30', status: 'Data ingestion verifying' }
          ],
          insights: [
            'Auto-matching routed 82% of high priority incidents to top-tier vendors.',
            'Predictive alerting reduced downtime by 19 hours this month.',
            'AI responder deflected 311 inbound tickets with 94% satisfaction.'
          ]
        }
      },
      {
        id: 'global-operations',
        label: 'Global Operations',
        description: 'Site performance, escalations and compliance posture.',
        type: 'grid',
        data: {
          cards: [
            { title: 'Live Incidents', details: ['22 critical', '41 major', 'SLA at risk: 4 sites'], accent: 'from-red-600 to-orange-500' },
            { title: 'Compliance', details: ['Audit readiness 96%', 'Next ISO review in 14d', 'Permits expiring: 6'], accent: 'from-cyan-500 to-sky-500' },
            { title: 'Workforce Health', details: ['1,248 technicians', 'Fatigue index stable', 'Attrition 6.4%'], accent: 'from-lime-500 to-emerald-500' },
            { title: 'Energy Optimisation', details: ['18 campuses with demand response active', 'Savings $48k this quarter'], accent: 'from-indigo-500 to-purple-600' }
          ]
        }
      },
      {
        id: 'ai-co-pilot',
        label: 'AI Co-Pilot Suite',
        description: 'Configure OpenAI BYOK responder, automations and governance.',
        type: 'list',
        data: {
          items: [
            { title: 'Knowledge Sources', description: '42 collections synced, 6 flagged for refresh.', status: 'Healthy' },
            { title: 'Conversational Guardrails', description: 'Role-based policies mapped to ITSM groups.', status: 'Fully enforced' },
            { title: 'Automation Recipes', description: '11 playbooks auto-resolving service tickets.', status: 'Running' }
          ]
        }
      },
      {
        id: 'advanced-analytics',
        label: 'Advanced Analytics',
        description: 'Deep-dives, forecasting models and scenario planning.',
        type: 'table',
        data: {
          headers: ['Model', 'Owner', 'Last Run', 'Accuracy', 'Action'],
          rows: [
            ['Downtime Predictor', 'Reliability Ops', 'Today 04:00', '92%', 'Publish to dashboard'],
            ['Energy Optimiser', 'Sustainability', 'Yesterday 22:00', '89%', 'Share with finance'],
            ['Inventory Forecast', 'Supply Chain', 'Sun 12:00', '95%', 'Sync to ERP'],
            ['Workforce Planner', 'People Ops', 'Mon 06:00', '88%', 'Review capacity']
          ]
        }
      },
      {
        id: 'sales-funnel',
        label: 'Sales & Expansion',
        description: 'Opportunities, renewals and expansion motion.',
        type: 'board',
        data: {
          columns: [
            {
              title: 'Pipeline',
              items: [
                { title: 'Campus modernisation', owner: 'Growth Team', value: '$2.4M', eta: 'Discovery call Tue' }
              ]
            },
            {
              title: 'Solutions Engineering',
              items: [
                { title: 'National retail expansion', owner: 'Solutions Pod 3', value: '$1.8M', eta: 'Pilot store build-out' }
              ]
            },
            {
              title: 'Negotiation',
              items: [
                { title: 'Industrial automation retrofit', owner: 'Enterprise South', value: '$3.1M', eta: 'Security review' }
              ]
            },
            {
              title: 'Renewals',
              items: [
                { title: 'Global facility ops', owner: 'Customer Success', value: '$4.9M', eta: 'Renewal in 45 days' }
              ]
            }
          ]
        }
      }
    ]
  }
];
