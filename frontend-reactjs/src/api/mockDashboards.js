import { readSecurityPreferences } from '../utils/securityPreferences.js';
import { userDashboard } from './mockDashboards/userDashboard.js';
import { servicemanDashboard } from './mockDashboards/servicemanDashboard.js';
import { providerDashboard } from './mockDashboards/providerDashboard.js';
import { createWindow } from './mockDashboards/helpers.js';

const mockDashboards = {
  user: userDashboard,
  serviceman: servicemanDashboard,
  provider: providerDashboard,
  enterprise: {
    persona: 'enterprise',
    name: 'Enterprise Performance Suite',
    headline: 'Track spend, campaigns, automations, and risk signals across every facility.',
    window: createWindow(),
      metadata: {
        enterprise: {
          id: 'ENT-4401',
          name: 'United Municipal Group',
          portfolio: 38,
          automationSavings: '£420k'
        },
        totals: {
          facilities: 112,
          activePrograms: 14,
          savings: '£420k',
          satisfaction: '4.7★'
        },
        features: {
          ads: {
            available: true,
            level: 'view',
            label: 'Enterprise Ads Performance',
            features: ['campaigns', 'billing', 'guardrails']
          }
        }
      },
    navigation: [
      {
        id: 'overview',
        icon: 'profile',
        label: 'Profile Overview',
        description: 'Enterprise-level spend, automation savings, and risk.',
        type: 'overview',
        analytics: {
          metrics: [
            { label: 'Facilities live', value: '112', change: '+6 vs Q4', trend: 'up' },
            { label: 'Automation savings', value: '£420k', change: '+£35k vs plan', trend: 'up' },
            { label: 'SLA hit rate', value: '96%', change: '+1.8 pts vs target', trend: 'up' },
            { label: 'Risk signals', value: '7', change: '+2 vs last week', trend: 'up' }
          ],
          charts: [
            {
              id: 'spend-by-region',
              title: 'Spend by Region',
              description: 'Month-to-date spend split by major metro cluster.',
              type: 'bar',
              dataKey: 'spend',
              data: [
                { name: 'North', spend: 82000 },
                { name: 'West', spend: 64000 },
                { name: 'South', spend: 54000 },
                { name: 'Central', spend: 91000 }
              ]
            },
            {
              id: 'automation-savings',
              title: 'Automation Savings Trend',
              description: 'Monthly labour hours saved by orchestration.',
              type: 'area',
              dataKey: 'hours',
              data: [
                { name: 'Nov', hours: 420 },
                { name: 'Dec', hours: 460 },
                { name: 'Jan', hours: 510 },
                { name: 'Feb', hours: 560 }
              ]
            },
            {
              id: 'risk-heatmap',
              title: 'Risk Heatmap',
              description: 'Open escalations segmented by severity.',
              type: 'line',
              dataKey: 'count',
              data: [
                { name: 'Critical', count: 3 },
                { name: 'High', count: 2 },
                { name: 'Medium', count: 5 },
                { name: 'Low', count: 8 }
              ]
            }
          ],
          upcoming: [
            { title: 'Portfolio strategy review', when: '19 Mar · 11:00', status: 'Executive steering' },
            { title: 'Automation roadmap sprint', when: '21 Mar · 09:00', status: 'Ops & product' },
            { title: 'Q2 vendor summit', when: '25 Mar · 15:30', status: 'Invites out' }
          ],
          insights: [
            'Deployment of robotics cleaning saved 122 labour hours this week.',
            'Legal recommends refreshing compliance docs in two healthcare facilities.',
            'Automation queue shows 4 low-complexity opportunities ready for rollout.',
            'Marketing wants to align campaigns with sustainability KPI improvements.'
          ]
        }
      },
      {
        id: 'calendar',
        icon: 'calendar',
        label: 'Portfolio Calendar',
        description: 'Cross-facility calendar spanning campaigns, maintenance, and governance.',
        type: 'calendar',
        data: {
          month: 'March 2025',
          legend: [
            { label: 'Maintenance program', status: 'confirmed' },
            { label: 'Campaign milestone', status: 'standby' },
            { label: 'Governance / audit', status: 'travel' },
            { label: 'Risk / escalation', status: 'risk' }
          ],
          weeks: [
            [
              { date: '24', isCurrentMonth: false, events: [] },
              { date: '25', isCurrentMonth: false, events: [] },
              { date: '26', isCurrentMonth: false, events: [] },
              { date: '27', isCurrentMonth: false, events: [] },
              { date: '28', isCurrentMonth: false, events: [] },
              { date: '1', isCurrentMonth: true, events: [{ title: 'Automation go-live prep', status: 'standby', time: 'All day' }] },
              { date: '2', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '3', isCurrentMonth: true, events: [{ title: 'Facilities automation audit', status: 'travel', time: '08:30' }] },
              { date: '4', isCurrentMonth: true, events: [{ title: 'Energy retrofit kickoff', status: 'confirmed', time: '10:00' }] },
              { date: '5', isCurrentMonth: true, events: [{ title: 'Campaign creative review', status: 'standby', time: '15:00' }] },
              { date: '6', isCurrentMonth: true, events: [{ title: 'Escalation: vendor delay', status: 'risk', time: '16:00' }] },
              { date: '7', isCurrentMonth: true, events: [] },
              { date: '8', isCurrentMonth: true, events: [{ title: 'Weekend automation deploy', status: 'confirmed', time: 'All day' }] },
              { date: '9', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '10', isCurrentMonth: true, events: [{ title: 'Compliance refresh • Healthcare', status: 'travel', time: 'All day' }] },
              { date: '11', isCurrentMonth: true, events: [{ title: 'Marketing campaign drop', status: 'standby', time: '09:00' }] },
              { date: '12', isCurrentMonth: true, events: [{ title: 'Escalation: contractor SLA', status: 'risk', time: '12:00' }] },
              { date: '13', isCurrentMonth: true, events: [{ title: 'Automation backlog review', status: 'standby', time: '15:00' }] },
              { date: '14', isCurrentMonth: true, events: [] },
              { date: '15', isCurrentMonth: true, events: [{ title: 'Sustainability audit', status: 'travel', time: '09:00' }] },
              { date: '16', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '17', isCurrentMonth: true, events: [{ title: 'Executive strategy review', status: 'standby', time: '11:00' }] },
              { date: '18', isCurrentMonth: true, events: [{ title: 'Automation sprint review', status: 'confirmed', time: '09:00' }] },
              { date: '19', isCurrentMonth: true, events: [{ title: 'Risk board review', status: 'risk', time: '15:00' }] },
              { date: '20', isCurrentMonth: true, events: [{ title: 'Vendor assessment day', status: 'travel', time: 'All day' }] },
              { date: '21', isCurrentMonth: true, events: [{ title: 'Portfolio strategy review', status: 'confirmed', time: '11:00' }] },
              { date: '22', isCurrentMonth: true, events: [{ title: 'Automation lab pilot', status: 'standby', time: 'All day' }] },
              { date: '23', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '24', isCurrentMonth: true, events: [{ title: 'Regional council audit', status: 'travel', time: '09:00' }] },
              { date: '25', isCurrentMonth: true, events: [{ title: 'Q2 vendor summit', status: 'confirmed', time: '15:30' }] },
              { date: '26', isCurrentMonth: true, events: [{ title: 'Automation release window', status: 'standby', time: 'All day' }] },
              { date: '27', isCurrentMonth: true, events: [{ title: 'Campaign analytics drop', status: 'confirmed', time: '08:00' }] },
              { date: '28', isCurrentMonth: true, events: [{ title: 'Risk mitigation plan', status: 'risk', time: '14:00' }] },
              { date: '29', isCurrentMonth: true, events: [{ title: 'Governance stand-up', status: 'travel', time: '10:00' }] },
              { date: '30', isCurrentMonth: true, events: [] }
            ]
          ]
        }
      },
      {
        id: 'portfolio',
        icon: 'enterprise',
        label: 'Program Portfolio',
        description: 'High-level snapshot of major initiatives across regions.',
        type: 'grid',
        data: {
          cards: [
            {
              title: 'Sustainability Acceleration',
              details: ['12 buildings retrofitted', '£68k energy savings to date', 'Wave 3 pilot launching Apr'],
              accent: 'from-emerald-100 via-white to-white'
            },
            {
              title: 'Smart Security Rollout',
              details: ['18 sites deployed', '5 awaiting permits', 'Automation playbooks reduce response 23%'],
              accent: 'from-sky-100 via-white to-white'
            },
            {
              title: 'Community Spaces Revamp',
              details: ['7 civic centres in delivery', '£2.1m total value', 'Engagement up 18%'],
              accent: 'from-amber-100 via-white to-white'
            }
          ]
        }
      },
      {
        id: 'campaigns',
        icon: 'pipeline',
        label: 'Campaign Delivery',
        description: 'Coordinate enterprise-wide campaigns from launch to ROI.',
        type: 'board',
        data: {
          columns: [
            {
              title: 'Discovery',
              items: [
                { title: 'Smart campus awareness', owner: 'Marketing', value: 'KPI: +15% awareness', eta: 'Brief 22 Mar' },
                { title: 'Safety compliance storytelling', owner: 'Comms', value: 'KPI: 4k impressions', eta: 'Research sprint' }
              ]
            },
            {
              title: 'In market',
              items: [
                { title: 'Sustainability pledge', owner: 'Marketing', value: 'KPI: 120 sign-ups', eta: 'Phase 2 live' },
                { title: 'Facilities concierge launch', owner: 'Product', value: 'KPI: +18 CSAT', eta: 'Weekly sync' }
              ]
            },
            {
              title: 'Measurement',
              items: [
                { title: 'Automation ROI recap', owner: 'Finance', value: 'KPI: £420k savings', eta: 'Dashboard refresh' },
                { title: 'Vendor satisfaction pulse', owner: 'Ops', value: 'KPI: 4.6★', eta: 'Survey closes 24 Mar' }
              ]
            },
            {
              title: 'Retrospective',
              items: [
                { title: 'Quarterly board pack', owner: 'Exec office', value: 'KPI: Exec alignment', eta: 'Compile 28 Mar' }
              ]
            }
          ]
        }
      },
      {
        id: 'finance',
        icon: 'finance',
        label: 'Financial Controls',
        description: 'Budget adherence, spend governance, and automation ROI.',
        type: 'table',
        data: {
          headers: ['Program', 'Budget', 'Actuals', 'Variance', 'Owner'],
          rows: [
            ['Smart Security', '£480k', '£452k', '-£28k', 'Security Office'],
            ['Energy Optimisation', '£620k', '£605k', '-£15k', 'Sustainability'],
            ['Automation Lab', '£310k', '£298k', '-£12k', 'Automation PMO'],
            ['Vendor Enablement', '£210k', '£224k', '+£14k', 'Operations']
          ]
        }
      },
      {
        id: 'compliance',
        icon: 'compliance',
        label: 'Compliance & Risk',
        description: 'Manage audits, risk registers, and remediation tasks.',
        type: 'list',
        data: {
          items: [
            {
              title: 'Healthcare facility documentation',
              description: 'Two facilities require updated infection control sign-off.',
              status: 'Action required'
            },
            {
              title: 'Fire safety certifications',
              description: 'Portfolio coverage at 92% — final two sites scheduled this week.',
              status: 'In progress'
            },
            {
              title: 'Escalation backlog',
              description: 'Seven risk signals open, one tagged critical, two high.',
              status: 'Monitor'
            }
          ]
        }
      },
      {
        id: 'vendors',
        icon: 'crew',
        label: 'Vendor Network',
        description: 'Performance, compliance and capacity across providers.',
        type: 'table',
        data: {
          headers: ['Vendor', 'Region', 'Performance', 'Capacity', 'Next review'],
          rows: [
            ['Metro Ops Collective', 'Greater London', '4.6★', 'High', '28 Mar 2025'],
            ['Harbour Facilities', 'Coastal South', '4.4★', 'Medium', '05 Apr 2025'],
            ['Northline Services', 'Northern Counties', '4.7★', 'High', '18 Apr 2025'],
            ['Greenway Maintenance', 'Scotland', '4.5★', 'Medium', '02 May 2025']
          ]
        }
      }
    ]
  },
  admin: {
    persona: 'admin',
    name: 'Admin Control Tower',
    headline: 'Command multi-tenant operations, compliance, zones, and assets in real time.',
    window: createWindow(),
      metadata: {
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
      },
    navigation: [
      {
        id: 'overview',
        icon: 'profile',
        label: 'Profile Overview',
        description: 'Network-wide bookings, SLA health, and platform status.',
        type: 'overview',
        analytics: {
          metrics: [
            { label: 'Active tenants', value: '128', change: '+6 vs last month', trend: 'up' },
            { label: 'SLA compliance', value: '95%', change: '+1.2 pts vs target', trend: 'up' },
            { label: 'Escalations', value: '9', change: '-3 vs last week', trend: 'down' },
            { label: 'Asset uptime', value: '98.4%', change: '+0.4 pts vs target', trend: 'up' }
          ],
          charts: [
            {
              id: 'tenant-growth',
              title: 'Tenant growth by month',
              description: 'New and retained tenants across the network.',
              type: 'line',
              dataKey: 'tenants',
              data: [
                { name: 'Dec', tenants: 112 },
                { name: 'Jan', tenants: 118 },
                { name: 'Feb', tenants: 122 },
                { name: 'Mar', tenants: 128 }
              ]
            },
            {
              id: 'sla-health',
              title: 'SLA performance',
              description: 'Share of tenants hitting response SLAs.',
              type: 'area',
              dataKey: 'sla',
              data: [
                { name: 'Week 1', sla: 91 },
                { name: 'Week 2', sla: 93 },
                { name: 'Week 3', sla: 94 },
                { name: 'Week 4', sla: 95 }
              ]
            },
            {
              id: 'asset-uptime',
              title: 'Asset uptime by zone',
              description: 'Availability percentage across active zones.',
              type: 'bar',
              dataKey: 'uptime',
              data: [
                { name: 'Zone A', uptime: 98.1 },
                { name: 'Zone B', uptime: 97.4 },
                { name: 'Zone C', uptime: 99.0 },
                { name: 'Zone D', uptime: 98.6 }
              ]
            }
          ],
          upcoming: [
            { title: 'Tenant onboarding sprint', when: '18 Mar · 09:30', status: 'Ops + Product' },
            { title: 'Platform status review', when: '19 Mar · 15:00', status: 'Engineering update' },
            { title: 'Executive incident drill', when: '21 Mar · 08:45', status: 'Security operations' }
          ],
          insights: [
            'Platform automation saved 64 analyst hours last week.',
            'Zones C & D nearing vehicle capacity thresholds — consider rebalancing.',
            'Two tenants approaching SLA escalation window — concierge notified.',
            'Risk queue reduced by 28% after new verification workflow.'
          ]
        }
      },
      {
        id: 'calendar',
        icon: 'calendar',
        label: 'Network Calendar',
        description: 'Central schedule for maintenance windows, releases, and audits.',
        type: 'calendar',
        data: {
          month: 'March 2025',
          legend: [
            { label: 'Maintenance window', status: 'confirmed' },
            { label: 'Platform release', status: 'standby' },
            { label: 'Audit / governance', status: 'travel' },
            { label: 'Escalation drill', status: 'risk' }
          ],
          weeks: [
            [
              { date: '24', isCurrentMonth: false, events: [] },
              { date: '25', isCurrentMonth: false, events: [] },
              { date: '26', isCurrentMonth: false, events: [] },
              { date: '27', isCurrentMonth: false, events: [] },
              { date: '28', isCurrentMonth: false, events: [] },
              { date: '1', isCurrentMonth: true, events: [{ title: 'Platform release hardening', status: 'standby', time: 'All day' }] },
              { date: '2', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '3', isCurrentMonth: true, events: [{ title: 'Zone B maintenance', status: 'confirmed', time: '02:00-04:00' }] },
              { date: '4', isCurrentMonth: true, events: [{ title: 'Data residency audit', status: 'travel', time: '09:00' }] },
              { date: '5', isCurrentMonth: true, events: [{ title: 'Release planning sync', status: 'standby', time: '16:00' }] },
              { date: '6', isCurrentMonth: true, events: [{ title: 'Escalation tabletop', status: 'risk', time: '14:30' }] },
              { date: '7', isCurrentMonth: true, events: [] },
              { date: '8', isCurrentMonth: true, events: [{ title: 'Tenant feature preview', status: 'standby', time: 'All day' }] },
              { date: '9', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '10', isCurrentMonth: true, events: [{ title: 'Zone D maintenance', status: 'confirmed', time: '01:00-03:00' }] },
              { date: '11', isCurrentMonth: true, events: [{ title: 'Vendor compliance checks', status: 'travel', time: '10:30' }] },
              { date: '12', isCurrentMonth: true, events: [{ title: 'Incident drill', status: 'risk', time: '15:00' }] },
              { date: '13', isCurrentMonth: true, events: [{ title: 'Platform release', status: 'confirmed', time: '02:30-04:30' }] },
              { date: '14', isCurrentMonth: true, events: [] },
              { date: '15', isCurrentMonth: true, events: [{ title: 'Zone planning workshop', status: 'standby', time: 'All day' }] },
              { date: '16', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '17', isCurrentMonth: true, events: [{ title: 'Tenant onboarding sprint', status: 'standby', time: '09:30' }] },
              { date: '18', isCurrentMonth: true, events: [{ title: 'Platform release', status: 'confirmed', time: '02:00-04:00' }] },
              { date: '19', isCurrentMonth: true, events: [{ title: 'Security audit', status: 'travel', time: '10:00' }] },
              { date: '20', isCurrentMonth: true, events: [{ title: 'Ops council', status: 'standby', time: '13:00' }] },
              { date: '21', isCurrentMonth: true, events: [{ title: 'Executive incident drill', status: 'risk', time: '08:45' }] },
              { date: '22', isCurrentMonth: true, events: [{ title: 'Zone C maintenance', status: 'confirmed', time: '01:30-03:30' }] },
              { date: '23', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '24', isCurrentMonth: true, events: [{ title: 'Platform release candidate', status: 'standby', time: 'All day' }] },
              { date: '25', isCurrentMonth: true, events: [{ title: 'Tenant advisory council', status: 'confirmed', time: '11:00' }] },
              { date: '26', isCurrentMonth: true, events: [{ title: 'Data privacy audit', status: 'travel', time: '09:00' }] },
              { date: '27', isCurrentMonth: true, events: [{ title: 'Escalation readiness review', status: 'risk', time: '15:30' }] },
              { date: '28', isCurrentMonth: true, events: [{ title: 'Zone D calibration', status: 'confirmed', time: '02:00-04:00' }] },
              { date: '29', isCurrentMonth: true, events: [{ title: 'Platform release', status: 'confirmed', time: '02:30-04:30' }] },
              { date: '30', isCurrentMonth: true, events: [{ title: 'Weekend audit prep', status: 'standby', time: 'All day' }] }
            ]
          ]
        }
      },
      {
        id: 'operations',
        icon: 'pipeline',
        label: 'Operations Pipeline',
        description: 'Monitor multi-tenant workflows, escalations, and readiness.',
        type: 'board',
        data: {
          columns: [
            {
              title: 'Needs attention',
              items: [
                { title: 'Tenant escalation #4821', owner: 'Zone B', value: 'SLA breach risk', eta: 'Respond within 2h' },
                { title: 'Legal review: contract addendum', owner: 'Enterprise ops', value: 'Sign-off pending', eta: 'Due 20 Mar' }
              ]
            },
            {
              title: 'In progress',
              items: [
                { title: 'Zone optimisation sprint', owner: 'Network planning', value: '18 zones', eta: 'Wrap 28 Mar' },
                { title: 'Tenant onboarding batch', owner: 'Growth ops', value: '5 tenants', eta: 'Go-live 22 Mar' }
              ]
            },
            {
              title: 'At risk',
              items: [
                { title: 'Service credit negotiation', owner: 'Finance', value: '£4.2k exposure', eta: 'Meeting 18 Mar' },
                { title: 'Asset shortage: lifts', owner: 'Logistics', value: '3 units', eta: 'Expedite shipment' }
              ]
            },
            {
              title: 'Recently resolved',
              items: [
                { title: 'Incident drill follow-up', owner: 'Security ops', value: 'Completed', eta: 'Reporting' },
                { title: 'Tenant billing migration', owner: 'Finance ops', value: 'Completed', eta: 'Post-mortem scheduled' }
              ]
            }
          ]
        }
      },
      {
        id: 'availability',
        icon: 'crew',
        label: 'Serviceman Management',
        description: 'Crew availability, standby coverage, and certification gaps.',
        type: 'availability',
        data: {
          summary: { openSlots: '8', standbyCrews: '3', followUps: '2' },
          days: ['Mon 17', 'Tue 18', 'Wed 19', 'Thu 20', 'Fri 21'],
          resources: [
            {
              name: 'Zone Alpha lead',
              role: 'Senior technician',
              status: 'Full coverage',
              allocations: [
                { day: 'Mon 17', status: 'Booked', window: '06:00-16:00' },
                { day: 'Tue 18', status: 'Booked', window: '06:00-16:00' },
                { day: 'Wed 19', status: 'Travel', window: '09:00-11:00' },
                { day: 'Thu 20', status: 'Standby', window: 'All day' },
                { day: 'Fri 21', status: 'Booked', window: '06:00-16:00' }
              ]
            },
            {
              name: 'Zone Beta crew',
              role: 'Rapid response',
              status: 'Standby coverage',
              allocations: [
                { day: 'Mon 17', status: 'Standby', window: 'All day' },
                { day: 'Tue 18', status: 'Standby', window: 'All day' },
                { day: 'Wed 19', status: 'Booked', window: '07:00-15:00' },
                { day: 'Thu 20', status: 'Booked', window: '07:00-15:00' },
                { day: 'Fri 21', status: 'OOO', window: 'Training' }
              ]
            },
            {
              name: 'Zone Delta support',
              role: 'Compliance specialists',
              status: 'Focused on audits',
              allocations: [
                { day: 'Mon 17', status: 'Booked', window: '08:00-18:00' },
                { day: 'Tue 18', status: 'Travel', window: '10:00-12:00' },
                { day: 'Wed 19', status: 'Booked', window: '08:00-18:00' },
                { day: 'Thu 20', status: 'Booked', window: '08:00-18:00' },
                { day: 'Fri 21', status: 'Standby', window: 'All day' }
              ]
            }
          ]
        }
      },
      {
        id: 'assets',
        icon: 'assets',
        label: 'Asset & Rental Control',
        description: 'Fleet health, inspection cadence, and utilisation by zone.',
        type: 'table',
        data: {
          headers: ['Asset group', 'In field', 'Inspection due', 'Zone coverage', 'Next action'],
          rows: [
            ['MEWP platforms', '24', '3 overdue', 'Zones A, B, D', 'Schedule mobile inspection'],
            ['Sanitation pods', '18', '1 due', 'Zones C, F', 'Restock supplies'],
            ['Thermal cameras', '32', '0 due', 'All zones', 'Rotate to Zone E standby'],
            ['Fleet vehicles', '46', '5 due', 'Network wide', 'Book MOT batch']
          ]
        }
      },
      {
        id: 'zones',
        icon: 'map',
        label: 'Zone Design Studio',
        description: 'Draw, manage, and simulate multi-tenant service zones.',
        type: 'zones',
        data: {
          canvas: [
            ['A', 'A', 'B', 'B', 'C'],
            ['A', 'A', 'B', 'C', 'C'],
            ['D', 'D', 'B', 'C', 'E'],
            ['D', 'F', 'F', 'E', 'E']
          ],
          zones: [
            { code: 'A', region: 'North loop', color: '#bfdbfe', lead: 'Harper Quinn', workload: '82% utilisation' },
            { code: 'B', region: 'Central core', color: '#a7f3d0', lead: 'Noah Patel', workload: '76% utilisation' },
            { code: 'C', region: 'South district', color: '#fde68a', lead: 'Isla Mensah', workload: '68% utilisation' },
            { code: 'D', region: 'Industrial belt', color: '#fca5a5', lead: 'Milo Evans', workload: '89% utilisation' },
            { code: 'E', region: 'Coastal', color: '#c4b5fd', lead: 'Sofia Reyes', workload: '71% utilisation' },
            { code: 'F', region: 'Airport corridor', color: '#bbf7d0', lead: 'Leo Smith', workload: '64% utilisation' }
          ],
          drafts: [
            { title: 'Micro-zone overlay', description: 'Split Zone B into micro-areas to reduce travel.' },
            { title: 'Event mode', description: 'Temporary weekend zones for major sporting events.' }
          ],
          actions: [
            'Validate coverage heatmap before releasing new tenant cluster.',
            'Share updated zone plan with logistics and compliance teams.',
            'Publish overnight rotation for airport corridor (Zone F).'
          ]
        }
      },
      {
        id: 'settings',
        icon: 'settings',
        label: 'Platform Settings',
        description: 'Control tenants, feature flags, governance, and notifications.',
        type: 'settings',
        data: {
          panels: [
            {
              id: 'tenants',
              title: 'Tenant controls',
              description: 'Provisioning, rate cards, and access delegation.',
              items: [
                { id: 'tenant-onboarding', label: 'Auto-provision onboarding', type: 'toggle', enabled: true, meta: 'Applies to growth plan' },
                { id: 'tenant-quiet-hours', label: 'Global quiet hours', type: 'value', value: '22:00-06:00 UTC', meta: 'Override per tenant' }
              ]
            },
            {
              id: 'governance',
              title: 'Governance & audit',
              description: 'Keep audit logs and compliance exports ready.',
              items: [
                { id: 'audit-retention', label: 'Audit log retention', type: 'value', value: '18 months', meta: 'Enterprise default' },
                { id: 'gov-escalations', label: 'Auto-escalate critical alerts', type: 'toggle', enabled: true }
              ]
            },
            {
              id: 'notifications-admin',
              title: 'Notification policy',
              description: 'Escalation channels for major incidents.',
              items: [
                { id: 'notify-exec', label: 'Executive bridge', type: 'toggle', enabled: true, meta: 'SMS + Slack bridge' },
                { id: 'notify-ops', label: 'Ops heartbeat', type: 'toggle', enabled: true, meta: 'Email hourly digest' }
              ]
            }
          ]
        }
      }
    ]
  }
};

export default mockDashboards;
