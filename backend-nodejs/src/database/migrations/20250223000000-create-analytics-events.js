const DOMAIN_ENUM = 'enum_AnalyticsEvent_domain';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('AnalyticsEvent', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    domain: {
      type: Sequelize.ENUM('zones', 'bookings', 'rentals', 'disputes', 'ads', 'communications'),
      allowNull: false
    },
    event_name: {
      type: Sequelize.STRING(80),
      allowNull: false
    },
    schema_version: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    entity_type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    entity_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    entity_external_id: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    actor_type: {
      type: Sequelize.STRING(48),
      allowNull: true
    },
    actor_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    actor_label: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    tenant_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    source: {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'api'
    },
    channel: {
      type: Sequelize.STRING(48),
      allowNull: true
    },
    correlation_id: {
      type: Sequelize.UUID,
      allowNull: true
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
    metadata: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    }
  });

  await queryInterface.addIndex('AnalyticsEvent', ['domain', 'event_name', 'occurred_at'], {
    name: 'analytics_event_domain_event_occurred'
  });
  await queryInterface.addIndex('AnalyticsEvent', ['entity_type', 'entity_id'], {
    name: 'analytics_event_entity_lookup'
  });
  await queryInterface.addIndex('AnalyticsEvent', ['tenant_id', 'occurred_at'], {
    name: 'analytics_event_tenant_time'
  });
  await queryInterface.addIndex('AnalyticsEvent', ['correlation_id'], {
    name: 'analytics_event_correlation'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('AnalyticsEvent');

  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${DOMAIN_ENUM}" CASCADE;`);
  }
}
