import { randomUUID } from 'node:crypto';

const TASK_STATUS = ['open', 'in_progress', 'waiting_external', 'resolved', 'dismissed'];
const TASK_PRIORITY = ['low', 'medium', 'high', 'critical'];
const TASK_CHANNEL = ['concierge', 'email', 'phone', 'slack', 'self_service'];

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('AccountSupportTask', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Company', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    title: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    summary: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM(...TASK_STATUS),
      allowNull: false,
      defaultValue: 'open'
    },
    priority: {
      type: Sequelize.ENUM(...TASK_PRIORITY),
      allowNull: false,
      defaultValue: 'medium'
    },
    channel: {
      type: Sequelize.ENUM(...TASK_CHANNEL),
      allowNull: false,
      defaultValue: 'concierge'
    },
    due_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    assigned_to: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    assigned_to_role: {
      type: Sequelize.STRING(80),
      allowNull: true
    },
    created_by: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    created_by_role: {
      type: Sequelize.STRING(80),
      allowNull: true
    },
    updated_by: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    resolved_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    conversation_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Conversation', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
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

  await queryInterface.addIndex('AccountSupportTask', ['company_id']);
  await queryInterface.addIndex('AccountSupportTask', ['user_id']);
  await queryInterface.addIndex('AccountSupportTask', ['status']);
  await queryInterface.addIndex('AccountSupportTask', ['due_at']);

  await queryInterface.createTable('AccountSupportTaskUpdate', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    task_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'AccountSupportTask', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM(...TASK_STATUS),
      allowNull: true
    },
    attachments: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    created_by: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    created_by_role: {
      type: Sequelize.STRING(80),
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

  await queryInterface.addIndex('AccountSupportTaskUpdate', ['task_id']);

  // Seed a default concierge reminder so dashboards have baseline data in non-prod envs.
  const now = new Date();
  await queryInterface.bulkInsert('AccountSupportTask', [
    {
      id: randomUUID(),
      title: 'Provide weekend concierge coverage plan',
      summary: 'Upload your staffing rota or let Fixnado concierge know who to reach in emergencies.',
      status: 'open',
      priority: 'high',
      channel: 'concierge',
      due_at: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      assigned_to: 'Operations lead',
      assigned_to_role: 'customer_admin',
      created_by: 'Fixnado concierge',
      created_by_role: 'support',
      metadata: { seeded: true },
      created_at: now,
      updated_at: now
    }
  ]);
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.bulkDelete('AccountSupportTaskUpdate', {});
  await queryInterface.bulkDelete('AccountSupportTask', {});

  await queryInterface.dropTable('AccountSupportTaskUpdate');
  await queryInterface.dropTable('AccountSupportTask');

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_AccountSupportTask_status";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_AccountSupportTask_priority";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_AccountSupportTask_channel";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_AccountSupportTaskUpdate_status";');
}
