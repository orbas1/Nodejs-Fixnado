import { randomUUID } from 'node:crypto';

const TABLE = 'ProviderBookingSetting';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable(TABLE, {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'Company', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    dispatch_strategy: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'round_robin'
    },
    auto_assign_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    default_sla_hours: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 4
    },
    allow_customer_edits: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    intake_channels: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    escalation_contacts: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    dispatch_playbooks: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    notes_template: {
      type: Sequelize.TEXT,
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

  const [company] = await queryInterface.sequelize.query(
    'SELECT id FROM "Company" ORDER BY created_at ASC LIMIT 1',
    {
      type: Sequelize.QueryTypes.SELECT
    }
  );

  if (company?.id) {
    await queryInterface.bulkInsert(TABLE, [
      {
        id: randomUUID(),
        company_id: company.id,
        dispatch_strategy: 'round_robin',
        auto_assign_enabled: false,
        default_sla_hours: 6,
        allow_customer_edits: true,
        intake_channels: ['marketplace', 'ads', 'partner_referral'],
        escalation_contacts: [
          {
            id: randomUUID(),
            name: 'Provider Operations Desk',
            email: 'ops@fixnado-provider.test',
            phone: '+44 20 0000 0000',
            role: 'operations_manager'
          }
        ],
        dispatch_playbooks: [
          {
            id: randomUUID(),
            name: 'Standard emergency response',
            summary: 'Auto-page on-call crew, dispatch supervisor call, notify finance for escrow release checks.',
            version: 1
          }
        ],
        metadata: {
          notificationRecipients: ['ops@fixnado-provider.test'],
          assetLibrary: [],
          quickReplies: [
            'Crew assigned and en route with 45 minute ETA.',
            'Requesting client confirmation on revised scope.',
            'Job completed – uploading evidence to booking record.'
          ]
        },
        notes_template:
          'Confirm dispatch readiness, attach risk assessment, and brief assigned crew on client-specific guardrails.',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  }
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable(TABLE);
}
