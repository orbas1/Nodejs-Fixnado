import { AUDIT_EVENT_CATEGORIES, AUDIT_EVENT_STATUSES } from '../../models/adminAuditEvent.js';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('admin_audit_events', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    title: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    summary: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    category: {
      type: Sequelize.ENUM(...AUDIT_EVENT_CATEGORIES),
      allowNull: false,
      defaultValue: 'other'
    },
    status: {
      type: Sequelize.ENUM(...AUDIT_EVENT_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    owner_name: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    owner_team: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    occurred_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    due_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    attachments: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: true
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
    },
    updated_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
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

  await Promise.all([
    queryInterface.addIndex('admin_audit_events', ['occurred_at']),
    queryInterface.addIndex('admin_audit_events', ['category']),
    queryInterface.addIndex('admin_audit_events', ['status'])
  ]);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('admin_audit_events');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admin_audit_events_category"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admin_audit_events_status"');
}
