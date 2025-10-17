import { createWindow } from './helpers.js';

export const servicemanDashboard = {
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
      crewLead: {
        id: 'SRV-2210',
        name: 'Jordan Miles',
        role: 'Lead technician',
        assignments: 28,
        completed: 21,
        active: 7
      },
      crew: [
        { id: 'SRV-2210', name: 'Jordan Miles', role: 'Lead technician', assignments: 28, completed: 21, active: 7 },
        { id: 'SRV-1984', name: 'Eden Clarke', role: 'Field technician', assignments: 19, completed: 14, active: 5 },
        { id: 'SRV-1776', name: 'Kai Edwards', role: 'Field technician', assignments: 17, completed: 12, active: 5 },
        { id: 'SRV-1630', name: 'Morgan Shaw', role: 'Field technician', assignments: 15, completed: 10, active: 5 }
      ],
      region: 'Metro North',
      velocity: {
        travelMinutes: 26,
        previousTravelMinutes: 29,
        weekly: [
          { label: 'Week 1', accepted: 7, autoMatches: 3 },
          { label: 'Week 2', accepted: 6, autoMatches: 2 },
          { label: 'Week 3', accepted: 8, autoMatches: 4 },
          { label: 'Week 4', accepted: 7, autoMatches: 3 }
        ]
      },
      totals: {
        completed: 21,
        inProgress: 5,
        scheduled: 7,
        revenue: 18450,
        autoMatched: 9,
        adsSourced: 4
      },
      features: {
        ads: {
          available: true,
          level: 'view',
          label: 'Crew Ads Insights',
          features: ['campaigns', 'guardrails']
        }
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
};

export default servicemanDashboard;
