export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('security_audit_events', {
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
    actor_role: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    actor_persona: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    resource: {
      type: Sequelize.STRING(128),
      allowNull: false
    },
    action: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    decision: {
      type: Sequelize.ENUM('allow', 'deny'),
      allowNull: false
    },
    reason: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    ip_address: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    user_agent: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    correlation_id: {
      type: Sequelize.STRING(64),
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
    }
  });

  await queryInterface.addIndex('security_audit_events', ['created_at']);
  await queryInterface.addIndex('security_audit_events', ['user_id', 'created_at']);
  await queryInterface.addIndex('security_audit_events', ['resource', 'action', 'created_at'], {
    name: 'security_audit_events_resource_action_created_at'
  });

  await queryInterface.createTable('user_sessions', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    refresh_token_hash: {
      type: Sequelize.STRING(128),
      allowNull: false,
      unique: true
    },
    session_fingerprint: {
      type: Sequelize.STRING(128),
      allowNull: true
    },
    client_type: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'web'
    },
    client_version: {
      type: Sequelize.STRING(32),
      allowNull: true
    },
    device_label: {
      type: Sequelize.STRING(120),
      allowNull: true
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
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    last_used_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    revoked_at: {
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
    }
  });

  await queryInterface.addIndex('user_sessions', ['user_id', 'client_type']);
  await queryInterface.addIndex('user_sessions', ['session_fingerprint']);
  await queryInterface.addIndex('user_sessions', ['expires_at']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('user_sessions');
  await queryInterface.dropTable('security_audit_events');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_security_audit_events_decision"');
}
