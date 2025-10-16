import { randomUUID } from 'node:crypto';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('OperationsQueueBoard', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    slug: {
      type: Sequelize.STRING(80),
      allowNull: false,
      unique: true
    },
    title: {
      type: Sequelize.STRING(140),
      allowNull: false
    },
    summary: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    owner: {
      type: Sequelize.STRING(140),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('operational', 'attention', 'delayed', 'blocked'),
      allowNull: false,
      defaultValue: 'operational'
    },
    priority: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    updated_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    archived_at: {
      type: Sequelize.DATE,
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
    },
    is_archived: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });

  await queryInterface.createTable('OperationsQueueUpdate', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    board_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'OperationsQueueBoard', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    headline: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    tone: {
      type: Sequelize.ENUM('info', 'success', 'warning', 'danger'),
      allowNull: false,
      defaultValue: 'info'
    },
    attachments: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    recorded_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    updated_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    position: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_deleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
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

  await queryInterface.addIndex('OperationsQueueBoard', ['is_archived', 'priority', 'updated_at'], {
    name: 'operations_queue_board_active_idx'
  });
  await queryInterface.addIndex('OperationsQueueUpdate', ['board_id', 'is_deleted', 'recorded_at'], {
    name: 'operations_queue_update_board_idx'
  });

  const seedBoards = [
    {
      id: randomUUID(),
      slug: 'provider-verification',
      title: 'Provider verification queue',
      summary:
        'Identity, compliance, and insurance checks awaiting manual review with automated expiry prioritisation.',
      owner: 'Compliance Ops',
      status: 'attention',
      priority: 1,
      metadata: {
        category: 'kyc',
        tags: ['KYB', 'Manual review'],
        watchers: ['compliance-duty@fixnado.example'],
        intakeChannels: ['Platform workflow', 'Email'],
        slaMinutes: 240,
        escalationContact: 'ops-lead@fixnado.example',
        playbookUrl: 'https://runbooks.fixnado.example/provider-verification',
        autoAlerts: true,
        notes: 'Ensure insurance certificates are refreshed every 6 months.'
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: randomUUID(),
      slug: 'dispute-resolution',
      title: 'Dispute resolution board',
      summary: 'Live escalations working through legal and support review cadences before customer updates.',
      owner: 'Support & Legal',
      status: 'operational',
      priority: 2,
      metadata: {
        category: 'disputes',
        tags: ['Finance', 'CX'],
        watchers: ['support-escalations@fixnado.example', 'legal-docket@fixnado.example'],
        intakeChannels: ['Ticket escalation', 'Live chat'],
        slaMinutes: 180,
        escalationContact: 'head-of-support@fixnado.example',
        playbookUrl: 'https://runbooks.fixnado.example/dispute-resolution',
        autoAlerts: true,
        notes: 'Weekly review every Monday with finance partners.'
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: randomUUID(),
      slug: 'insurance-badge',
      title: 'Insurance badge review',
      summary: 'Insured seller submissions queued for risk scoring and badge issuance.',
      owner: 'Risk & Legal',
      status: 'attention',
      priority: 3,
      metadata: {
        category: 'risk',
        tags: ['Insurance', 'Risk'],
        watchers: ['risk-analysts@fixnado.example'],
        intakeChannels: ['API ingestion'],
        slaMinutes: 360,
        escalationContact: 'risk-manager@fixnado.example',
        playbookUrl: 'https://runbooks.fixnado.example/insurance-badge',
        autoAlerts: false,
        notes: 'Escalate high-value sellers to underwriting partner.'
      },
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  if (seedBoards.length) {
    await queryInterface.bulkInsert('OperationsQueueBoard', seedBoards);

    const now = new Date();
    const updates = [
      {
        id: randomUUID(),
        board_id: seedBoards[0].id,
        headline: 'Documents awaiting proofing',
        body: '32 submissions require secondary verification. Automations have dispatched expiry reminders.',
        tone: 'warning',
        attachments: [],
        recorded_at: now,
        created_at: now,
        updated_at: now
      },
      {
        id: randomUUID(),
        board_id: seedBoards[1].id,
        headline: 'Escalations triaged',
        body: 'All stage-two escalations have legal observers assigned with response packs generated.',
        tone: 'success',
        attachments: [],
        recorded_at: now,
        created_at: now,
        updated_at: now
      },
      {
        id: randomUUID(),
        board_id: seedBoards[2].id,
        headline: 'AI scoring refresh',
        body: 'Risk analytics pipeline refreshed confidence scores for today\'s submissions.',
        tone: 'info',
        attachments: [],
        recorded_at: now,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('OperationsQueueUpdate', updates);
  }
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('OperationsQueueUpdate', 'operations_queue_update_board_idx');
  await queryInterface.removeIndex('OperationsQueueBoard', 'operations_queue_board_active_idx');
  await queryInterface.dropTable('OperationsQueueUpdate');
  await queryInterface.dropTable('OperationsQueueBoard');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_OperationsQueueBoard_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_OperationsQueueUpdate_tone"');
}
