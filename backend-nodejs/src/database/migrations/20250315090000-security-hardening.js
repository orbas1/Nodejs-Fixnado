export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('session_tokens', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    token_hash: {
      type: Sequelize.STRING(128),
      allowNull: false
    },
    context: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'web'
    },
    issued_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    last_rotated_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    revoked_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    ip_address: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    user_agent: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.addIndex('session_tokens', ['user_id']);
  await queryInterface.addIndex('session_tokens', ['token_hash']);
  await queryInterface.addIndex('session_tokens', ['expires_at']);

  await queryInterface.createTable('security_audit_events', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    actor_role: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    event_type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    action: {
      type: Sequelize.STRING(128),
      allowNull: false
    },
    subject_type: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    subject_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    status: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    ip_address: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    user_agent: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    request_id: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.addIndex('security_audit_events', ['event_type']);
  await queryInterface.addIndex('security_audit_events', ['action']);
  await queryInterface.addIndex('security_audit_events', ['created_at']);

  await queryInterface.createTable('consent_events', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    session_id: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    consent_type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    consent_version: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    granted: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },
    ip_address: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    user_agent: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    },
    recorded_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.addIndex('consent_events', ['session_id']);
  await queryInterface.addIndex('consent_events', ['consent_type']);
  await queryInterface.addIndex('consent_events', ['recorded_at']);

  await queryInterface.createTable('scam_detection_events', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    source_type: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    source_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    actor_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    actor_role: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    risk_score: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false
    },
    triggered: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },
    signals: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.addIndex('scam_detection_events', ['source_type']);
  await queryInterface.addIndex('scam_detection_events', ['risk_score']);
  await queryInterface.addIndex('scam_detection_events', ['created_at']);
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('scam_detection_events', ['created_at']);
  await queryInterface.removeIndex('scam_detection_events', ['risk_score']);
  await queryInterface.removeIndex('scam_detection_events', ['source_type']);
  await queryInterface.dropTable('scam_detection_events');

  await queryInterface.removeIndex('consent_events', ['recorded_at']);
  await queryInterface.removeIndex('consent_events', ['consent_type']);
  await queryInterface.removeIndex('consent_events', ['session_id']);
  await queryInterface.dropTable('consent_events');

  await queryInterface.removeIndex('security_audit_events', ['created_at']);
  await queryInterface.removeIndex('security_audit_events', ['action']);
  await queryInterface.removeIndex('security_audit_events', ['event_type']);
  await queryInterface.dropTable('security_audit_events');

  await queryInterface.removeIndex('session_tokens', ['expires_at']);
  await queryInterface.removeIndex('session_tokens', ['token_hash']);
  await queryInterface.removeIndex('session_tokens', ['user_id']);
  await queryInterface.dropTable('session_tokens');
}
