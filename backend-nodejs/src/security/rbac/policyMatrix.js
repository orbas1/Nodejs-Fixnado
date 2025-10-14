const RBAC_MATRIX = {
  anonymous: {
    grants: [],
    metadata: {
      description: 'Unauthenticated visitor limited to consent capture and public catalogue.'
    }
  },
  user: {
    inherits: ['anonymous'],
    grants: [
      'catalogue.read',
      'catalogue.reviews.read',
      'booking.create',
      'booking.view.self',
      'booking.cancel.self',
      'messaging.thread.view',
      'messaging.thread.reply',
      'consent.create',
      'consent.view.self',
      'scam.report',
      'profile.update.self'
    ],
    metadata: {
      description: 'Consumer accounts can browse, book, and manage their own data.'
    }
  },
  servicemen: {
    inherits: ['user'],
    grants: [
      'jobs.feed.view',
      'jobs.bid.create',
      'jobs.bid.view',
      'jobs.assignment.manage',
      'inventory.view.assigned',
      'finance.earnings.view.self',
      'availability.calendar.manage',
      'messaging.ai.assist',
      'scam.alert.receive'
    ],
    metadata: {
      description: 'Verified servicemen can participate in live jobs and manage assignments.'
    }
  },
  company: {
    inherits: ['servicemen'],
    grants: [
      'inventory.manage',
      'inventory.analytics.view',
      'finance.earnings.view',
      'finance.payout.manage',
      'campaigns.manage',
      'dashboard.company.view',
      'dashboard.company.export',
      'storefront.manage',
      'team.members.manage',
      'compliance.documents.upload',
      'consent.view.org',
      'consent.capture',
      'scam.alert.resolve'
    ],
    metadata: {
      description: 'Company/provider operators orchestrate inventory, finance, and compliance for their organisation.'
    }
  },
  provider_admin: {
    inherits: ['company'],
    grants: [
      'dashboard.enterprise.view',
      'dashboard.enterprise.export',
      'finance.audit.view',
      'finance.dispute.manage',
      'campaigns.approve',
      'integrations.configure',
      'integrations.audit',
      'team.roles.manage',
      'consent.audit.org'
    ],
    metadata: {
      description: 'Provider administrators hold oversight responsibilities across finance, integrations, and team RBAC.'
    }
  },
  operations_admin: {
    inherits: ['provider_admin'],
    grants: [
      'zones.manage',
      'zones.analytics.export',
      'security.policies.manage',
      'security.sessions.revoke',
      'security.audit.read',
      'scam.review',
      'messaging.monitor',
      'consent.audit.global',
      'compliance.requests.manage'
    ],
    metadata: {
      description: 'Operations admins enforce marketplace integrity and cross-region compliance.'
    }
  },
  admin: {
    inherits: ['operations_admin'],
    grants: [
      'admin.panel.access',
      'admin.feature-toggles.manage',
      'admin.users.impersonate',
      'security.audit.export',
      'integrations.keys.manage',
      'observability.manage',
      'governance.docs.publish',
      '*'
    ],
    metadata: {
      description: 'Platform super administrators with the authority to manage global configuration and observability.'
    }
  }
};

export default RBAC_MATRIX;
