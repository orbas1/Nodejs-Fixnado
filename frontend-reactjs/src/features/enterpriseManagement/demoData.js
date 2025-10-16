import {
  DEFAULT_PLAYBOOK,
  DEFAULT_SITE,
  DEFAULT_STAKEHOLDER,
  DEFAULT_SUMMARY
} from './constants.js';

const now = new Date();
const lastQuarter = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

export const DEMO_ENTERPRISE_ACCOUNTS = [
  {
    id: 'demo-atlas',
    name: 'Atlas Retail Group',
    status: 'active',
    priority: 'critical',
    timezone: 'America/New_York',
    accountManager: 'Jamie Rivera',
    supportEmail: 'atlas-support@fixnado.com',
    billingEmail: 'ap@atlasretail.com',
    supportPhone: '+1 212 555 0198',
    logoUrl: 'https://images.ctfassets.net/demo/atlas-logo.svg',
    heroImageUrl: 'https://images.ctfassets.net/demo/atlas-campus.jpg',
    notes: 'Focus on Northeast rollouts and Q4 merchandising activations.',
    escalationNotes: 'Escalate to duty manager prior to CFO contact.',
    archivedAt: null,
    sites: [
      {
        ...DEFAULT_SITE,
        id: 'demo-atlas-bos',
        name: 'Boston Flagship',
        code: 'BOS-FG',
        status: 'operational',
        addressLine1: '799 Atlantic Ave',
        city: 'Boston',
        region: 'MA',
        postalCode: '02111',
        country: 'United States',
        timezone: 'America/New_York',
        contactName: 'Morgan Lee',
        contactEmail: 'morgan.lee@atlasretail.com',
        contactPhone: '+1 617 555 0133',
        capacityNotes: 'Peak dispatch: 28 technicians',
        mapUrl: 'https://maps.example.com/atlas-boston',
        imageUrl: 'https://images.ctfassets.net/demo/atlas-boston.jpg',
        notes: 'Priority facility for winter coverage.'
      },
      {
        ...DEFAULT_SITE,
        id: 'demo-atlas-newark',
        name: 'Newark Distribution Hub',
        code: 'EWR-DH',
        status: 'maintenance',
        addressLine1: '4100 Industrial Ave',
        city: 'Newark',
        region: 'NJ',
        postalCode: '07114',
        country: 'United States',
        timezone: 'America/New_York',
        contactName: 'Farah Singh',
        contactEmail: 'farah.singh@atlasretail.com',
        contactPhone: '+1 973 555 0109',
        capacityNotes: 'Warehouse automation upgrade in progress.',
        notes: 'Coordinate with robotics vendor before site access.'
      }
    ],
    stakeholders: [
      {
        ...DEFAULT_STAKEHOLDER,
        id: 'demo-atlas-ops',
        role: 'Director of Operations',
        name: 'Morgan Lee',
        email: 'morgan.lee@atlasretail.com',
        phone: '+1 617 555 0133',
        escalationLevel: 'L2',
        isPrimary: true,
        notes: 'Primary contact for surge staffing and holiday execution.'
      },
      {
        ...DEFAULT_STAKEHOLDER,
        id: 'demo-atlas-finance',
        role: 'VP Finance',
        name: 'Dev Patel',
        email: 'dev.patel@atlasretail.com',
        phone: '+1 212 555 0175',
        escalationLevel: 'L3',
        notes: 'Approves invoice adjustments over $25k.'
      }
    ],
    playbooks: [
      {
        ...DEFAULT_PLAYBOOK,
        id: 'demo-atlas-storm',
        name: 'Winter Storm Response',
        status: 'approved',
        owner: 'Morgan Lee',
        category: 'Safety',
        documentUrl: 'https://docs.fixnado.com/playbooks/atlas-winter-storm.pdf',
        summary: 'Defines pre-storm staffing, fleet readiness, and comms ladder.',
        lastReviewedAt: now.toISOString()
      },
      {
        ...DEFAULT_PLAYBOOK,
        id: 'demo-atlas-rollout',
        name: 'Q3 Merchandising Launch',
        status: 'in_review',
        owner: 'Dev Patel',
        category: 'Merchandising',
        summary: 'Pacing tracker for seasonal floor sets and fixture updates.',
        lastReviewedAt: lastQuarter.toISOString()
      }
    ]
  },
  {
    id: 'demo-orbit',
    name: 'Orbit Hospitality',
    status: 'paused',
    priority: 'priority',
    timezone: 'Europe/London',
    accountManager: 'Sasha Bennett',
    supportEmail: 'orbit-support@fixnado.com',
    billingEmail: 'finance@orbitsuites.co.uk',
    supportPhone: '+44 20 7946 0990',
    notes: 'Temporarily paused while migrating to new PMS platform.',
    escalationNotes: 'Route escalations through Orbit NOC prior to Fixnado staff.',
    archivedAt: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString(),
    sites: [
      {
        ...DEFAULT_SITE,
        id: 'demo-orbit-lon',
        name: 'London Canary Wharf',
        code: 'LON-CW',
        status: 'offline',
        city: 'London',
        region: 'Greater London',
        country: 'United Kingdom',
        timezone: 'Europe/London',
        contactName: 'Priya Kapoor',
        contactEmail: 'priya.kapoor@orbitsuites.co.uk'
      }
    ],
    stakeholders: [
      {
        ...DEFAULT_STAKEHOLDER,
        id: 'demo-orbit-noc',
        role: 'Network Operations Lead',
        name: 'Priya Kapoor',
        email: 'noc@orbitsuites.co.uk',
        isPrimary: true,
        escalationLevel: 'L1'
      }
    ],
    playbooks: [
      {
        ...DEFAULT_PLAYBOOK,
        id: 'demo-orbit-reopen',
        name: 'Hotel Reopening Checklist',
        status: 'draft',
        owner: 'Priya Kapoor',
        category: 'Operations',
        summary: 'Step-by-step runbook for property reopenings following refurbishment.'
      }
    ]
  }
];

export function getDemoSummary(accounts = DEMO_ENTERPRISE_ACCOUNTS) {
  const summary = { ...DEFAULT_SUMMARY };
  accounts.forEach((account) => {
    summary.total += 1;
    if (account.status === 'active') summary.active += 1;
    if (account.status === 'pilot') summary.pilot += 1;
    if (account.priority === 'critical') summary.critical += 1;
    if (account.archivedAt) summary.archived += 1;
    summary.sites += account.sites?.length ?? 0;
    summary.stakeholders += account.stakeholders?.length ?? 0;
    summary.playbooks += account.playbooks?.length ?? 0;
  });
  return summary;
}
