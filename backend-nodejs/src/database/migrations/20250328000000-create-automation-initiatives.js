import { randomUUID } from 'node:crypto';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('AutomationInitiative', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    summary: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'ideation'
    },
    stage: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'backlog'
    },
    category: {
      type: Sequelize.STRING(48),
      allowNull: true
    },
    automation_type: {
      type: Sequelize.STRING(48),
      allowNull: true
    },
    owner: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    sponsor: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    squad: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    readiness_score: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    priority: {
      type: Sequelize.STRING(16),
      allowNull: false,
      defaultValue: 'next'
    },
    risk_level: {
      type: Sequelize.STRING(16),
      allowNull: false,
      defaultValue: 'medium'
    },
    target_metric: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    baseline_metric: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    forecast_metric: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    estimated_savings: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    savings_currency: {
      type: Sequelize.STRING(3),
      allowNull: true
    },
    expected_launch_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    next_milestone_on: {
      type: Sequelize.DATE,
      allowNull: true
    },
    last_reviewed_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    allowed_roles: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    dependencies: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    blockers: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    attachments: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    images: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    updated_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    archived_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    archived_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.addIndex('AutomationInitiative', ['status']);
  await queryInterface.addIndex('AutomationInitiative', ['priority']);
  await queryInterface.addIndex('AutomationInitiative', ['archived_at']);

  // Seed a starter initiative so dashboards have content on fresh environments.
  await queryInterface.bulkInsert('AutomationInitiative', [
    {
      id: randomUUID(),
      name: 'Document verification autopilot',
      summary:
        'Automate underwriting document checks for insured sellers and auto-approve low-risk packages with human-in-the-loop guardrails.',
      status: 'pilot',
      stage: 'delivery',
      category: 'Compliance automation',
      automation_type: 'workflow',
      owner: 'Automation PMO',
      sponsor: 'Chief Operations Officer',
      squad: 'Automation Studio A',
      readiness_score: 68,
      priority: 'now',
      risk_level: 'medium',
      target_metric: 'Reduce manual checks per seller',
      baseline_metric: '45 minutes per application',
      forecast_metric: '12 minutes per application',
      estimated_savings: 42000,
      savings_currency: 'GBP',
      expected_launch_at: new Date(),
      next_milestone_on: new Date(),
      last_reviewed_at: new Date(),
      notes: 'Pilot ready with 3 launch partners. Legal sign-off scheduled.',
      allowed_roles: ['admin', 'operations'],
      dependencies: [
        { label: 'Fraud rules engine upgrade', status: 'on_track' },
        { label: 'Webhook reliability improvements', status: 'at_risk' }
      ],
      blockers: [
        { label: 'Awaiting DPIA approval', owner: 'Legal', status: 'in_progress' }
      ],
      attachments: [
        { label: 'Pilot plan', url: 'https://fixnado.com/files/automation-pilot-plan.pdf' }
      ],
      images: [
        { label: 'Flow diagram', url: 'https://fixnado.com/images/automation-flow.png' }
      ],
      metadata: { readinessNotes: 'QA scripts prepared, awaiting staging data refresh.' },
      created_by: null,
      updated_by: null,
      archived_at: null,
      archived_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('AutomationInitiative', ['status']);
  await queryInterface.removeIndex('AutomationInitiative', ['priority']);
  await queryInterface.removeIndex('AutomationInitiative', ['archived_at']);
  await queryInterface.dropTable('AutomationInitiative');
}
