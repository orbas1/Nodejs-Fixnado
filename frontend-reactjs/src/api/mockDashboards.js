const createWindow = () => ({
  label: 'Next 30 days',
  start: '2025-03-01T00:00:00Z',
  end: '2025-03-30T23:59:59Z',
  timezone: 'Europe/London'
});

const mockDashboards = {
  user: {
    persona: 'user',
    name: 'User Command Center',
    headline: 'Coordinate service orders, rentals, availability, and support in one workspace.',
    window: createWindow(),
    metadata: {
      user: {
        id: 'USR-2488',
        name: 'Avery Stone',
        email: 'avery@fixnado.com',
        company: 'Stone Facilities Co-op'
      },
      totals: {
        bookings: 22,
        activeBookings: 8,
        spend: '£31.6k',
        rentals: 6,
        disputes: 1,
        conversations: 15
      }
    },
    navigation: [
      {
        id: 'overview',
        icon: 'profile',
        label: 'Profile Overview',
        description: 'Bookings, spend and risk signals tailored to Avery’s organisation.',
        type: 'overview',
        analytics: {
          metrics: [
            { label: 'Active jobs', value: '22', change: '+4 vs prior window', trend: 'up' },
            { label: 'Spend processed', value: '£31.6k', change: '+£6.8k vs target', trend: 'up' },
            { label: 'Completion rate', value: '95%', change: '+1.5 pts vs SLA', trend: 'up' },
            { label: 'Open disputes', value: '1', change: '-1 vs prior window', trend: 'down' }
          ],
          charts: [
            {
              id: 'jobs-by-week',
              title: 'Jobs Scheduled per Week',
              description: 'Volume of bookings captured each week across all facilities.',
              type: 'line',
              dataKey: 'count',
              data: [
                { name: 'Week 1', count: 5 },
                { name: 'Week 2', count: 7 },
                { name: 'Week 3', count: 4 },
                { name: 'Week 4', count: 6 }
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
                { name: 'Week 1', invoices: 6200, escrow: 4100 },
                { name: 'Week 2', invoices: 7800, escrow: 6400 },
                { name: 'Week 3', invoices: 5200, escrow: 3900 },
                { name: 'Week 4', invoices: 7400, escrow: 7100 }
              ]
            },
            {
              id: 'support-velocity',
              title: 'Support Velocity',
              description: 'First-response minutes for concierge and escalation threads.',
              type: 'area',
              dataKey: 'minutes',
              data: [
                { name: 'Week 1', minutes: 21 },
                { name: 'Week 2', minutes: 18 },
                { name: 'Week 3', minutes: 17 },
                { name: 'Week 4', minutes: 15 }
              ]
            }
          ],
          upcoming: [
            { title: 'HVAC seasonal service', when: '18 Mar · 09:00', status: 'Confirmed' },
            { title: 'Escrow release review', when: '19 Mar · 14:30', status: 'Finance hand-off' },
            { title: 'Community centre deep clean', when: '21 Mar · 07:30', status: 'Crew brief 06:45' },
            { title: 'Smart thermostat rollout', when: '25 Mar · 10:15', status: 'Design approvals' }
          ],
          insights: [
            'Leverage bundled callouts to keep travel time under 25 minutes.',
            'Escrow releases older than 5 days should escalate to finance.',
            'Portfolio CSAT lifted 0.4 pts after concierge outreach cadence.',
            'Two rentals nearing inspection require proof-of-service uploads.'
          ]
        }
      },
      {
        id: 'calendar',
        icon: 'calendar',
        label: 'Service Calendar',
        description: 'Month view of all upcoming visits, inspections, and support follow-ups.',
        type: 'calendar',
        data: {
          month: 'March 2025',
          legend: [
            { label: 'Confirmed visit', status: 'confirmed' },
            { label: 'Standby crew', status: 'standby' },
            { label: 'Travel / prep', status: 'travel' },
            { label: 'Escalation risk', status: 'risk' }
          ],
          weeks: [
            [
              { date: '24', isCurrentMonth: false, events: [] },
              { date: '25', isCurrentMonth: false, events: [] },
              { date: '26', isCurrentMonth: false, events: [] },
              { date: '27', isCurrentMonth: false, events: [] },
              { date: '28', isCurrentMonth: false, events: [] },
              { date: '1', isCurrentMonth: true, events: [{ title: 'Depot inventory audit', status: 'travel', time: '08:00' }] },
              { date: '2', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '3', isCurrentMonth: true, events: [{ title: 'Retail lighting retrofit', status: 'confirmed', time: '09:30' }] },
              { date: '4', isCurrentMonth: true, events: [{ title: 'Pool chemical balance', status: 'confirmed', time: '13:00' }] },
              { date: '5', isCurrentMonth: true, events: [{ title: 'Insurance audit prep', status: 'standby', time: 'All day' }] },
              { date: '6', isCurrentMonth: true, events: [{ title: 'Escalation: boiler repair', status: 'risk', time: 'SLA 4h' }] },
              { date: '7', isCurrentMonth: true, events: [] },
              { date: '8', isCurrentMonth: true, events: [{ title: 'Condo HVAC tune-up', status: 'confirmed', time: '08:45' }] },
              { date: '9', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '10', isCurrentMonth: true, events: [{ title: 'Fleet sanitation', status: 'confirmed', time: '07:30' }] },
              { date: '11', isCurrentMonth: true, events: [{ title: 'Fire safety drill', status: 'standby', time: '15:00' }] },
              { date: '12', isCurrentMonth: true, events: [{ title: 'Escrow review 4821', status: 'risk', time: 'Finance' }] },
              { date: '13', isCurrentMonth: true, events: [{ title: 'Access control upgrade', status: 'confirmed', time: '11:00' }] },
              { date: '14', isCurrentMonth: true, events: [] },
              { date: '15', isCurrentMonth: true, events: [{ title: 'Depot inventory catch-up', status: 'travel', time: '13:30' }] },
              { date: '16', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '17', isCurrentMonth: true, isToday: true, capacity: '2 slots', events: [{ title: 'Escrow release audit', status: 'confirmed', time: '09:00' }] },
              { date: '18', isCurrentMonth: true, capacity: '1 slot', events: [{ title: 'HVAC seasonal service', status: 'confirmed', time: '09:00' }] },
              { date: '19', isCurrentMonth: true, capacity: '1 slot', events: [{ title: 'Escrow review board', status: 'risk', time: '14:30' }] },
              { date: '20', isCurrentMonth: true, capacity: '3 slots', events: [{ title: 'Rooftop access permit', status: 'pending', time: 'All day' }] },
              { date: '21', isCurrentMonth: true, events: [{ title: 'Community centre deep clean', status: 'confirmed', time: '07:30' }] },
              { date: '22', isCurrentMonth: true, events: [{ title: 'Crew rest day', status: 'standby', time: 'All day' }] },
              { date: '23', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '24', isCurrentMonth: true, events: [{ title: 'Smart thermostat rollout', status: 'confirmed', time: '10:15' }] },
              { date: '25', isCurrentMonth: true, events: [{ title: 'Tenant onboarding', status: 'standby', time: '16:00' }] },
              { date: '26', isCurrentMonth: true, events: [{ title: 'Post-work inspection', status: 'confirmed', time: '08:30' }] },
              { date: '27', isCurrentMonth: true, events: [] },
              { date: '28', isCurrentMonth: true, events: [{ title: 'Dispute follow-up 1142', status: 'risk', time: '15:00' }] },
              { date: '29', isCurrentMonth: true, events: [] },
              { date: '30', isCurrentMonth: true, events: [{ title: 'Weekend concierge sweep', status: 'standby', time: 'All day' }] }
            ]
          ]
        }
      },
      {
        id: 'orders',
        icon: 'pipeline',
        label: 'Work Orders',
        description: 'Escrow, delivery, and follow-up pipeline with risk visibility.',
        type: 'board',
        data: {
          columns: [
            {
              title: 'Requests',
              items: [
                { title: 'Retail lighting upgrade', owner: 'Downtown Core', value: '£1.9k', eta: 'Quote due in 4h' },
                { title: 'Office sanitisation', owner: 'Harbour Tower', value: '£1.1k', eta: 'Needs crew assignment' }
              ]
            },
            {
              title: 'Scheduled',
              items: [
                { title: 'Community centre clean', owner: 'Zone B', value: '£1.4k', eta: 'Crew check-in 18 Mar · 07:00' },
                { title: 'Smart thermostat rollout', owner: 'Residential West', value: '£2.9k', eta: 'Kick-off 25 Mar · 10:15' }
              ]
            },
            {
              title: 'At Risk',
              items: [
                { title: 'Escrow release #4821', owner: 'Finance', value: '£1.3k', eta: 'Approval overdue' },
                { title: 'Pipe repair follow-up', owner: 'Ops escalation', value: '£820', eta: 'SLA breach in 6h' }
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
        id: 'availability',
        icon: 'availability',
        label: 'Availability Planner',
        description: 'Manage crew capacity, standbys, and concierge coverage.',
        type: 'availability',
        data: {
          summary: { openSlots: '4', standbyCrews: '2', followUps: '1' },
          days: ['Mon 17', 'Tue 18', 'Wed 19', 'Thu 20', 'Fri 21'],
          resources: [
            {
              name: 'Service Pod Alpha',
              role: 'HVAC & Electrical',
              status: 'On call • 24h notice',
              allocations: [
                { day: 'Mon 17', status: 'Booked', window: '07:00-17:00' },
                { day: 'Tue 18', status: 'Booked', window: '08:00-16:00' },
                { day: 'Wed 19', status: 'Travel', window: '07:00-09:00' },
                { day: 'Thu 20', status: 'Standby', window: 'All day' },
                { day: 'Fri 21', status: 'Booked', window: '06:30-15:00' }
              ]
            },
            {
              name: 'Service Pod Delta',
              role: 'Deep Clean & Sanitation',
              status: 'Rotational standby',
              allocations: [
                { day: 'Mon 17', status: 'Standby', window: 'All day' },
                { day: 'Tue 18', status: 'Booked', window: '09:00-18:00' },
                { day: 'Wed 19', status: 'Booked', window: '10:00-20:00' },
                { day: 'Thu 20', status: 'OOO', window: 'Crew rest' },
                { day: 'Fri 21', status: 'Travel', window: '08:00-10:00' }
              ]
            },
            {
              name: 'Concierge Desk',
              role: 'Client communications',
              status: 'Extended hours',
              allocations: [
                { day: 'Mon 17', status: 'Standby', window: '06:00-20:00' },
                { day: 'Tue 18', status: 'Booked', window: '07:00-19:00' },
                { day: 'Wed 19', status: 'Booked', window: '07:00-19:00' },
                { day: 'Thu 20', status: 'Booked', window: '07:00-19:00' },
                { day: 'Fri 21', status: 'Booked', window: '07:00-17:00' }
              ]
            }
          ]
        }
      },
      {
        id: 'rentals',
        icon: 'assets',
        label: 'Asset Management',
        description: 'Track rentals, inspections, deposits, and service pairings.',
        type: 'table',
        data: {
          headers: ['Rental', 'Asset', 'Status', 'Return Due', 'Deposit'],
          rows: [
            ['Rental #9821', 'Thermal imaging camera', 'In field • paired with job #764', '20 Mar 2025', '£250'],
            ['Rental #9774', 'Dehumidifier set', 'Inspection pending', 'Returned 15 Mar', '£150'],
            ['Rental #9730', 'Lift platform', 'On hold • awaiting permit', 'Extension requested', '£600'],
            ['Rental #9688', 'Air scrubber duo', 'Ready for pickup', 'Scheduled 24 Mar', '£180']
          ]
        }
      },
      {
        id: 'support',
        icon: 'support',
        label: 'Support & Communications',
        description: 'Concierge follow-ups, compliance checkpoints, and escalations.',
        type: 'list',
        data: {
          items: [
            {
              title: 'Upload completion photos • City Schools contract',
              description: 'Finance will release escrow once documentation is attached.',
              status: 'Action required'
            },
            {
              title: 'Confirm insurance documentation',
              description: 'Liability certificate renewal due within 8 days.',
              status: 'Due soon'
            },
            {
              title: 'Respond to concierge follow-up',
              description: 'Operations asked for status on dispute #DP-301.',
              status: 'In progress'
            },
            {
              title: 'Enable quiet hours for weekend',
              description: 'Set notification rules ahead of weekend concierge sweep.',
              status: 'Suggested'
            }
          ]
        }
      },
      {
        id: 'settings',
        icon: 'settings',
        label: 'Account Settings',
        description: 'Identity, security, notification, and automation preferences.',
        type: 'settings',
        data: {
          panels: [
            {
              id: 'profile',
              title: 'Profile & Identity',
              description: 'Manage how Avery appears to partners and crews.',
              items: [
                { id: 'profile-name', label: 'Display name', type: 'value', value: 'Avery Stone' },
                { id: 'profile-email', label: 'Primary email', type: 'value', value: 'avery@fixnado.com' },
                { id: 'profile-phone', label: 'SMS alerts', type: 'value', value: '+44 7700 900123' }
              ]
            },
            {
              id: 'security',
              title: 'Security & Access',
              description: 'SAML, MFA, and delegated access controls.',
              items: [
                { id: 'security-mfa', label: 'Multi-factor authentication', type: 'toggle', enabled: true },
                { id: 'security-sso', label: 'SAML single sign-on', type: 'toggle', enabled: false, helper: 'Available on enterprise plan' }
              ]
            },
            {
              id: 'notifications',
              title: 'Notification Rules',
              description: 'Decide who hears about dispatch changes and escalations.',
              items: [
                { id: 'notify-dispatch', label: 'Dispatch updates', type: 'toggle', enabled: true, meta: 'Slack + Email' },
                { id: 'notify-escrow', label: 'Escrow approvals', type: 'toggle', enabled: true, meta: 'Finance + Avery' },
                { id: 'notify-concierge', label: 'Concierge inbox', type: 'toggle', enabled: false, meta: 'Disabled weekends' }
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
    headline: 'Stay ahead of assignments, travel buffers, availability, and compliance.',
    window: createWindow(),
    metadata: {
      crewMember: {
        id: 'SRV-2210',
        name: 'Jordan Miles',
        role: 'Lead field technician',
        region: 'Metro North'
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
        icon: 'profile',
        label: 'Profile Overview',
        description: 'Assignments, travel, and quality trends for Jordan’s crew.',
        type: 'overview',
        analytics: {
          metrics: [
            { label: 'Active assignments', value: '12', change: '+2 vs prior window', trend: 'up' },
            { label: 'On-time arrivals', value: '92%', change: '+4 pts vs target', trend: 'up' },
            { label: 'Completion quality', value: '4.8★', change: '+0.2 vs prior window', trend: 'up' },
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
            },
            {
              id: 'qa-scores',
              title: 'QA Inspection Scores',
              description: 'Latest field quality audits by property type.',
              type: 'bar',
              dataKey: 'score',
              data: [
                { name: 'Healthcare', score: 4.9 },
                { name: 'Hospitality', score: 4.6 },
                { name: 'Retail', score: 4.5 },
                { name: 'Public sector', score: 4.7 }
              ]
            }
          ],
          upcoming: [
            { title: 'High-rise elevator reset', when: '18 Mar · 08:30', status: 'Dispatch from depot' },
            { title: 'Hospital sterilisation', when: '18 Mar · 13:15', status: 'Crew brief 1h prior' },
            { title: 'University access control', when: '19 Mar · 09:00', status: 'Prep QA checklist' },
            { title: 'Weekly debrief', when: '19 Mar · 17:30', status: 'Ops manager sync' }
          ],
          insights: [
            'Combine two downtown tickets to reclaim 18 minutes of travel.',
            'Schedule calibration kit swap before Friday to avoid delays.',
            'Average CSAT improved 0.2 points after new completion checklist.',
            'Confirm spare PPE stock before next hospital rotation.'
          ]
        }
      },
      {
        id: 'calendar',
        icon: 'calendar',
        label: 'Crew Calendar',
        description: 'Shift-level view of confirmed work, travel, and readiness.',
        type: 'calendar',
        data: {
          month: 'March 2025',
          legend: [
            { label: 'Confirmed job', status: 'confirmed' },
            { label: 'Travel / logistics', status: 'travel' },
            { label: 'Standby', status: 'standby' },
            { label: 'Risk / escalation', status: 'risk' }
          ],
          weeks: [
            [
              { date: '24', isCurrentMonth: false, events: [] },
              { date: '25', isCurrentMonth: false, events: [] },
              { date: '26', isCurrentMonth: false, events: [] },
              { date: '27', isCurrentMonth: false, events: [] },
              { date: '28', isCurrentMonth: false, events: [] },
              { date: '1', isCurrentMonth: true, events: [{ title: 'Depot inventory', status: 'travel', time: '07:00' }] },
              { date: '2', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '3', isCurrentMonth: true, events: [{ title: 'Thermal imaging survey', status: 'confirmed', time: '08:30' }] },
              { date: '4', isCurrentMonth: true, events: [{ title: 'Retail lighting retrofit', status: 'confirmed', time: '09:15' }] },
              { date: '5', isCurrentMonth: true, events: [{ title: 'Escalation check-in', status: 'risk', time: '16:00' }] },
              { date: '6', isCurrentMonth: true, events: [{ title: 'Crew learning block', status: 'standby', time: '13:00' }] },
              { date: '7', isCurrentMonth: true, events: [] },
              { date: '8', isCurrentMonth: true, events: [{ title: 'Emergency HVAC', status: 'confirmed', time: '07:30' }] },
              { date: '9', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '10', isCurrentMonth: true, events: [{ title: 'Depot restock', status: 'travel', time: '08:00' }] },
              { date: '11', isCurrentMonth: true, events: [{ title: 'Commercial deep clean', status: 'confirmed', time: '10:00' }] },
              { date: '12', isCurrentMonth: true, events: [{ title: 'Hospital sterilisation', status: 'confirmed', time: '13:15' }] },
              { date: '13', isCurrentMonth: true, events: [{ title: 'Escrow audit support', status: 'standby', time: 'All day' }] },
              { date: '14', isCurrentMonth: true, events: [] },
              { date: '15', isCurrentMonth: true, events: [{ title: 'Permit pickup', status: 'travel', time: '11:30' }] },
              { date: '16', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '17', isCurrentMonth: true, events: [{ title: 'Escrow release audit', status: 'standby', time: '09:00' }] },
              { date: '18', isCurrentMonth: true, events: [{ title: 'High-rise elevator reset', status: 'confirmed', time: '08:30' }] },
              { date: '19', isCurrentMonth: true, isToday: true, events: [{ title: 'University access control', status: 'confirmed', time: '09:00' }] },
              { date: '20', isCurrentMonth: true, events: [{ title: 'Field coaching', status: 'standby', time: '14:00' }] },
              { date: '21', isCurrentMonth: true, events: [{ title: 'Fleet vehicle inspection', status: 'travel', time: '10:00' }] },
              { date: '22', isCurrentMonth: true, events: [{ title: 'Crew rest day', status: 'standby', time: 'All day' }] },
              { date: '23', isCurrentMonth: true, events: [] }
            ],
            [
              { date: '24', isCurrentMonth: true, events: [{ title: 'Access control rollout', status: 'confirmed', time: '08:45' }] },
              { date: '25', isCurrentMonth: true, events: [{ title: 'Retail chain audit', status: 'confirmed', time: '12:30' }] },
              { date: '26', isCurrentMonth: true, events: [{ title: 'Hospital QA review', status: 'risk', time: '16:30' }] },
              { date: '27', isCurrentMonth: true, events: [{ title: 'Quarterly board prep', status: 'standby', time: 'All day' }] },
              { date: '28', isCurrentMonth: true, events: [{ title: 'Tooling calibration', status: 'travel', time: '08:00' }] },
              { date: '29', isCurrentMonth: true, events: [] },
              { date: '30', isCurrentMonth: true, events: [] }
            ]
          ]
        }
      },
      {
        id: 'availability',
        icon: 'availability',
        label: 'Shift Availability',
        description: 'Update personal availability, leave, and supporting pods.',
        type: 'availability',
        data: {
          summary: { openSlots: '3', standbyCrews: '1', followUps: '2' },
          days: ['Mon 17', 'Tue 18', 'Wed 19', 'Thu 20', 'Fri 21'],
          resources: [
            {
              name: 'Jordan Miles',
              role: 'Lead technician',
              status: 'Primary dispatch',
              allocations: [
                { day: 'Mon 17', status: 'Booked', window: '07:00-17:00' },
                { day: 'Tue 18', status: 'Booked', window: '08:00-18:00' },
                { day: 'Wed 19', status: 'Booked', window: '08:00-16:00' },
                { day: 'Thu 20', status: 'Standby', window: 'On-call' },
                { day: 'Fri 21', status: 'Travel', window: '07:00-09:00' }
              ]
            },
            {
              name: 'Shadow Crew',
              role: 'Apprentice support',
              status: 'Pairing with Jordan',
              allocations: [
                { day: 'Mon 17', status: 'Standby', window: 'All day' },
                { day: 'Tue 18', status: 'Booked', window: '09:00-17:00' },
                { day: 'Wed 19', status: 'Booked', window: '09:00-15:00' },
                { day: 'Thu 20', status: 'Booked', window: '09:00-17:00' },
                { day: 'Fri 21', status: 'OOO', window: 'Training' }
              ]
            },
            {
              name: 'Specialist Pool',
              role: 'HVAC escalation',
              status: 'Second line',
              allocations: [
                { day: 'Mon 17', status: 'Standby', window: 'All day' },
                { day: 'Tue 18', status: 'Standby', window: 'All day' },
                { day: 'Wed 19', status: 'Travel', window: '10:00-12:00' },
                { day: 'Thu 20', status: 'Booked', window: '12:00-20:00' },
                { day: 'Fri 21', status: 'Booked', window: '07:00-15:00' }
              ]
            }
          ]
        }
      },
      {
        id: 'schedule',
        icon: 'pipeline',
        label: 'Job Pipeline',
        description: 'Visualise dispatch by day, risk, and completion state.',
        type: 'board',
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
              title: 'Recently completed',
              items: [
                { title: 'Emergency HVAC', owner: 'Municipal Centre', value: 'Completed', eta: 'QA pending' },
                { title: 'Downtown sanitisation', owner: 'Ops Pod Beta', value: 'Completed', eta: 'Survey scheduled' }
              ]
            }
          ]
        }
      },
      {
        id: 'toolkit',
        icon: 'assets',
        label: 'Asset Kit',
        description: 'Track issued equipment, calibration, and readiness.',
        type: 'table',
        data: {
          headers: ['Asset', 'Status', 'Calibration', 'Next action'],
          rows: [
            ['Thermal imaging camera', 'In field', 'Valid · due 28 Apr', 'Return to depot 22 Mar'],
            ['Respirator set', 'Ready', 'Valid · due 12 Jun', 'Fit test with apprentices'],
            ['PPE kit – medical', 'In delivery', 'Valid · due 03 Jul', 'Restock after hospital job'],
            ['MEWP harness', 'Inspection due', 'Expired 10 Mar', 'Book inspection slot']
          ]
        }
      },
      {
        id: 'training',
        icon: 'compliance',
        label: 'Training & Compliance',
        description: 'Mandatory certifications, toolbox talks, and crew learning.',
        type: 'list',
        data: {
          items: [
            {
              title: 'Confined space certification',
              description: 'Renewal module assigned · Expires 02 Apr 2025.',
              status: 'Due soon'
            },
            {
              title: 'Hospital infection control refresher',
              description: 'Video briefing + quiz assigned to Jordan and apprentice.',
              status: 'In progress'
            },
            {
              title: 'Toolbox talk – travel safety',
              description: 'Record attendance with crew before 22 Mar.',
              status: 'Action required'
            }
          ]
        }
      }
    ]
  },
  provider: {
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
  },
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
