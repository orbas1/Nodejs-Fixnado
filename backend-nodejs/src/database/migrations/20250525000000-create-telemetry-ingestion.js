export async function up({ context: queryInterface, Sequelize }) {
  const jsonType = queryInterface.sequelize.getDialect() === 'postgres' ? Sequelize.JSONB : Sequelize.JSON;
  const severityEnumValues = ['debug', 'info', 'warning', 'error', 'fatal'];

  await queryInterface.createTable('client_error_events', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    reference: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    correlation_id: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    request_id: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    session_id: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    tenant_id: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    boundary_id: {
      type: Sequelize.STRING(128),
      allowNull: false
    },
    environment: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'development'
    },
    release_channel: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'development'
    },
    app_version: {
      type: Sequelize.STRING(32),
      allowNull: true
    },
    build_number: {
      type: Sequelize.STRING(32),
      allowNull: true
    },
    severity: {
      type: Sequelize.ENUM(...severityEnumValues),
      allowNull: false,
      defaultValue: 'error'
    },
    occurred_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    received_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    location: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    user_agent: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    ip_hash: {
      type: Sequelize.STRING(128),
      allowNull: true
    },
    error_name: {
      type: Sequelize.STRING(128),
      allowNull: false
    },
    error_message: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    error_stack: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    component_stack: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    fingerprint: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    metadata: {
      type: jsonType,
      allowNull: true
    },
    breadcrumbs: {
      type: jsonType,
      allowNull: true
    },
    tags: {
      type: jsonType,
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

  await queryInterface.addIndex('client_error_events', ['occurred_at']);
  await queryInterface.addIndex('client_error_events', ['severity']);
  await queryInterface.addIndex('client_error_events', ['boundary_id', 'severity']);
  await queryInterface.addIndex('client_error_events', ['fingerprint']);

  await queryInterface.createTable('mobile_crash_reports', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    reference: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    correlation_id: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    request_id: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    session_id: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    tenant_id: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    environment: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'development'
    },
    release_channel: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'development'
    },
    app_version: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: '0.0.0'
    },
    build_number: {
      type: Sequelize.STRING(32),
      allowNull: true
    },
    platform: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    platform_version: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    device_model: {
      type: Sequelize.STRING(96),
      allowNull: true
    },
    device_manufacturer: {
      type: Sequelize.STRING(96),
      allowNull: true
    },
    device_identifier_hash: {
      type: Sequelize.STRING(128),
      allowNull: true
    },
    locale: {
      type: Sequelize.STRING(32),
      allowNull: true
    },
    is_emulator: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_release_build: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    severity: {
      type: Sequelize.ENUM(...severityEnumValues),
      allowNull: false,
      defaultValue: 'fatal'
    },
    error_type: {
      type: Sequelize.STRING(128),
      allowNull: false
    },
    error_message: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    error_stack: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    fingerprint: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    occurred_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    received_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    metadata: {
      type: jsonType,
      allowNull: true
    },
    breadcrumbs: {
      type: jsonType,
      allowNull: true
    },
    threads: {
      type: jsonType,
      allowNull: true
    },
    tags: {
      type: jsonType,
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

  await queryInterface.addIndex('mobile_crash_reports', ['occurred_at']);
  await queryInterface.addIndex('mobile_crash_reports', ['environment']);
  await queryInterface.addIndex('mobile_crash_reports', ['fingerprint']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('mobile_crash_reports');
  await queryInterface.dropTable('client_error_events');

  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_mobile_crash_reports_severity";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_client_error_events_severity";');
  }
}
