export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('consent_events', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    subject_id: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    policy_key: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    policy_version: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    decision: {
      type: Sequelize.ENUM('granted', 'withdrawn'),
      allowNull: false
    },
    decision_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    region: {
      type: Sequelize.STRING(8),
      allowNull: false,
      defaultValue: 'GB'
    },
    channel: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'web'
    },
    ip_address: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    user_agent: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
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

  await queryInterface.addIndex('consent_events', ['subject_id', 'policy_key', 'created_at']);
  await queryInterface.addIndex('consent_events', ['user_id', 'policy_key', 'created_at']);
  await queryInterface.addIndex('consent_events', ['policy_key', 'policy_version']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('consent_events');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_consent_events_decision"');
}
